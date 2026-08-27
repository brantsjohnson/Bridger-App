import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeftIcon, ArrowUpIcon, CheckIcon, EyeIcon, MicIcon } from 'lucide-react'
import {
  BillyMark,
  Screen,
  ScreenBody,
  VoiceWave,
  cn,
  gentle,
} from '../../../../packages/ui'
import {
  AGENT_NAME,
  AGENT_SUGGESTIONS,
  AgentMessage,
  AgentStep,
  SAMPLE_RESULT,
  SAMPLE_STEPS,
  SAMPLE_THREAD,
} from '../../state/agent'
import { DraftPreview } from './DraftPreview'

/**
 * BILLY — the full conversation.
 *
 * Opening it full screen (rather than a docked sheet) is deliberate: the
 * answers are about your friends, and reading them over the top of a half-
 * visible feed makes them feel like ads. This is a room you step into.
 *
 * You can leave at any moment. Backing out mid-thought hands the work to the
 * Home widget and says so, once, on the way out.
 */
export function AgentScreen({
  initialWorking = false,
  onClose,
}: {
  /** opened from a widget that was already mid-thought */
  initialWorking?: boolean
  onClose: (leftWorking: boolean) => void
}) {
  const [messages, setMessages] = React.useState<AgentMessage[]>(SAMPLE_THREAD)
  const [working, setWorking] = React.useState(initialWorking)
  const [stepIndex, setStepIndex] = React.useState(0)
  const [draft, setDraft] = React.useState('')
  const [sent, setSent] = React.useState<string[]>([])
  /** the mic, open right in the composer */
  const [hearing, setHearing] = React.useState(false)
  const endRef = React.useRef<HTMLDivElement>(null)

  /* the visible work advances a line at a time */
  React.useEffect(() => {
    if (!working) return
    if (stepIndex >= SAMPLE_STEPS.length) {
      const t = window.setTimeout(() => {
        setMessages((m) => [...m, SAMPLE_RESULT])
        setWorking(false)
        setStepIndex(0)
      }, 400)
      return () => window.clearTimeout(t)
    }
    const t = window.setTimeout(() => setStepIndex((i) => i + 1), SAMPLE_STEPS[stepIndex].ms)
    return () => window.clearTimeout(t)
  }, [working, stepIndex])

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, stepIndex, working])

  const ask = (text: string) => {
    const t = text.trim()
    if (!t || working) return
    setMessages((m) => [
      ...m,
      { id: `u${Date.now()}`, role: 'you', text: t, at: 'now' },
    ])
    setDraft('')
    setStepIndex(0)
    setWorking(true)
  }

  return (
    <Screen>
      <header className="flex items-center gap-3 border-b border-ink-line px-5 pb-3 pt-4">
        <button
          type="button"
          onClick={() => onClose(working)}
          aria-label="Back"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink-line bg-white text-ink"
        >
          <ArrowLeftIcon className="h-4 w-4" strokeWidth={2.6} />
        </button>

        <BillyMark mood={hearing ? 'listening' : working ? 'thinking' : 'resting'} size="sm" />

        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold leading-tight text-ink">{AGENT_NAME}</p>
          <p className="truncate text-[12px] font-semibold text-ink-mute">
            {hearing
              ? 'Listening — say what you need'
              : working
                ? 'Working — you can leave, it keeps going'
                : 'Only sees what you can see'}
          </p>
        </div>
      </header>

      <ScreenBody className="pb-36">
        <div className="space-y-4 pt-4">
          {messages.map((m) => (
            <Bubble key={m.id} message={m} sent={sent} onAct={(id) => setSent((s) => [...s, id])} />
          ))}

          <AnimatePresence>{working && <Working index={stepIndex} />}</AnimatePresence>

          <div ref={endRef} />
        </div>
      </ScreenBody>

      <div className="absolute inset-x-0 bottom-0 z-20 border-t border-ink-line bg-canvas px-5 pb-7 pt-3">
        {!working && messages.length <= SAMPLE_THREAD.length && (
          <div className="no-scrollbar -mx-5 mb-2.5 flex gap-2 overflow-x-auto px-5">
            {AGENT_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => ask(s)}
                className="shrink-0 rounded-full border border-ink-line bg-canvas-raised px-3 py-1.5 text-[12px] font-bold text-ink-soft hover:border-coral hover:text-ink"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            ask(draft)
          }}
          className="flex items-center gap-2"
        >
          {hearing ? (
            <>
              <button
                type="button"
                onClick={() => setHearing(false)}
                aria-label="Stop listening"
                className="flex h-11 min-w-[72px] shrink-0 items-center justify-center rounded-full border border-blue/30 bg-white px-4 text-center text-[13px] font-bold leading-none text-ink"
              >
                Stop
              </button>
              <div className="min-w-0 flex-1" />
              <div className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-white px-3 text-blue">
                <VoiceWave active hearing={false} size="sm" className="shrink-0" />
                <span className="text-[13px] font-bold">Listening…</span>
              </div>
              <button
                type="button"
                onClick={() => setHearing(false)}
                aria-pressed
                aria-label="Stop listening"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue text-white"
              >
                <MicIcon className="h-4 w-4" strokeWidth={2.6} />
              </button>
            </>
          ) : (
            <>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={working ? 'Working on the last one…' : `Ask ${AGENT_NAME}`}
                aria-label={`Ask ${AGENT_NAME}`}
                className={cn(
                  'h-11 min-w-0 flex-1 rounded-full border border-blue/25 bg-white px-4 text-[14px]',
                  'font-semibold text-ink placeholder:font-medium placeholder:text-ink-mute focus:outline-none',
                )}
              />
              {draft.trim() ? (
                <button
                  type="submit"
                  disabled={working}
                  aria-label="Send"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-coral text-white disabled:opacity-30"
                >
                  <ArrowUpIcon className="h-4 w-4" strokeWidth={3} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setHearing(true)}
                  aria-pressed={false}
                  aria-label="Talk to Billy"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-blue/25 bg-white text-blue"
                >
                  <MicIcon className="h-4 w-4" strokeWidth={2.6} />
                </button>
              )}
            </>
          )}
        </form>
      </div>
    </Screen>
  )
}

/**
 * The thinking state. A named line per step, ticked as it finishes — you can
 * see what it read and in what order, so a slow answer is legible instead of
 * mysterious. A spinner would tell you nothing except to wait.
 */
function Working({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={gentle}
      className="flex gap-2.5"
    >
      <BillyMark mood="thinking" size="sm" />
      <div className="min-w-0 flex-1 rounded-card rounded-tl-sm border border-ink-line bg-white p-3">
        <ul className="space-y-1.5">
          {SAMPLE_STEPS.slice(0, index + 1).map((s: AgentStep, i) => {
            const done = i < index
            return (
              <motion.li
                key={s.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={gentle}
                className="flex items-center gap-2 text-[13px] font-semibold"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                    done ? 'bg-success text-white' : 'bg-coral/20',
                  )}
                >
                  {done ? (
                    <CheckIcon className="h-2.5 w-2.5" strokeWidth={4} />
                  ) : (
                    <motion.span
                      className="h-1.5 w-1.5 rounded-full bg-coral"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.1, repeat: Infinity }}
                    />
                  )}
                </span>
                <span className={done ? 'text-ink-mute' : 'text-ink'}>{s.label}</span>
              </motion.li>
            )
          })}
        </ul>
      </div>
    </motion.div>
  )
}

function Bubble({
  message,
  sent,
  onAct,
}: {
  message: AgentMessage
  sent: string[]
  onAct: (id: string) => void
}) {
  const mine = message.role === 'you'

  if (mine) {
    return (
      <div className="flex justify-end">
        <p className="max-w-[78%] rounded-card rounded-br-sm bg-ink px-3.5 py-2.5 text-[14px] font-semibold leading-snug text-white">
          {message.text}
        </p>
      </div>
    )
  }

  return (
    <div className="flex gap-2.5">
      <BillyMark mood="speaking" size="sm" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="rounded-card rounded-tl-sm border border-ink-line bg-white p-3.5">
          <p className="text-[14px] font-semibold leading-snug text-ink">{message.text}</p>

          {/* what it read, on the message itself — not buried in a policy */}
          {message.sources && (
            <p className="mt-2.5 flex items-start gap-1.5 border-t border-ink-line pt-2.5 text-[12px] font-semibold leading-snug text-ink-mute">
              <EyeIcon aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.6} />
              <span>Looked at {message.sources.join(', ')}.</span>
            </p>
          )}
        </div>

        {/* the real words it wrote — approve, edit by hand, or say the change */}
        {message.draft && <DraftPreview draft={message.draft} />}

        {/* it drafts, you send — nothing leaves without one of these taps */}
        {message.actions?.map((a) => {
          const done = sent.includes(a.id)
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onAct(a.id)}
              disabled={done}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-card border px-3.5 py-2.5 text-left transition-colors',
                done
                  ? 'border-success/40 bg-[#E6F7F0]'
                  : a.kind === 'send'
                    ? 'border-coral bg-[#FFF2ED] hover:bg-[#FFE7E0]'
                    : 'border-ink-line bg-white hover:bg-surface',
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-bold text-ink">
                  {done ? 'Opened for you to send' : a.label}
                </span>
                {a.detail && !done && (
                  <span className="block text-[12px] font-semibold text-ink-mute">{a.detail}</span>
                )}
              </span>
              {done && <CheckIcon className="h-4 w-4 shrink-0 text-success" strokeWidth={3} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
