/**
 * Checks Geometry Lab's generated problems (study/geometry.js) against
 * independent maths written here — it never calls geometry.js's own maths.
 *
 *   node tools/verify-geometry.mjs [baseUrl] [--n=300] [--mc=100] [--only=skill,skill]
 *
 * With a baseUrl (e.g. http://127.0.0.1:8131) the page is served over HTTP;
 * without one, study/index.html is opened straight from disk. If the page
 * does not load geometry.js yet, the script injects it.
 *
 * For every skill it generates --n problems (spread over the three levels)
 * and for each one:
 *  - works the answer out again from the numbers in the prompt (or, where the
 *    prompt says "use the figure", from the figure itself and its alt text)
 *    and compares it with the canonical answer, exactly or to the stated
 *    rounding;
 *  - asks the question's own q.check to accept the canonical answer and its
 *    equivalent forms (units spelled out or left off, "x = 5", Unicode or
 *    ASCII minus, 5√2 / 5 sqrt 2 / 5 root 2, 25π / 25 pi, pairs with any
 *    spacing or labelled "x = 3, y = −2" / "center = (3, −2)", ranges with a
 *    unit on each bound, a more precise value for a rounded answer) and to reject near
 *    misses (off by one, the supplement, the wrong rounding, π dropped, a
 *    swapped ordered pair, a wrong unit, ≤ for <);
 *  - re-evaluates every line of arithmetic in the worked solution and checks
 *    the boxed answer, that "Show me how" never gives the answer away, that a
 *    figure has alt text that does not name the answer, and that drawings not
 *    labelled "Not drawn to scale" match their numbers;
 *  - checks that no text anywhere shows NaN, undefined, null, Infinity or
 *    floating-point noise.
 * It also checks --mc multiple-choice versions per skill (exactly one right
 * option among four distinct ones, every wrong one more than 1% away) and the
 * game source. Exits non-zero on any failure.
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
const N = opt('n', 300);
const MC = opt('mc', 100);
const base = args.find((a) => !a.startsWith('--'));
const URL_ = base
  ? `${base.replace(/\/$/, '')}/study/`
  : pathToFileURL(fileURLToPath(new URL('../study/index.html', import.meta.url))).href;
const GEO_JS = fileURLToPath(new URL('../study/geometry.js', import.meta.url));
const GEO_CSS = fileURLToPath(new URL('../study/geometry.css', import.meta.url));

/* ------------------------------------------------------ exact fractions */
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
function fr(n, d = 1) {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d) || 1;
  return { n: n / g, d: d / g };
}
const fadd = (a, b) => fr(a.n * b.d + b.n * a.d, a.d * b.d);
const fsub = (a, b) => fr(a.n * b.d - b.n * a.d, a.d * b.d);
const fmul = (a, b) => fr(a.n * b.n, a.d * b.d);
const fdiv = (a, b) => fr(a.n * b.d, a.d * b.n);
const feq = (a, b) => a.n * b.d === b.n * a.d;
const fval = (a) => a.n / a.d;
const fint = (v) => fr(v, 1);
/** "3", "-2.5", "7/2" (either minus) → exact fraction, or null */
function fparse(s) {
  const t = String(s).replace(/[−–]/g, '-').trim();
  let m = t.match(/^(-?)(\d+)\/(\d+)$/);
  if (m) return fr((m[1] ? -1 : 1) * Number(m[2]), Number(m[3]));
  m = t.match(/^(-?)(\d*)(?:\.(\d+))?$/);
  if (!m || (!m[2] && !m[3])) return null;
  const f = m[3] || '';
  return fr((m[1] ? -1 : 1) * Number((m[2] || '0') + f), 10 ** f.length);
}
function fdec(a) {
  // exact decimal string of a terminating fraction, or "n/d"
  let d = a.d; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5;
  if (d !== 1) return `${a.n}/${a.d}`;
  let k = 0; while ((10 ** k) % a.d) k++;
  const i = a.n * (10 ** k / a.d);
  if (!k) return String(i);
  const s = String(Math.abs(i)).padStart(k + 1, '0');
  return `${i < 0 ? '-' : ''}${s.slice(0, -k)}.${s.slice(-k)}`.replace(/0+$/, '').replace(/\.$/, '');
}
const U = (s) => String(s).replace(/-/g, '−');
/** Round half up; returns a string with exactly dp decimals. */
function rnd(v, dp) { const f = 10 ** dp; return (Math.round(v * f + 1e-9) / f).toFixed(dp); }
const tie = (v, dp) => { const t = Math.abs(v) * 10 ** dp; return Math.abs(t - Math.floor(t) - 0.5) < 1e-6; };
const RAD = Math.PI / 180;
function sqfree(k) { let a = 1, b = k; for (let f = 2; f * f <= b; f++) while (b % (f * f) === 0) { b /= f * f; a *= f; } return { a, b }; }
const isSq = (k) => Number.isInteger(Math.sqrt(k));
/** solve p·x + q = r·x + s */
const solve = (p, q, r, s) => fr(s - q, p - r);

/* ---------------------------------------------------- reading the prompt */
const num = (s) => Number(String(s).replace(/[−–]/g, '-'));
/** "2x + 3" → [2, 3]; "−x" → [−1, 0]; "7" → [0, 7] */
function lin(s) {
  const t = String(s).replace(/[−–]/g, '-').replace(/\s+/g, '');
  let m = t.match(/^(-?\d*)x([+-]\d+)?$/);
  if (m) return [m[1] === '' ? 1 : m[1] === '-' ? -1 : Number(m[1]), m[2] ? Number(m[2]) : 0];
  m = t.match(/^-?\d+$/);
  if (m) return [0, Number(t)];
  return null;
}
const ev = (e, x) => e[0] * x + e[1];
/** Every "(x, y)" point in a text. */
const points = (s) => [...String(s).matchAll(/\((−?-?\d+), (−?-?\d+)\)/g)].map((m) => [num(m[1]), num(m[2])]);
/** Expression after "NAME = " up to " and", "," or "." */
function exprOf(prompt, name) {
  const re = new RegExp(`${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} = \\(?([^,.()]*?x[^,.()]*?|−?\\d+(?:\\.\\d+)?)\\)?°?(?=,| and|\\.|$)`);
  const m = prompt.match(re);
  return m ? lin(m[1]) : null;
}

/* --------------------------------------------------- canonical answers */
function parseAnswer(ans) {
  const s = String(ans).replace(/[−–]/g, '-').trim();
  let m;
  if (/,/.test(s) && !/^\(/.test(s)) return { kind: 'text', text: s };   // a list of lengths
  if ((m = s.match(/^\((-?[\d.]+(?:\/\d+)?), (-?[\d.]+(?:\/\d+)?)\)$/))) return { kind: 'pair', x: fparse(m[1]), y: fparse(m[2]), value: [fval(fparse(m[1])), fval(fparse(m[2]))] };
  if ((m = s.match(/^(-?[\d.]+) (<|≤) x (<|≤) (-?[\d.]+)$/))) return { kind: 'range', lo: fparse(m[1]), hi: fparse(m[4]), inc: m[2] === '≤', value: [num(m[1]), num(m[4]), m[2] === '≤' ? 1 : 0] };
  if ((m = s.match(/^(?:\((\d+)\/(\d+)\)|(\d+(?:\.\d+)?))?π(?: (.+))?$/))) {
    const c = m[1] ? fr(Number(m[1]), Number(m[2])) : fparse(m[3] || '1');
    return { kind: 'pi', c, unit: m[4] || '', value: fval(c) * Math.PI };
  }
  if ((m = s.match(/^(\d+)?√(\d+)(?: (.+))?$/))) return { kind: 'rad', a: Number(m[1] || 1), b: Number(m[2]), unit: m[3] || '', value: Number(m[1] || 1) * Math.sqrt(Number(m[2])) };
  if ((m = s.match(/^(\d+):(\d+)$/))) return { kind: 'ratio', v: fr(Number(m[1]), Number(m[2])), value: Number(m[1]) / Number(m[2]) };
  if ((m = s.match(/^(-?\d+)\/(\d+)$/))) return { kind: 'num', v: fr(Number(m[1]), Number(m[2])), unit: '', text: s, value: Number(m[1]) / Number(m[2]) };
  if ((m = s.match(/^(-?\d+(?:\.\d+)?)(°|(?: (.+)))?$/))) return { kind: 'num', v: fparse(m[1]), text: m[1], unit: m[2] === '°' ? '°' : (m[3] || ''), value: num(m[1]) };
  return { kind: 'text', text: s };
}
/** Expected answers: exact(value), round(value, dp), pi(coef), rad(a, b), pair(x, y), range(lo, hi), text(s) — with a unit. */
const E = {
  exact: (v, unit = '') => ({ k: 'exact', v: typeof v === 'number' ? fparse(String(+v.toFixed(9))) || fr(Math.round(v * 1e6), 1e6) : v, unit }),
  round: (v, dp, unit = '') => ({ k: 'round', v, dp, unit }),
  pi: (c, unit = '') => ({ k: 'pi', c: typeof c === 'number' ? fint(c) : c, unit }),
  rad: (k2, unit = '') => ({ k: 'rad', k2, unit }),   // value √k2
  pair: (x, y) => ({ k: 'pair', x: typeof x === 'number' ? fint(x) : x, y: typeof y === 'number' ? fint(y) : y }),
  range: (lo, hi, unit = '') => ({ k: 'range', lo, hi, unit }),
  text: (s) => ({ k: 'text', s }),
};
function compare(q, e) {
  const a = parseAnswer(q.answer);
  const bad = [];
  const unitIs = (want) => { if ((a.unit || '') !== want) bad.push(`unit "${a.unit || ''}", expected "${want}"`); };
  if (e.k === 'text') { if (q.answer !== e.s) bad.push(`expected "${e.s}"`); return bad; }
  if (e.k === 'exact') {
    if (a.kind === 'ratio') { if (!feq(a.v, e.v)) bad.push(`expected ratio ${fdec(e.v)}`); return bad; }
    if (a.kind !== 'num' || !feq(a.v, e.v)) bad.push(`expected ${fdec(e.v)}`);
    else unitIs(e.unit);
    return bad;
  }
  if (e.k === 'round') {
    if (tie(e.v, e.dp)) bad.push(`the true value ${e.v} is a rounding tie`);
    if (a.kind !== 'num' || a.text !== rnd(e.v, e.dp)) bad.push(`expected ${rnd(e.v, e.dp)} (from ${e.v})`);
    else unitIs(e.unit);
    return bad;
  }
  if (e.k === 'pi') { if (a.kind !== 'pi' || !feq(a.c, e.c)) bad.push(`expected ${fdec(e.c)}π`); else unitIs(e.unit); return bad; }
  if (e.k === 'rad') {
    const { a: ra, b: rb } = sqfree(e.k2);
    if (rb === 1) { if (a.kind !== 'num' || !feq(a.v, fint(ra))) bad.push(`expected ${ra}`); else unitIs(e.unit); }
    else if (a.kind !== 'rad' || a.a !== ra || a.b !== rb) bad.push(`expected ${ra === 1 ? '' : ra}√${rb}`);
    else unitIs(e.unit);
    return bad;
  }
  if (e.k === 'pair') { if (a.kind !== 'pair' || !feq(a.x, e.x) || !feq(a.y, e.y)) bad.push(`expected (${fdec(e.x)}, ${fdec(e.y)})`); return bad; }
  if (e.k === 'range') { if (a.kind !== 'range' || a.inc || !feq(a.lo, e.lo) || !feq(a.hi, e.hi)) bad.push(`expected ${fdec(e.lo)} < x < ${fdec(e.hi)}`); return bad; }
  return ['unknown expectation'];
}

/* ---------------------------------------------- figures read back from SVG */
const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
function svgParts(svg) {
  const lines = [...svg.matchAll(/<line [^>]*\/>/g)].map((m) => attrs(m[0])).map((a) => ({ x1: +a.x1, y1: +a.y1, x2: +a.x2, y2: +a.y2, cls: a.class || '' }));
  const dots = [...svg.matchAll(/<circle [^>]*class="gm-dot"[^>]*\/>/g)].map((m) => attrs(m[0])).map((a) => [+a.cx, +a.cy]);
  const texts = [...svg.matchAll(/<text ([^>]*)>([^<]*)<\/text>/g)].map((m) => ({ ...attrs(m[1]), text: m[2] }));
  const polys = [...svg.matchAll(/<polygon points="([^"]*)"/g)].map((m) => m[1].trim().split(/\s+/).map((p) => p.split(',').map(Number)));
  return { lines, dots, texts, polys, nts: /Not drawn to scale/.test(svg) };
}
const angleAtPt = (v, a, b) => {
  const u = [a[0] - v[0], a[1] - v[1]], w = [b[0] - v[0], b[1] - v[1]];
  return Math.acos((u[0] * w[0] + u[1] * w[1]) / Math.hypot(...u) / Math.hypot(...w)) / RAD;
};
/** Parallel-lines figure: for each numbered angle, which crossing, above/below, which side of t, and its drawn measure. */
function readParallel(svg) {
  const { lines, dots, texts } = svgParts(svg);
  const t = lines.find((l) => l.cls.includes('gm-seg') && Math.abs(l.y1 - l.y2) > 1);
  if (!t || dots.length !== 2) return null;
  const up = t.y1 < t.y2 ? [t.x1 - t.x2, t.y2 - t.y1] : [t.x2 - t.x1, t.y1 - t.y2];   // math orientation
  const phi = ((Math.atan2(up[1], up[0]) / RAD) + 360) % 360;
  const [top, bot] = dots[0][1] < dots[1][1] ? dots : [dots[1], dots[0]];
  const out = {};
  for (const tx of texts.filter((x) => /gm-num/.test(x.class || '') && /^[1-8]$/.test(x.text))) {
    const x = +tx.x, y = +tx.y;
    const I = Math.abs(y - top[1]) < Math.abs(y - bot[1]) ? top : bot;
    const beta = ((Math.atan2(-(y - I[1]), x - I[0]) / RAD) + 360) % 360;
    const region = beta < phi ? 0 : beta < 180 ? 1 : beta < 180 + phi ? 2 : 3;
    out[tx.text] = { line: I === top ? 'l' : 'm', above: region < 2, right: region === 0 || region === 3, measure: region % 2 === 0 ? phi : 180 - phi };
  }
  return { phi, angles: out };
}
function pairKind(A, B) {
  if (A.line === B.line) return A.above !== B.above && A.right !== B.right ? 'Vertical angles' : 'Linear pair';
  if (A.above === B.above && A.right === B.right) return 'Corresponding angles';
  const inside = (p) => (p.line === 'l' ? !p.above : p.above);
  if (inside(A) && inside(B)) return A.right !== B.right ? 'Alternate interior angles' : 'Same-side interior angles';
  if (!inside(A) && !inside(B)) return A.right !== B.right ? 'Alternate exterior angles' : 'Same-side exterior angles';
  return null;
}
const CONGRUENT_PAIRS = new Set(['Vertical angles', 'Corresponding angles', 'Alternate interior angles', 'Alternate exterior angles']);

/* ----------------------------------------------------- per-skill solvers
   Each takes the serialised question and returns an expectation (see E),
   pushing any inconsistency it notices onto q.issues. */
const need = (q, text) => { if (!q.prompt.includes(text)) q.issues.push(`the prompt does not contain "${text}"`); };
const P2 = (p) => `(${U(p[0])}, ${U(p[1])})`;
const LENW = { cm: 'cm', in: 'in', ft: 'ft', m: 'm' };
const unitIn = (s) => (String(s).match(/\d (cm|in|ft|m|mm|yd)\b/) || [])[1] || '';
const NAMES = { triangle: 3, quadrilateral: 4, pentagon: 5, hexagon: 6, heptagon: 7, octagon: 8, nonagon: 9, decagon: 10, dodecagon: 12 };
const polyN = (s) => { const m = s.match(/(\d+)-gon/); if (m) return Number(m[1]); for (const [k, v] of Object.entries(NAMES)) if (new RegExp(`\\b${k}\\b`).test(s)) return v; return null; };
const solvers = {
  midpoint(q) {
    const pts = points(q.prompt);
    if (/^Find the midpoint/.test(q.prompt)) { const [A, B] = pts; return E.pair(fr(A[0] + B[0], 2), fr(A[1] + B[1], 2)); }
    const [M, A] = pts;
    return E.pair(2 * M[0] - A[0], 2 * M[1] - A[1]);
  },
  distance(q) {
    const [A, B] = points(q.prompt);
    const d2 = (B[0] - A[0]) ** 2 + (B[1] - A[1]) ** 2;
    if (!/Round to the nearest tenth/.test(q.prompt)) q.issues.push('no rounding instruction');
    return isSq(d2) ? E.exact(Math.sqrt(d2), 'units') : E.round(Math.sqrt(d2), 1, 'units');
  },
  segadd(q) {
    const mid = /is the midpoint/.test(q.prompt);
    const ask = q.prompt.match(/Find (\w+)\.$/)[1];
    if (mid) {
      const e1 = exprOf(q.prompt, 'AM'), e2 = exprOf(q.prompt, 'MB');
      const x = solve(e1[0], e1[1], e2[0], e2[1]);
      if (x.d !== 1) q.issues.push('x is not a whole number');
      const X = fval(x), am = ev(e1, X);
      if (am <= 0) q.issues.push('a non-positive length');
      return ask === 'x' ? E.exact(x) : E.exact(ask === 'AB' ? 2 * am : am);
    }
    const e1 = exprOf(q.prompt, 'AB'), e2 = exprOf(q.prompt, 'BC'), e3 = exprOf(q.prompt, 'AC');
    const x = solve(e1[0] + e2[0], e1[1] + e2[1], e3[0], e3[1]);
    if (x.d !== 1) q.issues.push('x is not a whole number');
    const X = fval(x);
    const L = { AB: ev(e1, X), BC: ev(e2, X), AC: ev(e3, X) };
    if (L.AB <= 0 || L.BC <= 0) q.issues.push('a non-positive length');
    return ask === 'x' ? E.exact(x) : E.exact(L[ask]);
  },
  anglepairs(q) {
    const e1 = exprOf(q.prompt, 'm∠1'), e2 = exprOf(q.prompt, 'm∠2');
    const rel = /complementary/.test(q.prompt) ? 'comp' : /supplementary/.test(q.prompt) ? 'supp' : /vertical angles/.test(q.prompt) ? 'vert' : /linear pair/.test(q.prompt) ? 'lin'
      : /opposite each other/.test(q.figureAlt || '') ? 'vert' : /straight line with a ray/.test(q.figureAlt || '') ? 'lin' : null;
    if (!rel) { q.issues.push('relationship not stated'); return E.text('?'); }
    const x = rel === 'vert' ? solve(e1[0], e1[1], e2[0], e2[1]) : solve(e1[0] + e2[0], e1[1] + e2[1], 0, rel === 'comp' ? 90 : 180);
    const X = fval(x), m1 = ev(e1, X), m2 = ev(e2, X);
    if (!(m1 > 0 && m2 > 0 && m1 < 180 && m2 < 180)) q.issues.push(`impossible angles ${m1}°, ${m2}°`);
    const ask = q.prompt.match(/Find (x|m∠[12])\.$/)[1];
    return ask === 'x' ? E.exact(x) : E.exact(ask === 'm∠1' ? m1 : m2, '°');
  },
  related(q) {
    const t = q.data.t;
    const sent = (h, c) => `If ${t.s} ${h}, then ${t.pr} ${c}.`;
    need(q, `“${sent(t.P, t.Q)}”`);
    const forms = { converse: sent(t.Q, t.P), inverse: sent(t.nP, t.nQ), contrapositive: sent(t.nQ, t.nP) };
    for (const [p, np] of [[t.P, t.nP], [t.Q, t.nQ]]) if (!/\bnot\b/.test(np) || np === p) q.issues.push(`"${np}" is not the negation of "${p}"`);
    const m = q.prompt.match(/Which of these is its (converse|inverse|contrapositive)\?$/);
    if (m) {
      for (const f of Object.values(forms)) if (!q.options.includes(f)) q.issues.push(`option missing: ${f}`);
      return E.text(forms[m[1]]);
    }
    const shown = q.prompt.match(/called\? “(.+)”$/)[1];
    const which = Object.entries(forms).find(([, s]) => s === shown);
    if (!which) { q.issues.push('the related statement is none of the three forms'); return E.text('?'); }
    return E.text(which[0][0].toUpperCase() + which[0].slice(1));
  },
  hypconc(q) {
    const t = q.data.t, C = (s) => s[0].toUpperCase() + s.slice(1);
    const s = q.prompt.match(/“(.+)”$/)[1];
    const styles = [`If ${t.s} ${t.P}, then ${t.pr} ${t.Q}.`, `${C(t.s)} ${t.Q} if ${t.pr} ${t.P}.`, `When ${t.s} ${t.P}, ${t.pr} ${t.Q}.`, `${C(t.s)} ${t.P} only if ${t.pr} ${t.Q}.`];
    if (!styles.includes(s)) q.issues.push(`statement not understood: ${s}`);
    const ask = q.prompt.match(/the (hypothesis|conclusion) of/)[1];
    return E.text(ask === 'hypothesis' ? `${C(t.s)} ${t.P}` : `${C(t.s)} ${t.Q}`);
  },
  pairname(q) {
    const [, a, b] = q.prompt.match(/are ∠(\d) and ∠(\d)\?$/);
    const f = readParallel(q.figure);
    if (!f || !f.angles[a] || !f.angles[b]) { q.issues.push('figure not understood'); return E.text('?'); }
    return E.text(pairKind(f.angles[a], f.angles[b]) || '?');
  },
  pairmeasure(q) {
    const [, a, g, b] = q.prompt.match(/m∠(\d) = (\d+)°\. Find m∠(\d)\.$/);
    const f = readParallel(q.figure);
    if (!f) { q.issues.push('figure not understood'); return E.text('?'); }
    const A = f.angles[a], B = f.angles[b];
    if (Math.abs(A.measure - Number(g)) > 0.6) q.issues.push(`the figure draws ∠${a} as ${A.measure.toFixed(1)}°, not ${g}°`);
    // angles with the same drawn measure are congruent; the others are supplementary
    return E.exact(Math.abs(A.measure - B.measure) < 1 ? Number(g) : 180 - Number(g), '°');
  },
  pairx(q) {
    const [, a, b] = q.prompt.match(/m∠(\d) = .*? and m∠(\d) = /);
    const e1 = exprOf(q.prompt, `m∠${a}`), e2 = exprOf(q.prompt, `m∠${b}`);
    const f = readParallel(q.figure);
    const kind = pairKind(f.angles[a], f.angles[b]);
    const x = CONGRUENT_PAIRS.has(kind) ? solve(e1[0], e1[1], e2[0], e2[1]) : solve(e1[0] + e2[0], e1[1] + e2[1], 0, 180);
    const X = fval(x);
    if (Math.abs(ev(e1, X) - f.angles[a].measure) > 0.6) q.issues.push(`with x = ${X}, ∠${a} = ${ev(e1, X)}° but the figure draws ${f.angles[a].measure.toFixed(1)}°`);
    const ask = q.prompt.match(/Find (x|m∠\d)\.$/)[1];
    return ask === 'x' ? E.exact(x) : E.exact(ev(ask === `m∠${a}` ? e1 : e2, X), '°');
  },
  slope(q) {
    let m;
    const p = q.prompt.replace(/−/g, '-');
    let s;
    if ((m = p.match(/equation y = (-)?(?:\((\d+)\/(\d+)\)|(\d+))?x/))) s = fr((m[1] ? -1 : 1) * Number(m[2] || m[4] || 1), Number(m[3] || 1));
    else if ((m = p.match(/equation (\d*)x ([+-]) (\d*)y = (-?\d+)/))) s = fr(-Number(m[1] || 1), (m[2] === '-' ? -1 : 1) * Number(m[3] || 1));
    else { const [A, B] = points(q.prompt); s = fr(B[1] - A[1], B[0] - A[0]); }
    const perp = /perpendicular to line p/.test(q.prompt);
    return E.exact(perp ? fdiv(fint(-1), s) : s);
  },
  trisum(q) {
    const p = q.prompt;
    const ask = p.match(/Find (x|m∠[ABC])\.$/)[1];
    if (/\(.*x.*\)°/.test(p)) {
      const es = ['A', 'B', 'C'].map((v) => exprOf(p, `m∠${v}`));
      const x = solve(es.reduce((s, e) => s + e[0], 0), es.reduce((s, e) => s + e[1], 0), 0, 180);
      const X = fval(x);
      if (es.some((e) => ev(e, X) <= 0)) q.issues.push('a non-positive angle');
      return ask === 'x' ? E.exact(x) : E.exact(ev(es['ABC'.indexOf(ask[2])], X), '°');
    }
    const known = [...p.matchAll(/m∠([ABC]) = (\d+)°/g)].map((m) => Number(m[2]));
    if (/right triangle/.test(p)) known.push(90);
    if (known.length !== 2) q.issues.push('not two known angles');
    return E.exact(180 - known[0] - known[1], '°');
  },
  exterior(q) {
    const p = q.prompt;
    if (/\(.*x.*\)°/.test(p)) {
      const e1 = exprOf(p, 'm∠A'), e2 = exprOf(p, 'm∠B'), e3 = exprOf(p, 'm∠ACD');
      const x = solve(e1[0] + e2[0], e1[1] + e2[1], e3[0], e3[1]);
      const X = fval(x);
      if (ev(e1, X) <= 0 || ev(e2, X) <= 0 || ev(e3, X) >= 180) q.issues.push('impossible angles');
      const ask = p.match(/Find (x|m∠\w+)\.$/)[1];
      return ask === 'x' ? E.exact(x) : E.exact(ask === 'm∠A' ? ev(e1, X) : ev(e3, X), '°');
    }
    let m;
    if ((m = p.match(/m∠A = (\d+)° and m∠B = (\d+)°\. Find the exterior angle/))) return E.exact(Number(m[1]) + Number(m[2]), '°');
    m = p.match(/measures (\d+)° and m∠[AB] = (\d+)°/);
    return E.exact(Number(m[1]) - Number(m[2]), '°');
  },
  isosceles(q) {
    const p = q.prompt;
    need(q, 'AB = AC');
    const ask = p.match(/Find (x|m∠[ABC])\.$/)[1];
    let m;
    if ((m = p.match(/m∠A = (\d+)°\. Find m∠[BC]/))) return E.exact((180 - Number(m[1])) / 2, '°');
    if ((m = p.match(/m∠[BC] = (\d+)°\. Find m∠A/))) return E.exact(180 - 2 * Number(m[1]), '°');
    const eA = exprOf(p, 'm∠A'), eB = exprOf(p, 'm∠B'), eC = exprOf(p, 'm∠C');
    if (eB && eC) {
      const x = solve(eB[0], eB[1], eC[0], eC[1]), X = fval(x);
      return ask === 'x' ? E.exact(x) : E.exact(180 - 2 * ev(eB, X), '°');
    }
    const x = solve(eA[0] + 2 * eB[0], eA[1] + 2 * eB[1], 0, 180), X = fval(x);
    return ask === 'x' ? E.exact(x) : E.exact(ev(ask === 'm∠A' ? eA : eB, X), '°');
  },
  congruence(q) {
    // read what is marked from the alt text alone: side XY is opposite the third vertex
    const alt = q.figureAlt;
    const sides = [...alt.matchAll(/sides ([ABC]{2}) and [DEF]{2} have/g)].map((m) => 'ABC'.split('').find((v) => !m[1].includes(v))).map((v) => 'ABC'.indexOf(v));
    const angles = [...alt.matchAll(/angles ([ABC]) and [DEF] have/g)].map((m) => 'ABC'.indexOf(m[1]));
    const rm = alt.match(/angles ([ABC]) and [DEF] are marked as right angles/);
    const right = rm ? 'ABC'.indexOf(rm[1]) : null;
    if (right != null && sides.length === 2 && !angles.length && sides.includes(right)) return E.text('HL');
    const A = angles.length + (right != null ? 1 : 0), S = sides.length;
    if (S === 3) return E.text('SSS');
    if (S === 2 && A === 1) return E.text(!sides.includes(angles.length ? angles[0] : right) ? 'SAS' : 'Not enough information');
    if (S === 1 && A === 2) return E.text(!angles.includes(sides[0]) ? 'ASA' : 'AAS');
    if (S === 0 && A === 3) return E.text('Not enough information');
    q.issues.push(`marks not understood: ${alt}`);
    return E.text('?');
  },
  midsegment(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(/BC = ([\d.]+) (\w+)\. Find DE\./))) return E.exact(fdiv(fparse(m[1]), fint(2)), m[2]);
    if ((m = p.match(/DE = ([\d.]+) (\w+)\. Find BC\./))) return E.exact(fmul(fparse(m[1]), fint(2)), m[2]);
    const e1 = exprOf(p, 'DE'), e2 = exprOf(p, 'BC');
    const x = solve(2 * e1[0], 2 * e1[1], e2[0], e2[1]), X = fval(x);
    const ask = p.match(/Find (x|DE|BC)\.$/)[1];
    return ask === 'x' ? E.exact(x) : E.exact(ask === 'DE' ? ev(e1, X) : ev(e2, X));
  },
  inequality(q) {
    const can = !/NOT/.test(q.prompt);
    const ok = (o) => { const v = o.split(', ').map((t) => num(t.split(' ')[0])).sort((a, b) => a - b); return v[0] + v[1] > v[2] + 1e-9; };
    const good = q.options.filter((o) => ok(o) === can);
    if (good.length !== 1) q.issues.push(`${good.length} options fit`);
    return E.text(good[0] || '?');
  },
  thirdside(q) {
    const m = q.prompt.replace(/−/g, '-').match(/measure (\d+(?:\.\d+)?)(?: \w+)? and (\d+(?:\.\d+)?)/);
    const a = fparse(m[1]), b = fparse(m[2]);
    return E.range(fval(a) > fval(b) ? fsub(a, b) : fsub(b, a), fadd(a, b));
  },
  similar(q) {
    const p = q.prompt;
    const vals = Object.fromEntries([...p.matchAll(/\b([A-F]{2}) = (\d+)(?=[,. ])/g)].map((m) => [m[1], Number(m[2])]));
    const partner = { BC: 'EF', CA: 'FD', AB: 'DE', EF: 'BC', FD: 'CA', DE: 'AB' };
    const known = Object.keys(vals).find((k) => vals[partner[k]] != null && 'ABC'.includes(k[0]));
    if (!known) { q.issues.push('no corresponding pair given'); return E.text('?'); }
    const k = fr(vals[partner[known]], vals[known]);   // ABC → DEF
    if (/scale factor/.test(p)) return E.exact(k);
    const target = p.match(/Find ([A-F]{2}|x)\.$/)[1];
    let side = target, e = null;
    if (target === 'x') { const m = p.match(/([A-F]{2}) = ([^,.=]*x[^,.=]*?)\. Find x/); side = m[1]; e = lin(m[2]); }
    const other = partner[side];
    if (vals[other] == null) { q.issues.push(`no partner for ${side}`); return E.text('?'); }
    const len = 'ABC'.includes(side[0]) ? fdiv(fint(vals[other]), k) : fmul(fint(vals[other]), k);
    if (!e) return E.exact(len);
    return E.exact(solve(e[0], e[1], 0, fval(len)));
  },
  simcrit(q) {
    const d = q.data;
    // every number used here must be what the figure (and its description) shows
    for (const t of [d.t1, d.t2]) {
      for (const v of (t.sides || []).filter((x) => x != null)) if (!new RegExp(`side [A-F]{2} ${v}\\b`).test(q.figureAlt || '')) q.issues.push(`the figure description does not show a side of ${v}`);
      for (const v of (t.angles || []).filter((x) => x != null)) if (!(q.figureAlt || '').includes(`${v}°`)) q.issues.push(`the figure description does not show ${v}°`);
    }
    const full = (t) => { const a = (t.angles || [null, null, null]).slice(); const k = a.filter((x) => x != null); if (k.length === 2) { a[a.indexOf(null)] = 180 - k[0] - k[1]; return a; } return null; };
    const A1 = full(d.t1), A2 = full(d.t2);
    if (A1 && A2) {
      const same = A1.every((x, i) => Math.abs(x - A2[i]) < 1e-9);
      // "not similar" must hold under every matching of the vertices (A 75°, B 55° against
      // D 75°, E 50° is still similar: C = 50° and F = 55°, so △ABC ~ △DFE)
      const sorted = (t) => t.slice().sort((x, y) => x - y);
      if (!same && sorted(A1).every((x, i) => Math.abs(x - sorted(A2)[i]) < 1e-9)) q.issues.push('"Not similar", but the triangles have the same three angles under another matching of the vertices');
      return E.text(same ? 'AA' : 'Not similar');
    }
    const s1 = (d.t1.sides || []).filter((x) => x != null), s2 = (d.t2.sides || []).filter((x) => x != null);
    if (s1.length === 3) {
      const a = s1.slice().sort((x, y) => x - y), b = s2.slice().sort((x, y) => x - y);
      return E.text(feq(fr(b[0], a[0]), fr(b[1], a[1])) && feq(fr(b[1], a[1]), fr(b[2], a[2])) ? 'SSS' : 'Not similar');
    }
    for (const t of [d.t1, d.t2]) {
      const si = (t.sides || []).map((x, i) => (x != null ? i : -1)).filter((i) => i >= 0);
      const ai = (t.angles || []).map((x, i) => (x != null ? i : -1)).filter((i) => i >= 0);
      // the angle at vertex i lies between the two sides that are not opposite it
      if (si.length !== 2 || ai.length !== 1 || si.includes(ai[0])) q.issues.push('the marked angle is not the one between the two given sides');
    }
    const g1 = d.t1.angles[2], g2 = d.t2.angles[2];
    const prop = Math.abs(s2[0] / s1[0] - s2[1] / s1[1]) < 1e-12;
    // "not similar" must hold under every matching of the vertices, not just A↔D, B↔E, C↔F:
    // work out the third side (law of cosines) and compare the sorted sides
    if (!(prop && g1 === g2)) {
      const third = (p, q, g) => Math.sqrt(p * p + q * q - 2 * p * q * Math.cos((g * Math.PI) / 180));
      const a = [s1[0], s1[1], third(s1[0], s1[1], g1)].sort((x, y) => x - y), b = [s2[0], s2[1], third(s2[0], s2[1], g2)].sort((x, y) => x - y);
      if (a.every((x, i) => Math.abs(b[i] / x - b[0] / a[0]) < 1e-9)) q.issues.push('"Not similar", but the triangles are similar under another matching of the vertices');
    }
    return E.text(prop && g1 === g2 ? 'SAS' : 'Not similar');
  },
  pythag(q) {
    const p = q.prompt;
    const u = unitIn(p);
    let m = p.match(/legs of (\d+) \w+ and (\d+) \w+/);
    let v2;
    if (m) v2 = Number(m[1]) ** 2 + Number(m[2]) ** 2;
    else { m = p.match(/hypotenuse of (\d+) \w+ and one leg of (\d+)/); v2 = Number(m[1]) ** 2 - Number(m[2]) ** 2; }
    if (!/Round to the nearest tenth/.test(p)) q.issues.push('no rounding instruction');
    return isSq(v2) ? E.exact(Math.sqrt(v2), u) : E.round(Math.sqrt(v2), 1, u);
  },
  classify(q) {
    const s = q.prompt.match(/side lengths ([\d, ]+)\./)[1].split(', ').map(Number).sort((a, b) => a - b);
    if (s[0] + s[1] <= s[2]) return E.text('Not a triangle');
    const d = s[2] ** 2 - s[0] ** 2 - s[1] ** 2;
    return E.text(d === 0 ? 'Right' : d < 0 ? 'Acute' : 'Obtuse');
  },
  special(q) {
    const p = q.prompt;
    const v = (t) => { const m = t.match(/^(\d*)√(\d+)$/); return m ? Number(m[1] || 1) * Math.sqrt(Number(m[2])) : Number(t); };
    const u = unitIn(p.replace(/√\d+/g, ''));
    let known, x;
    if (/45°-45°-90°/.test(p)) {
      const m = p.match(/(each leg|the hypotenuse) is ([\d√]+)/);
      const L = m[1] === 'each leg' ? v(m[2]) : v(m[2]) / Math.SQRT2;
      known = { leg: L, hyp: L * Math.SQRT2 };
      x = /Find the length of the hypotenuse/.test(p) ? known.hyp : known.leg;
    } else {
      const m = p.match(/the (shorter leg|longer leg|hypotenuse) is ([\d√]+)/);
      const s = m[1] === 'shorter leg' ? v(m[2]) : m[1] === 'longer leg' ? v(m[2]) / Math.sqrt(3) : v(m[2]) / 2;
      known = { short: s, long: s * Math.sqrt(3), hyp: 2 * s };
      x = /the shorter leg\.( |$)/.test(p.split('Find')[1]) ? known.short : /the longer leg/.test(p.split('Find')[1]) ? known.long : known.hyp;
    }
    // exact value x = √k2 with k2 an integer
    const k2 = Math.round(x * x);
    if (Math.abs(k2 - x * x) > 1e-6) q.issues.push(`the answer ${x} is not a square root of a whole number`);
    return E.rad(k2, u);
  },
  trigratio(q) {
    const m = q.prompt.match(/BC = (\d+), AC = (\d+) and AB = (\d+)\. Find (sin|cos|tan) ([AB])\./);
    const [a, b, c] = [1, 2, 3].map((i) => Number(m[i]));
    if (a * a + b * b !== c * c) q.issues.push('not a right triangle');
    const opp = m[5] === 'A' ? a : b, adj = m[5] === 'A' ? b : a;
    return E.exact({ sin: fr(opp, c), cos: fr(adj, c), tan: fr(opp, adj) }[m[4]]);
  },
  trigside(q) {
    const m = q.prompt.replace(/−/g, '-').match(/m∠A = (\d+)° and (BC|AC|AB) = ([\d.]+) (\w+)\. Find (BC|AC|AB)\./);
    const th = Number(m[1]) * RAD, v = Number(m[3]);
    const hyp = m[2] === 'AB' ? v : m[2] === 'BC' ? v / Math.sin(th) : v / Math.cos(th);
    const s = { AB: hyp, BC: hyp * Math.sin(th), AC: hyp * Math.cos(th) };
    return E.round(s[m[5]], 1, m[4]);
  },
  trigangle(q) {
    const m = q.prompt.match(/(BC|AC|AB) = (\d+) and (BC|AC|AB) = (\d+)\. Find m∠A/);
    const s = { [m[1]]: Number(m[2]), [m[3]]: Number(m[4]) };
    const th = s.BC != null && s.AC != null ? Math.atan(s.BC / s.AC) : s.BC != null ? Math.asin(s.BC / s.AB) : Math.acos(s.AC / s.AB);
    return E.round(th / RAD, 0, '°');
  },
  elevation(q) {
    const p = q.prompt;
    let m;
    const t = (deg) => Number(deg) * RAD;
    if ((m = p.match(/stand (\d+) ft from the base of a tree\. The angle of elevation to the top of the tree is (\d+)°/))) return E.round(Number(m[1]) * Math.tan(t(m[2])), 1, 'ft');
    if ((m = p.match(/kite string is (\d+) ft long and makes an? (\d+)° angle/))) return E.round(Number(m[1]) * Math.sin(t(m[2])), 1, 'ft');
    if ((m = p.match(/top of an? (\d+) m lighthouse, the angle of depression to a boat is (\d+)°/))) return E.round(Number(m[1]) / Math.tan(t(m[2])), 1, 'm');
    if ((m = p.match(/plane flying at (\d+) ft sees a runway light at an angle of depression of (\d+)°/))) return E.round(Number(m[1]) / Math.sin(t(m[2])), 1, 'ft');
    if ((m = p.match(/An? (\d+) ft ladder leans against a wall with its foot (\d+) ft from the wall/))) return E.round(Math.acos(Number(m[2]) / Number(m[1])) / RAD, 0, '°');
    if ((m = p.match(/An? (\d+) m flagpole casts a shadow (\d+) m long/))) return E.round(Math.atan(Number(m[1]) / Number(m[2])) / RAD, 0, '°');
    q.issues.push('scenario not understood');
    return E.text('?');
  },
  polysum(q) {
    const p = q.prompt;
    const n = polyN(p);
    if (/sum of the interior angle measures/.test(p)) return E.exact((n - 2) * 180, '°');
    const given = [...p.matchAll(/(\d+)°/g)].map((m) => Number(m[1]));
    if (given.length !== n - 1) q.issues.push(`${given.length} angles given for a ${n}-sided polygon`);
    const last = (n - 2) * 180 - given.reduce((a, b) => a + b, 0);
    if (!(last > 0 && last < 180)) q.issues.push(`the last angle ${last}° is not a convex angle`);
    return E.exact(last, '°');
  },
  regular(q) {
    const n = polyN(q.prompt);
    return E.exact(/interior/.test(q.prompt) ? fr(180 * (n - 2), n) : fr(360, n), '°');
  },
  sides(q) {
    const p = q.prompt.replace(/−/g, '-');
    let m;
    let n;
    if ((m = p.match(/exterior angle of a regular polygon measures ([\d.]+)°/))) n = fdiv(fint(360), fparse(m[1]));
    else if ((m = p.match(/interior angle of a regular polygon measures ([\d.]+)°/))) n = fdiv(fint(360), fsub(fint(180), fparse(m[1])));
    else { m = p.match(/add up to (\d+)°/); n = fadd(fr(Number(m[1]), 180), fint(2)); }
    if (n.d !== 1) q.issues.push('not a whole number of sides');
    return E.exact(n, 'sides');
  },
  quad(q) {
    const p = q.prompt;
    const shape = p.match(/is a (parallelogram|rectangle|rhombus)/)[1];
    const parts = [...p.matchAll(/(m∠[A-E]{1,3}|\b[A-E]{2}) = ([^.]*?)(?= and |\.)/g)].map((m) => [m[1], lin(m[2].replace(/[()°]/g, ''))]);
    const names = parts.map((x) => x[0]).join('|');
    // how the parts are related, from the shape's properties
    const REL = {
      'parallelogram:AB|CD': 'eq', 'parallelogram:m∠A|m∠C': 'eq', 'parallelogram:m∠A|m∠B': 'sum', 'parallelogram:AE|EC': 'eq',
      'rectangle:AC|BD': 'eq', 'rectangle:AE|BD': 'double', 'rectangle:m∠ABC': 'ninety',
      'rhombus:AB|BC': 'eq', 'rhombus:m∠AEB': 'ninety', 'rhombus:m∠BAC|m∠DAC': 'eq',
    }[`${shape}:${names}`];
    if (!REL) { q.issues.push(`no property relates ${names} in a ${shape}`); return E.text('?'); }
    const [e1, e2] = parts.map((x) => x[1]);
    const x = REL === 'eq' ? solve(e1[0], e1[1], e2[0], e2[1]) : REL === 'sum' ? solve(e1[0] + e2[0], e1[1] + e2[1], 0, 180) : REL === 'double' ? solve(2 * e1[0], 2 * e1[1], e2[0], e2[1]) : solve(e1[0], e1[1], 0, 90);
    const X = fval(x);
    if (parts.some(([, e]) => ev(e, X) <= 0)) q.issues.push('a non-positive measure');
    const ask = p.match(/Find (x|m∠\w+|[A-E]{2})\.$/)[1];
    if (ask === 'x') return E.exact(x);
    if (ask === 'AC' && shape === 'parallelogram') return E.exact(2 * ev(e1, X));
    const e = parts.find((y) => y[0] === ask)[1];
    return E.exact(ev(e, X), ask.startsWith('m∠') ? '°' : '');
  },
  transform(q) {
    const p = q.prompt.replace(/−/g, '-');
    let [pt] = points(q.prompt);
    let P = [fint(pt[0]), fint(pt[1])];
    const neg = (a) => fmul(a, fint(-1));
    const desc = p.match(/\) is (.+)\. What are/)[1].split(', then ');
    for (const d of desc) {
      let m;
      if ((m = d.match(/^translated (\d+) units? (right|left) and (\d+) units? (up|down)$/))) P = [fadd(P[0], fint((m[2] === 'right' ? 1 : -1) * Number(m[1]))), fadd(P[1], fint((m[4] === 'up' ? 1 : -1) * Number(m[3])))];
      else if (d === 'reflected across the x-axis') P = [P[0], neg(P[1])];
      else if (d === 'reflected across the y-axis') P = [neg(P[0]), P[1]];
      else if (d === 'reflected across the line y = x') P = [P[1], P[0]];
      else if (d === 'reflected across the line y = -x') P = [neg(P[1]), neg(P[0])];
      else if (d === 'rotated 90° counterclockwise about the origin') P = [neg(P[1]), P[0]];
      else if (d === 'rotated 180° about the origin') P = [neg(P[0]), neg(P[1])];
      else if (d === 'rotated 270° counterclockwise about the origin') P = [P[1], neg(P[0])];
      else if ((m = d.match(/^dilated by a scale factor of ([\d/]+), centered at the origin$/))) { const k = fparse(m[1]); P = [fmul(P[0], k), fmul(P[1], k)]; }
      else { q.issues.push(`transformation not understood: ${d}`); return E.text('?'); }
    }
    return E.pair(P[0], P[1]);
  },
  rule(q) {
    const alt = q.figureAlt.replace(/−/g, '-');
    const pre = [...alt.matchAll(/\b([ABC])\((-?\d+), (-?\d+)\)/g)].map((m) => [Number(m[2]), Number(m[3])]);
    const img = [...alt.matchAll(/\b([ABC])′\((-?\d+), (-?\d+)\)/g)].map((m) => [Number(m[2]), Number(m[3])]);
    const fits = (o) => {
      const f = ruleOf(o);
      if (!f) { q.issues.push(`option not understood: ${o}`); return false; }
      return pre.every((p0, i) => { const r = f(p0); return Math.abs(r[0] - img[i][0]) < 1e-9 && Math.abs(r[1] - img[i][1]) < 1e-9; });
    };
    const good = q.options.filter(fits);
    if (good.length !== 1) q.issues.push(`${good.length} options map ABC onto A′B′C′`);
    return E.text(good[0] || '?');
  },
  circle(q) {
    const p = q.prompt;
    const u = unitIn(p.replace(/π/g, ''));
    let m;
    if ((m = p.match(/(circumference of|area of) (\d+)π/))) {
      const k = Number(m[2]);
      return E.exact(m[1] === 'circumference of' ? k / 2 : Math.sqrt(k), u);
    }
    m = p.match(/a (radius|diameter) of (\d+) (\w+)\. Find its (circumference|area)/);
    const r = m[1] === 'radius' ? Number(m[2]) : Number(m[2]) / 2;
    const coef = m[4] === 'circumference' ? 2 * r : r * r;
    const unit = m[4] === 'area' ? `${m[3]}²` : m[3];
    return /in terms of π/.test(p) ? E.pi(coef, unit) : E.round(coef * Math.PI, 1, unit);
  },
  arc(q) {
    const p = q.prompt;
    const r = Number(p.match(/radius of (\d+)/)[1]), th = Number(p.match(/angle of (\d+)°/)[1]), u = p.match(/radius of \d+ (\w+)/)[1];
    const sector = /area of a sector/.test(p);
    const c = sector ? fr(th * r * r, 360) : fr(th * 2 * r, 360);
    const unit = sector ? `${u}²` : u;
    return /in terms of π/.test(p) ? E.pi(c, unit) : E.round(fval(c) * Math.PI, 1, unit);
  },
  inscribed(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(/arc AB measures (\d+)°\. Find the measure of the central angle/))) return E.exact(Number(m[1]), '°');
    if ((m = p.match(/Arc AB measures (\d+)°, and inscribed angle ∠ACB intercepts it/))) return E.exact(Number(m[1]) / 2, '°');
    if ((m = p.match(/Inscribed angle ∠ACB measures (\d+)° and intercepts arc AB/))) return E.exact(2 * Number(m[1]), '°');
    if ((m = p.match(/central angle ∠AOB measures (\d+)°\. Inscribed angle ∠ACB intercepts the same arc/))) return E.exact(Number(m[1]) / 2, '°');
    if ((m = p.match(/inscribed in a circle, and m∠A = (\d+)°\. Find m∠C/))) return E.exact(180 - Number(m[1]), '°');
    if ((m = p.match(/AB is a diameter .* m∠CAB = (\d+)°\. Find m∠ABC/))) return E.exact(90 - Number(m[1]), '°');
    q.issues.push('prompt not understood');
    return E.text('?');
  },
  circeq(q) {
    const p = q.prompt.replace(/−/g, '-');
    let h, k, r2, m;
    if ((m = p.match(/equation x² \+ y²((?: [+-] \d+x)?)((?: [+-] \d+y)?)((?: [+-] \d+)?) = 0/))) {
      const c = (s) => (s ? Number(s.replace(/[xy ]/g, '')) : 0);
      const D = c(m[1]), Ee = c(m[2]), F = c(m[3]);
      h = -D / 2; k = -Ee / 2; r2 = h * h + k * k - F;
    } else {
      m = p.match(/equation (x²|\(x ([+-]) (\d+)\)²) \+ (y²|\(y ([+-]) (\d+)\)²) = (\d+)/);
      h = m[2] ? (m[2] === '-' ? 1 : -1) * Number(m[3]) : 0;
      k = m[5] ? (m[5] === '-' ? 1 : -1) * Number(m[6]) : 0;
      r2 = Number(m[7]);
    }
    return /its center\?/.test(p) ? E.pair(h, k) : E.rad(r2, 'units');
  },
  tangent(q) {
    const p = q.prompt;
    if (/PA and PB are tangent/.test(p)) {
      const e1 = exprOf(p, 'PA'), e2 = exprOf(p, 'PB');
      const x = solve(e1[0], e1[1], e2[0], e2[1]);
      return /Find x\.$/.test(p) ? E.exact(x) : E.exact(ev(e1, fval(x)));
    }
    const u = unitIn(p);
    const r = (p.match(/radius is (\d+)/) || [])[1], pt = (p.match(/PT = (\d+)/) || [])[1], op = (p.match(/OP = (\d+)/) || [])[1];
    let v2, v;
    if (/Find PT\./.test(p)) v2 = op ** 2 - r ** 2;
    else if (/Find OP\./.test(p)) v2 = r ** 2 + pt ** 2;
    else if (/Find the radius/.test(p)) v2 = op ** 2 - pt ** 2;
    else { v = Math.sqrt(r ** 2 + pt ** 2) - r; return Number.isInteger(Math.round(v * 1e9) / 1e9) ? E.exact(Math.round(v), u) : E.round(v, 1, u); }
    if (!(v2 > 0)) q.issues.push('impossible lengths');
    return isSq(v2) ? E.exact(Math.sqrt(v2), u) : E.round(Math.sqrt(v2), 1, u);
  },
  area(q) {
    const p = q.prompt;
    const u = unitIn(p);
    const A2 = `${u}²`;
    let m;
    if ((m = p.match(/A triangle has a base of (\d+) \w+ and a height of (\d+)/))) return E.exact(fr(Number(m[1]) * Number(m[2]), 2), A2);
    if ((m = p.match(/A parallelogram has a base of (\d+) \w+ and a height of (\d+)/))) return E.exact(Number(m[1]) * Number(m[2]), A2);
    if ((m = p.match(/trapezoid has bases of (\d+) \w+ and (\d+) \w+ and a height of (\d+)/))) return E.exact(fr((Number(m[1]) + Number(m[2])) * Number(m[3]), 2), A2);
    if ((m = p.match(/is (\d+) \w+ wide and (\d+) \w+ tall, with an? (\d+) \w+ by (\d+) \w+ rectangle cut out/))) return E.exact(Number(m[1]) * Number(m[2]) - Number(m[3]) * Number(m[4]), A2);
    if ((m = p.match(/an? (\d+) \w+ by (\d+) \w+ rectangle with a triangle on top\. The triangle has the same \d+ \w+ base and a height of (\d+)/))) return E.exact(fadd(fint(Number(m[1]) * Number(m[2])), fr(Number(m[1]) * Number(m[3]), 2)), A2);
    if ((m = p.match(/window is an? (\d+) \w+ by (\d+) \w+ rectangle topped by a semicircle/))) { const w = Number(m[1]); return E.round(w * Number(m[2]) + (Math.PI * (w / 2) ** 2) / 2, 1, A2); }
    q.issues.push('shape not understood');
    return E.text('?');
  },
  solid(q) {
    const p = q.prompt;
    const u = unitIn(p);
    const V = /volume/.test(p);
    const unit = `${u}${V ? '³' : '²'}`;
    const n1 = (re) => Number((p.match(re) || [])[1]);
    let c, pi = true;
    if (/rectangular prism/.test(p)) {
      const [l, w, h] = [n1(/is (\d+) \w+ long/), n1(/(\d+) \w+ wide/), n1(/(\d+) \w+ tall/)];
      c = fint(V ? l * w * h : 2 * (l * w + l * h + w * h)); pi = false;
    } else if (/cylinder/.test(p)) { const r = n1(/radius of (\d+)/), h = n1(/height of (\d+)/); c = fint(V ? r * r * h : 2 * r * r + 2 * r * h); }
    else if (/cone/.test(p)) {
      const r = n1(/radius of (\d+)/), h = n1(/a height of (\d+)/), l = n1(/slant height of (\d+)/);
      if (l && Math.abs(l * l - r * r - h * h) > 1e-9) q.issues.push('the cone\'s slant height does not match its radius and height');
      c = V ? fr(r * r * h, 3) : fint(r * r + r * l);
    } else if (/pyramid/.test(p)) {
      const s = n1(/base edge of (\d+)/), h = n1(/a height of (\d+)/), l = n1(/slant height of (\d+)/);
      if (Math.abs(l * l - (s / 2) ** 2 - h * h) > 1e-9) q.issues.push('the pyramid\'s slant height does not match its base and height');
      c = V ? fr(s * s * h, 3) : fint(s * s + 2 * s * l); pi = false;
    } else if (/sphere/.test(p)) { const r = n1(/radius of (\d+)/); c = V ? fr(4 * r ** 3, 3) : fint(4 * r * r); }
    else { q.issues.push('solid not understood'); return E.text('?'); }
    if (!pi) return E.exact(c, unit);
    return /in terms of π/.test(p) ? E.pi(c, unit) : E.round(fval(c) * Math.PI, 1, unit);
  },
  scale(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(/multiplied by (\d+)\. By what number is its (area|volume)/))) return E.exact(Number(m[1]) ** (m[2] === 'area' ? 2 : 3));
    if ((m = p.match(/ratio (\d+):(\d+)\. What is the ratio of their volumes/))) { const a = Math.sqrt(Number(m[1])), b = Math.sqrt(Number(m[2])); return E.exact(fr(a ** 3, b ** 3)); }
    m = p.match(/scale factor of (\d+):(\d+)\. The (smaller|larger) one has (?:an? )?(area|surface area|volume) of (\d+) (\w+)(²|³)/);
    const [a, b] = [Number(m[1]), Number(m[2])];
    const pw = m[4] === 'volume' ? 3 : 2;
    const given = Number(m[5]);
    const v = m[3] === 'smaller' ? fr(given * b ** pw, a ** pw) : fr(given * a ** pw, b ** pw);
    if (v.d !== 1) q.issues.push('not a whole number');
    return E.exact(v, `${m[6]}${m[7]}`);
  },
};
/** A transformation option ("Reflection across the x-axis", "(x, y) → (−y, x)") as a function. */
function ruleOf(o) {
  const s = o.replace(/−/g, '-');
  let m;
  if ((m = s.match(/^Translation (\d+) units? (right|left) and (\d+) units? (up|down)$/))) { const a = (m[2] === 'right' ? 1 : -1) * Number(m[1]), b = (m[4] === 'up' ? 1 : -1) * Number(m[3]); return ([x, y]) => [x + a, y + b]; }
  if ((m = s.match(/^\(x, y\) → \(x ([+-]) (\d+), y ([+-]) (\d+)\)$/))) { const a = (m[1] === '+' ? 1 : -1) * Number(m[2]), b = (m[3] === '+' ? 1 : -1) * Number(m[4]); return ([x, y]) => [x + a, y + b]; }
  const table = {
    'Reflection across the x-axis': ([x, y]) => [x, -y], 'Reflection across the y-axis': ([x, y]) => [-x, y],
    'Reflection across the line y = x': ([x, y]) => [y, x], 'Reflection across the line y = -x': ([x, y]) => [-y, -x],
    'Rotation 90° counterclockwise about the origin': ([x, y]) => [-y, x], 'Rotation 180° about the origin': ([x, y]) => [-x, -y],
    'Rotation 90° clockwise about the origin': ([x, y]) => [y, -x],
    '(x, y) → (x, -y)': ([x, y]) => [x, -y], '(x, y) → (-x, y)': ([x, y]) => [-x, y], '(x, y) → (y, x)': ([x, y]) => [y, x], '(x, y) → (-y, -x)': ([x, y]) => [-y, -x],
    '(x, y) → (-y, x)': ([x, y]) => [-y, x], '(x, y) → (-x, -y)': ([x, y]) => [-x, -y], '(x, y) → (y, -x)': ([x, y]) => [y, -x],
  };
  if (table[s]) return table[s];
  if ((m = s.match(/^Dilation by a scale factor of ([\d/]+) centered at the origin$/)) || (m = s.match(/^\(x, y\) → \((\d+)x, \1y\)$/)) || (m = s.match(/^\(x, y\) → \(\((\d+\/\d+)\)x, \(\1\)y\)$/))) { const k = fval(fparse(m[1])); return ([x, y]) => [k * x, k * y]; }
  return null;
}

/* ----------------------------------------- inputs a student might type */
const WORDS = { cm: ['cm', 'centimeters'], m: ['m', 'meters'], in: ['in', 'inches'], ft: ['ft', 'feet'], mm: ['mm', 'millimeters'], yd: ['yd', 'yards'], units: ['units'] };
function unitForms(u) {
  if (!u) return { good: [], bad: [' cm'] };
  if (u === 'deg') return { good: ['°', ' degrees', ' deg'], bad: [' cm'] };
  if (u === 'sides') return { good: [' sides'], bad: [' cm'] };
  if (u === 'times') return { good: [' times'], bad: [' cm'] };
  const [dim, b] = u.split(':');
  const w = WORDS[b];
  if (dim === 'len') return { good: w.map((x) => ` ${x}`), bad: [` ${b}²`, ' degrees'] };
  if (dim === 'area') return { good: [` ${b}²`, ` ${b}^2`, ` sq ${b}`, ` square ${w[1]}`], bad: [` ${b}`, ` ${b}³`] };
  return { good: [` ${b}³`, ` ${b}^3`, ` cubic ${w[1]}`], bad: [` ${b}²`, ` ${b}`] };
}
function inputs(q) {
  const a = q.ans, out = [];
  const yes = (input, why) => out.push({ input, expect: true, why });
  const no = (input, why) => out.push({ input, expect: false, why });
  yes(q.answer, 'the canonical answer');
  yes(q.answer.replace(/−/g, '-'), 'the canonical answer with an ASCII minus');
  const uf = unitForms(a.u);
  const lhs = (a.names || [])[0];
  if (a.k === 'num') {
    const v = fr(a.v.n, a.v.d), s = fdec(v);
    yes(s, 'the bare number');
    for (const g of uf.good) yes(`${s}${g}`, `with the unit "${g.trim()}"`);
    if (!s.includes('/')) yes(s.includes('.') ? `${s}0` : `${s}.0`, 'with a trailing zero');
    if (v.d !== 1 && !s.includes('/')) yes(`${v.n}/${v.d}`, 'as a fraction');
    if (s.startsWith('-')) yes(U(s), 'with a Unicode minus');
    if (lhs && lhs.length <= 3 && !/^(sin|cos|tan)/.test(lhs)) yes(a.u === 'deg' ? `m∠${lhs.toUpperCase()} = ${s}°` : `${lhs.length === 1 ? lhs : lhs.toUpperCase()} = ${s}`, 'with "name =" in front');
    if ((a.names || []).includes('x') && !(a.names || []).includes('y')) no(`y = ${s}`, 'the wrong variable');
    const n1 = fdec(fadd(v, fint(1))), m1 = fdec(fsub(v, fint(1)));
    no(n1, 'off by one'); no(m1, 'off by one');
    if (a.u === 'deg' && fval(v) !== 90 && fval(v) < 180) no(fdec(fsub(fint(180), v)), 'the supplement');
    if (a.u === 'deg' && fval(v) < 90 && fval(v) !== 45) no(fdec(fsub(fint(90), v)), 'the complement');
    for (const b of uf.bad) no(`${s}${b}`, `the wrong unit "${b.trim()}"`);
    if (fval(v) > 1) no(`${s}π`, 'π added');
  } else if (a.k === 'round') {
    const st = rnd(a.v, a.dp), f = 10 ** -a.dp;
    yes(st, 'the rounded number');
    for (const g of uf.good) yes(`${st}${g}`, `with the unit "${g.trim()}"`);
    yes(`≈ ${st}`, 'with ≈ in front');
    const precise = rnd(a.v, a.dp + 2);
    if (!tie(a.v, a.dp + 2) && rnd(Number(precise), a.dp) === st) yes(precise, 'a more precise value');
    // a precise-looking value that rounds to a different answer
    const off = (Number(st) + 0.6 * f).toFixed(a.dp + 1);
    if (rnd(Number(off), a.dp) !== st) no(off, 'a more precise value that rounds the wrong way');
    if (a.rad2) {
      yes(`√${a.rad2}`, 'the exact square root');
      const { a: ra, b: rb } = sqfree(a.rad2);
      if (ra > 1 && rb > 1) yes(`${ra}√${rb}`, 'the exact simplified radical');
    }
    if (a.pic) yes(`${fdec(fr(a.pic.n, a.pic.d))}π`, 'the exact answer in terms of π');
    no(rnd(Number(st) + f, a.dp), 'one unit too high'); no(rnd(Number(st) - f, a.dp), 'one unit too low');
    const trunc = (Math.floor(a.v * 10 ** a.dp + 1e-9) / 10 ** a.dp).toFixed(a.dp);
    if (trunc !== st) no(trunc, 'cut off instead of rounded');
    if (a.dp >= 1) { const whole = rnd(a.v, a.dp - 1); if (Number(whole) !== Number(st)) no(whole, 'rounded to the wrong place'); }
    for (const b of uf.bad) no(`${st}${b}`, `the wrong unit "${b.trim()}"`);
    if (a.u === 'deg' && a.v < 90 && rnd(90 - a.v, a.dp) !== st) no(rnd(90 - a.v, a.dp), 'the complement');
  } else if (a.k === 'pi') {
    const c = fr(a.c.n, a.c.d), cs = fdec(c), one = c.n === 1 && c.d === 1;
    const heads = [];
    if (one) heads.push('π', 'pi', '1π');
    else heads.push(`${cs}π`, `${cs}pi`, `${cs} pi`, `${cs} π`, `${cs}*pi`, `${cs} x pi`.replace(' x ', '*'));
    if (c.d !== 1) heads.push(`(${c.n}/${c.d})π`, `${c.n}π/${c.d}`, `${c.n}/${c.d} pi`);
    for (const h of heads) yes(h, 'π written another way');
    for (const g of uf.good) yes(`${heads[0]}${g}`, `with the unit "${g.trim()}"`);
    no(cs, 'π dropped');
    for (const g of uf.good.slice(0, 1)) no(`${cs}${g}`, 'π dropped (with the unit)');
    no(`${fdec(fadd(c, fint(1)))}π`, 'off by one');
    no(rnd(fval(c) * Math.PI, 1), 'a decimal instead of in terms of π');
    for (const b of uf.bad) no(`${heads[0]}${b}`, `the wrong unit "${b.trim()}"`);
  } else if (a.k === 'rad') {
    const { a: ra, b: rb } = a;
    const k = ra === 1 ? '' : String(ra);
    for (const h of [`${k}√${rb}`, `${k}sqrt${rb}`, `${k} sqrt ${rb}`, `${k}sqrt(${rb})`, `${k} sqrt(${rb})`, `${k} root ${rb}`, `${k}√(${rb})`, ...(ra > 1 ? [`${ra}*sqrt(${rb})`, `${ra} √ ${rb}`] : [])]) yes(h.trim(), 'the radical written another way');
    for (const g of uf.good) yes(`${k}√${rb}${g}`, `with the unit "${g.trim()}"`);
    no((ra * Math.sqrt(rb)).toFixed(2), 'a decimal instead of the exact form');
    no(`${ra + 1}√${rb}`, 'off by one');
    if (ra > 1) { no(`√${ra * ra * rb}`, 'not simplified'); no(String(ra), 'the radical dropped'); }
    no(`${k}√${rb + 1}`, 'the wrong radicand');
    for (const b of uf.bad) no(`${k}√${rb}${b}`, `the wrong unit "${b.trim()}"`);
  } else if (a.k === 'pair') {
    const x = fr(a.x.n, a.x.d), y = fr(a.y.n, a.y.d);
    const xs = fdec(x), ys = fdec(y);
    yes(`(${xs}, ${ys})`, 'ASCII minus'); yes(`(${xs},${ys})`, 'no space'); yes(` ( ${xs} , ${ys} ) `, 'extra spaces'); yes(`${xs}, ${ys}`, 'without brackets');
    yes(`(${U(xs)}, ${U(ys)})`, 'Unicode minus');
    if (x.d !== 1 || y.d !== 1) yes(`(${x.d === 1 ? xs : `${x.n}/${x.d}`}, ${y.d === 1 ? ys : `${y.n}/${y.d}`})`, 'fractions');
    if (!feq(x, y)) no(`(${ys}, ${xs})`, 'the swapped ordered pair');
    no(`(${fdec(fadd(x, fint(1)))}, ${ys})`, 'off by one');
    if (y.n !== 0) no(`(${xs}, ${fdec(fmul(y, fint(-1)))})`, 'a sign slip');
    no(`(${xs}, ${fdec(fadd(y, fint(1)))})`, 'off by one');
    // labelled forms: "x = 3, y = −2", "(x, y) = (3, −2)", "center = (3, −2)", "h = 3, k = −2"
    yes(`x = ${xs}, y = ${ys}`, 'x = …, y = …'); yes(`x=${xs},y=${ys}`, 'x=…,y=… without spaces'); yes(`x = ${U(xs)} and y = ${U(ys)}`, 'x = … and y = …');
    yes(`y = ${ys}, x = ${xs}`, 'labelled coordinates in the other order'); yes(`(x, y) = (${xs}, ${ys})`, '(x, y) = (…)');
    yes(`P' = (${xs}, ${ys})`, 'a point name in front'); yes(`M(${xs}, ${ys})`, 'a point name right before the pair');
    if (q.skill === 'circeq') { yes(`center = (${xs}, ${ys})`, 'center = (…)'); yes(`h = ${xs}, k = ${ys}`, 'h = …, k = …'); yes(`(h, k) = (${xs}, ${ys})`, '(h, k) = (…)'); yes(`the center is (${xs}, ${ys})`, 'in words'); }
    if (q.skill === 'transform') yes(`image = (${xs}, ${ys})`, 'image = (…)');
    if (!feq(x, y)) no(`x = ${ys}, y = ${xs}`, 'the swapped coordinates, labelled');
    no(`x = ${fdec(fadd(x, fint(1)))}, y = ${ys}`, 'off by one, labelled');
    no(`x = ${xs}`, 'only one coordinate');
  } else if (a.k === 'range') {
    const lo = fdec(fr(a.lo.n, a.lo.d)), hi = fdec(fr(a.hi.n, a.hi.d));
    yes(`${lo} < x < ${hi}`, 'ASCII'); yes(`${lo}<x<${hi}`, 'no spaces'); yes(`${hi} > x > ${lo}`, 'written the other way'); yes(`between ${lo} and ${hi}`, 'in words');
    yes(`${lo} < c < ${hi}`, 'another letter');
    no(`${lo} ≤ x ≤ ${hi}`, '≤ instead of <'); no(`${lo} <= x <= ${hi}`, '<= instead of <');
    no(`${lo} < x < ${fdec(fadd(fr(a.hi.n, a.hi.d), fint(1)))}`, 'off by one'); no(`${hi} < x < ${lo}`, 'the limits swapped');
    if (a.u) {
      const b = a.u.split(':')[1], other = b === 'cm' ? 'in' : 'cm';
      for (const g of uf.good) { yes(`${lo} < x < ${hi}${g}`, `the unit "${g.trim()}" at the end`); yes(`${lo}${g} < x < ${hi}${g}`, `the unit "${g.trim()}" on each bound`); }
      yes(`between ${lo}${uf.good[0]} and ${hi}${uf.good[0]}`, 'in words with units');
      no(`${lo} ${other} < x < ${hi} ${other}`, 'the wrong unit on each bound'); no(`${lo}${uf.good[0]} < x < ${hi} ${other}`, 'a wrong unit on one bound');
      no(`${lo} < x < ${hi} ${other}`, 'the wrong unit at the end');
    }
  }
  return out;
}

/* -------------------------------------------- arithmetic in the working */
function tokenize(s) {
  const out = [];
  const re = /\s*(\d+(?:\.\d+)?|[-+×÷/(),²³√π½])\s*/y;
  let m;
  re.lastIndex = 0;
  while (re.lastIndex < s.length) {
    m = re.exec(s);
    if (!m) return null;
    out.push(m[1]);
  }
  return out;
}
function evalExpr(src) {
  let s = String(src).replace(/[−–]/g, '-').replace(/°/g, '').replace(/✓/g, '').trim();
  s = s.replace(/\s*(?:units|sides|cm|mm|m|in|ft|yd)(?:²|³)?\s*$/, '');
  if (!s || /[A-Za-z?<>∠⁻]/.test(s)) return null;
  const t = tokenize(s);
  if (!t || !t.length) return null;
  let i = 0;
  const peek = () => t[i];
  const startsFactor = (x) => x != null && (/^\d/.test(x) || x === '(' || x === '√' || x === 'π' || x === '½');
  function atom() {
    const x = t[i++];
    if (x == null) throw new Error('end');
    if (/^\d/.test(x)) return Number(x);
    if (x === 'π') return Math.PI;
    if (x === '½') return 0.5;
    if (x === '√') { const v = power(); if (typeof v !== 'number') throw new Error('tuple'); return Math.sqrt(v); }
    if (x === '(') {
      const v = expr();
      if (peek() === ',') { i++; const w = expr(); if (t[i++] !== ')') throw new Error(')'); return [v, w]; }
      if (t[i++] !== ')') throw new Error(')');
      return v;
    }
    throw new Error(`unexpected ${x}`);
  }
  function power() { let v = atom(); while (peek() === '²' || peek() === '³') { const p = t[i++] === '²' ? 2 : 3; v = v ** p; } return v; }
  function implicit() { let v = power(); while (startsFactor(peek())) v *= power(); return v; }
  function unary() { if (peek() === '-') { i++; return -unary(); } if (peek() === '+') { i++; return unary(); } return implicit(); }
  function term() { let v = unary(); while (['×', '÷', '/'].includes(peek())) { const op = t[i++]; const w = unary(); v = op === '×' ? v * w : v / w; } return v; }
  function expr() { let v = term(); while (peek() === '+' || peek() === '-') { const op = t[i++]; const w = term(); v = op === '+' ? v + w : v - w; } return v; }
  try {
    const v = expr();
    if (i !== t.length) return null;
    if (Array.isArray(v)) return v.every(Number.isFinite) ? v : null;
    return Number.isFinite(v) ? v : null;
  } catch { return null; }
}
const decimalsOf = (s) => ((String(s).match(/\d\.(\d+)/g) || []).map((x) => x.split('.')[1].length).pop() || 0);
function checkLines(lines) {
  const bad = [];
  let prev = null;
  for (const raw of lines) {
    const line = raw.replace(/\s+/g, ' ').trim();
    const cont = /^[=≈]/.test(line);
    if (!cont) prev = null;
    const parts = line.split(/\s*([=≈])\s*/);
    // parts: [seg, sep, seg, sep, seg...]
    let sep = cont ? parts[1] : null;
    const segs = cont ? parts.slice(2) : parts;
    for (let k = 0; k < segs.length; k += 2) {
      const seg = segs[k];
      if (k > 0) sep = segs[k - 1];
      const v = evalExpr(seg);
      if (v == null) { prev = null; continue; }
      if (prev && sep) {
        const A = [].concat(prev.v), B = [].concat(v);
        const tol = (x, y) => (sep === '≈' ? Math.max(0.5 * 10 ** -decimalsOf(seg), 0.5 * 10 ** -decimalsOf(prev.seg), Math.abs(y) * 6e-4) + 1e-9 : Math.max(Math.abs(x), Math.abs(y)) * 1e-9 + 1e-9);
        if (A.length !== B.length || A.some((x, j) => Math.abs(x - B[j]) > tol(x, B[j]))) bad.push(`"${prev.seg} ${sep} ${seg}" is wrong (${A.map((x) => +x.toFixed(6)).join(', ')} vs ${B.map((x) => +x.toFixed(6)).join(', ')}) in "${line}"`);
      }
      prev = { v, seg };
    }
  }
  return bad;
}

/* -------------------------------------------------------- general checks */
const BAD_TEXT = (text) => {
  const bad = [];
  if (/\b(NaN|Infinity|undefined|null)\b|\[object /.test(text)) bad.push(`NaN/Infinity/undefined/null in "${text.match(/.{0,40}(NaN|Infinity|undefined|null|\[object ).{0,20}/)[0]}"`);
  if (/\d[eE][-+]?\d/.test(text.replace(/[A-Za-z]+\d/g, ''))) bad.push(`e-notation: ${text.match(/\S*\d[eE][-+]?\d\S*/)[0]}`);
  for (const tok of text.match(/\d+\.\d{7,}/g) || []) bad.push(`float noise "${tok}"`);
  // notation a student would stumble on
  let m;
  if ((m = text.match(/(?<![A-Za-z∠])(?<!(?:angle|vertex|point|side) )[Aa] (?:8\d*|1[18])(?![\d.,])\S*/))) bad.push(`"a" before a number said with a vowel sound: "${m[0]}"`);
  if ((m = text.match(/(?<![A-Za-z∠])[Aa] (?:octagon|eleven|eight)/))) bad.push(`"a" before a vowel sound: "${m[0]}"`);
  if ((m = text.match(/\b\d+\/\d+[a-zπ]\b/))) bad.push(`a fraction written straight onto a variable (reads as 1/(2x)): "${m[0]}"`);
  if ((m = text.match(/\d\/1(?![\d.])|\(\d+\/1\)/))) bad.push(`a whole number written over 1: "${m[0]}"`);
  if ((m = text.match(/√1(?!\d)/))) bad.push(`√1: "${m[0]}"`);
  if ((m = text.match(/when the lines are parallel/)) && /vertical angles|linear pair/i.test(text.slice(Math.max(0, m.index - 60), m.index))) bad.push('says vertical angles or a linear pair need parallel lines');
  if ((m = text.match(/are (?:Linear|Vertical|Corresponding|Alternate|Same-side)/))) bad.push(`capitalised pair name mid-sentence: "${m[0]}"`);
  return bad;
};
const MUST_FIGURE = new Set(['midpoint', 'distance', 'segadd', 'anglepairs', 'pairname', 'pairmeasure', 'pairx', 'trisum', 'exterior', 'isosceles', 'congruence', 'midsegment', 'similar', 'simcrit', 'pythag', 'classify', 'special', 'trigratio', 'trigside', 'trigangle', 'elevation', 'quad', 'transform', 'rule', 'circle', 'arc', 'inscribed', 'tangent', 'area', 'solid']);
/** Drawings without "Not drawn to scale" must match their numbers. */
function scaleCheck(q) {
  if (!q.figure) return [];
  const f = svgParts(q.figure);
  if (f.nts) return [];
  const bad = [];
  const poly = f.polys[0];
  const angs = poly && poly.length === 3 ? [0, 1, 2].map((i) => angleAtPt(poly[i], poly[(i + 1) % 3], poly[(i + 2) % 3])) : null;
  const near = (x, y, tol = 1.2) => Math.abs(x - y) <= tol;
  if (q.skill === 'trisum' && angs) {
    const given = [...q.prompt.matchAll(/m∠([ABC]) = (\d+)°/g)];
    for (const g of given) { const i = 'ABC'.indexOf(g[1]); if (!near(angs[i], Number(g[2]))) bad.push(`∠${g[1]} is labelled ${g[2]}° but drawn ${angs[i].toFixed(1)}°`); }
  }
  if (q.skill === 'isosceles' && angs) {
    if (!near(angs[1], angs[2])) bad.push('the base angles are drawn unequal');
    const m = q.prompt.match(/m∠A = (\d+)°|m∠[BC] = (\d+)°/);
    if (m && m[1] && !near(angs[0], Number(m[1]))) bad.push(`the vertex angle is drawn ${angs[0].toFixed(1)}°, labelled ${m[1]}°`);
    if (m && m[2] && !near(angs[1], Number(m[2]))) bad.push(`a base angle is drawn ${angs[1].toFixed(1)}°, labelled ${m[2]}°`);
  }
  if (q.skill === 'special' && angs) {
    const want = /45°-45°-90°/.test(q.prompt) ? [45, 45, 90] : [30, 60, 90];
    if (!angs.every((x, i) => near(x, want[i]))) bad.push(`drawn angles ${angs.map((x) => x.toFixed(0)).join('/')}, expected ${want.join('/')}`);
  }
  if (q.skill === 'trigside' && angs) {
    const th = Number(q.prompt.match(/m∠A = (\d+)°/)[1]);
    if (!near(angs[0], th) || !near(angs[2], 90)) bad.push(`drawn ∠A = ${angs[0].toFixed(1)}°, labelled ${th}°`);
  }
  if (q.skill === 'classify') {
    const segs = f.lines.filter((l) => l.cls.includes('gm-hl')).map((l) => Math.hypot(l.x2 - l.x1, l.y2 - l.y1));
    const lens = q.prompt.match(/side lengths ([\d, ]+)\./)[1].split(', ').map(Number);
    const k = segs[0] / lens[0];
    if (segs.some((s, i) => Math.abs(s / k - lens[i]) > 0.15)) bad.push('the segments are not drawn to scale');
  }
  return bad;
}
function checkQuestion(q) {
  const bad = [];
  const all = [q.prompt, q.answer, ...(q.options || []), q.exp, q.hint || '', q.figureAlt || '', q.figText || '', q.brief || '', ...(q.lines || []), ...(q.hintLines || [])].join(' ¦ ');
  bad.push(...BAD_TEXT(all));
  if (q.id !== `geom:${q.skill}`) bad.push(`id is ${q.id}`);
  if (q.type === 'mc') {
    if (!q.options || q.options.length !== 4) bad.push(`${(q.options || []).length} options`);
    else {
      if (new Set(q.options).size !== 4) bad.push(`duplicate options: ${q.options.join(' | ')}`);
      if (q.options.filter((o) => o === q.answer).length !== 1) bad.push('the answer is not exactly one of the options');
      const pa = parseAnswer(q.answer);
      if (pa.value != null) {
        const vals = q.options.map((o) => parseAnswer(o).value);
        const far = (x, y) => { const X = [].concat(x), Y = [].concat(y); return X.length !== Y.length || X.some((v, i) => Math.abs(v - Y[i]) > Math.max(Math.abs(v), Math.abs(Y[i])) * 0.01 + 1e-9); };
        vals.forEach((v, i) => {
          if (v == null) bad.push(`option "${q.options[i]}" is not the same kind of answer`);
          vals.forEach((w, j) => { if (j > i && v != null && w != null && !far(v, w)) bad.push(`options "${q.options[i]}" and "${q.options[j]}" are within 1%`); });
        });
      }
    }
  }
  if (q.figure || MUST_FIGURE.has(q.skill)) {
    if (!q.figure) bad.push('no figure');
    else {
      if (!/^<svg[^>]*aria-hidden="true"[\s\S]*<\/svg>$/.test(q.figure)) bad.push('the figure is not an aria-hidden inline SVG');
      if (!q.figureAlt || q.figureAlt.length < 12) bad.push('no alt text for the figure');
      if (/#[0-9a-f]{3,6}\b|rgb\(/i.test(q.figure)) bad.push('the figure hard-codes a colour');
      const leak = q.answer.length > 2 && q.figureAlt && q.figureAlt.includes(q.answer) && !q.prompt.includes(q.answer);
      if (leak) bad.push(`the alt text names the answer "${q.answer}"`);
    }
  }
  if (!q.mc) {
    // the worked solution: boxed answer, arithmetic, and a hint that stops short
    if (!q.boxed.includes(q.answer) && !q.boxed.some((b) => b.includes(q.answer))) bad.push(`the worked solution never boxes the answer (boxed: ${q.boxed.join(' | ') || 'nothing'})`);
    bad.push(...checkLines(q.lines).map((x) => `working: ${x}`));
    bad.push(...checkLines(q.hintLines).map((x) => `hint: ${x}`));
    if (q.hintBoxed) bad.push('"Show me how" boxes an answer');
    const esc = q.answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // a line of the hint that ends "= answer", or the answer as a whole token in its text
    if (q.type === 'written' && q.hintLines.some((l) => new RegExp(`[=≈] ?${esc}\\s*$`).test(l.trim()))) bad.push('"Show me how" states the answer');
    if (q.type === 'written' && /[^\d\s.−-]/.test(q.answer) && q.hint && new RegExp(`(^|[^\\w.])${esc}(?![\\w.√π/])`).test(q.hint) && !q.prompt.includes(q.answer)) bad.push('"Show me how" contains the answer');
    bad.push(...scaleCheck(q));
    if (q.type === 'written' && !q.placeholder) bad.push('no placeholder');
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
await page.waitForFunction(() => window.CQ, null, { timeout: 10000 });
if (!(await page.evaluate(() => !!window.CQGeometry))) {
  await page.addStyleTag({ path: GEO_CSS });
  await page.addScriptTag({ path: GEO_JS });
}
await page.waitForFunction(() => window.CQGeometry, null, { timeout: 10000 });

const only = (args.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const skills = (await page.evaluate(() => window.CQGeometry.skills)).filter((s) => !only.length || only.includes(s.id));
const rows = {};
const failures = [];
const note = (q, msg) => {
  (rows[q.skill] ||= { gen: 0, mc: 0, fail: 0, checks: 0 }).fail++;
  if (failures.length < 80) failures.push(`${q.skill}${q.mc ? ' (mc)' : ''} L${q.level}: ${msg}\n      prompt: ${q.prompt}\n      answer: ${q.answer}${q.options ? `\n      options: ${q.options.join(' | ')}` : ''}`);
};
for (const s of skills) {
  const batch = await page.evaluate(({ id, N, MC }) => {
    const G = window.CQGeometry;
    window.__geo = window.__geo || [];
    const text = (x) => (x == null ? null : typeof x === 'string' ? x : x.textContent);
    const lines = (x) => (x && typeof x !== 'string' ? [...x.querySelectorAll('.gm-ln')].map((n) => n.textContent) : []);
    const pack = (q, level, mc) => {
      const idx = window.__geo.push(q) - 1;
      const hint = q.hint ? q.hint() : null;
      return {
        idx, skill: id, level, mc, id: q.id, setId: q.setId, type: q.type, prompt: q.prompt, answer: q.answer, options: q.options || null,
        ans: q.ans, data: q.data, placeholder: q.placeholder, brief: q.brief,
        exp: text(q.explanation), hint: mc ? null : text(hint),
        lines: mc ? [] : lines(q.explanation), hintLines: mc ? [] : lines(hint),
        boxed: mc || typeof q.explanation === 'string' ? [] : [...q.explanation.querySelectorAll('.gm-ans')].map((n) => n.textContent),
        hintBoxed: hint && typeof hint !== 'string' ? hint.querySelectorAll('.gm-ans').length : 0,
        figure: q.figure || null, figureAlt: q.figureAlt || null, figText: q.figure ? q.figure.replace(/<[^>]+>/g, ' ') : null,
      };
    };
    const out = [];
    for (let i = 0; i < N; i++) { const level = 1 + (i % 3); try { out.push(pack(G.generate(id, { difficulty: level }), level, false)); } catch (e) { out.push({ skill: id, level, error: String(e && e.stack || e) }); } }
    for (let i = 0; i < MC; i++) { const level = 1 + (i % 3); try { out.push(pack(G.generateMC(id, { difficulty: level }), level, true)); } catch (e) { out.push({ skill: id, level, mc: true, error: String(e && e.stack || e) }); } }
    return out;
  }, { id: s.id, N, MC });

  const requests = [];
  for (const q of batch) {
    const r = (rows[q.skill] ||= { gen: 0, mc: 0, fail: 0, checks: 0 });
    if (q.error) { note(q, `generator threw: ${q.error.split('\n')[0]}`); continue; }
    if (q.mc) r.mc++; else r.gen++;
    if (q.setId !== s.setId) note(q, `setId is ${q.setId}, expected ${s.setId}`);
    q.issues = [];
    let expect = null;
    try { expect = solvers[q.skill](q); } catch (e) { note(q, `the independent solver could not read this problem: ${e.message}`); }
    for (const p of q.issues) note(q, p);
    if (expect) for (const p of compare(q, expect)) note(q, `answer: ${p}`);
    for (const p of checkQuestion(q)) note(q, p);
    if (!q.mc && q.type === 'written') for (const inp of inputs(q)) requests.push({ ...inp, idx: q.idx, q });
  }
  const verdicts = await page.evaluate((reqs) => reqs.map(({ idx, input }) => {
    const q = window.__geo[idx];
    const own = q.check(input);
    return { own, core: window.CQ.checkWritten(q, input) };
  }), requests.map(({ idx, input }) => ({ idx, input })));
  requests.forEach((req, i) => {
    const v = verdicts[i];
    rows[req.q.skill].checks++;
    if (v.own !== req.expect) note(req.q, `q.check ${v.own ? 'accepted' : 'rejected'} ${req.why}: "${req.input}"`);
    else if (v.core !== v.own) note(req.q, `CQ.checkWritten disagrees with q.check on "${req.input}"`);
  });
  await page.evaluate(() => { window.__geo = []; });
}

// game source: about 12 multiple-choice problems for Geometry sets, none elsewhere
const games = await page.evaluate(() => {
  const G = window.CQGeometry;
  const ids = [...window.CQ.SUBJECTS.find((x) => x.id === 'geo').sets.map((x) => x.id), 'geo-all', 'chem-all', 'c2', ...(window.CQ.getSet('alg1-u1') ? ['alg1-u1'] : [])];
  const out = {};
  for (const id of ids) {
    const qs = G.gameQuestions(id);
    out[id] = { n: qs.length, bad: qs.filter((q) => q.type !== 'mc' || !q.options || q.options.length !== 4 || new Set(q.options).size !== 4 || q.options.filter((o) => o === q.answer).length !== 1 || !/^geom:/.test(q.id)).length, sets: [...new Set(qs.map((q) => q.setId))], exp: qs.filter((q) => !q.explanation).length };
  }
  const resolved = G.skills.map((s) => { const r = window.CQ.SETS && s; return r; });
  return { out, resolved: resolved.length };
});
for (const [id, g] of Object.entries(games.out)) {
  const geo = id.startsWith('geo-');
  if (geo && g.n < 10) failures.push(`game source for ${id} gave only ${g.n} problems`);
  if (!geo && g.n) failures.push(`game source for ${id} should give nothing, gave ${g.n}`);
  if (g.bad) failures.push(`game source for ${id}: ${g.bad} malformed questions`);
  if (g.exp) failures.push(`game source for ${id}: ${g.exp} questions without an explanation`);
  if (geo && id !== 'geo-all' && g.sets.some((x) => x !== id)) failures.push(`${id} games got problems from ${g.sets.join(', ')}`);
}
for (const e of pageErrors) failures.push(`page error: ${e}`);
await browser.close();

console.log(`Geometry Lab — ${N} problems and ${MC} multiple-choice versions per skill, checked independently\n`);
const pad = (x, k) => String(x).padEnd(k);
console.log(`${pad('skill', 13)}${pad('set', 9)}${pad('problems', 10)}${pad('mc', 6)}${pad('inputs', 8)}${pad('failures', 9)}`);
for (const s of skills) {
  const r = rows[s.id] || { gen: 0, mc: 0, fail: 0, checks: 0 };
  console.log(`${pad(s.id, 13)}${pad(s.setId, 9)}${pad(r.gen, 10)}${pad(r.mc, 6)}${pad(r.checks, 8)}${pad(r.fail, 9)}`);
}
console.log(`\ngame sources: ${Object.entries(games.out).map(([id, g]) => `${id} ${g.n}`).join(', ')}`);
const total = Object.values(rows).reduce((n, r) => n + r.fail, 0) + failures.filter((f) => !/^\w+( \(mc\))? L\d/.test(f)).length;
if (failures.length) {
  console.log(`\n${total} failure(s)${failures.length >= 80 ? ' (first 80 shown)' : ''}:`);
  for (const f of failures) console.log(`  ${f}`);
  process.exit(1);
}
console.log('\nOK: every generated problem checks out.');
