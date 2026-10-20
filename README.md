# Tab Tidy

A Chrome and Brave extension that keeps one tab per page.

- **No duplicates.** When a new tab opens a page that is already open, Tab Tidy
  switches to the open tab and closes the new one.
- **Always sorted by URL.** Every window stays sorted by site, then by path, as
  tabs open and navigate, so `github.com`, `docs.github.com` and
  `www.github.com` sit next to each other. Turn it off in the popup and sort on
  demand instead with one click (or `Alt+Shift+S`).
- **Close duplicates.** One click (or `Alt+Shift+D`) closes the duplicates that
  are already open, keeping the active tab.

No tracking, no network requests, no remote code. See [PRIVACY.md](PRIVACY.md).

## How it decides two tabs are the same page

Two URLs match when they have the same protocol, host, path and query. By
default Tab Tidy also treats these as the same page:

| Setting | Default | Example |
|---|---|---|
| Ignore the `#fragment` | on | `/docs#intro` = `/docs#setup` |
| Ignore a trailing slash | on | `/docs/` = `/docs` |
| Ignore the `?query` | off | `/search?q=a` = `/search?q=b` |
| Ignore a leading `www.` | off | `www.example.com` = `example.com` |
| Look in every window | on | a tab in another window counts |
| Keep tabs sorted automatically | on | sorts the window after a tab opens or navigates |

Query parameter order never matters: `?a=1&b=2` = `?b=2&a=1`.

## What it leaves alone

- **Tabs with their own history.** Only freshly opened tabs are deduplicated. If
  you navigate an existing tab to a page that is open elsewhere, nothing
  happens, so the Back button keeps working.
- **Session restore.** For ten seconds after the browser starts, restored tabs
  are not touched.
- **Browser pages** (`chrome://`, `brave://`, extension pages, the new tab page).
- **A burst of new tabs.** Auto-sort waits until the window has been quiet for
  under a second, so opening ten links triggers one sort, not ten. If you are
  dragging a tab, it waits and tries again.
- **Pinned tabs and tab groups** when sorting. Only runs of loose tabs between
  them are sorted, so no tab is pulled into or out of a group.
- **Incognito and normal windows** never match each other.

## Install from source

1. Clone the repo: `git clone https://github.com/asanchezyali/tab-tidy.git`
2. Open `chrome://extensions` (or `brave://extensions`).
3. Turn on **Developer mode**.
4. Click **Load unpacked** and choose the `tab-tidy` folder.

## Development

Requires Node 20 or newer. There are no dependencies.

```sh
npm test          # unit tests for URL matching, sorting and duplicate detection
npm run build     # writes dist/tab-tidy-<version>.zip for the Chrome Web Store
scripts/make-icons.sh   # re-renders icons/*.png from icons/icon.svg (needs ImageMagick)
scripts/make-store-assets.sh   # re-renders the store images in store/ (needs Chrome)
```

```
manifest.json          Manifest V3
src/background.js      service worker: blocks duplicates, runs the shortcuts
src/lib/urls.js        pure logic (normalization, sorting, duplicates), tested with node:test
src/lib/actions.js     chrome.* calls shared by the worker and the popup
src/popup/             toolbar popup
src/options/           settings page
test/                  unit tests
```

After changing code, click the reload icon on the extension's card in
`chrome://extensions`.

## Publishing

Brave installs extensions straight from the Chrome Web Store, so one listing
covers both browsers. The full checklist is in
[docs/PUBLISHING.md](docs/PUBLISHING.md).

## Contributing

Issues and pull requests are welcome. Please run `npm test` before opening a PR
and add a test for any change to `src/lib/urls.js`.

## License

[MIT](LICENSE)
