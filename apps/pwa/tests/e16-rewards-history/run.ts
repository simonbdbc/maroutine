import {
  resolveHistoryPeriod,
  shiftHistoryPeriod,
  startOfMonth,
  startOfWeek,
} from "../../src/features/rewards/services/historyPeriod";
import {
  canRedeemReward,
  parsePositiveIntegerDraft,
} from "../../src/features/rewards/services/rewardValidation";
import { groupBalanceHistoryByProfile } from "../../src/features/rewards/services/historyMapping";
import type { BalanceHistoryEntry } from "../../src/features/rewards/types";
import {
  buildCanonicalAppUrl,
  buildCanonicalUrlForCurrentLocation,
} from "../../src/shared/pwa/domainRedirect";
import {
  isNativeInstallPromptAvailable,
  isPwaInstalled,
  resolveInstallPlatform,
} from "../../src/shared/pwa/installState";
import {
  buildVersionCheckUrl,
  hasAppVersionChanged,
  parseAppVersionPayload,
} from "../../src/shared/pwa/versionCheck";

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

function isoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

test("historyPeriod: startOfWeek utilise le lundi", () => {
  assertEqual(isoDate(startOfWeek(new Date(2026, 5, 3))), "2026-06-01", "mercredi");
  assertEqual(isoDate(startOfWeek(new Date(2026, 5, 7))), "2026-06-01", "dimanche");
});

test("historyPeriod: startOfMonth retourne le premier jour", () => {
  assertEqual(isoDate(startOfMonth(new Date(2026, 5, 28))), "2026-06-01", "mois");
});

test("historyPeriod: resolve + shift semaine", () => {
  const period = resolveHistoryPeriod("week", new Date(2026, 5, 3));
  assertEqual(isoDate(period.start), "2026-06-01", "start");
  assertEqual(isoDate(period.end), "2026-06-08", "end");

  const previous = shiftHistoryPeriod(period, -1);
  assertEqual(isoDate(previous.start), "2026-05-25", "previous.start");
  assertEqual(isoDate(previous.end), "2026-06-01", "previous.end");
});

test("historyPeriod: resolve + shift mois", () => {
  const period = resolveHistoryPeriod("month", new Date(2026, 5, 3));
  assertEqual(isoDate(period.start), "2026-06-01", "start");
  assertEqual(isoDate(period.end), "2026-07-01", "end");

  const next = shiftHistoryPeriod(period, 1);
  assertEqual(isoDate(next.start), "2026-07-01", "next.start");
  assertEqual(isoDate(next.end), "2026-08-01", "next.end");
});

test("rewardValidation: parsePositiveIntegerDraft", () => {
  assertEqual(parsePositiveIntegerDraft("15"), 15, "simple");
  assertEqual(parsePositiveIntegerDraft(" 8 "), 8, "trim");
  assertEqual(parsePositiveIntegerDraft("0"), null, "zero");
  assertEqual(parsePositiveIntegerDraft("-1"), null, "negative");
  assertEqual(parsePositiveIntegerDraft("1.5"), null, "decimal");
});

test("rewardValidation: canRedeemReward", () => {
  assertEqual(canRedeemReward(10, 10), true, "equal");
  assertEqual(canRedeemReward(11, 10), true, "more");
  assertEqual(canRedeemReward(9, 10), false, "less");
  assertEqual(canRedeemReward(10, 0), false, "zero cost");
});

test("historyMapping: groupe par profil en conservant l'ordre", () => {
  const entries: BalanceHistoryEntry[] = [
    makeHistoryEntry("h1", "p1", "Zoé", 4),
    makeHistoryEntry("h2", "p2", "Tom", -3),
    makeHistoryEntry("h3", "p1", "Zoé", -1),
  ];

  const groups = groupBalanceHistoryByProfile(entries);
  assertEqual(groups.length, 2, "groups.length");
  assertEqual(groups[0]?.profileId, "p1", "group 0 profile");
  assertEqual(groups[0]?.entries.length, 2, "group 0 entries");
  assertEqual(groups[0]?.entries[1]?.id, "h3", "group 0 order");
  assertEqual(groups[1]?.profileId, "p2", "group 1 profile");
});

test("pwaVersion: parse payload valide et rejette les payloads invalides", () => {
  const payload = parseAppVersionPayload({ version: " 2.01.2 ", build: " 2026-06-15 " });
  assertEqual(payload?.version, "2.01.2", "version");
  assertEqual(payload?.build, "2026-06-15", "build");
  assertEqual(parseAppVersionPayload({ version: "" }), null, "empty");
  assertEqual(parseAppVersionPayload({ build: "2026-06-02" }), null, "missing");
});

test("pwaVersion: detecte une version distante differente", () => {
  assertEqual(hasAppVersionChanged("2.01.1", "2.01.1"), false, "same");
  assertEqual(hasAppVersionChanged("2.01.1", "2.01.2"), true, "different");
  assertEqual(hasAppVersionChanged("2.1.2", "2.01.2"), true, "leading zero scale");
  assertEqual(buildVersionCheckUrl(1234), "/app/version.json?ts=1234", "url");
});

test("pwaDomain: conserve path query hash vers le domaine canonique", () => {
  assertEqual(
    buildCanonicalAppUrl("https://maroutine.sbcenter.fr/profiles?x=1#top"),
    "https://maroutine.app/app/profiles?x=1#top",
    "legacy",
  );
  assertEqual(
    buildCanonicalAppUrl("https://maroutine.app/app/profiles?x=1#top"),
    null,
    "canonical",
  );
  assertEqual(
    buildCanonicalUrlForCurrentLocation("http://127.0.0.1:4173/install?x=1#top"),
    "https://maroutine.app/app/install?x=1#top",
    "non canonical banner url",
  );
  assertEqual(
    buildCanonicalUrlForCurrentLocation("https://maroutine.app/app/install?x=1#top"),
    null,
    "canonical banner hidden",
  );
});

test("pwaInstall: detecte l'etat installe et le fallback prompt", () => {
  assertEqual(isPwaInstalled({ displayModeStandalone: true }), true, "display-mode");
  assertEqual(isPwaInstalled({ standalone: true }), true, "ios standalone");
  assertEqual(isPwaInstalled({}), false, "not installed");
  assertEqual(isNativeInstallPromptAvailable({}, false), true, "prompt available");
  assertEqual(isNativeInstallPromptAvailable(null, false), false, "prompt missing");
  assertEqual(isNativeInstallPromptAvailable({}, true), false, "already installed");
});

test("pwaInstall: classe les plateformes d'installation", () => {
  assertEqual(
    resolveInstallPlatform({
      platform: "iPhone",
      userAgent: "Mozilla/5.0 iPhone Version/17.0 Mobile Safari/604.1",
      vendor: "Apple Computer, Inc.",
    }),
    "ios-safari",
    "ios safari",
  );
  assertEqual(
    resolveInstallPlatform({
      platform: "iPhone",
      userAgent: "Mozilla/5.0 iPhone CriOS/120.0 Mobile Safari/604.1",
      vendor: "Google Inc.",
    }),
    "ios-limited",
    "ios chrome",
  );
  assertEqual(
    resolveInstallPlatform({ userAgent: "Mozilla/5.0 Android Chrome/120.0" }),
    "android",
    "android",
  );
});

function makeHistoryEntry(
  id: string,
  profileId: string,
  profileName: string,
  deltaStars: number
): BalanceHistoryEntry {
  return {
    id,
    profileId,
    profileName,
    deltaStars,
    balanceBefore: 10,
    balanceAfter: 10 + deltaStars,
    source: deltaStars > 0 ? "daily_validation" : "reward_redemption",
    description: "Mouvement",
    occurredAt: "2026-06-02T10:00:00.000Z",
  };
}

for (const item of tests) {
  try {
    item.run();
    console.log(`✓ ${item.name}`);
  } catch (error) {
    console.error(`✗ ${item.name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}
