// ============================================
// WHAT THIS FILE DOES (plain English):
// One shared destination for the header's two chrome buttons — the profile
// photo (now on the LEFT of the title) and the messages shortcut (top-RIGHT,
// where the photo used to sit). The tabs layout fills these in once (who you
// are + how to open Profile / Messages), and every ScreenHeader reads them so
// screens don't each rewire the same buttons.
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
  /** who to show in the profile circle (now left of the title) */
  profile?: HeaderProfile;
  /** tap opens your Profile page */
  open?: () => void;
  /** tap opens your Messages inbox (top-right header shortcut) */
  openMessages?: () => void;
};

const ProfileLinkContext = React.createContext<ProfileLinkValue>({});

export function ProfileLinkProvider({
  profile,
  open,
  openMessages,
  children
}: ProfileLinkValue & { children: React.ReactNode }) {
  const value = React.useMemo(
    () => ({ profile, open, openMessages }),
    [profile, open, openMessages]
  );
  return <ProfileLinkContext.Provider value={value}>{children}</ProfileLinkContext.Provider>;
}

export function useProfileLink(): ProfileLinkValue {
  return React.useContext(ProfileLinkContext);
}
