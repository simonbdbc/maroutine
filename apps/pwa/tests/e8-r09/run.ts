import {
  addActivity,
  addMoment,
  addTask,
  removeTask,
  syncDraftCatalog,
  updateActivityStars,
  updateActivitySticker,
} from "../../src/features/catalog/services/builderDraftOps";
import { validateProfileRoutineDraft } from "../../src/features/catalog/services/builderValidation";
import { buildHomeRoutineVm } from "../../src/features/home/services/routineMapper";
import type { ProfileRoutineDraft } from "../../src/features/catalog/types";

type TestCase = {
  name: string;
  run: () => void;
};

const tests: TestCase[] = [];

function test(name: string, run: () => void): void {
  tests.push({ name, run });
}

function fail(message: string): never {
  throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    fail(`${label}: attendu=${String(expected)} reçu=${String(actual)}`);
  }
}

function assertTruthy(value: unknown, label: string): void {
  if (!value) {
    fail(`${label}: valeur attendue truthy`);
  }
}

function assertNotNull<T>(value: T | null | undefined, label: string): T {
  if (value == null) {
    fail(`${label}: valeur attendue non nulle`);
  }
  return value;
}

function makeBaseDraft(): ProfileRoutineDraft {
  return {
    profileId: "profile-1",
    catalog: {
      moments: [
        {
          id: "cm-1",
          name: "Matin",
          kind: "morning",
          label: "Matin",
          defaultStars: 0,
          sortIndex: 0,
        },
      ],
      activities: [
        {
          id: "ca-1",
          name: "Se preparer",
          label: "Se preparer",
          icon: "auto_fix_high",
          defaultStars: 0,
          sortIndex: 0,
        },
      ],
      tasks: [
        {
          id: "ct-1",
          name: "Brosser les dents",
          label: "Brosser les dents",
          defaultStars: 3,
          sortIndex: 0,
        },
      ],
    },
    moments: [
      {
        linkId: "pm-1",
        momentId: "cm-1",
        momentName: "Matin",
        stars: 0,
        sortIndex: 0,
        activities: [
          {
            linkId: "pma-1",
            activityId: "ca-1",
            activityName: "Se preparer",
            activityIcon: "auto_fix_high",
            stars: 5,
            stickerKey: "panda",
            sortIndex: 0,
            tasks: [],
          },
        ],
      },
    ],
  };
}

function getOnlyActivity(draft: ProfileRoutineDraft) {
  const moment = assertNotNull(draft.moments[0], "moment[0]");
  return assertNotNull(moment.activities[0], "activity[0]");
}

test("builderDraftOps: addTask force activity.stars=0 au 1er ajout", () => {
  const base = makeBaseDraft();
  const catalogTask = assertNotNull(base.catalog.tasks[0], "catalog task");

  const updated = addTask(base, "pm-1", "pma-1", catalogTask);
  const activity = getOnlyActivity(updated);
  const task = assertNotNull(activity.tasks[0], "task[0]");

  assertEqual(activity.stars, 0, "activity.stars");
  assertEqual(activity.tasks.length, 1, "activity.tasks.length");
  assertEqual(task.stars, 3, "task.stars");
});

test("builderDraftOps: addMoment ignore un doublon de moment", () => {
  const base = makeBaseDraft();
  const catalogMoment = assertNotNull(base.catalog.moments[0], "catalog moment");

  const updated = addMoment(base, catalogMoment);

  assertEqual(updated.moments.length, 1, "moments.length");
});

test("builderDraftOps: addActivity ignore un doublon d'activite dans le meme moment", () => {
  const base = makeBaseDraft();
  const catalogActivity = assertNotNull(base.catalog.activities[0], "catalog activity");

  const updated = addActivity(base, "pm-1", catalogActivity);

  assertEqual(getOnlyActivity(updated).activityId, "ca-1", "activity conservee");
  assertEqual(updated.moments[0]?.activities.length, 1, "activities.length");
});

test("builderDraftOps: addTask ignore un doublon de tache dans la meme activite", () => {
  const base = makeBaseDraft();
  const catalogTask = assertNotNull(base.catalog.tasks[0], "catalog task");

  const once = addTask(base, "pm-1", "pma-1", catalogTask);
  const twice = addTask(once, "pm-1", "pma-1", catalogTask);

  assertEqual(getOnlyActivity(twice).tasks.length, 1, "tasks.length");
});

test("builderDraftOps: syncDraftCatalog met a jour les choix catalogue sans perdre le draft", () => {
  const base = makeBaseDraft();
  const catalogTask = assertNotNull(base.catalog.tasks[0], "catalog task");
  const withTask = addTask(base, "pm-1", "pma-1", catalogTask);

  const updated = syncDraftCatalog(withTask, {
    moments: [
      {
        id: "cm-1",
        name: "Matin actualise",
        kind: "morning",
        label: "Matin actualise",
        defaultStars: 0,
        sortIndex: 0,
      },
      {
        id: "cm-2",
        name: "Soir",
        kind: "evening",
        label: "Soir",
        defaultStars: 0,
        sortIndex: 1,
      },
    ],
    activities: [
      {
        id: "ca-1",
        name: "Se laver",
        label: "Se laver",
        icon: "wash",
        defaultStars: 0,
        sortIndex: 0,
      },
    ],
    tasks: [
      {
        id: "ct-1",
        name: "Mettre le dentifrice",
        label: "Mettre le dentifrice",
        defaultStars: 3,
        sortIndex: 0,
      },
      {
        id: "ct-2",
        name: "Ranger le pyjama",
        label: "Ranger le pyjama",
        defaultStars: 1,
        sortIndex: 1,
      },
    ],
  });

  assertEqual(updated.catalog.tasks.length, 2, "catalog.tasks.length");
  assertEqual(updated.moments[0]?.momentName, "Matin actualise", "momentName");
  assertEqual(updated.moments[0]?.activities[0]?.activityName, "Se laver", "activityName");
  assertEqual(updated.moments[0]?.activities[0]?.activityIcon, "wash", "activityIcon");
  assertEqual(updated.moments[0]?.activities[0]?.tasks[0]?.taskName, "Mettre le dentifrice", "taskName");
  assertEqual(updated.moments[0]?.activities[0]?.tasks.length, 1, "draft tasks preserved");
});

test("builderDraftOps: updateActivityStars bloque si tasks, autorise sans tasks", () => {
  const base = makeBaseDraft();
  const catalogTask = assertNotNull(base.catalog.tasks[0], "catalog task");

  const withTask = addTask(base, "pm-1", "pma-1", catalogTask);
  const blocked = updateActivityStars(withTask, "pm-1", "pma-1", 9);
  assertEqual(getOnlyActivity(blocked).stars, 0, "activity.stars bloque");

  const taskLinkId = assertNotNull(getOnlyActivity(withTask).tasks[0], "task to remove").linkId;
  const withoutTask = removeTask(withTask, "pm-1", "pma-1", taskLinkId);
  const updated = updateActivityStars(withoutTask, "pm-1", "pma-1", 9);
  assertEqual(getOnlyActivity(updated).tasks.length, 0, "tasks supprimees");
  assertEqual(getOnlyActivity(updated).stars, 9, "activity.stars autorise");
});

test("builderDraftOps: updateActivitySticker set puis remplace", () => {
  const base = makeBaseDraft();
  const withSticker = updateActivitySticker(base, "pm-1", "pma-1", "renard");
  assertEqual(getOnlyActivity(withSticker).stickerKey, "renard", "activity.stickerKey set");

  const replaced = updateActivitySticker(withSticker, "pm-1", "pma-1", "koala");
  assertEqual(getOnlyActivity(replaced).stickerKey, "koala", "activity.stickerKey replace");
});

test("builderValidation: draft invalide remonte les 3 regles", () => {
  const draft: ProfileRoutineDraft = {
    ...makeBaseDraft(),
    moments: [
      {
        linkId: "pm-1",
        momentId: "cm-1",
        momentName: "Matin",
        stars: 0,
        sortIndex: 0,
        activities: [
          {
            linkId: "pma-a",
            activityId: "ca-1",
            activityName: "Activite sans tache invalide",
            activityIcon: null,
            stars: 0,
            stickerKey: "panda",
            sortIndex: 0,
            tasks: [],
          },
          {
            linkId: "pma-b",
            activityId: "ca-2",
            activityName: "Activite avec taches invalide",
            activityIcon: null,
            stars: 2,
            stickerKey: "koala",
            sortIndex: 1,
            tasks: [
              {
                linkId: "pmat-1",
                taskId: "ct-1",
                taskName: "Task invalide",
                stars: 0,
                sortIndex: 0,
              },
              {
                linkId: "pmat-2",
                taskId: "ct-2",
                taskName: "Task valide",
                stars: 2,
                sortIndex: 1,
              },
            ],
          },
        ],
      },
    ],
  };

  const errors = validateProfileRoutineDraft(draft);
  assertEqual(errors.length, 3, "errors.length");
  assertTruthy(
    errors.some((e) => e.code === "activity_without_tasks_stars_required"),
    "code activity_without_tasks_stars_required"
  );
  assertTruthy(
    errors.some((e) => e.code === "activity_with_tasks_stars_must_be_zero"),
    "code activity_with_tasks_stars_must_be_zero"
  );
  assertTruthy(
    errors.some((e) => e.code === "task_stars_required"),
    "code task_stars_required"
  );
});

test("builderValidation: draft valide passe sans erreur", () => {
  const draft: ProfileRoutineDraft = {
    ...makeBaseDraft(),
    moments: [
      {
        linkId: "pm-1",
        momentId: "cm-1",
        momentName: "Matin",
        stars: 0,
        sortIndex: 0,
        activities: [
          {
            linkId: "pma-a",
            activityId: "ca-1",
            activityName: "Activite simple valide",
            activityIcon: null,
            stars: 1,
            stickerKey: "panda",
            sortIndex: 0,
            tasks: [],
          },
          {
            linkId: "pma-b",
            activityId: "ca-2",
            activityName: "Activite avec taches valide",
            activityIcon: null,
            stars: 0,
            stickerKey: "koala",
            sortIndex: 1,
            tasks: [
              {
                linkId: "pmat-1",
                taskId: "ct-1",
                taskName: "Task 1",
                stars: 1,
                sortIndex: 0,
              },
              {
                linkId: "pmat-2",
                taskId: "ct-2",
                taskName: "Task 2",
                stars: 2,
                sortIndex: 1,
              },
            ],
          },
        ],
      },
    ],
  };

  const errors = validateProfileRoutineDraft(draft);
  assertEqual(errors.length, 0, "errors.length");
});

test("builderValidation: detecte les doublons de moment, activite et tache", () => {
  const draft: ProfileRoutineDraft = {
    ...makeBaseDraft(),
    moments: [
      {
        linkId: "pm-1",
        momentId: "cm-1",
        momentName: "Matin",
        stars: 0,
        sortIndex: 0,
        activities: [
          {
            linkId: "pma-1",
            activityId: "ca-1",
            activityName: "Se preparer",
            activityIcon: null,
            stars: 0,
            stickerKey: "panda",
            sortIndex: 0,
            tasks: [
              {
                linkId: "pmat-1",
                taskId: "ct-1",
                taskName: "Brosser les dents",
                stars: 1,
                sortIndex: 0,
              },
              {
                linkId: "pmat-2",
                taskId: "ct-1",
                taskName: "Brosser les dents",
                stars: 1,
                sortIndex: 1,
              },
            ],
          },
          {
            linkId: "pma-2",
            activityId: "ca-1",
            activityName: "Se preparer",
            activityIcon: null,
            stars: 1,
            stickerKey: "koala",
            sortIndex: 1,
            tasks: [],
          },
        ],
      },
      {
        linkId: "pm-2",
        momentId: "cm-1",
        momentName: "Matin",
        stars: 0,
        sortIndex: 1,
        activities: [],
      },
    ],
  };

  const errors = validateProfileRoutineDraft(draft);

  assertTruthy(
    errors.some((error) => error.code === "duplicate_moment"),
    "code duplicate_moment"
  );
  assertTruthy(
    errors.some((error) => error.code === "duplicate_activity_in_moment"),
    "code duplicate_activity_in_moment"
  );
  assertTruthy(
    errors.some((error) => error.code === "duplicate_task_in_activity"),
    "code duplicate_task_in_activity"
  );
});

test("routineMapper: conserve pending sticker Builder et ignore sticker runtime activite", () => {
  const vm = buildHomeRoutineVm({
    profile: {
      id: "profile-1",
      name: "Lina",
      primary_color: "#102030",
      secondary_color: "#405060",
      balance: 12,
    },
    profileMomentRows: [
      {
        id: "pm-1",
        stars: 0,
        sort_index: 0,
        moments: {
          id: "m-1",
          name: "Matin",
          kind: "morning",
          label: null,
          sort_index: 0,
        },
        profile_moment_activities: [
          {
            id: "pma-1",
            stars: 4,
            sticker_key: "renard",
            sort_index: 0,
            activities: {
              id: "a-1",
              name: "Lecture",
              label: null,
              icon: null,
              sort_index: 0,
            },
            profile_moment_activity_tasks: [],
          },
        ],
      },
    ],
    checks: [
      {
        target_type: "activity",
        profile_moment_activity_id: "pma-1",
        profile_moment_activity_task_id: null,
        checked: true,
        sticker_key: "panda",
        stars_earned: 4,
      },
    ],
    validation: null,
  });

  const moment = assertNotNull(vm.moments[0], "moment");
  const activity = assertNotNull(moment.activities[0], "activity");
  assertEqual(activity.pendingStickerKey, "renard", "pendingStickerKey");
  assertEqual(activity.checked, true, "activity.checked");
  assertEqual(vm.todayStars, 4, "todayStars");
  assertEqual(vm.totalItems, 1, "totalItems");
  assertEqual(vm.totalCompleted, 1, "totalCompleted");
});

let passed = 0;

for (const t of tests) {
  try {
    t.run();
    passed += 1;
    console.log(`PASS ${t.name}`);
  } catch (err) {
    console.error(`FAIL ${t.name}`);
    if (err instanceof Error) {
      console.error(err.message);
    } else {
      console.error(String(err));
    }
    process.exit(1);
  }
}

console.log(`OK ${passed} test(s) passes`);
