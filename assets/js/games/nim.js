/* Nim — take what you like from one row; the CPU knows the maths. */
(function () {
  'use strict';
  var W = 720, H = 520;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.rows = [1, 3, 5, 7];
      d.taken = [[], [], [], []];
      d.sel = null;
      d.turn = 0;
      d.over = false;
      d.thinking = 0;
      d.misere = d.misere == null ? true : d.misere;
      d.wins = d.wins || 0;
      d.msg = d.misere ? 'Take the last match and you LOSE' : 'Take the last match to WIN';
      g.set('Left', 16);
      g.set('Mode', d.misere ? 'Misère' : 'Normal');
      g.set('Won', d.wins);
    }

    var ROWS = [1, 3, 5, 7];
    function rowY(i) { return 130 + i * 76; }
    function matchX(row, i) { return W / 2 - (ROWS[row] - 1) * 34 / 2 + i * 34; }

    function remaining(d) { return d.rows.reduce(function (a, b) { return a + b; }, 0); }

    function take(g, row, count) {
      var d = g.data;
      d.rows[row] -= count;
      Milo.sound.tone({ f: 500 - count * 30, f2: 300, d: .08, v: .07, type: 'square' });
      g.set('Left', remaining(d));
      var left = remaining(d);
      if (left === 0) {
        d.over = true;
        // In misère the player who takes the last match loses.
        var lastMover = d.turn;
        var youWin = d.misere ? lastMover === 1 : lastMover === 0;
        if (youWin) {
          d.wins++;
          g.set('Won', d.wins);
          g.win({ emo: '🪵', title: 'You win!', score: d.wins * 120 });
        } else {
          g.gameOver({ emo: '🪵', title: 'CPU wins', score: d.wins * 120 });
        }
        return true;
      }
      return false;
    }

    /** Perfect play: leave a nim-sum of zero (with the misère endgame twist). */
    function cpuMove(g) {
      var d = g.data;
      var rows = d.rows;
      var nonEmpty = rows.filter(function (r) { return r > 0; });
      var bigRows = rows.filter(function (r) { return r > 1; }).length;

      var move = null;
      if (d.misere && bigRows === 0) {
        // All rows are single matches: leave an odd number of them.
        var count = nonEmpty.length;
        var idx = rows.findIndex(function (r) { return r > 0; });
        move = { row: idx, take: count % 2 === 0 ? 1 : 1 };
      } else if (d.misere && bigRows === 1) {
        // Reduce the one big row so an odd number of single rows remains.
        var bigIdx = rows.findIndex(function (r) { return r > 1; });
        var ones = rows.filter(function (r) { return r === 1; }).length;
        var leave = ones % 2 === 0 ? 1 : 0;
        move = { row: bigIdx, take: rows[bigIdx] - leave };
      } else {
        var xor = rows.reduce(function (a, b) { return a ^ b; }, 0);
        if (xor !== 0) {
          for (var i = 0; i < rows.length; i++) {
            var target = rows[i] ^ xor;
            if (target < rows[i]) { move = { row: i, take: rows[i] - target }; break; }
          }
        }
      }
      if (!move) {
        // Already losing — take one from the largest row and hope.
        var maxI = 0;
        rows.forEach(function (r, i) { if (r > rows[maxI]) maxI = i; });
        move = { row: maxI, take: 1 };
      }
      move.take = U.clamp(move.take, 1, rows[move.row]);
      if (take(g, move.row, move.take)) return;
      d.turn = 0;
      d.msg = 'Your turn';
    }

    return Milo.arcade(host, {
      id: 'nim',
      w: W, h: H, bg: '#14172f',
      stats: ['Left', 'Mode', 'Won'],
      emo: '🪵',
      start: {
        title: 'Nim',
        text: 'Take as many matches as you like from a single row. In misère (the default) ' +
          'whoever takes the very last match loses. The CPU plays perfectly — beating it ' +
          'means finding the one opening move that works.',
        keys: ['Click matches in one row', 'M to switch mode']
      },
      preload: function (g) { g.data.wins = 0; g.data.misere = true; },
      init: reset,

      onKey: function (g, e) {
        if (e.code === 'KeyM') {
          g.data.misere = !g.data.misere;
          g.restart();
        }
      },

      onPointer: function (g, type, px, py) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data;
        if (d.over || d.turn !== 0 || d.thinking > 0) return;

        for (var row = 0; row < 4; row++) {
          var y = rowY(row);
          if (Math.abs(py - y) > 34) continue;
          var total = ROWS[row];
          var left = d.rows[row];
          if (!left) return;
          for (var i = total - left; i < total; i++) {
            if (Math.abs(px - matchX(row, i)) < 17) {
              // Clicking the nth remaining match takes that many.
              var count = i - (total - left) + 1;
              if (take(g, row, count)) return;
              d.turn = 1;
              d.thinking = 0.65;
              d.msg = 'CPU is thinking…';
              return;
            }
          }
          return;
        }
      },

      update: function (g, dt) {
        var d = g.data;
        if (d.thinking > 0) {
          d.thinking -= dt;
          if (d.thinking <= 0 && d.turn === 1) cpuMove(g);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#1c2044'); bg.addColorStop(1, '#0c0e20');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        for (var row = 0; row < 4; row++) {
          var total = ROWS[row];
          var left = d.rows[row];
          var y = rowY(row);
          for (var i = 0; i < total; i++) {
            var x = matchX(row, i);
            var gone = i < total - left;
            c.globalAlpha = gone ? 0.13 : 1;
            c.fillStyle = '#c98a4b';
            U.roundRect(c, x - 5, y - 30, 10, 56, 4); c.fill();
            c.fillStyle = gone ? '#555' : '#ff5b3c';
            c.beginPath(); c.arc(x, y - 34, 8, 0, 7); c.fill();
            c.globalAlpha = 1;
          }
        }

        c.fillStyle = '#e6ecff';
        c.font = '700 17px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText(d.msg, W / 2, 52);
        c.fillStyle = 'rgba(255,255,255,.45)';
        c.font = '600 12px Outfit, sans-serif';
        c.fillText('Click the last match you want to take · press M for ' +
          (d.misere ? 'normal' : 'misère') + ' mode', W / 2, H - 20);
      }
    });
  }

  window.Milo.register({
    id: 'nim', title: 'Nim', emo: '🪵', category: 'Strategy',
    tagline: 'The maths puzzle disguised as a game',
    description: 'Four rows of matches. On your turn take as many as you like, but all ' +
      'from one row. In misère mode — the default — the player forced to take the last ' +
      'match loses; press M to flip it around. The CPU computes the nim-sum and plays ' +
      'perfectly, so winning means finding the one correct opening.',
    controls: ['Click a match', 'M to switch mode'],
    colors: ['#14172f', '#ff5b3c'],
    tags: ['maths', 'vs cpu', 'strategy', 'classic'],
    mount: mount
  });
})();
