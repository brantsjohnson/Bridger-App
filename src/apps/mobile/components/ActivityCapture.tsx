import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDownIcon, TypeIcon } from 'lucide-react';
import { AudienceLevel, AudiencePicker, ButtonPrimary, cn } from '../../../packages/ui';

/** Co-op custom groups. Free members share to the three circles. */
const MY_GROUPS = ['Climbing crew', 'College friends'];

/**
 * Capture for the weekly activity — same camera as stories, nothing else.
 * No themed prompts, no suggestions. One shot plus a caption.
 */
export function ActivityCapture({
  open,
  prompt,
  onClose,
  onPost





}: {open: boolean;prompt: string;onClose: () => void;onPost: (caption: string, audience: AudienceLevel | string) => void;}) {
  const [captured, setCaptured] = React.useState(false);
  const [caption, setCaption] = React.useState('');
  const [audience, setAudience] = React.useState<AudienceLevel>('friend');
  const [group, setGroup] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setCaptured(false);
      setCaption('');
      setAudience('friend');
      setGroup(null);
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open &&
      <motion.div
        role="dialog"
        aria-label="Post to the activity"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        className="absolute inset-0 z-50 flex flex-col bg-ink">
        
          <div className="flex items-center justify-between px-4 pt-5">
            <button
            type="button"
            onClick={captured ? () => setCaptured(false) : onClose}
            aria-label={captured ? 'Retake' : 'Close'}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-ink">
            
              <ChevronDownIcon className="h-5 w-5" strokeWidth={2.6} />
            </button>
            <span className="truncate px-3 font-pixel text-[15px] text-white">{prompt}</span>
            <span className="w-9" />
          </div>

          <div
          className={cn(
            'mx-4 mt-4 flex flex-1 items-center justify-center rounded-card',
            captured ? 'bg-pink' : 'bg-white/10'
          )}>
          
            <span aria-hidden="true" className={captured ? 'text-[96px]' : 'text-[64px] opacity-60'}>
              {captured ? '🧢' : '📷'}
            </span>
          </div>

          {captured ?
        <div className="space-y-3 px-4 pb-8 pt-4">
              <div className="flex items-center gap-2 rounded-full border border-white/30 px-4 py-2.5">
                <TypeIcon className="h-4 w-4 text-white/70" strokeWidth={2.4} />
                <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption"
              aria-label="Caption"
              className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-white placeholder:text-white/50 focus:outline-none" />
            
              </div>

              {/* same sharing model as a story — never a special case */}
              <AudiencePicker
            value={audience}
            onChange={setAudience}
            group={group}
            onGroupChange={setGroup}
            groups={MY_GROUPS}
            tone="dark" />
          

              <ButtonPrimary full onClick={() => onPost(caption, group ?? audience)}>
                Post
              </ButtonPrimary>
            </div> :

        <div className="flex flex-col items-center gap-2 pb-10 pt-6">
              <button
            type="button"
            aria-label="Take photo"
            onClick={() => setCaptured(true)}
            className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white/20 transition-transform active:scale-95">
            
                <span className="h-14 w-14 rounded-full bg-white" />
              </button>
              <p className="text-[12px] font-semibold text-white/70">Tap to capture</p>
            </div>
        }
        </motion.div>
      }
    </AnimatePresence>);

}