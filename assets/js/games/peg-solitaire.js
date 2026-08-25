/* Peg Solitaire — jump pegs off the board and try to finish with one. */
(function () {
  'use strict';
  var W = 560, H = 560, CELL = 62;
  var LAYOUT = [
    '  ***  ', '  ***  ', '*******', '***o***', '*******', '  ***  ', '  ***  '
  ];
  var N = 7, PAD = (W - N * CELL) / 2, TOP = 40;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.b = [];
      for (var y = 0; y < N; y++) {
        var row = [];
        for (var x = 0; x < N; x++) {
          var ch = LAYOUT[y][x];
          row.push(ch === ' ' ? -1 : ch === '*' ? 1 : 0);
        }
        d.b.push(row);
      }
      d.sel = null;
      d.moves = 0;
      d.done = false;
      g.set('Pegs', count(d));
      g.set('Moves', 0);
      g.set('Best', g.best ? U.fmt(g.best) : '—');
    }

    function count(d) {
      var n = 0;
      d.b.forEach(function (r) { r.forEach(function (v) { if (v === 1) n++; }); });
      return n;
    }

    function jumps(d, x, y) {
      var out = [];
      [[2, 0], [-2, 0], [0, 2], [0, -2]].forEach(function (o) {
        var tx = x + o[0], ty = y + o[1];
        var mx = x + o[0] / 2, my = y + o[1] / 2;
        if (tx < 0 || ty < 0 || tx >= N || ty >= N) return;
        if (d.b[ty][tx] !== 0) return;
        if (d.b[my][mx] !== 1) return;
        out.push({ x: tx, y: ty, mx: mx, my: my });
      });
      return out;
    }

    function anyMoves(d) {
      for (var y = 0; y < N; y++) {
        for (var x = 0; x < N; x++) {
          if (d.b[y][x] === 1 && jumps(d, x, y).length) return true;
        }
      }
      return false;
    }

    function finish(g) {
      var d = g.data;
      d.done = true;
      var left = count(d);
      var score = Math.max(50, (33 - left) * 120 + (left === 1 ? 1500 : 0));
      if (left === 1) {
        g.win({
          emo: '🕳️', title: 'One peg left — perfect!',
          text: 'Solved in ' + d.moves + ' moves.', score: score
        });
      } else {
        g.gameOver({
          emo: '🕳️', title: 'No moves left',
          text: left + ' pegs still on the board.', score: score
        });
      }
    }

    return Milo.arcade(host, {
      id: 'peg-solitaire',
      w: W, h: H, bg: '#2a1c12',
      stats: ['Pegs', 'Moves', 'Best'],
      emo: '🕳️',
      start: {
        title: 'Peg Solitaire',
        text: 'Jump a peg over a neighbour into an empty hole and the one you jumped is ' +
          'removed. Thirty-two pegs, one hole — finishing with a single peg in the middle ' +
          'is the classic solution.',
        keys: ['Click a peg, then a hole']
      },
      init: reset,

      onPointer: function (g, type, px, py) {
        if (type !== 'down' || g.state !== 'play' || g.data.done) return;
        var d = g.data;
        var x = Math.floor((px - PAD) / CELL), y = Math.floor((py - TOP) / CELL);
        if (x < 0 || y < 0 || x >= N || y >= N || d.b[y][x] === -1) return;

        if (d.sel) {
          var move = jumps(d, d.sel.x, d.sel.y).filter(function (m) {
            return m.x === x && m.y === y;
          })[0];
          if (move) {
            d.b[d.sel.y][d.sel.x] = 0;
            d.b[move.my][move.mx] = 0;
            d.b[y][x] = 1;
            d.moves++;
            d.sel = null;
            g.set('Pegs', count(d));
            g.set('Moves', d.moves);
            Milo.sound.tone({ f: 480, f2: 300, d: .08, v: .07, type: 'triangle' });
            if (count(d) === 1 || !anyMoves(d)) finish(g);
            return;
          }
          d.sel = null;
        }
        if (d.b[y][x] === 1 && jumps(d, x, y).length) {
          d.sel = { x: x, y: y };
          Milo.sound.blip();
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#3c2718'); bg.addColorStop(1, '#1c120a');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        var targets = d.sel ? jumps(d, d.sel.x, d.sel.y) : [];

        for (var y = 0; y < N; y++) {
          for (var x = 0; x < N; x++) {
            var v = d.b[y][x];
            if (v === -1) continue;
            var cx = PAD + x * CELL + CELL / 2, cy = TOP + y * CELL + CELL / 2;
            c.fillStyle = 'rgba(0,0,0,.4)';
            c.beginPath(); c.arc(cx, cy, 22, 0, 7); c.fill();
            var isTarget = targets.some(function (t) { return t.x === x && t.y === y; });
            if (isTarget) {
              c.fillStyle = 'rgba(52,211,153,.4)';
              c.beginPath(); c.arc(cx, cy, 22, 0, 7); c.fill();
            }
            if (v === 1) {
              var sel = d.sel && d.sel.x === x && d.sel.y === y;
              var grd = c.createRadialGradient(cx - 6, cy - 7, 2, cx, cy, 20);
              grd.addColorStop(0, sel ? '#ffe9a8' : '#d7b98a');
              grd.addColorStop(1, sel ? '#e0a020' : '#8d6b42');
              c.fillStyle = grd;
              c.beginPath(); c.arc(cx, cy, 19, 0, 7); c.fill();
            }
          }
        }

        c.fillStyle = 'rgba(255,255,255,.45)';
        c.font = '600 12px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText('Click a peg with a legal jump, then the hole to land in', W / 2, H - 14);
      }
    });
  }

  window.Milo.register({
    id: 'peg-solitaire', title: 'Peg Solitaire', emo: '🕳️', category: 'Puzzle',
    tagline: 'Jump pegs off until one is left',
    description: 'The English cross board: 33 holes, 32 pegs and one gap in the middle. ' +
      'Jump a peg straight over a neighbour into an empty hole and the peg you jumped comes ' +
      'off. Legal landing spots are highlighted once you pick a peg. Getting down to a ' +
      'single peg is the goal — most people strand four or five.',
    controls: ['Click a peg', 'Click a hole'],
    colors: ['#2a1c12', '#d7b98a'],
    tags: ['logic', 'classic', 'brain', 'solitaire'],
    mount: mount
  });
})();
