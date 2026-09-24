/* ==========================================================================
   Problem Lab — endless, freshly generated practice for Chemistry
   Concepts 2 and 3 and Units 5–12, with a worked solution for every problem.

   A fixed question bank lets a student memorise "6,100 s" without ever
   learning to move a decimal. Here every problem is new, built only from the
   methods and numbers in the class notes (the prefix chart, the three
   temperature formulas, averaging, scientific notation and the dimensional-
   analysis table), and every answer is computed exactly with integer
   arithmetic — so no 0.30000000000000004 ever reaches a student.

   Registers through window.CQ (see the plugin section of app.js):
   - mode "lab" on Concepts 2 and 3, Units 5, 6 and 8–12, and All;
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
/* On screen, a number never wraps away from its unit ("178" at the end of one
   line, "°C" on the next): a no-break space goes between them. Done when a
   card is drawn, so the question's own text (and what the verifier reads)
   keeps plain spaces. */
const UNIT_AFTER = /(\d) (?=(?:°C|°F|K|L|mL|atm|kPa|mmHg|M|g|mg|kg|mol|g\/mol|amu|%)(?![A-Za-z0-9]))/g;
const keepUnits = (t) => String(t).replace(UNIT_AFTER, '$1\u00a0');
function keepUnitsIn(node) {
  const walk = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  for (let t = walk.nextNode(); t; t = walk.nextNode()) if (/\d /.test(t.nodeValue)) t.nodeValue = keepUnits(t.nodeValue);
  return node;
}
/** 10 to a symbolic power, like 10⁻ᵖᴴ, as a real superscript. */
const pow10 = (e) => el('span', { class: 'lab-pow' }, '10', el('span', { class: 'sr-only' }, ' to the power '), el('sup', {}, e));

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
  pne: 'Unit 5 · Atomic Number, Mass Number and Ions',
  avgmass: 'Unit 5 · Isotopes and Average Atomic Mass',
  config: 'Unit 6 · Electron Configuration',
  valence: 'Unit 6 · Valence Electrons',
  noble: 'Unit 6 · Electron Configuration (noble-gas shorthand)',
  formula: 'Unit 8 · Writing Formulas',
  naming: 'Unit 8 · Naming Compounds',
  balance: 'Unit 9 · Balancing Equations',
  rxntype: 'Unit 9 · Reaction Types',
  molar: 'Unit 10 · Molar Mass',
  moles: 'Unit 10 · Mole Conversions',
  pcomp: 'Unit 10 · Percent Composition',
  empirical: 'Unit 10 · Empirical Formulas',
  stoich: 'Unit 10 · Stoichiometry and Mole Ratios',
  limiting: 'Unit 10 · Limiting Reactant',
  yield: 'Unit 10 · Percent Yield',
  pressure: 'Unit 11 · Pressure',
  gaslaw: 'Unit 11 · Gas Laws',
  ideal: 'Unit 11 · Ideal Gas Law',
  molarity: 'Unit 12 · Molarity',
  dilution: 'Unit 12 · Dilution',
  ph: 'Unit 12 · pH Scale',
  acidbase: 'Unit 12 · Acids and Bases',
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
  // units after the class notes
  { id: 'pne', setId: 'chem-u5', name: 'Protons, neutrons, electrons', ico: '⚛️', label: 'Protons, neutrons and electrons in atoms and ions' },
  { id: 'avgmass', setId: 'chem-u5', name: 'Average atomic mass', ico: '📊', label: 'Average atomic mass from isotopes' },
  { id: 'config', setId: 'chem-u6', name: 'Electron configuration', ico: '🌀', label: 'Writing electron configurations' },
  { id: 'valence', setId: 'chem-u6', name: 'Valence electrons', ico: '💫', label: 'Valence electrons of main-group elements' },
  { id: 'noble', setId: 'chem-u6', name: 'Noble-gas shorthand', ico: '👑', label: 'Noble-gas shorthand configurations' },
  { id: 'formula', setId: 'chem-u8', name: 'Writing formulas', ico: '✍️', label: 'Writing formulas from names' },
  { id: 'naming', setId: 'chem-u8', name: 'Naming compounds', ico: '🏷️', label: 'Naming ionic and molecular compounds' },
  { id: 'balance', setId: 'chem-u9', name: 'Balancing equations', ico: '⚗️', label: 'Balancing chemical equations' },
  { id: 'rxntype', setId: 'chem-u9', name: 'Reaction types', ico: '💥', label: 'Classifying reactions' },
  { id: 'molar', setId: 'chem-u10', name: 'Molar mass', ico: '🧪', label: 'Molar mass of a compound' },
  { id: 'moles', setId: 'chem-u10', name: 'Mole conversions', ico: '🔁', label: 'Grams, moles and particles' },
  { id: 'pcomp', setId: 'chem-u10', name: 'Percent composition', ico: '🥧', label: 'Percent composition by mass' },
  { id: 'empirical', setId: 'chem-u10', name: 'Empirical formula', ico: '🧩', label: 'Empirical formula from percent composition' },
  { id: 'stoich', setId: 'chem-u10', name: 'Stoichiometry', ico: '🍳', label: 'Mass-to-mass stoichiometry' },
  { id: 'limiting', setId: 'chem-u10', name: 'Limiting reactant', ico: '🚦', label: 'Limiting reactant' },
  { id: 'yield', setId: 'chem-u10', name: 'Percent yield', ico: '🎯', label: 'Percent yield' },
  { id: 'pressure', setId: 'chem-u11', name: 'Pressure units', ico: '🌬️', label: 'Converting pressure units' },
  { id: 'gaslaw', setId: 'chem-u11', name: 'Gas laws', ico: '🎈', label: 'Boyle\'s, Charles\'s, Gay-Lussac\'s and the combined gas law' },
  { id: 'ideal', setId: 'chem-u11', name: 'Ideal gas law', ico: '💨', label: 'The ideal gas law, PV = nRT' },
  { id: 'molarity', setId: 'chem-u12', name: 'Molarity', ico: '🥤', label: 'Molarity, moles and grams of solute' },
  { id: 'dilution', setId: 'chem-u12', name: 'Dilution', ico: '💧', label: 'Dilution, M₁V₁ = M₂V₂' },
  { id: 'ph', setId: 'chem-u12', name: 'pH and pOH', ico: '🍋', label: 'pH, pOH and [H⁺]' },
  { id: 'acidbase', setId: 'chem-u12', name: 'Acidic or basic?', ico: '🧫', label: 'Acidic, basic or neutral' },
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
  pne: 'protons, neutrons, electrons',
  config: 'Like 1s2 2s2 …',
  valence: 'A number',
  formula: 'Formula (type 2 for ₂)',
  naming: 'Name of the compound',
  balance: 'Coefficients in order',
  ph: 'A number',
  phConc: 'Like 1 x 10^-5 M',
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

/* ==========================================================================
   Units 5–12 — atomic structure, electrons, naming, reactions, the mole,
   gases and solutions. The same rules as above: every number is an exact
   BigInt fraction until it is deliberately rounded, and the only facts a
   problem uses are the tables below (atomic masses to two decimals, ion
   charges, real reactions with their balanced coefficients).
   tools/verify-lab.mjs checks those tables against its own copy.
   ========================================================================== */

/* ------------------------------------------------ the periodic table */
// [atomic number, symbol, name, atomic mass to two decimals]
const PT_ROWS = [
  [1, 'H', 'hydrogen', '1.01'], [2, 'He', 'helium', '4.00'], [3, 'Li', 'lithium', '6.94'], [4, 'Be', 'beryllium', '9.01'],
  [5, 'B', 'boron', '10.81'], [6, 'C', 'carbon', '12.01'], [7, 'N', 'nitrogen', '14.01'], [8, 'O', 'oxygen', '16.00'],
  [9, 'F', 'fluorine', '19.00'], [10, 'Ne', 'neon', '20.18'], [11, 'Na', 'sodium', '22.99'], [12, 'Mg', 'magnesium', '24.31'],
  [13, 'Al', 'aluminum', '26.98'], [14, 'Si', 'silicon', '28.09'], [15, 'P', 'phosphorus', '30.97'], [16, 'S', 'sulfur', '32.07'],
  [17, 'Cl', 'chlorine', '35.45'], [18, 'Ar', 'argon', '39.95'], [19, 'K', 'potassium', '39.10'], [20, 'Ca', 'calcium', '40.08'],
  [21, 'Sc', 'scandium', '44.96'], [22, 'Ti', 'titanium', '47.87'], [23, 'V', 'vanadium', '50.94'], [24, 'Cr', 'chromium', '52.00'],
  [25, 'Mn', 'manganese', '54.94'], [26, 'Fe', 'iron', '55.85'], [27, 'Co', 'cobalt', '58.93'], [28, 'Ni', 'nickel', '58.69'],
  [29, 'Cu', 'copper', '63.55'], [30, 'Zn', 'zinc', '65.38'], [31, 'Ga', 'gallium', '69.72'], [32, 'Ge', 'germanium', '72.63'],
  [33, 'As', 'arsenic', '74.92'], [34, 'Se', 'selenium', '78.97'], [35, 'Br', 'bromine', '79.90'], [36, 'Kr', 'krypton', '83.80'],
  [37, 'Rb', 'rubidium', '85.47'], [38, 'Sr', 'strontium', '87.62'], [47, 'Ag', 'silver', '107.87'], [50, 'Sn', 'tin', '118.71'],
  [53, 'I', 'iodine', '126.90'], [54, 'Xe', 'xenon', '131.29'], [56, 'Ba', 'barium', '137.33'], [79, 'Au', 'gold', '196.97'],
  [80, 'Hg', 'mercury', '200.59'], [82, 'Pb', 'lead', '207.20'],
];
const ELEM = {};
const BY_Z = {};
for (const [z, sym, name, mass] of PT_ROWS) ELEM[sym] = BY_Z[z] = { z, sym, name, mass, m: D(mass) };
const cap1 = (s) => s[0].toUpperCase() + s.slice(1);
/** "a 5.00 L container" but "an 8.00 L container", "an 11.2 L …", "an 18,000 …" */
const aN = (s) => (/^(8|1[18](?![\d,])|1[18],\d{3}(?![\d,]))/.test(String(s)) ? `an ${s}` : `a ${s}`);
const { uniqBy } = CQ;

/* ------------------------------------------------ writing formulas */
const SUBD = '₀₁₂₃₄₅₆₇₈₉';
const SUPD9 = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const subDigits = (s) => String(s).replace(/\d/g, (d) => SUBD[d]);
const supText = (s) => String(s).replace(/\d/g, (d) => SUPD9[d]).replace(/\+/g, '⁺').replace(/[-−]/g, '⁻');
/** "Ca(OH)2" → "Ca(OH)₂": a number after a letter or a bracket is a subscript. */
const fm = (f) => String(f).replace(/([A-Za-z)])(\d+)/g, (_, a, d) => a + subDigits(d));
const unSub = (s) => String(s).replace(/[₀-₉]/g, (c) => String(SUBD.indexOf(c)));
/** "6.02 × 10^23" → "6.02 × 10²³", for text that is not run through rich(). */
const supPow10 = (s) => String(s).replace(/10\^(-?\d+)/g, (_, e) => `10${supText(e)}`);
/** An ion's charge as a superscript: "²⁺", "⁻". */
const chargeText = (c) => supText(`${Math.abs(c) === 1 ? '' : Math.abs(c)}${c > 0 ? '+' : '-'}`);
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const gcdN = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };

/** Atoms in a formula, in order of first appearance: "Ca(NO3)2" → { Ca: 1, N: 2, O: 6 }. */
function atomsOf(formula) {
  const s = unSub(formula);
  let i = 0;
  const group = () => {
    const out = {};
    while (i < s.length && s[i] !== ')') {
      let part;
      if (s[i] === '(') {
        i++;
        part = group();
        if (s[i] !== ')') throw new Error(`unclosed bracket in ${formula}`);
        i++;
      } else {
        const m = /^[A-Z][a-z]?/.exec(s.slice(i));
        if (!m || !ELEM[m[0]]) throw new Error(`not a formula: ${formula}`);
        i += m[0].length;
        part = { [m[0]]: 1 };
      }
      const d = /^\d+/.exec(s.slice(i));
      const k = d ? Number(d[0]) : 1;
      if (d) i += d[0].length;
      for (const [e, c] of Object.entries(part)) out[e] = (out[e] || 0) + c * k;
    }
    return out;
  };
  const r = group();
  if (i !== s.length || !Object.keys(r).length) throw new Error(`not a formula: ${formula}`);
  return r;
}
const sameAtoms = (a, b) => { const k = Object.keys(a); return k.length === Object.keys(b).length && k.every((e) => a[e] === b[e]); };
const molarMass = (f) => Object.entries(atomsOf(f)).reduce((t, [e, c]) => add(t, mul(ELEM[e].m, R(c))), R(0));
/** A value with exactly two decimals, as the tables write it: "164.10". */
const fx2 = (r) => commas(placePoint((roundDp(r, 2).p * 100n) / roundDp(r, 2).q, 2, false));
/** "Atomic masses: Ca = 40.08, N = 14.01, O = 16.00 (g/mol)." for the elements in these formulas. */
function massNote(formulas) {
  const seen = [];
  for (const f of formulas) for (const e of Object.keys(atomsOf(f))) if (!seen.includes(e)) seen.push(e);
  return `Atomic masses: ${seen.map((e) => `${e} = ${ELEM[e].mass}`).join(', ')} (g/mol).`;
}

/* ------------------------------------------------ numbers, rounded or not */
/** floor(log10 |r|) for r ≠ 0. */
function expOf(r) {
  const P0 = r.p < 0n ? -r.p : r.p;
  let e = P0.toString().length - r.q.toString().length;
  if (!(e >= 0 ? P0 >= r.q * p10(e) : P0 * p10(-e) >= r.q)) e -= 1;
  return e;
}
const roundSig = (r, n) => D(sigStr(r, n));
const bigOrSmall = (e) => e >= 6 || e <= -4;
/** r to n significant figures as it is shown: "0.0123", "1,520", "3.01 × 10^24". */
function sfShow(r, n) {
  const v = roundSig(r, n);
  if (isZero(v)) return '0';
  const e = expOf(v);
  if (!bigOrSmall(e)) return commas(sigStr(r, n));
  const m = scale10(absR(v), -e);
  return `${isNeg(v) ? '-' : ''}${placePoint((m.p * p10(n - 1)) / m.q, n - 1, false)} × 10^${e}`;
}
/** An exact or long value for a worked solution: all of it when it is short,
    otherwise the first digits and "…". */
function longShow(r, maxSig = 7) {
  if (isZero(r)) return '0';
  const e = expOf(r);
  const exact = terminates(r) && sigCount(r) <= maxSig;
  if (!bigOrSmall(e)) return exact ? fx(r) : `${commas(sigCut(r, maxSig))}…`;
  const m = scale10(r, -e);
  return `${exact ? plain(m) : `${sigCut(m, maxSig)}…`} × 10^${e}`;
}
/** A given amount: n significant figures, trailing zeros kept ("25.0", "0.500"). */
function given3(eLo, eHi, n = 3) {
  const e = ri(eLo, eHi);
  let int = ri(10 ** (n - 1), 10 ** n - 1);
  if (chance(.4)) int = Math.round(int / 10) * 10 || 10 ** (n - 1);
  if (int >= 10 ** n) int = 10 ** n - 10;
  const r = scale10(R(int), e - (n - 1));
  const s = e - (n - 1) < 0 ? placePoint(B(int), n - 1 - e, false) : commas(plain(r));
  return { r, s: bigOrSmall(e) ? sfShow(r, n) : s };
}
/** How a typed number is graded: exactly, or rounded to sf significant figures or dp decimal places. */
function numAns(truth, how) {
  if (how.exact) return { str: fx(truth), stated: truth, exact: truth, truth, place: null, howText: '' };
  if (how.dp != null) {
    const st = roundDp(truth, how.dp);
    return { str: commas(placePoint((st.p * p10(how.dp)) / st.q, how.dp, false)), stated: st, truth, place: -how.dp, howText: `${how.dp === 1 ? 'one decimal place' : `${['', 'one', 'two', 'three'][how.dp]} decimal places`}` };
  }
  const st = roundSig(truth, how.sf);
  return { str: sfShow(truth, how.sf), stated: st, truth, place: expOf(st) - (how.sf - 1), howText: `${how.sf} significant figures` };
}
const SF3 = { sf: 3 };
/** The digit just after the last one kept. */
const nextDigit = (r, place) => { const k = div(absR(r), scale10(R(1), place - 1)); return Number((k.p / k.q) % 10n); };
/** half away from zero to a multiple of 10^place */
function roundPlace(r, place) {
  const u = scale10(R(1), place);
  const k = div(r, u);
  const neg = k.p < 0n;
  const P0 = neg ? -k.p : k.p;
  const int = (2n * P0 + k.q) / (2n * k.q);
  return mul(R(neg ? -int : int), u);
}

/* ------------------------------------------------ units the student types */
spell('gmol', ['g/mol', 'g/mole', 'g mol-1', 'g mol^-1', 'gmol-1', 'grams per mole', 'gram per mole', 'grams per mol', 'grams/mole', 'grams/mol', 'g per mol', 'g per mole']);
spell('amu', ['amu', 'u', 'atomic mass units', 'atomic mass unit', 'Da', 'g/mol']);
spell('mol', ['mol', 'mols', 'mole', 'moles']);
spell('atoms', ['atoms', 'atom', 'particles', 'particle']);
spell('molecules', ['molecules', 'molecule', 'particles', 'particle']);
spell('formula units', ['formula units', 'formula unit', 'units', 'particles', 'particle']);
spell('pct', ['%', 'percent', 'pct', 'per cent']);
spell('atm', ['atm', 'atms', 'atmosphere', 'atmospheres']);
spell('kPa', ['kPa', 'kilopascal', 'kilopascals']);
spell('mmHg', ['mmHg', 'mm Hg', 'millimeters of mercury', 'millimetres of mercury', 'millimeter of mercury', 'torr']);
spell('M', ['mol/L', 'mol L-1', 'mol L^-1', 'molar', 'moles per liter', 'moles per litre', 'mol per liter', 'mol per L', 'moles/L', 'mol/liter', 'mols/L', 'moles/liter', 'mol/dm3'], ['M']);
spell('ve', ['valence electrons', 'valence electron', 'electrons', 'electron', 'e', 'e-', 'valence']);

/* ------------------------------------------------ grading typed answers */
// "V2 = 3.5 L", "[H+] = …", "pH = 4": a name and "=" in front are fine
const LEAD_EQ = /^\s*(?:\[[^\]=]{1,12}\]|[A-Za-z][A-Za-z0-9]{0,5})\s*=\s*/;
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function numOk(G, t) {
  if (G.exact) return eqR(t.r, G.exact);
  if (eqR(t.r, G.stated)) return true;
  // more digits than asked for: right when within half a unit of the last
  // stated digit of the true value (47.549 for a true 47.552 stated as 47.6)
  if (t.place >= G.place) return false;
  return leR(absR(sub(G.truth, t.r)), scale10(R(5), G.place - 1));
}
function gradeNum(q, raw) {
  const G = q.grading;
  const ask = G.unitKey ? 'Type a number and its unit.' : 'Type a number.';
  let s = tidy(unSub(raw));
  // "pH = 4", "[OH-] = 1 x 10^-5": a label is fine, but only the one asked for
  const lab = s.match(/^\s*(p\s*OH|p\s*H|\[\s*OH[^\]]{0,6}\]|\[\s*H[^\]]{0,6}\])\s*=?\s*(?=[\d.\-−])/i);
  if (lab) {
    const key = (t) => t.toLowerCase().replace(/\s+/g, '').replace(/^\[h3o.*$/, '[h]').replace(/^\[(oh|h)[^\]]*\]$/, '[$1]');
    if (G.label && key(lab[1]) !== key(G.label)) return { ok: false, why: `This asks for the ${G.label}, not the ${{ ph: 'pH', poh: 'pOH', '[h]': '[H⁺]', '[oh]': '[OH⁻]' }[key(lab[1])] || lab[1]}.` };
    s = s.slice(lab[0].length);
  }
  s = s.replace(LEAD_EQ, '').replace(/^10\s*\^/, '1 × 10^');
  const m = s.match(NUM_RE);
  if (!m || !/\d/.test(m[1])) return { ok: false, why: ask };
  let unitText = m[3].replace(/[.\s]+$/, '').trim();
  // "g H2O", "molecules of CO2", "g of water": the substance may follow the unit
  for (const f of G.subs || []) {
    const re = new RegExp(`\\s*(?:of\\s+)?${escRe(f)}$`, /[A-Z]/.test(f) ? '' : 'i');
    if (re.test(unitText) && unitText.replace(re, '').trim()) { unitText = unitText.replace(re, '').trim(); break; }
  }
  let t;
  try { t = typedNumber(m[1], m[2]); } catch { return { ok: false, why: ask }; }
  const right = numOk(G, t);
  let tip = '';
  if (G.unitKey) {
    if (!unitText) tip = `Remember the unit: ${q.unit}.`;
    else if (!unitOk(unitText, G.unitKey)) {
      return { ok: false, why: right ? `The number is right, but "${unitText}" is the wrong unit — this asks for ${q.unitName}.` : `Check the unit too — this asks for ${q.unitName}.` };
    }
  } else if (unitText) return { ok: false, why: right ? `The number is right, but this answer has no unit — leave off "${unitText}".` : '' };
  if (!right) {
    if (!G.exact && t.place > G.place && leR(absR(sub(G.truth, t.r)), scale10(R(5), t.place - 1))) return { ok: false, why: `Close — but give it to ${G.howText}.` };
    return { ok: false, why: '' };
  }
  return { ok: true, tip };
}

/* ------------------------------------------------ worked-solution pieces */
/** The boxed answer; a long one (a name, a configuration) may wrap on a phone. */
const ansBox = (...kids) => { const b = boxed(...kids); if (b.textContent.length > 18) b.classList.add('wrap'); return b; };
const ln = (...kids) => el('div', { class: 'ln' }, ...kids);
const lnF = (...kids) => el('div', { class: 'ln f' }, ...kids);
const formulaBox = (...rows) => el('div', { class: 'lab-formula' }, ...rows);
const richP = (s) => rich(s);
/** A table of working (atoms, moles, counts), scrolling sideways on a phone. */
function dataTable(head, rows, label) {
  const t = el('table', { class: 'lab-table' },
    el('thead', {}, el('tr', {}, ...head.map((h) => el('th', { scope: 'col' }, h)))),
    el('tbody', {}, ...rows.map((r) => el('tr', {}, ...r.map((c, i) => (i === 0 ? el('th', { scope: 'row' }, c) : el('td', {}, c)))))));
  if (label) t.setAttribute('aria-label', label);
  return scroller(t);
}
/** "= 1.38745… rounded to 3 significant figures is [1.39 g]", or just the answer when it is exact. */
function roundLine(a, answer) {
  if (a.exact || eqR(a.truth, a.stated)) return P('So the answer is ', ansBox(...rich(answer)), '.');
  const d = nextDigit(a.truth, a.place);
  return el('div', { class: 'lab-round' },
    P(...rich(longShow(a.truth)), ` to ${a.howText} is `, ansBox(...rich(answer)), '.'),
    note(`The next digit is ${d}, ${d >= 5 ? 'which is 5 or more, so the last digit rounds up' : 'which is less than 5, so the last digit stays the same'}.`));
}
/** The picket fence for a chemistry conversion. Amounts may be in scientific
    notation; units carry the substance ("g H₂O"). */
function chemFence(given, factors, final) {
  const g = { amt: supPow10(given.amt), unit: given.unit };
  const fs = factors.map((f) => ({ top: { amt: supPow10(f.top.amt), unit: f.top.unit }, bot: { amt: supPow10(f.bot.amt), unit: f.bot.unit } }));
  if (!final) return fenceNode(g, fs);
  const top = factors.reduce((v, f) => mul(v, f.top.r), given.r);
  const bot = factors.reduce((v, f) => mul(v, f.bot.r), R(1));
  return fenceNode(g, fs, { result: { top: `${supPow10(longShow(top))} ${factors[factors.length - 1].top.unit}`, bot: supPow10(longShow(bot)), ans: final.ans } });
}
const NA = R(602n * p10(21));
const NA_TXT = '6.02 × 10^23';
/** fence factors — { top: {amt, r, unit}, bot: {…} } */
const side2 = (amt, r, unit) => ({ amt, r, unit });
const fac = (top, bot) => ({ top, bot });
const mmFactor = (f, toGrams) => {
  const mm = molarMass(f);
  const g = side2(fx2(mm), mm, `g ${fm(f)}`), mol = side2('1', R(1), `mol ${fm(f)}`);
  return toGrams ? fac(g, mol) : fac(mol, g);
};
const naFactor = (f, word, toParticles) => {
  const n = side2(NA_TXT, NA, `${word} ${fm(f)}`), mol = side2('1', R(1), `mol ${fm(f)}`);
  return toParticles ? fac(n, mol) : fac(mol, n);
};
/** Multiply across the top, divide by the bottom — the fence's arithmetic in words. */
function fenceArith(given, factors) {
  const tops = [given.amt, ...factors.map((f) => f.top.amt)].filter((x) => x !== '1');
  const bots = factors.map((f) => f.bot.amt).filter((x) => x !== '1');
  const top = factors.reduce((v, f) => mul(v, f.top.r), given.r);
  const bot = factors.reduce((v, f) => mul(v, f.bot.r), R(1));
  const topTxt = tops.length > 1 ? `${tops.join(' × ')} = ${longShow(top)}` : tops.length ? tops[0] : '1';
  const q = longShow(div(top, bot));
  return P(...rich(`Top: ${topTxt}. Bottom: ${bots.length ? `${bots.length > 1 ? `${bots.join(' × ')} = ` : ''}${longShow(bot)}` : '1'}. Top ÷ bottom = ${q}${q.endsWith('…') ? '' : '.'}`));
}
/** Build a written question for the new units: the answer, how it is graded, the worked solution. */
function makeQ2(skill, o) {
  const q = makeQ(skill, o);
  if (o.gradeWith) {
    q.gradeWith = (raw) => o.gradeWith(q, raw);
    q.check = (raw) => q.gradeWith(raw).ok;
  }
  if (o.textWrong) q.textWrong = o.textWrong;
  if (o.sciKeys) q.sciKeys = true;
  if (o.extra) Object.assign(q, o.extra);
  return q;
}
/** A numeric question: answer string, grading, accepted typings, wrong options. */
function numQ(skill, o) {
  const a = o.a;
  const unit = o.unit || '';
  const answer = `${a.str}${unit ? (unit === '%' ? '%' : ` ${unit}`) : ''}`;
  const words = o.unitKey ? SPELL[o.unitKey].cs.concat(SPELL[o.unitKey].ci) : [];
  const nums = [a.str.replace(/,/g, '')];
  if (/×/.test(a.str)) nums.push(a.str.replace(' × 10^', 'e'), a.str.replace(' × ', ' x '));
  const accept = o.accept || acceptList(nums, words.slice(0, 3));
  const wrong = (o.wrong || []).map((w) => {
    const wa = numAns(w.r, o.how);
    if (o.fmt) wa.str = o.fmt(w.r);
    return { str: `${wa.str}${unit ? (unit === '%' ? '%' : ` ${unit}`) : ''}`, val: toNum(wa.stated), why: w.why };
  }).filter((w) => Number.isFinite(w.val) && w.val !== 0);
  return makeQ2(skill, {
    ...o, answer, accept, unit, unitName: o.unitName || unit,
    value: toNum(a.stated), wrong,
    grading: { label: o.label || '', unitKey: o.unitKey || '', exact: a.exact || null, stated: a.stated, truth: a.truth, place: a.place, howText: a.howText, subs: o.subs || [] },
    gradeWith: gradeNum,
  });
}

/* ------------------------------------------------ Unit 5: atomic structure */
// Mass numbers of real isotopes, the most common first.
const ISOTOPES = {
  H: [1, 2, 3], He: [4, 3], Li: [7, 6], Be: [9], B: [11, 10], C: [12, 13, 14], N: [14, 15], O: [16, 17, 18], F: [19], Ne: [20, 22, 21],
  Na: [23], Mg: [24, 25, 26], Al: [27], Si: [28, 29, 30], P: [31], S: [32, 34], Cl: [35, 37], Ar: [40, 36], K: [39, 41], Ca: [40, 44],
  Sc: [45], Ti: [48, 46], V: [51], Cr: [52, 53], Mn: [55], Fe: [56, 54], Co: [59, 60], Ni: [58, 60], Cu: [63, 65], Zn: [64, 66],
  Ga: [69, 71], Ge: [74, 72], As: [75], Se: [80, 78], Br: [79, 81], Kr: [84, 86], Rb: [85, 87], Sr: [88, 90], Ag: [107, 109],
  Sn: [120, 118], I: [127, 131], Xe: [132, 129], Ba: [138, 137], Au: [197], Hg: [202, 200], Pb: [208, 206],
};
// Charges of the common monatomic ions.
const ION_CHARGES = {
  H: [1], Li: [1], Be: [2], N: [-3], O: [-2], F: [-1], Na: [1], Mg: [2], Al: [3], P: [-3], S: [-2], Cl: [-1], K: [1], Ca: [2],
  Sc: [3], Cr: [3, 2], Mn: [2], Fe: [2, 3], Co: [2, 3], Ni: [2], Cu: [1, 2], Zn: [2], Ga: [3], Se: [-2], Br: [-1], Rb: [1], Sr: [2],
  Ag: [1], Sn: [2, 4], I: [-1], Ba: [2], Au: [1, 3], Hg: [2], Pb: [2, 4],
};
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const pneText = (p, n, e) => `${plural(p, 'proton')}, ${plural(n, 'neutron')}, ${plural(e, 'electron')}`;
/** "17, 18, 18", "p = 17, n = 18, e = 18", "17 protons 18 neutrons 18 electrons" → { p, n, e } */
function readPNE(raw) {
  // "34 p+ 44 n0 36 e-": the particle symbols' charge marks are labels, not
  // numbers. Read the input as typed first, so "p1 n0 e1" (hydrogen-1) still
  // means zero neutrons, and only then drop a 0 stuck to n.
  return readPNE1(raw) || readPNE1(String(raw).replace(/(?<![a-z])n0(?![\d.])/gi, 'n '));
}
function readPNE1(raw) {
  const s = String(raw).toLowerCase().replace(/[⁺⁻⁰]/g, ' ')
    .replace(/protons?/g, ' p ').replace(/neutrons?/g, ' n ').replace(/electrons?/g, ' e ');
  const toks = (s.match(/\d+|[a-z]+/g) || []).filter((t) => /^\d+$/.test(t) || /^[pne]$/.test(t));
  if (!toks.length) return null;
  const items = [];
  if (/^[pne]$/.test(toks[0])) {
    for (let i = 0; i < toks.length; i += 2) {
      if (!/^[pne]$/.test(toks[i]) || !/^\d+$/.test(toks[i + 1] || '')) return null;
      items.push({ v: Number(toks[i + 1]), lab: toks[i] });
    }
  } else {
    for (const t of toks) {
      if (/^\d+$/.test(t)) items.push({ v: Number(t), lab: null });
      else { const last = items[items.length - 1]; if (!last || last.lab) return null; last.lab = t; }
    }
  }
  if (items.length !== 3) return null;
  if (items.every((x) => x.lab)) {
    const by = Object.fromEntries(items.map((x) => [x.lab, x.v]));
    return by.p != null && by.n != null && by.e != null ? by : null;
  }
  if (items.some((x) => x.lab)) return null;
  return { p: items[0].v, n: items[1].v, e: items[2].v };
}
function gradePNE(q, raw) {
  const r = readPNE(raw);
  if (!r) return { ok: false, why: 'Type three numbers in order: protons, neutrons, electrons (like "p, n, e").' };
  const { p, n, e, A, c } = q.pne;
  if (r.p === p && r.n === n && r.e === e) return { ok: true };
  if (r.p === p && r.n === A) return { ok: false, why: 'The mass number counts protons and neutrons together, so neutrons = mass number − protons.' };
  if (r.p === p && r.n === n && c && r.e === p) return { ok: false, why: 'Protons and neutrons are right. The charge changes the electrons: + means electrons lost, − means electrons gained.' };
  if (r.p === p && r.n === n && c && r.e === p + c) return { ok: false, why: `Protons and neutrons are right, but the charge goes the other way: a ${c > 0 ? 'positive ion has lost' : 'negative ion has gained'} electrons.` };
  if (r.p === p && r.n === n) return { ok: false, why: 'Protons and neutrons are right — check the electrons.' };
  return { ok: false, why: '' };
}
function genPne(lvl) {
  const pool = Object.keys(ISOTOPES).filter((s) => (lvl === 1 ? ELEM[s].z <= 20 : lvl === 2 ? ELEM[s].z <= 38 : ELEM[s].z > 20));
  const sym = pick(pool);
  const E = ELEM[sym];
  let c = 0;
  if (lvl >= 2 && ION_CHARGES[sym] && chance(lvl === 2 ? .6 : .8)) c = pick(ION_CHARGES[sym]);
  const A = lvl === 1 && chance(.6) ? ISOTOPES[sym][0] : pick(ISOTOPES[sym]);
  const p = E.z, n = A - p, e = p - c;
  const label = `${supText(A)}${sym}${c ? chargeText(c) : ''}`;
  const named = !c && chance(.5);
  const prompt = named
    ? `How many protons, neutrons and electrons are in an atom of ${E.name}-${A}?`
    : `How many protons, neutrons and electrons are in ${c ? 'the ion' : 'an atom of'} ${label}?`;
  const answer = pneText(p, n, e);
  const eLine = c === 0
    ? 'A neutral atom has as many electrons as protons'
    : c > 0 ? `A charge of ${c}+ means ${plural(c, 'electron')} lost` : `A charge of ${-c}− means ${plural(-c, 'electron')} gained`;
  const work = (final) => {
    const kids = [
      P(`Protons = atomic number. ${cap1(E.name)} (${sym}) is element ${final ? E.z : 'number … (look it up on the periodic table)'}${final ? `, so ${plural(p, 'proton')}` : ''}.`),
      P(`Neutrons = mass number − protons = ${A} − ${final ? `${p} = ${n}` : 'protons'}.`),
      P(`Electrons: ${eLine}${final ? `: ${c === 0 ? `${p}` : c > 0 ? `${p} − ${c} = ${e}` : `${p} + ${-c} = ${e}`}` : ''}.`),
    ];
    if (final) kids.push(P('So: ', ansBox(answer), '.'));
    else kids.push(note(named ? `The number after the name (${E.name}-${A}) is the mass number.` : `The small number in front (${supText(A)}) is the mass number${c ? ', and the one after the symbol is the charge' : ''}.`));
    return el('div', { class: 'lab-work' }, ...kids);
  };
  const cands = [
    { t: [p, n, p], why: 'ignored the charge' },
    { t: [p, n, p + c], why: 'moved the electrons the wrong way for the charge' },
    { t: [p, A, e], why: 'used the mass number for the neutrons' },
    { t: [n, p, e], why: 'swapped protons and neutrons' },
    { t: [p, A - e, e], why: 'subtracted electrons instead of protons' },
    { t: [A, n, e], why: 'used the mass number for the protons' },
    { t: [p, n, n], why: 'matched electrons to neutrons' },
    { t: [p, n + 1, e], why: 'miscounted the neutrons' },
  ];
  const textWrong = cands.filter((w) => w.t.every((x) => x >= 0)).map((w) => ({ str: pneText(...w.t), why: w.why }));
  return makeQ2('pne', {
    level: lvl, prompt, answer,
    note: 'Type three numbers in this order: protons, neutrons, electrons.',
    accept: [`${p}, ${n}, ${e}`, `${p} ${n} ${e}`, `p = ${p}, n = ${n}, e = ${e}`, `${p}p ${n}n ${e}e`],
    value: p,
    brief: `Protons = atomic number = ${p}; neutrons = ${A} − ${p} = ${n}; electrons = ${c === 0 ? p : c > 0 ? `${p} − ${c}` : `${p} + ${-c}`} = ${e}.`,
    textWrong, work, gradeWith: gradePNE, extra: { pne: { p, n, e, A, c } },
  });
}

// Real isotope data: [mass in amu, percent abundance]
const REAL_ISO = [
  { el: 'Cl', iso: [['34.969', '75.78'], ['36.966', '24.22']] },
  { el: 'Cu', iso: [['62.930', '69.15'], ['64.928', '30.85']] },
  { el: 'B', iso: [['10.013', '19.9'], ['11.009', '80.1']] },
  { el: 'Br', iso: [['78.918', '50.69'], ['80.916', '49.31']] },
  { el: 'Ga', iso: [['68.926', '60.11'], ['70.925', '39.89']] },
  { el: 'Li', iso: [['6.015', '7.59'], ['7.016', '92.41']] },
  { el: 'Ag', iso: [['106.905', '51.84'], ['108.905', '48.16']] },
  { el: 'Rb', iso: [['84.912', '72.17'], ['86.909', '27.83']] },
  { el: 'N', iso: [['14.003', '99.63'], ['15.000', '0.37']] },
  { el: 'Mg', iso: [['23.985', '78.99'], ['24.986', '10.00'], ['25.983', '11.01']] },
  { el: 'Si', iso: [['27.977', '92.23'], ['28.976', '4.68'], ['29.974', '3.09']] },
  { el: 'Ne', iso: [['19.992', '90.48'], ['20.994', '0.27'], ['21.991', '9.25']] },
  { el: 'K', iso: [['38.964', '93.26'], ['39.964', '0.01'], ['40.962', '6.73']] },
];
function genAvgMass(lvl) {
  let who, iso;
  if (lvl === 1 || (lvl === 3 && chance(.35))) {
    const n = lvl === 1 ? 2 : 3;
    const masses = [ri(10, 120)];
    while (masses.length < n) masses.push(masses[masses.length - 1] + ri(1, 2));
    // abundances in whole percents (Warm-up) or tenths of a percent, adding up to 100
    const unit = lvl === 1 ? 100 : 1000;
    const parts = [];
    let left = unit;
    for (let i = 0; i < n - 1; i++) { const x = ri(unit / 20, left - (unit / 20) * (n - 1 - i)); parts.push(x); left -= x; }
    parts.push(left);
    who = 'Element X';
    iso = masses.map((m, i) => [String(m), lvl === 1 ? String(parts[i]) : placePoint(B(parts[i]), 1, false)]);
  } else {
    const d = pick(REAL_ISO.filter((x) => (lvl === 2 ? x.iso.length === 2 : x.iso.length === 3 || chance(.3))));
    who = cap1(ELEM[d.el].name);
    iso = d.iso;
  }
  const dec = (a) => div(D(a), R(100));
  const prods = iso.map(([m, a]) => mul(D(m), dec(a)));
  const truth = prods.reduce(add, R(0));
  const a = numAns(truth, { dp: 2 });
  const words = ['two', 'three'][iso.length - 2];
  const prompt = `${who} has ${words} isotopes: ${listJoin(iso.map(([m, x]) => `${m} amu (${x}%)`))}. What is its average atomic mass?`;
  const answer = `${a.str} amu`;
  const sumLine = iso.map(([m, x]) => `(${m} × ${fx(dec(x))})`).join(' + ');
  const work = (final) => el('div', { class: 'lab-work' },
    P('Change each percent to a decimal (divide by 100), multiply it by that isotope\'s mass, then add the results.'),
    formulaBox(
      lnF('average = Σ (mass × abundance)'),
      ln(`= ${sumLine}`),
      final ? ln(`= ${prods.map((x) => fx(x)).join(' + ')}`) : ln('= ?'),
      final ? ln(...rich(`= ${longShow(truth, 9)}`)) : null),
    final ? roundLine(a, answer) : note('The answer should land between the lightest and heaviest isotope, closest to the most common one.'));
  const most = iso.reduce((b, x) => (Number(x[1]) > Number(b[1]) ? x : b), iso[0]);
  const wrong = [
    { r: div(iso.reduce((s, [m]) => add(s, D(m)), R(0)), R(iso.length)), why: 'averaged the masses without weighting them' },
    { r: mul(truth, R(100)), why: 'forgot to change the percents to decimals' },
    { r: D(most[0]), why: 'used only the most common isotope' },
  ];
  if (iso.length === 2) wrong.push({ r: add(mul(D(iso[0][0]), dec(iso[1][1])), mul(D(iso[1][0]), dec(iso[0][1]))), why: 'paired each mass with the other isotope\'s abundance' });
  return numQ('avgmass', {
    level: lvl, prompt, a, how: { dp: 2 }, unit: 'amu', unitKey: 'amu', unitName: 'amu (atomic mass units)',
    note: 'Round to two decimal places.',
    brief: `${sumLine} = ${longShow(truth, 9)} ≈ ${answer}`,
    wrong, work,
  });
}

/* ------------------------------------------------ Unit 6: electrons */
const FILL = [['1s', 2], ['2s', 2], ['2p', 6], ['3s', 2], ['3p', 6], ['4s', 2], ['3d', 10], ['4p', 6], ['5s', 2], ['4d', 10], ['5p', 6], ['6s', 2], ['4f', 14], ['5d', 10], ['6p', 6]];
const CAP = { s: 2, p: 6, d: 10, f: 14 };
function configOf(z) {
  const out = [];
  let left = z;
  for (const [s, cap] of FILL) { if (!left) break; const k = Math.min(cap, left); out.push([s, k]); left -= k; }
  return out;
}
const shellOrder = (cfg) => cfg.slice().sort((a, b) => Number(a[0][0]) - Number(b[0][0]) || 'spdf'.indexOf(a[0][1]) - 'spdf'.indexOf(b[0][1]));
const cfgPretty = (cfg) => cfg.map(([s, k]) => `${s}${supText(k)}`).join(' ');
const cfgPlain = (cfg) => cfg.map(([s, k]) => `${s}${k}`).join(' ');
const cfgKey = (cfg) => cfg.map(([s, k]) => `${s}${k}`).join(' ');
const NOBLE = { 2: 'He', 10: 'Ne', 18: 'Ar', 36: 'Kr', 54: 'Xe' };
function shorthandOf(z) {
  const core = Math.max(...Object.keys(NOBLE).map(Number).filter((g) => g < z));
  return { core, rest: configOf(z).slice(configOf(core).length) };
}
/** "1s2 2s2 2p6", "1s²2s²2p⁶", "1s^2 2s^2" (or run together) → [['1s', 2], …] */
function readConfig(raw) {
  const s = tidy(String(raw)).replace(/\^/g, '').replace(/[,;]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  if (/\[/.test(s)) return { core: true };
  const parse = (i) => {
    while (s[i] === ' ') i++;
    if (i >= s.length) return [];
    const m = /^([1-7])([spdf])/.exec(s.slice(i));
    if (!m) return null;
    const j = i + 2;
    for (const len of [2, 1]) {
      const d = s.slice(j, j + len);
      if (d.length !== len || !/^\d+$/.test(d) || Number(d) > 14) continue;
      const rest = parse(j + len);
      if (rest) return [[m[1] + m[2], Number(d)], ...rest];
    }
    return null;
  };
  return parse(0);
}
function gradeConfig(q, raw) {
  const r = readConfig(raw);
  if (r && r.core) return { ok: false, why: 'Write it out in full — this asks for every sublevel, not the noble-gas shorthand.' };
  if (!r || !r.length) return { ok: false, why: 'Write each sublevel as its number, letter and electrons: 1s2 2s2 2p6 …' };
  const want = q.cfg;
  if (cfgKey(r) === cfgKey(want) || cfgKey(r) === cfgKey(shellOrder(want))) return { ok: true };
  const total = r.reduce((t, [, k]) => t + k, 0);
  const over = r.find(([s, k]) => k > CAP[s[1]]);
  if (over) return { ok: false, why: `A ${over[0][1]} sublevel holds at most ${CAP[over[0][1]]} electrons.` };
  if (total !== q.z) return { ok: false, why: `That places ${total} electrons, but ${q.elName} has ${q.z}.` };
  if (cfgKey(shellOrder(r)) === cfgKey(shellOrder(want))) return { ok: false, why: 'Right sublevels, but write them in filling order (1s 2s 2p 3s 3p 4s 3d …).' };
  return { ok: false, why: 'Fill the sublevels in order, filling each one before starting the next.' };
}
function genConfig(lvl) {
  const pool = [];
  for (let z = lvl === 1 ? 1 : lvl === 2 ? 11 : 21; z <= (lvl === 1 ? 10 : lvl === 2 ? 20 : 36); z++) if (z !== 24 && z !== 29) pool.push(z);
  const z = pick(pool);
  const E = BY_Z[z];
  const cfg = configOf(z);
  const answer = cfgPretty(cfg);
  const plainA = cfgPlain(cfg);
  const accept = [plainA, cfg.map(([s, k]) => `${s}^${k}`).join(' ')];
  if (cfgKey(shellOrder(cfg)) !== cfgKey(cfg)) accept.push(cfgPlain(shellOrder(cfg)));
  let run = 0;
  const steps = cfg.map(([s, k]) => { run += k; return { s, k, run }; });
  const work = (final) => {
    const kids = [P(`${cap1(E.name)} has ${z} electrons (its atomic number). Fill the sublevels in order — s holds 2, p holds 6, d holds 10 — until all ${z} are placed.`)];
    if (final) {
      kids.push(el('ol', { class: 'lab-fill', 'aria-label': 'Sublevels in filling order, with the running total' },
        ...steps.map((x) => el('li', {}, el('b', {}, x.s, el('sup', {}, String(x.k))), el('small', {}, `${x.run}`)))));
      if (z > 20) kids.push(note('4s fills before 3d: it is lower in energy, even though its shell number is higher.'));
      kids.push(P('So: ', ansBox(answer)));
    } else {
      const need = FILL.slice(0, cfg.length + 1);
      kids.push(el('ol', { class: 'lab-fill', 'aria-label': 'The filling order, with how many each sublevel holds' },
        ...need.map(([s, cap]) => el('li', {}, el('b', {}, s), el('small', {}, `holds ${cap}`)))));
      kids.push(note(`Keep a running total, and stop when it reaches ${z}: the last sublevel may be only partly full.`));
    }
    return el('div', { class: 'lab-work' }, ...kids);
  };
  const last = cfg.length - 1;
  const tweak = (i, dk) => cfg.map(([s, k], j) => [s, j === i ? k + dk : k]).filter(([, k]) => k > 0);
  const cands = [
    { c: tweak(last, 1), why: 'one electron too many' },
    { c: tweak(last, -1), why: 'one electron too few' },
  ];
  const sIdx = cfg.findIndex(([s]) => s === '4s'), dIdx = cfg.findIndex(([s]) => s === '3d');
  if (sIdx >= 0 && dIdx >= 0) {
    cands.push({ c: cfg.filter(([s]) => s !== '4s').map(([s, k]) => [s, s === '3d' ? Math.min(10, k + 2) : k]), why: 'put the 4s electrons in 3d' });
    cands.push({ c: cfg.map(([s, k]) => [s === '3d' ? '4d' : s, k]), why: 'wrote 4d instead of 3d' });
  }
  if (cfg.length >= 3) cands.push({ c: [...cfg.slice(0, last - 1), [cfg[last - 1][0], cfg[last - 1][1] + cfg[last][1]]], why: 'overfilled a sublevel' });
  if (sIdx >= 0 && dIdx < 0 && z >= 19) cands.push({ c: cfg.map(([s, k]) => [s === '4s' ? '3d' : s, k]), why: 'put 3d before 4s' });
  const textWrong = cands.map((w) => ({ str: cfgPretty(w.c), plain: cfgPlain(w.c), why: w.why }));
  return makeQ2('config', {
    level: lvl, prompt: `Write the electron configuration of ${E.name} (${E.sym}).`,
    note: 'Write it in full, not the noble-gas shorthand. Superscripts can be typed as plain numbers: 2p6.',
    answer, accept, value: z,
    brief: `${z} electrons, filling 1s 2s 2p 3s 3p 4s 3d 4p in order: ${answer}.`,
    textWrong, work, gradeWith: gradeConfig, extra: { cfg, z, elName: E.name },
  });
}

const MAIN_GROUP = { H: 1, He: 18, Li: 1, Be: 2, B: 13, C: 14, N: 15, O: 16, F: 17, Ne: 18, Na: 1, Mg: 2, Al: 13, Si: 14, P: 15, S: 16, Cl: 17, Ar: 18, K: 1, Ca: 2, Ga: 13, Ge: 14, As: 15, Se: 16, Br: 17, Kr: 18, Rb: 1, Sr: 2, Sn: 14, I: 17, Xe: 18, Ba: 2, Pb: 14 };
const valenceOf = (sym) => (sym === 'He' ? 2 : MAIN_GROUP[sym] <= 2 ? MAIN_GROUP[sym] : MAIN_GROUP[sym] - 10);
const periodOf = (z) => Math.max(...configOf(z).map(([s]) => Number(s[0])));
function genValence(lvl) {
  const pool = Object.keys(MAIN_GROUP).filter((s) => (lvl === 1 ? ELEM[s].z <= 20 : lvl === 2 ? ELEM[s].z <= 38 : ELEM[s].z > 10));
  const sym = pick(pool);
  const E = ELEM[sym], g = MAIN_GROUP[sym], v = valenceOf(sym), per = periodOf(E.z);
  const a = numAns(R(v), { exact: true });
  const sh = E.z > 2 ? shorthandOf(E.z) : { core: 0, rest: configOf(E.z) };
  const outer = sh.rest.filter(([s]) => Number(s[0]) === per);
  const shText = `${sh.core ? `[${NOBLE[sh.core]}] ` : ''}${cfgPretty(sh.rest)}`;
  const work = (final) => {
    const kids = [];
    // before the answer, point to the group without naming it: for groups 1
    // and 2 the group number is the answer
    if (sym === 'He') kids.push(P(final ? 'Helium sits in group 18 but has only 2 electrons (1s²) — both are valence electrons.' : 'Helium is the exception in group 18: it has only one shell, so every electron it has is a valence electron. How many electrons does it have?'));
    else if (!final) kids.push(P(`Find ${E.name}'s group on the periodic table. Groups 1 and 2 have as many valence electrons as the group number; for groups 13–18, valence electrons = group number − 10.`));
    else if (g <= 2) kids.push(P(`${cap1(E.name)} is in group ${g}: groups 1 and 2 have ${v} valence electron${v === 1 ? '' : 's'}.`));
    else kids.push(P(`${cap1(E.name)} is in group ${g}: for groups 13–18, valence electrons = group number − 10 = ${g} − 10 = ${v}.`));
    if (final) {
      kids.push(P(`Check with the electron configuration, ${shText}: the outermost shell is n = ${per}, holding ${outer.map(([s, k]) => `${s}${supText(k)}`).join(' + ')} = ${v}.`));
      if (outer.length < sh.rest.length && sh.rest.some(([s]) => s[1] === 'd' || s[1] === 'f')) kids.push(note('Filled d and f sublevels are not in the outermost shell, so they don\'t count.'));
      kids.push(P('So: ', ansBox(`${v}`), ' valence electrons.'));
    } else kids.push(note('Valence electrons are the ones in the outermost shell (the highest n).'));
    return el('div', { class: 'lab-work' }, ...kids);
  };
  const wrong = [
    g >= 13 && sym !== 'He' ? { r: R(g), why: 'used the group number without subtracting 10' } : null,
    { r: R(per), why: 'used the period number' },
    { r: R(E.z), why: 'used the atomic number' },
    v < 8 && v !== 4 ? { r: R(8 - v), why: 'counted the electrons needed to fill the shell' } : null,
    sym === 'He' ? { r: R(8), why: 'gave helium a full octet' } : null,
    { r: R(v + 2), why: 'counted the wrong sublevels' },
  ].filter(Boolean);
  return numQ('valence', {
    level: lvl, prompt: `How many valence electrons does an atom of ${E.name} (${sym}) have?`,
    a, how: { exact: true }, unit: '', unitKey: 've', unitName: 'valence electrons',
    accept: [`${v}`, `${v} valence electrons`, `${v} electrons`],
    brief: sym === 'He' ? 'Helium has 2 valence electrons (1s²).' : g <= 2 ? `Group ${g}: ${v} valence electron${v === 1 ? '' : 's'}.` : `Group ${g}: ${g} − 10 = ${v} valence electrons.`,
    wrong, work,
  });
}
function genNoble(lvl) {
  const pool = [];
  for (let z = lvl === 1 ? 3 : lvl === 2 ? 11 : 19; z <= (lvl === 1 ? 20 : lvl === 2 ? 36 : 38); z++) if (z !== 24 && z !== 29) pool.push(z);
  const z = pick(pool);
  const E = BY_Z[z];
  const { core, rest } = shorthandOf(z);
  const show = (c, r) => `[${NOBLE[c]}] ${cfgPretty(r)}`;
  const answer = show(core, rest);
  const cores = Object.keys(NOBLE).map(Number);
  const prev = cores.filter((c) => c < core).pop();
  const nextCore = cores.find((c) => c > core);
  const last = rest.length - 1;
  const cands = [];
  if (prev) cands.push({ str: show(prev, rest), why: 'used the wrong noble gas (the electrons don\'t add up)' });
  if (nextCore) cands.push({ str: show(nextCore, rest), why: 'used the noble gas after the element instead of before it' });
  cands.push({ str: show(core, rest.map(([s, k], j) => [s, j === last ? k + 1 : k])), why: 'one electron too many' });
  if (rest[last][1] > 1) cands.push({ str: show(core, rest.map(([s, k], j) => [s, j === last ? k - 1 : k])), why: 'one electron too few' });
  else if (rest.length > 1) cands.push({ str: show(core, rest.slice(0, last)), why: 'left out the last electron' });
  const d = rest.findIndex(([s]) => s[1] === 'd');
  if (d >= 0) {
    cands.push({ str: show(core, rest.map(([s, k]) => [s[1] === 'd' ? `${Number(s[0]) + 1}d` : s, k])), why: 'the d sublevel is one shell behind (3d, not 4d)' });
    const s4 = rest.find(([s]) => s[1] === 's');
    if (s4 && rest[d][1] + s4[1] <= 10) cands.push({ str: show(core, rest.filter(([s]) => s[1] !== 's').map(([s, k]) => [s, s[1] === 'd' ? k + s4[1] : k])), why: 'put the s electrons in the d sublevel' });
  }
  if (d < 0) cands.push({ str: show(core, rest.map(([s, k]) => [`${Number(s[0]) - 1}${s[1]}`, k])), why: 'used the noble gas\'s shell number for the next sublevels' });
  const picked = uniqBy(shuffle(cands.filter((c) => c.str !== answer)), (c) => c.str).slice(0, 3);
  const work = (final) => {
    const kids = [
      P(`${cap1(E.name)} has ${z} electrons. The noble gas before it is ${final ? `${BY_Z[core].name} (${NOBLE[core]}), with ${core}` : '…'}: its symbol in brackets stands for all of those electrons.`),
    ];
    if (final) {
      kids.push(P(`That leaves ${z} − ${core} = ${z - core} electrons, filled in order after ${NOBLE[core]}: ${cfgPretty(rest)}.`));
      kids.push(P('So: ', ansBox(answer)));
    } else kids.push(note('Find the last noble gas before the element, then fill the electrons that are left in order (…4s, 3d, 4p…).'));
    return el('div', { class: 'lab-work' }, ...kids);
  };
  return makeQ2('noble', {
    level: lvl, type: 'mc', prompt: `Which is the noble-gas shorthand electron configuration of ${E.name} (${E.sym})?`,
    answer, options: shuffle([answer, ...picked.map((c) => c.str)]), value: z,
    brief: `${NOBLE[core]} holds ${core} electrons; the other ${z - core} go in ${cfgPretty(rest)}: ${answer}.`,
    work, extra: { mistakes: picked.map((c) => ({ option: c.str, why: c.why })) },
  });
}

/* ------------------------------------------------ Unit 8: naming and formulas */
const CATIONS = [
  { f: 'Li', name: 'lithium', c: 1 }, { f: 'Na', name: 'sodium', c: 1 }, { f: 'K', name: 'potassium', c: 1 }, { f: 'Rb', name: 'rubidium', c: 1 },
  { f: 'Mg', name: 'magnesium', c: 2 }, { f: 'Ca', name: 'calcium', c: 2 }, { f: 'Sr', name: 'strontium', c: 2 }, { f: 'Ba', name: 'barium', c: 2 },
  { f: 'Al', name: 'aluminum', c: 3 }, { f: 'Zn', name: 'zinc', c: 2 }, { f: 'Ag', name: 'silver', c: 1 },
  { f: 'NH4', name: 'ammonium', c: 1, poly: true },
];
// Metals with more than one common charge: the name carries it as a Roman numeral.
const MULTI = [
  { f: 'Fe', name: 'iron', cs: [2, 3] }, { f: 'Cu', name: 'copper', cs: [1, 2] }, { f: 'Pb', name: 'lead', cs: [2, 4] },
  { f: 'Sn', name: 'tin', cs: [2, 4] }, { f: 'Co', name: 'cobalt', cs: [2, 3] }, { f: 'Cr', name: 'chromium', cs: [2, 3] },
  { f: 'Au', name: 'gold', cs: [1, 3] },
];
const ANIONS = [
  { f: 'F', name: 'fluoride', c: -1 }, { f: 'Cl', name: 'chloride', c: -1 }, { f: 'Br', name: 'bromide', c: -1 }, { f: 'I', name: 'iodide', c: -1 },
  { f: 'O', name: 'oxide', c: -2 }, { f: 'S', name: 'sulfide', c: -2 }, { f: 'N', name: 'nitride', c: -3 }, { f: 'P', name: 'phosphide', c: -3 },
  { f: 'NO3', name: 'nitrate', c: -1, poly: true }, { f: 'NO2', name: 'nitrite', c: -1, poly: true },
  { f: 'SO4', name: 'sulfate', c: -2, poly: true }, { f: 'SO3', name: 'sulfite', c: -2, poly: true },
  { f: 'CO3', name: 'carbonate', c: -2, poly: true }, { f: 'HCO3', name: 'hydrogen carbonate', c: -1, poly: true },
  { f: 'PO4', name: 'phosphate', c: -3, poly: true }, { f: 'OH', name: 'hydroxide', c: -1, poly: true },
  { f: 'C2H3O2', name: 'acetate', c: -1, poly: true, alt: 'CH3COO' }, { f: 'MnO4', name: 'permanganate', c: -1, poly: true },
  { f: 'CrO4', name: 'chromate', c: -2, poly: true }, { f: 'Cr2O7', name: 'dichromate', c: -2, poly: true },
  { f: 'CN', name: 'cyanide', c: -1, poly: true }, { f: 'O2', name: 'peroxide', c: -2, poly: true },
  { f: 'ClO3', name: 'chlorate', c: -1, poly: true },
];
const ANION_BY = Object.fromEntries(ANIONS.map((a) => [a.name, a]));
// the same element with a different ending: the classic -ide / -ite / -ate mix-up
const ENDING_SWAP = { nitrate: ['nitrite', 'nitride'], nitrite: ['nitrate'], sulfate: ['sulfite', 'sulfide'], sulfite: ['sulfate', 'sulfide'], sulfide: ['sulfate', 'sulfite'], chloride: ['chlorate'], chlorate: ['chloride'], phosphate: ['phosphide'], phosphide: ['phosphate'], nitride: ['nitrate', 'nitrite'], chromate: ['dichromate'], dichromate: ['chromate'], oxide: ['peroxide'], peroxide: ['oxide'] };
const GROUP12 = ['Li', 'Na', 'K', 'Rb', 'Mg', 'Ca', 'Sr', 'Ba'];
function pairOk(cat, an) {
  if (an.f === 'O2') return GROUP12.includes(cat.f);            // peroxides of groups 1 and 2 only (PbO₂ is lead(IV) oxide)
  if (cat.f === 'NH4' && ['O', 'N', 'P'].includes(an.f)) return false;
  if (cat.f === 'Cr' && ['CrO4', 'Cr2O7', 'MnO4'].includes(an.f)) return false;
  // leave out pairings no textbook would show: tin(IV) and lead(IV) and gold
  // with oxoanions (tin(IV) permanganate, gold(III) sulfite …), cobalt(III)
  // with the oxidisable or fragile ones
  if (cat.multi && (cat.c === 4 || cat.f === 'Au') && an.poly && an.f !== 'CN') return false;
  if (cat.f === 'Co' && cat.c === 3 && ['NO2', 'SO3', 'HCO3', 'CO3', 'C2H3O2', 'CN', 'MnO4', 'CrO4', 'Cr2O7', 'ClO3'].includes(an.f)) return false;
  return true;
}
const ionPart = (ion, n, f = ion.f) => (n === 1 ? f : ion.poly ? `(${f})${n}` : `${f}${n}`);
function ionic(cat, an) {
  const a = cat.c, b = -an.c;
  const L = (a * b) / gcdN(a, b);
  const nc = L / a, na = L / b;
  const formula = ionPart(cat, nc) + ionPart(an, na);
  const formulas = [formula];
  if (an.alt) formulas.push(ionPart(cat, nc) + ionPart(an, na, an.alt));
  const catName = `${cat.name}${cat.multi ? `(${ROMAN[a]})` : ''}`;
  return { kind: cat.multi ? 'tm' : cat.poly || an.poly ? 'poly' : 'binary', formula, formulas, name: `${catName} ${an.name}`, names: [`${catName} ${an.name}`], cat, an, nc, na, catName };
}
const MOLECULAR = ['CO', 'CO2', 'N2O', 'NO', 'NO2', 'N2O3', 'N2O4', 'N2O5', 'SO2', 'SO3', 'CCl4', 'CBr4', 'CS2', 'PCl3', 'PCl5', 'PBr3', 'P2O5', 'P4O10', 'P4S3', 'SF6', 'SCl2', 'S2Cl2', 'SiO2', 'SiCl4', 'SiF4', 'NF3', 'NCl3', 'BF3', 'BCl3', 'OF2', 'Cl2O', 'Cl2O7', 'ClF3', 'BrF3', 'BrF5', 'ICl', 'IF5', 'IF7', 'SeO2', 'As2O3', 'As2O5', 'B2H6'];
const IDE = { O: 'oxide', S: 'sulfide', N: 'nitride', P: 'phosphide', F: 'fluoride', Cl: 'chloride', Br: 'bromide', I: 'iodide', H: 'hydride' };
const PREFIX_N = ['', 'mono', 'di', 'tri', 'tetra', 'penta', 'hexa', 'hepta', 'octa', 'nona', 'deca'];
/** "mono" + "oxide" → "monoxide"; the unshortened spelling is accepted too. */
const withPrefix = (n, root, elide = true) => {
  const pre = PREFIX_N[n];
  return elide && /^o/.test(root) && /[ao]$/.test(pre) ? pre.slice(0, -1) + root : pre + root;
};
function molecular(formula) {
  const m = formula.match(/^([A-Z][a-z]?)(\d*)([A-Z][a-z]?)(\d*)$/);
  const x = m[1], nx = Number(m[2] || 1), y = m[3], ny = Number(m[4] || 1);
  const first = `${nx > 1 ? PREFIX_N[nx] : ''}${ELEM[x].name}`;
  const names = [...new Set([`${first} ${withPrefix(ny, IDE[y])}`, `${first} ${withPrefix(ny, IDE[y], false)}`])];
  return { kind: 'cov', formula, formulas: [formula], name: names[0], names, x, nx, y, ny };
}
function pickCompound(lvl) {
  const kinds = lvl === 1 ? ['binary', 'binary', 'binary', 'cov', 'cov'] : lvl === 2 ? ['poly', 'poly', 'poly', 'binary', 'cov', 'cov'] : ['tm', 'tm', 'tm', 'poly', 'cov'];
  const kind = pick(kinds);
  if (kind === 'cov') return molecular(pick(lvl === 1 ? MOLECULAR.filter((f) => !/\d{2}/.test(f) && f.length <= 4) : MOLECULAR));
  for (let tries = 0; tries < 200; tries++) {
    let cat, an;
    if (kind === 'binary') { cat = pick(CATIONS.filter((c) => !c.poly)); an = pick(ANIONS.filter((a) => !a.poly)); }
    else if (kind === 'poly') {
      if (chance(.2)) { cat = CATIONS.find((c) => c.poly); an = pick(ANIONS); } else { cat = pick(CATIONS); an = pick(ANIONS.filter((a) => a.poly)); }
    } else {
      const mt = pick(MULTI);
      const c = pick(mt.cs);
      cat = { f: mt.f, name: mt.name, c, multi: mt, other: mt.cs.find((x) => x !== c) };
      an = pick(ANIONS);
    }
    if (pairOk(cat, an)) return ionic(cat, an);
  }
  return ionic(CATIONS[1], ANIONS[1]);
}
/* grading formulas: capital letters matter (Co is cobalt, CO carbon monoxide) */
const normFormula = (s) => unSub(String(s)).replace(/\s+/g, '').replace(/\.+$/, '').replace(/[[{]/g, '(').replace(/[\]}]/g, ')');
function gradeFormula(q, raw) {
  const t = normFormula(raw);
  if (!t) return { ok: false, why: 'Type the formula.' };
  const want = q.cmp.formulas;
  if (want.includes(t)) return { ok: true };
  if (want.some((f) => f.toLowerCase() === t.toLowerCase())) return { ok: false, why: 'Check the capital letters: every element symbol starts with a capital, and a second letter is small (Co is cobalt, but CO is carbon monoxide).' };
  let same = false;
  try { same = sameAtoms(atomsOf(t), atomsOf(q.cmp.formula)); } catch { /* not a formula */ }
  if (same) {
    return { ok: false, why: /\(/.test(t) && !/\(/.test(q.cmp.formula)
      ? 'Right atoms, but brackets only go around a polyatomic ion when there is more than one of it.'
      : 'Right atoms, but written differently: the cation goes first, and a polyatomic ion keeps its own formula — in brackets when there are two or more of it.' };
  }
  if (q.cmp.kind !== 'cov') {
    try {
      const at = atomsOf(t);
      if (Object.keys(at).length && q.cmp.kind === 'tm' && at[q.cmp.cat.f]) return { ok: false, why: `The Roman numeral gives the charge: ${q.cmp.catName} is ${q.cmp.cat.f}${chargeText(q.cmp.cat.c)}. Balance that against ${fm(q.cmp.an.f)}${chargeText(q.cmp.an.c)}.` };
    } catch { /* not a formula */ }
  }
  return { ok: false, why: '' };
}
/* grading names: capitals and spacing don't matter; spelling and numerals do */
function normName(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[.!]+$/, '').replace(/sulph/g, 'sulf').replace(/aluminium/g, 'aluminum')
    .replace(/\bbicarbonate\b/g, 'hydrogen carbonate').replace(/hydrogencarbonate/g, 'hydrogen carbonate').replace(/\bethanoate\b/g, 'acetate')
    .replace(/\s*\(\s*/g, '(').replace(/\s*\)\s*/g, ') ').replace(/\s+/g, ' ').trim()
    .replace(/\b([a-z]+) (iv|v?i{1,3}|v)\b(?= [a-z])/g, '$1($2)');
}
function gradeName(q, raw) {
  const t = normName(raw);
  if (!t) return { ok: false, why: 'Type the name.' };
  if (q.cmp.names.map(normName).includes(t)) return { ok: true };
  const c = q.cmp;
  if (c.kind === 'tm' && t.startsWith(c.cat.name) && !/\(/.test(t)) return { ok: false, why: `${cap1(c.cat.name)} can form more than one ion, so the name needs a Roman numeral for its charge.` };
  if (c.kind === 'tm' && /\(\d\)/.test(t)) return { ok: false, why: 'Write the charge as a Roman numeral, like (II) or (III).' };
  if (c.kind !== 'cov' && c.kind !== 'tm' && /\(/.test(t)) return { ok: false, why: `${cap1(c.cat.name)} only forms one ion, so there's no Roman numeral.` };
  if (c.kind !== 'cov' && /\b(mono|di|tri|tetra|penta|hexa)[a-z]/.test(t)) return { ok: false, why: 'Ionic compounds don\'t use prefixes: the charges already fix how many of each ion.' };
  if (c.kind === 'cov' && t.startsWith('mono')) return { ok: false, why: '"Mono" is left off the first element.' };
  if (c.kind === 'cov' && !/(mon|di|tri|tetr|pent|hex|hept|oct|non|dec)/.test(t)) return { ok: false, why: 'Molecular compounds use prefixes (mono-, di-, tri-, …) for how many of each atom.' };
  return { ok: false, why: '' };
}
function ionicWork(c, final, toFormula) {
  const catIon = `${fm(c.cat.f)}${chargeText(c.cat.c)}`, anIon = `${fm(c.an.f)}${chargeText(c.an.c)}`;
  const kids = [];
  if (toFormula) {
    kids.push(P(c.kind === 'tm'
      ? `The Roman numeral gives the metal's charge: ${c.catName} is ${catIon}.`
      : `${cap1(c.cat.name)} is ${catIon}${c.cat.poly ? ' (a polyatomic ion)' : ''}.`),
    P(`${cap1(c.an.name)} is ${anIon}${c.an.poly ? ' (a polyatomic ion)' : ''}.`));
  } else {
    // before the answer, name neither ion: which ions, and the anion's charge, is the method
    kids.push(P(`${fm(c.formula)} is made of ${c.cat.poly ? 'the polyatomic ion ' : ''}${fm(c.cat.f)} and ${c.an.poly ? 'the polyatomic ion ' : ''}${fm(c.an.f)}: ${final ? `${c.an.name} is ` : 'the anion is '}${anIon}.`));
    if (c.kind === 'tm') {
      kids.push(P(`${cap1(c.cat.name)} can have more than one charge, so work it out from the anion: ${c.na} × (${pretty(String(c.an.c))}) = ${pretty(String(c.na * c.an.c))}${final ? `, shared by ${c.nc} ${c.cat.f} ion${c.nc === 1 ? '' : 's'}, so each is +${c.cat.c}: ${c.catName}` : `. The ${c.nc === 1 ? `${c.cat.f} ion must cancel` : `${c.nc} ${c.cat.f} ions must cancel`} that, so the total charge is zero.`}${final ? '.' : ''}`));
    } else if (!final) {
      kids.push(note(c.an.poly ? 'A polyatomic ion keeps its own name — look it up in the table of polyatomic ions.' : 'A single-element anion takes the element\'s name with the ending changed to -ide.'));
    }
  }
  if (final || (!toFormula && c.kind !== 'tm')) {
    kids.push(P(`The charges must add up to zero: ${c.nc} × (+${c.cat.c}) + ${c.na} × (${pretty(String(c.an.c))}) = 0.`));
  } else if (!toFormula) kids.push(note('Share that total out among the metal ions: the charge on each one is the Roman numeral.'));
  else kids.push(note('Find the smallest number of each ion that makes the total charge zero.'));
  if (final && toFormula && ((c.cat.poly && c.nc > 1) || (c.an.poly && c.na > 1))) kids.push(note('A polyatomic ion keeps its own formula; put it in brackets when you need more than one of it.'));
  return kids;
}
function covWork(c, final, toFormula) {
  const kids = [P('Both elements are nonmetals, so this is a molecular (covalent) compound: the prefixes count the atoms.')];
  if (final) {
    kids.push(P(`${c.nx > 1 ? `${PREFIX_N[c.nx]}- = ${c.nx}` : 'no prefix on the first element = 1'} ${ELEM[c.x].name} (${c.x}); ${PREFIX_N[c.ny]}- = ${c.ny} ${ELEM[c.y].name} (${c.y}).`));
  } else kids.push(note('mono = 1, di = 2, tri = 3, tetra = 4, penta = 5, hexa = 6, hepta = 7, octa = 8, nona = 9, deca = 10. No prefix on the first element means 1.'));
  if (!toFormula) kids.push(note('"Mono" is left off the first element, and the second element ends in -ide.'));
  return kids;
}
function genFormula(lvl) {
  const c = pickCompound(lvl);
  const answer = fm(c.formula);
  const work = (final) => el('div', { class: 'lab-work' },
    ...(c.kind === 'cov' ? covWork(c, final, true) : ionicWork(c, final, true)),
    final ? P('So: ', ansBox(answer)) : null);
  const w = [];
  if (c.kind === 'cov') {
    if (c.nx !== c.ny) w.push({ f: `${c.x}${c.ny > 1 ? c.ny : ''}${c.y}${c.nx > 1 ? c.nx : ''}`, why: 'swapped the subscripts' });
    w.push({ f: `${c.x}${c.y}${c.ny > 1 ? c.ny : ''}`.replace(/^([A-Z][a-z]?)(?=[A-Z])/, '$1'), why: 'dropped the first prefix' });
    for (const d of [1, -1, 2]) if (c.ny + d >= 1 && c.ny + d <= 10) w.push({ f: `${c.x}${c.nx > 1 ? c.nx : ''}${c.y}${c.ny + d > 1 ? c.ny + d : ''}`, why: 'mixed up the prefixes' });
    w.push({ f: `${c.x}${c.nx + 1}${c.y}${c.ny > 1 ? c.ny : ''}`, why: 'mixed up the prefixes' });
  } else {
    const { cat, an, nc, na } = c;
    if (nc !== 1 || na !== 1) w.push({ f: ionPart(cat, 1) + ionPart(an, 1), why: 'charges not balanced' });
    if (nc !== na) w.push({ f: ionPart(cat, na) + ionPart(an, nc), why: 'swapped the numbers of each ion' });
    if ((cat.poly && nc > 1) || (an.poly && na > 1)) w.push({ f: `${cat.f}${nc > 1 ? nc : ''}${an.f}${na > 1 ? na : ''}`, why: 'left out the brackets' });
    if (cat.c === -an.c && cat.c > 1) w.push({ f: ionPart(cat, cat.c) + ionPart(an, -an.c), why: 'did not reduce to the lowest ratio' });
    if (c.kind === 'tm') w.push({ f: ionic({ ...cat, c: cat.other }, an).formula, why: 'used the wrong charge for the metal' });
    for (const nm of ENDING_SWAP[an.name] || []) {
      const other = ANION_BY[nm];
      if (other) w.push({ f: ionic(cat, other).formula, why: 'mixed up -ide, -ite and -ate' });
    }
    w.push({ f: ionPart(cat, nc + 1) + ionPart(an, na), why: 'charges not balanced' });
  }
  const textWrong = uniqBy(w.filter((x) => x.f !== c.formula), (x) => x.f).map((x) => ({ str: fm(x.f), plain: x.f, why: x.why }));
  return makeQ2('formula', {
    level: lvl, prompt: `Write the formula for ${c.name}.`,
    note: 'Type subscripts as plain numbers (H2O). Capital letters matter.',
    answer, accept: c.formulas, value: 1,
    brief: c.kind === 'cov' ? `The prefixes give the subscripts: ${c.name} is ${answer}.` : `${c.catName} is ${fm(c.cat.f)}${chargeText(c.cat.c)}, ${c.an.name} is ${fm(c.an.f)}${chargeText(c.an.c)}; balancing the charges gives ${answer}.`,
    textWrong, work, gradeWith: gradeFormula, extra: { cmp: c },
  });
}
function genNaming(lvl) {
  const c = pickCompound(lvl);
  const answer = c.name;
  const work = (final) => el('div', { class: 'lab-work' },
    ...(c.kind === 'cov' ? covWork(c, final, false) : ionicWork(c, final, false)),
    final ? P('So: ', ansBox(answer)) : (c.kind === 'cov' ? null : note(c.kind === 'tm' ? 'Name the metal, its charge as a Roman numeral in brackets, then the anion.' : 'Name the cation, then the anion. Ionic names use no prefixes.')));
  const w = [];
  if (c.kind === 'cov') {
    w.push({ n: `${ELEM[c.x].name} ${IDE[c.y]}`, why: 'left out the prefixes' });
    if (c.nx === 1) w.push({ n: `mono${ELEM[c.x].name} ${withPrefix(c.ny, IDE[c.y])}`, why: 'put mono on the first element' });
    for (const d of [1, -1]) if (c.ny + d >= 1 && c.ny + d <= 10) w.push({ n: `${c.nx > 1 ? PREFIX_N[c.nx] : ''}${ELEM[c.x].name} ${withPrefix(c.ny + d, IDE[c.y])}`, why: 'used the wrong prefix' });
    if (c.nx !== c.ny) w.push({ n: `${c.ny > 1 ? PREFIX_N[c.ny] : ''}${ELEM[c.x].name} ${withPrefix(c.nx, IDE[c.y])}`, why: 'swapped the prefixes' });
  } else {
    const { cat, an, nc, na } = c;
    if (c.kind === 'tm') {
      w.push({ n: `${cat.name} ${an.name}`, why: 'left out the Roman numeral' });
      w.push({ n: `${cat.name}(${ROMAN[cat.other]}) ${an.name}`, why: 'wrong charge in the Roman numeral' });
      if (na !== cat.c) w.push({ n: `${cat.name}(${ROMAN[na]}) ${an.name}`, why: 'used the anion\'s subscript as the charge' });
    } else if (!cat.poly) w.push({ n: `${cat.name}(${ROMAN[cat.c]}) ${an.name}`, why: 'added a Roman numeral the metal does not need' });
    if (nc > 1 || na > 1) w.push({ n: `${nc > 1 ? PREFIX_N[nc] : ''}${c.catName} ${na > 1 ? withPrefix(na, an.name) : an.name}`, why: 'used prefixes on an ionic compound' });
    for (const nm of ENDING_SWAP[an.name] || []) w.push({ n: `${c.catName} ${nm}`, why: 'mixed up -ide, -ite and -ate' });
    if (!an.poly && !ENDING_SWAP[an.name]) w.push({ n: `${c.catName} ${an.name.replace(/ide$/, 'ate')}`, why: 'mixed up -ide and -ate' });
    w.push({ n: `${c.catName} ${ELEM[an.f] ? ELEM[an.f].name : an.name}`, why: 'kept the element name instead of the -ide ending' });
  }
  const accepted = new Set(c.names.map(normName));
  const textWrong = uniqBy(w.filter((x) => !accepted.has(normName(x.n))), (x) => normName(x.n)).map((x) => ({ str: x.n, why: x.why }));
  return makeQ2('naming', {
    level: lvl, prompt: `Name the compound ${fm(c.formula)}.`,
    note: c.kind === 'tm' || (lvl === 3 && c.kind !== 'cov') ? 'Write any Roman numeral in brackets, like iron(II).' : '',
    answer, accept: c.names, value: 1,
    brief: c.kind === 'cov' ? `Molecular compound — prefixes count the atoms: ${answer}.` : c.kind === 'tm' ? `${c.na} × (${pretty(String(c.an.c))}) = ${pretty(String(c.na * c.an.c))}, so each ${c.cat.f} is +${c.cat.c}: ${answer}.` : `Cation then anion, no prefixes: ${answer}.`,
    textWrong, work, gradeWith: gradeName, extra: { cmp: c },
  });
}

/* ------------------------------------------------ Unit 9: chemical reactions */
// Real reactions with their lowest whole-number coefficients, their type, and
// any other type they could fairly be called (never offered as a wrong option).
const REACTIONS = [
  ['2 H2 + O2 -> 2 H2O', 'synthesis', ['combustion']],
  ['N2 + 3 H2 -> 2 NH3', 'synthesis'],
  ['2 Na + Cl2 -> 2 NaCl', 'synthesis'],
  ['4 Fe + 3 O2 -> 2 Fe2O3', 'synthesis', ['combustion']],
  ['2 Mg + O2 -> 2 MgO', 'synthesis', ['combustion']],
  ['4 Al + 3 O2 -> 2 Al2O3', 'synthesis', ['combustion']],
  ['2 Al + 3 Cl2 -> 2 AlCl3', 'synthesis'],
  ['CaO + H2O -> Ca(OH)2', 'synthesis'],
  ['2 K + Br2 -> 2 KBr', 'synthesis'],
  ['2 SO2 + O2 -> 2 SO3', 'synthesis', ['combustion']],
  ['P4 + 5 O2 -> P4O10', 'synthesis', ['combustion']],
  ['2 Ca + O2 -> 2 CaO', 'synthesis', ['combustion']],
  ['3 Mg + N2 -> Mg3N2', 'synthesis'],
  ['2 Fe + 3 Cl2 -> 2 FeCl3', 'synthesis'],
  ['H2 + Cl2 -> 2 HCl', 'synthesis'],
  ['4 Na + O2 -> 2 Na2O', 'synthesis', ['combustion']],
  ['2 NO + O2 -> 2 NO2', 'synthesis', ['combustion']],
  ['2 Cu + O2 -> 2 CuO', 'synthesis', ['combustion']],
  ['CO2 + H2O -> H2CO3', 'synthesis'],
  ['SO3 + H2O -> H2SO4', 'synthesis'],
  ['2 H2O -> 2 H2 + O2', 'decomposition'],
  ['2 H2O2 -> 2 H2O + O2', 'decomposition'],
  ['2 KClO3 -> 2 KCl + 3 O2', 'decomposition'],
  ['CaCO3 -> CaO + CO2', 'decomposition'],
  ['MgCO3 -> MgO + CO2', 'decomposition'],
  ['2 NaCl -> 2 Na + Cl2', 'decomposition'],
  ['2 HgO -> 2 Hg + O2', 'decomposition'],
  ['2 Cu(NO3)2 -> 2 CuO + 4 NO2 + O2', 'decomposition'],
  ['2 Al2O3 -> 4 Al + 3 O2', 'decomposition'],
  ['NH4NO3 -> N2O + 2 H2O', 'decomposition'],
  ['2 NaHCO3 -> Na2CO3 + H2O + CO2', 'decomposition'],
  ['2 KNO3 -> 2 KNO2 + O2', 'decomposition'],
  ['2 Ag2O -> 4 Ag + O2', 'decomposition'],
  ['(NH4)2CO3 -> 2 NH3 + H2O + CO2', 'decomposition'],
  ['2 NH3 -> N2 + 3 H2', 'decomposition'],
  ['Cu(OH)2 -> CuO + H2O', 'decomposition'],
  ['2 PbO2 -> 2 PbO + O2', 'decomposition'],
  ['Zn + 2 HCl -> ZnCl2 + H2', 'single replacement'],
  ['2 Na + 2 H2O -> 2 NaOH + H2', 'single replacement'],
  ['Fe + CuSO4 -> FeSO4 + Cu', 'single replacement'],
  ['Cu + 2 AgNO3 -> Cu(NO3)2 + 2 Ag', 'single replacement'],
  ['Cl2 + 2 KBr -> 2 KCl + Br2', 'single replacement'],
  ['2 Al + 3 CuCl2 -> 2 AlCl3 + 3 Cu', 'single replacement'],
  ['Mg + 2 HCl -> MgCl2 + H2', 'single replacement'],
  ['2 Al + 6 HCl -> 2 AlCl3 + 3 H2', 'single replacement'],
  ['2 K + 2 H2O -> 2 KOH + H2', 'single replacement'],
  ['Ca + 2 H2O -> Ca(OH)2 + H2', 'single replacement'],
  ['Zn + CuSO4 -> ZnSO4 + Cu', 'single replacement'],
  ['2 Al + Fe2O3 -> Al2O3 + 2 Fe', 'single replacement'],
  ['Br2 + 2 NaI -> 2 NaBr + I2', 'single replacement'],
  ['Mg + 2 AgNO3 -> Mg(NO3)2 + 2 Ag', 'single replacement'],
  ['3 Mg + 2 FeCl3 -> 3 MgCl2 + 2 Fe', 'single replacement'],
  ['Fe + 2 HCl -> FeCl2 + H2', 'single replacement'],
  ['2 Li + 2 H2O -> 2 LiOH + H2', 'single replacement'],
  ['Zn + 2 AgNO3 -> Zn(NO3)2 + 2 Ag', 'single replacement'],
  ['AgNO3 + NaCl -> AgCl + NaNO3', 'double replacement'],
  ['BaCl2 + Na2SO4 -> BaSO4 + 2 NaCl', 'double replacement'],
  ['Pb(NO3)2 + 2 KI -> PbI2 + 2 KNO3', 'double replacement'],
  ['HCl + NaOH -> NaCl + H2O', 'double replacement'],
  ['H2SO4 + 2 NaOH -> Na2SO4 + 2 H2O', 'double replacement'],
  ['CaCl2 + Na2CO3 -> CaCO3 + 2 NaCl', 'double replacement'],
  ['FeCl3 + 3 NaOH -> Fe(OH)3 + 3 NaCl', 'double replacement'],
  ['2 HCl + Ca(OH)2 -> CaCl2 + 2 H2O', 'double replacement'],
  ['CuSO4 + 2 NaOH -> Cu(OH)2 + Na2SO4', 'double replacement'],
  ['2 AgNO3 + CuCl2 -> 2 AgCl + Cu(NO3)2', 'double replacement'],
  ['3 CaCl2 + 2 Na3PO4 -> Ca3(PO4)2 + 6 NaCl', 'double replacement'],
  ['H3PO4 + 3 KOH -> K3PO4 + 3 H2O', 'double replacement'],
  ['2 HNO3 + Mg(OH)2 -> Mg(NO3)2 + 2 H2O', 'double replacement'],
  ['Na2S + 2 HCl -> 2 NaCl + H2S', 'double replacement'],
  ['AlCl3 + 3 AgNO3 -> Al(NO3)3 + 3 AgCl', 'double replacement'],
  ['Pb(NO3)2 + Na2SO4 -> PbSO4 + 2 NaNO3', 'double replacement'],
  ['2 KOH + H2SO4 -> K2SO4 + 2 H2O', 'double replacement'],
  ['BaCl2 + 2 AgNO3 -> 2 AgCl + Ba(NO3)2', 'double replacement'],
  ['CH4 + 2 O2 -> CO2 + 2 H2O', 'combustion'],
  ['C3H8 + 5 O2 -> 3 CO2 + 4 H2O', 'combustion'],
  ['2 C2H6 + 7 O2 -> 4 CO2 + 6 H2O', 'combustion'],
  ['C2H4 + 3 O2 -> 2 CO2 + 2 H2O', 'combustion'],
  ['2 C4H10 + 13 O2 -> 8 CO2 + 10 H2O', 'combustion'],
  ['C6H12O6 + 6 O2 -> 6 CO2 + 6 H2O', 'combustion'],
  ['C2H5OH + 3 O2 -> 2 CO2 + 3 H2O', 'combustion'],
  ['2 CH3OH + 3 O2 -> 2 CO2 + 4 H2O', 'combustion'],
  ['2 C2H2 + 5 O2 -> 4 CO2 + 2 H2O', 'combustion'],
  ['C5H12 + 8 O2 -> 5 CO2 + 6 H2O', 'combustion'],
  ['2 C8H18 + 25 O2 -> 16 CO2 + 18 H2O', 'combustion'],
  ['2 C3H6 + 9 O2 -> 6 CO2 + 6 H2O', 'combustion'],
  ['C12H22O11 + 12 O2 -> 12 CO2 + 11 H2O', 'combustion'],
  ['2 C6H6 + 15 O2 -> 12 CO2 + 6 H2O', 'combustion'],
];
const RX = REACTIONS.map(([s, type, also = []]) => {
  const side = (t) => t.split(' + ').map((x) => { const m = x.trim().match(/^(\d+)?\s*(\S+)$/); return { c: Number(m[1] || 1), f: m[2] }; });
  const [l, r] = s.split(' -> ');
  return { src: s, type, also, r: side(l), p: side(r) };
});
const allSpecies = (rx) => [...rx.r, ...rx.p];
const eqPretty = (rx, coefs = true) => `${rx.r.map((x) => `${coefs && x.c !== 1 ? `${x.c} ` : ''}${fm(x.f)}`).join(' + ')} → ${rx.p.map((x) => `${coefs && x.c !== 1 ? `${x.c} ` : ''}${fm(x.f)}`).join(' + ')}`;
const sideCount = (sp, cs, e) => sp.reduce((t, x, i) => t + cs[i] * (atomsOf(x.f)[e] || 0), 0);
const rxElements = (rx) => [...new Set(allSpecies(rx).flatMap((x) => Object.keys(atomsOf(x.f))))];
function balances(rx, cs) {
  const cl = cs.slice(0, rx.r.length), cr = cs.slice(rx.r.length);
  return rxElements(rx).every((e) => sideCount(rx.r, cl, e) === sideCount(rx.p, cr, e));
}
function gradeCoeffs(q, raw) {
  const rx = q.rx;
  const n = allSpecies(rx).length;
  const s = String(raw).trim().replace(/[.]+$/, '');
  if (/[a-z]/i.test(s)) return { ok: false, why: `Type just the ${n} coefficients, in order, separated by commas.` };
  const nums = s.split(/[\s,;:]+/).filter(Boolean);
  if (!nums.length || nums.some((x) => !/^\d+$/.test(x))) return { ok: false, why: `Type ${n} whole numbers, separated by commas.` };
  const cs = nums.map(Number);
  const want = allSpecies(rx).map((x) => x.c);
  if (cs.length !== n) {
    const ones = want.filter((c) => c === 1).length;
    return { ok: false, why: cs.length === n - ones ? 'Write every coefficient — including the 1s.' : `This equation has ${n} substances, so type ${n} coefficients.` };
  }
  if (cs.every((c, i) => c === want[i])) return { ok: true };
  if (cs.some((c) => c === 0)) return { ok: false, why: 'A coefficient can\'t be 0 — every substance is there.' };
  const k = cs[0] / want[0];
  if (Number.isInteger(k) && k > 1 && cs.every((c, i) => c === want[i] * k)) return { ok: false, why: `Balanced, but not the lowest whole numbers — divide them all by ${k}.` };
  const cl = cs.slice(0, rx.r.length), cr = cs.slice(rx.r.length);
  const off = rxElements(rx).find((e) => sideCount(rx.r, cl, e) !== sideCount(rx.p, cr, e));
  return { ok: false, why: off ? `Not balanced: that gives ${sideCount(rx.r, cl, off)} ${off} on the left but ${sideCount(rx.p, cr, off)} on the right.` : '' };
}
function countTable(rx, cs, label) {
  const cl = cs.slice(0, rx.r.length), cr = cs.slice(rx.r.length);
  const expr = (sp, cc, e) => sp.map((x, i) => [cc[i], atomsOf(x.f)[e] || 0]).filter(([, a]) => a).map(([c, a]) => (c === 1 ? `${a}` : `${c} × ${a}`)).join(' + ');
  return dataTable(['Atom', 'Left', 'Right'],
    rxElements(rx).map((e) => {
      const L = sideCount(rx.r, cl, e), Rr = sideCount(rx.p, cr, e);
      const le = expr(rx.r, cl, e), re = expr(rx.p, cr, e);
      return [e, /[×+]/.test(le) ? `${le} = ${L}` : `${L}`, `${/[×+]/.test(re) ? `${re} = ${Rr}` : `${Rr}`} ${L === Rr ? '✓' : '✗'}`];
    }), label);
}
function genBalance(lvl) {
  const usable = RX.filter((r) => allSpecies(r).some((x) => x.c !== 1));
  const maxC = (r) => Math.max(...allSpecies(r).map((x) => x.c));
  const easy = usable.filter((r) => allSpecies(r).length <= 3 && maxC(r) <= 3);
  const mid = usable.filter((r) => !easy.includes(r) && maxC(r) <= 6 && r.type !== 'combustion');
  const hard = usable.filter((r) => !easy.includes(r) && !mid.includes(r));
  const rx = pick(lvl === 1 ? easy : lvl === 2 ? mid : chance(.7) ? hard : mid);
  const sp = allSpecies(rx);
  const n = sp.length;
  const want = sp.map((x) => x.c);
  const answer = want.join(', ');
  const ones = sp.map(() => 1);
  const work = (final) => {
    const kids = [P('Count each kind of atom on both sides. Change only the coefficients (the big numbers in front) — never the subscripts.')];
    if (final) {
      kids.push(countTable(rx, want, 'Atoms on each side of the balanced equation'));
      kids.push(P('Balanced: ', el('span', { class: 'lab-nowrap' }, eqPretty(rx)), '.'));
      kids.push(P('Coefficients in order: ', ansBox(answer), '.'));
      if (want.includes(1)) kids.push(note('A coefficient of 1 is not written in the equation, but it still counts.'));
    } else {
      kids.push(countTable(rx, ones, 'Atoms on each side before balancing'));
      kids.push(note(rx.type === 'combustion'
        ? 'Balance C first, then H, then O last. If O₂ needs a half, double every coefficient.'
        : 'Start with an element that appears in only one substance on each side; leave H and O (and elements on their own) for last. A polyatomic ion found on both sides can be balanced as one unit.'));
    }
    return el('div', { class: 'lab-work' }, ...kids);
  };
  const cands = [];
  if (!want.every((c) => c === 1)) cands.push({ cs: ones, why: 'left it unbalanced' });
  for (let i = 0; i < n; i++) for (const d of [1, -1]) if (want[i] + d >= 1) cands.push({ cs: want.map((c, j) => (j === i ? c + d : c)), why: 'one coefficient off' });
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (want[i] !== want[j]) cands.push({ cs: want.map((c, k) => (k === i ? want[j] : k === j ? want[i] : c)), why: 'coefficients in the wrong order' });
  const textWrong = uniqBy(shuffle(cands).filter((c) => !balances(rx, c.cs)), (c) => c.cs.join()).map((c) => ({ str: c.cs.join(', '), why: c.why }));
  return makeQ2('balance', {
    level: lvl, prompt: `Balance the equation: ${eqPretty(rx, false)}`,
    note: `Type the ${n} coefficients in order, separated by commas. Use the lowest whole numbers, and write any 1s.`,
    answer, accept: [want.join(' '), want.join(','), want.join(', ')], value: want[0],
    brief: `${eqPretty(rx)}: coefficients ${answer}.`,
    textWrong, work, gradeWith: gradeCoeffs, extra: { rx },
  });
}
const RX_TYPES = ['synthesis', 'decomposition', 'single replacement', 'double replacement', 'combustion'];
const isElement = (f) => /^[A-Z][a-z]?\d*$/.test(f);
function genRxType(lvl) {
  const pool = RX.filter((r) => (lvl === 1 ? ['synthesis', 'decomposition', 'combustion'].includes(r.type) || chance(.3) : true));
  const rx = pick(pool);
  const answer = cap1(rx.type);
  const confuse = { synthesis: ['decomposition', 'combustion'], decomposition: ['synthesis'], 'single replacement': ['double replacement'], 'double replacement': ['single replacement'], combustion: ['synthesis', 'decomposition'] };
  const others = RX_TYPES.filter((t) => t !== rx.type && !rx.also.includes(t));
  const first = (confuse[rx.type] || []).filter((t) => others.includes(t));
  const wrongs = [...first, ...shuffle(others.filter((t) => !first.includes(t)))].slice(0, 3);
  const el1 = rx.r.find((x) => isElement(x.f));
  const why = {
    synthesis: `${rx.r.length} reactants combine into one product (${fm(rx.p[0].f)}): A + B → AB.`,
    decomposition: `One reactant (${fm(rx.r[0].f)}) breaks down into ${rx.p.length} products: AB → A + B.`,
    'single replacement': `An element (${el1 ? fm(el1.f) : ''}) takes the place of an element in a compound: A + BC → AC + B.`,
    'double replacement': 'Two compounds swap partners: AB + CD → AD + CB.',
    combustion: `A fuel made of carbon and hydrogen${/O/.test(rx.r.find((x) => /C/.test(x.f))?.f || '') ? ' (and oxygen)' : ''} burns in O₂, making CO₂ and H₂O.`,
  }[rx.type];
  const work = (final) => el('div', { class: 'lab-work' },
    P('Look at the pattern of the reactants and products:'),
    el('ul', { class: 'lab-steps' },
      el('li', {}, 'Synthesis: A + B → AB'), el('li', {}, 'Decomposition: AB → A + B'), el('li', {}, 'Single replacement: A + BC → AC + B'),
      el('li', {}, 'Double replacement: AB + CD → AD + CB'), el('li', {}, 'Combustion: fuel (C, H) + O₂ → CO₂ + H₂O')),
    final ? P(why) : null,
    final && rx.also.length ? note(`Reacting a substance with oxygen is sometimes also called ${rx.also.join(' or ')}, so that is not one of the choices here.`) : null,
    final ? P('So: ', ansBox(answer), '.') : note('Count the reactants and products, and check which are elements and which are compounds.'));
  return makeQ2('rxntype', {
    level: lvl, type: 'mc', prompt: `What type of reaction is this? ${eqPretty(rx)}`,
    answer, options: shuffle([answer, ...wrongs.map(cap1)]), value: 1,
    brief: `${why} It is ${rx.type}.`, work,
  });
}

/* ------------------------------------------------ Unit 10: the mole */
const SUBSTANCES = [
  ['H2O', 'water', 'molecules'], ['CO2', 'carbon dioxide', 'molecules'], ['NH3', 'ammonia', 'molecules'], ['CH4', 'methane', 'molecules'],
  ['C6H12O6', 'glucose', 'molecules'], ['C12H22O11', 'sucrose', 'molecules'], ['C2H5OH', 'ethanol', 'molecules'], ['C3H8', 'propane', 'molecules'],
  ['O2', 'oxygen gas', 'molecules'], ['N2', 'nitrogen gas', 'molecules'], ['Cl2', 'chlorine gas', 'molecules'], ['H2SO4', 'sulfuric acid', 'molecules'],
  ['HCl', 'hydrogen chloride', 'molecules'], ['HNO3', 'nitric acid', 'molecules'], ['H3PO4', 'phosphoric acid', 'molecules'], ['SO2', 'sulfur dioxide', 'molecules'],
  ['NaCl', 'sodium chloride'], ['CaCO3', 'calcium carbonate'], ['NaOH', 'sodium hydroxide'], ['Ca(OH)2', 'calcium hydroxide'], ['Mg(OH)2', 'magnesium hydroxide'],
  ['Al2(SO4)3', 'aluminum sulfate'], ['(NH4)3PO4', 'ammonium phosphate'], ['Ca3(PO4)2', 'calcium phosphate'], ['KMnO4', 'potassium permanganate'],
  ['NaHCO3', 'sodium hydrogen carbonate'], ['Fe2O3', 'iron(III) oxide'], ['CuSO4', 'copper(II) sulfate'], ['AgNO3', 'silver nitrate'], ['Ca(NO3)2', 'calcium nitrate'],
  ['MgCl2', 'magnesium chloride'], ['KCl', 'potassium chloride'], ['Na2CO3', 'sodium carbonate'], ['Pb(NO3)2', 'lead(II) nitrate'], ['K2Cr2O7', 'potassium dichromate'],
  ['NaC2H3O2', 'sodium acetate'], ['KNO3', 'potassium nitrate'], ['CaCl2', 'calcium chloride'], ['Na2SO4', 'sodium sulfate'], ['(NH4)2SO4', 'ammonium sulfate'],
  ['Fe', 'iron', 'atoms'], ['Cu', 'copper', 'atoms'], ['Al', 'aluminum', 'atoms'], ['C', 'carbon', 'atoms'], ['Mg', 'magnesium', 'atoms'], ['Ag', 'silver', 'atoms'],
  ['Au', 'gold', 'atoms'], ['Zn', 'zinc', 'atoms'], ['He', 'helium', 'atoms'], ['Na', 'sodium', 'atoms'], ['S', 'sulfur', 'atoms'],
].map(([f, name, kind = 'formula units']) => ({ f, name, kind }));
const SUB_BY = Object.fromEntries(SUBSTANCES.map((s) => [s.f, s]));
const nElems = (f) => Object.keys(atomsOf(f)).length;
const massOfCounts = (counts) => Object.entries(counts).reduce((t, [e, c]) => add(t, mul(ELEM[e].m, R(c))), R(0));
/** "2 × 1.01 + 16.00" — the molar mass as a sum. */
const mmSum = (f) => Object.entries(atomsOf(f)).map(([e, c]) => (c === 1 ? ELEM[e].mass : `${c} × ${ELEM[e].mass}`)).join(' + ');
const mmLine = (f) => {
  const at = Object.values(atomsOf(f));
  // one atom of one element: its atomic mass is the molar mass, no sum to show
  return P(`Molar mass of ${fm(f)}: ${at.length === 1 && at[0] === 1 ? '' : `${mmSum(f)} = `}${fx2(molarMass(f))} g/mol.`);
};
function genMolar(lvl) {
  let f, name;
  const comp = SUBSTANCES.filter((s) => s.kind !== 'atoms');
  if (lvl === 3 && chance(.5)) {
    for (let i = 0; i < 60 && !f; i++) { const c = pickCompound(chance(.5) ? 2 : 3); if (c.kind !== 'cov' && /\(/.test(c.formula)) ({ formula: f, name } = c); }
  }
  if (!f) {
    const s = pick(lvl === 1 ? comp.filter((x) => nElems(x.f) <= 2 && !/\(/.test(x.f)) : lvl === 2 ? comp.filter((x) => nElems(x.f) >= 3 && !/\(/.test(x.f)) : comp.filter((x) => /\(/.test(x.f)));
    ({ f, name } = s);
  }
  const at = atomsOf(f);
  const mm = molarMass(f);
  const a = numAns(mm, { exact: true });
  a.str = fx2(mm);
  const answer = `${a.str} g/mol`;
  const rows = (final) => Object.entries(at).map(([e, c]) => [e, `${c} × ${ELEM[e].mass}`, final ? fx2(mul(ELEM[e].m, R(c))) : '?']);
  const work = (final) => el('div', { class: 'lab-work' },
    P(`Count the atoms of each element in ${fm(f)}${/\(/.test(f) ? ' — a number after a bracket multiplies everything inside it' : ''}, multiply by the atomic mass, and add.`),
    dataTable(['Element', 'Atoms × atomic mass', 'g/mol'], rows(final), `Molar mass of ${f}`),
    final ? P(`Add them: ${Object.entries(at).map(([e, c]) => fx2(mul(ELEM[e].m, R(c)))).join(' + ')} = `, ansBox(answer), '.') : note('Add up the last column. Molar mass is in g/mol.'));
  const wrong = [];
  const counts = (ff) => { try { return atomsOf(ff); } catch { return null; } };
  if (/\(/.test(f)) {
    const ignore = counts(f.replace(/\(([^()]+)\)(\d+)/g, '$1'));
    if (ignore) wrong.push({ r: massOfCounts(ignore), why: 'ignored the number after the bracket' });
    const lastOnly = counts(f.replace(/\(([^()]+)\)(\d+)/g, (_, g, m) => g.replace(/(\d*)$/, (d) => String((Number(d) || 1) * Number(m)))));
    if (lastOnly) wrong.push({ r: massOfCounts(lastOnly), why: 'multiplied only the last element by the number after the bracket' });
  }
  wrong.push({ r: massOfCounts(Object.fromEntries(Object.keys(at).map((e) => [e, 1]))), why: 'left out the subscripts' });
  const els = Object.keys(at);
  if (els.length >= 2) wrong.push({ r: massOfCounts(Object.fromEntries(els.map((e, i) => [e, at[els[(i + 1) % els.length]]]))), why: 'put the subscripts on the wrong elements' });
  wrong.push({ r: Object.entries(at).reduce((t, [e, c]) => add(t, R(ELEM[e].z * c)), R(0)), why: 'added atomic numbers instead of atomic masses' });
  return numQ('molar', {
    level: lvl, prompt: `What is the molar mass of ${name}, ${fm(f)}?`,
    note: massNote([f]), a, how: { exact: true }, fmt: fx2, unit: 'g/mol', unitKey: 'gmol', unitName: 'g/mol',
    accept: acceptList([a.str.replace(/,/g, ''), fx(mm).replace(/,/g, '')], ['g/mol', 'g mol-1', 'grams per mole']),
    brief: `${mmSum(f)} = ${answer}`, wrong, work,
  });
}
function genMoles(lvl) {
  const kind = pick(lvl === 1 ? ['g2mol', 'mol2g'] : lvl === 2 ? ['g2mol', 'mol2g', 'mol2p', 'p2mol'] : ['g2p', 'p2g', 'mol2p', 'p2mol']);
  const S = pick(lvl === 1 ? SUBSTANCES.filter((s) => s.f.length <= 5) : SUBSTANCES);
  const F = fm(S.f), word = S.kind, SN = `${S.name}, ${F}`;
  const gram = () => given3(0, 2), mole = () => given3(-1, 0), parts = () => given3(21, 24);
  let g, factors, prompt, unit, unitKey;
  if (kind === 'g2mol') { g = { ...gram(), unit: `g ${F}` }; factors = [mmFactor(S.f, false)]; prompt = `How many moles are in ${g.s} g of ${SN}?`; unit = 'mol'; }
  else if (kind === 'mol2g') { g = { ...mole(), unit: `mol ${F}` }; factors = [mmFactor(S.f, true)]; prompt = `What is the mass of ${g.s} mol of ${SN}?`; unit = 'g'; }
  else if (kind === 'mol2p') { g = { ...mole(), unit: `mol ${F}` }; factors = [naFactor(S.f, word, true)]; prompt = `How many ${word} are in ${g.s} mol of ${SN}?`; unit = word; }
  else if (kind === 'p2mol') { g = { ...parts(), unit: `${word} ${F}` }; factors = [naFactor(S.f, word, false)]; prompt = `How many moles is ${g.s} ${word} of ${SN}?`; unit = 'mol'; }
  else if (kind === 'g2p') { g = { ...gram(), unit: `g ${F}` }; factors = [mmFactor(S.f, false), naFactor(S.f, word, true)]; prompt = `How many ${word} are in ${g.s} g of ${SN}?`; unit = word; }
  else { g = { ...parts(), unit: `${word} ${F}` }; factors = [naFactor(S.f, word, false), mmFactor(S.f, true)]; prompt = `What is the mass of ${g.s} ${word} of ${SN}?`; unit = 'g'; }
  unitKey = unit;
  const given = { amt: g.s, r: g.r, unit: g.unit };
  const truth = factors.reduce((v, f) => mul(v, div(f.top.r, f.bot.r)), g.r);
  const a = numAns(truth, SF3);
  const answer = `${a.str} ${unit}`;
  const usesMass = /g/.test(kind), usesNA = /p/.test(kind);
  const how = {
    g2mol: 'Grams → moles: divide by the molar mass (grams on the bottom so they cancel).',
    mol2g: 'Moles → grams: multiply by the molar mass (moles on the bottom so they cancel).',
    mol2p: `Moles → ${word}: 1 mol = 6.02 × 10²³ ${word}.`,
    p2mol: `${cap1(word)} → moles: 1 mol = 6.02 × 10²³ ${word} (${word} on the bottom so they cancel).`,
    g2p: `Grams → moles → ${word}: two factors, the molar mass then Avogadro's number.`,
    p2g: `${cap1(word)} → moles → grams: two factors, Avogadro's number then the molar mass.`,
  }[kind];
  const work = (final) => el('div', { class: 'lab-work' },
    P(how),
    usesMass ? mmLine(S.f) : null,
    chemFence(given, factors, final ? { ans: supPow10(answer) } : null),
    final ? fenceArith(given, factors) : note('Multiply across the top, multiply across the bottom, then divide.'),
    final ? roundLine(a, answer) : null);
  const x = (k) => mul(truth, k);
  const mm = molarMass(S.f);
  const wrong = {
    g2mol: [{ r: mul(g.r, mm), why: 'multiplied by the molar mass instead of dividing' }, { r: div(g.r, mul(mm, R(2))), why: 'miscounted the molar mass' }],
    mol2g: [{ r: div(g.r, mm), why: 'divided by the molar mass instead of multiplying' }],
    mol2p: [{ r: div(g.r, NA), why: 'divided by Avogadro\'s number instead of multiplying' }, { r: x(R(1, 10)), why: 'used 10²² instead of 10²³' }],
    p2mol: [{ r: mul(g.r, NA), why: 'multiplied by Avogadro\'s number instead of dividing' }, { r: x(R(10)), why: 'used 10²² instead of 10²³' }],
    g2p: [{ r: mul(mul(g.r, mm), NA), why: 'multiplied by the molar mass instead of dividing' }, { r: mul(g.r, NA), why: 'skipped the molar mass' }],
    p2g: [{ r: div(div(g.r, NA), mm), why: 'divided by the molar mass instead of multiplying' }, { r: div(g.r, NA), why: 'stopped at moles' }],
  }[kind].concat([{ r: x(R(10)), why: 'off by a power of ten' }, { r: x(R(1, 10)), why: 'off by a power of ten' }]);
  return numQ('moles', {
    level: lvl, prompt, a, how: SF3, unit, unitKey, unitName: unit,
    note: `${usesMass ? `${massNote([S.f])} ` : ''}${usesNA ? `1 mol = 6.02 × 10²³ ${word}. ` : ''}Round to 3 significant figures.`,
    subs: [S.f, F, S.name], sciKeys: usesNA,
    brief: `${supPow10(given.amt)} ${given.unit} × ${factors.map((f) => `(${supPow10(f.top.amt)} ${f.top.unit} / ${supPow10(f.bot.amt)} ${f.bot.unit})`).join(' × ')} = ${answer}`,
    wrong, work,
  });
}
function genPcomp(lvl) {
  const pool = SUBSTANCES.filter((s) => s.kind !== 'atoms' && nElems(s.f) >= 2 && (lvl === 1 ? nElems(s.f) === 2 : lvl === 2 ? !/\(/.test(s.f) : nElems(s.f) >= 3));
  const S = pick(pool);
  const at = atomsOf(S.f);
  const e = pick(Object.keys(at));
  const part = mul(ELEM[e].m, R(at[e]));
  const mm = molarMass(S.f);
  const truth = mul(div(part, mm), R(100));
  const a = numAns(truth, SF3);
  const answer = `${a.str}%`;
  const work = (final) => el('div', { class: 'lab-work' },
    P(`Percent by mass = (mass of ${ELEM[e].name} in one mole ÷ molar mass) × 100.`),
    formulaBox(
      ln(`mass of ${e} = ${at[e] === 1 ? ELEM[e].mass : `${at[e]} × ${ELEM[e].mass}`} = ${fx2(part)} g`),
      ln(`molar mass of ${fm(S.f)} = ${mmSum(S.f)} = ${fx2(mm)} g/mol`),
      final ? ln(`% ${e} = (`, frac(fx2(part), fx2(mm)), ...rich(`) × 100 = ${longShow(truth)}%`)) : ln(`% ${e} = ?`)),
    final ? roundLine(a, answer) : note('Divide the part by the whole, then multiply by 100.'));
  const totalAtoms = Object.values(at).reduce((x, y) => x + y, 0);
  const wrong = [
    { r: mul(R(at[e], totalAtoms), R(100)), why: 'counted atoms instead of using their masses' },
    { r: sub(R(100), truth), why: 'found the percent of everything else' },
    { r: div(truth, R(100)), why: 'forgot to multiply by 100' },
  ];
  if (at[e] > 1) wrong.push({ r: mul(div(ELEM[e].m, mm), R(100)), why: 'forgot the subscript' });
  return numQ('pcomp', {
    level: lvl, prompt: `What is the percent by mass of ${ELEM[e].name} in ${S.name}, ${fm(S.f)}?`,
    note: `${massNote([S.f])} Round to 3 significant figures.`, a, how: SF3, unit: '%', unitKey: 'pct', unitName: 'a percent (%)',
    accept: acceptList([a.str.replace(/,/g, '')], ['%', 'percent']),
    brief: `(${fx2(part)} ÷ ${fx2(mm)}) × 100 = ${answer}`, wrong, work,
  });
}
const EMP_BANK = ['CH2O', 'CH2', 'CH', 'CH4', 'C2H6O', 'C3H8', 'C2H5', 'C3H4O3', 'C4H5N2O', 'NO2', 'N2O', 'N2O5', 'P2O5', 'SO3', 'Fe2O3', 'Fe3O4', 'Al2O3', 'Cu2O', 'CuO', 'MgO', 'CaCl2', 'Na2SO4', 'KMnO4', 'K2Cr2O7', 'Na2CO3', 'C5H4', 'CH3O', 'C2H3O2', 'CH2Cl', 'C3H5O2', 'NaHCO3', 'KClO3', 'C6H5', 'C3H4', 'CH2O2', 'N2H4', 'NH2'];
const countsFormula = (counts) => counts.map(([e, n]) => `${e}${n > 1 ? n : ''}`).join('');
/** Percent composition (1 decimal) → mole ratio → whole numbers, as the notes do it. */
function empiricalFrom(pcts) {
  const mol = pcts.map(([e, p]) => [e, div(p, ELEM[e].m)]);
  const min = mol.reduce((m, [, x]) => (leR(x, m) ? x : m), mol[0][1]);
  const ratio = mol.map(([e, x]) => [e, div(x, min)]);
  for (let k = 1; k <= 6; k++) {
    const ints = ratio.map(([e, x]) => { const v = mul(x, R(k)); return [e, v, roundPlace(v, 0)]; });
    if (ints.every(([, v, n]) => leR(absR(sub(v, n)), R(1, 10)))) return { k, mol, ratio, counts: ints.map(([e, , n]) => [e, Number(n.p)]) };
  }
  return null;
}
function genEmpirical(lvl) {
  for (let tries = 0; tries < 50; tries++) {
    const f = pick(EMP_BANK.filter((x) => (lvl === 1 ? nElems(x) === 2 && !/[3-9]/.test(x.replace(/^[A-Z][a-z]?\d?[A-Z][a-z]?/, '')) : lvl === 2 ? nElems(x) <= 3 : true)));
    const at = atomsOf(f);
    const els = Object.keys(at);
    const mm = molarMass(f);
    const pcts = els.map((e) => [e, roundDp(mul(div(mul(ELEM[e].m, R(at[e])), mm), R(100)), 1)]);
    pcts[pcts.length - 1][1] = sub(R(100), pcts.slice(0, -1).reduce((t, [, p]) => add(t, p), R(0)));
    if (pcts.some(([, p]) => !(p.p > 0n))) continue;
    const got = empiricalFrom(pcts);
    if (!got || countsFormula(got.counts) !== f) continue;
    const p1 = (r) => placePoint((r.p * 10n) / r.q, 1, false);
    const answer = fm(f);
    const cands = [];
    const byPct = (() => {
      const min = pcts.reduce((m, [, p]) => (leR(p, m) ? p : m), pcts[0][1]);
      return pcts.map(([e, p]) => [e, Number(roundPlace(div(p, min), 0).p) || 1]);
    })();
    const gg = byPct.reduce((x, [, n]) => gcdN(x, n), 0) || 1;
    cands.push({ f: countsFormula(byPct.map(([e, n]) => [e, n / gg])), why: 'divided the percentages without changing them to moles' });
    if (got.k > 1) {
      cands.push({ f: countsFormula(got.ratio.map(([e, x]) => [e, Math.max(1, Number(roundPlace(x, 0).p))])), why: 'rounded the mole ratio instead of multiplying to whole numbers' });
    }
    cands.push({ f: countsFormula(got.counts.map(([e, n]) => [e, n * 2])), why: 'did not reduce to the simplest ratio' });
    const cs = got.counts;
    for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) if (cs[i][1] !== cs[j][1]) cands.push({ f: countsFormula(cs.map(([e, n], k) => [e, k === i ? cs[j][1] : k === j ? cs[i][1] : n])), why: 'swapped the subscripts' });
    for (let i = 0; i < cs.length; i++) cands.push({ f: countsFormula(cs.map(([e, n], k) => [e, k === i ? n + 1 : n])), why: 'miscounted one element' });
    const ratioKey = (ff) => { const a2 = atomsOf(ff); const g2 = Object.values(a2).reduce(gcdN, 0); return els.map((e) => (a2[e] || 0) / g2).join(':'); };
    const picked = [];
    for (const c of cands) {
      if (c.f === f || picked.some((x) => x.f === c.f)) continue;
      if (ratioKey(c.f) === ratioKey(f) && c.why !== 'did not reduce to the simplest ratio') continue;
      picked.push(c);
    }
    const three = [picked.find((c) => c.why.startsWith('divided')), ...shuffle(picked.filter((c) => !c.why.startsWith('divided')))].filter(Boolean).slice(0, 3);
    if (three.length < 3) continue;
    const pctText = listJoin(pcts.map(([e, p]) => `${p1(p)}% ${ELEM[e].name}`));
    const kCol = got.k > 1;
    const work = (final) => el('div', { class: 'lab-work' },
      P('Assume 100 g, so each percent becomes grams. Change grams to moles, divide by the smallest, and make whole numbers.'),
      el('ol', { class: 'lab-steps lab-emp' }, ...els.map((e, i) => el('li', {},
        el('b', {}, `${e}: `), `${p1(pcts[i][1])} g ÷ ${ELEM[e].mass} = ${final ? `${longShow(got.mol[i][1], 4)} mol` : '? mol'}`,
        final ? `; ÷ smallest = ${longShow(got.ratio[i][1], 3)}${kCol ? `; × ${got.k} = ${got.counts[i][1]}` : ''}` : ''))),
      final && kCol ? note(`The ratios are not all whole numbers, so multiply them all by ${got.k}.`) : null,
      final ? P('So the empirical formula is ', ansBox(answer), '.') : note('If a ratio ends in about .5, .33 or .25, multiply every ratio by 2, 3 or 4.'));
    return makeQ2('empirical', {
      level: lvl, type: 'mc', prompt: `A compound is ${pctText} by mass. What is its empirical formula?`,
      note: massNote([f]), answer, options: shuffle([answer, ...three.map((c) => fm(c.f))]), value: 1,
      brief: `Moles in 100 g, divided by the smallest${got.k > 1 ? `, times ${got.k}` : ''}: ${answer}.`,
      work, extra: { mistakes: three.map((c) => ({ option: fm(c.f), why: c.why })) },
    });
  }
  throw new Error('could not build an empirical-formula problem');
}
const ratioFactor = (B2, A2) => fac(side2(`${B2.c}`, R(B2.c), `mol ${fm(B2.f)}`), side2(`${A2.c}`, R(A2.c), `mol ${fm(A2.f)}`));
function stoichSetup(lvl) {
  const rx = pick(RX.filter((r) => allSpecies(r).length >= 2));
  const sp = allSpecies(rx).map((x, i) => ({ ...x, side: i < rx.r.length ? 'r' : 'p' }));
  const roll = Math.random();
  let A, Bs;
  const reac = sp.filter((x) => x.side === 'r'), prod = sp.filter((x) => x.side === 'p');
  if (roll < .7 || reac.length < 2) { A = pick(reac); Bs = pick(prod); }
  else if (roll < .85) { [A, Bs] = shuffle(reac); }
  else { A = pick(prod); Bs = pick(reac); }
  if (A.f === Bs.f) return null;
  const verb = A.side === 'r' && Bs.side === 'p' ? 'can be produced from' : A.side === 'r' ? 'react with' : 'are needed to produce';
  return { rx, A, B: Bs, verb };
}
function genStoich(lvl) {
  let s = null;
  while (!s) s = stoichSetup(lvl);
  const { rx, A, B: Bs, verb } = s;
  const moleOnly = lvl === 1;
  const g = moleOnly ? given3(-1, 0) : given3(0, 2);
  const given = { amt: g.s, r: g.r, unit: `${moleOnly ? 'mol' : 'g'} ${fm(A.f)}` };
  const factors = moleOnly ? [ratioFactor(Bs, A)] : [mmFactor(A.f, false), ratioFactor(Bs, A), mmFactor(Bs.f, true)];
  const truth = factors.reduce((v, f) => mul(v, div(f.top.r, f.bot.r)), g.r);
  const a = numAns(truth, SF3);
  const unit = moleOnly ? 'mol' : 'g';
  const answer = `${a.str} ${unit}`;
  const prompt = `For the reaction ${eqPretty(rx)}, how many ${moleOnly ? 'moles' : 'grams'} of ${fm(Bs.f)} ${verb} ${g.s} ${moleOnly ? 'mol' : 'g'} of ${fm(A.f)}?`;
  const work = (final) => el('div', { class: 'lab-work' },
    P(moleOnly ? `Use the mole ratio from the coefficients: ${Bs.c} mol ${fm(Bs.f)} for every ${A.c} mol ${fm(A.f)}.`
      : `Grams of ${fm(A.f)} → moles of ${fm(A.f)} → moles of ${fm(Bs.f)} (the mole ratio from the coefficients) → grams of ${fm(Bs.f)}.`),
    moleOnly ? null : mmLine(A.f), moleOnly ? null : mmLine(Bs.f),
    chemFence(given, factors, final ? { ans: answer } : null),
    final ? fenceArith(given, factors) : note('The mole ratio has the substance you want on top and the one you have on the bottom.'),
    final ? roundLine(a, answer) : null);
  const wrong = [{ r: mul(truth, R(10)), why: 'off by a power of ten' }, { r: mul(truth, R(1, 10)), why: 'off by a power of ten' }];
  if (A.c !== Bs.c) wrong.unshift({ r: mul(truth, R(A.c, Bs.c)), why: 'skipped the mole ratio' }, { r: mul(truth, R(A.c * A.c, Bs.c * Bs.c)), why: 'flipped the mole ratio' });
  if (!moleOnly) wrong.unshift({ r: div(truth, molarMass(Bs.f)), why: `stopped at moles of ${fm(Bs.f)}` }, { r: mul(g.r, R(Bs.c, A.c)), why: 'used the mole ratio on grams' });
  return numQ('stoich', {
    level: lvl, prompt, a, how: SF3, unit, unitKey: unit, unitName: unit,
    note: `${moleOnly ? '' : `${massNote([A.f, Bs.f])} `}Round to 3 significant figures.`,
    subs: [Bs.f, fm(Bs.f)],
    brief: `${given.amt} ${given.unit} × ${factors.map((f) => `(${f.top.amt} ${f.top.unit} / ${f.bot.amt} ${f.bot.unit})`).join(' × ')} = ${answer}`,
    wrong, work,
  });
}
function genLimiting(lvl) {
  for (let tries = 0; tries < 80; tries++) {
    const rx = pick(RX.filter((r) => r.r.length === 2));
    const [A, Bx] = rx.r;
    const Pp = pick(rx.p);
    const moleOnly = lvl === 1;
    const nA = given3(-1, 0).r;
    const t = chance(.5) ? R(ri(45, 85), 100) : R(ri(120, 220), 100);
    const nB = roundSig(mul(mul(nA, R(Bx.c, A.c)), t), 3);
    const amtA = moleOnly ? nA : roundSig(mul(nA, molarMass(A.f)), 3);
    const amtB = moleOnly ? nB : roundSig(mul(nB, molarMass(Bx.f)), 3);
    const molOf = (x, amt) => (moleOnly ? amt : div(amt, molarMass(x.f)));
    const yieldOf = (x, amt) => { const n = mul(molOf(x, amt), R(Pp.c, x.c)); return moleOnly ? n : mul(n, molarMass(Pp.f)); };
    const yA = yieldOf(A, amtA), yB = yieldOf(Bx, amtB);
    const ratio = div(yA, yB);
    if (leR(R(9, 10), ratio) && leR(ratio, R(11, 10))) continue;
    const [L, E, yL, yE] = leR(yA, yB) ? [A, Bx, yA, yB] : [Bx, A, yB, yA];
    const unit = moleOnly ? 'mol' : 'g';
    const opt = (x, y) => `${fm(x.f)} is limiting; ${sfShow(y, 3)} ${unit} ${fm(Pp.f)}`;
    const answer = opt(L, yL);
    const amtL = L === A ? amtA : amtB;
    const noRatio = moleOnly ? molOf(L, amtL) : mul(molOf(L, amtL), molarMass(Pp.f));
    const cands = [
      { x: E, y: yE, why: 'picked the reactant that makes more product' },
      { x: L, y: noRatio, why: 'skipped the mole ratio' },
      { x: E, y: yL, why: 'right amount, but named the wrong reactant' },
      { x: L, y: yE, why: 'used the excess reactant to find the amount' },
    ];
    const smallMass = leR(amtA, amtB) ? A : Bx;
    if (smallMass !== L) cands.unshift({ x: smallMass, y: yieldOf(smallMass, smallMass === A ? amtA : amtB), why: 'compared the masses instead of the moles' });
    const opts = [{ x: L, y: yL, s: answer }];
    const picked = [];
    for (const c of cands) {
      const s2 = opt(c.x, c.y);
      if (opts.some((o) => o.s === s2 || (o.x === c.x && close(toNum(roundSig(o.y, 3)), toNum(roundSig(c.y, 3)))))) continue;
      opts.push({ x: c.x, y: c.y, s: s2 }); picked.push({ option: s2, why: c.why });
      if (picked.length === 3) break;
    }
    if (picked.length < 3) continue;
    const amtTxt = (x, amt) => `${sfShow(amt, 3)} ${unit} of ${fm(x.f)}`;
    const toP = (x, amt) => {
      const factors = moleOnly ? [ratioFactor(Pp, x)] : [mmFactor(x.f, false), ratioFactor(Pp, x), mmFactor(Pp.f, true)];
      return { given: { amt: sfShow(amt, 3), r: amt, unit: `${unit} ${fm(x.f)}` }, factors };
    };
    const work = (final) => {
      const fa = toP(A, amtA), fb = toP(Bx, amtB);
      return el('div', { class: 'lab-work' },
        P(`Work out how much ${fm(Pp.f)} each reactant could make. The one that makes less runs out first — it is the limiting reactant.`),
        chemFence(fa.given, fa.factors, final ? { ans: `${sfShow(yA, 3)} ${unit} ${fm(Pp.f)}` } : null),
        chemFence(fb.given, fb.factors, final ? { ans: `${sfShow(yB, 3)} ${unit} ${fm(Pp.f)}` } : null),
        final ? P(`${fm(L.f)} makes less ${fm(Pp.f)}, so ${fm(L.f)} is limiting and ${fm(E.f)} is in excess. The most ${fm(Pp.f)} that can form is ${sfShow(yL, 3)} ${unit}.`) : note('Compare the two amounts of product, not the amounts of reactant.'),
        final ? P('So: ', ansBox(answer), '.') : null);
    };
    return makeQ2('limiting', {
      level: lvl, type: 'mc',
      prompt: `For the reaction ${eqPretty(rx)}, ${amtTxt(A, amtA)} reacts with ${amtTxt(Bx, amtB)}. Which reactant is limiting, and how much ${fm(Pp.f)} can form?`,
      note: `${moleOnly ? '' : `${massNote([A.f, Bx.f, Pp.f])} `}Amounts are rounded to 3 significant figures.`,
      answer, options: shuffle([answer, ...picked.map((p) => p.option)]), value: toNum(roundSig(yL, 3)),
      brief: `${fm(A.f)} could make ${sfShow(yA, 3)} ${unit} and ${fm(Bx.f)} ${sfShow(yB, 3)} ${unit} of ${fm(Pp.f)}: ${answer}.`,
      work, extra: { mistakes: picked },
    });
  }
  throw new Error('could not build a limiting-reactant problem');
}
function genYield(lvl) {
  for (let tries = 0; tries < 80; tries++) {
    let T, prompt, pre = null, noteTxt = '';
    const pct = R(ri(550, 985), 1000);
    if (lvl <= 2) {
      const S = pick(SUBSTANCES.filter((s) => s.kind !== 'atoms'));
      const t = given3(0, 2);
      T = t.r;
      const act = roundSig(mul(T, pct), 3);
      if (!leR(act, T) || eqR(act, T)) continue;
      pre = { S, act, Tshow: t.s };
      prompt = `The theoretical yield of ${S.name}, ${fm(S.f)}, is ${t.s} g, but only ${sfShow(act, 3)} g is collected. What is the percent yield?`;
      noteTxt = 'Round to 3 significant figures.';
    } else {
      const rx = pick(RX.filter((r) => r.p.some((x) => !isElement(x.f) || true)));
      const A = pick(rx.r), Pp = pick(rx.p);
      if (A.f === Pp.f) continue;
      const g = given3(0, 2);
      const factors = [mmFactor(A.f, false), ratioFactor(Pp, A), mmFactor(Pp.f, true)];
      T = factors.reduce((v, f) => mul(v, div(f.top.r, f.bot.r)), g.r);
      const act = roundSig(mul(T, pct), 3);
      // a student who rounds the theoretical yield to 3 figures first must get the same answer
      if (!eqR(roundSig(mul(div(act, T), R(100)), 3), roundSig(mul(div(act, roundSig(T, 3)), R(100)), 3))) continue;
      pre = { rx, A, Pp, g, factors, act };
      prompt = `For the reaction ${eqPretty(rx)}, ${g.s} g of ${fm(A.f)} reacts completely and ${sfShow(act, 3)} g of ${fm(Pp.f)} is collected. What is the percent yield?`;
      noteTxt = `${massNote([A.f, Pp.f])} Round to 3 significant figures.`;
    }
    const act = pre.act;
    const truth = mul(div(act, T), R(100));
    const a = numAns(truth, SF3);
    const answer = `${a.str}%`;
    const work = (final) => {
      const kids = [P('Percent yield = (actual yield ÷ theoretical yield) × 100.')];
      if (pre.rx) {
        kids.push(P(`First the theoretical yield: the most ${fm(pre.Pp.f)} that ${pre.g.s} g of ${fm(pre.A.f)} can make.`));
        const given = { amt: pre.g.s, r: pre.g.r, unit: `g ${fm(pre.A.f)}` };
        kids.push(chemFence(given, pre.factors, final ? { ans: `${longShow(T, 5)} g ${fm(pre.Pp.f)}` } : null));
      }
      kids.push(formulaBox(
        lnF('percent yield = (actual ÷ theoretical) × 100'),
        final ? ln('= (', frac(`${sfShow(act, 3)} g`, `${pre.rx ? longShow(T, 5) : pre.Tshow} g`), ...rich(`) × 100 = ${longShow(truth)}%`)) : ln('= ?')));
      if (final) kids.push(roundLine(a, answer));
      else kids.push(note('The actual yield is what was collected; it goes on top.'));
      return el('div', { class: 'lab-work' }, ...kids);
    };
    const wrong = [
      { r: mul(div(T, act), R(100)), why: 'divided the wrong way' },
      { r: div(act, T), why: 'forgot to multiply by 100' },
    ];
    if (pre.rx) wrong.push({ r: mul(div(act, pre.g.r), R(100)), why: 'used the reactant\'s mass as the theoretical yield' });
    wrong.push({ r: sub(R(100), truth), why: 'found the percent lost' });
    return numQ('yield', {
      level: lvl, prompt, note: noteTxt, a, how: SF3, unit: '%', unitKey: 'pct', unitName: 'a percent (%)',
      accept: acceptList([a.str.replace(/,/g, '')], ['%', 'percent']),
      brief: `(${sfShow(act, 3)} ÷ ${longShow(T, 5)}) × 100 = ${answer}`, wrong, work,
    });
  }
  throw new Error('could not build a percent-yield problem');
}

/* ------------------------------------------------ Unit 11: gases */
// 1 atm = 101.3 kPa = 760 mmHg
const PRESS = { atm: { s: '1', r: R(1) }, kPa: { s: '101.3', r: D('101.3') }, mmHg: { s: '760', r: R(760) } };
const PRESS_NOTE = '1 atm = 101.3 kPa = 760 mmHg.';
const pressGiven = (u) => (u === 'atm' ? given3(-1, 0) : u === 'kPa' ? given3(1, 2) : given3(2, 3));
function genPressure(lvl) {
  const units = ['atm', 'kPa', 'mmHg'];
  let from, to;
  if (lvl === 1) { const other = pick(['kPa', 'mmHg']); [from, to] = chance(.5) ? ['atm', other] : [other, 'atm']; }
  else if (lvl === 2) [from, to] = shuffle(units).slice(0, 2);
  else [from, to] = chance(.6) ? shuffle(['kPa', 'mmHg']) : shuffle(units).slice(0, 2);
  const g = pressGiven(from);
  const factor = fac(side2(PRESS[to].s, PRESS[to].r, to), side2(PRESS[from].s, PRESS[from].r, from));
  const given = { amt: g.s, r: g.r, unit: from };
  const truth = div(mul(g.r, PRESS[to].r), PRESS[from].r);
  const a = numAns(truth, SF3);
  const answer = `${a.str} ${to}`;
  const work = (final) => el('div', { class: 'lab-work' },
    P(`Use ${PRESS[from].s} ${from} = ${PRESS[to].s} ${to} as the factor, with ${from} on the bottom so it cancels.`),
    chemFence(given, [factor], final ? { ans: answer } : null),
    final ? fenceArith(given, [factor]) : note('Multiply by the top, divide by the bottom.'),
    final ? roundLine(a, answer) : null);
  const wrongOther = units.find((u) => u !== from && u !== to);
  const wrong = [
    { r: div(mul(g.r, PRESS[from].r), PRESS[to].r), why: 'flipped the conversion factor' },
    { r: div(mul(g.r, PRESS[wrongOther].r), PRESS[from].r), why: `used the ${wrongOther} number by mistake` },
    { r: mul(truth, R(10)), why: 'off by a power of ten' }, { r: mul(truth, R(1, 10)), why: 'off by a power of ten' },
  ];
  return numQ('pressure', {
    level: lvl, prompt: chance(.5) ? `Convert ${g.s} ${from} to ${to}.` : `What is a pressure of ${g.s} ${from} in ${to}?`,
    note: `${PRESS_NOTE} Round to 3 significant figures.`, a, how: SF3, unit: to, unitKey: to, unitName: to,
    brief: `${g.s} ${from} × (${PRESS[to].s} ${to} / ${PRESS[from].s} ${from}) = ${answer}`, wrong, work,
  });
}
/** A second amount 0.4–2.5 times the first (never almost the same), to 3 significant figures. */
function nearG(g, lo = 40, hi = 250) {
  for (;;) {
    const f = ri(lo, hi);
    if (f >= 90 && f <= 110) continue;
    const r = roundSig(mul(g.r, R(f, 100)), 3);
    return { r, s: sfShow(r, 3) };
  }
}
/** A second temperature 20–130 degrees away from the first, in the same scale. */
function tempNear(t, useC) {
  const dk = (chance(.5) ? 1 : -1) * ri(20, 130);
  if (useC) {
    let c = t.c + dk;
    if (c < -40 || c > 250) c = t.c - dk;
    return { c, k: R(c + 273), s: `${pretty(String(c))} °C` };
  }
  let k = Number(t.k.p) + dk;
  if (k < 200 || k > 600) k = Number(t.k.p) - dk;
  return { c: null, k: R(k), s: `${k} K` };
}
/** A temperature as given: whole °C or kelvin. */
function tempGiven(useC) {
  if (useC) { const c = ri(-30, 180); return { c, k: R(c + 273), s: `${pretty(String(c))} °C` }; }
  const k = ri(240, 470);
  return { c: null, k: R(k), s: `${k} K` };
}
const kLine = (label, t) => (t.c == null ? null : ln(`${label} = ${pretty(String(t.c))} + 273 = ${fx(t.k)} K`));
function genGasLaw(lvl) {
  for (let tries = 0; tries < 60; tries++) {
    const kinds = lvl === 1 ? ['boyleV', 'boyleP', 'charlesV'] : lvl === 2 ? ['boyleV', 'charlesV', 'charlesT', 'gayP', 'gayT'] : ['combV', 'combP', 'charlesT', 'gayT', 'combV'];
    const kind = pick(kinds);
    const useC = lvl === 1 ? false : lvl === 2 ? chance(.7) : chance(.85);
    const pu = lvl === 1 ? 'atm' : pick(['atm', 'atm', 'atm', 'kPa', 'mmHg']);
    const Pg = () => pressGiven(pu);
    const Vg = () => given3(0, 1);
    let prompt, truth, unit, unitKey, law, solve, sub1, T1 = null, T2 = null, cWrong = null, flip;
    if (kind === 'boyleV' || kind === 'boyleP') {
      const P1 = Pg(), V1 = Vg();
      law = 'P₁V₁ = P₂V₂';
      if (kind === 'boyleV') {
        const P2 = nearG(P1);
        truth = div(mul(P1.r, V1.r), P2.r); unit = 'L';
        prompt = `A gas occupies ${V1.s} L at ${P1.s} ${pu}. What volume does it occupy at ${P2.s} ${pu}, if the temperature stays the same?`;
        solve = 'V₂ = P₁V₁ ÷ P₂'; sub1 = ['V₂ = ', frac(`${P1.s} ${pu} × ${V1.s} L`, `${P2.s} ${pu}`)];
        flip = div(mul(P2.r, V1.r), P1.r);
      } else {
        const V2 = nearG(V1, 30, 85);
        truth = div(mul(P1.r, V1.r), V2.r); unit = pu;
        prompt = `A gas at ${P1.s} ${pu} is compressed from ${V1.s} L to ${V2.s} L at constant temperature. What is its new pressure?`;
        solve = 'P₂ = P₁V₁ ÷ V₂'; sub1 = ['P₂ = ', frac(`${P1.s} ${pu} × ${V1.s} L`, `${V2.s} L`)];
        flip = div(mul(P1.r, V2.r), V1.r);
      }
    } else if (kind === 'charlesV' || kind === 'charlesT') {
      const V1 = Vg();
      T1 = tempGiven(useC);
      law = 'V₁ ÷ T₁ = V₂ ÷ T₂';
      if (kind === 'charlesV') {
        T2 = tempNear(T1, useC);
        truth = div(mul(V1.r, T2.k), T1.k); unit = 'L';
        prompt = `A balloon holds ${V1.s} L of gas at ${T1.s}. What is its volume at ${T2.s}, if the pressure stays the same?`;
        solve = 'V₂ = V₁ × T₂ ÷ T₁'; sub1 = ['V₂ = ', frac(`${V1.s} L × ${fx(T2.k)} K`, `${fx(T1.k)} K`)];
        flip = div(mul(V1.r, T1.k), T2.k);
        if (T1.c && T2.c) cWrong = R(V1.r.p * B(T2.c), V1.r.q * B(T1.c));
      } else {
        const V2 = nearG(V1);
        truth = div(mul(V2.r, T1.k), V1.r); unit = 'K';
        prompt = `A gas occupies ${V1.s} L at ${T1.s}. At what temperature, in kelvin, does it occupy ${V2.s} L at the same pressure?`;
        solve = 'T₂ = T₁ × V₂ ÷ V₁'; sub1 = ['T₂ = ', frac(`${fx(T1.k)} K × ${V2.s} L`, `${V1.s} L`)];
        flip = div(mul(V1.r, T1.k), V2.r);
        if (T1.c) cWrong = mul(R(T1.c), div(V2.r, V1.r));
      }
    } else if (kind === 'gayP' || kind === 'gayT') {
      const P1 = Pg();
      T1 = tempGiven(useC);
      law = 'P₁ ÷ T₁ = P₂ ÷ T₂';
      if (kind === 'gayP') {
        T2 = tempNear(T1, useC);
        truth = div(mul(P1.r, T2.k), T1.k); unit = pu;
        prompt = `A sealed container of gas is at ${P1.s} ${pu} and ${T1.s}. What is its pressure at ${T2.s}?`;
        solve = 'P₂ = P₁ × T₂ ÷ T₁'; sub1 = ['P₂ = ', frac(`${P1.s} ${pu} × ${fx(T2.k)} K`, `${fx(T1.k)} K`)];
        flip = div(mul(P1.r, T1.k), T2.k);
        if (T1.c && T2.c) cWrong = R(P1.r.p * B(T2.c), P1.r.q * B(T1.c));
      } else {
        const P2 = nearG(P1);
        truth = div(mul(P2.r, T1.k), P1.r); unit = 'K';
        prompt = `A sealed container of gas is at ${P1.s} ${pu} and ${T1.s}. At what temperature, in kelvin, will its pressure be ${P2.s} ${pu}?`;
        solve = 'T₂ = T₁ × P₂ ÷ P₁'; sub1 = ['T₂ = ', frac(`${fx(T1.k)} K × ${P2.s} ${pu}`, `${P1.s} ${pu}`)];
        flip = div(mul(P1.r, T1.k), P2.r);
        if (T1.c) cWrong = mul(R(T1.c), div(P2.r, P1.r));
      }
    } else {
      const P1 = Pg(), V1 = Vg();
      T1 = tempGiven(useC); T2 = tempNear(T1, useC);
      law = 'P₁V₁ ÷ T₁ = P₂V₂ ÷ T₂';
      if (kind === 'combV') {
        const P2 = nearG(P1);
        truth = div(mul(mul(P1.r, V1.r), T2.k), mul(P2.r, T1.k)); unit = 'L';
        prompt = `A gas has a volume of ${V1.s} L at ${P1.s} ${pu} and ${T1.s}. What is its volume at ${P2.s} ${pu} and ${T2.s}?`;
        solve = 'V₂ = P₁V₁T₂ ÷ (P₂T₁)'; sub1 = ['V₂ = ', frac(`${P1.s} ${pu} × ${V1.s} L × ${fx(T2.k)} K`, `${P2.s} ${pu} × ${fx(T1.k)} K`)];
        flip = div(mul(mul(P2.r, V1.r), T1.k), mul(P1.r, T2.k));
        if (T1.c && T2.c) cWrong = div(mul(mul(P1.r, V1.r), R(T2.c)), mul(P2.r, R(T1.c)));
      } else {
        const V2 = nearG(V1);
        truth = div(mul(mul(P1.r, V1.r), T2.k), mul(V2.r, T1.k)); unit = pu;
        prompt = `${cap1(aN(V1.s))} L sample of gas at ${P1.s} ${pu} and ${T1.s} is moved to ${aN(V2.s)} L container at ${T2.s}. What is its new pressure?`;
        solve = 'P₂ = P₁V₁T₂ ÷ (V₂T₁)'; sub1 = ['P₂ = ', frac(`${P1.s} ${pu} × ${V1.s} L × ${fx(T2.k)} K`, `${V2.s} L × ${fx(T1.k)} K`)];
        flip = div(mul(mul(P1.r, V2.r), T1.k), mul(V1.r, T2.k));
        if (T1.c && T2.c) cWrong = div(mul(mul(P1.r, V1.r), R(T2.c)), mul(V2.r, R(T1.c)));
      }
    }
    unitKey = unit;
    const a = numAns(truth, SF3);
    if (unit === 'K' && !(toNum(truth) >= 150 && toNum(truth) <= 900)) continue;
    const answer = `${a.str} ${unit}`;
    const hasC = (T1 && T1.c != null) || (T2 && T2.c != null);
    const work = (final) => {
      const rows = [lnF(law)];
      if (hasC) rows.push(lnF('In kelvin: K = °C + 273'), kLine('T₁', T1), T2 ? kLine('T₂', T2) : null);
      rows.push(lnF(solve));
      rows.push(ln(...sub1));
      rows.push(final ? ln(...rich(`${solve.split(' = ')[0]} = ${longShow(truth)} ${unit}`)) : ln(`${solve.split(' = ')[0]} = ?`));
      return el('div', { class: 'lab-work' },
        P(`${{ boyle: 'Boyle\'s law (constant temperature)', charles: 'Charles\'s law (constant pressure)', gay: 'Gay-Lussac\'s law (constant volume)', comb: 'The combined gas law' }[kind.replace(/[A-Z]$/, '')]}: rearrange it for the unknown, then substitute.`),
        formulaBox(...rows.filter(Boolean)),
        final ? roundLine(a, answer) : note(hasC ? 'Convert every °C temperature to kelvin before you substitute.' : 'Check the units cancel, leaving the unit you want.'));
    };
    const wrong = [
      { r: flip, why: 'flipped the ratio' },
      { r: mul(truth, R(10)), why: 'off by a power of ten' }, { r: mul(truth, R(1, 10)), why: 'off by a power of ten' },
    ];
    if (cWrong && toNum(cWrong) > 0) wrong.unshift({ r: cWrong, why: 'used °C instead of kelvin' });
    return numQ('gaslaw', {
      level: lvl, prompt, a, how: SF3, unit, unitKey, unitName: unit,
      note: `${hasC ? 'Use K = °C + 273. ' : ''}Round to 3 significant figures.`,
      brief: `${law}; ${solve}: ${answer}`, wrong, work,
    });
  }
  throw new Error('could not build a gas-law problem');
}
const RGAS = D('0.0821');
function genIdeal(lvl) {
  for (let tries = 0; tries < 60; tries++) {
    const kind = pick(lvl === 1 ? ['P', 'V'] : lvl === 2 ? ['P', 'V', 'n'] : ['n', 'T', 'P', 'V']);
    const useC = lvl === 1 ? false : chance(.7);
    const n = given3(-1, 0), V = given3(0, 1), Pp = given3(-1, 0);
    const T = tempGiven(useC);
    let truth, unit, prompt, solve, sub1, cWrong = null;
    if (kind === 'P') {
      truth = div(mul(mul(n.r, RGAS), T.k), V.r); unit = 'atm';
      prompt = `What is the pressure of ${n.s} mol of gas in ${aN(V.s)} L container at ${T.s}?`;
      solve = 'P = nRT ÷ V'; sub1 = ['P = ', frac(`${n.s} mol × 0.0821 × ${fx(T.k)} K`, `${V.s} L`)];
      if (T.c) cWrong = div(mul(mul(n.r, RGAS), R(T.c)), V.r);
    } else if (kind === 'V') {
      truth = div(mul(mul(n.r, RGAS), T.k), Pp.r); unit = 'L';
      prompt = `What volume does ${n.s} mol of gas occupy at ${Pp.s} atm and ${T.s}?`;
      solve = 'V = nRT ÷ P'; sub1 = ['V = ', frac(`${n.s} mol × 0.0821 × ${fx(T.k)} K`, `${Pp.s} atm`)];
      if (T.c) cWrong = div(mul(mul(n.r, RGAS), R(T.c)), Pp.r);
    } else if (kind === 'n') {
      truth = div(mul(Pp.r, V.r), mul(RGAS, T.k)); unit = 'mol';
      prompt = `How many moles of gas are in ${aN(V.s)} L container at ${Pp.s} atm and ${T.s}?`;
      solve = 'n = PV ÷ RT'; sub1 = ['n = ', frac(`${Pp.s} atm × ${V.s} L`, `0.0821 × ${fx(T.k)} K`)];
      if (T.c) cWrong = div(mul(Pp.r, V.r), mul(RGAS, R(T.c)));
    } else {
      truth = div(mul(Pp.r, V.r), mul(n.r, RGAS)); unit = 'K';
      prompt = `At what temperature, in kelvin, does ${n.s} mol of gas occupy ${V.s} L at ${Pp.s} atm?`;
      solve = 'T = PV ÷ nR'; sub1 = ['T = ', frac(`${Pp.s} atm × ${V.s} L`, `${n.s} mol × 0.0821`)];
      const tk = toNum(truth);
      if (tk < 200 || tk > 700) continue;
    }
    const tv = toNum(truth);
    if (!(tv > 0)) continue;
    const a = numAns(truth, SF3);
    const answer = `${a.str} ${unit}`;
    const work = (final) => el('div', { class: 'lab-work' },
      P('The ideal gas law: PV = nRT, with R = 0.0821 L·atm/(mol·K). Rearrange it for the unknown, then substitute.'),
      formulaBox(
        lnF('PV = nRT'),
        T.c != null && kind !== 'T' ? lnF('In kelvin: K = °C + 273') : null,
        kind !== 'T' ? kLine('T', T) : null,
        lnF(solve), ln(...sub1),
        final ? ln(...rich(`${kind} = ${longShow(truth)} ${unit}`)) : ln(`${kind} = ?`)),
      final ? roundLine(a, answer) : note('R = 0.0821 uses atm, L, mol and K — so the temperature has to be in kelvin.'));
    const wrong = [
      { r: mul(truth, R(10)), why: 'off by a power of ten' }, { r: mul(truth, R(1, 10)), why: 'off by a power of ten' },
    ];
    if (cWrong && toNum(cWrong) > 0) wrong.unshift({ r: cWrong, why: 'used °C instead of kelvin' });
    const r831 = D('8.31');
    wrong.unshift({ r: kind === 'P' || kind === 'V' ? div(mul(truth, r831), RGAS) : div(mul(truth, RGAS), r831), why: 'used R = 8.31 (the value for kPa)' });
    return numQ('ideal', {
      level: lvl, prompt, a, how: SF3, unit, unitKey: unit, unitName: unit,
      note: `Use R = 0.0821 L·atm/(mol·K)${T.c != null && kind !== 'T' ? ' and K = °C + 273' : ''}. Round to 3 significant figures.`,
      brief: `PV = nRT, so ${solve}: ${answer}`, wrong, work,
    });
  }
  throw new Error('could not build an ideal-gas problem');
}

/* ------------------------------------------------ Unit 12: solutions, acids and bases */
const SOLUTES = ['NaCl', 'KCl', 'NaOH', 'KNO3', 'CaCl2', 'MgCl2', 'C6H12O6', 'C12H22O11', 'HCl', 'HNO3', 'H2SO4', 'AgNO3', 'CuSO4', 'KMnO4', 'NaHCO3', 'Na2CO3', 'Ca(NO3)2', 'NaC2H3O2', 'Na2SO4'];
const ML_CHOICES = [50, 75, 100, 125, 150, 200, 250, 300, 400, 500, 750];
function volGiven() {
  if (chance(.7)) { const ml = pick(ML_CHOICES); return { ml: true, r: R(ml), L: R(ml, 1000), amt: String(ml), s: `${ml} mL` }; }
  const g = given3(-1, 0);
  return { ml: false, r: g.r, L: g.r, amt: g.s, s: `${g.s} L` };
}
const toLitres = (v) => fac(side2('1', R(1), 'L'), side2('1000', R(1000), 'mL'));
function genMolarity(lvl) {
  const kind = pick(lvl === 1 ? ['mol2M', 'M2mol'] : lvl === 2 ? ['mol2M', 'M2mol', 'mol2M', 'g2M'] : ['g2M', 'M2g', 'M2mol']);
  const S = SUB_BY[pick(SOLUTES)];
  const F = fm(S.f), SN = `${S.name} (${F})`;
  const V = volGiven();
  const mm = molarMass(S.f);
  let truth, unit, prompt, work;
  const vGiven = { amt: V.amt, r: V.r, unit: V.ml ? 'mL' : 'L' };
  const mlFence = (final) => (V.ml ? chemFence(vGiven, [toLitres()], final ? { ans: `${fx(V.L)} L` } : null) : null);
  let wrong = [];
  if (kind === 'mol2M' || kind === 'g2M') {
    const amt = kind === 'mol2M' ? given3(-2, 0) : given3(0, 2);
    const mol = kind === 'mol2M' ? amt.r : div(amt.r, mm);
    truth = div(mol, V.L); unit = 'M';
    prompt = `What is the molarity of a solution made by dissolving ${amt.s} ${kind === 'mol2M' ? 'mol' : 'g'} of ${SN} in enough water to make ${V.s} of solution?`;
    work = (final) => el('div', { class: 'lab-work' },
      P('Molarity = moles of solute ÷ liters of solution.'),
      kind === 'g2M' ? mmLine(S.f) : null,
      kind === 'g2M' ? chemFence({ amt: amt.s, r: amt.r, unit: `g ${F}` }, [mmFactor(S.f, false)], final ? { ans: `${longShow(mol)} mol ${F}` } : null) : null,
      V.ml ? P('Change mL to L first:') : null, mlFence(final),
      formulaBox(lnF('M = mol ÷ L'), final ? ln('M = ', frac(`${kind === 'g2M' ? longShow(mol) : amt.s} mol`, `${fx(V.L)} L`), ...rich(` = ${longShow(truth)} M`)) : ln('M = ?')),
      final ? roundLine(numAns(truth, SF3), `${numAns(truth, SF3).str} M`) : note('Liters, not milliliters, go on the bottom.'));
    wrong = [
      { r: div(V.L, mol), why: 'divided the wrong way' },
      { r: mul(truth, R(10)), why: 'off by a power of ten' },
    ];
    if (V.ml) wrong.unshift({ r: div(mol, V.r), why: 'forgot to change mL to L' });
    if (kind === 'g2M') wrong.unshift({ r: div(amt.r, V.L), why: 'used grams instead of moles' });
  } else {
    const M = given3(-1, 0);
    const factors = [...(V.ml ? [toLitres()] : []), fac(side2(M.s, M.r, `mol ${F}`), side2('1', R(1), 'L')), ...(kind === 'M2g' ? [mmFactor(S.f, true)] : [])];
    truth = factors.reduce((v, f) => mul(v, div(f.top.r, f.bot.r)), V.r); unit = kind === 'M2g' ? 'g' : 'mol';
    prompt = `How many ${kind === 'M2g' ? 'grams' : 'moles'} of ${SN} are in ${V.s} of ${aN(M.s)} M solution?`;
    const answerT = `${numAns(truth, SF3).str} ${unit}`;
    work = (final) => el('div', { class: 'lab-work' },
      P(`${M.s} M means ${M.s} mol of ${F} in every 1 L of solution — use it as a conversion factor${V.ml ? ', after changing mL to L' : ''}.`),
      kind === 'M2g' ? mmLine(S.f) : null,
      chemFence(vGiven, factors, final ? { ans: answerT } : null),
      final ? fenceArith(vGiven, factors) : note('Put L on the bottom of the molarity factor so it cancels.'),
      final ? roundLine(numAns(truth, SF3), answerT) : null);
    wrong = [
      { r: div(V.L, M.r), why: 'divided instead of multiplying' },
      { r: mul(truth, R(10)), why: 'off by a power of ten' },
    ];
    if (V.ml) wrong.unshift({ r: mul(truth, R(1000)), why: 'forgot to change mL to L' });
    if (kind === 'M2g') wrong.unshift({ r: div(truth, mm), why: 'stopped at moles' });
  }
  const a = numAns(truth, SF3);
  return numQ('molarity', {
    level: lvl, prompt, a, how: SF3, unit, unitKey: unit, unitName: unit === 'M' ? 'M (mol/L)' : unit,
    note: `${/g/.test(kind) ? `${massNote([S.f])} ` : ''}Round to 3 significant figures.`,
    subs: [S.f, F, S.name],
    brief: kind === 'mol2M' || kind === 'g2M' ? `M = mol ÷ L = ${a.str} M` : `${V.s} × ${/M2/.test(kind) ? 'molarity' : ''} = ${a.str} ${unit}`,
    wrong, work,
  });
}
const DIL_SOLUTES = ['HCl', 'NaOH', 'H2SO4', 'NaCl', 'HNO3', 'KCl', 'CuSO4', 'NH3', 'KOH'];
function genDilution(lvl) {
  for (let tries = 0; tries < 60; tries++) {
    const kind = pick(lvl === 1 ? ['M2'] : lvl === 2 ? ['V1', 'M2'] : ['V2', 'M1', 'V1']);
    const F = fm(pick(DIL_SOLUTES));
    const M1 = given3(0, 0), V1 = given3(1, 2);
    const V2 = roundSig(mul(V1.r, R(ri(15, 80), 10)), 3);
    const M2 = roundSig(div(mul(M1.r, V1.r), V2), 3);
    if (!leR(V1.r, V2) || eqR(V1.r, V2)) continue;
    const s = (r) => sfShow(r, 3);
    let truth, unit, prompt, solve, sub1, wrong;
    if (kind === 'V1') {
      truth = div(mul(M2, V2), M1.r); unit = 'mL';
      prompt = `How many mL of ${M1.s} M ${F} are needed to make ${s(V2)} mL of ${s(M2)} M ${F}?`;
      solve = 'V₁ = M₂V₂ ÷ M₁'; sub1 = ['V₁ = ', frac(`${s(M2)} M × ${s(V2)} mL`, `${M1.s} M`)];
      wrong = [{ r: div(mul(M1.r, V2), M2), why: 'flipped the ratio' }];
    } else if (kind === 'M2') {
      truth = div(mul(M1.r, V1.r), V2); unit = 'M';
      prompt = `${V1.s} mL of ${M1.s} M ${F} is diluted to ${s(V2)} mL. What is the new concentration?`;
      solve = 'M₂ = M₁V₁ ÷ V₂'; sub1 = ['M₂ = ', frac(`${M1.s} M × ${V1.s} mL`, `${s(V2)} mL`)];
      wrong = [{ r: div(mul(M1.r, V2), V1.r), why: 'flipped the ratio' }];
    } else if (kind === 'V2') {
      truth = div(mul(M1.r, V1.r), M2); unit = 'mL';
      prompt = `To what total volume must ${V1.s} mL of ${M1.s} M ${F} be diluted to make it ${s(M2)} M?`;
      solve = 'V₂ = M₁V₁ ÷ M₂'; sub1 = ['V₂ = ', frac(`${M1.s} M × ${V1.s} mL`, `${s(M2)} M`)];
      wrong = [{ r: div(mul(M2, V1.r), M1.r), why: 'flipped the ratio' }, { r: sub(truth, V1.r), why: 'found the water to add, not the total volume' }];
    } else {
      truth = div(mul(M2, V2), V1.r); unit = 'M';
      prompt = `A student dilutes ${V1.s} mL of a solution of ${F} to ${s(V2)} mL. The new concentration is ${s(M2)} M. What was the original concentration?`;
      solve = 'M₁ = M₂V₂ ÷ V₁'; sub1 = ['M₁ = ', frac(`${s(M2)} M × ${s(V2)} mL`, `${V1.s} mL`)];
      wrong = [{ r: div(mul(M2, V1.r), V2), why: 'flipped the ratio' }];
    }
    wrong.push({ r: mul(truth, R(10)), why: 'off by a power of ten' }, { r: mul(truth, R(1, 10)), why: 'off by a power of ten' });
    const a = numAns(truth, SF3);
    const answer = `${a.str} ${unit}`;
    const work = (final) => el('div', { class: 'lab-work' },
      P('Diluting adds water but not solute, so the moles stay the same: M₁V₁ = M₂V₂. Both volumes can stay in mL — the units cancel.'),
      formulaBox(lnF('M₁V₁ = M₂V₂'), lnF(solve), ln(...sub1), final ? ln(...rich(`${solve.split(' = ')[0]} = ${longShow(truth)} ${unit}`)) : ln(`${solve.split(' = ')[0]} = ?`)),
      final ? roundLine(a, answer) : note('The concentrated solution (bigger M) has the smaller volume.'));
    return numQ('dilution', {
      level: lvl, prompt, a, how: SF3, unit, unitKey: unit, unitName: unit === 'M' ? 'M (mol/L)' : unit,
      note: 'Round to 3 significant figures.',
      brief: `M₁V₁ = M₂V₂, so ${solve}: ${answer}`, wrong, work,
    });
  }
  throw new Error('could not build a dilution problem');
}
const PH_NOTE = 'pH = −log[H⁺], and pH + pOH = 14.';
const sciOne = (n) => `1 × 10^-${n}`;
function genPh(lvl) {
  const kind = pick(lvl === 1 ? ['h2ph', 'ph2h'] : lvl === 2 ? ['h2ph', 'ph2h', 'ph2poh', 'poh2ph'] : ['oh2ph', 'h2poh', 'ph2oh', 'ph2poh', 'poh2ph']);
  const n = ri(1, 13);
  const x = lvl === 1 ? R(n) : R(ri(5, 135), 10);
  let prompt, truth, sciAns = false, lines, wrong, unitKey = '', unit = '';
  const pw = (e) => R(1, p10(e));
  if (kind === 'h2ph') {
    prompt = `A solution has [H⁺] = ${sciOne(n)} M. What is its pH?`; truth = R(n);
    lines = [lnF('pH = −log[H⁺]'), ln(...rich(`pH = −log(${sciOne(n)})`))];
    wrong = [{ r: R(-n), why: 'dropped the minus sign in −log' }, { r: R(14 - n), why: 'found the pOH instead' }, { r: R(n + 1), why: 'miscounted the exponent' }];
  } else if (kind === 'ph2h') {
    prompt = `A solution has a pH of ${n}. What is its [H⁺]?`; truth = pw(n); sciAns = true;
    lines = [lnF('[H⁺] = ', pow10('−pH')), ln(...rich(`[H⁺] = 10^-${n}`))];
    wrong = [{ r: R(p10(n)), why: 'lost the minus sign on the exponent' }, { r: pw(14 - n), why: 'found [OH⁻] instead' }, { r: pw(n + 1), why: 'miscounted the exponent' }];
  } else if (kind === 'ph2poh' || kind === 'poh2ph') {
    const [from, to] = kind === 'ph2poh' ? ['pH', 'pOH'] : ['pOH', 'pH'];
    prompt = `A solution has a ${from} of ${fx(x)}. What is its ${to}?`; truth = sub(R(14), x);
    lines = [lnF('pH + pOH = 14'), ln(`${to} = 14 − ${fx(x)}`)];
    wrong = [{ r: add(R(14), x), why: 'added instead of subtracting' }, { r: x, why: `copied the ${from}` }, { r: sub(x, R(14)), why: 'subtracted the wrong way round' }];
  } else if (kind === 'oh2ph') {
    prompt = `A solution has [OH⁻] = ${sciOne(n)} M. What is its pH?`; truth = R(14 - n);
    lines = [lnF('pOH = −log[OH⁻]'), ln(...rich(`pOH = −log(${sciOne(n)}) = ${n}`)), lnF('pH = 14 − pOH'), ln(`pH = 14 − ${n}`)];
    wrong = [{ r: R(n), why: 'stopped at the pOH' }, { r: R(14 + n), why: 'added instead of subtracting' }, { r: R(-n), why: 'dropped the minus sign in −log' }];
  } else if (kind === 'h2poh') {
    prompt = `A solution has [H⁺] = ${sciOne(n)} M. What is its pOH?`; truth = R(14 - n);
    lines = [lnF('pH = −log[H⁺]'), ln(...rich(`pH = −log(${sciOne(n)}) = ${n}`)), lnF('pOH = 14 − pH'), ln(`pOH = 14 − ${n}`)];
    wrong = [{ r: R(n), why: 'stopped at the pH' }, { r: R(14 + n), why: 'added instead of subtracting' }, { r: R(-n), why: 'dropped the minus sign in −log' }];
  } else {
    prompt = `A solution has a pH of ${n}. What is its [OH⁻]?`; truth = pw(14 - n); sciAns = true;
    lines = [lnF('pOH = 14 − pH'), ln(`pOH = 14 − ${n} = ${14 - n}`), lnF('[OH⁻] = ', pow10('−pOH')), ln(...rich(`[OH⁻] = 10^-${14 - n}`))];
    wrong = [{ r: pw(n), why: 'found [H⁺] instead' }, { r: R(p10(14 - n)), why: 'lost the minus sign on the exponent' }, { r: pw(15 - n), why: 'miscounted the exponent' }];
  }
  if (sciAns) { unitKey = 'M'; unit = 'M'; }
  const pow1 = (r) => `1 × 10^${expOf(r)}`;
  const e = sciAns ? -expOf(truth) : 0;
  const a = sciAns ? { str: pow1(truth), stated: truth, exact: truth, truth, place: null, howText: '' } : numAns(truth, { exact: true });
  const answer = `${a.str}${unit ? ` ${unit}` : ''}`;
  const lhs = kind.endsWith('poh') ? 'pOH' : kind.endsWith('ph') ? 'pH' : kind === 'ph2h' ? '[H⁺]' : '[OH⁻]';
  const work = (final) => el('div', { class: 'lab-work' },
    P(...(kind === 'ph2h' ? ['For a whole-number pH, [H⁺] = 1 × ', pow10('−pH'), ': the exponent is the pH with a minus sign.']
      : kind === 'ph2oh' ? ['First find the pOH, since pH + pOH = 14. Then [OH⁻] = 1 × ', pow10('−pOH'), ': the exponent is the pOH with a minus sign.']
      : /^(h2|oh2)/.test(kind) ? ['For [H⁺] = 1 × 10⁻ⁿ, the pH is just n: −log of 10⁻ⁿ is n. The same goes for [OH⁻] and pOH.']
        : ['pH and pOH always add up to 14 (at 25 °C).'])),
    formulaBox(...lines, final ? ln(...rich(`${lhs} = ${answer}`)) : ln(`${lhs} = ?`)),
    final ? P('So the answer is ', ansBox(...rich(answer)), '.') : note('Below 7 is acidic, 7 is neutral, above 7 is basic — a quick check on your answer.'));
  const q = numQ('ph', {
    level: lvl, prompt, note: PH_NOTE, a, how: { exact: true }, unit, unitKey, unitName: unit ? 'M (mol/L)' : '', label: lhs,
    accept: sciAns ? [`1 x 10^-${e} M`, `1e-${e} M`, `10^-${e} M`, `1 × 10^-${e}`, `${plain(truth)} M`] : [fx(truth)],
    sciKeys: sciAns,
    brief: `${lhs} = ${answer}`,
    wrong: sciAns ? [] : wrong, work,
  });
  if (sciAns) q.wrong = wrong.map((w) => ({ str: `${pow1(w.r)} M`, val: toNum(w.r), why: w.why }));
  return q;
}
const CLASS_OF = (ph) => (ph < 7 ? 'acidic' : ph > 7 ? 'basic' : 'neutral');
function genAcidBase(lvl) {
  const kind = pick(lvl === 1 ? ['h', 'h', 'oh'] : ['h', 'oh', 'poh']);
  let n = ri(1, 13);
  if (n === 7 && kind === 'poh') n = 6;
  if (kind !== 'poh' && chance(.12)) n = 7;
  const ph = kind === 'h' ? n : 14 - n;
  const given = kind === 'h' ? `[H⁺] = ${sciOne(n)} M` : kind === 'oh' ? `[OH⁻] = ${sciOne(n)} M` : `a pOH of ${n}`;
  const opt = (p, c) => `pH ${pretty(String(p))} — ${c}`;
  const answer = opt(ph, CLASS_OF(ph));
  const other = (c) => (c === 'acidic' ? 'basic' : 'acidic');
  const cands = ph === 7
    ? [opt(7, 'acidic'), opt(7, 'basic'), opt(-7, 'neutral'), opt(14, 'neutral')]
    : [opt(ph, other(CLASS_OF(ph))), opt(14 - ph, CLASS_OF(14 - ph)), opt(14 - ph, other(CLASS_OF(14 - ph)))];
  const options = shuffle([answer, ...cands.filter((o) => o !== answer).slice(0, 3)]);
  const work = (final) => el('div', { class: 'lab-work' },
    P(kind === 'h' ? `pH = −log[H⁺] = −log(1 × 10${supText(-n)}) = ${final ? ph : '?'}.`
      : kind === 'oh' ? `pOH = −log[OH⁻] = ${n}, and pH = 14 − pOH = ${final ? `14 − ${n} = ${ph}` : '?'}.`
        : `pH + pOH = 14, so pH = 14 − ${n}${final ? ` = ${ph}` : ''}.`),
    P('Below 7 is acidic, exactly 7 is neutral, above 7 is basic.'),
    final ? P('So: ', ansBox(answer), '.') : null);
  return makeQ2('acidbase', {
    level: lvl, type: 'mc', prompt: `A solution has ${given}. What is its pH, and is it acidic, basic or neutral?`,
    answer, options, value: ph, note: PH_NOTE,
    brief: `pH ${ph}: ${CLASS_OF(ph)}.`, work,
  });
}

const NEW_GENERATORS = {
  pne: genPne, avgmass: genAvgMass, config: genConfig, valence: genValence, noble: genNoble,
  formula: genFormula, naming: genNaming, balance: genBalance, rxntype: genRxType,
  molar: genMolar, moles: genMoles, pcomp: genPcomp, empirical: genEmpirical, stoich: genStoich, limiting: genLimiting, yield: genYield,
  pressure: genPressure, gaslaw: genGasLaw, ideal: genIdeal,
  molarity: genMolarity, dilution: genDilution, ph: genPh, acidbase: genAcidBase,
};

const GENERATORS = { prefix: genPrefix, temp: genTemp, avg: genAvg, sci: genSci, std: genStd, factor: genFactor, dim: genDim, ...NEW_GENERATORS };
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
    if (q.textWrong) {
      // written answers that aren't numbers (formulas, names, configurations):
      // wrong options are the classic mistakes, never one the grader accepts
      const picked = [];
      for (const w of shuffle(q.textWrong)) {
        if (w.str === q.answer || picked.some((p) => p.str === w.str) || q.gradeWith(w.plain ?? w.str).ok) continue;
        // "NaN₃" (sodium nitride with its numbers swapped) would read as a bug, not a mistake
        if (/\b(NaN|Infinity|undefined|null)\b/.test(w.str)) continue;
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
    const rights = [q.value, ...q.alts];
    const picked = [];
    for (const w of q.wrong) {
      if (!Number.isFinite(w.val) || rights.some((r) => close(r, w.val))) continue;
      if (q.gradeWith && q.gradeWith(w.str).ok) continue;
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
const LAB_SETS = new Set(SKILLS.map((s) => s.setId));
const labSetOk = (set) => !!set && (LAB_SETS.has(set.id) || set.id === 'chem-all');
function gameQuestions(setOrId) {
  const set = typeof setOrId === 'string' ? CQ.getSet(setOrId) : setOrId;
  if (!labSetOk(set)) return [];
  // every unit's skills take turns in All of Chemistry
  const here = set.id === 'chem-all' ? shuffle(SKILLS) : SKILLS.filter((s) => s.setId === set.id);
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
  if (q.gradeWith) return q.gradeWith(raw);
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
    const groups = set.id === 'chem-all' ? [...LAB_SETS].map((sid) => [sid, (CQ.getSet(sid) || {}).short || sid]) : [[set.id, '']];
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
        hintBox.append(el('p', { class: 'lab-assisted' }, el('span', { 'aria-hidden': 'true' }, '💡 '), 'Assisted — this problem won\'t count toward mastery. Finish it yourself, then try the next one on your own.'), keepUnitsIn(q.hint()));
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
      if (q.note) card.querySelector('.q-prompt')?.after(el('p', { class: 'lab-note' }, q.note));
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
      const inp = el('input', { class: 'input', type: 'text', placeholder: (q.skill === 'ph' && q.unit ? PLACEHOLDER.phConc : PLACEHOLDER[q.skill]) || 'Type your answer…', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', enterkeyhint: 'done', 'aria-label': 'Your answer' });
      const answerBtn = el('button', { type: 'button', class: 'btn primary', onclick: () => submit(false) }, 'Answer');
      const skipBtn = el('button', { type: 'button', class: 'btn ghost', onclick: () => submit(true) }, 'Don\'t know');
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(false); } });
      card.append(el('div', { class: 'written' }, inp, answerBtn, skipBtn));
      const extras = el('div', { class: 'row lab-actions' }, hintBtn);
      if (q.skill === 'sci' || q.sciKeys) {
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
          el('b', { class: 'title' }, g.ok ? `✓ ${pick(['Correct!', 'Nice!', 'You got it!', 'Exactly right.'])}` : dontKnow ? ['Here\'s how it works. The answer is ', el('span', { class: q.answer.length > 24 ? '' : 'lab-nowrap' }, ...rich(q.answer))] : ['✗ Not quite — the answer is ', el('span', { class: q.answer.length > 24 ? '' : 'lab-nowrap' }, ...rich(q.answer))]),
          g.why ? el('p', { class: 'lab-why' }, g.why) : null,
          g.tip ? el('p', { class: 'lab-why' }, g.tip) : null,
          keepUnitsIn(el('div', { class: 'exp' }, q.work(true))),
          el('div', { class: 'src' }, q.source));
        card.append(fb);
        settle(g.ok, raw, fb);
      }
    }
    keepUnitsIn(card);
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
  desc: 'Endless new practice problems — calculations, formulas and equations — each with a worked solution.',
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
    prompt: keepUnits(supPow(q.note ? `${q.prompt} ${q.note}` : q.prompt)),
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
  // the tables the Units 5–12 problems are built from, for tools/verify-lab.mjs
  // to check against its own copy
  data: { elements: PT_ROWS, cations: CATIONS, multi: MULTI, anions: ANIONS, isotopes: ISOTOPES, ionCharges: ION_CHARGES, reactions: REACTIONS, molecular: MOLECULAR },
  current: null,
  show: null,
};
})();
