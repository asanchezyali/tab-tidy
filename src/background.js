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

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  const url = changeInfo.url;
  if (!url || isPlaceholderUrl(url)) return;

  const fresh = await readFresh();
  if (!fresh.has(tabId)) return;
  // The tab now has a real destination, so from here on it is a normal tab.
  fresh.delete(tabId);
  await writeFresh(fresh);

  const settings = await getSettings();
  if (!settings.blockDuplicates) return;

  const key = normalizeUrl(url, settings);
  if (key === null) return;

  const query = settings.searchAllWindows ? {} : { windowId: tab.windowId };
  const candidates = await chrome.tabs.query(query);
  const existing = candidates.find(
    (other) =>
      other.id !== tabId &&
      other.incognito === tab.incognito &&
      normalizeUrl(other.url || other.pendingUrl, settings) === key,
  );
  if (!existing) return;

  await focusTab(existing);
  await chrome.tabs.remove(tabId);
});

chrome.commands.onCommand.addListener(async (command, tab) => {
  const windowId = tab?.windowId ?? (await chrome.windows.getCurrent()).id;
  if (command === 'sort-tabs') await sortWindow(windowId);
  if (command === 'close-duplicates') await closeDuplicates(windowId);
});
