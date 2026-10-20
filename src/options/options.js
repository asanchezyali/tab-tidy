import { getSettings, saveSettings } from '../lib/actions.js';

const saved = document.getElementById('saved');
const inputs = document.querySelectorAll('input[type="checkbox"][name]');
const settings = await getSettings();

for (const input of inputs) {
  input.checked = Boolean(settings[input.name]);
  input.addEventListener('change', async () => {
    await saveSettings({ [input.name]: input.checked });
    saved.textContent = 'Saved.';
  });
}
