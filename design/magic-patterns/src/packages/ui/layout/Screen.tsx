import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, MessageSquareIcon } from 'lucide-react';
import { cn } from '../tokens';
import { breatheIn, stagger } from '../motion';
import { PixelHeading } from '../primitives/PixelHeading';
import { Avatar } from '../primitives/Avatar';
import { useMessagesLink } from './MessagesLink';
import { useProfileLink } from './ProfileLink';

type ScreenContextValue = {
  scrolled: boolean;
  setScrolled: (v: boolean) => void;
  hasHeader: boolean;
  registerHeader: () => void;
  tone: ScreenProps['tone'];
};

const ScreenContext = React.createContext<ScreenContextValue>({
  scrolled: false,
  setScrolled: () => undefined,
  hasHeader: false,
  registerHeader: () => undefined,
  tone: 'canvas'
});

type ScreenProps = {
  children: React.ReactNode;
  /**
   * eggshell by default; onboarding and fill flows may go full color.
   * 'plain' draws nothing, for when a ProfileSkin owns the background.
   */
  tone?: 'canvas' | 'color' | 'synth' | 'plain' | 'intro';
  accent?: string;
  className?: string;
};

export function Screen({ children, tone = 'canvas', accent, className }: ScreenProps) {
  const [scrolled, setScrolled] = React.useState(false);
  const [hasHeader, setHasHeader] = React.useState(false);
  const registerHeader = React.useCallback(() => setHasHeader(true), []);

  const value = React.useMemo(
    () => ({ scrolled, setScrolled, hasHeader, registerHeader, tone }),
    [scrolled, hasHeader, registerHeader, tone]
  );

  return (
    <ScreenContext.Provider value={value}>
      <div
        className={cn(
          'relative flex h-full flex-col overflow-hidden',
          tone === 'canvas' && 'bg-app-grid',
          tone === 'color' && (accent ?? 'bg-purple/25'),
          tone === 'synth' && 'bg-app-grid',
          tone === 'intro' && 'bg-black',
          tone === 'plain' && 'bg-transparent',
          className
        )}>
        
        {(tone === 'synth' || tone === 'intro') &&
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="synth-grid absolute -inset-x-20 -top-20 h-[160%] animate-drift" />
          </div>
        }
        <div className="relative flex h-full flex-col">{children}</div>
      </div>
    </ScreenContext.Provider>);

}

/** falls back to the shared MessagesLink when these are omitted */
type ScreenHeaderProps = {
  title: string;
  onBack?: () => void;
  /** top-right slot is reserved for Messages */
  onMessages?: () => void;
  messagesDormant?: boolean;
  unreadMessages?: boolean;
  hideMessages?: boolean;
  trailing?: React.ReactNode;
};

/** Floats over the body and tucks away on scroll. */
export function ScreenHeader({
  title,
  onBack,
  onMessages,
  messagesDormant,
  unreadMessages,
  hideMessages = false,
  trailing
}: ScreenHeaderProps) {
  const { scrolled, registerHeader, tone } = React.useContext(ScreenContext);
  const intro = tone === 'intro';
  const link = useMessagesLink();
  const profileLink = useProfileLink();
  // every screen shares one Messages destination unless it opts out explicitly
  const openMessages = onMessages ?? link.open;
  const dormant = messagesDormant ?? !openMessages;
  const unread = unreadMessages ?? link.unread ?? false;
  const openProfile = profileLink.open;
  const face = profileLink.profile;
  const showProfile = !onBack && !!openProfile && !!face;

  React.useEffect(() => {
    registerHeader();
  }, [registerHeader]);

  return (
    <header
      className={cn(
        'absolute inset-x-0 top-0 z-20 flex items-center gap-3 px-5 pb-3 pt-4 transition-[transform,opacity] duration-300 ease-out',
        scrolled ?
        'pointer-events-none -translate-y-full opacity-0' :
        'translate-y-0 opacity-100'
      )}>
      
      {onBack ?
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink-line bg-white text-ink">
        
          <ChevronLeftIcon className="h-5 w-5" strokeWidth={2.5} />
        </button> :
      showProfile && face ?
      <button
        type="button"
        onClick={openProfile}
        aria-label="Your profile"
        className="shrink-0">
        
          <Avatar
            name={face.name}
            emoji={face.emoji}
            accent={face.accent ?? 'purple'}
            size="sm" />
        
        </button> :
      null
      }
      <PixelHeading as="h1" size="lg" className={cn('flex-1 truncate', intro && 'text-white')}>
        {title}
      </PixelHeading>
      {trailing}
      {!hideMessages &&
      <button
        type="button"
        onClick={openMessages}
        disabled={dormant}
        aria-label="Messages"
        /* solid ink, not white — white on the eggshell canvas disappears */
        className={cn(
          'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors',
          dormant ?
          'border border-ink-line bg-canvas-raised text-ink-mute/60' :
          'bg-ink text-white hover:bg-ink-soft'
        )}>
        
          <MessageSquareIcon className="h-[18px] w-[18px]" strokeWidth={2.4} />
          {unread &&
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-canvas bg-coral" />

        }
        </button>
      }
    </header>);

}

export function ScreenBody({
  children,
  className,
  padded = true




}: {children: React.ReactNode;className?: string;padded?: boolean;}) {
  const { setScrolled, hasHeader } = React.useContext(ScreenContext);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      onScroll={(e: React.UIEvent<HTMLElement>) => setScrolled(e.currentTarget.scrollTop > 12)}
      className={cn(
        'screen-body no-scrollbar flex-1 overflow-y-auto pb-32',
        hasHeader && 'pt-[68px]',
        padded && 'px-5',
        className
      )}>
      
      {children}
    </motion.div>);

}

export function Breathe({
  children,
  className



}: {children: React.ReactNode;className?: string;}) {
  return (
    <motion.div variants={breatheIn} className={className}>
      {children}
    </motion.div>);

}