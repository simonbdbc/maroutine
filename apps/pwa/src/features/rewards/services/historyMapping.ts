import type { BalanceHistoryEntry } from "../types";

export interface BalanceHistoryProfileGroup {
  profileId: string;
  profileName: string;
  entries: BalanceHistoryEntry[];
}

export function groupBalanceHistoryByProfile(entries: BalanceHistoryEntry[]): BalanceHistoryProfileGroup[] {
  const grouped = new Map<string, BalanceHistoryProfileGroup>();
  for (const entry of entries) {
    const group = grouped.get(entry.profileId);
    if (group) {
      group.entries.push(entry);
    } else {
      grouped.set(entry.profileId, {
        profileId: entry.profileId,
        profileName: entry.profileName,
        entries: [entry],
      });
    }
  }
  return Array.from(grouped.values());
}
