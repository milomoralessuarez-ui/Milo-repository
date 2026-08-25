/* Nonogram — fill the grid from the number clues. */
(function () {
  'use strict';
  var W = 640, H = 640;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.level = d.level || 1;
      d.n = Math.min(10, 5 + Math.floor(d.level / 2));
      var n = d.n;
      d.sol = [];
      for (var y = 0; y < n; y++) {
        var row = [];
        for (var x = 0; x < n; x++) row.push(Math.random() < 0.55 ? 1 : 0);
        d.sol.push(row);
      }
      // A completely empty line makes for a dull clue; nudge one cell in.
      for (var r = 0; r < n; r++) {
        if (d.sol[r].every(function (v) { return !v; })) d.sol[r][U.randInt(0, n - 1)] = 1;
      }
      d.cells = [];
      for (var y2 = 0; y2 < n; y2++) d.cells.push(new Array(n).fill(0));  // 0 blank 1 filled 2 marked
      d.rowClues = d.sol.map(cluesFor);
      d.colClues = [];
      for (var x2 = 0; x2 < n; x2++) {
        d.colClues.push(cluesFor(d.sol.map(function (rw) { return rw[x2]; })));
      }
      d.pad = Math.max(60, 26 * Math.max.apply(null, d.rowClues.map(function (c2) { return c2.length; })) + 20);
      d.cell = Math.floor(Math.min((W - d.pad - 20) / n, (H - d.pad - 20) / n));
      d.mistakes = 0;
      d.time = 0;
      d.done = false;
      g.set('Level', d.level);
      g.set('Size', n + '×' + n);
      g.set('Time', '0:00');
    }

    function cluesFor(line) {
      var out = [], run = 0;
      line.forEach(function (v) {
        if (v) run++;
        else { if (run) out.push(run); run = 0; }
      });
      if (run) out.push(run);
      return out.length ? out : [0];
    }

    function check(g) {
      var d = g.data;
      for (var y = 0; y < d.n; y++) {
        for (var x = 0; x < d.n; x++) {
          var filled = d.cells[y][x] === 1 ? 1 : 0;
          if (filled !== d.sol[y][x]) return;
        }
      }
      d.done = true;
      var earned = Math.max(100, 900 - Math.round(d.time) * 5 - d.mistakes * 60) * d.level;
      g.score += earned;
      Milo.sound.win();
      d.level++;
      g.overlay({
        emo: '🖼️', title: 'Picture complete!',
        text: U.time(d.time) + ' with ' + d.mistakes + ' mistake' + (d.mistakes === 1 ? '' : 's') + '.',
        score: g.score,
        best: g.best,
        newBest: Milo.store.setBest('nonogram', g.score),
        actions: [
          { label: 'Next puzzle →', primary: true, onClick: function () { next(g); } },
          { label: 'Start over', onClick: function () { g.data.level = 1; g.restart(); } }
        ]
      });
    }

    function next(g) {
      g.clearOverlay();
      var keepScore = g.score, keepLevel = g.data.level;
      reset(g);
      g.data.level = keepLevel;
      g.score = keepScore;
      g.state = 'play';
      g.set('Level', keepLevel);
      g.best = Milo.store.best('nonogram');
    }

    return Milo.arcade(host, {
      id: 'nonogram',
      w: W, h: H, bg: '#101433',
      stats: ['Level', 'Size', 'Time'],
      noContextMenu: true,
      emo: '🖼️',
      start: {
        title: 'Nonogram',
        text: 'The numbers say how many squares are filled in each row and column, in ' +
          'order, with a gap between each run. Left-click to fill, right-click to mark a ' +
          'square you know is empty.',
        keys: ['Left click to fill', 'Right click to mark']
      },
      preload: function (g) { g.data.level = 1; },
      init: reset,

      onPointer: function (g, type, px, py, e) {
        if (type !== 'down' || g.state !== 'play' || g.data.done) return;
        var d = g.data;
        var x = Math.floor((px - d.pad) / d.cell), y = Math.floor((py - d.pad) / d.cell);
        if (x < 0 || y < 0 || x >= d.n || y >= d.n) return;
        var right = e && e.button === 2;
        if (right) {
          d.cells[y][x] = d.cells[y][x] === 2 ? 0 : 2;
          Milo.sound.click();
          return;
        }
        var was = d.cells[y][x];
        d.cells[y][x] = was === 1 ? 0 : 1;
        if (d.cells[y][x] === 1 && !d.sol[y][x]) {
          d.mistakes++;
          Milo.sound.tone({ f: 160, d: .1, v: .05, type: 'square' });
        } else {
          Milo.sound.blip();
        }
        check(g);
      },

      update: function (g, dt) {
        var d = g.data;
        if (!d.done) { d.time += dt; g.set('Time', U.time(d.time)); }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, s = d.cell, p = d.pad;
        c.fillStyle = '#101433'; c.fillRect(0, 0, W, H);

        c.font = '700 13px Outfit, sans-serif';
        for (var y = 0; y < d.n; y++) {
          c.textAlign = 'right';
          c.fillStyle = '#c9d0f0';
          c.fillText(d.rowClues[y].join(' '), p - 8, p + y * s + s / 2 + 5);
        }
        for (var x = 0; x < d.n; x++) {
          c.textAlign = 'center';
          c.fillStyle = '#c9d0f0';
          d.colClues[x].forEach(function (v, i) {
            var off = (d.colClues[x].length - i) * 18;
            c.fillText(String(v), p + x * s + s / 2, p - off + 12);
          });
        }

        for (var y2 = 0; y2 < d.n; y2++) {
          for (var x2 = 0; x2 < d.n; x2++) {
            var v = d.cells[y2][x2];
            var px = p + x2 * s, py = p + y2 * s;
            c.fillStyle = v === 1 ? '#22d3ee' : 'rgba(255,255,255,.05)';
            c.fillRect(px + 1, py + 1, s - 2, s - 2);
            if (v === 2) {
              c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2;
              c.beginPath();
              c.moveTo(px + s * .3, py + s * .3); c.lineTo(px + s * .7, py + s * .7);
              c.moveTo(px + s * .7, py + s * .3); c.lineTo(px + s * .3, py + s * .7);
              c.stroke();
            }
          }
        }

        for (var k = 0; k <= d.n; k++) {
          c.strokeStyle = k % 5 === 0 ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.12)';
          c.lineWidth = k % 5 === 0 ? 2.4 : 1;
          c.beginPath();
          c.moveTo(p + k * s, p); c.lineTo(p + k * s, p + d.n * s);
          c.moveTo(p, p + k * s); c.lineTo(p + d.n * s, p + k * s);
          c.stroke();
        }
      }
    });
  }

  window.Milo.register({
    id: 'nonogram', title: 'Nonogram', emo: '🖼️', category: 'Puzzle',
    tagline: 'Fill the grid from the number clues',
    description: 'Also called Picross. The numbers beside each row and above each column ' +
      'tell you the lengths of the filled runs, in order, with at least one gap between ' +
      'them. Left-click to fill a square, right-click to mark one you have ruled out. Grids ' +
      'grow from 5×5 up to 10×10 as you clear them.',
    controls: ['Left click fill', 'Right click mark'],
    colors: ['#101433', '#22d3ee'],
    tags: ['logic', 'picross', 'brain', 'levels'],
    mount: mount
  });
})();
