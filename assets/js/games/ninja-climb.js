/* Ninja Climb — wall-jump up an endless shaft while the floor chases you. */
(function () {
  'use strict';
  var W = 460, H = 660, WALL = 52;
  var GRAV = 1700, JUMP = -640, KICK = 400, MAXFALL = 900;
  var PW = 24, PH = 32;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.x = WALL + 24;
      d.y = H - 140;
      d.vx = 0; d.vy = 0;
      d.wall = 0;              // -1 clinging left, 1 clinging right, 0 airborne
      d.face = 1;
      d.cam = 0;
      d.height = 0;
      d.coinCount = 0;
      d.hazards = [];
      d.coins = [];
      d.parts = [];
      d.rise = 26;             // the chasing floor, in pixels per second
      d.floorY = H + 80;
      d.spawnY = H - 300;
      d.over = false;
      d.coyote = 0;
      d.sparkle = 0;
      seed(d);
      g.set('Height', '0m');
      g.set('Coins', 0);
      g.set('Best', g.best ? g.best + 'm' : '—');
    }

    /** Populates the shaft above the player so there is always something coming. */
    function seed(d) {
      while (d.spawnY > d.cam - H * 1.5) {
        var side = U.choice([-1, 1]);
        var y = d.spawnY;
        var roll = Math.random();
        var difficulty = Math.min(1, d.height / 900);
        if (roll < .28 + difficulty * .22) {
          // Spikes on a wall force the jump onto the other side.
          d.hazards.push({ kind: 'spike', side: side, y: y, h: U.rand(50, 110) });
        } else if (roll < .40 + difficulty * .12) {
          // A saw crosses the shaft on a timer.
          d.hazards.push({ kind: 'saw', y: y, t: U.rand(0, 6), span: U.rand(.6, 1) });
        } else if (roll < .5) {
          d.hazards.push({ kind: 'ledge', y: y, x: U.rand(WALL + 40, W - WALL - 90), w: 70 });
        }
        if (Math.random() < .55) {
          d.coins.push({ x: U.rand(WALL + 20, W - WALL - 20), y: y - U.rand(20, 70), got: false });
        }
        d.spawnY -= U.rand(90, 150);
      }
    }

    function burst(d, x, y, color, n) {
      for (var i = 0; i < n; i++) {
        var a = U.rand(0, Math.PI * 2), s = U.rand(50, 210);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(.25, .6), c: color });
      }
    }

    function die(g, why) {
      var d = g.data;
      if (d.over) return;
      d.over = true;
      burst(d, d.x, d.y, '#ff6b8a', 26);
      Milo.sound.explode();
      g.gameOver({
        emo: '🥷', title: why,
        text: 'You climbed ' + Math.floor(d.height) + ' metres.',
        score: g.score
      });
    }

    return Milo.arcade(host, {
      id: 'ninja-climb',
      w: W, h: H, bg: '#0f1220',
      stats: ['Score', 'Height', 'Coins', 'Best'],
      emo: '🥷',
      trackBest: true,
      touch: 'dpad+a',
      start: {
        title: 'Ninja Climb',
        text: 'Jump between the two walls to climb. Each jump kicks you toward the opposite ' +
          'side, so the rhythm is left, right, left. The floor below is rising and it never stops.',
        keys: ['Space / W / Up to wall-jump', 'Left and Right to steer mid-air']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, input = g.input;
        var i;

        for (i = d.parts.length - 1; i >= 0; i--) {
          var pt = d.parts[i];
          pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 700 * dt; pt.life -= dt;
          if (pt.life <= 0) d.parts.splice(i, 1);
        }
        if (d.over) return;

        // --- input -------------------------------------------------------------
        var jump = input.pressed('action') || input.pressed('a') || input.pressed('up');
        if (input.down('left')) d.vx -= 900 * dt;
        if (input.down('right')) d.vx += 900 * dt;

        if (d.wall) d.coyote = .12; else d.coyote = Math.max(0, d.coyote - dt);

        if (jump && (d.wall || d.coyote > 0)) {
          var from = d.wall || (d.x < W / 2 ? -1 : 1);
          d.vy = JUMP;
          d.vx = -from * KICK;
          d.face = -from;
          d.wall = 0;
          d.coyote = 0;
          burst(d, from < 0 ? WALL + 6 : W - WALL - 6, d.y + PH / 2, '#8fb8ff', 8);
          Milo.sound.tone({ f: 420, d: .09, v: .05, type: 'square' });
        }

        // --- physics -----------------------------------------------------------
        d.vy += GRAV * dt;
        // Clinging to a wall slows the slide, which is what makes the shaft climbable.
        if (d.wall && d.vy > 90) d.vy = 90;
        d.vy = Math.min(d.vy, MAXFALL);
        d.vx *= Math.exp(-4 * dt);
        d.x += d.vx * dt;
        d.y += d.vy * dt;

        d.wall = 0;
        if (d.x - PW / 2 <= WALL) { d.x = WALL + PW / 2; if (d.vx < 0) d.vx = 0; d.wall = -1; d.face = 1; }
        if (d.x + PW / 2 >= W - WALL) { d.x = W - WALL - PW / 2; if (d.vx > 0) d.vx = 0; d.wall = 1; d.face = -1; }

        // Ledges are one-way platforms — you land on them but pass through from below.
        d.hazards.forEach(function (hz) {
          if (hz.kind !== 'ledge') return;
          if (d.vy < 0) return;
          if (d.x + PW / 2 < hz.x || d.x - PW / 2 > hz.x + hz.w) return;
          var top = hz.y;
          if (d.y + PH / 2 >= top && d.y + PH / 2 <= top + 22) {
            d.y = top - PH / 2;
            d.vy = 0;
            d.coyote = .12;
          }
        });

        // --- camera and the rising floor ----------------------------------------
        var target = d.y - H * .58;
        if (target < d.cam) d.cam = target;
        var reached = Math.max(0, Math.floor((H - 140 - d.y) / 10));
        if (reached > d.height) {
          d.height = reached;
          // Height and coins are the whole score, so recompute rather than accumulate.
          g.score = d.height * 10 + d.coinCount * 50;
          g.set('Height', d.height + 'm');
          g.set('Score', g.score);
        }

        d.rise = 26 + Math.min(120, d.height * .09);
        d.floorY -= d.rise * dt;
        if (d.floorY > d.cam + H + 40) d.floorY = d.cam + H + 40;
        if (d.y + PH / 2 > d.floorY) { die(g, 'The rising floor caught you'); return; }

        seed(d);

        // --- hazards -------------------------------------------------------------
        for (i = d.hazards.length - 1; i >= 0; i--) {
          var hz = d.hazards[i];
          if (hz.y > d.cam + H + 260) { d.hazards.splice(i, 1); continue; }
          if (hz.kind === 'spike') {
            var sx = hz.side < 0 ? WALL : W - WALL - 16;
            if (d.x - PW / 2 < sx + 16 && d.x + PW / 2 > sx &&
              d.y + PH / 2 > hz.y && d.y - PH / 2 < hz.y + hz.h) {
              die(g, 'Straight onto the spikes');
              return;
            }
          } else if (hz.kind === 'saw') {
            hz.t += dt;
            var travel = (W - WALL * 2 - 44) * hz.span;
            var sawX = WALL + 22 + (Math.sin(hz.t * 1.6) * .5 + .5) * travel;
            hz.sx = sawX;
            if (U.dist(d.x, d.y, sawX, hz.y) < 20 + PW / 2) { die(g, 'Sliced by the saw'); return; }
          }
        }

        // --- coins ---------------------------------------------------------------
        for (i = d.coins.length - 1; i >= 0; i--) {
          var cn = d.coins[i];
          if (cn.y > d.cam + H + 200) { d.coins.splice(i, 1); continue; }
          if (U.dist(d.x, d.y, cn.x, cn.y) < 20) {
            d.coins.splice(i, 1);
            d.coinCount++;
            g.score = d.height * 10 + d.coinCount * 50;
            g.set('Coins', d.coinCount);
            g.set('Score', g.score);
            burst(d, cn.x, cn.y, '#ffd166', 8);
            Milo.sound.coin();
          }
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var cam = d.cam;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#181f38'); bg.addColorStop(1, '#0b0e1a');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        c.save();
        c.translate(0, -cam);

        // Brick walls, drawn only for the rows on screen.
        var top = Math.floor(cam / 30) * 30 - 30;
        for (var y = top; y < cam + H + 30; y += 30) {
          var row = Math.floor(y / 30);
          c.fillStyle = row % 2 ? '#2a3050' : '#252b48';
          c.fillRect(0, y, WALL, 30);
          c.fillRect(W - WALL, y, WALL, 30);
          c.strokeStyle = 'rgba(0,0,0,.28)';
          c.lineWidth = 1;
          c.strokeRect(.5, y + .5, WALL - 1, 29);
          c.strokeRect(W - WALL + .5, y + .5, WALL - 1, 29);
          // Faint depth marks every ten metres give the climb a sense of scale.
          if (row % 5 === 0) {
            c.fillStyle = 'rgba(255,255,255,.06)';
            c.fillRect(WALL, y + 14, W - WALL * 2, 2);
          }
        }

        d.hazards.forEach(function (hz) {
          if (hz.y < cam - 80 || hz.y > cam + H + 80) return;
          if (hz.kind === 'spike') {
            var sx = hz.side < 0 ? WALL : W - WALL;
            c.fillStyle = '#c9d4e8';
            for (var sy = hz.y; sy < hz.y + hz.h; sy += 14) {
              c.beginPath();
              c.moveTo(sx, sy);
              c.lineTo(sx + hz.side * 16, sy + 7);
              c.lineTo(sx, sy + 14);
              c.closePath(); c.fill();
            }
          } else if (hz.kind === 'saw') {
            var sawX = hz.sx == null ? W / 2 : hz.sx;
            c.save();
            c.translate(sawX, hz.y);
            c.rotate(hz.t * 9);
            c.fillStyle = '#b9c2d4';
            for (var k = 0; k < 8; k++) {
              c.rotate(Math.PI / 4);
              c.beginPath();
              c.moveTo(0, -20); c.lineTo(6, -12); c.lineTo(-6, -12);
              c.closePath(); c.fill();
            }
            c.beginPath(); c.arc(0, 0, 13, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#5c6784';
            c.beginPath(); c.arc(0, 0, 5, 0, Math.PI * 2); c.fill();
            c.restore();
          } else {
            c.fillStyle = '#4a5a86';
            U.roundRect(c, hz.x, hz.y, hz.w, 12, 5); c.fill();
            c.fillStyle = 'rgba(255,255,255,.14)';
            c.fillRect(hz.x + 3, hz.y + 2, hz.w - 6, 3);
          }
        });

        d.coins.forEach(function (cn) {
          if (cn.y < cam - 40 || cn.y > cam + H + 40) return;
          var bob = Math.sin(g.t * 4 + cn.x * .05) * 2.5;
          c.fillStyle = '#ffd166';
          c.beginPath(); c.ellipse(cn.x, cn.y + bob, 8, 9, 0, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#c9992f';
          c.beginPath(); c.ellipse(cn.x, cn.y + bob, 4, 5.5, 0, 0, Math.PI * 2); c.fill();
        });

        // The rising floor: lava-ish, with a lip so its exact height is unambiguous.
        c.fillStyle = '#8c2a3a';
        c.fillRect(0, d.floorY, W, cam + H - d.floorY + 40);
        c.fillStyle = '#e0563f';
        for (var fx = 0; fx < W; fx += 20) {
          c.fillRect(fx, d.floorY + Math.sin(g.t * 3 + fx * .12) * 3 - 4, 20, 10);
        }
        c.fillStyle = 'rgba(255,180,110,.35)';
        c.fillRect(0, d.floorY - 3, W, 4);

        if (!d.over) {
          c.save();
          c.translate(d.x, d.y);
          c.scale(d.face, 1);
          c.fillStyle = '#2b3550';
          U.roundRect(c, -PW / 2, -PH / 2, PW, PH, 6); c.fill();
          c.fillStyle = '#e8534f';
          c.fillRect(-PW / 2, -PH / 2 + 7, PW, 6);
          // Trailing headband, angled by momentum.
          c.beginPath();
          c.moveTo(-PW / 2, -PH / 2 + 9);
          c.lineTo(-PW / 2 - 14, -PH / 2 + 5 + d.vy * .012);
          c.lineTo(-PW / 2 - 12, -PH / 2 + 14 + d.vy * .012);
          c.closePath(); c.fill();
          c.fillStyle = '#f2f5ff';
          c.fillRect(1, -PH / 2 + 8, 5, 4);
          c.restore();
        }

        d.parts.forEach(function (pt) {
          c.globalAlpha = Math.max(0, pt.life * 1.8);
          c.fillStyle = pt.c;
          c.fillRect(pt.x - 2, pt.y - 2, 4, 4);
        });
        c.globalAlpha = 1;
        c.restore();

        c.fillStyle = 'rgba(255,255,255,.5)';
        c.font = '600 12px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText('Jump kicks you off the wall you are touching', W / 2, H - 12);
      }
    });
  }

  window.Milo.register({
    id: 'ninja-climb', title: 'Ninja Climb', emo: '🥷', category: 'Action',
    tagline: 'Wall-jump ahead of the rising floor',
    description: 'A narrow shaft, two walls and a floor of fire that is always coming up behind ' +
      'you. Press jump while touching a wall and you kick off toward the other side, so climbing ' +
      'is a rhythm you have to keep. Spikes stud the walls, saw blades swing across the gap, and ' +
      'the higher you get the faster the fire rises. Coins scattered up the shaft are usually ' +
      'just far enough off the line to make you think about it.',
    controls: ['Space / W / Up to wall-jump', 'Left and Right to steer in the air'],
    colors: ['#181f38', '#e8534f'],
    tags: ['platformer', 'endless', 'skill', 'vertical'],
    mount: mount
  });
})();
