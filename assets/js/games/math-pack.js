/* Math Pack — sixteen 90-second number drills on one shared engine.
   Every game: type the answer on a big on-screen pad (or tap a choice),
   90 seconds on the clock, a streak multiplier that steps ×1→×5, difficulty
   that ramps as you rack up right answers, and a 5-second penalty for every
   miss. All questions are generated with exactly one correct answer; the
   generators are exposed on Milo._mathPackGens so a script can fuzz them. */
(function () {
  'use strict';

  /* ------------------------------------------------------------- helpers */

  function RI(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }
  function PK(arr) { return arr[(Math.random() * arr.length) | 0]; }
  function SH(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = (Math.random() * (i + 1)) | 0, t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }
  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { var t = a % b; a = b; b = t; }
    return a;
  }
  function fv(s) { var p = s.split('/'); return parseInt(p[0], 10) / parseInt(p[1], 10); }

  var PRIMES = (function () {
    var lim = 200, sieve = [], out = [], i, j;
    for (i = 2; i <= lim; i++) {
      if (!sieve[i]) { out.push(i); for (j = i * i; j <= lim; j += i) sieve[j] = 1; }
    }
    return out;
  })();
  function isPrime(n) {
    if (n < 2) return false;
    for (var i = 0; i < PRIMES.length && PRIMES[i] * PRIMES[i] <= n; i++) {
      if (n % PRIMES[i] === 0) return n === PRIMES[i];
    }
    return true;
  }

  /** Shuffle correct + wrongs into a choice question. Strings must be distinct. */
  function mc(q, correct, wrongs, extra) {
    var arr = SH([correct].concat(wrongs));
    var out = { q: q, choices: arr, ci: arr.indexOf(correct) };
    if (extra) for (var k in extra) out[k] = extra[k];
    return out;
  }

  /** 'Which is larger/smaller?' between two distinct-value fraction strings. */
  function cmpQ(A, B, va, vb) {
    var max = Math.random() < .5;
    var arr = SH([A, B]);
    var want = max ? (va > vb ? A : B) : (va < vb ? A : B);
    return {
      q: max ? 'Which is larger?' : 'Which is smaller?',
      choices: arr, ci: arr.indexOf(want),
      t: 'cmp', dir: max ? 'max' : 'min'
    };
  }

  /* ---------------------------------------------------------- generators */
  /* Each gen(lv) — lv 0..3 rises during the run — returns either
     { q, a }                    a typed integer answer, or
     { q, choices, ci }          a tap-one-of-these answer.
     Extra fields (t, exact, n, sn, sd, terms…) exist so the self-test can
     re-verify that exactly one answer is right. */

  var GENS = {

    'math-times-easy': function (lv) {
      var a = RI(2, 5), b = RI(2, [6, 9, 12, 12][lv]);
      var q = Math.random() < .5 ? a + ' × ' + b : b + ' × ' + a;
      return { q: q + ' = ?', a: a * b };
    },

    'math-times-hard': function (lv) {
      var a = RI(6, 12);
      var b = lv === 0 ? RI(2, 6) : lv === 1 ? RI(2, 9) : lv === 2 ? RI(2, 12) : RI(6, 12);
      var q = Math.random() < .5 ? a + ' × ' + b : b + ' × ' + a;
      return { q: q + ' = ?', a: a * b };
    },

    'math-times-mixed': function (lv) {
      var a = RI(2, 12), b = RI(2, [9, 12, 12, 12][lv]);
      if (lv >= 1 && Math.random() < (lv >= 3 ? .45 : .3)) {
        return { q: a + ' × ? = ' + (a * b), a: b, note: 'find the missing number' };
      }
      var q = Math.random() < .5 ? a + ' × ' + b : b + ' × ' + a;
      return { q: q + ' = ?', a: a * b };
    },

    'math-addition': function (lv) {
      var a, b;
      if (lv === 0) { a = RI(11, 99); b = RI(11, 99); }
      else if (lv === 1) { a = RI(100, 999); b = RI(11, 99); }
      else if (lv === 2) { a = RI(100, 999); b = RI(100, 999); }
      else {
        // force a carry in the ones column
        var ao = RI(1, 9), bo = RI(10 - ao, 9);
        a = RI(10, 99) * 10 + ao;
        b = RI(10, 99) * 10 + bo;
      }
      return { q: a + ' + ' + b + ' = ?', a: a + b };
    },

    'math-subtraction': function (lv) {
      // digits built directly so a > b and the ones column always borrows
      var bo = RI(1, 9), ao = RI(0, bo - 1), a, b;
      if (lv < 2) {
        var bt = RI(1, 8), at = RI(bt + 1, 9);
        a = at * 10 + ao; b = bt * 10 + bo;
      } else {
        var bh = RI(1, 8), ah = RI(bh + 1, 9), at2, bt2;
        if (lv >= 3) { bt2 = RI(1, 9); at2 = RI(0, bt2 - 1); }   // tens borrows too
        else { at2 = RI(0, 9); bt2 = RI(0, 9); }
        a = ah * 100 + at2 * 10 + ao; b = bh * 100 + bt2 * 10 + bo;
      }
      return { q: a + ' − ' + b + ' = ?', a: a - b };
    },

    'math-division': function (lv) {
      var b = lv >= 3 ? RI(3, 12) : RI(2, [9, 9, 12, 12][lv]);
      var qt = lv === 0 ? RI(2, 9) : lv === 1 ? RI(2, 12) : lv === 2 ? RI(3, 12) : RI(6, 12);
      return { q: (b * qt) + ' ÷ ' + b + ' = ?', a: qt };
    },

    'math-doubles-halves': function (lv) {
      var max = [48, 120, 500, 998][lv];
      if (Math.random() < .5) {
        var n = RI(5, max);
        return { q: 'Double ' + n, a: 2 * n };
      }
      var m = RI(3, max >> 1);
      return { q: 'Half of ' + (2 * m), a: m };
    },

    'math-fractions': function (lv) {
      var kinds = ['cmp'];
      if (lv >= 1) kinds.push('simp', 'simp');
      if (lv >= 2) kinds.push('add', 'add');
      if (lv >= 3) kinds.push('cross');
      var k = PK(kinds), i, v, ok, j;

      if (k === 'cmp') {
        if (Math.random() < .5) {           // same denominator
          var den = RI(5, 12), na = RI(1, den - 1), nb = RI(1, den - 1);
          while (nb === na) nb = RI(1, den - 1);
          return cmpQ(na + '/' + den, nb + '/' + den, na / den, nb / den);
        }
        var p1 = RI(2, 12), p2 = RI(2, 12);  // unit fractions
        while (p2 === p1) p2 = RI(2, 12);
        return cmpQ('1/' + p1, '1/' + p2, 1 / p1, 1 / p2);
      }

      if (k === 'cross') {
        var b1 = RI(3, 9), a1 = RI(1, b1 - 1), b2 = RI(3, 9), a2 = RI(1, b2 - 1);
        while (b2 === b1 || a1 * b2 === a2 * b1) { b2 = RI(3, 9); a2 = RI(1, b2 - 1); }
        return cmpQ(a1 + '/' + b1, a2 + '/' + b2, a1 / b1, a2 / b2);
      }

      if (k === 'simp') {
        var p = RI(1, 5), q2 = RI(p + 1, 9);
        while (gcd(p, q2) !== 1) { p = RI(1, 5); q2 = RI(p + 1, 9); }
        var mul = RI(2, 6);
        var correct = p + '/' + q2;
        var pool = [];
        if (p > 1) pool.push((p - 1) + '/' + q2);
        if (p + 1 < q2) pool.push((p + 1) + '/' + q2);
        pool.push(p + '/' + (q2 + 1), (p + 1) + '/' + (q2 + 1), p + '/' + (q2 + 2));
        if (q2 - 1 > p) pool.push(p + '/' + (q2 - 1));
        SH(pool);
        var used = [p / q2], wrongs = [];
        for (i = 0; i < pool.length && wrongs.length < 3; i++) {
          v = fv(pool[i]); ok = true;
          for (j = 0; j < used.length; j++) if (Math.abs(used[j] - v) < 1e-9) ok = false;
          if (ok) { wrongs.push(pool[i]); used.push(v); }
        }
        var tries = 0;
        while (wrongs.length < 3 && tries++ < 60) {   // safety net
          var r2 = RI(2, 12), r1 = RI(1, r2 - 1);
          v = r1 / r2; ok = true;
          for (j = 0; j < used.length; j++) if (Math.abs(used[j] - v) < 1e-9) ok = false;
          if (ok) { wrongs.push(r1 + '/' + r2); used.push(v); }
        }
        return mc('Simplify ' + (mul * p) + '/' + (mul * q2), correct, wrongs,
          { t: 'simp', sn: mul * p, sd: mul * q2, note: 'simplest form' });
      }

      // add: same denominator, proper answer, given in simplest form
      var dd = PK([4, 6, 8, 10, 12]);
      var x = RI(1, dd - 2), y = RI(1, dd - 1 - x), s = x + y;
      var g2 = gcd(s, dd);
      var corr = (s / g2) + '/' + (dd / g2);
      var cand = [s + '/' + (2 * dd), (s + 1) + '/' + dd, (s - 1) + '/' + dd, s + '/' + (dd + 2)];
      var used2 = [s / dd], w2 = [];
      for (i = 0; i < cand.length && w2.length < 3; i++) {
        v = fv(cand[i]); ok = v > 0;
        for (j = 0; j < used2.length; j++) if (Math.abs(used2[j] - v) < 1e-9) ok = false;
        if (ok) { w2.push(cand[i]); used2.push(v); }
      }
      var tr2 = 0;
      while (w2.length < 3 && tr2++ < 60) {
        var rr2 = RI(2, 12), rr1 = RI(1, rr2 - 1);
        v = rr1 / rr2; ok = true;
        for (j = 0; j < used2.length; j++) if (Math.abs(used2[j] - v) < 1e-9) ok = false;
        if (ok) { w2.push(rr1 + '/' + rr2); used2.push(v); }
      }
      return mc(x + '/' + dd + ' + ' + y + '/' + dd + ' = ?', corr, w2,
        { t: 'add', exact: s / dd, note: 'answer in simplest form' });
    },

    'math-percentages': function (lv) {
      var pools = [
        [10, 25, 50, 75],
        [5, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90],
        [5, 15, 20, 25, 30, 35, 40, 45, 55, 60, 65, 70, 75, 80, 85, 90, 95],
        [125, 150, 175, 5, 15, 35, 45, 55, 65, 85, 95]
      ];
      var p = PK(pools[lv]);
      var step = 100 / gcd(p, 100);
      var maxBase = [100, 200, 400, 800][lv];
      var base = step * RI(1, Math.max(1, Math.floor(maxBase / step)));
      return { q: p + '% of ' + base + ' = ?', a: p * base / 100 };
    },

    'math-negatives': function (lv) {
      var M = [10, 15, 30, 50][lv];
      var kind = RI(0, lv >= 1 ? 2 : 1);
      if (kind === 0) {                                 // −a + b
        var a = RI(2, M), b = RI(2, M + 2);
        return { q: '−' + a + ' + ' + b + ' = ?', a: b - a };
      }
      if (kind === 1) {
        if (Math.random() < .5) {                       // small − big
          var s = RI(2, M), c = RI(s + 1, M + 5);
          return { q: s + ' − ' + c + ' = ?', a: s - c };
        }
        var n = RI(2, M), c2 = RI(2, M);                // −n − c
        return { q: '−' + n + ' − ' + c2 + ' = ?', a: -n - c2 };
      }
      var x = RI(-M, M), y = RI(2, M);                  // subtracting a negative
      var xs = x < 0 ? '−' + (-x) : '' + x;
      return { q: xs + ' − (−' + y + ') = ?', a: x + y };
    },

    'math-order-ops': function (lv) {
      var pool = lv === 0 ? ['A', 'B'] : lv === 1 ? ['A', 'B', 'C', 'D'] :
        lv === 2 ? ['C', 'D', 'E', 'F', 'G'] : ['E', 'F', 'G', 'H', 'I', 'J'];
      var t = PK(pool), a, b, c, d, qq;
      switch (t) {
        case 'A': a = RI(2, 12); b = RI(2, 6); c = RI(2, 6);
          return { q: a + ' + ' + b + ' × ' + c + ' = ?', a: a + b * c };
        case 'B': a = RI(2, 6); b = RI(2, 6); c = RI(2, 12);
          return { q: a + ' × ' + b + ' + ' + c + ' = ?', a: a * b + c };
        case 'C': b = RI(2, 6); c = RI(2, 6); a = b * c + RI(1, 15);
          return { q: a + ' − ' + b + ' × ' + c + ' = ?', a: a - b * c };
        case 'D': a = RI(2, 9); b = RI(2, 9); c = RI(2, 6);
          return { q: '(' + a + ' + ' + b + ') × ' + c + ' = ?', a: (a + b) * c };
        case 'E': a = RI(2, 7); b = RI(2, 7); c = RI(2, 5); d = RI(2, 5);
          if (a * b < c * d) { var t1 = a; a = c; c = t1; t1 = b; b = d; d = t1; }
          if (a * b === c * d) a += 1;
          return { q: a + ' × ' + b + ' − ' + c + ' × ' + d + ' = ?', a: a * b - c * d };
        case 'F': a = RI(2, 12); b = RI(2, 7); c = RI(2, 7);
          d = RI(1, Math.min(9, a + b * c - 1));
          return { q: a + ' + ' + b + ' × ' + c + ' − ' + d + ' = ?', a: a + b * c - d };
        case 'G': b = RI(2, 8); a = RI(b + 1, b + 9); c = RI(2, 7);
          return { q: '(' + a + ' − ' + b + ') × ' + c + ' = ?', a: (a - b) * c };
        case 'H': c = RI(2, 6); qq = RI(2, 9); b = c * qq; a = RI(2, 12);
          return { q: a + ' + ' + b + ' ÷ ' + c + ' = ?', a: a + qq };
        case 'I': a = RI(2, 6); b = RI(2, 7); c = RI(2, 7);
          d = RI(1, Math.min(9, a * (b + c) - 1));
          return { q: a + ' × (' + b + ' + ' + c + ') − ' + d + ' = ?', a: a * (b + c) - d };
        default: // J
          b = RI(2, 6); qq = RI(3, 9); c = RI(1, qq - 1);
          return { q: (b * qq) + ' ÷ ' + b + ' − ' + c + ' = ?', a: qq - c };
      }
    },

    'math-estimation': function (lv) {
      var a, b, c3, exact, grain, qs;
      if (lv === 0) { a = RI(21, 99); b = RI(3, 9); exact = a * b; grain = 25; qs = a + ' × ' + b; }
      else if (lv === 1) { a = RI(12, 49); b = RI(12, 49); exact = a * b; grain = 100; qs = a + ' × ' + b; }
      else if (lv === 2) {
        if (Math.random() < .5) { a = RI(25, 89); b = RI(25, 89); exact = a * b; grain = 200; qs = a + ' × ' + b; }
        else { a = RI(140, 860); b = RI(140, 860); c3 = RI(140, 860); exact = a + b + c3; grain = 100; qs = a + ' + ' + b + ' + ' + c3; }
      } else {
        if (Math.random() < .5) { a = RI(120, 980); b = RI(3, 9); exact = a * b; grain = 250; qs = a + ' × ' + b; }
        else { a = RI(31, 97); b = RI(31, 97); exact = a * b; grain = 200; qs = a + ' × ' + b; }
      }
      var c0 = Math.round(exact / grain) * grain;
      var dmin = Math.abs(exact - c0);
      // If exact sits dead-centre between two multiples, ±1 offsets would be
      // equally close — push the wrong options further out so the correct
      // choice is strictly the closest, always.
      var minOff = (dmin * 2 === grain) ? 2 : 1;
      var cand = SH([-4, -3, -2, -1, 1, 2, 3, 4]), offs = [], i;
      for (i = 0; i < cand.length && offs.length < 3; i++) {
        if (Math.abs(cand[i]) < minOff) continue;
        if (c0 + cand[i] * grain <= 0) continue;
        offs.push(cand[i]);
      }
      var wrongs = [];
      for (i = 0; i < offs.length; i++) wrongs.push(String(c0 + offs[i] * grain));
      return mc(qs + ' ≈ ?', String(c0), wrongs,
        { t: 'est', exact: exact, note: 'closest answer — beat the bar' });
    },

    'math-number-bonds': function (lv) {
      var total, x;
      if (lv === 0) { total = 20; x = RI(1, 19); }
      else if (lv === 1) { total = 100; x = 5 * RI(1, 19); }
      else if (lv === 2) { total = 100; x = RI(2, 98); }
      else { total = 1000; x = Math.random() < .5 ? 10 * RI(1, 99) : RI(101, 899); }
      var q = Math.random() < .5 ? '? + ' + x + ' = ' + total : x + ' + ? = ' + total;
      return { q: q, a: total - x };
    },

    'math-primes': function (lv) {
      var kinds = lv === 0 ? ['pn'] : lv === 1 ? ['pn', 'pn', 'fac'] : ['pn', 'fac', 'which'];
      var k = PK(kinds), i, n;

      if (k === 'pn') {
        var lo = [2, 10, 30, 50][lv], hi = [30, 60, 120, 199][lv];
        if (Math.random() < .5) {
          var ps = [];
          for (i = 0; i < PRIMES.length; i++) if (PRIMES[i] >= lo && PRIMES[i] <= hi) ps.push(PRIMES[i]);
          n = PK(ps);
        } else {
          do { n = RI(lo, hi); } while (isPrime(n) || (n % 2 === 0 && Math.random() < .6));
        }
        return {
          q: 'Is ' + n + ' prime?', choices: ['Prime', 'Not prime'],
          ci: isPrime(n) ? 0 : 1, t: 'pn', n: n, note: 'prime or not?'
        };
      }

      if (k === 'fac') {
        var f = RI(2, [9, 9, 12, 12][lv]), m = RI(2, [9, 12, 12, 15][lv]);
        var N = f * m;
        var cs = SH([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
        var wrongs = [];
        for (i = 0; i < cs.length && wrongs.length < 3; i++) {
          if (N % cs[i] !== 0) wrongs.push(String(cs[i]));
        }
        return mc('Which is a factor of ' + N + '?', String(f), wrongs,
          { t: 'fac', n: N, note: 'factor check' });
      }

      // which: spot the prime among composites
      var lo2 = lv === 2 ? 20 : 60, hi2 = lv === 2 ? 90 : 180;
      var pl = [];
      for (i = 0; i < PRIMES.length; i++) if (PRIMES[i] >= lo2 && PRIMES[i] <= hi2) pl.push(PRIMES[i]);
      var pr = PK(pl);
      var comps = [];
      for (i = lo2; i <= hi2; i++) if (i % 2 === 1 && !isPrime(i)) comps.push(i);
      SH(comps);
      return mc('Which of these is prime?', String(pr),
        [String(comps[0]), String(comps[1]), String(comps[2])],
        { t: 'which', note: 'only one is prime' });
    },

    'math-squares': function (lv) {
      if (lv >= 2 && Math.random() < .5) {
        var m = lv === 2 ? RI(2, 12) : RI(5, 20);
        return { q: '√' + (m * m) + ' = ?', a: m };
      }
      var n = lv === 0 ? RI(2, 9) : lv === 1 ? RI(3, 12) : lv === 2 ? RI(6, 15) : RI(10, 20);
      return { q: n + '² = ?', a: n * n };
    },

    'math-sequences': function (lv) {
      var pool = ['arith'];
      if (lv === 0) pool.push('desc');
      if (lv >= 1) pool.push('x2', 'arithBig');
      if (lv >= 2) pool.push('sq', 'fib', 'x3');
      if (lv >= 3) pool.push('grow', 'alt');
      var t = PK(pool), s, k, terms, a;
      switch (t) {
        case 'arith': s = RI(1, 20); k = RI(2, 9);
          terms = [s, s + k, s + 2 * k, s + 3 * k]; a = s + 4 * k; break;
        case 'desc': k = RI(2, 9); s = RI(4 * k + 5, 90);
          terms = [s, s - k, s - 2 * k, s - 3 * k]; a = s - 4 * k; break;
        case 'arithBig': s = RI(10, 60); k = RI(11, 25);
          terms = [s, s + k, s + 2 * k, s + 3 * k]; a = s + 4 * k; break;
        case 'x2': s = RI(2, 9);
          terms = [s, 2 * s, 4 * s, 8 * s]; a = 16 * s; break;
        case 'x3': s = RI(1, 4);
          terms = [s, 3 * s, 9 * s, 27 * s]; a = 81 * s; break;
        case 'sq': s = RI(1, 8);
          terms = [s * s, (s + 1) * (s + 1), (s + 2) * (s + 2), (s + 3) * (s + 3)];
          a = (s + 4) * (s + 4); break;
        case 'fib': s = RI(1, 5);
          // 3s = 2k (2,3,5,8 · 4,6,10,16) also fits a constant second
          // difference, which predicts a different fifth term — skip those.
          do { k = RI(s + 1, 9); } while (3 * s === 2 * k);
          terms = [s, k, s + k, s + 2 * k]; a = 2 * s + 3 * k; break;
        case 'grow': s = RI(1, 10); k = RI(2, 6); var e = RI(1, 4);
          // k = e with s = 2e (4,6,10,16) also reads as Fibonacci — nudge s.
          if (k === e && s === 2 * e) s += 1;
          terms = [s, s + k, s + 2 * k + e, s + 3 * k + 3 * e];
          a = s + 4 * k + 6 * e;
          return { q: terms.join(', ') + ', ?', a: a, t: t, terms: terms, e: e };
        default: // alt: +j, −k, +j, −k…
          var j2 = RI(5, 12); k = RI(1, j2 - 1); s = RI(1, 15);
          terms = [s, s + j2, s + j2 - k, s + 2 * j2 - k]; a = s + 2 * j2 - 2 * k;
          return { q: terms.join(', ') + ', ?', a: a, t: t, terms: terms };
      }
      return { q: terms.join(', ') + ', ?', a: a, t: t, terms: terms };
    }
  };

  // Exposed for the generator fuzz-test (tools/scripts); not used by the UI.
  window.Milo._mathPackGens = GENS;

  /* -------------------------------------------------------- shared engine */

  var RUN = 90;   // seconds per run

  function mathMount(spec) {
    return function (host) {
      var Milo = window.Milo, U = Milo.util;
      var els = {};

      function mkEl(tag, css, txt) {
        var n = document.createElement(tag);
        if (css) n.style.cssText = css;
        if (txt != null) n.textContent = txt;
        return n;
      }

      function renderTyped(g) {
        els.ans.textContent = g.data.typed || '·';
        els.ans.style.color = g.data.typed ? spec.accent : 'rgba(255,255,255,.28)';
      }

      /* The hint line above the question doubles as the feedback line: it
         flashes "+24 (×2)" or "✗ 42 · −5s" for a beat, then the hint returns. */
      function setNote(g) {
        var d = g.data;
        els.note.textContent = (d.q && d.q.note) || spec.noteDefault || '';
        els.note.style.color = '#9aa3d0';
      }

      function flash(g, text, good) {
        els.note.textContent = text;
        els.note.style.color = good ? '#34d399' : '#fb7185';
        g.data.fbT = 1.3;
      }

      function ansText(q) { return q.choices ? q.choices[q.ci] : String(q.a); }

      function next(g) {
        var d = g.data;
        d.lv = Math.min(3, Math.floor(d.right / 6));
        d.q = spec.gen(d.lv);
        d.typed = '';
        if (!(d.fbT > 0)) setNote(g);
        els.q.textContent = d.q.q;
        if (spec.mode === 'choice') {
          els.choices.innerHTML = '';
          d.q.choices.forEach(function (txt, i) {
            var b = document.createElement('button');
            b.type = 'button';
            b.textContent = txt;
            b.style.cssText = 'min-height:52px;border:0;border-radius:12px;' +
              'background:rgba(255,255,255,.10);color:#eef1ff;' +
              'font:800 19px Outfit,sans-serif;cursor:pointer;' +
              'touch-action:manipulation;user-select:none;padding:8px';
            b.addEventListener('click', function () { b.blur(); choose(g, i); });
            els.choices.appendChild(b);
          });
        } else {
          renderTyped(g);
        }
        if (spec.beat) {
          d.beatMax = spec.beat(d.right + d.wrong);
          d.beat = d.beatMax;
          els.bbar.style.width = '100%';
        }
      }

      function right(g) {
        var d = g.data;
        d.right++;
        d.streak++;
        if (d.streak > d.bestStreak) d.bestStreak = d.streak;
        var m = 1 + Math.min(4, Math.floor(d.streak / 4));
        if (m > d.mult) Milo.sound.powerup(); else Milo.sound.coin();
        d.mult = m;
        g.set('Combo', '×' + m);
        var pts = (10 + d.lv * 4) * m;
        g.score += pts;
        g.set('Score', U.fmt(g.score));
        flash(g, '+' + pts + (m > 1 ? '  (×' + m + ')' : ''), true);
        next(g);
      }

      function wrong(g, slow) {
        var d = g.data;
        d.wrong++;
        d.streak = 0;
        d.mult = 1;
        g.set('Combo', '×1');
        d.time = Math.max(0, d.time - 5);
        Milo.sound.hit();
        flash(g, (slow ? '⏱ too slow — ' : '✗ ') + ansText(d.q) + '  · −5s', false);
        next(g);
      }

      function choose(g, i) {
        var d = g.data;
        if (g.state !== 'play' || !d.q || !d.q.choices) return;
        if (i === d.q.ci) right(g); else wrong(g, false);
      }

      function submit(g) {
        var d = g.data;
        if (g.state !== 'play' || !d.q || d.q.choices) return;
        if (d.typed === '' || d.typed === '-') return;
        if (parseInt(d.typed, 10) === d.q.a) right(g); else wrong(g, false);
      }

      function padKey(g, k) {
        var d = g.data;
        if (g.state !== 'play') return;
        Milo.sound.click();
        if (k === '⌫') d.typed = d.typed.slice(0, -1);
        else if (k === 'C') d.typed = '';
        else if (k === '±') {
          d.typed = d.typed.charAt(0) === '-' ? d.typed.slice(1) : '-' + d.typed;
        }
        else if (d.typed.replace('-', '').length < 6) d.typed += k;
        renderTyped(g);
      }

      function build(g) {
        els = {};
        // margin:auto (not just the root's align-items) so that on a short
        // stage the column scrolls from the top instead of clipping the question.
        var wrap = mkEl('div',
          'display:flex;flex-direction:column;align-items:center;gap:8px;' +
          'width:min(94vw,440px);margin:auto');

        var card = mkEl('div', 'width:100%;box-sizing:border-box;' +
          'background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.10);' +
          'border-radius:16px;padding:12px 14px 10px;text-align:center');
        els.note = mkEl('div', 'color:#9aa3d0;font:700 .76rem Outfit,sans-serif;' +
          'letter-spacing:.08em;text-transform:uppercase;min-height:16px;white-space:nowrap;' +
          'overflow:hidden;text-overflow:ellipsis');
        els.q = mkEl('div', 'color:#fff;font:800 clamp(22px,6vw,38px)/1.2 Outfit,sans-serif;' +
          'min-height:48px;display:flex;align-items:center;justify-content:center;padding:4px 0');
        card.appendChild(els.note);
        card.appendChild(els.q);

        if (spec.beat) {
          var bw = mkEl('div', 'width:100%;height:7px;border-radius:4px;' +
            'background:rgba(255,255,255,.10);overflow:hidden;margin:2px 0 6px');
          els.bbar = mkEl('div', 'height:100%;width:100%;border-radius:4px;background:' + spec.accent);
          bw.appendChild(els.bbar);
          card.appendChild(bw);
        }
        var tw = mkEl('div', 'width:100%;height:5px;border-radius:3px;' +
          'background:rgba(255,255,255,.08);overflow:hidden');
        els.tbar = mkEl('div', 'height:100%;width:100%;border-radius:3px;background:#34d399');
        tw.appendChild(els.tbar);
        card.appendChild(tw);
        wrap.appendChild(card);

        if (spec.mode === 'choice') {
          els.choices = mkEl('div', 'display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%');
          wrap.appendChild(els.choices);
        } else {
          els.ans = mkEl('div', 'width:100%;box-sizing:border-box;background:rgba(0,0,0,.25);' +
            'border:1px solid rgba(255,255,255,.12);border-radius:12px;height:44px;' +
            'display:flex;align-items:center;justify-content:center;' +
            'font:800 26px Outfit,sans-serif;color:rgba(255,255,255,.28)', '·');
          wrap.appendChild(els.ans);

          // Four columns: digits + ⌫ / C (or ± for the negatives drill), a
          // tall OK on the right, and a wide 0 — the whole pad fits under the
          // question on a phone without scrolling.
          var pad = mkEl('div', 'display:grid;grid-template-columns:repeat(4,1fr);' +
            'grid-auto-rows:46px;gap:7px;width:100%');
          var keys = ['7', '8', '9', '⌫', '4', '5', '6', spec.neg ? '±' : 'C', '1', '2', '3', 'OK', '0'];
          keys.forEach(function (k) {
            var b = document.createElement('button');
            b.type = 'button';
            b.textContent = k;
            var isOk = k === 'OK', digit = /^\d$/.test(k);
            b.style.cssText = 'border:0;border-radius:12px;cursor:pointer;' +
              'touch-action:manipulation;user-select:none;' +
              (isOk ? 'grid-row:span 2;background:' + spec.accent + ';color:#0a1020;' +
                'font:800 20px Outfit,sans-serif' :
                'background:rgba(255,255,255,' + (digit ? '.12' : '.07') + ');color:#eef1ff;' +
                'font:700 21px Outfit,sans-serif') +
              (k === '0' ? ';grid-column:span 3' : '');
            // blur so a focused key cannot re-fire on the next Enter keypress
            b.addEventListener('click', function () {
              b.blur();
              if (isOk) submit(g); else padKey(g, k);
            });
            pad.appendChild(b);
          });
          wrap.appendChild(pad);
        }

        g.root.innerHTML = '';
        g.root.appendChild(wrap);
      }

      function reset(g) {
        var d = g.data;
        d.time = RUN;
        d.right = 0; d.wrong = 0;
        d.streak = 0; d.bestStreak = 0; d.mult = 1;
        d.lv = 0; d.typed = ''; d.fbT = 0; d.q = null;
        build(g);
        next(g);
        g.set('Score', '0');
        g.set('Time', RUN + 's');
        g.set('Combo', '×1');
      }

      function end(g) {
        var d = g.data;
        var title = d.right >= 32 ? 'Calculator brain!' : d.right >= 20 ? 'Sharp!' : 'Time!';
        g.gameOver({
          emo: spec.emo, title: title,
          text: d.right + ' right · ' + d.wrong + ' wrong · best streak ' + d.bestStreak + '.'
        });
      }

      return Milo.domGame(host, {
        id: spec.id,
        bg: spec.bg,
        emo: spec.emo,
        stats: ['Score', 'Time', 'Combo'],
        start: spec.start,
        init: reset,

        onKey: function (g, e) {
          var d = g.data;
          if (!d.q) return;
          if (spec.mode === 'choice') {
            var n = parseInt(e.key, 10);
            if (n >= 1 && n <= d.q.choices.length) choose(g, n - 1);
            return;
          }
          if (e.key === 'Enter' || e.key === '=') { submit(g); return; }
          if (e.key === 'Backspace') { e.preventDefault(); d.typed = d.typed.slice(0, -1); renderTyped(g); return; }
          if (e.key === '-' && spec.neg) { padKey(g, '±'); return; }
          if (/^[0-9]$/.test(e.key)) {
            if (d.typed.replace('-', '').length < 6) { d.typed += e.key; renderTyped(g); }
          }
        },

        update: function (g, dt) {
          var d = g.data;
          if (d.fbT > 0) {
            d.fbT -= dt;
            if (d.fbT <= 0) setNote(g);
          }
          d.time -= dt;
          if (d.time < 0) d.time = 0;
          g.set('Time', Math.ceil(d.time) + 's');
          els.tbar.style.width = (d.time / RUN * 100) + '%';
          els.tbar.style.background = d.time < 15 ? '#fb7185' : d.time < 30 ? '#fbbf24' : '#34d399';
          if (spec.beat && d.q && d.time > 0) {
            d.beat -= dt;
            if (d.beat < 0) d.beat = 0;
            els.bbar.style.width = (d.beat / d.beatMax * 100) + '%';
            if (d.beat <= 0) wrong(g, true);
          }
          if (d.time <= 0) end(g);
        }
      });
    };
  }

  /* --------------------------------------------------------- the 16 games */

  var TYPE_KEYS = ['Tap the pad', 'Or type digits', 'Enter'];
  var PICK_KEYS = ['Tap an answer', 'Keys 1–4'];

  window.Milo.register({
    id: 'math-times-easy', title: 'Times Tables 2–5', emo: '✖️', category: 'Puzzle',
    tagline: 'The friendly tables, against the clock',
    description: 'Ninety seconds of the 2, 3, 4 and 5 times tables, typed on a big ' +
      'number pad. Early questions stay under ×6, then the second factor climbs to ' +
      '×12 as your correct count grows. Four right in a row starts a combo ' +
      'multiplier worth up to ×5 per answer — but one slip resets it and costs ' +
      'five seconds. Tip: the 5s always end in 0 or 5, so bank those instantly.',
    controls: TYPE_KEYS,
    colors: ['#38bdf8', '#1d4ed8'],
    tags: ['maths', 'times tables', 'timed', 'kids', 'drill'],
    mount: mathMount({
      id: 'math-times-easy', emo: '✖️', bg: '#0c1a33', accent: '#38bdf8',
      mode: 'type', gen: GENS['math-times-easy'], noteDefault: 'times tables',
      start: {
        title: 'Times Tables 2–5',
        text: 'Ninety seconds on the 2–5 times tables. Type each answer on the pad ' +
          'and hit OK. Streaks multiply your points up to ×5; a wrong answer ' +
          'costs five seconds and the combo.',
        keys: TYPE_KEYS
      }
    })
  });

  window.Milo.register({
    id: 'math-times-hard', title: 'Times Tables 6–12', emo: '💪', category: 'Puzzle',
    tagline: 'Sixes to twelves — the tables that bite',
    description: 'The same 90-second pad drill, but every question comes from the 6 ' +
      'to 12 times tables. It opens gently with small second factors, and by the ' +
      'time you have eighteen right you are staring down 7×8 and 12×11 back to ' +
      'back. Wrong answers cost five seconds, streaks pay up to ×5. Tip: 9× ' +
      'answers have digits that sum to 9 — a free sanity check.',
    controls: TYPE_KEYS,
    colors: ['#fb7185', '#9f1239'],
    tags: ['maths', 'times tables', 'timed', 'drill', 'brain'],
    mount: mathMount({
      id: 'math-times-hard', emo: '💪', bg: '#1c0f1e', accent: '#fb7185',
      mode: 'type', gen: GENS['math-times-hard'], noteDefault: 'tables 6–12',
      start: {
        title: 'Times Tables 6–12',
        text: 'Ninety seconds on the hard tables — every question uses a factor ' +
          'from 6 to 12, and the other factor grows as you score. Type on the pad, ' +
          'OK to submit. Misses cost five seconds.',
        keys: TYPE_KEYS
      }
    })
  });

  window.Milo.register({
    id: 'math-times-mixed', title: 'Mixed Times Tables', emo: '🔀', category: 'Puzzle',
    tagline: 'Any table, any order — plus missing numbers',
    description: 'Every times table from 2 to 12, shuffled. Once you warm up it ' +
      'starts flipping questions around: instead of "7 × 6 = ?" you get ' +
      '"7 × ? = 42" and have to find the missing factor — nearly half the ' +
      'questions late in a run. Ninety seconds, five-second miss penalty, combo ' +
      'up to ×5. Tip: missing-number questions are just division in disguise.',
    controls: TYPE_KEYS,
    colors: ['#a78bfa', '#4c1d95'],
    tags: ['maths', 'times tables', 'division', 'timed', 'drill'],
    mount: mathMount({
      id: 'math-times-mixed', emo: '🔀', bg: '#150f2b', accent: '#a78bfa',
      mode: 'type', gen: GENS['math-times-mixed'], noteDefault: 'all the tables',
      start: {
        title: 'Mixed Times Tables',
        text: 'All the tables from 2 to 12 at once. Watch for the twist: later ' +
          'questions hide a factor — "7 × ? = 42" wants the missing number, not ' +
          'the product. Ninety seconds; misses cost five.',
        keys: TYPE_KEYS
      }
    })
  });

  window.Milo.register({
    id: 'math-addition', title: 'Big Addition', emo: '➕', category: 'Puzzle',
    tagline: 'Two- and three-digit sums in your head',
    description: 'Column addition without the column: 47 + 85 to warm up, then ' +
      'three-digit plus two-digit, then full three-digit sums — and at the top ' +
      'level every question is built to force a carry out of the ones. Ninety ' +
      'seconds, five off for a miss, streak combo to ×5. Tip: add the tens first ' +
      'and patch the ones after — 47+85 is 120, then 12 more.',
    controls: TYPE_KEYS,
    colors: ['#34d399', '#065f46'],
    tags: ['maths', 'addition', 'mental maths', 'timed', 'drill'],
    mount: mathMount({
      id: 'math-addition', emo: '➕', bg: '#0a1f1a', accent: '#34d399',
      mode: 'type', gen: GENS['math-addition'], noteDefault: 'add them up',
      start: {
        title: 'Big Addition',
        text: 'Ninety seconds of 2- and 3-digit addition. It starts with double ' +
          'digits and ramps to three-digit sums with forced carries. Type the ' +
          'total, OK to submit; a wrong total costs five seconds.',
        keys: TYPE_KEYS
      }
    })
  });

  window.Milo.register({
    id: 'math-subtraction', title: 'Borrow Master', emo: '➖', category: 'Puzzle',
    tagline: 'Every question makes you borrow',
    description: 'Subtraction with the training wheels off: every single question ' +
      'is generated so the ones column comes up short and you have to borrow. ' +
      'Runs open on two-digit takeaways, move to three digits, and finish with ' +
      'questions that borrow in the ones AND the tens. Answers are always ' +
      'positive. Tip: round the bottom number up — 62 − 27 is 62 − 30 + 3.',
    controls: TYPE_KEYS,
    colors: ['#fbbf24', '#92400e'],
    tags: ['maths', 'subtraction', 'mental maths', 'timed', 'drill'],
    mount: mathMount({
      id: 'math-subtraction', emo: '➖', bg: '#211605', accent: '#fbbf24',
      mode: 'type', gen: GENS['math-subtraction'], noteDefault: 'borrowing needed',
      start: {
        title: 'Borrow Master',
        text: 'Ninety seconds of subtraction where the ones column always needs a ' +
          'borrow — no lazy questions. Two digits first, then three, then double ' +
          'borrows. Five seconds off per miss.',
        keys: TYPE_KEYS
      }
    })
  });

  window.Milo.register({
    id: 'math-division', title: 'Division Drill', emo: '➗', category: 'Puzzle',
    tagline: 'Clean divides only — no remainders, no mercy',
    description: 'Every question divides exactly: 63 ÷ 9, 132 ÷ 11, and so on up ' +
      'to 144 ÷ 12. The quotients grow as you score, so late-run questions live ' +
      'in the upper reaches of the tables. Ninety seconds, five-second miss ' +
      'penalty, streak combo to ×5. Tip: it is times tables backwards — ask ' +
      '"nine times what makes 63?" instead of dividing.',
    controls: TYPE_KEYS,
    colors: ['#2dd4bf', '#134e4a'],
    tags: ['maths', 'division', 'times tables', 'timed', 'drill'],
    mount: mathMount({
      id: 'math-division', emo: '➗', bg: '#082121', accent: '#2dd4bf',
      mode: 'type', gen: GENS['math-division'], noteDefault: 'exact division',
      start: {
        title: 'Division Drill',
        text: 'Ninety seconds of division that always comes out exact. The numbers ' +
          'climb toward 144 ÷ 12 as you score. Type the quotient, OK to submit; ' +
          'a miss costs five seconds.',
        keys: TYPE_KEYS
      }
    })
  });

  window.Milo.register({
    id: 'math-doubles-halves', title: 'Doubles & Halves', emo: '🪞', category: 'Puzzle',
    tagline: 'Double it or halve it before the clock cares',
    description: 'One skill, two directions: "Double 47" or "Half of 86", fifty-' +
      'fifty. Numbers start under 50 and grow to three digits by the end of a ' +
      'run; halves are always of even numbers so the answer is whole. Ninety ' +
      'seconds, misses cost five, streaks pay to ×5. Tip: split at the tens — ' +
      'double 470 is double 400 plus double 70.',
    controls: TYPE_KEYS,
    colors: ['#f472b6', '#831843'],
    tags: ['maths', 'doubling', 'halving', 'mental maths', 'timed'],
    mount: mathMount({
      id: 'math-doubles-halves', emo: '🪞', bg: '#20101c', accent: '#f472b6',
      mode: 'type', gen: GENS['math-doubles-halves'], noteDefault: 'double or halve',
      start: {
        title: 'Doubles & Halves',
        text: 'Ninety seconds of doubling and halving. The numbers grow from tens ' +
          'into the hundreds as you score; halves are always even, so every ' +
          'answer is a whole number. Five seconds off per miss.',
        keys: TYPE_KEYS
      }
    })
  });

  window.Milo.register({
    id: 'math-fractions', title: 'Fraction Frenzy', emo: '🍕', category: 'Puzzle',
    tagline: 'Compare, simplify and add — tap the right slice',
    description: 'Multiple-choice fractions: early questions ask which of two ' +
      'fractions is larger or smaller, then "Simplify 12/16" joins in, then ' +
      'same-denominator additions whose answers must be given in simplest form, ' +
      'and finally cross-denominator comparisons. Every wrong option is a ' +
      'genuinely different value — no trick duplicates. Tip: for comparisons, ' +
      'cross-multiply instead of finding common denominators.',
    controls: PICK_KEYS,
    colors: ['#fb923c', '#7c2d12'],
    tags: ['maths', 'fractions', 'timed', 'brain', 'school'],
    mount: mathMount({
      id: 'math-fractions', emo: '🍕', bg: '#1f1208', accent: '#fb923c',
      mode: 'choice', gen: GENS['math-fractions'], noteDefault: 'tap the right fraction',
      start: {
        title: 'Fraction Frenzy',
        text: 'Ninety seconds of fractions, answered by tapping. Compare two ' +
          'fractions, simplify one, or add two with the same bottom — the mix ' +
          'gets tougher as you score. Wrong taps cost five seconds.',
        keys: PICK_KEYS
      }
    })
  });

  window.Milo.register({
    id: 'math-percentages', title: 'Percent Power', emo: '💯', category: 'Puzzle',
    tagline: '25% of 80, right now',
    description: 'Percent-of-amount questions that always come out whole: 25% of ' +
      '80, 30% of 120, and eventually 175% of 44. Early runs stick to 10/25/50/75 ' +
      'percent of small amounts, then the percentages get awkward and the amounts ' +
      'grow past 500. Ninety seconds, five off per miss. Tip: build from 10% — ' +
      '35% is three 10-percents and a half of one.',
    controls: TYPE_KEYS,
    colors: ['#4ade80', '#14532d'],
    tags: ['maths', 'percentages', 'mental maths', 'timed', 'drill'],
    mount: mathMount({
      id: 'math-percentages', emo: '💯', bg: '#0b2013', accent: '#4ade80',
      mode: 'type', gen: GENS['math-percentages'], noteDefault: 'percent of an amount',
      start: {
        title: 'Percent Power',
        text: 'Ninety seconds of "what is X% of Y?" — every answer is a whole ' +
          'number. Easy quarters and halves first, then 35% of 260 and even ' +
          'percentages over 100. Misses cost five seconds.',
        keys: TYPE_KEYS
      }
    })
  });

  window.Milo.register({
    id: 'math-negatives', title: 'Below Zero', emo: '❄️', category: 'Puzzle',
    tagline: 'Arithmetic where minus signs fight back',
    description: 'Adding and subtracting around zero: −7 + 12, then 5 − 13, then ' +
      'the classic trap of subtracting a negative — 4 − (−9). The pad grows a ± ' +
      'key because plenty of answers are negative. Magnitudes climb from ten to ' +
      'fifty across the run. Tip: subtracting a negative is adding — rewrite it ' +
      'before your brain does anything else.',
    controls: ['Tap the pad', '± for sign', 'Enter'],
    colors: ['#94a3b8', '#0f172a'],
    tags: ['maths', 'negative numbers', 'timed', 'brain', 'school'],
    mount: mathMount({
      id: 'math-negatives', emo: '❄️', bg: '#0d1526', accent: '#94a3b8',
      mode: 'type', neg: true, gen: GENS['math-negatives'], noteDefault: 'mind the signs',
      start: {
        title: 'Below Zero',
        text: 'Ninety seconds of sums that cross zero. Use the ± key (or the minus ' +
          'key) when the answer is negative. Watch for "− (−n)" — that is ' +
          'addition wearing a disguise. Misses cost five seconds.',
        keys: ['± flips the sign', 'Type digits', 'Enter']
      }
    })
  });

  window.Milo.register({
    id: 'math-order-ops', title: 'Order of Ops', emo: '🧮', category: 'Puzzle',
    tagline: 'BODMAS or bust — multiply before you add',
    description: 'Expressions with two or three operations where the order is the ' +
      'whole game: 3 + 4 × 5 is 23, not 35. Runs open with a single hidden ' +
      'multiply, then brackets appear, then double products like 6 × 4 − 3 × 5, ' +
      'and finally division mixed in — always dividing exactly. Ninety seconds, ' +
      'five off per miss. Tip: scan for × and ÷ first, collapse them, then sweep ' +
      'left to right.',
    controls: TYPE_KEYS,
    colors: ['#c084fc', '#581c87'],
    tags: ['maths', 'bodmas', 'order of operations', 'timed', 'brain'],
    mount: mathMount({
      id: 'math-order-ops', emo: '🧮', bg: '#170b24', accent: '#c084fc',
      mode: 'type', gen: GENS['math-order-ops'], noteDefault: 'multiply & divide first',
      start: {
        title: 'Order of Ops',
        text: 'Ninety seconds of BODMAS. Multiplication and division bind before ' +
          'addition and subtraction, and brackets beat everything. One hidden ' +
          'multiply to start; harder shapes as you score.',
        keys: TYPE_KEYS
      }
    })
  });

  window.Milo.register({
    id: 'math-estimation', title: 'Estimation Station', emo: '🎯', category: 'Puzzle',
    tagline: 'Do not compute it — feel it, fast',
    description: 'Four answers on screen, one beat of the clock to tap whichever ' +
      'is closest to 47 × 62. You are never given time to actually multiply — ' +
      'the shrinking bar starts at seven seconds and tightens toward four as you ' +
      'answer, and letting it empty counts as a miss. Exactly one option is ' +
      'strictly closest, guaranteed. Tip: round both numbers, multiply the ' +
      'rounds, and trust it.',
    controls: PICK_KEYS,
    colors: ['#facc15', '#713f12'],
    tags: ['maths', 'estimation', 'rounding', 'timed', 'reflex'],
    mount: mathMount({
      id: 'math-estimation', emo: '🎯', bg: '#1f1a06', accent: '#facc15',
      mode: 'choice', gen: GENS['math-estimation'],
      beat: function (answered) { return Math.max(4, 7 - answered * 0.12); },
      start: {
        title: 'Estimation Station',
        text: 'Tap the option closest to the true answer before the yellow bar ' +
          'empties — around seven seconds at first, tightening as you go. No time ' +
          'to calculate; round and commit. Timeouts and wrong taps cost five ' +
          'seconds each.',
        keys: PICK_KEYS
      }
    })
  });

  window.Milo.register({
    id: 'math-number-bonds', title: 'Number Bonds', emo: '🔗', category: 'Puzzle',
    tagline: 'What pairs with 64 to make 100?',
    description: 'Fill the gap: 64 + ? = 100. Runs start with bonds to 20, move ' +
      'through multiples of five to 100, then any number to 100, and finish with ' +
      'bonds to 1000. Ninety seconds, five-second miss penalty, combo to ×5. ' +
      'Tip: for bonds to 100, the ones digits pair to 10 and the tens to 9 — ' +
      '64 needs 36, always.',
    controls: TYPE_KEYS,
    colors: ['#22d3ee', '#155e75'],
    tags: ['maths', 'number bonds', 'addition', 'timed', 'kids'],
    mount: mathMount({
      id: 'math-number-bonds', emo: '🔗', bg: '#07202a', accent: '#22d3ee',
      mode: 'type', gen: GENS['math-number-bonds'], noteDefault: 'complete the pair',
      start: {
        title: 'Number Bonds',
        text: 'Type the missing number that completes each sum — to 20 at first, ' +
          'then to 100, then to 1000. Ninety seconds; every wrong bond costs ' +
          'five of them.',
        keys: TYPE_KEYS
      }
    })
  });

  window.Milo.register({
    id: 'math-primes', title: 'Prime Hunter', emo: '🔎', category: 'Puzzle',
    tagline: 'Prime or pretender? 91 would like a word',
    description: 'Snap judgements about primes: "Is 57 prime?" (it is not — 3×19), ' +
      '"Which of these is a factor of 84?", and later "Which of these four is ' +
      'prime?" with three odd composites bluffing. Numbers grow from under 30 to ' +
      'nearly 200 across the run. Tap to answer; misses cost five seconds. Tip: ' +
      'test 7, 11 and 13 before trusting an odd number — 91, 119 and 143 all ' +
      'look prime and are not.',
    controls: PICK_KEYS,
    colors: ['#818cf8', '#312e81'],
    tags: ['maths', 'primes', 'factors', 'timed', 'brain'],
    mount: mathMount({
      id: 'math-primes', emo: '🔎', bg: '#101230', accent: '#818cf8',
      mode: 'choice', gen: GENS['math-primes'], noteDefault: 'primes & factors',
      start: {
        title: 'Prime Hunter',
        text: 'Ninety seconds of prime spotting and factor finding. Early numbers ' +
          'are small; late ones push toward 200, where the odd composites get ' +
          'sneaky. Tap your answer — wrong taps cost five seconds.',
        keys: PICK_KEYS
      }
    })
  });

  window.Milo.register({
    id: 'math-squares', title: 'Squares & Roots', emo: '🟦', category: 'Puzzle',
    tagline: 'From 7² to √361 in one run',
    description: 'Square numbers both ways: 13² asks for 169, √144 asks for 12. ' +
      'Runs begin with the small squares, and once you are warmed up root ' +
      'questions join the mix, climbing to 20² and √400. Every root is of a ' +
      'perfect square, so answers are always whole. Ninety seconds, five off per ' +
      'miss. Tip: learn 11–20 squared as facts — 15² = 225 should not need ' +
      'working out.',
    controls: TYPE_KEYS,
    colors: ['#e879f9', '#701a75'],
    tags: ['maths', 'squares', 'roots', 'timed', 'drill'],
    mount: mathMount({
      id: 'math-squares', emo: '🟦', bg: '#1d0b21', accent: '#e879f9',
      mode: 'type', gen: GENS['math-squares'], noteDefault: 'squares & roots',
      start: {
        title: 'Squares & Roots',
        text: 'Ninety seconds of n² and √n. Small squares first; square roots ' +
          'arrive mid-run and the numbers stretch to 20² = 400. Misses cost ' +
          'five seconds.',
        keys: TYPE_KEYS
      }
    })
  });

  window.Milo.register({
    id: 'math-sequences', title: 'Sequence Sleuth', emo: '📈', category: 'Puzzle',
    tagline: 'Four terms in — what comes fifth?',
    description: 'Spot the pattern and type the next term: 4, 7, 10, 13 wants 16. ' +
      'Simple add-and-subtract chains give way to doubling and tripling runs, ' +
      'square numbers and Fibonacci-style sums, then patterns whose gaps grow ' +
      'each step and zig-zags that alternate adding and subtracting. Ninety ' +
      'seconds, five off per miss. Tip: write the differences in your head first ' +
      '— if they are not constant, check whether THEY change by a constant.',
    controls: TYPE_KEYS,
    colors: ['#5eead4', '#0f766e'],
    tags: ['maths', 'sequences', 'patterns', 'timed', 'brain'],
    mount: mathMount({
      id: 'math-sequences', emo: '📈', bg: '#07211d', accent: '#5eead4',
      mode: 'type', gen: GENS['math-sequences'], noteDefault: 'what comes next?',
      start: {
        title: 'Sequence Sleuth',
        text: 'Each question shows four terms of a pattern — type the fifth. ' +
          'Adding chains first, then doublings, squares, Fibonacci sums and ' +
          'growing gaps. Ninety seconds; misses cost five.',
        keys: TYPE_KEYS
      }
    })
  });

})();
