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
      NSPrivacyCollectedDataTypes: [
        {
          NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeProductInteraction',
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: [
            'NSPrivacyCollectedDataTypePurposeAnalytics',
            'NSPrivacyCollectedDataTypePurposeAppFunctionality'
          ]
        },
        // Co-op membership purchases via RevenueCat / StoreKit.
        {
          NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypePurchaseHistory',
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: [
            'NSPrivacyCollectedDataTypePurposeAppFunctionality'
          ]
        }
      ],
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
          NSPrivacyAccessedAPITypeReasons: ['CA92.1']
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp',
          NSPrivacyAccessedAPITypeReasons: ['C617.1']
        }
      ]
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
    'expo-dev-client',
    'expo-apple-authentication',
    [
      'expo-splash-screen',
      {
        // App icon centered on black while fonts and demo state hydrate.
        image: './assets/images/icon.png',
        resizeMode: 'contain',
        backgroundColor: '#000000',
        imageWidth: 240
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
    // Background audio: lets the co-op weekly recap keep playing when the phone
    // is locked or the app is backgrounded, and shows lock-screen controls.
    // (On iOS this adds the `audio` background mode; on Android it adds a media
    // playback foreground service. A fresh dev/native build is required.)
    [
      'expo-audio',
      {
        enableBackgroundPlayback: true,
        enableBackgroundRecording: false,
        microphonePermission:
          'Bridger uses your microphone so your video replies have sound, so you can record your weekly recap answer, and so you can ask the Assistant by voice.'
      }
    ],
    [
      'expo-calendar',
      {
        calendarPermission:
          "Bridger adds dates and reminders you confirm so you don't forget a friend's birthday or check-in."
      }
    ],
    [
      'expo-contacts',
      {
        contactsPermission:
          'Bridger reads your contacts only when you tap Connect contacts or pick someone for an invite link, so you can text your personal invite. We never upload your contact list.'
      }
    ],
    // Saving a quiz result card to the camera roll (opt-in, in context, only
    // when you tap "Save image"). We never read your existing photos for this.
    [
      'expo-media-library',
      {
        photosPermission:
          'Bridger saves your quiz result card to your photos so you can post it to your story.',
        savePhotosPermission:
          'Bridger saves your quiz result card to your photos so you can post it to your story.',
        isAccessMediaLocationEnabled: false
      }
    ],
    // Choosing an existing photo for your profile picture (the one upload
    // exception; stories stay capture-only). Asked in context, only when you
    // tap "Upload" on the confirm-profile step.
    [
      'expo-image-picker',
      {
        photosPermission:
          'Bridger opens your photos only when you tap Upload, so you can choose a profile picture.',
        cameraPermission:
          'Bridger uses your camera so you can take a profile picture during setup.'
      }
    ],
    // Local reminders you opted into during onboarding (birthdays, life updates,
    // people you should meet, hangouts, messages, reconnect nudges). No ad
    // tracking; the OS permission dialog is shown in context after you choose.
    [
      'expo-notifications',
      {
        // Uses the default app icon for the small status-bar notification icon.
        color: '#F4F1E7'
      }
    ],
    // The system share sheet, used to send your result image or link to apps
    // like Instagram, Snapchat, or Messages.
    'expo-sharing',
    'expo-localization'
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
    demoMode: process.env.EXPO_PUBLIC_DEMO_MODE ?? '0',
    // RevenueCat public SDK key (Test Store or platform app key). Safe to ship.
    revenueCatApiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? ''
  }
});
