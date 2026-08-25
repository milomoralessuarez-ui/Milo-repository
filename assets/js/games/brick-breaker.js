/* Brick Breaker — paddle, ball, power-ups and 12 escalating levels. */
(function () {
  'use strict';
  var W = 800, H = 560;
  var COLS = 11, ROWS = 7, BW = 62, BH = 24, GAP = 6;
  var LEFT = (W - (COLS * (BW + GAP) - GAP)) / 2, TOP = 70;
  var POWERS = [
    { k: 'wide', col: '#34d399', label: 'W' },
    { k: 'multi', col: '#22d3ee', label: 'M' },
    { k: 'slow', col: '#a78bfa', label: 'S' },
    { k: 'life', col: '#fb7185', label: '+' }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.level = 1;
      d.lives = 3;
      buildLevel(g);
      g.set('Score', 0);
      g.set('Lives', 3);
      g.set('Level', 1);
    }

    function buildLevel(g) {
      var d = g.data;
      d.bricks = [];
      var seed = d.level * 977;
      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          var n = U.hash2(c, r, seed);
          if (d.level > 2 && n < 0.12) continue;              // gaps in later levels
          var hp = 1;
          if (n > 0.86 && d.level >= 3) hp = 3;
          else if (n > 0.62 && d.level >= 2) hp = 2;
          d.bricks.push({
            x: LEFT + c * (BW + GAP), y: TOP + r * (BH + GAP),
            w: BW, h: BH, hp: hp, max: hp,
            hue: 200 - r * 22
          });
        }
      }
      d.paddle = { x: W / 2 - 58, y: H - 42, w: 116, h: 14 };
      d.balls = [newBall(d)];
      d.drops = [];
      d.parts = [];
      d.wideT = 0; d.slowT = 0;
      d.stuck = true;
      d.shake = 0;
    }

    function newBall(d) {
      return { x: d.paddle.x + d.paddle.w / 2, y: d.paddle.y - 9, vx: 0, vy: 0, r: 8 };
    }

    function launch(d) {
      d.stuck = false;
      var sp = 340;
      d.balls.forEach(function (b) {
        if (b.vx === 0 && b.vy === 0) {
          var a = -Math.PI / 2 + U.rand(-.5, .5);
          b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp;
        }
      });
    }

    function burst(d, x, y, col, n) {
      for (var i = 0; i < (n || 12); i++) {
        var a = Math.random() * 6.28, s = U.rand(40, 220);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(.25, .6), max: .6, col: col });
      }
    }

    return Milo.arcade(host, {
      id: 'brick-breaker',
      w: W, h: H, bg: '#0a0d20',
      stats: ['Score', 'Lives', 'Level'],
      emo: '🧱',
      start: {
        title: 'Brick Breaker',
        text: 'Clear every brick. Catch the falling capsules for a wider paddle, ' +
          'extra balls, slow motion or a spare life.',
        keys: ['← →  or  Mouse', 'Space to launch']
      },
      init: reset,

      onPointer: function (g, type, x) {
        var d = g.data;
        if (!d.paddle) return;
        d.paddle.x = U.clamp(x - d.paddle.w / 2, 0, W - d.paddle.w);
        if (type === 'down' && d.stuck) launch(d);
      },
      onKey: function (g, e) {
        if (e.code === 'Space' && g.data.stuck) launch(g.data);
      },

      update: function (g, dt) {
        var d = g.data, i = g.input;
        var pspeed = 620 * dt;
        if (i.down('left')) d.paddle.x -= pspeed;
        if (i.down('right')) d.paddle.x += pspeed;
        d.paddle.x = U.clamp(d.paddle.x, 0, W - d.paddle.w);

        d.wideT = Math.max(0, d.wideT - dt);
        d.slowT = Math.max(0, d.slowT - dt);
        d.shake = Math.max(0, d.shake - dt * 4);
        var targetW = d.wideT > 0 ? 176 : 116;
        d.paddle.w += (targetW - d.paddle.w) * Math.min(1, dt * 10);

        if (d.stuck) {
          d.balls[0].x = d.paddle.x + d.paddle.w / 2;
          d.balls[0].y = d.paddle.y - 9;
          if (i.pressed('action')) launch(d);
        }

        var tScale = d.slowT > 0 ? 0.55 : 1;

        d.balls.forEach(function (b) {
          if (d.stuck) return;
          b.x += b.vx * dt * tScale;
          b.y += b.vy * dt * tScale;

          if (b.x - b.r < 0) { b.x = b.r; b.vx = Math.abs(b.vx); Milo.sound.click(); }
          if (b.x + b.r > W) { b.x = W - b.r; b.vx = -Math.abs(b.vx); Milo.sound.click(); }
          if (b.y - b.r < 0) { b.y = b.r; b.vy = Math.abs(b.vy); Milo.sound.click(); }

          // paddle
          var p = d.paddle;
          if (b.vy > 0 && b.y + b.r >= p.y && b.y - b.r <= p.y + p.h &&
            b.x >= p.x - b.r && b.x <= p.x + p.w + b.r) {
            b.y = p.y - b.r;
            // Bounce angle depends on where along the paddle it lands.
            var rel = U.clamp((b.x - (p.x + p.w / 2)) / (p.w / 2), -1, 1);
            var sp = Math.min(620, Math.hypot(b.vx, b.vy) * 1.015);
            var ang = -Math.PI / 2 + rel * 1.05;
            b.vx = Math.cos(ang) * sp;
            b.vy = Math.sin(ang) * sp;
            Milo.sound.tone({ f: 420, f2: 560, d: .06, v: .08, type: 'square' });
          }

          // bricks
          for (var k = d.bricks.length - 1; k >= 0; k--) {
            var br = d.bricks[k];
            if (b.x + b.r < br.x || b.x - b.r > br.x + br.w ||
              b.y + b.r < br.y || b.y - b.r > br.y + br.h) continue;

            // Reflect on whichever axis has the shallower overlap.
            var ox = Math.min(b.x + b.r - br.x, br.x + br.w - (b.x - b.r));
            var oy = Math.min(b.y + b.r - br.y, br.y + br.h - (b.y - b.r));
            if (ox < oy) b.vx = -b.vx; else b.vy = -b.vy;

            br.hp--;
            burst(d, b.x, b.y, 'hsl(' + br.hue + ',80%,62%)', br.hp <= 0 ? 14 : 6);
            d.shake = .4;
            if (br.hp <= 0) {
              d.bricks.splice(k, 1);
              g.score += 10 * d.level;
              Milo.sound.tone({ f: 700, f2: 900, d: .06, v: .08, type: 'square' });
              if (Math.random() < 0.14) {
                var pw = U.choice(POWERS);
                d.drops.push({ x: br.x + br.w / 2, y: br.y + br.h / 2, k: pw.k, col: pw.col, label: pw.label });
              }
            } else {
              Milo.sound.tone({ f: 320, d: .05, v: .06, type: 'triangle' });
            }
            g.set('Score', U.fmt(g.score));
            break;
          }
        });

        // lost balls
        d.balls = d.balls.filter(function (b) { return b.y - b.r < H + 30; });
        if (!d.balls.length) {
          d.lives--;
          g.set('Lives', d.lives);
          Milo.sound.hit();
          if (d.lives <= 0) { g.gameOver({ text: 'You cleared ' + (d.level - 1) + ' full level' + (d.level - 1 === 1 ? '' : 's') + '.' }); return; }
          d.balls = [newBall(d)];
          d.stuck = true;
          d.wideT = 0; d.slowT = 0;
        }

        // power-up capsules
        d.drops = d.drops.filter(function (p) {
          p.y += 190 * dt;
          if (p.y > H + 20) return false;
          var pd = d.paddle;
          if (p.y > pd.y - 8 && p.y < pd.y + pd.h + 8 && p.x > pd.x - 12 && p.x < pd.x + pd.w + 12) {
            applyPower(g, p.k);
            return false;
          }
          return true;
        });

        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 380 * dt; p.life -= dt;
          return p.life > 0;
        });

        if (!d.bricks.length) {
          d.level++;
          if (d.level > 12) {
            g.win({ score: g.score, text: 'You cleared all 12 levels. Outstanding.' });
            return;
          }
          g.set('Level', d.level);
          g.score += 100;
          g.set('Score', U.fmt(g.score));
          Milo.sound.win();
          buildLevel(g);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.save();
        if (d.shake > 0) c.translate(U.rand(-1, 1) * d.shake * 2.5, U.rand(-1, 1) * d.shake * 2.5);

        d.bricks.forEach(function (b) {
          var lum = 40 + (b.hp / b.max) * 26;
          var grd = c.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
          grd.addColorStop(0, 'hsl(' + b.hue + ',80%,' + (lum + 14) + '%)');
          grd.addColorStop(1, 'hsl(' + b.hue + ',80%,' + lum + '%)');
          c.fillStyle = grd;
          U.roundRect(c, b.x, b.y, b.w, b.h, 5); c.fill();
          c.fillStyle = 'rgba(255,255,255,.20)';
          U.roundRect(c, b.x + 3, b.y + 3, b.w - 6, 5, 2.5); c.fill();
          if (b.max > 1) {
            c.fillStyle = 'rgba(255,255,255,.8)';
            c.font = '700 11px Outfit, sans-serif';
            c.textAlign = 'center';
            c.fillText(b.hp, b.x + b.w / 2, b.y + b.h / 2 + 4);
          }
        });

        d.drops.forEach(function (p) {
          c.shadowColor = p.col; c.shadowBlur = 14;
          c.fillStyle = p.col;
          U.roundRect(c, p.x - 13, p.y - 8, 26, 16, 8); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = '#08122a';
          c.font = '800 11px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(p.label, p.x, p.y + 4);
        });

        var p = d.paddle;
        var pg = c.createLinearGradient(p.x, 0, p.x + p.w, 0);
        pg.addColorStop(0, '#7c5cff'); pg.addColorStop(.5, '#22d3ee'); pg.addColorStop(1, '#7c5cff');
        c.shadowColor = '#22d3ee'; c.shadowBlur = 18;
        c.fillStyle = pg;
        U.roundRect(c, p.x, p.y, p.w, p.h, 7); c.fill();
        c.shadowBlur = 0;

        d.balls.forEach(function (b) {
          c.shadowColor = '#fff'; c.shadowBlur = 18;
          c.fillStyle = '#fff';
          c.beginPath(); c.arc(b.x, b.y, b.r, 0, 7); c.fill();
          c.shadowBlur = 0;
        });

        d.parts.forEach(function (q) {
          c.globalAlpha = Math.max(0, q.life / q.max);
          c.fillStyle = q.col;
          c.fillRect(q.x - 2, q.y - 2, 4, 4);
        });
        c.globalAlpha = 1;

        if (d.stuck) {
          c.fillStyle = 'rgba(255,255,255,.72)';
          c.font = '600 15px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText('Press Space or click to launch', W / 2, H - 70);
        }
        if (d.slowT > 0 || d.wideT > 0) {
          c.textAlign = 'left';
          c.font = '700 12px Outfit, sans-serif';
          var yy = H - 96;
          if (d.wideT > 0) { c.fillStyle = '#34d399'; c.fillText('WIDE ' + d.wideT.toFixed(1) + 's', 14, yy); yy += 16; }
          if (d.slowT > 0) { c.fillStyle = '#a78bfa'; c.fillText('SLOW ' + d.slowT.toFixed(1) + 's', 14, yy); }
        }
        c.restore();
      }
    });

    function applyPower(g, k) {
      var d = g.data;
      Milo.sound.powerup();
      if (k === 'wide') d.wideT = 12;
      else if (k === 'slow') d.slowT = 9;
      else if (k === 'life') { d.lives++; g.set('Lives', d.lives); }
      else if (k === 'multi') {
        var src = d.balls[0];
        if (src && d.balls.length < 6) {
          for (var n = 0; n < 2; n++) {
            var a = Math.atan2(src.vy, src.vx) + (n ? .5 : -.5);
            var sp = Math.max(300, Math.hypot(src.vx, src.vy));
            d.balls.push({ x: src.x, y: src.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 8 });
          }
        }
      }
      g.score += 25;
      g.set('Score', window.Milo.util.fmt(g.score));
    }
  }

  window.Milo.register({
    id: 'brick-breaker', title: 'Brick Breaker', emo: '🧱', category: 'Arcade',
    tagline: 'Smash every brick across 12 levels',
    description: 'Bounce the ball off your paddle to clear the wall. Tougher bricks ' +
      'need two or three hits. Catch falling capsules for a wider paddle (W), extra ' +
      'balls (M), slow motion (S) or a spare life (+). Twelve levels, each busier than the last.',
    controls: ['← →', 'Mouse', 'Space to launch'],
    colors: ['#f472b6', '#7c5cff'],
    tags: ['classic', 'paddle', 'arkanoid', 'levels'],
    mount: mount
  });
})();
