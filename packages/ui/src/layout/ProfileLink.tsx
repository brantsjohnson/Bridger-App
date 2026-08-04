// ============================================
// WHAT THIS FILE DOES (plain English):
// One shared destination for the header's profile-photo button. The tabs
// layout fills this in (who you are + tap opens Profile), and every
// ScreenHeader reads it so screens don't each rewire the same button.
// ============================================
import React from 'react';
import type { ImageSourcePropType } from 'react-native';
import type { Accent } from '@bridger/shared';

export type HeaderProfile = {
  name: string;
  emoji?: string;
  accent?: Accent;
  /** real profile photo when dropped into the demo assets folder */
  photo?: ImageSourcePropType;
};

type ProfileLinkValue = {
  /** who to show in the top-right circle */
  profile?: HeaderProfile;
  /** tap opens your Profile page */
  open?: () => void;
};

const ProfileLinkContext = React.createContext<ProfileLinkValue>({});

export function ProfileLinkProvider({
  profile,
  open,
  children
}: ProfileLinkValue & { children: React.ReactNode }) {
  const value = React.useMemo(() => ({ profile, open }), [profile, open]);
  return <ProfileLinkContext.Provider value={value}>{children}</ProfileLinkContext.Provider>;
}

export function useProfileLink(): ProfileLinkValue {
  return React.useContext(ProfileLinkContext);
}
