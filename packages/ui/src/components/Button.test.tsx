import { renderWithProviders, screen, userEvent } from '@repo/testing/render';

import { Button } from './Button';

// 13.7 / 13.9 — RNTL, queried by role and name (which exercises the a11y props from 9.1).
describe('Button', () => {
  it('is an accessible button that fires onPress', async () => {
    const onPress = jest.fn();
    renderWithProviders(<Button title="Save" onPress={onPress} />);
    await userEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is disabled and busy while loading', async () => {
    const onPress = jest.fn();
    renderWithProviders(<Button title="Save" loading onPress={onPress} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toBeBusy();
    await userEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});
