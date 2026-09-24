/* ==========================================================================
   Problem Lab — endless, freshly generated calculation practice for
   Concepts 2 and 3, with a worked solution for every problem.

   A fixed question bank lets a student memorise "6,100 s" without ever
   learning to move a decimal. Here every problem is new, built only from the
   methods and numbers in the class notes (the prefix chart, the three
   temperature formulas, averaging, scientific notation and the dimensional-
   analysis table), and every answer is computed exactly with integer
   arithmetic — so no 0.30000000000000004 ever reaches a student.

   Registers through window.CQ (see the plugin section of app.js):
   - mode "lab" on Concepts 2, 3 and All;
   - a game source (multiple-choice versions whose wrong options are the
     classic mistakes) for Gold Quest, Race and Blitz;
   - an item resolver so a missed "lab:<skill>" comes back in Mistakes.
   window.CQLab exposes the generators for tools/verify-lab.mjs.
   ========================================================================== */
(() => {
'use strict';
const CQ = window.CQ;
if (!CQ) return;
const { el, shuffle, pick } = CQ;

const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const chance = (p) => Math.random() < p;
const MINUS = '−';
/** Typographic minus for prose; answers keep "-" so they can be typed and checked. */
const pretty = (s) => String(s).replace(/(^|[\s(])-(?=\d)/g, `$1${MINUS}`);

/* ------------------------------------------------ exact rational numbers
   Every quantity is a fraction of two BigInts, so 250.4 ÷ 30.48 or
   5/9 × (77 − 32) is exact until the moment it is deliberately rounded. */
const B = BigInt;
const p10 = (n) => 10n ** B(n);
function gcd(a, b) { if (a < 0n) a = -a; if (b < 0n) b = -b; while (b) [a, b] = [b, a % b]; return a; }
function R(p, q = 1n) {
  p = B(p); q = B(q);
  if (q === 0n) throw new Error('division by zero');
  if (q < 0n) { p = -p; q = -q; }
  const g = gcd(p, q) || 1n;
  return { p: p / g, q: q / g };
}
/** "1,234.5" or "−40" → exact rational. */
function D(s) {
  const t = String(s).replace(/,/g, '').replace(MINUS, '-').trim();
  const m = t.match(/^(-?)(\d*)(?:\.(\d+))?$/);
  if (!m || (!m[2] && !m[3])) throw new Error(`not a decimal: ${s}`);
  const frac = m[3] || '';
  return R(B((m[2] || '0') + frac) * (m[1] ? -1n : 1n), p10(frac.length));
}
const mul = (a, b) => R(a.p * b.p, a.q * b.q);
const div = (a, b) => R(a.p * b.q, a.q * b.p);
const add = (a, b) => R(a.p * b.q + b.p * a.q, a.q * b.q);
const sub = (a, b) => add(a, { p: -b.p, q: b.q });
const scale10 = (a, n) => (n >= 0 ? R(a.p * p10(n), a.q) : R(a.p, a.q * p10(-n)));
const isNeg = (a) => a.p < 0n;
const isZero = (a) => a.p === 0n;
function terminates(r) { let q = r.q; while (q % 2n === 0n) q /= 2n; while (q % 5n === 0n) q /= 5n; return q === 1n; }

/** int ÷ 10^k as a decimal string; trim drops trailing zeros after the point. */
function placePoint(int, k, trim) {
  const neg = int < 0n;
  let s = (neg ? -int : int).toString();
  if (k > 0) {
    s = s.padStart(k + 1, '0');
    s = `${s.slice(0, -k)}.${s.slice(-k)}`;
    if (trim) s = s.replace(/\.?0+$/, '');
  } else if (k < 0) s += '0'.repeat(-k);
  return (neg && /[1-9]/.test(s) ? '-' : '') + s;
}
/** Exact decimal string of a terminating fraction, no grouping commas. */
function plain(r) {
  let k = 0;
  while (p10(k) % r.q !== 0n) { k++; if (k > 60) throw new Error('does not terminate'); }
  return placePoint(r.p * (p10(k) / r.q), k, true);
}
/** Round to n significant figures, half away from zero; keeps trailing zeros. */
function sigStr(r, n) {
  if (isZero(r)) return '0';
  const neg = r.p < 0n;
  const P = neg ? -r.p : r.p, Q = r.q;
  let e = P.toString().length - Q.toString().length;
  const atLeast = (x) => (x >= 0 ? P >= Q * p10(x) : P * p10(-x) >= Q);
  if (!atLeast(e)) e -= 1;
  let s = n - 1 - e;
  let num = P, den = Q;
  if (s >= 0) num *= p10(s); else den *= p10(-s);
  let int = (2n * num + den) / (2n * den);
  if (int >= p10(n)) { int /= 10n; s -= 1; }
  return placePoint(neg ? -int : int, s, false);
}
/** The first n significant digits of a positive r, cut off (not rounded),
    as a decimal string, e.g. 8.2152230… → "8.21522" for n = 6. */
function sigCut(r, n) {
  const P = r.p < 0n ? -r.p : r.p, Q = r.q;
  let e = P.toString().length - Q.toString().length;
  if (!(e >= 0 ? P >= Q * p10(e) : P * p10(-e) >= Q)) e -= 1;
  const s = n - 1 - e;
  const int = s >= 0 ? (P * p10(s)) / Q : P / (Q * p10(-s));
  return placePoint(int, s, false);
}
/** Round to dp decimal places, half away from zero, as an exact rational. */
function roundDp(r, dp) {
  const neg = r.p < 0n;
  const P = neg ? -r.p : r.p;
  const int = (2n * P * p10(dp) + r.q) / (2n * r.q);
  return R(neg ? -int : int, p10(dp));
}
function commas(s) {
  const neg = s.startsWith('-');
  if (neg) s = s.slice(1);
  let [i, f] = s.split('.');
  if (i.length >= 4) i = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (neg ? '-' : '') + i + (f != null ? `.${f}` : '');
}
const fx = (r) => commas(plain(r));
const toNum = (r) => (terminates(r) ? Number(plain(r)) : Number(r.p) / Number(r.q));
function sigCount(r) {
  return plain(r).replace('-', '').replace('.', '').replace(/^0+/, '').replace(/0+$/, '').length;
}
/** How an answer is written: exact when it is short and exact, otherwise to
    3 significant figures like the notes' own answers (8.22 ft, 1.09 yds). */
function answerNum(r) {
  if (terminates(r) && sigCount(r) <= 5) return { str: fx(r), exact: true, r };
  const str = commas(sigStr(r, 3));
  return { str, exact: false, r: D(str) };
}
/** A value too long to read as a plain number is shown in scientific notation. */
function readable(r) {
  const s = fx(r);
  if (s.replace(/[-,.]/g, '').length <= 13) return s;
  const a = sigStr(r, 5).replace('-', '');
  const digits = a.replace('.', '').replace(/^0+/, '').replace(/0+$/, '') || '0';
  const P = r.p < 0n ? -r.p : r.p;
  let e = P.toString().length - r.q.toString().length;
  if (!(e >= 0 ? P >= r.q * p10(e) : P * p10(-e) >= r.q)) e -= 1;
  return `${isNeg(r) ? '-' : ''}${digits.length > 1 ? `${digits[0]}.${digits.slice(1)}` : digits} × 10^${e}`;
}

/* ------------------------------------------------ DOM helpers for solutions */
const P = (...kids) => el('p', { class: 'lab-step' }, ...kids);
const boxed = (...kids) => el('span', { class: 'lab-ans' }, ...kids);
function frac(top, bot) {
  return el('span', { class: 'lab-frac' },
    el('span', { class: 'num' }, top), el('span', { class: 'sr-only' }, ' over '), el('span', { class: 'den' }, bot));
}
/** "3.54 × 10^-8" → text with a real superscript; any other text passes through. */
function rich(text) {
  const out = [];
  const re = /10\^(-?\d+)/g;
  let last = 0, m;
  const s = String(text);
  while ((m = re.exec(s))) {
    out.push(pretty(s.slice(last, m.index)), el('span', { class: 'lab-pow' }, '10', el('span', { class: 'sr-only' }, ' to the power '), el('sup', {}, pretty(m[1]))));
    last = m.index + m[0].length;
  }
  out.push(pretty(s.slice(last)));
  return out;
}
const note = (...kids) => el('p', { class: 'lab-aside' }, ...kids);

/* A box that scrolls sideways when its content is too wide (a long fence on a
   phone). It fades the edge that has more to see and shows a thin scrollbar,
   so a cut-off column never looks like the end of the working. */
let scrollWatch = null;
function cueScroll(box) {
  const more = box.scrollWidth - box.clientWidth > 2;
  const left = more && box.scrollLeft > 2;
  const right = more && box.scrollLeft + box.clientWidth < box.scrollWidth - 2;
  const v = left && right ? 'both' : left ? 'left' : right ? 'right' : '';
  if ((box.dataset.more || '') !== v) box.dataset.more = v;
}
function scroller(...kids) {
  const box = el('div', { class: 'lab-scroll' }, ...kids);
  box.addEventListener('scroll', () => cueScroll(box), { passive: true });
  if ('ResizeObserver' in window) {
    scrollWatch ||= new ResizeObserver((entries) => {
      for (const e of entries) { if (e.target.isConnected) cueScroll(e.target); else scrollWatch.unobserve(e.target); }
    });
    scrollWatch.observe(box);
  }
  return box;
}

/** The notes' picket fence: given | factor | factor … with cancelled units
    struck through, numerators on top and denominators below. A factor may be
    null (a blank to fill in). */
function fenceNode(given, factors, { result = null } = {}) {
  const unitText = (amt, unit, cancel) => [`${amt} `, cancel
    ? el('s', { class: 'lab-cancel' }, unit)
    : el('span', { class: 'lab-keep' }, unit)];
  const present = (i) => i < factors.length && factors[i] != null;
  const top = el('tr', {}, el('td', { class: 'given' }, ...unitText(given.amt, given.unit, present(0))));
  const bottom = el('tr', {}, el('td', { class: 'given' }, ''));
  factors.forEach((f, i) => {
    if (!f) {
      top.append(el('td', { class: 'blank' }, '?'));
      bottom.append(el('td', { class: 'blank' }, '?'));
      return;
    }
    top.append(el('td', {}, ...unitText(f.top.amt, f.top.unit, present(i + 1))));
    bottom.append(el('td', {}, ...unitText(f.bot.amt, f.bot.unit, true)));
  });
  const said = [`${given.amt} ${given.unit}`, ...factors.map((f) => (f ? `(${f.top.amt} ${f.top.unit} over ${f.bot.amt} ${f.bot.unit})` : 'a blank factor'))].join(' times ');
  // The "= top/bottom = answer" part sits beside the fence, not inside its
  // scroll box, so on a narrow screen it wraps underneath and is never cut off.
  const box = scroller(el('table', { class: 'lab-fence' }, el('tbody', {}, top, bottom)));
  box.setAttribute('aria-hidden', 'true');
  const wrap = el('div', { class: 'lab-fence-wrap' },
    el('span', { class: 'sr-only' }, `Picket fence: ${said}.`),
    box,
    result ? el('div', { class: 'lab-fence-eq', 'aria-hidden': 'true' }, el('span', { class: 'eq' }, '='), frac(result.top, result.bot), el('span', { class: 'eq' }, '='), boxed(result.ans))
      : el('div', { class: 'lab-fence-eq', 'aria-hidden': 'true' }, el('span', { class: 'eq' }, '='), el('span', { class: 'lab-q' }, '?')),
  );
  if (result) wrap.append(el('span', { class: 'sr-only' }, `equals ${result.top} over ${result.bot}, which is ${result.ans}.`));
  return wrap;
}

/* ================================================================ skills */
const SOURCES = {
  avg: 'Concept 2 · slide 5 (averages)',
  temp: 'Concept 2 · slide 9 (temperature conversions)',
  prefix: 'Concept 2 · slides 10–12 (prefixes and metric conversions)',
  factor: 'Concept 3 · slides 3–5 and 8 (conversion factors)',
  dim: 'Concept 3 · slides 5–8 (the picket fence and the conversion table)',
  sci: 'Concept 3 · slides 10–13 (converting to scientific notation)',
  std: 'Concept 3 · slides 14–15 (converting to standard notation)',
};
const LEVEL_NAMES = { 1: 'Warm-up', 2: 'Standard', 3: 'Challenge' };

/* ------------------------------------------------ units the student types
   Each unit lists how a student might write it. A spelling in `cs` must
   match the case of its first letter — "Mm" (megameters) and "mm"
   (millimeters) are not the same answer, whatever the core checker thinks. */
const SPELL = {};
function spell(key, ci, cs = []) { SPELL[key] = { ci, cs }; }
const squash = (s) => String(s).replace(/[\s.°º]/g, '').replace(/[µμ]/g, 'µ');
function unitOk(text, key) {
  const want = SPELL[key];
  if (!want) return true;
  const t = squash(text);
  if (want.cs.some((s) => t.length === s.length && t[0] === s[0] && t.slice(1).toLowerCase() === s.slice(1).toLowerCase())) return true;
  return want.ci.some((s) => squash(s).toLowerCase() === t.toLowerCase());
}

/* Dimensional-analysis units, exactly as the notes' table names them. */
const DU = {
  g: { dim: 'mass', one: 'g', many: 'g', words: ['g', 'gram', 'grams'] },
  kg: { dim: 'mass', one: 'kg', many: 'kg', words: ['kg', 'kgs', 'kilogram', 'kilograms'] },
  oz: { dim: 'mass', one: 'ounce', many: 'ounces', words: ['oz', 'ounce', 'ounces'] },
  lb: { dim: 'mass', one: 'lb', many: 'lbs', words: ['lb', 'lbs', 'pound', 'pounds'] },
  ton: { dim: 'mass', one: 'ton', many: 'tons', words: ['ton', 'tons'] },
  tsp: { dim: 'volume', one: 'tsp', many: 'tsp', words: ['tsp', 'tsps', 'teaspoon', 'teaspoons'] },
  Tbsp: { dim: 'volume', one: 'Tbsp', many: 'Tbsp', words: ['Tbsp', 'Tbsps', 'tablespoon', 'tablespoons'] },
  cup: { dim: 'volume', one: 'cup', many: 'cups', words: ['cup', 'cups'] },
  floz: { dim: 'volume', one: 'fl oz', many: 'fl oz', words: ['fl oz', 'fluid oz', 'fluid ounce', 'fluid ounces', 'oz', 'ounces'] },
  mL: { dim: 'volume', one: 'mL', many: 'mL', words: ['mL', 'milliliter', 'milliliters', 'millilitre', 'millilitres'] },
  L: { dim: 'volume', one: 'L', many: 'L', words: ['L', 'liter', 'liters', 'litre', 'litres'] },
  pint: { dim: 'volume', one: 'pint', many: 'pints', words: ['pint', 'pints', 'pt', 'pts'] },
  quart: { dim: 'volume', one: 'quart', many: 'quarts', words: ['quart', 'quarts', 'qt', 'qts'] },
  gallon: { dim: 'volume', one: 'gallon', many: 'gallons', words: ['gallon', 'gallons', 'gal', 'gals'] },
  in: { dim: 'length', one: 'inch', many: 'inches', words: ['in', 'inch', 'inches'] },
  cm: { dim: 'length', one: 'cm', many: 'cm', words: ['cm', 'centimeter', 'centimeters', 'centimetre', 'centimetres'] },
  ft: { dim: 'length', one: 'ft', many: 'ft', words: ['ft', 'foot', 'feet'] },
  mile: { dim: 'length', one: 'mile', many: 'miles', words: ['mile', 'miles', 'mi'] },
  yd: { dim: 'length', one: 'yard', many: 'yards', words: ['yard', 'yards', 'yd', 'yds'] },
  s: { dim: 'time', one: 's', many: 's', words: ['s', 'sec', 'secs', 'second', 'seconds'] },
  min: { dim: 'time', one: 'min', many: 'min', words: ['min', 'mins', 'minute', 'minutes'] },
  hour: { dim: 'time', one: 'hour', many: 'hours', words: ['hour', 'hours', 'hr', 'hrs'] },
  day: { dim: 'time', one: 'day', many: 'days', words: ['day', 'days'] },
  week: { dim: 'time', one: 'week', many: 'weeks', words: ['week', 'weeks', 'wk', 'wks'] },
  year: { dim: 'time', one: 'year', many: 'years', words: ['year', 'years', 'yr', 'yrs'] },
};
for (const [k, u] of Object.entries(DU)) spell(k, u.words);
const uname = (key, amt) => (String(amt).replace(/,/g, '') === '1' ? DU[key].one : DU[key].many);

/* The notes' conversion table (Concept 3, slide 8): [a, amount a, b, amount b]
   means "amount a of a = amount b of b". */
const TABLE = [
  ['g', '1000', 'kg', '1'], ['oz', '1', 'g', '28.35'], ['kg', '1', 'lb', '2.2'], ['oz', '16', 'lb', '1'], ['lb', '2000', 'ton', '1'],
  ['tsp', '1', 'mL', '5'], ['cup', '1', 'mL', '236'], ['floz', '1', 'mL', '29.6'], ['mL', '1000', 'L', '1'], ['tsp', '3', 'Tbsp', '1'],
  ['Tbsp', '16', 'cup', '1'], ['floz', '8', 'cup', '1'], ['cup', '2', 'pint', '1'], ['pint', '2', 'quart', '1'], ['quart', '4', 'gallon', '1'],
  ['in', '1', 'cm', '2.54'], ['in', '12', 'ft', '1'], ['mile', '1', 'ft', '5280'], ['ft', '3', 'yd', '1'],
  ['s', '60', 'min', '1'], ['min', '60', 'hour', '1'], ['hour', '24', 'day', '1'], ['day', '7', 'week', '1'], ['day', '365', 'year', '1'],
];
const METRIC = new Set(['g', 'kg', 'mL', 'L', 'cm']);
/** The factor from an edge that cancels `from`: its partner on top, `from` below. */
function edgeFactor(edge, from) {
  const [a, na, b, nb] = edge;
  return from === a
    ? { top: { amt: nb, key: b }, bot: { amt: na, key: a }, edge }
    : { top: { amt: na, key: a }, bot: { amt: nb, key: b }, edge };
}
const ADJ = {};
for (const e of TABLE) {
  (ADJ[e[0]] ||= []).push({ to: e[2], edge: e });
  (ADJ[e[2]] ||= []).push({ to: e[0], edge: e });
}
const fVal = (f) => div(D(f.top.amt), D(f.bot.amt));
const side = (s) => ({ amt: commas(s.amt), unit: uname(s.key, s.amt) });
const shown = (f) => (f ? { top: side(f.top), bot: side(f.bot) } : null);
const fStr = (f) => `${commas(f.top.amt)} ${uname(f.top.key, f.top.amt)} / ${commas(f.bot.amt)} ${uname(f.bot.key, f.bot.amt)}`;
const flip = (f) => ({ top: f.bot, bot: f.top, edge: f.edge });
function distances(from) {
  const d = { [from]: 0 };
  const queue = [from];
  while (queue.length) {
    const u = queue.shift();
    for (const { to } of ADJ[u] || []) if (d[to] == null) { d[to] = d[u] + 1; queue.push(to); }
  }
  return d;
}
/** Every simple route through the table from one unit to another. */
function routes(from, to, maxLen) {
  const out = [];
  const walk = (u, seen, path) => {
    if (u === to) { out.push(path); return; }
    if (path.length >= maxLen) return;
    for (const { to: v, edge } of ADJ[u] || []) {
      if (seen.has(v)) continue;
      seen.add(v);
      walk(v, seen, [...path, edgeFactor(edge, u)]);
      seen.delete(v);
    }
  };
  walk(from, new Set([from]), []);
  return out;
}
const bridges = (path) => path.filter((f) => METRIC.has(f.top.key) !== METRIC.has(f.bot.key)).length;
const chainValue = (given, path) => path.reduce((v, f) => mul(v, fVal(f)), given);

/** A sensible amount of `key` to start from. */
const RANGE = {
  g: [5, 2000], kg: [1, 100], oz: [1, 64], lb: [1, 250], ton: [1, 5],
  tsp: [1, 30], Tbsp: [1, 32], cup: [1, 20], floz: [1, 64], mL: [5, 3000], L: [1, 20], pint: [1, 16], quart: [1, 16], gallon: [1, 10],
  in: [1, 120], cm: [5, 500], ft: [1, 300], mile: [1, 26], yd: [1, 100],
  s: [30, 7200], min: [1, 600], hour: [1, 72], day: [1, 60], week: [1, 52], year: [1, 5],
};
function randAmount(key, lvl) {
  const [lo, hi] = RANGE[key];
  const dp = lvl === 1 ? 0 : lvl === 2 ? (chance(.5) ? 1 : 0) : ri(1, 2);
  let int = ri(lo * 10 ** dp, hi * 10 ** dp);
  if (dp && int % 10 === 0) int += 1;
  return R(int, p10(dp));
}

/* ------------------------------------------------ question assembly */
const SKILLS = [
  { id: 'prefix', setId: 'c2', name: 'Metric prefixes', ico: '📏', label: 'Metric prefix conversions (the prefix chart)' },
  { id: 'temp', setId: 'c2', name: 'Temperature', ico: '🌡️', label: 'Temperature: K, °C and °F' },
  { id: 'avg', setId: 'c2', name: 'Averages', ico: '⚖️', label: 'Average of measurements' },
  { id: 'sci', setId: 'c3', name: 'To scientific notation', ico: '🔭', label: 'Standard to scientific notation' },
  { id: 'std', setId: 'c3', name: 'To standard notation', ico: '🔎', label: 'Scientific to standard notation' },
  { id: 'factor', setId: 'c3', name: 'Conversion factors', ico: '🔀', label: 'Choosing the conversion factor that cancels' },
  { id: 'dim', setId: 'c3', name: 'Dimensional analysis', ico: '🚧', label: 'Dimensional analysis with the picket fence' },
];
const SK = Object.fromEntries(SKILLS.map((s) => [s.id, s]));
// short enough to show in full beside the buttons on a phone
const PLACEHOLDER = {
  prefix: 'Number and unit',
  temp: 'Number and unit',
  avg: 'Number and unit',
  sci: 'Like 3.5 x 10^4',
  std: 'Written out in full',
  dim: 'Number and unit',
};

/** Bundle what every generator produces into one question object. */
function makeQ(skill, o) {
  const q = {
    id: `lab:${skill}`, skill, kind: 'gen', type: o.type || 'written', setId: SK[skill].setId,
    ask: `${SK[skill].ico} ${SK[skill].name}`,
    prompt: o.prompt, note: o.note || '', answer: o.answer, accept: o.accept || [],
    value: o.value, unit: o.unit || '', unitKey: o.unitKey || '', unitName: o.unitName || o.unit || '',
    options: o.options, level: o.level, fromNotes: !!o.fromNotes,
    source: o.fromNotes ? `${o.fromNotes} · worked solution by Problem Lab` : `${SOURCES[skill]} · generated by Problem Lab`,
    brief: o.brief, wrong: o.wrong || [], alts: o.alts || [],
    work: o.work,
  };
  q.explanation = o.work(true);
  q.hint = () => o.work(false);
  // exact fractions for grade(); kept off the enumerable fields so a question
  // can still be copied or serialised like any other
  Object.defineProperty(q, 'grading', { value: o.grading || { exact: o.exactR ? [o.exactR] : [], rounded: [], loose: [] } });
  if (o.figure) { q.figure = o.figure; q.figureAlt = o.figureAlt; }
  return q;
}
/** Answer strings a core checker will accept: each value with each spelling
    of its unit, so "8.22 feet" is as right as "8.22 ft" in the Mistakes list. */
function acceptList(values, words) {
  const out = [];
  for (const v of values) {
    const n = v.replace(/,/g, '');
    if (!words.length) out.push(n);
    for (const w of words) out.push(`${n} ${w}`);
  }
  return [...new Set(out)];
}

/* ---------------------------------------------------------- 1. prefixes */
const PREFIXES = [
  { sym: 'M', name: 'Mega', exp: 6 },
  { sym: 'k', name: 'kilo', exp: 3 },
  { sym: 'h', name: 'hecto', exp: 2 },
  { sym: 'da', name: 'deka', exp: 1 },
  { sym: '', name: '', exp: 0 },
  { sym: 'd', name: 'deci', exp: -1 },
  { sym: 'c', name: 'centi', exp: -2 },
  { sym: 'm', name: 'milli', exp: -3 },
  { sym: 'µ', name: 'micro', exp: -6 },
  { sym: 'n', name: 'nano', exp: -9 },
];
const PX = Object.fromEntries(PREFIXES.map((p) => [p.sym, p]));
const BASES = {
  m: { word: 'meter', alt: 'metre' },
  g: { word: 'gram' },
  L: { word: 'liter', alt: 'litre' },
  s: { word: 'second' },
};
const pUnit = (p, b) => `${p.sym}${b}`;
const pWords = (p, b) => {
  const w = [BASES[b].word, BASES[b].alt].filter(Boolean);
  const names = p.sym === 'da' ? ['deka', 'deca'] : [p.name.toLowerCase()];
  return names.flatMap((n) => w.flatMap((x) => [`${n}${x}`, `${n}${x}s`]));
};
for (const b of Object.keys(BASES)) {
  for (const p of PREFIXES) {
    const sym = pUnit(p, b);
    const cs = [], ci = [...pWords(p, b)];
    if (/^[Mm]./.test(sym)) cs.push(sym); else ci.push(sym);
    if (p.sym === 'µ') ci.push(`u${b}`, `μ${b}`);
    if (b === 's' && !p.sym) ci.push('sec', 'secs');
    spell(`pfx:${sym}`, ci, cs);
  }
}
/** One row of the notes' chart, in the problem's own units: "1,000 mm = 1 m". */
const chartLine = (p, b) => (p.exp > 0
  ? `1 ${pUnit(p, b)} = ${commas(String(10 ** p.exp))} ${b}`
  : `${commas(String(10 ** -p.exp))} ${pUnit(p, b)} = 1 ${b}`);
/** The fence factor for one step through the chart, cancelling `from`. */
function prefixFactor(from, to, b) {
  // one of the two is the base unit
  const big = from.exp !== 0 ? from : to;
  const c = commas(String(10 ** Math.abs(big.exp)));
  const fact = big.exp > 0 ? { a: { amt: '1', p: big }, b: { amt: c, p: PX[''] } } : { a: { amt: c, p: big }, b: { amt: '1', p: PX[''] } };
  const sideOf = (p) => (fact.a.p === p ? fact.a : fact.b);
  return { top: { amt: sideOf(to).amt, unit: pUnit(to, b) }, bot: { amt: sideOf(from).amt, unit: pUnit(from, b) } };
}
const NOTES_PREFIX = [
  { g: '6.1', from: 'k', to: '', b: 's', where: 'Concept 2 · slide 13 (practice)' },
  { g: '0.859', from: 'm', to: 'c', b: 'g', where: 'Concept 2 · slide 13 (practice)' },
  { g: '65.4', from: '', to: 'm', b: 'm', where: 'Concept 2 · slide 13 (practice)' },
  { g: '48', from: 'k', to: '', b: 'm', where: 'Concept 2 · slide 11 (Example #5)', words: true },
  { g: '45,456', from: 'm', to: 'k', b: 'g', where: 'Concept 2 · slide 12 (Example #6)', words: true },
];
function genPrefix(lvl) {
  let spec = null;
  if (lvl <= 2 && chance(.15)) {
    const n = pick(NOTES_PREFIX);
    spec = { given: D(n.g), from: PX[n.from], to: PX[n.to], b: n.b, notes: n.where, words: n.words };
  }
  for (let tries = 0; !spec && tries < 200; tries++) {
    const b = pick(Object.keys(BASES));
    const pool = lvl === 1 ? ['k', 'c', 'm'] : lvl === 2 ? ['k', 'h', 'da', 'd', 'c', 'm'] : ['M', 'k', 'h', 'da', 'd', 'c', 'm', 'µ', 'n'];
    const two = lvl === 1 ? false : lvl === 2 ? chance(.5) : chance(.75);
    let from, to;
    if (two) [from, to] = shuffle(pool).slice(0, 2).map((s) => PX[s]);
    else { const p = PX[pick(pool)]; [from, to] = chance(.5) ? [p, PX['']] : [PX[''], p]; }
    const L = ri(1, lvl === 1 ? 2 : 4);
    let d = String(ri(1, 9));
    for (let i = 1; i < L; i++) d += String(i === L - 1 ? ri(1, 9) : ri(0, 9));
    const lead = lvl === 1 ? ri(0, 3) : lvl === 2 ? ri(-2, 4) : ri(-3, 4);
    const given = scale10(R(B(d)), lead - (L - 1));
    const ans = scale10(given, from.exp - to.exp);
    const a = plain(ans).replace('-', '');
    if (a.replace('.', '').length > 13 || Math.abs(toNum(ans)) < 1e-6) continue;
    spec = { given, from, to, b, words: chance(.35) };
  }
  const { given, from, to, b } = spec;
  const ans = scale10(given, from.exp - to.exp);
  const G = `${fx(given)} ${pUnit(from, b)}`;
  const toU = pUnit(to, b);
  const toWords = pWords(to, b)[1];
  const steps = from.exp !== 0 && to.exp !== 0 ? [[from, PX['']], [PX[''], to]] : [[from, to]];
  const factors = steps.map(([x, y]) => prefixFactor(x, y, b));
  const answer = `${fx(ans)} ${toU}`;
  const up = to.exp < from.exp;   // smaller unit → bigger number
  const work = (final) => {
    const chart = el('div', { class: 'lab-chart', 'aria-hidden': 'true' }, ...PREFIXES.map((p) => el('div', { class: `cell${p.sym ? '' : ' base'}${p === from ? ' from' : ''}${p === to ? ' to' : ''}` },
      el('small', {}, p.sym ? p.name : 'unit'),
      el('b', {}, p.sym ? `${p.sym === 'µ' ? 'µ' : p.sym}` : b),
      el('small', { class: 'mark' }, p === from ? 'start' : p === to ? 'end' : ''))));
    const facts = steps.map(([x, y]) => {
      const p = x.exp !== 0 ? x : y;
      const f = prefixFactor(x, y, b);
      return P(`${x.sym ? `${x.name} (${pUnit(x, b)})` : `the base unit (${b})`} → ${y.sym ? `${y.name} (${pUnit(y, b)})` : `the base unit (${b})`}: the chart says ${chartLine(p, b)}, so the factor is `, frac(`${f.top.amt} ${f.top.unit}`, `${f.bot.amt} ${f.bot.unit}`), '.');
    });
    const kids = [
      chart,
      P(`Find ${pUnit(from, b)} and ${toU} on the prefix chart${steps.length > 1 ? ' and go through the base unit, one step at a time' : ''}.`),
      ...facts,
      P('Put each factor in the fence with the unit you have on the bottom, so it cancels:'),
    ];
    if (!final) {
      kids.push(fenceNode({ amt: fx(given), unit: pUnit(from, b) }, factors));
      kids.push(note(`Moving to a ${up ? 'smaller' : 'bigger'} unit, so the number should get ${up ? 'bigger' : 'smaller'}.`));
      return el('div', { class: 'lab-work' }, ...kids);
    }
    const topProd = factors.reduce((v, f) => mul(v, D(f.top.amt)), given);
    const botProd = factors.reduce((v, f) => mul(v, D(f.bot.amt)), R(1));
    kids.push(fenceNode({ amt: fx(given), unit: pUnit(from, b) }, factors, { result: { top: `${fx(topProd)} ${toU}`, bot: fx(botProd), ans: answer } }));
    kids.push(note(`${pUnit(to, b)} is a ${up ? 'smaller' : 'bigger'} unit than ${pUnit(from, b)}, so the number got ${up ? 'bigger' : 'smaller'}: the decimal moved ${Math.abs(from.exp - to.exp)} place${Math.abs(from.exp - to.exp) === 1 ? '' : 's'} ${up ? 'right' : 'left'}.`));
    if (from.sym === 'µ' || to.sym === 'µ') kids.push(note('µ is micro — the notes write it as "u".'));
    return el('div', { class: 'lab-work' }, ...kids);
  };
  const wrongWay = scale10(given, to.exp - from.exp);
  const rows = (p) => PREFIXES.indexOf(p);
  const rowSteps = rows(to) - rows(from);   // rows on the chart, not powers of ten
  const wrong = [{ r: wrongWay, why: 'moved the decimal the wrong way' }];
  if (Math.abs(rowSteps) !== Math.abs(from.exp - to.exp)) wrong.push({ r: scale10(given, rowSteps), why: 'counted rows on the chart instead of powers of ten' });
  wrong.push(...shuffle([{ r: scale10(ans, 1), why: 'off by a power of ten' }, { r: scale10(ans, -1), why: 'off by a power of ten' }]),
    { r: scale10(ans, 3), why: 'off by 1,000' }, { r: scale10(ans, -3), why: 'off by 1,000' });
  return makeQ('prefix', {
    level: lvl,
    prompt: spec.words ? `How many ${toWords} are there in ${G}?` : `Convert ${G} to ${toU}.`,
    answer, value: toNum(ans), exactR: ans, unit: toU, unitKey: `pfx:${toU}`, unitName: `${toU} (${toWords})`,
    accept: acceptList([fx(ans)], [toU, toWords, ...(to.sym === 'µ' ? [`u${b}`] : [])]),
    fromNotes: spec.notes,
    brief: `${G} × ${factors.map((f) => `(${f.top.amt} ${f.top.unit} / ${f.bot.amt} ${f.bot.unit})`).join(' × ')} = ${answer}`,
    wrong: wrong.map((w) => ({ str: `${readable(w.r)} ${toU}`, val: toNum(w.r), why: w.why })),
    work,
  });
}

/* -------------------------------------------------------- 2. temperature */
const TU = { C: '°C', F: '°F', K: 'K' };
spell('C', ['C', 'celsius', 'degC', 'degrees C', 'degree C', 'degrees celsius', 'degree celsius']);
spell('F', ['F', 'fahrenheit', 'farenheit', 'degF', 'degrees F', 'degree F', 'degrees fahrenheit', 'degree fahrenheit']);
spell('K', ['K', 'kelvin', 'kelvins', 'degrees K']);
function genTemp(lvl) {
  const kinds = lvl === 1 ? ['c2k', 'k2c', 'c2f', 'f2c'] : lvl === 2 ? ['c2k', 'k2c', 'c2f', 'f2c', 'f2c', 'c2f'] : ['f2k', 'f2k', 'c2f', 'f2c', 'c2k', 'k2c'];
  const kind = pick(kinds);
  const K273 = R(273), F32 = R(32), F59 = R(5, 9), F95 = R(9, 5);
  let given;
  if (kind === 'c2k') given = lvl === 3 ? R(ri(-800, 1500), 10) : R(lvl === 1 ? ri(0, 100) : ri(-80, 150));
  else if (kind === 'k2c') given = lvl === 3 ? R(ri(2000, 4500), 10) : R(lvl === 1 ? ri(273, 373) : ri(200, 450));
  else if (kind === 'c2f') given = lvl === 1 ? R(5 * ri(0, 20)) : lvl === 2 ? R(5 * ri(-12, 30)) : R(ri(-40, 110));
  else given = R(32 + 9 * (lvl === 1 ? ri(1, 10) : lvl === 2 ? ri(-8, 20) : ri(-12, 22)));
  const [from, to] = { c2k: ['C', 'K'], k2c: ['K', 'C'], c2f: ['C', 'F'], f2c: ['F', 'C'], f2k: ['F', 'K'] }[kind];
  const n = (r) => pretty(fx(r));
  const par = (r) => (isNeg(r) ? `(${n(r)})` : n(r));
  let ans, lines, wrong;
  if (kind === 'c2k') {
    ans = add(given, K273);
    lines = [['K = °C + 273'], [`K = ${n(given)} + 273`], [`K = ${n(ans)} K`, true]];
    wrong = [{ r: given, why: 'forgot the 273' }, { r: sub(given, K273), why: 'subtracted 273 instead of adding' }, { r: sub(K273, given), why: 'subtracted the wrong way round' }];
  } else if (kind === 'k2c') {
    ans = sub(given, K273);
    lines = [['K = °C + 273, so °C = K − 273'], [`°C = ${n(given)} − 273`], [`°C = ${n(ans)} °C`, true]];
    wrong = [{ r: given, why: 'forgot the 273' }, { r: add(given, K273), why: 'added 273 instead of subtracting' }, { r: sub(K273, given), why: 'subtracted the wrong way round' }];
  } else if (kind === 'c2f') {
    const m = mul(given, F95);
    ans = add(m, F32);
    lines = [['°F = (°C × 9/5) + 32'], [`°F = (${n(given)} × 9/5) + 32`], [`°F = ${n(m)} + 32`], [`°F = ${n(ans)} °F`, true]];
    wrong = [
      { r: add(mul(given, F59), F32), why: '9/5 and 5/9 swapped' },
      { r: m, why: 'forgot to add 32' },
      { r: mul(add(given, F32), F95), why: 'added 32 before multiplying' },
    ];
  } else {
    const d = sub(given, F32);
    const c = mul(F59, d);
    const f2c = [['°C = 5/9 (°F − 32)'], [`°C = 5/9 (${n(given)} − 32)`], [`°C = 5/9 × ${par(d)}`], [`°C = ${n(c)} °C`, kind === 'f2c']];
    if (kind === 'f2c') {
      ans = c;
      lines = f2c;
      wrong = [
        { r: mul(F95, d), why: '9/5 and 5/9 swapped' },
        { r: sub(mul(F59, given), F32), why: 'multiplied before subtracting 32' },
        { r: d, why: 'forgot the 5/9' },
      ];
    } else {
      ans = add(c, K273);
      lines = [...f2c, ['Then K = °C + 273'], [`K = ${n(c)} + 273`], [`K = ${n(ans)} K`, true]];
      wrong = [
        { r: c, why: 'forgot the 273' },
        { r: add(mul(F95, d), K273), why: '9/5 and 5/9 swapped' },
        { r: sub(c, K273), why: 'subtracted 273 instead of adding' },
      ];
    }
  }
  // a wrong option is shown to one decimal place at most (5/9 of 17 is 9.444…)
  const shortT = (r) => (terminates(r) && (plain(r).split('.')[1] || '').length <= 1 ? r : roundDp(r, 1));
  wrong.push({ r: scale10(ans, 1), why: 'off by a power of ten' }, { r: scale10(ans, -1), why: 'off by a power of ten' });
  const target = kind === 'f2k' ? 'C' : to;
  const hintLines = [lines[0], lines[1], [`${TU[target]} = ?`], ...(kind === 'f2k' ? [['Then K = °C + 273'], ['K = ?']] : [])];
  const answer = `${fx(ans)} ${TU[to]}`;
  const G = `${n(given)} ${TU[from]}`;
  const work = (final) => {
    const shownLines = final ? lines : hintLines;
    const box = el('div', { class: 'lab-formula' }, ...shownLines.map(([t, isAns], i) => el('div', { class: `ln${i === 0 || /^Then/.test(t) ? ' f' : ''}` },
      isAns ? [t.split(' = ')[0], ' = ', boxed(t.split(' = ').slice(1).join(' = '))] : t)));
    const kids = [
      P(kind === 'f2k' ? 'Two steps: °F to °C with the notes\' formula, then °C to K.' : 'Use the formula from the notes, then put the number in:'),
      box,
    ];
    if (!final) kids.push(note('Work out the brackets first, then multiply or add.'));
    else if (kind === 'f2c' || kind === 'f2k') kids.push(note('Subtract 32 first (the brackets), then multiply by 5/9.'));
    else if (kind === 'c2f') kids.push(note('Multiply by 9/5 first (the brackets), then add 32.'));
    return el('div', { class: 'lab-work' }, ...kids);
  };
  return makeQ('temp', {
    level: lvl,
    prompt: chance(.6) ? `Convert ${G} to ${TU[to]}.` : `What is ${G} in ${to === 'K' ? 'kelvin (K)' : TU[to]}?`,
    answer, value: toNum(ans), exactR: ans, unit: TU[to], unitKey: to, unitName: TU[to],
    accept: acceptList([fx(ans)], { C: ['°C', 'C', 'celsius', 'degrees C'], F: ['°F', 'F', 'fahrenheit', 'degrees F'], K: ['K', 'kelvin'] }[to]),
    brief: lines.map(([t], i) => (i === 0 ? t : /^Then /.test(t) ? `; then ${t.slice(5)}` : t.replace(/^(°C|°F|K) = /, '= '))).join(' ').replace(/ ; /g, '; '),
    wrong: wrong.map((w) => ({ str: `${fx(shortT(w.r))} ${TU[to]}`, val: toNum(shortT(w.r)), why: w.why })),
    work,
  });
}

/* ------------------------------------------------------------ 3. averages */
const AVG_SCENES = [
  { who: 'students', what: 'the height of the same plant', noun: 'height', unit: 'cm', key: 'cm', lo: 20, hi: 60, spread: 8, dp: 0 },
  { who: 'students', what: 'the mass of the same beaker', noun: 'mass', unit: 'g', key: 'g', lo: 40, hi: 120, spread: 2, dp: 1 },
  { who: 'students', what: 'the volume of water in the same graduated cylinder', noun: 'volume', unit: 'mL', key: 'mL', lo: 10, hi: 90, spread: 2, dp: 1 },
  { who: 'students', what: 'the time it takes a toy car to roll down the same ramp', noun: 'time', unit: 's', key: 's', lo: 3, hi: 9, spread: 1, dp: 1 },
  { who: 'weighings', what: 'a dog at the vet', noun: 'mass', unit: 'lbs', key: 'lb', lo: 20, hi: 80, spread: 1, dp: 1 },
];
const NUMW = { 3: 'Three', 4: 'Four', 5: 'Five' };
function listJoin(a) { return a.length <= 2 ? a.join(' and ') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`; }
function genAvg(lvl) {
  let vals, sc, notes = null;
  if (lvl <= 2 && chance(.12)) {
    sc = AVG_SCENES[0];
    vals = [R(30), R(45), R(36)];
    notes = 'Concept 2 · slide 5 (Example #3)';
  } else {
    sc = pick(lvl === 1 ? AVG_SCENES.filter((s) => s.dp === 0 || s.key === 'lb') : AVG_SCENES);
    const n = lvl === 1 ? 3 : lvl === 2 ? ri(3, 4) : ri(4, 5);
    const dp = lvl === 1 ? 0 : Math.max(sc.dp, lvl === 3 ? 1 : 0);
    const k = 10 ** dp;
    const centre = ri(sc.lo * k, sc.hi * k);
    const spread = dp === 0 ? Math.max(3, sc.spread) : sc.spread * k;
    const ints = Array.from({ length: n - 1 }, () => centre + ri(-spread, spread));
    if (ints.every((x) => x === ints[0])) ints[0] += ints[0] > centre ? -1 : 1;
    const sum = ints.reduce((a, b) => a + b, 0);
    const last = [];
    for (let v = centre - spread; v <= centre + spread; v++) if ((sum + v) % n === 0 && v > 0) last.push(v);
    ints.push(last.length ? pick(last) : centre);
    if ((ints.reduce((a, b) => a + b, 0)) % n !== 0) ints[ints.length - 1] += n - (ints.reduce((a, b) => a + b, 0) % n);
    vals = shuffle(ints).map((v) => R(v, k));
  }
  const n = vals.length;
  const sum = vals.reduce(add, R(0));
  const avg = div(sum, R(n));
  const U = sc.unit;
  const list = vals.map((v) => `${fx(v)} ${U}`);
  const prompt = notes
    ? `Callie measures her flower to be 30 cm tall, Jeff measures it at 45 cm and Liam at 36 cm. Find the plant's average height.`
    : sc.who === 'weighings'
      ? `${NUMW[n]} weighings of ${sc.what}: ${listJoin(list)}. What is the average ${sc.noun}?`
      : `${NUMW[n]} ${sc.who} measure ${sc.what}: ${listJoin(list)}. What is the average ${sc.noun}?`;
  const answer = `${fx(avg)} ${U}`;
  const work = (final) => el('div', { class: 'lab-work' },
    P('Average: add up all the values and divide by the total number of values.'),
    el('div', { class: 'lab-formula' }, el('div', { class: 'ln' },
      frac(list.join(' + '), String(n)), ' = ',
      final ? [frac(`${fx(sum)} ${U}`, String(n)), ' = ', boxed(answer)] : el('span', { class: 'lab-q' }, '?'))),
    final ? note(`${n} values, so divide by ${n}. Keep the unit — the average is in ${U} too.`) : note(`There are ${n} values, so divide by ${n}.`));
  const wrong = [
    { r: sum, why: 'forgot to divide' },
    { r: roundDp(div(sum, R(n - 1)), 1), why: 'divided by the wrong count' },
    { r: roundDp(div(sum, R(n + 1)), 1), why: 'divided by the wrong count' },
    { r: scale10(avg, 1), why: 'off by a power of ten' },
  ];
  return makeQ('avg', {
    level: lvl, prompt, answer, value: toNum(avg), exactR: avg, unit: U, unitKey: sc.key, unitName: U, fromNotes: notes,
    accept: acceptList([fx(avg)], DU[sc.key].words),
    brief: `(${vals.map(fx).join(' + ')}) ÷ ${n} = ${fx(sum)} ÷ ${n} = ${answer}`,
    wrong: wrong.map((w) => ({ str: `${fx(w.r)} ${U}`, val: toNum(w.r), why: w.why })),
    work,
  });
}

/* ------------------------------------------ 4 & 5. scientific notation */
const coefStr = (d) => (d.length > 1 ? `${d[0]}.${d.slice(1)}` : d);
const sciValue = (d, e) => scale10(R(B(d)), e - (d.length - 1));
const sciText = (d, e) => `${coefStr(d)} × 10^${e}`;
function sciParts(lvl) {
  const L = lvl === 1 ? ri(1, 2) : lvl === 2 ? ri(2, 3) : ri(2, 4);
  let d = String(ri(1, 9));
  for (let i = 1; i < L; i++) d += String(i === L - 1 ? ri(1, 9) : ri(0, 9));
  const big = chance(.5);
  // No smaller than 10^-8: the site's answer checker cannot tell 10^-10 from 10^-11.
  const e = big ? (lvl === 1 ? ri(2, 6) : lvl === 2 ? ri(3, 9) : ri(1, 12)) : -(lvl === 1 ? ri(2, 4) : lvl === 2 ? ri(2, 7) : ri(1, 8));
  return { d, e };
}
const NOTES_SCI = [
  { d: '354', e: 8, where: 'Concept 3 · slide 16 (practice)' },
  { d: '96', e: -5, where: 'Concept 3 · slide 16 (practice)' },
  { d: '101', e: 5, where: 'Concept 3 · slide 12 (Example #5)' },
  { d: '98', e: -3, where: 'Concept 3 · slide 13 (Example #6)' },
  { d: '505', e: 4, where: 'Concept 3 · slide 10' },
];
const NOTES_STD = [
  { d: '276', e: -3, where: 'Concept 3 · slide 16 (practice)' },
  { d: '4011', e: 4, where: 'Concept 3 · slide 16 (practice)' },
  { d: '2057', e: 2, where: 'Concept 3 · slide 14 (Example #7)' },
  { d: '31', e: -4, where: 'Concept 3 · slide 15 (Example #8)' },
];
/** Digits of the standard number with where its decimal point sits now and
    where it sits in scientific notation. */
function decimalLayout(d, e) {
  const s = plain(sciValue(d, e));
  const [ip, fp = ''] = s.split('.');
  const digits = (ip + fp).split('');
  const f = digits.findIndex((c) => c !== '0');
  return { digits, stdPos: ip.length, sciPos: f + 1, first: f, L: d.length };
}
/** The decimal hopping digit by digit, each hop numbered. */
function hopsNode(d, e, toSci, final) {
  const { digits, stdPos, sciPos, first, L } = decimalLayout(d, e);
  const from = toSci ? stdPos : sciPos;
  const to = toSci ? sciPos : stdPos;
  const left = to < from;
  const hop = {};
  if (final) {
    if (left) for (let i = from - 1, k = 1; i >= to; i--, k++) hop[i] = k;
    else for (let i = from, k = 1; i < to; i++, k++) hop[i] = k;
  }
  const kids = [];
  for (let i = 0; i <= digits.length; i++) {
    if (i === from) kids.push(el('span', { class: 'pt was', 'data-l': 'start' }, '.'));
    if (i === to && final) kids.push(el('span', { class: 'pt now', 'data-l': 'end' }, '.'));
    if (i < digits.length) {
      const filled = !toSci && (i < first || i >= first + L);
      kids.push(el('span', { class: `dg${hop[i] ? ' hopped' : ''}${filled ? ' fill' : ''}` }, hop[i] ? el('span', { class: 'hop' }, String(hop[i])) : null, digits[i]));
    }
  }
  return scroller(el('div', { class: 'lab-hops', 'aria-hidden': 'true' }, ...kids));
}
function genSci(lvl) {
  let { d, e } = sciParts(lvl), notes = null;
  if (lvl <= 2 && chance(.15)) ({ d, e, where: notes } = pick(NOTES_SCI));
  const v = sciValue(d, e);
  const std = fx(v);
  const answer = sciText(d, e);
  const n = Math.abs(e);
  const work = (final) => {
    const kids = [
      P('Move the decimal so there is only 1 digit in front of it, then count the places it moved.'),
      hopsNode(d, e, true, final),
    ];
    if (final) {
      kids.push(
        P(`The decimal moves ${n} place${n === 1 ? '' : 's'} ${e > 0 ? 'left' : 'right'}, so the exponent is ${e > 0 ? '+' : MINUS}${n}.`),
        note(e > 0 ? 'You started with a big number (> 1), so the exponent is +.' : 'You started with a small number (< 1), so the exponent is −.'),
        el('div', { class: 'lab-formula' }, el('div', { class: 'ln' }, `${std} = `, boxed(...rich(answer)))));
    } else {
      kids.push(note(`Rewrite it as ${coefStr(d)} × 10 and use the count as the exponent: + if you started with a big number (> 1), − if you started with a small one (< 1).`));
    }
    return el('div', { class: 'lab-work' }, ...kids);
  };
  const flipE = sciText(d, -e);
  return makeQ('sci', {
    level: lvl, fromNotes: notes,
    prompt: `Write ${std} in scientific notation.`,
    answer, value: toNum(v), exactR: v, unit: '',
    accept: [`${coefStr(d)} x 10^${e}`, `${coefStr(d)}e${e}`, `${coefStr(d)}*10^${e}`, `${coefStr(d)} x10^${e}`],
    brief: `The decimal moves ${n} place${n === 1 ? '' : 's'} ${e > 0 ? 'left' : 'right'}, so the exponent is ${e > 0 ? '+' : '-'}${n}: ${std} = ${answer}.`,
    wrong: [
      { str: flipE, val: toNum(sciValue(d, -e)), why: 'exponent sign flipped' },
      { str: sciText(d, e + 1), val: toNum(sciValue(d, e + 1)), why: 'counted one place too many' },
      { str: sciText(d, e - 1), val: toNum(sciValue(d, e - 1)), why: 'counted one place too few' },
      { str: sciText(d, e > 0 ? e + 2 : e - 2), val: toNum(sciValue(d, e > 0 ? e + 2 : e - 2)), why: 'miscounted the places' },
    ],
    work,
  });
}
function genStd(lvl) {
  let { d, e } = sciParts(lvl), notes = null;
  if (lvl <= 2 && chance(.15)) ({ d, e, where: notes } = pick(NOTES_STD));
  const v = sciValue(d, e);
  const answer = fx(v);
  const n = Math.abs(e);
  const q = sciText(d, e);
  const work = (final) => {
    const kids = [
      P(`The exponent is ${e > 0 ? '+' : MINUS}${n}: move the decimal ${n} place${n === 1 ? '' : 's'} ${e > 0 ? 'right — a + exponent makes it a bigger number' : 'left — a − exponent makes it a smaller number'}.`),
      hopsNode(d, e, false, final),
    ];
    if (final) {
      kids.push(note('Fill the empty places with zeros (the dashed boxes).'),
        el('div', { class: 'lab-formula' }, el('div', { class: 'ln' }, ...rich(q), ' = ', boxed(answer))));
    } else kids.push(note('Hop the decimal one place at a time, filling any empty places with zeros.'));
    return el('div', { class: 'lab-work' }, ...kids);
  };
  return makeQ('std', {
    level: lvl, fromNotes: notes,
    prompt: `Write ${q} in standard notation.`,
    answer, value: toNum(v), exactR: v, unit: '',
    accept: [plain(v)],
    brief: `The exponent is ${e > 0 ? '+' : '-'}${n}, so the decimal moves ${n} place${n === 1 ? '' : 's'} ${e > 0 ? 'right' : 'left'}: ${answer}.`,
    wrong: [
      { str: readable(sciValue(d, -e)), val: toNum(sciValue(d, -e)), why: 'moved the decimal the wrong way' },
      { str: readable(sciValue(d, e + 1)), val: toNum(sciValue(d, e + 1)), why: 'moved one place too many' },
      { str: readable(sciValue(d, e - 1)), val: toNum(sciValue(d, e - 1)), why: 'moved one place too few' },
    ],
    work,
  });
}

/* ---------------------------------------------- 7. dimensional analysis */
const NOTES_DIM = [
  { g: '250.4', from: 'cm', to: 'ft', where: 'Concept 3 · slide 7 (Example #4)' },
  { g: '600', from: 'g', to: 'lb', where: 'Concept 3 · slide 9 (practice)' },
  { g: '100', from: 'cm', to: 'yd', where: 'Concept 3 · slide 9 (practice)' },
  { g: '1', from: 'year', to: 's', where: 'Concept 3 · slide 6 (Example #3)' },
  { g: '1', from: 'day', to: 'hour', where: 'Concept 3 · slide 3 (Example #1)' },
];
const DIMS = {};
for (const [k, u] of Object.entries(DU)) (DIMS[u.dim] ||= []).push(k);
/** Choose a start and end unit whose shortest route is `lens` factors long. */
function pickRoute(lvl, lens) {
  for (let tries = 0; tries < 400; tries++) {
    const dim = pick(['length', 'mass', 'volume', 'time', 'volume', 'mass', 'length']);
    const start = pick(DIMS[dim]);
    const dist = distances(start);
    const ends = DIMS[dim].filter((u) => lens.includes(dist[u]));
    if (!ends.length) continue;
    const end = pick(ends);
    return { start, end, len: dist[end] };
  }
  return { start: 'in', end: 'ft', len: 1 };
}
function bestPath(start, end) {
  const len = distances(start)[end];
  const all = routes(start, end, len + 2);
  const shortest = all.filter((p) => p.length === len).sort((a, b) => bridges(a) - bridges(b));
  return { path: shortest[0], all };
}
function genDim(lvl) {
  for (let tries = 0; tries < 300; tries++) {
    let start, end, given, notes = null;
    const n = lvl <= 2 && chance(.12) ? pick(NOTES_DIM.filter((x) => (lvl === 1 ? x.from === 'day' : x.from !== 'day'))) : null;
    if (n) ({ from: start, to: end, where: notes } = n), given = D(n.g);
    else {
      ({ start, end } = pickRoute(lvl, lvl === 1 ? [1] : lvl === 2 ? [2] : [3, 4]));
      given = randAmount(start, lvl);
    }
    const { path, all } = bestPath(start, end);
    const exact = chainValue(given, path);
    const v = toNum(exact);
    if (!notes && (v < 0.01 || v > 1e8)) continue;
    const a = answerNum(exact);
    const answer = `${a.str} ${uname(end, a.str)}`;
    // Other routes through the table are right too; their answers can differ
    // a little because some factors are rounded (1 cup = 236 mL, but 48 tsp).
    const alts = [];
    for (const p of all) {
      const s = answerNum(chainValue(given, p)).str;
      if (s !== a.str && !alts.some((x) => x.str === s)) alts.push({ str: s, path: p, val: toNum(chainValue(given, p)) });
    }
    const G = `${fx(given)} ${uname(start, fx(given))}`;
    const endMany = DU[end].many;
    const factors = path.map(shown);
    const work = (final) => {
      const kids = [
        P(`Start with what you are given, ${G}, and hop through the table to ${endMany}: `, path.map((f) => DU[f.bot.key].many).concat(endMany).join(' → '), '.'),
        el('ol', { class: 'lab-steps' }, ...path.map((f) => el('li', {},
          `${commas(f.edge[1])} ${uname(f.edge[0], f.edge[1])} = ${commas(f.edge[3])} ${uname(f.edge[2], f.edge[3])}, with ${DU[f.bot.key].many} on the bottom so ${DU[f.bot.key].many === DU[f.bot.key].one ? 'it cancels' : 'they cancel'}.`))),
      ];
      if (!final) {
        kids.push(fenceNode({ amt: fx(given), unit: uname(start, fx(given)) }, factors));
        kids.push(note('Multiply the top line across, multiply the bottom line across, then divide the top by the bottom.'));
        return el('div', { class: 'lab-work' }, ...kids);
      }
      const top = path.reduce((x, f) => mul(x, D(f.top.amt)), given);
      const bot = path.reduce((x, f) => mul(x, D(f.bot.amt)), R(1));
      kids.push(fenceNode({ amt: fx(given), unit: uname(start, fx(given)) }, factors, { result: { top: `${fx(top)} ${uname(end, fx(top))}`, bot: fx(bot), ans: answer } }));
      const q = div(top, bot);
      kids.push(P(`Top: ${[fx(given), ...path.map((f) => commas(f.top.amt))].join(' × ')} = ${fx(top)}. Bottom: ${path.map((f) => commas(f.bot.amt)).join(' × ')} = ${fx(bot)}.`));
      if (!a.exact) {
        // at least 6 digits, and never fewer than the whole-number part has
        const shownDigits = Math.max(6, (q.p / q.q).toString().length + 1);
        const whole = terminates(q) && sigCount(q) <= shownDigits;
        kids.push(P(`${fx(top)} ÷ ${fx(bot)} = ${whole ? fx(q) : `${commas(sigCut(q, shownDigits))}…`}`));
        const four = sigCut(q, 4).replace(/[-.,]/g, '').replace(/^0+/, '');
        const next = Number(four[3]);
        kids.push(P(`Round like the notes' answers: keep 3 digits, counting from the first digit that isn't 0 (${four.slice(0, 3).split('').join(', ')}). The next digit is ${next}, ${next >= 5 ? 'which is 5 or more, so round up' : 'which is less than 5, so leave the 3rd digit as it is'}: `, boxed(answer), '.'));
      }
      const far = alts.find((x) => Math.abs(x.val - toNum(a.r)) > Math.abs(toNum(a.r)) * 0.006);
      if (far) kids.push(note(`Going a different way through the table (${far.path.map((f) => DU[f.bot.key].many).concat(endMany).join(' → ')}) gives ${far.str} ${uname(end, far.str)} — that is right too; some factors in the table are rounded.`));
      return el('div', { class: 'lab-work' }, ...kids);
    };
    // classic mistakes: one factor upside down, every factor upside down, a power of ten
    const worst = path.reduce((w, f) => (Math.abs(Math.log(toNum(fVal(f)))) > Math.abs(Math.log(toNum(fVal(w)))) ? f : w), path[0]);
    const wrongR = [
      { r: mul(exact, div(fVal(flip(worst)), fVal(worst))), why: 'a factor flipped' },
      { r: path.reduce((x, f) => mul(x, fVal(flip(f))), given), why: 'every factor flipped' },
      { r: scale10(exact, 1), why: 'off by a power of ten' },
      { r: scale10(exact, -1), why: 'off by a power of ten' },
    ];
    if (path.length > 1) {
      const other = path.find((f) => f !== worst);
      wrongR.splice(1, 0, { r: mul(exact, div(fVal(flip(other)), fVal(other))), why: 'a factor flipped' });
    }
    return makeQ('dim', {
      level: lvl, fromNotes: notes,
      prompt: chance(.5) ? `Convert ${G} to ${endMany}.` : `How many ${endMany} are in ${G}?`,
      note: a.exact ? '' : 'Round like the notes\' answers (8.22 ft, 1.09 yds): keep 3 digits, counting from the first digit that isn\'t 0.',
      answer, value: toNum(a.r), unit: uname(end, a.str), unitKey: end, unitName: endMany,
      accept: acceptList([a.str, ...alts.map((x) => x.str)], DU[end].words),
      alts: alts.map((x) => x.val),
      grading: {
        exact: all.map((p) => chainValue(given, p)),
        rounded: [a.str, ...alts.map((x) => x.str)].map(D),
        loose: all.map((p) => chainValue(given, p)).filter((r) => !answerNum(r).exact),
      },
      brief: `${G} × ${path.map((f) => `(${fStr(f)})`).join(' × ')} = ${answer}`,
      wrong: wrongR.map((w) => { const s = answerNum(w.r).str; return { str: `${s} ${uname(end, s)}`, val: toNum(answerNum(w.r).r), why: w.why }; }),
      work,
    });
  }
  throw new Error('could not build a dimensional-analysis problem');
}

/* -------------------------------------------------- 6. conversion factors */
function genFactor(lvl) {
  if (lvl <= 2 || chance(.3)) {
    const edge = pick(TABLE);
    const from = chance(.5) ? edge[0] : edge[2];
    const to = from === edge[0] ? edge[2] : edge[0];
    const correct = edgeFactor(edge, from);
    const given = randAmount(from, 1);
    const cancels = [], rightTop = [];
    for (const e of TABLE) {
      if (e === edge) continue;
      if (e[0] === from || e[2] === from) cancels.push(edgeFactor(e, from));                  // cancels, but leads elsewhere
      if (e[0] === to || e[2] === to) rightTop.push(edgeFactor(e, e[0] === to ? e[2] : e[0])); // the right unit on top, cancels the wrong one
    }
    const sameDim = TABLE.filter((e) => e !== edge && DU[e[0]].dim === DU[from].dim).map((e) => edgeFactor(e, pick([e[0], e[2]])));
    return factorQ(lvl, {
      correct, given, start: from, known: [], end: to,
      prompt: `To convert ${fx(given)} ${uname(from, fx(given))} to ${DU[to].many} in one step, which conversion factor do you multiply by?`,
      distract: [flip(correct), ...shuffle([...cancels, ...rightTop]), ...shuffle([...cancels, ...rightTop].map(flip)), ...shuffle(sameDim)],
      isRight: (f) => f.bot.key === from && f.top.key === to,
    });
  }
  // the next factor in a picket fence that is already started
  const { start, end } = pickRoute(3, [2, 3]);
  const { path } = bestPath(start, end);
  const j = ri(0, path.length - 1);
  const known = path.slice(0, j);
  const correct = path[j];
  const current = j === 0 ? start : path[j - 1].top.key;
  // Any factor that cancels the unit you have and still leads on to the end
  // without doubling back is a right next step (the notes accept any route
  // through the table), so it is never offered as a wrong option. Wrong ones
  // don't cancel, or lead back to a unit already used, or into a dead end.
  const used = new Set([start, ...known.map((f) => f.top.key)]);
  const leadsOn = (u) => {
    if (used.has(u)) return false;
    const seen = new Set([...used, u]);
    const stack = [u];
    while (stack.length) {
      const x = stack.pop();
      if (x === end) return true;
      for (const { to } of ADJ[x] || []) if (!seen.has(to)) { seen.add(to); stack.push(to); }
    }
    return false;
  };
  const isRight = (f) => f.bot.key === current && leadsOn(f.top.key);
  const cancels = (ADJ[current] || []).filter((a) => a.edge !== correct.edge).map((a) => edgeFactor(a.edge, current));
  const rightTop = (ADJ[correct.top.key] || []).filter((a) => a.edge !== correct.edge).map((a) => edgeFactor(a.edge, a.to));
  const given = randAmount(start, 2);
  const G = `${fx(given)} ${uname(start, fx(given))}`;
  const chain = [G, ...known.map((f) => `(${fStr(f)})`)].join(' × ');
  return factorQ(lvl, {
    correct, given, start, known, end, chainMode: true, isRight,
    prompt: `Converting ${G} to ${DU[end].many}. So far: ${chain}. Which factor comes next?`,
    distract: [flip(correct), ...shuffle([...cancels, ...rightTop]), ...shuffle([...cancels, ...rightTop].map(flip))],
  });
}
function factorQ(lvl, { correct, prompt, distract, given, start, known, end, chainMode, isRight }) {
  const answer = fStr(correct);
  const seen = new Set([answer]);
  const opts = [];
  const offer = (f) => {
    const s = fStr(f);
    if (opts.length >= 3 || seen.has(s) || isRight(f)) return;
    seen.add(s); opts.push(s);
  };
  distract.forEach(offer);
  for (const e of shuffle(TABLE)) offer(edgeFactor(e, pick([e[0], e[2]])));
  const have = DU[correct.bot.key].many;
  const want = DU[correct.top.key].many;
  const G = `${fx(given)} ${uname(start, fx(given))}`;
  const startFence = { amt: fx(given), unit: uname(start, fx(given)) };
  const work = (final) => {
    const kids = [P(`You have ${have}, so ${have} must go on the bottom of the next factor to cancel. ${chainMode ? `Pick the one that also takes you a step closer to ${DU[end].many}.` : `The unit you want, ${want}, goes on top.`}`)];
    if (final) {
      kids.push(P(`The table says ${commas(correct.edge[1])} ${uname(correct.edge[0], correct.edge[1])} = ${commas(correct.edge[3])} ${uname(correct.edge[2], correct.edge[3])}, so the factor is `, frac(`${commas(correct.top.amt)} ${uname(correct.top.key, correct.top.amt)}`, `${commas(correct.bot.amt)} ${uname(correct.bot.key, correct.bot.amt)}`), '.'));
      let result = null;
      if (!chainMode) {
        const top = mul(given, D(correct.top.amt));
        const a = answerNum(div(top, D(correct.bot.amt)));
        result = { top: `${fx(top)} ${uname(correct.top.key, fx(top))}`, bot: commas(correct.bot.amt), ans: `${a.str} ${uname(correct.top.key, a.str)}` };
      }
      kids.push(fenceNode(startFence, [...known, correct].map(shown), { result }));
      kids.push(note(`Upside down (${fStr(flip(correct))}) the ${have} would not cancel — you would end up with ${have} × ${have}.`));
    } else {
      kids.push(fenceNode(startFence, [...known.map(shown), null]));
      kids.push(note(`Look for the row of the conversion table that has ${have} in it.`));
    }
    return el('div', { class: 'lab-work' }, ...kids);
  };
  const figure = chainMode ? fenceNode(startFence, [...known.map(shown), null]) : null;
  return makeQ('factor', {
    level: lvl, type: 'mc', prompt, answer, options: shuffle([answer, ...opts]),
    value: toNum(fVal(correct)), unit: `${correct.top.key}/${correct.bot.key}`,
    brief: `You have ${have}, so ${have} goes on the bottom to cancel${chainMode ? '' : ` and ${want} on top`}: ${answer}.`,
    figure, figureAlt: figure ? `The picket fence so far: ${[G, ...known.map(fStr)].join(' times ')}, then a blank.` : undefined,
    work,
  });
}

const GENERATORS = { prefix: genPrefix, temp: genTemp, avg: genAvg, sci: genSci, std: genStd, factor: genFactor, dim: genDim };
function levelOf(opt) {
  const d = opt && opt.difficulty;
  if (d === 'easy' || d === 'warm-up') return 1;
  if (d === 'hard' || d === 'challenge') return 3;
  const n = Number(d);
  return n >= 1 && n <= 3 ? Math.round(n) : 2;
}
/** A fresh practice problem for a skill. */
function generate(skillId, opt = {}) {
  const g = GENERATORS[skillId];
  if (!g) throw new Error(`unknown Problem Lab skill: ${skillId}`);
  return g(levelOf(opt));
}

/* ---------------------------------------------- multiple choice versions
   For the games: the three wrong options are the classic mistakes, each
   distinct from the others and never numerically equal to a right answer. */
const close = (a, b) => Math.abs(a - b) <= Math.max(Math.abs(a), Math.abs(b)) * 0.01 + 1e-12;
function generateMC(skillId, opt = {}) {
  const lvl = levelOf(opt);
  for (let tries = 0; tries < 40; tries++) {
    const q = generate(skillId, { difficulty: lvl });
    if (q.type === 'mc') { q.figure = undefined; q.figureAlt = undefined; q.explanation = q.brief; return q; }
    const rights = [q.value, ...q.alts];
    const picked = [];
    for (const w of q.wrong) {
      if (!Number.isFinite(w.val) || rights.some((r) => close(r, w.val))) continue;
      if (picked.some((p) => p.str === w.str || close(p.val, w.val)) || w.str === q.answer) continue;
      picked.push(w);
      if (picked.length === 3) break;
    }
    if (picked.length < 3) continue;
    return {
      ...q, type: 'mc', ask: 'Choose the answer',
      options: shuffle([q.answer, ...picked.map((p) => p.str)]),
      explanation: q.brief, figure: undefined, figureAlt: undefined,
      mistakes: picked.map((p) => ({ option: p.str, why: p.why })),
    };
  }
  throw new Error(`could not build a multiple-choice ${skillId} problem`);
}
const labSetOk = (set) => set && ['c2', 'c3', 'chem-all'].includes(set.id);
function gameQuestions(setOrId) {
  const set = typeof setOrId === 'string' ? CQ.getSet(setOrId) : setOrId;
  if (!labSetOk(set)) return [];
  const here = SKILLS.filter((s) => set.id === 'chem-all' || s.setId === set.id);
  const out = [];
  for (let i = 0; i < 12; i++) {
    const s = here[i % here.length];
    try { out.push(forCoreCard(generateMC(s.id, { difficulty: i % 3 === 2 ? 2 : 1 + (i % 2) }))); } catch (e) { console.warn(e); }
  }
  return out;
}

/* ------------------------------------------------ grading typed answers
   The Lab grades its own problems exactly, with the same BigInt fractions it
   builds them from. The site's shared checker allows 0.6% either way, which
   would pass "331 K" for 330 K or "1,248,000" for 1,247,000 — fine for a
   typed definition, wrong for a calculation with one right answer. */
const SUPS = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '' };
function tidy(raw) {
  return String(raw).trim()
    .replace(/[−–—]/g, '-')
    .replace(/[µμ]/g, 'µ')
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g, (m) => `^${[...m].map((c) => SUPS[c]).join('')}`)
    .replace(/\^\s*\^/g, '^')
    // "6 100 s" and "6 100 000": a space between digit groups is a thousands separator
    .replace(/(\d)[ \u00a0\u202f](?=\d{3}(?!\d))/g, '$1,');
}
const NUM_RE = /^([-+]?(?:\d{1,3}(?:,\d{3})+|\d+)?(?:\.\d+)?)(\s*(?:[x×*·]\s*10\s*\^?\s*[-+]?\d+|e[-+]?\d+))?\s*(.*)$/i;
const eqR = (a, b) => a.p === b.p && a.q === b.q;
const absR = (a) => (a.p < 0n ? R(-a.p, a.q) : a);
const leR = (a, b) => a.p * b.q <= b.p * a.q;
/** A typed number as an exact fraction, with the place of its last
    significant digit (a whole number's trailing zeros are not counted). */
function typedNumber(mant, expPart) {
  const t = mant.replace(/,/g, '').replace(/^\+/, '');
  const exp = expPart ? Number(expPart.replace(/^\s*(?:[x×*·]\s*10\s*\^?\s*|e)/i, '').replace('+', '')) : 0;
  const r = scale10(D(t), exp);
  const [ip, fp] = t.replace('-', '').split('.');
  let sig, place;
  if (fp != null) { sig = (ip + fp).replace(/^0+/, '').length; place = exp - fp.length; } else {
    const z = ip.length - ip.replace(/0+$/, '').length;
    sig = ip.replace(/^0+/, '').replace(/0+$/, '').length; place = exp + z;
  }
  return { r, sig, place };
}
/** Is the typed number right for q? Exact answers must be exact; a rounded
    dimensional-analysis answer may be written to 3 digits (as the notes do),
    or with more digits as long as every digit shown is right. */
function numberRight(q, t) {
  const g = q.grading;
  if (g.exact.some((x) => eqR(x, t.r))) return true;
  if (g.rounded.some((x) => eqR(x, t.r))) return true;
  if (t.sig < 3) return false;
  const half = scale10(R(5), t.place - 1);
  return g.loose.some((x) => leR(absR(sub(x, t.r)), half));
}
/** Grade a typed answer: the number (exactly), the unit (case-aware for M/m
    prefixes) and the form the skill is about. */
function grade(q, raw) {
  const s = tidy(raw);
  const m = s.match(NUM_RE);
  if (!m || !/\d/.test(m[1])) return { ok: false, why: 'Type a number (and its unit).' };
  const sciForm = !!m[2];
  const unitText = m[3].replace(/[.\s]+$/, '').trim();
  let t;
  try { t = typedNumber(m[1], m[2]); } catch { return { ok: false, why: 'Type a number (and its unit).' }; }
  const numOk = numberRight(q, t);
  let tip = '';
  if (q.unitKey) {
    if (!unitText) tip = `Remember to write the unit: ${q.unit}.`;
    else if (!unitOk(unitText, q.unitKey)) {
      return { ok: false, why: numOk ? `The number is right, but "${unitText}" is the wrong unit — this asks for ${q.unitName}.` : `Check the unit too — this asks for ${q.unitName}.` };
    }
  } else if (unitText) return { ok: false, why: numOk ? `The number is right, but this answer has no unit — leave off "${unitText}".` : '' };
  if (!numOk) return { ok: false, why: '' };
  if (q.skill === 'sci') {
    if (!sciForm) return { ok: false, why: 'That is the right value, but it is still in standard notation. Write it as a number × 10 to a power.' };
    const c = Math.abs(parseFloat(m[1].replace(/,/g, '')));
    if (!(c >= 1 && c < 10)) return { ok: false, why: 'Right value, but scientific notation has exactly one non-zero digit in front of the decimal (like 3.54, not 35.4).' };
  }
  if (q.skill === 'std' && sciForm) return { ok: false, why: 'That is the right value, but it is still in scientific notation. Write the number out in full.' };
  return { ok: true, tip };
}

/* ================================================================ screen */
function renderLab(set) {
  const here = SKILLS.filter((s) => set.id === 'chem-all' || s.setId === set.id);
  const prefs = CQ.state.prefs.lab ||= { level: 'auto', skills: {} };
  prefs.skills ||= {};
  if (!['auto', 1, 2, 3].includes(prefs.level)) prefs.level = 'auto';
  let on = new Set((prefs.skills[set.id] || []).filter((id) => SK[id] && here.includes(SK[id])));
  if (!on.size) on = new Set(here.map((s) => s.id));
  const bestKey = `lab-streak:${set.id}`;
  const S = { streak: 0, best: CQ.state.best[bestKey] || 0, right: 0, tries: 0, per: {}, lvl: {}, run: {}, last: [] };
  for (const s of here) S.per[s.id] = { right: 0, tries: 0 };
  let current = null;   // { q, done, card }

  const v = el('div', { class: 'view lab' });
  v.append(CQ.panelHead(set, 'lab', 'A new problem every time, so you learn the method instead of memorising answers. Each one ends with a worked solution. Stuck? "Show me how" walks you through it first — that attempt just won\'t count toward mastery.'));
  const levelSeg = el('div', { class: 'seg', role: 'group', 'aria-label': 'Difficulty' });
  const chips = el('div', { class: 'lab-chips' });
  const stats = el('div', { class: 'lab-stats', 'aria-label': 'This session' });
  const stage = el('div', { class: 'panel lab-stage' });
  v.append(
    el('div', { class: 'toolbar' }, CQ.backBtn(set), el('span', { class: 'spacer' }), el('span', { class: 'note lab-seg-label', id: 'lab-level-label' }, 'Difficulty'), levelSeg),
    el('section', { class: 'lab-skills', 'aria-labelledby': 'lab-skills-h' },
      el('div', { class: 'row between' }, el('h2', { class: 'lab-h', id: 'lab-skills-h' }, 'Skills'), el('span', { class: 'note' }, 'Tap to turn a skill on or off')),
      chips),
    stats, stage);
  CQ.main.append(v);

  function drawLevels() {
    levelSeg.innerHTML = '';
    for (const [k, label] of [['auto', 'Auto'], [1, 'Warm-up'], [2, 'Standard'], [3, 'Challenge']]) {
      levelSeg.append(el('button', { type: 'button', class: prefs.level === k ? 'on' : '', 'aria-pressed': prefs.level === k ? 'true' : 'false', title: k === 'auto' ? 'Starts easy and steps up as you get problems right' : '', onclick: () => { prefs.level = k; CQ.save(); drawLevels(); if (current && !current.done) serve(); } }, label));
    }
  }
  function drawChips() {
    chips.innerHTML = '';
    const groups = set.id === 'chem-all' ? [['c2', 'Concept 2'], ['c3', 'Concept 3']] : [[set.id, '']];
    for (const [sid, title] of groups) {
      const row = el('div', { class: 'lab-chip-row', role: 'group', 'aria-label': title ? `${title} skills` : 'Skills' },
        title ? el('span', { class: 'lab-group' }, title) : null);
      for (const s of here.filter((x) => x.setId === sid)) {
        const isOn = on.has(s.id);
        const t = S.per[s.id];
        const m = Math.min(2, CQ.state.mastery[`lab:${s.id}`] || 0);
        row.append(el('button', {
          type: 'button', class: `lab-chip${isOn ? ' on' : ''}`, 'aria-pressed': isOn ? 'true' : 'false',
          'aria-label': `${s.name}${t.tries ? `, ${t.right} of ${t.tries} right this session` : ''}${m ? `, mastery ${m} of 2` : ''}`,
          onclick: () => toggle(s.id),
        },
        el('span', { class: 'tick', 'aria-hidden': 'true' }, isOn ? '✓' : '+'),
        el('span', { 'aria-hidden': 'true' }, s.ico), ` ${s.name}`,
        t.tries ? el('span', { class: 'tally', 'aria-hidden': 'true' }, `${t.right}/${t.tries}`) : null,
        m ? el('span', { class: 'mastery', 'aria-hidden': 'true', title: 'Mastery' }, '★'.repeat(m)) : null));
      }
      chips.append(row);
    }
  }
  function toggle(id) {
    if (on.has(id) && on.size === 1) { CQ.toast('Keep at least one skill on'); return; }
    if (on.has(id)) on.delete(id); else on.add(id);
    prefs.skills[set.id] = [...on];
    CQ.save();
    drawChips();
    if (current && !current.done && !on.has(current.q.skill)) serve();
  }
  function drawStats() {
    stats.innerHTML = '';
    stats.append(
      el('span', { class: 'lab-stat' }, el('span', { 'aria-hidden': 'true' }, '🔥'), ' Streak ', el('b', {}, String(S.streak))),
      el('span', { class: 'lab-stat' }, el('span', { 'aria-hidden': 'true' }, '🏆'), ' Best ', el('b', {}, String(S.best))),
      el('span', { class: 'lab-stat' }, el('span', { 'aria-hidden': 'true' }, '✅'), ' Right ', el('b', {}, `${S.right} / ${S.tries}`), ' this session'),
    );
  }
  function nextSkill() {
    const ids = [...on];
    if (ids.length === 1) return ids[0];
    const w = ids.map((id) => {
      let x = 3 - Math.min(2, CQ.state.mastery[`lab:${id}`] || 0);
      if (S.last[0] === id) x *= 0.3;
      if (S.last[0] === id && S.last[1] === id) x *= 0.2;
      return x;
    });
    let r = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < ids.length; i++) { r -= w[i]; if (r <= 0) return ids[i]; }
    return ids[ids.length - 1];
  }
  function serve() {
    const skill = nextSkill();
    const lvl = prefs.level === 'auto' ? (S.lvl[skill] || 1) : prefs.level;
    const q = generate(skill, { difficulty: lvl });
    S.last.unshift(skill); S.last.length = Math.min(S.last.length, 4);
    CQLab.current = q;
    draw(q, lvl);
  }

  function draw(q, lvl) {
    stage.innerHTML = '';
    const st = current = { q, done: false, assisted: false, card: null };
    const hintId = `lab-hint-${Date.now()}`;
    const hintBox = el('div', { class: 'lab-hint', id: hintId, hidden: true });
    const hintBtn = el('button', { type: 'button', class: 'btn sm lab-hint-btn', 'aria-expanded': 'false', 'aria-controls': hintId, onclick: () => {
      if (st.done) return;
      const open = hintBox.hidden;
      hintBox.hidden = !open;
      hintBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      hintBtn.textContent = open ? 'Hide the method' : '💡 Show me how';
      if (open && !hintBox.childElementCount) {
        st.assisted = true;
        hintBox.append(el('p', { class: 'lab-assisted' }, el('span', { 'aria-hidden': 'true' }, '💡 '), 'Assisted — this problem won\'t count toward mastery. Finish it yourself, then try the next one on your own.'), q.hint());
      }
    } }, '💡 Show me how');
    const head = el('div', { class: 'lab-card-head' },
      el('span', { class: 'q-tag' }, q.ask),
      el('span', { class: 'lab-level' }, LEVEL_NAMES[lvl]),
      q.fromNotes ? el('span', { class: 'lab-level notes' }, '📓 From your notes') : null);

    let card;
    if (q.type === 'mc') {
      card = CQ.questionCard(q, { onAnswer: (ok) => settle(ok, ok ? '' : 'x', null), showTag: true, instant: true });
      card.classList.add('lab-card');
      card.querySelector('.q-tag')?.replaceWith(head);
      // the options are fractions: draw them stacked, as in the notes
      for (const b of card.querySelectorAll('.opt')) {
        const span = b.lastElementChild;
        const [top, bot] = (b.dataset.v || '').split(' / ');
        if (span && bot) span.replaceChildren(frac(top, bot));
      }
      const opts = card.querySelector('.opts');
      opts.after(el('div', { class: 'row lab-actions' }, hintBtn), hintBox);
    } else {
      card = el('div', { class: 'q-card lab-card' }, head);
      if (q.figure) card.append(el('div', { class: 'q-figure', role: 'img', 'aria-label': q.figureAlt || '' }, q.figure));
      card.append(el('div', { class: 'q-prompt' }, ...rich(q.prompt)));
      if (q.note) card.append(el('p', { class: 'lab-note' }, q.note));
      const inp = el('input', { class: 'input', type: 'text', placeholder: PLACEHOLDER[q.skill] || 'Type your answer…', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', enterkeyhint: 'done', 'aria-label': 'Your answer' });
      const answerBtn = el('button', { type: 'button', class: 'btn primary', onclick: () => submit(false) }, 'Answer');
      const skipBtn = el('button', { type: 'button', class: 'btn ghost', onclick: () => submit(true) }, 'Don\'t know');
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(false); } });
      card.append(el('div', { class: 'written' }, inp, answerBtn, skipBtn));
      const extras = el('div', { class: 'row lab-actions' }, hintBtn);
      if (q.skill === 'sci') {
        const ins = (t) => { const a = inp.selectionStart ?? inp.value.length, b = inp.selectionEnd ?? a; inp.value = inp.value.slice(0, a) + t + inp.value.slice(b); inp.focus(); inp.setSelectionRange(a + t.length, a + t.length); };
        extras.append(el('button', { type: 'button', class: 'btn sm ghost', 'aria-label': 'Insert times ten to the power', onclick: () => ins(' × 10^') }, '× 10^'),
          el('button', { type: 'button', class: 'btn sm ghost', 'aria-label': 'Insert minus sign', onclick: () => ins('-') }, '−'));
      }
      card.append(extras, hintBox);
      if (matchMedia('(pointer: fine)').matches) CQ.later(() => inp.focus(), 60);
      st.input = inp;
      function submit(dontKnow) {
        if (st.done) return;
        const raw = inp.value.trim();
        if (!dontKnow && !raw) { inp.focus(); return; }
        inp.disabled = true; answerBtn.disabled = true; skipBtn.disabled = true;
        const g = dontKnow ? { ok: false, why: '' } : grade(q, raw);
        const fb = el('div', { class: `feedback ${g.ok ? 'good' : 'bad'}`, role: 'status', 'aria-live': 'polite' },
          el('b', { class: 'title' }, g.ok ? `✓ ${pick(['Correct!', 'Nice!', 'You got it!', 'Exactly right.'])}` : dontKnow ? ['Here\'s how it works. The answer is ', el('span', { class: 'lab-nowrap' }, ...rich(q.answer))] : ['✗ Not quite — the answer is ', el('span', { class: 'lab-nowrap' }, ...rich(q.answer))]),
          g.why ? el('p', { class: 'lab-why' }, g.why) : null,
          g.tip ? el('p', { class: 'lab-why' }, g.tip) : null,
          el('div', { class: 'exp' }, q.work(true)),
          el('div', { class: 'src' }, q.source));
        card.append(fb);
        settle(g.ok, raw, fb);
      }
    }
    st.card = card;
    stage.append(card);

    function settle(ok, given, fb) {
      if (st.done) return;
      st.done = true;
      hintBtn.remove();
      hintBox.hidden = true;
      S.per[q.skill] ||= { right: 0, tries: 0 };
      S.tries++; S.per[q.skill].tries++;
      if (ok) { S.right++; S.per[q.skill].right++; }
      // an assisted answer earns no credit, but a miss still goes to Mistakes
      if (!st.assisted || !ok) CQ.bumpMastery(q.id, ok);
      if (ok && !st.assisted) S.streak++;
      else if (!ok) S.streak = 0;
      if (S.streak > S.best) { S.best = S.streak; CQ.recordBest(bestKey, S.best); }
      if (prefs.level === 'auto') {
        const cur = S.lvl[q.skill] || 1;
        if (ok && !st.assisted) {
          S.run[q.skill] = (S.run[q.skill] || 0) + 1;
          if (S.run[q.skill] >= 2 && cur < 3) { S.lvl[q.skill] = cur + 1; S.run[q.skill] = 0; CQ.toast(`${SK[q.skill].name}: up to ${LEVEL_NAMES[cur + 1]}`); }
        } else if (!ok) { S.run[q.skill] = 0; if (cur > 1) S.lvl[q.skill] = cur - 1; }
      }
      if (ok) {
        CQ.sfx.good();
        if (S.streak && S.streak % 5 === 0) { CQ.floatText(`🔥 ${S.streak} in a row!`, 'var(--warm)'); if (S.streak % 10 === 0) CQ.confetti(60); }
      } else CQ.sfx.bad();
      if (!ok && given && q.type !== 'mc') {
        const ob = el('button', { type: 'button', class: 'btn sm ghost lab-override', onclick: () => {
          ob.remove();
          if (fb) { fb.className = 'feedback good'; fb.querySelector('.title').textContent = 'Marked correct.'; }
          S.right++; S.per[q.skill].right++;
          if (!st.assisted) {
            CQ.state.mastery[q.id] = Math.min(2, (CQ.state.mastery[q.id] || 0) + 1);
            CQ.state.stats.correct++;
            delete CQ.state.missed[q.id];
            CQ.save();
          }
          drawStats(); drawChips();
        } }, 'Override: I was right');
        st.card.append(ob);
      }
      const next = el('button', { type: 'button', class: 'btn primary lg', onclick: serve }, 'Next problem →');
      st.card.append(el('div', { class: 'row' }, next));
      next.focus({ preventScroll: true });
      drawStats(); drawChips();
    }
  }

  const offKeys = CQ.onKeys((e) => {
    if (!current || current.done || current.q.type !== 'mc') return;
    if (/^[1-4]$/.test(e.key) && current.card.pickByKey) current.card.pickByKey(e.key);
  });
  // for tests and screenshots: put a particular generated problem on screen
  CQLab.show = (q) => { CQLab.current = q; draw(q, q.level || 2); };
  CQ.addCleanup(() => { offKeys(); CQLab.current = null; CQLab.show = null; });
  drawLevels(); drawChips(); drawStats();
  serve();
}

/* ========================================================== registration */
CQ.registerMode({
  id: 'lab', name: 'Problem Lab', ico: '🧮', color: '#10b981', before: 'match',
  desc: 'Endless new calculation problems — prefixes, temperature, scientific notation, dimensional analysis — each with a worked solution.',
  available: labSetOk,
  render: renderLab,
});
CQ.addGameSource(gameQuestions);
/* Mistakes re-serves a missed skill through the core question card, which
   draws the prompt as plain text and grades typed answers with a 0.6%
   tolerance. So it gets the multiple-choice version — graded exactly, with
   the classic mistakes as the wrong options — the rounding note is written
   into the prompt, and powers of ten use real superscripts (10⁶, not 10^6). */
const SUPD = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '-': '⁻' };
const supPow = (t) => String(t).replace(/10\^(-?\d+)/g, (_, e) => `10${[...e].map((c) => SUPD[c]).join('')}`);
function forCoreCard(q) {
  return {
    ...q,
    prompt: supPow(q.note ? `${q.prompt} ${q.note}` : q.prompt),
    answer: supPow(q.answer),
    options: q.options.map(supPow),
    explanation: typeof q.explanation === 'string' ? supPow(q.explanation) : q.explanation,
  };
}
CQ.registerItemResolver('lab', (id) => {
  const s = SK[id.split(':')[1]];
  if (!s) return null;
  return { setId: s.setId, label: `Problem Lab · ${s.label}`, make: () => forCoreCard(generateMC(s.id, { difficulty: 2 })) };
});

const CQLab = window.CQLab = {
  skills: SKILLS.map(({ id, name, setId }) => ({ id, name, setId })),
  generate,
  generateMC,
  gameQuestions,
  grade,
  forCoreCard,
  current: null,
  show: null,
};
})();
