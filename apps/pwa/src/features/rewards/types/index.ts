import type { BalanceHistorySource } from "@shared/db";

export interface CatalogReward {
  id: string;
  userId: string;
  name: string;
  sortIndex: number;
}

export interface ProfileReward {
  id: string;
  profileId: string;
  rewardId: string;
  rewardName: string;
  durationMinutes: number;
  costStars: number;
  sortIndex: number;
}

export interface RedeemProfileRewardResult {
  profileId: string;
  spentStars: number;
  newBalance: number;
}

export interface BalanceHistoryEntry {
  id: string;
  profileId: string;
  profileName: string;
  deltaStars: number;
  balanceBefore: number;
  balanceAfter: number;
  source: BalanceHistorySource;
  description: string;
  occurredAt: string;
}

export type HistoryPeriodMode = "week" | "month";

export interface HistoryPeriod {
  mode: HistoryPeriodMode;
  start: Date;
  end: Date;
  label: string;
}
