import { fixtures } from '@repo/testing/fixtures';
import { server } from '@repo/testing/msw-node';
import { renderWithProviders, screen, waitFor } from '@repo/testing/render-web';
import userEvent from '@testing-library/user-event';
import type * as React from 'react';

import HomeScreen from '../app/index';
import SignInScreen from '../app/sign-in';
import SignUpScreen from '../app/sign-up';

// 13.10 — screen-level integration tests: real providers, real api-client, MSW backend.
// Navigation is the one thing mocked; E2E (Playwright) covers real routing.
const mockReplace = jest.fn();
jest.mock('expo-router', () => {
  const { forwardRef, createElement } = jest.requireActual<typeof React>('react');
  return {
    Link: forwardRef(
      (
        {
          children,
          href,
          asChild: _asChild,
          ...rest
        }: { children: React.ReactNode; href: string; asChild?: boolean },
        ref,
      ) => createElement('a', { ...rest, href, ref }, children),
    ),
    useRouter: () => ({ replace: mockReplace, push: jest.fn(), back: jest.fn() }),
    Redirect: () => null,
  };
});
jest.mock('expo-router/head', () => ({ __esModule: true, default: () => null }));

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  mockReplace.mockReset();
});
afterAll(() => server.close());

describe('HomeScreen', () => {
  it('greets the world when signed out', async () => {
    renderWithProviders(<HomeScreen />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Hello, world!' })).toBeTruthy();
  });

  it('greets the user and lists messages when signed in', async () => {
    renderWithProviders(<HomeScreen />, { signedIn: true });
    expect(
      await screen.findByRole('heading', { level: 1, name: `Hello, ${fixtures.user.name}!` }),
    ).toBeTruthy();
    expect(await screen.findByRole('heading', { level: 2, name: '10 messages' })).toBeTruthy();
  });

  it('shows the feature-flagged card only when enabled (6.4)', async () => {
    renderWithProviders(<HomeScreen />, { flags: { 'home.whats-new': true } });
    expect(await screen.findByText(/What's new/)).toBeTruthy();
  });

  it('renders in Spanish (10.1)', async () => {
    renderWithProviders(<HomeScreen />, { locale: 'es' });
    expect(await screen.findByRole('heading', { level: 1, name: '¡Hola, mundo!' })).toBeTruthy();
  });
});

describe('SignInScreen', () => {
  it('signs in and tracks the event once consent is given', async () => {
    const user = userEvent.setup();
    const { session, analyticsEvents } = renderWithProviders(<SignInScreen />, {
      analyticsConsent: true,
    });
    await user.type(screen.getByLabelText('Email'), fixtures.credentials.email);
    await user.type(screen.getByLabelText('Password'), fixtures.credentials.password);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'));
    expect(session.getState()).toMatchObject({ status: 'signedIn', user: fixtures.user });
    expect(analyticsEvents).toContainEqual({
      name: 'signed_in',
      properties: { method: 'password' },
    });
  });

  it('shows field errors from the shared schema', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignInScreen />);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Enter a valid email address.')).toBeTruthy();
    expect(screen.getByText('Password must be at least 8 characters.')).toBeTruthy();
  });
});

describe('SignUpScreen', () => {
  it('creates an account, signs in and tracks the event', async () => {
    const user = userEvent.setup();
    const { session, analyticsEvents } = renderWithProviders(<SignUpScreen />, {
      analyticsConsent: true,
    });
    await user.type(screen.getByLabelText('Name'), 'Grace Hopper');
    await user.type(screen.getByLabelText('Email'), 'grace@example.com');
    await user.type(screen.getByLabelText('Password'), 'cobol-1959');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'));
    expect(session.getState()).toMatchObject({
      status: 'signedIn',
      user: { name: 'Grace Hopper', email: 'grace@example.com' },
    });
    expect(analyticsEvents).toContainEqual({
      name: 'signed_up',
      properties: { method: 'password' },
    });
  });

  it('shows field errors from the shared schema', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignUpScreen />);
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText('Name is required.')).toBeTruthy();
    expect(screen.getByText('Enter a valid email address.')).toBeTruthy();
    expect(screen.getByText('Password must be at least 8 characters.')).toBeTruthy();
  });

  it('explains when the email already has an account', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignUpScreen />);
    await user.type(screen.getByLabelText('Name'), 'Another Ada');
    await user.type(screen.getByLabelText('Email'), fixtures.credentials.email);
    await user.type(screen.getByLabelText('Password'), 'cobol-1959');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect((await screen.findByRole('alert')).textContent).toBe(
      'An account with this email already exists. Sign in instead.',
    );
  });
});
