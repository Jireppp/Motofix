import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, LABEL_STYLE, FONT_FAMILY, SHADOWS } from '../constants/theme';
import { ChevronLeft, Info, AlertTriangle, CheckCircle, User, Mail, LogOut } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { authService } from '../services/authService';
import { haptic } from '../utils/haptics';

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
  const [isGuest, setIsGuest] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const providers = session.user.app_metadata?.providers || [];
      const hasGoogle = providers.includes('google');
      
      if (!hasGoogle) {
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
      Alert.alert('Login Failed', error.message || 'Could not sign in with Google');
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
    } catch (error: any) {
      haptic.warning();
      Alert.alert('Logout Failed', error.message || 'Could not log out');
    } finally {
      setLoadingAuth(false);
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
          <Text style={styles.docMeta}>MOTOFIX TRACKER // REV.01</Text>
        </View>

        {/* Prose Section: Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>I. WORKFLOW</Text>
          <View style={styles.proseBlock}>
            {STEPS.map((step, index) => (
              <View key={step.step} style={styles.paragraph}>
                <Text style={styles.pLead}>{step.step}. {step.title}</Text>
                <Text style={styles.pText}>{step.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Prose Section: Notices */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>II. NOTICES</Text>
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
          </View>
        </View>

        {/* Prose Section: Identity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>III. IDENTITY</Text>
          <View style={styles.proseBlock}>
            {isGuest ? (
              <View>
                <Text style={styles.pText}>
                  The system is currently operating in local persistence mode (GUEST). To synchronize telemetry across fleet terminals and prevent data volatility, bind a permanent Google credential.
                </Text>
                <TouchableOpacity
                  onPress={handleGoogleLogin}
                  disabled={loadingAuth}
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
                <TouchableOpacity
                  onPress={handleLogout}
                  disabled={loadingAuth}
                  style={styles.signoutBtn}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {loadingAuth ? (
                    <ActivityIndicator color={COLORS.danger} size="small" />
                  ) : (
                    <>
                      <LogOut size={15} color={COLORS.danger} strokeWidth={2} />
                      <Text style={styles.signoutBtnText}>Sign Out</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

      </ScrollView>
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

  signoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.danger + '50',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.dangerContainer + '20',
  },
  signoutBtnText: {
    fontFamily: FONT_FAMILY.mono,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.danger,
    letterSpacing: 0.5,
  },

  identityBound: {
    flexDirection: 'row', borderLeftWidth: 1, borderLeftColor: COLORS.success, paddingLeft: 16,
  }
});
