import React from 'react';
import { MeetContext, Tier } from '../../../../packages/shared';
import {
  Avatar,
  Breathe,
  ButtonPrimary,
  ButtonSecondary,
  Card,
  PixelHeading,
  Screen,
  ScreenBody,
  StoryProgressBars } from
'../../../../packages/ui';
import { CommonalityList } from '../../components/CommonalityList';
import { HowYouMetStep } from '../../components/reveal/HowYouMetStep';
import { COMMONALITIES, personById } from '../../state/mock-data';

type Frame = 'met' | 'tier' | 'strongest' | 'others' | 'next';
const ORDER: Frame[] = ['met', 'tier', 'strongest', 'others', 'next'];

/** Shallow, pairwise reveal. Tier first — nothing private is shown before it's set. */
export function RevealScreen({ personId = 'nour' }: {personId?: string;}) {
  const person = personById(personId);
  const [frame, setFrame] = React.useState<Frame>('met');
  const [tier, setTier] = React.useState<Tier | null>(null);
  const [context, setContext] = React.useState<MeetContext | null>(null);
  const [recordPlace, setRecordPlace] = React.useState(true);
  const index = ORDER.indexOf(frame);
  const strongest = COMMONALITIES.find((c) => c.strongest);

  const advance = () => setFrame(ORDER[Math.min(ORDER.length - 1, index + 1)]);

  return (
    <Screen tone="color" accent="bg-purple/25">
      <div className="px-5 pt-4">
        <StoryProgressBars segments={ORDER.length} active={index} />
      </div>

      <ScreenBody className="pb-6 pt-6">
        <Breathe>
          <div className="flex flex-col items-center text-center">
            <Avatar name={person.name} emoji={person.emoji} accent={person.accent} size="xl" />
            <PixelHeading as="h1" size="md" className="mt-4">
              {person.name}
            </PixelHeading>
          </div>
        </Breathe>

        {frame === 'met' &&
        <Breathe>
            <div className="mt-8">
              <PixelHeading as="h2" size="md" className="mb-4 text-center">
                How did you two meet?
              </PixelHeading>
              <HowYouMetStep
              context={context}
              onContext={setContext}
              recordPlace={recordPlace}
              onRecordPlace={setRecordPlace} />
            
            </div>
          </Breathe>
        }

        {frame === 'tier' &&
        <Breathe>
            <div className="mt-8 space-y-2.5">
              <p className="text-center text-[15px] font-semibold text-ink">
                How do you know each other?
              </p>
              {(
            [
            ['acquaintance', 'Just met'],
            ['friend', 'Already friends'],
            ['close', 'Close']] as
            Array<[Tier, string]>).
            map(([value, label]) =>
            <ButtonSecondary
              key={value}
              full
              tone={tier === value ? 'solid' : 'outline'}
              onClick={() => setTier(value)}>
              
                  {label}
                </ButtonSecondary>
            )}
            </div>
          </Breathe>
        }

        {frame === 'strongest' && strongest &&
        <Breathe>
            <Card className="mt-8 text-center">
              <p className="text-[12px] font-bold uppercase tracking-wide text-ink-mute">
                Strongest link
              </p>
              <p className="mt-2 text-[19px] font-bold leading-snug text-ink">
                {strongest.label}
              </p>
            </Card>
          </Breathe>
        }

        {frame === 'others' &&
        <Breathe>
            <div className="mt-8">
              <CommonalityList
              items={COMMONALITIES.filter((c) => !c.strongest)}
              theirName={person.name.split(' ')[0]} />
            
            </div>
          </Breathe>
        }

        {frame === 'next' &&
        <Breathe>
            <div className="mt-8 space-y-2.5">
              <ButtonSecondary full size="lg" tone="solid">
                Their profile
              </ButtonSecondary>
              <ButtonSecondary full size="lg">
                Discover, updated
              </ButtonSecondary>
            </div>
          </Breathe>
        }
      </ScreenBody>

      {frame !== 'next' &&
      <div className="px-5 pb-6">
          <ButtonPrimary
          full
          disabled={frame === 'tier' && !tier || frame === 'met' && !context}
          onClick={advance}>
          
            Continue
          </ButtonPrimary>
          {frame === 'met' &&
        <p className="mt-2 text-center text-[12px] font-medium text-ink-mute">
              next · what you have in common
            </p>
        }
        </div>
      }
    </Screen>);

}