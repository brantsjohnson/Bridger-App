import React from 'react'

/**
 * BILLY — the optional agent.
 *
 * Three rules the whole design hangs off:
 *
 * 1. **Off until you turn it on.** Nothing about it appears anywhere until then.
 * 2. **It drafts, you send.** It never messages a friend, RSVPs, or posts on
 *    your behalf. Every outward action ends on a card you have to tap.
 * 3. **It says what it looked at.** Every answer that used your data names the
 *    sources in plain words, on the message itself — not buried in a policy.
 */

export type AgentRole = 'you' | 'billy'

export interface AgentAction {
  id: string
  /** what tapping it will actually do, in the user's words */
  label: string
  detail?: string
  kind: 'send' | 'open' | 'dismiss'
}

/**
 * A thing it wrote for you. Never a summary of a thing it wrote — the actual
 * words, shown exactly as they'll arrive, because approving a description of a
 * message is not the same as approving the message.
 */
export interface AgentDraft {
  id: string
  /** "Message to Priya", "Invite · Thursday" */
  kind: string
  /** who or where it lands */
  to: string
  body: string
}

export interface AgentMessage {
  id: string
  role: AgentRole
  text: string
  /** plain-language list of what it read to answer — shown on the message */
  sources?: string[]
  /** a draft it made; nothing leaves until one of these is tapped */
  actions?: AgentAction[]
  /** the full text of something it wrote, previewed in place */
  draft?: AgentDraft
  at: string
}

/** One line of visible work. Never a bare spinner — always what it's doing. */
export interface AgentStep {
  id: string
  label: string
  /** ms this step takes in the prototype */
  ms: number
}

export type AgentStatus =
  /** turned on, nothing to say */
  | 'idle'
  /** working, and you are watching */
  | 'thinking'
  /** working, and you have left the conversation */
  | 'background'
  /** finished while you were away — the widget carries a dot */
  | 'result'
  /** drafted something outward-facing and is waiting on you */
  | 'needs-you'
  /** the mic is open */
  | 'listening'

export const AGENT_NAME = 'Billy'

/** What it offers when it has nothing else to say. Verbs, not features. */
export const AGENT_SUGGESTIONS = [
  'Who have I not seen in a while?',
  'Find a night the four of us are free',
  'What should I ask Devon about?',
  'Draft an invite for sketch night',
]

/** The work behind "find a night", shown a line at a time. */
export const SAMPLE_STEPS: AgentStep[] = [
  { id: 's1', label: 'Reading who you marked free this week', ms: 900 },
  { id: 's2', label: 'Checking the four of you against each other', ms: 1100 },
  { id: 's3', label: 'Leaving out nights you already have plans', ms: 800 },
  { id: 's4', label: 'Writing you an answer', ms: 700 },
]

export const SAMPLE_THREAD: AgentMessage[] = [
  {
    id: 'm1',
    role: 'billy',
    text: "I'm on. I can only see what you can see — your circles, your stories, your events. Ask me anything, or start with one of these.",
    at: 'Mon',
  },
  {
    id: 'm2',
    role: 'you',
    text: "Who have I not seen in a while?",
    at: 'Tue 9:04',
  },
  {
    id: 'm3',
    role: 'billy',
    text: "Three people, and one of them stands out. You and Priya used to see each other every couple of weeks; it's been four months. Devon and Kit are both around two months.",
    sources: ['your events', 'when you last messaged', 'your circles'],
    actions: [
      { id: 'a1', label: 'Draft a message to Priya', detail: 'You read it before it sends', kind: 'send' },
      { id: 'a2', label: 'Open Priya', kind: 'open' },
    ],
    at: 'Tue 9:04',
  },
]

export const SAMPLE_RESULT: AgentMessage = {
  id: 'm4',
  role: 'billy',
  text: "Thursday works for all four of you. Devon is out Friday, Kit has something Saturday, and you've got sketch night Wednesday. Here's what I'd send — change anything you like.",
  sources: ['who marked themselves free', 'your events this week'],
  draft: {
    id: 'd1',
    kind: 'Message',
    to: 'Devon, Kit and Priya',
    body: "Thursday evening — anyone up for the park and something to eat after? No plan beyond that.",
  },
  at: 'Tue 9:05',
}

/** What it says while the mic is open, in the order it says it. */
export const LISTENING_HINTS = [
  'Listening…',
  'Say what you want changed',
  'Or tap the mic to stop',
]

/**
 * Runs the visible work. The step index keeps advancing whether or not the
 * conversation is open — leaving is not cancelling, which is the whole point
 * of the background state.
 */
export function useAgentRun(running: boolean, steps: AgentStep[] = SAMPLE_STEPS) {
  const [index, setIndex] = React.useState(0)

  React.useEffect(() => {
    if (!running) {
      setIndex(0)
      return
    }
    if (index >= steps.length) return
    const t = window.setTimeout(() => setIndex((i) => i + 1), steps[index].ms)
    return () => window.clearTimeout(t)
  }, [running, index, steps])

  return {
    index,
    done: index >= steps.length,
    current: steps[Math.min(index, steps.length - 1)],
    /** 0–1, for the hairline */
    progress: Math.min(1, index / steps.length),
  }
}
