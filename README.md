# Provenance Analytics

`@micropasts/provenance-analytics` renders Linked Art provenance and museum-object chronology as interactive SVG and HTML visualizations. It supports Linked Art JSON objects, trail event arrays, and a `{ "events": [...] }` wrapper.

The package has no runtime dependencies. It provides an all-in-one `ProvenanceAnalytics` component plus named renderer utilities.

## Features

- Chronological actor-to-event swimlane
- Weighted actor handoff Sankey
- Chronological span and gap chart
- Place-hop timeline
- Authority and lifecycle activity summaries
- Provenance ledger
- Light and dark themes
- IIIF thumbnail URL handling
- Event selection synchronization

## Installation

```bash
npm install @micropasts/provenance-analytics
```

Load the component styles once in your application:

```js
import '@micropasts/provenance-analytics/style.css';
```

## Quick start

```html
<div id="provenance"></div>
```

```js
import '@micropasts/provenance-analytics/style.css';
import { ProvenanceAnalytics } from '@micropasts/provenance-analytics';

const analytics = new ProvenanceAnalytics('#provenance', {
  data: linkedArtObject,
  theme: 'light',
});
```

The same component can fetch a remote JSON endpoint:

```js
const analytics = new ProvenanceAnalytics('#provenance', {
  presetUrl: '/api/objects/123',
  theme: 'dark',
  fetchOptions: {
    headers: { Accept: 'application/json' },
  },
});
```

`presetUrl` loads automatically when the component is constructed. It is an
alias for `url`, and takes precedence over `data` when both are supplied.
Set `showUrlLoader: true` only if you want to display an editable URL input
and load button inside the component. It is `false` by default, so standalone
embeds do not show any URL-loading controls.

```js
const analytics = new ProvenanceAnalytics('#provenance', {
  presetUrl: '/api/objects/123',
  showUrlLoader: false,
  onLoad: (url, events) => console.log(`Loaded ${events.length} events from ${url}`),
  onLoadError: (error, url) => console.error(`Could not load ${url}`, error),
});
```

## Constructor

```js
new ProvenanceAnalytics(target, options)
```

`target` is either a DOM element or a CSS selector that resolves to one element.

## Props

The `options` object is passed to the constructor.

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `Object \| Array \| string` | `undefined` | Linked Art object, trail-event array, event wrapper, or JSON string to render. |
| `url` | `string` | `undefined` | JSON endpoint used to load provenance data. |
| `presetUrl` | `string` | `undefined` | JSON endpoint loaded automatically during construction. Alias for `url`; takes precedence over `data`. |
| `showUrlLoader` | `boolean` | `false` | Shows an editable URL input and Load URL button inside the component. |
| `fetchOptions` | `RequestInit` | `undefined` | Options passed to `fetch()` for a URL request. |
| `theme` | `'light' \| 'dark'` | `'dark'` | Initial component theme. |
| `syncDocumentTheme` | `boolean` | `true` | Also adds or removes Tailwind's `dark` class on `document.documentElement`. |
| `activeLegIndex` | `number \| null` | `null` | Initially selected provenance event index. |
| `gapThresholdYears` | `number` | `15` | Minimum gap between dated events before a gap is marked. |
| `sankeyWeightBy` | `'count' \| 'years'` | `'count'` | Initial Sankey weighting mode. |
| `title` | `string` | `null` | Header title fallback when data metadata does not provide one. |
| `subtitle` | `string` | `null` | Header subtitle or accession fallback. |
| `objectId` | `string` | `null` | Object URL or identifier fallback. |
| `thumbnailUrl` | `string` | `null` | Image fallback URL. |
| `thumbnailWidth` | `number` | `160` | Maximum IIIF thumbnail width. |
| `thumbnailHeight` | `number` | `160` | Maximum IIIF thumbnail height. |
| `iiifVersion` | `'2' \| '3'` | `'2'` | IIIF API version used when generating an image URL. |
| `iiifSize` | `string \| null` | `null` | Explicit IIIF size parameter override, such as `400,`. |
| `iiifFormat` | `string` | `'jpg'` | IIIF image format. |
| `forceIiifSize` | `boolean` | `false` | Converts a supplied thumbnail URL through IIIF sizing even if it is not detected as IIIF. |
| `onSelectLeg` | `(legIndex, event) => void` | `undefined` | Called when the user selects an event in a chart. |
| `onLoad` | `(url, events) => void` | `undefined` | Called after a preset or user-loaded URL is fetched and normalized. |
| `onLoadError` | `(error, url) => void` | `undefined` | Called if a preset or user-loaded URL fails. |

## Public methods

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `setData(data)` | Linked Art object, array, event wrapper, or JSON string | `Array` normalized events | Replaces the component data and re-renders all views. |
| `loadUrl(url)` | URL string | `Promise<Array>` | Fetches JSON, normalizes it, and re-renders all views. |
| `setActiveLeg(index)` | Number or `null` | `void` | Selects an event and re-renders synchronized chart views. |
| `setTheme(theme)` | `'light' \| 'dark'` | `void` | Changes the component theme. |
| `toggleTheme()` | None | `void` | Switches between light and dark themes. |
| `getSummary()` | None | `Object` | Returns normalized analytics counts and scores. |

Example:

```js
analytics.setTheme('dark');
analytics.setActiveLeg(3);

const summary = analytics.getSummary();
console.log(summary.documentedSpanYears);
```

## Linked Art input

The normalizer accepts a standard Linked Art HumanMadeObject containing fields such as `_label`, `identified_by`, `produced_by`, `discovered_by`, `changed_ownership_through`, `used_for`, `current_location`, and `current_owner`.

IIIF images are read from `representation` or `subject_of` entries and can also be supplied directly:

```js
const linkedArtObject = {
  '@context': 'https://linked.art/ns/v1/linked-art.json',
  id: 'https://example.org/object/123',
  type: 'HumanMadeObject',
  _label: 'Example Object',
  thumbnailUrl: 'https://example.org/iiif/image/full/full/0/default.jpg',
  identified_by: [
    {
      type: 'Identifier',
      content: 'ACC-123',
      classified_as: [{ _label: 'Accession Number' }],
    },
  ],
};
```

You can also pass already normalized trail events:

```js
const events = [
  {
    index: 1,
    label: 'Sale',
    category: 'provenance',
    startYear: 1900,
    endYear: 1900,
    locationLabel: 'Paris',
  },
];

analytics.setData(events);
```

## Named exports

For custom layouts or applications that do not need the complete shell, import individual functions:

```js
import {
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
} from '@micropasts/provenance-analytics';
```

Each renderer expects a container DOM element as its first argument and normalized events from `normalizeProvenanceEvents` as its second argument.

```js
const events = normalizeProvenanceEvents(linkedArtObject, 15);
const container = document.querySelector('#swimlane');

renderSwimlane(container, events, {
  activeLegIndex: null,
  onSelectLeg: (index, event) => console.log(index, event),
});
```

## Standalone browser usage

In an npm-based browser application, use the ES module and stylesheet imports shown above. The package exposes both ES module and CommonJS builds for bundlers and Node-compatible consumers.

The package `browser` entry points to the ES module build. CSS is available as `@micropasts/provenance-analytics/style.css`.

## Development

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Publishing

Build and publish the public package:

```bash
npm login
npm run publish:public
```

To inspect the exact contents before publishing:

```bash
npm pack --dry-run
```

The package publish hook builds `dist` automatically before `npm publish` or `npm pack`.

## Demo deployment modes

The included demo can start from a preset URL and hide all URL/file controls:

```text
demo/?preset=antinous&hideLoadControls=true
demo/?preset=piebald&hideLoadControls=true
demo/?url=https%3A%2F%2Fexample.org%2Fobject.json&hideLoadControls=true
```

- `preset=antinous` loads the built-in Antinous Getty endpoint.
- `preset=piebald` loads the built-in Piebald Horse Getty endpoint.
- `url=` accepts a custom encoded Linked Art JSON endpoint.
- `hideLoadControls=true` removes the demo's external file and URL controls.

## License

[MIT](./LICENSE)
