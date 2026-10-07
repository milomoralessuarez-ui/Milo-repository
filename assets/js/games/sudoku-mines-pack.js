/* Sudoku & Mines Pack — six sudoku boards (6×6 mini through expert, plus
   Sudoku X with constrained diagonals) on one real generator that digs clues
   only while a unique solution remains, and six minefields from a gentle 9×9
   up to a 30×16 expert board, a 25%-density field and a no-flags gauntlet. */
(function () {
  'use strict';

  /* ==================================================================== */
  /* Sudoku core — pure logic, shared by all six boards.                  */
  /* ==================================================================== */

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = (Math.random() * (i + 1)) | 0, t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function pc(m) { var c = 0; while (m) { m &= m - 1; c++; } return c; }

  /** Board shape: n×n cells, boxes bw wide × bh tall, optional X diagonals. */
  function makeCfg(n, bw, bh, diag) {
    var units = [], i, j;
    for (i = 0; i < n; i++) {                       // rows
      var r = []; for (j = 0; j < n; j++) r.push(i * n + j);
      units.push(r);
    }
    for (i = 0; i < n; i++) {                       // columns
      var col = []; for (j = 0; j < n; j++) col.push(j * n + i);
      units.push(col);
    }
    for (var by = 0; by < n; by += bh) {            // boxes
      for (var bx = 0; bx < n; bx += bw) {
        var box = [];
        for (i = 0; i < bh; i++) for (j = 0; j < bw; j++) box.push((by + i) * n + bx + j);
        units.push(box);
      }
    }
    if (diag) {
      var d1 = [], d2 = [];
      for (i = 0; i < n; i++) { d1.push(i * n + i); d2.push(i * n + (n - 1 - i)); }
      units.push(d1); units.push(d2);
    }
    return {
      n: n, bw: bw, bh: bh, diag: !!diag, units: units,
      full: (1 << n) - 1, perRow: n / bw
    };
  }

  /** Count solutions up to `limit` with a bitmask MRV backtracker. */
  function solveCount(cells, cfg, limit) {
    var n = cfg.n, FULL = cfg.full, perRow = cfg.perRow, bh = cfg.bh, bw = cfg.bw;
    var row = [], col = [], box = [], d1 = 0, d2 = 0, i;
    for (i = 0; i < n; i++) { row.push(0); col.push(0); }
    for (i = 0; i < (n / bw) * (n / bh); i++) box.push(0);
    var a = new Uint8Array(n * n);
    for (i = 0; i < n * n; i++) {
      var v = cells[i];
      if (!v) continue;
      var x = i % n, y = (i / n) | 0;
      var bi = ((y / bh) | 0) * perRow + ((x / bw) | 0);
      var bit = 1 << (v - 1);
      var used = row[y] | col[x] | box[bi];
      if (cfg.diag) { if (x === y) used |= d1; if (x + y === n - 1) used |= d2; }
      if (used & bit) return 0;                     // givens contradict
      row[y] |= bit; col[x] |= bit; box[bi] |= bit;
      if (cfg.diag) { if (x === y) d1 |= bit; if (x + y === n - 1) d2 |= bit; }
      a[i] = v;
    }
    var count = 0;
    function rec() {
      if (count >= limit) return;
      var best = -1, bestM = 0, bestC = n + 1;
      for (var k = 0; k < n * n; k++) {
        if (a[k]) continue;
        var x = k % n, y = (k / n) | 0;
        var m = row[y] | col[x] | box[((y / bh) | 0) * perRow + ((x / bw) | 0)];
        if (cfg.diag) { if (x === y) m |= d1; if (x + y === n - 1) m |= d2; }
        m = FULL & ~m;
        var c = pc(m);
        if (!c) return;
        if (c < bestC) { bestC = c; best = k; bestM = m; if (c === 1) break; }
      }
      if (best === -1) { count++; return; }
      var bx2 = best % n, by2 = (best / n) | 0;
      var bIdx = ((by2 / bh) | 0) * perRow + ((bx2 / bw) | 0);
      var onD1 = cfg.diag && bx2 === by2, onD2 = cfg.diag && bx2 + by2 === n - 1;
      for (var v2 = 1; v2 <= n && count < limit; v2++) {
        var b2 = 1 << (v2 - 1);
        if (!(bestM & b2)) continue;
        a[best] = v2; row[by2] |= b2; col[bx2] |= b2; box[bIdx] |= b2;
        if (onD1) d1 |= b2; if (onD2) d2 |= b2;
        rec();
        a[best] = 0; row[by2] &= ~b2; col[bx2] &= ~b2; box[bIdx] &= ~b2;
        if (onD1) d1 &= ~b2; if (onD2) d2 &= ~b2;
      }
    }
    rec();
    return count;
  }

  /** Fill a complete valid grid by randomised MRV backtracking. */
  function fillGrid(cfg) {
    var n = cfg.n, FULL = cfg.full, perRow = cfg.perRow, bh = cfg.bh, bw = cfg.bw;
    var row = [], col = [], box = [], d1 = 0, d2 = 0, i;
    for (i = 0; i < n; i++) { row.push(0); col.push(0); }
    for (i = 0; i < (n / bw) * (n / bh); i++) box.push(0);
    var a = new Uint8Array(n * n);
    function rec() {
      var best = -1, bestM = 0, bestC = n + 1;
      for (var k = 0; k < n * n; k++) {
        if (a[k]) continue;
        var x = k % n, y = (k / n) | 0;
        var m = row[y] | col[x] | box[((y / bh) | 0) * perRow + ((x / bw) | 0)];
        if (cfg.diag) { if (x === y) m |= d1; if (x + y === n - 1) m |= d2; }
        m = FULL & ~m;
        var c = pc(m);
        if (!c) return false;
        if (c < bestC) { bestC = c; best = k; bestM = m; if (c === 1) break; }
      }
      if (best === -1) return true;
      var vs = [];
      for (var v = 1; v <= n; v++) if (bestM & (1 << (v - 1))) vs.push(v);
      shuffle(vs);
      var bx2 = best % n, by2 = (best / n) | 0;
      var bIdx = ((by2 / bh) | 0) * perRow + ((bx2 / bw) | 0);
      var onD1 = cfg.diag && bx2 === by2, onD2 = cfg.diag && bx2 + by2 === n - 1;
      for (var q = 0; q < vs.length; q++) {
        var b2 = 1 << (vs[q] - 1);
        a[best] = vs[q]; row[by2] |= b2; col[bx2] |= b2; box[bIdx] |= b2;
        if (onD1) d1 |= b2; if (onD2) d2 |= b2;
        if (rec()) return true;
        a[best] = 0; row[by2] &= ~b2; col[bx2] &= ~b2; box[bIdx] &= ~b2;
        if (onD1) d1 &= ~b2; if (onD2) d2 &= ~b2;
      }
      return false;
    }
    rec();
    return a;
  }

  /** True if naked + hidden singles alone complete the puzzle (which also
      proves the solution unique) — the gate for the gentler difficulties. */
  function singlesSolvable(cells, cfg) {
    var n = cfg.n, FULL = cfg.full, perRow = cfg.perRow, bh = cfg.bh, bw = cfg.bw;
    var total = n * n;
    var row = [], col = [], box = [], d1 = 0, d2 = 0, i;
    for (i = 0; i < n; i++) { row.push(0); col.push(0); }
    for (i = 0; i < (n / bw) * (n / bh); i++) box.push(0);
    var a = new Uint8Array(total), filled = 0;
    function put(idx, v) {
      var x = idx % n, y = (idx / n) | 0, bit = 1 << (v - 1);
      a[idx] = v; filled++;
      row[y] |= bit; col[x] |= bit;
      box[((y / bh) | 0) * perRow + ((x / bw) | 0)] |= bit;
      if (cfg.diag) { if (x === y) d1 |= bit; if (x + y === n - 1) d2 |= bit; }
    }
    function cand(idx) {
      var x = idx % n, y = (idx / n) | 0;
      var m = row[y] | col[x] | box[((y / bh) | 0) * perRow + ((x / bw) | 0)];
      if (cfg.diag) { if (x === y) m |= d1; if (x + y === n - 1) m |= d2; }
      return FULL & ~m;
    }
    for (i = 0; i < total; i++) if (cells[i]) put(i, cells[i]);
    var progress = true;
    while (progress && filled < total) {
      progress = false;
      for (i = 0; i < total; i++) {                 // naked singles
        if (a[i]) continue;
        var m = cand(i);
        if (!m) return false;
        if (!(m & (m - 1))) {
          var v = 1; while (!(m & 1)) { m >>= 1; v++; }
          put(i, v); progress = true;
        }
      }
      for (var u = 0; u < cfg.units.length; u++) {  // hidden singles
        var unit = cfg.units[u];
        for (var d = 0; d < n; d++) {
          var bit = 1 << d, spot = -1, cnt = 0, present = false;
          for (var k = 0; k < unit.length; k++) {
            var idx = unit[k];
            if (a[idx] === d + 1) { present = true; break; }
            if (!a[idx] && (cand(idx) & bit)) { cnt++; spot = idx; if (cnt > 1) break; }
          }
          if (present || cnt !== 1) continue;
          put(spot, d + 1); progress = true;
        }
      }
    }
    return filled === total;
  }

  /** Remove up to `target` clues, keeping the puzzle uniquely solvable —
      via singles alone for gentle boards, via full solution counting for the
      hard ones. Time-capped so generation always lands well under 200ms. */
  function digGrid(a, cfg, target, singles) {
    var order = [], i;
    for (i = 0; i < a.length; i++) order.push(i);
    shuffle(order);
    var removed = 0, t0 = Date.now();
    for (var k = 0; k < order.length && removed < target; k++) {
      if (Date.now() - t0 > 150) break;
      var idx = order[k];
      if (!a[idx]) continue;
      var keep = a[idx];
      a[idx] = 0;
      var ok = singles ? singlesSolvable(a, cfg) : solveCount(a, cfg, 2) === 1;
      if (ok) removed++; else a[idx] = keep;
    }
    return removed;
  }

  /** Mark every filled cell that clashes with another in a shared unit. */
  function findConflicts(cells, cfg) {
    var bad = new Array(cells.length), i;
    for (i = 0; i < cells.length; i++) bad[i] = false;
    for (var u = 0; u < cfg.units.length; u++) {
      var unit = cfg.units[u], seen = {};
      for (var k = 0; k < unit.length; k++) {
        var idx = unit[k], v = cells[idx];
        if (!v) continue;
        if (seen[v] != null) { bad[idx] = true; bad[seen[v]] = true; }
        else seen[v] = idx;
      }
    }
    return bad;
  }

  // Exposed so tools-side scripts can verify generation and uniqueness;
  // the games themselves only use the local functions above.
  window.Milo._sudokuMinesCore = {
    makeCfg: makeCfg, fillGrid: fillGrid, solveCount: solveCount,
    singlesSolvable: singlesSolvable, digGrid: digGrid, findConflicts: findConflicts
  };

  /* ==================================================================== */
  /* Sudoku UI — one canvas board, parameterised per difficulty.          */
  /* ==================================================================== */

  function makeSudoku(opt) {
    var cfg = makeCfg(opt.n, opt.bw, opt.bh, opt.diag);
    var N = opt.n, CELL = N === 6 ? 84 : 62, TOP = 26;
    var BOARD = N * CELL;
    var W = BOARD + 96, PADX = 48;
    var db = Math.min(54, ((BOARD - (N - 1) * 8) / N) | 0);
    var dpTotal = N * db + (N - 1) * 8;
    var dpX = (W - dpTotal) / 2, dpY = TOP + BOARD + 12;
    var r2Y = dpY + 58, r2X = (W - 272) / 2;
    var H = r2Y + 40 + 14;

    return function mount(host) {
      var Milo = window.Milo, U = Milo.util;

      function countLeft(g) {
        var d = g.data, left = 0;
        for (var i = 0; i < N * N; i++) if (!d.cells[i]) left++;
        d.left = left;
        g.set('Left', left);
        return left;
      }

      function reset(g) {
        var d = g.data;
        d.solution = fillGrid(cfg);
        d.given = Uint8Array.from(d.solution);
        digGrid(d.given, cfg, opt.dig, opt.singles);
        d.cells = Uint8Array.from(d.given);
        d.notes = new Array(N * N);
        for (var i = 0; i < N * N; i++) d.notes[i] = 0;
        d.conf = findConflicts(d.cells, cfg);
        d.sel = null;
        d.noteMode = false;
        d.time = 0;
        d.done = false;
        countLeft(g);
        g.set('Time', '0:00');
      }

      function place(g, v) {
        var d = g.data;
        if (d.done || d.sel == null) return;
        var i = d.sel;
        if (d.given[i]) return;
        if (d.noteMode && v) {
          if (d.cells[i]) return;
          d.notes[i] ^= 1 << (v - 1);
          Milo.sound.blip();
          return;
        }
        if (!v) {
          if (!d.cells[i] && !d.notes[i]) return;
          d.cells[i] = 0; d.notes[i] = 0;
        } else {
          d.cells[i] = v; d.notes[i] = 0;
        }
        d.conf = findConflicts(d.cells, cfg);
        if (v && d.conf[i]) Milo.sound.tone({ f: 150, d: .12, v: .07, type: 'square' });
        else if (v) Milo.sound.blip();
        else Milo.sound.click();
        if (countLeft(g) === 0) {
          for (var k = 0; k < N * N; k++) if (d.conf[k]) return;
          d.done = true;
          var score = Math.max(250, opt.base - Math.round(d.time) * opt.perSec);
          g.win({
            emo: opt.emo, title: 'Solved!',
            text: 'A clean grid in ' + U.time(d.time) + '.',
            score: score
          });
        }
      }

      return Milo.arcade(host, {
        id: opt.id,
        w: W, h: H, bg: '#0f1330',
        stats: ['Time', 'Left'],
        emo: opt.emo,
        start: {
          title: opt.title,
          text: opt.startText,
          keys: ['Click a cell', '1–' + N + ' to enter', 'N for notes', 'Backspace clears']
        },
        init: reset,

        onKey: function (g, e) {
          var d = g.data;
          var m = /^(?:Digit|Numpad)([1-9])$/.exec(e.code);
          if (m) { var v = +m[1]; if (v <= N) place(g, v); return; }
          if (e.code === 'Backspace' || e.code === 'Delete' ||
              e.code === 'Digit0' || e.code === 'Numpad0') { place(g, 0); return; }
          if (e.code === 'KeyN') { d.noteMode = !d.noteMode; return; }
          if (/^Arrow/.test(e.code)) {
            if (d.sel == null) { d.sel = 0; return; }
            var x = d.sel % N, y = (d.sel / N) | 0;
            if (e.code === 'ArrowLeft') x = Math.max(0, x - 1);
            if (e.code === 'ArrowRight') x = Math.min(N - 1, x + 1);
            if (e.code === 'ArrowUp') y = Math.max(0, y - 1);
            if (e.code === 'ArrowDown') y = Math.min(N - 1, y + 1);
            d.sel = y * N + x;
          }
        },

        onPointer: function (g, type, px, py) {
          if (type !== 'down' || g.state !== 'play') return;
          var d = g.data;
          if (py >= dpY && py <= dpY + 48) {
            for (var k = 0; k < N; k++) {
              var bx = dpX + k * (db + 8);
              if (px >= bx && px <= bx + db) { place(g, k + 1); return; }
            }
            return;
          }
          if (py >= r2Y && py <= r2Y + 40) {
            if (px >= r2X && px <= r2X + 120) { place(g, 0); return; }
            if (px >= r2X + 132 && px <= r2X + 272) {
              d.noteMode = !d.noteMode;
              Milo.sound.click();
              return;
            }
            return;
          }
          var x = Math.floor((px - PADX) / CELL), y = Math.floor((py - TOP) / CELL);
          if (x < 0 || y < 0 || x >= N || y >= N) return;
          d.sel = y * N + x;
        },

        update: function (g, dt) {
          var d = g.data;
          if (d.done) return;
          d.time += dt;
          g.set('Time', U.time(d.time));
        },

        draw: function (g) {
          var c = g.ctx, d = g.data;
          var selVal = d.sel != null ? d.cells[d.sel] : 0;
          var sx = d.sel != null ? d.sel % N : -1;
          var sy = d.sel != null ? (d.sel / N) | 0 : -1;

          for (var i = 0; i < N * N; i++) {
            var x = i % N, y = (i / N) | 0;
            var px = PADX + x * CELL, py = TOP + y * CELL;
            var sameUnit = d.sel != null && (x === sx || y === sy ||
              (((x / opt.bw) | 0) === ((sx / opt.bw) | 0) &&
               ((y / opt.bh) | 0) === ((sy / opt.bh) | 0)));
            c.fillStyle = i === d.sel ? 'rgba(124,92,255,.42)'
              : sameUnit ? 'rgba(124,92,255,.12)'
                : (((x / opt.bw | 0) + (y / opt.bh | 0)) % 2
                  ? 'rgba(255,255,255,.045)' : 'rgba(255,255,255,.02)');
            c.fillRect(px, py, CELL, CELL);
            if (opt.diag && (x === y || x + y === N - 1) && i !== d.sel) {
              c.fillStyle = 'rgba(255,210,87,.09)';
              c.fillRect(px, py, CELL, CELL);
            }

            var v = d.cells[i];
            if (v) {
              if (d.conf[i]) {
                c.fillStyle = 'rgba(251,113,133,.16)';
                c.fillRect(px, py, CELL, CELL);
              }
              c.fillStyle = d.conf[i] ? '#fb7185'
                : d.given[i] ? '#e8ecff' : '#22d3ee';
              if (!d.conf[i] && selVal && v === selVal && i !== d.sel) c.fillStyle = '#ffd257';
              c.font = (d.given[i] ? '800 ' : '600 ') + (N === 6 ? 38 : 30) + 'px Outfit, sans-serif';
              c.textAlign = 'center';
              c.fillText(v, px + CELL / 2, py + CELL / 2 + (N === 6 ? 13 : 11));
            } else if (d.notes[i]) {
              c.fillStyle = 'rgba(255,255,255,.45)';
              c.font = '600 ' + (N === 6 ? 15 : 11) + 'px Outfit, sans-serif';
              c.textAlign = 'center';
              for (var nv = 1; nv <= N; nv++) {
                if (!(d.notes[i] & (1 << (nv - 1)))) continue;
                var nx = px + CELL * .22 + ((nv - 1) % 3) * CELL * .28;
                var ny = py + CELL * .3 + (((nv - 1) / 3) | 0) * CELL * (N === 6 ? .36 : .28);
                c.fillText(nv, nx, ny);
              }
            }
          }

          var k2;
          for (k2 = 0; k2 <= N; k2++) {               // vertical lines
            var majV = k2 % opt.bw === 0;
            c.lineWidth = majV ? 2.6 : 1;
            c.strokeStyle = majV ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.14)';
            c.beginPath();
            c.moveTo(PADX + k2 * CELL, TOP);
            c.lineTo(PADX + k2 * CELL, TOP + BOARD);
            c.stroke();
          }
          for (k2 = 0; k2 <= N; k2++) {               // horizontal lines
            var majH = k2 % opt.bh === 0;
            c.lineWidth = majH ? 2.6 : 1;
            c.strokeStyle = majH ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.14)';
            c.beginPath();
            c.moveTo(PADX, TOP + k2 * CELL);
            c.lineTo(PADX + BOARD, TOP + k2 * CELL);
            c.stroke();
          }
          if (opt.diag) {
            c.strokeStyle = 'rgba(255,210,87,.3)';
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(PADX, TOP); c.lineTo(PADX + BOARD, TOP + BOARD);
            c.moveTo(PADX + BOARD, TOP); c.lineTo(PADX, TOP + BOARD);
            c.stroke();
          }

          for (var k3 = 0; k3 < N; k3++) {            // digit pad
            var bx2 = dpX + k3 * (db + 8);
            c.fillStyle = 'rgba(255,255,255,.10)';
            U.roundRect(c, bx2, dpY, db, 48, 9); c.fill();
            c.fillStyle = '#dfe5ff';
            c.font = '700 22px Outfit, sans-serif';
            c.textAlign = 'center';
            c.fillText(k3 + 1, bx2 + db / 2, dpY + 32);
          }
          c.fillStyle = 'rgba(255,255,255,.10)';
          U.roundRect(c, r2X, r2Y, 120, 40, 9); c.fill();
          c.fillStyle = d.noteMode ? '#7c5cff' : 'rgba(255,255,255,.10)';
          U.roundRect(c, r2X + 132, r2Y, 140, 40, 9); c.fill();
          c.fillStyle = '#fff';
          c.font = '700 13px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText('⌫ Erase', r2X + 60, r2Y + 25);
          c.fillText('✏️ Notes (N)', r2X + 202, r2Y + 25);
        }
      });
    };
  }

  /* ==================================================================== */
  /* Minesweeper engine — one DOM board, parameterised per field.         */
  /* ==================================================================== */

  var NUM_COL = ['', '#60a5fa', '#34d399', '#fb7185', '#a78bfa', '#fb923c', '#22d3ee', '#e2e8f0', '#94a3b8'];

  function makeMines(opt) {
    var COLS = opt.cols, ROWS = opt.rows, MINES = opt.mines;
    var FLAGS = opt.flags !== false;

    return function mount(host) {
      var Milo = window.Milo, U = Milo.util;
      var cellEls = [], hudRo = null;

      function bestTime() { return Milo.store.get('best:' + opt.id + '-time', 0) || 0; }

      function reset(g) {
        var d = g.data;
        d.mine = new Array(COLS * ROWS);
        d.open = new Array(COLS * ROWS);
        d.flag = new Array(COLS * ROWS);
        d.count = new Array(COLS * ROWS);
        for (var i = 0; i < COLS * ROWS; i++) {
          d.mine[i] = false; d.open[i] = false; d.flag[i] = false; d.count[i] = 0;
        }
        d.placed = false;                 // mines are laid after the first click
        d.time = 0;
        d.left = MINES;
        d.done = false;
        build(g);
        g.set('Mines', MINES);
        g.set('Time', '0:00');
        g.set('Best', bestTime() ? U.time(bestTime()) : '—');
      }

      function build(g) {
        var wrap = document.createElement('div');
        // The wrapper fills the stage and acts as a size container, so the
        // board is measured against the real stage (100cqw/100cqh) rather
        // than the viewport. Browsers without container units keep the
        // vw/vh fallback declared first.
        wrap.style.cssText = 'display:flex;flex-direction:column;gap:8px;' +
          'width:100%;height:100%;box-sizing:border-box;container-type:size';
        var grid = document.createElement('div');
        var ratio = (COLS / ROWS).toFixed(4);
        var maxPx = Math.min(1000, COLS * 40 + 12);
        // Cells never shrink below classic Windows size (~18px); past that
        // the board keeps its size and the stage scrolls instead.
        var minPx = COLS * (COLS > 20 ? 17 : 18) + 2 * (COLS - 1) + 12;
        // Auto side margins (not flex centering): an oversized board then
        // starts at the left edge and scrolls, instead of clipping its left.
        grid.style.cssText = 'display:grid;grid-template-columns:repeat(' + COLS + ',1fr);' +
          'gap:2px;background:#1b2046;padding:6px;border-radius:10px;' +
          'box-sizing:border-box;flex:none;margin:0 auto;container-type:inline-size;' +
          'width:min(94vw,calc(72vh*' + ratio + '),' + maxPx + 'px);' +
          'width:min(100cqw,calc((100cqh - 44px)*' + ratio + '),' + maxPx + 'px);' +
          'min-width:' + minPx + 'px';
        cellEls = [];
        // Digit size follows the cell (the grid is its own inline container),
        // with a viewport-based fallback for browsers without cq units.
        var fontCss = 'font:800 clamp(8px,' + (28 / COLS).toFixed(2) + 'vw,16px)/1 Outfit,sans-serif;' +
          'font-size:clamp(8px,calc(100cqw/' + COLS + '*.62),17px);';
        for (var i = 0; i < COLS * ROWS; i++) {
          var b = document.createElement('button');
          b.type = 'button';
          b.dataset.i = i;
          b.style.cssText = 'aspect-ratio:1;border:0;border-radius:4px;cursor:pointer;' +
            'background:#2b3167;color:#fff;' + fontCss +
            'display:grid;place-items:center;padding:0;user-select:none;-webkit-user-select:none';
          grid.appendChild(b);
          cellEls.push(b);
        }
        var hint = document.createElement('div');
        hint.style.cssText = 'color:#a8b0d8;font-size:.84rem;line-height:1.3;text-align:center;' +
          'max-width:min(100%,600px);margin:0 auto;flex:none';
        hint.innerHTML = FLAGS
          ? 'Click to reveal · Right-click (or long-press) to flag · ' +
            'Click a number with its flags placed to clear around it'
          : 'No flags on this field — every click is a commitment. ' +
            'Read the numbers, be sure, then reveal.';
        wrap.appendChild(grid);
        wrap.appendChild(hint);
        g.root.innerHTML = '';
        g.root.appendChild(wrap);

        // The engine's stat boxes wrap to a second row on narrow screens and
        // would cover the top of the board; pad the wrapper by the overlap.
        if (hudRo) { hudRo.disconnect(); hudRo = null; }
        function fitUnderHud() {
          var stats = g.hud ? g.hud.querySelectorAll('.hud-stat') : null;
          if (!stats || !stats.length) return;
          var top = g.root.getBoundingClientRect().top;
          var bottom = stats[stats.length - 1].getBoundingClientRect().bottom - top;
          wrap.style.paddingTop = Math.max(0, Math.round(bottom - 58 + 8)) + 'px';
        }
        fitUnderHud();
        if (window.ResizeObserver && g.hud) {
          hudRo = new ResizeObserver(fitUnderHud);
          hudRo.observe(g.hud.querySelector('.hud-top') || g.hud);
        }

        grid.addEventListener('contextmenu', function (e) { e.preventDefault(); });
        grid.addEventListener('mousedown', function (e) {
          var b = e.target.closest('button');
          if (!b) return;
          var i = +b.dataset.i;
          if (e.button === 2) { if (FLAGS) toggleFlag(g, i); }
          else if (e.button === 0) click(g, i);
        });

        // Long-press flags on touch (tap reveals either way).
        var timer = null, moved = false;
        grid.addEventListener('touchstart', function (e) {
          var b = e.target.closest('button');
          if (!b) return;
          moved = false;
          var i = +b.dataset.i;
          if (FLAGS) timer = setTimeout(function () { timer = null; toggleFlag(g, i); }, 380);
        }, { passive: true });
        grid.addEventListener('touchmove', function () { moved = true; });
        grid.addEventListener('touchend', function (e) {
          var b = e.target.closest('button');
          if (FLAGS) {
            if (timer) {
              clearTimeout(timer); timer = null;
              if (b && !moved) click(g, +b.dataset.i);
            }
          } else if (b && !moved) {
            click(g, +b.dataset.i);
          }
          if (e.cancelable) e.preventDefault();
        });
      }

      function around(i, fn) {
        var x = i % COLS, y = (i / COLS) | 0;
        for (var dy = -1; dy <= 1; dy++) {
          for (var dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            var nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
            fn(ny * COLS + nx);
          }
        }
      }

      /** Mines go down only after the first click, never on or next to it. */
      function place(d, safe) {
        var forbidden = {};
        forbidden[safe] = 1;
        around(safe, function (n) { forbidden[n] = 1; });
        var pool = [], i;
        for (i = 0; i < COLS * ROWS; i++) if (!forbidden[i]) pool.push(i);
        if (pool.length < MINES) {
          pool = [];
          for (i = 0; i < COLS * ROWS; i++) if (i !== safe) pool.push(i);
        }
        U.shuffle(pool);
        for (var m = 0; m < MINES; m++) d.mine[pool[m]] = true;
        for (var k = 0; k < COLS * ROWS; k++) {
          var n = 0;
          around(k, function (j) { if (d.mine[j]) n++; });
          d.count[k] = n;
        }
        d.placed = true;
      }

      function reveal(g, i) {
        var d = g.data;
        if (d.open[i] || d.flag[i]) return;
        d.open[i] = true;
        if (d.count[i] === 0 && !d.mine[i]) around(i, function (n) { reveal(g, n); });
      }

      function click(g, i) {
        var d = g.data;
        if (d.done || g.state !== 'play') return;
        if (!d.placed) place(d, i);

        if (d.open[i]) { if (FLAGS) chord(g, i); return; }
        if (d.flag[i]) return;

        if (d.mine[i]) {
          d.done = true;
          d.open[i] = true;
          paint(g, i);
          Milo.sound.explode();
          g.gameOver({ emo: '💥', title: 'Boom', text: 'You hit a mine.', score: 0 });
          return;
        }
        reveal(g, i);
        Milo.sound.click();
        paint(g);
        checkWin(g);
      }

      /** Clicking an open number clears its neighbours once its flags match. */
      function chord(g, i) {
        var d = g.data;
        if (!d.count[i]) return;
        var flags = 0;
        around(i, function (n) { if (d.flag[n]) flags++; });
        if (flags !== d.count[i]) return;
        var boom = false;
        around(i, function (n) {
          if (d.flag[n] || d.open[n]) return;
          if (d.mine[n]) boom = true;
          reveal(g, n);
        });
        if (boom) {
          d.done = true;
          paint(g);
          Milo.sound.explode();
          g.gameOver({ emo: '💥', title: 'Boom', text: 'A flag was in the wrong place.', score: 0 });
          return;
        }
        paint(g);
        checkWin(g);
      }

      function toggleFlag(g, i) {
        var d = g.data;
        if (!FLAGS || d.done || d.open[i] || g.state !== 'play') return;
        d.flag[i] = !d.flag[i];
        d.left += d.flag[i] ? -1 : 1;
        g.set('Mines', d.left);
        Milo.sound.blip();
        paint(g);
      }

      function checkWin(g) {
        var d = g.data;
        for (var i = 0; i < COLS * ROWS; i++) {
          if (!d.mine[i] && !d.open[i]) return;
        }
        d.done = true;
        // Fastest clear in seconds, tracked separately — the engine's own
        // best slot is a points score, which is not a time.
        var t = Math.round(d.time);
        var prev = bestTime();
        if (!prev || t < prev) Milo.store.set('best:' + opt.id + '-time', t);
        g.set('Best', U.time(bestTime()));
        g.win({
          emo: '🚩', title: 'Field cleared!',
          text: 'All ' + MINES + ' mines swept in ' + U.time(t) + '.',
          score: Math.max(100, MINES * 150 - t * 5)
        });
      }

      function paint(g, blownAt) {
        var d = g.data;
        for (var i = 0; i < COLS * ROWS; i++) {
          var b = cellEls[i];
          if (d.open[i]) {
            if (d.mine[i]) {
              b.textContent = '💥';
              b.style.background = i === blownAt ? '#fb7185' : '#4a2038';
            } else {
              b.textContent = d.count[i] || '';
              b.style.background = '#171c40';
              b.style.color = NUM_COL[d.count[i]] || '#fff';
            }
            b.style.cursor = 'default';
          } else if (d.flag[i]) {
            b.textContent = '🚩';
            b.style.background = '#333a72';
          } else {
            b.textContent = d.done && d.mine[i] ? '💣' : '';
            b.style.background = d.done && d.mine[i] ? '#3a2050' : '#2b3167';
          }
        }
      }

      return Milo.domGame(host, {
        id: opt.id,
        stats: ['Mines', 'Time', 'Best'],
        bg: '#0f1330',
        emo: opt.emo,
        start: {
          title: opt.title,
          text: opt.startText,
          keys: FLAGS ? ['Click reveal', 'Right-click flag', 'Long-press flag'] : ['Click reveal']
        },
        init: reset,
        update: function (g, dt) {
          var d = g.data;
          if (d.done || !d.placed) return;
          d.time += dt;
          g.set('Time', U.time(d.time));
        },
        destroy: function () { if (hudRo) { hudRo.disconnect(); hudRo = null; } }
      });
    };
  }

  /* ==================================================================== */
  /* Registrations                                                        */
  /* ==================================================================== */

  window.Milo.register({
    id: 'sudoku-mini', title: 'Sudoku Mini', emo: '🐤', category: 'Puzzle',
    tagline: 'A gentle 6×6 with 2×3 boxes',
    description: 'Sudoku shrunk to a 6×6 grid: every row, column and 2×3 box holds the ' +
      'digits 1 to 6 exactly once. Each board is dug from a freshly solved grid and only ' +
      'while singles keep it solvable, so simple scanning always cracks it — no notes ' +
      'needed. Clashing digits glow red the moment you place them. A lovely first sudoku, ' +
      'or a two-minute warm-up before the big grids.',
    controls: ['Click a cell', '1–6', 'N for notes', 'Backspace'],
    colors: ['#0e7490', '#67e8f9'],
    tags: ['sudoku', 'logic', 'numbers', 'mini', 'relaxing'],
    mount: makeSudoku({
      id: 'sudoku-mini', title: 'Sudoku Mini', emo: '🐤',
      n: 6, bw: 3, bh: 2, dig: 20, singles: true, base: 3200, perSec: 6,
      startText: 'A friendly 6×6 grid: rows, columns and 2×3 boxes each take the digits ' +
        '1 to 6 once. Clues are removed only while easy deductions still finish the ' +
        'puzzle, so it never needs guessing.'
    })
  });

  window.Milo.register({
    id: 'sudoku-easy', title: 'Sudoku Easy', emo: '✏️', category: 'Puzzle',
    tagline: 'Full 9×9, solvable by singles alone',
    description: 'A full 9×9 sudoku that stays kind: around 37 clues remain, and the ' +
      'generator only removes a clue if naked and hidden singles still complete the grid, ' +
      'so there is always a cell you can fill with certainty. Conflicting entries highlight ' +
      'in red instantly, and matching digits light up as you select cells. If you stall, ' +
      'scan each 3×3 box for the digit that has only one home left.',
    controls: ['Click a cell', '1–9', 'N for notes', 'Backspace'],
    colors: ['#166534', '#4ade80'],
    tags: ['sudoku', 'logic', 'numbers', 'easy', 'classic'],
    mount: makeSudoku({
      id: 'sudoku-easy', title: 'Sudoku Easy', emo: '✏️',
      n: 9, bw: 3, bh: 3, dig: 44, singles: true, base: 4500, perSec: 6,
      startText: 'Every row, column and 3×3 box takes 1 to 9 exactly once. This board ' +
        'keeps plenty of clues and is guaranteed solvable with singles alone — there is ' +
        'always a forced cell somewhere.'
    })
  });

  window.Milo.register({
    id: 'sudoku-medium', title: 'Sudoku Medium', emo: '⚖️', category: 'Puzzle',
    tagline: 'Fewer clues, still no guessing',
    description: 'The everyday sudoku: clues are dug down toward the low thirties, but ' +
      'only while step-by-step singles still finish the grid, so patience beats luck every ' +
      'time. Expect longer scans and moments where only one box in the whole grid moves. ' +
      'Pencil marks (N) start earning their keep here — note the two candidates in a tight ' +
      'box and one of them will soon collapse.',
    controls: ['Click a cell', '1–9', 'N for notes', 'Backspace'],
    colors: ['#92400e', '#fbbf24'],
    tags: ['sudoku', 'logic', 'numbers', 'brain', 'classic'],
    mount: makeSudoku({
      id: 'sudoku-medium', title: 'Sudoku Medium', emo: '⚖️',
      n: 9, bw: 3, bh: 3, dig: 50, singles: true, base: 6000, perSec: 7,
      startText: 'Rows, columns and 3×3 boxes each take 1 to 9 once. Fewer clues than ' +
        'Easy, but the generator guarantees a chain of certain deductions runs all the ' +
        'way to the end — no guessing, ever.'
    })
  });

  window.Milo.register({
    id: 'sudoku-hard', title: 'Sudoku Hard', emo: '🔥', category: 'Puzzle',
    tagline: 'Around 28 clues — bring pencil marks',
    description: 'Clues drop to roughly 28 and the singles-only guarantee is gone: these ' +
      'grids are verified to have exactly one solution, but reaching it usually takes ' +
      'naked pairs, box-line eliminations and disciplined notes. Fill every candidate in ' +
      'a stuck region and look for the pair that pins two cells to two digits — the ' +
      'eliminations it causes usually break the logjam.',
    controls: ['Click a cell', '1–9', 'N for notes', 'Backspace'],
    colors: ['#7f1d1d', '#fb7185'],
    tags: ['sudoku', 'logic', 'numbers', 'hard', 'brain'],
    mount: makeSudoku({
      id: 'sudoku-hard', title: 'Sudoku Hard', emo: '🔥',
      n: 9, bw: 3, bh: 3, dig: 53, singles: false, base: 8000, perSec: 8,
      startText: 'A verified single-solution grid with clues cut to the bone. Singles ' +
        'will stall — switch to notes (N), hunt pairs and box-line eliminations, and ' +
        'chip away.'
    })
  });

  window.Milo.register({
    id: 'sudoku-expert', title: 'Sudoku Expert', emo: '💎', category: 'Puzzle',
    tagline: 'Dug to the uniqueness limit — about 24 clues',
    description: 'The deep end: the digger tries every cell and keeps removing until ' +
      'taking out anything more would allow a second solution, which lands most grids at ' +
      '23 to 25 clues. Every grid is still provably unique, so pure logic gets there — but ' +
      'expect long candidate lists, X-wing-shaped eliminations and stretches where one ' +
      'note removal is the whole move. Work one digit across all nine boxes before ' +
      'switching digits; it keeps the scan systematic.',
    controls: ['Click a cell', '1–9', 'N for notes', 'Backspace'],
    colors: ['#312e81', '#818cf8'],
    tags: ['sudoku', 'logic', 'numbers', 'expert', 'brain'],
    mount: makeSudoku({
      id: 'sudoku-expert', title: 'Sudoku Expert', emo: '💎',
      n: 9, bw: 3, bh: 3, dig: 64, singles: false, base: 10000, perSec: 8,
      startText: 'As few clues as the uniqueness checker allows — every removal is ' +
        'tested so exactly one solution survives. Slow, heavy logic. Notes are not ' +
        'optional here.'
    })
  });

  window.Milo.register({
    id: 'sudoku-x', title: 'Sudoku X', emo: '✖️', category: 'Puzzle',
    tagline: 'Both diagonals count too',
    description: 'Classic rules plus a twist: both main diagonals must also contain 1 to ' +
      '9 exactly once, and the generator builds and verifies every grid against that extra ' +
      'constraint. The gold diagonals are marked on the board, and duplicates along them ' +
      'flag red like any other clash. The crossing cells are the strongest on the grid — ' +
      'the centre cell sits in a row, column, box and both diagonals, so nail it early.',
    controls: ['Click a cell', '1–9', 'N for notes', 'Backspace'],
    colors: ['#581c87', '#e879f9'],
    tags: ['sudoku', 'logic', 'diagonal', 'variant', 'brain'],
    mount: makeSudoku({
      id: 'sudoku-x', title: 'Sudoku X', emo: '✖️',
      n: 9, bw: 3, bh: 3, diag: true, dig: 56, singles: false, base: 8500, perSec: 8,
      startText: 'Rows, columns, 3×3 boxes AND both gold diagonals each take 1 to 9 ' +
        'exactly once. The diagonal constraint is baked into generation, so the unique ' +
        'solution respects it too.'
    })
  });

  window.Milo.register({
    id: 'mines-beginner', title: 'Mines Beginner', emo: '🌱', category: 'Puzzle',
    tagline: 'A 9×9 field with just 10 mines',
    description: 'The classic starter field: 9×9 with 10 mines, so wide safe areas ' +
      'cascade open and every number has room to breathe. Your first click is always safe ' +
      '— mines are only laid after it, never beside it. Flag suspects with right-click, ' +
      'then click a satisfied number to chord its remaining neighbours open. A 1 touching ' +
      'a single unopened square is a free flag; start there.',
    controls: ['Click', 'Right-click flag', 'Long-press'],
    colors: ['#14532d', '#86efac'],
    tags: ['minesweeper', 'logic', 'mines', 'beginner'],
    mount: makeMines({
      id: 'mines-beginner', title: 'Mines Beginner', emo: '🌱',
      cols: 9, rows: 9, mines: 10,
      startText: 'A 9×9 field hiding 10 mines. Numbers count the mines in their eight ' +
        'neighbours. Your first click is always safe and opens some ground.'
    })
  });

  window.Milo.register({
    id: 'mines-intermediate', title: 'Mines Intermediate', emo: '🚩', category: 'Puzzle',
    tagline: '16×16, 40 mines — the honest middle',
    description: 'The standard intermediate board: 16×16 with 40 mines, dense enough ' +
      'that real deduction patterns appear — the 1-2-1 row, the shared-cell subtraction, ' +
      'the corner squeeze. First click is always safe, flags and chording are in, and your ' +
      'fastest clear is kept as a best time. When two numbers overlap, subtract: what the ' +
      'smaller one explains, the bigger one must place elsewhere.',
    controls: ['Click', 'Right-click flag', 'Long-press'],
    colors: ['#1e3a8a', '#60a5fa'],
    tags: ['minesweeper', 'logic', 'mines', 'classic'],
    mount: makeMines({
      id: 'mines-intermediate', title: 'Mines Intermediate', emo: '🚩',
      cols: 16, rows: 16, mines: 40,
      startText: '16×16, 40 mines. Numbers count adjacent mines; flag what you know, ' +
        'chord what you have proven. First click is always safe.'
    })
  });

  window.Milo.register({
    id: 'mines-expert', title: 'Mines Expert', emo: '💀', category: 'Puzzle',
    tagline: 'The full 30×16 with 99 mines',
    description: 'The board the record chasers play: 30 columns by 16 rows hiding 99 ' +
      'mines. It is a marathon of chained deductions where one misread ends twenty minutes ' +
      'of work — flag discipline and chording keep it survivable. On smaller screens the ' +
      'field keeps its cell size and scrolls sideways rather than shrinking into ' +
      'unreadability. Sweep border regions first; open edges give numbers fewer neighbours ' +
      'and cleaner logic.',
    controls: ['Click', 'Right-click flag', 'Long-press'],
    colors: ['#450a0a', '#f87171'],
    tags: ['minesweeper', 'logic', 'mines', 'expert', 'hard'],
    mount: makeMines({
      id: 'mines-expert', title: 'Mines Expert', emo: '💀',
      cols: 30, rows: 16, mines: 99,
      startText: 'The classic expert field: 30×16 with 99 mines. First click is safe; ' +
        'everything after that is on you. The board scrolls sideways if your screen is ' +
        'narrow.'
    })
  });

  window.Milo.register({
    id: 'mines-huge', title: 'Mines Huge', emo: '🗺️', category: 'Puzzle',
    tagline: 'A sprawling 24×24, 130-mine campaign',
    description: 'A giant square field: 24×24 with 130 mines. At close to 23% density it ' +
      'is a shade hotter than expert, and the sheer area turns each game into a campaign ' +
      'across provinces — clear one region, bank its certainty, and push the frontier outward. ' +
      'The first click is always safe and flags plus chording are essential over a board ' +
      'this size. Do not tour the map randomly; finish territories, or stray 50/50 borders ' +
      'will pile up.',
    controls: ['Click', 'Right-click flag', 'Long-press'],
    colors: ['#3b0764', '#c084fc'],
    tags: ['minesweeper', 'logic', 'mines', 'huge', 'marathon'],
    mount: makeMines({
      id: 'mines-huge', title: 'Mines Huge', emo: '🗺️',
      cols: 24, rows: 24, mines: 130,
      startText: 'A 24×24 giant with 130 mines. Work it region by region — the ' +
        'numbers you have already proven are the only ground you can trust.'
    })
  });

  window.Milo.register({
    id: 'mines-dense', title: 'Mines Dense', emo: '🧨', category: 'Puzzle',
    tagline: '12×12 at a brutal 25% density',
    description: 'A 12×12 field packed with 36 mines — one square in four is deadly, ' +
      'versus about one in five on expert. Cascades are rare and tiny, so nearly every ' +
      'square must be reasoned open by hand, and high numbers like 4s and 5s crowd the ' +
      'board. The safe opening around your first click is the biggest gift you will get; ' +
      'grow outward from it one proven square at a time and never click on a hunch.',
    controls: ['Click', 'Right-click flag', 'Long-press'],
    colors: ['#7c2d12', '#fb923c'],
    tags: ['minesweeper', 'logic', 'mines', 'dense', 'hard'],
    mount: makeMines({
      id: 'mines-dense', title: 'Mines Dense', emo: '🧨',
      cols: 12, rows: 12, mines: 36,
      startText: '144 squares, 36 mines — a quarter of the field is hot. Margins are ' +
        'thin and cascades are rare, so every reveal needs a reason.'
    })
  });

  window.Milo.register({
    id: 'mines-no-flags', title: 'Mines No-Flags', emo: '🧠', category: 'Puzzle',
    tagline: '16×16, 40 mines, zero flags allowed',
    description: 'The intermediate board with the training wheels removed: 16×16, 40 ' +
      'mines, and flagging is disabled entirely — right-click does nothing. You must hold ' +
      'the whole mine map in your head, which is exactly how speedrunners play, since ' +
      'skipping flags saves a click per mine. Chording is gone too (nothing to chord ' +
      'against), so every clear is a deliberate left-click. Memorise deduced mines in ' +
      'small clusters and clear around them immediately, before the picture fades.',
    controls: ['Click'],
    colors: ['#334155', '#e2e8f0'],
    tags: ['minesweeper', 'logic', 'mines', 'no-flags', 'memory'],
    mount: makeMines({
      id: 'mines-no-flags', title: 'Mines No-Flags', emo: '🧠',
      cols: 16, rows: 16, mines: 40, flags: false,
      startText: '16×16 with 40 mines and no flags — pure reading. Deduce where the ' +
        'mines are, remember, and click only what you have proven safe.'
    })
  });
})();
