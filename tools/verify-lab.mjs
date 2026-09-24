/**
 * Checks Problem Lab's generated problems (study/lab.js) against independent
 * maths written here, from the class notes, without calling lab.js's own.
 *
 *   node tools/verify-lab.mjs [baseUrl] [--n=500] [--mc=200]
 *
 * With a baseUrl (e.g. http://127.0.0.1:8111) the page is served over HTTP;
 * without one, study/index.html is opened straight from disk.
 *
 * For every skill it generates --n problems (spread over the three levels)
 * and, for each one, parses the numbers and units out of the prompt, works
 * the answer out again, and compares it within the stated rounding. It also
 * checks that the site's answer checker (CQ.checkWritten) and the Lab's
 * grader accept the canonical answer and every accepted variant but reject
 * the answer ×10 and ÷10; that each multiple-choice question has exactly one
 * right option and three distinct wrong ones; and that no text anywhere
 * contains NaN, Infinity, undefined, null or floating-point noise such as
 * 0.30000000000000004. Exits non-zero on any failure.
 *
 * Units 5–12 (atomic structure to acids and bases) are solved again by the
 * NEW solvers below from the prompt alone, using this file's own periodic
 * table, isotopes, ion and naming tables, n + l filling order and exact
 * equation balancing; the Lab's data tables (CQLab.data) are checked against
 * those copies. Each typed answer is put to the grader with its accepted
 * variants, near misses (the last counted digit ±1, ×10, ÷10, a wrong unit,
 * too few digits, wrong case, missing brackets or Roman numerals…) and more
 * precise right answers; every worked solution's fences, °C → K lines and
 * tables are re-checked, and "Show me how" must never show a boxed answer.
 */
import { fileURLToPath, pathToFileURL } from 'node:url';

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  const { execSync } = await import('node:child_process');
  const root = (process.env.NODE_PATH || '').split(':').filter(Boolean)[0]
    || execSync('npm root -g', { encoding: 'utf8' }).trim();
  ({ chromium } = await import(`file://${root}/playwright/index.mjs`));
}

const args = process.argv.slice(2);
const opt = (name, dflt) => Number((args.find((a) => a.startsWith(`--${name}=`)) || '').split('=')[1]) || dflt;
const N = opt('n', 500);
const MC = opt('mc', 200);
const base = args.find((a) => !a.startsWith('--'));
const URL_ = base
  ? `${base.replace(/\/$/, '')}/study/`
  : pathToFileURL(fileURLToPath(new URL('../study/index.html', import.meta.url))).href;

/* ---------------------------------------------------------------- numbers
   Decimal strings are compared as strings wherever the answer should be
   exact, and as floats with an explicit tolerance where it is rounded. */
const MINUS = '−';
const clean = (s) => String(s).replace(/,/g, '').replace(MINUS, '-').trim();
/** "3.54 × 10^8", "-40", "1,234.5" → Number */
function num(s) {
  const t = clean(s);
  const m = t.match(/^(-?\d*\.?\d+)(?: × 10\^(-?\d+))?$/);
  if (!m) return NaN;
  return Number(m[1]) * (m[2] != null ? 10 ** Number(m[2]) : 1);
}
/** Move the decimal point of a plain decimal string n places right (n < 0: left). */
function shift(str, n) {
  let s = clean(str);
  const neg = s.startsWith('-');
  if (neg) s = s.slice(1);
  let [i, f = ''] = s.split('.');
  let digits = i + f;
  let point = i.length + n;
  if (point < 0) { digits = '0'.repeat(-point) + digits; point = 0; }
  if (point > digits.length) digits += '0'.repeat(point - digits.length);
  let out = `${digits.slice(0, point) || '0'}${point < digits.length ? `.${digits.slice(point)}` : ''}`;
  out = out.replace(/^0+(?=\d)/, '');
  if (out.includes('.')) out = out.replace(/\.?0+$/, '');
  return (neg && out !== '0' ? '-' : '') + out;
}
const sameDecimal = (a, b) => shift(a, 0) === shift(b, 0);
const withCommas = (s) => {
  const neg = s.startsWith('-');
  let [i, f] = (neg ? s.slice(1) : s).split('.');
  if (i.length >= 4) i = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (neg ? '-' : '') + i + (f != null ? `.${f}` : '');
};
const sigDigits = (s) => clean(s).replace('-', '').replace('.', '').replace(/^0+/, '');
/** Half a unit in the 3rd significant figure of v. */
const halfUnit3 = (v) => 0.5 * 10 ** (Math.floor(Math.log10(Math.abs(v))) - 2);
const within3sf = (ans, v) => Math.abs(ans - v) <= halfUnit3(v) * (1 + 1e-9) + 1e-12;
const relClose = (a, b, tol = 1e-9) => Math.abs(a - b) <= Math.max(Math.abs(a), Math.abs(b)) * tol + 1e-12;

/* ------------------------------------------------------- the notes' facts */
// Concept 2, slide 10: the prefix chart.
const PREFIX = { M: 6, k: 3, h: 2, da: 1, '': 0, d: -1, c: -2, m: -3, 'µ': -6, n: -9 };
const PREFIX_WORD = { mega: 'M', kilo: 'k', hecto: 'h', deka: 'da', deca: 'da', deci: 'd', centi: 'c', milli: 'm', micro: 'µ', nano: 'n', '': '' };
const BASE_WORD = { meter: 'm', metre: 'm', gram: 'g', liter: 'L', litre: 'L', second: 's' };
function prefixUnit(tok) {
  const t = tok.replace(/s$/, (m) => (tok.length > 2 && /[a-z]{3,}s$/.test(tok) ? '' : m));
  for (const [w, b] of Object.entries(BASE_WORD)) {
    if (t.toLowerCase().endsWith(w)) {
      const pw = t.toLowerCase().slice(0, -w.length);
      if (pw in PREFIX_WORD) return { p: PREFIX_WORD[pw], b };
    }
  }
  for (const b of ['m', 'g', 'L', 's']) {
    if (!tok.endsWith(b)) continue;
    const p = tok.slice(0, -b.length);
    if (p in PREFIX) return { p, b };
  }
  return null;
}
// Concept 3, slide 8: the conversion table. [amount, unit, amount, unit]
const TABLE = [
  [1000, 'g', 1, 'kg'], [1, 'ounce', 28.35, 'g'], [1, 'kg', 2.2, 'lbs'], [16, 'ounce', 1, 'lbs'], [2000, 'lbs', 1, 'ton'],
  [1, 'tsp', 5, 'mL'], [1, 'cup', 236, 'mL'], [1, 'fl oz', 29.6, 'mL'], [1000, 'mL', 1, 'L'], [3, 'tsp', 1, 'Tbsp'],
  [16, 'Tbsp', 1, 'cup'], [8, 'fl oz', 1, 'cup'], [2, 'cup', 1, 'pint'], [2, 'pint', 1, 'quart'], [4, 'quart', 1, 'gallon'],
  [1, 'inch', 2.54, 'cm'], [12, 'inch', 1, 'ft'], [1, 'mile', 5280, 'ft'], [3, 'ft', 1, 'yard'],
  [60, 's', 1, 'min'], [60, 'min', 1, 'hour'], [24, 'hour', 1, 'day'], [7, 'day', 1, 'week'], [365, 'day', 1, 'year'],
];
// how units are written, singular or plural, mapped to the table's names
const NAME = {
  g: 'g', kg: 'kg', ounce: 'ounce', ounces: 'ounce', lb: 'lbs', lbs: 'lbs', ton: 'ton', tons: 'ton',
  tsp: 'tsp', Tbsp: 'Tbsp', cup: 'cup', cups: 'cup', 'fl oz': 'fl oz', mL: 'mL', L: 'L', pint: 'pint', pints: 'pint',
  quart: 'quart', quarts: 'quart', gallon: 'gallon', gallons: 'gallon', inch: 'inch', inches: 'inch', cm: 'cm', ft: 'ft',
  mile: 'mile', miles: 'mile', yard: 'yard', yards: 'yard', s: 's', min: 'min', hour: 'hour', hours: 'hour',
  day: 'day', days: 'day', week: 'week', weeks: 'week', year: 'year', years: 'year',
};
const unitOf = (s) => NAME[String(s).trim()];
const GRAPH = {};
for (const [a, ua, b, ub] of TABLE) {
  (GRAPH[ua] ||= []).push({ to: ub, mult: b / a });
  (GRAPH[ub] ||= []).push({ to: ua, mult: a / b });
}
function allRoutes(from, to, maxLen) {
  const out = [];
  const go = (u, seen, v, len) => {
    if (u === to) { out.push({ v, len }); return; }
    if (len >= maxLen) return;
    for (const e of GRAPH[u] || []) if (!seen.has(e.to)) { seen.add(e.to); go(e.to, seen, v * e.mult, len + 1); seen.delete(e.to); }
  };
  go(from, new Set([from]), 1, 0);
  return out;
}
function shortest(from, to) {
  const d = { [from]: 0 }; const q = [from];
  while (q.length) { const u = q.shift(); for (const e of GRAPH[u] || []) if (d[e.to] == null) { d[e.to] = d[u] + 1; q.push(e.to); } }
  return d;
}
const tableHas = (ta, tu, ba, bu) => TABLE.some(([a, ua, b, ub]) => (ua === tu && ub === bu && a === ta && b === ba) || (ua === bu && ub === tu && a === ba && b === ta));

/* ------------------------------------------------------ per-skill solvers
   Each returns { expect: [numbers or exact strings], unit, rounding, ... }
   worked out from the prompt alone, or throws with the reason. */
const NUMRX = String.raw`(${MINUS}|-)?[\d,]*\.?\d+`;
const solvers = {
  prefix(q) {
    let m = q.prompt.match(/^Convert (\S+) (\S+) to (\S+)\.$/);
    let given, from, to;
    if (m) { given = m[1]; from = prefixUnit(m[2]); to = prefixUnit(m[3]); }
    else {
      m = q.prompt.match(/^How many (\S+) are there in (\S+) (\S+)\?$/);
      if (!m) throw new Error('prompt not understood');
      given = m[2]; from = prefixUnit(m[3]); to = prefixUnit(m[1]);
    }
    if (!from || !to) throw new Error('unit not understood');
    if (from.b !== to.b) throw new Error('base units differ');
    return { exact: shift(given, PREFIX[from.p] - PREFIX[to.p]), unit: `${to.p}${to.b}` };
  },
  temp(q) {
    const g = q.prompt.match(new RegExp(`(${NUMRX}) (°C|°F|K)\\b`));
    const t = q.prompt.match(/ to (°C|°F|K)\.$/) || q.prompt.match(/ in (°C|°F|kelvin \(K\))\?$/);
    if (!g || !t) throw new Error('prompt not understood');
    const v = num(g[1]);
    const from = g[3];
    const to = t[1].startsWith('kelvin') ? 'K' : t[1];
    // K = °C + 273; °C = 5/9 (°F − 32); °F = (°C × 9/5) + 32
    const c = from === '°C' ? v : from === 'K' ? v - 273 : (5 / 9) * (v - 32);
    const out = to === '°C' ? c : to === 'K' ? c + 273 : (c * 9) / 5 + 32;
    return { value: out, unit: to, clean: true };
  },
  avg(q) {
    const vals = [...q.prompt.matchAll(/(\d[\d,]*(?:\.\d+)?) (cm|g|mL|s|lbs)\b/g)];
    if (vals.length < 3) throw new Error('fewer than 3 measurements found');
    const units = new Set(vals.map((x) => x[2]));
    if (units.size !== 1) throw new Error('mixed units');
    return { value: vals.reduce((a, x) => a + num(x[1]), 0) / vals.length, unit: vals[0][2], clean: true, count: vals.length };
  },
  sci(q) {
    const m = q.prompt.match(/^Write ([\d,.]+) in scientific notation\.$/);
    if (!m) throw new Error('prompt not understood');
    const s = clean(m[1]);
    const [i, f = ''] = s.split('.');
    const digits = i + f;
    const first = digits.search(/[1-9]/);
    return { sci: { digits: digits.slice(first).replace(/0+$/, ''), exp: i.length - first - 1 }, value: Number(s) };
  },
  std(q) {
    const m = q.prompt.match(/^Write (\d(?:\.\d+)?) × 10\^(-?\d+) in standard notation\.$/);
    if (!m) throw new Error('prompt not understood');
    const exact = shift(m[1], Number(m[2]));
    return { exact, commas: withCommas(exact) };
  },
  dim(q) {
    let m = q.prompt.match(/^Convert (\S+) (.+?) to (.+?)\.$/);
    let given, from, to;
    if (m) { given = num(m[1]); from = unitOf(m[2]); to = unitOf(m[3]); }
    else {
      m = q.prompt.match(/^How many (.+?) are in (\S+) (.+?)\?$/);
      if (!m) throw new Error('prompt not understood');
      given = num(m[2]); from = unitOf(m[3]); to = unitOf(m[1]);
    }
    if (!from || !to) throw new Error('unit not understood');
    const d = shortest(from, to)[to];
    if (!(d >= 1 && d <= 4)) throw new Error(`route is ${d} factors long`);
    const routes = allRoutes(from, to, d + 2);
    return { shortestValues: routes.filter((r) => r.len === d).map((r) => given * r.v), allValues: routes.map((r) => given * r.v), unit: to, len: d };
  },
  factor(q) {
    let m = q.prompt.match(/^To convert (\S+) (.+?) to (.+?) in one step, which conversion factor do you multiply by\?$/);
    if (m) {
      const from = unitOf(m[2]), to = unitOf(m[3]);
      if (!from || !to) throw new Error('unit not understood');
      return { isRight: (o) => o.bot === from && o.top === to, start: from, current: from, end: to, given: num(m[1]) };
    }
    m = q.prompt.match(/^Converting (\S+) (.+?) to (.+?)\. So far: (.+)\. Which factor comes next\?$/);
    if (!m) throw new Error('prompt not understood');
    const start = unitOf(m[2]), end = unitOf(m[3]);
    const parts = m[4].split(' × ');
    const last = parts[parts.length - 1];
    const lf = last.startsWith('(') ? parseFactor(last.slice(1, -1)) : null;
    const current = lf ? lf.top : start;
    if (!current || !end) throw new Error('unit not understood');
    // Any factor that cancels the current unit and can still reach the end
    // without revisiting a unit already in the fence is a right next step.
    const used = new Set([start, ...parts.slice(1).map((p) => parseFactor(p.slice(1, -1))?.top)]);
    const onward = (u) => {
      if (used.has(u)) return false;
      const seen = new Set([...used, u]); const stack = [u];
      while (stack.length) { const x = stack.pop(); if (x === end) return true; for (const e of GRAPH[x] || []) if (!seen.has(e.to)) { seen.add(e.to); stack.push(e.to); } }
      return false;
    };
    return { isRight: (o) => o.bot === current && onward(o.top), chain: true, start, current, end };
  },
};
function parseFactor(s) {
  const m = s.match(/^([\d,.]+) (.+?) \/ ([\d,.]+) (.+)$/);
  if (!m) return null;
  const top = unitOf(m[2]), bot = unitOf(m[4]);
  return { ta: num(m[1]), top, ba: num(m[3]), bot, real: top && bot && tableHas(num(m[1]), top, num(m[3]), bot) };
}
/** Split "8.22 ft" / "3.54 × 10^8" / "-40 °C" into number text and unit. */
function splitAnswer(a) {
  const m = String(a).match(/^(-?[\d,]*\.?\d+(?: × 10\^-?\d+)?)(?: (.+))?$/);
  return m ? { n: m[1], unit: m[2] || '' } : null;
}
const unitMatches = (skill, got, want) => {
  if (skill === 'dim') return unitOf(got) === want;
  return got === want;
};

/** The notes round to 3 digits; the Lab says so in the problem's note. */
const ROUNDED = (q) => /keep 3 digits/.test(q.note || '');

/* ---------------------------------------------------------- the checks */
const FLOAT_NOISE = (text, typed = false) => {
  const bad = [];
  if (/\b(NaN|Infinity|undefined|null)\b|\[object /.test(text)) bad.push('NaN/Infinity/undefined/null in text');
  // "3.54e8" is a deliberate accepted way to type an answer, never shown text
  if (!typed && /\d[eE][-+]?\d/.test(text)) bad.push(`JavaScript e-notation in text: ${text.match(/\S*\d[eE][-+]?\d\S*/)[0]}`);
  for (const tok of text.match(/\d[\d,]*\.\d+|\d[\d,]{12,}/g) || []) {
    if (sigDigits(tok).replace(/0+$/, '').length >= 13) bad.push(`float noise "${tok}"`);
  }
  return bad;
};

/** Returns a list of problems with one generated question. */
function checkQuestion(q, mc) {
  const problems = [];
  const texts = [q.prompt, q.note, q.answer, ...(q.options || []), q.exp, q.hint, q.source].filter((x) => x != null);
  for (const t of texts) problems.push(...FLOAT_NOISE(String(t)));
  for (const t of q.accept || []) problems.push(...FLOAT_NOISE(String(t), true));
  let sol;
  try { sol = solvers[q.skill](q); } catch (e) { return [...problems, `solver: ${e.message}`]; }

  if (q.skill === 'factor' || (mc && q.type === 'mc')) {
    if (!Array.isArray(q.options) || q.options.length !== 4) return [...problems, `expected 4 options, got ${q.options && q.options.length}`];
    if (new Set(q.options).size !== 4) problems.push('two options say the same thing');
    if (!q.options.includes(q.answer)) problems.push('the answer is not among the options');
  }

  if (q.skill === 'factor') {
    const parsed = q.options.map((o) => ({ o, f: parseFactor(o) }));
    if (parsed.some((p) => !p.f || !p.f.top || !p.f.bot)) return [...problems, `option not understood: ${parsed.find((p) => !p.f || !p.f.top || !p.f.bot).o}`];
    const right = parsed.filter((p) => p.f.real && sol.isRight(p.f));
    if (right.length !== 1) problems.push(`${right.length} options are right (${right.map((p) => p.o).join(' | ')})`);
    else if (right[0].o !== q.answer) problems.push(`the right option is "${right[0].o}", not "${q.answer}"`);
    if (!parseFactor(q.answer)?.real) problems.push(`the answer "${q.answer}" is not a row of the notes' table`);
    return problems;
  }

  // what counts as right, as a predicate on a number (+ the answer's unit)
  let rightNum, unit = sol.unit;
  if (sol.exact != null) rightNum = (n) => relClose(n, Number(sol.exact));
  else if (sol.sci) rightNum = (n) => relClose(n, sol.value);
  else if (sol.shortestValues) rightNum = (n, loose) => (loose ? sol.allValues : sol.shortestValues).some((v) => relClose(n, v) || within3sf(n, v));
  else rightNum = (n) => relClose(n, sol.value);

  const a = splitAnswer(q.answer);
  if (!a) return [...problems, `answer "${q.answer}" not understood`];
  if (unit != null && q.skill !== 'sci' && q.skill !== 'std' && !unitMatches(q.skill, a.unit, unit)) problems.push(`answer unit "${a.unit}" but the prompt asks for ${unit}`);

  // the canonical answer, exactly as the notes' method gives it
  if (q.skill === 'prefix' || q.skill === 'std') {
    if (!sameDecimal(a.n, sol.exact)) problems.push(`answer ${a.n}, expected ${sol.exact}`);
    if (clean(a.n) !== shift(sol.exact, 0) && a.n !== withCommas(shift(sol.exact, 0))) problems.push(`answer ${a.n} is not written plainly`);
    if (q.skill === 'std' && a.n !== sol.commas) problems.push(`answer ${a.n}, expected ${sol.commas} (with commas)`);
  } else if (q.skill === 'sci') {
    const m = a.n.match(/^(\d)(?:\.(\d+))? × 10\^(-?\d+)$/);
    if (!m) problems.push(`answer "${q.answer}" is not in the format "3.54 × 10^8"`);
    else {
      if (m[1] === '0') problems.push('coefficient starts with 0');
      if ((m[1] + (m[2] || '')).replace(/0+$/, '') !== sol.sci.digits) problems.push(`coefficient digits ${m[1]}${m[2] || ''}, expected ${sol.sci.digits}`);
      if (Number(m[3]) !== sol.sci.exp) problems.push(`exponent ${m[3]}, expected ${sol.sci.exp}`);
    }
  } else if (q.skill === 'dim') {
    const n = num(a.n);
    const rounded = ROUNDED(q);
    if (rounded) {
      if (!sol.shortestValues.some((v) => within3sf(n, v))) problems.push(`answer ${a.n} is not any shortest route's value to 3 s.f. (${sol.shortestValues.map((v) => v.toPrecision(6)).join(', ')})`);
      if (sigDigits(a.n).replace(/0+$/, '').length > 3) problems.push(`answer ${a.n} has more than 3 significant figures`);
    } else if (!sol.shortestValues.some((v) => relClose(n, v))) problems.push(`answer ${a.n} is not exact for a shortest route (${sol.shortestValues.join(', ')})`);
  } else {
    const n = num(a.n);
    if (!relClose(n, sol.value)) problems.push(`answer ${a.n}, expected ${sol.value}`);
    if (sol.clean && (clean(a.n).split('.')[1] || '').length > 2) problems.push(`answer ${a.n} is not a clean number`);
  }
  if (typeof q.value !== 'number' || !Number.isFinite(q.value)) problems.push('missing numeric value');
  else if (!relClose(q.value, num(a.n), 1e-12)) problems.push(`value ${q.value} disagrees with the answer ${a.n}`);

  if (mc) {
    const vals = q.options.map((o) => ({ o, s: splitAnswer(o) }));
    if (vals.some((v) => !v.s)) return [...problems, `option not understood: ${vals.find((v) => !v.s).o}`];
    const right = vals.filter((v) => rightNum(num(v.s.n), true));
    if (right.length !== 1) problems.push(`${right.length} options are right: ${right.map((v) => v.o).join(' | ')}`);
    const ansN = num(a.n);
    for (const v of vals) {
      if (v.o === q.answer) continue;
      if (relClose(num(v.s.n), ansN, 0.006)) problems.push(`option "${v.o}" is numerically the answer`);
      if (q.skill === 'dim' ? unitOf(v.s.unit) !== unitOf(a.unit) : v.s.unit !== a.unit) problems.push(`option "${v.o}" has a different unit`);
    }
    if (new Set(vals.map((v) => num(v.s.n))).size !== 4) problems.push('two options have the same value');
  }
  return problems;
}
/** Inputs a checker must accept or reject for a typed-answer question. */
function checkInputs(q) {
  const a = splitAnswer(q.answer);
  const reqs = [{ input: q.answer, expect: true, why: 'canonical answer' }];
  for (const x of q.accept || []) reqs.push({ input: x, expect: true, why: `accepted variant "${x}"` });
  if (q.value !== 0 && a) {
    const times = (k) => {
      const sci = a.n.match(/^(.+) × 10\^(-?\d+)$/);
      const n = sci ? `${sci[1]} × 10^${Number(sci[2]) + k}` : shift(a.n, k);
      return a.unit ? `${n} ${a.unit}` : n;
    };
    reqs.push({ input: times(1), expect: false, why: 'answer ×10' }, { input: times(-1), expect: false, why: 'answer ÷10' });
  }
  // Near misses: a slip in the last digit is a wrong answer. Where the answer
  // is exact, nothing but the exact value will do; a rounded answer may be
  // off only by its own rounding. (grader: the core checker allows 0.6% by
  // design, so these are put to the Lab's grader only.)
  if (a && q.value !== 0) {
    const u = a.unit ? ` ${a.unit}` : '';
    const sci = a.n.match(/^(.+) × 10\^(-?\d+)$/);
    const body = clean(sci ? sci[1] : a.n);
    const dec = (body.split('.')[1] || '').length;
    const lastNZ = dec ? 0 : body.replace('-', '').length - body.replace('-', '').replace(/0+$/, '').length;
    const nudges = [...new Set([-dec, lastNZ])].flatMap((k) => [k, k]).map((k, i) => (i % 2 ? -1 : 1) * 10 ** k);
    const rounded = ROUNDED(q);
    const sol = q.skill === 'dim' ? solvers.dim(q) : null;
    for (const d of nudges) {
      const v = Number(body) + d;
      if (!(v > 0) && Number(body) > 0) continue;
      const txt = Number(v.toFixed(Math.max(dec, 0))).toFixed(dec);
      const input = sci ? `${txt} × 10^${sci[2]}${u}` : `${txt}${u}`;
      const full = sci ? Number(txt) * 10 ** Number(sci[2]) : Number(txt);
      // another route through the table may round to this value: then it is right
      // (a route that needs rounding is written to 3 digits, whatever the canonical answer)
      const alsoRight = sol && sol.allValues.some((x) => relClose(full, x) || within3sf(full, x));
      if (!alsoRight) reqs.push({ input, expect: false, grader: true, why: `near miss (${d > 0 ? '+' : ''}${d})` });
    }
    if (q.skill === 'dim' && rounded) {
      // more digits than asked for, every one right: fine; fewer: not what the notes do
      const best = sol.shortestValues.find((x) => within3sf(num(a.n), x));
      if (best != null) reqs.push({ input: `${Number(best.toPrecision(5))}${u}`, expect: true, grader: true, why: 'the answer to 5 digits' });
      const two = Number(Number(num(a.n)).toPrecision(2));
      if (!sol.allValues.some((x) => relClose(two, x) || within3sf(two, x)) && sigDigits(String(two)).replace(/0+$/, '').length < 3) {
        reqs.push({ input: `${two}${u}`, expect: false, grader: true, why: 'rounded to 2 digits' });
      }
    }
    // "6 100 s": a space between digit groups is a thousands separator
    if (!sci && /^\d{1,3}(,\d{3})+/.test(a.n)) reqs.push({ input: `${a.n.replace(/,/g, ' ')}${u}`, expect: true, grader: true, why: 'spaces as thousands separators' });
  }
  // a Mega/milli mix-up is a different answer even though the letters match
  if (q.skill === 'prefix' && /^[Mm]./.test(a.unit)) {
    const swapped = (a.unit[0] === 'M' ? 'm' : 'M') + a.unit.slice(1);
    reqs.push({ input: `${a.n} ${swapped}`, expect: false, grader: true, why: `wrong prefix case ${swapped}` });
  }
  return reqs;
}

/* ------------------------------------------------ worked solutions
   A worked solution that teaches a wrong step is as bad as a wrong answer,
   so every claim it makes is re-checked here: the fence's factors, what it
   cancels and its products; each temperature formula line; the hop count
   and its direction; the averaging; the arithmetic and the rounding. */
const PM = (s) => String(s).replace(/[−–]/g, '-');
/** Evaluate a line of plain arithmetic from a worked solution. */
function evalArith(s) {
  const e = PM(s).replace(/×/g, '*').replace(/÷/g, '/').replace(/,/g, '').replace(/(\d|\))\s*\(/g, '$1*(');
  if (!/^[\d.\s+\-*/()]+$/.test(e)) throw new Error(`not arithmetic: ${s}`);
  return Function(`"use strict"; return (${e});`)();
}
const cellOf = (t) => { const m = String(t).match(/^([\d,.]+) (.+)$/); return m ? { amt: num(m[1]), unit: m[2] } : null; };
function checkFence(f, { kind, given, givenUnit, target, answer, rounded, where }) {
  const bad = [];
  const say = (m) => bad.push(`${where}: ${m}`);
  const key = (u) => (kind === 'prefix' ? (prefixUnit(u) ? `${prefixUnit(u).p}${prefixUnit(u).b}` : null) : unitOf(u));
  if (f.rows.length !== 2) return [`${where}: the fence has ${f.rows.length} rows`];
  const [top, bot] = f.rows;
  if (top.length !== bot.length) return [`${where}: the fence's rows have different lengths`];
  const g = cellOf(top[0].text);
  if (!g || !relClose(g.amt, given) || key(g.unit) !== givenUnit) say(`the fence starts with "${top[0].text}", not the given amount`);
  if (bot[0].text !== '') say('something is under the given amount');
  let cur = givenUnit, topProd = given, botProd = 1, lastTopText = g && g.unit;
  const n = top.length;
  if (top[0].struck !== (n > 1 && !top[1].blank)) say(`the given unit is ${top[0].struck ? '' : 'not '}struck through`);
  for (let i = 1; i < n; i++) {
    if (top[i].blank || bot[i].blank) { if (!(top[i].blank && bot[i].blank)) say('half a blank factor'); if (i !== n - 1) say('a blank factor is not the last'); continue; }
    const t = cellOf(top[i].text), b = cellOf(bot[i].text);
    if (!t || !b) { say(`factor ${i} not understood: ${top[i].text} / ${bot[i].text}`); continue; }
    const tk = key(t.unit), bk = key(b.unit);
    if (!tk || !bk) { say(`factor ${i} has a unit not understood: ${t.unit} / ${b.unit}`); continue; }
    let valid;
    if (kind === 'prefix') {
      const P1 = prefixUnit(t.unit), P2 = prefixUnit(b.unit);
      valid = P1.b === P2.b && (P1.p === '' || P2.p === '') && (t.amt === 1 || b.amt === 1)
        && relClose(t.amt * 10 ** PREFIX[P1.p], b.amt * 10 ** PREFIX[P2.p]);
    } else valid = tableHas(t.amt, tk, b.amt, bk);
    if (!valid) say(`factor ${top[i].text} / ${bot[i].text} is not a row of the notes' ${kind === 'prefix' ? 'prefix chart' : 'table'}`);
    if (bk !== cur) say(`factor ${i} has ${b.unit} on the bottom, but the unit to cancel is ${cur}`);
    if (!bot[i].struck) say(`the bottom unit ${b.unit} of factor ${i} is not struck through`);
    if (top[i].struck !== (i + 1 < n && !top[i + 1].blank)) say(`the top unit ${t.unit} of factor ${i} is ${top[i].struck ? '' : 'not '}struck through`);
    cur = tk; topProd *= t.amt; botProd *= b.amt; lastTopText = t.unit;
  }
  if (target && cur !== target) say(`the fence ends in ${cur}, not ${target}`);
  if (f.eq) {
    const nm = cellOf(f.eq.num);
    if (!nm || !relClose(nm.amt, topProd)) say(`the top line multiplies to ${topProd}, but the fence shows ${f.eq.num}`);
    else if (key(nm.unit) !== cur) say(`the top line's unit is ${nm.unit}, expected ${cur}`);
    if (!relClose(num(f.eq.den), botProd)) say(`the bottom line multiplies to ${botProd}, but the fence shows ${f.eq.den}`);
    if (answer != null && f.eq.ans !== answer) say(`the fence's answer "${f.eq.ans}" is not the answer "${answer}"`);
    const a = splitAnswer(f.eq.ans);
    const v = topProd / botProd;
    if (!a || !(rounded ? within3sf(num(a.n), v) : relClose(num(a.n), v))) say(`${f.eq.num} ÷ ${f.eq.den} is ${v}, but the fence says ${f.eq.ans}`);
  }
  return bad;
}

const FORMULA = {
  c2k: ['K = °C + 273'], k2c: ['K = °C + 273, so °C = K − 273'], c2f: ['°F = (°C × 9/5) + 32'],
  f2c: ['°C = 5/9 (°F − 32)'], f2k: ['°C = 5/9 (°F − 32)', 'Then K = °C + 273'],
};
function checkTemp(q, w, hw) {
  const bad = [];
  const g = q.prompt.match(new RegExp(`(${NUMRX}) (°C|°F|K)\\b`));
  const to = (q.prompt.match(/ to (°C|°F|K)\.$/) || q.prompt.match(/ in (°C|°F|kelvin \(K\))\?$/))[1].replace(/^kelvin.*/, 'K');
  const from = g[3];
  const kind = { '°C>K': 'c2k', 'K>°C': 'k2c', '°C>°F': 'c2f', '°F>°C': 'f2c', '°F>K': 'f2k' }[`${from}>${to}`];
  if (!kind) return [`no notes' route from ${from} to ${to}`];
  const heads = w.formula.filter((l) => /[°K]/.test(l.split(' = ').slice(1).join(' = ').replace(/ (°C|°F|K)$/, '')) || /^Then /.test(l));
  if (JSON.stringify(heads) !== JSON.stringify(FORMULA[kind])) bad.push(`formula lines ${JSON.stringify(heads)}, expected the notes' ${JSON.stringify(FORMULA[kind])}`);
  // walk the lines: each formula, then the number put in, then working to a value
  let input = g[1], i = 0, value = null;
  const truth = [];
  const v0 = num(g[1]);
  const c = from === '°C' ? v0 : from === 'K' ? v0 - 273 : (5 / 9) * (v0 - 32);
  if (kind === 'f2k') truth.push(c, c + 273);
  else truth.push(to === '°C' ? c : to === 'K' ? c + 273 : (c * 9) / 5 + 32);
  for (let b = 0; b < FORMULA[kind].length; b++) {
    const f = w.formula[i++] || '';
    const rhs = f.replace(/^Then /, '').split(', so ').pop().split(' = ')[1] || '';
    const lhs = f.replace(/^Then /, '').split(', so ').pop().split(' = ')[0];
    const v = (rhs.match(/°C|°F|K/) || [])[0];
    const sub = w.formula[i++] || '';
    if (sub !== `${lhs} = ${rhs.replace(v, input)}`) bad.push(`"${sub}" is not "${lhs} = ${rhs}" with ${input} put in for ${v}`);
    let prev = null;
    try { prev = evalArith(sub.split(' = ')[1]); } catch (e) { bad.push(e.message); }
    // following lines until the next formula line (or the end) must keep the same value
    while (i < w.formula.length && !/^Then /.test(w.formula[i])) {
      const ln = w.formula[i++];
      const [l, r] = ln.split(' = ');
      if (l !== lhs) bad.push(`"${ln}" should work out ${lhs}`);
      const m = r.match(/^(.+?)(?: (°C|°F|K))?$/);
      let val;
      try { val = evalArith(m[1]); } catch (e) { bad.push(e.message); continue; }
      if (prev != null && !relClose(val, prev)) bad.push(`"${ln}" does not follow from the line before (${prev})`);
      prev = val;
      if (m[2]) { value = val; input = m[1]; if (m[2] !== lhs) bad.push(`"${ln}" ends in the wrong unit`); }
    }
    if (value == null || !relClose(value, truth[b])) bad.push(`step ${b + 1} of the working ends at ${value}, but the formula gives ${truth[b]}`);
    value = null;
  }
  const last = w.formula[w.formula.length - 1] || '';
  if (!PM(last).endsWith(`= ${PM(q.answer)}`)) bad.push(`the working ends "${last}", not the answer ${q.answer}`);
  if (hw && (hw.formula[0] !== w.formula[0] || hw.formula[1] !== w.formula[1])) bad.push('"Show me how" starts differently from the worked solution');
  return bad;
}

function checkWork(q, sol) {
  const w = q.work;
  if (!w) return ['no worked solution'];
  const bad = [];
  const steps = w.steps.join(' | ');
  const rounded = ROUNDED(q);
  if (q.skill === 'dim') {
    const m = q.prompt.match(/^Convert (\S+) (.+?) to (.+?)\.$/) || q.prompt.match(/^How many (.+?) are in (\S+) (.+?)\?$/);
    const [G, from, to] = m[0].startsWith('Convert') ? [num(m[1]), unitOf(m[2]), unitOf(m[3])] : [num(m[2]), unitOf(m[3]), unitOf(m[1])];
    if (w.fences.length !== 1) return [`${w.fences.length} fences in the worked solution`];
    const f = w.fences[0];
    bad.push(...checkFence(f, { kind: 'dim', given: G, givenUnit: from, target: to, answer: q.answer, rounded, where: 'fence' }));
    const ncol = f.rows[0].length - 1;
    if (ncol !== sol.len) bad.push(`the fence has ${ncol} factors but the shortest route has ${sol.len}`);
    for (const hf of (q.hintWork?.fences || [])) bad.push(...checkFence(hf, { kind: 'dim', given: G, givenUnit: from, target: to, where: 'hint fence' }));
    // the listed rows of the table
    const items = w.steps.filter((t) => / with .+ on the bottom/.test(t));
    if (items.length !== ncol) bad.push(`${items.length} table rows are listed for ${ncol} factors`);
    items.forEach((t, i) => {
      const r = t.match(/^([\d,.]+) (.+?) = ([\d,.]+) (.+?), with (.+?) on the bottom/);
      if (!r || !tableHas(num(r[1]), unitOf(r[2]), num(r[3]), unitOf(r[4]))) bad.push(`"${t}" is not a row of the notes' table`);
      else if (unitOf(r[5]) !== unitOf(cellOf(f.rows[1][i + 1].text)?.unit)) bad.push(`"${t}" puts ${r[5]} on the bottom, but the fence has ${f.rows[1][i + 1].text}`);
    });
    const tb = steps.match(/Top: ([\d,.× ]+) = ([\d,.]+)\. Bottom: ([\d,.× ]+) = ([\d,.]+)\./);
    if (!tb) bad.push('no "Top: … Bottom: …" line');
    else {
      const prod = (x) => x.split(' × ').reduce((a, y) => a * num(y), 1);
      if (!relClose(prod(tb[1]), num(tb[2]))) bad.push(`Top: ${tb[1]} is ${prod(tb[1])}, not ${tb[2]}`);
      if (!relClose(prod(tb[3]), num(tb[4]))) bad.push(`Bottom: ${tb[3]} is ${prod(tb[3])}, not ${tb[4]}`);
      const tops = [f.rows[0][0], ...f.rows[0].slice(1)].map((c) => cellOf(c.text)?.amt);
      const bots = f.rows[1].slice(1).map((c) => cellOf(c.text)?.amt);
      if (tb[1].split(' × ').map(num).join() !== tops.join()) bad.push(`"Top: ${tb[1]}" is not the fence's top line`);
      if (tb[3].split(' × ').map(num).join() !== bots.join()) bad.push(`"Bottom: ${tb[3]}" is not the fence's bottom line`);
      const dv = steps.match(/([\d,.]+) ÷ ([\d,.]+) = ([\d,.]+)(…)?/);
      if (rounded) {
        if (!dv) bad.push('no "÷" line for a rounded answer');
        else {
          const v = num(dv[1]) / num(dv[2]);
          const z = clean(dv[3]);
          const unit = 10 ** -((z.split('.')[1] || '').length);
          if (num(dv[1]) !== num(tb[2]) || num(dv[2]) !== num(tb[4])) bad.push('the "÷" line does not divide the top by the bottom');
          if (dv[4] ? !(num(z) <= v * (1 + 1e-12) && v - num(z) < unit * (1 + 1e-9)) : !relClose(num(z), v)) bad.push(`${dv[1]} ÷ ${dv[2]} is ${v}, not ${dv[3]}${dv[4] || ''}`);
          const e = Math.floor(Math.log10(v));
          const four = String(Math.floor(v / 10 ** (e - 3) + 1e-7)).padStart(4, '0');
          const rr = steps.match(/keep 3 digits, counting from the first digit that isn't 0 \((\d), (\d), (\d)\)\. The next digit is (\d), which is (5 or more, so round up|less than 5, so leave the 3rd digit as it is): ([^|]+?)\.\s*(?:\||$)/);
          if (!rr) bad.push('no rounding step');
          else {
            if (rr.slice(1, 5).join('') !== four) bad.push(`the rounding step reads digits ${rr.slice(1, 5).join('')}, but ${v} starts ${four}`);
            if ((Number(rr[4]) >= 5) !== /round up/.test(rr[5])) bad.push('the rounding step rounds the wrong way');
            const want = (Number(four.slice(0, 3)) + (Number(four[3]) >= 5 ? 1 : 0)) * 10 ** (e - 2);
            if (!relClose(num(splitAnswer(rr[6])?.n), want, 1e-9) || rr[6] !== q.answer) bad.push(`the rounding step ends at ${rr[6]}, expected ${want}`);
          }
        }
      } else if (dv) bad.push('a "÷ … rounds" line on an exact answer');
    }
    const far = steps.match(/Going a different way through the table \((.+?)\) gives (\S+) (.+?) — that is right too/);
    if (far && !sol.allValues.some((x) => within3sf(num(far[2]), x))) bad.push(`the other route's answer ${far[2]} is not any route's value`);
  } else if (q.skill === 'prefix') {
    const m = q.prompt.match(/^Convert (\S+) (\S+) to (\S+)\.$/) || q.prompt.match(/^How many (\S+) are there in (\S+) (\S+)\?$/);
    const [G, fu, tu] = m[0].startsWith('Convert') ? [m[1], m[2], m[3]] : [m[2], m[3], prefixUnit(m[1]) && `${prefixUnit(m[1]).p}${prefixUnit(m[1]).b}`];
    const F = prefixUnit(fu), T = prefixUnit(tu);
    const fk = `${F.p}${F.b}`, tk = `${T.p}${T.b}`;
    if (w.fences.length !== 1) return [`${w.fences.length} fences in the worked solution`];
    bad.push(...checkFence(w.fences[0], { kind: 'prefix', given: num(G), givenUnit: fk, target: tk, answer: q.answer, rounded: false, where: 'fence' }));
    const ncol = w.fences[0].rows[0].length - 1;
    const wantCols = F.p && T.p ? 2 : 1;
    if (ncol !== wantCols) bad.push(`${ncol} factors in the fence, expected ${wantCols} (through the base unit)`);
    for (const hf of (q.hintWork?.fences || [])) bad.push(...checkFence(hf, { kind: 'prefix', given: num(G), givenUnit: fk, target: tk, where: 'hint fence' }));
    for (const cl of steps.matchAll(/the chart says ([\d,]+) (\S+) = ([\d,]+) (\S+), so/g)) {
      const a = prefixUnit(cl[2]), b = prefixUnit(cl[4]);
      if (!a || !b || !relClose(num(cl[1]) * 10 ** PREFIX[a.p], num(cl[3]) * 10 ** PREFIX[b.p])) bad.push(`"${cl[0]}" is not what the prefix chart says`);
    }
    const d = PREFIX[F.p] - PREFIX[T.p];
    const mv = steps.match(/the decimal moved (\d+) places? (right|left)/);
    if (!mv || Number(mv[1]) !== Math.abs(d) || (mv[2] === 'right') !== (d > 0)) bad.push(`the decimal should move ${Math.abs(d)} places ${d > 0 ? 'right' : 'left'}: "${mv ? mv[0] : 'missing'}"`);
    const cf = w.chart.find((c) => c.from), ct = w.chart.find((c) => c.to);
    const lab = (p) => (p.p ? p.p : p.b);
    if (!cf || !ct || cf.label !== lab(F) || ct.label !== lab(T)) bad.push(`the chart marks ${cf?.label} → ${ct?.label}, expected ${lab(F)} → ${lab(T)}`);
  } else if (q.skill === 'temp') {
    bad.push(...checkTemp(q, w, q.hintWork));
  } else if (q.skill === 'avg') {
    const f = (w.formula[0] || '').match(/^(.+) over (\d+) = (.+) over (\d+) = (.+)$/);
    if (!f) return [`average working not understood: ${w.formula[0]}`];
    const listed = f[1].split(' + ').map((x) => num(x.split(' ')[0]));
    const given = [...q.prompt.matchAll(/(\d[\d,]*(?:\.\d+)?) (cm|g|mL|s|lbs)\b/g)].map((x) => num(x[1]));
    if (listed.join() !== given.join()) bad.push(`the working adds ${listed.join(', ')}, but the problem gives ${given.join(', ')}`);
    if (Number(f[2]) !== given.length || Number(f[4]) !== given.length) bad.push(`divides by ${f[2]}/${f[4]} for ${given.length} values`);
    const sum = given.reduce((a, b) => a + b, 0);
    if (!relClose(num(f[3].split(' ')[0]), sum)) bad.push(`the sum is ${sum}, not ${f[3]}`);
    if (f[5] !== q.answer || !relClose(num(f[5].split(' ')[0]), sum / given.length)) bad.push(`${sum} ÷ ${given.length} is not ${f[5]}`);
  } else if (q.skill === 'sci' || q.skill === 'std') {
    const e = q.skill === 'sci' ? sol.sci.exp : Number(q.prompt.match(/10\^(-?\d+)/)[1]);
    const n = Math.abs(e);
    if (w.hops !== n) bad.push(`${w.hops} hops are drawn, but the decimal moves ${n} places`);
    if (q.skill === 'sci') {
      const r = steps.match(/The decimal moves (\d+) places? (left|right), so the exponent is ([+−-])(\d+)\./);
      if (!r || Number(r[1]) !== n || Number(r[4]) !== n || (r[2] === 'left') !== (e > 0) || (r[3] === '+') !== (e > 0)) bad.push(`the narration "${r ? r[0] : 'missing'}" does not match an exponent of ${e}`);
      if (e > 0 ? !/big number \(> 1\), so the exponent is \+/.test(steps) : !/small number \(< 1\), so the exponent is −/.test(steps)) bad.push('the big/small number rule is stated wrongly');
    } else {
      const r = steps.match(/The exponent is ([+−-])(\d+): move the decimal (\d+) places? (right|left)/);
      if (!r || Number(r[2]) !== n || Number(r[3]) !== n || (r[4] === 'right') !== (e > 0) || (r[1] === '+') !== (e > 0)) bad.push(`the narration "${r ? r[0] : 'missing'}" does not match an exponent of ${e}`);
    }
    const ln = (w.formula[0] || '').replace(/10 to the power (\S+)/g, (_, x) => `10^${PM(x)}`);
    const want = q.skill === 'sci' ? `${q.prompt.match(/^Write (\S+)/)[1]} = ${q.answer}` : `${q.prompt.match(/^Write (.+) in standard/)[1]} = ${q.answer}`;
    if (ln !== want) bad.push(`the working ends "${ln}", expected "${want}"`);
  } else if (q.skill === 'factor') {
    const m = q.prompt.match(/^(?:To convert|Converting) (\S+) (.+?) to /);
    const f = w.fences[w.fences.length - 1];
    if (!f) return ['no fence in the worked solution'];
    bad.push(...checkFence(f, { kind: 'dim', given: num(m[1]), givenUnit: unitOf(m[2]), target: null, answer: null, rounded: true, where: 'fence' }));
    const lastT = cellOf(f.rows[0][f.rows[0].length - 1].text), lastB = cellOf(f.rows[1][f.rows[1].length - 1].text);
    const pa = parseFactor(q.answer);
    if (!lastT || !pa || lastT.amt !== pa.ta || unitOf(lastT.unit) !== pa.top || lastB.amt !== pa.ba || unitOf(lastB.unit) !== pa.bot) bad.push('the fence\'s last factor is not the answer');
    const ts = steps.match(/The table says ([\d,.]+) (.+?) = ([\d,.]+) (.+?), so the factor is/);
    if (!ts || !tableHas(num(ts[1]), unitOf(ts[2]), num(ts[3]), unitOf(ts[4]))) bad.push(`"${ts ? ts[0] : 'The table says'}" is not a row of the notes' table`);
    for (const hf of (q.hintWork?.fences || [])) bad.push(...checkFence(hf, { kind: 'dim', given: num(m[1]), givenUnit: unitOf(m[2]), target: null, where: 'hint fence' }));
  }
  return bad;
}

/* =====================================================================
   Units 5–12. Everything here is typed separately from study/lab.js: the
   periodic table, real isotopes, ion charges, the ion and naming tables,
   the sublevel filling order (worked out from the n + l rule instead of
   listed), and the arithmetic. The Lab's own tables are checked against
   these copies (see checkData), and every problem is solved again from
   its prompt alone.
   ===================================================================== */
// symbol: [atomic number, name, atomic mass to two decimals]
const VPT = {
  H: [1, 'hydrogen', 1.01], He: [2, 'helium', 4.00], Li: [3, 'lithium', 6.94], Be: [4, 'beryllium', 9.01], B: [5, 'boron', 10.81],
  C: [6, 'carbon', 12.01], N: [7, 'nitrogen', 14.01], O: [8, 'oxygen', 16.00], F: [9, 'fluorine', 19.00], Ne: [10, 'neon', 20.18],
  Na: [11, 'sodium', 22.99], Mg: [12, 'magnesium', 24.31], Al: [13, 'aluminum', 26.98], Si: [14, 'silicon', 28.09], P: [15, 'phosphorus', 30.97],
  S: [16, 'sulfur', 32.07], Cl: [17, 'chlorine', 35.45], Ar: [18, 'argon', 39.95], K: [19, 'potassium', 39.10], Ca: [20, 'calcium', 40.08],
  Sc: [21, 'scandium', 44.96], Ti: [22, 'titanium', 47.87], V: [23, 'vanadium', 50.94], Cr: [24, 'chromium', 52.00], Mn: [25, 'manganese', 54.94],
  Fe: [26, 'iron', 55.85], Co: [27, 'cobalt', 58.93], Ni: [28, 'nickel', 58.69], Cu: [29, 'copper', 63.55], Zn: [30, 'zinc', 65.38],
  Ga: [31, 'gallium', 69.72], Ge: [32, 'germanium', 72.63], As: [33, 'arsenic', 74.92], Se: [34, 'selenium', 78.97], Br: [35, 'bromine', 79.90],
  Kr: [36, 'krypton', 83.80], Rb: [37, 'rubidium', 85.47], Sr: [38, 'strontium', 87.62], Ag: [47, 'silver', 107.87], Sn: [50, 'tin', 118.71],
  I: [53, 'iodine', 126.90], Xe: [54, 'xenon', 131.29], Ba: [56, 'barium', 137.33], Au: [79, 'gold', 196.97], Hg: [80, 'mercury', 200.59],
  Pb: [82, 'lead', 207.20],
};
const SYM_OF = Object.fromEntries(Object.entries(VPT).map(([s, [, n]]) => [n, s]));
const SYM_OF_Z = Object.fromEntries(Object.entries(VPT).map(([s, [z]]) => [z, s]));
const HUND = (sym) => Math.round(VPT[sym][2] * 100);
// Mass numbers of real, known isotopes (more than the Lab uses).
const V_ISO = {
  H: [1, 2, 3], He: [3, 4], Li: [6, 7], Be: [9, 10], B: [10, 11], C: [12, 13, 14], N: [14, 15], O: [16, 17, 18], F: [19], Ne: [20, 21, 22],
  Na: [22, 23, 24], Mg: [24, 25, 26], Al: [26, 27], Si: [28, 29, 30], P: [31, 32], S: [32, 33, 34, 36], Cl: [35, 36, 37], Ar: [36, 38, 40],
  K: [39, 40, 41], Ca: [40, 42, 43, 44, 46, 48], Sc: [45], Ti: [46, 47, 48, 49, 50], V: [50, 51], Cr: [50, 52, 53, 54], Mn: [55],
  Fe: [54, 56, 57, 58], Co: [59, 60], Ni: [58, 60, 61, 62, 64], Cu: [63, 65], Zn: [64, 66, 67, 68, 70], Ga: [69, 71], Ge: [70, 72, 73, 74, 76],
  As: [75], Se: [74, 76, 77, 78, 80, 82], Br: [79, 81], Kr: [78, 80, 82, 83, 84, 86], Rb: [85, 87], Sr: [84, 86, 87, 88, 90], Ag: [107, 109],
  Sn: [112, 114, 115, 116, 117, 118, 119, 120, 122, 124], I: [127, 129, 131], Xe: [124, 126, 128, 129, 130, 131, 132, 134, 136],
  Ba: [130, 132, 134, 135, 136, 137, 138], Au: [197], Hg: [196, 198, 199, 200, 201, 202, 204], Pb: [204, 206, 207, 208],
};
// Charges of common monatomic ions.
const V_ION_CHARGES = {
  H: [1, -1], Li: [1], Be: [2], N: [-3], O: [-2], F: [-1], Na: [1], Mg: [2], Al: [3], P: [-3], S: [-2], Cl: [-1], K: [1], Ca: [2], Sc: [3],
  Ti: [2, 3, 4], V: [2, 3], Cr: [2, 3, 6], Mn: [2, 4, 7], Fe: [2, 3], Co: [2, 3], Ni: [2], Cu: [1, 2], Zn: [2], Ga: [3], Se: [-2], Br: [-1],
  Rb: [1], Sr: [2], Ag: [1], Sn: [2, 4], I: [-1], Ba: [2], Au: [1, 3], Hg: [1, 2], Pb: [2, 4],
};
// name: [formula, charge, polyatomic?]
const V_CATIONS = {
  lithium: ['Li', 1], sodium: ['Na', 1], potassium: ['K', 1], rubidium: ['Rb', 1], magnesium: ['Mg', 2], calcium: ['Ca', 2],
  strontium: ['Sr', 2], barium: ['Ba', 2], aluminum: ['Al', 3], zinc: ['Zn', 2], silver: ['Ag', 1], ammonium: ['NH4', 1, true],
};
// metals that take a Roman numeral: name: [symbol, possible charges]
const V_MULTI = { iron: ['Fe', [2, 3]], copper: ['Cu', [1, 2]], lead: ['Pb', [2, 4]], tin: ['Sn', [2, 4]], cobalt: ['Co', [2, 3]], chromium: ['Cr', [2, 3]], gold: ['Au', [1, 3]] };
// name: [formula, size of the negative charge, polyatomic?]
const V_ANIONS = {
  fluoride: ['F', 1], chloride: ['Cl', 1], bromide: ['Br', 1], iodide: ['I', 1], oxide: ['O', 2], sulfide: ['S', 2], nitride: ['N', 3], phosphide: ['P', 3],
  nitrate: ['NO3', 1, true], nitrite: ['NO2', 1, true], sulfate: ['SO4', 2, true], sulfite: ['SO3', 2, true], carbonate: ['CO3', 2, true],
  'hydrogen carbonate': ['HCO3', 1, true], phosphate: ['PO4', 3, true], hydroxide: ['OH', 1, true], acetate: ['C2H3O2', 1, true],
  permanganate: ['MnO4', 1, true], chromate: ['CrO4', 2, true], dichromate: ['Cr2O7', 2, true], cyanide: ['CN', 1, true],
  peroxide: ['O2', 2, true], chlorate: ['ClO3', 1, true],
};
const NONMETALS = new Set(['H', 'B', 'C', 'N', 'O', 'F', 'Si', 'P', 'S', 'Cl', 'As', 'Se', 'Br', 'I']);
const IDE_ROOT = { oxide: 'O', sulfide: 'S', nitride: 'N', phosphide: 'P', fluoride: 'F', chloride: 'Cl', bromide: 'Br', iodide: 'I', hydride: 'H', selenide: 'Se' };
const NUM_PREFIX = ['', 'mono', 'di', 'tri', 'tetra', 'penta', 'hexa', 'hepta', 'octa', 'nona', 'deca'];
const ROMAN_N = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7 };
const NA_V = 6.02e23;
const SUPS_V = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const SUBS_V = '₀₁₂₃₄₅₆₇₈₉';
const unsubV = (s) => String(s).replace(/[₀-₉]/g, (c) => String(SUBS_V.indexOf(c)));
const unsupV = (s) => String(s).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => String(SUPS_V.indexOf(c))).replace(/⁺/g, '+').replace(/⁻/g, '-');
/** "6.02 × 10²³" → "6.02 × 10^23"; "10 to the power 23" (screen-reader text) → "10^23" */
const powText = (s) => String(s).replace(/10 to the power (\S+)/g, (_, e) => `10^${e.replace(/−/g, '-')}`).replace(/10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (_, e) => `10^${unsupV(e)}`);
const normAns = (s) => powText(String(s)).replace(/[−–]/g, '-').replace(/\s+/g, ' ').trim();
/** "3.01 × 10^24", "1,520", "-4" → Number */
function numV(s) {
  const t = normAns(s).replace(/,/g, '');
  const m = t.match(/^(-?\d*\.?\d+)(?: × 10\^(-?\d+))?$/);
  return m ? Number(m[1]) * (m[2] != null ? 10 ** Number(m[2]) : 1) : NaN;
}
/** Split "6.81 × 10^24 molecules" / "48.0%" / "4" into its number and unit. */
function splitV(s) {
  const m = normAns(s).match(/^(-?[\d,]*\.?\d+(?: × 10\^-?\d+)?)(%| (.+))?$/);
  return m ? { n: m[1], v: numV(m[1]), unit: m[2] === '%' ? '%' : (m[3] || '') } : null;
}
/** Atoms in a formula, by hand: "Ca(NO3)2" → { Ca: 1, N: 2, O: 6 } */
function vAtoms(f) {
  const s = unsubV(f);
  const stack = [{}];
  let i = 0;
  while (i < s.length) {
    if (s[i] === '(') { stack.push({}); i++; continue; }
    if (s[i] === ')') {
      i++;
      let d = '';
      while (/\d/.test(s[i] || '')) d += s[i++];
      const g = stack.pop();
      if (!stack.length) throw new Error(`bad brackets in ${f}`);
      for (const [e, c] of Object.entries(g)) stack[stack.length - 1][e] = (stack[stack.length - 1][e] || 0) + c * (d ? Number(d) : 1);
      continue;
    }
    const m = /^([A-Z][a-z]?)(\d*)/.exec(s.slice(i));
    if (!m || !VPT[m[1]]) throw new Error(`not a formula: ${f}`);
    i += m[0].length;
    const top = stack[stack.length - 1];
    top[m[1]] = (top[m[1]] || 0) + (m[2] ? Number(m[2]) : 1);
  }
  if (stack.length !== 1) throw new Error(`bad brackets in ${f}`);
  return stack[0];
}
/** Molar mass in hundredths of a g/mol — an exact whole number. */
const mmHund = (f) => Object.entries(vAtoms(f)).reduce((t, [e, c]) => t + c * HUND(e), 0);
const mmV = (f) => mmHund(f) / 100;
const gcdV = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
/** Sublevels in filling order from the n + l rule (then lower n first). */
const MADELUNG = (() => {
  const out = [];
  for (let n = 1; n <= 7; n++) for (let l = 0; l < Math.min(n, 4); l++) out.push({ n, l, cap: 2 * (2 * l + 1), name: `${n}${'spdf'[l]}` });
  return out.sort((a, b) => (a.n + a.l) - (b.n + b.l) || a.n - b.n);
})();
function vConfig(z) {
  const out = [];
  let left = z;
  for (const s of MADELUNG) { if (left <= 0) break; const k = Math.min(s.cap, left); out.push([s.name, k]); left -= k; }
  return out;
}
const NOBLE_Z = [2, 10, 18, 36, 54, 86].filter((z) => { const c = vConfig(z); const [s, k] = c[c.length - 1]; return (s === '1s' && k === 2) || (s.endsWith('p') && k === 6); });
const cfgTokens = (s) => {
  const t = unsupV(s).trim();
  if (!/^(\d[spdf]\d+)( \d[spdf]\d+)*$/.test(t)) return null;
  return t.split(' ').map((x) => [x.slice(0, 2), Number(x.slice(2))]);
};
const cfgStr = (c) => c.map(([s, k]) => `${s}${k}`).join(' ');
const sortShell = (c) => c.slice().sort((a, b) => Number(a[0][0]) - Number(b[0][0]) || 'spdf'.indexOf(a[0][1]) - 'spdf'.indexOf(b[0][1]));
const roundsTo = (ans, v, n) => [1 - 1e-11, 1, 1 + 1e-11].some((k) => relClose(Number((v * k).toPrecision(n)), ans, 1e-12));
const roundsToDp = (ans, v, dp) => [1 - 1e-11, 1, 1 + 1e-11].some((k) => relClose(Number((v * k).toFixed(dp)), ans, 1e-12));
/** How many significant figures a written number shows (a whole number's trailing zeros are ambiguous: min–max). */
function sfShown(n) {
  const t = normAns(n).replace(/,/g, '').replace(/^-/, '').replace(/ × 10\^-?\d+$/, '');
  if (t.includes('.')) { const d = t.replace('.', '').replace(/^0+/, ''); return [d.length, d.length]; }
  const d = t.replace(/^0+/, '');
  return [d.replace(/0+$/, '').length, d.length];
}
const PARTICLE_WORDS = ['atoms', 'molecules', 'formula units'];
/** What a substance's particles are called: atoms for an element, formula units for an ionic compound. */
function particleWord(f) {
  const at = vAtoms(f);
  const els = Object.keys(at);
  if (els.length === 1 && !/\d/.test(unsubV(f))) return 'atoms';
  if (/NH4/.test(unsubV(f)) || els.some((e) => !NONMETALS.has(e))) return 'formula units';
  return 'molecules';
}

/* ------------------------------------------------ equations */
function parseEqV(s) {
  const [l, r] = s.split(' → ');
  if (!l || !r) throw new Error(`not an equation: ${s}`);
  const side = (t) => t.split(' + ').map((x) => { const m = x.trim().match(/^(?:(\d+) )?(\S+)$/); if (!m) throw new Error(`species not understood: ${x}`); return { c: m[1] ? Number(m[1]) : 1, f: unsubV(m[2]) }; });
  return { r: side(l), p: side(r) };
}
const eqElements = (eq) => [...new Set([...eq.r, ...eq.p].flatMap((x) => Object.keys(vAtoms(x.f))))];
const eqBalanced = (eq, cs) => eqElements(eq).every((e) => {
  const sp = [...eq.r, ...eq.p];
  let t = 0;
  sp.forEach((x, i) => { t += (i < eq.r.length ? 1 : -1) * cs[i] * (vAtoms(x.f)[e] || 0); });
  return t === 0;
});
/** The lowest whole-number coefficients, by exact elimination (BigInt fractions); null if not unique. */
function solveCoefficients(eq) {
  const sp = [...eq.r, ...eq.p];
  const els = eqElements(eq);
  const n = sp.length;
  const fr = (p, q = 1n) => { if (q < 0n) { p = -p; q = -q; } const g = (function g2(a, b) { a = a < 0n ? -a : a; while (b) [a, b] = [b, a % b]; return a; })(p, q) || 1n; return [p / g, q / g]; };
  const M = els.map((e) => sp.map((x, i) => fr(BigInt((i < eq.r.length ? 1 : -1) * (vAtoms(x.f)[e] || 0)))));
  const sub2 = (a, b) => fr(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
  const mul2 = (a, b) => fr(a[0] * b[0], a[1] * b[1]);
  const div2 = (a, b) => fr(a[0] * b[1], a[1] * b[0]);
  let row = 0;
  const pivots = [];
  for (let col = 0; col < n && row < M.length; col++) {
    const pr = M.findIndex((r, i) => i >= row && r[col][0] !== 0n);
    if (pr < 0) continue;
    [M[row], M[pr]] = [M[pr], M[row]];
    const pv = M[row][col];
    M[row] = M[row].map((x) => div2(x, pv));
    for (let i = 0; i < M.length; i++) if (i !== row && M[i][col][0] !== 0n) { const k = M[i][col]; M[i] = M[i].map((x, j) => sub2(x, mul2(k, M[row][j]))); }
    pivots.push(col); row++;
  }
  if (pivots.length !== n - 1) return null;
  const free = [...Array(n).keys()].find((c) => !pivots.includes(c));
  const x = Array(n).fill(null);
  x[free] = fr(1n);
  pivots.forEach((c, i) => { x[c] = fr(-M[i][free][0], M[i][free][1]); });
  const L = x.reduce((l, [, q]) => { const g = (function g2(a, b) { while (b) [a, b] = [b, a % b]; return a; })(l, q); return (l / g) * q; }, 1n);
  let ints = x.map(([p, q]) => (p * L) / q);
  if (ints.every((v) => v < 0n)) ints = ints.map((v) => -v);
  if (ints.some((v) => v <= 0n)) return null;
  const g = ints.reduce((a, b) => (function g2(c, d) { while (d) [c, d] = [d, c % d]; return c; })(a, b));
  return ints.map((v) => Number(v / g));
}
const isElementF = (f) => Object.keys(vAtoms(f)).length === 1;
/** The reaction types an equation fits, from its shape alone. */
function reactionTypes(eq) {
  const types = new Set();
  const R = eq.r.map((x) => x.f), Pd = eq.p.map((x) => x.f);
  const fuel = R.find((f) => f !== 'O2');
  const onlyCHO = fuel && Object.keys(vAtoms(fuel)).every((e) => ['C', 'H', 'O'].includes(e)) && vAtoms(fuel).C && vAtoms(fuel).H;
  if (R.length === 2 && R.includes('O2') && onlyCHO && Pd.length === 2 && Pd.includes('CO2') && Pd.includes('H2O')) types.add('combustion');
  if (R.length >= 2 && Pd.length === 1) types.add('synthesis');
  if (R.length === 1 && Pd.length >= 2) types.add('decomposition');
  if (R.length === 2 && Pd.length === 2 && R.filter(isElementF).length === 1 && Pd.filter(isElementF).length === 1) types.add('single replacement');
  if (R.length === 2 && Pd.length === 2 && !R.some(isElementF) && !Pd.some(isElementF)) types.add('double replacement');
  // something burning in oxygen to make a single oxide is also fairly called combustion
  if (types.has('synthesis') && R.includes('O2') && Pd.length === 1) types.add('combustion');
  return types;
}

/* ------------------------------------------------ naming, by hand */
function vFormulaFromIons(cf, cc, cpoly, af, ac, apoly) {
  const l = (cc * ac) / gcdV(cc, ac);
  const nc = l / cc, na = l / ac;
  const part = (f, n, poly) => (n === 1 ? f : poly ? `(${f})${n}` : `${f}${n}`);
  return part(cf, nc, cpoly) + part(af, na, apoly);
}
/** Every accepted formula for a compound's name, worked out from the name. */
function vFormulasOf(name) {
  let cat = null, rest = null;
  for (const [cn, [f, c, poly]] of Object.entries(V_CATIONS)) if (name.startsWith(`${cn} `)) { cat = { f, c, poly }; rest = name.slice(cn.length + 1); }
  const mm = name.match(/^([a-z]+)\((I|II|III|IV)\) (.+)$/);
  if (mm && V_MULTI[mm[1]]) {
    const [f, cs] = V_MULTI[mm[1]];
    if (!cs.includes(ROMAN_N[mm[2]])) throw new Error(`${mm[1]} is not ${mm[2]}`);
    cat = { f, c: ROMAN_N[mm[2]] }; rest = mm[3];
  }
  if (cat && V_ANIONS[rest]) {
    const [af, ac, apoly] = V_ANIONS[rest];
    const out = [vFormulaFromIons(cat.f, cat.c, cat.poly, af, ac, apoly)];
    if (rest === 'acetate') out.push(vFormulaFromIons(cat.f, cat.c, cat.poly, 'CH3COO', ac, true));
    return out;
  }
  // molecular: prefix + element, prefix + -ide
  const w = name.split(' ');
  if (w.length !== 2) throw new Error(`name not understood: ${name}`);
  const first = splitPrefixV(w[0], (r) => SYM_OF[r] && NONMETALS.has(SYM_OF[r]));
  const second = splitPrefixV(w[1], (r) => IDE_ROOT[r]);
  if (!first || !second) throw new Error(`name not understood: ${name}`);
  if (first.explicit && first.n === 1) throw new Error('"mono" on the first element');
  if (!second.explicit) throw new Error('no prefix on the second element');
  const x = SYM_OF[first.root], y = IDE_ROOT[second.root];
  return [`${x}${first.n > 1 ? first.n : ''}${y}${second.n > 1 ? second.n : ''}`];
}
/** "pentoxide" → { n: 5, root: 'oxide' }, trying every prefix (with or without the dropped vowel). */
function splitPrefixV(word, validRoot) {
  for (let n = 10; n >= 1; n--) {
    const p = NUM_PREFIX[n];
    for (const cut of [p, /[ao]$/.test(p) ? p.slice(0, -1) : null]) {
      if (!cut || !word.startsWith(cut)) continue;
      const root = word.slice(cut.length);
      if (cut !== p && !root.startsWith('o')) continue;
      if (validRoot(root)) return { n, root, explicit: true };
    }
  }
  return validRoot(word) ? { n: 1, root: word, explicit: false } : null;
}
const normNameV = (s) => String(s).toLowerCase().replace(/\s*\(\s*/g, '(').replace(/\s*\)\s*/g, ') ').replace(/\s+/g, ' ').trim();
/** Every accepted name for a formula, worked out from the formula; throws if it could be read two ways. */
function vNamesOf(formula) {
  const f = unsubV(formula);
  const found = [];
  // ionic: a cation then an anion, charges adding to zero in the lowest ratio
  const cations = [
    ...Object.entries(V_CATIONS).map(([name, [cf, c, poly]]) => ({ name, cf, cs: [c], poly, multi: false })),
    ...Object.entries(V_MULTI).map(([name, [cf, cs]]) => ({ name, cf, cs, multi: true })),
  ];
  for (const cat of cations) {
    const m = cat.poly ? f.match(new RegExp(`^(?:\\(${cat.cf}\\)(\\d+)|${cat.cf}())(.*)$`)) : f.match(new RegExp(`^${cat.cf}(\\d*)(?![a-z])()(.*)$`));
    if (!m) continue;
    const rest = m[3];
    for (const [aname, [af, ac, apoly]] of Object.entries({ ...V_ANIONS, 'acetate ': ['CH3COO', 1, true] })) {
      // peroxides are only the group 1 and 2 metals' (PbO₂ is lead(IV) oxide)
      if (af === 'O2' && !['Li', 'Na', 'K', 'Rb', 'Mg', 'Ca', 'Sr', 'Ba'].includes(cat.cf)) continue;
      for (const c of cat.cs) {
        if (vFormulaFromIons(cat.cf, c, cat.poly, af, ac, apoly) !== f) continue;
        if (rest === '') continue;
        const an = aname.trim();
        const catName = cat.multi ? `${cat.name}(${Object.keys(ROMAN_N).find((k) => ROMAN_N[k] === c)})` : cat.name;
        found.push(`${catName} ${an}`);
      }
    }
  }
  const mol = f.match(/^([A-Z][a-z]?)(\d*)([A-Z][a-z]?)(\d*)$/);
  if (mol && NONMETALS.has(mol[1]) && NONMETALS.has(mol[3]) && mol[1] !== mol[3]) {
    const nx = Number(mol[2] || 1), ny = Number(mol[4] || 1);
    const root = Object.keys(IDE_ROOT).find((r) => IDE_ROOT[r] === mol[3]);
    const first = `${nx > 1 ? NUM_PREFIX[nx] : ''}${VPT[mol[1]][1]}`;
    const p = NUM_PREFIX[ny];
    const names = [`${first} ${p}${root}`];
    if (/^o/.test(root) && /[ao]$/.test(p)) names.push(`${first} ${p.slice(0, -1)}${root}`);
    found.push(...names);
  }
  const uniq = [...new Set(found)];
  if (!uniq.length) throw new Error(`could not name ${formula}`);
  // two spellings of one molecular name are fine; two different compounds are not
  const kinds = new Set(uniq.map((n) => n.replace(/pentoxide|pentaoxide/, 'P').replace(/tetroxide|tetraoxide/, 'T').replace(/monoxide|monooxide/, 'M').replace(/decoxide|decaoxide/, 'D').replace(/heptoxide|heptaoxide/, 'H').replace(/hexoxide|hexaoxide/, 'X')));
  if (kinds.size !== 1) throw new Error(`${formula} could be named ${uniq.join(' or ')}`);
  return uniq;
}

/* ------------------------------------------------ numeric answers */
const WRONG_UNIT = { g: 'mol', mol: 'g', L: 'mL', mL: 'L', atm: 'kPa', kPa: 'atm', mmHg: 'atm', K: '°C', M: 'm', '%': 'g', 'g/mol': 'g', amu: 'g', atoms: 'molecules', molecules: 'atoms', 'formula units': 'atoms', 'valence electrons': 'protons' };
/** A numeric answer: v is the true value; how is { sf: 3 }, { dp: 2 } or { exact: true }. */
function numSol(v, how, unit, { exactEq, units } = {}) {
  const okUnits = units || [unit];
  const valueOk = (n) => (how.exact ? (exactEq ? exactEq(n) : relClose(n, v, 1e-12)) : how.sf ? roundsTo(n, v, how.sf) : roundsToDp(n, v, how.dp));
  const isRight = (s) => { const a = splitV(s); return !!a && okUnits.includes(a.unit) && valueOk(a.v); };
  const format = (s) => {
    const a = splitV(s);
    if (!a) return false;
    if (how.sf) { const [lo, hi] = sfShown(a.n); return lo <= how.sf && how.sf <= hi; }
    if (how.dp != null) return (a.n.split('.')[1] || '').length === how.dp;
    return true;
  };
  return { v, how, unit, isRight, format, optValue: (s) => splitV(s)?.v, expect: `${how.exact ? v : how.sf ? Number(v.toPrecision(how.sf)) : v.toFixed(how.dp)} ${unit}` };
}
/** Inputs the grader must accept or reject for a numeric answer. */
function numInputs(q, sol) {
  const reqs = [];
  const a = splitV(q.answer);
  if (!a) return reqs;
  const u = a.unit ? (a.unit === '%' ? '%' : ` ${a.unit}`) : '';
  const sci = a.n.match(/^(.+) × 10\^(-?\d+)$/);
  const body = (sci ? sci[1] : a.n).replace(/,/g, '');
  const dec = (body.split('.')[1] || '').length;
  const mk = (x) => (sci ? `${x} × 10^${sci[2]}` : x);
  // a slip in the last digit that counts is wrong (for "1,520" to 3 significant figures, the 2)
  let place = -dec;
  if (!sci && sol.how.sf && !dec) place = Math.max(0, Math.floor(Math.log10(Math.abs(Number(body)))) - (sol.how.sf - 1));
  for (const d of [1, -1]) {
    const x = (Number(body) + d * 10 ** place).toFixed(Math.max(0, -place));
    if (Number(x) === 0) continue;
    reqs.push({ input: `${mk(x)}${u}`, expect: false, why: `last digit ${d > 0 ? '+1' : '−1'}` });
  }
  // a power of ten out
  reqs.push({ input: `${sci ? `${sci[1]} × 10^${Number(sci[2]) + 1}` : shift(a.n, 1)}${u}`, expect: false, why: 'answer ×10' });
  reqs.push({ input: `${sci ? `${sci[1]} × 10^${Number(sci[2]) - 1}` : shift(a.n, -1)}${u}`, expect: false, why: 'answer ÷10' });
  if (a.unit) {
    reqs.push({ input: a.n, expect: true, why: 'the number without its unit' });
    const wu = WRONG_UNIT[a.unit];
    if (wu) reqs.push({ input: `${a.n} ${wu}`, expect: false, why: `the wrong unit (${wu})` });
  }
  reqs.push({ input: `x = ${q.answer}`, expect: true, why: '"x =" in front' });
  if (sci) reqs.push({ input: `${sci[1]}e${sci[2]}${u}`, expect: true, why: 'e-notation' }, { input: `${sci[1]}x10^${sci[2]}${u}`, expect: true, why: '"x10^" typed' });
  if (/^\d{1,3}(,\d{3})+/.test(a.n)) reqs.push({ input: `${a.n.replace(/,/g, '')}${u}`, expect: true, why: 'no thousands commas' });
  if (!sol.how.exact) {
    // more digits than asked for, all right: fine; fewer than asked for: not
    const more = sol.how.sf ? sol.v.toPrecision(sol.how.sf + 2) : sol.v.toFixed(sol.how.dp + 2);
    const moreTxt = /e/.test(more) ? `${Number(more.split('e')[0])} × 10^${Number(more.split('e')[1])}` : more;
    reqs.push({ input: `${moreTxt}${u}`, expect: true, why: 'more digits, all right' });
    // more digits, within half a unit of the last stated digit of the true
    // value (even when that rounds the other way): right; just outside: wrong
    const scale = sci ? 10 ** Number(sci[2]) : 1, mv = sol.v / scale, half = 0.5 * 10 ** place, dp = Math.max(0, -place) + 2;
    for (const [k, ok] of [[0.9, true], [-0.9, true], [1.2, false], [-1.2, false]]) {
      const x = (mv + k * half).toFixed(dp);
      if (Number(x) <= 0) continue;
      reqs.push({ input: `${mk(x)}${u}`, expect: ok, why: ok ? `more digits, ${k > 0 ? '+' : '−'}0.9 of half a unit from the true value` : `more digits, ${k > 0 ? '+' : '−'}1.2 × half a unit from the true value` });
    }
    const fewer = sol.how.sf ? Number(sol.v.toPrecision(sol.how.sf - 1)) : Number(sol.v.toFixed(sol.how.dp - 1));
    if (!relClose(fewer, a.v, 1e-12)) reqs.push({ input: `${/e/.test(String(fewer)) ? `${Number(String(fewer).split('e')[0])} × 10^${Number(String(fewer).split('e')[1])}` : fewer}${u}`, expect: false, why: 'fewer digits than asked for' });
  }
  return reqs;
}

/* ------------------------------------------------ per-skill solvers
   Each reads the prompt alone and returns { isRight(text), expect, format?,
   optValue?, inputs?[], ctx? } — ctx carries what the worked solution's
   fences may use (the equation's coefficients, a molarity). */
const SUPC = `[${SUPS_V}]`;
const nameSym = (name, sym) => { if (SYM_OF[name] !== sym) throw new Error(`${name} is not ${sym}`); return sym; };
const eqCoef = (eq) => Object.fromEntries([...eq.r, ...eq.p].map((x) => [x.f, x.c]));
const massNoteOk = (q, formulas) => {
  const m = (q.note || '').match(/Atomic masses: (.+?) \(g\/mol\)\./);
  if (!m) throw new Error('no atomic masses in the note');
  const got = Object.fromEntries(m[1].split(', ').map((x) => x.split(' = ')));
  for (const f of formulas) for (const e of Object.keys(vAtoms(f))) if (got[e] == null) throw new Error(`the note has no mass for ${e}`);
  for (const [e, v] of Object.entries(got)) if (!VPT[e] || Number(v) !== VPT[e][2] || !/^\d+\.\d\d$/.test(v)) throw new Error(`the note says ${e} = ${v}, the table says ${VPT[e] && VPT[e][2]}`);
};
const needRound3 = (q) => { if (!/Round to 3 significant figures\./.test(q.note || '')) throw new Error('the rounding is not stated'); };
const SF3V = { sf: 3 };
const NEW = {
  pne(q) {
    let sym, A, c = 0;
    let m = q.prompt.match(/^How many protons, neutrons and electrons are in an atom of ([a-z]+)-(\d+)\?$/);
    if (m) { sym = SYM_OF[m[1]]; A = Number(m[2]); } else {
      m = q.prompt.match(new RegExp(`^How many protons, neutrons and electrons are in (the ion|an atom of) (${SUPC}+)([A-Z][a-z]?)(${SUPC}*[⁺⁻])?\\?$`));
      if (!m) throw new Error('prompt not understood');
      sym = m[3]; A = Number(unsupV(m[2]));
      if (m[4]) { const t = unsupV(m[4]); c = (t.length > 1 ? Number(t.slice(0, -1)) : 1) * (t.endsWith('+') ? 1 : -1); }
      if ((m[1] === 'the ion') !== (c !== 0)) throw new Error('"ion" and the charge disagree');
    }
    if (!VPT[sym]) throw new Error('unknown element');
    if (!V_ISO[sym].includes(A)) throw new Error(`${sym}-${A} is not a real isotope`);
    if (c && !V_ION_CHARGES[sym].includes(c)) throw new Error(`${sym} does not form a ${c} ion`);
    const p = VPT[sym][0], n = A - p, e = p - c;
    const read = (s) => { const r = s.match(/^(\d+) protons?, (\d+) neutrons?, (\d+) electrons?$/); return r && r.slice(1).map(Number); };
    const inputs = [
      { input: `${p}, ${n}, ${e}`, expect: true, why: 'three numbers' }, { input: `${p} ${n} ${e}`, expect: true, why: 'three numbers with spaces' },
      { input: `p=${p} n=${n} e=${e}`, expect: true, why: 'labelled' }, { input: `e = ${e}, n = ${n}, p = ${p}`, expect: true, why: 'labelled, any order' },
      { input: `${p} protons, ${n} neutrons, ${e} electrons`, expect: true, why: 'in words' },
      { input: `${p} p+ ${n} n0 ${e} e-`, expect: true, why: 'labelled p+ n0 e-' }, { input: `${p}p+, ${n}n0, ${e}e-`, expect: true, why: 'labelled p+ n0 e-, no spaces' },
      { input: `p+ ${p}, n0 ${n}, e- ${e}`, expect: true, why: 'labels p+ n0 e- first' }, { input: `p${p} n${n} e${e}`, expect: true, why: 'labels first, no spaces' },
      { input: `${p} p+ ${n} n0 ${e + 1} e-`, expect: false, why: 'labelled p+ n0 e-, electrons off by one' },
      { input: `${p}, ${n}, ${e + 1}`, expect: false, why: 'electrons off by one' }, { input: `${p}, ${A}, ${e}`, expect: false, why: 'mass number as neutrons' },
      { input: `${p}, ${n}`, expect: false, why: 'only two numbers' },
    ];
    if (n !== p) inputs.push({ input: `${n}, ${p}, ${e}`, expect: false, why: 'protons and neutrons swapped' });
    if (c) inputs.push({ input: `${p}, ${n}, ${p + c}`, expect: false, why: 'the charge applied the wrong way' });
    return { expect: `${p}, ${n}, ${e}`, isRight: (s) => { const r = read(s); return !!r && r[0] === p && r[1] === n && r[2] === e; }, inputs };
  },
  avgmass(q) {
    const m = q.prompt.match(/^(.+?) has (two|three) isotopes: (.+)\. What is its average atomic mass\?$/);
    if (!m) throw new Error('prompt not understood');
    if (!/Round to two decimal places\./.test(q.note || '')) throw new Error('the rounding is not stated');
    const iso = [...m[3].matchAll(/(\d+(?:\.\d+)?) amu \((\d+(?:\.\d+)?)%\)/g)].map((x) => [x[1], x[2]]);
    if (iso.length !== (m[2] === 'two' ? 2 : 3)) throw new Error(`${iso.length} isotopes listed for "${m[2]}"`);
    const pctSum = iso.reduce((t, [, a]) => t + Math.round(Number(a) * 100), 0);
    if (pctSum !== 10000) throw new Error(`abundances add to ${pctSum / 100}%`);
    // exact: masses to 0.001 amu and abundances to 0.01% multiply to units of 1e-7 amu
    const total = iso.reduce((t, [ms, a]) => t + Math.round(Number(ms) * 1000) * Math.round(Number(a) * 100), 0);
    const v = total / 1e7;
    if (m[1] !== 'Element X') {
      const sym = SYM_OF[m[1].toLowerCase()];
      if (!sym || Math.abs(Math.round(total / 1e5) / 100 - VPT[sym][2]) > 0.011) throw new Error(`${m[1]}'s isotopes give ${v}, but the periodic table says ${sym && VPT[sym][2]}`);
    }
    return numSol(v, { dp: 2 }, 'amu', { units: ['amu'] });
  },
  config(q) {
    const m = q.prompt.match(/^Write the electron configuration of ([a-z]+) \(([A-Z][a-z]?)\)\.$/);
    if (!m) throw new Error('prompt not understood');
    const z = VPT[nameSym(m[1], m[2])][0];
    if (z === 24 || z === 29) throw new Error('Cr and Cu are exceptions to the filling order');
    const want = vConfig(z);
    const inputs = [
      { input: cfgStr(want), expect: true, why: 'plain numbers' }, { input: want.map(([s, k]) => `${s}^${k}`).join(' '), expect: true, why: 'with ^' },
      { input: cfgStr(want).replace(/ /g, ''), expect: true, why: 'run together' }, { input: cfgStr(want).toUpperCase(), expect: true, why: 'capital letters' },
      { input: cfgStr(want.map(([s, k], i) => [s, i === want.length - 1 ? k + 1 : k])), expect: false, why: 'one electron too many' },
    ];
    if (cfgStr(sortShell(want)) !== cfgStr(want)) inputs.push({ input: cfgStr(sortShell(want)), expect: true, why: 'written in shell order' });
    const core = NOBLE_Z.filter((g) => g < z).pop();
    if (core) inputs.push({ input: `[${SYM_OF_Z[core]}] ${cfgStr(want.slice(vConfig(core).length))}`, expect: false, why: 'the noble-gas shorthand when the full form is asked for' });
    if (want[want.length - 1][1] > 1) inputs.push({ input: cfgStr(want.map(([s, k], i) => [s, i === want.length - 1 ? k - 1 : k])), expect: false, why: 'one electron too few' });
    return { expect: cfgStr(want), isRight: (s) => { const t = cfgTokens(s); return !!t && cfgStr(t) === cfgStr(want); }, inputs };
  },
  valence(q) {
    const m = q.prompt.match(/^How many valence electrons does an atom of ([a-z]+) \(([A-Z][a-z]?)\) have\?$/);
    if (!m) throw new Error('prompt not understood');
    const z = VPT[nameSym(m[1], m[2])][0];
    const cfg = vConfig(z);
    if (!/[sp]$/.test(cfg[cfg.length - 1][0]) || (cfg[cfg.length - 1][0].endsWith('s') && cfg.some(([s]) => /d$/.test(s)) && false)) throw new Error('not a main-group element');
    const top = Math.max(...cfg.map(([s]) => Number(s[0])));
    const v = cfg.filter(([s]) => Number(s[0]) === top).reduce((t, [, k]) => t + k, 0);
    const sol = numSol(v, { exact: true }, '', { units: ['', 'valence electrons'] });
    sol.inputs = [
      { input: `${v} valence electrons`, expect: true, why: 'with "valence electrons"' }, { input: `${v} electrons`, expect: true, why: 'with "electrons"' },
      { input: `${v + 1}`, expect: false, why: 'one too many' }, { input: `${v} protons`, expect: false, why: 'the wrong unit' },
    ];
    if (v >= 3 && z > 2) sol.inputs.push({ input: `${v + 10}`, expect: false, why: 'the group number without subtracting 10' });
    return sol;
  },
  noble(q) {
    const m = q.prompt.match(/^Which is the noble-gas shorthand electron configuration of ([a-z]+) \(([A-Z][a-z]?)\)\?$/);
    if (!m) throw new Error('prompt not understood');
    const z = VPT[nameSym(m[1], m[2])][0];
    if (z === 24 || z === 29) throw new Error('Cr and Cu are exceptions');
    const core = NOBLE_Z.filter((g) => g < z).pop();
    const rest = vConfig(z).slice(vConfig(core).length);
    const read = (s) => { const r = unsupV(s).match(/^\[([A-Z][a-z]?)\] (.+)$/); return r && { core: VPT[r[1]] && VPT[r[1]][0], toks: cfgTokens(r[2]) }; };
    const same = (a, b) => !!a && !!b && cfgStr(sortShell(a)) === cfgStr(sortShell(b));
    return {
      expect: `[${SYM_OF_Z[core]}] ${cfgStr(rest)}`,
      isRight: (s) => { const r = read(s); return !!r && r.core === core && same(r.toks, rest); },
      extra: () => { const r = read(q.answer); return r && r.toks && cfgStr(r.toks) !== cfgStr(rest) ? ['the answer is not written in filling order'] : []; },
    };
  },
  formula(q) {
    const m = q.prompt.match(/^Write the formula for (.+)\.$/);
    if (!m) throw new Error('prompt not understood');
    const fs = vFormulasOf(m[1]);
    const main = fs[0];
    const inputs = [
      { input: main, expect: true, why: 'plain digits' }, { input: fs[0].replace(/(\d)/g, ' $1 ').trim(), expect: true, why: 'spaces' },
      { input: main.toLowerCase(), expect: false, why: 'all lower case' }, { input: main.toUpperCase(), expect: main === main.toUpperCase(), why: 'all capitals' },
    ];
    const mp = main.match(/^(.*)\(([^)]+)\)(\d+)(.*)$/);
    if (mp) inputs.push({ input: `${mp[1]}${mp[2]}${mp[3]}${mp[4]}`, expect: false, why: 'brackets left out' });
    const poly1 = Object.values(V_ANIONS).find(([af, , poly]) => poly && main.endsWith(af) && !main.endsWith(`)${af}`) && main.length > af.length && /[A-Za-z0-9]$/.test(main.slice(0, -af.length)));
    if (poly1 && !/\(/.test(main)) inputs.push({ input: `${main.slice(0, -poly1[0].length)}(${poly1[0]})`, expect: false, why: 'brackets where none are needed' });
    return { expect: main, isRight: (s) => fs.includes(unsubV(s)), inputs };
  },
  naming(q) {
    const m = q.prompt.match(/^Name the compound (.+)\.$/);
    if (!m) throw new Error('prompt not understood');
    const names = vNamesOf(m[1]);
    const n0 = names[0];
    const inputs = [
      { input: n0.toUpperCase(), expect: true, why: 'capital letters' }, { input: `  ${n0.replace(' ', '   ')} `, expect: true, why: 'extra spaces' },
    ];
    const tm = n0.match(/^([a-z]+)\(([IV]+)\) (.+)$/);
    if (tm) {
      inputs.push({ input: `${tm[1]} (${tm[2]}) ${tm[3]}`, expect: true, why: 'a space before the bracket' }, { input: `${tm[1]} ${tm[2]} ${tm[3]}`, expect: true, why: 'numeral without brackets' },
        { input: `${tm[1]} ${tm[3]}`, expect: false, why: 'Roman numeral left out' });
      const other = V_MULTI[tm[1]][1].find((c) => c !== ROMAN_N[tm[2]]);
      inputs.push({ input: `${tm[1]}(${Object.keys(ROMAN_N).find((k) => ROMAN_N[k] === other)}) ${tm[3]}`, expect: false, why: 'the wrong Roman numeral' });
      inputs.push({ input: `${tm[1]}(${ROMAN_N[tm[2]]}) ${tm[3]}`, expect: false, why: 'an Arabic numeral' });
    } else if (Object.keys(V_CATIONS).some((c) => n0.startsWith(`${c} `))) {
      const cn = Object.keys(V_CATIONS).find((c) => n0.startsWith(`${c} `));
      inputs.push({ input: n0.replace(cn, `${cn}(I)`), expect: false, why: 'a Roman numeral it does not need' });
      inputs.push({ input: n0.replace(cn, `di${cn}`), expect: false, why: 'a prefix on an ionic compound' });
      if (/hydrogen carbonate/.test(n0)) inputs.push({ input: n0.replace('hydrogen carbonate', 'bicarbonate'), expect: true, why: '"bicarbonate"' });
    } else {
      const mol = unsubV(m[1]).match(/^([A-Z][a-z]?)(\d*)([A-Z][a-z]?)(\d*)$/);
      inputs.push({ input: `${VPT[mol[1]][1]} ${Object.keys(IDE_ROOT).find((r) => IDE_ROOT[r] === mol[3])}`, expect: false, why: 'prefixes left out' });
      if (!/^(di|tri|tetra|penta|hexa|hepta|octa|nona|deca)/.test(n0)) inputs.push({ input: `mono${n0}`, expect: false, why: '"mono" on the first element' });
      for (const nm of names.slice(1)) inputs.push({ input: nm, expect: true, why: 'the other spelling of the prefix' });
    }
    return { expect: n0, isRight: (s) => names.map(normNameV).includes(normNameV(s)), inputs };
  },
  balance(q) {
    const m = q.prompt.match(/^Balance the equation: (.+)$/);
    if (!m) throw new Error('prompt not understood');
    const eq = parseEqV(m[1]);
    if ([...eq.r, ...eq.p].some((x) => x.c !== 1)) throw new Error('the unbalanced equation already has coefficients');
    const cs = solveCoefficients(eq);
    if (!cs) throw new Error('no unique balanced form');
    const want = cs.join(', ');
    const inputs = [
      { input: cs.join(' '), expect: true, why: 'spaces' }, { input: cs.join(','), expect: true, why: 'no spaces' },
      { input: cs.map((c) => c * 2).join(', '), expect: false, why: 'not the lowest whole numbers' },
      { input: cs.map((c, i) => (i === cs.length - 1 ? c + 1 : c)).join(', '), expect: false, why: 'one coefficient off' },
    ];
    if (cs.includes(1)) inputs.push({ input: cs.filter((c) => c !== 1).join(', '), expect: false, why: 'the 1s left out' });
    return { expect: want, isRight: (s) => s === want, inputs };
  },
  rxntype(q) {
    const m = q.prompt.match(/^What type of reaction is this\? (.+)$/);
    if (!m) throw new Error('prompt not understood');
    const shown = parseEqV(m[1]);
    const cs = [...shown.r, ...shown.p].map((x) => x.c);
    if (!eqBalanced(shown, cs)) throw new Error('the equation shown is not balanced');
    const types = reactionTypes(shown);
    if (!types.size) throw new Error('no reaction type fits');
    return { expect: [...types].join(' / '), isRight: (s) => types.has(s.toLowerCase()) };
  },
  molar(q) {
    const m = q.prompt.match(/^What is the molar mass of (.+), (\S+)\?$/);
    if (!m) throw new Error('prompt not understood');
    const f = unsubV(m[2]);
    massNoteOk(q, [f]);
    const h = mmHund(f);
    const sol = numSol(h / 100, { exact: true }, 'g/mol', { exactEq: (n) => Math.round(n * 100) === h && relClose(n, h / 100, 1e-12) });
    sol.format = (s) => /^[\d,]+\.\d\d g\/mol$/.test(s);
    sol.inputs = [{ input: `${(h / 100).toFixed(2)} grams per mole`, expect: true, why: 'in words' }, { input: `${(h / 100).toFixed(2)} g`, expect: false, why: 'g is a mass, not a molar mass' },
      { input: `${(h / 100).toFixed(2)} amu`, expect: false, why: 'amu is the mass of one particle, not a molar mass' }];
    if (h % 10 === 0) sol.inputs.push({ input: `${h / 100} g/mol`, expect: true, why: 'without the trailing zero' });
    return sol;
  },
  moles(q) {
    needRound3(q);
    const P = String.raw`(\d[\d,]*(?:\.\d+)?(?: × 10\^-?\d+)?)`;
    const S = String.raw`.+, (\S+)`;
    const W = '(atoms|molecules|formula units)';
    const pats = [
      [new RegExp(`^How many moles are in ${P} g of ${S}\\?$`), 'g2mol'], [new RegExp(`^What is the mass of ${P} mol of ${S}\\?$`), 'mol2g'],
      [new RegExp(`^How many ${W} are in ${P} mol of ${S}\\?$`), 'mol2p'], [new RegExp(`^How many moles is ${P} ${W} of ${S}\\?$`), 'p2mol'],
      [new RegExp(`^How many ${W} are in ${P} g of ${S}\\?$`), 'g2p'], [new RegExp(`^What is the mass of ${P} ${W} of ${S}\\?$`), 'p2g'],
    ];
    for (const [re, kind] of pats) {
      const m = q.prompt.match(re);
      if (!m) continue;
      let word = null, amt, f;
      if (kind === 'mol2p' || kind === 'g2p') [word, amt, f] = [m[1], m[2], m[3]];
      else if (kind === 'p2mol' || kind === 'p2g') [amt, word, f] = [m[1], m[2], m[3]];
      else [amt, f] = [m[1], m[2]];
      f = unsubV(f);
      if (word && word !== particleWord(f)) throw new Error(`${f} is counted in ${particleWord(f)}, not ${word}`);
      if (/g/.test(kind)) massNoteOk(q, [f]);
      if (/p/.test(kind) && !q.note.includes('1 mol = 6.02 × 10²³')) throw new Error("Avogadro's number is not given");
      const x = numV(amt), mm = mmV(f);
      const v = { g2mol: x / mm, mol2g: x * mm, mol2p: x * NA_V, p2mol: x / NA_V, g2p: (x / mm) * NA_V, p2g: (x / NA_V) * mm }[kind];
      const unit = { g2mol: 'mol', mol2g: 'g', mol2p: word, p2mol: 'mol', g2p: word, p2g: 'g' }[kind];
      const sol = numSol(v, SF3V, unit);
      sol.ctx = {};
      return sol;
    }
    throw new Error('prompt not understood');
  },
  pcomp(q) {
    needRound3(q);
    const m = q.prompt.match(/^What is the percent by mass of ([a-z]+) in .+, (\S+)\?$/);
    if (!m) throw new Error('prompt not understood');
    const f = unsubV(m[2]), e = SYM_OF[m[1]];
    massNoteOk(q, [f]);
    const at = vAtoms(f);
    if (!at[e]) throw new Error(`${f} has no ${m[1]}`);
    return numSol((at[e] * HUND(e)) / mmHund(f) * 100, SF3V, '%');
  },
  empirical(q) {
    const m = q.prompt.match(/^A compound is (.+) by mass\. What is its empirical formula\?$/);
    if (!m) throw new Error('prompt not understood');
    const parts = [...m[1].matchAll(/(\d+\.\d)% ([a-z]+)/g)].map((x) => [SYM_OF[x[2]], Number(x[1])]);
    if (parts.some(([e]) => !e)) throw new Error('an element name not understood');
    if (Math.round(parts.reduce((t, [, p]) => t + p, 0) * 10) !== 1000) throw new Error('the percentages do not add to 100');
    const mol = parts.map(([e, p]) => p / VPT[e][2]);
    const min = Math.min(...mol);
    let counts = null;
    for (let k = 1; k <= 8 && !counts; k++) {
      const r = mol.map((x) => (x / min) * k);
      if (r.every((x) => Math.abs(x - Math.round(x)) <= 0.12)) counts = r.map(Math.round);
    }
    if (!counts) throw new Error('the percentages give no whole-number ratio');
    const want = parts.map(([e], i) => `${e}${counts[i] > 1 ? counts[i] : ''}`).join('');
    massNoteOk(q, [want]);
    return { expect: want, isRight: (s) => unsubV(s) === want };
  },
  stoich(q) {
    needRound3(q);
    const m = q.prompt.match(/^For the reaction (.+), how many (grams|moles) of (\S+) (can be produced from|react with|are needed to produce) (\d[\d,]*(?:\.\d+)?) (g|mol) of (\S+)\?$/);
    if (!m) throw new Error('prompt not understood');
    const eq = parseEqV(m[1]);
    const cs = [...eq.r, ...eq.p].map((x) => x.c);
    if (!eqBalanced(eq, cs) || solveCoefficients(eq)?.join() !== cs.join()) throw new Error('the equation is not balanced in lowest terms');
    const B = unsubV(m[3]), A = unsubV(m[7]);
    const coef = eqCoef(eq);
    if (!coef[A] || !coef[B]) throw new Error('a substance is not in the equation');
    const inR = (f) => eq.r.some((x) => x.f === f);
    const verb = inR(A) && !inR(B) ? 'can be produced from' : inR(A) && inR(B) ? 'react with' : 'are needed to produce';
    if (m[4] !== verb) throw new Error(`"${m[4]}" does not fit (${verb})`);
    if ((m[2] === 'grams') !== (m[6] === 'g')) throw new Error('the given and asked units differ in kind');
    let v;
    if (m[6] === 'mol') v = numV(m[5]) * coef[B] / coef[A];
    else { massNoteOk(q, [A, B]); v = numV(m[5]) / mmV(A) * coef[B] / coef[A] * mmV(B); }
    const sol = numSol(v, SF3V, m[6]);
    sol.ctx = { coef };
    return sol;
  },
  limiting(q) {
    const m = q.prompt.match(/^For the reaction (.+), (\d[\d,]*(?:\.\d+)?) (g|mol) of (\S+) reacts with (\d[\d,]*(?:\.\d+)?) (g|mol) of (\S+)\. Which reactant is limiting, and how much (\S+) can form\?$/);
    if (!m) throw new Error('prompt not understood');
    const eq = parseEqV(m[1]);
    const cs = [...eq.r, ...eq.p].map((x) => x.c);
    if (!eqBalanced(eq, cs)) throw new Error('the equation is not balanced');
    const coef = eqCoef(eq);
    const A = unsubV(m[4]), B = unsubV(m[7]), Pp = unsubV(m[8]);
    const unit = m[3];
    if (unit === 'g') massNoteOk(q, [A, B, Pp]);
    const mol = (f, x) => (unit === 'g' ? numV(x) / mmV(f) : numV(x));
    const make = (f, x) => mol(f, x) / coef[f] * coef[Pp] * (unit === 'g' ? mmV(Pp) : 1);
    const yA = make(A, m[2]), yB = make(B, m[5]);
    if (relClose(yA, yB, 0.05)) throw new Error('the two reactants make almost the same amount');
    const [L, y] = yA < yB ? [A, yA] : [B, yB];
    const read = (s) => { const r = unsubV(s).match(/^(\S+) is limiting; (\d[\d,]*(?:\.\d+)?) (g|mol) (\S+)$/); return r && { f: r[1], v: numV(r[2]), n: r[2], u: r[3], p: r[4] }; };
    return {
      expect: `${L}; ${Number(y.toPrecision(3))} ${unit}`,
      isRight: (s) => { const r = read(s); return !!r && r.f === L && r.u === unit && r.p === Pp && roundsTo(r.v, y, 3); },
      extra: () => {
        const bad = [];
        const right = read(q.answer);
        for (const o of q.options) {
          const r = read(o);
          if (!r) { bad.push(`option not understood: ${o}`); continue; }
          if (o !== q.answer && r.f === right.f && relClose(r.v, right.v, 0.01)) bad.push(`option "${o}" is within 1% of the answer`);
          const [lo, hi] = sfShown(r.n);
          if (!(lo <= 3 && 3 <= hi)) bad.push(`option "${o}" is not to 3 significant figures`);
        }
        return bad;
      },
      ctx: { coef },
    };
  },
  yield(q) {
    needRound3(q);
    let m = q.prompt.match(/^The theoretical yield of .+, (\S+), is (\d[\d,]*(?:\.\d+)?) g, but only (\d[\d,]*(?:\.\d+)?) g is collected\. What is the percent yield\?$/);
    if (m) return numSol(numV(m[3]) / numV(m[2]) * 100, SF3V, '%');
    m = q.prompt.match(/^For the reaction (.+), (\d[\d,]*(?:\.\d+)?) g of (\S+) reacts completely and (\d[\d,]*(?:\.\d+)?) g of (\S+) is collected\. What is the percent yield\?$/);
    if (!m) throw new Error('prompt not understood');
    const eq = parseEqV(m[1]);
    const coef = eqCoef(eq);
    const A = unsubV(m[3]), Pp = unsubV(m[5]);
    massNoteOk(q, [A, Pp]);
    const theo = numV(m[2]) / mmV(A) * coef[Pp] / coef[A] * mmV(Pp);
    const v = numV(m[4]) / theo * 100;
    // rounding the theoretical yield to 3 figures first must not change the answer
    // (an exact tie like 40.8 ÷ 64.0 × 100 = 63.75 comes out as 63.74999… in
    // floating point: nudge it so a half rounds up, as a student would)
    const r3 = (x) => Number((x * (1 + 1e-12)).toPrecision(3));
    const v2 = numV(m[4]) / r3(theo) * 100;
    if (r3(v) !== r3(v2)) throw new Error('rounding the theoretical yield first changes the answer');
    if (!(v > 0 && v < 100)) throw new Error(`a percent yield of ${v}`);
    const sol = numSol(v, SF3V, '%');
    sol.ctx = { coef };
    return sol;
  },
  pressure(q) {
    needRound3(q);
    if (!q.note.startsWith('1 atm = 101.3 kPa = 760 mmHg.')) throw new Error('the equalities are not given');
    const m = q.prompt.match(/^Convert (\d[\d,]*(?:\.\d+)?) (atm|kPa|mmHg) to (atm|kPa|mmHg)\.$/) || q.prompt.match(/^What is a pressure of (\d[\d,]*(?:\.\d+)?) (atm|kPa|mmHg) in (atm|kPa|mmHg)\?$/);
    if (!m || m[2] === m[3]) throw new Error('prompt not understood');
    const per = { atm: 1, kPa: 101.3, mmHg: 760 };
    return numSol(numV(m[1]) / per[m[2]] * per[m[3]], SF3V, m[3]);
  },
  gaslaw(q) {
    needRound3(q);
    const T = String.raw`([−-]?\d+) (°C|K)`, N = String.raw`(\d[\d,]*(?:\.\d+)?)`, U = '(atm|kPa|mmHg)';
    const tK = (x, u) => (u === 'K' ? Number(x) : Number(x.replace('−', '-')) + 273);
    const hasC = /°C/.test(q.prompt);
    if (hasC !== /Use K = °C \+ 273\./.test(q.note)) throw new Error('°C in the problem but no K = °C + 273 in the note (or the other way round)');
    let m, v, unit;
    if ((m = q.prompt.match(new RegExp(`^A gas occupies ${N} L at ${N} ${U}\\. What volume does it occupy at ${N} ${U}, if the temperature stays the same\\?$`)))) { v = numV(m[1]) * numV(m[2]) / numV(m[4]); unit = 'L'; }
    else if ((m = q.prompt.match(new RegExp(`^A gas at ${N} ${U} is compressed from ${N} L to ${N} L at constant temperature\\. What is its new pressure\\?$`)))) { v = numV(m[1]) * numV(m[3]) / numV(m[4]); unit = m[2]; }
    else if ((m = q.prompt.match(new RegExp(`^A balloon holds ${N} L of gas at ${T}\\. What is its volume at ${T}, if the pressure stays the same\\?$`)))) { v = numV(m[1]) * tK(m[4], m[5]) / tK(m[2], m[3]); unit = 'L'; }
    else if ((m = q.prompt.match(new RegExp(`^A gas occupies ${N} L at ${T}\\. At what temperature, in kelvin, does it occupy ${N} L at the same pressure\\?$`)))) { v = tK(m[2], m[3]) * numV(m[4]) / numV(m[1]); unit = 'K'; }
    else if ((m = q.prompt.match(new RegExp(`^A sealed container of gas is at ${N} ${U} and ${T}\\. What is its pressure at ${T}\\?$`)))) { v = numV(m[1]) * tK(m[5], m[6]) / tK(m[3], m[4]); unit = m[2]; }
    else if ((m = q.prompt.match(new RegExp(`^A sealed container of gas is at ${N} ${U} and ${T}\\. At what temperature, in kelvin, will its pressure be ${N} ${U}\\?$`)))) { v = tK(m[3], m[4]) * numV(m[5]) / numV(m[1]); unit = 'K'; }
    else if ((m = q.prompt.match(new RegExp(`^A gas has a volume of ${N} L at ${N} ${U} and ${T}\\. What is its volume at ${N} ${U} and ${T}\\?$`)))) { v = numV(m[1]) * numV(m[2]) * tK(m[8], m[9]) / (numV(m[6]) * tK(m[4], m[5])); unit = 'L'; }
    else if ((m = q.prompt.match(new RegExp(`^An? ${N} L sample of gas at ${N} ${U} and ${T} is moved to an? ${N} L container at ${T}\\. What is its new pressure\\?$`)))) { v = numV(m[1]) * numV(m[2]) * tK(m[7], m[8]) / (numV(m[6]) * tK(m[4], m[5])); unit = m[3]; }
    else throw new Error('prompt not understood');
    const us = [...q.prompt.matchAll(/(atm|kPa|mmHg)/g)].map((x) => x[1]);
    if (new Set(us).size > 1) throw new Error('two pressure units in one problem');
    return numSol(v, SF3V, unit);
  },
  ideal(q) {
    needRound3(q);
    if (!/Use R = 0\.0821 L·atm\/\(mol·K\)/.test(q.note)) throw new Error('R is not given');
    const T = String.raw`([−-]?\d+) (°C|K)`, N = String.raw`(\d[\d,]*(?:\.\d+)?)`;
    const tK = (x, u) => (u === 'K' ? Number(x) : Number(x.replace('−', '-')) + 273);
    const Rg = 0.0821;
    let m, v, unit;
    if ((m = q.prompt.match(new RegExp(`^What is the pressure of ${N} mol of gas in an? ${N} L container at ${T}\\?$`)))) { v = numV(m[1]) * Rg * tK(m[3], m[4]) / numV(m[2]); unit = 'atm'; }
    else if ((m = q.prompt.match(new RegExp(`^What volume does ${N} mol of gas occupy at ${N} atm and ${T}\\?$`)))) { v = numV(m[1]) * Rg * tK(m[3], m[4]) / numV(m[2]); unit = 'L'; }
    else if ((m = q.prompt.match(new RegExp(`^How many moles of gas are in an? ${N} L container at ${N} atm and ${T}\\?$`)))) { v = numV(m[2]) * numV(m[1]) / (Rg * tK(m[3], m[4])); unit = 'mol'; }
    else if ((m = q.prompt.match(new RegExp(`^At what temperature, in kelvin, does ${N} mol of gas occupy ${N} L at ${N} atm\\?$`)))) { v = numV(m[3]) * numV(m[2]) / (numV(m[1]) * Rg); unit = 'K'; }
    else throw new Error('prompt not understood');
    if (/°C/.test(q.prompt) !== /K = °C \+ 273/.test(q.note)) throw new Error('°C in the problem but no K = °C + 273 in the note (or the other way round)');
    return numSol(v, SF3V, unit);
  },
  molarity(q) {
    needRound3(q);
    const N = String.raw`(\d[\d,]*(?:\.\d+)?)`, S = String.raw`.+? \((\S+)\)`, V = String.raw`${N} (mL|L)`;
    const L = (x, u) => numV(x) / (u === 'mL' ? 1000 : 1);
    let m;
    if ((m = q.prompt.match(new RegExp(`^What is the molarity of a solution made by dissolving ${N} (mol|g) of ${S} in enough water to make ${V} of solution\\?$`)))) {
      const f = unsubV(m[3]);
      if (m[2] === 'g') massNoteOk(q, [f]);
      const mol = m[2] === 'g' ? numV(m[1]) / mmV(f) : numV(m[1]);
      return numSol(mol / L(m[4], m[5]), SF3V, 'M');
    }
    if ((m = q.prompt.match(new RegExp(`^How many (moles|grams) of ${S} are in ${V} of an? ${N} M solution\\?$`)))) {
      const f = unsubV(m[2]);
      if (m[1] === 'grams') massNoteOk(q, [f]);
      const mol = L(m[3], m[4]) * numV(m[5]);
      const sol = numSol(m[1] === 'grams' ? mol * mmV(f) : mol, SF3V, m[1] === 'grams' ? 'g' : 'mol');
      sol.ctx = { M: numV(m[5]) };
      return sol;
    }
    throw new Error('prompt not understood');
  },
  dilution(q) {
    needRound3(q);
    const N = String.raw`(\d[\d,]*(?:\.\d+)?)`, F = String.raw`(\S+)`;
    let m;
    if ((m = q.prompt.match(new RegExp(`^How many mL of ${N} M ${F} are needed to make ${N} mL of ${N} M ${F}\\?$`)))) {
      if (m[2] !== m[5]) throw new Error('two different solutes');
      if (!(numV(m[1]) > numV(m[4]))) throw new Error('the stock is not more concentrated');
      return numSol(numV(m[4]) * numV(m[3]) / numV(m[1]), SF3V, 'mL');
    }
    if ((m = q.prompt.match(new RegExp(`^${N} mL of ${N} M ${F} is diluted to ${N} mL\\. What is the new concentration\\?$`)))) {
      if (!(numV(m[4]) > numV(m[1]))) throw new Error('the volume does not grow');
      return numSol(numV(m[2]) * numV(m[1]) / numV(m[4]), SF3V, 'M');
    }
    if ((m = q.prompt.match(new RegExp(`^To what total volume must ${N} mL of ${N} M ${F} be diluted to make it ${N} M\\?$`)))) {
      if (!(numV(m[2]) > numV(m[4]))) throw new Error('the concentration does not fall');
      return numSol(numV(m[2]) * numV(m[1]) / numV(m[4]), SF3V, 'mL');
    }
    if ((m = q.prompt.match(new RegExp(`^A student dilutes ${N} mL of a solution of ${F} to ${N} mL\\. The new concentration is ${N} M\\. What was the original concentration\\?$`)))) {
      return numSol(numV(m[4]) * numV(m[3]) / numV(m[1]), SF3V, 'M');
    }
    throw new Error('prompt not understood');
  },
  ph(q) {
    const E = String.raw`1 × 10\^-(\d+) M`;
    let m, v, sci = false;
    if ((m = q.prompt.match(new RegExp(`^A solution has \\[H⁺\\] = ${E}\\. What is its pH\\?$`)))) v = Number(m[1]);
    else if ((m = q.prompt.match(/^A solution has a pH of (\d+)\. What is its \[H⁺\]\?$/))) { v = 10 ** -Number(m[1]); sci = true; }
    else if ((m = q.prompt.match(/^A solution has a pH of (\d+(?:\.\d)?)\. What is its pOH\?$/)) || (m = q.prompt.match(/^A solution has a pOH of (\d+(?:\.\d)?)\. What is its pH\?$/))) v = Math.round((14 - Number(m[1])) * 10) / 10;
    else if ((m = q.prompt.match(new RegExp(`^A solution has \\[OH⁻\\] = ${E}\\. What is its pH\\?$`)))) v = 14 - Number(m[1]);
    else if ((m = q.prompt.match(new RegExp(`^A solution has \\[H⁺\\] = ${E}\\. What is its pOH\\?$`)))) v = 14 - Number(m[1]);
    else if ((m = q.prompt.match(/^A solution has a pH of (\d+)\. What is its \[OH⁻\]\?$/))) { v = 10 ** -(14 - Number(m[1])); sci = true; }
    else throw new Error('prompt not understood');
    const sol = numSol(v, { exact: true }, sci ? 'M' : '', { units: sci ? ['M'] : [''] });
    if (sci) {
      const e = Math.round(-Math.log10(v));
      sol.format = (s) => s === `1 × 10^-${e} M`;
      sol.inputs = [{ input: `10^-${e} M`, expect: true, why: '10^-n alone' }, { input: `1 x 10^${e} M`, expect: false, why: 'the exponent\'s sign lost' }, { input: `1 × 10^-${14 - e} M`, expect: e === 7, why: '[OH⁻] for [H⁺]' }];
    } else {
      const asked = q.prompt.match(/What is its (pH|pOH)\?$/)[1], other = asked === 'pH' ? 'pOH' : 'pH';
      sol.inputs = [{ input: `${asked} = ${v}`, expect: true, why: `"${asked} =" in front` }, { input: `${asked} ${v}`, expect: true, why: `"${asked}" in front` },
        { input: `${other} = ${v}`, expect: false, why: `the right number labelled ${other}` }, { input: `${-v}`, expect: v === 0, why: 'the sign flipped' }];
    }
    if (sci) {
      const asked = q.prompt.includes('[H⁺]?') ? '[H+]' : '[OH-]', other = asked === '[H+]' ? '[OH-]' : '[H+]';
      const e = Math.round(-Math.log10(v));
      sol.inputs.push({ input: `${asked} = 1 x 10^-${e} M`, expect: true, why: `"${asked} =" in front` }, { input: `${other} = 1 x 10^-${e} M`, expect: false, why: `the right number labelled ${other}` });
      if (asked === '[H+]') sol.inputs.push({ input: `[H3O+] = 1 x 10^-${e} M`, expect: true, why: '"[H3O+] =" in front' });
    }
    return sol;
  },
  acidbase(q) {
    const E = String.raw`1 × 10\^-(\d+) M`;
    let m, ph;
    if ((m = q.prompt.match(new RegExp(`^A solution has \\[H⁺\\] = ${E}\\. What is its pH, and is it acidic, basic or neutral\\?$`)))) ph = Number(m[1]);
    else if ((m = q.prompt.match(new RegExp(`^A solution has \\[OH⁻\\] = ${E}\\. What is its pH, and is it acidic, basic or neutral\\?$`)))) ph = 14 - Number(m[1]);
    else if ((m = q.prompt.match(/^A solution has a pOH of (\d+)\. What is its pH, and is it acidic, basic or neutral\?$/))) ph = 14 - Number(m[1]);
    else throw new Error('prompt not understood');
    const cls = ph < 7 ? 'acidic' : ph > 7 ? 'basic' : 'neutral';
    const want = `pH ${ph} — ${cls}`;
    return { expect: want, isRight: (s) => normAns(s) === want };
  },
};
const NEW_NUMERIC = new Set(['avgmass', 'valence', 'molar', 'moles', 'pcomp', 'stoich', 'yield', 'pressure', 'gaslaw', 'ideal', 'molarity', 'dilution', 'ph']);

/** One generated Units 5–12 problem (or its multiple-choice version). */
function checkNew(q, mc) {
  const problems = [];
  const texts = [q.prompt, q.note, q.answer, ...(q.options || []), q.exp, q.hint, q.source].filter((x) => x != null);
  for (const t of texts) problems.push(...FLOAT_NOISE(String(t)));
  for (const t of q.accept || []) problems.push(...FLOAT_NOISE(String(t), true));
  if (/\^/.test(q.note || '')) problems.push('a caret in the note (it is shown as plain text)');
  // worked solutions and hints are DOM: powers are real superscripts, never "10^(−pH)"
  if (!mc) for (const [t, where] of [[q.exp, 'worked solution'], [q.hint, '"Show me how"']]) if (/\^/.test(t || '')) problems.push(`a caret in the ${where}: ${t.slice(0, 200)}`);
  let sol;
  try { sol = NEW[q.skill](q); } catch (e) { return [...problems, `solver: ${e.message}`]; }
  if (q.type === 'mc') {
    if (!Array.isArray(q.options) || q.options.length !== 4) return [...problems, `expected 4 options, got ${q.options && q.options.length}`];
    if (new Set(q.options).size !== 4) problems.push('two options say the same thing');
    if (!q.options.includes(q.answer)) problems.push('the answer is not among the options');
    const right = q.options.filter((o) => sol.isRight(o));
    if (right.length !== 1) problems.push(`${right.length} options are right (${right.join(' | ')}); expected ${sol.expect}`);
    else if (right[0] !== q.answer) problems.push(`the right option is "${right[0]}", not "${q.answer}"`);
    if (NEW_NUMERIC.has(q.skill)) {
      const av = sol.optValue(q.answer);
      for (const o of q.options) {
        if (o === q.answer) continue;
        const ov = sol.optValue(o);
        if (ov == null || Number.isNaN(ov)) problems.push(`option not understood: ${o}`);
        else if (relClose(ov, av, 0.01)) problems.push(`option "${o}" is within 1% of the answer`);
        if (splitV(o)?.unit !== splitV(q.answer)?.unit) problems.push(`option "${o}" has a different unit`);
      }
    }
    if (sol.extra) problems.push(...sol.extra());
  } else {
    if (!sol.isRight(q.answer)) problems.push(`answer "${q.answer}" is wrong: expected ${sol.expect}`);
    if (sol.format && !sol.format(q.answer)) problems.push(`answer "${q.answer}" is not written to the stated precision`);
    if (sol.extra) problems.push(...sol.extra());
    if (NEW_NUMERIC.has(q.skill) && (typeof q.value !== 'number' || !relClose(q.value, splitV(q.answer)?.v, 1e-9))) problems.push(`value ${q.value} disagrees with the answer`);
  }
  return problems;
}
function newInputs(q) {
  let sol;
  try { sol = NEW[q.skill](q); } catch { return []; }
  const reqs = [{ input: q.answer, expect: true, why: 'canonical answer' }];
  for (const x of q.accept || []) reqs.push({ input: x, expect: true, why: `accepted variant "${x}"` });
  if (NEW_NUMERIC.has(q.skill)) reqs.push(...numInputs(q, sol));
  reqs.push(...(sol.inputs || []));
  return reqs;
}

/* ------------------------------------------------ worked solutions */
const CHEM_UNITS = ['formula units', 'molecules', 'atoms', 'g', 'mol', 'mL', 'L', 'atm', 'kPa', 'mmHg'];
function chemCell(t) {
  const m = normAns(t).match(/^(\d[\d,]*(?:\.\d+)?(?: × 10\^-?\d+)?) (.+)$/);
  if (!m) return null;
  const u = CHEM_UNITS.find((x) => m[2] === x || m[2].startsWith(`${x} `));
  if (!u) return null;
  const sub = m[2].slice(u.length).trim();
  return { v: numV(m[1]), u, sub: sub ? unsubV(sub) : '', key: `${u}|${sub ? unsubV(sub) : ''}` };
}
/** Is top / bottom a true equality from the unit's facts? */
function factorTrue(t, b, ctx) {
  const pair = (x, y) => (t.u === x && b.u === y) || (t.u === y && b.u === x);
  const PR = { atm: 1, kPa: 101.3, mmHg: 760 };
  if (pair('g', 'mol')) { const g = t.u === 'g' ? t : b, mo = g === t ? b : t; return !!g.sub && g.sub === mo.sub && mo.v === 1 && Math.round(g.v * 100) === mmHund(g.sub) && relClose(g.v, mmHund(g.sub) / 100); }
  if (PARTICLE_WORDS.includes(t.u) || PARTICLE_WORDS.includes(b.u)) { const p = PARTICLE_WORDS.includes(t.u) ? t : b, mo = p === t ? b : t; return mo.u === 'mol' && mo.v === 1 && p.sub === mo.sub && relClose(p.v, NA_V) && p.u === particleWord(p.sub); }
  if (t.u === 'mol' && b.u === 'mol') return !!(ctx.coef && t.sub !== b.sub && ctx.coef[t.sub] === t.v && ctx.coef[b.sub] === b.v);
  if (pair('mol', 'L')) { const mo = t.u === 'mol' ? t : b, l = mo === t ? b : t; return l.v === 1 && ctx.M != null && relClose(mo.v, ctx.M); }
  if (pair('L', 'mL')) { const l = t.u === 'L' ? t : b, ml = l === t ? b : t; return l.v === 1 && ml.v === 1000; }
  if (PR[t.u] && PR[b.u] && t.u !== b.u) return relClose(t.v, PR[t.u]) && relClose(b.v, PR[b.u]);
  return false;
}
function checkChemFence(f, q, ctx, where) {
  const bad = [];
  const say = (m) => bad.push(`${where}: ${m}`);
  if (f.rows.length !== 2) return [`${where}: ${f.rows.length} rows`];
  const [top, bot] = f.rows;
  const g = chemCell(top[0].text);
  if (!g) return [`${where}: the given amount "${top[0].text}" is not understood`];
  const gAmt = normAns(top[0].text).match(/^(\S+(?: × 10\^-?\d+)?)/)[1].replace(/,/g, '');
  if (!normAns(q.prompt).replace(/,/g, '').includes(gAmt)) say(`the fence starts from ${top[0].text}, which is not in the problem`);
  let key = g.key, tp = g.v, bp = 1;
  for (let i = 1; i < top.length; i++) {
    if (top[i].blank) continue;
    const t = chemCell(top[i].text), b = chemCell(bot[i].text);
    if (!t || !b) { say(`factor ${i} not understood: ${top[i].text} / ${bot[i].text}`); continue; }
    if (!factorTrue(t, b, ctx)) say(`${top[i].text} / ${bot[i].text} is not a true equality`);
    if (b.key !== key) say(`factor ${i} has ${bot[i].text} on the bottom, but the unit to cancel is ${key.replace('|', ' ')}`);
    if (!bot[i].struck) say(`the bottom unit of factor ${i} is not struck through`);
    key = t.key; tp *= t.v; bp *= b.v;
  }
  if (f.eq) {
    const n = chemCell(f.eq.num.replace('…', ''));
    if (!n || !relClose(n.v, tp, 1e-6)) say(`the top line multiplies to ${tp}, but the fence shows ${f.eq.num}`);
    else if (n.key !== key) say(`the top line's unit is ${n.key}, expected ${key}`);
    if (!relClose(numV(f.eq.den.replace('…', '')), bp, 1e-6)) say(`the bottom line multiplies to ${bp}, but the fence shows ${f.eq.den}`);
    const a = chemCell(f.eq.ans.replace('…', ''));
    const v = tp / bp;
    if (!a || !within3sf(a.v, v)) say(`${f.eq.num} ÷ ${f.eq.den} is ${v}, but the fence says ${f.eq.ans}`);
  }
  return bad;
}
/** "Show me how" teaches the method; its plain text must not state the
    answer (a boxed answer is caught separately). Names, formulas,
    configurations and coefficients: the exact string, and for a name its
    Roman numeral, the metal's charge and the prefixed words. Numbers: the
    stated answer, unless the problem itself already shows that number. */
const escReV = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const MOL_PREFIX = /^(mono|di|tri|tetra|penta|hexa|hepta|octa|nona|deca)[a-z]/;
const numInText = (text, num) => new RegExp(`(^|[^\\d.,^])${escReV(num)}(?!\\d|[.,]\\d)`).test(text);
function hintLeaks(q) {
  if (q.hint == null || q.type !== 'written') return [];
  const h = normAns(q.hint), hl = h.toLowerCase();
  const prompt = normAns(q.prompt).replace(/,/g, '');
  const bad = [];
  const say = (m) => bad.push(`"Show me how" gives away ${m}: ${h.slice(0, 400)}`);
  const ans = normAns(q.answer);
  // names ignore capitals; formulas and configurations do not (CO is not "co" in "count")
  const fold = (t) => (q.skill === 'naming' ? t.toLowerCase() : t);
  if (!NEW_NUMERIC.has(q.skill) && fold(h).includes(fold(ans)) && !fold(prompt).includes(fold(ans))) say(`the answer "${q.answer}"`);
  if (q.skill === 'naming') {
    const tm = q.answer.match(/^([a-z]+)\(([IV]+)\)/);
    if (tm) {
      const c = ROMAN_N[tm[2]], sym = V_MULTI[tm[1]][0];
      if (h.includes(`(${tm[2]})`)) say(`the Roman numeral (${tm[2]})`);
      if (new RegExp(`\\+\\s*${c}(?!\\d)`).test(h) || h.includes(`${sym}${c === 1 ? '' : SUPS_V[c]}⁺`) || h.includes(`${sym}^${c === 1 ? '' : c}+`)) say(`the metal's charge +${c}`);
    } else {
      for (const w of ans.toLowerCase().split(' ')) if (MOL_PREFIX.test(w) && new RegExp(`\\b${w}\\b`).test(hl)) say(`the prefixed word "${w}"`);
      const mol = unsubV(q.prompt.match(/^Name the compound (.+)\.$/)[1]).match(/^([A-Z][a-z]?)(\d*)([A-Z][a-z]?)(\d*)$/);
      if (mol) for (const [sym, n] of [[mol[1], mol[2] || 1], [mol[3], mol[4] || 1]]) if (hl.includes(`= ${n} ${VPT[sym][1]}`)) say(`the count "${n} ${VPT[sym][1]}"`);
    }
  } else if (q.skill === 'pne') {
    const [p, n, e] = ans.match(/\d+/g);
    for (const [x, what] of [[n, 'neutrons'], [e, 'electrons']]) if (!numInText(prompt, x) && new RegExp(`= ${x}(?!\\d| ?[-+×÷])`).test(h)) say(`the ${what} (${x})`);
    void p;
  } else if (NEW_NUMERIC.has(q.skill)) {
    const a = splitV(q.answer);
    if (a) {
      const num = a.n.replace(/,/g, '');
      const hn = h.replace(/(\d),(?=\d{3})/g, '$1');
      // stated as a result: "= 47.6", "is 47.6", or with the answer's unit
      // (a number followed by a different unit is something else: "= 414 K" is
      // not the answer "414 L")
      const unitStr = a.unit ? (a.unit === '%' ? '%' : ` ${a.unit}`) : '';
      const stated = [...hn.matchAll(new RegExp(`(?:=|\\bis|\\bof) ${escReV(num)}(?!\\d| ?[-+×÷]|[.,]\\d)`, 'g'))].some((m) => {
        const after = hn.slice(m.index + m[0].length);
        return !/^ ?[A-Za-z°%]/.test(after) || (unitStr && after.startsWith(unitStr));
      }) || (unitStr && new RegExp(`(^|[^\\d.,])${escReV(num + unitStr)}(?![A-Za-z/])`).test(hn));
      // (1.00 mol → 6.02 × 10^23, 1.00 atm → 760 mmHg: the answer is the
      // conversion factor itself, which the method has to name)
      if (!numInText(prompt, num) && stated && !['6.02 × 10^23', '760', '101.3'].includes(num)) say(`the number ${a.n}`);
    }
  }
  return bad;
}
function checkNewWork(q) {
  const w = q.work, hw = q.hintWork;
  if (!w) return ['no worked solution'];
  const bad = [];
  if (!w.boxes.length) bad.push('no boxed answer in the worked solution');
  else if (normAns(w.boxes[w.boxes.length - 1]) !== normAns(q.answer)) bad.push(`the worked solution ends at "${w.boxes[w.boxes.length - 1]}", not the answer "${q.answer}"`);
  if (hw && hw.boxes.length) bad.push(`"Show me how" gives away a boxed answer (${hw.boxes.join(', ')})`);
  bad.push(...hintLeaks(q));
  let ctx = {};
  try { ctx = NEW[q.skill](q).ctx || {}; } catch { /* reported elsewhere */ }
  w.fences.forEach((f, i) => bad.push(...checkChemFence(f, q, ctx, `fence ${i + 1}`)));
  (hw ? hw.fences : []).forEach((f, i) => bad.push(...checkChemFence({ ...f, eq: null }, q, ctx, `hint fence ${i + 1}`)));
  // every °C → K conversion
  for (const ln of [...w.formula, ...(hw ? hw.formula : [])]) {
    const k = normAns(ln).match(/^T[₁₂]? = (-?\d+) \+ 273 = (\d+) K$/);
    if (k) {
      if (Number(k[1]) + 273 !== Number(k[2])) bad.push(`"${ln}" is wrong`);
      if (!normAns(q.prompt).includes(`${k[1]} °C`)) bad.push(`"${ln}" converts a temperature the problem does not give`);
    }
  }
  // molar-mass tables: atoms × atomic mass = subtotal
  if (q.skill === 'molar') {
    const f = unsubV(q.prompt.match(/, (\S+)\?$/)[1]);
    const at = vAtoms(f);
    const t = w.tables[0] || [];
    const body = t.slice(1);
    if (body.length !== Object.keys(at).length) bad.push(`the table has ${body.length} rows for ${Object.keys(at).length} elements`);
    for (const [e, mid, tot] of body) {
      const mm = (mid || '').match(/^(\d+) × (\d+\.\d\d)$/);
      if (!mm || Number(mm[1]) !== at[e] || Number(mm[2]) !== VPT[e]?.[2]) bad.push(`table row "${e} | ${mid}" is not ${at[e]} × ${VPT[e]?.[2]}`);
      else if (Math.round(numV(tot) * 100) !== at[e] * HUND(e)) bad.push(`${mid} is not ${tot}`);
    }
  }
  // balancing tables: atoms on each side
  if (q.skill === 'balance') {
    const eq = parseEqV(q.prompt.match(/^Balance the equation: (.+)$/)[1]);
    const cs = solveCoefficients(eq) || [];
    for (const [tab, coefs, label] of [[w.tables[0], cs, 'worked solution'], [hw && hw.tables[0], cs.map(() => 1), 'hint']]) {
      if (!tab) { bad.push(`no atom-count table in the ${label}`); continue; }
      for (const [e, l, r] of tab.slice(1)) {
        const count = (sp, cc) => sp.reduce((t, x, i) => t + cc[i] * (vAtoms(x.f)[e] || 0), 0);
        const L = count(eq.r, coefs.slice(0, eq.r.length)), Rr = count(eq.p, coefs.slice(eq.r.length));
        const lastNum = (s) => Number((String(s).match(/(\d+)(?:\s*[✓✗])?$/) || [])[1]);
        if (lastNum(l) !== L || lastNum(r) !== Rr) bad.push(`${label}: ${e} counts ${l} | ${r}, expected ${L} | ${Rr}`);
        if (/✓/.test(r) !== (L === Rr)) bad.push(`${label}: ${e} is marked ${/✓/.test(r) ? 'equal' : 'not equal'}`);
      }
    }
  }
  return bad;
}

/** The Lab's data tables against the copies above. */
function checkData(d) {
  const bad = [];
  const zs = new Set();
  for (const [z, sym, name, mass] of d.elements) {
    zs.add(z);
    if (!VPT[sym]) { bad.push(`element ${sym} is not in the verifier's table`); continue; }
    const [vz, vn, vm] = VPT[sym];
    if (z !== vz || name !== vn || Number(mass) !== vm || !/^\d+\.\d\d$/.test(mass)) bad.push(`element ${sym}: Lab has ${z} ${name} ${mass}, verifier has ${vz} ${vn} ${vm.toFixed(2)}`);
  }
  for (let z = 1; z <= 38; z++) if (!zs.has(z)) bad.push(`element ${z} is missing`);
  for (const s of ['Ag', 'Sn', 'I', 'Ba', 'Au', 'Hg', 'Pb']) if (!zs.has(VPT[s][0])) bad.push(`${s} is missing`);
  for (const c of d.cations) {
    const v = V_CATIONS[c.name];
    if (!v || v[0] !== c.f || v[1] !== c.c || !!v[2] !== !!c.poly) bad.push(`cation ${c.name}: Lab has ${c.f} ${c.c}+`);
  }
  for (const c of d.multi) {
    const v = V_MULTI[c.name];
    if (!v || v[0] !== c.f || v[1].join() !== c.cs.join()) bad.push(`metal ${c.name}: Lab has ${c.f} ${c.cs.join('/')}`);
  }
  for (const a of d.anions) {
    const v = V_ANIONS[a.name];
    if (!v || v[0] !== a.f || -v[1] !== a.c || !!v[2] !== !!a.poly) bad.push(`anion ${a.name}: Lab has ${a.f} ${a.c}`);
    if (a.alt && vAtoms(a.alt) && JSON.stringify(Object.entries(vAtoms(a.alt)).sort()) !== JSON.stringify(Object.entries(vAtoms(a.f)).sort())) bad.push(`anion ${a.name}: ${a.alt} is not the same ion as ${a.f}`);
  }
  for (const [sym, as] of Object.entries(d.isotopes)) for (const a of as) if (!(V_ISO[sym] || []).includes(a)) bad.push(`${sym}-${a} is not a real isotope`);
  for (const [sym, cs] of Object.entries(d.ionCharges)) for (const c of cs) if (!(V_ION_CHARGES[sym] || []).includes(c)) bad.push(`${sym} ${c} is not a common ion charge`);
  for (const [src, type, also = []] of d.reactions) {
    const eq = parseEqV(src.replace(' -> ', ' → '));
    const cs = [...eq.r, ...eq.p].map((x) => x.c);
    const low = solveCoefficients({ r: eq.r.map((x) => ({ ...x, c: 1 })), p: eq.p.map((x) => ({ ...x, c: 1 })) });
    if (!eqBalanced(eq, cs)) bad.push(`reaction ${src} is not balanced`);
    else if (!low || low.join() !== cs.join()) bad.push(`reaction ${src}: the lowest coefficients are ${low}`);
    const types = reactionTypes(eq);
    if (!types.has(type)) bad.push(`reaction ${src} does not look like ${type} (${[...types].join(', ')})`);
    for (const t of types) if (t !== type && !also.includes(t)) bad.push(`reaction ${src} could also be called ${t}`);
  }
  for (const f of d.molecular) {
    try { const n = vNamesOf(f); if (!n.length) bad.push(`${f} has no name`); } catch (e) { bad.push(`molecular ${f}: ${e.message}`); }
  }
  return bad;
}

/* ---------------------------------------------------------------- run */
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|fonts\.g|ERR_CERT|ERR_NAME|ERR_INTERNET|ERR_FILE/i.test(m.text())) pageErrors.push(m.text()); });
await page.goto(`${URL_}#/`, { waitUntil: 'load' });
await page.waitForFunction(() => window.CQLab && window.CQ, null, { timeout: 10000 });

const generated = await page.evaluate(({ N, MC }) => {
  window.__lab = [];
  const pack = (q, skill, level, mc) => {
    const idx = window.__lab.push(q) - 1;
    // Read text as a screen reader gets it: decorative copies (the digit-hop
    // strip, the chart) are aria-hidden and would run digits together.
    const text = (x) => {
      if (x == null) return null;
      if (typeof x === 'string') return x;
      const c = x.cloneNode(true);
      c.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
      return c.textContent;
    };
    // The parts of a worked solution that make claims, pulled out so Node can
    // check each claim against its own arithmetic.
    const structure = (x) => {
      if (!x || typeof x === 'string') return null;
      const t = (n) => (n ? text(n).replace(/\s+/g, ' ').trim() : null);
      return {
        fences: [...x.querySelectorAll('.lab-fence-wrap')].map((w) => ({
          rows: [...w.querySelectorAll('.lab-fence tr')].map((tr) => [...tr.children].map((td) => ({
            text: td.textContent.replace(/\s+/g, ' ').trim(), struck: !!td.querySelector('s'), blank: td.classList.contains('blank'),
          }))),
          eq: w.querySelector('.lab-fence-eq .lab-frac') ? {
            num: w.querySelector('.lab-fence-eq .lab-frac .num').textContent.trim(),
            den: w.querySelector('.lab-fence-eq .lab-frac .den').textContent.trim(),
            ans: w.querySelector('.lab-fence-eq .lab-ans').textContent.trim(),
          } : null,
        })),
        formula: [...x.querySelectorAll('.lab-formula .ln')].map((n) => n.textContent.replace(/\s+/g, ' ').trim()),
        steps: [...x.querySelectorAll('.lab-step, .lab-aside, .lab-steps li')].map(t),
        hops: x.querySelectorAll('.lab-hops .hop').length,
        hopDigits: x.querySelectorAll('.lab-hops .dg').length,
        chart: [...x.querySelectorAll('.lab-chart .cell')].map((c) => ({ label: c.querySelector('b').textContent, from: c.classList.contains('from'), to: c.classList.contains('to') })),
        boxes: [...x.querySelectorAll('.lab-ans')].map((n) => text(n).replace(/\s+/g, ' ').trim()),
        tables: [...x.querySelectorAll('.lab-table')].map((tb) => [...tb.querySelectorAll('tr')].map((tr) => [...tr.children].map((c) => c.textContent.replace(/\s+/g, ' ').trim()))),
      };
    };
    return {
      idx, skill, level, mc, type: q.type, prompt: q.prompt, note: q.note, answer: q.answer, accept: q.accept,
      value: q.value, unit: q.unit, options: q.options, exp: text(q.explanation), hint: mc ? null : text(q.hint()), source: q.source,
      id: q.id, setId: q.setId,
      work: mc ? null : structure(q.explanation), hintWork: mc ? null : structure(q.hint()),
    };
  };
  const out = [];
  for (const s of window.CQLab.skills) {
    for (let i = 0; i < N; i++) {
      const level = 1 + (i % 3);
      try { out.push(pack(window.CQLab.generate(s.id, { difficulty: level }), s.id, level, false)); } catch (e) { out.push({ skill: s.id, level, error: String(e && e.stack || e) }); }
    }
    for (let i = 0; i < MC; i++) {
      const level = 1 + (i % 3);
      try { out.push(pack(window.CQLab.generateMC(s.id, { difficulty: level }), s.id, level, true)); } catch (e) { out.push({ skill: s.id, level, mc: true, error: String(e && e.stack || e) }); }
    }
  }
  const games = {};
  for (const id of ['c1', 'c2', 'c3', 'c4', 'chem-all', 'alg1-u1', 'alg1-all', 'chem-u5', 'chem-u6', 'chem-u7', 'chem-u8', 'chem-u9', 'chem-u10', 'chem-u11', 'chem-u12']) {
    const qs = window.CQLab.gameQuestions(id);
    games[id] = { n: qs.length, bad: qs.filter((q) => q.type !== 'mc' || !q.options || q.options.length !== 4 || !q.options.includes(q.answer) || !/^lab:/.test(q.id)).length, sets: [...new Set(qs.map((q) => q.setId))] };
  }
  const skills = window.CQLab.skills;
  // the Lab's data tables, to compare with this file's own copy
  return { out, games, skills, data: JSON.parse(JSON.stringify(window.CQLab.data)) };
}, { N, MC });

const rows = {};
const failures = [];
const note = (q, msg) => {
  (rows[q.skill] ||= { gen: 0, mc: 0, fail: 0, checks: 0 }).fail++;
  if (failures.length < 60) failures.push(`${q.skill}${q.mc ? ' (mc)' : ''} L${q.level}: ${msg}\n      prompt: ${q.prompt}\n      answer: ${q.answer}${q.options ? `\n      options: ${q.options.join(' | ')}` : ''}`);
};
const requests = [];
for (const q of generated.out) {
  const r = (rows[q.skill] ||= { gen: 0, mc: 0, fail: 0, checks: 0 });
  if (q.error) { note(q, `generator threw: ${q.error.split('\n')[0]}`); continue; }
  if (q.mc) r.mc++; else r.gen++;
  const expectSet = generated.skills.find((s) => s.id === q.skill)?.setId;
  if (q.id !== `lab:${q.skill}`) note(q, `id is ${q.id}`);
  if (q.setId !== expectSet) note(q, `setId is ${q.setId}, expected ${expectSet}`);
  if (NEW[q.skill]) {
    // Units 5–12
    for (const p of checkNew(q, q.mc)) note(q, p);
    if (!q.mc) { r.work = (r.work || 0) + 1; for (const p of checkNewWork(q)) note(q, `worked solution: ${p}`); }
    if (!q.mc && q.type === 'written') for (const req of newInputs(q)) requests.push({ ...req, idx: q.idx, q });
    continue;
  }
  for (const p of checkQuestion(q, q.mc)) note(q, p);
  if (!q.mc) {
    let sol = null;
    try { sol = solvers[q.skill](q); } catch { /* reported by checkQuestion */ }
    if (sol) { r.work = (r.work || 0) + 1; for (const p of checkWork(q, sol)) note(q, `worked solution: ${p}`); }
  }
  if (!q.mc && q.type === 'written') for (const req of checkInputs(q)) requests.push({ ...req, idx: q.idx, q });
}

// Ask the page's own checkers about every input.
const verdicts = await page.evaluate((reqs) => reqs.map(({ idx, input, grader }) => {
  const q = window.__lab[idx];
  return { core: grader ? null : window.CQ.checkWritten(q, input), lab: window.CQLab.grade(q, input).ok };
}), requests.map(({ idx, input, grader }) => ({ idx, input, grader })));
requests.forEach((req, i) => {
  const v = verdicts[i];
  rows[req.q.skill].checks++;
  if (v.core != null && v.core !== req.expect) note(req.q, `CQ.checkWritten ${v.core ? 'accepted' : 'rejected'} ${req.why}: "${req.input}"`);
  if (v.lab !== req.expect) note(req.q, `the Lab's grader ${v.lab ? 'accepted' : 'rejected'} ${req.why}: "${req.input}"`);
});

// Game sources: about 12 multiple-choice problems for every set with Lab
// skills and for chem-all; none elsewhere (Concepts 1 and 4, Unit 7, Algebra).
const LAB_SET_IDS = ['c2', 'c3', 'chem-u5', 'chem-u6', 'chem-u8', 'chem-u9', 'chem-u10', 'chem-u11', 'chem-u12'];
for (const [id, g] of Object.entries(generated.games)) {
  const want = [...LAB_SET_IDS, 'chem-all'].includes(id);
  if (LAB_SET_IDS.includes(id) && id.startsWith('chem-u') && g.sets.some((x) => x !== id)) failures.push(`${id} games got problems from ${g.sets.filter((x) => x !== id).join(', ')}`);
  if (want && g.n < 10) failures.push(`game source for ${id} gave only ${g.n} problems`);
  if (!want && g.n) failures.push(`game source for ${id} should give nothing, gave ${g.n}`);
  if (g.bad) failures.push(`game source for ${id}: ${g.bad} malformed questions`);
  if (id === 'c2' && g.sets.some((s) => s !== 'c2')) failures.push('Concept 2 games got Concept 3 problems');
  if (id === 'c3' && g.sets.some((s) => s !== 'c3')) failures.push('Concept 3 games got Concept 2 problems');
}
// The Units 5–12 tables against this file's own copy.
const dataProblems = checkData(generated.data);
for (const d of dataProblems) failures.push(`data: ${d}`);
for (const e of pageErrors) failures.push(`page error: ${e}`);
await browser.close();

console.log(`Problem Lab — ${N} problems and ${MC} multiple-choice versions per skill, checked independently\n`);
const pad = (s, n) => String(s).padEnd(n);
console.log(`${pad('skill', 11)}${pad('set', 10)}${pad('problems', 10)}${pad('mc', 6)}${pad('worked', 8)}${pad('grading', 9)}${pad('failures', 9)}`);
for (const s of generated.skills) {
  const r = rows[s.id] || { gen: 0, mc: 0, fail: 0, checks: 0 };
  console.log(`${pad(s.id, 11)}${pad(s.setId, 10)}${pad(r.gen, 10)}${pad(r.mc, 6)}${pad(r.work || 0, 8)}${pad(r.checks, 9)}${pad(r.fail, 9)}`);
}
console.log(`\ngame sources: ${Object.entries(generated.games).map(([id, g]) => `${id} ${g.n}`).join(', ')}`);
const d = generated.data;
console.log(`data: ${d.elements.length} elements, ${d.cations.length + d.multi.length} cations, ${d.anions.length} anions, ${Object.keys(d.isotopes).length} elements' isotopes, ${d.reactions.length} reactions, ${d.molecular.length} molecular compounds — checked against this file's own copy${dataProblems.length ? ` (${dataProblems.length} problems)` : ''}`);
const total = Object.values(rows).reduce((n, r) => n + r.fail, 0) + failures.filter((f) => !/^\w+( \(mc\))? L\d/.test(f)).length;
if (failures.length) {
  console.log(`\n${total} failure(s)${failures.length >= 60 ? ' (first 60 shown)' : ''}:`);
  for (const f of failures) console.log(`  ${f}`);
  process.exit(1);
}
console.log('\nOK: every generated problem checks out.');
