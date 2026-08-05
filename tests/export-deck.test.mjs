import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../web/services/deck-portability.js', import.meta.url), 'utf8');

function runExportWithFallback(nativeResult) {
  const calls = [];
  const anchor = {
    href: '',
    download: '',
    clicked: false,
    click() {
      this.clicked = true;
    }
  };

  const document = {
    body: {
      appendChild(node) {
        calls.push(['append', node.download]);
      },
      removeChild(node) {
        calls.push(['remove', node.download]);
      }
    },
    createElement() {
      return anchor;
    }
  };

  const window = {
    pywebview: {
      api: {
        export_deck(...args) {
          calls.push(['native', args]);
          return nativeResult;
        }
      }
    }
  };

  const context = {
    window,
    document,
    Blob: globalThis.Blob,
    URL: {
      createObjectURL() {
        return 'blob:mock';
      },
      revokeObjectURL() {
        return undefined;
      }
    },
    console,
    Math,
    Date,
    JSON,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Map,
    Set
  };

  vm.runInNewContext(source, context);

  const deck = { id: 'd1', name: 'Alpha Deck', cardIds: ['c1'] };
  const cards = {
    c1: { id: 'c1', hanzi: '汉', pinyin: 'hàn', meaning: 'Chinese' }
  };

  window.deckPortability.exportDeckToFile(deck, cards, deck.name);

  return { calls, anchor };
}

const negativeResult = runExportWithFallback(false);
assert.equal(negativeResult.calls.some(entry => entry[0] === 'native'), true, 'native export should be attempted');
assert.equal(negativeResult.anchor.download.includes('alpha'), true, 'fallback should produce a filename derived from the deck');
assert.equal(negativeResult.calls.some(entry => entry[0] === 'append'), true, 'fallback should attach a download link to the document');
console.log('Export deck regression test passed');
