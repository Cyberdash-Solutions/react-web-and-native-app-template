import { z } from 'zod';

/**
 * 13.14 — What the oldest supported mobile client (1.0.0) parses, frozen at its release.
 * These suites keep running until 1.0.0 is retired (bump fixtures/app-config.json
 * minSupportedVersion.mobile, then delete this file). Never edit a frozen schema.
 */
export const v1_0_0 = {
  version: '1.0.0',
  greeting: z.object({ message: z.string(), name: z.string(), servedAt: z.string() }),
  user: z.object({ id: z.string(), name: z.string(), email: z.string(), createdAt: z.string() }),
  signIn: z.object({
    accessToken: z.string(),
    refreshToken: z.string().optional(),
    expiresIn: z.number(),
    user: z.object({ id: z.string() }),
  }),
  config: z.object({ minSupportedVersion: z.object({ mobile: z.string(), web: z.string() }) }),
};
