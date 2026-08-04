import React from 'react';
import { CameraIcon, PlusIcon } from 'lucide-react';
import {
  ACCENTS,
  AudienceLevel,
  Avatar,
  Breathe,
  ButtonSecondary,
  Chip,
  Screen,
  ScreenBody,
  ScreenHeader,
  cn } from
'../../../../packages/ui';
import { ActivityCapture } from '../../components/ActivityCapture';
import { WEEKLY_ACTIVITY, personById } from '../../state/mock-data';

const AUDIENCE_LABEL: Record<string, string> = {
  close: 'close friends',
  friend: 'friends',
  everyone: 'everyone'
};

/** A tier, or the name of one of your groups. */
function audienceLabel(a: AudienceLevel | string) {
  return AUDIENCE_LABEL[a] ?? a;
}

/**
 * The hosted collage. Everyone's polaroid on one wall, plus your own slot.
 * Contributions respect tiers exactly like any other post, so each viewer only
 * sees what was shared with their circle.
 */
export function ActivityScreen({
  empty = false,
  onBack




}: { /** day one: the prompt is up, nobody has posted */empty?: boolean;onBack?: () => void;}) {
  const activity = WEEKLY_ACTIVITY;
  const posts = empty ? [] : activity.posts;
  const [capture, setCapture] = React.useState(false);
  const [mine, setMine] = React.useState<{
    emoji: string;
    caption: string;
    audience: AudienceLevel | string;
  } | null>(null);

  return (
    <Screen>
      <ScreenHeader title={activity.title} onBack={onBack} />
      <ScreenBody>
        <Breathe>
          <div className={cn('rounded-card px-5 py-5', ACCENTS[activity.accent].tintSolid)}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-mute">
              The prompt
            </p>
            <p className="mt-1 text-[19px] font-bold leading-snug tracking-tight text-ink">
              {activity.prompt}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Chip label={activity.closesIn} size="sm" accent={activity.accent} selected />
              <Chip label={`${posts.length + (mine ? 1 : 0)} posted`} size="sm" />
            </div>
          </div>
        </Breathe>

        {!mine &&
        <Breathe>
            <div className="mt-5">
              <ButtonSecondary
              full
              size="lg"
              tone="solid"
              icon={<CameraIcon className="h-4 w-4" strokeWidth={2.6} />}
              onClick={() => setCapture(true)}>
              
                Post yours
              </ButtonSecondary>
            </div>
          </Breathe>
        }

        <Breathe>
          <section>
            <div className="grid grid-cols-2 gap-3.5">
              {mine ?
              <figure className="rotate-1 rounded-none border-2 border-ink bg-white p-2 pb-3">
                  <span className="flex h-[112px] items-center justify-center bg-pink/30 text-[42px]">
                    <span aria-hidden="true">{mine.emoji}</span>
                  </span>
                  <figcaption className="mt-2">
                    <span className="block text-[12px] font-bold text-ink">You · just now</span>
                    {mine.caption &&
                  <span className="block truncate text-[11px] font-medium text-ink-mute">
                        {mine.caption}
                      </span>
                  }
                    <span className="mt-1 block text-[10px] font-bold uppercase tracking-wide text-ink-mute">
                      Shared with {audienceLabel(mine.audience)}
                    </span>
                  </figcaption>
                </figure> :

              <button
                type="button"
                onClick={() => setCapture(true)}
                className="-rotate-1 flex h-full min-h-[164px] flex-col items-center justify-center gap-2 rounded-none border-2 border-dashed border-ink/30 bg-white text-ink-soft transition-colors hover:border-purple/60 hover:bg-[#F1ECFF] hover:text-purple">
                
                  <PlusIcon className="h-6 w-6" strokeWidth={2.6} />
                  <span className="text-[12px] font-bold">Post yours</span>
                </button>
              }

              {posts.map((post, i) => {
                const person = personById(post.personId);
                return (
                  <figure
                    key={post.id}
                    className={cn(
                      'rounded-none border border-ink-line bg-white p-2 pb-3 shadow-[2px_2px_0_rgba(28,27,22,0.12)]',
                      i % 2 === 0 ? '-rotate-1' : 'rotate-1'
                    )}>
                    
                    <span
                      className={cn(
                        'flex h-[112px] items-center justify-center text-[42px]',
                        ACCENTS[person.accent].tintSolid
                      )}>
                      
                      <span aria-hidden="true">{post.emoji}</span>
                    </span>
                    <figcaption className="mt-2 flex items-center gap-2">
                      <Avatar name={person.name} emoji={person.emoji} accent={person.accent} size="xs" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12px] font-bold text-ink">
                          {person.name.split(' ')[0]}
                        </span>
                        <span className="block truncate text-[11px] font-medium text-ink-mute">
                          {post.caption}
                        </span>
                      </span>
                    </figcaption>
                  </figure>);

              })}
            </div>

            {posts.length === 0 && !mine &&
            <p className="mt-4 text-center text-[13px] font-semibold text-ink-mute">
                Nobody has posted yet. Go first.
              </p>
            }
          </section>
        </Breathe>
      </ScreenBody>

      <ActivityCapture
        open={capture}
        prompt={activity.prompt}
        onClose={() => setCapture(false)}
        onPost={(caption, audience) => {
          setMine({ emoji: '🧢', caption, audience });
          setCapture(false);
        }} />
      
    </Screen>);

}