import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuthStore } from "@features/auth";
import {
  DEFAULT_LAYOUT_PREFERENCES,
  normalizeLayoutPreferences,
  type LayoutPreferences,
  type RoutineDisplayMode,
  type RoutineLayoutMode,
  type SideMenuMode,
} from "../utils/layoutPreferencesCore";
import { loadLayoutPreferences, saveLayoutPreferences } from "../services/layoutPreferencesStorage";

type LayoutPreferencesUpdate =
  | Partial<LayoutPreferences>
  | ((current: LayoutPreferences) => LayoutPreferences);

type LayoutPreferencesContextValue = {
  preferences: LayoutPreferences;
  loading: boolean;
  error: string | null;
  setLayoutPreferences: (update: LayoutPreferencesUpdate) => Promise<void>;
  setSideMenuMode: (mode: SideMenuMode) => Promise<void>;
  setRoutineLayoutMode: (mode: RoutineLayoutMode) => Promise<void>;
  setRoutineDisplayMode: (mode: RoutineDisplayMode) => Promise<void>;
};

const LayoutPreferencesContext = createContext<LayoutPreferencesContextValue | null>(null);

function useStoredLayoutPreferences(userId: string | null): LayoutPreferencesContextValue {
  const [preferences, setPreferences] = useState<LayoutPreferences>(DEFAULT_LAYOUT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function hydrate() {
      setLoading(true);
      setError(null);
      try {
        const stored = await loadLayoutPreferences(userId);
        if (active) setPreferences(stored);
      } catch (err) {
        if (!active) return;
        setPreferences(DEFAULT_LAYOUT_PREFERENCES);
        setError(err instanceof Error ? err.message : "Préférences d'affichage indisponibles.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void hydrate();
    return () => {
      active = false;
    };
  }, [userId]);

  const setLayoutPreferences = useCallback(
    async (update: LayoutPreferencesUpdate) => {
      const nextPreferences = normalizeLayoutPreferences(
        typeof update === "function" ? update(preferences) : { ...preferences, ...update }
      );

      setPreferences(nextPreferences);
      setError(null);

      try {
        await saveLayoutPreferences(userId, nextPreferences);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Préférences d'affichage non sauvegardées.");
      }
    },
    [preferences, userId]
  );

  const setSideMenuMode = useCallback(
    (mode: SideMenuMode) => setLayoutPreferences({ sideMenuMode: mode }),
    [setLayoutPreferences]
  );

  const setRoutineLayoutMode = useCallback(
    (mode: RoutineLayoutMode) => setLayoutPreferences({ routineLayoutMode: mode }),
    [setLayoutPreferences]
  );

  const setRoutineDisplayMode = useCallback(
    (mode: RoutineDisplayMode) => setLayoutPreferences({ routineDisplayMode: mode }),
    [setLayoutPreferences]
  );

  return useMemo(
    () => ({
      preferences,
      loading,
      error,
      setLayoutPreferences,
      setSideMenuMode,
      setRoutineLayoutMode,
      setRoutineDisplayMode,
    }),
    [
      error,
      loading,
      preferences,
      setLayoutPreferences,
      setRoutineDisplayMode,
      setRoutineLayoutMode,
      setSideMenuMode,
    ]
  );
}

export function LayoutPreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthStore();
  const value = useStoredLayoutPreferences(user?.id ?? null);

  return (
    <LayoutPreferencesContext.Provider value={value}>{children}</LayoutPreferencesContext.Provider>
  );
}

export function useLayoutPreferences(): LayoutPreferencesContextValue {
  const context = useContext(LayoutPreferencesContext);
  if (!context) {
    throw new Error("useLayoutPreferences must be used inside LayoutPreferencesProvider");
  }
  return context;
}
