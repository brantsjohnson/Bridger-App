import { CakeIcon, FlagIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../../../packages/ui';
import { COMING_UP } from '../../state/connections';

/** Urgency reads at a glance: today is loudest, this week warm, further out calm. */
function countdownTone(when: string) {
  const w = when.toLowerCase();
  if (w.includes('today')) return 'bg-coral text-white';
  if (w.includes('week')) return 'bg-[#BBD6FB] text-onaccent';
  return 'bg-amber text-onaccent';
}

/**
 * Birthdays (from a friend's own shared attribute) and your private date notes,
 * in one strip. Birthdays are tier-gated; notes are yours alone.
 */
export function ComingUpWidget({ onOpenPerson }: {onOpenPerson?: (id: string) => void;}) {
  return (
    <div className="space-y-2">
      {COMING_UP.map((item) => {
        const birthday = item.kind === 'birthday';
        const today = item.when.toLowerCase().includes('today');
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onOpenPerson?.(item.personId)}
            className={cn(
              'flex w-full items-center gap-3 rounded-card px-4 py-3 text-left transition-transform active:scale-[0.99]',
              birthday ? 'bg-[#FFC0D7]' : 'bg-[#D5C2FF]'
            )}>
            
            {birthday ?
            <motion.span
              aria-hidden="true"
              animate={today ? { scale: [1, 1.12, 1] } : undefined}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              className="shrink-0 text-pink">
              
                <CakeIcon className="h-5 w-5" strokeWidth={2.4} />
              </motion.span> :

            <FlagIcon className="h-5 w-5 shrink-0 text-purple" strokeWidth={2.4} />
            }

            <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-onaccent">
              {item.label}
            </span>

            <span
              className={cn(
                'shrink-0 rounded-full px-2.5 py-1 text-[12px] font-bold',
                countdownTone(item.when)
              )}>
              
              {item.when}
            </span>
          </button>);

      })}
    </div>);

}