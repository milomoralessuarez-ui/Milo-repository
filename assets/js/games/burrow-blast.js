/* Burrow Blast — tunnel through the dirt, pump up the crawlers, drop rocks on the rest. */
(function () {
  'use strict';
  var CELL = 34, COLS = 22, ROWS = 16, SKY = 2;
  var W = COLS * CELL, H = ROWS * CELL;
  var SPEED = 4.4, FOE_SPEED = 2.5, PUMP_MAX = 4;
  var DIRT = 1, AIR = 0, ROCK = 2;
  var BANDS = ['#8a5a32', '#7a4f2c', '#6a4526', '#5a3b20'];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function tileAt(d, x, y) {
      var c = Math.floor(x / CELL), r = Math.floor(y / CELL);
      if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return DIRT;
      return d.map[r * COLS + c];
    }

    function setTile(d, c, r, v) {
      if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return;
      d.map[r * COLS + c] = v;
    }

    /** Carving is a disc, so tunnels are wide enough to turn around in. */
    function carve(d, x, y) {
      var cc = Math.floor(x / CELL), cr = Math.floor(y / CELL), dug = 0;
      for (var r = cr - 1; r <= cr + 1; r++) {
        for (var c = cc - 1; c <= cc + 1; c++) {
          if (c < 0 || c >= COLS || r < 0 || r >= ROWS) continue;
          if (d.map[r * COLS + c] !== DIRT) continue;
          var dx = (c + .5) * CELL - x, dy = (r + .5) * CELL - y;
          if (dx * dx + dy * dy > CELL * CELL * 1.05) continue;
          d.map[r * COLS + c] = AIR;
          dug++;
        }
      }
      return dug;
    }

    function open(d, x, y) {
      // A body-sized probe at four points keeps the digger from clipping corners.
      var rad = CELL * .34;
      return tileAt(d, x - rad, y - rad) !== DIRT && tileAt(d, x + rad, y - rad) !== DIRT &&
        tileAt(d, x - rad, y + rad) !== DIRT && tileAt(d, x + rad, y + rad) !== DIRT;
    }

    function reset(g) {
      var d = g.data;
      d.map = new Uint8Array(COLS * ROWS);
      var r, c;
      for (r = 0; r < ROWS; r++) {
        for (c = 0; c < COLS; c++) d.map[r * COLS + c] = r < SKY ? AIR : DIRT;
      }
      // A few starter shafts so the first seconds are movement, not grinding.
      for (r = SKY; r < ROWS - 2; r++) { setTile(d, 3, r, AIR); setTile(d, COLS - 4, r, AIR); }
      for (c = 3; c < COLS - 3; c++) setTile(d, c, Math.floor(ROWS / 2), AIR);

      d.rocks = [];
      for (var i = 0; i < 5; i++) {
        var rc = 2 + i * 4 + U.randInt(0, 1), rr = SKY + 2 + U.randInt(0, ROWS - SKY - 7);
        if (rc >= COLS - 1) rc = COLS - 2;
        setTile(d, rc, rr, ROCK);
        d.rocks.push({ c: rc, r: rr, falling: false, y: (rr + .5) * CELL, vy: 0, dead: false, wobble: 0 });
      }

      d.px = 3.5 * CELL;
      d.py = (SKY + .5) * CELL;
      d.dir = { x: 0, y: 1 };
      d.face = 'down';
      d.foes = [];
      d.level = d.level || 1;
      d.pump = null;
      d.parts = [];
      d.shake = 0;
      d.lives = d.lives == null ? 3 : d.lives;
      d.dead = 0;
      d.clearedAt = 0;
      spawnFoes(d);
      g.set('Score', 0);
      g.set('Level', d.level);
      g.set('Lives', d.lives);
      g.set('Best', g.best ? U.fmt(g.best) : '—');
    }

    function spawnFoes(d) {
      d.foes = [];
      var count = Math.min(3 + d.level, 8);
      for (var i = 0; i < count; i++) {
        var c = 2 + ((i * 5 + 3) % (COLS - 4));
        var r = SKY + 3 + ((i * 3) % (ROWS - SKY - 5));
        // Carve a pocket so nothing spawns fused into solid dirt.
        setTile(d, c, r, AIR);
        d.foes.push({
          x: (c + .5) * CELL, y: (r + .5) * CELL,
          dx: U.choice([-1, 1]), dy: 0,
          kind: i % 4 === 3 ? 'drake' : 'crawler',
          inflate: 0, ghost: 0, ghostCool: U.rand(3, 9),
          dead: false, breath: 0, think: 0
        });
      }
    }

    function burst(d, x, y, color, n) {
      for (var i = 0; i < n; i++) {
        var a = U.rand(0, Math.PI * 2), s = U.rand(40, 170);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(.3, .7), c: color });
      }
    }

    function loseLife(g) {
      var d = g.data;
      if (d.dead > 0) return;
      d.dead = 1.2;
      d.lives--;
      d.shake = .5;
      burst(d, d.px, d.py, '#7fd4ff', 22);
      Milo.sound.explode();
      g.set('Lives', Math.max(0, d.lives));
    }

    function nextLevel(g) {
      var d = g.data;
      d.level++;
      g.score += 500;
      g.set('Score', g.score);
      var lives = d.lives;
      var level = d.level;
      reset(g);
      d.lives = lives;
      d.level = level;
      g.set('Score', g.score);
      g.set('Level', d.level);
      g.set('Lives', d.lives);
      Milo.sound.win();
    }

    return Milo.arcade(host, {
      id: 'burrow-blast',
      w: W, h: H, bg: '#1a1108',
      stats: ['Score', 'Level', 'Lives', 'Best'],
      emo: '⛏️',
      trackBest: true,
      touch: 'dpad+a',
      start: {
        title: 'Burrow Blast',
        text: 'Dig your own tunnels through the earth. Face a crawler and hold the pump to ' +
          'inflate it until it pops — or dig out the ground beneath a boulder and let it fall.',
        keys: ['Arrows / WASD to dig and move', 'Space to pump the creature in front of you']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, input = g.input;
        var i;

        for (i = d.parts.length - 1; i >= 0; i--) {
          var pt = d.parts[i];
          pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 320 * dt; pt.life -= dt;
          if (pt.life <= 0) d.parts.splice(i, 1);
        }
        if (d.shake > 0) d.shake -= dt;

        if (d.dead > 0) {
          d.dead -= dt;
          if (d.dead <= 0) {
            if (d.lives <= 0) {
              g.gameOver({ emo: '⛏️', title: 'Out of diggers', text: 'You reached level ' + d.level + '.', score: g.score });
              return;
            }
            // Respawn at the top of the left shaft with the tunnels left as they were.
            d.px = 3.5 * CELL; d.py = (SKY + .5) * CELL;
            d.dir = { x: 0, y: 1 }; d.face = 'down';
            d.pump = null;
            d.foes.forEach(function (f) { f.inflate = 0; f.ghost = 0; });
          }
          return;
        }

        if (d.clearedAt > 0) {
          d.clearedAt -= dt;
          if (d.clearedAt <= 0) nextLevel(g);
          return;
        }

        // --- digger movement -------------------------------------------------
        var mx = 0, my = 0;
        if (input.down('left')) mx = -1;
        else if (input.down('right')) mx = 1;
        else if (input.down('up')) my = -1;
        else if (input.down('down')) my = 1;

        if (mx || my) {
          d.face = mx < 0 ? 'left' : mx > 0 ? 'right' : my < 0 ? 'up' : 'down';
          d.dir = { x: mx, y: my };
          var step = SPEED * CELL * dt;
          var nx = d.px + mx * step, ny = d.py + my * step;
          // Digging is what clears the way, so carve first and then move into the gap.
          var dug = carve(d, nx, ny);
          if (dug) { g.score += dug; g.set('Score', g.score); }
          if (nx > CELL * .4 && nx < W - CELL * .4 && open(d, nx, d.py)) d.px = nx;
          if (ny > CELL * (SKY - .6) && ny < H - CELL * .4 && open(d, d.px, ny)) d.py = ny;
        }

        // --- pump ------------------------------------------------------------
        var pumping = input.down('action') || input.down('a');
        if (pumping) {
          if (!d.pump) {
            // Grab the nearest creature roughly in front of the digger.
            var best = null, bd = CELL * 2.4;
            d.foes.forEach(function (f) {
              if (f.dead || f.ghost > 0) return;
              var ox = f.x - d.px, oy = f.y - d.py;
              var along = ox * d.dir.x + oy * d.dir.y;
              var side = Math.abs(ox * d.dir.y - oy * d.dir.x);
              if (along < 0 || along > bd || side > CELL * .7) return;
              if (!best || along < best.along) best = { f: f, along: along };
            });
            if (best) { d.pump = best.f; Milo.sound.blip(); }
          }
          if (d.pump && !d.pump.dead) {
            var far = U.dist(d.px, d.py, d.pump.x, d.pump.y);
            if (far > CELL * 3.2) { d.pump = null; }
            else {
              d.pump.inflate += dt * 2.1;
              Milo.sound.tone({ f: 200 + d.pump.inflate * 90, d: .04, v: .03, type: 'sine' });
              if (d.pump.inflate >= PUMP_MAX) {
                d.pump.dead = true;
                burst(d, d.pump.x, d.pump.y, d.pump.kind === 'drake' ? '#ff9a4a' : '#ff6b8a', 26);
                // Deeper kills are worth more, which pushes you to dig down.
                var depth = Math.floor(d.pump.y / CELL) - SKY;
                g.score += 200 + depth * 25;
                g.set('Score', g.score);
                Milo.sound.explode();
                d.pump = null;
              }
            }
          }
        } else {
          d.pump = null;
        }

        // Anything not being pumped deflates again.
        d.foes.forEach(function (f) {
          if (f !== d.pump && f.inflate > 0) f.inflate = Math.max(0, f.inflate - dt * 1.4);
        });

        // --- creatures --------------------------------------------------------
        d.foes.forEach(function (f) {
          if (f.dead) return;
          if (f === d.pump || f.inflate > .3) return;

          f.ghostCool -= dt;
          if (f.ghost > 0) {
            f.ghost -= dt;
            // While ghosting it drifts straight at you, ignoring the dirt.
            var a = Math.atan2(d.py - f.y, d.px - f.x);
            f.x += Math.cos(a) * FOE_SPEED * CELL * .55 * dt;
            f.y += Math.sin(a) * FOE_SPEED * CELL * .55 * dt;
            f.x = U.clamp(f.x, CELL * .5, W - CELL * .5);
            f.y = U.clamp(f.y, CELL * (SKY + .5), H - CELL * .5);
            if (f.ghost <= 0 && !open(d, f.x, f.y)) carve(d, f.x, f.y);
            return;
          }
          if (f.ghostCool <= 0 && U.dist(f.x, f.y, d.px, d.py) > CELL * 2) {
            f.ghost = U.rand(1.4, 2.6);
            f.ghostCool = U.rand(7, 13);
            return;
          }

          f.think -= dt;
          var speed = FOE_SPEED * CELL * (f.kind === 'drake' ? .82 : 1) * dt;
          var tx = f.x + f.dx * speed, ty = f.y + f.dy * speed;
          if (open(d, tx, ty) && tx > CELL * .5 && tx < W - CELL * .5 && ty > CELL * (SKY + .4) && ty < H - CELL * .5) {
            f.x = tx; f.y = ty;
          } else { f.think = 0; }

          if (f.think <= 0) {
            f.think = U.rand(.35, .9);
            // Pick whichever open direction closes the gap, falling back to any at all.
            var opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(function (o) {
              var ox = f.x + o[0] * CELL * .7, oy = f.y + o[1] * CELL * .7;
              return open(d, ox, oy) && ox > CELL * .5 && ox < W - CELL * .5 &&
                oy > CELL * (SKY + .4) && oy < H - CELL * .5;
            });
            if (opts.length) {
              opts.sort(function (a, b) {
                return U.dist(f.x + a[0] * CELL, f.y + a[1] * CELL, d.px, d.py) -
                  U.dist(f.x + b[0] * CELL, f.y + b[1] * CELL, d.px, d.py);
              });
              var pick = Math.random() < .72 ? opts[0] : U.choice(opts);
              f.dx = pick[0]; f.dy = pick[1];
            }
          }

          // A drake breathes fire down its tunnel instead of only chasing.
          if (f.kind === 'drake') {
            f.breath -= dt;
            if (f.breath <= 0) f.breath = U.rand(2.5, 4.5);
            var lined = Math.abs(f.y - d.py) < CELL * .6 && Math.sign(d.px - f.x) === f.dx && f.dy === 0;
            if (lined && f.breath < .7 && Math.abs(f.x - d.px) < CELL * 3.2) {
              // Only a clear tunnel carries the flame.
              var clear = true;
              for (var s = CELL * .6; s < Math.abs(f.x - d.px); s += CELL * .5) {
                if (!open(d, f.x + f.dx * s, f.y)) { clear = false; break; }
              }
              if (clear) { f.flame = .25; loseLife(g); }
            }
          }

          if (U.dist(f.x, f.y, d.px, d.py) < CELL * .72) loseLife(g);
        });

        // --- rocks -------------------------------------------------------------
        d.rocks.forEach(function (rk) {
          if (rk.dead) return;
          if (!rk.falling) {
            var belowR = rk.r + 1;
            var below = belowR >= ROWS ? DIRT : d.map[belowR * COLS + rk.c];
            if (below === AIR) {
              rk.wobble += dt;
              // A short wobble is the tell that gives you time to get clear.
              if (rk.wobble > .55) {
                rk.falling = true;
                setTile(d, rk.c, rk.r, AIR);
                Milo.sound.hit();
              }
            } else { rk.wobble = 0; }
            return;
          }
          rk.vy += 900 * dt;
          rk.y += rk.vy * dt;
          var nr = Math.floor(rk.y / CELL);
          if (nr >= ROWS - 1 || (nr + 1 < ROWS && d.map[(nr + 1) * COLS + rk.c] === DIRT)) {
            rk.dead = true;
            d.shake = .28;
            burst(d, (rk.c + .5) * CELL, rk.y, '#a8a29a', 18);
            Milo.sound.explode();
          }
          var rx = (rk.c + .5) * CELL;
          d.foes.forEach(function (f) {
            if (f.dead || f.ghost > 0) return;
            if (Math.abs(f.x - rx) < CELL * .65 && Math.abs(f.y - rk.y) < CELL * .7) {
              f.dead = true;
              g.score += 350;
              g.set('Score', g.score);
              burst(d, f.x, f.y, '#ffd166', 20);
            }
          });
          if (Math.abs(d.px - rx) < CELL * .6 && Math.abs(d.py - rk.y) < CELL * .7) loseLife(g);
        });

        if (!d.foes.some(function (f) { return !f.dead; })) d.clearedAt = 1.1;
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.save();
        if (d.shake > 0) c.translate(U.rand(-4, 4) * d.shake, U.rand(-4, 4) * d.shake);

        var sky = c.createLinearGradient(0, 0, 0, SKY * CELL);
        sky.addColorStop(0, '#2c4f7c'); sky.addColorStop(1, '#4a6f9c');
        c.fillStyle = sky; c.fillRect(0, 0, W, SKY * CELL);

        // Dirt is banded by depth so progress downward reads at a glance.
        for (var r = SKY; r < ROWS; r++) {
          var band = BANDS[Math.min(BANDS.length - 1, Math.floor((r - SKY) / ((ROWS - SKY) / BANDS.length)))];
          for (var cc = 0; cc < COLS; cc++) {
            var v = d.map[r * COLS + cc];
            if (v === DIRT) {
              c.fillStyle = band;
              c.fillRect(cc * CELL, r * CELL, CELL, CELL);
              // A speckle of grit keeps the fill from looking flat.
              c.fillStyle = 'rgba(0,0,0,.13)';
              var hs = U.hash2(cc, r);
              c.fillRect(cc * CELL + (hs % 20) + 4, r * CELL + ((hs >> 5) % 20) + 4, 4, 4);
            } else {
              c.fillStyle = '#14100a';
              c.fillRect(cc * CELL, r * CELL, CELL, CELL);
            }
          }
        }

        d.rocks.forEach(function (rk) {
          if (rk.dead) return;
          var x = (rk.c + .5) * CELL;
          var y = rk.falling ? rk.y : (rk.r + .5) * CELL + (rk.wobble > 0 ? Math.sin(rk.wobble * 40) * 2 : 0);
          c.fillStyle = '#8f8a80';
          c.beginPath(); c.arc(x, y, CELL * .44, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#b6b0a5';
          c.beginPath(); c.arc(x - 4, y - 5, CELL * .17, 0, Math.PI * 2); c.fill();
        });

        d.foes.forEach(function (f) {
          if (f.dead) return;
          var sc = 1 + f.inflate * .22;
          c.globalAlpha = f.ghost > 0 ? .55 : 1;
          c.fillStyle = f.kind === 'drake' ? '#e2703a' : '#e04d68';
          c.beginPath(); c.arc(f.x, f.y, CELL * .38 * sc, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#fff';
          c.beginPath(); c.arc(f.x - 5, f.y - 4, 4.5, 0, Math.PI * 2); c.fill();
          c.beginPath(); c.arc(f.x + 5, f.y - 4, 4.5, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#1a1024';
          c.beginPath(); c.arc(f.x - 5 + f.dx * 1.6, f.y - 4 + f.dy * 1.6, 2.2, 0, Math.PI * 2); c.fill();
          c.beginPath(); c.arc(f.x + 5 + f.dx * 1.6, f.y - 4 + f.dy * 1.6, 2.2, 0, Math.PI * 2); c.fill();
          if (f.kind === 'drake' && f.flame > 0) {
            c.fillStyle = 'rgba(255,170,60,.75)';
            c.fillRect(f.x + f.dx * CELL * .4, f.y - 7, f.dx * CELL * 2.4, 14);
            f.flame -= .02;
          }
          c.globalAlpha = 1;
        });

        // The pump line makes it obvious which creature is hooked.
        if (d.pump && !d.pump.dead) {
          c.strokeStyle = '#ffe08a';
          c.lineWidth = 3;
          c.beginPath(); c.moveTo(d.px, d.py); c.lineTo(d.pump.x, d.pump.y); c.stroke();
        }

        if (d.dead <= 0) {
          c.fillStyle = '#f2f5ff';
          c.beginPath(); c.arc(d.px, d.py, CELL * .36, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#3aa7e0';
          c.beginPath(); c.arc(d.px, d.py - CELL * .1, CELL * .28, Math.PI, 0); c.fill();
          c.fillStyle = '#1a1024';
          c.beginPath();
          c.arc(d.px + d.dir.x * 6, d.py + d.dir.y * 6 + 3, 3, 0, Math.PI * 2);
          c.fill();
        }

        d.parts.forEach(function (pt) {
          c.globalAlpha = Math.max(0, pt.life * 1.6);
          c.fillStyle = pt.c;
          c.fillRect(pt.x - 2.5, pt.y - 2.5, 5, 5);
        });
        c.globalAlpha = 1;
        c.restore();

        if (d.clearedAt > 0) {
          c.fillStyle = 'rgba(0,0,0,.55)';
          c.fillRect(0, H / 2 - 40, W, 80);
          c.fillStyle = '#ffe08a';
          c.font = '700 30px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText('Level clear!', W / 2, H / 2 + 10);
        }
      }
    });
  }

  window.Milo.register({
    id: 'burrow-blast', title: 'Burrow Blast', emo: '⛏️', category: 'Arcade',
    tagline: 'Dig, pump, and drop boulders',
    description: 'You are a digger with an air pump and a whole hillside to tunnel through. ' +
      'Every tunnel you carve is one the crawlers can chase you down, so shaping the ground is ' +
      'half the fight. Face a creature and hold the pump to inflate it until it bursts, or lure ' +
      'the pack under a boulder and dig out its footing — a falling rock takes out everything ' +
      'in the shaft at once. Fire-breathing drakes will torch you down a straight tunnel, and ' +
      'anything left alone long enough will phase through solid earth to reach you.',
    controls: ['Arrows / WASD to dig and move', 'Space to pump', 'Dig under boulders to drop them'],
    colors: ['#7a4f2c', '#ffd166'],
    tags: ['arcade', 'digging', 'retro', 'maze'],
    mount: mount
  });
})();
