import { fixtures } from '@repo/testing/fixtures';
import { server } from '@repo/testing/msw-node';
import { renderWithProviders, screen, userEvent, waitFor } from '@repo/testing/render';
import type * as React from 'react';

import HomeScreen from '../app/index';
import SignInScreen from '../app/sign-in';
import SignUpScreen from '../app/sign-up';

// 13.7 / 13.10 — mobile screens with RNTL, the real providers and the MSW backend.
// Navigation is the one thing mocked; Maestro (e2e/) covers real routing on devices.
const mockDismissTo = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => {
  const { Fragment, createElement } = jest.requireActual<typeof React>('react');
  const Stack = Object.assign(() => null, { Screen: () => null });
  return {
    Link: ({ children }: { children: React.ReactNode }) => createElement(Fragment, null, children),
    Stack,
    useRouter: () => ({ dismissTo: mockDismissTo, replace: mockReplace, push: jest.fn() }),
    Redirect: () => null,
  };
});

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  mockDismissTo.mockReset();
  mockReplace.mockReset();
});
afterAll(() => server.close());

describe('HomeScreen', () => {
  it('greets the world and asks for analytics consent', async () => {
    renderWithProviders(<HomeScreen />);
    expect(await screen.findByRole('heading', { name: 'Hello, world!' })).toBeOnTheScreen();
    expect(screen.getByRole('heading', { name: 'We value your privacy' })).toBeOnTheScreen();
  });

  it('greets a signed-in user by name', async () => {
    renderWithProviders(<HomeScreen />, { signedIn: true, analyticsConsent: false });
    expect(
      await screen.findByRole('heading', { name: `Hello, ${fixtures.user.name}!` }),
    ).toBeOnTheScreen();
    expect(screen.queryByRole('heading', { name: 'We value your privacy' })).toBeNull();
  });
});

describe('SignInScreen', () => {
  it('signs in with the shared auth session', async () => {
    const { session } = renderWithProviders(<SignInScreen />);
    await userEvent.type(screen.getByLabelText('Email'), fixtures.credentials.email);
    await userEvent.type(screen.getByLabelText('Password'), fixtures.credentials.password);
    await userEvent.press(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(mockDismissTo).toHaveBeenCalledWith('/'));
    expect(session.getState()).toMatchObject({ status: 'signedIn', user: fixtures.user });
  });

  it('announces invalid credentials', async () => {
    renderWithProviders(<SignInScreen />);
    await userEvent.type(screen.getByLabelText('Email'), fixtures.credentials.email);
    await userEvent.type(screen.getByLabelText('Password'), 'wrong-password');
    await userEvent.press(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect.');
  });

  it('switches to sign-up', async () => {
    renderWithProviders(<SignInScreen />);
    await userEvent.press(screen.getByRole('button', { name: 'Create account' }));
    expect(mockReplace).toHaveBeenCalledWith('/sign-up');
  });
});

describe('SignUpScreen', () => {
  const fill = async (email: string) => {
    await userEvent.type(screen.getByLabelText('Name'), 'Grace Hopper');
    await userEvent.type(screen.getByLabelText('Email'), email);
    await userEvent.type(screen.getByLabelText('Password'), 'cobol-1959');
    await userEvent.press(screen.getByRole('button', { name: 'Create account' }));
  };

  it('creates an account and signs straight in', async () => {
    const { session } = renderWithProviders(<SignUpScreen />);
    await fill('grace@example.com');
    await waitFor(() => expect(mockDismissTo).toHaveBeenCalledWith('/'));
    expect(session.getState()).toMatchObject({
      status: 'signedIn',
      user: { name: 'Grace Hopper', email: 'grace@example.com' },
    });
  });

  it('explains when the email already has an account', async () => {
    renderWithProviders(<SignUpScreen />);
    await fill(fixtures.credentials.email);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'An account with this email already exists. Sign in instead.',
    );
  });

  it('switches to sign-in', async () => {
    renderWithProviders(<SignUpScreen />);
    await userEvent.press(screen.getByRole('button', { name: 'Sign in' }));
    expect(mockReplace).toHaveBeenCalledWith('/sign-in');
  });
});
