import React from 'react';
import { ChevronDownIcon, TypeIcon } from 'lucide-react';
import {
  AudienceLevel,
  AudiencePicker,
  ButtonPrimary,
  ButtonSecondary,
  Toggle,
  cn } from
'../../../../packages/ui';
import { THEMED_PROMPTS } from '../../state/mock-data';

const POSTS_LEFT = 2;

/** Capture only. Tap for a photo, hold for video (≤20s). Text is added after. */
export function StoryCaptureScreen({ onClose }: {onClose?: () => void;}) {
  const [theme, setTheme] = React.useState<string | null>(null);
  const [captured, setCaptured] = React.useState<null | 'photo' | 'video'>(null);
  const [holding, setHolding] = React.useState(false);
  const [overlay, setOverlay] = React.useState('');
  const [audience, setAudience] = React.useState<AudienceLevel>('friend');
  const [group, setGroup] = React.useState<string | null>(null);
  /** Opt-in: random update nudges about 1–3 times a day. */
  const [randomNudges, setRandomNudges] = React.useState(false);
  const holdTimer = React.useRef<number | null>(null);

  const startHold = () => {
    setHolding(true);
    holdTimer.current = window.setTimeout(() => setCaptured('video'), 600);
  };
  const endHold = () => {
    setHolding(false);
    if (holdTimer.current) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
      if (!captured) setCaptured('photo');
    }
  };

  if (captured) {
    return (
      <div className="relative flex h-full flex-col bg-ink">
        <div className="flex items-center justify-between px-4 pt-4">
          <button
            type="button"
            onClick={() => setCaptured(null)}
            aria-label="Retake"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-ink">
            
            <ChevronDownIcon className="h-5 w-5" strokeWidth={2.6} />
          </button>
          <span className="font-pixel text-[15px] text-white">
            {theme ? THEMED_PROMPTS.find((t) => t.slug === theme)?.label : 'Add text'}
          </span>
          <span className="w-9" />
        </div>

        <div className="relative mx-4 mt-4 flex flex-1 items-center justify-center rounded-card bg-purple">
          <span aria-hidden="true" className="text-[96px]">
            {captured === 'video' ? '🎥' : '📸'}
          </span>
          {overlay &&
          <span className="absolute left-1/2 top-1/3 -translate-x-1/2 -rotate-2 bg-white px-3 py-1 font-pixel text-[20px] text-ink">
              {overlay}
            </span>
          }
        </div>

        <div className="space-y-3 px-4 pb-8 pt-4">
          <div className="flex items-center gap-2 rounded-full border border-white/30 px-4 py-2.5">
            <TypeIcon className="h-4 w-4 text-white/70" strokeWidth={2.4} />
            <input
              value={overlay}
              onChange={(e) => setOverlay(e.target.value)}
              placeholder="Add text on top"
              aria-label="Overlay text"
              className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-white placeholder:text-white/50 focus:outline-none" />
            
          </div>
          <AudiencePicker
            value={audience}
            onChange={setAudience}
            group={group}
            onGroupChange={setGroup}
            groups={['Climbing crew', 'College friends']}
            tone="dark" />
          
          <ButtonPrimary full onClick={onClose}>
            Post
          </ButtonPrimary>
        </div>
      </div>);

  }

  return (
    <div className="relative flex h-full flex-col bg-ink">
      <div className="flex items-center justify-between px-4 pt-4">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-ink">
          
          <ChevronDownIcon className="h-5 w-5" strokeWidth={2.6} />
        </button>
        <span className="font-pixel text-[15px] text-white">Your story</span>
        <span className="text-[12px] font-bold text-white/70">{POSTS_LEFT} left</span>
      </div>

      <div className="mx-4 mt-4 flex flex-1 items-center justify-center rounded-card bg-white/10">
        <span aria-hidden="true" className="text-[64px] opacity-60">
          📷
        </span>
      </div>

      <div className="px-4 pt-5">
        <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-white/60">
          Themed posts
        </p>
        <div className="grid grid-cols-3 gap-2.5">
          {THEMED_PROMPTS.map((t) =>
          <button
            key={t.slug}
            type="button"
            aria-pressed={theme === t.slug}
            onClick={() => setTheme((v) => v === t.slug ? null : t.slug)}
            className={cn(
              'flex flex-col items-center gap-1 rounded-none border-2 border-dashed px-2 py-3 transition-colors',
              theme === t.slug ?
              'border-white bg-white/15 text-white' :
              'border-white/35 text-white/75'
            )}>
            
              <span aria-hidden="true" className="text-[20px]">
                {t.icon}
              </span>
              <span className="text-[11px] font-bold">{t.label}</span>
            </button>
          )}
        </div>

        {/* Opt-in BeReal-like capture reminders (1–3 a day) */}
        <div className="mt-3 flex items-center gap-3 rounded-card bg-white px-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-ink">BeReal-like reminders</p>
            <p className="mt-0.5 text-[11px] font-medium leading-snug text-ink-soft">
              Random reminders to capture your life. 1–3 notifications a day.
            </p>
          </div>
          <Toggle
            checked={randomNudges}
            onChange={setRandomNudges}
            label="BeReal-like reminders, 1 to 3 notifications a day"
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 pb-8 pt-6">
        <button
          type="button"
          aria-label="Tap for a photo, hold for video"
          onMouseDown={startHold}
          onMouseUp={endHold}
          onMouseLeave={() => holding && endHold()}
          onTouchStart={startHold}
          onTouchEnd={endHold}
          className={cn(
            'flex h-20 w-20 items-center justify-center rounded-full border-4 border-white transition-transform',
            holding ? 'scale-95 bg-coral' : 'bg-white/20'
          )}>
          
          <span className={cn('h-14 w-14 rounded-full transition-colors', holding ? 'bg-coral' : 'bg-white')} />
        </button>
        <p className="text-[12px] font-semibold text-white/70">Tap photo · hold video</p>
        <ButtonSecondary size="sm" tone="ghost" className="text-white" onClick={onClose}>
          Not now
        </ButtonSecondary>
      </div>
    </div>);

}