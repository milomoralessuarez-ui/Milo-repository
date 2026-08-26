/* Ghost Escape — outrun four hunters through a dark maze with a torch and a hiding place. */
(function () {
  'use strict';
  var W = 760, H = 640, CELL = 34, COLS = 21, ROWS = 15;
  var OX = (W - COLS * CELL) / 2, OY = 74;
  var SPEED = 3.4, GHOST_SPEED = 2.5;
  var GHOST_COLORS = ['#e0553f', '#e88fd0', '#5fd8e8', '#e8a44a'];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    /** A braided maze: carved by backtracker, then opened up so it has loops to escape through. */
    function carve(d) {
      var g = [];
      var r, c;
      for (r = 0; r < ROWS; r++) { g.push(new Array(COLS).fill(1)); }
      var stack = [[1, 1]];
      g[1][1] = 0;
      while (stack.length) {
        var cur = stack[stack.length - 1];
        var opts = [];
        [[2, 0], [-2, 0], [0, 2], [0, -2]].forEach(function (o) {
          var nx = cur[0] + o[0], ny = cur[1] + o[1];
          if (nx > 0 && nx < COLS - 1 && ny > 0 && ny < ROWS - 1 && g[ny][nx] === 1) opts.push(o);
        });
        if (!opts.length) { stack.pop(); continue; }
        var pick = U.choice(opts);
        g[cur[1] + pick[1] / 2][cur[0] + pick[0] / 2] = 0;
        g[cur[1] + pick[1]][cur[0] + pick[0]] = 0;
        stack.push([cur[0] + pick[0], cur[1] + pick[1]]);
      }
      // Loops matter more than the maze here — a dead end with a ghost in it is a death sentence.
      for (var i = 0; i < 45; i++) {
        var x = 1 + U.randInt(0, COLS - 3), y = 1 + U.randInt(0, ROWS - 3);
        if (x > 0 && x < COLS - 1 && y > 0 && y < ROWS - 1) g[y][x] = 0;
      }
      d.grid = g;
    }

    function wall(d, x, y) {
      if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return true;
      return d.grid[y][x] === 1;
    }

    function openCells(d) {
      var out = [];
      for (var r = 1; r < ROWS - 1; r++) for (var c = 1; c < COLS - 1; c++) if (!d.grid[r][c]) out.push([c, r]);
      return out;
    }

    function reset(g) {
      var d = g.data;
      carve(d);
      var cells = openCells(d);
      d.px = 1.5; d.py = 1.5;
      d.dir = { x: 1, y: 0 };
      d.orbs = [];
      d.closets = [];
      var far = cells.filter(function (p) { return p[0] + p[1] > 8; });
      U.shuffle(far);
      var i;
      for (i = 0; i < Math.min(28, far.length); i++) d.orbs.push({ c: far[i][0], r: far[i][1], got: false });
      for (i = 28; i < Math.min(31, far.length); i++) d.closets.push({ c: far[i][0], r: far[i][1] });

      d.ghosts = [];
      for (i = 0; i < 4; i++) {
        var spot = far[far.length - 1 - i] || [COLS - 2, ROWS - 2];
        d.ghosts.push({
          x: spot[0] + .5, y: spot[1] + .5,
          dx: 0, dy: 0, color: GHOST_COLORS[i],
          think: 0, scatter: i * 1.4, panic: 0
        });
      }

      d.torch = 6;
      d.hidden = 0;
      d.hideCool = 0;
      d.lives = d.lives == null ? 3 : d.lives;
      d.left = d.orbs.length;
      d.dead = 0;
      d.parts = [];
      d.time = 0;
      g.set('Orbs', '0/' + d.orbs.length);
      g.set('Torch', Math.ceil(d.torch) + 's');
      g.set('Lives', d.lives);
      g.set('Best', g.best ? U.fmt(g.best) : '—');
    }

    function burst(d, x, y, color, n) {
      for (var i = 0; i < n; i++) {
        var a = U.rand(0, Math.PI * 2), s = U.rand(30, 120);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(.3, .7), c: color });
      }
    }

    function caught(g) {
      var d = g.data;
      if (d.dead > 0 || d.hidden > 0) return;
      d.dead = 1.3;
      d.lives--;
      burst(d, OX + d.px * CELL, OY + d.py * CELL, '#8fb8ff', 24);
      Milo.sound.explode();
      g.set('Lives', Math.max(0, d.lives));
    }

    /** Ghosts step cell to cell, choosing the exit that most reduces distance to the target. */
    function ghostStep(d, gh, dt, target) {
      var cx = Math.floor(gh.x), cy = Math.floor(gh.y);
      var atCentre = Math.abs(gh.x - (cx + .5)) < .06 && Math.abs(gh.y - (cy + .5)) < .06;
      if (atCentre || (!gh.dx && !gh.dy)) {
        gh.x = cx + .5; gh.y = cy + .5;
        var opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(function (o) {
          // No instant reversals, which is what makes them feel like they are hunting.
          if (o[0] === -gh.dx && o[1] === -gh.dy) return false;
          return !wall(d, cx + o[0], cy + o[1]);
        });
        if (!opts.length) opts = [[-gh.dx, -gh.dy]];
        opts.sort(function (a, b) {
          var da = U.dist(cx + a[0], cy + a[1], target.x, target.y);
          var db = U.dist(cx + b[0], cy + b[1], target.x, target.y);
          return da - db;
        });
        var pick = Math.random() < .8 ? opts[0] : U.choice(opts);
        gh.dx = pick[0]; gh.dy = pick[1];
      }
      var sp = GHOST_SPEED * (gh.panic > 0 ? .55 : 1) * dt;
      var nx = gh.x + gh.dx * sp, ny = gh.y + gh.dy * sp;
      if (!wall(d, Math.floor(nx + gh.dx * .35), Math.floor(ny + gh.dy * .35))) { gh.x = nx; gh.y = ny; }
      else { gh.x = Math.floor(gh.x) + .5; gh.y = Math.floor(gh.y) + .5; gh.dx = 0; gh.dy = 0; }
    }

    return Milo.arcade(host, {
      id: 'ghost-escape',
      w: W, h: H, bg: '#07070f',
      stats: ['Score', 'Orbs', 'Torch', 'Lives', 'Best'],
      emo: '👻',
      trackBest: true,
      touch: 'dpad+a',
      start: {
        title: 'Ghost Escape',
        text: 'Collect every orb in the dark. Your torch only shows a small circle and it is ' +
          'burning down — orbs refill it. Stand on a wardrobe and hold Space to hide as they pass.',
        keys: ['Arrows / WASD to move', 'Space on a wardrobe to hide']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, input = g.input;
        var i;

        for (i = d.parts.length - 1; i >= 0; i--) {
          var pt = d.parts[i];
          pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.life -= dt;
          if (pt.life <= 0) d.parts.splice(i, 1);
        }

        if (d.dead > 0) {
          d.dead -= dt;
          if (d.dead <= 0) {
            if (d.lives <= 0) {
              g.gameOver({
                emo: '👻', title: 'They found you',
                text: d.left + ' orb' + (d.left === 1 ? '' : 's') + ' left in the dark.',
                score: g.score
              });
              return;
            }
            d.px = 1.5; d.py = 1.5;
            d.torch = Math.max(d.torch, 5);
            // Scatter the ghosts on a respawn so you are not caught the instant you return.
            d.ghosts.forEach(function (gh) { gh.panic = 3; gh.scatter = 3; });
          }
          return;
        }

        d.time += dt;

        // --- hiding -------------------------------------------------------------
        var onCloset = d.closets.some(function (cl) {
          return Math.floor(d.px) === cl.c && Math.floor(d.py) === cl.r;
        });
        d.hideCool = Math.max(0, d.hideCool - dt);
        if (onCloset && (input.down('action') || input.down('a')) && d.hideCool <= 0) {
          d.hidden = Math.min(d.hidden + dt, 3);
          if (d.hidden >= 3) { d.hidden = 3; d.hideCool = 2.5; }
        } else if (d.hidden > 0) {
          d.hidden = Math.max(0, d.hidden - dt * 2);
          if (d.hidden <= 0) d.hideCool = 1.2;
        }

        // --- movement ------------------------------------------------------------
        if (d.hidden <= 0) {
          var mx = 0, my = 0;
          if (input.down('left')) mx = -1;
          else if (input.down('right')) mx = 1;
          else if (input.down('up')) my = -1;
          else if (input.down('down')) my = 1;
          if (mx || my) {
            d.dir = { x: mx, y: my };
            var step = SPEED * dt;
            var nx = d.px + mx * step, ny = d.py + my * step;
            var pad = .32;
            if (!wall(d, Math.floor(nx + mx * pad), Math.floor(d.py - pad)) &&
              !wall(d, Math.floor(nx + mx * pad), Math.floor(d.py + pad))) d.px = nx;
            if (!wall(d, Math.floor(d.px - pad), Math.floor(ny + my * pad)) &&
              !wall(d, Math.floor(d.px + pad), Math.floor(ny + my * pad))) d.py = ny;
          }
        }

        // --- torch ---------------------------------------------------------------
        d.torch -= dt * (d.hidden > 0 ? .35 : 1);
        if (d.torch <= 0) {
          d.torch = 0;
          // In total darkness the ghosts always know where you are.
          d.ghosts.forEach(function (gh) { gh.panic = 0; });
        }
        g.set('Torch', Math.ceil(d.torch) + 's');

        // --- orbs -----------------------------------------------------------------
        d.orbs.forEach(function (o) {
          if (o.got) return;
          if (U.dist(d.px, d.py, o.c + .5, o.r + .5) < .55) {
            o.got = true;
            d.left--;
            d.torch = Math.min(12, d.torch + 2.2);
            g.score += 120;
            g.set('Score', g.score);
            g.set('Orbs', (d.orbs.length - d.left) + '/' + d.orbs.length);
            burst(d, OX + (o.c + .5) * CELL, OY + (o.r + .5) * CELL, '#ffe08a', 8);
            Milo.sound.coin();
            // Every few orbs sends them scattering, which is your window to move.
            if (d.left % 7 === 0) {
              d.ghosts.forEach(function (gh) { gh.panic = 4; });
              Milo.sound.powerup();
            }
          }
        });

        if (d.left === 0) {
          g.win({
            emo: '👻', title: 'Escaped with every orb',
            text: 'Cleared in ' + U.time(d.time) + ' with ' + d.lives + ' live' + (d.lives === 1 ? '' : 's') + ' left.',
            score: g.score + 800 + d.lives * 250
          });
          return;
        }

        // --- ghosts ----------------------------------------------------------------
        d.ghosts.forEach(function (gh, idx) {
          if (gh.panic > 0) gh.panic -= dt;
          if (gh.scatter > 0) gh.scatter -= dt;

          var target;
          if (gh.panic > 0) {
            // Panicked ghosts run for the corners instead of at you.
            target = { x: idx % 2 ? COLS - 2 : 1, y: idx < 2 ? 1 : ROWS - 2 };
          } else if (d.hidden > 0) {
            // While you are hidden they patrol the last place they saw you.
            target = { x: gh.lastX == null ? d.px : gh.lastX, y: gh.lastY == null ? d.py : gh.lastY };
          } else {
            gh.lastX = d.px; gh.lastY = d.py;
            // Each ghost aims a little differently so they surround rather than queue up.
            target = idx === 0 ? { x: d.px, y: d.py }
              : idx === 1 ? { x: d.px + d.dir.x * 3, y: d.py + d.dir.y * 3 }
                : idx === 2 ? { x: d.px - d.dir.x * 2, y: d.py - d.dir.y * 2 }
                  : { x: d.px + U.rand(-2, 2), y: d.py + U.rand(-2, 2) };
          }
          ghostStep(d, gh, dt, target);

          if (d.hidden <= 0 && U.dist(gh.x, gh.y, d.px, d.py) < .6) caught(g);
        });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.fillStyle = '#07070f'; c.fillRect(0, 0, W, H);

        // Torch radius shrinks as it burns down, which is the whole tension of the game.
        var radius = (2.4 + d.torch * .55) * CELL;
        var lightX = OX + d.px * CELL, lightY = OY + d.py * CELL;

        c.save();
        c.beginPath();
        c.rect(OX, OY, COLS * CELL, ROWS * CELL);
        c.clip();

        for (var r = 0; r < ROWS; r++) {
          for (var cc = 0; cc < COLS; cc++) {
            var x = OX + cc * CELL, y = OY + r * CELL;
            // Cheap per-tile falloff: far tiles simply are not drawn.
            var dd = U.dist(x + CELL / 2, y + CELL / 2, lightX, lightY);
            if (dd > radius + CELL) continue;
            var lit = U.clamp(1 - dd / radius, 0, 1);
            if (d.grid[r][cc]) {
              c.fillStyle = 'rgba(70,84,140,' + (.18 + lit * .72) + ')';
              U.roundRect(c, x + 1, y + 1, CELL - 2, CELL - 2, 4); c.fill();
            } else {
              c.fillStyle = 'rgba(24,26,48,' + (.25 + lit * .6) + ')';
              c.fillRect(x, y, CELL, CELL);
            }
          }
        }

        d.closets.forEach(function (cl) {
          var x = OX + cl.c * CELL, y = OY + cl.r * CELL;
          if (U.dist(x + CELL / 2, y + CELL / 2, lightX, lightY) > radius + CELL) return;
          c.fillStyle = '#7a5a34';
          U.roundRect(c, x + 5, y + 3, CELL - 10, CELL - 6, 3); c.fill();
          c.strokeStyle = '#5a4226';
          c.lineWidth = 2;
          c.beginPath(); c.moveTo(x + CELL / 2, y + 4); c.lineTo(x + CELL / 2, y + CELL - 4); c.stroke();
          c.fillStyle = '#d8b878';
          c.fillRect(x + CELL / 2 - 4, y + CELL / 2 - 1, 2, 4);
          c.fillRect(x + CELL / 2 + 2, y + CELL / 2 - 1, 2, 4);
        });

        d.orbs.forEach(function (o) {
          if (o.got) return;
          var x = OX + (o.c + .5) * CELL, y = OY + (o.r + .5) * CELL;
          if (U.dist(x, y, lightX, lightY) > radius) return;
          var pulse = .7 + Math.sin(g.t * 4 + o.c) * .25;
          c.fillStyle = 'rgba(255,224,138,' + pulse + ')';
          c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fill();
          c.fillStyle = 'rgba(255,240,190,.35)';
          c.beginPath(); c.arc(x, y, 9, 0, Math.PI * 2); c.fill();
        });

        d.ghosts.forEach(function (gh) {
          var x = OX + gh.x * CELL, y = OY + gh.y * CELL;
          var dd = U.dist(x, y, lightX, lightY);
          // A ghost just outside the torch is a faint shape — enough warning to turn around.
          var vis = dd < radius ? 1 : dd < radius + CELL * 2.5 ? .32 : 0;
          if (vis <= 0) return;
          c.globalAlpha = vis * (gh.panic > 0 ? .6 : 1);
          c.fillStyle = gh.panic > 0 ? '#5566cc' : gh.color;
          c.beginPath();
          c.arc(x, y - 2, CELL * .36, Math.PI, 0);
          c.lineTo(x + CELL * .36, y + CELL * .3);
          for (var k = 0; k < 3; k++) {
            c.lineTo(x + CELL * .36 - (k * 2 + 1) * CELL * .12, y + CELL * .3 - (k % 2 ? 0 : CELL * .12));
          }
          c.lineTo(x - CELL * .36, y + CELL * .3);
          c.closePath(); c.fill();
          c.fillStyle = '#fff';
          c.beginPath(); c.arc(x - 5, y - 4, 4, 0, Math.PI * 2); c.fill();
          c.beginPath(); c.arc(x + 5, y - 4, 4, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#12142a';
          c.beginPath(); c.arc(x - 5 + gh.dx * 1.7, y - 4 + gh.dy * 1.7, 2, 0, Math.PI * 2); c.fill();
          c.beginPath(); c.arc(x + 5 + gh.dx * 1.7, y - 4 + gh.dy * 1.7, 2, 0, Math.PI * 2); c.fill();
          c.globalAlpha = 1;
        });

        if (d.dead <= 0) {
          c.globalAlpha = d.hidden > 0 ? .3 : 1;
          c.fillStyle = '#ffe9c4';
          c.beginPath(); c.arc(lightX, lightY, CELL * .32, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#2b2438';
          c.beginPath(); c.arc(lightX - 4 + d.dir.x * 2, lightY - 3 + d.dir.y * 2, 2.2, 0, Math.PI * 2); c.fill();
          c.beginPath(); c.arc(lightX + 4 + d.dir.x * 2, lightY - 3 + d.dir.y * 2, 2.2, 0, Math.PI * 2); c.fill();
          c.globalAlpha = 1;
          // The torch cone points where you are facing.
          var grd = c.createRadialGradient(lightX, lightY, CELL * .4, lightX, lightY, radius);
          grd.addColorStop(0, 'rgba(255,230,170,.16)');
          grd.addColorStop(1, 'rgba(255,230,170,0)');
          c.fillStyle = grd;
          c.beginPath(); c.arc(lightX, lightY, radius, 0, Math.PI * 2); c.fill();
        }

        d.parts.forEach(function (pt) {
          c.globalAlpha = Math.max(0, pt.life * 1.6);
          c.fillStyle = pt.c;
          c.fillRect(pt.x - 2, pt.y - 2, 4, 4);
        });
        c.globalAlpha = 1;
        c.restore();

        // Torch gauge, so a dying light is never a surprise.
        var frac = U.clamp(d.torch / 12, 0, 1);
        c.fillStyle = 'rgba(255,255,255,.15)';
        U.roundRect(c, OX, 34, COLS * CELL, 10, 5); c.fill();
        c.fillStyle = frac < .2 ? '#e0553f' : frac < .45 ? '#e8a44a' : '#ffe08a';
        U.roundRect(c, OX, 34, COLS * CELL * frac, 10, 5); c.fill();

        if (d.hidden > 0) {
          c.fillStyle = 'rgba(0,0,0,.55)';
          U.roundRect(c, W / 2 - 90, H - 44, 180, 28, 8); c.fill();
          c.fillStyle = '#8ef0a8';
          c.font = '600 14px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText('Hidden — ' + (3 - d.hidden).toFixed(1) + 's left', W / 2, H - 25);
        } else if (d.hideCool > 0) {
          c.fillStyle = 'rgba(255,255,255,.4)';
          c.font = '600 12px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText('Catching your breath…', W / 2, H - 26);
        }
      }
    });
  }

  window.Milo.register({
    id: 'ghost-escape', title: 'Ghost Escape', emo: '👻', category: 'Arcade',
    tagline: 'A torch, a maze, and four things chasing you',
    description: 'A maze you can barely see. Your torch lights a small circle and burns down the ' +
      'whole time — the orbs you are collecting are also the only thing that refuels it, so ' +
      'standing still is never an option. Four hunters roam the halls and none of them chases ' +
      'the same way: one comes straight at you, one cuts ahead of where you are going, one ' +
      'circles behind, and one wanders. Wardrobes scattered through the maze let you vanish for ' +
      'three seconds while they search the last place they saw you.',
    controls: ['Arrows / WASD to move', 'Hold Space on a wardrobe to hide'],
    colors: ['#181a30', '#ffe08a'],
    tags: ['maze', 'chase', 'stealth', 'arcade'],
    mount: mount
  });
})();
