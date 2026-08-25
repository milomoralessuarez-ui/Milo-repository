/* Sudoku — generated grids at four difficulties, with notes and checking. */
(function () {
  'use strict';
  var W = 700, H = 700, CELL = 62, PAD = (W - 9 * CELL) / 2, TOP = 40;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    var LEVELS = { Easy: 40, Medium: 48, Hard: 54, Expert: 58 };

    function reset(g) {
      var d = g.data;
      d.level = d.level || 'Medium';
      var full = generate();
      d.solution = full.slice();
      d.given = full.slice();
      dig(d.given, LEVELS[d.level]);
      d.cells = d.given.slice();
      d.notes = [];
      for (var i = 0; i < 81; i++) d.notes.push({});
      d.sel = null;
      d.noteMode = false;
      d.time = 0;
      d.mistakes = 0;
      d.done = false;
      g.set('Level', d.level);
      g.set('Time', '0:00');
      g.set('Mistakes', 0);
    }

    /** Fill a grid by randomised backtracking — always a valid solution. */
    function generate() {
      var b = new Int8Array(81);
      solve(b, true);
      return b;
    }

    function solve(b, randomise, countOnly) {
      var idx = -1;
      for (var i = 0; i < 81; i++) if (!b[i]) { idx = i; break; }
      if (idx === -1) return 1;
      var nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      if (randomise) U.shuffle(nums);
      var found = 0;
      for (var k = 0; k < 9; k++) {
        var v = nums[k];
        if (!allowed(b, idx, v)) continue;
        b[idx] = v;
        var r = solve(b, randomise, countOnly);
        if (r) {
          if (!countOnly) return 1;
          found += r;
          if (found > 1) { b[idx] = 0; return found; }
        }
        b[idx] = 0;
      }
      return found;
    }

    function allowed(b, idx, v) {
      var x = idx % 9, y = (idx / 9) | 0;
      for (var i = 0; i < 9; i++) {
        if (b[y * 9 + i] === v) return false;
        if (b[i * 9 + x] === v) return false;
      }
      var bx = (x / 3 | 0) * 3, by = (y / 3 | 0) * 3;
      for (var j = 0; j < 3; j++) {
        for (var k = 0; k < 3; k++) if (b[(by + j) * 9 + bx + k] === v) return false;
      }
      return true;
    }

    /** Remove clues while the puzzle still has exactly one solution. */
    function dig(b, target) {
      var order = U.shuffle(Array.from({ length: 81 }, function (_, i) { return i; }));
      var removed = 0;
      for (var n = 0; n < order.length && removed < target; n++) {
        var i = order[n];
        if (!b[i]) continue;
        var keep = b[i];
        b[i] = 0;
        var copy = b.slice();
        if (solve(copy, false, true) !== 1) b[i] = keep;
        else removed++;
      }
    }

    function place(g, v) {
      var d = g.data;
      if (d.sel == null || d.done) return;
      var i = d.sel;
      if (d.given[i]) return;
      if (d.noteMode && v) {
        d.notes[i][v] = !d.notes[i][v];
        Milo.sound.blip();
        return;
      }
      if (v === 0) { d.cells[i] = 0; d.notes[i] = {}; return; }
      d.cells[i] = v;
      d.notes[i] = {};
      if (v !== d.solution[i]) {
        d.mistakes++;
        g.set('Mistakes', d.mistakes);
        Milo.sound.tone({ f: 160, d: .12, v: .06, type: 'square' });
      } else {
        Milo.sound.blip();
      }
      if (d.cells.every(function (c, k) { return c === d.solution[k]; })) {
        d.done = true;
        var score = Math.max(200, 6000 - Math.round(d.time) * 8 - d.mistakes * 250);
        g.win({
          emo: '🔢', title: 'Solved!',
          text: U.time(d.time) + ' with ' + d.mistakes + ' mistake' + (d.mistakes === 1 ? '' : 's') + '.',
          score: score
        });
      }
    }

    function levelButton(i) { return { x: 12 + i * 84, y: 6, w: 78, h: 26 }; }

    return Milo.arcade(host, {
      id: 'sudoku',
      w: W, h: H, bg: '#0f1330',
      stats: ['Level', 'Time', 'Mistakes'],
      emo: '🔢',
      start: {
        title: 'Sudoku',
        text: 'Every row, column and 3×3 box holds the digits 1 to 9 exactly once. Grids ' +
          'are generated fresh and dug out only while a single solution remains, so every ' +
          'puzzle is solvable by logic alone.',
        keys: ['Click a cell', '1–9 to enter', 'N for notes', 'Backspace to clear']
      },
      preload: function (g) { g.data.level = 'Medium'; },
      init: reset,

      onKey: function (g, e) {
        var d = g.data;
        var m = /^Digit([1-9])$/.exec(e.code) || /^Numpad([1-9])$/.exec(e.code);
        if (m) { place(g, +m[1]); return; }
        if (e.code === 'Backspace' || e.code === 'Delete') { place(g, 0); return; }
        if (e.code === 'KeyN') { d.noteMode = !d.noteMode; return; }
        if (d.sel != null) {
          var x = d.sel % 9, y = (d.sel / 9) | 0;
          if (e.code === 'ArrowLeft') d.sel = y * 9 + Math.max(0, x - 1);
          if (e.code === 'ArrowRight') d.sel = y * 9 + Math.min(8, x + 1);
          if (e.code === 'ArrowUp') d.sel = Math.max(0, y - 1) * 9 + x;
          if (e.code === 'ArrowDown') d.sel = Math.min(8, y + 1) * 9 + x;
        }
      },

      onPointer: function (g, type, px, py) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data;

        var names = Object.keys(LEVELS);
        for (var i = 0; i < names.length; i++) {
          var b = levelButton(i);
          if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) {
            d.level = names[i];
            g.restart();
            return;
          }
        }
        if (py > TOP + 9 * CELL + 8) {
          // number pad along the bottom
          for (var n = 0; n < 10; n++) {
            var bx = PAD + n * 55;
            if (px >= bx && px <= bx + 50 && py >= TOP + 9 * CELL + 14 && py <= TOP + 9 * CELL + 64) {
              place(g, n === 9 ? 0 : n + 1);
              return;
            }
          }
          if (px > W - 130 && py > TOP + 9 * CELL + 14) d.noteMode = !d.noteMode;
          return;
        }
        var x = Math.floor((px - PAD) / CELL), y = Math.floor((py - TOP) / CELL);
        if (x < 0 || y < 0 || x >= 9 || y >= 9) return;
        d.sel = y * 9 + x;
      },

      update: function (g, dt) {
        var d = g.data;
        if (d.done) return;
        d.time += dt;
        g.set('Time', U.time(d.time));
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.fillStyle = '#0f1330'; c.fillRect(0, 0, W, H);

        Object.keys(LEVELS).forEach(function (name, i) {
          var b = levelButton(i);
          c.fillStyle = d.level === name ? '#7c5cff' : 'rgba(255,255,255,.08)';
          U.roundRect(c, b.x, b.y, b.w, b.h, 7); c.fill();
          c.fillStyle = '#fff';
          c.font = '700 12px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(name, b.x + b.w / 2, b.y + 18);
        });

        var selVal = d.sel != null ? d.cells[d.sel] : 0;
        for (var i = 0; i < 81; i++) {
          var x = i % 9, y = (i / 9) | 0;
          var px = PAD + x * CELL, py = TOP + y * CELL;
          var sameUnit = d.sel != null &&
            (x === d.sel % 9 || y === ((d.sel / 9) | 0) ||
              ((x / 3 | 0) === ((d.sel % 9) / 3 | 0) && (y / 3 | 0) === (((d.sel / 9 | 0)) / 3 | 0)));
          c.fillStyle = i === d.sel ? 'rgba(124,92,255,.42)'
            : sameUnit ? 'rgba(124,92,255,.12)'
              : ((x / 3 | 0) + (y / 3 | 0)) % 2 ? 'rgba(255,255,255,.045)' : 'rgba(255,255,255,.02)';
          c.fillRect(px, py, CELL, CELL);

          var v = d.cells[i];
          if (v) {
            var wrong = v !== d.solution[i];
            c.fillStyle = d.given[i] ? '#e8ecff' : wrong ? '#fb7185' : '#22d3ee';
            c.font = (d.given[i] ? '800 ' : '600 ') + '30px Outfit, sans-serif';
            c.textAlign = 'center';
            if (selVal && v === selVal && i !== d.sel) {
              c.fillStyle = wrong ? '#fb7185' : '#ffd257';
            }
            c.fillText(v, px + CELL / 2, py + CELL / 2 + 11);
          } else {
            c.fillStyle = 'rgba(255,255,255,.4)';
            c.font = '600 11px Outfit, sans-serif';
            c.textAlign = 'center';
            for (var n = 1; n <= 9; n++) {
              if (!d.notes[i][n]) continue;
              var nx = px + 12 + ((n - 1) % 3) * 19;
              var ny = py + 20 + (((n - 1) / 3) | 0) * 18;
              c.fillText(n, nx, ny);
            }
          }
        }

        c.strokeStyle = 'rgba(255,255,255,.5)';
        for (var k = 0; k <= 9; k++) {
          c.lineWidth = k % 3 === 0 ? 2.6 : 1;
          c.strokeStyle = k % 3 === 0 ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.14)';
          c.beginPath();
          c.moveTo(PAD + k * CELL, TOP); c.lineTo(PAD + k * CELL, TOP + 9 * CELL);
          c.moveTo(PAD, TOP + k * CELL); c.lineTo(PAD + 9 * CELL, TOP + k * CELL);
          c.stroke();
        }

        for (var n2 = 0; n2 < 10; n2++) {
          var bx = PAD + n2 * 55;
          c.fillStyle = 'rgba(255,255,255,.10)';
          U.roundRect(c, bx, TOP + 9 * CELL + 14, 50, 50, 9); c.fill();
          c.fillStyle = '#dfe5ff';
          c.font = '700 22px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(n2 === 9 ? '⌫' : String(n2 + 1), bx + 25, TOP + 9 * CELL + 46);
        }
        c.fillStyle = d.noteMode ? '#7c5cff' : 'rgba(255,255,255,.10)';
        U.roundRect(c, W - 124, TOP + 9 * CELL + 14, 100, 50, 9); c.fill();
        c.fillStyle = '#fff';
        c.font = '700 13px Outfit, sans-serif';
        c.fillText('Notes (N)', W - 74, TOP + 9 * CELL + 44);
      }
    });
  }

  window.Milo.register({
    id: 'sudoku', title: 'Sudoku', emo: '🔢', category: 'Puzzle',
    tagline: 'Four difficulties, always solvable',
    description: 'Fill the grid so every row, column and 3×3 box contains 1 to 9 exactly ' +
      'once. Puzzles are generated from scratch and clues are only removed while exactly one ' +
      'solution remains, so nothing ever needs guessing. Press N for pencil notes; matching ' +
      'digits highlight across the grid as you work.',
    controls: ['Click a cell', '1–9', 'N for notes', 'Backspace'],
    colors: ['#0f1330', '#7c5cff'],
    featured: true,
    tags: ['logic', 'numbers', 'brain', 'classic'],
    mount: mount
  });
})();
