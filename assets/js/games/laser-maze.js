/* Laser Maze — rotate the mirrors to guide the beam to the target. */
(function () {
  'use strict';
  var W = 620, H = 620, N = 7;
  var CELL = Math.floor((W - 60) / N), PAD = (W - N * CELL) / 2;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.level = d.level || 1;
      build(d);
      d.moves = 0;
      d.solved = false;
      g.set('Level', d.level);
      g.set('Moves', 0);
      g.set('Mirrors', d.mirrors.length);
    }

    function build(d) {
      d.grid = [];
      for (var y = 0; y < N; y++) d.grid.push(new Array(N).fill(null));
      d.source = { x: 0, y: Math.floor(N / 2), dir: 1 };      // dir: 0 up 1 right 2 down 3 left
      d.target = { x: N - 1, y: U.randInt(0, N - 1) };
      d.walls = [];
      var wallCount = Math.min(8, 1 + d.level);
      for (var w = 0; w < wallCount; w++) {
        var wx = U.randInt(1, N - 2), wy = U.randInt(0, N - 1);
        if (wx === d.source.x && wy === d.source.y) continue;
        if (wx === d.target.x && wy === d.target.y) continue;
        d.walls.push({ x: wx, y: wy });
        d.grid[wy][wx] = 'wall';
      }
      d.mirrors = [];
      var count = Math.min(9, 2 + Math.floor(d.level * 0.8));
      for (var m = 0; m < count; m++) {
        for (var tries = 0; tries < 40; tries++) {
          var x = U.randInt(1, N - 2), y = U.randInt(0, N - 1);
          if (d.grid[y][x]) continue;
          if (x === d.source.x && y === d.source.y) continue;
          if (x === d.target.x && y === d.target.y) continue;
          var mir = { x: x, y: y, kind: Math.random() < .5 ? '/' : '\\' };
          d.mirrors.push(mir);
          d.grid[y][x] = mir;
          break;
        }
      }
    }

    /** Walk the beam and return the path plus whether it reached the target. */
    function trace(d) {
      var DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
      var x = d.source.x, y = d.source.y, dir = d.source.dir;
      var path = [{ x: x, y: y }];
      for (var step = 0; step < 200; step++) {
        x += DIRS[dir][0];
        y += DIRS[dir][1];
        if (x < 0 || y < 0 || x >= N || y >= N) return { path: path, hit: false, exit: { x: x, y: y } };
        path.push({ x: x, y: y });
        if (x === d.target.x && y === d.target.y) return { path: path, hit: true };
        var cell = d.grid[y][x];
        if (cell === 'wall') return { path: path, hit: false };
        if (cell && cell.kind) {
          // '/' maps right->up, up->right, left->down, down->left.
          if (cell.kind === '/') dir = [1, 0, 3, 2][dir];
          else dir = [3, 2, 1, 0][dir];
        }
      }
      return { path: path, hit: false };
    }

    return Milo.arcade(host, {
      id: 'laser-maze',
      w: W, h: H, bg: '#0a0d24',
      stats: ['Level', 'Moves', 'Mirrors'],
      emo: '🔦',
      start: {
        title: 'Laser Maze',
        text: 'Click a mirror to flip it and steer the beam from the emitter into the ' +
          'target. Walls block the beam entirely.',
        keys: ['Click a mirror to rotate it']
      },
      preload: function (g) { g.data.level = 1; },
      init: reset,

      onPointer: function (g, type, px, py) {
        if (type !== 'down' || g.state !== 'play' || g.data.solved) return;
        var d = g.data;
        var x = Math.floor((px - PAD) / CELL), y = Math.floor((py - PAD) / CELL);
        if (x < 0 || y < 0 || x >= N || y >= N) return;
        var cell = d.grid[y][x];
        if (!cell || !cell.kind) return;
        cell.kind = cell.kind === '/' ? '\\' : '/';
        d.moves++;
        g.set('Moves', d.moves);
        Milo.sound.click();

        if (trace(d).hit) {
          d.solved = true;
          var earned = Math.max(80, 600 - d.moves * 20) * d.level;
          g.score += earned;
          Milo.sound.win();
          d.level++;
          g.overlay({
            emo: '🔦', title: 'Target hit!',
            text: d.moves + ' flips — worth ' + U.fmt(earned) + ' points.',
            score: g.score, best: g.best,
            newBest: Milo.store.setBest('laser-maze', g.score),
            actions: [
              { label: 'Next maze →', primary: true, onClick: function () { next(g); } },
              { label: 'Start over', onClick: function () { g.data.level = 1; g.restart(); } }
            ]
          });
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.fillStyle = '#0a0d24'; c.fillRect(0, 0, W, H);

        for (var y = 0; y < N; y++) {
          for (var x = 0; x < N; x++) {
            c.fillStyle = (x + y) % 2 ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.015)';
            c.fillRect(PAD + x * CELL, PAD + y * CELL, CELL, CELL);
          }
        }

        var res = trace(d);
        c.strokeStyle = res.hit ? '#34d399' : '#fb7185';
        c.lineWidth = 4; c.lineCap = 'round'; c.lineJoin = 'round';
        c.shadowColor = c.strokeStyle; c.shadowBlur = 14;
        c.beginPath();
        res.path.forEach(function (p, i) {
          var px = PAD + p.x * CELL + CELL / 2, py = PAD + p.y * CELL + CELL / 2;
          i ? c.lineTo(px, py) : c.moveTo(px, py);
        });
        if (res.exit) {
          c.lineTo(PAD + res.exit.x * CELL + CELL / 2, PAD + res.exit.y * CELL + CELL / 2);
        }
        c.stroke();
        c.shadowBlur = 0;

        d.walls.forEach(function (w) {
          c.fillStyle = '#3a4275';
          U.roundRect(c, PAD + w.x * CELL + 5, PAD + w.y * CELL + 5, CELL - 10, CELL - 10, 6);
          c.fill();
        });

        d.mirrors.forEach(function (m) {
          var cx = PAD + m.x * CELL + CELL / 2, cy = PAD + m.y * CELL + CELL / 2;
          c.strokeStyle = '#e8ecff'; c.lineWidth = 6; c.lineCap = 'round';
          c.beginPath();
          if (m.kind === '/') {
            c.moveTo(cx - CELL * .3, cy + CELL * .3);
            c.lineTo(cx + CELL * .3, cy - CELL * .3);
          } else {
            c.moveTo(cx - CELL * .3, cy - CELL * .3);
            c.lineTo(cx + CELL * .3, cy + CELL * .3);
          }
          c.stroke();
        });

        var sx = PAD + d.source.x * CELL + CELL / 2, sy = PAD + d.source.y * CELL + CELL / 2;
        c.fillStyle = '#fb7185';
        U.roundRect(c, sx - CELL * .3, sy - CELL * .22, CELL * .6, CELL * .44, 6); c.fill();

        var tx = PAD + d.target.x * CELL + CELL / 2, ty = PAD + d.target.y * CELL + CELL / 2;
        c.strokeStyle = res.hit ? '#34d399' : '#ffd257';
        c.lineWidth = 4;
        c.beginPath(); c.arc(tx, ty, CELL * .3, 0, 7); c.stroke();
        c.beginPath(); c.arc(tx, ty, CELL * .14, 0, 7); c.stroke();

        c.fillStyle = 'rgba(255,255,255,.45)';
        c.font = '600 12px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText('Click a mirror to flip it', W / 2, H - 8);
      }
    });
  }

  window.Milo.register({
    id: 'laser-maze', title: 'Laser Maze', emo: '🔦', category: 'Puzzle',
    tagline: 'Bounce the beam into the target',
    description: 'A beam fires from the left and you steer it by flipping mirrors between ' +
      'their two diagonal orientations. The beam updates live as you click, so you can see ' +
      'exactly where it goes wrong. Walls stop it dead. Each level adds more mirrors and ' +
      'more obstacles.',
    controls: ['Click a mirror'],
    colors: ['#0a0d24', '#34d399'],
    tags: ['logic', 'light', 'brain', 'levels'],
    mount: mount
  });
})();
