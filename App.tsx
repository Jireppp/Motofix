import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet, View, Text, BackHandler,
  Image, Animated, TouchableOpacity,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, LABEL_STYLE, FONT_FAMILY } from './src/constants/theme';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
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
      duration: 2200,
      useNativeDriver: false,
    }).start();

    const initApp = async () => {
      await new Promise(resolve => setTimeout(resolve, 2500));
      checkAuth();
    };
    initApp();

    const { data: { subscription } } = authService.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') checkAuth();
    });

    return () => {
      progressAnim.removeListener(listenerId);
      subscription.unsubscribe();
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
      if (updated) setSelectedVehicle(updated);
    }
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

  const renderScreen = () => {
    switch (screen) {
      case 'loading':
        return (
          <View style={[styles.splashContainer, { paddingTop: Math.max(80, insets.top + 60), paddingBottom: Math.max(48, insets.bottom + 24) }]}>
            {/* Center-Upper Hero Section */}
            <View style={styles.splashHero}>
              <Image
                source={require('./assets/splash-icon.png')}
                style={styles.splashLogo}
                resizeMode="contain"
              />
              <Text style={styles.splashTitle}>MOTOFIX</Text>
              <Text style={styles.splashSubtitle}>MOTORCYCLE MAINTENANCE TRACKER</Text>
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
              refreshKey={refreshKey}
            />
            {renderBottomTabBar()}
          </>
        );

      case 'vehicleDetail':
        return selectedVehicle ? (
          <>
            <HomeScreen
              vehicle={selectedVehicle}
              onVehicleUpdate={handleVehicleUpdate}
              onNavigateAdd={() => setScreen('addSparepart')}
              onGoBack={handleGoBackToGarage}
            />
            {renderBottomTabBar()}
          </>
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
        <AppContent />
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
  splashHero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -24 }],
  },
  splashLogo: {
    width: 140,
    height: 90,
    marginBottom: 20,
  },
  splashTitle: {
    fontFamily: FONT_FAMILY.display,
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  splashSubtitle: {
    fontFamily: FONT_FAMILY.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: COLORS.textTertiary,
    marginTop: 6,
    textAlign: 'center',
  },
  splashLoadingSection: {
    alignItems: 'center',
    justifyContent: 'center',
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
