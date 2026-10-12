import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DEFAULT_LAYOUT_PREFERENCES,
  normalizeLayoutPreferences,
  type LayoutPreferences,
} from "../utils/layoutPreferencesCore";

const STORAGE_KEY_PREFIX = "maroutine:layout-preferences:v1";

export function getLayoutPreferencesStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}:${userId}`;
}

export async function loadLayoutPreferences(userId: string | null): Promise<LayoutPreferences> {
  if (!userId) return { ...DEFAULT_LAYOUT_PREFERENCES };

  const rawValue = await AsyncStorage.getItem(getLayoutPreferencesStorageKey(userId));
  if (!rawValue) return { ...DEFAULT_LAYOUT_PREFERENCES };

  try {
    return normalizeLayoutPreferences(JSON.parse(rawValue));
  } catch {
    return { ...DEFAULT_LAYOUT_PREFERENCES };
  }
}

export async function saveLayoutPreferences(
  userId: string | null,
  preferences: LayoutPreferences
): Promise<void> {
  if (!userId) return;
  const normalized = normalizeLayoutPreferences(preferences);
  await AsyncStorage.setItem(getLayoutPreferencesStorageKey(userId), JSON.stringify(normalized));
}
