/* Gem Swap — match three, cascade, beat the move limit. */
(function () {
  'use strict';
  var N = 8, CELL = 62, W = N * CELL + 40, H = N * CELL + 90;
  var GX = 20, GY = 70;
  var GEMS = ['#fb7185', '#22d3ee', '#ffd257', '#34d399', '#a78bfa', '#fb923c'];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.b = [];
      for (var y = 0; y < N; y++) {
        d.b.push([]);
        for (var x = 0; x < N; x++) d.b[y].push(U.randInt(0, GEMS.length - 1));
      }
      // Clear any matches the random fill happened to create.
      var guard = 0;
      while (findMatches(d).length && guard++ < 60) resolve(d, null);
      d.sel = null;
      d.moves = 30;
      d.combo = 0;
      d.anim = 0;
      d.pop = [];
      g.set('Score', 0);
      g.set('Moves', 30);
      g.set('Best', U.fmt(g.best));
    }

    function findMatches(d) {
      var out = [];
      for (var y = 0; y < N; y++) {
        for (var x = 0; x < N - 2; x++) {
          var v = d.b[y][x];
          if (v < 0) continue;
          if (d.b[y][x + 1] === v && d.b[y][x + 2] === v) {
            var run = [{ x: x, y: y }, { x: x + 1, y: y }, { x: x + 2, y: y }];
            var k = x + 3;
            while (k < N && d.b[y][k] === v) { run.push({ x: k, y: y }); k++; }
            out.push(run);
          }
        }
      }
      for (var x2 = 0; x2 < N; x2++) {
        for (var y2 = 0; y2 < N - 2; y2++) {
          var v2 = d.b[y2][x2];
          if (v2 < 0) continue;
          if (d.b[y2 + 1][x2] === v2 && d.b[y2 + 2][x2] === v2) {
            var run2 = [{ x: x2, y: y2 }, { x: x2, y: y2 + 1 }, { x: x2, y: y2 + 2 }];
            var k2 = y2 + 3;
            while (k2 < N && d.b[k2][x2] === v2) { run2.push({ x: x2, y: k2 }); k2++; }
            out.push(run2);
          }
        }
      }
      return out;
    }

    /** Clear matches, drop everything down, refill. Returns points scored. */
    function resolve(d, g) {
      var matches = findMatches(d);
      if (!matches.length) return 0;
      var cleared = {};
      matches.forEach(function (run) {
        run.forEach(function (p) { cleared[p.y * N + p.x] = true; });
      });
      var n = Object.keys(cleared).length;
      Object.keys(cleared).forEach(function (k) {
        var i = +k;
        d.b[(i / N) | 0][i % N] = -1;
        if (g) d.pop.push({ x: i % N, y: (i / N) | 0, t: .35 });
      });
      for (var x = 0; x < N; x++) {
        var col = [];
        for (var y = N - 1; y >= 0; y--) if (d.b[y][x] >= 0) col.push(d.b[y][x]);
        for (var y2 = N - 1, c = 0; y2 >= 0; y2--, c++) {
          d.b[y2][x] = col[c] != null ? col[c] : U.randInt(0, GEMS.length - 1);
        }
      }
      return n;
    }

    function cascade(g) {
      var d = g.data;
      d.combo = 0;
      var total = 0, guard = 0;
      while (guard++ < 30) {
        var n = resolve(d, g);
        if (!n) break;
        d.combo++;
        total += n * 10 * d.combo;
        Milo.sound.tone({ f: 420 + d.combo * 80, d: .07, v: .06, type: 'square' });
      }
      if (total) {
        g.score += total;
        g.set('Score', U.fmt(g.score));
      }
      return total;
    }

    function swap(g, a, b) {
      var d = g.data;
      var tmp = d.b[a.y][a.x];
      d.b[a.y][a.x] = d.b[b.y][b.x];
      d.b[b.y][b.x] = tmp;
      if (!findMatches(d).length) {
        // Illegal swap — put it back.
        d.b[b.y][b.x] = d.b[a.y][a.x];
        d.b[a.y][a.x] = tmp;
        Milo.sound.tone({ f: 150, d: .08, v: .05, type: 'square' });
        return false;
      }
      d.moves--;
      g.set('Moves', d.moves);
      cascade(g);
      if (d.moves <= 0) {
        g.gameOver({ emo: '💎', title: 'Out of moves', text: 'Final score ' + U.fmt(g.score) + '.' });
      }
      return true;
    }

    return Milo.arcade(host, {
      id: 'gem-swap',
      w: W, h: H, bg: '#150f2e',
      stats: ['Score', 'Moves', 'Best'],
      emo: '💎',
      start: {
        title: 'Gem Swap',
        text: 'Swap two touching gems to line up three or more. Everything above drops ' +
          'down, and chain reactions multiply your score. Thirty moves.',
        keys: ['Click a gem, then a neighbour']
      },
      init: reset,

      onPointer: function (g, type, px, py) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data;
        var x = Math.floor((px - GX) / CELL), y = Math.floor((py - GY) / CELL);
        if (x < 0 || y < 0 || x >= N || y >= N) return;
        if (!d.sel) { d.sel = { x: x, y: y }; Milo.sound.blip(); return; }
        var dist = Math.abs(d.sel.x - x) + Math.abs(d.sel.y - y);
        if (dist === 1) { swap(g, d.sel, { x: x, y: y }); d.sel = null; }
        else d.sel = { x: x, y: y };
      },

      update: function (g, dt) {
        var d = g.data;
        d.pop = d.pop.filter(function (p) { p.t -= dt; return p.t > 0; });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#20163f'); bg.addColorStop(1, '#0c0820');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        for (var y = 0; y < N; y++) {
          for (var x = 0; x < N; x++) {
            var px = GX + x * CELL, py = GY + y * CELL;
            c.fillStyle = (x + y) % 2 ? 'rgba(255,255,255,.035)' : 'rgba(255,255,255,.015)';
            c.fillRect(px, py, CELL, CELL);
            var v = d.b[y][x];
            if (v < 0) continue;
            var sel = d.sel && d.sel.x === x && d.sel.y === y;
            var cx = px + CELL / 2, cy = py + CELL / 2, r = CELL * .34;
            c.fillStyle = GEMS[v];
            c.beginPath();
            for (var s = 0; s < 6; s++) {
              var a = s / 6 * 6.283 - Math.PI / 2;
              c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
            }
            c.closePath(); c.fill();
            c.fillStyle = 'rgba(255,255,255,.35)';
            c.beginPath();
            c.moveTo(cx, cy - r); c.lineTo(cx + r * .86, cy - r * .5); c.lineTo(cx, cy);
            c.closePath(); c.fill();
            if (sel) {
              c.strokeStyle = '#fff'; c.lineWidth = 3;
              c.strokeRect(px + 3, py + 3, CELL - 6, CELL - 6);
            }
          }
        }

        d.pop.forEach(function (p) {
          c.globalAlpha = p.t / .35;
          c.strokeStyle = '#fff'; c.lineWidth = 3;
          var r2 = (1 - p.t / .35) * CELL * .6;
          c.beginPath();
          c.arc(GX + p.x * CELL + CELL / 2, GY + p.y * CELL + CELL / 2, r2, 0, 7);
          c.stroke();
        });
        c.globalAlpha = 1;

        if (d.combo > 1) {
          c.fillStyle = '#ffd257';
          c.font = '800 20px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText('COMBO ×' + d.combo, W / 2, 46);
        }
      }
    });
  }

  window.Milo.register({
    id: 'gem-swap', title: 'Gem Swap', emo: '💎', category: 'Puzzle',
    tagline: 'Match three, chain the cascade',
    description: 'Swap two adjacent gems to make a line of three or more. Cleared gems ' +
      'vanish, everything above drops into the gap, and any new matches that forms clear ' +
      'too — each step of a cascade multiplies the score. A swap that makes no match is ' +
      'not allowed and costs you nothing. Thirty moves to score as high as you can.',
    controls: ['Click a gem, then a neighbour'],
    colors: ['#150f2e', '#fb7185'],
    tags: ['match 3', 'puzzle', 'cascade', 'relaxing'],
    mount: mount
  });
})();
