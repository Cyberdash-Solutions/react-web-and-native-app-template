import { createStaticFlagClient, featureFlags } from './flags';

describe('feature flags', () => {
  it('serves defaults', () => {
    expect(createStaticFlagClient().get('home.whats-new')).toBe(featureFlags['home.whats-new']);
  });

  it('applies overrides', () => {
    expect(
      createStaticFlagClient({ 'home.greeting-variant': 'enthusiastic' }).get(
        'home.greeting-variant',
      ),
    ).toBe('enthusiastic');
  });
});
