// ios / android projects only: in-memory stand-ins for native modules that have no JS fallback
// (13.12 — persistence is tested with swappable adapters, not real MMKV).
jest.mock(
  'react-native-mmkv',
  () => {
    const stores = new Map();
    return {
      createMMKV: ({ id = 'default' } = {}) => {
        if (!stores.has(id)) stores.set(id, new Map());
        const map = stores.get(id);
        return {
          getString: (k) => map.get(k),
          set: (k, v) => map.set(k, v),
          remove: (k) => map.delete(k),
          clearAll: () => map.clear(),
          getAllKeys: () => [...map.keys()],
        };
      },
    };
  },
  { virtual: true },
);

jest.mock(
  'expo-secure-store',
  () => {
    const map = new Map();
    return {
      AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 0,
      getItemAsync: async (k) => map.get(k) ?? null,
      setItemAsync: async (k, v) => void map.set(k, v),
      deleteItemAsync: async (k) => void map.delete(k),
    };
  },
  { virtual: true },
);

jest.mock(
  '@react-native-community/netinfo',
  () => {
    const state = { type: 'wifi', isConnected: true, isInternetReachable: true };
    return {
      __esModule: true,
      default: {
        addEventListener: jest.fn((listener) => (listener(state), () => {})),
        fetch: jest.fn(async () => state),
        configure: jest.fn(),
      },
      useNetInfo: () => state,
    };
  },
  { virtual: true },
);
