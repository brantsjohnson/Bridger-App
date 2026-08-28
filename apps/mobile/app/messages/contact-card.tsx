// ============================================
// WHAT THIS FILE DOES (plain English):
// Kept for deep links to /messages/contact-card. Setup now lives as a
// dropdown on the Messages list (no Share contact here — share from a thread).
// ============================================
import { Redirect } from 'expo-router';

export default function ContactCardRoute() {
  return <Redirect href="/messages" />;
}
