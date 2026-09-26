export default async function globalSetup() {
  if (process.env.CONTRACT_API_URL) return;
  const { startMockApi } = await import('@repo/mock-api');
  const api = await startMockApi({ port: 0, quiet: true });
  process.env.CONTRACT_API_URL = api.url;
  globalThis.__MOCK_API__ = api;
}
