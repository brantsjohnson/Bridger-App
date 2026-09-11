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
    // UNIVERSAL LINKS (paused for TestFlight): re-enable after the Apple App ID
    // has Associated Domains turned on and the EAS provisioning profile is
    // regenerated. Until then, invite/QR deep links use the bridger:// scheme,
    // which already opens the app. Hosted AASA lives at
    // apps/site/public/.well-known/apple-app-site-association (Team ID DG6NU23FXX).
    // associatedDomains: ['applinks:bridger.app'],
    // App Store Connect: we do not use non-exempt encryption (standard HTTPS only).
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false
    },
    // Apple Privacy Manifest stubs; keep in sync as SDKs land.
    privacyManifests: {
      NSPrivacyTracking: false,
      NSPrivacyTrackingDomains: [],
      NSPrivacyCollectedDataTypes: [
        // Photos / videos the person puts in Bridger (profile picture, live
        // captures, camera-roll picks for a Collage page, co-op Inside Joke
        // photo). Never for tracking.
        {
          NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypePhotosorVideos',
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: [
            'NSPrivacyCollectedDataTypePurposeAppFunctionality'
          ]
        },
        {
          NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeAudioData',
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: [
            'NSPrivacyCollectedDataTypePurposeAppFunctionality'
          ]
        },
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
          NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypePhoneNumber',
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: [
            'NSPrivacyCollectedDataTypePurposeAppFunctionality'
          ]
        },
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
    // APP LINKS: same idea as iOS associatedDomains. A tapped
    // https://bridger.app/invite/... (or /q, /e) link opens the app directly.
    // autoVerify:true tells Android to check the hosted
    // https://bridger.app/.well-known/assetlinks.json for our signing cert.
    // The bridger:// scheme still works as a plain deep link on its own.
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          { scheme: 'https', host: 'bridger.app', pathPrefix: '/invite' },
          { scheme: 'https', host: 'bridger.app', pathPrefix: '/q' },
          { scheme: 'https', host: 'bridger.app', pathPrefix: '/e' }
        ],
        category: ['BROWSABLE', 'DEFAULT']
      }
    ],
    // Resize the window when the keyboard opens so text fields on full
    // screens (and Android Modals that follow the window) stay visible.
    softwareKeyboardLayoutMode: 'resize',
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
          "Bridger uses your camera so you can add a photo or video to your collage page, send a 10 second video reply to a friend, and scan a friend's QR code to add each other.",
        microphonePermission:
          'Bridger uses your microphone so your video replies have sound, so you can add a voice note to a collage page, and so you can ask the Assistant by voice.',
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
          'Bridger uses your microphone so your video replies have sound, so you can add a voice note to a collage page, so you can record your weekly recap answer, and so you can ask the Assistant by voice.'
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
          'Bridger reads your contacts only when you tap Connect your contacts on Friends (or an invite slot), so you can pick one person, save that number on a private card, and text an invite. We never upload your contact list.'
      }
    ],
    // Saving a quiz result card to the camera roll (opt-in, in context, only
    // when you tap "Save image"). We never read your existing photos for this.
    [
      'expo-media-library',
      {
        photosPermission:
          'Bridger saves a photo or a finished collage page to your photos when you tap Save, and can save a quiz result card too.',
        savePhotosPermission:
          'Bridger saves a photo or a finished collage page to your photos when you tap Save, and can save a quiz result card too.',
        isAccessMediaLocationEnabled: false
      }
    ],
    // Choosing existing photos: profile picture, Collage page media, and
    // (co-op) one Inside Joke photo. Replies and stickers stay capture-only.
    // Asked in context, only the picked item is read.
    [
      'expo-image-picker',
      {
        photosPermission:
          'Bridger opens your photos only when you tap Upload or the camera roll button, so you can choose a profile picture, add pictures to a collage page, or (if you are in the co-op) put one photo on an Inside Joke.',
        cameraPermission:
          'Bridger uses your camera so you can take a profile picture, or (if you are in the co-op) a photo for an Inside Joke.'
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
    // Nest API address baked at EAS config time (fallback if Metro env is empty).
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? '',
    // RevenueCat public SDK keys (safe to ship). Prefer platform keys when set.
    // PAYMENT: never bake Test Store `test_…` keys into a binary. Those make
    // RevenueCat show "Wrong API Key" and force-quit the app on open.
    revenueCatApiKey: (() => {
      const k = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? '';
      return k.startsWith('test_') ? '' : k;
    })(),
    revenueCatIosKey: (() => {
      const k = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';
      return k.startsWith('test_') ? '' : k;
    })(),
    revenueCatAndroidKey: (() => {
      const k = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';
      return k.startsWith('test_') ? '' : k;
    })()
  }
});
