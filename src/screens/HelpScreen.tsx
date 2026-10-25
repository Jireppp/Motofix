import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Linking
} from 'react-native';
import { PRIVACY_POLICY_URL } from '../constants/legal';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, LABEL_STYLE, FONT_FAMILY, SHADOWS } from '../constants/theme';
import { ChevronLeft, Info, AlertTriangle, CheckCircle, User, LogOut, Trash2, Bell, BellOff } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';
import { toast } from '../contexts/ToastContext';
import { haptic } from '../utils/haptics';
import ConfirmModal from '../components/ConfirmModal';

// Hallmark - genre: modern-minimal - macrostructure: Long Document - design-system: none - designed-as-app
// Structural fingerprint: Hanging heading, Single column, Hairline dividers, Typographic-only buttons

interface HelpScreenProps {
  onGoBack: () => void;
}

const STEPS = [
  { step: 1, title: 'REGISTER VEHICLE', description: 'Add your motorcycle in the GARAGE tab by entering the model name and registration plate.' },
  { step: 2, title: 'TRACK SPARE PARTS', description: 'Open the vehicle dashboard and select which components to track with custom service intervals.' },
  { step: 3, title: 'UPDATE ODOMETER', description: 'Log your current odometer reading regularly so remaining distance forecasts stay accurate.' },
  { step: 4, title: 'LOG REPLACEMENTS', description: 'Whenever a part is serviced or swapped, record a replacement log to reset its service cycle.' },
];

export default function HelpScreen({ onGoBack }: HelpScreenProps) {
  const { colors: COLORS } = useTheme();
  const styles = getStyles(COLORS);

  const [loadingAuth, setLoadingAuth] = useState(false);
  const [deletingData, setDeletingData] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isGuest, setIsGuest] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState(true);

  useEffect(() => {
    checkUser();
    loadReminderPref();
  }, []);

  const loadReminderPref = async () => {
    const enabled = await notificationService.isReminderEnabled();
    setReminderEnabled(enabled);
  };

  const handleToggleReminder = async () => {
    haptic.selection();
    const nextState = !reminderEnabled;
    setReminderEnabled(nextState);
    const scheduled = await notificationService.setReminderEnabled(nextState);
    if (nextState && !scheduled) {
      toast.warning('Enable notification permission for FXON in your phone settings to activate the weekly reminder.');
    }
  };

  const handleOpenPrivacyPolicy = async () => {
    haptic.light();
    try {
      await Linking.openURL(PRIVACY_POLICY_URL);
    } catch {
      toast.error('Could not open the Privacy Policy. Check your browser or connection.');
    }
  };

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const isAnon = Boolean(session.user.is_anonymous);
      const providers = session.user.app_metadata?.providers || [];
      const hasGoogle = providers.includes('google');
      
      if (isAnon || !hasGoogle) {
        setIsGuest(true);
        setUserEmail(null);
      } else {
        setIsGuest(false);
        const googleEmail = session.user.user_metadata?.email || session.user.email;
        setUserEmail(googleEmail);
      }
    } else {
      setIsGuest(true);
      setUserEmail(null);
    }
  };

  const handleGoogleLogin = async () => {
    haptic.medium();
    setLoadingAuth(true);
    try {
      const userInfo = await authService.signInWithGoogle();
      if (userInfo) {
        setIsGuest(false);
        haptic.success();
        checkUser();
      }
    } catch (error: any) {
      haptic.warning();
      toast.error(error.message || 'Could not sign in with Google');
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleLogout = async () => {
    haptic.warning();
    setLoadingAuth(true);
    try {
      await authService.signOut();
      await authService.signInAsGuest();
      haptic.success();
      checkUser();
      onGoBack();
    } catch (error: any) {
      haptic.warning();
      toast.error(error.message || 'Could not log out');
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleDeleteAccountAndData = () => {
    haptic.warning();
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAccountAndData = async () => {
    setShowDeleteConfirm(false);
    setDeletingData(true);
    try {
      await notificationService.cancelWeeklyReminder();
      await authService.deleteAccountAndData();
      await authService.signInAsGuest();
      haptic.success();
      checkUser();
      toast.info(
        isGuest
          ? 'All guest garage data has been permanently removed.'
          : 'Your account and all associated telemetry data have been erased.'
      );
      onGoBack();
    } catch (error: any) {
      haptic.warning();
      toast.error(error.message || 'Could not complete data deletion.');
    } finally {
      setDeletingData(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={() => {
            haptic.light();
            onGoBack();
          }}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Text style={styles.navLink}>← Back to Garage</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
        
        {/* Document Header */}
        <View style={styles.docHeader}>
          <Text style={styles.docTitle}>OPERATING MANUAL</Text>
          <Text style={styles.docMeta}>FXON</Text>
        </View>

        {/* Prose Section: Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>I. WORKFLOW</Text>
          <View style={styles.proseBlock}>
            {STEPS.map((step) => (
              <View key={step.step} style={styles.paragraph}>
                <Text style={styles.pLead}>{step.step}. {step.title}</Text>
                <Text style={styles.pText}>{step.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Prose Section: Notices & Weekly Reminder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>II. NOTICES & REMINDERS</Text>
          <View style={styles.proseBlock}>
            <View style={styles.callout}>
              <View style={styles.calloutIcon}>
                <AlertTriangle size={16} color={COLORS.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.calloutTitle}>Odometer Sync Required</Text>
                <Text style={styles.calloutText}>
                  Before executing a LOG REPLACEMENT action, ensure the global vehicle ODOMETER reflects the current physical dashboard reading. Failure to sync will result in skewed projection intervals.
                </Text>
              </View>
            </View>

            <View style={[styles.callout, { marginTop: 24, borderLeftColor: COLORS.border }]}>
              <View style={styles.calloutIcon}>
                <Info size={16} color={COLORS.textTertiary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.calloutTitle}>Thresholds</Text>
                <Text style={styles.calloutText}>
                  System flags shift to WARNING status when threshold approaches ≤ 100km. OVERDUE status is triggered at sub-zero ranges. Logbook persists all historical actions securely.
                </Text>
              </View>
            </View>

            <View style={[styles.callout, { marginTop: 24, borderLeftColor: reminderEnabled ? COLORS.primary : COLORS.border }]}>
              <View style={styles.calloutIcon}>
                {reminderEnabled ? (
                  <Bell size={16} color={COLORS.primary} />
                ) : (
                  <BellOff size={16} color={COLORS.textTertiary} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.calloutTitle}>
                  Weekly Odometer Reminder ({reminderEnabled ? 'ACTIVE' : 'OFF'})
                </Text>
                <Text style={styles.calloutText}>
                  Dispatches a local reminder notification if your motorcycle odometer has not been updated for 7 consecutive days.
                </Text>
                <TouchableOpacity
                  onPress={handleToggleReminder}
                  style={styles.reminderToggleBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.reminderToggleText}>
                    {reminderEnabled ? 'Disable 7-Day Reminder' : 'Enable 7-Day Reminder'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Prose Section: Identity & Data Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>III. IDENTITY & DATA PRIVACY</Text>
          <View style={styles.proseBlock}>
            <TouchableOpacity
              onPress={handleOpenPrivacyPolicy}
              style={styles.privacyLinkBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.privacyLinkText}>Read Privacy Policy ↗</Text>
            </TouchableOpacity>
            {isGuest ? (
              <View>
                <Text style={styles.pText}>
                  The system is currently operating in local persistence mode (GUEST). To synchronize telemetry across fleet terminals and prevent data volatility, bind a permanent Google credential.
                </Text>
                <TouchableOpacity
                  onPress={handleGoogleLogin}
                  disabled={loadingAuth || deletingData}
                  style={styles.primaryAuthBtn}
                  activeOpacity={0.8}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {loadingAuth ? (
                    <ActivityIndicator color={COLORS.bg} size="small" />
                  ) : (
                    <>
                      <User size={16} color={COLORS.bg} strokeWidth={2} />
                      <Text style={styles.primaryAuthBtnText}>Authenticate with Google</Text>
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.dangerZoneDivider} />
                <Text style={styles.dangerZoneHint}>
                  Want to start fresh? You can permanently wipe all vehicles and service records saved in this guest session.
                </Text>
                <TouchableOpacity
                  onPress={handleDeleteAccountAndData}
                  disabled={loadingAuth || deletingData}
                  style={styles.deleteDataBtn}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {deletingData ? (
                    <ActivityIndicator color={COLORS.danger} size="small" />
                  ) : (
                    <>
                      <Trash2 size={14} color={COLORS.danger} strokeWidth={2} />
                      <Text style={styles.deleteDataBtnText}>Wipe Guest Garage Data</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View style={styles.identityBound}>
                  <View style={styles.calloutIcon}>
                    <CheckCircle size={16} color={COLORS.success} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.calloutTitle}>Credential Bound</Text>
                    <Text style={styles.calloutText}>{userEmail}</Text>
                  </View>
                </View>

                <View style={styles.authActionsRow}>
                  <TouchableOpacity
                    onPress={handleLogout}
                    disabled={loadingAuth || deletingData}
                    style={styles.signoutBtn}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {loadingAuth ? (
                      <ActivityIndicator color={COLORS.textPrimary} size="small" />
                    ) : (
                      <>
                        <LogOut size={15} color={COLORS.textPrimary} strokeWidth={2} />
                        <Text style={styles.signoutBtnText}>Sign Out</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.dangerZoneDivider} />
                <Text style={styles.dangerZoneHint}>
                  Account & Data Deletion: Permanently delete your account, all registered motorcycles, and maintenance history from FXON servers.
                </Text>
                <TouchableOpacity
                  onPress={handleDeleteAccountAndData}
                  disabled={loadingAuth || deletingData}
                  style={styles.deleteDataBtn}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {deletingData ? (
                    <ActivityIndicator color={COLORS.danger} size="small" />
                  ) : (
                    <>
                      <Trash2 size={14} color={COLORS.danger} strokeWidth={2} />
                      <Text style={styles.deleteDataBtnText}>Delete Account & All Data</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

      </ScrollView>

      <ConfirmModal
        visible={showDeleteConfirm}
        title={isGuest ? 'Wipe Guest Garage Data?' : 'Delete Account & All Data?'}
        message={
          isGuest
            ? 'This will permanently delete all motorcycles, tracked spareparts, and service history stored in this Guest session. This action cannot be undone.'
            : 'This will permanently erase all your registered motorcycles, tracked spareparts, and service logs from FXON servers, and disconnect your Google account. This action cannot be undone.'
        }
        confirmLabel={isGuest ? 'Wipe Data' : 'Delete Permanently'}
        onConfirm={confirmDeleteAccountAndData}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </View>
  );
}

const getStyles = (COLORS: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  topNav: { 
    flexDirection: 'row', alignItems: 'center', 
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.border 
  },
  navLink: { fontFamily: FONT_FAMILY.mono, fontSize: 13, color: COLORS.textSecondary },

  scrollBody: { flex: 1 },
  scrollContent: { paddingBottom: 80 },

  docHeader: {
    paddingHorizontal: 24, paddingTop: 48, paddingBottom: 48,
  },
  docTitle: { fontFamily: FONT_FAMILY.display, fontSize: 32, fontWeight: '400', color: COLORS.textPrimary, letterSpacing: -0.5 },
  docMeta: { fontFamily: FONT_FAMILY.mono, fontSize: 11, color: COLORS.textTertiary, letterSpacing: 1, marginTop: 8 },

  section: {
    paddingHorizontal: 24, paddingBottom: 48,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY.mono, fontSize: 12, color: COLORS.textSecondary, letterSpacing: 1,
    marginBottom: 24, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: COLORS.borderStrong
  },
  proseBlock: {
    paddingRight: 16,
  },
  
  paragraph: { marginBottom: 24 },
  pLead: { fontFamily: FONT_FAMILY.display, fontSize: 16, color: COLORS.textPrimary, marginBottom: 8 },
  pText: { fontFamily: FONT_FAMILY.body, fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },

  callout: {
    flexDirection: 'row', borderLeftWidth: 1, borderLeftColor: COLORS.danger, paddingLeft: 16,
  },
  calloutIcon: { width: 24 },
  calloutTitle: { fontFamily: FONT_FAMILY.mono, fontSize: 12, color: COLORS.textPrimary, marginBottom: 4, letterSpacing: 0.5 },
  calloutText: { fontFamily: FONT_FAMILY.body, fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },

  reminderToggleBtn: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.surface,
    alignSelf: 'flex-start',
  },
  reminderToggleText: {
    fontFamily: FONT_FAMILY.mono,
    fontSize: 11,
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },

  primaryAuthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.textPrimary,
    alignSelf: 'flex-start',
  },
  primaryAuthBtnText: {
    fontFamily: FONT_FAMILY.mono,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.bg,
    letterSpacing: 0.5,
  },

  authActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
  },

  signoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
  },
  signoutBtnText: {
    fontFamily: FONT_FAMILY.mono,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },

  dangerZoneDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginTop: 28,
    marginBottom: 16,
  },
  dangerZoneHint: {
    fontFamily: FONT_FAMILY.body,
    fontSize: 12,
    color: COLORS.textTertiary,
    lineHeight: 18,
    marginBottom: 12,
  },
  deleteDataBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.danger + '60',
    backgroundColor: COLORS.dangerContainer + '25',
    alignSelf: 'flex-start',
  },
  deleteDataBtnText: {
    fontFamily: FONT_FAMILY.mono,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.danger,
    letterSpacing: 0.5,
  },

  privacyLinkBtn: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  privacyLinkText: {
    fontFamily: FONT_FAMILY.mono,
    fontSize: 12,
    color: COLORS.primary,
    letterSpacing: 0.5,
    textDecorationLine: 'underline',
  },

  identityBound: {
    flexDirection: 'row', borderLeftWidth: 1, borderLeftColor: COLORS.success, paddingLeft: 16,
  }
});
