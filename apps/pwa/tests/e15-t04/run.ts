import { cloneRoutineDraftForProfile } from "../../src/features/catalog/services/profileRoutineClone";
import { buildHomeRoutinePrintHtml } from "../../src/features/home/services/homeRoutinePrintHtml";
import type { ProfileRoutineDraft } from "../../src/features/catalog/types";
import type { ChildProfile } from "../../src/features/profiles/types";
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
    fail(`${label}: attendu=${String(expected)} recu=${String(actual)}`);
  }
}

function assertNotEqual<T>(actual: T, expected: T, label: string): void {
  if (actual === expected) {
    fail(`${label}: valeurs attendues differentes`);
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

function makeRoutineDraft(): ProfileRoutineDraft {
  return {
    profileId: "source-profile",
    catalog: {
      moments: [
        {
          id: "moment-morning",
          name: "Matin",
          kind: "morning",
          label: "Matin",
          defaultStars: 0,
          sortIndex: 0,
        },
        {
          id: "moment-evening",
          name: "Soir",
          kind: "evening",
          label: "Soir",
          defaultStars: 0,
          sortIndex: 1,
        },
      ],
      activities: [
        {
          id: "activity-prepare",
          name: "Se preparer",
          label: "Se preparer",
          icon: "wash",
          defaultStars: 0,
          sortIndex: 0,
        },
        {
          id: "activity-read",
          name: "Lecture",
          label: "Lecture",
          icon: null,
          defaultStars: 4,
          sortIndex: 1,
        },
      ],
      tasks: [
        {
          id: "task-teeth",
          name: "Brosser les dents",
          label: "Brosser les dents",
          defaultStars: 2,
          sortIndex: 0,
        },
        {
          id: "task-pajamas",
          name: "Ranger le pyjama",
          label: "Ranger le pyjama",
          defaultStars: 1,
          sortIndex: 1,
        },
      ],
    },
    moments: [
      {
        linkId: "pm-source-2",
        momentId: "moment-evening",
        momentName: "Soir",
        stars: 0,
        sortIndex: 7,
        activities: [
          {
            linkId: "pma-source-2",
            activityId: "activity-read",
            activityName: "Lecture",
            activityIcon: null,
            stars: 4,
            stickerKey: "panda",
            sortIndex: 4,
            tasks: [],
          },
        ],
      },
      {
        linkId: "pm-source-1",
        momentId: "moment-morning",
        momentName: "Matin",
        stars: 0,
        sortIndex: 9,
        activities: [
          {
            linkId: "pma-source-1",
            activityId: "activity-prepare",
            activityName: "Se preparer",
            activityIcon: "wash",
            stars: 0,
            stickerKey: "koala",
            sortIndex: 3,
            tasks: [
              {
                linkId: "pmat-source-1",
                taskId: "task-teeth",
                taskName: "Brosser les dents",
                stars: 2,
                sortIndex: 6,
              },
              {
                linkId: "pmat-source-2",
                taskId: "task-pajamas",
                taskName: "Ranger le pyjama",
                stars: 1,
                sortIndex: 8,
              },
            ],
          },
        ],
      },
    ],
  };
}

function makeChildProfile(): ChildProfile {
  return {
    id: "profile-1",
    userId: "user-1",
    name: "Zoé & Tom",
    primaryColor: "#336699",
    secondaryColor: "#FFCC00",
    stickerKey: "panda",
    balance: 12,
    sortIndex: 0,
    createdAt: "2026-06-02T00:00:00.000Z",
  };
}

function makeHomeRoutine(): HomeRoutineVM {
  return {
    profileId: "profile-1",
    profileName: "Zoé & Tom",
    colors: {
      primaryBase: "#336699",
      primaryPastel: "#D6E2EE",
      secondaryBase: "#FFCC00",
      secondaryPastel: "#FFF0B8",
    },
    balance: 12,
    todayStars: 5,
    totalCompleted: 2,
    totalItems: 3,
    progressPercent: 67,
    isDayValidated: false,
    moments: [
      {
        id: "moment-morning",
        pivotId: "pm-1",
        kind: "morning",
        name: "Matin <script>",
        stars: 0,
        checked: false,
        completedActivities: 1,
        totalActivities: 2,
        completedTasks: 1,
        totalTasks: 2,
        activities: [
          {
            id: "activity-prepare",
            pivotId: "pma-1",
            name: "Se préparer & sourire",
            stars: 3,
            checked: false,
            pendingStickerKey: "koala",
            completedTasks: 1,
            totalTasks: 2,
            tasks: [
              {
                id: "task-teeth",
                pivotId: "pmat-1",
                name: "Brosser les dents",
                stars: 2,
                checked: true,
                stickerKey: "lion",
              },
              {
                id: "task-pajamas",
                pivotId: "pmat-2",
                name: "Ranger le pyjama",
                stars: 1,
                checked: false,
                stickerKey: null,
              },
            ],
          },
          {
            id: "activity-read",
            pivotId: "pma-2",
            name: "Lecture",
            stars: 2,
            checked: true,
            pendingStickerKey: "panda",
            completedTasks: 0,
            totalTasks: 0,
            tasks: [],
          },
        ],
      },
    ],
  };
}

test("cloneRoutineDraftForProfile: remplace le profileId et conserve le contenu metier", () => {
  const source = makeRoutineDraft();
  const cloned = cloneRoutineDraftForProfile(source, "target-profile");

  assertEqual(cloned.profileId, "target-profile", "profileId cible");
  assertEqual(cloned.moments.length, 2, "moments.length");
  assertEqual(cloned.moments[0]?.momentId, "moment-evening", "moment[0].momentId");
  assertEqual(cloned.moments[0]?.activities[0]?.activityId, "activity-read", "activity simple conservee");
  assertEqual(cloned.moments[0]?.activities[0]?.stars, 4, "activity simple stars");
  assertEqual(cloned.moments[0]?.activities[0]?.stickerKey, "panda", "activity simple sticker");
  assertEqual(cloned.moments[1]?.activities[0]?.tasks[1]?.taskId, "task-pajamas", "taskId conserve");
  assertEqual(cloned.moments[1]?.activities[0]?.tasks[1]?.stars, 1, "task stars conservees");
});

test("cloneRoutineDraftForProfile: genere des IDs de pivots neufs", () => {
  const source = makeRoutineDraft();
  const cloned = cloneRoutineDraftForProfile(source, "target-profile");

  const sourceMoment = assertNotNull(source.moments[0], "source moment");
  const clonedMoment = assertNotNull(cloned.moments[0], "cloned moment");
  const sourceActivity = assertNotNull(source.moments[1]?.activities[0], "source activity");
  const clonedActivity = assertNotNull(cloned.moments[1]?.activities[0], "cloned activity");
  const sourceTask = assertNotNull(sourceActivity.tasks[0], "source task");
  const clonedTask = assertNotNull(clonedActivity.tasks[0], "cloned task");

  assertTruthy(clonedMoment.linkId.startsWith("draft:moment:"), "moment link draft");
  assertTruthy(clonedActivity.linkId.startsWith("draft:activity:"), "activity link draft");
  assertTruthy(clonedTask.linkId.startsWith("draft:task:"), "task link draft");
  assertNotEqual(clonedMoment.linkId, sourceMoment.linkId, "moment linkId neuf");
  assertNotEqual(clonedActivity.linkId, sourceActivity.linkId, "activity linkId neuf");
  assertNotEqual(clonedTask.linkId, sourceTask.linkId, "task linkId neuf");
});

test("cloneRoutineDraftForProfile: reindexe selon l'ordre du draft source", () => {
  const cloned = cloneRoutineDraftForProfile(makeRoutineDraft(), "target-profile");

  assertEqual(cloned.moments[0]?.sortIndex, 0, "moment[0].sortIndex");
  assertEqual(cloned.moments[1]?.sortIndex, 1, "moment[1].sortIndex");
  assertEqual(cloned.moments[1]?.activities[0]?.sortIndex, 0, "activity sortIndex");
  assertEqual(cloned.moments[1]?.activities[0]?.tasks[0]?.sortIndex, 0, "task[0].sortIndex");
  assertEqual(cloned.moments[1]?.activities[0]?.tasks[1]?.sortIndex, 1, "task[1].sortIndex");
});

test("buildHomeRoutinePrintHtml: rend la Home enfant et echappe le HTML", () => {
  const html = buildHomeRoutinePrintHtml({
    routine: makeHomeRoutine(),
    profile: makeChildProfile(),
    getStickerWebUri: (key) => `/stickers/${key}.png`,
  });

  assertTruthy(html.includes("Routine de Zoé &amp; Tom"), "profileName echappe");
  assertTruthy(html.includes("Matin &lt;script&gt;"), "momentName echappe");
  assertTruthy(html.includes("Se préparer &amp; sourire"), "activityName echappe");
  assertTruthy(html.includes("Progression de la journée"), "progress title");
  assertTruthy(html.includes("2/3 · 67%"), "progress value");
  assertTruthy(html.includes("Tirelire : 12"), "balance");
  assertTruthy(html.includes("Routines : 5"), "todayStars");
  assertTruthy(html.includes("Brosser les dents"), "task checked");
  assertTruthy(html.includes("Ranger le pyjama"), "task todo");
  assertTruthy(html.includes("src=\"/stickers/panda.png\""), "profile/activity sticker uri");
  assertTruthy(html.includes("src=\"/stickers/koala.png\""), "activity sticker uri");
});

test("buildHomeRoutinePrintHtml: rend un etat vide imprimable", () => {
  const html = buildHomeRoutinePrintHtml({
    routine: { ...makeHomeRoutine(), moments: [], totalCompleted: 0, totalItems: 0, progressPercent: 0 },
    profile: { ...makeChildProfile(), name: "Lina" },
    getStickerWebUri: () => null,
  });

  assertTruthy(html.includes("Aucune routine configurée pour ce profil."), "empty routine");
  assertTruthy(html.includes("@page { size: A4; margin: 12mm; }"), "format A4");
  assertTruthy(html.includes("sticker-fallback"), "sticker fallback");
});

let failures = 0;
for (const currentTest of tests) {
  try {
    currentTest.run();
    console.log(`OK ${currentTest.name}`);
  } catch (error) {
    failures++;
    console.error(`FAIL ${currentTest.name}`);
    console.error(error instanceof Error ? error.message : error);
  }
}

if (failures > 0) {
  fail(`${failures} test(s) ont echoue`);
}

console.log(`OK ${tests.length} test(s) passes`);
