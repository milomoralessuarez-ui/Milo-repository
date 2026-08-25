/* Gomoku — five in a row on a 15x15 board, against a threat-scoring AI. */
(function () {
  'use strict';
  var N = 15, W = 660, H = 660;
  var CELL = 40, PAD = (W - (N - 1) * CELL) / 2;
  var DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.b = new Int8Array(N * N);        // 0 empty, 1 you (black), 2 cpu (white)
      d.turn = 1;
      d.over = false;
      d.line = null;
      d.last = null;
      d.thinking = 0;
      d.moves = 0;
      d.wins = d.wins || 0;
      g.set('Moves', 0);
      g.set('Turn', 'Yours');
      g.set('Won', d.wins);
    }

    function at(b, x, y) {
      return (x < 0 || y < 0 || x >= N || y >= N) ? -1 : b[y * N + x];
    }

    /** Winning five, as a list of cells, or null. */
    function winner(b, who) {
      for (var y = 0; y < N; y++) {
        for (var x = 0; x < N; x++) {
          if (b[y * N + x] !== who) continue;
          for (var k = 0; k < 4; k++) {
            var dx = DIRS[k][0], dy = DIRS[k][1], line = [[x, y]], ok = true;
            for (var i = 1; i < 5; i++) {
              if (at(b, x + dx * i, y + dy * i) !== who) { ok = false; break; }
              line.push([x + dx * i, y + dy * i]);
            }
            if (ok) return line;
          }
        }
      }
      return null;
    }

    /** How valuable placing `who` at (x,y) is: open runs are worth far more. */
    function scoreCell(b, x, y, who) {
      var total = 0;
      for (var k = 0; k < 4; k++) {
        var dx = DIRS[k][0], dy = DIRS[k][1];
        var run = 1, openEnds = 0;
        for (var s = 1; s <= 4; s++) {
          var v = at(b, x + dx * s, y + dy * s);
          if (v === who) run++;
          else { if (v === 0) openEnds++; break; }
        }
        for (var t = 1; t <= 4; t++) {
          var v2 = at(b, x - dx * t, y - dy * t);
          if (v2 === who) run++;
          else { if (v2 === 0) openEnds++; break; }
        }
        if (run >= 5) total += 1000000;
        else if (run === 4) total += openEnds === 2 ? 100000 : (openEnds === 1 ? 12000 : 0);
        else if (run === 3) total += openEnds === 2 ? 6000 : (openEnds === 1 ? 700 : 0);
        else if (run === 2) total += openEnds === 2 ? 400 : (openEnds === 1 ? 60 : 0);
        else total += openEnds * 8;
      }
      return total;
    }

    function place(g, x, y, who) {
      var d = g.data;
      d.b[y * N + x] = who;
      d.last = [x, y];
      d.moves++;
      g.set('Moves', d.moves);
      Milo.sound.tone({ f: who === 1 ? 420 : 300, f2: 220, d: .07, v: .07, type: 'triangle' });

      var line = winner(d.b, who);
      if (line) {
        d.over = true;
        d.line = line;
        if (who === 1) {
          d.wins++;
          g.set('Won', d.wins);
          g.win({ emo: '⚫', title: 'Five in a row!', score: d.wins * 200 });
        } else {
          g.gameOver({ emo: '⚪', title: 'CPU got five', score: d.wins * 200 });
        }
        return true;
      }
      if (d.moves >= N * N) {
        d.over = true;
        g.gameOver({ emo: '🤝', title: 'Board full — a draw', score: d.wins * 200 });
        return true;
      }
      return false;
    }

    function cpuMove(g) {
      var d = g.data;
      var best = null, bestScore = -1;
      for (var y = 0; y < N; y++) {
        for (var x = 0; x < N; x++) {
          if (d.b[y * N + x]) continue;
          // Only consider cells near existing stones — the rest are dead space.
          if (!hasNeighbour(d.b, x, y)) continue;
          // Its own threat, plus blocking the player's, slightly discounted.
          var s = scoreCell(d.b, x, y, 2) + scoreCell(d.b, x, y, 1) * 0.9;
          s += U.hash2(x, y, d.moves) * 20;
          if (s > bestScore) { bestScore = s; best = [x, y]; }
        }
      }
      if (!best) best = [N >> 1, N >> 1];
      if (place(g, best[0], best[1], 2)) return;
      d.turn = 1;
      g.set('Turn', 'Yours');
    }

    function hasNeighbour(b, x, y) {
      for (var dy = -2; dy <= 2; dy++) {
        for (var dx = -2; dx <= 2; dx++) {
          if (at(b, x + dx, y + dy) > 0) return true;
        }
      }
      return false;
    }

    return Milo.arcade(host, {
      id: 'gomoku',
      w: W, h: H, bg: '#b58b53',
      stats: ['Moves', 'Turn', 'Won'],
      emo: '⚫',
      start: {
        title: 'Gomoku',
        text: 'Five in a row wins — horizontally, vertically or diagonally. You play ' +
          'black and move first. The CPU weighs its own threats against yours, so an open ' +
          'three will not go unanswered.',
        keys: ['Click an intersection']
      },
      preload: function (g) { g.data.wins = 0; },
      init: reset,

      onPointer: function (g, type, px, py) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data;
        if (d.over || d.turn !== 1 || d.thinking > 0) return;
        var x = Math.round((px - PAD) / CELL), y = Math.round((py - PAD) / CELL);
        if (x < 0 || y < 0 || x >= N || y >= N) return;
        if (d.b[y * N + x]) return;
        if (place(g, x, y, 1)) return;
        d.turn = 2;
        d.thinking = 0.35;
        g.set('Turn', 'CPU…');
      },

      update: function (g, dt) {
        var d = g.data;
        if (d.thinking > 0) {
          d.thinking -= dt;
          if (d.thinking <= 0 && !d.over) cpuMove(g);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, W, H);
        bg.addColorStop(0, '#c99a5e'); bg.addColorStop(1, '#a87a45');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        c.strokeStyle = 'rgba(40,26,10,.55)';
        c.lineWidth = 1;
        c.beginPath();
        for (var i = 0; i < N; i++) {
          c.moveTo(PAD, PAD + i * CELL); c.lineTo(PAD + (N - 1) * CELL, PAD + i * CELL);
          c.moveTo(PAD + i * CELL, PAD); c.lineTo(PAD + i * CELL, PAD + (N - 1) * CELL);
        }
        c.stroke();

        // star points
        c.fillStyle = 'rgba(40,26,10,.6)';
        [[3, 3], [11, 3], [3, 11], [11, 11], [7, 7]].forEach(function (p) {
          c.beginPath(); c.arc(PAD + p[0] * CELL, PAD + p[1] * CELL, 3.5, 0, 7); c.fill();
        });

        for (var y = 0; y < N; y++) {
          for (var x = 0; x < N; x++) {
            var v = d.b[y * N + x];
            if (!v) continue;
            var cx = PAD + x * CELL, cy = PAD + y * CELL;
            c.fillStyle = 'rgba(0,0,0,.28)';
            c.beginPath(); c.arc(cx + 1.5, cy + 2, CELL * .40, 0, 7); c.fill();
            var grd = c.createRadialGradient(cx - 5, cy - 6, 2, cx, cy, CELL * .42);
            if (v === 1) { grd.addColorStop(0, '#555'); grd.addColorStop(1, '#111'); }
            else { grd.addColorStop(0, '#fff'); grd.addColorStop(1, '#c8ccd8'); }
            c.fillStyle = grd;
            c.beginPath(); c.arc(cx, cy, CELL * .40, 0, 7); c.fill();
          }
        }

        if (d.last && !d.over) {
          c.strokeStyle = '#22d3ee'; c.lineWidth = 2;
          c.beginPath();
          c.arc(PAD + d.last[0] * CELL, PAD + d.last[1] * CELL, CELL * .46, 0, 7);
          c.stroke();
        }
        if (d.line) {
          c.strokeStyle = '#ff4d6d'; c.lineWidth = 5; c.lineCap = 'round';
          c.beginPath();
          c.moveTo(PAD + d.line[0][0] * CELL, PAD + d.line[0][1] * CELL);
          c.lineTo(PAD + d.line[4][0] * CELL, PAD + d.line[4][1] * CELL);
          c.stroke();
        }
      }
    });
  }

  window.Milo.register({
    id: 'gomoku', title: 'Gomoku', emo: '⚫', category: 'Strategy',
    tagline: 'Five in a row on a 15×15 board',
    description: 'Also called Five in a Row. Place stones on the intersections and get ' +
      'five in a line before the CPU does. It scores every square by the threats it creates ' +
      'and the ones it denies you, so leaving an open three lying around will not end well.',
    controls: ['Click an intersection'],
    colors: ['#b58b53', '#1b2040'],
    tags: ['board game', 'vs cpu', 'strategy', 'classic'],
    mount: mount
  });
})();
