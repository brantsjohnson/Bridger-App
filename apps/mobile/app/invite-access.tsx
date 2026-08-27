// ============================================
// WHAT THIS FILE DOES (plain English):
// Route wrapper for the demo-week invite gate. Shown when onboarding is done
// but the person has not invited anyone yet during an active demo week.
// ============================================
import { InviteAccessScreen } from '../components/invite/InviteAccessScreen';

export default function InviteAccessRoute() {
  return <InviteAccessScreen />;
}
