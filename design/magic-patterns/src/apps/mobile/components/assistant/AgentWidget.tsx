import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpIcon, MicIcon } from 'lucide-react'
import { BillyMark, MarkMood, PixelHeading, VoiceWave, cn, gentle } from '../../../../packages/ui'
import {
  AGENT_NAME,
  AGENT_SUGGESTIONS,
  AgentStatus,
  AgentStep,
  SAMPLE_RESULT,
} from '../../state/agent'
import { DraftPreview } from './DraftPreview'

/**
 * The Billy widget — the agent's home on the Home screen, directly under the
 * replies to your story, because everything it's good for is about the people
 * in the two rows above it.
 *
 * You can do the whole loop here without ever leaving Home: type a question,
 * or hold the mic and say it, read what it wrote, and approve it. Full screen
 * is for when the conversation gets long — not a toll gate on the first word.
 */
export function AgentWidget({
  status,
  step,
  progress,
  lastLine,
  onOpen,
  onAsk,
  onListen,
}: {
  status: AgentStatus
  /** the line of work in flight, for thinking / background */
  step?: AgentStep
  progress?: number
  /** the newest thing it said, for result / needs-you */
  lastLine?: string
  onOpen: () => void
  onAsk: (prompt: string) => void
  /** opens the mic from Home — the island carries it if you navigate away */
  onListen: () => void
}) {
  const [draft, setDraft] = React.useState('')
  const working = status === 'thinking' || status === 'background'
  const listening = status === 'listening'
  const unread = status === 'result' || status === 'needs-you'

  const mood: MarkMood = listening
    ? 'listening'
    : working
      ? 'thinking'
      : unread
        ? 'excited'
        : 'resting'

  return (
    <section className="mt-6">
      {/* Same title language as Coming up: pixel heading + dashed underline. */}
      <div className="mb-2">
        <div className="inline-block border-b border-dashed border-teal/70 pb-0.5">
          <PixelHeading size="md">{AGENT_NAME}</PixelHeading>
        </div>
      </div>

      {/* Blue card is a plain shell. Only the header opens Billy so nested
          suggestion / mic buttons are not buttons-inside-a-button. */}
      <div
        className="w-full overflow-hidden rounded-card text-left"
        style={{ backgroundColor: '#3FA4FF' }}
      >
        <button
          type="button"
          aria-label="Open Billy"
          onClick={onOpen}
          className="flex w-full cursor-pointer items-center gap-3 px-4 pt-3.5 text-left"
        >
          <BillyMark mood={mood} size="md" tile className="text-white" />
          <div className="min-w-0 flex-1">
            {/* White bold line on color, same punch as Coming up row labels */}
            <span className="block text-[15px] font-bold leading-snug text-white">
              {listening
                ? 'Listening. Say what you need.'
                : working
                  ? step?.label
                  : unread
                    ? lastLine
                    : 'Ask about your people, your week, your plans.'}
            </span>
          </div>
        </button>

        {/* the work — a hairline that fills by step, never an endless spinner */}
        <AnimatePresence initial={false}>
          {working && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={gentle}
            >
              <div className="mx-4 mt-2.5 h-1 overflow-hidden rounded-full bg-white/25">
                <motion.div
                  className="h-full rounded-full bg-white"
                  animate={{ width: `${Math.round((progress ?? 0) * 100)}%` }}
                  transition={gentle}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* it wrote something — the real words, approvable without leaving Home */}
        {unread && SAMPLE_RESULT.draft && (
          <div className="px-4 pt-3" onClick={(e) => e.stopPropagation()}>
            <DraftPreview draft={SAMPLE_RESULT.draft} />
          </div>
        )}

        {/* resting — real questions, so it never sits there blank */}
        {status === 'idle' && (
          <div
            className="no-scrollbar flex gap-2 overflow-x-auto px-4 pt-3"
            onClick={(e) => e.stopPropagation()}
          >
            {AGENT_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onAsk(s)}
                className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-ink"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/*
          While the mic is open: Stop left, gradient Listening + gradient mic on the right.
        */}
        {listening ? (
          <div
            className="flex items-center gap-2 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onListen}
              aria-label="Stop listening"
              className="flex h-10 min-w-[72px] shrink-0 items-center justify-center rounded-full bg-white px-4 text-center text-[13px] font-bold leading-none text-ink"
            >
              Stop
            </button>
            <div className="min-w-0 flex-1" />
            <div
              className="flex h-10 shrink-0 items-center gap-2 rounded-full px-3 text-white"
              style={{
                // Purple → dark blue → charcoal at uneven stops (no white shine)
                background:
                  'linear-gradient(148deg, #6A4BF5 0%, #0A3D91 42%, #2A2924 100%)',
              }}
            >
              <VoiceWave active hearing={false} size="sm" className="shrink-0 text-white" />
              <span className="text-[13px] font-bold">Listening…</span>
            </div>
            <button
              type="button"
              onClick={onListen}
              aria-pressed
              aria-label="Stop listening"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
              style={{
                background:
                  'linear-gradient(148deg, #6A4BF5 0%, #0A3D91 42%, #2A2924 100%)',
              }}
            >
              <MicIcon className="h-4 w-4" strokeWidth={2.6} />
            </button>
          </div>
        ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!draft.trim()) return
            onAsk(draft.trim())
            setDraft('')
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 p-4"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Message ${AGENT_NAME}`}
            aria-label={`Message ${AGENT_NAME}`}
            className={cn(
              'h-10 min-w-0 flex-1 rounded-full bg-white px-3.5 text-[13px]',
              'font-bold text-ink placeholder:font-medium placeholder:text-ink-mute focus:outline-none',
            )}
          />
          {draft.trim() ? (
            <button
              type="submit"
              aria-label="Send"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-ink"
            >
              <ArrowUpIcon className="h-4 w-4" strokeWidth={3} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onListen}
              aria-pressed={listening}
              aria-label="Talk to Billy"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
              style={{
                background:
                  'linear-gradient(148deg, #6A4BF5 0%, #0A3D91 42%, #2A2924 100%)',
              }}
            >
              <MicIcon className="h-4 w-4" strokeWidth={2.6} />
            </button>
          )}
        </form>
        )}
      </div>
    </section>
  )
}
