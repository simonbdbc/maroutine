import { useState, useEffect, useCallback } from "react";
import type { ChildProfile } from "../types";
import {
  listProfiles,
  createProfile,
  createExampleProfile,
  updateProfile,
  deleteProfile,
  type CreateProfileInput,
  type UpdateProfileInput,
} from "../services/profileRepo";

interface UseProfilesState {
  profiles: ChildProfile[];
  loading: boolean;
  error: string | null;
}

interface UseProfilesActions {
  refresh: () => Promise<void>;
  create: (input: CreateProfileInput) => Promise<ChildProfile>;
  createExample: () => Promise<ChildProfile>;
  update: (id: string, patch: UpdateProfileInput) => Promise<void>;
  remove: (id: string) => Promise<void>;
  replaceLocal: (profile: ChildProfile) => void;
  patchLocal: (id: string, patch: Partial<ChildProfile>) => void;
}

export function useProfiles(): UseProfilesState & UseProfilesActions {
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listProfiles();
      setProfiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(async (input: CreateProfileInput) => {
    const newProfile = await createProfile(input);
    setProfiles((prev) => [...prev, newProfile]);
    return newProfile;
  }, []);

  const createExample = useCallback(async () => {
    const newProfile = await createExampleProfile();
    setProfiles((prev) => [...prev, newProfile]);
    return newProfile;
  }, []);

  const update = useCallback(async (id: string, patch: UpdateProfileInput) => {
    const updated = await updateProfile(id, patch);
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? updated : p))
    );
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteProfile(id);
    setProfiles((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const replaceLocal = useCallback((profile: ChildProfile) => {
    setProfiles((prev) => prev.map((p) => (p.id === profile.id ? profile : p)));
  }, []);

  const patchLocal = useCallback((id: string, patch: Partial<ChildProfile>) => {
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  return {
    profiles,
    loading,
    error,
    refresh,
    create,
    createExample,
    update,
    remove,
    replaceLocal,
    patchLocal,
  };
}
