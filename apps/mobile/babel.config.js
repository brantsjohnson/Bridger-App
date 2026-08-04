// ============================================
// WHAT THIS FILE DOES (plain English):
// Tells the app's build tool how to understand our code. Three things:
//  1. Expo's standard preset (with NativeWind's JSX so className works in RN).
//  2. NativeWind's preset (turns Tailwind classes into styles).
//  3. The Worklets plugin, required by Reanimated for smooth animations.
//     It MUST be listed last.
// ============================================
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel'
    ],
    plugins: ['react-native-worklets/plugin']
  };
};
