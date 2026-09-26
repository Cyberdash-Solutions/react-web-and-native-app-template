import { renderWithProviders, screen, userEvent } from '@repo/testing/render';

import { TextField } from './TextField';

describe('TextField', () => {
  it('is labelled and announces errors', async () => {
    const onChangeText = jest.fn();
    renderWithProviders(
      <TextField label="Email" error="Enter a valid email address." onChangeText={onChangeText} />,
    );
    await userEvent.type(screen.getByLabelText('Email'), 'ada');
    expect(onChangeText).toHaveBeenLastCalledWith('ada');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address.');
  });
});
