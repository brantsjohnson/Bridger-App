import React from 'react';
import { CheckIcon } from 'lucide-react';
import { cn } from '../tokens';

export type AudienceLevel = 'close' | 'friend' | 'everyone';

const LEVELS: Array<{id: AudienceLevel;label: string;sub: string;}> = [
{ id: 'close', label: 'Close', sub: '10 people' },
{ id: 'friend', label: 'Friends', sub: '25 people' },
{ id: 'everyone', label: 'Everyone', sub: 'All your people' }];


/** Concentric: picking a wider circle lights the tighter ones too. */
export function reachOf(level: AudienceLevel): AudienceLevel[] {
  if (level === 'close') return ['close'];
  if (level === 'friend') return ['close', 'friend'];
  return ['close', 'friend', 'everyone'];
}

/**
 * One sharing control for everything you post: stories, polls, activity
 * contributions. Tiers are concentric and shown as multi-select so the reach
 * is always visible.
 */
export function AudiencePicker({
  value,
  onChange,
  tone = 'light',
  groups = [],
  group = null,
  onGroupChange,
  className











}: {value: AudienceLevel;onChange: (v: AudienceLevel) => void; /** on a dark capture sheet, or on a normal surface */tone?: 'light' | 'dark'; /** co-op custom groups, shown alongside the three tiers */groups?: string[]; /** the selected custom group, which replaces the tier choice */group?: string | null;onGroupChange?: (g: string | null) => void;className?: string;}) {
  const lit = group ? [] : reachOf(value);
  const dark = tone === 'dark';

  return (
    <div className={className}>
      <p
        className={cn(
          'mb-2 text-[11px] font-bold uppercase tracking-wide',
          dark ? 'text-white/60' : 'text-ink-mute'
        )}>
        
        Who sees this
      </p>

      <div className="flex gap-2">
        {LEVELS.map((l) => {
          const on = lit.includes(l.id);
          const selected = !group && value === l.id;
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => {
                onGroupChange?.(null);
                onChange(l.id);
              }}
              aria-pressed={selected}
              className={cn(
                'flex-1 rounded-card border px-2 py-2.5 text-left transition-colors',
                dark ?
                on ?
                'border-white bg-white/15 text-white' :
                'border-white/25 text-white/60' :
                on ?
                'border-ink bg-green text-ink' :
                'border-ink-line bg-surface text-ink-mute'
              )}>
              
              <span className="flex items-center gap-1.5">
                <span
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                    on ?
                    dark ?
                    'border-white bg-white text-ink' :
                    'border-ink bg-ink text-white' :
                    dark ?
                    'border-white/40' :
                    'border-ink-line'
                  )}>
                  
                  {on && <CheckIcon className="h-2.5 w-2.5" strokeWidth={4} />}
                </span>
                <span className="truncate text-[12px] font-bold">{l.label}</span>
              </span>
              <span className="mt-0.5 block truncate text-[10px] font-semibold opacity-70">
                {l.sub}
              </span>
            </button>);

        })}
      </div>

      {groups.length > 0 &&
      <>
          <p
          className={cn(
            'mb-1.5 mt-3 text-[11px] font-bold uppercase tracking-wide',
            dark ? 'text-white/50' : 'text-ink-mute'
          )}>
          
            Or a group
          </p>
          <div className="flex flex-wrap gap-1.5">
            {groups.map((g) => {
            const on = group === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => onGroupChange?.(on ? null : g)}
                aria-pressed={on}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-[12px] font-bold transition-colors',
                  on ?
                  dark ?
                  'border-white bg-white text-ink' :
                  'border-ink bg-green text-ink' :
                  dark ?
                  'border-white/30 text-white/75' :
                  'border-ink-line bg-surface text-ink-soft'
                )}>
                
                  {g}
                </button>);

          })}
          </div>
        </>
      }
    </div>);

}