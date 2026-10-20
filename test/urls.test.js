import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  DEFAULT_SETTINGS,
  compareUrls,
  findDuplicateTabIds,
  isDedupable,
  isPlaceholderUrl,
  normalizeUrl,
  sortMoves,
} from '../src/lib/urls.js';

const settings = (overrides = {}) => ({ ...DEFAULT_SETTINGS, ...overrides });

// Applies moves the way chrome.tabs.move does: remove, then insert at index.
function applyMoves(tabs, moves) {
  const order = [...tabs].sort((a, b) => a.index - b.index).map((tab) => tab.id);
  for (const { id, index } of moves) {
    order.splice(order.indexOf(id), 1);
    order.splice(index, 0, id);
  }
  return order;
}

describe('isDedupable', () => {
  it('accepts web pages and files', () => {
    assert.equal(isDedupable('https://example.com/'), true);
    assert.equal(isDedupable('http://localhost:3000/a'), true);
    assert.equal(isDedupable('file:///Users/me/notes.html'), true);
  });

  it('rejects browser pages, extensions and garbage', () => {
    assert.equal(isDedupable('chrome://extensions/'), false);
    assert.equal(isDedupable('brave://settings/'), false);
    assert.equal(isDedupable('chrome-extension://abc/popup.html'), false);
    assert.equal(isDedupable('not a url'), false);
    assert.equal(isDedupable(undefined), false);
  });
});

describe('isPlaceholderUrl', () => {
  it('recognizes new tab pages and blanks', () => {
    assert.equal(isPlaceholderUrl('about:blank'), true);
    assert.equal(isPlaceholderUrl('chrome://newtab/'), true);
    assert.equal(isPlaceholderUrl('brave://newtab/'), true);
    assert.equal(isPlaceholderUrl(''), true);
    assert.equal(isPlaceholderUrl('https://example.com/'), false);
  });
});

describe('normalizeUrl', () => {
  it('ignores the fragment by default', () => {
    assert.equal(
      normalizeUrl('https://example.com/docs#intro'),
      normalizeUrl('https://example.com/docs#setup'),
    );
  });

  it('keeps the fragment when asked to', () => {
    const strict = settings({ ignoreHash: false });
    assert.notEqual(
      normalizeUrl('https://example.com/docs#intro', strict),
      normalizeUrl('https://example.com/docs#setup', strict),
    );
  });

  it('ignores a trailing slash by default', () => {
    assert.equal(normalizeUrl('https://example.com/docs/'), normalizeUrl('https://example.com/docs'));
  });

  it('treats query order as irrelevant but values as relevant', () => {
    assert.equal(
      normalizeUrl('https://example.com/s?a=1&b=2'),
      normalizeUrl('https://example.com/s?b=2&a=1'),
    );
    assert.notEqual(normalizeUrl('https://example.com/s?q=a'), normalizeUrl('https://example.com/s?q=b'));
  });

  it('can ignore the query entirely', () => {
    const loose = settings({ ignoreQuery: true });
    assert.equal(
      normalizeUrl('https://example.com/s?q=a', loose),
      normalizeUrl('https://example.com/s?q=b', loose),
    );
  });

  it('is case-insensitive for the host only', () => {
    assert.equal(normalizeUrl('https://EXAMPLE.com/Path'), normalizeUrl('https://example.com/Path'));
    assert.notEqual(normalizeUrl('https://example.com/Path'), normalizeUrl('https://example.com/path'));
  });

  it('can ignore www', () => {
    assert.notEqual(normalizeUrl('https://www.example.com/'), normalizeUrl('https://example.com/'));
    const loose = settings({ ignoreWww: true });
    assert.equal(normalizeUrl('https://www.example.com/', loose), normalizeUrl('https://example.com/', loose));
  });

  it('keeps http and https apart', () => {
    assert.notEqual(normalizeUrl('http://example.com/'), normalizeUrl('https://example.com/'));
  });

  it('returns null for pages that are never deduplicated', () => {
    assert.equal(normalizeUrl('chrome://settings/'), null);
  });
});

describe('compareUrls', () => {
  it('groups subdomains with their site and ignores www', () => {
    const urls = [
      'https://news.ycombinator.com/',
      'https://www.github.com/b',
      'https://docs.github.com/a',
      'https://github.com/a',
    ];
    assert.deepEqual([...urls].sort(compareUrls), [
      'https://github.com/a',
      'https://www.github.com/b',
      'https://docs.github.com/a',
      'https://news.ycombinator.com/',
    ]);
  });

  it('puts non-web URLs last', () => {
    const urls = ['chrome://settings/', 'https://a.com/'];
    assert.deepEqual([...urls].sort(compareUrls), ['https://a.com/', 'chrome://settings/']);
  });
});

describe('sortMoves', () => {
  it('sorts a plain window by URL', () => {
    const tabs = [
      { id: 1, index: 0, url: 'https://zeta.com/' },
      { id: 2, index: 1, url: 'https://alpha.com/' },
      { id: 3, index: 2, url: 'https://mid.com/' },
    ];
    assert.deepEqual(applyMoves(tabs, sortMoves(tabs)), [2, 3, 1]);
  });

  it('leaves pinned tabs in front and in their order', () => {
    const tabs = [
      { id: 1, index: 0, pinned: true, url: 'https://zeta.com/' },
      { id: 2, index: 1, pinned: true, url: 'https://alpha.com/' },
      { id: 3, index: 2, url: 'https://b.com/' },
      { id: 4, index: 3, url: 'https://a.com/' },
    ];
    assert.deepEqual(applyMoves(tabs, sortMoves(tabs)), [1, 2, 4, 3]);
  });

  it('returns no moves for a window that is already sorted', () => {
    const tabs = [
      { id: 1, index: 0, url: 'https://a.com/' },
      { id: 2, index: 1, url: 'https://b.com/' },
      { id: 3, index: 2, url: 'https://c.com/' },
    ];
    assert.deepEqual(sortMoves(tabs), []);
  });

  it('moves only the tab that is out of place', () => {
    const tabs = [
      { id: 1, index: 0, url: 'https://a.com/' },
      { id: 2, index: 1, url: 'https://c.com/' },
      { id: 3, index: 2, url: 'https://d.com/' },
      { id: 4, index: 3, url: 'https://b.com/' },
    ];
    const moves = sortMoves(tabs);
    assert.deepEqual(moves, [{ id: 4, index: 1 }]);
    assert.deepEqual(applyMoves(tabs, moves), [1, 4, 2, 3]);
  });

  it('sorts a loading tab by its pending URL', () => {
    const tabs = [
      { id: 1, index: 0, url: 'https://b.com/' },
      { id: 2, index: 1, url: '', pendingUrl: 'https://a.com/' },
    ];
    assert.deepEqual(applyMoves(tabs, sortMoves(tabs)), [2, 1]);
  });

  it('never moves a tab across a tab group', () => {
    const tabs = [
      { id: 1, index: 0, url: 'https://d.com/' },
      { id: 2, index: 1, url: 'https://c.com/' },
      { id: 3, index: 2, groupId: 7, url: 'https://b.com/' },
      { id: 4, index: 3, groupId: 7, url: 'https://a.com/' },
      { id: 5, index: 4, url: 'https://f.com/' },
      { id: 6, index: 5, url: 'https://e.com/' },
    ];
    assert.deepEqual(applyMoves(tabs, sortMoves(tabs)), [2, 1, 3, 4, 6, 5]);
  });
});

describe('findDuplicateTabIds', () => {
  it('keeps the active tab of each group', () => {
    const tabs = [
      { id: 1, url: 'https://a.com/x' },
      { id: 2, url: 'https://a.com/x#top', active: true },
      { id: 3, url: 'https://a.com/x/' },
      { id: 4, url: 'https://b.com/' },
    ];
    assert.deepEqual(findDuplicateTabIds(tabs).sort(), [1, 3]);
  });

  it('keeps the oldest tab when none is active', () => {
    const tabs = [
      { id: 9, url: 'https://a.com/' },
      { id: 5, url: 'https://a.com/' },
    ];
    assert.deepEqual(findDuplicateTabIds(tabs), [9]);
  });

  it('ignores browser pages', () => {
    const tabs = [
      { id: 1, url: 'chrome://newtab/' },
      { id: 2, url: 'chrome://newtab/' },
    ];
    assert.deepEqual(findDuplicateTabIds(tabs), []);
  });
});
