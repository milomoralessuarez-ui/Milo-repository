/* Hnefatafl — the 11x11 Fetlar rules. Twenty-four attackers against a king,
   twelve defenders and four corners to run for. */
(function () {
  'use strict';

  var N = 11, SZ = 121;
  var EMPTY = 0, ATT = 1, DEF = 2, KING = 3;
  var THRONE = 5 * N + 5;
  var CORNERS = [0, N - 1, SZ - N, SZ - 1];
  var DIRS = [-N, N, -1, 1];

  function isCorner(i) { return i === CORNERS[0] || i === CORNERS[1] || i === CORNERS[2] || i === CORNERS[3]; }
  function restricted(i) { return isCorner(i) || i === THRONE; }

  /** One square from `i` in direction `k`, or -1 off the edge. */
  function stepSq(i, k) {
    var r = (i / N) | 0, c = i % N;
    if (k === 0) return r > 0 ? i - N : -1;
    if (k === 1) return r < N - 1 ? i + N : -1;
    if (k === 2) return c > 0 ? i - 1 : -1;
    return c < N - 1 ? i + 1 : -1;
  }

  function sideOf(v) { return v === ATT ? ATT : (v === EMPTY ? 0 : DEF); }

  function startBoard() {
    var b = new Int8Array(SZ), i;
    var att = [
      [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [1, 5],
      [10, 3], [10, 4], [10, 5], [10, 6], [10, 7], [9, 5],
      [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [5, 1],
      [3, 10], [4, 10], [5, 10], [6, 10], [7, 10], [5, 9]
    ];
    var def = [
      [3, 5], [4, 4], [4, 5], [4, 6], [5, 3], [5, 4],
      [5, 6], [5, 7], [6, 4], [6, 5], [6, 6], [7, 5]
    ];
    for (i = 0; i < att.length; i++) b[att[i][0] * N + att[i][1]] = ATT;
    for (i = 0; i < def.length; i++) b[def[i][0] * N + def[i][1]] = DEF;
    b[THRONE] = KING;
    return b;
  }

  /** Every rook move for `who` (ATT or DEF), as {f, t}. */
  function genMoves(b, who) {
    var out = [], i, k;
    for (i = 0; i < SZ; i++) {
      var v = b[i];
      if (!v || sideOf(v) !== who) continue;
      var king = v === KING;
      for (k = 0; k < 4; k++) {
        var t = i;
        while (true) {
          t = stepSq(t, k);
          if (t < 0 || b[t] !== EMPTY) break;
          if (!king && restricted(t)) continue;   // may pass the empty throne, never land
          out.push({ f: i, t: t });
        }
      }
    }
    return out;
  }

  /** A square that acts as an enemy for the purpose of pinning a piece. */
  function hostile(b, sq, victimIsAttacker) {
    if (isCorner(sq)) return true;
    if (sq !== THRONE) return false;
    return b[sq] === EMPTY ? true : victimIsAttacker;
  }

  function findKing(b) {
    for (var i = 0; i < SZ; i++) if (b[i] === KING) return i;
    return -1;
  }

  function countPieces(b, what) {
    var n = 0;
    for (var i = 0; i < SZ; i++) if (b[i] === what) n++;
    return n;
  }

  /**
   * The king falls when every orthogonal neighbour is an attacker or the
   * throne. On an edge he is safe, unless he is the last defender standing.
   */
  function kingTaken(b, k) {
    if (k < 0) return true;
    var n = 0, all = true, i, s;
    for (i = 0; i < 4; i++) {
      s = stepSq(k, i);
      if (s < 0) continue;
      n++;
      if (!(b[s] === ATT || s === THRONE)) all = false;
    }
    if (!all) return false;
    return n === 4 || countPieces(b, DEF) === 0;
  }

  /** Attackers also win by sealing every defender away from the board edge. */
  function encircled(b) {
    var seen = new Uint8Array(SZ), stack = [], i, r, c;
    for (i = 0; i < SZ; i++) {
      if (b[i] === DEF || b[i] === KING) { seen[i] = 1; stack.push(i); }
    }
    if (!stack.length) return false;
    while (stack.length) {
      var p = stack.pop();
      r = (p / N) | 0; c = p % N;
      if (r === 0 || c === 0 || r === N - 1 || c === N - 1) return false;
      for (i = 0; i < 4; i++) {
        var q = stepSq(p, i);
        if (q < 0 || seen[q] || b[q] === ATT) continue;
        seen[q] = 1; stack.push(q);
      }
    }
    return true;
  }

  /** Play a move on a copy, resolving every custodian capture it triggers. */
  function applyMove(b, mv) {
    var nb = Int8Array.from(b);
    nb[mv.t] = nb[mv.f];
    nb[mv.f] = EMPTY;
    var mover = nb[mv.t], moverAtt = mover === ATT, caps = 0, k;
    for (k = 0; k < 4; k++) {
      var v = stepSq(mv.t, k);
      if (v < 0) continue;
      var vp = nb[v];
      var enemy = moverAtt ? (vp === DEF) : (vp === ATT);   // the king is never pinned in two
      if (!enemy) continue;
      var w = stepSq(v, k);
      if (w < 0) continue;
      var anvil = nb[w], ok;
      if (moverAtt) ok = anvil === ATT || hostile(nb, w, false);
      else ok = anvil === DEF || anvil === KING || hostile(nb, w, true);
      if (ok) { nb[v] = EMPTY; caps++; }
    }
    return { b: nb, caps: caps };
  }

  /** 0 = play on, ATT / DEF = that side has won. */
  function outcome(b, justMoved) {
    var k = findKing(b);
    if (k < 0) return ATT;
    if (isCorner(k)) return DEF;
    if (justMoved === ATT && kingTaken(b, k)) return ATT;
    if (justMoved === ATT && encircled(b)) return ATT;
    return 0;
  }

  /* ------------------------------------------------ evaluation (attackers) */

  function cornerDist(i) {
    var r = (i / N) | 0, c = i % N;
    return Math.min(r + c, r + (N - 1 - c), (N - 1 - r) + c, (N - 1 - r) + (N - 1 - c));
  }

  /** How many corners the king could reach in a single move right now. */
  function runways(b, k) {
    var n = 0, i;
    for (i = 0; i < 4; i++) {
      var t = k;
      while (true) {
        t = stepSq(t, i);
        if (t < 0 || b[t] !== EMPTY) break;
        if (isCorner(t)) { n++; break; }
      }
    }
    return n;
  }

  function kingFreedom(b, k) {
    var n = 0, i;
    for (i = 0; i < 4; i++) {
      var t = k;
      while (true) {
        t = stepSq(t, i);
        if (t < 0 || b[t] !== EMPTY) break;
        n++;
      }
    }
    return n;
  }

  /** Positive favours the attackers. */
  function evaluate(b) {
    var k = findKing(b);
    if (k < 0) return 1e6;
    if (isCorner(k)) return -1e6;
    var att = 0, def = 0, i;
    for (i = 0; i < SZ; i++) {
      if (b[i] === ATT) att++;
      else if (b[i] === DEF) def++;
    }
    var s = att * 12 - def * 16;
    s -= runways(b, k) * 500;
    s += cornerDist(k) * 7;
    s -= kingFreedom(b, k) * 2;
    var around = 0;
    for (i = 0; i < 4; i++) {
      var q = stepSq(k, i);
      if (q < 0) continue;
      if (b[q] === ATT || q === THRONE) around++;
    }
    s += around * around * 9;
    // Attackers holding the squares beside a corner choke the escape routes.
    var guard = 0;
    for (i = 0; i < 4; i++) {
      var cn = CORNERS[i];
      for (var j = 0; j < 4; j++) {
        var a = stepSq(cn, j);
        if (a >= 0 && b[a] === ATT) guard++;
      }
    }
    s += guard * 6;
    return s;
  }

  function mount(host) {
    var Milo = window.Milo;
    var cellEls = [], statusEl, undoBtn, sideBtn;

    function elm(tag, css, txt) {
      var e = document.createElement(tag);
      if (css) e.style.cssText = css;
      if (txt != null) e.textContent = txt;
      return e;
    }
    function button(label, fn) {
      var b = elm('button', 'font:600 .8rem/1 Outfit,system-ui,sans-serif;padding:8px 13px;' +
        'border-radius:9px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.09);' +
        'color:#f0e4d0;cursor:pointer', label);
      b.type = 'button';
      b.addEventListener('click', fn);
      return b;
    }

    function build(g) {
      var wrap = elm('div', 'display:flex;flex-direction:column;align-items:center;gap:8px');
      var board = elm('div', 'display:grid;grid-template-columns:repeat(11,1fr);gap:1px;' +
        'background:#3a2a19;padding:5px;border-radius:9px;' +
        'width:min(90vw,min(58vh,470px));aspect-ratio:1');
      cellEls = [];
      for (var i = 0; i < SZ; i++) {
        var c = elm('button', 'border:0;padding:0;cursor:pointer;display:grid;place-items:center;' +
          'font:700 clamp(9px,2.4vw,20px)/1 Outfit,system-ui,sans-serif;border-radius:2px');
        c.type = 'button';
        (function (idx) { c.addEventListener('click', function () { clickCell(g, idx); }); })(i);
        board.appendChild(c);
        cellEls.push(c);
      }
      statusEl = elm('div', 'color:#f2e5cf;font:600 .85rem/1.35 Outfit,system-ui,sans-serif;' +
        'text-align:center;min-height:2.3em;max-width:34em');
      var bar = elm('div', 'display:flex;gap:8px;flex-wrap:wrap;justify-content:center');
      undoBtn = button('Undo', function () { undo(g); });
      sideBtn = button('Swap sides', function () { swapSides(g); });
      bar.appendChild(undoBtn);
      bar.appendChild(sideBtn);
      wrap.appendChild(board);
      wrap.appendChild(statusEl);
      wrap.appendChild(bar);
      g.root.innerHTML = '';
      g.root.appendChild(wrap);
    }

    function reset(g) {
      var d = g.data;
      if (d.side !== ATT && d.side !== DEF) d.side = DEF;
      d.b = startBoard();
      d.turn = ATT;                     // the attackers always open
      d.sel = null;
      d.over = false;
      d.busy = false;
      d.hist = [];
      d.quiet = 0;
      d.msg = d.side === DEF
        ? 'You hold the king and twelve defenders. Get him to any corner.'
        : 'You command the twenty-four attackers. Take the king before he escapes.';
      build(g);
      paint(g);
      if (d.turn !== d.side) {
        d.busy = true;
        setTimeout(function () { cpuTurn(g); }, 450);
      }
    }

    function swapSides(g) {
      var d = g.data;
      d.side = d.side === DEF ? ATT : DEF;
      g.restart();
    }

    function paint(g) {
      var d = g.data, i;
      var mine = (!d.over && d.turn === d.side && g.state === 'play');
      var targets = [];
      if (mine && d.sel !== null) {
        genMoves(d.b, d.side).forEach(function (m) { if (m.f === d.sel) targets.push(m.t); });
      }
      var movable = {};
      if (mine && d.sel === null) genMoves(d.b, d.side).forEach(function (m) { movable[m.f] = 1; });

      for (i = 0; i < SZ; i++) {
        var v = d.b[i], c = cellEls[i];
        var bg = ((i % N) + ((i / N) | 0)) % 2 === 0 ? '#c9a878' : '#bd9a67';
        if (isCorner(i)) bg = '#6f4a8f';
        else if (i === THRONE) bg = '#8f6f3a';
        if (targets.indexOf(i) !== -1) bg = '#3f9e6c';
        else if (i === d.sel) bg = '#e0b246';
        else if (movable[i]) bg = ((i % N) + ((i / N) | 0)) % 2 === 0 ? '#d6b68a' : '#cbab79';
        c.style.background = bg;
        c.textContent = v === ATT ? '●' : v === DEF ? '●' : v === KING ? '♚' : '';
        c.style.color = v === ATT ? '#241a12' : v === DEF ? '#fdf6e8' : '#fff3b0';
        c.style.textShadow = v === KING ? '0 0 6px #8a5a00' : (v ? '0 1px 2px rgba(0,0,0,.45)' : 'none');
        c.style.cursor = (movable[i] || targets.indexOf(i) !== -1) ? 'pointer' : 'default';
      }
      g.set('Attackers', countPieces(d.b, ATT));
      g.set('Defenders', countPieces(d.b, DEF) + 1);
      g.set('Turn', d.over ? '—' : (d.turn === d.side ? 'Yours' : 'CPU'));
      statusEl.textContent = d.msg;
      if (undoBtn) {
        undoBtn.disabled = !d.hist.length || d.over;
        undoBtn.style.opacity = undoBtn.disabled ? .45 : 1;
      }
      if (sideBtn) sideBtn.textContent = d.side === DEF ? 'Play as attackers' : 'Play as defenders';
    }

    function clickCell(g, i) {
      var d = g.data;
      if (g.state !== 'play' || d.over || d.busy || d.turn !== d.side) return;
      if (d.sel !== null) {
        var hit = null;
        genMoves(d.b, d.side).forEach(function (m) {
          if (m.f === d.sel && m.t === i && !hit) hit = m;
        });
        if (hit) { doMove(g, hit, d.side, true); return; }
      }
      if (sideOf(d.b[i]) === d.side) {
        d.sel = i;
        d.msg = 'Green squares are where it can slide. Pieces move like rooks.';
        Milo.sound.blip();
      } else {
        d.sel = null;
        d.msg = 'Pick one of your own pieces.';
      }
      paint(g);
    }

    function doMove(g, mv, who, human) {
      var d = g.data;
      if (human) {
        d.hist.push({ b: Int8Array.from(d.b), quiet: d.quiet });
        if (d.hist.length > 40) d.hist.shift();
      }
      var res = applyMove(d.b, mv);
      d.b = res.b;
      d.sel = null;
      d.quiet = res.caps ? 0 : d.quiet + 1;
      Milo.sound.tone({ f: who === ATT ? 250 : 430, f2: who === ATT ? 190 : 340, d: .08, v: .07, type: 'triangle' });
      if (res.caps) Milo.sound.hit();

      var out = outcome(d.b, who);
      if (out) { finish(g, out, res); return; }
      if (d.quiet >= 120) { finish(g, 0, res); return; }

      d.turn = who === ATT ? DEF : ATT;
      var actor = who === d.side ? 'You' : 'The CPU';
      d.msg = actor + (res.caps ? ' captured ' + res.caps + ' piece' + (res.caps > 1 ? 's' : '') + '.' : ' moved.');
      var k = findKing(d.b);
      var run = runways(d.b, k);
      if (run) d.msg += ' The king has ' + run + ' clear run' + (run > 1 ? 's' : '') + ' to a corner!';

      if (!genMoves(d.b, d.turn).length) {
        finish(g, d.turn === ATT ? DEF : ATT, res, 'no moves');
        return;
      }
      paint(g);
      if (d.turn !== d.side) {
        d.busy = true;
        setTimeout(function () { cpuTurn(g); }, 320);
      }
    }

    function undo(g) {
      var d = g.data;
      if (g.state !== 'play' || d.over || d.busy || !d.hist.length) return;
      var s = d.hist.pop();
      d.b = Int8Array.from(s.b);
      d.quiet = s.quiet;
      d.turn = d.side;
      d.sel = null;
      d.msg = 'Took your move back.';
      Milo.sound.blip();
      paint(g);
    }

    function finish(g, winner, res, why) {
      var d = g.data;
      d.over = true;
      var k = findKing(d.b);
      var reason;
      if (!winner) reason = '120 moves passed without a capture, so the game is a draw.';
      else if (why === 'no moves') reason = 'The ' + (winner === ATT ? 'defenders' : 'attackers') +
        ' had no legal move left, which loses the game.';
      else if (winner === DEF) reason = 'The king reached a corner square and escaped.';
      else if (k < 0 || kingTaken(d.b, k)) reason = 'The king was surrounded on every side and captured.';
      else reason = 'Every defender was sealed off from the board edge — the attackers encircled them.';
      d.msg = reason;
      paint(g);
      var att = countPieces(d.b, ATT), def = countPieces(d.b, DEF) + 1;
      if (!winner) {
        g.gameOver({ emo: '🤝', title: 'Drawn', text: reason, score: 200 });
      } else if (winner === d.side) {
        g.win({
          emo: winner === DEF ? '👑' : '⚔️',
          title: winner === DEF ? 'The king escapes — you win' : 'The king is taken — you win',
          text: reason,
          score: 700 + (d.side === DEF ? def * 30 : att * 12)
        });
      } else {
        g.gameOver({
          emo: winner === DEF ? '👑' : '⚔️',
          title: winner === DEF ? 'The king escaped' : 'The king has fallen',
          text: reason,
          score: d.side === DEF ? def * 25 : att * 10
        });
      }
    }

    /* ------------------------------------------------------------- the AI */

    /** Worth of a position to the side whose `sign` this is (+1 attackers). */
    function valueFor(b, justMoved, sign) {
      var o = outcome(b, justMoved);
      if (o === ATT) return 1e6 * sign;
      if (o === DEF) return -1e6 * sign;
      return evaluate(b) * sign;
    }

    function cpuTurn(g) {
      var d = g.data;
      d.busy = false;
      if (g.state !== 'play' || d.over) return;
      var me = d.turn, them = me === ATT ? DEF : ATT, sign = me === ATT ? 1 : -1;
      var ms = genMoves(d.b, me);
      if (!ms.length) { finish(g, them, { caps: 0 }, 'no moves'); return; }

      var scored = [], i;
      for (i = 0; i < ms.length; i++) {
        var r = applyMove(d.b, ms[i]);
        var v = valueFor(r.b, me, sign);
        if (v >= 1e6) { doMove(g, ms[i], me, false); return; }        // an outright win
        scored.push({ mv: ms[i], v: v, b: r.b });
      }
      scored.sort(function (a, b) { return b.v - a.v; });

      // Read one reply deep on the short-list so obvious blunders are avoided.
      var top = scored.slice(0, 14), best = null;
      for (i = 0; i < top.length; i++) {
        var reply = genMoves(top[i].b, them), worst = null, j;
        for (j = 0; j < reply.length; j++) {
          var v2 = valueFor(applyMove(top[i].b, reply[j]).b, them, sign);
          if (worst === null || v2 < worst) worst = v2;
        }
        var val = (worst === null ? top[i].v : worst) + Math.random() * 3;
        if (!best || val > best.val) best = { val: val, mv: top[i].mv };
      }
      doMove(g, best.mv, me, false);
    }

    return Milo.domGame(host, {
      id: 'hnefatafl',
      stats: ['Attackers', 'Defenders', 'Turn'],
      bg: '#241a10',
      emo: '♚',
      start: {
        title: 'Hnefatafl',
        text: 'The Fetlar 11×11 rules. Everything moves like a rook. Sandwich an enemy ' +
          'between two of your pieces to take it; the corners and the throne count as a ' +
          'piece for that. The king is armed and only falls when surrounded on all four ' +
          'sides. Defenders win by walking the king into a corner; attackers win by taking ' +
          'him, or by sealing every defender away from the board edge.',
        keys: ['Click a piece', 'Click a green square']
      },
      preload: function (g) { g.data.side = DEF; },
      init: reset
    });
  }

  window.Milo.register({
    id: 'hnefatafl', title: 'Hnefatafl', emo: '♚', category: 'Strategy',
    tagline: 'A Viking king runs for the corners, twenty-four men in the way',
    description: 'The Norse tafl game on an 11×11 board under the Fetlar rules: a king ' +
      'and twelve defenders in the centre against twenty-four attackers on the edges. ' +
      'Every piece slides like a rook, and you capture by trapping a piece between two of ' +
      'yours — the four corners and the empty throne count as friendly for that. Only the ' +
      'king may stand on a corner or the throne, and he is only taken when hemmed in on ' +
      'all four sides. Play either colour: the CPU handles both, blocking corner runs as ' +
      'the attackers and prising the ring open as the defenders.',
    controls: ['Click a piece', 'Click a highlighted square', 'Undo', 'Swap sides'],
    colors: ['#c9a878', '#6f4a8f'],
    tags: ['board game', 'viking', 'tafl', 'vs cpu', 'strategy'],
    mount: mount
  });
})();
