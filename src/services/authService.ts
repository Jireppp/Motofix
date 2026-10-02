import { supabase } from '../lib/supabase';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export const authService = {
  /** Sign up with email and password. */
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  /** Sign in with email and password. */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  /** Sign out the current user. */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    try {
      await GoogleSignin.signOut();
    } catch (e) {
      // Ignore if not signed in with Google
    }
    if (error) throw error;
  },

  /** Get the current session. */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  /** Listen for auth state changes. */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },

  /** Sign in with Google */
  async signInWithGoogle() {
    try {
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
      });
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      if (userInfo.data?.idToken) {
        // Link identity if currently logged in as guest
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Link Google identity to the existing guest account
          const { data, error } = await supabase.auth.linkIdentity({
            provider: 'google',
            options: {
              redirectTo: 'cekmotor://auth/callback',
            }
          });
          
          if (error && !error.message.includes('already linked')) {
            // If linking fails, we can fallback to just signing in, though this creates a new account
            const { data: signInData, error: signInError } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: userInfo.data.idToken,
            });
            if (signInError) throw signInError;
            return signInData;
          }
          return data;
        } else {
          // If no session, just sign in
          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: userInfo.data.idToken,
          });
          if (error) throw error;
          return data;
        }
      } else {
        throw new Error('no ID token present!');
      }
    } catch (error: any) {
      if (error.code === 'SIGN_IN_CANCELLED') {
        // user cancelled the login flow
        console.log('Login cancelled');
      } else if (error.code === 'IN_PROGRESS') {
        // operation (e.g. sign in) is in progress already
        console.log('Login in progress');
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        // play services not available or outdated
        console.log('Play services not available');
      } else {
        // some other error happened
        console.error('Google sign in error', error);
      }
      throw error;
    }
  },

  /** Auto-login as a guest (creates a hidden account per device) */
  async signInAsGuest() {
    try {
      // We dynamically import AsyncStorage so we don't break existing imports elsewhere
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      
      let deviceEmail = await AsyncStorage.getItem('guest_email');
      const devicePassword = 'GuestPassword123!'; // Fixed password for guest accounts

      if (!deviceEmail) {
        // Generate a random email for this device
        const randomStr = Math.random().toString(36).substring(2, 10);
        deviceEmail = `guest_${randomStr}_${Date.now()}@cekmotor.app`;
        await AsyncStorage.setItem('guest_email', deviceEmail);

        // Sign up the new guest
        const { error: signUpError } = await supabase.auth.signUp({
          email: deviceEmail,
          password: devicePassword,
        });

        if (signUpError && signUpError.message.includes('already registered')) {
          // If collision happens, retry login
          const { error: signInErr } = await supabase.auth.signInWithPassword({ email: deviceEmail, password: devicePassword });
          if (signInErr) throw signInErr;
        } else if (signUpError) {
          throw signUpError;
        }
      } else {
        // Existing guest, sign in
        const { error } = await supabase.auth.signInWithPassword({
          email: deviceEmail,
          password: devicePassword,
        });
        
        // If login fails (maybe because Email Confirm was ON previously), force create a new one
        if (error) {
           const randomStr = Math.random().toString(36).substring(2, 10);
           const newDeviceEmail = `guest_${randomStr}_${Date.now()}@cekmotor.app`;
           await AsyncStorage.setItem('guest_email', newDeviceEmail);
           const { error: newSignUpError } = await supabase.auth.signUp({
             email: newDeviceEmail,
             password: devicePassword,
           });
           if (newSignUpError) throw newSignUpError;
        }
      }

      return true;
    } catch (e) {
      console.log('Guest login error:', e);
      // We don't throw, we let checkAuth handle it, but it means user is null
      return false;
    }
  },
};
