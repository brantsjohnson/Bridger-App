// ============================================
// WHAT THIS FILE DOES (plain English):
// Checks the Face ID / Touch ID words and the per-account storage key.
// ============================================
import { describe, expect, it } from 'vitest';
import {
  BIOMETRIC_TYPE,
  biometricPrefKey,
  labelForAuthTypes
} from '../biometric-labels';

describe('labelForAuthTypes', () => {
  it('uses Face ID on iOS when a face sensor is present', () => {
    expect(labelForAuthTypes([BIOMETRIC_TYPE.FACIAL_RECOGNITION], 'ios')).toEqual({
      label: 'Face ID',
      method: 'face'
    });
  });

  it('uses Touch ID on iOS when only a fingerprint sensor is present', () => {
    expect(labelForAuthTypes([BIOMETRIC_TYPE.FINGERPRINT], 'ios')).toEqual({
      label: 'Touch ID',
      method: 'touch'
    });
  });

  it('prefers face when both face and fingerprint exist', () => {
    expect(
      labelForAuthTypes(
        [BIOMETRIC_TYPE.FINGERPRINT, BIOMETRIC_TYPE.FACIAL_RECOGNITION],
        'ios'
      ).method
    ).toBe('face');
  });

  it('uses fingerprint wording on Android', () => {
    expect(labelForAuthTypes([BIOMETRIC_TYPE.FINGERPRINT], 'android')).toEqual({
      label: 'fingerprint',
      method: 'touch'
    });
  });
});

describe('biometricPrefKey', () => {
  it('scopes the flag to one account', () => {
    expect(biometricPrefKey('user-1')).toBe('bridger.biometric.unlock.user-1');
  });
});
