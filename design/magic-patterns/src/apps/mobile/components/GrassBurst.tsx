import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const SPRIGS = [
'🌱', '🌿', '🍀', '🌾', '🌱', '🌿', '🍀', '🌳', '🌻', '🌾', '🍀', '🌱',
'🌿', '🌸', '🌱', '🍃', '🌿', '🌱'];


/** Plays once — grass explodes out of the signal. Transform/opacity only. */
export function GrassBurst({ play, onDone }: {play: boolean;onDone?: () => void;}) {
  React.useEffect(() => {
    if (!play) return;
    const t = window.setTimeout(() => onDone?.(), 1400);
    return () => window.clearTimeout(t);
  }, [play, onDone]);

  return (
    <AnimatePresence>
      {play &&
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 overflow-visible">
          {SPRIGS.map((sprig, i) => {
          const angle = i / SPRIGS.length * Math.PI * 2;
          const distance = 90 + i % 4 * 30;
          return (
            <motion.span
              key={i}
              initial={{ x: 0, y: 0, scale: 0.4, opacity: 0 }}
              animate={{
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                scale: [0.4, 1.15, 0.9],
                opacity: [0, 1, 0],
                rotate: (i % 2 ? 1 : -1) * 40
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: 'easeOut', delay: i % 4 * 0.04 }}
              className="absolute left-1/2 top-1/2 text-[22px]">
              
                {sprig}
              </motion.span>);

        })}
        </div>
      }
    </AnimatePresence>);

}