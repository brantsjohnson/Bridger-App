// ============================================
// WHAT THIS FILE DOES (plain English):
// The News tab coming-soon page in the Magic Patterns web preview.
// Dark intro canvas + spinning pixel newspaper + COMING SOON copy.
// Matches the mobile News tab; header and tab bar stay the shared chrome.
// ============================================
import { useMemo } from 'react';
import { PixelHeading, Screen, ScreenBody, ScreenHeader } from '../../../../packages/ui';

const SCALE = 10;
const GRID_W = 34;
const GRID_H = 26;
const PAPER = '#f4f1e8';
const INK = '#141414';
const MID = '#8f8a7d';
const SHADE = '#c9c4b6';

type Pixel = { x: number; y: number; c: string };

const FONT: Record<string, string[]> = {
  N: ['10001', '11001', '11001', '10101', '10011', '10011', '10001'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  S: ['01110', '10001', '10000', '01110', '00001', '10001', '01110']
};

// THIS SECTION DOES: paint every square that makes the newspaper stack.
function buildPixels(): Pixel[] {
  const px: Pixel[] = [];
  const set = (x: number, y: number, c: string) => {
    px.push({ x, y, c });
  };

  for (let y = 1; y < GRID_H - 4; y++) {
    for (let x = 5; x < GRID_W - 1; x++) {
      set(x, y, y === 1 ? MID : y === 2 ? PAPER : SHADE);
    }
  }
  for (let y = 2; y < GRID_H - 3; y++) {
    for (let x = 3; x < GRID_W - 3; x++) {
      set(x, y, y === 2 ? MID : y === 3 ? PAPER : SHADE);
    }
  }
  for (let y = 3; y < GRID_H - 2; y++) {
    for (let x = 1; x < GRID_W - 5; x++) {
      set(x, y, PAPER);
    }
  }
  for (let x = 1; x < GRID_W - 5; x++) {
    set(x, 3, MID);
    set(x, GRID_H - 2, MID);
  }
  for (let y = 3; y < GRID_H - 1; y++) {
    set(GRID_W - 6, y, MID);
  }
  for (let x = 3; x < GRID_W - 8; x++) {
    set(x, 5, INK);
  }
  'NEWS'.split('').forEach((ch, n) => {
    FONT[ch].forEach((row, ry) => {
      row.split('').forEach((v, rx) => {
        if (v === '1') set(4 + n * 6 + rx, 7 + ry, INK);
      });
    });
  });
  for (let x = 3; x < GRID_W - 8; x++) {
    set(x, 15, INK);
  }
  for (let x = 3; x < GRID_W - 9; x += 2) {
    set(x, 17, MID);
  }
  for (let y = 19; y < 24; y++) {
    for (let x = 3; x < 13; x++) {
      set(x, y, (x + y) % 2 ? INK : MID);
    }
  }
  [19, 21, 23].forEach((y, i) => {
    for (let x = 15; x < 25 - i * 2; x++) {
      set(x, y, INK);
    }
  });
  [20, 22].forEach((y) => {
    for (let x = 15; x < 27; x++) {
      set(x, y, MID);
    }
  });

  const map = new Map<string, Pixel>();
  for (const p of px) {
    map.set(`${p.x},${p.y}`, p);
  }
  return Array.from(map.values());
}

function NewsPaperGraphic() {
  const pixels = useMemo(() => buildPixels(), []);

  return (
    <div
      aria-hidden="true"
      className="relative"
      style={{
        width: GRID_W * SCALE,
        height: GRID_H * SCALE,
        perspective: 1100
      }}
    >
      <style>{`
        @keyframes newsPressCycle {
          0% { transform: rotateY(540deg) rotateZ(-18deg) scale(0); opacity: 0; }
          12% { opacity: 0.4; }
          18% { transform: rotateY(0deg) rotateZ(-3deg) scale(1); opacity: 1; }
          22% { transform: rotateY(0deg) rotateZ(-3deg) scale(1.04); opacity: 1; }
          80% { transform: rotateY(0deg) rotateZ(-3deg) scale(1); opacity: 1; }
          92% { opacity: 0.35; }
          100% { transform: rotateY(-540deg) rotateZ(14deg) scale(0); opacity: 0; }
        }
        @keyframes newsPxIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .news-paper-spin { animation: none !important; transform: rotateZ(-3deg) scale(1) !important; }
          .news-paper-px { animation: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
      <div
        className="news-paper-spin"
        style={{
          width: GRID_W * SCALE,
          height: GRID_H * SCALE,
          transformStyle: 'preserve-3d',
          animation: 'newsPressCycle 9s cubic-bezier(0.2, 0.8, 0.2, 1) infinite',
          filter: 'drop-shadow(0 18px 26px rgba(0,0,0,0.75))'
        }}
      >
        <div
          style={{
            position: 'relative',
            width: GRID_W * SCALE,
            height: GRID_H * SCALE
          }}
        >
          {pixels.map((p) => (
            <div
              key={`${p.x}-${p.y}`}
              className="news-paper-px"
              style={{
                position: 'absolute',
                left: p.x * SCALE,
                top: p.y * SCALE,
                width: SCALE,
                height: SCALE,
                background: p.c,
                animation: `newsPxIn 0.5s ${p.y * 60}ms both`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function NewsScreen() {
  return (
    <Screen tone="intro">
      <ScreenHeader title="News" />
      <ScreenBody>
        {/*
          Park paper + copy at the top of the body (same spot the real feed
          will start). Do not vertical-center — the headline stays under the
          paper slot even while the paper spins away.
        */}
        <div className="flex flex-col items-center pt-2">
          <div
            aria-hidden="true"
            style={{ width: GRID_W * SCALE, height: GRID_H * SCALE }}
            className="flex items-center justify-center"
          >
            <NewsPaperGraphic />
          </div>
          <div className="mt-10 flex flex-col items-center px-2 text-center">
            <p
              className="font-pixel text-[18px] text-purple"
              style={{ letterSpacing: '0.22em', color: '#6B2FEA' }}
            >
              COMING SOON
            </p>
            <PixelHeading
              size="lg"
              className="mt-3.5 text-center text-[36px] leading-[1.05] text-white"
              style={{ color: '#FFFFFF' }}
            >
              Local updates!
            </PixelHeading>
          </div>
        </div>
      </ScreenBody>
    </Screen>
  );
}
