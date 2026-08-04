import React from 'react';
import { ImageIcon, ScissorsIcon, UploadIcon } from 'lucide-react';
import { Cover } from '../../../packages/shared';
import {
  ButtonSecondary,
  COVER_PX,
  CoverArt,
  SegmentedTabs,
  Sheet,
  cn } from
'../../../packages/ui';
import { EVENT_BANNER, SAVED_STICKERS } from '../state/mock-data';

const TABS = ['Photo', 'Emoji', 'Stickers'];

const EMOJI = [
'✏️', '🎨', '🍜', '🎬', '🏕', '🎧', '🌊', '🧺',
'🪩', '🚲', '📚', '🍰', '⛰', '🎲', '🫖', '🐈'];


/**
 * One picker for every cover surface: upload a photo, tile a single emoji,
 * or use a saved cutout sticker. Cutouts you paste are kept in your tray.
 */
export function CoverPicker({
  open,
  value,
  onClose,
  onChange





}: {open: boolean;value?: Cover;onClose: () => void;onChange: (cover: Cover) => void;}) {
  const [tab, setTab] = React.useState(TABS[1]);
  const [stickers, setStickers] = React.useState(SAVED_STICKERS);

  const pasteCutout = () => {
    const next = { id: `st${stickers.length + 1}`, url: SAVED_STICKERS[0].url, label: 'Pasted' };
    setStickers((p) => [next, ...p]);
    onChange({ kind: 'sticker', url: next.url });
  };

  return (
    <Sheet open={open} onClose={onClose} title="Cover">
      <div className="space-y-4">
        <div className="h-24 overflow-hidden rounded-card border border-ink-line">
          <CoverArt cover={value} accent="purple" />
        </div>

        <SegmentedTabs tabs={TABS} value={tab} onChange={setTab} />

        {tab === 'Photo' &&
        <div className="space-y-2.5">
            <button
            type="button"
            onClick={() => onChange({ kind: 'photo', url: PLACEHOLDER_PHOTO })}
            className="flex w-full flex-col items-center gap-2 rounded-card border-2 border-dashed border-ink-line bg-white px-6 py-8 text-ink-soft transition-colors hover:border-purple/50 hover:bg-[#F1ECFF] hover:text-purple">
            
              <UploadIcon className="h-6 w-6" strokeWidth={2.2} />
              <span className="text-[14px] font-bold">Upload a banner</span>
              <span className="text-[12px] font-semibold text-ink-mute">{COVER_PX}</span>
            </button>
            <p className="px-1 text-[12px] font-medium text-ink-mute">
              No photo? An emoji or sticker tiles into a cover instead.
            </p>
          </div>
        }

        {tab === 'Emoji' &&
        <div className="grid grid-cols-8 gap-2">
            {EMOJI.map((e) => {
            const active = value?.kind === 'emoji' && value.value === e;
            return (
              <button
                key={e}
                type="button"
                onClick={() => onChange({ kind: 'emoji', value: e })}
                aria-pressed={active}
                className={cn(
                  'flex aspect-square items-center justify-center rounded-lg border text-[20px]',
                  active ?
                  'border-purple bg-[#F1ECFF]' :
                  'border-ink-line bg-white hover:bg-[#F1ECFF]'
                )}>
                
                  {e}
                </button>);

          })}
          </div>
        }

        {tab === 'Stickers' &&
        <div className="space-y-3">
            <button
            type="button"
            onClick={pasteCutout}
            className="flex w-full items-center gap-3 rounded-card border-2 border-dashed border-ink-line bg-white px-4 py-4 text-left transition-colors hover:border-purple/50 hover:bg-[#F1ECFF]">
            
              <ScissorsIcon className="h-5 w-5 shrink-0 text-purple" strokeWidth={2.4} />
              <span className="min-w-0">
                <span className="block text-[14px] font-bold text-ink">Paste a cutout</span>
                <span className="block text-[12px] font-semibold text-ink-mute">
                  Long-press a photo subject, copy, paste here
                </span>
              </span>
            </button>

            <div className="grid grid-cols-4 gap-2.5">
              {stickers.map((s) => {
              const active = value?.kind === 'sticker' && value.url === s.url;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onChange({ kind: 'sticker', url: s.url })}
                  aria-pressed={active}
                  className={cn(
                    'flex aspect-square items-center justify-center overflow-hidden rounded-lg border bg-white p-1.5',
                    active ? 'border-purple bg-[#F1ECFF]' : 'border-ink-line hover:bg-[#F1ECFF]'
                  )}>
                  
                    <img src={s.url} alt={s.label} className="h-full w-full object-contain" />
                  </button>);

            })}
            </div>
            <p className="px-1 text-[12px] font-medium text-ink-mute">
              Saved cutouts stay in your tray for any cover.
            </p>
          </div>
        }

        <ButtonSecondary
          full
          size="md"
          tone="solid"
          icon={<ImageIcon className="h-4 w-4" strokeWidth={2.5} />}
          onClick={onClose}>
          
          Use this cover
        </ButtonSecondary>
      </div>
    </Sheet>);

}

const PLACEHOLDER_PHOTO = EVENT_BANNER;