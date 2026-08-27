import React from 'react'
import { motion } from 'framer-motion'
import { CheckIcon, MicIcon, PencilIcon, SendIcon } from 'lucide-react'
import { VoiceWave, cn, gentle } from '../../../../packages/ui'
import { AgentDraft } from '../../state/agent'

/**
 * A draft, shown as the thing itself.
 *
 * Three ways to deal with it, all in one card:
 *   **Approve** it as written,
 *   **tap it** to edit the words by hand and save,
 *   **hold the mic** and say the change out loud.
 *
 * The rule underneath: Billy writes, you send. So the card shows the real
 * message in the real bubble it will arrive in — approving a *summary* of a
 * message is not the same as approving the message.
 */
export function DraftPreview({
  draft,
  onApprove,
}: {
  draft: AgentDraft
  onApprove?: (body: string) => void
}) {
  const [body, setBody] = React.useState(draft.body)
  const [editing, setEditing] = React.useState(false)
  const [listening, setListening] = React.useState(false)
  const [approved, setApproved] = React.useState(false)
  const ref = React.useRef<HTMLTextAreaElement>(null)

  React.useEffect(() => {
    if (editing) ref.current?.focus()
  }, [editing])

  /* speaking an edit: the words land in the draft, you still approve it */
  React.useEffect(() => {
    if (!listening) return
    const t = window.setTimeout(() => {
      setBody((b) => `${b.replace(/\s*$/, '')} Bring something to draw with if you want.`)
      setListening(false)
    }, 2600)
    return () => window.clearTimeout(t)
  }, [listening])

  if (approved) {
    return (
      <div className="flex items-center gap-2.5 rounded-card border border-success/40 bg-[#E6F7F0] px-3.5 py-3">
        <CheckIcon className="h-4 w-4 shrink-0 text-success" strokeWidth={3} />
        <p className="text-[13px] font-bold text-ink">Sent to {draft.to}</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-card bg-white">
      <div className="flex items-center justify-between gap-2 px-3.5 pt-3">
        <p className="min-w-0 truncate text-[11px] font-bold uppercase tracking-wide text-blue">
          {draft.kind} to {draft.to}
        </p>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex shrink-0 items-center gap-1 text-[12px] font-bold text-ink-mute hover:text-ink"
          >
            <PencilIcon className="h-3 w-3" strokeWidth={2.8} />
            Edit
          </button>
        )}
      </div>

      {/* the actual message, in the bubble it will arrive in */}
      <div className="px-3.5 pb-3 pt-2">
        {editing ? (
          <textarea
            ref={ref}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            aria-label="Edit the message"
            className="w-full resize-none rounded-card rounded-br-sm border border-ink bg-white px-3.5 py-2.5 text-[14px] font-semibold leading-snug text-ink focus:outline-none"
          />
        ) : (
          <button type="button" onClick={() => setEditing(true)} className="block w-full text-left">
            <motion.p
              key={body}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              transition={gentle}
              className="rounded-card rounded-br-sm bg-ink px-3.5 py-2.5 text-[14px] font-semibold leading-snug text-white"
            >
              {body}
            </motion.p>
          </button>
        )}
        {listening && (
          <p className="mt-2 flex items-center gap-2 text-[12px] font-bold text-blue">
            <VoiceWave size="sm" hearing />
            Listening — say what to change
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-ink-line px-3.5 py-2.5">
        <button
          type="button"
          onClick={() => setListening((l) => !l)}
          aria-pressed={listening}
          aria-label="Change it by voice"
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors',
            listening ? 'border-blue bg-blue text-white' : 'border-ink-line bg-white text-ink',
          )}
        >
          <MicIcon className="h-4 w-4" strokeWidth={2.6} />
        </button>

        {editing ? (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="flex-1 rounded-full bg-ink px-3.5 py-2 text-[13px] font-bold text-white"
          >
            Save
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setApproved(true)
              onApprove?.(body)
            }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-blue px-3.5 py-2 text-[13px] font-bold text-white"
          >
            <SendIcon className="h-3.5 w-3.5" strokeWidth={2.8} />
            Approve and send
          </button>
        )}
      </div>
    </div>
  )
}
