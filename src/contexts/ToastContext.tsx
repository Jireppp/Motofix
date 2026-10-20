import React, { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './ThemeContext';
import { FONT_FAMILY } from '../constants/theme';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react-native';
import { haptic } from '../utils/haptics';

export type ToastType = 'error' | 'success' | 'warning' | 'info';

export interface ToastOptions {
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Global emitter ref for direct non-hook usage: toast.error(...)
let globalShowToast: ((options: ToastOptions) => void) | null = null;

export const toast = {
  show: (options: ToastOptions) => {
    if (globalShowToast) globalShowToast(options);
  },
  error: (message: string, title: string = 'ERROR') => {
    if (globalShowToast) globalShowToast({ type: 'error', title, message });
  },
  success: (message: string, title: string = 'SUCCESS') => {
    if (globalShowToast) globalShowToast({ type: 'success', title, message });
  },
  warning: (message: string, title: string = 'WARNING') => {
    if (globalShowToast) globalShowToast({ type: 'warning', title, message });
  },
  info: (message: string, title: string = 'NOTICE') => {
    if (globalShowToast) globalShowToast({ type: 'info', title, message });
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const { colors: COLORS, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [currentToast, setCurrentToast] = useState<ToastOptions | null>(null);
  const animValue = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    Animated.timing(animValue, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setCurrentToast(null);
    });
  }, [animValue]);

  const showToast = useCallback(
    ({ type = 'info', title, message, duration = 3400 }: ToastOptions) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Haptic feedback
      if (type === 'error') haptic.warning();
      else if (type === 'warning') haptic.warning();
      else if (type === 'success') haptic.success();
      else haptic.light();

      // Default titles if not supplied
      const resolvedTitle =
        title ||
        (type === 'error'
          ? 'SYS_ALERT // ERROR'
          : type === 'warning'
          ? 'TELEMETRY // WARNING'
          : type === 'success'
          ? 'ACTION // SUCCESS'
          : 'SYS_NOTICE');

      setCurrentToast({ type, title: resolvedTitle, message, duration });

      animValue.setValue(0);
      Animated.spring(animValue, {
        toValue: 1,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }).start();

      timerRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    },
    [animValue, hideToast]
  );

  // Bind to global emitter
  globalShowToast = showToast;

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0],
  });

  const opacity = animValue.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 0.9, 1],
  });

  const getStatusColor = (type?: ToastType) => {
    switch (type) {
      case 'error':
        return COLORS.danger;
      case 'warning':
        return COLORS.warning;
      case 'success':
        return COLORS.success;
      case 'info':
      default:
        return COLORS.primary;
    }
  };

  const renderIcon = (type?: ToastType) => {
    const color = getStatusColor(type);
    switch (type) {
      case 'error':
        return <AlertCircle size={18} color={color} strokeWidth={2.2} />;
      case 'warning':
        return <AlertTriangle size={18} color={color} strokeWidth={2.2} />;
      case 'success':
        return <CheckCircle2 size={18} color={color} strokeWidth={2.2} />;
      case 'info':
      default:
        return <Info size={18} color={color} strokeWidth={2.2} />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}

      {currentToast && (
        <Animated.View
          style={[
            styles.container,
            {
              top: Math.max(14, insets.top + 8),
              transform: [{ translateY }],
              opacity,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.toastCard,
              {
                backgroundColor: COLORS.surface1,
                borderColor: COLORS.border,
              },
            ]}
            onPress={hideToast}
            activeOpacity={0.9}
          >
            {/* Left Stamped Color Bar */}
            <View
              style={[
                styles.stampedBar,
                { backgroundColor: getStatusColor(currentToast.type) },
              ]}
            />

            <View style={styles.iconContainer}>{renderIcon(currentToast.type)}</View>

            <View style={styles.textContainer}>
              {currentToast.title && (
                <Text
                  style={[
                    styles.title,
                    { color: getStatusColor(currentToast.type) },
                  ]}
                  numberOfLines={1}
                >
                  {currentToast.title}
                </Text>
              )}
              <Text style={[styles.message, { color: COLORS.textPrimary }]}>
                {currentToast.message}
              </Text>
            </View>

            <TouchableOpacity
              onPress={hideToast}
              style={styles.closeBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={15} color={COLORS.textTertiary} strokeWidth={2} />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999999,
    elevation: 999999,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  stampedBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  iconContainer: {
    marginRight: 10,
    marginLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontFamily: FONT_FAMILY.monoBold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  message: {
    fontFamily: FONT_FAMILY.body,
    fontSize: 12.5,
    lineHeight: 17,
  },
  closeBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
