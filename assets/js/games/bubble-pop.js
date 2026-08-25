/* Bubble Pop — shoot bubbles up the board, match three to clear. */
(function () {
  'use strict';
  var COLS = 12, R = 22, W = COLS * R * 2 + 40, H = 640;
  var COLORS = ['#fb7185', '#22d3ee', '#ffd257', '#34d399', '#a78bfa', '#fb923c'];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.grid = [];
      for (var y = 0; y < 14; y++) {
        var row = [];
        var cols = COLS - (y % 2);
        for (var x = 0; x < cols; x++) row.push(y < 5 ? U.randInt(0, 3) : -1);
        d.grid.push(row);
      }
      d.colours = 4;
      d.shot = null;
      d.next = U.randInt(0, d.colours - 1);
      d.load = U.randInt(0, d.colours - 1);
      d.angle = -Math.PI / 2;
      d.shots = 0;
      d.pops = [];
      d.dropRow = 0;
      g.set('Score', 0);
      g.set('Shots', 0);
      g.set('Best', U.fmt(g.best));
    }

    function cellXY(y, x) {
      var offset = (y % 2) * R;
      return { x: 20 + offset + x * R * 2 + R, y: 40 + y * R * 1.74 + R };
    }

    function neighbours(d, y, x) {
      var odd = y % 2;
      var offs = [[0, -1], [0, 1], [-1, odd - 1], [-1, odd], [1, odd - 1], [1, odd]];
      var out = [];
      offs.forEach(function (o) {
        var ny = y + o[0], nx = x + o[1];
        if (ny < 0 || ny >= d.grid.length) return;
        if (nx < 0 || nx >= d.grid[ny].length) return;
        out.push({ y: ny, x: nx });
      });
      return out;
    }

    function cluster(d, y, x, matchColour) {
      var target = d.grid[y][x];
      var seen = {}, stack = [{ y: y, x: x }], out = [];
      while (stack.length) {
        var p = stack.pop();
        var key = p.y + ',' + p.x;
        if (seen[key]) continue;
        seen[key] = true;
        if (d.grid[p.y][p.x] < 0) continue;
        if (matchColour && d.grid[p.y][p.x] !== target) continue;
        out.push(p);
        neighbours(d, p.y, p.x).forEach(function (n) { stack.push(n); });
      }
      return out;
    }

    /** Anything not connected to the ceiling falls. */
    function dropFloating(d) {
      var attached = {};
      for (var x = 0; x < d.grid[0].length; x++) {
        if (d.grid[0][x] < 0) continue;
        cluster(d, 0, x, false).forEach(function (p) { attached[p.y + ',' + p.x] = true; });
      }
      var dropped = 0;
      for (var y = 0; y < d.grid.length; y++) {
        for (var x2 = 0; x2 < d.grid[y].length; x2++) {
          if (d.grid[y][x2] >= 0 && !attached[y + ',' + x2]) {
            d.pops.push({ x: cellXY(y, x2).x, y: cellXY(y, x2).y, col: COLORS[d.grid[y][x2]], t: .5 });
            d.grid[y][x2] = -1;
            dropped++;
          }
        }
      }
      return dropped;
    }

    function snap(g, bx, by, colour) {
      var d = g.data;
      var best = null, bestD = 1e9;
      for (var y = 0; y < d.grid.length; y++) {
        for (var x = 0; x < d.grid[y].length; x++) {
          if (d.grid[y][x] >= 0) continue;
          var p = cellXY(y, x);
          var dist = U.dist(bx, by, p.x, p.y);
          // Only snap next to an existing bubble, or into the top row.
          var touching = y === 0 || neighbours(d, y, x).some(function (n) { return d.grid[n.y][n.x] >= 0; });
          if (!touching) continue;
          if (dist < bestD) { bestD = dist; best = { y: y, x: x }; }
        }
      }
      if (!best) return;
      d.grid[best.y][best.x] = colour;

      var group = cluster(d, best.y, best.x, true);
      if (group.length >= 3) {
        group.forEach(function (p) {
          var q = cellXY(p.y, p.x);
          d.pops.push({ x: q.x, y: q.y, col: COLORS[d.grid[p.y][p.x]], t: .4 });
          d.grid[p.y][p.x] = -1;
        });
        var dropped = dropFloating(d);
        g.score += group.length * 20 + dropped * 40;
        g.set('Score', U.fmt(g.score));
        Milo.sound.coin();
      } else {
        Milo.sound.tone({ f: 300, d: .06, v: .05, type: 'triangle' });
      }

      // Lose if bubbles reach the bottom.
      for (var x2 = 0; x2 < d.grid[d.grid.length - 1].length; x2++) {
        if (d.grid[d.grid.length - 1][x2] >= 0) {
          g.gameOver({ emo: '🫧', title: 'They reached the bottom', text: 'Score ' + U.fmt(g.score) + '.' });
          return;
        }
      }
      if (d.grid.every(function (row) { return row.every(function (v) { return v < 0; }); })) {
        g.win({ score: g.score, emo: '🫧', title: 'Board cleared!' });
      }
    }

    return Milo.arcade(host, {
      id: 'bubble-pop',
      w: W, h: H, bg: '#0d1230',
      stats: ['Score', 'Shots', 'Best'],
      emo: '🫧',
      start: {
        title: 'Bubble Pop',
        text: 'Aim with the mouse and fire bubbles upward. Three or more of a colour ' +
          'touching pops them — and anything left hanging with nothing above falls too.',
        keys: ['Move to aim', 'Click to fire']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        var d = g.data;
        var sx = W / 2, sy = H - 40;
        d.angle = Math.atan2(Math.min(y, sy - 20) - sy, x - sx);
        if (type === 'down' && !d.shot) {
          d.shot = { x: sx, y: sy, vx: Math.cos(d.angle) * 720, vy: Math.sin(d.angle) * 720, col: d.load };
          d.load = d.next;
          d.next = U.randInt(0, d.colours - 1);
          d.shots++;
          g.set('Shots', d.shots);
          Milo.sound.tone({ f: 620, f2: 900, d: .06, v: .05, type: 'square' });
        }
      },

      update: function (g, dt) {
        var d = g.data;
        if (d.shot) {
          d.shot.x += d.shot.vx * dt;
          d.shot.y += d.shot.vy * dt;
          if (d.shot.x < 20 + R) { d.shot.x = 20 + R; d.shot.vx = Math.abs(d.shot.vx); }
          if (d.shot.x > W - 20 - R) { d.shot.x = W - 20 - R; d.shot.vx = -Math.abs(d.shot.vx); }

          var hit = d.shot.y < 40 + R;
          if (!hit) {
            for (var y = 0; y < d.grid.length && !hit; y++) {
              for (var x = 0; x < d.grid[y].length; x++) {
                if (d.grid[y][x] < 0) continue;
                var p = cellXY(y, x);
                if (U.dist(d.shot.x, d.shot.y, p.x, p.y) < R * 1.85) { hit = true; break; }
              }
            }
          }
          if (hit) {
            snap(g, d.shot.x, d.shot.y, d.shot.col);
            d.shot = null;
          }
        }
        d.pops = d.pops.filter(function (p) { p.t -= dt; return p.t > 0; });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#161d47'); bg.addColorStop(1, '#080b1e');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        c.fillStyle = 'rgba(255,255,255,.10)';
        c.fillRect(20, 32, W - 40, 6);

        function bubble(x, y, col, r) {
          c.fillStyle = col;
          c.beginPath(); c.arc(x, y, r || R - 1, 0, 7); c.fill();
          c.fillStyle = 'rgba(255,255,255,.35)';
          c.beginPath(); c.arc(x - (r || R) * .3, y - (r || R) * .32, (r || R) * .24, 0, 7); c.fill();
        }

        d.grid.forEach(function (row, y) {
          row.forEach(function (v, x) {
            if (v < 0) return;
            var p = cellXY(y, x);
            bubble(p.x, p.y, COLORS[v]);
          });
        });

        d.pops.forEach(function (p) {
          c.globalAlpha = p.t / .5;
          c.strokeStyle = p.col; c.lineWidth = 3;
          c.beginPath(); c.arc(p.x, p.y, R * (1.6 - p.t), 0, 7); c.stroke();
        });
        c.globalAlpha = 1;

        // aim guide
        var sx = W / 2, sy = H - 40;
        c.strokeStyle = 'rgba(255,255,255,.22)';
        c.setLineDash([5, 8]); c.lineWidth = 2;
        c.beginPath();
        c.moveTo(sx, sy);
        c.lineTo(sx + Math.cos(d.angle) * 220, sy + Math.sin(d.angle) * 220);
        c.stroke();
        c.setLineDash([]);

        if (d.shot) bubble(d.shot.x, d.shot.y, COLORS[d.shot.col]);
        bubble(sx, sy, COLORS[d.load]);
        bubble(sx + 64, sy + 8, COLORS[d.next], R * .68);
        c.fillStyle = 'rgba(255,255,255,.4)';
        c.font = '600 11px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText('next', sx + 64, sy + 34);
      }
    });
  }

  window.Milo.register({
    id: 'bubble-pop', title: 'Bubble Pop', emo: '🫧', category: 'Puzzle',
    tagline: 'Match three, drop the rest',
    description: 'Fire bubbles up into a hanging cluster. Three or more of the same colour ' +
      'touching each other pop — and crucially, anything left dangling with no path back to ' +
      'the ceiling falls as well, which is where the big scores come from. Bubbles bounce ' +
      'off the side walls, so bank shots are often the only way in.',
    controls: ['Move to aim', 'Click to fire'],
    colors: ['#0d1230', '#a78bfa'],
    tags: ['match 3', 'aiming', 'puzzle', 'classic'],
    mount: mount
  });
})();
