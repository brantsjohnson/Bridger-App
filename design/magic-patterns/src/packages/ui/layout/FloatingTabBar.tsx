import React from 'react';
import {
  CalendarIcon,
  CompassIcon,
  HouseIcon,
  UserIcon,
  UsersIcon } from
'lucide-react';
import { cn } from '../tokens';

export type TabKey = 'home' | 'friends' | 'events' | 'discover' | 'profile';

const TABS: Array<{
  key: TabKey;
  label: string;
  Icon: React.ComponentType<{className?: string;strokeWidth?: number;}>;
}> = [
{ key: 'home', label: 'Home', Icon: HouseIcon },
{ key: 'friends', label: 'Friends', Icon: UsersIcon },
{ key: 'events', label: 'Events', Icon: CalendarIcon },
{ key: 'discover', label: 'Discover', Icon: CompassIcon },
{ key: 'profile', label: 'Profile', Icon: UserIcon }];


type FloatingTabBarProps = {
  value: TabKey;
  onChange: (key: TabKey) => void;
  badges?: Partial<Record<TabKey, boolean>>;
  tucked?: boolean;
};

/** Detached rounded pill, inset from the edge. Active tab is orange. */
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
      )}>
      
      <ul className="pointer-events-auto flex items-center gap-1 rounded-full border border-ink-line bg-surface/80 px-2 py-2 backdrop-blur-xl">
        {TABS.map(({ key, label, Icon }) => {
          const active = key === value;
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => onChange(key)}
                aria-current={active ? 'page' : undefined}
                aria-label={label}
                className={cn(
                  'relative flex h-11 w-11 items-center justify-center rounded-full transition-colors',
                  active ? 'bg-coral text-white' : 'text-ink-mute hover:text-ink'
                )}>
                
                <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.6 : 2} />
                {badges[key] && !active &&
                <span
                  aria-hidden="true"
                  className="absolute right-2 top-2 h-2 w-2 rounded-full bg-coral" />

                }
              </button>
            </li>);

        })}
      </ul>
    </nav>);

}