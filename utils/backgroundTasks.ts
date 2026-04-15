import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

export const BACKGROUND_FETCH_TASK = 'alhassan-background-fetch';
export const BACKGROUND_LOCATION_TASK = 'alhassan-background-location';

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, ({ data, error }) => {
  if (error) return;
  if (data) {
  }
});

export async function registerBackgroundFetch(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const status = await BackgroundFetch.getStatusAsync();
    if (
      status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
      status === BackgroundFetch.BackgroundFetchStatus.Denied
    ) {
      return;
    }

    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: 60,
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
  } catch {}
}

export async function registerBackgroundLocation(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const { status } = await Location.getBackgroundPermissionsAsync();
    if (status !== 'granted') return;

    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
    if (!isRegistered) {
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 60000,
        distanceInterval: 50,
        showsBackgroundLocationIndicator: false,
        foregroundService: {
          notificationTitle: 'الحسن المساعد الشخصي',
          notificationBody: 'يعمل في الخلفية',
          notificationColor: '#1a6ef5',
        },
      });
    }
  } catch {}
}

export async function unregisterAllTasks(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await TaskManager.unregisterAllTasksAsync();
  } catch {}
}
