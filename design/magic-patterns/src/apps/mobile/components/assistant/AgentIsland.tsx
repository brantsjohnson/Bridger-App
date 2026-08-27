import { AnimatePresence, motion } from 'framer-motion'
import { BillyMark, MarkMood, VoiceWave, gentle } from '../../../../packages/ui'
import { AgentStatus } from '../../state/agent'

/**
 * THE ISLAND.
 *
 * Billy only ever has one home: the widget on Home. But if you start it
 * talking and then walk off to another tab, killing it would be wrong and
 * leaving it invisible would be worse — you'd have no idea the mic was still
 * open. So it follows you as a small capsule pinned to the top, and *only*
 * while something is genuinely live.
 *
 * The constraints that keep it from becoming clutter:
 * - It appears only when listening, thinking, or finished-while-you-were-away.
 * - It never appears on Home; the widget is already there doing this job.
 * - Idle is not a state it has. Nothing to report, nothing on screen.
 */
export function AgentIsland({
  status,
  line,
  onOpen,
}: {
  status: AgentStatus
  /** the one thing worth saying at this size */
  line: string
  onOpen: () => void
}) {
  const visible = status === 'listening' || status === 'thinking' || status === 'background' || status === 'result' || status === 'needs-you'

  const mood: MarkMood =
    status === 'listening'
      ? 'listening'
      : status === 'thinking' || status === 'background'
        ? 'thinking'
        : 'excited'

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -14, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -14, scale: 0.9 }}
          transition={gentle}
          className="pointer-events-none absolute inset-x-0 top-3 z-40 flex justify-center px-5"
        >
          <button
            type="button"
            onClick={onOpen}
            className="pointer-events-auto flex max-w-full items-center gap-2.5 rounded-full bg-blue py-2 pl-2 pr-4 text-white shadow-lg"
          >
            <BillyMark mood={mood} size="sm" tile className="text-white" />
            <span className="min-w-0 truncate text-[13px] font-bold">{line}</span>
            {status === 'listening' && <VoiceWave size="sm" className="shrink-0 text-white" />}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
