import { z } from 'zod';

import { buildPath, matchPath } from './routes';

/** 11.3 — Notification payload schema shared by APNs/FCM (mobile) and web push. */
export const notificationPayloadSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  /** A path from the shared route map, e.g. "/messages/42". */
  link: z.string().refine((l) => matchPath(l) !== null, 'Unknown deep link'),
});
export type NotificationPayload = z.infer<typeof notificationPayloadSchema>;

/** Returns the in-app path a notification should open, falling back to home. */
export function resolveNotificationLink(payload: unknown): string {
  const parsed = notificationPayloadSchema.safeParse(payload);
  return parsed.success ? parsed.data.link : buildPath('home');
}
