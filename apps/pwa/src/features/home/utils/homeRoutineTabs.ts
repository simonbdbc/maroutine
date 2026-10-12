export interface VisibleRoutineTabRange {
  startIndex: number;
  endIndex: number;
}

export function resolveVisibleRoutineTabRange({
  activeIndex,
  routineColumnCount,
  profileCount,
}: {
  activeIndex: number;
  routineColumnCount: number;
  profileCount: number;
}): VisibleRoutineTabRange {
  if (!Number.isInteger(profileCount) || profileCount <= 0) {
    return { startIndex: 0, endIndex: 0 };
  }

  const safeActiveIndex = Number.isInteger(activeIndex)
    ? Math.max(0, Math.min(profileCount - 1, activeIndex))
    : 0;
  const safeRoutineColumnCount =
    Number.isInteger(routineColumnCount) && routineColumnCount > 0 ? routineColumnCount : 1;
  const groupSize = Math.max(1, Math.min(profileCount, safeRoutineColumnCount));
  const startIndex = Math.floor(safeActiveIndex / groupSize) * groupSize;

  return {
    startIndex,
    endIndex: Math.min(profileCount, startIndex + groupSize),
  };
}
