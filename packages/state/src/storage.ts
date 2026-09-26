// Type-checking entry. At runtime Metro / Jest resolve storage.native.ts or storage.web.ts (1.5);
// both must satisfy the same signature, which storage.test.ts asserts on every platform.
export * from './storage.web';
