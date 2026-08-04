import React from 'react';
import { AtSignIcon, MailIcon, PhoneIcon } from 'lucide-react';
import {
  Avatar,
  Breathe,
  ButtonSecondary,
  Screen,
  ScreenBody,
  ScreenHeader,
  Toggle,
  cn } from
'../../../../packages/ui';
import { CONTACT_CARD } from '../../state/messages';

const ICON = {
  phone: PhoneIcon,
  instagram: AtSignIcon,
  email: MailIcon
};

const TINT = {
  phone: 'bg-[#DFF3E4] text-success',
  instagram: 'bg-[#EDE6FF] text-purple',
  email: 'bg-[#FFE1D2] text-coral'
};

/** Set up once, share it anytime. You choose what's on it. */
export function ContactCardScreen({ onBack }: {onBack?: () => void;}) {
  const [fields, setFields] = React.useState(CONTACT_CARD.fields);
  const [editing, setEditing] = React.useState(false);
  const shown = fields.filter((f) => f.on);

  return (
    <Screen>
      <ScreenHeader
        title="Contact card"
        onBack={onBack}
        hideMessages
        trailing={
        <ButtonSecondary
          size="sm"
          tone={editing ? 'solid' : 'outline'}
          onClick={() => setEditing((v) => !v)}>
          
            {editing ? 'Done' : 'Edit'}
          </ButtonSecondary>
        } />
      
      <ScreenBody>
        <Breathe>
          <p className="text-[13px] font-semibold text-ink-mute">
            Set up once · share it anytime
          </p>
        </Breathe>

        <Breathe>
          <div className="mt-4 rounded-card border border-ink-line bg-white px-5 py-6 text-center">
            <div className="flex justify-center">
              <Avatar name={CONTACT_CARD.name} emoji={CONTACT_CARD.emoji} accent="teal" size="xl" />
            </div>
            <p className="mt-3 text-[19px] font-bold tracking-tight text-ink">
              {CONTACT_CARD.name}
            </p>

            <div className="mt-4 space-y-2.5 text-left">
              {(editing ? fields : shown).map((f) => {
                const Icon = ICON[f.kind];
                return (
                  <div key={f.id} className="flex items-center gap-3">
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                        TINT[f.kind]
                      )}>
                      
                      <Icon className="h-4 w-4" strokeWidth={2.6} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink">
                      {f.value}
                    </span>
                    {editing &&
                    <Toggle
                      checked={f.on}
                      onChange={(v) =>
                      setFields((p) => p.map((x) => x.id === f.id ? { ...x, on: v } : x))
                      }
                      label={f.label} />

                    }
                  </div>);

              })}
            </div>
          </div>
        </Breathe>

        <Breathe>
          <div className="mt-5">
            <ButtonSecondary full size="lg" tone="positive">
              Share contact
            </ButtonSecondary>
            <p className="mt-2 text-center text-[12px] font-semibold text-ink-mute">
              Pick what's on it · edit anytime
            </p>
          </div>
        </Breathe>
      </ScreenBody>
    </Screen>);

}