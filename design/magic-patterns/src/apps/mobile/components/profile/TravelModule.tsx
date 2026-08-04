import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../../../packages/ui';
import { PLACES } from '../../state/mock-data';

/**
 * Two views in one contained module, the same idiom as the hobbies widget.
 * Page 1 is the map with pins, swipe for a scrollable list of every place.
 */
export function TravelModule() {
  const [page, setPage] = React.useState(0);
  const [active, setActive] = React.useState<string | null>(null);
  const place = PLACES.find((p) => p.id === active);

  return (
    <div>
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
            key="map"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}>
            
              <div className="relative overflow-hidden rounded-card border border-ink-line bg-surface text-ink">
                <svg
                viewBox="0 0 100 60"
                className="h-[168px] w-full"
                role="img"
                aria-label="Places traveled">
                
                  {Array.from({ length: 11 }).map((_, i) =>
                <line
                  key={`v${i}`}
                  x1={i * 10}
                  y1={0}
                  x2={i * 10}
                  y2={60}
                  stroke="currentColor"
                  strokeOpacity={0.07}
                  strokeWidth={0.3} />

                )}
                  {Array.from({ length: 7 }).map((_, i) =>
                <line
                  key={`h${i}`}
                  x1={0}
                  y1={i * 10}
                  x2={100}
                  y2={i * 10}
                  stroke="currentColor"
                  strokeOpacity={0.07}
                  strokeWidth={0.3} />

                )}
                  <path
                  d="M6 26 L18 16 L30 22 L40 14 L52 20 L58 12 L70 18 L82 14 L94 24 L88 40 L74 46 L60 40 L48 48 L34 44 L20 48 L10 40 Z"
                  fill="currentColor"
                  fillOpacity={0.06}
                  stroke="currentColor"
                  strokeOpacity={0.35}
                  strokeWidth={0.5} />
                
                </svg>

                {PLACES.map((p) =>
              <button
                key={p.id}
                type="button"
                onClick={() => setActive((v) => v === p.id ? null : p.id)}
                aria-label={p.label}
                aria-pressed={active === p.id}
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                className={cn(
                  'absolute -translate-x-1/2 -translate-y-full transition-transform',
                  active === p.id && 'scale-110'
                )}>
                
                    <span className="block h-3 w-3 rounded-full border-2 border-ink bg-coral" />
                  </button>
              )}
              </div>

              <div className="mt-2.5 min-h-[34px]">
                {place ?
              <p className="text-[13px] font-semibold text-ink">
                    <span className="font-bold">{place.label}</span> · {place.note}
                  </p> :

              <p className="text-[12px] font-medium text-ink-mute">
                    {PLACES.length} places · tap a pin
                  </p>
              }
              </div>
            </motion.div> :

          <motion.div
            key="list"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="no-scrollbar max-h-[204px] space-y-2 overflow-y-auto pr-0.5">
            
              {PLACES.map((p) =>
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-card border border-ink-line bg-surface px-3.5 py-3">
              
                  <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-coral/25 text-[16px]">
                
                    {p.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold text-ink">{p.label}</span>
                    <span className="block truncate text-[12px] font-semibold text-ink-mute">
                      {p.note}
                    </span>
                  </span>
                  {p.year &&
              <span className="shrink-0 text-[11px] font-bold text-ink-mute">{p.year}</span>
              }
                </div>
            )}
            </motion.div>
          }
        </AnimatePresence>
      </motion.div>

      <div className="mt-3 flex items-center justify-center gap-1.5">
        {['Map', 'List'].map((label, i) =>
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