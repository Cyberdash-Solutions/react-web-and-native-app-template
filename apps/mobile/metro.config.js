// 1.2 — Expo's Metro config detects the pnpm workspace automatically (watchFolders +
// nodeModulesPaths for symlinked packages) and resolves package.json "exports", so workspace
// packages are compiled from source (1.6) and *.native.ts splits are picked up (1.5).
// Sentry's wrapper adds debug IDs so source maps match release bundles (6.3).
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);
