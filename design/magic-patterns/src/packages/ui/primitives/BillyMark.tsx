// ============================================
// WHAT THIS FILE DOES (plain English):
// Billy's face mark. The logo turns into eyes that blink, glance, and bounce
// depending on mood (resting, thinking, listening, speaking, excited).
// ACCESSIBILITY: all motion stops when the OS asks for reduced motion.
// ============================================
import { motion, useReducedMotion, type TargetAndTransition } from 'framer-motion';
import { cn } from '../tokens';

export type MarkMood =
  | 'resting'
  | 'thinking'
  | 'listening'
  | 'speaking'
  | 'excited';

const SIZES = { xs: 'h-5 w-5', sm: 'h-7 w-7', md: 'h-9 w-9', lg: 'h-14 w-14', xl: 'h-20 w-20' };

const PUPIL_HOME = { cx: 10, cy: 28 };

export function BillyMark({
  mood = 'resting',
  size = 'md',
  tile = true,
  className
}: {
  mood?: MarkMood;
  size?: keyof typeof SIZES;
  /** false drops the solid blue tile, for use inside already-colored chrome */
  tile?: boolean;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const still = !!reduced;

  const lid = still
    ? { scaleY: 1 }
    : {
        scaleY: [1, 1, 0.12, 1, 1, 0.12, 1],
        transition: {
          duration: mood === 'thinking' ? 5.5 : 7.2,
          repeat: Infinity,
          times: [0, 0.72, 0.76, 0.8, 0.82, 0.86, 1],
          ease: 'easeInOut'
        }
      };

  const pupil = still
    ? { x: 0, y: 0 }
    : mood === 'thinking'
      ? {
          x: [0, 1.8, -1.6, 0, 0],
          y: [0, -12, -14, -8, 0],
          transition: { duration: 9, repeat: Infinity, ease: 'easeInOut', times: [0, 0.25, 0.5, 0.75, 1] }
        }
      : mood === 'listening'
        ? {
            x: [0, 0.8, 0, -0.8, 0],
            y: [0, -2, 0, -1.5, 0],
            transition: { duration: 12, repeat: Infinity, ease: 'easeInOut' }
          }
        : mood === 'speaking'
          ? {
              x: [0, 1, 0],
              y: [0, -2, 0],
              transition: { duration: 5.5, repeat: Infinity, ease: 'easeInOut' }
            }
          : mood === 'excited'
            ? {
                x: [0, 1.4, 0],
                y: [0, -4, 0],
                transition: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' }
              }
            : {
                x: [0, 1.8, 0, -1.8, 0, 1, 0],
                y: [0, -1.2, 0, -1.2, 0, -7, 0],
                transition: { duration: 18, repeat: Infinity, ease: 'easeInOut' }
              };

  const bounce =
    still || mood === 'resting' || mood === 'thinking' || mood === 'listening'
      ? { y: 0 }
      : mood === 'excited'
        ? { y: [0, -1.6, 0], transition: { duration: 1.4, repeat: Infinity, repeatDelay: 0.9 } }
        : { y: [0, -0.6, 0], transition: { duration: 1.6, repeat: Infinity, repeatDelay: 0.4 } };

  return (
    <motion.span
      role="img"
      aria-label={`Billy, ${mood}`}
      animate={bounce}
      className={cn(
        'inline-flex shrink-0 items-center justify-center',
        SIZES[size],
        tile && 'rounded-[28%]',
        className
      )}
      style={tile ? { backgroundColor: '#6B2FEA' } : undefined}
    >
      <svg viewBox="0 0 44 40" className={cn(tile ? 'h-[72%] w-[72%]' : 'h-full w-full')}>
        <Eye x={2} lid={lid} pupil={pupil} tile={tile} />
        <Eye x={24} lid={lid} pupil={pupil} tile={tile} delay={0.08} />
      </svg>
    </motion.span>
  );
}

function Eye({
  x,
  lid,
  pupil,
  tile,
  delay = 0
}: {
  x: number;
  lid: TargetAndTransition;
  pupil: TargetAndTransition;
  tile: boolean;
  delay?: number;
}) {
  const white = tile ? '#FFFFFF' : 'currentColor';

  return (
    <g transform={`translate(${x} 0)`}>
      <motion.path
        animate={lid}
        transition={{ delay }}
        style={{ originX: '50%', originY: '50%', transformBox: 'fill-box' }}
        d="M0.6 4.2C0.6 2.1 2.2 0.4 4.3 0.3 8.1 0.1 11.9 0.1 15.7 0.3c2.1 0.1 3.7 1.8 3.7 3.9 0 9.6-0.4 19.1-1.2 28.7-0.2 2-1.9 3.6-4 3.6h-8.7c-2.1 0-3.8-1.6-4-3.6C0.7 23.3 0.3 13.8 0.6 4.2Z"
        fill={white}
      />
      <motion.circle
        animate={pupil}
        transition={{ delay }}
        cx={PUPIL_HOME.cx}
        cy={PUPIL_HOME.cy}
        r={3.9}
        fill="#1C1B16"
      />
    </g>
  );
}
