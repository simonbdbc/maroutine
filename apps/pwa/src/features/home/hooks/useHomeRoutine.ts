import { useState, useEffect, useCallback, useRef } from "react";
import type { ValidateDayReturn } from "@shared/db";
import type { HomeRoutineVM, TaskVM, ActivityVM, MomentVM } from "../types";
import { localDateString } from "@shared/utils/date";
import {
  getRoutineForDate,
  toggleActivity as toggleActivityRpc,
  toggleTask as toggleTaskRpc,
  validateDay,
} from "../services/routineRepo";
import {
  applyOptimisticToggle,
  findToggleCurrentChecked,
} from "../services/homeOptimisticPatch";
import { getRandomStickerKey } from "@features/stickers/registry";

// ─── Types ────────────────────────────────────────────────────────────────────
interface UseHomeRoutineState {
  routine: HomeRoutineVM | null;
  loading: boolean;
  validatingDay: boolean;
  error: string | null;
}

interface UseHomeRoutineActions {
  refresh: () => Promise<void>;
  toggleTask: (task: TaskVM, activity: ActivityVM, moment: MomentVM) => Promise<void>;
  toggleActivity: (activity: ActivityVM, moment: MomentVM) => Promise<void>;
  doValidateDay: () => Promise<ValidateDayReturn | null>;
}

export type UseHomeRoutineReturn = UseHomeRoutineState & UseHomeRoutineActions;

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useHomeRoutine(profileId: string | null): UseHomeRoutineReturn {
  const [routine, setRoutine] = useState<HomeRoutineVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [validatingDay, setValidatingDay] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const routineRef = useRef<HomeRoutineVM | null>(null);
  const inFlightRef = useRef<Set<string>>(new Set());
  const validatingDayRef = useRef(false);

  const waitForNoInFlight = useCallback(async (): Promise<boolean> => {
    const timeoutMs = 5000;
    const startedAt = Date.now();
    while (inFlightRef.current.size > 0) {
      if (Date.now() - startedAt > timeoutMs) {
        return false;
      }
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    return true;
  }, []);

  useEffect(() => {
    routineRef.current = routine;
  }, [routine]);

  const refresh = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getRoutineForDate(profileId);
      setRoutine(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // ── Toggle task (optimistic) ────────────────────────────────────────────────
  const toggleTask = useCallback(
    async (task: TaskVM, _activity: ActivityVM, _moment: MomentVM) => {
      if (!profileId) return;
      if (validatingDayRef.current) return;

      const actionDate = localDateString();
      const inFlightKey = `task:${task.pivotId}:${actionDate}`;
      if (inFlightRef.current.has(inFlightKey)) return;

      const snapshot = routineRef.current;
      if (!snapshot) return;
      if (snapshot.isDayValidated) return;

      const currentChecked = findToggleCurrentChecked(snapshot, {
        kind: "task",
        pivotTaskId: task.pivotId,
      });
      if (currentChecked == null) return;

      const nextChecked = !currentChecked;
      const stickerKey = nextChecked ? getRandomStickerKey() : null;
      inFlightRef.current.add(inFlightKey);

      // Optimistic update
      const updated = applyOptimisticToggle(snapshot, {
        kind: "task",
        pivotTaskId: task.pivotId,
        checked: nextChecked,
        stickerKey,
      });
      setRoutine(updated);

      // Background DB call
      try {
        await toggleTaskRpc({
          profileId,
          pivotTaskId: task.pivotId,
          date: actionDate,
        });
      } catch {
        // Rollback
        setRoutine(snapshot);
        setError("Erreur de synchronisation. Réessaie.");
        await refresh();
      } finally {
        inFlightRef.current.delete(inFlightKey);
      }
    },
    [profileId, refresh]
  );

  // ── Toggle activity (optimistic + guard inFlight par cible) ─────────────────
  const toggleActivity = useCallback(
    async (activity: ActivityVM, _moment: MomentVM) => {
      if (!profileId) return;
      if (validatingDayRef.current) return;

      const actionDate = localDateString();
      const inFlightKey = `activity:${activity.pivotId}:${actionDate}`;
      if (inFlightRef.current.has(inFlightKey)) return;

      const snapshot = routineRef.current;
      if (!snapshot) return;
      if (snapshot.isDayValidated) return;

      const currentChecked = findToggleCurrentChecked(snapshot, {
        kind: "activity",
        pivotActivityId: activity.pivotId,
      });
      if (currentChecked == null) return;

      const nextChecked = !currentChecked;
      inFlightRef.current.add(inFlightKey);

      const updated = applyOptimisticToggle(snapshot, {
        kind: "activity",
        pivotActivityId: activity.pivotId,
        checked: nextChecked,
      });
      setRoutine(updated);

      try {
        await toggleActivityRpc({
          profileId,
          pivotActivityId: activity.pivotId,
          date: actionDate,
        });
      } catch {
        setRoutine(snapshot);
        setError("Erreur de synchronisation. Réessaie.");
        await refresh();
      } finally {
        inFlightRef.current.delete(inFlightKey);
      }
    },
    [profileId, refresh]
  );

  // ── Validate day ────────────────────────────────────────────────────────────
  const doValidateDay = useCallback(async (): Promise<ValidateDayReturn | null> => {
    if (!profileId) return null;
    if (validatingDayRef.current) return null;

    validatingDayRef.current = true;
    setValidatingDay(true);
    setError(null);

    const syncReady = await waitForNoInFlight();
    if (!syncReady) {
      setError("Synchronisation en cours. Réessaie dans quelques secondes.");
      validatingDayRef.current = false;
      setValidatingDay(false);
      return null;
    }

    const snapshot = routineRef.current;
    if (!snapshot) {
      validatingDayRef.current = false;
      setValidatingDay(false);
      return null;
    }
    if (snapshot.isDayValidated) {
      validatingDayRef.current = false;
      setValidatingDay(false);
      return null;
    }

    const actionDate = localDateString();

    setRoutine({ ...snapshot, isDayValidated: true });

    try {
      const result = await validateDay(profileId, actionDate);
      setRoutine((current) =>
        current
          ? {
              ...current,
              balance: result.new_balance,
              todayStars: result.earned_stars,
              isDayValidated: true,
            }
          : current
      );
      return result;
    } catch {
      setRoutine(snapshot);
      setError("Erreur de validation. Réessaie.");
      await refresh();
      return null;
    } finally {
      validatingDayRef.current = false;
      setValidatingDay(false);
    }
  }, [profileId, refresh, waitForNoInFlight]);

  return {
    routine,
    loading,
    validatingDay,
    error,
    refresh,
    toggleTask,
    toggleActivity,
    doValidateDay,
  };
}
