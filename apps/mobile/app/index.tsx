// ============================================
// WHAT THIS FILE DOES (plain English):
// The app's front door at "/". Immediately sends you to Home so opening
// localhost (or the app root) never lands on "This screen doesn't exist."
// ============================================
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/home" />;
}
