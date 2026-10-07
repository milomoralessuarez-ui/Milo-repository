/* Lines of Action — move as far as there are pieces on the line, and try to
   pull all twelve of yours into one connected group. */
(function () {
  'use strict';

  var N = 8, SZ = 64;
  var YOU = 1, CPU = 2;
  // The four axes a piece can travel, as [dx, dy].
  var AXES = [[1, 0], [0, 1], [1, 1], [1, -1]];
  var ADJ8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

  function startBoard() {
    var b = new Int8Array(SZ), i;
    for (i = 1; i < 7; i++) { b[i] = YOU; b[7 * N + i] = YOU; }        // top and bottom rows
    for (i = 1; i < 7; i++) { b[i * N] = CPU; b[i * N + 7] = CPU; }    // left and right columns
    return b;
  }

  /** How many pieces of either colour sit on the line through (x,y) on `axis`. */
  function lineCount(b, x, y, ax) {
    var dx = AXES[ax][0], dy = AXES[ax][1], n = 0, cx, cy;
    cx = x; cy = y;
    while (cx >= 0 && cy >= 0 && cx < N && cy < N) {
      if (b[cy * N + cx]) n++;
      cx += dx; cy += dy;
    }
    cx = x - dx; cy = y - dy;
    while (cx >= 0 && cy >= 0 && cx < N && cy < N) {
      if (b[cy * N + cx]) n++;
      cx -= dx; cy -= dy;
    }
    return n;
  }

  /** Legal destinations for the piece at i: exact distance, no jumping enemies. */
  function movesFrom(b, i) {
    var who = b[i];
    if (!who) return [];
    var x = i % N, y = (i / N) | 0, out = [], ax, s;
    var them = who === YOU ? CPU : YOU;
    for (ax = 0; ax < 4; ax++) {
      var d = lineCount(b, x, y, ax);
      for (s = -1; s <= 1; s += 2) {
        var dx = AXES[ax][0] * s, dy = AXES[ax][1] * s;
        var cx = x, cy = y, blocked = false, k;
        for (k = 1; k <= d; k++) {
          cx += dx; cy += dy;
          if (cx < 0 || cy < 0 || cx >= N || cy >= N) { blocked = true; break; }
          if (k < d && b[cy * N + cx] === them) { blocked = true; break; }  // may not leap an enemy
        }
        if (blocked) continue;
        var t = cy * N + cx;
        if (b[t] === who) continue;                                        // never onto your own
        out.push(t);
      }
    }
    return out;
  }

  function allMoves(b, who) {
    var out = [], i, j;
    for (i = 0; i < SZ; i++) {
      if (b[i] !== who) continue;
      var ts = movesFrom(b, i);
      for (j = 0; j < ts.length; j++) out.push({ f: i, t: ts[j] });
    }
    return out;
  }

  function apply(b, mv) {
    var nb = Int8Array.from(b);
    nb[mv.t] = nb[mv.f];
    nb[mv.f] = 0;
    return nb;
  }

  function pieces(b, who) {
    var out = [];
    for (var i = 0; i < SZ; i++) if (b[i] === who) out.push(i);
    return out;
  }

  /** The largest connected clump (8-way) and how many groups there are. */
  function groups(b, who) {
    var seen = new Int8Array(SZ), best = 0, n = 0, total = 0, i, k;
    for (i = 0; i < SZ; i++) {
      if (b[i] !== who || seen[i]) continue;
      n++;
      var stack = [i], size = 0;
      seen[i] = 1;
      while (stack.length) {
        var p = stack.pop();
        size++;
        var x = p % N, y = (p / N) | 0;
        for (k = 0; k < 8; k++) {
          var nx = x + ADJ8[k][0], ny = y + ADJ8[k][1];
          if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
          var q = ny * N + nx;
          if (b[q] !== who || seen[q]) continue;
          seen[q] = 1; stack.push(q);
        }
      }
      if (size > best) best = size;
      total += size;
    }
    return { count: n, best: best, total: total };
  }

  function connected(b, who) {
    var g = groups(b, who);
    return g.total > 0 && g.count === 1;
  }

  /** Mean distance of a side's pieces from their own centre of mass. */
  function spread(b, who) {
    var ps = pieces(b, who);
    if (!ps.length) return 0;
    var sx = 0, sy = 0, i;
    for (i = 0; i < ps.length; i++) { sx += ps[i] % N; sy += (ps[i] / N) | 0; }
    sx /= ps.length; sy /= ps.length;
    var s = 0;
    for (i = 0; i < ps.length; i++) {
      var dx = (ps[i] % N) - sx, dy = ((ps[i] / N) | 0) - sy;
      s += Math.sqrt(dx * dx + dy * dy);
    }
    return s / ps.length;
  }

  /** Positive favours the CPU. */
  function evaluate(b) {
    var gc = groups(b, CPU), gy = groups(b, YOU);
    var cpuCon = gc.total > 0 && gc.count === 1, youCon = gy.total > 0 && gy.count === 1;
    if (cpuCon && youCon) return 0;
    if (cpuCon) return 1e6;
    if (youCon) return -1e6;
    var s = 0;
    s -= spread(b, CPU) * 26;
    s += spread(b, YOU) * 26;
    s -= (gc.count - 1) * 22;
    s += (gy.count - 1) * 22;
    s += gc.best * 5;
    s -= gy.best * 5;
    s += (gc.total - gy.total) * 14;                 // captures matter
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
        'color:#e9f1ff;cursor:pointer', label);
      b.type = 'button';
      b.addEventListener('click', fn);
      return b;
    }

    function build(g) {
      var wrap = elm('div', 'display:flex;flex-direction:column;align-items:center;gap:9px');
      var board = elm('div', 'display:grid;grid-template-columns:repeat(8,1fr);gap:2px;' +
        'background:#1b2b3f;padding:6px;border-radius:10px;' +
        'width:min(88vw,min(58vh,450px));aspect-ratio:1');
      cellEls = [];
      for (var i = 0; i < SZ; i++) {
        var c = elm('button', 'border:0;padding:0;border-radius:4px;cursor:pointer;' +
          'display:grid;place-items:center;position:relative;transition:background .12s');
        c.type = 'button';
        var disc = elm('span', 'width:74%;height:74%;border-radius:50%;transition:.15s;transform:scale(0)');
        c.appendChild(disc);
        (function (idx) { c.addEventListener('click', function () { clickCell(g, idx); }); })(i);
        board.appendChild(c);
        cellEls.push(c);
      }
      statusEl = elm('div', 'color:#dfe9fb;font:600 .85rem/1.35 Outfit,system-ui,sans-serif;' +
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
      d.msg = 'You are the blue pieces on the top and bottom rows. Pull them all together.';
      build(g);
      paint(g);
    }

    function paint(g) {
      var d = g.data, i;
      var mine = !d.over && d.turn === YOU && !d.busy && g.state === 'play';
      var targets = (mine && d.sel !== null) ? movesFrom(d.b, d.sel) : [];
      var movable = {};
      if (mine && d.sel === null) {
        for (i = 0; i < SZ; i++) if (d.b[i] === YOU && movesFrom(d.b, i).length) movable[i] = 1;
      }
      var gy = groups(d.b, YOU), gc = groups(d.b, CPU);

      for (i = 0; i < SZ; i++) {
        var v = d.b[i], c = cellEls[i], disc = c.firstChild;
        var light = ((i % N) + ((i / N) | 0)) % 2 === 0;
        var bg = light ? '#2c4767' : '#24384f';
        if (targets.indexOf(i) !== -1) bg = d.b[i] ? '#9c3b46' : '#2f8f62';
        else if (i === d.sel) bg = '#b58a2b';
        else if (movable[i]) bg = light ? '#35557b' : '#2c4568';
        c.style.background = bg;
        disc.style.transform = v ? 'scale(1)' : 'scale(0)';
        disc.style.background = v === YOU ? '#5ab7ff' : '#ff8a5c';
        disc.style.boxShadow = v ? '0 2px 5px rgba(0,0,0,.45)' : 'none';
        c.style.cursor = (movable[i] || targets.indexOf(i) !== -1) ? 'pointer' : 'default';
      }
      g.set('Your groups', gy.count + ' (' + gy.total + ')');
      g.set('CPU groups', gc.count + ' (' + gc.total + ')');
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
        var ts = movesFrom(d.b, i);
        if (!ts.length) {
          d.msg = 'That piece has no legal move — every line it stands on is blocked.';
        } else {
          d.sel = i;
          var x = i % N, y = (i / N) | 0;
          d.msg = 'It travels ' + lineCount(d.b, x, y, 0) + ' across, ' +
            lineCount(d.b, x, y, 1) + ' up or down, ' + lineCount(d.b, x, y, 2) + ' and ' +
            lineCount(d.b, x, y, 3) + ' on the diagonals.';
          Milo.sound.blip();
        }
      } else {
        d.sel = null;
        d.msg = 'Pick one of your own pieces.';
      }
      paint(g);
    }

    function doMove(g, mv, who) {
      var d = g.data;
      if (who === YOU) {
        d.hist.push(Int8Array.from(d.b));
        if (d.hist.length > 40) d.hist.shift();
      }
      var took = d.b[mv.t] !== 0;
      d.b = apply(d.b, mv);
      d.sel = null;
      d.plies++;
      Milo.sound.tone({ f: who === YOU ? 450 : 300, f2: who === YOU ? 340 : 230, d: .08, v: .07, type: 'triangle' });
      if (took) Milo.sound.hit();

      var youWin = connected(d.b, YOU), cpuWin = connected(d.b, CPU);
      if (youWin || cpuWin) {
        // If a move connects both sides at once, the player who moved wins.
        var winner = (youWin && cpuWin) ? who : (youWin ? YOU : CPU);
        finish(g, winner, youWin && cpuWin);
        return;
      }
      d.turn = who === YOU ? CPU : YOU;
      var actor = who === YOU ? 'You' : 'The CPU';
      d.msg = actor + (took ? ' captured a piece.' : ' moved.');
      if (!allMoves(d.b, d.turn).length) {
        d.msg += ' ' + (d.turn === YOU ? 'You have' : 'The CPU has') + ' no legal move.';
        finish(g, who, false, true);
        return;
      }
      paint(g);
      if (d.turn === CPU) {
        d.busy = true;
        setTimeout(function () { cpuTurn(g); }, 320);
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

    function finish(g, winner, both, stuck) {
      var d = g.data;
      d.over = true;
      var gy = groups(d.b, YOU), gc = groups(d.b, CPU);
      var why;
      if (stuck) why = 'The side to move had no legal move left, so the game goes to the last mover.';
      else if (both) why = 'That move joined both sides at once — the player who moved takes it.';
      else if (winner === YOU) why = 'All ' + gy.total + ' of your pieces form one connected group.';
      else why = 'All ' + gc.total + ' CPU pieces form one connected group.';
      d.msg = why;
      paint(g);
      if (winner === YOU) {
        g.win({ emo: '🔵', title: 'Connected — you win', text: why,
          score: Math.max(120, 800 - d.plies * 8 + (12 - gc.total) * 30) });
      } else {
        g.gameOver({ emo: '🟠', title: 'The CPU connected first', text: why,
          score: Math.max(0, 260 - gy.count * 18 + (12 - gc.total) * 20) });
      }
    }

    /* ------------------------------------------------------------- the AI */

    function search(b, who, depth, alpha, beta, deadline) {
      var cpuCon = connected(b, CPU), youCon = connected(b, YOU);
      if (cpuCon || youCon) {
        if (cpuCon && youCon) return who === YOU ? 1e6 - depth : -1e6 + depth;
        return cpuCon ? 1e6 - depth : -1e6 + depth;
      }
      if (depth <= 0 || Date.now() > deadline) return evaluate(b);
      var ms = allMoves(b, who);
      if (!ms.length) return who === CPU ? -1e6 : 1e6;    // the side that cannot move loses

      if (depth === 1) {                                   // no point ordering the last ply
        var best1 = who === CPU ? -1e9 : 1e9;
        for (var q = 0; q < ms.length; q++) {
          var v1 = evaluate(apply(b, ms[q]));
          if (who === CPU ? v1 > best1 : v1 < best1) best1 = v1;
        }
        return best1;
      }

      // Order by a cheap look so alpha-beta cuts early.
      var scored = [], i;
      for (i = 0; i < ms.length; i++) {
        var nb = apply(b, ms[i]);
        scored.push({ mv: ms[i], b: nb, v: evaluate(nb) * (who === CPU ? 1 : -1) });
      }
      scored.sort(function (p, q) { return q.v - p.v; });
      if (scored.length > 10) scored.length = 10;          // best-first beam

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
      if (!ms.length) { finish(g, YOU, false, true); return; }
      var deadline = Date.now() + 420, best = null, i;
      var scored = [];
      for (i = 0; i < ms.length; i++) {
        var nb = apply(d.b, ms[i]);
        if (connected(nb, CPU)) { doMove(g, ms[i], CPU); return; }
        scored.push({ mv: ms[i], b: nb, v: evaluate(nb) });
      }
      scored.sort(function (p, q) { return q.v - p.v; });
      if (scored.length > 20) scored.length = 20;
      for (i = 0; i < scored.length; i++) {
        var v2 = search(scored[i].b, YOU, 2, -1e9, 1e9, deadline) + Math.random() * 4;
        if (!best || v2 > best.v) best = { v: v2, mv: scored[i].mv };
        if (Date.now() > deadline) break;
      }
      doMove(g, best.mv, CPU);
    }

    return Milo.domGame(host, {
      id: 'lines-of-action',
      stats: ['Your groups', 'CPU groups', 'Turn'],
      bg: '#101e2e',
      emo: '🔵',
      start: {
        title: 'Lines of Action',
        text: 'A piece moves along a row, column or diagonal, exactly as many squares as ' +
          'there are pieces of either colour on that whole line. It may hop over your own ' +
          'pieces but never over the opponent’s, and landing on one captures it. Win by ' +
          'gathering all your pieces into a single connected group — diagonal touches count.',
        keys: ['Click a piece', 'Click a green square']
      },
      init: reset
    });
  }

  window.Milo.register({
    id: 'lines-of-action', title: 'Lines of Action', emo: '🔵', category: 'Strategy',
    tagline: 'Move as far as the line is crowded; end up in one clump',
    description: 'Twelve pieces each, and one goal: get yours into a single connected ' +
      'group, where diagonal contact counts. The catch is the movement rule — a piece ' +
      'travels exactly the number of squares as there are pieces on the line it is ' +
      'travelling along, both colours counted, so every move you make changes how far ' +
      'everything else can go. You may leap your own pieces but not the opponent’s, and ' +
      'landing on an enemy captures it. The group count for both sides is on screen, and ' +
      'the CPU searches ahead — it will often break your clump apart rather than build its own.',
    controls: ['Click a piece', 'Click a highlighted square', 'Undo'],
    colors: ['#2c4767', '#5ab7ff'],
    tags: ['board game', 'abstract', 'vs cpu', 'connection', 'strategy'],
    mount: mount
  });
})();
