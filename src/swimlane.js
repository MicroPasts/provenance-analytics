const SVG_NS = 'http://www.w3.org/2000/svg';

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
  lines.forEach((line, index) => {
    const attrs = index === 0 ? { x, y } : { x, dy: lineHeight };
    const tspan = svgEl('tspan', attrs);
    tspan.textContent = line;
    textEl.appendChild(tspan);
  });
}

export function renderSwimlane(container, events, opts = {}) {
  container.innerHTML = '';

  if (!Array.isArray(events) || events.length === 0) {
    container.innerHTML =
      '<div class="py-6 text-center text-xs text-slate-500 dark:text-slate-400">No provenance events available for swimlane matrix.</div>';
    return;
  }

  const rowMap = new Map();
  let hasAnonymous = false;

  for (const ev of events) {
    const fromIds = new Set((ev.fromActors || []).map((a) => a.id));
    const toIds = new Set((ev.toActors || []).map((a) => a.id));

    for (const actor of ev.actors || []) {
      if (actor.isAnonymous) hasAnonymous = true;
      const rowKey = actor.isAnonymous ? '__anonymous__' : actor.id;
      const rowLabel = actor.isAnonymous ? 'Unknown / Unattributed' : actor.label;

      if (!rowMap.has(rowKey)) {
        rowMap.set(rowKey, {
          id: rowKey,
          label: rowLabel,
          isAnonymousRow: rowKey === '__anonymous__',
          cells: [],
        });
      }

      let kind = 'single';
      if (ev.category === 'exhibition') {
        kind = 'exhibition';
      } else if (fromIds.has(actor.id) && !toIds.has(actor.id)) {
        kind = 'from';
      } else if (toIds.has(actor.id) && !fromIds.has(actor.id)) {
        kind = 'to';
      }

      rowMap.get(rowKey).cells.push({
        eventIndex: ev.index,
        event: ev,
        kind,
        isAnonymous: actor.isAnonymous,
      });
    }
  }

  const rows = Array.from(rowMap.values());
  if (hasAnonymous && !rowMap.has('__anonymous__')) {
    rows.push({
      id: '__anonymous__',
      label: 'Unknown / Unattributed',
      isAnonymousRow: true,
      cells: [],
    });
  }

  const labelColWidth = 200;
  const colWidth = 80;
  const baseRowHeight = 42;
  const labelLineHeight = 12;
  const labelLines = rows.map((row) => wrapLabel(row.label, 26));
  const rowHeights = labelLines.map((lines) =>
    Math.max(baseRowHeight, 12 + lines.length * labelLineHeight)
  );
  const rowStarts = [];
  let rowOffset = 0;
  rowHeights.forEach((rowHeight) => {
    rowStarts.push(rowOffset);
    rowOffset += rowHeight;
  });
  const headerHeight = 48;
  const width = Math.max(680, labelColWidth + events.length * colWidth + 24);
  const height = headerHeight + rowOffset + 16;

  const svg = svgEl('svg', {
    class: 'pa-svg block shrink-0',
    viewBox: `0 0 ${width} ${height}`,
    width,
    height,
    role: 'img',
    'aria-label': 'Chronological Actor-to-Event Swimlane Matrix',
  });

  // Gap bands & event headers
  events.forEach((ev, colIdx) => {
    const x = labelColWidth + colIdx * colWidth + colWidth / 2;

    if (ev.hasGapBefore) {
      svg.appendChild(
        svgEl('rect', {
          x: labelColWidth + colIdx * colWidth - 6,
          y: headerHeight - 8,
          width: 12,
          height: rowOffset + 10,
          class: 'pa-gap-band',
        })
      );
    }

    const isSelected = opts.activeLegIndex === ev.index;
    const headerText = svgEl('text', {
      x,
      y: 20,
      'text-anchor': 'middle',
      class: `pa-axis-label ${isSelected ? 'pa-active-text' : ''}`,
    });
    headerText.textContent = `#${ev.index}`;
    svg.appendChild(headerText);

    const yearText = svgEl('text', {
      x,
      y: 35,
      'text-anchor': 'middle',
      class: 'pa-sub-label',
    });
    yearText.textContent = ev.startYear !== null ? String(ev.startYear) : '—';
    svg.appendChild(yearText);
  });

  // Actor rows
  rows.forEach((row, rIdx) => {
    const rowHeight = rowHeights[rIdx];
    const y = headerHeight + rowStarts[rIdx] + rowHeight / 2;

    svg.appendChild(
      svgEl('line', {
        x1: 0,
        y1: headerHeight + rowStarts[rIdx],
        x2: width,
        y2: headerHeight + rowStarts[rIdx],
        class: 'pa-grid-line',
      })
    );

    const rowLabel = svgEl('text', {
      x: 8,
      class: `pa-row-label ${row.isAnonymousRow ? 'pa-anon-text' : ''}`,
    });
    appendWrappedLabel(rowLabel, labelLines[rIdx], {
      x: 8,
      y: y - ((labelLines[rIdx].length - 1) * labelLineHeight) / 2 + 4,
      lineHeight: labelLineHeight,
    });

    const titleEl = svgEl('title');
    titleEl.textContent = row.label;
    rowLabel.appendChild(titleEl);
    svg.appendChild(rowLabel);
  });

  // Handoff connectors
  events.forEach((ev) => {
    const x = labelColWidth + ev.index * colWidth + colWidth / 2;
    const fromRowIndices = [];
    const toRowIndices = [];

    rows.forEach((r, rIdx) => {
      for (const c of r.cells) {
        if (c.eventIndex === ev.index) {
          if (c.kind === 'from') fromRowIndices.push(rIdx);
          if (c.kind === 'to') toRowIndices.push(rIdx);
        }
      }
    });

    for (const fIdx of fromRowIndices) {
      for (const tIdx of toRowIndices) {
        const y1 =
          headerHeight +
          rowStarts[fIdx] +
          rowHeights[fIdx] / 2;
        const y2 =
          headerHeight +
          rowStarts[tIdx] +
          rowHeights[tIdx] / 2;
        const midX = x + 10;
        const isAnonLink =
          rows[fIdx]?.isAnonymousRow || rows[tIdx]?.isAnonymousRow;

        svg.appendChild(
          svgEl('path', {
            d: `M ${x} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x} ${y2}`,
            fill: 'none',
            class: isAnonLink ? 'pa-handoff-anon' : 'pa-handoff-line',
          })
        );
      }
    }
  });

  // Event nodes
  let selectedTarget = null;

  rows.forEach((row, rIdx) => {
    const y =
      headerHeight +
      rowStarts[rIdx] +
      rowHeights[rIdx] / 2;

    for (const cell of row.cells) {
      const x = labelColWidth + cell.eventIndex * colWidth + colWidth / 2;
      const isSelected = opts.activeLegIndex === cell.eventIndex;

      const nodeGroup = svgEl('g', {
        class: `pa-node-group ${isSelected ? 'pa-node-selected' : ''}`,
        style: 'cursor: pointer;',
      });

      const tip = svgEl('title');
      tip.textContent = `[#${cell.eventIndex}] ${cell.event.label} (${cell.event.category})${
        cell.event.startYear ? ` · ${cell.event.startYear}` : ''
      }`;
      nodeGroup.appendChild(tip);

      if (cell.kind === 'exhibition') {
        const size = 7;
        nodeGroup.appendChild(
          svgEl('polygon', {
            points: `${x},${y - size} ${x + size},${y} ${x},${y + size} ${x - size},${y}`,
            class: 'pa-node-exhibition',
          })
        );
      } else if (cell.kind === 'from') {
        nodeGroup.appendChild(
          svgEl('circle', {
            cx: x,
            cy: y,
            r: 6,
            class: cell.isAnonymous ? 'pa-node-anon' : 'pa-node-hollow',
          })
        );
      } else {
        nodeGroup.appendChild(
          svgEl('circle', {
            cx: x,
            cy: y,
            r: 6.5,
            class: cell.isAnonymous ? 'pa-node-anon' : 'pa-node-solid',
          })
        );
      }

      if (isSelected && !selectedTarget) {
        selectedTarget = { x, y };
      }

      nodeGroup.addEventListener('click', () => {
        if (typeof opts.onSelectLeg === 'function') {
          opts.onSelectLeg(cell.eventIndex, cell.event);
        }
      });

      svg.appendChild(nodeGroup);
    }
  });

  container.appendChild(svg);

  // Auto-scroll active leg into view inside the scroll viewport
  if (selectedTarget) {
    const targetLeft = Math.max(0, selectedTarget.x - container.clientWidth / 2);
    const targetTop = Math.max(0, selectedTarget.y - container.clientHeight / 2);
    container.scrollTo({
      left: targetLeft,
      top: targetTop,
      behavior: 'smooth',
    });
  } else if (
    typeof opts.activeLegIndex === 'number' &&
    opts.activeLegIndex >= 0
  ) {
    const colX = labelColWidth + opts.activeLegIndex * colWidth + colWidth / 2;
    container.scrollTo({
      left: Math.max(0, colX - container.clientWidth / 2),
      behavior: 'smooth',
    });
  }
}