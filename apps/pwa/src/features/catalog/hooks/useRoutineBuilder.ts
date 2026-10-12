import { useState, useEffect, useCallback, useRef } from "react";
import type { ProfileRoutineDraft, CatalogMoment, CatalogActivity, CatalogTask } from "../types";
import { readProfileRoutineDraft, readRoutineCatalog } from "../services/builderReadService";
import { saveProfileRoutineDraft } from "../services/builderWriteService";
import {
  validateProfileRoutineDraft,
  formatValidationErrorMessage,
  type BuilderValidationError,
} from "../services/builderValidation";
import * as ops from "../services/builderDraftOps";

interface UseRoutineBuilderState {
  draft: ProfileRoutineDraft | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  validationErrors: BuilderValidationError[];
  dirty: boolean;
}

interface UseRoutineBuilderActions {
  // Moments
  addMoment: (catalog: CatalogMoment) => void;
  removeMoment: (linkId: string) => void;
  moveMoment: (linkId: string, direction: -1 | 1) => void;
  // Activities
  addActivity: (momentLinkId: string, catalog: CatalogActivity) => void;
  removeActivity: (momentLinkId: string, activityLinkId: string) => void;
  moveActivity: (momentLinkId: string, activityLinkId: string, direction: -1 | 1) => void;
  updateActivityStars: (momentLinkId: string, activityLinkId: string, stars: number) => void;
  updateActivitySticker: (momentLinkId: string, activityLinkId: string, stickerKey: string) => void;
  // Tasks
  addTask: (momentLinkId: string, activityLinkId: string, catalog: CatalogTask) => void;
  removeTask: (momentLinkId: string, activityLinkId: string, taskLinkId: string) => void;
  moveTask: (momentLinkId: string, activityLinkId: string, taskLinkId: string, direction: -1 | 1) => void;
  updateTaskStars: (momentLinkId: string, activityLinkId: string, taskLinkId: string, stars: number) => void;
  // Save
  save: () => Promise<boolean>;
  reload: () => Promise<void>;
  refreshCatalog: () => Promise<void>;
}

export type UseRoutineBuilderReturn = UseRoutineBuilderState & UseRoutineBuilderActions;

export function useRoutineBuilder(profileId: string | null): UseRoutineBuilderReturn {
  const [draft, setDraft] = useState<ProfileRoutineDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<BuilderValidationError[]>([]);
  const [dirty, setDirty] = useState(false);
  const savingRef = useRef(false);

  const reload = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    setError(null);
    setValidationErrors([]);
    try {
      const data = await readProfileRoutineDraft(profileId);
      setDraft(data);
      setDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  const refreshCatalog = useCallback(async () => {
    try {
      const catalog = await readRoutineCatalog();
      setDraft((prev) => (prev ? ops.syncDraftCatalog(prev, catalog) : prev));
    } catch {
      // Keep the current draft if the background catalog refresh fails.
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  // ── Draft mutation helper ───────────────────────────────────────────────────
  function mutate(fn: (d: ProfileRoutineDraft) => ProfileRoutineDraft) {
    setDraft((prev) => {
      if (!prev) return prev;
      setError(null);
      setValidationErrors([]);
      const next = fn(prev);
      if (next !== prev) {
        setDirty(true);
      }
      return next;
    });
  }

  // ── Moment actions ──────────────────────────────────────────────────────────
  const addMoment = useCallback((c: CatalogMoment) => mutate((d) => ops.addMoment(d, c)), []);
  const removeMoment = useCallback((linkId: string) => mutate((d) => ops.removeMoment(d, linkId)), []);
  const moveMoment = useCallback((linkId: string, dir: -1 | 1) => mutate((d) => ops.moveMoment(d, linkId, dir)), []);

  // ── Activity actions ────────────────────────────────────────────────────────
  const addActivity = useCallback((mId: string, c: CatalogActivity) => mutate((d) => ops.addActivity(d, mId, c)), []);
  const removeActivity = useCallback((mId: string, aId: string) => mutate((d) => ops.removeActivity(d, mId, aId)), []);
  const moveActivity = useCallback((mId: string, aId: string, dir: -1 | 1) => mutate((d) => ops.moveActivity(d, mId, aId, dir)), []);
  const updateActivityStars = useCallback((mId: string, aId: string, stars: number) => mutate((d) => ops.updateActivityStars(d, mId, aId, stars)), []);
  const updateActivitySticker = useCallback((mId: string, aId: string, stickerKey: string) => mutate((d) => ops.updateActivitySticker(d, mId, aId, stickerKey)), []);

  // ── Task actions ────────────────────────────────────────────────────────────
  const addTask = useCallback((mId: string, aId: string, c: CatalogTask) => mutate((d) => ops.addTask(d, mId, aId, c)), []);
  const removeTask = useCallback((mId: string, aId: string, tId: string) => mutate((d) => ops.removeTask(d, mId, aId, tId)), []);
  const moveTask = useCallback((mId: string, aId: string, tId: string, dir: -1 | 1) => mutate((d) => ops.moveTask(d, mId, aId, tId, dir)), []);
  const updateTaskStars = useCallback((mId: string, aId: string, tId: string, stars: number) => mutate((d) => ops.updateTaskStars(d, mId, aId, tId, stars)), []);

  // ── Save ────────────────────────────────────────────────────────────────────
  const save = useCallback(async (): Promise<boolean> => {
    if (!draft || savingRef.current) return false;
    setError(null);
    setValidationErrors([]);

    const validationErrors = validateProfileRoutineDraft(draft);
    if (validationErrors.length > 0) {
      setValidationErrors(validationErrors);
      setError(formatValidationErrorMessage(validationErrors));
      return false;
    }

    savingRef.current = true;
    setSaving(true);
    try {
      await saveProfileRoutineDraft(draft);
      setDirty(false);
      setValidationErrors([]);
      // Reload to get fresh IDs from DB
      await reload();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de sauvegarde");
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [draft, reload]);

  return {
    draft, loading, saving, error, validationErrors, dirty,
    addMoment, removeMoment, moveMoment,
    addActivity, removeActivity, moveActivity, updateActivityStars, updateActivitySticker,
    addTask, removeTask, moveTask, updateTaskStars,
    save, reload, refreshCatalog,
  };
}
