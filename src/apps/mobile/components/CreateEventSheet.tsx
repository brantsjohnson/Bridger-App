import React from 'react';
import { Cover } from '../../../packages/shared';
import {
  Avatar,
  ButtonPrimary,
  ButtonSecondary,
  COVER_PX,
  Chip,
  CoverArt,
  ListRow,
  Sheet,
  TextField,
  Toggle } from
'../../../packages/ui';
import { CoverPicker } from './CoverPicker';
import { PEOPLE, SUGGESTIONS, personById } from '../state/mock-data';

const CAP = 35;

const CHIP_METHODS = ['Venmo', 'Cash App', 'PayPal', 'Zelle', 'Cash in person'];

/** Create flow: one form, top to bottom. Suggested invites come from matching. */
export function CreateEventSheet({
  open,
  onClose



}: {open: boolean;onClose: () => void;}) {
  const [title, setTitle] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [place, setPlace] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [bring, setBring] = React.useState('');
  const [chipIn, setChipIn] = React.useState('');
  const [chipInAmount, setChipInAmount] = React.useState('');
  const [chipInMethod, setChipInMethod] = React.useState('');
  const [friendsInvite, setFriendsInvite] = React.useState(true);
  const [invited, setInvited] = React.useState<string[]>(['maya', 'devon']);
  const [cover, setCover] = React.useState<Cover>({ kind: 'emoji', value: '✏️' });
  const [coverOpen, setCoverOpen] = React.useState(false);

  const toggle = (id: string) =>
  setInvited((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const overCap = invited.length > CAP;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Create event"
      footer={
      <ButtonPrimary full size="md" onClick={onClose}>
          {overCap ? 'Expand guest list · $6' : 'Create'}
        </ButtonPrimary>
      }>
      
      <div className="no-scrollbar max-h-[420px] space-y-3 overflow-y-auto pr-0.5">
        <div>
          <p className="mb-2 text-[12px] font-bold text-ink-soft">Cover</p>
          <button
            type="button"
            onClick={() => setCoverOpen(true)}
            className="block h-24 w-full overflow-hidden rounded-card border border-ink-line">
            
            <CoverArt cover={cover} accent="purple" />
          </button>
          <p className="mt-1.5 text-[11px] font-medium text-ink-mute">
            Photo {COVER_PX}, or tile an emoji or sticker.
          </p>
        </div>

        <TextField label="Title" value={title} onChange={setTitle} placeholder="Sketch night" />
        <TextField label="Bio" value={bio} onChange={setBio} placeholder="Pens, paper, no pressure." multiline />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Date" value="Fri 31 Jul" onChange={() => undefined} />
          <TextField label="Time" value="18:30" onChange={() => undefined} />
        </div>
        <TextField label="Place" value={place} onChange={setPlace} placeholder="Rowan Park" />
        <TextField
          label="Address"
          value={address}
          onChange={setAddress}
          placeholder="Street, unit, how to get in" />
        
        <p className="-mt-1 text-[11px] font-medium text-ink-mute">
          Only people going or invited can see the address.
        </p>
        <TextField label="Bring" value={bring} onChange={setBring} placeholder="A drink to share" />

        {/* how much, and how to send it — nobody should have to ask */}
        <div className="rounded-card border border-ink-line bg-white p-3.5">
          <p className="text-[13px] font-bold text-ink">Chipping in (optional)</p>
          <p className="mt-0.5 text-[12px] font-semibold leading-snug text-ink-mute">
            Guests pay you directly. We never touch it.
          </p>
          <div className="mt-3 space-y-3">
            <TextField
              label="Amount per person"
              value={chipInAmount}
              onChange={setChipInAmount}
              placeholder="$5" />
            
            <div>
              <p className="mb-2 text-[12px] font-bold text-ink-soft">How to send it</p>
              <div className="flex flex-wrap gap-2">
                {CHIP_METHODS.map((m) =>
                <Chip
                  key={m}
                  label={m}
                  accent="teal"
                  size="sm"
                  selected={chipInMethod === m}
                  onClick={() => setChipInMethod(chipInMethod === m ? '' : m)} />

                )}
              </div>
            </div>
            {chipInMethod && chipInMethod !== 'Cash in person' &&
            <TextField
              label={`${chipInMethod} handle`}
              value={chipIn}
              onChange={setChipIn}
              placeholder="@your-handle" />

            }
          </div>
        </div>

        <div>
          <p className="mb-2 text-[12px] font-bold text-ink-soft">Invite a group</p>
          <div className="flex flex-wrap gap-2">
            {['Close', 'Friends', 'Acquaintances'].map((g) =>
            <Chip key={g} label={g} accent="purple" onClick={() => undefined} />
            )}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[12px] font-bold text-ink-soft">
            Invite people · {invited.length} of {CAP}
          </p>
          <div className="space-y-2">
            {PEOPLE.slice(0, 4).map((p) =>
            <ListRow
              key={p.id}
              leading={<Avatar name={p.name} emoji={p.emoji} accent={p.accent} size="sm" />}
              label={p.name}
              action={
              <ButtonSecondary
                size="sm"
                tone={invited.includes(p.id) ? 'solid' : 'outline'}
                onClick={() => toggle(p.id)}>
                
                    {invited.includes(p.id) ? 'Invited' : 'Invite'}
                  </ButtonSecondary>
              } />

            )}
          </div>
        </div>

        <ListRow
          label="Let friends invite friends"
          sublabel="Opens the list to second-degree"
          action={<Toggle checked={friendsInvite} onChange={setFriendsInvite} label="Let friends invite friends" />} />
        

        <div>
          <p className="mb-2 text-[12px] font-bold text-ink-soft">Suggested invites</p>
          <div className="space-y-2">
            {SUGGESTIONS.map((s) => {
              const p = personById(s.personId);
              return (
                <ListRow
                  key={s.id}
                  leading={<Avatar name={p.name} emoji={p.emoji} accent={p.accent} size="sm" />}
                  label={p.name}
                  sublabel={s.sharedThread}
                  action={
                  <ButtonSecondary size="sm" onClick={() => toggle(p.id)}>
                      Add
                    </ButtonSecondary>
                  } />);


            })}
          </div>
        </div>
      </div>

      <CoverPicker
        open={coverOpen}
        value={cover}
        onClose={() => setCoverOpen(false)}
        onChange={setCover} />
      
    </Sheet>);

}