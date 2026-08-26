/* Futoshiki — a 5x5 Latin square fenced in by greater-than signs. */
(function () {
  'use strict';
  var W = 780, H = 620, N = 5, CELL = 78, GAP = 34;
  var BOARD = N * CELL + (N - 1) * GAP;
  var OX = (W - BOARD) / 2, OY = 96;

  function pos(r, c) { return { x: OX + c * (CELL + GAP), y: OY + r * (CELL + GAP) }; }

  /** A random Latin square, built by shuffling the rows and symbols of a cyclic base. */
  function latin(U) {
    var rows = [], order = [];
    for (var i = 0; i < N; i++) order.push(i);
    U.shuffle(order);
    var syms = [];
    for (var s = 1; s <= N; s++) syms.push(s);
    U.shuffle(syms);
    for (var r = 0; r < N; r++) {
      var row = [];
      for (var c = 0; c < N; c++) row.push(syms[(order[r] + c) % N]);
      rows.push(row);
    }
    // Shuffling columns too keeps the diagonal structure from showing through.
    var cols = [];
    for (var k = 0; k < N; k++) cols.push(k);
    U.shuffle(cols);
    return rows.map(function (row) { return cols.map(function (c) { return row[c]; }); });
  }

  function key(r, c, r2, c2) { return r + ',' + c + '>' + r2 + ',' + c2; }

  /**
   * Counts solutions up to `cap`. Used both to check a puzzle has exactly one answer
   * and to stop clue removal before the puzzle becomes ambiguous.
   */
  function countSolutions(given, rels, cap) {
    var grid = given.map(function (row) { return row.slice(); });
    var found = 0;

    function okAt(r, c, v) {
      for (var i = 0; i < N; i++) {
        if (i !== c && grid[r][i] === v) return false;
        if (i !== r && grid[i][c] === v) return false;
      }
      for (var k = 0; k < rels.length; k++) {
        var q = rels[k];
        var aIsHere = q.ar === r && q.ac === c, bIsHere = q.br === r && q.bc === c;
        if (!aIsHere && !bIsHere) continue;
        var a = aIsHere ? v : grid[q.ar][q.ac];
        var b = bIsHere ? v : grid[q.br][q.bc];
        if (a && b && !(a > b)) return false;
      }
      return true;
    }

    function step(n) {
      if (found >= cap) return;
      if (n === N * N) { found++; return; }
      var r = (n / N) | 0, c = n % N;
      if (grid[r][c]) { step(n + 1); return; }
      for (var v = 1; v <= N; v++) {
        if (!okAt(r, c, v)) continue;
        grid[r][c] = v;
        step(n + 1);
        grid[r][c] = 0;
        if (found >= cap) return;
      }
    }

    step(0);
    return found;
  }

  function makePuzzle(U) {
    for (var attempt = 0; attempt < 30; attempt++) {
      var sol = latin(U);
      // Collect every adjacent pair, then keep a handful as inequality clues.
      var pairs = [];
      for (var r = 0; r < N; r++) {
        for (var c = 0; c < N; c++) {
          if (c + 1 < N) pairs.push([r, c, r, c + 1]);
          if (r + 1 < N) pairs.push([r, c, r + 1, c]);
        }
      }
      U.shuffle(pairs);
      var rels = pairs.slice(0, 9).map(function (p) {
        var a = sol[p[0]][p[1]], b = sol[p[2]][p[3]];
        // Point the sign at whichever side really is larger.
        return a > b
          ? { ar: p[0], ac: p[1], br: p[2], bc: p[3] }
          : { ar: p[2], ac: p[3], br: p[0], bc: p[1] };
      });

      var given = sol.map(function (row) { return row.slice(); });
      var cells = [];
      for (var i = 0; i < N * N; i++) cells.push(i);
      U.shuffle(cells);
      for (var j = 0; j < cells.length; j++) {
        var cr = (cells[j] / N) | 0, cc = cells[j] % N;
        var keep = given[cr][cc];
        given[cr][cc] = 0;
        if (countSolutions(given, rels, 2) !== 1) given[cr][cc] = keep;
      }
      var clues = 0;
      given.forEach(function (row) { row.forEach(function (v) { if (v) clues++; }); });
      // Too many leftover clues means a dull puzzle — reroll rather than ship it.
      if (clues <= 9) return { sol: sol, given: given, rels: rels };
    }
    var fallback = latin(U);
    return { sol: fallback, given: fallback.map(function (row) { return row.slice(); }), rels: [] };
  }

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      var p = makePuzzle(U);
      d.sol = p.sol;
      d.given = p.given;
      d.rels = p.rels;
      d.grid = p.given.map(function (row) { return row.slice(); });
      d.relMap = {};
      p.rels.forEach(function (q) { d.relMap[key(q.ar, q.ac, q.br, q.bc)] = 1; });
      d.sel = { r: 0, c: 0 };
      d.time = 0;
      d.done = false;
      d.bad = {};
      g.set('Filled', filled(d) + '/' + (N * N));
      g.set('Time', '0:00');
      g.set('Best', g.best ? U.time(g.best) : '—');
    }

    function filled(d) {
      var n = 0;
      d.grid.forEach(function (row) { row.forEach(function (v) { if (v) n++; }); });
      return n;
    }

    /** Marks every cell involved in a broken rule so mistakes are visible immediately. */
    function recheck(d) {
      d.bad = {};
      for (var r = 0; r < N; r++) {
        for (var c = 0; c < N; c++) {
          var v = d.grid[r][c];
          if (!v) continue;
          for (var i = 0; i < N; i++) {
            if (i !== c && d.grid[r][i] === v) { d.bad[r + ',' + c] = 1; d.bad[r + ',' + i] = 1; }
            if (i !== r && d.grid[i][c] === v) { d.bad[r + ',' + c] = 1; d.bad[i + ',' + c] = 1; }
          }
        }
      }
      d.rels.forEach(function (q) {
        var a = d.grid[q.ar][q.ac], b = d.grid[q.br][q.bc];
        if (a && b && !(a > b)) { d.bad[q.ar + ',' + q.ac] = 1; d.bad[q.br + ',' + q.bc] = 1; }
      });
    }

    function solved(d) {
      for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) if (d.grid[r][c] !== d.sol[r][c]) return false;
      return true;
    }

    function place(g, v) {
      var d = g.data;
      if (d.done) return;
      var r = d.sel.r, c = d.sel.c;
      if (d.given[r][c]) { Milo.sound.tone({ f: 150, d: .07, v: .05, type: 'square' }); return; }
      d.grid[r][c] = d.grid[r][c] === v ? 0 : v;
      recheck(d);
      Milo.sound.blip();
      g.set('Filled', filled(d) + '/' + (N * N));
      if (solved(d)) {
        d.done = true;
        var secs = Math.round(d.time);
        g.win({
          emo: '🔢', title: 'Solved!', text: 'Finished in ' + U.time(d.time) + '.',
          score: Math.max(150, 2200 - secs * 8)
        });
        // Time is the real measure here, so Best tracks seconds, lower being better.
        if (!g.best || secs < g.best) { g.best = secs; Milo.store.set('best:futoshiki-time', secs); }
        g.set('Best', U.time(g.best));
      }
    }

    return Milo.arcade(host, {
      id: 'futoshiki',
      w: W, h: H, bg: '#141d2e',
      stats: ['Filled', 'Time', 'Best'],
      emo: '🔢',
      touch: 'dpad',
      touchButtons: [
        { label: '1', key: 'Digit1' }, { label: '2', key: 'Digit2' }, { label: '3', key: 'Digit3' },
        { label: '4', key: 'Digit4' }, { label: '5', key: 'Digit5' }, { label: '⌫', key: 'Backspace' }
      ],
      start: {
        title: 'Futoshiki',
        text: 'Fill the grid so every row and column contains 1 to 5 exactly once — and every ' +
          'greater-than sign between two cells stays true.',
        keys: ['Click a cell or use arrow keys', 'Type 1–5 to place, Backspace to clear']
      },

      preload: function (g) {
        g.best = Milo.store.get('best:futoshiki-time', 0);
      },
      init: reset,

      onPointer: function (g, type, px, py) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data;
        for (var r = 0; r < N; r++) {
          for (var c = 0; c < N; c++) {
            var p = pos(r, c);
            if (px >= p.x && px <= p.x + CELL && py >= p.y && py <= p.y + CELL) {
              d.sel = { r: r, c: c };
              Milo.sound.click();
              return;
            }
          }
        }
      },

      onKey: function (g, e, name) {
        if (g.state !== 'play') return;
        var d = g.data;
        if (name === 'up') d.sel.r = (d.sel.r + N - 1) % N;
        else if (name === 'down') d.sel.r = (d.sel.r + 1) % N;
        else if (name === 'left') d.sel.c = (d.sel.c + N - 1) % N;
        else if (name === 'right') d.sel.c = (d.sel.c + 1) % N;
        else if (e.code === 'Backspace' || e.code === 'Delete' || e.code === 'Digit0') {
          if (!d.given[d.sel.r][d.sel.c]) { d.grid[d.sel.r][d.sel.c] = 0; recheck(d); g.set('Filled', filled(d) + '/' + (N * N)); }
        } else if (/^Digit[1-5]$/.test(e.code)) place(g, +e.code.slice(5));
        else if (/^Numpad[1-5]$/.test(e.code)) place(g, +e.code.slice(6));
      },

      update: function (g, dt) {
        var d = g.data;
        if (!d.done) { d.time += dt; g.set('Time', U.time(d.time)); }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#1c2740'); bg.addColorStop(1, '#0e1524');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        c.textAlign = 'center';
        c.textBaseline = 'middle';

        for (var r = 0; r < N; r++) {
          for (var cc = 0; cc < N; cc++) {
            var p = pos(r, cc), v = d.grid[r][cc], fixed = d.given[r][cc];
            var bad = d.bad[r + ',' + cc];
            var isSel = d.sel.r === r && d.sel.c === cc;
            c.fillStyle = fixed ? '#26324f' : bad ? '#4b2230' : '#1c2540';
            U.roundRect(c, p.x, p.y, CELL, CELL, 10); c.fill();
            c.lineWidth = isSel ? 3 : 1.5;
            c.strokeStyle = isSel ? '#ffd166' : 'rgba(255,255,255,.14)';
            U.roundRect(c, p.x, p.y, CELL, CELL, 10); c.stroke();
            if (v) {
              c.fillStyle = fixed ? '#9fc4ff' : bad ? '#ff8fa3' : '#f2f5ff';
              c.font = '600 36px Outfit, sans-serif';
              c.fillText(v, p.x + CELL / 2, p.y + CELL / 2 + 2);
            }
          }
        }

        // Signs sit in the gaps and always read "greater than" left-to-right or top-to-bottom.
        c.font = '600 26px Outfit, sans-serif';
        c.fillStyle = '#ffc46b';
        d.rels.forEach(function (q) {
          var a = pos(q.ar, q.ac), b = pos(q.br, q.bc);
          var mx = (a.x + b.x) / 2 + CELL / 2, my = (a.y + b.y) / 2 + CELL / 2;
          if (q.ar === q.br) {
            c.fillText(q.ac < q.bc ? '>' : '<', mx, my);
          } else {
            // Vertical signs read as chevrons pointing at the smaller cell.
            c.fillText(q.ar < q.br ? '∨' : '∧', mx, my);
          }
        });

        c.fillStyle = 'rgba(255,255,255,.5)';
        c.font = '600 13px Outfit, sans-serif';
        c.fillText('Every row and column holds 1–5 once. The open side of each sign points at the bigger number.',
          W / 2, H - 24);
        c.textBaseline = 'alphabetic';
      }
    });
  }

  window.Milo.register({
    id: 'futoshiki', title: 'Futoshiki', emo: '🔢', category: 'Puzzle',
    tagline: 'Latin squares with attitude',
    description: 'Fill a five-by-five grid so each row and column uses the numbers 1 to 5 exactly ' +
      'once. The twist is the signs sitting between neighbouring cells: each one must stay true, ' +
      'so a single greater-than can rule out half the possibilities in a row. Every puzzle is ' +
      'generated fresh and checked to have exactly one answer, and cells that break a rule turn ' +
      'red the moment you place them.',
    controls: ['Click a cell or use arrow keys', 'Type 1–5 to place', 'Backspace to clear'],
    colors: ['#1c2740', '#ffc46b'],
    tags: ['logic', 'sudoku-like', 'numbers', 'brain'],
    mount: mount
  });
})();
