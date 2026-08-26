/* Dot Connect — join each colour pair without crossing paths. */
(function () {
  'use strict';
  var W = 620, H = 620;
  var COLS = ['#fb7185', '#22d3ee', '#ffd257', '#34d399', '#a78bfa', '#fb923c'];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.level = d.level || 1;
      d.n = Math.min(8, 4 + Math.floor(d.level / 2));
      d.pairs = Math.min(COLS.length, 2 + Math.floor(d.level / 2));
      generate(d);
      d.paths = {};
      d.drawing = null;
      d.moves = 0;
      d.cell = Math.floor((W - 60) / d.n);
      d.pad = (W - d.n * d.cell) / 2;
      g.set('Level', d.level);
      g.set('Pairs', '0/' + d.pairs);
      g.set('Size', d.n + '×' + d.n);
    }

    /** Lay non-crossing snake paths, then keep only their endpoints. */
    function generate(d) {
      var n = d.n;
      for (var attempt = 0; attempt < 200; attempt++) {
        var grid = [];
        for (var y = 0; y < n; y++) grid.push(new Array(n).fill(-1));
        var ends = [];
        var ok = true;
        for (var p = 0; p < d.pairs; p++) {
          var free = [];
          for (var yy = 0; yy < n; yy++) {
            for (var xx = 0; xx < n; xx++) if (grid[yy][xx] < 0) free.push({ x: xx, y: yy });
          }
          if (!free.length) { ok = false; break; }
          var cur = U.choice(free);
          var path = [cur];
          grid[cur.y][cur.x] = p;
          var steps = U.randInt(2, Math.max(3, n));
          for (var s = 0; s < steps; s++) {
            var opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(function (o) {
              return { x: cur.x + o[0], y: cur.y + o[1] };
            }).filter(function (q) {
              return q.x >= 0 && q.y >= 0 && q.x < n && q.y < n && grid[q.y][q.x] < 0;
            });
            if (!opts.length) break;
            cur = U.choice(opts);
            grid[cur.y][cur.x] = p;
            path.push(cur);
          }
          if (path.length < 2) { ok = false; break; }
          // Clear the middle; only the two ends are shown.
          for (var m = 1; m < path.length - 1; m++) grid[path[m].y][path[m].x] = -1;
          ends.push([path[0], path[path.length - 1]]);
        }
        if (ok && ends.length === d.pairs) { d.ends = ends; return; }
      }
      d.ends = [[{ x: 0, y: 0 }, { x: n - 1, y: n - 1 }], [{ x: n - 1, y: 0 }, { x: 0, y: n - 1 }]];
      d.pairs = 2;
    }

    function endpointAt(d, x, y) {
      for (var p = 0; p < d.ends.length; p++) {
        if ((d.ends[p][0].x === x && d.ends[p][0].y === y) ||
          (d.ends[p][1].x === x && d.ends[p][1].y === y)) return p;
      }
      return -1;
    }

    function occupiedBy(d, x, y) {
      for (var k in d.paths) {
        var found = d.paths[k].some(function (q) { return q.x === x && q.y === y; });
        if (found) return +k;
      }
      return -1;
    }

    function done(d) {
      var n = 0;
      for (var p = 0; p < d.pairs; p++) {
        var path = d.paths[p];
        if (!path || path.length < 2) continue;
        var a = path[0], b = path[path.length - 1];
        var e = d.ends[p];
        var joined = (a.x === e[0].x && a.y === e[0].y && b.x === e[1].x && b.y === e[1].y) ||
          (a.x === e[1].x && a.y === e[1].y && b.x === e[0].x && b.y === e[0].y);
        if (joined) n++;
      }
      return n;
    }

    return Milo.arcade(host, {
      id: 'dot-connect',
      w: W, h: H, bg: '#0d1030',
      stats: ['Level', 'Pairs', 'Size'],
      emo: '🔗',
      start: {
        title: 'Dot Connect',
        text: 'Drag from one coloured dot to its twin. Paths cannot cross — starting a ' +
          'line over an existing one clears it, so plan the order.',
        keys: ['Drag from dot to dot']
      },
      preload: function (g) { g.data.level = 1; },
      init: reset,

      onPointer: function (g, type, px, py) {
        var d = g.data;
        var x = Math.floor((px - d.pad) / d.cell), y = Math.floor((py - d.pad) / d.cell);
        var inside = x >= 0 && y >= 0 && x < d.n && y < d.n;

        if (type === 'down' && inside) {
          var p = endpointAt(d, x, y);
          if (p >= 0) {
            d.paths[p] = [{ x: x, y: y }];
            d.drawing = p;
            Milo.sound.blip();
          } else {
            var occ = occupiedBy(d, x, y);
            if (occ >= 0) delete d.paths[occ];
          }
          return;
        }
        if (type === 'move' && d.drawing != null && inside) {
          var path = d.paths[d.drawing];
          var last = path[path.length - 1];
          if (last.x === x && last.y === y) return;
          if (Math.abs(last.x - x) + Math.abs(last.y - y) !== 1) return;
          // Backing up along your own line trims it.
          if (path.length > 1 && path[path.length - 2].x === x && path[path.length - 2].y === y) {
            path.pop();
            return;
          }
          var occ2 = occupiedBy(d, x, y);
          if (occ2 >= 0 && occ2 !== d.drawing) delete d.paths[occ2];
          var other = endpointAt(d, x, y);
          if (other >= 0 && other !== d.drawing) return;
          path.push({ x: x, y: y });
          return;
        }
        if (type === 'up' && d.drawing != null) {
          d.drawing = null;
          d.moves++;
          var n = done(d);
          g.set('Pairs', n + '/' + d.pairs);
          if (n === d.pairs) {
            var earned = Math.max(120, 700 - d.moves * 25) * d.level;
            g.score += earned;
            Milo.sound.win();
            d.level++;
            g.overlay({
              emo: '🔗', title: 'All connected!',
              text: 'Worth ' + U.fmt(earned) + ' points.',
              score: g.score, best: g.best,
              newBest: Milo.store.setBest('dot-connect', g.score),
              actions: [
                { label: 'Next board →', primary: true, onClick: function () { next(g); } },
                { label: 'Start over', onClick: function () { g.data.level = 1; g.restart(); } }
              ]
            });
          }
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, s = d.cell, p0 = d.pad;
        c.fillStyle = '#0d1030'; c.fillRect(0, 0, W, H);

        for (var y = 0; y < d.n; y++) {
          for (var x = 0; x < d.n; x++) {
            c.fillStyle = 'rgba(255,255,255,.03)';
            c.fillRect(p0 + x * s + 2, p0 + y * s + 2, s - 4, s - 4);
          }
        }

        Object.keys(d.paths).forEach(function (k) {
          var path = d.paths[k];
          if (path.length < 2) return;
          c.strokeStyle = COLS[k % COLS.length];
          c.lineWidth = s * .38; c.lineCap = 'round'; c.lineJoin = 'round';
          c.beginPath();
          path.forEach(function (q, i) {
            var qx = p0 + q.x * s + s / 2, qy = p0 + q.y * s + s / 2;
            i ? c.lineTo(qx, qy) : c.moveTo(qx, qy);
          });
          c.stroke();
        });

        d.ends.forEach(function (pair, p) {
          pair.forEach(function (e) {
            var ex = p0 + e.x * s + s / 2, ey = p0 + e.y * s + s / 2;
            c.fillStyle = COLS[p % COLS.length];
            c.beginPath(); c.arc(ex, ey, s * .3, 0, 7); c.fill();
            c.fillStyle = 'rgba(255,255,255,.3)';
            c.beginPath(); c.arc(ex - s * .08, ey - s * .1, s * .09, 0, 7); c.fill();
          });
        });

        c.fillStyle = 'rgba(255,255,255,.4)';
        c.font = '600 12px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText('Drag from a dot to its matching dot', W / 2, H - 10);
      }
    });

    function next(g) {
      g.clearOverlay();
      var keepScore = g.score, keepLevel = g.data.level;
      reset(g);
      g.data.level = keepLevel;
      g.score = keepScore;
      g.state = 'play';
      g.set('Level', keepLevel);
      g.best = Milo.store.best('dot-connect');
    }
  }

  window.Milo.register({
    id: 'dot-connect', title: 'Dot Connect', emo: '🔗', category: 'Puzzle',
    tagline: 'Join the pairs without crossing',
    description: 'Every colour appears twice; drag a path from one dot to its partner. ' +
      'Paths cannot cross, so routing one carelessly blocks the next — and drawing over an ' +
      'existing line simply erases it, which makes the real puzzle finding the order to ' +
      'connect them in. Boards grow from 4×4 to 8×8.',
    controls: ['Drag between dots'],
    colors: ['#0d1030', '#22d3ee'],
    tags: ['logic', 'routing', 'brain', 'levels'],
    mount: mount
  });
})();
