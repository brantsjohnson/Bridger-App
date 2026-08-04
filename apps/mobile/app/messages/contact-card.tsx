// ============================================
// WHAT THIS FILE DOES (plain English):
// Route for your contact card — set up once in Messages, share from any thread.
// ============================================
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { ContactCardScreen } from '../../components/messages/ContactCardScreen';

export default function ContactCardRoute() {
  const router = useRouter();

  return (
    <ContactCardScreen
      onBack={() => router.back()}
      onShareIntoThread={() => {
        Alert.alert(
          'Ready to share',
          'Open a conversation and tap Share my number to send this card. It never counts against your daily cap.'
        );
      }}
    />
  );
}
