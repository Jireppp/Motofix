import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const WEEKLY_REMINDER_ID = 'fxon-weekly-odo-reminder';
const LEGACY_REMINDER_ID = 'motofix-weekly-odo-reminder';
const REMINDER_ENABLED_KEY = 'fxon_weekly_reminder_enabled';
const ANDROID_CHANNEL_ID = 'fxon-telemetry-reminders';

/** 7 days in seconds (7 * 24 * 60 * 60 = 604,800s) */
export const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;

// Configure how notifications appear when the app is in the foreground
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch {
  // Ignore in unsupported environments (e.g., web)
}

export const notificationService = {
  /**
   * Ensure Android notification channel is registered.
   */
  async ensureChannel(): Promise<void> {
    if (Platform.OS !== 'android') return;
    try {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: 'FXON — Odometer & Service Reminders',
        description: 'Weekly FXON reminder to update your motorcycle odometer reading',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 200, 250],
        lightColor: '#1449FF',
      });
    } catch {
      // Safe fallback
    }
  },

  /**
   * Request notification permissions from the OS.
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    try {
      await this.ensureChannel();
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch {
      return false;
    }
  },

  /**
   * Check whether the user has enabled weekly odometer reminders (defaults to true).
   */
  async isReminderEnabled(): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem(REMINDER_ENABLED_KEY);
      if (val === null) return true; // Enabled by default
      return val === 'true';
    } catch {
      return true;
    }
  },

  /**
   * Enable or disable the 7-day inactivity reminder.
   */
  async setReminderEnabled(enabled: boolean, vehicleName?: string): Promise<boolean> {
    try {
      await AsyncStorage.setItem(REMINDER_ENABLED_KEY, enabled ? 'true' : 'false');
      if (enabled) {
        return await this.resetWeeklyInactivityReminder(vehicleName, true);
      } else {
        await this.cancelWeeklyReminder();
        return false;
      }
    } catch {
      return false;
    }
  },

  /**
   * Cancel the scheduled weekly odometer reminder.
   */
  async cancelWeeklyReminder(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Notifications.cancelScheduledNotificationAsync(WEEKLY_REMINDER_ID);
      await Notifications.cancelScheduledNotificationAsync(LEGACY_REMINDER_ID);
    } catch {
      // Ignore if not scheduled
    }
  },

  /**
   * Reset the 7-day countdown timer.
   * Call this whenever the user opens the app or updates their vehicle's odometer.
   * If the user does not open or update the app for 7 full days, the reminder fires.
   */
  async resetWeeklyInactivityReminder(
    vehicleName?: string,
    promptPermissionIfNeeded: boolean = false
  ): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    try {
      const enabled = await this.isReminderEnabled();
      if (!enabled) return false;

      await this.ensureChannel();

      const { status } = await Notifications.getPermissionsAsync();
      let hasPermission = status === 'granted';

      if (!hasPermission && promptPermissionIfNeeded) {
        hasPermission = await this.requestPermissions();
      }

      if (!hasPermission) return false;

      // Cancel previous countdown so the 7-day timer restarts from right now
      await this.cancelWeeklyReminder();

      const cleanVehicle = vehicleName?.trim();
      const title = 'Keep Riding, Keep Your Odometer Updated';
      const body = cleanVehicle
        ? `It has been 7 days since the last odometer update for ${cleanVehicle}. Update it now so FXON can warn you before your oil or brake pads run past their limit!`
        : 'It has been 7 days since your last odometer update. Update it now so FXON can warn you before your oil or brake pads run past their limit!';

      await Notifications.scheduleNotificationAsync({
        identifier: WEEKLY_REMINDER_ID,
        content: {
          title,
          body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          color: '#1449FF',
          data: { type: 'WEEKLY_ODO_REMINDER' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: SEVEN_DAYS_SECONDS,
          repeats: true,
          channelId: Platform.OS === 'android' ? ANDROID_CHANNEL_ID : undefined,
        },
      });

      return true;
    } catch {
      return false;
    }
  },
};
