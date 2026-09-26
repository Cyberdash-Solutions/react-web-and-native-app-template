// 1.2 — Expo's Metro config detects the pnpm workspace automatically (watchFolders +
// nodeModulesPaths for symlinked packages) and resolves package.json "exports", so workspace
// packages are compiled from source (1.6) and *.web.ts splits are picked up (1.5).
const { getDefaultConfig } = require('expo/metro-config');

module.exports = getDefaultConfig(__dirname);
