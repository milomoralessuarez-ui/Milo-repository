/* Maze Runner — generated mazes, lantern-lit, growing every level. */
(function () {
  'use strict';
  var W = 720, H = 560;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.level = d.level || 1;
      var size = Math.min(23, 9 + (d.level - 1) * 2);
      d.cols = size; d.rows = size;
      d.cell = Math.floor(Math.min((W - 40) / d.cols, (H - 40) / d.rows));
      d.ox = (W - d.cols * d.cell) / 2;
      d.oy = (H - d.rows * d.cell) / 2;
      generate(d);
      d.p = { x: 0, y: 0, px: 0, py: 0, moveT: 0 };
      d.exit = { x: d.cols - 1, y: d.rows - 1 };
      d.time = 0;
      d.steps = 0;
      d.trail = [];
      d.done = false;
      g.set('Level', d.level);
      g.set('Time', '0:00');
      g.set('Best', g.best ? U.fmt(g.best) : '—');
    }

    /** Recursive-backtracker maze. walls[i] is a 4-bit mask: N E S W. */
    function generate(d) {
      var n = d.cols * d.rows;
      d.walls = new Array(n).fill(15);
      var seen = new Array(n).fill(false);
      var stack = [0];
      seen[0] = true;
      var DIRS = [{ dx: 0, dy: -1, bit: 1, opp: 4 }, { dx: 1, dy: 0, bit: 2, opp: 8 },
      { dx: 0, dy: 1, bit: 4, opp: 1 }, { dx: -1, dy: 0, bit: 8, opp: 2 }];
      while (stack.length) {
        var cur = stack[stack.length - 1];
        var cx = cur % d.cols, cy = (cur / d.cols) | 0;
        var options = [];
        DIRS.forEach(function (dir) {
          var nx = cx + dir.dx, ny = cy + dir.dy;
          if (nx < 0 || ny < 0 || nx >= d.cols || ny >= d.rows) return;
          var ni = ny * d.cols + nx;
          if (!seen[ni]) options.push({ ni: ni, dir: dir });
        });
        if (!options.length) { stack.pop(); continue; }
        var pick = U.choice(options);
        d.walls[cur] &= ~pick.dir.bit;
        d.walls[pick.ni] &= ~pick.dir.opp;
        seen[pick.ni] = true;
        stack.push(pick.ni);
      }
    }

    function canMove(d, x, y, dx, dy) {
      var i = y * d.cols + x;
      if (dx === 1) return !(d.walls[i] & 2);
      if (dx === -1) return !(d.walls[i] & 8);
      if (dy === 1) return !(d.walls[i] & 4);
      if (dy === -1) return !(d.walls[i] & 1);
      return false;
    }

    function step(g, dx, dy) {
      var d = g.data, p = d.p;
      if (d.done || g.state !== 'play') return;
      var nx = p.x + dx, ny = p.y + dy;
      if (nx < 0 || ny < 0 || nx >= d.cols || ny >= d.rows) return;
      if (!canMove(d, p.x, p.y, dx, dy)) { Milo.sound.tone({ f: 120, d: .05, v: .05, type: 'square' }); return; }
      d.trail.push({ x: p.x, y: p.y, t: 1 });
      p.x = nx; p.y = ny;
      d.steps++;
      Milo.sound.tone({ f: 300 + Math.random() * 60, d: .04, v: .04, type: 'triangle' });

      if (p.x === d.exit.x && p.y === d.exit.y) {
        d.done = true;
        var earned = Math.max(50, 900 - Math.round(d.time) * 8) * d.level;
        g.score += earned;
        Milo.sound.win();
        d.level++;
        g.overlay({
          emo: '🏁',
          title: 'Level ' + (d.level - 1) + ' cleared',
          text: U.time(d.time) + ' · ' + d.steps + ' steps · +' + U.fmt(earned) + ' points',
          score: g.score,
          best: g.best,
          newBest: Milo.store.setBest('maze-runner', g.score),
          actions: [
            { label: 'Next maze →', primary: true, onClick: function () { nextLevel(g); } },
            { label: 'Start over', onClick: function () { g.data.level = 1; g.restart(); } }
          ]
        });
      }
    }

    function nextLevel(g) {
      g.clearOverlay();
      var keepScore = g.score, keepLevel = g.data.level;
      reset(g);
      g.data.level = keepLevel;
      g.score = keepScore;
      g.state = 'play';
      g.set('Level', keepLevel);
      g.best = Milo.store.best('maze-runner');
    }

    return Milo.arcade(host, {
      id: 'maze-runner',
      w: W, h: H, bg: '#070a1c',
      stats: ['Level', 'Time', 'Best'],
      touch: 'dpad',
      emo: '🌀',
      start: {
        title: 'Maze Runner',
        text: 'Find your way from the top-left corner to the glowing exit. Your ' +
          'lantern only lights the way so far — and every maze is bigger than the last.',
        keys: ['Arrow keys / WASD', 'Touch pad']
      },
      preload: function (g) { g.data.level = 1; },
      init: reset,
      onKey: function (g, e) {
        var m = {
          ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1],
          ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0]
        }[e.code];
        if (m) { e.preventDefault(); step(g, m[0], m[1]); }
      },

      update: function (g, dt) {
        var d = g.data;
        if (d.done) return;
        d.time += dt;
        g.set('Time', U.time(d.time));

        // Held direction auto-repeats so long corridors aren't tedious.
        d.rep = (d.rep || 0) - dt;
        if (d.rep <= 0) {
          var i = g.input;
          if (i.down('up')) { step(g, 0, -1); d.rep = .12; }
          else if (i.down('down')) { step(g, 0, 1); d.rep = .12; }
          else if (i.down('left')) { step(g, -1, 0); d.rep = .12; }
          else if (i.down('right')) { step(g, 1, 0); d.rep = .12; }
        }

        d.trail = d.trail.filter(function (t) { t.t -= dt * .5; return t.t > 0; });

        var p = d.p;
        p.px += (p.x - p.px) * Math.min(1, dt * 16);
        p.py += (p.y - p.py) * Math.min(1, dt * 16);
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.fillStyle = '#070a1c'; c.fillRect(0, 0, W, H);
        var cs = d.cell, ox = d.ox, oy = d.oy;
        var p = d.p;
        var lightR = cs * (5.2 - Math.min(2.2, d.level * .16));

        // exit glow
        var ex = ox + d.exit.x * cs + cs / 2, ey = oy + d.exit.y * cs + cs / 2;
        var eg = c.createRadialGradient(ex, ey, 0, ex, ey, cs * 2.2);
        eg.addColorStop(0, 'rgba(52,211,153,.55)');
        eg.addColorStop(1, 'rgba(52,211,153,0)');
        c.fillStyle = eg;
        c.fillRect(ex - cs * 2.2, ey - cs * 2.2, cs * 4.4, cs * 4.4);

        d.trail.forEach(function (t) {
          c.globalAlpha = t.t * .3;
          c.fillStyle = '#7c5cff';
          c.fillRect(ox + t.x * cs + cs * .34, oy + t.y * cs + cs * .34, cs * .32, cs * .32);
        });
        c.globalAlpha = 1;

        // walls
        c.strokeStyle = '#4b57b8';
        c.lineWidth = Math.max(2, cs * .09);
        c.lineCap = 'round';
        c.beginPath();
        for (var y = 0; y < d.rows; y++) {
          for (var x = 0; x < d.cols; x++) {
            var w = d.walls[y * d.cols + x];
            var X = ox + x * cs, Y = oy + y * cs;
            if (w & 1) { c.moveTo(X, Y); c.lineTo(X + cs, Y); }
            if (w & 2) { c.moveTo(X + cs, Y); c.lineTo(X + cs, Y + cs); }
            if (w & 4) { c.moveTo(X, Y + cs); c.lineTo(X + cs, Y + cs); }
            if (w & 8) { c.moveTo(X, Y); c.lineTo(X, Y + cs); }
          }
        }
        c.stroke();

        // exit marker
        c.fillStyle = '#34d399';
        U.roundRect(c, ex - cs * .26, ey - cs * .26, cs * .52, cs * .52, cs * .12);
        c.fill();

        // player
        var px = ox + p.px * cs + cs / 2, py = oy + p.py * cs + cs / 2;
        c.shadowColor = '#ffd257'; c.shadowBlur = 22;
        c.fillStyle = '#ffd257';
        c.beginPath(); c.arc(px, py, cs * .27, 0, 7); c.fill();
        c.shadowBlur = 0;

        // lantern vignette — darkens everything outside the lit radius
        var vg = c.createRadialGradient(px, py, lightR * .35, px, py, lightR);
        vg.addColorStop(0, 'rgba(7,10,28,0)');
        vg.addColorStop(1, 'rgba(7,10,28,.94)');
        c.fillStyle = vg;
        c.fillRect(0, 0, W, H);
      }
    });
  }

  window.Milo.register({
    id: 'maze-runner', title: 'Maze Runner', emo: '🌀', category: 'Puzzle',
    tagline: 'Escape mazes by lantern-light',
    description: 'Start top-left, reach the green exit bottom-right. Each maze is ' +
      'generated fresh, and your lantern lights only the corridors near you — so you ' +
      'are mapping it as you go. Clear a maze and the next one is larger and darker.',
    controls: ['Arrow keys', 'WASD', 'Touch pad'],
    colors: ['#4b57b8', '#34d399'],
    tags: ['maze', 'exploration', 'levels', 'brain'],
    mount: mount
  });
})();
