import React from 'react';
import {
  CheckIcon,
  ImageIcon,
  LinkIcon,
  MapPinIcon,
  MessageSquareIcon,
  PlusIcon,
  TypeIcon,
  UploadIcon,
  XIcon } from
'lucide-react';
import {
  CORE_WIDGET_ORDER,
  CoreWidget,
  CustomWidget,
  CustomWidgetType,
  DEFAULT_PROFILE_THEME,
  PROFILE_BACKGROUNDS,
  PROFILE_PRESETS,
  ProfileFont,
  ProfileTheme } from
'../../../../packages/shared';
import {
  Breathe,
  ButtonPrimary,
  ButtonSecondary,
  ProfileSkin,
  Screen,
  ScreenBody,
  ScreenHeader,
  cn } from
'../../../../packages/ui';

const PAGE_COLORS = ['#FAF8F2', '#0F1A33', '#180F2E', '#F6F1E6', '#FDF0EC', '#E8F1EC', '#1A1A1B'];
const CARD_COLORS = ['#FFFFFF', '#1B2947', '#2A1B4D', '#FFFEFA', '#FFF8F5', '#F4FAF6', '#26262A'];
const TEXT_COLORS = ['#1C1B16', '#EDF1FB', '#F4EEFF', '#3A2C29', '#2B2721', '#0B3A2A'];
const ACCENT_COLORS = ['#6D3BEB', '#FF5FD2', '#7FA8FF', '#C2547A', '#D2691E', '#00A676', '#FFB515'];

const FONTS: Array<{id: ProfileFont;label: string;}> = [
{ id: 'clean', label: 'Clean' },
{ id: 'serif', label: 'Serif' },
{ id: 'pixel', label: 'Pixel' },
{ id: 'mono', label: 'Mono' },
{ id: 'round', label: 'Round' }];


const CORNERS: Array<{id: ProfileTheme['corners'];label: string;}> = [
{ id: 'round', label: 'Round' },
{ id: 'soft', label: 'Soft' },
{ id: 'square', label: 'Square' }];


const VEILS: Array<{id: ProfileTheme['backgroundVeil'];label: string;}> = [
{ id: 'clear', label: 'Full photo' },
{ id: 'soft', label: 'Softened' },
{ id: 'heavy', label: 'Faded' }];


/** Icon components, not elements — nothing is constructed at module scope. */
const WIDGET_TYPES: Array<{
  id: CustomWidgetType;
  label: string;
  Icon: typeof ImageIcon;
}> = [
{ id: 'photos', label: 'Photos', Icon: ImageIcon },
{ id: 'text', label: 'Text', Icon: TypeIcon },
{ id: 'quote', label: 'Quote', Icon: MessageSquareIcon },
{ id: 'pinned', label: 'Pinned', Icon: MapPinIcon },
{ id: 'link', label: 'Link', Icon: LinkIcon }];


const SLOT_LABEL: Record<CoreWidget, string> = {
  header: 'Header',
  currently: 'Currently',
  hobbies: 'Hobbies',
  placesMap: 'Places traveled',
  thisOrThat: 'This or that',
  aboutMe: 'About me',
  favs: 'List of favs',
  insideJokes: 'Inside jokes'
};

/**
 * Make your page yours. A background photo, your own colors, a typeface and a
 * corner shape, plus your own widgets in the gaps between the fixed core ones.
 * MySpace-level expression, no code, and nothing here can make the page
 * unreadable: the plain original is always one tap away for any viewer.
 */
export function CustomizeProfileScreen({
  theme: initialTheme,
  widgets: initialWidgets,
  onSave,
  onBack





}: {theme: ProfileTheme;widgets: CustomWidget[];onSave: (theme: ProfileTheme, widgets: CustomWidget[]) => void;onBack?: () => void;}) {
  const [theme, setTheme] = React.useState<ProfileTheme>(initialTheme);
  const [widgets, setWidgets] = React.useState<CustomWidget[]>(initialWidgets);
  const [slot, setSlot] = React.useState<CoreWidget>('header');

  const set = <K extends keyof ProfileTheme,>(key: K, value: ProfileTheme[K]) =>
  setTheme((t) => ({ ...t, [key]: value }));

  const addWidget = (type: CustomWidgetType) =>
  setWidgets((p) => [
  ...p,
  {
    id: `cw-${Date.now()}`,
    afterCoreWidget: slot,
    order: p.filter((w) => w.afterCoreWidget === slot).length,
    type,
    title: type === 'link' ? 'My site' : type === 'pinned' ? 'Pinned' : undefined,
    body:
    type === 'text' ?
    'Something about me.' :
    type === 'quote' ?
    '"Say less."' :
    undefined,
    visibleToTier: 'friend'
  }]
  );

  return (
    <Screen>
      <ScreenHeader
        title="Customize your page"
        onBack={onBack}
        hideMessages
        trailing={
        <ButtonSecondary size="sm" tone="solid" onClick={() => onSave(theme, widgets)}>
            Save
          </ButtonSecondary>
        } />
      
      <ScreenBody>
        {/* what your friends will actually see */}
        <Breathe>
          <ProfileSkin theme={theme} className="overflow-hidden rounded-card border border-ink-line">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 items-center justify-center rounded-full text-[22px]"
                  style={{ backgroundColor: theme.accentColor }}>
                  
                  🌸
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[17px] font-bold text-ink">Sandra Kim</p>
                  <p className="truncate text-[12px] font-semibold text-ink-mute">Portland, OR</p>
                </div>
              </div>
              <div className="mt-3 rounded-card bg-white p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-ink-mute">
                  Currently
                </p>
                <p className="text-[14px] font-bold text-ink">Blue Rev · Alvvays</p>
              </div>
              <div className="mt-2.5 flex gap-2">
                <span
                  className="rounded-full px-3 py-1.5 text-[12px] font-bold"
                  style={{ backgroundColor: theme.accentColor, color: theme.cardColor }}>
                  
                  Film photos
                </span>
                <span className="rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-ink-soft">
                  Trail runs
                </span>
              </div>
            </div>
          </ProfileSkin>
          <p className="mt-2 text-[12px] font-semibold text-ink-mute">
            Live preview. Anyone can still switch to the plain version.
          </p>
        </Breathe>

        <Section title="Start with a look">
          <div className="no-scrollbar -mx-5 flex gap-2.5 overflow-x-auto px-5">
            {PROFILE_PRESETS.map((p) => {
              const on = theme.backgroundId === p.backgroundId && theme.font === p.font;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setTheme({ ...p })}
                  aria-pressed={on}
                  className={cn(
                    'w-[104px] shrink-0 overflow-hidden rounded-card border-2 text-left',
                    on ? 'border-ink' : 'border-ink-line'
                  )}>
                  
                  <span
                    className="flex h-16 items-end p-2"
                    style={{
                      backgroundColor: p.pageColor,
                      backgroundImage: p.backgroundUrl ? `url(${p.backgroundUrl})` : undefined,
                      backgroundSize: 'cover'
                    }}>
                    
                    <span
                      className="h-5 w-full rounded"
                      style={{ backgroundColor: p.cardColor }} />
                    
                  </span>
                  <span className="block bg-surface px-2 py-1.5 text-[12px] font-bold text-ink">
                    {p.label}
                  </span>
                </button>);

            })}
          </div>
        </Section>

        <Section title="Background photo">
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setTheme((t) => ({ ...t, backgroundId: null, backgroundUrl: undefined }))}
              aria-pressed={theme.backgroundId === null}
              className={cn(
                'flex h-20 flex-col items-center justify-center gap-1 rounded-card border-2 text-[12px] font-bold text-ink-soft',
                theme.backgroundId === null ? 'border-ink' : 'border-ink-line'
              )}>
              
              <XIcon className="h-4 w-4" strokeWidth={2.6} />
              None
            </button>

            {PROFILE_BACKGROUNDS.map((b) => {
              const on = theme.backgroundId === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() =>
                  setTheme((t) => ({ ...t, backgroundId: b.id, backgroundUrl: b.url }))
                  }
                  aria-pressed={on}
                  aria-label={b.label}
                  className={cn(
                    'relative h-20 overflow-hidden rounded-card border-2',
                    on ? 'border-ink' : 'border-ink-line'
                  )}>
                  
                  <img src={b.url} alt="" className="h-full w-full object-cover" />
                  {on &&
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <CheckIcon className="h-5 w-5 text-white" strokeWidth={3.5} />
                    </span>
                  }
                </button>);

            })}

            <button
              type="button"
              onClick={() =>
              setTheme((t) => ({
                ...t,
                backgroundId: 'upload',
                backgroundUrl: PROFILE_BACKGROUNDS[4].url
              }))
              }
              className="flex h-20 flex-col items-center justify-center gap-1 rounded-card border-2 border-dashed border-ink-line text-[12px] font-bold text-ink-soft">
              
              <UploadIcon className="h-4 w-4" strokeWidth={2.6} />
              Yours
            </button>
          </div>

          {theme.backgroundUrl &&
          <div className="mt-2.5 flex gap-2">
              {VEILS.map((v) =>
            <button
              key={v.id}
              type="button"
              onClick={() => set('backgroundVeil', v.id)}
              aria-pressed={theme.backgroundVeil === v.id}
              className={cn(
                'flex-1 rounded-full border px-3 py-2 text-[12px] font-bold',
                theme.backgroundVeil === v.id ?
                'border-ink bg-green text-ink' :
                'border-ink-line bg-surface text-ink-soft'
              )}>
              
                  {v.label}
                </button>
            )}
            </div>
          }
        </Section>

        <Section title="Colors">
          <Swatches
            label="Page"
            colors={PAGE_COLORS}
            value={theme.pageColor}
            onChange={(c) => set('pageColor', c)} />
          
          <Swatches
            label="Cards"
            colors={CARD_COLORS}
            value={theme.cardColor}
            onChange={(c) => set('cardColor', c)} />
          
          <Swatches
            label="Words"
            colors={TEXT_COLORS}
            value={theme.textColor}
            onChange={(c) => set('textColor', c)} />
          
          <Swatches
            label="Highlights"
            colors={ACCENT_COLORS}
            value={theme.accentColor}
            onChange={(c) => set('accentColor', c)} />
          
        </Section>

        <Section title="Type & shape">
          <div className="flex flex-wrap gap-2">
            {FONTS.map((f) =>
            <button
              key={f.id}
              type="button"
              onClick={() => set('font', f.id)}
              aria-pressed={theme.font === f.id}
              className={cn(
                'rounded-full border px-4 py-2 text-[13px] font-bold',
                theme.font === f.id ?
                'border-ink bg-green text-ink' :
                'border-ink-line bg-surface text-ink-soft'
              )}>
              
                {f.label}
              </button>
            )}
          </div>
          <div className="mt-2.5 flex gap-2">
            {CORNERS.map((c) =>
            <button
              key={c.id}
              type="button"
              onClick={() => set('corners', c.id)}
              aria-pressed={theme.corners === c.id}
              className={cn(
                'flex-1 border px-3 py-2 text-[12px] font-bold',
                c.id === 'round' ? 'rounded-[18px]' : c.id === 'soft' ? 'rounded-[8px]' : 'rounded-[2px]',
                theme.corners === c.id ?
                'border-ink bg-green text-ink' :
                'border-ink-line bg-surface text-ink-soft'
              )}>
              
                {c.label}
              </button>
            )}
          </div>
        </Section>

        <Section title="Your own widgets">
          <p className="mb-2.5 text-[12px] font-semibold text-ink-mute">
            The core widgets stay in the same order on every profile, so nobody has to relearn
            your page. Yours go in the gaps.
          </p>

          <div className="no-scrollbar -mx-5 mb-2.5 flex gap-1.5 overflow-x-auto px-5">
            {CORE_WIDGET_ORDER.map((c) =>
            <button
              key={c}
              type="button"
              onClick={() => setSlot(c)}
              aria-pressed={slot === c}
              className={cn(
                'shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold',
                slot === c ?
                'bg-ink text-canvas' :
                'border border-ink-line bg-surface text-ink-soft'
              )}>
              
                After {SLOT_LABEL[c]}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {WIDGET_TYPES.map((w) =>
            <button
              key={w.id}
              type="button"
              onClick={() => addWidget(w.id)}
              className="flex items-center gap-1.5 rounded-full border border-ink-line bg-surface px-3 py-2 text-[12px] font-bold text-ink">
              
                <w.Icon className="h-4 w-4" strokeWidth={2.4} />
                {w.label}
              </button>
            )}
          </div>

          {widgets.length > 0 &&
          <ul className="mt-3 space-y-2">
              {widgets.map((w) =>
            <li
              key={w.id}
              className="flex items-center gap-3 rounded-card border border-ink-line bg-surface px-3.5 py-3">
              
                  <PlusIcon aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-mute" strokeWidth={2.6} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold text-ink">
                      {w.title ?? WIDGET_TYPES.find((t) => t.id === w.type)?.label}
                    </span>
                    <span className="block text-[11px] font-semibold text-ink-mute">
                      After {SLOT_LABEL[w.afterCoreWidget]}
                    </span>
                  </span>
                  <button
                type="button"
                onClick={() => setWidgets((p) => p.filter((x) => x.id !== w.id))}
                className="shrink-0 text-[12px] font-bold text-coral">
                
                    Remove
                  </button>
                </li>
            )}
            </ul>
          }
        </Section>

        <Breathe>
          <div className="mt-7 space-y-2.5">
            <ButtonPrimary full onClick={() => onSave(theme, widgets)}>
              Save my page
            </ButtonPrimary>
            <ButtonSecondary
              full
              tone="ghost"
              onClick={() => {
                setTheme(DEFAULT_PROFILE_THEME);
                setWidgets([]);
              }}>
              
              Reset to plain
            </ButtonSecondary>
          </div>
        </Breathe>
      </ScreenBody>
    </Screen>);

}

function Section({ title, children }: {title: string;children: React.ReactNode;}) {
  return (
    <Breathe>
      <section className="mt-7">
        <h2 className="mb-2 text-[12px] font-bold uppercase tracking-wide text-ink-mute">
          {title}
        </h2>
        {children}
      </section>
    </Breathe>);

}

function Swatches({
  label,
  colors,
  value,
  onChange





}: {label: string;colors: string[];value: string;onChange: (c: string) => void;}) {
  return (
    <div className="mb-3 last:mb-0">
      <p className="mb-1.5 text-[12px] font-bold text-ink-soft">{label}</p>
      <div className="flex flex-wrap gap-2">
        {colors.map((c) =>
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-label={`${label} ${c}`}
          aria-pressed={value === c}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full border',
            value === c ? 'border-ink ring-2 ring-ink ring-offset-2' : 'border-ink-line'
          )}
          style={{ backgroundColor: c }}>
          
            {value === c &&
          <CheckIcon
            className="h-4 w-4"
            strokeWidth={3.5}
            style={{ color: c === '#FFFFFF' ? '#1C1B16' : '#FFFFFF' }} />

          }
          </button>
        )}
        <label
          className="flex h-9 items-center gap-1.5 rounded-full border border-dashed border-ink-line px-3 text-[12px] font-bold text-ink-soft">
          
          Custom
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-label={`Pick a custom ${label.toLowerCase()} color`}
            className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0" />
          
        </label>
      </div>
    </div>);

}