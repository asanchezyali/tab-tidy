# Chrome Web Store listing: copy and paste

Every field the Developer Dashboard asks for, in the order the tabs show them.
Background and policy notes are in [docs/PUBLISHING.md](../docs/PUBLISHING.md).

## Package

Upload `dist/tab-tidy-<version>.zip` (run `npm run build` first).

The store reads the **name** (`Tab Tidy`) and the **summary** from
`manifest.json`. The summary has a 132-character limit; ours is 110.

## Store listing tab

**Description**

```
Tab Tidy keeps one tab per page.

• No duplicates: when a new tab opens a page you already have open, Tab Tidy switches you to that tab and closes the new one.
• Always sorted: every window stays sorted by site, then by path, as you browse. github.com, www.github.com and docs.github.com sit side by side.
• Clean up in one click: close the duplicates you already have, or sort on demand (Alt+Shift+S and Alt+Shift+D).
• Your rules: decide whether the #fragment, a trailing slash, the ?query or a leading www. make two URLs different.

What it leaves alone: pinned tabs, tab groups, browser pages, incognito windows (they never match normal ones), and your restored session when the browser starts. A tab that navigates with its own history is never closed, so Back keeps working.

Private by design: Tab Tidy compares URLs on your device. It makes no network requests, has no analytics and runs no remote code.

Open source (MIT): https://github.com/asanchezyali/tab-tidy
```

| Field | Value |
|---|---|
| Category | Workflow & Planning |
| Language | English (United States) |
| Store icon | `icons/icon-128.png` |
| Screenshots | `store/screenshot-1-sorted.png`, `store/screenshot-2-duplicate.png`, `store/screenshot-3-settings.png` (1280×800) |
| Small promo tile | `store/promo-small-440x280.png` |
| Marquee promo tile | `store/promo-marquee-1400x560.png` (optional) |
| Official URL | leave empty (it needs a verified domain) |
| Homepage URL | `https://github.com/asanchezyali/tab-tidy` |
| Support URL | `https://github.com/asanchezyali/tab-tidy/issues` |
| Mature content | No |

## Privacy tab

**Single purpose**

```
Keeps browser tabs tidy: prevents duplicate tabs by switching to the tab that already has the page open, and keeps tabs sorted by URL.
```

**Permission justification: tabs**

```
Tab Tidy reads the URL of open tabs to detect when a newly opened tab duplicates a page that is already open, to switch to that existing tab, and to sort tabs by URL. URLs are compared on the user's device and are never stored or transmitted.
```

**Permission justification: storage**

```
Saves the user's settings (whether to block duplicates, whether to keep tabs sorted, and which URL parts to ignore). It also keeps the ids of tabs opened in the last few seconds in session storage, which the browser clears when it closes.
```

**Remote code:** No, I am not using remote code.

**Data usage**

- Tick **Web history**. The store's user data FAQ counts data processed only on
  the device as handled data, and Tab Tidy reads tab URLs.
- Leave every other data type unticked.
- Tick the three certifications:
  - I do not sell or transfer user data to third parties, outside of the approved use cases.
  - I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
  - I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL**

```
https://github.com/asanchezyali/tab-tidy/blob/main/PRIVACY.md
```

## Distribution tab

| Field | Value |
|---|---|
| Payments | Free of charge |
| Visibility | Public |
| Regions | All regions |

## Test instructions tab

Leave empty: the extension needs no account or credentials.
