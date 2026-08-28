import React from 'react';
import {
  AtSignIcon,
  GlobeIcon,
  MailIcon,
  NewspaperIcon,
  PhoneIcon
} from 'lucide-react';
import {
  Avatar,
  Breathe,
  Screen,
  ScreenBody,
  ScreenHeader,
  Toggle,
  cn
} from '../../../../packages/ui';
import { CONTACT_CARD } from '../../state/messages';

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

/**
 * Legacy full-screen editor (Messages now uses an inline dropdown).
 * Share contact lives on the thread — not here.
 */
export function ContactCardScreen({ onBack }: { onBack?: () => void }) {
  const [fields, setFields] = React.useState(CONTACT_CARD.fields);

  return (
    <Screen>
      <ScreenHeader title="Contact card" onBack={onBack} hideMessages />

      <ScreenBody>
        <Breathe>
          <div className="mt-1 rounded-card border border-ink-line bg-white px-5 py-6 text-center">
            <div className="flex justify-center">
              <Avatar name={CONTACT_CARD.name} emoji={CONTACT_CARD.emoji} accent="teal" size="xl" />
            </div>
            <p className="mt-3 text-[19px] font-bold tracking-tight text-ink">
              {CONTACT_CARD.name}
            </p>

            <div className="mt-4 space-y-3 text-left">
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
          </div>
        </Breathe>
      </ScreenBody>
    </Screen>
  );
}
