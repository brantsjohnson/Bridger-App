import React from 'react';
import {
  CalendarIcon,
  GlobeIcon,
  HouseIcon,
  NewspaperIcon,
  UsersIcon
} from 'lucide-react';
import { cn } from '../tokens';

export type TabKey = 'home' | 'friends' | 'events' | 'discover' | 'news';

/** Per-tab brand color — selected pill + notification dot. */
export const TAB_COLOR: Record<TabKey, string> = {
  home: '#00A676',
  friends: '#FF5A1F',
  events: '#5FBF3A',
  discover: '#FFB515',
  news: '#6B2FEA'
};

const TABS: Array<{
  key: TabKey;
  label: string;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: string | number }>;
}> = [
  { key: 'home', label: 'Home', Icon: HouseIcon },
  { key: 'friends', label: 'Friends', Icon: UsersIcon },
  { key: 'events', label: 'Events', Icon: CalendarIcon },
  { key: 'discover', label: 'Discover', Icon: GlobeIcon },
  { key: 'news', label: 'News', Icon: NewspaperIcon }
];

type FloatingTabBarProps = {
  value: TabKey | string;
  onChange: (key: TabKey) => void;
  badges?: Partial<Record<TabKey, boolean>>;
  tucked?: boolean;
};

/** Detached elongated capsule. Selected tab is a stretched pill, not a tight circle. */
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
        'pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-5 transition-transform duration-300',
        tucked ? 'translate-y-6 opacity-0' : 'translate-y-0 opacity-100'
      )}
    >
      <ul className="pointer-events-auto flex w-full items-center rounded-full border border-ink-line bg-surface/80 px-1.5 py-1.5 backdrop-blur-xl">
        {TABS.map(({ key, label, Icon }) => {
          const active = key === value;
          const color = TAB_COLOR[key];
          const showDot = Boolean(badges[key]) && !active;
          return (
            <li key={key} className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => onChange(key)}
                aria-current={active ? 'page' : undefined}
                aria-label={showDot ? `${label}, new activity` : label}
                style={active ? { backgroundColor: color } : undefined}
                className={cn(
                  'relative flex min-h-[44px] w-full items-center justify-center rounded-full transition-colors',
                  active ? 'text-white' : 'text-ink-mute hover:text-ink'
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.6 : 2} />
                {showDot ? (
                  <span
                    aria-hidden="true"
                    style={{ backgroundColor: color }}
                    className="absolute right-3 top-2 h-2 w-2 rounded-full"
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
