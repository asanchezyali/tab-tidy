// Browser-facing actions shared by the service worker and the popup.

import { DEFAULT_SETTINGS, findDuplicateTabIds, sortMoves } from './urls.js';

export async function getSettings() {
  const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function saveSettings(changes) {
  await chrome.storage.sync.set(changes);
}

export async function sortWindow(windowId) {
  const tabs = await chrome.tabs.query({ windowId });
  for (const { id, index } of sortMoves(tabs)) {
    await chrome.tabs.move(id, { index });
  }
}

export async function duplicateTabIds(windowId) {
  const settings = await getSettings();
  const tabs = await chrome.tabs.query({ windowId });
  return findDuplicateTabIds(tabs, settings);
}

export async function closeDuplicates(windowId) {
  const ids = await duplicateTabIds(windowId);
  if (ids.length) await chrome.tabs.remove(ids);
  return ids.length;
}

export async function focusTab(tab) {
  await chrome.tabs.update(tab.id, { active: true });
  await chrome.windows.update(tab.windowId, { focused: true });
}
