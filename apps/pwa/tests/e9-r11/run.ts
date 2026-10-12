import { applyOptimisticToggle, findToggleCurrentChecked, recomputeRoutineAggregates } from "../../src/features/home/services/homeOptimisticPatch";
import { buildHomeRoutineVm } from "../../src/features/home/services/routineMapper";
import type { HomeRoutineVM } from "../../src/features/home/types";

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

function findTask(vm: HomeRoutineVM, pivotTaskId: string) {
  for (const moment of vm.moments) {
    for (const activity of moment.activities) {
      const task = activity.tasks.find((candidate) => candidate.pivotId === pivotTaskId);
      if (task) {
        return task;
      }
    }
  }
  return null;
}

function findActivity(vm: HomeRoutineVM, pivotActivityId: string) {
  for (const moment of vm.moments) {
    const activity = moment.activities.find((candidate) => candidate.pivotId === pivotActivityId);
    if (activity) {
      return { moment, activity };
    }
  }
  return null;
}

function makeOptimisticFixture(): HomeRoutineVM {
  return recomputeRoutineAggregates({
    profileId: "profile-1",
    profileName: "Lina",
    colors: {
      primaryBase: "#112233",
      primaryPastel: "#CCD6E0",
      secondaryBase: "#445566",
      secondaryPastel: "#D9DDE0",
    },
    balance: 10,
    todayStars: 0,
    moments: [
      {
        id: "m-1",
        pivotId: "pm-1",
        kind: "morning",
        name: "Matin",
        stars: 5,
        checked: false,
        activities: [
          {
            id: "a-1",
            pivotId: "pma-1",
            name: "Se preparer",
            stars: 5,
            checked: false,
            pendingStickerKey: "koala",
            completedTasks: 0,
            totalTasks: 2,
            tasks: [
              {
                id: "t-1",
                pivotId: "pmat-1",
                name: "Laver les mains",
                stars: 2,
                checked: false,
                stickerKey: null,
              },
              {
                id: "t-2",
                pivotId: "pmat-2",
                name: "Brosser les dents",
                stars: 3,
                checked: false,
                stickerKey: null,
              },
            ],
          },
        ],
        completedActivities: 0,
        totalActivities: 1,
        completedTasks: 0,
        totalTasks: 2,
      },
      {
        id: "m-2",
        pivotId: "pm-2",
        kind: "evening",
        name: "Soir",
        stars: 4,
        checked: false,
        activities: [
          {
            id: "a-2",
            pivotId: "pma-2",
            name: "Lecture",
            stars: 4,
            checked: false,
            pendingStickerKey: "panda",
            tasks: [],
            completedTasks: 0,
            totalTasks: 0,
          },
        ],
        completedActivities: 0,
        totalActivities: 1,
        completedTasks: 0,
        totalTasks: 0,
      },
    ],
    totalCompleted: 0,
    totalItems: 0,
    progressPercent: 0,
    isDayValidated: false,
  });
}

test("homeOptimisticPatch: toggle task recalcule agregats et parent", () => {
  const base = makeOptimisticFixture();
  const updated = applyOptimisticToggle(base, {
    kind: "task",
    pivotTaskId: "pmat-1",
    checked: true,
    stickerKey: "lion",
  });

  const task = assertNotNull(findTask(updated, "pmat-1"), "task pmat-1");
  assertEqual(task.checked, true, "task.checked");
  assertEqual(task.stickerKey, "lion", "task.stickerKey");

  const located = assertNotNull(findActivity(updated, "pma-1"), "activity pma-1");
  assertEqual(located.activity.checked, false, "activity parent checked");
  assertEqual(located.activity.completedTasks, 1, "activity completedTasks");
  assertEqual(located.moment.checked, false, "moment parent checked");

  assertEqual(updated.totalItems, 3, "totalItems");
  assertEqual(updated.totalCompleted, 1, "totalCompleted");
  assertEqual(updated.todayStars, 2, "todayStars");
  assertEqual(updated.progressPercent, 33, "progressPercent");
});

test("homeOptimisticPatch: toggle activity avec taches cascade sur toutes les taches", () => {
  const base = makeOptimisticFixture();
  const updated = applyOptimisticToggle(base, {
    kind: "activity",
    pivotActivityId: "pma-1",
    checked: true,
  });

  const located = assertNotNull(findActivity(updated, "pma-1"), "activity pma-1");
  assertEqual(located.activity.checked, true, "activity.checked");
  assertEqual(located.activity.pendingStickerKey, "koala", "activity.pendingStickerKey");
  assertEqual(located.activity.tasks.every((task) => task.checked), true, "taches cochees");
  assertEqual(located.moment.checked, true, "moment.checked");

  assertEqual(updated.totalItems, 3, "totalItems");
  assertEqual(updated.totalCompleted, 2, "totalCompleted");
  assertEqual(updated.todayStars, 5, "todayStars");
  assertEqual(updated.progressPercent, 67, "progressPercent");
});

test("homeOptimisticPatch: toggle activity sans taches compte comme feuille", () => {
  const base = makeOptimisticFixture();
  const updated = applyOptimisticToggle(base, {
    kind: "activity",
    pivotActivityId: "pma-2",
    checked: true,
  });

  const located = assertNotNull(findActivity(updated, "pma-2"), "activity pma-2");
  assertEqual(located.activity.checked, true, "activity checked");
  assertEqual(located.activity.tasks.length, 0, "activity sans taches");
  assertEqual(updated.totalItems, 3, "totalItems");
  assertEqual(updated.totalCompleted, 1, "totalCompleted");
  assertEqual(updated.todayStars, 4, "todayStars");
  assertEqual(updated.progressPercent, 33, "progressPercent");
});

test("homeOptimisticPatch: findToggleCurrentChecked renvoie les etats attendus", () => {
  const base = makeOptimisticFixture();
  assertEqual(
    findToggleCurrentChecked(base, { kind: "task", pivotTaskId: "pmat-1" }),
    false,
    "task current checked"
  );
  assertEqual(
    findToggleCurrentChecked(base, { kind: "activity", pivotActivityId: "pma-2" }),
    false,
    "activity current checked"
  );
  assertEqual(
    findToggleCurrentChecked(base, { kind: "task", pivotTaskId: "missing" }),
    null,
    "unknown task checked"
  );
});

test("routineMapper: construit le VM avec regles feuilles et todayStars runtime", () => {
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
            stars: 0,
            sticker_key: null,
            sort_index: 0,
            activities: {
              id: "a-1",
              name: "Toilette",
              label: null,
              icon: null,
              sort_index: 0,
            },
            profile_moment_activity_tasks: [
              {
                id: "pmat-1",
                stars: 2,
                sort_index: 0,
                tasks: {
                  id: "t-1",
                  name: "Mains",
                  label: null,
                  sort_index: 0,
                },
              },
              {
                id: "pmat-2",
                stars: 3,
                sort_index: 1,
                tasks: {
                  id: "t-2",
                  name: "Dents",
                  label: null,
                  sort_index: 1,
                },
              },
            ],
          },
          {
            id: "pma-2",
            stars: 4,
            sticker_key: "bear",
            sort_index: 1,
            activities: {
              id: "a-2",
              name: "Lecture",
              label: null,
              icon: null,
              sort_index: 1,
            },
            profile_moment_activity_tasks: [],
          },
        ],
      },
      {
        id: "pm-2",
        stars: 0,
        sort_index: 1,
        moments: {
          id: "m-2",
          name: "Soir",
          kind: "evening",
          label: null,
          sort_index: 1,
        },
        profile_moment_activities: [
          {
            id: "pma-3",
            stars: 6,
            sticker_key: null,
            sort_index: 0,
            activities: {
              id: "a-3",
              name: "Ranger",
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
        target_type: "task",
        profile_moment_activity_id: "pma-1",
        profile_moment_activity_task_id: "pmat-1",
        checked: true,
        sticker_key: "lion",
        stars_earned: 5,
      },
      {
        target_type: "activity",
        profile_moment_activity_id: "pma-2",
        profile_moment_activity_task_id: null,
        checked: true,
        sticker_key: "fox",
        stars_earned: 4,
      },
      {
        target_type: "moment",
        profile_moment_activity_id: null,
        profile_moment_activity_task_id: null,
        checked: true,
        sticker_key: null,
        stars_earned: 0,
      },
    ],
    validation: null,
  });

  assertEqual(vm.totalItems, 4, "totalItems feuilles");
  assertEqual(vm.totalCompleted, 2, "totalCompleted feuilles");
  assertEqual(vm.progressPercent, 50, "progressPercent");
  assertEqual(vm.todayStars, 9, "todayStars runtime");
  assertEqual(vm.isDayValidated, false, "isDayValidated");
  assertEqual(vm.balance, 12, "balance");
  assertEqual(vm.colors.primaryBase, "#102030", "primary base");
  assertTruthy(vm.colors.secondaryPastel, "secondary pastel");

  const firstMoment = assertNotNull(vm.moments[0], "moment 0");
  const activityLeaf = assertNotNull(firstMoment.activities[1], "activity pma-2");
  assertEqual(activityLeaf.pendingStickerKey, "bear", "pending sticker from routine");

  assertEqual(vm.moments[0]?.stars ?? -1, 9, "moment 1 recap stars");
  assertEqual(vm.moments[1]?.stars ?? -1, 6, "moment 2 recap stars");
});

test("routineMapper: apres validation todayStars est override par earned_stars", () => {
  const vm = buildHomeRoutineVm({
    profile: {
      id: "profile-1",
      name: "Lina",
      primary_color: "#102030",
      secondary_color: "#405060",
      balance: 20,
    },
    profileMomentRows: [],
    checks: [],
    validation: {
      earned_stars: 8,
    },
  });

  assertEqual(vm.todayStars, 8, "todayStars validated");
  assertEqual(vm.isDayValidated, true, "isDayValidated true");
  assertEqual(vm.totalItems, 0, "totalItems empty");
  assertEqual(vm.progressPercent, 0, "progress empty");
});

test("routineMapper: trie moments activites et taches par sort_index", () => {
  const vm = buildHomeRoutineVm({
    profile: {
      id: "profile-1",
      name: "Lina",
      primary_color: "#102030",
      secondary_color: "#405060",
      balance: 7,
    },
    profileMomentRows: [
      {
        id: "pm-2",
        stars: 0,
        sort_index: 2,
        moments: {
          id: "m-2",
          name: "Soir",
          kind: "evening",
          label: null,
          sort_index: 2,
        },
        profile_moment_activities: [],
      },
      {
        id: "pm-1",
        stars: 0,
        sort_index: 1,
        moments: {
          id: "m-1",
          name: "Matin",
          kind: "morning",
          label: null,
          sort_index: 1,
        },
        profile_moment_activities: [
          {
            id: "pma-2",
            stars: 1,
            sticker_key: null,
            sort_index: 2,
            activities: {
              id: "a-2",
              name: "Habillage",
              label: null,
              icon: null,
              sort_index: 2,
            },
            profile_moment_activity_tasks: [
              {
                id: "pmat-2",
                stars: 1,
                sort_index: 2,
                tasks: {
                  id: "t-2",
                  name: "Chaussettes",
                  label: null,
                  sort_index: 2,
                },
              },
              {
                id: "pmat-1",
                stars: 1,
                sort_index: 1,
                tasks: {
                  id: "t-1",
                  name: "Pull",
                  label: null,
                  sort_index: 1,
                },
              },
            ],
          },
          {
            id: "pma-1",
            stars: 1,
            sticker_key: null,
            sort_index: 1,
            activities: {
              id: "a-1",
              name: "Toilette",
              label: null,
              icon: null,
              sort_index: 1,
            },
            profile_moment_activity_tasks: [],
          },
        ],
      },
    ],
    checks: [],
    validation: null,
  });

  assertEqual(vm.moments[0]?.pivotId ?? "", "pm-1", "moment trie 1");
  assertEqual(vm.moments[1]?.pivotId ?? "", "pm-2", "moment trie 2");
  assertEqual(vm.moments[0]?.activities[0]?.pivotId ?? "", "pma-1", "activity trie 1");
  assertEqual(vm.moments[0]?.activities[1]?.pivotId ?? "", "pma-2", "activity trie 2");
  assertEqual(
    vm.moments[0]?.activities[1]?.tasks[0]?.pivotId ?? "",
    "pmat-1",
    "task trie 1"
  );
  assertEqual(
    vm.moments[0]?.activities[1]?.tasks[1]?.pivotId ?? "",
    "pmat-2",
    "task trie 2"
  );
});

let failures = 0;
for (const currentTest of tests) {
  try {
    currentTest.run();
    console.log(`PASS ${currentTest.name}`);
  } catch (error) {
    failures += 1;
    const message = error instanceof Error ? error.message : String(error);
    console.error(`FAIL ${currentTest.name}`);
    console.error(message);
  }
}

if (failures > 0) {
  fail(`${failures} test(s) ont echoue`);
}

console.log(`OK ${tests.length} test(s) passes`);
