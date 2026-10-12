export type {
  BalanceHistoryEntry,
  CatalogReward,
  HistoryPeriod,
  HistoryPeriodMode,
  ProfileReward,
  RedeemProfileRewardResult,
} from "./types";

export {
  addMonths,
  addWeeks,
  resolveHistoryPeriod,
  shiftHistoryPeriod,
  startOfMonth,
  startOfWeek,
} from "./services/historyPeriod";

export {
  groupBalanceHistoryByProfile,
  type BalanceHistoryProfileGroup,
} from "./services/historyMapping";

export {
  assertProfileRewardInput,
  canRedeemReward,
  parsePositiveIntegerDraft,
} from "./services/rewardValidation";

export {
  createProfileReward,
  createReward,
  deleteProfileReward,
  deleteReward,
  listBalanceHistory,
  listProfileRewards,
  listRewards,
  redeemProfileReward,
  setProfileBalanceWithHistory,
  updateProfileReward,
  updateReward,
} from "./services/rewardRepo";

export { ProfileRewardsModal } from "./components/ProfileRewardsModal";
