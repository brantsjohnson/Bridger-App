// ============================================
// WHAT THIS FILE DOES (plain English):
// Expo reads this for the app's name, icons, bundle id, and public env flags.
// Plain JS so EAS Build / eas-cli can load it reliably (app.config.ts breaks
// with some TypeScript versions: "Cannot read properties of undefined (CommonJS)").
// ============================================

/** @type {import('expo/config').ConfigContext} */
// THIS SECTION DOES: build the Expo config from the static bits + env.
module.exports = ({ config }) => ({
  ...config,
  name: 'Bridger',
  // Must match the Expo project slug (created as brantsjohnson). Rename on expo.dev later if you want "bridger".
  slug: 'brantsjohnson',
  owner: 'bridger-social',
  version: '0.0.1',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'bridger',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'social.bridger.app',
    usesAppleSignIn: true,
    // App Store Connect: we do not use non-exempt encryption (standard HTTPS only).
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false
    },
    // Apple Privacy Manifest stubs; keep in sync as SDKs land.
    privacyManifests: {
      NSPrivacyTracking: false,
      NSPrivacyTrackingDomains: [],
      NSPrivacyCollectedDataTypes: [],
      NSPrivacyAccessedAPITypes: []
    }
  },
  android: {
    package: 'social.bridger.app',
    adaptiveIcon: {
      backgroundColor: '#F4F1E7',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png'
    },
    predictiveBackGestureEnabled: false
  },
  web: {
    bundler: 'metro',
    output: 'single',
    favicon: './assets/images/favicon.png'
  },
  plugins: [
    'expo-router',
    'expo-apple-authentication',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#F4F1E7'
      }
    ],
    'expo-video',
    [
      'expo-camera',
      {
        cameraPermission:
          'Bridger uses your camera so you can post an update and send a 10 second video reply to a friend.',
        microphonePermission:
          'Bridger uses your microphone so your video replies have sound, and so you can ask the Assistant by voice.',
        recordAudioAndroid: true
      }
    ],
    'expo-audio',
    [
      'expo-calendar',
      {
        calendarPermission:
          "Bridger adds dates and reminders you confirm so you don't forget a friend's birthday or check-in."
      }
    ]
  ],
  experiments: {
    typedRoutes: true
  },
  extra: {
    // Linked Expo project (from eas init). Needed for EAS Build / TestFlight.
    eas: {
      projectId:
        process.env.EAS_PROJECT_ID ?? '6f732be5-8d08-43ad-8463-2e932c2444a8'
    },
    demoUnlock: process.env.EXPO_PUBLIC_DEMO_UNLOCK ?? '0',
    demoMode: process.env.EXPO_PUBLIC_DEMO_MODE ?? '0'
  }
});
