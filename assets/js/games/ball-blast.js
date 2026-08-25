/* Ball Blast — a cannon, bouncing numbered balls, and constant splitting. */
(function () {
  'use strict';
  var W = 720, H = 620, GROUND = H - 46;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.cannon = { x: W / 2, power: 1, cool: 0 };
      d.balls = [];
      d.shots = [];
      d.parts = [];
      d.drops = [];
      d.level = 1;
      d.spawnT = 0;
      d.lives = 3;
      spawnBall(d, U.rand(120, W - 120), 4);
      g.set('Score', 0);
      g.set('Power', 1);
      g.set('Lives', 3);
    }

    function spawnBall(d, x, tier, vx, vy) {
      var hp = Math.pow(2, tier) * (2 + d.level);
      d.balls.push({
        x: x, y: 90, r: 12 + tier * 9, tier: tier,
        hp: hp, max: hp,
        vx: vx == null ? U.rand(-90, 90) : vx,
        vy: vy == null ? 0 : vy,
        hue: 200 - tier * 34
      });
    }

    return Milo.arcade(host, {
      id: 'ball-blast',
      w: W, h: H, bg: '#0a0d24',
      stats: ['Score', 'Power', 'Lives'],
      touch: 'dpad',
      emo: '🔴',
      start: {
        title: 'Ball Blast',
        text: 'Your cannon fires non-stop. Move it left and right, break the balls ' +
          'before they reach you, and grab the coins they drop to upgrade your gun.',
        keys: ['← → or A D', 'Mouse / drag to move']
      },
      init: reset,

      onPointer: function (g, type, x) {
        g.data.cannon.x = U.clamp(x, 30, W - 30);
      },

      update: function (g, dt) {
        var d = g.data, i = g.input, cn = d.cannon;

        var sp = 460 * dt;
        if (i.down('left')) cn.x -= sp;
        if (i.down('right')) cn.x += sp;
        cn.x = U.clamp(cn.x, 30, W - 30);

        // The cannon fires automatically.
        cn.cool -= dt;
        if (cn.cool <= 0) {
          cn.cool = 0.085;
          d.shots.push({ x: cn.x, y: GROUND - 34, vy: -820, dmg: cn.power });
          Milo.sound.tone({ f: 900, f2: 1300, d: .03, v: .025, type: 'square' });
        }

        d.shots = d.shots.filter(function (s) {
          s.y += s.vy * dt;
          return s.y > -20;
        });

        // A steady trickle of new balls, faster as the level climbs.
        d.spawnT -= dt;
        if (d.spawnT <= 0) {
          d.spawnT = Math.max(2.2, 6 - d.level * .25);
          spawnBall(d, Math.random() < .5 ? 80 : W - 80, U.randInt(2, Math.min(5, 2 + Math.floor(d.level / 3))));
        }

        for (var b = d.balls.length - 1; b >= 0; b--) {
          var ball = d.balls[b];
          ball.vy += 620 * dt;
          ball.x += ball.vx * dt;
          ball.y += ball.vy * dt;

          if (ball.x - ball.r < 0) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); }
          if (ball.x + ball.r > W) { ball.x = W - ball.r; ball.vx = -Math.abs(ball.vx); }
          if (ball.y + ball.r > GROUND) {
            ball.y = GROUND - ball.r;
            // Bigger balls bounce higher, which keeps them on screen.
            ball.vy = -(300 + ball.tier * 46);
          }

          // Hit the cannon?
          if (ball.y + ball.r > GROUND - 40 && Math.abs(ball.x - cn.x) < ball.r + 24) {
            d.balls.splice(b, 1);
            hitCannon(g);
            continue;
          }

          for (var s = d.shots.length - 1; s >= 0; s--) {
            var sh = d.shots[s];
            if (U.dist(sh.x, sh.y, ball.x, ball.y) < ball.r + 4) {
              d.shots.splice(s, 1);
              ball.hp -= sh.dmg;
              d.parts.push({ x: sh.x, y: sh.y, vx: U.rand(-60, 60), vy: U.rand(-120, -30), life: .25, max: .25, col: '#ffd257' });
              if (ball.hp <= 0) {
                d.balls.splice(b, 1);
                g.score += ball.max;
                g.set('Score', U.fmt(g.score));
                Milo.sound.tone({ f: 300 + ball.tier * 60, f2: 160, d: .1, v: .07, type: 'square' });
                pop(d, ball);
                if (ball.tier > 1) {
                  spawnSplit(d, ball, -1);
                  spawnSplit(d, ball, 1);
                }
                if (Math.random() < .4) {
                  d.drops.push({ x: ball.x, y: ball.y, vy: 40, kind: 'coin' });
                }
                // Level up on total score, which paces the difficulty.
                var want = 1 + Math.floor(g.score / 900);
                if (want > d.level) { d.level = want; Milo.sound.powerup(); }
              }
              break;
            }
          }
        }

        d.drops = d.drops.filter(function (p) {
          p.vy += 340 * dt;
          p.y += p.vy * dt;
          if (p.y > GROUND - 10) { p.y = GROUND - 10; p.vy = 0; p.rest = (p.rest || 0) + dt; }
          if (U.dist(p.x, p.y, cn.x, GROUND - 24) < 34) {
            d.cannon.power++;
            g.set('Power', d.cannon.power);
            g.score += 30;
            g.set('Score', U.fmt(g.score));
            Milo.sound.coin();
            return false;
          }
          return (p.rest || 0) < 7;
        });

        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 560 * dt; p.life -= dt;
          return p.life > 0;
        });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, cn = d.cannon;
        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#161a44'); sky.addColorStop(1, '#080b20');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);

        c.fillStyle = '#1d2450';
        c.fillRect(0, GROUND, W, H - GROUND);
        c.strokeStyle = '#22d3ee'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(0, GROUND); c.lineTo(W, GROUND); c.stroke();

        d.balls.forEach(function (b) {
          var frac = b.hp / b.max;
          c.shadowColor = 'hsl(' + b.hue + ',75%,55%)'; c.shadowBlur = 16;
          c.fillStyle = 'hsl(' + b.hue + ',72%,' + (34 + frac * 22) + '%)';
          c.beginPath(); c.arc(b.x, b.y, b.r, 0, 7); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = 'rgba(255,255,255,.22)';
          c.beginPath(); c.arc(b.x - b.r * .3, b.y - b.r * .34, b.r * .3, 0, 7); c.fill();
          c.fillStyle = '#fff';
          c.font = '800 ' + Math.max(10, Math.min(17, b.r * .74)) + 'px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(U.fmtShort(Math.ceil(b.hp)), b.x, b.y + b.r * .26);
        });

        c.fillStyle = '#ffe066';
        d.shots.forEach(function (s) {
          c.shadowColor = '#ffe066'; c.shadowBlur = 8;
          U.roundRect(c, s.x - 2.5, s.y - 8, 5, 16, 2.5); c.fill();
        });
        c.shadowBlur = 0;

        d.drops.forEach(function (p) {
          c.shadowColor = '#ffd257'; c.shadowBlur = 14;
          c.fillStyle = '#ffd257';
          c.beginPath(); c.arc(p.x, p.y, 9, 0, 7); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = '#7a5a00';
          c.font = '800 11px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText('+', p.x, p.y + 4);
        });

        // cannon
        c.save();
        c.translate(cn.x, GROUND);
        c.fillStyle = '#22d3ee';
        c.shadowColor = '#22d3ee'; c.shadowBlur = 16;
        U.roundRect(c, -22, -22, 44, 22, 6); c.fill();
        U.roundRect(c, -7, -38, 14, 20, 4); c.fill();
        c.shadowBlur = 0;
        c.fillStyle = '#0b1330';
        U.roundRect(c, -14, -16, 28, 9, 4); c.fill();
        c.restore();

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - 2, p.y - 2, 4, 4);
        });
        c.globalAlpha = 1;

        c.fillStyle = 'rgba(255,255,255,.4)';
        c.font = '600 12px Outfit, sans-serif';
        c.textAlign = 'left';
        c.fillText('Level ' + d.level, 14, H - 14);
      }
    });

    function spawnSplit(d, ball, dir) {
      var tier = ball.tier - 1;
      var hp = Math.pow(2, tier) * (2 + d.level);
      d.balls.push({
        x: ball.x + dir * ball.r * .5, y: ball.y,
        r: 12 + tier * 9, tier: tier, hp: hp, max: hp,
        vx: dir * U.rand(70, 130), vy: -180,
        hue: 200 - tier * 34
      });
    }

    function pop(d, ball) {
      for (var i = 0; i < 16; i++) {
        var a = Math.random() * 6.28, s = U.rand(60, 260);
        d.parts.push({
          x: ball.x, y: ball.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
          life: U.rand(.25, .55), max: .55, col: 'hsl(' + ball.hue + ',75%,60%)'
        });
      }
    }

    function hitCannon(g) {
      var d = g.data;
      d.lives--;
      d.cannon.power = Math.max(1, Math.floor(d.cannon.power * .6));
      g.set('Lives', Math.max(0, d.lives));
      g.set('Power', d.cannon.power);
      Milo.sound.explode();
      for (var i = 0; i < 24; i++) {
        var a = Math.random() * 6.28, s = U.rand(60, 300);
        d.parts.push({ x: d.cannon.x, y: GROUND - 20, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(.3, .7), max: .7, col: U.choice(['#fff', '#22d3ee', '#fb7185']) });
      }
      if (d.lives <= 0) {
        g.gameOver({ text: 'You reached level ' + d.level + ' with a power-' + d.cannon.power + ' cannon.' });
      }
    }
  }

  window.Milo.register({
    id: 'ball-blast', title: 'Ball Blast', emo: '🔴', category: 'Action',
    tagline: 'Shoot the bouncing balls before they split into more',
    description: 'Your cannon fires by itself — all you do is move it. Each ball shows ' +
      'how much damage it can still take, and breaking one splits it into two smaller, ' +
      'faster ones. Coins dropped by broken balls upgrade your firepower, and letting a ' +
      'ball reach the cannon costs a life and half your power.',
    controls: ['← →', 'A D', 'Mouse / drag'],
    colors: ['#fb7185', '#ffd257'],
    tags: ['shooter', 'physics', 'upgrades', 'action'],
    mount: mount
  });
})();
