# Publishing Tab Tidy

Checked against the Chrome Web Store documentation on October 20, 2026.

## Chrome and Brave: one store

Brave has no extension store of its own. Brave users install from the Chrome
Web Store with the **Add to Brave** button, and Manifest V3 extensions run in
Brave the same way they do in Chrome. Publishing on the Chrome Web Store
covers both browsers. Edge and Opera can install from it too, though each
also has its own store.

## 1. Register as a Chrome Web Store developer (once)

1. Sign in to the [Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   with the Google account that will own the extension.
2. Accept the developer agreement and pay the **one-time USD 5 registration
   fee**.
3. Pick the **developer email** with care: it can't be changed later. Google
   suggests a dedicated address that you check often.
4. Turn on **2-Step Verification** on that Google account. Google requires
   it before you can publish.
5. Declare **trader or non-trader** status (required by the EU Digital
   Services Act). A free, open-source hobby project usually fits
   *non-trader*. A trader must publish a legal name, phone and address, and
   gets verified.

A new publisher can have up to **two published extensions** at first.

## 2. Build the package

```sh
npm test
npm run build      # dist/tab-tidy-<version>.zip
```

The zip has `manifest.json` at its root, plus `src/` and `icons/`. Bump the
version in **both** `manifest.json` and `package.json` before every new
upload: the store rejects a version it has already seen.

## 3. Create the item

In the dashboard: **Add new item**, upload the zip, then fill in the tabs.

### Store listing

| Field | What to put |
|---|---|
| Description | See the text below |
| Category | Workflow & Planning (or Tools) |
| Language | English |
| Store icon | `icons/icon-128.png` (128×128 PNG, artwork about 96×96 with transparent padding) |
| Screenshots | 1 to 5, **1280×800** (or 640×400), full bleed, square corners |
| Small promo tile | **440×280**, required |
| Marquee | 1400×560, optional (only used if Google features the item) |
| Homepage / support | `https://github.com/asanchezyali/tab-tidy` and `/issues` |

Suggested description:

> Tab Tidy keeps one tab per page. When a new tab opens a page you already
> have open, it switches you to that tab and closes the new one. One click
> keeps every window sorted by site and URL as you browse, and one click
> closes the duplicates you already have. Settings let you decide what counts as the same page: the
> #fragment, a trailing slash, the ?query, or a leading www.
>
> Tab Tidy leaves pinned tabs, tab groups, browser pages and restored sessions
> alone. It makes no network requests and collects no data. Open source (MIT):
> github.com/asanchezyali/tab-tidy

### Privacy tab

| Field | Answer |
|---|---|
| Single purpose | "Keeps tabs tidy: prevents duplicate tabs by switching to the already-open tab, and keeps tabs sorted by URL." |
| `tabs` justification | "Reads the URL of open tabs to detect when a newly opened tab duplicates an open page, to switch to the existing tab, and to keep tabs sorted by URL. URLs are compared on the device and never stored or transmitted." |
| `storage` justification | "Saves the user's settings (which URL parts to ignore) and, for a few seconds, the ids of newly opened tabs." |
| Remote code | "No, I am not using remote code." |
| Data usage | The store's FAQ says local processing still counts as *handling* user data, and that anything handling user data needs a privacy policy. Tick **Web history** (the extension reads tab URLs), then certify the three limited-use statements: no sale, no use unrelated to the single purpose, no creditworthiness use. |
| Privacy policy URL | `https://github.com/asanchezyali/tab-tidy/blob/main/PRIVACY.md` |

### Distribution

Free, all regions, **Public** (or **Unlisted** for a soft launch where only
people with the link can install it).

## 4. Submit for review

Click **Submit for review**. Most items are reviewed within a few days. New
developers, new items and powerful permissions such as `tabs` get a closer
look, so the first review can take longer. If it is still pending after three
weeks, contact developer support.

Keep **Publish automatically after review** checked, or uncheck it and publish
by hand within 30 days of approval (after that it goes back to draft).

What keeps the review short:

- Only `tabs` and `storage`. No host permissions and no `<all_urls>`.
- No minified or obfuscated code, and no remote code.
- Every claim in the description matches what the code does.

## 5. Updates

1. Bump the version in `manifest.json` and `package.json`.
2. `npm run build`, then upload the new zip under **Package → Upload new
   package**.
3. Submit for review again. Users get the update automatically.

Adding a new permission in an update disables the extension for existing users
until they accept it, so avoid that when you can.

## Sources

- Publish in the Chrome Web Store: https://developer.chrome.com/docs/webstore/publish
- Register your developer account: https://developer.chrome.com/docs/webstore/register
- Supplying images: https://developer.chrome.com/docs/webstore/images
- Privacy tab: https://developer.chrome.com/docs/webstore/cws-dashboard-privacy
- User data FAQ: https://developer.chrome.com/docs/webstore/program-policies/user-data-faq
- Review process: https://developer.chrome.com/docs/webstore/review-process
- Trader / non-trader: https://developer.chrome.com/docs/webstore/program-policies/trader-disclosure
- Brave and Chrome extensions: https://support.brave.app/hc/en-us/articles/360017909112
