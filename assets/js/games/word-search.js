/* Word Search — drag across the grid to find the hidden words. */
(function () {
  'use strict';
  var N = 12, W = 820, H = 620, CELL = 42;
  var GX = 24, GY = 60;
  var DIRS = [[1, 0], [0, 1], [1, 1], [1, -1], [-1, 0], [0, -1], [-1, -1], [-1, 1]];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util, WORDS = Milo.words;

    function reset(g) {
      var d = g.data;
      d.grid = [];
      for (var y = 0; y < N; y++) d.grid.push(new Array(N).fill(''));
      d.words = [];
      d.found = {};
      d.drag = null;
      d.time = 0;
      d.done = false;

      var pool = U.shuffle(WORDS.general.filter(function (w) {
        return w.length >= 4 && w.length <= 9;
      }).slice());
      for (var i = 0; i < pool.length && d.words.length < 9; i++) {
        if (tryPlace(d, pool[i])) d.words.push({ word: pool[i] });
      }
      var abc = 'abcdefghijklmnopqrstuvwxyz';
      for (var y2 = 0; y2 < N; y2++) {
        for (var x = 0; x < N; x++) {
          if (!d.grid[y2][x]) d.grid[y2][x] = abc[U.randInt(0, 25)];
        }
      }
      g.set('Found', '0/' + d.words.length);
      g.set('Time', '0:00');
      g.set('Best', g.best ? U.fmt(g.best) : '—');
    }

    function tryPlace(d, word) {
      for (var attempt = 0; attempt < 120; attempt++) {
        var dir = U.choice(DIRS);
        var x = U.randInt(0, N - 1), y = U.randInt(0, N - 1);
        var ex = x + dir[0] * (word.length - 1), ey = y + dir[1] * (word.length - 1);
        if (ex < 0 || ey < 0 || ex >= N || ey >= N) continue;
        var ok = true;
        for (var i = 0; i < word.length; i++) {
          var cx = x + dir[0] * i, cy = y + dir[1] * i;
          var have = d.grid[cy][cx];
          if (have && have !== word[i]) { ok = false; break; }
        }
        if (!ok) continue;
        for (var j = 0; j < word.length; j++) {
          d.grid[y + dir[1] * j][x + dir[0] * j] = word[j];
        }
        return true;
      }
      return false;
    }

    function cellAt(px, py) {
      var x = Math.floor((px - GX) / CELL), y = Math.floor((py - GY) / CELL);
      if (x < 0 || y < 0 || x >= N || y >= N) return null;
      return { x: x, y: y };
    }

    /** Cells on the straight line between two points, if one exists. */
    function lineCells(a, b) {
      var dx = b.x - a.x, dy = b.y - a.y;
      var steps = Math.max(Math.abs(dx), Math.abs(dy));
      if (steps === 0) return [a];
      if (dx !== 0 && dy !== 0 && Math.abs(dx) !== Math.abs(dy)) return null;
      var sx = Math.sign(dx), sy = Math.sign(dy);
      var out = [];
      for (var i = 0; i <= steps; i++) out.push({ x: a.x + sx * i, y: a.y + sy * i });
      return out;
    }

    function commit(g) {
      var d = g.data;
      if (!d.drag || !d.drag.cells) { d.drag = null; return; }
      var text = d.drag.cells.map(function (p) { return d.grid[p.y][p.x]; }).join('');
      var rev = text.split('').reverse().join('');
      var match = d.words.filter(function (w) {
        return !d.found[w.word] && (w.word === text || w.word === rev);
      })[0];
      if (match) {
        d.found[match.word] = d.drag.cells;
        Milo.sound.coin();
        var n = Object.keys(d.found).length;
        g.set('Found', n + '/' + d.words.length);
        if (n === d.words.length) {
          d.done = true;
          g.win({
            emo: '🔍', title: 'All found!',
            text: 'Cleared in ' + U.time(d.time) + '.',
            score: Math.max(100, 3000 - Math.round(d.time) * 12)
          });
        }
      } else {
        Milo.sound.tone({ f: 160, d: .08, v: .05, type: 'square' });
      }
      d.drag = null;
    }

    return Milo.arcade(host, {
      id: 'word-search',
      w: W, h: H, bg: '#12163a',
      stats: ['Found', 'Time', 'Best'],
      emo: '🔍',
      start: {
        title: 'Word Search',
        text: 'Nine words are hidden in the grid — across, down, diagonally, and some of ' +
          'them backwards. Drag from the first letter to the last to claim one.',
        keys: ['Drag across the letters']
      },
      init: reset,

      onPointer: function (g, type, px, py) {
        var d = g.data;
        if (d.done) return;
        if (type === 'down') {
          var a = cellAt(px, py);
          if (a) d.drag = { a: a, cells: [a] };
        } else if (type === 'move' && d.drag) {
          var b = cellAt(px, py);
          if (b) {
            var cells = lineCells(d.drag.a, b);
            if (cells) d.drag.cells = cells;
          }
        } else if (type === 'up') {
          commit(g);
        }
      },

      update: function (g, dt) {
        var d = g.data;
        if (d.done) return;
        d.time += dt;
        g.set('Time', U.time(d.time));
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.fillStyle = '#12163a'; c.fillRect(0, 0, W, H);

        // highlight found words
        Object.keys(d.found).forEach(function (w, i) {
          c.fillStyle = 'hsla(' + (i * 47) + ',75%,55%,.30)';
          d.found[w].forEach(function (p) {
            c.fillRect(GX + p.x * CELL, GY + p.y * CELL, CELL, CELL);
          });
        });
        if (d.drag && d.drag.cells) {
          c.fillStyle = 'rgba(255,210,87,.30)';
          d.drag.cells.forEach(function (p) {
            c.fillRect(GX + p.x * CELL, GY + p.y * CELL, CELL, CELL);
          });
        }

        c.strokeStyle = 'rgba(255,255,255,.07)';
        c.lineWidth = 1;
        for (var i = 0; i <= N; i++) {
          c.beginPath();
          c.moveTo(GX + i * CELL, GY); c.lineTo(GX + i * CELL, GY + N * CELL);
          c.moveTo(GX, GY + i * CELL); c.lineTo(GX + N * CELL, GY + i * CELL);
          c.stroke();
        }

        c.font = '700 20px Outfit, sans-serif';
        c.textAlign = 'center';
        for (var y = 0; y < N; y++) {
          for (var x = 0; x < N; x++) {
            c.fillStyle = '#dfe5ff';
            c.fillText(d.grid[y][x].toUpperCase(), GX + x * CELL + CELL / 2, GY + y * CELL + CELL / 2 + 7);
          }
        }

        var lx = GX + N * CELL + 26;
        c.fillStyle = 'rgba(255,255,255,.55)';
        c.font = '700 12px Outfit, sans-serif';
        c.textAlign = 'left';
        c.fillText('FIND THESE', lx, GY + 4);
        d.words.forEach(function (w, i) {
          var got = !!d.found[w.word];
          c.fillStyle = got ? '#34d399' : '#c9d0f0';
          c.font = (got ? '600 ' : '700 ') + '16px Outfit, sans-serif';
          c.fillText(w.word.toUpperCase(), lx, GY + 34 + i * 28);
          if (got) {
            c.strokeStyle = '#34d399'; c.lineWidth = 2;
            c.beginPath();
            c.moveTo(lx - 2, GY + 29 + i * 28);
            c.lineTo(lx + c.measureText(w.word.toUpperCase()).width + 2, GY + 29 + i * 28);
            c.stroke();
          }
        });
      }
    });
  }

  window.Milo.register({
    id: 'word-search', title: 'Word Search', emo: '🔍', category: 'Word',
    tagline: 'Nine words hidden in the letters',
    description: 'A 12×12 grid with nine words buried in it — horizontally, vertically or ' +
      'diagonally, and plenty of them written backwards. Drag from the first letter of a ' +
      'word to its last to claim it. A fresh grid every time, and faster clears score higher.',
    controls: ['Drag across letters'],
    colors: ['#12163a', '#34d399'],
    tags: ['word', 'searching', 'relaxing', 'puzzle'],
    mount: mount
  });
})();
