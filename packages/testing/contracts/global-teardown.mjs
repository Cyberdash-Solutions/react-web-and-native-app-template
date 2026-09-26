export default async function globalTeardown() {
  await globalThis.__MOCK_API__?.close();
}
