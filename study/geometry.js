/* ==========================================================================
   Geometry Lab — endless, freshly generated Geometry practice for every
   unit of the Geometry subject, each problem with a drawn figure where the
   geometry needs one and a worked solution, one step per line.

   Every number is chosen so the working stays clean, and every exact answer
   is kept as a fraction of two integers until the moment it is deliberately
   rounded, so no 0.30000000000000004 ever reaches a student. Typed answers
   are graded here, exactly (q.check): an exact answer must be exactly equal,
   a rounded one must round to the stated answer, "36π" is not "36", and
   (3, −2) is not (−2, 3).

   Registers through window.CQ (see the plugin section of app.js):
   - mode "geometry" on every Geometry set (unit sets and geo-all);
   - a game source (multiple-choice versions whose wrong options are the
     classic mistakes) for Gold Quest, Race and Blitz;
   - an item resolver so a missed "geom:<skill>" comes back in Mistakes.
   window.CQGeometry exposes the generators for tools/verify-geometry.mjs.
   ========================================================================== */
(() => {
'use strict';
const CQ = window.CQ;
if (!CQ) return;
const { el, shuffle, pick } = CQ;

const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const chance = (p) => Math.random() < p;
const MINUS = '−';
const DEG = Math.PI / 180;

/* ------------------------------------------------ exact rational numbers
   The numbers in these problems are small, so a fraction of two ordinary
   integers is exact: 7/2 stays 7/2 and prints as 3.5, never 3.4999999. */
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; }
function Rt(n, d = 1) {
  if (!Number.isInteger(n) || !Number.isInteger(d) || d === 0) throw new Error(`not a fraction: ${n}/${d}`);
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d) || 1;
  return { n: n / g, d: d / g };
}
/** A JavaScript number with at most 4 decimals (4.5, 12) as an exact fraction. */
const rq = (x) => Rt(Math.round(x * 10000), 10000);
const radd = (a, b) => Rt(a.n * b.d + b.n * a.d, a.d * b.d);
const rsub = (a, b) => Rt(a.n * b.d - b.n * a.d, a.d * b.d);
const rmul = (a, b) => Rt(a.n * b.n, a.d * b.d);
const rdiv = (a, b) => Rt(a.n * b.d, a.d * b.n);
const req = (a, b) => a.n === b.n && a.d === b.d;
const rnum = (r) => r.n / r.d;
function terminates(r) { let d = r.d; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5; return d === 1; }
/** Exact decimal ("3.5", "-12") when it terminates, otherwise "7/3". ASCII minus. */
function rstr(r) {
  if (r.d === 1) return String(r.n);
  if (!terminates(r)) return `${r.n}/${r.d}`;
  let k = 1;
  while ((10 ** k) % r.d !== 0) k++;
  const int = r.n * ((10 ** k) / r.d);
  const s = String(Math.abs(int)).padStart(k + 1, '0');
  return `${int < 0 ? '-' : ''}${s.slice(0, -k)}.${s.slice(-k)}`.replace(/0+$/, '').replace(/\.$/, '');
}
/** Always a fraction: "-3/4", "5". */
const fstr = (r) => (r.d === 1 ? String(r.n) : `${r.n}/${r.d}`);
/** Typographic minus for display. */
const mm = (s) => String(s).replace(/-/g, MINUS);
/** A plain number (integer or short decimal) for display, without float noise. */
const numStr = (x) => (typeof x === 'object' ? rstr(x) : String(+Number(x).toFixed(9)));
const n = (x) => mm(numStr(x));
/** A negative number in brackets, for substituting into a formula. */
const par = (x) => (Number(typeof x === 'object' ? rnum(x) : x) < 0 ? `(${n(x)})` : n(x));
/** "3x + 5", "x − 2", "−2x", "7" */
function lin(a, b, v = 'x') {
  const out = [];
  if (a) out.push(a === 1 ? v : a === -1 ? `${MINUS}${v}` : `${n(a)}${v}`);
  if (b || !a) out.push(out.length ? (b < 0 ? `${MINUS} ${n(-b)}` : `+ ${n(b)}`) : n(b));
  return out.join(' ');
}
/** Round half up to dp decimals, as a string with exactly dp decimals. */
function roundStr(v, dp) {
  const f = 10 ** dp;
  const r = Math.round(v * f + (v >= 0 ? 1e-9 : -1e-9)) / f;
  return r.toFixed(dp);
}
/** Too close to a rounding tie (…x5) to round safely? Then the generator picks new numbers. */
const nearTie = (v, dp) => { const t = Math.abs(v) * 10 ** dp; return Math.abs(t - Math.floor(t) - 0.5) < 0.002; };
/** A few more digits than the answer keeps, for the "≈" line of a worked solution. */
const more = (v, dp) => roundStr(v, dp + 3);
function simplifyRoot(k) {
  let a = 1, b = k;
  for (let f = 2; f * f <= b; f++) while (b % (f * f) === 0) { b /= f * f; a *= f; }
  return { a, b };
}
const isSquare = (k) => Number.isInteger(Math.sqrt(k));
const radStr = (a, b) => (b === 1 ? String(a) : `${a === 1 ? '' : a}√${b}`);

/* ------------------------------------------------ units
   Each length unit lists how a student might write it; areas and volumes
   are built from those ("cm²", "cm^2", "sq cm", "square centimeters"). */
const LEN = {
  units: { sym: 'units', words: ['unit', 'units', 'u'], name: 'units' },
  cm: { sym: 'cm', words: ['cm', 'centimeter', 'centimeters', 'centimetre', 'centimetres'], name: 'centimeters' },
  m: { sym: 'm', words: ['m', 'meter', 'meters', 'metre', 'metres'], name: 'meters' },
  mm: { sym: 'mm', words: ['mm', 'millimeter', 'millimeters', 'millimetre', 'millimetres'], name: 'millimeters' },
  in: { sym: 'in', words: ['in', 'inch', 'inches'], name: 'inches' },
  ft: { sym: 'ft', words: ['ft', 'foot', 'feet'], name: 'feet' },
  yd: { sym: 'yd', words: ['yd', 'yard', 'yards'], name: 'yards' },
};
const nu = (s) => String(s || '').toLowerCase().replace(/[\s.]/g, '').replace(/²/g, '^2').replace(/³/g, '^3').replace(/º/g, '°');
const unitSets = {};
function unitSet(u) {
  if (!u) return new Set();
  if (unitSets[u]) return unitSets[u];
  let out = [];
  if (u === 'deg') out = ['°', 'deg', 'degs', 'degree', 'degrees'];
  else if (u === 'sides') out = ['side', 'sides'];
  else if (u === 'times') out = ['times', 'x'];
  else {
    const [dim, base] = u.split(':');
    const W = LEN[base].words;
    if (dim === 'len') out = W;
    if (dim === 'area') for (const w of W) out.push(`${w}^2`, `${w}2`, `sq ${w}`, `square ${w}`, `${w} squared`, `${w} sq`);
    if (dim === 'vol') for (const w of W) out.push(`${w}^3`, `${w}3`, `cu ${w}`, `cubic ${w}`, `${w} cubed`);
  }
  return (unitSets[u] = new Set(out.map(nu)));
}
const unitOk = (text, u) => { const t = nu(text); return !t || unitSet(u).has(t); };
/** How a unit is written after a number: "°", " cm", " cm²", " units³". */
function uSuffix(u) {
  if (!u || u === 'times') return '';
  if (u === 'deg') return '°';
  if (u === 'sides') return ' sides';
  const [dim, base] = u.split(':');
  return ` ${LEN[base].sym}${dim === 'area' ? '²' : dim === 'vol' ? '³' : ''}`;
}
function uName(u) {
  if (u === 'deg') return 'degrees';
  if (u === 'sides' || u === 'times') return u;
  const [dim, base] = u.split(':');
  if (dim === 'len') return LEN[base].name;
  return `${dim === 'area' ? 'square' : 'cubic'} ${LEN[base].name}`;
}
const withU = (s, u) => `${s}${uSuffix(u)}`;

/* ------------------------------------------------ grading typed answers
   The site's shared checker allows 0.6% either way, which would pass 37° for
   36° or 113 for 113.1. Geometry Lab grades its own problems: an exact
   answer must be exactly equal, a rounded one must round to the stated
   answer (a more precise value is fine if every digit shown is right), and
   the form the question asks for (in terms of π, simplest radical form, an
   ordered pair, a strict inequality) is part of the answer. */
const SUP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-' };
function tidy(raw) {
  return String(raw ?? '').trim().toLowerCase()
    .replace(/[−–—‒﹣－]/g, '-')
    .replace(/[′’‘`]/g, "'")
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, (m) => `^${[...m].map((c) => SUP[c]).join('')}`)
    .replace(/ | /g, ' ')
    .replace(/[×·*]/g, ' ')
    .replace(/square\s+root(\s+of)?/g, '√')
    .replace(/sqrt/g, '√')
    .replace(/(^|[^a-z])root(?![a-z])/g, '$1√')
    .replace(/(^|[^a-z])pi(?![a-z])/g, '$1π')
    .replace(/√\s*\(\s*(\d+)\s*\)/g, '√$1')
    .replace(/^(≈|~|about|approx\.?|approximately)\s*/, '')
    .replace(/[.;!]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}
/** What is written before "=": "m∠ABC" → "abc", "angle 1" → "1", "x" → "x". */
const normName = (t) => String(t).toLowerCase().replace(/measure\s*of|m\s*∠|∠|m\s*<|<|angle|\bthe\b|[\s().']/g, '');
/** "-2.50" → exact fraction (null for anything else). */
function decR(t) {
  const m = String(t).match(/^([-+]?)(\d*)(?:\.(\d+))?$/);
  if (!m || (!m[2] && !m[3])) return null;
  const f = m[3] || '';
  if ((m[2] + f).length > 15) return null;
  return Rt((m[1] === '-' ? -1 : 1) * Number((m[2] || '0') + f), 10 ** f.length);
}
/** "3/4", "-0.75", "3/-4" → exact fraction. */
function ratOf(t) {
  const [a, b] = String(t).split('/');
  const x = decR(a);
  if (!x) return null;
  if (b == null) return x;
  const y = decR(b);
  return y && y.n ? rdiv(x, y) : null;
}
/** The number at the front of an answer, its form and whatever unit follows. */
function head(s) {
  let m;
  if ((m = s.match(/^(-?)\((\d+)\/(\d+)\)π(.*)$/)) || (m = s.match(/^(-?)(\d+)\/(\d+)π(.*)$/))) {
    if (Number(m[3]) === 0) return null;
    return { form: 'pi', coef: Rt((m[1] ? -1 : 1) * Number(m[2]), Number(m[3])), unit: m[4] };
  }
  if ((m = s.match(/^(-?)(\d+(?:\.\d+)?|\.\d+)?π(?:\/(\d+))?(.*)$/))) {
    const c = decR(m[2] || '1');
    if (!c || m[3] === '0') return null;
    const coef = rdiv(c, Rt(Number(m[3] || 1)));
    return { form: 'pi', coef: m[1] ? rmul(coef, Rt(-1)) : coef, unit: m[4] };
  }
  if ((m = s.match(/^(-?)(\d+)?√(\d+)(.*)$/))) return { form: 'rad', a: (m[1] ? -1 : 1) * Number(m[2] || 1), b: Number(m[3]), unit: m[4] };
  if ((m = s.match(/^(-?\d+(?:\.\d+)?|-?\.\d+)(?:\/(-?\d+))?(.*)$/))) {
    const r = ratOf(m[2] ? `${m[1]}/${m[2]}` : m[1]);
    if (!r) return null;
    return { form: 'num', r, decimals: (m[1].split('.')[1] || '').length, frac: !!m[2], unit: m[3] };
  }
  return null;
}
const NUM_RE = '(-?\\d+(?:\\.\\d+)?(?:\\/\\d+)?|-?\\.\\d+)';
function gradePair(a, s) {
  let m, x, y;
  // "x = 3, y = −2", "h = 3 and k = −2" (either order when both are labelled)
  if ((m = s.match(new RegExp(`^([a-z])\\s*=\\s*${NUM_RE}\\s*(?:,|;|&|and|,\\s*and)?\\s*([a-z])\\s*=\\s*${NUM_RE}$`)))) {
    const first = { x: 'y', h: 'k' }[m[1]], second = { y: 'x', k: 'h' }[m[1]];
    if (first === m[3]) [x, y] = [m[2], m[4]];
    else if (second === m[3]) [x, y] = [m[4], m[2]];
    else return { ok: false, why: 'Type the point as an ordered pair, like (2, −5).' };
  } else {
    // drop a label in front of the pair: "P' = ", "P'", "(x, y) = ", "(h, k) =", "center = ", "the image is "
    s = s.replace(/^\(\s*[a-z]'*\s*,\s*[a-z]'*\s*\)\s*=\s*/, '')
      .replace(/^(?:the\s+)?[a-z]+'*\s*(?:=|is|:)?\s*(?=\()/, '')
      .replace(/^[a-z]'*\s*=\s*/, '');
    m = s.match(new RegExp(`^\\(?\\s*${NUM_RE}\\s*,\\s*${NUM_RE}\\s*\\)?$`));
    if (!m) return { ok: false, why: 'Type the point as an ordered pair, like (2, −5).' };
    [x, y] = [m[1], m[2]];
  }
  x = ratOf(x); y = ratOf(y);
  if (!x || !y) return { ok: false, why: '' };
  if (req(x, a.x) && req(y, a.y)) return { ok: true };
  if (req(x, a.y) && req(y, a.x)) return { ok: false, why: 'Those are the right numbers in the wrong order — the x-coordinate comes first.' };
  return { ok: false, why: '' };
}
function gradeRange(a, s) {
  s = s.replace(/<=|=<|≤/g, '≤').replace(/>=|=>|≥/g, '≥').replace(/(\d),(?=\d{3}(?!\d))/g, '$1');
  // a bound, optionally followed by its unit ("1", "1 in", "45 inches")
  const N = (g) => `(?<${g}>-?\\d+(?:\\.\\d+)?)\\s*(?<${g}u>[a-z]+(?: [a-z]+)?)?`;
  const V = '(?:[a-z][a-z ]*?)?';
  const pats = [
    `^${N('lo')}\\s*<\\s*${V}\\s*<\\s*${N('hi')}$`,
    `^${N('hi')}\\s*>\\s*${V}\\s*>\\s*${N('lo')}$`,
    `^(?<v>[a-z]+)\\s*>\\s*${N('lo')}\\s*(?:,|and|&)\\s*(?:and\\s*)?\\k<v>\\s*<\\s*${N('hi')}$`,
    `^(?<v>[a-z]+)\\s*<\\s*${N('hi')}\\s*(?:,|and|&)\\s*(?:and\\s*)?\\k<v>\\s*>\\s*${N('lo')}$`,
    `^between\\s*${N('lo')}\\s*and\\s*${N('hi')}$`,
    `^\\(\\s*${N('lo')}\\s*,\\s*${N('hi')}\\s*\\)$`,
  ];
  let g = null;
  for (const p of pats) if ((g = (s.match(new RegExp(p)) || {}).groups)) break;
  if (!g) {
    if (/[≤≥]/.test(s)) return { ok: false, why: 'The third side can never equal the difference or the sum (the triangle would collapse flat), so use < rather than ≤.' };
    return { ok: false, why: 'Write it as a compound inequality: smallest < x < largest.' };
  }
  if (!unitOk(g.lou || '', a.u) || !unitOk(g.hiu || '', a.u)) return { ok: false, why: `Check the unit — the sides are in ${uName(a.u)}.` };
  const L = decR(g.lo), H = decR(g.hi);
  if (L && H && req(L, a.lo) && req(H, a.hi)) return { ok: true };
  return { ok: false, why: '' };
}
/** Grade a typed answer against q.ans: { ok, why }. */
function grade(q, raw) {
  const a = q.ans;
  if (!a) return { ok: false, why: '' };
  let s = tidy(raw);
  if (!s) return { ok: false, why: '' };
  if (a.k === 'pair') return gradePair(a, s);
  if (a.k === 'range') return gradeRange(a, s);
  const eq = s.lastIndexOf('=');
  if (eq >= 0) {
    const lhs = normName(s.slice(0, eq));
    if (lhs && !(a.names || []).includes(lhs)) return { ok: false, why: `This asks for ${a.ask || 'something else'}, not ${s.slice(0, eq).trim()}.` };
    s = s.slice(eq + 1).trim();
  }
  s = s.replace(/\s*([π√/])\s*/g, '$1').replace(/(\d),(?=\d{3}(?!\d))/g, '$1');
  if (a.ratio) s = s.replace(/^(\d+(?:\.\d+)?)\s*(?::|to)\s*(\d+)$/, '$1/$2');
  const h = head(s);
  if (!h) return { ok: false, why: '' };
  let ok = false, why = '';
  if (a.k === 'num') {
    ok = h.form === 'num' && req(h.r, a.v);
    if (h.form === 'pi') why = 'This answer has no π in it.';
  } else if (a.k === 'round') {
    const stated = roundStr(a.v, a.dp);
    if (h.form === 'num') {
      const t = rnum(h.r);
      if (Math.abs(t - Number(stated)) < 1e-9) ok = true;
      // more digits than asked for are fine when the value rounds to the stated
      // answer and is within half a unit of its last digit from the true value
      else if (!h.frac && h.decimals > a.dp && roundStr(t, a.dp) === stated && Math.abs(t - a.v) <= 0.5 * 10 ** -a.dp + 1e-9) ok = true;
      else if (Math.abs(t - a.v) < 1.5 * 10 ** -a.dp) why = `Close — check your rounding: to the nearest ${a.dp === 0 ? 'whole number' : a.dp === 1 ? 'tenth' : 'hundredth'}, the value ${more(a.v, a.dp).replace(/0+$/, '')}… rounds to ${stated}.`;
    } else if (h.form === 'rad' && a.rad2) ok = h.a > 0 && h.a * h.a * h.b === a.rad2;
    else if (h.form === 'pi' && a.pic) ok = req(h.coef, a.pic);
  } else if (a.k === 'pi') {
    if (h.form === 'pi') ok = req(h.coef, a.c);
    else if (h.form === 'num') {
      if (req(h.r, a.c)) why = 'Keep the π: the answer is a number of π\'s.';
      else if (Math.abs(rnum(h.r) - rnum(a.c) * Math.PI) < 0.06) why = 'That is the decimal value — this asks for the exact answer in terms of π.';
    }
  } else if (a.k === 'rad') {
    if (h.form === 'rad') {
      if (h.a * h.a * h.b === a.a * a.a * a.b && h.a > 0) {
        ok = h.b === a.b;
        if (!ok) why = 'Right value, but simplify the radical: take every perfect-square factor out of the square root.';
      }
    } else if (h.form === 'num' && Math.abs(rnum(h.r) - a.a * Math.sqrt(a.b)) < 0.06) why = 'That is a decimal approximation — this asks for the exact answer in simplest radical form.';
  }
  if (!unitOk(h.unit, a.u)) {
    const got = h.unit.trim();
    return { ok: false, why: a.u ? `${ok ? 'The number is right, but ' : ''}"${got}" is the wrong unit — this answer is in ${uName(a.u)}.` : `${ok ? 'The number is right, but ' : ''}this answer has no unit — leave off "${got}".` };
  }
  return ok ? { ok: true } : { ok: false, why };
}

/* ------------------------------------------------ worked solutions (DOM) */
const P = (...kids) => el('p', { class: 'gm-step' }, ...kids);
const aside = (...kids) => el('p', { class: 'gm-aside' }, ...kids);
const boxed = (t) => el('span', { class: 'gm-ans' }, t);
const qmark = () => el('span', { class: 'gm-q' }, '?');
/** Equation lines, one per step. A line is a string, or [text, answer] to box
    the answer — or [text, null] for a hint that stops before the answer. */
function eqs(lines) {
  return el('div', { class: 'gm-eqs' }, ...lines.filter(Boolean).map((l) => (typeof l === 'string'
    ? el('div', { class: 'gm-ln' }, l)
    : el('div', { class: 'gm-ln' }, l[0], l[1] == null ? qmark() : boxed(l[1])))));
}
const W = (...kids) => el('div', { class: 'gm-work' }, ...kids);
/** A work function from its pieces: the method (always shown), the lines of
    working (the hint shows only the setup) and a closing note. */
function works({ method = [], lines = [], hintLines = null, final = [], hint = [], extra = null }) {
  return (full) => {
    const kids = [...method.map((m) => (typeof m === 'string' ? P(m) : m))];
    const shown = full ? lines : (hintLines || []);
    if (shown.filter(Boolean).length) kids.push(eqs(shown));
    if (full && extra) kids.push(typeof extra === 'function' ? extra() : extra);
    kids.push(...(full ? final : hint).map((m) => (typeof m === 'string' ? aside(m) : m)));
    return W(...kids);
  };
}

/* ------------------------------------------------ figures (inline SVG)
   Lines and text use currentColor and the theme tokens (geometry.css), so a
   figure reads the same in light and dark mode. */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const f1 = (v) => String(Math.round(v * 10) / 10);
function svgWrap(w, h, body, toScale = true) {
  return `<svg xmlns="http://www.w3.org/2000/svg" class="gm-svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true" focusable="false">${body}${toScale ? '' : `<text class="gm-nts" x="${w - 4}" y="${h - 5}" text-anchor="end">Not drawn to scale</text>`}</svg>`;
}
const L = (p, q, cls = '') => `<line x1="${f1(p[0])}" y1="${f1(p[1])}" x2="${f1(q[0])}" y2="${f1(q[1])}"${cls ? ` class="${cls}"` : ''}/>`;
const PG = (pts, cls = '') => `<polygon points="${pts.map((p) => `${f1(p[0])},${f1(p[1])}`).join(' ')}"${cls ? ` class="${cls}"` : ''}/>`;
const PL = (pts, cls = '') => `<polyline points="${pts.map((p) => `${f1(p[0])},${f1(p[1])}`).join(' ')}"${cls ? ` class="${cls}"` : ''}/>`;
const T = (p, text, { a = 'middle', cls = '', dy = 0 } = {}) => `<text x="${f1(p[0])}" y="${f1(p[1] + dy)}" text-anchor="${a}" dominant-baseline="central"${cls ? ` class="${cls}"` : ''}>${esc(text)}</text>`;
const DOT = (p, cls = 'gm-dot') => `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="3.2" class="${cls}"/>`;
const add2 = (p, q) => [p[0] + q[0], p[1] + q[1]];
const sub2 = (p, q) => [p[0] - q[0], p[1] - q[1]];
const mul2 = (p, k) => [p[0] * k, p[1] * k];
const len2 = (p) => Math.hypot(p[0], p[1]);
const unit2 = (p) => { const l = len2(p) || 1; return [p[0] / l, p[1] / l]; };
const mid2 = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
const dir = (deg) => [Math.cos(deg * DEG), Math.sin(deg * DEG)];
/** Map math coordinates (y up) into a w×h box with a margin, keeping shape. */
function fitter(pts, w, h, pad = 30) {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const k = Math.min((w - 2 * pad) / (x1 - x0 || 1), (h - 2 * pad) / (y1 - y0 || 1));
  const ox = (w - k * (x1 - x0)) / 2, oy = (h - k * (y1 - y0)) / 2;
  return (p) => [ox + (p[0] - x0) * k, h - (oy + (p[1] - y0) * k)];
}
/** k tick marks across the middle of segment pq (congruent sides). */
function ticks(p, q, k, cls = 'gm-mark') {
  if (!k) return '';
  const u = unit2(sub2(q, p)), nn = [-u[1], u[0]], m = mid2(p, q);
  let s = '';
  for (let i = 0; i < k; i++) {
    const c = add2(m, mul2(u, (i - (k - 1) / 2) * 5));
    s += L(add2(c, mul2(nn, 6)), add2(c, mul2(nn, -6)), cls);
  }
  return s;
}
/** k arcs marking the angle at v between rays to a and b (the smaller angle). */
function arcs(v, a, b, k = 1, r = 18, cls = 'gm-mark') {
  const ua = unit2(sub2(a, v)), ub = unit2(sub2(b, v));
  const cross = ua[0] * ub[1] - ua[1] * ub[0];
  let s = '';
  for (let i = 0; i < k; i++) {
    const rr = r + i * 4.5;
    const p1 = add2(v, mul2(ua, rr)), p2 = add2(v, mul2(ub, rr));
    s += `<path d="M${f1(p1[0])} ${f1(p1[1])} A${rr} ${rr} 0 0 ${cross > 0 ? 1 : 0} ${f1(p2[0])} ${f1(p2[1])}" class="${cls}" fill="none"/>`;
  }
  return s;
}
/** Where to write an angle's label: along the bisector, dist from the vertex. */
function inside(v, a, b, dist) {
  const bis = unit2(add2(unit2(sub2(a, v)), unit2(sub2(b, v))));
  return add2(v, mul2(bis, dist));
}
function rightMark(v, a, b, s = 11, cls = 'gm-mark') {
  const ua = mul2(unit2(sub2(a, v)), s), ub = mul2(unit2(sub2(b, v)), s);
  return PL([add2(v, ua), add2(add2(v, ua), ub), add2(v, ub)], `${cls} gm-nofill`);
}
/** Label a vertex just outside a polygon (away from its centre). */
function vlabel(p, centre, text, dist = 13) {
  return T(add2(p, mul2(unit2(sub2(p, centre)), dist)), text, { cls: 'gm-vx' });
}
/** Label a side just outside its midpoint. */
function slabel(p, q, centre, text, dist = 14, cls = 'gm-lb') {
  const m = mid2(p, q), u = unit2(sub2(q, p));
  let nn = [-u[1], u[0]];
  if ((m[0] + nn[0] - centre[0]) ** 2 + (m[1] + nn[1] - centre[1]) ** 2 < (m[0] - centre[0]) ** 2 + (m[1] - centre[1]) ** 2) nn = mul2(nn, -1);
  const at = add2(m, mul2(nn, dist));
  const a = Math.abs(nn[0]) < 0.35 ? 'middle' : nn[0] > 0 ? 'start' : 'end';
  return T([at[0] + (a === 'start' ? -4 : a === 'end' ? 4 : 0), at[1]], text, { a, cls });
}
const centroid = (pts) => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];

/** A coordinate grid with points, segments and polygons in grid units. */
function gridFig({ pts = [], segs = [], polys = [], lines = [], size = 270 }) {
  const all = [[0, 0], ...pts.map((x) => x.p), ...polys.flatMap((x) => x.pts), ...segs.flatMap((x) => [x[0], x[1]])];
  let x0 = Math.min(-2, ...all.map((p) => p[0]) ) - 1, x1 = Math.max(2, ...all.map((p) => p[0])) + 1;
  let y0 = Math.min(-2, ...all.map((p) => p[1])) - 1, y1 = Math.max(2, ...all.map((p) => p[1])) + 1;
  const span = Math.max(x1 - x0, y1 - y0);
  x0 -= Math.floor((span - (x1 - x0)) / 2); x1 = x0 + span;
  y0 -= Math.floor((span - (y1 - y0)) / 2); y1 = y0 + span;
  const pad = 14, cell = (size - 2 * pad) / span;
  const X = (x) => pad + (x - x0) * cell, Y = (y) => pad + (y1 - y) * cell;
  const S = (p) => [X(p[0]), Y(p[1])];
  let s = '';
  for (let x = x0; x <= x1; x++) s += L([X(x), Y(y0)], [X(x), Y(y1)], 'gm-grid');
  for (let y = y0; y <= y1; y++) s += L([X(x0), Y(y)], [X(x1), Y(y)], 'gm-grid');
  s += L([X(x0), Y(0)], [X(x1), Y(0)], 'gm-axis') + L([X(0), Y(y0)], [X(0), Y(y1)], 'gm-axis');
  s += T([X(x1) - 6, Y(0) - 9], 'x', { cls: 'gm-axl' }) + T([X(0) + 9, Y(y1) + 7], 'y', { cls: 'gm-axl' });
  const step = span <= 14 ? 2 : span <= 26 ? 4 : 5;
  for (let x = Math.ceil(x0 / step) * step; x <= x1 - 1; x += step) if (x) s += T([X(x), Y(0) + 9], mm(String(x)), { cls: 'gm-tick' });
  for (let y = Math.ceil(y0 / step) * step; y <= y1 - 1; y += step) if (y) s += T([X(0) - 4, Y(y)], mm(String(y)), { a: 'end', cls: 'gm-tick' });
  for (const ln of lines) {
    // clipped to the grid: y = x runs from (lo, lo) to (hi, hi); y = −x from (lo, −lo) to (hi, −hi)
    const lo = ln === 'y=x' ? Math.max(x0, y0) : Math.max(x0, -y1), hi = ln === 'y=x' ? Math.min(x1, y1) : Math.min(x1, -y0);
    const a = ln === 'y=x' ? [lo, lo] : [lo, -lo], b = ln === 'y=x' ? [hi, hi] : [hi, -hi];
    s += L(S(a), S(b), 'gm-refl');
    const top = S(ln === 'y=x' ? b : a);
    s += T([top[0] + (ln === 'y=x' ? -6 : 6), top[1] + 11], ln === 'y=x' ? 'y = x' : `y = ${MINUS}x`, { a: ln === 'y=x' ? 'end' : 'start', cls: 'gm-lb gm-small' });
  }
  for (const pg of polys) {
    s += PG(pg.pts.map(S), pg.cls || 'gm-shape');
    (pg.labels || []).forEach((t, i) => {
      const c = centroid(pg.pts.map(S));
      if (t) s += vlabel(S(pg.pts[i]), c, t, 11);
    });
  }
  for (const [p, q, cls] of segs) s += L(S(p), S(q), cls || 'gm-seg');
  for (const pt of pts) {
    const at = S(pt.p);
    s += DOT(at, pt.cls || 'gm-dot');
    if (pt.label) {
      const right = at[0] < size * 0.62;
      s += T([at[0] + (right ? 7 : -7), at[1] - 10], pt.label, { a: right ? 'start' : 'end', cls: 'gm-lb gm-small' });
    }
  }
  return svgWrap(size, size, s, true);
}
const ptStr = (p) => `(${n(p[0])}, ${n(p[1])})`;

/* ================================================================ skills */
const UNIT_NAMES = {
  'geo-u1': 'Unit 1 · Tools of Geometry', 'geo-u2': 'Unit 2 · Reasoning and Proof', 'geo-u3': 'Unit 3 · Parallel and Perpendicular Lines',
  'geo-u4': 'Unit 4 · Triangles and Congruence', 'geo-u5': 'Unit 5 · Relationships in Triangles and Similarity', 'geo-u6': 'Unit 6 · Right Triangles and Trigonometry',
  'geo-u7': 'Unit 7 · Polygons and Quadrilaterals', 'geo-u8': 'Unit 8 · Transformations', 'geo-u9': 'Unit 9 · Circles', 'geo-u10': 'Unit 10 · Area, Surface Area and Volume',
};
const SKILLS = [
  { id: 'midpoint', setId: 'geo-u1', name: 'Midpoint', ico: '📍', label: 'Midpoint of a segment' },
  { id: 'distance', setId: 'geo-u1', name: 'Distance', ico: '📏', label: 'Distance between two points' },
  { id: 'segadd', setId: 'geo-u1', name: 'Segment addition', ico: '➕', label: 'Segment addition with algebra' },
  { id: 'anglepairs', setId: 'geo-u1', name: 'Angle pairs', ico: '📐', label: 'Complementary, supplementary, vertical and linear-pair angles' },
  { id: 'related', setId: 'geo-u2', name: 'Converse, inverse, contrapositive', ico: '🔁', label: 'Converse, inverse and contrapositive' },
  { id: 'hypconc', setId: 'geo-u2', name: 'Hypothesis and conclusion', ico: '🧩', label: 'Hypothesis and conclusion of a conditional' },
  { id: 'pairname', setId: 'geo-u3', name: 'Name the angle pair', ico: '🛤️', label: 'Naming angle pairs made by a transversal' },
  { id: 'pairmeasure', setId: 'geo-u3', name: 'Parallel-line angles', ico: '🔢', label: 'Angle measures with parallel lines' },
  { id: 'pairx', setId: 'geo-u3', name: 'Solve for x (parallel lines)', ico: '✖️', label: 'Solving for x with parallel lines' },
  { id: 'slope', setId: 'geo-u3', name: 'Parallel and perpendicular slopes', ico: '📈', label: 'Slopes of parallel and perpendicular lines' },
  { id: 'trisum', setId: 'geo-u4', name: 'Triangle angle sum', ico: '🔺', label: 'Triangle angle sum' },
  { id: 'exterior', setId: 'geo-u4', name: 'Exterior angle', ico: '↗️', label: 'Exterior Angle Theorem' },
  { id: 'isosceles', setId: 'geo-u4', name: 'Isosceles triangles', ico: '🔻', label: 'Isosceles triangle base angles' },
  { id: 'congruence', setId: 'geo-u4', name: 'Congruence shortcuts', ico: '🪞', label: 'SSS, SAS, ASA, AAS and HL' },
  { id: 'midsegment', setId: 'geo-u5', name: 'Midsegments', ico: '〰️', label: 'Triangle midsegments' },
  { id: 'inequality', setId: 'geo-u5', name: 'Can it be a triangle?', ico: '⚖️', label: 'Triangle Inequality Theorem' },
  { id: 'thirdside', setId: 'geo-u5', name: 'Third-side range', ico: '↔️', label: 'Range for the third side of a triangle' },
  { id: 'similar', setId: 'geo-u5', name: 'Similar figures', ico: '🔍', label: 'Scale factors and missing sides of similar triangles' },
  { id: 'simcrit', setId: 'geo-u5', name: 'AA, SSS or SAS similarity', ico: '🧭', label: 'Proving triangles similar' },
  { id: 'pythag', setId: 'geo-u6', name: 'Pythagorean theorem', ico: '📐', label: 'Missing side with the Pythagorean theorem' },
  { id: 'classify', setId: 'geo-u6', name: 'Right, acute or obtuse?', ico: '❓', label: 'Converse of the Pythagorean theorem' },
  { id: 'special', setId: 'geo-u6', name: 'Special right triangles', ico: '✨', label: '45°-45°-90° and 30°-60°-90° triangles' },
  { id: 'trigratio', setId: 'geo-u6', name: 'Trig ratios', ico: '➗', label: 'Sine, cosine and tangent ratios' },
  { id: 'trigside', setId: 'geo-u6', name: 'Find a side with trig', ico: '📏', label: 'Finding a side with trigonometry' },
  { id: 'trigangle', setId: 'geo-u6', name: 'Find an angle with trig', ico: '🎯', label: 'Finding an angle with inverse trigonometry' },
  { id: 'elevation', setId: 'geo-u6', name: 'Elevation and depression', ico: '🏔️', label: 'Angle of elevation and depression problems' },
  { id: 'polysum', setId: 'geo-u7', name: 'Polygon angle sum', ico: '⬠', label: 'Interior angle sum of a polygon' },
  { id: 'regular', setId: 'geo-u7', name: 'Regular polygon angles', ico: '⬡', label: 'Interior and exterior angles of regular polygons' },
  { id: 'sides', setId: 'geo-u7', name: 'Number of sides', ico: '🔢', label: 'Number of sides from an angle' },
  { id: 'quad', setId: 'geo-u7', name: 'Quadrilateral properties', ico: '▱', label: 'Parallelogram, rectangle and rhombus properties' },
  { id: 'transform', setId: 'geo-u8', name: 'Image of a point', ico: '🔄', label: 'Translations, reflections, rotations and dilations' },
  { id: 'rule', setId: 'geo-u8', name: 'Name the transformation', ico: '🗺️', label: 'Identifying a transformation from a graph' },
  { id: 'circle', setId: 'geo-u9', name: 'Circumference and area', ico: '⭕', label: 'Circumference and area of a circle' },
  { id: 'arc', setId: 'geo-u9', name: 'Arcs and sectors', ico: '🍕', label: 'Arc length and sector area' },
  { id: 'inscribed', setId: 'geo-u9', name: 'Central and inscribed angles', ico: '🎡', label: 'Central and inscribed angles' },
  { id: 'circeq', setId: 'geo-u9', name: 'Equation of a circle', ico: '🧮', label: 'Center and radius from the equation of a circle' },
  { id: 'tangent', setId: 'geo-u9', name: 'Tangents', ico: '📌', label: 'Tangent lines and radii' },
  { id: 'area', setId: 'geo-u10', name: 'Area of figures', ico: '🟦', label: 'Area of triangles, parallelograms, trapezoids and composite figures' },
  { id: 'solid', setId: 'geo-u10', name: 'Volume and surface area', ico: '🧊', label: 'Volume and surface area of solids' },
  { id: 'scale', setId: 'geo-u10', name: 'Scale factor effects', ico: '🔎', label: 'How area and volume change with scale' },
];
const SK = Object.fromEntries(SKILLS.map((s) => [s.id, s]));
const LEVEL_NAMES = { 1: 'Warm-up', 2: 'Standard', 3: 'Challenge' };
const PLACEHOLDER = {
  pair: 'An ordered pair (x, y)', range: 'lower < x < upper', pi: 'In terms of π (type π or pi)', rad: 'Exact: type √ or sqrt',
  round: 'Rounded number', deg: 'Degrees', num: 'Your answer',
};

/** Bundle what a generator produces into one question object. */
function makeQ(skill, o) {
  const S = SK[skill];
  const a = o.ans || null;
  const q = {
    id: `geom:${skill}`, skill, kind: 'gen', type: o.type || 'written', setId: S.setId,
    ask: `${S.ico} ${S.name}`, prompt: o.prompt, answer: o.answer, accept: [],
    level: o.level, data: o.data || {}, ans: a, wrong: o.wrong || [], brief: o.brief || '',
    placeholder: o.placeholder || (a ? (a.u === 'deg' && a.k === 'num' ? PLACEHOLDER.deg : PLACEHOLDER[a.k]) : ''),
    tools: a && (a.k === 'rad' || a.rad2) ? ['√'] : a && (a.k === 'pi' || a.pic) ? ['π'] : [],
    source: `Geometry · ${UNIT_NAMES[S.setId]} · generated by Geometry Lab`,
    work: o.work,
  };
  if (o.options) q.options = o.options;
  q.explanation = o.work(true);
  q.hint = () => o.work(false);
  if (o.figure) { q.figure = o.figure; q.figureAlt = o.figureAlt; }
  if (q.type === 'written') {
    q.value = valueOf(a);
    q.check = (input) => grade(q, input).ok;
  }
  return q;
}
/** A comparable value of an answer, for keeping multiple-choice options apart. */
function valueOf(a) {
  if (!a) return null;
  if (a.k === 'num') return rnum(a.v);
  if (a.k === 'round') return Number(roundStr(a.v, a.dp));
  if (a.k === 'pi') return rnum(a.c) * Math.PI;
  if (a.k === 'rad') return a.a * Math.sqrt(a.b);
  if (a.k === 'pair') return [rnum(a.x), rnum(a.y)];
  if (a.k === 'range') return [rnum(a.lo), rnum(a.hi), 0];
  return null;
}
/** Wrong answers, formatted like the right one. */
const numW = (u) => (v, why) => ({ str: withU(n(v), u), val: Number(numStr(v)), why });
const fallbacks = (v, fmt) => [fmt(v + 1, 'arithmetic slip'), fmt(v - 1, 'arithmetic slip'), fmt(v + 2, 'arithmetic slip'), fmt(v * 2, 'doubled by mistake')];
const cap = (s) => s[0].toUpperCase() + s.slice(1);
/** "a 7 ft ladder" but "an 8 ft ladder", "an 11-gon", "an 18° angle", "an octagon". */
const an = (w) => { const t = String(w); return /^(8|1[18](?!\d)|1[18]\d{3}(?!\d))/.test(t) || /^[aeio]/i.test(t) ? 'an' : 'a'; };
const aW = (w) => `${an(w)} ${w}`;
const toR = (x) => (typeof x === 'object' ? x : rq(x));
const pairStr = (x, y) => `(${n(x)}, ${n(y)})`;
const pairW = (x, y, why) => ({ str: pairStr(x, y), val: [rnum(toR(x)), rnum(toR(y))], why });
/** Solve p·x + q = r·x + s one step per line; the last line is boxed when x is the answer. */
function solveLines(p, q, r, s, box, setup, v = 'x') {
  const a = p - r, b = s - q, x = Rt(b, a), xs = n(x);
  const out = [];
  const push = (l) => { if (l !== setup && !out.includes(l)) out.push(l); };
  push(`${lin(p, q, v)} = ${r ? lin(r, s, v) : n(s)}`);
  if (r) push(`${lin(a, q, v)} = ${n(s)}`);
  if (a === 1) {
    if (out[out.length - 1] === `${v} = ${xs}`) out.pop();
    out.push(box ? [`${v} = `, xs] : `${v} = ${xs}`);
    return { lines: out, x };
  }
  push(`${lin(a, 0, v)} = ${n(b)}`);
  out.push(`${v} = ${n(b)} ÷ ${par(a)}`, box ? ['= ', xs] : `= ${xs}`);
  return { lines: out, x };
}
/** "(3x + 5)°" or "35°" */
const angExpr = (e) => (e[0] ? `(${lin(e[0], e[1])})°` : `${n(e[1])}°`);
/** An expression with x substituted: "3(7) − 4" */
const sub1 = (e, x) => (e[0] === 0 ? n(e[1]) : `${e[0] === 1 ? '' : e[0] === -1 ? MINUS : n(e[0])}(${n(x)})${e[1] ? ` ${e[1] < 0 ? MINUS : '+'} ${n(Math.abs(e[1]))}` : ''}`);
const val1 = (e, x) => e[0] * x + e[1];

/* ================================================================ Unit 1 */
function genMidpoint(lvl) {
  const end = lvl === 3 && chance(0.55);
  let A, B, M;
  for (let t = 0; t < 1000; t++) {
    if (end) {
      M = [ri(-5, 5), ri(-5, 5)]; A = [ri(-9, 9), ri(-9, 9)];
      B = [2 * M[0] - A[0], 2 * M[1] - A[1]];
      if (Math.abs(B[0]) > 11 || Math.abs(B[1]) > 11 || A[0] === M[0] || A[1] === M[1]) continue;
      break;
    }
    const R = lvl === 1 ? 8 : 10;
    A = [ri(-R, R), ri(-R, R)]; B = [ri(-R, R), ri(-R, R)];
    if (A[0] === B[0] || A[1] === B[1]) continue;
    const odd = (A[0] + B[0]) % 2 !== 0 || (A[1] + B[1]) % 2 !== 0;
    if (lvl === 1 && odd) continue;
    if (lvl >= 2 && !odd && chance(0.6)) continue;
    break;
  }
  if (!end) M = [Rt(A[0] + B[0], 2), Rt(A[1] + B[1], 2)];
  const mx = end ? Rt(B[0]) : M[0], my = end ? Rt(B[1]) : M[1];
  const answer = pairStr(mx, my);
  let work, prompt, wrong, figure, figureAlt, brief;
  if (!end) {
    prompt = `Find the midpoint M of the segment with endpoints A${ptStr(A)} and B${ptStr(B)}.`;
    const lines = [
      'M = ((x₁ + x₂) ÷ 2, (y₁ + y₂) ÷ 2)',
      `= ((${n(A[0])} + ${par(B[0])}) ÷ 2, (${n(A[1])} + ${par(B[1])}) ÷ 2)`,
      `= (${n(A[0] + B[0])} ÷ 2, ${n(A[1] + B[1])} ÷ 2)`,
      ['= ', answer],
    ];
    work = works({
      method: ['The midpoint is the average of the endpoints: add the two x-coordinates and halve, then do the same with the y-coordinates.'],
      lines, hintLines: [lines[0], lines[1], ['= ', null]],
      final: ['Check: M should sit halfway between A and B on the grid.'], hint: ['Add each pair of coordinates, then divide by 2.'],
    });
    wrong = [
      pairW(my, mx, 'swapped x and y'),
      pairW(A[0] + B[0], A[1] + B[1], 'forgot to divide by 2'),
      pairW(Rt(B[0] - A[0], 2), Rt(B[1] - A[1], 2), 'subtracted instead of adding'),
      pairW(mx, rmul(my, Rt(-1)), 'sign slip'),
      pairW(rmul(mx, Rt(-1)), my, 'sign slip'),
    ];
    figure = gridFig({ pts: [{ p: A, label: `A${ptStr(A)}` }, { p: B, label: `B${ptStr(B)}` }], segs: [[A, B]] });
    figureAlt = `A coordinate grid with point A at ${ptStr(A)} and point B at ${ptStr(B)}, joined by a segment.`;
    brief = `M = ((${n(A[0])} + ${par(B[0])}) ÷ 2, (${n(A[1])} + ${par(B[1])}) ÷ 2) = ${answer}`;
  } else {
    prompt = `M${ptStr(M)} is the midpoint of segment AB, and A is at ${ptStr(A)}. Find the coordinates of B.`;
    const lines = [
      `x = 2(${n(M[0])}) ${MINUS} ${par(A[0])}`, `= ${n(2 * M[0])} ${MINUS} ${par(A[0])}`, `= ${n(B[0])}`,
      `y = 2(${n(M[1])}) ${MINUS} ${par(A[1])}`, `= ${n(2 * M[1])} ${MINUS} ${par(A[1])}`, `= ${n(B[1])}`,
      ['B = ', answer],
    ];
    work = works({
      method: ['M is the average of A and B, so each coordinate of B is 2 × (the midpoint\'s coordinate) − (A\'s coordinate).', 'Think of it as walking from A to M, then the same distance again.'],
      lines, hintLines: [lines[0], lines[3], ['B = ', null]],
      final: [`Check: the midpoint of ${ptStr(A)} and ${answer} is ${ptStr(M)}.`], hint: ['Work out each coordinate, then write B as an ordered pair.'],
    });
    wrong = [
      pairW(B[1], B[0], 'swapped x and y'),
      pairW(Rt(A[0] + M[0], 2), Rt(A[1] + M[1], 2), 'found the midpoint of A and M'),
      pairW(M[0] - A[0], M[1] - A[1], 'subtracted once instead of doubling'),
      pairW(2 * M[0] + A[0], 2 * M[1] + A[1], 'added A instead of subtracting'),
    ];
    figure = gridFig({ pts: [{ p: A, label: `A${ptStr(A)}` }, { p: M, label: `M${ptStr(M)}` }], segs: [[A, M]] });
    figureAlt = `A coordinate grid with endpoint A at ${ptStr(A)} and midpoint M at ${ptStr(M)}; the other endpoint B is not shown.`;
    brief = `B = (2(${n(M[0])}) − ${par(A[0])}, 2(${n(M[1])}) − ${par(A[1])}) = ${answer}`;
  }
  return makeQ('midpoint', {
    level: lvl, prompt, answer, ans: { k: 'pair', x: mx, y: my },
    data: end ? { mode: 'endpoint', A, M } : { mode: 'midpoint', A, B },
    wrong, work, figure, figureAlt, brief,
  });
}

const AB_NAMES = ['ab', 'ba', 'd', 'distance'];
function genDistance(lvl) {
  const TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 6, 10], [4, 3, 5], [12, 5, 13], [8, 15, 17], [9, 12, 15]];
  for (;;) {
    let dx, dy;
    const triple = lvl === 1 || (lvl === 2 && chance(0.35)) || (lvl === 3 && chance(0.15));
    if (triple) {
      const tr = pick(TRIPLES.filter((x) => x[2] <= (lvl === 1 ? 13 : 17)));
      [dx, dy] = chance(0.5) ? [tr[0], tr[1]] : [tr[1], tr[0]];
    } else {
      dx = ri(1, lvl === 2 ? 8 : 12); dy = ri(1, lvl === 2 ? 8 : 12);
      if (isSquare(dx * dx + dy * dy)) continue;
    }
    const sx = chance(0.5) ? 1 : -1, sy = chance(0.5) ? 1 : -1;
    const A = [ri(-9, 9), ri(-9, 9)];
    const B = [A[0] + sx * dx, A[1] + sy * dy];
    if (Math.abs(B[0]) > 11 || Math.abs(B[1]) > 11) continue;
    const d2 = dx * dx + dy * dy, d = Math.sqrt(d2);
    const exact = isSquare(d2);
    if (!exact && nearTie(d, 1)) continue;
    const ansStr = exact ? String(d) : roundStr(d, 1);
    const answer = `${ansStr} units`;
    const ex = B[0] - A[0], ey = B[1] - A[1];
    const lines = [
      `AB = √((${n(B[0])} ${MINUS} ${par(A[0])})² + (${n(B[1])} ${MINUS} ${par(A[1])})²)`,
      `= √(${par(ex)}² + ${par(ey)}²)`,
      `= √(${dx * dx} + ${dy * dy})`,
      `= √${d2}`,
      ...(exact ? [['= ', answer]] : [`≈ ${more(d, 1)}`, ['≈ ', answer]]),
    ];
    const W1 = (v, why) => ({ str: `${numStr(v)} units`, val: Number(numStr(v)), why });
    const wrong = [W1(d2, 'forgot the square root'), W1(dx + dy, 'added the differences instead of using the formula')];
    if (dx !== dy) { const k = Math.abs(dx * dx - dy * dy); wrong.push(W1(isSquare(k) ? Math.sqrt(k) : Number(roundStr(Math.sqrt(k), 1)), 'subtracted the squares')); }
    if (!exact) {
      const tr = Math.floor(d * 10) / 10;
      if (roundStr(tr, 1) !== ansStr) wrong.push(W1(Number(roundStr(tr, 1)), 'cut off the digits instead of rounding'));
      wrong.push(W1(Math.round(d), 'rounded to a whole number'));
    }
    wrong.push(...fallbacks(Number(ansStr), W1));
    return makeQ('distance', {
      level: lvl,
      prompt: `Find the distance between A${ptStr(A)} and B${ptStr(B)}. Round to the nearest tenth if necessary.`,
      answer,
      ans: exact ? { k: 'num', v: Rt(d), u: 'len:units', names: AB_NAMES, ask: 'AB' } : { k: 'round', v: d, dp: 1, u: 'len:units', names: AB_NAMES, ask: 'AB', rad2: d2 },
      data: { A, B }, wrong,
      work: works({
        method: ['The distance formula is the Pythagorean theorem on the grid: d = √((x₂ − x₁)² + (y₂ − y₁)²).'],
        lines, hintLines: [lines[0], ['= ', null]],
        final: [exact ? `${d2} is a perfect square, so the distance is exact.` : `√${d2} is not a whole number, so round: ${more(d, 1)}… to the nearest tenth is ${ansStr}.`],
        hint: ['Square the change in x and the change in y, add them, then take the square root.'],
      }),
      figure: gridFig({ pts: [{ p: A, label: `A${ptStr(A)}` }, { p: B, label: `B${ptStr(B)}` }], segs: [[A, B]] }),
      figureAlt: `A coordinate grid with point A at ${ptStr(A)} and point B at ${ptStr(B)}, joined by a segment.`,
      brief: `AB = √(${par(ex)}² + ${par(ey)}²) = √${d2} ${exact ? '=' : '≈'} ${ansStr}`,
    });
  }
}

function segmentFig(mode, labels) {
  const w = 320, h = 96, y = 40, x0 = 22, x1 = 298, xm = mode === 'mid' ? 160 : 22 + 276 * (0.38 + Math.random() * 0.24);
  let s = L([x0, y], [x1, y], 'gm-seg');
  for (const x of [x0, xm, x1]) s += DOT([x, y]);
  const names = mode === 'mid' ? ['A', 'M', 'B'] : ['A', 'B', 'C'];
  [x0, xm, x1].forEach((x, i) => { s += T([x, y + 15], names[i], { cls: 'gm-vx' }); });
  s += T([(x0 + xm) / 2, y - 16], labels[0], { cls: 'gm-lb' }) + T([(xm + x1) / 2, y - 16], labels[1], { cls: 'gm-lb' });
  if (mode === 'mid') s += ticks([x0, y], [xm, y], 1) + ticks([xm, y], [x1, y], 1);
  if (labels[2]) {
    s += PL([[x0, y + 26], [x0, y + 32], [x1, y + 32], [x1, y + 26]], 'gm-brace gm-nofill');
    s += T([(x0 + x1) / 2, y + 44], labels[2], { cls: 'gm-lb' });
  }
  return svgWrap(w, h, s, false);
}
function genSegAdd(lvl) {
  for (;;) {
    const x = ri(2, lvl === 1 ? 9 : 12);
    const mode = lvl >= 2 && chance(0.35) ? 'mid' : 'between';
    const mk = () => [ri(1, lvl === 1 ? 3 : 6), ri(-9, 12)];
    let e1 = mk(), e2 = mk();
    if (lvl === 1 && chance(0.4)) e2 = [0, ri(4, 20)];
    const v1 = val1(e1, x);
    if (mode === 'mid') {
      if (e2[0] === e1[0] || e2[0] === 0) continue;
      e2 = [e2[0], v1 - e2[0] * x];
    }
    const v2 = val1(e2, x);
    if (v1 < 2 || v2 < 2 || Math.abs(e2[1]) > 30) continue;
    const total = v1 + v2;
    let e3 = null;
    if (mode === 'between' && lvl === 3 && chance(0.6)) {
      const a3 = ri(1, 9);
      if (a3 === e1[0] + e2[0]) continue;
      e3 = [a3, total - a3 * x];
      if (Math.abs(e3[1]) > 40) continue;
    }
    const segs = mode === 'mid' ? { AM: v1, MB: v2, AB: total } : { AB: v1, BC: v2, AC: total };
    const ask = lvl === 1 ? 'x' : pick(mode === 'mid' ? ['x', 'x', 'AB', 'AM'] : ['x', 'x', 'AB', 'BC', ...(e3 ? ['AC'] : [])]);
    const [n1, n2, n3] = mode === 'mid' ? ['AM', 'MB', 'AB'] : ['AB', 'BC', 'AC'];
    const totalStr = e3 ? lin(e3[0], e3[1]) : n(total);
    const prompt = (mode === 'mid'
      ? `M is the midpoint of AB. AM = ${lin(e1[0], e1[1])} and MB = ${lin(e2[0], e2[1])}.`
      : `B is between A and C. AB = ${lin(e1[0], e1[1])}, BC = ${lin(e2[0], e2[1])} and AC = ${totalStr}.`) + ` Find ${ask}.`;
    const [p, q, r, s] = mode === 'mid' ? [e1[0], e1[1], e2[0], e2[1]] : [e1[0] + e2[0], e1[1] + e2[1], e3 ? e3[0] : 0, e3 ? e3[1] : total];
    const part = (e) => (e[0] ? `(${lin(e[0], e[1])})` : n(e[1]));
    const setup = mode === 'mid' ? `${lin(e1[0], e1[1])} = ${lin(e2[0], e2[1])}` : `${part(e1)} + ${part(e2)} = ${totalStr}`;
    const sol = solveLines(p, q, r, s, ask === 'x', setup);
    if (sol.x.d !== 1 || sol.x.n !== x) continue;
    const value = ask === 'x' ? x : segs[ask];
    // an answer equal to the number already on the right of the setup (x = 6 with AC = 6) reads like a giveaway
    if (setup.endsWith(`= ${n(value)}`)) continue;
    const lines = [setup, ...sol.lines];
    if (ask !== 'x') {
      if (ask === 'AB' && mode === 'mid') lines.push(`AM = ${sub1(e1, x)} = ${v1}`, [`AB = 2 × ${v1} = `, String(value)]);
      else if (ask === 'AC') lines.push([`AC = ${sub1(e3, x)} = `, String(value)]);
      else lines.push([`${ask} = ${sub1({ AM: e1, AB: e1, BC: e2 }[ask], x)} = `, String(value)]);
    }
    const W1 = (v, why) => ({ str: String(v), val: v, why });
    const wrong = [];
    if (ask === 'x') {
      if (mode === 'between' && e1[0] !== e2[0]) { const y = (e2[1] - e1[1]) / (e1[0] - e2[0]); if (Number.isInteger(y) && y > 0) wrong.push(W1(y, 'set AB equal to BC')); }
      if (p - r !== 0) { const y = (s + q) / (p - r); if (Number.isInteger(y) && y > 0) wrong.push(W1(y, 'moved the constant without changing its sign')); }
      wrong.push(W1(v1, `gave ${n1} instead of x`));
    } else {
      wrong.push(W1(x, 'gave x instead of the length'));
      for (const k of [n1, n2, n3]) if (k !== ask && segs[k] !== value) wrong.push(W1(segs[k], `found ${k} instead`));
    }
    wrong.push(...fallbacks(value, W1));
    const figLabels = mode === 'mid' ? [lin(e1[0], e1[1]), lin(e2[0], e2[1]), ''] : [lin(e1[0], e1[1]), lin(e2[0], e2[1]), totalStr];
    return makeQ('segadd', {
      level: lvl, prompt, answer: String(value),
      ans: ask === 'x' ? { k: 'num', v: Rt(x), names: ['x'], ask: 'x' } : { k: 'num', v: Rt(value), u: 'len:units', names: [ask.toLowerCase(), ask.toLowerCase().split('').reverse().join('')], ask },
      data: { mode, e1, e2, total: e3 || total, ask },
      wrong,
      work: works({
        method: [mode === 'mid' ? 'M is the midpoint, so it cuts AB into two equal parts: AM = MB.' : 'Segment Addition Postulate: the two parts add up to the whole, AB + BC = AC.'],
        lines, hintLines: [setup, ['x = ', null]],
        final: [ask === 'x' ? `Check: with x = ${x}, ${n1} = ${v1} and ${n2} = ${v2}${mode === 'mid' ? ' — equal, as they should be.' : `, and ${v1} + ${v2} = ${total}.`}` : `Check: ${n1} = ${v1} and ${n2} = ${v2}${mode === 'mid' ? ` are equal, and AB = ${total}.` : ` add up to AC = ${total}.`}`],
        hint: [ask === 'x' ? 'Combine like terms, then get x by itself.' : `Solve for x first, then substitute it into ${ask === 'AB' && mode === 'mid' ? 'AM and double it' : ask}.`],
      }),
      figure: segmentFig(mode, figLabels),
      figureAlt: mode === 'mid'
        ? `Segment AB with midpoint M; tick marks show AM and MB are congruent. AM is labelled ${figLabels[0]} and MB is labelled ${figLabels[1]}.`
        : `Segment AC with point B between A and C. AB is labelled ${figLabels[0]}, BC is labelled ${figLabels[1]} and the whole segment AC is labelled ${figLabels[2]}.`,
      brief: `${setup}, so x = ${x}${ask === 'x' ? '' : ` and ${ask} = ${value}`}.`,
    });
  }
}

/** Two angles drawn to scale: a linear pair, vertical angles, a complementary
    pair sharing a ray, or two separate supplementary angles. */
function anglePairFig(rel, m1, m2) {
  const w = 300, h = 170, R = 80;
  let s = '';
  if (rel === 'supp') {
    const back = (m) => Math.max(0, -Math.cos(m * DEG) * R);
    const O1 = [20 + back(m1), 128];
    const r1 = add2(O1, [Math.cos(m1 * DEG) * R, -Math.sin(m1 * DEG) * R]), b1 = add2(O1, [R, 0]);
    const O2 = [Math.max(b1[0], r1[0]) + 34 + back(m2), 128];
    const r2 = add2(O2, [Math.cos(m2 * DEG) * R, -Math.sin(m2 * DEG) * R]), b2 = add2(O2, [R, 0]);
    s += L(O1, r1, 'gm-seg') + L(O1, b1, 'gm-seg') + L(O2, r2, 'gm-seg') + L(O2, b2, 'gm-seg');
    s += arcs(O1, b1, r1, 1, 20, 'gm-hl') + arcs(O2, b2, r2, 1, 20, 'gm-hl');
    s += T(inside(O1, b1, r1, 36), '1', { cls: 'gm-num' }) + T(inside(O2, b2, r2, 36), '2', { cls: 'gm-num' });
    return svgWrap(Math.max(w, Math.ceil(Math.max(b2[0], r2[0]) + 20)), h, s + DOT(O1) + DOT(O2), true);
  }
  const rot = rel === 'vert' ? ri(-20, 20) : rel === 'comp' ? ri(-10, 10) : 0;
  const O = [150, rel === 'vert' ? 85 : 138];
  const at = (deg, r) => add2(O, [Math.cos((deg + rot) * DEG) * r, -Math.sin((deg + rot) * DEG) * r]);
  let a1, a2;
  if (rel === 'lin') { a1 = [0, m1]; a2 = [m1, 180]; s += L(at(180, 130), at(0, 130), 'gm-seg') + L(O, at(m1, 115), 'gm-seg'); }
  else if (rel === 'comp') { a1 = [0, m1]; a2 = [m1, 90]; for (const r of [0, m1, 90]) s += L(O, at(r, 118), 'gm-seg'); }
  else { a1 = [0, m1]; a2 = [180, 180 + m1]; s += L(at(180, 120), at(0, 120), 'gm-seg') + L(at(180 + m1, 120), at(m1, 120), 'gm-seg'); }
  s += arcs(O, at(a1[0], 10), at(a1[1], 10), 1, 20, 'gm-hl') + arcs(O, at(a2[0], 10), at(a2[1], 10), 1, 26, 'gm-hl');
  const lab = (a, i) => T(inside(O, at(a[0], 10), at(a[1], 10), (a[1] - a[0]) < 35 ? 56 : 42), String(i + 1), { cls: 'gm-num' });
  s += lab(a1, 0) + lab(a2, 1) + DOT(O);
  return svgWrap(w, h, s, true);
}
const REL_TEXT = {
  comp: { says: 'are complementary', rule: 'Complementary angles add up to 90°.', sum: 90 },
  supp: { says: 'are supplementary', rule: 'Supplementary angles add up to 180°.', sum: 180 },
  vert: { says: 'are vertical angles', rule: 'Vertical angles are congruent: they have equal measures.', sum: 0 },
  lin: { says: 'form a linear pair', rule: 'The two angles of a linear pair make a straight angle, so they add up to 180°.', sum: 180 },
};
function genAnglePairs(lvl) {
  for (;;) {
    const rel = pick(['comp', 'supp', 'vert', 'lin']);
    const x = ri(3, lvl === 1 ? 12 : 20);
    const m1 = rel === 'comp' ? ri(22, 68) : rel === 'vert' ? ri(30, 150) : ri(35, 145);
    const m2 = rel === 'comp' ? 90 - m1 : rel === 'vert' ? m1 : 180 - m1;
    const mk = (m) => { const a = ri(1, lvl === 1 ? 4 : 6); return [a, m - a * x]; };
    let e1 = mk(m1);
    const e2 = mk(m2);
    if (lvl === 1 && chance(0.4)) e1 = [0, m1];
    if (rel === 'vert' && e1[0] === e2[0]) continue;
    if (Math.abs(e1[1]) > 60 || Math.abs(e2[1]) > 60) continue;
    if (rel !== 'vert' && Math.abs(m1 - m2) < 4) continue;
    const ask = lvl === 1 ? 'x' : lvl === 2 ? pick(['x', 'x', '1', '2']) : pick(['x', '1', '2']);
    if (ask === '1' && e1[0] === 0) continue;
    const R = REL_TEXT[rel];
    const fromFig = lvl === 3 && (rel === 'vert' || rel === 'lin') && chance(0.5);
    const prompt = `${fromFig ? 'Use the figure.' : `∠1 and ∠2 ${R.says}.`} m∠1 = ${angExpr(e1)} and m∠2 = ${angExpr(e2)}. Find ${ask === 'x' ? 'x' : `m∠${ask}`}.`;
    const [p, q, r, s] = rel === 'vert' ? [e1[0], e1[1], e2[0], e2[1]] : [e1[0] + e2[0], e1[1] + e2[1], 0, R.sum];
    const setup = rel === 'vert' ? `${lin(e1[0], e1[1])} = ${lin(e2[0], e2[1])}` : `${e1[0] ? `(${lin(e1[0], e1[1])})` : n(e1[1])} + (${lin(e2[0], e2[1])}) = ${R.sum}`;
    const sol = solveLines(p, q, r, s, ask === 'x', setup);
    if (sol.x.d !== 1 || sol.x.n !== x) continue;
    const val = ask === 'x' ? x : ask === '1' ? m1 : m2;
    const lines = [setup, ...sol.lines];
    if (ask !== 'x') lines.push([`m∠${ask} = ${sub1(ask === '1' ? e1 : e2, x)} = `, `${val}°`]);
    const W1 = ask === 'x' ? (v, why) => ({ str: String(v), val: v, why }) : numW('deg');
    const wrong = [];
    if (ask === 'x') {
      for (const alt of [90, 180]) {
        if (rel === 'vert' || alt === R.sum) continue;
        const y = (alt - (e1[1] + e2[1])) / (e1[0] + e2[0]);
        if (Number.isInteger(y) && y > 0) wrong.push(W1(y, `used ${alt}° instead of ${R.sum}°`));
      }
      if (rel !== 'vert' && e1[0] !== e2[0]) { const y = (e2[1] - e1[1]) / (e1[0] - e2[0]); if (Number.isInteger(y) && y > 0) wrong.push(W1(y, 'set the angles equal')); }
      if (e1[0]) wrong.push(W1(m1, 'gave the angle instead of x'));
    } else {
      wrong.push(W1(180 - val, 'gave the supplement'));
      if (val < 90) wrong.push(W1(90 - val, 'gave the complement'));
      wrong.push(W1(x, 'gave x instead of the angle'));
      if (m1 !== m2) wrong.push(W1(ask === '1' ? m2 : m1, 'found the other angle'));
    }
    wrong.push(...fallbacks(val, W1));
    const figAlt = {
      lin: 'A straight line with a ray drawn from a point on it, making two adjacent angles: ∠1 on the right and ∠2 on the left.',
      vert: 'Two lines crossing at a point; ∠1 and ∠2 are opposite each other at the crossing.',
      comp: 'Two adjacent angles, ∠1 and ∠2, that share a ray.',
      supp: 'Two separate angles, ∠1 on the left and ∠2 on the right.',
    }[rel];
    return makeQ('anglepairs', {
      level: lvl, prompt, answer: ask === 'x' ? String(x) : `${val}°`,
      ans: ask === 'x' ? { k: 'num', v: Rt(x), names: ['x'], ask: 'x' } : { k: 'num', v: Rt(val), u: 'deg', names: [ask], ask: `m∠${ask}` },
      data: { rel, e1, e2, ask, m1, m2, stated: !fromFig },
      wrong,
      work: works({
        method: [fromFig ? `In the figure, ∠1 and ∠2 ${R.says}. ${R.rule}` : R.rule],
        lines, hintLines: [setup, ['x = ', null]],
        final: [`Check: m∠1 = ${m1}° and m∠2 = ${m2}°${rel === 'vert' ? ' are equal.' : `, and ${m1}° + ${m2}° = ${R.sum}°.`}`],
        hint: [ask === 'x' ? 'Solve the equation for x.' : `Solve for x, then substitute it into m∠${ask}.`],
      }),
      figure: anglePairFig(rel, m1, m2),
      figureAlt: figAlt,
      brief: `${R.rule} ${setup}, so x = ${x}${ask === 'x' ? '' : ` and m∠${ask} = ${val}°`}.`,
    });
  }
}

/* ================================================================ Unit 2 */
const CONDS = [
  { s: 'an angle', pr: 'it', P: 'is acute', Q: 'measures less than 90°', nP: 'is not acute', nQ: 'does not measure less than 90°' },
  { s: 'a figure', pr: 'it', P: 'is a square', Q: 'is a rectangle', nP: 'is not a square', nQ: 'is not a rectangle' },
  { s: 'a number', pr: 'it', P: 'is divisible by 4', Q: 'is even', nP: 'is not divisible by 4', nQ: 'is not even' },
  { s: 'a triangle', pr: 'it', P: 'is equilateral', Q: 'is isosceles', nP: 'is not equilateral', nQ: 'is not isosceles' },
  { s: 'two angles', pr: 'they', P: 'are vertical angles', Q: 'are congruent', nP: 'are not vertical angles', nQ: 'are not congruent' },
  { s: 'a quadrilateral', pr: 'it', P: 'is a rhombus', Q: 'has four congruent sides', nP: 'is not a rhombus', nQ: 'does not have four congruent sides' },
  { s: 'an animal', pr: 'it', P: 'is a dog', Q: 'is a mammal', nP: 'is not a dog', nQ: 'is not a mammal' },
  { s: 'a polygon', pr: 'it', P: 'has exactly three sides', Q: 'is a triangle', nP: 'does not have exactly three sides', nQ: 'is not a triangle' },
  { s: 'a point', pr: 'it', P: 'is the midpoint of a segment', Q: 'divides the segment into two congruent parts', nP: 'is not the midpoint of a segment', nQ: 'does not divide the segment into two congruent parts' },
  { s: 'two lines', pr: 'they', P: 'are perpendicular', Q: 'form right angles', nP: 'are not perpendicular', nQ: 'do not form right angles' },
  { s: 'a triangle', pr: 'it', P: 'has a right angle', Q: 'is a right triangle', nP: 'does not have a right angle', nQ: 'is not a right triangle' },
  { s: 'two angles', pr: 'they', P: 'form a linear pair', Q: 'are supplementary', nP: 'do not form a linear pair', nQ: 'are not supplementary' },
  { s: 'a quadrilateral', pr: 'it', P: 'is a parallelogram', Q: 'has two pairs of parallel sides', nP: 'is not a parallelogram', nQ: 'does not have two pairs of parallel sides' },
  { s: 'a number', pr: 'it', P: 'ends in 0', Q: 'is divisible by 5', nP: 'does not end in 0', nQ: 'is not divisible by 5' },
  { s: 'a city', pr: 'it', P: 'is in Texas', Q: 'is in the United States', nP: 'is not in Texas', nQ: 'is not in the United States' },
  { s: 'an angle', pr: 'it', P: 'measures 180°', Q: 'is a straight angle', nP: 'does not measure 180°', nQ: 'is not a straight angle' },
  { s: 'a polygon', pr: 'it', P: 'is a regular hexagon', Q: 'has six congruent sides', nP: 'is not a regular hexagon', nQ: 'does not have six congruent sides' },
];
const FORM_NAMES = { conv: 'converse', inv: 'inverse', contra: 'contrapositive' };
const FORM_RULE = { conv: 'swaps the hypothesis and the conclusion', inv: 'negates both the hypothesis and the conclusion', contra: 'swaps them and negates both' };
function condSentence(t, f) {
  const [h, c] = { cond: [t.P, t.Q], conv: [t.Q, t.P], inv: [t.nP, t.nQ], contra: [t.nQ, t.nP] }[f];
  return `If ${t.s} ${h}, then ${t.pr} ${c}.`;
}
const bicond = (t) => `${cap(t.s)} ${t.P} if and only if ${t.pr} ${t.Q}.`;
function genRelated(lvl) {
  const t = pick(CONDS);
  const form = pick(['conv', 'inv', 'contra']);
  const variant = lvl === 1 ? 'pick' : lvl === 2 ? pick(['pick', 'name']) : pick(['pick', 'name', 'name']);
  const cond = condSentence(t, 'cond');
  let prompt, options, answer;
  if (variant === 'pick') {
    prompt = `Statement: “${cond}” Which of these is its ${FORM_NAMES[form]}?`;
    answer = condSentence(t, form);
    options = shuffle(['conv', 'inv', 'contra'].map((f) => condSentence(t, f)).concat(bicond(t)));
  } else {
    prompt = `Statement: “${cond}” What is this related statement called? “${condSentence(t, form)}”`;
    answer = cap(FORM_NAMES[form]);
    options = shuffle(['Converse', 'Inverse', 'Contrapositive', 'Biconditional']);
  }
  const work = (full) => W(
    P(`Label the parts of “${cond}”: the hypothesis p is “${t.s} ${t.P}” and the conclusion q is “${t.pr} ${t.Q}”.`),
    el('ul', { class: 'gm-list' },
      el('li', {}, el('b', {}, 'Converse: '), 'swap them — “If q, then p.”'),
      el('li', {}, el('b', {}, 'Inverse: '), 'negate both — “If not p, then not q.”'),
      el('li', {}, el('b', {}, 'Contrapositive: '), 'swap and negate — “If not q, then not p.”')),
    full && variant === 'name' ? P(`“${condSentence(t, form)}” ${FORM_RULE[form]}, so it is the `, boxed(answer), '.') : null,
    full && variant === 'pick' ? P(`The ${FORM_NAMES[form]} ${FORM_RULE[form]}: `, boxed(answer)) : null,
    full ? aside('A statement and its contrapositive are always both true or both false; so are the converse and the inverse.')
      : aside(variant === 'pick' ? `Build the ${FORM_NAMES[form]} from p and q yourself, then find the option that matches it word for word.` : 'Compare the related statement with p and q: were they swapped, negated, or both?'),
  );
  return makeQ('related', {
    level: lvl, type: 'mc', prompt, answer, options,
    data: { t: { ...t }, form, variant },
    work, brief: `The ${FORM_NAMES[form]} ${FORM_RULE[form]}: “${condSentence(t, form)}”`,
  });
}
function genHypConc(lvl) {
  const t = pick(CONDS);
  const style = lvl === 1 ? 'ifthen' : lvl === 2 ? pick(['ifthen', 'qifp', 'when']) : pick(['qifp', 'onlyif', 'when']);
  const ask = pick(['hypothesis', 'conclusion']);
  const sentence = {
    ifthen: `If ${t.s} ${t.P}, then ${t.pr} ${t.Q}.`,
    qifp: `${cap(t.s)} ${t.Q} if ${t.pr} ${t.P}.`,
    when: `When ${t.s} ${t.P}, ${t.pr} ${t.Q}.`,
    onlyif: `${cap(t.s)} ${t.P} only if ${t.pr} ${t.Q}.`,
  }[style];
  const hyp = `${cap(t.s)} ${t.P}`, conc = `${cap(t.s)} ${t.Q}`;
  const answer = ask === 'hypothesis' ? hyp : conc;
  const options = shuffle([hyp, conc, `${cap(t.s)} ${t.nP}`, `${cap(t.s)} ${t.nQ}`]);
  const rule = {
    ifthen: 'In “If p, then q”, the hypothesis p comes after “if” and the conclusion q comes after “then”.',
    qifp: 'In “q if p”, the hypothesis is still the part after the word “if” — even though it comes second.',
    when: '“When p, q” means the same as “If p, then q”.',
    onlyif: '“p only if q” means “If p, then q”: the hypothesis is the part before “only if” and the conclusion follows it.',
  }[style];
  const work = (full) => W(
    P(rule),
    full ? P(`Rewritten in if-then form: “If ${t.s} ${t.P}, then ${t.pr} ${t.Q}.”`) : null,
    full ? P(`The ${ask} is `, boxed(answer), '.') : aside('The hypothesis is the condition (what is given); the conclusion is what follows from it.'),
  );
  return makeQ('hypconc', {
    level: lvl, type: 'mc', prompt: `What is the ${ask} of this statement? “${sentence}”`, answer, options,
    data: { t: { ...t }, style, ask },
    work, brief: `As an if-then statement: “If ${t.s} ${t.P}, then ${t.pr} ${t.Q}.” The ${ask} is “${answer}”.`,
  });
}

/* ================================================================ Unit 3 */
const PAIR_NAMES = { corr: 'Corresponding angles', altint: 'Alternate interior angles', altext: 'Alternate exterior angles', ssi: 'Same-side interior angles', vert: 'Vertical angles', lin: 'Linear pair' };
const PAIR_RULE = { corr: 'congruent', altint: 'congruent', altext: 'congruent', vert: 'congruent', ssi: 'supplementary', lin: 'supplementary' };
/** The pair's name inside a sentence: "∠1 and ∠2 are a linear pair". */
const PAIR_PHRASE = { corr: 'corresponding angles', altint: 'alternate interior angles', altext: 'alternate exterior angles', ssi: 'same-side interior angles', vert: 'vertical angles', lin: 'a linear pair' };
/** Why the pair is congruent or supplementary: only four of the six need the parallel lines. */
const PAIR_FACT = {
  corr: 'When the lines are parallel, corresponding angles are congruent.',
  altint: 'When the lines are parallel, alternate interior angles are congruent.',
  altext: 'When the lines are parallel, alternate exterior angles are congruent.',
  ssi: 'When the lines are parallel, same-side interior angles are supplementary.',
  vert: 'Vertical angles are always congruent — parallel lines or not.',
  lin: 'The angles of a linear pair are always supplementary — parallel lines or not.',
};
/* Angles 1–4 are at line ℓ and 5–8 at line m; in each group of four the
   order is upper-left, upper-right, lower-left, lower-right of the transversal. */
const posOf = (k) => { const p = (k - 1) % 4; return { top: k <= 4, up: p < 2, right: p % 2 === 1 }; };
function pairType(a, b) {
  const A = posOf(a), B = posOf(b);
  if (A.top === B.top) {
    if (A.up !== B.up && A.right !== B.right) return 'vert';
    return A.up !== B.up || A.right !== B.right ? 'lin' : null;
  }
  if (A.up === B.up && A.right === B.right) return 'corr';
  const inA = A.top ? !A.up : A.up, inB = B.top ? !B.up : B.up;
  if (inA && inB) return A.right !== B.right ? 'altint' : 'ssi';
  if (!inA && !inB) return A.right !== B.right ? 'altext' : 'sse';
  return null;
}
/** The measure of angle k when the transversal leans right (sgn 1) or left
    (sgn −1) and makes an acute angle theta with the parallel lines. */
function angleMeasure(k, theta, sgn) {
  const phi = sgn > 0 ? theta : 180 - theta;
  const p = posOf(k);
  return p.up === p.right ? phi : 180 - phi;
}
const ALL_PAIRS = [];
for (let a = 1; a <= 8; a++) for (let b = a + 1; b <= 8; b++) ALL_PAIRS.push([a, b]);
const where = (k) => (k <= 4 ? 'line ℓ' : 'line m');
function parallelFig(theta, sgn, hi = []) {
  const w = 300, h = 214, yT = 72, yB = 150;
  const phi = sgn > 0 ? theta : 180 - theta;
  const u = [Math.cos(phi * DEG), -Math.sin(phi * DEG)];
  const k = (yB - yT) / Math.sin(phi * DEG);
  const IT = [150 + (u[0] * k) / 2, yT], IB = [150 - (u[0] * k) / 2, yB];
  let s = L([12, yT], [288, yT], 'gm-seg') + L([12, yB], [288, yB], 'gm-seg');
  s += PL([[262, yT - 5], [269, yT], [262, yT + 5]], 'gm-mark gm-nofill') + PL([[262, yB - 5], [269, yB], [262, yB + 5]], 'gm-mark gm-nofill');
  const t0 = sub2(IB, mul2(u, 58)), t1 = add2(IT, mul2(u, 58));
  s += L(t0, t1, 'gm-seg');
  s += T([290, yT - 12], 'ℓ', { a: 'end', cls: 'gm-lb gm-it' }) + T([290, yB - 12], 'm', { a: 'end', cls: 'gm-lb gm-it' });
  s += T(add2(t1, [u[0] > 0 ? 9 : -9, 2]), 't', { cls: 'gm-lb gm-it' });
  const regions = { 0: [phi, 180], 1: [0, phi], 2: [180, 180 + phi], 3: [180 + phi, 360] };
  for (let kk = 1; kk <= 8; kk++) {
    const I = kk <= 4 ? IT : IB;
    const [a0, a1] = regions[(kk - 1) % 4];
    const bis = (a0 + a1) / 2, span = a1 - a0;
    const d = Math.min(40, Math.max(19, 11 / Math.sin((span / 2) * DEG)));
    const at = add2(I, [Math.cos(bis * DEG) * d, -Math.sin(bis * DEG) * d]);
    const on = hi.includes(kk);
    if (on) {
      const r = 13;
      const p1 = add2(I, [Math.cos(a0 * DEG) * r, -Math.sin(a0 * DEG) * r]), p2 = add2(I, [Math.cos(a1 * DEG) * r, -Math.sin(a1 * DEG) * r]);
      s += `<path d="M${f1(p1[0])} ${f1(p1[1])} A${r} ${r} 0 0 0 ${f1(p2[0])} ${f1(p2[1])}" class="gm-hl" fill="none"/>`;
    }
    s += T(at, String(kk), { cls: on ? 'gm-num gm-on' : 'gm-num gm-off' });
  }
  return svgWrap(w, h, s + DOT(IT) + DOT(IB), true);
}
const PARALLEL_ALT = 'Two parallel lines ℓ (top) and m (bottom) cut by a transversal t. At each crossing the four angles are numbered upper-left, upper-right, lower-left, lower-right: 1 to 4 at line ℓ and 5 to 8 at line m.';
function genPairName(lvl) {
  const theta = ri(38, 72), sgn = chance(0.5) ? 1 : -1;
  const types = lvl === 1 ? ['corr', 'altint', 'vert', 'lin'] : ['corr', 'altint', 'altext', 'ssi', 'vert', 'lin'];
  const type = pick(types);
  const [a, b] = shuffle(pick(ALL_PAIRS.filter(([x, y]) => pairType(x, y) === type)));
  const answer = PAIR_NAMES[type];
  const near = { corr: ['altint', 'altext', 'ssi'], altint: ['altext', 'ssi', 'corr'], altext: ['altint', 'corr', 'vert'], ssi: ['altint', 'corr', 'lin'], vert: ['lin', 'corr', 'altext'], lin: ['vert', 'ssi', 'corr'] }[type];
  const options = shuffle([answer, ...near.map((k) => PAIR_NAMES[k])]);
  const A = posOf(a), B = posOf(b);
  const isIn = (p) => (p.top ? !p.up : p.up);
  const reasons = [];
  if (A.top === B.top) {
    reasons.push(`∠${a} and ∠${b} are at the same crossing (${where(a)}).`);
    reasons.push(type === 'vert' ? 'They are opposite each other — they share only the vertex.' : 'They are side by side and together make a straight line.');
  } else {
    reasons.push(`∠${a} is at ${where(a)} and ∠${b} is at ${where(b)} — two different crossings.`);
    if (type === 'corr') reasons.push('They sit in the same position at each crossing (same side of t, same side of their line).');
    else {
      reasons.push(`∠${a} is ${isIn(A) ? 'between the parallel lines (interior)' : 'outside the parallel lines (exterior)'} and ∠${b} is ${isIn(B) ? 'interior' : 'exterior'}.`);
      reasons.push(`They are on ${A.right !== B.right ? 'opposite sides' : 'the same side'} of the transversal t.`);
    }
  }
  const work = (full) => W(
    full ? null : P('Ask three questions: Are the angles at the same crossing? Are they between the parallel lines (interior) or outside them (exterior)? Are they on the same side of the transversal or on opposite sides?'),
    ...(full ? reasons.map((r) => P(r)) : []),
    full ? P(`So ∠${a} and ∠${b} are ${PAIR_PHRASE[type]}. Answer: `, boxed(answer)) : null,
    full ? P(PAIR_FACT[type]) : aside('Corresponding: same position at each crossing. Alternate: opposite sides of t. Same-side: same side of t.'),
  );
  return makeQ('pairname', {
    level: lvl, type: 'mc', prompt: `Lines ℓ and m are parallel. What kind of angle pair are ∠${a} and ∠${b}?`, answer, options,
    data: { theta, sgn, a, b }, work,
    figure: parallelFig(theta, sgn, [a, b]), figureAlt: `${PARALLEL_ALT} ∠${a} and ∠${b} are highlighted.`,
    brief: `∠${a} and ∠${b} are ${PAIR_PHRASE[type]} (${PAIR_RULE[type]}).`,
  });
}
function pairReason(a, b, ma) {
  const t = pairType(a, b);
  const mb = PAIR_RULE[t] === 'congruent' ? ma : 180 - ma;
  return { t, mb, line: PAIR_RULE[t] === 'congruent' ? [`m∠${b} = m∠${a} = `, `${mb}°`] : [`m∠${b} = 180° ${MINUS} ${ma}° = `, `${mb}°`] };
}
function genPairMeasure(lvl) {
  const theta = ri(35, 80), sgn = chance(0.5) ? 1 : -1;
  let a, b;
  if (lvl === 3) [a, b] = shuffle(pick(ALL_PAIRS));
  else {
    const types = lvl === 1 ? ['corr', 'altint', 'vert', 'lin'] : ['corr', 'altint', 'altext', 'ssi', 'vert', 'lin'];
    const type = pick(types);
    [a, b] = shuffle(pick(ALL_PAIRS.filter(([x, y]) => pairType(x, y) === type)));
  }
  const ma = angleMeasure(a, theta, sgn), mb = angleMeasure(b, theta, sgn);
  const t = pairType(a, b);
  let lines, method, hintLines;
  if (t && t !== 'sse') {
    const r = pairReason(a, b, ma);
    method = [`∠${a} and ∠${b} are ${PAIR_PHRASE[t]}. ${PAIR_FACT[t]}`];
    lines = [r.line];
    hintLines = [];
  } else {
    // two steps: across to the other crossing (corresponding), then at that crossing
    const c = a <= 4 ? a + 4 : a - 4;
    const r2 = pairReason(c, b, ma);
    method = [`∠${a} and ∠${b} are not one of the named pairs, so go in two steps.`, `∠${a} and ∠${c} are corresponding angles, so m∠${c} = ${ma}°.`, `∠${c} and ∠${b} are ${PAIR_PHRASE[r2.t]}, so they are ${PAIR_RULE[r2.t]}.`];
    lines = [`m∠${c} = m∠${a} = ${ma}°`, r2.line];
    hintLines = [];
  }
  const W1 = numW('deg');
  const wrong = [];
  if (180 - mb !== mb) wrong.push(W1(180 - mb, 'used the supplement'));
  if (mb < 90) wrong.push(W1(90 - mb, 'used the complement'));
  if (ma !== mb) wrong.push(W1(ma, 'assumed the angles are equal'));
  wrong.push(W1(mb + 10, 'misread the figure'), W1(Math.abs(mb - 10), 'misread the figure'), ...fallbacks(mb, W1));
  return makeQ('pairmeasure', {
    level: lvl, prompt: `Lines ℓ and m are parallel and m∠${a} = ${ma}°. Find m∠${b}.`, answer: `${mb}°`,
    ans: { k: 'num', v: Rt(mb), u: 'deg', names: [String(b)], ask: `m∠${b}` },
    data: { theta, sgn, a, b, given: ma }, wrong,
    work: (full) => W(
      ...(full ? method.map((m) => P(m)) : [P('First decide how the two angles are related (same crossing? interior or exterior? same side of t?).'), P('Pairs that match — corresponding, alternate interior, alternate exterior, vertical — are congruent. Same-side interior angles and linear pairs are supplementary.')]),
      full ? eqs(lines) : null,
      full ? aside(ma !== mb ? 'Check: in this figure an acute angle and an obtuse angle always add up to 180°.' : 'Check: in this figure all the acute angles are equal, and so are all the obtuse ones.') : aside('If the two angles are not a named pair, go through a third angle.'),
    ),
    figure: parallelFig(theta, sgn, [a, b]), figureAlt: `${PARALLEL_ALT} ∠${a} and ∠${b} are highlighted.`,
    brief: `${method[method.length - 1]} So m∠${b} = ${mb}°.`,
  });
}
function genPairX(lvl) {
  for (;;) {
    const theta = ri(35, 80), sgn = chance(0.5) ? 1 : -1;
    const types = lvl === 1 ? ['corr', 'altint', 'altext', 'vert'] : ['corr', 'altint', 'altext', 'ssi', 'vert', 'lin'];
    const type = pick(types);
    const [a, b] = shuffle(pick(ALL_PAIRS.filter(([x, y]) => pairType(x, y) === type)));
    const ma = angleMeasure(a, theta, sgn), mb = angleMeasure(b, theta, sgn);
    const x = ri(4, 25);
    const e1 = [ri(1, 6), 0], e2 = [ri(1, 6), 0];
    e1[1] = ma - e1[0] * x; e2[1] = mb - e2[0] * x;
    const eq = PAIR_RULE[type] === 'congruent';
    if (eq && e1[0] === e2[0]) continue;
    if (Math.abs(e1[1]) > 70 || Math.abs(e2[1]) > 70) continue;
    const ask = lvl === 3 ? pick(['x', 'a', 'b']) : lvl === 2 ? pick(['x', 'x', 'a']) : 'x';
    const setup = eq ? `${lin(e1[0], e1[1])} = ${lin(e2[0], e2[1])}` : `(${lin(e1[0], e1[1])}) + (${lin(e2[0], e2[1])}) = 180`;
    const [p, q, r, s] = eq ? [e1[0], e1[1], e2[0], e2[1]] : [e1[0] + e2[0], e1[1] + e2[1], 0, 180];
    const sol = solveLines(p, q, r, s, ask === 'x', setup);
    if (sol.x.d !== 1 || sol.x.n !== x) continue;
    const lines = [setup, ...sol.lines];
    const k = ask === 'a' ? a : b, ek = ask === 'a' ? e1 : e2, mk = ask === 'a' ? ma : mb;
    if (ask !== 'x') lines.push([`m∠${k} = ${sub1(ek, x)} = `, `${mk}°`]);
    const val = ask === 'x' ? x : mk;
    const W1 = ask === 'x' ? (v, why) => ({ str: String(v), val: v, why }) : numW('deg');
    const wrong = [];
    if (ask === 'x') {
      if (eq) { const y = (180 - e1[1] - e2[1]) / (e1[0] + e2[0]); if (Number.isInteger(y) && y > 0) wrong.push(W1(y, 'made them supplementary instead of equal')); }
      else if (e1[0] !== e2[0]) { const y = (e2[1] - e1[1]) / (e1[0] - e2[0]); if (Number.isInteger(y) && y > 0) wrong.push(W1(y, 'set them equal instead of supplementary')); }
      wrong.push(W1(ma, 'gave an angle instead of x'));
    } else {
      wrong.push(W1(180 - mk, 'gave the supplement'), W1(x, 'gave x instead of the angle'));
    }
    wrong.push(...fallbacks(val, W1));
    return makeQ('pairx', {
      level: lvl,
      prompt: `Lines ℓ and m are parallel, m∠${a} = ${angExpr(e1)} and m∠${b} = ${angExpr(e2)}. Find ${ask === 'x' ? 'x' : `m∠${k}`}.`,
      answer: ask === 'x' ? String(x) : `${mk}°`,
      ans: ask === 'x' ? { k: 'num', v: Rt(x), names: ['x'], ask: 'x' } : { k: 'num', v: Rt(mk), u: 'deg', names: [String(k)], ask: `m∠${k}` },
      data: { theta, sgn, a, b, e1, e2, ask: ask === 'x' ? 'x' : String(k) }, wrong,
      work: works({
        method: [`∠${a} and ∠${b} are ${PAIR_PHRASE[type]}, so they are ${PAIR_RULE[type]}${eq ? ': set the expressions equal.' : ': their measures add up to 180°.'}`],
        lines, hintLines: [setup, ['x = ', null]],
        final: [`Check: m∠${a} = ${ma}° and m∠${b} = ${mb}°${eq ? ' — equal.' : `, and ${ma}° + ${mb}° = 180°.`}`],
        hint: [ask === 'x' ? 'Solve the equation for x.' : `Solve for x, then substitute it into m∠${k}.`],
      }),
      figure: parallelFig(theta, sgn, [a, b]), figureAlt: `${PARALLEL_ALT} ∠${a} and ∠${b} are highlighted.`,
      brief: `∠${a} and ∠${b} are ${PAIR_PHRASE[type]}, so they are ${PAIR_RULE[type]}: ${setup}, so x = ${x}${ask === 'x' ? '' : ` and m∠${k} = ${mk}°`}.`,
    });
  }
}
/** "y = (3/4)x − 2", "y = −2x + 5" */
function slopeEq(m, b) {
  const c = m.d === 1 ? (m.n === 1 ? '' : m.n === -1 ? MINUS : n(m.n)) : m.n < 0 ? `${MINUS}(${-m.n}/${m.d})` : `(${m.n}/${m.d})`;
  return `y = ${c}x${b ? ` ${b < 0 ? MINUS : '+'} ${Math.abs(b)}` : ''}`;
}
function genSlope(lvl) {
  for (;;) {
    const p = ri(-6, 6), q = ri(1, 6);
    if (!p || gcd(p, q) !== 1 || Math.abs(p) === q) continue;
    const m = Rt(p, q);
    const kind = lvl === 1 ? 'si' : lvl === 2 ? pick(['si', 'pts']) : pick(['pts', 'std', 'std']);
    const rel = pick(['parallel', 'perpendicular']);
    const ans = rel === 'parallel' ? m : Rt(-m.d, m.n);
    let given, find, data;
    if (kind === 'si') {
      const b = ri(-9, 9);
      given = `Line p has the equation ${slopeEq(m, b)}.`;
      find = (full) => [P(`In slope-intercept form y = mx + b, the slope is the coefficient of x${full ? `: line p has slope ${mm(fstr(m))}` : ''}.`)];
      data = { kind, m: [m.n, m.d], b };
    } else if (kind === 'pts') {
      const k = q <= 3 ? ri(1, 2) : 1;
      const P1 = [ri(-8, 8), ri(-8, 8)];
      const P2 = [P1[0] + q * k, P1[1] + p * k];
      if (Math.abs(P2[0]) > 12 || Math.abs(P2[1]) > 12) continue;
      const [Pa, Pb] = chance(0.5) ? [P1, P2] : [P2, P1];
      given = `Line p passes through ${ptStr(Pa)} and ${ptStr(Pb)}.`;
      find = (full) => [P('Slope of line p = rise ÷ run = (y₂ − y₁) ÷ (x₂ − x₁):'), eqs([`m = (${n(Pb[1])} ${MINUS} ${par(Pa[1])}) ÷ (${n(Pb[0])} ${MINUS} ${par(Pa[0])})`, ...(full ? [`= ${n(Pb[1] - Pa[1])} ÷ ${par(Pb[0] - Pa[0])}`, `= ${mm(fstr(m))}`] : [])])];
      data = { kind, P1: Pa, P2: Pb };
    } else {
      const s = p > 0 ? 1 : -1;
      const A = -p * -s, B = q * -s;   // A x + B y = C with −A/B = p/q and A > 0
      const C = ri(-12, 12) || 6;
      given = `Line p has the equation ${lin(A, 0)} ${B < 0 ? MINUS : '+'} ${Math.abs(B) === 1 ? '' : Math.abs(B)}y = ${n(C)}.`;
      find = (full) => [P('Solve for y to put it in slope-intercept form, y = mx + b:'), eqs([`${B === 1 ? '' : B === -1 ? MINUS : n(B)}y = ${lin(-A, C)}`, ...(full ? [`slope = ${n(-A)} ÷ ${par(B)}`, `= ${mm(fstr(m))}`] : [])])];
      data = { kind, A, B, C };
    }
    const answer = mm(fstr(ans));
    const lines = rel === 'parallel'
      ? [['slope of a parallel line = ', answer]]
      : [`${MINUS}1 ÷ (${mm(fstr(m))})`, ['= ', answer], `(${mm(fstr(m))}) × (${answer}) = ${MINUS}1`];
    const W1 = (v, why) => ({ str: mm(fstr(v)), val: rnum(v), why });
    const wrong = rel === 'parallel'
      ? [W1(Rt(-m.d, m.n), 'used the perpendicular slope'), W1(Rt(m.d, m.n), 'flipped the fraction'), W1(Rt(-m.n, m.d), 'changed the sign')]
      : [W1(m, 'used the same slope (that is parallel)'), W1(Rt(m.d, m.n), 'flipped but forgot to change the sign'), W1(Rt(-m.n, m.d), 'changed the sign but forgot to flip')];
    wrong.push(W1(radd(ans, Rt(1)), 'arithmetic slip'), W1(rsub(ans, Rt(1)), 'arithmetic slip'));
    return makeQ('slope', {
      level: lvl, prompt: `${given} What is the slope of a line ${rel} to line p? Give it as a fraction or an integer.`,
      answer, ans: { k: 'num', v: ans, names: ['m', 'slope'], ask: 'the slope' },
      placeholder: 'A fraction or an integer', data: { ...data, rel }, wrong,
      work: (full) => W(
        ...find(full),
        P(rel === 'parallel' ? 'Parallel lines have the same slope.' : 'Perpendicular slopes are negative reciprocals: flip the fraction and change the sign. Their product is −1.'),
        full ? eqs(lines) : aside(rel === 'parallel' ? 'Use the same slope as line p.' : 'Flip the slope of line p and change its sign.'),
      ),
      brief: `Line p has slope ${mm(fstr(m))}; a ${rel} line has slope ${answer}.`,
    });
  }
}

/* ================================================================ Unit 4 */
/** A triangle with angles A (at P0) and B (at P1), in math coordinates. */
function triByAngles(A, B) {
  const C = 180 - A - B;
  const b = Math.sin(B * DEG) / Math.sin(C * DEG);
  return [[0, 0], [1, 0], mul2(dir(A), b)];
}
/** A triangle with side lengths a (opposite P0), b and c, in math coordinates. */
function triBySides(a, b, c) {
  const x = (b * b + c * c - a * a) / (2 * c);
  return [[0, 0], [c, 0], [x, Math.sqrt(Math.max(0, b * b - x * x))]];
}
function angleAt(S, i) {
  const v = S[i], a = S[(i + 1) % 3], b = S[(i + 2) % 3];
  const u1 = unit2(sub2(a, v)), u2 = unit2(sub2(b, v));
  return Math.acos(Math.max(-1, Math.min(1, u1[0] * u2[0] + u1[1] * u2[1]))) / DEG;
}
/** A triangle figure. Side i is opposite vertex i. */
function triSvg(pts, o = {}) {
  const w = o.w || 300, h = o.h || 200;
  const F = o.F || fitter([...pts, ...(o.extraPts || [])], w, h, o.pad || 34);
  const S = pts.map(F);
  const c = centroid(S);
  let s = PG(S, 'gm-shape');
  (o.sideTicks || []).forEach((k, i) => { if (k) s += ticks(S[(i + 1) % 3], S[(i + 2) % 3], k); });
  (o.arcs || []).forEach((k, i) => { if (k) s += arcs(S[i], S[(i + 1) % 3], S[(i + 2) % 3], k, 15, o.arcCls || 'gm-mark'); });
  if (o.right != null) s += rightMark(S[o.right], S[(o.right + 1) % 3], S[(o.right + 2) % 3]);
  (o.angLabels || []).forEach((t, i) => {
    if (!t) return;
    const a = angleAt(S, i);
    const d = Math.min(64, Math.max(26, (7 + t.length * 2.6) / Math.sin((a / 2) * DEG)));
    s += T(inside(S[i], S[(i + 1) % 3], S[(i + 2) % 3], d), t, { cls: 'gm-lb gm-small' });
  });
  (o.sideLabels || []).forEach((t, i) => { if (t) s += slabel(S[(i + 1) % 3], S[(i + 2) % 3], c, t); });
  (o.names || []).forEach((t, i) => { if (t) s += vlabel(S[i], c, t); });
  if (o.more) s += o.more(F, S);
  return o.raw ? s : svgWrap(w, h, s, o.toScale !== false);
}
function randTri(min = 25, max = 110) {
  for (;;) {
    const A = ri(min, max), B = ri(min, Math.min(max, 180 - A - min));
    const C = 180 - A - B;
    if (C >= min && C <= max) return [A, B, C];
  }
}
const VN = ['A', 'B', 'C'];
function genTriSum(lvl) {
  for (;;) {
    let angs = randTri(lvl === 1 ? 30 : 22);
    const rightTri = lvl === 2 && chance(0.4);
    if (rightTri) { const a = ri(20, 70); angs = shuffle([90, a, 90 - a]); }
    const r90 = angs.indexOf(90);
    const u = rightTri ? pick([0, 1, 2].filter((i) => i !== r90)) : ri(0, 2);
    const known = [0, 1, 2].filter((i) => i !== u);
    const pts = triByAngles(angs[0], angs[1]);
    if (lvl < 3) {
      const [i, j] = known;
      const val = angs[u];
      const acute = known.find((kk) => angs[kk] !== 90);
      const prompt = rightTri
        ? `In right triangle ABC, ∠${VN[r90]} is the right angle and m∠${VN[acute]} = ${angs[acute]}°. Find m∠${VN[u]}.`
        : `In △ABC, m∠${VN[i]} = ${angs[i]}° and m∠${VN[j]} = ${angs[j]}°. Find m∠${VN[u]}.`;
      const setup = `m∠${VN[u]} = 180° ${MINUS} ${angs[i]}° ${MINUS} ${angs[j]}° = `;
      const W1 = numW('deg');
      const wrong = [W1(180 - angs[i], 'subtracted only one angle'), W1(180 - angs[j], 'subtracted only one angle'), W1(angs[i] + angs[j], 'added the two angles'), W1(360 - angs[i] - angs[j], 'used 360°'), ...fallbacks(val, W1)];
      const labels = angs.map((x, kk) => (kk === u ? '?' : x === 90 ? '' : `${x}°`));
      return makeQ('trisum', {
        level: lvl, prompt, answer: `${val}°`,
        ans: { k: 'num', v: Rt(val), u: 'deg', names: [VN[u].toLowerCase()], ask: `m∠${VN[u]}` },
        data: { mode: 'num', angles: known.map((kk) => [VN[kk], angs[kk]]), find: VN[u] }, wrong,
        work: works({
          method: ['The three angles of a triangle add up to 180°, so subtract the two you know from 180°.', ...(rightTri ? ['A right angle is 90°.'] : [])],
          lines: [[setup, `${val}°`]], hintLines: [[setup, null]],
          final: [`Check: ${angs[0]}° + ${angs[1]}° + ${angs[2]}° = 180°.`], hint: ['Subtract both known angles from 180°.'],
        }),
        figure: triSvg(pts, { names: VN, angLabels: labels, right: r90 >= 0 ? r90 : null }),
        figureAlt: `Triangle ABC. ${known.map((kk) => `Angle ${VN[kk]} is ${angs[kk] === 90 ? 'marked as a right angle' : `labelled ${angs[kk]}°`}`).join('; ')}; angle ${VN[u]} is marked with a question mark.`,
        brief: `180° − ${angs[i]}° − ${angs[j]}° = ${val}°`,
      });
    }
    // Challenge: all three angles as expressions in x
    const x = ri(5, 20);
    const es = angs.map((m) => { const a = ri(1, 4); return [a, m - a * x]; });
    if (es.some((e) => Math.abs(e[1]) > 45)) continue;
    const ask = pick(['x', 'A', 'B', 'C']);
    const setup = `${es.map((e) => `(${lin(e[0], e[1])})`).join(' + ')} = 180`;
    const p = es.reduce((sum, e) => sum + e[0], 0), q = es.reduce((sum, e) => sum + e[1], 0);
    const sol = solveLines(p, q, 0, 180, ask === 'x', setup);
    if (sol.x.d !== 1 || sol.x.n !== x) continue;
    const idx = VN.indexOf(ask);
    const val = ask === 'x' ? x : angs[idx];
    const lines = [setup, ...sol.lines];
    if (ask !== 'x') lines.push([`m∠${ask} = ${sub1(es[idx], x)} = `, `${val}°`]);
    const W1 = ask === 'x' ? (v, why) => ({ str: String(v), val: v, why }) : numW('deg');
    const wrong = [];
    if (ask === 'x') { const y = (360 - q) / p, z = (90 - q) / p; if (Number.isInteger(y) && y > 0) wrong.push(W1(y, 'used 360°')); if (Number.isInteger(z) && z > 0) wrong.push(W1(z, 'used 90°')); wrong.push(W1(angs[0], 'gave an angle instead of x')); }
    else { wrong.push(W1(x, 'gave x instead of the angle'), W1(180 - val, 'gave the supplement')); for (const kk of [0, 1, 2]) if (kk !== idx && angs[kk] !== val) wrong.push(W1(angs[kk], 'found a different angle')); }
    wrong.push(...fallbacks(val, W1));
    return makeQ('trisum', {
      level: lvl,
      prompt: `In △ABC, m∠A = ${angExpr(es[0])}, m∠B = ${angExpr(es[1])} and m∠C = ${angExpr(es[2])}. Find ${ask === 'x' ? 'x' : `m∠${ask}`}.`,
      answer: ask === 'x' ? String(x) : `${val}°`,
      ans: ask === 'x' ? { k: 'num', v: Rt(x), names: ['x'], ask: 'x' } : { k: 'num', v: Rt(val), u: 'deg', names: [ask.toLowerCase()], ask: `m∠${ask}` },
      data: { mode: 'x', es, ask }, wrong,
      work: works({
        method: ['The three angles of a triangle add up to 180°: add the expressions and set the total equal to 180.'],
        lines, hintLines: [setup, ['x = ', null]],
        final: [`Check: ${angs[0]}° + ${angs[1]}° + ${angs[2]}° = 180°.`], hint: [ask === 'x' ? 'Combine like terms and solve for x.' : `Solve for x, then substitute into m∠${ask}.`],
      }),
      figure: triSvg(pts, { names: VN, angLabels: es.map((e) => angExpr(e)), toScale: false }),
      figureAlt: `Triangle ABC with angle A labelled ${angExpr(es[0])}, angle B labelled ${angExpr(es[1])} and angle C labelled ${angExpr(es[2])}.`,
      brief: `${setup}, so x = ${x}${ask === 'x' ? '' : ` and m∠${ask} = ${val}°`}.`,
    });
  }
}
function genExterior(lvl) {
  for (;;) {
    const [A, B, C] = randTri(25, 100);
    const ext = A + B;
    const mode = lvl === 1 ? 'ext' : lvl === 2 ? pick(['ext', 'remote', 'remote']) : pick(['x', 'x', 'remote']);
    const pts = triByAngles(A, B);
    const D = add2(pts[2], mul2(sub2(pts[2], pts[1]), 0.6));
    const more = (labelExt) => (F, S) => {
      const Ds = F(D);
      return L(S[2], Ds, 'gm-seg') + arcs(S[2], S[0], Ds, 1, 17, 'gm-hl') + T(inside(S[2], S[0], Ds, 34 + labelExt.length * 1.5), labelExt, { cls: 'gm-lb gm-small' }) + vlabel(Ds, centroid(S), 'D');
    };
    const W1 = numW('deg');
    if (mode !== 'x') {
      const askRemote = mode === 'remote';
      const r = askRemote ? pick([0, 1]) : null;
      const other = r === 0 ? 1 : 0;
      const val = askRemote ? [A, B][r] : ext;
      const prompt = askRemote
        ? `In △ABC, side BC is extended to point D. The exterior angle ∠ACD measures ${ext}° and m∠${VN[other]} = ${[A, B][other]}°. Find m∠${VN[r]}.`
        : `In △ABC, side BC is extended to point D. m∠A = ${A}° and m∠B = ${B}°. Find the exterior angle m∠ACD.`;
      const line = askRemote ? [`m∠${VN[r]} = ${ext}° ${MINUS} ${[A, B][other]}° = `, `${val}°`] : [`m∠ACD = ${A}° + ${B}° = `, `${val}°`];
      const wrong = askRemote
        ? [W1(180 - ext, 'found the interior angle at C'), W1(ext + [A, B][other], 'added instead of subtracting'), ...(180 - ext - [A, B][other] > 0 ? [W1(180 - ext - [A, B][other], 'treated the exterior angle as an interior one')] : []), ...fallbacks(val, W1)]
        : [W1(C, 'gave the interior angle at C (the supplement)'), W1(180 - A, 'used only one remote angle'), W1(360 - ext, 'used 360°'), ...fallbacks(val, W1)];
      const labels = askRemote ? [r === 0 ? '?' : `${A}°`, r === 1 ? '?' : `${B}°`, ''] : [`${A}°`, `${B}°`, ''];
      return makeQ('exterior', {
        level: lvl, prompt, answer: `${val}°`,
        ans: { k: 'num', v: Rt(val), u: 'deg', names: askRemote ? [VN[r].toLowerCase()] : ['acd', 'dca'], ask: askRemote ? `m∠${VN[r]}` : 'm∠ACD' },
        data: { mode, A: askRemote && r === 0 ? null : A, B: askRemote && r === 1 ? null : B, ext: askRemote ? ext : null, find: askRemote ? VN[r] : 'ACD' }, wrong,
        work: works({
          method: ['Exterior Angle Theorem: an exterior angle of a triangle equals the sum of the two remote (non-adjacent) interior angles.', askRemote ? 'So m∠ACD = m∠A + m∠B, and the missing remote angle is the exterior angle minus the other one.' : 'The remote interior angles are ∠A and ∠B.'],
          lines: [line], hintLines: [[line[0], null]],
          final: [`Check: the interior angle at C is ${C}°, and ${C}° + ${ext}° = 180° (a linear pair).`], hint: [askRemote ? 'Subtract the known remote angle from the exterior angle.' : 'Add the two remote interior angles.'],
        }),
        figure: triSvg(pts, { names: VN, angLabels: labels, extraPts: [D], more: more(askRemote ? `${ext}°` : '?') }),
        figureAlt: `Triangle ABC with side BC extended past C to point D, forming exterior angle ACD. ${askRemote ? `The exterior angle is labelled ${ext}°, angle ${VN[other]} is labelled ${[A, B][other]}° and angle ${VN[r]} is marked with a question mark.` : `Angle A is labelled ${A}°, angle B is labelled ${B}° and the exterior angle is marked with a question mark.`}`,
        brief: askRemote ? `${ext}° − ${[A, B][other]}° = ${val}°` : `m∠ACD = ${A}° + ${B}° = ${ext}°`,
      });
    }
    const x = ri(4, 18);
    const e1 = [ri(1, 4), 0], e3 = [ri(1, 5), 0];
    e1[1] = A - e1[0] * x; e3[1] = ext - e3[0] * x;
    const e2 = chance(0.5) ? [0, B] : [ri(1, 3), 0];
    if (e2[0]) e2[1] = B - e2[0] * x;
    if (e1[0] + e2[0] === e3[0] || [e1, e2, e3].some((e) => Math.abs(e[1]) > 50)) continue;
    const ask = pick(['x', 'x', 'ACD', 'A']);
    const setup = `${e1[0] ? `(${lin(e1[0], e1[1])})` : n(e1[1])} + ${e2[0] ? `(${lin(e2[0], e2[1])})` : n(e2[1])} = ${lin(e3[0], e3[1])}`;
    const sol = solveLines(e1[0] + e2[0], e1[1] + e2[1], e3[0], e3[1], ask === 'x', setup);
    if (sol.x.d !== 1 || sol.x.n !== x) continue;
    const val = ask === 'x' ? x : ask === 'A' ? A : ext;
    const lines = [setup, ...sol.lines];
    if (ask !== 'x') lines.push([`m∠${ask} = ${sub1(ask === 'A' ? e1 : e3, x)} = `, `${val}°`]);
    const Wx = ask === 'x' ? (v, why) => ({ str: String(v), val: v, why }) : W1;
    const wrong = [];
    if (ask === 'x') { const y = (180 - e1[1] - e2[1] - e3[1]) / (e1[0] + e2[0] + e3[0]); if (Number.isInteger(y) && y > 0) wrong.push(Wx(y, 'made the three angles add to 180°')); wrong.push(Wx(A, 'gave an angle instead of x')); }
    else wrong.push(Wx(x, 'gave x instead of the angle'), Wx(180 - val, 'gave the supplement'));
    wrong.push(...fallbacks(val, Wx));
    return makeQ('exterior', {
      level: lvl,
      prompt: `In △ABC, side BC is extended to point D. m∠A = ${angExpr(e1)}, m∠B = ${angExpr(e2)} and the exterior angle m∠ACD = ${angExpr(e3)}. Find ${ask === 'x' ? 'x' : `m∠${ask}`}.`,
      answer: ask === 'x' ? String(x) : `${val}°`,
      ans: ask === 'x' ? { k: 'num', v: Rt(x), names: ['x'], ask: 'x' } : { k: 'num', v: Rt(val), u: 'deg', names: ask === 'A' ? ['a'] : ['acd', 'dca'], ask: `m∠${ask}` },
      data: { mode: 'x', e1, e2, e3, ask }, wrong,
      work: works({
        method: ['Exterior Angle Theorem: m∠ACD = m∠A + m∠B. Write that as an equation.'],
        lines, hintLines: [setup, ['x = ', null]],
        final: [`Check: ${A}° + ${B}° = ${ext}°.`], hint: [ask === 'x' ? 'Solve for x.' : `Solve for x, then substitute into m∠${ask}.`],
      }),
      figure: triSvg(pts, { names: VN, angLabels: [angExpr(e1), angExpr(e2), ''], extraPts: [D], more: more(angExpr(e3)), toScale: false }),
      figureAlt: `Triangle ABC with side BC extended past C to point D. Angle A is labelled ${angExpr(e1)}, angle B is labelled ${angExpr(e2)} and exterior angle ACD is labelled ${angExpr(e3)}.`,
      brief: `${setup}, so x = ${x}${ask === 'x' ? '' : ` and m∠${ask} = ${val}°`}.`,
    });
  }
}
function genIsosceles(lvl) {
  for (;;) {
    const mode = lvl === 1 ? pick(['v2b', 'b2v']) : lvl === 2 ? pick(['v2b', 'b2v', 'bx']) : pick(['bx', 'vx', 'vx']);
    let v = 2 * ri(10, 70), b = (180 - v) / 2;
    if (mode === 'b2v') { b = ri(25, 80); v = 180 - 2 * b; }
    // a very flat or very tall triangle is hard to label, so the drawing is kept
    // between 28° and 72° base angles — and then says it is not to scale
    const bDraw = Math.min(72, Math.max(28, b));
    const pts = [[0, Math.tan(bDraw * DEG)], [-1, 0], [1, 0]];
    const W1 = numW('deg');
    const fig = (labels, toScale = true) => triSvg(pts, { names: VN, sideTicks: [0, 1, 1], angLabels: labels, toScale: toScale && bDraw === b });
    if (mode === 'v2b' || mode === 'b2v') {
      const findBase = mode === 'v2b';
      const baseName = pick(['B', 'C']);
      const val = findBase ? b : v;
      const prompt = findBase ? `In △ABC, AB = AC and m∠A = ${v}°. Find m∠${baseName}.` : `In △ABC, AB = AC and m∠${baseName} = ${b}°. Find m∠A.`;
      const lines = findBase ? [`m∠${baseName} = (180° ${MINUS} ${v}°) ÷ 2`, `= ${180 - v}° ÷ 2`, ['= ', `${b}°`]] : [`m∠A = 180° ${MINUS} 2 × ${b}°`, `= 180° ${MINUS} ${2 * b}°`, ['= ', `${v}°`]];
      const wrong = findBase
        ? [W1(180 - v, 'forgot to halve'), W1(v, 'made the base angle equal to the vertex angle'), W1(v / 2, 'halved the vertex angle'), ...fallbacks(b, W1)]
        : [W1(180 - b, 'subtracted only one base angle'), W1(b, 'made all three angles equal'), W1(90 - b, 'used 90°'), ...fallbacks(v, W1)];
      const labels = findBase ? [`${v}°`, baseName === 'B' ? '?' : '', baseName === 'C' ? '?' : ''] : ['?', baseName === 'B' ? `${b}°` : '', baseName === 'C' ? `${b}°` : ''];
      return makeQ('isosceles', {
        level: lvl, prompt, answer: `${val}°`,
        ans: { k: 'num', v: Rt(val), u: 'deg', names: [findBase ? baseName.toLowerCase() : 'a'], ask: findBase ? `m∠${baseName}` : 'm∠A' },
        data: { mode, vertex: findBase ? v : null, base: findBase ? null : b }, wrong,
        work: works({
          method: ['Base Angles Theorem: the angles opposite the congruent sides are congruent, so m∠B = m∠C.', findBase ? 'The two base angles share what is left of 180° after the vertex angle.' : 'Subtract both (equal) base angles from 180°.'],
          lines, hintLines: [lines[0], ['= ', null]],
          final: [`Check: ${v}° + ${b}° + ${b}° = 180°.`], hint: [findBase ? 'Subtract the vertex angle from 180°, then split what is left equally.' : 'Double the base angle and subtract from 180°.'],
        }),
        figure: fig(labels), figureAlt: `Isosceles triangle ABC with vertex A at the top; tick marks show AB and AC are congruent. ${findBase ? `Angle A is labelled ${v}° and angle ${baseName} is marked with a question mark.` : `Angle ${baseName} is labelled ${b}° and angle A is marked with a question mark.`}`,
        brief: findBase ? `(180° − ${v}°) ÷ 2 = ${b}°` : `180° − 2 × ${b}° = ${v}°`,
      });
    }
    const x = ri(4, 20);
    if (mode === 'bx') {
      const e1 = [ri(1, 6), 0], e2 = [ri(1, 6), 0];
      if (e1[0] === e2[0]) continue;
      e1[1] = b - e1[0] * x; e2[1] = b - e2[0] * x;
      if (Math.abs(e1[1]) > 60 || Math.abs(e2[1]) > 60) continue;
      const ask = lvl === 3 ? pick(['x', 'A']) : 'x';
      const setup = `${lin(e1[0], e1[1])} = ${lin(e2[0], e2[1])}`;
      const sol = solveLines(e1[0], e1[1], e2[0], e2[1], ask === 'x', setup);
      if (sol.x.d !== 1 || sol.x.n !== x) continue;
      const lines = [setup, ...sol.lines];
      if (ask === 'A') lines.push(`m∠B = ${sub1(e1, x)} = ${b}°`, [`m∠A = 180° ${MINUS} 2 × ${b}° = `, `${v}°`]);
      const val = ask === 'x' ? x : v;
      const Wx = ask === 'x' ? (vv, why) => ({ str: String(vv), val: vv, why }) : W1;
      const wrong = ask === 'x' ? [Wx(b, 'gave the angle instead of x')] : [Wx(b, 'gave a base angle'), Wx(x, 'gave x')];
      const y = (180 - e1[1] - e2[1]) / (e1[0] + e2[0]);
      if (ask === 'x' && Number.isInteger(y) && y > 0) wrong.push(Wx(y, 'made the base angles add to 180°'));
      wrong.push(...fallbacks(val, Wx));
      return makeQ('isosceles', {
        level: lvl, prompt: `In △ABC, AB = AC, m∠B = ${angExpr(e1)} and m∠C = ${angExpr(e2)}. Find ${ask === 'x' ? 'x' : 'm∠A'}.`,
        answer: ask === 'x' ? String(x) : `${v}°`,
        ans: ask === 'x' ? { k: 'num', v: Rt(x), names: ['x'], ask: 'x' } : { k: 'num', v: Rt(v), u: 'deg', names: ['a'], ask: 'm∠A' },
        data: { mode, e1, e2, ask }, wrong,
        work: works({
          method: ['Base Angles Theorem: AB = AC, so the base angles ∠B and ∠C are congruent. Set their expressions equal.'],
          lines, hintLines: [setup, ['x = ', null]],
          final: [`Check: m∠B = m∠C = ${b}°.`], hint: [ask === 'x' ? 'Solve the equation for x.' : 'Solve for x, find a base angle, then subtract both base angles from 180°.'],
        }),
        figure: fig(['', angExpr(e1), angExpr(e2)], false), figureAlt: `Isosceles triangle ABC with vertex A at the top; tick marks show AB and AC are congruent. Angle B is labelled ${angExpr(e1)} and angle C is labelled ${angExpr(e2)}.`,
        brief: `Base angles are equal: ${setup}, so x = ${x}${ask === 'x' ? '' : ` and m∠A = ${v}°`}.`,
      });
    }
    // vx: vertex and base as expressions
    const e1 = [ri(1, 4), 0], e2 = [ri(1, 3), 0];
    e1[1] = v - e1[0] * x; e2[1] = b - e2[0] * x;
    if (Math.abs(e1[1]) > 60 || Math.abs(e2[1]) > 60) continue;
    const ask = pick(['x', 'A', 'B']);
    const setup = `(${lin(e1[0], e1[1])}) + 2(${lin(e2[0], e2[1])}) = 180`;
    const sol = solveLines(e1[0] + 2 * e2[0], e1[1] + 2 * e2[1], 0, 180, ask === 'x', setup);
    if (sol.x.d !== 1 || sol.x.n !== x) continue;
    const lines = [setup, ...sol.lines];
    if (ask !== 'x') lines.push([`m∠${ask} = ${sub1(ask === 'A' ? e1 : e2, x)} = `, `${ask === 'A' ? v : b}°`]);
    const val = ask === 'x' ? x : ask === 'A' ? v : b;
    const Wx = ask === 'x' ? (vv, why) => ({ str: String(vv), val: vv, why }) : W1;
    const wrong = [];
    if (ask === 'x') { const y = (180 - e1[1] - e2[1]) / (e1[0] + e2[0]); if (Number.isInteger(y) && y > 0) wrong.push(Wx(y, 'counted the base angle only once')); wrong.push(Wx(v, 'gave an angle instead of x')); }
    else wrong.push(Wx(ask === 'A' ? b : v, 'found the other angle'), Wx(x, 'gave x'), Wx(180 - val, 'gave the supplement'));
    wrong.push(...fallbacks(val, Wx));
    return makeQ('isosceles', {
      level: lvl, prompt: `In △ABC, AB = AC, m∠A = ${angExpr(e1)} and m∠B = ${angExpr(e2)}. Find ${ask === 'x' ? 'x' : `m∠${ask}`}.`,
      answer: ask === 'x' ? String(x) : `${val}°`,
      ans: ask === 'x' ? { k: 'num', v: Rt(x), names: ['x'], ask: 'x' } : { k: 'num', v: Rt(val), u: 'deg', names: [ask.toLowerCase()], ask: `m∠${ask}` },
      data: { mode, e1, e2, ask }, wrong,
      work: works({
        method: ['AB = AC, so ∠B ≅ ∠C: the triangle has the vertex angle once and the base angle twice.', 'm∠A + 2 · m∠B = 180°.'],
        lines, hintLines: [setup, ['x = ', null]],
        final: [`Check: ${v}° + ${b}° + ${b}° = 180°.`], hint: [ask === 'x' ? 'Solve for x.' : `Solve for x, then substitute into m∠${ask}.`],
      }),
      figure: fig([angExpr(e1), angExpr(e2), ''], false), figureAlt: `Isosceles triangle ABC with vertex A at the top; tick marks show AB and AC are congruent. Angle A is labelled ${angExpr(e1)} and angle B is labelled ${angExpr(e2)}.`,
      brief: `${setup}, so x = ${x}${ask === 'x' ? '' : ` and m∠${ask} = ${val}°`}.`,
    });
  }
}

/* Congruence shortcuts. Side i is opposite vertex i, so angle i lies between
   sides i+1 and i+2, and side i lies between angles i+1 and i+2. */
function genCongruence(lvl) {
  const pool = lvl === 1 ? ['SSS', 'SAS', 'ASA', 'AAS', 'SSS', 'SAS', 'ASA', 'AAS', 'SSA'] : lvl === 2 ? ['SSS', 'SAS', 'ASA', 'AAS', 'HL', 'SSA', 'AAA'] : ['SAS', 'ASA', 'AAS', 'HL', 'SSA', 'AAA', 'SSA', 'HL'];
  const kase = pick(pool);
  const i = ri(0, 2), j = (i + 1) % 3, k = (i + 2) % 3;
  let sides = [], angles = [], right = null;
  let angs;
  if (kase === 'HL') {
    const a = ri(28, 62);
    angs = [0, 0, 0]; angs[i] = 90; angs[j] = a; angs[k] = 90 - a;
    right = i; sides = [i, pick([j, k])];
  } else {
    for (;;) { angs = randTri(35, 95); if (Math.abs(angs[0] - angs[1]) >= 8 && Math.abs(angs[1] - angs[2]) >= 8 && Math.abs(angs[0] - angs[2]) >= 8) break; }
    if (kase === 'SSS') sides = [0, 1, 2];
    if (kase === 'SAS') { angles = [i]; sides = [j, k]; }
    if (kase === 'ASA') { angles = [j, k]; sides = [i]; }
    if (kase === 'AAS') { angles = [j, k]; sides = [j]; }
    if (kase === 'SSA') { sides = [j, k]; angles = [j]; }
    if (kase === 'AAA') angles = [0, 1, 2];
  }
  const answer = kase === 'SSA' || kase === 'AAA' ? 'Not enough information' : kase;
  const near = {
    SSS: ['SAS', 'HL', 'Not enough information'], SAS: ['SSS', 'ASA', 'Not enough information'], ASA: ['AAS', 'SAS', 'Not enough information'],
    AAS: ['ASA', 'SAS', 'Not enough information'], HL: ['SAS', 'SSS', 'Not enough information'], SSA: ['SAS', 'HL', 'AAS'], AAA: ['ASA', 'AAS', 'SSS'],
  }[kase];
  const options = shuffle([answer, ...near]);
  const tickN = shuffle([1, 2, 3]), arcN = shuffle([1, 2, 3]);
  const sideTicks = [0, 0, 0], arcCount = [0, 0, 0];
  sides.forEach((s, x) => { sideTicks[s] = tickN[x]; });
  angles.forEach((a, x) => { arcCount[a] = arcN[x]; });
  const pts = triByAngles(angs[0], angs[1]);
  const mirror = chance(0.5), flip = chance(0.35);
  const c0 = centroid(pts);
  const t2 = pts.map((p) => { let q = sub2(p, c0); if (mirror) q = [-q[0], q[1]]; if (flip) q = [-q[0], -q[1]]; return q; });
  const spanX = Math.max(...pts.map((p) => p[0])) - Math.min(...pts.map((p) => p[0]));
  const gap = spanX * 0.62 + 0.25;
  const left = pts.map((p) => sub2(p, c0)).map((p) => [p[0] - gap, p[1]]);
  const right2 = t2.map((p) => [p[0] + gap, p[1]]);
  const F = fitter([...left, ...right2], 320, 170, 24);
  const one = (P3, names) => triSvg(P3, { F, names, sideTicks, arcs: arcCount, right, raw: true });
  const figure = svgWrap(320, 170, one(left, ['A', 'B', 'C']) + one(right2, ['D', 'E', 'F']), true);
  const N1 = ['A', 'B', 'C'], N2 = ['D', 'E', 'F'];
  const sideName = (s, N) => `${N[(s + 1) % 3]}${N[(s + 2) % 3]}`.split('').sort().join('');
  const partList = [
    ...sides.map((s) => `${sideName(s, N1)} ≅ ${sideName(s, N2)}`),
    ...(right != null ? [`∠${N1[right]} and ∠${N2[right]} are right angles`] : []),
    ...angles.map((a) => `∠${N1[a]} ≅ ∠${N2[a]}`),
  ];
  const why = {
    SSS: 'Three pairs of congruent sides: SSS.',
    SAS: `∠${N1[i]} is formed by ${sideName(j, N1)} and ${sideName(k, N1)} — the marked angle is between the two marked sides: SAS.`,
    ASA: `${sideName(i, N1)} joins the vertices of the two marked angles (${N1[j]} and ${N1[k]}) — the side is between the angles: ASA.`,
    AAS: `${sideName(j, N1)} is not between ∠${N1[j]} and ∠${N1[k]} (${sideName(i, N1)} is): two angles and a non-included side, AAS.`,
    HL: `Both are right triangles with congruent hypotenuses (${sideName(i, N1)} and ${sideName(i, N2)}, opposite the right angles) and one pair of congruent legs: HL.`,
    SSA: `The marked angle ∠${N1[j]} is not between the two marked sides ${sideName(j, N1)} and ${sideName(k, N1)} (that would be ∠${N1[i]}). Two sides and a non-included angle (SSA) can fit two different triangles, so it proves nothing.`,
    AAA: 'Three pairs of congruent angles give the same shape but not necessarily the same size (AAA proves similarity, not congruence).',
  }[kase];
  const work = (full) => W(
    P(`Marked in both triangles: ${partList.join('; ')}.`),
    full ? P(why) : P('Count the marked sides (tick marks) and angles (arcs, or the right-angle box). Then check the order: is a marked angle between the two marked sides, or a marked side between the two marked angles?'),
    full ? P('Answer: ', boxed(answer)) : aside('SSA and AAA are not congruence shortcuts. HL works only for right triangles.'),
  );
  const alt = [
    ...sides.map((s) => `sides ${sideName(s, N1)} and ${sideName(s, N2)} have ${sideTicks[s]} tick mark${sideTicks[s] > 1 ? 's' : ''} each`),
    ...(right != null ? [`angles ${N1[right]} and ${N2[right]} are marked as right angles`] : []),
    ...angles.map((a) => `angles ${N1[a]} and ${N2[a]} have ${arcCount[a]} arc${arcCount[a] > 1 ? 's' : ''} each`),
  ];
  return makeQ('congruence', {
    level: lvl, type: 'mc', prompt: 'Which congruence shortcut, if any, proves △ABC ≅ △DEF?', answer, options,
    data: { sides, angles, right, kase }, work,
    figure, figureAlt: `Two triangles, ABC and DEF, with matching marks: ${alt.join('; ')}.`,
    brief: why,
  });
}

/* ================================================================ Unit 5 */
function genMidsegment(lvl) {
  for (;;) {
    const pts = [[ri(-3, 3) / 10, 1], [-1, 0], [1, 0]];
    const D = mid2(pts[0], pts[1]), E = mid2(pts[0], pts[2]);
    const more = (de, bc) => (F, S) => {
      const Ds = F(D), Es = F(E), c = centroid(S);
      return L(Ds, Es, 'gm-hl') + DOT(Ds) + DOT(Es) + T(add2(Ds, [-12, 0]), 'D', { a: 'end', cls: 'gm-vx' }) + T(add2(Es, [12, 0]), 'E', { a: 'start', cls: 'gm-vx' })
        + ticks(S[0], Ds, 1) + ticks(Ds, S[1], 1) + ticks(S[0], Es, 2) + ticks(Es, S[2], 2)
        + T(add2(mid2(Ds, Es), [0, -12]), de, { cls: 'gm-lb' }) + slabel(S[1], S[2], c, bc);
    };
    const fig = (de, bc) => triSvg(pts, { names: VN, more: more(de, bc), toScale: false, h: 210 });
    const altOf = (de, bc) => `Triangle ABC with D the midpoint of AB and E the midpoint of AC (tick marks show AD = DB and AE = EC). Segment DE is labelled ${de} and side BC is labelled ${bc}.`;
    if (lvl < 3) {
      const u = pick(['cm', 'in', 'm', 'ft']);
      const findDE = chance(0.6);
      const bc = lvl === 1 ? 2 * ri(3, 20) : ri(7, 45);
      const de = Rt(bc, 2);
      const val = findDE ? de : Rt(bc);
      const W1 = (v, why) => ({ str: withU(n(v), `len:${u}`), val: Number(numStr(v)), why });
      const wrong = findDE ? [W1(2 * bc, 'doubled instead of halving'), W1(bc, 'made DE equal to BC'), W1(Rt(bc, 4), 'halved twice')] : [W1(Rt(bc, 4), 'halved instead of doubling'), W1(de, 'made BC equal to DE'), W1(2 * bc, 'quadrupled')];
      wrong.push(...fallbacks(rnum(val), W1));
      const deS = withU(n(de), `len:${u}`), bcS = withU(n(bc), `len:${u}`);
      const line = findDE ? [`DE = ${n(bc)} ÷ 2 = `, deS] : [`BC = 2 × ${n(de)} = `, bcS];
      return makeQ('midsegment', {
        level: lvl,
        prompt: findDE ? `In △ABC, D is the midpoint of AB and E is the midpoint of AC. BC = ${bcS}. Find DE.` : `In △ABC, D is the midpoint of AB and E is the midpoint of AC. DE = ${deS}. Find BC.`,
        answer: findDE ? deS : bcS,
        ans: { k: 'num', v: val, u: `len:${u}`, names: findDE ? ['de', 'ed'] : ['bc', 'cb'], ask: findDE ? 'DE' : 'BC' },
        data: { mode: findDE ? 'DE' : 'BC', bc: findDE ? bc : null, de: findDE ? null : rnum(de) }, wrong,
        work: works({
          method: ['Triangle Midsegment Theorem: the segment joining the midpoints of two sides is parallel to the third side and half as long.', 'DE = ½ · BC, so BC = 2 · DE.'],
          lines: [line], hintLines: [[line[0], null]],
          final: [], hint: [findDE ? 'Halve BC.' : 'Double DE.'],
        }),
        figure: fig(findDE ? '?' : deS, findDE ? bcS : '?'), figureAlt: altOf(findDE ? 'with a question mark' : deS, findDE ? bcS : 'with a question mark'),
        brief: findDE ? `DE = ½ × ${n(bc)} = ${n(de)}` : `BC = 2 × ${n(de)} = ${bc}`,
      });
    }
    const x = ri(3, 14);
    const e1 = [ri(1, 4), ri(-6, 10)];
    const de = val1(e1, x);
    if (de < 3) continue;
    const a2 = ri(1, 9);
    if (a2 === 2 * e1[0]) continue;
    const e2 = [a2, 2 * de - a2 * x];
    if (Math.abs(e2[1]) > 40) continue;
    const ask = pick(['x', 'DE', 'BC']);
    const setup = `2(${lin(e1[0], e1[1])}) = ${lin(e2[0], e2[1])}`;
    const sol = solveLines(2 * e1[0], 2 * e1[1], e2[0], e2[1], ask === 'x', setup);
    if (sol.x.d !== 1 || sol.x.n !== x) continue;
    const lines = [setup, ...sol.lines];
    const val = ask === 'x' ? x : ask === 'DE' ? de : 2 * de;
    if (ask !== 'x') lines.push([`${ask} = ${sub1(ask === 'DE' ? e1 : e2, x)} = `, String(val)]);
    const W1 = (v, why) => ({ str: String(v), val: v, why });
    const wrong = [];
    if (ask === 'x') { if (e1[0] !== e2[0]) { const y = (e2[1] - e1[1]) / (e1[0] - e2[0]); if (Number.isInteger(y) && y > 0) wrong.push(W1(y, 'set DE equal to BC')); } wrong.push(W1(de, 'gave DE instead of x')); }
    else wrong.push(W1(ask === 'DE' ? 2 * de : de, ask === 'DE' ? 'gave BC' : 'gave DE'), W1(x, 'gave x'));
    wrong.push(...fallbacks(val, W1));
    return makeQ('midsegment', {
      level: lvl,
      prompt: `In △ABC, DE is the midsegment joining the midpoints of AB and AC. DE = ${lin(e1[0], e1[1])} and BC = ${lin(e2[0], e2[1])}. Find ${ask}.`,
      answer: String(val),
      ans: ask === 'x' ? { k: 'num', v: Rt(x), names: ['x'], ask: 'x' } : { k: 'num', v: Rt(val), u: 'len:units', names: ask === 'DE' ? ['de', 'ed'] : ['bc', 'cb'], ask },
      data: { mode: 'x', e1, e2, ask }, wrong,
      work: works({
        method: ['Triangle Midsegment Theorem: BC is twice the midsegment, so BC = 2 · DE.'],
        lines, hintLines: [setup, ['x = ', null]],
        final: [`Check: DE = ${de} and BC = ${2 * de}, twice as long.`], hint: [ask === 'x' ? 'Distribute the 2, then solve for x.' : `Solve for x, then substitute into ${ask}.`],
      }),
      figure: fig(lin(e1[0], e1[1]), lin(e2[0], e2[1])), figureAlt: altOf(lin(e1[0], e1[1]), lin(e2[0], e2[1])),
      brief: `BC = 2 · DE: ${setup}, so x = ${x}${ask === 'x' ? '' : ` and ${ask} = ${val}`}.`,
    });
  }
}
function genInequality(lvl) {
  const tenths = lvl === 3;
  const R = (lo, hi) => (tenths ? ri(lo * 10, hi * 10) : ri(lo, hi));
  const valid = () => { for (;;) { const a = R(2, 14), b = R(2, 14); const lo = Math.abs(a - b) + 1, hi = a + b - 1; if (hi < lo) continue; return [a, b, ri(lo, hi)]; } };
  const invalid = (kind) => {
    for (;;) {
      const a = R(2, 12), b = R(2, 12);
      if (kind === 'flat') return [a, b, a + b];
      if (kind === 'long') return [a, b, a + b + (tenths ? ri(1, 40) : ri(1, 5))];
      const d = Math.abs(a - b);
      if (d >= 2) return [a, b, ri(1, d - 1)];
    }
  };
  const can = lvl === 1 ? true : lvl === 2 ? chance(0.6) : chance(0.5);
  const sets = [];
  const key = (t) => t.slice().sort((x, y) => x - y).join(',');
  const push = (t) => { if (!sets.some((s) => key(s) === key(t))) sets.push(t); };
  if (can) { push(valid()); push(invalid('flat')); while (sets.length < 4) push(invalid(pick(['long', 'short', 'flat']))); }
  else { push(chance(0.6) ? invalid('flat') : invalid(pick(['long', 'short']))); while (sets.length < 4) push(valid()); }
  const u = pick(['cm', 'in', 'ft', 'm']);
  const f = (v) => n(tenths ? Rt(v, 10) : v);
  const show = (t) => (lvl === 3 ? shuffle(t) : t.slice().sort((x, y) => x - y)).map((v) => `${f(v)} ${u}`).join(', ');
  const texts = sets.map(show);
  const answer = texts[0];
  const checks = sets.map((t, i) => {
    const s = t.slice().sort((x, y) => x - y);
    const ok = s[0] + s[1] > s[2];
    return P(`${texts[i]}: ${f(s[0])} + ${f(s[1])} = ${f(s[0] + s[1])}, which is ${ok ? 'greater than' : s[0] + s[1] === s[2] ? 'equal to' : 'less than'} ${f(s[2])} — ${ok ? 'a triangle' : 'not a triangle'}.`);
  });
  const work = (full) => W(
    P('Triangle Inequality Theorem: the two shorter sides must add up to MORE than the longest side. (If they only equal it, the "triangle" is squashed flat.)'),
    ...(full ? checks : []),
    full ? P('So the answer is ', boxed(answer), '.') : aside('For each option, add the two shorter lengths and compare with the longest.'),
  );
  return makeQ('inequality', {
    level: lvl, type: 'mc', prompt: can ? 'Which set of lengths could be the side lengths of a triangle?' : 'Which set of lengths could NOT be the side lengths of a triangle?',
    answer, options: shuffle(texts), data: { can, sets: sets.map((t) => t.map((v) => (tenths ? v / 10 : v))), texts },
    work, brief: `The two shorter sides must add up to more than the longest: ${answer} ${can ? 'works' : 'does not'}.`,
  });
}
function genThirdSide(lvl) {
  const tenths = lvl === 3 && chance(0.6);
  let a, b;
  do { a = tenths ? ri(15, 150) : ri(3, lvl === 1 ? 15 : 30); b = tenths ? ri(15, 150) : ri(3, lvl === 1 ? 15 : 30); } while (a === b);
  const A = tenths ? Rt(a, 10) : Rt(a), B = tenths ? Rt(b, 10) : Rt(b);
  const lo = rnum(A) > rnum(B) ? rsub(A, B) : rsub(B, A), hi = radd(A, B);
  const u = lvl === 1 ? null : pick(['cm', 'in', 'ft', 'm']);
  const answer = `${n(lo)} < x < ${n(hi)}`;
  const big = rnum(A) > rnum(B) ? A : B, small = rnum(A) > rnum(B) ? B : A;
  const R = (l, h, why, inc = 0) => ({ str: inc ? `${n(l)} ≤ x ≤ ${n(h)}` : `${n(l)} < x < ${n(h)}`, val: [rnum(l), rnum(h), inc], why });
  const wrong = [R(lo, hi, 'included the endpoints', 1), R(small, big, 'used the two given sides as the limits'), R(Rt(0), hi, 'forgot the lower limit'), R(lo, big, 'used the longer given side as the upper limit'), R(small, hi, 'used the shorter given side as the lower limit')];
  const side = (r) => (u ? `${n(r)} ${u}` : n(r));
  return makeQ('thirdside', {
    level: lvl,
    prompt: `Two sides of a triangle measure ${side(A)} and ${side(B)}. Write the range of possible lengths x of the third side as a compound inequality.`,
    answer, ans: { k: 'range', lo, hi, u: u ? `len:${u}` : 'len:units' }, placeholder: 'lower < x < upper',
    data: { a: rnum(A), b: rnum(B) }, wrong,
    work: works({
      method: ['Triangle Inequality Theorem: any two sides must add up to more than the third.', 'So the third side is longer than the difference of the other two and shorter than their sum.'],
      lines: [`${n(big)} ${MINUS} ${n(small)} = ${n(lo)}`, `${n(big)} + ${n(small)} = ${n(hi)}`, ['', answer]],
      hintLines: [`${n(big)} ${MINUS} ${n(small)} < x < ${n(big)} + ${n(small)}`],
      final: [`It is strict (<, not ≤): a third side of exactly ${n(lo)} or ${n(hi)} would squash the triangle flat.`], hint: ['Work out the difference and the sum of the two given sides.'],
    }),
    brief: `${n(big)} − ${n(small)} < x < ${n(big)} + ${n(small)}, so ${answer}.`,
  });
}

const SIM_TRIS = [[4, 6, 8], [5, 7, 10], [6, 8, 9], [3, 5, 7], [4, 5, 6], [5, 8, 11], [7, 9, 12], [4, 7, 9], [5, 6, 9], [6, 7, 10], [3, 4, 6], [5, 9, 12]];
/** Two triangles side by side, labelled: t = { pts, sides: [text opposite each vertex], angles: [...] }. */
function twoTriFig(t1, t2, names1 = ['A', 'B', 'C'], names2 = ['D', 'E', 'F']) {
  const c1 = centroid(t1.pts), c2 = centroid(t2.pts);
  const size = (pts) => Math.max(...pts.map((p) => p[0])) - Math.min(...pts.map((p) => p[0])) + Math.max(...pts.map((p) => p[1])) - Math.min(...pts.map((p) => p[1]));
  // the figure is labelled "Not drawn to scale": keep the smaller triangle big enough to label
  const ratio = size(t2.pts) / size(t1.pts), shown = Math.min(1.6, Math.max(1 / 1.6, ratio));
  if (shown !== ratio) t2 = { ...t2, pts: t2.pts.map((p) => add2(c2, mul2(sub2(p, c2), shown / ratio))) };
  const w1 = Math.max(...t1.pts.map((p) => p[0])) - Math.min(...t1.pts.map((p) => p[0]));
  const w2 = Math.max(...t2.pts.map((p) => p[0])) - Math.min(...t2.pts.map((p) => p[0]));
  const gap = (w1 + w2) / 2 + 0.35 * Math.max(w1, w2);
  const P1 = t1.pts.map((p) => sub2(p, c1)), P2 = t2.pts.map((p) => add2(sub2(p, c2), [gap, 0]));
  const F = fitter([...P1, ...P2], 330, 190, 30);
  const one = (P3, t, names) => triSvg(P3, { F, names, sideLabels: t.sides || [], angLabels: t.angles || [], raw: true, arcs: (t.angles || []).map((a) => (a ? 1 : 0)) });
  return svgWrap(330, 190, one(P1, t1, names1) + one(P2, t2, names2), false);
}
function genSimilar(lvl) {
  for (;;) {
    const ks = lvl === 1 ? [[2, 1], [3, 1], [1, 2], [4, 1]] : [[3, 2], [5, 2], [2, 3], [4, 3], [5, 4], [2, 1], [3, 1], [1, 2]];
    const [p, q] = pick(ks);
    const base = pick(SIM_TRIS);
    const s1 = base.map((x) => x * q), s2 = base.map((x) => x * p);
    const ord = shuffle([0, 1, 2]);
    const S1 = ord.map((i) => s1[i]), S2 = ord.map((i) => s2[i]);   // sides opposite A/D, B/E, C/F
    if (Math.max(...S2) > 60 || Math.max(...S1) > 60) continue;
    const mode = lvl === 3 ? pick(['side', 'x', 'x']) : pick(['k', 'side', 'side']);
    const SN1 = ['BC', 'CA', 'AB'], SN2 = ['EF', 'FD', 'DE'];
    const kn = ri(0, 2);
    let un = ri(0, 2); if (un === kn) un = (kn + 1) % 3;
    const pts1 = triBySides(S1[0], S1[1], S1[2]), pts2 = triBySides(S2[0], S2[1], S2[2]);
    const W1 = (v, why) => ({ str: numStr(v), val: Number(numStr(v)), why });
    const kR = Rt(S2[kn], S1[kn]);
    if (mode === 'k') {
      const answer = mm(fstr(kR));
      const wrong = [
        { str: fstr(Rt(S1[kn], S2[kn])), val: S1[kn] / S2[kn], why: 'divided the wrong way (from DEF to ABC)' },
        { str: String(S2[kn] - S1[kn]), val: S2[kn] - S1[kn], why: 'subtracted instead of dividing' },
        { str: fstr(Rt(S2[un], S1[kn])), val: S2[un] / S1[kn], why: 'compared sides that do not correspond' },
        { str: fstr(radd(kR, Rt(1))), val: rnum(kR) + 1, why: 'arithmetic slip' },
      ];
      return makeQ('similar', {
        level: lvl, prompt: `△ABC ~ △DEF, with ${SN1[kn]} = ${S1[kn]} and ${SN2[kn]} = ${S2[kn]}. What is the scale factor from △ABC to △DEF? Give it as a fraction or a whole number.`,
        answer, ans: { k: 'num', v: kR, names: ['k', 'scalefactor'], ask: 'the scale factor', ratio: true }, placeholder: 'A fraction or whole number',
        data: { mode, s1: S1, s2: S2, kn }, wrong,
        work: works({
          method: ['The scale factor from △ABC to △DEF is (a side of DEF) ÷ (the matching side of ABC).'],
          lines: [[`${SN2[kn]} ÷ ${SN1[kn]} = ${S2[kn]} ÷ ${S1[kn]} = `, answer]], hintLines: [[`${SN2[kn]} ÷ ${SN1[kn]} = `, null]],
          final: [`Every side of △DEF is ${answer} times the matching side of △ABC — check: ${S1[un]} × ${answer} = ${S2[un]}.`], hint: ['New ÷ original: divide a side of the image triangle by the matching side of the original.'],
        }),
        figure: twoTriFig({ pts: pts1, sides: S1.map(String) }, { pts: pts2, sides: S2.map(String) }),
        figureAlt: `Similar triangles ABC and DEF with all six side lengths labelled: BC ${S1[0]}, CA ${S1[1]}, AB ${S1[2]}; EF ${S2[0]}, FD ${S2[1]}, DE ${S2[2]}.`,
        brief: `${SN2[kn]} ÷ ${SN1[kn]} = ${S2[kn]} ÷ ${S1[kn]} = ${answer}`,
      });
    }
    const findBig = chance(0.6);
    const target = findBig ? S2[un] : S1[un];
    const ratioStr = findBig ? `${S2[kn]} ÷ ${S1[kn]}` : `${S1[kn]} ÷ ${S2[kn]}`;
    const from = findBig ? S1[un] : S2[un];
    let prompt, lines, hintLines, e = null, x = null, ask = findBig ? SN2[un] : SN1[un];
    const labels1 = S1.map(String), labels2 = S2.map(String);
    labels1[3 - kn - un] = ''; labels2[3 - kn - un] = '';
    const nm = ask;
    const givenOther = findBig ? `${SN1[un]} = ${S1[un]}` : `${SN2[un]} = ${S2[un]}`;
    if (mode === 'side') {
      (findBig ? labels2 : labels1)[un] = '?';
      prompt = `△ABC ~ △DEF. ${SN1[kn]} = ${S1[kn]}, ${SN2[kn]} = ${S2[kn]} and ${givenOther}. Find ${ask}.`;
      const setup = `${ask} ÷ ${from} = ${ratioStr}`;
      lines = [setup, [`${ask} = ${from} × ${ratioStr} = `, String(target)]];
      hintLines = [setup, [`${ask} = `, null]];
    } else {
      x = ri(2, 12); const a = ri(1, 4); e = [a, target - a * x];
      if (Math.abs(e[1]) > 30 || (a === 1 && e[1] === 0)) continue;
      ask = 'x';
      const lx = lin(e[0], e[1]);
      (findBig ? labels2 : labels1)[un] = lx;
      prompt = `△ABC ~ △DEF. ${SN1[kn]} = ${S1[kn]}, ${SN2[kn]} = ${S2[kn]}, ${givenOther} and ${nm} = ${lx}. Find x.`;
      const sol = solveLines(e[0], e[1], 0, target, true, `${lx} = ${target}`);
      lines = [`${nm} = ${from} × ${ratioStr} = ${target}`, `${lx} = ${target}`, ...sol.lines];
      hintLines = [[`${nm} = ${from} × ${ratioStr} = `, null], ['x = ', null]];
    }
    const val = mode === 'x' ? x : target;
    const wrong = [];
    if (mode === 'x') wrong.push(W1(target, 'gave the side length instead of x'), ...fallbacks(x, W1));
    else {
      const upside = from * (findBig ? S1[kn] / S2[kn] : S2[kn] / S1[kn]);
      if (Math.abs(upside * 10 - Math.round(upside * 10)) < 1e-9) wrong.push(W1(Math.round(upside * 10) / 10, 'used the scale factor upside down'));
      const added = from + (findBig ? S2[kn] - S1[kn] : S1[kn] - S2[kn]);
      if (added > 0) wrong.push(W1(added, 'added the difference instead of multiplying'));
      wrong.push(W1(from, 'kept the side the same'), ...fallbacks(target, W1));
    }
    const named = (lab, SN) => lab.map((t, i) => (t ? `${SN[i]} ${t === '?' ? 'with a question mark' : t}` : '')).filter(Boolean);
    return makeQ('similar', {
      level: lvl, prompt, answer: String(val),
      ans: mode === 'x' ? { k: 'num', v: Rt(x), names: ['x'], ask: 'x' } : { k: 'num', v: Rt(target), u: 'len:units', names: [ask.toLowerCase(), ask.toLowerCase().split('').reverse().join('')], ask },
      data: { mode, s1: S1, s2: S2, kn, un, findBig, e }, wrong,
      work: works({
        method: ['Corresponding sides of similar triangles are proportional: the unknown side divided by its partner equals any other matching pair, in the same order.'],
        lines, hintLines,
        final: [`Check: the scale factor from △ABC to △DEF is ${mm(fstr(kR))}.`], hint: [mode === 'x' ? 'Find the length of the side first, then solve for x.' : 'Multiply both sides by the known partner side.'],
      }),
      figure: twoTriFig({ pts: pts1, sides: labels1 }, { pts: pts2, sides: labels2 }),
      figureAlt: `Similar triangles ABC and DEF. Labelled sides: ${[...named(labels1, SN1), ...named(labels2, SN2)].join(', ')}.`,
      brief: `Scale factor ${mm(fstr(kR))}: ${mode === 'x' ? `the side is ${target}, so x = ${x}` : `${ask} = ${target}`}.`,
    });
  }
}
const SIM_OPTS = ['AA', 'SSS', 'SAS', 'Not similar'];
/** Are two triangles (vertex lists) similar under any matching of their vertices? */
function similarShapes(p1, p2) {
  const sides = (p) => [0, 1, 2].map((i) => len2(sub2(p[i], p[(i + 1) % 3]))).sort((a, b) => a - b);
  const a = sides(p1), b = sides(p2), k = b[0] / a[0];
  return a.every((x, i) => Math.abs(b[i] / x - k) < 1e-6 * k);
}
function genSimCrit(lvl) {
  for (;;) {
    const q = simCritTry(lvl);
    if (q) return q;
  }
}
function simCritTry(lvl) {
  const kase = pick(lvl === 1 ? ['AA', 'SSS', 'SAS', 'AA', 'NO'] : ['AA', 'SSS', 'SAS', 'NO', 'NO']);
  const k = pick([[3, 2], [2, 1], [5, 2], [1, 2], [3, 1]]);
  const kR = Rt(k[0], k[1]);
  let t1, t2, answer, why, data;
  const lines = [];
  const noKind = kase === 'NO' ? pick(['SSS', 'AA', 'SAS']) : null;
  const q = k[1];
  if (kase === 'AA' || noKind === 'AA') {
    const [A, B] = randTri(30, 100);
    const third = lvl === 3 && chance(0.6);
    let B2 = B;
    if (noKind === 'AA') B2 = B + pick([-1, 1]) * ri(5, 12);
    const C2 = 180 - A - B2;
    const pts1 = triByAngles(A, B), pts2 = triByAngles(A, B2).map((p) => mul2(p, rnum(kR)));
    t1 = { pts: pts1, angles: [`${A}°`, `${B}°`, ''] };
    t2 = { pts: pts2, angles: third ? [`${A}°`, '', `${C2}°`] : [`${A}°`, `${B2}°`, ''] };
    data = { t1: { angles: [A, B, null] }, t2: { angles: third ? [A, null, C2] : [A, B2, null] } };
    if (third) lines.push(`m∠E = 180° ${MINUS} ${A}° ${MINUS} ${C2}° = ${B2}°`);
    why = noKind ? `∠B = ${B}° but ∠E = ${B2}°: the angles do not match, so the triangles are not similar.` : `∠A ≅ ∠D (${A}°) and ∠B ≅ ∠E (${B}°): two pairs of congruent angles.`;
    answer = noKind ? 'Not similar' : 'AA';
  } else if (kase === 'SSS' || noKind === 'SSS') {
    const base = pick(SIM_TRIS).map((x) => x * q);
    const s2 = base.map((x) => (x * k[0]) / k[1]);
    if (noKind) { const i = s2.indexOf(Math.min(...s2)); s2[i] += pick([1, 2]); }
    t1 = { pts: triBySides(...base), sides: base.map(String) }; t2 = { pts: triBySides(...s2), sides: s2.map(String) };
    data = { t1: { sides: base }, t2: { sides: s2 } };
    const sorted1 = base.slice().sort((a, b) => a - b), sorted2 = s2.slice().sort((a, b) => a - b);
    for (let i = 0; i < 3; i++) {
      const r = Rt(sorted2[i], sorted1[i]);
      lines.push(terminates(r) ? `${sorted2[i]} ÷ ${sorted1[i]} = ${mm(rstr(r))}` : `${sorted2[i]} ÷ ${sorted1[i]} ≈ ${roundStr(rnum(r), 3)}`);
    }
    why = noKind ? 'The ratios of matching sides (shortest to shortest, and so on) are not all equal, so the triangles are not similar.' : `All three ratios equal ${mm(rstr(kR))}: the sides are proportional.`;
    answer = noKind ? 'Not similar' : 'SSS';
  } else {
    const base = pick(SIM_TRIS).map((x) => x * q);
    const ang = ri(35, 110);
    const a = base[0], b = base[1];
    const a2 = (a * k[0]) / k[1];
    let b2 = (b * k[0]) / k[1], ang2 = ang;
    if (noKind) { if (chance(0.5)) ang2 = ang + pick([-1, 1]) * ri(8, 20); else b2 += pick([1, 2]); }
    // the angle at C is between CB = a and CA = b
    const tri = (sa, sb, g) => [mul2(dir(g), sb), [sa, 0], [0, 0]];
    t1 = { pts: tri(a, b, ang), sides: [String(a), String(b), ''], angles: ['', '', `${ang}°`] };
    t2 = { pts: tri(a2, b2, ang2), sides: [String(a2), String(b2), ''], angles: ['', '', `${ang2}°`] };
    data = { t1: { sides: [a, b, null], angles: [null, null, ang] }, t2: { sides: [a2, b2, null], angles: [null, null, ang2] } };
    for (const [x2, x1] of [[a2, a], [b2, b]]) {
      const r = Rt(x2, x1);
      lines.push(terminates(r) ? `${x2} ÷ ${x1} = ${mm(rstr(r))}` : `${x2} ÷ ${x1} ≈ ${roundStr(rnum(r), 3)}`);
    }
    why = noKind ? (ang2 !== ang ? `The sides are in proportion, but the included angles differ (${ang}° and ${ang2}°): not similar.` : 'The included angles match, but the two pairs of sides are not in the same ratio: not similar.')
      : `The two pairs of sides are in the same ratio and the angles between them are congruent (${ang}°).`;
    answer = noKind ? 'Not similar' : 'SAS';
  }
  // a "not similar" pair must not be similar under some other matching of the vertices
  // (A 75°, B 55° against D 75°, E 50° has C = 50° and F = 55°: △ABC ~ △DFE)
  if (noKind && similarShapes(t1.pts, t2.pts)) return null;
  const work = (full) => W(
    P('AA: two pairs of congruent angles. SSS: all three pairs of sides in the same ratio. SAS: two pairs of sides in the same ratio with the angles between them congruent.'),
    full && lines.length ? eqs(lines) : null,
    full ? P(why) : aside('Work out what the figure gives you — angles, or side ratios (the larger triangle\'s side ÷ the matching side) — and whether they all agree.'),
    full ? P('Answer: ', boxed(answer)) : null,
  );
  const describe = (t, N) => [
    ...(t.sides || []).map((s, i) => (s ? `side ${N[(i + 1) % 3]}${N[(i + 2) % 3]} ${s}` : '')),
    ...(t.angles || []).map((a, i) => (a ? `angle ${N[i]} ${a}` : '')),
  ].filter(Boolean).join(', ');
  return makeQ('simcrit', {
    level: lvl, type: 'mc', prompt: 'Which similarity shortcut, if any, proves △ABC ~ △DEF?', answer, options: SIM_OPTS.slice(),
    data: { kase: kase === 'NO' ? `not-${noKind}` : kase, ...data }, work,
    figure: twoTriFig(t1, t2), figureAlt: `Triangles ABC and DEF. Triangle ABC: ${describe(t1, ['A', 'B', 'C'])}. Triangle DEF: ${describe(t2, ['D', 'E', 'F'])}.`,
    brief: why,
  });
}

/* ================================================================ Unit 6 */
const LUNITS = ['cm', 'in', 'ft', 'm'];
/** A right triangle ABC with the right angle at C: BC = a (opposite A), AC = b, AB = c. */
function rightTri(a, b, o = {}) {
  const pts = [[0, b], [a, 0], [0, 0]];
  const m = o.mirror ? pts.map((p) => [-p[0], p[1]]) : pts;
  return triSvg(m, { names: VN, right: 2, sideLabels: o.sides || [], angLabels: o.angles || [], arcs: o.arcs || [], toScale: o.toScale !== false, more: o.more });
}
const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41]];
function genPythag(lvl) {
  for (;;) {
    const u = pick(LUNITS);
    const findHyp = chance(0.55);
    let a, b, c, c2;
    const triple = lvl === 1 || (lvl === 2 && chance(0.45)) || (lvl === 3 && chance(0.25));
    if (triple) {
      const t = pick(TRIPLES.slice(0, lvl === 1 ? 3 : 6));
      const k = ri(1, Math.max(1, Math.floor(60 / t[2])));
      [a, b] = shuffle([t[0] * k, t[1] * k]); c = t[2] * k; c2 = c * c;
    } else if (findHyp) {
      a = ri(2, lvl === 2 ? 15 : 30); b = ri(2, lvl === 2 ? 15 : 30); c2 = a * a + b * b; c = Math.sqrt(c2);
      if (isSquare(c2)) continue;
    } else {
      a = ri(2, lvl === 2 ? 15 : 30); c = ri(a + 1, a + 12); c2 = c * c;
      if (isSquare(c2 - a * a)) continue;
      b = Math.sqrt(c2 - a * a);
    }
    const want2 = findHyp ? c2 : c2 - a * a;
    const want = Math.sqrt(want2);
    const exact = isSquare(want2);
    if (!exact && nearTie(want, 1)) continue;
    const ansS = exact ? String(want) : roundStr(want, 1);
    const answer = `${ansS} ${u}`;
    const lines = findHyp
      ? [`c² = ${a}² + ${b}²`, `= ${a * a} + ${b * b}`, `= ${c2}`, `c = √${c2}`, ...(exact ? [['= ', answer]] : [`≈ ${more(want, 1)}`, ['≈ ', answer]])]
      : [`b² = ${c}² ${MINUS} ${a}²`, `= ${c2} ${MINUS} ${a * a}`, `= ${want2}`, `b = √${want2}`, ...(exact ? [['= ', answer]] : [`≈ ${more(want, 1)}`, ['≈ ', answer]])];
    const W1 = (v, why) => ({ str: `${numStr(v)} ${u}`, val: Number(numStr(v)), why });
    const r1 = (v) => (Number.isInteger(v) ? v : Number(roundStr(v, 1)));
    const wrong = findHyp
      ? [W1(a + b, 'added the legs'), W1(c2, 'forgot the square root'), ...(a !== b ? [W1(r1(Math.sqrt(Math.abs(a * a - b * b))), 'subtracted instead of adding')] : [])]
      : [W1(r1(Math.sqrt(c2 + a * a)), 'added the squares (only the hypotenuse is on its own)'), W1(c - a, 'subtracted the sides'), W1(want2, 'forgot the square root')];
    if (!exact) { const tr = Math.floor(want * 10) / 10; if (roundStr(tr, 1) !== ansS) wrong.push(W1(Number(roundStr(tr, 1)), 'cut off instead of rounding')); }
    wrong.push(...fallbacks(Number(ansS), W1));
    const sides = findHyp ? [`${a} ${u}`, `${b} ${u}`, 'c'] : [`${a} ${u}`, 'b', `${c} ${u}`];
    return makeQ('pythag', {
      level: lvl,
      prompt: findHyp ? `A right triangle has legs of ${a} ${u} and ${b} ${u}. Find the length of the hypotenuse. Round to the nearest tenth if necessary.`
        : `A right triangle has a hypotenuse of ${c} ${u} and one leg of ${a} ${u}. Find the length of the other leg. Round to the nearest tenth if necessary.`,
      answer,
      ans: exact ? { k: 'num', v: Rt(want), u: `len:${u}`, names: findHyp ? ['c', 'ab', 'ba'] : ['b', 'ac', 'ca'], ask: findHyp ? 'c' : 'b' } : { k: 'round', v: want, dp: 1, u: `len:${u}`, names: findHyp ? ['c', 'ab', 'ba'] : ['b', 'ac', 'ca'], ask: findHyp ? 'c' : 'b', rad2: want2 },
      data: { findHyp, known: findHyp ? [a, b] : [a, c] }, wrong,
      work: works({
        method: ['Pythagorean theorem: leg² + leg² = hypotenuse², a² + b² = c².', findHyp ? 'The hypotenuse is the unknown, so add the squares of the legs.' : 'A leg is the unknown, so subtract: b² = c² − a².'],
        lines, hintLines: [lines[0], [findHyp ? 'c = ' : 'b = ', null]],
        final: [exact ? 'These numbers make a Pythagorean triple, so the answer is exact.' : `Round ${more(want, 1)}… to the nearest tenth.`], hint: ['Square, add or subtract, then take the square root.'],
      }),
      figure: rightTri(a, b, { sides, mirror: chance(0.5) }),
      figureAlt: `Right triangle ABC with the right angle at C. ${findHyp ? `Legs BC = ${a} ${u} and AC = ${b} ${u}; hypotenuse AB is labelled c.` : `Leg BC = ${a} ${u} and hypotenuse AB = ${c} ${u}; leg AC is labelled b.`}`,
      brief: findHyp ? `c = √(${a}² + ${b}²) = √${c2} ${exact ? '=' : '≈'} ${ansS}` : `b = √(${c}² − ${a}²) = √${want2} ${exact ? '=' : '≈'} ${ansS}`,
    });
  }
}
const CLASS_OPTS = ['Right', 'Acute', 'Obtuse', 'Not a triangle'];
/** Three lengths as segments drawn to scale — neutral: it does not give away the triangle's shape. */
function barsFig(lens) {
  const w = 300, top = 26, gap = 34, max = Math.max(...lens), k = 230 / max;
  let s = '';
  lens.forEach((v, i) => {
    const y = top + i * gap;
    s += L([20, y], [20 + v * k, y], 'gm-hl') + L([20, y - 6], [20, y + 6], 'gm-seg') + L([20 + v * k, y - 6], [20 + v * k, y + 6], 'gm-seg');
    s += T([20 + v * k + 8, y], String(v), { a: 'start', cls: 'gm-lb' });
  });
  return svgWrap(w, top + 2 * gap + 22, s, true);
}
function genClassify(lvl) {
  const kind = pick(lvl === 1 ? ['Right', 'Acute', 'Obtuse'] : ['Right', 'Acute', 'Obtuse', 'Not a triangle']);
  let s;
  for (;;) {
    if (kind === 'Right') { const t = pick(TRIPLES.slice(0, 4)); const k = ri(1, t[2] > 13 ? 1 : 3); s = t.map((x) => x * k); break; }
    const a = ri(3, 20), b = ri(a, 22);
    const c = kind === 'Not a triangle' ? a + b + (chance(0.4) ? 0 : ri(1, 4)) : ri(b, a + b - 1);
    const d = c * c - (a * a + b * b);
    if (kind === 'Acute' && d < 0) { s = [a, b, c]; break; }
    if (kind === 'Obtuse' && d > 0) { s = [a, b, c]; break; }
    if (kind === 'Not a triangle') { s = [a, b, c]; break; }
  }
  const [a, b, c] = s;
  const shown = shuffle(s);
  const lhs = c * c, rhs = a * a + b * b;
  const tri = a + b > c;
  const verdict = !tri ? `${a} + ${b} = ${a + b} is not more than ${c}, so these lengths do not make a triangle at all.` : lhs === rhs ? `${lhs} = ${rhs}: c² = a² + b², so the triangle is right.` : lhs < rhs ? `${lhs} < ${rhs}: c² < a² + b², so the triangle is acute.` : `${lhs} > ${rhs}: c² > a² + b², so the triangle is obtuse.`;
  const work = (full) => W(
    P('First check it is a triangle: the two shorter sides must add up to more than the longest. Then let c be the longest side and compare c² with a² + b²: equal → right, less → acute, greater → obtuse.'),
    full ? eqs([`${a} + ${b} = ${a + b}`, `${c}² = ${lhs}`, `${a}² + ${b}² = ${a * a} + ${b * b} = ${rhs}`]) : aside(`The longest side here is ${c}.`),
    full ? P(verdict) : null,
    full ? P('Answer: ', boxed(kind)) : null,
  );
  return makeQ('classify', {
    level: lvl, type: 'mc', prompt: `A triangle has side lengths ${shown.join(', ')}. Is it right, acute or obtuse?${lvl > 1 ? ' (Or can these lengths not form a triangle at all?)' : ''}`,
    answer: kind, options: CLASS_OPTS.slice(), data: { sides: shown }, work,
    figure: barsFig(shown), figureAlt: `Three segments drawn to scale, of lengths ${shown.join(', ')}.`,
    brief: verdict,
  });
}
function genSpecial(lvl) {
  const u = pick(LUNITS);
  const fam = pick(['45', '30']);
  const s = ri(2, 12);
  let kind, prompt, ans, answer, lines, sides, method, wrong, figAngles;
  const Wr = (a, b, why) => ({ str: `${radStr(a, b)} ${u}`, val: a * Math.sqrt(b), why });
  const Wn = (v, why) => ({ str: `${numStr(v)} ${u}`, val: v, why });
  if (fam === '45') {
    kind = pick(lvl === 1 ? ['leg2hyp', 'hyp2leg'] : ['leg2hyp', 'hyp2leg', 'hypInt2leg']);
    method = '45°-45°-90° triangle: the legs are equal and the hypotenuse is leg × √2.';
    figAngles = ['45°', '45°', ''];
    if (kind === 'leg2hyp') {
      prompt = `In a 45°-45°-90° triangle, each leg is ${s} ${u} long. Find the length of the hypotenuse.`;
      ans = { k: 'rad', a: s, b: 2 }; answer = `${radStr(s, 2)} ${u}`;
      lines = ['hypotenuse = leg × √2', `= ${s} × √2`, ['= ', answer]];
      sides = [`${s} ${u}`, `${s} ${u}`, 'x'];
      wrong = [Wn(2 * s, 'doubled the leg (that is the 30°-60°-90° rule)'), Wr(s, 3, 'used √3 instead of √2'), Wn(s, 'made the hypotenuse equal to a leg'), Wr(2 * s, 2, 'doubled as well')];
    } else if (kind === 'hyp2leg') {
      prompt = `In a 45°-45°-90° triangle, the hypotenuse is ${radStr(s, 2)} ${u} long. Find the length of each leg.`;
      ans = { k: 'num', v: Rt(s) }; answer = `${s} ${u}`;
      lines = ['leg = hypotenuse ÷ √2', `= ${radStr(s, 2)} ÷ √2`, ['= ', answer]];
      sides = ['x', 'x', `${radStr(s, 2)} ${u}`];
      wrong = [Wn(2 * s, 'multiplied by √2 instead of dividing'), Wr(s, 2, 'kept the hypotenuse'), Wr(s, 3, 'used √3'), Wn(s + 1, 'arithmetic slip')];
    } else {
      const h = 2 * s;
      prompt = `In a 45°-45°-90° triangle, the hypotenuse is ${h} ${u} long. Find the length of each leg.`;
      ans = { k: 'rad', a: s, b: 2 }; answer = `${radStr(s, 2)} ${u}`;
      lines = ['leg = hypotenuse ÷ √2', `= ${h} ÷ √2`, `= ${h}√2 ÷ 2`, ['= ', answer]];
      sides = ['x', 'x', `${h} ${u}`];
      wrong = [Wr(h, 2, 'multiplied by √2 instead of dividing'), Wn(s, 'halved the hypotenuse and dropped the √2'), Wr(s, 3, 'used √3'), Wn(h, 'kept the hypotenuse')];
    }
  } else {
    kind = pick(lvl === 1 ? ['short2long', 'short2hyp', 'hyp2short'] : lvl === 2 ? ['short2long', 'short2hyp', 'hyp2short', 'hyp2long', 'long2short'] : ['hyp2long', 'long2short', 'long2hyp', 'longInt2short', 'longInt2hyp']);
    method = '30°-60°-90° triangle: short leg x (opposite 30°), long leg x√3 (opposite 60°), hypotenuse 2x (opposite 90°).';
    figAngles = ['30°', '60°', ''];
    const L3 = `${radStr(s, 3)} ${u}`, Ls = `${s} ${u}`, Hs = `${2 * s} ${u}`, Lg = 3 * s;
    const map = {
      short2long: [`the shorter leg is ${Ls} long. Find the length of the longer leg.`, { k: 'rad', a: s, b: 3 }, L3, ['long leg = short leg × √3', `= ${s} × √3`, ['= ', L3]], [Ls, 'x', ''], [Wn(2 * s, 'used the hypotenuse rule'), Wr(s, 2, 'used √2 instead of √3'), Wn(s, 'made the legs equal'), Wr(2 * s, 3, 'doubled as well')]],
      short2hyp: [`the shorter leg is ${Ls} long. Find the length of the hypotenuse.`, { k: 'num', v: Rt(2 * s) }, Hs, ['hypotenuse = 2 × short leg', [`= 2 × ${s} = `, Hs]], [Ls, '', 'x'], [Wr(s, 3, 'used the long-leg rule'), Wr(s, 2, 'used the 45°-45°-90° rule'), Wn(s, 'kept the short leg'), Wn(3 * s, 'tripled instead of doubling')]],
      hyp2short: [`the hypotenuse is ${Hs} long. Find the length of the shorter leg.`, { k: 'num', v: Rt(s) }, Ls, ['short leg = hypotenuse ÷ 2', [`= ${2 * s} ÷ 2 = `, Ls]], ['x', '', Hs], [Wn(4 * s, 'doubled instead of halving'), Wr(s, 3, 'found the long leg'), Wr(2 * s, 3, 'multiplied by √3'), Wn(s + 1, 'arithmetic slip')]],
      hyp2long: [`the hypotenuse is ${Hs} long. Find the length of the longer leg.`, { k: 'rad', a: s, b: 3 }, L3, [`short leg = ${2 * s} ÷ 2 = ${s}`, 'long leg = short leg × √3', `= ${s} × √3`, ['= ', L3]], ['', 'x', Hs], [Wn(s, 'stopped at the short leg'), Wr(2 * s, 3, 'multiplied the hypotenuse by √3'), Wr(s, 2, 'used √2'), Wn(2 * s, 'kept the hypotenuse')]],
      long2short: [`the longer leg is ${L3} long. Find the length of the shorter leg.`, { k: 'num', v: Rt(s) }, Ls, ['short leg = long leg ÷ √3', `= ${radStr(s, 3)} ÷ √3`, ['= ', Ls]], ['x', L3, ''], [Wn(3 * s, 'multiplied by √3 instead of dividing'), Wn(2 * s, 'found the hypotenuse'), Wr(s, 2, 'used √2'), Wn(s + 1, 'arithmetic slip')]],
      long2hyp: [`the longer leg is ${L3} long. Find the length of the hypotenuse.`, { k: 'num', v: Rt(2 * s) }, Hs, [`short leg = ${radStr(s, 3)} ÷ √3 = ${s}`, 'hypotenuse = 2 × short leg', [`= 2 × ${s} = `, Hs]], ['', L3, 'x'], [Wr(2 * s, 3, 'doubled the long leg'), Wn(s, 'stopped at the short leg'), Wr(s, 2, 'used √2'), Wn(3 * s, 'arithmetic slip')]],
      longInt2short: [`the longer leg is ${Lg} ${u} long. Find the length of the shorter leg.`, { k: 'rad', a: s, b: 3 }, L3, ['short leg = long leg ÷ √3', `= ${Lg} ÷ √3`, `= ${Lg}√3 ÷ 3`, ['= ', L3]], ['x', `${Lg} ${u}`, ''], [Wr(Lg, 3, 'multiplied by √3 instead of dividing'), Wn(s, 'divided by 3 and dropped the √3'), Wr(2 * s, 3, 'found the hypotenuse'), Wn(Lg / 2, 'halved the long leg')]],
      longInt2hyp: [`the longer leg is ${Lg} ${u} long. Find the length of the hypotenuse.`, { k: 'rad', a: 2 * s, b: 3 }, `${radStr(2 * s, 3)} ${u}`, [`short leg = ${Lg} ÷ √3 = ${Lg}√3 ÷ 3 = ${radStr(s, 3)}`, 'hypotenuse = 2 × short leg', `= 2 × ${radStr(s, 3)}`, ['= ', `${radStr(2 * s, 3)} ${u}`]], ['', `${Lg} ${u}`, 'x'], [Wn(2 * Lg, 'doubled the long leg'), Wr(s, 3, 'stopped at the short leg'), Wn(2 * s, 'dropped the √3'), Wr(Lg, 3, 'multiplied by √3')]],
    };
    const m = map[kind];
    prompt = `In a 30°-60°-90° triangle, ${m[0]}`;
    ans = m[1]; answer = m[2]; lines = m[3]; sides = m[4]; wrong = m[5];
  }
  ans.u = `len:${u}`;
  ans.names = ['x']; ans.ask = 'the length';
  prompt += ' Give the exact answer, in simplest radical form if needed.';
  const figPts = fam === '45' ? [[0, 1], [1, 0], [0, 0]] : [[0, Math.sqrt(3)], [1, 0], [0, 0]];
  const val = ans.k === 'rad' ? ans.a * Math.sqrt(ans.b) : rnum(ans.v);
  wrong = wrong.filter((w) => Math.abs(w.val - val) > 1e-9);
  return makeQ('special', {
    level: lvl, prompt, answer, ans, data: { fam, kind, s },
    wrong,
    work: works({ method: [method], lines, hintLines: [lines[0], ['x = ', null]], final: [], hint: ['Use the side ratio, then simplify the radical.'] }),
    figure: triSvg(figPts, { names: VN, right: 2, angLabels: figAngles, sideLabels: sides, toScale: true }),
    figureAlt: `A ${fam === '45' ? '45°-45°-90°' : '30°-60°-90°'} right triangle ABC with the right angle at C${fam === '30' ? ', the 30° angle at A and the 60° angle at B' : ''}. ${sides.map((t, i) => (t ? `Side ${['BC', 'CA', 'AB'][i]} is labelled ${t}` : '')).filter(Boolean).join('; ')}.`,
    brief: `${method} So the answer is ${answer}.`,
  });
}
const FN = { sin: ['opposite', 'hypotenuse'], cos: ['adjacent', 'hypotenuse'], tan: ['opposite', 'adjacent'] };
function genTrigRatio(lvl) {
  const t = pick(TRIPLES.slice(0, lvl === 1 ? 2 : 5));
  const k = lvl === 1 ? 1 : ri(1, t[2] > 17 ? 1 : 3);
  const [a, b] = shuffle([t[0] * k, t[1] * k]);
  const c = t[2] * k;
  const fn = pick(['sin', 'cos', 'tan']), ang = pick(['A', 'B']);
  const side = { A: { opposite: ['BC', a], adjacent: ['AC', b] }, B: { opposite: ['AC', b], adjacent: ['BC', a] } }[ang];
  const part = (r) => (r === 'hypotenuse' ? ['AB', c] : side[r]);
  const [top, bot] = FN[fn].map(part);
  const v = Rt(top[1], bot[1]);
  const answer = fstr(v);
  const other = ang === 'A' ? 'B' : 'A';
  const Wf = (r, why) => ({ str: fstr(r), val: rnum(r), why });
  const all = { sin: Rt(side.opposite[1], c), cos: Rt(side.adjacent[1], c), tan: Rt(side.opposite[1], side.adjacent[1]) };
  const atOther = { sin: Rt(side.adjacent[1], c), cos: Rt(side.opposite[1], c), tan: Rt(side.adjacent[1], side.opposite[1]) };
  const wrong = [Wf(Rt(bot[1], top[1]), 'flipped the ratio'), ...['sin', 'cos', 'tan'].filter((f) => f !== fn).map((f) => Wf(all[f], `used ${f} instead`)), Wf(atOther[fn], `worked from angle ${other}`)];
  const reduced = v.n !== top[1];
  const lines = [`${fn} ${ang} = ${FN[fn][0]} ÷ ${FN[fn][1]}`, ...(reduced ? [`= ${top[1]}/${bot[1]}`] : []), ['= ', answer]];
  return makeQ('trigratio', {
    level: lvl, prompt: `In right triangle ABC, ∠C = 90°, BC = ${a}, AC = ${b} and AB = ${c}. Find ${fn} ${ang}. Write it as a fraction.`,
    answer, ans: { k: 'num', v, names: [`${fn}${ang.toLowerCase()}`], ask: `${fn} ${ang}` }, placeholder: 'A fraction, like a/b',
    data: { a, b, c, fn, ang }, wrong,
    work: works({
      method: ['SOH CAH TOA: sin = opposite ÷ hypotenuse, cos = adjacent ÷ hypotenuse, tan = opposite ÷ adjacent.', `Seen from ∠${ang}: the opposite side is ${side.opposite[0]} = ${side.opposite[1]}, the adjacent side is ${side.adjacent[0]} = ${side.adjacent[1]} and the hypotenuse is AB = ${c}.`],
      lines, hintLines: [lines[0], ['= ', null]],
      // only a terminating decimal is exactly the same value (0.6 for 3/5, but not 0.923 for 12/13)
      final: [terminates(v)
        ? (reduced ? `${top[1]}/${bot[1]} (not reduced) or the exact decimal ${n(rnum(v))} is also right.` : `The exact decimal ${n(rnum(v))} is also right.`)
        : (reduced ? `${top[1]}/${bot[1]} (not reduced) is also right. As a decimal the ratio repeats forever, so give the fraction.` : 'As a decimal the ratio repeats forever, so give the fraction.')], hint: ['Pick the two sides the ratio needs, as seen from the angle.'],
    }),
    figure: rightTri(a, b, { sides: [String(a), String(b), String(c)], mirror: chance(0.5), arcs: ang === 'A' ? [1, 0, 0] : [0, 1, 0] }),
    figureAlt: `Right triangle ABC with the right angle at C; BC = ${a}, AC = ${b} and hypotenuse AB = ${c}. Angle ${ang} is marked.`,
    brief: `${fn} ${ang} = ${FN[fn][0]} ÷ ${FN[fn][1]} = ${top[1]}/${bot[1]} = ${answer}`,
  });
}
const f4 = (v) => (Math.round(v * 10000) / 10000).toFixed(4);
const trigVal = (fn, deg) => (fn === 'sin' ? Math.sin(deg * DEG) : fn === 'cos' ? Math.cos(deg * DEG) : Math.tan(deg * DEG));
const ROLE = { opp: 'opposite side', adj: 'adjacent side', hyp: 'hypotenuse' };
function genTrigSide(lvl) {
  for (;;) {
    const u = pick(LUNITS);
    const th = ri(18, 72);
    const cases = lvl === 1 ? [['hyp', 'opp'], ['hyp', 'adj'], ['adj', 'opp']] : lvl === 2 ? [['hyp', 'opp'], ['hyp', 'adj'], ['adj', 'opp'], ['opp', 'hyp'], ['adj', 'hyp']] : [['opp', 'hyp'], ['adj', 'hyp'], ['opp', 'adj'], ['adj', 'opp']];
    const [kn, un] = pick(cases);
    const v = lvl === 3 && chance(0.4) ? rq(ri(40, 400) / 10) : Rt(ri(5, 40));
    const vv = rnum(v);
    const s = Math.sin(th * DEG), c = Math.cos(th * DEG);
    const hyp = kn === 'hyp' ? vv : kn === 'opp' ? vv / s : vv / c;
    const opp = hyp * s, adj = hyp * c;
    const want = { hyp, opp, adj }[un];
    if (nearTie(want, 1) || want < 1) continue;
    const NAME = { opp: 'BC', adj: 'AC', hyp: 'AB' };
    const fn = kn === 'hyp' || un === 'hyp' ? (kn === 'opp' || un === 'opp' ? 'sin' : 'cos') : 'tan';
    const [topR, botR] = { sin: ['opp', 'hyp'], cos: ['adj', 'hyp'], tan: ['opp', 'adj'] }[fn];
    const fv = trigVal(fn, th);
    const multiply = un === topR;
    const ansS = roundStr(want, 1);
    const answer = `${ansS} ${u}`;
    const lines = [
      `${fn} ${th}° = ${NAME[topR]} ÷ ${NAME[botR]}`,
      multiply ? `${NAME[un]} = ${n(v)} × ${fn} ${th}°` : `${NAME[un]} = ${n(v)} ÷ ${fn} ${th}°`,
      multiply ? `≈ ${n(v)} × ${f4(fv)}` : `≈ ${n(v)} ÷ ${f4(fv)}`,
      `≈ ${more(want, 1)}`, ['≈ ', answer],
    ];
    const W1 = (x, why) => ({ str: `${roundStr(x, 1)} ${u}`, val: Number(roundStr(x, 1)), why });
    const otherFn = fn === 'sin' ? 'cos' : fn === 'cos' ? 'sin' : 'tan';
    const ov = otherFn === 'tan' ? 1 / Math.tan(th * DEG) : trigVal(otherFn, th);
    const wrong = [
      W1(multiply ? vv / fv : vv * fv, multiply ? 'divided instead of multiplying' : 'multiplied instead of dividing'),
      W1(multiply ? vv * ov : vv / ov, fn === 'tan' ? 'used the ratio upside down' : `used ${otherFn} instead of ${fn}`),
    ];
    const rad = fn === 'sin' ? Math.sin(th) : fn === 'cos' ? Math.cos(th) : Math.tan(th);
    const radAns = multiply ? vv * rad : vv / rad;
    if (radAns > 0.5 && radAns < 1e4) wrong.push(W1(radAns, 'calculator in radian mode'));
    const trunc = Math.floor(want * 10) / 10;
    if (roundStr(trunc, 1) !== ansS) wrong.push(W1(trunc, 'cut off instead of rounding'));
    wrong.push(...fallbacks(Number(ansS), W1));
    const shownV = `${n(v)} ${u}`;
    const sidesTxt = [un === 'opp' ? 'x' : kn === 'opp' ? shownV : '', un === 'adj' ? 'x' : kn === 'adj' ? shownV : '', un === 'hyp' ? 'x' : kn === 'hyp' ? shownV : ''];
    return makeQ('trigside', {
      level: lvl, prompt: `In right triangle ABC, ∠C = 90°, m∠A = ${th}° and ${NAME[kn]} = ${shownV}. Find ${NAME[un]}. Round to the nearest tenth.`,
      answer, ans: { k: 'round', v: want, dp: 1, u: `len:${u}`, names: [NAME[un].toLowerCase(), NAME[un].toLowerCase().split('').reverse().join(''), 'x'], ask: NAME[un] },
      data: { theta: th, known: kn, value: vv, find: un }, wrong,
      work: works({
        method: [`Seen from ∠A: ${NAME[un]} is the ${ROLE[un]} and ${NAME[kn]} is the ${ROLE[kn]}, so use ${fn} (SOH CAH TOA).`, multiply ? 'The unknown side is on top of the ratio, so multiply.' : 'The unknown side is on the bottom of the ratio, so divide.'],
        lines, hintLines: [lines[0], [`${NAME[un]} ≈ `, null]],
        final: ['Keep your calculator in degree mode, and round only at the end.'], hint: ['Write the ratio, then solve it for the unknown side.'],
      }),
      figure: rightTri(opp, adj, { sides: sidesTxt, angles: [`${th}°`, '', ''], arcs: [1, 0, 0], mirror: chance(0.5) }),
      figureAlt: `Right triangle ABC with the right angle at C and angle A labelled ${th}°. ${NAME[kn]} is labelled ${shownV} and ${NAME[un]} is labelled x.`,
      brief: `${NAME[un]} = ${n(v)} ${multiply ? '×' : '÷'} ${fn} ${th}° ≈ ${ansS}`,
    });
  }
}
function genTrigAngle(lvl) {
  for (;;) {
    const pair = pick(lvl === 1 ? [['opp', 'adj'], ['opp', 'hyp']] : [['opp', 'adj'], ['opp', 'hyp'], ['adj', 'hyp']]);
    const p = ri(3, 25);
    let q = ri(3, 25);
    if (pair[1] === 'hyp' && q <= p) q = p + ri(1, 12);
    const fn = pair[1] === 'hyp' ? (pair[0] === 'opp' ? 'sin' : 'cos') : 'tan';
    const r = p / q;
    const th = (fn === 'sin' ? Math.asin(r) : fn === 'cos' ? Math.acos(r) : Math.atan(r)) / DEG;
    if (th < 12 || th > 78 || nearTie(th, 0)) continue;
    const ansS = roundStr(th, 0);
    const NAME = { opp: 'BC', adj: 'AC', hyp: 'AB' };
    const vals = { [pair[0]]: p, [pair[1]]: q };
    const opp = pair[0] === 'opp' ? p : Math.sqrt(q * q - p * p);
    const adj = pair[0] === 'adj' ? p : pair[1] === 'adj' ? q : Math.sqrt(q * q - p * p);
    const inv = `${fn}⁻¹`;
    const lines = [`${fn} A = ${NAME[pair[0]]} ÷ ${NAME[pair[1]]} = ${p} ÷ ${q}`, `m∠A = ${inv}(${p} ÷ ${q})`, `≈ ${more(th, 0)}°`, ['≈ ', `${ansS}°`]];
    const W1 = (x, why) => ({ str: `${roundStr(x, 0)}°`, val: Number(roundStr(x, 0)), why });
    const wrong = [W1(90 - th, 'found angle B instead')];
    if (String(Math.floor(th)) !== ansS) wrong.push(W1(Math.floor(th), 'cut off instead of rounding'));
    for (const g of ['sin', 'cos', 'tan']) {
      if (g === fn || (g !== 'tan' && r > 1)) continue;
      const alt = (g === 'sin' ? Math.asin(r) : g === 'cos' ? Math.acos(r) : Math.atan(r)) / DEG;
      wrong.push(W1(alt, `used ${g}⁻¹ instead of ${inv}`));
    }
    wrong.push(...fallbacks(Number(ansS), W1));
    const sides = [pair.includes('opp') ? String(vals.opp) : '', pair.includes('adj') ? String(vals.adj) : '', pair.includes('hyp') ? String(vals.hyp) : ''];
    return makeQ('trigangle', {
      level: lvl, prompt: `In right triangle ABC, ∠C = 90°, ${NAME[pair[0]]} = ${p} and ${NAME[pair[1]]} = ${q}. Find m∠A to the nearest degree.`,
      answer: `${ansS}°`, ans: { k: 'round', v: th, dp: 0, u: 'deg', names: ['a', 'bac', 'cab'], ask: 'm∠A' },
      data: { known: pair, p, q }, wrong,
      work: works({
        method: [`Seen from ∠A, ${NAME[pair[0]]} is the ${ROLE[pair[0]]} and ${NAME[pair[1]]} is the ${ROLE[pair[1]]}, so the ratio is ${fn} A.`, `Undo ${fn} with the inverse function ${inv} (2nd or shift on most calculators).`],
        lines, hintLines: [lines[0], ['m∠A ≈ ', null]],
        final: [`Round ${more(th, 0)}° to the nearest degree.`], hint: ['Write the ratio, then use the inverse trig function in degree mode.'],
      }),
      figure: rightTri(opp, adj, { sides, angles: ['?', '', ''], arcs: [1, 0, 0], mirror: chance(0.5) }),
      figureAlt: `Right triangle ABC with the right angle at C; ${NAME[pair[0]]} = ${p} and ${NAME[pair[1]]} = ${q}. Angle A is marked with a question mark.`,
      brief: `m∠A = ${inv}(${p}/${q}) ≈ ${ansS}°`,
    });
  }
}
/** A right-triangle scene: the angle at the ground (elevation) or at the top (depression). */
function sceneFig({ kind, base, side, hyp, angle }) {
  const w = 300, h = 190;
  const G = [40, 158], Tp = [250, 40], Bt = [250, 158];
  let s = L([12, 158], [288, 158], 'gm-ground') + L(G, Tp, 'gm-hl') + L(Bt, Tp, 'gm-seg') + rightMark(Bt, G, Tp, 10);
  if (kind === 'up') {
    s += arcs(G, Bt, Tp, 1, 26, 'gm-mark') + T(inside(G, Bt, Tp, 48), angle, { cls: 'gm-lb gm-small' }) + DOT(G);
  } else {
    const Hz = [70, 40];
    s += L(Tp, Hz, 'gm-dash') + arcs(Tp, Hz, G, 1, 30, 'gm-mark') + T(inside(Tp, Hz, G, 56), angle, { cls: 'gm-lb gm-small' });
    s += T([96, 28], 'horizontal', { cls: 'gm-small gm-soft' }) + DOT(G);
  }
  if (base) s += T([145, 174], base, { cls: 'gm-lb' });
  if (side) s += T([262, 99], side, { a: 'start', cls: 'gm-lb' });
  if (hyp) s += T([136, 86], hyp, { a: 'end', cls: 'gm-lb' });
  return svgWrap(w, h, s, false);
}
function genElevation(lvl) {
  for (;;) {
    const kinds = lvl === 1 ? ['tree', 'kite'] : lvl === 2 ? ['tree', 'kite', 'lighthouse', 'ladder'] : ['lighthouse', 'plane', 'ladder', 'shadow', 'kite'];
    const kind = pick(kinds);
    const th = ri(15, 70);
    let prompt, want, dp = 1, u, lines, method, alt, fig, wrong, known;
    const W1 = (x, why, d = dp) => ({ str: d ? `${roundStr(x, 1)} ${u}` : `${roundStr(x, 0)}°`, val: Number(roundStr(x, d)), why });
    if (kind === 'tree') {
      u = 'ft'; const d = ri(15, 120);
      want = d * Math.tan(th * DEG);
      prompt = `You stand ${d} ft from the base of a tree. The angle of elevation to the top of the tree is ${th}°. How tall is the tree, to the nearest tenth of a foot?`;
      method = [`The tree, the ground and your line of sight make a right triangle. The height h is opposite the ${th}° angle and the ${d} ft distance is adjacent, so use tangent.`];
      lines = [`tan ${th}° = h ÷ ${d}`, `h = ${d} × tan ${th}°`, `≈ ${d} × ${f4(Math.tan(th * DEG))}`, `≈ ${more(want, 1)}`];
      wrong = [W1(d * Math.sin(th * DEG), 'used sine'), W1(d / Math.tan(th * DEG), 'divided by tan'), W1(d * Math.cos(th * DEG), 'used cosine')];
      fig = { kind: 'up', base: `${d} ft`, side: 'h', hyp: '', angle: `${th}°` }; known = { d };
      alt = `A right triangle: a tree of unknown height h, the ground ${d} ft from you to the tree, and your line of sight to the top making ${aW(`${th}°`)} angle of elevation with the ground.`;
    } else if (kind === 'kite') {
      u = 'ft'; const Ls = ri(40, 200);
      want = Ls * Math.sin(th * DEG);
      prompt = `A kite string is ${Ls} ft long and makes ${aW(`${th}°`)} angle of elevation with the ground. How high is the kite, to the nearest tenth of a foot? (Treat the string as straight.)`;
      method = [`The string is the hypotenuse and the height h is opposite the ${th}° angle, so use sine.`];
      lines = [`sin ${th}° = h ÷ ${Ls}`, `h = ${Ls} × sin ${th}°`, `≈ ${Ls} × ${f4(Math.sin(th * DEG))}`, `≈ ${more(want, 1)}`];
      wrong = [W1(Ls * Math.cos(th * DEG), 'used cosine'), W1(Ls * Math.tan(th * DEG), 'used tangent'), W1(Ls / Math.sin(th * DEG), 'divided by sin')];
      fig = { kind: 'up', base: '', side: 'h', hyp: `${Ls} ft`, angle: `${th}°` }; known = { L: Ls };
      alt = `A right triangle: the kite string of ${Ls} ft as the hypotenuse, rising at ${aW(`${th}°`)} angle of elevation from the ground, with the kite's height h as the vertical side.`;
    } else if (kind === 'lighthouse') {
      u = 'm'; const h = ri(20, 90);
      want = h / Math.tan(th * DEG);
      prompt = `From the top of ${aW(h)} m lighthouse, the angle of depression to a boat is ${th}°. How far is the boat from the base of the lighthouse, to the nearest tenth of a meter?`;
      method = ['The angle of depression (measured down from the horizontal) equals the angle of elevation from the boat up to the top: they are alternate interior angles.', `From the boat, the height ${h} m is opposite the ${th}° angle and the distance d is adjacent, so use tangent.`];
      lines = [`tan ${th}° = ${h} ÷ d`, `d = ${h} ÷ tan ${th}°`, `≈ ${h} ÷ ${f4(Math.tan(th * DEG))}`, `≈ ${more(want, 1)}`];
      wrong = [W1(h * Math.tan(th * DEG), 'multiplied instead of dividing'), W1(h / Math.tan((90 - th) * DEG), 'used the angle from the vertical'), W1(h / Math.sin(th * DEG), 'used sine (that is the line of sight)')];
      fig = { kind: 'down', base: 'd', side: `${h} m`, hyp: '', angle: `${th}°` }; known = { h };
      alt = `A lighthouse ${h} m tall with a line of sight from its top down to a boat on the water; the angle of depression from the horizontal at the top is ${th}°, and the distance d from the base to the boat is unknown.`;
    } else if (kind === 'plane') {
      u = 'ft'; const h = ri(20, 90) * 100;
      want = h / Math.sin(th * DEG);
      prompt = `A plane flying at ${h} ft sees a runway light at an angle of depression of ${th}°. How far is the plane from the light along the line of sight, to the nearest tenth of a foot?`;
      method = ['The angle of depression equals the angle of elevation from the light up to the plane (alternate interior angles).', `The altitude ${h} ft is opposite that angle and the line of sight s is the hypotenuse, so use sine.`];
      lines = [`sin ${th}° = ${h} ÷ s`, `s = ${h} ÷ sin ${th}°`, `≈ ${h} ÷ ${f4(Math.sin(th * DEG))}`, `≈ ${more(want, 1)}`];
      wrong = [W1(h * Math.sin(th * DEG), 'multiplied instead of dividing'), W1(h / Math.tan(th * DEG), 'used tangent (that is the ground distance)'), W1(h / Math.cos(th * DEG), 'used cosine')];
      fig = { kind: 'down', base: '', side: `${h} ft`, hyp: 's', angle: `${th}°` }; known = { h };
      alt = `A plane at an altitude of ${h} ft with a line of sight s down to a light on the ground; the angle of depression from the horizontal at the plane is ${th}°.`;
    } else if (kind === 'ladder') {
      u = 'deg'; dp = 0;
      const Ls = ri(10, 30), d = ri(2, Ls - 3);
      want = Math.acos(d / Ls) / DEG;
      prompt = `${cap(aW(Ls))} ft ladder leans against a wall with its foot ${d} ft from the wall. What angle does the ladder make with the ground, to the nearest degree?`;
      method = ['The ladder is the hypotenuse and the distance from the wall is adjacent to the angle at the ground, so use cosine, then its inverse.'];
      lines = [`cos θ = ${d} ÷ ${Ls}`, `θ = cos⁻¹(${d} ÷ ${Ls})`, `≈ ${more(want, 0)}°`];
      wrong = [W1(90 - want, 'found the angle at the wall'), W1(Math.asin(d / Ls) / DEG, 'used sin⁻¹'), W1(Math.atan(d / Ls) / DEG, 'used tan⁻¹')];
      fig = { kind: 'up', base: `${d} ft`, side: '', hyp: `${Ls} ft`, angle: 'θ' }; known = { L: Ls, d };
      alt = `A ladder of ${Ls} ft leaning against a vertical wall, its foot ${d} ft from the wall; the angle θ between the ladder and the ground is marked.`;
    } else {
      u = 'deg'; dp = 0;
      const h = ri(4, 40), sh = ri(4, 40);
      want = Math.atan(h / sh) / DEG;
      prompt = `${cap(aW(h))} m flagpole casts a shadow ${sh} m long. What is the angle of elevation of the sun, to the nearest degree?`;
      method = ['The pole is opposite the sun\'s angle of elevation and the shadow is adjacent, so use tangent, then its inverse.'];
      lines = [`tan θ = ${h} ÷ ${sh}`, `θ = tan⁻¹(${h} ÷ ${sh})`, `≈ ${more(want, 0)}°`];
      wrong = [W1(90 - want, 'flipped the ratio (found the other acute angle)')];
      if (h < sh) wrong.push(W1(Math.asin(h / sh) / DEG, 'used sin⁻¹'));
      fig = { kind: 'up', base: `${sh} m`, side: `${h} m`, hyp: '', angle: 'θ' }; known = { h, sh };
      alt = `A flagpole ${h} m tall and its shadow ${sh} m long along the ground; the angle of elevation θ from the tip of the shadow to the top of the pole is marked.`;
    }
    if (nearTie(want, dp) || want < 1 || want > 1e5) continue;
    const ansS = roundStr(want, dp);
    const answer = dp ? `${ansS} ${u}` : `${ansS}°`;
    lines.push(['≈ ', answer]);
    const trunc = Math.floor(want * 10 ** dp) / 10 ** dp;
    if (roundStr(trunc, dp) !== ansS) wrong.push(W1(trunc, 'cut off instead of rounding'));
    wrong.push(...fallbacks(Number(ansS), W1));
    return makeQ('elevation', {
      level: lvl, prompt, answer,
      ans: dp ? { k: 'round', v: want, dp: 1, u: `len:${u}`, names: ['h', 'd', 's', 'x', 'height', 'distance'], ask: 'the length' } : { k: 'round', v: want, dp: 0, u: 'deg', names: ['θ', 'theta', 'x'], ask: 'the angle' },
      data: { kind, theta: dp ? th : null, ...known }, wrong,
      work: works({ method, lines, hintLines: [lines[0], [dp ? `${lines[1].split(' = ')[0]} ≈ ` : 'θ ≈ ', null]], final: ['Round only at the very end.'], hint: ['Sketch the right triangle, label what you know, and choose sin, cos or tan.'] }),
      figure: sceneFig(fig), figureAlt: alt,
      brief: `${lines[1]} ≈ ${answer}`,
    });
  }
}

/* ================================================================ Unit 7 */
const POLY = { 3: 'triangle', 4: 'quadrilateral', 5: 'pentagon', 6: 'hexagon', 7: 'heptagon', 8: 'octagon', 9: 'nonagon', 10: 'decagon', 12: 'dodecagon' };
const polyName = (k) => POLY[k] || `${k}-gon`;
const withArticle = (k) => aW(polyName(k));
const NUMW = { 3: 'Three', 4: 'Four', 5: 'Five', 6: 'Six', 7: 'Seven' };
const ORD = { 4: 'fourth', 5: 'fifth', 6: 'sixth', 7: 'seventh', 8: 'eighth' };
/** A regular k-gon, optionally split into triangles from one vertex, with labels inside the corners. */
function polyFig(k, { labels = [], diagonals = false, toScale = true, size = 220 } = {}) {
  const c = [size / 2, size / 2 + 4], R = size * 0.4;
  const off = k % 2 ? 90 : 90 + 180 / k;
  const V = Array.from({ length: k }, (_, i) => [c[0] + R * Math.cos((off + (360 * i) / k) * DEG), c[1] - R * Math.sin((off + (360 * i) / k) * DEG)]);
  let s = PG(V, 'gm-shape');
  if (diagonals) for (let i = 2; i < k - 1; i++) s += L(V[0], V[i], 'gm-dash');
  labels.forEach((t, i) => { if (t) s += T(add2(V[i], mul2(sub2(c, V[i]), k > 8 ? 0.3 : 0.26)), t, { cls: 'gm-lb gm-small' }); });
  return svgWrap(size, size + 8, s, toScale);
}
function genPolySum(lvl) {
  for (;;) {
    const mode = lvl === 1 ? 'sum' : lvl === 2 ? pick(['sum', 'sum', 'missing']) : pick(['sum', 'missing', 'missing']);
    const W1 = numW('deg');
    if (mode === 'sum') {
      const k = pick(lvl === 1 ? [5, 6, 7, 8, 9, 10] : lvl === 2 ? [5, 6, 7, 8, 9, 10, 12, 15, 20] : [9, 11, 12, 14, 15, 16, 18, 20, 24, 25, 30]);
      const S = (k - 2) * 180;
      const lines = [`S = (${k} ${MINUS} 2) × 180°`, `= ${k - 2} × 180°`, ['= ', `${S}°`]];
      const wrong = [W1(k * 180, 'multiplied by n instead of n − 2'), W1((k - 1) * 180, 'used n − 1'), W1(360, 'used 360° for every polygon'), W1((k - 2) * 360, 'used 360° per triangle'), ...(Number.isInteger(S / k) ? [W1(S / k, 'found one angle of a regular polygon')] : []), ...fallbacks(S, W1)];
      return makeQ('polysum', {
        level: lvl, prompt: `What is the sum of the interior angle measures of a convex ${polyName(k)}?`,
        answer: `${S}°`, ans: { k: 'num', v: Rt(S), u: 'deg', names: ['s', 'sum'], ask: 'the sum' },
        data: { mode, n: k }, wrong,
        work: works({
          method: [`Diagonals from one vertex split a polygon with n sides into n − 2 triangles, and each triangle holds 180°. So S = (n − 2) × 180°.`],
          lines, hintLines: [lines[0], ['= ', null]],
          extra: k <= 12 ? () => el('div', { class: 'gm-mini', role: 'img', 'aria-label': `${cap(withArticle(k))} split into ${k - 2} triangles by diagonals from one vertex.`, html: polyFig(k, { diagonals: true, size: 160 }) }) : null,
          final: [`${cap(polyName(k))}: ${k} sides, so ${k - 2} triangles.`], hint: [`${cap(aW(polyName(k)))} has ${k} sides.`],
        }),
        brief: `(${k} − 2) × 180° = ${S}°`,
      });
    }
    const k = pick(lvl === 2 ? [4, 5, 5] : [5, 6, 7, 8]);
    const S = (k - 2) * 180, avg = S / k;
    const given = Array.from({ length: k - 1 }, () => Math.round(avg + ri(-28, 28)));
    const sum = given.reduce((a, b) => a + b, 0);
    const last = S - sum;
    if (last < 55 || last > 175 || given.some((g) => g < 50 || g > 175) || new Set(given).size < given.length) continue;
    const list = given.map((g) => `${g}°`);
    const prompt = `${NUMW[k - 1]} of the interior angles of a convex ${polyName(k)} measure ${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}. Find the ${ORD[k]} angle.`;
    const lines = [`S = (${k} ${MINUS} 2) × 180° = ${S}°`, `x = ${S}° ${MINUS} (${given.map((g) => `${g}°`).join(' + ')})`, `= ${S}° ${MINUS} ${sum}°`, ['= ', `${last}°`]];
    const wrong = [...(k * 180 - sum > 0 ? [W1(k * 180 - sum, 'used n × 180° for the sum')] : []), ...(360 - sum > 0 ? [W1(360 - sum, 'used 360° for the sum')] : []), W1((k - 1) * 180 - sum > 0 ? (k - 1) * 180 - sum : last + 10, 'used (n − 1) × 180°'), W1(180 - last, 'gave the supplement'), ...fallbacks(last, W1)];
    return makeQ('polysum', {
      level: lvl, prompt, answer: `${last}°`, ans: { k: 'num', v: Rt(last), u: 'deg', names: ['x'], ask: 'the angle' },
      data: { mode, n: k, given }, wrong,
      work: works({
        method: ['First find the total with S = (n − 2) × 180°, then subtract the angles you know.'],
        lines, hintLines: [lines[0], ['x = ', null]],
        final: [`Check: the ${k} angles add up to ${S}°.`], hint: ['Subtract the sum of the known angles from the total.'],
      }),
      figure: polyFig(k, { labels: [...list, '?'], toScale: false }),
      figureAlt: `A convex ${polyName(k)} with ${k - 1} of its interior angles labelled ${list.join(', ')} and the last angle marked with a question mark.`,
      brief: `S = ${S}°; ${S}° − ${sum}° = ${last}°`,
    });
  }
}
function genRegular(lvl) {
  const k = pick(lvl === 1 ? [3, 4, 5, 6, 8, 10, 12] : lvl === 2 ? [5, 6, 8, 9, 10, 12, 15, 18, 20] : [9, 15, 16, 18, 20, 24, 30, 36, 40, 45, 60]);
  const ask = pick(['interior', 'exterior']);
  const e = Rt(360, k), i = Rt(180 * (k - 2), k), S = 180 * (k - 2);
  const val = ask === 'interior' ? i : e;
  const W1 = (v, why) => ({ str: `${n(v)}°`, val: Number(numStr(v)), why });
  const lines = ask === 'interior'
    ? [`S = (${k} ${MINUS} 2) × 180° = ${S}°`, `each interior angle = ${S}° ÷ ${k}`, ['= ', `${n(i)}°`], `or: 180° ${MINUS} 360° ÷ ${k} = ${n(i)}°`]
    : [`each exterior angle = 360° ÷ ${k}`, ['= ', `${n(e)}°`]];
  const wrong = ask === 'interior'
    ? [W1(e, 'gave the exterior angle'), W1(Rt(S), 'gave the sum, not each angle'), ...fallbacks(rnum(i), (v, why) => W1(rq(v), why))]
    : [W1(i, 'gave the interior angle'), W1(Rt(180, k), 'used 180° instead of 360°'), ...fallbacks(rnum(e), (v, why) => W1(rq(v), why))];
  return makeQ('regular', {
    level: lvl, prompt: `Find the measure of each ${ask} angle of a regular ${polyName(k)}.`,
    answer: `${n(val)}°`, ans: { k: 'num', v: val, u: 'deg', names: ['x'], ask: `each ${ask} angle` },
    data: { n: k, ask }, wrong,
    work: works({
      method: [ask === 'interior' ? 'A regular polygon has equal angles: find the interior angle sum, then share it among the n angles.' : 'The exterior angles of any convex polygon add up to 360°, and a regular polygon\'s are all equal.'],
      lines, hintLines: [lines[0], ['= ', null]].slice(0, ask === 'interior' ? 2 : 2),
      final: [`An interior angle and its exterior angle always add up to 180°: ${n(i)}° + ${n(e)}° = 180°.`], hint: [`A regular ${polyName(k)} has ${k} equal angles.`],
    }),
    figure: k <= 12 ? polyFig(k, { size: 180 }) : null, figureAlt: k <= 12 ? `A regular ${polyName(k)}.` : null,
    brief: ask === 'interior' ? `(${k} − 2) × 180° ÷ ${k} = ${n(i)}°` : `360° ÷ ${k} = ${n(e)}°`,
  });
}
function genSides(lvl) {
  const kind = lvl === 1 ? pick(['ext', 'sum']) : pick(['ext', 'int', 'sum']);
  const k = pick(kind === 'sum' ? (lvl === 1 ? [5, 6, 7, 8, 9, 10, 12] : [7, 9, 11, 12, 14, 15, 16, 18, 20, 24]) : (lvl === 1 ? [3, 4, 5, 6, 8, 9, 10, 12] : lvl === 2 ? [5, 6, 8, 9, 10, 12, 15, 18, 20] : [9, 15, 16, 18, 20, 24, 30, 36, 40]));
  const e = Rt(360, k), i = Rt(180 * (k - 2), k), S = 180 * (k - 2);
  let prompt, lines;
  const W1 = (v, why) => ({ str: `${v} sides`, val: v, why });
  const wrong = [];
  if (kind === 'ext') {
    prompt = `Each exterior angle of a regular polygon measures ${n(e)}°. How many sides does the polygon have?`;
    lines = [`n = 360° ÷ ${n(e)}°`, ['= ', `${k} sides`]];
    const y = 360 / (180 - rnum(e)); if (Number.isInteger(y) && y > 2 && y !== k) wrong.push(W1(y, 'treated it as an interior angle'));
    const z = 180 / rnum(e); if (Number.isInteger(z) && z > 2 && z !== k) wrong.push(W1(z, 'divided 180° instead of 360°'));
  } else if (kind === 'int') {
    prompt = `Each interior angle of a regular polygon measures ${n(i)}°. How many sides does the polygon have?`;
    lines = [`exterior angle = 180° ${MINUS} ${n(i)}° = ${n(e)}°`, `n = 360° ÷ ${n(e)}°`, ['= ', `${k} sides`]];
    const y = 360 / rnum(i); if (Number.isInteger(y) && y > 2 && y !== k) wrong.push(W1(y, 'divided 360° by the interior angle'));
  } else {
    prompt = `The interior angles of a convex polygon add up to ${S}°. How many sides does the polygon have?`;
    lines = [`(n ${MINUS} 2) × 180° = ${S}°`, `n ${MINUS} 2 = ${S} ÷ 180 = ${k - 2}`, ['n = ', `${k} sides`]];
    wrong.push(W1(k - 2, 'forgot to add 2'), W1(k - 1, 'added only 1'));
  }
  wrong.push(W1(k + 1, 'arithmetic slip'), W1(k - 1, 'arithmetic slip'), W1(k + 2, 'arithmetic slip'), W1(2 * k, 'doubled'));
  return makeQ('sides', {
    level: lvl, prompt, answer: `${k} sides`, ans: { k: 'num', v: Rt(k), u: 'sides', names: ['n', 'sides'], ask: 'n' }, placeholder: 'Number of sides',
    data: { kind, value: kind === 'ext' ? rnum(e) : kind === 'int' ? rnum(i) : S }, wrong: wrong.filter((w) => w.val > 2),
    work: works({
      method: [kind === 'sum' ? 'Use S = (n − 2) × 180° and solve for n.' : kind === 'int' ? 'Turn the interior angle into an exterior angle (they add up to 180°), then use: n = 360° ÷ (each exterior angle).' : 'The exterior angles add up to 360°, so n = 360° ÷ (each exterior angle).'],
      lines, hintLines: [lines[0], ['n = ', null]],
      final: [`Check: ${aW(polyName(k))} has ${k} sides.`], hint: ['Work backwards from the angle formula.'],
    }),
    brief: kind === 'sum' ? `${S} ÷ 180 + 2 = ${k}` : `360° ÷ ${n(e)}° = ${k}`,
  });
}
const QUAD_PROPS = {
  pOppSides: { shape: 'para', parts: ['AB', 'CD'], rel: 'eq', unit: 'len', text: 'Opposite sides of a parallelogram are congruent, so AB = CD.' },
  pOppAngles: { shape: 'para', parts: ['∠A', '∠C'], rel: 'eq', unit: 'deg', text: 'Opposite angles of a parallelogram are congruent, so m∠A = m∠C.' },
  pConsec: { shape: 'para', parts: ['∠A', '∠B'], rel: 'sum180', unit: 'deg', text: 'Consecutive angles of a parallelogram are supplementary, so m∠A + m∠B = 180°.' },
  pDiag: { shape: 'para', parts: ['AE', 'EC'], rel: 'eq', unit: 'len', diag: true, text: 'The diagonals of a parallelogram bisect each other, so AE = EC.' },
  rectDiag: { shape: 'rect', parts: ['AC', 'BD'], rel: 'eq', unit: 'len', diag: true, text: 'The diagonals of a rectangle are congruent, so AC = BD.' },
  rectHalf: { shape: 'rect', parts: ['AE', 'BD'], rel: 'double', unit: 'len', diag: true, text: 'The diagonals of a rectangle are congruent and bisect each other, so BD = AC = 2 · AE.' },
  rectAngle: { shape: 'rect', parts: ['∠ABC'], rel: 'is90', unit: 'deg', text: 'Every angle of a rectangle is a right angle, so m∠ABC = 90°.' },
  rhSides: { shape: 'rhom', parts: ['AB', 'BC'], rel: 'eq', unit: 'len', text: 'All four sides of a rhombus are congruent, so AB = BC.' },
  rhPerp: { shape: 'rhom', parts: ['∠AEB'], rel: 'is90', unit: 'deg', diag: true, text: 'The diagonals of a rhombus are perpendicular, so m∠AEB = 90°.' },
  rhBisect: { shape: 'rhom', parts: ['∠BAC', '∠DAC'], rel: 'eq', unit: 'deg', diag: true, text: 'Each diagonal of a rhombus bisects a pair of opposite angles, so m∠BAC = m∠DAC.' },
};
const SHAPE_NAME = { para: 'parallelogram', rect: 'rectangle', rhom: 'rhombus' };
function quadFig(shape, diag, labels) {
  const P = { para: [[0, 0], [4, 0], [5.3, 2.5], [1.3, 2.5]], rect: [[0, 0], [4.6, 0], [4.6, 2.6], [0, 2.6]], rhom: [[0, 0], [3.2, 0], [4.9, 2.7], [1.7, 2.7]] }[shape];
  const F = fitter(P, 300, 200, 36);
  const S = P.map(F), c = centroid(S);
  const E = mid2(S[0], S[2]);
  let s = PG(S, 'gm-shape');
  if (diag) s += L(S[0], S[2], 'gm-seg') + L(S[1], S[3], 'gm-seg') + DOT(E) + T(add2(E, [0, 14]), 'E', { cls: 'gm-vx' });
  ['A', 'B', 'C', 'D'].forEach((t, i) => { s += vlabel(S[i], c, t); });
  const V = { A: S[0], B: S[1], C: S[2], D: S[3], E };
  for (const [part, text] of Object.entries(labels)) {
    if (!text) continue;
    const name = part.replace('∠', '');
    if (part.startsWith('∠') && name.length === 1) { const i = 'ABCD'.indexOf(name); s += T(inside(S[i], S[(i + 1) % 4], S[(i + 3) % 4], 34), text, { cls: 'gm-lb gm-small' }); }
    else if (part.startsWith('∠')) {
      const [p, v, q] = name.split('').map((x) => V[x]);
      const half = angleAt([v, p, q], 0) / 2;
      s += T(inside(v, p, q, Math.min(90, Math.max(34, (6 + text.length * 3) / Math.sin(half * DEG)))), text, { cls: 'gm-lb gm-small' });
    }
    else {
      const p = V[name[0]], q = V[name[1]];
      if (name.includes('E') || name === 'AC' || name === 'BD') {
        // whole diagonals share a midpoint (E), so their labels sit a third of the way along instead
        const m = name.includes('E') ? mid2(p, q) : add2(p, mul2(sub2(q, p), 0.3)), u = unit2(sub2(q, p));
        s += T(add2(m, mul2([-u[1], u[0]], name === 'BD' ? -12 : 12)), text, { cls: 'gm-lb gm-small' });
      }
      else s += slabel(p, q, c, text, 14, 'gm-lb gm-small');
    }
  }
  return svgWrap(300, 200, s, false);
}
function genQuad(lvl) {
  for (;;) {
    const keys = lvl === 1 ? ['pOppSides', 'pOppAngles', 'rectAngle', 'rhSides'] : lvl === 2 ? ['pOppSides', 'pOppAngles', 'pConsec', 'pDiag', 'rectDiag', 'rhPerp', 'rectAngle', 'rhSides'] : ['pConsec', 'pDiag', 'rectDiag', 'rectHalf', 'rhPerp', 'rhBisect', 'pOppAngles'];
    const key = pick(keys);
    const pr = QUAD_PROPS[key];
    const x = ri(2, 15);
    let v1, v2;
    if (pr.unit === 'deg') {
      if (pr.rel === 'is90') v1 = 90;
      else if (key === 'rhBisect') { v1 = ri(20, 70); v2 = v1; }
      else { v1 = ri(50, 130); v2 = pr.rel === 'eq' ? v1 : 180 - v1; }
    } else { v1 = ri(5, 40); v2 = pr.rel === 'double' ? 2 * v1 : v1; }
    const e1 = [ri(1, 6), 0]; e1[1] = v1 - e1[0] * x;
    let e2 = null;
    if (pr.parts.length > 1) { e2 = [ri(1, 7), 0]; e2[1] = v2 - e2[0] * x; }
    if (Math.abs(e1[1]) > 50 || (e2 && Math.abs(e2[1]) > 60)) continue;
    if (e2 && pr.rel === 'eq' && e1[0] === e2[0]) continue;
    if (e2 && pr.rel === 'double' && 2 * e1[0] === e2[0]) continue;
    const ex = (e) => (pr.unit === 'deg' ? `(${lin(e[0], e[1])})°` : lin(e[0], e[1]));
    const mname = (p) => (p.startsWith('∠') ? `m${p}` : p);
    let setup, p, q, r, s;
    if (pr.rel === 'eq') { setup = `${lin(e1[0], e1[1])} = ${lin(e2[0], e2[1])}`; [p, q, r, s] = [e1[0], e1[1], e2[0], e2[1]]; }
    else if (pr.rel === 'sum180') { setup = `(${lin(e1[0], e1[1])}) + (${lin(e2[0], e2[1])}) = 180`; [p, q, r, s] = [e1[0] + e2[0], e1[1] + e2[1], 0, 180]; }
    else if (pr.rel === 'double') { setup = `2(${lin(e1[0], e1[1])}) = ${lin(e2[0], e2[1])}`; [p, q, r, s] = [2 * e1[0], 2 * e1[1], e2[0], e2[1]]; }
    else { setup = `${lin(e1[0], e1[1])} = 90`; [p, q, r, s] = [e1[0], e1[1], 0, 90]; }
    const askPart = lvl === 1 ? null : pick([null, null, pr.parts[0], ...(key === 'pDiag' ? ['AC'] : [])]);
    const sol = solveLines(p, q, r, s, !askPart, setup);
    if (sol.x.d !== 1 || sol.x.n !== x) continue;
    const lines = [setup, ...sol.lines];
    let val = x;
    // in a parallelogram only half of AC (AE) is given, so the whole diagonal is twice it
    if (askPart === 'AC' && key === 'pDiag') { val = 2 * v1; lines.push(`AE = ${sub1(e1, x)} = ${v1}`, [`AC = 2 × ${v1} = `, String(val)]); }
    else if (askPart) { val = v1; lines.push([`${mname(askPart)} = ${sub1(e1, x)} = `, pr.unit === 'deg' ? `${v1}°` : String(v1)]); }
    const isDeg = askPart && pr.unit === 'deg';
    const W1 = isDeg ? numW('deg') : (v, why) => ({ str: String(v), val: v, why });
    const wrong = [];
    if (!askPart) {
      const alt = (P2, Q2, R2, S2) => { const y = (S2 - Q2) / (P2 - R2); return Number.isInteger(y) && y > 0 ? y : null; };
      if (pr.rel === 'eq' && pr.unit === 'deg') { const y = alt(e1[0] + e2[0], e1[1] + e2[1], 0, 180); if (y) wrong.push(W1(y, 'made them supplementary instead of equal')); }
      if (pr.rel === 'sum180' && e1[0] !== e2[0]) { const y = alt(e1[0], e1[1], e2[0], e2[1]); if (y) wrong.push(W1(y, 'set consecutive angles equal')); }
      if (pr.rel === 'double' && e1[0] !== e2[0]) { const y = alt(e1[0], e1[1], e2[0], e2[1]); if (y) wrong.push(W1(y, 'set half a diagonal equal to a whole one')); }
      if (pr.rel === 'is90') { const y = alt(e1[0], e1[1], 0, 180); if (y) wrong.push(W1(y, 'used 180°')); }
      wrong.push(W1(v1, 'gave the measure instead of x'));
    } else {
      wrong.push(W1(x, 'gave x instead of the measure'));
      if (isDeg) wrong.push(W1(180 - val, 'gave the supplement'));
      if (askPart === 'AC' && key === 'pDiag') wrong.push(W1(v1, 'gave AE, half the diagonal'));
    }
    wrong.push(...fallbacks(val, W1));
    const labels = { [pr.parts[0]]: ex(e1) };
    if (e2) labels[pr.parts[1]] = ex(e2);
    const askName = askPart ? mname(askPart) : 'x';
    return makeQ('quad', {
      level: lvl,
      prompt: `ABCD is a ${SHAPE_NAME[pr.shape]}${pr.diag ? ' whose diagonals meet at E' : ''}. ${pr.parts.map((pt, i) => `${mname(pt)} = ${ex(i ? e2 : e1)}`).join(' and ')}. Find ${askName}.`,
      answer: isDeg ? `${val}°` : String(val),
      ans: !askPart ? { k: 'num', v: Rt(x), names: ['x'], ask: 'x' } : { k: 'num', v: Rt(val), u: isDeg ? 'deg' : 'len:units', names: [askPart.replace('∠', '').toLowerCase(), askPart.replace('∠', '').toLowerCase().split('').reverse().join('')], ask: askName },
      data: { key, e1, e2, ask: askPart || 'x' }, wrong,
      work: works({
        method: [pr.text],
        lines, hintLines: [setup, ['x = ', null]],
        final: [e2 ? `Check: ${mname(pr.parts[0])} = ${v1}${pr.unit === 'deg' ? '°' : ''} and ${mname(pr.parts[1])} = ${v2}${pr.unit === 'deg' ? '°' : ''}.` : `Check: ${mname(pr.parts[0])} = ${v1}°.`],
        hint: [askPart ? `Solve for x, then substitute to find ${askName}.` : 'Solve the equation for x.'],
      }),
      figure: quadFig(pr.shape, pr.diag, labels),
      figureAlt: `${cap(SHAPE_NAME[pr.shape])} ABCD${pr.diag ? ' with diagonals AC and BD meeting at E' : ''}. ${Object.entries(labels).map(([k2, t]) => `${k2.startsWith('∠') ? `Angle ${k2.slice(1)}` : k2} is labelled ${t}`).join('; ')}.`,
      brief: `${pr.text} ${setup}, so x = ${x}${askPart ? ` and ${askName} = ${isDeg ? `${val}°` : val}` : ''}.`,
    });
  }
}

/* ================================================================ Unit 8 */
const unitsW = (k) => `${k} unit${k === 1 ? '' : 's'}`;
function transformOf(kind, a = 0, b = 0) {
  const K = typeof a === 'object' ? a : Rt(a);
  const kS = mm(fstr(K));
  const T = {
    t: { f: ([x, y]) => [radd(x, Rt(a)), radd(y, Rt(b))], desc: `translated ${unitsW(Math.abs(a))} ${a > 0 ? 'right' : 'left'} and ${unitsW(Math.abs(b))} ${b > 0 ? 'up' : 'down'}`, rule: `(x, y) → (x ${a < 0 ? MINUS : '+'} ${Math.abs(a)}, y ${b < 0 ? MINUS : '+'} ${Math.abs(b)})`, name: `Translation ${unitsW(Math.abs(a))} ${a > 0 ? 'right' : 'left'} and ${unitsW(Math.abs(b))} ${b > 0 ? 'up' : 'down'}`, sub: ([x, y]) => `(${n(x)} + ${par(a)}, ${n(y)} + ${par(b)})` },
    rx: { f: ([x, y]) => [x, rmul(y, Rt(-1))], desc: 'reflected across the x-axis', rule: `(x, y) → (x, ${MINUS}y)`, name: 'Reflection across the x-axis', sub: ([x, y]) => `(${n(x)}, ${MINUS}${par(y)})` },
    ry: { f: ([x, y]) => [rmul(x, Rt(-1)), y], desc: 'reflected across the y-axis', rule: `(x, y) → (${MINUS}x, y)`, name: 'Reflection across the y-axis', sub: ([x, y]) => `(${MINUS}${par(x)}, ${n(y)})` },
    rxy: { f: ([x, y]) => [y, x], desc: 'reflected across the line y = x', rule: '(x, y) → (y, x)', name: 'Reflection across the line y = x', sub: ([x, y]) => `(${n(y)}, ${n(x)})` },
    rxny: { f: ([x, y]) => [rmul(y, Rt(-1)), rmul(x, Rt(-1))], desc: `reflected across the line y = ${MINUS}x`, rule: `(x, y) → (${MINUS}y, ${MINUS}x)`, name: `Reflection across the line y = ${MINUS}x`, sub: ([x, y]) => `(${MINUS}${par(y)}, ${MINUS}${par(x)})` },
    r90: { f: ([x, y]) => [rmul(y, Rt(-1)), x], desc: 'rotated 90° counterclockwise about the origin', rule: `(x, y) → (${MINUS}y, x)`, name: 'Rotation 90° counterclockwise about the origin', sub: ([x, y]) => `(${MINUS}${par(y)}, ${n(x)})` },
    r180: { f: ([x, y]) => [rmul(x, Rt(-1)), rmul(y, Rt(-1))], desc: 'rotated 180° about the origin', rule: `(x, y) → (${MINUS}x, ${MINUS}y)`, name: 'Rotation 180° about the origin', sub: ([x, y]) => `(${MINUS}${par(x)}, ${MINUS}${par(y)})` },
    r270: { f: ([x, y]) => [y, rmul(x, Rt(-1))], desc: 'rotated 270° counterclockwise about the origin', rule: `(x, y) → (y, ${MINUS}x)`, name: 'Rotation 90° clockwise about the origin', sub: ([x, y]) => `(${n(y)}, ${MINUS}${par(x)})` },
    d: { f: ([x, y]) => [rmul(x, K), rmul(y, K)], desc: `dilated by a scale factor of ${kS}, centered at the origin`, rule: K.d === 1 ? `(x, y) → (${kS}x, ${kS}y)` : `(x, y) → ((${kS})x, (${kS})y)`, name: `Dilation by a scale factor of ${kS} centered at the origin`, sub: ([x, y]) => `(${kS} × ${par(x)}, ${kS} × ${par(y)})` },
  }[kind];
  return { kind, a, b, ...T };
}
const RULE_TEXT = {
  rx: 'Reflecting across the x-axis keeps x and changes the sign of y.', ry: 'Reflecting across the y-axis changes the sign of x and keeps y.',
  rxy: 'Reflecting across y = x swaps the coordinates.', rxny: 'Reflecting across y = −x swaps the coordinates and changes both signs.',
  r90: 'A 90° counterclockwise rotation about the origin: (x, y) → (−y, x).', r180: 'A 180° rotation about the origin changes both signs.',
  r270: 'A 270° counterclockwise rotation (the same as 90° clockwise): (x, y) → (y, −x).', t: 'A translation adds the same amounts to every point: right/left changes x, up/down changes y.',
  d: 'A dilation centered at the origin multiplies both coordinates by the scale factor.',
};
function genTransform(lvl) {
  for (;;) {
    const P0 = [ri(-8, 8), ri(-8, 8)];
    if (!P0[0] || !P0[1] || Math.abs(P0[0]) === Math.abs(P0[1])) continue;
    const pool1 = ['t', 'rx', 'ry', 'r180'], pool2 = ['t', 'rx', 'ry', 'rxy', 'rxny', 'r90', 'r180', 'r270', 'd'];
    const make = (kind) => {
      if (kind === 't') { let a, b; do { a = ri(-7, 7); b = ri(-7, 7); } while (!a || !b); return transformOf('t', a, b); }
      if (kind === 'd') {
        const opts = [Rt(2), Rt(3)];
        if (P0[0] % 2 === 0 && P0[1] % 2 === 0) opts.push(Rt(1, 2), Rt(3, 2));
        if (P0[0] % 3 === 0 && P0[1] % 3 === 0) opts.push(Rt(1, 3));
        return transformOf('d', pick(opts));
      }
      return transformOf(kind);
    };
    const steps = lvl === 3 && chance(0.6) ? [make(pick(pool2.filter((k) => k !== 'd'))), make(pick(['t', 'rx', 'ry', 'r90', 'r180']))] : [make(pick(lvl === 1 ? pool1 : pool2))];
    if (steps.length === 2 && steps[0].kind === steps[1].kind) continue;
    const P = [Rt(P0[0]), Rt(P0[1])];
    const mids = [P];
    for (const st of steps) mids.push(st.f(mids[mids.length - 1]));
    const img = mids[mids.length - 1];
    if (img.some((c) => Math.abs(rnum(c)) > 16 || c.d !== 1)) continue;
    if (steps.length === 1 && req(img[0], P[0]) && req(img[1], P[1])) continue;
    const answer = pairStr(img[0], img[1]);
    const primes = ['′', '″'];
    const lines = [];
    steps.forEach((st, i) => {
      const from = mids[i], to = mids[i + 1];
      const last = i === steps.length - 1;
      const sub = st.sub(from), res = pairStr(to[0], to[1]);
      if (sub === res) lines.push(last ? [`P${primes[i]} = `, answer] : `P${primes[i]} = ${res}`);
      else lines.push(`P${primes[i]} = ${sub}`, last ? ['= ', answer] : `= ${res}`);
    });
    const [X, Y] = img.map(rnum);
    const wrong = [pairW(Y, X, 'swapped x and y'), pairW(-X, Y, 'sign slip'), pairW(X, -Y, 'sign slip'), pairW(-X, -Y, 'changed both signs')];
    const lastSt = steps[steps.length - 1], prev = mids[mids.length - 2];
    const alt = { r90: 'r270', r270: 'r90', rx: 'ry', ry: 'rx', rxy: 'rxny', rxny: 'rxy' }[lastSt.kind];
    if (alt) wrong.unshift(pairW(...transformOf(alt).f(prev).map(rnum), { r90: 'rotated clockwise instead', r270: 'rotated the wrong way', rx: 'reflected across the wrong axis', ry: 'reflected across the wrong axis', rxy: 'used the other diagonal line', rxny: 'used the other diagonal line' }[lastSt.kind]));
    if (lastSt.kind === 't') wrong.unshift(pairW(rnum(prev[0]) - lastSt.a, rnum(prev[1]) - lastSt.b, 'moved the opposite way'), pairW(rnum(prev[0]) + lastSt.b, rnum(prev[1]) + lastSt.a, 'mixed up the x and y moves'));
    if (lastSt.kind === 'd') wrong.unshift(pairW(radd(toR(prev[0]), toR(lastSt.a)), radd(toR(prev[1]), toR(lastSt.a)), 'added the scale factor instead of multiplying'));
    const desc = steps.map((st) => st.desc).join(', then ');
    const needLines = steps.map((st) => st.kind).filter((k) => k === 'rxy' || k === 'rxny').map((k) => (k === 'rxy' ? 'y=x' : 'y=-x'));
    return makeQ('transform', {
      level: lvl, prompt: `Point P${ptStr(P0)} is ${desc}. What are the coordinates of its image P${primes[steps.length - 1]}?`,
      answer, ans: { k: 'pair', x: img[0], y: img[1] },
      data: { P: P0, steps: steps.map((st) => ({ kind: st.kind, a: typeof st.a === 'object' ? [st.a.n, st.a.d] : st.a, b: st.b })) }, wrong,
      work: works({
        method: steps.map((st) => `${cap(st.desc)}: ${st.rule}. ${RULE_TEXT[st.kind]}`),
        lines, hintLines: [[`P${primes[steps.length - 1]} = `, null]],
        final: ['Plot both points to check: the image should land where the description says.'], hint: ['Apply the rule to the coordinates of P.'],
      }),
      figure: gridFig({ pts: [{ p: P0, label: `P${ptStr(P0)}` }], lines: needLines }),
      figureAlt: `A coordinate grid with point P at ${ptStr(P0)}${needLines.length ? ` and the line ${needLines.map((l) => (l === 'y=x' ? 'y = x' : `y = ${MINUS}x`)).join(' and ')} drawn` : ''}.`,
      brief: `${steps.map((st) => st.rule).join(', then ')}: P${ptStr(P0)} → ${answer}`,
    });
  }
}
function genRule(lvl) {
  for (;;) {
    const pre = [[ri(-5, 6), ri(-5, 6)], [ri(-5, 6), ri(-5, 6)], [ri(-5, 6), ri(-5, 6)]];
    const area2 = Math.abs((pre[1][0] - pre[0][0]) * (pre[2][1] - pre[0][1]) - (pre[2][0] - pre[0][0]) * (pre[1][1] - pre[0][1]));
    if (area2 < 6) continue;
    const kinds = lvl === 1 ? ['t', 'rx', 'ry', 'r180'] : ['t', 'rx', 'ry', 'rxy', 'rxny', 'r90', 'r180', 'r270', 'd'];
    const mk = (kind) => {
      if (kind === 't') { let a, b; do { a = ri(-6, 6); b = ri(-6, 6); } while (!a || !b); return transformOf('t', a, b); }
      if (kind === 'd') return transformOf('d', Rt(2));
      return transformOf(kind);
    };
    const T0 = mk(pick(kinds));
    const R = pre.map((p) => p.map((v) => Rt(v)));
    const img = R.map((p) => T0.f(p));
    if (img.some((p) => p.some((c) => Math.abs(rnum(c)) > 11 || c.d !== 1))) continue;
    const same = (T2) => R.every((p, i) => { const q = T2.f(p); return req(q[0], img[i][0]) && req(q[1], img[i][1]); });
    const cands = shuffle([
      ...['rx', 'ry', 'rxy', 'rxny', 'r90', 'r180', 'r270'].map((k) => transformOf(k)),
      transformOf('d', Rt(2)), transformOf('d', Rt(1, 2)),
      ...(T0.kind === 't' ? [transformOf('t', -T0.a, -T0.b), transformOf('t', T0.b, T0.a), transformOf('t', T0.a, -T0.b)] : [transformOf('t', ri(1, 4), -ri(1, 4))]),
    ]);
    const label = (t) => (lvl === 3 ? t.rule : t.name);
    const opts = [T0];
    for (const c of cands) {
      if (opts.length === 4) break;
      if (same(c) || opts.some((o) => label(o) === label(c))) continue;
      if (lvl === 1 && ['rxy', 'rxny', 'd'].includes(c.kind) && chance(0.5)) continue;
      opts.push(c);
    }
    if (opts.length < 4) continue;
    const answer = label(T0);
    const imgI = img.map((p) => p.map(rnum));
    const N = ['A', 'B', 'C'];
    const change = T0.kind === 't' ? `Every x-coordinate ${T0.a > 0 ? 'increases' : 'decreases'} by ${Math.abs(T0.a)} and every y-coordinate ${T0.b > 0 ? 'increases' : 'decreases'} by ${Math.abs(T0.b)}.` : `Each vertex follows the rule ${T0.rule}.`;
    const work = (full) => W(
      P('Compare each vertex with its image:'),
      el('ul', { class: 'gm-list' }, ...N.map((v, i) => el('li', {}, `${v}${ptStr(pre[i])} → ${v}′${ptStr(imgI[i])}`))),
      full ? P(change, ' ', RULE_TEXT[T0.kind]) : aside('Look at how x and y change: the same amount added (a translation), signs changing (a reflection or rotation), coordinates swapping, or everything multiplied (a dilation).'),
      full ? P('So the transformation is ', boxed(answer), '.') : null,
    );
    return makeQ('rule', {
      level: lvl, type: 'mc', prompt: 'Which transformation maps △ABC onto △A′B′C′?', answer, options: shuffle(opts.map(label)),
      data: { pre, img: imgI }, work,
      figure: gridFig({ polys: [{ pts: pre, cls: 'gm-shape', labels: N }, { pts: imgI, cls: 'gm-shape2', labels: N.map((v) => `${v}′`) }] }),
      figureAlt: `A coordinate grid with triangle ABC at A${ptStr(pre[0])}, B${ptStr(pre[1])}, C${ptStr(pre[2])} and its image A′B′C′ at A′${ptStr(imgI[0])}, B′${ptStr(imgI[1])}, C′${ptStr(imgI[2])}.`,
      brief: `${change.replace(/\.$/, '')}: ${answer}.`,
    });
  }
}

/* ================================================================ Unit 9 */
const PI_TXT = 'Leave your answer in terms of π.';
const ROUND_TXT = 'Use the π key on your calculator and round to the nearest tenth.';
function circleFig({ radiusLabel = '', diameter = false, sector = null, extra = '' } = {}) {
  const w = 240, h = 200, c = [120, 100], R = 76;
  let s = `<circle cx="${c[0]}" cy="${c[1]}" r="${R}" class="gm-shape"/>` + DOT(c) + T(add2(c, [-9, 11]), 'O', { cls: 'gm-vx' });
  if (sector) {
    const [a0, a1] = sector.angles;
    const p0 = add2(c, [Math.cos(a0 * DEG) * R, -Math.sin(a0 * DEG) * R]), p1 = add2(c, [Math.cos(a1 * DEG) * R, -Math.sin(a1 * DEG) * R]);
    const large = a1 - a0 > 180 ? 1 : 0;
    s += `<path d="M${f1(c[0])} ${f1(c[1])} L${f1(p0[0])} ${f1(p0[1])} A${R} ${R} 0 ${large} 0 ${f1(p1[0])} ${f1(p1[1])} Z" class="${sector.fill ? 'gm-sector' : 'gm-nofill gm-seg'}"/>`;
    s += `<path d="M${f1(p0[0])} ${f1(p0[1])} A${R} ${R} 0 ${large} 0 ${f1(p1[0])} ${f1(p1[1])}" class="gm-hl" fill="none"/>`;
    const mid = (a0 + a1) / 2;
    s += arcs(c, p0, p1, 1, 16, 'gm-mark').replace(/A16 16 0 0 [01]/, `A16 16 0 ${large} 0`);
    s += T(add2(c, [Math.cos(mid * DEG) * 32, -Math.sin(mid * DEG) * 32]), sector.label, { cls: 'gm-lb gm-small' });
    if (radiusLabel) s += T(add2(mid2(c, p0), [Math.sin(a0 * DEG) * 11, Math.cos(a0 * DEG) * 11]), radiusLabel, { cls: 'gm-lb gm-small' });
  } else if (radiusLabel) {
    const a = -25;
    const p = add2(c, [Math.cos(a * DEG) * R, -Math.sin(a * DEG) * R]);
    const q = diameter ? add2(c, [-Math.cos(a * DEG) * R, Math.sin(a * DEG) * R]) : c;
    s += L(q, p, 'gm-hl') + DOT(p) + (diameter ? DOT(q) : '');
    s += T(add2(mid2(diameter ? c : q, p), [4, -11]), radiusLabel, { cls: 'gm-lb gm-small' });
  }
  return svgWrap(w, h, s + extra, true);
}
function genCircle(lvl) {
  for (;;) {
    const u = pick(LUNITS);
    const r = ri(2, lvl === 1 ? 12 : 16);
    const useD = lvl > 1 && chance(0.4);
    const ask = pick(['C', 'A']);
    const form = lvl === 1 ? 'pi' : lvl === 2 ? pick(['pi', 'round']) : pick(['round', 'reverse', 'pi']);
    const coef = ask === 'C' ? 2 * r : r * r;
    const U = ask === 'C' ? `len:${u}` : `area:${u}`;
    const word = ask === 'C' ? 'circumference' : 'area';
    const names = ask === 'C' ? ['c', 'circumference'] : ['a', 'area'];
    if (form === 'reverse') {
      const given = ask === 'C' ? `a circumference of ${coef}π ${u}` : `an area of ${coef}π ${u}²`;
      const lines = ask === 'C' ? [`2πr = ${coef}π`, `r = ${coef}π ÷ 2π`, ['= ', `${r} ${u}`]] : [`πr² = ${coef}π`, `r² = ${coef}`, `r = √${coef}`, ['= ', `${r} ${u}`]];
      const W1 = (v, why) => ({ str: `${v} ${u}`, val: v, why });
      const wrong = ask === 'C' ? [W1(2 * r, 'gave the diameter'), W1(4 * r, 'multiplied instead of dividing'), W1(r * r, 'squared the radius')] : [W1(r * r, 'forgot the square root'), W1(2 * r, 'gave the diameter'), ...(Number.isInteger(coef / 2) ? [W1(coef / 2, 'halved instead of taking the square root')] : [])];
      wrong.push(...fallbacks(r, W1));
      return makeQ('circle', {
        level: lvl, prompt: `A circle has ${given}. Find its radius.`, answer: `${r} ${u}`,
        ans: { k: 'num', v: Rt(r), u: `len:${u}`, names: ['r', 'radius'], ask: 'r' },
        data: { mode: 'reverse', ask, coef, unit: u }, wrong,
        work: works({
          method: [ask === 'C' ? 'Circumference: C = 2πr. Set it equal to the given value and solve for r.' : 'Area: A = πr². Set it equal to the given value and solve for r.'],
          lines, hintLines: [lines[0], ['r = ', null]],
          final: [`Check: a radius of ${r} ${u} gives ${ask === 'C' ? `C = 2π(${r}) = ${coef}π` : `A = π(${r})² = ${coef}π`}.`], hint: ['Divide both sides by the π part first.'],
        }),
        figure: circleFig({ radiusLabel: 'r' }), figureAlt: 'A circle with center O and a radius labelled r.',
        brief: ask === 'C' ? `2πr = ${coef}π, so r = ${r}` : `πr² = ${coef}π, so r = √${coef} = ${r}`,
      });
    }
    const exactV = coef * Math.PI;
    if (form === 'round' && nearTie(exactV, 1)) continue;
    const answer = form === 'pi' ? `${coef}π${uSuffix(U)}` : `${roundStr(exactV, 1)}${uSuffix(U)}`;
    const start = useD ? [`r = ${2 * r} ÷ 2 = ${r}`] : [];
    const lines = ask === 'C'
      ? [...start, 'C = 2πr', `= 2π(${r})`, form === 'pi' ? ['= ', answer] : `= ${coef}π`]
      : [...start, 'A = πr²', `= π(${r})²`, form === 'pi' ? ['= ', answer] : `= ${coef}π`];
    if (form === 'round') lines.push(`≈ ${more(exactV, 1)}`, ['≈ ', answer]);
    const Wv = (c, why) => (form === 'pi' ? { str: `${c}π${uSuffix(U)}`, val: c * Math.PI, why } : { str: `${roundStr(c * Math.PI, 1)}${uSuffix(U)}`, val: Number(roundStr(c * Math.PI, 1)), why });
    const wrong = [
      Wv(ask === 'C' ? 4 * r : 4 * r * r, useD ? 'used the diameter as the radius' : 'doubled the radius first'),
      Wv(ask === 'C' ? r * r : 2 * r, ask === 'C' ? 'used the area formula' : 'used the circumference formula'),
      Wv(ask === 'C' ? r : 2 * r * r, ask === 'C' ? 'forgot the 2' : 'squared the diameter by mistake'),
    ];
    if (form === 'pi') wrong.unshift({ str: `${coef}${uSuffix(U)}`, val: coef, why: 'dropped the π' });
    else {
      const t = Number(roundStr(coef * 3.14, 1));
      if (roundStr(t, 1) !== roundStr(exactV, 1)) wrong.unshift({ str: `${roundStr(t, 1)}${uSuffix(U)}`, val: t, why: 'used 3.14 for π' });
      wrong.push({ str: `${coef}${uSuffix(U)}`, val: coef, why: 'dropped the π' });
    }
    wrong.push(...[1, 2, 3].map((d) => Wv(coef + d, 'arithmetic slip')));
    return makeQ('circle', {
      level: lvl,
      prompt: `A circle has a ${useD ? 'diameter' : 'radius'} of ${useD ? 2 * r : r} ${u}. Find its ${word}. ${form === 'pi' ? PI_TXT : ROUND_TXT}`,
      answer,
      ans: form === 'pi' ? { k: 'pi', c: Rt(coef), u: U, names, ask: word } : { k: 'round', v: exactV, dp: 1, u: U, names, ask: word, pic: Rt(coef) },
      data: { mode: form, ask, r: useD ? null : r, d: useD ? 2 * r : null, unit: u }, wrong,
      work: works({
        method: [ask === 'C' ? 'Circumference: C = 2πr (or πd).' : 'Area: A = πr².', ...(useD ? ['The diameter is given, so halve it to get the radius.'] : [])],
        lines, hintLines: [...start, lines[start.length], lines[start.length + 1], ['= ', null]],
        final: [form === 'pi' ? 'In terms of π means keep π as a symbol: the number in front is how many π\'s.' : `Round ${more(exactV, 1)}… to the nearest tenth.`], hint: [ask === 'C' ? 'Multiply 2 × r, and keep the π.' : 'Square the radius, and keep the π.'],
      }),
      figure: circleFig({ radiusLabel: useD ? `${2 * r} ${u}` : `${r} ${u}`, diameter: useD }),
      figureAlt: `A circle with center O and a ${useD ? 'diameter' : 'radius'} labelled ${useD ? 2 * r : r} ${u}.`,
      brief: ask === 'C' ? `C = 2π(${r}) = ${coef}π${form === 'round' ? ` ≈ ${roundStr(exactV, 1)}` : ''}` : `A = π(${r})² = ${coef}π${form === 'round' ? ` ≈ ${roundStr(exactV, 1)}` : ''}`,
    });
  }
}
function genArc(lvl) {
  for (;;) {
    const u = pick(LUNITS);
    const th = pick([30, 40, 45, 60, 72, 90, 120, 135, 144, 150, 180, 210, 240, 270, 300]);
    const r = ri(2, 18);
    const ask = pick(['arc', 'sector']);
    const coef = ask === 'arc' ? Rt(th * r, 180) : Rt(th * r * r, 360);
    const form = lvl === 1 ? 'pi' : lvl === 2 ? pick(['pi', 'pi', 'round']) : pick(['round', 'round', 'pi']);
    if (form === 'pi' && (lvl === 1 ? coef.d !== 1 : !(coef.d === 1 || coef.d === 2))) continue;
    if (form === 'round' && !terminates(coef) && lvl < 3) continue;
    const exactV = rnum(coef) * Math.PI;
    if (form === 'round' && nearTie(exactV, 1)) continue;
    const U = ask === 'arc' ? `len:${u}` : `area:${u}`;
    const cs = terminates(coef) ? n(coef) : `(${fstr(coef)})`;
    const answer = form === 'pi' ? `${cs}π${uSuffix(U)}` : `${roundStr(exactV, 1)}${uSuffix(U)}`;
    const fr = fstr(Rt(th, 360));
    const lines = ask === 'arc'
      ? ['arc length = (θ ÷ 360) × 2πr', `= (${th} ÷ 360) × 2π(${r})`, `= ${fr} × ${2 * r}π`]
      : ['sector area = (θ ÷ 360) × πr²', `= (${th} ÷ 360) × π(${r})²`, `= ${fr} × ${r * r}π`];
    if (form === 'pi') lines.push(['= ', answer]); else lines.push(`= ${cs}π`, `≈ ${more(exactV, 1)}`, ['≈ ', answer]);
    const full = ask === 'arc' ? Rt(2 * r) : Rt(r * r);
    const other = ask === 'arc' ? Rt(th * r * r, 360) : Rt(th * r, 180);
    const Wc = (c, why) => {
      const v = rnum(c) * Math.PI;
      return form === 'pi' ? { str: `${terminates(c) ? n(c) : `(${fstr(c)})`}π${uSuffix(U)}`, val: v, why } : { str: `${roundStr(v, 1)}${uSuffix(U)}`, val: Number(roundStr(v, 1)), why };
    };
    const wrong = [Wc(full, 'found the whole circle'), Wc(rmul(coef, Rt(2)), 'used θ ÷ 180 instead of θ ÷ 360'), Wc(other, ask === 'arc' ? 'used the sector-area formula' : 'used the arc-length formula'), Wc(rdiv(coef, Rt(2)), 'arithmetic slip'), Wc(radd(coef, Rt(1)), 'arithmetic slip')];
    if (form === 'pi') wrong.unshift({ str: `${n(rq(Math.round(rnum(coef) * 10000) / 10000))}${uSuffix(U)}`, val: rnum(coef), why: 'dropped the π' });
    return makeQ('arc', {
      level: lvl,
      prompt: ask === 'arc' ? `A circle has a radius of ${r} ${u}. Find the length of an arc with a central angle of ${th}°. ${form === 'pi' ? PI_TXT : ROUND_TXT}` : `Find the area of a sector with a central angle of ${th}° in a circle with a radius of ${r} ${u}. ${form === 'pi' ? PI_TXT : ROUND_TXT}`,
      answer,
      ans: form === 'pi' ? { k: 'pi', c: coef, u: U, names: ask === 'arc' ? ['s', 'l', 'arc', 'arclength'] : ['a', 'area', 'sector'], ask: ask === 'arc' ? 'the arc length' : 'the sector area' } : { k: 'round', v: exactV, dp: 1, u: U, names: ask === 'arc' ? ['s', 'l', 'arc', 'arclength'] : ['a', 'area', 'sector'], ask: 'the answer', pic: coef },
      data: { ask, theta: th, r, form, unit: u }, wrong,
      work: works({
        method: [`The ${ask === 'arc' ? 'arc' : 'sector'} is ${th}/360 of the whole circle, so take that fraction of the ${ask === 'arc' ? 'circumference 2πr' : 'area πr²'}.`],
        lines, hintLines: [lines[0], lines[1], ['= ', null]],
        final: [form === 'pi' ? `${fr} of the circle's ${ask === 'arc' ? `circumference, ${2 * r}π` : `area, ${r * r}π`}.` : `Round ${more(exactV, 1)}… to the nearest tenth.`], hint: [`Simplify ${th}/360 first.`],
      }),
      figure: circleFig({ sector: { angles: [20, 20 + th], label: `${th}°`, fill: ask === 'sector' }, radiusLabel: `${r} ${u}` }),
      figureAlt: `A circle with center O. Two radii of ${r} ${u} make a central angle of ${th}°; the ${ask === 'arc' ? 'arc between them is highlighted' : 'sector between them is shaded'}.`,
      brief: `${fr} × ${ask === 'arc' ? `${2 * r}π` : `${r * r}π`} = ${cs}π${form === 'round' ? ` ≈ ${roundStr(exactV, 1)}` : ''}`,
    });
  }
}
function genInscribed(lvl) {
  const mode = pick(lvl === 1 ? ['central', 'inscribed', 'inscribed'] : lvl === 2 ? ['inscribed', 'arcFromIns', 'centralToIns', 'central'] : ['arcFromIns', 'centralToIns', 'quad', 'semi', 'inscribed']);
  const arc = 2 * ri(20, 85);
  const c = [150, 104], R = 80;
  const at = (deg) => add2(c, [Math.cos(deg * DEG) * R, -Math.sin(deg * DEG) * R]);
  const a0 = ri(200, 320);
  let s = `<circle cx="${c[0]}" cy="${c[1]}" r="${R}" class="gm-shape"/>` + DOT(c) + T(add2(c, [0, 14]), 'O', { cls: 'gm-vx' });
  const lab = (deg, t) => T(add2(c, [Math.cos(deg * DEG) * (R + 14), -Math.sin(deg * DEG) * (R + 14)]), t, { cls: 'gm-vx' });
  let prompt, val, lines, method, names, wrong, alt, data;
  const W1 = numW('deg');
  if (mode === 'quad') {
    const angsAt = [a0, a0 + ri(60, 100), a0 + ri(160, 200), a0 + ri(250, 300)];
    const V = angsAt.map(at);
    s += PG(V, 'gm-shape gm-nofill') + ['A', 'B', 'C', 'D'].map((t, i) => lab(angsAt[i], t)).join('');
    // the true angle at A from the drawing is not used — the figure is labelled, not measured
    const a = ri(55, 125);
    val = 180 - a;
    s += T(inside(V[0], V[1], V[3], 30), `${a}°`, { cls: 'gm-lb gm-small' }) + T(inside(V[2], V[3], V[1], 30), '?', { cls: 'gm-lb gm-small' });
    prompt = `Quadrilateral ABCD is inscribed in a circle, and m∠A = ${a}°. Find m∠C.`;
    method = 'Opposite angles of a quadrilateral inscribed in a circle are supplementary.';
    lines = [[`m∠C = 180° ${MINUS} ${a}° = `, `${val}°`]];
    names = ['c', 'bcd', 'dcb'];
    wrong = [W1(a, 'made the opposite angles equal'), W1(360 - a, 'used 360°'), ...(a < 90 ? [W1(90 - a, 'used 90°')] : []), ...fallbacks(val, W1)];
    alt = `Quadrilateral ABCD inscribed in a circle, with angle A labelled ${a}° and angle C marked with a question mark.`;
    data = { mode, a };
    return makeQ('inscribed', {
      level: lvl, prompt, answer: `${val}°`, ans: { k: 'num', v: Rt(val), u: 'deg', names, ask: 'm∠C' }, data, wrong,
      work: works({ method: [method], lines, hintLines: [[lines[0][0], null]], final: [`Check: ${a}° + ${val}° = 180°.`], hint: ['Opposite angles add up to 180°.'] }),
      figure: svgWrap(300, 210, s, false), figureAlt: alt, brief: `${method} 180° − ${a}° = ${val}°`,
    });
  }
  if (mode === 'semi') {
    const g = ri(20, 70);
    const A = at(a0), B = at(a0 + 180), cAng = a0 + 180 - 2 * g;
    const C = at(cAng);
    s += L(A, B, 'gm-seg') + PG([A, B, C], 'gm-shape gm-nofill') + lab(a0, 'A') + lab(a0 + 180, 'B') + lab(cAng, 'C');
    s += T(inside(A, B, C, 36), `${g}°`, { cls: 'gm-lb gm-small' }) + T(inside(B, A, C, 30), '?', { cls: 'gm-lb gm-small' });
    val = 90 - g;
    prompt = `AB is a diameter of circle O and C is another point on the circle. m∠CAB = ${g}°. Find m∠ABC.`;
    lines = ['m∠ACB = 90°', [`m∠ABC = 180° ${MINUS} 90° ${MINUS} ${g}° = `, `${val}°`]];
    wrong = [W1(g, 'made the two angles equal'), W1(180 - g, 'subtracted only the known angle from 180°'), W1(90 + g, 'added instead of subtracting'), ...fallbacks(val, W1)];
    return makeQ('inscribed', {
      level: lvl, prompt, answer: `${val}°`, ans: { k: 'num', v: Rt(val), u: 'deg', names: ['b', 'abc', 'cba'], ask: 'm∠ABC' }, data: { mode, g }, wrong,
      work: works({ method: ['An angle inscribed in a semicircle is a right angle: ∠ACB intercepts a 180° arc, so it measures 90°.', 'Then the triangle\'s angles add up to 180°.'], lines, hintLines: [lines[0], ['m∠ABC = ', null]], final: [], hint: ['Find ∠ACB first.'] }),
      figure: svgWrap(300, 210, s, false), figureAlt: `Circle O with diameter AB and point C on the circle, forming triangle ABC. Angle CAB is labelled ${g}° and angle ABC is marked with a question mark.`,
      brief: `∠ACB = 90°, so m∠ABC = 90° − ${g}° = ${val}°`,
    });
  }
  const A = at(a0), B = at(a0 + arc);
  const cAng = a0 + arc + (360 - arc) * (0.35 + Math.random() * 0.3);
  const C = at(cAng);
  const arcMid = a0 + arc / 2;
  const arcLabel = (t) => T(add2(c, [Math.cos(arcMid * DEG) * (R + 16), -Math.sin(arcMid * DEG) * (R + 16)]), t, { cls: 'gm-lb gm-small' });
  s += `<path d="M${f1(A[0])} ${f1(A[1])} A${R} ${R} 0 0 0 ${f1(B[0])} ${f1(B[1])}" class="gm-hl" fill="none"/>`;
  s += lab(a0, 'A') + lab(a0 + arc, 'B') + DOT(A) + DOT(B);
  const central = mode === 'central' || mode === 'centralToIns';
  const insc = mode !== 'central';
  if (central) s += L(c, A, 'gm-seg') + L(c, B, 'gm-seg');
  if (insc) s += L(C, A, 'gm-seg') + L(C, B, 'gm-seg') + DOT(C) + lab(cAng, 'C');
  if (mode === 'central') {
    val = arc; s += arcLabel(`${arc}°`) + T(inside(c, A, B, 26), '?', { cls: 'gm-lb gm-small' });
    prompt = `Points A and B are on circle O, and arc AB measures ${arc}°. Find the measure of the central angle ∠AOB.`;
    method = ['A central angle has the same measure as the arc it intercepts.']; lines = [['m∠AOB = ', `${val}°`]]; names = ['aob', 'boa', 'o'];
    wrong = [W1(arc / 2, 'halved it (that is the inscribed-angle rule)'), W1(2 * arc, 'doubled it'), W1(360 - arc, 'used the major arc'), W1(180 - arc, 'gave the supplement')];
    alt = `Circle O with central angle AOB; arc AB is labelled ${arc}° and the angle at O is marked with a question mark.`;
  } else if (mode === 'inscribed') {
    val = arc / 2; s += arcLabel(`${arc}°`) + T(inside(C, A, B, 30), '?', { cls: 'gm-lb gm-small' });
    prompt = `Points A, B and C are on circle O. Arc AB measures ${arc}°, and inscribed angle ∠ACB intercepts it. Find m∠ACB.`;
    method = ['Inscribed Angle Theorem: an inscribed angle is half of its intercepted arc.']; lines = [[`m∠ACB = ${arc}° ÷ 2 = `, `${val}°`]]; names = ['acb', 'bca', 'c'];
    wrong = [W1(arc, 'used the arc itself (that is a central angle)'), W1(2 * arc, 'doubled instead of halving'), W1(180 - arc / 2, 'gave the supplement'), W1((360 - arc) / 2, 'used the other arc')];
    alt = `Circle O with inscribed angle ACB intercepting arc AB, which is labelled ${arc}°; the angle at C is marked with a question mark.`;
  } else if (mode === 'arcFromIns') {
    const i = arc / 2; val = arc;
    s += arcLabel('?') + T(inside(C, A, B, 30), `${i}°`, { cls: 'gm-lb gm-small' });
    prompt = `Inscribed angle ∠ACB measures ${i}° and intercepts arc AB of circle O. Find the measure of arc AB.`;
    method = ['Inscribed Angle Theorem: the intercepted arc is twice the inscribed angle.']; lines = [[`arc AB = 2 × ${i}° = `, `${val}°`]]; names = ['ab', 'arcab', 'mab', 'marcab'];
    wrong = [W1(i, 'made the arc equal to the angle'), W1(i / 2, 'halved instead of doubling'), W1(360 - arc, 'gave the major arc'), W1(180 - i, 'gave the supplement')];
    alt = `Circle O with inscribed angle ACB labelled ${i}°, intercepting arc AB, which is marked with a question mark.`;
  } else {
    val = arc / 2; s += T(inside(c, A, B, 26), `${arc}°`, { cls: 'gm-lb gm-small' }) + T(inside(C, A, B, 30), '?', { cls: 'gm-lb gm-small' });
    prompt = `In circle O, central angle ∠AOB measures ${arc}°. Inscribed angle ∠ACB intercepts the same arc AB. Find m∠ACB.`;
    method = ['The central angle equals the arc, and the inscribed angle is half of the same arc.']; lines = [`arc AB = ${arc}°`, [`m∠ACB = ${arc}° ÷ 2 = `, `${val}°`]]; names = ['acb', 'bca', 'c'];
    wrong = [W1(arc, 'made the inscribed angle equal to the central angle'), W1(2 * arc, 'doubled instead of halving'), W1(180 - arc / 2, 'gave the supplement'), W1(180 - arc, 'subtracted from 180°')];
    alt = `Circle O with central angle AOB labelled ${arc}° and inscribed angle ACB, which intercepts the same arc AB and is marked with a question mark.`;
  }
  wrong = wrong.filter((w) => w.val > 0).concat(fallbacks(val, W1));
  return makeQ('inscribed', {
    level: lvl, prompt, answer: `${val}°`, ans: { k: 'num', v: Rt(val), u: 'deg', names, ask: mode === 'arcFromIns' ? 'arc AB' : mode === 'central' ? 'm∠AOB' : 'm∠ACB' },
    data: { mode, arc }, wrong,
    work: works({ method, lines, hintLines: [...lines.slice(0, -1), [lines[lines.length - 1][0], null]], final: [], hint: ['Is the angle\'s vertex at the center (central) or on the circle (inscribed)?'] }),
    figure: svgWrap(300, 210, s, true), figureAlt: alt, brief: `${method[method.length - 1]} So the answer is ${val}°.`,
  });
}
function circleEq(h, k, r2) {
  const t = (v, x) => (v === 0 ? `${x}²` : `(${x} ${v > 0 ? MINUS : '+'} ${Math.abs(v)})²`);
  return `${t(h, 'x')} + ${t(k, 'y')} = ${r2}`;
}
function genCircEq(lvl) {
  for (;;) {
    const h = ri(-9, 9), k = ri(-9, 9);
    if (!h && !k) continue;
    if (lvl === 1 && (!h || !k)) continue;
    const general = lvl === 3 && chance(0.5);
    if (general && (!h || !k)) continue;
    const radical = lvl === 3 && !general;
    const r = ri(2, lvl === 1 ? 10 : 12);
    const r2 = radical ? pick([5, 8, 10, 12, 13, 18, 20, 24, 27, 28, 32, 40, 45, 50, 52, 63, 72, 75]) : r * r;
    const ask = pick(['center', 'radius']);
    const std = circleEq(h, k, r2);
    let eq = std, gLines = [];
    if (general) {
      const D = -2 * h, E = -2 * k, F = h * h + k * k - r2;
      const term = (c, v) => (c ? ` ${c < 0 ? MINUS : '+'} ${Math.abs(c)}${v}` : '');
      eq = `x² + y²${term(D, 'x')}${term(E, 'y')}${term(F, '')} = 0`;
      gLines = [
        `x²${term(D, 'x')} + y²${term(E, 'y')} = ${n(-F)}`,
        `(x²${term(D, 'x')} + ${h * h}) + (y²${term(E, 'y')} + ${k * k}) = ${n(-F)} + ${h * h} + ${k * k}`,
        std,
      ];
    }
    const { a: ra, b: rb } = simplifyRoot(r2);
    const center = pairStr(h, k);
    const rStr = rb === 1 ? String(ra) : radStr(ra, rb);
    const answer = ask === 'center' ? center : `${rStr} units`;
    const ans = ask === 'center' ? { k: 'pair', x: Rt(h), y: Rt(k) } : rb === 1 ? { k: 'num', v: Rt(ra), u: 'len:units', names: ['r', 'radius'], ask: 'r' } : { k: 'rad', a: ra, b: rb, u: 'len:units', names: ['r', 'radius'], ask: 'r' };
    const lines = [...gLines];
    if (ask === 'center') lines.push(`h = ${n(h)}, k = ${n(k)}`, ['center = ', center]);
    else if (rb === 1) lines.push([`r = √${r2} = `, answer]);
    else lines.push(`r = √${r2}`, ...(ra > 1 ? [`= √${ra * ra} × √${rb}`] : []), ['= ', answer]);
    const wrong = ask === 'center'
      ? [pairW(-h, -k, 'kept the signs from the equation'), pairW(k, h, 'swapped x and y'), pairW(h, -k, 'sign slip'), pairW(-h, k, 'sign slip')]
      : [{ str: `${r2} units`, val: r2, why: 'forgot the square root' }, ...(r2 % 2 === 0 ? [{ str: `${r2 / 2} units`, val: r2 / 2, why: 'halved instead of taking the square root' }] : []), { str: `${rb === 1 ? 2 * ra : radStr(2 * ra, rb)} units`, val: 2 * Math.sqrt(r2), why: 'gave the diameter' }, { str: `${rb === 1 ? ra + 1 : radStr(ra + 1, rb)} units`, val: (ra + 1) * Math.sqrt(rb), why: 'arithmetic slip' }];
    const sign = (v, x) => (v === 0 ? `${x}² = (${x} ${MINUS} 0)², so the coordinate is 0` : v > 0 ? `(${x} ${MINUS} ${v})² gives ${v}` : `(${x} + ${-v})² = (${x} ${MINUS} (${MINUS}${-v}))² gives ${MINUS}${-v}`);
    return makeQ('circeq', {
      level: lvl, prompt: `A circle has the equation ${eq}. What is its ${ask}?${ask === 'radius' && rb !== 1 ? ' Give the exact answer in simplest radical form.' : ''}`,
      answer, ans, data: { h, k, r2, general, ask, eq }, wrong,
      work: works({
        method: [...(general ? ['Complete the square for x and for y to get standard form.'] : []), 'Standard form (x − h)² + (y − k)² = r² has center (h, k) and radius √(r²).', ...(ask === 'center' ? [`${sign(h, 'x')}; ${sign(k, 'y')}. The signs flip because the formula subtracts h and k.`] : [])],
        lines, hintLines: [...gLines.slice(0, 1), [ask === 'center' ? 'center = ' : 'r = ', null]],
        final: [ask === 'radius' ? 'The number on the right is r², not r.' : 'Check: substituting the center into the left side gives 0 + 0.'], hint: [ask === 'center' ? 'Read h and k from inside the brackets — and flip their signs.' : 'The right side is r².'],
      }),
      brief: ask === 'center' ? `${std} → center ${center}` : `r² = ${r2}, so r = ${rStr}`,
    });
  }
}
const TAN_TRIPLES = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15], [7, 24, 25], [12, 16, 20]];
function tangentFig(labels) {
  const w = 300, h = 200, O = [95, 100], R = 58;
  const tA = 62;
  const Tp = add2(O, [Math.cos(tA * DEG) * R, -Math.sin(tA * DEG) * R]);
  const u = [Math.sin(tA * DEG), Math.cos(tA * DEG)];
  const Pp = add2(Tp, mul2(u, 150));
  // B: where segment OP crosses the circle (drawn only when PB is asked for)
  const Bp = add2(O, mul2(unit2(sub2(Pp, O)), R));
  let s = `<circle cx="${O[0]}" cy="${O[1]}" r="${R}" class="gm-shape"/>` + L(O, Tp, 'gm-seg') + L(Tp, Pp, labels.PB ? 'gm-seg' : 'gm-hl') + L(O, Pp, 'gm-dash') + rightMark(Tp, O, Pp, 9);
  if (labels.PB) s += L(Bp, Pp, 'gm-hl') + DOT(Bp) + T(add2(Bp, [3, 13]), 'B', { cls: 'gm-vx' }) + T(add2(mid2(Bp, Pp), [2, 14]), labels.PB, { cls: 'gm-lb gm-small' });
  s += DOT(O) + DOT(Tp) + DOT(Pp) + T(add2(O, [-12, 4]), 'O', { cls: 'gm-vx' }) + T(add2(Tp, [-4, -13]), 'T', { cls: 'gm-vx' }) + T(add2(Pp, [10, 4]), 'P', { cls: 'gm-vx' });
  if (labels.r) s += T(add2(mid2(O, Tp), [-14, -2]), labels.r, { a: 'end', cls: 'gm-lb gm-small' });
  if (labels.PT) s += T(add2(mid2(Tp, Pp), [8, -10]), labels.PT, { a: 'start', cls: 'gm-lb gm-small' });
  if (labels.OP) s += T(add2(mid2(O, Pp), [6, 14]), labels.OP, { cls: 'gm-lb gm-small' });
  return svgWrap(w, h, s, false);
}
function genTangent(lvl) {
  for (;;) {
    const u = pick(LUNITS);
    const mode = lvl === 1 ? pick(['PT', 'OP']) : lvl === 2 ? pick(['PT', 'OP', 'r', 'two']) : pick(['PT', 'OP', 'r', 'outside']);
    if (mode === 'two') {
      const x = ri(2, 12), v = ri(6, 40);
      const e1 = [ri(1, 6), 0], e2 = [ri(1, 6), 0];
      if (e1[0] === e2[0]) continue;
      e1[1] = v - e1[0] * x; e2[1] = v - e2[0] * x;
      if (Math.abs(e1[1]) > 40 || Math.abs(e2[1]) > 40) continue;
      const ask = pick(['x', 'PA']);
      const setup = `${lin(e1[0], e1[1])} = ${lin(e2[0], e2[1])}`;
      const sol = solveLines(e1[0], e1[1], e2[0], e2[1], ask === 'x', setup);
      if (sol.x.d !== 1 || sol.x.n !== x) continue;
      const lines = [setup, ...sol.lines];
      if (ask === 'PA') lines.push([`PA = ${sub1(e1, x)} = `, String(v)]);
      const val = ask === 'x' ? x : v;
      const W1 = (vv, why) => ({ str: String(vv), val: vv, why });
      const wrong = ask === 'x' ? [W1(v, 'gave the length instead of x')] : [W1(x, 'gave x instead of the length'), W1(2 * v, 'added the two tangents')];
      wrong.push(...fallbacks(val, W1));
      return makeQ('tangent', {
        level: lvl, prompt: `PA and PB are tangent to circle O at A and B. PA = ${lin(e1[0], e1[1])} and PB = ${lin(e2[0], e2[1])}. Find ${ask}.`,
        answer: String(val), ans: ask === 'x' ? { k: 'num', v: Rt(x), names: ['x'], ask: 'x' } : { k: 'num', v: Rt(v), u: 'len:units', names: ['pa', 'ap'], ask: 'PA' },
        data: { mode, e1, e2, ask }, wrong,
        work: works({ method: ['Two tangent segments drawn to a circle from the same outside point are congruent, so PA = PB.'], lines, hintLines: [setup, ['x = ', null]], final: [`Check: PA = PB = ${v}.`], hint: ['Set the two expressions equal.'] }),
        figure: twoTangentFig(lin(e1[0], e1[1]), lin(e2[0], e2[1])),
        figureAlt: `Circle O with two tangent segments from outside point P, touching the circle at A and B. PA is labelled ${lin(e1[0], e1[1])} and PB is labelled ${lin(e2[0], e2[1])}.`,
        brief: `PA = PB: ${setup}, so x = ${x}${ask === 'x' ? '' : ` and PA = ${v}`}.`,
      });
    }
    let r, pt, op2;
    const triple = lvl === 1 || (lvl === 2 && chance(0.5)) || (lvl === 3 && chance(0.2));
    if (triple) { const t = pick(TAN_TRIPLES); [r, pt] = chance(0.5) ? [t[0], t[1]] : [t[1], t[0]]; op2 = t[2] * t[2]; }
    else { r = ri(2, 15); pt = ri(3, 20); op2 = r * r + pt * pt; if (isSquare(op2) && mode !== 'outside') continue; }
    const op = Math.sqrt(op2);
    if ((mode === 'PT' || mode === 'r') && !isSquare(op2)) {
      // give OP as a whole number and let the leg be irrational
      const OPi = Math.ceil(op) + ri(0, 3);
      if (mode === 'PT') { const v2 = OPi * OPi - r * r; if (isSquare(v2)) continue; pt = Math.sqrt(v2); }
      else { const v2 = OPi * OPi - pt * pt; if (isSquare(v2)) continue; r = Math.sqrt(v2); }
      op2 = OPi * OPi;
    }
    const OP = Math.sqrt(op2);
    const want = mode === 'PT' ? pt : mode === 'OP' ? OP : mode === 'r' ? r : OP - r;
    const want2 = mode === 'PT' ? op2 - r * r : mode === 'OP' ? op2 : mode === 'r' ? op2 - pt * pt : null;
    const exact = want2 != null ? isSquare(want2) : isSquare(op2);
    if (!exact && nearTie(want, 1)) continue;
    const ansS = exact ? String(Math.round(want)) : roundStr(want, 1);
    const answer = `${ansS} ${u}`;
    const Ri = Number.isInteger(r) ? r : null, PTi = Number.isInteger(pt) ? pt : null, OPi = Number.isInteger(OP) ? OP : null;
    const given = { PT: `the radius is ${Ri} ${u} and OP = ${OPi} ${u}`, OP: `the radius is ${Ri} ${u} and PT = ${PTi} ${u}`, r: `PT = ${PTi} ${u} and OP = ${OPi} ${u}`, outside: `the radius is ${Ri} ${u} and PT = ${PTi} ${u}` }[mode];
    const find = { PT: 'PT', OP: 'OP', r: 'the radius OT', outside: 'PB, where B is the point where segment OP crosses the circle' }[mode];
    const tail = exact ? [['= ', answer]] : [`≈ ${more(want, 1)}`, ['≈ ', answer]];
    let lines;
    if (mode === 'OP') lines = [`OP² = ${Ri}² + ${PTi}²`, `= ${Ri * Ri} + ${PTi * PTi}`, `= ${op2}`, `OP = √${op2}`, ...tail];
    else if (mode === 'outside') {
      lines = [`OP² = ${Ri}² + ${PTi}²`, `= ${Ri * Ri} + ${PTi * PTi}`, `= ${op2}`];
      if (exact) lines.push(`OP = √${op2} = ${OP}`, [`PB = OP ${MINUS} OB = ${OP} ${MINUS} ${Ri} = `, answer]);
      else lines.push(`OP = √${op2} ≈ ${more(OP, 3)}`, `PB = OP ${MINUS} OB ≈ ${more(OP, 3)} ${MINUS} ${Ri}`, ...tail);
    } else if (mode === 'PT') lines = [`PT² = ${OPi}² ${MINUS} ${Ri}²`, `= ${op2} ${MINUS} ${Ri * Ri}`, `= ${want2}`, `PT = √${want2}`, ...tail];
    else lines = [`OT² = ${OPi}² ${MINUS} ${PTi}²`, `= ${op2} ${MINUS} ${PTi * PTi}`, `= ${want2}`, `OT = √${want2}`, ...tail];
    const W1 = (v, why) => ({ str: `${Number.isInteger(v) ? v : roundStr(v, 1)} ${u}`, val: Number.isInteger(v) ? v : Number(roundStr(v, 1)), why });
    const wrong = [];
    if (mode === 'OP') wrong.push(W1(Ri + PTi, 'added the two sides'), W1(op2, 'forgot the square root'), W1(Math.sqrt(Math.abs(PTi * PTi - Ri * Ri)), 'subtracted instead of adding'));
    if (mode === 'PT') wrong.push(W1(OPi - Ri, 'subtracted the lengths'), W1(Math.sqrt(op2 + Ri * Ri), 'added the squares'), W1(want2, 'forgot the square root'));
    if (mode === 'r') wrong.push(W1(OPi - PTi, 'subtracted the lengths'), W1(Math.sqrt(op2 + PTi * PTi), 'added the squares'), W1(want2, 'forgot the square root'));
    if (mode === 'outside') wrong.push(W1(OP, 'gave OP instead of PB'), W1(OP + Ri, 'added the radius'), W1(PTi - Ri > 0 ? PTi - Ri : PTi + 1, 'subtracted the radius from PT'));
    if (!exact) { const tr = Math.floor(want * 10) / 10; if (roundStr(tr, 1) !== ansS) wrong.push(W1(Number(roundStr(tr, 1)), 'cut off instead of rounding')); }
    wrong.push(...fallbacks(Number(ansS), W1));
    const flabels = { r: mode === 'r' ? '?' : `${Ri} ${u}`, PT: mode === 'PT' ? '?' : `${PTi} ${u}`, OP: mode === 'OP' ? '?' : mode === 'PT' || mode === 'r' ? `${OPi} ${u}` : '', PB: mode === 'outside' ? '?' : '' };
    return makeQ('tangent', {
      level: lvl, prompt: `PT is tangent to circle O at T, ${given}. Find ${find}. Round to the nearest tenth if necessary.`,
      answer, ans: exact ? { k: 'num', v: Rt(Number(ansS)), u: `len:${u}`, names: { PT: ['pt', 'tp'], OP: ['op', 'po'], r: ['r', 'ot', 'to'], outside: ['pb', 'bp'] }[mode], ask: mode === 'outside' ? 'PB' : mode === 'r' ? 'the radius' : mode } : { k: 'round', v: want, dp: 1, u: `len:${u}`, names: { PT: ['pt', 'tp'], OP: ['op', 'po'], r: ['r', 'ot', 'to'], outside: ['pb', 'bp'] }[mode], ask: mode === 'outside' ? 'PB' : mode === 'r' ? 'the radius' : mode, ...(want2 != null ? { rad2: want2 } : {}) },
      data: { mode, r: Ri, PT: PTi, OP: OPi }, wrong,
      work: works({
        method: ['A tangent is perpendicular to the radius drawn to the point of tangency, so △OTP is a right triangle with the right angle at T and hypotenuse OP.', ...(mode === 'outside' ? ['OB is a radius too, so PB = OP − r.'] : [])],
        lines, hintLines: [lines[0], ['= ', null]],
        final: [exact ? 'The sides make a Pythagorean triple, so the answer is exact.' : `Round ${more(want, 1)}… to the nearest tenth.`], hint: ['Use the Pythagorean theorem with OP as the hypotenuse.'],
      }),
      figure: tangentFig(flabels),
      figureAlt: `Circle O with radius OT and tangent segment PT meeting it at a right angle at T; segment OP joins the center to the outside point P. ${[flabels.r && `OT is labelled ${flabels.r}`, flabels.PT && `PT is labelled ${flabels.PT === '?' ? 'with a question mark' : flabels.PT}`, flabels.OP && `OP is labelled ${flabels.OP === '?' ? 'with a question mark' : flabels.OP}`, flabels.PB && 'point B is where OP crosses the circle, and PB is highlighted and labelled with a question mark'].filter(Boolean).join('; ')}.`,
      brief: `${lines[0]} … ${exact ? '=' : '≈'} ${ansS}`,
    });
  }
}
function twoTangentFig(la, lb) {
  const O = [100, 100], R = 56, Pp = [270, 100];
  const d = Pp[0] - O[0], ang = Math.acos(R / d) / DEG;
  const A = add2(O, [Math.cos(ang * DEG) * R, -Math.sin(ang * DEG) * R]), B = add2(O, [Math.cos(ang * DEG) * R, Math.sin(ang * DEG) * R]);
  let s = `<circle cx="${O[0]}" cy="${O[1]}" r="${R}" class="gm-shape"/>` + L(Pp, A, 'gm-hl') + L(Pp, B, 'gm-hl') + DOT(O) + DOT(A) + DOT(B) + DOT(Pp);
  s += T(add2(O, [-12, 0]), 'O', { cls: 'gm-vx' }) + T(add2(A, [-4, -13]), 'A', { cls: 'gm-vx' }) + T(add2(B, [-4, 14]), 'B', { cls: 'gm-vx' }) + T(add2(Pp, [11, 0]), 'P', { cls: 'gm-vx' });
  s += T(add2(mid2(A, Pp), [4, -13]), la, { cls: 'gm-lb gm-small' }) + T(add2(mid2(B, Pp), [4, 14]), lb, { cls: 'gm-lb gm-small' });
  return svgWrap(300, 200, s, false);
}

/* ================================================================ Unit 10 */
function shapeFig(kind, dims, u) {
  const w = 300, h = 200;
  let s = '';
  const lab = (p, t, a = 'middle') => T(p, t, { a, cls: 'gm-lb gm-small' });
  if (kind === 'tri') {
    const A = [40, 160], B = [250, 160], C = [150, 45], F = [150, 160];
    s += PG([A, B, C], 'gm-shape') + L(C, F, 'gm-dash') + rightMark(F, B, C, 9) + lab([145, 176], `${dims.b} ${u}`) + lab([156, 110], `${dims.h} ${u}`, 'start') + lab([210, 96], `${dims.s} ${u}`, 'start');
  } else if (kind === 'para') {
    const A = [40, 160], B = [210, 160], C = [262, 50], D = [92, 50], F = [92, 160];
    s += PG([A, B, C, D], 'gm-shape') + L(D, F, 'gm-dash') + rightMark(F, B, D, 9) + lab([125, 176], `${dims.b} ${u}`) + lab([98, 106], `${dims.h} ${u}`, 'start') + lab([58, 100], `${dims.s} ${u}`, 'end');
  } else if (kind === 'trap') {
    const A = [30, 160], B = [270, 160], C = [205, 55], D = [95, 55], F = [95, 160];
    s += PG([A, B, C, D], 'gm-shape') + L(D, F, 'gm-dash') + rightMark(F, B, D, 9) + lab([150, 176], `${dims.b1} ${u}`) + lab([150, 42], `${dims.b2} ${u}`) + lab([101, 108], `${dims.h} ${u}`, 'start');
  } else if (kind === 'L') {
    const P2 = [[40, 170], [260, 170], [260, 100], [170, 100], [170, 40], [40, 40]];
    s += PG(P2, 'gm-shape') + lab([150, 186], `${dims.W} ${u}`) + lab([32, 105], `${dims.H} ${u}`, 'end') + lab([215, 90], `${dims.cw} ${u}`) + lab([178, 70], `${dims.ch} ${u}`, 'start');
  } else if (kind === 'house') {
    const P2 = [[60, 170], [240, 170], [240, 95], [150, 30], [60, 95]];
    s += PG(P2, 'gm-shape') + L([60, 95], [240, 95], 'gm-dash') + L([150, 30], [150, 95], 'gm-dash') + lab([150, 186], `${dims.w} ${u}`) + lab([248, 133], `${dims.h1} ${u}`, 'start') + lab([156, 70], `${dims.h2} ${u}`, 'start');
  } else if (kind === 'semi') {
    s += `<path d="M60 170 L240 170 L240 100 A90 90 0 0 0 60 100 Z" class="gm-shape"/>` + L([60, 100], [240, 100], 'gm-dash') + lab([150, 186], `${dims.w} ${u}`) + lab([248, 136], `${dims.h} ${u}`, 'start');
  }
  return svgWrap(w, h, s, false);
}
function genArea(lvl) {
  for (;;) {
    const u = pick(LUNITS);
    const kind = pick(lvl === 1 ? ['tri', 'para', 'trap'] : lvl === 2 ? ['tri', 'para', 'trap', 'L', 'house'] : ['trap', 'L', 'house', 'semi', 'tri']);
    const U = `area:${u}`;
    const A2 = (r) => `${n(r)}${uSuffix(U)}`;
    const W1 = (v, why) => ({ str: A2(toR(v)), val: rnum(toR(v)), why });
    let prompt, val, lines, method, alt, dims, wrong, round = false;
    if (kind === 'tri') {
      const b = ri(4, 20), h = ri(3, 16), s = h + ri(1, 6);
      if (lvl === 1 && (b * h) % 2) continue;
      val = Rt(b * h, 2); dims = { b, h, s };
      prompt = `A triangle has a base of ${b} ${u} and a height of ${h} ${u} (its slanted side is ${s} ${u}). Find its area.`;
      method = ['Area of a triangle: A = ½ × base × height. The height is the perpendicular (dashed) one, not the slanted side.'];
      lines = [`A = ½ × ${b} × ${h}`, ['= ', A2(val)]];
      wrong = [W1(b * h, 'forgot the ½'), W1(Rt(b * s, 2), 'used the slanted side as the height'), W1(b * s, 'multiplied the base by the slanted side'), W1(b + h + s, 'added the lengths')];
      alt = `A triangle with base ${b} ${u}, a dashed height of ${h} ${u} drawn at a right angle to the base, and a slanted side labelled ${s} ${u}.`;
    } else if (kind === 'para') {
      const b = ri(4, 20), h = ri(3, 14), s = h + ri(1, 5);
      val = Rt(b * h); dims = { b, h, s };
      prompt = `A parallelogram has a base of ${b} ${u} and a height of ${h} ${u} (its slanted side is ${s} ${u}). Find its area.`;
      method = ['Area of a parallelogram: A = base × height, where the height is perpendicular to the base.'];
      lines = [[`A = ${b} × ${h} = `, A2(val)]];
      wrong = [W1(b * s, 'used the slanted side as the height'), W1(Rt(b * h, 2), 'halved it like a triangle'), W1(2 * (b + s), 'found the perimeter')];
      alt = `A parallelogram with base ${b} ${u}, a dashed height of ${h} ${u} and a slanted side labelled ${s} ${u}.`;
    } else if (kind === 'trap') {
      const b1 = ri(6, 22), b2 = ri(3, b1 - 2), h = ri(3, 14);
      if (lvl === 1 && ((b1 + b2) * h) % 2) continue;
      val = Rt((b1 + b2) * h, 2); dims = { b1, b2, h };
      prompt = `A trapezoid has bases of ${b1} ${u} and ${b2} ${u} and a height of ${h} ${u}. Find its area.`;
      method = ['Area of a trapezoid: A = ½ × (base₁ + base₂) × height.'];
      lines = [`A = ½ × (${b1} + ${b2}) × ${h}`, `= ½ × ${b1 + b2} × ${h}`, ['= ', A2(val)]];
      wrong = [W1((b1 + b2) * h, 'forgot the ½'), W1(Rt(b1 * h, 2), 'used only one base'), W1(b1 * h, 'used the longer base as a rectangle'), W1(Rt(b1 * b2 * h, 2), 'multiplied the bases')];
      alt = `A trapezoid with parallel bases of ${b1} ${u} (bottom) and ${b2} ${u} (top) and a dashed height of ${h} ${u}.`;
    } else if (kind === 'L') {
      const Wd = ri(8, 20), H = ri(6, 16), cw = ri(2, Wd - 3), ch = ri(2, H - 3);
      val = Rt(Wd * H - cw * ch); dims = { W: Wd, H, cw, ch };
      prompt = `An L-shaped figure is ${Wd} ${u} wide and ${H} ${u} tall, with ${aW(cw)} ${u} by ${ch} ${u} rectangle cut out of its top-right corner. Find its area.`;
      method = ['Composite figure: find the area of the whole rectangle, then subtract the piece that was cut out.'];
      lines = [`A = ${Wd} × ${H} ${MINUS} ${cw} × ${ch}`, `= ${Wd * H} ${MINUS} ${cw * ch}`, ['= ', A2(val)]];
      wrong = [W1(Wd * H, 'forgot to subtract the cut-out'), W1(Wd * H + cw * ch, 'added the cut-out'), W1((Wd - cw) * (H - ch), 'multiplied the two shorter edges'), W1(2 * (Wd + H), 'found the perimeter')];
      alt = `An L-shaped figure: ${aW(Wd)} ${u} by ${H} ${u} rectangle with ${aW(cw)} ${u} by ${ch} ${u} notch cut from the top-right corner.`;
    } else if (kind === 'house') {
      const w = ri(4, 18), h1 = ri(3, 14), h2 = ri(2, 10);
      if ((w * h2) % 2 && lvl < 3) continue;
      val = Rt(2 * w * h1 + w * h2, 2); dims = { w, h1, h2 };
      prompt = `A figure is ${aW(w)} ${u} by ${h1} ${u} rectangle with a triangle on top. The triangle has the same ${w} ${u} base and a height of ${h2} ${u}. Find the total area.`;
      method = ['Composite figure: add the rectangle (base × height) and the triangle (½ × base × height).'];
      lines = [`A = ${w} × ${h1} + ½ × ${w} × ${h2}`, `= ${w * h1} + ${n(Rt(w * h2, 2))}`, ['= ', A2(val)]];
      wrong = [W1(w * h1 + w * h2, 'forgot the ½ for the triangle'), W1(w * h1, 'left out the triangle'), W1(Rt(w * (h1 + h2), 2), 'treated the whole shape as a triangle')];
      alt = `A house-shaped figure: a rectangle ${w} ${u} wide and ${h1} ${u} tall with a triangle on top whose height is ${h2} ${u}.`;
    } else {
      const w = 2 * ri(2, 9), h = ri(3, 14), r = w / 2;
      const v = w * h + (Math.PI * r * r) / 2;
      if (nearTie(v, 1)) continue;
      round = true; dims = { w, h };
      val = v;
      prompt = `A window is ${aW(w)} ${u} by ${h} ${u} rectangle topped by a semicircle whose diameter is the ${w} ${u} top edge. Find its total area. ${ROUND_TXT}`;
      method = ['Composite figure: rectangle (base × height) plus half a circle (½ × πr²), where r is half the width.'];
      lines = [`r = ${w} ÷ 2 = ${r}`, `A = ${w} × ${h} + ½ × π × ${r}²`, `= ${w * h} + ${n(Rt(r * r, 2))}π`, `≈ ${more(v, 1)}`, ['≈ ', `${roundStr(v, 1)}${uSuffix(U)}`]];
      const R1 = (x, why) => ({ str: `${roundStr(x, 1)}${uSuffix(U)}`, val: Number(roundStr(x, 1)), why });
      wrong = [R1(w * h + Math.PI * r * r, 'used a whole circle'), R1(w * h + (Math.PI * w * w) / 2, 'used the diameter as the radius'), R1(w * h, 'left out the semicircle'), R1(w * h + Math.PI * r, 'used the circumference formula')];
      alt = `A window shape: a rectangle ${w} ${u} wide and ${h} ${u} tall with a semicircle on top whose diameter is the ${w} ${u} top edge.`;
    }
    const answer = round ? `${roundStr(val, 1)}${uSuffix(U)}` : A2(val);
    const num = round ? Number(roundStr(val, 1)) : rnum(val);
    wrong.push(...fallbacks(num, (v, why) => (round ? { str: `${roundStr(v, 1)}${uSuffix(U)}`, val: Number(roundStr(v, 1)), why } : W1(rq(v), why))));
    return makeQ('area', {
      level: lvl, prompt, answer,
      ans: round ? { k: 'round', v: val, dp: 1, u: U, names: ['a', 'area'], ask: 'the area' } : { k: 'num', v: val, u: U, names: ['a', 'area'], ask: 'the area' },
      data: { kind, ...dims }, wrong,
      work: works({ method, lines, hintLines: typeof lines[0] === 'string' ? [lines[0], ...(kind === 'semi' ? [lines[1]] : []), ['= ', null]] : [[lines[0][0], null]], final: ['Area is always in square units.'], hint: ['Write the formula, then substitute the lengths.'] }),
      figure: shapeFig(kind, dims, u), figureAlt: alt,
      brief: `${(() => { const l = lines.find((x) => (typeof x === 'string' ? x : x[0]).startsWith('A =')); return (typeof l === 'string' ? l : l[0]).replace(/ = $/, ''); })()} ${round ? '≈' : '='} ${answer}`,
    });
  }
}
function solidFig(kind, labels) {
  const w = 300, h = 210;
  let s = '';
  const lab = (p, t, a = 'middle') => (t ? T(p, t, { a, cls: 'gm-lb gm-small' }) : '');
  if (kind === 'prism') {
    const f = [[50, 180], [200, 180], [200, 90], [50, 90]], o = [55, -40];
    const b = f.map((p) => add2(p, o));
    s += PG(f, 'gm-shape') + L(f[3], b[3], 'gm-seg') + L(f[2], b[2], 'gm-seg') + L(f[1], b[1], 'gm-seg') + L(b[3], b[2], 'gm-seg') + L(b[2], b[1], 'gm-seg');
    s += L(f[0], b[0], 'gm-dash') + L(b[0], b[1], 'gm-dash') + L(b[0], b[3], 'gm-dash');
    s += lab([125, 196], labels.l) + lab([238, 170], labels.w, 'start') + lab([42, 135], labels.h, 'end');
  } else if (kind === 'cyl') {
    s += `<ellipse cx="150" cy="50" rx="70" ry="18" class="gm-shape"/><path d="M80 170 A70 18 0 0 0 220 170" class="gm-seg" fill="none"/><path d="M80 170 A70 18 0 0 1 220 170" class="gm-dash" fill="none"/>`;
    s += L([80, 50], [80, 170], 'gm-seg') + L([220, 50], [220, 170], 'gm-seg') + L([150, 50], [220, 50], 'gm-hl') + DOT([150, 50]);
    s += lab([185, 38], labels.r) + lab([228, 110], labels.h, 'start');
  } else if (kind === 'cone') {
    s += `<path d="M80 170 A70 18 0 0 0 220 170" class="gm-seg" fill="none"/><path d="M80 170 A70 18 0 0 1 220 170" class="gm-dash" fill="none"/>`;
    s += L([80, 170], [150, 35], 'gm-seg') + L([220, 170], [150, 35], 'gm-seg') + L([150, 35], [150, 170], 'gm-dash') + L([150, 170], [220, 170], 'gm-hl') + rightMark([150, 170], [220, 170], [150, 35], 9) + DOT([150, 170]);
    // the height label sits right of the dashed altitude, the slant label outside the right side
    s += lab([185, 184], labels.r) + lab([156, 124], labels.h, 'start') + lab([192, 96], labels.l, 'start');
  } else if (kind === 'pyr') {
    // the height drops to the centre of the base; the slant height runs down the middle of
    // the right-hand face, so the two dashed segments (and their labels) stay well apart
    const B = [[40, 180], [200, 180], [260, 138], [100, 138]], A = [150, 30], M = mid2(B[1], B[2]), C0 = mid2(B[0], B[2]);
    s += L(B[0], B[1], 'gm-seg') + L(B[1], B[2], 'gm-seg') + L(B[2], B[3], 'gm-dash') + L(B[3], B[0], 'gm-dash');
    s += L(A, B[0], 'gm-seg') + L(A, B[1], 'gm-seg') + L(A, B[2], 'gm-seg') + L(A, B[3], 'gm-dash') + L(A, C0, 'gm-dash') + L(A, M, 'gm-dash') + DOT(C0);
    s += lab([120, 196], labels.s) + lab([144, 121], labels.h, 'end') + lab(add2(mid2(A, M), [0, 4]), labels.l);
  } else {
    s += '<circle cx="150" cy="105" r="80" class="gm-shape"/><path d="M70 105 A80 22 0 0 0 230 105" class="gm-seg" fill="none"/><path d="M70 105 A80 22 0 0 1 230 105" class="gm-dash" fill="none"/>';
    s += L([150, 105], [230, 105], 'gm-hl') + DOT([150, 105]) + lab([190, 94], labels.r);
  }
  return svgWrap(w, h, s, false);
}
const CONE_TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 5, 13], [4, 3, 5], [8, 6, 10]];
function genSolid(lvl) {
  for (;;) {
    const u = pick(LUNITS);
    const combos = lvl === 1 ? [['prism', 'V'], ['prism', 'SA'], ['cyl', 'V'], ['sphere', 'SA']] : lvl === 2 ? [['prism', 'SA'], ['cyl', 'V'], ['cyl', 'SA'], ['cone', 'V'], ['pyr', 'V'], ['sphere', 'V'], ['sphere', 'SA']] : [['cyl', 'SA'], ['cone', 'V'], ['cone', 'SA'], ['pyr', 'V'], ['pyr', 'SA'], ['sphere', 'V']];
    const [kind, ask] = pick(combos);
    const U = ask === 'V' ? `vol:${u}` : `area:${u}`;
    const usesPi = kind === 'cyl' || kind === 'cone' || kind === 'sphere';
    let form = usesPi ? (lvl === 1 ? 'pi' : lvl === 2 ? pick(['pi', 'pi', 'round']) : pick(['pi', 'round'])) : 'exact';
    let coef, dims, lines, method, labels, prompt, alt;
    const wrongC = [];
    const us = (v) => `${v} ${u}`;
    if (kind === 'prism') {
      const l = ri(2, 14), w = ri(2, 12), h = ri(2, 12);
      dims = { l, w, h };
      coef = ask === 'V' ? l * w * h : 2 * (l * w + l * h + w * h);
      prompt = `A rectangular prism is ${us(l)} long, ${us(w)} wide and ${us(h)} tall. Find its ${ask === 'V' ? 'volume' : 'surface area'}.`;
      method = [ask === 'V' ? 'Volume of a rectangular prism: V = l × w × h.' : 'Surface area of a rectangular prism: SA = 2(lw + lh + wh) — three pairs of matching faces.'];
      lines = ask === 'V' ? [`V = ${l} × ${w} × ${h}`, `= ${coef}`] : [`SA = 2(${l} × ${w} + ${l} × ${h} + ${w} × ${h})`, `= 2(${l * w} + ${l * h} + ${w * h})`, `= 2 × ${l * w + l * h + w * h}`, `= ${coef}`];
      wrongC.push([ask === 'V' ? 2 * (l * w + l * h + w * h) : l * w * h, ask === 'V' ? 'found the surface area' : 'found the volume'], ...(ask === 'SA' ? [[l * w + l * h + w * h, 'counted each face only once']] : [[l * w, 'found the area of the base only']]));
      labels = { l: us(l), w: us(w), h: us(h) };
      alt = `A rectangular prism with length ${us(l)}, width ${us(w)} and height ${us(h)}.`;
    } else if (kind === 'cyl') {
      const r = ri(2, 10), h = ri(2, 15);
      dims = { r, h };
      coef = ask === 'V' ? r * r * h : 2 * r * r + 2 * r * h;
      prompt = `A cylinder has a radius of ${us(r)} and a height of ${us(h)}. Find its ${ask === 'V' ? 'volume' : 'total surface area'}.`;
      method = [ask === 'V' ? 'Volume of a cylinder: V = πr²h (the area of the circular base times the height).' : 'Surface area of a cylinder: SA = 2πr² + 2πrh (two circles plus the curved side).'];
      lines = ask === 'V' ? ['V = πr²h', `= π(${r})²(${h})`, `= ${coef}π`] : ['SA = 2πr² + 2πrh', `= 2π(${r})² + 2π(${r})(${h})`, `= ${2 * r * r}π + ${2 * r * h}π`, `= ${coef}π`];
      wrongC.push(ask === 'V' ? [4 * r * r * h, 'used the diameter as the radius'] : [2 * r * h, 'found only the curved side'], ask === 'V' ? [2 * r * h, 'used 2πrh'] : [r * r + 2 * r * h, 'counted only one circle'], ask === 'V' ? [r * h, 'forgot to square the radius'] : [2 * r * r + r * h, 'used πrh for the side']);
      labels = { r: us(r), h: us(h) };
      alt = `A cylinder with radius ${us(r)} and height ${us(h)}.`;
    } else if (kind === 'cone') {
      if (ask === 'V') {
        const r = ri(2, 10), h = ri(2, 15);
        if (form === 'pi' && (r * r * h) % 3) continue;
        dims = { r, h }; coef = Rt(r * r * h, 3);
        prompt = `A cone has a radius of ${us(r)} and a height of ${us(h)}. Find its volume.`;
        method = ['Volume of a cone: V = ⅓πr²h — one third of the cylinder with the same base and height.'];
        lines = ['V = ⅓πr²h', `= (1/3)π(${r})²(${h})`, `= (1/3)(${r * r * h})π`, `= ${terminates(coef) ? n(coef) : `(${fstr(coef)})`}π`];
        wrongC.push([Rt(r * r * h), 'forgot the ⅓'], [Rt(4 * r * r * h, 3), 'used the diameter as the radius'], [Rt(r * h, 3), 'forgot to square the radius']);
        labels = { r: us(r), h: us(h) };
        alt = `A cone with base radius ${us(r)} and a dashed height of ${us(h)} drawn from the apex to the center of the base.`;
      } else {
        const t = pick(CONE_TRIPLES), k = ri(1, 2);
        const [r, h, l] = [t[0] * k, t[1] * k, t[2] * k];
        dims = { r, h, l }; coef = r * r + r * l;
        prompt = `A cone has a radius of ${us(r)}, a height of ${us(h)} and a slant height of ${us(l)}. Find its total surface area.`;
        method = ['Surface area of a cone: SA = πr² + πrℓ (the base plus the curved side, which uses the slant height ℓ, not the height).'];
        lines = ['SA = πr² + πrℓ', `= π(${r})² + π(${r})(${l})`, `= ${r * r}π + ${r * l}π`, `= ${coef}π`];
        wrongC.push([r * r + r * h, 'used the height instead of the slant height'], [r * l, 'found only the curved side'], [2 * r * r + 2 * r * l, 'doubled it like a cylinder']);
        labels = { r: us(r), h: us(h), l: us(l) };
        alt = `A cone with base radius ${us(r)}, a dashed height of ${us(h)} and a slant height of ${us(l)} along its side.`;
      }
    } else if (kind === 'pyr') {
      form = 'exact';
      const t = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [4, 3, 5], [9, 12, 15]]), k = ri(1, 2);
      const s = 2 * t[0] * k, h = t[1] * k, l = t[2] * k;
      if (ask === 'V' && (s * s * h) % 3) continue;
      dims = { s, h, l };
      coef = ask === 'V' ? (s * s * h) / 3 : s * s + 2 * s * l;
      prompt = `A square pyramid has a base edge of ${us(s)}, a height of ${us(h)} and a slant height of ${us(l)}. Find its ${ask === 'V' ? 'volume' : 'total surface area'}.`;
      method = [ask === 'V' ? 'Volume of a pyramid: V = ⅓ × (area of the base) × height = ⅓s²h.' : 'Surface area of a square pyramid: SA = s² + 2sℓ (the square base plus four triangles, each ½ × s × ℓ).'];
      lines = ask === 'V' ? ['V = ⅓s²h', `= (1/3)(${s})²(${h})`, `= (1/3)(${s * s * h})`, `= ${coef}`] : ['SA = s² + 2sℓ', `= ${s}² + 2(${s})(${l})`, `= ${s * s} + ${2 * s * l}`, `= ${coef}`];
      wrongC.push(...(ask === 'V' ? [[s * s * h, 'forgot the ⅓'], [(s * s * l) / 3, 'used the slant height'], [s * h, 'forgot to square the base edge']] : [[s * s + 4 * s * l, 'forgot the ½ for each triangle'], [2 * s * l, 'left out the base'], [s * s + 2 * s * h, 'used the height instead of the slant height']]));
      labels = { s: us(s), h: us(h), l: us(l) };
      alt = `A square pyramid with base edge ${us(s)}, a dashed height of ${us(h)} from the apex to the center of the base, and a dashed slant height of ${us(l)} down the middle of the right-hand face.`;
    } else {
      const r = ri(2, 12);
      if (ask === 'V' && form === 'pi' && r % 3) continue;
      dims = { r };
      coef = ask === 'V' ? Rt(4 * r * r * r, 3) : 4 * r * r;
      prompt = `A sphere has a radius of ${us(r)}. Find its ${ask === 'V' ? 'volume' : 'surface area'}.`;
      method = [ask === 'V' ? 'Volume of a sphere: V = (4/3)πr³.' : 'Surface area of a sphere: SA = 4πr².'];
      lines = ask === 'V' ? ['V = (4/3)πr³', `= (4/3)π(${r})³`, `= (4/3)(${r ** 3})π`, `= ${terminates(coef) ? n(coef) : `(${fstr(coef)})`}π`] : ['SA = 4πr²', `= 4π(${r})²`, `= ${coef}π`];
      wrongC.push(...(ask === 'V' ? [[Rt(4 * r * r, 1), 'used the surface-area formula'], [Rt(r ** 3), 'forgot the 4/3'], [Rt(32 * r * r * r, 3), 'used the diameter as the radius']] : [[r * r, 'forgot the 4'], [Rt(4 * r * r * r, 3), 'used the volume formula'], [16 * r * r, 'used the diameter as the radius']]));
      labels = { r: us(r) };
      alt = `A sphere with radius ${us(r)}.`;
    }
    const C = toR(coef);
    const exactV = usesPi ? rnum(C) * Math.PI : rnum(C);
    if (form === 'round' && nearTie(exactV, 1)) continue;
    const cs = terminates(C) ? n(C) : `(${fstr(C)})`;
    const answer = form === 'pi' ? `${cs}π${uSuffix(U)}` : form === 'round' ? `${roundStr(exactV, 1)}${uSuffix(U)}` : `${n(C)}${uSuffix(U)}`;
    const last = lines.pop();
    if (form === 'pi' || form === 'exact') lines.push([last.replace(/[^=]*$/, ' '), answer]);
    else lines.push(last, `≈ ${more(exactV, 1)}`, ['≈ ', answer]);
    const fmtW = (c, why) => {
      const cr = toR(c), v = usesPi ? rnum(cr) * Math.PI : rnum(cr);
      if (form === 'round') return { str: `${roundStr(v, 1)}${uSuffix(U)}`, val: Number(roundStr(v, 1)), why };
      return { str: `${usesPi ? `${terminates(cr) ? n(cr) : `(${fstr(cr)})`}π` : n(cr)}${uSuffix(U)}`, val: v, why };
    };
    const wrong = wrongC.map(([c, why]) => fmtW(c, why));
    if (form === 'pi') wrong.unshift({ str: `${terminates(C) ? n(C) : fstr(C)}${uSuffix(U)}`, val: rnum(C), why: 'dropped the π' });
    wrong.push(...[1, 2, 3].map((d) => fmtW(radd(C, Rt(d)), 'arithmetic slip')));
    const formTxt = form === 'pi' ? ` ${PI_TXT}` : form === 'round' ? ` ${ROUND_TXT}` : '';
    const names = ask === 'V' ? ['v', 'volume'] : ['sa', 's', 'surfacearea', 'area'];
    return makeQ('solid', {
      level: lvl, prompt: prompt + formTxt, answer,
      ans: form === 'pi' ? { k: 'pi', c: C, u: U, names, ask: ask === 'V' ? 'the volume' : 'the surface area' } : form === 'round' ? { k: 'round', v: exactV, dp: 1, u: U, names, ask: 'the answer', pic: C } : { k: 'num', v: C, u: U, names, ask: ask === 'V' ? 'the volume' : 'the surface area' },
      data: { kind, ask, form, ...dims, unit: u }, wrong,
      work: works({ method, lines, hintLines: [lines[0], ...(typeof lines[1] === 'string' && !/^= [\d.()/]+π?$/.test(lines[1]) ? [lines[1]] : []), ['= ', null]], final: [ask === 'V' ? 'Volume is in cubic units.' : 'Surface area is in square units.'], hint: ['Write the formula, substitute, then simplify.'] }),
      figure: solidFig(kind, labels), figureAlt: alt,
      brief: `${lines[0]}: ${answer}`,
    });
  }
}
const SCALE_PAIRS = [[1, 2], [1, 3], [2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [1, 4]];
function genScale(lvl) {
  for (;;) {
    const u = pick(LUNITS);
    const mode = lvl === 1 ? pick(['times', 'area']) : lvl === 2 ? pick(['area', 'vol', 'times']) : pick(['vol', 'ratio', 'area']);
    const [a, b] = pick(SCALE_PAIRS);
    const W1 = (v, why, U) => ({ str: `${numStr(v)}${uSuffix(U)}`, val: v, why });
    if (mode === 'times') {
      const k = ri(2, 5), what = pick(['area', 'volume']);
      const val = what === 'area' ? k * k : k ** 3;
      const wrong = [W1(k, 'multiplied by the scale factor itself'), W1(what === 'area' ? k ** 3 : k * k, what === 'area' ? 'cubed instead of squaring' : 'squared instead of cubing'), W1(2 * k, 'doubled the scale factor'), ...fallbacks(val, W1)];
      return makeQ('scale', {
        level: lvl, prompt: `Every length of a ${what === 'area' ? 'figure' : 'solid'} is multiplied by ${k}. By what number is its ${what} multiplied?`,
        answer: String(val), ans: { k: 'num', v: Rt(val), u: 'times', names: ['k', 'factor'], ask: 'the factor' }, placeholder: 'A number',
        data: { mode, k, what }, wrong,
        work: works({ method: ['Lengths scale by k, areas by k² and volumes by k³.'], lines: [[`${k}${what === 'area' ? '²' : '³'} = `, String(val)]], hintLines: [[`${k}${what === 'area' ? '²' : '³'} = `, null]], final: [`For example, a 1 × 1${what === 'area' ? '' : ' × 1'} ${what === 'area' ? 'square' : 'cube'} becomes ${k} × ${k}${what === 'area' ? '' : ` × ${k}`}.`], hint: [`${what === 'area' ? 'Area has two dimensions' : 'Volume has three dimensions'}.`] }),
        brief: `${what === 'area' ? 'Area' : 'Volume'} scales by k${what === 'area' ? '²' : '³'} = ${val}.`,
      });
    }
    if (mode === 'ratio') {
      const val = Rt(a ** 3, b ** 3);
      const answer = `${a ** 3}:${b ** 3}`;
      const wrong = [{ str: `${a}:${b}`, val: a / b, why: 'gave the scale factor' }, { str: `${a * a}:${b * b}`, val: (a * a) / (b * b), why: 'repeated the area ratio' }, { str: `${b ** 3}:${a ** 3}`, val: b ** 3 / a ** 3, why: 'reversed the order' }, { str: `${a * a * a * a}:${b * b * b * b}`, val: a ** 4 / b ** 4, why: 'squared the area ratio' }];
      return makeQ('scale', {
        level: lvl, prompt: `The surface areas of two similar solids are in the ratio ${a * a}:${b * b}. What is the ratio of their volumes (smaller to larger)?`,
        answer, ans: { k: 'num', v: val, names: ['ratio'], ask: 'the ratio', ratio: true }, placeholder: 'A ratio, like a:b',
        data: { mode, a, b }, wrong,
        work: works({ method: ['Area ratio = (scale factor)², so take square roots to get the scale factor, then cube it for the volumes.'], lines: [`scale factor = ${a === 1 ? '1' : `√${a * a}`} : √${b * b} = ${a}:${b}`, ['volume ratio = ', answer]], hintLines: [[`scale factor = `, null]], final: [`${a}³ = ${a ** 3} and ${b}³ = ${b ** 3}.`], hint: ['Undo the square first.'] }),
        brief: `Scale factor ${a}:${b}, so volumes are ${answer}.`,
      });
    }
    const isVol = mode === 'vol';
    const pw = isVol ? 3 : 2;
    const m = ri(isVol ? 1 : 2, isVol ? 6 : 12);
    const small = a ** pw * m, big = b ** pw * m;
    if (big > 20000) continue;
    const up = chance(0.6);
    const U = `${isVol ? 'vol' : 'area'}:${u}`;
    const given = up ? small : big, val = up ? big : small;
    const what = isVol ? 'volume' : (chance(0.5) ? 'area' : 'surface area');
    // a whole-number ratio is written without "/1": 3² = 9, not (3/1)² = 9/1
    const q2 = (p, d) => (d === 1 ? String(p) : `${p}/${d}`);
    const fac = up ? q2(b ** pw, a ** pw) : q2(a ** pw, b ** pw);
    const kS = up ? q2(b, a) : q2(a, b);
    const powS = `${kS.includes('/') ? `(${kS})` : kS}${isVol ? '³' : '²'}`;
    const lines = [`${what} scale factor = ${powS} = ${fac}`, [`${given} × ${fac} = `, `${val}${uSuffix(U)}`]];
    const wrong = [];
    const lin1 = (given * (up ? b : a)) / (up ? a : b);
    if (Number.isInteger(lin1)) wrong.push(W1(lin1, 'used the scale factor without squaring or cubing', U));
    const other = (given * (up ? b : a) ** (isVol ? 2 : 3)) / (up ? a : b) ** (isVol ? 2 : 3);
    if (Number.isInteger(other)) wrong.push(W1(other, isVol ? 'squared instead of cubing' : 'cubed instead of squaring', U));
    const rev = (given * (up ? a : b) ** pw) / (up ? b : a) ** pw;
    if (Number.isInteger(rev)) wrong.push(W1(rev, 'used the scale factor upside down', U));
    wrong.push(W1(given + (up ? 1 : -1) * Math.abs(b - a), 'added the difference', U), ...fallbacks(val, (v, why) => W1(v, why, U)));
    return makeQ('scale', {
      level: lvl,
      prompt: `Two similar ${isVol ? 'solids' : 'figures'} have a scale factor of ${a}:${b}. The ${up ? 'smaller' : 'larger'} one has ${what === 'area' ? 'an area' : `a ${what}`} of ${given}${uSuffix(U)}. Find the ${what} of the ${up ? 'larger' : 'smaller'} one.`,
      answer: `${val}${uSuffix(U)}`, ans: { k: 'num', v: Rt(val), u: U, names: isVol ? ['v', 'volume'] : ['a', 'area', 'sa'], ask: `the ${what}` },
      data: { mode, a, b, up, given, what }, wrong,
      work: works({ method: [`With scale factor k, ${isVol ? 'volumes scale by k³' : 'areas (and surface areas) scale by k²'}.`], lines, hintLines: [lines[0], ['= ', null]], final: [], hint: [`${isVol ? 'Cube' : 'Square'} the scale factor first.`] }),
      brief: `${what} × ${powS} = ${val}`,
    });
  }
}

/* ================================================================ generate */
const GENERATORS = {
  midpoint: genMidpoint, distance: genDistance, segadd: genSegAdd, anglepairs: genAnglePairs,
  related: genRelated, hypconc: genHypConc,
  pairname: genPairName, pairmeasure: genPairMeasure, pairx: genPairX, slope: genSlope,
  trisum: genTriSum, exterior: genExterior, isosceles: genIsosceles, congruence: genCongruence,
  midsegment: genMidsegment, inequality: genInequality, thirdside: genThirdSide, similar: genSimilar, simcrit: genSimCrit,
  pythag: genPythag, classify: genClassify, special: genSpecial, trigratio: genTrigRatio, trigside: genTrigSide, trigangle: genTrigAngle, elevation: genElevation,
  polysum: genPolySum, regular: genRegular, sides: genSides, quad: genQuad,
  transform: genTransform, rule: genRule,
  circle: genCircle, arc: genArc, inscribed: genInscribed, circeq: genCircEq, tangent: genTangent,
  area: genArea, solid: genSolid, scale: genScale,
};
function levelOf(opt) {
  const d = opt && opt.difficulty;
  if (d === 'easy' || d === 'warm-up') return 1;
  if (d === 'hard' || d === 'challenge') return 3;
  const k = Number(d);
  return k >= 1 && k <= 3 ? Math.round(k) : 2;
}
/** A fresh practice problem for a skill. */
function generate(skillId, opt = {}) {
  const g = GENERATORS[skillId];
  if (!g) throw new Error(`unknown Geometry Lab skill: ${skillId}`);
  return g(levelOf(opt));
}

/* ---------------------------------------------- multiple choice versions
   For the games: the three wrong options are the classic mistakes, each
   distinct and more than 1% away from the right answer (and from each other). */
function far(a, b) {
  if (Array.isArray(a) || Array.isArray(b)) {
    const A = [].concat(a), B = [].concat(b);
    return A.length !== B.length || A.some((x, i) => Math.abs(x - B[i]) > Math.max(Math.abs(x), Math.abs(B[i])) * 0.01 + 1e-9);
  }
  return Math.abs(a - b) > Math.max(Math.abs(a), Math.abs(b)) * 0.01 + 1e-9;
}
function generateMC(skillId, opt = {}) {
  const lvl = levelOf(opt);
  for (let tries = 0; tries < 60; tries++) {
    const q = generate(skillId, { difficulty: lvl });
    if (q.type === 'mc') return q;
    const right = q.value;
    const picked = [];
    for (const w of q.wrong) {
      if (w == null || w.val == null || w.str === q.answer || /NaN|undefined|Infinity|null/.test(w.str)) continue;
      if (typeof w.val === 'number' && (!Number.isFinite(w.val) || (typeof right === 'number' && right > 0 && w.val <= 0))) continue;
      if (!far(right, w.val)) continue;
      if (picked.some((p) => p.str === w.str || !far(p.val, w.val))) continue;
      picked.push(w);
      if (picked.length === 3) break;
    }
    if (picked.length < 3) continue;
    const mc = { ...q, type: 'mc', options: shuffle([q.answer, ...picked.map((p) => p.str)]), mistakes: picked.map((p) => ({ option: p.str, why: p.why })) };
    delete mc.check;
    return mc;
  }
  throw new Error(`could not build a multiple-choice ${skillId} problem`);
}
const geoSetOk = (set) => !!set && set.subject === 'geo';
function gameQuestions(setOrId) {
  const set = typeof setOrId === 'string' ? CQ.getSet(setOrId) : setOrId;
  if (!geoSetOk(set)) return [];
  const here = shuffle(SKILLS.filter((s) => set.isAll || s.setId === set.id));
  if (!here.length) return [];
  const out = [];
  for (let i = 0; i < 12; i++) {
    const s = here[i % here.length];
    try {
      const q = generateMC(s.id, { difficulty: 1 + (i % 2) });
      out.push({ ...q, explanation: q.brief || q.explanation });
    } catch (e) { console.warn(e); }
  }
  return out;
}

/* ================================================================ screen */
const GEO_UNITS = [...new Set(SKILLS.map((s) => s.setId))];
const unitShort = (id) => `Unit ${id.replace('geo-u', '')}`;
function renderGeometry(set) {
  const all = !!set.isAll;
  const here = SKILLS.filter((s) => all || s.setId === set.id);
  const prefs = CQ.state.prefs.geom ||= { level: 'auto', skills: {} };
  prefs.skills ||= {};
  if (!['auto', 1, 2, 3].includes(prefs.level)) prefs.level = 'auto';
  let on = new Set((prefs.skills[set.id] || []).filter((id) => SK[id] && here.includes(SK[id])));
  if (!on.size) {
    // default to the current unit: this one, or on "All of Geometry" the unit studied last
    const last = CQ.state.prefs.last;
    const unit = all ? (GEO_UNITS.includes(last) ? last : GEO_UNITS[0]) : set.id;
    on = new Set(here.filter((s) => s.setId === unit).map((s) => s.id));
  }
  const bestKey = `geom-streak:${set.id}`;
  const S = { streak: 0, best: CQ.state.best[bestKey] || 0, right: 0, tries: 0, per: {}, lvl: {}, run: {}, last: [] };
  for (const s of here) S.per[s.id] = { right: 0, tries: 0 };
  let current = null;

  const v = el('div', { class: 'view gm' });
  v.append(CQ.panelHead(set, 'geometry', 'A new problem every time, with a drawn figure where the geometry needs one and a worked solution after each answer. Stuck? "Show me how" walks you through the method first — that attempt just won\'t count toward mastery.'));
  const levelSeg = el('div', { class: 'seg', role: 'group', 'aria-labelledby': 'gm-level-label' });
  const chips = el('div', { class: 'gm-chips' });
  const stats = el('div', { class: 'gm-stats', role: 'group', 'aria-label': 'This session' });
  const stage = el('div', { class: 'panel gm-stage' });
  const onCount = el('span', { class: 'note gm-count' });
  const skillsBox = all
    ? el('details', { class: 'gm-skills gm-fold', open: !matchMedia('(max-width: 600px)').matches || null },
      el('summary', {}, el('span', { class: 'gm-h', id: 'gm-skills-h' }, 'Skills'), onCount), chips)
    : el('section', { class: 'gm-skills', 'aria-labelledby': 'gm-skills-h' },
      el('div', { class: 'row between' }, el('h2', { class: 'gm-h', id: 'gm-skills-h' }, 'Skills'), onCount), chips);
  v.append(
    el('div', { class: 'toolbar' }, CQ.backBtn(set), el('span', { class: 'spacer' }), el('span', { class: 'note gm-seg-label', id: 'gm-level-label' }, 'Difficulty'), levelSeg),
    skillsBox, stats, stage);
  CQ.main.append(v);

  function drawLevels() {
    levelSeg.innerHTML = '';
    for (const [k, label] of [['auto', 'Auto'], [1, 'Warm-up'], [2, 'Standard'], [3, 'Challenge']]) {
      levelSeg.append(el('button', { type: 'button', class: prefs.level === k ? 'on' : '', 'aria-pressed': prefs.level === k ? 'true' : 'false', title: k === 'auto' ? 'Starts easy and steps up as you get problems right' : '', onclick: () => { prefs.level = k; CQ.save(); drawLevels(); if (current && !current.done) serve(); } }, label));
    }
  }
  function drawChips() {
    chips.innerHTML = '';
    const groups = all ? GEO_UNITS : [set.id];
    for (const sid of groups) {
      const mine = here.filter((x) => x.setId === sid);
      const allOn = mine.every((s) => on.has(s.id));
      const row = el('div', { class: 'gm-chip-row', role: 'group', 'aria-label': `${UNIT_NAMES[sid]} skills` },
        all ? el('button', { type: 'button', class: `gm-group${allOn && on.size === mine.length ? ' on' : ''}`, title: `Practice only ${UNIT_NAMES[sid]}`, 'aria-label': `Practice only ${UNIT_NAMES[sid]}`, onclick: () => only(sid) }, unitShort(sid)) : null);
      for (const s of mine) {
        const isOn = on.has(s.id);
        const t = S.per[s.id];
        const m = Math.min(2, CQ.state.mastery[`geom:${s.id}`] || 0);
        row.append(el('button', {
          type: 'button', class: `gm-chip${isOn ? ' on' : ''}`, 'aria-pressed': isOn ? 'true' : 'false',
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
    onCount.textContent = `${on.size} of ${here.length} on${all ? '' : ' · tap to turn a skill on or off'}`;
  }
  function saveOn() { prefs.skills[set.id] = [...on]; CQ.save(); drawChips(); }
  function only(sid) {
    on = new Set(here.filter((s) => s.setId === sid).map((s) => s.id));
    saveOn();
    if (current && !current.done && !on.has(current.q.skill)) serve();
    CQ.toast(`${UNIT_NAMES[sid]} skills on`);
  }
  function toggle(id) {
    if (on.has(id) && on.size === 1) { CQ.toast('Keep at least one skill on'); return; }
    if (on.has(id)) on.delete(id); else on.add(id);
    saveOn();
    if (current && !current.done && !on.has(current.q.skill)) serve();
  }
  function drawStats() {
    stats.innerHTML = '';
    stats.append(
      el('span', { class: 'gm-stat' }, el('span', { 'aria-hidden': 'true' }, '🔥'), ' Streak ', el('b', {}, String(S.streak))),
      el('span', { class: 'gm-stat' }, el('span', { 'aria-hidden': 'true' }, '🏆'), ' Best ', el('b', {}, String(S.best))),
      el('span', { class: 'gm-stat' }, el('span', { 'aria-hidden': 'true' }, '✅'), ' Right ', el('b', {}, `${S.right} / ${S.tries}`), ' this session'),
    );
  }
  function nextSkill() {
    const ids = [...on];
    if (ids.length === 1) return ids[0];
    const w = ids.map((id) => {
      let x = 3 - Math.min(2, CQ.state.mastery[`geom:${id}`] || 0);
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
    CQG.current = q;
    draw(q, lvl);
  }

  function draw(q, lvl) {
    stage.innerHTML = '';
    const st = current = { q, done: false, assisted: false, card: null };
    const hintId = `gm-hint-${Date.now()}`;
    const hintBox = el('div', { class: 'gm-hint', id: hintId, hidden: true });
    const hintBtn = el('button', { type: 'button', class: 'btn sm gm-hint-btn', 'aria-expanded': 'false', 'aria-controls': hintId, onclick: () => {
      if (st.done) return;
      const open = hintBox.hidden;
      hintBox.hidden = !open;
      hintBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      hintBtn.textContent = open ? 'Hide the method' : '💡 Show me how';
      if (open && !hintBox.childElementCount) {
        st.assisted = true;
        hintBox.append(el('p', { class: 'gm-assisted' }, el('span', { 'aria-hidden': 'true' }, '💡 '), 'Assisted — this problem won\'t count toward mastery. Finish it yourself, then try the next one on your own.'), q.hint());
      }
    } }, '💡 Show me how');
    const head = el('div', { class: 'gm-card-head' },
      el('span', { class: 'q-tag' }, q.ask),
      el('span', { class: 'gm-level' }, LEVEL_NAMES[lvl] || LEVEL_NAMES[2]),
      el('span', { class: 'gm-level unit' }, unitShort(q.setId)));

    let card;
    if (q.type === 'mc') {
      card = CQ.questionCard(q, { onAnswer: (ok) => settle(ok, ok ? '' : 'x', null), showTag: true, instant: true });
      card.classList.add('gm-card');
      card.querySelector('.q-tag')?.replaceWith(head);
      card.querySelector('.opts').after(el('div', { class: 'row gm-actions' }, hintBtn), hintBox);
    } else {
      card = el('div', { class: 'q-card gm-card' }, head);
      if (q.figure) card.append(el('div', { class: 'q-figure gm-figure', role: 'img', 'aria-label': q.figureAlt || 'Figure for this problem', html: q.figure }));
      card.append(el('div', { class: 'q-prompt' }, q.prompt));
      const inp = el('input', { class: 'input', type: 'text', placeholder: q.placeholder || 'Type your answer…', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', enterkeyhint: 'done', 'aria-label': 'Your answer' });
      const answerBtn = el('button', { type: 'button', class: 'btn primary', onclick: () => submit(false) }, 'Answer');
      const skipBtn = el('button', { type: 'button', class: 'btn ghost', onclick: () => submit(true) }, 'Don\'t know');
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(false); } });
      card.append(el('div', { class: 'written' }, inp, answerBtn, skipBtn));
      const ins = (t) => { const a = inp.selectionStart ?? inp.value.length, b = inp.selectionEnd ?? a; inp.value = inp.value.slice(0, a) + t + inp.value.slice(b); inp.focus(); inp.setSelectionRange(a + t.length, a + t.length); };
      const tools = el('div', { class: 'row gm-actions' }, hintBtn,
        ...(q.tools || []).map((t) => el('button', { type: 'button', class: 'btn sm ghost gm-tool', 'aria-label': t === 'π' ? 'Insert pi' : 'Insert square root', onclick: () => ins(t) }, t)),
        ...(q.ans && (q.ans.k === 'pair' || q.ans.k === 'num') ? [el('button', { type: 'button', class: 'btn sm ghost gm-tool', 'aria-label': 'Insert minus sign', onclick: () => ins('-') }, MINUS)] : []),
        ...(q.ans && q.ans.u === 'deg' ? [el('button', { type: 'button', class: 'btn sm ghost gm-tool', 'aria-label': 'Insert degree sign', onclick: () => ins('°') }, '°')] : []));
      card.append(tools, hintBox);
      if (matchMedia('(pointer: fine)').matches) CQ.later(() => inp.focus(), 60);
      st.input = inp;
      function submit(dontKnow) {
        if (st.done) return;
        const raw = inp.value.trim();
        if (!dontKnow && !raw) { inp.focus(); return; }
        inp.disabled = true; answerBtn.disabled = true; skipBtn.disabled = true;
        tools.remove();
        const g = dontKnow ? { ok: false, why: '' } : grade(q, raw);
        const fb = el('div', { class: `feedback ${g.ok ? 'good' : 'bad'}`, role: 'status', 'aria-live': 'polite' },
          el('b', { class: 'title' }, g.ok ? `✓ ${pick(['Correct!', 'Nice!', 'You got it!', 'Exactly right.'])}` : dontKnow ? ['Here\'s how it works. The answer is ', el('span', { class: 'gm-nowrap' }, q.answer)] : ['✗ Not quite — the answer is ', el('span', { class: 'gm-nowrap' }, q.answer)]),
          g.why ? el('p', { class: 'gm-why' }, g.why) : null,
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
        const ob = el('button', { type: 'button', class: 'btn sm ghost gm-override', onclick: () => {
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
      const next = el('button', { type: 'button', class: 'btn primary lg gm-next', onclick: serve }, 'Next problem →');
      st.card.append(el('div', { class: 'row' }, next, el('span', { class: 'note gm-keys' }, 'Enter ↵')));
      next.focus({ preventScroll: true });
      drawStats(); drawChips();
    }
  }

  const offKeys = CQ.onKeys((e) => {
    if (!current) return;
    if (current.done) {
      // Enter moves on (the Next button has focus, but a click elsewhere may have taken it)
      if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement) && !(e.target instanceof HTMLAnchorElement) && !(e.target instanceof HTMLElement && e.target.closest('summary'))) { e.preventDefault(); serve(); }
      return;
    }
    if (current.q.type === 'mc' && /^[1-4]$/.test(e.key) && current.card.pickByKey) current.card.pickByKey(e.key);
  });
  // for tests and screenshots: put a particular generated problem on screen
  CQG.show = (q) => { CQG.current = q; draw(q, q.level || 2); };
  CQ.addCleanup(() => { offKeys(); CQG.current = null; CQG.show = null; });
  drawLevels(); drawChips(); drawStats();
  serve();
}

/* ========================================================== registration */
CQ.registerMode({
  id: 'geometry', name: 'Geometry Lab', ico: '📐', color: '#4d8cff', before: 'match',
  desc: 'Endless new geometry problems — angles, proofs, triangles, trig, polygons, transformations, circles, area and volume — each with a figure and a worked solution.',
  available: geoSetOk,
  render: renderGeometry,
});
CQ.addGameSource(gameQuestions);
/* Mistakes re-serves a missed skill as a fresh problem through the core
   question card; its own q.check grades it exactly there too. */
CQ.registerItemResolver('geom', (id) => {
  const s = SK[id.split(':')[1]];
  if (!s) return null;
  return { setId: s.setId, label: `Geometry Lab · ${s.label}`, make: () => generate(s.id, { difficulty: 2 }) };
});

const CQG = window.CQGeometry = {
  skills: SKILLS.map(({ id, name, setId }) => ({ id, name, setId })),
  units: { ...UNIT_NAMES },
  generate,
  generateMC,
  gameQuestions,
  grade,
  current: null,
  show: null,
};
})();
