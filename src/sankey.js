import { roleToLifecycleStage } from './normalize.js';

const STAGES = [
  'Maker',
  'Finder / Excavator',
  'Dealer / Auction',
  'Private Collector',
  'Exhibition',
  'Museum / Keeper',
];

const SVG_NS = 'http://www.w3.org/2000/svg';

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, String(v));
  }
  return el;
}

export function renderSankey(container, events, opts = {}) {
  container.innerHTML = '';

  const weightBy = opts.weightBy || 'count';
  if (!Array.isArray(events) || events.length < 2) {
    container.innerHTML =
      '<div class="py-6 text-center text-xs text-slate-500 dark:text-slate-400">At least two events are needed to render actor handoff flows.</div>';
    return;
  }

  const edgeMap = new Map();

  for (let i = 0; i < events.length - 1; i++) {
    const curr = events[i];
    const next = events[i + 1];

    const currStages = Array.from(
      new Set(
        (curr.actors || []).map((a) => roleToLifecycleStage(a.role, curr.method))
      )
    );
    const nextStages = Array.from(
      new Set(
        (next.actors || []).map((a) => roleToLifecycleStage(a.role, next.method))
      )
    );

    const stepWeight =
      weightBy === 'years' ? Math.max(1, curr.durationYears || 1) : 1;

    for (const s of currStages) {
      for (const t of nextStages) {
        const key = `${s}__${t}`;
        if (!edgeMap.has(key)) {
          edgeMap.set(key, {
            source: s,
            target: t,
            weight: 0,
            legIndices: [],
          });
        }
        const edge = edgeMap.get(key);
        edge.weight += stepWeight;
        edge.legIndices.push(curr.index);
      }
    }
  }

  const edges = Array.from(edgeMap.values());
  if (edges.length === 0) {
    container.innerHTML =
      '<div class="py-6 text-center text-xs text-slate-500 dark:text-slate-400">No transition links found between custody events.</div>';
    return;
  }

  const activeStages = STAGES.filter((st) =>
    edges.some((e) => e.source === st || e.target === st)
  );

  const width = 680;
  const nodeWidth = 18;
  const nodeGap = 28;
  const topPad = 24;
  const bottomPad = 40;
  const leftX = 20;
  const rightX = width - 165;

  const totalWeight = Math.max(
    1,
    edges.reduce((acc, e) => acc + e.weight, 0)
  );
  const baseUsableHeight = Math.max(180, activeStages.length * 42);

  const sizedEdges = edges.map((edge) => ({
    ...edge,
    ribbonH: Math.max(4, (edge.weight / totalWeight) * baseUsableHeight),
  }));

  const nodePositions = new Map();
  let cursorY = topPad;

  for (const st of activeStages) {
    const outRibbonSum = sizedEdges
      .filter((e) => e.source === st)
      .reduce((a, b) => a + b.ribbonH, 0);
    const inRibbonSum = sizedEdges
      .filter((e) => e.target === st)
      .reduce((a, b) => a + b.ribbonH, 0);

    const outWeight = sizedEdges
      .filter((e) => e.source === st)
      .reduce((a, b) => a + b.weight, 0);
    const inWeight = sizedEdges
      .filter((e) => e.target === st)
      .reduce((a, b) => a + b.weight, 0);
    const stageWeight = Math.max(outWeight, inWeight, totalWeight * 0.08);
    const propH = (stageWeight / totalWeight) * baseUsableHeight;

    const h = Math.max(20, propH, outRibbonSum, inRibbonSum);

    nodePositions.set(st, {
      x: leftX,
      y: cursorY,
      h,
      outOffset: 0,
      inOffset: 0,
    });
    cursorY += h + nodeGap;
  }

  const height = cursorY - nodeGap + bottomPad;

  const svg = svgEl('svg', {
    class: 'pa-svg block shrink-0',
    viewBox: `0 0 ${width} ${height}`,
    width,
    height,
    role: 'img',
    'aria-label': 'Actor Handoff Flow Diagram',
  });

  for (const edge of sizedEdges) {
    const src = nodePositions.get(edge.source);
    const tgt = nodePositions.get(edge.target);
    if (!src || !tgt) continue;

    const ribbonH = edge.ribbonH;
    const y0 = src.y + src.outOffset + ribbonH / 2;
    const y1 = tgt.y + tgt.inOffset + ribbonH / 2;
    src.outOffset += ribbonH;
    tgt.inOffset += ribbonH;

    const x0 = src.x + nodeWidth;
    const x1 = rightX;
    const cx = (x0 + x1) / 2;

    const isLinkedToActive =
      opts.activeLegIndex !== null &&
      opts.activeLegIndex !== undefined &&
      edge.legIndices.includes(opts.activeLegIndex);

    const pathEl = svgEl('path', {
      d: `M ${x0} ${y0} C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`,
      fill: 'none',
      'stroke-width': ribbonH,
      class: `pa-sankey-ribbon ${isLinkedToActive ? 'pa-sankey-active' : ''}`,
      style: 'cursor: pointer;',
    });

    const title = svgEl('title');
    const unitLabel = weightBy === 'years' ? 'yrs' : 'events';
    title.textContent = `${edge.source} → ${edge.target}: ${edge.weight} ${unitLabel} (click to inspect leg #${edge.legIndices[0]})`;
    pathEl.appendChild(title);

    pathEl.addEventListener('click', () => {
      const targetLeg =
        edge.legIndices.find((idx) => idx !== opts.activeLegIndex) ??
        edge.legIndices[0];
      if (
        targetLeg !== undefined &&
        events[targetLeg] &&
        typeof opts.onSelectLeg === 'function'
      ) {
        opts.onSelectLeg(targetLeg, events[targetLeg]);
      }
    });

    svg.appendChild(pathEl);
  }

  for (const st of activeStages) {
    const pos = nodePositions.get(st);

    svg.appendChild(
      svgEl('rect', {
        x: leftX,
        y: pos.y,
        width: nodeWidth,
        height: pos.h,
        rx: 3,
        class: 'pa-sankey-node',
      })
    );
    const leftLbl = svgEl('text', {
      x: leftX + nodeWidth + 8,
      y: pos.y + pos.h / 2 + 4,
      class: 'pa-row-label',
    });
    leftLbl.textContent = st;
    svg.appendChild(leftLbl);

    svg.appendChild(
      svgEl('rect', {
        x: rightX,
        y: pos.y,
        width: nodeWidth,
        height: pos.h,
        rx: 3,
        class: 'pa-sankey-node',
      })
    );
    const rightLbl = svgEl('text', {
      x: rightX + nodeWidth + 8,
      y: pos.y + pos.h / 2 + 4,
      class: 'pa-row-label',
    });
    rightLbl.textContent = st;
    svg.appendChild(rightLbl);
  }

  container.appendChild(svg);
}