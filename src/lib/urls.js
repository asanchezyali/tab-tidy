// Pure helpers for comparing and ordering tab URLs. No chrome.* calls here,
// so everything in this file runs under `node --test`.

export const DEFAULT_SETTINGS = Object.freeze({
  // Switch to the existing tab when a new tab opens a page that is already open.
  blockDuplicates: true,
  // Look for the existing tab in every window, not just the current one.
  searchAllWindows: true,
  // "page#a" and "page#b" count as the same page.
  ignoreHash: true,
  // "page?a=1" and "page?a=2" count as the same page.
  ignoreQuery: false,
  // "example.com/docs/" and "example.com/docs" count as the same page.
  ignoreTrailingSlash: true,
  // "www.example.com" and "example.com" count as the same site.
  ignoreWww: false,
  // Keep every window sorted by URL as tabs open and navigate.
  autoSort: true,
});

const DEDUPABLE_PROTOCOLS = new Set(['http:', 'https:', 'file:', 'ftp:']);

// Pages a fresh tab passes through before it has a real destination.
const PLACEHOLDER_URLS = new Set([
  'about:blank',
  'chrome://newtab/',
  'chrome://new-tab-page/',
  'brave://newtab/',
  'edge://newtab/',
]);

export function isPlaceholderUrl(url) {
  return !url || PLACEHOLDER_URLS.has(url);
}

export function parseUrl(url) {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

// Only regular web pages and files take part in deduplication. Browser pages
// (chrome://, brave://, extension pages) and placeholders are left alone.
export function isDedupable(url) {
  const parsed = parseUrl(url);
  return parsed !== null && DEDUPABLE_PROTOCOLS.has(parsed.protocol);
}

// Returns the key two tabs must share to count as duplicates, or null when the
// URL should never be deduplicated.
export function normalizeUrl(url, settings = DEFAULT_SETTINGS) {
  if (!isDedupable(url)) return null;
  const parsed = parseUrl(url);

  let host = parsed.host.toLowerCase();
  if (settings.ignoreWww && host.startsWith('www.')) host = host.slice(4);

  let path = parsed.pathname;
  if (settings.ignoreTrailingSlash && path.length > 1 && path.endsWith('/')) {
    path = path.replace(/\/+$/, '');
  }

  let search = '';
  if (!settings.ignoreQuery && parsed.search) {
    const params = new URLSearchParams(parsed.search);
    params.sort();
    const sorted = params.toString();
    search = sorted ? `?${sorted}` : '';
  }

  const hash = settings.ignoreHash ? '' : parsed.hash;
  return `${parsed.protocol}//${host}${path}${search}${hash}`;
}

// Sort key used to organize tabs: registrable-ish domain first, so that
// docs.example.com and example.com sit together, then the full URL.
export function sortKey(url) {
  const parsed = parseUrl(url);
  if (!parsed || !parsed.hostname) return ['~', url ?? ''];
  const labels = parsed.hostname.toLowerCase().replace(/^www\./, '').split('.');
  const site = labels.slice(-2).join('.');
  const subdomains = labels.slice(0, -2).reverse().join('.');
  return [site, `${subdomains}|${parsed.pathname}${parsed.search}${parsed.hash}`];
}

export function compareUrls(a, b) {
  const [siteA, restA] = sortKey(a);
  const [siteB, restB] = sortKey(b);
  return siteA.localeCompare(siteB) || restA.localeCompare(restB);
}

const NO_GROUP = -1;

// A tab that is still loading has its destination in pendingUrl.
function tabUrl(tab) {
  return tab.url || tab.pendingUrl || '';
}

function isFree(tab) {
  return !tab.pinned && (tab.groupId ?? NO_GROUP) === NO_GROUP;
}

// Given the tabs of one window ({id, url, index, pinned, groupId}), returns the
// moves ({id, index}) that sort them by URL. Pinned tabs and tab groups stay
// where they are: only each run of consecutive loose tabs is sorted, because
// moving a tab across a group would pull it into or out of that group.
// Applying the moves in order, one at a time, gives the sorted window. Moves
// that would leave a tab where it already is are skipped, so a sorted window
// returns no moves at all.
export function sortMoves(tabs) {
  const ordered = [...tabs].sort((a, b) => a.index - b.index);
  const runs = [];
  let current = [];
  for (const tab of ordered) {
    if (isFree(tab)) {
      current.push(tab);
    } else if (current.length) {
      runs.push(current);
      current = [];
    }
  }
  if (current.length) runs.push(current);

  const moves = [];
  for (const run of runs) {
    const start = run[0].index;
    const sorted = [...run].sort(
      (a, b) => compareUrls(tabUrl(a), tabUrl(b)) || a.index - b.index,
    );
    // Simulate the run as chrome.tabs.move changes it: remove, then insert.
    const order = run.map((tab) => tab.id);
    sorted.forEach((tab, offset) => {
      const from = order.indexOf(tab.id);
      if (from === offset) return;
      order.splice(from, 1);
      order.splice(offset, 0, tab.id);
      moves.push({ id: tab.id, index: start + offset });
    });
  }
  return moves;
}

// Groups tabs by normalized URL and returns the ids to close: every tab in a
// group except the one to keep (the active one if any, otherwise the oldest).
export function findDuplicateTabIds(tabs, settings = DEFAULT_SETTINGS) {
  const groups = new Map();
  for (const tab of tabs) {
    const key = normalizeUrl(tab.url, settings);
    if (key === null) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(tab);
  }

  const toClose = [];
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const keep =
      group.find((tab) => tab.active) ??
      group.find((tab) => tab.pinned) ??
      group.reduce((oldest, tab) => (tab.id < oldest.id ? tab : oldest));
    for (const tab of group) if (tab.id !== keep.id) toClose.push(tab.id);
  }
  return toClose;
}
