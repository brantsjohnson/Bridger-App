// ============================================
// WHAT THIS FILE DOES (plain English):
// This is the retro "old TV terminal" movie that plays ONCE, the very first time
// someone opens Bridger. Color bars flash on (and glitch / tear), the picture
// collapses into a dot, a green terminal boots up and types a short story about
// the internet, the screen tears apart in a glitch, then shuts off, and we hand
// the person to the sign-in screen.
//
// It draws everything itself (colored bars, typed green text, a glitch, screen
// glow) using plain Views + a little SVG for the CRT scanlines and dark corners.
// A single clock (the `t` seconds counter) drives the whole thing, and the same
// clock start is handed to the haptics engine so the vibrations land on the exact
// right frame.
//
// The opening SMPTE bars and the ending terminal both reuse one GlitchLayer
// (ported from the Magic Patterns "CRT Terminal Animation Sequence" web piece):
// shake, skew, red/cyan color-split copies, and horizontal tear slices.
//
// ACCESSIBILITY: if the phone has Reduce Motion on, we drop the shake, glitch,
// flicker, and collapse drama and just calmly cross-fade + type the words.
// ============================================
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  Platform,
  StatusBar,
  Text,
  useWindowDimensions,
  View
} from 'react-native';
import Svg, { Defs, Pattern, Rect, RadialGradient, Stop } from 'react-native-svg';
import { dismissSurface, openSurface } from '@bridger/shared';
import {
  CRT_CPS,
  CRT_TIMELINE,
  crtClamp,
  crtRand,
  crtSeg,
  type CrtBlockTiming
} from '../../content/crt-intro';
import { CrtHapticRunner } from '../../lib/crt-haptics';

// THIS SECTION DOES: the green "phosphor" glow colors of the terminal.
const PHOS = {
  hi: '#39ff6a',
  mid: 'rgba(57,255,106,0.82)',
  dim: 'rgba(57,255,106,0.4)',
  glow: 'rgba(57,255,106,0.7)'
};

// THIS SECTION DOES: the monospace font so the terminal looks like a real one.
const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

// THIS SECTION DOES: the SMPTE test-pattern colors (top bars and mid strip).
const BARS_TOP = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'];
const BARS_MID = ['#0000c0', '#131313', '#c000c0', '#131313', '#00c0c0', '#131313', '#c0c0c0'];

// THIS SECTION DOES: three easing curves (how motion speeds up / slows down).
function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}
function easeInOutQuad(x: number): number {
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}
function easeOutBack(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

// THIS SECTION DOES: move a value from `from` to `to` across a time window,
// following an easing curve (used for every scale / fade below).
function move(
  from: number,
  to: number,
  a: number,
  b: number,
  t: number,
  ease: (x: number) => number
): number {
  return from + (to - from) * ease(crtSeg(t, a, b));
}

// THIS SECTION DOES: decide the final line breaks for a monospace sentence before
// any typing starts. Words that belong on row 2 are placed there from the first
// character, so they never type on row 1 and then jump down mid-word.
// (Same idea as the Magic Patterns wrapText helper: spaces that wrap become
// newlines, so the typed string stays the same length as the original.)
function wrapMonoLine(text: string, maxChars: number): string {
  if (maxChars < 4 || text.length <= maxChars) return text;
  const rows: string[] = [];
  let row = '';
  for (const word of text.split(' ')) {
    const add = row ? `${row} ${word}` : word;
    if (add.length > maxChars && row) {
      rows.push(row);
      row = word;
    } else {
      row = add;
    }
  }
  if (row) rows.push(row);
  return rows.join('\n');
}

type CrtIntroProps = {
  /** Called once when the movie finishes. There is no skip: it must be watched. */
  onDone: () => void;
};

export function CrtIntro({ onDone }: CrtIntroProps) {
  const { width: W, height: H } = useWindowDimensions();
  const [t, setT] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [ready, setReady] = useState(false);

  // Keep the moving parts in refs so the animation loop never gets stale values.
  const startRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastSetRef = useRef(0);
  const doneRef = useRef(false);
  const hapticsRef = useRef<CrtHapticRunner | null>(null);

  const TL = CRT_TIMELINE;

  // THIS SECTION DOES: read the Reduce Motion setting before we start, so the
  // very first frame is already the right (calm or full) version.
  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((rm) => {
      if (cancelled) return;
      setReduceMotion(rm);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // THIS SECTION DOES: this is its own analytics "surface" (auto-play, but we
  // still measure how long people stay and whether they skip).
  useEffect(() => {
    openSurface('auth', 'welcome');
    return () => dismissSurface('auth');
  }, []);

  // THIS SECTION DOES: the heartbeat. Once we know the motion setting, start the
  // clock + the haptics together, and stop everything at the end.
  useEffect(() => {
    if (!ready) return;

    const runner = new CrtHapticRunner({ reduced: reduceMotion });
    hapticsRef.current = runner;
    startRef.current = Date.now();
    runner.start(0);

    const loop = () => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      // Update the picture ~33 times a second (smooth enough, easy on the phone).
      if (elapsed - lastSetRef.current >= 0.03) {
        lastSetRef.current = elapsed;
        setT(elapsed);
      }
      if (elapsed >= TL.end) {
        finish();
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      runner.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, reduceMotion]);

  // THIS SECTION DOES: end the movie exactly once, only when it reaches the end,
  // and hand control to whoever mounted us (the welcome route sends people to
  // sign-in). There is no skip: the intro plays all the way through.
  function finish() {
    if (doneRef.current) return;
    doneRef.current = true;
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    hapticsRef.current?.stop();
    onDone();
  }

  const motion = !reduceMotion;

  // ---- Derived scene values (all computed from the single clock `t`) ----
  const cCol = TL.collapseStart;
  const cOpen = TL.openStart;
  const cGl = TL.glitchStart;
  const cSh = TL.shutdownStart;

  // Bars tube: sits still, then squashes to a line and a dot at the collapse.
  const barsSY = motion ? (t < cCol ? 1 : move(1, 0.004, cCol, cCol + 0.38, t, easeInOutQuad)) : 1;
  const barsSX = motion
    ? t < cCol + 0.36
      ? 1
      : move(1, 0.02, cCol + 0.36, cCol + 0.68, t, easeInOutQuad)
    : 1;
  const barsOp = motion
    ? t < cCol + 0.62
      ? 1
      : 1 - crtSeg(t, cCol + 0.62, cCol + 0.9)
    : 1 - crtSeg(t, cCol, cCol + 0.3); // reduced: just fade the bars out
  const barsVisible = t < cOpen + 0.1;

  // Terminal tube: opens up (green), holds, then collapses again at shutdown.
  const termSY = motion
    ? t < cOpen + 0.3
      ? 0.004
      : t < cSh
        ? move(0.004, 1, cOpen + 0.3, cOpen + 0.8, t, easeOutBack)
        : move(1, 0.004, cSh + 0.12, cSh + 0.5, t, easeInOutQuad)
    : 1;
  const termSX = motion
    ? t < cSh + 0.46
      ? 1
      : move(1, 0.02, cSh + 0.46, cSh + 0.78, t, easeInOutQuad)
    : 1;
  const termOpBase = (t > cOpen + 0.28 ? 1 : 0) * (t < cSh + 0.72 ? 1 : 0);
  // Reduced motion cross-fades the terminal in/out instead of scaling.
  const termOp = motion
    ? termOpBase
    : crtSeg(t, cOpen, cOpen + 0.4) * (t < cSh ? 1 : 1 - crtSeg(t, cSh, cSh + 0.4));
  const termVisible = t > cOpen && t < cSh + 0.9;

  // A quick brightness "flicker" right after the terminal turns on.
  const flicker =
    motion && t < cOpen + 1.2
      ? 1 - (crtRand(Math.floor(t * 20)) - 0.5) * 0.35 * (1 - crtSeg(t, cOpen + 0.8, cOpen + 1.2))
      : 1;

  // THIS SECTION DOES: how hard the picture is tearing right now.
  // Opening bars flicker/tear the whole time they are up (matching the web piece);
  // the terminal gets a heavy tear only at the end.
  const barsGlitch = motion
    ? t < cCol
      ? (crtRand(Math.floor(t * 3)) > 0.62 ? 0.75 : 0.12) + (t > cCol - 0.5 ? 0.5 : 0)
      : 0
    : 0;
  const termGlitch = motion
    ? crtClamp(
        t > cGl
          ? crtSeg(t, cGl, cGl + 0.9) * 0.8 + (t > cGl + 0.9 ? 0.6 : 0)
          : crtRand(Math.floor(t * 1.7)) > 0.985
            ? 0.25
            : 0,
        0,
        1.3
      )
    : 0;
  // Scanline opacity bumps a little whenever either scene is glitching.
  const glitchPeak = Math.max(barsGlitch, termGlitch);

  // The bright horizontal "beam" lines during collapse / open / shutdown.
  const collapseBeamOp =
    motion && t > cCol + 0.12 ? 1 - crtSeg(t, cCol + 0.6, cCol + 0.95) : 0;
  const openBeamOp = motion && t > cOpen && t < cOpen + 0.55 ? 1 - crtSeg(t, cOpen + 0.34, cOpen + 0.55) : 0;
  const openSX = motion ? move(0.02, 1, cOpen + 0.02, cOpen + 0.34, t, easeOutCubic) : 1;
  const shutdownBeamOp = motion && t > cSh + 0.22 ? 1 - crtSeg(t, cSh + 0.5, cSh + 0.8) : 0;

  // The white flash the instant the screen shuts off.
  const whiteFlash = t > cSh ? (1 - crtSeg(t, cSh, cSh + 0.16)) * 0.92 : 0;

  // Which block of text is on screen right now, and is a previous one wiping away?
  const activeIndex = useMemo(() => {
    let idx = -1;
    for (let i = 0; i < TL.blocks.length; i++) if (t >= TL.blocks[i].start) idx = i;
    return idx;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  const pad = Math.round(W * 0.07);
  // How wide the typed words can be (screen minus the side padding).
  const textWidth = Math.max(40, W - pad * 2);

  // Font sizes scale a little with the screen width.
  const scale = W / 390;
  const fontFor = (kind: 'head' | 'body' | 'emph') =>
    kind === 'head' ? 15 * scale : kind === 'emph' ? 29 * scale : 20.5 * scale;
  const letterFor = (kind: 'head' | 'body' | 'emph') => (kind === 'head' ? 1.2 : 0.2);

  // THIS SECTION DOES: draw one block of typed lines. Each sentence is pre-wrapped
  // to its final rows, then we type through that string so wrapping never jumps.
  const renderBlock = (
    block: CrtBlockTiming,
    opts: { fading: boolean; showCursor: boolean }
  ) =>
    block.lines.map((line, li) => {
      const chars = opts.fading
        ? line.length
        : crtClamp(Math.floor((t - line.start) * CRT_CPS), 0, line.length);
      const started = opts.fading || t >= line.start - 0.02;
      if (!started || (chars <= 0 && !opts.fading)) return null;

      const isTyping = !opts.fading && chars < line.length && t >= line.start;
      const isLast = li === block.lines.length - 1;
      const showCursor = opts.showCursor && !opts.fading && (isTyping || (isLast && activeIndex === block.blockIndex));
      const blinkOn = isTyping ? true : Math.floor(t * 2.2) % 2 === 0;
      const bright = line.kind === 'head' || line.kind === 'emph';
      const fs = fontFor(line.kind);
      const letterSpacing = letterFor(line.kind);
      const color = bright ? PHOS.hi : PHOS.mid;
      // Monospace character width estimate (matches the web piece's ~0.635 * fs).
      const charW = fs * 0.6 + letterSpacing;
      const maxChars = Math.max(8, Math.floor(textWidth / charW));
      const wrapped = wrapMonoLine(line.text, maxChars);
      const visible = wrapped.slice(0, chars);

      return (
        <View
          key={`${block.blockIndex}-${li}`}
          style={{ marginTop: li === 0 ? 0 : fs * 0.45, width: textWidth }}
        >
          <Text
            style={{
              fontFamily: MONO,
              fontSize: fs,
              lineHeight: fs * 1.34,
              fontWeight: line.kind === 'emph' ? '600' : '400',
              letterSpacing,
              color,
              textShadowColor: PHOS.glow,
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: fs * 0.28
            }}
          >
            {visible}
            {showCursor && blinkOn ? (
              <Text
                style={{
                  color: 'transparent',
                  backgroundColor: color,
                  fontSize: fs,
                  lineHeight: fs * 1.34
                }}
              >
                {'█'}
              </Text>
            ) : null}
          </Text>
        </View>
      );
    });

  // THIS SECTION DOES: the terminal's text area (current block + the wiping block).
  const terminalContent = () => {
    if (activeIndex < 0) return null;
    const active = TL.blocks[activeIndex];
    const clearP = motion ? easeOutCubic(crtSeg(t, active.start, active.start + 0.3)) : 1;
    const prev = activeIndex > 0 ? TL.blocks[activeIndex - 1] : null;
    const showPrev = motion && prev && clearP < 1;

    return (
      <>
        {showPrev ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: pad,
              right: pad,
              top: 0,
              bottom: 0,
              justifyContent: 'center',
              opacity: 1 - clearP,
              transform: [{ translateY: -clearP * 180 }]
            }}
          >
            {renderBlock(prev as CrtBlockTiming, { fading: true, showCursor: false })}
          </View>
        ) : null}
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: pad, right: pad, top: 0, bottom: 0, justifyContent: 'center' }}
        >
          {renderBlock(active, { fading: false, showCursor: true })}
        </View>
      </>
    );
  };

  // THIS SECTION DOES: the plain SMPTE color-bar picture (no glitch yet; GlitchLayer
  // asks for a fresh copy each time so tears / color-split can each own one).
  const renderBarsPicture = () => (
    <View style={StyleFill}>
      <View style={{ flex: 0.67, flexDirection: 'row' }}>
        {BARS_TOP.map((c, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: c }} />
        ))}
      </View>
      <View style={{ flex: 0.08, flexDirection: 'row' }}>
        {BARS_MID.map((c, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: c }} />
        ))}
      </View>
      <View style={{ flex: 0.25, flexDirection: 'row' }}>
        <View style={{ flex: 5, backgroundColor: '#00214c' }} />
        <View style={{ flex: 5, backgroundColor: '#ffffff' }} />
        <View style={{ flex: 5, backgroundColor: '#32006a' }} />
        <View style={{ flex: 5, backgroundColor: '#131313' }} />
        <View style={{ flex: 2, backgroundColor: '#070707' }} />
        <View style={{ flex: 2, backgroundColor: '#131313' }} />
        <View style={{ flex: 2, backgroundColor: '#1d1d1d' }} />
      </View>
    </View>
  );

  // THIS SECTION DOES: the green terminal picture (backdrop + typed words).
  const renderTerminalPicture = () => (
    <View style={StyleFill}>
      <View style={{ ...StyleFill, backgroundColor: '#04140a' }} />
      {terminalContent()}
    </View>
  );

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  }

  return (
    <View
      accessibilityLabel="Bridger intro"
      accessibilityRole="none"
      style={{ flex: 1, backgroundColor: '#000', overflow: 'hidden' }}
    >
      <StatusBar hidden />

      <View style={{ flex: 1 }}>
        {/* --- COLOR BARS (SMPTE test pattern, with opening glitch) --- */}
        {barsVisible ? (
          <View
            pointerEvents="none"
            style={{
              ...StyleFill,
              opacity: barsOp,
              transform: [{ scaleX: barsSX }, { scaleY: barsSY }]
            }}
          >
            <GlitchLayer g={barsGlitch} t={t} width={W} height={H} render={renderBarsPicture} />
          </View>
        ) : null}

        {/* --- COLLAPSE / OPEN / SHUTDOWN BEAM LINES (bright horizontal streaks) --- */}
        {collapseBeamOp > 0 ? <BeamLine W={W} sx={barsSX} color="#ffffff" opacity={collapseBeamOp} /> : null}
        {openBeamOp > 0 ? <BeamLine W={W} sx={openSX} color={PHOS.hi} opacity={openBeamOp} /> : null}
        {shutdownBeamOp > 0 ? <BeamLine W={W} sx={termSX} color="#ffffff" opacity={shutdownBeamOp} /> : null}

        {/* --- GREEN TERMINAL (the typed story) --- */}
        {termVisible ? (
          <View
            pointerEvents="none"
            style={{
              ...StyleFill,
              opacity: termOp * (motion ? crtClamp(flicker, 0, 1) : 1),
              transform: [{ scaleX: termSX }, { scaleY: termSY }]
            }}
          >
            <GlitchLayer g={termGlitch} t={t} width={W} height={H} render={renderTerminalPicture} />
          </View>
        ) : null}

        {/* --- WHITE SHUTOFF FLASH --- */}
        {whiteFlash > 0 ? (
          <View pointerEvents="none" style={{ ...StyleFill, backgroundColor: '#fff', opacity: whiteFlash }} />
        ) : null}
      </View>

      {/* --- CRT GLASS: scanlines + dark corners (never moves, never taps) --- */}
      <Svg
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, top: 0 }}
        width={W}
        height={H}
      >
        <Defs>
          <Pattern id="scan" width={3} height={3} patternUnits="userSpaceOnUse">
            <Rect x={0} y={0} width={3} height={1} fill="#000" opacity={0.5} />
          </Pattern>
          <RadialGradient id="vign" cx="50%" cy="50%" r="75%">
            <Stop offset="52%" stopColor="#000" stopOpacity={0} />
            <Stop offset="100%" stopColor="#000" stopOpacity={0.82} />
          </RadialGradient>
        </Defs>
        {motion ? <Rect x={0} y={0} width={W} height={H} fill="url(#scan)" opacity={0.34 + glitchPeak * 0.15} /> : null}
        <Rect x={0} y={0} width={W} height={H} fill="url(#vign)" />
      </Svg>
    </View>
  );
}

// THIS SECTION DOES: a shorthand for "fill the whole parent" (used a lot above).
const StyleFill = {
  position: 'absolute' as const,
  left: 0,
  top: 0,
  right: 0,
  bottom: 0
};

// THIS SECTION DOES: the CRT "glitch" look from the original web piece.
// When g is near 0 we just show the picture. When g rises we:
//   1) shake + lightly skew the main picture
//   2) draw red and cyan color-split copies offset left / right
//   3) cut a few horizontal tear slices that slide sideways
//   4) sprinkle a faint noise of thin white scan stripes
// `render` is called once per copy so each tear / split owns a fresh picture tree.
function GlitchLayer({
  g,
  t,
  width,
  height,
  render
}: {
  g: number;
  t: number;
  width: number;
  height: number;
  render: () => ReactNode;
}) {
  if (g <= 0.001) {
    return <View style={StyleFill}>{render()}</View>;
  }

  const step = Math.floor(t * 14);
  const jx = (crtRand(step * 2.1) - 0.5) * 22 * g;
  const skewDeg = (crtRand(step * 5.5) - 0.5) * 1.6 * g;

  // THIS SECTION DOES: up to five horizontal "torn" bands, each a window onto
  // a sideways-shifted copy of the same picture.
  const slices = [0, 1, 2, 3, 4].map((k) => {
    const r1 = crtRand(step * 7.7 + k * 3.3);
    const r2 = crtRand(step * 11.3 + k * 5.1);
    const r3 = crtRand(step * 3.1 + k);
    if (r3 > 0.45 + (1 - g) * 0.5) return null;
    const top = r1 * 0.88 * height;
    const hgt = ((3 + r2 * 12) / 100) * height;
    const dx = (r2 - 0.5) * 260 * g;
    return (
      <View
        key={`slice-${k}`}
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          width,
          top,
          height: Math.max(2, hgt),
          overflow: 'hidden',
          transform: [{ translateX: dx }]
        }}
      >
        <View style={{ position: 'absolute', left: 0, top: -top, width, height }}>{render()}</View>
      </View>
    );
  });

  // THIS SECTION DOES: a few random thin white stripes (stand-in for the web
  // piece's repeating-linear-gradient noise; keep the count small for phones).
  const noiseLines = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
    const ry = crtRand(step * 9.1 + k * 2.7);
    const rh = 1 + crtRand(step * 4.3 + k) * 2;
    return (
      <View
        key={`noise-${k}`}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: ry * height,
          height: rh,
          backgroundColor: 'rgba(255,255,255,0.5)'
        }}
      />
    );
  });

  return (
    <View style={StyleFill}>
      {/* Main shaken / skewed picture. */}
      <View
        style={{
          ...StyleFill,
          transform: [{ translateX: jx }, { skewX: `${skewDeg}deg` }]
        }}
      >
        {render()}
      </View>
      {/* Red color-split copy (offset left). */}
      <View
        pointerEvents="none"
        style={{
          ...StyleFill,
          opacity: 0.55 * g,
          transform: [{ translateX: -14 * g - jx }]
        }}
      >
        {render()}
        <View
          style={{
            ...StyleFill,
            backgroundColor: '#ff3b00',
            opacity: 0.45,
            mixBlendMode: 'screen'
          }}
        />
      </View>
      {/* Cyan color-split copy (offset right). */}
      <View
        pointerEvents="none"
        style={{
          ...StyleFill,
          opacity: 0.55 * g,
          transform: [{ translateX: 16 * g }]
        }}
      >
        {render()}
        <View
          style={{
            ...StyleFill,
            backgroundColor: '#00e8ff',
            opacity: 0.45,
            mixBlendMode: 'screen'
          }}
        />
      </View>
      {slices}
      {/* Faint scan-noise overlay. */}
      <View pointerEvents="none" style={{ ...StyleFill, opacity: 0.16 * g }}>
        {noiseLines}
      </View>
    </View>
  );
}

// THIS SECTION DOES: one bright horizontal beam line (the CRT "scan line" streak
// you see as the picture collapses to or opens from a single line).
function BeamLine({
  W,
  sx,
  color,
  opacity
}: {
  W: number;
  sx: number;
  color: string;
  opacity: number;
}) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: W * crtClamp(sx, 0.02, 1),
        height: 8,
        marginLeft: (-W * crtClamp(sx, 0.02, 1)) / 2,
        marginTop: -4,
        backgroundColor: color,
        opacity,
        borderRadius: 8,
        shadowColor: color,
        shadowOpacity: 0.9,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 0 }
      }}
    />
  );
}
