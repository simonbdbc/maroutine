export function parsePositiveIntegerDraft(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function canRedeemReward(balance: number, costStars: number): boolean {
  return Number.isInteger(balance)
    && Number.isInteger(costStars)
    && balance >= 0
    && costStars > 0
    && costStars <= balance;
}

export function assertProfileRewardInput(params: {
  rewardId: string;
  durationMinutes: number;
  costStars: number;
}): void {
  if (params.rewardId.trim().length === 0) {
    throw new Error("Choisis une récompense du catalogue.");
  }
  if (!Number.isInteger(params.durationMinutes) || params.durationMinutes <= 0) {
    throw new Error("Le temps d'utilisation doit être un entier supérieur à 0.");
  }
  if (!Number.isInteger(params.costStars) || params.costStars <= 0) {
    throw new Error("Le coût en étoiles doit être un entier supérieur à 0.");
  }
}
