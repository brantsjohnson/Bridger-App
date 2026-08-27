import { cn } from '../tokens';

type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
};

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ink',
        checked ? 'border-teal bg-teal' : 'border-ink-line bg-ink/10'
      )}>
      
      <span
        aria-hidden="true"
        className={cn(
          'absolute left-0.5 top-1/2 h-[22px] w-[22px] -translate-y-1/2 rounded-full border border-ink/10 bg-white transition-[left] duration-200',
          checked && 'left-[22px]'
        )} />
      
    </button>);

}