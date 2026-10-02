import { Vibration } from 'react-native';

// Optional dynamic import of expo-haptics for universal safety
let ExpoHaptics: any = null;
try {
  ExpoHaptics = require('expo-haptics');
} catch {
  // Expo Haptics not installed or not supported in this runtime
}

export const haptic = {
  /**
   * Light impact for minor selections and taps
   */
  light: () => {
    try {
      if (ExpoHaptics?.impactAsync && ExpoHaptics?.ImpactFeedbackStyle?.Light) {
        ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
      } else {
        Vibration.vibrate(10);
      }
    } catch {
      // Safe fallback, never throw
    }
  },

  /**
   * Medium impact for actions like opening modals or toggles
   */
  medium: () => {
    try {
      if (ExpoHaptics?.impactAsync && ExpoHaptics?.ImpactFeedbackStyle?.Medium) {
        ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
      } else {
        Vibration.vibrate(20);
      }
    } catch {
      // Safe fallback
    }
  },

  /**
   * Selection tick for tab switching or segmented controls
   */
  selection: () => {
    try {
      if (ExpoHaptics?.selectionAsync) {
        ExpoHaptics.selectionAsync();
      } else {
        Vibration.vibrate(8);
      }
    } catch {
      // Safe fallback
    }
  },

  /**
   * Success notification pulse when an action succeeds (e.g. ODO saved, part replaced)
   */
  success: () => {
    try {
      if (ExpoHaptics?.notificationAsync && ExpoHaptics?.NotificationFeedbackType?.Success) {
        ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success);
      } else {
        Vibration.vibrate([0, 15, 40, 15]);
      }
    } catch {
      // Safe fallback
    }
  },

  /**
   * Warning / destructive pulse for delete or critical alerts
   */
  warning: () => {
    try {
      if (ExpoHaptics?.notificationAsync && ExpoHaptics?.NotificationFeedbackType?.Warning) {
        ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Warning);
      } else {
        Vibration.vibrate([0, 25, 50, 25]);
      }
    } catch {
      // Safe fallback
    }
  },
};
