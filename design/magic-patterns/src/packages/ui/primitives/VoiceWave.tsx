// ============================================
// WHAT THIS FILE DOES (plain English):
// The little bouncing bars that prove the mic is open. Quiet bars stay short.
// Hearing bars bounce. Reduced motion keeps them still.
// ============================================
import { cn } from '../tokens';
import { useReduceMotion } from '../lib/reduce-motion';

const HEIGHTS = [0.42, 0.78, 1, 0.62, 0.9, 0.5];

export function VoiceWave({
  active = true,
  hearing = false,
  bars = 6,
  size = 'md',
  className,
  color
}: {
  active?: boolean;
  hearing?: boolean;
  bars?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: string;
}) {
  const reduce = useReduceMotion();
  const max = size === 'lg' ? 22 : size === 'sm' ? 12 : 16;
  const quiet = size === 'lg' ? 5 : size === 'sm' ? 3.5 : 4;
  const width = size === 'lg' ? 3.5 : size === 'sm' ? 2.5 : 3;
  const barColor = color ?? 'currentColor';

  return (
    <span
      aria-hidden
      className={cn('inline-flex items-center', className)}
      style={{ height: max, gap: 3, width: bars * width + (bars - 1) * 3 }}
    >
      {Array.from({ length: bars }, (_, i) => {
        const peak = quiet + (max - quiet) * HEIGHTS[i % HEIGHTS.length];
        const h = !active ? quiet : hearing && !reduce ? peak : quiet * (0.85 + (i % 3) * 0.05);
        return (
          <span
            key={i}
            className={cn(
              'inline-block rounded-full',
              hearing && active && !reduce && 'animate-pulse'
            )}
            style={{
              width,
              height: h,
              backgroundColor: barColor,
              opacity: hearing && active ? 1 : 0.7,
              transition: 'height 220ms ease, opacity 220ms ease'
            }}
          />
        );
      })}
    </span>
  );
}
