// Expo ambient types (process.env.EXPO_PUBLIC_*, Metro require). Expo may also generate
// expo-env.d.ts locally; that file is git-ignored, this one is committed so CI type-checks.
/// <reference types="expo/types" />

// Metro resolves image imports to an asset reference.
declare module '*.png' {
  import type { ImageSourcePropType } from 'react-native';

  const source: ImageSourcePropType;
  export default source;
}
