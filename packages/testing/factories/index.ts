import type { Greeting, Message, User } from '@repo/domain';

/**
 * 13.6 — Typed test-data builders. Built from the domain types, so a schema change that isn't
 * reflected here fails type-checking instead of silently producing stale fixtures.
 */
let seq = 0;
const next = () => ++seq;

export function buildUser(overrides: Partial<User> = {}): User {
  const n = next();
  return {
    id: `u_${n}`,
    name: `Test User ${n}`,
    email: `user${n}@example.com`,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function buildMessage(overrides: Partial<Message> = {}): Message {
  const n = next();
  return {
    id: `m_${n}`,
    text: `Message ${n}`,
    createdAt: new Date(Date.UTC(2026, 0, 1, 0, n)).toISOString(),
    ...overrides,
  };
}

export function buildGreeting(overrides: Partial<Greeting> = {}): Greeting {
  const name = overrides.name ?? 'world';
  return { message: `Hello, ${name}!`, name, servedAt: '2026-01-01T00:00:00.000Z', ...overrides };
}
