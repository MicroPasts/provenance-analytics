const CATEGORIES = [
  'production',
  'discovery',
  'provenance',
  'exhibition',
  'current_location',
];

const CATEGORY_BAR_CLASSES = {
  production: 'bg-purple-500',
  discovery: 'bg-amber-500',
  provenance: 'bg-indigo-500',
  exhibition: 'bg-sky-500',
  current_location: 'bg-emerald-500',
};

const ROLES = [
  'maker',
  'finder',
  'seller',
  'buyer',
  'dealer',
  'exhibitor',
  'keeper',
];

export function computeAnalyticsSummary(events) {
  const categoryCounts = {
    production: 0,
    discovery: 0,
    provenance: 0,
    exhibition: 0,
    current_location: 0,
  };

  const roleCounts = {
    maker: 0,
    finder: 0,
    seller: 0,
    buyer: 0,
    dealer: 0,
    exhibitor: 0,
    keeper: 0,
  };

  let namedActorCount = 0;
  let anonymousActorCount = 0;
  let totalGapYears = 0;

  for (const ev of events || []) {
    categoryCounts[ev.category] = (categoryCounts[ev.category] || 0) + 1;
    if (ev.hasGapBefore) totalGapYears += ev.gapYearsBefore || 0;

    for (const actor of ev.actors || []) {
      roleCounts[actor.role] = (roleCounts[actor.role] || 0) + 1;
      if (actor.isAnonymous) anonymousActorCount += 1;
      else namedActorCount += 1;
    }
  }

  const totalActors = namedActorCount + anonymousActorCount;
  const completenessScore =
    totalActors > 0 ? Math.round((namedActorCount / totalActors) * 100) : 100;

  const years = (events || [])
    .flatMap((e) => [e.startYear, e.endYear])
    .filter((y) => typeof y === 'number' && Number.isFinite(y));
  const documentedSpanYears =
    years.length >= 2 ? Math.max(0, Math.max(...years) - Math.min(...years)) : 0;

  return {
    totalEvents: (events || []).length,
    categoryCounts,
    roleCounts,
    completenessScore,
    namedActorCount,
    anonymousActorCount,
    totalGapYears,
    documentedSpanYears,
  };
}

export function renderBreakdown(container, events) {
  container.innerHTML = '';
  const summary = computeAnalyticsSummary(events);
  const total = Math.max(1, summary.totalEvents);

  const barSegments = CATEGORIES.map((cat) => {
    const count = summary.categoryCounts[cat];
    const pct = Math.round((count / total) * 100);
    const colorCls = CATEGORY_BAR_CLASSES[cat] || 'bg-indigo-500';
    return `<div class="${colorCls} h-full" style="width:${pct}%" title="${cat}: ${count} (${pct}%)"></div>`;
  }).join('');

  const catChips = CATEGORIES.filter((c) => summary.categoryCounts[c] > 0)
    .map((c) => {
      const dotCls = CATEGORY_BAR_CLASSES[c] || 'bg-indigo-500';
      return `<span class="inline-flex items-center gap-1.5 text-[11px] bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-full px-2.5 py-0.5"><span class="w-2 h-2 rounded-full ${dotCls}"></span>${c.replace('_', ' ')}: <strong class="font-semibold">${summary.categoryCounts[c]}</strong></span>`;
    })
    .join('');

  const roleChips = ROLES.filter((r) => summary.roleCounts[r] > 0)
    .map(
      (r) =>
        `<span class="inline-flex items-center gap-1 text-[11px] bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-full px-2.5 py-0.5">${r}: <strong class="font-semibold">${summary.roleCounts[r]}</strong></span>`
    )
    .join('');

  container.innerHTML = `
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2.5">
      <div class="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-lg px-3 py-2 flex flex-col">
        <span class="text-base font-bold text-slate-900 dark:text-slate-100">${summary.completenessScore}%</span>
        <span class="text-[11px] text-slate-500 dark:text-slate-400">Named Custody (${summary.namedActorCount}/${summary.namedActorCount + summary.anonymousActorCount})</span>
      </div>
      <div class="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-lg px-3 py-2 flex flex-col">
        <span class="text-base font-bold text-slate-900 dark:text-slate-100">${summary.totalEvents}</span>
        <span class="text-[11px] text-slate-500 dark:text-slate-400">Place Events</span>
      </div>
      <div class="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-lg px-3 py-2 flex flex-col">
        <span class="text-base font-bold text-slate-900 dark:text-slate-100">${summary.totalGapYears}y</span>
        <span class="text-[11px] text-slate-500 dark:text-slate-400">Gap Years</span>
      </div>
      <div class="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-lg px-3 py-2 flex flex-col">
        <span class="text-base font-bold text-slate-900 dark:text-slate-100">${summary.documentedSpanYears}y</span>
        <span class="text-[11px] text-slate-500 dark:text-slate-400">Span</span>
      </div>
    </div>
    <div class="flex h-2.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 mb-2" aria-label="Event category breakdown">${barSegments}</div>
    <div class="flex flex-wrap gap-1.5 mb-1.5">${catChips}</div>
    <div class="flex flex-wrap gap-1.5 mb-2.5">${roleChips}</div>
  `;

  return summary;
}