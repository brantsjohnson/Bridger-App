// ============================================
// WHAT THIS FILE DOES (plain English):
// Configures Metro, the bundler that packages the app's JavaScript. Two jobs:
//  1. Monorepo awareness — let the app import our shared packages
//     (@bridger/shared, /permissions, /ui) that live one level up.
//  2. NativeWind — process our Tailwind styles (global.css) into the app.
// ============================================
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// --- Watch the whole monorepo so edits to shared packages hot-reload ---
config.watchFolders = [workspaceRoot];

// --- Look for installed packages both here and at the repo root ---
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules')
];

module.exports = withNativeWind(config, { input: './global.css' });
