import React from 'react';
import {
  AtSignIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  GlobeIcon,
  IdCardIcon,
  MailIcon,
  NewspaperIcon,
  PhoneIcon,
  SquarePenIcon
} from 'lucide-react';
import {
  ACCENTS,
  Avatar,
  BLOBS,
  Breathe,
  EmptyState,
  Screen,
  ScreenBody,
  ScreenHeader,
  SearchField,
  Sheet,
  Toggle,
  cn
} from '../../../../packages/ui';
import { CONTACT_CARD, DAILY_CAP, THREADS } from '../../state/messages';
import { PEOPLE } from '../../state/mock-data';

const ICON = {
  phone: PhoneIcon,
  instagram: AtSignIcon,
  email: MailIcon,
  website: GlobeIcon,
  substack: NewspaperIcon,
  other: AtSignIcon
};

const TINT = {
  phone: 'bg-[#DFF3E4] text-success',
  instagram: 'bg-[#EDE6FF] text-purple',
  email: 'bg-[#FFE1D2] text-coral',
  website: 'bg-[#DCEBFF] text-blue',
  substack: 'bg-[#FFE8C8] text-orange',
  other: 'bg-surface text-ink'
};

const PLACEHOLDER = {
  phone: 'Phone number',
  instagram: '@handle',
  email: 'you@email.com',
  website: 'https://…',
  substack: 'yourname.substack.com',
  other: 'Add a link or handle'
};

/** The inbox. Deliberately small — Bridger is not a chat app. */
export function MessagesScreen({
  empty = false,
  onBack,
  onOpenThread
}: {
  /** day one: no conversations yet */
  empty?: boolean;
  onBack?: () => void;
  onOpenThread?: (id: string) => void;
}) {
  const [query, setQuery] = React.useState('');
  const [composing, setComposing] = React.useState(false);
  const [cardOpen, setCardOpen] = React.useState(false);
  const [fields, setFields] = React.useState(CONTACT_CARD.fields);
  const threads = empty
    ? []
    : THREADS.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <Screen>
      <ScreenHeader
        title="Messages"
        onBack={onBack}
        hideMessages
        trailing={
          <button
            type="button"
            onClick={() => setComposing(true)}
            aria-label="New message"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-line bg-white text-ink hover:bg-[#F1ECFF]"
          >
            <SquarePenIcon className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </button>
        }
      />

      <ScreenBody>
        <Breathe>
          <div
            className={cn(
              'mb-3 overflow-hidden rounded-card border border-ink-line bg-white',
              cardOpen && 'border-purple/40'
            )}
          >
            <button
              type="button"
              onClick={() => setCardOpen((v) => !v)}
              aria-expanded={cardOpen}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#F1ECFF]"
            >
              <IdCardIcon className="h-5 w-5 shrink-0 text-purple" strokeWidth={2.4} />
              <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-ink">
                Your contact card
              </span>
              <ChevronDownIcon
                className={cn(
                  'h-4 w-4 shrink-0 text-ink-mute transition-transform',
                  cardOpen && 'rotate-180'
                )}
                strokeWidth={2.6}
              />
            </button>

            {cardOpen ? (
              <div className="space-y-3 border-t border-ink-line px-4 pb-4 pt-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={CONTACT_CARD.name}
                    emoji={CONTACT_CARD.emoji}
                    accent="teal"
                    size="md"
                  />
                  <p className="min-w-0 flex-1 text-[16px] font-bold tracking-tight text-ink">
                    {CONTACT_CARD.name}
                  </p>
                </div>
                {fields.map((f) => {
                  const Icon = ICON[f.kind];
                  return (
                    <div key={f.id} className="flex items-center gap-3">
                      <span
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                          TINT[f.kind]
                        )}
                      >
                        <Icon className="h-4 w-4" strokeWidth={2.6} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-ink-mute">
                          {f.label}
                        </p>
                        <input
                          value={f.value}
                          onChange={(e) =>
                            setFields((p) =>
                              p.map((x) =>
                                x.id === f.id ? { ...x, value: e.target.value } : x
                              )
                            )
                          }
                          placeholder={PLACEHOLDER[f.kind]}
                          className="w-full border-0 bg-transparent p-0 text-[15px] font-semibold text-ink outline-none"
                          aria-label={`${f.label} value`}
                        />
                      </div>
                      <Toggle
                        checked={f.on}
                        onChange={(v) =>
                          setFields((p) =>
                            p.map((x) => (x.id === f.id ? { ...x, on: v } : x))
                          )
                        }
                        label={f.label}
                      />
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          <SearchField value={query} onChange={setQuery} placeholder="Find a friend" />
        </Breathe>

        <Breathe>
          <div className="mt-5 space-y-2.5">
            {threads.length === 0 && (
              <EmptyState
                emoji="✉️"
                line={
                  empty
                    ? 'No conversations yet. Tap the pen to start one with a friend.'
                    : 'No one by that name.'
                }
              />
            )}
            {threads.map((t, i) => {
              const token = ACCENTS[t.accent];
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onOpenThread?.(t.id)}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-3.5 text-left transition-transform active:scale-[0.99]',
                    BLOBS[i % BLOBS.length],
                    token.bg,
                    token.text
                  )}
                >
                  <Avatar name={t.name} emoji={t.emoji} accent={t.accent} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-bold">{t.name}</span>
                    <span className="block truncate text-[13px] font-semibold opacity-80">
                      {t.preview}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="text-[11px] font-bold opacity-70">{t.time}</span>
                    {t.unread ? (
                      <span aria-label="Unread" className="h-2.5 w-2.5 rounded-full bg-white" />
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </Breathe>

        <Breathe>
          <div className="mt-7 rounded-card bg-[#DFF3E4] px-5 py-5 text-center">
            <p className="font-pixel text-[16px] text-success">
              {DAILY_CAP} messages a day per friend
            </p>
            <p className="mt-1.5 text-[13px] font-semibold text-ink-soft">
              Bridger isn't another inbox. Swap numbers and go live your life.
            </p>
          </div>
        </Breathe>
      </ScreenBody>

      <NewMessageSheet
        open={composing}
        onClose={() => setComposing(false)}
        onPick={(id) => {
          setComposing(false);
          onOpenThread?.(id);
        }}
      />
    </Screen>
  );
}

/** Start a conversation: search your friends, tap one. */
function NewMessageSheet({
  open,
  onClose,
  onPick
}: {
  open: boolean;
  onClose: () => void;
  onPick: (id: string) => void;
}) {
  const [query, setQuery] = React.useState('');
  const matches = PEOPLE.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));

  React.useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  return (
    <Sheet open={open} onClose={onClose} title="New message">
      <div className="space-y-3">
        <SearchField value={query} onChange={setQuery} placeholder="Search friends" />

        <div className="no-scrollbar max-h-[300px] space-y-2 overflow-y-auto pr-0.5">
          {matches.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPick(p.id)}
              className="flex w-full items-center gap-3 rounded-card border border-ink-line bg-white px-3.5 py-3 text-left transition-colors hover:border-purple/40 hover:bg-[#F1ECFF]"
            >
              <Avatar name={p.name} emoji={p.emoji} accent={p.accent} size="sm" />
              <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-ink">
                {p.name}
              </span>
              <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-mute" strokeWidth={2.6} />
            </button>
          ))}

          {matches.length === 0 ? (
            <p className="py-6 text-center text-[13px] font-semibold text-ink-mute">
              No friends found
            </p>
          ) : null}
        </div>
      </div>
    </Sheet>
  );
}
