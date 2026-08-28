import { motion, useReducedMotion } from 'framer-motion';
import { ButtonPrimary, PixelHeading } from '../../../../packages/ui';

/** Confetti colors, straight from the accent palette. */
const CONFETTI = ['#6B2FEA', '#FF5A1F', '#00A676', '#FFB515', '#FF3E8A', '#1D6FE8', '#5FBF3A'];

const PIECES = Array.from({ length: 34 }, (_, i) => ({
  id: i,
  color: CONFETTI[i % CONFETTI.length],
  left: i * 37 % 100,
  delay: i % 9 * 0.09,
  duration: 2.4 + i % 5 * 0.35,
  size: 7 + i % 4 * 3,
  round: i % 3 === 0
}));

/** What actually happens next, so "you're in" means something. */
const NEXT: Array<{emoji: string;label: string;line: string;color: string;}> = [
{
  emoji: '👋',
  label: 'Add your people',
  line: 'Bridger is empty until they are here',
  color: '#6B2FEA'
},
{ emoji: '📷', label: 'Complete your profile', line: 'So friends know who they are talking to', color: '#FF3E8A' },
{ emoji: '🌿', label: "Say when you're free", line: 'The whole point is seeing them', color: '#00A676' }];


/** 9 · The only place onboardingComplete is set. An arrival, not a receipt. */
export function WelcomeInScreen({ onDone }: {onDone?: () => void;}) {
  const still = useReducedMotion();

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-amber">
      {/* confetti rains once, behind everything */}
      {!still &&
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {PIECES.map((p) =>
        <motion.span
          key={p.id}
          initial={{ y: -40, opacity: 0, rotate: 0 }}
          animate={{ y: '105vh', opacity: [0, 1, 1, 0], rotate: 420 }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeIn',
            repeat: Infinity,
            repeatDelay: 1.2
          }}
          className="absolute top-0 block"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * (p.round ? 1 : 1.8),
            backgroundColor: p.color,
            borderRadius: p.round ? 999 : 2
          }} />

        )}
        </div>
      }

      <div className="relative flex flex-1 flex-col justify-between px-6 pb-8 pt-14">
        <motion.div
          initial={still ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}>
          
          <span className="inline-flex rounded-full bg-ink px-3 py-1.5 text-[12px] font-bold text-canvas">
            That is everything we need
          </span>
          <PixelHeading as="h1" size="lg" className="mt-3 text-[40px] leading-[1.05]">
            You're in.
          </PixelHeading>
          <p className="mt-2 max-w-[280px] text-[15px] font-semibold leading-snug text-ink">
            No feed to scroll. Just the people you actually know.
          </p>
        </motion.div>

        {/* the mark: a bloom of circles that pops in */}
        <motion.div
          aria-hidden="true"
          className="relative mx-auto flex h-44 w-44 items-center justify-center"
          initial={still ? false : { scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.15 }}>
          
          {['#6B2FEA', '#FF3E8A', '#00A676', '#1D6FE8', '#FF5A1F'].map((c, i, arr) => {
            const angle = i / arr.length * Math.PI * 2 - Math.PI / 2;
            return (
              <motion.span
                key={c}
                className="absolute flex h-14 w-14 items-center justify-center rounded-full border-2 border-ink"
                style={{
                  backgroundColor: c,
                  left: `calc(50% + ${Math.cos(angle) * 56}px - 28px)`,
                  top: `calc(50% + ${Math.sin(angle) * 56}px - 28px)`
                }}
                initial={still ? false : { scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 14,
                  delay: 0.25 + i * 0.07
                }}>
                
                <span className="text-[22px]">{['🌻', '🎧', '🌿', '📷', '🚲'][i]}</span>
              </motion.span>);

          })}
          <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 border-ink bg-canvas text-[30px]">
            🌉
          </span>
        </motion.div>

        <div className="space-y-2.5">
          {NEXT.map((n, i) =>
          <motion.div
            key={n.label}
            initial={still ? false : { opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.5 + i * 0.09 }}
            className="flex items-center gap-3 rounded-card border-2 border-ink bg-canvas px-3.5 py-2.5">
            
              <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[18px]"
              style={{ backgroundColor: n.color }}>
              
                {n.emoji}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-bold text-ink">{n.label}</span>
                <span className="block truncate text-[12px] font-semibold text-ink-mute">
                  {n.line}
                </span>
              </span>
            </motion.div>
          )}

          <div className="pt-2">
            <ButtonPrimary full onClick={onDone}>
              Let's go
            </ButtonPrimary>
          </div>
        </div>
      </div>
    </div>);

}