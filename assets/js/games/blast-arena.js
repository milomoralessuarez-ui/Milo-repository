/* Blast Arena — top-down arena shooter against waves of bots. */
(function () {
  'use strict';
  var AW = 1600, AH = 1200;      // arena size in world units
  var NAMES = ['Rook', 'Vex', 'Nyx', 'Zed', 'Ivo', 'Kai', 'Wren', 'Dax', 'Juno', 'Pike'];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.me = mkFighter('You', AW / 2, AH / 2, '#22d3ee', false);
      d.bots = [];
      d.bullets = [];
      d.pickups = [];
      d.parts = [];
      d.wave = 0;
      d.kills = 0;
      d.waveTimer = 1.2;
      d.cam = { x: 0, y: 0 };
      d.shake = 0;
      d.blocks = [];
      // Fixed cover blocks — same layout every run, so it can be learned.
      [[380, 300], [1180, 300], [380, 860], [1180, 860], [780, 580],
      [780, 200], [780, 960], [220, 580], [1340, 580]].forEach(function (b) {
        d.blocks.push({ x: b[0], y: b[1], w: 110, h: 110 });
      });
      g.set('Score', 0);
      g.set('Wave', 0);
      g.set('Health', 100);
    }

    function mkFighter(name, x, y, col, isBot) {
      return {
        name: name, x: x, y: y, vx: 0, vy: 0, r: 17, col: col,
        hp: isBot ? 40 : 100, maxHp: isBot ? 40 : 100,
        aim: 0, cool: 0, bot: isBot, dashT: 0, hurt: 0,
        wander: Math.random() * 6.28, weapon: 1
      };
    }

    function spawnWave(g) {
      var d = g.data;
      d.wave++;
      g.set('Wave', d.wave);
      var n = Math.min(9, 2 + Math.floor(d.wave * 1.3));
      for (var i = 0; i < n; i++) {
        // Spawn around the edges, away from the player.
        var a = Math.random() * 6.28;
        var x = AW / 2 + Math.cos(a) * 640, y = AH / 2 + Math.sin(a) * 480;
        var b = mkFighter(U.choice(NAMES), U.clamp(x, 60, AW - 60), U.clamp(y, 60, AH - 60),
          U.choice(['#fb7185', '#a78bfa', '#f59e0b', '#34d399']), true);
        b.hp = b.maxHp = 30 + d.wave * 8;
        b.speed = 130 + Math.min(120, d.wave * 8);
        d.bots.push(b);
      }
      Milo.sound.tone({ f: 160, f2: 380, d: .35, v: .09, type: 'sawtooth' });
    }

    function blocked(d, x, y, r) {
      for (var i = 0; i < d.blocks.length; i++) {
        var b = d.blocks[i];
        if (x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h) return b;
      }
      return null;
    }

    function shoot(g, f, ang) {
      var d = g.data;
      if (f.cool > 0) return;
      f.cool = f.bot ? U.rand(.45, .95) : (f.weapon >= 2 ? .11 : .17);
      var shots = (!f.bot && f.weapon >= 3) ? 3 : 1;
      for (var s = 0; s < shots; s++) {
        var a = ang + (shots > 1 ? (s - 1) * 0.16 : 0) + (f.bot ? U.rand(-.09, .09) : 0);
        d.bullets.push({
          x: f.x + Math.cos(a) * 20, y: f.y + Math.sin(a) * 20,
          vx: Math.cos(a) * (f.bot ? 430 : 620), vy: Math.sin(a) * (f.bot ? 430 : 620),
          bot: f.bot, r: 5, life: 1.6,
          dmg: f.bot ? 8 : 14, col: f.bot ? '#ff8fa3' : '#9ff5ff'
        });
      }
      Milo.sound.tone({ f: f.bot ? 380 : 820, f2: f.bot ? 220 : 460, d: .05, v: f.bot ? .03 : .05, type: 'square' });
    }

    function boom(d, x, y, col, n) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.28, s = U.rand(50, 320);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(.25, .7), max: .7, col: col });
      }
    }

    return Milo.arcade(host, {
      id: 'blast-arena',
      fit: 'resize',
      bg: '#080b1c',
      stats: ['Score', 'Wave', 'Health'],
      touch: 'dpad',
      touchButtons: [{ key: 'action', label: 'FIRE' }],
      emo: '💥',
      start: {
        title: 'Blast Arena',
        text: 'You against an arena full of bots, wave after wave. Move with WASD, ' +
          'aim with the mouse, and use the blocks as cover. Shift dashes you out of trouble.',
        keys: ['WASD move', 'Mouse aim', 'Click / Space fire', 'Shift dash']
      },
      init: reset,

      onPointer: function (g, type) {
        if (type === 'down') g.data.firing = true;
        if (type === 'up') g.data.firing = false;
      },

      update: function (g, dt) {
        var d = g.data, me = d.me, i = g.input;

        // aim toward the pointer, in world space
        var wx = i.px + d.cam.x, wy = i.py + d.cam.y;
        me.aim = Math.atan2(wy - me.y, wx - me.x);

        var mx = (i.down('right') ? 1 : 0) - (i.down('left') ? 1 : 0);
        var my = (i.down('down') ? 1 : 0) - (i.down('up') ? 1 : 0);
        var len = Math.hypot(mx, my);
        if (len) { mx /= len; my /= len; }

        me.dashT -= dt;
        if (i.pressed('shift') && me.dashT < -0.6 && len) {
          me.dashT = .18;
          Milo.sound.tone({ f: 600, f2: 200, d: .14, v: .07, type: 'triangle' });
        }
        var speed = me.dashT > 0 ? 720 : 260;
        moveFighter(d, me, mx * speed, my * speed, dt);

        me.cool -= dt;
        me.hurt = Math.max(0, me.hurt - dt);
        if (i.down('action') || d.firing) shoot(g, me, me.aim);

        // bots
        d.bots.forEach(function (b) {
          b.cool -= dt;
          b.hurt = Math.max(0, b.hurt - dt);
          var dist = U.dist(b.x, b.y, me.x, me.y);
          var toMe = Math.atan2(me.y - b.y, me.x - b.x);
          b.aim = toMe;

          // Close to a comfortable range, strafe a little, then shoot.
          b.wander += U.rand(-1, 1) * dt * 3;
          var want = dist > 340 ? toMe : dist < 190 ? toMe + Math.PI : toMe + Math.PI / 2;
          var vx = Math.cos(want) * b.speed + Math.cos(b.wander) * 40;
          var vy = Math.sin(want) * b.speed + Math.sin(b.wander) * 40;
          moveFighter(d, b, vx, vy, dt);

          if (dist < 620 && b.cool <= 0) shoot(g, b, toMe);
        });

        // bullets
        for (var k = d.bullets.length - 1; k >= 0; k--) {
          var bl = d.bullets[k];
          bl.x += bl.vx * dt; bl.y += bl.vy * dt; bl.life -= dt;
          if (bl.life <= 0 || bl.x < 0 || bl.y < 0 || bl.x > AW || bl.y > AH ||
            blocked(d, bl.x, bl.y, 0)) {
            boom(d, bl.x, bl.y, bl.col, 3);
            d.bullets.splice(k, 1);
            continue;
          }
          if (bl.bot) {
            if (U.dist(bl.x, bl.y, me.x, me.y) < me.r + bl.r) {
              d.bullets.splice(k, 1);
              hurt(g, me, bl.dmg);
            }
          } else {
            for (var bi = d.bots.length - 1; bi >= 0; bi--) {
              var b2 = d.bots[bi];
              if (U.dist(bl.x, bl.y, b2.x, b2.y) < b2.r + bl.r) {
                d.bullets.splice(k, 1);
                b2.hp -= bl.dmg;
                b2.hurt = .15;
                boom(d, bl.x, bl.y, b2.col, 5);
                if (b2.hp <= 0) {
                  d.bots.splice(bi, 1);
                  d.kills++;
                  g.score += 100 + d.wave * 10;
                  g.set('Score', U.fmt(g.score));
                  d.shake = .6;
                  boom(d, b2.x, b2.y, b2.col, 24);
                  Milo.sound.explode();
                  if (Math.random() < .38) {
                    d.pickups.push({ x: b2.x, y: b2.y, kind: Math.random() < .55 ? 'hp' : 'gun', t: 0 });
                  }
                }
                break;
              }
            }
          }
        }

        // pickups
        d.pickups = d.pickups.filter(function (p) {
          p.t += dt;
          if (U.dist(p.x, p.y, me.x, me.y) < 34) {
            Milo.sound.powerup();
            if (p.kind === 'hp') { me.hp = Math.min(me.maxHp, me.hp + 35); g.set('Health', Math.round(me.hp)); }
            else { me.weapon = Math.min(3, me.weapon + 1); d.weaponT = 16; }
            g.score += 40;
            g.set('Score', U.fmt(g.score));
            return false;
          }
          return p.t < 22;
        });

        if (me.weapon > 1) {
          d.weaponT -= dt;
          if (d.weaponT <= 0) me.weapon = 1;
        }

        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
          p.vx *= .96; p.vy *= .96;
          return p.life > 0;
        });

        d.shake = Math.max(0, d.shake - dt * 3);

        if (!d.bots.length) {
          d.waveTimer -= dt;
          if (d.waveTimer <= 0) { spawnWave(g); d.waveTimer = 2.4; }
        }

        d.cam.x = U.clamp(me.x - g.W / 2, 0, Math.max(0, AW - g.W));
        d.cam.y = U.clamp(me.y - g.H / 2, 0, Math.max(0, AH - g.H));
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, me = d.me;
        c.fillStyle = '#0b0f26'; c.fillRect(0, 0, g.W, g.H);

        c.save();
        if (d.shake > 0) c.translate(U.rand(-1, 1) * d.shake * 6, U.rand(-1, 1) * d.shake * 6);
        c.translate(-d.cam.x, -d.cam.y);

        // floor
        c.fillStyle = '#12183a';
        c.fillRect(0, 0, AW, AH);
        c.strokeStyle = 'rgba(124,92,255,.14)'; c.lineWidth = 1;
        c.beginPath();
        for (var x = 0; x <= AW; x += 80) { c.moveTo(x, 0); c.lineTo(x, AH); }
        for (var y = 0; y <= AH; y += 80) { c.moveTo(0, y); c.lineTo(AW, y); }
        c.stroke();
        c.strokeStyle = '#22d3ee'; c.lineWidth = 5;
        c.strokeRect(0, 0, AW, AH);

        d.blocks.forEach(function (b) {
          c.fillStyle = '#232a58';
          U.roundRect(c, b.x, b.y, b.w, b.h, 8); c.fill();
          c.fillStyle = 'rgba(255,255,255,.07)';
          U.roundRect(c, b.x + 6, b.y + 6, b.w - 12, 14, 5); c.fill();
          c.strokeStyle = 'rgba(124,92,255,.5)'; c.lineWidth = 2;
          U.roundRect(c, b.x, b.y, b.w, b.h, 8); c.stroke();
        });

        d.pickups.forEach(function (p) {
          var col = p.kind === 'hp' ? '#fb7185' : '#34d399';
          var bob = Math.sin(p.t * 4) * 4;
          c.shadowColor = col; c.shadowBlur = 18;
          c.fillStyle = col;
          U.roundRect(c, p.x - 13, p.y - 13 + bob, 26, 26, 7); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = '#08122a';
          c.font = '800 15px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText(p.kind === 'hp' ? '+' : '▲', p.x, p.y + 5 + bob);
        });

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - 2.5, p.y - 2.5, 5, 5);
        });
        c.globalAlpha = 1;

        d.bullets.forEach(function (b) {
          c.shadowColor = b.col; c.shadowBlur = 10;
          c.fillStyle = b.col;
          c.beginPath(); c.arc(b.x, b.y, b.r, 0, 7); c.fill();
        });
        c.shadowBlur = 0;

        function drawFighter(f) {
          c.save();
          c.translate(f.x, f.y);
          c.rotate(f.aim);
          c.fillStyle = 'rgba(0,0,0,.35)';
          c.beginPath(); c.arc(2, 2, f.r, 0, 7); c.fill();
          c.fillStyle = f.hurt > 0 ? '#fff' : f.col;
          if (!f.bot) { c.shadowColor = f.col; c.shadowBlur = 16; }
          c.beginPath(); c.arc(0, 0, f.r, 0, 7); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = '#0d1230';
          U.roundRect(c, f.r - 4, -4, 20, 8, 3); c.fill();
          c.restore();

          if (f.bot || f.hp < f.maxHp) {
            var w = 40;
            c.fillStyle = 'rgba(0,0,0,.55)';
            c.fillRect(f.x - w / 2, f.y - f.r - 14, w, 5);
            c.fillStyle = f.bot ? '#fb7185' : '#34d399';
            c.fillRect(f.x - w / 2, f.y - f.r - 14, w * Math.max(0, f.hp / f.maxHp), 5);
          }
          if (f.bot) {
            c.fillStyle = 'rgba(255,255,255,.55)';
            c.font = '600 11px Outfit, sans-serif'; c.textAlign = 'center';
            c.fillText(f.name, f.x, f.y - f.r - 19);
          }
        }

        d.bots.forEach(drawFighter);
        drawFighter(me);
        c.restore();

        // health bar + minimap
        var hb = 220;
        c.fillStyle = 'rgba(8,10,26,.65)';
        U.roundRect(c, 14, g.H - 42, hb + 8, 26, 8); c.fill();
        c.fillStyle = me.hp > 40 ? '#34d399' : '#fb7185';
        U.roundRect(c, 18, g.H - 38, hb * U.clamp(me.hp / me.maxHp, 0, 1), 18, 6); c.fill();
        c.fillStyle = '#fff';
        c.font = '700 12px Outfit, sans-serif'; c.textAlign = 'left';
        c.fillText(Math.max(0, Math.round(me.hp)) + ' HP', 24, g.H - 24);

        var mmW = 120, mmH = mmW * (AH / AW);
        var mx0 = g.W - mmW - 14, my0 = g.H - mmH - 14;
        c.fillStyle = 'rgba(8,10,26,.6)';
        U.roundRect(c, mx0, my0, mmW, mmH, 6); c.fill();
        d.bots.forEach(function (b) {
          c.fillStyle = b.col;
          c.fillRect(mx0 + b.x / AW * mmW - 1.5, my0 + b.y / AH * mmH - 1.5, 3, 3);
        });
        c.fillStyle = '#22d3ee';
        c.fillRect(mx0 + me.x / AW * mmW - 2, my0 + me.y / AH * mmH - 2, 4, 4);

        if (me.weapon > 1) {
          c.fillStyle = '#34d399';
          c.font = '700 12px Outfit, sans-serif';
          c.fillText('WEAPON LV' + me.weapon + '  ' + Math.max(0, d.weaponT).toFixed(1) + 's', 24, g.H - 52);
        }
      }
    });

    function moveFighter(d, f, vx, vy, dt) {
      var nx = f.x + vx * dt;
      if (!blocked(d, nx, f.y, f.r) && nx > f.r && nx < AW - f.r) f.x = nx;
      var ny = f.y + vy * dt;
      if (!blocked(d, f.x, ny, f.r) && ny > f.r && ny < AH - f.r) f.y = ny;
    }

    function hurt(g, f, dmg) {
      var d = g.data;
      f.hp -= dmg;
      f.hurt = .18;
      d.shake = .5;
      g.set('Health', Math.max(0, Math.round(f.hp)));
      Milo.sound.hit();
      boom(d, f.x, f.y, '#fff', 6);
      if (f.hp <= 0) {
        boom(d, f.x, f.y, '#22d3ee', 34);
        g.gameOver({ text: 'You survived ' + d.wave + ' wave' + (d.wave === 1 ? '' : 's') + ' and took down ' + d.kills + ' bots.' });
      }
    }
  }

  window.Milo.register({
    id: 'blast-arena', title: 'Blast Arena', emo: '💥', category: 'Action',
    tagline: 'Last one standing in a bot arena',
    description: 'A top-down arena that keeps sending bots at you, more of them and ' +
      'tougher every wave. Move with WASD, aim with the mouse, dash with Shift and put ' +
      'the cover blocks between you and their fire. Downed bots sometimes drop health or ' +
      'a weapon upgrade — you will need both.',
    controls: ['WASD', 'Mouse aim', 'Click fire', 'Shift dash'],
    colors: ['#7c5cff', '#fb7185'],
    featured: true,
    tags: ['shooter', 'arena', 'io-style', 'waves', 'action'],
    mount: mount
  });
})();
