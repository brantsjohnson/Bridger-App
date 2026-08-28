// ============================================
// WHAT THIS FILE DOES (plain English):
// Old "Create account" route. Google / Apple on Sign in already create the
// account on first use, so this screen just sends people to Sign in. Kept as a
// redirect so any old deep link or bookmark still works.
// ============================================
import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

export default function SignUpRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(auth)/sign-in');
  }, [router]);

  return <View className="flex-1 bg-canvas" />;
}
