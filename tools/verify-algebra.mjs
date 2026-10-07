/**
 * Checks every Algebra Lab skill (study/algebra.js) against math written
 * separately, here.
 *
 *   node tools/verify-algebra.mjs [baseUrl] [--n=150] [--skills=id,id…]
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
const ONLY = (args.find((a) => a.startsWith('--skills=')) || '').slice(9).split(',').filter(Boolean);
const STUDY = base ? `${base.replace(/\/$/, '')}/study/` : pathToFileURL(fileURLToPath(new URL('../study/index.html', import.meta.url))).href;

/* ================================================== independent math */
const SUPD = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-' };
function tokenize(src) {
  const s = String(src).toLowerCase()
    .replace(/[−–]/g, '-').replace(/[×·*]/g, '*').replace(/÷/g, '/')
    .replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (m) => `^(${[...m].map((c) => SUPD[c]).join('')})`)
    .replace(/ˣ/g, '^(x)')
    .replace(/[½¼¾⅓⅔]/g, (c) => `(${{ '½': '1/2', '¼': '1/4', '¾': '3/4', '⅓': '1/3', '⅔': '2/3' }[c]})`)
    .replace(/squareroot|sqrt|root/g, '√');
  const out = [];
  for (let i = 0; i < s.length;) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    const m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i));
    if (m) { out.push({ t: 'n', v: parseFloat(m[1]) }); i += m[1].length; continue; }
    if (/[a-z]/.test(c)) { out.push({ t: 'v', v: c }); i++; continue; }
    if ('+-*/^()√|⌊⌋'.includes(c)) { out.push({ t: c }); i++; continue; }
    if (c === '[') { out.push({ t: '(' }); i++; continue; }
    if (c === ']') { out.push({ t: ')' }); i++; continue; }
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
      else if (is('v') || is('(') || is('√') || is('⌊') || (is('|') && !absDepth)) v *= power();
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
    if (k.t === '⌊') { const v = expr(); if (!is('⌋')) throw new Error(`missing ⌋ in ${src}`); p++; return Math.floor(v + 1e-12); }
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
/** Equivalent typings of v. With exact (a prompt that never asks for rounding) a rounded decimal is NOT one of them. */
const numForms = (v, prefix = '', exact = false) => {
  const out = [String(v), `${prefix}${fracText(v)}`, ` ${fracText(v)} `];
  if (!Number.isInteger(v) && terminating(v)) out.push(String(+v.toFixed(6)));
  if (mixedText(v)) out.push(`${prefix}${mixedText(v)}`);
  if (rounded2(v) && !exact) out.push(`${prefix}${rounded2(v)}`);
  return out;
};
/** For an exact answer: the rounded decimals a student might type, which must be refused with a note. */
const roundedWrong = (v) => (rounded2(v) ? [rounded2(v), rounded2(v).replace(/^(-?)0\./, '$1.'), v.toFixed(3)] : []);
const numWrong = (v, prefix = '') => [`${prefix}${fracText(v + 1)}`, `${prefix}${fracText(v - 1)}`, ...(v ? [`${prefix}${fracText(-v)}`] : [])];
function numJudge(v, { prefix = '', xform = true, exact = false } = {}) {
  const rw = exact ? roundedWrong(v) : [];
  return {
    value: v,
    right: (s) => close(num(s), v),
    eq: [...numForms(v, '', exact), ...(xform ? numForms(v, 'x = ', exact).slice(1).concat([`x=${fracText(v)}`]) : []), ...(prefix ? [`${prefix}${fracText(v)}`] : [])],
    wrong: [...numWrong(v, prefix), ...rw], mustNote: rw,
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

const fmtNum = (v) => String(v).replace('-', '−');
/* ======================================================================
   Judges for the graph skills and units 13–14, written here from scratch.
   The graph judges READ THE PICTURE: the pixel ↔ number mapping comes from
   the tick labels, every curve from its polyline, and whether an end is
   included, excluded or continues from the dots and arrowheads drawn on it.
   ====================================================================== */
const attr = (tag, name) => { const m = new RegExp(`\\s${name}="([^"]*)"`).exec(tag); return m ? m[1] : null; };
/** Reads an Algebra Lab grid SVG back into math: { curves: [{ cls, pts, ends }], marks }. */
function readGraph(svg) {
  if (!/class="alg-grid"/.test(svg || '')) throw new Error('no coordinate grid in the figure');
  const labels = (cls, axis) => [...svg.matchAll(new RegExp(`<text class="${cls}"[^>]*>([^<]+)</text>`, 'g'))].map((m) => [Number(attr(m[0], axis)), num(m[1])]);
  const fitAxis = (ls) => {
    if (ls.length < 2) throw new Error('fewer than two tick labels on an axis');
    const [[p0, v0], [p1, v1]] = [ls[0], ls[ls.length - 1]];
    const k = (v1 - v0) / (p1 - p0);
    for (const [p, v] of ls) if (!close(v0 + (p - p0) * k, v)) throw new Error('tick labels are not evenly spaced');
    return (p) => v0 + (p - p0) * k;
  };
  const toX = fitAxis(labels('alg-gx', 'x')), toY = fitAxis(labels('alg-gy', 'y'));
  const rd = (v) => Math.round(v * 1e4) / 1e4;
  const curves = [...svg.matchAll(/<polyline class="alg-curve ([^"]*)" points="([^"]+)"\/>/g)].map((m) => ({
    cls: m[1], ends: [null, null],
    pts: m[2].trim().split(/\s+/).map((pr) => { const [a, b] = pr.split(',').map(Number); return [rd(toX(a)), rd(toY(b))]; }),
  }));
  const near_ = (P, Q) => Math.hypot(P[0] - Q[0], P[1] - Q[1]) < 0.02;
  const attach = (P, type, dir) => {
    for (const c of curves) {
      const n = c.pts.length;
      for (const [e, i, j] of [[0, 0, 1], [1, n - 1, n - 2]]) {
        if (!near_(c.pts[i], P) || c.ends[e]) continue;
        if (dir) { const [dx, dy] = [c.pts[i][0] - c.pts[j][0], c.pts[i][1] - c.pts[j][1]]; if (dx * dir[0] + dy * dir[1] <= 0) continue; }
        c.ends[e] = type; return true;
      }
    }
    return false;
  };
  for (const m of svg.matchAll(/<circle class="alg-dot (open|closed)[^"]*"[^>]*\/>/g)) {
    const P = [rd(toX(+attr(m[0], 'cx'))), rd(toY(+attr(m[0], 'cy')))];
    if (!attach(P, m[1])) throw new Error(`a ${m[1]} dot at (${P}) is not at the end of a curve`);
  }
  for (const m of svg.matchAll(/<path class="alg-arrow[^"]*" d="M([\d.]+) ([\d.]+) L([\d.]+) ([\d.]+) L([\d.]+) ([\d.]+) Z"\/>/g)) {
    const [tx, ty, ax, ay, bx, by] = m.slice(1).map(Number);
    const tip = [toX(tx), toY(ty)], base = [(toX(ax) + toX(bx)) / 2, (toY(ay) + toY(by)) / 2];
    if (!attach(tip.map(rd), 'arrow', [tip[0] - base[0], tip[1] - base[1]])) throw new Error('an arrowhead is not at the end of a curve');
  }
  const marks = [...svg.matchAll(/<circle class="alg-mark"[^>]*\/>/g)].map((m) => [rd(toX(+attr(m[0], 'cx'))), rd(toY(+attr(m[0], 'cy')))]);
  return { curves, marks };
}
const isLattice = ([x, y]) => Math.abs(x - Math.round(x)) < 1e-6 && Math.abs(y - Math.round(y)) < 1e-6;
/** Distance from a point to the drawn curves (in units). */
function distToGraph(G, [x, y]) {
  let best = Infinity;
  for (const c of G.curves) for (let i = 0; i + 1 < c.pts.length; i++) {
    const [ax, ay] = c.pts[i], [bx, by] = c.pts[i + 1];
    const L2 = (bx - ax) ** 2 + (by - ay) ** 2;
    const t = L2 ? Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / L2)) : 0;
    best = Math.min(best, Math.hypot(x - (ax + t * (bx - ax)), y - (ay + t * (by - ay))));
  }
  return best;
}
/** A straight curve's slope and intercept, from its lattice points; checks every drawn point is on it. */
function readLine(c) {
  const lat = c.pts.filter(isLattice);
  if (lat.length < 2) throw new Error('a line with fewer than two lattice points');
  const A = lat[0], B = lat[lat.length - 1];
  if (A[0] === B[0]) {
    if (!c.pts.every((p) => Math.abs(p[0] - A[0]) < 1e-3)) throw new Error('the drawn points are not on one vertical line');
    return { vertical: true, x: A[0] };
  }
  const m = (B[1] - A[1]) / (B[0] - A[0]), b = A[1] - m * A[0];
  if (!c.pts.every(([x, y]) => Math.abs(m * x + b - y) < 2e-3)) throw new Error('the drawn points are not on one straight line');
  return { m, b, lat };
}
/** How many distinct points of the graph lie on the vertical line x = a (Infinity along a vertical piece). */
function crossings(G, a) {
  const ys = [];
  for (const c of G.curves) {
    for (let i = 0; i + 1 < c.pts.length; i++) {
      const [ax, ay] = c.pts[i], [bx, by] = c.pts[i + 1];
      if (Math.abs(ax - bx) < 1e-9) { if (Math.abs(ax - a) < 1e-6) return Infinity; continue; }
      if (a < Math.min(ax, bx) - 1e-9 || a > Math.max(ax, bx) + 1e-9) continue;
      ys.push({ y: ay + ((by - ay) * (a - ax)) / (bx - ax), c, i });
    }
  }
  const open = [];
  for (const c of G.curves) c.ends.forEach((t, e) => { if (t === 'open') open.push(c.pts[e ? c.pts.length - 1 : 0]); });
  const kept = ys.filter(({ y }) => !open.some(([ox, oy]) => Math.abs(ox - a) < 1e-6 && Math.abs(oy - y) < 1e-3) || ys.some((o) => Math.abs(o.y - y) < 1e-3 && !open.some(([ox, oy]) => Math.abs(ox - a) < 1e-6 && Math.abs(oy - o.y) < 1e-3)));
  const uniq = [];
  for (const { y } of kept) if (!uniq.some((u) => Math.abs(u - y) < 1e-3)) uniq.push(y);
  return uniq.length;
}
function isFunctionGraph(G) {
  const xs = new Set();
  for (let i = -800; i <= 800; i++) xs.add(i / 100);
  for (const c of G.curves) for (const [x] of c.pts) { xs.add(x); xs.add(x - 1e-4); xs.add(x + 1e-4); }
  return [...xs].every((x) => crossings(G, x) <= 1);
}
/** Domain and range of a one-curve function graph: { lo, hi, loIn, hiIn } each, null = unbounded. */
function graphDomainRange(G) {
  if (G.curves.length !== 1) throw new Error('expected one curve');
  const c = G.curves[0], P = c.pts, n = P.length;
  const endAt = (e) => ({ t: c.ends[e], p: P[e ? n - 1 : 0], q: P[e ? n - 2 : 1] });
  const E = [endAt(0), endAt(1)];
  const dirOf = (E_) => [E_.p[0] - E_.q[0], E_.p[1] - E_.q[1]];
  const xs = P.map((p) => p[0]), ys = P.map((p) => p[1]);
  const D = { lo: Math.min(...xs), hi: Math.max(...xs) };
  for (const [side, val] of [['lo', D.lo], ['hi', D.hi]]) {
    const e = E.find((E_) => Math.abs(E_.p[0] - val) < 1e-6);
    if (!e) { D[`${side}In`] = true; continue; }
    if (e.t === 'arrow' && (side === 'lo' ? dirOf(e)[0] < 0 : dirOf(e)[0] > 0)) D[side] = null;
    else D[`${side}In`] = e.t !== 'open';
  }
  const R = { lo: Math.min(...ys), hi: Math.max(...ys) };
  for (const e of E) if (e.t === 'arrow') { const dy = dirOf(e)[1]; if (dy < -1e-9) R.lo = null; if (dy > 1e-9) R.hi = null; }
  const isOpenEnd = (i) => (i === 0 && c.ends[0] === 'open') || (i === n - 1 && c.ends[1] === 'open');
  const attained = (v) => P.some((p, i) => Math.abs(p[1] - v) < 1e-6 && !isOpenEnd(i)) || P.some((p, i) => i + 1 < n && Math.abs(p[1] - v) < 1e-6 && Math.abs(P[i + 1][1] - v) < 1e-6);
  if (R.lo != null) R.loIn = attained(R.lo);
  if (R.hi != null) R.hiIn = attained(R.hi);
  for (const k of ['lo', 'hi']) if (D[k] != null) D[k] = Math.round(D[k] * 1e6) / 1e6;
  for (const k of ['lo', 'hi']) if (R[k] != null) R[k] = Math.round(R[k] * 1e6) / 1e6;
  return [D, R];
}
/** "[−4, 3)", "(−∞, 2]", "−4 ≤ x < 3", "y ≥ 2", "all real numbers" → { lo, hi, loIn, hiIn }. */
function readSet(s, v) {
  const t = s.trim().replace(/−/g, '-');
  if (/^all real numbers$/i.test(t)) return { lo: null, hi: null };
  let m = /^([[(])(-?∞|[-\d./]+), (∞|[-\d./]+)([\])])$/.exec(t);
  if (m) {
    const lo = m[2] === '-∞' ? null : num(m[2]), hi = m[3] === '∞' ? null : num(m[3]);
    if ((lo == null && m[1] === '[') || (hi == null && m[4] === ']')) return null;
    return { lo, hi, loIn: m[1] === '[', hiIn: m[4] === ']' };
  }
  m = new RegExp(`^([-\\d./]+) (≤|<) ${v} (≤|<) ([-\\d./]+)$`).exec(t);
  if (m) return { lo: num(m[1]), hi: num(m[4]), loIn: m[2] === '≤', hiIn: m[3] === '≤' };
  m = new RegExp(`^${v} (≤|<|≥|>) ([-\\d./]+)$`).exec(t);
  if (m) return m[1] === '≤' || m[1] === '<' ? { lo: null, hi: num(m[2]), hiIn: m[1] === '≤' } : { lo: num(m[2]), hi: null, loIn: m[1] === '≥' };
  return null;
}
const sameSetI = (a, b) => !!a && !!b && ['lo', 'hi'].every((k) => (a[k] == null ? b[k] == null : b[k] != null && close(a[k], b[k]) && a[`${k}In`] === b[`${k}In`]));

/** Classifies one drawn curve into a parent family, from its shape alone. */
function classifyCurve(G) {
  const c = G.curves[0], P = c.pts;
  const fits = [];
  // linear: every point on the line through the ends
  const [A, B] = [P[0], P[P.length - 1]];
  const lineAt = (x) => A[1] + ((B[1] - A[1]) * (x - A[0])) / (B[0] - A[0]);
  if (B[0] !== A[0] && P.every(([x, y]) => Math.abs(lineAt(x) - y) < 2e-3)) fits.push('linear');
  // absolute value: one corner, straight on both sides, slopes opposite
  const turn = P.findIndex((p, i) => i > 0 && i < P.length - 1 && Math.abs((P[i + 1][1] - p[1]) / (P[i + 1][0] - p[0]) - (p[1] - P[i - 1][1]) / (p[0] - P[i - 1][0])) > 1e-3);
  if (turn > 0) {
    const L = P.slice(0, turn + 1), Rr = P.slice(turn);
    const sl = (Q) => (Q[Q.length - 1][1] - Q[0][1]) / (Q[Q.length - 1][0] - Q[0][0]);
    const straight = (Q) => Q.every(([x, y]) => Math.abs(Q[0][1] + sl(Q) * (x - Q[0][0]) - y) < 2e-3);
    if (straight(L) && straight(Rr) && close(sl(L), -sl(Rr))) fits.push('abs');
  }
  // quadratic: the parabola through three points passes through them all
  const [p0, p1, p2] = [P[0], P[Math.floor(P.length / 2)], P[P.length - 1]];
  const q = (x) => p0[1] * ((x - p1[0]) * (x - p2[0])) / ((p0[0] - p1[0]) * (p0[0] - p2[0])) + p1[1] * ((x - p0[0]) * (x - p2[0])) / ((p1[0] - p0[0]) * (p1[0] - p2[0])) + p2[1] * ((x - p0[0]) * (x - p1[0])) / ((p2[0] - p0[0]) * (p2[0] - p1[0]));
  if (!fits.includes('linear') && P.every(([x, y]) => Math.abs(q(x) - y) < 3e-3)) fits.push('quad');
  // square root: starts at a closed dot (h, k); (y − k)² is proportional to x − h
  if (c.ends[0] === 'closed') {
    const [h, k] = P[0];
    const ratio = P.slice(1).map(([x, y]) => (y - k) ** 2 / (x - h));
    const sgn = P.slice(1).map(([, y]) => Math.sign(y - k));
    if (ratio.every((r) => Math.abs(r - ratio[ratio.length - 1]) < 5e-3 * Math.max(1, ratio[ratio.length - 1])) && sgn.every((s) => s === sgn[0])) fits.push('sqrt');
  }
  // exponential: at equal x-steps, consecutive differences have a constant ratio ≠ 1
  const grid = P.filter(([x]) => Math.abs(x * 4 - Math.round(x * 4)) < 1e-6);
  const d1 = grid.slice(1).map((p, i) => p[1] - grid[i][1]).filter((v, i) => Math.abs(grid[i + 1][0] - grid[i][0] - 0.25) < 1e-6 && Math.abs(v) > 0.05);
  if (d1.length >= 4 && grid.slice(1).every((p, i) => Math.abs(p[0] - grid[i][0] - 0.25) < 1e-6)) {
    const big = grid.slice(1).map((p, i) => [p[1] - grid[i][1], i]).filter(([v]) => Math.abs(v) > 0.2);
    const rs = big.slice(1).filter(([, i], j) => i === big[j][1] + 1).map(([v], j) => v / big[j][0]);
    if (rs.length >= 3 && rs.every((r) => Math.abs(r - rs[0]) < 0.02) && Math.abs(rs[0] - 1) > 0.05) fits.push('exp');
  }
  return fits;
}
const FAMNAME = { linear: 'Linear (y = x)', quad: 'Quadratic (y = x²)', abs: 'Absolute value (y = |x|)', sqrt: 'Square root (y = √x)', exp: 'Exponential (y = 2ˣ)' };
const PARENT = { 'x²': (x) => x * x, '|x|': Math.abs, '√x': (x) => (x < 0 ? NaN : Math.sqrt(x)), '2ˣ': (x) => 2 ** x };
/** "Reflect over the x-axis, vertical stretch by a factor of 2, left 1, down 4" → { a, h, k }, or null. */
function readDesc(s) {
  let a = 1, h = 0, k = 0;
  for (const part of s.toLowerCase().split(', ')) {
    let m;
    if (part === 'reflect over the x-axis') a = -a;
    else if ((m = /^vertical (stretch|shrink) by a factor of (\S+)$/.exec(part))) { const f = num(m[2]); if ((m[1] === 'stretch') !== (f > 1)) return null; a *= f; }
    else if ((m = /^(right|left|up|down) (\d+)$/.exec(part))) { const v = +m[2]; if (m[1] === 'right') h += v; else if (m[1] === 'left') h -= v; else if (m[1] === 'up') k += v; else k -= v; }
    else return null;
  }
  return { a, h, k };
}
/** "reflected over the x-axis and stretched vertically by a factor of 3, then shifted right 4 and up 6" → { a, h, k }. */
function readPhrase(s) {
  let a = 1, h = 0, k = 0;
  const [pre, post] = s.includes(', then ') ? s.split(', then ') : /^shifted/.test(s) ? ['', s] : [s, ''];
  for (const part of pre ? pre.split(' and ') : []) {
    let m;
    if (part === 'reflected over the x-axis') a = -a;
    else if ((m = /^(stretched|shrunk) vertically by a factor of (\S+)$/.exec(part))) a *= num(m[2]);
    else throw new Error(`cannot read "${part}"`);
  }
  if (post) {
    const m = /^shifted (.+)$/.exec(post);
    if (!m) throw new Error(`cannot read "${post}"`);
    for (const part of m[1].split(' and ')) {
      const w = /^(right|left|up|down) (\d+)$/.exec(part);
      if (!w) throw new Error(`cannot read "${part}"`);
      const v = +w[2];
      if (w[1] === 'right') h += v; else if (w[1] === 'left') h -= v; else if (w[1] === 'up') k += v; else k -= v;
    }
  }
  return { a, h, k };
}
/** Same function on a spread of points (NaN where either is undefined must match). */
function sameFunc(f, g) {
  for (let i = -48; i <= 48; i++) {
    const x = i / 4 + 0.0137;
    let a, b;
    try { a = f(x); } catch { a = NaN; }
    try { b = g(x); } catch { b = NaN; }
    const fa = Number.isFinite(a), fb = Number.isFinite(b);
    if (fa !== fb) return false;
    if (fa && Math.abs(a - b) > 1e-7 * Math.max(1, Math.abs(b))) return false;
  }
  return true;
}
/** An equation "y = …" (or "f(x) = …") as a function of x, read with ev. */
const eqFn = (s) => { const t = String(s).replace(/^\s*(y|[a-z]\(x\))\s*=\s*/, ''); ev(t, { x: 0.5 }); return (x) => ev(t, { x }); };
/** ASCII forms of y = a·f(x − h) + k for the typed-equivalence tests. */
function famAscii(parent, a, h, k, style = 0) {
  const inner = h ? `x ${h > 0 ? '-' : '+'} ${Math.abs(h)}` : 'x';
  const tight = inner.replace(/\s+/g, '');
  const body = parent === 'x²' ? (h ? [`(${inner})^2`, `(${tight})²`, `(${inner})**2`][style % 3] : ['x^2', 'x²', 'x**2'][style % 3])
    : parent === '|x|' ? [`|${inner}|`, `abs(${tight})`, `| ${inner} |`][style % 3]
      : parent === '√x' ? [`sqrt(${inner})`, `√(${tight})`, `sqrt(${tight})`][style % 3]
        : `2^(${inner})`;
  const A = a === 1 ? '' : a === -1 ? '-' : Number.isInteger(a) ? String(a) : `(${fracText(a)})`;
  const K = k ? ` ${k < 0 ? '-' : '+'} ${Math.abs(k)}` : '';
  return { std: `y = ${A}${body}${K}`, kFirst: k ? `y = ${k} + ${a === -1 ? '-' : A}${body}`.replace('+ -', '- ') : `y = ${A}${body}` };
}
/** Real roots (≤ degree 2) of a polynomial given low → high. */
function polyRoots(c) {
  const t = c.slice(); while (t.length > 1 && Math.abs(t[t.length - 1]) < 1e-7) t.pop();
  if (t.length === 1) return Math.abs(t[0]) < 1e-9 ? null : [];
  if (t.length === 2) return [-t[0] / t[1]];
  if (t.length === 3) { const [C, B, A] = t; const D = B * B - 4 * A * C; if (D < -1e-9) return []; const s = Math.sqrt(Math.max(0, D)); return [...new Set([(-B - s) / (2 * A), (-B + s) / (2 * A)].map((v) => Math.round(v * 1e9) / 1e9))]; }
  throw new Error(`degree ${t.length - 1} is too high`);
}
/** Polynomial coefficients through samples at chosen xs (exact solve). */
function fitAt(f, xs) {
  const deg = xs.length - 1;
  const A = xs.map((x) => [...Array.from({ length: deg + 1 }, (_, k) => x ** k), f(x)]);
  for (let c = 0; c <= deg; c++) {
    let piv = c; for (let r = c + 1; r <= deg; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
    [A[c], A[piv]] = [A[piv], A[c]];
    for (let r = 0; r <= deg; r++) if (r !== c) { const k = A[r][c] / A[c][c]; for (let j = c; j <= deg + 1; j++) A[r][j] -= k * A[c][j]; }
  }
  return A.map((row, i) => row[deg + 1] / row[i]).map((v) => (Math.abs(v - Math.round(v)) < 1e-6 ? Math.round(v) : v));
}
/** The cells of an Algebra Lab table figure: { xs, ys }. */
function readTable(html) {
  const rows = [...String(html).matchAll(/<tr>(.*?)<\/tr>/g)].map((m) => [...m[1].matchAll(/<td>([^<]*)<\/td>/g)].map((c) => num(c[1])));
  if (rows.length !== 2 || rows[0].length !== rows[1].length || rows[0].some((v) => !Number.isFinite(v))) throw new Error('cannot read the table');
  return { xs: rows[0], ys: rows[1] };
}
/** Splits "A/B" at its top-level slash. */
function splitFrac(s) {
  let dep = 0;
  for (let i = 0; i < s.length; i++) { const c = s[i]; if ('([|'.includes(c)) dep++; else if (')]'.includes(c)) dep--; else if (c === '/' && !dep) return [s.slice(0, i), s.slice(i + 1)]; }
  return null;
}
/** A graph judge's extra: every point "(a, b)" named in the worked steps lies on the drawn graph. */
function graphPointCheck(G) {
  return (stepList) => {
    let n = 0; const bad = [];
    // (interval notation such as "Range: (−3, 4)" is a set, not a point)
    for (const st of stepList) for (const f of st) for (const m of String(f).replace(/(Domain|[Rr]ange): [^;]*/g, '').matchAll(/\((−?[\d.]+), (−?[\d.]+)\)/g)) {
      const P = [num(m[1]), num(m[2])];
      n++;
      if (distToGraph(G, P) > 0.01) bad.push(`the worked steps name ${m[0]}, which is not on the graph`);
    }
    return [n, bad];
  };
}

Object.assign(J, {
  'graph-domain-range': (q) => {
    const G = readGraph(q.figure);
    const [D, R] = graphDomainRange(G);
    const read = (s) => { const m = /^Domain: (.+); range: (.+)$/.exec(s); return m ? [readSet(m[1], 'x'), readSet(m[2], 'y')] : [null, null]; };
    const pc = graphPointCheck(G);
    return {
      right: (s) => { const [a, b] = read(s); return sameSetI(a, D) && sameSetI(b, R); },
      ctx: { mode: 'numeric' },
      extra: (steps) => {
        const [n, bad] = pc(steps);
        // the two result lines must be this graph's domain and range
        const dl = steps.find(([, , r]) => /^Domain: /.test(r)), rl = steps.find(([, , r]) => /^Range: /.test(r));
        if (!dl || !sameSetI(readSet(dl[2].slice(8), 'x'), D)) bad.push(`the domain step "${dl && dl[2]}" is not the graph's domain`);
        if (!rl || !sameSetI(readSet(rl[2].slice(7), 'y'), R)) bad.push(`the range step "${rl && rl[2]}" is not the graph's range`);
        return [n + 2, bad];
      },
    };
  },
  'vertical-line': (q) => {
    const G = readGraph(q.figure);
    const fn = isFunctionGraph(G);
    return {
      right: (s) => {
        if (/^Yes — /.test(s)) return fn && /no vertical line crosses/.test(s);
        const m = /^No — the vertical line x = (\S+) crosses the graph more than once$/.exec(s);
        return !fn && !!m && crossings(G, num(m[1])) >= 2;
      },
      ctx: { mode: 'numeric' }, extra: graphPointCheck(G),
    };
  },
  'graph-slope': (q) => {
    const G = readGraph(q.figure);
    const L = readLine(G.curves[0]);
    if (!G.marks.every((p) => distToGraph(G, p) < 1e-3 && isLattice(p))) throw new Error('a marked point is off the line or off the grid');
    if (L.vertical) return { right: (s) => isUndef(s), eq: ['undefined', 'Undefined', 'no slope', 'm = undefined', 'the slope is undefined'], wrong: ['0', '1', 'infinity'], ctx: { mode: 'numeric' }, extra: graphPointCheck(G) };
    const v = Math.round(L.m * 1e9) / 1e9;
    return {
      right: (s) => !isUndef(s) && close(num(s), v),
      eq: [...numForms(v, '', true), `m = ${fracText(v)}`, `slope = ${fracText(v)}`, ...(v === 0 ? ['zero'] : [])],
      wrong: [...numWrong(v), ...(v ? [fracText(1 / v)] : []), 'undefined', ...roundedWrong(v)], mustNote: [...(v ? [fracText(1 / v)].filter((w) => !close(1 / v, v)) : []), ...roundedWrong(v)],
      ctx: { mode: 'numeric', vars: { m: v } }, extra: graphPointCheck(G),
    };
  },
  'graph-y-int': (q) => {
    const G = readGraph(q.figure);
    const { m, b } = readLine(G.curves[0]);
    const right = (s0) => { const s = s0.replace(/^\s*(the )?y-intercept (is |= |: |is at )?/i, ''); const p = pair(s); if (p) return close(p[0], 0) && close(p[1], b); return close(num(s.replace(/^\s*(b|y)\s*=\s*/, '')), b) && !/^\s*x\s*=/.test(s); };
    return {
      right,
      eq: [`(0, ${b})`, `(0,${b})`, ` ( 0 , ${fracText(b).replace('-', '−')} ) `, String(b), `b = ${b}`, `y = ${b}`, `y-intercept = ${b}`, `the y-intercept is (0, ${b})`, `y-intercept is ${b}`, `y-intercept: ${b}`, `The y-intercept is at (0, ${b}).`],
      wrong: [`(${b}, 0)`, `(0, ${b + 1})`, String(-b), `x = ${b}`, `(0, ${fracText(-b / m)})`].filter((w) => !right(w)),
      mustNote: [`(${b}, 0)`],
      ctx: { mode: 'solve', free: ['x', 'y'], sols: [{ x: 0, y: b }], isSol: (a) => close(a.x, 0) && close(a.y, b) }, extra: graphPointCheck(G),
    };
  },
  'graph-line-eq': (q) => {
    const G = readGraph(q.figure);
    const { m, b } = readLine(G.curves[0]);
    const j = lineJudge(m, b);
    const mt = fracText(m), mx = m === 1 ? 'x' : m === -1 ? '-x' : Number.isInteger(m) ? `${m}x` : `(${mt})x`;
    j.eq.push(`y = ${mx}${b ? ` ${b < 0 ? '−' : '+'} ${Math.abs(b)}` : ''}`, `f(x) = ${mx} + ${b}`.replace('+ -', '- '));
    if (!Number.isInteger(m)) j.eq.push(`y = ${mt}x + ${b}`.replace('+ -', '- '), `y=${mt}*x+${b}`.replace('+-', '-'));
    j.wrong.push(`y = ${fracText(-m)}x + ${b}`.replace('+ -', '- '), `y = ${mx} + ${b + 1}`.replace('+ -', '- '), `y - ${b} = ${mt}(x - 0)`.replace('- -', '+ '));
    j.mustNote = [`y = (${mt})(x - 1) + ${fracText(m + b)}`];
    j.wrong.push(j.mustNote[0]);
    j.ctx = { mode: 'solve', free: ['x', 'y'], vars: { m, b }, sols: [-3, 0, 2].map((x) => ({ x, y: m * x + b })), isSol: (a) => close(a.y, m * a.x + b), allSols: true };
    j.extra = graphPointCheck(G);
    return j;
  },
  'graph-system': (q) => {
    const G = readGraph(q.figure);
    if (G.curves.length !== 2) throw new Error('expected two lines');
    const [L1, L2] = G.curves.map(readLine);
    let x, y;
    if (L1.vertical || L2.vertical) { const V = L1.vertical ? L1 : L2, O = L1.vertical ? L2 : L1; x = V.x; y = O.m * x + O.b; }
    else { x = (L2.b - L1.b) / (L1.m - L2.m); y = L1.m * x + L1.b; }
    x = Math.round(x * 1e9) / 1e9; y = Math.round(y * 1e9) / 1e9;
    return {
      right: (s) => { const p = pair(s); return !!p && close(p[0], x) && close(p[1], y); },
      eq: [`(${x},${y})`, `( ${x} , ${y} )`, `x = ${x}, y = ${y}`, `x=${x} y=${y}`, `(${String(x).replace('-', '−')}, ${String(y).replace('-', '−')})`],
      wrong: [...(x !== y ? [`(${y}, ${x})`] : []), `(${x}, ${y + 1})`, ...(y ? [`(${x}, ${-y})`] : [])], mustNote: x !== y ? [`(${y}, ${x})`] : [],
      ctx: { mode: 'solve', free: ['x', 'y'], sols: [{ x, y }], isSol: (a) => close(a.x, x) && close(a.y, y) },
      extra: (steps) => {
        const [n, bad] = graphPointCheck(G)(steps);
        // A "Substitute x = a" step must actually put a in for x: its right side is
        // "c × a + b", "a + b" or "−a + b" — never "0 × 0" when a is not 0.
        let k = 0;
        for (const [w, mth] of steps) {
          const s = /Substitute x = (\S+)$/.exec(w);
          if (!s) continue;
          k++;
          const tok = s[1].startsWith('−') ? `(${s[1]})` : s[1];
          const rhs = String(mth).replace(/ ✓$/, '').split(' = ').slice(1).join(' = ');
          if (!new RegExp(`^(?:.+ × |−)?${esc(tok)}(?: [+−] [\\d/]+)?$`).test(rhs)) bad.push(`"${w}" is followed by "${mth}", which does not put x = ${s[1]} in`);
        }
        if (k !== 2) bad.push(`expected a substitution check on each line, found ${k}`);
        return [n + k, bad];
      },
    };
  },
  'graph-parabola': (q) => {
    const G = readGraph(q.figure);
    const P = G.curves[0].pts.filter(isLattice);
    if (P.length < 3) throw new Error('a parabola with fewer than three lattice points');
    const [c0, c1, c2] = fitAt((x) => P.find((p) => p[0] === x)[1], [P[0][0], P[Math.floor(P.length / 2)][0], P[P.length - 1][0]]);
    if (!G.curves[0].pts.every(([x, y]) => Math.abs(c0 + c1 * x + c2 * x * x - y) < 3e-3)) throw new Error('the curve is not one parabola');
    const h = -c1 / (2 * c2), k = c0 + c1 * h + c2 * h * h, D = c1 * c1 - 4 * c2 * c0;
    const pc = graphPointCheck(G);
    const ctx = { mode: 'numeric' };
    if (/vertex/.test(q.text)) return { right: (s) => { const p = pair(s); return !!p && close(p[0], h) && close(p[1], k); }, eq: [`(${h},${k})`, `( ${h} , ${k} )`, `x = ${h}, y = ${k}`], wrong: [`(${k}, ${h})`, `(${-h || 1}, ${k})`, `(${h}, ${k + 1})`], ctx, extra: pc };
    if (/axis of symmetry/.test(q.text)) return { right: (s) => { const m = /^x = (\S+)$/.exec(s); return !!m && close(num(m[1]), h); }, eq: [`x = ${h}`, `x=${h}`, String(h), ` x = ${String(h).replace('-', '−')} `], wrong: [`y = ${h}`, `x = ${h + 1}`, `x = ${k === h ? h - 1 : k}`], mustNote: [`y = ${h}`], ctx, extra: pc };
    const rs = D < -1e-9 ? [] : [...new Set([(-c1 - Math.sqrt(Math.max(0, D))) / (2 * c2), (-c1 + Math.sqrt(Math.max(0, D))) / (2 * c2)].map((v) => Math.round(v * 1e9) / 1e9))].sort((a, b) => a - b);
    const j = rootsJudge(rs, (x) => c0 + c1 * x + c2 * x * x);
    if (!rs.length) j.right = (s) => /^\s*no (real )?(zeros|solutions?)\s*$/i.test(s);
    else { const r0 = j.right; j.right = (s) => r0(s.replace(/^\s*(the )?(zeros|x-intercepts)( are|:)\s*/i, '').replace(/\.$/, '')); }
    if (rs.length) j.eq.push(rs.map((r) => `(${r}, 0)`).join(', '), rs.map((r) => `(${r},0)`).join(' and '), `x-intercepts: ${rs.join(', ')}`, `The zeros are ${rs.join(' and ')}.`);
    else j.eq.push('no zeros', 'No real zeros', 'there are none');
    if (rs.length && rs[0]) { j.wrong.push(`(0, ${rs[0]})`); j.mustNote.push(`(0, ${rs[0]})`); }
    j.ctx = ctx; j.extra = pc;
    return j;
  },
  'parent-func': (q) => {
    const G = readGraph(q.figure);
    if (G.curves.length !== 1) throw new Error('expected one curve');
    const fits = classifyCurve(G);
    if (fits.length !== 1) throw new Error(`the curve fits ${fits.length ? fits.join(' and ') : 'no family'}`);
    return { right: (s) => s === FAMNAME[fits[0]], ctx: { mode: 'numeric' }, extra: graphPointCheck(G) };
  },
  'transform-desc': (q) => {
    const m = /^How is the graph of y = (.+) related to the graph of its parent function, y = (.+)\?$/.exec(q.text);
    const f = PARENT[m[2]], target = (x) => ev(m[1], { x });
    const right = (s) => { const d = readDesc(s); return !!d && sameFunc((x) => d.a * f(x - d.h) + d.k, target); };
    // a, h and k of the equation, found from the function itself.
    let h;
    if (m[2] === '√x') { h = -20; while (!Number.isFinite(target(h + 1e-9)) && h < 20) h += 1; }
    else if (m[2] === 'x²') { const [, b1, a2] = fit((x) => target(x), 2); h = -b1 / (2 * a2); }
    else { for (h = -20; h <= 20; h++) if (Math.abs(target(h - 1) + target(h + 1) - 2 * target(h)) > 1e-9) break; }
    const k = target(h), a = (target(h + 1) - k) / f(1);
    return { right, ctx: { mode: 'numeric', vars: { a, h, k } } };
  },
  'transform-write': (q) => {
    const m = /^The graph of y = (.+?) is (.+)\. Write an equation for the new graph\.$/.exec(q.text);
    const f = PARENT[m[1]];
    const { a, h, k } = readPhrase(m[2]);
    const target = (x) => a * f(x - h) + k;
    const right = (s) => { try { return sameFunc(eqFn(s.replace(/ˣ/g, '^(x)')), target); } catch { return false; } };
    const eq = [0, 1, 2].flatMap((st) => { const F_ = famAscii(m[1], a, h, k, st); return [F_.std, F_.kFirst]; });
    eq.push(q.answer.replace(/−/g, '-').replace(/\s+/g, ''), q.answer.replace(/^y = /, 'f(x) = '), q.answer.replace(/^y = /, ''));
    if (Math.abs(a) === 0.5) eq.push(famAscii(m[1], a, h, k).std.replace('(-1/2)', '-½').replace('(1/2)', '½'));
    const wrong = [];
    const mustNote = [];
    if (h) { const w = famAscii(m[1], a, -h, k).std; wrong.push(w); mustNote.push(w); }
    if (k) { const w = famAscii(m[1], a, h, -k).std; wrong.push(w); mustNote.push(w); }
    if (a !== 1) { const w = famAscii(m[1], 1, h, k).std; wrong.push(w); mustNote.push(w); }
    wrong.push(famAscii(m[1], a, h, k + 1).std, 'y = x');
    return {
      right, eq, wrong, mustNote, ctx: { mode: 'numeric' },
      extra: (steps) => { const last = steps[steps.length - 1][1]; let ok = false; try { ok = sameFunc(eqFn(last), target); } catch { ok = false; } return [1, ok ? [] : [`the final step "${last}" is not the described graph`]]; },
    };
  },
  'abs-vertex': (q) => {
    const e = /^What is the vertex of the graph of y = (.+)\?$/.exec(q.text)[1];
    const f = (x) => ev(e, { x });
    let h = null;
    for (let x = -20; x <= 20; x += 0.5) if (Math.abs(f(x - 0.5) + f(x + 0.5) - 2 * f(x)) > 1e-9) { h = x; break; }
    if (h == null) throw new Error('no corner found');
    const k = f(h);
    return {
      right: (s) => { const p = pair(s); return !!p && close(p[0], h) && close(p[1], k); },
      eq: [`(${h},${k})`, ` ( ${h} , ${k} ) `, `(${String(h).replace('-', '−')}, ${String(k).replace('-', '−')})`, `x = ${h}, y = ${k}`],
      wrong: [...(h ? [`(${-h}, ${k})`] : []), ...(h !== k ? [`(${k}, ${h})`] : []), `(${h}, ${k + 1})`], mustNote: h !== k ? [`(${k}, ${h})`] : [],
      ctx: { mode: 'solve', free: ['x', 'y'], vars: { h, k }, sols: [-2, 0, 1, 3].map((d) => ({ x: h + d, y: f(h + d) })), isSol: (p) => close(p.y, f(p.x)), allSols: true },
    };
  },
  piecewise: (q) => {
    const m = /^f\(x\) = (.+)\. Find f\((\S+)\)\.$/.exec(q.text);
    const x = num(m[2]);
    const pieces = m[1].split('; ').map((pc) => { const k = /^(.+) if (.+)$/.exec(pc); return { e: k[1], holds: logicTruth(k[2]) }; });
    const live = pieces.filter((pc) => pc.holds(x));
    if (live.length !== 1) throw new Error(`${live.length} pieces apply at x = ${x}`);
    // the pieces must not overlap anywhere, and must cover the line
    for (let t = -12; t <= 12; t += 0.25) if (pieces.filter((pc) => pc.holds(t)).length !== 1) throw new Error(`pieces overlap or leave a gap at x = ${t}`);
    const v = ev(live[0].e, { x });
    const j = numJudge(v, { xform: false, exact: true });
    j.ctx = { mode: 'identity', free: [], names: { [`f(${m[2]})`]: v }, target: () => v };
    return j;
  },
  'step-func': (q) => {
    let m = /^Evaluate (⌊.+⌋), where ⌊x⌋ is the greatest integer less than or equal to x\.$/.exec(q.text), v, name;
    if (m) { v = ev(m[1]); name = m[1]; }
    else { m = /^f\(x\) = (.+), where ⌊x⌋ is the greatest integer less than or equal to x\. Find f\((\S+)\)\.$/.exec(q.text); v = ev(m[1], { x: num(m[2]) }); name = `f(${m[2]})`; }
    const j = numJudge(v, { xform: false, exact: true });
    j.ctx = { mode: 'identity', free: [], names: { [name]: v }, target: () => v };
    return j;
  },
  'avg-rate': (q) => {
    let f, p, r;
    let m = /of f\(x\) = (.+) from x = (\S+) to x = (\S+)\.$/.exec(q.text);
    if (m) { const e = m[1]; f = (x) => ev(e, { x }); p = num(m[2]); r = num(m[3]); }
    else {
      m = /from x = (\S+) to x = (\S+)\.$/.exec(q.text);
      const T = readTable(q.figure);
      f = (x) => { const i = T.xs.findIndex((t) => close(t, x)); if (i < 0) throw new Error(`x = ${x} is not in the table`); return T.ys[i]; };
      p = num(m[1]); r = num(m[2]);
    }
    const v = (f(r) - f(p)) / (r - p);
    const j = numJudge(v, { xform: false, exact: true });
    j.ctx = { mode: 'identity', free: [], names: { [`f(${fmtNum(p)})`]: f(p), [`f(${fmtNum(r)})`]: f(r) }, target: () => v };
    return j;
  },
  'table-model': (q) => {
    const { xs, ys } = readTable(q.figure);
    if (!xs.every((x, i) => !i || close(x - xs[i - 1], 1))) throw new Error('x-values are not consecutive');
    const d1 = ys.slice(1).map((y, i) => y - ys[i]), d2 = d1.slice(1).map((y, i) => y - d1[i]);
    const con = (a) => a.every((v) => close(v, a[0]));
    const rat = ys.every((y) => y) ? ys.slice(1).map((y, i) => y / ys[i]) : null;
    const kinds = [con(d1) && 'Linear', con(d2) && !con(d1) && 'Quadratic', rat && con(rat) && !close(rat[0], 1) && 'Exponential'].filter(Boolean);
    if (kinds.length !== 1) throw new Error(`table fits ${kinds.join(', ') || 'nothing'}`);
    return { right: (s) => s.startsWith(`${kinds[0]} — `), ctx: { mode: 'numeric' } };
  },
  'inverse-var': (q) => {
    const m = /y = (\S+) when x = (\S+)\. (?:Find y when x = (\S+)\.|What is the constant of variation, k\?)$/.exec(q.text);
    const k = num(m[1]) * num(m[2]);
    const v = m[3] ? k / num(m[3]) : k;
    const j = numJudge(v, { xform: false, exact: true, prefix: m[3] ? 'y = ' : 'k = ' });
    j.wrong.push(m[3] ? `x = ${fracText(v)}` : `y = ${fracText(v)}`, ...(m[3] ? [fracText(num(m[1]) * num(m[3]) / num(m[2]))] : [fracText(num(m[1]) / num(m[2]))]));
    j.wrong = j.wrong.filter((w) => !close(num(w), v) || /^[xy] =/.test(w));
    j.ctx = { mode: 'numeric', vars: { k } };
    return j;
  },
  excluded: (q) => {
    const e = /^Find all excluded values for (.+)\.$/.exec(q.text)[1];
    const [N, Dn] = splitFrac(e);
    const Df = (x) => ev(Dn, { x }), Nf = (x) => ev(N, { x });
    const rs = polyRoots(fit(Df, 2)).sort((a, b) => a - b);
    const nz_ = (polyRoots(fit(Nf, 2)) || []).filter((z) => !rs.some((r) => close(r, z)));
    const readList = (s) => String(s).replace(/≠|!=/g, '=').split(/,|\band\b|\bor\b/).map((t) => t.trim().replace(/^x\s*=\s*/, '')).filter(Boolean).map(num);
    const right = (s) => { const g = [...new Set(readList(s).map((v) => Math.round(v * 1e9) / 1e9))]; return g.length === rs.length && rs.every((r) => g.some((v) => close(v, r))); };
    const eq = [rs.join(', '), rs.slice().reverse().map((r) => `x != ${r}`).join(' and '), rs.map((r) => `x=${r}`).join(', '), rs.map((r) => `x ≠ ${String(r).replace('-', '−')}`).join(', '), `{${rs.join(', ')}}`, rs.join(' ')];
    const wrong = [rs.map((r) => -r).join(', ')].filter((w) => !rs.every((r) => rs.includes(-r)));
    const mustNote = [];
    if (rs.length > 1) { wrong.push(String(rs[0])); mustNote.push(String(rs[0])); }
    if (nz_.length) { const w = [...rs, ...nz_].join(', '); wrong.push(w); mustNote.push(w); wrong.push(nz_.join(', ')); }
    return { right, eq, wrong, mustNote, ctx: { mode: 'solve', free: ['x'], sols: rs.map((x) => ({ x })), isSol: (a) => Math.abs(Df(a.x)) < 1e-7 } };
  },
  'rat-simplify': (q) => { const e = q.text.replace('Simplify: ', ''); return { right: (s) => { try { return sameFunc(eqFn(s), (x) => ev(e, { x })); } catch { return false; } }, ctx: { mode: 'identity', free: ['x'], target: (a) => ev(e, a), targetNeedsVar: true } }; },
  'rat-muldiv': (q) => {
    const m = /^(Multiply|Divide): (.+) (·|÷) (.+)$/.exec(q.text);
    const unwrap = (s) => (/^\[.*\]$/.test(s) ? s.slice(1, -1) : s);
    if (!splitFrac(unwrap(m[2])) || !splitFrac(unwrap(m[4]))) throw new Error('each side should be one fraction');
    // The prompt is read exactly as printed, with the standard order of operations —
    // an unbracketed "A/B ÷ C/D" would mean ((A/B) ÷ C)/D and no longer match the key.
    const whole = q.text.replace(/^(Multiply|Divide): /, '');
    const T = (x) => ev(whole, { x });
    if (m[3] === '÷') { const L = (x) => ev(unwrap(m[2]), { x }), R = (x) => ev(unwrap(m[4]), { x }); if (!sameFunc(T, (x) => L(x) / R(x))) throw new Error('the printed division does not read as (first fraction) ÷ (second fraction) — bracket each fraction'); }
    return { right: (s) => { try { return sameFunc(eqFn(s), T); } catch { return false; } }, ctx: { mode: 'identity', free: ['x'], target: (a) => T(a.x), targetNeedsVar: true } };
  },
  'rat-addsub': (q) => { const e = q.text.replace(/^(Add|Subtract): /, ''); return { right: (s) => { try { return sameFunc(eqFn(s), (x) => ev(e, { x })); } catch { return false; } }, ctx: { mode: 'identity', free: ['x'], target: (a) => ev(e, a), targetNeedsVar: true } }; },
  'rat-eq': (q) => {
    const [L, R] = sides(q.text.replace('Solve: ', ''));
    const g = (x) => ev(L, { x }) - ev(R, { x });
    const poles = [];
    for (let p = -30; p <= 30; p++) if (!Number.isFinite(ev(L, { x: p })) || !Number.isFinite(ev(R, { x: p }))) poles.push(p);
    const h = (x) => g(x) * poles.reduce((acc, p) => acc * (x - p), 1);
    const c = fitAt(h, [0.31, 0.77, 1.43, 2.19]);
    const cands = polyRoots(c);
    if (!cands) throw new Error('identity');
    const valid = cands.filter((r) => !poles.some((p) => close(p, r))).sort((a, b) => a - b);
    const ext = cands.filter((r) => poles.some((p) => close(p, r)));
    const j = rootsJudge(valid, g);
    if (ext.length) { const w = [...valid, ...ext].map((r) => `x = ${fracText(r)}`).join(', '); j.wrong.push(w); j.mustNote.push(w); if (valid.length) { j.wrong.push(`x = ${ext[0]}`); j.mustNote.push(`x = ${ext[0]}`); } }
    // the cleared equation's steps hold at every algebraic candidate, extraneous ones included
    j.ctx = { mode: 'solve', free: ['x'], sols: cands.map((x) => ({ x })), isSol: (a) => cands.some((c) => close(a.x, c)) };
    return j;
  },
  'work-rate': (q) => {
    const t = q.text;
    const unit = /Answer in (hours|minutes)/.exec(t)[1], other = unit === 'hours' ? 'minutes' : 'hours';
    let v, m;
    if ((m = /alone in (\d+) (?:hours|minutes)\. .+ alone in (\d+) (?:hours|minutes)\./.exec(t))) v = 1 / (1 / +m[1] + 1 / +m[2]);
    else { m = /can .+ in ([\d.]+) (?:hours|minutes)\. .+ alone takes (\d+) /.exec(t); v = 1 / (1 / +m[1] - 1 / +m[2]); }
    v = Math.round(v * 1e9) / 1e9;
    const rounding = /nearest hundredth/.test(t);
    const right = (s) => {
      const k = new RegExp(`^(.+?)\\s*(${unit})?$`).exec(String(s).trim().replace(/^(about|≈|~)\s*/, ''));
      const x = num(k[1]);
      if (!Number.isFinite(x)) return false;
      if (close(x, v)) return true;
      const d = (/\.(\d+)$/.exec(k[1]) || [, ''])[1].length;
      return rounding && d >= 2 && Math.abs(x - v) <= 0.5 * 10 ** -d + 1e-12;
    };
    const eq = [fracText(v), `${fracText(v)} ${unit}`, `t = ${fracText(v)}`, ...(mixedText(v) ? [`${mixedText(v)} ${unit}`] : []), `${fracText(v)} ${unit === 'hours' ? 'hrs' : 'min'}`];
    if (!terminating(v)) eq.push(v.toFixed(2), `${v.toFixed(3)} ${unit}`, `about ${v.toFixed(2)} ${unit}`, `≈ ${v.toFixed(2)}`, `~${v.toFixed(2)} ${unit}`);
    else if (!Number.isInteger(v)) eq.push(String(v));
    const wrong = [`${fracText(v)} ${other}`, terminating(v) ? String(Math.round((v + 0.1) * 100) / 100) : (Math.round((v + 0.01) * 100) / 100).toFixed(2), String(Math.round(v * 2 + 1))];
    const mustNote = [`${fracText(v)} ${other}`];
    if (!terminating(v) && Math.abs(+v.toFixed(1) - v) < 0.06) { wrong.push(v.toFixed(1)); mustNote.push(v.toFixed(1)); }
    return { right, eq, wrong, mustNote, value: v, ctx: { mode: 'numeric', names: { t: v } } };
  },
});

/* ======================================================== text hygiene */
const BAD = [
  [/NaN/, 'NaN'], [/Infinity/, 'Infinity'], [/\bundefined\b/, 'undefined'], [/\bnull\b/, 'null'], [/\[object/, '[object'],
  [/\+ [-−]/, '"+ -"'], [/[-−] [-−]/, '"- -"'], [/(^|[^\d.])1x/, '"1x"'], [/(^|[^\d.])0x/, '"0x"'], [/[+−-] 0x/, '"+ 0x"'],
  [/[xy]¹(?![⁰¹²³⁴⁵⁶⁷⁸⁹])/, 'x¹'], [/\^1(?!\d)/, '^1'], [/[−-]0(?![.\d/])/, '−0'], [/\d\.\d{7,}/, 'float noise'], [/\d\.\d*(0000|9999)\d/, 'float noise'],
  [/(^|[^\d])1√/, '"1√"'], [/√1(?!\d)/, '√1'], [/(^|[\s(=,[])-\d/, 'an ASCII hyphen used as a minus sign'],
];
function hygiene(q) {
  const strings = [q.text, q.answer, ...(q.options || []), q.explanationText, q.figureAlt || '', q.format || '', q.hintText || ''];
  const out = [];
  for (const s of strings) {
    let t = String(s);
    if (q.skill === 'slope' || q.skill === 'graph-slope') t = t.replace(/\bundefined\b/g, 'UNDEF');
    for (const [re, name] of BAD) if (re.test(t)) out.push(`${name} in ${JSON.stringify(t.length > 160 ? t.slice(0, 160) + '…' : t)}`);
  }
  return out;
}

/* Checks for the skills added with the graph and unit 13–14 work:
   the hint shows a method, not the answer; the alt text describes the
   figure without stating the answer; and a numeric multiple-choice
   distractor is never within 1% of the right number. */
const NEW_SKILLS = new Set(['graph-domain-range', 'vertical-line', 'graph-slope', 'graph-y-int', 'graph-line-eq', 'graph-system', 'graph-parabola', 'parent-func', 'transform-desc', 'transform-write', 'abs-vertex', 'piecewise', 'step-func', 'avg-rate', 'table-model', 'inverse-var', 'excluded', 'rat-simplify', 'rat-muldiv', 'rat-addsub', 'rat-eq', 'work-rate']);
const plainNumber = (s) => /^\s*[−-]?[\d.,/]+\s*[a-z]*\s*$/i.test(String(s));
function giveaways(q) {
  const out = [];
  const a = String(q.answer);
  if (!q.hintText) out.push('no hint');
  else if (a.length >= 3 && q.hintText.includes(a)) out.push(`the hint gives the answer "${a}"`);
  if (q.figureAlt && !plainNumber(a) && q.figureAlt.toLowerCase().includes(a.toLowerCase())) out.push(`the alt text gives the answer "${a}"`);
  if (q.figure && !q.figureAlt) out.push('a figure without alt text');
  if (q.type === 'mc' && q.options && q.options.every(plainNumber)) {
    const val = (o) => num(String(o).replace(/\s*[a-z]+\s*$/i, ''));
    const r = val(a);
    for (const o of q.options) if (o !== a && Math.abs(val(o) - r) <= 0.01 * Math.max(Math.abs(r), 1e-9)) out.push(`distractor "${o}" is within 1% of the answer "${a}"`);
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
const skills = (await page.evaluate(() => window.CQAlgebra.skills)).filter((sk) => !ONLY.length || ONLY.includes(sk.id));
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
      if (j.extra) {
        let n = 0, b = [];
        try { [n, b] = j.extra(q.stepList); } catch (e) { b = [`could not be checked: ${e.message}`]; }
        row.steps += n;
        for (const x of b) fail(`${diff}: worked step: ${x} — in "${q.text}"`);
      }
      if (NEW_SKILLS.has(sk.id)) for (const x of giveaways(q)) fail(`${diff}: ${x} — in "${q.text}"`);
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
if (!ONLY.length) {
  const f = (keep.foil || []).find(({ q }) => q.stepList.some(([w]) => /^Inner/.test(w)));
  if (!f) selfTest.push('no FOIL problem to mutate');
  else {
    const steps = f.q.stepList.map(([w, m, r]) => (/^Inner/.test(w) ? [w, m.replace(/= (.+)$/, (all, rhs) => `= ${/x/.test(rhs) ? rhs.replace(/^(−?)(\d*)x/, (z, sg, d) => `${sg}${(+d || 1) + 1}x`) : '1x'}`), r] : [w, m, r]));
    if (!checkSteps(steps, f.ctx)[1].length) selfTest.push(`a miswritten FOIL Inner step was not caught: ${JSON.stringify(steps)}`);
  }
  // Graph steps: a point off the drawn lines, and a domain with the wrong bracket.
  const gs = (keep['graph-system'] || [])[0];
  if (gs) {
    const jj = J['graph-system'](gs.q);
    const steps = gs.q.stepList.map(([w, m, r]) => [w, m.replace(/^\((−?\d+), (−?\d+)\)$/, (all, x, y) => `(${x}, ${String(num(y) + 1).replace('-', '−')})`), r]);
    if (!jj.extra(steps)[1].length) selfTest.push(`a systems step naming a point off the lines was not caught: ${JSON.stringify(steps)}`);
  }
  // …and a check step that says "Substitute x = a" but writes "0 × 0 + b" (true arithmetic, wrong substitution).
  const gz = (keep['graph-system'] || []).find(({ q }) => q.stepList.some(([w]) => /Substitute x = (?!0$)\S+$/.test(w)));
  if (!gz) selfTest.push('no graph-system problem with a non-zero x to mutate');
  else {
    const jj = J['graph-system'](gz.q);
    const steps = gz.q.stepList.map(([w, m, r]) => (/Substitute x = /.test(w) ? [w, m.replace(/^(\S+) = .*$/, (all, y) => `${y} = 0 × 0 ${y.startsWith('−') ? '−' : '+'} ${y.replace('−', '')} ✓`), r] : [w, m, r]));
    if (!jj.extra(steps)[1].length) selfTest.push(`a systems check step that substitutes 0 instead of x was not caught: ${JSON.stringify(steps)}`);
  }
  const dr = (keep['graph-domain-range'] || []).find(({ q }) => q.stepList.some(([, , r]) => /^Domain: .*[[\]≤]/.test(r)));
  if (dr) {
    const jj = J['graph-domain-range'](dr.q);
    const steps = dr.q.stepList.map(([w, m, r]) => [w, m, /^Domain: /.test(r) ? r.replace(/≤|\[|\]/, (c) => ({ '≤': '<', '[': '(', ']': ')' }[c])) : r]);
    if (!jj.extra(steps)[1].length) selfTest.push(`a domain step with an endpoint wrongly left out was not caught: ${JSON.stringify(steps)}`);
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
console.log(`\nStep-checker self-test: ${ONLY.length ? 'skipped (--skills)' : selfTest.length ? 'FAILED' : 'a miswritten FOIL step, an unreversed inequality step, a systems step off the lines, a systems check that substitutes 0 for x and a domain step with the wrong bracket are all caught'}`);
if (problems.length || rows.some((r) => r.fails)) {
  console.log(`\n${rows.reduce((s, r) => s + r.fails, 0)} failure(s). First few:`);
  for (const p of problems.slice(0, 60)) console.log(`  ${p}`);
  process.exit(1);
}
const stepTotal = rows.reduce((s, r) => s + r.steps, 0);
console.log(`\nOK: ${total.toLocaleString()} problems across ${rows.length} skills — every answer independently confirmed, ${stepTotal.toLocaleString()} worked-step clauses checked.`);
