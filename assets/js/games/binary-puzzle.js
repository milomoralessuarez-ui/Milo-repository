/* Binary Puzzle — fill a grid with two symbols under three balance rules. */
(function () {
  'use strict';
  var W = 760, H = 640, N = 8, CELL = 60, PAD = 6, MIN_CLUES = 22;
  var BOARD = N * CELL;
  var OX = (W - BOARD) / 2, OY = 92;

  function pos(r, c) { return { x: OX + c * CELL, y: OY + r * CELL }; }

  /** Three in a row of the same symbol is illegal in every direction. */
  function runOk(grid, r, c) {
    var v = grid[r][c];
    if (!v) return true;
    var i;
    // Only the three windows that actually contain this cell can have been broken by it.
    for (i = c - 2; i <= c; i++) {
      if (i < 0 || i + 2 >= N) continue;
      if (grid[r][i] === v && grid[r][i + 1] === v && grid[r][i + 2] === v) return false;
    }
    for (i = r - 2; i <= r; i++) {
      if (i < 0 || i + 2 >= N) continue;
      if (grid[i][c] === v && grid[i + 1][c] === v && grid[i + 2][c] === v) return false;
    }
    return true;
  }

  /** Neither symbol may outnumber the other, so each line holds N/2 of each. */
  function countOk(grid, r, c) {
    var rowA = 0, rowB = 0, colA = 0, colB = 0, i;
    for (i = 0; i < N; i++) {
      if (grid[r][i] === 1) rowA++; else if (grid[r][i] === 2) rowB++;
      if (grid[i][c] === 1) colA++; else if (grid[i][c] === 2) colB++;
    }
    return rowA <= N / 2 && rowB <= N / 2 && colA <= N / 2 && colB <= N / 2;
  }

  function lineFull(grid, r) {
    for (var i = 0; i < N; i++) if (!grid[r][i]) return false;
    return true;
  }

  function colFull(grid, c) {
    for (var i = 0; i < N; i++) if (!grid[i][c]) return false;
    return true;
  }

  function rowKey(grid, r) { return grid[r].join(''); }
  function colKey(grid, c) {
    var s = '';
    for (var i = 0; i < N; i++) s += grid[i][c];
    return s;
  }

  /** No two rows may be identical, and no two columns either. */
  function uniqueOk(grid, r, c) {
    var i;
    if (lineFull(grid, r)) {
      var rk = rowKey(grid, r);
      for (i = 0; i < N; i++) if (i !== r && lineFull(grid, i) && rowKey(grid, i) === rk) return false;
    }
    if (colFull(grid, c)) {
      var ck = colKey(grid, c);
      for (i = 0; i < N; i++) if (i !== c && colFull(grid, i) && colKey(grid, i) === ck) return false;
    }
    return true;
  }

  function legal(grid, r, c) {
    return runOk(grid, r, c) && countOk(grid, r, c) && uniqueOk(grid, r, c);
  }

  /** Counts solutions up to `cap` — used for generation and for the uniqueness check. */
  function countSolutions(given, cap, budget) {
    var grid = given.map(function (row) { return row.slice(); });
    var found = 0, steps = 0;

    function step(n) {
      if (found >= cap || steps > budget) return;
      steps++;
      if (n === N * N) { found++; return; }
      var r = (n / N) | 0, c = n % N;
      if (grid[r][c]) {
        if (!legal(grid, r, c)) return;
        step(n + 1);
        return;
      }
      for (var v = 1; v <= 2; v++) {
        grid[r][c] = v;
        if (legal(grid, r, c)) step(n + 1);
        grid[r][c] = 0;
        if (found >= cap || steps > budget) return;
      }
    }

    step(0);
    return steps > budget ? -1 : found;
  }

  function fullGrid() {
    var grid = [];
    for (var i = 0; i < N; i++) grid.push(new Array(N).fill(0));
    var steps = 0;

    function step(n) {
      if (n === N * N) return true;
      if (++steps > 200000) return false;
      var r = (n / N) | 0, c = n % N;
      var order = Math.random() < .5 ? [1, 2] : [2, 1];
      for (var k = 0; k < 2; k++) {
        grid[r][c] = order[k];
        if (legal(grid, r, c) && step(n + 1)) return true;
        grid[r][c] = 0;
      }
      return false;
    }

    return step(0) ? grid : null;
  }

  function makePuzzle(U) {
    var sol = null;
    for (var t = 0; t < 6 && !sol; t++) sol = fullGrid();
    if (!sol) {
      // A hand-built fallback so a slow generator never leaves the board empty.
      sol = [];
      for (var r = 0; r < N; r++) {
        var row = [];
        for (var c = 0; c < N; c++) row.push(((c + (r % 2) * 2 + ((r / 2) | 0)) % 4 < 2) ? 1 : 2);
        sol.push(row);
      }
    }
    var given = sol.map(function (row) { return row.slice(); });
    var cells = [];
    for (var i = 0; i < N * N; i++) cells.push(i);
    U.shuffle(cells);
    // Peel cells away while the answer stays forced; a budget keeps generation snappy.
    // Stopping at MIN_CLUES leaves a puzzle that yields to plain logic rather than a slog.
    var clues = N * N;
    for (var j = 0; j < cells.length && clues > MIN_CLUES; j++) {
      var cr = (cells[j] / N) | 0, cc = cells[j] % N;
      var keep = given[cr][cc];
      given[cr][cc] = 0;
      if (countSolutions(given, 2, 120000) !== 1) given[cr][cc] = keep;
      else clues--;
    }
    return { sol: sol, given: given };
  }

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      var p = makePuzzle(U);
      d.sol = p.sol;
      d.given = p.given;
      d.grid = p.given.map(function (row) { return row.slice(); });
      d.sel = { r: 0, c: 0 };
      d.time = 0;
      d.done = false;
      d.bad = {};
      g.set('Empty', empties(d));
      g.set('Time', '0:00');
      g.set('Best', g.best ? U.time(g.best) : '—');
    }

    function empties(d) {
      var n = 0;
      d.grid.forEach(function (row) { row.forEach(function (v) { if (!v) n++; }); });
      return n;
    }

    function recheck(d) {
      d.bad = {};
      for (var r = 0; r < N; r++) {
        for (var c = 0; c < N; c++) {
          if (!d.grid[r][c]) continue;
          if (!legal(d.grid, r, c)) d.bad[r + ',' + c] = 1;
        }
      }
    }

    function solvedNow(d) {
      for (var r = 0; r < N; r++) {
        for (var c = 0; c < N; c++) {
          if (!d.grid[r][c]) return false;
          if (!legal(d.grid, r, c)) return false;
        }
      }
      return true;
    }

    /** Clicking cycles empty → sun → moon → empty, which is one control for three states. */
    function cycle(g, r, c, back) {
      var d = g.data;
      if (d.done || d.given[r][c]) { Milo.sound.tone({ f: 150, d: .07, v: .05, type: 'square' }); return; }
      var v = d.grid[r][c];
      d.grid[r][c] = back ? (v + 2) % 3 : (v + 1) % 3;
      recheck(d);
      Milo.sound.blip();
      g.set('Empty', empties(d));
      if (solvedNow(d)) {
        d.done = true;
        var secs = Math.round(d.time);
        Milo.sound.win();
        g.win({
          emo: '🌗', title: 'Balanced!', text: 'Solved in ' + U.time(d.time) + '.',
          score: Math.max(200, 3000 - secs * 8)
        });
        if (!g.best || secs < g.best) { g.best = secs; Milo.store.set('best:binary-puzzle-time', secs); }
        g.set('Best', U.time(g.best));
      }
    }

    return Milo.arcade(host, {
      id: 'binary-puzzle',
      w: W, h: H, bg: '#151426',
      stats: ['Empty', 'Time', 'Best'],
      emo: '🌗',
      touch: 'dpad+a',
      start: {
        title: 'Binary Puzzle',
        text: 'Fill every square with a sun or a moon. Never three of the same in a row, an ' +
          'equal count of each in every row and column, and no two rows or columns alike.',
        keys: ['Click a square to cycle sun → moon → blank', 'Arrow keys to move, Space to cycle']
      },

      preload: function (g) { g.best = Milo.store.get('best:binary-puzzle-time', 0); },
      init: reset,

      onPointer: function (g, type, px, py, e) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data;
        for (var r = 0; r < N; r++) {
          for (var c = 0; c < N; c++) {
            var p = pos(r, c);
            if (px >= p.x && px < p.x + CELL && py >= p.y && py < p.y + CELL) {
              d.sel = { r: r, c: c };
              cycle(g, r, c, !!(e && e.button === 2));
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
        else if (name === 'a' || name === 'action') cycle(g, d.sel.r, d.sel.c, false);
        else if (e.code === 'Digit1') { if (!d.given[d.sel.r][d.sel.c] && !d.done) { d.grid[d.sel.r][d.sel.c] = 1; recheck(d); g.set('Empty', empties(d)); } }
        else if (e.code === 'Digit2') { if (!d.given[d.sel.r][d.sel.c] && !d.done) { d.grid[d.sel.r][d.sel.c] = 2; recheck(d); g.set('Empty', empties(d)); } }
      },

      noContextMenu: true,

      update: function (g, dt) {
        var d = g.data;
        if (!d.done) { d.time += dt; g.set('Time', U.time(d.time)); }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#221f3c'); bg.addColorStop(1, '#100e1e');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        c.textAlign = 'center';
        c.textBaseline = 'middle';

        for (var r = 0; r < N; r++) {
          for (var cc = 0; cc < N; cc++) {
            var p = pos(r, cc), v = d.grid[r][cc], fixed = d.given[r][cc];
            var bad = d.bad[r + ',' + cc];
            var isSel = d.sel.r === r && d.sel.c === cc;
            c.fillStyle = '#191733';
            U.roundRect(c, p.x + 2, p.y + 2, CELL - 4, CELL - 4, 9); c.fill();
            if (v) {
              c.fillStyle = bad ? '#6d2338' : v === 1 ? (fixed ? '#c98a25' : '#f2b03c') : (fixed ? '#3a4a86' : '#5470c8');
              U.roundRect(c, p.x + PAD, p.y + PAD, CELL - PAD * 2, CELL - PAD * 2, 8); c.fill();
              c.font = '26px serif';
              c.fillText(v === 1 ? '☀' : '☾', p.x + CELL / 2, p.y + CELL / 2 + 1);
            }
            c.lineWidth = isSel ? 3 : 1;
            c.strokeStyle = isSel ? '#ffe08a' : 'rgba(255,255,255,.1)';
            U.roundRect(c, p.x + 2, p.y + 2, CELL - 4, CELL - 4, 9); c.stroke();
            if (fixed && v) {
              // A pip marks the clues, so a wrong guess is never mistaken for a given.
              c.fillStyle = 'rgba(0,0,0,.4)';
              c.beginPath(); c.arc(p.x + CELL - 13, p.y + 13, 3, 0, Math.PI * 2); c.fill();
            }
          }
        }

        // Per-line tallies turn the balance rule into something you can read at a glance.
        c.font = '600 12px Outfit, sans-serif';
        for (var i = 0; i < N; i++) {
          var ra = 0, rb = 0, ca = 0, cb = 0;
          for (var k = 0; k < N; k++) {
            if (d.grid[i][k] === 1) ra++; else if (d.grid[i][k] === 2) rb++;
            if (d.grid[k][i] === 1) ca++; else if (d.grid[k][i] === 2) cb++;
          }
          c.fillStyle = (ra > N / 2 || rb > N / 2) ? '#ff8fa3' : 'rgba(255,255,255,.45)';
          c.fillText(ra + '·' + rb, OX + BOARD + 26, OY + i * CELL + CELL / 2);
          c.fillStyle = (ca > N / 2 || cb > N / 2) ? '#ff8fa3' : 'rgba(255,255,255,.45)';
          c.fillText(ca + '·' + cb, OX + i * CELL + CELL / 2, OY + BOARD + 18);
        }

        c.fillStyle = 'rgba(255,255,255,.5)';
        c.fillText('Four suns and four moons per line · never three alike in a row · every row and column different',
          W / 2, H - 22);
        c.textBaseline = 'alphabetic';
      }
    });
  }

  window.Milo.register({
    id: 'binary-puzzle', title: 'Binary Puzzle', emo: '🌗', category: 'Puzzle',
    tagline: 'Suns and moons in perfect balance',
    description: 'Every square takes a sun or a moon, under three rules that squeeze the grid ' +
      'from all sides: never three of the same symbol in a row, exactly four of each in every ' +
      'row and column, and no two rows or columns identical. There is no guessing needed — each ' +
      'board is generated with a single forced answer, and the running tallies down the side ' +
      'show you when a line is about to tip over.',
    controls: ['Click a square to cycle sun → moon → blank', 'Arrow keys to move, Space to cycle'],
    colors: ['#221f3c', '#f2b03c'],
    tags: ['logic', 'binairo', 'brain', 'grid'],
    mount: mount
  });
})();
