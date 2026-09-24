/**
 * Checks every Algebra Lab skill (study/algebra.js) against math written
 * separately, here.
 *
 *   node tools/verify-algebra.mjs [baseUrl] [--n=150]
 *
 * With no baseUrl the page is opened from disk (file://), so no server is
 * needed. For each skill and each difficulty it generates --n problems (450+
 * per skill by default) in a real browser, then, in this file:
 *
 *   - reads the problem from its printed prompt (and, for the number line, its
 *     SVG) and works out the right answer with its own evaluator — none of
 *     algebra.js's math is called;
 *   - confirms the canonical answer is right;
 *   - builds equivalent forms (reordered terms, spacing, x^2 for x², ASCII
 *     minus, a decimal for a terminating fraction, "x = " in front, swapped
 *     factors…) and confirms CQ.checkWritten accepts every one;
 *   - builds close wrong answers (sign flipped, off by one, strict/non-strict,
 *     the expanded form for a factoring problem, a partly simplified radical…)
 *     and confirms each is rejected;
 *   - for multiple choice (native, and the game versions from generateMC)
 *     confirms four distinct options with exactly one right;
 *   - scans every string shown for NaN, Infinity, undefined, null, "+ -",
 *     "1x", "−1x", "+ 0x", x¹, −0 and float noise;
 *   - checks every WORKED STEP, clause by clause: each "A = B" must be an
 *     identity (expanding, factoring…) or hold at the solution and nowhere
 *     else nearby (equations, systems, lines); each inequality — chains and
 *     "and"/"or" compounds included — must have exactly the final solution
 *     set; each bare expression must equal the problem's own value; "±"
 *     lines are checked with + and with −. A self-test then feeds the checker
 *     a miswritten FOIL step and an inequality divide step with the old sign,
 *     and fails if either gets through.
 *
 * Prints a per-skill table and exits non-zero on any failure.
 */
import { fileURLToPath, pathToFileURL } from 'node:url';

let chromium;
try { ({ chromium } = await import('playwright')); } catch {
  const { execSync } = await import('node:child_process');
  const root = (process.env.NODE_PATH || '').split(':').filter(Boolean)[0] || execSync('npm root -g', { encoding: 'utf8' }).trim();
  ({ chromium } = await import(`file://${root}/playwright/index.mjs`));
}

const args = process.argv.slice(2);
const N = Number((args.find((a) => a.startsWith('--n=')) || '--n=150').slice(4));
const base = args.find((a) => !a.startsWith('--'));
const STUDY = base ? `${base.replace(/\/$/, '')}/study/` : pathToFileURL(fileURLToPath(new URL('../study/index.html', import.meta.url))).href;

/* ================================================== independent math */
const SUPD = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-' };
function tokenize(src) {
  const s = String(src).toLowerCase()
    .replace(/[−–]/g, '-').replace(/[×·*]/g, '*').replace(/÷/g, '/')
    .replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (m) => `^(${[...m].map((c) => SUPD[c]).join('')})`)
    .replace(/ˣ/g, '^(x)')
    .replace(/squareroot|sqrt|root/g, '√');
  const out = [];
  for (let i = 0; i < s.length;) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    const m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i));
    if (m) { out.push({ t: 'n', v: parseFloat(m[1]) }); i += m[1].length; continue; }
    if (/[a-z]/.test(c)) { out.push({ t: 'v', v: c }); i++; continue; }
    if ('+-*/^()√|'.includes(c)) { out.push({ t: c }); i++; continue; }
    throw new Error(`cannot read "${c}" in ${src}`);
  }
  return out;
}
/** Evaluates printed math: implicit multiplication, x², √n, |…|, standard precedence (−3² = −9). */
function ev(src, vars = {}) {
  const T = tokenize(src);
  let p = 0, absDepth = 0;
  const is = (t) => T[p] && T[p].t === t;
  function expr() { let v = term(); for (;;) { if (is('+')) { p++; v += term(); } else if (is('-')) { p++; v -= term(); } else return v; } }
  function term() {
    let v = unary();
    for (;;) {
      if (is('*')) { p++; v *= unary(); } else if (is('/')) { p++; v /= unary(); }
      else if (is('v') || is('(') || is('√') || (is('|') && !absDepth)) v *= power();
      else return v;
    }
  }
  function unary() { if (is('-')) { p++; return -unary(); } if (is('+')) { p++; return unary(); } return power(); }
  function power() { const b = atom(); if (is('^')) { p++; return b ** unary(); } return b; }
  function atom() {
    const k = T[p++];
    if (!k) throw new Error(`ends early: ${src}`);
    if (k.t === 'n') return k.v;
    if (k.t === 'v') { if (!(k.v in vars)) throw new Error(`unknown ${k.v} in ${src}`); return vars[k.v]; }
    if (k.t === '(') { const v = expr(); if (!is(')')) throw new Error(`missing ) in ${src}`); p++; return v; }
    if (k.t === '√') return Math.sqrt(atom());
    if (k.t === '|') { absDepth++; const v = expr(); absDepth--; if (!is('|')) throw new Error(`missing | in ${src}`); p++; return Math.abs(v); }
    throw new Error(`unexpected ${k.t} in ${src}`);
  }
  const v = expr();
  if (p !== T.length) throw new Error(`extra input in ${src}`);
  return v;
}
const close = (a, b) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-7 * Math.max(1, Math.abs(b));
const gcdN = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
/** Polynomial coefficients (degree ≤ 4) of f by solving at x = −2..2. */
function fit(f, deg = 4) {
  const xs = Array.from({ length: deg + 1 }, (_, i) => i - 2);
  const A = xs.map((x) => [...Array.from({ length: deg + 1 }, (_, k) => x ** k), f(x)]);
  for (let c = 0; c <= deg; c++) {
    let piv = c; for (let r = c + 1; r <= deg; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
    [A[c], A[piv]] = [A[piv], A[c]];
    for (let r = 0; r <= deg; r++) if (r !== c) { const k = A[r][c] / A[c][c]; for (let j = c; j <= deg + 1; j++) A[r][j] -= k * A[c][j]; }
  }
  const out = A.map((row, i) => row[deg + 1] / row[i]).map((v) => (Math.abs(v - Math.round(v)) < 1e-6 ? Math.round(v) : v));
  while (out.length > 1 && Math.abs(out[out.length - 1]) < 1e-9) out.pop();
  return out;
}
const samePoly = (f, g, vars = ['x']) => {
  for (let i = 0; i < 5; i++) {
    const pt = Object.fromEntries(vars.map((v, j) => [v, 1.13 + 0.37 * i + 0.21 * j]));
    if (!close(f(pt), g(pt))) return false;
  }
  return true;
};
/** Reads a typed/printed single number: "x = −5", "3/4", "$1,204", "25%". */
function num(s) {
  let t = String(s).trim().replace(/^[a-z][a-z0-9₀-₉()−-]*\s*=\s*/i, '').replace(/\$/g, '').replace(/(\d),(?=\d{3})/g, '$1').replace(/%$/, '');
  if (/[a-z]/i.test(t)) return NaN;
  try { return ev(t); } catch { return NaN; }
}
const isUndef = (s) => /^\s*(m\s*=\s*)?(undefined|no slope)\s*$/i.test(s);
function pair(s) {
  const t = String(s).replace(/\s+/g, '');
  let m = /^\(?x=([^,]+),y=([^,)]+)\)?$/i.exec(t);
  if (m) return [num(m[1]), num(m[2])];
  m = /^\(?y=([^,]+),x=([^,)]+)\)?$/i.exec(t);
  if (m) return [num(m[2]), num(m[1])];
  m = /^\(([^,]+),([^,]+)\)$/.exec(t);
  return m ? [num(m[1]), num(m[2])] : null;
}
function ineq(s) {
  const t = String(s).replace(/\s+/g, '').replace(/[−]/g, '-').replace(/<=|=<|≤/g, 'L').replace(/>=|=>|≥/g, 'G');
  let m = /^x([<>LG])(.+)$/.exec(t);
  if (m) return { op: m[1], v: num(m[2]) };
  m = /^(.+)([<>LG])x$/.exec(t);
  if (m) return { op: { '<': '>', '>': '<', L: 'G', G: 'L' }[m[2]], v: num(m[1]) };
  return null;
}
const OPS = { '<': (a, b) => a < b - 1e-9, '>': (a, b) => a > b + 1e-9, L: (a, b) => a <= b + 1e-9, G: (a, b) => a >= b - 1e-9 };
const opOf = (c) => ({ '<': '<', '>': '>', '≤': 'L', '≥': 'G' }[c]);
const roots = (s) => String(s).replace(/\b(or|and)\b/g, ',').split(',').map((x) => x.trim()).filter(Boolean).map(num);
const sqfree = (n) => { for (let i = 2; i * i <= n; i++) if (n % (i * i) === 0) return false; return true; };
function radical(s) {
  const t = String(s).replace(/\s+/g, '').replace(/[−]/g, '-').replace(/\*/g, '').replace(/sqrt|root|√/g, 'r');
  let m = /^(-?)(\d*)r\(?(\d+)\)?$/.exec(t);
  if (m) return { c: (m[1] ? -1 : 1) * (m[2] ? +m[2] : 1), r: +m[3] };
  m = /^(-?\d+)$/.exec(t);
  return m ? { c: +m[1], r: 1 } : null;
}
/** Top-level + or − (outside parentheses), ignoring a leading sign. */
function topLevelSum(s) {
  let depth = 0;
  const t = String(s).trim();
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (c === '(') depth++; else if (c === ')') depth--;
    else if (depth === 0 && (c === '+' || c === '-' || c === '−') && i > 0 && t.slice(0, i).trim()) return true;
  }
  return false;
}
/** "7x(2x² + 5x + 4)" → ["7x", "2x² + 5x + 4"]; a trailing ² repeats the group. */
function factorParts(s) {
  const t = String(s).trim();
  const lead = t.slice(0, t.indexOf('(') < 0 ? t.length : t.indexOf('('));
  const groups = [];
  const re = /\(([^()]*)\)([²³]|\^\d)?/g;
  let m;
  while ((m = re.exec(t))) { const k = m[2] ? Number(SUPD[m[2]] || m[2].slice(1)) : 1; for (let i = 0; i < k; i++) groups.push(m[1]); }
  return { lead, groups };
}
/** Fully factored over the integers: a product, each group primitive and irreducible. */
function fullyFactored(s) {
  if (topLevelSum(s)) return false;
  const { lead, groups } = factorParts(s);
  if (!groups.length) return false;
  if (lead && !/^[-−]?\d*(x[²³]?)?$/.test(lead.trim())) return false;
  for (const g of groups) {
    const c = fit((x) => ev(g, { x }));
    if (c.length < 2 || !c.every(Number.isInteger)) return false;
    if (c.reduce((a, b) => gcdN(a, b), 0) !== 1) return false;
    if (c.length > 3) return false;
    if (c.length === 3) { const D = c[1] ** 2 - 4 * c[2] * c[0]; if (c[0] === 0 || (D >= 0 && Number.isInteger(Math.sqrt(D)))) return false; }
  }
  return true;
}
/** Expanded and simplified: no parentheses, one term per power of x. */
function expandedForm(s) {
  const t = String(s).replace(/\s+/g, '').replace(/[−]/g, '-').replace(/\^(\d)/g, (m, d) => '²³⁴⁵⁶⁷⁸⁹'[d - 2] || m);
  if (/[()]/.test(t)) return false;
  const terms = t.replace(/(?!^)([+-])/g, ' $1').split(' ');
  const seen = new Set();
  for (const term of terms) {
    const m = /^[+-]?\d*(x([²³⁴⁵⁶⁷⁸⁹])?)?$/.exec(term);
    if (!m) return false;
    const deg = !m[1] ? 0 : m[2] ? '²³⁴⁵⁶⁷⁸⁹'.indexOf(m[2]) + 2 : 1;
    if (seen.has(deg)) return false;
    seen.add(deg);
  }
  return true;
}
const sides = (eq) => { const i = eq.indexOf('='); return [eq.slice(0, i).trim(), eq.slice(i + 1).trim()]; };
const median = (a) => { const s = a.slice().sort((x, y) => x - y), n = s.length, h = Math.floor(n / 2); return n % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };
const SUBD = { '₀': 0, '₁': 1, '₂': 2, '₃': 3, '₄': 4, '₅': 5, '₆': 6, '₇': 7, '₈': 8, '₉': 9 };

/* ----- answers in ASCII for building equivalent/wrong forms ----- */
const asc = (s) => String(s).replace(/−/g, '-');
function fracText(v) {
  if (Number.isInteger(v)) return String(v);
  for (let d = 2; d <= 400; d++) { const n = v * d; if (Math.abs(n - Math.round(n)) < 1e-9) return `${Math.round(n)}/${d}`; }
  return String(v);
}
const terminating = (v) => Math.abs(Math.round(v * 1e6) / 1e6 - v) < 1e-12;
/** "3x² − 5x + 2" → ASCII terms [["+","3x^2"],…] to reorder. */
function polyTerms(s) {
  const t = asc(s).replace(/²/g, '^2').replace(/³/g, '^3').replace(/⁴/g, '^4').replace(/\s+/g, '');
  return t.replace(/(?!^)([+-])/g, ' $1').split(' ').map((x) => (/^[+-]/.test(x) ? x : `+${x}`));
}
const joinTerms = (ts) => ts.map((x, i) => (i === 0 ? x.replace(/^\+/, '') : ` ${x[0]} ${x.slice(1)}`)).join('');
const polyText = (c) => { // coefficients low → high to ASCII "3x^2 - 5x + 2"
  const ts = [];
  for (let k = c.length - 1; k >= 0; k--) { const a = c[k]; if (!a) continue; const body = k === 0 ? String(Math.abs(a)) : `${Math.abs(a) === 1 ? '' : Math.abs(a)}x${k > 1 ? `^${k}` : ''}`; ts.push(`${a < 0 ? '-' : '+'}${body}`); }
  return ts.length ? joinTerms(ts) : '0';
};

/* ============================================ one judge per skill
   judge(q) → { right(s) → bool, eq?: [...], wrong?: [...] }
   eq    — forms the checker must accept (built from the right answer),
   wrong — forms it must reject.                                         */
/** "8 1/2" for 17/2, "-1 2/5" for −7/5; null for integers and proper fractions. */
function mixedText(v) {
  const f = /^(-?)(\d+)\/(\d+)$/.exec(fracText(v));
  if (!f || +f[2] < +f[3]) return null;
  return `${f[1]}${Math.floor(f[2] / f[3])} ${f[2] % f[3]}/${f[3]}`;
}
/** A decimal correctly rounded to 2 places, for a value that does not terminate. */
const rounded2 = (v) => (terminating(v) ? null : v.toFixed(2));
const numForms = (v, prefix = '') => {
  const out = [String(v), `${prefix}${fracText(v)}`, ` ${fracText(v)} `];
  if (!Number.isInteger(v) && terminating(v)) out.push(String(+v.toFixed(6)));
  if (mixedText(v)) out.push(`${prefix}${mixedText(v)}`);
  if (rounded2(v)) out.push(`${prefix}${rounded2(v)}`);
  return out;
};
const numWrong = (v, prefix = '') => [`${prefix}${fracText(v + 1)}`, `${prefix}${fracText(v - 1)}`, ...(v ? [`${prefix}${fracText(-v)}`] : [])];
function numJudge(v, { prefix = '', xform = true } = {}) {
  return {
    value: v,
    right: (s) => close(num(s), v),
    eq: [...numForms(v), ...(xform ? numForms(v, 'x = ').slice(1).concat([`x=${fracText(v)}`]) : []), ...(prefix ? [`${prefix}${fracText(v)}`] : [])],
    wrong: numWrong(v, prefix),
  };
}
function eqJudge(text) {
  const body = text.replace(/^Solve (for x|the proportion):\s*/, '');
  const [L, Rr] = sides(body);
  const f = (x) => ev(L, { x }) - ev(Rr, { x });
  // Linear in x — or, with x in a denominator (a/x = b/c), linear once
  // multiplied through by x. Solve that line where it crosses zero.
  const lin = [1, 2, 3].map(f);
  const g = close(lin[2] - lin[1], lin[1] - lin[0]) ? f : (x) => f(x) * x;
  const g1 = g(1), g2 = g(2);
  const v = g2 === g1 ? NaN : 1 - g1 / (g2 - g1);
  const exact = Math.round(v * 1e6) / 1e6;
  const j = numJudge(Number.isInteger(Math.round(exact)) && close(Math.round(exact), v) ? Math.round(exact) : v);
  j.right = (s) => { const x = num(s); return Number.isFinite(x) && Math.abs(f(x)) < 1e-7 && Math.abs(f(x + 1)) > 1e-9; };
  if (Number.isInteger(j.value)) j.eq.push(`${j.value} = x`, `x = (${j.value})`);
  j.solution = v;
  j.ctx = { mode: 'solve', free: ['x'], sols: [{ x: v }], isSol: (a) => close(a.x, v) };
  return j;
}
const J = {
  'order-ops': (q) => numJudge(ev(q.text.replace('Evaluate: ', '')), { xform: false }),
  evaluate: (q) => {
    const m = /^Evaluate (.+) when (.+)\.$/.exec(q.text);
    const vars = {}; for (const a of m[2].split(' and ')) { const [k, v] = a.split(' = '); vars[k.trim()] = ev(v); }
    return numJudge(ev(m[1], vars), { xform: false });
  },
  'like-terms': (q) => { const e = q.text.replace('Simplify: ', ''); return { right: (s) => samePoly((p) => ev(e, p), (p) => ev(s, p), ['x', 'y']) }; },
  distribute: (q) => { const e = q.text.replace('Simplify: ', ''); return { right: (s) => samePoly((p) => ev(e, p), (p) => ev(s, p)) }; },
  'one-step': (q) => eqJudge(q.text),
  'two-step': (q) => eqJudge(q.text),
  'multi-step': (q) => eqJudge(q.text),
  'dist-eq': (q) => eqJudge(q.text),
  proportion: (q) => eqJudge(q.text),
  'both-sides': (q) => {
    if (/^Solve for x: /.test(q.text)) return eqJudge(q.text);
    const [L, Rr] = sides(/^Solve (.+)\. What do you find\?$/.exec(q.text)[1]);
    const f = (x) => ev(L, { x }) - ev(Rr, { x });
    const slope = f(1) - f(0);
    const kind = Math.abs(slope) < 1e-9 ? (Math.abs(f(0)) < 1e-9 ? 'inf' : 'none') : 'one';
    const x0 = kind === 'one' ? -f(0) / slope : null;
    const ctx = kind === 'inf' ? { mode: 'identity', free: ['x'] } : kind === 'none' ? { mode: 'solve', free: ['x'], sols: [], isSol: () => false }
      : { mode: 'solve', free: ['x'], sols: [{ x: x0 }], isSol: (a) => close(a.x, x0) };
    return { ctx, right: (s) => (kind === 'inf' ? s === 'Infinitely many solutions' : kind === 'none' ? s === 'No solution' : /^x = /.test(s) && Math.abs(f(num(s))) < 1e-7) };
  },
  percent: (q) => {
    let m;
    if ((m = /^What is (\d+)% of (\d+)\?$/.exec(q.text))) return numJudge((m[1] * m[2]) / 100, { xform: false });
    if ((m = /^(\d+) is what percent of (\d+)\?$/.exec(q.text))) { const v = (m[1] / m[2]) * 100; const j = numJudge(v, { xform: false }); j.eq.push(`${v}%`, `${v} %`, `${v} percent`); return j; }
    m = /^(\d+)% of what number is (\d+)\?$/.exec(q.text);
    return numJudge((m[2] * 100) / m[1], { xform: false });
  },
  inequality: (q) => {
    const m = /^Solve: (.+) ([<>≤≥]) (.+)$/.exec(q.text);
    const f = (x) => ev(m[1], { x }), g = (x) => ev(m[3], { x });
    const op = opOf(m[2]);
    const truth = (x) => OPS[op](f(x), g(x));
    const right = (s) => {
      const a = ineq(s);
      if (!a || !Number.isFinite(a.v) || !close(f(a.v), g(a.v))) return false;
      return [a.v - 0.5, a.v, a.v + 0.5, a.v - 3, a.v + 3].every((x) => truth(x) === OPS[a.op](x, a.v));
    };
    // Solve independently: the boundary where the sides meet, and which side holds.
    const h = (x) => f(x) - g(x); const b = -h(0) / (h(1) - h(0));
    const bt = fracText(Math.round(b * 1e6) / 1e6);
    const cand = ['<', '>', 'L', 'G'].find((o) => right(`x ${o === 'L' ? '<=' : o === 'G' ? '>=' : o} ${bt}`));
    const sym = { '<': '<', '>': '>', L: '<=', G: '>=' }[cand];
    const rev = { '<': '>', '>': '<', L: '>=', G: '<=' }[cand];
    const uni = { '<': '<', '>': '>', L: '≤', G: '≥' }[cand];
    return {
      right, ctx: { mode: 'ineq', free: ['x'], inSet: truth, boundary: b },
      eq: [`x${sym}${bt}`, `x ${sym} ${bt}`, `x ${uni} ${bt}`, `${bt} ${rev} x`, `x ${uni} ${bt.replace('-', '−')}`],
      wrong: [`x ${rev.replace('=', '')}${sym.includes('=') ? '=' : ''} ${bt}`, `x ${sym.includes('=') ? sym.replace('=', '') : sym + '='} ${bt}`, `x ${sym} ${fracText(b + 1)}`],
    };
  },
  'number-line': (q) => {
    const svg = q.figure;
    const c = /<circle class="alg-dot (open|closed)" cx="([\d.]+)"/.exec(svg);
    const cx = c[2];
    const label = new RegExp(`<text[^>]*x="${cx}"[^>]*>([^<]+)</text>`).exec(svg)[1];
    const ray = /<line class="alg-ray" x1="([\d.]+)" y1="[\d.]+" x2="([\d.]+)"/.exec(svg);
    const v = num(label), incl = c[1] === 'closed', rightward = +ray[2] > +ray[1];
    const op = rightward ? (incl ? 'G' : '>') : (incl ? 'L' : '<');
    return { right: (s) => { const a = ineq(s); return !!a && a.op === op && close(a.v, v); } };
  },
  'f-of-x': (q) => { const m = /^If f\(x\) = (.+), find f\((.+)\)\.$/.exec(q.text); return numJudge(ev(m[1], { x: ev(m[2]) }), { xform: false }); },
  'arith-seq': (q) => {
    let m = /the (\d+)(?:st|nd|rd|th) term of the arithmetic sequence (.+), …\?$/.exec(q.text);
    if (m) {
      const t = m[2].split(', ').map(num); const d = t[1] - t[0];
      if (!t.every((x, i) => !i || close(x - t[i - 1], d))) throw new Error('not arithmetic');
      return numJudge(t[0] + (m[1] - 1) * d, { xform: false });
    }
    m = /a₁ = (\S+) and common difference d = (\S+)\. What is a([₀-₉]+)\?$/.exec(q.text);
    const n = Number([...m[3]].map((c) => SUBD[c]).join(''));
    return numJudge(num(m[1]) + (n - 1) * num(m[2].replace(/\.$/, '')), { xform: false });
  },
  'is-function': (q) => {
    const not = /NOT/.test(q.text);
    const isFn = (s) => { const ps = [...s.matchAll(/\(([^,]+), ([^)]+)\)/g)].map((m) => [num(m[1]), num(m[2])]); return ps.every(([x, y]) => ps.every(([x2, y2]) => x2 !== x || y2 === y)); };
    return { right: (s) => isFn(s) !== not };
  },
  slope: (q) => {
    const ps = [...q.text.matchAll(/\((\S+), (\S+)\)/g)].map((m) => [num(m[1]), num(m[2])]);
    const dx = ps[1][0] - ps[0][0], dy = ps[1][1] - ps[0][1];
    if (dx === 0) return { right: (s) => isUndef(s), eq: ['undefined', 'Undefined', 'no slope', ' undefined '], wrong: ['0', String(dy), `${dy}/0`] };
    const v = dy / dx;
    return { right: (s) => !isUndef(s) && close(num(s), v), eq: numForms(v).concat([`m = ${fracText(v)}`], v === 0 ? ['zero'] : []), wrong: [...numWrong(v), ...(dy ? [fracText(dx / dy)] : []), 'undefined'] };
  },
  'slope-int': (q) => {
    const P = [...q.text.matchAll(/\((\S+), (\S+)\)/g)].map((m) => [num(m[1]), num(m[2])]);
    let m, b, x;
    if ((x = /slope (\S+) and y-intercept (\S+) in/.exec(q.text))) { m = num(x[1]); b = num(x[2]); }
    else if ((x = /slope (\S+) that passes/.exec(q.text))) { m = num(x[1]); b = P[0][1] - m * P[0][0]; }
    else { m = (P[1][1] - P[0][1]) / (P[1][0] - P[0][0]); b = P[0][1] - m * P[0][0]; }
    const right = (s) => {
      const t = String(s).replace(/\s+/g, '');
      const mm = /^y=(.+)$/.exec(t);
      if (!mm) return false;
      // Slope-intercept form: one x-term, no x inside parentheses.
      if (/\([^()]*x[^()]*\)/.test(mm[1]) || (mm[1].match(/x/g) || []).length > 1) return false;
      try { return close(ev(mm[1], { x: 0 }), b) && close(ev(mm[1], { x: 1 }) - ev(mm[1], { x: 0 }), m); } catch { return false; }
    };
    const mt = fracText(m), bt = fracText(Math.abs(b));
    const mx = m === 1 ? 'x' : m === -1 ? '-x' : Number.isInteger(m) ? `${m}x` : `(${mt})x`;
    const eq = [`y=${mx}${b < 0 ? '-' : '+'}${bt}`, `y = ${fracText(b)} + ${mx}`, `y = ${mx} + ${fracText(b)}`, `y = ${m === 1 ? '1x' : mx} ${b < 0 ? '-' : '+'} ${bt}`];
    if (!Number.isInteger(m)) eq.push(`y = ${mt}x ${b < 0 ? '-' : '+'} ${bt}`);
    if (!Number.isInteger(m) && terminating(m)) eq.push(`y = ${m}x ${b < 0 ? '-' : '+'} ${bt}`);
    const wrong = [`y = ${mx} + ${fracText(-b || 1)}`, `y = ${fracText(m + 1)}x + ${fracText(b)}`, `y = (${fracText(m)})(x - 1) + ${fracText(b + m)}`];
    const ctx = { mode: 'solve', free: ['x', 'y'], vars: { m, b }, sols: [0, 1, -3].map((t) => ({ x: t, y: m * t + b })), isSol: (a) => close(a.y, m * a.x + b), allSols: true };
    return { right, eq, wrong, mustNote: [wrong[2]], ctx };
  },
  intercepts: (q) => {
    const m = /^Find the (x|y)-intercept of (.+)\.$/.exec(q.text);
    const [L, Rr] = sides(m[2]);
    const holds = (x, y) => close(ev(L, { x, y }), ev(Rr, { x, y }));
    // Independent: solve the one-variable equation with the other variable 0.
    const g = m[1] === 'x' ? (t) => ev(L, { x: t, y: 0 }) - ev(Rr, { x: t, y: 0 }) : (t) => ev(L, { x: 0, y: t }) - ev(Rr, { x: 0, y: t });
    const t = -g(0) / (g(1) - g(0));
    const pt = m[1] === 'x' ? [t, 0] : [0, t];
    const right = (s) => {
      const p = pair(s);
      if (p) return holds(p[0], p[1]) && (m[1] === 'x' ? p[1] === 0 : p[0] === 0);
      return close(num(s), t) && !/^\s*[a-z]\s*=/.test(s.replace(new RegExp(`^\\s*${m[1]}\\s*=`), ''));
    };
    return {
      right, ctx: { mode: 'solve', free: ['x', 'y'], sols: [{ x: pt[0], y: pt[1] }], isSol: (a) => close(a.x, pt[0]) && close(a.y, pt[1]) },
      eq: [`(${pt[0]},${pt[1]})`, ` ( ${pt[0]} , ${pt[1]} ) `, String(t), `${m[1]} = ${t}`, `${m[1]}-intercept = ${t}`],
      wrong: [...(t ? [`(${pt[1]}, ${pt[0]})`] : []), `(${m[1] === 'x' ? t + 1 : 0}, ${m[1] === 'x' ? 0 : t + 1})`, String(-t || 1)],
    };
  },
  system: (q) => {
    const [e1, e2] = /^Solve the system: (.+)$/.exec(q.text)[1].split(' and ');
    const F = [e1, e2].map((e) => { const [L, Rr] = sides(e); return (x, y) => ev(L, { x, y }) - ev(Rr, { x, y }); });
    const co = F.map((f) => [f(1, 0) - f(0, 0), f(0, 1) - f(0, 0), -f(0, 0)]);
    const det = co[0][0] * co[1][1] - co[0][1] * co[1][0];
    if (!det) throw new Error('system is not independent');
    const x = (co[0][2] * co[1][1] - co[0][1] * co[1][2]) / det, y = (co[0][0] * co[1][2] - co[0][2] * co[1][0]) / det;
    return {
      ctx: { mode: 'solve', free: ['x', 'y'], sols: [{ x, y }], isSol: (a) => close(a.x, x) && close(a.y, y) },
      right: (s) => { const p = pair(s); return !!p && close(p[0], x) && close(p[1], y); },
      eq: [`(${x},${y})`, `( ${x} , ${y} )`, `x = ${x}, y = ${y}`, `y = ${y}, x = ${x}`, `x = ${x} and y = ${y}`, `x=${x} y=${y}`, `x = ${x}; y = ${y}`, `(${fracText(x).replace('-', '−')}, ${fracText(y).replace('-', '−')})`],
      wrong: [...(x !== y ? [`(${y}, ${x})`] : []), `(${x}, ${y + 1})`, ...(x ? [`(${-x}, ${y})`] : [])],
    };
  },
  'system-type': (q) => {
    const [e1, e2] = /this system have\? (.+)$/.exec(q.text)[1].split(' and ');
    const F = [e1, e2].map((e) => { const [L, Rr] = sides(e); return (x, y) => ev(L, { x, y }) - ev(Rr, { x, y }); });
    const co = F.map((f) => [f(1, 0) - f(0, 0), f(0, 1) - f(0, 0), -f(0, 0)]);
    const det = co[0][0] * co[1][1] - co[0][1] * co[1][0];
    const same = close(co[0][0] * co[1][2], co[1][0] * co[0][2]) && close(co[0][1] * co[1][2], co[1][1] * co[0][2]);
    const want = det ? 'Exactly one solution' : same ? 'Infinitely many solutions' : 'No solution';
    return { right: (s) => s === want };
  },
  'exp-rules': (q) => { const e = q.text.replace('Simplify: ', ''); return { right: (s) => samePoly((p) => ev(e, p), (p) => ev(s, p), ['x', 'y']) }; },
  'neg-exp': (q) => numJudge(ev(q.text.replace('Evaluate: ', '')), { xform: false }),
  growth: (q) => {
    const t = q.text;
    const n = (re) => num(re.exec(t)[1]);
    let exact, unit = 1;
    if (/doubles every hour/.test(t)) exact = n(/colony of ([\d,]+)/) * 2 ** n(/after (\d+) hours/);
    else if (/cut in half/.test(t)) exact = n(/A ([\d,]+) mg/) * 0.5 ** (n(/after (\d+) hours/) / n(/every (\d+) hours/));
    else {
      const a = n(/\$?([\d,]+) (?:people|and|in)/), r = n(/(\d+)%/) / 100, yrs = n(/after (\d+) years/);
      exact = a * (1 + (/loses/.test(t) ? -r : r)) ** yrs;
      if (/nearest cent/.test(t)) unit = 0.01;
    }
    const base = /(\d+)%/.test(t) ? 1 + (/loses/.test(t) ? -1 : 1) * n(/(\d+)%/) / 100 : null;
    const ctx = { mode: 'numeric', vars: { y: exact, ...(base ? { b: base } : {}) } };
    const right = (s) => { const v = num(s); return Number.isFinite(v) && Math.abs(v / unit - Math.round(v / unit)) < 1e-6 && Math.abs(v - exact) <= unit / 2 + 1e-9; };
    const r0 = Math.round(exact / unit) * unit;
    const plain = unit === 1 ? String(r0) : r0.toFixed(2);
    return { ctx, right, eq: [plain, `$${plain}`, `${plain} ${/mg/.test(t) ? 'mg' : /people/.test(t) ? 'people' : 'dollars'}`, plain.replace(/\B(?=(\d{3})+(?!\d))/g, ',')], wrong: [String(+(r0 + unit).toFixed(2)), String(+(r0 - unit).toFixed(2)), String(Math.round(exact * 10))] };
  },
  'poly-add': (q) => polyJudge(q, 'Simplify: '),
  foil: (q) => polyJudge(q, 'Multiply: '),
  'square-binomial': (q) => polyJudge(q, 'Expand: '),
  'factor-trinomial': (q) => factorJudge(q),
  'factor-a': (q) => factorJudge(q),
  'factor-dos': (q) => factorJudge(q),
  'factor-gcf': (q) => factorJudge(q),
  'quad-solve': (q) => {
    const [L, Rr] = sides(q.text.replace('Solve by factoring: ', ''));
    const [c, b, a] = fit((x) => ev(L, { x }) - ev(Rr, { x }));
    const D = b * b - 4 * a * c;
    const rs = D < 0 ? [] : [...new Set([(-b - Math.sqrt(D)) / (2 * a), (-b + Math.sqrt(D)) / (2 * a)].map((v) => Math.round(v * 1e9) / 1e9))].sort((p, r) => p - r);
    const right = (s) => { const got = [...new Set(roots(s).map((v) => Math.round(v * 1e9) / 1e9))]; return got.length === rs.length && rs.every((r) => got.some((g) => close(g, r))); };
    const ft = rs.map(fracText);
    const eq = [ft.join(', '), ft.slice().reverse().map((r) => `x = ${r}`).join(', '), ft.map((r) => `x=${r}`).join(' or '), ft.join(' and ')];
    if (rs.some((r) => !Number.isInteger(r) && terminating(r))) eq.push(rs.map(String).join(', '));
    if (rs.some((r) => !terminating(r))) eq.push(rs.map((r) => (terminating(r) ? fracText(r) : r.toFixed(2))).join(', '));
    if (rs.length === 2) eq.push(ft.join(' '));
    const wrong = [ft.map((r, i) => (i ? r : fracText(rs[0] + 1))).join(', ')];
    if (!rs.every((r) => rs.includes(-r))) wrong.push(rs.map((r) => fracText(-r)).join(', '));
    if (rs.length === 2) wrong.push(`x = ${ft[0]}`);
    const g = (x) => ev(L, { x }) - ev(Rr, { x });
    return { right, eq, wrong, ctx: { mode: 'solve', free: ['x'], sols: rs.map((x) => ({ x })), isSol: (a) => Math.abs(g(a.x)) < 1e-7 } };
  },
  discriminant: (q) => {
    const [c, b, a] = fit((x) => ev(/solutions (.+) = 0 has/.exec(q.text)[1], { x }));
    const D = b * b - 4 * a * c;
    const cnt = D > 0 ? 'two real solutions' : D === 0 ? 'one real solution' : 'no real solutions';
    return { ctx: { mode: 'numeric', vars: { a, b, c } }, right: (s) => { const m = /^b² − 4ac = (\S+), so (.+)$/.exec(s); return !!m && close(num(m[1]), D) && m[2] === cnt; } };
  },
  vertex: (q) => {
    const [, b, a] = fit((x) => ev(/y = (.+)\.$/.exec(q.text)[1], { x }));
    const xv = -b / (2 * a);
    return { ...numJudge(xv), ctx: { mode: 'solve', free: ['x'], vars: { a, b }, sols: [{ x: xv }], isSol: (p) => close(p.x, xv) } };
  },
  'simplify-root': (q) => radJudge(ev(q.text.replace('Simplify: ', ''))),
  'multiply-roots': (q) => radJudge(ev(q.text.replace('Multiply and simplify: ', ''))),
  pythag: (q) => {
    let m = /legs of length (\d+) and (\d+)\./.exec(q.text);
    const withUnits = (j) => { j.eq.push(`${j.value} units`, `${j.value}cm`); return j; };
    if (m) return withUnits(numJudge(Math.hypot(+m[1], +m[2]), { xform: false }));
    m = /one leg of length (\d+) and a hypotenuse of length (\d+)\./.exec(q.text);
    return withUnits(numJudge(Math.sqrt(m[2] ** 2 - m[1] ** 2), { xform: false }));
  },
  'center-spread': (q) => {
    const m = /^Find the (\w+) of this data set: (.+)$/.exec(q.text);
    const d = m[2].split(', ').map(Number);
    const s = d.slice().sort((a, b) => a - b);
    let v;
    if (m[1] === 'mean') v = d.reduce((a, b) => a + b, 0) / d.length;
    else if (m[1] === 'median') v = median(d);
    else if (m[1] === 'range') v = s[s.length - 1] - s[0];
    else { const c = {}; for (const x of d) c[x] = (c[x] || 0) + 1; const top = Math.max(...Object.values(c)); const ms = Object.keys(c).filter((k) => c[k] === top); if (ms.length !== 1) throw new Error('no single mode'); v = +ms[0]; }
    return numJudge(v, { xform: false });
  },
  iqr: (q) => {
    const d = /data set: ([\d, ]+)\. Use/.exec(q.text)[1].split(', ').map(Number).sort((a, b) => a - b);
    if (!/leave the middle value out/.test(q.text)) throw new Error('IQR method not stated');
    const h = Math.floor(d.length / 2);
    return numJudge(median(d.slice(d.length % 2 ? h + 1 : h)) - median(d.slice(0, h)), { xform: false });
  },
};
function polyJudge(q, lead) {
  const e = q.text.replace(lead, '');
  const f = (p) => ev(e, p);
  const right = (s) => { try { return expandedForm(s) && samePoly(f, (p) => ev(s, p)); } catch { return false; } };
  const c = fit((x) => ev(e, { x }));
  const ts = polyTerms(q.answer);
  const eq = [joinTerms(ts), joinTerms(ts.slice().reverse()), joinTerms(ts).replace(/\s+/g, ''), joinTerms(ts).replace(/ - /g, ' + -'), joinTerms(ts).replace(/(\d)x/g, '$1*x'), q.answer.replace(/ /g, '  ')];
  const bump = c.slice(); bump[0] += 1;
  const flip = c.slice(); const k = flip.findIndex((v, i) => i > 0 && v); if (k > 0) flip[k] = -flip[k];
  return { right, eq, wrong: [polyText(bump), polyText(flip), asc(e)], mustNote: [asc(e)] };
}
function factorJudge(q) {
  const P = q.text.replace(/^Factor (completely|out the greatest common factor): /, '');
  const f = (p) => ev(P, p);
  const right = (s) => { try { return samePoly(f, (p) => ev(s, p)) && fullyFactored(s); } catch { return false; } };
  const { lead, groups } = factorParts(q.answer);
  const A = groups.map(asc), l = asc(lead);
  const swapIn = (g) => { const m = /^(.+?) ([+-]) (.+)$/.exec(g); return m && !/x/.test(m[3]) && !/[+-]/.test(m[1].slice(1)) ? `${m[2] === '-' ? '-' : ''}${m[3]} + ${m[1]}` : g; };
  const eq = [
    `${l}${A.map((g) => `(${g})`).join('')}`.replace(/\s+/g, ''),
    `${l}${A.slice().reverse().map((g) => `(${g})`).join('')}`,
    `${l}${A.map((g) => `(${swapIn(g)})`).join('')}`,
    `${l} ${A.map((g) => `( ${g} )`).join(' ')}`,
  ];
  if (A.length === 2 && A[0] === A[1]) eq.push(`${l}(${A[0]})^2`);
  const c = fit((x) => ev(P, { x }));
  const flipSign = (g) => g.replace(/ ([+-]) /, (m, s) => ` ${s === '+' ? '-' : '+'} `);
  const wrong = [`${l}(${flipSign(A[0])})${A.slice(1).map((g) => `(${g})`).join('')}`, polyText(c)];
  const mustNote = [polyText(c)];
  // A partial factoring: only part of the GCF taken out.
  if (q.skill === 'factor-gcf') {
    const g = c.reduce((a, b) => gcdN(a, b), 0);
    const low = c.findIndex((v) => v);
    if (low > 0) { const rest = c.slice(1); const pt = `${g}x${low > 1 ? `^${low - 1}` : ''}`; wrong.push(`x(${polyText(rest)})`); mustNote.push(`x(${polyText(rest)})`); if (g > 1) { wrong.push(`${g}(${polyText(c.map((v) => v / g))})`); mustNote.push(`${g}(${polyText(c.map((v) => v / g))})`); } void pt; }
    else { const p = [2, 3, 5, 7].find((d) => g % d === 0 && d < g); if (p) { wrong.push(`${p}(${polyText(c.map((v) => v / p))})`); mustNote.push(`${p}(${polyText(c.map((v) => v / p))})`); } }
  }
  return { right, eq, wrong, mustNote };
}
function radJudge(value) {
  const right = (s) => { const r = radical(s); return !!r && sqfree(r.r) && close(r.c * Math.sqrt(r.r), value); };
  let k = 1, m = Math.round(value * value);
  for (let i = 2; i * i <= m; i++) while (m % (i * i) === 0) { m /= i * i; k *= i; }
  const sg = value < 0 ? '-' : '';
  if (!close((sg ? -1 : 1) * k * Math.sqrt(m), value)) throw new Error('radical not recovered');
  const c = sg + (m === 1 ? String(k) : k === 1 ? '' : String(k));
  const eq = m === 1 ? [c, ` ${c} `] : [`${c}sqrt${m}`, `${c} sqrt(${m})`, `${c} root ${m}`, `${c}√(${m})`, `${c} √ ${m}`, ...(sg ? [] : [`${c}*sqrt(${m})`])];
  const wrong = m === 1 ? [String(value + 1), String(value - 1)] : [`${sg}${k + 1}√${m}`, `${sg}${k}√${m + 1}`, `${sg}√${k * k * m}`, ...(sg ? [`${k}√${m}`] : [])];
  const mustNote = m === 1 ? [] : [`${sg}√${k * k * m}`];
  if (m > 1) for (let j = 2; j < k; j++) if (k % j === 0) { wrong.push(`${sg}${k / j}√${j * j * m}`); mustNote.push(`${sg}${k / j}√${j * j * m}`); }
  return { value, right, eq, wrong, mustNote };
}

/* ====================================================== worked steps
   Every worked step is read clause by clause ("A = B", "x ≥ 3", or a bare
   expression) and each clause is checked against the problem, in this file:

     identity  every "A = B" holds for all x (and y) — FOIL, factoring, …;
               a bare expression equals the problem's own expression/value.
     solve     an equation holds at the solution and nowhere else near it
               (or is an identity) — equations, systems, intercepts, lines.
     ineq      an inequality has exactly the final solution set.
     numeric   only arithmetic without free variables is checked.

   Named quantities (m, b, Q1, a₁₂, f(−2), mean…) come from the prompt,
   worked out here. Prose clauses that do not parse are skipped.         */
const SEPS = [' — ', ': ', '; ', ', ', ' and ', ' or ', ' so ', ' then '];
const SEPS_LOGIC = SEPS.filter((sp) => sp !== ' and ' && sp !== ' or ');
function splitClauses(text, seps = SEPS) {
  const out = [];
  let depth = 0, cur = '';
  const t = String(text || '');
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    if (depth === 0) {
      const sep = seps.find((sp) => t.startsWith(sp, i));
      if (sep) { out.push(cur); cur = ''; i += sep.length - 1; continue; }
    }
    cur += c;
  }
  out.push(cur);
  return out.map((c) => c.replace(/[✓]/g, '').replace(/\.$/, '').trim()).filter(Boolean);
}
const REL = ['≠', '≤', '≥', '≈', '=', '<', '>'];
function splitRel(c) {
  const parts = [], ops = [];
  let depth = 0, cur = '';
  for (const ch of c) {
    if (ch === '(') depth++; else if (ch === ')') depth--;
    if (depth === 0 && REL.includes(ch)) { parts.push(cur.trim()); ops.push(ch); cur = ''; continue; }
    cur += ch;
  }
  parts.push(cur.trim());
  return { parts, ops };
}
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function prepClause(s, names) {
  let t = s;
  for (const [k, v] of Object.entries(names || {}).sort((a, b) => b[0].length - a[0].length)) {
    t = t.replace(new RegExp(`(?<![A-Za-z])${esc(k)}(?![A-Za-z0-9₀-₉])`, 'g'), `(${v})`);
  }
  return t.replace(/\$/g, '').replace(/(\d),(?=\d{3}(?!\d))/g, '$1').replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');
}
/** Free variables used by a part, or null if it does not parse at all. */
function varsOf(part, known) {
  let toks;
  try { toks = tokenize(part); } catch { return null; }
  if (!toks.length) return null;
  const vs = new Set();
  for (const k of toks) if (k.t === 'v') { if (!(k.v in known)) return null; vs.add(k.v); }
  return vs;
}
const SAMPLES = [0, 1, 2, 3, 4].map((i) => ({ x: 1.13 + 0.37 * i, y: -0.71 + 0.53 * i, n: 2.3 + 0.41 * i }));
const relHolds = (op, a, b) => {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  // "≈" allows the rounding a step prints: hundredths, or 4 significant figures.
  const tol = op === '≈' ? Math.max(2e-4 * Math.abs(b), 0.0051) : 1e-7 * Math.max(1, Math.abs(b));
  switch (op) {
    case '=': case '≈': return Math.abs(a - b) <= tol;
    case '≠': return Math.abs(a - b) > tol;
    case '<': return a < b - 1e-9; case '>': return a > b + 1e-9;
    case '≤': return a <= b + 1e-9; case '≥': return a >= b - 1e-9;
    default: return false;
  }
};
/** Checks one step field; returns [checked, problems[]]. */
function checkField(text, ctx, allowBare) {
  let checked = 0;
  const bad = [];
  const free = ctx.free || [];
  const known = { ...(ctx.vars || {}) };
  for (const v of free) known[v] = 0;
  const raws = [];
  for (const r of splitClauses(text, ctx.logic ? SEPS_LOGIC : SEPS)) {
    // "x = (4 ± √40)/4" is two statements: one with +, one with −.
    if (r.includes('±')) raws.push(r.replace(/±/g, '+'), r.replace(/±/g, '−')); else raws.push(r);
  }
  for (const raw of raws) {
    if (ctx.logic && /[<>≤≥]/.test(raw) && ctx.mode === 'ineq') {
      // An "and"/"or" compound, each part possibly a chain: "−2 < x ≤ 3 or x > 5".
      const branches = raw.split(' or ').map((b) => b.split(' and ').map((c) => splitRel(prepClause(c, ctx.names))));
      if (branches.some((b) => b.some(({ parts }) => parts.some((pp) => !pp || varsOf(pp, known) === null)))) continue;
      const truthAt = (x) => branches.some((b) => b.every(({ parts, ops }) => ops.every((op, i) => { try { return relHolds(op, ev(parts[i], { ...(ctx.vars || {}), x }), ev(parts[i + 1], { ...(ctx.vars || {}), x })); } catch { return false; } })));
      if (branches.every((b) => b.every(({ ops }) => ops.every((op) => op === '=')))) continue;
      checked++;
      const pts = [-1e3, 1e3];
      for (const e of ctx.boundaries) for (const dd of [-7, -3, -1, -0.5, -0.01, 0, 0.01, 0.5, 1, 3, 7]) pts.push(e + dd);
      const wrongAt = pts.filter((x) => truthAt(x) !== ctx.inSet(x));
      if (wrongAt.length) bad.push(`"${raw}" does not have the solution set of the problem (wrong at x = ${wrongAt.slice(0, 4).map((x) => +x.toFixed(2)).join(', ')})`);
      continue;
    }
    const c = prepClause(raw, ctx.names);
    const { parts, ops } = splitRel(c);
    if (parts.some((p) => !p)) continue;
    const used = parts.map((p) => varsOf(p, known));
    if (used.some((u) => u === null)) continue;
    const U = [...new Set(used.flatMap((u) => [...u]))].filter((v) => free.includes(v));
    // Only the free variables vary; named values (n, y, b…) stay fixed.
    const val = (p, a) => ev(p, { ...(ctx.vars || {}), ...Object.fromEntries(free.filter((v) => v in a).map((v) => [v, a[v]])) });
    if (!ops.length) {
      // A bare expression: it should equal the problem's expression or value.
      if (!allowBare || !ctx.target || (ctx.targetNeedsVar && !U.length)) continue;
      checked++;
      if (!SAMPLES.every((a) => relHolds('=', val(parts[0], a), ctx.target(a)))) bad.push(`"${raw}" is not equal to the problem`);
      continue;
    }
    for (let i = 0; i < ops.length; i++) {
      const [A, B, op] = [parts[i], parts[i + 1], ops[i]];
      const holds = (a) => { try { return relHolds(op, val(A, a), val(B, a)); } catch { return false; } };
      // A variable counts only if the clause depends on it: in
      // "(3x − 2y) + (−x + 2y) = −4" the y-terms cancel.
      const diff = (a) => { try { return val(A, a) - val(B, a); } catch { return NaN; } };
      const u = [...new Set([...used[i], ...used[i + 1]])].filter((v) => free.includes(v))
        .filter((v) => SAMPLES.some((a) => !close(diff(a), diff({ ...a, [v]: a[v] + 1.7 }))));
      const ineq = '<>≤≥'.includes(op);
      if (!u.length) {
        if (ctx.mode === 'solve' && !ctx.sols.length && op === '=') continue;   // "−18 = −15": the contradiction line
        checked++;
        if (!SAMPLES.every((smp) => holds(smp))) bad.push(`"${raw}" is false`);
        continue;
      }
      if (ctx.mode === 'numeric') continue;
      const identity = SAMPLES.every((a) => holds(a));
      if (ctx.mode === 'identity') { checked++; if (!identity) bad.push(`"${raw}" is not an identity`); continue; }
      if (ctx.mode === 'ineq') {
        checked++;
        if (!ineq) { if (!identity) bad.push(`"${raw}" is not an identity`); continue; }
        const pts = (ctx.boundaries || [ctx.boundary]).flatMap((b) => [-7, -3, -1, -0.5, 0, 0.5, 1, 3, 7].map((d) => b + d));
        const wrongAt = pts.filter((x) => holds({ x }) !== ctx.inSet(x));
        if (wrongAt.length) bad.push(`"${raw}" does not have the solution set of the problem (wrong at x = ${wrongAt.map((x) => +x.toFixed(2)).join(', ')})`);
        continue;
      }
      // solve
      if (ineq) continue;
      checked++;
      if (identity) continue;
      if (!ctx.sols.length) { if (SAMPLES.some((a) => holds(a))) bad.push(`"${raw}" has a solution, but the problem has none`); continue; }
      if (ctx.allSols ? !ctx.sols.every((sol) => holds(sol)) : !ctx.sols.some((sol) => holds(sol))) { bad.push(`"${raw}" is false at the solution ${JSON.stringify(ctx.sols.find((sol) => !holds(sol)) || ctx.sols[0])}`); continue; }
      for (const sol of ctx.sols) {
        for (const v of u) {
          for (const d of [1, 0.5, -0.75]) {
            const a = { ...sol, [v]: sol[v] + d };
            if (!ctx.isSol(a) && holds(a)) { bad.push(`"${raw}" also holds at ${v} = ${+(a[v]).toFixed(3)}, which is not a solution`); break; }
          }
        }
      }
    }
  }
  return [checked, bad];
}
function checkSteps(steps, ctx) {
  let checked = 0;
  const bad = [];
  for (const [why, math, res] of steps) {
    for (const [text, bare] of [[why, false], [math, true], [res, true]]) {
      if (!text) continue;
      const [n, b] = checkField(text, ctx, bare);
      checked += n; bad.push(...b);
    }
  }
  return [checked, bad];
}

/* Step contexts for the skills whose judge does not build one. */
const exprCtx = (lead, free) => (q) => { const e = q.text.replace(lead, ''); return { mode: 'identity', free, target: (a) => ev(e, a), targetNeedsVar: true }; };
const valueCtx = (q, j) => ({ mode: 'identity', free: [], target: () => j.value });
const subDigits = (n) => String(n).replace(/\d/g, (c) => '₀₁₂₃₄₅₆₇₈₉'[c]);
const CTX = {
  'order-ops': valueCtx, evaluate: valueCtx, 'neg-exp': valueCtx, 'simplify-root': valueCtx, 'multiply-roots': valueCtx,
  'like-terms': exprCtx('Simplify: ', ['x', 'y']), distribute: exprCtx('Simplify: ', ['x']), 'exp-rules': exprCtx('Simplify: ', ['x', 'y']),
  'poly-add': exprCtx('Simplify: ', ['x']), foil: exprCtx('Multiply: ', ['x']), 'square-binomial': exprCtx('Expand: ', ['x']),
  'factor-trinomial': exprCtx(/^Factor .*?: /, ['x']), 'factor-a': exprCtx(/^Factor .*?: /, ['x']), 'factor-dos': exprCtx(/^Factor .*?: /, ['x']), 'factor-gcf': exprCtx(/^Factor .*?: /, ['x']),
  percent: (q, j) => (/of what number/.test(q.text) ? { mode: 'solve', free: ['n'], sols: [{ n: j.value }], isSol: (a) => close(a.n, j.value) } : { mode: 'numeric' }),
  'f-of-x': (q, j) => ({ mode: 'identity', free: [], names: { [/find (f\(.+\))\.$/.exec(q.text)[1]]: j.value }, target: () => j.value }),
  'arith-seq': (q, j) => {
    let a1, d, n;
    const m = /the (\d+)(?:st|nd|rd|th) term of the arithmetic sequence (.+), …\?$/.exec(q.text);
    if (m) { const t = m[2].split(', ').map(num); a1 = t[0]; d = t[1] - t[0]; n = +m[1]; }
    else { const k = /a₁ = (\S+) and common difference d = (\S+)\. What is a([₀-₉]+)\?$/.exec(q.text); a1 = num(k[1]); d = num(k[2]); n = Number([...k[3]].map((c) => SUBD[c]).join('')); }
    return { mode: 'numeric', vars: { d, n }, names: { 'a₁': a1, [`a${subDigits(n)}`]: j.value }, target: () => j.value };
  },
  slope: (q) => {
    const ps = [...q.text.matchAll(/\((\S+), (\S+)\)/g)].map((m) => [num(m[1]), num(m[2])]);
    const dx = ps[1][0] - ps[0][0];
    return dx ? { mode: 'numeric', vars: { m: (ps[1][1] - ps[0][1]) / dx } } : { mode: 'numeric' };
  },
  pythag: (q) => {
    let m = /legs of length (\d+) and (\d+)\./.exec(q.text);
    if (m) return { mode: 'numeric', vars: { a: +m[1], b: +m[2], c: Math.hypot(+m[1], +m[2]) } };
    m = /one leg of length (\d+) and a hypotenuse of length (\d+)\./.exec(q.text);
    return { mode: 'numeric', vars: { a: +m[1], b: Math.sqrt(m[2] ** 2 - m[1] ** 2), c: +m[2] } };
  },
  'center-spread': (q, j) => ({ mode: 'numeric', names: { [/^Find the (\w+) of/.exec(q.text)[1]]: j.value } }),
  iqr: (q, j) => {
    const d = /data set: ([\d, ]+)\. Use/.exec(q.text)[1].split(', ').map(Number).sort((a, b) => a - b);
    const h = Math.floor(d.length / 2);
    const q1 = median(d.slice(0, h)), q3 = median(d.slice(d.length % 2 ? h + 1 : h));
    return { mode: 'numeric', names: { Q1: q1, Q3: q3, IQR: j.value, median: median(d) } };
  },
};

/* ---------- judges for the skills added for full-course coverage ---------- */
/** Truth of a printed compound: "−2 < x ≤ 3", "x < 1 or x ≥ 4", "|x − 3| < 5", ASCII <= >= too. */
function logicTruth(s) {
  const t = String(s).replace(/<=|=</g, '≤').replace(/>=|=>/g, '≥');
  const branches = t.split(/\s+or\s+/).map((b) => b.split(/\s+and\s+|,\s*/).map((c) => splitRel(c.trim())));
  for (const b of branches) for (const { parts, ops } of b) if (!ops.length || parts.some((pp) => !pp)) throw new Error(`not an inequality: ${s}`);
  return (x) => branches.some((b) => b.every(({ parts, ops }) => ops.every((op, i) => relHolds(op, ev(parts[i], { x }), ev(parts[i + 1], { x })))));
}
/** Where a truth function changes, found by scanning and bisecting, rounded to 1e-6. */
function boundariesOf(truth, lo = -60, hi = 60) {
  const out = [];
  for (let x = lo; x < hi; x += 0.25) {
    if (truth(x) === truth(x + 0.25)) continue;
    let a = x, b = x + 0.25;
    for (let i = 0; i < 60; i++) { const m = (a + b) / 2; if (truth(m) === truth(a)) a = m; else b = m; }
    out.push(Math.round(((a + b) / 2) * 1e6) / 1e6);
  }
  // A single excluded/included point (x ≠ 3) would be missed by the scan; integers cover our endpoints.
  for (let x = lo; x <= hi; x++) if (truth(x) !== truth(x - 1e-3) && !out.some((e) => close(e, x))) out.push(x);
  return [...new Set(out)].sort((a, b) => a - b);
}
const sameTruth = (f, g, ends) => {
  const pts = [-1e4, 1e4];
  for (const e of ends) for (const d of [-3, -0.5, -0.01, 0, 0.01, 0.5, 3]) pts.push(e + d);
  try { return pts.every((x) => f(x) === g(x)); } catch { return false; }
};
const toAscii = (s) => String(s).replace(/≤/g, '<=').replace(/≥/g, '>=').replace(/−/g, '-');
/** Values of an answer like "x = (2 ± √10)/2" or "x = −7, x = 1". */
function pmRoots(s) {
  const out = [];
  for (let part of String(s).split(/,|\bor\b/)) {
    part = part.trim().replace(/^x\s*=\s*/, '');
    if (!part) continue;
    if (part.includes('±')) out.push(ev(part.replace('±', '+')), ev(part.replace('±', '-')));
    else out.push(ev(part));
  }
  return out;
}
const sameRoots = (got, want) => {
  const g = [...new Set(got.map((v) => Math.round(v * 1e7) / 1e7))];
  return g.length === want.length && want.every((w) => g.some((x) => close(x, w)));
};
function rootsJudge(rs, f, { exact = null } = {}) {
  const ft = rs.map((r) => (terminating(r) ? fracText(r) : r.toFixed(2)));
  const right = (s) => { try { if (!rs.length) return /^\s*no (real )?solutions?\s*$/i.test(s); return sameRoots(pmRoots(s), rs); } catch { return false; } };
  const eq = rs.length ? [ft.join(', '), ft.slice().reverse().map((r) => `x = ${r}`).join(', '), ft.map((r) => `x=${r}`).join(' or '), ft.join(' ')] : ['no solution', 'No Solution', 'none', 'no real solutions'];
  if (exact) eq.push(...exact);
  const wrong = [];
  const mustNote = [];
  if (rs.length === 2) wrong.push(`x = ${ft[1]}`);
  if (rs.length && !rs.every((r) => rs.some((q) => close(q, -r)))) wrong.push(rs.map((r) => (terminating(r) ? fracText(-r) : (-r).toFixed(2))).join(', '));
  if (rs.length) wrong.push('no solution');
  if (rs.some((r) => !terminating(r))) { const one = rs.map((r) => (terminating(r) ? fracText(r) : r.toFixed(1))).join(', '); wrong.push(one); mustNote.push(one); }
  if (!rs.length) wrong.push('x = 0', 'x = 1');
  return { right, eq, wrong, mustNote, ctx: { mode: 'solve', free: ['x'], sols: rs.map((x) => ({ x })), isSol: (a) => Math.abs(f(a.x)) < 1e-7 } };
}
function lineJudge(m, b) {
  const right = (s) => {
    const t = String(s).replace(/\s+/g, '');
    const mm = /^y=(.+)$/.exec(t);
    if (!mm || /\([^()]*x[^()]*\)/.test(mm[1]) || (mm[1].match(/x/g) || []).length > 1) return false;
    try { return close(ev(mm[1], { x: 0 }), b) && close(ev(mm[1], { x: 1 }) - ev(mm[1], { x: 0 }), m); } catch { return false; }
  };
  const mt = fracText(m), bt = fracText(Math.abs(b));
  const mx = m === 1 ? 'x' : m === -1 ? '-x' : Number.isInteger(m) ? `${m}x` : `(${mt})x`;
  return { right, eq: [`y=${mx}${b < 0 ? '-' : '+'}${bt}`, `y = ${fracText(b)} + ${mx}`], wrong: [`y = ${mx} + ${fracText(-b || 1)}`, `y = ${fracText(m + 1)}x + ${fracText(b)}`] };
}
Object.assign(J, {
  literal: (q) => {
    const m = /^Solve (.+) for ([A-Za-z])\.$/.exec(q.text);
    const [L, R] = sides(m[1]);
    const v = m[2].toLowerCase();
    const letters = [...new Set(m[1].toLowerCase().match(/[a-z]/g))];
    const g = (a) => ev(L, a) - ev(R, a);
    const samples = [0, 1, 2, 3, 4].map((i) => Object.fromEntries(letters.map((c, j) => [c, 1.3 + 0.7 * i + 0.37 * j])));
    const solveV = (a) => { const g0 = g({ ...a, [v]: 0 }), g1 = g({ ...a, [v]: 1 }); return -g0 / (g1 - g0); };
    const sols = samples.map((a) => ({ ...a, [v]: solveV(a) }));
    const right = (s) => {
      const mm = new RegExp(`^${m[2]} = (.+)$`).exec(s);
      if (!mm) return false;
      try {
        if (tokenize(mm[1]).some((k) => k.t === 'v' && k.v === v)) return false;
        return samples.every((a) => close(g({ ...a, [v]: ev(mm[1], a) }), 0));
      } catch { return false; }
    };
    return { right, ctx: { mode: 'solve', free: letters, sols, isSol: (a) => Math.abs(g(a)) < 1e-7, allSols: true } };
  },
  'abs-eq': (q) => {
    const [L, R] = sides(q.text.replace('Solve: ', ''));
    const f = (x) => ev(L, { x }) - ev(R, { x });
    // One kink: the two outer lines of the V give every root.
    const cand = [];
    for (const [p1, p2] of [[-1000, -999], [999, 1000]]) { const sl = f(p2) - f(p1); if (sl) cand.push(p1 - f(p1) / sl); }
    const rs = [...new Set(cand.filter((x) => Math.abs(f(x)) < 1e-6).map((x) => Math.round(x * 1e6) / 1e6))].sort((a, b) => a - b);
    return rootsJudge(rs, f);
  },
  compound: (q) => {
    const truth = logicTruth(q.text.replace('Solve: ', ''));
    const ends = boundariesOf(truth);
    const right = (s) => { try { const g = logicTruth(s); return sameTruth(g, truth, [...ends, ...boundariesOf(g)]); } catch { return false; } };
    const a = q.answer;
    const eq = [toAscii(a), a.replace(/\s+/g, ''), toAscii(a).replace(/ (or|and) /, ' $1 ').replace(/\s+(?=[<>=])|(?<=[<>=])\s+/g, '')];
    let m = /^(\S+) ([<≤]) x ([<≤]) (\S+)$/.exec(a);
    if (m) eq.push(`x ${m[2] === '<' ? '>' : '>='} ${toAscii(m[1])} and x ${m[3] === '<' ? '<' : '<='} ${toAscii(m[4])}`, `${m[4]} ${m[3] === '<' ? '>' : '≥'} x ${m[2] === '<' ? '>' : '≥'} ${m[1]}`);
    m = /^x (\S+) (\S+) or x (\S+) (\S+)$/.exec(a);
    if (m) eq.push(`x ${m[3]} ${m[4]} or x ${m[1]} ${m[2]}`);
    const wrong = [a.replace(/≤/, '<').replace(/</, '≤') === a ? a.replace('<', '≤') : a.replace(/≤/, '<'), a.replace(/[<>≤≥]/g, (c) => ({ '<': '>', '>': '<', '≤': '≥', '≥': '≤' }[c])), `x ≤ ${ends[ends.length - 1]}`, `${ends[0] - 1} < x < ${ends[ends.length - 1] + 1}`];
    return { right, eq, wrong, ctx: { mode: 'ineq', logic: true, free: ['x'], inSet: truth, boundaries: ends } };
  },
  'abs-ineq': (q) => {
    const truth = logicTruth(q.text.replace('Solve: ', ''));
    const ends = boundariesOf(truth);
    return { right: (s) => { try { const g = logicTruth(s); return sameTruth(g, truth, [...ends, ...boundariesOf(g)]); } catch { return false; } }, ctx: { mode: 'ineq', logic: true, free: ['x'], inSet: truth, boundaries: ends } };
  },
  'domain-range': (q) => {
    let m = /^What is the (domain|range) of the relation \{(.+)\}\?$/.exec(q.text);
    if (m) {
      const ps = [...m[2].matchAll(/\(([^,]+), ([^)]+)\)/g)].map((k) => [num(k[1]), num(k[2])]);
      const want = [...new Set(ps.map((pp) => (m[1] === 'domain' ? pp[0] : pp[1])))].sort((a, b) => a - b);
      return { right: (s) => { const k = /^\{(.+)\}$/.exec(s); if (!k) return false; const got = [...new Set(k[1].split(', ').map(num))].sort((a, b) => a - b); return got.length === want.length && got.every((x, i) => close(x, want[i])); }, ctx: { mode: 'numeric' } };
    }
    m = /^What is the (domain|range) of f\(x\) = (.+)\?$/.exec(q.text);
    const f = (x) => ev(m[2], { x });
    const opt = (s) => (s === 'All real numbers' ? () => true : logicTruth(s.replace(/^y/, 'x')));
    if (m[1] === 'domain') {
      const defined = (x) => Number.isFinite(f(x));
      const ends = boundariesOf(defined);
      return { right: (s) => { if (/^y/.test(s)) return false; try { return sameTruth(opt(s), defined, [...ends, ...(s === 'All real numbers' ? [] : boundariesOf(opt(s)))]); } catch { return false; } }, ctx: { mode: 'ineq', logic: true, free: ['x'], inSet: defined, boundaries: ends.length ? ends : [0] } };
    }
    const ys = [];
    for (let x = -60; x <= 60; x += 0.25) { const y = f(x); if (Number.isFinite(y)) ys.push(y); }
    for (const x of [-1e8, 1e8]) { const y = f(x); if (Number.isFinite(y)) ys.push(y); }
    const lo = Math.min(...ys), hi = Math.max(...ys);
    const inRange = (y) => (lo < -500 || y >= lo - 1e-9) && (hi > 500 || y <= hi + 1e-9);
    const ends = [lo, hi].filter((v) => Math.abs(v) < 500);
    return { right: (s) => { if (/^x/.test(s)) return false; try { return sameTruth(opt(s), inRange, [...ends, ...(s === 'All real numbers' ? [] : boundariesOf(opt(s)))]); } catch { return false; } }, ctx: { mode: 'numeric' } };
  },
  'point-slope': (q) => {
    const P = [...q.text.matchAll(/\((\S+), (\S+)\)/g)].map((k) => [num(k[1]), num(k[2])]);
    const sm = /slope (\S+) through/.exec(q.text);
    const m = sm ? num(sm[1]) : (P[1][1] - P[0][1]) / (P[1][0] - P[0][0]);
    const b = P[0][1] - m * P[0][0];
    const onLine = [-2, 0, 3].map((x) => ({ x, y: m * x + b }));
    const right = (s) => {
      const t = toAscii(s);
      const [L, R] = sides(t);
      if (!/^y\s*([+-]\s*[\d./]+)?$/.test(L) || !/^-?(\d+|\(\d+\/\d+\))?\s*\(x\s*[+-]\s*[\d./]+\)$/.test(R)) return false;
      try { const G = (a) => ev(L, a) - ev(R, a); return onLine.every((a) => close(G(a), 0)) && !close(G({ x: 0, y: b + 1 }), 0); } catch { return false; }
    };
    const eq = [toAscii(q.answer), toAscii(q.answer).replace(/\s+/g, ''), q.answer.replace(/\(x/, ' (x')];
    if (P.length > 1) { const [x2, y2] = P[1]; eq.push(`y ${y2 < 0 ? '+' : '-'} ${Math.abs(y2)} = ${Number.isInteger(m) ? m : `(${fracText(m)})`}(x ${x2 < 0 ? '+' : '-'} ${Math.abs(x2)})`); }
    const si = `y = ${fracText(m)}x + ${fracText(b)}`.replace('+ -', '- ');
    const wrong = [si, `y = ${Number.isInteger(m) ? m : `(${fracText(m)})`}(x - ${P[0][0]}) + ${P[0][1]}`, toAscii(q.answer).replace(/^y ([+-])/, (z, sg) => `y ${sg === '+' ? '-' : '+'}`)];
    return { right, eq, wrong, mustNote: [si], ctx: { mode: 'solve', free: ['x', 'y'], sols: onLine, isSol: (a) => close(a.y, m * a.x + b), allSols: true } };
  },
  'parallel-perp': (q) => {
    const m0t = /(parallel|perpendicular) to (.+?)(?:\?|, in slope-intercept form\.)$/.exec(q.text);
    const [L, R] = sides(m0t[2]);
    const G = (x, y) => ev(L, { x, y }) - ev(R, { x, y });
    const m0 = -(G(1, 0) - G(0, 0)) / (G(0, 1) - G(0, 0));
    const m = m0t[1] === 'parallel' ? m0 : -1 / m0;
    const pt = /through \((\S+), (\S+)\)/.exec(q.text);
    if (!pt) {
      const j = numJudge(m, { xform: false });
      j.eq.push(`m = ${fracText(m)}`);
      const b0 = -G(0, 0) / (G(0, 1) - G(0, 0));
      j.ctx = { mode: 'solve', free: ['x', 'y'], sols: [-1, 0, 2].map((x) => ({ x, y: m0 * x + b0 })), isSol: (a) => close(G(a.x, a.y), 0), allSols: true };
      return j;
    }
    const b = num(pt[2]) - m * num(pt[1]);
    return { ...lineJudge(m, b), ctx: { mode: 'numeric', vars: { b } } };
  },
  'sys-ineq': (q) => {
    const m = /system (.+) and (.+)\?$/.exec(q.text);
    const I = [m[1], m[2]].map((e) => splitRel(e));
    const ok = (x, y) => I.every(({ parts, ops }) => relHolds(ops[0], ev(parts[0], { x, y }), ev(parts[1], { x, y })));
    return { right: (s) => { const pp = pair(s); return !!pp && ok(pp[0], pp[1]); }, ctx: { mode: 'numeric' } };
  },
  'geo-seq': (q) => {
    let a1, r, n;
    const m = /the (\d+)(?:st|nd|rd|th) term of the geometric sequence (.+), …\?$/.exec(q.text);
    if (m) { const t = m[2].split(', ').map(num); a1 = t[0]; r = t[1] / t[0]; n = +m[1]; if (!t.every((x, i) => !i || close(x / t[i - 1], r))) throw new Error('not geometric'); }
    else { const k = /a₁ = (\S+) and common ratio r = (\S+)\. What is a([₀-₉]+)\?$/.exec(q.text); a1 = num(k[1]); r = num(k[2]); n = Number([...k[3]].map((c) => SUBD[c]).join('')); }
    const j = numJudge(a1 * r ** (n - 1), { xform: false });
    j.ctx = { mode: 'numeric', vars: { r, n }, names: { 'a₁': a1, [`a${subDigits(n)}`]: j.value }, target: () => j.value };
    return j;
  },
  'exp-func': (q) => { const m = /^If f\(x\) = (.+), find f\((.+)\)\.$/.exec(q.text); const j = numJudge(ev(m[1], { x: num(m[2]) }), { xform: false }); j.ctx = { mode: 'identity', free: [], names: { [`f(${m[2]})`]: j.value }, target: () => j.value }; return j; },
  'mono-mult': (q) => polyJudge(q, 'Multiply: '),
  'factor-group': (q) => factorJudge(q),
  'quad-formula': (q) => {
    const [L, R] = sides(q.text.replace(/^Solve using the quadratic formula: /, ''));
    const f = (x) => ev(L, { x }) - ev(R, { x });
    const [c, b, a] = fit(f);
    const D = b * b - 4 * a * c;
    const rs = [(-b - Math.sqrt(D)) / (2 * a), (-b + Math.sqrt(D)) / (2 * a)].sort((p, r) => p - r);
    const ascii = toAscii(q.answer).replace(/√(\d+)/g, 'sqrt($1)');
    const exact = [ascii, ascii.replace('±', '+-'), q.answer.replace(/^x = /, '')];
    if (q.answer.includes('±')) { const e = q.answer.replace(/^x = /, ''); exact.push(`x = ${toAscii(e.replace('±', '+'))}, x = ${toAscii(e.replace('±', '-'))}`); }
    const j = rootsJudge(rs, f, { exact });
    j.ctx.vars = { a, b, c };
    return j;
  },
  'complete-square': (q) => {
    let m = /^What number c makes (.+) \+ c a perfect square trinomial\?$/.exec(q.text);
    if (m) { const [, b] = fit((x) => ev(m[1], { x })); const j = numJudge(b * b / 4, { xform: false }); j.ctx = { mode: 'identity', free: ['x'], names: { c: j.value } }; return j; }
    m = /^Write (.+) in the form \(x \+ h\)² \+ k by completing the square\.$/.exec(q.text);
    if (m) {
      const e = m[1];
      const right = (s) => { try { const t = toAscii(s).replace(/²/g, '^2').replace(/\s+/g, ''); return samePoly((pp) => ev(e, pp), (pp) => ev(s, pp)) && /^(\(x[+-]\d+\)\^2([+-]\d+)?|[+-]?\d+\+\(x[+-]\d+\)\^2)$/.test(t); } catch { return false; } };
      const a = toAscii(q.answer).replace(/²/g, '^2');
      const k = /\)\^2 ([+-]) (\d+)$/.exec(a);
      const eq = [a, a.replace(/\s+/g, ''), q.answer, ...(k ? [`${k[1] === '-' ? '-' : ''}${k[2]} + ${a.replace(/ [+-] \d+$/, '')}`] : [])];
      return { right, eq, wrong: [asc(e), a.replace(/\(x ([+-])/, (z, sg) => `(x ${sg === '+' ? '-' : '+'}`)], mustNote: [asc(e)], ctx: { mode: 'identity', free: ['x'], target: (pp) => ev(e, pp), targetNeedsVar: true } };
    }
    m = /^Solve by completing the square: (.+) = 0$/.exec(q.text);
    const f = (x) => ev(m[1], { x });
    const [c, b, a] = fit(f);
    const D = b * b - 4 * a * c;
    const rs = [(-b - Math.sqrt(D)) / (2 * a), (-b + Math.sqrt(D)) / (2 * a)].sort((p, r) => p - r);
    const ascii = toAscii(q.answer).replace(/√(\d+)/g, 'sqrt($1)');
    return rootsJudge(rs, f, { exact: [ascii, ascii.replace('±', '+-'), q.answer.replace(/^x = /, '')] });
  },
  'add-radicals': (q) => radJudge(ev(q.text.replace('Simplify: ', ''))),
  'line-fit': (q) => {
    let m = /is y = ([\d.]+)x ([+−]) (\d+)\. Use it to predict .*?(\d+)(?: hours|°F| days| minutes)/.exec(q.text);
    if (m) { const v = +m[1] * +m[4] + (m[2] === '+' ? 1 : -1) * +m[3]; const j = numJudge(Math.round(v * 1e9) / 1e9, { xform: false }); j.ctx = { mode: 'numeric', vars: { y: j.value } }; return j; }
    const pts = [...q.text.matchAll(/\((\d+), (\d+)\)/g)].map((k) => [+k[1], +k[2]]);
    const n = pts.length, mx = pts.reduce((s, p) => s + p[0], 0) / n, my = pts.reduce((s, p) => s + p[1], 0) / n;
    const sxy = pts.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0), sxx = pts.reduce((s, p) => s + (p[0] - mx) ** 2, 0), syy = pts.reduce((s, p) => s + (p[1] - my) ** 2, 0);
    const r = sxy / Math.sqrt(sxx * syy);
    const want = Math.abs(r) > 0.9999 ? 'Every point lies exactly on one line' : r >= 0.7 ? 'Positive correlation' : r <= -0.7 ? 'Negative correlation' : Math.abs(r) <= 0.3 ? 'No correlation' : null;
    if (!want) throw new Error(`ambiguous correlation r = ${r.toFixed(3)}`);
    return { right: (s) => s === want, ctx: { mode: 'numeric' } };
  },
});
Object.assign(CTX, {
  'mono-mult': exprCtx('Multiply: ', ['x']), 'factor-group': exprCtx(/^Factor .*?: /, ['x']), 'add-radicals': valueCtx,
});

/* ======================================================== text hygiene */
const BAD = [
  [/NaN/, 'NaN'], [/Infinity/, 'Infinity'], [/\bundefined\b/, 'undefined'], [/\bnull\b/, 'null'], [/\[object/, '[object'],
  [/\+ [-−]/, '"+ -"'], [/[-−] [-−]/, '"- -"'], [/(^|[^\d.])1x/, '"1x"'], [/(^|[^\d.])0x/, '"0x"'], [/[+−-] 0x/, '"+ 0x"'],
  [/[xy]¹(?![⁰¹²³⁴⁵⁶⁷⁸⁹])/, 'x¹'], [/\^1(?!\d)/, '^1'], [/[−-]0(?![.\d/])/, '−0'], [/\d\.\d{7,}/, 'float noise'], [/\d\.\d*(0000|9999)\d/, 'float noise'],
  [/(^|[^\d])1√/, '"1√"'], [/√1(?!\d)/, '√1'],
];
function hygiene(q) {
  const strings = [q.text, q.answer, ...(q.options || []), q.explanationText, q.figureAlt || '', q.format || '', q.hintText || ''];
  const out = [];
  for (const s of strings) {
    let t = String(s);
    if (q.skill === 'slope') t = t.replace(/\bundefined\b/g, 'UNDEF');
    for (const [re, name] of BAD) if (re.test(t)) out.push(`${name} in ${JSON.stringify(t.length > 160 ? t.slice(0, 160) + '…' : t)}`);
  }
  return out;
}

/* ============================================================== driver */
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await browser.newContext({ serviceWorkers: 'block' });
const page = await ctx.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));
await page.goto(STUDY, { waitUntil: 'load' });
if (!(await page.evaluate(() => !!window.CQAlgebra))) {
  if (!(await page.evaluate(() => !!window.CQ))) { console.log('FAIL: study/app.js did not load (no window.CQ)'); process.exit(1); }
  await page.addScriptTag({ url: new URL('algebra.js', STUDY).href });
}
const skills = await page.evaluate(() => window.CQAlgebra.skills);
if (!skills.length) { console.log('FAIL: CQAlgebra.skills is empty'); process.exit(1); }

const rows = [];
const problems = [];
const keep = {};                                           // skill → [{ q, ctx }] for the self-test
for (const sk of skills) {
  const row = { skill: sk.id, unit: sk.setId, steps: 0, n: 0, written: 0, mc: 0, game: 0, eqOk: 0, wrongOk: 0, fails: 0 };
  const fail = (msg) => { row.fails++; if (problems.filter((p) => p.startsWith(sk.id)).length < 6) problems.push(`${sk.id}: ${msg}`); };
  for (const diff of ['easy', 'medium', 'hard']) {
    // Generate in the page; keep the objects there so their check() can be called.
    const batch = await page.evaluate(({ id, diff, n }) => {
      window.__alg = [];
      const out = [];
      for (let i = 0; i < n; i++) {
        for (const mc of [false, true]) {
          if (mc && i % 3) continue;                       // a game version for every third problem
          const q = mc ? window.CQAlgebra.generateMC(id, { difficulty: diff }) : window.CQAlgebra.generate(id, { difficulty: diff });
          window.__alg.push(q);
          out.push({
            game: mc, skill: q.skill, id: q.id, type: q.type, text: q.text, answer: q.answer, options: q.options || null,
            figure: typeof q.figure === 'string' ? q.figure : null, figureAlt: q.figureAlt || '', format: q.format || '',
            explanationText: q.explanation ? [...q.explanation.querySelectorAll('li')].map((li) => [...li.children].map((c) => c.textContent).join(' | ')).join('\n') : '', steps: (q.steps || []).length,
            hintText: q.hint ? [q.hint.why, q.hint.math, q.hint.res].filter(Boolean).join(' ') : '',
            stepList: (q.steps || []).map((st) => [st.why || '', st.math || '', st.res || '']),
            promptIsNode: typeof q.prompt !== 'string', setId: q.setId, source: q.source, hasCheck: typeof q.check === 'function',
          });
        }
      }
      return out;
    }, { id: sk.id, diff, n: N });

    const tests = [];                                        // [index, input, expectAccept, expectNote]
    batch.forEach((q, i) => {
      row.n++;
      if (q.game) row.game++; else if (q.type === 'mc') row.mc++; else row.written++;
      for (const h of hygiene(q)) fail(`${diff}: ${h}`);
      if (q.id !== `alg:${sk.id}` || q.setId !== sk.setId || q.source !== `Algebra Lab · ${sk.name}`) fail(`${diff}: bad id/setId/source ${q.id} ${q.setId} ${q.source}`);
      if (q.steps < 1 || !q.explanationText.trim()) fail(`${diff}: no worked steps for ${q.text}`);
      if (q.game && typeof q.text !== 'string') fail('game question prompt is not a string');
      let j;
      try { j = J[sk.id](q); } catch (e) { fail(`${diff}: verifier could not read "${q.text}": ${e.message}`); return; }
      const ctx = j.ctx || (CTX[sk.id] ? CTX[sk.id](q, j) : { mode: 'numeric' });
      const [nSteps, badSteps] = checkSteps(q.stepList, ctx);
      row.steps += nSteps;
      for (const b of badSteps) fail(`${diff}: worked step ${b} — in "${q.text}"`);
      (keep[sk.id] ||= []).push({ q, ctx });
      if (!j.right(q.answer)) fail(`${diff}: WRONG canonical answer "${q.answer}" for "${q.text}"`);
      if (q.type === 'mc') {
        if (!Array.isArray(q.options) || q.options.length !== 4 || new Set(q.options).size !== 4) fail(`${diff}: options are not 4 distinct: ${JSON.stringify(q.options)}`);
        else {
          if (!q.options.includes(q.answer)) fail(`${diff}: answer not among options for "${q.text}"`);
          const good = q.options.filter((o) => { try { return j.right(o); } catch { return false; } });
          if (good.length !== 1) fail(`${diff}: ${good.length} right options for "${q.text}": ${JSON.stringify(q.options)}`);
        }
      } else {
        if (!q.hasCheck) fail(`${diff}: written question without q.check`);
        if (!q.promptIsNode) fail(`${diff}: written prompt should carry its format line`);
        tests.push([i, q.answer, true, false]);
        for (const e of j.eq || []) tests.push([i, e, true, false]);
        const must = new Set(j.mustNote || []);
        for (const w of j.wrong || []) {
          let r = false; try { r = j.right(w); } catch { r = false; }
          if (!r) tests.push([i, w, false, must.has(w)]);
        }
      }
    });
    const results = await page.evaluate((tests) => tests.map(([i, s]) => {
      const q = window.__alg[i];
      let ok;
      try { ok = window.CQ.checkWritten(q, s); } catch (e) { ok = `threw ${e.message}`; }
      return [ok, q.note || ''];
    }), tests);
    tests.forEach(([i, s, want, needNote], k) => {
      const [got, note] = results[k];
      const q = batch[i];
      if (got !== want) fail(`${diff}: checker ${want ? 'REJECTED equivalent' : 'ACCEPTED wrong'} "${s}" for "${q.text}" (answer ${q.answer})${note ? ` — note: ${note}` : ''}`);
      else if (want) row.eqOk++; else row.wrongOk++;
      if (!want && needNote && !note) fail(`${diff}: no explanation shown for rejecting "${s}" (equal but not in the asked-for form) on "${q.text}"`);
    });
  }
  rows.push(row);
}
await browser.close();

/* Self-test: the step checker must catch a step that is wrong while the
   answer stays right. Two regressions, made from real problems:
     FOIL — the Inner product miswritten ("2 · x = 3x");
     inequality — dividing by a negative with the old sign on the math line. */
const selfTest = [];
{
  const f = (keep.foil || []).find(({ q }) => q.stepList.some(([w]) => /^Inner/.test(w)));
  if (!f) selfTest.push('no FOIL problem to mutate');
  else {
    const steps = f.q.stepList.map(([w, m, r]) => (/^Inner/.test(w) ? [w, m.replace(/= (.+)$/, (all, rhs) => `= ${/x/.test(rhs) ? rhs.replace(/^(−?)(\d*)x/, (z, sg, d) => `${sg}${(+d || 1) + 1}x`) : '1x'}`), r] : [w, m, r]));
    if (!checkSteps(steps, f.ctx)[1].length) selfTest.push(`a miswritten FOIL Inner step was not caught: ${JSON.stringify(steps)}`);
  }
  const FL = { '<': '>', '>': '<', '≤': '≥', '≥': '≤' };
  const g = (keep.inequality || []).find(({ q }) => q.stepList.some(([w]) => /reverses the inequality sign/.test(w)));
  if (!g) selfTest.push('no inequality problem that divides by a negative');
  else {
    const steps = g.q.stepList.map(([w, m, r]) => (/reverses the inequality sign/.test(w) ? [w, m.replace(/[<>≤≥]/, (c) => FL[c]), r] : [w, m, r]));
    if (!checkSteps(steps, g.ctx)[1].length) selfTest.push(`an inequality divide step with the old sign was not caught: ${JSON.stringify(steps)}`);
  }
}

const pad = (s, n) => String(s).padEnd(n);
const lpad = (s, n) => String(s).padStart(n);
console.log(`\nAlgebra Lab — ${rows.length} skills, ${N} problems per skill per difficulty (+ a game version of every third)\n`);
console.log(`${pad('skill', 18)}${pad('set', 10)}${lpad('problems', 9)}${lpad('steps ok', 10)}${lpad('written', 9)}${lpad('mc', 6)}${lpad('game', 6)}${lpad('equiv ok', 10)}${lpad('wrong ok', 10)}  result`);
for (const r of rows) console.log(`${pad(r.skill, 18)}${pad(r.unit, 10)}${lpad(r.n, 9)}${lpad(r.steps, 10)}${lpad(r.written, 9)}${lpad(r.mc, 6)}${lpad(r.game, 6)}${lpad(r.eqOk, 10)}${lpad(r.wrongOk, 10)}  ${r.fails ? `FAIL (${r.fails})` : 'ok'}`);
const total = rows.reduce((s, r) => s + r.n, 0);
if (pageErrors.length) problems.push(...pageErrors.map((e) => `page error: ${e}`));
const short = rows.filter((r) => r.n < 400);
for (const t of selfTest) problems.push(`step-checker self-test: ${t}`);
// Skills whose steps are all prose (reading a graph, a set of pairs) are the only ones allowed no checked clauses.
const PROSE = new Set(['number-line', 'is-function', 'system-type']);
for (const r of rows) if (!r.steps && !PROSE.has(r.skill)) problems.push(`${r.skill}: no worked-step clause could be checked`);
for (const r of short) problems.push(`${r.skill}: only ${r.n} problems checked (need ≥ 400)`);
console.log(`\nStep-checker self-test: ${selfTest.length ? 'FAILED' : 'a miswritten FOIL step and an unreversed inequality step are both caught'}`);
if (problems.length || rows.some((r) => r.fails)) {
  console.log(`\n${rows.reduce((s, r) => s + r.fails, 0)} failure(s). First few:`);
  for (const p of problems.slice(0, 60)) console.log(`  ${p}`);
  process.exit(1);
}
const stepTotal = rows.reduce((s, r) => s + r.steps, 0);
console.log(`\nOK: ${total.toLocaleString()} problems across ${rows.length} skills — every answer independently confirmed, ${stepTotal.toLocaleString()} worked-step clauses checked.`);
