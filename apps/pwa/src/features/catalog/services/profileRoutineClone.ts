import type { ProfileRoutineDraft } from "../types";
import { makeDraftLinkId } from "../types";

export function cloneRoutineDraftForProfile(
  draft: ProfileRoutineDraft,
  targetProfileId: string
): ProfileRoutineDraft {
  return {
    ...draft,
    profileId: targetProfileId,
    moments: draft.moments.map((moment, momentIndex) => ({
      ...moment,
      linkId: makeDraftLinkId("moment"),
      sortIndex: momentIndex,
      activities: moment.activities.map((activity, activityIndex) => ({
        ...activity,
        linkId: makeDraftLinkId("activity"),
        sortIndex: activityIndex,
        tasks: activity.tasks.map((task, taskIndex) => ({
          ...task,
          linkId: makeDraftLinkId("task"),
          sortIndex: taskIndex,
        })),
      })),
    })),
  };
}
