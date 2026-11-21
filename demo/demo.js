import '../src/styles.css';
import { ProvenanceAnalytics } from '../src/index.js';

const BELVEDERE_ANTINOUS_URL =
  'https://data.getty.edu/museum/collection/object/11128b1b-146e-41d6-b92e-879376aaa4f9';

const PIEBALD_HORSE_URL =
  'https://data.getty.edu/museum/collection/object/efd3e697-3407-4cb5-9ab9-208d1c0a22d0';

const SAMPLE_BELVEDERE_ANTINOUS = {
  '@context': 'https://linked.art/ns/v1/linked-art.json',
  id: BELVEDERE_ANTINOUS_URL,
  type: 'HumanMadeObject',
  _label: 'Belvedere Antinous',
  identified_by: [
    {
      type: 'Name',
      content: 'Belvedere Antinous',
      classified_as: [
        { id: 'http://vocab.getty.edu/aat/300404670', type: 'Type', _label: 'Primary Name' },
      ],
    },
    {
      type: 'Identifier',
      content: '2014.40',
      classified_as: [
        { id: 'http://vocab.getty.edu/aat/300312355', type: 'Type', _label: 'Accession Number' },
      ],
    },
  ],
  produced_by: {
    type: 'Production',
    _label: 'Production attributed to Pietro Tacca',
    timespan: {
      begin_of_the_begin: '1625-01-01T00:00:00',
      end_of_the_end: '1635-12-31T00:00:00',
    },
    carried_out_by: [
      {
        id: 'https://vocab.getty.edu/ulan/500021530',
        type: 'Person',
        _label: 'Pietro Tacca',
        identified_by: [
          { type: 'Name', content: 'https://vocab.getty.edu/ulan/500021530' },
        ],
      },
    ],
    took_place_at: [{ type: 'Place', _label: 'Florence, Italy' }],
  },
  changed_ownership_through: [
    {
      type: 'Acquisition',
      _label: 'Acquired by King Louis XIV',
      classified_as: [{ type: 'Type', _label: 'Sales' }],
      timespan: {
        begin_of_the_begin: '1660-01-01T00:00:00',
        end_of_the_end: '1715-09-01T00:00:00',
      },
      transferred_title_from: [{ type: 'Person', _label: 'Unknown' }],
      transferred_title_to: [{ type: 'Person', _label: 'Louis XIV, King of France' }],
      referred_to_by: [
        {
          type: 'LinguisticObject',
          _label: 'Provenance Location',
          classified_as: [
            { id: 'http://vocab.getty.edu/aat/300444175', type: 'Type', _label: 'Provenance Location Statement' },
          ],
          content: 'Paris, France',
        },
      ],
    },
    {
      type: 'Acquisition',
      _label: 'Acquisition by J. Paul Getty Museum',
      classified_as: [{ type: 'Type', _label: 'Sales' }],
      timespan: {
        begin_of_the_begin: '2014-01-01T00:00:00',
        end_of_the_end: '2014-12-31T00:00:00',
      },
      transferred_title_from: [{ type: 'Group', _label: 'Unknown' }],
      transferred_title_to: [
        {
          id: 'https://www.wikidata.org/wiki/Q731126',
          type: 'Group',
          _label: 'J. Paul Getty Museum',
        },
      ],
      referred_to_by: [
        {
          type: 'LinguisticObject',
          _label: 'Provenance Location',
          classified_as: [
            { id: 'http://vocab.getty.edu/aat/300444175', type: 'Type', _label: 'Provenance Location Statement' },
          ],
          content: 'Los Angeles, California, United States',
        },
      ],
    },
  ],
  current_location: {
    type: 'Place',
    _label: 'Los Angeles, California, United States',
  },
  current_owner: [
    {
      id: 'https://www.wikidata.org/wiki/Q731126',
      type: 'Group',
      _label: 'J. Paul Getty Museum',
    },
  ],
};

const SAMPLE_PIEBALD_HORSE = {
  '@context': 'https://linked.art/ns/v1/linked-art.json',
  id: PIEBALD_HORSE_URL,
  type: 'HumanMadeObject',
  _label: 'Piebald Horse',
  identified_by: [
    {
      type: 'Name',
      content: 'Piebald Horse',
      classified_as: [
        { id: 'http://vocab.getty.edu/aat/300404670', type: 'Type', _label: 'Primary Name' },
      ],
    },
    {
      type: 'Identifier',
      content: '88.PA.87',
      classified_as: [
        { id: 'http://vocab.getty.edu/aat/300312355', type: 'Type', _label: 'Accession Number' },
      ],
    },
  ],
  produced_by: {
    type: 'Production',
    _label: 'Production by Paulus Potter',
    timespan: {
      begin_of_the_begin: '1650-01-01T00:00:00',
      end_of_the_end: '1654-12-31T00:00:00',
    },
    carried_out_by: [
      {
        id: 'https://vocab.getty.edu/ulan/500012008',
        type: 'Person',
        _label: 'Paulus Potter',
        identified_by: [
          { type: 'Name', content: 'https://vocab.getty.edu/ulan/500012008' },
        ],
      },
    ],
    took_place_at: [{ type: 'Place', _label: 'The Hague, Netherlands' }],
  },
  changed_ownership_through: [
    {
      type: 'Acquisition',
      _label: 'Sale, Amsterdam',
      classified_as: [{ type: 'Type', _label: 'Sales' }],
      timespan: {
        begin_of_the_begin: '1765-06-05T00:00:00',
        end_of_the_end: '1765-06-05T00:00:00',
      },
      transferred_title_from: [{ type: 'Person', _label: 'Unknown' }],
      transferred_title_to: [{ type: 'Person', _label: 'Private Collector' }],
      referred_to_by: [
        {
          type: 'LinguisticObject',
          _label: 'Provenance Location',
          classified_as: [
            { id: 'http://vocab.getty.edu/aat/300444175', type: 'Type', _label: 'Provenance Location Statement' },
          ],
          content: 'Amsterdam, Netherlands',
        },
      ],
    },
    {
      type: 'Acquisition',
      _label: 'Sale, London',
      classified_as: [{ type: 'Type', _label: 'Sales' }],
      timespan: {
        begin_of_the_begin: '1848-05-12T00:00:00',
        end_of_the_end: '1848-05-12T00:00:00',
      },
      transferred_title_from: [{ type: 'Person', _label: 'Private Collector' }],
      transferred_title_to: [{ type: 'Group', _label: "Christie's" }],
      referred_to_by: [
        {
          type: 'LinguisticObject',
          _label: 'Provenance Location',
          classified_as: [
            { id: 'http://vocab.getty.edu/aat/300444175', type: 'Type', _label: 'Provenance Location Statement' },
          ],
          content: 'London, England',
        },
      ],
    },
    {
      type: 'Acquisition',
      _label: 'Acquisition by J. Paul Getty Museum',
      classified_as: [{ type: 'Type', _label: 'Sales' }],
      timespan: {
        begin_of_the_begin: '1988-01-01T00:00:00',
        end_of_the_end: '1988-12-31T00:00:00',
      },
      transferred_title_from: [{ type: 'Group', _label: 'Unknown' }],
      transferred_title_to: [
        {
          id: 'https://www.wikidata.org/wiki/Q731126',
          type: 'Group',
          _label: 'J. Paul Getty Museum',
        },
      ],
      referred_to_by: [
        {
          type: 'LinguisticObject',
          _label: 'Provenance Location',
          classified_as: [
            { id: 'http://vocab.getty.edu/aat/300444175', type: 'Type', _label: 'Provenance Location Statement' },
          ],
          content: 'Los Angeles, California, United States',
        },
        {
          type: 'LinguisticObject',
          _label: 'Provenance Proofed Statement',
          content: 'Nazi era restituted',
        },
      ],
    },
  ],
  current_location: {
    type: 'Place',
    _label: 'Los Angeles, California, United States',
  },
  current_owner: [
    {
      id: 'https://www.wikidata.org/wiki/Q731126',
      type: 'Group',
      _label: 'J. Paul Getty Museum',
    },
  ],
};

const SAMPLE_LINKED_ART = {
  '@context': 'https://linked.art/ns/v1/linked-art.json',
  id: 'https://example.org/object/demo-1',
  type: 'HumanMadeObject',
  _label: 'Bronze Vessel with Inscription',
  produced_by: {
    type: 'Production',
    _label: 'Workshop Production',
    timespan: { begin_of_the_begin: '1840-01-01T00:00:00', end_of_the_end: '1845-12-31T00:00:00' },
    carried_out_by: [
      { id: 'https://vocab.getty.edu/ulan/500000001', type: 'Person', _label: 'Henri Moreau' },
    ],
    took_place_at: [{ type: 'Place', _label: 'Lyon, France' }],
  },
  changed_ownership_through: [
    {
      type: 'Acquisition',
      _label: 'First Sale',
      classified_as: [{ _label: 'Sales' }],
      timespan: { begin_of_the_begin: '1846-05-12T00:00:00' },
      transferred_title_from: [{ type: 'Person', _label: 'Henri Moreau' }],
      transferred_title_to: [{ type: 'Person', _label: 'Unknown' }],
      took_place_at: [{ type: 'Place', _label: 'Paris, France' }],
    },
    {
      type: 'Acquisition',
      _label: 'London Auction Lot 114',
      classified_as: [{ _label: 'Sales' }],
      timespan: { begin_of_the_begin: '1924-03-19T00:00:00' },
      transferred_title_from: [{ type: 'Person', _label: 'Unknown' }],
      transferred_title_to: [{ type: 'Group', _label: 'Sotheby & Co.' }],
      took_place_at: [{ type: 'Place', _label: 'London, England' }],
    },
    {
      type: 'Acquisition',
      _label: 'Private Acquisition',
      classified_as: [{ _label: 'Sales' }],
      timespan: { begin_of_the_begin: '1925-07-01T00:00:00' },
      transferred_title_from: [{ type: 'Group', _label: 'Sotheby & Co.' }],
      transferred_title_to: [{ type: 'Person', _label: 'A. M. Sterling' }],
      took_place_at: [{ type: 'Place', _label: 'London, England' }],
    },
  ],
  current_location: {
    type: 'Place',
    _label: 'London, England',
  },
  current_owner: [
    { id: 'https://www.wikidata.org/wiki/Q6373', type: 'Group', _label: 'British Museum' },
  ],
};

const SAMPLE_TRAIL_EVENTS = [
  {
    id: 'leg-0',
    label: 'Roman Workshop Production',
    category: 'production',
    startYear: 120,
    endYear: 140,
    locationLabel: 'Lower Rhine',
    actors: [{ id: 'workshop-rhine', label: 'Lower Rhine Foundry', role: 'maker' }],
  },
  {
    id: 'leg-1',
    label: 'Agricultural Discovery',
    category: 'discovery',
    startYear: 1854,
    endYear: 1854,
    locationLabel: 'Rhineland',
    actors: [{ id: 'finder-1', label: 'Unknown', role: 'finder', isAnonymous: true }],
  },
  {
    id: 'leg-2',
    label: 'Dealer Consignment',
    category: 'provenance',
    method: 'Sales',
    startYear: 1856,
    endYear: 1856,
    locationLabel: 'Cologne',
    from: [{ id: 'finder-1', label: 'Unknown' }],
    to: [{ id: 'dealer-hoffmann', label: 'Hoffmann Antiquitäten' }],
  },
  {
    id: 'leg-3',
    label: 'Travelling Antiquities Loan',
    category: 'exhibition',
    startYear: 1962,
    endYear: 1963,
    locationLabel: 'Bonn',
    actors: [{ id: 'exh-1', label: 'Rheinisches Landesmuseum', role: 'exhibitor' }],
  },
  {
    id: 'leg-4',
    label: 'Museum Accession',
    category: 'current_location',
    startYear: 1964,
    endYear: 1964,
    locationLabel: 'Oxford',
    actors: [{ id: 'keeper-1', label: 'Ashmolean Museum', role: 'keeper' }],
  },
];

const statusEl = document.getElementById('status');
const urlInput = document.getElementById('url-input');
const fileInput = document.getElementById('json-file-input');
const demoParams = new URLSearchParams(window.location.search);
const presetUrlParam = demoParams.get('url')?.trim();
const presetName = demoParams.get('preset')?.toLowerCase();
const namedPresetUrl =
  presetName === 'piebald'
    ? PIEBALD_HORSE_URL
    : presetName === 'antinous'
      ? BELVEDERE_ANTINOUS_URL
      : null;
const presetUrl = presetUrlParam || namedPresetUrl;
const hideLoadControls =
  demoParams.get('hideLoadControls') === '1' ||
  demoParams.get('hideLoadControls')?.toLowerCase() === 'true';

if (hideLoadControls) {
  document.getElementById('demo-load-controls')?.remove();
}

urlInput.value = BELVEDERE_ANTINOUS_URL;

const analytics = new ProvenanceAnalytics('#analytics', {
  ...(presetUrl
    ? { presetUrl }
    : { data: SAMPLE_BELVEDERE_ANTINOUS }),
  theme: 'dark',
  gapThresholdYears: 15,
  onLoad: (targetUrl, events) => {
    statusEl.textContent = `Loaded Linked Art JSON-LD from ${targetUrl} (${events.length} events).`;
  },
  onLoadError: (error) => {
    const fallback =
      presetUrl === PIEBALD_HORSE_URL
        ? SAMPLE_PIEBALD_HORSE
        : SAMPLE_BELVEDERE_ANTINOUS;
    analytics.setData(fallback);
    statusEl.textContent = `Preset URL unavailable. Loaded built-in Linked Art sample (${analytics.events.length} events).`;
  },
  onSelectLeg: (legIndex, event) => {
    analytics.setActiveLeg(legIndex);
    statusEl.textContent = `Selected activeLegIndex: ${legIndex} — "${event.label}" (${event.category}, ${event.startYear ?? 'undated'}${event.locationLabel ? `, ${event.locationLabel}` : ''})`;
  },
});

async function loadGettyPreset(url, fallbackData, label) {
  urlInput.value = url;
  statusEl.textContent = `Fetching ${url}...`;
  try {
    await analytics.loadUrl(url);
    statusEl.textContent = `Loaded live Linked Art record for ${label} from Getty (${analytics.events.length} events).`;
  } catch {
    analytics.setData(fallbackData);
    statusEl.textContent = `Loaded built-in ${label} Linked Art sample (${analytics.events.length} events; live fetch fallback).`;
  }
}

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const rawText = await file.text();
    const parsed = JSON.parse(rawText);
    analytics.setData(parsed);
    statusEl.textContent = `Loaded JSON file "${file.name}" (${analytics.events.length} normalized events).`;
  } catch (err) {
    statusEl.textContent = `Failed to parse "${file.name}": ${err.message}`;
  }
});

document.getElementById('sample-antinous-btn').addEventListener('click', () => {
  loadGettyPreset(
    BELVEDERE_ANTINOUS_URL,
    SAMPLE_BELVEDERE_ANTINOUS,
    'Belvedere Antinous'
  );
});

document.getElementById('sample-piebald-btn').addEventListener('click', () => {
  loadGettyPreset(
    PIEBALD_HORSE_URL,
    SAMPLE_PIEBALD_HORSE,
    'Piebald Horse'
  );
});

document.getElementById('sample-linked-art-btn').addEventListener('click', () => {
  analytics.setData(SAMPLE_LINKED_ART);
  statusEl.textContent = `Loaded sample Linked Art object (${analytics.events.length} events).`;
});

document.getElementById('sample-trail-btn').addEventListener('click', () => {
  analytics.setData(SAMPLE_TRAIL_EVENTS);
  statusEl.textContent = `Loaded sample trail events array (${analytics.events.length} events).`;
});

document.getElementById('load-url-btn').addEventListener('click', async () => {
  const targetUrl = urlInput.value.trim();
  if (!targetUrl) return;
  statusEl.textContent = `Fetching ${targetUrl}...`;
  try {
    await analytics.loadUrl(targetUrl);
    statusEl.textContent = `Loaded Linked Art JSON-LD from ${targetUrl} (${analytics.events.length} events).`;
  } catch (err) {
    statusEl.textContent = `Error: ${err.message}`;
  }
});