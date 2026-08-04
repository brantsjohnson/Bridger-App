import React from 'react';
import { SearchIcon, XIcon } from 'lucide-react';
import { cn } from '../tokens';

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  type?: string;
  multiline?: boolean;
  id?: string;
};

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  error,
  type = 'text',
  multiline,
  id
}: TextFieldProps) {
  const auto = React.useId();
  const fieldId = id ?? auto;
  const shared =
  'w-full bg-transparent text-[14px] font-semibold text-ink placeholder:font-medium placeholder:text-ink-mute focus:outline-none';

  return (
    <div className="w-full">
      <label htmlFor={fieldId} className="mb-1.5 block text-[12px] font-bold text-ink-soft">
        {label}
      </label>
      <div
        className={cn(
          'rounded-2xl border bg-canvas-raised px-4',
          multiline ? 'py-3' : 'flex h-12 items-center',
          error ? 'border-coral' : 'border-ink-line focus-within:border-ink/40'
        )}>
        
        {multiline ?
        <textarea
          id={fieldId}
          rows={3}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cn(shared, 'resize-none')} /> :


        <input
          id={fieldId}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={shared} />

        }
      </div>
      {error && <p className="mt-1.5 text-[12px] font-semibold text-coral">{error}</p>}
    </div>);

}

export function SearchField({
  value,
  onChange,
  placeholder = 'Search',
  className





}: {value: string;onChange: (value: string) => void;placeholder?: string;className?: string;}) {
  return (
    <div
      className={cn(
        'flex h-11 items-center gap-2 rounded-full border border-ink-line bg-canvas-raised px-4 focus-within:border-ink/40',
        className
      )}>
      
      <SearchIcon className="h-[17px] w-[17px] shrink-0 text-ink-mute" strokeWidth={2.5} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-ink placeholder:font-medium placeholder:text-ink-mute focus:outline-none" />
      
      {value &&
      <button
        type="button"
        onClick={() => onChange('')}
        aria-label="Clear"
        className="flex h-6 w-6 items-center justify-center rounded-full bg-ink/5 text-ink-soft">
        
          <XIcon className="h-3.5 w-3.5" strokeWidth={3} />
        </button>
      }
    </div>);

}