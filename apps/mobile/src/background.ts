import { queryKeys } from '@repo/core/data';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import type { Services } from './services';

/**
 * 11.1 / 3.4 — Mobile background sync via the OS scheduler (BGTaskScheduler / WorkManager).
 * The web equivalent is the service worker in apps/web/src/pwa.ts.
 *
 * TaskManager.defineTask must run at module scope, so the task reads services through `bind`.
 */
export const BACKGROUND_SYNC_TASK = 'background-sync';

let services: Services | null = null;

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  if (!services || services.session.getState().status !== 'signedIn')
    return BackgroundTask.BackgroundTaskResult.Success;
  try {
    await services.queryClient.prefetchQuery({
      queryKey: queryKeys.greeting(),
      queryFn: () => services!.endpoints.getGreeting(),
    });
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    services.logger.warn('background sync failed', { error });
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerBackgroundSync(bound: Services) {
  services = bound;
  if ((await BackgroundTask.getStatusAsync()) !== BackgroundTask.BackgroundTaskStatus.Available)
    return;
  if (!(await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK))) {
    await BackgroundTask.registerTaskAsync(BACKGROUND_SYNC_TASK, { minimumInterval: 60 });
  }
}
