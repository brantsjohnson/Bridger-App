// ============================================
// WHAT THIS FILE DOES (plain English):
// This is the "buzz track" for the first-open CRT intro. It turns the intro's
// timeline into a precise list of little vibrations (haptics) and plays each one
// at the exact right moment: a tiny tick as letters type, a firmer tap when a
// sentence lands, a deep hit on the big lines, rising sweeps when the screen
// wipes, chaotic jitter during the glitch, and a decaying rumble as the screen
// shuts off.
//
// WHY IT IS BUILT THIS WAY: managed Expo can only ask the phone for a small set
// of preset taps (light / medium / heavy / soft / rigid, plus a tiny "selection"
// tick). It cannot set exact intensity or play a true continuous rumble like
// Core Haptics. So we APPROXIMATE the design spec by choosing the closest preset
// for each moment and by simulating rumbles as a quick run of taps that fade.
// The timing rules from the spec are enforced here (never two taps within ~60ms
// except during the glitch, and a short silence after each deep "big idea" hit).
//
// ACCESSIBILITY: honors Reduce Motion by dropping the chaotic glitch/rumble
// bursts (the calm taps that guide reading still play).
// ============================================
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  CRT_CPS,
  CRT_TIMELINE,
  CRT_SCENE_DUR,
  crtRand,
  type CrtTimeline
} from '../content/crt-intro';

// THIS SECTION DOES: the six "flavors" of tap we can ask the phone for, from the
// gentlest (selection) to the sharpest (rigid).
export type CrtHapticKind =
  | 'selection'
  | 'soft'
  | 'light'
  | 'medium'
  | 'heavy'
  | 'rigid';

// THIS SECTION DOES: one scheduled tap: when to play it (seconds from start),
// which flavor, which scene-group it belongs to, whether it is part of an
// intentional fast "burst" (exempt from the 60ms spacing rule), and whether it
// starts a short "silence after" window (only the deep big-idea hits do).
type CrtPulse = {
  t: number;
  kind: CrtHapticKind;
  group: 'open' | 'startGlitch' | 'collapse' | 'type' | 'sweep' | 'endGlitch' | 'shutdown';
  burst?: boolean;
  holdMs?: number;
};

// THIS SECTION DOES: rank the flavors so that when two taps are too close we can
// keep the stronger, more meaningful one and drop the tiny one.
const PRIORITY: Record<CrtHapticKind, number> = {
  selection: 0,
  soft: 1,
  light: 2,
  medium: 3,
  heavy: 4,
  rigid: 5
};

// THIS SECTION DOES: the spec's core spacing rule. Outside the glitch, never let
// two taps fire within ~60ms of each other.
const MIN_GAP_MS = 60;

// THIS SECTION DOES: play one tap on the real device, picking the best match for
// each platform. On iOS we use the impact/selection generators; on Android we use
// the newer haptic constants (which feel similar and need no VIBRATE permission).
function fire(kind: CrtHapticKind): void {
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
    // Map each flavor to the closest Android haptic constant. These are the
    // permission-free constants Expo recommends over the raw Vibrator API.
    const map: Record<CrtHapticKind, Haptics.AndroidHaptics> = {
      selection: Haptics.AndroidHaptics.Segment_Frequent_Tick,
      soft: Haptics.AndroidHaptics.Segment_Tick,
      light: Haptics.AndroidHaptics.Virtual_Key,
      medium: Haptics.AndroidHaptics.Context_Click,
      heavy: Haptics.AndroidHaptics.Long_Press,
      rigid: Haptics.AndroidHaptics.Confirm
    };
    void Haptics.performAndroidHapticsAsync(map[kind]);
    return;
  }
  // Web / other: no-op (there is no reliable RN web haptic here).
}

// THIS SECTION DOES: turn the whole intro timeline into the raw list of taps,
// following the design spec beat for beat. (Spacing/de-duplication happens after.)
function buildPulses(timeline: CrtTimeline): CrtPulse[] {
  const pulses: CrtPulse[] = [];
  const cps = CRT_CPS;

  // Screen ON: a sharp click as the green line appears, then a short swell that
  // grows as the screen opens, plus a couple of tiny ticks while it settles.
  const o = timeline.openStart;
  pulses.push({ t: o, kind: 'rigid', group: 'open', burst: true });
  pulses.push({ t: o + 0.05, kind: 'soft', group: 'open', burst: true });
  pulses.push({ t: o + 0.18, kind: 'light', group: 'open', burst: true });
  pulses.push({ t: o + 0.3, kind: 'medium', group: 'open', burst: true });
  pulses.push({ t: o + 0.62, kind: 'selection', group: 'open', burst: true });
  pulses.push({ t: o + 0.92, kind: 'selection', group: 'open', burst: true });

  // Beginning glitch: a short scatter of arrhythmic taps while the color bars
  // flicker and tear (the "it glitches at the beginning" ask).
  {
    const gStart = timeline.barsStart + 0.06;
    const gEnd = timeline.barsStart + CRT_SCENE_DUR.bars * 0.85;
    let t = gStart;
    let seed = 11;
    while (t < gEnd) {
      const r = crtRand(seed);
      const kind: CrtHapticKind =
        r < 0.4 ? 'light' : r < 0.7 ? 'medium' : r < 0.9 ? 'heavy' : 'rigid';
      pulses.push({ t, kind, group: 'startGlitch', burst: true });
      t += 0.05 + crtRand(seed + 1) * 0.09; // 50-140ms arrhythmic gaps
      seed += 2;
    }
  }

  // Collapse (bars squash to a line, then a dot): a rumble that fades, then one
  // sharp click at the frame the dot vanishes ("screen off" feel).
  {
    const c = timeline.collapseStart;
    pulses.push({ t: c, kind: 'heavy', group: 'collapse', burst: true });
    pulses.push({ t: c + 0.12, kind: 'medium', group: 'collapse', burst: true });
    pulses.push({ t: c + 0.26, kind: 'light', group: 'collapse', burst: true });
    pulses.push({ t: c + 0.4, kind: 'soft', group: 'collapse', burst: true });
    pulses.push({ t: c + 0.55, kind: 'rigid', group: 'collapse', burst: true });
  }

  // Terminal typing, block by block, line by line.
  timeline.blocks.forEach((block) => {
    // Screen clear (each ">>"): as the old block flares and lifts away, a short
    // upward sweep of three rising taps 40ms apart. Only when there is a block
    // being wiped (every block after the first).
    if (block.blockIndex > 0) {
      const s = block.start;
      pulses.push({ t: s, kind: 'light', group: 'sweep', burst: true });
      pulses.push({ t: s + 0.04, kind: 'medium', group: 'sweep', burst: true });
      pulses.push({ t: s + 0.08, kind: 'heavy', group: 'sweep', burst: true });
    }

    block.lines.forEach((line) => {
      // Big idea: one deep hit on the FIRST character, then a short silence so
      // the pause afterward feels intentional.
      if (line.bigIdea) {
        pulses.push({ t: line.start, kind: 'heavy', group: 'type', holdMs: 250 });
      }

      // Typing ticks: one gentle tick every 3rd character (about 10 per second
      // at 32 cps), so it reads as typing and not a continuous buzz.
      for (let k = 3; k < line.length; k += 3) {
        pulses.push({ t: line.start + k / cps, kind: 'selection', group: 'type' });
      }

      // Landed beat: a slightly firmer tick when the sentence finishes typing.
      pulses.push({ t: line.typeEnd, kind: 'light', group: 'type' });
    });
  });

  // Ending glitch: the whole point is irregular. 6-10 taps scattered across the
  // glitch scene with random gaps and jittering strength, high sharpness.
  {
    const g = timeline.glitchStart;
    const gEnd = g + CRT_SCENE_DUR.glitch;
    let t = g + 0.03;
    let seed = 101;
    while (t < gEnd) {
      const r = crtRand(seed);
      const kind: CrtHapticKind =
        r < 0.25 ? 'light' : r < 0.5 ? 'medium' : r < 0.8 ? 'heavy' : 'rigid';
      pulses.push({ t, kind, group: 'endGlitch', burst: true });
      t += 0.02 + crtRand(seed + 1) * 0.04; // 20-60ms arrhythmic gaps
      seed += 2;
    }
  }

  // Screen off (shutdown): white flash, squash to a line and dot, go dark. A
  // decaying rumble across ~450ms, then one sharp click as the dot disappears.
  {
    const s = timeline.shutdownStart;
    pulses.push({ t: s, kind: 'heavy', group: 'shutdown', burst: true });
    pulses.push({ t: s + 0.08, kind: 'heavy', group: 'shutdown', burst: true });
    pulses.push({ t: s + 0.2, kind: 'medium', group: 'shutdown', burst: true });
    pulses.push({ t: s + 0.33, kind: 'light', group: 'shutdown', burst: true });
    pulses.push({ t: s + 0.45, kind: 'soft', group: 'shutdown', burst: true });
    pulses.push({ t: s + 0.52, kind: 'rigid', group: 'shutdown', burst: true });
  }

  return pulses;
}

// THIS SECTION DOES: apply the spec's spacing rules to the raw list:
// (1) drop tiny taps that fall inside a big-idea's "silence after" window, and
// (2) outside of intentional bursts, never allow two taps within ~60ms (keep the
// stronger one). Bursts (sweeps, glitch, rumbles, the open swell) are left alone
// on purpose because their closeness is the effect.
function spaceOut(pulses: CrtPulse[], reduced: boolean): CrtPulse[] {
  // Reduce Motion: drop the chaotic/rumble bursts, keep the calm reading taps.
  const source = reduced
    ? pulses.filter(
        (p) =>
          p.group !== 'startGlitch' &&
          p.group !== 'endGlitch' &&
          p.group !== 'collapse' &&
          p.group !== 'shutdown'
      )
    : pulses;

  const sorted = [...source].sort((a, b) => a.t - b.t);

  // Collect the "silence after" windows opened by big-idea hits.
  const holds: Array<{ start: number; end: number }> = sorted
    .filter((p) => p.holdMs)
    .map((p) => ({ start: p.t, end: p.t + (p.holdMs ?? 0) / 1000 }));

  const kept: CrtPulse[] = [];
  let lastKeptT = -Infinity;

  for (const p of sorted) {
    if (p.burst) {
      kept.push(p);
      lastKeptT = Math.max(lastKeptT, p.t);
      continue;
    }

    // Silence-after: drop gentle taps that land inside a big-idea hold window
    // (the deep hit itself is what opened the window, so let it keep it).
    const inHold = holds.some(
      (h) => p.t > h.start + 0.0001 && p.t < h.end && PRIORITY[p.kind] < PRIORITY.heavy
    );
    if (inHold) continue;

    // 60ms rule: if this tap is too close to the last kept one, drop it (the
    // taps we drop here are the regular typing ticks, which are fine to thin).
    if ((p.t - lastKeptT) * 1000 < MIN_GAP_MS) continue;

    kept.push(p);
    lastKeptT = p.t;
  }

  return kept;
}

// THIS SECTION DOES: the public "player". You start it once (optionally a little
// way into the piece if the intro was already running), it schedules every tap,
// and you stop it on unmount or during a reading pause so no stray buzzes fire.
// After Next (or the five-second fill) we start again from the next scene.
export class CrtHapticRunner {
  private timers: ReturnType<typeof setTimeout>[] = [];
  private pulses: CrtPulse[];
  private started = false;

  constructor(opts: { reduced: boolean }) {
    this.pulses = spaceOut(buildPulses(CRT_TIMELINE), opts.reduced);
  }

  // Schedule everything from `fromSeconds` onward (default from the very start).
  start(fromSeconds = 0): void {
    if (this.started) return;
    this.started = true;
    const now = Date.now();
    for (const p of this.pulses) {
      const delayMs = (p.t - fromSeconds) * 1000 - (Date.now() - now);
      if (delayMs < 0) continue;
      const timer = setTimeout(() => fire(p.kind), delayMs);
      this.timers.push(timer);
    }
  }

  // Cancel any taps that have not fired yet. After a reading pause we call
  // start() again from a later time, so this also clears the "already started"
  // latch.
  stop(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.started = false;
  }
}
