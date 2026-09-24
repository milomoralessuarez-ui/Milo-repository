/* ==========================================================================
   Physics Lab — endless, freshly generated algebra-based Physics problems,
   each with a worked solution in the G.U.E.S.S. layout (Givens, Unknown,
   Equation, Substitute, Solve) and a figure where one helps.

   Every number in a problem is a short decimal chosen so the working stays
   clean. Answers are rounded once, at the end, to the precision the prompt
   states (a prompt with no rounding instruction has an exact answer), and
   typed answers are graded exactly against that: the site's shared checker
   allows 0.6%, which would pass a slip in the last digit.

   Registers through window.CQ (see the plugin section of app.js):
   - mode "physics" on every Physics unit and on All of Physics;
   - a game source (multiple-choice versions whose wrong options are the
     classic mistakes) for Gold Quest, Race and Blitz;
   - an item resolver so a missed "physlab:<skill>" comes back in Mistakes.
   window.CQPhysics exposes the generators for tools/verify-physics.mjs.
   ========================================================================== */
(() => {
'use strict';
const CQ = window.CQ;
if (!CQ) return;
const { el, shuffle, pick } = CQ;

/* Constants, exactly as the prompts state them. */
const GRAV = 9.8;          // m/s²
const BIG_G = 6.67e-11;    // N·m²/kg²
const K_E = 8.99e9;        // N·m²/C²
const C_LIGHT = 3.00e8;    // m/s
const V_SOUND = 343;       // m/s
const G_NOTE = 'Use g = 9.8 m/s².';

const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const chance = (p) => Math.random() < p;
/** A random decimal in [lo, hi] with dp places, as a clean Number (12.3, never 12.299999…). */
const dec = (lo, hi, dp = 0) => { const k = 10 ** dp; return ri(Math.round(lo * k), Math.round(hi * k)) / k; };
const MINUS = '−';
/** Typographic minus for prose and working; answers keep "-" so they can be typed. */
const pretty = (s) => String(s).replace(/(^|[\s(=×·/[{,])-(?=[\d.])/g, `$1${MINUS}`);

/* ------------------------------------------------------------ numbers
   Values are ordinary doubles, cleaned to 12 significant digits before they
   are ever shown, so float noise (0.30000000000000004) never reaches the
   page. A result is "exact" when that cleaned value is a short decimal. */
const clean = (v) => { const c = Number(Number(v).toPrecision(12)); return Object.is(c, -0) ? 0 : c; };
/** Plain decimal text of a number, never in e-notation: 1.5e-7 → "0.00000015". */
function plainOf(v) {
  const s = String(clean(v));
  const m = s.match(/^(-?)(\d)(?:\.(\d+))?e([+-]\d+)$/);
  if (!m) return s;
  const digits = m[2] + (m[3] || '');
  const point = 1 + Number(m[4]);
  let out;
  if (point <= 0) out = `0.${'0'.repeat(-point)}${digits}`;
  else if (point >= digits.length) out = digits + '0'.repeat(point - digits.length);
  else out = `${digits.slice(0, point)}.${digits.slice(point)}`;
  return m[1] + out;
}
function commas(s) {
  const neg = s.startsWith('-');
  const [i, f] = (neg ? s.slice(1) : s).split('.');
  const ii = i.length >= 4 ? i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : i;
  return (neg ? '-' : '') + ii + (f != null ? `.${f}` : '');
}
/** A clean number as text: "1,500", "0.25", "-3.2". */
const fmt = (v) => commas(plainOf(v));
/** Significant digits and the place value of the last digit of a clean number. */
function info(v) {
  const s = plainOf(v).replace('-', '');
  const [i, f = ''] = s.split('.');
  if (f) return { sig: (i + f).replace(/^0+/, '').length, place: -f.length, dp: f.length };
  const t = i.replace(/0+$/, '');
  return { sig: Math.max(1, t.replace(/^0+/, '').length), place: i.length - t.length, dp: 0 };
}
/** "5.97 × 10^24" from a coefficient string and an exponent. */
const sciText = (coef, exp) => `${coef} × 10^${exp}`;
function sciExact(v) {
  const [c, e] = clean(v).toExponential().split('e');
  return sciText(c, Number(e));
}
/** A working value: exact when it is short, otherwise 5 significant figures and "…". */
function ap(v) {
  const c = clean(v);
  const a = Math.abs(c);
  const inf = info(c);
  if (a !== 0 && (a < 1e-3 || a >= 1e7)) {
    if (inf.sig <= 5) return sciExact(c);
    const [m, e] = c.toExponential(4).split('e');
    return `${m}… × 10^${Number(e)}`;
  }
  if (inf.sig <= 6 && inf.dp <= 5) return fmt(c);
  const [m, e] = c.toExponential(4).split('e');
  return `${fmt(Number(`${m}e${e}`))}…`;
}
/** Digits (an integer string) with the last digit at 10^place, as a decimal string. */
function placeDigits(digits, place) {
  if (place >= 0) return digits + '0'.repeat(place);
  const s = digits.padStart(-place + 1, '0');
  return `${s.slice(0, place)}.${s.slice(place)}`;
}
/**
 * Round a value the way the prompt says. rule: { dp } decimal places or { sf }
 * significant figures. An exact value that needs no more digits than the rule
 * allows is kept exact (and the prompt then says nothing about rounding).
 * Returns null for a value on (or within 2% of a unit of) a rounding tie, so
 * the generator picks new numbers rather than risk a half-up/half-down
 * argument.
 */
function settle(v, rule, sci) {
  if (!Number.isFinite(v) || v === 0) return null;
  const c = clean(v);
  const inf = info(c);
  const fits = rule.dp != null ? inf.dp <= rule.dp : inf.sig <= rule.sf;
  if (fits && (sci || inf.dp <= 6)) return { exact: true, place: inf.place, str: sci ? sciExact(c) : fmt(c), num: c };
  let place = rule.dp != null ? -rule.dp : Number(c.toExponential().split('e')[1]) - (rule.sf - 1);
  const a = Math.abs(c);
  const scaled = place <= 0 ? a * 10 ** -place : a / 10 ** place;
  const fr = scaled - Math.floor(scaled);
  // keep clear of a tie, so a value typed with two more digits still rounds the same way
  if (Math.abs(fr - 0.5) < 0.02) return null;
  let N = Math.round(scaled);
  if (!N) return null;
  if (rule.sf != null && N >= 10 ** rule.sf) { N = Math.round(N / 10); place += 1; }
  const digits = String(N);
  const neg = c < 0;
  const str = sci
    ? `${neg ? '-' : ''}${sciText(digits.length > 1 ? `${digits[0]}.${digits.slice(1)}` : digits, place + digits.length - 1)}`
    : (neg ? '-' : '') + commas(placeDigits(digits, place));
  return { exact: false, place, str, num: Number(`${neg ? '-' : ''}${digits}e${place}`) };
}
function roundText(rule, unit, sci) {
  if (sci) return `Give your answer in scientific notation to ${rule.sf} significant figures.`;
  if (unit === '$') return 'Round to the nearest cent.';
  if (unit === 'deg' && rule.dp === 1) return 'Round to the nearest tenth of a degree.';
  if (rule.dp === 0) return 'Round to the nearest whole number.';
  if (rule.dp != null) return `Round to ${rule.dp} decimal place${rule.dp === 1 ? '' : 's'}.`;
  return `Give your answer to ${rule.sf} significant figures.`;
}

/* ------------------------------------------------------------ units
   Each unit: its symbol, a name for messages, every way a student might
   write it, and prefixed versions that are the same quantity scaled by a
   power of ten ("36 cm" answers "0.36 m"). Anything else is a wrong unit. */
const U = {};
function unit(key, sym, name, words, alt = {}) { U[key] = { key, sym, name, words: [sym, ...words], alt }; }
const plural = (w) => [w, `${w}s`];
unit('m', 'm', 'meters', [...plural('meter'), ...plural('metre')], {
  km: 3, ...Object.fromEntries([...plural('kilometer'), ...plural('kilometre')].map((w) => [w, 3])),
  cm: -2, ...Object.fromEntries([...plural('centimeter'), ...plural('centimetre')].map((w) => [w, -2])),
  mm: -3, ...Object.fromEntries([...plural('millimeter'), ...plural('millimetre')].map((w) => [w, -3])),
  'µm': -6, um: -6, ...Object.fromEntries([...plural('micrometer'), ...plural('micrometre')].map((w) => [w, -6])),
  nm: -9, ...Object.fromEntries([...plural('nanometer'), ...plural('nanometre')].map((w) => [w, -9])),
});
unit('s', 's', 'seconds', ['sec', 'secs', ...plural('second')], { ms: -3, ...Object.fromEntries(plural('millisecond').map((w) => [w, -3])) });
unit('m/s', 'm/s', 'meters per second', ['m/sec', 'mps', 'm s^-1', 'ms^-1', 'meters per second', 'meter per second', 'metres per second', 'metre per second', 'meters/second', 'meters/sec', 'meters a second']);
unit('m/s2', 'm/s²', 'meters per second squared', ['m/s^2', 'm/s2', 'm/s/s', 'm/sec^2', 'm/sec/sec', 'm s^-2', 'ms^-2', 'meters per second squared', 'meter per second squared', 'metres per second squared', 'meters per second per second', 'metres per second per second', 'meters/second^2', 'meters/second squared']);
unit('N', 'N', 'newtons', [...plural('newton'), 'kg·m/s^2', 'kg m/s^2', 'kgm/s^2'], { kN: 3, ...Object.fromEntries(plural('kilonewton').map((w) => [w, 3])) });
unit('kg', 'kg', 'kilograms', [...plural('kilogram'), 'kgs', 'kilo', 'kilos'], { g: -3, ...Object.fromEntries(plural('gram').map((w) => [w, -3])) });
unit('J', 'J', 'joules', [...plural('joule'), 'N·m', 'N m', 'Nm', 'newton meter', 'newton meters', 'newton-meter', 'newton-meters'], {
  kJ: 3, ...Object.fromEntries(plural('kilojoule').map((w) => [w, 3])), MJ: 6, ...Object.fromEntries(plural('megajoule').map((w) => [w, 6])),
});
unit('W', 'W', 'watts', [...plural('watt'), 'J/s', 'joules per second'], {
  kW: 3, ...Object.fromEntries(plural('kilowatt').map((w) => [w, 3])), MW: 6, ...Object.fromEntries(plural('megawatt').map((w) => [w, 6])),
});
unit('Hz', 'Hz', 'hertz', ['hertz', 'hz', '1/s', '/s', 's^-1', 'per second', 'cycles per second', 'cycles/s', 'waves per second', 'vibrations per second', 'oscillations per second', 'rev/s', 'revolutions per second'], {
  kHz: 3, kilohertz: 3, MHz: 6, megahertz: 6, GHz: 9, gigahertz: 9,
});
const MOMENTUM_WORDS = ['kg·m/s', 'kg m/s', 'kg·m·s^-1', 'kg m s^-1', 'kgms^-1', 'kgm/s', 'kg*m/s', 'kg-m/s', 'kilogram meters per second', 'kilogram-meters per second', 'kilogram metres per second', 'kilogram meter per second', 'N·s', 'N s', 'Ns', 'N*s', 'N-s', 'newton seconds', 'newton-seconds', 'newton second', 'newton-second'];
unit('p', 'kg·m/s', 'kg·m/s', MOMENTUM_WORDS);
unit('Ns', 'N·s', 'N·s', MOMENTUM_WORDS);
unit('ohm', 'Ω', 'ohms', ['Ω', 'ohm', 'ohms', 'V/A'], {
  'kΩ': 3, kohm: 3, kohms: 3, kilohm: 3, kilohms: 3, kiloohm: 3, kiloohms: 3, 'MΩ': 6, megohm: 6, megohms: 6,
});
unit('A', 'A', 'amperes', ['amp', 'amps', 'ampere', 'amperes', 'C/s'], { mA: -3, ...Object.fromEntries([...plural('milliamp'), ...plural('milliampere')].map((w) => [w, -3])) });
unit('V', 'V', 'volts', plural('volt').concat(['J/C']), {
  kV: 3, ...Object.fromEntries(plural('kilovolt').map((w) => [w, 3])), mV: -3, ...Object.fromEntries(plural('millivolt').map((w) => [w, -3])),
});
unit('C', 'C', 'coulombs', plural('coulomb'), {
  'µC': -6, uC: -6, ...Object.fromEntries(plural('microcoulomb').map((w) => [w, -6])),
  nC: -9, ...Object.fromEntries(plural('nanocoulomb').map((w) => [w, -9])),
  mC: -3, ...Object.fromEntries(plural('millicoulomb').map((w) => [w, -3])),
});
unit('deg', '°', 'degrees', ['deg', 'degs', 'degree', 'degrees']);
unit('kWh', 'kWh', 'kilowatt-hours', ['kW·h', 'kW h', 'kW*h', 'kilowatt-hour', 'kilowatt-hours', 'kilowatt hour', 'kilowatt hours', 'kilowatthours'], { Wh: -3, 'watt-hours': -3, 'watt hours': -3 });
unit('$', '$', 'dollars', ['dollar', 'dollars', 'usd'], { cents: -2, cent: -2, '¢': -2 });
unit('%', '%', 'percent', ['percent', 'per cent', 'pct']);
unit('', '', 'no unit', []);
unit('mag', '', 'no unit', ['x', '×', 'times']);

/** A unit as text, squeezed so "kg · m/s", "kg*m/s" and "kgm/s" read alike. */
const squash = (s) => String(s).normalize('NFKC').replace(/[\s^·⋅•*.\-_(){}]/g, '').replace(/[µμ]/g, 'µ');
/** Does `text` name `key`'s unit? Returns the power of ten it is scaled by. */
function unitMatch(key, text) {
  const t = squash(text);
  if (!t) return { ok: true, exp: 0, empty: true };
  const def = U[key];
  if (!def) return { ok: false };
  const same = (w) => {
    const s = squash(w);
    if (!s || s.toLowerCase() !== t.toLowerCase()) return false;
    // M (mega) is not m (milli, or meters): a prefix letter keeps its case.
    if (/^[mM]/.test(s) && (s.length === 1 || (s.length <= 3 && /[A-Za-zΩ]/.test(s[1])))) return s[0] === t[0];
    return true;
  };
  if (def.words.some(same)) return { ok: true, exp: 0 };
  for (const [w, e] of Object.entries(def.alt)) if (same(w)) return { ok: true, exp: e };
  return { ok: false };
}
/** How a value and its unit are written: "12 m/s", "36.9°", "75%", "$1.44". */
function withUnit(num, key) {
  if (key === '$') return num.startsWith('-') ? `-$${num.slice(1)}` : `$${num}`;
  if (key === 'deg' || key === '%') return `${num}${U[key].sym}`;
  if (!U[key] || !U[key].sym) return num;
  return `${num} ${U[key].sym}`;
}

/* ------------------------------------------------------------ typed answers
   Exact decimal arithmetic with BigInt: a typed number is m × 10^e, plus the
   place value of its last written digit (a whole number's trailing zeros are
   not counted). */
const SUPS = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '+' };
const NUM_RE = /^([-+])?\s*((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d*)?|\.\d+)(?:\s*(?:[xX×*·]|\*\*)\s*10\s*(?:\^|\*\*)\s*\(?\s*([-+]?\d+)\s*\)?|\s*[eE]\s*([-+]?\d+)(?![a-zA-Z]))?\s*(.*)$/;
function parseTyped(raw) {
  let s = String(raw)
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g, (m) => `^${[...m].map((c) => SUPS[c]).join('')}`)
    .replace(/\^\s*\^/g, '^')
    .replace(/[º˚]/g, '°')
    .normalize('NFKC')
    .replace(/[−–—]/g, '-')
    .replace(/[  ]/g, ' ')
    .trim();
  // "v = 12 m/s" or "KE = ½mv² = 20 J": the answer is what follows the last "="
  if (s.includes('=')) s = s.slice(s.lastIndexOf('=') + 1).trim();
  s = s.replace(/^(?:about|approx\.?|approximately|≈|~)\s*/i, '').replace(/[.,;!]+$/, '').trim();
  let dollar = false;
  const d = s.match(/^([-+]?)\s*\$\s*(.*)$/);
  if (d) { dollar = true; s = d[1] + d[2]; }
  // "6 100 N": a space between digit groups is a thousands separator
  s = s.replace(/(\d) (?=\d{3}(?!\d))/g, '$1,');
  const m = s.match(NUM_RE);
  if (!m) return null;
  const body = m[2].replace(/,/g, '');
  const [ip, fp = ''] = body.split('.');
  const exp = Number(m[3] ?? m[4] ?? 0);
  const digits = ((ip || '') + fp).replace(/^0+(?=\d)/, '') || '0';
  const mm = BigInt(digits) * (m[1] === '-' ? -1n : 1n);
  const e = exp - fp.length;
  let place;
  if (fp) place = e;
  else { const t = (ip || '0').replace(/0+$/, ''); place = exp + ((ip || '0').length - t.length); }
  return { m: mm, e, place, sci: m[3] != null || m[4] != null, rest: m[5].replace(/^\((.*)\)$/, '$1').trim(), dollar, neg: m[1] === '-' };
}
function normDec(d) {
  let { m, e } = d;
  if (m === 0n) return { m: 0n, e: 0 };
  while (m % 10n === 0n) { m /= 10n; e += 1; }
  return { m, e };
}
const eqDec = (a, b) => { const x = normDec(a), y = normDec(b); return x.m === y.m && x.e === y.e; };
/** Round m × 10^e to the place 10^p, half away from zero. */
function roundDec(d, p) {
  if (d.e >= p) return d;
  const div = 10n ** BigInt(p - d.e);
  const neg = d.m < 0n;
  const a = neg ? -d.m : d.m;
  const r = (2n * a + div) / (2n * div);
  return { m: neg ? -r : r, e: p };
}
const decNum = (d) => Number(`${d.m}e${d.e}`);
/** The canonical answer's number as an exact decimal. */
function answerDec(str) {
  const p = parseTyped(str.replace(/^-?\$/, (x) => (x.startsWith('-') ? '-' : '')));
  return { m: p.m, e: p.e };
}
/** Trailing words that give a direction: "70 N to the left" means −70 N when right is positive. */
function directionOf(q, rest) {
  if (!q.dirs) return { rest, s: 0 };
  const low = rest.toLowerCase().replace(/\s+/g, ' ').trim();
  const tries = [...(q.dirs.pos || []).map((w) => [w, 1]), ...(q.dirs.neg || []).map((w) => [w, -1]), ...(q.dirs.same || []).map((w) => [w, 0])]
    .sort((a, b) => b[0].length - a[0].length);
  for (const [w, s] of tries) {
    const ww = w.toLowerCase();
    for (const lead of ['', 'to the ', 'toward the ', 'towards the ', 'toward ', 'towards ', 'directed ', 'pointing ']) {
      const phrase = lead + ww;
      if (low === phrase) return { rest: '', s, hit: true };
      if (low.endsWith(` ${phrase}`)) return { rest: rest.slice(0, rest.length - phrase.length).trim(), s, hit: true };
    }
  }
  return { rest, s: 0 };
}
/**
 * Grade a typed answer. Exact answers must be exactly equal (trailing zeros
 * are fine). A rounded answer must be the stated rounding of the true value;
 * a more precise value is accepted when every digit shown rounds to it and it
 * is within half a unit of the last stated digit of the true value.
 */
function grade(q, raw) {
  const p = parseTyped(raw);
  if (!p || !/\S/.test(String(raw))) return { ok: false, why: 'Type a number (and its unit).' };
  let rest = p.rest;
  let sign = 1n;
  const dir = directionOf(q, rest);
  if (dir.hit) {
    rest = dir.rest;
    if (dir.s) {
      if (p.neg) return { ok: false, why: 'Give the direction with a sign or with a word, not both.' };
      if (dir.s < 0) sign = -1n;
    }
  }
  if (p.dollar) {
    if (q.unit !== '$') return { ok: false, why: `This answer is in ${U[q.unit].name}, not dollars.` };
    if (rest && !['dollar', 'dollars', 'usd'].includes(rest.toLowerCase())) return { ok: false, why: '' };
    rest = '';
  }
  const um = unitMatch(q.unit, rest);
  if (!um.ok) {
    const typed = { m: p.m * sign, e: p.e };
    const numOk = numberRight(q, typed, p.place);
    const wants = q.unit === '' || q.unit === 'mag' ? 'this quantity has no unit' : `this asks for ${U[q.unit].name}${U[q.unit].sym ? ` (${U[q.unit].sym})` : ''}`;
    return { ok: false, why: numOk ? `The number is right, but "${rest}" is the wrong unit — ${wants}.` : `Check the unit too — ${wants}.` };
  }
  const d = { m: p.m * sign, e: p.e + um.exp };
  const ok = numberRight(q, d, p.place + um.exp);
  if (!ok) return { ok: false, why: hintFor(q, d, p.place + um.exp) };
  const tip = um.empty && q.unit && U[q.unit].sym ? `Remember to write the unit: ${U[q.unit].sym}.` : '';
  return { ok: true, tip };
}
function numberRight(q, d, place) {
  const A = q.dec;
  if (eqDec(d, A)) return true;
  if (q.exact) return false;
  if (place >= q.place) return false;
  if (!eqDec(roundDec(d, q.place), A)) return false;
  return Math.abs(decNum(d) - q.value) <= 0.5 * 10 ** q.place * (1 + 1e-9);
}
/** Say what is off when it is something specific. */
function hintFor(q, d, place) {
  const v = decNum(d);
  if (Math.abs(v + q.value) <= Math.abs(q.value) * 1e-9) return 'Check the sign.';
  if (!q.exact && place > q.place && Math.abs(v - q.value) < 10 ** place) return `Close — now round it as the question asks: ${roundText(q.round, q.unit, q.sci).replace(/^Give your answer /, '').replace(/\.$/, '')}.`;
  return '';
}

/* ------------------------------------------------------------ math on the page
   Working is written as plain strings: "^2" and "^-11" become superscripts,
   "_{eq}" a subscript, "[[top || bottom]]" a stacked fraction and
   "√[[…]]" a square root with its bar. The same string gives the plain text
   used for the games' one-line explanations. */
function parseMath(s, i = 0, stop = null) {
  const out = [];
  let buf = '';
  const flush = () => { if (buf) out.push(buf); buf = ''; };
  while (i < s.length) {
    if (stop && s.startsWith(stop, i)) { flush(); return { items: out, i }; }
    if (s.startsWith('√[[', i)) {
      flush();
      const r = parseMath(s, i + 3, ']]');
      out.push({ sqrt: r.items });
      i = r.i + 2;
      continue;
    }
    if (s.startsWith('[[', i)) {
      flush();
      const a = parseMath(s, i + 2, '||');
      const b = parseMath(s, a.i + 2, ']]');
      out.push({ frac: [a.items, b.items] });
      i = b.i + 2;
      continue;
    }
    buf += s[i++];
  }
  flush();
  return { items: out, i };
}
function textNodes(t) {
  const out = [];
  const re = /\^\{([^}]*)\}|\^(-?\d+(?:\.\d+)?)|_\{([^}]*)\}/g;
  let last = 0, m;
  const s = pretty(t);
  while ((m = re.exec(s))) {
    out.push(s.slice(last, m.index));
    if (m[3] != null) out.push(el('sub', {}, m[3]));
    else out.push(el('sup', {}, pretty(m[1] ?? m[2])));
    last = m.index + m[0].length;
  }
  out.push(s.slice(last));
  return out.filter((x) => x !== '');
}
function mathDom(items) {
  return items.flatMap((it) => {
    if (typeof it === 'string') return textNodes(it);
    if (it.frac) {
      return [el('span', { class: 'px-frac' },
        el('span', { class: 'num' }, ...mathDom(it.frac[0])),
        el('span', { class: 'sr-only' }, ' divided by '),
        el('span', { class: 'den' }, ...mathDom(it.frac[1])))];
    }
    return [el('span', { class: 'px-sqrt' }, el('span', { class: 'rad', 'aria-hidden': 'true' }, '√'), el('span', { class: 'sr-only' }, 'the square root of '), el('span', { class: 'under' }, ...mathDom(it.sqrt)))];
  });
}
const SUB_MAP = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉', a: 'ₐ', e: 'ₑ', o: 'ₒ', x: 'ₓ', h: 'ₕ', k: 'ₖ', l: 'ₗ', m: 'ₘ', n: 'ₙ', p: 'ₚ', s: 'ₛ', t: 'ₜ', i: 'ᵢ', j: 'ⱼ', r: 'ᵣ', u: 'ᵤ', v: 'ᵥ' };
/** A subscript in one-line text: "d_{o}" → "dₒ", "R_{eq}" → "Req", "g_{Jupiter}" → "g(Jupiter)". */
const plainSub = (x) => ([...x].every((c) => SUB_MAP[c]) ? [...x].map((c) => SUB_MAP[c]).join('') : x.length <= 3 ? x : `(${x})`);
const SUBC = '₀-₉ₐₑₒₓₕₖₗₘₙₚₛₜᵢⱼᵣᵤᵥ';
/** A numerator stays bare when it is one run of symbols; a denominator only when it is a number or one symbol ("2g" becomes "(2g)"). */
const ATOM_NUM = new RegExp(`^[\\w.,²³°′^${SUBC}]+$`);
const ATOM_DEN = new RegExp(`^(?:[\\d.,]+|Δ?[A-Za-zα-ωΑ-Ω](?:[${SUBC}′]*|[a-z]{2,3})(?:\\^\\d+|[²³])?|\\([^()]*\\))$`);
function mathPlain(items) {
  const wrap = (t, re) => { t = t.trim(); return re.test(t) || /^\([^()]*\)$/.test(t) ? t : `(${t})`; };
  return items.map((it) => {
    if (typeof it === 'string') return pretty(it.replace(/_\{([^}]*)\}/g, (_, x) => plainSub(x)));
    if (it.frac) return `${wrap(mathPlain(it.frac[0]), ATOM_NUM)}/${wrap(mathPlain(it.frac[1]), ATOM_DEN)}`;
    return `√(${mathPlain(it.sqrt)})`;
  }).join('');
}
/** A line of working as DOM. Parts may be strings (math syntax) or nodes. */
const mline = (...parts) => el('div', { class: 'px-ln' }, ...parts.flatMap((p) => (typeof p === 'string' ? mathDom(parseMath(p).items) : [p])));
const plainLine = (s) => mathPlain(parseMath(s).items);
/** Powers as real superscript characters for one-line text: the shared card's
    "^" renderer would swallow a bracket after "r^2)". */
const SUPC = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '-': '⁻', '−': '⁻' };
const supText = (t) => String(t).replace(/\^\{?([-−]?\d+)\}?/g, (_, e) => [...e].map((c) => SUPC[c]).join(''));
const boxed = (text) => el('span', { class: 'px-ans' }, ...textNodes(text));

/* ------------------------------------------------------------ figures
   Inline SVG strings. Every colour is currentColor or a theme variable (see
   physics.css), so a figure reads in the light and the dark theme. */
const r1 = (n) => Math.round(n * 10) / 10;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function svg(w, h, body, alt, nts) {
  return `<svg class="px-fig" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(alt)}" focusable="false">${body}${nts ? `<text class="px-nts" x="${w - 6}" y="14" text-anchor="end">Not drawn to scale</text>` : ''}</svg>`;
}
const subs = (s) => esc(s).replace(/_\{([^}]*)\}/g, '<tspan class="px-sub" baseline-shift="sub">$1</tspan>');
const txt = (x, y, s, { anchor = 'middle', cls = '', dy = 0 } = {}) => `<text class="px-t ${cls}" x="${r1(x)}" y="${r1(y + dy)}" text-anchor="${anchor}">${subs(s)}</text>`;
function arrow(x1, y1, x2, y2, cls = 'c1', head = 10) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const bx = x2 - head * Math.cos(a), by = y2 - head * Math.sin(a);
  const w = head * 0.55;
  const p = [[x2, y2], [bx + w * Math.sin(a), by - w * Math.cos(a)], [bx - w * Math.sin(a), by + w * Math.cos(a)]];
  return `<g class="px-arw ${cls}"><line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(bx)}" y2="${r1(by)}"/><polygon points="${p.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' ')}"/></g>`;
}
const line = (x1, y1, x2, y2, cls = 'px-ax') => `<line class="${cls}" x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}"/>`;
/** An arc of an angle at (cx, cy) from a1 to a2 (radians, SVG y-down). */
function arc(cx, cy, r, a1, a2, cls = 'px-arc') {
  const p = (a) => `${r1(cx + r * Math.cos(a))},${r1(cy + r * Math.sin(a))}`;
  const large = Math.abs(a2 - a1) > Math.PI ? 1 : 0;
  const sweep = a2 > a1 ? 1 : 0;
  return `<path class="${cls}" d="M${p(a1)} A${r} ${r} 0 ${large} ${sweep} ${p(a2)}"/>`;
}

/** A position–time or velocity–time graph through the points given. */
function graphFig({ kind, pts, tStep, yStep, yMin, yMax, shade }) {
  const W = 360, H = 250, L = 52, R = 16, T = 16, B = 42;
  const tMax = pts[pts.length - 1][0];
  const X = (t) => L + (t / tMax) * (W - L - R);
  const Y = (v) => T + ((yMax - v) / (yMax - yMin)) * (H - T - B);
  const yUnit = kind === 'xt' ? 'm' : 'm/s';
  let body = '';
  for (let t = 0; t <= tMax + 1e-9; t += tStep) body += line(X(t), Y(yMin), X(t), Y(yMax), 'px-grid');
  for (let v = yMin; v <= yMax + 1e-9; v += yStep) body += line(X(0), Y(v), X(tMax), Y(v), 'px-grid');
  if (shade) {
    const [a, b] = shade;
    const inside = pts.filter(([t]) => t > a && t < b);
    const at = (t) => { for (let i = 1; i < pts.length; i++) { const [t0, y0] = pts[i - 1], [t1, y1] = pts[i]; if (t >= t0 && t <= t1) return y0 + ((y1 - y0) * (t - t0)) / (t1 - t0); } return 0; };
    const poly = [[a, 0], [a, at(a)], ...inside, [b, at(b)], [b, 0]];
    body += `<polygon class="px-shade" points="${poly.map(([t, v]) => `${r1(X(t))},${r1(Y(v))}`).join(' ')}"/>`;
  }
  body += line(X(0), Y(yMin), X(0), Y(yMax) - 4) + line(X(0), Y(0), X(tMax) + 6, Y(0));
  const every = (n, step) => (n / step > 10 ? 2 : 1);
  const tk = every(tMax, tStep), yk = every(yMax - yMin, yStep);
  let i = 0;
  for (let t = 0; t <= tMax + 1e-9; t += tStep, i++) if (i % tk === 0) body += txt(X(t), Y(yMin) + 16, fmt(t), { cls: 'px-small' });
  i = 0;
  for (let v = yMin; v <= yMax + 1e-9; v += yStep, i++) if (i % yk === 0) body += txt(X(0) - 7, Y(v) + 4, fmt(v), { anchor: 'end', cls: 'px-small' });
  body += txt((X(0) + X(tMax)) / 2, H - 6, 'time (s)', { cls: 'px-small px-b' });
  body += txt(X(0) + 6, T + 2, kind === 'xt' ? 'position (m)' : 'velocity (m/s)', { anchor: 'start', cls: 'px-small px-b', dy: 8 });
  body += `<polyline class="px-plot" points="${pts.map(([t, v]) => `${r1(X(t))},${r1(Y(v))}`).join(' ')}"/>`;
  for (const [t, v] of pts) body += `<circle class="px-dot" cx="${r1(X(t))}" cy="${r1(Y(v))}" r="4.5"/>`;
  const name = kind === 'xt' ? 'A position–time graph' : 'A velocity–time graph';
  const alt = `${name}, time in seconds across and ${kind === 'xt' ? 'position in meters' : 'velocity in meters per second'} up. Straight-line segments join the points ${pts.map(([t, v]) => `(${fmt(t)} s, ${fmt(v)} ${yUnit})`).join(', ')}.${shade ? ` The area under the line from ${fmt(shade[0])} s to ${fmt(shade[1])} s is shaded.` : ''}`;
  return { figure: svg(W, H, body, alt, false), alt };
}

/** A ball launched horizontally off a cliff. */
function projFig({ hText, vText, xText, ask }) {
  const W = 360, H = 250, gy = 196, top = 70, edge = 120;
  let body = `<rect class="px-solid" x="18" y="${top}" width="${edge - 18}" height="${gy - top}" rx="3"/>`;
  body += line(8, gy, W - 8, gy, 'px-ax');
  const land = 300;
  let d = `M${edge + 8} ${top - 8}`;
  for (let k = 1; k <= 12; k++) { const u = k / 12; d += ` L${r1(edge + 8 + u * (land - edge - 8))} ${r1(top - 8 + u * u * (gy - top + 2))}`; }
  body += `<path class="px-path" d="${d}"/>`;
  body += `<circle class="px-ball" cx="${edge + 8}" cy="${top - 8}" r="8"/>`;
  body += arrow(edge + 18, top - 8, edge + 78, top - 8, 'c2');
  body += txt(edge + 52, top - 22, vText, { cls: 'px-b' });
  body += arrow(69, top + 40, 69, top + 4, 'c3', 8) + arrow(69, gy - 40, 69, gy - 4, 'c3', 8);
  body += txt(69, (top + gy) / 2 + 5, hText, { cls: 'px-b px-on-solid' });
  if (xText) body += arrow((edge + land) / 2, gy + 18, edge + 2, gy + 18, 'c3', 7) + arrow((edge + land) / 2, gy + 18, land - 2, gy + 18, 'c3', 7);
  if (xText) body += txt((edge + land) / 2, gy + 38, xText, { cls: 'px-b' });
  const alt = `A ball rolls off the edge of a cliff ${hText.replace('h = ', '')} high${vText.includes('?') ? '' : ` at ${vText.replace('v₀ = ', '')}`}, moving horizontally, and follows a curved path down to the ground some distance from the base of the cliff.${ask ? ` ${ask}` : ''}`;
  return { figure: svg(W, H, body, alt, true), alt };
}

/** A box with labelled force arrows (a free-body diagram). */
function fbdFig(forces, { alt: extra = '', floor = false, obj = 'box' } = {}) {
  const W = 360, H = 250, cx = 180, cy = floor ? 140 : 125, s = 34;
  let body = '';
  if (floor) body += line(40, cy + s, W - 40, cy + s, 'px-ax') + Array.from({ length: 14 }, (_, k) => line(48 + k * 20, cy + s + 10, 58 + k * 20, cy + s, 'px-hatch')).join('');
  body += `<rect class="px-box" x="${cx - s}" y="${cy - s}" width="${2 * s}" height="${2 * s}" rx="4"/>`;
  const len = { up: 62, down: 62, left: 78, right: 78 };
  const col = { up: 'c3', down: 'c2', left: 'c4', right: 'c1' };
  for (const f of forces) {
    const L = len[f.dir];
    if (f.dir === 'up') { body += arrow(cx, cy - s, cx, cy - s - L, col.up); body += txt(cx, cy - s - L - 8, f.label, { cls: 'px-b' }); }
    if (f.dir === 'down') { body += arrow(cx, cy + s, cx, cy + s + L, col.down); body += txt(cx + 12, cy + s + L - 4, f.label, { anchor: 'start', cls: 'px-b' }); }
    if (f.dir === 'right') { body += arrow(cx + s, cy, cx + s + L, cy, col.right); body += txt(cx + s + L / 2 + 6, cy - 12, f.label, { cls: 'px-b' }); }
    if (f.dir === 'left') { body += arrow(cx - s, cy, cx - s - L, cy, col.left); body += txt(cx - s - L / 2 - 6, cy - 12, f.label, { cls: 'px-b' }); }
  }
  const words = { up: 'up', down: 'down', left: 'to the left', right: 'to the right' };
  const clauses = forces.map((f) => `${f.say || f.label} ${f.verb || 'acts'} ${words[f.dir]}`).join('; ');
  const alt = articles(`A free-body diagram of a ${obj}${floor ? ' on a level floor' : ''}. ${cap(clauses)}.${extra ? ` ${extra}` : ''}`);
  return { figure: svg(W, H, body, alt, true), alt };
}

/** One vector drawn from the origin with its components dashed. */
function vecFig({ theta, sx, sy, mag, xLabel, yLabel, axes, alt }) {
  const W = 340, H = 250, cx = sx > 0 ? 80 : 260, cy = sy > 0 ? 200 : 50;
  const len = 165;
  const rad = (theta * Math.PI) / 180;
  const ex = cx + sx * len * Math.cos(rad), ey = cy - sy * len * Math.sin(rad);
  let body = line(cx - sx * 30, cy, cx + sx * (len * Math.cos(rad) + 34), cy, 'px-ax') + line(cx, cy + sy * 26, cx, cy - sy * (len * Math.sin(rad) + 30), 'px-ax');
  body += txt(cx + sx * (len * Math.cos(rad) + 34) + sx * 4, cy + 5, axes[0], { anchor: sx > 0 ? 'start' : 'end', cls: 'px-small px-b' });
  body += txt(cx, cy - sy * (len * Math.sin(rad) + 30) - (sy > 0 ? 6 : -16), axes[1], { cls: 'px-small px-b' });
  body += line(cx, cy, ex, cy, 'px-comp') + line(ex, cy, ex, ey, 'px-comp');
  body += arrow(cx, cy, ex, ey, 'c1', 12);
  const a0 = sx > 0 ? 0 : Math.PI;
  const a1 = Math.atan2(ey - cy, ex - cx);
  body += arc(cx, cy, 42, Math.min(a0, a1 < 0 && a0 === Math.PI ? a1 + 2 * Math.PI : a1), Math.max(a0, a1 < 0 && a0 === Math.PI ? a1 + 2 * Math.PI : a1));
  const mid = (a0 + (a1 < 0 && a0 === Math.PI ? a1 + 2 * Math.PI : a1)) / 2;
  body += txt(cx + 58 * Math.cos(mid), cy + 58 * Math.sin(mid) + 5, `${fmt(theta)}°`, { cls: 'px-b' });
  // the size label sits just past the arrow's tip, clear of the axes and the dashed components
  body += txt(ex + sx * 10, ey + (sy > 0 ? -6 : 18), mag, { anchor: sx > 0 ? 'start' : 'end', cls: 'px-b' });
  body += txt((cx + ex) / 2, cy + (sy > 0 ? 20 : -10), xLabel, { cls: 'px-b' });
  body += txt(ex + sx * 8, (cy + ey) / 2 + 4, yLabel, { anchor: sx > 0 ? 'start' : 'end', cls: 'px-b' });
  return svg(W, H, body, alt, false);
}

/** Two perpendicular vectors head to tail and their resultant. */
function resFig({ a, b, sx, sy, aLabel, bLabel, rLabel, thLabel, axes, alt }) {
  const W = 340, H = 240, pad = 44;
  const scale = Math.min((W - 2 * pad - 40) / a, (H - 2 * pad) / b);
  const ox = sx > 0 ? pad + 10 : W - pad - 10, oy = sy > 0 ? H - pad : pad;
  const ex = ox + sx * a * scale, ey = oy - sy * b * scale;
  let body = arrow(ox, oy, ex, oy, 'c1', 11) + arrow(ex, oy, ex, ey, 'c3', 11) + `<g class="px-dash">${arrow(ox, oy, ex, ey, 'c2', 11)}</g>`;
  body += txt((ox + ex) / 2, oy + (sy > 0 ? 22 : -12), aLabel, { cls: 'px-b' });
  body += txt(ex + sx * 8, (oy + ey) / 2 + 4, bLabel, { anchor: sx > 0 ? 'start' : 'end', cls: 'px-b' });
  const a1 = Math.atan2(ey - oy, ex - ox);
  // R is labelled on the far side from the two legs, reading away from the line
  const mx = (ox + ex) / 2, my = (oy + ey) / 2;
  const nx = -Math.sin(a1), ny = Math.cos(a1);
  const away = nx * (ex - mx) + ny * (oy - my) > 0 ? -1 : 1;
  const rx = mx + away * nx * 14, ry = my + away * ny * 14;
  body += txt(rx, ry + 4, rLabel, { anchor: rx < mx ? 'end' : 'start', cls: 'px-b' });
  const a0 = sx > 0 ? 0 : Math.PI;
  const aa = a1 < 0 && a0 === Math.PI ? a1 + 2 * Math.PI : a1;
  body += arc(ox, oy, 34, Math.min(a0, aa), Math.max(a0, aa));
  const mid = (a0 + aa) / 2;
  body += txt(ox + 44 * Math.cos(mid), oy + 44 * Math.sin(mid) + (Math.sin(mid) > 0 ? 12 : 2), thLabel, { anchor: Math.cos(mid) > 0 ? 'start' : 'end', cls: 'px-b' });
  body += txt(sx > 0 ? W - 8 : 8, sy > 0 ? 16 : H - 8, axes, { anchor: sx > 0 ? 'end' : 'start', cls: 'px-small px-mut' });
  return svg(W, H, body, alt, false);
}

/** A zigzag resistor from (x1, y1) to (x2, y2), horizontal or vertical. */
function zig(x1, y1, x2, y2) {
  const n = 6, vert = x1 === x2;
  const len = vert ? y2 - y1 : x2 - x1;
  const lead = len * 0.18, body = len - 2 * lead;
  let d = `M${x1} ${y1} ${vert ? `L${x1} ${r1(y1 + lead)}` : `L${r1(x1 + lead)} ${y1}`}`;
  for (let k = 0; k < n; k++) {
    const u = lead + (body * (k + 0.5)) / n;
    const off = (k % 2 ? -1 : 1) * 9;
    d += vert ? ` L${r1(x1 + off)} ${r1(y1 + u)}` : ` L${r1(x1 + u)} ${r1(y1 + off)}`;
  }
  d += vert ? ` L${x1} ${r1(y2 - lead)} L${x2} ${y2}` : ` L${r1(x2 - lead)} ${y1} L${x2} ${y2}`;
  return `<path class="px-wire px-res" d="${d}"/>`;
}
function battery(x, y1, y2, label) {
  const my = (y1 + y2) / 2;
  return line(x, y1, x, my - 7, 'px-wire') + line(x, my + 7, x, y2, 'px-wire')
    + line(x - 18, my - 7, x + 18, my - 7, 'px-wire px-plate') + line(x - 9, my + 7, x + 9, my + 7, 'px-wire px-plate px-thick')
    + (label ? txt(x - 24, my + 5, label, { anchor: 'end', cls: 'px-b' }) : '') + txt(x + 24, my - 4, '+', { anchor: 'start', cls: 'px-small px-mut' });
}
/** Series, parallel or a series-parallel combination. */
function circuitFig({ type, labels, vLabel, alt }) {
  const W = 360, H = 220, xl = 70, xr = 300, yt = 40, yb = 180;
  let body = battery(xl, yt, yb, vLabel);
  if (type === 'series') {
    const n = labels.length;
    if (n === 2) {
      body += line(xl, yt, 110, yt, 'px-wire') + zig(110, yt, 200, yt) + line(200, yt, xr, yt, 'px-wire');
      body += line(xr, yt, xr, 70, 'px-wire') + zig(xr, 70, xr, 150) + line(xr, 150, xr, yb, 'px-wire');
      body += line(xr, yb, xl, yb, 'px-wire');
      body += txt(155, yt - 16, labels[0], { cls: 'px-b' }) + txt(xr - 16, 114, labels[1], { anchor: 'end', cls: 'px-b' });
    } else {
      body += line(xl, yt, 100, yt, 'px-wire') + zig(100, yt, 170, yt) + line(170, yt, 200, yt, 'px-wire') + zig(200, yt, 270, yt) + line(270, yt, xr, yt, 'px-wire');
      body += line(xr, yt, xr, 70, 'px-wire') + zig(xr, 70, xr, 150) + line(xr, 150, xr, yb, 'px-wire') + line(xr, yb, xl, yb, 'px-wire');
      body += txt(135, yt - 16, labels[0], { cls: 'px-b' }) + txt(235, yt - 16, labels[1], { cls: 'px-b' }) + txt(xr - 16, 114, labels[2], { anchor: 'end', cls: 'px-b' });
    }
  } else if (type === 'parallel') {
    const n = labels.length;
    const xs = n === 2 ? [180, 280] : [150, 220, 290];
    const right = xs[xs.length - 1];
    body += line(xl, yt, right, yt, 'px-wire') + line(xl, yb, right, yb, 'px-wire');
    xs.forEach((x, k) => {
      body += line(x, yt, x, 75, 'px-wire') + zig(x, 75, x, 145) + line(x, 145, x, yb, 'px-wire');
      body += txt(x + 14, 114, labels[k], { anchor: 'start', cls: 'px-b px-small' });
      body += `<circle class="px-node" cx="${x}" cy="${yt}" r="3"/><circle class="px-node" cx="${x}" cy="${yb}" r="3"/>`;
    });
  } else {
    // R1 in series along the top, then R2 and R3 side by side
    body += line(xl, yt, 95, yt, 'px-wire') + zig(95, yt, 165, yt) + line(165, yt, 290, yt, 'px-wire') + line(xl, yb, 290, yb, 'px-wire');
    body += txt(130, yt - 16, labels[0], { cls: 'px-b' });
    [210, 290].forEach((x, k) => {
      body += line(x, yt, x, 75, 'px-wire') + zig(x, 75, x, 145) + line(x, 145, x, yb, 'px-wire');
      body += txt(x + 14, 114, labels[k + 1], { anchor: 'start', cls: 'px-b px-small' });
      body += `<circle class="px-node" cx="${x}" cy="${yt}" r="3"/><circle class="px-node" cx="${x}" cy="${yb}" r="3"/>`;
    });
  }
  return svg(W, H, body, alt, false);
}

/** A converging lens or a concave mirror with the object, drawn to scale. */
function opticsFig({ f, dO, mirror, fLabel, dLabel, alt }) {
  const W = 360, H = 200, ay = 110;
  const span = Math.max(dO, mirror ? 2 * f : f) * 1.12;
  const x0 = mirror ? 320 : 215;
  const s = (x0 - 22) / span;
  let body = line(10, ay, W - 10, ay, 'px-axis');
  if (mirror) {
    body += `<path class="px-mirror" d="M${x0 - 14} ${ay - 70} Q${x0 + 16} ${ay} ${x0 - 14} ${ay + 70}"/>`;
    for (let k = -3; k <= 3; k++) { const yy = ay + k * 20; const xx = x0 - 14 + 30 * (0.25 - ((yy - ay) / 140) ** 2) * 2 - 15 + 15; body += line(xx + 3, yy, xx + 12, yy - 8, 'px-hatch'); }
    for (const [k, name] of [[1, 'F'], [2, 'C']]) { const x = x0 - k * f * s; body += `<circle class="px-dot" cx="${r1(x)}" cy="${ay}" r="4"/>` + txt(x, ay + 20, name, { cls: 'px-small px-b' }); }
  } else {
    body += `<path class="px-lens" d="M${x0} ${ay - 72} Q${x0 + 22} ${ay} ${x0} ${ay + 72} Q${x0 - 22} ${ay} ${x0} ${ay - 72} Z"/>`;
    for (const k of [-1, 1]) { const x = x0 + k * f * s; body += `<circle class="px-dot" cx="${r1(x)}" cy="${ay}" r="4"/>` + txt(x, ay + 20, 'F', { cls: 'px-small px-b' }); }
  }
  const ox = x0 - dO * s;
  body += arrow(ox, ay, ox, ay - 48, 'c2', 10) + txt(ox, ay - 56, 'object', { cls: 'px-small' });
  body += arrow((ox + x0) / 2, ay + 40, ox + 1, ay + 40, 'c3', 7) + arrow((ox + x0) / 2, ay + 40, x0 - 1, ay + 40, 'c3', 7);
  body += txt((ox + x0) / 2, ay + 58, dLabel, { cls: 'px-b px-small' });
  body += txt(mirror ? x0 - 20 : x0 + 16, ay - 78, fLabel, { anchor: mirror ? 'end' : 'start', cls: 'px-b px-small' });
  return svg(W, H, body, alt, false);
}

/** Light crossing a flat boundary, the normal dashed. */
function snellFig({ t1, t2, top, bottom, l1, l2, alt }) {
  const W = 340, H = 240, cx = 170, cy = 120, L = 105;
  const a1 = (t1 * Math.PI) / 180, a2 = (t2 * Math.PI) / 180;
  let body = `<rect class="px-medium" x="10" y="${cy}" width="${W - 20}" height="${H - cy - 10}"/>`;
  body += line(10, cy, W - 10, cy, 'px-ax') + line(cx, 18, cx, H - 18, 'px-normal');
  body += arrow(cx - L * Math.sin(a1), cy - L * Math.cos(a1), cx, cy, 'c1', 10);
  body += arrow(cx, cy, cx + L * Math.sin(a2), cy + L * Math.cos(a2), 'c1', 10);
  body += arc(cx, cy, 44, -Math.PI / 2 - a1, -Math.PI / 2) + arc(cx, cy, 44, Math.PI / 2 - a2, Math.PI / 2);
  // labels sit just outside each ray, reading away from it
  body += txt(cx - 62 * Math.sin(a1 + 0.3) - 2, cy - 62 * Math.cos(a1 + 0.3) + 4, l1, { anchor: 'end', cls: 'px-b' });
  body += txt(cx + 62 * Math.sin(a2 + 0.3) + 2, cy + 62 * Math.cos(a2 + 0.3) + 8, l2, { anchor: 'start', cls: 'px-b' });
  // the media are named in the two empty quadrants: top right (the incoming ray is on the left) and bottom left
  body += txt(W - 16, cy - 12, top, { anchor: 'end', cls: 'px-small' }) + txt(16, cy + 22, bottom, { anchor: 'start', cls: 'px-small' });
  body += txt(cx + 6, 28, 'normal', { anchor: 'start', cls: 'px-small px-mut' });
  return svg(W, H, body, alt, false);
}

/* ================================================================ skills */
const UNIT_TITLES = {
  'phys-u1': 'Motion in One Dimension', 'phys-u2': 'Vectors and Projectile Motion', 'phys-u3': "Forces and Newton's Laws",
  'phys-u4': 'Circular Motion and Gravitation', 'phys-u5': 'Work, Energy and Power', 'phys-u6': 'Momentum and Collisions',
  'phys-u7': 'Waves and Sound', 'phys-u8': 'Light and Optics', 'phys-u9': 'Electricity and Magnetism',
};
const SKILLS = [
  { id: 'speed', setId: 'phys-u1', name: 'Average speed & velocity', ico: '🏃' },
  { id: 'accel', setId: 'phys-u1', name: 'Acceleration', ico: '🚀' },
  { id: 'kinematics', setId: 'phys-u1', name: 'Kinematic equations', ico: '📐' },
  { id: 'freefall', setId: 'phys-u1', name: 'Free fall', ico: '🪂' },
  { id: 'graphs', setId: 'phys-u1', name: 'Motion graphs', ico: '📈' },
  { id: 'components', setId: 'phys-u2', name: 'Vector components', ico: '↗️' },
  { id: 'resultant', setId: 'phys-u2', name: 'Resultant vectors', ico: '➕' },
  { id: 'projectile', setId: 'phys-u2', name: 'Horizontal launch', ico: '🏀' },
  { id: 'relative', setId: 'phys-u2', name: 'Relative velocity', ico: '🚤' },
  { id: 'fma', setId: 'phys-u3', name: 'F = ma', ico: '🛒' },
  { id: 'weight', setId: 'phys-u3', name: 'Weight and mass', ico: '⚖️' },
  { id: 'netforce', setId: 'phys-u3', name: 'Net force', ico: '🪢' },
  { id: 'friction', setId: 'phys-u3', name: 'Friction', ico: '🧊' },
  { id: 'fbd', setId: 'phys-u3', name: 'Free-body diagrams', ico: '📦' },
  { id: 'centripetal', setId: 'phys-u4', name: 'Centripetal motion', ico: '🎡' },
  { id: 'period', setId: 'phys-u4', name: 'Period & frequency', ico: '⏱️' },
  { id: 'gravchange', setId: 'phys-u4', name: 'How gravity changes', ico: '🌍' },
  { id: 'gravity', setId: 'phys-u4', name: 'Universal gravitation', ico: '🪐' },
  { id: 'work', setId: 'phys-u5', name: 'Work', ico: '🏋️' },
  { id: 'energy', setId: 'phys-u5', name: 'Kinetic & potential energy', ico: '🎢' },
  { id: 'conservation', setId: 'phys-u5', name: 'Conservation of energy', ico: '♻️' },
  { id: 'power', setId: 'phys-u5', name: 'Power', ico: '💡' },
  { id: 'efficiency', setId: 'phys-u5', name: 'Efficiency', ico: '⚙️' },
  { id: 'momentum', setId: 'phys-u6', name: 'Momentum', ico: '🎳' },
  { id: 'impulse', setId: 'phys-u6', name: 'Impulse', ico: '🥊' },
  { id: 'inelastic', setId: 'phys-u6', name: 'Sticking collisions', ico: '🚃' },
  { id: 'recoil', setId: 'phys-u6', name: 'Recoil', ico: '🛹' },
  { id: 'waves', setId: 'phys-u7', name: 'Wave speed v = fλ', ico: '🌊' },
  { id: 'waveperiod', setId: 'phys-u7', name: 'Wave period & frequency', ico: '〰️' },
  { id: 'echo', setId: 'phys-u7', name: 'Echoes', ico: '📣' },
  { id: 'emwaves', setId: 'phys-u8', name: 'Light: c = fλ', ico: '🌈' },
  { id: 'refraction', setId: 'phys-u8', name: 'Index of refraction', ico: '💎' },
  { id: 'snell', setId: 'phys-u8', name: "Snell's law", ico: '🔦' },
  { id: 'lenses', setId: 'phys-u8', name: 'Lenses & mirrors', ico: '🔍' },
  { id: 'ohm', setId: 'phys-u9', name: "Ohm's law", ico: '🔌' },
  { id: 'resistors', setId: 'phys-u9', name: 'Series & parallel', ico: '🧮' },
  { id: 'circuit', setId: 'phys-u9', name: 'Series circuits', ico: '🔋' },
  { id: 'epower', setId: 'phys-u9', name: 'Electric power', ico: '⚡' },
  { id: 'kwh', setId: 'phys-u9', name: 'Energy cost (kWh)', ico: '🧾' },
  { id: 'coulomb', setId: 'phys-u9', name: "Coulomb's law", ico: '🧲' },
];
const SK = Object.fromEntries(SKILLS.map((s) => [s.id, s]));
const UNIT_SETS = Object.keys(UNIT_TITLES);
const LEVEL_NAMES = { 1: 'Warm-up', 2: 'Standard', 3: 'Challenge' };

class Retry extends Error {}
/** "a 80 kg crate" reads "an 80 kg crate". */
const articles = (s) => s.replace(/\b([Aa])n? (\d[\d,]*)(?=[\s.])/g, (m, a, n) => `${a}${/^8|^1[18](,|$)/.test(n) ? 'n' : ''} ${n}`);
const retry = () => { throw new Retry('pick new numbers'); };

/** A given quantity: its key (for tools), symbol, value in SI units, unit and how the prompt writes it. */
function gq(key, sym, v, unitKey, o = {}) {
  return { key, sym, v: clean(v), unit: unitKey, text: o.text || withUnit(fmt(v), unitKey), ...o };
}
/** A given written in scientific notation: coefficient text and exponent. */
function gsci(key, sym, coef, exp, unitKey, o = {}) {
  const v = Number(`${coef}e${exp}`);
  return gq(key, sym, v, unitKey, { text: withUnit(sciText(coef, exp), unitKey), ...o });
}
const G_GIVEN = () => gq('g', 'g', GRAV, 'm/s2', { k: true, note: 'free-fall acceleration' });
/** A value in scientific notation to show as a given: n significant figures. */
function sciGiven(key, sym, lo, hi, dp, exp, unitKey, o) {
  const c = dec(lo, hi, dp);
  return gsci(key, sym, fmt(c), exp, unitKey, o);
}

/** Answer strings the core checker would also take, for Mistakes and tools. */
function acceptList(str, unitKey, sci) {
  const n = str.replace(/,/g, '');
  const out = [n];
  const d = U[unitKey];
  if (unitKey === '$') out.push(`$${n}`, `${n} dollars`);
  else if (d && d.sym) out.push(withUnit(n, unitKey), `${n} ${d.words[1] || d.sym}`);
  if (unitKey === '%') out.push(`${n} percent`);
  if (sci) {
    const m = n.match(/^(-?[\d.]+) × 10\^(-?\d+)$/);
    if (m) out.push(`${m[1]}e${m[2]}`, `${m[1]} x 10^${m[2]}`, ...(d && d.sym ? [`${m[1]}e${m[2]} ${d.sym}`] : []));
  }
  return [...new Set(out)];
}

/**
 * Bundle what a generator knows into one question, with its worked solution.
 * o: { variant, prompt, givens, find: { sym, name }, value, unit, rule, sci,
 *      eq, sub, solve (lines of working), notes, tips, wrong: [{ v, why }],
 *      dirs, signed, figure, figureAlt, nts, type, options, brief }
 */
function makeQ(skill, lvl, o) {
  const sk = SK[skill];
  let s = null, answer, prompt;
  if (o.type === 'mc') {
    answer = o.answer;
    prompt = o.prompt;
  } else {
    s = settle(o.value, o.rule, o.sci);
    if (!s) retry();
    // a wrong option or a given equal to the answer would give it away
    if (o.givens.some((g) => !g.k && g.unit === o.unit && Math.abs(g.v - s.num) < 1e-12 * Math.abs(s.num) + 1e-15)) retry();
    answer = withUnit(s.str, o.unit);
    prompt = [o.prompt, s.exact ? '' : roundText(o.rule, o.unit, o.sci)].filter(Boolean).join(' ');
  }
  prompt = articles(pretty(prompt));
  const eqSign = !s || s.exact ? '=' : '≈';
  const lines = (arr) => (arr || []).map((x) => (typeof x === 'string' ? mline(x) : x));
  const givenLines = () => o.givens.filter((g) => !g.hide).map((g) => mline(g.line || `${g.sym} = ${g.text}`, g.note ? el('span', { class: 'px-note' }, ` (${g.note})`) : ''));
  const shownAnswer = o.shown || answer;
  const work = (final) => {
    const row = (k, head, kids) => el('div', { class: 'px-g-row' },
      el('span', { class: 'px-g-k', 'aria-hidden': 'true' }, k),
      el('div', { class: 'px-g-body' }, el('span', { class: 'px-g-h' }, head), ...kids));
    const solved = final
      ? [...lines(o.solve), ...(s && !s.exact && !o.finalLine ? [mline(`${o.find.sym} = ${withUnit(ap(o.value), o.unit)}`)] : []), o.finalLine ? o.finalLine() : mline(`${o.find.sym} ${eqSign} `, boxed(shownAnswer))]
      : [mline(`${o.find.sym} = `, el('span', { class: 'px-q' }, '?'))];
    const kids = [
      o.intro ? el('p', { class: 'px-step' }, ...textNodes(o.intro)) : null,
      el('div', { class: 'px-guess' },
        row('G', 'Givens', givenLines()),
        row('U', 'Unknown', [mline(`${o.find.sym} = ?`, o.find.name ? el('span', { class: 'px-note' }, ` (${o.find.name})`) : '')]),
        row('E', 'Equation', lines(o.eq)),
        row('S', 'Substitute', lines(final || !o.hintSub ? o.sub : o.hintSub)),
        row('S', 'Solve', solved)),
      ...(final ? (o.notes || []) : (o.tips || [])).map((t) => el('p', { class: 'px-aside' }, ...textNodes(t))),
    ];
    if (final && s && !s.exact) kids.push(el('p', { class: 'px-aside' }, ...textNodes(`Rounded as asked: ${roundText(o.rule, o.unit, o.sci).replace(/^Give your answer |^Round /, '').replace(/\.$/, '')}.`)));
    if (!final) kids.push(el('p', { class: 'px-aside' }, 'Now work out the last line yourself — and keep the unit.'));
    return el('div', { class: 'px-work' }, ...kids);
  };
  const eqLast = (o.eq || []).length ? plainLine(o.eq[o.eq.length - 1]) : '';
  const briefParts = [eqLast, ...(o.sub || []).filter((x) => typeof x === 'string').map(plainLine)].filter(Boolean);
  // "1/dᵢ = … = 15.6 m⁻¹" must not run straight into the answer: name the unknown when the last line solves for something else
  const symPlain = o.find ? plainLine(o.find.sym) : '';
  const endsOnSym = !briefParts.length || briefParts[briefParts.length - 1].startsWith(`${symPlain} =`);
  const brief = supText(typeof o.brief === 'function' ? o.brief(pretty(answer), eqSign) : o.brief || `${briefParts.join('; ')}${endsOnSym ? '' : `, so ${symPlain}`} ${eqSign} ${pretty(answer)}`);
  const q = {
    id: `physlab:${skill}`, skill, kind: 'gen', type: o.type || 'written', setId: sk.setId,
    ask: `${sk.ico} ${sk.name}`,
    prompt, answer, accept: s ? acceptList(s.str, o.unit, o.sci) : [],
    options: o.options,
    level: lvl, variant: o.variant,
    givens: Object.fromEntries(o.givens.map((g) => [g.key, g.v])),
    givenText: Object.fromEntries(o.givens.filter((g) => !g.noText).map((g) => [g.key, pretty(g.text)])),
    find: o.find, rule: o.rule || null,
    value: s ? (s.exact ? s.num : clean(o.value)) : o.value,
    exact: s ? s.exact : true, round: s && !s.exact ? o.rule : null, place: s ? s.place : 0,
    unit: o.unit, unitSym: (U[o.unit] || {}).sym || '', sci: !!o.sci, signed: !!o.signed, dirs: o.dirs || null,
    uses: o.uses || [], data: o.data || null, correct: o.correct || null,
    source: `${UNIT_TITLES[sk.setId]} · generated by Physics Lab`,
    brief, wrong: o.wrong || [], nts: !!o.nts,
  };
  if (s) Object.defineProperty(q, 'dec', { value: answerDec(s.str) });
  Object.defineProperty(q, 'work', { value: work });
  if (q.type === 'written') q.check = (input) => grade(q, input).ok;
  q.explanation = work(true);
  q.hint = () => work(false);
  if (o.figure) { q.figure = o.figure; q.figureAlt = o.figureAlt; }
  if (o.needsFigure) q.needsFigure = true;
  return q;
}

/* Frequently used working. */
const P = (v, unitKey) => withUnit(fmt(v), unitKey);           // "12 m/s"
const PP = (v, unitKey) => `(${P(v, unitKey)})`;                  // "(12 m/s)"
const gtext = (g) => (/^[-−]/.test(g.text) || / /.test(g.text) ? `(${g.text})` : g.text);

/* ======================================================= unit 1: motion */
const MOVERS = [
  { who: 'A runner', lo: 3, hi: 8 }, { who: 'A cyclist', lo: 5, hi: 14 }, { who: 'A car', lo: 12, hi: 32 },
  { who: 'A train', lo: 18, hi: 45 }, { who: 'A dog', lo: 4, hi: 11 }, { who: 'A skateboarder', lo: 3, hi: 9 }, { who: 'A bus', lo: 8, hi: 22 },
];
/** A person is "the runner", not "it": pronouns for a mover's name ("A runner" → it: "the runner", its: "the runner's"). */
function pron(who) {
  const the = who.replace(/^An? /, 'the ');
  return /runner|cyclist|skateboarder|sprinter|skier|skater|child|student/.test(who) ? { it: the, its: `${the}'s`, they: 'they' } : { it: 'it', its: 'its', they: 'it' };
}
const EW = { pos: ['east', 'e', 'eastward', 'to the east'], neg: ['west', 'w', 'westward', 'to the west'] };
const RL = { pos: ['right', 'r', 'to the right', 'rightward'], neg: ['left', 'l', 'to the left', 'leftward'] };
const UD = { pos: ['up', 'upward', 'upwards'], neg: ['down', 'downward', 'downwards'] };

function genSpeed(lvl) {
  const variant = pick(lvl === 1 ? ['speed', 'distance', 'time'] : lvl === 2 ? ['speed', 'distance', 'time', 'velocity'] : ['trip', 'velocity', 'velocity', 'speed']);
  const mv = pick(MOVERS);
  const who = mv.who, it = who.replace(/^A /, 'the '), P_ = pron(who);
  if (variant === 'speed') {
    let v, t;
    if (lvl === 1) { v = ri(mv.lo, mv.hi); t = 5 * ri(2, 24); } else { v = dec(mv.lo, mv.hi, 1); t = ri(12, 300); }
    const d = lvl === 1 ? v * t : Math.round(v * t);
    const D = gq('d', 'd', d, 'm', { note: 'distance' }), T = gq('t', 't', t, 's', { note: 'time' });
    return makeQ('speed', lvl, {
      variant, prompt: `${who} covers ${D.text} in ${T.text}. What is ${P_.its} average speed?`,
      givens: [D, T], find: { sym: 'v', name: 'average speed' }, value: d / t, unit: 'm/s', rule: { dp: 1 },
      eq: ['v = [[d || t]]'], sub: [`v = [[${D.text} || ${T.text}]]`],
      wrong: [{ v: t / d, why: 'divided time by distance' }, { v: d * t, why: 'multiplied instead of dividing' }, { v: d / t / 2, why: 'halved for no reason' }, { v: (d / t) * 10, why: 'slipped a decimal place' }],
    });
  }
  const v = lvl === 1 ? ri(mv.lo, mv.hi) : dec(mv.lo, mv.hi, 1);
  const V = gq('v', 'v', v, 'm/s', { note: 'average speed' });
  if (variant === 'distance') {
    const t = lvl === 1 ? 5 * ri(2, 24) : ri(12, 300);
    const T = gq('t', 't', t, 's', { note: 'time' });
    return makeQ('speed', lvl, {
      variant, prompt: `${who} moves at an average speed of ${V.text} for ${T.text}. How far does ${P_.it} go?`,
      givens: [V, T], find: { sym: 'd', name: 'distance' }, value: v * t, unit: 'm', rule: { dp: 1 },
      eq: ['v = [[d || t]]', 'd = vt'], sub: [`d = (${V.text})(${T.text})`],
      wrong: [{ v: v / t, why: 'divided speed by time' }, { v: t / v, why: 'divided time by speed' }, { v: v + t, why: 'added' }],
    });
  }
  if (variant === 'time') {
    const d = lvl === 1 ? v * 5 * ri(2, 24) : ri(50, 5000);
    const D = gq('d', 'd', d, 'm', { note: 'distance' });
    return makeQ('speed', lvl, {
      variant, prompt: `How long does it take ${it} to cover ${D.text} at an average speed of ${V.text}?`,
      givens: [D, V], find: { sym: 't', name: 'time' }, value: d / v, unit: 's', rule: { dp: 1 },
      eq: ['v = [[d || t]]', 't = [[d || v]]'], sub: [`t = [[${D.text} || ${V.text}]]`],
      wrong: [{ v: v / d, why: 'divided speed by distance' }, { v: d * v, why: 'multiplied' }, { v: d / v / 60, why: 'converted to minutes' }],
    });
  }
  if (variant === 'trip') {
    const t1 = ri(10, 120), t2 = ri(10, 120);
    const d1 = Math.round(dec(mv.lo, mv.hi, 1) * t1), d2 = Math.round(dec(mv.lo, mv.hi, 1) * t2);
    if (d1 * t2 === d2 * t1) retry();
    const G1 = gq('d1', 'd₁', d1, 'm'), T1 = gq('t1', 't₁', t1, 's'), G2 = gq('d2', 'd₂', d2, 'm'), T2 = gq('t2', 't₂', t2, 's');
    return makeQ('speed', lvl, {
      variant, prompt: `${who} goes ${G1.text} in ${T1.text}, then ${G2.text} more in ${T2.text}. What is ${P_.its} average speed for the whole trip?`,
      givens: [G1, T1, G2, T2], find: { sym: 'v', name: 'average speed for the whole trip' }, value: (d1 + d2) / (t1 + t2), unit: 'm/s', rule: { dp: 2 },
      eq: ['v = [[total distance || total time]] = [[d₁ + d₂ || t₁ + t₂]]'], sub: [`v = [[${G1.text} + ${G2.text} || ${T1.text} + ${T2.text}]]`], solve: [`v = [[${P(d1 + d2, 'm')} || ${P(t1 + t2, 's')}]]`],
      notes: ['Average speed is total distance ÷ total time — not the average of the two speeds.'],
      wrong: [{ v: (d1 / t1 + d2 / t2) / 2, why: 'averaged the two speeds' }, { v: d1 / t1 + d2 / t2, why: 'added the two speeds' }, { v: (d1 + d2) / t1, why: 'used only the first time' }],
    });
  }
  // average velocity: out and partly back
  const t1 = ri(5, 60), t2 = ri(5, 60);
  // distances the mover could really cover at its own speed
  const d1 = Math.round(dec(mv.lo, mv.hi, 1) * t1), d2 = Math.round(dec(mv.lo, mv.hi, 1) * t2);
  if (d1 === d2 || d1 < 10 || d2 < 10) retry();
  const G1 = gq('d1', 'd₁', d1, 'm', { line: `d₁ = ${d1} m east` }), T1 = gq('t1', 't₁', t1, 's'), G2 = gq('d2', 'd₂', d2, 'm', { line: `d₂ = ${d2} m west` }), T2 = gq('t2', 't₂', t2, 's');
  return makeQ('speed', lvl, {
    variant, prompt: `${who} moves ${G1.text} east in ${T1.text}, then ${G2.text} west in ${T2.text}. What is ${P_.its} average velocity for the whole trip? Take east as positive.`,
    givens: [G1, T1, G2, T2], find: { sym: 'v_{avg}', name: 'average velocity' }, value: (d1 - d2) / (t1 + t2), unit: 'm/s', rule: { dp: 2 },
    signed: true, dirs: EW,
    eq: ['v_{avg} = [[Δx || Δt]]', 'Δx = d₁ − d₂ (west is negative)'], sub: [`Δx = ${G1.text} − ${G2.text} = ${P(d1 - d2, 'm')}`, `v_{avg} = [[${P(d1 - d2, 'm')} || ${T1.text} + ${T2.text}]]`], solve: [`v_{avg} = [[${P(d1 - d2, 'm')} || ${P(t1 + t2, 's')}]]`],
    notes: ['Velocity uses displacement (where it ended up), not the total distance walked.'],
    wrong: [{ v: (d1 + d2) / (t1 + t2), why: 'used total distance (that is average speed)' }, { v: (d2 - d1) / (t1 + t2), why: 'sign flipped' }, { v: (d1 - d2) / t1, why: 'used only the first time' }],
  });
}

function genAccel(lvl) {
  const variant = pick(lvl === 1 ? ['a', 'a', 'v', 't'] : lvl === 2 ? ['a', 'v', 't'] : ['a', 'v', 't', 'v0']);
  const who = pick(['A car', 'A cyclist', 'A train', 'A sprinter', 'A motorbike', 'A rocket sled']), P_ = pron(who);
  let v0, a, t;
  if (lvl === 1) { v0 = 0; a = ri(1, 6); t = ri(2, 10); } else if (lvl === 2) { v0 = ri(2, 20); a = dec(0.5, 6, 1); t = ri(2, 12); } else {
    v0 = dec(12, 35, chance(0.5) ? 1 : 0); a = -dec(1, 6, 1);
    const tMax = Math.floor((v0 - 1) / -a);
    if (tMax < 2) retry();
    t = ri(2, Math.min(tMax, 12));
  }
  const v = clean(v0 + a * t);
  const slowing = a < 0;
  const V0 = gq('v0', 'v₀', v0, 'm/s', { note: v0 === 0 ? 'starts from rest' : 'starting velocity' }), V = gq('v', 'v', v, 'm/s', { note: 'final velocity' });
  const A = gq('a', 'a', a, 'm/s2'), T = gq('t', 't', t, 's');
  const posNote = slowing ? ' Take the direction of motion as positive.' : '';
  if (variant === 'a') {
    const prompt = v0 === 0 ? `${who} starts from rest and reaches ${V.text} in ${T.text}. What is ${P_.its} acceleration?`
      : `${who} ${slowing ? 'slows' : 'speeds up'} from ${V0.text} to ${V.text} in ${T.text}. What is ${P_.its} acceleration?${posNote}`;
    return makeQ('accel', lvl, {
      variant, prompt, givens: [V0, V, T], find: { sym: 'a', name: 'acceleration' }, value: (v - v0) / t, unit: 'm/s2', rule: { dp: 2 }, signed: slowing,
      eq: ['a = [[v − v₀ || t]]'], sub: [`a = [[${V.text} − ${V0.text} || ${T.text}]]`], solve: [`a = [[${P(v - v0, 'm/s')} || ${T.text}]]`],
      notes: slowing ? ['Slowing down in the positive direction gives a negative acceleration.'] : [],
      wrong: [{ v: (v + v0) / t, why: 'added the velocities' }, { v: v / t, why: 'ignored the starting velocity' }, { v: (v - v0) * t, why: 'multiplied by the time' }, { v: (v0 - v) / t, why: 'subtracted the wrong way round' }],
    });
  }
  if (variant === 'v') {
    return makeQ('accel', lvl, {
      variant, prompt: `${who} ${v0 === 0 ? 'starts from rest and' : `moving at ${V0.text}`} ${slowing ? `has an acceleration of ${A.text}` : `accelerates at ${A.text}`} for ${T.text}. How fast is ${P_.it} going then?${posNote}`,
      givens: [V0, A, T], find: { sym: 'v', name: 'final velocity' }, value: v, unit: 'm/s', rule: { dp: 1 },
      eq: ['v = v₀ + at'], sub: [`v = ${V0.text} + ${gtext(A)}(${T.text})`], solve: [`v = ${V0.text} + ${P(a * t, 'm/s')}`],
      wrong: [{ v: v0 + a, why: 'forgot to multiply by the time' }, { v: a * t, why: 'forgot the starting velocity' }, { v: v0 - a * t, why: 'sign slip' }, { v: v0 + a / t, why: 'divided by the time' }],
    });
  }
  if (variant === 't') {
    return makeQ('accel', lvl, {
      variant, prompt: `How long does it take ${who.replace(/^A /, 'a ')} to ${slowing ? 'slow' : 'speed up'} from ${V0.text} to ${V.text} with an acceleration of ${A.text}?${posNote}`,
      givens: [V0, V, A], find: { sym: 't', name: 'time' }, value: (v - v0) / a, unit: 's', rule: { dp: 2 },
      eq: ['a = [[v − v₀ || t]]', 't = [[v − v₀ || a]]'], sub: [`t = [[${V.text} − ${V0.text} || ${A.text}]]`], solve: [`t = [[${P(v - v0, 'm/s')} || ${A.text}]]`],
      wrong: [{ v: (v - v0) * a, why: 'multiplied by the acceleration' }, { v: a / (v - v0), why: 'divided the wrong way round' }, { v: Math.abs(v / a), why: 'ignored the starting velocity' }],
    });
  }
  return makeQ('accel', lvl, {
    variant, prompt: `After braking for ${T.text} with an acceleration of ${A.text}, ${who.replace(/^A /, 'a ')} is moving at ${V.text}. How fast was ${P_.it} going before ${P_.they} braked? Take the direction of motion as positive.`,
    givens: [V, A, T], find: { sym: 'v₀', name: 'starting velocity' }, value: v0, unit: 'm/s', rule: { dp: 1 },
    eq: ['v = v₀ + at', 'v₀ = v − at'], sub: [`v₀ = ${V.text} − ${gtext(A)}(${T.text})`], solve: [`v₀ = ${V.text} − (${P(a * t, 'm/s')})`],
    wrong: [{ v: v + a * t, why: 'added at instead of subtracting' }, { v: -a * t, why: 'forgot the final velocity' }, { v: v - a, why: 'forgot to multiply by the time' }],
  });
}

function genKinematics(lvl) {
  const variant = pick(lvl === 1 ? ['x_t', 'v_x', 'x_v', 'x_avg'] : lvl === 2 ? ['x_t', 'v_x', 'x_v', 'a_x', 't_avg', 'x_avg'] : ['x_t', 'v_x', 'x_v', 'a_x', 't_avg']);
  const who = pick(['A car', 'A cart', 'A motorcycle', 'A sports car', 'A train', 'A jet on a runway']);
  const whoL = who.replace(/^A /, 'the ');
  if (variant === 'x_t') {
    const v0 = lvl === 1 ? 0 : ri(2, 15), a = lvl === 1 ? ri(1, 6) : dec(0.5, 4, 1), t = ri(2, 10);
    const V0 = gq('v0', 'v₀', v0, 'm/s', { note: v0 ? 'starting velocity' : 'starts from rest' }), A = gq('a', 'a', a, 'm/s2'), T = gq('t', 't', t, 's');
    return makeQ('kinematics', lvl, {
      variant, prompt: `${who} ${v0 ? `moving at ${V0.text}` : 'starts from rest and'} ${v0 ? 'speeds up' : 'accelerates'} at ${A.text} for ${T.text}. How far does it travel in that time?`,
      givens: [V0, A, T], find: { sym: 'Δx', name: 'displacement' }, value: v0 * t + 0.5 * a * t * t, unit: 'm', rule: { dp: 2 },
      eq: ['Δx = v₀t + ½at^2'], sub: [`Δx = ${V0.text}(${T.text}) + ½${gtext(A)}(${T.text})^2`], solve: [`Δx = ${P(v0 * t, 'm')} + ${P(0.5 * a * t * t, 'm')}`],
      wrong: [{ v: v0 * t + a * t * t, why: 'forgot the ½' }, { v: v0 * t + 0.5 * a * t, why: 'forgot to square the time' }, { v: (v0 + a * t) * t, why: 'used the final speed for the whole time' }, ...(v0 ? [{ v: 0.5 * a * t * t, why: 'forgot v₀t' }] : [])],
    });
  }
  if (variant === 'v_x') {
    const v0 = lvl === 1 ? 0 : ri(2, 15), a = lvl === 3 ? dec(0.5, 5, 1) : ri(1, 5), x = ri(5, 120);
    const V0 = gq('v0', 'v₀', v0, 'm/s', { note: v0 ? 'starting velocity' : 'starts from rest' }), A = gq('a', 'a', a, 'm/s2'), X = gq('x', 'Δx', x, 'm');
    const inside = v0 * v0 + 2 * a * x;
    return makeQ('kinematics', lvl, {
      variant, prompt: `${who} ${v0 ? `moving at ${V0.text}` : 'starts from rest and'} accelerates at ${A.text} over a distance of ${X.text}. How fast is it going at the end?`,
      givens: [V0, A, X], find: { sym: 'v', name: 'final velocity' }, value: Math.sqrt(inside), unit: 'm/s', rule: { dp: 1 },
      eq: ['v^2 = v₀^2 + 2aΔx', 'v = √[[v₀^2 + 2aΔx]]'], sub: [`v = √[[${gtext(V0)}^2 + 2${gtext(A)}(${X.text})]]`], solve: [`v = √[[${P(inside, 'm')}^2/s^2]]`],
      wrong: [{ v: inside, why: 'forgot the square root' }, { v: Math.sqrt(v0 * v0 + a * x), why: 'forgot the 2' }, { v: v0 + 2 * a * x, why: 'forgot to square v₀ and take the root' }, ...(v0 ? [{ v: Math.sqrt(2 * a * x), why: 'forgot v₀' }] : [])],
    });
  }
  if (variant === 'x_v') {
    if (lvl === 1 || chance(0.4)) {
      const a = ri(1, 6), v = ri(4, 30);
      const A = gq('a', 'a', a, 'm/s2'), V = gq('v', 'v', v, 'm/s'), V0 = gq('v0', 'v₀', 0, 'm/s', { note: 'starts from rest' });
      return makeQ('kinematics', lvl, {
        variant, prompt: `${who} starts from rest and accelerates at ${A.text} until it reaches ${V.text}. How far does it travel while speeding up?`,
        givens: [V0, V, A], find: { sym: 'Δx', name: 'displacement' }, value: (v * v) / (2 * a), unit: 'm', rule: { dp: 1 },
        eq: ['v^2 = v₀^2 + 2aΔx', 'Δx = [[v^2 − v₀^2 || 2a]]'], sub: [`Δx = [[${gtext(V)}^2 − ${gtext(V0)}^2 || 2${gtext(A)}]]`], solve: [`Δx = [[${fmt(v * v)} m^2/s^2 || ${P(2 * a, 'm/s2')}]]`],
        wrong: [{ v: (v * v) / a, why: 'forgot the 2' }, { v: v / (2 * a), why: 'forgot to square v' }, { v: 2 * a * v * v, why: 'multiplied instead of dividing' }],
      });
    }
    const v0 = ri(8, 35), a = -dec(2, 8, 1);
    const V0 = gq('v0', 'v₀', v0, 'm/s'), A = gq('a', 'a', a, 'm/s2'), V = gq('v', 'v', 0, 'm/s', { note: 'it stops' });
    return makeQ('kinematics', lvl, {
      variant, prompt: `${who} moving at ${V0.text} brakes to a stop with an acceleration of ${A.text}. How far does it travel while stopping?`,
      givens: [V0, V, A], find: { sym: 'Δx', name: 'stopping distance' }, value: (0 - v0 * v0) / (2 * a), unit: 'm', rule: { dp: 1 },
      eq: ['v^2 = v₀^2 + 2aΔx', 'Δx = [[v^2 − v₀^2 || 2a]]'], sub: [`Δx = [[(0 m/s)^2 − ${gtext(V0)}^2 || 2${gtext(A)}]]`], solve: [`Δx = [[−${fmt(v0 * v0)} m^2/s^2 || ${P(2 * a, 'm/s2')}]]`],
      notes: ['The two minus signs cancel: a stopping distance is positive.'],
      wrong: [{ v: (v0 * v0) / (2 * a), why: 'lost a minus sign' }, { v: (v0 * v0) / -a, why: 'forgot the 2' }, { v: v0 / (-2 * a), why: 'forgot to square v₀' }],
    });
  }
  if (variant === 'a_x') {
    const stop = lvl === 3 && chance(0.6);
    const v0 = stop ? ri(10, 35) : ri(0, 10), v = stop ? 0 : v0 + ri(4, 25), x = ri(10, 200);
    const V0 = gq('v0', 'v₀', v0, 'm/s', { note: v0 ? '' : 'starts from rest' }), V = gq('v', 'v', v, 'm/s', { note: v ? '' : 'it stops' }), X = gq('x', 'Δx', x, 'm');
    return makeQ('kinematics', lvl, {
      variant, prompt: stop ? `${who} moving at ${V0.text} comes to a stop in ${X.text}. What is its acceleration? Take the direction of motion as positive.`
        : `${who} speeds up from ${V0.text} to ${V.text} over ${X.text}. What is its acceleration?`,
      givens: [V0, V, X], find: { sym: 'a', name: 'acceleration' }, value: (v * v - v0 * v0) / (2 * x), unit: 'm/s2', rule: { dp: 2 }, signed: stop,
      eq: ['v^2 = v₀^2 + 2aΔx', 'a = [[v^2 − v₀^2 || 2Δx]]'], sub: [`a = [[${gtext(V)}^2 − ${gtext(V0)}^2 || 2(${X.text})]]`], solve: [`a = [[${fmt(v * v - v0 * v0)} m^2/s^2 || ${P(2 * x, 'm')}]]`],
      wrong: [{ v: (v * v - v0 * v0) / x, why: 'forgot the 2' }, { v: (v - v0) / (2 * x), why: 'forgot to square the velocities' }, { v: (v * v + v0 * v0) / (2 * x), why: 'added the squares' }],
    });
  }
  if (variant === 't_avg') {
    const v0 = ri(0, 15), v = v0 + ri(3, 20) * (lvl === 3 && chance(0.4) ? -1 : 1), x = ri(20, 300);
    if (v < 0 || v === v0 || v0 + v === 0) retry();
    const V0 = gq('v0', 'v₀', v0, 'm/s', { note: v0 ? '' : 'starts from rest' }), V = gq('v', 'v', v, 'm/s'), X = gq('x', 'Δx', x, 'm');
    return makeQ('kinematics', lvl, {
      variant, prompt: `${who} ${v > v0 ? 'speeds up' : 'slows down'} steadily from ${V0.text} to ${V.text} while covering ${X.text}. How long does that take?`,
      givens: [V0, V, X], find: { sym: 't', name: 'time' }, value: (2 * x) / (v0 + v), unit: 's', rule: { dp: 2 },
      eq: ['Δx = ½(v₀ + v)t', 't = [[2Δx || v₀ + v]]'], sub: [`t = [[2(${X.text}) || ${V0.text} + ${V.text}]]`], solve: [`t = [[${P(2 * x, 'm')} || ${P(v0 + v, 'm/s')}]]`],
      wrong: [{ v: x / (v0 + v), why: 'forgot the 2' }, { v: (2 * x) / Math.abs(v - v0), why: 'subtracted the speeds' }, { v: x / Math.max(v, v0), why: 'used one speed for the whole time' }],
    });
  }
  const v0 = ri(0, 15), v = v0 + ri(2, 20), t = ri(2, 15);
  const V0 = gq('v0', 'v₀', v0, 'm/s', { note: v0 ? '' : 'starts from rest' }), V = gq('v', 'v', v, 'm/s'), T = gq('t', 't', t, 's');
  return makeQ('kinematics', lvl, {
    variant, prompt: `${who} speeds up steadily from ${V0.text} to ${V.text} in ${T.text}. How far does it travel in that time?`,
    givens: [V0, V, T], find: { sym: 'Δx', name: 'displacement' }, value: 0.5 * (v0 + v) * t, unit: 'm', rule: { dp: 1 },
    eq: ['Δx = ½(v₀ + v)t'], sub: [`Δx = ½(${V0.text} + ${V.text})(${T.text})`], solve: [`Δx = ½(${P(v0 + v, 'm/s')})(${T.text})`],
    wrong: [{ v: (v0 + v) * t, why: 'forgot the ½' }, { v: v * t, why: 'used the final speed for the whole time' }, { v: 0.5 * (v - v0) * t, why: 'subtracted the speeds' }],
  });
}

function genFreefall(lvl) {
  const variant = pick(lvl === 1 ? ['v_t', 'd_t'] : lvl === 2 ? ['t_h', 'v_h', 'd_t', 'v_t'] : ['t_h', 'v_h', 'up_t', 'up_h']);
  const thing = pick(['A stone', 'A coin', 'A tennis ball', 'An apple', 'A wrench', 'A water balloon']);
  const g = G_GIVEN();
  const tail = ` Ignore air resistance. ${G_NOTE}`;
  if (variant === 'v_t' || variant === 'd_t') {
    const t = lvl === 1 ? ri(2, 6) : dec(0.5, 5, 1);
    const T = gq('t', 't', t, 's'), V0 = gq('v0', 'v₀', 0, 'm/s', { note: 'dropped from rest' });
    if (variant === 'v_t') {
      return makeQ('freefall', lvl, {
        variant, prompt: `${thing} is dropped from rest from a tall building. How fast is it falling after ${T.text}?${tail}`,
        givens: [V0, T, g], find: { sym: 'v', name: 'speed' }, value: GRAV * t, unit: 'm/s', rule: { dp: 2 }, uses: ['g'],
        eq: ['v = v₀ + gt = gt'], sub: [`v = (9.8 m/s²)(${T.text})`],
        wrong: [{ v: 4.9 * t, why: 'used ½g' }, { v: 10 * t, why: 'used g = 10' }, { v: GRAV / t, why: 'divided by the time' }, { v: 4.9 * t * t, why: 'found the distance instead' }],
      });
    }
    return makeQ('freefall', lvl, {
      variant, prompt: `${thing} is dropped from rest from a tall building. How far does it fall in the first ${T.text}?${tail}`,
      givens: [V0, T, g], find: { sym: 'd', name: 'distance fallen' }, value: 0.5 * GRAV * t * t, unit: 'm', rule: { dp: 1 }, uses: ['g'],
      eq: ['d = v₀t + ½gt^2 = ½gt^2'], sub: [`d = ½(9.8 m/s²)(${T.text})^2`], solve: [`d = (4.9 m/s²)(${fmt(t * t)} s^2)`],
      wrong: [{ v: GRAV * t * t, why: 'forgot the ½' }, { v: 4.9 * t, why: 'forgot to square the time' }, { v: 5 * t * t, why: 'used g = 10' }, { v: GRAV * t, why: 'found the speed instead' }],
    });
  }
  if (variant === 't_h' || variant === 'v_h') {
    const h = lvl === 2 ? ri(5, 120) : dec(2, 150, 1);
    const H = gq('h', 'h', h, 'm', { note: 'height' }), V0 = gq('v0', 'v₀', 0, 'm/s', { note: 'dropped from rest' });
    if (variant === 't_h') {
      return makeQ('freefall', lvl, {
        variant, prompt: `${thing} is dropped from rest from a height of ${H.text}. How long does it take to reach the ground?${tail}`,
        givens: [V0, H, g], find: { sym: 't', name: 'time to fall' }, value: Math.sqrt((2 * h) / GRAV), unit: 's', rule: { dp: 2 }, uses: ['g'],
        eq: ['h = ½gt^2', 't = √[[[[2h || g]]]]'], sub: [`t = √[[[[2(${H.text}) || 9.8 m/s²]]]]`], solve: [`t = √[[${ap((2 * h) / GRAV)} s^2]]`],
        wrong: [{ v: Math.sqrt(h / GRAV), why: 'forgot the 2' }, { v: (2 * h) / GRAV, why: 'forgot the square root' }, { v: Math.sqrt((2 * h) / 10), why: 'used g = 10' }, { v: h / GRAV, why: 'divided h by g' }],
      });
    }
    return makeQ('freefall', lvl, {
      variant, prompt: `${thing} is dropped from rest from a height of ${H.text}. How fast is it moving just before it hits the ground?${tail}`,
      givens: [V0, H, g], find: { sym: 'v', name: 'speed at the ground' }, value: Math.sqrt(2 * GRAV * h), unit: 'm/s', rule: { dp: 1 }, uses: ['g'],
      eq: ['v^2 = v₀^2 + 2gh', 'v = √[[2gh]]'], sub: [`v = √[[2(9.8 m/s²)(${H.text})]]`], solve: [`v = √[[${ap(2 * GRAV * h)} m^2/s^2]]`],
      wrong: [{ v: Math.sqrt(GRAV * h), why: 'forgot the 2' }, { v: 2 * GRAV * h, why: 'forgot the square root' }, { v: Math.sqrt(20 * h), why: 'used g = 10' }, { v: GRAV * h, why: 'multiplied g by h' }],
    });
  }
  const v0 = ri(5, 30);
  const V0 = gq('v0', 'v₀', v0, 'm/s', { note: 'launch speed, straight up' });
  const ball = pick(['A ball', 'A baseball', 'A pebble', 'A juggling pin']);
  if (variant === 'up_t') {
    const V = gq('v', 'v', 0, 'm/s', { note: 'at the top it stops for an instant' });
    return makeQ('freefall', lvl, {
      variant, prompt: `${ball} is thrown straight up at ${V0.text}. How long does it take to reach its highest point?${tail}`,
      givens: [V0, V, g], find: { sym: 't', name: 'time to the top' }, value: v0 / GRAV, unit: 's', rule: { dp: 2 }, uses: ['g'],
      eq: ['v = v₀ − gt', 'at the top v = 0, so t = [[v₀ || g]]'], sub: [`t = [[${V0.text} || 9.8 m/s²]]`],
      wrong: [{ v: v0 * GRAV, why: 'multiplied instead of dividing' }, { v: v0 / 10, why: 'used g = 10' }, { v: (2 * v0) / GRAV, why: 'found the time up and back down' }],
    });
  }
  return makeQ('freefall', lvl, {
    variant, prompt: `${ball} is thrown straight up at ${V0.text}. How high does it rise above the point where it was released?${tail}`,
    givens: [V0, gq('v', 'v', 0, 'm/s', { note: 'at the top' }), g], find: { sym: 'h', name: 'maximum height' }, value: (v0 * v0) / (2 * GRAV), unit: 'm', rule: { dp: 1 }, uses: ['g'],
    eq: ['v^2 = v₀^2 − 2gh', 'at the top v = 0, so h = [[v₀^2 || 2g]]'], sub: [`h = [[${gtext(V0)}^2 || 2(9.8 m/s²)]]`], solve: [`h = [[${fmt(v0 * v0)} m^2/s^2 || 19.6 m/s²]]`],
    wrong: [{ v: (v0 * v0) / GRAV, why: 'forgot the 2' }, { v: v0 / (2 * GRAV), why: 'forgot to square v₀' }, { v: (v0 * v0) / 20, why: 'used g = 10' }],
  });
}

/* Motion graphs: straight segments between grid points. */
function genGraphs(lvl) {
  const variant = pick(lvl === 1 ? ['xt_slope', 'vt_slope', 'vt_area'] : ['xt_slope', 'vt_slope', 'vt_area', 'vt_area']);
  const kind = variant === 'xt_slope' ? 'xt' : 'vt';
  const tStep = pick([1, 2]);
  const nSeg = lvl === 1 ? 1 : lvl === 2 ? pick([1, 2]) : pick([2, 3]);
  const yStep = pick(kind === 'xt' ? [2, 5, 10] : [1, 2, 5]);
  const ts = [0];
  for (let k = 0; k < nSeg; k++) ts.push(ts[ts.length - 1] + tStep * ri(1, nSeg === 1 ? 5 : 3));
  if (ts[ts.length - 1] / tStep > 10) retry();
  const ys = ts.map((_, k) => yStep * (k === 0 && lvl === 1 && variant !== 'vt_area' ? 0 : ri(0, 8)));
  if (variant === 'vt_area' && lvl === 1) { if (chance(0.5)) ys[0] = 0; else ys[1] = ys[0]; }
  if (ys.every((y) => y === 0)) retry();
  const pts = ts.map((t, k) => [t, ys[k]]);
  const yMax = yStep * Math.max(4, Math.ceil(Math.max(...ys) / yStep) + 1);
  let seg = 0, ta = 0, tb = ts[ts.length - 1];
  const who = pick(['a cart', 'a toy car', 'a cyclist', 'a runner', 'a robot']);
  let q;
  if (variant !== 'vt_area') {
    const segs = pts.slice(1).map((p, k) => k).filter((k) => ys[k + 1] !== ys[k]);
    if (!segs.length) retry();
    seg = pick(segs);
    ta = ts[seg]; tb = ts[seg + 1];
    const y1 = ys[seg], y2 = ys[seg + 1];
    const slope = (y2 - y1) / (tb - ta);
    const inf = info(clean(slope));
    if (inf.dp > 2) retry();
    const { figure, alt } = graphFig({ kind, pts, tStep, yStep, yMin: 0, yMax });
    const Ta = gq('ta', 't₁', ta, 's', { line: `at t₁ = ${ta} s, ${kind === 'xt' ? 'x' : 'v'}₁ = ${P(y1, kind === 'xt' ? 'm' : 'm/s')}`, note: 'read off the graph' });
    const Tb = gq('tb', 't₂', tb, 's', { line: `at t₂ = ${tb} s, ${kind === 'xt' ? 'x' : 'v'}₂ = ${P(y2, kind === 'xt' ? 'm' : 'm/s')}`, note: 'read off the graph' });
    const yu = kind === 'xt' ? 'm' : 'm/s', ys_ = kind === 'xt' ? 'x' : 'v';
    const neg = slope < 0;
    q = makeQ('graphs', lvl, {
      variant, prompt: kind === 'xt'
        ? `The position–time graph shows ${who} moving along a straight line. What is its velocity between ${Ta.text} and ${Tb.text}?${neg ? ' Take the direction of increasing position as positive.' : ''}`
        : `The velocity–time graph shows ${who} moving along a straight line. What is its acceleration between ${Ta.text} and ${Tb.text}?${neg ? ' Take the direction of motion as positive.' : ''}`,
      givens: [Ta, Tb], find: { sym: kind === 'xt' ? 'v' : 'a', name: kind === 'xt' ? 'velocity = slope of the line' : 'acceleration = slope of the line' },
      value: slope, unit: kind === 'xt' ? 'm/s' : 'm/s2', rule: { dp: 2 }, signed: neg,
      intro: 'Read two points off that part of the line; the slope is the rise over the run.',
      eq: [`${kind === 'xt' ? 'v' : 'a'} = slope = [[Δ${ys_} || Δt]] = [[${ys_}₂ − ${ys_}₁ || t₂ − t₁]]`],
      sub: [`${kind === 'xt' ? 'v' : 'a'} = [[${P(y2, yu)} − ${P(y1, yu)} || ${P(tb, 's')} − ${P(ta, 's')}]]`],
      solve: [`${kind === 'xt' ? 'v' : 'a'} = [[${P(y2 - y1, yu)} || ${P(tb - ta, 's')}]]`],
      notes: neg ? ['The line slopes down, so the slope is negative.'] : [],
      wrong: [{ v: (tb - ta) / (y2 - y1), why: 'divided run by rise' }, { v: y2 / tb, why: 'read one point instead of the slope' }, { v: y2 - y1, why: 'forgot to divide by the time' }, { v: -slope, why: 'sign flipped' }],
      figure, figureAlt: alt, needsFigure: true,
    });
    q.givens.pts = pts;
    return q;
  }
  // area under a velocity–time graph from 0 to the end
  if (pts.some(([, y]) => y < 0)) retry();
  const { figure, alt } = graphFig({ kind, pts, tStep, yStep, yMin: 0, yMax, shade: [0, tb] });
  const pieces = pts.slice(1).map(([t2, y2], k) => ({ t1: ts[k], t2, y1: ys[k], y2 }));
  const area = pieces.reduce((s, p) => s + 0.5 * (p.y1 + p.y2) * (p.t2 - p.t1), 0);
  const shape = (p) => (p.y1 === p.y2 ? 'rectangle' : (p.y1 === 0 || p.y2 === 0) ? 'triangle' : 'trapezoid');
  const pieceLine = (p, withResult = true) => {
    const b = p.t2 - p.t1;
    const res = (v) => (withResult ? ` = ${P(v, 'm')}` : '');
    if (shape(p) === 'rectangle') return `rectangle: (${P(b, 's')})(${P(p.y1, 'm/s')})${res(b * p.y1)}`;
    if (shape(p) === 'triangle') return `triangle: ½(${P(b, 's')})(${P(Math.max(p.y1, p.y2), 'm/s')})${res(0.5 * b * Math.max(p.y1, p.y2))}`;
    return `trapezoid: ½(${P(p.y1, 'm/s')} + ${P(p.y2, 'm/s')})(${P(b, 's')})${res(0.5 * (p.y1 + p.y2) * b)}`;
  };
  const Tb = gq('tb', 't', tb, 's');
  const maxY = Math.max(...ys);
  q = makeQ('graphs', lvl, {
    variant, prompt: `The velocity–time graph shows ${who} moving in one direction. How far does it travel from 0 s to ${Tb.text}? (Find the shaded area.)`,
    givens: [Tb], find: { sym: 'Δx', name: 'displacement = area under the line' }, value: area, unit: 'm', rule: { dp: 1 },
    intro: 'Split the shaded area into rectangles, triangles and trapezoids.',
    eq: ['Δx = area under the v–t line', 'rectangle = bh, triangle = ½bh, trapezoid = ½(h₁ + h₂)b'],
    sub: pieces.map((p) => pieceLine(p)), hintSub: pieces.map((p) => pieceLine(p, false)), solve: pieces.length > 1 ? [`Δx = ${pieces.map((p) => P(0.5 * (p.y1 + p.y2) * (p.t2 - p.t1), 'm')).join(' + ')}`] : [],
    wrong: [{ v: maxY * tb, why: 'used one big rectangle' }, { v: area / 2, why: 'halved the whole area' }, { v: area * 2, why: 'forgot the ½ on a triangle' }, { v: maxY / tb, why: 'found a slope instead' }],
    figure, figureAlt: alt, needsFigure: true,
  });
  q.givens.pts = pts;
  return q;
}

/* ===================================================== unit 2: vectors */
const VEC_THINGS = [
  { what: 'A force', sym: 'F', unit: 'N', lo: 10, hi: 250 },
  { what: 'A velocity', sym: 'v', unit: 'm/s', lo: 5, hi: 90 },
  { what: 'A displacement', sym: 'd', unit: 'm', lo: 5, hi: 400 },
];
function genComponents(lvl) {
  const variant = pick(['x', 'y']);
  const th = pick(VEC_THINGS);
  const A = lvl === 1 ? 2 * ri(Math.ceil(th.lo / 2), Math.floor(th.hi / 2)) : ri(th.lo, th.hi);
  const theta = lvl === 1 ? pick([30, 60]) : ri(10, 80);
  if (theta === 45 && lvl > 1 && chance(0.5)) retry();
  const quad = lvl === 3 ? pick([['north of west', -1, 1], ['south of east', 1, -1], ['south of west', -1, -1], ['north of east', 1, 1]]) : ['above the horizontal', 1, 1];
  const [dirText, sx, sy] = quad;
  const G = gq('A', th.sym, A, th.unit, { note: 'magnitude' }), TH = gq('theta', 'θ', theta, 'deg', { note: dirText });
  const rad = (theta * Math.PI) / 180;
  const cx = sx * A * Math.cos(rad), cy = sy * A * Math.sin(rad);
  const comp = variant === 'x' ? cx : cy;
  const s = th.sym;
  const lab = { x: `${s}_{x}`, y: `${s}_{y}` };
  const axisWords = lvl === 3 ? 'Take east as +x and north as +y.' : '';
  const ask = variant === 'x' ? (lvl === 3 ? 'x-component' : 'horizontal (x) component') : (lvl === 3 ? 'y-component' : 'vertical (y) component');
  const trig = variant === 'x' ? 'cos' : 'sin';
  const sign = (variant === 'x' ? sx : sy) < 0;
  const altDir = lvl === 3 ? `${theta}° ${dirText}` : `${theta}° above the horizontal`;
  const figure = vecFig({
    theta, sx, sy, mag: `${s} = ${pretty(G.text)}`, xLabel: variant === 'x' ? `${lab.x} = ?` : lab.x, yLabel: variant === 'y' ? `${lab.y} = ?` : lab.y,
    axes: lvl === 3 ? [sx > 0 ? 'E' : 'W', sy > 0 ? 'N' : 'S'] : ['x', 'y'],
    alt: `An arrow labelled ${s} = ${G.text} points ${altDir}. Its ${variant === 'x' ? 'horizontal' : 'vertical'} component is drawn dashed and marked with a question mark.`,
  });
  return makeQ('components', lvl, {
    variant, prompt: `${th.what} of ${G.text} points ${altDir}. ${axisWords} What is its ${ask}?`.replace(/\s+/g, ' ').replace(' ?', '?'),
    givens: [G, TH], find: { sym: variant === 'x' ? lab.x : lab.y, name: ask }, value: comp, unit: th.unit, rule: { dp: 1 }, signed: sign,
    eq: [variant === 'x' ? `${lab.x} = ${s} cos θ` : `${lab.y} = ${s} sin θ`],
    sub: [`${variant === 'x' ? lab.x : lab.y} = ${sign ? '−' : ''}(${G.text})(${trig} ${theta}°)`],
    solve: [`${variant === 'x' ? lab.x : lab.y} = ${sign ? '−' : ''}(${G.text})(${ap(variant === 'x' ? Math.cos(rad) : Math.sin(rad))})`],
    notes: [
      variant === 'x' ? 'θ is measured from the horizontal, so the horizontal part uses cosine (the side next to the angle).' : 'θ is measured from the horizontal, so the vertical part uses sine (the side opposite the angle).',
      ...(sign ? [`The vector points ${variant === 'x' ? 'west' : 'south'}, so this component is negative.`] : []),
      'Check your calculator is in degree mode.',
    ],
    wrong: [
      { v: (variant === 'x' ? sx : sy) * A * (variant === 'x' ? Math.sin(rad) : Math.cos(rad)), why: 'swapped sine and cosine' },
      { v: (variant === 'x' ? sx : sy) * A * (variant === 'x' ? Math.cos(theta) : Math.sin(theta)), why: 'calculator in radian mode' },
      { v: (variant === 'x' ? sx : sy) * A / (variant === 'x' ? Math.cos(rad) : Math.sin(rad)), why: 'divided by the trig ratio' },
      ...(sign ? [{ v: -comp, why: 'lost the sign' }] : []),
    ],
    figure, figureAlt: `An arrow labelled ${s} = ${G.text} points ${altDir}. Its ${variant === 'x' ? 'horizontal' : 'vertical'} component is drawn dashed and marked with a question mark.`,
    uses: [], data: { sx, sy },
  });
}

const SQ = { m: 'm^2', N: 'N^2', 'm/s': 'm^2/s^2' };
const TRIPLES = [[3, 4], [6, 8], [5, 12], [8, 15], [9, 12], [7, 24], [12, 16], [15, 20], [20, 21], [12, 35], [9, 40], [10, 24]];
function genResultant(lvl) {
  const variant = pick(['mag', 'mag', 'angle']);
  const ctx = pick([
    { a: 'walks', unit: 'm', sym: 'd', say: (x, y, dx, dy) => `A hiker walks ${x} ${dx}, then ${y} ${dy}.`, what: 'displacement', mag: 'How far is the hiker from the starting point?' },
    { a: 'forces', unit: 'N', sym: 'F', say: (x, y, dx, dy) => `Two forces act on a crate at right angles: ${x} ${dx} and ${y} ${dy}.`, what: 'net force', mag: 'What is the size of the net force?' },
    { a: 'plane', unit: 'm/s', sym: 'v', say: (x, y, dx, dy) => `A drone flies ${dx} at ${x} relative to the air while a wind blows ${dy} at ${y}.`, what: 'velocity relative to the ground', mag: 'What is its speed relative to the ground?' },
  ]);
  let a, b;
  if (lvl === 1) { const [p, q] = pick(TRIPLES); const k = pick([1, 1, 2, 3, 5, 10]); [a, b] = chance(0.5) ? [p * k, q * k] : [q * k, p * k]; } else { a = ri(2, 80); b = ri(2, 80); if (a === b) retry(); }
  if (ctx.a === 'plane' && a < b) [a, b] = [b, a];
  const [dx, dy, sx, sy] = lvl === 3 ? pick([['west', 'south', -1, -1], ['west', 'north', -1, 1], ['east', 'south', 1, -1], ['east', 'north', 1, 1]]) : ['east', 'north', 1, 1];
  const A = gq('a', 'A', a, ctx.unit, { note: dx }), B = gq('b', 'B', b, ctx.unit, { note: dy });
  const R = Math.sqrt(a * a + b * b);
  const th = (Math.atan(b / a) * 180) / Math.PI;
  const say = ctx.say(A.text, B.text, dx, dy);
  const alt = `The first vector points ${dx} (${A.text}); the second starts at its tip and points ${dy} (${B.text}). A dashed resultant runs from the start to the finish${variant === 'angle' ? ', with the angle θ between it and the first vector marked with a question mark' : ', its length marked with a question mark'}.`;
  const figure = resFig({ a, b, sx, sy, aLabel: A.text, bLabel: B.text, rLabel: variant === 'mag' ? 'R = ?' : 'R', thLabel: variant === 'angle' ? 'θ = ?' : 'θ', axes: `${dy === 'north' ? 'N ↑' : 'S ↓'}   ${dx === 'east' ? 'E →' : 'W ←'}`, alt });
  if (variant === 'mag') {
    return makeQ('resultant', lvl, {
      variant, prompt: `${say} ${ctx.mag}`,
      givens: [A, B], find: { sym: 'R', name: `size of the ${ctx.what}` }, value: R, unit: ctx.unit, rule: { dp: 1 },
      eq: ['The vectors are at right angles, so use the Pythagorean theorem:', 'R = √[[A^2 + B^2]]'],
      sub: [`R = √[[${gtext(A)}^2 + ${gtext(B)}^2]]`], solve: [`R = √[[${fmt(a * a)} ${SQ[ctx.unit]} + ${fmt(b * b)} ${SQ[ctx.unit]}]]`, `R = √[[${fmt(a * a + b * b)} ${SQ[ctx.unit]}]]`],
      wrong: [{ v: a + b, why: 'added the sizes' }, { v: a * a + b * b, why: 'forgot the square root' }, { v: Math.abs(a - b), why: 'subtracted' }, { v: Math.sqrt(Math.abs(a * a - b * b)), why: 'subtracted the squares' }],
      figure, figureAlt: alt,
    });
  }
  const ref = `${dy} of ${dx}`;
  const same = [ref, `${dy[0]} of ${dx[0]}`, `${dy[0]}${dx[0]}`, `from ${dx}`, `from the ${dx}`, `${dy} from ${dx}`, `from ${dx} toward ${dy}`, `from ${dx} towards ${dy}`];
  return makeQ('resultant', lvl, {
    variant, prompt: `${say} What is the direction of the ${ctx.what}, as an angle ${ref}?`,
    givens: [A, B], find: { sym: 'θ', name: `angle ${ref}` }, value: th, unit: 'deg', rule: { dp: 1 }, dirs: { same },
    eq: ['In the right triangle, B is opposite θ and A is next to it:', 'θ = tan^-1([[B || A]])'],
    sub: [`θ = tan^-1([[${B.text} || ${A.text}]])`], solve: [`θ = tan^-1(${ap(b / a)})`],
    notes: ['Check your calculator is in degree mode.'],
    wrong: [{ v: 90 - th, why: 'measured from the other vector' }, { v: Math.atan(b / a), why: 'calculator in radian mode' }, { v: (Math.asin(Math.min(1, b / (a + b))) * 180) / Math.PI, why: 'added the sides instead of using Pythagoras' }],
    figure, figureAlt: alt,
  });
}

function genProjectile(lvl) {
  const variant = pick(lvl === 1 ? ['t', 'range'] : lvl === 2 ? ['t', 'range', 'vy'] : ['range', 'vy', 'v0']);
  const scene = pick([
    { s: (v, h) => `A marble rolls off a table ${h} high at ${v}.`, lo: 1, hi: 4, hLo: 0.6, hHi: 1.5, hdp: 2 },
    { s: (v, h) => `A stone is thrown horizontally at ${v} from the top of a cliff ${h} high.`, lo: 4, hi: 25, hLo: 10, hHi: 120, hdp: 0 },
    { s: (v, h) => `A ball is kicked horizontally at ${v} off a ledge ${h} high.`, lo: 3, hi: 18, hLo: 3, hHi: 40, hdp: 0 },
    { s: (v, h) => `A skier leaves a horizontal jump at ${v}, ${h} above the snow below.`, lo: 8, hi: 30, hLo: 2, hHi: 15, hdp: 1 },
  ]);
  const h = dec(scene.hLo, scene.hHi, lvl === 1 ? Math.min(scene.hdp, 1) : scene.hdp);
  const v0 = lvl === 3 ? dec(scene.lo, scene.hi, 1) : ri(scene.lo, scene.hi);
  const H = gq('h', 'h', h, 'm', { note: 'height' }), V0 = gq('v0', 'v₀', v0, 'm/s', { note: 'horizontal launch speed' });
  const g = G_GIVEN();
  const t = Math.sqrt((2 * h) / GRAV);
  const tail = ` Ignore air resistance. ${G_NOTE}`;
  const tLine = `t = √[[[[2h || g]]]] = √[[[[2(${H.text}) || 9.8 m/s²]]]] = ${ap(t)} s`;
  const tips = ['The horizontal and vertical motions are independent: the fall sets the time, then the horizontal speed stays constant.'];
  if (variant === 't') {
    const f = projFig({ hText: `h = ${H.text}`, vText: `v₀ = ${V0.text}`, xText: '', ask: 'The time it is in the air is asked for.' });
    return makeQ('projectile', lvl, {
      variant, prompt: `${scene.s(V0.text, H.text)} How long is it in the air?${tail}`,
      givens: [V0, H, g], find: { sym: 't', name: 'time in the air' }, value: t, unit: 's', rule: { dp: 2 }, uses: ['g'],
      eq: ['It starts with no vertical velocity, so vertically h = ½gt^2', 't = √[[[[2h || g]]]]'], sub: [`t = √[[[[2(${H.text}) || 9.8 m/s²]]]]`], solve: [`t = √[[${ap((2 * h) / GRAV)} s^2]]`],
      notes: ['The horizontal speed does not change how long it takes to fall.'], tips,
      wrong: [{ v: Math.sqrt(h / GRAV), why: 'forgot the 2' }, { v: (2 * h) / GRAV, why: 'forgot the square root' }, { v: h / v0, why: 'divided the height by the speed' }, { v: Math.sqrt(h / 5), why: 'used g = 10' }],
      figure: f.figure, figureAlt: f.alt, nts: true,
    });
  }
  if (variant === 'range') {
    const f = projFig({ hText: `h = ${H.text}`, vText: `v₀ = ${V0.text}`, xText: 'x = ?', ask: 'The horizontal distance x from the base to where it lands is marked with a question mark.' });
    return makeQ('projectile', lvl, {
      variant, prompt: `${scene.s(V0.text, H.text)} How far from the base does it land?${tail}`,
      givens: [V0, H, g], find: { sym: 'x', name: 'horizontal distance' }, value: v0 * t, unit: 'm', rule: { dp: 2 }, uses: ['g'],
      eq: ['time to fall: t = √[[[[2h || g]]]]', 'horizontal distance: x = v₀t'], sub: [tLine, `x = ${gtext(V0)}(${ap(t)} s)`],
      notes: ['Keep the unrounded time for the second step.'], tips,
      wrong: [{ v: v0 * Math.sqrt(h / GRAV), why: 'forgot the 2' }, { v: (v0 * 2 * h) / GRAV, why: 'forgot the square root' }, { v: v0 * Math.sqrt(h / 5), why: 'used g = 10' }, { v: t, why: 'stopped at the time' }],
      figure: f.figure, figureAlt: f.alt, nts: true,
    });
  }
  if (variant === 'vy') {
    const f = projFig({ hText: `h = ${H.text}`, vText: `v₀ = ${V0.text}`, xText: '', ask: 'Its vertical speed as it reaches the ground is asked for.' });
    return makeQ('projectile', lvl, {
      variant, prompt: `${scene.s(V0.text, H.text)} What is the vertical part of its velocity just before it lands? Give its size.${tail}`,
      givens: [V0, H, g], find: { sym: 'v_{y}', name: 'vertical speed at landing' }, value: Math.sqrt(2 * GRAV * h), unit: 'm/s', rule: { dp: 2 }, uses: ['g'],
      eq: ['Vertically it falls from rest: v_{y}^2 = 2gh', 'v_{y} = √[[2gh]]'], sub: [`v_{y} = √[[2(9.8 m/s²)(${H.text})]]`], solve: [`v_{y} = √[[${ap(2 * GRAV * h)} m^2/s^2]]`],
      notes: ['The horizontal speed does not affect the vertical motion.'], tips,
      wrong: [{ v: Math.sqrt(v0 * v0 + 2 * GRAV * h), why: 'found the total speed' }, { v: v0, why: 'gave the horizontal speed' }, { v: Math.sqrt(GRAV * h), why: 'forgot the 2' }, { v: Math.sqrt(20 * h), why: 'used g = 10' }],
      figure: f.figure, figureAlt: f.alt, nts: true,
    });
  }
  const x = clean(Math.round(v0 * t * 10) / 10);
  const X = gq('x', 'x', x, 'm', { note: 'where it lands' });
  const f = projFig({ hText: `h = ${H.text}`, vText: 'v₀ = ?', xText: `x = ${X.text}`, ask: 'Its launch speed is marked with a question mark.' });
  return makeQ('projectile', lvl, {
    variant, prompt: `An object is launched horizontally from a height of ${H.text} and lands ${X.text} from the base. How fast was it launched?${tail}`,
    givens: [H, X, g], find: { sym: 'v₀', name: 'launch speed' }, value: x / t, unit: 'm/s', rule: { dp: 2 }, uses: ['g'],
    eq: ['time to fall: t = √[[[[2h || g]]]]', 'x = v₀t, so v₀ = [[x || t]]'], sub: [tLine, `v₀ = [[${X.text} || ${ap(t)} s]]`],
    notes: ['Keep the unrounded time for the second step.'], tips,
    wrong: [{ v: x * t, why: 'multiplied by the time' }, { v: x / Math.sqrt(h / GRAV), why: 'forgot the 2' }, { v: x / Math.sqrt(h / 5), why: 'used g = 10' }, { v: x / ((2 * h) / GRAV), why: 'forgot the square root' }],
    figure: f.figure, figureAlt: f.alt, nts: true,
  });
}

function genRelative(lvl) {
  const variant = pick(lvl === 1 ? ['down', 'up', 'walk_with', 'walk_against'] : lvl === 2 ? ['down', 'up', 'approach', 'same', 'walk_against'] : ['time_up', 'time_down', 'approach', 'same']);
  const dp = lvl === 1 ? 0 : 1;
  if (variant === 'down' || variant === 'up' || variant === 'time_up' || variant === 'time_down') {
    const c = dec(0.5, 4, dp), b = dec(c + 1, 12, dp);
    const Bv = gq('b', 'v_{boat}', b, 'm/s', { note: 'in still water' }), Cv = gq('c', 'v_{water}', c, 'm/s', { note: 'the current' });
    const down = variant === 'down' || variant === 'time_down';
    const rel = down ? b + c : b - c;
    if (variant === 'down' || variant === 'up') {
      return makeQ('relative', lvl, {
        variant, prompt: `A boat can move at ${Bv.text} in still water. It heads straight ${down ? 'downstream' : 'upstream'} in a river whose current flows at ${Cv.text}. How fast does the boat move relative to the riverbank?`,
        givens: [Bv, Cv], find: { sym: 'v', name: 'speed relative to the bank' }, value: rel, unit: 'm/s', rule: { dp: 1 },
        eq: [down ? 'Going with the current, the speeds add: v = v_{boat} + v_{water}' : 'Going against the current, it subtracts: v = v_{boat} − v_{water}'],
        sub: [`v = ${Bv.text} ${down ? '+' : '−'} ${Cv.text}`],
        wrong: [{ v: down ? b - c : b + c, why: 'added when it should subtract (or the reverse)' }, { v: b, why: 'ignored the current' }, { v: (b + c) / 2, why: 'averaged' }],
      });
    }
    const D = gq('d', 'd', ri(60, 900), 'm');
    return makeQ('relative', lvl, {
      variant, prompt: `A boat can move at ${Bv.text} in still water. How long does it take to travel ${D.text} ${down ? 'downstream' : 'upstream'} in a river with a ${Cv.text} current?`,
      givens: [Bv, Cv, D], find: { sym: 't', name: 'time' }, value: D.v / rel, unit: 's', rule: { dp: 1 },
      eq: [down ? 'speed relative to the bank: v = v_{boat} + v_{water}' : 'speed relative to the bank: v = v_{boat} − v_{water}', 't = [[d || v]]'],
      sub: [`v = ${Bv.text} ${down ? '+' : '−'} ${Cv.text} = ${P(rel, 'm/s')}`, `t = [[${D.text} || ${P(rel, 'm/s')}]]`],
      wrong: [{ v: D.v / (down ? b - c : b + c), why: 'used the wrong relative speed' }, { v: D.v / b, why: 'ignored the current' }, { v: D.v * rel, why: 'multiplied' }],
    });
  }
  if (variant === 'walk_with' || variant === 'walk_against') {
    const s = dec(0.5, 2, 1), w = dec(s + 0.3, 3, 1);
    const S = gq('s', 'v_{walkway}', s, 'm/s'), W = gq('w', 'v_{walk}', w, 'm/s', { note: 'relative to the walkway' });
    const withIt = variant === 'walk_with';
    return makeQ('relative', lvl, {
      variant, prompt: `An airport walkway moves at ${S.text}. A traveler walks ${withIt ? 'in the same direction as' : 'against the direction of'} the walkway at ${W.text} relative to it. What is the traveler's speed relative to the ground?`,
      givens: [S, W], find: { sym: 'v', name: 'speed relative to the ground' }, value: withIt ? w + s : w - s, unit: 'm/s', rule: { dp: 1 },
      eq: [withIt ? 'Same direction: v = v_{walk} + v_{walkway}' : 'Opposite directions: v = v_{walk} − v_{walkway}'], sub: [`v = ${W.text} ${withIt ? '+' : '−'} ${S.text}`],
      wrong: [{ v: withIt ? w - s : w + s, why: 'added when it should subtract (or the reverse)' }, { v: w, why: 'ignored the walkway' }, { v: w * s, why: 'multiplied' }],
    });
  }
  const v1 = dec(10, 35, dp), v2 = dec(5, v1 - 1, dp);
  const A = gq('v1', 'v_{A}', v1, 'm/s'), B2 = gq('v2', 'v_{B}', v2, 'm/s');
  if (variant === 'approach') {
    return makeQ('relative', lvl, {
      variant, prompt: `Two cars drive toward each other on a straight road, car A at ${A.text} and car B at ${B2.text}. How fast is car A moving relative to car B?`,
      givens: [A, B2], find: { sym: 'v_{AB}', name: 'relative speed' }, value: v1 + v2, unit: 'm/s', rule: { dp: 1 },
      eq: ['Moving toward each other, the speeds add: v_{AB} = v_{A} + v_{B}'], sub: [`v_{AB} = ${A.text} + ${B2.text}`],
      wrong: [{ v: v1 - v2, why: 'subtracted' }, { v: v1, why: 'gave car A\'s own speed' }, { v: (v1 + v2) / 2, why: 'averaged' }],
    });
  }
  return makeQ('relative', lvl, {
    variant, prompt: `Car A at ${A.text} overtakes car B, which is going the same way at ${B2.text}. How fast is car A moving relative to car B?`,
    givens: [A, B2], find: { sym: 'v_{AB}', name: 'relative speed' }, value: v1 - v2, unit: 'm/s', rule: { dp: 1 },
    eq: ['Same direction, so subtract: v_{AB} = v_{A} − v_{B}'], sub: [`v_{AB} = ${A.text} − ${B2.text}`],
    wrong: [{ v: v1 + v2, why: 'added' }, { v: v1, why: 'gave car A\'s own speed' }, { v: v2 - v1, why: 'subtracted the wrong way round' }],
  });
}

/* ====================================================== unit 3: forces */
const OBJECTS = [
  { n: 'cart', lo: 2, hi: 40 }, { n: 'crate', lo: 10, hi: 120 }, { n: 'sled', lo: 5, hi: 60 }, { n: 'shopping cart', lo: 8, hi: 40 },
  { n: 'bowling ball', lo: 4, hi: 7 }, { n: 'motor scooter', lo: 60, hi: 150 }, { n: 'box', lo: 2, hi: 50 },
];
const SMALL = [{ n: 'hockey puck', lo: 150, hi: 180 }, { n: 'tennis ball', lo: 55, hi: 60 }, { n: 'toy car', lo: 80, hi: 400 }, { n: 'baseball', lo: 140, hi: 150 }, { n: 'soccer ball', lo: 400, hi: 450 }];
function massGiven(lvl) {
  if (lvl === 3 && chance(0.6)) {
    const o = pick(SMALL);
    const g = ri(o.lo, o.hi);
    return { obj: o.n, M: gq('m', 'm', g / 1000, 'kg', { text: `${g} g`, line: `m = ${g} g = ${fmt(g / 1000)} kg`, note: 'mass in kilograms' }), grams: g };
  }
  const o = pick(OBJECTS);
  const m = lvl === 1 ? ri(o.lo, o.hi) : dec(o.lo, o.hi, 1);
  return { obj: o.n, M: gq('m', 'm', m, 'kg') };
}
function genFma(lvl) {
  const variant = pick(['F', 'a', 'm']);
  const { obj, M, grams } = massGiven(lvl);
  const m = M.v;
  const gramsTip = grams ? ['Change grams to kilograms first: divide by 1,000.'] : [];
  if (variant === 'F') {
    const a = lvl === 1 ? ri(1, 9) : dec(0.2, 9.9, 1);
    const A = gq('a', 'a', a, 'm/s2');
    return makeQ('fma', lvl, {
      variant, prompt: `What net force is needed to give a ${M.text} ${obj} an acceleration of ${A.text}?`,
      givens: [M, A], find: { sym: 'F', name: 'net force' }, value: m * a, unit: 'N', rule: { sf: 3 },
      eq: ['F = ma'], sub: [`F = (${fmt(m)} kg)(${A.text})`], notes: gramsTip, tips: gramsTip,
      wrong: [{ v: m / a, why: 'divided m by a' }, { v: a / m, why: 'divided a by m' }, { v: m + a, why: 'added' }, ...(grams ? [{ v: grams * a, why: 'left the mass in grams' }] : [])],
    });
  }
  if (variant === 'a') {
    // warm-up: a whole-number answer; after that, a round force and a rounded answer
    const F = lvl === 1 ? clean(m * ri(1, 9)) : grams ? dec(0.2, 12, 1) : ri(Math.max(2, Math.round(m * 0.3)), Math.round(m * 9));
    const Fg = gq('F', 'F', F, 'N', { note: 'net force' });
    return makeQ('fma', lvl, {
      variant, prompt: `A net force of ${Fg.text} acts on a ${M.text} ${obj}. What is its acceleration?`,
      givens: [Fg, M], find: { sym: 'a', name: 'acceleration' }, value: F / m, unit: 'm/s2', rule: { sf: 3 },
      eq: ['F = ma', 'a = [[F || m]]'], sub: [`a = [[${Fg.text} || ${fmt(m)} kg]]`], notes: gramsTip, tips: gramsTip,
      wrong: [{ v: F * m, why: 'multiplied' }, { v: m / F, why: 'divided m by F' }, { v: F - m, why: 'subtracted' }, ...(grams ? [{ v: F / grams, why: 'left the mass in grams' }] : [])],
    });
  }
  const a = lvl === 1 ? ri(1, 9) : dec(0.2, 9.9, 1);
  const F = lvl === 1 ? clean(ri(2, 60) * a) : ri(5, 900);
  const A = gq('a', 'a', a, 'm/s2'), Fg = gq('F', 'F', F, 'N', { note: 'net force' });
  return makeQ('fma', lvl, {
    variant, prompt: `A net force of ${Fg.text} gives a ${obj} an acceleration of ${A.text}. What is its mass?`,
    givens: [Fg, A], find: { sym: 'm', name: 'mass' }, value: F / a, unit: 'kg', rule: { sf: 3 },
    eq: ['F = ma', 'm = [[F || a]]'], sub: [`m = [[${Fg.text} || ${A.text}]]`],
    wrong: [{ v: F * a, why: 'multiplied' }, { v: a / F, why: 'divided a by F' }, { v: F - a, why: 'subtracted' }],
  });
}

const PLANETS = [{ n: 'the Moon', g: 1.62 }, { n: 'Mars', g: 3.71 }, { n: 'Jupiter', g: 24.8 }, { n: 'Mercury', g: 3.7 }];
const WEIGHED = [
  { n: 'a student', lo: 40, hi: 90 }, { n: 'a backpack', lo: 3, hi: 12 }, { n: 'a dog', lo: 5, hi: 45 }, { n: 'a bicycle', lo: 8, hi: 18 },
  { n: 'a suitcase', lo: 8, hi: 30 }, { n: 'a watermelon', lo: 3, hi: 12 }, { n: 'a motorcycle', lo: 150, hi: 300 }, { n: 'a car', lo: 900, hi: 2000 },
];
function genWeight(lvl) {
  const variant = pick(lvl === 1 ? ['W', 'W', 'm'] : lvl === 2 ? ['W', 'm'] : ['other', 'other', 'm']);
  const g = G_GIVEN();
  const o = pick(WEIGHED);
  if (variant === 'W') {
    const m = lvl === 1 || o.lo >= 100 ? ri(o.lo, o.hi) : dec(o.lo, o.hi, 1);
    const M = gq('m', 'm', m, 'kg');
    return makeQ('weight', lvl, {
      variant, prompt: `What is the weight of ${o.n} with a mass of ${M.text}? ${G_NOTE}`,
      givens: [M, g], find: { sym: 'W', name: 'weight' }, value: m * GRAV, unit: 'N', rule: { dp: 1 }, uses: ['g'],
      eq: ['W = mg'], sub: [`W = (${M.text})(9.8 m/s²)`],
      wrong: [{ v: m / GRAV, why: 'divided by g' }, { v: m, why: 'gave the mass, not the weight' }, { v: m * 10, why: 'used g = 10' }],
    });
  }
  if (variant === 'm') {
    const lo = Math.ceil(o.lo * GRAV), hi = Math.floor(o.hi * GRAV);
    const W = lvl === 1 ? 10 * ri(Math.ceil(lo / 10), Math.floor(hi / 10)) : ri(lo, hi);
    const Wg = gq('W', 'W', W, 'N');
    return makeQ('weight', lvl, {
      variant, prompt: `${cap(o.n)} weighs ${Wg.text} on Earth. What is its mass? ${G_NOTE}`,
      givens: [Wg, g], find: { sym: 'm', name: 'mass' }, value: W / GRAV, unit: 'kg', rule: { dp: 1 }, uses: ['g'],
      eq: ['W = mg', 'm = [[W || g]]'], sub: [`m = [[${Wg.text} || 9.8 m/s²]]`],
      wrong: [{ v: W * GRAV, why: 'multiplied by g' }, { v: W, why: 'gave the weight, not the mass' }, { v: W / 10, why: 'used g = 10' }],
    });
  }
  const pl = pick(PLANETS);
  const m = ri(45, 110);
  const WE = gq('WE', 'W_{Earth}', clean(m * GRAV), 'N'), GP = gq('gp', `g_{${pl.n.replace('the ', '')}}`, pl.g, 'm/s2', { k: true });
  return makeQ('weight', lvl, {
    variant, prompt: `An astronaut weighs ${WE.text} on Earth. What does she weigh on ${pl.n}, where g = ${GP.text}? On Earth, use g = 9.8 m/s².`,
    givens: [WE, g, GP], find: { sym: 'W', name: `weight on ${pl.n}` }, value: (WE.v / GRAV) * pl.g, unit: 'N', rule: { dp: 1 }, uses: ['g'],
    eq: ['Her mass is the same everywhere: m = [[W_{Earth} || g_{Earth}]]', `W = mg_{${pl.n.replace('the ', '')}}`],
    sub: [`m = [[${WE.text} || 9.8 m/s²]] = ${P(m, 'kg')}`, `W = (${P(m, 'kg')})(${GP.text})`],
    notes: ['Mass does not change from planet to planet; weight does.'],
    wrong: [{ v: m * GRAV * pl.g, why: 'multiplied the weight by the new g' }, { v: m * GRAV, why: 'said the weight stays the same' }, { v: (m * GRAV) / pl.g, why: 'divided the weight by the new g' }],
  });
}

function genNetforce(lvl) {
  const variant = pick(lvl === 1 ? ['two'] : lvl === 2 ? ['two', 'three', 'vert'] : ['three', 'vert', 'accel']);
  if (variant === 'vert') {
    const m = ri(20, 400), extra = ri(-120, 300);
    const T = clean(Math.round(m * GRAV + extra));
    if (Math.abs(T - m * GRAV) < 5) retry();
    const M = gq('m', 'm', m, 'kg'), Tg = gq('T', 'T', T, 'N', { note: 'cable tension, up' }), g = G_GIVEN();
    const net = T - m * GRAV;
    return makeQ('netforce', lvl, {
      variant, prompt: `A crane ${net > 0 ? 'lifts' : 'lowers'} a ${M.text} crate on a cable. The tension in the cable is ${Tg.text}. What is the net force on the crate? Take up as positive. ${G_NOTE}`,
      givens: [M, Tg, g], find: { sym: 'F_{net}', name: 'net force' }, value: net, unit: 'N', rule: { dp: 1 }, signed: true, dirs: UD, uses: ['g'],
      eq: ['Weight: W = mg (down)', 'F_{net} = T − W'], sub: [`W = (${M.text})(9.8 m/s²) = ${P(m * GRAV, 'N')}`, `F_{net} = ${Tg.text} − ${P(m * GRAV, 'N')}`],
      notes: [net > 0 ? 'Positive: the net force points up — the cable pulls harder than gravity.' : 'Negative: the net force points down even though the cable pulls up — gravity wins.'],
      wrong: [{ v: T + m * GRAV, why: 'added the weight' }, { v: T - m, why: 'used the mass as the weight' }, { v: m * GRAV - T, why: 'sign flipped' }, { v: T - m * 10, why: 'used g = 10' }],
    });
  }
  const n = variant === 'two' ? 2 : 3;
  const dirs = variant === 'two' ? shuffle(['right', 'left']) : shuffle(pick([['right', 'right', 'left'], ['left', 'left', 'right']]));
  const mags = Array.from({ length: n }, () => (lvl === 1 ? 10 * ri(2, 60) : ri(5, 500)));
  const signed = mags.map((f, k) => (dirs[k] === 'right' ? f : -f));
  const net = signed.reduce((s, x) => s + x, 0);
  if (!net || mags.includes(Math.abs(net))) retry();
  const Fs = mags.map((f, k) => gq(`F${k + 1}`, `F_{${k + 1}}`, signed[k], 'N', { text: `${f} N`, line: `F_{${k + 1}} = ${pretty(String(signed[k]))} N`, note: dirs[k] }));
  const list = Fs.map((F, k) => `${F.text} to the ${dirs[k]}`);
  const listText = n === 2 ? `${list[0]} and ${list[1]}` : `${list[0]}, ${list[1]} and ${list[2]}`;
  const sumLine = `F_{net} = ${signed.map((x, k) => (k ? (x < 0 ? ` − ${-x} N` : ` + ${x} N`) : `${pretty(String(x))} N`)).join('')}`;
  const wrongs = [{ v: mags.reduce((s, x) => s + x, 0), why: 'added the sizes, ignoring direction' }, { v: -net, why: 'sign flipped' }, { v: mags[0] - mags[1], why: 'left one force out' }];
  if (variant === 'accel') {
    const m = ri(20, 150);
    const M = gq('m', 'm', m, 'kg');
    return makeQ('netforce', lvl, {
      variant, prompt: `Forces of ${listText} act on a ${M.text} cart. What is the cart's acceleration? Take right as positive.`,
      givens: [...Fs, M], find: { sym: 'a', name: 'acceleration' }, value: net / m, unit: 'm/s2', rule: { dp: 2 }, signed: true, dirs: RL,
      eq: ['F_{net} = F₁ + F₂ + F₃ (left is negative)', 'a = [[F_{net} || m]]'], sub: [`${sumLine} = ${P(net, 'N')}`, `a = [[${P(net, 'N')} || ${M.text}]]`],
      wrong: [{ v: mags.reduce((s, x) => s + x, 0) / m, why: 'added the sizes, ignoring direction' }, { v: -net / m, why: 'sign flipped' }, { v: net * m, why: 'multiplied by the mass' }],
    });
  }
  const scene = variant === 'two' ? `In a tug-of-war, one team pulls the rope with ${Fs[0].text} to the ${dirs[0]} and the other with ${Fs[1].text} to the ${dirs[1]}. What is the net force on the rope?` : `Three forces act on a box along a straight line: ${listText}. What is the net force on the box?`;
  return makeQ('netforce', lvl, {
    variant, prompt: `${scene} Take right as positive.`,
    givens: Fs, find: { sym: 'F_{net}', name: 'net force' }, value: net, unit: 'N', rule: { dp: 1 }, signed: true, dirs: RL,
    eq: ['Add the forces with signs: right is +, left is −', `F_{net} = ${Fs.map((F) => F.sym).join(' + ')}`], sub: [sumLine],
    notes: [net > 0 ? 'Positive, so the net force points right.' : 'Negative, so the net force points left.'],
    wrong: wrongs,
  });
}

function genFriction(lvl) {
  const variant = pick(lvl === 1 ? ['f_N', 'mu'] : lvl === 2 ? ['f_m', 'mu', 'f_m'] : ['accel', 'accel', 'f_m']);
  const mu = dec(0.1, 0.8, 2);
  const MU = gq('mu', 'μ', mu, '', { note: 'coefficient of kinetic friction' });
  const [obj, mLo, mHi] = pick([['crate', 10, 120], ['box', 5, 60], ['sled', 5, 40], ['couch', 30, 90], ['filing cabinet', 20, 80]]);
  if (variant === 'f_N') {
    const N = 10 * ri(2, 80);
    const Ng = gq('N', 'N', N, 'N', { note: 'normal force' });
    return makeQ('friction', lvl, {
      variant, prompt: `A ${obj} slides across a floor. The normal force on it is ${Ng.text} and the coefficient of kinetic friction is ${mu}. What is the friction force?`,
      givens: [Ng, MU], find: { sym: 'f', name: 'friction force' }, value: mu * N, unit: 'N', rule: { dp: 1 },
      eq: ['f = μN'], sub: [`f = (${mu})(${Ng.text})`],
      wrong: [{ v: N / mu, why: 'divided by μ' }, { v: N - mu, why: 'subtracted' }, { v: mu * N * GRAV, why: 'multiplied by g as well' }],
    });
  }
  if (variant === 'mu') {
    const N = 10 * ri(3, 80), f = clean(Math.round(N * dec(0.1, 0.8, 2)));
    const Ng = gq('N', 'N', N, 'N', { note: 'normal force' }), Fg = gq('f', 'f', f, 'N', { note: 'friction force' });
    return makeQ('friction', lvl, {
      variant, prompt: `It takes a friction force of ${Fg.text} to oppose a ${obj} sliding across a floor, where the normal force is ${Ng.text}. What is the coefficient of kinetic friction? (It has no unit.)`,
      givens: [Fg, Ng], find: { sym: 'μ', name: 'coefficient of friction' }, value: f / N, unit: '', rule: { dp: 2 },
      eq: ['f = μN', 'μ = [[f || N]]'], sub: [`μ = [[${Fg.text} || ${Ng.text}]]`],
      notes: ['The newtons cancel: μ has no unit.'],
      wrong: [{ v: N / f, why: 'divided the wrong way round' }, { v: f * N, why: 'multiplied' }, { v: f / N / GRAV, why: 'divided by g as well' }],
    });
  }
  const m = ri(mLo, mHi);
  const M = gq('m', 'm', m, 'kg'), g = G_GIVEN();
  const N = m * GRAV;
  if (variant === 'f_m') {
    const f = fbdFig([{ dir: 'up', label: 'N' , say: 'the normal force N' }, { dir: 'down', label: 'W = mg', say: 'the weight W = mg' }, { dir: 'left', label: 'f = ?', say: 'friction f, marked with a question mark,' }, { dir: 'right', label: 'motion →', say: 'the motion', verb: 'is' }], { floor: true, obj, alt: `The ${obj} has mass ${M.text} and μ = ${mu}.` });
    return makeQ('friction', lvl, {
      variant, prompt: `A ${M.text} ${obj} slides across a level floor. The coefficient of kinetic friction is ${mu}. What is the friction force on it? ${G_NOTE}`,
      givens: [M, MU, g], find: { sym: 'f', name: 'friction force' }, value: mu * N, unit: 'N', rule: { dp: 1 }, uses: ['g'],
      eq: ['On a level floor the normal force equals the weight: N = mg', 'f = μN = μmg'], sub: [`N = (${M.text})(9.8 m/s²) = ${P(N, 'N')}`, `f = (${mu})(${P(N, 'N')})`],
      wrong: [{ v: mu * m, why: 'forgot g — used the mass as the normal force' }, { v: mu * m * 10, why: 'used g = 10' }, { v: N / mu, why: 'divided by μ' }, { v: N, why: 'gave the normal force' }],
      figure: f.figure, figureAlt: f.alt, nts: true,
    });
  }
  const fr = mu * N;
  const F = Math.round(fr + dec(Math.max(5, fr * 0.1), Math.max(20, fr * 1.2), 0));
  const Fg = gq('F', 'F', F, 'N', { note: 'horizontal pull' });
  const net = F - fr;
  const f = fbdFig([{ dir: 'up', label: 'N', say: 'the normal force N' }, { dir: 'down', label: 'W = mg', say: 'the weight W = mg' }, { dir: 'left', label: 'f = μN', say: 'friction f = μN' }, { dir: 'right', label: `F = ${Fg.text}`, say: `the pull F = ${Fg.text}` }], { floor: true, obj, alt: `The ${obj} has mass ${M.text} and μ = ${mu}.` });
  return makeQ('friction', lvl, {
    variant, prompt: `A ${M.text} ${obj} is pulled across a level floor by a horizontal force of ${Fg.text}. The coefficient of kinetic friction is ${mu}. What is its acceleration? ${G_NOTE}`,
    givens: [M, Fg, MU, g], find: { sym: 'a', name: 'acceleration' }, value: net / m, unit: 'm/s2', rule: { dp: 2 }, uses: ['g'],
    eq: ['N = mg, f = μN', 'F_{net} = F − f', 'a = [[F_{net} || m]]'],
    sub: [`f = (${mu})(${M.text})(9.8 m/s²) = ${ap(fr)} N`, `F_{net} = ${Fg.text} − ${ap(fr)} N = ${ap(net)} N`, `a = [[${ap(net)} N || ${M.text}]]`],
    notes: ['Friction acts against the motion, so it is subtracted from the pull.'],
    wrong: [{ v: F / m, why: 'ignored friction' }, { v: (F + fr) / m, why: 'added friction' }, { v: (F - mu * m) / m, why: 'forgot g in the normal force' }, { v: (F - mu * m * 10) / m, why: 'used g = 10' }],
    figure: f.figure, figureAlt: f.alt, nts: true,
  });
}

/* Free-body diagrams: multiple choice with the diagram. */
function dirWord(d) { return { right: 'to the right', left: 'to the left', up: 'upward', down: 'downward' }[d]; }
function genFbd(lvl) {
  const variant = pick(lvl === 1 ? ['net', 'balanced'] : lvl === 2 ? ['net', 'accel', 'balanced'] : ['accel', 'vert', 'net']);
  const m = ri(2, 20);
  const W = clean(m * GRAV);
  let forces, correct, options, prompt, eq, sub, hintSub, find, unitSym, explainNet;
  const opt = (mag, u, d) => `${fmt(mag)} ${u}${d ? ` ${dirWord(d)}` : ''}`;
  const r2 = (x) => { const y = settle(x, { dp: 2 }, false); return y ? y.num : clean(Math.round(x * 100) / 100); };
  if (variant === 'vert') {
    const T = Math.round(W + (chance(0.5) ? 1 : -1) * ri(5, 60));
    const net = T - W;
    if (Math.abs(net) < 1) retry();
    forces = { up: T, down: W, left: 0, right: 0 };
    const d = net > 0 ? 'up' : 'down';
    const s = settle(Math.abs(net) / m, { dp: 2 }, false);
    if (!s) retry();
    correct = { mag: s.num, dir: d, unit: 'm/s2', rounded: !s.exact };
    options = [opt(s.num, 'm/s²', d), opt(s.num, 'm/s²', d === 'up' ? 'down' : 'up'), opt(r2(T / m), 'm/s²', 'up'), opt(r2((T + W) / m), 'm/s²', 'up')];
    prompt = `A ${m} kg bucket hangs from a rope. The diagram shows the forces on it (W = mg with g = 9.8 m/s²). What is the bucket's acceleration?${s.exact ? '' : ' Round to 2 decimal places.'}`;
    find = { sym: 'a', name: 'acceleration' };
    eq = ['F_{net} = T − W (up is +)', 'a = [[F_{net} || m]]'];
    sub = [`F_{net} = ${T} N − ${fmt(W)} N = ${pretty(fmt(net))} N`, `a = [[${pretty(fmt(net))} N || ${m} kg]]`];
    hintSub = [`F_{net} = ${T} N − ${fmt(W)} N`, 'a = [[F_{net} || m]]'];
    unitSym = 'm/s²';
    const f = fbdFig([{ dir: 'up', label: `T = ${T} N`, say: `tension T = ${T} N` }, { dir: 'down', label: `W = ${fmt(W)} N`, say: `weight W = ${fmt(W)} N` }], { obj: 'bucket hanging from a rope', alt: `The bucket's mass is ${m} kg.` });
    return finishFbd(f, 'vert');
  }
  const Fa = lvl === 1 ? 5 * ri(4, 30) : ri(12, 150);
  let fr = lvl === 1 ? 5 * ri(1, Math.floor(Fa / 5) - 1) : ri(3, Fa - 5);
  if (variant === 'balanced') fr = Fa;
  const leftFirst = variant !== 'balanced' && chance(0.3);
  const right = leftFirst ? fr : Fa, left = leftFirst ? Fa : fr;
  forces = { up: W, down: W, right, left };
  const net = right - left;
  if (variant !== 'balanced' && (net === 0 || Math.abs(net) === right || Math.abs(net) === left)) retry();
  const push = leftFirst ? 'left' : 'right', back = leftFirst ? 'right' : 'left';
  const figForces = [
    { dir: 'up', label: `N = ${fmt(W)} N`, say: `the normal force N = ${fmt(W)} N` },
    { dir: 'down', label: `W = ${fmt(W)} N`, say: `the weight W = ${fmt(W)} N` },
    { dir: push, label: `F = ${Fa} N`, say: `the applied force F = ${Fa} N` },
    { dir: back, label: variant === 'balanced' ? 'f = ?' : `f = ${fr} N`, say: variant === 'balanced' ? 'friction f, of unknown size,' : `friction f = ${fr} N` },
  ];
  const f = fbdFig(figForces, { alt: variant === 'balanced' ? 'The box slides at a constant velocity.' : '' });
  if (variant === 'balanced') {
    correct = { mag: Fa, dir: back, unit: 'N' };
    prompt = 'The box slides across the floor at a constant velocity. How big is the friction force f?';
    options = [`${Fa} N`, '0 N', `${fmt(W)} N`, `${Fa - ri(3, Math.min(15, Fa - 1))} N`];
    find = { sym: 'f', name: 'friction force' };
    eq = ['Constant velocity means a = 0, so F_{net} = 0', 'Horizontally: F − f = 0, so f = F'];
    sub = [`f = ${Fa} N`];
    hintSub = ['f = F, the applied force shown in the diagram'];
    unitSym = 'N';
    explainNet = 'Balanced forces: the push and friction cancel. Nothing is needed to "keep it going" once friction is matched.';
    return finishFbd(f, 'balanced');
  }
  const d = net > 0 ? 'right' : 'left';
  if (variant === 'net') {
    correct = { mag: Math.abs(net), dir: d, unit: 'N' };
    prompt = 'The diagram shows every force on a box sliding across the floor. What is the net force on the box?';
    options = [opt(Math.abs(net), 'N', d), opt(Math.abs(net), 'N', d === 'right' ? 'left' : 'right'), opt(Fa + fr, 'N', push), opt(Fa, 'N', push)];
    find = { sym: 'F_{net}', name: 'net force' };
    eq = ['Up and down cancel: N = W', 'Sideways: F_{net} = F − f (in the direction of the bigger force)'];
    sub = [`F_{net} = ${Fa} N − ${fr} N = ${Math.abs(net)} N`];
    hintSub = [`F_{net} = ${Fa} N − ${fr} N`, 'then decide which way it points'];
    unitSym = 'N';
    return finishFbd(f, 'net');
  }
  const s = settle(Math.abs(net) / m, { dp: 2 }, false);
  if (!s) retry();
  correct = { mag: s.num, dir: d, unit: 'm/s2', rounded: !s.exact };
  prompt = `The box has a mass of ${m} kg. The diagram shows every force on it. What is its acceleration?${s.exact ? '' : ' Round to 2 decimal places.'}`;
  options = [opt(s.num, 'm/s²', d), opt(r2(Fa / m), 'm/s²', push), opt(r2((Fa + fr) / m), 'm/s²', push), opt(s.num, 'm/s²', d === 'right' ? 'left' : 'right')];
  find = { sym: 'a', name: 'acceleration' };
  eq = ['Up and down cancel: N = W', 'F_{net} = F − f', 'a = [[F_{net} || m]]'];
  sub = [`F_{net} = ${Fa} N − ${fr} N = ${Math.abs(net)} N`, `a = [[${Math.abs(net)} N || ${m} kg]]`];
  hintSub = [`F_{net} = ${Fa} N − ${fr} N`, 'a = [[F_{net} || m]]'];
  unitSym = 'm/s²';
  return finishFbd(f, 'accel');

  function finishFbd(fig, v) {
    const answer = options[0];
    if (new Set(options).size !== 4) retry();
    const nums = options.map((o) => parseFloat(o));
    // every wrong option differs from the right one in size by more than 1%, or in direction
    for (let k = 1; k < 4; k++) {
      const sameDir = (options[k].split(' ').slice(2).join(' ') || '') === (answer.split(' ').slice(2).join(' ') || '');
      if (sameDir && Math.abs(nums[k] - nums[0]) <= 0.01 * Math.abs(nums[0])) retry();
      if (!Number.isFinite(nums[k]) || nums[k] < 0) retry();
    }
    const q = makeQ('fbd', lvl, {
      variant: v, type: 'mc', prompt, answer, options: shuffle(options),
      givens: [gq('m', 'm', m, 'kg', { note: 'mass', noText: v === 'net' || v === 'balanced' })],
      find, value: correct.mag, unit: correct.unit, eq, sub, hintSub,
      finalLine: () => mline(`${find.sym} = `, boxed(answer)),
      notes: explainNet ? [explainNet] : ['Arrows that point opposite ways subtract; the net force points the way of the bigger one.'],
      brief: `${eq.map(plainLine).join('; ')}: ${sub.map(plainLine).join('; ')} → ${answer}`,
      figure: fig.figure, figureAlt: fig.alt, nts: true, needsFigure: true,
      correct, data: { forces },
    });
    q.givens.forces = forces;
    return q;
  }
}

/* ============================================ unit 4: circles and gravity */
function genCentripetal(lvl) {
  const variant = pick(lvl === 1 ? ['ac', 'ac', 'Fc'] : lvl === 2 ? ['ac', 'Fc'] : ['Fc', 'v', 'v']);
  const sc = pick([
    { s: 'A car', m: [800, 2000], v: [8, 30], r: [20, 150], where: 'rounds a flat curve of radius', it: 'it' },
    { s: 'A ball', on: ' on a string', m: [0.1, 2], v: [2, 10], r: [0.3, 2], where: 'is whirled in a horizontal circle of radius', mdp: 1, rdp: 1, it: 'it' },
    { s: 'A child', on: ' on a merry-go-round', m: [20, 45], v: [1, 5], r: [1, 4], where: 'rides in a circle of radius', rdp: 1, it: 'the child' },
    { s: 'A cyclist', m: [60, 95], v: [4, 14], r: [8, 40], where: 'rides around a circular track of radius', it: 'the cyclist' },
  ]);
  const on = sc.on || '', its = sc.it === 'it' ? 'its' : `${sc.it}'s`;
  const m = dec(sc.m[0], sc.m[1], sc.mdp || 0), v = lvl === 1 ? ri(sc.v[0], sc.v[1]) : dec(sc.v[0], sc.v[1], 1), r = dec(sc.r[0], sc.r[1], sc.rdp || 0);
  const M = gq('m', 'm', m, 'kg'), V = gq('v', 'v', v, 'm/s'), R = gq('r', 'r', r, 'm');
  const ac = (v * v) / r;
  if (variant === 'ac') {
    return makeQ('centripetal', lvl, {
      variant, prompt: `${sc.s}${on} ${sc.where} ${R.text} at a steady ${V.text}. What is ${its} centripetal acceleration?`,
      givens: [V, R], find: { sym: 'a_{c}', name: 'centripetal acceleration' }, value: ac, unit: 'm/s2', rule: { dp: 2 },
      eq: ['a_{c} = [[v^2 || r]]'], sub: [`a_{c} = [[${gtext(V)}^2 || ${R.text}]]`], solve: [`a_{c} = [[${ap(v * v)} m^2/s^2 || ${R.text}]]`],
      notes: ['It points toward the center of the circle.'],
      wrong: [{ v: v / r, why: 'forgot to square v' }, { v: v * v * r, why: 'multiplied by r' }, { v: (2 * v) / r, why: 'doubled v instead of squaring it' }],
    });
  }
  if (variant === 'Fc') {
    return makeQ('centripetal', lvl, {
      variant, prompt: `${sc.s} of mass ${M.text}${on} ${sc.where} ${R.text} at ${V.text}. What centripetal force does ${sc.it} need?`,
      givens: [M, V, R], find: { sym: 'F_{c}', name: 'centripetal force' }, value: m * ac, unit: 'N', rule: { sf: 3 },
      eq: ['F_{c} = [[mv^2 || r]]'], sub: [`F_{c} = [[(${M.text})${gtext(V)}^2 || ${R.text}]]`], solve: [`F_{c} = [[${ap(m * v * v)} kg·m^2/s^2 || ${R.text}]]`],
      wrong: [{ v: (m * v) / r, why: 'forgot to square v' }, { v: ac, why: 'forgot the mass' }, { v: m * v * v * r, why: 'multiplied by r' }],
    });
  }
  const F = clean(Math.round(m * ac * 10) / 10);
  const Fg = gq('F', 'F_{c}', F, 'N');
  if (F < 0.5) retry();
  return makeQ('centripetal', lvl, {
    variant, prompt: `${sc.s} of mass ${M.text}${on} ${sc.where} ${R.text}. The centripetal force on ${sc.it} is ${Fg.text}. How fast is ${sc.it} moving?`,
    givens: [M, Fg, R], find: { sym: 'v', name: 'speed' }, value: Math.sqrt((F * r) / m), unit: 'm/s', rule: { dp: 2 },
    eq: ['F_{c} = [[mv^2 || r]]', 'v = √[[[[F_{c}r || m]]]]'], sub: [`v = √[[[[(${Fg.text})(${R.text}) || ${M.text}]]]]`], solve: [`v = √[[${ap((F * r) / m)} m^2/s^2]]`],
    wrong: [{ v: (F * r) / m, why: 'forgot the square root' }, { v: Math.sqrt(F / (m * r)), why: 'divided by r' }, { v: Math.sqrt((F * m) / r), why: 'swapped m and r' }],
  });
}

/* Things that go round, with sensible radii (m) and periods (s). */
const SPINNERS = [
  { n: 'A Ferris wheel', r: [10, 60], T: [20, 300] }, { n: 'A merry-go-round', r: [1.5, 5], T: [3, 15] },
  { n: 'A bicycle wheel', r: [0.3, 0.4], T: [0.15, 1] }, { n: 'A washing machine drum', r: [0.2, 0.3], T: [0.05, 0.5] },
  { n: 'A ceiling fan', r: [0.4, 0.7], T: [0.2, 1.5] }, { n: 'A carousel horse', r: [3, 8], T: [8, 20] },
];
function genPeriod(lvl) {
  const variant = pick(lvl === 1 ? ['T_f', 'f_T', 'T_count', 'f_count'] : lvl === 2 ? ['T_f', 'f_T', 'T_count', 'f_count', 'v'] : ['v', 'v', 'T_count', 'f_count']);
  const sp = pick(SPINNERS);
  const thing = sp.n;
  const dpT = sp.T[0] < 1 ? 2 : 1;
  if (variant === 'T_f' || variant === 'f_T') {
    if (variant === 'T_f') {
      const nice = [0.02, 0.025, 0.04, 0.05, 0.1, 0.125, 0.2, 0.25, 0.5, 1, 2, 4, 5, 8, 10, 20, 25, 40, 50, 100, 125, 200, 250].filter((T) => T >= sp.T[0] && T <= sp.T[1]);
      const f = lvl === 1 && nice.length ? clean(1 / pick(nice)) : Number((1 / dec(sp.T[0], sp.T[1], dpT)).toPrecision(2));
      const Fg = gq('f', 'f', f, 'Hz');
      return makeQ('period', lvl, {
        variant, prompt: `${thing} turns with a frequency of ${Fg.text}. What is its period?`,
        givens: [Fg], find: { sym: 'T', name: 'period, the time for one turn' }, value: 1 / f, unit: 's', rule: { sf: 3 },
        eq: ['T = [[1 || f]]'], sub: [`T = [[1 || ${Fg.text}]]`],
        wrong: [{ v: f, why: 'gave the frequency' }, { v: 2 / f, why: 'doubled' }, { v: 60 / f, why: 'multiplied by 60' }],
      });
    }
    const nice = [0.02, 0.025, 0.04, 0.05, 0.1, 0.125, 0.2, 0.25, 0.5, 1, 2, 4, 5, 8, 10, 20, 25, 40, 50, 100, 125, 200, 250].filter((T) => T >= sp.T[0] && T <= sp.T[1]);
    const T = lvl === 1 && nice.length ? pick(nice) : dec(sp.T[0], sp.T[1], dpT);
    const Tg = gq('T', 'T', T, 's');
    return makeQ('period', lvl, {
      variant, prompt: `${thing} takes ${Tg.text} to make one full turn. What is its frequency?`,
      givens: [Tg], find: { sym: 'f', name: 'frequency, turns per second' }, value: 1 / T, unit: 'Hz', rule: { sf: 3 },
      eq: ['f = [[1 || T]]'], sub: [`f = [[1 || ${Tg.text}]]`],
      wrong: [{ v: T, why: 'gave the period' }, { v: 2 / T, why: 'doubled' }, { v: 60 / T, why: 'turns per minute' }],
    });
  }
  if (variant === 'T_count' || variant === 'f_count') {
    const Tone = dec(sp.T[0], sp.T[1], dpT);
    const N = ri(3, 40);
    const t = lvl === 1 ? clean(N * Tone) : Math.max(1, Math.round(N * Tone));
    if (info(t).dp > 2) retry();
    const Ng = gq('N', 'N', N, '', { text: `${N}` }), Tt = gq('t', 't', t, 's');
    if (variant === 'T_count') {
      return makeQ('period', lvl, {
        variant, prompt: `${thing} makes ${N} full turns in ${Tt.text}. What is its period?`,
        givens: [Ng, Tt], find: { sym: 'T', name: 'time for one turn' }, value: t / N, unit: 's', rule: { sf: 3 },
        eq: ['T = [[time || number of turns]]'], sub: [`T = [[${Tt.text} || ${N}]]`],
        wrong: [{ v: N / t, why: 'found the frequency' }, { v: t * N, why: 'multiplied' }, { v: t / N / 60, why: 'converted to minutes' }],
      });
    }
    return makeQ('period', lvl, {
      variant, prompt: `${thing} makes ${N} full turns in ${Tt.text}. What is its frequency?`,
      givens: [Ng, Tt], find: { sym: 'f', name: 'turns per second' }, value: N / t, unit: 'Hz', rule: { sf: 3 },
      eq: ['f = [[number of turns || time]]'], sub: [`f = [[${N} || ${Tt.text}]]`],
      wrong: [{ v: t / N, why: 'found the period' }, { v: N * t, why: 'multiplied' }, { v: (N / t) * 60, why: 'turns per minute' }],
    });
  }
  const r = dec(sp.r[0], sp.r[1], sp.r[0] < 1 ? 2 : 1), T = dec(sp.T[0], sp.T[1], dpT);
  const R = gq('r', 'r', r, 'm'), Tg = gq('T', 'T', T, 's');
  return makeQ('period', lvl, {
    variant, prompt: `A point on the rim of ${thing.replace(/^A /, 'a ')} is ${R.text} from the center. It goes around once every ${Tg.text}. How fast does that point move?`,
    givens: [R, Tg], find: { sym: 'v', name: 'speed around the circle' }, value: (2 * Math.PI * r) / T, unit: 'm/s', rule: { dp: 2 },
    eq: ['v = [[distance || time]] = [[2πr || T]]'], sub: [`v = [[2π(${R.text}) || ${Tg.text}]]`], solve: [`v = [[${ap(2 * Math.PI * r)} m || ${Tg.text}]]`],
    notes: ['One trip around is the circumference, 2πr.'],
    wrong: [{ v: (Math.PI * r) / T, why: 'forgot the 2' }, { v: (2 * r) / T, why: 'forgot π' }, { v: 2 * Math.PI * r * T, why: 'multiplied by T' }, { v: r / T, why: 'used the radius as the distance' }],
  });
}

/* How the gravitational force scales: F ∝ m₁m₂ / r². Factors are exact fractions. */
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const frac = (p, q) => { const g = gcd(p, q); return [p / g, q / g]; };
const fmul = (a, b) => frac(a[0] * b[0], a[1] * b[1]);
const fdiv = (a, b) => frac(a[0] * b[1], a[1] * b[0]);
const WORDS = { 2: 'half', 3: 'one third', 4: 'one quarter' };
function factorText([p, q]) {
  if (p === q) return 'It stays the same (F)';
  if (q === 1) return `${p}F (${p} times as strong)`;
  if (p === 1) return `F/${q} (${WORDS[q] || `1/${q}`} as strong)`;
  return `${p}F/${q} (${p}/${q} as strong)`;
}
const MASS_CH = [[[2, 1], 'doubled'], [[3, 1], 'tripled'], [[4, 1], 'made 4 times as large'], [[1, 2], 'halved']];
const DIST_CH = [[[2, 1], 'doubled'], [[3, 1], 'tripled'], [[1, 2], 'cut in half'], [[4, 1], 'made 4 times as large'], [[1, 3], 'cut to one third']];
function genGravchange(lvl) {
  const variant = lvl === 3 && chance(0.6) ? 'value' : 'factor';
  const pair = pick(['Two asteroids', 'Two moons', 'A planet and its moon', 'Two bowling balls', 'Two spacecraft']);
  const nCh = lvl === 1 ? 1 : lvl === 2 ? 2 : pick([2, 3]);
  const kinds = shuffle(['m1', 'm2', 'r']).slice(0, nCh);
  if (lvl === 1 && chance(0.6)) kinds[0] = 'r';
  const ch = { m1: [1, 1], m2: [1, 1], r: [1, 1] };
  const phrases = [];
  for (const k of kinds) {
    const [f, w] = pick(k === 'r' ? DIST_CH : MASS_CH);
    ch[k] = f;
    phrases.push(k === 'r' ? `the distance between them is ${w}` : `${k === 'm1' ? 'the first' : 'the second'} mass is ${w}`);
  }
  const listed = phrases.length === 1 ? phrases[0] : `${phrases.slice(0, -1).join(', ')} and ${phrases[phrases.length - 1]}`;
  const key = (f) => f[0] / f[1];
  const r2 = fmul(ch.r, ch.r);
  const masses = fmul(ch.m1, ch.m2);
  const k = fdiv(masses, r2);
  const rCh = key(ch.r) !== 1, mCh = key(masses) !== 1;
  const cands = [
    ...(rCh ? [[fdiv(masses, ch.r), 'forgot to square the distance'], [fmul(masses, r2), 'multiplied by the distance squared'], [masses, 'ignored the distance'], [fdiv(masses, fmul(ch.r, [2, 1])), 'doubled the distance change instead of squaring it']] : []),
    ...(mCh ? [[fmul(masses, masses), 'squared the mass change'], [fdiv([1, 1], masses), 'thought more mass means less force'], [fdiv([1, 1], r2), 'ignored the masses']] : []),
    [[1, 1], 'thought the force stays the same'],
  ];
  const wrong = [];
  for (const [f, why] of cands) {
    if (wrong.length === 3) break;
    if (Math.abs(key(f) - key(k)) <= 0.01 * key(k) || wrong.some((w) => Math.abs(key(w.f) - key(f)) <= 0.01 * key(f))) continue;
    wrong.push({ f, why });
  }
  if (wrong.length < 3) retry();
  const G = [
    gq('m1', 'm₁ change', key(ch.m1), '', { text: `×${fmt(key(ch.m1))}`, line: `m₁ → ${ch.m1[0] === ch.m1[1] ? 'm₁' : `${factorShort(ch.m1)}m₁`}`, noText: true }),
    gq('m2', 'm₂ change', key(ch.m2), '', { text: `×${fmt(key(ch.m2))}`, line: `m₂ → ${ch.m2[0] === ch.m2[1] ? 'm₂' : `${factorShort(ch.m2)}m₂`}`, noText: true }),
    gq('r', 'r change', key(ch.r), '', { text: `×${fmt(key(ch.r))}`, line: `r → ${ch.r[0] === ch.r[1] ? 'r' : `${factorShort(ch.r)}r`}`, noText: true }),
  ];
  const subLine = `F′ = G[[(${factorShort(ch.m1) || ''}m₁)(${factorShort(ch.m2) || ''}m₂) || (${factorShort(ch.r) || ''}r)^2]] = [[${fracShort(masses)} || ${fracShort(r2)}]] × G[[m₁m₂ || r^2]]`.replace(/\(m₁\)/g, 'm₁').replace(/\(m₂\)/g, 'm₂');
  let options, answer, correct, prompt;
  if (variant === 'factor') {
    answer = factorText(k);
    options = [answer, ...wrong.map((w) => factorText(w.f))];
    prompt = `${pair} pull on each other with a gravitational force F. What is the force if ${listed}?`;
    correct = { factor: k };
  } else {
    const base = pick([36, 48, 72, 90, 120, 144, 180, 240, 360]);
    const F0 = base;
    const val = (f) => (F0 * f[0]) / f[1];
    const s0 = settle(val(k), { sf: 3 }, false);
    if (!s0 || !s0.exact || k[0] === k[1]) retry();
    answer = `${fmt(val(k))} N`;
    const ws = wrong.map((w) => settle(val(w.f), { sf: 3 }, false));
    if (ws.some((x) => !x)) retry();
    options = [answer, ...ws.map((x) => `${x.str} N`)];
    prompt = `${pair} pull on each other with a gravitational force of ${F0} N. What is the force if ${listed}?`;
    correct = { factor: k, F0, value: val(k) };
    G.push(gq('F0', 'F', F0, 'N'));
  }
  if (new Set(options).size !== 4) retry();
  const q = makeQ('gravchange', lvl, {
    variant, type: 'mc', prompt, answer, options: shuffle(options),
    givens: G, find: { sym: 'F′', name: 'the new force' }, value: key(k), unit: '',
    eq: ['F = G[[m₁m₂ || r^2]]: double a mass and F doubles; double r and F drops to a quarter.'],
    sub: [subLine], finalLine: () => mline('F′ = ', boxed(answer)),
    notes: ['Distance counts twice because it is squared — the inverse-square law.'],
    brief: `F ∝ m₁m₂/r²: the masses multiply F by ${fracShort(masses)} and the distance multiplies it by ${fracShort([r2[1], r2[0]])}, so F′ = ${answer}.`,
    correct, data: { m1: ch.m1, m2: ch.m2, r: ch.r },
  });
  return q;
}
function factorShort([p, q]) { if (p === q) return ''; return q === 1 ? String(p) : `${p}/${q}`; }
function fracShort([p, q]) { return q === 1 ? String(p) : `${p}/${q}`; }

const BODIES = [
  { k: 'earth-moon', a: 'Earth', b: 'the Moon', m1: ['5.97', 24], m2: ['7.35', 22], r: ['3.84', 8] },
  { k: 'earth-sun', a: 'Earth', b: 'the Sun', m1: ['5.97', 24], m2: ['1.99', 30], r: ['1.50', 11] },
  { k: 'mars-phobos', a: 'Mars', b: 'its moon Phobos', m1: ['6.42', 23], m2: ['1.07', 16], r: ['9.38', 6] },
];
function genGravity(lvl) {
  const variant = lvl === 3 ? pick(['F', 'm2', 'r']) : 'F';
  const Gc = gsci('G', 'G', '6.67', -11, '', { k: true, text: '6.67 × 10^-11 N·m²/kg²', line: 'G = 6.67 × 10^-11 N·m²/kg²' });
  let M1, M2, R, what;
  const kind = lvl === 1 ? pick(['bodies', 'people']) : pick(['bodies', 'people', 'satellite', 'planet']);
  if (kind === 'bodies') {
    const b = pick(BODIES);
    M1 = gsci('m1', 'm₁', b.m1[0], b.m1[1], 'kg'); M2 = gsci('m2', 'm₂', b.m2[0], b.m2[1], 'kg'); R = gsci('r', 'r', b.r[0], b.r[1], 'm');
    what = [`${b.a} has a mass of ${M1.text}`, `${b.b} has a mass of ${M2.text}`, `the distance between their centers is ${R.text}`, `${b.a} and ${b.b}`,
      (f) => `${b.a} has a mass of ${M1.text}, and the distance between the centers of ${b.a} and ${b.b} is ${R.text}. The gravitational force between them is ${f}. What is the mass of ${b.b}?`];
  } else if (kind === 'people') {
    M1 = gq('m1', 'm₁', ri(45, 95), 'kg'); M2 = gq('m2', 'm₂', ri(45, 95), 'kg'); R = gq('r', 'r', dec(0.5, 3, 1), 'm');
    what = [`one student has a mass of ${M1.text}`, `another has a mass of ${M2.text}`, `they stand ${R.text} apart`, 'the two students',
      (f) => `Two students stand ${R.text} apart. One has a mass of ${M1.text}, and the gravitational force between them is ${f}. What is the other student's mass?`];
  } else if (kind === 'satellite') {
    M1 = gsci('m1', 'm₁', '5.97', 24, 'kg'); M2 = gq('m2', 'm₂', 100 * ri(3, 40), 'kg'); R = gsci('r', 'r', fmt(dec(6.6, 9.9, 2)), 6, 'm');
    what = [`Earth has a mass of ${M1.text}`, `a satellite has a mass of ${M2.text}`, `it orbits ${R.text} from Earth's center`, 'Earth and the satellite',
      (f) => `A satellite orbits ${R.text} from Earth's center. Earth has a mass of ${M1.text}, and the gravitational force between Earth and the satellite is ${f}. What is the satellite's mass?`];
  } else {
    M1 = sciGiven('m1', 'm₁', 1, 9.9, 2, ri(22, 26), 'kg'); M2 = sciGiven('m2', 'm₂', 1, 9.9, 2, ri(20, 23), 'kg'); R = sciGiven('r', 'r', 1, 9.9, 2, ri(7, 9), 'm');
    what = [`a planet has a mass of ${M1.text}`, `its moon has a mass of ${M2.text}`, `their centers are ${R.text} apart`, 'the planet and its moon',
      (f) => `A moon orbits a planet with a mass of ${M1.text}, and their centers are ${R.text} apart. The gravitational force between them is ${f}. What is the moon's mass?`];
  }
  const m1 = M1.v, m2 = M2.v, r = R.v;
  const F = (BIG_G * m1 * m2) / (r * r);
  const rules = { sf: 3 };
  if (variant === 'F') {
    return makeQ('gravity', lvl, {
      variant, prompt: `${cap(what[0])}, ${what[1]}, and ${what[2]}. What is the gravitational force between ${what[3]}? Use G = ${Gc.text}.`,
      givens: [M1, M2, R, Gc], find: { sym: 'F', name: 'gravitational force' }, value: F, unit: 'N', rule: rules, sci: true, uses: ['G'],
      eq: ['F = G[[m₁m₂ || r^2]]'], sub: [`F = (${Gc.text.replace(' N·m²/kg²', '')})[[(${M1.text})(${M2.text}) || (${R.text})^2]]`],
      solve: [`F = (6.67 × 10^-11)[[${ap(m1 * m2)} || ${ap(r * r)}]]`],
      notes: ['Square the distance, and keep track of the powers of ten: multiply them by adding exponents, divide by subtracting.'],
      wrong: [{ v: (BIG_G * m1 * m2) / r, why: 'forgot to square r' }, { v: (6.67e11 * m1 * m2) / (r * r), why: 'used 10^11 for G' }, { v: F * 10, why: 'power-of-ten slip' }, { v: F / 10, why: 'power-of-ten slip' }],
    });
  }
  // gravitational forces are always written in scientific notation
  const Fs = settle(F, { sf: 3 }, true);
  if (!Fs) retry();
  const Fg = Fs.str.includes(' × 10^') ? gsci('F', 'F', Fs.str.split(' × 10^')[0], Number(Fs.str.split(' × 10^')[1]), 'N') : gq('F', 'F', Number(Fs.str.replace(/,/g, '')), 'N');
  if (variant === 'm2') {
    return makeQ('gravity', lvl, {
      variant, prompt: `${what[4](Fg.text)} Use G = ${Gc.text}.`,
      givens: [M1, R, Fg, Gc], find: { sym: 'm₂', name: 'the other mass' }, value: (Fg.v * r * r) / (BIG_G * m1), unit: 'kg', rule: rules, sci: sciFor((Fg.v * r * r) / (BIG_G * m1)), uses: ['G'],
      eq: ['F = G[[m₁m₂ || r^2]]', 'm₂ = [[Fr^2 || Gm₁]]'], sub: [`m₂ = [[(${Fg.text})(${R.text})^2 || (6.67 × 10^-11)(${M1.text})]]`],
      wrong: [{ v: (Fg.v * r) / (BIG_G * m1), why: 'forgot to square r' }, { v: (Fg.v * BIG_G * m1) / (r * r), why: 'multiplied by G' }, { v: (Fg.v * r * r) / (BIG_G * m1) * 10, why: 'power-of-ten slip' }],
    });
  }
  return makeQ('gravity', lvl, {
    variant, prompt: `${cap(what[0])} and ${what[1]}. The gravitational force between them is ${Fg.text}. How far apart are their centers? Use G = ${Gc.text}.`,
    givens: [M1, M2, Fg, Gc], find: { sym: 'r', name: 'distance between centers' }, value: Math.sqrt((BIG_G * m1 * m2) / Fg.v), unit: 'm', rule: rules, sci: sciFor(Math.sqrt((BIG_G * m1 * m2) / Fg.v)), uses: ['G'],
    eq: ['F = G[[m₁m₂ || r^2]]', 'r = √[[[[Gm₁m₂ || F]]]]'], sub: [`r = √[[[[(6.67 × 10^-11)(${M1.text})(${M2.text}) || ${Fg.text}]]]]`], solve: [`r = √[[${ap((BIG_G * m1 * m2) / Fg.v)} m^2]]`],
    wrong: [{ v: (BIG_G * m1 * m2) / Fg.v, why: 'forgot the square root' }, { v: Math.sqrt((BIG_G * m1 * m2) / Fg.v) * 10, why: 'power-of-ten slip' }, { v: Math.sqrt(Fg.v / (BIG_G * m1 * m2)), why: 'divided the wrong way round' }],
  });
}
const cap = (s) => s[0].toUpperCase() + s.slice(1);
/** Very large and very small answers are written in scientific notation. */
const sciFor = (v) => Math.abs(v) < 0.01 || Math.abs(v) >= 1e4;

/* ================================================= unit 5: work and energy */
function genWork(lvl) {
  const variant = pick(lvl === 1 ? ['W', 'W', 'F', 'd'] : lvl === 2 ? ['W', 'W_angle', 'F', 'd', 'W_angle'] : ['W_angle', 'lift', 'F_angle']);
  const who = pick(['A student', 'A mover', 'A worker', 'A shopper', 'A farmer']);
  if (variant === 'W' || variant === 'F' || variant === 'd') {
    const F = lvl === 1 ? 5 * ri(2, 60) : ri(8, 600), d = lvl === 1 ? ri(2, 40) : dec(0.5, 60, 1);
    const Fg = gq('F', 'F', F, 'N'), D = gq('d', 'd', d, 'm');
    if (variant === 'W') {
      return makeQ('work', lvl, {
        variant, prompt: `${who} pushes a crate with a steady horizontal force of ${Fg.text} for ${D.text} in the direction of the push. How much work does the push do?`,
        givens: [Fg, D], find: { sym: 'W', name: 'work' }, value: F * d, unit: 'J', rule: { sf: 3 },
        eq: ['W = Fd'], sub: [`W = (${Fg.text})(${D.text})`],
        wrong: [{ v: F / d, why: 'divided' }, { v: F + d, why: 'added' }, { v: 0.5 * F * d, why: 'used ½' }],
      });
    }
    // warm-up: whole numbers that divide exactly; after that, round numbers and a rounded answer
    const W = lvl === 1 ? F * d : 10 * ri(10, 3000);
    const Wg = gq('W', 'W', W, 'J');
    if (variant === 'F') {
      const dd = lvl === 1 ? d : ri(2, 60);
      const D2 = gq('d', 'd', dd, 'm');
      return makeQ('work', lvl, {
        variant, prompt: `${who} does ${Wg.text} of work pushing a cart ${D2.text} in the direction of the push. What steady force was used?`,
        givens: [Wg, D2], find: { sym: 'F', name: 'force' }, value: W / dd, unit: 'N', rule: { sf: 3 },
        eq: ['W = Fd', 'F = [[W || d]]'], sub: [`F = [[${Wg.text} || ${D2.text}]]`],
        wrong: [{ v: W * dd, why: 'multiplied' }, { v: dd / W, why: 'divided the wrong way round' }, { v: W - dd, why: 'subtracted' }],
      });
    }
    return makeQ('work', lvl, {
      variant, prompt: `${who} does ${Wg.text} of work with a steady force of ${Fg.text} in the direction of motion. How far does the object move?`,
      givens: [Wg, Fg], find: { sym: 'd', name: 'distance' }, value: W / F, unit: 'm', rule: { sf: 3 },
      eq: ['W = Fd', 'd = [[W || F]]'], sub: [`d = [[${Wg.text} || ${Fg.text}]]`],
      wrong: [{ v: W * F, why: 'multiplied' }, { v: F / W, why: 'divided the wrong way round' }, { v: W - F, why: 'subtracted' }],
    });
  }
  if (variant === 'lift') {
    const m = dec(1, 60, 1), h = dec(0.5, 12, 1);
    const M = gq('m', 'm', m, 'kg'), H = gq('h', 'h', h, 'm'), g = G_GIVEN();
    return makeQ('work', lvl, {
      variant, prompt: `How much work does it take to lift a ${M.text} box straight up ${H.text} at a steady speed? ${G_NOTE}`,
      givens: [M, H, g], find: { sym: 'W', name: 'work' }, value: m * GRAV * h, unit: 'J', rule: { sf: 3 }, uses: ['g'],
      eq: ['At a steady speed the lifting force equals the weight: F = mg', 'W = Fd = mgh'], sub: [`W = (${M.text})(9.8 m/s²)(${H.text})`],
      wrong: [{ v: m * h, why: 'forgot g' }, { v: m * 10 * h, why: 'used g = 10' }, { v: (m * GRAV) / h, why: 'divided by the height' }],
    });
  }
  const F = ri(10, 400), d = ri(2, 80), th = lvl === 2 ? pick([20, 25, 30, 35, 40, 45, 50, 60]) : ri(10, 70);
  const Fg = gq('F', 'F', F, 'N'), D = gq('d', 'd', d, 'm'), TH = gq('theta', 'θ', th, 'deg', { note: 'angle between the force and the motion' });
  const c = Math.cos((th * Math.PI) / 180);
  if (variant === 'W_angle') {
    return makeQ('work', lvl, {
      variant, prompt: `${who} pulls a wagon ${D.text} along level ground with a force of ${Fg.text} directed ${th}° above the horizontal. How much work does the pull do?`,
      givens: [Fg, D, TH], find: { sym: 'W', name: 'work' }, value: F * d * c, unit: 'J', rule: { sf: 3 },
      eq: ['Only the part of the force along the motion does work:', 'W = Fd cos θ'], sub: [`W = (${Fg.text})(${D.text})(cos ${th}°)`], solve: [`W = (${fmt(F * d)} J)(${ap(c)})`],
      notes: ['Check your calculator is in degree mode.'],
      wrong: [{ v: F * d, why: 'ignored the angle' }, { v: F * d * Math.sin((th * Math.PI) / 180), why: 'used sine instead of cosine' }, { v: F * d * Math.cos(th), why: 'calculator in radian mode' }],
    });
  }
  const W = clean(Math.round(F * d * c));
  const Wg = gq('W', 'W', W, 'J');
  return makeQ('work', lvl, {
    variant, prompt: `A rope pulls a sled ${D.text} along level snow at ${th}° above the horizontal and does ${Wg.text} of work. What is the tension in the rope?`,
    givens: [Wg, D, TH], find: { sym: 'F', name: 'force in the rope' }, value: W / (d * c), unit: 'N', rule: { sf: 3 },
    eq: ['W = Fd cos θ', 'F = [[W || d cos θ]]'], sub: [`F = [[${Wg.text} || (${D.text})(cos ${th}°)]]`], solve: [`F = [[${Wg.text} || ${ap(d * c)} m]]`],
    notes: ['Check your calculator is in degree mode.'],
    wrong: [{ v: W / d, why: 'ignored the angle' }, { v: W / (d * Math.sin((th * Math.PI) / 180)), why: 'used sine instead of cosine' }, { v: W * d * c, why: 'multiplied' }],
  });
}

function genEnergy(lvl) {
  const variant = pick(lvl === 1 ? ['KE', 'PE'] : lvl === 2 ? ['KE', 'PE', 'v_KE', 'h_PE'] : ['v_KE', 'h_PE', 'm_KE', 'KE']);
  const g = G_GIVEN();
  if (variant === 'KE' || variant === 'v_KE' || variant === 'm_KE') {
    let M, obj, grams = 0;
    if (lvl === 3 && variant === 'KE') { const o = pick(SMALL); grams = ri(o.lo, o.hi); obj = o.n; M = gq('m', 'm', grams / 1000, 'kg', { text: `${grams} g`, line: `m = ${grams} g = ${fmt(grams / 1000)} kg` }); } else {
      const o = pick([{ n: 'skateboarder', lo: 40, hi: 90 }, { n: 'bowling ball', lo: 4, hi: 7 }, { n: 'car', lo: 900, hi: 2000 }, { n: 'bicycle and rider', lo: 60, hi: 110 }, { n: 'cart', lo: 2, hi: 30 }]);
      obj = o.n; M = gq('m', 'm', lvl === 1 ? ri(o.lo, o.hi) : dec(o.lo, o.hi, o.hi < 10 ? 1 : 0), 'kg');
    }
    const v = lvl === 1 ? ri(2, 30) : dec(1, 40, 1);
    const V = gq('v', 'v', v, 'm/s'), m = M.v;
    const KE = 0.5 * m * v * v;
    if (variant === 'KE') {
      return makeQ('energy', lvl, {
        variant, prompt: `A ${M.text} ${obj} moves at ${V.text}. What is its kinetic energy?`,
        givens: [M, V], find: { sym: 'KE', name: 'kinetic energy' }, value: KE, unit: 'J', rule: { sf: 3 },
        eq: ['KE = ½mv^2'], sub: [`KE = ½(${fmt(m)} kg)${gtext(V)}^2`], solve: [`KE = ½(${fmt(m)} kg)(${ap(v * v)} m^2/s^2)`],
        notes: grams ? ['Grams to kilograms first: divide by 1,000.'] : ['Square the speed before you multiply.'],
        wrong: [{ v: m * v * v, why: 'forgot the ½' }, { v: 0.5 * m * v, why: 'forgot to square v' }, { v: (0.5 * m * v) ** 2, why: 'squared everything' }, ...(grams ? [{ v: 0.5 * grams * v * v, why: 'left the mass in grams' }] : [])],
      });
    }
    const K = clean(Number(KE.toPrecision(3)));
    const Kg = gq('KE', 'KE', K, 'J');
    if (variant === 'v_KE') {
      return makeQ('energy', lvl, {
        variant, prompt: `A ${M.text} ${obj} has ${Kg.text} of kinetic energy. How fast is it moving?`,
        givens: [Kg, M], find: { sym: 'v', name: 'speed' }, value: Math.sqrt((2 * K) / m), unit: 'm/s', rule: { dp: 2 },
        eq: ['KE = ½mv^2', 'v = √[[[[2KE || m]]]]'], sub: [`v = √[[[[2(${Kg.text}) || ${M.text}]]]]`], solve: [`v = √[[${ap((2 * K) / m)} m^2/s^2]]`],
        wrong: [{ v: (2 * K) / m, why: 'forgot the square root' }, { v: Math.sqrt(K / m), why: 'forgot the 2' }, { v: K / m, why: 'forgot the 2 and the root' }],
      });
    }
    return makeQ('energy', lvl, {
      variant, prompt: `An object moving at ${V.text} has ${Kg.text} of kinetic energy. What is its mass?`,
      givens: [Kg, V], find: { sym: 'm', name: 'mass' }, value: (2 * K) / (v * v), unit: 'kg', rule: { sf: 3 },
      eq: ['KE = ½mv^2', 'm = [[2KE || v^2]]'], sub: [`m = [[2(${Kg.text}) || ${gtext(V)}^2]]`], solve: [`m = [[${ap(2 * K)} J || ${ap(v * v)} m^2/s^2]]`],
      wrong: [{ v: K / (v * v), why: 'forgot the 2' }, { v: (2 * K) / v, why: 'forgot to square v' }, { v: 2 * K * v * v, why: 'multiplied' }],
    });
  }
  const m = lvl === 1 ? ri(1, 80) : dec(0.5, 80, 1), h = lvl === 1 ? ri(1, 50) : dec(0.5, 60, 1);
  const M = gq('m', 'm', m, 'kg'), H = gq('h', 'h', h, 'm');
  const obj = pick(['a flowerpot on a balcony', 'a climber on a ledge', 'a box on a shelf', 'a rock on a cliff', 'a bucket of water']);
  if (variant === 'PE') {
    return makeQ('energy', lvl, {
      variant, prompt: `What is the gravitational potential energy of ${obj}, of mass ${M.text}, ${H.text} above the ground? Take the ground as zero. ${G_NOTE}`,
      givens: [M, H, g], find: { sym: 'PE', name: 'gravitational potential energy' }, value: m * GRAV * h, unit: 'J', rule: { sf: 3 }, uses: ['g'],
      eq: ['PE = mgh'], sub: [`PE = (${M.text})(9.8 m/s²)(${H.text})`],
      wrong: [{ v: m * h, why: 'forgot g' }, { v: m * 10 * h, why: 'used g = 10' }, { v: (m * GRAV) / h, why: 'divided by h' }],
    });
  }
  const PE = clean(Number((m * GRAV * h).toPrecision(3)));
  const PEg = gq('PE', 'PE', PE, 'J');
  return makeQ('energy', lvl, {
    variant, prompt: `A ${M.text} object has ${PEg.text} of gravitational potential energy, measured from the ground. How high above the ground is it? ${G_NOTE}`,
    givens: [PEg, M, g], find: { sym: 'h', name: 'height' }, value: PE / (m * GRAV), unit: 'm', rule: { dp: 2 }, uses: ['g'],
    eq: ['PE = mgh', 'h = [[PE || mg]]'], sub: [`h = [[${PEg.text} || (${M.text})(9.8 m/s²)]]`], solve: [`h = [[${PEg.text} || ${ap(m * GRAV)} N]]`],
    wrong: [{ v: PE / m, why: 'forgot g' }, { v: PE / (m * 10), why: 'used g = 10' }, { v: PE * m * GRAV, why: 'multiplied' }],
  });
}

function genConservation(lvl) {
  const variant = pick(lvl === 1 ? ['v_drop', 'h_up'] : lvl === 2 ? ['v_drop', 'h_up', 'v_between'] : ['v_between', 'v_with_v0', 'h_up']);
  const g = G_GIVEN();
  const tail = ` Ignore friction and air resistance. ${G_NOTE}`;
  // a believable mass for each object: roller-coaster car, go-kart with its driver, skier
  const [mLo, mHi] = { v_drop: [300, 900], v_between: [300, 900], h_up: [100, 250], v_with_v0: [45, 100] }[variant];
  const mass = lvl > 1 && chance(0.5) ? gq('m', 'm', ri(mLo, mHi), 'kg', { note: 'not needed — it cancels' }) : null;
  const mText = mass ? ` ${mass.text}` : '';
  if (variant === 'v_drop') {
    const h = lvl === 1 ? ri(2, 60) : dec(1, 80, 1);
    const H = gq('h', 'h', h, 'm');
    return makeQ('conservation', lvl, {
      variant, prompt: `A${mText ? mText : ''} roller-coaster car starts from rest at the top of a hill ${H.text} high. How fast is it going at the bottom?${tail}`,
      givens: [...(mass ? [mass] : []), H, g], find: { sym: 'v', name: 'speed at the bottom' }, value: Math.sqrt(2 * GRAV * h), unit: 'm/s', rule: { dp: 1 }, uses: ['g'],
      eq: ['PE at the top = KE at the bottom', 'mgh = ½mv^2, so v = √[[2gh]]'], sub: [`v = √[[2(9.8 m/s²)(${H.text})]]`], solve: [`v = √[[${ap(2 * GRAV * h)} m^2/s^2]]`],
      notes: ['The mass cancels from both sides, so it does not matter how heavy the car is.'],
      wrong: [{ v: Math.sqrt(GRAV * h), why: 'forgot the 2' }, { v: 2 * GRAV * h, why: 'forgot the square root' }, { v: Math.sqrt(20 * h), why: 'used g = 10' }],
    });
  }
  if (variant === 'h_up') {
    const v = lvl === 1 ? ri(2, 20) : dec(1, 22, 1);
    const V = gq('v', 'v', v, 'm/s');
    return makeQ('conservation', lvl, {
      variant, prompt: `A${mText} go-kart coasts at ${V.text} toward a frictionless ramp. How high up the ramp does it go before it stops?${tail}`,
      givens: [...(mass ? [mass] : []), V, g], find: { sym: 'h', name: 'height reached' }, value: (v * v) / (2 * GRAV), unit: 'm', rule: { dp: 2 }, uses: ['g'],
      eq: ['KE at the bottom = PE at the top', '½mv^2 = mgh, so h = [[v^2 || 2g]]'], sub: [`h = [[${gtext(V)}^2 || 2(9.8 m/s²)]]`], solve: [`h = [[${ap(v * v)} m^2/s^2 || 19.6 m/s²]]`],
      notes: ['The mass cancels.'],
      wrong: [{ v: (v * v) / GRAV, why: 'forgot the 2' }, { v: v / (2 * GRAV), why: 'forgot to square v' }, { v: (v * v) / 20, why: 'used g = 10' }],
    });
  }
  if (variant === 'v_between') {
    const h1 = ri(20, 80), h2 = ri(2, h1 - 3);
    const H1 = gq('h1', 'h₁', h1, 'm', { note: 'start, from rest' }), H2 = gq('h2', 'h₂', h2, 'm', { note: 'later point' });
    const dh = h1 - h2;
    return makeQ('conservation', lvl, {
      variant, prompt: `A${mText} roller-coaster car starts from rest ${H1.text} above the ground and rolls down to a point ${H2.text} above the ground. How fast is it going there?${tail}`,
      givens: [...(mass ? [mass] : []), H1, H2, g], find: { sym: 'v', name: 'speed at the lower point' }, value: Math.sqrt(2 * GRAV * dh), unit: 'm/s', rule: { dp: 1 }, uses: ['g'],
      eq: ['PE lost = KE gained: mg(h₁ − h₂) = ½mv^2', 'v = √[[2g(h₁ − h₂)]]'], sub: [`v = √[[2(9.8 m/s²)(${H1.text} − ${H2.text})]]`], solve: [`v = √[[2(9.8 m/s²)(${P(dh, 'm')})]]`, `v = √[[${ap(2 * GRAV * dh)} m^2/s^2]]`],
      wrong: [{ v: Math.sqrt(2 * GRAV * h1), why: 'used the full starting height' }, { v: Math.sqrt(2 * GRAV * h2), why: 'used the lower height' }, { v: Math.sqrt(GRAV * dh), why: 'forgot the 2' }, { v: Math.sqrt(20 * dh), why: 'used g = 10' }],
    });
  }
  const v0 = ri(2, 20), h = ri(2, 60);
  const V0 = gq('v0', 'v₀', v0, 'm/s'), H = gq('h', 'h', h, 'm');
  return makeQ('conservation', lvl, {
    variant, prompt: `A${mText} skier moving at ${V0.text} starts down a slope and drops ${H.text} in height. How fast is the skier going at the bottom?${tail}`,
    givens: [...(mass ? [mass] : []), V0, H, g], find: { sym: 'v', name: 'speed at the bottom' }, value: Math.sqrt(v0 * v0 + 2 * GRAV * h), unit: 'm/s', rule: { dp: 1 }, uses: ['g'],
    eq: ['KE₀ + PE₀ = KE', '½mv₀^2 + mgh = ½mv^2, so v = √[[v₀^2 + 2gh]]'], sub: [`v = √[[${gtext(V0)}^2 + 2(9.8 m/s²)(${H.text})]]`], solve: [`v = √[[${fmt(v0 * v0)} + ${ap(2 * GRAV * h)}]] m/s`, `v = √[[${ap(v0 * v0 + 2 * GRAV * h)}]] m/s`],
    wrong: [{ v: v0 + Math.sqrt(2 * GRAV * h), why: 'added the speeds instead of the energies' }, { v: Math.sqrt(2 * GRAV * h), why: 'forgot the starting speed' }, { v: Math.sqrt(v0 * v0 + 20 * h), why: 'used g = 10' }],
  });
}

function genPower(lvl) {
  const variant = pick(lvl === 1 ? ['P', 't', 'W'] : lvl === 2 ? ['P', 'P_Fd', 't'] : ['lift', 'P_Fd', 't']);
  const who = pick(['A motor', 'An elevator motor', 'A winch', 'A crane', 'A pump']);
  if (variant === 'P' || variant === 't' || variant === 'W') {
    const W = lvl === 1 ? 100 * ri(2, 90) : ri(200, 90000), t = lvl === 1 ? pick([2, 4, 5, 10, 20, 25, 50]) : ri(3, 300);
    const Wg = gq('W', 'W', W, 'J'), T = gq('t', 't', t, 's');
    if (variant === 'P') {
      return makeQ('power', lvl, {
        variant, prompt: `${who} does ${Wg.text} of work in ${T.text}. What is its power output?`,
        givens: [Wg, T], find: { sym: 'P', name: 'power' }, value: W / t, unit: 'W', rule: { sf: 3 },
        eq: ['P = [[W || t]]'], sub: [`P = [[${Wg.text} || ${T.text}]]`],
        wrong: [{ v: W * t, why: 'multiplied' }, { v: t / W, why: 'divided the wrong way round' }, { v: W / t / 1000, why: 'converted to kW' }],
      });
    }
    const Pw = clean(Number((W / t).toPrecision(3)));
    const Pg = gq('P', 'P', Pw, 'W');
    if (variant === 't') {
      return makeQ('power', lvl, {
        variant, prompt: `How long does it take a ${Pg.text} ${who.replace(/^An? /, '').toLowerCase()} to do ${Wg.text} of work?`,
        givens: [Wg, Pg], find: { sym: 't', name: 'time' }, value: W / Pw, unit: 's', rule: { sf: 3 },
        eq: ['P = [[W || t]]', 't = [[W || P]]'], sub: [`t = [[${Wg.text} || ${Pg.text}]]`],
        wrong: [{ v: W * Pw, why: 'multiplied' }, { v: Pw / W, why: 'divided the wrong way round' }, { v: W / Pw / 60, why: 'converted to minutes' }],
      });
    }
    return makeQ('power', lvl, {
      variant, prompt: `${who} with a power output of ${Pg.text} runs for ${T.text}. How much work does it do?`,
      givens: [Pg, T], find: { sym: 'W', name: 'work' }, value: Pw * t, unit: 'J', rule: { sf: 3 },
      eq: ['P = [[W || t]]', 'W = Pt'], sub: [`W = (${Pg.text})(${T.text})`],
      wrong: [{ v: Pw / t, why: 'divided' }, { v: t / Pw, why: 'divided the wrong way round' }, { v: Pw + t, why: 'added' }],
    });
  }
  if (variant === 'P_Fd') {
    const F = ri(20, 3000), d = ri(2, 80), t = ri(2, 60);
    const Fg = gq('F', 'F', F, 'N'), D = gq('d', 'd', d, 'm'), T = gq('t', 't', t, 's');
    return makeQ('power', lvl, {
      variant, prompt: `A winch pulls a boat ${D.text} up a ramp with a steady force of ${Fg.text} along the ramp, taking ${T.text}. What power does the winch deliver?`,
      givens: [Fg, D, T], find: { sym: 'P', name: 'power' }, value: (F * d) / t, unit: 'W', rule: { sf: 3 },
      eq: ['W = Fd', 'P = [[W || t]] = [[Fd || t]]'], sub: [`P = [[(${Fg.text})(${D.text}) || ${T.text}]]`], solve: [`P = [[${P(F * d, 'J')} || ${T.text}]]`],
      wrong: [{ v: F * d, why: 'stopped at the work' }, { v: (F * t) / d, why: 'swapped d and t' }, { v: F * d * t, why: 'multiplied by the time' }],
    });
  }
  const m = ri(40, 90), h = dec(2, 20, 1), t = ri(3, 40);
  const M = gq('m', 'm', m, 'kg'), H = gq('h', 'h', h, 'm'), T = gq('t', 't', t, 's'), g = G_GIVEN();
  return makeQ('power', lvl, {
    variant, prompt: `A ${M.text} student runs up a staircase that rises ${H.text} in ${T.text}. What power does the student develop lifting their body? ${G_NOTE}`,
    givens: [M, H, T, g], find: { sym: 'P', name: 'power' }, value: (m * GRAV * h) / t, unit: 'W', rule: { sf: 3 }, uses: ['g'],
    eq: ['W = mgh', 'P = [[W || t]] = [[mgh || t]]'], sub: [`P = [[(${M.text})(9.8 m/s²)(${H.text}) || ${T.text}]]`], solve: [`P = [[${ap(m * GRAV * h)} J || ${T.text}]]`],
    wrong: [{ v: (m * h) / t, why: 'forgot g' }, { v: (m * 10 * h) / t, why: 'used g = 10' }, { v: m * GRAV * h, why: 'stopped at the work' }, { v: m * GRAV * h * t, why: 'multiplied by the time' }],
  });
}

function genEfficiency(lvl) {
  const variant = pick(lvl === 1 ? ['eff', 'out'] : lvl === 2 ? ['eff', 'out', 'in'] : ['motor', 'in', 'eff']);
  const dev = pick(['An electric motor', 'A light bulb', 'A car engine', 'A pulley system', 'A solar panel', 'A kettle']);
  if (variant === 'motor') {
    const Pin = 50 * ri(4, 60), t = ri(4, 60), m = ri(5, 200), h = dec(1, 20, 1);
    const eff = (m * GRAV * h) / (Pin * t);
    if (eff < 0.1 || eff > 0.95) retry();
    const Pg = gq('P', 'P_{in}', Pin, 'W'), T = gq('t', 't', t, 's'), M = gq('m', 'm', m, 'kg'), H = gq('h', 'h', h, 'm'), g = G_GIVEN();
    return makeQ('efficiency', lvl, {
      variant, prompt: `A ${Pg.text} electric motor runs for ${T.text} and lifts a ${M.text} load ${H.text} straight up. What is the motor's efficiency, as a percentage? ${G_NOTE}`,
      givens: [Pg, T, M, H, g], find: { sym: 'efficiency', name: 'useful energy out ÷ energy in' }, value: eff * 100, unit: '%', rule: { dp: 1 }, uses: ['g'],
      eq: ['energy in = P_{in}t', 'useful energy out = mgh', 'efficiency = [[useful out || in]] × 100%'],
      sub: [`in = (${Pg.text})(${T.text}) = ${P(Pin * t, 'J')}`, `out = (${M.text})(9.8 m/s²)(${H.text}) = ${ap(m * GRAV * h)} J`, `efficiency = [[${ap(m * GRAV * h)} J || ${P(Pin * t, 'J')}]] × 100%`],
      wrong: [{ v: ((Pin * t) / (m * GRAV * h)) * 100, why: 'divided the wrong way round' }, { v: ((m * h) / (Pin * t)) * 100, why: 'forgot g' }, { v: ((m * GRAV * h) / Pin) * 100, why: 'forgot the time' }],
    });
  }
  const In = lvl === 1 ? 100 * ri(2, 50) : ri(200, 20000);
  const pctv = lvl === 1 ? 5 * ri(4, 19) : ri(8, 95);
  const Out = clean((In * pctv) / 100);
  const I = gq('Ein', 'E_{in}', In, 'J', { note: 'energy in' }), O = gq('Eout', 'E_{out}', Out, 'J', { note: 'useful energy out' }), E = gq('eff', 'efficiency', pctv, '%');
  if (variant === 'eff') {
    const o2 = lvl === 1 ? Out : ri(Math.round(In * 0.08), Math.round(In * 0.95));
    const O2 = gq('Eout', 'E_{out}', o2, 'J', { note: 'useful energy out' });
    return makeQ('efficiency', lvl, {
      variant, prompt: `${dev} takes in ${I.text} of energy and gives out ${O2.text} of useful energy. What is its efficiency, as a percentage?`,
      givens: [I, O2], find: { sym: 'efficiency', name: '' }, value: (o2 / In) * 100, unit: '%', rule: { dp: 1 },
      eq: ['efficiency = [[useful energy out || energy in]] × 100%'], sub: [`efficiency = [[${O2.text} || ${I.text}]] × 100%`], solve: [`efficiency = ${ap(o2 / In)} × 100%`],
      notes: ['The rest of the energy is wasted, mostly as heat.'],
      wrong: [{ v: (In / o2) * 100, why: 'divided the wrong way round' }, { v: ((In - o2) / In) * 100, why: 'found the wasted share' }, { v: o2 / In, why: 'forgot × 100%' }],
    });
  }
  if (variant === 'out') {
    return makeQ('efficiency', lvl, {
      variant, prompt: `${dev} is ${E.text} efficient. How much useful energy does it give out from ${I.text} of energy in?`,
      givens: [I, E], find: { sym: 'E_{out}', name: 'useful energy out' }, value: Out, unit: 'J', rule: { sf: 3 },
      eq: ['efficiency = [[E_{out} || E_{in}]] × 100%', 'E_{out} = [[efficiency || 100%]] × E_{in}'], sub: [`E_{out} = ${fmt(pctv / 100)} × ${I.text}`],
      wrong: [{ v: In * pctv, why: 'forgot to change the percent to a decimal' }, { v: In - pctv, why: 'subtracted' }, { v: In * (1 - pctv / 100), why: 'found the wasted energy' }],
    });
  }
  const Out2 = lvl === 1 ? Out : 10 * ri(5, 2000);
  const O3 = gq('Eout', 'E_{out}', Out2, 'J', { note: 'useful energy out' });
  return makeQ('efficiency', lvl, {
    variant, prompt: `${dev} is ${E.text} efficient and gives out ${O3.text} of useful energy. How much energy does it take in?`,
    givens: [O3, E], find: { sym: 'E_{in}', name: 'energy in' }, value: Out2 / (pctv / 100), unit: 'J', rule: { sf: 3 },
    eq: ['efficiency = [[E_{out} || E_{in}]] × 100%', 'E_{in} = [[E_{out} || efficiency ÷ 100%]]'], sub: [`E_{in} = [[${O3.text} || ${fmt(pctv / 100)}]]`],
    notes: ['The energy in is always more than the useful energy out.'],
    wrong: [{ v: Out2 * (pctv / 100), why: 'multiplied by the efficiency' }, { v: Out2 / pctv, why: 'forgot to change the percent to a decimal' }, { v: Out2 * (1 + pctv / 100), why: 'added the percent on' }],
  });
}

/* =================================================== unit 6: momentum */
function genMomentum(lvl) {
  const variant = pick(lvl === 1 ? ['p', 'p', 'v'] : ['p', 'v', 'm']);
  let M, obj, grams = 0;
  if (lvl === 3 && chance(0.6)) { const o = pick(SMALL); grams = ri(o.lo, o.hi); obj = o.n; M = gq('m', 'm', grams / 1000, 'kg', { text: `${grams} g`, line: `m = ${grams} g = ${fmt(grams / 1000)} kg` }); } else {
    const o = pick([{ n: 'football player', lo: 70, hi: 130 }, { n: 'truck', lo: 3000, hi: 9000 }, { n: 'bowling ball', lo: 4, hi: 7 }, { n: 'cart', lo: 1, hi: 20 }, { n: 'bicycle and rider', lo: 60, hi: 110 }]);
    obj = o.n; M = gq('m', 'm', lvl === 1 ? ri(o.lo, o.hi) : dec(o.lo, o.hi, o.hi < 10 ? 1 : 0), 'kg');
  }
  const v = lvl === 1 ? ri(1, 30) : dec(0.5, 40, 1);
  const V = gq('v', 'v', v, 'm/s'), m = M.v;
  const p = clean(m * v);
  const Pg = gq('p', 'p', p, 'p');
  const gramsNote = grams ? ['Grams to kilograms first: divide by 1,000.'] : [];
  if (variant === 'p') {
    return makeQ('momentum', lvl, {
      variant, prompt: `What is the momentum of a ${M.text} ${obj} moving at ${V.text}?`,
      givens: [M, V], find: { sym: 'p', name: 'momentum' }, value: p, unit: 'p', rule: { sf: 3 },
      eq: ['p = mv'], sub: [`p = (${fmt(m)} kg)(${V.text})`], notes: gramsNote, tips: gramsNote,
      wrong: [{ v: m / v, why: 'divided' }, { v: 0.5 * m * v * v, why: 'found the kinetic energy' }, { v: m + v, why: 'added' }, ...(grams ? [{ v: grams * v, why: 'left the mass in grams' }] : [])],
    });
  }
  if (variant === 'v') {
    return makeQ('momentum', lvl, {
      variant, prompt: `A ${M.text} ${obj} has a momentum of ${Pg.text}. How fast is it moving?`,
      givens: [Pg, M], find: { sym: 'v', name: 'speed' }, value: p / m, unit: 'm/s', rule: { sf: 3 },
      eq: ['p = mv', 'v = [[p || m]]'], sub: [`v = [[${Pg.text} || ${fmt(m)} kg]]`], notes: gramsNote, tips: gramsNote,
      wrong: [{ v: p * m, why: 'multiplied' }, { v: m / p, why: 'divided the wrong way round' }, { v: p - m, why: 'subtracted' }],
    });
  }
  return makeQ('momentum', lvl, {
    variant, prompt: `An object moving at ${V.text} has a momentum of ${Pg.text}. What is its mass?`,
    givens: [Pg, V], find: { sym: 'm', name: 'mass' }, value: p / v, unit: 'kg', rule: { sf: 3 },
    eq: ['p = mv', 'm = [[p || v]]'], sub: [`m = [[${Pg.text} || ${V.text}]]`],
    wrong: [{ v: p * v, why: 'multiplied' }, { v: v / p, why: 'divided the wrong way round' }, { v: p - v, why: 'subtracted' }],
  });
}

function genImpulse(lvl) {
  const variant = pick(lvl === 1 ? ['J_Ft', 'J_dp'] : lvl === 2 ? ['J_Ft', 'J_dp', 'F', 'dt'] : ['bounce', 'F', 'dt']);
  if (variant === 'J_Ft') {
    const F = lvl === 1 ? 10 * ri(2, 80) : ri(20, 3000), t = lvl === 1 ? pick([0.1, 0.2, 0.5, 1, 2, 3]) : dec(0.01, 0.9, 2);
    const Fg = gq('F', 'F', F, 'N'), T = gq('t', 'Δt', t, 's');
    return makeQ('impulse', lvl, {
      variant, prompt: `A bat pushes on a ball with an average force of ${Fg.text} for ${T.text}. What impulse does it give the ball?`,
      givens: [Fg, T], find: { sym: 'J', name: 'impulse' }, value: F * t, unit: 'Ns', rule: { sf: 3 },
      eq: ['J = FΔt'], sub: [`J = (${Fg.text})(${T.text})`],
      wrong: [{ v: F / t, why: 'divided' }, { v: t / F, why: 'divided the wrong way round' }, { v: F + t, why: 'added' }],
    });
  }
  if (variant === 'J_dp') {
    const m = lvl === 1 ? ri(1, 60) : dec(0.1, 60, 1);
    const M = gq('m', 'm', m, 'kg');
    const v0 = ri(0, 15), v = v0 + ri(2, 20);
    const V0 = gq('v0', 'v₀', v0, 'm/s', { note: v0 ? '' : 'starts at rest' }), V = gq('v', 'v', v, 'm/s');
    return makeQ('impulse', lvl, {
      variant, prompt: `A ${M.text} cart speeds up from ${V0.text} to ${V.text} in a straight line. What impulse acted on it?`,
      givens: [M, V0, V], find: { sym: 'J', name: 'impulse = change in momentum' }, value: m * (v - v0), unit: 'Ns', rule: { sf: 3 },
      eq: ['J = Δp = m(v − v₀)'], sub: [`J = (${M.text})(${V.text} − ${V0.text})`], solve: [`J = (${M.text})(${P(v - v0, 'm/s')})`],
      wrong: [{ v: m * v, why: 'used only the final velocity' }, { v: m * (v + v0), why: 'added the velocities' }, ...(v0 ? [{ v: m * v0, why: 'used only the starting velocity' }] : [{ v: 0.5 * m * v * v, why: 'found the kinetic energy' }])],
    });
  }
  if (variant === 'F' || variant === 'dt') {
    // each object gets a believable mass and speed
    const o = pick([
      { obj: 'ball', m: () => dec(0.05, 0.6, 2), v: [3, 40], F: [5, 600] },
      { obj: 'egg', m: () => dec(0.05, 0.07, 3), v: [2, 9], F: [1, 40], stop: 'lands in a padded box and' },
      { obj: 'stunt dummy', m: () => ri(50, 90), v: [5, 25], F: [500, 20000] },
      { obj: 'package', m: () => dec(1, 30, 1), v: [2, 15], F: [20, 3000] },
    ]);
    const obj = o.obj, m = o.m(), v0 = ri(o.v[0], o.v[1]), t = dec(0.02, 0.8, 2);
    const M = gq('m', 'm', m, 'kg');
    const V0 = gq('v0', 'v₀', v0, 'm/s'), T = gq('t', 'Δt', t, 's');
    const how = o.stop ? `${o.stop} ` : '';
    if (variant === 'F') {
      return makeQ('impulse', lvl, {
        variant, prompt: `A ${M.text} ${obj} moving at ${V0.text} ${how}is brought to a stop in ${T.text}. What is the size of the average force that stops it?`,
        givens: [M, V0, T], find: { sym: 'F', name: 'size of the average force' }, value: (m * v0) / t, unit: 'N', rule: { sf: 3 },
        eq: ['FΔt = Δp = m(v − v₀)', 'size: F = [[mv₀ || Δt]]'], sub: [`F = [[(${M.text})(${V0.text}) || ${T.text}]]`], solve: [`F = [[${ap(m * v0)} kg·m/s || ${T.text}]]`],
        notes: ['A longer stopping time means a smaller force — the idea behind airbags and padding.'],
        wrong: [{ v: m * v0 * t, why: 'multiplied by the time' }, { v: m * v0, why: 'stopped at the momentum' }, { v: v0 / t, why: 'forgot the mass' }],
      });
    }
    const F = ri(o.F[0], o.F[1]);
    const Fg = gq('F', 'F', F, 'N');
    return makeQ('impulse', lvl, {
      variant, prompt: `A ${M.text} ${obj} moving at ${V0.text} ${how}is stopped by an average force of ${Fg.text}. How long does it take to stop?`,
      givens: [M, V0, Fg], find: { sym: 'Δt', name: 'stopping time' }, value: (m * v0) / F, unit: 's', rule: { sf: 3 },
      eq: ['FΔt = mΔv', 'Δt = [[mv₀ || F]]'], sub: [`Δt = [[(${M.text})(${V0.text}) || ${Fg.text}]]`],
      wrong: [{ v: F / (m * v0), why: 'divided the wrong way round' }, { v: m * v0 * F, why: 'multiplied' }, { v: v0 / F, why: 'forgot the mass' }],
    });
  }
  const v0 = ri(3, 30), v = ri(2, v0);
  const mb = dec(0.05, 1.5, 2);
  const MB = gq('m', 'm', mb, 'kg'), V0 = gq('v0', 'v₀', v0, 'm/s', { note: 'toward the wall' }), V = gq('v', 'v', v, 'm/s', { note: 'back, away from the wall' });
  return makeQ('impulse', lvl, {
    variant, prompt: `A ${MB.text} ball hits a wall at ${V0.text} and bounces straight back at ${V.text}. What is the size of the impulse the wall gives the ball?`,
    givens: [MB, V0, V], find: { sym: 'J', name: 'size of the impulse' }, value: mb * (v + v0), unit: 'Ns', rule: { sf: 3 },
    eq: ['Take "away from the wall" as +: v₀ = −' + V0.text + ', v = +' + V.text, 'J = m(v − v₀)'], sub: [`J = (${MB.text})(${V.text} − (−${V0.text}))`], solve: [`J = (${MB.text})(${P(v + v0, 'm/s')})`],
    notes: ['Reversing direction doubles up the change: the speeds add.'],
    wrong: [{ v: mb * (v0 - v), why: 'ignored the change of direction' }, { v: mb * v0, why: 'used only the incoming speed' }, { v: mb * v, why: 'used only the outgoing speed' }],
  });
}

function genInelastic(lvl) {
  const variant = lvl === 1 ? 'rest' : lvl === 2 ? 'same' : pick(['opposite', 'opposite', 'same']);
  const sc = pick([
    { a: 'railroad car', lo: 10000, hi: 40000, step: 1000, vlo: 1, vhi: 5, verb: 'couples to' },
    { a: 'bumper car', lo: 150, hi: 300, step: 10, vlo: 1, vhi: 4, verb: 'hits and sticks to' },
    { a: 'lab cart', lo: 0.5, hi: 3, step: 0.1, vlo: 0.2, vhi: 2, verb: 'collides and locks with' },
    { a: 'football player', lo: 70, hi: 130, step: 1, vlo: 2, vhi: 9, verb: 'tackles and holds on to' },
  ]);
  const massOf = () => clean(Math.round(dec(sc.lo, sc.hi, 1) / sc.step) * sc.step);
  const m1 = massOf(), m2 = massOf();
  const v1 = dec(sc.vlo, sc.vhi, 1);
  let v2 = 0;
  if (variant === 'same') v2 = dec(sc.vlo / 2, v1 - 0.1, 1);
  if (variant === 'opposite') v2 = -dec(sc.vlo, sc.vhi, 1);
  if (variant === 'same' && !(v2 > 0 && v2 < v1)) retry();
  const M1 = gq('m1', 'm₁', m1, 'kg'), M2 = gq('m2', 'm₂', m2, 'kg'), V1 = gq('v1', 'v₁', v1, 'm/s');
  const V2 = gq('v2', 'v₂', v2, 'm/s', { text: withUnit(fmt(Math.abs(v2)), 'm/s'), line: `v₂ = ${pretty(fmt(v2))} m/s`, note: variant === 'rest' ? 'at rest' : variant === 'opposite' ? 'west, so negative' : '' });
  const vf = (m1 * v1 + m2 * v2) / (m1 + m2);
  const name = sc.a;
  const prompt = variant === 'rest' ? `A ${M1.text} ${name} moving at ${V1.text} ${sc.verb} a ${M2.text} ${name} at rest. They move off together. What is their velocity just after the collision?`
    : variant === 'same' ? `A ${M1.text} ${name} moving at ${V1.text} ${sc.verb} a ${M2.text} ${name} moving the same way at ${V2.text}. They move off together. What is their velocity just after the collision?`
      : `A ${M1.text} ${name} moving east at ${V1.text} ${sc.verb} a ${M2.text} ${name} moving west at ${V2.text}. They move off together. What is their velocity just after the collision? Take east as positive.`;
  const p1 = m1 * v1, p2 = m2 * v2;
  return makeQ('inelastic', lvl, {
    variant, prompt,
    givens: variant === 'rest' ? [M1, V1, M2, { ...V2, noText: true }] : [M1, V1, M2, V2], find: { sym: 'v′', name: 'velocity of the pair after the collision' }, value: vf, unit: 'm/s', rule: { dp: 2 },
    signed: variant === 'opposite', dirs: variant === 'opposite' ? EW : null,
    eq: ['Momentum is conserved: m₁v₁ + m₂v₂ = (m₁ + m₂)v′', 'v′ = [[m₁v₁ + m₂v₂ || m₁ + m₂]]'],
    sub: [`v′ = [[(${M1.text})(${V1.text}) + (${M2.text})(${pretty(fmt(v2))} m/s) || ${M1.text} + ${M2.text}]]`],
    solve: [`v′ = [[${ap(p1)} + (${ap(p2)}) kg·m/s || ${P(m1 + m2, 'kg')}]]`.replace('+ (-', '+ (−'), `v′ = [[${ap(p1 + p2)} kg·m/s || ${P(m1 + m2, 'kg')}]]`],
    notes: variant === 'opposite' ? [vf < 0 ? 'Negative: the pair moves west.' : 'Positive: the pair moves east.'] : ['The pair moves slower than the first one did: the same momentum is shared by more mass.'],
    wrong: [{ v: (v1 + v2) / 2, why: 'averaged the velocities' }, { v: (m1 * v1 - m2 * v2) / (m1 + m2), why: 'sign slip' }, { v: (m1 * v1 + m2 * v2) / m1, why: 'divided by one mass only' }, { v: v1, why: 'assumed the speed does not change' }],
  });
}

function genRecoil(lvl) {
  const variant = lvl === 1 ? 'speed' : lvl === 2 ? pick(['speed', 'velocity']) : pick(['velocity', 'find_v1', 'speed']);
  const sc = pick([
    { k: 'rifle', a: 'rifle', b: 'bullet', ma: [2.5, 6], mbg: [4, 20], vb: [300, 950], grams: true },
    { k: 'cannon', a: 'cannon', b: 'cannonball', ma: [400, 1500], mb: [4, 20], vb: [60, 200] },
    { k: 'skaters', a: 'skater', b: 'partner', ma: [40, 90], mb: [40, 90], vb: [1, 4] },
    { k: 'astronaut', a: 'astronaut', b: 'wrench', ma: [70, 130], mb: [0.5, 3], vb: [2, 12] },
  ]);
  const mA = sc.k === 'rifle' ? dec(sc.ma[0], sc.ma[1], 1) : ri(sc.ma[0], sc.ma[1]);
  let MB, mB;
  if (sc.grams && lvl > 1) { const g = ri(sc.mbg[0], sc.mbg[1]); mB = g / 1000; MB = gq('mb', 'm_{2}', mB, 'kg', { text: `${g} g`, line: `m_{2} = ${g} g = ${fmt(mB)} kg` }); } else {
    mB = sc.grams ? dec(0.004, 0.02, 3) : sc.k === 'astronaut' ? dec(sc.mb[0], sc.mb[1], 1) : ri(sc.mb[0], sc.mb[1]);
    MB = gq('mb', 'm_{2}', mB, 'kg');
  }
  const vB = sc.k === 'skaters' ? dec(sc.vb[0], sc.vb[1], 1) : ri(sc.vb[0], sc.vb[1]);
  const MA = gq('ma', 'm_{1}', mA, 'kg'), VB = gq('vb', 'v_{2}', vB, 'm/s');
  const vA = -(mB * vB) / mA;
  const setup = sc.k === 'rifle' ? `A ${MA.text} rifle fires a ${MB.text} bullet at ${VB.text}.`
    : sc.k === 'cannon' ? `A ${MA.text} cannon on frictionless wheels fires a ${MB.text} cannonball at ${VB.text}.`
      : sc.k === 'skaters' ? `Two skaters stand still on ice. The ${MA.text} skater pushes off a ${MB.text} partner, who glides away at ${VB.text}.`
        : `A ${MA.text} astronaut floating at rest throws a ${MB.text} wrench away at ${VB.text}.`;
  const who = sc.k === 'rifle' ? 'rifle' : sc.k === 'cannon' ? 'cannon' : sc.k === 'skaters' ? 'first skater' : 'astronaut';
  const forward = sc.k === 'rifle' ? "the bullet's direction" : sc.k === 'cannon' ? "the cannonball's direction" : sc.k === 'skaters' ? "the partner's direction" : "the wrench's direction";
  const eqs = ['Everything starts at rest, so the total momentum stays 0:', 'm_{1}v_{1} + m_{2}v_{2} = 0', 'v_{1} = −[[m_{2}v_{2} || m_{1}]]'];
  if (variant === 'find_v1') {
    const vs = clean(Number(Math.abs(vA).toPrecision(3)));
    const VA = gq('va', 'v_{1}', vs, 'm/s', { note: 'recoil speed' });
    const set2 = sc.k === 'skaters' ? `Two skaters stand still on ice and push apart. The ${MA.text} skater moves off at ${VA.text}.` : sc.k === 'astronaut' ? `A ${MA.text} astronaut floating at rest throws a ${MB.text} wrench and recoils at ${VA.text}.` : `A ${MA.text} ${sc.a} recoils at ${VA.text} when it fires a ${MB.text} ${sc.b}.`;
    return makeQ('recoil', lvl, {
      variant, prompt: sc.k === 'skaters' ? `${set2} The partner has a mass of ${MB.text}. How fast does the partner move?` : `${set2} How fast does the ${sc.b} move?`,
      givens: [MA, MB, VA], find: { sym: 'v_{2}', name: `speed of the ${sc.k === 'skaters' ? 'partner' : sc.b}` }, value: (mA * vs) / mB, unit: 'm/s', rule: { sf: 3 },
      eq: ['The momenta are equal and opposite: m_{1}v_{1} = m_{2}v_{2}', 'v_{2} = [[m_{1}v_{1} || m_{2}]]'], sub: [`v_{2} = [[(${MA.text})(${VA.text}) || ${MB.text}]]`],
      wrong: [{ v: (mB * vs) / mA, why: 'swapped the masses' }, { v: mA * vs, why: 'forgot to divide by the mass' }, { v: vs, why: 'assumed equal speeds' }],
    });
  }
  const signedQ = variant === 'velocity';
  return makeQ('recoil', lvl, {
    variant, prompt: signedQ ? `${setup} What is the ${who}'s recoil velocity? Take ${forward} as positive.` : `${setup} How fast does the ${who} recoil?`,
    givens: [MA, MB, VB], find: { sym: 'v_{1}', name: signedQ ? 'recoil velocity' : 'recoil speed' }, value: signedQ ? vA : -vA, unit: 'm/s', rule: { sf: 3 },
    signed: signedQ, dirs: signedQ ? { pos: ['forward', 'forwards'], neg: ['backward', 'backwards', 'back'] } : null,
    eq: eqs, sub: [`v_{1} = −[[(${MB.text})(${VB.text}) || ${MA.text}]]`], solve: [`v_{1} = −[[${ap(mB * vB)} kg·m/s || ${MA.text}]]`],
    finalLine: signedQ ? null : () => mline(`v_{1} = ${pretty(settle(vA, { sf: 3 }).str)} m/s, so the ${who} recoils at `, boxed(withUnit(settle(-vA, { sf: 3 }).str, 'm/s'))),
    brief: signedQ ? null : (ans, eqs2) => `The recoil speed is the size of v₁: |v₁| = ${plainLine('[[m_{2}v_{2} || m_{1}]]')} = ${plainLine(`[[(${MB.text})(${VB.text}) || ${MA.text}]]`)} ${eqs2} ${ans}`,
    notes: [signedQ ? 'The minus sign means it moves backward, opposite to what was pushed away.' : 'The minus sign only says "backward"; the speed is the size.'],
    wrong: [{ v: (signedQ ? -1 : 1) * ((mA * vB) / mB), why: 'swapped the masses' }, { v: signedQ ? -vA : mB * vB, why: signedQ ? 'lost the minus sign' : 'forgot to divide by the mass' }, { v: (signedQ ? -1 : 1) * vB, why: 'assumed equal speeds' }],
  });
}

/* ========================================================= unit 7: waves */
function genWaves(lvl) {
  const sound = chance(0.3);
  const variant = sound ? pick(['f', 'lambda']) : pick(lvl === 1 ? ['v', 'v', 'f', 'lambda'] : ['v', 'f', 'lambda']);
  if (sound) {
    const VS = gq('v', 'v', V_SOUND, 'm/s', { k: true, note: 'speed of sound in air' });
    if (variant === 'lambda') {
      const f = lvl === 1 ? pick([98, 196, 245, 343, 490, 686, 1372]) : 10 * ri(10, 200);
      const F = gq('f', 'f', f, 'Hz');
      return makeQ('waves', lvl, {
        variant: 'sound_lambda', prompt: `A note of ${F.text} is played in air, where sound travels at 343 m/s. What is its wavelength?`,
        givens: [F, VS], find: { sym: 'λ', name: 'wavelength' }, value: V_SOUND / f, unit: 'm', rule: { sf: 3 }, uses: ['vs'],
        eq: ['v = fλ', 'λ = [[v || f]]'], sub: [`λ = [[343 m/s || ${F.text}]]`],
        wrong: [{ v: V_SOUND * f, why: 'multiplied' }, { v: f / V_SOUND, why: 'divided the wrong way round' }, { v: V_SOUND / f / 2, why: 'halved' }],
      });
    }
    const l = lvl === 1 ? pick([0.5, 0.7, 1, 1.4, 2, 3.5, 0.25]) : dec(0.2, 3.4, 2);
    const L = gq('lambda', 'λ', l, 'm');
    return makeQ('waves', lvl, {
      variant: 'sound_f', prompt: `A sound wave in air has a wavelength of ${L.text}. Sound travels at 343 m/s. What is its frequency?`,
      givens: [L, VS], find: { sym: 'f', name: 'frequency' }, value: V_SOUND / l, unit: 'Hz', rule: { sf: 3 }, uses: ['vs'],
      eq: ['v = fλ', 'f = [[v || λ]]'], sub: [`f = [[343 m/s || ${L.text}]]`],
      wrong: [{ v: V_SOUND * l, why: 'multiplied' }, { v: l / V_SOUND, why: 'divided the wrong way round' }, { v: V_SOUND - l, why: 'subtracted' }],
    });
  }
  const sc = pick([
    { s: 'A wave on a rope', f: [0.5, 8], l: [0.2, 4] },
    { s: 'A water wave', f: [0.1, 2], l: [0.5, 12] },
    { s: 'A wave on a guitar string', f: [80, 900], l: [0.3, 1.5] },
    { s: 'A wave on a stretched spring', f: [0.5, 6], l: [0.1, 2] },
  ]);
  const f = lvl === 1 ? ri(Math.max(2, Math.ceil(sc.f[0])), Math.max(2, Math.floor(sc.f[1]))) : dec(sc.f[0], sc.f[1], sc.f[1] < 10 ? 1 : 0);
  const l = lvl === 1 ? dec(sc.l[0], sc.l[1], 1) : dec(sc.l[0], sc.l[1], 2);
  // a given speed is written to 3 significant figures, like a measurement
  const v = variant === 'v' ? clean(f * l) : clean(Number((f * l).toPrecision(3)));
  if (info(v).sig > 4) retry();
  const F = gq('f', 'f', f, 'Hz'), L = gq('lambda', 'λ', l, 'm'), V = gq('v', 'v', v, 'm/s');
  const inCm = lvl === 3 && variant !== 'lambda' && l < 1 && chance(0.6);
  if (inCm) { L.text = `${fmt(clean(l * 100))} cm`; L.line = `λ = ${L.text} = ${fmt(l)} m`; }
  if (variant === 'v') {
    return makeQ('waves', lvl, {
      variant, prompt: `${sc.s} has a frequency of ${F.text} and a wavelength of ${L.text}. What is its speed?`,
      givens: [F, L], find: { sym: 'v', name: 'wave speed' }, value: v, unit: 'm/s', rule: { sf: 3 },
      eq: ['v = fλ'], sub: [`v = (${F.text})(${fmt(l)} m)`],
      notes: inCm ? ['Centimeters to meters first: divide by 100.'] : [],
      wrong: [{ v: f / l, why: 'divided f by λ' }, { v: l / f, why: 'divided λ by f' }, { v: f + l, why: 'added' }, ...(inCm ? [{ v: f * l * 100, why: 'left λ in centimeters' }] : [])],
    });
  }
  if (variant === 'f') {
    return makeQ('waves', lvl, {
      variant, prompt: `${sc.s} travels at ${V.text} with a wavelength of ${L.text}. What is its frequency?`,
      givens: [V, L], find: { sym: 'f', name: 'frequency' }, value: v / l, unit: 'Hz', rule: { sf: 3 },
      eq: ['v = fλ', 'f = [[v || λ]]'], sub: [`f = [[${V.text} || ${fmt(l)} m]]`],
      notes: inCm ? ['Centimeters to meters first: divide by 100.'] : [],
      wrong: [{ v: v * l, why: 'multiplied' }, { v: l / v, why: 'divided the wrong way round' }, { v: v - l, why: 'subtracted' }, ...(inCm ? [{ v: v / (l * 100), why: 'left λ in centimeters' }] : [])],
    });
  }
  return makeQ('waves', lvl, {
    variant, prompt: `${sc.s} travels at ${V.text} with a frequency of ${F.text}. What is its wavelength?`,
    givens: [V, F], find: { sym: 'λ', name: 'wavelength' }, value: v / f, unit: 'm', rule: { sf: 3 },
    eq: ['v = fλ', 'λ = [[v || f]]'], sub: [`λ = [[${V.text} || ${F.text}]]`],
    wrong: [{ v: v * f, why: 'multiplied' }, { v: f / v, why: 'divided the wrong way round' }, { v: v - f, why: 'subtracted' }],
  });
}

const OSCILLATORS = [
  { s: 'A buoy bobs on passing waves', T: [1, 10], dp: 1 }, { s: 'A pendulum swings back and forth', T: [0.5, 4], dp: 1 },
  { s: 'A floating duck bobs up and down', T: [0.5, 5], dp: 1 }, { s: 'A mass on a spring bounces', T: [0.2, 3], dp: 2 },
  { s: 'A guitar string vibrates', f: [80, 1000] }, { s: 'A tuning fork vibrates', f: [128, 1024] }, { s: 'A speaker cone vibrates', f: [40, 2000] },
];
function genWaveperiod(lvl) {
  const variant = pick(lvl === 1 ? ['T', 'f'] : lvl === 2 ? ['T', 'f', 'f_count', 'T_count'] : ['v_T', 'f_count', 'T_count', 'v_T']);
  if (variant === 'v_T') {
    const l = dec(0.5, 20, 1), T = dec(0.5, 12, 1);
    const L = gq('lambda', 'λ', l, 'm'), Tg = gq('T', 'T', T, 's');
    return makeQ('waveperiod', lvl, {
      variant, prompt: `Ocean waves with a wavelength of ${L.text} pass a pier, one crest every ${Tg.text}. How fast are the waves moving?`,
      givens: [L, Tg], find: { sym: 'v', name: 'wave speed' }, value: l / T, unit: 'm/s', rule: { sf: 3 },
      eq: ['A wave moves one wavelength each period:', 'v = [[λ || T]] (the same as v = fλ with f = [[1 || T]])'], sub: [`v = [[${L.text} || ${Tg.text}]]`],
      wrong: [{ v: l * T, why: 'multiplied' }, { v: T / l, why: 'divided the wrong way round' }, { v: 1 / T, why: 'found the frequency' }],
    });
  }
  const o = pick(OSCILLATORS);
  // slow things are described by their period, fast ones by their frequency
  const period = o.T ? (lvl === 1 ? pick([0.25, 0.5, 1, 2, 4, 5, 8, 10].filter((x) => x >= o.T[0] && x <= o.T[1])) : dec(o.T[0], o.T[1], o.dp)) : null;
  const freq = o.f ? (lvl === 1 ? pick([100, 125, 200, 250, 400, 500, 1000].filter((x) => x >= o.f[0] && x <= o.f[1])) : ri(o.f[0], o.f[1])) : null;
  if ((o.T && period == null) || (o.f && freq == null)) retry();
  if (variant === 'T' || variant === 'f') {
    if (variant === 'T') {
      const f = freq != null ? freq : clean(Number((1 / period).toPrecision(2)));
      const F = gq('f', 'f', f, 'Hz');
      return makeQ('waveperiod', lvl, {
        variant, prompt: `${o.s} with a frequency of ${F.text}. What is the period?`,
        givens: [F], find: { sym: 'T', name: 'period' }, value: 1 / f, unit: 's', rule: { sf: 3 },
        eq: ['T = [[1 || f]]'], sub: [`T = [[1 || ${F.text}]]`],
        wrong: [{ v: f, why: 'gave the frequency' }, { v: 2 / f, why: 'doubled' }, { v: 1 / (2 * f), why: 'halved' }],
      });
    }
    const T = period != null ? period : clean(Number((1 / freq).toPrecision(2)));
    const Tg = gq('T', 'T', T, 's');
    return makeQ('waveperiod', lvl, {
      variant, prompt: `${o.s} with a period of ${Tg.text}. What is the frequency?`,
      givens: [Tg], find: { sym: 'f', name: 'frequency' }, value: 1 / T, unit: 'Hz', rule: { sf: 3 },
      eq: ['f = [[1 || T]]'], sub: [`f = [[1 || ${Tg.text}]]`],
      wrong: [{ v: T, why: 'gave the period' }, { v: 2 / T, why: 'doubled' }, { v: 1 / (2 * T), why: 'halved' }],
    });
  }
  const N = o.f ? 10 * ri(5, 60) : ri(5, 60);
  const t = o.f ? clean(Math.max(0.1, Math.round((N / freq) * 10) / 10)) : Math.max(1, Math.round(N * period));
  const Ng = gq('N', 'N', N, '', { text: fmt(N) }), Tt = gq('t', 't', t, 's');
  if (variant === 'f_count') {
    return makeQ('waveperiod', lvl, {
      variant, prompt: `${o.s} and makes ${Ng.text} complete cycles in ${Tt.text}. What is the frequency?`,
      givens: [Ng, Tt], find: { sym: 'f', name: 'cycles per second' }, value: N / t, unit: 'Hz', rule: { sf: 3 },
      eq: ['f = [[number of cycles || time]]'], sub: [`f = [[${Ng.text} || ${Tt.text}]]`],
      wrong: [{ v: t / N, why: 'found the period' }, { v: N * t, why: 'multiplied' }, { v: N / t / 60, why: 'divided by 60' }],
    });
  }
  return makeQ('waveperiod', lvl, {
    variant, prompt: `${o.s} and makes ${Ng.text} complete cycles in ${Tt.text}. What is the period?`,
    givens: [Ng, Tt], find: { sym: 'T', name: 'time for one cycle' }, value: t / N, unit: 's', rule: { sf: 3 },
    eq: ['T = [[time || number of cycles]]'], sub: [`T = [[${Tt.text} || ${Ng.text}]]`],
    wrong: [{ v: N / t, why: 'found the frequency' }, { v: N * t, why: 'multiplied' }, { v: (t / N) * 60, why: 'multiplied by 60' }],
  });
}

function genEcho(lvl) {
  const variant = pick(lvl === 1 ? ['d'] : lvl === 2 ? ['d', 't', 'oneway'] : ['t', 'd', 'oneway']);
  const VS = gq('vs', 'v', V_SOUND, 'm/s', { k: true, note: 'speed of sound in air' });
  const note = ' Use 343 m/s for the speed of sound.';
  if (variant === 'd') {
    const t = lvl === 1 ? dec(0.2, 4, 1) : dec(0.05, 6, 2);
    const T = gq('t', 't', t, 's', { note: 'there and back' });
    const where = pick(['a canyon wall', 'a cliff', 'the far wall of a gym', 'a building across the street']);
    return makeQ('echo', lvl, {
      variant, prompt: `You clap and hear the echo from ${where} ${T.text} later. How far away is it?${note}`,
      givens: [T, VS], find: { sym: 'd', name: 'distance to the wall' }, value: (V_SOUND * t) / 2, unit: 'm', rule: { dp: 1 }, uses: ['vs'],
      eq: ['The sound travels there and back: 2d = vt', 'd = [[vt || 2]]'], sub: [`d = [[(343 m/s)(${T.text}) || 2]]`], solve: [`d = [[${ap(V_SOUND * t)} m || 2]]`],
      notes: ['Halve it: the echo time covers the trip there and back.'],
      wrong: [{ v: V_SOUND * t, why: 'forgot to halve' }, { v: V_SOUND / t, why: 'divided' }, { v: (V_SOUND * t) / 4, why: 'halved twice' }],
    });
  }
  if (variant === 't') {
    const d = ri(20, 900);
    const D = gq('d', 'd', d, 'm');
    return makeQ('echo', lvl, {
      variant, prompt: `A cliff is ${D.text} away. How long after you shout do you hear the echo?${note}`,
      givens: [D, VS], find: { sym: 't', name: 'echo time' }, value: (2 * d) / V_SOUND, unit: 's', rule: { dp: 2 }, uses: ['vs'],
      eq: ['There and back is 2d:', 't = [[2d || v]]'], sub: [`t = [[2(${D.text}) || 343 m/s]]`],
      wrong: [{ v: d / V_SOUND, why: 'forgot the trip back' }, { v: V_SOUND / (2 * d), why: 'divided the wrong way round' }, { v: (2 * d) / 300, why: 'used 300 m/s' }],
    });
  }
  const t = dec(0.5, 12, 1);
  const T = gq('t', 't', t, 's');
  return makeQ('echo', lvl, {
    variant, prompt: `You see a lightning flash and hear its thunder ${T.text} later. About how far away was the lightning? (Light arrives almost instantly.)${note}`,
    givens: [T, VS], find: { sym: 'd', name: 'distance' }, value: V_SOUND * t, unit: 'm', rule: { dp: 0 }, uses: ['vs'],
    eq: ['The thunder travels one way only:', 'd = vt'], sub: [`d = (343 m/s)(${T.text})`],
    notes: ['No halving here — unlike an echo, the sound makes a one-way trip.'],
    wrong: [{ v: (V_SOUND * t) / 2, why: 'halved as if it were an echo' }, { v: V_SOUND / t, why: 'divided' }, { v: V_SOUND * t * 2, why: 'doubled' }],
  });
}

/* ========================================================= unit 8: light */
const C_GIVEN = () => gq('c', 'c', C_LIGHT, 'm/s', { k: true, text: '3.00 × 10^8 m/s', note: 'speed of light' });
function genEmwaves(lvl) {
  const variant = pick(['lambda', 'f']);
  const c = C_GIVEN();
  if (variant === 'lambda') {
    let F, what;
    if (lvl === 3 && chance(0.6)) {
      const mhz = dec(88, 108, 1);
      F = gq('f', 'f', mhz * 1e6, 'Hz', { text: `${fmt(mhz)} MHz`, line: `f = ${fmt(mhz)} MHz = ${sciExact(mhz * 1e6)} Hz` });
      what = 'An FM radio station broadcasts at';
    } else {
      const band = pick([['Green light has a frequency of', [5.3, 5.9], 14], ['Red light has a frequency of', [4.0, 4.8], 14], ['Violet light has a frequency of', [6.7, 7.5], 14], ['A microwave has a frequency of', [1, 9.9], 9], ['An X-ray has a frequency of', [1, 9.9], 18]]);
      const coef = lvl === 1 ? pick([1.5, 2, 2.5, 3, 4, 5, 6, 7.5]) : dec(band[1][0], band[1][1], 1);
      F = gsci('f', 'f', fmt(coef), band[2], 'Hz');
      what = band[0];
    }
    return makeQ('emwaves', lvl, {
      variant, prompt: `${what} ${F.text}. What is its wavelength? Use c = ${c.text}.`,
      givens: [F, c], find: { sym: 'λ', name: 'wavelength' }, value: C_LIGHT / F.v, unit: 'm', rule: { sf: 3 }, sci: sciFor(C_LIGHT / F.v), uses: ['c'],
      eq: ['c = fλ', 'λ = [[c || f]]'], sub: [`λ = [[3.00 × 10^8 m/s || ${sciExact(F.v)} Hz]]`],
      notes: ['Divide the numbers, then subtract the exponents.'],
      wrong: [{ v: F.v / C_LIGHT, why: 'divided the wrong way round' }, { v: (C_LIGHT / F.v) * 10, why: 'power-of-ten slip' }, { v: (C_LIGHT / F.v) / 10, why: 'power-of-ten slip' }],
    });
  }
  let L, what;
  if (lvl === 3 && chance(0.6)) {
    const nm = ri(400, 700);
    L = gq('lambda', 'λ', nm * 1e-9, 'm', { text: `${nm} nm`, line: `λ = ${nm} nm = ${sciExact(nm * 1e-9)} m` });
    what = 'Visible light has a wavelength of';
  } else {
    const band = pick([['Light from a laser has a wavelength of', [4, 7], -7], ['An infrared wave has a wavelength of', [1, 9.9], -6], ['A radio wave has a wavelength of', [1, 9.9], 0], ['A microwave has a wavelength of', [1, 9.9], -2]]);
    const coef = lvl === 1 ? pick([1.5, 2, 3, 4, 5, 6]) : dec(band[1][0], band[1][1], 1);
    L = band[2] === 0 ? gq('lambda', 'λ', coef, 'm') : gsci('lambda', 'λ', fmt(coef), band[2], 'm');
    what = band[0];
  }
  return makeQ('emwaves', lvl, {
    variant, prompt: `${what} ${L.text}. What is its frequency? Use c = ${c.text}.`,
    givens: [L, c], find: { sym: 'f', name: 'frequency' }, value: C_LIGHT / L.v, unit: 'Hz', rule: { sf: 3 }, sci: true, uses: ['c'],
    eq: ['c = fλ', 'f = [[c || λ]]'], sub: [`f = [[3.00 × 10^8 m/s || ${Math.abs(L.v) >= 1 && Math.abs(L.v) < 10 ? fmt(L.v) : sciExact(L.v)} m]]`],
    notes: ['Divide the numbers, then subtract the exponents.'],
    wrong: [{ v: L.v / C_LIGHT, why: 'divided the wrong way round' }, { v: (C_LIGHT / L.v) * 10, why: 'power-of-ten slip' }, { v: C_LIGHT * L.v, why: 'multiplied' }],
  });
}

const MEDIA = [{ n: 'air', v: 1.00 }, { n: 'water', v: 1.33 }, { n: 'glass', v: 1.50 }, { n: 'diamond', v: 2.42 }, { n: 'ice', v: 1.31 }, { n: 'ethanol', v: 1.36 }, { n: 'acrylic', v: 1.49 }, { n: 'crown glass', v: 1.52 }, { n: 'cubic zirconia', v: 2.15 }];
const nText = (x) => x.toFixed(2);
function genRefraction(lvl) {
  const variant = pick(['n', 'v']);
  const c = C_GIVEN();
  const med = pick(MEDIA.slice(1));
  if (variant === 'v') {
    const n = lvl === 1 ? med.v : dec(1.3, 2.4, 2);
    const N = gq('n', 'n', n, '', { text: nText(n) });
    return makeQ('refraction', lvl, {
      variant, prompt: lvl === 1 ? `The index of refraction of ${med.n} is ${N.text}. How fast does light travel in ${med.n}? Use c = ${c.text}.` : `A transparent plastic has an index of refraction of ${N.text}. How fast does light travel in it? Use c = ${c.text}.`,
      givens: [N, c], find: { sym: 'v', name: 'speed of light in the material' }, value: C_LIGHT / n, unit: 'm/s', rule: { sf: 3 }, sci: true, uses: ['c'],
      eq: ['n = [[c || v]]', 'v = [[c || n]]'], sub: [`v = [[3.00 × 10^8 m/s || ${N.text}]]`],
      notes: ['Light is always slower in a material than in a vacuum, so v is less than c.'],
      wrong: [{ v: C_LIGHT * n, why: 'multiplied' }, { v: n / C_LIGHT, why: 'divided the wrong way round' }, { v: (C_LIGHT / n) * 10, why: 'power-of-ten slip' }],
    });
  }
  const vv = C_LIGHT / (lvl === 1 ? med.v : dec(1.3, 2.4, 2));
  const coef = Number((vv / 1e8).toPrecision(3));
  const V = gsci('v', 'v', coef.toFixed(2), 8, 'm/s');
  return makeQ('refraction', lvl, {
    variant, prompt: `Light travels at ${V.text} in a clear material. What is the material's index of refraction? Use c = ${c.text}. (n has no unit.)`,
    givens: [V, c], find: { sym: 'n', name: 'index of refraction' }, value: C_LIGHT / V.v, unit: '', rule: { dp: 2 }, uses: ['c'],
    eq: ['n = [[c || v]]'], sub: [`n = [[3.00 × 10^8 m/s || ${V.text}]]`],
    notes: ['The units cancel: n has no unit, and it is always at least 1.'],
    wrong: [{ v: V.v / C_LIGHT, why: 'divided the wrong way round' }, { v: C_LIGHT / V.v / 10, why: 'power-of-ten slip' }, { v: (C_LIGHT - V.v) / 1e8, why: 'subtracted' }],
  });
}

function genSnell(lvl) {
  const variant = lvl === 3 ? pick(['theta2', 'theta1', 'n2']) : 'theta2';
  let a, b;
  if (lvl === 1) { a = MEDIA[0]; b = pick([MEDIA[1], MEDIA[2], MEDIA[6]]); } else { [a, b] = shuffle(MEDIA).slice(0, 2); }
  const n1 = a.v, n2 = b.v;
  const t1 = ri(10, 75);
  const N1 = gq('n1', 'n₁', n1, '', { text: nText(n1), note: a.n });
  const T1 = gq('t1', 'θ₁', t1, 'deg', { note: 'angle of incidence, from the normal' });
  if (variant === 'n2') return snellLiquid(lvl, a, N1, T1);
  const s2 = (n1 * Math.sin((t1 * Math.PI) / 180)) / n2;
  if (s2 >= 0.97) retry();
  const t2 = (Math.asin(s2) * 180) / Math.PI;
  const N2 = gq('n2', 'n₂', n2, '', { text: nText(n2), note: b.n });
  const into = `Light passes from ${a.n} (n = ${N1.text}) into ${b.n} (n = ${N2.text})`;
  const figAlt = (l1, l2) => `A ray of light in ${a.n} (top) meets a flat boundary with ${b.n} (bottom) and bends as it crosses. A dashed normal line stands at the boundary; the angle between the incoming ray and the normal is labelled ${l1}, and the angle between the outgoing ray and the normal is labelled ${l2}.`;
  const fig = (l1, l2) => snellFig({ t1, t2, top: `${a.n}, n = ${N1.text}`, bottom: `${b.n}, n = ${N2.text}`, l1, l2, alt: figAlt(l1, l2) });
  if (variant === 'theta2') {
    return makeQ('snell', lvl, {
      variant, prompt: `${into}. It hits the boundary at ${T1.text} to the normal. What is the angle of refraction?`,
      givens: [N1, N2, T1], find: { sym: 'θ₂', name: 'angle of refraction, from the normal' }, value: t2, unit: 'deg', rule: { dp: 1 },
      eq: ['n₁ sin θ₁ = n₂ sin θ₂', 'θ₂ = sin^-1([[n₁ sin θ₁ || n₂]])'], sub: [`θ₂ = sin^-1([[(${N1.text})(sin ${t1}°) || ${N2.text}]])`], solve: [`θ₂ = sin^-1(${ap(s2)})`],
      notes: [n2 > n1 ? 'Into a slower (higher n) material, the ray bends toward the normal: θ₂ < θ₁.' : 'Into a faster (lower n) material, the ray bends away from the normal: θ₂ > θ₁.', 'Check your calculator is in degree mode.'],
      wrong: [{ v: (Math.asin(Math.min(0.999, (n2 * Math.sin((t1 * Math.PI) / 180)) / n1)) * 180) / Math.PI, why: 'swapped n₁ and n₂' }, { v: (t1 * n1) / n2, why: 'used the angles instead of their sines' }, { v: Math.asin(s2), why: 'calculator in radian mode' }, { v: 90 - t2, why: 'measured from the surface' }],
      figure: fig(`θ₁ = ${t1}°`, 'θ₂ = ?'), figureAlt: figAlt(`θ₁ = ${t1}°`, 'θ₂ = ?'),
    });
  }
  const t2g = clean(Math.round(t2 * 10) / 10);
  const T2 = gq('t2', 'θ₂', t2g, 'deg', { note: 'angle of refraction' });
  // variant 'theta1'
  const s1 = (n2 * Math.sin((t2g * Math.PI) / 180)) / n1;
  if (s1 >= 0.99) retry();
  return makeQ('snell', lvl, {
    variant, prompt: `${into}. Inside the ${b.n} the ray makes ${T2.text} with the normal. What was the angle of incidence?`,
    givens: [N1, N2, T2], find: { sym: 'θ₁', name: 'angle of incidence' }, value: (Math.asin(s1) * 180) / Math.PI, unit: 'deg', rule: { dp: 1 },
    eq: ['n₁ sin θ₁ = n₂ sin θ₂', 'θ₁ = sin^-1([[n₂ sin θ₂ || n₁]])'], sub: [`θ₁ = sin^-1([[(${N2.text})(sin ${fmt(t2g)}°) || ${N1.text}]])`], solve: [`θ₁ = sin^-1(${ap(s1)})`],
    notes: ['Check your calculator is in degree mode.'],
    wrong: [{ v: (t2g * n2) / n1, why: 'used the angles instead of their sines' }, { v: Math.asin(s1), why: 'calculator in radian mode' }, { v: 90 - (Math.asin(s1) * 180) / Math.PI, why: 'measured from the surface' }],
    figure: fig('θ₁ = ?', `θ₂ = ${fmt(t2g)}°`), figureAlt: figAlt('θ₁ = ?', `θ₂ = ${fmt(t2g)}°`),
  });
}
/** Real clear liquids a student might meet: the answer is one of these (to within the rounding of θ₂). */
const LIQUIDS = [1.33, 1.36, 1.38, 1.40, 1.43, 1.44, 1.47, 1.50, 1.52, 1.54, 1.56, 1.60, 1.63];
function snellLiquid(lvl, a, N1, T1) {
  const n1 = a.v, t1 = T1.v;
  const target = pick(LIQUIDS.filter((x) => Math.abs(x - n1) >= 0.05));
  const s2 = (n1 * Math.sin((t1 * Math.PI) / 180)) / target;
  if (s2 >= 0.97) retry();
  const t2g = clean(Math.round(((Math.asin(s2) * 180) / Math.PI) * 10) / 10);
  if (Math.abs(t2g - t1) < 2) retry();
  const T2 = gq('t2', 'θ₂', t2g, 'deg', { note: 'angle of refraction' });
  const n2x = (n1 * Math.sin((t1 * Math.PI) / 180)) / Math.sin((t2g * Math.PI) / 180);
  if (n2x < 1.3 || n2x > 1.65) retry();
  const bend = t2g < t1 ? 'bends toward the dashed normal line' : 'bends away from the dashed normal line';
  const alt = `A ray of light in ${a.n} (top) meets a flat boundary with a clear liquid (bottom) and ${bend}. The incoming ray makes θ₁ = ${t1}° with the normal and the refracted ray makes θ₂ = ${fmt(t2g)}°.`;
  return makeQ('snell', lvl, {
    variant: 'n2', prompt: `Light passes from ${a.n} (n = ${N1.text}) into a clear liquid. It meets the surface at ${T1.text} to the normal and refracts to ${T2.text}. What is the liquid's index of refraction? (n has no unit.)`,
    givens: [N1, T1, T2], find: { sym: 'n₂', name: 'index of refraction of the liquid' }, value: n2x, unit: '', rule: { dp: 2 },
    eq: ['n₁ sin θ₁ = n₂ sin θ₂', 'n₂ = [[n₁ sin θ₁ || sin θ₂]]'], sub: [`n₂ = [[(${N1.text})(sin ${t1}°) || sin ${fmt(t2g)}°]]`], solve: [`n₂ = [[${ap(n1 * Math.sin((t1 * Math.PI) / 180))} || ${ap(Math.sin((t2g * Math.PI) / 180))}]]`],
    notes: [t2g < t1 ? 'The ray bent toward the normal, so the liquid is slower than the first material: n₂ > n₁.' : 'The ray bent away from the normal, so the liquid is faster than the first material: n₂ < n₁.'],
    wrong: [{ v: (n1 * t1) / t2g, why: 'used the angles instead of their sines' }, { v: (n1 * Math.sin((t2g * Math.PI) / 180)) / Math.sin((t1 * Math.PI) / 180), why: 'swapped the angles' }, { v: Math.sin((t1 * Math.PI) / 180) / Math.sin((t2g * Math.PI) / 180) / n1 + 1, why: 'mixed up the ratio' }],
    figure: snellFig({ t1, t2: t2g, top: `${a.n}, n = ${N1.text}`, bottom: 'liquid, n = ?', l1: `θ₁ = ${t1}°`, l2: `θ₂ = ${fmt(t2g)}°`, alt }),
    figureAlt: alt,
  });
}

function genLenses(lvl) {
  const variant = pick(lvl === 1 ? ['di', 'di', 'mag'] : lvl === 2 ? ['di', 'mirror', 'mag'] : ['hi', 'mirror', 'di']);
  const mirror = variant === 'mirror';
  let f, dO;
  if (lvl === 1 || (variant === 'mag')) {
    f = pick([5, 10, 12, 15, 20, 25, 30]) / 100;
    dO = clean(f * pick([1.5, 2, 3, 5, 6, 4]));
  } else {
    f = dec(0.05, 0.4, 2);
    dO = dec(0.06, 1.2, 2);
    if (Math.abs(dO - f) < 0.02) retry();
    if (dO < f && variant === 'hi') retry();
  }
  const di = 1 / (1 / f - 1 / dO);
  if (!Number.isFinite(di) || Math.abs(di) > 20) retry();
  const F = gq('f', 'f', f, 'm', { note: mirror ? 'focal length of the concave mirror' : 'focal length of the converging lens' }), DO = gq('do', 'd_{o}', dO, 'm', { note: 'object distance' });
  const alt = `A ${mirror ? 'concave mirror' : 'converging lens'} on a horizontal axis with its focal point${mirror ? ' F and center of curvature C' : 's F'} marked. An upright object arrow stands to the left, ${DO.text} from the ${mirror ? 'mirror' : 'lens'}.`;
  const figure = opticsFig({ f, dO, mirror, fLabel: `f = ${F.text}`, dLabel: `d_{o} = ${DO.text}`.replace('d_{o}', 'dₒ'), alt });
  const lensWord = mirror ? 'concave mirror' : 'converging lens';
  if (variant === 'di' || variant === 'mirror') {
    const inv = 1 / f - 1 / dO;
    return makeQ('lenses', lvl, {
      variant, prompt: `An object is ${DO.text} from a ${lensWord} with a focal length of ${F.text}. Where is the image? Give the image distance${di < 0 || lvl > 1 ? ' (a negative distance means a virtual image)' : ''}.`,
      givens: [F, DO], find: { sym: 'd_{i}', name: 'image distance' }, value: di, unit: 'm', rule: { sf: 3 }, signed: di < 0,
      eq: ['[[1 || f]] = [[1 || d_{o}]] + [[1 || d_{i}]]', '[[1 || d_{i}]] = [[1 || f]] − [[1 || d_{o}]]'],
      sub: [`[[1 || d_{i}]] = [[1 || ${F.text}]] − [[1 || ${DO.text}]]`], solve: [`[[1 || d_{i}]] = ${ap(1 / f)} m^-1 − ${ap(1 / dO)} m^-1 = ${ap(inv)} m^-1`, `d_{i} = [[1 || ${ap(inv)} m^-1]]`],
      notes: [di > 0 ? `Positive: a real image${mirror ? ' in front of the mirror' : ' on the far side of the lens'}.` : `Negative: a virtual image${mirror ? ' behind the mirror' : ' on the same side as the object'} — the object is inside the focal length.`, 'Do not forget the last step: flip 1/dᵢ to get dᵢ.'],
      wrong: [{ v: inv, why: 'forgot to flip 1/dᵢ' }, { v: 1 / (1 / f + 1 / dO), why: 'added the fractions' }, { v: dO - f, why: 'subtracted the distances' }, { v: -di, why: 'sign slip' }],
      figure, figureAlt: alt,
    });
  }
  if (variant === 'mag') {
    const DI = gq('di', 'd_{i}', clean(di), 'm', { note: 'image distance' });
    if (info(DI.v).dp > 3) retry();
    const mag = -DI.v / dO;
    return makeQ('lenses', lvl, {
      variant, prompt: `A converging lens forms a real image ${DI.text} from the lens when the object is ${DO.text} away. What is the magnification? (A negative magnification means the image is upside down.)`,
      givens: [DO, DI], find: { sym: 'M', name: 'magnification' }, value: mag, unit: 'mag', rule: { dp: 2 }, signed: true,
      eq: ['M = −[[d_{i} || d_{o}]]'], sub: [`M = −[[${DI.text} || ${DO.text}]]`],
      notes: [Math.abs(mag) > 1 ? 'The image is bigger than the object and inverted.' : 'The image is smaller than the object and inverted.'],
      wrong: [{ v: -mag, why: 'forgot the minus sign' }, { v: -dO / DI.v, why: 'divided the wrong way round' }, { v: DI.v - dO, why: 'subtracted' }],
      figure, figureAlt: alt,
    });
  }
  const ho = dec(0.01, 0.3, 2);
  const HO = gq('ho', 'h_{o}', ho, 'm', { note: 'object height' });
  const inv = 1 / f - 1 / dO;
  const hi = -(di / dO) * ho;
  // at dₒ = 2f the image is the object's own size: too easy to guess, and its working would show the answer
  if (Math.abs(di / dO - 1) < 0.02) retry();
  return makeQ('lenses', lvl, {
    variant, prompt: `A ${HO.text} tall object stands ${DO.text} from a converging lens with a focal length of ${F.text}. How tall is the image? (A negative height means the image is upside down.)`,
    givens: [HO, DO, F], find: { sym: 'h_{i}', name: 'image height' }, value: hi, unit: 'm', rule: { sf: 3 }, signed: true,
    eq: ['[[1 || d_{i}]] = [[1 || f]] − [[1 || d_{o}]]', 'h_{i} = −[[d_{i} || d_{o}]] h_{o}'],
    sub: [`[[1 || d_{i}]] = [[1 || ${F.text}]] − [[1 || ${DO.text}]] = ${ap(inv)} m^-1, so d_{i} = ${ap(di)} m`, `h_{i} = −[[${ap(di)} m || ${DO.text}]](${HO.text})`],
    notes: ['Keep the unrounded image distance for the second step.'],
    wrong: [{ v: -hi, why: 'forgot the minus sign' }, { v: -(dO / di) * ho, why: 'divided the distances the wrong way round' }, { v: -(inv / dO) * ho, why: 'used 1/dᵢ instead of dᵢ' }],
    figure, figureAlt: alt,
  });
}

/* ================================================== unit 9: electricity */
function genOhm(lvl) {
  const variant = pick(['V', 'I', 'R']);
  const dev = pick(['a lamp', 'a heater coil', 'a resistor', 'a toaster element', 'a motor winding']);
  let I, R, Itext = null, Rtext = null;
  if (lvl === 1) { I = pick([0.5, 1, 1.5, 2, 2.5, 3, 4, 5]); R = ri(2, 60); } else if (lvl === 2) { I = dec(0.1, 8, 2); R = dec(1, 200, 1); } else {
    // convert a given, never the unknown: current in mA unless the current is what is asked for
    if (variant === 'R' || (variant === 'V' && chance(0.5))) { const mA = ri(5, 900); I = mA / 1000; Itext = `${mA} mA`; R = 10 * ri(1, 200); } else { const k = dec(1, 9.9, 1); R = k * 1000; Rtext = `${fmt(k)} kΩ`; I = dec(0.001, 0.05, 3); }
  }
  R = clean(R); I = clean(I);
  const V = clean(I * R);
  if (info(V).sig > 5) retry();
  const Ig = gq('I', 'I', I, 'A', Itext ? { text: Itext, line: `I = ${Itext} = ${fmt(I)} A` } : {});
  const Rg = gq('R', 'R', R, 'ohm', Rtext ? { text: Rtext, line: `R = ${Rtext} = ${fmt(R)} Ω` } : {});
  const Vg = gq('V', 'V', V, 'V');
  const conv = Itext ? ['Milliamps to amps first: divide by 1,000.'] : Rtext ? ['Kilohms to ohms first: multiply by 1,000.'] : [];
  if (variant === 'V') {
    return makeQ('ohm', lvl, {
      variant, prompt: `A current of ${Ig.text} flows through ${dev} with a resistance of ${Rg.text}. What is the voltage across it?`,
      givens: [Ig, Rg], find: { sym: 'V', name: 'voltage' }, value: V, unit: 'V', rule: { sf: 3 },
      eq: ['V = IR'], sub: [`V = (${fmt(I)} A)(${fmt(R)} Ω)`], notes: conv, tips: conv,
      wrong: [{ v: I / R, why: 'divided I by R' }, { v: R / I, why: 'divided R by I' }, { v: I + R, why: 'added' }],
    });
  }
  if (variant === 'I') {
    return makeQ('ohm', lvl, {
      variant, prompt: `A ${Vg.text} battery is connected across ${dev} with a resistance of ${Rg.text}. What current flows?`,
      givens: [Vg, Rg], find: { sym: 'I', name: 'current' }, value: V / R, unit: 'A', rule: { sf: 3 },
      eq: ['V = IR', 'I = [[V || R]]'], sub: [`I = [[${Vg.text} || ${fmt(R)} Ω]]`], notes: conv, tips: conv,
      wrong: [{ v: V * R, why: 'multiplied' }, { v: R / V, why: 'divided the wrong way round' }, ...(Rtext ? [{ v: V / (R / 1000), why: 'left R in kilohms' }] : [{ v: V - R, why: 'subtracted' }])],
    });
  }
  return makeQ('ohm', lvl, {
    variant, prompt: `A voltage of ${Vg.text} drives a current of ${Ig.text} through ${dev}. What is its resistance?`,
    givens: [Vg, Ig], find: { sym: 'R', name: 'resistance' }, value: V / I, unit: 'ohm', rule: { sf: 3 },
    eq: ['V = IR', 'R = [[V || I]]'], sub: [`R = [[${Vg.text} || ${fmt(I)} A]]`], notes: conv, tips: conv,
    wrong: [{ v: V * I, why: 'multiplied' }, { v: I / V, why: 'divided the wrong way round' }, ...(Itext ? [{ v: V / (I * 1000), why: 'left I in milliamps' }] : [{ v: V - I, why: 'subtracted' }])],
  });
}

const PAR_PAIRS = [[6, 3], [4, 4], [12, 6], [20, 5], [10, 10], [30, 15], [12, 4], [60, 30], [8, 8], [24, 12], [36, 12], [18, 9], [40, 10], [15, 10], [100, 25]];
function rLabel(k, v) { return `R${'₁₂₃'[k]} = ${fmt(v)} Ω`; }
function genResistors(lvl) {
  const variant = pick(lvl === 1 ? ['series', 'parallel'] : lvl === 2 ? ['series', 'parallel', 'parallel'] : ['combo', 'combo', 'parallel']);
  if (variant === 'series') {
    const n = lvl === 1 ? 2 : pick([2, 3]);
    const Rs = Array.from({ length: n }, () => (lvl === 1 ? ri(1, 60) : dec(1, 100, 1)));
    const G = Rs.map((r, k) => gq(`R${k + 1}`, `R_{${k + 1}}`, r, 'ohm'));
    const alt = `A battery connected to ${n} resistors in series, one after another in a single loop: ${G.map((g, k) => `R${k + 1} = ${g.text}`).join(', ')}.`;
    return makeQ('resistors', lvl, {
      variant, prompt: `Resistors of ${listAnd(G.map((g) => g.text))} are connected in series. What is the equivalent resistance?`,
      givens: G, find: { sym: 'R_{eq}', name: 'equivalent resistance' }, value: Rs.reduce((s, x) => s + x, 0), unit: 'ohm', rule: { dp: 1 },
      eq: ['In series the resistances add:', `R_{eq} = ${G.map((g) => g.sym).join(' + ')}`], sub: [`R_{eq} = ${G.map((g) => g.text).join(' + ')}`],
      wrong: [{ v: 1 / Rs.reduce((s, x) => s + 1 / x, 0), why: 'used the parallel rule' }, { v: Rs.reduce((s, x) => s + x, 0) / n, why: 'averaged' }, { v: Rs.reduce((s, x) => s * x, 1), why: 'multiplied' }],
      figure: circuitFig({ type: 'series', labels: G.map((g, k) => rLabel(k, g.v)), vLabel: '', alt }), figureAlt: alt,
    });
  }
  if (variant === 'parallel') {
    let Rs;
    if (lvl === 1) Rs = shuffle(pick(PAR_PAIRS)); else if (lvl === 2) Rs = [ri(2, 100), ri(2, 100)]; else Rs = [ri(2, 60), ri(2, 60), ri(2, 60)];
    const G = Rs.map((r, k) => gq(`R${k + 1}`, `R_{${k + 1}}`, r, 'ohm'));
    const inv = Rs.reduce((s, x) => s + 1 / x, 0);
    const alt = `A battery connected to ${Rs.length} resistors in parallel, each on its own branch between the same two wires: ${G.map((g, k) => `R${k + 1} = ${g.text}`).join(', ')}.`;
    return makeQ('resistors', lvl, {
      variant, prompt: `Resistors of ${listAnd(G.map((g) => g.text))} are connected in parallel. What is the equivalent resistance?`,
      givens: G, find: { sym: 'R_{eq}', name: 'equivalent resistance' }, value: 1 / inv, unit: 'ohm', rule: { dp: 1 },
      eq: ['In parallel the reciprocals add:', `[[1 || R_{eq}]] = ${G.map((g) => `[[1 || ${g.sym}]]`).join(' + ')}`],
      sub: [`[[1 || R_{eq}]] = ${G.map((g) => `[[1 || ${g.text}]]`).join(' + ')} = ${ap(inv)} Ω^-1`], solve: [`R_{eq} = [[1 || ${ap(inv)} Ω^-1]]`],
      notes: ['The equivalent resistance is smaller than the smallest resistor — more paths let more current through.'],
      wrong: [{ v: Rs.reduce((s, x) => s + x, 0), why: 'used the series rule' }, { v: inv, why: 'forgot to flip 1/R_eq' }, { v: Rs.reduce((s, x) => s + x, 0) / Rs.length, why: 'averaged' }],
      figure: circuitFig({ type: 'parallel', labels: G.map((g, k) => rLabel(k, g.v)), vLabel: '', alt }), figureAlt: alt,
    });
  }
  const R1 = ri(2, 50);
  const [R2, R3] = chance(0.5) ? shuffle(pick(PAR_PAIRS)) : [ri(2, 60), ri(2, 60)];
  const G = [gq('R1', 'R_{1}', R1, 'ohm'), gq('R2', 'R_{2}', R2, 'ohm'), gq('R3', 'R_{3}', R3, 'ohm')];
  const p = 1 / (1 / R2 + 1 / R3);
  const alt = `A battery connected to R1 = ${G[0].text} in series with a parallel pair, R2 = ${G[1].text} and R3 = ${G[2].text}, side by side on two branches.`;
  return makeQ('resistors', lvl, {
    variant, prompt: `In the circuit, R₁ = ${G[0].text} is in series with a parallel pair, R₂ = ${G[1].text} and R₃ = ${G[2].text}. What is the equivalent resistance of the whole circuit?`,
    givens: G, find: { sym: 'R_{eq}', name: 'equivalent resistance' }, value: R1 + p, unit: 'ohm', rule: { dp: 1 },
    eq: ['First combine the parallel pair: R_{23} = [[1 || [[1 || R_{2}]] + [[1 || R_{3}]]]]', 'Then add R_{1} in series: R_{eq} = R_{1} + R_{23}'],
    sub: [`R_{23} = [[1 || [[1 || ${G[1].text}]] + [[1 || ${G[2].text}]]]] = ${ap(p)} Ω`, `R_{eq} = ${G[0].text} + ${ap(p)} Ω`],
    brief: (ans, eqs2) => `Parallel pair first: ${plainLine(`R_{23} = [[1 || [[1 || ${G[1].text}]] + [[1 || ${G[2].text}]]]]`)} = ${ap(p)} Ω; then in series: Req = ${G[0].text} + ${ap(p)} Ω ${eqs2} ${ans}`,
    wrong: [{ v: R1 + R2 + R3, why: 'added all three in series' }, { v: 1 / (1 / R1 + 1 / R2 + 1 / R3), why: 'put all three in parallel' }, { v: R1 + 1 / R2 + 1 / R3, why: 'forgot to flip the parallel part' }],
    figure: circuitFig({ type: 'combo', labels: G.map((g, k) => rLabel(k, g.v)), vLabel: '', alt }), figureAlt: alt,
  });
}
const listAnd = (a) => (a.length <= 2 ? a.join(' and ') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);

function genCircuit(lvl) {
  const variant = pick(lvl === 1 ? ['I', 'I', 'V'] : lvl === 2 ? ['I', 'V1', 'V'] : ['V1', 'V1', 'I']);
  const n = lvl === 1 ? 2 : pick([2, 3]);
  const Rs = Array.from({ length: n }, () => (lvl === 1 ? ri(1, 30) : ri(2, 120)));
  const G = Rs.map((r, k) => gq(`R${k + 1}`, `R_{${k + 1}}`, r, 'ohm'));
  const Rt = Rs.reduce((s, x) => s + x, 0);
  if (variant === 'V') {
    const I = lvl === 1 ? pick([0.5, 1, 1.5, 2, 0.25, 0.1]) : dec(0.05, 3, 2);
    const Ig = gq('I', 'I', I, 'A');
    const alt = `A battery of unknown voltage connected in a single loop to ${n} resistors in series: ${G.map((g, k) => `R${k + 1} = ${g.text}`).join(', ')}.`;
    return makeQ('circuit', lvl, {
      variant, prompt: `A current of ${Ig.text} flows around a series circuit of ${listAnd(G.map((g) => g.text))} resistors. What is the battery's voltage?`,
      givens: [Ig, ...G], find: { sym: 'V', name: 'battery voltage' }, value: I * Rt, unit: 'V', rule: { sf: 3 },
      eq: ['R_{total} = ' + G.map((g) => g.sym).join(' + '), 'V = IR_{total}'], sub: [`R_{total} = ${G.map((g) => g.text).join(' + ')} = ${P(Rt, 'ohm')}`, `V = (${Ig.text})(${P(Rt, 'ohm')})`],
      wrong: [{ v: I * Rs[0], why: 'used only one resistor' }, { v: Rt / I, why: 'divided' }, { v: I / Rt, why: 'divided the wrong way round' }],
      figure: circuitFig({ type: 'series', labels: G.map((g, k) => rLabel(k, g.v)), vLabel: 'V = ?', alt }), figureAlt: alt,
    });
  }
  const V = lvl === 1 ? pick([3, 6, 9, 12, 24]) : pick([1.5, 3, 4.5, 6, 9, 12, 18, 24, 120]);
  const Vg = gq('V', 'V', V, 'V', { note: 'battery' });
  const I = V / Rt;
  const alt = `A ${Vg.text} battery connected in a single loop to ${n} resistors in series: ${G.map((g, k) => `R${k + 1} = ${g.text}`).join(', ')}.`;
  const figure = circuitFig({ type: 'series', labels: G.map((g, k) => rLabel(k, g.v)), vLabel: Vg.text, alt });
  if (variant === 'I') {
    return makeQ('circuit', lvl, {
      variant, prompt: `A ${Vg.text} battery is connected in series with ${listAnd(G.map((g) => g.text))} resistors. What current flows in the circuit?`,
      givens: [Vg, ...G], find: { sym: 'I', name: 'current, the same everywhere in a series loop' }, value: I, unit: 'A', rule: { sf: 3 },
      eq: [`R_{total} = ${G.map((g) => g.sym).join(' + ')}`, 'I = [[V || R_{total}]]'], sub: [`R_{total} = ${G.map((g) => g.text).join(' + ')} = ${P(Rt, 'ohm')}`, `I = [[${Vg.text} || ${P(Rt, 'ohm')}]]`],
      wrong: [{ v: V / Rs[0], why: 'used only one resistor' }, { v: V * Rt, why: 'multiplied' }, { v: V / (1 / Rs.reduce((s, x) => s + 1 / x, 0)), why: 'combined them as if in parallel' }],
      figure, figureAlt: alt,
    });
  }
  const k = ri(0, n - 1);
  return makeQ('circuit', lvl, {
    variant, prompt: `A ${Vg.text} battery is connected in series with ${listAnd(G.map((g) => g.text))} resistors. What is the voltage across the ${G[k].text} resistor?`,
    givens: [Vg, ...G], find: { sym: `V_{${k + 1}}`, name: `voltage across R${'₁₂₃'[k]}` }, value: I * Rs[k], unit: 'V', rule: { sf: 3 },
    eq: [`R_{total} = ${G.map((g) => g.sym).join(' + ')}`, 'I = [[V || R_{total}]]', `V_{${k + 1}} = IR_{${k + 1}}`],
    sub: [`R_{total} = ${P(Rt, 'ohm')}`, `I = [[${Vg.text} || ${P(Rt, 'ohm')}]] = ${ap(I)} A`, `V_{${k + 1}} = (${ap(I)} A)(${G[k].text})`],
    notes: ['The battery voltage is shared among the resistors in proportion to their resistance.'],
    wrong: [{ v: V, why: 'gave the whole battery voltage' }, { v: V / n, why: 'split the voltage evenly' }, { v: V - I * Rs[k], why: 'found the voltage across the others' }],
    figure, figureAlt: alt,
  });
}

const DEVICES = [
  { n: 'a toaster', V: [120], P: [800, 1500] }, { n: 'a hair dryer', V: [120], P: [1000, 1875] }, { n: 'a desk lamp', V: [120], P: [9, 60] },
  { n: 'a space heater', V: [120], P: [750, 1500] }, { n: 'an electric kettle', V: [120, 230], P: [1200, 3000] }, { n: 'a TV', V: [120], P: [60, 250] },
  { n: 'a car headlight', V: [12], P: [35, 65] }, { n: 'a flashlight bulb', V: [3, 4.5, 6], P: [1, 5] }, { n: 'a USB fan', V: [5], P: [2, 10] },
];
function genEpower(lvl) {
  const variant = pick(lvl === 1 ? ['P_IV', 'P_IV', 'I_PV'] : lvl === 2 ? ['P_IV', 'P_I2R', 'I_PV'] : ['P_I2R', 'P_V2R', 'I_PV']);
  const d = pick(DEVICES);
  if (variant === 'P_IV' || variant === 'I_PV') {
    const V = pick(d.V);
    const Vg = gq('V', 'V', V, 'V');
    if (variant === 'P_IV') {
      const lo = d.P[0] / V, hi = d.P[1] / V;
      const I = lvl === 1 && hi >= 1 ? ri(Math.max(1, Math.ceil(lo)), Math.max(1, Math.floor(hi))) : dec(lo, hi, hi < 1 ? 2 : 1);
      if (!(I > 0)) retry();
      const Ig = gq('I', 'I', I, 'A');
      return makeQ('epower', lvl, {
        variant, prompt: `${cap(d.n)} running on ${Vg.text} draws a current of ${Ig.text}. What is its power?`,
        givens: [Vg, Ig], find: { sym: 'P', name: 'power' }, value: I * V, unit: 'W', rule: { sf: 3 },
        eq: ['P = IV'], sub: [`P = (${Ig.text})(${Vg.text})`],
        wrong: [{ v: V / I, why: 'divided (that is the resistance)' }, { v: I / V, why: 'divided' }, { v: I * I * V, why: 'squared the current' }],
      });
    }
    const Pw = lvl === 1 ? 5 * ri(Math.ceil(d.P[0] / 5), Math.floor(d.P[1] / 5)) || d.P[0] : ri(d.P[0], d.P[1]);
    const Pg = gq('P', 'P', Pw, 'W');
    return makeQ('epower', lvl, {
      variant, prompt: `${cap(d.n)} is rated ${Pg.text} at ${Vg.text}. What current does it draw?`,
      givens: [Pg, Vg], find: { sym: 'I', name: 'current' }, value: Pw / V, unit: 'A', rule: { sf: 3 },
      eq: ['P = IV', 'I = [[P || V]]'], sub: [`I = [[${Pg.text} || ${Vg.text}]]`],
      wrong: [{ v: Pw * V, why: 'multiplied' }, { v: V / Pw, why: 'divided the wrong way round' }, { v: Math.sqrt(Pw / V), why: 'took a square root' }],
    });
  }
  const R = lvl === 2 ? ri(8, 60) : dec(5, 60, 1);
  const Rg = gq('R', 'R', R, 'ohm');
  if (variant === 'P_I2R') {
    const I = dec(0.5, 12, 1);
    const Ig = gq('I', 'I', I, 'A');
    return makeQ('epower', lvl, {
      variant, prompt: `A current of ${Ig.text} flows through a ${Rg.text} heating element. How much power does it use?`,
      givens: [Ig, Rg], find: { sym: 'P', name: 'power' }, value: I * I * R, unit: 'W', rule: { sf: 3 },
      eq: ['P = IV and V = IR, so P = I^2R'], sub: [`P = ${gtext(Ig)}^2(${Rg.text})`], solve: [`P = (${ap(I * I)} A^2)(${Rg.text})`],
      wrong: [{ v: I * R, why: 'forgot to square the current (that is the voltage)' }, { v: (I * I) / R, why: 'divided by R' }, { v: 2 * I * R, why: 'doubled instead of squaring' }],
    });
  }
  const V = pick([1.5, 3, 6, 9, 12, 24, 120]);
  const Vg = gq('V', 'V', V, 'V');
  return makeQ('epower', lvl, {
    variant, prompt: `A ${Rg.text} resistor is connected across a ${Vg.text} supply. How much power does it use?`,
    givens: [Vg, Rg], find: { sym: 'P', name: 'power' }, value: (V * V) / R, unit: 'W', rule: { sf: 3 },
    eq: ['P = IV and I = [[V || R]], so P = [[V^2 || R]]'], sub: [`P = [[${gtext(Vg)}^2 || ${Rg.text}]]`], solve: [`P = [[${ap(V * V)} V^2 || ${Rg.text}]]`],
    wrong: [{ v: V / R, why: 'forgot to square V (that is the current)' }, { v: V * V * R, why: 'multiplied by R' }, { v: (2 * V) / R, why: 'doubled instead of squaring' }],
  });
}

function genKwh(lvl) {
  const variant = pick(lvl === 1 ? ['E', 'E', 'cost'] : lvl === 2 ? ['E', 'cost'] : ['cost_days', 'cost_days', 'cost']);
  const dev = pick([['a space heater', [750, 1500]], ['a TV', [60, 250]], ['a light bulb', [9, 100]], ['a clothes dryer', [1800, 5000]], ['a gaming computer', [200, 800]], ['an air conditioner', [500, 3500]]]);
  const Pw = lvl === 1 ? 10 * ri(dev[1][0] / 10, dev[1][1] / 10) : ri(dev[1][0], dev[1][1]);
  const h = lvl === 1 ? ri(1, 12) : dec(0.5, 12, 1);
  const rate = pick([0.1, 0.12, 0.13, 0.15, 0.16, 0.18, 0.2, 0.25]);
  const Pg = gq('P', 'P', Pw, 'W'), H = gq('h', 't', h, '', { text: `${fmt(h)} hour${h === 1 ? '' : 's'}`, line: `t = ${fmt(h)} h` }), Rg = gq('rate', 'rate', rate, '$', { text: `$${rate.toFixed(2)}`, line: `rate = $${rate.toFixed(2)} per kWh` });
  const kW = Pw / 1000, E = kW * h;
  const kwLine = `P = [[${Pg.text} || 1,000]] = ${fmt(kW)} kW`;
  if (variant === 'E') {
    return makeQ('kwh', lvl, {
      variant, prompt: `${cap(dev[0])} uses ${Pg.text} and runs for ${H.text}. How much energy does it use, in kilowatt-hours?`,
      givens: [Pg, H], find: { sym: 'E', name: 'energy in kWh' }, value: E, unit: 'kWh', rule: { dp: 2 },
      eq: ['E = Pt with P in kilowatts and t in hours'], sub: [kwLine, `E = (${fmt(kW)} kW)(${fmt(h)} h)`],
      wrong: [{ v: Pw * h, why: 'forgot to change watts to kilowatts' }, { v: kW, why: 'forgot the time' }, { v: kW / h, why: 'divided by the time' }],
    });
  }
  if (variant === 'cost') {
    return makeQ('kwh', lvl, {
      variant, prompt: `${cap(dev[0])} uses ${Pg.text} and runs for ${H.text}. Electricity costs ${Rg.text} per kWh. What does it cost to run, in dollars?`,
      givens: [Pg, H, Rg], find: { sym: 'cost', name: 'in dollars' }, value: E * rate, unit: '$', rule: { dp: 2 },
      eq: ['E = Pt (in kWh)', 'cost = E × rate'], sub: [kwLine, `E = (${fmt(kW)} kW)(${fmt(h)} h) = ${ap(E)} kWh`, `cost = (${ap(E)} kWh)($${rate.toFixed(2)} per kWh)`],
      wrong: [{ v: Pw * h * rate, why: 'forgot to change watts to kilowatts' }, { v: E / rate, why: 'divided by the rate' }, { v: kW * rate, why: 'forgot the time' }],
    });
  }
  const days = pick([7, 30, 31, 90, 365]);
  const D = gq('days', 'days', days, '', { text: `${days} days`, line: `${days} days` });
  const hd = gq('h', 't', h, '', { text: `${fmt(h)} hour${h === 1 ? '' : 's'} a day`, line: `t = ${fmt(h)} h per day` });
  const Et = E * days;
  return makeQ('kwh', lvl, {
    variant, prompt: `${cap(dev[0])} uses ${Pg.text} and runs ${hd.text} for ${D.text}. Electricity costs ${Rg.text} per kWh. What does that cost, in dollars?`,
    givens: [Pg, hd, D, Rg], find: { sym: 'cost', name: 'in dollars' }, value: Et * rate, unit: '$', rule: { dp: 2 },
    eq: ['E = Pt (kW × total hours)', 'cost = E × rate'], sub: [kwLine, `total time = (${fmt(h)} h)(${days}) = ${fmt(h * days)} h`, `E = (${fmt(kW)} kW)(${fmt(h * days)} h) = ${ap(Et)} kWh`, `cost = (${ap(Et)} kWh)($${rate.toFixed(2)} per kWh)`],
    wrong: [{ v: E * rate, why: 'forgot the number of days' }, { v: Pw * h * days * rate, why: 'forgot to change watts to kilowatts' }, { v: Et / rate, why: 'divided by the rate' }],
  });
}

function genCoulomb(lvl) {
  const variant = lvl === 3 && chance(0.4) ? 'r' : 'F';
  const k = gq('k', 'k', K_E, '', { k: true, text: '8.99 × 10^9 N·m²/C²', line: 'k = 8.99 × 10^9 N·m²/C²' });
  const charge = (key, sym) => {
    if (lvl === 3 && chance(0.6)) { const uc = dec(0.5, 9.9, 1); return gq(key, sym, clean(uc * 1e-6), 'C', { text: `${fmt(uc)} µC`, line: `${sym} = ${fmt(uc)} µC = ${sciExact(uc * 1e-6)} C` }); }
    const c = lvl === 1 ? pick([1, 2, 3, 4, 5, 6, 8]) : dec(1, 9.9, 1);
    return gsci(key, sym, fmt(c), -ri(6, 8), 'C');
  };
  const Q1 = charge('q1', 'q₁'), Q2 = charge('q2', 'q₂');
  const r = lvl === 1 ? pick([0.1, 0.2, 0.3, 0.5, 1]) : dec(0.02, 1.5, 2);
  const R = gq('r', 'r', r, 'm');
  const F = (K_E * Q1.v * Q2.v) / (r * r);
  const sci = F < 0.01 || F >= 1e4;
  if (variant === 'F') {
    return makeQ('coulomb', lvl, {
      variant, prompt: `Two small charged spheres, ${Q1.text} and ${Q2.text}, are ${R.text} apart. What is the size of the electric force between them? Use k = ${k.text}.`,
      givens: [Q1, Q2, R, k], find: { sym: 'F', name: 'size of the electric force' }, value: F, unit: 'N', rule: { sf: 3 }, sci, uses: ['k'],
      eq: ['F = k[[q₁q₂ || r^2]]'], sub: [`F = (8.99 × 10^9)[[(${sciExact(Q1.v)})(${sciExact(Q2.v)}) || ${gtext(R)}^2]]`], solve: [`F = (8.99 × 10^9)[[${ap(Q1.v * Q2.v)} || ${ap(r * r)}]]`],
      notes: ['Like charges repel and unlike charges attract; the size of the force is the same either way.'],
      wrong: [{ v: (K_E * Q1.v * Q2.v) / r, why: 'forgot to square r' }, { v: F * 10, why: 'power-of-ten slip' }, { v: F / 10, why: 'power-of-ten slip' }, { v: (K_E * Q1.v * Q2.v) / (2 * r), why: 'doubled r instead of squaring' }],
    });
  }
  const Fs = settle(F, { sf: 3 }, sci);
  if (!Fs) retry();
  const Fg = sci ? gsci('F', 'F', Fs.str.split(' × 10^')[0], Number(Fs.str.split(' × 10^')[1]), 'N') : gq('F', 'F', Number(Fs.str.replace(/,/g, '')), 'N');
  return makeQ('coulomb', lvl, {
    variant, prompt: `Two small charged spheres, ${Q1.text} and ${Q2.text}, push on each other with a force of ${Fg.text}. How far apart are they? Use k = ${k.text}.`,
    givens: [Q1, Q2, Fg, k], find: { sym: 'r', name: 'distance between them' }, value: Math.sqrt((K_E * Q1.v * Q2.v) / Fg.v), unit: 'm', rule: { sf: 3 }, uses: ['k'],
    eq: ['F = k[[q₁q₂ || r^2]]', 'r = √[[[[kq₁q₂ || F]]]]'], sub: [`r = √[[[[(8.99 × 10^9)(${sciExact(Q1.v)})(${sciExact(Q2.v)}) || ${Fg.text}]]]]`], solve: [`r = √[[${ap((K_E * Q1.v * Q2.v) / Fg.v)} m^2]]`],
    wrong: [{ v: (K_E * Q1.v * Q2.v) / Fg.v, why: 'forgot the square root' }, { v: Math.sqrt((K_E * Q1.v * Q2.v) / Fg.v) * 10, why: 'power-of-ten slip' }, { v: Math.sqrt(Fg.v / (K_E * Q1.v * Q2.v)), why: 'divided the wrong way round' }],
  });
}

/* ================================================================ generate */
const GENERATORS = {
  speed: genSpeed, accel: genAccel, kinematics: genKinematics, freefall: genFreefall, graphs: genGraphs,
  components: genComponents, resultant: genResultant, projectile: genProjectile, relative: genRelative,
  fma: genFma, weight: genWeight, netforce: genNetforce, friction: genFriction, fbd: genFbd,
  centripetal: genCentripetal, period: genPeriod, gravchange: genGravchange, gravity: genGravity,
  work: genWork, energy: genEnergy, conservation: genConservation, power: genPower, efficiency: genEfficiency,
  momentum: genMomentum, impulse: genImpulse, inelastic: genInelastic, recoil: genRecoil,
  waves: genWaves, waveperiod: genWaveperiod, echo: genEcho,
  emwaves: genEmwaves, refraction: genRefraction, snell: genSnell, lenses: genLenses,
  ohm: genOhm, resistors: genResistors, circuit: genCircuit, epower: genEpower, kwh: genKwh, coulomb: genCoulomb,
};
function levelOf(opt) {
  const d = opt && opt.difficulty;
  if (d === 'easy' || d === 'warm-up') return 1;
  if (d === 'hard' || d === 'challenge') return 3;
  const n = Number(d);
  return n >= 1 && n <= 3 ? Math.round(n) : 2;
}
/** A fresh practice problem for a skill: { difficulty: 1 | 2 | 3 }. */
function generate(skillId, opt = {}) {
  const g = GENERATORS[skillId];
  if (!g) throw new Error(`unknown Physics Lab skill: ${skillId}`);
  const lvl = levelOf(opt);
  for (let tries = 0; tries < 400; tries++) {
    try { return g(lvl); } catch (e) { if (!(e instanceof Retry)) throw e; }
  }
  throw new Error(`could not build a ${skillId} problem`);
}

/* ------------------------------------------------ multiple-choice versions
   For the games (and the two skills that are multiple choice anyway): the
   wrong options are the classic mistakes, formatted like the answer, each
   more than 1% away from it and from each other. */
const close = (a, b) => Math.abs(a - b) <= Math.max(Math.abs(a), Math.abs(b)) * 0.01 + 1e-15;
function generateMC(skillId, opt = {}) {
  for (let tries = 0; tries < 60; tries++) {
    const q = generate(skillId, opt);
    if (q.type === 'mc') return q;
    const rights = [q.value, parseFloat(String(q.answer).replace(/[$,]/g, '').replace(' × 10^', 'e'))];
    const picked = [];
    const offer = (v, why) => {
      if (picked.length >= 3 || !Number.isFinite(v) || v === 0) return;
      // a plain-number answer gets plain-number options: nothing that needs scientific notation
      if (!q.sci && (Math.abs(v) >= 1e7 || Math.abs(v) < 1e-4)) return;
      const s = settle(v, q.rule, q.sci);
      if (!s) return;
      const str = withUnit(s.str, q.unit);
      if (str === q.answer || rights.some((r) => close(r, s.num)) || picked.some((p) => p.str === str || close(p.val, s.num))) return;
      picked.push({ str, val: s.num, why });
    };
    for (const w of q.wrong) offer(w.v, w.why);
    for (const [k, why] of [[10, 'off by a power of ten'], [0.1, 'off by a power of ten'], [2, 'doubled'], [0.5, 'halved']]) offer(q.value * k, why);
    if (picked.length < 3) continue;
    const opts = shuffle([q.answer, ...picked.map((p) => p.str)]).map(pretty);
    const out = { ...q, type: 'mc', answer: pretty(q.answer), options: opts, mistakes: picked.map((p) => ({ option: pretty(p.str), why: p.why })) };
    delete out.check;
    return out;
  }
  throw new Error(`could not build a multiple-choice ${skillId} problem`);
}
/** A question for the site's shared card (games, Mistakes): plain-text
    prompt, a one-line explanation for the games, the figure only if the
    problem cannot be done without it. */
function forCoreCard(q, { brief = true } = {}) {
  const out = { ...q };
  if (brief) out.explanation = q.brief;
  if (!q.needsFigure && brief) { delete out.figure; delete out.figureAlt; }
  if (q.type === 'mc') { out.answer = pretty(q.answer); out.options = q.options.map(pretty); delete out.check; }
  return out;
}
const physSetOk = (set) => !!set && set.subject === 'phys';
function gameQuestions(setOrId) {
  const set = typeof setOrId === 'string' ? CQ.getSet(setOrId) : setOrId;
  if (!physSetOk(set)) return [];
  const here = SKILLS.filter((s) => set.isAll || s.setId === set.id);
  if (!here.length) return [];
  const order = set.isAll ? shuffle(here) : here;
  const out = [];
  for (let i = 0; i < 12; i++) {
    const s = order[i % order.length];
    try { out.push(forCoreCard(generateMC(s.id, { difficulty: i % 3 === 2 ? 2 : 1 + (i % 2) }))); } catch (e) { console.warn(e); }
  }
  return out;
}
/** Mistakes brings a missed skill back as a fresh typed problem, graded by
    its own q.check, with the full worked solution. */
function itemFor(id) {
  const s = SK[String(id).split(':')[1]];
  if (!s) return null;
  return { setId: s.setId, label: `Physics Lab · ${s.name}`, make: () => forCoreCard(generate(s.id, { difficulty: 2 }), { brief: false }) };
}

/* ================================================================ screen */
const PLACEHOLDER = (q) => (q.sci ? 'Like 1.99 x 10^20 N' : q.unit === '' ? 'A number' : q.unit === 'mag' ? 'A number, with its sign' : 'Number and unit');
function renderPhysics(set) {
  const here = SKILLS.filter((s) => set.isAll || s.setId === set.id);
  const prefs = CQ.state.prefs.physlab ||= { level: 'auto', skills: {} };
  prefs.skills ||= {};
  if (!['auto', 1, 2, 3].includes(prefs.level)) prefs.level = 'auto';
  let on = new Set((prefs.skills[set.id] || []).filter((id) => SK[id] && here.includes(SK[id])));
  if (!on.size) on = new Set(here.map((s) => s.id));
  const bestKey = `physlab-streak:${set.id}`;
  const S = { streak: 0, best: CQ.state.best[bestKey] || 0, right: 0, tries: 0, per: {}, lvl: {}, run: {}, last: [] };
  for (const s of here) S.per[s.id] = { right: 0, tries: 0 };
  let current = null;

  const v = el('div', { class: 'view px' });
  v.append(CQ.panelHead(set, 'physics', 'A new problem every time, worked in the G.U.E.S.S. layout: Givens, Unknown, Equation, Substitute, Solve. Stuck? "Show me how" sets the problem up for you — that attempt just won\'t count toward mastery.'));
  const levelSeg = el('div', { class: 'seg', role: 'group', 'aria-labelledby': 'px-level-label' });
  const chips = el('div', { class: 'px-chips' });
  const stats = el('div', { class: 'px-stats', role: 'group', 'aria-label': 'This session' });
  const stage = el('div', { class: 'panel px-stage' });
  let skillBox;
  const countNote = el('span', { class: 'note' });
  if (set.isAll) {
    skillBox = el('details', { class: 'px-skills px-skills-all' },
      el('summary', {}, el('span', { class: 'px-h' }, 'Skills'), ' ', countNote, el('span', { class: 'note px-sum-hint' }, 'Tap to choose')),
      chips);
  } else {
    skillBox = el('section', { class: 'px-skills', 'aria-labelledby': 'px-skills-h' },
      el('div', { class: 'row between' }, el('h2', { class: 'px-h', id: 'px-skills-h' }, 'Skills'), el('span', { class: 'note' }, 'Tap to turn a skill on or off')),
      chips);
  }
  v.append(
    el('div', { class: 'toolbar' }, CQ.backBtn(set), el('span', { class: 'spacer' }), el('span', { class: 'note px-seg-label', id: 'px-level-label' }, 'Difficulty'), levelSeg),
    skillBox, stats, stage);
  CQ.main.append(v);

  function drawLevels() {
    levelSeg.innerHTML = '';
    for (const [k, label] of [['auto', 'Auto'], [1, 'Warm-up'], [2, 'Standard'], [3, 'Challenge']]) {
      levelSeg.append(el('button', {
        type: 'button', class: prefs.level === k ? 'on' : '', 'aria-pressed': prefs.level === k ? 'true' : 'false',
        title: k === 'auto' ? 'Starts easy and steps up as you get problems right' : '',
        onclick: () => { prefs.level = k; CQ.save(); drawLevels(); if (current && !current.done) serve(); },
      }, label));
    }
  }
  function chip(s) {
    const isOn = on.has(s.id);
    const t = S.per[s.id];
    const m = Math.min(2, CQ.state.mastery[`physlab:${s.id}`] || 0);
    return el('button', {
      type: 'button', class: `px-chip${isOn ? ' on' : ''}`, 'aria-pressed': isOn ? 'true' : 'false',
      'aria-label': `${s.name}${t.tries ? `, ${t.right} of ${t.tries} right this session` : ''}${m ? `, mastery ${m} of 2` : ''}`,
      onclick: () => toggle([s.id]),
    },
    el('span', { class: 'tick', 'aria-hidden': 'true' }, isOn ? '✓' : '+'),
    el('span', { 'aria-hidden': 'true' }, s.ico), ` ${s.name}`,
    t.tries ? el('span', { class: 'tally', 'aria-hidden': 'true' }, `${t.right}/${t.tries}`) : null,
    m ? el('span', { class: 'mastery', 'aria-hidden': 'true', title: 'Mastery' }, '★'.repeat(m)) : null);
  }
  function drawChips() {
    chips.innerHTML = '';
    if (!set.isAll) { chips.append(el('div', { class: 'px-chip-row', role: 'group', 'aria-label': 'Skills' }, ...here.map(chip))); return; }
    countNote.textContent = `${on.size} of ${here.length} on`;
    for (const sid of UNIT_SETS) {
      const list = here.filter((s) => s.setId === sid);
      if (!list.length) continue;
      const all = list.every((s) => on.has(s.id));
      const unit = CQ.getSet(sid);
      const name = unit ? `${unit.short} · ${UNIT_TITLES[sid]}` : UNIT_TITLES[sid];
      chips.append(el('div', { class: 'px-chip-row', role: 'group', 'aria-label': name },
        el('button', { type: 'button', class: `px-group${all ? ' on' : ''}`, 'aria-pressed': all ? 'true' : 'false', title: all ? 'Turn this unit off' : 'Turn this whole unit on', onclick: () => toggle(list.map((s) => s.id), !all) }, name),
        ...list.map(chip)));
    }
  }
  function toggle(ids, force) {
    const turnOn = force != null ? force : !on.has(ids[0]);
    const next = new Set(on);
    for (const id of ids) { if (turnOn) next.add(id); else next.delete(id); }
    if (!next.size) { CQ.toast('Keep at least one skill on'); return; }
    on = next;
    prefs.skills[set.id] = [...on];
    CQ.save();
    drawChips();
    if (current && !current.done && !on.has(current.q.skill)) serve();
  }
  function drawStats() {
    stats.innerHTML = '';
    stats.append(
      el('span', { class: 'px-stat' }, el('span', { 'aria-hidden': 'true' }, '🔥'), ' Streak ', el('b', {}, String(S.streak))),
      el('span', { class: 'px-stat' }, el('span', { 'aria-hidden': 'true' }, '🏆'), ' Best ', el('b', {}, String(S.best))),
      el('span', { class: 'px-stat' }, el('span', { 'aria-hidden': 'true' }, '✅'), ' Right ', el('b', {}, `${S.right} / ${S.tries}`), ' this session'),
    );
  }
  function nextSkill() {
    const ids = [...on];
    if (ids.length === 1) return ids[0];
    const w = ids.map((id) => {
      let x = 3 - Math.min(2, CQ.state.mastery[`physlab:${id}`] || 0);
      if (S.last[0] === id) x *= 0.25;
      if (S.last.slice(0, 3).includes(id)) x *= 0.5;
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
    draw(q, lvl);
  }

  function draw(q, lvl) {
    CQPhysics.current = q;
    stage.innerHTML = '';
    const st = current = { q, done: false, assisted: false, card: null };
    const hintId = `px-hint-${Date.now()}`;
    const hintBox = el('div', { class: 'px-hint', id: hintId, hidden: true });
    const hintBtn = el('button', {
      type: 'button', class: 'btn sm px-hint-btn', 'aria-expanded': 'false', 'aria-controls': hintId, onclick: () => {
        if (st.done) return;
        const open = hintBox.hidden;
        hintBox.hidden = !open;
        hintBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        hintBtn.textContent = open ? 'Hide the method' : '💡 Show me how';
        if (open && !hintBox.childElementCount) {
          st.assisted = true;
          hintBox.append(el('p', { class: 'px-assisted' }, el('span', { 'aria-hidden': 'true' }, '💡 '), 'Assisted — this problem won\'t count toward mastery. Finish it yourself, then try the next one on your own.'), q.hint());
        }
      },
    }, '💡 Show me how');
    const head = el('div', { class: 'px-card-head' },
      el('span', { class: 'q-tag' }, q.ask),
      el('span', { class: 'px-level' }, LEVEL_NAMES[lvl] || LEVEL_NAMES[2]));

    let card;
    if (q.type === 'mc') {
      card = CQ.questionCard(q, { onAnswer: (ok) => settleAnswer(ok, ok ? '' : 'x', null), showTag: true, instant: true });
      card.classList.add('px-card');
      const tag = card.querySelector('.q-tag');
      if (tag) tag.replaceWith(head);
      card.querySelector('.opts').after(el('div', { class: 'row px-actions' }, hintBtn), hintBox);
    } else {
      card = el('div', { class: 'q-card px-card' }, head);
      if (q.figure) {
        const fig = el('div', { class: 'q-figure', role: 'img', 'aria-label': q.figureAlt || 'Diagram for this problem' });
        fig.innerHTML = q.figure;
        card.append(fig);
      }
      card.append(el('div', { class: 'q-prompt' }, ...textNodes(q.prompt)));
      const inp = el('input', { class: 'input', type: 'text', placeholder: PLACEHOLDER(q), autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', enterkeyhint: 'done', 'aria-label': 'Your answer' });
      const answerBtn = el('button', { type: 'button', class: 'btn primary', onclick: () => submit(false) }, 'Answer');
      const skipBtn = el('button', { type: 'button', class: 'btn ghost', onclick: () => submit(true) }, 'Don\'t know');
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(false); } });
      card.append(el('div', { class: 'written' }, inp, answerBtn, skipBtn));
      const extras = el('div', { class: 'row px-actions' }, hintBtn);
      const ins = (t) => { const a = inp.selectionStart ?? inp.value.length, b = inp.selectionEnd ?? a; inp.value = inp.value.slice(0, a) + t + inp.value.slice(b); inp.focus(); inp.setSelectionRange(a + t.length, a + t.length); };
      if (q.sci) extras.append(el('button', { type: 'button', class: 'btn sm ghost px-ins', 'aria-label': 'Insert times ten to the power', onclick: () => ins(' × 10^') }, '× 10^'));
      if (q.sci || q.signed) extras.append(el('button', { type: 'button', class: 'btn sm ghost px-ins', 'aria-label': 'Insert minus sign', onclick: () => ins('-') }, '−'));
      card.append(extras, hintBox);
      if (matchMedia('(pointer: fine)').matches) CQ.later(() => inp.focus(), 60);
      st.input = inp;
      function submit(dontKnow) {
        if (st.done) return;
        const raw = inp.value.trim();
        if (!dontKnow && !raw) { inp.focus(); return; }
        inp.disabled = true; answerBtn.disabled = true; skipBtn.disabled = true;
        extras.querySelectorAll('.px-ins').forEach((b) => b.remove());
        const g = dontKnow ? { ok: false, why: '' } : grade(q, raw);
        const shown = el('span', { class: 'px-nowrap' }, ...textNodes(q.answer));
        const fb = el('div', { class: `feedback ${g.ok ? 'good' : 'bad'}`, role: 'status', 'aria-live': 'polite' },
          el('b', { class: 'title' }, g.ok ? `✓ ${pick(['Correct!', 'Nice!', 'You got it!', 'Exactly right.'])}` : dontKnow ? ['Here\'s how it works. The answer is ', shown] : ['✗ Not quite — the answer is ', shown]),
          g.why ? el('p', { class: 'px-why' }, g.why) : null,
          g.tip ? el('p', { class: 'px-why' }, g.tip) : null,
          el('div', { class: 'exp' }, q.work(true)),
          el('div', { class: 'src' }, q.source));
        card.append(fb);
        settleAnswer(g.ok, raw, fb);
      }
    }
    st.card = card;
    stage.append(card);

    function settleAnswer(ok, given, fb) {
      if (st.done) return;
      st.done = true;
      hintBtn.remove();
      hintBox.hidden = true;
      S.per[q.skill] ||= { right: 0, tries: 0 };
      S.tries++; S.per[q.skill].tries++;
      if (ok) { S.right++; S.per[q.skill].right++; }
      // an assisted answer earns no credit, but an assisted miss still goes to Mistakes
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
        const ob = el('button', {
          type: 'button', class: 'btn sm ghost px-override', onclick: () => {
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
          },
        }, 'Override: I was right');
        st.card.append(ob);
      }
      const next = el('button', { type: 'button', class: 'btn primary lg px-next', onclick: serve }, 'Next problem →');
      st.card.append(el('div', { class: 'row' }, next, el('span', { class: 'note px-keys' }, 'or press Enter')));
      next.focus({ preventScroll: true });
      drawStats(); drawChips();
    }
  }

  const offKeys = CQ.onKeys((e) => {
    if (!current) return;
    if (current.done) {
      if (e.key === 'Enter' && !['BUTTON', 'A', 'SUMMARY'].includes(e.target.tagName)) { e.preventDefault(); serve(); }
      return;
    }
    if (current.q.type === 'mc' && /^[1-4]$/.test(e.key) && current.card.pickByKey) current.card.pickByKey(e.key);
  });
  // for tests and screenshots: put a particular generated problem on screen
  CQPhysics.show = (q) => draw(q, q.level || 2);
  CQ.addCleanup(() => { offKeys(); CQPhysics.current = null; CQPhysics.show = null; });
  drawLevels(); drawChips(); drawStats();
  serve();
}

/* ========================================================== registration */
const CQPhysics = window.CQPhysics = {
  skills: SKILLS.map(({ id, name, setId }) => ({ id, name, setId })),
  units: { ...UNIT_TITLES },
  generate,
  generateMC,
  gameQuestions,
  grade,
  forCoreCard,
  itemFor,
  current: null,
  show: null,
};
CQ.registerMode({
  id: 'physics', name: 'Physics Lab', ico: '⚙️', color: '#f59e0b', before: 'match',
  desc: 'Endless new Physics problems — motion, forces, energy, waves, circuits — each worked step by step with Givens, Unknown, Equation, Substitute, Solve.',
  available: physSetOk,
  render: renderPhysics,
});
CQ.addGameSource(gameQuestions);
CQ.registerItemResolver('physlab', itemFor);
})();
