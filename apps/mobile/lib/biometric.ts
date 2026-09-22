// ============================================
// WHAT THIS FILE DOES (plain English):
// Talks to the phone's Face ID / fingerprint tools. Bridger never sees a
// face or a print. We only ask "is this the same person who unlocked the
// phone?" so they can reopen the app without a new text code.
//
// SECURITY: the login session is already saved on the device. This is a
// local gate in front of that session, not a second sign-in.
// PRIVACY: we never store biometric data. The on/off choice is a yes/no
// flag on this phone, keyed to the account.
// ============================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  biometricPrefKey,
  labelForAuthTypes,
  type BiometricMethod
} from './biometric-labels';

export type BiometricCapability = {
  /** Phone has a Face ID / fingerprint sensor we can call. */
  available: boolean;
  /** Someone enrolled a face or print on this device. */
  enrolled: boolean;
  /** Short UI name: Face ID, Touch ID, fingerprint. */
  label: string;
  /** Analytics method (face / touch / fingerprint / iris). */
  method: BiometricMethod;
};

export type BiometricAttempt =
  | { ok: true; method: BiometricMethod }
  | { ok: false; reason: 'cancel' | 'fail' | 'unavailable' | 'lockout' };

const UNAVAILABLE: BiometricCapability = {
  available: false,
  enrolled: false,
  label: 'this device',
  method: 'fingerprint'
};

/** Ask the phone what unlock tools it has. Web always says none. */
export async function getBiometricCapability(): Promise<BiometricCapability> {
  if (Platform.OS === 'web') return UNAVAILABLE;
  try {
    const LocalAuthentication = await import('expo-local-authentication');
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return UNAVAILABLE;
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const named = labelForAuthTypes(types, Platform.OS);
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return {
      available: true,
      enrolled,
      label: named.label,
      method: named.method
    };
  } catch {
    return UNAVAILABLE;
  }
}

/** Read whether this account turned the lock on. Default is off. */
export async function getBiometricUnlockEnabled(userId: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const raw = await AsyncStorage.getItem(biometricPrefKey(userId));
    return raw === '1';
  } catch {
    return false;
  }
}

/** Remember the Settings toggle for this account on this phone. */
export async function setBiometricUnlockEnabled(
  userId: string,
  on: boolean
): Promise<void> {
  if (!userId) return;
  try {
    if (on) await AsyncStorage.setItem(biometricPrefKey(userId), '1');
    else await AsyncStorage.removeItem(biometricPrefKey(userId));
  } catch {
    // Best-effort: the in-memory toggle still works this session.
  }
}

/**
 * Show the system Face ID / fingerprint sheet. Passcode fallback stays on
 * so a failed face does not force a new SMS.
 */
export async function promptBiometricUnlock(
  promptMessage: string
): Promise<BiometricAttempt> {
  const cap = await getBiometricCapability();
  if (!cap.available || !cap.enrolled) {
    return { ok: false, reason: 'unavailable' };
  }
  try {
    const LocalAuthentication = await import('expo-local-authentication');
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancel',
      fallbackLabel: 'Use passcode',
      disableDeviceFallback: false,
      // SECURITY: require the enrolled face / print, not just "device is on".
      biometricsSecurityLevel: 'strong'
    });
    if (result.success) return { ok: true, method: cap.method };
    const err = 'error' in result ? String(result.error) : '';
    if (err.includes('lockout')) return { ok: false, reason: 'lockout' };
    if (err.includes('cancel') || err.includes('user_fallback')) {
      return { ok: false, reason: 'cancel' };
    }
    return { ok: false, reason: 'fail' };
  } catch {
    return { ok: false, reason: 'fail' };
  }
}
