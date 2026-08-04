import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PixelHeading, Screen, gentle } from '../../../../packages/ui';
import { BEAT_MS, WELCOME_BEATS } from '../../content/welcome';

/** Phase 0 — one continuous sequence. No skip, no back. Auto-advances to auth. */
export function WelcomeScreen({ onDone }: {onDone?: () => void;}) {
  const [index, setIndex] = React.useState(0);
  const beat = WELCOME_BEATS[index];
  const last = index === WELCOME_BEATS.length - 1;

  React.useEffect(() => {
    const t = window.setTimeout(() => {
      if (last) onDone?.();else
      setIndex((i) => i + 1);
    }, BEAT_MS);
    return () => window.clearTimeout(t);
  }, [index, last, onDone]);

  return (
    <Screen>
      <div className="flex flex-1 flex-col justify-between px-7 pb-10 pt-16">
        <PixelHeading as="h1" size="sm" className="text-ink-mute">
          Bridger
        </PixelHeading>

        <AnimatePresence mode="wait">
          <motion.div
            key={beat.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={gentle}
            className="flex-1 pt-16">
            
            {beat.kind === 'stat' ?
            <div>
                <div className="mb-5 h-40 w-full overflow-hidden rounded-none border-2 border-ink">
                  <motion.div
                  className="h-full bg-coral"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 1.8, ease: 'easeOut' }}
                  style={{ transformOrigin: 'bottom' }} />
                
                </div>
                <p className="text-[22px] font-bold leading-tight tracking-tight text-ink">
                  {beat.text}
                </p>
              </div> :

            <p
              className={
              last ?
              'font-pixel text-[34px] leading-tight text-ink' :
              'text-[26px] font-bold leading-tight tracking-tight text-ink'
              }>
              
                {beat.text}
              </p>
            }
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-1.5" aria-hidden="true">
          {WELCOME_BEATS.map((b, i) =>
          <span
            key={b.id}
            className={`h-1 flex-1 ${i <= index ? 'bg-ink' : 'bg-ink/15'}`} />

          )}
        </div>
      </div>
    </Screen>);

}