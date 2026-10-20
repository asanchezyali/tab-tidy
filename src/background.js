// Service worker: switches to the existing tab when a new tab opens a page
// that is already open, and runs the keyboard commands.

import { closeDuplicates, focusTab, getSettings, sortWindow } from './lib/actions.js';
import { isPlaceholderUrl, normalizeUrl } from './lib/urls.js';

// After the browser starts, restored tabs are created in bulk. Leave them alone
// for a moment so a restored session is never closed down.
const STARTUP_GRACE_MS = 10_000;

// Only tabs that were just opened are deduplicated. A tab with its own history
// that navigates to an open page is left alone, so Back keeps working.
// The set lives in session storage because the service worker can be stopped
// between the tab's creation and its first navigation.
const FRESH_KEY = 'freshTabIds';
const GRACE_KEY = 'graceUntil';

async function readFresh() {
  const { [FRESH_KEY]: ids = [] } = await chrome.storage.session.get(FRESH_KEY);
  return new Set(ids);
}

async function writeFresh(ids) {
  await chrome.storage.session.set({ [FRESH_KEY]: [...ids] });
}

async function inStartupGrace() {
  const { [GRACE_KEY]: until = 0 } = await chrome.storage.session.get(GRACE_KEY);
  return Date.now() < until;
}

chrome.runtime.onStartup.addListener(async () => {
  await chrome.storage.session.set({ [GRACE_KEY]: Date.now() + STARTUP_GRACE_MS });
});

chrome.tabs.onCreated.addListener(async (tab) => {
  if (await inStartupGrace()) return;
  const fresh = await readFresh();
  fresh.add(tab.id);
  await writeFresh(fresh);
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const fresh = await readFresh();
  if (fresh.delete(tabId)) await writeFresh(fresh);
});

// Auto-sort waits until the window has been quiet for a moment, so opening
// several tabs at once (or a burst of redirects) triggers a single sort.
const AUTO_SORT_DELAY_MS = 800;
// While the user drags a tab, the browser refuses to move tabs. Try again later.
const DRAG_RETRY_MS = 1_000;
const MAX_SORT_ATTEMPTS = 5;
const sortTimers = new Map();

function scheduleSort(windowId, attempt = 1) {
  clearTimeout(sortTimers.get(windowId));
  const delay = attempt === 1 ? AUTO_SORT_DELAY_MS : DRAG_RETRY_MS;
  sortTimers.set(
    windowId,
    setTimeout(async () => {
      sortTimers.delete(windowId);
      try {
        await sortWindow(windowId);
      } catch (error) {
        // The window may have closed; only a busy tab strip is worth retrying.
        if (attempt < MAX_SORT_ATTEMPTS && /dragging|cannot be edited/i.test(error.message)) {
          scheduleSort(windowId, attempt + 1);
        }
      }
    }, delay),
  );
}

async function autoSort(windowId) {
  if ((await getSettings()).autoSort) scheduleSort(windowId);
}

// Returns true when the tab duplicated an open page and was closed.
async function closeIfDuplicate(tabId, url, tab) {
  const fresh = await readFresh();
  if (!fresh.has(tabId)) return false;
  // The tab now has a real destination, so from here on it is a normal tab.
  fresh.delete(tabId);
  await writeFresh(fresh);

  const settings = await getSettings();
  if (!settings.blockDuplicates) return false;

  const key = normalizeUrl(url, settings);
  if (key === null) return false;

  const query = settings.searchAllWindows ? {} : { windowId: tab.windowId };
  const candidates = await chrome.tabs.query(query);
  const existing = candidates.find(
    (other) =>
      other.id !== tabId &&
      other.incognito === tab.incognito &&
      normalizeUrl(other.url || other.pendingUrl, settings) === key,
  );
  if (!existing) return false;

  await focusTab(existing);
  await chrome.tabs.remove(tabId);
  return true;
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Pinning, unpinning or grouping changes which tabs are sortable.
  if ('pinned' in changeInfo || 'groupId' in changeInfo) {
    await autoSort(tab.windowId);
    return;
  }

  const url = changeInfo.url;
  if (!url || isPlaceholderUrl(url)) return;
  if (await closeIfDuplicate(tabId, url, tab)) return;
  await autoSort(tab.windowId);
});

chrome.tabs.onAttached.addListener(async (tabId, { newWindowId }) => {
  await autoSort(newWindowId);
});

chrome.commands.onCommand.addListener(async (command, tab) => {
  const windowId = tab?.windowId ?? (await chrome.windows.getCurrent()).id;
  if (command === 'sort-tabs') await sortWindow(windowId);
  if (command === 'close-duplicates') await closeDuplicates(windowId);
});
