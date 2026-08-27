// ============================================
// WHAT THIS FILE DOES (plain English):
// Shared helpers for Billy's microphone: recording options that work on
// phone and web, plus turning a finished recording into base64 for Nest.
// ============================================
import { Platform } from 'react-native';
import { RecordingPresets } from 'expo-audio';
import { EncodingType, readAsStringAsync } from 'expo-file-system/legacy';

/** Recording settings. Web needs an explicit mimeType for MediaRecorder. */
export const BILLY_RECORDING_OPTIONS = {
  ...RecordingPresets.HIGH_QUALITY,
  /** So the Listening wave can rise only when Billy actually hears you. */
  isMeteringEnabled: true,
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128_000
  }
};

/**
 * Metering is dBFS (silence ≈ -160, loud speech near 0).
 * Above this = treat as "hearing a voice" for the wave animation.
 */
const HEARING_DBFS = -42;

/** True when the mic hears something louder than quiet room noise. */
export function isHearingVoice(metering?: number): boolean {
  if (metering == null || !Number.isFinite(metering)) return false;
  return metering > HEARING_DBFS;
}

/** Read a finished recording URI into base64 + a filename Whisper accepts. */
export async function recordingToUpload(uri: string): Promise<{
  base64: string;
  filename: string;
}> {
  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    const blob = await res.blob();
    const base64 = await blobToBase64(blob);
    const filename = filenameForMime(blob.type);
    return { base64, filename };
  }

  const base64 = await readAsStringAsync(uri, {
    encoding: EncodingType.Base64
  });
  return { base64, filename: 'voice.m4a' };
}

function filenameForMime(mime: string): string {
  const m = (mime || '').toLowerCase();
  if (m.includes('ogg')) return 'voice.ogg';
  if (m.includes('mp4') || m.includes('m4a')) return 'voice.m4a';
  if (m.includes('wav')) return 'voice.wav';
  if (m.includes('mpeg') || m.includes('mp3')) return 'voice.mp3';
  return 'voice.webm';
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read recording'));
    reader.onloadend = () => {
      const result = String(reader.result ?? '');
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.readAsDataURL(blob);
  });
}
