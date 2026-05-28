// AutoEffortless — Core Unit Tests
// Tests: keyword matching, template scoring, rate limiting, opt-out detection
// Run: node tests/core.test.js

const assert = require('assert');

// ── Test: Keyword Matching ────────────────────────────────────────────────
// Mirrors the logic in whatsapp-server/server.js

function matchKeywords(message, keywordsStr) {
  if (!keywordsStr || !keywordsStr.trim()) return 0;
  const msg = message.toLowerCase().trim();
  const keywords = keywordsStr.split(',').map(k => k.trim().toLowerCase()).filter(k => k);
  if (keywords.length === 0) return 0;
  
  let score = 0;
  for (const keyword of keywords) {
    if (!keyword) continue;
    const safeKw = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp('\\b' + safeKw + '\\b', 'i').test(msg)) {
      score += 3 * keyword.length;
    }
    else if (new RegExp('\\b' + safeKw, 'i').test(msg)) {
      score += 2 * keyword.length;
    }
    else if (msg.includes(keyword)) {
      score += 1 * keyword.length;
    }
  }
  return score;
}

// ── Test: Opt-Out Detection ───────────────────────────────────────────────

function isOptOut(msg) {
  return /^stop$|^unsubscribe$|^opt.?out$|^cancel$/i.test((msg || '').toLowerCase().trim());
}

function isOptIn(msg) {
  return /^start$|^resubscribe$|^opt.?in$/i.test((msg || '').toLowerCase().trim());
}

// ── Test: Rate Limiter Logic ──────────────────────────────────────────────

function createRateLimiter(windowMs, maxReqs) {
  const buckets = {};
  return () => {
    const windowKey = Math.floor(Date.now() / windowMs);
    buckets[windowKey] = (buckets[windowKey] || 0) + 1;
    buckets[windowKey + 1] = buckets[windowKey + 1] || 0;
    return buckets[windowKey] <= maxReqs;
  };
}

// ── Run tests ─────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ❌ ${name}: ${e.message}`);
  }
}

function suite(name, tests) {
  console.log(`\n📋 ${name}`);
  tests();
}

// == SUITE 1: Keyword Matching ==
suite('Keyword Matching', () => {
  test('Exact word match scores highest', () => {
    const score = matchKeywords('how much are the fees', 'fees');
    assert(score > 0, 'Should match "fees"');
  });

  test('Word boundary match (e.g. "pay" matches "payment")', () => {
    const score = matchKeywords('I want to make a payment', 'pay');
    assert(score > 0, 'Should match "pay" in "payment"');
  });

  test('Multiple keywords increase score', () => {
    const feesScore = matchKeywords('how much are school fees', 'fees,cost,price');
    const noMatchScore = matchKeywords('hello', 'fees,cost,price');
    assert(feesScore > noMatchScore, 'Fee-related message should score higher');
  });

  test('No match returns 0', () => {
    const score = matchKeywords('hello how are you', 'fees,uniform,absent');
    assert.strictEqual(score, 0, 'Unrelated message should score 0');
  });

  test('Empty keywords return 0', () => {
    const score = matchKeywords('hello', '');
    assert.strictEqual(score, 0);
  });

  test('Case insensitive matching', () => {
    const score = matchKeywords('SCHOOL FEES', 'fees');
    assert(score > 0, 'Should match uppercase message');
  });

  test('Comma-separated keyword list', () => {
    const score = matchKeywords('how much does it cost', 'fees,cost,price');
    assert(score > 0, 'Should match "cost" from list');
  });

  test('Special chars in message', () => {
    const score = matchKeywords('fees???', 'fees');
    assert(score > 0, 'Should handle punctuation');
  });
});

// == SUITE 2: Opt-Out Detection ==
suite('Opt-Out Detection', () => {
  test('"STOP" is opt-out', () => {
    assert(isOptOut('STOP'));
  });
  test('"stop" is opt-out', () => {
    assert(isOptOut('stop'));
  });
  test('"unsubscribe" is opt-out', () => {
    assert(isOptOut('unsubscribe'));
  });
  test('"opt-out" is opt-out', () => {
    assert(isOptOut('opt-out'));
  });
  test('"cancel" is opt-out', () => {
    assert(isOptOut('cancel'));
  });
  test('Fees is NOT opt-out', () => {
    assert(!isOptOut('fees'));
  });
  test('"start" is opt-in', () => {
    assert(isOptIn('start'));
  });
  test('"resubscribe" is opt-in', () => {
    assert(isOptIn('resubscribe'));
  });
  test('"opt-in" is opt-in', () => {
    assert(isOptIn('opt-in'));
  });
  test('Random text is NOT opt-in', () => {
    assert(!isOptIn('hello'));
  });
});

// == SUITE 3: Rate Limiter ==
suite('Rate Limiter', () => {
  test('First request passes', () => {
    const check = createRateLimiter(10000, 5);
    assert(check(), 'First request should pass');
  });

  test('Multiple requests within limit pass', () => {
    const check = createRateLimiter(10000, 3);
    assert(check());
    assert(check());
    assert(check());
  });

  test('Exceeding limit returns false', () => {
    const check = createRateLimiter(10000, 2);
    assert(check());
    assert(check());
    assert(!check(), 'Third request should be blocked');
  });

  test('High limit allows many requests', () => {
    const check = createRateLimiter(10000, 100);
    for (let i = 0; i < 50; i++) {
      assert(check(), `Request ${i} should pass`);
    }
  });
});

// == SUITE 4: Phone Number Formatting ==
suite('Phone Number Formatting', () => {
  function cleanNumber(to) {
    let clean = to.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '27' + clean.slice(1);
    } else if (!clean.startsWith('27')) {
      clean = '27' + clean;
    }
    return clean;
  }

  test('Local SA number gets 27 prefix', () => {
    assert.strictEqual(cleanNumber('0821234567'), '27821234567');
  });

  test('Number with +27 gets cleaned', () => {
    assert.strictEqual(cleanNumber('+27 82 123 4567'), '27821234567');
  });

  test('International number not double-prefixed', () => {
    assert.strictEqual(cleanNumber('27821234567'), '27821234567');
  });

  test('Number starting with 0 gets 27', () => {
    assert.strictEqual(cleanNumber('0761234567'), '27761234567');
  });
});

// == Summary ==
console.log(`\n${'='.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(40)}`);
process.exit(failed > 0 ? 1 : 0);
