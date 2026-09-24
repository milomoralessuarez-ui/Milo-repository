/* Backgammon — the full rules: doubles, the bar, the entry rule, blocked
   points, bearing off, gammons. No doubling cube. */
(function () {
  'use strict';

  var YOU = 1, CPU = -1, BAR = 24, OFF = 99;

  /* Shots out of 36 that hit a blot at a given distance, the standard table. */
  var SHOTS = [0, 11, 12, 14, 15, 15, 17, 6, 6, 5, 3, 2, 3, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1];

  function startState() {
    var p = new Int8Array(24);
    p[23] = 2; p[12] = 5; p[7] = 3; p[5] = 5;        // you run 23 -> 0
    p[0] = -2; p[11] = -5; p[16] = -3; p[18] = -5;   // the CPU runs 0 -> 23
    return { p: p, barYou: 0, barCpu: 0, offYou: 0, offCpu: 0 };
  }

  function clone(st) {
    return {
      p: Int8Array.from(st.p), barYou: st.barYou, barCpu: st.barCpu,
      offYou: st.offYou, offCpu: st.offCpu
    };
  }

  function barOf(st, who) { return who === YOU ? st.barYou : st.barCpu; }
  function offOf(st, who) { return who === YOU ? st.offYou : st.offCpu; }

  function canLand(st, t, who) {
    var v = st.p[t];
    return who === YOU ? v >= -1 : v <= 1;
  }

  /** All 15 checkers home (and none on the bar) — the bearing-off condition. */
  function allHome(st, who) {
    if (barOf(st, who) > 0) return false;
    var i;
    if (who === YOU) {
      for (i = 6; i < 24; i++) if (st.p[i] > 0) return false;
    } else {
      for (i = 0; i < 18; i++) if (st.p[i] < 0) return false;
    }
    return true;
  }

  /** Is there a checker further from home than index i? */
  function anyFurther(st, who, i) {
    var k;
    if (who === YOU) { for (k = i + 1; k < 6; k++) if (st.p[k] > 0) return true; }
    else { for (k = 18; k < i; k++) if (st.p[k] < 0) return true; }
    return false;
  }

  /** Every legal single move for one die value. */
  function singleMoves(st, who, die) {
    var out = [], i;
    if (barOf(st, who) > 0) {
      var e = who === YOU ? 24 - die : die - 1;
      if (canLand(st, e, who)) out.push({ f: BAR, t: e });
      return out;                                   // the bar comes first, always
    }
    var home = allHome(st, who);
    for (i = 0; i < 24; i++) {
      if (who === YOU ? st.p[i] <= 0 : st.p[i] >= 0) continue;
      var t = i - who * die;
      if (t >= 0 && t <= 23) {
        if (canLand(st, t, who)) out.push({ f: i, t: t });
        continue;
      }
      if (!home) continue;
      var need = who === YOU ? i + 1 : 24 - i;
      if (die === need || (die > need && !anyFurther(st, who, i))) out.push({ f: i, t: OFF });
    }
    return out;
  }

  function applySingle(st, who, mv) {
    var s = clone(st);
    if (mv.f === BAR) { if (who === YOU) s.barYou--; else s.barCpu--; }
    else s.p[mv.f] -= who;
    if (mv.t === OFF) { if (who === YOU) s.offYou++; else s.offCpu++; }
    else {
      if (who === YOU && s.p[mv.t] === -1) { s.p[mv.t] = 0; s.barCpu++; }
      else if (who === CPU && s.p[mv.t] === 1) { s.p[mv.t] = 0; s.barYou++; }
      s.p[mv.t] += who;
    }
    return s;
  }

  function stKey(st) {
    return st.p.join(',') + '|' + st.barYou + ',' + st.barCpu + ',' + st.offYou + ',' + st.offCpu;
  }

  /* Searching every ordering of four doubles gets expensive fast, so results
     are cached by position + remaining dice. */
  var memo = {}, memoN = 0;

  /** The most dice that can legally be played — the rule that forces moves. */
  function maxUse(st, who, dice) {
    if (!dice.length) return 0;
    var key = stKey(st) + '|' + who + '|' + dice.slice().sort().join('');
    if (memo[key] !== undefined) return memo[key];
    var best = 0, tried = {}, i, j;
    for (i = 0; i < dice.length; i++) {
      var d = dice[i];
      if (tried[d]) continue;
      tried[d] = 1;
      var ms = singleMoves(st, who, d);
      for (j = 0; j < ms.length; j++) {
        var rest = dice.slice();
        rest.splice(i, 1);
        var v = 1 + maxUse(applySingle(st, who, ms[j]), who, rest);
        if (v > best) best = v;
        if (best === dice.length) { i = dice.length; break; }
      }
    }
    if (memoN > 30000) { memo = {}; memoN = 0; }
    memo[key] = best;
    memoN++;
    return best;
  }

  /** The single moves that keep the maximum dice usage available. */
  function legalSub(st, who, dice, need) {
    var out = [], tried = {}, i, j;
    if (need <= 0) return out;
    for (i = 0; i < dice.length; i++) {
      var d = dice[i];
      if (tried[d]) continue;
      tried[d] = 1;
      var rest = dice.slice();
      rest.splice(i, 1);
      var ms = singleMoves(st, who, d);
      for (j = 0; j < ms.length; j++) {
        var ns = applySingle(st, who, ms[j]);
        if (maxUse(ns, who, rest) >= need - 1) out.push({ f: ms[j].f, t: ms[j].t, d: d });
      }
    }
    return out;
  }

  /** Every complete turn of `need` moves, deduplicated by resulting position. */
  function allTurns(st, who, dice, need, cap) {
    var out = [], seen = {};
    (function walk(s, remaining, path) {
      if (out.length >= cap) return;
      if (path.length === need) {
        var key = s.p.join(',') + '|' + s.barYou + '|' + s.barCpu + '|' + s.offYou + '|' + s.offCpu;
        if (seen[key]) return;
        seen[key] = 1;
        out.push({ st: s, path: path });
        return;
      }
      var tried = {}, i, j;
      for (i = 0; i < remaining.length; i++) {
        var d = remaining[i];
        if (tried[d]) continue;
        tried[d] = 1;
        var rest = remaining.slice();
        rest.splice(i, 1);
        var ms = singleMoves(s, who, d);
        for (j = 0; j < ms.length; j++) {
          var ns = applySingle(s, who, ms[j]);
          if (maxUse(ns, who, rest) >= need - path.length - 1) walk(ns, rest, path.concat([ms[j]]));
        }
      }
    })(st, dice, []);
    return out;
  }

  function pip(st, who) {
    var n = 0, i;
    if (who === YOU) {
      for (i = 0; i < 24; i++) if (st.p[i] > 0) n += st.p[i] * (i + 1);
      n += st.barYou * 25;
    } else {
      for (i = 0; i < 24; i++) if (st.p[i] < 0) n += -st.p[i] * (24 - i);
      n += st.barCpu * 25;
    }
    return n;
  }

  /** Shots the opponent has at a blot sitting on index i. */
  function blotRisk(st, who, i) {
    var risk = 0, k, dst;
    if (who === YOU) {
      for (k = 0; k < 24; k++) {
        if (st.p[k] >= 0) continue;
        dst = i - k;                                  // the CPU moves upward
        if (dst > 0 && dst <= 24) risk += SHOTS[dst];
      }
      if (st.barCpu > 0) { dst = i + 1; if (dst <= 24) risk += SHOTS[dst]; }
    } else {
      for (k = 0; k < 24; k++) {
        if (st.p[k] <= 0) continue;
        dst = k - i;
        if (dst > 0 && dst <= 24) risk += SHOTS[dst];
      }
      if (st.barYou > 0) { dst = 24 - i; if (dst <= 24) risk += SHOTS[dst]; }
    }
    return risk;
  }

  /** Positive favours the CPU. */
  function evaluate(st) {
    var s = (pip(st, YOU) - pip(st, CPU)) * 1.0, i, n;
    s += (st.offCpu - st.offYou) * 4;
    s -= st.barCpu * 30;
    s += st.barYou * 26;
    var prime = 0, best = 0;
    for (i = 0; i < 24; i++) {
      n = st.p[i];
      if (n <= -2) {
        s += 6;
        if (i >= 18) s += 5;                          // points in its own home board
        if (i === 19 || i === 18 || i === 16) s += 5; // the strong points
        prime++;
        if (prime > best) best = prime;
      } else {
        prime = 0;
      }
      if (n === -1) s -= blotRisk(st, CPU, i) * 1.5;
      if (n === 1) s += blotRisk(st, YOU, i) * .9;
      if (n >= 2) { s -= 5; if (i <= 5) s -= 4; }
    }
    s += best * best * 2.5;
    return s;
  }

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var NS = 'http://www.w3.org/2000/svg';
    var svg, layer, statusEl, undoBtn;
    var W = 820, H = 540, CH = 200, R = 20, SP = 40;
    var LX = [59, 117, 175, 233, 291, 349], RX = [459, 517, 575, 633, 691, 749];

    function sv(name, attrs) {
      var e = document.createElementNS(NS, name);
      for (var k in attrs) if (attrs.hasOwnProperty(k)) e.setAttribute(k, attrs[k]);
      return e;
    }
    /** Screen column for a point index, and whether it lives on the top row. */
    function colX(i) {
      if (i <= 5) return RX[5 - i];
      if (i <= 11) return LX[11 - i];
      if (i <= 17) return LX[i - 12];
      return RX[i - 18];
    }
    function isTop(i) { return i >= 12; }
    function checkerY(i, k) { return isTop(i) ? 24 + R + k * SP : H - 24 - R - k * SP; }

    function elm(tag, css, txt) {
      var e = document.createElement(tag);
      if (css) e.style.cssText = css;
      if (txt != null) e.textContent = txt;
      return e;
    }
    function button(label, fn) {
      var b = elm('button', 'font:600 .82rem/1 Outfit,system-ui,sans-serif;padding:8px 14px;' +
        'border-radius:9px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.09);' +
        'color:#f6ead6;cursor:pointer', label);
      b.type = 'button';
      b.addEventListener('click', fn);
      return b;
    }

    function build(g) {
      var wrap = elm('div', 'display:flex;flex-direction:column;align-items:center;gap:9px;width:100%');
      svg = sv('svg', { viewBox: '0 0 ' + W + ' ' + H });
      svg.style.cssText = 'width:min(96vw,860px);max-height:60vh;border-radius:10px;' +
        'box-shadow:0 8px 26px rgba(0,0,0,.45);touch-action:manipulation';
      statusEl = elm('div', 'color:#f4e6d0;font:600 .86rem/1.35 Outfit,system-ui,sans-serif;' +
        'text-align:center;min-height:2.3em;max-width:36em');
      var bar = elm('div', 'display:flex;gap:8px');
      undoBtn = button('Undo move', function () { undoSub(g); });
      bar.appendChild(undoBtn);
      wrap.appendChild(svg);
      wrap.appendChild(statusEl);
      wrap.appendChild(bar);
      g.root.innerHTML = '';
      g.root.appendChild(wrap);
    }

    function reset(g) {
      var d = g.data;
      d.st = startState();
      d.turn = 0;
      d.dice = [];
      d.rolled = [];
      d.need = 0;
      d.sel = null;
      d.over = false;
      d.busy = false;
      d.turnStart = null;
      d.subs = [];
      d.msg = 'Opening roll: one die each, higher number starts.';
      build(g);
      paint(g);
      d.busy = true;
      setTimeout(function () { opening(g); }, 600);
    }

    function opening(g) {
      var d = g.data;
      d.busy = false;
      if (g.state !== 'play' || d.over) return;
      var a, b;
      do { a = U.randInt(1, 6); b = U.randInt(1, 6); } while (a === b);
      d.rolled = [a, b];
      d.dice = [a, b];
      d.turn = a > b ? YOU : CPU;
      d.msg = 'Opening roll ' + a + '–' + b + ': ' +
        (d.turn === YOU ? 'you start and play both numbers.' : 'the CPU starts.');
      Milo.sound.blip();
      beginTurn(g, true);
    }

    function rollDice() {
      var a = U.randInt(1, 6), b = U.randInt(1, 6);
      return a === b ? [a, a, a, a] : [a, b];
    }

    function beginTurn(g, preRolled) {
      var d = g.data;
      if (d.over) return;
      if (!preRolled) d.dice = rollDice();
      d.rolled = d.dice.slice();
      d.turnStart = clone(d.st);
      d.subs = [];
      d.sel = null;
      var who = d.turn;
      d.need = maxUse(d.st, who, d.dice);

      // Only one die playable and they differ: the higher one must be used.
      if (d.need === 1 && d.dice.length === 2 && d.dice[0] !== d.dice[1]) {
        var hi = Math.max(d.dice[0], d.dice[1]), lo = Math.min(d.dice[0], d.dice[1]);
        d.dice = singleMoves(d.st, who, hi).length ? [hi] : [lo];
      }

      if (d.need === 0) {
        d.msg = (who === YOU ? 'You roll ' : 'CPU rolls ') + d.rolled.slice(0, 2).join('–') +
          (d.rolled.length === 4 ? ' (doubles)' : '') + ' — no legal move, the turn is lost.';
        paint(g);
        d.busy = true;
        setTimeout(function () { endTurn(g); }, 1100);
        return;
      }
      if (who === YOU) {
        d.msg = 'You rolled ' + d.rolled.slice(0, 2).join('–') +
          (d.rolled.length === 4 ? ' — doubles, four moves!' : '') +
          '  Click one of your checkers.';
        paint(g);
      } else {
        d.msg = 'CPU rolled ' + d.rolled.slice(0, 2).join('–') +
          (d.rolled.length === 4 ? ' (doubles)' : '') + '…';
        paint(g);
        d.busy = true;
        setTimeout(function () { cpuTurn(g); }, 480);
      }
    }

    function endTurn(g) {
      var d = g.data;
      d.busy = false;
      if (g.state !== 'play' || d.over) return;
      if (checkWin(g)) return;
      d.turn = d.turn === YOU ? CPU : YOU;
      beginTurn(g, false);
    }

    function checkWin(g) {
      var d = g.data;
      if (d.st.offYou < 15 && d.st.offCpu < 15) return false;
      d.over = true;
      var youWon = d.st.offYou >= 15;
      var loserOff = youWon ? d.st.offCpu : d.st.offYou;
      var value = 1, kind = 'a single game';
      if (loserOff === 0) {
        var inHome = false, i;
        if (youWon) {
          if (d.st.barCpu > 0) inHome = true;
          for (i = 0; i <= 5; i++) if (d.st.p[i] < 0) inHome = true;   // your home board
        } else {
          if (d.st.barYou > 0) inHome = true;
          for (i = 18; i <= 23; i++) if (d.st.p[i] > 0) inHome = true;
        }
        value = inHome ? 3 : 2;
        kind = inHome ? 'a backgammon (triple)' : 'a gammon (double)';
      }
      paint(g);
      var text = (youWon ? 'You bore off all fifteen checkers' : 'The CPU bore off all fifteen') +
        ' and the loser had ' + loserOff + ' off, so it scores ' + value +
        ' point' + (value > 1 ? 's' : '') + ' — ' + kind + '.';
      if (youWon) {
        g.win({ emo: '🎲', title: 'You win ' + value + '–0', text: text, score: 400 * value + 200 });
      } else {
        g.gameOver({ emo: '🎲', title: 'CPU wins ' + value + '–0', text: text, score: d.st.offYou * 25 });
      }
      return true;
    }

    /* ------------------------------------------------------------- drawing */

    function drawPoint(i) {
      var x = colX(i), top = isTop(i);
      var dark = i % 2 === 0;
      var pts = top
        ? (x - 27) + ',24 ' + (x + 27) + ',24 ' + x + ',' + (24 + CH)
        : (x - 27) + ',' + (H - 24) + ' ' + (x + 27) + ',' + (H - 24) + ' ' + x + ',' + (H - 24 - CH);
      return sv('polygon', { points: pts, fill: dark ? '#8c3d2e' : '#d8c5a4', opacity: .92 });
    }

    function paint(g) {
      var d = g.data, st = d.st, i, k;
      if (!svg) return;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(sv('rect', { x: 0, y: 0, width: W, height: H, fill: '#20372c' }));
      svg.appendChild(sv('rect', { x: 20, y: 14, width: 770, height: H - 28, rx: 6, fill: '#2f5140' }));
      svg.appendChild(sv('rect', { x: 380, y: 14, width: 50, height: H - 28, fill: '#1b2f26' }));
      svg.appendChild(sv('rect', { x: 762, y: 14, width: 28, height: H - 28, rx: 4, fill: '#1b2f26' }));

      for (i = 0; i < 24; i++) svg.appendChild(drawPoint(i));

      var sub = (!d.over && d.turn === YOU && g.state === 'play' && !d.busy)
        ? legalSub(st, YOU, d.dice, d.need) : [];
      var froms = {}, targets = {};
      sub.forEach(function (m) { froms[m.f] = 1; });
      if (d.sel !== null) sub.forEach(function (m) { if (m.f === d.sel) targets[m.t] = 1; });

      // Highlights
      for (i = 0; i < 24; i++) {
        if (!targets[i] && !(froms[i] && d.sel === null) && d.sel !== i) continue;
        var x = colX(i), top = isTop(i);
        svg.appendChild(sv('rect', {
          x: x - 28, y: top ? 22 : H - 24 - CH, width: 56, height: CH + 2, rx: 4,
          fill: targets[i] ? '#4ade80' : (d.sel === i ? '#ffd257' : '#ffffff'),
          opacity: targets[i] ? .35 : (d.sel === i ? .3 : .12)
        }));
      }
      if (targets[OFF]) {
        svg.appendChild(sv('rect', { x: 760, y: 14, width: 32, height: H - 28, rx: 4, fill: '#4ade80', opacity: .4 }));
      }

      // Checkers
      for (i = 0; i < 24; i++) {
        var n = st.p[i];
        if (!n) continue;
        var mine = n > 0, cnt = Math.abs(n), show = Math.min(cnt, 5);
        for (k = 0; k < show; k++) {
          svg.appendChild(sv('circle', {
            cx: colX(i), cy: checkerY(i, k), r: R,
            fill: mine ? '#f3e3c3' : '#8f1f2e',
            stroke: mine ? '#b39a6e' : '#4a0d16', 'stroke-width': 2
          }));
        }
        if (cnt > 5) {
          var t = sv('text', {
            x: colX(i), y: checkerY(i, 4) + 6, 'text-anchor': 'middle',
            fill: mine ? '#4a3a1c' : '#ffe6ea', 'font-size': 20, 'font-weight': 700
          });
          t.textContent = cnt;
          svg.appendChild(t);
        }
      }

      // The bar
      for (k = 0; k < st.barYou; k++) {
        svg.appendChild(sv('circle', { cx: 405, cy: H - 60 - k * 30, r: 17, fill: '#f3e3c3', stroke: '#b39a6e', 'stroke-width': 2 }));
      }
      for (k = 0; k < st.barCpu; k++) {
        svg.appendChild(sv('circle', { cx: 405, cy: 60 + k * 30, r: 17, fill: '#8f1f2e', stroke: '#4a0d16', 'stroke-width': 2 }));
      }
      if (froms[BAR]) {
        svg.appendChild(sv('rect', { x: 382, y: H / 2 - 60, width: 46, height: 120, rx: 6, fill: '#ffffff', opacity: d.sel === BAR ? .32 : .16 }));
      }

      // Borne off
      for (k = 0; k < st.offYou; k++) {
        svg.appendChild(sv('rect', { x: 766, y: H - 26 - (k + 1) * 15, width: 20, height: 11, rx: 2, fill: '#f3e3c3' }));
      }
      for (k = 0; k < st.offCpu; k++) {
        svg.appendChild(sv('rect', { x: 766, y: 18 + k * 15, width: 20, height: 11, rx: 2, fill: '#8f1f2e' }));
      }

      // Dice
      var dice = d.dice, dx = d.turn === YOU ? 520 : 200;
      for (k = 0; k < dice.length && k < 4; k++) {
        var bx = dx + k * 46;
        svg.appendChild(sv('rect', { x: bx, y: H / 2 - 20, width: 38, height: 38, rx: 7, fill: '#f8f4e8', stroke: '#2b2b2b', 'stroke-width': 2 }));
        var pipsFor = [[], [[0, 0]], [[-1, -1], [1, 1]], [[-1, -1], [0, 0], [1, 1]],
          [[-1, -1], [1, -1], [-1, 1], [1, 1]], [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
          [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]]][dice[k]];
        for (var q = 0; q < pipsFor.length; q++) {
          svg.appendChild(sv('circle', {
            cx: bx + 19 + pipsFor[q][0] * 10, cy: H / 2 - 1 + pipsFor[q][1] * 10,
            r: 3.6, fill: '#24201a'
          }));
        }
      }

      // Click targets — added last so they sit on top.
      function hit(x, y, w, h, fn) {
        var r2 = sv('rect', { x: x, y: y, width: w, height: h, fill: 'transparent' });
        r2.style.cursor = 'pointer';
        r2.addEventListener('click', fn);
        svg.appendChild(r2);
      }
      for (i = 0; i < 24; i++) {
        (function (idx) {
          hit(colX(idx) - 28, isTop(idx) ? 16 : H - 24 - CH, 56, CH + 10, function () { clickPoint(g, idx); });
        })(i);
      }
      hit(382, 14, 46, H - 28, function () { clickPoint(g, BAR); });
      hit(776, 14, 26, H - 28, function () { clickPoint(g, OFF); });

      g.set('Your pip', pip(st, YOU));
      g.set('CPU pip', pip(st, CPU));
      g.set('Borne off', st.offYou + '/' + st.offCpu);
      statusEl.textContent = d.msg;
      if (undoBtn) {
        undoBtn.disabled = !d.subs.length || d.turn !== YOU || d.over || d.busy;
        undoBtn.style.opacity = undoBtn.disabled ? .45 : 1;
      }
    }

    /* ---------------------------------------------------------- your moves */

    function clickPoint(g, i) {
      var d = g.data;
      if (g.state !== 'play' || d.over || d.busy || d.turn !== YOU) return;
      var sub = legalSub(d.st, YOU, d.dice, d.need);
      if (d.sel !== null) {
        var hit = null;
        sub.forEach(function (m) { if (m.f === d.sel && m.t === i && !hit) hit = m; });
        if (hit) { playSub(g, hit); return; }
      }
      if (d.sel === i) {
        var offMv = null;
        sub.forEach(function (m) { if (m.f === i && m.t === OFF && !offMv) offMv = m; });
        if (offMv) { playSub(g, offMv); return; }
      }
      var can = sub.some(function (m) { return m.f === i; });
      if (can) {
        d.sel = i;
        var offable = sub.some(function (m) { return m.f === i && m.t === OFF; });
        d.msg = offable
          ? 'Green columns are where it may go — click it again to bear it off.'
          : 'Green columns are where it may go.';
        Milo.sound.blip();
      } else {
        d.sel = null;
        if (d.st.barYou > 0) d.msg = 'You have a checker on the bar — it must come in first.';
        else d.msg = 'No legal move from there with ' + d.dice.join(' or ') + '.';
      }
      paint(g);
    }

    function playSub(g, mv) {
      var d = g.data;
      var before = d.st;
      d.subs.push({ st: clone(before), dice: d.dice.slice(), need: d.need });
      var wasBlot = mv.t !== OFF && d.st.p[mv.t] === -1;
      d.st = applySingle(d.st, YOU, mv);
      var k = d.dice.indexOf(mv.d);
      if (k >= 0) d.dice.splice(k, 1);
      d.need--;
      d.sel = null;
      Milo.sound.tone({ f: 420, f2: 320, d: .07, v: .06, type: 'triangle' });
      if (wasBlot) { Milo.sound.hit(); d.msg = 'Hit! That checker goes to the bar.'; }
      else if (mv.t === OFF) { Milo.sound.coin(); d.msg = 'Borne off — ' + d.st.offYou + ' of 15.'; }
      else d.msg = 'Moved ' + mv.d + '.';

      if (d.st.offYou >= 15) { paint(g); checkWin(g); return; }
      if (d.need <= 0 || !legalSub(d.st, YOU, d.dice, d.need).length) {
        paint(g);
        d.busy = true;
        setTimeout(function () { endTurn(g); }, 420);
        return;
      }
      paint(g);
    }

    function undoSub(g) {
      var d = g.data;
      if (g.state !== 'play' || d.over || d.busy || d.turn !== YOU || !d.subs.length) return;
      var s = d.subs.pop();
      d.st = s.st; d.dice = s.dice; d.need = s.need; d.sel = null;
      d.msg = 'Move taken back.';
      Milo.sound.blip();
      paint(g);
    }

    /* ------------------------------------------------------------- the CPU */

    function cpuTurn(g) {
      var d = g.data;
      d.busy = false;
      if (g.state !== 'play' || d.over) return;
      var turns = allTurns(d.st, CPU, d.dice, d.need, 900);
      if (!turns.length) { d.busy = true; setTimeout(function () { endTurn(g); }, 400); return; }
      var best = null, i;
      for (i = 0; i < turns.length; i++) {
        var v = evaluate(turns[i].st) + Math.random() * 1.5;
        if (!best || v > best.v) best = { v: v, t: turns[i] };
      }
      var hits = 0, offs = 0, prev = d.st, k;
      for (k = 0; k < best.t.path.length; k++) {
        var mv = best.t.path[k];
        if (mv.t !== OFF && prev.p[mv.t] === 1) hits++;
        if (mv.t === OFF) offs++;
        prev = applySingle(prev, CPU, mv);
      }
      d.st = best.t.st;
      d.dice = [];
      d.need = 0;
      Milo.sound.tone({ f: 260, f2: 200, d: .09, v: .06, type: 'triangle' });
      if (hits) Milo.sound.hit();
      d.msg = 'CPU played ' + d.rolled.slice(0, 2).join('–') +
        (hits ? ' and hit ' + hits + ' of your blots — they go on the bar.' : '.') +
        (offs ? ' It bore off ' + offs + '.' : '');
      paint(g);
      d.busy = true;
      setTimeout(function () { endTurn(g); }, 620);
    }

    return Milo.domGame(host, {
      id: 'backgammon',
      stats: ['Your pip', 'CPU pip', 'Borne off'],
      bg: '#16271f',
      emo: '🎲',
      start: {
        title: 'Backgammon',
        text: 'Race all fifteen checkers round to your home board and bear them off. ' +
          'Two checkers make a point nobody can land on; a lone one is a blot and can be ' +
          'sent to the bar, and a checker on the bar must come in before anything else ' +
          'moves. Doubles give you four moves, and you must play both numbers if there is ' +
          'any legal way to do it. No doubling cube.',
        keys: ['Click a checker', 'Click a green column']
      },
      init: reset
    });
  }

  window.Milo.register({
    id: 'backgammon', title: 'Backgammon', emo: '🎲', category: 'Strategy',
    tagline: 'The full race — bar, blots, primes and bearing off',
    description: 'Proper backgammon against a CPU that counts pips and shots. Two ' +
      'checkers hold a point; one on its own is a blot that gets sent back to the bar, ' +
      'and nothing else may move until it re-enters from your opponent’s home board. ' +
      'Doubles are played four times, and the rules are enforced properly — if there is ' +
      'any order that plays both numbers you must find it, and if only one is playable it ' +
      'has to be the higher. Live pip counts are on screen, wins count double for a gammon ' +
      'and triple for a backgammon, and there is no doubling cube.',
    controls: ['Click a checker', 'Click a highlighted column', 'Undo move'],
    colors: ['#2f5140', '#8f1f2e'],
    tags: ['board game', 'dice', 'vs cpu', 'classic', 'strategy'],
    mount: mount
  });
})();
