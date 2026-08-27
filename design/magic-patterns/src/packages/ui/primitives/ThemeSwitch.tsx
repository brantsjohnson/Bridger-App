import { MoonIcon, SunIcon } from 'lucide-react';
import { cn } from '../tokens';

/** Light / Dark segmented switch. Small enough for a header, clear enough for settings. */
export function ThemeSwitch({
  value,
  onChange,
  className




}: {value: 'light' | 'dark';onChange: (mode: 'light' | 'dark') => void;className?: string;}) {
  const options = [
  { key: 'light' as const, label: 'Light', Icon: SunIcon },
  { key: 'dark' as const, label: 'Dark', Icon: MoonIcon }];


  return (
    <div
      role="group"
      aria-label="Appearance"
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-ink-line bg-surface p-1',
        className
      )}>
      
      {options.map(({ key, label, Icon }) =>
      <button
        key={key}
        type="button"
        onClick={() => onChange(key)}
        aria-pressed={value === key}
        className={cn(
          'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold transition-colors',
          value === key ? 'bg-purple text-white' : 'text-ink-mute hover:text-ink'
        )}>
        
          <Icon className="h-3.5 w-3.5" strokeWidth={2.6} />
          {label}
        </button>
      )}
    </div>);

}