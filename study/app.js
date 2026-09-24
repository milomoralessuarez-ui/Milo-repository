/* ==========================================================================
   ChemQuest — Quizlet / Blooket style study app for the Concept 1–4 notes.
   Plain JS, no build step. Data comes from data.js (window.STUDY_SETS).
   ========================================================================== */
(() => {
'use strict';

/* ---------------------------------------------------------------- utils */
const $ = (s, r = document) => r.querySelector(s);
const main = $('#main');
const PROP_KEYS = new Set(['disabled', 'checked', 'value', 'selected', 'hidden', 'readOnly']);

function el(tag, props, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'style') n.style.cssText = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2).toLowerCase(), v);
    else if (PROP_KEYS.has(k)) n[k] = v;
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    n.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return n;
}
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const fmtTime = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const fmtSecs = (ms) => (ms / 1000).toFixed(1) + 's';
const pct = (n, d) => (d ? Math.round((100 * n) / d) : 0);
const uniqBy = (arr, fn) => { const seen = new Set(); return arr.filter((x) => { const k = fn(x); if (seen.has(k)) return false; seen.add(k); return true; }); };

/* Every delayed callback is registered here so leaving a view (back button,
   a link, a new mode) cannot let a win chime, a confetti burst or an auto
   advance fire over whatever the student is looking at next. */
const timers = new Set();
function later(fn, ms) {
  const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
  timers.add(id);
  return id;
}
function clearTimers() { for (const id of timers) clearTimeout(id); timers.clear(); }

let toastTimer = 0;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

function confetti(n = 90) {
  const box = el('div', { class: 'confetti', 'aria-hidden': 'true' });
  const colors = ['#7c5cff', '#22d3ee', '#ff4d9d', '#ffb020', '#34d399', '#ffcc33'];
  for (let i = 0; i < n; i++) {
    box.append(el('i', { style: `left:${Math.random() * 100}%;background:${pick(colors)};animation-duration:${1.6 + Math.random() * 1.6}s;animation-delay:${Math.random() * .6}s;transform:rotate(${Math.random() * 360}deg)` }));
  }
  document.body.append(box);
  later(() => box.remove(), 3600);
}

function floatText(txt, color) {
  const f = el('div', { class: 'float', style: `color:${color || 'var(--good)'}` }, txt);
  document.body.append(f);
  later(() => f.remove(), 950);
}

/* --------------------------------------------------------------- state */
const KEY = 'chemquest:v1';
function loadState() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }
/** Fill in anything a payload from an older version is missing. */
function hydrate(raw) {
  const s = Object.assign({ theme: '', sound: true, starred: {}, mastery: {}, missed: {}, best: {}, stats: {}, prefs: {} }, raw || {});
  for (const k of ['starred', 'mastery', 'missed', 'best', 'prefs', 'stats']) {
    if (!s[k] || typeof s[k] !== 'object') s[k] = {};
  }
  s.stats.answered = Number(s.stats.answered) || 0;
  s.stats.correct = Number(s.stats.correct) || 0;
  return s;
}
const state = hydrate(loadState());
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage may be unavailable */ } }

// A second tab writing progress used to be invisible here, and the next save
// from this tab would quietly overwrite it. Adopt the newer payload instead —
// it is the most recent truth — keeping this tab's own view settings.
window.addEventListener('storage', (e) => {
  if (e.key !== KEY || !e.newValue) return;
  const incoming = hydrate(JSON.parse(e.newValue || '{}'));
  state.starred = incoming.starred;
  state.mastery = incoming.mastery;
  state.missed = incoming.missed;
  state.best = incoming.best;
  state.stats = incoming.stats;
});

function bumpMastery(id, correct) {
  const m = state.mastery[id] || 0;
  state.mastery[id] = correct ? Math.min(2, m + 1) : 0;
  state.stats.answered++;
  if (correct) { state.stats.correct++; delete state.missed[id]; }
  else state.missed[id] = Date.now();
  save();
}
function recordBest(key, value, higherIsBetter = true) {
  const cur = state.best[key];
  const better = cur == null || (higherIsBetter ? value > cur : value < cur);
  if (better) { state.best[key] = value; save(); }
  return better;
}

/* --------------------------------------------------------------- theme */
const root = document.documentElement;
function effectiveTheme() {
  return root.dataset.theme || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
}
function applyTheme() {
  if (state.theme) root.dataset.theme = state.theme; else delete root.dataset.theme;
  $('#theme').textContent = effectiveTheme() === 'dark' ? '🌙' : '☀️';
}
$('#theme').addEventListener('click', () => { state.theme = effectiveTheme() === 'dark' ? 'light' : 'dark'; save(); applyTheme(); });
applyTheme();

/* --------------------------------------------------------------- sound */
let actx = null;
function tone(freq, dur, type = 'sine', gain = .08, when = 0) {
  if (!state.sound) return;
  try {
    actx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume().catch(() => { /* needs a gesture first */ });
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.value = freq;
    o.connect(g); g.connect(actx.destination);
    const t = actx.currentTime + when;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur + .02);
  } catch { /* no audio */ }
}
const sfx = {
  good() { tone(660, .12); tone(880, .2, 'sine', .08, .1); },
  bad() { tone(200, .25, 'sawtooth', .05); },
  coin() { tone(1200, .08, 'square', .035); tone(1700, .16, 'square', .035, .07); },
  flip() { tone(500, .05, 'triangle', .03); },
  win() { [523, 659, 784, 1046].forEach((f, i) => tone(f, .22, 'sine', .07, i * .12)); },
  lose() { [400, 330, 260].forEach((f, i) => tone(f, .25, 'triangle', .06, i * .15)); },
};
function applySound() { $('#sound').textContent = state.sound ? '🔔' : '🔕'; $('#sound').classList.toggle('on', state.sound); }
$('#sound').addEventListener('click', () => { state.sound = !state.sound; save(); applySound(); if (state.sound) sfx.coin(); });
applySound();

/* ---------------------------------------------------------------- data */
const META = {
  1: { emoji: '🥽', color: '#22d3ee' },
  2: { emoji: '📏', color: '#7c5cff' },
  3: { emoji: '🔢', color: '#ffb020' },
  4: { emoji: '🔬', color: '#ff4d9d' },
};
/* Progress is keyed by these ids, so they are derived from the term's own text
   rather than its position: re-generating data.js then keeps a student's
   starred cards and mastery attached to the same terms instead of sliding them
   onto whatever now sits at that index. */
function textId(prefix, text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return `${prefix}-${(h >>> 0).toString(36)}`;
}
const SETS = (window.STUDY_SETS || []).map((s) => {
  const id = 'c' + s.concept;
  const meta = META[s.concept] || { emoji: '📘', color: '#7c5cff' };
  return {
    ...s, id, ...meta,
    short: `Concept ${s.concept}`,
    terms: (s.terms || []).map((t) => ({ ...t, id: textId(`${id}-t`, t.term), setId: id })),
    questions: (s.questions || []).map((q) => ({ ...q, setId: id })),
  };
});
const ALL = {
  id: 'all', concept: 0, title: 'All concepts', short: 'All concepts', emoji: '🌟', color: '#34d399',
  summary: 'Every term and question from Concepts 1–4 in one set — ideal for a unit test.',
  topics: SETS.flatMap((s) => s.topics || []),
  terms: SETS.flatMap((s) => s.terms),
  questions: SETS.flatMap((s) => s.questions),
};
const getSet = (id) => (id === 'all' ? ALL : SETS.find((s) => s.id === id));
const setOf = (setId) => getSet(setId) || ALL;
/* Every answerable item by id, so a mistake recorded in one mode can be
   rebuilt as a question in another. */
const ITEMS = new Map();
for (const s of SETS) {
  for (const t of s.terms) ITEMS.set(t.id, { id: t.id, kind: 'term', term: t, setId: s.id });
  for (const q of s.questions) ITEMS.set(q.id, { id: q.id, kind: 'q', q, setId: s.id });
}
/** The set's missed items, newest first; ids from an older data.js are pruned. */
function mistakesIn(set) {
  let pruned = false;
  const out = [];
  for (const [id, at] of Object.entries(state.missed)) {
    const it = ITEMS.get(id);
    if (!it) { delete state.missed[id]; pruned = true; continue; }
    if (set.id === 'all' || it.setId === set.id) out.push({ ...it, at });
  }
  if (pruned) save();
  return out.sort((a, b) => b.at - a.at);
}

const MODES = [
  { id: 'flashcards', name: 'Flashcards', ico: '🃏', color: '#7c5cff', desc: 'Flip through every term and sort them into "know" and "still learning".' },
  { id: 'learn', name: 'Learn', ico: '🧠', color: '#22d3ee', desc: 'Adaptive rounds of multiple choice and typed answers until everything is mastered.' },
  { id: 'test', name: 'Test', ico: '📝', color: '#34d399', desc: 'A graded practice test with an explanation for every question.' },
  { id: 'mistakes', name: 'Mistakes', ico: '🎯', color: '#fb7185', desc: 'Everything you have missed in any mode, in one place, until you get each one right.' },
  { id: 'match', name: 'Match', ico: '🧩', color: '#ffb020', desc: 'Race the clock pairing terms with their definitions.' },
  { id: 'gold', name: 'Gold Quest', ico: '💰', color: '#ffcc33', desc: 'Blooket-style: answer questions to open chests, swap gold and top the leaderboard.', game: true },
  { id: 'race', name: 'Race', ico: '🏁', color: '#4d8cff', desc: 'Blooket-style: every right answer drives your car forward. Beat four bots to the flag.', game: true },
  { id: 'blitz', name: 'Blitz', ico: '⚡', color: '#ff4d9d', desc: 'Rapid-fire questions. Speed and streaks multiply your score.', game: true },
  { id: 'guide', name: 'Study guide', ico: '📖', color: '#a8b0d8', desc: 'Every term and every question with its answer, grouped by topic.' },
];
const MODE_NAMES = Object.fromEntries(MODES.map((m) => [m.id, m.name]));

/* ------------------------------------------------- question generation */
const stripParens = (s) => s.replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
function typeable(term) {
  const t = stripParens(term.term);
  return /^[a-z][a-z\s\-']{1,32}$/i.test(t) && t.split(/\s+/).length <= 3;
}
function termAccepts(name) {
  const out = [];
  const bare = stripParens(name);
  if (bare && bare !== name) out.push(bare);
  const m = name.match(/\((.*?)\)/);
  if (m && m[1]) out.push(m[1]);
  return out;
}
function termDistractors(term, set, key) {
  // Exclude distractors that would give the answer away: any term whose name or
  // definition mentions the target term (or vice versa), e.g. comparison entries.
  const name = stripParens(term.term).toLowerCase();
  const leaks = (t) => {
    const n = stripParens(t.term).toLowerCase();
    return t.definition.toLowerCase().includes(name) || n.includes(name) || name.includes(n) || term.definition.toLowerCase().includes(n);
  };
  const pool = set.terms.filter((t) => t.id !== term.id && t.definition !== term.definition && t.term !== term.term && !leaks(t));
  const same = shuffle(pool.filter((t) => t.topic === term.topic));
  const other = shuffle(pool.filter((t) => t.topic !== term.topic));
  return uniqBy([...same, ...other], key).slice(0, 3);
}
function termMC(term, set, dir) {
  dir ||= Math.random() < .5 ? 'def2term' : 'term2def';
  const set2 = set.terms.length >= 4 ? set : ALL;
  if (dir === 'def2term') {
    const ds = termDistractors(term, set2, (t) => t.term);
    return { id: term.id, kind: 'term', type: 'mc', ask: 'Which term matches this definition?', prompt: term.definition, options: shuffle([term.term, ...ds.map((t) => t.term)]), answer: term.term, explanation: `${term.term} — ${term.definition}`, page: term.page, setId: term.setId };
  }
  const ds = termDistractors(term, set2, (t) => t.definition);
  return { id: term.id, kind: 'term', type: 'mc', ask: 'Which definition matches this term?', prompt: term.term, options: shuffle([term.definition, ...ds.map((t) => t.definition)]), answer: term.definition, explanation: `${term.term} — ${term.definition}`, page: term.page, setId: term.setId };
}
function termWritten(term) {
  return { id: term.id, kind: 'term', type: 'written', ask: 'Type the term', prompt: term.definition, answer: stripParens(term.term), accept: [term.term, ...termAccepts(term.term)], explanation: `${term.term} — ${term.definition}`, page: term.page, setId: term.setId };
}
function authored(q) {
  const out = { ...q, kind: 'q', ask: q.type === 'tf' ? 'True or false?' : q.type === 'written' ? 'Type your answer' : 'Choose the best answer' };
  if (q.type === 'tf') out.options = ['True', 'False'];
  else if (q.type === 'mc') out.options = shuffle(q.options);
  return out;
}
/* Questions suitable for tap-to-answer games: authored mc/tf plus generated term MC. */
function gameQuestions(set) {
  const qs = set.questions.filter((q) => q.type === 'mc' || q.type === 'tf').map(authored);
  const ts = set.terms.map((t) => termMC(t, set));
  return shuffle([...qs, ...ts]);
}

/* ------------------------------------------------ answer checking */
function norm(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/[×·*]/g, 'x')
    .replace(/[°º]/g, '')
    .replace(/[’'"“”]/g, '')
    .replace(/(\d),(?=\d{3})/g, '$1')
    .replace(/\s*x\s*10\s*\^?\s*/g, 'x10^')
    .replace(/(\d)e([+-]?\d+)/g, '$1x10^$2')
    .replace(/x10\^\+/g, 'x10^')
    .replace(/[.!?;:]+$/g, '')
    .replace(/^(the|a|an)\s+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}
function parseNum(s) {
  const m = norm(s).match(/-?\d*\.?\d+(?:x10\^-?\d+)?/);
  if (!m) return null;
  const [mant, exp] = m[0].split('x10^');
  const v = parseFloat(mant) * (exp != null ? Math.pow(10, parseInt(exp, 10)) : 1);
  return Number.isFinite(v) ? { value: v, unit: norm(s).slice(m.index + m[0].length).replace(/[^a-z]/g, '') } : null;
}
function checkWritten(q, input) {
  const u = norm(input);
  if (!u) return false;
  const answers = [q.answer, ...(q.accept || [])].map(norm).filter(Boolean);
  if (answers.includes(u)) return true;
  if (answers.some((a) => a.length > 3 && (u === a + 's' || u + 's' === a))) return true;
  const un = parseNum(input);
  if (un) {
    // Whether a unit is required comes from the question's own answer, not from
    // whichever accepted variant happens to be a bare number: "373" is a fair
    // answer to "convert 100 °C to Kelvin", but "373 °F" is a different claim.
    const canon = parseNum(q.answer);
    const wants = canon && canon.unit;
    for (const a of [q.answer, ...(q.accept || [])]) {
      const an = parseNum(a);
      if (!an) continue;
      const tol = Math.max(Math.abs(an.value) * 0.006, 1e-9);
      if (Math.abs(an.value - un.value) > tol) continue;
      if (wants && un.unit && un.unit !== canon.unit && un.unit !== an.unit) continue;
      return true;
    }
  }
  return false;
}

/* ---------------------------------------------------------- shell */
function setCrumbs(items) {
  const c = $('#crumbs');
  c.innerHTML = '';
  items.forEach(([label, href], i) => {
    if (i) c.append(el('span', { 'aria-hidden': 'true' }, '›'));
    c.append(href ? el('a', { href }, label) : el('span', {}, label));
  });
}
function masteryOf(set) {
  const ids = [...set.terms.map((t) => t.id), ...set.questions.map((q) => q.id)];
  const got = ids.reduce((n, id) => n + Math.min(2, state.mastery[id] || 0), 0);
  return pct(got, ids.length * 2);
}
function panelHead(set, mode, extra) {
  const m = MODES.find((x) => x.id === mode);
  return el('div', { class: 'hero', style: 'margin-bottom:18px' },
    el('span', { class: 'eyebrow' }, `${set.emoji} ${set.short} · ${set.title}`),
    el('h1', {}, `${m.ico} ${m.name}`),
    extra ? el('p', {}, extra) : null,
  );
}
function backBtn(set, label = '← Back to set') {
  return el('a', { class: 'btn ghost sm', href: `#/set/${set.id}` }, label);
}

/* ---------------------------------------------------------- home */
function renderHome() {
  const v = el('div', { class: 'view' });
  const total = ALL.questions.length;
  v.append(
    el('div', { class: 'hero' },
      el('span', { class: 'eyebrow' }, 'General Chemistry · Concepts 1–4'),
      el('h1', {}, 'Study smarter for the unit test.'),
      el('p', {}, `Flashcards, Learn, Test, Match and Blooket-style games built from your Concept 1–4 notes — ${ALL.terms.length} terms and ${total} questions. Pick a concept to start.`),
    ),
    el('div', { class: 'row', style: 'margin-bottom:8px' },
      el('div', { class: 'stat' }, el('b', {}, `${masteryOf(ALL)}%`), el('span', {}, 'Mastered')),
      el('div', { class: 'stat' }, el('b', {}, state.stats.answered), el('span', {}, 'Answered')),
      el('div', { class: 'stat' }, el('b', {}, `${pct(state.stats.correct, state.stats.answered)}%`), el('span', {}, 'Accuracy')),
      el('div', { class: 'stat' }, el('b', {}, Object.keys(state.starred).length), el('span', {}, 'Starred')),
    ),
    el('h2', { class: 'section-title' }, 'Study sets'),
  );
  const grid = el('div', { class: 'grid' });
  for (const s of [...SETS, ALL]) {
    const m = masteryOf(s);
    grid.append(el('a', { class: 'card set', href: `#/set/${s.id}`, style: `--c:${s.color}` },
      el('div', { class: 'ico' }, s.emoji),
      el('h3', {}, s.id === 'all' ? s.title : `${s.short}: ${s.title}`),
      el('p', { class: 'sum', title: s.summary }, s.summary),
      el('div', { class: 'meta' },
        el('span', { class: 'chip' }, `${s.terms.length} terms`),
        el('span', { class: 'chip' }, `${s.questions.length} questions`),
        el('span', { class: `chip ${m >= 80 ? 'good' : m > 0 ? 'warn' : ''}` }, `${m}% mastered`),
      ),
      el('div', { class: 'progress', style: 'margin-top:12px' }, el('i', { style: `width:${m}%` })),
    ));
  }
  v.append(grid);
  v.append(el('h2', { class: 'section-title' }, 'How to study'));
  v.append(el('div', { class: 'grid modes' },
    ...MODES.map((m) => el('a', { class: `card mode${m.game ? ' game' : ''}`, href: `#/set/all/${m.id}`, style: `--c:${m.color}` },
      el('div', { class: 'ico' }, m.ico), el('h3', {}, m.name), el('p', {}, m.desc))),
  ));
  main.append(v);
}

/* ------------------------------------------------------------- set */
function renderSet(set) {
  const v = el('div', { class: 'view' });
  const m = masteryOf(set);
  v.append(
    el('div', { class: 'hero' },
      el('span', { class: 'eyebrow' }, `${set.emoji} ${set.id === 'all' ? 'Everything' : set.short}`),
      el('h1', {}, set.title),
      el('p', {}, set.summary),
      el('div', { class: 'row', style: 'margin-top:14px' },
        el('span', { class: 'chip' }, `${set.terms.length} terms`),
        el('span', { class: 'chip' }, `${set.questions.length} questions`),
        ...(set.id === 'all' ? [] : (set.topics || []).map((t) => el('span', { class: 'chip brand' }, t))),
      ),
      el('div', { class: 'row', style: 'margin-top:14px;gap:14px' },
        el('div', { class: 'progress', style: 'flex:1;min-width:160px' }, el('i', { style: `width:${m}%` })),
        el('b', {}, `${m}% mastered`),
        el('button', { class: 'btn ghost sm', onclick: () => {
          if (!confirm(`Reset your progress for ${set.title}?`)) return;
          for (const t of set.terms) { delete state.mastery[t.id]; delete state.missed[t.id]; }
          for (const q of set.questions) { delete state.mastery[q.id]; delete state.missed[q.id]; }
          save(); route(); toast('Progress reset');
        } }, 'Reset progress'),
      ),
    ),
    el('h2', { class: 'section-title' }, 'Study modes'),
  );
  const grid = el('div', { class: 'grid modes' });
  for (const md of MODES) {
    const best = state.best[`${md.id}:${set.id}`];
    let chip = null;
    if (md.id === 'mistakes') {
      const n = mistakesIn(set).length;
      chip = el('span', { class: `chip ${n ? 'warn' : 'good'}` }, n ? `${n} to review` : 'All clear');
    } else if (best != null && ['match', 'gold', 'blitz', 'race'].includes(md.id)) {
      chip = el('span', { class: 'chip warn' }, md.id === 'match' || md.id === 'race' ? `Best ${fmtSecs(best)}` : `Best ${best.toLocaleString()}`);
    }
    grid.append(el('a', { class: `card mode${md.game ? ' game' : ''}`, href: `#/set/${set.id}/${md.id}`, style: `--c:${md.color}` },
      el('div', { class: 'ico' }, md.ico),
      el('h3', {}, md.name),
      el('p', {}, md.desc),
      chip ? el('div', { class: 'meta' }, chip) : null,
    ));
  }
  v.append(grid);
  main.append(v);
}

/* ------------------------------------------------------- flashcards */
function renderFlashcards(set) {
  const prefs = state.prefs.flash ||= { defFirst: false, starredOnly: false };
  const v = el('div', { class: 'view' });
  v.append(panelHead(set, 'flashcards', 'Tap the card to flip it. Use ← → to move, space to flip, 1 = still learning, 2 = know.'));
  const wrap = el('div', { class: 'flash-wrap' });
  v.append(wrap);
  main.append(v);

  let deck = [], idx = 0, flipped = false, know = new Set(), learning = new Set(), dir = 0;
  function baseDeck() {
    const t = prefs.starredOnly ? set.terms.filter((x) => state.starred[x.id]) : set.terms;
    return t.slice();
  }
  function start(cards, shuffled = false) {
    deck = shuffled ? shuffle(cards) : cards.slice();
    idx = 0; flipped = false; know = new Set(); learning = new Set();
    draw();
  }
  function draw() {
    wrap.innerHTML = '';
    const toolbar = el('div', { class: 'toolbar' },
      backBtn(set),
      el('button', { class: 'btn sm', onclick: () => { start(baseDeck(), true); toast('Shuffled'); } }, '🔀 Shuffle'),
      el('button', { class: `btn sm${prefs.defFirst ? ' primary' : ''}`, onclick: () => { prefs.defFirst = !prefs.defFirst; save(); flipped = false; draw(); } }, prefs.defFirst ? 'Definition first' : 'Term first'),
      el('button', { class: `btn sm${prefs.starredOnly ? ' primary' : ''}`, 'aria-pressed': prefs.starredOnly ? 'true' : 'false', onclick: () => { prefs.starredOnly = !prefs.starredOnly; save(); start(baseDeck()); } }, `⭐ Starred only (${set.terms.filter((x) => state.starred[x.id]).length})`),
    );
    wrap.append(toolbar);
    if (!deck.length) {
      wrap.append(el('div', { class: 'panel empty' }, prefs.starredOnly ? 'No starred terms yet. Star cards with the ☆ button or turn off "Starred only".' : 'No terms in this set.'));
      return;
    }
    if (idx >= deck.length) return drawSummary();
    const t = deck[idx];
    const front = prefs.defFirst ? t.definition : t.term;
    const back = prefs.defFirst ? t.term : t.definition;
    const star = el('button', { class: `flash-star${state.starred[t.id] ? ' on' : ''}`, 'aria-label': `Star "${t.term}"`, 'aria-pressed': state.starred[t.id] ? 'true' : 'false', onclick: (e) => { e.stopPropagation(); toggleStar(t.id); star.classList.toggle('on', !!state.starred[t.id]); star.setAttribute('aria-pressed', state.starred[t.id] ? 'true' : 'false'); star.textContent = state.starred[t.id] ? '★' : '☆'; } }, state.starred[t.id] ? '★' : '☆');
    // The face turned away is hidden from assistive tech, so the card reads as
    // the side actually showing — an aria-label here would replace that text.
    const faceFront = el('div', { class: 'flash-face front', 'aria-hidden': flipped ? 'true' : null },
      el('span', { class: 'lbl' }, prefs.defFirst ? 'Definition' : 'Term'), el('div', { class: 'txt' }, front),
      el('span', { class: 'hint' }, 'tap to flip'), star);
    const faceBack = el('div', { class: 'flash-face back', 'aria-hidden': flipped ? null : 'true' },
      el('span', { class: 'lbl' }, prefs.defFirst ? 'Term' : 'Definition'), el('div', { class: 'txt' }, back),
      el('span', { class: 'hint' }, `${setOf(t.setId).short} · slide ${t.page}`));
    const card = el('div', { class: `flash${flipped ? ' flipped' : ''}${dir < 0 ? ' slide-left' : dir > 0 ? ' slide-right' : ''}`, role: 'button', tabindex: '0', 'aria-roledescription': 'flashcard', onclick: flip, onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); flip(); } } },
      faceFront, faceBack);
    dir = 0;
    wrap.append(
      el('div', { class: 'flash-tally' }, el('span', { class: 'bad' }, `Still learning: ${learning.size}`), el('span', {}, `${idx + 1} / ${deck.length}`), el('span', { class: 'good' }, `Know: ${know.size}`)),
      el('div', { class: 'progress' }, el('i', { style: `width:${pct(idx, deck.length)}%` })),
      el('div', { class: 'flash-stage' }, card),
      el('div', { class: 'flash-sort' },
        el('button', { class: 'btn learn', onclick: () => mark(false) }, '✗ Still learning'),
        el('button', { class: 'btn know', onclick: () => mark(true) }, '✓ Know it'),
      ),
      el('div', { class: 'flash-nav' },
        el('button', { class: 'btn', 'aria-label': 'Previous card', disabled: idx === 0, onclick: prev }, '←'),
        el('span', { class: 'count' }, `${idx + 1} / ${deck.length}`),
        el('button', { class: 'btn', 'aria-label': 'Next card', onclick: next }, '→'),
      ),
    );
    function flip() {
      flipped = !flipped;
      card.classList.toggle('flipped', flipped);
      faceFront.setAttribute('aria-hidden', flipped ? 'true' : 'false');
      faceBack.setAttribute('aria-hidden', flipped ? 'false' : 'true');
      sfx.flip();
    }
  }
  function mark(k) {
    const t = deck[idx];
    (k ? know : learning).add(t.id); (k ? learning : know).delete(t.id);
    if (k) bumpMastery(t.id, true);
    dir = 1; idx++; flipped = false; draw();
  }
  function next() { if (idx < deck.length) { dir = 1; idx++; flipped = false; draw(); } }
  function prev() { if (idx > 0) { dir = -1; idx--; flipped = false; draw(); } }
  function drawSummary() {
    const learnCards = deck.filter((t) => learning.has(t.id));
    if (!learnCards.length) { sfx.win(); confetti(); }
    wrap.append(el('div', { class: 'panel' },
      el('div', { class: 'result-head' },
        el('div', { style: 'font-size:3rem' }, learnCards.length ? '📚' : '🎉'),
        el('h2', {}, learnCards.length ? 'Round complete' : 'You know every card!'),
        el('p', { class: 'note' }, `Know: ${know.size} · Still learning: ${learning.size} · Skipped: ${deck.length - know.size - learning.size}`),
      ),
      el('div', { class: 'row center' },
        learnCards.length ? el('button', { class: 'btn primary', onclick: () => start(learnCards, true) }, `Review the ${learnCards.length} you're still learning`) : null,
        el('button', { class: 'btn', onclick: () => start(baseDeck(), true) }, 'Restart all'),
        backBtn(set, 'Back to set'),
      ),
    ));
  }
  cleanup = onKeys((e) => {
    if (idx >= deck.length || !deck.length) return;
    if (e.key === 'ArrowRight') next();
    else if (e.key === 'ArrowLeft') prev();
    else if (e.key === ' ' || e.key === 'Enter') { if (e.target === document.body) { e.preventDefault(); $('.flash', wrap)?.click(); } }
    else if (e.key === '1') mark(false);
    else if (e.key === '2') mark(true);
  });
  start(baseDeck());
}
/** Wire up questionCard's "Override: I was right" so the score and the saved
    mastery agree with the green box the student just saw. */
function wireOverride(card, id, after) {
  card.addEventListener('override', () => {
    state.mastery[id] = Math.min(2, (state.mastery[id] || 0) + 1);
    state.stats.correct++;
    delete state.missed[id];
    save();
    if (after) after();
  });
}
function toggleStar(id) { if (state.starred[id]) delete state.starred[id]; else state.starred[id] = true; save(); }
function onKeys(fn) {
  const h = (e) => { if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return; fn(e); };
  document.addEventListener('keydown', h);
  return () => document.removeEventListener('keydown', h);
}

/* ------------------------------------------------ question widget */
/* Renders one question; calls onAnswer(correct, given) once. Returns the element. */
function questionCard(q, { onAnswer, showTag = true, instant = true }) {
  const box = el('div', { class: 'q-card' });
  let done = false;
  const src = q.setId ? `${setOf(q.setId).short} · slide ${q.page}` : '';
  if (showTag) box.append(el('div', { class: 'q-tag' }, q.ask || (q.type === 'tf' ? 'True or false?' : 'Choose the best answer')));
  box.append(el('div', { class: 'q-prompt' }, q.prompt));

  function finish(correct, given, chosenBtn) {
    if (done) return; done = true;
    if (q.type !== 'written') {
      for (const b of box.querySelectorAll('.opt')) {
        b.disabled = true;
        const key = b.querySelector('.k');
        if (b.dataset.v === q.answer) {
          b.classList.add('correct');
          if (key) key.textContent = '✓';
          b.append(el('span', { class: 'sr-only' }, ' — correct answer'));
        } else if (b === chosenBtn) {
          b.classList.add('wrong');
          if (key) key.textContent = '✗';
          b.append(el('span', { class: 'sr-only' }, ' — your answer, incorrect'));
        } else b.classList.add('dim');
      }
    }
    if (instant) {
      box.append(el('div', { class: `feedback ${correct ? 'good' : 'bad'}`, role: 'status', 'aria-live': 'polite' },
        el('b', { class: 'title' }, correct ? `✓ ${pick(['Correct!', 'Nice!', 'You got it!', 'Exactly right.'])}` : `✗ Not quite — the answer is: ${q.answer}`),
        q.explanation ? el('div', { class: 'exp' }, q.explanation) : null,
        src ? el('div', { class: 'src' }, src) : null,
      ));
    }
    onAnswer(correct, given);
  }
  if (q.type === 'written') {
    const inp = el('input', { class: 'input', type: 'text', placeholder: 'Type your answer…', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'Your answer' });
    const submit = () => { if (done) return; const v = inp.value.trim(); if (!v) { inp.focus(); return; } inp.disabled = true; finish(checkWritten(q, v), v); if (!checkWritten(q, v)) addOverride(v); };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
    const row = el('div', { class: 'written' }, inp,
      el('button', { class: 'btn primary', onclick: submit }, 'Answer'),
      el('button', { class: 'btn ghost', onclick: () => { if (done) return; inp.disabled = true; finish(false, ''); } }, "Don't know"),
    );
    box.append(row);
    // Auto-focus on a mouse/trackpad device only: on a phone this would throw
    // the keyboard up over the question before it has been read.
    if (matchMedia('(pointer: fine)').matches) later(() => inp.focus(), 50);
    function addOverride(v) {
      const b = el('button', { class: 'btn sm ghost', style: 'justify-self:start', onclick: () => {
        b.remove();
        const fb = $('.feedback', box); if (fb) { fb.className = 'feedback good'; $('.title', fb).textContent = 'Marked correct.'; }
        // caller may re-score: signal through a custom event
        box.dispatchEvent(new CustomEvent('override', { detail: { given: v } }));
      } }, 'Override: I was right');
      box.append(b);
    }
  } else {
    const opts = el('div', { class: 'opts' });
    (q.options || []).forEach((o, i) => {
      const b = el('button', { class: 'opt', 'data-v': o, onclick: () => finish(o === q.answer, o, b) }, el('span', { class: 'k' }, q.type === 'tf' ? (o === 'True' ? 'T' : 'F') : String(i + 1)), el('span', {}, o));
      opts.append(b);
    });
    box.append(opts);
    box.pickByKey = (k) => { const btns = [...opts.querySelectorAll('.opt')]; const i = q.type === 'tf' ? { t: 0, f: 1, 1: 0, 2: 1 }[k] : parseInt(k, 10) - 1; if (btns[i] && !done) btns[i].click(); };
  }
  return box;
}

/* --------------------------------------------------------------- learn */
function renderLearn(set) {
  const prefs = state.prefs.learn ||= { mc: true, written: true, tf: true, starredOnly: false };
  const v = el('div', { class: 'view' });
  v.append(panelHead(set, 'learn', 'Each item needs two correct answers in a row to be mastered. Misses come back later in the round.'));
  const body = el('div', { class: 'stack' });
  v.append(body);
  main.append(v);

  const ROUND = 7;
  function items() {
    const out = [];
    for (const t of set.terms) {
      if (prefs.starredOnly && !state.starred[t.id]) continue;
      if (!prefs.mc && !(prefs.written && typeable(t))) continue;
      out.push({ id: t.id, kind: 'term', term: t });
    }
    if (!prefs.starredOnly) for (const q of set.questions) {
      if (!prefs[q.type]) continue;
      out.push({ id: q.id, kind: 'q', q });
    }
    return out;
  }
  function instance(it) {
    const m = state.mastery[it.id] || 0;
    if (it.kind === 'q') return authored(it.q);
    const canType = prefs.written && typeable(it.term);
    if (!prefs.mc) return termWritten(it.term);
    if (canType && m >= 1) return termWritten(it.term);
    return termMC(it.term, set);
  }
  let queue = [], roundTotal = 0, roundCorrect = 0, seenThisRound = new Set();
  function toolbar() {
    const all = items();
    const mastered = all.filter((i) => (state.mastery[i.id] || 0) >= 2).length;
    const familiar = all.filter((i) => (state.mastery[i.id] || 0) === 1).length;
    return el('div', { class: 'learn-head' },
      el('div', { class: 'toolbar', style: 'margin-bottom:0' },
        backBtn(set),
        el('div', { class: 'seg', role: 'group', 'aria-label': 'Question types' },
          ...['mc', 'tf', 'written'].map((k) => el('button', { class: prefs[k] ? 'on' : '', 'aria-pressed': prefs[k] ? 'true' : 'false', onclick: () => { const on = ['mc', 'tf', 'written'].filter((x) => prefs[x]); if (prefs[k] && on.length === 1) return toast('Keep at least one type on'); prefs[k] = !prefs[k]; save(); newRound(); } }, { mc: 'Multiple choice', tf: 'True/false', written: 'Written' }[k])),
        ),
        el('button', { class: `btn sm${prefs.starredOnly ? ' primary' : ''}`, 'aria-pressed': prefs.starredOnly ? 'true' : 'false', onclick: () => { prefs.starredOnly = !prefs.starredOnly; save(); newRound(); } }, '⭐ Starred only'),
      ),
      el('div', { class: 'row between' },
        el('span', {}, `Mastered ${mastered} · Familiar ${familiar} · Not started ${all.length - mastered - familiar}`),
        el('span', {}, `Round progress: ${roundTotal - queue.length} / ${roundTotal}`),
      ),
      el('div', { class: 'progress good' }, el('i', { style: `width:${pct(mastered * 2 + familiar, all.length * 2)}%` })),
    );
  }
  function newRound() {
    const all = items();
    const remaining = all.filter((i) => (state.mastery[i.id] || 0) < 2);
    body.innerHTML = '';
    if (!all.length) { body.append(toolbar(), el('div', { class: 'panel empty' }, 'Nothing to study with these settings. Turn on more question types or star some terms.')); return; }
    if (!remaining.length) {
      sfx.win(); confetti();
      body.append(toolbar(), el('div', { class: 'panel' },
        el('div', { class: 'result-head' }, el('div', { style: 'font-size:3rem' }, '🏆'), el('h2', {}, 'Everything mastered!'), el('p', { class: 'note' }, `All ${all.length} items in ${set.title} are mastered. Try a Test or Gold Quest next.`)),
        el('div', { class: 'row center' },
          el('button', { class: 'btn primary', onclick: () => { for (const i of all) delete state.mastery[i.id]; save(); newRound(); } }, 'Start over'),
          el('a', { class: 'btn', href: `#/set/${set.id}/test` }, 'Take a test'),
          el('a', { class: 'btn gold', href: `#/set/${set.id}/gold` }, '💰 Gold Quest'),
        )));
      return;
    }
    const sorted = shuffle(remaining).sort((a, b) => (state.mastery[a.id] || 0) - (state.mastery[b.id] || 0));
    queue = sorted.slice(0, ROUND);
    roundTotal = queue.length; roundCorrect = 0; seenThisRound = new Set();
    nextQ();
  }
  function nextQ() {
    body.innerHTML = '';
    if (!queue.length) return roundSummary();
    const it = queue[0];
    const q = instance(it);
    let settled = false;
    const card = questionCard(q, { onAnswer: (correct) => {
      settled = true;
      bumpMastery(it.id, correct);
      queue.shift();
      if (correct) { roundCorrect++; sfx.good(); }
      else { sfx.bad(); if (!seenThisRound.has(it.id)) { queue.push(it); roundTotal++; } }
      seenThisRound.add(it.id);
      const btn = el('button', { class: 'btn primary lg', onclick: nextQ }, correct ? 'Continue →' : 'Got it, continue →');
      card.append(el('div', { class: 'row' }, btn));
      btn.focus();
      // Long explanations need longer on screen than a one-liner.
      if (correct) later(() => { if (document.body.contains(btn)) nextQ(); }, clamp(1200 + (q.explanation || '').length * 22, 1400, 6000));
    } });
    wireOverride(card, it.id, () => {
      // the miss was re-queued for later in the round; take it back out
      const i = queue.lastIndexOf(it);
      if (i >= 0) { queue.splice(i, 1); roundTotal--; }
      roundCorrect++;
    });
    body.append(toolbar(), el('div', { class: 'panel' }, card));
    keyPick = (k) => { if (!settled && card.pickByKey) card.pickByKey(k); };
  }
  function roundSummary() {
    const all = items();
    const mastered = all.filter((i) => (state.mastery[i.id] || 0) >= 2).length;
    body.append(toolbar(), el('div', { class: 'panel' },
      el('div', { class: 'result-head' },
        el('div', { style: 'font-size:3rem' }, roundCorrect === roundTotal ? '🔥' : '💪'),
        el('h2', {}, `Round done: ${roundCorrect} / ${roundTotal}`),
        el('p', { class: 'note' }, `${mastered} of ${all.length} items mastered. Keep going!`),
      ),
      el('div', { class: 'row center' }, el('button', { class: 'btn primary lg', onclick: newRound }, 'Next round →'), backBtn(set, 'Back to set')),
    ));
  }
  let keyPick = null;
  cleanup = onKeys((e) => { if (keyPick && /^[1-4tf]$/i.test(e.key)) keyPick(e.key.toLowerCase()); });
  newRound();
}

/* ---------------------------------------------------------------- test */
function renderTest(set) {
  const prefs = state.prefs.test ||= { count: 20, mc: true, tf: true, written: true, starredOnly: false };
  const v = el('div', { class: 'view' });
  v.append(panelHead(set, 'test', 'Answer everything, then submit to see your score and the explanations.'));
  const body = el('div', { class: 'stack' });
  v.append(body);
  main.append(v);

  function setup() {
    body.innerHTML = '';
    const counts = [10, 20, 30, 'All'];
    const types = ['mc', 'tf', 'written'];
    body.append(el('div', { class: 'panel stack' },
      backBtn(set),
      el('div', { class: 'field' }, el('label', {}, 'Number of questions'),
        el('div', { class: 'seg', role: 'group', 'aria-label': 'Number of questions' }, ...counts.map((c) => el('button', { class: prefs.count === c ? 'on' : '', 'aria-pressed': prefs.count === c ? 'true' : 'false', onclick: () => { prefs.count = c; save(); setup(); } }, String(c))))),
      el('div', { class: 'field' }, el('label', {}, 'Question types'),
        el('div', { class: 'seg', role: 'group', 'aria-label': 'Question types' }, ...types.map((k) => el('button', { class: prefs[k] ? 'on' : '', 'aria-pressed': prefs[k] ? 'true' : 'false', onclick: () => { if (prefs[k] && types.filter((x) => prefs[x]).length === 1) return toast('Keep at least one type on'); prefs[k] = !prefs[k]; save(); setup(); } }, { mc: 'Multiple choice', tf: 'True/false', written: 'Written' }[k])))),
      el('div', { class: 'row' },
        el('button', { class: `btn sm${prefs.starredOnly ? ' primary' : ''}`, 'aria-pressed': prefs.starredOnly ? 'true' : 'false', onclick: () => { prefs.starredOnly = !prefs.starredOnly; save(); setup(); } }, '⭐ Starred terms only'),
        el('span', { class: 'note' }, 'Pool: ' + buildPool().length + ' questions'),
      ),
      el('div', { class: 'row' }, el('button', { class: 'btn primary lg', onclick: start }, 'Start test')),
    ));
  }
  function buildPool() {
    let pool = [];
    if (!prefs.starredOnly) pool = set.questions.filter((q) => prefs[q.type]).map(authored);
    const terms = prefs.starredOnly ? set.terms.filter((t) => state.starred[t.id]) : set.terms;
    const tq = [];
    for (const t of terms) {
      if (prefs.written && typeable(t) && Math.random() < .5) tq.push(termWritten(t));
      else if (prefs.mc) tq.push(termMC(t, set));
      else if (prefs.written && typeable(t)) tq.push(termWritten(t));
    }
    return [...shuffle(pool), ...shuffle(tq)];
  }
  function start() {
    const pool = buildPool();
    if (!pool.length) return toast('No questions match those settings');
    const n = prefs.count === 'All' ? pool.length : Math.min(prefs.count, pool.length);
    const qs = shuffle(pool.slice(0, n));
    const answers = new Map();
    body.innerHTML = '';
    const list = el('div', { class: 'panel' });
    const t0 = Date.now();
    qs.forEach((q, i) => {
      const row = el('div', { class: 'test-q', id: `tq${i}` }, el('div', { class: 'n' }, `QUESTION ${i + 1} OF ${qs.length}`), el('div', { class: 'q-prompt' }, q.prompt));
      if (q.type === 'written') {
        row.append(el('div', { class: 'written' }, el('input', { class: 'input', type: 'text', placeholder: 'Type your answer…', autocomplete: 'off', 'aria-label': `Answer to question ${i + 1}`, oninput: (e) => { answers.set(i, e.target.value); row.classList.remove('blank'); } })));
      } else {
        const opts = el('div', { class: 'opts' });
        q.options.forEach((o, k) => {
          const b = el('button', { class: 'opt', 'data-v': o, 'aria-pressed': 'false', onclick: () => {
            answers.set(i, o); row.classList.remove('blank');
            for (const x of opts.querySelectorAll('.opt')) { const on = x === b; x.classList.toggle('picked', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); }
          } }, el('span', { class: 'k' }, q.type === 'tf' ? (o === 'True' ? 'T' : 'F') : String(k + 1)), el('span', {}, o));
          opts.append(b);
        });
        row.append(opts);
      }
      list.append(row);
    });
    let armed = false;
    const submitBtn = el('button', { class: 'btn primary lg', onclick: () => {
      const blanks = qs.map((_, i) => i).filter((i) => !(answers.get(i) || '').trim());
      if (blanks.length && !armed) {
        armed = true;
        submitBtn.textContent = `${blanks.length} unanswered — submit anyway?`;
        // Take the student to the first gap instead of making them hunt.
        for (const i of blanks) $(`#tq${i}`, list)?.classList.add('blank');
        $(`#tq${blanks[0]}`, list)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        toast(`Question ${blanks[0] + 1} is the first one left blank`);
        return;
      }
      grade(qs, answers, Date.now() - t0);
    } }, 'Submit test');
    list.append(el('div', { class: 'row', style: 'padding-top:18px' }, submitBtn, el('button', { class: 'btn ghost', onclick: setup }, 'Cancel')));
    body.append(el('div', { class: 'row between' }, backBtn(set), el('span', { class: 'note' }, `${qs.length} questions · ${set.title}`)), list);
  }
  function grade(qs, answers, ms) {
    const results = qs.map((q, i) => {
      const given = (answers.get(i) || '').trim();
      const correct = q.type === 'written' ? checkWritten(q, given) : given === q.answer;
      bumpMastery(q.id, correct);
      return { q, given, correct };
    });
    const score = results.filter((r) => r.correct).length;
    const p = pct(score, qs.length);
    if (p >= 80) { sfx.win(); confetti(); } else sfx.lose();
    body.innerHTML = '';
    const review = el('div', { class: 'panel' });
    results.forEach((r, i) => {
      const row = el('div', { class: 'test-q' }, el('div', { class: 'n' }, `QUESTION ${i + 1} · ${r.correct ? '✅ CORRECT' : '❌ INCORRECT'}`), el('div', { class: 'q-prompt' }, r.q.prompt));
      if (r.q.type === 'written') {
        row.append(el('div', { class: `feedback ${r.correct ? 'good' : 'bad'}` },
          el('b', { class: 'title' }, r.correct ? `Your answer: ${r.given}` : `Your answer: ${r.given || '(blank)'} · Correct: ${r.q.answer}`),
          r.q.explanation ? el('div', { class: 'exp' }, r.q.explanation) : null,
          el('div', { class: 'src' }, `${setOf(r.q.setId).short} · slide ${r.q.page}`)));
      } else {
        const opts = el('div', { class: 'opts' });
        r.q.options.forEach((o, k) => opts.append(el('button', { class: `opt${o === r.q.answer ? ' correct' : o === r.given ? ' wrong' : ' dim'}`, disabled: true }, el('span', { class: 'k' }, r.q.type === 'tf' ? (o === 'True' ? 'T' : 'F') : String(k + 1)), el('span', {}, o))));
        row.append(opts, el('div', { class: `feedback ${r.correct ? 'good' : 'bad'}` }, r.q.explanation ? el('div', { class: 'exp' }, r.q.explanation) : null, el('div', { class: 'src' }, `${setOf(r.q.setId).short} · slide ${r.q.page}`)));
      }
      review.append(row);
    });
    const missed = results.filter((r) => !r.correct);
    body.append(
      el('div', { class: 'panel' },
        el('div', { class: 'result-head' },
          el('div', { class: 'score-ring', style: `--p:${p}` }, el('div', {}, `${p}%`)),
          el('h2', {}, p === 100 ? 'Perfect score!' : p >= 80 ? 'Great work!' : p >= 60 ? 'Getting there.' : 'Keep studying.'),
          el('p', { class: 'note' }, `${score} of ${qs.length} correct · ${fmtTime(ms)}`),
        ),
        el('div', { class: 'row center' },
          el('button', { class: 'btn primary', onclick: start }, 'New test'),
          missed.length ? el('button', { class: 'btn', onclick: () => { body.innerHTML = ''; retry(missed.map((r) => r.q)); } }, `Retry the ${missed.length} missed`) : null,
          el('button', { class: 'btn ghost', onclick: setup }, 'Change settings'),
          backBtn(set, 'Back to set'),
        )),
      el('h2', { class: 'section-title' }, 'Review'), review);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function retry(qs) {
    // quick re-test of the missed questions with instant feedback
    let i = 0, score = 0;
    const box = el('div', { class: 'stack' });
    body.append(el('div', { class: 'row between' }, backBtn(set), el('span', { class: 'note' }, 'Retrying missed questions')), box);
    const step = () => {
      box.innerHTML = '';
      if (i >= qs.length) { box.append(el('div', { class: 'panel result-head' }, el('h2', {}, `Retry done: ${score} / ${qs.length}`), el('div', { class: 'row center' }, el('button', { class: 'btn primary', onclick: start }, 'New test'), backBtn(set, 'Back to set')))); return; }
      const q = qs[i].type === 'mc' ? { ...qs[i], options: shuffle(qs[i].options) } : qs[i];
      const card = questionCard(q, { onAnswer: (c) => { bumpMastery(q.id, c); if (c) { score++; sfx.good(); } else sfx.bad(); card.append(el('div', { class: 'row' }, el('button', { class: 'btn primary', onclick: () => { i++; step(); } }, 'Continue →'))); } });
      wireOverride(card, q.id, () => { score++; });
      box.append(el('div', { class: 'panel' }, el('div', { class: 'note', style: 'margin-bottom:10px' }, `${i + 1} / ${qs.length}`), card));
    };
    step();
  }
  setup();
}

/* --------------------------------------------------------------- match */
function renderMatch(set) {
  const v = el('div', { class: 'view' });
  v.append(panelHead(set, 'match', 'Tap a term, then its definition. Six pairs per round; a wrong pair adds one second.'));
  const body = el('div', { class: 'stack' });
  v.append(body);
  main.append(v);
  const PAIRS = 6;
  let timerId = 0;
  cleanup = () => clearInterval(timerId);

  function intro() {
    clearInterval(timerId);
    body.innerHTML = '';
    const best = state.best[`match:${set.id}`];
    body.append(el('div', { class: 'panel game-intro' },
      el('div', { class: 'big-ico' }, '🧩'),
      el('h2', {}, 'Match'),
      el('p', {}, `Clear the board as fast as you can. ${best != null ? `Your best time is ${fmtSecs(best)}.` : 'No best time yet.'}`),
      el('div', { class: 'row center' }, el('button', { class: 'btn primary lg', onclick: play }, 'Start game'), backBtn(set, 'Back to set')),
    ));
  }
  function play() {
    body.innerHTML = '';
    let pool = set.terms.filter((t) => t.definition.length <= 110);
    if (pool.length < PAIRS) pool = set.terms;
    const chosen = uniqBy(shuffle(pool), (t) => t.definition).slice(0, PAIRS);
    if (chosen.length < 2) { body.append(el('div', { class: 'panel empty' }, 'Not enough terms to play.')); return; }
    const tiles = shuffle([
      ...chosen.map((t) => ({ pair: t.id, text: t.term, term: true })),
      ...chosen.map((t) => ({ pair: t.id, text: t.definition, term: false })),
    ]);
    let first = null, left = chosen.length, started = 0, penalty = 0, lock = false;
    const clock = el('span', { class: 'timer', role: 'timer', 'aria-label': 'Elapsed time' }, '0.0s');
    const grid = el('div', { class: 'match-grid' });
    const tick = () => { if (started) clock.textContent = fmtSecs(Date.now() - started + penalty); };
    timerId = setInterval(tick, 100);
    tiles.forEach((t) => {
      const b = el('button', { class: `tile${t.term ? ' term' : ''}`, onclick: () => choose(b, t) }, t.text);
      grid.append(b);
    });
    function choose(b, t) {
      if (lock || b.classList.contains('gone')) return;
      if (!started) started = Date.now();
      if (first && first.b === b) { b.classList.remove('sel'); first = null; return; }
      b.classList.add('sel');
      if (!first) { first = { b, t }; return; }
      lock = true;
      const a = first; first = null;
      if (a.t.pair === t.pair && a.t.term !== t.term) {
        sfx.coin();
        for (const x of [a.b, b]) { x.classList.remove('sel'); x.classList.add('ok'); }
        later(() => { for (const x of [a.b, b]) { x.classList.add('gone'); x.disabled = true; } lock = false; }, 260);
        bumpMastery(t.pair, true);
        if (--left === 0) later(finish, 320);
      } else {
        sfx.bad(); penalty += 1000;
        for (const x of [a.b, b]) { x.classList.remove('sel'); x.classList.add('no'); }
        floatText('+1s', 'var(--bad)');
        later(() => { for (const x of [a.b, b]) x.classList.remove('no'); lock = false; }, 380);
      }
    }
    function finish() {
      clearInterval(timerId);
      const ms = Date.now() - started + penalty;
      const isBest = recordBest(`match:${set.id}`, ms, false);
      sfx.win(); if (isBest) confetti();
      body.innerHTML = '';
      body.append(el('div', { class: 'panel game-intro' },
        el('div', { class: 'big-ico' }, isBest ? '🏆' : '✅'),
        el('h2', {}, `${fmtSecs(ms)}${isBest ? ' — new best!' : ''}`),
        el('p', {}, `Penalties: ${penalty / 1000}s · Best: ${fmtSecs(state.best[`match:${set.id}`])}`),
        el('div', { class: 'row center' }, el('button', { class: 'btn primary lg', onclick: play }, 'Play again'), backBtn(set, 'Back to set')),
      ));
    }
    body.append(el('div', { class: 'row between' }, backBtn(set), el('div', { class: 'row' }, el('span', { class: 'note' }, 'Time'), clock)), grid);
  }
  intro();
}

/* -------------------------------------------------- game helpers */
const BOT_NAMES = ['Beaker Bob', 'Molly Mole', 'Kelvin Kat', 'Sir Isaac', 'Lab Rat Lucy', 'Bunsen Bee', 'Dr. Pipette', 'Erlen Meyer'];
function makeBots(n) {
  return shuffle(BOT_NAMES).slice(0, n).map((name) => ({ name, gold: 0, skill: .5 + Math.random() * .6 }));
}
function leaderboard(players, meName, fmt = (g) => g.toLocaleString()) {
  const sorted = players.slice().sort((a, b) => b.gold - a.gold);
  return el('div', { class: 'board' }, ...sorted.map((p, i) => el('div', { class: `brow${p.name === meName ? ' me' : ''}` },
    el('span', { class: 'rank' }, `${i + 1}.`), el('span', { class: 'nm' }, p.name), el('span', { class: 'amt' }, fmt(p.gold)))));
}

/* ----------------------------------------------------------- gold quest */
function renderGold(set) {
  const prefs = state.prefs.gold ||= { minutes: 3 };
  const v = el('div', { class: 'view' });
  v.append(panelHead(set, 'gold', 'Answer correctly to open a chest. Chests hold gold — or a swap, a double, or a nasty surprise.'));
  const body = el('div', { class: 'stack' });
  v.append(body);
  main.append(v);
  const ME = 'You';
  let timerId = 0, botId = 0;
  cleanup = () => { clearInterval(timerId); clearInterval(botId); };

  function intro() {
    clearInterval(timerId); clearInterval(botId);
    body.innerHTML = '';
    const best = state.best[`gold:${set.id}`];
    body.append(el('div', { class: 'panel game-intro' },
      el('div', { class: 'big-ico' }, '💰'),
      el('h2', {}, 'Gold Quest'),
      el('p', {}, `Beat five bots to the most gold before time runs out. ${best != null ? `Your best haul is ${best.toLocaleString()} gold.` : ''}`),
      el('div', { class: 'field' }, el('label', {}, 'Game length'),
        el('div', { class: 'seg', role: 'group', 'aria-label': 'Game length' }, ...[2, 3, 5].map((m) => el('button', { class: prefs.minutes === m ? 'on' : '', onclick: () => { prefs.minutes = m; save(); intro(); } }, `${m} min`)))),
      el('div', { class: 'row center' }, el('button', { class: 'btn gold lg', onclick: play }, 'Start quest'), backBtn(set, 'Back to set')),
    ));
  }
  function play() {
    const pool = gameQuestions(set);
    if (!pool.length) { body.innerHTML = ''; body.append(el('div', { class: 'panel empty' }, 'No questions available.')); return; }
    let qi = 0, gold = 0, streak = 0, answered = 0, correct = 0, live = true;
    const bots = makeBots(5);
    const players = [{ name: ME, get gold() { return gold; } }, ...bots];
    const endAt = Date.now() + prefs.minutes * 60000;
    const clock = el('span', { class: 'bigtimer', role: 'timer', 'aria-label': 'Time remaining' }, fmtTime(prefs.minutes * 60000));
    const hud = el('div', { class: 'game-hud', role: 'group', 'aria-label': 'Game status' },
      el('div', { class: 'stat' }, el('b', { class: 'gold-amt', id: 'g-gold' }, '0'), el('span', {}, 'Gold')),
      el('div', { class: 'stat' }, el('b', { class: 'streak', id: 'g-streak' }, '0'), el('span', {}, 'Streak')),
      el('div', { class: 'stat' }, el('b', { id: 'g-rank' }, '—'), el('span', {}, 'Rank')),
      el('div', { style: 'margin-left:auto' }, clock),
    );
    const stage = el('div', { class: 'panel' });
    body.innerHTML = '';
    body.append(el('div', { class: 'row between' }, backBtn(set), el('span', { class: 'note' }, set.title)), hud, stage);
    const updateHud = () => {
      $('#g-gold', hud).textContent = gold.toLocaleString();
      $('#g-streak', hud).textContent = String(streak);
      const rank = players.slice().sort((a, b) => b.gold - a.gold).findIndex((p) => p.name === ME) + 1;
      $('#g-rank', hud).textContent = `#${rank}`;
    };
    timerId = setInterval(() => {
      const left = endAt - Date.now();
      clock.textContent = fmtTime(left);
      clock.classList.toggle('low', left < 15000);
      if (left <= 0) finish();
    }, 250);
    botId = setInterval(() => {
      for (const b of bots) if (Math.random() < .5 * b.skill) b.gold += pick([10, 15, 20, 25, 30, 40, 50, 75]) * (Math.random() < .2 ? 2 : 1);
      updateHud();
    }, 3500);
    function nextQuestion() {
      if (!live) return;
      stage.innerHTML = '';
      const q = pool[qi++ % pool.length];
      const inst = q.type === 'mc' ? { ...q, options: shuffle(q.options) } : q;
      const card = questionCard(inst, { instant: false, onAnswer: (ok) => {
        if (!live) return;
        answered++;
        bumpMastery(q.id, ok);
        if (ok) { correct++; streak++; sfx.good(); later(chests, 450); }
        else {
          streak = 0; sfx.bad();
          card.append(el('div', { class: 'feedback bad' }, el('b', { class: 'title' }, `Answer: ${q.answer}`), q.explanation ? el('div', { class: 'exp' }, q.explanation) : null), el('div', { class: 'row' }, el('button', { class: 'btn primary', onclick: nextQuestion }, 'Next →')));
        }
        updateHud();
      } });
      stage.append(card);
      keyPick = (k) => card.pickByKey && card.pickByKey(k);
    }
    function chests() {
      if (!live) return;
      keyPick = null;
      stage.innerHTML = '';
      const bonus = streak >= 3 ? 25 * streak : 0;
      const outcomes = shuffle([
        { kind: 'gold', amt: pick([10, 20, 25, 30, 40, 50]) },
        { kind: 'gold', amt: pick([50, 60, 75, 80, 100]) },
        pick([
          { kind: 'gold', amt: pick([150, 200]) },
          { kind: 'double' },
          { kind: 'swap' },
          { kind: 'steal' },
          { kind: 'lose' },
          { kind: 'nothing' },
          { kind: 'gold', amt: pick([15, 35, 65]) },
        ]),
      ]);
      const grid = el('div', { class: 'chests' });
      outcomes.forEach((o, i) => {
        const c = el('button', { class: 'chest', onclick: () => open(o, c) }, '🎁', el('span', {}, `Chest ${i + 1}`));
        grid.append(c);
      });
      stage.append(el('div', { class: 'loot' }, el('div', { class: 'big good' }, 'Correct! Pick a chest'), el('div', { class: 'note' }, `Streak ${streak}`)), grid);
      if (bonus) stage.append(el('div', { class: 'note', style: 'text-align:center;margin-top:10px' }, `🔥 Streak bonus: +${bonus} gold on top of this chest`));
      function open(o, btn) {
        for (const x of grid.querySelectorAll('.chest')) x.disabled = true;
        btn.classList.add('open');
        let msg = '', cls = 'gold', delta = 0;
        const richest = bots.slice().sort((a, b) => b.gold - a.gold)[0];
        const target = pick(bots);
        switch (o.kind) {
          case 'gold': delta = o.amt; msg = `+${o.amt} gold`; sfx.coin(); break;
          case 'double': delta = gold; msg = gold ? `Double gold! +${gold}` : 'Double gold… of nothing'; sfx.coin(); break;
          case 'lose': delta = -Math.floor(gold * .25); msg = gold ? `Lose 25%: ${delta} gold` : 'Lose 25% — of nothing, phew'; cls = 'bad'; btn.classList.add('bad'); sfx.lose(); break;
          case 'nothing': msg = 'Empty chest…'; cls = 'bad'; btn.classList.add('bad'); sfx.bad(); break;
          case 'steal': { const s = Math.floor(richest.gold * .2); richest.gold -= s; delta = s; msg = `Stole ${s} gold from ${richest.name}!`; sfx.coin(); break; }
          case 'swap': { const mine = gold; delta = target.gold - gold; target.gold = mine; msg = `Swapped with ${target.name}: ${delta >= 0 ? '+' : ''}${delta}`; cls = delta >= 0 ? 'gold' : 'bad'; if (delta < 0) btn.classList.add('bad'); (delta >= 0 ? sfx.coin : sfx.lose)(); break; }
        }
        if (bonus) { delta += bonus; msg += ` (+${bonus} streak bonus)`; }
        gold = Math.max(0, gold + delta);
        btn.firstChild.textContent = o.kind === 'gold' || o.kind === 'double' || o.kind === 'steal' ? '💰' : o.kind === 'swap' ? '🔁' : o.kind === 'lose' ? '💸' : '📦';
        floatText(delta >= 0 ? `+${delta}` : `${delta}`, delta >= 0 ? 'var(--gold)' : 'var(--bad)');
        updateHud();
        stage.prepend(el('div', { class: 'loot' }, el('div', { class: `big ${cls}` }, msg)));
        stage.append(el('div', { class: 'row center', style: 'margin-top:14px' }, el('button', { class: 'btn primary lg', onclick: nextQuestion }, 'Next question →')));
        later(() => { if (document.body.contains(btn)) nextQuestion(); }, 1800);
      }
    }
    function finish() {
      if (!live) return;
      live = false;
      clearInterval(timerId); clearInterval(botId); keyPick = null;
      const isBest = recordBest(`gold:${set.id}`, gold);
      const rank = players.slice().sort((a, b) => b.gold - a.gold).findIndex((p) => p.name === ME) + 1;
      if (rank === 1) { sfx.win(); confetti(); } else sfx.lose();
      body.innerHTML = '';
      body.append(el('div', { class: 'panel' },
        el('div', { class: 'game-intro' },
          el('div', { class: 'big-ico' }, rank === 1 ? '👑' : '💰'),
          el('h2', {}, rank === 1 ? 'You won the quest!' : `You finished #${rank}`),
          el('p', {}, `${gold.toLocaleString()} gold${isBest ? ' — new personal best!' : ''} · ${correct} / ${answered} correct`),
        ),
        leaderboard(players.map((p) => ({ name: p.name, gold: p.gold })), ME),
        el('div', { class: 'row center', style: 'margin-top:18px' }, el('button', { class: 'btn gold lg', onclick: play }, 'Play again'), el('button', { class: 'btn ghost', onclick: intro }, 'Change length'), backBtn(set, 'Back to set')),
      ));
    }
    updateHud();
    nextQuestion();
  }
  let keyPick = null;
  const offKeys = onKeys((e) => { if (keyPick && /^[1-4tf]$/i.test(e.key)) keyPick(e.key.toLowerCase()); });
  const prevCleanup = cleanup;
  cleanup = () => { prevCleanup(); offKeys(); };
  intro();
}

/* ----------------------------------------------------------------- blitz */
function renderBlitz(set) {
  const prefs = state.prefs.blitz ||= { seconds: 60 };
  const v = el('div', { class: 'view' });
  v.append(panelHead(set, 'blitz', 'Every question is worth up to 200 points — faster answers score more, and streaks multiply it.'));
  const body = el('div', { class: 'stack' });
  v.append(body);
  main.append(v);
  let timerId = 0, raf = 0;
  const offKeys = onKeys((e) => { if (keyPick && /^[1-4tf]$/i.test(e.key)) keyPick(e.key.toLowerCase()); });
  let keyPick = null;
  cleanup = () => { clearInterval(timerId); cancelAnimationFrame(raf); offKeys(); };

  function intro() {
    clearInterval(timerId); cancelAnimationFrame(raf);
    body.innerHTML = '';
    const best = state.best[`blitz:${set.id}`];
    body.append(el('div', { class: 'panel game-intro' },
      el('div', { class: 'big-ico' }, '⚡'),
      el('h2', {}, 'Blitz'),
      el('p', {}, `Rapid fire. ${best != null ? `Your best score is ${best.toLocaleString()}.` : 'Set a high score.'}`),
      el('div', { class: 'field' }, el('label', {}, 'Round length'),
        el('div', { class: 'seg', role: 'group', 'aria-label': 'Round length' }, ...[60, 90, 120].map((s) => el('button', { class: prefs.seconds === s ? 'on' : '', onclick: () => { prefs.seconds = s; save(); intro(); } }, `${s}s`)))),
      el('div', { class: 'row center' }, el('button', { class: 'btn hot lg', onclick: play }, 'Go!'), backBtn(set, 'Back to set')),
    ));
  }
  function play() {
    const pool = gameQuestions(set);
    if (!pool.length) { body.innerHTML = ''; body.append(el('div', { class: 'panel empty' }, 'No questions available.')); return; }
    let qi = 0, score = 0, streak = 0, best = 0, answered = 0, correct = 0, qStart = 0, live = true;
    const endAt = Date.now() + prefs.seconds * 1000;
    const clock = el('span', { class: 'bigtimer', role: 'timer', 'aria-label': 'Time remaining' }, fmtTime(prefs.seconds * 1000));
    const hud = el('div', { class: 'game-hud', role: 'group', 'aria-label': 'Game status' },
      el('div', { class: 'stat' }, el('b', { id: 'b-score' }, '0'), el('span', {}, 'Score')),
      el('div', { class: 'stat' }, el('b', { class: 'streak', id: 'b-streak' }, '0'), el('span', {}, 'Streak')),
      el('div', { class: 'stat' }, el('b', { id: 'b-mult' }, '×1.0'), el('span', {}, 'Multiplier')),
      el('div', { style: 'margin-left:auto' }, clock),
    );
    const bar = el('div', { class: 'speedbar' }, el('i', { style: 'width:100%' }));
    const stage = el('div', { class: 'panel' });
    body.innerHTML = '';
    body.append(el('div', { class: 'row between' }, backBtn(set), el('span', { class: 'note' }, set.title)), hud, bar, stage);
    const mult = () => Math.min(2, 1 + streak * .1);
    const updateHud = () => { $('#b-score', hud).textContent = score.toLocaleString(); $('#b-streak', hud).textContent = String(streak); $('#b-mult', hud).textContent = `×${mult().toFixed(1)}`; };
    timerId = setInterval(() => {
      const left = endAt - Date.now();
      clock.textContent = fmtTime(left);
      clock.classList.toggle('low', left < 10000);
      if (left <= 0) finish();
    }, 250);
    // The speed bonus drains over a window sized to the reading: four long
    // definitions deserve longer than a one-line true/false.
    let SPEED_MS = 8000;
    const readMs = (q) => clamp(5000 + (q.prompt.length + (q.options || []).join('').length) * 30, 8000, 20000);
    const frame = () => { const f = clamp(1 - (Date.now() - qStart) / SPEED_MS, 0, 1); bar.firstChild.style.width = `${f * 100}%`; raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame);
    function nextQuestion() {
      if (!live) return;
      stage.innerHTML = '';
      const q = pool[qi++ % pool.length];
      const inst = q.type === 'mc' ? { ...q, options: shuffle(q.options) } : q;
      SPEED_MS = readMs(inst);
      qStart = Date.now();
      const card = questionCard(inst, { instant: false, onAnswer: (ok) => {
        if (!live) return;
        answered++;
        bumpMastery(q.id, ok);
        const speed = clamp(1 - (Date.now() - qStart) / SPEED_MS, 0, 1);
        if (ok) {
          correct++; streak++; best = Math.max(best, streak);
          const pts = Math.round((100 + 100 * speed) * mult());
          score += pts; sfx.good(); floatText(`+${pts}`, 'var(--good)');
          later(nextQuestion, 500);
        } else {
          streak = 0; sfx.bad();
          card.append(el('div', { class: 'feedback bad' }, el('b', { class: 'title' }, `Answer: ${q.answer}`)), el('div', { class: 'row' }, el('button', { class: 'btn primary', onclick: nextQuestion }, 'Next →')));
          later(() => { if (document.body.contains(card)) nextQuestion(); }, 2200);
        }
        updateHud();
      } });
      stage.append(card);
      keyPick = (k) => card.pickByKey && card.pickByKey(k);
    }
    function finish() {
      if (!live) return;
      live = false;
      clearInterval(timerId); cancelAnimationFrame(raf); keyPick = null;
      const isBest = recordBest(`blitz:${set.id}`, score);
      if (isBest && score > 0) { sfx.win(); confetti(); } else sfx.lose();
      body.innerHTML = '';
      body.append(el('div', { class: 'panel game-intro' },
        el('div', { class: 'big-ico' }, isBest && score > 0 ? '🏆' : '⚡'),
        el('h2', {}, `${score.toLocaleString()} points${isBest && score > 0 ? ' — new best!' : ''}`),
        el('p', {}, `${correct} / ${answered} correct · longest streak ${best} · best ever ${(state.best[`blitz:${set.id}`] || 0).toLocaleString()}`),
        el('div', { class: 'row center' }, el('button', { class: 'btn hot lg', onclick: play }, 'Play again'), el('button', { class: 'btn ghost', onclick: intro }, 'Change length'), backBtn(set, 'Back to set')),
      ));
    }
    updateHud();
    nextQuestion();
  }
  intro();
}

/* ------------------------------------------------------------ mistakes */
function renderMistakes(set) {
  const v = el('div', { class: 'view' });
  v.append(panelHead(set, 'mistakes', 'Every question you have got wrong in any mode lands here. Answer it correctly and it leaves the list.'));
  const body = el('div', { class: 'stack' });
  v.append(body);
  main.append(v);
  let keyPick = null;
  cleanup = onKeys((e) => { if (keyPick && /^[1-4tf]$/i.test(e.key)) keyPick(e.key.toLowerCase()); });

  const asQuestion = (it) => {
    if (it.kind === 'q') return authored(it.q);
    // Terms come back the way they are hardest to fake: typed when the name is
    // short enough to type, otherwise as multiple choice.
    return typeable(it.term) && Math.random() < .5 ? termWritten(it.term) : termMC(it.term, setOf(it.setId));
  };
  const label = (it) => (it.kind === 'q' ? it.q.prompt : `${it.term.term} — ${it.term.definition}`);

  function overview() {
    keyPick = null;
    body.innerHTML = '';
    const items = mistakesIn(set);
    if (!items.length) {
      body.append(el('div', { class: 'panel game-intro' },
        el('div', { class: 'big-ico' }, '🎯'),
        el('h2', {}, 'Nothing to review'),
        el('p', {}, `You have no outstanding mistakes in ${set.title}. Missed questions from Learn, Test, Match and the games collect here automatically.`),
        el('div', { class: 'row center' },
          el('a', { class: 'btn primary', href: `#/set/${set.id}/test` }, 'Take a test'),
          el('a', { class: 'btn', href: `#/set/${set.id}/learn` }, 'Learn'),
          backBtn(set, 'Back to set')),
      ));
      return;
    }
    const byConcept = new Map();
    for (const it of items) byConcept.set(it.setId, (byConcept.get(it.setId) || 0) + 1);
    body.append(
      el('div', { class: 'panel stack' },
        el('div', { class: 'row between' },
          el('div', {},
            el('h2', { style: 'font-size:1.4rem' }, `${items.length} to review`),
            set.id === 'all' ? el('p', { class: 'note', style: 'margin-top:4px' }, [...byConcept].map(([id, n]) => `${setOf(id).short}: ${n}`).join(' · ')) : null),
          el('div', { class: 'row' },
            el('button', { class: 'btn primary lg', onclick: () => review(items) }, `Review ${items.length > 20 ? 'the newest 20' : 'them'}`),
            el('button', { class: 'btn ghost sm', onclick: () => {
              if (!confirm(`Clear all ${items.length} mistakes from the list? Your mastery is not affected.`)) return;
              for (const it of items) delete state.missed[it.id];
              save(); overview(); toast('Mistakes list cleared');
            } }, 'Clear list'))),
      ),
      el('h2', { class: 'section-title' }, 'Most recent first'),
      el('div', {}, ...items.slice(0, 40).map((it) => el('div', { class: 'term-row mistake-row' },
        el('b', {}, label(it)),
        el('span', { class: 'note' }, `${setOf(it.setId).short} · slide ${(it.q || it.term).page}`)))),
      items.length > 40 ? el('p', { class: 'note' }, `…and ${items.length - 40} more.`) : null,
    );
  }

  function review(items) {
    const round = items.slice(0, 20);
    const queue = round.slice();
    const retried = new Set();
    let cleared = 0;
    const next = () => {
      keyPick = null;
      body.innerHTML = '';
      if (!queue.length) return summary(round.length, cleared);
      const it = queue[0];
      const q = asQuestion(it);
      const card = questionCard(q, { onAnswer: (ok) => {
        bumpMastery(it.id, ok);
        queue.shift();
        if (ok) { cleared++; sfx.good(); }
        else {
          sfx.bad();
          // one more go later in this round, then it waits for next time
          if (!retried.has(it.id)) { retried.add(it.id); queue.push(it); }
        }
        const btn = el('button', { class: 'btn primary lg', onclick: next }, 'Continue →');
        card.append(el('div', { class: 'row' }, btn));
        btn.focus();
      } });
      wireOverride(card, it.id, () => {
        cleared++;
        const i = queue.lastIndexOf(it);
        if (i >= 0) queue.splice(i, 1);
      });
      body.append(
        el('div', { class: 'learn-head' },
          el('div', { class: 'row between' }, backBtn(set), el('span', {}, `${round.length - queue.length + 1} of ${round.length}${retried.size ? ` · ${retried.size} coming back` : ''}`)),
          el('div', { class: 'progress good' }, el('i', { style: `width:${pct(round.length - queue.length, round.length)}%` }))),
        el('div', { class: 'panel' }, card));
      keyPick = (k) => card.pickByKey && card.pickByKey(k);
    };
    next();
  }

  function summary(total, cleared) {
    const left = mistakesIn(set).length;
    if (!left) { sfx.win(); confetti(); }
    body.append(el('div', { class: 'panel game-intro' },
      el('div', { class: 'big-ico' }, left ? '💪' : '🎉'),
      el('h2', {}, `Cleared ${cleared} of ${total}`),
      el('p', {}, left ? `${left} still on the list. They will be here when you come back.` : 'Your mistakes list is empty.'),
      el('div', { class: 'row center' },
        left ? el('button', { class: 'btn primary lg', onclick: overview }, `See the ${left} left`) : null,
        backBtn(set, 'Back to set')),
    ));
  }
  overview();
}

/* ---------------------------------------------------------------- race */
function renderRace(set) {
  const prefs = state.prefs.race ||= { length: 15, level: 'normal' };
  const v = el('div', { class: 'view' });
  v.append(panelHead(set, 'race', 'Every right answer moves your car one space. Three in a row gives a boost. First across the line wins.'));
  const body = el('div', { class: 'stack' });
  v.append(body);
  main.append(v);
  let tick = 0;
  let keyPick = null;
  const offKeys = onKeys((e) => { if (keyPick && /^[1-4tf]$/i.test(e.key)) keyPick(e.key.toLowerCase()); });
  cleanup = () => { clearInterval(tick); offKeys(); };

  // Seconds per space for each bot, drawn from this range. The race is decided
  // by the fastest of four draws, so the ranges sit slower than a single bot's
  // pace would suggest. Simulated over 15 spaces, the chance of winning is:
  //                     strong (4s, 90%)  steady (6s, 80%)  average (8s, 70%)
  //   easy   [13, 18]        100%              ~95%              ~55%
  //   normal [8, 11.5]       ~98%              ~55%               ~7%
  //   hard   [5.5, 7.5]      ~73%               ~7%                0%
  // (seconds per question and accuracy; a wrong answer costs 2.6 s).
  const LEVELS = { easy: [13, 18], normal: [8, 11.5], hard: [5.5, 7.5] };
  const CARS = ['🚗', '🚙', '🚕', '🚓'];

  function intro() {
    clearInterval(tick);
    keyPick = null;
    body.innerHTML = '';
    const best = state.best[`race:${set.id}`];
    body.append(el('div', { class: 'panel game-intro' },
      el('div', { class: 'big-ico' }, '🏁'),
      el('h2', {}, 'Race'),
      el('p', {}, `Race four bots to the flag. ${best != null ? `Your fastest win is ${fmtSecs(best)}.` : 'Win a race to set a best time.'}`),
      el('div', { class: 'field' }, el('label', {}, 'Track length'),
        el('div', { class: 'seg', role: 'group', 'aria-label': 'Track length' }, ...[10, 15, 20].map((n) => el('button', { class: prefs.length === n ? 'on' : '', 'aria-pressed': prefs.length === n ? 'true' : 'false', onclick: () => { prefs.length = n; save(); intro(); } }, `${n} spaces`)))),
      el('div', { class: 'field' }, el('label', {}, 'Bots'),
        el('div', { class: 'seg', role: 'group', 'aria-label': 'Bot speed' }, ...Object.keys(LEVELS).map((k) => el('button', { class: prefs.level === k ? 'on' : '', 'aria-pressed': prefs.level === k ? 'true' : 'false', onclick: () => { prefs.level = k; save(); intro(); } }, k[0].toUpperCase() + k.slice(1))))),
      el('div', { class: 'row center' }, el('button', { class: 'btn primary lg', onclick: play }, 'Start race'), backBtn(set, 'Back to set')),
    ));
  }

  function play() {
    const pool = gameQuestions(set);
    if (!pool.length) { body.innerHTML = ''; body.append(el('div', { class: 'panel empty' }, 'No questions available.')); return; }
    const LEN = prefs.length;
    const [slow, fast] = LEVELS[prefs.level] || LEVELS.normal;
    const me = { name: 'You', car: '🏎️', pos: 0, me: true, done: 0 };
    const bots = shuffle(BOT_NAMES).slice(0, 4).map((name, i) => ({
      name, car: CARS[i], pos: 0, done: 0,
      secs: fast + Math.random() * (slow - fast),   // this bot's seconds per space
    }));
    const racers = [me, ...bots];
    const finishers = [];
    const t0 = Date.now();
    let qi = 0, streak = 0, answered = 0, correct = 0, live = true;

    const lanes = racers.map((r) => {
      const car = el('span', { class: 'racer', 'aria-hidden': 'true' }, r.car);
      const lane = el('div', { class: `lane${r.me ? ' me' : ''}` },
        el('span', { class: 'lane-name' }, r.name),
        el('div', { class: 'lane-track' }, car, el('span', { class: 'flag', 'aria-hidden': 'true' }, '🏁')));
      r.el = car; r.lane = lane;
      return lane;
    });
    const status = el('p', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });
    const place = el('b', { id: 'r-place' }, '—');
    const hud = el('div', { class: 'game-hud', role: 'group', 'aria-label': 'Race status' },
      el('div', { class: 'stat' }, el('b', { id: 'r-pos' }, `0 / ${LEN}`), el('span', {}, 'Spaces')),
      el('div', { class: 'stat' }, el('b', { class: 'streak', id: 'r-streak' }, '0'), el('span', {}, 'Streak')),
      el('div', { class: 'stat' }, place, el('span', {}, 'Place')));
    const stage = el('div', { class: 'panel' });
    body.innerHTML = '';
    body.append(el('div', { class: 'row between' }, backBtn(set), el('span', { class: 'note' }, set.title)),
      el('div', { class: 'track' }, ...lanes), hud, status, stage);

    const standing = () => racers.slice().sort((a, b) => (b.done ? 1e9 - b.done : b.pos) - (a.done ? 1e9 - a.done : a.pos));
    const draw = () => {
      for (const r of racers) r.el.style.left = `calc(4px + (100% - 2.2rem - 8px) * ${Math.min(1, r.pos / LEN)})`;
      $('#r-pos', hud).textContent = `${me.pos} / ${LEN}`;
      $('#r-streak', hud).textContent = String(streak);
      const i = standing().indexOf(me) + 1;
      place.textContent = `${i}${['st', 'nd', 'rd'][i - 1] || 'th'}`;
    };
    const advance = (r, n) => {
      if (r.done || !live) return;
      r.pos = Math.min(LEN, r.pos + n);
      if (r.pos >= LEN) { r.done = Date.now(); finishers.push(r); r.lane.classList.add('finished'); }
    };

    // Bots roll every half second; each move is a coin flip weighted by its speed.
    tick = setInterval(() => {
      if (!live) return;
      for (const b of bots) if (!b.done && Math.random() < 0.5 / b.secs) advance(b, 1);
      draw();
      if (bots.every((b) => b.done)) finish();
    }, 500);

    function nextQuestion() {
      if (!live) return;
      stage.innerHTML = '';
      const q = pool[qi++ % pool.length];
      const inst = q.type === 'mc' ? { ...q, options: shuffle(q.options) } : q;
      const card = questionCard(inst, { instant: false, onAnswer: (ok) => {
        if (!live) return;
        answered++;
        bumpMastery(q.id, ok);
        if (ok) {
          correct++; streak++;
          const boost = streak >= 3 && streak % 3 === 0;
          advance(me, boost ? 2 : 1);
          sfx.good();
          floatText(boost ? 'Boost! +2' : '+1', boost ? 'var(--warm)' : 'var(--good)');
          status.textContent = `Correct. ${me.pos} of ${LEN} spaces.${boost ? ' Boost!' : ''}`;
          draw();
          if (me.done) return later(finish, 350);
          later(nextQuestion, 450);
        } else {
          streak = 0; sfx.bad();
          status.textContent = `Not quite. The answer is ${q.answer}.`;
          card.append(el('div', { class: 'feedback bad' }, el('b', { class: 'title' }, `✗ Answer: ${q.answer}`), q.explanation ? el('div', { class: 'exp' }, q.explanation) : null),
            el('div', { class: 'row' }, el('button', { class: 'btn primary', onclick: nextQuestion }, 'Next →')));
          later(() => { if (document.body.contains(card)) nextQuestion(); }, 2600);
          draw();
        }
      } });
      stage.append(card);
      keyPick = (k) => card.pickByKey && card.pickByKey(k);
    }

    function finish() {
      if (!live) return;
      live = false;
      clearInterval(tick);
      keyPick = null;
      draw();
      const order = standing();
      const placeNum = order.indexOf(me) + 1;
      const ms = me.done ? me.done - t0 : null;
      const won = placeNum === 1 && me.done;
      const isBest = won && recordBest(`race:${set.id}`, ms, false);
      if (won) { sfx.win(); confetti(); } else sfx.lose();
      const medal = ['🥇', '🥈', '🥉'][placeNum - 1] || '🏁';
      body.innerHTML = '';
      body.append(el('div', { class: 'panel' },
        el('div', { class: 'game-intro' },
          el('div', { class: 'big-ico' }, medal),
          el('h2', {}, won ? `You won${isBest ? ' — fastest yet!' : '!'}` : me.done ? `You finished ${placeNum}${['st', 'nd', 'rd'][placeNum - 1] || 'th'}` : 'The bots all finished first'),
          el('p', {}, `${correct} / ${answered} correct${ms != null ? ` · ${fmtSecs(ms)}` : ` · ${me.pos} of ${LEN} spaces`}${state.best[`race:${set.id}`] != null ? ` · best win ${fmtSecs(state.best[`race:${set.id}`])}` : ''}`)),
        el('div', { class: 'board' }, ...order.map((r, i) => el('div', { class: `brow${r.me ? ' me' : ''}` },
          el('span', { class: 'rank' }, `${i + 1}.`), el('span', { class: 'nm' }, `${r.car} ${r.name}`),
          el('span', { class: 'amt' }, r.done ? fmtSecs(r.done - t0) : `${r.pos} / ${LEN}`)))),
        el('div', { class: 'row center', style: 'margin-top:18px' },
          el('button', { class: 'btn primary lg', onclick: play }, 'Race again'),
          el('button', { class: 'btn ghost', onclick: intro }, 'Change track'),
          backBtn(set, 'Back to set')),
      ));
    }
    draw();
    nextQuestion();
  }
  intro();
}

/* ------------------------------------------------------------- guide */
function renderGuide(set) {
  const v = el('div', { class: 'view' });
  v.append(panelHead(set, 'guide', 'Read through everything, star the terms you find hard, then drill them in Learn with "Starred only".'));
  const body = el('div', { class: 'stack' });
  v.append(body);
  main.append(v);
  let query = '', showQ = false;
  const search = el('input', { class: 'input', type: 'search', placeholder: 'Search terms and questions…', 'aria-label': 'Search', oninput: (e) => { query = e.target.value.trim().toLowerCase(); draw(); } });
  const list = el('div', {});
  body.append(el('div', { class: 'toolbar' }, backBtn(set), search, el('button', { class: 'btn sm', onclick: () => { showQ = !showQ; draw(); } }, 'Toggle question bank')), list);
  function draw() {
    list.innerHTML = '';
    const match = (s) => !query || s.toLowerCase().includes(query);
    const sets = set.id === 'all' ? SETS : [set];
    for (const s of sets) {
      const topics = [...new Set(s.terms.map((t) => t.topic || 'General'))];
      let any = false;
      const block = el('div', {});
      if (set.id === 'all') block.append(el('h2', { class: 'section-title' }, `${s.emoji} ${s.short}: ${s.title}`));
      for (const tp of topics) {
        const rows = s.terms.filter((t) => (t.topic || 'General') === tp && (match(t.term) || match(t.definition)));
        if (!rows.length) continue;
        any = true;
        const sec = el('div', { class: 'guide-topic' }, el('h3', {}, tp));
        for (const t of rows) {
          const star = el('button', { class: `star${state.starred[t.id] ? ' on' : ''}`, 'aria-label': `Star "${t.term}"`, 'aria-pressed': state.starred[t.id] ? 'true' : 'false', onclick: () => { toggleStar(t.id); star.classList.toggle('on', !!state.starred[t.id]); star.setAttribute('aria-pressed', state.starred[t.id] ? 'true' : 'false'); star.textContent = state.starred[t.id] ? '★' : '☆'; } }, state.starred[t.id] ? '★' : '☆');
          sec.append(el('div', { class: 'term-row' }, el('b', {}, t.term), el('span', {}, t.definition), star));
        }
        block.append(sec);
      }
      if (showQ) {
        const qs = s.questions.filter((q) => match(q.prompt) || match(q.answer));
        if (qs.length) {
          any = true;
          const sec = el('div', { class: 'guide-topic' }, el('h3', {}, `Question bank (${qs.length})`));
          for (const q of qs) sec.append(el('div', { class: 'term-row' }, el('b', {}, q.prompt), el('span', {}, `${q.answer}${q.explanation ? ' — ' + q.explanation : ''}`), el('span', { class: 'note' }, `p.${q.page}`)));
          block.append(sec);
        }
      }
      if (any) list.append(block);
    }
    if (!list.children.length) list.append(el('div', { class: 'empty' }, 'Nothing matches that search.'));
  }
  draw();
}

/* -------------------------------------------------------------- router */
let cleanup = null;
function route() {
  if (cleanup) { try { cleanup(); } catch { /* ignore */ } cleanup = null; }
  clearTimers();
  main.innerHTML = '';
  window.scrollTo({ top: 0 });
  if (!SETS.length) { main.append(el('div', { class: 'empty' }, 'No study data found — data.js is missing.')); return; }
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] !== 'set') { setCrumbs([]); document.title = 'ChemQuest — study Concepts 1–4'; return renderHome(); }
  const set = getSet(parts[1]);
  if (!set) { location.hash = '#/'; return; }
  const views = { '': renderSet, flashcards: renderFlashcards, learn: renderLearn, test: renderTest, mistakes: renderMistakes, match: renderMatch, gold: renderGold, race: renderRace, blitz: renderBlitz, guide: renderGuide };
  // An unrecognised mode in the URL shows the set rather than a half-titled page.
  const mode = views[parts[2]] ? parts[2] : '';
  setCrumbs(mode ? [[set.short, `#/set/${set.id}`], [MODE_NAMES[mode]]] : [[set.short]]);
  document.title = `${mode ? MODE_NAMES[mode] + ' · ' : ''}${set.title} — ChemQuest`;
  views[mode](set);
  // Send the screen reader (and the keyboard) to the new view's heading.
  const h = main.querySelector('h1');
  if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
}
window.addEventListener('hashchange', route);
route();
})();
