import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet, View, Text, BackHandler,
  Image, Animated, TouchableOpacity, Easing,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, LABEL_STYLE, FONT_FAMILY } from './src/constants/theme';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { ToastProvider } from './src/contexts/ToastContext';
import { authService } from './src/services/authService';
import { vehicleService } from './src/services/vehicleService';
import { notificationService } from './src/services/notificationService';
import { UserVehicle } from './src/types';

import { useFonts, Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';
import { IBMPlexSans_400Regular, IBMPlexSans_700Bold } from '@expo-google-fonts/ibm-plex-sans';
import { IBMPlexMono_500Medium, IBMPlexMono_700Bold } from '@expo-google-fonts/ibm-plex-mono';

import GarageScreen from './src/screens/GarageScreen';
import HomeScreen from './src/screens/HomeScreen';
import AddVehicleScreen from './src/screens/AddVehicleScreen';
import AddSparepartScreen from './src/screens/AddSparepartScreen';
import WorkshopScreen from './src/screens/WorkshopScreen';
import HelpScreen from './src/screens/HelpScreen';
import ConfigErrorScreen from './src/screens/ConfigErrorScreen';
import { isSupabaseConfigured } from './src/lib/supabase';
import { haptic } from './src/utils/haptics';

type AppScreen = 'loading' | 'garage' | 'vehicleDetail' | 'addVehicle' | 'addSparepart' | 'workshop' | 'help' | 'configError';
type BottomTab = 'garage' | 'workshop';

function AppContent() {
  const { colors: COLORS, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(COLORS);

  const [screen, setScreen] = useState<AppScreen>('loading');
  const [activeTab, setActiveTab] = useState<BottomTab>('garage');
  const [vehicles, setVehicles] = useState<UserVehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<UserVehicle | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const needleAnim = useRef(new Animated.Value(0)).current;
  const jitterAnim = useRef(new Animated.Value(0)).current;
  const [loadingPercent, setLoadingPercent] = useState(0);

  // ─── Android Hardware Back Button Handler ───
  useEffect(() => {
    const backAction = () => {
      switch (screen) {
        case 'vehicleDetail':
          smartRoute();
          return true;
        case 'addVehicle':
          smartRoute();
          return true;
        case 'addSparepart':
          setScreen('vehicleDetail');
          return true;
        case 'workshop':
          setActiveTab('garage');
          smartRoute();
          return true;
        case 'help':
          setActiveTab('garage');
          smartRoute();
          return true;
        case 'configError':
        case 'garage':
        case 'loading':
        default:
          return false;
      }
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [screen]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setScreen('configError');
      return;
    }

    const listenerId = progressAnim.addListener(({ value }) => {
      setLoadingPercent(Math.min(100, Math.floor(value * 100)));
    });

    // Animate splash progress / odometer counter
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2400,
      useNativeDriver: false,
    }).start();

    // ─── Speedometer Startup Gauge Sweep & Engine Ride Animation ───
    Animated.sequence([
      // 1. Ignition Key-ON Sweep up to redline (+128 deg)
      Animated.timing(needleAnim, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // 2. Return sweep back to zero (-128 deg)
      Animated.timing(needleAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      // 3. Engine throttle acceleration (climbs with loading progress)
      Animated.timing(needleAnim, {
        toValue: 0.88,
        duration: 1250,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle engine throttle idle jitter (vibration)
    const jitterLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(jitterAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(jitterAnim, { toValue: -1, duration: 60, useNativeDriver: true }),
      ])
    );
    jitterLoop.start();

    const initApp = async () => {
      await new Promise(resolve => setTimeout(resolve, 2600));
      checkAuth();
    };
    initApp();

    const { data: { subscription } } = authService.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') checkAuth();
    });

    return () => {
      progressAnim.removeListener(listenerId);
      subscription.unsubscribe();
      jitterLoop.stop();
    };
  }, []);

  const checkAuth = async () => {
    if (!isSupabaseConfigured) {
      setScreen('configError');
      return;
    }
    try {
      const session = await authService.getSession();
      if (session) {
        await smartRoute();
      } else {
        await authService.signInAsGuest();
        await smartRoute();
      }
    } catch (e) {
      console.log('Auth check failed:', e);
      await smartRoute();
    }
  };

  const smartRoute = useCallback(async () => {
    try {
      const v = await vehicleService.getVehicles();
      setVehicles(v);
      setSelectedVehicle((prev) => (prev && v.some((item) => item.id === prev.id) ? prev : null));
      setScreen('garage');
      if (v.length > 0) {
        notificationService.resetWeeklyInactivityReminder(v[0].vehicle_name, true).catch(() => {});
      }
    } catch {
      setScreen('garage');
    }
  }, []);

  const handleSelectVehicle = (vehicle: UserVehicle) => {
    setSelectedVehicle(vehicle);
    setScreen('vehicleDetail');
  };

  const handleVehicleUpdate = async () => {
    const v = await vehicleService.getVehicles();
    setVehicles(v);
    if (selectedVehicle) {
      const updated = v.find((item) => item.id === selectedVehicle.id);
      setSelectedVehicle(updated || null);
    }
    setRefreshKey((k) => k + 1);
  };

  const handleVehicleDeleted = async (deletedVehicleId: string) => {
    setSelectedVehicle((prev) => (prev?.id === deletedVehicleId ? null : prev));
    const v = await vehicleService.getVehicles();
    setVehicles(v);
    setRefreshKey((k) => k + 1);
  };

  const handleGoBackToGarage = () => {
    setActiveTab('garage');
    smartRoute();
  };

  const handleTabPress = (tab: BottomTab) => {
    haptic.selection();
    setActiveTab(tab);
    if (tab === 'garage') smartRoute();
    else if (tab === 'workshop') setScreen('workshop');
  };

  // ── Bottom Tab Bar Minimalist ──
  const renderBottomTabBar = () => (
    <View style={[styles.tabBar, { bottom: Math.max(20, insets.bottom + 8) }]}>
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => handleTabPress('garage')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabIcon, activeTab === 'garage' && styles.tabIconActive]}>GARAGE</Text>
        <View style={[styles.tabIndicator, activeTab === 'garage' && styles.tabIndicatorActive]} />
      </TouchableOpacity>
      
      <View style={styles.tabDivider} />
      
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => handleTabPress('workshop')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabIcon, activeTab === 'workshop' && styles.tabIconActive]}>WORKSHOP</Text>
        <View style={[styles.tabIndicator, activeTab === 'workshop' && styles.tabIndicatorActive]} />
      </TouchableOpacity>
    </View>
  );

  const digitsStr = loadingPercent.toString().padStart(3, '0');
  const odometerDigits = [digitsStr[0], digitsStr[1], digitsStr[2], '%'];

  // Speedometer needle rotation and engine throttle jitter
  const needleRotate = needleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-128deg', '128deg'],
  });

  const jitterRotate = jitterAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-1.5deg', '1.5deg'],
  });

  // Dynamic simulated speed (reaches ~160 KM/H as motorcycle powers up)
  const displaySpeed = Math.round(loadingPercent * 1.6);

  const renderScreen = () => {
    switch (screen) {
      case 'loading':
        return (
          <View style={[styles.splashContainer, { paddingTop: Math.max(50, insets.top + 32), paddingBottom: Math.max(36, insets.bottom + 16) }]}>
            {/* Center-Upper Brand Hero */}
            <View style={styles.splashBrandHero}>
              <Image
                source={require('./assets/icon.png')}
                style={styles.splashBrandLogo}
                resizeMode="contain"
              />
              <Text style={styles.splashTitle}>FXON</Text>
              <Text style={styles.splashSubtitle}>TRACK THE WEAR. MASTER THE RIDE.</Text>
            </View>

            {/* Center Animated Speedometer Cluster */}
            <View style={styles.speedometerCluster}>
              {/* Dial Arc Image */}
              <Image
                source={require('./assets/speedometer-dial.png')}
                style={styles.speedometerDial}
                resizeMode="contain"
              />

              {/* Center Digital Readout */}
              <View style={styles.speedometerCenter}>
                <Text style={styles.speedValue}>{displaySpeed}</Text>
                <Text style={styles.speedUnit}>KM / H</Text>
              </View>

              {/* Rotating Needle Layer */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.needleContainer,
                  {
                    transform: [
                      { rotate: needleRotate },
                      { rotate: jitterRotate },
                    ],
                  },
                ]}
              >
                {/* Needle Blade */}
                <View style={styles.needlePointer}>
                  <View style={styles.needleTip} />
                </View>
                {/* Center Pivot Hub */}
                <View style={styles.needlePivot}>
                  <View style={styles.needlePivotDot} />
                </View>
              </Animated.View>
            </View>

            {/* Bottom Minimalist Odometer Cluster */}
            <View style={styles.splashLoadingSection}>
              <View style={styles.odometerCluster}>
                {odometerDigits.map((digit, index) => (
                  <View key={index} style={styles.odometerBox}>
                    <Text style={styles.odometerDigit}>{digit}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        );

      case 'garage':
        return (
          <>
            <GarageScreen
              onSelectVehicle={handleSelectVehicle}
              onAddVehicle={() => setScreen('addVehicle')}
              onHelp={() => setScreen('help')}
              onVehicleDeleted={handleVehicleDeleted}
              refreshKey={refreshKey}
            />
            {renderBottomTabBar()}
          </>
        );

      case 'vehicleDetail':
        return selectedVehicle ? (
          <HomeScreen
            vehicle={selectedVehicle}
            onVehicleUpdate={handleVehicleUpdate}
            onNavigateAdd={() => setScreen('addSparepart')}
            onGoBack={handleGoBackToGarage}
          />
        ) : null;

      case 'addVehicle':
        return (
          <AddVehicleScreen
            onSuccess={() => smartRoute()}
            onGoBack={() => smartRoute()}
          />
        );

      case 'addSparepart':
        return selectedVehicle ? (
          <AddSparepartScreen
            vehicle={selectedVehicle}
            onSuccess={() => {
              setScreen('vehicleDetail');
              handleVehicleUpdate();
            }}
            onGoBack={() => setScreen('vehicleDetail')}
          />
        ) : null;

      case 'workshop':
        return (
          <>
            <WorkshopScreen onGoBack={handleGoBackToGarage} />
            {renderBottomTabBar()}
          </>
        );

      case 'help':
        return (
          <HelpScreen onGoBack={handleGoBackToGarage} />
        );

      case 'configError':
        return (
          <ConfigErrorScreen
            onRetry={() => {
              setScreen('loading');
              checkAuth();
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {renderScreen()}
    </View>
  );
}

export default function App() {
  let [fontsLoaded, fontError] = useFonts({
    Rajdhani_700Bold,
    IBMPlexSans_400Regular,
    IBMPlexSans_700Bold,
    IBMPlexMono_500Medium,
    IBMPlexMono_700Bold,
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const getStyles = (COLORS: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // ─── Splash Screen ───
  splashContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  splashBrandHero: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  splashBrandLogo: {
    width: 60,
    height: 60,
    marginBottom: 6,
  },
  splashTitle: {
    fontFamily: FONT_FAMILY.display,
    fontSize: 38,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  splashSubtitle: {
    fontFamily: FONT_FAMILY.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: COLORS.textTertiary,
    marginTop: 4,
    textAlign: 'center',
  },

  // ─── Speedometer Cluster ───
  speedometerCluster: {
    width: 250,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 12,
  },
  speedometerDial: {
    width: 250,
    height: 250,
  },
  speedometerCenter: {
    position: 'absolute',
    top: 136,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  speedValue: {
    fontFamily: FONT_FAMILY.display,
    fontSize: 42,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -1,
    lineHeight: 42,
  },
  speedUnit: {
    fontFamily: FONT_FAMILY.monoBold,
    fontSize: 9.5,
    letterSpacing: 2,
    color: COLORS.primary,
    marginTop: 2,
  },

  // ─── Needle Mechanics ───
  needleContainer: {
    position: 'absolute',
    width: 250,
    height: 250,
    top: -7,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  needlePointer: {
    position: 'absolute',
    top: 47,
    width: 3.5,
    height: 78,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  needleTip: {
    width: 5,
    height: 16,
    backgroundColor: '#70A4FF',
    borderRadius: 2,
  },
  needlePivot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.surface1,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
  },
  needlePivotDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
  },

  splashLoadingSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  splashStatusText: {
    fontFamily: FONT_FAMILY.mono,
    fontSize: 9.5,
    letterSpacing: 1.5,
    color: COLORS.textTertiary,
    marginTop: 14,
    textAlign: 'center',
  },
  odometerCluster: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  odometerBox: {
    width: 32,
    height: 40,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  odometerDigit: {
    fontFamily: FONT_FAMILY.monoBold,
    fontSize: 15,
    color: COLORS.textPrimary,
  },

  // ── Bottom Tab Bar Minimalist ──
  tabBar: {
    position: 'absolute',
    bottom: 24,
    left: '15%',
    right: '15%',
    height: 56,
    flexDirection: 'row',
    backgroundColor: COLORS.surface1,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabIcon: {
    fontFamily: FONT_FAMILY.mono,
    fontSize: 11,
    letterSpacing: 1,
    color: COLORS.textSecondary,
  },
  tabIconActive: {
    color: COLORS.textPrimary,
    fontFamily: FONT_FAMILY.monoBold,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -2,
    width: 24,
    height: 3,
    backgroundColor: 'transparent',
    borderRadius: 2,
  },
  tabIndicatorActive: {
    backgroundColor: COLORS.textPrimary,
  },
  tabDivider: {
    width: 1,
    height: '40%',
    backgroundColor: COLORS.border,
    alignSelf: 'center',
  },
});
