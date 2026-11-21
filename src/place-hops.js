export function renderPlaceHops(container, events, opts = {}) {
  container.innerHTML = '';

  if (!Array.isArray(events) || events.length === 0) {
    container.innerHTML =
      '<div class="py-6 text-center text-xs text-slate-500 dark:text-slate-400">No place events available to display movement hops.</div>';
    return;
  }

  const locatedEvents = events.filter((e) => Boolean(e.locationLabel));
  let hopCount = 0;
  let prevLocated = null;
  for (const ev of events) {
    if (ev.locationLabel) {
      if (prevLocated !== null && prevLocated !== ev.locationLabel) {
        hopCount += 1;
      }
      prevLocated = ev.locationLabel;
    }
  }

  const wrap = document.createElement('div');
  wrap.className = 'space-y-2';

  const summaryBar = document.createElement('div');
  summaryBar.className =
    'flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 px-1';
  summaryBar.innerHTML = `
    <span>Place-attributed events: <strong class="text-slate-800 dark:text-slate-200">${locatedEvents.length}</strong> / ${events.length} · Place hops: <strong class="text-indigo-600 dark:text-indigo-400">${hopCount}</strong></span>
    <span>Click any place hop to sync activeLegIndex</span>
  `;
  wrap.appendChild(summaryBar);

  const track = document.createElement('div');
  track.className = 'flex items-stretch gap-2 overflow-x-auto pb-1';

  let lastPlace = null;

  events.forEach((ev, idx) => {
    const place = ev.locationLabel || 'Place Unspecified';
    const moved =
      Boolean(ev.locationLabel) &&
      lastPlace !== null &&
      lastPlace !== place;
    const fromPlace = moved ? lastPlace : null;
    if (ev.locationLabel) lastPlace = place;

    if (idx > 0) {
      const connector = document.createElement('div');
      connector.className =
        'shrink-0 self-center text-xs font-semibold text-slate-400 dark:text-slate-500 select-none px-0.5';
      connector.textContent = moved ? '→' : '·';
      track.appendChild(connector);
    }

    const isSelected = opts.activeLegIndex === ev.index;
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `shrink-0 w-52 text-left rounded-lg border p-2.5 transition-colors cursor-pointer ${
      isSelected
        ? 'border-emerald-400 bg-emerald-500/10'
        : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/70 hover:border-indigo-500'
    }`;

    const topRow = document.createElement('div');
    topRow.className = 'flex items-center justify-between gap-1 text-[10px] text-slate-400 mb-1';
    topRow.innerHTML = `
      <span class="font-semibold text-indigo-600 dark:text-indigo-400">#${ev.index}</span>
      <span>${ev.displayDate || ev.startYear || '—'}</span>
    `;

    const placeEl = document.createElement('div');
    placeEl.className = `text-xs font-semibold break-words ${
      ev.locationLabel
        ? 'text-slate-900 dark:text-slate-100'
        : 'text-amber-600 dark:text-amber-400 italic'
    }`;
    placeEl.textContent = place;

    const subEl = document.createElement('div');
    subEl.className = 'text-[11px] text-slate-500 dark:text-slate-400 break-words mt-0.5';
    subEl.textContent = ev.label;

    const badgeEl = document.createElement('div');
    badgeEl.className = 'mt-1.5 text-[10px]';
    if (moved) {
      badgeEl.innerHTML = `<span class="px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 font-medium">↗ Hop from ${fromPlace}</span>`;
    } else if (!ev.locationLabel) {
      badgeEl.innerHTML = `<span class="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-300 font-medium">No Place</span>`;
    } else {
      badgeEl.innerHTML = `<span class="text-slate-400">Initial / Unchanged Place</span>`;
    }

    card.appendChild(topRow);
    card.appendChild(placeEl);
    card.appendChild(subEl);
    card.appendChild(badgeEl);

    card.addEventListener('click', () => {
      if (typeof opts.onSelectLeg === 'function') {
        opts.onSelectLeg(ev.index, ev);
      }
    });

    track.appendChild(card);
  });

  wrap.appendChild(track);
  container.appendChild(wrap);
}