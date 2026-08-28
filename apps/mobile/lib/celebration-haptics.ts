// ============================================
// WHAT THIS FILE DOES (plain English):
// The buzz patterns for little celebrations in the app. When emoji explode
// (quizzes, onboarding Continue, hobby picks), five quick pops fire in a random
// "pew pew pew pew pew!" rhythm. When two friends connect and the Reveal orbs
// slide together, a longer arc builds, peaks at the merge, then fades out.
//
// ACCESSIBILITY: both patterns stay quiet when Reduce Motion is on, same as the
// visual bursts and the orb animation skip.
// ============================================
import { AccessibilityInfo, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

type TapKind = 'selection' | 'soft' | 'light' | 'medium' | 'heavy' | 'rigid';

// THIS SECTION DOES: play one preset tap on iOS or Android (web stays silent).
function fireTap(kind: TapKind): void {
  if (Platform.OS === 'ios') {
    if (kind === 'selection') {
      void Haptics.selectionAsync();
      return;
    }
    const style =
      kind === 'soft'
        ? Haptics.ImpactFeedbackStyle.Soft
        : kind === 'light'
          ? Haptics.ImpactFeedbackStyle.Light
          : kind === 'medium'
            ? Haptics.ImpactFeedbackStyle.Medium
            : kind === 'heavy'
              ? Haptics.ImpactFeedbackStyle.Heavy
              : Haptics.ImpactFeedbackStyle.Rigid;
    void Haptics.impactAsync(style);
    return;
  }
  if (Platform.OS === 'android') {
    const map: Record<TapKind, Haptics.AndroidHaptics> = {
      selection: Haptics.AndroidHaptics.Segment_Frequent_Tick,
      soft: Haptics.AndroidHaptics.Segment_Tick,
      light: Haptics.AndroidHaptics.Virtual_Key,
      medium: Haptics.AndroidHaptics.Context_Click,
      heavy: Haptics.AndroidHaptics.Long_Press,
      rigid: Haptics.AndroidHaptics.Confirm
    };
    void Haptics.performAndroidHapticsAsync(map[kind]);
  }
}

// THIS SECTION DOES: five fast fireworks pops in a random mix (emoji burst moment).
export function fireEmojiBurstHaptics(): void {
  if (Platform.OS === 'web') return;

  void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
    if (reduced) return;

    const pool: TapKind[] = ['selection', 'light', 'medium', 'light', 'rigid'];
    const picks: TapKind[] = [];
    for (let i = 0; i < 5; i++) {
      picks.push(pool[Math.floor(Math.random() * pool.length)]!);
    }

    let delay = 0;
    for (const kind of picks) {
      const at = delay;
      setTimeout(() => fireTap(kind), at);
      delay += 42 + Math.random() * 78;
    }
  });
}

/** Timings line up with RevealOrbs: float in (620ms), pause (260ms), merge (520ms). */
const VENN_APPROACH_MS = [
  { t: 40, kind: 'soft' as TapKind },
  { t: 160, kind: 'selection' as TapKind },
  { t: 300, kind: 'light' as TapKind },
  { t: 440, kind: 'light' as TapKind },
  { t: 560, kind: 'medium' as TapKind }
];

const VENN_CLIMAX_MS = [
  { t: 880, kind: 'heavy' as TapKind },
  { t: 928, kind: 'rigid' as TapKind },
  { t: 972, kind: 'medium' as TapKind }
];

const VENN_FADE_MS = [
  { t: 1080, kind: 'light' as TapKind },
  { t: 1220, kind: 'soft' as TapKind },
  { t: 1360, kind: 'selection' as TapKind }
];

// THIS SECTION DOES: the long merge arc when Reveal circles meet and dissolve.
export function runVennMergeHaptics(reduced: boolean): () => void {
  if (Platform.OS === 'web' || reduced) return () => {};

  const timers: ReturnType<typeof setTimeout>[] = [];
  const schedule = (ms: number, kind: TapKind) => {
    timers.push(setTimeout(() => fireTap(kind), ms));
  };

  for (const step of [...VENN_APPROACH_MS, ...VENN_CLIMAX_MS, ...VENN_FADE_MS]) {
    schedule(step.t, step.kind);
  }

  return () => {
    for (const id of timers) clearTimeout(id);
  };
}

// THIS SECTION DOES: the "fireworks show" buzz for the post-onboarding welcome.
// Each shell going up + bursting is a heavy/rigid "boom", and most booms trail a
// couple of light "crackle" taps, so it feels like real fireworks over ~3.5s.
export function fireFireworksHaptics(): void {
  if (Platform.OS === 'web') return;

  void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
    if (reduced) return;

    // When each shell bursts (ms from start). Lines up with the visual shells.
    const booms = [0, 360, 720, 1120, 1560, 2050, 2600, 3200];
    for (const at of booms) {
      // The boom itself: a big hit, randomly heavy or rigid so it is not robotic.
      setTimeout(() => fireTap(Math.random() < 0.5 ? 'heavy' : 'rigid'), at);
      // The crackle: quick little sparks right after most booms.
      if (Math.random() < 0.72) {
        setTimeout(() => fireTap('light'), at + 70);
        setTimeout(() => fireTap('selection'), at + 130);
      }
    }
  });
}

/**
 * One excited tap when a word pops onto the taste-intro line. Later words hit
 * a little harder so the line builds energy toward the end.
 */
export function fireWordRevealHaptic(index: number, total: number): void {
  if (Platform.OS === 'web') return;

  void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
    if (reduced) return;
    const last = index >= total - 1;
    const mid = index >= Math.floor(total / 2);
    fireTap(last ? 'rigid' : mid ? 'medium' : 'light');
  });
}
