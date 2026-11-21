const SVG_NS = 'http://www.w3.org/2000/svg';

const CATEGORY_FILLS = {
  production: '#a855f7',
  discovery: '#f59e0b',
  provenance: '#6366f1',
  exhibition: '#0ea5e9',
  current_location: '#10b981',
};

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, String(v));
  }
  return el;
}

function wrapLabel(text, maxChars) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';

  for (const word of words) {
    if (word.length > maxChars) {
      if (line) {
        lines.push(line);
        line = '';
      }
      for (let i = 0; i < word.length; i += maxChars) {
        lines.push(word.slice(i, i + maxChars));
      }
    } else if (!line || `${line} ${word}`.length <= maxChars) {
      line = line ? `${line} ${word}` : word;
    } else {
      lines.push(line);
      line = word;
    }
  }

  if (line) lines.push(line);
  return lines;
}

function appendWrappedLabel(textEl, lines, { x, y, lineHeight }) {
  textEl.setAttribute('x', String(x));
  lines.forEach((line, index) => {
    const attrs = index === 0 ? { x, y } : { x, dy: lineHeight };
    const tspan = svgEl('tspan', attrs);
    tspan.textContent = line;
    textEl.appendChild(tspan);
  });
}

export function renderSpanChart(container, events, opts = {}) {
  container.innerHTML = '';

  const datedEvents = (events || []).filter(
    (e) => typeof e.startYear === 'number' || typeof e.endYear === 'number'
  );

  if (!Array.isArray(events) || events.length === 0 || datedEvents.length === 0) {
    container.innerHTML =
      '<div class="py-6 text-center text-xs text-slate-500 dark:text-slate-400">No dated events available for chronological span timeline.</div>';
    return;
  }

  const allYears = datedEvents.flatMap((e) =>
    [e.startYear, e.endYear].filter((y) => typeof y === 'number')
  );
  const minYear = Math.min(...allYears);
  const maxYear = Math.max(...allYears);
  const spanRange = Math.max(1, maxYear - minYear);

  const leftPad = 170;
  const rightPad = 28;
  const plotWidth = 520;
  const width = leftPad + plotWidth + rightPad;
  const baseRowHeight = 34;
  const labelLineHeight = 12;
  const labelLines = events.map((ev) => wrapLabel(`#${ev.index} ${ev.label}`, 24));
  const rowHeights = labelLines.map((lines) =>
    Math.max(baseRowHeight, 12 + lines.length * labelLineHeight)
  );
  const topPad = 32;
  const bottomPad = 22;
  const chartRowsHeight = rowHeights.reduce((sum, height) => sum + height, 0);
  const height = topPad + bottomPad + chartRowsHeight;

  const yearToX = (yr) => {
    const clamped = Math.max(minYear, Math.min(maxYear, yr));
    return leftPad + ((clamped - minYear) / spanRange) * plotWidth;
  };

  const svg = svgEl('svg', {
    class: 'pa-svg block shrink-0',
    viewBox: `0 0 ${width} ${height}`,
    width,
    height,
    role: 'img',
    'aria-label': 'Chronological Span and Gap Chart',
  });

  const startTick = svgEl('text', {
    x: leftPad,
    y: 16,
    'text-anchor': 'start',
    class: 'pa-sub-label',
  });
  startTick.textContent = String(minYear);
  svg.appendChild(startTick);

  const endTick = svgEl('text', {
    x: leftPad + plotWidth,
    y: 16,
    'text-anchor': 'end',
    class: 'pa-sub-label',
  });
  endTick.textContent = String(maxYear);
  svg.appendChild(endTick);

  let prevEndYear = null;
  let rowOffset = 0;

  events.forEach((ev, idx) => {
    const rowHeight = rowHeights[idx];
    const y = topPad + rowOffset;
    const midY = y + rowHeight / 2;
    rowOffset += rowHeight;
    const isSelected = opts.activeLegIndex === ev.index;

    const evStart = typeof ev.startYear === 'number' ? ev.startYear : ev.endYear;
    const evEnd = typeof ev.endYear === 'number' ? ev.endYear : ev.startYear;

    if (
      ev.hasGapBefore &&
      prevEndYear !== null &&
      typeof evStart === 'number' &&
      evStart > prevEndYear
    ) {
      const gx1 = yearToX(prevEndYear);
      const gx2 = yearToX(evStart);
      if (gx2 > gx1) {
        svg.appendChild(
          svgEl('rect', {
            x: gx1,
            y: y + 4,
            width: Math.max(4, gx2 - gx1),
            height: rowHeight - 8,
            rx: 2,
            class: 'pa-gap-band',
          })
        );
      }
    }

    const lbl = svgEl('text', {
      x: 8,
      class: `pa-row-label ${isSelected ? 'pa-active-text' : ''}`,
    });
    appendWrappedLabel(lbl, labelLines[idx], {
      x: 8,
      y: midY - ((labelLines[idx].length - 1) * labelLineHeight) / 2 + 4,
      lineHeight: labelLineHeight,
    });
    const titleEl = svgEl('title');
    titleEl.textContent = `[#${ev.index}] ${ev.label} (${evStart ?? '—'}–${evEnd ?? '—'})${
      ev.hasGapBefore ? ` · Gap before: ${ev.gapYearsBefore}y` : ''
    }`;
    lbl.appendChild(titleEl);
    svg.appendChild(lbl);

    const g = svgEl('g', { style: 'cursor: pointer;' });

    if (typeof evStart === 'number' && typeof evEnd === 'number') {
      const x1 = yearToX(evStart);
      const x2 = yearToX(evEnd);
      const barW = Math.max(8, x2 - x1);
      g.appendChild(
        svgEl('rect', {
          x: x1,
          y: midY - 7,
          width: barW,
          height: 14,
          rx: 3,
          fill: CATEGORY_FILLS[ev.category] || '#6366f1',
          stroke: isSelected ? '#34d399' : 'none',
          'stroke-width': isSelected ? 2 : 0,
        })
      );
      const yrTag = svgEl('text', {
        x: Math.min(leftPad + plotWidth + 4, x1 + barW + 6),
        y: midY + 4,
        class: 'pa-sub-label',
      });
      yrTag.textContent = evStart === evEnd ? String(evStart) : `${evStart}–${evEnd}`;
      g.appendChild(yrTag);
      prevEndYear = Math.max(prevEndYear ?? evEnd, evEnd);
    } else {
      const undatedLbl = svgEl('text', {
        x: leftPad + 6,
        y: midY + 4,
        class: 'pa-sub-label',
      });
      undatedLbl.textContent = 'Undated / Present';
      g.appendChild(undatedLbl);
    }

    g.addEventListener('click', () => {
      if (typeof opts.onSelectLeg === 'function') {
        opts.onSelectLeg(ev.index, ev);
      }
    });

    svg.appendChild(g);
  });

  container.appendChild(svg);
}