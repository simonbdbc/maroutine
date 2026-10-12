import { Colors } from "../../../shared/theme";
import { withAlpha } from "../../../shared/utils/colorUtils";
import type { ChildProfile } from "../../profiles/types";
import type { ActivityVM, HomeRoutineVM, MomentVM, TaskVM } from "../types";

export type StickerWebUriResolver = (stickerKey: string) => string | null;

export type HomeRoutinePrintHtmlInput = {
  routine: HomeRoutineVM;
  profile: ChildProfile;
  getStickerWebUri?: StickerWebUriResolver;
};

const STAR_ICON_PATH =
  "M12 1.764L13.821 7.61L19.284 4.716L16.39 10.179L22.217 12L16.39 13.821L19.284 19.284L13.821 16.39L12 22.217L10.179 16.39L4.716 19.284L7.61 13.821L1.764 12L7.61 10.179L4.716 4.716L10.179 7.61L12 1.764ZM12 9.211A2.789 2.789 0 1 0 12 14.789A2.789 2.789 0 1 0 12 9.211Z";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char] ?? char;
  });
}

function renderStarIconHtml(className = "star-icon"): string {
  return `<svg class="${className}" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><path fill="${Colors.black}" fill-rule="evenodd" d="${STAR_ICON_PATH}"/></svg>`;
}

function renderStarsHtml(stars: number): string {
  return `<span class="stars-value"><span>${stars}</span>${renderStarIconHtml()}</span>`;
}

function renderStickerHtml(
  stickerKey: string,
  alt: string,
  getStickerWebUri?: StickerWebUriResolver
): string {
  const uri = getStickerWebUri?.(stickerKey);
  if (!uri) {
    return `<span class="sticker-fallback">${renderStarIconHtml("sticker-fallback-icon")}</span>`;
  }

  return `<img class="sticker-img" src="${escapeHtml(uri)}" alt="${escapeHtml(alt)}" />`;
}

function renderTask(task: TaskVM): string {
  return `
    <li class="task-row">
      <span class="task-label">${escapeHtml(task.name)}</span>
      <strong>${renderStarsHtml(task.stars)}</strong>
    </li>
  `;
}

function renderActivity(activity: ActivityVM, getStickerWebUri?: StickerWebUriResolver): string {
  const hasTasks = activity.tasks.length > 0;
  const subtitle = hasTasks ? `${activity.totalTasks} tâches` : "Activité simple";
  const tasksHtml = hasTasks
    ? `<ul class="task-list">${activity.tasks.map(renderTask).join("")}</ul>`
    : "";

  return `
    <article class="activity-card">
      <div class="activity-main">
        <div class="activity-status done">✓</div>
        <div class="activity-text">
          <h3>${escapeHtml(activity.name)}</h3>
          <p>${escapeHtml(subtitle)}</p>
        </div>
        <div class="activity-sticker">
          ${renderStickerHtml(activity.pendingStickerKey, `Sticker ${activity.name}`, getStickerWebUri)}
          <strong>${renderStarsHtml(activity.stars)}</strong>
        </div>
      </div>
      ${tasksHtml}
    </article>
  `;
}

function renderMoment(moment: MomentVM, getStickerWebUri?: StickerWebUriResolver): string {
  if (moment.activities.length === 0) {
    return "";
  }

  return `
    <section class="moment-card">
      <header class="moment-header">
        <div class="moment-title">
          <span aria-hidden="true">📋</span>
          <h2>${escapeHtml(moment.name)}</h2>
        </div>
      </header>
      <div class="moment-body">
        ${moment.activities.map((activity) => renderActivity(activity, getStickerWebUri)).join("")}
      </div>
    </section>
  `;
}

export function buildHomeRoutinePrintHtml({
  routine,
  profile,
  getStickerWebUri,
}: HomeRoutinePrintHtmlInput): string {
  const hasContent = routine.moments.some((moment) => moment.activities.length > 0);
  const safeName = escapeHtml(routine.profileName || profile.name);
  const profileSticker = renderStickerHtml(
    profile.stickerKey,
    `Sticker ${profile.name}`,
    getStickerWebUri
  );
  const momentsHtml = routine.moments
    .map((moment) => renderMoment(moment, getStickerWebUri))
    .join("");

  return `
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <title>Routine de ${safeName}</title>
    <style>
      @page { size: A4; margin: 12mm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: ${Colors.black};
        font-family: Arial, Helvetica, sans-serif;
        background: ${Colors.white};
      }
      .home-print {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .home-header {
        background: ${routine.colors.primaryBase};
        border-radius: 18px;
        color: ${Colors.white};
        padding: 18px;
      }
      .header-row {
        align-items: center;
        display: flex;
        gap: 14px;
        justify-content: space-between;
      }
      .stats-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 14px;
      }
      .stat-pill {
        background: ${Colors.white};
        border-radius: 999px;
        color: ${Colors.black};
        font-size: 12px;
        font-weight: 700;
        padding: 7px 11px;
      }
      .profile-block {
        align-items: center;
        display: flex;
        gap: 12px;
        min-width: 0;
      }
      .profile-block h1 {
        font-size: 28px;
        line-height: 1.1;
        margin: 0;
      }
      .profile-sticker,
      .activity-sticker {
        align-items: center;
        display: flex;
        gap: 6px;
      }
      .profile-sticker {
        background: ${Colors.white};
        border: 3px solid ${routine.colors.secondaryBase};
        border-radius: 999px;
        height: 76px;
        justify-content: center;
        width: 76px;
      }
      .sticker-img {
        border-radius: 999px;
        display: block;
        height: 74px;
        object-fit: cover;
        width: 74px;
      }
      .sticker-fallback {
        align-items: center;
        background: ${routine.colors.secondaryPastel};
        border-radius: 999px;
        display: inline-flex;
        height: 74px;
        justify-content: center;
        width: 74px;
      }
      .star-icon {
        display: block;
        flex: 0 0 auto;
        height: 15px;
        width: 15px;
      }
      .stars-value {
        align-items: center;
        display: inline-flex;
        gap: 4px;
        white-space: nowrap;
      }
      .sticker-fallback-icon {
        display: block;
        height: 30px;
        width: 30px;
      }
      .moment-card {
        background: ${routine.colors.primaryPastel};
        border-radius: 14px;
        break-inside: avoid;
        overflow: hidden;
      }
      .moment-header {
        align-items: center;
        background: ${routine.colors.primaryBase};
        color: ${Colors.white};
        display: flex;
        justify-content: space-between;
        padding: 10px 12px;
      }
      .moment-title {
        align-items: center;
        display: flex;
        gap: 8px;
        min-width: 0;
      }
      .moment-title h2 {
        font-size: 18px;
        margin: 0;
      }
      .moment-body {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 10px;
      }
      .activity-card {
        background: ${Colors.white};
        border: 1px solid ${routine.colors.primaryPastel};
        border-radius: 12px;
        padding: 10px;
      }
      .activity-main {
        align-items: center;
        display: flex;
        gap: 10px;
      }
      .activity-status,
      .status {
        align-items: center;
        border-radius: 999px;
        display: inline-flex;
        font-weight: 700;
        justify-content: center;
      }
      .activity-status {
        border: 2px solid ${routine.colors.secondaryBase};
        height: 30px;
        width: 30px;
      }
      .activity-status.done,
      .status.done {
        background: ${routine.colors.secondaryPastel};
        color: ${routine.colors.primaryBase};
      }
      .activity-text {
        flex: 1;
        min-width: 0;
      }
      .activity-text h3 {
        font-size: 15px;
        margin: 0 0 3px;
      }
      .activity-text p {
        color: ${withAlpha(Colors.black, 0.72)};
        font-size: 12px;
        font-weight: 700;
        margin: 0;
      }
      .activity-sticker .sticker-img,
      .activity-sticker .sticker-fallback {
        height: 56px;
        width: 56px;
      }
      .activity-sticker {
        gap: 18px;
      }
      .activity-sticker .star-icon {
        height: 24px;
        width: 24px;
      }
      .activity-sticker .sticker-fallback {
        align-items: center;
        display: inline-flex;
        justify-content: center;
      }
      .activity-sticker .sticker-fallback-icon {
        height: 24px;
        width: 24px;
      }
      .task-list {
        display: flex;
        flex-direction: column;
        gap: 5px;
        list-style: none;
        margin: 8px 0 0 40px;
        padding: 0;
      }
      .task-row {
        align-items: center;
        background: ${withAlpha(Colors.white, 0.6)};
        border: 1px solid ${withAlpha(Colors.white, 0.4)};
        border-radius: 10px;
        display: flex;
        gap: 8px;
        min-height: 28px;
        padding: 6px 8px;
      }
      .task-label {
        flex: 1;
        min-width: 0;
      }
      .status {
        border: 1px solid ${routine.colors.secondaryBase};
        font-size: 11px;
        padding: 3px 7px;
        white-space: nowrap;
      }
      .empty {
        border: 1px dashed ${routine.colors.primaryBase};
        border-radius: 14px;
        color: ${withAlpha(Colors.black, 0.72)};
        font-weight: 700;
        padding: 24px;
        text-align: center;
      }
      @media print {
        body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      }
    </style>
  </head>
  <body>
    <main class="home-print">
      <section class="home-header">
        <div class="header-row">
          <div class="profile-block">
            <div class="profile-sticker">${profileSticker}</div>
            <h1>${safeName}</h1>
          </div>
        </div>
        <div class="stats-row">
          <span class="stat-pill">Progression de la journée</span>
          <span class="stat-pill">${routine.totalCompleted}/${routine.totalItems} · ${routine.progressPercent}%</span>
          <span class="stat-pill">Tirelire : ${routine.balance}</span>
          <span class="stat-pill">Routines : ${routine.todayStars}</span>
        </div>
      </section>
      ${hasContent ? momentsHtml : `<section class="empty">Aucune routine configurée pour ce profil.</section>`}
    </main>
  </body>
</html>`;
}
