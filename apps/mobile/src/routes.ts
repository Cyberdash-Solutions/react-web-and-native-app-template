import { buildPath, type RouteName, type RouteParams } from '@repo/domain';
import type { Href } from 'expo-router';

/** 2.4 — links are built from the shared route map, so web and mobile agree on every URL. */
export function href<R extends RouteName>(
  route: R,
  ...params: keyof RouteParams<R> extends never ? [] : [RouteParams<R>]
): Href {
  return (buildPath as (r: R, ...p: unknown[]) => string)(route, ...params) as Href;
}
