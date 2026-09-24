/* ==========================================================================
   collect — Blooket-style collectibles for StudyQuest.
   Earn coins by answering correctly anywhere in the site, spend them on packs,
   collect critters, and pick one as your icon in the games.
   Registers itself through window.CQ (see the plugins section of app.js).
   ========================================================================== */
(() => {
'use strict';
const CQ = window.CQ;
if (!CQ) return;
const { el, $, toast, confetti, sfx } = CQ;

/* ------------------------------------------------------------ economy
   BALANCE — done on purpose, and checked by tools/study-checks/collect.mjs.

   Earning: +10 coins for a question answered right on the first try. Any
   answer to a question id, right OR wrong, uses up that id's one try for
   the next 10 minutes, so a missed question that comes round again in
   Race, Gold Quest or Blitz can't be guessed at until it pays (blind
   tapping used to earn ~6 packs in 3 minutes).
   Guess guard: those first tries are remembered as a rolling window of the
   last 10. A right answer pays only while no more than 5 of them are
   misses, so a student getting half or more right is paid as normal, while
   blind tapping (~28% right on a mix of 4-option and true/false) is paid
   only in the rare stretch where its luck runs above half. Share of right
   answers paid, by accuracy (simulated): 28% → 0.22, 40% → 0.51,
   50% → 0.75, 60% → 0.90, 70% → 0.97, 80%+ → ~1. Three minutes of blind
   random tapping in Race now earns ~200 coins (it was 1,060). A student
   who hits a pause is told why, and it lifts after a few right answers.
   Flashcard "Know it" taps are self-marked and Match lets you try pairs
   until one sticks, so neither pays at all.

   Each pack holds 10 critters: 4 Common, 2 Uncommon, 2 Rare, 1 Epic,
   1 Legendary. An opening rolls a rarity at 60 / 25 / 10 / 4 / 1 %, then
   gives a critter of that rarity you don't have yet if there is one (a
   duplicate only once that rarity is complete in the pack). After 3
   duplicates in a row in a pack, the Lucky meter is full and the next
   critter from that pack is guaranteed new, still weighted by rarity, so a
   Legendary usually arrives last. A duplicate refunds 130 / 150 / 180 / 240
   / 300 coins by rarity. A completed pack can't be opened again.

   Price: 180 coins, so the first pack comes after 18 correct answers. The
   brief asked for about 25 (250 coins), but that can't fit with finishing
   in 600–900 answers. Every new critter costs a full pack with no refund,
   so 40 critters × 250 coins is already 1,000 answers before a single
   duplicate. 180 is the highest price that keeps the whole collection
   under 900.

   Expected cost, computed exactly by expectedCoins() below (a DP over
   owned-per-rarity × lucky meter; the state graph is acyclic, since a new
   critter raises the owned count and a duplicate raises the meter):
     one pack  ≈ 2,150 coins net  (≈ 19 openings, ≈ 9 of them duplicates)
     all four  ≈ 8,601 coins net  → ≈ 860 paid answers for the whole
   collection (≈ 890 right answers for a student at 70% accuracy, once
   the guess guard's occasional pause is counted). The floor is 720 (40 new critters × 18); duplicates add
   about 140. A 20,000-run Monte Carlo agreed (860, p10 824, p90 897).
   ------------------------------------------------------------------- */
const KEY = 'chemquest:collect:v1';
const EARN = 10;
const COOLDOWN = 10 * 60 * 1000;
const PRICE = 180;
const LUCKY_AT = 3;
const WINDOW = 10;     // guess guard: remember this many recent first tries…
const MAX_MISSES = 5;  // …and pay only while no more than this many were wrong
const RARITIES = [
  { id: 'common', name: 'Common', odds: .60, refund: 130 },
  { id: 'uncommon', name: 'Uncommon', odds: .25, refund: 150 },
  { id: 'rare', name: 'Rare', odds: .10, refund: 180 },
  { id: 'epic', name: 'Epic', odds: .04, refund: 240 },
  { id: 'legendary', name: 'Legendary', odds: .01, refund: 300 },
];
const RAR = Object.fromEntries(RARITIES.map((r) => [r.id, r]));

/* Names are playful, not facts; the Lab pack borrows equipment from the
   Concept 1 notes (beaker, goggles, pipette, funnel, test tube, spatula,
   tongs, flask, graduated cylinder). */
const PACK_DEFS = [
  { id: 'lab', name: 'Lab pack', emoji: '🧪', color: '#22d3ee', critters: [
    ['beaker-bunny', 'Beaker Bunny', '🐰', 'common'],
    ['goggle-gecko', 'Goggle Gecko', '🦎', 'common'],
    ['pipette-pup', 'Pipette Pup', '🐶', 'common'],
    ['funnel-frog', 'Funnel Frog', '🐸', 'common'],
    ['test-tube-turtle', 'Test-Tube Turtle', '🐢', 'uncommon'],
    ['spatula-squirrel', 'Spatula Squirrel', '🐿️', 'uncommon'],
    ['tongs-badger', 'Tongs Badger', '🦡', 'rare'],
    ['flask-fox', 'Flask Fox', '🦊', 'rare'],
    ['graduated-owl', 'Graduated Owl', '🦉', 'epic'],
    ['safety-unicorn', 'Safety Unicorn', '🦄', 'legendary'],
  ] },
  { id: 'elemental', name: 'Elemental pack', emoji: '🔥', color: '#ff7a45', critters: [
    ['ember-chick', 'Ember Chick', '🐤', 'common'],
    ['puddle-duck', 'Puddle Duck', '🦆', 'common'],
    ['pebble-snail', 'Pebble Snail', '🐌', 'common'],
    ['breeze-bee', 'Breeze Bee', '🐝', 'common'],
    ['frost-penguin', 'Frost Penguin', '🐧', 'uncommon'],
    ['sprout-caterpillar', 'Sprout Caterpillar', '🐛', 'uncommon'],
    ['thunder-tiger', 'Thunder Tiger', '🐯', 'rare'],
    ['magma-croc', 'Magma Croc', '🐊', 'rare'],
    ['storm-eagle', 'Storm Eagle', '🦅', 'epic'],
    ['elder-dragon', 'Elder Dragon', '🐉', 'legendary'],
  ] },
  { id: 'space', name: 'Space pack', emoji: '🚀', color: '#7c5cff', critters: [
    ['comet-cat', 'Comet Cat', '🐱', 'common'],
    ['moon-mouse', 'Moon Mouse', '🐭', 'common'],
    ['rocket-hamster', 'Rocket Hamster', '🐹', 'common'],
    ['crater-koala', 'Crater Koala', '🐨', 'common'],
    ['orbit-raccoon', 'Orbit Raccoon', '🦝', 'uncommon'],
    ['nebula-panda', 'Nebula Panda', '🐼', 'uncommon'],
    ['stardust-flamingo', 'Stardust Flamingo', '🦩', 'rare'],
    ['lunar-wolf', 'Lunar Wolf', '🐺', 'rare'],
    ['cosmo-saurus', 'Cosmo-saurus', '🦕', 'epic'],
    ['captain-zorp', 'Captain Zorp', '👽', 'legendary'],
  ] },
  { id: 'ocean', name: 'Ocean pack', emoji: '🌊', color: '#4d8cff', critters: [
    ['coral-fish', 'Coral Fish', '🐠', 'common'],
    ['pinchy-crab', 'Pinchy Crab', '🦀', 'common'],
    ['puffer-pal', 'Puffer Pal', '🐡', 'common'],
    ['shrimp-scout', 'Shrimp Scout', '🦐', 'common'],
    ['dolphin-dash', 'Dolphin Dash', '🐬', 'uncommon'],
    ['sleepy-seal', 'Sleepy Seal', '🦭', 'uncommon'],
    ['reef-shark', 'Reef Shark', '🦈', 'rare'],
    ['inky-squid', 'Inky Squid', '🦑', 'rare'],
    ['octo-genius', 'Octo-Genius', '🐙', 'epic'],
    ['great-blue-whale', 'Great Blue Whale', '🐋', 'legendary'],
  ] },
];
const PACKS = PACK_DEFS.map((p) => Object.freeze({
  id: p.id, name: p.name, emoji: p.emoji, color: p.color, price: PRICE,
  critters: Object.freeze(p.critters.map(([slug, name, emoji, rarity]) => Object.freeze({ id: `${p.id}-${slug}`, name, emoji, rarity, pack: p.id }))),
}));
const CRITTERS = new Map(PACKS.flatMap((p) => p.critters.map((c) => [c.id, c])));
const TOTAL = CRITTERS.size;
const packOf = (id) => PACKS.find((p) => p.id === id);

/* ------------------------------------------------------------ storage
   Its own key, so a wipe of study progress never costs a student their
   critters (or the reverse). Every access is guarded: with storage blocked
   the feature still works for the session, in memory. Each change re-reads
   the stored value first, so two tabs add to each other's coins instead of
   the last one to write winning. */
const blank = () => ({ v: 1, coins: 0, owned: {}, icon: '', lucky: {}, earned: {}, opened: 0, recent: '' });
function sanitize(raw) {
  const s = blank();
  if (!raw || typeof raw !== 'object') return s;
  s.coins = Math.max(0, Math.floor(Number(raw.coins) || 0));
  s.opened = Math.max(0, Math.floor(Number(raw.opened) || 0));
  if (typeof raw.recent === 'string') s.recent = raw.recent.replace(/[^01]/g, '').slice(-WINDOW);
  for (const [id, n] of Object.entries(raw.owned || {})) {
    const k = Math.floor(Number(n) || 0);
    if (CRITTERS.has(id) && k > 0) s.owned[id] = k;
  }
  for (const p of PACKS) {
    const k = Math.floor(Number((raw.lucky || {})[p.id]) || 0);
    if (k > 0) s.lucky[p.id] = Math.min(LUCKY_AT, k);
  }
  const now = Date.now();
  for (const [id, t] of Object.entries(raw.earned || {})) {
    const at = Number(t);
    // A stamp from the future means the clock went back: it restarts its
    // cooldown now rather than being forgotten.
    if (at > 0 && now - at < COOLDOWN) s.earned[id] = Math.min(at, now);
  }
  if (typeof raw.icon === 'string' && s.owned[raw.icon]) s.icon = raw.icon;
  return s;
}
let storageOK = true;
let mem = blank();
function read() {
  if (!storageOK) return mem;
  let raw;
  try { raw = localStorage.getItem(KEY); } catch { storageOK = false; return mem; }
  // A corrupt value is not "storage blocked": keep what we have in memory
  // and let the next write() replace it.
  let obj;
  try { obj = JSON.parse(raw || 'null'); } catch { return mem; }
  mem = sanitize(obj);
  return mem;
}
function write() {
  if (!storageOK) return;
  try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch { storageOK = false; }
}
/** Read-modify-write: fn gets the freshest state and may return a result. */
function mutate(fn) {
  read();
  const out = fn(mem);
  write();
  paintBadge();
  return out;
}
read();

/* ------------------------------------------------------------ helpers */
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt = (n) => Number(n || 0).toLocaleString();
const ownedIn = (pack, s = mem) => pack.critters.filter((c) => s.owned[c.id]).length;
const ownedTotal = (s = mem) => Object.keys(s.owned).length;
const tierSize = (pack, rarity) => pack.critters.filter((c) => c.rarity === rarity).length;
function weighted(items, weight) {
  const w = items.map(weight);
  let x = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < items.length; i++) { x -= w[i]; if (x < 0) return items[i]; }
  return items[items.length - 1];
}

/* ------------------------------------------------------------ earning */
const misses = (s = mem) => (s.recent.match(/0/g) || []).length;
/** Any answer uses up the id's try for COOLDOWN; only a right one pays, and
    only while the guess guard allows. Returns coins paid, or -1 when a
    right answer was held back by the guard. */
function earn(id, correct, now = Date.now()) {
  return mutate((s) => {
    for (const [k, at] of Object.entries(s.earned)) {
      if (at > now) s.earned[k] = now; // clock went back: never shortens a cooldown
      else if (now - at >= COOLDOWN) delete s.earned[k];
    }
    if (s.earned[id]) return 0;
    s.earned[id] = now;
    s.recent = (s.recent + (correct ? '1' : '0')).slice(-WINDOW);
    if (!correct) return 0;
    if (misses(s) > MAX_MISSES) return -1;
    s.coins += EARN;
    return EARN;
  });
}
// Modes where the student marks themselves or can retry until right. Parsed
// the way the router does, so '#set/c1/flashcards' counts too.
const UNPAID_MODES = new Set(['flashcards', 'match']);
// The generated-practice labs report every problem of a skill under one id,
// but each problem is brand new and can be answered only once, so each
// answer there is its own try (the guess guard still applies).
const FRESH_MODES = new Set(['lab', 'algebra', 'physics', 'geometry']);
const modeHere = () => {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  return parts[0] === 'set' ? parts[2] || '' : '';
};
let freshSeq = 0;
CQ.on('answer', ({ id, correct } = {}) => {
  const mode = modeHere();
  if (!id || UNPAID_MODES.has(mode)) return;
  const got = earn(FRESH_MODES.has(mode) ? `${id}#${Date.now()}.${++freshSeq}` : String(id), !!correct);
  if (got > 0) coinsArrived(got);
  else if (got < 0) guardNotice();
});
let noticedAt = -Infinity;
function guardNotice() {
  if (onPage) refreshCoins();
  if (performance.now() - noticedAt < 60000) return; // say it once a minute at most
  noticedAt = performance.now();
  toast(`🪙 Coins paused: ${misses()} of your last ${WINDOW} answers were misses. Take your time — a few right answers start them again.`);
}

/* ------------------------------------------------------------ opening */
function roll(pack, s) {
  const missing = pack.critters.filter((c) => !s.owned[c.id]);
  const lucky = (s.lucky[pack.id] || 0) >= LUCKY_AT && missing.length > 0;
  if (lucky) return { critter: weighted(missing, (c) => RAR[c.rarity].odds / tierSize(pack, c.rarity)), lucky };
  const tiers = RARITIES.filter((r) => tierSize(pack, r.id));
  const tier = weighted(tiers, (r) => r.odds);
  const inTier = pack.critters.filter((c) => c.rarity === tier.id);
  const fresh = inTier.filter((c) => !s.owned[c.id]);
  const pool = fresh.length ? fresh : inTier;
  return { critter: pool[Math.floor(Math.random() * pool.length)], lucky };
}
/** Spend PRICE on a pack. Returns the critter (plus isNew, refund, count,
    lucky) or null when the pack is unknown, complete, or unaffordable. */
function open(packId) {
  const pack = packOf(packId);
  if (!pack) return null;
  return mutate((s) => {
    if (s.coins < PRICE || ownedIn(pack, s) >= pack.critters.length) return null;
    s.coins -= PRICE;
    s.opened++;
    const { critter, lucky } = roll(pack, s);
    const isNew = !s.owned[critter.id];
    s.owned[critter.id] = (s.owned[critter.id] || 0) + 1;
    let refund = 0;
    if (isNew) delete s.lucky[pack.id];
    else {
      refund = RAR[critter.rarity].refund;
      s.coins += refund;
      s.lucky[pack.id] = Math.min(LUCKY_AT, (s.lucky[pack.id] || 0) + 1);
    }
    return { ...critter, isNew, refund, lucky, count: s.owned[critter.id] };
  });
}

/* Exact expected net coins to finish one pack from empty — see BALANCE. */
function expectedPackCoins(pack) {
  const sizes = RARITIES.map((r) => tierSize(pack, r.id));
  const memo = new Map();
  const E = (own, meter) => {
    const key = `${own}|${meter}`;
    if (memo.has(key)) return memo.get(key);
    let v = 0;
    if (own.some((o, i) => o < sizes[i])) {
      v = PRICE;
      if (meter >= LUCKY_AT) {
        const w = RARITIES.map((r, i) => (sizes[i] ? (r.odds / sizes[i]) * (sizes[i] - own[i]) : 0));
        const W = w.reduce((a, b) => a + b, 0);
        w.forEach((wi, i) => { if (wi) { const n = own.slice(); n[i]++; v += (wi / W) * E(n, 0); } });
      } else {
        const W = RARITIES.reduce((a, r, i) => a + (sizes[i] ? r.odds : 0), 0);
        RARITIES.forEach((r, i) => {
          if (!sizes[i]) return;
          const p = r.odds / W;
          if (own[i] < sizes[i]) { const n = own.slice(); n[i]++; v += p * E(n, 0); }
          else v += p * (E(own, meter + 1) - r.refund);
        });
      }
    }
    memo.set(key, v);
    return v;
  };
  return E(sizes.map(() => 0), 0);
}
const expectedCoins = () => PACKS.reduce((n, p) => n + expectedPackCoins(p), 0);

/* ------------------------------------------------------------ icon */
function setIcon(id) {
  return mutate((s) => {
    if (id && !s.owned[id]) return false;
    s.icon = id || '';
    return true;
  });
}
const iconCritter = () => CRITTERS.get(mem.icon) || null;
// Gold Quest and Race show CQ.player().icon next to "You".
CQ.player = () => ({ name: 'You', icon: iconCritter() ? iconCritter().emoji : '🙂' });

/* ------------------------------------------------------------ header badge */
const bag = CQ.addHeaderButton({ id: 'bag', label: 'Your collection', ico: '🎒', href: '#/collection' });
const badge = el('span', { class: 'cq-badge', 'aria-hidden': 'true' });
if (bag) bag.append(badge);
function paintBadge() {
  if (!bag) return;
  const c = mem.coins;
  badge.textContent = c >= 10000 ? `${Math.floor(c / 1000)}k` : c >= 1000 ? `${(c / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(c);
  const label = `Your collection — ${fmt(c)} coins, ${ownedTotal()} of ${TOTAL} critters`;
  bag.setAttribute('aria-label', label);
  bag.title = label;
}
function coinsArrived(n) {
  paintBadge();
  if (onPage) refreshCoins();
  if (!bag || reduceMotion()) return;
  badge.classList.remove('pulse');
  void badge.offsetWidth; // restart the animation
  badge.classList.add('pulse');
  const plus = el('span', { class: 'cq-plus', 'aria-hidden': 'true' }, `+${n}`);
  bag.append(plus);
  setTimeout(() => plus.remove(), 900);
  setTimeout(() => badge.classList.remove('pulse'), 700);
}
paintBadge();

// Another tab earned or spent: adopt its value.
addEventListener('storage', (e) => {
  if (e.key !== KEY && e.key !== null) return;
  const before = mem.coins;
  read(); // a cleared key reads back as a blank collection
  if (mem.coins > before) coinsArrived(mem.coins - before); else paintBadge();
  if (onPage && !reveal) draw();
});

/* ------------------------------------------------------------ page */
let onPage = false;
let view = null;
let reveal = null;

function rarityChip(r) {
  return el('span', { class: 'cq-rarity', 'data-rarity': r }, RAR[r].name);
}
function statBlock() {
  const ic = iconCritter();
  return el('div', { class: 'row cq-stats' },
    el('div', { class: 'stat cq-stat-coins' }, el('b', { 'data-cq': 'coins' }, `🪙 ${fmt(mem.coins)}`), el('span', {}, 'Coins')),
    el('div', { class: 'stat' }, el('b', {}, `${ownedTotal()} / ${TOTAL}`), el('span', {}, 'Critters collected')),
    el('div', { class: 'stat cq-stat-icon' },
      el('b', {}, `${ic ? ic.emoji : '🙂'} `, el('small', {}, ic ? ic.name : 'Default')),
      el('span', {}, 'Your icon'),
    ),
    el('div', { class: 'stat', 'data-cq': 'streak' }, ...streakStat()),
    ic ? el('button', { class: 'btn ghost sm', 'data-key': 'icon-reset', onclick: () => { setIcon(''); toast('Back to 🙂'); draw(); } }, 'Use 🙂 instead') : null,
  );
}
/** Recent first tries as dots: filled right, hollow miss (shape, not just colour). */
function streakStat() {
  const r = mem.recent;
  const paused = misses() > MAX_MISSES;
  const right = r.length - misses();
  return [
    el('b', { class: `cq-dots${paused ? ' paused' : ''}`, 'aria-hidden': 'true' },
      ...Array.from({ length: WINDOW }, (_, i) => {
        const c = r[i - (WINDOW - r.length)];
        return el('i', { class: c === '1' ? 'hit' : c === '0' ? 'miss' : '' });
      })),
    el('span', {}, paused ? 'Coins paused: get a few right' : 'Last 10 first tries'),
    el('span', { class: 'sr-only' }, r.length
      ? `${right} right and ${misses()} missed in your last ${r.length} first tries.${paused ? ` Coins are paused until no more than ${MAX_MISSES} of the last ${WINDOW} are misses.` : ''}`
      : 'No answers yet.'),
  ];
}
function packCard(pack) {
  const have = ownedIn(pack);
  const n = pack.critters.length;
  const done = have >= n;
  const meter = mem.lucky[pack.id] || 0;
  const short = PRICE - mem.coins;
  const btn = el('button', {
    class: `btn ${done ? 'ghost' : 'gold'} block cq-open`, 'data-key': `open-${pack.id}`, 'data-pack': pack.id,
    disabled: done || short > 0,
    onclick: () => startReveal(pack.id),
  }, done ? '✓ Pack complete' : short > 0 ? `Need 🪙 ${fmt(short)} more` : `Open for 🪙 ${PRICE}`);
  return el('div', { class: 'cq-pack', style: `--pc:${pack.color}` },
    el('div', { class: 'cq-pack-art', 'aria-hidden': 'true' }, el('span', {}, pack.emoji)),
    el('div', { class: 'cq-pack-body' },
      el('h3', {}, pack.name),
      el('div', { class: 'cq-pack-meta' },
        el('span', {}, `${have} / ${n} collected`),
        el('span', { class: 'cq-price' }, `🪙 ${PRICE}`),
      ),
      el('div', { class: `progress${done ? ' good' : ''}`, role: 'progressbar', 'aria-label': `${pack.name} collected`, 'aria-valuemin': '0', 'aria-valuemax': String(n), 'aria-valuenow': String(have) }, el('i', { style: `width:${(100 * have) / n}%` })),
      done ? null : el('div', { class: 'cq-lucky', title: `After ${LUCKY_AT} duplicates in a row, your next critter from this pack is guaranteed new.` },
        el('span', { class: 'cq-lucky-lbl' }, '🍀 Lucky'),
        el('span', { class: 'cq-pips', 'aria-hidden': 'true' }, ...Array.from({ length: LUCKY_AT }, (_, i) => el('i', { class: i < meter ? 'on' : '' }))),
        el('span', { class: 'cq-lucky-txt' }, meter >= LUCKY_AT ? 'Next one is new!' : `${meter} / ${LUCKY_AT}`,
          meter >= LUCKY_AT ? null : el('span', { class: 'sr-only' }, ' duplicates; at 3 your next critter is guaranteed new')),
      ),
      btn,
    ),
  );
}
function tile(c) {
  const n = mem.owned[c.id] || 0;
  if (!n) {
    return el('div', { class: 'cq-tile locked', 'data-rarity': c.rarity, role: 'img', 'aria-label': `Not collected yet: a ${RAR[c.rarity].name} critter` },
      el('span', { class: 'cq-emoji', 'aria-hidden': 'true' }, c.emoji),
      el('span', { class: 'cq-q', 'aria-hidden': 'true' }, '?'),
      el('span', { class: 'cq-name', 'aria-hidden': 'true' }, '???'),
      el('span', { 'aria-hidden': 'true' }, rarityChip(c.rarity)),
    );
  }
  const mine = mem.icon === c.id;
  return el('button', {
    class: `cq-tile${mine ? ' mine' : ''}`, 'data-rarity': c.rarity, 'data-key': `tile-${c.id}`, 'data-critter': c.id,
    'aria-pressed': mine ? 'true' : 'false',
    'aria-label': `${c.name}, ${RAR[c.rarity].name}${n > 1 ? `, you have ${n}` : ''}. ${mine ? 'Your icon.' : 'Choose as your icon.'}`,
    onclick: () => {
      if (mem.icon === c.id) return;
      setIcon(c.id); sfx.flip(); toast(`${c.emoji} ${c.name} is now your icon`); draw();
    },
  },
  el('span', { class: 'cq-emoji', 'aria-hidden': 'true' }, c.emoji),
  el('span', { class: 'cq-name' }, c.name),
  rarityChip(c.rarity),
  n > 1 ? el('span', { class: 'cq-count', 'aria-hidden': 'true' }, `×${n}`) : null,
  mine ? el('span', { class: 'cq-mine', 'aria-hidden': 'true' }, '✓ Icon') : null,
  );
}
function earnRules() {
  return el('details', { class: 'cq-odds' },
    el('summary', {}, 'How you earn coins'),
    el('ul', {},
      el('li', {}, `A right answer on your first try earns 🪙 ${EARN}, in Learn, Test, Mistakes, Gold Quest, Race, Blitz and the other quiz modes.`),
      el('li', {}, 'Each question gets one try every 10 minutes, right or wrong. Seeing it again sooner, or retrying after a miss, pays nothing.'),
      el('li', {}, `Coins pause while more than ${MAX_MISSES} of your last ${WINDOW} tries were misses, so guessing doesn't pay. A few right answers start them again.`),
      el('li', {}, 'Flashcards (you mark yourself) and Match (you can try pairs until one fits) never pay.'),
      el('li', {}, 'Wrong answers never cost coins.'),
    ),
  );
}
function oddsTable() {
  return el('details', { class: 'cq-odds' },
    el('summary', {}, 'Drop rates and duplicates'),
    el('p', {}, `Each pack rolls a rarity, then gives you a critter of that rarity you don't have yet, if there is one. After ${LUCKY_AT} duplicates in a row the Lucky meter is full and your next critter from that pack is guaranteed new.`),
    el('table', {},
      el('thead', {}, el('tr', {}, el('th', { scope: 'col' }, 'Rarity'), el('th', { scope: 'col' }, 'Chance'), el('th', { scope: 'col' }, 'Per pack'), el('th', { scope: 'col' }, 'Duplicate refund'))),
      el('tbody', {}, ...RARITIES.map((r) => el('tr', {},
        el('td', {}, rarityChip(r.id)), el('td', {}, `${Math.round(r.odds * 100)}%`), el('td', {}, String(tierSize(PACKS[0], r.id))), el('td', {}, `🪙 ${r.refund}`)))),
    ),
  );
}
function draw() {
  if (!view) return;
  const key = document.activeElement && document.activeElement.dataset && document.activeElement.dataset.key;
  read();
  view.innerHTML = '';
  // Node.append (unlike el) would print a null kid as the text "null".
  view.append(...[
    el('div', { class: 'hero' },
      el('span', { class: 'eyebrow' }, 'Collectibles'),
      el('h1', {}, '🎒 Your collection'),
      el('p', {}, `Get a question right on your first try to earn 🪙 ${EARN}. Spend coins on packs, collect all ${TOTAL} critters, and choose one as your icon in Gold Quest and Race.`),
    ),
    statBlock(),
    el('h2', { class: 'section-title' }, 'Packs'),
    el('div', { class: 'cq-packs' }, ...PACKS.map(packCard)),
    el('div', { class: 'cq-info' }, earnRules(), oddsTable()),
    el('h2', { class: 'section-title' }, `Critters · ${ownedTotal()} / ${TOTAL} collected`),
    ownedTotal() ? null : el('p', { class: 'note cq-hint' }, 'Nothing yet. Answer questions in any mode, then open a pack.'),
    ...PACKS.map((p) => el('section', { class: 'cq-group', 'aria-label': p.name },
      el('h3', {}, `${p.emoji} ${p.name}`, el('span', { class: 'chip' }, `${ownedIn(p)} / ${p.critters.length} collected`)),
      el('div', { class: 'cq-grid' }, ...p.critters.map(tile)),
    )),
  ].filter(Boolean));
  if (key) { const t = view.querySelector(`[data-key="${key}"]`); if (t && !t.disabled) t.focus({ preventScroll: true }); }
}
/** Coins changed while the page is open (an answer in another tab, say):
    update what depends on the balance without disturbing focus. */
function refreshCoins() {
  if (!view || reveal) return;
  const b = view.querySelector('[data-cq="coins"]');
  if (b) b.textContent = `🪙 ${fmt(mem.coins)}`;
  const st = view.querySelector('[data-cq="streak"]');
  if (st) st.replaceChildren(...streakStat());
  const packs = view.querySelector('.cq-packs');
  if (packs && !packs.contains(document.activeElement)) packs.replaceWith(el('div', { class: 'cq-packs' }, ...PACKS.map(packCard)));
}

/* ------------------------------------------------------------ reveal
   pack shakes → bursts → the card flips to show the critter. Skippable
   (Skip button, Escape, or a tap), and instant under reduced motion.
   Afterwards focus goes to Done, never to "Open another", so an extra
   Enter can't spend coins. */
function startReveal(packId) {
  const pack = packOf(packId);
  const got = open(packId);
  if (!got) { toast(mem.coins < PRICE ? `You need 🪙 ${PRICE - mem.coins} more` : 'That pack is complete'); draw(); return; }
  if (!reveal) buildReveal();
  playReveal(pack, got);
}
function buildReveal() {
  const r = reveal = { timers: [] };
  r.title = el('h2', { id: 'cq-reveal-title', class: 'sr-only' }, 'Opening a pack');
  r.stage = el('div', { class: 'cq-stage' });
  r.live = el('p', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });
  r.actions = el('div', { class: 'row center cq-actions' });
  r.box = el('div', { class: 'cq-reveal-box' }, r.title, r.stage, r.live, r.actions);
  r.root = el('div', { class: 'cq-reveal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'cq-reveal-title',
    // A tap anywhere skips the animation; once it's shown, a tap outside closes.
    onclick: (e) => {
      if (e.target.closest('button')) return; // buttons do their own thing
      if (!r.done) finishReveal(); else if (e.target === r.root) closeReveal();
    } }, r.box);
  r.onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); if (r.done) closeReveal(); else finishReveal(); }
    else if (e.key === 'Tab') {
      const f = [...r.box.querySelectorAll('button:not([disabled])')];
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      else if (i < 0) { e.preventDefault(); f[0].focus(); }
    }
  };
  document.addEventListener('keydown', r.onKey, true);
  document.body.append(r.root);
  document.body.classList.add('cq-lock');
}
function clearRevealTimers() { if (!reveal) return; for (const t of reveal.timers) clearTimeout(t); reveal.timers = []; }
function playReveal(pack, got) {
  const r = reveal;
  clearRevealTimers();
  r.done = false; r.pack = pack; r.got = got;
  r.root.style.setProperty('--pc', pack.color);
  r.stage.innerHTML = '';
  r.live.textContent = '';
  r.title.textContent = `Opening the ${pack.name}`;
  const art = el('div', { class: 'cq-bigpack', 'aria-hidden': 'true' }, el('span', { class: 'cq-bigpack-emoji' }, pack.emoji), el('span', { class: 'cq-bigpack-name' }, pack.name));
  const card = el('div', { class: 'cq-card', 'data-rarity': got.rarity, 'aria-hidden': 'true' },
    el('div', { class: 'cq-face cq-back' }, el('span', {}, pack.emoji)),
    el('div', { class: 'cq-face cq-front' },
      el('span', { class: 'cq-emoji' }, got.emoji),
      el('b', { class: 'cq-card-name' }, got.name),
      rarityChip(got.rarity),
      el('span', { class: `cq-tag ${got.isNew ? 'new' : 'dup'}` }, got.isNew ? (got.lucky ? '🍀 Lucky — NEW!' : '✨ NEW!') : `Duplicate · +🪙 ${got.refund}`),
    ),
  );
  r.card = card; r.art = art;
  r.stage.append(art, card);
  r.actions.innerHTML = '';
  r.skip = el('button', { class: 'btn ghost', onclick: finishReveal }, 'Skip ⏭');
  r.actions.append(r.skip);
  r.skip.focus();
  if (reduceMotion()) { finishReveal(); return; }
  sfx.flip();
  art.classList.add('shake');
  const at = (ms, fn) => r.timers.push(setTimeout(fn, ms));
  at(750, () => { art.classList.remove('shake'); art.classList.add('burst'); sfx.coin(); });
  at(1100, () => { card.classList.add('in'); });
  at(1400, () => { card.classList.add('flip'); sfx.flip(); });
  at(2000, finishReveal);
}
function finishReveal() {
  const r = reveal;
  if (!r || r.done) return;
  clearRevealTimers();
  r.done = true;
  const { got, pack } = r;
  r.art.classList.remove('shake');
  r.art.classList.add('gone');
  r.card.classList.add('in', 'flip', 'shown');
  r.card.removeAttribute('aria-hidden');
  r.card.setAttribute('role', 'img');
  r.card.setAttribute('aria-label', `${got.name}, ${RAR[got.rarity].name}`);
  const said = got.isNew
    ? `New critter: ${got.name}, ${RAR[got.rarity].name}. ${ownedIn(pack)} of ${pack.critters.length} in the ${pack.name}.`
    : `Duplicate: ${got.name}, ${RAR[got.rarity].name}. Refunded ${got.refund} coins. You have ${got.count}.`;
  // Filled in a later task: under reduced motion the dialog (and this live
  // region) was only just inserted, and a region is announced on change.
  r.timers.push(setTimeout(() => { r.live.textContent = said; }, 80));
  if (got.rarity === 'legendary' || got.rarity === 'epic') sfx.win(); else if (got.isNew) sfx.good(); else sfx.coin();
  if (got.rarity === 'legendary' && !reduceMotion()) confetti(140);
  const done = ownedIn(pack) >= pack.critters.length;
  // Ignore activation for a moment, so a double-click on Skip (which sat
  // about where this button appears) doesn't buy another pack.
  const shownAt = performance.now();
  const again = el('button', { class: 'btn gold', disabled: done || mem.coins < PRICE, onclick: () => { if (performance.now() - shownAt >= 400) startReveal(pack.id); } },
    done ? '✓ Pack complete' : mem.coins < PRICE ? `Need 🪙 ${PRICE - mem.coins} more` : `Open another · 🪙 ${PRICE}`);
  const isIcon = mem.icon === got.id;
  const iconBtn = el('button', { class: 'btn', disabled: isIcon, onclick: () => { setIcon(got.id); iconBtn.disabled = true; iconBtn.textContent = '✓ Your icon'; toast(`${got.emoji} ${got.name} is now your icon`); } }, isIcon ? '✓ Your icon' : `Make ${got.emoji} my icon`);
  const close = el('button', { class: 'btn primary', onclick: closeReveal }, 'Done');
  r.actions.innerHTML = '';
  r.actions.append(iconBtn, again, close);
  close.focus();
}
function closeReveal() {
  const r = reveal;
  if (!r) return;
  clearRevealTimers();
  document.removeEventListener('keydown', r.onKey, true);
  r.root.remove();
  document.body.classList.remove('cq-lock');
  const packId = r.pack && r.pack.id;
  reveal = null;
  if (onPage) {
    draw();
    const b = view && view.querySelector(`[data-key="open-${packId}"]`);
    const target = b && !b.disabled ? b : view && view.querySelector('h1');
    if (target) target.focus({ preventScroll: true });
  }
}

CQ.registerPage({
  id: 'collection',
  name: 'Collection',
  homeCard: {
    ico: '🎒',
    color: '#ffcc33',
    get desc() { read(); return `🪙 ${fmt(mem.coins)} coins · ${ownedTotal()} / ${TOTAL} critters collected. Earn coins by answering, open packs, pick your icon.`; },
  },
  render() {
    onPage = true;
    view = el('div', { class: 'view cq-col' });
    CQ.main.append(view);
    draw();
    CQ.addCleanup(() => { onPage = false; view = null; closeReveal(); });
  },
});

window.CQCollect = {
  coins: () => read().coins,
  grant(n) { const k = Math.floor(Number(n) || 0); mutate((s) => { s.coins = Math.max(0, s.coins + k); }); if (k > 0) coinsArrived(k); else if (onPage) refreshCoins(); return mem.coins; },
  packs: PACKS,
  owned: () => ({ ...read().owned }),
  open,
  setIcon,
  icon: () => read().icon,
  /** Recent first tries for the guess guard, oldest first: '1' right, '0' miss. */
  recent: () => read().recent,
  price: PRICE,
  rarities: RARITIES,
  /** Exact expected correct answers to collect everything (see BALANCE). */
  expectedAnswers: () => expectedCoins() / EARN,
};
})();
