import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
  type RefObject,
} from "react"
import { createPortal } from "react-dom"

import { cn } from "../../lib/cn"

// --- buttons ----------------------------------------------------------------

interface CoopButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "ghost"
  size?: "md" | "sm"
}

export function CoopButton({
  variant = "default",
  size = "md",
  className,
  children,
  ...props
}: CoopButtonProps) {
  return (
    <button
      className={cn(
        "coop-btn",
        {
          "coop-btn-primary": variant === "primary",
          "coop-btn-ghost": variant === "ghost",
          "coop-btn-sm": size === "sm",
        },
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

// --- card -------------------------------------------------------------------

export function Card({
  className,
  hover,
  children,
  id,
}: {
  className?: string
  hover?: boolean
  children: ReactNode
  id?: string
}) {
  return (
    <div
      id={id}
      className={cn("coop-card", { "coop-card-hover": !!hover }, className)}
    >
      {children}
    </div>
  )
}

// --- stat -------------------------------------------------------------------

export function Stat({
  value,
  label,
  align = "left",
  valueTone = "neutral",
}: {
  value: ReactNode
  label: string
  align?: "left" | "center"
  valueTone?: "neutral" | "good" | "bad" | "cost"
}) {
  const toneClass: Record<typeof valueTone, string> = {
    neutral: "",
    good: "coop-stat-value-good",
    bad: "coop-stat-value-bad",
    cost: "coop-stat-value-cost",
  }
  return (
    <div className={cn({ "text-center": align === "center" })}>
      <div className={cn("coop-stat-value", toneClass[valueTone])}>{value}</div>
      <div className="coop-stat-label">{label}</div>
    </div>
  )
}

// --- badge ------------------------------------------------------------------

export type BadgeTone = "neutral" | "yes" | "planned" | "limited" | "no"

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone
  children: ReactNode
  className?: string
}) {
  const toneClass: Record<BadgeTone, string> = {
    neutral: "",
    yes: "coop-badge-yes",
    planned: "coop-badge-planned",
    limited: "coop-badge-limited",
    no: "coop-badge-no",
  }
  return (
    <span className={cn("coop-badge", toneClass[tone], className)}>
      {children}
    </span>
  )
}

// --- info tip ---------------------------------------------------------------
// A small circled "i" that sits next to a title and reveals supporting detail
// on hover or keyboard focus. Replaces the older click-to-expand affordance.

function InfoTipPopover({
  open,
  wide,
  position,
  children,
  onInteract,
  onMouseEnter,
  onMouseLeave,
}: {
  open: boolean
  wide?: boolean
  position: { top: number; left: number; maxWidth: number } | null
  children: ReactNode
  onInteract?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}) {
  if (!open || !position) return null
  return createPortal(
    <span
      role="dialog"
      aria-modal="false"
      className={cn("coop-infotip-pop", {
        "coop-infotip-pop-wide": wide,
      })}
      style={{
        top: position.top,
        left: position.left,
        maxWidth: position.maxWidth,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseDown={(e) => {
        // Keep the panel open for scrolling, selecting, and clicking inside.
        e.stopPropagation()
        onInteract?.()
      }}
    >
      {children}
    </span>,
    document.body,
  )
}

function computeInfoTipPosition(
  trigger: HTMLElement,
  wide: boolean,
): { top: number; left: number; maxWidth: number } {
  const margin = 8
  const gap = 8
  const rect = trigger.getBoundingClientRect()
  const maxWidth = Math.min(wide ? 520 : 300, window.innerWidth - margin * 2)

  // Prefer below the trigger; clamp horizontally to the viewport.
  let left = rect.left
  left = Math.max(margin, Math.min(left, window.innerWidth - maxWidth - margin))

  return {
    top: rect.bottom + gap,
    left,
    maxWidth,
  }
}

function useInfoTipPopover(
  wide: boolean,
  triggerRef: RefObject<HTMLElement | null>,
) {
  const rootRef = useRef<HTMLSpanElement>(null)
  const [hovering, setHovering] = useState(false)
  const [focused, setFocused] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [position, setPosition] = useState<{
    top: number
    left: number
    maxWidth: number
  } | null>(null)

  const open = hovering || focused || pinned

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    setPosition(computeInfoTipPosition(triggerRef.current, wide))
  }, [wide, triggerRef])

  useLayoutEffect(() => {
    if (!open) return
    updatePosition()
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return
    const onViewportChange = () => updatePosition()
    window.addEventListener("resize", onViewportChange)
    window.addEventListener("scroll", onViewportChange, true)
    return () => {
      window.removeEventListener("resize", onViewportChange)
      window.removeEventListener("scroll", onViewportChange, true)
    }
  }, [open, updatePosition])

  useEffect(() => {
    if (!pinned) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setPinned(false)
        setHovering(false)
        setFocused(false)
      }
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [pinned])

  const pin = () => setPinned(true)
  const togglePin = () => setPinned((value) => !value)

  const onTriggerBlur = (relatedTarget: EventTarget | null) => {
    if (rootRef.current?.contains(relatedTarget as Node)) return
    if (!pinned) setFocused(false)
  }

  return {
    rootRef,
    open,
    pinned,
    position,
    setHovering,
    setFocused,
    pin,
    togglePin,
    onTriggerBlur,
    onRootMouseEnter: () => setHovering(true),
    onRootMouseLeave: () => setHovering(false),
  }
}

export function InfoLink({
  href,
  label,
  children,
  wide = false,
}: {
  href: string
  label: string
  children: ReactNode
  wide?: boolean
}) {
  const triggerRef = useRef<HTMLAnchorElement>(null)
  const {
    rootRef,
    open,
    position,
    setFocused,
    pin,
    onTriggerBlur,
    onRootMouseEnter,
    onRootMouseLeave,
  } = useInfoTipPopover(wide, triggerRef)

  return (
    <span
      ref={rootRef}
      className="coop-infotip"
      onMouseEnter={onRootMouseEnter}
      onMouseLeave={onRootMouseLeave}
    >
      <a
        ref={triggerRef}
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="coop-infotip-link"
        aria-label={label}
        aria-expanded={open}
        onFocus={() => setFocused(true)}
        onBlur={(e) => onTriggerBlur(e.relatedTarget)}
      >
        i
      </a>
      <InfoTipPopover
        open={open}
        wide={wide}
        position={position}
        onInteract={pin}
        onMouseEnter={onRootMouseEnter}
        onMouseLeave={onRootMouseLeave}
      >
        {children}
      </InfoTipPopover>
    </span>
  )
}

export function InfoTip({
  children,
  label = "More information",
  wide = false,
}: {
  children: ReactNode
  label?: string
  wide?: boolean
}) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const {
    rootRef,
    open,
    position,
    setFocused,
    pin,
    togglePin,
    onTriggerBlur,
    onRootMouseEnter,
    onRootMouseLeave,
  } = useInfoTipPopover(wide, triggerRef)

  return (
    <span
      ref={rootRef}
      className="coop-infotip"
      onMouseEnter={onRootMouseEnter}
      onMouseLeave={onRootMouseLeave}
    >
      <button
        ref={triggerRef}
        type="button"
        className="coop-infotip-trigger"
        aria-label={label}
        aria-expanded={open}
        onFocus={() => setFocused(true)}
        onBlur={(e) => onTriggerBlur(e.relatedTarget)}
        onClick={() => togglePin()}
      >
        i
      </button>
      <InfoTipPopover
        open={open}
        wide={wide}
        position={position}
        onInteract={pin}
        onMouseEnter={onRootMouseEnter}
        onMouseLeave={onRootMouseLeave}
      >
        {children}
      </InfoTipPopover>
    </span>
  )
}

// --- modal ------------------------------------------------------------------

export function CoopModal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  wide?: boolean
}) {
  if (!open || typeof document === "undefined") return null
  return createPortal(
    <div
      className="coop-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="coop-modal max-h-[88vh] overflow-y-auto"
        style={wide ? { maxWidth: 640 } : undefined}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="coop-btn coop-btn-ghost coop-btn-sm -mt-1 -mr-2"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}

// --- section heading --------------------------------------------------------

export function SectionTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
}) {
  return (
    <div className="mb-5">
      {eyebrow && <div className="coop-eyebrow mb-1.5">{eyebrow}</div>}
      <h2 className="text-2xl font-bold">{title}</h2>
      {subtitle && (
        <p className="mt-2 max-w-2xl text-(--coop-ink-soft)">{subtitle}</p>
      )}
    </div>
  )
}
