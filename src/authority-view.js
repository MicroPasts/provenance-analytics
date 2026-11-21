export function renderAuthorityView(container, events) {
  container.innerHTML = '';

  if (!Array.isArray(events) || events.length === 0) {
    container.innerHTML =
      '<div class="py-6 text-center text-xs text-slate-500 dark:text-slate-400">No events available for authority coverage analysis.</div>';
    return;
  }

  const authCounts = {
    ulan: 0,
    wikidata: 0,
    uri: 0,
    'label-only': 0,
    anonymous: 0,
  };

  const methodCounts = new Map();

  for (const ev of events) {
    if (ev.method) {
      methodCounts.set(ev.method, (methodCounts.get(ev.method) || 0) + 1);
    }
    for (const actor of ev.actors || []) {
      const key = actor.isAnonymous ? 'anonymous' : actor.authorityType || 'label-only';
      authCounts[key] = (authCounts[key] || 0) + 1;
    }
  }

  const totalActors = Object.values(authCounts).reduce((a, b) => a + b, 0);
  const authItems = [
    ['ulan', 'Getty ULAN URI', 'bg-emerald-500'],
    ['wikidata', 'Wikidata URI', 'bg-sky-500'],
    ['uri', 'Other HTTP URI', 'bg-indigo-500'],
    ['label-only', 'Text Label Only', 'bg-slate-400'],
    ['anonymous', 'Unknown / Anonymous', 'bg-amber-500'],
  ];

  const authRowsHtml = authItems
    .map(([key, label, barCls]) => {
      const count = authCounts[key] || 0;
      const pct = totalActors > 0 ? Math.round((count / totalActors) * 100) : 0;
      return `
        <div class="space-y-1">
          <div class="flex justify-between text-xs">
            <span class="text-slate-700 dark:text-slate-200">${label}</span>
            <span class="text-slate-500 dark:text-slate-400 font-medium">${count} (${pct}%)</span>
          </div>
          <div class="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div class="${barCls} h-full" style="width:${pct}%"></div>
          </div>
        </div>
      `;
    })
    .join('');

  const methodsArr = Array.from(methodCounts.entries()).sort((a, b) => b[1] - a[1]);
  const methodChipsHtml =
    methodsArr.length > 0
      ? methodsArr
          .map(
            ([m, c]) =>
              `<span class="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">${m} <strong class="text-indigo-600 dark:text-indigo-400">${c}</strong></span>`
          )
          .join('')
      : '<span class="text-xs text-slate-500 dark:text-slate-400">No explicit transfer or activity methods recorded.</span>';

  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 p-1">
      <div class="rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/60 p-3 space-y-2.5">
        <div class="text-xs font-semibold text-slate-900 dark:text-slate-100">Actor Authority Identifiers (${totalActors} mentions)</div>
        ${authRowsHtml}
      </div>
      <div class="rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/60 p-3 space-y-2.5">
        <div class="text-xs font-semibold text-slate-900 dark:text-slate-100">Recorded Transfer &amp; Event Methods</div>
        <div class="flex flex-wrap gap-1.5">${methodChipsHtml}</div>
      </div>
    </div>
  `;
}