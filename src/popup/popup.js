import {
  closeDuplicates,
  duplicateTabIds,
  getSettings,
  saveSettings,
  sortWindow,
} from '../lib/actions.js';

const toggle = document.getElementById('blockDuplicates');
const autoSortToggle = document.getElementById('autoSort');
const status = document.getElementById('status');
const closeButton = document.getElementById('closeDuplicates');

async function currentWindowId() {
  return (await chrome.windows.getCurrent()).id;
}

async function refreshStatus() {
  const count = (await duplicateTabIds(await currentWindowId())).length;
  status.textContent =
    count === 0
      ? 'No duplicate tabs in this window.'
      : `${count} duplicate tab${count === 1 ? '' : 's'} in this window.`;
  closeButton.disabled = count === 0;
}

toggle.addEventListener('change', () => saveSettings({ blockDuplicates: toggle.checked }));

autoSortToggle.addEventListener('change', async () => {
  await saveSettings({ autoSort: autoSortToggle.checked });
  if (autoSortToggle.checked) {
    await sortWindow(await currentWindowId());
    status.textContent = 'Tabs sorted by URL.';
  }
});

closeButton.addEventListener('click', async () => {
  const closed = await closeDuplicates(await currentWindowId());
  status.textContent = `Closed ${closed} tab${closed === 1 ? '' : 's'}.`;
  closeButton.disabled = true;
});

document.getElementById('sortTabs').addEventListener('click', async () => {
  await sortWindow(await currentWindowId());
  status.textContent = 'Tabs sorted by URL.';
});

document.getElementById('openOptions').addEventListener('click', (event) => {
  event.preventDefault();
  chrome.runtime.openOptionsPage();
});

const settings = await getSettings();
toggle.checked = settings.blockDuplicates;
autoSortToggle.checked = settings.autoSort;
await refreshStatus();
