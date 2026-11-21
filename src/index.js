import './styles.css';
import {
  buildIiifImageUrl,
  extractObjectMetadata,
  normalizeProvenanceEvents,
  roleToLifecycleStage,
} from './normalize.js';
import { renderSwimlane } from './swimlane.js';
import { renderSankey } from './sankey.js';
import { computeAnalyticsSummary, renderBreakdown } from './breakdown.js';
import { renderSpanChart } from './span-chart.js';
import { renderPlaceHops } from './place-hops.js';
import { renderAuthorityView } from './authority-view.js';
import { renderLedgerView } from './ledger-view.js';

export {
  buildIiifImageUrl,
  extractObjectMetadata,
  normalizeProvenanceEvents,
  roleToLifecycleStage,
  renderSwimlane,
  renderSankey,
  renderBreakdown,
  computeAnalyticsSummary,
  renderSpanChart,
  renderPlaceHops,
  renderAuthorityView,
  renderLedgerView,
};

const BTN_BASE =
  'px-2.5 py-1 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors cursor-pointer';
const BTN_ACTIVE =
  'px-2.5 py-1 text-xs font-medium rounded-md border border-indigo-600 dark:border-indigo-500 bg-indigo-600 text-white transition-colors cursor-pointer';

export class ProvenanceAnalytics {
  constructor(target, options = {}) {
    const el =
      typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) {
      throw new Error('ProvenanceAnalytics: target element not found.');
    }

    this.root = el;
    this.options = options;
    this.events = [];
    this.metadata = {
      title: options.title || null,
      subtitle: options.subtitle || null,
      thumbnailUrl: options.thumbnailUrl || null,
      rawImageUrl: options.thumbnailUrl || null,
      isIiif: false,
      objectId: options.objectId || null,
    };
    this.activeView = 'all';
    this.theme = options.theme === 'light' ? 'light' : 'dark';
    this.sankeyWeightBy = options.sankeyWeightBy || 'count';
    this.activeLegIndex = options.activeLegIndex ?? null;

    this.buildShell();
    this.setTheme(this.theme);

    const presetUrl = options.presetUrl || options.url;
    if (presetUrl) {
      this.loadUrl(presetUrl).catch((err) => {
        if (typeof options.onLoadError === 'function') {
          options.onLoadError(err, presetUrl);
        }
      });
    } else if (options.data) {
      this.setData(options.data);
    }
  }

  buildShell() {
    this.root.innerHTML = '';
    this.root.className =
      'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 font-sans';

    this.headerEl = document.createElement('div');
    this.headerEl.style.display = 'none';

    const toolbar = document.createElement('div');
    toolbar.className =
      'flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-3 border-b border-slate-200 dark:border-slate-800';

    const tabs = document.createElement('div');
    tabs.className = 'flex flex-wrap gap-1.5';

    const viewModes = [
      ['all', 'All Views'],
      ['swimlane', 'Actor Matrix'],
      ['sankey', 'Handoff Flow'],
      ['span', 'Time Span'],
      ['places', 'Place Hops'],
      ['authority', 'Authority'],
      ['ledger', 'Ledger'],
    ];

    const tabButtons = new Map();
    for (const [mode, label] of viewModes) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = this.activeView === mode ? BTN_ACTIVE : BTN_BASE;
      btn.textContent = label;
      btn.addEventListener('click', () => {
        this.activeView = mode;
        tabButtons.forEach((b, k) => {
          b.className = k === mode ? BTN_ACTIVE : BTN_BASE;
        });
        this.applyViewVisibility();
      });
      tabButtons.set(mode, btn);
      tabs.appendChild(btn);
    }

    const controls = document.createElement('div');
    controls.className = 'flex flex-wrap items-center gap-1.5';

    this.weightBtn = document.createElement('button');
    this.weightBtn.type = 'button';
    this.weightBtn.className = BTN_BASE;
    this.syncWeightButtonLabel();
    this.weightBtn.addEventListener('click', () => {
      this.sankeyWeightBy = this.sankeyWeightBy === 'count' ? 'years' : 'count';
      this.syncWeightButtonLabel();
      this.renderCharts();
    });

    this.themeBtn = document.createElement('button');
    this.themeBtn.type = 'button';
    this.themeBtn.className = BTN_BASE;
    this.themeBtn.setAttribute('aria-label', 'Toggle color theme');
    this.syncThemeButtonLabel();
    this.themeBtn.addEventListener('click', () => this.toggleTheme());

    controls.appendChild(this.weightBtn);
    controls.appendChild(this.themeBtn);

    if (this.options.showUrlLoader) {
      const urlInput = document.createElement('input');
      urlInput.type = 'url';
      urlInput.className =
        'min-w-[220px] max-w-sm rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';
      urlInput.placeholder = 'Linked Art JSON-LD URL';
      urlInput.value = this.options.presetUrl || this.options.url || '';
      urlInput.setAttribute('aria-label', 'Linked Art JSON-LD URL');

      const loadUrlBtn = document.createElement('button');
      loadUrlBtn.type = 'button';
      loadUrlBtn.className = BTN_BASE;
      loadUrlBtn.textContent = 'Load URL';
      loadUrlBtn.addEventListener('click', async () => {
        const targetUrl = urlInput.value.trim();
        if (!targetUrl) return;
        loadUrlBtn.disabled = true;
        try {
          await this.loadUrl(targetUrl);
        } catch (err) {
          if (typeof this.options.onLoadError === 'function') {
            this.options.onLoadError(err, targetUrl);
          }
        } finally {
          loadUrlBtn.disabled = false;
        }
      });

      controls.appendChild(urlInput);
      controls.appendChild(loadUrlBtn);
    }

    toolbar.appendChild(tabs);
    toolbar.appendChild(controls);

    const swimlaneScrollCls =
      'overflow-auto max-h-[480px] bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg p-2 mb-2.5';
    const horizScrollCls =
      'overflow-x-auto bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg p-2 mb-2.5';
    const panelCls =
      'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg p-2 mb-2.5';

    this.breakdownEl = document.createElement('div');
    this.swimlaneEl = document.createElement('div');
    this.swimlaneEl.className = swimlaneScrollCls;
    this.sankeyEl = document.createElement('div');
    this.sankeyEl.className = horizScrollCls;
    this.spanEl = document.createElement('div');
    this.spanEl.className = horizScrollCls;
    this.placesEl = document.createElement('div');
    this.placesEl.className = panelCls;
    this.authorityEl = document.createElement('div');
    this.authorityEl.className = panelCls;
    this.ledgerEl = document.createElement('div');
    this.ledgerEl.className = `${horizScrollCls} max-h-[360px] overflow-y-auto`;

    this.root.appendChild(this.headerEl);
    this.root.appendChild(toolbar);
    this.root.appendChild(this.breakdownEl);
    this.root.appendChild(this.swimlaneEl);
    this.root.appendChild(this.sankeyEl);
    this.root.appendChild(this.spanEl);
    this.root.appendChild(this.placesEl);
    this.root.appendChild(this.authorityEl);
    this.root.appendChild(this.ledgerEl);
  }

  renderHeader() {
    this.headerEl.innerHTML = '';
    const { title, subtitle, thumbnailUrl, objectId } = this.metadata;

    if (!title && !thumbnailUrl) {
      this.headerEl.style.display = 'none';
      return;
    }

    this.headerEl.style.display = 'flex';
    this.headerEl.className =
      'flex items-center gap-3.5 pb-3 mb-3 border-b border-slate-200 dark:border-slate-800';

    if (thumbnailUrl) {
      const imgWrap = document.createElement('div');
      imgWrap.className =
        'w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center';

      const img = document.createElement('img');
      img.src = thumbnailUrl;
      img.alt = title || 'Object thumbnail';
      img.loading = 'lazy';
      img.className = 'w-full h-full object-cover';
      img.addEventListener('error', () => {
        if (
          this.metadata.isIiif &&
          this.metadata.rawImageUrl &&
          !img.dataset.retriedV3
        ) {
          img.dataset.retriedV3 = '1';
          const w = this.options.thumbnailWidth ?? 160;
          img.src = buildIiifImageUrl(this.metadata.rawImageUrl, {
            apiVersion: '3',
            maxWidth: w,
            format: this.options.iiifFormat ?? 'jpg',
          });
          return;
        }
        imgWrap.remove();
      });

      imgWrap.appendChild(img);
      this.headerEl.appendChild(imgWrap);
    }

    const textWrap = document.createElement('div');
    textWrap.className = 'min-w-0 flex-1';

    if (title) {
      const h2 = document.createElement('h2');
      h2.className =
        'text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 truncate';
      h2.textContent = title;
      h2.title = title;
      textWrap.appendChild(h2);
    }

    if (subtitle || objectId) {
      const metaRow = document.createElement('div');
      metaRow.className =
        'flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400';

      if (subtitle) {
        const subSpan = document.createElement('span');
        subSpan.textContent = subtitle;
        metaRow.appendChild(subSpan);
      }

      if (objectId && objectId.startsWith('http')) {
        const link = document.createElement('a');
        link.href = objectId;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className =
          'text-indigo-600 dark:text-indigo-400 hover:underline truncate max-w-xs';
        link.textContent = objectId;
        metaRow.appendChild(link);
      }

      textWrap.appendChild(metaRow);
    }

    this.headerEl.appendChild(textWrap);
  }

  syncWeightButtonLabel() {
    this.weightBtn.textContent =
      this.sankeyWeightBy === 'count' ? 'Flow: By Event' : 'Flow: By Years';
  }

  syncThemeButtonLabel() {
    if (!this.themeBtn) return;
    const isDark = this.theme === 'dark';
    this.themeBtn.textContent = isDark ? '☀ Light' : '☾ Dark';
    this.themeBtn.setAttribute('aria-pressed', String(isDark));
  }

  applyViewVisibility() {
    const v = this.activeView;
    this.breakdownEl.style.display = v === 'all' ? '' : 'none';
    this.swimlaneEl.style.display = v === 'all' || v === 'swimlane' ? '' : 'none';
    this.sankeyEl.style.display = v === 'all' || v === 'sankey' ? '' : 'none';
    this.spanEl.style.display = v === 'all' || v === 'span' ? '' : 'none';
    this.placesEl.style.display = v === 'all' || v === 'places' ? '' : 'none';
    this.authorityEl.style.display = v === 'all' || v === 'authority' ? '' : 'none';
    this.ledgerEl.style.display = v === 'all' || v === 'ledger' ? '' : 'none';
  }

  setData(data) {
    const extracted = extractObjectMetadata(data, {
      thumbnailWidth: this.options.thumbnailWidth ?? 160,
      thumbnailHeight: this.options.thumbnailHeight ?? 160,
      iiifVersion: this.options.iiifVersion ?? '2',
      iiifSize: this.options.iiifSize ?? null,
      iiifFormat: this.options.iiifFormat ?? 'jpg',
      forceIiifSize: Boolean(this.options.forceIiifSize),
    });

    this.metadata = {
      title: extracted.title || this.options.title || null,
      subtitle: extracted.subtitle || this.options.subtitle || null,
      thumbnailUrl: extracted.thumbnailUrl || this.options.thumbnailUrl || null,
      rawImageUrl: extracted.rawImageUrl || this.options.thumbnailUrl || null,
      isIiif: extracted.isIiif,
      objectId: extracted.objectId || this.options.objectId || null,
    };

    this.events = normalizeProvenanceEvents(
      data,
      this.options.gapThresholdYears ?? 15
    );
    this.renderHeader();
    this.renderCharts();
    return this.events;
  }

  async loadUrl(url) {
    const res = await fetch(url, this.options.fetchOptions);
    if (!res.ok) {
      throw new Error(`Failed to fetch provenance data (${res.status})`);
    }
    const json = await res.json();
    const events = this.setData(json);
    if (typeof this.options.onLoad === 'function') {
      this.options.onLoad(url, events);
    }
    return events;
  }

  setActiveLeg(legIndex) {
    this.activeLegIndex = legIndex;
    this.renderCharts();
  }

  setTheme(theme) {
    this.theme = theme === 'light' ? 'light' : 'dark';
    const isDark = this.theme === 'dark';

    this.root.setAttribute('data-theme', this.theme);
    this.root.classList.toggle('dark', isDark);

    if (this.options.syncDocumentTheme !== false && typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDark);
    }

    this.syncThemeButtonLabel();
  }

  toggleTheme() {
    this.setTheme(this.theme === 'dark' ? 'light' : 'dark');
  }

  getSummary() {
    return computeAnalyticsSummary(this.events);
  }

  renderCharts() {
    const handleSelect = (legIndex, ev) => {
      this.activeLegIndex = legIndex;
      this.renderCharts();
      if (typeof this.options.onSelectLeg === 'function') {
        this.options.onSelectLeg(legIndex, ev);
      }
    };

    const viewOpts = {
      activeLegIndex: this.activeLegIndex,
      onSelectLeg: handleSelect,
    };

    renderBreakdown(this.breakdownEl, this.events);
    renderSwimlane(this.swimlaneEl, this.events, viewOpts);
    renderSankey(this.sankeyEl, this.events, {
      ...viewOpts,
      weightBy: this.sankeyWeightBy,
    });
    renderSpanChart(this.spanEl, this.events, viewOpts);
    renderPlaceHops(this.placesEl, this.events, viewOpts);
    renderAuthorityView(this.authorityEl, this.events);
    renderLedgerView(this.ledgerEl, this.events, viewOpts);
    this.applyViewVisibility();
  }
}