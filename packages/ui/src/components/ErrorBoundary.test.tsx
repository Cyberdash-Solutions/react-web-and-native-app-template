import { renderWithProviders, screen } from '@repo/testing/render';

import { ErrorBoundary } from './ErrorBoundary';

function Boom(): never {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it('renders the platform fallback and reports the error', () => {
    const onError = jest.fn();
    renderWithProviders(
      <ErrorBoundary onError={onError} labels={{ title: 'Oops', retry: 'Retry' }}>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('heading', { name: 'Oops' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeOnTheScreen();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'boom' }),
      expect.anything(),
    );
  });
});
