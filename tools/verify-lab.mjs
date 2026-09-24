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
  for (const id of ['c1', 'c2', 'c3', 'c4', 'chem-all', 'alg1-u1', 'alg1-all']) {
    const qs = window.CQLab.gameQuestions(id);
    games[id] = { n: qs.length, bad: qs.filter((q) => q.type !== 'mc' || !q.options || q.options.length !== 4 || !q.options.includes(q.answer) || !/^lab:/.test(q.id)).length, sets: [...new Set(qs.map((q) => q.setId))] };
  }
  const skills = window.CQLab.skills;
  return { out, games, skills };
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

// Game sources: about 12 multiple-choice problems for c2, c3 and chem-all; none elsewhere.
for (const [id, g] of Object.entries(generated.games)) {
  const want = ['c2', 'c3', 'chem-all'].includes(id);
  if (want && g.n < 10) failures.push(`game source for ${id} gave only ${g.n} problems`);
  if (!want && g.n) failures.push(`game source for ${id} should give nothing, gave ${g.n}`);
  if (g.bad) failures.push(`game source for ${id}: ${g.bad} malformed questions`);
  if (id === 'c2' && g.sets.some((s) => s !== 'c2')) failures.push('Concept 2 games got Concept 3 problems');
  if (id === 'c3' && g.sets.some((s) => s !== 'c3')) failures.push('Concept 3 games got Concept 2 problems');
}
for (const e of pageErrors) failures.push(`page error: ${e}`);
await browser.close();

console.log(`Problem Lab — ${N} problems and ${MC} multiple-choice versions per skill, checked independently\n`);
const pad = (s, n) => String(s).padEnd(n);
console.log(`${pad('skill', 10)}${pad('set', 5)}${pad('problems', 10)}${pad('mc', 6)}${pad('worked', 8)}${pad('grading', 9)}${pad('failures', 9)}`);
for (const s of generated.skills) {
  const r = rows[s.id] || { gen: 0, mc: 0, fail: 0, checks: 0 };
  console.log(`${pad(s.id, 10)}${pad(s.setId, 5)}${pad(r.gen, 10)}${pad(r.mc, 6)}${pad(r.work || 0, 8)}${pad(r.checks, 9)}${pad(r.fail, 9)}`);
}
console.log(`\ngame sources: ${Object.entries(generated.games).map(([id, g]) => `${id} ${g.n}`).join(', ')}`);
const total = Object.values(rows).reduce((n, r) => n + r.fail, 0) + failures.filter((f) => !/^\w+( \(mc\))? L\d/.test(f)).length;
if (failures.length) {
  console.log(`\n${total} failure(s)${failures.length >= 60 ? ' (first 60 shown)' : ''}:`);
  for (const f of failures) console.log(`  ${f}`);
  process.exit(1);
}
console.log('\nOK: every generated problem checks out.');
