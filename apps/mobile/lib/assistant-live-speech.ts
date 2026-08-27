// ============================================
// WHAT THIS FILE DOES (plain English):
// Live words while you talk to Billy. On web browsers that support it, we use
// the built-in speech recognizer so the Listening pill can type what it hears.
// On native phones this helper is a no-op for now (final words still come from
// Whisper when the clip is sent). Transcript text is never logged to analytics.
// ============================================
import { Platform } from 'react-native';

type LiveSpeechHandle = {
  /** Stop recognizing without throwing. */
  stop: () => void;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((ev: { results: ArrayLike<{ 0: { transcript: string }; isFinal?: boolean }> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechWindow = {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

/**
 * Start live captions for the Listening UI.
 * Calls onPartial with the best words so far (interim + final glued together).
 */
export function startLiveSpeech(onPartial: (text: string) => void): LiveSpeechHandle | null {
  if (Platform.OS !== 'web') return null;
  const w = globalThis as unknown as SpeechWindow;
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;

  let finals = '';
  let stopped = false;
  const rec = new Ctor();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = 'en-US';

  // THIS SECTION DOES: glue final phrases + the current interim line for the UI
  rec.onresult = (ev) => {
    let interim = '';
    for (let i = 0; i < ev.results.length; i++) {
      const row = ev.results[i];
      if (!row) continue;
      const piece = String(row[0]?.transcript ?? '').trim();
      if (!piece) continue;
      if (row.isFinal) {
        finals = `${finals} ${piece}`.trim();
      } else {
        interim = piece;
      }
    }
    const next = `${finals} ${interim}`.trim();
    if (next) onPartial(next);
  };

  // Keep going if the browser pauses between phrases (until we stop()).
  rec.onend = () => {
    if (stopped) return;
    try {
      rec.start();
    } catch {
      // Already started or blocked — ignore.
    }
  };
  rec.onerror = () => {
    // Recognition can fail quietly; Whisper still runs on send.
  };

  try {
    rec.start();
  } catch {
    return null;
  }

  return {
    stop: () => {
      stopped = true;
      try {
        rec.onend = null;
        rec.abort();
      } catch {
        try {
          rec.stop();
        } catch {
          // ignore
        }
      }
    }
  };
}
