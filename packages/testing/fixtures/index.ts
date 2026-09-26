import type {
  AppConfig,
  AuthTokens,
  Greeting,
  Message,
  SignInInput,
  User,
} from '@repo/core/domain';

import appConfig from './app-config.json';
import credentials from './credentials.json';
import greetingAnonymous from './greeting-anonymous.json';
import messages from './messages.json';
import tokens from './tokens.json';
import user from './user.json';

/**
 * 13.18 — Static JSON fixtures shared by unit tests (MSW), the mock API used for E2E / local dev
 * (packages/testing/mock-api), Playwright and Maestro. Typed against domain types so they can't drift
 * (13.6); fixtures.test.ts also validates them against the Zod schemas.
 */
export const fixtures = {
  user: user satisfies User as User,
  credentials: credentials satisfies SignInInput as SignInInput,
  tokens: tokens as AuthTokens & { refreshToken: string },
  greetingAnonymous: greetingAnonymous satisfies Greeting as Greeting,
  appConfig: appConfig satisfies AppConfig as AppConfig,
  messages: messages satisfies Message[] as Message[],
};

export type Fixtures = typeof fixtures;
