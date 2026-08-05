import React from 'react';
import {
  CalendarIcon,
  CompassIcon,
  HouseIcon,
  SendIcon,
  UsersIcon
} from 'lucide-react';
import { cn } from '../tokens';

export type TabKey = 'home' | 'friends' | 'messages' | 'events' | 'discover';

/** Per-tab brand color — selected circle + notification dot. */
export const TAB_COLOR: Record<TabKey, string> = {
  home: '#00A676',
  friends: '#FF5A1F',
  messages: '#1D6FE8',
  events: '#5FBF3A',
  discover: '#FFB515'
};

const TABS: Array<{
  key: TabKey;
  label: string;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}> = [
  { key: 'home', label: 'Home', Icon: HouseIcon },
  { key: 'friends', label: 'Friends', Icon: UsersIcon },
  { key: 'messages', label: 'Messages', Icon: SendIcon },
  { key: 'events', label: 'Events', Icon: CalendarIcon },
  { key: 'discover', label: 'Discover', Icon: CompassIcon }
];

type FloatingTabBarProps = {
  value: TabKey | string;
  onChange: (key: TabKey) => void;
  badges?: Partial<Record<TabKey, boolean>>;
  tucked?: boolean;
};

/** Detached rounded pill. Each tab has its own accent color when selected. */
export function FloatingTabBar({
  value,
  onChange,
  badges = {},
  tucked = false
}: FloatingTabBarProps) {
  return (
    <nav
      aria-label="Primary"
      className={cn(
        'pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center px-5 pb-5 transition-transform duration-300',
        tucked ? 'translate-y-6 opacity-0' : 'translate-y-0 opacity-100'
      )}
    >
      <ul className="pointer-events-auto flex items-center gap-1 rounded-full border border-ink-line bg-surface/80 px-2 py-2 backdrop-blur-xl">
        {TABS.map(({ key, label, Icon }) => {
          const active = key === value;
          const color = TAB_COLOR[key];
          const showDot = Boolean(badges[key]) && !active;
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => onChange(key)}
                aria-current={active ? 'page' : undefined}
                aria-label={showDot ? `${label}, new activity` : label}
                style={active ? { backgroundColor: color } : undefined}
                className={cn(
                  'relative flex h-11 w-11 items-center justify-center rounded-full transition-colors',
                  active ? 'text-white' : 'text-ink-mute hover:text-ink'
                )}
              >
                <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.6 : 2} />
                {showDot ? (
                  <span
                    aria-hidden="true"
                    style={{ backgroundColor: color }}
                    className="absolute right-2 top-2 h-2 w-2 rounded-full"
                  />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
