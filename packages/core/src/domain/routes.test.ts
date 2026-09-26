import { resolveNotificationLink } from './notifications';
import { buildPath, matchPath } from './routes';

describe('route map', () => {
  it('builds paths with params', () =>
    expect(buildPath('message', { id: 'a b' })).toBe('/messages/a%20b'));
  it('matches deep links from any scheme', () => {
    expect(matchPath('helloworld://messages/42')).toEqual({
      route: 'message',
      params: { id: '42' },
    });
    expect(matchPath('https://app.example.com/settings?x=1')).toEqual({
      route: 'settings',
      params: {},
    });
    expect(matchPath('/')).toEqual({ route: 'home', params: {} });
    expect(matchPath('/nope')).toBeNull();
  });
  it('resolves notification links with a safe fallback', () => {
    expect(resolveNotificationLink({ id: '1', title: 't', body: 'b', link: '/messages/7' })).toBe(
      '/messages/7',
    );
    expect(resolveNotificationLink({ id: '1', title: 't', body: 'b', link: '/evil' })).toBe('/');
    expect(resolveNotificationLink(null)).toBe('/');
  });
});
