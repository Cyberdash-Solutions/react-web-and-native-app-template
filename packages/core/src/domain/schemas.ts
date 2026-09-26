import { z } from 'zod';

/**
 * 2.1 — API contracts. In a real product these are generated from OpenAPI / tRPC / GraphQL
 * codegen; this hand-written set is the "hello world" stand-in. Schemas evolve additively
 * only (12.6): old mobile clients must keep parsing new responses.
 */

export const userSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(80),
  email: z.email(),
  createdAt: z.iso.datetime(),
});
export type User = z.infer<typeof userSchema>;

export const updateProfileInputSchema = z.object({
  name: z.string().trim().min(1, 'validation:nameRequired').max(80, 'validation:nameTooLong'),
});
export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;

export const greetingSchema = z.object({
  message: z.string(),
  name: z.string(),
  servedAt: z.iso.datetime(),
});
export type Greeting = z.infer<typeof greetingSchema>;

export const signInInputSchema = z.object({
  email: z.email('validation:emailInvalid'),
  password: z.string().min(8, 'validation:passwordTooShort'),
});
export type SignInInput = z.infer<typeof signInInputSchema>;

export const authTokensSchema = z.object({
  accessToken: z.string(),
  /** Absent for web clients: the BFF keeps the refresh token in an httpOnly cookie (4.2). */
  refreshToken: z.string().optional(),
  /** Seconds until the access token expires. */
  expiresIn: z.number().int().positive(),
});
export type AuthTokens = z.infer<typeof authTokensSchema>;

export const signInResponseSchema = authTokensSchema.extend({ user: userSchema });
export type SignInResponse = z.infer<typeof signInResponseSchema>;

/** 12.6 — the server advertises the oldest client version it still supports. */
export const appConfigSchema = z.object({
  minSupportedVersion: z.object({ mobile: z.string(), web: z.string() }),
  maintenance: z.boolean().default(false),
});
export type AppConfig = z.infer<typeof appConfigSchema>;

/** 3.2 — cursor pagination envelope shared by every list endpoint. */
export const paginated = <T extends z.ZodType>(item: T) =>
  z.object({ items: z.array(item), nextCursor: z.string().nullable() });
export type Paginated<T> = { items: T[]; nextCursor: string | null };

export const messageSchema = z.object({
  id: z.string(),
  text: z.string(),
  createdAt: z.iso.datetime(),
});
export type Message = z.infer<typeof messageSchema>;
export const messagesPageSchema = paginated(messageSchema);

/** 14.4 — data export is served by the same API for both apps. */
export const dataExportSchema = z.object({
  user: userSchema,
  messages: z.array(messageSchema),
  exportedAt: z.iso.datetime(),
});
export type DataExport = z.infer<typeof dataExportSchema>;
