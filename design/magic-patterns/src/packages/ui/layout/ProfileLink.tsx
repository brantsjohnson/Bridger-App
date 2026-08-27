// ============================================
// WHAT THIS FILE DOES (plain English):
// One shared "open my profile" action for the header photo, so every screen
// uses the same face and the same destination.
// ============================================
import React from 'react';
import type { Accent } from '../../shared';

type ProfileFace = {
  name: string;
  emoji?: string;
  accent?: Accent;
};

type ProfileLinkValue = {
  open?: () => void;
  profile?: ProfileFace;
};

const ProfileLinkContext = React.createContext<ProfileLinkValue>({});

export function ProfileLinkProvider({
  open,
  profile,
  children
}: ProfileLinkValue & { children: React.ReactNode }) {
  const value = React.useMemo(() => ({ open, profile }), [open, profile]);
  return <ProfileLinkContext.Provider value={value}>{children}</ProfileLinkContext.Provider>;
}

export function useProfileLink(): ProfileLinkValue {
  return React.useContext(ProfileLinkContext);
}
