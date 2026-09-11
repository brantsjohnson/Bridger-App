// ============================================
// WHAT THIS FILE DOES (plain English):
// Finish lives inside the camera-first flow after a post. This route sends
// people back to the camera so they are never stuck on an empty screen.
// ============================================
import { Redirect } from 'expo-router';

export default function CollageFinishRoute() {
  return <Redirect href="/story/capture" />;
}
