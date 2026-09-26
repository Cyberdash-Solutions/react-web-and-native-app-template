import { webManifest } from './pwa';

test('webManifest is installable', () => {
  expect(
    webManifest({
      name: 'Hello World',
      shortName: 'Hello',
      themeColor: '#4F46E5',
      backgroundColor: '#F8FAFC',
    }),
  ).toMatchObject({
    display: 'standalone',
    start_url: '/',
  });
});
