// ============================================
// WHAT THIS FILE DOES (plain English):
// The first-open experience. The very first time someone opens Bridger, this
// plays the one-off CRT terminal intro (retro TV bars -> a green terminal types
// a short story -> glitch -> screen shuts off). When it finishes (or the person
// taps Skip) we remember that this install has seen it, and we send them to the
// sign-in screen. It only ever plays once per install.
//
// (Historically this screen showed short text "beats"; that has been replaced by
// the CRT intro. The device flag WELCOME_SEEN_KEY still guards first-open.)
// ============================================
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CrtIntro } from '../../components/intro/CrtIntro';
import { WELCOME_SEEN_KEY } from '../../content/welcome';

export default function WelcomeScreen() {
  const router = useRouter();

  // THIS SECTION DOES: when the intro is over, mark it seen so it never plays
  // again on this device, then go to sign-in ("the login screen").
  async function handleDone() {
    await AsyncStorage.setItem(WELCOME_SEEN_KEY, '1');
    router.replace('/sign-in');
  }

  return <CrtIntro onDone={handleDone} />;
}
