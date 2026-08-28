// ============================================
// WHAT THIS FILE DOES (plain English):
// This is the "script" and the stopwatch for the first-open CRT intro (the
// retro terminal movie that plays the very first time someone opens Bridger).
// It holds the words that type out on screen, and it works out exactly WHEN
// every scene and every line happens (in seconds from the start). Both the
// picture (CrtIntro.tsx) and the buzz (crt-haptics.ts) read these times so the
// vibration always lands on the right frame.
//
// It is kept separate from the screen so the copy and timing can be tuned
// without touching animation code. (Ported from the Magic Patterns "CRT
// Terminal Animation Sequence" web piece.)
// ============================================

// THIS SECTION DOES: name the three kinds of line so each can look/feel right.
// head = a ">>" section header, body = a normal sentence, emph = a big idea.
export type CrtLineKind = 'head' | 'body' | 'emph';

// THIS SECTION DOES: describe one typed line of the terminal.
export type CrtLine = {
  text: string;
  kind: CrtLineKind;
  /** How long this line owns the screen (typing + the pause after), in seconds. */
  dur: number;
  /** True for the four "gut punch" lines that get a single deep haptic hit. */
  bigIdea?: boolean;
};

// THIS SECTION DOES: a block is one screen of text that shares a ">>" header.
// Each new block wipes the previous one away (that is the "screen clear").
export type CrtBlock = { cue: string; lines: CrtLine[] };

// THIS SECTION DOES: how fast the terminal "types" (characters per second).
// The whole haptic rhythm is tuned around this number, so change it with care.
export const CRT_CPS = 32;

// THIS SECTION DOES: the exact four lines that get the deep "landed" hit on
// their FIRST character (a heavy hit, then silence so it sinks in).
const BIG_IDEAS = new Set<string>([
  'YOU DID.',
  'we got further apart.',
  'But YOU make the connections meaningful.',
  ">> Let's try\nagain."
]);

// THIS SECTION DOES: the actual words, in order. Each block is one screen.
// The numbers are how many seconds that line holds before the next one starts.
const RAW_BLOCKS: CrtBlock[] = [
  {
    cue: 'Memory',
    lines: [
      { text: '>> MEMORY_FOUND:', kind: 'head', dur: 0.95 },
      { text: 'Remember when the internet felt… good?', kind: 'body', dur: 2.3 },
      { text: 'We stayed up too late talking.', kind: 'body', dur: 1.75 },
      { text: 'Found our people.', kind: 'body', dur: 1.25 },
      { text: 'Made distance feel smaller.', kind: 'body', dur: 2.05 }
    ]
  },
  {
    cue: 'Important',
    lines: [
      { text: '>> IMPORTANT:', kind: 'head', dur: 0.85 },
      {
        text: 'The internet never made those connections meaningful.',
        kind: 'body',
        dur: 2.65
      },
      { text: 'YOU DID.', kind: 'emph', dur: 2.2 }
    ]
  },
  {
    cue: 'Changed',
    lines: [
      { text: '>> SOMETHING_CHANGED:', kind: 'head', dur: 1.15 },
      { text: 'Connection became content.', kind: 'body', dur: 1.55 },
      { text: 'Friends became followers.', kind: 'body', dur: 1.55 },
      { text: 'Free time became scrolling.', kind: 'body', dur: 1.55 },
      { text: 'And somehow, with everyone right there...', kind: 'body', dur: 2.15 },
      { text: 'we got further apart.', kind: 'emph', dur: 2.75 }
    ]
  },
  {
    cue: 'Purpose',
    lines: [
      { text: '>> ORIGINAL_PURPOSE:', kind: 'head', dur: 1.15 },
      { text: 'The internet was supposed to help us connect.', kind: 'body', dur: 2.35 },
      { text: 'Not keep us from it.', kind: 'body', dur: 2.05 }
    ]
  },
  {
    cue: 'Bridger',
    lines: [
      { text: '>> BRIDGER_CAN:', kind: 'head', dur: 0.95 },
      { text: 'Remove the ads.', kind: 'body', dur: 1.15 },
      { text: 'Cut the addiction.', kind: 'body', dur: 1.25 },
      { text: 'Delete the noise.', kind: 'body', dur: 1.25 },
      { text: 'But YOU make the connections meaningful.', kind: 'body', dur: 3.1 }
    ]
  },
  {
    cue: 'TryAgain',
    lines: [{ text: ">> Let's try\nagain.", kind: 'emph', dur: 3.0 }]
  }
];

// THIS SECTION DOES: stamp the "big idea" flag onto the four special lines so the
// rest of the app does not have to know the exact strings.
export const CRT_BLOCKS: CrtBlock[] = RAW_BLOCKS.map((block) => ({
  ...block,
  lines: block.lines.map((line) => ({
    ...line,
    bigIdea: BIG_IDEAS.has(line.text)
  }))
}));

// THIS SECTION DOES: how long the non-typing scenes last, in seconds.
// (The color-bar open, the collapse to a dot, the terminal turning on, then
// the glitch tear and the shut-off at the end.)
export const CRT_SCENE_DUR = {
  bars: 1.1,
  collapse: 1.0,
  open: 1.2,
  glitch: 1.4,
  shutdown: 1.2
} as const;

// THIS SECTION DOES: the fully worked-out schedule for one typed line, so the
// picture and the haptics agree on when it starts and when it finishes typing.
export type CrtLineTiming = CrtLine & {
  blockIndex: number;
  lineIndex: number;
  /** Seconds from the very start when this line begins typing. */
  start: number;
  /** Seconds from the very start when the last character has been typed. */
  typeEnd: number;
  /** How many characters this line has. */
  length: number;
};

export type CrtBlockTiming = {
  cue: string;
  blockIndex: number;
  start: number;
  end: number;
  lines: CrtLineTiming[];
};

// THIS SECTION DOES: the master timeline. Every important moment as a number of
// seconds from the start, plus the per-line schedule inside the terminal.
export type CrtTimeline = {
  barsStart: number;
  collapseStart: number;
  openStart: number;
  terminalStart: number;
  glitchStart: number;
  shutdownStart: number;
  end: number;
  blocks: CrtBlockTiming[];
};

// THIS SECTION DOES: actually add up all the durations once, at load time, so
// the rest of the app just reads finished numbers.
function buildTimeline(): CrtTimeline {
  const barsStart = 0;
  const collapseStart = barsStart + CRT_SCENE_DUR.bars;
  const openStart = collapseStart + CRT_SCENE_DUR.collapse;
  const terminalStart = openStart + CRT_SCENE_DUR.open;

  let cursor = terminalStart;
  const blocks: CrtBlockTiming[] = CRT_BLOCKS.map((block, blockIndex) => {
    const blockStart = cursor;
    const lines: CrtLineTiming[] = block.lines.map((line, lineIndex) => {
      const start = cursor;
      const length = line.text.length;
      const typeEnd = start + length / CRT_CPS;
      cursor += line.dur;
      return { ...line, blockIndex, lineIndex, start, typeEnd, length };
    });
    return { cue: block.cue, blockIndex, start: blockStart, end: cursor, lines };
  });

  const glitchStart = cursor;
  const shutdownStart = glitchStart + CRT_SCENE_DUR.glitch;
  const end = shutdownStart + CRT_SCENE_DUR.shutdown;

  return {
    barsStart,
    collapseStart,
    openStart,
    terminalStart,
    glitchStart,
    shutdownStart,
    end,
    blocks
  };
}

// THIS SECTION DOES: the one shared timeline everyone imports.
export const CRT_TIMELINE: CrtTimeline = buildTimeline();

// THIS SECTION DOES: a tiny repeatable "random" number (0..1) from a seed, so
// the glitch looks chaotic but plays back the same every time (and the haptics
// can predict it). Matches the web piece's rnd().
export function crtRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 31.7) * 43758.5453;
  return x - Math.floor(x);
}

// THIS SECTION DOES: clamp a number between a low and high bound (helper).
export function crtClamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

// THIS SECTION DOES: a 0..1 progress value across a time window [a, b] (helper).
export function crtSeg(t: number, a: number, b: number): number {
  return crtClamp((t - a) / Math.max(0.0001, b - a), 0, 1);
}
