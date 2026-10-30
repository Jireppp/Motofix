import { supabase } from '../lib/supabase';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const GUEST_EMAIL_KEY = 'fxon_guest_email';
const LEGACY_GUEST_EMAIL_KEY = 'motofix_guest_email';

export type GoogleSignInResult =
  | { status: 'linked' }
  | { status: 'signed_in' }
  | { status: 'needs_switch'; idToken: string };

/** A guest is an anonymous user, or a legacy device-scoped @cekmotor.app account, without a Google identity. */
function isGuestUser(user: any): boolean {
  const hasGoogle =
    (user.identities || []).some((i: any) => i.provider === 'google') ||
    (user.app_metadata?.providers || []).includes('google');
  if (hasGoogle) return false;
  if (user.is_anonymous) return true;
  return (user.email || '').endsWith('@cekmotor.app');
}

/** True when the current (guest) user owns any vehicle. Errs on the side of "yes" so data is never dropped silently. */
async function guestHasData(): Promise<boolean> {
  const { count, error } = await supabase
    .from('user_vehicle')
    .select('id', { count: 'exact', head: true });
  if (error) return true;
  return (count ?? 0) > 0;
}

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
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem(GUEST_EMAIL_KEY);
      await AsyncStorage.removeItem(LEGACY_GUEST_EMAIL_KEY);
    } catch (e) {
      // Ignore
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

  /**
   * Sign in with Google.
   *
   * When the current session is a guest, the Google identity is LINKED to the guest
   * account so the guest's vehicles, parts and logs are kept (backup).
   * If that Google account already belongs to another FXON account, the guest garage
   * cannot be merged: when the guest has data the caller gets `needs_switch` and must
   * confirm before calling `signInWithGoogleToken`.
   */
  async signInWithGoogle(): Promise<GoogleSignInResult | null> {
    try {
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
      });
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (!idToken) throw new Error('No ID token received from Google Sign-In');

      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;

      // Not a guest (or no session): plain sign in.
      if (!currentUser || !isGuestUser(currentUser)) {
        await this.signInWithGoogleToken(idToken);
        return { status: 'signed_in' };
      }

      // Guest: keep their data by linking the Google identity to this account.
      const { error: linkError } = await supabase.auth.linkIdentity({
        provider: 'google',
        token: idToken,
      });
      if (!linkError) return { status: 'linked' };

      const code = (linkError as any).code as string | undefined;
      const message = (linkError.message || '').toLowerCase();
      const alreadyLinked =
        code === 'identity_already_exists' ||
        message.includes('already linked') ||
        message.includes('already exists');
      const hasData = await guestHasData();

      if (!hasData) {
        // Nothing to lose, so just sign in to the Google account.
        await this.signInWithGoogleToken(idToken);
        return { status: 'signed_in' };
      }

      if (alreadyLinked) {
        return { status: 'needs_switch', idToken };
      }

      // Linking failed for another reason (e.g. manual linking disabled, network).
      // Never silently drop the guest garage.
      throw new Error(
        'Could not back up your guest garage to Google right now. Your data is still safe on this device. Please try again later.'
      );
    } catch (error: any) {
      if (error.code === 'SIGN_IN_CANCELLED' || error.code === 'IN_PROGRESS') {
        return null;
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        throw new Error('Google Play Services is not available on this device.');
      }
      throw error;
    }
  },

  /** Sign in to the Google-backed account with an already obtained Google ID token. */
  async signInWithGoogleToken(idToken: string) {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    if (error) throw error;
    return data;
  },

  /** Check if the current logged-in user is an anonymous guest. */
  async isAnonymous(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return true;
    return isGuestUser(user);
  },

  /** Sign in as a guest (native anonymous with automatic device-scoped fallback). */
  async signInAsGuest(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) return true;

      // 1. Try native anonymous sign-in first
      try {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (!error && data?.session) {
          return true;
        }
      } catch (anonErr: any) {
        console.warn('Native anonymous auth unavailable, attempting device fallback:', anonErr?.message);
      }

      // 2. Fallback: Device-scoped guest account so app never blocks when anonymous auth is disabled on Supabase
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      let guestEmail =
        (await AsyncStorage.getItem(GUEST_EMAIL_KEY)) ||
        (await AsyncStorage.getItem(LEGACY_GUEST_EMAIL_KEY));
      const guestPassword = 'Guest_Motofix_AutoPass123!';

      if (!guestEmail) {
        const randomId = Math.random().toString(36).substring(2, 10);
        guestEmail = `guest_${randomId}_${Date.now()}@cekmotor.app`;
        await AsyncStorage.setItem(GUEST_EMAIL_KEY, guestEmail);
      }

      // Try signIn first
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: guestEmail,
        password: guestPassword,
      });

      if (!signInErr && signInData?.session) {
        return true;
      }

      // If user doesn't exist yet, signUp
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: guestEmail,
        password: guestPassword,
      });

      if (signUpErr) {
        console.error('Guest fallback signup error:', signUpErr.message);
        return false;
      }

      return Boolean(signUpData?.session);
    } catch (e: any) {
      console.error('All guest login attempts failed:', e);
      return false;
    }
  },

  /**
   * Permanently delete all user vehicles, tracked spareparts, maintenance logs,
   * odometer logs, and revoke authentication (Google Play Account & Data Deletion compliance).
   */
  async deleteAccountAndData(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // 1. Fetch all vehicles owned by this user
      const { data: vehicles } = await supabase
        .from('user_vehicle')
        .select('id')
        .eq('user_id', user.id);

      const vehicleIds = (vehicles || []).map((v: any) => v.id);

      if (vehicleIds.length > 0) {
        // 2. Fetch all spareparts associated with these vehicles
        const { data: spareparts } = await supabase
          .from('vehicle_sparepart')
          .select('id')
          .in('vehicle_id', vehicleIds);

        const sparepartIds = (spareparts || []).map((sp: any) => sp.id);

        if (sparepartIds.length > 0) {
          await supabase
            .from('maintenance_log')
            .delete()
            .in('sparepart_id', sparepartIds);
        }

        await supabase
          .from('vehicle_sparepart')
          .delete()
          .in('vehicle_id', vehicleIds);

        await supabase
          .from('km_log')
          .delete()
          .in('vehicle_id', vehicleIds);

        // 3. Delete all vehicles
        const { error: delVehicleErr } = await supabase
          .from('user_vehicle')
          .delete()
          .eq('user_id', user.id);

        if (delVehicleErr) throw delVehicleErr;
      }

      const { error: rpcError } = await supabase.rpc('delete_user_account');
      if (rpcError) throw rpcError;
    }

    // 5. Revoke Google OAuth access & sign out completely
    try {
      await GoogleSignin.revokeAccess();
    } catch {
      // Ignore if not signed in via Google
    }

    await this.signOut();
  },
};
