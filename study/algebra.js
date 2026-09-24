/* ==========================================================================
   Algebra Lab — unlimited, procedurally generated Algebra 1 practice with a
   worked solution for every problem. A fixed question bank runs out; a
   generated problem with its steps teaches the method.

   A StudyQuest plugin: it reaches the app only through window.CQ, and exposes
   window.CQAlgebra = { skills, generate, generateMC, current } for tests.
   ========================================================================== */
(() => {
'use strict';
const CQ = window.CQ;
if (!CQ) return;
const el = CQ.el;

/* ================================================================ numbers */
const M = '−';                                   // the minus sign we print
const RETRY = { retry: true };                        // thrown to re-roll a problem
const R = Math.random;
const ri = (lo, hi) => lo + Math.floor(R() * (hi - lo + 1));
const nz = (lo, hi) => { let v = 0; while (!v) v = ri(lo, hi); return v; };
const nzNot1 = (lo, hi) => { let v = 0; while (v === 0 || v === 1 || v === -1) v = ri(lo, hi); return v; };
const pick = (a) => a[Math.floor(R() * a.length)];
const coin = (p = 0.5) => R() < p;
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);
const isInt = Number.isInteger;
const need = (cond) => { if (!cond) throw RETRY; };
/** Rounds away binary noise (0.1 + 0.2) before anything is printed. */
const clean = (v) => { const r = Math.round(v * 1e9) / 1e9; return Object.is(r, -0) ? 0 : r; };
const numStr = (v) => String(clean(v));
const fmtN = (v) => { v = clean(v); return v < 0 ? M + numStr(-v) : numStr(v); };
/** A number that sits after an operator: negatives go in parentheses. */
const pn = (v) => (clean(v) < 0 ? `(${fmtN(v)})` : fmtN(v));
function commas(v, places = 0) {
  const s = Math.abs(v).toFixed(places);
  const [i, f] = s.split('.');
  return (v < 0 ? M : '') + i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (f ? '.' + f : '');
}
const near = (v, t) => Math.abs(v - t) <= 1e-9 * Math.max(1, Math.abs(t));

/* Fractions are { n, d } in lowest terms with d > 0. */
function F(n, d = 1) {
  if (!d) throw RETRY;
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d) || 1;
  return { n: n / g, d: d / g };
}
const fStr = (f) => (f.d === 1 ? fmtN(f.n) : `${f.n < 0 ? M : ''}${Math.abs(f.n)}/${f.d}`);
const fVal = (f) => f.n / f.d;
/** A value as a fraction when it is one with a small denominator ("−2/3"). */
function ratStr(v) {
  for (let d = 1; d <= 1000; d++) { const n = v * d; if (Math.abs(n - Math.round(n)) < 1e-9) return fStr(F(Math.round(n), d)); }
  return fmtN(Math.round(v * 1000) / 1000);
}
const fMul = (a, b) => F(a.n * b.n, a.d * b.d);
const fAdd = (a, b) => F(a.n * b.d + b.n * a.d, a.d * b.d);
const fPow = (a, k) => (k >= 0 ? F(a.n ** k, a.d ** k) : F(a.d ** -k, a.n ** -k));

const SUPS = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const SUBS = '₀₁₂₃₄₅₆₇₈₉';
const sup = (k) => String(k).replace(/-/g, '⁻').replace(/\d/g, (c) => SUPS[c]);
const sub = (k) => String(k).replace(/\d/g, (c) => SUBS[c]);
/** b to the n, leaving off an exponent of 1: powS(2, 1) = "2". */
const powS = (b, n) => (n === 1 ? String(b) : `${b}${sup(n)}`);
const ordinal = (n) => { const t = n % 100; return n + (t >= 11 && t <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th'); };

/* =========================================================== formatting
   tms([[coef, key], …]) prints a sum of terms: "3x² − x + 5". The key is the
   variable part ("x²", "xy", "" for a constant); a coefficient of 1 is left
   off a variable ("x", "−x", never "1x"), zero terms are skipped, and every
   negative is joined with " − " (never "+ −"). */
function tms(parts) {
  let s = '';
  for (const [c, key] of parts) {
    const v = clean(c);
    if (!v) continue;
    const abs = Math.abs(v);
    const body = key ? (abs === 1 ? '' : numStr(abs)) + key : numStr(abs);
    s += s ? (v < 0 ? ` ${M} ` : ' + ') + body : (v < 0 ? M : '') + body;
  }
  return s || '0';
}
const powKey = (v, k) => (k === 0 ? '' : k === 1 ? v : v + sup(k));
const mono = (c, key) => tms([[c, key]]);
const lin = (a, b, v = 'x') => tms([[a, v], [b, '']]);
/** cs[k] is the coefficient of x^k. */
const poly = (cs, v = 'x') => tms(cs.map((c, k) => [c, powKey(v, k)]).reverse());
/** Terms grouped for a "group like terms" step: [[c, key], …] per group. */
function groupShow(groups) {
  let s = '';
  for (const g of groups) {
    const live = g.filter(([c]) => clean(c));
    if (!live.length) continue;
    if (live.length > 1) { s += (s ? ' + ' : '') + `(${tms(live)})`; continue; }
    const [c, key] = live[0];
    s += s ? (c < 0 ? ` ${M} ` : ' + ') + tms([[Math.abs(c), key]]) : tms([[c, key]]);
  }
  return s || '0';
}
/** "y = (1/2)x − 3" from fractions m and b. */
function lineStr(m, b) {
  if (m.n === 0) return `y = ${fStr(b)}`;
  const a = Math.abs(m.n);
  const coef = m.d === 1 ? (a === 1 ? '' : String(a)) : `(${a}/${m.d})`;
  let s = `y = ${m.n < 0 ? M : ''}${coef}x`;
  if (b.n) s += ` ${b.n < 0 ? M : '+'} ${fStr(F(Math.abs(b.n), b.d))}`;
  return s;
}
const eqStr = (a, b, c) => `${tms([[a, 'x'], [b, 'y']])} = ${fmtN(c)}`;

/* ================================================== worked-step display */
const S = (why, math, res) => ({ why, math, res });
function stepsNode(steps) {
  return el('ol', { class: 'alg-steps' }, ...steps.map((s) => el('li', {},
    el('span', { class: 'alg-why' }, s.why),
    s.math ? el('span', { class: 'alg-math' }, s.math) : null,
    s.res ? el('span', { class: 'alg-res' }, el('span', { 'aria-hidden': 'true' }, '→ '), s.res) : null,
  )));
}
const stepText = (s) => [s.why, s.math, s.res].filter(Boolean).join(' — ');

/* ======================================= arithmetic trees (order of ops)
   A small tree for printed arithmetic ("3 + 4 × (6 − 2)²") that can be
   reduced one operation at a time, in the order a student is taught:
   innermost parentheses, then exponents, × ÷ and + − left to right. */
function tparse(s) {
  const toks = s.match(/\d+|[−+×÷()]|[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g) || [];
  let p = 0;
  const peek = () => toks[p];
  function expr() {
    let n = term();
    while (peek() === '+' || peek() === '−') { const o = toks[p++]; n = { t: 'o', o, l: n, r: term() }; }
    return n;
  }
  function term() {
    let n = fac();
    while (peek() === '×' || peek() === '÷') { const o = toks[p++]; n = { t: 'o', o, l: n, r: fac() }; }
    return n;
  }
  function fac() {
    let n = prim();
    if (peek() && SUPS.includes(peek()[0])) {
      const e = Number([...toks[p++]].map((c) => SUPS.indexOf(c)).join(''));
      n = { t: 'o', o: '^', l: n, r: { t: 'n', v: e } };
    }
    return n;
  }
  function prim() {
    const k = toks[p++];
    if (k === '(') {
      const n = expr();
      if (toks[p++] !== ')') throw RETRY;
      if (n.t === 'o') n.par = true;
      return n;
    }
    if (k === '−') { const v = Number(toks[p++]); need(isFinite(v)); return { t: 'n', v: -v }; }
    const v = Number(k);
    need(isFinite(v));
    return { t: 'n', v };
  }
  const n = expr();
  need(p === toks.length);
  return n;
}
function tshow(n, lead = true, base = false) {
  if (n.t === 'n') return n.v < 0 && (!lead || base) ? `(${fmtN(n.v)})` : fmtN(n.v);
  const inner = n.par ? true : lead;
  const s = n.o === '^' ? tshow(n.l, inner, true) + sup(n.r.v) : `${tshow(n.l, inner)} ${n.o} ${tshow(n.r, false)}`;
  return n.par ? `(${s})` : s;
}
/** Every step of the evaluation, or null if a division isn't exact. */
function treduce(root, maxAbs = 5000) {
  const steps = [];
  let tree = root;
  const PREC = { '^': 3, '×': 2, '÷': 2, '+': 1, '−': 1 };
  for (let guard = 0; guard < 40 && tree.t !== 'n'; guard++) {
    let best = null, idx = 0;
    (function walk(n, depth, parent, key) {
      if (n.t === 'n') return;
      const dd = depth + (n.par ? 1 : 0);
      walk(n.l, dd, n, 'l');
      const me = idx++;
      if (n.l.t === 'n' && n.r.t === 'n') {
        const score = [dd, PREC[n.o], -me];
        if (!best || score[0] > best.score[0] || (score[0] === best.score[0] && (score[1] > best.score[1] || (score[1] === best.score[1] && score[2] > best.score[2])))) best = { n, parent, key, dd, score };
      }
      walk(n.r, dd, n, 'r');
    })(tree, 0, null, null);
    const { n } = best;
    const a = n.l.v, b = n.r.v;
    let v;
    if (n.o === '+') v = a + b;
    else if (n.o === '−') v = a - b;
    else if (n.o === '×') v = a * b;
    else if (n.o === '÷') { if (b === 0 || a % b !== 0) return null; v = a / b; }
    else v = a ** b;
    if (!isFinite(v) || Math.abs(v) > maxAbs) return null;
    const piece = n.o === '^' ? `${pn(a)}${sup(b)} = ${fmtN(v)}` : `${fmtN(a)} ${n.o} ${pn(b)} = ${fmtN(v)}`;
    const verb = { '+': 'Add', '−': 'Subtract', '×': 'Multiply', '÷': 'Divide', '^': 'Exponent' }[n.o];
    const num = { t: 'n', v };
    if (!best.parent) tree = num; else best.parent[best.key] = num;
    steps.push(S(best.dd > 0 ? `Parentheses first — ${verb.toLowerCase()}: ${piece}` : `${verb}: ${piece}`, tshow(tree)));
  }
  return tree.t === 'n' ? { value: tree.v, steps } : null;
}
/** The classic slip: every operation strictly left to right. */
function ltrEval(s) {
  const toks = s.match(/\d+|[−+×÷()]|[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g) || [];
  let p = 0;
  function seq() {
    let v = atom();
    while (p < toks.length && toks[p] !== ')') {
      const o = toks[p++]; const w = atom();
      v = o === '+' ? v + w : o === '−' ? v - w : o === '×' ? v * w : v / w;
    }
    return v;
  }
  function atom() {
    let v;
    const k = toks[p++];
    if (k === '(') { v = seq(); p++; } else if (k === '−') v = -Number(toks[p++]); else v = Number(k);
    if (p < toks.length && SUPS.includes(toks[p][0])) v **= Number([...toks[p++]].map((c) => SUPS.indexOf(c)).join(''));
    return v;
  }
  try { return seq(); } catch { return NaN; }
}
/** "3x² − 2y" with x = −2, y = 5 → "3 × (−2)² − 2 × 5". */
function subst(disp, vals) {
  return disp
    .replace(new RegExp(`([0-9a-z)${SUPS}])(?=[a-z(])`, 'g'), '$1 × ')
    .replace(/[a-z]/g, (v) => pn(vals[v]));
}

/* ================================================= reading typed answers */
const SUP_IN = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-' };
function prep(s) {
  return String(s ?? '').toLowerCase()
    .replace(/[−‒–—﹣－]/g, '-')
    .replace(/[×·•∙⋅✕]/g, '*').replace(/÷/g, '/')
    .replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (m) => '^' + (m.length > 1 ? `(${[...m].map((c) => SUP_IN[c]).join('')})` : SUP_IN[m]))
    .replace(/\*\*/g, '^')
    .replace(/\s+/g, ' ')
    .trim();
}
/* A polynomial expression in one variable → a tree. Accepts implicit
   multiplication (3x, 2(x + 1), (x + 1)(x − 2)), x^2 or x², any spacing. */
function parseExpr(str, v = 'x') {
  const s = prep(str);
  const toks = [];
  for (let i = 0; i < s.length;) {
    const c = s[i];
    if (c === ' ') { i++; continue; }
    const m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i));
    if (m) { toks.push({ t: 'n', v: parseFloat(m[1]) }); i += m[1].length; continue; }
    if (c === v) { toks.push({ t: 'v' }); i++; continue; }
    if ('+-*/^()'.includes(c)) { toks.push({ t: c }); i++; continue; }
    if ('[{'.includes(c)) { toks.push({ t: '(' }); i++; continue; }
    if (']}'.includes(c)) { toks.push({ t: ')' }); i++; continue; }
    throw new Error(`unexpected "${c}"`);
  }
  let p = 0;
  const peek = () => toks[p];
  const eat = (t) => (toks[p] && toks[p].t === t ? (p++, true) : false);
  function expr() {
    let n = term();
    for (;;) {
      if (eat('+')) n = { t: 'add', a: n, b: term() };
      else if (eat('-')) n = { t: 'sub', a: n, b: term() };
      else return n;
    }
  }
  function term() {
    let n = unary();
    for (;;) {
      const k = peek();
      if (!k) return n;
      if (k.t === '*') { p++; n = { t: 'mul', a: n, b: unary() }; }
      else if (k.t === '/') { p++; n = { t: 'div', a: n, b: unary() }; }
      else if (k.t === 'v' || k.t === '(') n = { t: 'mul', a: n, b: power() };
      else return n;
    }
  }
  function unary() {
    if (eat('-')) return { t: 'neg', a: unary() };
    if (eat('+')) return unary();
    return power();
  }
  function power() {
    const base = atom();
    if (eat('^')) {
      let e;
      if (eat('-')) e = { t: 'neg', a: atom() }; else e = atom();
      return { t: 'pow', a: base, e };
    }
    return base;
  }
  function atom() {
    const k = toks[p++];
    if (!k) throw new Error('ends too soon');
    if (k.t === 'n') return { t: 'n', v: k.v };
    if (k.t === 'v') return { t: 'v' };
    if (k.t === '(') { const n = expr(); if (!eat(')')) throw new Error('missing )'); return { t: 'par', a: n }; }
    throw new Error('unexpected symbol');
  }
  const tree = expr();
  if (p !== toks.length) throw new Error('extra symbols');
  return tree;
}
const ptrim = (p) => { const a = p.slice(); while (a.length > 1 && Math.abs(a[a.length - 1]) < 1e-12) a.pop(); return a; };
const padd = (a, b) => Array.from({ length: Math.max(a.length, b.length) }, (_, i) => (a[i] || 0) + (b[i] || 0));
const pscale = (a, k) => a.map((c) => c * k);
const pmul = (a, b) => { const o = new Array(a.length + b.length - 1).fill(0); a.forEach((x, i) => b.forEach((y, j) => { o[i + j] += x * y; })); return o; };
const peq = (a, b) => { const x = ptrim(a), y = ptrim(b); return x.length === y.length && x.every((c, i) => near(c, y[i])); };
function toPoly(n) {
  switch (n.t) {
    case 'n': return [n.v];
    case 'v': return [0, 1];
    case 'par': return toPoly(n.a);
    case 'neg': return pscale(toPoly(n.a), -1);
    case 'add': return padd(toPoly(n.a), toPoly(n.b));
    case 'sub': return padd(toPoly(n.a), pscale(toPoly(n.b), -1));
    case 'mul': return pmul(toPoly(n.a), toPoly(n.b));
    case 'div': {
      const d = ptrim(toPoly(n.b));
      if (d.length !== 1 || !d[0]) throw new Error('division by an expression');
      return pscale(toPoly(n.a), 1 / d[0]);
    }
    case 'pow': {
      const e = ptrim(toPoly(n.e));
      if (e.length !== 1 || !isInt(e[0]) || e[0] < 0 || e[0] > 12) throw new Error('bad exponent');
      let out = [1];
      const b = toPoly(n.a);
      for (let i = 0; i < e[0]; i++) out = pmul(out, b);
      return out;
    }
    default: throw new Error('bad node');
  }
}
function sumTerms(n, out = []) {
  if (n.t === 'add') { sumTerms(n.a, out); sumTerms(n.b, out); }
  else if (n.t === 'sub') { sumTerms(n.a, out); sumTerms(n.b, out); }
  else if (n.t === 'neg' && ['add', 'sub'].includes(n.a.t)) sumTerms(n.a, out);
  else out.push(n);
  return out;
}
function factorsOf(n, out = []) {
  if (n.t === 'mul') { factorsOf(n.a, out); factorsOf(n.b, out); }
  else if (n.t === 'par') factorsOf(n.a, out);
  else if (n.t === 'neg') { out.push({ t: 'n', v: -1 }); factorsOf(n.a, out); }
  else if (n.t === 'pow') {
    const e = ptrim(toPoly(n.e));
    const base = ptrim(toPoly(n.a));
    if (base.length > 1 && e.length === 1 && isInt(e[0]) && e[0] >= 1 && e[0] <= 6) for (let i = 0; i < e[0]; i++) factorsOf(n.a, out);
    else out.push(n);
  } else out.push(n);
  return out;
}
const intish = (c) => Math.abs(c - Math.round(c)) < 1e-9;
const isSquare = (n) => n >= 0 && Math.round(Math.sqrt(n)) ** 2 === n;
/** Shows a student's polynomial back to them; decimals rounded for display. */
const showPoly = (p) => poly(ptrim(p).map((c) => Math.round(c * 1000) / 1000));

/* Unit words a student may type after a number ("9 mg", "34 units",
   "13,781 people"). Never a single letter that could be a variable. */
const UNIT_RE = /(\d|\.)\s*(mg|milligrams?|grams?|kg|people|persons?|bacteria|cells|dollars?|usd|units?|cm|mm|km|meters?|metres?|inch(es)?|in|ft|feet|foot|yards?|yd|miles?|mi|hours?|hrs?|years?|yrs?|degrees?|points?|students?|cars?|dogs?|cats?|items?)\.?$/;
/** A single number: "5", "x = 5", "7 = x", "−3/4", "0.75", "25%", "$1,204.50", "8 1/2", "9 mg". */
function readNum(s, { v = null, percent = false, money = false } = {}) {
  let t = prep(s);
  if (percent) t = t.replace(/\s*(%|percent|pct)\.?$/, '');
  t = t.replace(UNIT_RE, '$1').trim();
  if (t === 'zero') return { v: 0, places: 0 };
  const eq = t.lastIndexOf('=');
  if (eq >= 0) {
    let lhs = t.slice(0, eq).replace(/\s+/g, ''), rhs = t.slice(eq + 1).trim();
    // "7 = x": the number on the left, the variable alone on the right.
    if (!/[a-z]/.test(lhs) && /^[a-z]$/.test(rhs)) { [lhs, rhs] = [rhs, lhs]; }
    if (!/[a-z]/.test(lhs)) return null;
    const label = /^(the)?([a-z])-?intercept(is)?$/.exec(lhs);
    if (label) lhs = label[2];
    if (v && !/[()]/.test(lhs) && lhs !== v) return null;
    t = rhs;
  }
  if (money) t = t.replace(/\$/g, '');
  // A mixed number, "8 1/2" or "−1 2/5", before the spaces go.
  const mixed = /^([+-]?)\s*(\d+)\s+(\d+)\s*\/\s*(\d+)$/.exec(t);
  if (mixed && +mixed[4] && +mixed[3] < +mixed[4]) {
    return { v: (mixed[1] === '-' ? -1 : 1) * (+mixed[2] + +mixed[3] / +mixed[4]), places: 0, frac: true };
  }
  t = t.replace(/\s+/g, '');
  // "(−14)": one pair of wrapping parentheses around a plain number.
  const wrap = /^\(([+-]?[\d.,]+)\)$/.exec(t);
  if (wrap) t = wrap[1];
  t = t.replace(/(\d),(?=\d{3}(?!\d))/g, '$1');
  let m = /^([+-]?)(\d+\.?\d*|\.\d+)$/.exec(t);
  if (m) {
    const val = parseFloat(m[2]) * (m[1] === '-' ? -1 : 1);
    return { v: val, places: (m[2].split('.')[1] || '').length, dec: m[2].includes('.') };
  }
  m = /^([+-]?)\(?([+-]?)(\d+)\/([+-]?)(\d+)\)?$/.exec(t);
  if (m && +m[5]) {
    const neg = [m[1], m[2], m[4]].filter((x) => x === '-').length % 2;
    return { v: (neg ? -1 : 1) * (+m[3] / +m[5]), places: 0, frac: true };
  }
  return null;
}
const no = (note) => ({ ok: false, note });
const terminates = (t) => near(Math.round(t * 1e6) / 1e6, t);
/** Exact value, or a decimal of 2+ places correctly rounded from a repeating one. */
function chkNum(target, opts = {}) {
  return (input) => {
    const r = readNum(input, opts);
    if (!r) return no(opts.say || 'Type a single number.');
    if (near(r.v, target)) return true;
    if (r.dec && r.places >= 2 && !terminates(target) && Math.abs(r.v - target) <= 0.5 * 10 ** -r.places + 1e-12) return true;
    return false;
  };
}
function readPair(s) {
  // "x = 5 and y = −1", "x = 5; y = −1", "x=5 y=-1", "(x, y) = (5, −1)".
  const t = prep(s).replace(/\band\b|;/g, ',').replace(/\s+/g, '')
    .replace(/^\(x,y\)=/, '')
    .replace(/([^,(])([xy]=)/g, '$1,$2');
  const lab = /^\(?([xy])=([^,()]+),([xy])=([^,()]+)\)?$/.exec(t);
  if (lab) {
    if (lab[1] === lab[3]) return null;
    const a = readNum(lab[2]), b = readNum(lab[4]);
    if (!a || !b) return null;
    return lab[1] === 'x' ? [a.v, b.v] : [b.v, a.v];
  }
  const m = /^\(([^,()]+),([^,()]+)\)$/.exec(t) || /^([^,()]+),([^,()]+)$/.exec(t);
  if (!m) return null;
  const a = readNum(m[1]), b = readNum(m[2]);
  return a && b ? [a.v, b.v] : null;
}
/** Numbers from a typed expression with √ and ±: "(3 ± √5)/2" → [2.618…, 0.381…]. */
function numEval(src) {
  const s = String(src).replace(/squareroot|sqrt|root/g, '√');
  const pm = s.indexOf('±');
  if (pm >= 0) {
    const a = numEval(`${s.slice(0, pm)}+${s.slice(pm + 1)}`), b = numEval(`${s.slice(0, pm)}-${s.slice(pm + 1)}`);
    return a && b ? [...a, ...b] : null;
  }
  const toks = s.match(/\d+\.?\d*|\.\d+|[-+*/^()√]|\S/g) || [];
  let p = 0;
  const is = (t) => toks[p] === t;
  function expr() { let v = term(); for (;;) { if (is('+')) { p++; v += term(); } else if (is('-')) { p++; v -= term(); } else return v; } }
  function term() {
    let v = unary();
    for (;;) {
      if (is('*')) { p++; v *= unary(); } else if (is('/')) { p++; v /= unary(); }
      else if (is('(') || is('√')) v *= power();
      else return v;
    }
  }
  function unary() { if (is('-')) { p++; return -unary(); } if (is('+')) { p++; return unary(); } return power(); }
  function power() { const b = atom(); if (is('^')) { p++; return b ** unary(); } return b; }
  function atom() {
    const k = toks[p++];
    if (k === undefined) throw RETRY;
    if (/^[\d.]/.test(k)) return parseFloat(k);
    if (k === '(') { const v = expr(); if (!is(')')) throw RETRY; p++; return v; }
    if (k === '√') { const v = atom(); if (v < 0) throw RETRY; return Math.sqrt(v); }
    throw RETRY;
  }
  try {
    const v = expr();
    return p === toks.length && Number.isFinite(v) ? [v] : null;
  } catch { return null; }
}
const NO_SOL = /^(no( real)? solutions?|none|no answer|∅|\{\s*\}|dne|empty( set)?)$/;
/**
 * Solutions typed as a list: "x = 2, x = −3", "2 or −3", "-9 9", "±9",
 * "x = (3 ± √5)/2", "0.67, −6". Each value keeps the decimal places typed
 * so a correctly rounded decimal can be accepted. [] means "no solution".
 */
function readRoots(s) {
  let t = prep(s).replace(/\.$/, '');
  if (NO_SOL.test(t.replace(/^[a-z]\s*=\s*/, ''))) return [];
  t = t.replace(/\b(or|and)\b/g, ',').replace(/[{};]/g, ',')
    .replace(/squareroot|sqrt|root/g, '√')
    .replace(/\+\s*\/\s*-|\+\s*-(?=\s*[\d(√.])|-\s*\+/g, '±')
    .replace(/\b[a-z]\s*=\s*/g, '');
  if (/[a-z]/.test(t.replace(UNIT_RE, '$1'))) return null;
  const out = [];
  for (let part of t.split(',').map((x) => x.trim()).filter(Boolean)) {
    // Close up spaces around operators; whatever spaces are left separate numbers.
    // "2 − 3" is an expression, but "2 -3" (and "-2 1/2") is two answers.
    part = part.replace(/\s*([*/^±])\s*/g, '$1').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')')
      .replace(/\s+([-+])\s+/g, '$1').replace(/([-+])\s+/g, '$1').replace(/\s+√/g, '√');
    for (const piece of part.split(/\s+/).filter(Boolean)) {
      const plain = readNum(piece);
      if (plain) { out.push(plain); continue; }
      const vals = numEval(piece);
      if (!vals) return null;
      for (const v of vals) out.push({ v, places: 0 });
    }
  }
  return out.length ? out : null;
}
function readRad(s) {
  const t = prep(s).replace(/\s+/g, '').replace(/\*/g, '').replace(/squareroot|sqrt|root|√/g, 'r');
  let m = /^([+-]?)(\d*)r\(?(\d+)\)?$/.exec(t);
  if (m) return { c: (m[1] === '-' ? -1 : 1) * (m[2] === '' ? 1 : +m[2]), r: +m[3] };
  m = /^([+-]?\d+)$/.exec(t);
  if (m) return { c: +m[1], r: 1 };
  return null;
}
function readIneq(s) {
  const t = prep(s).replace(/\s+/g, '')
    .replace(/≤|⩽|=<|<=/g, 'L').replace(/≥|⩾|=>|>=/g, 'G').replace(/</g, 'l').replace(/>/g, 'g');
  let m = /^x([lLgG])(.+)$/.exec(t), op, num;
  if (m) { op = m[1]; num = m[2]; }
  else if ((m = /^(.+)([lLgG])x$/.exec(t))) { op = { l: 'g', g: 'l', L: 'G', G: 'L' }[m[2]]; num = m[1]; }
  else return null;
  const r = readNum(num);
  return r ? { op: { l: '<', L: '≤', g: '>', G: '≥' }[op], v: r.v } : null;
}
function readLine(s) {
  const t = prep(s);
  const parts = t.split('=');
  let e;
  if (parts.length === 1) e = parts[0];
  else if (parts.length === 2) {
    const l = parts[0].trim(), r = parts[1].trim();
    if (/^(y|f\(x\))$/.test(l)) e = r;
    else if (r === 'y') e = l;
    else return null;
  } else return null;
  if (!e.trim() || /y/.test(e)) return null;
  try {
    const ast = parseExpr(e);
    const P = ptrim(toPoly(ast));
    return P.length > 2 ? null : { m: P[1] || 0, b: P[0] || 0, shaped: linShaped(ast) };
  } catch { return null; }
}
/** Parentheses around something with x in it: 2(x − 1). */
function varInParens(n) {
  if (!n || typeof n !== 'object') return false;
  if (n.t === 'par' && ptrim(toPoly(n.a)).length > 1) return true;
  return ['a', 'b', 'e'].some((k) => varInParens(n[k]));
}
/** "mx + b" with at most one x-term and one constant, no x inside parentheses. */
function linShaped(ast) {
  const seen = new Set();
  for (const t of sumTerms(ast)) {
    if (varInParens(t)) return false;
    const live = ptrim(toPoly(t)).map((c, i) => [c, i]).filter(([c]) => Math.abs(c) > 1e-12);
    if (live.length > 1) return false;
    if (!live.length) continue;
    if (seen.has(live[0][1])) return false;
    seen.add(live[0][1]);
  }
  return true;
}

/* ---- the checkers each skill hangs on q.check ---- */
/** y = mx + b, checked by comparing m and b, in slope-intercept shape. */
function chkSlopeInt(mv, bv) {
  return (input) => {
    const L = readLine(input);
    if (!L) return no('Write it as y = mx + b, like y = 2x − 3.');
    const okM = near(L.m, mv), okB = near(L.b, bv);
    if (okM && okB) return L.shaped ? true : no('That is the right line — now simplify it into slope-intercept form, y = mx + b.');
    if (okM) return no('The slope is right — check the y-intercept.');
    if (okB) return no('The y-intercept is right — check the slope.');
    return false;
  };
}
/** An expanded, simplified polynomial equal to target (no parentheses, like terms combined). */
function chkExpanded(target) {
  return (input) => {
    let ast, P;
    try { ast = parseExpr(input); P = toPoly(ast); } catch { return no('Type a polynomial in x, like 3x^2 − 5x + 2.'); }
    const same = peq(P, target);
    if (/[()]/.test(prep(input))) return same ? no('That has the right value, but multiply it all out — the answer should have no parentheses.') : false;
    const degs = new Set();
    for (const t of sumTerms(ast)) {
      const tp = ptrim(toPoly(t));
      const live = tp.map((c, i) => [c, i]).filter(([c]) => Math.abs(c) > 1e-12);
      if (live.length > 1) return same ? no('Right value, but combine like terms.') : false;
      if (!live.length) continue;
      if (degs.has(live[0][1])) return same ? no('Right value, but combine like terms.') : false;
      degs.add(live[0][1]);
    }
    return same;
  };
}
/** A product equal to target, factored completely over the integers. */
function chkFactored(target, example = '(x + 2)(x − 5)') {
  return (input) => {
    let ast, P;
    try { ast = parseExpr(input); P = toPoly(ast); } catch { return no(`Type a product like ${example}.`); }
    const same = peq(P, target);
    if (sumTerms(ast).length > 1) return same ? no(`That is still the expanded form — write it as a product, like ${example}.`) : no(`Write your answer as a product, like ${example}.`);
    if (!same) return no(`Multiply your factors back out: they make ${showPoly(P)}, not ${poly(target)}.`);
    for (const f of factorsOf(ast)) {
      const fp = ptrim(toPoly(f));
      if (fp.length === 1) continue;
      if (!fp.every(intish)) return no('Use whole-number coefficients inside each factor.');
      const g = fp.reduce((a, c) => gcd(a, Math.round(c)), 0);
      if (g > 1) return no('Not factored completely — one of your factors still has a common factor.');
      if (fp.length > 3) return no('Not factored completely — a factor can still be factored.');
      if (fp.length === 3) {
        const [c, b, a] = fp.map(Math.round);
        if (c === 0 || isSquare(b * b - 4 * a * c)) return no('Not factored completely — a factor can still be factored.');
      }
    }
    return true;
  };
}
function chkPair(x, y) {
  return (input) => {
    const p = readPair(input);
    if (!p) return no('Type an ordered pair like (2, −1).');
    if (near(p[0], x) && near(p[1], y)) return true;
    if (near(p[0], y) && near(p[1], x)) return no('Those are the right numbers in the wrong order — the x-value comes first.');
    return false;
  };
}
/** A typed value r matches w exactly, or as a decimal of 2+ places correctly rounded from w. */
const matches = (r, w) => near(r.v, w) || (!!r.dec && r.places >= 2 && !terminates(w) && Math.abs(r.v - w) <= 0.5 * 10 ** -r.places + 1e-12);
function chkRoots(roots, { example = 'x = 2, x = −3' } = {}) {
  const want = [...new Set(roots.map(clean))];
  return (input) => {
    const got = readRoots(input);
    if (!got) return no(`Type the solutions separated by a comma, like ${example}${want.length ? '' : ', or "no solution"'}.`);
    if (!want.length) return got.length ? false : true;
    if (!got.length) return no('There is a solution — look again.');
    const uniq = [];
    for (const g of got) if (!uniq.some((u) => near(u.v, g.v))) uniq.push(g);
    const allIn = uniq.every((g) => want.some((w) => matches(g, w)));
    const covers = want.every((w) => uniq.some((g) => matches(g, w)));
    if (allIn && covers) return true;
    if (allIn && !covers) return no(`That is only part of it — this equation has ${want.length} solutions.`);
    if (want.length === uniq.length && want.every((w) => uniq.some((g) => matches({ ...g, v: -g.v }, w)))) return no('Check the signs: if x + 2 = 0, then x = −2.');
    if (want.length === uniq.length && want.some((w) => !terminates(w)) && uniq.every((g) => want.some((w) => Math.abs(g.v - w) < 0.051))) return no('Close — round to at least two decimal places (hundredths), or give the exact answer.');
    return false;
  };
}
function chkRad(c, r) {
  return (input) => {
    const a = readRad(input);
    if (!a) return no('Type it like 6√2 (or 6sqrt2).');
    if (a.c === c && a.r === r) return true;
    if (Math.sign(a.c) === Math.sign(c) && a.c * a.c * a.r === c * c * r) return no('That is equal, but not fully simplified — take out the largest perfect square.');
    return false;
  };
}
function chkIneq(op, v, reversed) {
  return (input) => {
    const a = readIneq(input);
    if (!a) return no('Type it like x < 3 or x >= −2.');
    if (!near(a.v, v)) return false;
    if (a.op === op) return true;
    const dir = (o) => (o === '<' || o === '≤' ? -1 : 1);
    if (dir(a.op) !== dir(op)) return no(reversed ? 'Check the direction — dividing by a negative number reverses the inequality sign.' : 'Check the direction of the inequality sign — you only reverse it when you multiply or divide by a negative.');
    return no('Check whether the endpoint is included: < and > leave it out, ≤ and ≥ include it.');
  };
}

/* ================================================================ skills */
const SK = [];
const BY = {};
function skill(id, unit, name, label, gen) {
  const s = { id, unit, setId: `alg1-u${unit}`, name, label, gen };
  SK.push(s); BY[id] = s;
}
const FLIP = { '<': '>', '>': '<', '≤': '≥', '≥': '≤' };
const STRICT = { '<': '≤', '≤': '<', '>': '≥', '≥': '>' };
const xAns = (v) => `x = ${fmtN(v)}`;
const xAnsF = (f) => `x = ${fStr(f)}`;
const xAnsR = (v) => `x = ${ratStr(v)}`;

/**
 * Steps for ax + b [rel] cx + d, collecting x on the left.
 * Returns { steps, sol (fraction), rel (after any reversal) }.
 */
function linSolve(a, b, c, d, rel = '=', v = 'x') {
  const steps = [];
  let A = a, B = b, D = d;
  const L = (p, q) => lin(p, q, v);
  if (c) {
    const t = mono(Math.abs(c), v);
    steps.push(S(c > 0 ? `Subtract ${t} from both sides` : `Add ${t} to both sides`,
      `${L(A, B)} ${c > 0 ? M : '+'} ${t} ${rel} ${L(c, D)} ${c > 0 ? M : '+'} ${t}`,
      `${L(A - c, B)} ${rel} ${fmtN(D)}`));
    A -= c;
  }
  need(A !== 0);
  if (B) {
    steps.push(S(B > 0 ? `Subtract ${fmtN(B)} from both sides` : `Add ${fmtN(-B)} to both sides`,
      `${L(A, B)} ${B > 0 ? M : '+'} ${Math.abs(B)} ${rel} ${fmtN(D)} ${B > 0 ? M : '+'} ${Math.abs(B)}`,
      `${mono(A, v)} ${rel} ${fmtN(D - B)}`));
    D -= B; B = 0;
  }
  let r = rel;
  const sol = F(D, A);
  if (A !== 1) {
    const flip = A < 0 && rel !== '=';
    if (flip) r = FLIP[rel];
    // The reversed sign goes on this line, the one that divides: written with
    // the old sign, "−7x ÷ (−7) > −14 ÷ (−7)" would itself say x > 2.
    steps.push(S(`Divide both sides by ${fmtN(A)}${flip ? ` — dividing by a negative reverses the inequality sign, so ${rel} becomes ${r}` : ''}`,
      `${mono(A, v)} ÷ ${pn(A)} ${r} ${fmtN(D)} ÷ ${pn(A)}`,
      `${v} ${r} ${fStr(sol)}`));
  }
  return { steps, sol, rel: r };
}
/** Groups: { c, key } for a plain term, { a, p, q } for a(px + q). */
function showGroups(gs) {
  let s = '';
  gs.forEach((g) => {
    const c = g.a !== undefined ? g.a : g.c;
    if (!c) return;
    const abs = Math.abs(c);
    const body = g.a !== undefined ? `${abs === 1 ? '' : abs}(${lin(g.p, g.q)})` : (g.key ? (abs === 1 ? '' : numStr(abs)) + g.key : numStr(abs));
    s += s ? (c < 0 ? ` ${M} ` : ' + ') + body : (c < 0 ? M : '') + body;
  });
  return s || '0';
}
/** Terms after distributing, in order, and the combined [x-coef, constant]. */
function distribute(gs) {
  const list = [];
  for (const g of gs) {
    if (g.a !== undefined) list.push([g.a * g.p, 'x'], [g.a * g.q, '']);
    else list.push([g.c, g.key]);
  }
  const X = list.filter(([, k]) => k === 'x').reduce((s, [c]) => s + c, 0);
  const K = list.filter(([, k]) => k === '').reduce((s, [c]) => s + c, 0);
  return { list, X, K };
}
/** Distribute-and-combine steps for one side; returns the steps and its linear form. */
function simplifySide(gs, sideName) {
  const steps = [];
  const { list, X, K } = distribute(gs);
  const hasPar = gs.some((g) => g.a !== undefined);
  if (hasPar) {
    const which = gs.filter((g) => g.a !== undefined).map((g) => fmtN(g.a)).join(' and ');
    steps.push(S(`Distribute ${which} on the ${sideName}`, showGroups(gs), tms(list)));
  }
  const xs = list.filter(([c, k]) => k === 'x' && c).length, ks = list.filter(([c, k]) => k === '' && c).length;
  if (xs > 1 || ks > 1) steps.push(S(`Combine like terms on the ${sideName}`, groupShow([list.filter(([, k]) => k === 'x'), list.filter(([, k]) => k === '')]), lin(X, K)));
  return { steps, X, K };
}

/* ------------------------------------------------ Unit 1 · Foundations */
const OPS_T = {
  1: ['a + b × c', 'a × b − c', '(a + b) × c', 'a − b ÷ c', 'a × (b − c)', 'a + b²', 'a × b + c × e'],
  2: ['a + b × (c − e)', '(a + b)² − c', 'a² − b × c', '(a − b) × c + e', 'a + b² ÷ c', 'a × b ÷ c − e', 'a × (b + c)²'],
  3: ['a − b × (c + e)² ÷ f', '(a − b)² ÷ c + e × f', 'a × (b − c²) + e', 'a − (b − c) × e²', '(a + b × c) ÷ e − f'],
};
skill('order-ops', 1, 'Order of operations', 'Evaluate with the order of operations', (d) => {
  const T = pick(OPS_T[d]);
  const s = T.replace(/[abcef]/g, () => pn(d === 3 && coin(0.3) ? -ri(1, 9) : ri(d === 1 ? 1 : 2, d === 1 ? 10 : 12)));
  const red = treduce(tparse(s));
  need(red && isInt(red.value) && Math.abs(red.value) <= 999 && red.steps.length >= 2);
  const shown = tshow(tparse(s));
  const v = red.value;
  const ltr = ltrEval(s);
  return {
    type: 'written', text: `Evaluate: ${shown}`, fmt: 'Type a number, like 14 or −3.',
    answer: fmtN(v), check: chkNum(v), num: v, fmtAlt: fmtN,
    alt: [isInt(ltr) && ltr !== v ? fmtN(ltr) : null],
    steps: red.steps, data: { value: v, expr: shown },
  };
});

const EVAL_T = {
  1: [() => tms([[ri(2, 9), 'x'], [nz(-9, 9), '']]), () => tms([[ri(2, 9), 'x'], [-ri(2, 9), 'y']]), () => `${ri(2, 6)}(x + ${ri(1, 9)})`, () => tms([[ri(2, 5), 'x'], [ri(2, 5), 'y'], [nz(-9, 9), '']])],
  2: [() => tms([[ri(2, 5), 'x²'], [nz(-9, 9), 'y']]), () => `${ri(2, 6)}(x ${M} y)`, () => tms([[1, 'x²'], [-ri(2, 9), 'x'], [nz(-9, 9), '']]), () => tms([[ri(2, 6), 'xy'], [nz(-9, 9), '']])],
  3: [() => tms([[ri(2, 4), 'x²'], [-ri(2, 6), 'xy'], [ri(1, 5), 'y²']]), () => `(x ${M} y)² + ${ri(2, 6)}x`, () => tms([[ri(1, 3), 'x³'], [-ri(2, 9), 'x'], [nz(-9, 9), '']]), () => `${ri(2, 5)}(x + y)² ${M} x`],
};
skill('evaluate', 1, 'Evaluate expressions', 'Evaluate an expression for given values', (d) => {
  const disp = pick(EVAL_T[d])();
  const vals = { x: d === 1 ? ri(1, 9) : nz(-6, 8), y: d === 1 ? ri(1, 9) : nz(-6, 8) };
  const used = ['x', 'y'].filter((k) => disp.includes(k));
  const s = subst(disp, vals);
  const red = treduce(tparse(s));
  need(red && isInt(red.value) && Math.abs(red.value) <= 999);
  const asg = used.map((k) => `${k} = ${fmtN(vals[k])}`).join(' and ');
  const v = red.value;
  const ltr = ltrEval(s);
  return {
    type: 'written', text: `Evaluate ${disp} when ${asg}.`, fmt: 'Type a number.',
    answer: fmtN(v), check: chkNum(v), num: v, fmtAlt: fmtN,
    alt: [isInt(ltr) && ltr !== v ? fmtN(ltr) : null],
    steps: [S(`Substitute ${asg}`, tshow(tparse(s))), ...red.steps],
    data: { value: v, expr: disp, vars: Object.fromEntries(used.map((k) => [k, vals[k]])) },
  };
});

skill('like-terms', 1, 'Combine like terms', 'Combine like terms', (d) => {
  const keys = d === 1 ? ['x', 'y'] : d === 2 ? ['x', 'y', ''] : ['x²', 'x', ''];
  const list = [];
  for (const k of keys) {
    const n = k === '' ? (d === 3 ? 2 : 1) : 2;
    for (let i = 0; i < n; i++) list.push([d === 1 && coin(0.7) ? ri(1, 9) : nz(-9, 9), k]);
  }
  const terms = shuffle(list);
  need(terms[0][0] > 0);
  const sum = (lst) => { const m = {}; for (const [c, k] of lst) m[k] = (m[k] || 0) + c; return m; };
  const right = sum(terms);
  need(keys.every((k) => right[k]));
  const show = (m) => tms(keys.map((k) => [m[k] || 0, k]).concat(m.extra || []));
  const answer = show(right);
  const wrongs = [];
  // Treated a subtracted term as added.
  const negs = terms.map((t, i) => [t, i]).filter(([t, i]) => i > 0 && t[0] < 0);
  if (negs.length) { const [[c, k]] = pick(negs); const m = { ...right }; m[k] -= 2 * c; wrongs.push(show(m)); }
  // Combined unlike terms (x with y, or x² with x → x³).
  const vars = keys.filter(Boolean);
  const all = vars.reduce((s, k) => s + right[k], 0);
  if (all) wrongs.push(tms([[all, d === 3 ? 'x³' : 'xy'], [right[''] || 0, '']]));
  // Folded the constant into a variable term.
  if (right['']) { const m = { ...right }; m[vars[vars.length - 1]] += m['']; m[''] = 0; wrongs.push(show(m)); }
  // Added coefficients of every term of one kind with the signs dropped.
  const k0 = pick(vars); const abs = { ...right }; abs[k0] = terms.filter(([, k]) => k === k0).reduce((s, [c]) => s + Math.abs(c), 0); wrongs.push(show(abs));
  for (let i = 0; i < 6; i++) { const m = { ...right }; const k = pick(keys); m[k] += pick([-2, -1, 1, 2]); wrongs.push(show(m)); }
  const options = [answer, ...[...new Set(wrongs)].filter((w) => w !== answer && !/^0$/.test(w)).slice(0, 3)];
  need(options.length === 4);
  return {
    type: 'mc', text: `Simplify: ${tms(terms)}`, answer, options,
    steps: [
      S('Like terms have the same variable raised to the same power. Group them', groupShow(keys.map((k) => terms.filter(([, kk]) => kk === k)))),
      S('Add the coefficients in each group', answer),
    ],
    data: { terms, result: right },
  };
});

skill('distribute', 1, 'Distributive property', 'Use the distributive property', (d) => {
  let gs, alts = [];
  const a = nzNot1(-6, 6), b = ri(1, 5), c = nz(-9, 9);
  if (d === 1) {
    gs = [{ a, p: b, q: c }];
    alts = [lin(a * b, c), lin(a * b, -a * c), lin(b, a * c), lin(a + b, a * c)];
  } else if (d === 2) {
    const e = nz(-7, 7), f = nz(-9, 9);
    gs = [{ a, p: b, q: c }, { c: e, key: 'x' }, { c: f, key: '' }];
    alts = [lin(a * b + e, c + f), lin(a * b + e, -a * c + f), lin(a * b, a * c + f), lin(a * b + e, a * c)];
  } else {
    const e = -ri(2, 6), f = ri(1, 5), g = nz(-9, 9);
    gs = [{ a, p: b, q: c }, { a: e, p: f, q: g }];
    alts = [lin(a * b + e * f, a * c - e * g), lin(a * b + e * f, a * c + g), lin(a * b - e * f, a * c - e * g), lin(a * b + e * f, c + e * g)];
  }
  const { list, X, K } = distribute(gs);
  need(X);
  const answer = lin(X, K);
  const options = [answer, ...[...new Set(alts)].filter((w) => w !== answer)];
  for (let i = 0; options.length < 4 && i < 20; i++) { const w = lin(X + pick([-2, -1, 1, 2]), K + pick([-1, 0, 1])); if (!options.includes(w)) options.push(w); }
  const paren = gs.filter((g) => g.a !== undefined);
  const steps = paren.map((g) => S(`Multiply ${fmtN(g.a)} by each term inside the parentheses`,
    `${pn(g.a)} · ${mono(g.p, 'x')} = ${mono(g.a * g.p, 'x')} and ${pn(g.a)} · ${pn(g.q)} = ${fmtN(g.a * g.q)}`));
  steps.push(S('Write out every term', tms(list)));
  if (list.length > 2) steps.push(S('Combine like terms', groupShow([list.filter(([, k]) => k === 'x'), list.filter(([, k]) => k === '')]), answer));
  return { type: 'mc', text: `Simplify: ${showGroups(gs)}`, answer, options: options.slice(0, 4), steps, data: { x: X, c: K } };
});

/* ------------------------------------------ Unit 2 · Solving equations */
skill('one-step', 2, 'One-step equations', 'Solve one-step equations', (d) => {
  const form = pick(d === 1 ? ['add', 'mul'] : ['add', 'mul', 'div']);
  let x, eq, steps, alt;
  if (form === 'add') {
    x = d === 1 ? ri(1, 15) : nz(-15, 15);
    const a = d === 1 ? ri(1, 15) * (coin() ? 1 : -1) : nz(-20, 20);
    need(x + a !== 0 || d > 1);
    eq = `${lin(1, a)} = ${fmtN(x + a)}`;
    steps = [S(a > 0 ? `Subtract ${a} from both sides` : `Add ${-a} to both sides`,
      `${lin(1, a)} ${a > 0 ? M : '+'} ${Math.abs(a)} = ${fmtN(x + a)} ${a > 0 ? M : '+'} ${Math.abs(a)}`, xAns(x))];
    alt = [xAns(x + 2 * a), xAns(-x)];
  } else if (form === 'mul') {
    x = d === 1 ? ri(1, 12) : nz(-12, 12);
    const a = d === 1 ? ri(2, 9) : nzNot1(-9, 9);
    eq = `${mono(a, 'x')} = ${fmtN(a * x)}`;
    steps = [S(`Divide both sides by ${fmtN(a)}`, `${mono(a, 'x')} ÷ ${pn(a)} = ${fmtN(a * x)} ÷ ${pn(a)}`, xAns(x))];
    alt = [xAns(a * a * x), xAns(-x), xAns(a * x - a)];
  } else {
    const a = ri(2, 9), q = nz(-12, 12);
    x = a * q;
    eq = `x/${a} = ${fmtN(q)}`;
    steps = [S(`Multiply both sides by ${a}`, `(x/${a}) × ${a} = ${pn(q)} × ${a}`, xAns(x))];
    alt = [xAnsF(F(q, a)), xAns(-x), xAns(q + a)];
  }
  return { type: 'written', text: `Solve for x: ${eq}`, fmt: 'Type x = 5 (or just 5).', answer: xAns(x), check: chkNum(x, { v: 'x' }), num: x, fmtAlt: xAnsR, alt, steps, data: { x, eq } };
});

skill('two-step', 2, 'Two-step equations', 'Solve two-step equations', (d) => {
  const form = d === 1 ? 'axb' : d === 2 ? pick(['axb', 'axb', 'xa']) : pick(['axb', 'xa', 'bax']);
  let x, eq, steps, alt;
  if (form === 'axb') {
    const a = d === 1 ? ri(2, 9) : nzNot1(-9, 9), b = nz(-15, 15);
    x = d === 1 ? ri(1, 10) : nz(-10, 10);
    const c = a * x + b;
    eq = `${lin(a, b)} = ${fmtN(c)}`;
    steps = linSolve(a, b, 0, c).steps;
    alt = [xAnsF(F(c + b, a)), xAnsF(F(c, a)), xAns(-x)];
  } else if (form === 'xa') {
    const a = ri(2, 6), q = nz(-8, 8), b = nz(-12, 12);
    x = a * q;
    const c = q + b;
    eq = `x/${a} ${b < 0 ? M : '+'} ${Math.abs(b)} = ${fmtN(c)}`;
    steps = [
      S(b > 0 ? `Subtract ${b} from both sides` : `Add ${-b} to both sides`, `x/${a} ${b < 0 ? M : '+'} ${Math.abs(b)} ${b > 0 ? M : '+'} ${Math.abs(b)} = ${fmtN(c)} ${b > 0 ? M : '+'} ${Math.abs(b)}`, `x/${a} = ${fmtN(q)}`),
      S(`Multiply both sides by ${a}`, `(x/${a}) × ${a} = ${pn(q)} × ${a}`, xAns(x)),
    ];
    alt = [xAns((c + b) * a), xAns(c * a - b), xAnsF(F(q, a))];
  } else {
    const b = ri(2, 20), a = ri(2, 9);
    x = nz(-9, 9);
    const c = b - a * x;
    eq = `${b} ${M} ${mono(a, 'x')} = ${fmtN(c)}`;
    steps = [
      S(`Subtract ${b} from both sides`, `${b} ${M} ${mono(a, 'x')} ${M} ${b} = ${fmtN(c)} ${M} ${b}`, `${mono(-a, 'x')} = ${fmtN(c - b)}`),
      S(`Divide both sides by ${fmtN(-a)}`, `${mono(-a, 'x')} ÷ (${fmtN(-a)}) = ${fmtN(c - b)} ÷ (${fmtN(-a)})`, xAns(x)),
    ];
    alt = [xAns(-x), xAnsF(F(c - b, a)), xAnsF(F(c + b, -a))];
  }
  return { type: 'written', text: `Solve for x: ${eq}`, fmt: 'Type x = 5 (or just 5).', answer: xAns(x), check: chkNum(x, { v: 'x' }), num: x, fmtAlt: xAnsR, alt, steps, data: { x, eq } };
});

skill('multi-step', 2, 'Multi-step equations', 'Solve multi-step equations', (d) => {
  const x = d === 1 ? ri(1, 10) : nz(-10, 10);
  const a = d === 1 ? ri(2, 7) : nz(-8, 9), c = d === 1 ? ri(1, 6) : nz(-8, 8), b = nz(-12, 12), f = d === 1 ? 0 : nz(-12, 12);
  need(a > 0);
  const A = a + c, B = b + f;
  need(A !== 0 && B !== 0);
  const list = f ? [[a, 'x'], [b, ''], [c, 'x'], [f, '']] : [[a, 'x'], [b, ''], [c, 'x']];
  const e = A * x + B;
  const eq = `${tms(list)} = ${fmtN(e)}`;
  const steps = [S('Combine like terms on the left', groupShow([list.filter(([, k]) => k === 'x'), list.filter(([, k]) => k === '')]), `${lin(A, B)} = ${fmtN(e)}`), ...linSolve(A, B, 0, e).steps];
  const slip = c < 0 ? F(e - B, a - c) : F(e - B + 2 * Math.abs(f || 0), A);
  return { type: 'written', text: `Solve for x: ${eq}`, fmt: 'Type x = 5 (or just 5).', answer: xAns(x), check: chkNum(x, { v: 'x' }), num: x, fmtAlt: xAnsR, alt: [xAnsF(slip), xAnsF(F(e + B, A)), xAns(-x)], steps, data: { x, eq } };
});

skill('dist-eq', 2, 'Equations with parentheses', 'Solve equations using the distributive property', (d) => {
  const x = d === 1 ? ri(-5, 10) : nz(-10, 10);
  let gs;
  if (d === 1) gs = [{ a: ri(2, 9), p: 1, q: nz(-9, 9) }];
  else if (d === 2) gs = coin() ? [{ a: nzNot1(-6, 7), p: ri(1, 3), q: nz(-9, 9) }, { c: nz(-12, 12), key: '' }] : [{ a: ri(2, 6), p: 1, q: nz(-9, 9) }, { c: nz(-5, 5), key: 'x' }];
  else gs = [{ a: nzNot1(-6, 6), p: ri(1, 3), q: nz(-9, 9) }, { a: -ri(2, 5), p: 1, q: nz(-9, 9) }];
  const side = simplifySide(gs, 'left');
  need(side.X !== 0);
  const r = side.X * x + side.K;
  const eq = `${showGroups(gs)} = ${fmtN(r)}`;
  const g0 = gs[0];
  const steps = [...side.steps.map((s, i) => (i === side.steps.length - 1 ? { ...s, res: `${s.res} = ${fmtN(r)}` } : s)), ...linSolve(side.X, side.K, 0, r).steps];
  // Forgot to distribute to the second term inside the first parentheses.
  const forgot = F(r - (side.K - g0.a * g0.q + g0.q), side.X);
  return { type: 'written', text: `Solve for x: ${eq}`, fmt: 'Type x = 5 (or just 5).', answer: xAns(x), check: chkNum(x, { v: 'x' }), num: x, fmtAlt: xAnsR, alt: [xAnsF(forgot), xAns(-x), xAnsF(F(r + side.K, side.X))], steps, data: { x, eq } };
});

function bothSidesWritten(d) {
  const x = nz(-10, 10);
  let lg, rg;
  if (d === 1) { lg = [{ c: nz(-9, 9), key: 'x' }, { c: nz(-15, 15), key: '' }]; rg = [{ c: nz(-9, 9), key: 'x' }]; }
  else if (d === 2) { lg = [{ a: nzNot1(-6, 6), p: 1, q: nz(-9, 9) }]; rg = [{ c: nz(-9, 9), key: 'x' }]; }
  else { lg = [{ a: nzNot1(-5, 6), p: ri(1, 3), q: nz(-9, 9) }, { c: nz(-12, 12), key: '' }]; rg = [{ a: nzNot1(-5, 6), p: 1, q: nz(-9, 9) }]; }
  const L = simplifySide(lg, 'left');
  const R0 = distribute(rg);
  need(L.X !== R0.X);
  const t = L.X * x + L.K - (R0.X * x + R0.K);
  if (t) rg = [...rg, { c: t, key: '' }];
  const Rs = simplifySide(rg, 'right');
  need(Rs.X === R0.X && Rs.X !== 0);
  const eq = `${showGroups(lg)} = ${showGroups(rg)}`;
  const steps = [...L.steps, ...Rs.steps];
  if (steps.length) steps.push(S('The equation is now', `${lin(L.X, L.K)} = ${lin(Rs.X, Rs.K)}`));
  steps.push(...linSolve(L.X, L.K, Rs.X, Rs.K).steps);
  const slip = F(Rs.K - L.K, L.X + Rs.X);
  return { type: 'written', text: `Solve for x: ${eq}`, fmt: 'Type x = 5 (or just 5).', answer: xAns(x), check: chkNum(x, { v: 'x' }), num: x, fmtAlt: xAnsR, alt: [xAnsF(slip), xAns(-x), xAnsF(F(Rs.K + L.K, L.X - Rs.X))], steps, data: { x, eq, kind: 'one' } };
}
skill('both-sides', 2, 'Variables on both sides', 'Solve equations with variables on both sides', (d) => {
  if (!coin(0.35)) return bothSidesWritten(d);
  const kind = pick(['none', 'inf', 'one']);
  const opts = ['No solution', 'Infinitely many solutions'];
  if (kind === 'one') {
    const w = bothSidesWritten(d);
    const wrong = [...new Set(w.alt)].find((s) => s !== w.answer) || xAns(w.num + 1);
    return { ...w, type: 'mc', text: `Solve ${w.data.eq}. What do you find?`, options: [w.answer, ...opts, wrong], check: undefined };
  }
  const a = nzNot1(-6, 7), b = nz(-9, 9);
  const K = kind === 'inf' ? a * b : a * b + nz(-9, 9);
  const ex = nz(-4, 4);
  const lg = [{ a, p: 1, q: b }, { c: ex, key: 'x' }];
  const rg = coin() ? [{ c: a + ex, key: 'x' }, { c: K, key: '' }] : [{ c: K, key: '' }, { c: a + ex, key: 'x' }];
  need(a + ex !== 0);
  const eq = `${showGroups(lg)} = ${showGroups(rg)}`;
  const L = simplifySide(lg, 'left');
  const t = mono(Math.abs(a + ex), 'x');
  const steps = [...L.steps,
    S(a + ex > 0 ? `Subtract ${t} from both sides` : `Add ${t} to both sides`, `${lin(a + ex, a * b)} = ${lin(a + ex, K)}`, `${fmtN(a * b)} = ${fmtN(K)}`),
    kind === 'inf' ? S('The x-terms are gone and what is left is always true', `${fmtN(a * b)} = ${fmtN(K)} ✓`, 'Every value of x works: infinitely many solutions')
      : S('The x-terms are gone and what is left is never true', `${fmtN(a * b)} ≠ ${fmtN(K)}`, 'No value of x works: no solution'),
  ];
  const answer = kind === 'inf' ? opts[1] : opts[0];
  const w1 = 'x = 0', w2 = xAns(K - a * b || a);
  need(w1 !== w2);
  return { type: 'mc', text: `Solve ${eq}. What do you find?`, answer, options: [...opts, w1, w2], steps, data: { eq, kind } };
});

skill('proportion', 2, 'Proportions', 'Solve a proportion', (d) => {
  const form = d === 1 ? 'xa' : d === 2 ? pick(['xa', 'ax']) : pick(['ax', 'shift']);
  let p = ri(1, 9), q = ri(2, 9);
  const g = gcd(p, q); p /= g; q /= g;
  const s = ri(1, 6), t = ri(1, 6);
  need(s !== t && q > 1 && p * t > 1 && p * s > 1);
  let x, eq, steps, alt;
  if (form === 'xa') {
    x = p * s; const a = q * s, b = p * t, c = q * t;
    eq = `x/${a} = ${b}/${c}`;
    steps = [S('Cross-multiply', `x × ${c} = ${a} × ${b}`, `${mono(c, 'x')} = ${a * b}`), S(`Divide both sides by ${c}`, `${mono(c, 'x')} ÷ ${c} = ${a * b} ÷ ${c}`, xAns(x))];
    alt = [xAnsF(F(c * b, a)), xAnsF(F(a * c, b)), xAns(x + 1)];
  } else if (form === 'ax') {
    const a = p * s; x = q * s; const b = p * t, c = q * t;
    eq = `${a}/x = ${b}/${c}`;
    steps = [S('Cross-multiply', `${a} × ${c} = ${b} × x`, `${a * c} = ${mono(b, 'x')}`), S(`Divide both sides by ${b}`, `${a * c} ÷ ${b} = ${mono(b, 'x')} ÷ ${b}`, xAns(x))];
    alt = [xAnsF(F(a * b, c)), xAnsF(F(b * c, a)), xAns(x - 1)];
  } else {
    const a = nz(-9, 9); const top = p * s, b = q * s, c = p * t, dd = q * t;
    x = top - a;
    eq = `(${lin(1, a)})/${b} = ${c}/${dd}`;
    steps = [
      S('Cross-multiply', `${dd}(${lin(1, a)}) = ${b} × ${c}`, `${dd}(${lin(1, a)}) = ${b * c}`),
      S(`Divide both sides by ${dd}`, `${lin(1, a)} = ${b * c} ÷ ${dd}`, `${lin(1, a)} = ${top}`),
      S(a > 0 ? `Subtract ${a} from both sides` : `Add ${-a} to both sides`, `${lin(1, a)} ${a > 0 ? M : '+'} ${Math.abs(a)} = ${top} ${a > 0 ? M : '+'} ${Math.abs(a)}`, xAns(x)),
    ];
    alt = [xAns(top + a), xAns(top), xAns(-x)];
  }
  return { type: 'written', text: `Solve the proportion: ${eq}`, fmt: 'Type x = 12 (or just 12).', answer: xAns(x), check: chkNum(x, { v: 'x' }), num: x, fmtAlt: xAnsR, alt, steps, data: { x, eq } };
});

const dec = (v) => numStr(v);
skill('percent', 2, 'Percents', 'Find a percent of a number', (d) => {
  const form = d === 1 ? 'of' : d === 2 ? pick(['of', 'of', 'what']) : pick(['of', 'what', 'whole']);
  let text, answer, value, steps, alt, check, fmtAlt;
  const p = d === 1 ? pick([10, 20, 25, 50, 75]) : 5 * ri(1, 19);
  const n = d === 1 ? 20 * ri(1, 10) : 20 * ri(1, 15);
  const part = (p * n) / 100;
  need(isInt(part * 2));
  if (form === 'of') {
    value = part; answer = fmtN(part); fmtAlt = fmtN; check = chkNum(part);
    text = `What is ${p}% of ${n}?`;
    steps = [S('Change the percent to a decimal (divide by 100)', `${p}% = ${dec(p / 100)}`), S('Multiply', `${dec(p / 100)} × ${n} = ${fmtN(part)}`)];
    alt = [fmtN(p * n), fmtN(clean(n / p * 100) === clean(part) ? part + 1 : Math.round(n / p * 100) / 100), fmtN(n - part)];
  } else if (form === 'what') {
    need(isInt(part));
    value = p; answer = `${p}%`; fmtAlt = (v) => `${fmtN(v)}%`; check = chkNum(p, { percent: true });
    text = `${part} is what percent of ${n}?`;
    steps = [S('Divide the part by the whole', `${part} ÷ ${n} = ${dec(p / 100)}`), S('Change the decimal to a percent (multiply by 100)', `${dec(p / 100)} × 100 = ${p}`, `${p}%`)];
    alt = [`${dec(p / 100)}%`, `${Math.round((n / part) * 100)}%`, `${100 - p}%`];
  } else {
    need(isInt(part));
    value = n; answer = fmtN(n); fmtAlt = fmtN; check = chkNum(n);
    text = `${p}% of what number is ${part}?`;
    steps = [S('Write an equation with the percent as a decimal', `${dec(p / 100)} × n = ${part}`), S(`Divide both sides by ${dec(p / 100)}`, `n = ${part} ÷ ${dec(p / 100)}`, `n = ${n}`)];
    alt = [fmtN((p * part) / 100), fmtN(part * p), fmtN(n + part)];
  }
  return { type: 'written', text, fmt: form === 'what' ? 'Type a percent, like 25%.' : 'Type a number.', answer, check, num: value, fmtAlt, alt, steps, data: { value, form, p, n, part } };
});

/* -------------------------------------------------- Unit 3 · Inequalities */
skill('inequality', 3, 'Solve inequalities', 'Solve a linear inequality', (d) => {
  const rel = pick(['<', '≤', '>', '≥']);
  const x0 = nz(-9, 9);
  let lg, rg, text;
  if (d === 1) {
    if (coin()) { lg = [{ c: 1, key: 'x' }, { c: nz(-12, 12), key: '' }]; }
    else lg = [{ c: ri(2, 9), key: 'x' }];
    rg = [];
  } else if (d === 2) {
    lg = [{ c: coin(0.6) ? -ri(2, 9) : ri(2, 9), key: 'x' }, { c: nz(-12, 12), key: '' }];
    rg = [];
  } else if (coin()) {
    lg = [{ c: nz(-9, 9), key: 'x' }, { c: nz(-12, 12), key: '' }];
    rg = [{ c: nz(-9, 9), key: 'x' }];
  } else {
    lg = [{ a: -ri(2, 6), p: 1, q: nz(-9, 9) }];
    rg = [];
  }
  const L = simplifySide(lg, 'left');
  const R0 = distribute(rg);
  const k = L.X * x0 + L.K - (R0.X * x0 + R0.K);
  rg = [...rg, { c: k, key: '' }];
  const Rs = distribute(rg);
  need(L.X !== Rs.X);
  text = `Solve: ${showGroups(lg)} ${rel} ${showGroups(rg)}`;
  const solved = linSolve(L.X, L.K, Rs.X, Rs.K, rel);
  const fin = solved.rel;
  const reversed = fin !== rel;
  const steps = [...L.steps.map((s, i) => (i === L.steps.length - 1 ? { ...s, res: `${s.res} ${rel} ${showGroups(rg)}` } : s)), ...solved.steps];
  steps.push(S(`Check a number that fits, like x = ${fmtN(x0 + (fin === '<' || fin === '≤' ? -1 : 1))}: it makes the original inequality true`, `x ${fin} ${fmtN(x0)}`));
  const answer = `x ${fin} ${fmtN(x0)}`;
  const alt = [`x ${FLIP[fin]} ${fmtN(x0)}`, `x ${STRICT[fin]} ${fmtN(x0)}`, `x ${fin} ${fmtN(-x0)}`, `x ${FLIP[STRICT[fin]]} ${fmtN(x0)}`, `x ${fin} ${fmtN(x0 + 1)}`];
  return {
    type: 'written', text, fmt: 'Type it like x < 3 or x >= −2 (≤ and ≥ work too).',
    answer, check: chkIneq(fin, x0, reversed), alt, steps, data: { op: fin, value: x0, reversed },
  };
});

function numberLine(v, op) {
  const lo = v - 5, W = 340, X = (n) => 20 + (n - lo) * 30, y = 34;
  const closed = op === '≤' || op === '≥', right = op === '>' || op === '≥';
  let s = `<svg class="alg-nl" viewBox="0 0 ${W} 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`;
  s += `<line class="alg-axis" x1="6" y1="${y}" x2="${W - 6}" y2="${y}"/>`;
  s += `<path class="alg-axis-end" d="M6 ${y} l8 -5 v10 z M${W - 6} ${y} l-8 -5 v10 z"/>`;
  for (let n = lo; n <= v + 5; n++) {
    s += `<line class="alg-tick" x1="${X(n)}" y1="${y - 6}" x2="${X(n)}" y2="${y + 6}"/>`;
    s += `<text class="alg-label${n === v ? ' on' : ''}" x="${X(n)}" y="${y + 24}" text-anchor="middle">${fmtN(n)}</text>`;
  }
  const end = right ? W - 8 : 8;
  s += `<line class="alg-ray" x1="${X(v)}" y1="${y}" x2="${end}" y2="${y}"/>`;
  s += `<path class="alg-ray-end" d="M${end} ${y} l${right ? -12 : 12} -7 v14 z"/>`;
  s += `<circle class="alg-dot ${closed ? 'closed' : 'open'}" cx="${X(v)}" cy="${y}" r="7"/>`;
  return s + '</svg>';
}
skill('number-line', 3, 'Read a number line', 'Match a number-line graph to its inequality', (d) => {
  const v = d === 1 ? ri(-2, 6) : ri(-9, 9);
  const op = pick(['<', '≤', '>', '≥']);
  const closed = op === '≤' || op === '≥', right = op === '>' || op === '≥';
  const answer = `x ${op} ${fmtN(v)}`;
  return {
    type: 'mc', text: 'Which inequality does this number line show?', answer,
    options: ['<', '≤', '>', '≥'].map((o) => `x ${o} ${fmtN(v)}`),
    figure: numberLine(v, op),
    figureAlt: `Number line from ${fmtN(v - 5)} to ${fmtN(v + 5)} with ${closed ? 'a closed (filled-in) circle' : 'an open circle'} at ${fmtN(v)} and shading to the ${right ? 'right' : 'left'}.`,
    steps: [
      S(closed ? `The circle at ${fmtN(v)} is filled in (closed), so ${fmtN(v)} itself is included` : `The circle at ${fmtN(v)} is open, so ${fmtN(v)} itself is not included`, closed ? 'Use ≤ or ≥' : 'Use < or >'),
      S(`The shading goes to the ${right ? 'right, toward greater numbers' : 'left, toward smaller numbers'}`, answer),
    ],
    data: { value: v, op },
  };
});

/* ----------------------------------------------------- Unit 4 · Functions */
skill('f-of-x', 4, 'Evaluate functions', 'Evaluate a function', (d) => {
  let cs;
  if (d === 1) cs = [nz(-9, 9), nzNot1(-6, 6)];
  else if (d === 2) cs = coin() ? [nz(-9, 9), nz(-9, 9), 1] : [nz(-9, 9), nzNot1(-7, 7)];
  else cs = [nz(-9, 9), nz(-9, 9), pick([-3, -2, 2, 3])];
  const k = d === 1 ? ri(0, 6) : nz(-5, 6);
  const disp = poly(cs);
  const s = subst(disp, { x: k });
  const red = treduce(tparse(s));
  need(red && red.steps.length >= 1);
  const v = red.value;
  need(isInt(v) && Math.abs(v) < 1000);
  const slip = cs.length === 3 && k < 0 ? cs[2] * -(k * k) + cs[1] * k + cs[0] : null;
  const ltr = ltrEval(s);
  return {
    type: 'written', text: `If f(x) = ${disp}, find f(${fmtN(k)}).`, fmt: 'Type a number.',
    answer: fmtN(v), check: chkNum(v, { v: null }), num: v, fmtAlt: fmtN,
    alt: [slip != null && slip !== v ? fmtN(slip) : null, isInt(ltr) && ltr !== v ? fmtN(ltr) : null],
    steps: [S(`Replace every x with ${fmtN(k)}`, `f(${fmtN(k)}) = ${tshow(tparse(s))}`), ...red.steps],
    data: { value: v, coeffs: cs, input: k },
  };
});

skill('arith-seq', 4, 'Arithmetic sequences', 'Find a term of an arithmetic sequence', (d) => {
  const a1 = d === 1 ? ri(1, 20) : nz(-15, 25), dd = d === 1 ? ri(2, 9) : nz(-9, 9), n = ri(d === 1 ? 6 : 10, d === 3 ? 60 : 30);
  const an = a1 + (n - 1) * dd;
  const byFirst = d === 1 || coin(0.55);
  const seq = [0, 1, 2, 3].map((i) => fmtN(a1 + i * dd)).join(', ');
  const text = byFirst ? `What is the ${ordinal(n)} term of the arithmetic sequence ${seq}, …?` : `An arithmetic sequence has first term a₁ = ${fmtN(a1)} and common difference d = ${fmtN(dd)}. What is a${sub(n)}?`;
  const steps = [];
  if (byFirst) steps.push(S('Find the common difference: subtract any term from the next one', `d = ${fmtN(a1 + dd)} ${M} ${pn(a1)} = ${fmtN(dd)}`));
  steps.push(
    S('Use the formula for the nth term', 'aₙ = a₁ + (n − 1)d'),
    S(`Substitute a₁ = ${fmtN(a1)}, n = ${n} and d = ${fmtN(dd)}`, `a${sub(n)} = ${fmtN(a1)} + (${n} ${M} 1) × ${pn(dd)}`, `a${sub(n)} = ${fmtN(a1)} + ${n - 1} × ${pn(dd)}`),
    S('Multiply, then add', `${fmtN(a1)} + ${pn((n - 1) * dd)}`, `a${sub(n)} = ${fmtN(an)}`),
  );
  return {
    type: 'written', text, fmt: 'Type a number.', answer: fmtN(an), check: chkNum(an), num: an, fmtAlt: fmtN,
    alt: [fmtN(a1 + n * dd), fmtN(n * dd), fmtN(a1 + (n - 1) * -dd), fmtN(a1 + (n - 2) * dd)], steps,
    data: { value: an, a1, d: dd, n },
  };
});

skill('is-function', 4, 'Is it a function?', 'Decide whether a relation is a function', (d) => {
  const not = d > 1 && coin();
  const rel = (fn) => {
    const xs = shuffle(Array.from({ length: 15 }, (_, i) => i - 5)).slice(0, fn ? 4 : 3);
    const ys = xs.map(() => ri(-5, 9));
    if (fn && coin(0.5)) ys[1] = ys[0];                          // a repeated y is still fine
    const pairs = xs.map((x, i) => [x, ys[i]]);
    let dup = null;
    if (!fn) { const [x, y] = pick(pairs); let y2 = y; while (y2 === y) y2 = ri(-5, 9); pairs.push([x, y2]); dup = { x, y1: y, y2 }; }
    const ord = shuffle(pairs);
    return { fn, dup, text: `{${ord.map(([x, y]) => `(${fmtN(x)}, ${fmtN(y)})`).join(', ')}}`, repY: fn && new Set(ys).size < ys.length };
  };
  const rels = not ? [rel(false), rel(true), rel(true), rel(true)] : [rel(true), rel(false), rel(false), rel(false)];
  need(new Set(rels.map((r) => r.text)).size === 4);
  const answer = rels[0].text;
  const steps = [S('A relation is a function when every x-value is paired with exactly one y-value', 'Look for an x-value that appears twice with different y-values')];
  for (const r of rels) {
    steps.push(S(r.text, r.fn ? `Every x-value appears once${r.repY ? ' (a repeated y-value is fine)' : ''} — a function` : `x = ${fmtN(r.dup.x)} is paired with both y = ${fmtN(r.dup.y1)} and y = ${fmtN(r.dup.y2)} — not a function`));
  }
  return { type: 'mc', text: not ? 'Which relation is NOT a function?' : 'Which relation is a function?', answer, options: rels.map((r) => r.text), steps, data: { not } };
});

/* ------------------------------------------- Unit 5 · Linear equations */
/** The raw quotient "−8/(−2)" when it still needs simplifying; null when it is already the slope. */
function riseRun(dy, dx) {
  if (!dx || Math.abs(dx) === 1 || !dy) return null;
  const m = F(dy, dx);
  if (dx > 0 && m.d === dx) return null;
  return `${fmtN(dy)}/${pn(dx)}`;
}
const UNDEF = /^(undefined|undef|no ?slope|none|dne|does ?not ?exist|it ?is ?undefined|the ?slope ?is ?undefined)$/;
skill('slope', 5, 'Slope from two points', 'Find the slope between two points', (d) => {
  const special = d > 1 && coin(d === 3 ? 0.25 : 0.12) ? pick(['vertical', 'horizontal']) : null;
  const x1 = d === 1 ? ri(0, 6) : ri(-8, 8), y1 = d === 1 ? ri(0, 6) : ri(-8, 8);
  let dx, dy;
  if (special === 'vertical') { dx = 0; dy = nz(-9, 9); }
  else if (special === 'horizontal') { dx = nz(-9, 9); dy = 0; }
  else if (d === 1) { dx = ri(1, 5); dy = dx * ri(1, 4); }
  else { dx = nz(-8, 8); dy = nz(-9, 9); }
  const x2 = x1 + dx, y2 = y1 + dy;
  need(Math.abs(x2) <= 12 && Math.abs(y2) <= 14);
  const vertical = dx === 0;
  const m = vertical ? null : F(dy, dx);
  const answer = vertical ? 'undefined' : fStr(m);
  const check = (input) => {
    const t = prep(input).replace(/^m\s*=\s*/, '').trim();
    if (UNDEF.test(t)) return vertical ? true : no('This line is not vertical — the run is not zero, so the slope is a number.');
    if (vertical) return readNum(t) ? no('The run (change in x) is 0, and you cannot divide by 0 — the slope of a vertical line is undefined.') : false;
    const r = readNum(t);
    if (!r) return no('Type a number or a fraction like −3/4.');
    return chkNum(fVal(m))(t) === true;
  };
  // "m = 6/(−4)", never "6/−4"; a run of ±1 or a fraction already in lowest
  // terms goes straight to the slope.
  const raw = riseRun(dy, dx);
  const steps = [
    S('Slope is rise over run', 'm = (y₂ − y₁)/(x₂ − x₁)'),
    S('Substitute the two points', `m = (${fmtN(y2)} ${M} ${pn(y1)})/(${fmtN(x2)} ${M} ${pn(x1)})`, vertical ? `m = ${fmtN(dy)}/0` : `m = ${raw || fStr(m)}`),
    vertical ? S('The run is 0 and division by zero is not allowed', 'This is a vertical line', 'The slope is undefined')
      : dy === 0 ? S('The rise is 0, so the line is horizontal', 'm = 0')
        : raw ? S('Simplify the fraction', `m = ${fStr(m)}`) : null,
  ].filter(Boolean);
  const alt = vertical ? ['0', fStr(F(dx, dy)), fmtN(dy), fmtN(-dy)] : [dy ? fStr(F(dx, dy)) : null, fStr(F(-dy, dx)), dy ? fStr(F(-dx, dy)) : null, dy === 0 ? 'undefined' : null, fStr(F(dy + dx, dx)), 'undefined'];
  return { type: 'written', text: `Find the slope of the line through (${fmtN(x1)}, ${fmtN(y1)}) and (${fmtN(x2)}, ${fmtN(y2)}).`, fmt: 'Type a number or fraction like −3/4, or "undefined".', answer, check, alt, steps, data: { slope: vertical ? null : fVal(m), vertical, points: [[x1, y1], [x2, y2]] } };
});

skill('slope-int', 5, 'Slope-intercept form', 'Write an equation in slope-intercept form', (d) => {
  const form = d === 1 ? 'mb' : d === 2 ? pick(['point', 'two']) : pick(['two', 'point', 'two']);
  let m, b, text;
  const steps = [];
  if (form === 'mb') {
    m = F(nz(-6, 6)); b = F(nz(-9, 9));
    text = `Write the equation of the line with slope ${fStr(m)} and y-intercept ${fStr(b)} in slope-intercept form.`;
    steps.push(S('Slope-intercept form is y = mx + b, where m is the slope and b is the y-intercept', `m = ${fStr(m)}, b = ${fStr(b)}`), S('Substitute m and b', lineStr(m, b)));
  } else {
    let x1 = nz(-6, 6);
    if (form === 'two' && d === 3) { const den = pick([2, 3]); m = F(nz(-5, 5), den); need(m.d > 1); x1 = m.d * nz(-3, 3); }
    else m = F(nz(-5, 5));
    b = F(ri(-9, 9));
    const y1 = fVal(fAdd(fMul(m, F(x1)), b));
    need(isInt(y1));
    if (form === 'point') {
      text = `Write the equation of the line with slope ${fStr(m)} that passes through (${fmtN(x1)}, ${fmtN(y1)}), in slope-intercept form.`;
    } else {
      const step = m.d * (coin() ? 1 : 2) * (coin() ? 1 : -1);
      const x2 = x1 + step, y2 = y1 + fVal(m) * step;
      need(isInt(y2) && Math.abs(x2) <= 12 && Math.abs(y2) <= 20);
      text = `Write the equation of the line through (${fmtN(x1)}, ${fmtN(y1)}) and (${fmtN(x2)}, ${fmtN(y2)}) in slope-intercept form.`;
      const raw = riseRun(y2 - y1, x2 - x1);
      steps.push(S('Find the slope first', `m = (${fmtN(y2)} ${M} ${pn(y1)})/(${fmtN(x2)} ${M} ${pn(x1)})${raw ? ` = ${raw}` : ''}`, `m = ${fStr(m)}`));
    }
    const mx = fMul(m, F(x1));
    steps.push(
      S(`Substitute m = ${fStr(m)} and the point (${fmtN(x1)}, ${fmtN(y1)}) into y = mx + b`, `${fmtN(y1)} = ${fStr(m)} × ${pn(x1)} + b`, `${fmtN(y1)} = ${fStr(mx)} + b`),
      S(mx.n >= 0 ? `Subtract ${fStr(mx)} from both sides` : `Add ${fStr(F(-mx.n, mx.d))} to both sides`, `${fmtN(y1)} ${mx.n >= 0 ? M : '+'} ${fStr(F(Math.abs(mx.n), mx.d))} = b`, `b = ${fStr(b)}`),
      S('Write the equation with m and b', lineStr(m, b)),
    );
  }
  const answer = lineStr(m, b);
  const mv = fVal(m), bv = fVal(b);
  const check = chkSlopeInt(mv, bv);
  const alt = [lineStr(m, F(-b.n, b.d)), lineStr(F(-m.n, m.d), b), b.n && b.d === 1 && m.d === 1 && b.n !== m.n ? lineStr(b, m) : null, m.n ? lineStr(F(m.d, m.n), b) : null, lineStr(m, F(b.n + b.d, b.d)), lineStr(m, F(b.n - b.d, b.d))];
  return { type: 'written', text, fmt: 'Type it like y = 2x − 3.', answer, check, alt, steps, data: { m: mv, b: bv } };
});

skill('intercepts', 5, 'x- and y-intercepts', 'Find the intercepts of a line', (d) => {
  const which = pick(['x', 'y']);
  let eq, xi, yi;
  const steps = [];
  if (d === 1 || (d === 2 && coin())) {
    const A = nz(-6, 6), B = nz(-6, 6);
    need(Math.abs(A) !== 1 || Math.abs(B) !== 1);
    const C = lcm(Math.abs(A), Math.abs(B)) * nz(-3, 3);
    xi = C / A; yi = C / B;
    eq = eqStr(A, B, C);
    if (which === 'x') steps.push(S('At the x-intercept the line crosses the x-axis, so y = 0', `${mono(A, 'x')} ${B < 0 ? M : '+'} ${Math.abs(B)}(0) = ${fmtN(C)}`, `${mono(A, 'x')} = ${fmtN(C)}`), S(`Divide both sides by ${fmtN(A)}`, `x = ${fmtN(C)} ÷ ${pn(A)}`, `x = ${fmtN(xi)}`));
    else steps.push(S('At the y-intercept the line crosses the y-axis, so x = 0', `${fmtN(A)}(0) ${B < 0 ? M : '+'} ${mono(Math.abs(B), 'y')} = ${fmtN(C)}`, `${mono(B, 'y')} = ${fmtN(C)}`), S(`Divide both sides by ${fmtN(B)}`, `y = ${fmtN(C)} ÷ ${pn(B)}`, `y = ${fmtN(yi)}`));
  } else {
    const m = nz(-5, 5);
    const bb = m * nz(-5, 5);
    xi = -bb / m; yi = bb;
    eq = `y = ${lin(m, bb)}`;
    if (which === 'x') steps.push(S('At the x-intercept, y = 0', `0 = ${lin(m, bb)}`), S(bb > 0 ? `Subtract ${bb} from both sides` : `Add ${-bb} to both sides`, `${fmtN(-bb)} = ${mono(m, 'x')}`), S(`Divide both sides by ${fmtN(m)}`, `x = ${fmtN(-bb)} ÷ ${pn(m)}`, `x = ${fmtN(xi)}`));
    else steps.push(S('At the y-intercept, x = 0', `y = ${fmtN(m)}(0) ${bb < 0 ? M : '+'} ${Math.abs(bb)}`, `y = ${fmtN(yi)}`));
  }
  const pt = which === 'x' ? [xi, 0] : [0, yi];
  const answer = `(${fmtN(pt[0])}, ${fmtN(pt[1])})`;
  steps.push(S(`Write the ${which}-intercept as a point`, answer));
  const val = which === 'x' ? xi : yi;
  const check = (input) => {
    const p = readPair(input);
    if (p) {
      if (near(p[0], pt[0]) && near(p[1], pt[1])) return true;
      if (near(p[0], pt[1]) && near(p[1], pt[0]) && val !== 0) return no(which === 'x' ? 'On the x-axis y = 0, so the x-intercept is written (x, 0).' : 'On the y-axis x = 0, so the y-intercept is written (0, y).');
      return false;
    }
    const r = readNum(input, { v: which });
    if (!r) return no('Type an ordered pair like (4, 0).');
    return near(r.v, val);
  };
  const other = which === 'x' ? `(0, ${fmtN(yi)})` : `(${fmtN(xi)}, 0)`;
  const swapped = `(${fmtN(pt[1])}, ${fmtN(pt[0])})`;
  const flip = which === 'x' ? `(${fmtN(-xi)}, 0)` : `(0, ${fmtN(-yi)})`;
  const plus = which === 'x' ? `(${fmtN(xi + 1)}, 0)` : `(0, ${fmtN(yi + 1)})`;
  return { type: 'written', text: `Find the ${which}-intercept of ${eq}.`, fmt: `Type a point like ${which === 'x' ? '(4, 0)' : '(0, 3)'}.`, answer, check, alt: [swapped, other, flip, plus], steps, data: { which, point: pt } };
});

/* ------------------------------------------------ Unit 6 · Systems */
skill('system', 6, 'Solve a system', 'Solve a system of two linear equations', (d) => {
  const x0 = ri(-6, 6), y0 = ri(-6, 6);
  let e1, e2;
  const steps = [];
  if (d === 1) {
    const m = nz(-4, 4), k = y0 - m * x0;
    const a = nz(-5, 5), b = nz(-5, 5);
    const c = a * x0 + b * y0;
    need(a + b * m !== 0 && Math.abs(k) <= 15);
    e1 = `y = ${lin(m, k)}`; e2 = eqStr(a, b, c);
    const A = a + b * m, B = b * k;
    steps.push(S(`The first equation says y = ${lin(m, k)}. Substitute it for y in the second equation`, `${mono(a, 'x')} ${b < 0 ? M : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}(${lin(m, k)}) = ${fmtN(c)}`));
    steps.push(S('Distribute and combine like terms', `${tms([[a, 'x'], [b * m, 'x'], [b * k, '']])} = ${fmtN(c)}`, `${lin(A, B)} = ${fmtN(c)}`));
    steps.push(...linSolve(A, B, 0, c).steps);
    steps.push(S(`Substitute x = ${fmtN(x0)} back into y = ${lin(m, k)}`, `y = ${fmtN(m)} × ${pn(x0)}${k ? ` ${k < 0 ? M : '+'} ${Math.abs(k)}` : ''}`, `y = ${fmtN(y0)}`));
  } else {
    let a1, b1, a2, b2;
    if (d === 2) { a1 = nz(-5, 5); a2 = nz(-5, 5); b1 = nz(-5, 5); b2 = coin() ? -b1 : b1; }
    else { a1 = nz(-6, 6); a2 = nz(-6, 6); b1 = nz(-6, 6); b2 = nz(-6, 6); need(Math.abs(b1) !== Math.abs(b2)); }
    need(a1 * b2 - a2 * b1 !== 0);
    const c1 = a1 * x0 + b1 * y0, c2 = a2 * x0 + b2 * y0;
    e1 = eqStr(a1, b1, c1); e2 = eqStr(a2, b2, c2);
    const Lc = lcm(Math.abs(b1), Math.abs(b2));
    let k1 = Lc / Math.abs(b1), k2 = -Math.sign(b1) * Math.sign(b2) * (Lc / Math.abs(b2));
    const r1 = [k1 * a1, k1 * b1, k1 * c1], r2 = [k2 * a2, k2 * b2, k2 * c2];
    if (k1 !== 1) steps.push(S(`Multiply every term of the first equation by ${k1} so the y-terms will cancel`, eqStr(...r1)));
    if (k2 !== 1) steps.push(S(`Multiply every term of the second equation by ${fmtN(k2)}`, eqStr(...r2)));
    const A = r1[0] + r2[0], C = r1[2] + r2[2];
    need(A !== 0);
    const lhs = (a, b) => tms([[a, 'x'], [b, 'y']]);
    steps.push(S(`Add the equations — ${mono(r1[1], 'y')} and ${mono(r2[1], 'y')} cancel`, `(${lhs(r1[0], r1[1])}) + (${lhs(r2[0], r2[1])}) = ${fmtN(r1[2])} + ${pn(r2[2])}`, `${mono(A, 'x')} = ${fmtN(C)}`));
    if (A !== 1) steps.push(S(`Divide both sides by ${fmtN(A)}`, `x = ${fmtN(C)} ÷ ${pn(A)}`, `x = ${fmtN(x0)}`));
    steps.push(S(`Substitute x = ${fmtN(x0)} into the first equation`, `${fmtN(a1)} × ${pn(x0)} ${b1 < 0 ? M : '+'} ${mono(Math.abs(b1), 'y')} = ${fmtN(c1)}`, `${lin(b1, a1 * x0, 'y')} = ${fmtN(c1)}`));
    steps.push(...linSolve(b1, a1 * x0, 0, c1, '=', 'y').steps);
  }
  const answer = `(${fmtN(x0)}, ${fmtN(y0)})`;
  steps.push(S('The solution is the point where the two lines cross', answer));
  const P = (a, b) => `(${fmtN(a)}, ${fmtN(b)})`;
  return {
    type: 'written', text: `Solve the system: ${e1} and ${e2}`, eqs: [e1, e2], fmt: 'Type an ordered pair like (2, −1).',
    answer, check: chkPair(x0, y0), alt: [P(y0, x0), P(x0, -y0), P(-x0, y0), P(x0, y0 + 1), P(x0 + 1, y0)], steps, data: { x: x0, y: y0 },
  };
});

const SYS_OPTS = ['Exactly one solution', 'Exactly two solutions', 'No solution', 'Infinitely many solutions'];
skill('system-type', 6, 'How many solutions?', 'Decide how many solutions a system has', (d) => {
  const kind = pick(['one', 'none', 'inf']);
  let e1, e2, L1, L2;
  if (d === 1) {
    const m1 = nz(-5, 5), b1 = ri(-9, 9);
    let m2 = m1, b2 = b1;
    if (kind === 'one') { while (m2 === m1) m2 = nz(-5, 5); b2 = ri(-9, 9); }
    if (kind === 'none') while (b2 === b1) b2 = ri(-9, 9);
    e1 = `y = ${lin(m1, b1)}`;
    if (kind === 'inf') { const k = ri(2, 4); e2 = `${k}y = ${lin(k * m1, k * b1)}`; } else e2 = `y = ${lin(m2, b2)}`;
    L1 = [F(m1), F(b1)]; L2 = [F(m2), F(b2)];
  } else {
    const a1 = nz(-6, 6), b1 = nz(-6, 6), c1 = nz(-12, 12);
    let a2, b2, c2;
    if (kind === 'one') { a2 = nz(-6, 6); b2 = nz(-6, 6); c2 = nz(-12, 12); need(a1 * b2 !== a2 * b1); }
    else { const k = pick([-3, -2, 2, 3]); a2 = k * a1; b2 = k * b1; c2 = kind === 'inf' ? k * c1 : k * c1 + nz(-6, 6); }
    e1 = eqStr(a1, b1, c1); e2 = eqStr(a2, b2, c2);
    L1 = [F(-a1, b1), F(c1, b1)]; L2 = [F(-a2, b2), F(c2, b2)];
  }
  const answer = kind === 'one' ? SYS_OPTS[0] : kind === 'none' ? SYS_OPTS[2] : SYS_OPTS[3];
  const steps = [
    S('Put each equation in slope-intercept form (solve for y)', `${lineStr(...L1)} and ${lineStr(...L2)}`),
    S('Compare the slopes and the y-intercepts', `slopes ${fStr(L1[0])} and ${fStr(L2[0])}; y-intercepts ${fStr(L1[1])} and ${fStr(L2[1])}`),
    kind === 'one' ? S('Different slopes: the lines cross at exactly one point', answer)
      : kind === 'none' ? S('Same slope, different y-intercepts: the lines are parallel and never meet', answer)
        : S('Same slope and same y-intercept: they are the same line, so every point on it is a solution', answer),
    S('Two different lines can cross at most once, so "exactly two solutions" is never possible', ''),
  ];
  return { type: 'mc', text: `How many solutions does this system have? ${e1} and ${e2}`, answer, options: SYS_OPTS.slice(), steps, data: { kind } };
});

/* ------------------------------------------------ Unit 7 · Exponents */
const monoX = (c, ex, ey = 0) => {
  if (ex < 0 && !ey) return `${c < 0 ? M : ''}${Math.abs(c)}/${powKey('x', -ex)}`;
  return tms([[c, powKey('x', ex) + powKey('y', ey)]]);
};
skill('exp-rules', 7, 'Exponent rules', 'Simplify with the exponent rules', (d) => {
  const form = pick(d === 3 ? ['prod2', 'quotNeg', 'pow2', 'combo'] : ['prod', 'quot', 'pow']);
  let text, ans, wrong = [], steps;
  const same = (a, b) => a[0] === b[0] && a[1] === b[1] && (a[2] || 0) === (b[2] || 0);
  if (form === 'prod') {
    const a = ri(2, 9), b = ri(2, 9), c1 = d === 1 ? 1 : ri(2, 6), c2 = d === 1 ? 1 : ri(2, 6);
    text = `Simplify: ${monoX(c1, a)} · ${monoX(c2, b)}`;
    ans = [c1 * c2, a + b];
    wrong = [[c1 * c2, a * b], [c1 + c2, a + b], [c1 + c2, a * b], [c1 * c2, a + b + 1]];
    steps = [S('Same base: keep the base and add the exponents', `${powKey('x', a)} · ${powKey('x', b)} = ${powKey('x', a + b)}`), ...(c1 * c2 !== 1 ? [S('Multiply the coefficients', `${c1} × ${c2} = ${c1 * c2}`)] : []), S('Put it together', monoX(...ans))];
  } else if (form === 'quot') {
    const b = ri(2, 6), a = b + ri(1, 8), c2 = d === 1 ? 1 : ri(2, 5), c1 = c2 * (d === 1 ? 1 : ri(2, 6));
    text = c1 === 1 && c2 === 1 ? `Simplify: ${monoX(1, a)} ÷ ${monoX(1, b)}` : `Simplify: (${monoX(c1, a)}) ÷ (${monoX(c2, b)})`;
    ans = [c1 / c2, a - b];
    wrong = [[c1 / c2, a + b], [c1 / c2, a * b], [c1 - c2 || c1 * c2, a - b], [c1 / c2, a - b + 1]];
    if (isInt(a / b)) wrong.unshift([c1 / c2, a / b]);
    steps = [S('Same base: keep the base and subtract the exponents', `${powKey('x', a)} ÷ ${powKey('x', b)} = ${powKey('x', a - b)}`), ...(c1 !== 1 || c2 !== 1 ? [S('Divide the coefficients', `${c1} ÷ ${c2} = ${c1 / c2}`)] : []), S('Put it together', monoX(...ans))];
  } else if (form === 'pow') {
    const a = ri(2, 6), b = ri(2, 4), c = d === 1 ? 1 : ri(2, 3);
    text = `Simplify: (${monoX(c, a)})${sup(b)}`;
    ans = [c ** b, a * b];
    wrong = [[c ** b, a + b], [c, a * b], [c * b, a * b], [c ** b, a ** b]];
    steps = [S('Power of a power: multiply the exponents', `(x${sup(a)})${sup(b)} = x${sup(a * b)}`), ...(c !== 1 ? [S('Raise the coefficient to the power too', `${c}${sup(b)} = ${c ** b}`)] : []), S('Put it together', monoX(...ans))];
  } else if (form === 'prod2') {
    const a = ri(1, 6), b = ri(1, 5), e = ri(1, 6), f = ri(1, 5), c1 = ri(2, 6), c2 = ri(2, 6);
    text = `Simplify: ${monoX(c1, a, b)} · ${monoX(c2, e, f)}`;
    ans = [c1 * c2, a + e, b + f];
    wrong = [[c1 + c2, a + e, b + f], [c1 * c2, a * e, b * f], [c1 * c2, a + b, e + f], [c1 * c2, a + e + b + f, 0]];
    steps = [S('Multiply the coefficients', `${c1} × ${c2} = ${c1 * c2}`), S('Add the exponents of each base separately', `${powKey('x', a)} · ${powKey('x', e)} = ${powKey('x', a + e)} and ${powKey('y', b)} · ${powKey('y', f)} = ${powKey('y', b + f)}`), S('Put it together', monoX(...ans))];
  } else if (form === 'quotNeg') {
    const a = ri(2, 6), b = a + ri(1, 6);
    text = `Simplify: ${monoX(1, a)} ÷ ${monoX(1, b)}`;
    ans = [1, a - b];
    wrong = [[1, b - a], [-1, b - a], [1, a - b - 1], [1, -(a + b)], [1, a + b]];
    steps = [S('Same base: subtract the exponents', `${powKey('x', a)} ÷ ${powKey('x', b)} = ${powKey('x', a - b)}`), S('A negative exponent means the reciprocal', `x${sup(a - b)} = 1/${powKey('x', b - a)}`)];
  } else {
    const a = ri(2, 4), b = ri(2, 3), e = ri(1, 6), c = ri(2, 3);
    text = `Simplify: (${monoX(c, a)})${sup(b)} · ${powKey('x', e)}`;
    ans = [c ** b, a * b + e];
    wrong = [[c, a * b + e], [c ** b, a + b + e], [c * b, a * b + e], [c ** b, a * b * e]];
    steps = [S('Power of a power: multiply the exponents, and raise the coefficient too', `(${monoX(c, a)})${sup(b)} = ${monoX(c ** b, a * b)}`), S('Same base: add the exponents', `${monoX(c ** b, a * b)} · ${powKey('x', e)} = ${monoX(c ** b, a * b + e)}`)];
  }
  const answer = monoX(...ans);
  const options = [answer];
  for (const w of [...wrong, ...Array.from({ length: 8 }, () => [ans[0] + pick([0, 1, 2]), ans[1] + pick([-2, -1, 1, 2]), ans[2]])]) {
    if (options.length === 4) break;
    if (same(w, ans) || w[1] === 0 || (w[2] || 0) < 0) continue;
    const s = monoX(...w);
    if (!options.includes(s)) options.push(s);
  }
  need(options.length === 4);
  return { type: 'mc', text, answer, options, steps, data: { coef: ans[0], x: ans[1], y: ans[2] || 0 } };
});

skill('neg-exp', 7, 'Zero & negative exponents', 'Evaluate zero and negative exponents', (d) => {
  const forms = d === 1 ? ['neg', 'neg', 'zero'] : d === 2 ? ['neg', 'coef', 'recip', 'negbase', 'zero'] : ['fracbase', 'sum', 'minuszero', 'coef', 'negbase'];
  const form = pick(forms);
  let text, val, steps, alt = [];
  const bn = () => { const b = ri(2, 5); const n = ri(1, b <= 3 ? 4 : b === 4 ? 3 : 2); return [b, n]; };
  if (form === 'neg') {
    const [b, n] = bn();
    text = `${b}${sup(-n)}`; val = F(1, b ** n);
    steps = [S('A negative exponent means the reciprocal: a⁻ⁿ = 1/aⁿ', `${b}${sup(-n)} = 1/${powS(b, n)}`)];
    if (n > 1) steps.push(S('Evaluate the power', `${b}${sup(n)} = ${b ** n}`, `1/${b ** n}`));
    alt = [fmtN(-(b ** n)), fmtN(-b * n), fStr(F(1, b * n)), fmtN(b ** n)];
  } else if (form === 'zero') {
    const b = nz(-12, 15);
    text = `${b < 0 ? `(${fmtN(b)})` : b}⁰`; val = F(1);
    steps = [S('Any nonzero number raised to the zero power is 1', `${text} = 1`)];
    alt = ['0', fmtN(b), fmtN(-1)];
  } else if (form === 'coef') {
    const [b, n] = bn(); const c = ri(2, 9);
    text = `${c} · ${b}${sup(-n)}`; val = F(c, b ** n);
    steps = [S('The exponent applies only to the base right before it', `${b}${sup(-n)} = 1/${b ** n}`), S('Multiply', `${c} × 1/${b ** n} = ${c}/${b ** n}`, fStr(val))];
    alt = [fStr(F(1, (c * b) ** n)), fmtN(-c * b ** n), fStr(F(b ** n, c)), fmtN(c * b ** n)];
  } else if (form === 'recip') {
    const [b, n] = bn();
    text = `(1/${b})${sup(-n)}`; val = F(b ** n);
    steps = [S('A negative exponent flips the fraction', `(1/${b})${sup(-n)} = ${powS(b, n)}`)];
    if (n > 1) steps.push(S('Evaluate the power', `${b}${sup(n)} = ${b ** n}`));
    alt = [fStr(F(1, b ** n)), fmtN(-(b ** n)), fStr(F(-1, b ** n))];
  } else if (form === 'negbase') {
    const b = ri(2, 4), n = ri(1, 3);
    text = `(${fmtN(-b)})${sup(-n)}`; val = F((-1) ** n, b ** n);
    steps = n === 1
      ? [S('Take the reciprocal to make the exponent positive', `(${fmtN(-b)})⁻¹ = 1/(${fmtN(-b)})`, fStr(val))]
      : [S('Take the reciprocal to make the exponent positive', `(${fmtN(-b)})${sup(-n)} = 1/(${fmtN(-b)})${sup(n)}`), S(`(${fmtN(-b)})${sup(n)} = ${fmtN((-b) ** n)}`, `1/${pn((-b) ** n)}`, fStr(val))];
    alt = [fStr(F(-val.n, val.d)), fmtN((-b) ** n), fmtN(b * n)];
  } else if (form === 'fracbase') {
    const p = ri(1, 4), q = ri(2, 5), n = ri(1, 3);
    need(gcd(p, q) === 1 && p !== q);
    text = `(${p}/${q})${sup(-n)}`; val = fPow(F(p, q), -n);
    const flipped = p === 1 ? powS(q, n) : n === 1 ? `${q}/${p}` : `(${q}/${p})${sup(n)}`;
    steps = [S('A negative exponent flips the fraction', `(${p}/${q})${sup(-n)} = ${flipped}`)];
    if (n > 1) steps.push(p === 1 ? S('Evaluate the power', `${q}${sup(n)} = ${q ** n}`) : S('Raise the top and the bottom to the power', `${q}${sup(n)}/${p}${sup(n)}`, fStr(val)));
    alt = [fStr(fPow(F(p, q), n)), fStr(F(-val.n, val.d)), fStr(F(q * n, p))];
  } else if (form === 'sum') {
    const a = ri(2, 5), b = ri(2, 6);
    need(a !== b);
    text = `${a}⁻¹ + ${b}⁻¹`; val = fAdd(F(1, a), F(1, b));
    steps = [S('Rewrite each negative exponent as a reciprocal', `1/${a} + 1/${b}`), S('Use a common denominator', `${b}/${a * b} + ${a}/${a * b}`, `${a + b}/${a * b}`), S('Simplify', fStr(val))];
    alt = [fStr(F(1, a + b)), fStr(F(-(a + b))), fStr(F(2, a * b))];
  } else {
    const b = ri(2, 12);
    text = `${M}${b}⁰`; val = F(-1);
    steps = [S('The exponent applies only to the base right before it — not to the minus sign', `${M}${b}⁰ = ${M}(${b}⁰)`), S(`${b}⁰ = 1`, `${M}1`)];
    alt = ['1', '0', fmtN(-b)];
  }
  const v = fVal(val);
  return { type: 'written', text: `Evaluate: ${text}`, fmt: 'Type a whole number or a fraction like 1/8.', answer: fStr(val), check: chkNum(v), num: v, fmtAlt: ratStr, alt, steps, data: { value: v, expr: text } };
});

skill('growth', 7, 'Growth & decay', 'Find a value after exponential growth or decay', (d) => {
  const kind = d === 1 ? pick(['double', 'half']) : d === 2 ? pick(['grow', 'decay']) : pick(['grow', 'decay', 'interest']);
  let text, exact, unit = 1, money = false, unitName = 'whole number', steps, alt = [], a, t;
  if (kind === 'double') {
    a = pick([20, 25, 40, 50, 60, 75, 100, 150, 200]); t = ri(3, 7);
    exact = a * 2 ** t;
    text = `A colony of ${a} bacteria doubles every hour. How many bacteria will there be after ${t} hours?`;
    steps = [S('Doubling means the growth factor is 2, once per hour', `y = ${a} · 2ᵗ`), S(`Substitute t = ${t}`, `y = ${a} · 2${sup(t)} = ${a} × ${2 ** t}`, `y = ${commas(exact)}`)];
    alt = [commas(a * 2 * t), commas(a * 2 ** (t - 1)), commas(a * 2 ** (t + 1)), commas(a + 2 ** t)];
  } else if (kind === 'half') {
    t = ri(2, 5); const h = pick([2, 4, 6, 8, 12]); a = 2 ** t * ri(2, 12);
    exact = a / 2 ** t;
    text = `A ${a} mg dose of a medicine is cut in half every ${h} hours. How many milligrams are left after ${h * t} hours?`;
    steps = [S('Count the half-lives', `${h * t} ÷ ${h} = ${t}`), S('Halving means the decay factor is 1/2 each time', `y = ${a} · (1/2)${sup(t)}`), S('Evaluate', `${a} ÷ ${2 ** t}`, `y = ${commas(exact)} mg`)];
    alt = [commas(a / 2 / t), commas(a / 2 ** (t - 1)), commas(Math.max(1, a - (a / 2) * t) === exact ? exact + 1 : Math.max(1, a - (a / 2) * t)), commas(a / 2 / (h * t) * 2 === exact ? exact * 2 : Math.round(a / 2 / (h * t) * 2 * 100) / 100)];
  } else {
    const grow = kind !== 'decay';
    const r = kind === 'grow' ? pick([2, 3, 4, 5, 6, 8]) : kind === 'decay' ? pick([5, 8, 10, 12, 15, 20]) : pick([2, 3, 4, 5, 6]);
    t = ri(2, 10);
    if (kind === 'grow') { a = 500 * ri(10, 100); text = `A town has ${commas(a)} people, and its population grows ${r}% per year. What will the population be after ${t} years? Round to the nearest whole number.`; }
    else if (kind === 'decay') { a = 1000 * ri(12, 40); money = true; unitName = 'dollar'; text = `A car is worth $${commas(a)} and loses ${r}% of its value each year. What will it be worth after ${t} years? Round to the nearest dollar.`; }
    else { a = 100 * ri(5, 100); money = true; unit = 0.01; unitName = 'cent'; text = `You deposit $${commas(a)} in an account that earns ${r}% interest, compounded once a year. How much will be in the account after ${t} years? Round to the nearest cent.`; }
    const b = 1 + (grow ? r : -r) / 100;
    const pow = b ** t;
    exact = a * pow;
    const frac = exact / unit - Math.floor(exact / unit);
    need(Math.abs(frac - 0.5) > 0.02);
    const places = unit === 0.01 ? 2 : 0;
    const bs = numStr(b);
    steps = [
      S(`${grow ? 'Growth' : 'Decay'} factor: 1 ${grow ? '+' : M} ${numStr(r / 100)}`, `b = ${bs}`),
      S('Exponential model: y = a · bᵗ', `y = ${money ? '$' : ''}${commas(a)} · ${bs}${sup(t)}`),
      S('Evaluate the power, then multiply', `${bs}${sup(t)} ≈ ${pow.toFixed(6)}`, `y ≈ ${money ? '$' : ''}${commas(exact, unit === 0.01 ? 4 : 2)}`),
    ];
    const lin_ = a * (1 + ((grow ? r : -r) / 100) * t);
    const wrongDir = a * (1 + (grow ? -r : r) / 100) ** t;
    const oneLess = a * b ** (t - 1);
    alt = [lin_, wrongDir, oneLess, a * b ** (t + 1)].map((v) => (money ? '$' : '') + commas(Math.round(v / unit) * unit, places));
  }
  const places = unit === 0.01 ? 2 : 0;
  const rounded = Math.round(exact / unit) * unit;
  const answer = (money ? '$' : '') + commas(rounded, places);
  if (steps.length === 3 && kind !== 'half') steps.push(S(`Round to the nearest ${unitName}`, answer));
  const check = (input) => {
    const r = readNum(input, { money: true });
    if (!r) return no('Type a number, like 1,234.');
    if (near(r.v, rounded) || Math.abs(r.v - exact) <= unit / 2 + 1e-9) return true;
    if (Math.abs(r.v - exact) < 1.5) return no(`Close — round to the nearest ${unitName}.`);
    return false;
  };
  return {
    type: 'written', text, fmt: money ? `Type an amount, like ${unit === 0.01 ? '$1,234.56' : '$1,234'}.` : 'Type a number.',
    answer, check, alt, num: rounded, fmtAlt: (v) => (money ? '$' : '') + commas(v, places), steps, data: { value: rounded, exact, kind },
  };
});

/* ---------------------------------------------- Unit 8 · Polynomials */
const randPoly = (deg, lo = -9, hi = 9) => { const p = Array.from({ length: deg + 1 }, () => ri(lo, hi)); p[deg] = nz(lo, hi); return p; };
skill('poly-add', 8, 'Add & subtract polynomials', 'Add and subtract polynomials', (d) => {
  const minus = d === 1 ? false : d === 2 ? coin(0.7) : true;
  let P, Q;
  if (d === 1) { P = randPoly(coin() ? 1 : 2); Q = randPoly(P.length - 1); }
  else if (d === 2) { P = randPoly(2); Q = randPoly(2); }
  else { P = randPoly(3); Q = randPoly(pick([2, 3])); P[1] = coin(0.3) ? 0 : P[1]; }
  need(P.some((c, i) => i < P.length - 1 && c) && Q.some((c, i) => i < Q.length - 1 && c));
  const Qs = minus ? pscale(Q, -1) : Q;
  const Rr = ptrim(padd(P, Qs));
  need(Rr.length >= 2 && Rr.filter(Boolean).length >= 2);
  const text = `Simplify: (${poly(P)}) ${minus ? M : '+'} (${poly(Q)})`;
  const termsOf = (p) => p.map((c, k) => [c, powKey('x', k)]).reverse().filter(([c]) => c);
  const flat = [...termsOf(P), ...termsOf(Qs)];
  const deg = Math.max(P.length, Q.length) - 1;
  const groups = [];
  for (let k = deg; k >= 0; k--) groups.push(flat.filter(([, key]) => key === powKey('x', k)));
  const steps = [
    minus ? S('Subtracting means adding the opposite: change the sign of every term in the second polynomial', tms(flat)) : S('Drop the parentheses (adding changes no signs)', tms(flat)),
    S('Group like terms', groupShow(groups)),
    S('Combine the coefficients of each group', poly(Rr)),
  ];
  const wrongs = [];
  if (minus) {
    const onlyFirst = P.map((c, i) => c + (i === Q.length - 1 ? -Q[i] : (Q[i] || 0)));
    wrongs.push(poly(ptrim(padd(P, Q))), poly(ptrim(onlyFirst)));
  } else wrongs.push(poly(ptrim(padd(P, pscale(Q, -1)))));
  const top = Rr.length - 1;
  if (top >= 1) { const e = new Array(2 * top + 1).fill(0); Rr.forEach((c, k) => { e[k === top ? 2 * top : k] += c; }); wrongs.push(poly(e)); }
  for (let i = 0; i < 6; i++) { const w = Rr.slice(); const k = ri(0, w.length - 1); w[k] += pick([-2, -1, 1, 2]); if (ptrim(w).length === Rr.length) wrongs.push(poly(w)); }
  return { type: 'written', text, fmt: 'Type like 3x^2 − 5x + 2 (x² works too).', answer: poly(Rr), check: chkExpanded(Rr), alt: wrongs, steps, data: { coeffs: Rr } };
});

skill('foil', 8, 'Multiply binomials', 'Multiply two binomials', (d) => {
  const a = d === 1 ? 1 : ri(1, d === 2 ? 3 : 6), c = d === 1 ? 1 : ri(d === 2 ? 1 : 2, d === 2 ? 4 : 6);
  const b = nz(-9, 9), e = nz(-9, 9);
  need(d === 1 || a * c > 1);
  const Rr = [b * e, a * e + b * c, a * c];
  const text = `Multiply: (${lin(a, b)})(${lin(c, e)})`;
  const steps = [
    S('First: multiply the first terms', `${mono(a, 'x')} · ${mono(c, 'x')} = ${mono(a * c, 'x²')}`),
    S('Outer: multiply the outside terms', `${mono(a, 'x')} · ${pn(e)} = ${mono(a * e, 'x')}`),
    S('Inner: multiply the inside terms', `${pn(b)} · ${mono(c, 'x')} = ${mono(b * c, 'x')}`),
    S('Last: multiply the last terms', `${pn(b)} · ${pn(e)} = ${fmtN(b * e)}`),
    S('Add them and combine the like middle terms', tms([[a * c, 'x²'], [a * e, 'x'], [b * c, 'x'], [b * e, '']]), poly(Rr)),
  ];
  const alt = [poly([b * e, 0, a * c]), poly([b * e, -(a * e + b * c), a * c]), poly([b * e, b + e, a * c]), poly([-b * e, a * e + b * c, a * c]), poly([b * e, a * e - b * c, a * c])];
  return { type: 'written', text, fmt: 'Type like x^2 + 5x + 6 (x² works too).', answer: poly(Rr), check: chkExpanded(Rr), alt, steps, data: { coeffs: Rr } };
});

skill('square-binomial', 8, 'Square a binomial', 'Square a binomial', (d) => {
  const a = d === 1 ? 1 : ri(1, d === 2 ? 3 : 6), b = nz(d === 3 ? -12 : -9, d === 3 ? 12 : 9);
  need(d === 1 || a > 1 || d === 2);
  const Rr = [b * b, 2 * a * b, a * a];
  const text = `Expand: (${lin(a, b)})²`;
  const first = a === 1 ? 'x²' : `(${a}x)²`;
  const steps = [
    S(`Use the pattern (p ${b < 0 ? M : '+'} q)² = p² ${b < 0 ? M : '+'} 2pq + q² — the square of a binomial always has a middle term`, `${first} + 2(${mono(a, 'x')})(${fmtN(b)}) + (${fmtN(b)})²`),
    S('Simplify each term', tms([[a * a, 'x²'], [2 * a * b, 'x'], [b * b, '']])),
    S(`Not ${poly([b * b, 0, a * a])}: (p + q)² means (p + q)(p + q)`, poly(Rr)),
  ];
  const alt = [poly([b * b, 0, a * a]), poly([b * b, a * b, a * a]), poly([b * b, -2 * a * b, a * a]), poly([-b * b, 2 * a * b, a * a]), a > 1 ? poly([b * b, 2 * a * b, a]) : poly([2 * b, 2 * b, 1])];
  return { type: 'written', text, fmt: 'Type like x^2 + 6x + 9 (x² works too).', answer: poly(Rr), check: chkExpanded(Rr), alt, steps, data: { coeffs: Rr } };
});

/* ------------------------------------------------ Unit 9 · Factoring */
const bin = (p, q) => `(${lin(p, q)})`;
const prod2 = (p, q, r, s) => (p === r && q === s ? `${bin(p, q)}²` : `${bin(p, q)}${bin(r, s)}`);
skill('factor-trinomial', 9, 'Factor x² + bx + c', 'Factor a trinomial x² + bx + c', (d) => {
  const p = d === 1 ? ri(1, 9) : nz(-9, 9), q = d === 1 ? ri(1, 9) : nz(d === 3 ? -15 : -9, d === 3 ? 15 : 9);
  need(p + q !== 0 && (d === 3 || p !== q));
  const [u, v] = p <= q ? [p, q] : [q, p];
  const target = [p * q, p + q, 1];
  const answer = prod2(1, u, 1, v);
  const steps = [
    S(`Find two numbers that multiply to ${fmtN(p * q)} (the constant) and add to ${fmtN(p + q)} (the x-coefficient)`, `${fmtN(u)} × ${pn(v)} = ${fmtN(p * q)} and ${fmtN(u)} + ${pn(v)} = ${fmtN(p + q)}`),
    S('Use each number in a factor with x', answer),
    S('Check by multiplying back out (FOIL)', `${poly(target)} ✓`),
  ];
  const pairs = [];
  for (let r = -Math.abs(p * q); r <= Math.abs(p * q); r++) if (r && (p * q) % r === 0) { const s = (p * q) / r; if (r <= s && r + s !== p + q) pairs.push(prod2(1, r, 1, s)); }
  const alt = [prod2(1, -v, 1, -u), prod2(1, -u, 1, v), prod2(1, u, 1, -v), ...shuffle(pairs).slice(0, 2)];
  return { type: 'written', text: `Factor completely: ${poly(target)}`, fmt: 'Type a product like (x + 2)(x − 5).', answer, check: chkFactored(target), alt, steps, data: { coeffs: target, factors: [[u, 1], [v, 1]] } };
});

skill('factor-a', 9, 'Factor ax² + bx + c', 'Factor a trinomial ax² + bx + c', (d) => {
  let p, r;
  if (d === 1) { p = pick([2, 3]); r = 1; } else if (d === 2) { p = ri(2, 3); r = ri(1, 2); } else { p = ri(2, 4); r = ri(2, 3); }
  const q = nz(-7, 7), s = nz(-7, 7);
  need(gcd(p, q) === 1 && gcd(r, s) === 1 && p * s + q * r !== 0);
  const A = p * r, B = p * s + q * r, C = q * s;
  const target = [C, B, A];
  const answer = prod2(p, q, r, s);
  const m = p * s, n = q * r;
  const steps = [
    S('Multiply a · c', `${A} × ${pn(C)} = ${fmtN(A * C)}`),
    S(`Find two numbers that multiply to ${fmtN(A * C)} and add to ${fmtN(B)}`, `${fmtN(m)} and ${fmtN(n)}`),
    S('Split the middle term using those numbers', tms([[A, 'x²'], [m, 'x'], [n, 'x'], [C, '']])),
    S('Factor the GCF out of each pair', `${mono(p, 'x')}${bin(r, s)} ${q < 0 ? M : '+'} ${Math.abs(q) === 1 ? '' : Math.abs(q)}${bin(r, s)}`),
    S('Factor out the common binomial', answer),
  ];
  const alt = [prod2(p, -q, r, -s), prod2(p, s, r, q), prod2(p, -q, r, s), prod2(p, q, r, -s), prod2(A, q, 1, s)];
  return { type: 'written', text: `Factor completely: ${poly(target)}`, fmt: 'Type a product like (2x + 3)(x − 1).', answer, check: chkFactored(target, '(2x + 3)(x − 1)'), alt: alt.filter((w) => w !== answer), steps, data: { coeffs: target } };
});

skill('factor-dos', 9, 'Difference of squares', 'Factor a difference of squares', (d) => {
  const a = d === 1 ? 1 : ri(1, 3), b = ri(1, 12), g = d === 3 ? ri(2, 5) : 1;
  need(gcd(a, b) === 1 && (d === 1 || a > 1 || d === 3));
  const inner = [-b * b, 0, a * a];
  const target = pscale(inner, g);
  const core = `${bin(a, -b)}${bin(a, b)}`;
  const answer = (g > 1 ? g : '') + core;
  const steps = [];
  if (g > 1) steps.push(S(`Factor out the GCF, ${g}`, `${g}(${poly(inner)})`));
  steps.push(
    S('Both terms are perfect squares', `${a === 1 ? 'x² = x · x' : `${a * a}x² = (${a}x)²`} and ${b * b} = ${b}²`),
    S('Use p² − q² = (p − q)(p + q)', answer),
  );
  const alt = [(g > 1 ? g : '') + `${bin(a, -b)}²`, (g > 1 ? g : '') + `${bin(a, b)}²`, g > 1 ? core : `${bin(a * a, -b)}${bin(1, b)}`, (g > 1 ? g : '') + `${bin(a, -(b + 1))}${bin(a, b + 1)}`, (g > 1 ? g : '') + `${bin(a, -b * b)}${bin(a, 1)}`];
  return { type: 'written', text: `Factor completely: ${poly(target)}`, fmt: 'Type a product like (x − 4)(x + 4).', answer, check: chkFactored(target, '(x − 4)(x + 4)'), alt, steps, data: { coeffs: target } };
});

skill('factor-gcf', 9, 'Factor out the GCF', 'Factor out the greatest common factor', (d) => {
  const g = ri(2, 9), k = d === 1 ? 0 : d === 2 ? 1 : ri(1, 2);
  let inner;
  if (d < 3) { const p = ri(1, 7), q = nz(-9, 9); need(gcd(p, q) === 1); inner = [q, p]; }
  else { inner = [nz(-9, 9), nz(-9, 9), ri(1, 5)]; need(inner.reduce((s, c) => gcd(s, c), 0) === 1 && !isSquare(inner[1] ** 2 - 4 * inner[2] * inner[0])); }
  const xk = new Array(k).fill(0).concat([1]);
  const target = pscale(pmul(xk, inner), g);
  const gf = `${g}${powKey('x', k)}`;
  const answer = `${gf}(${poly(inner)})`;
  const coefs = target.filter(Boolean);
  const steps = [
    S('Find the GCF of the coefficients', `GCF of ${coefs.map((c) => Math.abs(c)).join(', ')} is ${g}`),
    S(k ? `Every term has at least ${powKey('x', k)}` : 'The constant term has no x, so x is not part of the GCF', `GCF = ${gf}`),
    S('Divide each term by the GCF', target.map((c, i) => [c, i]).filter(([c]) => c).reverse().map(([c, i]) => `${mono(c, powKey('x', i))} ÷ ${k ? `(${gf})` : gf} = ${mono(c / g, powKey('x', i - k))}`).join(', ')),
    S('Write the GCF times what is left', answer),
  ];
  const noConst = inner.slice(); noConst[0] = 0;
  const alt = [
    `${gf}(${poly(inner.map((c, i) => (i === 0 ? -c : c)))})`,
    k ? `${g}(${poly(inner)})` : `${g}x(${poly(inner)})`,
    `${gf}(${poly(inner.map((c, i) => (i === 0 ? c * g : c)))})`,
    `${gf}(${poly(noConst)})`,
    `${g + 1}${powKey('x', k)}(${poly(inner)})`,
  ];
  return { type: 'written', text: `Factor out the greatest common factor: ${poly(target)}`, fmt: `Type a product like ${k ? '3x(2x + 5)' : '3(2x + 5)'}.`, answer, check: chkFactored(target, k ? '3x(2x + 5)' : '3(2x + 5)'), alt, steps, data: { coeffs: target, gcf: g, k } };
});

/* --------------------------------------------- Unit 10 · Quadratics */
const rootsAns = (rs) => [...new Set(rs.map((r) => fVal(r)))].length === 1 ? `x = ${fStr(rs[0])}` : rs.slice().sort((a, b) => fVal(a) - fVal(b)).map((r) => `x = ${fStr(r)}`).join(', ');
skill('quad-solve', 10, 'Solve by factoring', 'Solve a quadratic equation by factoring', (d) => {
  let p = 1, q, r = 1, s, move = 0;
  const form = d === 1 ? 'monic' : d === 2 ? pick(['monic', 'zero', 'move']) : pick(['rational', 'move', 'double']);
  if (form === 'rational') { p = ri(2, 3); q = nz(-7, 7); s = nz(-7, 7); need(gcd(p, q) === 1); }
  else if (form === 'zero') { q = 0; s = nz(-9, 9); }
  else if (form === 'double') { q = nz(-9, 9); s = q; }
  else { q = d === 1 ? nz(-9, 9) : nz(-11, 11); s = nz(-9, 9); need(q !== s); }
  const target = [q * s, p * s + q * r, p * r];
  if (form === 'move') { move = target[0]; need(move !== 0 && target[1] !== 0); }
  const roots = [F(-q, p), F(-s, r)];
  const eq = form === 'move' ? `${poly([0, target[1], target[2]])} = ${fmtN(-move)}` : `${poly(target)} = 0`;
  const steps = [];
  if (form === 'move') steps.push(S(move > 0 ? `Add ${move} to both sides so one side is 0` : `Subtract ${-move} from both sides so one side is 0`, `${poly(target)} = 0`));
  const fac = q === 0 ? `x${bin(r, s)}` : prod2(p, q, r, s);
  steps.push(S('Factor the quadratic', `${fac} = 0`));
  if (form === 'double') steps.push(S('Both factors are the same, so there is one solution', `${lin(1, q)} = 0`, rootsAns(roots)));
  else {
    steps.push(S('Zero product property: if a product is 0, one of the factors is 0', `${q === 0 ? 'x' : lin(p, q)} = 0 or ${lin(r, s)} = 0`));
    steps.push(S('Solve each equation', `x = ${fStr(roots[0])} or x = ${fStr(roots[1])}`));
  }
  const answer = rootsAns(roots);
  const neg = roots.map((f) => F(-f.n, f.d));
  const alt = [rootsAns(neg), rootsAns([roots[0], neg[1]]), rootsAns([neg[0], roots[1]]), rootsAns([F(q), F(s)]), rootsAns([F(roots[0].n + 1, roots[0].d), roots[1]])];
  return { type: 'written', text: `Solve by factoring: ${eq}`, fmt: 'Type the solutions like x = 2, x = −3 (or 2, −3).', answer, check: chkRoots(roots.map(fVal)), alt, steps, data: { roots: [...new Set(roots.map(fVal))], coeffs: target } };
});

skill('discriminant', 10, 'The discriminant', 'Use the discriminant to count real solutions', (d) => {
  const kind = pick(['two', 'one', 'none']);
  let a, b, c;
  if (kind === 'one') { const k = d === 1 ? 1 : ri(1, 3), h = nz(-7, 7); a = k * k; b = 2 * k * h; c = h * h; if (d === 3 && coin()) { a = -a; b = -b; c = -c; } }
  else { a = d === 1 ? 1 : nz(-4, 5); b = nz(-10, 10); c = nz(-12, 12); }
  const D = b * b - 4 * a * c;
  need(kind === 'two' ? D > 0 : kind === 'none' ? D < 0 : D === 0);
  const count = (x) => (x > 0 ? 'two real solutions' : x === 0 ? 'one real solution' : 'no real solutions');
  const opt = (x) => `b² − 4ac = ${fmtN(x)}, so ${count(x)}`;
  const answer = opt(D);
  const cands = shuffle([b * b + 4 * a * c, -b * b - 4 * a * c, b - 4 * a * c, 4 * a * c - b * b, b * b - 2 * a * c]);
  const options = [answer];
  for (const x of [...cands, D + 4, D - 4, D + 8, -D]) { if (options.length === 4) break; const o = opt(x); if (x !== D && !options.includes(o)) options.push(o); }
  need(options.length === 4);
  return {
    type: 'mc', text: `Use the discriminant to find how many real solutions ${poly([c, b, a])} = 0 has.`, answer, options,
    steps: [
      S('Read off a, b and c from ax² + bx + c = 0', `a = ${fmtN(a)}, b = ${fmtN(b)}, c = ${fmtN(c)}`),
      S('Substitute into the discriminant b² − 4ac', `${pn(b)}² ${M} 4(${fmtN(a)})(${fmtN(c)}) = ${b * b} ${M} ${pn(4 * a * c)}`, `${fmtN(D)}`),
      S(D > 0 ? 'Positive discriminant: two real solutions' : D === 0 ? 'Zero discriminant: exactly one real solution' : 'Negative discriminant: no real solutions (you cannot take the square root of a negative)', answer),
    ],
    data: { a, b, c, D },
  };
});

skill('vertex', 10, 'Vertex x-coordinate', 'Find the x-coordinate of a parabola’s vertex', (d) => {
  const a = d === 1 ? 1 : pick([-3, -2, -1, 1, 2, 3, 4]), b = d === 1 ? 2 * nz(-6, 6) : nz(-12, 12), c = nz(-9, 9);
  const xv = F(-b, 2 * a);
  need(d === 3 || xv.d <= 2);
  const steps = [
    S('The vertex lies on the axis of symmetry, x = −b/(2a)', `a = ${fmtN(a)}, b = ${fmtN(b)}`),
    S('Substitute', `x = ${M}(${fmtN(b)})/(2 × ${pn(a)})`, `x = ${fmtN(-b)}/${pn(2 * a)}`),
    S('Simplify', `x = ${fStr(xv)}`),
  ];
  const v = fVal(xv);
  return {
    type: 'written', text: `Find the x-coordinate of the vertex of y = ${poly([c, b, a])}.`, fmt: 'Type a number or a fraction like 3/2.',
    answer: fStr(xv), check: chkNum(v, { v: 'x' }), num: v, fmtAlt: ratStr,
    alt: [fStr(F(b, 2 * a)), fStr(F(-b, a)), fStr(F(-2 * a, b)), fStr(F(-c, 2 * a))], steps, data: { value: v, a, b, c },
  };
});

/* ------------------------------------------------ Unit 11 · Radicals */
const SQFREE = [2, 3, 5, 6, 7, 10, 11, 13, 14, 15];
const radStr = (c, r) => (r === 1 ? fmtN(c) : `${c === 1 ? '' : c === -1 ? M : fmtN(c)}√${r}`);
function simplifyRad(n) { let k = 1; for (let i = 2; i * i <= n; i++) while (n % (i * i) === 0) { n /= i * i; k *= i; } return [k, n]; }
skill('simplify-root', 11, 'Simplify square roots', 'Simplify a square root', (d) => {
  const k = d === 1 ? ri(2, 3) : ri(2, 6), m = d === 1 ? pick([2, 3, 5, 6, 7]) : pick(SQFREE), c = d === 3 ? ri(2, 5) : 1;
  const n = k * k * m;
  const text = `Simplify: ${c === 1 ? '' : c}√${n}`;
  const answer = radStr(c * k, m);
  const lead = c === 1 ? '' : `${c} · `;
  const steps = [
    S('Find the largest perfect-square factor', `${n} = ${k * k} × ${m}`),
    S('Split the root', `${lead}√${n} = ${lead}√${k * k} · √${m}`),
    S(`Take the square root of the perfect square: √${k * k} = ${k}`, `${lead}${k}√${m}`),
  ];
  if (c > 1) steps.push(S(`Multiply by the ${c} in front`, `${c} × ${k}√${m}`, answer));
  const alt = [radStr(c * k * k, m), radStr(c * m, k * k === m ? 2 : k), radStr(c * (k + 1), m), radStr(c * k, m + 1 === 4 ? 5 : m + 1)];
  for (let j = 2; j < k; j++) if (k % j === 0) alt.unshift(radStr(c * j, n / (j * j)));
  if (c > 1) alt.push(radStr(k, m));
  return { type: 'written', text, fmt: 'Type like 6√2 (6sqrt2 or 6 root 2 work too).', answer, check: chkRad(c * k, m), alt, steps, data: { coef: c * k, radicand: m } };
});

skill('multiply-roots', 11, 'Multiply radicals', 'Multiply and simplify radicals', (d) => {
  const pickR = () => pick([2, 3, 5, 6, 7, 8, 10, 12, 14, 15, 18, 20]);
  const a = pickR(), b = pickR();
  const p = d === 1 ? 1 : ri(2, d === 2 ? 5 : 7), q = d === 1 ? 1 : ri(2, d === 2 ? 5 : 7);
  const [k, m] = simplifyRad(a * b);
  need(k > 1 && a !== b);
  const text = `Multiply and simplify: ${p === 1 ? '' : p}√${a} · ${q === 1 ? '' : q}√${b}`;
  const answer = radStr(p * q * k, m);
  const steps = [
    S(p * q === 1 ? 'Multiply the numbers under the roots' : 'Multiply the numbers outside, and multiply the numbers inside', `${p * q === 1 ? '' : p * q}√(${a} × ${b}) = ${p * q === 1 ? '' : p * q}√${a * b}`),
    m === 1 ? S(`${a * b} is a perfect square`, `√${a * b} = ${k}`) : S('Simplify the root: take out the largest perfect square', `√${a * b} = √${k * k} · √${m} = ${radStr(k, m)}`),
  ];
  if (p * q !== 1) steps.push(S('Multiply', `${p * q} × ${radStr(k, m)}`, answer));
  const alt = [radStr(p * q, a * b), radStr(p * q, a + b), radStr(p + q, a * b), radStr(p * q * k + 1, m), radStr(p * q * k * k, m)];
  return { type: 'written', text, fmt: 'Type like 6√2 (6sqrt2 works too).', answer, check: chkRad(p * q * k, m), alt, steps, data: { coef: p * q * k, radicand: m } };
});

const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41]];
function triangleSvg(a, b, c, missing) {
  // Legs a (vertical) and b (horizontal), drawn to scale inside 240 × 150.
  const s = Math.min(190 / b, 110 / a);
  const W = b * s, H = a * s, x0 = 40, y0 = 20;
  const lab = (t, isMissing) => (isMissing ? '?' : String(t));
  return `<svg class="alg-tri" viewBox="0 0 ${Math.ceil(x0 + W + 60)} ${Math.ceil(y0 + H + 40)}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`
    + `<polygon class="alg-tri-shape" points="${x0},${y0} ${x0},${y0 + H} ${x0 + W},${y0 + H}"/>`
    + `<polyline class="alg-tri-right" points="${x0},${y0 + H - 12} ${x0 + 12},${y0 + H - 12} ${x0 + 12},${y0 + H}"/>`
    + `<text class="alg-tri-label${missing === 'a' ? ' miss' : ''}" x="${x0 - 10}" y="${y0 + H / 2 + 5}" text-anchor="end">${lab(a, missing === 'a')}</text>`
    + `<text class="alg-tri-label${missing === 'b' ? ' miss' : ''}" x="${x0 + W / 2}" y="${y0 + H + 24}" text-anchor="middle">${lab(b, missing === 'b')}</text>`
    + `<text class="alg-tri-label${missing === 'c' ? ' miss' : ''}" x="${x0 + W / 2 + 12}" y="${y0 + H / 2 - 6}" text-anchor="start">${lab(c, missing === 'c')}</text>`
    + '</svg>';
}
skill('pythag', 11, 'Pythagorean theorem', 'Find a missing side of a right triangle', (d) => {
  const base = d === 3 ? pick(TRIPLES) : pick(TRIPLES.slice(0, 4));
  const k = d === 1 ? ri(1, 2) : ri(1, d === 2 ? 4 : 3);
  let [a, b, c] = base.map((x) => x * k);
  if (coin()) [a, b] = [b, a];
  const missing = d === 1 ? 'c' : pick(['c', 'a', 'b']);
  let text, ans, steps, alt;
  if (missing === 'c') {
    text = `A right triangle has legs of length ${a} and ${b}. How long is the hypotenuse?`;
    ans = c;
    steps = [S('Pythagorean theorem: leg² + leg² = hypotenuse²', 'a² + b² = c²'), S('Substitute the legs', `${a}² + ${b}² = c²`, `${a * a} + ${b * b} = c²`), S('Add', `${c * c} = c²`), S('Take the square root', `c = √${c * c}`, `c = ${c}`)];
    alt = [String(a + b), String(c * c), String(c + 1), String(Math.abs(a - b) || c - 1)];
  } else {
    const known = missing === 'a' ? b : a;
    text = `A right triangle has one leg of length ${known} and a hypotenuse of length ${c}. How long is the other leg?`;
    ans = missing === 'a' ? a : b;
    steps = [S('Pythagorean theorem: leg² + leg² = hypotenuse²', 'a² + b² = c²'), S('Substitute what you know', `${known}² + b² = ${c}²`, `${known * known} + b² = ${c * c}`), S(`Subtract ${known * known} from both sides`, `b² = ${c * c} ${M} ${known * known}`, `b² = ${ans * ans}`), S('Take the square root', `b = √${ans * ans}`, `b = ${ans}`)];
    alt = [String(c - known), String(ans * ans), String(Math.round(Math.sqrt(c * c + known * known) * 10) / 10), String(c + known)];
  }
  return {
    type: 'written', text, fmt: 'Type a number.', answer: String(ans), check: chkNum(ans), num: ans, fmtAlt: fmtN, alt, steps,
    figure: triangleSvg(a, b, c, missing), figureAlt: `Right triangle with legs ${missing === 'a' ? 'unknown' : a} and ${missing === 'b' ? 'unknown' : b} and hypotenuse ${missing === 'c' ? 'unknown' : c}.`,
    data: { value: ans, a, b, c, missing },
  };
});

/* ----------------------------------------------- Unit 12 · Statistics */
const median = (s) => { const n = s.length, h = Math.floor(n / 2); return n % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };
skill('center-spread', 12, 'Mean, median, mode & range', 'Find the mean, median, mode or range', (d) => {
  const stat = pick(d === 1 ? ['median', 'mode', 'range', 'mean'] : ['mean', 'median', 'mode', 'range']);
  const n = ri(d === 1 ? 5 : 6, d === 3 ? 10 : 8), hi = d === 3 ? 99 : 30;
  let data;
  if (stat === 'mode') {
    const vals = shuffle(Array.from({ length: hi }, (_, i) => i + 1)).slice(0, n - (d === 3 ? 2 : 1));
    data = shuffle([...vals, vals[0], ...(d === 3 ? [vals[0]] : [])]);
  } else data = Array.from({ length: n }, () => ri(1, hi));
  if (stat === 'mean') {
    const sum = data.reduce((s, x) => s + x, 0);
    const fix = (n - (sum % n)) % n;
    data[n - 1] += fix;
    need(data[n - 1] <= hi + n);
  }
  const sorted = data.slice().sort((x, y) => x - y);
  const sum = data.reduce((s, x) => s + x, 0);
  let v, steps;
  if (stat === 'mean') {
    v = sum / n;
    steps = [S('Add all the values', `${data.join(' + ')} = ${sum}`), S(`Divide by how many values there are (${n})`, `${sum} ÷ ${n}`, `mean = ${fmtN(v)}`)];
  } else if (stat === 'median') {
    v = median(sorted);
    const h = Math.floor(n / 2);
    steps = [S('Put the values in order', sorted.join(', ')), n % 2
      ? S(`With ${n} values, the middle one is the ${ordinal(h + 1)}`, `median = ${fmtN(v)}`)
      : S(`With ${n} values there are two middle ones, ${sorted[h - 1]} and ${sorted[h]}: average them`, `(${sorted[h - 1]} + ${sorted[h]}) ÷ 2`, `median = ${fmtN(v)}`)];
  } else if (stat === 'mode') {
    const counts = {}; for (const x of data) counts[x] = (counts[x] || 0) + 1;
    const top = Math.max(...Object.values(counts));
    const modes = Object.keys(counts).filter((k) => counts[k] === top);
    need(modes.length === 1 && top > 1);
    v = Number(modes[0]);
    steps = [S('Put the values in order so repeats sit together', sorted.join(', ')), S(`${v} appears ${top} times — more than any other value`, `mode = ${v}`)];
  } else {
    v = sorted[n - 1] - sorted[0];
    steps = [S('Find the largest and smallest values', `largest = ${sorted[n - 1]}, smallest = ${sorted[0]}`), S('Range = largest − smallest', `${sorted[n - 1]} ${M} ${sorted[0]}`, `range = ${v}`)];
  }
  const others = { mean: sum / n, median: median(sorted), range: sorted[n - 1] - sorted[0], unsorted: median(data) };
  const alt = Object.entries(others).filter(([k]) => k !== stat).map(([, x]) => fmtN(Math.round(x * 100) / 100));
  alt.push(fmtN(sorted[n - 1]), fmtN(sum));
  return { type: 'written', text: `Find the ${stat} of this data set: ${data.join(', ')}`, fmt: 'Type a number.', answer: fmtN(v), check: chkNum(v), num: v, fmtAlt: fmtN, alt, steps, data: { value: v, stat, values: data } };
});

skill('iqr', 12, 'Interquartile range', 'Find the interquartile range', (d) => {
  const n = d === 1 ? pick([7, 8]) : d === 2 ? ri(8, 10) : ri(9, 11);
  const hi = d === 3 ? 90 : 40;
  const data = Array.from({ length: n }, () => ri(1, hi));
  const s = data.slice().sort((a, b) => a - b);
  const h = Math.floor(n / 2);
  const lower = s.slice(0, h), upper = s.slice(n % 2 ? h + 1 : h);
  const q1 = median(lower), q3 = median(upper), iqr = q3 - q1;
  const steps = [
    S('Put the values in order', s.join(', ')),
    S(n % 2 ? `There are ${n} values (odd), so the median ${s[h]} is left out of both halves` : `There are ${n} values (even), so split them into two halves of ${h}`, `median = ${fmtN(median(s))}`),
    S('Lower half', lower.join(', '), `Q1 = ${fmtN(q1)}`),
    S('Upper half', upper.join(', '), `Q3 = ${fmtN(q3)}`),
    S('IQR = Q3 − Q1', `${fmtN(q3)} ${M} ${fmtN(q1)}`, `IQR = ${fmtN(iqr)}`),
  ];
  const incl = n % 2 ? median(s.slice(h)) - median(s.slice(0, h + 1)) : null;
  const alt = [fmtN(s[n - 1] - s[0]), incl != null ? fmtN(incl) : null, fmtN(q3), fmtN(q1), fmtN(iqr + 1)];
  return {
    type: 'written', text: `Find the interquartile range (IQR) of this data set: ${data.join(', ')}. Use the median of each half; when there is an odd number of values, leave the middle value out of both halves.`,
    fmt: 'Type a number.', answer: fmtN(iqr), check: chkNum(iqr), num: iqr, fmtAlt: fmtN, alt, steps, data: { value: iqr, q1, q3, values: data },
  };
});

/* =========================================================== more skills
   The rest of a standard Algebra 1 course: literal equations, absolute
   value, compound inequalities, domain and range, point-slope form,
   parallel and perpendicular lines, systems of inequalities, geometric
   sequences, exponential functions, monomial × polynomial, factoring by
   grouping, the quadratic formula, completing the square, adding radicals
   and lines of fit. Each skill joins its unit's list above. */

/* ---- compound inequalities: reading and checking ----
   A typed answer becomes a list of "or" branches, each a list of "and"
   conditions { op, v } meaning x op v: "−2 < x ≤ 3", "x < −1 or x ≥ 4",
   "x > −2 and x ≤ 3", "3 ≥ x > −2". */
const OPCH = { l: '<', L: '≤', g: '>', G: '≥' };
const OPREV = { l: 'g', L: 'G', g: 'l', G: 'L' };
function readCompound(s) {
  // Only x is a letter here, so "or"/"and" can be found even without spaces: "x<2orx>5".
  const t = prep(s).replace(/\s*or\s*/g, '#').replace(/\s*and\s*/g, '&').replace(/,/g, '&')
    .replace(/≤|⩽|=<|<=/g, 'L').replace(/≥|⩾|=>|>=/g, 'G').replace(/</g, 'l').replace(/>/g, 'g').replace(/\s+/g, '');
  if (!t) return null;
  const ors = [];
  for (const branch of t.split('#')) {
    const conds = [];
    for (const part of branch.split('&')) {
      let m = /^([^lLgGx]+)([lLgG])x([lLgG])([^lLgGx]+)$/.exec(part);
      if (m) {
        const a = readNum(m[1]), b = readNum(m[4]);
        if (!a || !b) return null;
        conds.push({ op: OPREV[m[2]], v: a.v }, { op: m[3], v: b.v });
        continue;
      }
      if ((m = /^x([lLgG])([^lLgGx]+)$/.exec(part))) { const a = readNum(m[2]); if (!a) return null; conds.push({ op: m[1], v: a.v }); continue; }
      if ((m = /^([^lLgGx]+)([lLgG])x$/.exec(part))) { const a = readNum(m[1]); if (!a) return null; conds.push({ op: OPREV[m[2]], v: a.v }); continue; }
      return null;
    }
    ors.push(conds);
  }
  return ors;
}
const condHolds = ({ op, v }, x) => (op === 'l' ? x < v - 1e-9 : op === 'L' ? x <= v + 1e-9 : op === 'g' ? x > v + 1e-9 : x >= v - 1e-9);
const compTruth = (ors) => (x) => ors.some((conds) => conds.every((c) => condHolds(c, x)));
/** Same solution set: compared at every endpoint, just beside each, and far out. */
function sameSet(f, g, ends) {
  const pts = [-1e4, 1e4];
  for (const e of ends) pts.push(e, e - 0.25, e + 0.25, e - 1e-3, e + 1e-3);
  return pts.every((x) => f(x) === g(x));
}
/** Checker for a compound (or single) inequality answer with solution set `truth`. */
function chkCompound(truth, ends, { reversed = false, example = '−2 < x ≤ 3' } = {}) {
  return (input) => {
    const ors = readCompound(input);
    if (!ors) return no(`Type it like ${example} (≤ and ≥ work, or <= and >=).`);
    const f = compTruth(ors);
    const theirs = ors.flat().map((c) => c.v);
    const all = [...new Set([...ends, ...theirs])];
    if (sameSet(f, truth, all)) return true;
    const sameEnds = theirs.length === ends.length && ends.every((e) => theirs.some((v) => near(v, e)));
    if (sameEnds) {
      // Right endpoints: either an endpoint is in or out wrongly, or the pieces point the wrong way.
      const mids = [...ends.map((e) => e - 0.5), ...ends.map((e) => e + 0.5)];
      if (mids.every((x) => f(x) === truth(x)) && ends.some((e) => f(e) !== truth(e))) return no('Check whether each endpoint is included: < and > leave it out, ≤ and ≥ include it.');
      if (reversed) return no('Check the directions — dividing by a negative number reverses the inequality signs.');
      return no('Check the directions of the inequality signs.');
    }
    if (ors.length === 1 && ors[0].length === 1 && ends.length === 2) return no('This one has two boundary points — the answer has two parts.');
    return false;
  };
}
const OPS_ASCII = { '<': 'l', '≤': 'L', '>': 'g', '≥': 'G' };
const REV_SYM = { '<': '>', '>': '<', '≤': '≥', '≥': '≤' };

/* ---------------- Unit 2 · literal equations (multiple choice) ---------------- */
const LIT = [
  { eq: 'A = lw', v: 'w', ans: 'w = A/l', wrong: ['w = Al', 'w = l/A', 'w = A − l'], steps: [['Divide both sides by l', 'A/l = lw/l', 'A/l = w']] },
  { eq: 'A = lw', v: 'l', ans: 'l = A/w', wrong: ['l = Aw', 'l = w/A', 'l = A − w'], steps: [['Divide both sides by w', 'A/w = lw/w', 'A/w = l']] },
  { eq: 'd = rt', v: 't', ans: 't = d/r', wrong: ['t = dr', 't = r/d', 't = d − r'], steps: [['Divide both sides by r', 'd/r = rt/r', 'd/r = t']] },
  { eq: 'd = rt', v: 'r', ans: 'r = d/t', wrong: ['r = dt', 'r = t/d', 'r = d − t'], steps: [['Divide both sides by t', 'd/t = rt/t', 'd/t = r']] },
  { eq: 'I = Prt', v: 'r', ans: 'r = I/(Pt)', wrong: ['r = IPt', 'r = Pt/I', 'r = I − Pt'], steps: [['r is multiplied by P and t, so divide both sides by Pt', 'I/(Pt) = Prt/(Pt)', 'I/(Pt) = r']] },
  { eq: 'V = lwh', v: 'h', ans: 'h = V/(lw)', wrong: ['h = Vlw', 'h = lw/V', 'h = V − lw'], steps: [['h is multiplied by l and w, so divide both sides by lw', 'V/(lw) = lwh/(lw)', 'V/(lw) = h']] },
  { eq: 'P = 2l + 2w', v: 'l', ans: 'l = (P − 2w)/2', wrong: ['l = P/2 − 2w', 'l = (P + 2w)/2', 'l = P − w/2', 'l = (P − w)/2'], steps: [['Subtract 2w from both sides', 'P − 2w = 2l + 2w − 2w', 'P − 2w = 2l'], ['Divide both sides by 2 — the whole side, not just one term', '(P − 2w)/2 = 2l/2', 'l = (P − 2w)/2']] },
  { eq: 'P = 2l + 2w', v: 'w', ans: 'w = (P − 2l)/2', wrong: ['w = P/2 − 2l', 'w = (P + 2l)/2', 'w = (P − l)/2'], steps: [['Subtract 2l from both sides', 'P − 2l = 2l + 2w − 2l', 'P − 2l = 2w'], ['Divide both sides by 2 — the whole side, not just one term', '(P − 2l)/2 = 2w/2', 'w = (P − 2l)/2']] },
  { eq: 'y = mx + b', v: 'm', ans: 'm = (y − b)/x', wrong: ['m = y/x − b', 'm = (y + b)/x', 'm = x/(y − b)', 'm = y − b − x'], steps: [['Subtract b from both sides', 'y − b = mx + b − b', 'y − b = mx'], ['Divide both sides by x', '(y − b)/x = mx/x', 'm = (y − b)/x']] },
  { eq: 'y = mx + b', v: 'x', ans: 'x = (y − b)/m', wrong: ['x = y/m − b', 'x = (y + b)/m', 'x = m/(y − b)', 'x = y − b − m'], steps: [['Subtract b from both sides', 'y − b = mx + b − b', 'y − b = mx'], ['Divide both sides by m', '(y − b)/m = mx/m', 'x = (y − b)/m']] },
  { eq: 'A = (1/2)bh', v: 'h', ans: 'h = 2A/b', wrong: ['h = A/(2b)', 'h = A/b', 'h = b/(2A)', 'h = 2Ab'], steps: [['Multiply both sides by 2 to clear the fraction', '2A = 2 · (1/2)bh', '2A = bh'], ['Divide both sides by b', '2A/b = bh/b', 'h = 2A/b']] },
  { eq: 'F = (9/5)C + 32', v: 'C', ans: 'C = (5/9)(F − 32)', wrong: ['C = (5/9)F − 32', 'C = (9/5)(F − 32)', 'C = (5/9)(F + 32)'], steps: [['Subtract 32 from both sides', 'F − 32 = (9/5)C + 32 − 32', 'F − 32 = (9/5)C'], ['Multiply both sides by 5/9, the reciprocal of 9/5', '(5/9)(F − 32) = (5/9)(9/5)C', 'C = (5/9)(F − 32)']] },
  { eq: 'ax + b = c', v: 'x', ans: 'x = (c − b)/a', wrong: ['x = c/a − b', 'x = (c + b)/a', 'x = a/(c − b)', 'x = c − b − a'], steps: [['Subtract b from both sides', 'ax + b − b = c − b', 'ax = c − b'], ['Divide both sides by a', 'ax/a = (c − b)/a', 'x = (c − b)/a']] },
];
skill('literal', 2, 'Literal equations', 'Solve a formula for one of its variables', (d) => {
  if (d === 1 || (d === 2 && coin(0.6))) {
    const T = pick(d === 1 ? LIT.slice(0, 6) : LIT);
    const wrong = shuffle(T.wrong).slice(0, 3);
    return { type: 'mc', text: `Solve ${T.eq} for ${T.v}.`, answer: T.ans, options: [T.ans, ...wrong], steps: T.steps.map(([w, m, r]) => S(w, m, r)), data: { eq: T.eq, v: T.v } };
  }
  // ax + by = c for y: a number version, answered in slope-intercept form.
  const A = nz(-6, 6), B = nzNot1(-5, 6), C = nz(-12, 12);
  need(Math.abs(A) !== Math.abs(B));
  const m = F(-A, B), b = F(C, B);
  const answer = lineStr(m, b);
  const cands = [lineStr(F(A, B), b), lineStr(F(-A), b), lineStr(m, F(C)), lineStr(F(-A), F(C)), lineStr(F(A, B), F(-C, B)), lineStr(F(-B, A), F(C, A))];
  const wrong = shuffle([...new Set(cands)].filter((w) => w !== answer)).slice(0, 3);
  need(wrong.length === 3);
  const ax = mono(Math.abs(A), 'x'), op = A > 0 ? M : '+';
  const steps = [
    S(`${A > 0 ? 'Subtract' : 'Add'} ${ax} ${A > 0 ? 'from' : 'to'} both sides to get the y-term alone`, `${tms([[A, 'x'], [B, 'y']])} ${op} ${ax} = ${fmtN(C)} ${op} ${ax}`, `${mono(B, 'y')} = ${tms([[-A, 'x'], [C, '']])}`),
    S(`Divide both sides by ${fmtN(B)} — every term on the right, not just one`, `y = (${tms([[-A, 'x'], [C, '']])})/${pn(B)}`, answer),
  ];
  return { type: 'mc', text: `Solve ${eqStr(A, B, C)} for y.`, answer, options: [answer, ...wrong], steps, data: { A, B, C, m: fVal(m), b: fVal(b) } };
});

/* ---------------- Unit 2 · absolute-value equations ---------------- */
skill('abs-eq', 2, 'Absolute-value equations', 'Solve an absolute-value equation', (d) => {
  const kind = d >= 2 && coin(0.18) ? 'none' : d === 3 && coin(0.07) ? 'zero' : 'two';
  const a = d === 1 ? 1 : pick([1, 1, 2, 3]), b = nz(-9, 9);
  const p = d === 3 ? ri(2, 4) : 1, q = d === 1 ? 0 : d === 2 ? (coin(0.4) ? nz(-9, 9) : 0) : nz(-9, 9);
  const c = kind === 'none' ? -ri(1, 9) : kind === 'zero' ? 0 : ri(1, 12);
  const roots = kind === 'none' ? [] : kind === 'zero' ? [F(-b, a)] : [F(-c - b, a), F(c - b, a)];
  need(roots.every((r) => r.d === 1));
  const r = p * c + q;
  const inner = lin(a, b);
  const absT = `${p === 1 ? '' : p}|${inner}|`;
  const lhs = q ? `${absT} ${q < 0 ? M : '+'} ${Math.abs(q)}` : absT;
  const text = `Solve: ${lhs} = ${fmtN(r)}`;
  const steps = [];
  if (q) steps.push(S(`${q > 0 ? 'Subtract' : 'Add'} ${Math.abs(q)} ${q > 0 ? 'from' : 'to'} both sides to get the absolute value alone`, `${lhs} ${q > 0 ? M : '+'} ${Math.abs(q)} = ${fmtN(r)} ${q > 0 ? M : '+'} ${Math.abs(q)}`, `${absT} = ${fmtN(r - q)}`));
  if (p !== 1) steps.push(S(`Divide both sides by ${p}`, `${absT} ÷ ${p} = ${fmtN(r - q)} ÷ ${p}`, `|${inner}| = ${fmtN(c)}`));
  let answer;
  if (kind === 'none') {
    steps.push(S('An absolute value is a distance, so it is never negative', `|${inner}| = ${fmtN(c)}`, 'No value of x works: no solution'));
    answer = 'No solution';
  } else if (kind === 'zero') {
    steps.push(S('Only 0 has an absolute value of 0', `${inner} = 0`), ...linSolve(a, b, 0, 0).steps);
    answer = rootsAns(roots);
  } else {
    steps.push(S(`The expression inside is ${c} or ${fmtN(-c)} (both are ${c} away from 0)`, `${inner} = ${c} or ${inner} = ${fmtN(-c)}`));
    if (b) steps.push(S(`${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)} ${b > 0 ? 'from' : 'to'} both sides of each`, `${mono(a, 'x')} = ${fmtN(c - b)} or ${mono(a, 'x')} = ${fmtN(-c - b)}`));
    if (a !== 1) steps.push(S(`Divide both sides of each by ${a}`, `x = ${fmtN(c - b)} ÷ ${a} or x = ${fmtN(-c - b)} ÷ ${a}`));
    steps.push(S('Both solutions', rootsAns(roots)));
    answer = rootsAns(roots);
  }
  const alt = kind === 'none' ? [rootsAns([F(-c - b, a), F(c - b, a)]), rootsAns([F(c - b, a)]), 'x = 0']
    : kind === 'zero' ? ['No solution', rootsAns([F(b, a)]), 'x = 0']
      : [rootsAns([F(c - b, a)]), rootsAns([F(c + b, a), F(-c + b, a)]), 'No solution', rootsAns([F(c - b, a), F(c + b, a)])];
  return {
    type: 'written', text, fmt: 'Type the solutions like x = −7, x = 1 — or type "no solution".',
    answer, check: chkRoots(roots.map(fVal), { example: 'x = −7, x = 1' }), alt, steps, data: { roots: roots.map(fVal), kind },
  };
});

/* ---------------- Unit 3 · compound inequalities ---------------- */
skill('compound', 3, 'Compound inequalities', 'Solve a compound inequality', (d) => {
  const kind = d === 1 ? 'and' : pick(['and', 'and', 'or']);
  const a = d === 1 ? ri(1, 3) : d === 2 ? ri(1, 4) : nzNot1(-4, 4);
  const b = nz(-9, 9);
  const L = ri(-8, 4), H = L + ri(2, 8);
  const steps = [];
  let text, answer, truth, alt;
  const flipNote = a < 0 ? ' — dividing by a negative reverses the inequality signs' : '';
  if (kind === 'and') {
    const o1 = pick(['<', '≤']), o2 = pick(['<', '≤']);                  // x's own relations: L o1 x o2 H
    // In the prompt the expression is between lo and hi; a negative a swaps them.
    const lo = a > 0 ? a * L + b : a * H + b, hi = a > 0 ? a * H + b : a * L + b;
    const p1 = a > 0 ? o1 : o2, p2 = a > 0 ? o2 : o1;
    text = `Solve: ${fmtN(lo)} ${p1} ${lin(a, b)} ${p2} ${fmtN(hi)}`;
    if (b) steps.push(S(`${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)} ${b > 0 ? 'from' : 'to'} all three parts`, `${fmtN(lo)} ${b > 0 ? M : '+'} ${Math.abs(b)} ${p1} ${lin(a, b)} ${b > 0 ? M : '+'} ${Math.abs(b)} ${p2} ${fmtN(hi)} ${b > 0 ? M : '+'} ${Math.abs(b)}`, `${fmtN(lo - b)} ${p1} ${mono(a, 'x')} ${p2} ${fmtN(hi - b)}`));
    if (a !== 1) {
      const r1 = a < 0 ? REV_SYM[p1] : p1, r2 = a < 0 ? REV_SYM[p2] : p2;
      steps.push(S(`Divide all three parts by ${fmtN(a)}${flipNote}`, `${fmtN(lo - b)} ÷ ${pn(a)} ${r1} ${mono(a, 'x')} ÷ ${pn(a)} ${r2} ${fmtN(hi - b)} ÷ ${pn(a)}`, `${fmtN((lo - b) / a)} ${r1} x ${r2} ${fmtN((hi - b) / a)}`));
    }
    answer = `${fmtN(L)} ${o1} x ${o2} ${fmtN(H)}`;
    if (a < 0) steps.push(S('Rewrite it from least to greatest', answer));
    truth = (x) => (o1 === '<' ? x > L : x >= L) && (o2 === '<' ? x < H : x <= H);
    alt = [`${fmtN(L)} ${STRICT[o1]} x ${o2} ${fmtN(H)}`, `${fmtN(L)} ${o1} x ${STRICT[o2]} ${fmtN(H)}`, `x ${REV_SYM[o1]} ${fmtN(L)} or x ${REV_SYM[o2]} ${fmtN(H)}`, `${fmtN(-H)} ${o1} x ${o2} ${fmtN(-L)}`, `${fmtN(L + 1)} ${o1} x ${o2} ${fmtN(H + 1)}`];
  } else {
    const oL = pick(['<', '≤']), oH = pick(['>', '≥']);                  // x oL L or x oH H
    const e1 = a > 0 ? oL : REV_SYM[oL], e2 = a > 0 ? oH : REV_SYM[oH];
    const v1 = a * L + b, v2 = a * H + b;
    text = `Solve: ${lin(a, b)} ${e1} ${fmtN(v1)} or ${lin(a, b)} ${e2} ${fmtN(v2)}`;
    if (b) steps.push(S(`${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)} ${b > 0 ? 'from' : 'to'} both sides of each inequality`, `${mono(a, 'x')} ${e1} ${fmtN(v1 - b)} or ${mono(a, 'x')} ${e2} ${fmtN(v2 - b)}`));
    if (a !== 1) steps.push(S(`Divide both sides of each by ${fmtN(a)}${flipNote}`, `x ${oL} ${fmtN(L)} or x ${oH} ${fmtN(H)}`));
    answer = `x ${oL} ${fmtN(L)} or x ${oH} ${fmtN(H)}`;
    truth = (x) => (oL === '<' ? x < L : x <= L) || (oH === '>' ? x > H : x >= H);
    alt = [`${fmtN(L)} ${REV_SYM[oL]} x ${REV_SYM[oH]} ${fmtN(H)}`, `x ${STRICT[oL]} ${fmtN(L)} or x ${oH} ${fmtN(H)}`, `x ${REV_SYM[oL]} ${fmtN(L)} or x ${REV_SYM[oH]} ${fmtN(H)}`, `x ${oL} ${fmtN(-H)} or x ${oH} ${fmtN(-L)}`];
  }
  steps.push(S(kind === 'and' ? `"And": x must satisfy both parts, so it lies between ${fmtN(L)} and ${fmtN(H)}` : `"Or": x may satisfy either part, so the graph is two rays pointing away from each other`, answer));
  return {
    type: 'written', text, fmt: kind === 'and' ? 'Type it like −2 < x ≤ 3 (<= and >= work too).' : 'Type it like x < −1 or x >= 4.',
    answer, check: chkCompound(truth, [L, H], { reversed: a < 0, example: kind === 'and' ? '−2 < x ≤ 3' : 'x < −1 or x ≥ 4' }), alt, steps, data: { kind, ends: [L, H] },
  };
});

/* ---------------- Unit 3 · absolute-value inequalities (multiple choice) ---------------- */
skill('abs-ineq', 3, 'Absolute-value inequalities', 'Solve an absolute-value inequality', (d) => {
  const a = d === 1 ? 1 : d === 2 ? pick([1, 1, 2]) : pick([2, 3]);
  const b = nz(-9, 9), r = ri(1, 9) * a;
  const op = pick(['<', '≤', '>', '≥']);
  const L = (-r - b) / a, H = (r - b) / a;
  need(isInt(L) && isInt(H));
  const less = op === '<' || op === '≤';
  const inner = lin(a, b);
  const text = `Solve: |${inner}| ${op} ${r}`;
  const between = (o, lo, hi) => `${fmtN(lo)} ${o} x ${o} ${fmtN(hi)}`;
  const outside = (o, lo, hi) => `x ${REV_SYM[o]} ${fmtN(lo)} or x ${o} ${fmtN(hi)}`;
  const opOut = less ? REV_SYM[op] : op;                                  // > or ≥
  const opIn = less ? op : REV_SYM[op];                                   // < or ≤
  const answer = less ? between(opIn, L, H) : outside(opOut, L, H);
  const wrong = [
    less ? outside(REV_SYM[opIn], L, H) : between(REV_SYM[opOut], L, H),      // "and" and "or" mixed up
    less ? between(opIn, -H, -L) : outside(opOut, -H, -L),                   // sign of the center
    less ? `x ${opIn} ${fmtN(H)}` : `x ${opOut} ${fmtN(H)}`,                 // dropped the negative case
    less ? between(STRICT[opIn], L, H) : outside(STRICT[opOut], L, H),       // endpoint in/out
  ].filter((w) => w !== answer);
  const options = [answer, ...shuffle([...new Set(wrong)]).slice(0, 3)];
  need(options.length === 4);
  const steps = [
    less ? S(`"Less than" means ${inner} is within ${r} of 0, so it lies between ${fmtN(-r)} and ${r}`, `${fmtN(-r)} ${opIn} ${inner} ${opIn} ${r}`)
      : S(`"Greater than" means ${inner} is more than ${r} away from 0, so it is below ${fmtN(-r)} or above ${r}`, `${inner} ${REV_SYM[opOut]} ${fmtN(-r)} or ${inner} ${opOut} ${r}`),
  ];
  if (b) steps.push(S(`${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)} ${b > 0 ? 'from' : 'to'} every part`, less ? `${fmtN(-r - b)} ${opIn} ${mono(a, 'x')} ${opIn} ${fmtN(r - b)}` : `${mono(a, 'x')} ${REV_SYM[opOut]} ${fmtN(-r - b)} or ${mono(a, 'x')} ${opOut} ${fmtN(r - b)}`));
  if (a !== 1) steps.push(S(`Divide every part by ${a}`, answer));
  if (steps[steps.length - 1].math !== answer) steps.push(S('Solution', answer));
  return { type: 'mc', text, answer, options, steps, data: { a, b, r, op, ends: [L, H] } };
});

/* ---------------- Unit 4 · domain and range (multiple choice) ---------------- */
const setStr = (vals) => `{${[...new Set(vals)].sort((p, q) => p - q).map(fmtN).join(', ')}}`;
skill('domain-range', 4, 'Domain & range', 'Find the domain or range', (d) => {
  const form = d === 1 ? 'set' : d === 2 ? pick(['set', 'sqrt', 'linear']) : pick(['sqrt', 'quad', 'quad', 'set']);
  const want = pick(['domain', 'range']);
  let text, answer, wrong, steps;
  if (form === 'set') {
    const n = ri(4, 5);
    const xs = shuffle(Array.from({ length: 13 }, (_, i) => i - 6)).slice(0, n);
    const ys = xs.map(() => ri(-6, 9));
    ys[1] = ys[0];                                                         // a repeated y-value
    const pairs = xs.map((x, i) => `(${fmtN(x)}, ${fmtN(ys[i])})`);
    text = `What is the ${want} of the relation {${pairs.join(', ')}}?`;
    const mine = want === 'domain' ? xs : ys, other = want === 'domain' ? ys : xs;
    answer = setStr(mine);
    const drop = [...new Set(mine)].sort((p, q) => p - q).slice(1);
    wrong = [setStr(other), setStr([...xs, ...ys]), setStr(drop.length ? drop : [...mine, 99]), setStr([...mine, pick(other.filter((v) => !mine.includes(v))) ?? 0])];
    steps = [
      S(`The ${want} is the set of ${want === 'domain' ? 'x-values (first numbers)' : 'y-values (second numbers)'} in the pairs`, mine.map(fmtN).join(', ')),
      S('List each value once, from least to greatest', answer),
    ];
  } else if (form === 'sqrt') {
    const h = nz(-9, 9), k = ri(-6, 6);
    const f = `√(${lin(1, -h)})${k ? ` ${k < 0 ? M : '+'} ${Math.abs(k)}` : ''}`;
    text = `What is the ${want} of f(x) = ${f}?`;
    if (want === 'domain') {
      answer = `x ≥ ${fmtN(h)}`;
      wrong = [`x ≥ ${fmtN(-h)}`, `x > ${fmtN(h)}`, `x ≤ ${fmtN(h)}`, 'All real numbers'];
      steps = [S('The expression under a square root cannot be negative', `${lin(1, -h)} ≥ 0`), S(`${h > 0 ? 'Add' : 'Subtract'} ${Math.abs(h)} ${h > 0 ? 'to' : 'from'} both sides`, answer)];
    } else {
      answer = `y ≥ ${fmtN(k)}`;
      wrong = [`y ≥ ${fmtN(h)}`, `y ≤ ${fmtN(k)}`, `y > ${fmtN(k)}`, 'All real numbers'];
      steps = [S('A square root is never negative: its smallest value is 0', `√(${lin(1, -h)}) ≥ 0`), S(k ? `The ${k > 0 ? '+' : M} ${Math.abs(k)} shifts every output ${k > 0 ? 'up' : 'down'} by ${Math.abs(k)}` : 'Nothing is added, so the outputs start at 0', answer)];
    }
  } else if (form === 'quad') {
    const a = pick([-3, -2, -1, 1, 2, 3]), h = nz(-6, 6), k = ri(-9, 9);
    const f = `${a === 1 ? '' : a === -1 ? M : fmtN(a)}(${lin(1, -h)})²${k ? ` ${k < 0 ? M : '+'} ${Math.abs(k)}` : ''}`;
    text = `What is the ${want} of f(x) = ${f}?`;
    if (want === 'domain') {
      answer = 'All real numbers';
      wrong = [`x ≥ ${fmtN(h)}`, `x ≤ ${fmtN(h)}`, `x ≥ ${fmtN(k)}`, `y ${a > 0 ? '≥' : '≤'} ${fmtN(k)}`];
      steps = [S('You can square any number, so every x-value works', answer)];
    } else {
      answer = `y ${a > 0 ? '≥' : '≤'} ${fmtN(k)}`;
      wrong = [`y ${a > 0 ? '≤' : '≥'} ${fmtN(k)}`, `y ${a > 0 ? '≥' : '≤'} ${fmtN(h)}`, 'All real numbers', `y ${a > 0 ? '>' : '<'} ${fmtN(k)}`];
      steps = [
        S(`(${lin(1, -h)})² is never negative; it is 0 when x = ${fmtN(h)}`, `f(${fmtN(h)}) = ${fmtN(k)}`),
        S(a > 0 ? `a = ${fmtN(a)} is positive: the parabola opens up, so ${fmtN(k)} is the smallest output` : `a = ${fmtN(a)} is negative: the parabola opens down, so ${fmtN(k)} is the largest output`, answer),
      ];
    }
  } else {
    const m = nz(-6, 6), b = nz(-9, 9);
    text = `What is the ${want} of f(x) = ${lin(m, b)}?`;
    answer = 'All real numbers';
    wrong = want === 'domain' ? ['x ≥ 0', `x ≥ ${fmtN(b)}`, 'x > 0', `x ≥ ${fmtN(m)}`] : ['y ≥ 0', `y ≥ ${fmtN(b)}`, `y ≥ ${fmtN(m)}`, 'y > 0'];
    steps = [S(want === 'domain' ? 'Any number can be put in for x' : `A line that is not horizontal (slope ${fmtN(m)}) reaches every y-value`, answer)];
  }
  const options = [answer, ...shuffle([...new Set(wrong)].filter((w) => w !== answer)).slice(0, 3)];
  need(options.length === 4);
  return { type: 'mc', text, answer, options, steps, data: { form, want } };
});

/* ---------------- Unit 5 · point-slope form ---------------- */
/** "y + 3 = 2(x − 1)" with the signs tidied; m and the point as fractions/integers. */
/** A slope written as a coefficient in front of parentheses: "", "−", "3", "(2/3)", "−(2/3)". */
const coefStr = (m) => { const a = Math.abs(m.n); return m.d === 1 ? (a === 1 ? (m.n < 0 ? M : '') : fmtN(m.n)) : `${m.n < 0 ? M : ''}(${a}/${m.d})`; };
function pointSlopeStr(m, x1, y1) {
  const coef = coefStr(m);
  const left = y1 ? `y ${y1 > 0 ? M : '+'} ${Math.abs(y1)}` : 'y';
  const right = x1 ? `${coef}(x ${x1 > 0 ? M : '+'} ${Math.abs(x1)})` : `${coef}x`;
  return `${left} = ${right}`;
}
function chkPointSlope(mv, bv) {
  return (input) => {
    const parts = prep(input).split('=');
    if (parts.length !== 2) return no('Type it like y − 3 = 2(x + 1).');
    let L, R, rAst;
    try { L = ptrim(toPoly(parseExpr(parts[0], 'y'))); rAst = parseExpr(parts[1], 'x'); R = ptrim(toPoly(rAst)); } catch { return no('Type it like y − 3 = 2(x + 1).'); }
    if (L.length !== 2 || !near(L[1], 1) || R.length > 2) return no('Point-slope form has y on the left: y − y₁ = m(x − x₁).');
    const m = R[1] || 0, b = (R[0] || 0) - L[0];
    if (!(near(m, mv) && near(b, bv))) {
      if (near(m, mv)) return no('The slope is right — check the point (and its signs).');
      return false;
    }
    if (sumTerms(rAst).length !== 1) return no('That is the right line — now write it in point-slope form, y − y₁ = m(x − x₁).');
    return true;
  };
}
skill('point-slope', 5, 'Point-slope form', 'Write an equation in point-slope form', (d) => {
  const m = d === 3 && coin(0.4) ? F(nz(-5, 5), pick([2, 3])) : F(nz(-6, 6));
  const x1 = nz(-8, 8), y1 = nz(-9, 9);
  const b = fAdd(F(y1), fMul(m, F(-x1)));
  const answer = pointSlopeStr(m, x1, y1);
  let text;
  const steps = [];
  if (d === 3 && coin(0.5)) {
    const step = m.d * (coin() ? 1 : 2) * (coin() ? 1 : -1);
    const x2 = x1 + step, y2 = y1 + fVal(m) * step;
    need(isInt(y2) && Math.abs(x2) <= 12 && Math.abs(y2) <= 20);
    text = `Write an equation in point-slope form for the line through (${fmtN(x1)}, ${fmtN(y1)}) and (${fmtN(x2)}, ${fmtN(y2)}). Use the first point.`;
    const raw = riseRun(y2 - y1, x2 - x1);
    steps.push(S('Find the slope first', `m = (${fmtN(y2)} ${M} ${pn(y1)})/(${fmtN(x2)} ${M} ${pn(x1)})${raw ? ` = ${raw}` : ''}`, `m = ${fStr(m)}`));
  } else text = `Write an equation in point-slope form for the line with slope ${fStr(m)} through (${fmtN(x1)}, ${fmtN(y1)}).`;
  const mCoef = coefStr(m);
  steps.push(
    S('Point-slope form is y − y₁ = m(x − x₁), where (x₁, y₁) is a point on the line', `m = ${fStr(m)}, x₁ = ${fmtN(x1)}, y₁ = ${fmtN(y1)}`),
    S('Substitute', `y ${M} ${pn(y1)} = ${mCoef}(x ${M} ${pn(x1)})`),
    S('Subtracting a negative is adding — tidy the signs', answer),
  );
  const alt = [pointSlopeStr(m, -x1, -y1), pointSlopeStr(m, y1, x1), pointSlopeStr(F(-m.n, m.d), x1, y1), lineStr(m, b), pointSlopeStr(m, x1, -y1)];
  return {
    type: 'written', text, fmt: 'Type it like y − 3 = 2(x + 1).', answer, check: chkPointSlope(fVal(m), fVal(b)), alt: alt.filter((w) => w !== answer), steps,
    data: { m: fVal(m), b: fVal(b), point: [x1, y1] },
  };
});

/* ---------------- Unit 5 · parallel and perpendicular lines ---------------- */
skill('parallel-perp', 5, 'Parallel & perpendicular', 'Use parallel and perpendicular slopes', (d) => {
  const rel = pick(['parallel', 'perpendicular']);
  const form = d === 1 ? 'slope' : d === 2 ? pick(['slope', 'slope', 'std']) : pick(['std', 'line', 'line']);
  let m0, given;
  const steps = [];
  if (form === 'std' || (form === 'line' && coin(0.4))) {
    const A = nz(-6, 6), B = nzNot1(-6, 6), C = nz(-12, 12);
    need(Math.abs(A) !== Math.abs(B));
    m0 = F(-A, B);
    given = eqStr(A, B, C);
    steps.push(S('Solve the given equation for y to see its slope', `${mono(B, 'y')} = ${tms([[-A, 'x'], [C, '']])}`, lineStr(m0, F(C, B))));
  } else {
    m0 = F(nz(-6, 6), d === 1 ? 1 : pick([1, 1, 2, 3]));
    given = lineStr(m0, F(nz(-9, 9)));
  }
  const m = rel === 'parallel' ? m0 : F(-m0.d, m0.n);
  steps.push(S(`The given line has slope ${fStr(m0)}`, `m = ${fStr(m0)}`));
  steps.push(rel === 'parallel' ? S('Parallel lines have the same slope', `The ${rel} slope is ${fStr(m)}`)
    : S('Perpendicular slopes are negative reciprocals: flip the fraction and change the sign', `${M}1 ÷ ${m0.d === 1 ? pn(m0.n) : `(${fStr(m0)})`} = ${fStr(m)}`));
  if (form !== 'line') {
    const mv = fVal(m);
    const check = (input) => {
      const r = readNum(prep(input).replace(/^m\s*=\s*/, '').replace(/^slope\s*(=|is)\s*/, ''));
      if (!r) return no('Type a number or a fraction like −3/4.');
      return chkNum(mv)(prep(input).replace(/^m\s*=\s*/, '').replace(/^slope\s*(=|is)\s*/, '')) === true;
    };
    const alt = [fStr(rel === 'parallel' ? F(-m0.d, m0.n) : m0), fStr(F(-m.n, m.d)), fStr(F(m0.d, m0.n)), fStr(F(m.n + m.d, m.d))];
    return {
      type: 'written', text: `What is the slope of a line ${rel} to ${given}?`, fmt: 'Type a number or a fraction like −3/4.',
      answer: fStr(m), check, num: mv, fmtAlt: ratStr, alt, steps, data: { m: mv, m0: fVal(m0), rel },
    };
  }
  const x1 = m.d * nz(-4, 4), y1 = ri(-9, 9);
  const b = fAdd(F(y1), fMul(m, F(-x1)));
  need(b.d === 1 && Math.abs(b.n) <= 20);
  const mx = fMul(m, F(x1));
  steps.push(
    S(`Substitute m = ${fStr(m)} and (${fmtN(x1)}, ${fmtN(y1)}) into y = mx + b`, `${fmtN(y1)} = ${fStr(m)} × ${pn(x1)} + b`, `${fmtN(y1)} = ${fStr(mx)} + b`),
    S(mx.n >= 0 ? `Subtract ${fStr(mx)} from both sides` : `Add ${fStr(F(-mx.n, mx.d))} to both sides`, `${fmtN(y1)} ${mx.n >= 0 ? M : '+'} ${fStr(F(Math.abs(mx.n), mx.d))} = b`, `b = ${fStr(b)}`),
    S('Write the equation', lineStr(m, b)),
  );
  const answer = lineStr(m, b);
  const other = rel === 'parallel' ? F(-m0.d, m0.n) : m0;
  const alt = [lineStr(other, fAdd(F(y1), fMul(other, F(-x1)))), lineStr(m, F(-b.n, b.d)), lineStr(F(-m.n, m.d), b), lineStr(m, F(y1))];
  return {
    type: 'written', text: `Write the equation of the line through (${fmtN(x1)}, ${fmtN(y1)}) that is ${rel} to ${given}, in slope-intercept form.`, fmt: 'Type it like y = 2x − 3.',
    answer, check: chkSlopeInt(fVal(m), fVal(b)), alt: alt.filter((w) => w !== answer), steps, data: { m: fVal(m), b: fVal(b), rel },
  };
});

/* ---------------- Unit 6 · systems of inequalities (multiple choice) ---------------- */
const NOT_REL = { '<': '≥', '≤': '>', '>': '≤', '≥': '<' };
skill('sys-ineq', 6, 'Systems of inequalities', 'Test points in a system of inequalities', (d) => {
  const lines = [0, 1].map(() => ({ m: nz(-3, 3), b: ri(-5, 5), op: pick(['<', '≤', '>', '≥']) }));
  need(lines[0].m !== lines[1].m);
  const [l1, l2] = lines;
  const ok = (l, [x, y]) => { const v = l.m * x + l.b; return l.op === '<' ? y < v : l.op === '≤' ? y <= v : l.op === '>' ? y > v : y >= v; };
  const pts = [];
  for (let x = -6; x <= 6; x++) for (let y = -8; y <= 8; y++) pts.push([x, y]);
  const both = pts.filter((p) => ok(l1, p) && ok(l2, p));
  const only1 = pts.filter((p) => ok(l1, p) && !ok(l2, p)), only2 = pts.filter((p) => !ok(l1, p) && ok(l2, p)), none = pts.filter((p) => !ok(l1, p) && !ok(l2, p));
  // A point on a dashed (strict) boundary looks like a solution but is not one.
  const edge = pts.filter((p) => (l1.m * p[0] + l1.b === p[1] && /[<>]/.test(l1.op) && ok(l2, p)) || (l2.m * p[0] + l2.b === p[1] && /[<>]/.test(l2.op) && ok(l1, p)));
  need(both.length && only1.length && only2.length && none.length);
  const small = (arr) => arr.filter(([x, y]) => Math.abs(x) <= 4 && Math.abs(y) <= 6);
  const right = pick(small(both).length ? small(both) : both);
  const wrongPool = [pick(small(only1).length ? small(only1) : only1), pick(small(only2).length ? small(only2) : only2), edge.length && d > 1 ? pick(edge) : pick(small(none).length ? small(none) : none)];
  const P = ([x, y]) => `(${fmtN(x)}, ${fmtN(y)})`;
  const options = [P(right), ...wrongPool.map(P)];
  need(new Set(options).size === 4);
  const lineS = (l) => `y ${l.op} ${lin(l.m, l.b)}`;
  const test = (l, [x, y]) => {
    const v = l.m * x + l.b, good = ok(l, [x, y]);
    const mx = l.m === 1 || x === 0 ? fmtN(l.m * x) : l.m === -1 ? `${M}${pn(x)}` : `${fmtN(l.m)} × ${pn(x)}`;
    return `${fmtN(y)} ${good ? l.op : NOT_REL[l.op]} ${mx}${l.b ? ` ${l.b < 0 ? M : '+'} ${Math.abs(l.b)}` : ''} = ${fmtN(v)}`;
  };
  const steps = [S('A solution must make BOTH inequalities true. Substitute each point', `${lineS(l1)} and ${lineS(l2)}`)];
  for (const o of shuffle([right, ...wrongPool])) {
    const g1 = ok(l1, o), g2 = ok(l2, o);
    steps.push(S(`${P(o)}: ${g1 && g2 ? 'both true — a solution' : g1 ? 'fails the second inequality' : g2 ? 'fails the first inequality' : 'fails both'}`, `${test(l1, o)}; ${test(l2, o)}`));
  }
  return { type: 'mc', text: `Which point is a solution of the system ${lineS(l1)} and ${lineS(l2)}?`, answer: P(right), options, steps, data: { lines } };
});

/* ---------------- Unit 7 · geometric sequences ---------------- */
skill('geo-seq', 7, 'Geometric sequences', 'Find a term of a geometric sequence', (d) => {
  const r = d === 1 ? pick([2, 3]) : d === 2 ? pick([2, 3, 4, -2, 5]) : pick([-2, -3, 2, 3, 1 / 2, -1 / 2]);
  const n = ri(5, d === 1 ? 7 : 8);
  let a1 = d === 1 ? ri(1, 6) : nz(-9, 9);
  if (Math.abs(r) < 1) { a1 = (coin() ? 1 : -1) * 2 ** (n - 1) * ri(1, 3); }
  const an = a1 * r ** (n - 1);
  need(isInt(an) && Math.abs(an) <= 200000 && Math.abs(a1) >= 2);
  const rs = Math.abs(r) < 1 ? fStr(F(Math.sign(r), 2)) : fmtN(r);
  const byTerms = d === 1 || coin(0.55);
  const seq = [0, 1, 2, 3].map((i) => fmtN(a1 * r ** i)).join(', ');
  const text = byTerms ? `What is the ${ordinal(n)} term of the geometric sequence ${seq}, …?` : `A geometric sequence has first term a₁ = ${fmtN(a1)} and common ratio r = ${rs}. What is a${sub(n)}?`;
  const steps = [];
  if (byTerms) steps.push(S('Find the common ratio: divide any term by the one before it', `r = ${fmtN(a1 * r)} ÷ ${pn(a1)} = ${rs}`));
  const rp = Math.abs(r) < 1 || r < 0 ? `(${rs})` : rs;
  const pw = fPow(Math.abs(r) < 1 ? F(Math.sign(r), 2) : F(r), n - 1);
  steps.push(
    S('Use the formula for the nth term', 'aₙ = a₁ · rⁿ⁻¹'),
    S(`Substitute a₁ = ${fmtN(a1)}, r = ${rs} and n = ${n}`, `a${sub(n)} = ${fmtN(a1)} · ${rp}${sup(n - 1)}`),
    S(`Evaluate the power first: ${rp}${sup(n - 1)} = ${fStr(pw)}`, `${fmtN(a1)} × ${pw.d === 1 ? pn(pw.n) : `(${fStr(pw)})`}`, `a${sub(n)} = ${fmtN(an)}`),
  );
  const alt = [a1 * r ** n, a1 * r * (n - 1), a1 + (n - 1) * r, a1 * r ** (n - 2)].filter((v) => isInt(v)).map(fmtN);
  return {
    type: 'written', text, fmt: 'Type a number.', answer: fmtN(an), check: chkNum(an), num: an, fmtAlt: fmtN, alt, steps,
    data: { value: an, a1, r, n },
  };
});

/* ---------------- Unit 7 · exponential functions ---------------- */
skill('exp-func', 7, 'Exponential functions', 'Evaluate an exponential function', (d) => {
  const bases = d === 1 ? [2, 3, 4, 5, 10] : [2, 3, 4, 5, 10, 1 / 2, 1 / 3];
  const b = pick(bases);
  const a = d === 1 ? ri(1, 9) : nz(-8, 9);
  const k = d === 1 ? ri(0, 4) : d === 2 ? ri(-2, 4) : ri(-3, 4);
  const bf = b < 1 ? F(1, Math.round(1 / b)) : F(b);
  const pw = fPow(bf, k);
  const val = fMul(F(a), pw);
  need(Math.abs(fVal(val)) <= 50000 && (fVal(pw) <= 10000));
  const bs = b < 1 ? `(${fStr(bf)})` : String(b);
  const aS = a === 1 ? '' : a === -1 ? M : `${fmtN(a)} · `;
  const text = `If f(x) = ${aS}${bs}ˣ, find f(${fmtN(k)}).`;
  const steps = [S(`Replace x with ${fmtN(k)}`, `f(${fmtN(k)}) = ${aS}${bs}${sup(k)}`)];
  if (k === 0) steps.push(S('Any nonzero number to the zero power is 1', `${bs}⁰ = 1`));
  else if (k < 0) steps.push(S('A negative exponent means the reciprocal', `${bs}${sup(k)} = ${fStr(pw)}`));
  else steps.push(S('Evaluate the power first — before multiplying', `${bs}${sup(k)} = ${fStr(pw)}`));
  if (a !== 1) steps.push(S('Multiply', `${fmtN(a)} × ${pw.d === 1 ? pn(pw.n) : `(${fStr(pw)})`}`, `f(${fmtN(k)}) = ${fStr(val)}`));
  const v = fVal(val);
  // Classic slips: (a·b)^k, a·b·k, a·b^(k−1).
  const alt = [fStr(fPow(fMul(F(a), bf), k)), fStr(fMul(fMul(F(a), bf), F(k))), fStr(fMul(F(a), fPow(bf, k - 1))), fStr(fMul(F(a), fPow(bf, -k)))];
  return {
    type: 'written', text, fmt: 'Type a number or a fraction like 3/4.', answer: fStr(val), check: chkNum(v), num: v, fmtAlt: ratStr, alt, steps,
    data: { value: v, a, b, k },
  };
});

/* ---------------- Unit 8 · monomial × polynomial ---------------- */
skill('mono-mult', 8, 'Monomial × polynomial', 'Multiply a monomial by a polynomial', (d) => {
  const c = d === 1 ? ri(2, 6) : nzNot1(-6, 6), k = d === 1 ? 1 : ri(1, 2);
  const inner = d === 3 ? randPoly(2) : randPoly(pick([1, 2]));
  need(inner.filter(Boolean).length >= 2 && inner.length + k <= 5);
  const mono_ = new Array(k).fill(0).concat([c]);
  const Rr = pmul(mono_, inner);
  const mk = mono(c, powKey('x', k));
  const text = `Multiply: ${mk}(${poly(inner)})`;
  const parts = inner.map((a, i) => [a, i]).filter(([a]) => a).reverse();
  const steps = [
    S('Multiply the monomial by every term inside — multiply the coefficients and add the exponents',
      parts.map(([a, i]) => `${mk} · ${i ? (a < 0 ? `(${mono(a, powKey('x', i))})` : mono(a, powKey('x', i))) : pn(a)} = ${mono(c * a, powKey('x', i + k))}`).join(', ')),
    S('Write the terms together', poly(Rr)),
  ];
  const keptExp = [];                                                     // multiplied the numbers but kept the exponents
  inner.forEach((a, i) => { const deg = i || k; keptExp[deg] = (keptExp[deg] || 0) + c * a; });
  const alt = [
    poly(ptrim(padd(pmul(mono_, inner.map((a, i) => (i === 0 ? 0 : a))), [inner[0]]))),   // left the constant term alone
    poly(Array.from(keptExp, (v) => v || 0)),
    poly(pmul(mono_, inner.map((a, i) => (i === 0 ? -a : a)))),                           // sign slip on the constant
    poly(pmul(new Array(k).fill(0).concat([-c]), inner)),                                  // lost the monomial's sign
  ].filter((w) => w && w !== poly(Rr));
  return { type: 'written', text, fmt: 'Type like 6x^3 − 15x^2 + 12x (x³ works too).', answer: poly(Rr), check: chkExpanded(Rr), alt, steps, data: { coeffs: Rr } };
});

/* ---------------- Unit 9 · factoring by grouping ---------------- */
skill('factor-group', 9, 'Factor by grouping', 'Factor a four-term polynomial by grouping', (d) => {
  const a = d === 3 ? pick([1, 1, 2, 3]) : 1;
  const q = nz(-7, 7);
  const dos = d === 3 && a === 1 && coin(0.3);
  const p = dos ? -(ri(1, 6) ** 2) : nz(d === 1 ? 1 : -9, 9);
  need(dos || gcd(a, p) === 1);
  need(dos || p > 0 || !isSquare(-p));                                      // x² − 4 would factor further
  need(!(a > 1 && p < 0 && isSquare(a) && isSquare(-p)));
  const target = [p * q, p, a * q, a];                                      // (ax² + p)(x + q)
  const quad = tms([[a, 'x²'], [p, '']]);
  const answer = dos ? `${bin(1, -Math.sqrt(-p))}${bin(1, Math.sqrt(-p))}${bin(1, q)}` : `(${quad})${bin(1, q)}`;
  const g1 = tms([[a, 'x³'], [a * q, 'x²']]);
  const g2 = tms([[Math.abs(p), 'x'], [Math.abs(p) * q, '']]);
  const steps = [
    S('Group the first two terms and the last two terms', `(${g1}) ${p < 0 ? M : '+'} (${g2})`),
    S(`Factor the GCF out of each group: ${mono(a, 'x²')} and ${fmtN(Math.abs(p))}`, `${mono(a, 'x²')}${bin(1, q)} ${p < 0 ? M : '+'} ${Math.abs(p)}${bin(1, q)}`),
    S(`Both groups share the factor ${bin(1, q)} — factor it out`, `(${quad})${bin(1, q)}`),
  ];
  if (dos) steps.push(S(`${quad} is a difference of squares, so keep going`, answer));
  const alt = [`(${tms([[a, 'x²'], [-p, '']])})${bin(1, q)}`, `(${quad})${bin(1, -q)}`, `(${tms([[a, 'x²'], [q, '']])})${bin(1, p)}`, `${mono(a, 'x²')}${bin(1, q)} ${p < 0 ? M : '+'} ${Math.abs(p)}${bin(1, q)}`];
  if (dos) alt.unshift(`(${quad})${bin(1, q)}`);
  return {
    type: 'written', text: `Factor completely: ${poly(target)}`, fmt: 'Type a product like (x² + 2)(x + 3).',
    answer, check: chkFactored(target, '(x² + 2)(x + 3)'), alt: alt.filter((w) => w !== answer), steps, data: { coeffs: target },
  };
});

/* ---------------- Unit 10 · the quadratic formula ---------------- */
/** (−b ± √D)/(2a) simplified: { text, roots } — "x = (2 ± √10)/2", "x = −2 ± √3", or rational roots listed. */
function quadRoots(a, b, c) {
  const D = b * b - 4 * a * c;
  const [k, m] = simplifyRad(D);
  if (m === 1) {
    const rs = [F(-b - k, 2 * a), F(-b + k, 2 * a)];
    return { D, k, m, rational: true, roots: rs.map(fVal), text: rootsAns(rs) };
  }
  const g = gcd(gcd(b, k), 2 * a);
  const P = -b / g, Q = k / g, Dn = (2 * a) / g;
  const rad = radStr(Q, m);
  const top = P ? `${fmtN(P)} ± ${rad}` : `±${rad}`;
  const text = Dn === 1 ? `x = ${top}` : P ? `x = (${top})/${Dn}` : `x = ${top}/${Dn}`;
  return { D, k, m, g, P, Q, Dn, rational: false, roots: [(-b - k * Math.sqrt(m)) / (2 * a), (-b + k * Math.sqrt(m)) / (2 * a)], text };
}
const ROUND_ROOTS = (rs) => rs.slice().sort((p, q) => p - q).map((r) => (terminates(r) ? ratStr(r) : fmtN(Math.round(r * 100) / 100))).join(', ');
skill('quad-formula', 10, 'The quadratic formula', 'Solve with the quadratic formula', (d) => {
  const a = d === 1 ? 1 : ri(1, 3), b = d === 1 ? 2 * nz(-5, 5) : nz(-9, 9), c = nz(-9, 9);
  const D = b * b - 4 * a * c;
  need(D > 1);
  const sq = isSquare(D);
  need(d === 3 ? true : !sq || coin(0.2));
  need(Math.sqrt(D) <= 30 || sq);
  const R = quadRoots(a, b, c);
  const steps = [
    S('Write the equation as ax² + bx + c = 0 and read off a, b and c', `a = ${fmtN(a)}, b = ${fmtN(b)}, c = ${fmtN(c)}`),
    S('Find the discriminant, b² − 4ac', `${pn(b)}² ${M} 4(${fmtN(a)})(${fmtN(c)}) = ${b * b} ${M} ${pn(4 * a * c)} = ${fmtN(D)}`),
    S('Substitute into the quadratic formula, x = (−b ± √(b² − 4ac))/(2a)', `x = (${fmtN(-b)} ± √${D})/${2 * a}`),
  ];
  if (R.rational) {
    const s = Math.sqrt(D);
    steps.push(S(`${D} is a perfect square: √${D} = ${s}`, `x = (${fmtN(-b)} + ${s})/${2 * a} or x = (${fmtN(-b)} ${M} ${s})/${2 * a}`), S('Simplify each', R.text));
  } else {
    if (R.k > 1) steps.push(S(`Simplify the root: √${D} = √${R.k * R.k} · √${R.m}`, `√${D} = ${R.k}√${R.m}`, `x = (${fmtN(-b)} ± ${R.k}√${R.m})/${2 * a}`));
    if (R.g > 1) steps.push(S(`Divide every term by ${R.g} — the ${fmtN(-b)}, the ${R.k}√${R.m} and the ${2 * a}`, R.text));
    steps.push(S('As decimals, rounded to the hundredth', R.roots.slice().sort((p, q) => q - p).map((r) => `x ≈ ${fmtN(Math.round(r * 100) / 100)}`).join(' or ')));
  }
  const answer = R.text;
  const alt = [];
  const W = (aa, bb, cc) => { const DD = bb * bb - 4 * aa * cc; if (DD <= 0 || !aa) return null; return quadRoots(aa, bb, cc).text; };
  alt.push(W(a, -b, c));                                                       // sign of b
  if (!R.rational) {
    if (R.Dn > 1) alt.push(`x = ${fStr(F(R.P, R.Dn))} ± ${radStr(R.Q, R.m)}`);   // divided only the first term
    alt.push(`x = ${fmtN(-b)} ± ${radStr(R.k, R.m)}`);                      // forgot to divide by 2a
  } else alt.push(rootsAns([F(-b - Math.sqrt(D), 1), F(-b + Math.sqrt(D), 1)]));
  alt.push(W(a, b, -c));
  return {
    type: 'written', text: `Solve using the quadratic formula: ${poly([c, b, a])} = 0`,
    fmt: R.rational ? 'Type the solutions like x = 2, x = −3/2.' : 'Type exact answers like x = (2 ± √10)/2, or decimals to the hundredth like 2.58, −0.58.',
    answer, check: chkRoots(R.roots, { example: 'x = (2 ± √10)/2' }), alt: alt.filter((w) => w && w !== answer), steps,
    data: { roots: R.roots, a, b, c, D, approx: ROUND_ROOTS(R.roots) },
  };
});

/* ---------------- Unit 10 · completing the square ---------------- */
function chkVertexForm(target, example = '(x + 3)² − 7') {
  return (input) => {
    let ast, P;
    try { ast = parseExpr(input); P = toPoly(ast); } catch { return no(`Type it like ${example}.`); }
    const same = peq(P, target);
    const terms = sumTerms(ast);
    const squares = terms.filter((t) => t.t === 'pow' || (t.t === 'mul' && [t.a, t.b].some((u) => u.t === 'pow')));
    const consts = terms.filter((t) => ptrim(toPoly(t)).length === 1);
    const shaped = squares.length === 1 && squares.length + consts.length === terms.length && consts.length <= 1;
    if (same && shaped) return true;
    if (same) return no(`That is equal, but write it as a perfect square plus a number, like ${example}.`);
    return false;
  };
}
skill('complete-square', 10, 'Completing the square', 'Complete the square', (d) => {
  const form = d === 1 ? 'c' : d === 2 ? pick(['c', 'vertex', 'vertex']) : pick(['solve', 'solve', 'vertex']);
  if (form === 'c') {
    const b = d === 1 ? 2 * nz(-9, 9) : nz(-15, 15);
    const cf = F(b * b, 4);
    const text = `What number c makes x² ${b < 0 ? M : '+'} ${mono(Math.abs(b), 'x')} + c a perfect square trinomial?`;
    const half = F(b, 2);
    const steps = [
      S('Take half of the x-coefficient', `${fmtN(b)} ÷ 2 = ${fStr(half)}`),
      S('Square it', `(${fStr(half)})² = ${fStr(cf)}`),
      S('Check: it factors as a perfect square', `x² ${b < 0 ? M : '+'} ${mono(Math.abs(b), 'x')} + ${fStr(cf)} = (${lin(1, 0)} ${b < 0 ? M : '+'} ${fStr(F(Math.abs(half.n), half.d))})²`),
    ];
    const v = fVal(cf);
    return { type: 'written', text, fmt: 'Type a number or a fraction like 81/4.', answer: fStr(cf), check: chkNum(v), num: v, fmtAlt: ratStr, alt: [fStr(F(Math.abs(b))), fStr(half), fStr(F(b * b, 2)), fStr(F(b * b))], steps, data: { value: v, b } };
  }
  const h = nz(-8, 8);                                  // (x + h)²
  const b = 2 * h;
  if (form === 'vertex') {
    const c = nz(-12, 15);
    const k = c - h * h;
    const text = `Write x² ${b < 0 ? M : '+'} ${mono(Math.abs(b), 'x')} ${c < 0 ? M : '+'} ${Math.abs(c)} in the form (x + h)² + k by completing the square.`;
    const sqT = `(${lin(1, h)})²`;
    const answer = k ? `${sqT} ${k < 0 ? M : '+'} ${Math.abs(k)}` : sqT;
    const steps = [
      S(`Half of ${fmtN(b)} is ${fmtN(h)}; squared, that is ${h * h}`, `(${fmtN(b)} ÷ 2)² = ${h * h}`),
      S(`Add and subtract ${h * h} so the value does not change`, `x² ${b < 0 ? M : '+'} ${mono(Math.abs(b), 'x')} + ${h * h} ${M} ${h * h} ${c < 0 ? M : '+'} ${Math.abs(c)}`),
      S(`The first three terms are a perfect square`, `${sqT} ${M} ${h * h} ${c < 0 ? M : '+'} ${Math.abs(c)}`),
      S('Combine the numbers', answer),
    ];
    const target = [c, b, 1];
    const w = (hh, kk) => (kk ? `(${lin(1, hh)})² ${kk < 0 ? M : '+'} ${Math.abs(kk)}` : `(${lin(1, hh)})²`);
    return {
      type: 'written', text, fmt: 'Type it like (x + 3)^2 − 7 (² works too).', answer, check: chkVertexForm(target), alt: [w(-h, k), w(h, c + h * h), w(h, -k), w(b, c - b * b)].filter((x) => x !== answer), steps,
      data: { coeffs: target, h, k },
    };
  }
  // Solve by completing the square: x² + bx + c = 0 with x = −h ± √s.
  const s = pick([2, 3, 5, 6, 7, 10, 11, 4, 9, 16]);
  const c = h * h - s;
  need(c !== 0);
  const rootsV = [-h - Math.sqrt(s), -h + Math.sqrt(s)];
  const rs = Math.sqrt(s);
  const exact = isSquare(s) ? rootsAns([F(-h - rs), F(-h + rs)]) : `x = ${fmtN(-h)} ± √${s}`;
  const text = `Solve by completing the square: x² ${b < 0 ? M : '+'} ${mono(Math.abs(b), 'x')} ${c < 0 ? M : '+'} ${Math.abs(c)} = 0`;
  const steps = [
    S(`Move the constant to the right side`, `x² ${b < 0 ? M : '+'} ${mono(Math.abs(b), 'x')} = ${fmtN(-c)}`),
    S(`Add (${fmtN(b)} ÷ 2)² = ${h * h} to both sides`, `x² ${b < 0 ? M : '+'} ${mono(Math.abs(b), 'x')} + ${h * h} = ${fmtN(-c)} + ${h * h}`, `x² ${b < 0 ? M : '+'} ${mono(Math.abs(b), 'x')} + ${h * h} = ${s}`),
    S('Write the left side as a perfect square', `(${lin(1, h)})² = ${s}`),
    S('Take the square root of both sides — remember ±', `${lin(1, h)} = ±${isSquare(s) ? rs : `√${s}`}`),
    S(`${h > 0 ? 'Subtract' : 'Add'} ${Math.abs(h)} ${h > 0 ? 'from' : 'to'} both sides`, exact),
  ];
  if (isSquare(s)) steps.splice(4, 1, S(`${h > 0 ? 'Subtract' : 'Add'} ${Math.abs(h)} ${h > 0 ? 'from' : 'to'} both sides`, `x = ${fmtN(-h)} ± ${rs}`, exact));
  return {
    type: 'written', text, fmt: isSquare(s) ? 'Type the solutions like x = 2, x = −6.' : 'Type it like x = −3 ± √5, or decimals to the hundredth.',
    answer: exact, check: chkRoots(rootsV, { example: 'x = −3 ± √5' }),
    alt: [isSquare(s) ? rootsAns([F(h - rs), F(h + rs)]) : `x = ${fmtN(h)} ± √${s}`, isSquare(s) ? rootsAns([F(-h + rs)]) : `x = ${fmtN(-h)} + √${s}`, isSquare(s) ? rootsAns([F(-h - s), F(-h + s)]) : `x = ${fmtN(-h)} ± √${s + 2 * h * h}`],
    steps, data: { roots: rootsV, h, s },
  };
});

/* ---------------- Unit 11 · adding and subtracting radicals ---------------- */
skill('add-radicals', 11, 'Add & subtract radicals', 'Add and subtract radicals', (d) => {
  const m = d === 1 ? pick([2, 3, 5, 7]) : pick([2, 3, 5, 6, 7]);
  const n = d === 3 ? 3 : 2;
  const terms = [];
  for (let i = 0; i < n; i++) {
    const k = d === 1 ? 1 : pick(d === 2 ? [1, 2, 3] : [1, 2, 3, 4]);
    const c = (i === 0 ? 1 : (d === 1 ? pick([1, 1, -1]) : pick([1, -1]))) * ri(1, 6);
    terms.push({ c, k, rad: k * k * m });
  }
  need(d === 1 || terms.some((t) => t.k > 1));
  need(new Set(terms.map((t) => t.rad)).size === terms.length || d === 1);
  const total = terms.reduce((s_, t) => s_ + t.c * t.k, 0);
  need(total !== 0);
  const tStr = (t, i) => { const body = `${Math.abs(t.c) === 1 ? '' : Math.abs(t.c)}√${t.rad}`; return i === 0 ? (t.c < 0 ? M : '') + body : ` ${t.c < 0 ? M : '+'} ${body}`; };
  const text = `Simplify: ${terms.map(tStr).join('')}`;
  const answer = radStr(total, m);
  const steps = [];
  for (const t of terms) {
    if (t.k === 1) continue;
    const cc = Math.abs(t.c);
    steps.push(S(`Simplify √${t.rad}: ${t.rad} = ${t.k * t.k} × ${m}`, `√${t.rad} = √${t.k * t.k} · √${m} = ${t.k}√${m}`, cc === 1 ? null : `${cc}√${t.rad} = ${cc} · ${t.k}√${m} = ${cc * t.k}√${m}`));
  }
  const like = terms.map((t) => ({ c: t.c * t.k })).map((t, i) => { const body = `${Math.abs(t.c) === 1 ? '' : Math.abs(t.c)}√${m}`; return i === 0 ? (t.c < 0 ? M : '') + body : ` ${t.c < 0 ? M : '+'} ${body}`; }).join('');
  steps.push(S(`Now every term is a multiple of √${m} — like radicals`, like));
  steps.push(S('Add or subtract the coefficients; the √ part stays the same', `(${terms.map((t, i) => (i ? ` ${t.c < 0 ? M : '+'} ${Math.abs(t.c * t.k)}` : fmtN(t.c * t.k))).join('')})√${m}`, answer));
  const sumRad = terms.reduce((s_, t) => s_ + t.rad, 0), sumC = terms.reduce((s_, t) => s_ + t.c, 0);
  const alt = [sumC ? radStr(sumC, sumRad) : null, radStr(total + 1, m), radStr(terms.reduce((s_, t) => s_ + Math.abs(t.c * t.k), 0), m), sumC ? radStr(sumC, m) : null];
  return { type: 'written', text, fmt: 'Type like 7√3 (7sqrt3 works too).', answer, check: chkRad(total, m), alt: alt.filter((w) => w && w !== answer), steps, data: { coef: total, radicand: m } };
});

/* ---------------- Unit 12 · scatter plots and lines of fit ---------------- */
const CORR = ['Positive correlation', 'Negative correlation', 'No correlation', 'Every point lies exactly on one line'];
function scatterSvg(pts) {
  const W = 300, H = 200, pad = 30;
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x0 = Math.min(0, ...xs), x1 = Math.max(...xs) + 1, y0 = Math.min(0, ...ys), y1 = Math.max(...ys) + 1;
  const X = (x) => pad + ((x - x0) / (x1 - x0)) * (W - pad - 10), Y = (y) => H - pad - ((y - y0) / (y1 - y0)) * (H - pad - 10);
  let s = `<svg class="alg-scatter" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`;
  s += `<line class="alg-axis" x1="${pad}" y1="${H - pad}" x2="${W - 6}" y2="${H - pad}"/><line class="alg-axis" x1="${pad}" y1="${H - pad}" x2="${pad}" y2="6"/>`;
  s += `<text class="alg-label" x="${W - 10}" y="${H - pad + 18}" text-anchor="end">x</text><text class="alg-label" x="${pad - 10}" y="14" text-anchor="end">y</text>`;
  for (const [x, y] of pts) s += `<circle class="alg-pt" cx="${X(x).toFixed(1)}" cy="${Y(y).toFixed(1)}" r="5"/>`;
  return s + '</svg>';
}
skill('line-fit', 12, 'Scatter plots & lines of fit', 'Read a scatter plot or use a line of fit', (d) => {
  const form = d === 1 ? pick(['predict', 'corr']) : pick(['predict', 'corr', 'predict']);
  if (form === 'predict') {
    const CTXS = [
      ['hours studied', 'test score', 'hours', (x) => `the score for ${x} hours of study`],
      ['days since planting', 'plant height in cm', 'days', (x) => `the height after ${x} days`],
      ['temperature in °F', 'lemonade cups sold', 'degrees', (x) => `the cups sold when it is ${x}°F`],
      ['minutes of exercise', 'calories burned', 'minutes', (x) => `the calories burned in ${x} minutes`],
    ];
    const [xn, yn, , phrase] = pick(CTXS);
    const m = d === 1 ? ri(2, 9) : pick([0.5, 1.5, 2.5, 3.5, 4.5, 1.2, 2.4, 0.8]);
    const b = ri(5, 60) * (d === 3 && coin(0.3) ? -1 : 1);
    const x = ri(4, 20);
    const y = clean(m * x + b);
    need(y > 0);
    const line = `y = ${numStr(m)}x ${b < 0 ? M : '+'} ${Math.abs(b)}`;
    const text = `A line of fit for a scatter plot of ${xn} (x) and ${yn} (y) is ${line}. Use it to predict ${phrase(x)}.`;
    const steps = [
      S(`Substitute x = ${x} into the line of fit`, `y = ${numStr(m)} × ${x} ${b < 0 ? M : '+'} ${Math.abs(b)}`),
      S('Multiply, then add', `y = ${numStr(clean(m * x))} ${b < 0 ? M : '+'} ${Math.abs(b)}`, `y = ${numStr(y)}`),
      S('A line of fit gives an estimate — real data points scatter around it', ''),
    ];
    return {
      type: 'written', text, fmt: 'Type a number.', answer: numStr(y), check: chkNum(y), num: y, fmtAlt: (v) => numStr(clean(v)),
      alt: [numStr(clean(m + x + b)), numStr(clean(m * x)), numStr(clean(m * (x + b))), numStr(clean(m * x - b))],
      steps, data: { value: y, m, b, x },
    };
  }
  const kind = pick(['pos', 'neg', 'none']);
  const n = ri(8, 10);
  const pts = [];
  const used = new Set();
  for (let i = 0; i < n; i++) {
    let x = ri(1, 12);
    while (used.has(x)) x = ri(1, 12);
    used.add(x);
    const y = kind === 'pos' ? Math.round(x * 0.8 + 2 + ri(-2, 2)) : kind === 'neg' ? Math.round(12 - x * 0.8 + ri(-2, 2)) : ri(1, 11);
    pts.push([x, Math.max(0, y)]);
  }
  pts.sort((p, q) => p[0] - q[0]);
  // Pearson r, to be sure the picture says what we claim.
  const mx = pts.reduce((s_, p) => s_ + p[0], 0) / n, my = pts.reduce((s_, p) => s_ + p[1], 0) / n;
  const sxy = pts.reduce((s_, p) => s_ + (p[0] - mx) * (p[1] - my), 0), sxx = pts.reduce((s_, p) => s_ + (p[0] - mx) ** 2, 0), syy = pts.reduce((s_, p) => s_ + (p[1] - my) ** 2, 0);
  need(syy > 0);
  const r = sxy / Math.sqrt(sxx * syy);
  need(kind === 'pos' ? r > 0.75 && r < 0.995 : kind === 'neg' ? r < -0.75 && r > -0.995 : Math.abs(r) < 0.25);
  const answer = kind === 'pos' ? CORR[0] : kind === 'neg' ? CORR[1] : CORR[2];
  const list = pts.map(([x, y]) => `(${x}, ${y})`).join(', ');
  const steps = [
    S('Look at the overall pattern from left to right', kind === 'pos' ? 'As x increases, y tends to increase: the points drift upward' : kind === 'neg' ? 'As x increases, y tends to decrease: the points drift downward' : 'As x increases, y does not rise or fall in any steady way'),
    S(kind === 'none' ? 'No upward or downward trend' : 'The points cluster around a line but do not all sit exactly on it', answer),
  ];
  return {
    type: 'mc', text: `What kind of correlation does this scatter plot show? The points are ${list}.`, answer, options: CORR.slice(),
    figure: scatterSvg(pts), figureAlt: `Scatter plot of ${n} points: ${list}.`, steps, data: { points: pts, kind },
  };
});

/* ======================================================= question objects */
const DIFF = { easy: 1, medium: 2, hard: 3 };
const DIFF_NAME = { 1: 'easy', 2: 'medium', 3: 'hard' };
const squash = (s) => String(s).replace(/\s+/g, '').replace(/−/g, '-');
function toMCSpec(spec) {
  const out = [];
  const seen = new Set([squash(spec.answer)]);
  const cands = [...shuffle((spec.alt || []).filter(Boolean))];
  if (spec.num != null && spec.fmtAlt) {
    const n = spec.num;
    for (const k of [n ? -2 * n : null, 1, -1, 2, -2, 3, 10, -10]) if (k != null) cands.push(spec.fmtAlt(clean(n + k)));
  }
  for (const w of cands) {
    if (out.length === 3) break;
    const k = squash(w);
    if (seen.has(k) || /NaN|Infinity|undefined/.test(k) && k !== 'undefined') continue;
    let r;
    try { r = spec.check(w); } catch { r = false; }
    if (r === true) continue;
    seen.add(k);
    out.push(w);
  }
  if (out.length < 3) return null;
  return { ...spec, type: 'mc', options: [spec.answer, ...out], check: undefined };
}
function build(sk, spec, d) {
  const q = {
    id: `alg:${sk.id}`, skill: sk.id, difficulty: DIFF_NAME[d], type: spec.type,
    ask: spec.type === 'mc' ? 'Choose the best answer' : 'Type your answer',
    text: spec.text, answer: spec.answer, data: spec.data || {}, steps: spec.steps,
    hint: spec.steps[0], source: `Algebra Lab · ${sk.name}`, setId: sk.setId,
  };
  if (spec.figure) { q.figure = spec.figure; q.figureAlt = spec.figureAlt; }
  q.explanation = stepsNode(spec.steps);
  q.explanationText = spec.steps.map(stepText).join('\n');
  if (spec.type === 'mc') {
    q.options = shuffle(spec.options);
    q.prompt = spec.text;
  } else {
    const main = spec.eqs ? el('span', {}, 'Solve the system:', el('span', { class: 'alg-sys' }, ...spec.eqs.map((e) => el('span', {}, e)))) : spec.text;
    q.prompt = el('span', { class: 'alg-prompt' }, main, spec.fmt ? el('span', { class: 'alg-fmt' }, spec.fmt) : null);
    q.format = spec.fmt || '';
    q.note = '';
    q.check = (input) => { const r = spec.check(input); q.note = r && r !== true && r.note ? r.note : ''; return r === true; };
  }
  return q;
}
function level(opts) {
  const v = opts && opts.difficulty;
  if (typeof v === 'number') return Math.min(3, Math.max(1, Math.round(v)));
  return DIFF[v] || 2;
}
function generate(id, opts = {}) {
  const sk = BY[id];
  if (!sk) throw new Error(`Unknown Algebra Lab skill "${id}"`);
  const d = level(opts);
  for (let i = 0; i < 500; i++) {
    let spec;
    try { spec = sk.gen(d); } catch (e) { if (e === RETRY) continue; throw e; }
    if (opts.mc && spec.type !== 'mc') { spec = toMCSpec(spec); if (!spec) continue; }
    return build(sk, spec, d);
  }
  throw new Error(`Could not generate a "${id}" problem`);
}
const generateMC = (id, opts = {}) => generate(id, { ...opts, mc: true });

/* Exposed for the verifier and the study check. */
const API = window.CQAlgebra = {
  skills: SK.map(({ id, name, label, setId, unit }) => ({ id, name, label, setId, unit })),
  generate, generateMC, current: null,
};

/* =========================================================== integration */
const UNIT_TITLES = ['Foundations of Algebra', 'Solving Equations', 'Inequalities', 'Functions', 'Linear Equations & Graphs', 'Systems of Equations', 'Exponents & Exponential Functions', 'Polynomials', 'Factoring', 'Quadratic Equations', 'Radicals & the Pythagorean Theorem', 'Statistics'];
const unitTitle = (u) => (CQ.getSet(`alg1-u${u}`) || {}).title || UNIT_TITLES[u - 1];
const isAlg = (set) => !!set && set.subject === 'alg1';
const skillsFor = (set) => (set.isAll ? SK : SK.filter((s) => s.setId === set.id));

CQ.registerItemResolver('alg', (id) => {
  const sk = BY[id.slice(4)];
  if (!sk || !CQ.getSet(sk.setId)) return null;
  const d = ((CQ.state.prefs || {}).algebra || {}).difficulty || 'medium';
  return { setId: sk.setId, label: sk.label, make: () => generate(sk.id, { difficulty: d }) };
});

CQ.addGameSource((set) => {
  if (!isAlg(set)) return [];
  const pool = skillsFor(set);
  if (!pool.length) return [];
  const order = shuffle(pool);
  const out = [];
  for (let i = 0; i < 12; i++) {
    try { out.push(generateMC(order[i % order.length].id, { difficulty: i % 3 === 2 ? 'medium' : 'easy' })); } catch (e) { console.error(e); }
  }
  return out;
});

/* ======================================================= practice screen */
const DIFFS = [['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard']];
function labPrefs() {
  const p = CQ.state.prefs;
  if (!p.algebra || typeof p.algebra !== 'object') p.algebra = {};
  const a = p.algebra;
  if (!DIFF[a.difficulty]) a.difficulty = 'medium';
  if (!a.picked || typeof a.picked !== 'object') a.picked = {};
  return a;
}

function renderLab(set) {
  const prefs = labPrefs();
  const home = skillsFor(set);
  const saved = (Array.isArray(prefs.picked[set.id]) ? prefs.picked[set.id] : []).filter((id) => BY[id]);
  const picked = new Set(saved.length ? saved : home.map((s) => s.id));
  const tally = new Map();                 // skill id → [right, tried] this visit
  let streak = 0, best = 0, right = 0, tried = 0;
  let q = null, sk = null, card = null, assisted = false, answered = false, lastSkill = null, keyPick = null;

  const view = el('div', { class: 'view alg' });
  view.append(CQ.panelHead(set, 'algebra', 'Endless practice problems, made fresh every time, each with a worked solution. Pick your skills and a difficulty, then go — "Show a hint" reveals the first step (a hinted problem does not count toward mastery).'));

  /* ---- toolbar: back, difficulty ---- */
  const diffBtns = DIFFS.map(([k, label]) => el('button', { type: 'button', class: prefs.difficulty === k ? 'on' : '', 'aria-pressed': String(prefs.difficulty === k), onclick: () => setDifficulty(k) }, label));
  view.append(el('div', { class: 'toolbar alg-toolbar' },
    CQ.backBtn(set),
    el('div', { class: 'alg-diff' }, el('span', { class: 'alg-diff-label', id: 'alg-diff-label' }, 'Difficulty'),
      el('div', { class: 'seg', role: 'group', 'aria-labelledby': 'alg-diff-label' }, ...diffBtns)),
  ));
  function setDifficulty(k) {
    prefs.difficulty = k; CQ.save();
    diffBtns.forEach((b, i) => { const on = DIFFS[i][0] === k; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
    if (!answered) next(); else drawSkillLine();
  }

  /* ---- skill picker ---- */
  const count = el('span', { class: 'alg-count' });
  const picker = el('details', { class: 'panel alg-picker', open: !set.isAll });
  picker.append(el('summary', {}, el('span', { class: 'alg-sum-title' }, '🎯 Skills'), count));
  const chipFor = new Map();
  const unitHeads = [];
  function group(u) {
    const skills = SK.filter((s) => s.unit === u);
    const head = el('button', { type: 'button', class: 'alg-unit-btn', onclick: () => {
      const allOn = skills.every((s) => picked.has(s.id));
      if (allOn) { for (const s of skills) picked.delete(s.id); if (!picked.size) { for (const s of skills) picked.add(s.id); CQ.toast('Keep at least one skill on'); } }
      else for (const s of skills) picked.add(s.id);
      changed();
    } }, `Unit ${u} · ${unitTitle(u)}`);
    unitHeads.push([head, skills]);
    const chips = skills.map((s) => {
      const b = el('button', { type: 'button', class: 'alg-chip', onclick: () => {
        if (picked.has(s.id)) { if (picked.size === 1) return CQ.toast('Keep at least one skill on'); picked.delete(s.id); } else picked.add(s.id);
        changed();
      } }, el('span', { class: 'alg-chip-name' }, s.name), el('span', { class: 'alg-chip-m', 'aria-hidden': 'true' }));
      chipFor.set(s.id, b);
      return b;
    });
    return el('div', { class: 'alg-unit', role: 'group', 'aria-label': `Unit ${u} skills` }, head, el('div', { class: 'alg-chips' }, ...chips));
  }
  const units = [...new Set(SK.map((s) => s.unit))];
  if (set.isAll) picker.append(...units.map(group));
  else {
    const mine = home.length ? home[0].unit : null;
    if (mine) picker.append(group(mine));
    const others = units.filter((u) => u !== mine);
    picker.append(el('details', { class: 'alg-more' }, el('summary', {}, 'Mix in skills from other units'), ...others.map(group)));
  }
  function drawPicker() {
    count.textContent = `${picked.size} of ${SK.length} on`;
    for (const [id, b] of chipFor) {
      const on = picked.has(id);
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
      const m = Math.min(2, CQ.state.mastery[`alg:${id}`] || 0);
      const mk = b.querySelector('.alg-chip-m');
      mk.textContent = m >= 2 ? '★' : m === 1 ? '☆' : '';
      b.title = m >= 2 ? 'Mastered: two right in a row' : m === 1 ? 'One right — one more in a row to master it' : '';
    }
    for (const [head, skills] of unitHeads) {
      const n = skills.filter((s) => picked.has(s.id)).length;
      head.setAttribute('aria-pressed', n === skills.length ? 'true' : n ? 'mixed' : 'false');
    }
  }
  function changed() {
    prefs.picked[set.id] = [...picked]; CQ.save();
    drawPicker();
    if (!answered && sk && !picked.has(sk.id)) next();
  }
  view.append(picker);

  /* ---- stats ---- */
  const hud = el('div', { class: 'game-hud alg-hud', role: 'group', 'aria-label': 'This session' });
  const tallyRow = el('div', { class: 'alg-tally', 'aria-label': 'Per-skill tally this session' });
  function drawHud() {
    hud.innerHTML = '';
    hud.append(
      el('div', { class: 'stat' }, el('b', { class: 'streak' }, `🔥 ${streak}`), el('span', {}, 'Streak')),
      el('div', { class: 'stat' }, el('b', {}, `${right} / ${tried}`), el('span', {}, 'Correct')),
      el('div', { class: 'stat' }, el('b', {}, String(best)), el('span', {}, 'Best streak')),
    );
    tallyRow.innerHTML = '';
    for (const [id, [r, t]] of tally) tallyRow.append(el('span', { class: `chip${r === t ? ' good' : r ? '' : ' warn'}` }, `${BY[id].name} ${r}/${t}`));
  }
  view.append(hud, tallyRow);

  /* ---- the problem ---- */
  const skillLine = el('div', { class: 'alg-skillline' });
  const stage = el('div', { class: 'alg-stage' });
  const actions = el('div', { class: 'row alg-actions' });
  view.append(el('div', { class: 'panel alg-panel' }, skillLine, stage, actions));
  CQ.main.append(view);

  function drawSkillLine() {
    skillLine.innerHTML = '';
    if (!sk) return;
    skillLine.append(
      el('span', { class: 'chip brand' }, `Unit ${sk.unit}`),
      el('span', { class: 'chip' }, sk.name),
      el('span', { class: 'chip' }, DIFFS.find(([k]) => k === q.difficulty)[1]),
    );
  }

  function next() {
    const ids = [...picked];
    const pool = ids.length > 1 ? ids.filter((x) => x !== lastSkill) : ids;
    const id = pick(pool);
    sk = BY[id]; lastSkill = id;
    q = generate(id, { difficulty: prefs.difficulty });
    API.current = q;
    assisted = false; answered = false;
    drawSkillLine();
    stage.innerHTML = '';
    card = CQ.questionCard(q, { onAnswer });
    const hintBox = el('div', { class: 'alg-hint', role: 'status', 'aria-live': 'polite' });
    card.querySelector('.q-prompt').after(hintBox);
    card.addEventListener('override', onOverride);
    stage.append(card);
    keyPick = card.pickByKey ? (k) => card.pickByKey(k) : null;
    const hintBtn = el('button', { type: 'button', class: 'btn sm alg-hint-btn', 'aria-expanded': 'false', onclick: () => showHint(hintBtn, hintBox) }, '💡 Show a hint');
    actions.innerHTML = '';
    actions.append(hintBtn, el('button', { type: 'button', class: 'btn ghost sm', onclick: () => { if (!answered) { next(); focusQuestion(); } } }, 'Skip — new problem'));
  }
  function focusQuestion() {
    const first = stage.querySelector('.opt:not([disabled])') || (matchMedia('(pointer: fine)').matches && stage.querySelector('input.input'));
    if (first) first.focus();
  }
  function showHint(btn, box) {
    if (answered || assisted) return;
    assisted = true;
    const h = q.hint;
    box.append(...[
      el('b', {}, '💡 First step: '), h.why,
      h.math ? el('span', { class: 'alg-math' }, h.math) : null,
      h.res ? el('span', { class: 'alg-res' }, el('span', { 'aria-hidden': 'true' }, '→ '), h.res) : null,
      el('span', { class: 'note' }, 'Hint used — this problem won’t count toward mastery.'),
    ].filter(Boolean));
    btn.disabled = true;
    btn.setAttribute('aria-expanded', 'true');
  }
  function onAnswer(correct) {
    answered = true; keyPick = null;
    tried++;
    const t = tally.get(sk.id) || [0, 0];
    t[1]++;
    if (correct) {
      right++; t[0]++;
      if (!assisted) { streak++; best = Math.max(best, streak); }
      CQ.sfx.good();
      if (!assisted && streak >= 5 && streak % 5 === 0) CQ.floatText(`🔥 ${streak} in a row!`, 'var(--warm)');
    } else { streak = 0; CQ.sfx.bad(); }
    tally.set(sk.id, t);
    // A hinted success earns no credit; a miss is recorded either way so it
    // comes back in Mistakes.
    if (!assisted || !correct) CQ.bumpMastery(q.id, correct);
    const fb = card.querySelector('.feedback');
    if (fb && q.note && !correct) fb.insertBefore(el('p', { class: 'alg-note' }, q.note), fb.querySelector('.exp'));
    if (fb) fb.querySelector('.exp')?.prepend(el('b', { class: 'alg-steps-title' }, 'Worked solution'));
    if (fb && assisted && correct) fb.append(el('p', { class: 'note' }, 'Solved with a hint — nice. Try the next one without it to earn mastery.'));
    drawHud(); drawPicker();
    const nextBtn = el('button', { type: 'button', class: 'btn primary lg', onclick: () => { next(); focusQuestion(); } }, 'Next problem →');
    actions.innerHTML = '';
    actions.append(nextBtn, el('span', { class: 'note' }, 'or press Enter'));
    nextBtn.focus({ preventScroll: true });
  }
  function onOverride() {
    // The student says the typed answer was right: count it, as the other modes do.
    const id = q.id;
    if (!assisted) CQ.state.mastery[id] = Math.min(2, (CQ.state.mastery[id] || 0) + 1);
    CQ.state.stats.correct++;
    delete CQ.state.missed[id];
    CQ.save();
    right++;
    const t = tally.get(sk.id); if (t) t[0]++;
    drawHud(); drawPicker();
  }

  CQ.addCleanup(CQ.onKeys((e) => {
    // Enter on a focused button (Next, "Override: I was right", a chip) does
    // that button's job; anywhere else it moves on once the problem is done.
    if (e.key === 'Enter') {
      if (answered && !(e.target.closest && e.target.closest('button, a, summary'))) { e.preventDefault(); next(); focusQuestion(); }
      return;
    }
    if (answered || e.ctrlKey || e.metaKey || e.altKey) return;
    if (keyPick && /^[1-4]$/.test(e.key)) keyPick(e.key);
    else if (e.key === 'h' || e.key === 'H') { const b = actions.querySelector('.alg-hint-btn'); if (b && !b.disabled) b.click(); }
  }));
  CQ.addCleanup(() => { if (API.current === q) API.current = null; });

  drawPicker(); drawHud();
  next();
}

CQ.registerMode({
  id: 'algebra', name: 'Algebra Lab', ico: '🧮', color: '#7c5cff', before: 'match',
  desc: 'Unlimited practice problems for every Algebra 1 skill, each with a step-by-step worked solution.',
  // a unit with no generated skills yet (units 13–14) keeps its other modes
  available: (set) => isAlg(set) && skillsFor(set).length > 0,
  render: renderLab,
});
})();
