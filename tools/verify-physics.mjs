/**
 * Checks Physics Lab's generated problems (study/physics.js) against
 * independent physics written here — nothing in this file calls physics.js
 * to do the maths.
 *
 *   node tools/verify-physics.mjs [baseUrl] [--n=300] [--mc=60]
 *
 * With a baseUrl (e.g. http://127.0.0.1:8141) the page is served over HTTP;
 * without one, study/index.html is opened straight from disk. If the page
 * does not load physics.js yet, the script injects it.
 *
 * For every skill it generates --n problems (spread over the three levels)
 * and, for each one:
 *  - reads the givens back out of the prompt text (or the figure's alt text
 *    for a graph or a free-body diagram), converting units itself, and checks
 *    they match the machine-readable fields;
 *  - works the answer out again with its own formula and checks the
 *    canonical answer against the rounding the prompt states (no rounding
 *    stated means the answer must be exact), in the right unit;
 *  - puts inputs to the problem's own q.check: the answer and its equivalent
 *    forms (bare number, unit symbol, spelled-out unit, "x =", e-notation,
 *    a converted unit, a more precise value, a direction word) must pass;
 *    ×10, ÷10, a flipped sign, a wrong unit, a last-digit slip, a coarser
 *    rounding and the answer with g = 10 instead of 9.8 must fail;
 *  - checks the worked solution boxes the answer, the "Show me how" hint does
 *    not, the figure's alt text does not give the answer away, and no text
 *    anywhere holds NaN, undefined, null, Infinity or float noise.
 * Multiple-choice versions must have four distinct options with exactly one
 * right, every wrong one more than 1% away. Exits non-zero on any failure.
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
const MC = opt('mc', 60);
const SHOW = opt('show', 60);
const base = args.find((a) => !a.startsWith('--'));
const URL_ = base
  ? `${base.replace(/\/$/, '')}/study/`
  : pathToFileURL(fileURLToPath(new URL('../study/index.html', import.meta.url))).href;
const STUDY_DIR = fileURLToPath(new URL('../study/', import.meta.url));

/* ------------------------------------------------------------ numbers */
const PM = (s) => String(s).replace(/[−–]/g, '-');
const relClose = (a, b, tol = 1e-9) => Math.abs(a - b) <= Math.max(Math.abs(a), Math.abs(b)) * tol + 1e-15;
/** "1,500", "-3.2", "5.97 × 10^24" → Number */
function numText(s) {
  const t = PM(s).replace(/,/g, '').trim();
  const m = t.match(/^(-?\d*\.?\d+)(?: × 10\^(-?\d+))?$/);
  if (!m) return NaN;
  return Number(m[2] != null ? `${m[1]}e${m[2]}` : m[1]);
}
/* A given as the prompt writes it → its value in SI units. */
const SCALE = { g: 1e-3, mA: 1e-3, 'kΩ': 1e3, 'µC': 1e-6, 'μC': 1e-6, MHz: 1e6, nm: 1e-9, cm: 1e-2 };
function qty(text) {
  const t = PM(text).trim();
  if (t.startsWith('$')) return numText(t.slice(1));
  const m = t.match(/^(-?[\d,]*\.?\d+(?: × 10\^-?\d+)?)(?:\s*(.*))?$/);
  if (!m) return NaN;
  const unit = (m[2] || '').trim();
  return numText(m[1]) * (SCALE[unit] ?? 1);
}
/** Split an answer string: number text, value and unit. */
function splitAnswer(ans) {
  let t = PM(ans).trim();
  let unit = '';
  if (/^-?\$/.test(t)) { unit = '$'; t = t.replace('$', ''); } else if (/[%°]$/.test(t)) { unit = t.slice(-1); t = t.slice(0, -1); } else {
    const m = t.match(/^(-?[\d,]*\.?\d+(?: × 10\^-?\d+)?)(?: (.+))?$/);
    if (!m) return null;
    t = m[1]; unit = m[2] || '';
  }
  const value = numText(t);
  if (!Number.isFinite(value)) return null;
  const sci = t.match(/^(-?[\d.]+) × 10\^(-?\d+)$/);
  return { n: t.replace(/,/g, ''), value, unit, sci: sci ? { coef: sci[1], exp: Number(sci[2]) } : null };
}
const decimals = (s) => (s.split('.')[1] || '').length;
const sigOf = (s) => {
  const d = s.replace('-', '');
  if (d.includes('.')) return d.replace('.', '').replace(/^0+/, '').length;
  return d.replace(/^0+/, '').replace(/0+$/, '').length || 1;
};
/** Move the decimal point of a plain decimal string n places right (n < 0: left). */
function shift(str, n) {
  let s = PM(str).replace(/,/g, '');
  const neg = s.startsWith('-');
  if (neg) s = s.slice(1);
  const [i, f = ''] = s.split('.');
  let digits = i + f;
  let point = i.length + n;
  if (point < 0) { digits = '0'.repeat(-point) + digits; point = 0; }
  if (point > digits.length) digits += '0'.repeat(point - digits.length);
  let out = `${digits.slice(0, point) || '0'}${point < digits.length ? `.${digits.slice(point)}` : ''}`;
  out = out.replace(/^0+(?=\d)/, '');
  return (neg ? '-' : '') + out;
}
/** Change the digit at place 10^p of a plain decimal string by ±1. */
function slip(str, p, d) {
  const neg = str.startsWith('-');
  const s = neg ? str.slice(1) : str;
  const dp = Math.max(decimals(s), -p);
  const scaled = BigInt(Number(s).toFixed(dp).replace('.', ''));
  const step = 10n ** BigInt(dp + p);
  const next = scaled + BigInt(d) * step;
  if (next < 0n) return null;
  let t = next.toString().padStart(dp + 1, '0');
  if (dp) t = `${t.slice(0, -dp)}.${t.slice(-dp)}`;
  return (neg ? '-' : '') + t;
}
/** The value rounded as a rule says, as a plain string. */
function roundTo(v, rule) {
  if (rule.dp != null) return (Math.round((Math.abs(v) + 1e-12 * Math.abs(v)) * 10 ** rule.dp) / 10 ** rule.dp * Math.sign(v)).toFixed(rule.dp);
  return Number(v.toPrecision(rule.sf)).toString();
}

/* ------------------------------------------------------------ rules from the prompt */
function ruleOf(prompt) {
  let m;
  if ((m = prompt.match(/Give your answer in scientific notation to (\d) significant figures\./))) return { sf: Number(m[1]), sci: true };
  if ((m = prompt.match(/Give your answer to (\d) significant figures\./))) return { sf: Number(m[1]) };
  if ((m = prompt.match(/Round to (\d) decimal places?\./))) return { dp: Number(m[1]) };
  if (/Round to the nearest tenth of a degree\./.test(prompt)) return { dp: 1 };
  if (/Round to the nearest whole number\./.test(prompt)) return { dp: 0 };
  if (/Round to the nearest cent\./.test(prompt)) return { dp: 2 };
  return null;
}

/* ------------------------------------------------------------ physics, done again */
const deg = (x) => (x * Math.PI) / 180;
const todeg = (x) => (x * 180) / Math.PI;
const PHRASES = { doubled: 2, tripled: 3, halved: 0.5, 'cut in half': 0.5, 'made 4 times as large': 4, 'cut to one third': 1 / 3 };
/** Each solver gets the givens read from the text (G), the question and g. */
const SOLVE = {
  speed: {
    speed: (G) => G.d / G.t, distance: (G) => G.v * G.t, time: (G) => G.d / G.v,
    trip: (G) => (G.d1 + G.d2) / (G.t1 + G.t2), velocity: (G) => (G.d1 - G.d2) / (G.t1 + G.t2),
  },
  accel: { a: (G) => (G.v - G.v0) / G.t, v: (G) => G.v0 + G.a * G.t, t: (G) => (G.v - G.v0) / G.a, v0: (G) => G.v - G.a * G.t },
  kinematics: {
    x_t: (G) => G.v0 * G.t + 0.5 * G.a * G.t ** 2, v_x: (G) => Math.sqrt(G.v0 ** 2 + 2 * G.a * G.x), x_v: (G) => (G.v ** 2 - G.v0 ** 2) / (2 * G.a),
    a_x: (G) => (G.v ** 2 - G.v0 ** 2) / (2 * G.x), t_avg: (G) => (2 * G.x) / (G.v0 + G.v), x_avg: (G) => 0.5 * (G.v0 + G.v) * G.t,
  },
  freefall: {
    v_t: (G, q, g) => g * G.t, d_t: (G, q, g) => 0.5 * g * G.t ** 2, t_h: (G, q, g) => Math.sqrt((2 * G.h) / g),
    v_h: (G, q, g) => Math.sqrt(2 * g * G.h), up_t: (G, q, g) => G.v0 / g, up_h: (G, q, g) => G.v0 ** 2 / (2 * g),
  },
  graphs: {
    xt_slope: (G, q) => slopeOf(q), vt_slope: (G, q) => slopeOf(q), vt_area: (G, q) => areaOf(q),
  },
  components: {
    x: (G, q) => compSigns(q.prompt)[0] * G.A * Math.cos(deg(G.theta)),
    y: (G, q) => compSigns(q.prompt)[1] * G.A * Math.sin(deg(G.theta)),
  },
  resultant: { mag: (G) => Math.hypot(G.a, G.b), angle: (G) => todeg(Math.atan(G.b / G.a)) },
  projectile: {
    t: (G, q, g) => Math.sqrt((2 * G.h) / g), range: (G, q, g) => G.v0 * Math.sqrt((2 * G.h) / g),
    vy: (G, q, g) => Math.sqrt(2 * g * G.h), v0: (G, q, g) => G.x / Math.sqrt((2 * G.h) / g),
  },
  relative: {
    down: (G) => G.b + G.c, up: (G) => G.b - G.c, time_up: (G) => G.d / (G.b - G.c), time_down: (G) => G.d / (G.b + G.c),
    walk_with: (G) => G.w + G.s, walk_against: (G) => G.w - G.s, approach: (G) => G.v1 + G.v2, same: (G) => G.v1 - G.v2,
  },
  fma: { F: (G) => G.m * G.a, a: (G) => G.F / G.m, m: (G) => G.F / G.a },
  weight: { W: (G, q, g) => G.m * g, m: (G, q, g) => G.W / g, other: (G, q, g) => (G.WE / g) * G.gp },
  netforce: {
    two: (G, q) => lineForces(q.prompt), three: (G, q) => lineForces(q.prompt),
    accel: (G, q) => lineForces(q.prompt) / G.m, vert: (G, q, g) => G.T - G.m * g,
  },
  friction: {
    f_N: (G) => G.mu * G.N, mu: (G) => G.f / G.N, f_m: (G, q, g) => G.mu * G.m * g, accel: (G, q, g) => (G.F - G.mu * G.m * g) / G.m,
  },
  centripetal: { ac: (G) => G.v ** 2 / G.r, Fc: (G) => (G.m * G.v ** 2) / G.r, v: (G) => Math.sqrt((G.F * G.r) / G.m) },
  period: { T_f: (G) => 1 / G.f, f_T: (G) => 1 / G.T, T_count: (G) => G.t / G.N, f_count: (G) => G.N / G.t, v: (G) => (2 * Math.PI * G.r) / G.T },
  gravity: {
    F: (G) => (G.G * G.m1 * G.m2) / G.r ** 2, m2: (G) => (G.F * G.r ** 2) / (G.G * G.m1), r: (G) => Math.sqrt((G.G * G.m1 * G.m2) / G.F),
  },
  work: {
    W: (G) => G.F * G.d, F: (G) => G.W / G.d, d: (G) => G.W / G.F, lift: (G, q, g) => G.m * g * G.h,
    W_angle: (G) => G.F * G.d * Math.cos(deg(G.theta)), F_angle: (G) => G.W / (G.d * Math.cos(deg(G.theta))),
  },
  energy: {
    KE: (G) => 0.5 * G.m * G.v ** 2, v_KE: (G) => Math.sqrt((2 * G.KE) / G.m), m_KE: (G) => (2 * G.KE) / G.v ** 2,
    PE: (G, q, g) => G.m * g * G.h, h_PE: (G, q, g) => G.PE / (G.m * g),
  },
  conservation: {
    v_drop: (G, q, g) => Math.sqrt(2 * g * G.h), h_up: (G, q, g) => G.v ** 2 / (2 * g),
    v_between: (G, q, g) => Math.sqrt(2 * g * (G.h1 - G.h2)), v_with_v0: (G, q, g) => Math.sqrt(G.v0 ** 2 + 2 * g * G.h),
  },
  power: { P: (G) => G.W / G.t, t: (G) => G.W / G.P, W: (G) => G.P * G.t, P_Fd: (G) => (G.F * G.d) / G.t, lift: (G, q, g) => (G.m * g * G.h) / G.t },
  efficiency: {
    eff: (G) => (G.Eout / G.Ein) * 100, out: (G) => (G.Ein * G.eff) / 100, in: (G) => G.Eout / (G.eff / 100),
    motor: (G, q, g) => ((G.m * g * G.h) / (G.P * G.t)) * 100,
  },
  momentum: { p: (G) => G.m * G.v, v: (G) => G.p / G.m, m: (G) => G.p / G.v },
  impulse: {
    J_Ft: (G) => G.F * G.t, J_dp: (G) => G.m * (G.v - G.v0), F: (G) => (G.m * G.v0) / G.t, dt: (G) => (G.m * G.v0) / G.F, bounce: (G) => G.m * (G.v + G.v0),
  },
  inelastic: {
    rest: (G) => (G.m1 * G.v1) / (G.m1 + G.m2), same: (G) => (G.m1 * G.v1 + G.m2 * G.v2) / (G.m1 + G.m2),
    opposite: (G) => (G.m1 * G.v1 - G.m2 * Math.abs(G.v2)) / (G.m1 + G.m2),
  },
  recoil: { speed: (G) => (G.mb * G.vb) / G.ma, velocity: (G) => -(G.mb * G.vb) / G.ma, find_v1: (G) => (G.ma * G.va) / G.mb },
  waves: { v: (G) => G.f * G.lambda, f: (G) => G.v / G.lambda, lambda: (G) => G.v / G.f, sound_lambda: (G) => 343 / G.f, sound_f: (G) => 343 / G.lambda },
  waveperiod: { T: (G) => 1 / G.f, f: (G) => 1 / G.T, f_count: (G) => G.N / G.t, T_count: (G) => G.t / G.N, v_T: (G) => G.lambda / G.T },
  echo: { d: (G) => (343 * G.t) / 2, t: (G) => (2 * G.d) / 343, oneway: (G) => 343 * G.t },
  emwaves: { lambda: (G) => G.c / G.f, f: (G) => G.c / G.lambda },
  refraction: { n: (G) => G.c / G.v, v: (G) => G.c / G.n },
  snell: {
    theta2: (G) => todeg(Math.asin((G.n1 * Math.sin(deg(G.t1))) / G.n2)), theta1: (G) => todeg(Math.asin((G.n2 * Math.sin(deg(G.t2))) / G.n1)),
    n2: (G) => (G.n1 * Math.sin(deg(G.t1))) / Math.sin(deg(G.t2)),
  },
  lenses: {
    di: (G) => 1 / (1 / G.f - 1 / G.do), mirror: (G) => 1 / (1 / G.f - 1 / G.do), mag: (G) => -G.di / G.do,
    hi: (G) => -(1 / (1 / G.f - 1 / G.do) / G.do) * G.ho,
  },
  ohm: { V: (G) => G.I * G.R, I: (G) => G.V / G.R, R: (G) => G.V / G.I },
  resistors: {
    series: (G) => ['R1', 'R2', 'R3'].reduce((s, k) => s + (G[k] || 0), 0),
    parallel: (G) => 1 / ['R1', 'R2', 'R3'].filter((k) => G[k]).reduce((s, k) => s + 1 / G[k], 0),
    combo: (G) => G.R1 + 1 / (1 / G.R2 + 1 / G.R3),
  },
  circuit: {
    I: (G) => G.V / sumR(G), V: (G) => G.I * sumR(G),
    V1: (G, q) => { const r = qty(q.prompt.match(/voltage across the (\S+ Ω) resistor/)[1]); return (G.V * r) / sumR(G); },
  },
  epower: { P_IV: (G) => G.I * G.V, I_PV: (G) => G.P / G.V, P_I2R: (G) => G.I ** 2 * G.R, P_V2R: (G) => G.V ** 2 / G.R },
  kwh: { E: (G) => (G.P / 1000) * G.h, cost: (G) => (G.P / 1000) * G.h * G.rate, cost_days: (G) => (G.P / 1000) * G.h * G.days * G.rate },
  coulomb: { F: (G) => (G.k * G.q1 * G.q2) / G.r ** 2, r: (G) => Math.sqrt((G.k * G.q1 * G.q2) / G.F) },
};
const sumR = (G) => ['R1', 'R2', 'R3'].reduce((s, k) => s + (G[k] || 0), 0);
function compSigns(prompt) {
  if (/north of west/.test(prompt)) return [-1, 1];
  if (/south of east/.test(prompt)) return [1, -1];
  if (/south of west/.test(prompt)) return [-1, -1];
  return [1, 1];
}
/** Forces along a line as the prompt lists them: "140 N to the right". */
function lineForces(prompt) {
  let net = 0, n = 0;
  for (const m of prompt.matchAll(/([\d,.]+) N to the (right|left)/g)) { net += (m[2] === 'right' ? 1 : -1) * numText(m[1]); n++; }
  if (n < 2) throw new Error('fewer than two forces in the prompt');
  return net;
}
/** The graph's points, read from its alt text. */
function graphPoints(q) {
  const pts = [...q.figureAlt.matchAll(/\((-?[\d.]+) s, (-?[\d.]+) (?:m\/s|m)\)/g)].map((m) => [Number(m[1]), Number(m[2])]);
  if (pts.length < 2) throw new Error('no points in the graph description');
  return pts;
}
function slopeOf(q) {
  const [, a, b] = q.prompt.match(/between ([\d.]+) s and ([\d.]+) s/).map(Number);
  const pts = graphPoints(q);
  const pa = pts.find((p) => p[0] === a), pb = pts.find((p) => p[0] === b);
  if (!pa || !pb) throw new Error('the times asked about are not points of the graph');
  // the stretch between them must be one straight segment
  if (pts.some((p) => p[0] > a && p[0] < b)) throw new Error('the asked-for stretch bends');
  return (pb[1] - pa[1]) / (b - a);
}
function areaOf(q) {
  const [, a, b] = q.prompt.match(/from ([\d.]+) s to ([\d.]+) s/).map(Number);
  const pts = graphPoints(q).filter((p) => p[0] >= a && p[0] <= b);
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += 0.5 * (pts[i][1] + pts[i - 1][1]) * (pts[i][0] - pts[i - 1][0]);
  return s;
}
/** Does the answer depend on g? Work it out with g = 10 as well and see. */
function usesG(q) {
  const s = (SOLVE[q.skill] || {})[q.variant];
  if (!s || !q.G) return false;
  try { return !relClose(s(q.G, q, 9.8), s(q.G, q, 10), 1e-12); } catch { return false; }
}

/* The unit each kind of answer must carry. */
const UNIT = {
  speed: { speed: 'm/s', distance: 'm', time: 's', trip: 'm/s', velocity: 'm/s' },
  accel: { a: 'm/s²', v: 'm/s', t: 's', v0: 'm/s' },
  kinematics: { x_t: 'm', v_x: 'm/s', x_v: 'm', a_x: 'm/s²', t_avg: 's', x_avg: 'm' },
  freefall: { v_t: 'm/s', d_t: 'm', t_h: 's', v_h: 'm/s', up_t: 's', up_h: 'm' },
  graphs: { xt_slope: 'm/s', vt_slope: 'm/s²', vt_area: 'm' },
  resultant: { mag: null, angle: '°' },
  projectile: { t: 's', range: 'm', vy: 'm/s', v0: 'm/s' },
  relative: { time_up: 's', time_down: 's', '*': 'm/s' },
  fma: { F: 'N', a: 'm/s²', m: 'kg' },
  weight: { W: 'N', m: 'kg', other: 'N' },
  netforce: { accel: 'm/s²', '*': 'N' },
  friction: { mu: '', accel: 'm/s²', '*': 'N' },
  centripetal: { ac: 'm/s²', Fc: 'N', v: 'm/s' },
  period: { T_f: 's', T_count: 's', f_T: 'Hz', f_count: 'Hz', v: 'm/s' },
  gravity: { F: 'N', m2: 'kg', r: 'm' },
  work: { F: 'N', d: 'm', F_angle: 'N', '*': 'J' },
  energy: { v_KE: 'm/s', m_KE: 'kg', h_PE: 'm', '*': 'J' },
  conservation: { h_up: 'm', '*': 'm/s' },
  power: { t: 's', W: 'J', '*': 'W' },
  efficiency: { eff: '%', motor: '%', '*': 'J' },
  momentum: { p: 'kg·m/s', v: 'm/s', m: 'kg' },
  impulse: { F: 'N', dt: 's', '*': 'N·s' },
  inelastic: { '*': 'm/s' }, recoil: { '*': 'm/s' },
  waves: { v: 'm/s', f: 'Hz', sound_f: 'Hz', '*': 'm' },
  waveperiod: { T: 's', T_count: 's', v_T: 'm/s', '*': 'Hz' },
  echo: { t: 's', '*': 'm' },
  emwaves: { lambda: 'm', f: 'Hz' }, refraction: { n: '', v: 'm/s' }, snell: { n2: '', '*': '°' },
  lenses: { mag: '', '*': 'm' },
  ohm: { V: 'V', I: 'A', R: 'Ω' }, resistors: { '*': 'Ω' }, circuit: { I: 'A', '*': 'V' },
  epower: { I_PV: 'A', '*': 'W' }, kwh: { E: 'kWh', '*': '$' }, coulomb: { F: 'N', r: 'm' },
};
function unitFor(q) {
  if (q.skill === 'components' || (q.skill === 'resultant' && q.variant === 'mag')) {
    // the vector's own unit, as the prompt gives its size
    return (q.prompt.match(/(?:of|at) [\d,.]+ (m\/s|N|m)\b/) || q.prompt.match(/[\d,.]+ (m\/s|N|m)\b/))[1];
  }
  const t = UNIT[q.skill] || {};
  return t[q.variant] !== undefined ? t[q.variant] : t['*'];
}
/* How the unit may be spelled out, and units that are wrong for it. */
const SPELLED = {
  m: ['meters', 'metres', 'meter'], s: ['seconds', 'sec'], 'm/s': ['meters per second', 'm/sec'], 'm/s²': ['meters per second squared', 'm/s^2', 'm/s/s'],
  N: ['newtons', 'newton'], kg: ['kilograms', 'kg'], J: ['joules', 'N·m'], W: ['watts', 'J/s'], Hz: ['hertz', 'Hz'], 'kg·m/s': ['kg m/s', 'kg*m/s', 'N·s'],
  'N·s': ['newton seconds', 'N s', 'kg·m/s'], 'Ω': ['ohms', 'ohm'], A: ['amps', 'amperes'], V: ['volts', 'volt'], C: ['coulombs'], '°': ['degrees', 'deg'],
  kWh: ['kilowatt-hours', 'kW·h'], $: ['dollars'], '%': ['percent'], '': [],
};
const WRONG_UNITS = {
  m: ['m/s', 's', 'M'], s: ['m', 'Hz'], 'm/s': ['m/s²', 'm'], 'm/s²': ['m/s', 'N'], N: ['kg', 'J'], kg: ['N', 'kg·m/s'], J: ['W', 'N'], W: ['J', 'kWh'],
  Hz: ['s', 'm'], 'kg·m/s': ['kg', 'J'], 'N·s': ['N', 'J'], 'Ω': ['V', 'A'], A: ['V', 'Ω'], V: ['A', 'W'], C: ['N'], '°': ['rad', 'm'], kWh: ['W', 'J'],
  $: ['kWh'], '%': ['J'], '': ['m', 'N'],
};
/** A converted unit that says the same thing: [unit, power of ten to shift the number]. */
const CONVERTED = { m: ['cm', 2], s: ['ms', 3], kg: ['g', 3], J: ['kJ', -3], W: ['kW', -3], A: ['mA', 3], 'Ω': ['kΩ', -3], Hz: ['kHz', -3] };

/* ------------------------------------------------------------ one question */
const BAD = /NaN|undefined|\bnull\b|Infinity|\[object|\d\.\d*?(?:0{7,}|9{7,})\d/;
/* ------------------------------------------------------------ believable content
   Numbers can be right and the story still wrong: a 49 kg egg, a "liquid" with
   the index of air, a conversion note for a unit the problem never uses. */
const MASS_RANGES = [
  [/^egg\b/, 0.04, 0.08], [/^ball\b/, 0.04, 2], [/^bowling ball/, 3, 8], [/^stunt dummy/, 45, 100], [/^package\b/, 0.5, 40],
  [/^skier\b/, 40, 110], [/^roller-coaster car/, 250, 1000], [/^go-kart/, 80, 300],
  [/^couch\b/, 25, 100], [/^sled\b/, 3, 50], [/^filing cabinet/, 15, 90],
];
function plausible(q) {
  const out = [];
  const P = PM(q.prompt);
  for (const m of P.matchAll(/(?:^|[.?] )An? (\d[\d,]*(?:\.\d+)?) kg ([a-z-]+(?: [a-z-]+)?)/g)) {
    const kg = Number(m[1].replace(/,/g, ''));
    const r = MASS_RANGES.find(([re]) => re.test(m[2]));
    if (r && (kg < r[1] || kg > r[2])) out.push(`an unbelievable mass: ${kg} kg for "${m[2]}"`);
  }
  if (/\b(runner|cyclist|skateboarder|sprinter|skier|skater|child|student)\b[^.?]*\b(it|its)\b/i.test(P)) out.push('a person is called "it"');
  if (q.skill === 'snell' && q.variant === 'n2') {
    const n = Number(PM(q.answer));
    if (!(n >= 1.3 && n <= 1.65)) out.push(`a liquid with n = ${q.answer}`);
    const t1 = Number((q.figureAlt.match(/θ₁ = ([\d.]+)°/) || [])[1]), t2 = Number((q.figureAlt.match(/θ₂ = ([\d.]+)°/) || [])[1]);
    const says = /bends toward/.test(q.figureAlt) ? 'toward' : /bends away/.test(q.figureAlt) ? 'away' : null;
    if (says !== (t2 < t1 ? 'toward' : 'away')) out.push(`the alt text says the ray bends ${says} the normal, but θ₁ = ${t1}°, θ₂ = ${t2}°`);
  }
  for (const [word, unit] of [['Kilohms', 'kΩ'], ['Milliamps', 'mA']]) {
    if ((new RegExp(word).test(q.exp || '') || new RegExp(word).test(q.hint || '')) && !P.includes(unit)) out.push(`a "${word} …" note, but the prompt has no ${unit}`);
  }
  if (q.figureAlt && /^A free-body diagram/.test(q.figureAlt)) {
    if (!/^A free-body diagram of an? [a-z -]+\. [A-Z]/.test(q.figureAlt)) out.push(`free-body alt text: ${q.figureAlt.slice(0, 80)}`);
    if (/bucket/.test(P) && !/diagram of a bucket/.test(q.figureAlt)) out.push('the free-body alt text does not name the bucket');
  }
  if (q.skill === 'gravity' && q.variant === 'F' && q.type === 'written' && !/× 10\^/.test(q.answer)) out.push(`a gravitational force not in scientific notation: ${q.answer}`);
  if (q.brief) {
    const b = PM(q.brief);
    if (/\bg[A-Z][a-z]+/.test(b)) out.push(`a lost subscript in the one-line explanation: ${b}`);
    if (/\/\d+[A-Za-z(]/.test(b)) out.push(`an ambiguous denominator in the one-line explanation: ${b}`);
    if (q.skill === 'recoil' && q.variant === 'speed' && /= -/.test(b)) out.push(`a recoil speed explained with a minus sign: ${b}`);
    if (/^Then\b/.test(b)) out.push(`the one-line explanation starts mid-way: ${b}`);
  }
  return out;
}

function checkQuestion(q) {
  const problems = [];
  const say = (m) => problems.push(m);
  for (const [k, t] of Object.entries({ prompt: q.prompt, answer: q.answer, exp: q.exp, hint: q.hint, alt: q.figureAlt, figure: q.figureText, options: (q.options || []).join(' | '), brief: q.brief })) {
    if (t != null && BAD.test(t)) say(`bad text in ${k}: ${t.match(BAD)[0]} … ${String(t).slice(0, 140)}`);
  }
  if (q.id !== `physlab:${q.skill}`) say(`id is ${q.id}`);
  if (q.setId !== q.expectSet) say(`setId is ${q.setId}, expected ${q.expectSet}`);
  if (!q.expHasAnswer) say(`the worked solution does not box the answer ${q.answer}`);
  if (q.hintBoxes) say('"Show me how" shows a boxed answer');
  if (q.hint) {
    const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // a unitless answer (a magnification, an index) must not be the start of a quantity with a unit
    const after = /\d$/.test(PM(q.answer)) ? '(?![\\d.,/²·^]|\\s*(?:×|divided|[A-Za-zΩµ°%]))' : '(?![\\d/²·^])';
    if (new RegExp(`[=≈] ${esc(PM(q.answer).replace('^', ''))}${after}`).test(PM(q.hint))) say('"Show me how" gives the final answer');
  }
  if (q.figure && !q.figureAlt) say('a figure without alt text');
  if (q.nts && !/Not drawn to scale/.test(q.figureText || '')) say('a figure that is not to scale is not labelled so');
  if (['graphs', 'fbd', 'projectile', 'resistors', 'circuit', 'lenses', 'snell', 'components', 'resultant'].includes(q.skill) && !q.figure && q.type !== 'mcGame') say('no figure');
  problems.push(...plausible(q));
  if (q.type === 'mc') return [...problems, ...checkNativeMC(q)];

  // givens: each is in the prompt (or the figure description) as written, and means what the fields say
  const G = {};
  const inText = PM(`${q.prompt} ${q.figureAlt || ''}`);
  for (const [k, t] of Object.entries(q.givenText || {})) {
    const v = qty(t);
    const field = q.givens[k];
    if (!inText.includes(PM(t))) {
      if (field === 0 && /\b(rest|stop|stops|highest point|how high)\b/i.test(q.prompt)) { G[k] = 0; continue; }
      say(`given ${k} = "${t}" is not in the prompt`);
      continue;
    }
    if (!Number.isFinite(v)) { say(`given ${k} = "${t}" is not a quantity`); continue; }
    const want = q.skill === 'netforce' && /^F\d$/.test(k) ? Math.abs(field) : q.skill === 'inelastic' && k === 'v2' ? Math.abs(field) : field;
    if (!relClose(v, want, 1e-9)) say(`given ${k}: the prompt says "${t}" (${v}) but the field says ${field}`);
    G[k] = v;
  }
  if (q.skill === 'graphs') {
    const pts = graphPoints(q);
    if (JSON.stringify(pts) !== JSON.stringify(q.givens.pts)) say(`the graph description lists ${JSON.stringify(pts)}, the field ${JSON.stringify(q.givens.pts)}`);
  }
  const solver = (SOLVE[q.skill] || {})[q.variant];
  if (!solver) return [...problems, `no independent solver for ${q.skill}/${q.variant}`];
  let truth;
  try { truth = solver(G, q, 9.8); } catch (e) { return [...problems, `could not work it out: ${e.message}`]; }
  if (!Number.isFinite(truth)) return [...problems, `the givens give ${truth}`];
  if (!relClose(q.value, truth, 1e-9)) say(`value field ${q.value}, expected ${truth}`);

  // constants are stated where they are used
  q.G = G;
  if (usesG(q) && !/g = 9\.8 m\/s²/.test(q.prompt)) say('uses g but does not say g = 9.8 m/s²');
  if (q.skill === 'gravity' && !/G = 6\.67 × 10\^-11 N·m²\/kg²/.test(q.prompt)) say('does not state G');
  if (q.skill === 'coulomb' && !/k = 8\.99 × 10\^9 N·m²\/C²/.test(q.prompt)) say('does not state k');
  if (['emwaves', 'refraction'].includes(q.skill) && !/c = 3\.00 × 10\^8 m\/s/.test(q.prompt)) say('does not state c');
  if (q.skill === 'echo' || /^sound_/.test(q.variant)) { if (!/343 m\/s/.test(q.prompt)) say('does not state the speed of sound'); }
  if (truth < 0 && !/as positive|as \+x|negative/.test(q.prompt)) say('a negative answer without a sign convention in the prompt');

  // the canonical answer: right unit, right value, stated rounding
  const a = splitAnswer(q.answer);
  if (!a) return [...problems, `answer not understood: ${q.answer}`];
  const unit = unitFor(q);
  if (unit == null) say('no expected unit');
  else if (a.unit !== unit) say(`answer unit "${a.unit}", expected "${unit}"`);
  const rule = ruleOf(q.prompt);
  if (!rule) {
    if (!relClose(a.value, truth, 1e-9)) say(`no rounding stated, but ${q.answer} is not exactly ${truth}`);
    if (Math.abs(truth - Number(truth.toFixed(6))) > 1e-9 * Math.abs(truth) && !a.sci) say(`no rounding stated, but ${truth} is not a short exact decimal`);
  } else {
    if (rule.dp != null) {
      if (decimals(a.n) !== rule.dp) say(`asked for ${rule.dp} decimal places, answer ${q.answer}`);
      if (Math.abs(a.value - truth) > 0.5 * 10 ** -rule.dp * (1 + 1e-9)) say(`${q.answer} is not ${truth} rounded to ${rule.dp} decimal places`);
    } else {
      const want = Number(truth.toPrecision(rule.sf));
      if (!relClose(a.value, want, 1e-9)) say(`${q.answer} is not ${truth} to ${rule.sf} significant figures (${want})`);
      const digits = a.sci ? a.sci.coef.replace('-', '').replace('.', '').length : sigOf(a.n);
      if (a.sci ? digits !== rule.sf : digits > rule.sf) say(`${q.answer} does not show ${rule.sf} significant figures`);
      if (a.n.includes('.') && sigOf(a.n) !== rule.sf && !a.sci) say(`${q.answer} does not show ${rule.sf} significant figures`);
    }
    if (rule.sci && !(a.sci && Math.abs(Number(a.sci.coef)) >= 1 && Math.abs(Number(a.sci.coef)) < 10)) say(`asked for scientific notation, answer ${q.answer}`);
  }
  if (q.figureAlt && q.answer) {
    const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(^|[^\\d.,])${esc(PM(q.answer))}(?![\\d/²·])`);
    if (re.test(PM(q.figureAlt))) say('the figure description gives the answer');
  }
  q.truth = truth; q.rule = rule; q.parsed = a; q.G = G;
  return problems;
}

function checkNativeMC(q) {
  const bad = [];
  if (!q.options || q.options.length !== 4) return [`${q.options ? q.options.length : 0} options`];
  if (new Set(q.options).size !== 4) bad.push('two options are the same');
  if (!q.options.includes(q.answer)) bad.push('the answer is not an option');
  if (q.skill === 'fbd') {
    const forces = {};
    for (const m of q.figureAlt.matchAll(/(?:[Tt]he normal force N|(?:[Tt]he )?[Ww]eight W|[Tt]he applied force F|[Ff]riction f|[Tt]ension T) = ([\d.]+) N acts (up|down|to the right|to the left)/g)) forces[m[2]] = (forces[m[2]] || 0) + Number(m[1]);
    const right = forces['to the right'] || 0, left = forces['to the left'] || 0, up = forces.up || 0, down = forces.down || 0;
    const mass = Number((q.prompt.match(/mass of (\d+) kg/) || q.prompt.match(/An? (\d+) kg bucket/) || [])[1]);
    let want;
    if (/constant velocity/.test(q.prompt)) {
      const m = q.figureAlt.match(/the applied force F = ([\d.]+) N/);
      want = { mag: Number(m[1]), dir: '' };
    } else {
      const nx = right - left, ny = up - down;
      if (nx && ny) return ['forces unbalanced both ways'];
      const net = nx || ny;
      const dir = nx ? (nx > 0 ? 'to the right' : 'to the left') : (ny > 0 ? 'upward' : 'downward');
      const isAccel = /acceleration/.test(q.prompt);
      want = { mag: isAccel ? Math.abs(net) / mass : Math.abs(net), dir, dp: isAccel ? 2 : null };
    }
    const parse = (o) => { const m = PM(o).match(/^([\d.]+) (N|m\/s²)(?: (.*))?$/); return m ? { mag: Number(m[1]), dir: m[3] || '' } : null; };
    const right_ = q.options.filter((o) => {
      const p = parse(o);
      if (!p) { bad.push(`option not understood: ${o}`); return false; }
      const magOk = want.dp != null ? Math.abs(p.mag - want.mag) <= 0.005 * (1 + 1e-9) : relClose(p.mag, want.mag, 1e-9);
      return magOk && p.dir === want.dir;
    });
    if (right_.length !== 1) bad.push(`${right_.length} options are right (want ${want.mag} ${want.dir}): ${q.options.join(' | ')}`);
    if (right_[0] !== q.answer) bad.push(`the marked answer ${q.answer} is not the right one (${right_[0]})`);
    for (const o of q.options) {
      const p = parse(o);
      if (o === q.answer || !p) continue;
      if (p.dir === want.dir && Math.abs(p.mag - want.mag) <= 0.01 * want.mag) bad.push(`option ${o} is within 1% of the answer`);
    }
    return bad;
  }
  if (q.skill === 'gravchange') {
    let k = 1;
    const said = (who) => { const m = q.prompt.match(new RegExp(`${who} is (doubled|tripled|halved|cut in half|made 4 times as large|cut to one third)`)); return m ? PHRASES[m[1]] : 1; };
    k = (said('the first mass') * said('the second mass')) / said('the distance between them') ** 2;
    const base = q.prompt.match(/force of (\d+) N/);
    const val = (o) => {
      if (base) return numText(o.replace(/ N$/, '')) / Number(base[1]);
      if (/^It stays the same/.test(o)) return 1;
      let m;
      if ((m = o.match(/^(\d+)F\/(\d+) /))) return Number(m[1]) / Number(m[2]);
      if ((m = o.match(/^F\/(\d+) /))) return 1 / Number(m[1]);
      if ((m = o.match(/^(\d+)F /))) return Number(m[1]);
      return NaN;
    };
    const vals = q.options.map(val);
    if (vals.some((v) => !Number.isFinite(v))) bad.push(`option not understood: ${q.options.join(' | ')}`);
    const right_ = q.options.filter((o, i) => relClose(vals[i], k, 1e-9));
    if (right_.length !== 1 || right_[0] !== q.answer) bad.push(`expected factor ${k}; right options: ${right_.join(' | ') || 'none'}; marked ${q.answer}`);
    for (let i = 0; i < 4; i++) if (q.options[i] !== q.answer && Math.abs(vals[i] - k) <= 0.01 * k) bad.push(`option ${q.options[i]} is within 1% of the answer`);
    return bad;
  }
  return [`no multiple-choice check for ${q.skill}`];
}

/** A multiple-choice version of a typed problem: one right option, three more than 1% away. */
function checkMC(q) {
  const bad = [];
  if (!q.options || q.options.length !== 4) return [`${q.options ? q.options.length : 0} options`];
  if (new Set(q.options).size !== 4) bad.push('two options are the same');
  if (!q.options.includes(q.answer)) bad.push('the answer is not an option');
  const rule = ruleOf(q.prompt);
  const truth = q.truth;
  const unit = unitFor(q);
  const ok = (a) => {
    if (!rule) return relClose(a.value, truth, 1e-9);
    if (rule.dp != null) return Math.abs(a.value - truth) <= 0.5 * 10 ** -rule.dp * (1 + 1e-9);
    return relClose(a.value, Number(truth.toPrecision(rule.sf)), 1e-9);
  };
  const parsed = q.options.map(splitAnswer);
  if (parsed.some((p) => !p)) return [`option not understood: ${q.options.join(' | ')}`];
  const right = q.options.filter((o, i) => ok(parsed[i]));
  if (right.length !== 1) bad.push(`${right.length} options are right: ${q.options.join(' | ')}`);
  if (right[0] !== q.answer) bad.push(`the marked answer ${q.answer} is not the right one`);
  for (let i = 0; i < 4; i++) {
    if (parsed[i].unit !== unit) bad.push(`option ${q.options[i]} has the wrong unit`);
    if (q.options[i] !== q.answer && Math.abs(parsed[i].value - truth) <= 0.01 * Math.abs(truth)) bad.push(`option ${q.options[i]} is within 1% of the answer`);
    for (let j = 0; j < i; j++) if (Math.abs(parsed[i].value - parsed[j].value) <= 0.01 * Math.max(Math.abs(parsed[i].value), Math.abs(parsed[j].value))) bad.push(`options ${q.options[j]} and ${q.options[i]} are within 1% of each other`);
  }
  return bad;
}

/* ------------------------------------------------------------ typed inputs */
const withU = (n, u) => (u === '$' ? (n.startsWith('-') ? `-$${n.slice(1)}` : `$${n}`) : u === '%' || u === '°' ? `${n}${u}` : u ? `${n} ${u}` : n);
function inputsFor(q) {
  const a = q.parsed, u = a.unit, rule = q.rule, truth = q.truth;
  const reqs = [];
  const yes = (input, why) => reqs.push({ input, expect: true, why });
  const no = (input, why) => reqs.push({ input, expect: false, why });
  const num = a.sci ? `${a.sci.coef} × 10^${a.sci.exp}` : a.n;
  yes(q.answer, 'the canonical answer');
  for (const x of q.accept || []) yes(x, `accepted variant "${x}"`);
  if (u) yes(num, 'the number alone');
  for (const w of SPELLED[u] || []) yes(withU(num, w === '°' ? '°' : w).replace(/(\d)(degrees|deg)$/, '$1 $2'), `spelled-out unit "${w}"`);
  yes(`x = ${withU(num, u)}`, '"x =" in front');
  if (a.value < 0) yes(withU(num.replace('-', '−'), u), 'the Unicode minus');
  if (a.sci) {
    yes(withU(`${a.sci.coef}e${a.sci.exp}`, u), 'e-notation');
    yes(`${a.sci.coef} x 10^${a.sci.exp}`, '"x 10^" without the unit');
    yes(withU(`${a.sci.coef}*10^${a.sci.exp}`, u), '"*10^"');
  }
  if (q.dirs && a.value !== 0) {
    const words = a.value < 0 ? q.dirs.neg : q.dirs.pos;
    if (words && words.length) yes(withU(num.replace('-', ''), u) + ` ${words[0]}`, `a direction word ("${words[0]}")`);
    const other = a.value < 0 ? q.dirs.pos : q.dirs.neg;
    if (other && other.length) no(withU(num.replace('-', ''), u) + ` ${other[0]}`, `the opposite direction word ("${other[0]}")`);
  }
  if (CONVERTED[u] && !a.sci) yes(`${shift(a.n, CONVERTED[u][1])} ${CONVERTED[u][0]}`, `the same answer in ${CONVERTED[u][0]}`);
  if (rule && !a.sci) {
    const precise = rule.dp != null ? truth.toFixed(rule.dp + 2) : truth.toPrecision(rule.sf + 2);
    if (!relClose(Number(precise), a.value, 1e-12)) yes(withU(Number(precise).toString().includes('e') ? precise : precise, u), 'a more precise value');
  }
  // wrong answers
  if (a.value !== 0) {
    if (a.sci) {
      no(withU(`${a.sci.coef} × 10^${a.sci.exp + 1}`, u), '×10'); no(withU(`${a.sci.coef} × 10^${a.sci.exp - 1}`, u), '÷10');
      if (a.sci.exp) no(withU(`${a.sci.coef} × 10^${-a.sci.exp}`, u), 'the exponent\'s sign flipped');
    } else { no(withU(shift(a.n, 1), u), '×10'); no(withU(shift(a.n, -1), u), '÷10'); }
    no(withU(num.startsWith('-') ? num.slice(1) : `-${num}`, u), 'sign flipped');
  }
  for (const w of WRONG_UNITS[u] || []) no(`${num} ${w}`, `a wrong unit (${w})`);
  // a slip in the last digit shown
  const body = a.sci ? a.sci.coef : a.n;
  let place;
  if (body.includes('.')) place = -decimals(body);
  else if (rule && rule.sf && !a.sci) place = Math.max(0, body.replace('-', '').length - rule.sf);
  else place = body.replace('-', '').length - body.replace('-', '').replace(/0+$/, '').length;
  for (const d of [1, -1]) {
    const s2 = slip(body, place, d);
    if (s2 == null || Number(s2) === 0) continue;
    no(withU(a.sci ? `${s2} × 10^${a.sci.exp}` : s2, u), `a last-digit slip (${d > 0 ? '+' : '−'}1)`);
  }
  // rounded less than asked
  if (rule && rule.dp && !a.sci) {
    const coarse = roundTo(truth, { dp: rule.dp - 1 });
    if (!relClose(Number(coarse), a.value, 1e-12)) no(withU(coarse, u), 'rounded to one place fewer');
  }
  // g = 10 instead of 9.8
  if (usesG(q)) {
    const s = SOLVE[q.skill][q.variant];
    const v10 = s(q.G, q, 10);
    if (Number.isFinite(v10)) {
      const shown = rule ? (rule.dp != null ? roundTo(v10, rule) : Number(v10.toPrecision(rule.sf)).toString()) : String(Number(v10.toPrecision(10)));
      if (!relClose(Number(shown), a.value, 1e-12)) no(withU(shown, u), 'the answer with g = 10');
    }
  }
  return reqs;
}

/* ------------------------------------------------------------ run */
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|fonts\.g|ERR_CERT|ERR_NAME|ERR_INTERNET|ERR_FILE/i.test(m.text())) pageErrors.push(m.text()); });
await page.goto(`${URL_}#/`, { waitUntil: 'load' });
await page.waitForFunction(() => window.CQ, null, { timeout: 10000 });
if (!(await page.evaluate(() => !!window.CQPhysics))) {
  await page.addStyleTag({ path: `${STUDY_DIR}physics.css` });
  await page.addScriptTag({ path: `${STUDY_DIR}physics.js` });
}
await page.waitForFunction(() => window.CQPhysics, null, { timeout: 10000 });

const generated = await page.evaluate(({ N, MC }) => {
  window.__px = [];
  const text = (x) => {
    if (x == null) return null;
    if (typeof x === 'string') return x;
    const c = x.cloneNode(true);
    c.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
    return c.textContent.replace(/\s+/g, ' ').trim();
  };
  const svgText = (s) => { if (!s) return null; const d = document.createElement('div'); d.innerHTML = s; return `${d.textContent} ${s.match(/aria-label="[^"]*"/) || ''}`; };
  const pack = (q, skill, level, mcMode) => {
    const idx = window.__px.push(q) - 1;
    const exp = typeof q.explanation === 'string' ? null : q.explanation;
    const hint = mcMode === 'game' ? null : q.hint();
    return {
      idx, skill, level, mcMode, type: mcMode === 'game' ? 'mcGame' : q.type, variant: q.variant, id: q.id, setId: q.setId,
      prompt: q.prompt, answer: q.answer, accept: q.accept, options: q.options, value: q.value, exact: q.exact,
      unit: q.unit, sci: q.sci, dirs: q.dirs, givens: q.givens, givenText: q.givenText, brief: q.brief,
      figure: !!q.figure, figureAlt: q.figureAlt || null, figureText: svgText(q.figure), nts: q.nts,
      exp: text(q.explanation), hint: text(hint),
      expHasAnswer: exp ? [...exp.querySelectorAll('.px-ans')].some((b) => b.textContent.replace(/−/g, '-') === String(q.answer).replace(/−/g, '-').replace('^', '')) : true,
      hintBoxes: hint ? hint.querySelectorAll('.px-ans').length > 0 : false,
    };
  };
  const out = [];
  for (const s of window.CQPhysics.skills) {
    for (let i = 0; i < N; i++) {
      const level = 1 + (i % 3);
      try { out.push(pack(window.CQPhysics.generate(s.id, { difficulty: level }), s.id, level, null)); } catch (e) { out.push({ skill: s.id, level, error: String((e && e.stack) || e) }); }
    }
    for (let i = 0; i < MC; i++) {
      const level = 1 + (i % 3);
      try { out.push(pack(window.CQPhysics.generateMC(s.id, { difficulty: level }), s.id, level, 'mc')); } catch (e) { out.push({ skill: s.id, level, mcMode: 'mc', error: String((e && e.stack) || e) }); }
    }
  }
  const games = {};
  for (const id of ['phys-u1', 'phys-u2', 'phys-u3', 'phys-u4', 'phys-u5', 'phys-u6', 'phys-u7', 'phys-u8', 'phys-u9', 'phys-all', 'c1', 'c3', 'chem-all', 'alg1-u1', 'bio-u1']) {
    const set = window.CQ.getSet(id);
    if (!set) continue;
    const qs = window.CQPhysics.gameQuestions(set);
    games[id] = {
      n: qs.length,
      bad: qs.filter((q) => q.type !== 'mc' || !q.options || q.options.length !== 4 || new Set(q.options).size !== 4 || !q.options.includes(q.answer) || !/^physlab:/.test(q.id) || typeof q.explanation !== 'string').length,
      sets: [...new Set(qs.map((q) => q.setId))],
      packed: qs.slice(0, 4).map((q) => pack(q, q.skill, q.level, 'game')),
    };
  }
  const resolver = {};
  for (const s of window.CQPhysics.skills) {
    const it = window.CQPhysics.itemFor(`physlab:${s.id}`);
    const q = it && it.make();
    resolver[s.id] = !it ? 'no item' : it.setId !== s.setId ? `setId ${it.setId}` : !q ? 'no question'
      : q.type === 'written' ? (typeof q.check === 'function' && q.check(q.answer) && window.CQ.checkWritten(q, q.answer) ? 'ok' : 'its own answer is not accepted')
        : (q.options && q.options.includes(q.answer) ? 'ok' : 'answer not among the options');
  }
  resolver.unknown = window.CQPhysics.itemFor('physlab:nope') === null ? 'ok' : 'an unknown skill resolved';
  return { out, games, resolver, skills: window.CQPhysics.skills };
}, { N, MC });

const rows = {};
const failures = [];
const row = (s) => (rows[s] ||= { gen: 0, mc: 0, fail: 0, checks: 0 });
const note = (q, msg) => {
  row(q.skill).fail++;
  if (failures.length < SHOW) failures.push(`${q.skill}${q.mcMode ? ` (${q.mcMode})` : ''} L${q.level} [${q.variant || ''}]: ${msg}\n      prompt: ${q.prompt}\n      answer: ${q.answer}${q.options ? `\n      options: ${q.options.join(' | ')}` : ''}`);
};
const expectSet = Object.fromEntries(generated.skills.map((s) => [s.id, s.setId]));
const requests = [];
const byKey = new Map();
for (const q of generated.out) {
  const r = row(q.skill);
  if (q.error) { note(q, `generator threw: ${q.error.split('\n')[0]}`); continue; }
  q.expectSet = expectSet[q.skill];
  if (q.mcMode === 'mc' && q.type !== 'mc') { note(q, 'generateMC gave a typed question'); continue; }
  if (q.mcMode === 'mc') r.mc++; else r.gen++;
  const native = q.skill === 'fbd' || q.skill === 'gravchange';
  if (q.mcMode === 'mc' && !native) {
    // re-derive the truth the same way as for the typed version
    const probe = { ...q, type: 'written', options: null, answer: q.answer.replace(/−/g, '-') };
    const p = checkQuestion(probe);
    for (const m of p) note(q, m);
    if (Number.isFinite(probe.truth)) { q.truth = probe.truth; for (const m of checkMC(q)) note(q, m); }
    continue;
  }
  for (const m of checkQuestion(q)) note(q, m);
  if (q.type === 'written' && Number.isFinite(q.truth)) {
    for (const req of inputsFor(q)) requests.push({ ...req, idx: q.idx, q });
  }
}
for (const [id, g] of Object.entries(generated.games)) {
  const want = /^phys-/.test(id);
  if (want && g.n < 10) failures.push(`game source for ${id} gave only ${g.n} problems`);
  if (!want && g.n) failures.push(`game source for ${id} should give nothing, gave ${g.n}`);
  if (g.bad) failures.push(`game source for ${id}: ${g.bad} malformed questions`);
  if (want && id !== 'phys-all' && g.sets.some((s) => s !== id)) failures.push(`${id} games got problems from ${g.sets.join(', ')}`);
  for (const q of g.packed || []) {
    q.expectSet = expectSet[q.skill];
    for (const m of [...q.figure && !q.figureAlt ? ['a game figure without alt text'] : [], ...(BAD.test(`${q.prompt} ${q.answer} ${q.options.join(' ')} ${q.brief}`) ? ['bad text in a game question'] : [])]) failures.push(`game ${id}: ${m}`);
  }
}
for (const [id, v] of Object.entries(generated.resolver)) if (v !== 'ok') failures.push(`Mistakes resolver for ${id}: ${v}`);

// Ask the problems' own checkers about every input, in batches.
for (let i = 0; i < requests.length; i += 20000) {
  const batch = requests.slice(i, i + 20000);
  const verdicts = await page.evaluate((reqs) => reqs.map(({ idx, input }) => { try { return window.__px[idx].check(input); } catch (e) { return `threw ${e.message}`; } }), batch.map(({ idx, input }) => ({ idx, input })));
  batch.forEach((req, k) => {
    row(req.q.skill).checks++;
    if (verdicts[k] !== req.expect) note(req.q, `q.check ${verdicts[k] === true ? 'accepted' : verdicts[k] === false ? 'rejected' : verdicts[k]} ${req.why}: "${req.input}"`);
  });
}
for (const e of pageErrors) failures.push(`page error: ${e}`);
await browser.close();

console.log(`Physics Lab — ${N} problems and ${MC} multiple-choice versions per skill, checked independently\n`);
const pad = (s, n) => String(s).padEnd(n);
console.log(`${pad('skill', 14)}${pad('unit', 9)}${pad('problems', 10)}${pad('mc', 6)}${pad('inputs', 9)}${pad('failures', 9)}`);
for (const s of generated.skills) {
  const r = rows[s.id] || { gen: 0, mc: 0, fail: 0, checks: 0 };
  console.log(`${pad(s.id, 14)}${pad(s.setId, 9)}${pad(r.gen, 10)}${pad(r.mc, 6)}${pad(r.checks, 9)}${pad(r.fail, 9)}`);
}
console.log(`\ngame sources: ${Object.entries(generated.games).map(([id, g]) => `${id} ${g.n}`).join(', ')}`);
const total = Object.values(rows).reduce((n, r) => n + r.fail, 0) + failures.filter((f) => !/^\w+( \(\w+\))? L\d/.test(f)).length;
if (failures.length) {
  console.log(`\n${total} failure(s)${failures.length >= SHOW ? ` (first ${SHOW} shown)` : ''}:`);
  for (const f of failures) console.log(`  ${f}`);
  process.exit(1);
}
console.log(`\nOK: ${generated.out.length} problems and ${requests.length} typed inputs check out.`);
