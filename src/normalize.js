function extractYear(input) {
  if (typeof input === 'number' && Number.isFinite(input)) return Math.round(input);
  if (typeof input !== 'string') return null;

  const trimmed = input.trim();
  if (!trimmed) return null;

  const bceMatch = trimmed.match(/(\d{1,4})\s*(?:BCE|B\.C\.E\.|BC|B\.C\.)/i);
  if (bceMatch) {
    return -Number.parseInt(bceMatch[1], 10);
  }

  const isoNeg = trimmed.match(/^-(\d{3,4})(?:-|$)/);
  if (isoNeg) {
    return -Number.parseInt(isoNeg[1], 10);
  }

  const match = trimmed.match(/\b(\d{3,4})\b/);
  if (!match) return null;
  const yr = Number.parseInt(match[1], 10);
  return Number.isFinite(yr) ? yr : null;
}

function extractYearRangeFromString(str) {
  if (typeof str !== 'string') return { startYear: null, endYear: null };
  const matches = Array.from(str.matchAll(/\b(\d{3,4})\b/g)).map((m) =>
    Number.parseInt(m[1], 10)
  );
  if (matches.length === 0) return { startYear: null, endYear: null };
  if (matches.length === 1) return { startYear: matches[0], endYear: matches[0] };
  return {
    startYear: Math.min(...matches),
    endYear: Math.max(...matches),
  };
}

function asArray(val) {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

function normalizeLabel(raw, fallback = 'Unknown') {
  if (typeof raw === 'string' && raw.trim().length > 0) return raw.trim();
  return fallback;
}

function isUnknownActor(label, uri) {
  const lower = label.toLowerCase().trim();
  if (
    !lower ||
    lower === 'unknown' ||
    lower === 'anonymous' ||
    lower === 'unidentified' ||
    lower.includes('unknown owner') ||
    (lower.includes('private collection') && lower.includes('unknown'))
  ) {
    return true;
  }
  if (!uri && lower === 'unknown party') return true;
  return false;
}

function extractAuthorityInfo(obj) {
  const ids = asArray(obj?.identified_by);
  for (const ident of ids) {
    const val = typeof ident?.content === 'string' ? ident.content.trim() : '';
    if (val.includes('ulan.getty.edu')) {
      return { uri: val, authorityType: 'ulan' };
    }
    if (val.includes('wikidata.org')) {
      return { uri: val, authorityType: 'wikidata' };
    }
  }

  if (typeof obj?.id === 'string' && obj.id.startsWith('http')) {
    if (obj.id.includes('ulan.getty.edu')) {
      return { uri: obj.id, authorityType: 'ulan' };
    }
    if (obj.id.includes('wikidata.org')) {
      return { uri: obj.id, authorityType: 'wikidata' };
    }
    return { uri: obj.id, authorityType: 'uri' };
  }

  return { uri: null, authorityType: 'label-only' };
}

/**
 * Converts a IIIF Image API base URI or image URL into a sized image request.
 * Supports IIIF Image API 2.x ('!w,h') and 3.0 ('w,', ',h', 'max', 'w,h').
 */
export function buildIiifImageUrl(sourceUrl, options = {}) {
  if (typeof sourceUrl !== 'string' || !sourceUrl.trim()) return null;

  const {
    apiVersion = '2',
    region = 'full',
    size = null,
    maxWidth = 160,
    maxHeight = 160,
    rotation = '0',
    quality = 'default',
    format = 'jpg',
  } = options;

  const trimmed = sourceUrl.trim().replace(/\/+$/, '');

  const iiifParamMatch = trimmed.match(
    /^(https?:\/\/.+?)\/([^/]+)\/([^/]+)\/([^/]+)\/([^/.]+)\.(jpg|jpeg|png|webp|gif|tif|tiff)$/i
  );
  if (iiifParamMatch) {
    const [, prefix, reg, , rot, qual, ext] = iiifParamMatch;
    const resolvedSize =
      size ||
      (String(apiVersion).startsWith('3') ? `${maxWidth},` : `!${maxWidth},${maxHeight}`);
    return `${prefix}/${reg}/${resolvedSize}/${rot}/${qual}.${ext}`;
  }

  const withoutInfo = trimmed.replace(/\/info\.json$/i, '');

  if (/\.(jpe?g|png|webp|gif)(\?|$)/i.test(withoutInfo)) {
    return withoutInfo;
  }

  const resolvedSize =
    size ||
    (String(apiVersion).startsWith('3') ? `${maxWidth},` : `!${maxWidth},${maxHeight}`);

  return `${withoutInfo}/${region}/${resolvedSize}/${rotation}/${quality}.${format}`;
}

function resolveIiifSource(repList) {
  for (const rep of asArray(repList)) {
    if (!rep || typeof rep !== 'object') continue;

    for (const d of asArray(rep.digitally_shown_by)) {
      if (!d || typeof d !== 'object') continue;

      for (const svc of asArray(d.service || d.conforms_to)) {
        if (!svc || typeof svc !== 'object') continue;
        const svcId = typeof svc.id === 'string' ? svc.id : '';
        const profile = String(svc.profile || '').toLowerCase();
        const typeStr = String(svc.type || '').toLowerCase();
        if (
          svcId.startsWith('http') &&
          (svcId.includes('iiif') ||
            typeStr.includes('image') ||
            profile.includes('iiif.io/api/image'))
        ) {
          const isV3 =
            profile.includes('api/image/3') ||
            String(svc['@context'] || '').includes('iiif.io/api/image/3');
          return { uri: svcId, isIiif: true, apiVersion: isV3 ? '3' : '2' };
        }
      }

      for (const ap of asArray(d.access_point)) {
        if (typeof ap?.id === 'string' && ap.id.startsWith('http')) {
          const isIiif = ap.id.includes('/iiif/') || ap.id.includes('iiif');
          return { uri: ap.id, isIiif, apiVersion: '2' };
        }
      }
    }

    if (typeof rep.id === 'string' && rep.id.startsWith('http')) {
      const isIiif = rep.id.includes('/iiif/') || rep.id.includes('iiif');
      if (isIiif || /\.(jpe?g|png|webp)(\?|$)/i.test(rep.id) || rep.type === 'VisualItem') {
        return { uri: rep.id, isIiif, apiVersion: '2' };
      }
    }
  }

  return null;
}

export function extractObjectMetadata(input, imageOptions = {}) {
  const empty = {
    title: null,
    subtitle: null,
    thumbnailUrl: null,
    rawImageUrl: null,
    isIiif: false,
    objectId: null,
  };
  if (!input) return empty;

  let parsed = input;
  if (typeof input === 'string') {
    try {
      parsed = JSON.parse(input);
    } catch {
      return empty;
    }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return empty;
  }

  let title = normalizeLabel(parsed._label ?? parsed.label ?? parsed.title, '');
  let accessionNumber = null;

  for (const ident of asArray(parsed.identified_by)) {
    if (!ident || typeof ident !== 'object') continue;
    const content = typeof ident.content === 'string' ? ident.content.trim() : '';
    if (!content) continue;

    const classes = asArray(ident.classified_as).map((c) =>
      String(c._label || c.label || c.id || '').toLowerCase()
    );
    if (classes.some((c) => c.includes('primary') || c.includes('300404670'))) {
      title = content;
    } else if (classes.some((c) => c.includes('accession') || c.includes('300312355'))) {
      accessionNumber = content;
    }
  }

  const found =
    resolveIiifSource(parsed.representation) || resolveIiifSource(parsed.subject_of);

  const explicitUrl = parsed.thumbnailUrl || parsed.thumbnail || found?.uri || null;
  const isIiif = Boolean(
    found?.isIiif || (typeof explicitUrl === 'string' && explicitUrl.includes('iiif'))
  );

  const thumbnailUrl = explicitUrl
    ? isIiif || imageOptions.forceIiifSize
      ? buildIiifImageUrl(explicitUrl, {
          apiVersion: found?.apiVersion || imageOptions.iiifVersion || '2',
          maxWidth: imageOptions.thumbnailWidth ?? 160,
          maxHeight: imageOptions.thumbnailHeight ?? 160,
          size: imageOptions.iiifSize ?? null,
          format: imageOptions.iiifFormat ?? 'jpg',
        })
      : explicitUrl
    : null;

  return {
    title: title || null,
    subtitle: accessionNumber,
    thumbnailUrl,
    rawImageUrl: explicitUrl,
    isIiif,
    objectId: typeof parsed.id === 'string' ? parsed.id : null,
  };
}

export function roleToLifecycleStage(role, method) {
  const m = (method || '').toLowerCase();
  if (role === 'maker') return 'Maker';
  if (role === 'finder') return 'Finder / Excavator';
  if (role === 'exhibitor') return 'Exhibition';
  if (role === 'keeper') return 'Museum / Keeper';
  if (
    role === 'dealer' ||
    m.includes('auction') ||
    m.includes('dealer') ||
    m.includes('sale')
  ) {
    return 'Dealer / Auction';
  }
  return 'Private Collector';
}

function classifyRoleFromText(text, fallback) {
  const t = text.toLowerCase();
  if (
    t.includes('museum') ||
    t.includes('gallery') ||
    t.includes('library') ||
    t.includes('institution') ||
    t.includes('keeper')
  ) {
    return 'keeper';
  }
  if (
    t.includes('auction') ||
    t.includes('sotheby') ||
    t.includes('christie') ||
    t.includes('dealer') ||
    t.includes('gallery')
  ) {
    return 'dealer';
  }
  if (t.includes('exhibit') || t.includes('loan')) return 'exhibitor';
  if (t.includes('find') || t.includes('excavat') || t.includes('discover')) {
    return 'finder';
  }
  if (t.includes('maker') || t.includes('artist') || t.includes('produc')) {
    return 'maker';
  }
  return fallback;
}

function makeActor(raw, role, method) {
  if (typeof raw === 'string') {
    const label = normalizeLabel(raw);
    const anon = isUnknownActor(label);
    const resolvedRole = anon ? role : classifyRoleFromText(label, role);
    return {
      id: `actor:${label.toLowerCase().replace(/\s+/g, '-')}`,
      label: anon ? 'Unknown' : label,
      role: resolvedRole,
      stage: roleToLifecycleStage(resolvedRole, method),
      isAnonymous: anon,
      uri: null,
      authorityType: anon ? 'anonymous' : 'label-only',
    };
  }

  const label = normalizeLabel(raw?._label ?? raw?.label ?? raw?.name);
  const { uri, authorityType } = extractAuthorityInfo(raw || {});
  const anon = isUnknownActor(label, uri);
  const resolvedRole = anon ? role : classifyRoleFromText(label, role);
  const id =
    uri ||
    (typeof raw?.id === 'string' && raw.id.length > 0
      ? raw.id
      : `actor:${label.toLowerCase().replace(/\s+/g, '-')}`);

  return {
    id,
    label: anon ? 'Unknown' : label,
    role: resolvedRole,
    stage: roleToLifecycleStage(resolvedRole, method),
    isAnonymous: anon,
    uri,
    authorityType: anon ? 'anonymous' : authorityType,
  };
}

function parseSingleTimespan(ts) {
  if (!ts || typeof ts !== 'object') return { startYear: null, endYear: null, displayDate: null };

  let start =
    extractYear(ts.begin_of_the_begin) ??
    extractYear(ts.earliest_begin_time) ??
    extractYear(ts.start);
  let end =
    extractYear(ts.end_of_the_end) ??
    extractYear(ts.latest_end_time) ??
    extractYear(ts.end);

  let displayDate = null;
  for (const ident of asArray(ts.identified_by)) {
    if (typeof ident?.content === 'string' && ident.content.trim()) {
      displayDate = ident.content.trim();
      if (start === null && end === null) {
        const range = extractYearRangeFromString(displayDate);
        start = range.startYear;
        end = range.endYear;
      }
      break;
    }
  }

  return {
    startYear: start,
    endYear: end ?? start,
    displayDate,
  };
}

function extractTimespanYears(obj, relatedNodes = []) {
  const candidates = [obj, ...asArray(relatedNodes)].filter(
    (n) => n && typeof n === 'object'
  );

  for (const node of candidates) {
    for (const ts of asArray(node.timespan)) {
      const parsed = parseSingleTimespan(ts);
      if (parsed.startYear !== null || parsed.endYear !== null) {
        return parsed;
      }
    }

    const directStart = extractYear(node.startYear) ?? extractYear(node.year);
    const directEnd = extractYear(node.endYear) ?? directStart;
    if (directStart !== null || directEnd !== null) {
      return { startYear: directStart, endYear: directEnd, displayDate: null };
    }

    for (const part of asArray(node.part)) {
      for (const ts of asArray(part?.timespan)) {
        const parsed = parseSingleTimespan(ts);
        if (parsed.startYear !== null || parsed.endYear !== null) {
          return parsed;
        }
      }
    }
  }

  return { startYear: null, endYear: null, displayDate: null };
}

function extractMethod(obj, relatedNodes = []) {
  for (const node of [obj, ...asArray(relatedNodes)]) {
    if (!node || typeof node !== 'object') continue;
    if (typeof node.method === 'string' && node.method.trim()) return node.method.trim();
    const classes = asArray(node.classified_as);
    for (const c of classes) {
      if (typeof c._label === 'string' && c._label.trim()) return c._label.trim();
      if (typeof c.label === 'string' && c.label.trim()) return c.label.trim();
    }
  }
  return undefined;
}

function isLocationStatementRef(ref) {
  if (!ref || typeof ref !== 'object') return false;
  const label = String(ref._label || ref.label || '').toLowerCase();
  if (label.includes('provenance location')) return true;

  for (const c of asArray(ref.classified_as)) {
    if (!c || typeof c !== 'object') continue;
    const cId = String(c.id || '').toLowerCase();
    const cLabel = String(c._label || c.label || '').toLowerCase();
    if (cId.includes('300444175') || cLabel.includes('provenance location statement')) {
      return true;
    }
  }
  return false;
}

function isDeprecatedRef(ref) {
  if (!ref || typeof ref !== 'object') return false;
  for (const c of asArray(ref.classified_as)) {
    if (!c || typeof c !== 'object') continue;
    const cId = String(c.id || '').toLowerCase();
    const cLabel = String(c._label || c.label || '').toLowerCase();
    if (cId.includes('deprecated') || cLabel.includes('deprecated')) {
      return true;
    }
  }
  return false;
}

function extractLocationLabel(obj, relatedNodes = []) {
  for (const node of [obj, ...asArray(relatedNodes)]) {
    if (!node || typeof node !== 'object') continue;

    if (typeof node.locationLabel === 'string' && node.locationLabel.trim()) {
      return node.locationLabel.trim();
    }

    if (typeof node.location === 'string' && node.location.trim()) {
      return node.location.trim();
    }
    if (node.location && typeof node.location === 'object') {
      const locLbl = node.location._label || node.location.label;
      if (typeof locLbl === 'string' && locLbl.trim()) return locLbl.trim();
    }

    for (const ref of asArray(node.referred_to_by)) {
      if (!ref || typeof ref !== 'object' || isDeprecatedRef(ref)) continue;
      if (isLocationStatementRef(ref) && typeof ref.content === 'string' && ref.content.trim()) {
        return ref.content.trim();
      }
    }

    for (const part of asArray(node.part)) {
      if (!part || typeof part !== 'object') continue;
      for (const ref of asArray(part.referred_to_by)) {
        if (!ref || typeof ref !== 'object' || isDeprecatedRef(ref)) continue;
        if (isLocationStatementRef(ref) && typeof ref.content === 'string' && ref.content.trim()) {
          return ref.content.trim();
        }
      }
      const partPlaces = asArray(part.took_place_at);
      if (partPlaces.length > 0) {
        const lbl = partPlaces[0]._label || partPlaces[0].label;
        if (typeof lbl === 'string' && lbl.trim()) return lbl.trim();
      }
    }

    const place = asArray(node.took_place_at);
    if (place.length > 0) {
      const lbl = place[0]._label || place[0].label;
      if (typeof lbl === 'string' && lbl.trim()) return lbl.trim();
    }
  }
  return undefined;
}

function extractStatements(obj, relatedNodes = []) {
  const statements = [];
  const seen = new Set();

  const collectFromRefs = (refs) => {
    for (const ref of asArray(refs)) {
      if (!ref || typeof ref !== 'object' || isDeprecatedRef(ref)) continue;
      if (isLocationStatementRef(ref)) continue;
      const content = typeof ref.content === 'string' ? ref.content.trim() : '';
      if (!content || seen.has(content)) continue;
      seen.add(content);
      statements.push(content);
    }
  };

  for (const node of [obj, ...asArray(relatedNodes)]) {
    if (!node || typeof node !== 'object') continue;
    collectFromRefs(node.referred_to_by);
    for (const part of asArray(node.part)) {
      if (part && typeof part === 'object') {
        collectFromRefs(part.referred_to_by);
      }
    }
  }

  return statements;
}

function sortTransferDrafts(drafts) {
  if (drafts.length <= 1) return drafts;

  const idToIdx = new Map();
  drafts.forEach((d, idx) => {
    for (const uri of d.graphIds) {
      if (uri) idToIdx.set(uri, idx);
    }
  });

  const afterMap = new Map();
  drafts.forEach((_, idx) => afterMap.set(idx, new Set()));

  drafts.forEach((d, idx) => {
    for (const prevUri of d.afterIds) {
      const prevIdx = idToIdx.get(prevUri);
      if (prevIdx !== undefined && prevIdx !== idx) {
        afterMap.get(idx).add(prevIdx);
      }
    }
    for (const nextUri of d.beforeIds) {
      const nextIdx = idToIdx.get(nextUri);
      if (nextIdx !== undefined && nextIdx !== idx) {
        afterMap.get(nextIdx).add(idx);
      }
    }
  });

  const hasGraphLinks = Array.from(afterMap.values()).some((s) => s.size > 0);
  if (!hasGraphLinks) {
    return [...drafts].sort((a, b) => {
      if (a.startYear !== null && b.startYear !== null && a.startYear !== b.startYear) {
        return a.startYear - b.startYear;
      }
      if (a.startYear !== null && b.startYear === null) return -1;
      if (a.startYear === null && b.startYear !== null) return 1;
      return a.origOrder - b.origOrder;
    });
  }

  const inDegree = new Array(drafts.length).fill(0);
  const adj = drafts.map(() => []);
  for (const [nodeIdx, prereqs] of afterMap.entries()) {
    inDegree[nodeIdx] = prereqs.size;
    for (const p of prereqs) {
      adj[p].push(nodeIdx);
    }
  }

  const compareDraftIdx = (ia, ib) => {
    const a = drafts[ia];
    const b = drafts[ib];
    if (a.startYear !== null && b.startYear !== null && a.startYear !== b.startYear) {
      return a.startYear - b.startYear;
    }
    return a.origOrder - b.origOrder;
  };

  const ready = [];
  for (let i = 0; i < drafts.length; i++) {
    if (inDegree[i] === 0) ready.push(i);
  }
  ready.sort(compareDraftIdx);

  const ordered = [];
  while (ready.length > 0) {
    const curr = ready.shift();
    ordered.push(drafts[curr]);
    for (const nxt of adj[curr]) {
      inDegree[nxt] -= 1;
      if (inDegree[nxt] === 0) {
        ready.push(nxt);
        ready.sort(compareDraftIdx);
      }
    }
  }

  if (ordered.length < drafts.length) {
    const seen = new Set(ordered);
    for (const d of drafts) {
      if (!seen.has(d)) ordered.push(d);
    }
  }

  return ordered;
}

function extractFromTrailEvents(events, gapThresholdYears) {
  const rawList = events.map((ev, idx) => {
    const rawCat = String(ev.category || ev.type || 'provenance').toLowerCase();
    let category = 'provenance';
    if (rawCat.includes('produc') || rawCat.includes('creat') || rawCat.includes('origin')) {
      category = 'production';
    } else if (rawCat.includes('discov') || rawCat.includes('find') || rawCat.includes('excav')) {
      category = 'discovery';
    } else if (rawCat.includes('exhibit') || rawCat.includes('loan')) {
      category = 'exhibition';
    } else if (
      rawCat.includes('current') ||
      rawCat.includes('keeper') ||
      rawCat.includes('repositor')
    ) {
      category = 'current_location';
    }

    const method = extractMethod(ev);
    const { startYear, endYear, displayDate } = extractTimespanYears(ev);

    const defaultRole =
      category === 'production'
        ? 'maker'
        : category === 'discovery'
        ? 'finder'
        : category === 'exhibition'
        ? 'exhibitor'
        : category === 'current_location'
        ? 'keeper'
        : 'buyer';

    const fromActors = asArray(ev.from).map((a) => makeActor(a, 'seller', method));
    const toActors = asArray(ev.to).map((a) => makeActor(a, defaultRole, method));

    const actors = [];
    if (Array.isArray(ev.actors) && ev.actors.length > 0) {
      for (const a of ev.actors) {
        const parsedRole = a.role || defaultRole;
        const actor = makeActor(a, parsedRole, method);
        if (typeof a.isAnonymous === 'boolean') {
          actor.isAnonymous = a.isAnonymous;
          if (a.isAnonymous) actor.authorityType = 'anonymous';
        }
        actors.push(actor);
      }
    } else {
      actors.push(...fromActors, ...toActors);
    }

    const statements = extractStatements(ev);
    if (typeof ev.note === 'string' && ev.note.trim()) statements.unshift(ev.note.trim());
    if (typeof ev.description === 'string' && ev.description.trim()) {
      statements.unshift(ev.description.trim());
    }

    return {
      index: idx,
      id: ev.id || `event-${idx}`,
      label: normalizeLabel(ev._label ?? ev.label, `${category} #${idx + 1}`),
      activityLabel: typeof ev.activityLabel === 'string' ? ev.activityLabel : null,
      statements,
      category,
      method,
      startYear,
      endYear,
      displayDate,
      locationLabel: ev.locationLabel || extractLocationLabel(ev),
      actors,
      fromActors,
      toActors,
    };
  });

  return finalizeSequence(rawList, gapThresholdYears);
}

function extractFromLinkedArt(doc, gapThresholdYears) {
  const originDrafts = [];

  const prodList = [
    ...asArray(doc.produced_by),
    ...asArray(doc.created_by),
  ];
  for (const prod of prodList) {
    const parts = asArray(prod.part);
    const { startYear, endYear, displayDate } = extractTimespanYears(prod, parts);
    const makers = asArray(prod.carried_out_by).map((m) => makeActor(m, 'maker'));
    originDrafts.push({
      id: prod.id || `prod-${originDrafts.length}`,
      label: normalizeLabel(prod._label ?? prod.label, 'Production'),
      activityLabel: null,
      statements: extractStatements(prod, parts),
      category: 'production',
      method: extractMethod(prod, parts),
      startYear,
      endYear,
      displayDate,
      locationLabel: extractLocationLabel(prod, parts),
      actors: makers,
      fromActors: [],
      toActors: makers,
    });
  }

  const acqList = asArray(doc.changed_ownership_through);
  const transferDrafts = acqList.map((acq, idx) => {
    const partOfNodes = asArray(acq.part_of).filter((p) => p && typeof p === 'object');
    const partNodes = asArray(acq.part).filter((p) => p && typeof p === 'object');
    const related = [...partOfNodes, ...partNodes];

    const method = extractMethod(acq, related);
    const { startYear, endYear, displayDate } = extractTimespanYears(acq, related);

    const fromActors = asArray(acq.transferred_title_from).map((f) =>
      makeActor(f, 'seller', method)
    );
    const toActors = asArray(acq.transferred_title_to).map((t) =>
      makeActor(t, 'buyer', method)
    );

    const primaryPartOf = partOfNodes[0];
    const directLabel = normalizeLabel(acq._label ?? acq.label, '');
    const parentLabel = normalizeLabel(primaryPartOf?._label ?? primaryPartOf?.label, '');

    let primaryLabel = directLabel || parentLabel || 'Ownership Transfer';
    let activityLabel = null;

    if (directLabel && parentLabel && directLabel !== parentLabel) {
      if (/^acquisition$/i.test(directLabel)) {
        primaryLabel = parentLabel;
      } else {
        primaryLabel = directLabel;
        activityLabel = parentLabel;
      }
    }

    const graphIds = [acq.id, ...partOfNodes.map((p) => p.id)].filter(Boolean);
    const afterIds = [
      ...asArray(acq.starts_after_the_end_of),
      ...partOfNodes.flatMap((p) => asArray(p.starts_after_the_end_of)),
    ]
      .map((n) => (typeof n === 'string' ? n : n?.id))
      .filter(Boolean);
    const beforeIds = [
      ...asArray(acq.ends_before_the_start_of),
      ...partOfNodes.flatMap((p) => asArray(p.ends_before_the_start_of)),
    ]
      .map((n) => (typeof n === 'string' ? n : n?.id))
      .filter(Boolean);

    return {
      origOrder: idx,
      graphIds,
      afterIds,
      beforeIds,
      id: acq.id || primaryPartOf?.id || `acq-${idx}`,
      label: primaryLabel,
      activityLabel,
      statements: extractStatements(acq, related),
      category: 'provenance',
      method,
      startYear,
      endYear,
      displayDate,
      locationLabel: extractLocationLabel(acq, related),
      actors: [...fromActors, ...toActors],
      fromActors,
      toActors,
    };
  });

  const sortedTransfers = sortTransferDrafts(transferDrafts);

  const keeperDrafts = [];
  const keepersRaw = [
    ...asArray(doc.current_owner),
    ...asArray(doc.current_keeper),
  ];
  if (keepersRaw.length > 0) {
    const keepers = keepersRaw.map((k) => makeActor(k, 'keeper'));
    const currentLoc =
      doc.current_location && typeof doc.current_location === 'object'
        ? normalizeLabel(doc.current_location._label ?? doc.current_location.label)
        : undefined;

    keeperDrafts.push({
      id: 'current-custody',
      label: 'Current Custody',
      activityLabel: null,
      statements: [],
      category: 'current_location',
      startYear: null,
      endYear: null,
      displayDate: null,
      locationLabel: currentLoc,
      actors: keepers,
      fromActors: [],
      toActors: keepers,
    });
  }

  return finalizeSequence(
    [...originDrafts, ...sortedTransfers, ...keeperDrafts],
    gapThresholdYears
  );
}

function finalizeSequence(items, gapThresholdYears) {
  return items.map((item, idx) => {
    const prev = idx > 0 ? items[idx - 1] : null;
    const prevYear = prev ? prev.endYear ?? prev.startYear : null;
    const currYear = item.startYear ?? item.endYear;

    let gapYearsBefore = 0;
    let hasGapBefore = false;
    if (prevYear !== null && currYear !== null && currYear > prevYear) {
      const diff = currYear - prevYear;
      if (diff >= gapThresholdYears) {
        hasGapBefore = true;
        gapYearsBefore = diff;
      }
    }

    const next = idx < items.length - 1 ? items[idx + 1] : null;
    const nextYear = next ? next.startYear ?? next.endYear : null;
    let durationYears = 1;
    if (currYear !== null && nextYear !== null && nextYear > currYear) {
      durationYears = Math.max(1, nextYear - currYear);
    } else if (
      item.startYear !== null &&
      item.endYear !== null &&
      item.endYear > item.startYear
    ) {
      durationYears = Math.max(1, item.endYear - item.startYear);
    }

    return {
      index: idx,
      id: item.id,
      label: item.label,
      activityLabel: item.activityLabel || null,
      statements: item.statements || [],
      category: item.category,
      method: item.method,
      startYear: item.startYear,
      endYear: item.endYear,
      displayDate: item.displayDate || null,
      durationYears,
      hasGapBefore,
      gapYearsBefore,
      actors: item.actors,
      fromActors: item.fromActors,
      toActors: item.toActors,
      locationLabel: item.locationLabel,
    };
  });
}

export function normalizeProvenanceEvents(input, gapThresholdYears = 15) {
  if (!input) return [];

  let parsed = input;
  if (typeof input === 'string') {
    try {
      parsed = JSON.parse(input);
    } catch {
      return [];
    }
  }

  if (Array.isArray(parsed)) {
    return extractFromTrailEvents(parsed, gapThresholdYears);
  }

  if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.events)) {
      return extractFromTrailEvents(parsed.events, gapThresholdYears);
    }
    return extractFromLinkedArt(parsed, gapThresholdYears);
  }

  return [];
}