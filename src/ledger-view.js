export function renderLedgerView(container, events, opts = {}) {
  container.innerHTML = '';

  if (!Array.isArray(events) || events.length === 0) {
    container.innerHTML =
      '<div class="py-6 text-center text-xs text-slate-500 dark:text-slate-400">No provenance events available for the custody ledger.</div>';
    return;
  }

  const table = document.createElement('table');
  table.className = 'w-full text-left border-collapse text-xs';

  table.innerHTML = `
    <thead>
      <tr class="border-b border-slate-200 dark:border-slate-700 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
        <th class="py-2 px-2.5 align-top">#</th>
        <th class="py-2 px-2.5 align-top">Year</th>
        <th class="py-2 px-2.5 align-top">Provenance Event &amp; Label</th>
        <th class="py-2 px-2.5 align-top">From → To</th>
        <th class="py-2 px-2.5 align-top">Place</th>
        <th class="py-2 px-2.5 align-top">Gap</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-slate-200 dark:divide-slate-800"></tbody>
  `;

  const tbody = table.querySelector('tbody');

  for (const ev of events) {
    const isSelected = opts.activeLegIndex === ev.index;
    const tr = document.createElement('tr');
    tr.className = `cursor-pointer transition-colors align-top ${
      isSelected
        ? 'bg-indigo-500/15 dark:bg-indigo-500/20'
        : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
    }`;

    const fromStr = (ev.fromActors || []).map((a) => a.label).join(', ');
    const toStr = (ev.toActors || []).map((a) => a.label).join(', ');
    const partySummary =
      fromStr || toStr
        ? `${fromStr || '—'} → ${toStr || '—'}`
        : (ev.actors || []).map((a) => a.label).join(', ') || '—';

    const yearStr =
      ev.displayDate ||
      (ev.startYear !== null && ev.endYear !== null && ev.startYear !== ev.endYear
        ? `${ev.startYear}–${ev.endYear}`
        : ev.startYear !== null
        ? String(ev.startYear)
        : '—');

    const gapBadge = ev.hasGapBefore
      ? `<span class="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 font-medium">+${ev.gapYearsBefore}y</span>`
      : '<span class="text-slate-400">—</span>';

    const activitySub = ev.activityLabel
      ? `<div class="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 break-words">${ev.activityLabel}</div>`
      : '';

    const statementText = Array.isArray(ev.statements) && ev.statements.length > 0
      ? ev.statements[0]
      : '';
    const statementSub = statementText
      ? `<div class="text-[11px] italic text-slate-500 dark:text-slate-400 mt-0.5 break-words">${statementText}</div>`
      : '';

    tr.innerHTML = `
      <td class="py-2 px-2.5 font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">${ev.index}</td>
      <td class="py-2 px-2.5 whitespace-nowrap text-slate-600 dark:text-slate-300">${yearStr}</td>
      <td class="py-2 px-2.5 min-w-[220px]">
        <div class="font-medium text-slate-900 dark:text-slate-100 break-words">${ev.label}</div>
        ${activitySub}
        ${statementSub}
        <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">${ev.category}${ev.method ? ` · ${ev.method}` : ''}</div>
      </td>
      <td class="py-2 px-2.5 text-slate-700 dark:text-slate-200 min-w-[180px] break-words">${partySummary}</td>
      <td class="py-2 px-2.5 text-slate-600 dark:text-slate-300 min-w-[120px] break-words">${ev.locationLabel || '—'}</td>
      <td class="py-2 px-2.5 whitespace-nowrap">${gapBadge}</td>
    `;

    tr.addEventListener('click', () => {
      if (typeof opts.onSelectLeg === 'function') {
        opts.onSelectLeg(ev.index, ev);
      }
    });

    tbody.appendChild(tr);
  }

  container.appendChild(table);
}