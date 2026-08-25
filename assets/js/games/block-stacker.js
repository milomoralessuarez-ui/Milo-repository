/* Block Stacker — falling-tetromino puzzler with hold, ghost and hard drop. */
(function () {
  'use strict';
  var COLS = 10, ROWS = 20, CELL = 28;
  var W = COLS * CELL + 200, H = ROWS * CELL + 20;
  var BX = 14, BY = 10;

  var SHAPES = {
    I: { cells: [[0, 1], [1, 1], [2, 1], [3, 1]], w: 4, col: '#22d3ee' },
    O: { cells: [[1, 0], [2, 0], [1, 1], [2, 1]], w: 4, col: '#ffd257' },
    T: { cells: [[1, 0], [0, 1], [1, 1], [2, 1]], w: 3, col: '#a78bfa' },
    S: { cells: [[1, 0], [2, 0], [0, 1], [1, 1]], w: 3, col: '#34d399' },
    Z: { cells: [[0, 0], [1, 0], [1, 1], [2, 1]], w: 3, col: '#fb7185' },
    J: { cells: [[0, 0], [0, 1], [1, 1], [2, 1]], w: 3, col: '#60a5fa' },
    L: { cells: [[2, 0], [0, 1], [1, 1], [2, 1]], w: 3, col: '#fb923c' }
  };
  var KEYS = Object.keys(SHAPES);

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.grid = [];
      for (var y = 0; y < ROWS; y++) d.grid.push(new Array(COLS).fill(null));
      d.bag = [];
      d.next = takeFromBag(d);
      d.hold = null;
      d.canHold = true;
      d.lines = 0;
      d.level = 1;
      d.fall = 0;
      d.flash = [];
      d.dead = false;
      spawn(d);
      g.set('Score', 0);
      g.set('Lines', 0);
      g.set('Level', 1);
    }

    // 7-bag randomiser: every shape appears once before any repeats.
    function takeFromBag(d) {
      if (!d.bag.length) d.bag = U.shuffle(KEYS.slice());
      return d.bag.pop();
    }

    function spawn(d, key) {
      var k = key || d.next;
      if (!key) d.next = takeFromBag(d);
      var s = SHAPES[k];
      d.piece = {
        key: k,
        cells: s.cells.map(function (c) { return [c[0], c[1]]; }),
        size: s.w,
        x: Math.floor((COLS - s.w) / 2),
        y: -1,
        col: s.col
      };
      if (hits(d, d.piece, 0, 0)) d.dead = true;
    }

    function hits(d, p, dx, dy, cells) {
      var cs = cells || p.cells;
      for (var i = 0; i < cs.length; i++) {
        var x = p.x + cs[i][0] + dx, y = p.y + cs[i][1] + dy;
        if (x < 0 || x >= COLS || y >= ROWS) return true;
        if (y >= 0 && d.grid[y][x]) return true;
      }
      return false;
    }

    function rotate(d, dir) {
      var p = d.piece;
      if (p.key === 'O') return;
      var n = p.size - 1;
      var next = p.cells.map(function (c) {
        return dir > 0 ? [n - c[1], c[0]] : [c[1], n - c[0]];
      });
      // Wall kicks: try in place, then nudged one or two columns.
      var kicks = [0, -1, 1, -2, 2];
      for (var i = 0; i < kicks.length; i++) {
        if (!hits(d, p, kicks[i], 0, next)) {
          p.cells = next;
          p.x += kicks[i];
          Milo.sound.click();
          return;
        }
      }
    }

    function lock(g) {
      var d = g.data, p = d.piece;
      p.cells.forEach(function (c) {
        var y = p.y + c[1], x = p.x + c[0];
        if (y >= 0) d.grid[y][x] = p.col;
      });
      Milo.sound.tone({ f: 200, f2: 140, d: .08, v: .07, type: 'square' });

      var cleared = [];
      for (var y2 = ROWS - 1; y2 >= 0; y2--) {
        if (d.grid[y2].every(function (v) { return v; })) cleared.push(y2);
      }
      if (cleared.length) {
        cleared.forEach(function (y3) { d.grid.splice(y3, 1); d.grid.unshift(new Array(COLS).fill(null)); });
        d.lines += cleared.length;
        var table = [0, 100, 300, 500, 800];
        g.score += table[cleared.length] * d.level;
        d.level = 1 + Math.floor(d.lines / 10);
        d.flash.push({ t: .3, n: cleared.length });
        if (cleared.length === 4) Milo.sound.win(); else Milo.sound.powerup();
        g.set('Score', U.fmt(g.score));
        g.set('Lines', d.lines);
        g.set('Level', d.level);
      }
      d.canHold = true;
      spawn(d);
      if (d.dead) {
        g.gameOver({ text: 'You cleared ' + d.lines + ' line' + (d.lines === 1 ? '' : 's') + ' at level ' + d.level + '.' });
      }
    }

    function drop(g) {
      var d = g.data, n = 0;
      while (!hits(d, d.piece, 0, 1)) { d.piece.y++; n++; }
      g.score += n * 2;
      g.set('Score', U.fmt(g.score));
      Milo.sound.hit();
      lock(g);
    }

    function hold(g) {
      var d = g.data;
      if (!d.canHold) return;
      var prev = d.hold;
      d.hold = d.piece.key;
      d.canHold = false;
      if (prev) spawn(d, prev); else spawn(d);
      Milo.sound.blip();
    }

    return Milo.arcade(host, {
      id: 'block-stacker',
      w: W, h: H, bg: '#080b1c',
      stats: ['Score', 'Lines', 'Level'],
      touch: 'dpad',
      touchButtons: [{ key: 'b', label: 'ROT' }, { key: 'action', label: 'DROP' }],
      emo: '🟦',
      start: {
        title: 'Block Stacker',
        text: 'Fit the falling shapes together and clear full rows. Four rows at ' +
          'once is worth eight times a single.',
        keys: ['← → move', '↑ / X rotate', '↓ soft drop', 'Space hard drop', 'C hold']
      },
      init: reset,
      onKey: function (g, e) {
        var d = g.data;
        if (e.code === 'ArrowUp' || e.code === 'KeyX') rotate(d, 1);
        if (e.code === 'KeyZ' || e.code === 'ControlLeft') rotate(d, -1);
        if (e.code === 'Space') drop(g);
        if (e.code === 'KeyC' || e.code === 'ShiftLeft') hold(g);
        if (e.code === 'ArrowLeft' && !hits(d, d.piece, -1, 0)) d.piece.x--;
        if (e.code === 'ArrowRight' && !hits(d, d.piece, 1, 0)) d.piece.x++;
      },

      update: function (g, dt) {
        var d = g.data, i = g.input;
        if (d.dead) return;

        // Touch controls map onto the same actions as the keys.
        if (i.pressed('b')) rotate(d, 1);
        if (i.pressed('action')) drop(g);
        if (i.pressed('left') && !hits(d, d.piece, -1, 0)) d.piece.x--;
        if (i.pressed('right') && !hits(d, d.piece, 1, 0)) d.piece.x++;

        // Auto-repeat while a direction is held.
        d.rep = (d.rep || 0) - dt;
        if ((i.down('left') || i.down('right')) && d.rep <= 0) {
          var dx = i.down('left') ? -1 : 1;
          if (!hits(d, d.piece, dx, 0)) d.piece.x += dx;
          d.rep = 0.07;
        }
        if (!i.down('left') && !i.down('right')) d.rep = 0.16;

        var speed = Math.max(0.055, 0.62 - (d.level - 1) * 0.055);
        if (i.down('down')) speed = 0.035;

        d.fall += dt;
        if (d.fall >= speed) {
          d.fall = 0;
          if (!hits(d, d.piece, 0, 1)) {
            d.piece.y++;
            if (i.down('down')) { g.score++; g.set('Score', U.fmt(g.score)); }
          } else lock(g);
        }

        d.flash = d.flash.filter(function (f) { f.t -= dt; return f.t > 0; });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.fillStyle = '#080b1c'; c.fillRect(0, 0, W, H);

        // well
        c.fillStyle = '#0d1128';
        U.roundRect(c, BX - 4, BY - 4, COLS * CELL + 8, ROWS * CELL + 8, 8); c.fill();
        c.strokeStyle = 'rgba(124,92,255,.30)'; c.lineWidth = 1;
        c.beginPath();
        for (var x = 0; x <= COLS; x++) { c.moveTo(BX + x * CELL, BY); c.lineTo(BX + x * CELL, BY + ROWS * CELL); }
        for (var y = 0; y <= ROWS; y++) { c.moveTo(BX, BY + y * CELL); c.lineTo(BX + COLS * CELL, BY + y * CELL); }
        c.stroke();

        function cube(px, py, col, alpha) {
          c.globalAlpha = alpha == null ? 1 : alpha;
          c.fillStyle = col;
          U.roundRect(c, px + 1.5, py + 1.5, CELL - 3, CELL - 3, 4); c.fill();
          c.fillStyle = 'rgba(255,255,255,.26)';
          U.roundRect(c, px + 4, py + 4, CELL - 8, 5, 2); c.fill();
          c.globalAlpha = 1;
        }

        for (var gy = 0; gy < ROWS; gy++) {
          for (var gx = 0; gx < COLS; gx++) {
            if (d.grid[gy][gx]) cube(BX + gx * CELL, BY + gy * CELL, d.grid[gy][gx]);
          }
        }

        var p = d.piece;
        if (p) {
          // ghost
          var gy2 = 0;
          while (!hits(d, p, 0, gy2 + 1)) gy2++;
          p.cells.forEach(function (cc) {
            var yy = p.y + cc[1] + gy2;
            if (yy >= 0) cube(BX + (p.x + cc[0]) * CELL, BY + yy * CELL, p.col, .18);
          });
          p.cells.forEach(function (cc) {
            var yy = p.y + cc[1];
            if (yy >= 0) cube(BX + (p.x + cc[0]) * CELL, BY + yy * CELL, p.col);
          });
        }

        // side panel
        var PX = BX + COLS * CELL + 20;
        c.fillStyle = '#a8b0d8';
        c.font = '700 11px Outfit, sans-serif';
        c.textAlign = 'left';
        c.fillText('NEXT', PX, BY + 16);
        miniPiece(c, d.next, PX, BY + 26);
        c.fillStyle = '#a8b0d8';
        c.fillText('HOLD', PX, BY + 130);
        if (d.hold) miniPiece(c, d.hold, PX, BY + 140, !d.canHold);
        else {
          c.fillStyle = 'rgba(255,255,255,.14)';
          U.roundRect(c, PX, BY + 140, 92, 68, 8); c.fill();
        }

        c.fillStyle = '#737bab';
        c.font = '600 10px Outfit, sans-serif';
        var help = ['← → move', '↑ rotate', '↓ soft drop', 'Space drop', 'C hold'];
        help.forEach(function (t, i2) { c.fillText(t, PX, BY + 250 + i2 * 16); });

        d.flash.forEach(function (f) {
          c.globalAlpha = f.t / .3;
          c.fillStyle = f.n === 4 ? '#ffd257' : '#22d3ee';
          c.font = '800 26px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(f.n === 4 ? 'QUAD!' : f.n + ' LINE' + (f.n > 1 ? 'S' : ''), BX + COLS * CELL / 2, H / 2);
          c.globalAlpha = 1;
        });
      }
    });

    function miniPiece(c, key, px, py, dim) {
      var U2 = window.Milo.util;
      c.fillStyle = 'rgba(255,255,255,.06)';
      U2.roundRect(c, px, py, 92, 68, 8); c.fill();
      if (!key) return;
      var s = SHAPES[key], m = 16;
      var minX = Math.min.apply(null, s.cells.map(function (q) { return q[0]; }));
      var maxX = Math.max.apply(null, s.cells.map(function (q) { return q[0]; }));
      var minY = Math.min.apply(null, s.cells.map(function (q) { return q[1]; }));
      var maxY = Math.max.apply(null, s.cells.map(function (q) { return q[1]; }));
      var ox = px + (92 - (maxX - minX + 1) * m) / 2 - minX * m;
      var oy = py + (68 - (maxY - minY + 1) * m) / 2 - minY * m;
      c.globalAlpha = dim ? .35 : 1;
      s.cells.forEach(function (q) {
        c.fillStyle = s.col;
        U2.roundRect(c, ox + q[0] * m + 1, oy + q[1] * m + 1, m - 2, m - 2, 3);
        c.fill();
      });
      c.globalAlpha = 1;
    }
  }

  window.Milo.register({
    id: 'block-stacker', title: 'Block Stacker', emo: '🟦', category: 'Puzzle',
    tagline: 'Fit the falling shapes, clear the rows',
    description: 'Seven shapes fall one at a time — rotate and slide them to fill ' +
      'complete rows. A ghost shows exactly where the piece will land, you can hold a ' +
      'piece for later with C, and Space slams it straight down. Clearing four rows at ' +
      'once scores eight times a single row.',
    controls: ['← →', '↑ rotate', '↓ soft drop', 'Space hard drop', 'C hold'],
    colors: ['#22d3ee', '#a78bfa'],
    featured: true,
    tags: ['tetris-like', 'classic', 'blocks', 'puzzle'],
    mount: mount
  });
})();
