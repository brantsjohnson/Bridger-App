import React from 'react';

type MessagesLinkValue = {
  /** open the inbox — undefined means the slot stays dormant */
  open?: () => void;
  unread?: boolean;
};

const MessagesLinkContext = React.createContext<MessagesLinkValue>({});

/**
 * One destination for the header's Messages slot, shared by every screen —
 * so the icon behaves identically wherever it appears.
 */
export function MessagesLinkProvider({
  open,
  unread = false,
  children
}: MessagesLinkValue & {children: React.ReactNode;}) {
  const value = React.useMemo(() => ({ open, unread }), [open, unread]);
  return <MessagesLinkContext.Provider value={value}>{children}</MessagesLinkContext.Provider>;
}

export function useMessagesLink(): MessagesLinkValue {
  return React.useContext(MessagesLinkContext);
}