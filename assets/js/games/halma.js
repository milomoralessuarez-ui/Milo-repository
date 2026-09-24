/* Halma on 8x8 — hop your ten men diagonally across the board into the far
   camp. Chained jumps are the whole game. */
(function () {
  'use strict';

  var N = 8, SZ = 64;
  var YOU = 1, CPU = 2;
  var DIR = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

  // The two corner camps, ten squares each.
  var CAMP_TL = [], CAMP_BR = [];
  (function () {
    var shape = [[0, 0], [0, 1], [0, 2], [0, 3], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [3, 0]];
    for (var i = 0; i < shape.length; i++) {
      CAMP_TL.push(shape[i][0] * N + shape[i][1]);
      CAMP_BR.push((N - 1 - shape[i][0]) * N + (N - 1 - shape[i][1]));
    }
  })();
  function campOf(who) { return who === YOU ? CAMP_BR : CAMP_TL; }
  function goalOf(who) { return who === YOU ? CAMP_TL : CAMP_BR; }
  function goalCorner(who) { return who === YOU ? 0 : SZ - 1; }

  function startBoard() {
    var b = new Int8Array(SZ), i;
    for (i = 0; i < 10; i++) { b[CAMP_BR[i]] = YOU; b[CAMP_TL[i]] = CPU; }
    return b;
  }

  function inCamp(who, i) { return campOf(who).indexOf(i) !== -1; }

  /** Single steps to an adjacent empty square. */
  function stepDests(b, from) {
    var x = from % N, y = (from / N) | 0, out = [], k;
    for (k = 0; k < 8; k++) {
      var nx = x + DIR[k][0], ny = y + DIR[k][1];
      if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
      var t = ny * N + nx;
      if (!b[t]) out.push(t);
    }
    return out;
  }

  /** Everywhere a chain of jumps can reach; you may stop after any hop. */
  function jumpDests(b, from) {
    var seen = {}, out = [], stack = [from], k;
    seen[from] = 1;
    while (stack.length) {
      var p = stack.pop(), x = p % N, y = (p / N) | 0;
      for (k = 0; k < 8; k++) {
        var mx = x + DIR[k][0], my = y + DIR[k][1];
        var lx = x + DIR[k][0] * 2, ly = y + DIR[k][1] * 2;
        if (lx < 0 || ly < 0 || lx >= N || ly >= N) continue;
        var mid = my * N + mx, land = ly * N + lx;
        if (!b[mid] || b[land] || seen[land]) continue;
        seen[land] = 1;
        out.push(land);
        stack.push(land);
      }
    }
    return out;
  }

  /** Legal destinations, with the rule that a man may never re-enter his camp. */
  function movesFrom(b, from) {
    var who = b[from];
    if (!who) return [];
    var all = stepDests(b, from).concat(jumpDests(b, from));
    var home = inCamp(who, from), out = [], i;
    for (i = 0; i < all.length; i++) {
      if (!home && inCamp(who, all[i])) continue;    // no going back
      out.push(all[i]);
    }
    return out;
  }

  function allMoves(b, who) {
    var out = [], i, j;
    for (i = 0; i < SZ; i++) {
      if (b[i] !== who) continue;
      var ds = movesFrom(b, i);
      for (j = 0; j < ds.length; j++) out.push({ f: i, t: ds[j] });
    }
    return out;
  }

  function apply(b, mv) {
    var nb = Int8Array.from(b);
    nb[mv.t] = nb[mv.f];
    nb[mv.f] = 0;
    return nb;
  }

  /**
   * A player wins once the far camp is completely full and at least one of the
   * men in it is theirs — so parking a blocker in there cannot deny the game.
   */
  function hasWon(b, who) {
    var goal = goalOf(who), mine = 0, i;
    for (i = 0; i < goal.length; i++) {
      if (!b[goal[i]]) return false;
      if (b[goal[i]] === who) mine++;
    }
    return mine > 0;
  }

  function cheb(i, j) {
    return Math.max(Math.abs((i % N) - (j % N)), Math.abs(((i / N) | 0) - ((j / N) | 0)));
  }

  /** Positive favours the CPU. */
  function evaluate(b) {
    var s = 0, i, k;
    var gc = goalCorner(CPU), gy = goalCorner(YOU);
    var cpuWorst = 0, youWorst = 0, cpuIn = 0, youIn = 0;
    var goalC = goalOf(CPU), goalY = goalOf(YOU);
    for (i = 0; i < SZ; i++) {
      if (b[i] === CPU) {
        var dc = cheb(i, gc);
        s -= dc * 10;
        if (dc > cpuWorst) cpuWorst = dc;
      } else if (b[i] === YOU) {
        var dy = cheb(i, gy);
        s += dy * 10;
        if (dy > youWorst) youWorst = dy;
      }
    }
    for (k = 0; k < 10; k++) {
      if (b[goalC[k]] === CPU) cpuIn++;
      if (b[goalY[k]] === YOU) youIn++;
    }
    s += cpuIn * 26 - youIn * 26;
    s -= cpuWorst * 8;                 // stragglers are what lose Halma
    s += youWorst * 8;
    // Ladder rungs: a friend one step ahead with a free landing square behind it.
    var rungs = 0;
    for (i = 0; i < SZ; i++) {
      if (!b[i]) continue;
      var who = b[i], dir = who === CPU ? 1 : -1;
      var x = i % N, y = (i / N) | 0;
      for (k = 0; k < 8; k++) {
        if (DIR[k][0] * dir < 0 || DIR[k][1] * dir < 0) continue;      // forward only
        var mx = x + DIR[k][0], my = y + DIR[k][1];
        var lx = x + DIR[k][0] * 2, ly = y + DIR[k][1] * 2;
        if (lx < 0 || ly < 0 || lx >= N || ly >= N) continue;
        if (b[my * N + mx] && !b[ly * N + lx]) rungs += who === CPU ? 1 : -1;
      }
    }
    s += rungs * 3;
    return s;
  }

  function mount(host) {
    var Milo = window.Milo;
    var cellEls = [], statusEl, undoBtn;

    function elm(tag, css, txt) {
      var e = document.createElement(tag);
      if (css) e.style.cssText = css;
      if (txt != null) e.textContent = txt;
      return e;
    }
    function button(label, fn) {
      var b = elm('button', 'font:600 .82rem/1 Outfit,system-ui,sans-serif;padding:8px 14px;' +
        'border-radius:9px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.09);' +
        'color:#eef7ea;cursor:pointer', label);
      b.type = 'button';
      b.addEventListener('click', fn);
      return b;
    }

    function build(g) {
      var wrap = elm('div', 'display:flex;flex-direction:column;align-items:center;gap:9px');
      var board = elm('div', 'display:grid;grid-template-columns:repeat(8,1fr);gap:2px;' +
        'background:#1e3326;padding:6px;border-radius:10px;' +
        'width:min(88vw,min(58vh,450px));aspect-ratio:1');
      cellEls = [];
      for (var i = 0; i < SZ; i++) {
        var c = elm('button', 'border:0;padding:0;border-radius:4px;cursor:pointer;' +
          'display:grid;place-items:center;transition:background .12s');
        c.type = 'button';
        var disc = elm('span', 'width:72%;height:72%;border-radius:50%;transition:.15s;transform:scale(0)');
        c.appendChild(disc);
        (function (idx) { c.addEventListener('click', function () { clickCell(g, idx); }); })(i);
        board.appendChild(c);
        cellEls.push(c);
      }
      statusEl = elm('div', 'color:#e6f2e2;font:600 .85rem/1.35 Outfit,system-ui,sans-serif;' +
        'text-align:center;min-height:2.4em;max-width:32em');
      var bar = elm('div', 'display:flex;gap:8px');
      undoBtn = button('Undo', function () { undo(g); });
      bar.appendChild(undoBtn);
      wrap.appendChild(board);
      wrap.appendChild(statusEl);
      wrap.appendChild(bar);
      g.root.innerHTML = '';
      g.root.appendChild(wrap);
    }

    function reset(g) {
      var d = g.data;
      d.b = startBoard();
      d.turn = YOU;
      d.sel = null;
      d.over = false;
      d.busy = false;
      d.hist = [];
      d.plies = 0;
      d.msg = 'Your men are bottom-right. Get all ten into the top-left camp.';
      build(g);
      paint(g);
    }

    function homeCount(b, who) {
      var goal = goalOf(who), n = 0;
      for (var i = 0; i < 10; i++) if (b[goal[i]] === who) n++;
      return n;
    }

    function paint(g) {
      var d = g.data, i;
      var mine = !d.over && d.turn === YOU && !d.busy && g.state === 'play';
      var targets = (mine && d.sel !== null) ? movesFrom(d.b, d.sel) : [];
      var jumps = (mine && d.sel !== null) ? jumpDests(d.b, d.sel) : [];
      var movable = {};
      if (mine && d.sel === null) {
        for (i = 0; i < SZ; i++) if (d.b[i] === YOU && movesFrom(d.b, i).length) movable[i] = 1;
      }

      for (i = 0; i < SZ; i++) {
        var v = d.b[i], c = cellEls[i], disc = c.firstChild;
        var light = ((i % N) + ((i / N) | 0)) % 2 === 0;
        var bg = light ? '#35543f' : '#2c4634';
        if (CAMP_TL.indexOf(i) !== -1) bg = light ? '#3f5f7d' : '#365269';
        if (CAMP_BR.indexOf(i) !== -1) bg = light ? '#6e5230' : '#5d4529';
        if (targets.indexOf(i) !== -1) bg = jumps.indexOf(i) !== -1 ? '#2f9c68' : '#4fae7d';
        else if (i === d.sel) bg = '#c99a2e';
        else if (movable[i]) bg = light ? '#436a50' : '#3a5c45';
        c.style.background = bg;
        disc.style.transform = v ? 'scale(1)' : 'scale(0)';
        disc.style.background = v === YOU ? '#ffd27a' : '#7fd0ff';
        disc.style.boxShadow = v ? '0 2px 5px rgba(0,0,0,.5)' : 'none';
        c.style.cursor = (movable[i] || targets.indexOf(i) !== -1) ? 'pointer' : 'default';
      }
      g.set('You home', homeCount(d.b, YOU) + '/10');
      g.set('CPU home', homeCount(d.b, CPU) + '/10');
      g.set('Turn', d.over ? '—' : (d.turn === YOU ? 'Yours' : 'CPU'));
      statusEl.textContent = d.msg;
      if (undoBtn) {
        undoBtn.disabled = !d.hist.length || d.over;
        undoBtn.style.opacity = undoBtn.disabled ? .45 : 1;
      }
    }

    function clickCell(g, i) {
      var d = g.data;
      if (g.state !== 'play' || d.over || d.busy || d.turn !== YOU) return;
      if (d.sel !== null && movesFrom(d.b, d.sel).indexOf(i) !== -1) {
        doMove(g, { f: d.sel, t: i }, YOU);
        return;
      }
      if (d.b[i] === YOU) {
        var ds = movesFrom(d.b, i);
        if (!ds.length) {
          d.msg = 'That man is hemmed in with nowhere to land.';
        } else {
          d.sel = i;
          var jn = jumpDests(d.b, i).length;
          d.msg = jn
            ? 'Dark green squares are reached by jumping — a chain counts as one move.'
            : 'Light green squares are single steps.';
          Milo.sound.blip();
        }
      } else {
        d.sel = null;
        d.msg = 'Pick one of your own men.';
      }
      paint(g);
    }

    function doMove(g, mv, who) {
      var d = g.data;
      if (who === YOU) {
        d.hist.push(Int8Array.from(d.b));
        if (d.hist.length > 40) d.hist.shift();
      }
      var jumped = jumpDests(d.b, mv.f).indexOf(mv.t) !== -1;
      d.b = apply(d.b, mv);
      d.sel = null;
      d.plies++;
      Milo.sound.tone({
        f: who === YOU ? 430 : 300, f2: who === YOU ? 560 : 400,
        d: jumped ? .11 : .07, v: .06, type: 'triangle'
      });

      if (hasWon(d.b, who)) { finish(g, who); return; }
      d.turn = who === YOU ? CPU : YOU;
      d.msg = (who === YOU ? 'You' : 'The CPU') + (jumped ? ' hopped across.' : ' stepped.') +
        '  Home: you ' + homeCount(d.b, YOU) + '/10, CPU ' + homeCount(d.b, CPU) + '/10.';
      if (d.plies >= 300) { finish(g, null); return; }
      paint(g);
      if (d.turn === CPU) {
        d.busy = true;
        setTimeout(function () { cpuTurn(g); }, 280);
      }
    }

    function undo(g) {
      var d = g.data;
      if (g.state !== 'play' || d.over || d.busy || !d.hist.length) return;
      d.b = d.hist.pop();
      d.turn = YOU;
      d.sel = null;
      d.msg = 'Took your move back.';
      Milo.sound.blip();
      paint(g);
    }

    function finish(g, winner) {
      var d = g.data;
      d.over = true;
      var you = homeCount(d.b, YOU), cpu = homeCount(d.b, CPU);
      var why;
      if (winner === null) {
        winner = you > cpu ? YOU : (cpu > you ? CPU : null);
        why = 'Three hundred moves passed without a finish, so it goes to whoever has more men ' +
          'home: you ' + you + ', CPU ' + cpu + '.';
      } else {
        why = (winner === YOU ? 'Your' : 'The CPU’s') + ' far camp is full — all ten squares ' +
          'occupied with at least one of their own men in it.';
      }
      d.msg = why;
      paint(g);
      if (winner === YOU) {
        g.win({ emo: '🟡', title: 'All the way across — you win', text: why,
          score: Math.max(200, 1000 - d.plies * 4) });
      } else if (winner === CPU) {
        g.gameOver({ emo: '🔵', title: 'The CPU got home first', text: why,
          score: you * 45 });
      } else {
        g.gameOver({ emo: '🤝', title: 'A dead heat', text: why, score: you * 40 });
      }
    }

    /* ------------------------------------------------------------- the AI */

    function search(b, who, depth, alpha, beta, deadline) {
      if (hasWon(b, CPU)) return 1e6 + depth;
      if (hasWon(b, YOU)) return -1e6 - depth;
      if (depth <= 0 || Date.now() > deadline) return evaluate(b);
      var ms = allMoves(b, who);
      if (!ms.length) return evaluate(b);

      if (depth === 1) {                                 // last ply: no point ordering
        var best1 = who === CPU ? -1e9 : 1e9, q;
        for (q = 0; q < ms.length; q++) {
          var v1 = evaluate(apply(b, ms[q]));
          if (who === CPU ? v1 > best1 : v1 < best1) best1 = v1;
        }
        return best1;
      }

      var scored = [], i;
      for (i = 0; i < ms.length; i++) {
        var nb = apply(b, ms[i]);
        scored.push({ b: nb, v: evaluate(nb) * (who === CPU ? 1 : -1) });
      }
      scored.sort(function (p, q) { return q.v - p.v; });
      if (scored.length > 5) scored.length = 5;

      var best = who === CPU ? -1e9 : 1e9;
      for (i = 0; i < scored.length; i++) {
        var v = search(scored[i].b, who === CPU ? YOU : CPU, depth - 1, alpha, beta, deadline);
        if (who === CPU) {
          if (v > best) best = v;
          if (best > alpha) alpha = best;
        } else {
          if (v < best) best = v;
          if (best < beta) beta = best;
        }
        if (alpha >= beta) break;
      }
      return best;
    }

    function cpuTurn(g) {
      var d = g.data;
      d.busy = false;
      if (g.state !== 'play' || d.over) return;
      var ms = allMoves(d.b, CPU);
      if (!ms.length) { d.turn = YOU; d.msg = 'The CPU is completely stuck.'; paint(g); return; }

      var scored = [], i;
      for (i = 0; i < ms.length; i++) {
        var nb = apply(d.b, ms[i]);
        if (hasWon(nb, CPU)) { doMove(g, ms[i], CPU); return; }
        scored.push({ mv: ms[i], b: nb, v: evaluate(nb) });
      }
      scored.sort(function (p, q) { return q.v - p.v; });
      if (scored.length > 12) scored.length = 12;

      var deadline = Date.now() + 420, best = null;
      for (i = 0; i < scored.length; i++) {
        var v2 = search(scored[i].b, YOU, 2, -1e9, 1e9, deadline) + Math.random() * 3;
        if (!best || v2 > best.v) best = { v: v2, mv: scored[i].mv };
        if (Date.now() > deadline) break;
      }
      doMove(g, best.mv, CPU);
    }

    return Milo.domGame(host, {
      id: 'halma',
      stats: ['You home', 'CPU home', 'Turn'],
      bg: '#13241a',
      emo: '🟡',
      start: {
        title: 'Halma',
        text: 'Ten men in the bottom-right camp, and the blue camp in the far corner to ' +
          'fill. A man either steps one square in any direction or jumps over a neighbour — ' +
          'yours or theirs — into the empty square beyond, and a chain of jumps counts as ' +
          'one move. Once a man has left your camp he may not go back in. First camp filled wins.',
        keys: ['Click a man', 'Click a green square']
      },
      init: reset
    });
  }

  window.Milo.register({
    id: 'halma', title: 'Halma', emo: '🟡', category: 'Strategy',
    tagline: 'Build a ladder of hops across the board',
    description: 'The two-player 8×8 version of the game Chinese Chequers grew out of: ' +
      'ten men in one corner camp, ten squares to fill in the opposite one. Steps are slow ' +
      'and jumps are fast, and a jump chain over any men — yours or the opponent’s — counts ' +
      'as a single move, so the real skill is leaving a trail of stepping stones for the ' +
      'men behind. A man that has left your camp may never return, and the camp counts as ' +
      'filled only if one of the men in it is yours, so squatting in the target does not ' +
      'block the game. The CPU deliberately builds ladders and punishes stragglers.',
    controls: ['Click a man', 'Click a highlighted square', 'Undo'],
    colors: ['#35543f', '#ffd27a'],
    tags: ['board game', 'abstract', 'vs cpu', 'jumping', 'strategy'],
    mount: mount
  });
})();
