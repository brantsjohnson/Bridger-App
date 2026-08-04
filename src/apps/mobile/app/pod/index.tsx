import React from 'react';
import { MicIcon, PlusIcon } from 'lucide-react';
import {
  Breathe,
  ButtonSecondary,
  EmptyState,
  Screen,
  ScreenBody,
  ScreenHeader } from
'../../../../packages/ui';
import { RecapPlayer } from '../../components/pod/RecapPlayer';
import { RecapRecorder } from '../../components/pod/RecapRecorder';
import { SubmitQuestion } from '../../components/pod/SubmitQuestion';

/** The weekly podcast — listen, record yours, suggest a question. */
export function FriendPodScreen({
  startRecording = false,
  empty = false,
  onBack





}: {startRecording?: boolean; /** day one: no one has recorded a thing yet */empty?: boolean;onBack?: () => void;}) {
  const [recording, setRecording] = React.useState(startRecording);
  const [asking, setAsking] = React.useState(false);

  return (
    <Screen>
      <ScreenHeader title="Friend Pod" onBack={onBack} hideMessages />
      <ScreenBody>
        <Breathe>
          {empty ?
          <EmptyState
            emoji="🎙"
            line="No recaps yet. Record the first one and your friends get it this week." /> :


          <RecapPlayer />
          }
        </Breathe>

        <Breathe>
          <div className="mt-5 space-y-2.5">
            <ButtonSecondary
              full
              size="lg"
              tone="solid"
              icon={<MicIcon className="h-4 w-4" strokeWidth={2.5} />}
              onClick={() => setRecording(true)}>
              
              Add your recap
            </ButtonSecondary>
            <ButtonSecondary
              full
              icon={<PlusIcon className="h-4 w-4" strokeWidth={3} />}
              onClick={() => setAsking(true)}>
              
              Submit a question
            </ButtonSecondary>
          </div>
        </Breathe>
      </ScreenBody>

      <RecapRecorder open={recording} onClose={() => setRecording(false)} />
      <SubmitQuestion open={asking} onClose={() => setAsking(false)} />
    </Screen>);

}