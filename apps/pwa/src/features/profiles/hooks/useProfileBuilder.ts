import { useState, useCallback } from "react";
import {
  DEFAULT_DRAFT,
  normalizePrimaryColor,
  normalizeSecondaryColor,
  type ProfileBuilderDraft,
  type ChildProfile,
} from "../types";
import { createProfile, updateProfile } from "../services/profileRepo";

type BuilderMode = "create" | "edit";

interface UseProfileBuilderOptions {
  mode: BuilderMode;
  initial?: Partial<ProfileBuilderDraft>;
  profileId?: string; // requis en mode edit
}

interface UseProfileBuilderState {
  draft: ProfileBuilderDraft;
  submitting: boolean;
  error: string | null;
}

interface UseProfileBuilderActions {
  setName: (name: string) => void;
  setPrimaryColor: (color: string) => void;
  setSecondaryColor: (color: string) => void;
  setStickerKey: (key: string) => void;
  submit: () => Promise<ChildProfile | null>;
  reset: () => void;
}

export function useProfileBuilder(
  options: UseProfileBuilderOptions
): UseProfileBuilderState & UseProfileBuilderActions {
  const initialDraft: ProfileBuilderDraft = {
    ...DEFAULT_DRAFT,
    ...options.initial,
    primaryColor: normalizePrimaryColor(
      options.initial?.primaryColor ?? DEFAULT_DRAFT.primaryColor
    ),
    secondaryColor: normalizeSecondaryColor(
      options.initial?.secondaryColor ?? DEFAULT_DRAFT.secondaryColor
    ),
  };

  const [draft, setDraft] = useState<ProfileBuilderDraft>(initialDraft);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setName = useCallback((name: string) => {
    setDraft((d) => ({ ...d, name }));
  }, []);

  const setPrimaryColor = useCallback((color: string) => {
    setDraft((d) => ({ ...d, primaryColor: normalizePrimaryColor(color) }));
  }, []);

  const setSecondaryColor = useCallback((color: string) => {
    setDraft((d) => ({ ...d, secondaryColor: normalizeSecondaryColor(color) }));
  }, []);

  const setStickerKey = useCallback((stickerKey: string) => {
    setDraft((d) => ({ ...d, stickerKey }));
  }, []);

  const submit = useCallback(async (): Promise<ChildProfile | null> => {
    if (!draft.name.trim()) {
      setError("Le prénom est requis.");
      return null;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (options.mode === "edit" && options.profileId) {
        const updated = await updateProfile(options.profileId, {
          name: draft.name,
          primaryColor: draft.primaryColor,
          secondaryColor: draft.secondaryColor,
          stickerKey: draft.stickerKey,
        });
        return updated;
      } else {
        const created = await createProfile({
          name: draft.name,
          primaryColor: draft.primaryColor,
          secondaryColor: draft.secondaryColor,
          stickerKey: draft.stickerKey,
        });
        return created;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [draft, options]);

  const reset = useCallback(() => {
    setDraft({
      ...DEFAULT_DRAFT,
      ...options.initial,
      primaryColor: normalizePrimaryColor(
        options.initial?.primaryColor ?? DEFAULT_DRAFT.primaryColor
      ),
      secondaryColor: normalizeSecondaryColor(
        options.initial?.secondaryColor ?? DEFAULT_DRAFT.secondaryColor
      ),
    });
    setError(null);
  }, [
    options.initial?.name,
    options.initial?.primaryColor,
    options.initial?.secondaryColor,
    options.initial?.stickerKey,
  ]);

  return {
    draft,
    submitting,
    error,
    setName,
    setPrimaryColor,
    setSecondaryColor,
    setStickerKey,
    submit,
    reset,
  };
}
