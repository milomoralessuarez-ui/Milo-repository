/* Ice Slide — you slide until you hit something; reach the exit. */
(function () {
  'use strict';
  var W = 620, H = 620, N = 10;
  var CELL = Math.floor((W - 40) / N), PAD = (W - N * CELL) / 2;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.level = d.level || 1;
      build(d);
      d.moves = 0;
      d.done = false;
      g.set('Level', d.level);
      g.set('Moves', 0);
      g.set('Coins', d.coins.filter(function (c) { return !c.taken; }).length);
    }

    function build(d) {
      d.walls = [];
      for (var y = 0; y < N; y++) d.walls.push(new Array(N).fill(false));
      var count = Math.min(28, 8 + d.level * 2);
      for (var i = 0; i < count; i++) {
        d.walls[U.randInt(1, N - 2)][U.randInt(1, N - 2)] = true;
      }
      d.p = { x: 0, y: 0, px: 0, py: 0 };
      d.walls[0][0] = false;
      d.exit = { x: N - 1, y: N - 1 };
      d.walls[N - 1][N - 1] = false;
      d.coins = [];
      for (var k = 0; k < 3; k++) {
        var cx = U.randInt(0, N - 1), cy = U.randInt(0, N - 1);
        if (d.walls[cy][cx] || (cx === 0 && cy === 0)) continue;
        d.coins.push({ x: cx, y: cy, taken: false });
      }
      d.sliding = null;
    }

    function slide(g, dx, dy) {
      var d = g.data;
      if (d.done || d.sliding) return;
      var x = d.p.x, y = d.p.y, moved = 0;
      // Keep going until a wall or the edge stops you — that's the whole game.
      while (true) {
        var nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= N || ny >= N) break;
        if (d.walls[ny][nx]) break;
        x = nx; y = ny; moved++;
        if (x === d.exit.x && y === d.exit.y) break;
      }
      if (!moved) { Milo.sound.tone({ f: 140, d: .06, v: .04, type: 'square' }); return; }
      d.p.x = x; d.p.y = y;
      d.moves++;
      g.set('Moves', d.moves);
      Milo.sound.tone({ f: 500, f2: 320, d: .12, v: .05, type: 'sine' });

      d.coins.forEach(function (co) {
        if (!co.taken && co.x === x && co.y === y) {
          co.taken = true;
          g.score += 50;
          g.set('Coins', d.coins.filter(function (q) { return !q.taken; }).length);
          Milo.sound.coin();
        }
      });

      if (x === d.exit.x && y === d.exit.y) {
        d.done = true;
        var earned = Math.max(80, 500 - d.moves * 20) * d.level;
        g.score += earned;
        Milo.sound.win();
        d.level++;
        g.overlay({
          emo: '🧊', title: 'Reached the exit!',
          text: d.moves + ' slides — worth ' + U.fmt(earned) + ' points.',
          score: g.score, best: g.best,
          newBest: Milo.store.setBest('ice-slide', g.score),
          actions: [
            { label: 'Next floor →', primary: true, onClick: function () { next(g); } },
            { label: 'Start over', onClick: function () { g.data.level = 1; g.restart(); } }
          ]
        });
      }
    }

    function next(g) {
      g.clearOverlay();
      var keepScore = g.score, keepLevel = g.data.level;
      reset(g);
      g.data.level = keepLevel;
      g.score = keepScore;
      g.state = 'play';
      g.set('Level', keepLevel);
      g.best = Milo.store.best('ice-slide');
    }

    return Milo.arcade(host, {
      id: 'ice-slide',
      w: W, h: H, bg: '#0a1a2e',
      stats: ['Level', 'Moves', 'Coins'],
      touch: 'dpad',
      emo: '🧊',
      start: {
        title: 'Ice Slide',
        text: 'The floor is ice — once you push off you keep going until something stops ' +
          'you. Use the blocks to steer yourself to the exit, picking up coins on the way.',
        keys: ['Arrow keys / WASD']
      },
      preload: function (g) { g.data.level = 1; },
      init: reset,

      onKey: function (g, e) {
        var m = { ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1],
          ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0] }[e.code];
        if (m) { e.preventDefault(); slide(g, m[0], m[1]); }
      },

      update: function (g, dt) {
        var d = g.data, i = g.input;
        if (i.pressed('up')) slide(g, 0, -1);
        if (i.pressed('down')) slide(g, 0, 1);
        if (i.pressed('left')) slide(g, -1, 0);
        if (i.pressed('right')) slide(g, 1, 0);
        d.p.px += (d.p.x - d.p.px) * Math.min(1, dt * 12);
        d.p.py += (d.p.y - d.p.py) * Math.min(1, dt * 12);
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#123048'); bg.addColorStop(1, '#061422');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        for (var y = 0; y < N; y++) {
          for (var x = 0; x < N; x++) {
            var px = PAD + x * CELL, py = PAD + y * CELL;
            c.fillStyle = (x + y) % 2 ? 'rgba(190,230,255,.10)' : 'rgba(190,230,255,.05)';
            c.fillRect(px, py, CELL - 2, CELL - 2);
            if (d.walls[y][x]) {
              c.fillStyle = '#4a6b8a';
              U.roundRect(c, px + 3, py + 3, CELL - 8, CELL - 8, 5); c.fill();
              c.fillStyle = 'rgba(255,255,255,.14)';
              U.roundRect(c, px + 7, py + 7, CELL - 16, 5, 2); c.fill();
            }
          }
        }

        var ex = PAD + d.exit.x * CELL, ey = PAD + d.exit.y * CELL;
        c.strokeStyle = '#34d399'; c.lineWidth = 3;
        U.roundRect(c, ex + 5, ey + 5, CELL - 12, CELL - 12, 6); c.stroke();
        c.fillStyle = 'rgba(52,211,153,.2)';
        U.roundRect(c, ex + 5, ey + 5, CELL - 12, CELL - 12, 6); c.fill();

        d.coins.forEach(function (co) {
          if (co.taken) return;
          c.fillStyle = '#ffd257';
          c.beginPath();
          c.arc(PAD + co.x * CELL + CELL / 2, PAD + co.y * CELL + CELL / 2, CELL * .2, 0, 7);
          c.fill();
        });

        var pxx = PAD + d.p.px * CELL + CELL / 2, pyy = PAD + d.p.py * CELL + CELL / 2;
        c.shadowColor = '#22d3ee'; c.shadowBlur = 18;
        c.fillStyle = '#22d3ee';
        c.beginPath(); c.arc(pxx, pyy, CELL * .3, 0, 7); c.fill();
        c.shadowBlur = 0;
        c.fillStyle = '#062a33';
        c.beginPath();
        c.arc(pxx - CELL * .09, pyy - CELL * .05, CELL * .05, 0, 7);
        c.arc(pxx + CELL * .09, pyy - CELL * .05, CELL * .05, 0, 7);
        c.fill();

        c.fillStyle = 'rgba(255,255,255,.42)';
        c.font = '600 12px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText('You slide until something stops you', W / 2, H - 8);
      }
    });
  }

  window.Milo.register({
    id: 'ice-slide', title: 'Ice Slide', emo: '🧊', category: 'Puzzle',
    tagline: 'You can’t stop until you hit something',
    description: 'Push off in a direction and you slide across the ice until a block or a ' +
      'wall stops you — you cannot choose where to halt. Reaching the exit means using the ' +
      'blocks as brakes, and picking up the coins usually means taking the long way round. ' +
      'Every floor scatters more obstacles.',
    controls: ['Arrow keys', 'WASD', 'Touch pad'],
    colors: ['#0a1a2e', '#22d3ee'],
    tags: ['sliding', 'logic', 'brain', 'levels'],
    mount: mount
  });
})();
