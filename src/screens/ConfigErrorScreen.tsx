import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import {
  BORDER_RADIUS,
  FONT_FAMILY,
  FONT_SIZE,
  LABEL_STYLE,
  SPACING,
} from '../constants/theme';
import { getMissingEnvVars } from '../lib/supabase';
import { haptic } from '../utils/haptics';

interface ConfigErrorScreenProps {
  onRetry?: () => void;
}

export default function ConfigErrorScreen({ onRetry }: ConfigErrorScreenProps) {
  const { colors: COLORS } = useTheme();
  const insets = useSafeAreaInsets();
  const [missingVars, setMissingVars] = useState<string[]>(() => getMissingEnvVars());
  const [rechecking, setRechecking] = useState(false);

  const handleRecheck = () => {
    haptic.medium();
    setRechecking(true);
    const updated = getMissingEnvVars();
    setMissingVars(updated);
    setTimeout(() => {
      setRechecking(false);
      if (updated.length === 0 && onRetry) {
        haptic.success();
        onRetry();
      } else {
        haptic.error();
      }
    }, 400);
  };

  const styles = getStyles(COLORS, insets);

  return (
    <View style={styles.container}>
      {/* Corner Bracket Accents */}
      <View style={[styles.cornerBracket, styles.cornerTL]} />
      <View style={[styles.cornerBracket, styles.cornerBR]} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Tag */}
        <View style={styles.tagBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.tagText}>SYS_ALERT // CONFIG_MISSING</Text>
        </View>

        {/* Main Title */}
        <Text style={styles.title}>CONFIGURATION REQUIRED</Text>
        <Text style={styles.subtitle}>
          The application cannot communicate with Supabase backend. Environment variables are missing or unresolved in this build.
        </Text>

        {/* Missing Variables Box */}
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>UNRESOLVED PARAMETERS</Text>
            <Text style={styles.panelCount}>{missingVars.length} REQUIRED</Text>
          </View>
          <View style={styles.panelBody}>
            {missingVars.map((varName) => (
              <View key={varName} style={styles.varRow}>
                <Text style={styles.varName}>{varName}</Text>
                <View style={styles.missingBadge}>
                  <Text style={styles.missingBadgeText}>NOT SET</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Remediation Guide */}
        <View style={styles.guideContainer}>
          <Text style={styles.guideHeader}>HOW TO RESOLVE</Text>

          <View style={styles.guideStep}>
            <Text style={styles.stepNumber}>01</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>LOCAL ENVIRONMENT</Text>
              <Text style={styles.stepDescription}>
                Create or verify your <Text style={styles.codeInline}>.env</Text> file in the project root directory:
              </Text>
              <View style={styles.codeSnippet}>
                <Text style={styles.codeText}>
                  EXPO_PUBLIC_SUPABASE_URL=https://xyz.supabase.co{'\n'}
                  EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJh...
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.guideStep}>
            <Text style={styles.stepNumber}>02</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>EAS BUILD / PREVIEW APK</Text>
              <Text style={styles.stepDescription}>
                Sync your variables to Expo Application Services:
              </Text>
              <View style={styles.codeSnippet}>
                <Text style={styles.codeText}>
                  npx eas-cli env:push preview
                </Text>
              </View>
              <Text style={styles.stepNote}>
                Or manually set with: <Text style={styles.codeInline}>npx eas-cli env:set preview</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.retryButton, rechecking && styles.retryButtonDisabled]}
          onPress={handleRecheck}
          disabled={rechecking}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Recheck environment configuration"
        >
          <Text style={styles.retryButtonText}>
            {rechecking ? 'VERIFYING ENVIRONMENT...' : 'RECHECK CONFIGURATION'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const getStyles = (COLORS: any, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.bg,
      paddingTop: Math.max(insets.top, 24),
      paddingBottom: Math.max(insets.bottom, 24),
      paddingHorizontal: SPACING.lg,
    },
    scrollContent: {
      flexGrow: 1,
      paddingVertical: SPACING.md,
    },
    cornerBracket: {
      position: 'absolute',
      width: 24,
      height: 24,
      borderColor: COLORS.borderStrong,
    },
    cornerTL: {
      top: Math.max(insets.top + 8, 32),
      left: 16,
      borderTopWidth: 2,
      borderLeftWidth: 2,
    },
    cornerBR: {
      bottom: Math.max(insets.bottom + 8, 32),
      right: 16,
      borderBottomWidth: 2,
      borderRightWidth: 2,
    },
    tagBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: COLORS.surface2,
      borderColor: COLORS.danger,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: BORDER_RADIUS.sm,
      marginBottom: SPACING.md,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: COLORS.danger,
      marginRight: 8,
    },
    tagText: {
      fontFamily: FONT_FAMILY.monoBold,
      fontSize: 10,
      color: COLORS.danger,
      letterSpacing: 1.2,
    },
    title: {
      fontFamily: FONT_FAMILY.display,
      fontSize: 32,
      color: COLORS.textPrimary,
      letterSpacing: 1,
      lineHeight: 38,
      marginBottom: SPACING.xs,
    },
    subtitle: {
      fontFamily: FONT_FAMILY.body,
      fontSize: 13,
      color: COLORS.textSecondary,
      lineHeight: 18,
      marginBottom: SPACING.xl,
    },
    panel: {
      backgroundColor: COLORS.surface1,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: BORDER_RADIUS.md,
      marginBottom: SPACING.xl,
      overflow: 'hidden',
    },
    panelHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      backgroundColor: COLORS.surface2,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
    },
    panelTitle: {
      ...LABEL_STYLE,
      color: COLORS.textSecondary,
      fontSize: 10,
    },
    panelCount: {
      fontFamily: FONT_FAMILY.monoBold,
      fontSize: 10,
      color: COLORS.warning,
      letterSpacing: 1,
    },
    panelBody: {
      padding: SPACING.md,
    },
    varRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: SPACING.xs,
    },
    varName: {
      fontFamily: FONT_FAMILY.mono,
      fontSize: 12,
      color: COLORS.textPrimary,
    },
    missingBadge: {
      backgroundColor: COLORS.dangerContainer || '#2B1412',
      borderWidth: 1,
      borderColor: COLORS.danger,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: BORDER_RADIUS.sm,
    },
    missingBadgeText: {
      fontFamily: FONT_FAMILY.monoBold,
      fontSize: 9,
      color: COLORS.danger,
      letterSpacing: 0.8,
    },
    guideContainer: {
      marginBottom: SPACING.xl,
    },
    guideHeader: {
      ...LABEL_STYLE,
      color: COLORS.textTertiary,
      fontSize: 10.5,
      marginBottom: SPACING.md,
    },
    guideStep: {
      flexDirection: 'row',
      marginBottom: SPACING.lg,
    },
    stepNumber: {
      fontFamily: FONT_FAMILY.display,
      fontSize: 22,
      color: COLORS.primary,
      width: 36,
      lineHeight: 26,
    },
    stepContent: {
      flex: 1,
    },
    stepTitle: {
      fontFamily: FONT_FAMILY.monoBold,
      fontSize: 12,
      color: COLORS.textPrimary,
      letterSpacing: 1,
      marginBottom: 4,
    },
    stepDescription: {
      fontFamily: FONT_FAMILY.body,
      fontSize: 12,
      color: COLORS.textSecondary,
      lineHeight: 17,
      marginBottom: 6,
    },
    stepNote: {
      fontFamily: FONT_FAMILY.body,
      fontSize: 11,
      color: COLORS.textTertiary,
      marginTop: 4,
    },
    codeSnippet: {
      backgroundColor: COLORS.surface2,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: BORDER_RADIUS.sm,
      padding: 10,
      marginVertical: 4,
    },
    codeText: {
      fontFamily: FONT_FAMILY.mono,
      fontSize: 11,
      color: COLORS.textPrimary,
      lineHeight: 16,
    },
    codeInline: {
      fontFamily: FONT_FAMILY.mono,
      color: COLORS.primary,
    },
    retryButton: {
      backgroundColor: COLORS.primary,
      borderRadius: BORDER_RADIUS.sm,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 'auto',
      marginBottom: SPACING.md,
      ...Platform.select({
        android: { elevation: 3 },
        ios: {
          shadowColor: COLORS.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
      }),
    },
    retryButtonDisabled: {
      opacity: 0.6,
    },
    retryButtonText: {
      fontFamily: FONT_FAMILY.monoBold,
      fontSize: 13,
      color: '#FFFFFF',
      letterSpacing: 1.5,
    },
  });
