import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaView, StyleSheet, View, Text, BackHandler,
  Image, Animated, TouchableOpacity,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, LABEL_STYLE, FONT_FAMILY } from './src/constants/theme';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { authService } from './src/services/authService';
import { vehicleService } from './src/services/vehicleService';
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

type AppScreen = 'loading' | 'garage' | 'vehicleDetail' | 'addVehicle' | 'addSparepart' | 'workshop' | 'help';
type BottomTab = 'garage' | 'workshop';

function AppContent() {
  const { colors: COLORS, isDark } = useTheme();
  const styles = getStyles(COLORS);

  const [screen, setScreen] = useState<AppScreen>('loading');
  const [activeTab, setActiveTab] = useState<BottomTab>('garage');
  const [vehicles, setVehicles] = useState<UserVehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<UserVehicle | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const progressAnim = useRef(new Animated.Value(0)).current;

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
    // Animate splash progress bar
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

    return () => { subscription.unsubscribe(); };
  }, []);

  const checkAuth = async () => {
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
    setActiveTab(tab);
    if (tab === 'garage') smartRoute();
    else if (tab === 'workshop') setScreen('workshop');
  };

  // ── Bottom Tab Bar Minimalist ──
  const renderBottomTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => handleTabPress('garage')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabIcon, activeTab === 'garage' && styles.tabIconActive]}>INDEX</Text>
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

  const renderScreen = () => {
    switch (screen) {
      case 'loading':
        return (
          <View style={styles.splashContainer}>
            {/* Corner brackets */}
            <View style={[styles.cornerBracket, styles.cornerTL]} />
            <View style={[styles.cornerBracket, styles.cornerBR]} />

            {/* Logo container */}
            <View style={styles.splashLogoBox}>
              <Image
                source={require('./assets/splash-icon.png')}
                style={styles.splashLogo}
                resizeMode="contain"
              />
            </View>

            {/* Title */}
            <Text style={styles.splashTitle}>MOTOFIX</Text>
            <Text style={styles.splashSubtitle}>ASISTEN SERVIS MOTOR{'\n'}TERPERCAYA</Text>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={styles.splashFooter}>MOTOFIX — Sparepart Replacement Tracker</Text>
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

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {renderScreen()}
    </SafeAreaView>
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
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    paddingHorizontal: 40,
  },
  cornerBracket: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: COLORS.textTertiary,
  },
  cornerTL: {
    top: 40,
    left: 20,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  cornerBR: {
    bottom: 40,
    right: 20,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  splashLogoBox: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface2,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
  },
  splashLogo: {
    width: 40,
    height: 40,
    tintColor: COLORS.primary,
  },
  splashTitle: {
    fontFamily: FONT_FAMILY.display,
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  splashSubtitle: {
    fontFamily: FONT_FAMILY.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: COLORS.textTertiary,
    marginTop: 8,
    textAlign: 'center',
  },
  progressTrack: {
    width: 150,
    height: 5,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 2,
    marginTop: 38,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  splashFooter: {
    position: 'absolute',
    bottom: 30,
    left: '50%',
    transform: [{ translateX: -150 }],
    width: 300,
    textAlign: 'center',
    fontFamily: FONT_FAMILY.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    color: COLORS.borderStrong,
    textTransform: 'uppercase',
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
