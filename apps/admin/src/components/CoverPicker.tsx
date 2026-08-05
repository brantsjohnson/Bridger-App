// ============================================
// WHAT THIS FILE DOES (plain English):
// Pick a cover the same way events do: photo (fills the whole card), color,
// emoji, or short text. Used for quizzes and weekly activities in admin.
// ============================================
import { useState } from 'react';
import type { Cover } from '@bridger/shared';
import { Field } from './ui/Field';

type CoverMode = 'photo' | 'color' | 'emoji' | 'text';

const VIBRANT_COLORS = [
  '#FF4D6D',
  '#FF8C42',
  '#FFD23F',
  '#6BCB77',
  '#4D96FF',
  '#9B5DE5',
  '#F15BB5',
  '#00BBF9',
  '#FEE440',
  '#00F5D4'
];

const DEMO_PHOTOS = [
  'https://picsum.photos/seed/bridger-quiz/1200/675',
  'https://picsum.photos/seed/bridger-activity/1200/675',
  'https://picsum.photos/seed/bridger-cover-3/1200/675'
];

const MODES: { id: CoverMode; label: string }[] = [
  { id: 'photo', label: 'Photo' },
  { id: 'color', label: 'Color' },
  { id: 'emoji', label: 'Emoji' },
  { id: 'text', label: 'Text' }
];

type Props = {
  cover?: Cover;
  onChange: (cover: Cover | undefined) => void;
  /** Suggested text when using a text cover. */
  textFallback?: string;
  /** Size hint shown under the picker. */
  sizeHint?: string;
};

function modeFromCover(cover?: Cover): CoverMode {
  if (!cover) return 'photo';
  if (cover.kind === 'photo') return 'photo';
  if (cover.kind === 'color') return 'color';
  if (cover.kind === 'text') return 'text';
  if (cover.kind === 'emoji') return 'emoji';
  return 'photo';
}

function bgFromCover(cover?: Cover): string {
  if (!cover) return VIBRANT_COLORS[5];
  if (cover.kind === 'color' || cover.kind === 'text') return cover.bg;
  if (cover.kind === 'emoji') return cover.bg ?? VIBRANT_COLORS[5];
  return VIBRANT_COLORS[5];
}

export function CoverPicker({
  cover,
  onChange,
  textFallback = 'Title',
  sizeHint = 'Best at 1200 x 675 (16:9). Photo fills the whole card.'
}: Props) {
  const [mode, setMode] = useState<CoverMode>(() => modeFromCover(cover));
  const [bg, setBg] = useState(() => bgFromCover(cover));
  const [emojiDraft, setEmojiDraft] = useState(
    cover?.kind === 'emoji' ? cover.value : '🎉'
  );
  const [textDraft, setTextDraft] = useState(
    cover?.kind === 'text' ? cover.value : textFallback
  );
  const [photoUrl, setPhotoUrl] = useState(
    cover?.kind === 'photo' ? cover.url : DEMO_PHOTOS[0]
  );

  const pickMode = (next: CoverMode) => {
    setMode(next);
    if (next === 'photo') onChange({ kind: 'photo', url: photoUrl });
    if (next === 'color') onChange({ kind: 'color', bg });
    if (next === 'emoji')
      onChange({ kind: 'emoji', value: emojiDraft || '🎉', bg });
    if (next === 'text')
      onChange({ kind: 'text', value: textDraft || textFallback, bg });
  };

  const pickBg = (hex: string) => {
    setBg(hex);
    if (mode === 'color') onChange({ kind: 'color', bg: hex });
    if (mode === 'emoji')
      onChange({ kind: 'emoji', value: emojiDraft || '🎉', bg: hex });
    if (mode === 'text')
      onChange({ kind: 'text', value: textDraft || textFallback, bg: hex });
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-ink">Cover</p>
      <p className="text-xs text-muted">{sizeHint}</p>

      {/* --- Mode tabs --- */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Cover type">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={mode === m.id}
            className={[
              'min-h-tap rounded-xl border px-3 text-sm font-medium',
              mode === m.id
                ? 'border-ink bg-ink text-canvas'
                : 'border-line bg-surface text-ink'
            ].join(' ')}
            onClick={() => pickMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* --- Live cover preview (fills the frame) --- */}
      <button
        type="button"
        className="relative block w-full overflow-hidden rounded-2xl border border-line"
        style={{ aspectRatio: '16 / 9' }}
        onClick={() => {
          if (mode === 'photo') {
            const next =
              DEMO_PHOTOS[
                (DEMO_PHOTOS.indexOf(photoUrl) + 1) % DEMO_PHOTOS.length
              ] ?? DEMO_PHOTOS[0];
            setPhotoUrl(next);
            onChange({ kind: 'photo', url: next });
          }
        }}
        aria-label="Cover preview"
      >
        {/* absolute fill so photo/color/emoji always cover the whole box */}
        <div className="absolute inset-0">
          <CoverFill cover={cover} />
        </div>
      </button>

      {mode === 'photo' ? (
        <Field
          id="cover-photo-url"
          label="Photo link"
          hint="Paste a photo URL, or tap the cover to cycle demo photos."
          value={photoUrl}
          onChange={(e) => {
            setPhotoUrl(e.target.value);
            onChange({ kind: 'photo', url: e.target.value });
          }}
        />
      ) : null}

      {mode === 'emoji' ? (
        <Field
          id="cover-emoji"
          label="Emoji"
          value={emojiDraft}
          onChange={(e) => {
            const next = e.target.value.slice(-4) || '🎉';
            setEmojiDraft(next);
            onChange({ kind: 'emoji', value: next, bg });
          }}
        />
      ) : null}

      {mode === 'text' ? (
        <Field
          id="cover-text"
          label="Cover text"
          value={textDraft}
          onChange={(e) => {
            setTextDraft(e.target.value);
            onChange({
              kind: 'text',
              value: e.target.value || textFallback,
              bg
            });
          }}
        />
      ) : null}

      {mode !== 'photo' ? (
        <div>
          <p className="mb-2 text-xs font-medium text-muted">Background color</p>
          <div className="flex flex-wrap gap-2">
            {VIBRANT_COLORS.map((hex) => (
              <button
                key={hex}
                type="button"
                aria-label={`Color ${hex}`}
                className={[
                  'h-10 w-10 rounded-full border-2',
                  bg === hex ? 'border-ink' : 'border-transparent'
                ].join(' ')}
                style={{ backgroundColor: hex }}
                onClick={() => pickBg(hex)}
              />
            ))}
          </div>
        </div>
      ) : null}

      {cover ? (
        <button
          type="button"
          className="text-sm text-muted underline underline-offset-2"
          onClick={() => onChange(undefined)}
        >
          Clear cover
        </button>
      ) : null}
    </div>
  );
}

/** Renders a Cover into a full-bleed admin preview box. */
export function CoverFill({ cover }: { cover?: Cover }) {
  if (!cover) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-line text-sm text-muted">
        Tap a cover type above
      </div>
    );
  }
  if (cover.kind === 'photo') {
    return (
      <img
        src={cover.url}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }
  if (cover.kind === 'color') {
    return (
      <div
        className="absolute inset-0 h-full w-full"
        style={{ backgroundColor: cover.bg }}
      />
    );
  }
  if (cover.kind === 'emoji') {
    return (
      <div
        className="absolute inset-0 flex h-full w-full items-center justify-center text-6xl"
        style={{ backgroundColor: cover.bg ?? '#9B5DE5' }}
      >
        {cover.value || '✨'}
      </div>
    );
  }
  if (cover.kind === 'text') {
    return (
      <div
        className="absolute inset-0 flex h-full w-full items-center justify-center px-4 text-center font-pixel text-2xl text-ink"
        style={{ backgroundColor: cover.bg }}
      >
        {cover.value || 'Title'}
      </div>
    );
  }
  if (cover.kind === 'sticker') {
    return (
      <img
        src={cover.url}
        alt=""
        className="absolute inset-0 h-full w-full object-contain"
      />
    );
  }
  return <div className="absolute inset-0 bg-line" />;
}
