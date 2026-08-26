import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { authService } from '../services/authService';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const { colors: COLORS } = useTheme();
  const styles = getStyles(COLORS);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Masukkan email dan password.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await authService.signUp(email.trim(), password);
        Alert.alert('Berhasil', 'Akun berhasil dibuat. Silakan login.');
        setIsSignUp(false);
      } else {
        await authService.signIn(email.trim(), password);
        onLoginSuccess();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        {/* Logo / Title */}
        <View style={styles.header}>
          <Text style={styles.logoIcon}>🏍️</Text>
          <Text style={styles.title}>Cek Motor</Text>
          <Text style={styles.subtitle}>Pelacak Ganti Sparepart</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="contoh@email.com"
            placeholderTextColor={COLORS.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Masukkan password"
            placeholderTextColor={COLORS.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>
                {isSignUp ? 'Daftar' : 'Masuk'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsSignUp(!isSignUp)}
          >
            <Text style={styles.switchText}>
              {isSignUp
                ? 'Sudah punya akun? Masuk'
                : 'Belum punya akun? Daftar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (COLORS: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  logoIcon: {
    fontSize: 64,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  form: {
    backgroundColor: COLORS.surfaceLow,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    color: COLORS.text,
    fontSize: FONT_SIZE.md,
  },
  button: {
    backgroundColor: COLORS.primaryContainer,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  switchButton: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  switchText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.sm,
  },
});
