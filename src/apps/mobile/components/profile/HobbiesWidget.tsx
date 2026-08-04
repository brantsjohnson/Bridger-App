import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDownIcon } from 'lucide-react';
import { ACCENTS, BLOBS, Interest, cn } from '../../../../packages/ui';
import { HOBBY_FOLLOW_UPS } from '../../state/mock-data';

/**
 * Two views in one contained widget. Page 1 is just the chips, tap one for a
 * quick peek at its answer. Swipe for page 2: every hobby with its answer,
 * scrolling inside the widget so the profile never balloons.
 */
export function HobbiesWidget({ hobbies }: {hobbies: Interest[];}) {
  const [page, setPage] = React.useState(0);
  const [open, setOpen] = React.useState<string | null>(null);

  return (
    <div className="overflow-hidden">
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.12}
        onDragEnd={(_, info) => {
          if (info.offset.x < -50) setPage(1);
          if (info.offset.x > 50) setPage(0);
        }}
        className="touch-pan-y">
        
        <AnimatePresence mode="wait" initial={false}>
          {page === 0 ?
          <motion.div
            key="chips"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-2.5">
            
              <div className="grid grid-cols-2 gap-2.5">
                {hobbies.map((h, i) => {
                const token = ACCENTS[h.accent];
                const shape = BLOBS[(h.shape ?? i) % BLOBS.length];
                const showing = open === h.id;
                const follow = HOBBY_FOLLOW_UPS[h.id];
                return (
                  <div key={h.id} className={cn(showing && 'col-span-2')}>
                      <button
                      type="button"
                      onClick={() => setOpen(showing ? null : h.id)}
                      aria-expanded={showing}
                      className={cn(
                        'flex min-h-[52px] w-full items-center gap-2 px-2.5 py-2 text-left',
                        shape,
                        token.bg,
                        token.text
                      )}>
                      
                        <span
                        aria-hidden="true"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/70 text-[15px]">
                        
                          {h.emoji}
                        </span>
                        <span className="min-w-0 flex-1 text-[12px] font-bold leading-[1.15]">
                          {h.label}
                        </span>
                        {follow &&
                      <ChevronDownIcon
                        aria-hidden="true"
                        className={cn(
                          'h-4 w-4 shrink-0 opacity-50 transition-transform',
                          showing && 'rotate-180'
                        )}
                        strokeWidth={2.8} />

                      }
                      </button>

                      <AnimatePresence initial={false}>
                        {showing && follow &&
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden px-3 text-[13px] font-semibold text-ink-soft">
                        
                            <span className="block pt-2">
                              <span className="text-ink-mute">{follow.question}</span>{' '}
                              {follow.answer}
                            </span>
                          </motion.p>
                      }
                      </AnimatePresence>
                    </div>);

              })}
              </div>
            </motion.div> :

          <motion.div
            key="answers"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="no-scrollbar max-h-[280px] space-y-2 overflow-y-auto pr-0.5">
            
              {hobbies.map((h) => {
              const follow = HOBBY_FOLLOW_UPS[h.id];
              if (!follow) return null;
              return (
                <div
                  key={h.id}
                  className="flex gap-3 rounded-card border border-ink-line bg-white px-3.5 py-3">
                  
                    <span
                    aria-hidden="true"
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[16px]',
                      ACCENTS[h.accent].bg
                    )}>
                    
                      {h.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-bold text-ink">{h.label}</span>
                      <span className="block text-[11px] font-semibold text-ink-mute">
                        {follow.question}
                      </span>
                      <span className="mt-0.5 block text-[13px] font-semibold text-ink-soft">
                        {follow.answer}
                      </span>
                    </span>
                  </div>);

            })}
            </motion.div>
          }
        </AnimatePresence>
      </motion.div>

      <div className="mt-3 flex items-center justify-center gap-1.5">
        {['Hobbies', 'Answers'].map((label, i) =>
        <button
          key={label}
          type="button"
          onClick={() => setPage(i)}
          aria-label={label}
          aria-current={page === i}
          className={cn(
            'h-1.5 rounded-full transition-all',
            page === i ? 'w-5 bg-ink' : 'w-1.5 bg-ink/20'
          )} />

        )}
      </div>
    </div>);

}