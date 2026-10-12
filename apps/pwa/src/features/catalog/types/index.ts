import type { MomentKind } from "@shared/db";

// ─── Catalogue items du compte ───────────────────────────────────────────────

export interface CatalogMoment {
  id: string;
  userId?: string | null;
  name: string;
  kind: MomentKind;
  label: string | null;
  defaultStars: number;
  sortIndex: number;
}

export interface CatalogActivity {
  id: string;
  userId?: string | null;
  name: string;
  label: string | null;
  icon: string | null;
  defaultStars: number;
  sortIndex: number;
}

export interface CatalogTask {
  id: string;
  userId?: string | null;
  name: string;
  label: string | null;
  defaultStars: number;
  sortIndex: number;
}

// ─── Builder VMs (routine d'un profil) ────────────────────────────────────────

export interface BuilderTaskVm {
  linkId: string;        // pivot ID (UUID existant) ou "draft:xxx" (nouveau)
  taskId: string;        // ID du catalogue task
  taskName: string;
  stars: number;
  sortIndex: number;
}

export interface BuilderActivityVm {
  linkId: string;        // pivot ID ou "draft:xxx"
  activityId: string;    // ID du catalogue activity
  activityName: string;
  activityIcon: string | null;
  stars: number;
  stickerKey: string;
  sortIndex: number;
  tasks: BuilderTaskVm[];
}

export interface BuilderMomentVm {
  linkId: string;        // pivot ID ou "draft:xxx"
  momentId: string;      // ID du catalogue moment
  momentName: string;
  stars: number;
  sortIndex: number;
  activities: BuilderActivityVm[];
}

export interface ProfileRoutineDraft {
  profileId: string;
  moments: BuilderMomentVm[];
  catalog: {
    moments: CatalogMoment[];
    activities: CatalogActivity[];
    tasks: CatalogTask[];
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function isDraftLink(linkId: string): boolean {
  return linkId.startsWith("draft:");
}

let _counter = 0;
export function makeDraftLinkId(type: "moment" | "activity" | "task"): string {
  _counter++;
  const rand = Math.random().toString(36).slice(2, 8);
  return `draft:${type}:${_counter}:${rand}`;
}
