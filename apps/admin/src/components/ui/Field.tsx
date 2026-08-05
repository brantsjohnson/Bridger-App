// ============================================
// WHAT THIS FILE DOES (plain English):
// Labeled form field wrapper. Keeps every input tied to a visible label for
// accessibility, with optional hint and error text underneath.
// ============================================
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes
} from 'react';

type Common = {
  label: string;
  hint?: string;
  error?: string;
  id: string;
};

type InputProps = Common &
  InputHTMLAttributes<HTMLInputElement> & {
    as?: 'input';
  };

type TextareaProps = Common &
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    as: 'textarea';
  };

type SelectProps = Common &
  SelectHTMLAttributes<HTMLSelectElement> & {
    as: 'select';
    children: ReactNode;
  };

type Props = InputProps | TextareaProps | SelectProps;

const CONTROL =
  'w-full min-h-tap rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted';

export function Field(props: Props) {
  const { label, hint, error, id } = props;
  const describedBy = [
    hint ? `${id}-hint` : null,
    error ? `${id}-error` : null
  ]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>

      {props.as === 'textarea' ? (
        <textarea
          id={id}
          className={`${CONTROL} min-h-[96px] resize-y`}
          aria-describedby={describedBy}
          aria-invalid={Boolean(error) || undefined}
          {...omitCommon(props)}
        />
      ) : props.as === 'select' ? (
        <select
          id={id}
          className={CONTROL}
          aria-describedby={describedBy}
          aria-invalid={Boolean(error) || undefined}
          {...omitCommon(props)}
        >
          {props.children}
        </select>
      ) : (
        <input
          id={id}
          className={CONTROL}
          aria-describedby={describedBy}
          aria-invalid={Boolean(error) || undefined}
          {...omitCommon(props)}
        />
      )}

      {hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Strip Field-only props before spreading onto the native control. */
function omitCommon<T extends Common>(props: T) {
  const {
    label: _label,
    hint: _hint,
    error: _error,
    id: _id,
    as: _as,
    ...rest
  } = props as T & { as?: string };
  return rest;
}
