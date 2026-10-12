import type { ProfileRoutineDraft } from "../types";

export type BuilderValidationErrorCode =
  | "duplicate_moment"
  | "duplicate_activity_in_moment"
  | "duplicate_task_in_activity"
  | "activity_without_tasks_stars_required"
  | "activity_with_tasks_stars_must_be_zero"
  | "task_stars_required";

export interface BuilderValidationError {
  code: BuilderValidationErrorCode;
  momentLinkId: string;
  activityLinkId?: string;
  activityName?: string;
  taskLinkId?: string;
  taskName?: string;
  message: string;
}

/**
 * Règles métier Builder (E8-R03):
 * - activité sans tâche: étoiles activité > 0
 * - activité avec tâches: étoiles activité = 0
 * - activité avec tâches: toutes les tâches > 0
 */
export function validateProfileRoutineDraft(
  draft: ProfileRoutineDraft
): BuilderValidationError[] {
  const errors: BuilderValidationError[] = [];
  const seenMomentIds = new Set<string>();

  for (const moment of draft.moments) {
    if (seenMomentIds.has(moment.momentId)) {
      errors.push({
        code: "duplicate_moment",
        momentLinkId: moment.linkId,
        message: `Le moment "${moment.momentName}" est deja present plusieurs fois dans la routine.`,
      });
    } else {
      seenMomentIds.add(moment.momentId);
    }

    const seenActivityIds = new Set<string>();

    for (const activity of moment.activities) {
      if (seenActivityIds.has(activity.activityId)) {
        errors.push({
          code: "duplicate_activity_in_moment",
          momentLinkId: moment.linkId,
          activityLinkId: activity.linkId,
          activityName: activity.activityName,
          message: `L'activite "${activity.activityName}" est deja presente dans "${moment.momentName}".`,
        });
      } else {
        seenActivityIds.add(activity.activityId);
      }

      const hasTasks = activity.tasks.length > 0;
      const seenTaskIds = new Set<string>();

      if (!hasTasks && activity.stars <= 0) {
        errors.push({
          code: "activity_without_tasks_stars_required",
          momentLinkId: moment.linkId,
          activityLinkId: activity.linkId,
          activityName: activity.activityName,
          message: `L'activité "${activity.activityName}" doit avoir au moins 1 étoile.`,
        });
      }

      if (hasTasks && activity.stars !== 0) {
        errors.push({
          code: "activity_with_tasks_stars_must_be_zero",
          momentLinkId: moment.linkId,
          activityLinkId: activity.linkId,
          activityName: activity.activityName,
          message: `L'activité "${activity.activityName}" doit être à 0 étoile quand elle contient des tâches.`,
        });
      }

      if (hasTasks) {
        for (const task of activity.tasks) {
          if (seenTaskIds.has(task.taskId)) {
            errors.push({
              code: "duplicate_task_in_activity",
              momentLinkId: moment.linkId,
              activityLinkId: activity.linkId,
              activityName: activity.activityName,
              taskLinkId: task.linkId,
              taskName: task.taskName,
              message: `La tache "${task.taskName}" est deja presente dans "${activity.activityName}".`,
            });
          } else {
            seenTaskIds.add(task.taskId);
          }

          if (task.stars > 0) continue;
          errors.push({
            code: "task_stars_required",
            momentLinkId: moment.linkId,
            activityLinkId: activity.linkId,
            activityName: activity.activityName,
            taskLinkId: task.linkId,
            taskName: task.taskName,
            message: `La tâche "${task.taskName}" dans "${activity.activityName}" doit avoir au moins 1 étoile.`,
          });
        }
      }
    }
  }

  return errors;
}

export function formatValidationErrorMessage(
  errors: BuilderValidationError[],
  maxLines = 4
): string {
  if (errors.length === 0) return "";
  const lines = errors.slice(0, maxLines).map((error) => `• ${error.message}`);
  const remainingCount = errors.length - lines.length;
  if (remainingCount > 0) {
    lines.push(`• +${remainingCount} autre(s) règle(s) à corriger.`);
  }

  return `Sauvegarde impossible:\n${lines.join("\n")}`;
}
