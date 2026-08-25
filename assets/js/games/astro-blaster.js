/* Astro Blaster — twin-stick-ish space shooter with waves and power-ups. */
(function () {
  'use strict';
  var W = 800, H = 600;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.ship = { x: W / 2, y: H - 70, r: 14, cool: 0, inv: 2 };
      d.lives = 3;
      d.wave = 0;
      d.enemies = [];
      d.bullets = [];
      d.foeShots = [];
      d.parts = [];
      d.drops = [];
      d.stars = [];
      d.weapon = 1;
      d.weaponT = 0;
      d.shake = 0;
      d.waveTimer = 1;
      for (var i = 0; i < 90; i++) {
        d.stars.push({ x: Math.random() * W, y: Math.random() * H, z: U.rand(.25, 1) });
      }
      g.set('Score', 0);
      g.set('Wave', 0);
      g.set('Lives', 3);
    }

    function spawnWave(g) {
      var d = g.data;
      d.wave++;
      g.set('Wave', d.wave);
      var n = Math.min(22, 5 + d.wave * 2);
      var kinds = d.wave < 3 ? ['grunt'] : d.wave < 6 ? ['grunt', 'zig'] : ['grunt', 'zig', 'tank'];
      for (var i = 0; i < n; i++) {
        var kind = U.choice(kinds);
        var col = i % 8, row = (i / 8) | 0;
        d.enemies.push({
          kind: kind,
          x: 120 + col * 80 + U.rand(-10, 10),
          y: -60 - row * 62,
          r: kind === 'tank' ? 20 : 15,
          hp: kind === 'tank' ? 5 : (kind === 'zig' ? 2 : 1),
          t: Math.random() * 6,
          vy: (kind === 'tank' ? 26 : 40) + d.wave * 2.5,
          cool: U.rand(1, 4)
        });
      }
      Milo.sound.tone({ f: 200, f2: 420, d: .3, v: .09, type: 'sawtooth' });
    }

    function shoot(g) {
      var d = g.data, s = d.ship;
      if (s.cool > 0) return;
      s.cool = d.weapon >= 3 ? .1 : .15;
      var mk = function (dx, off) {
        d.bullets.push({ x: s.x + (off || 0), y: s.y - 16, vx: dx, vy: -640, r: 4 });
      };
      if (d.weapon === 1) mk(0);
      else if (d.weapon === 2) { mk(0, -9); mk(0, 9); }
      else { mk(0, -10); mk(0, 10); mk(-190); mk(190); }
      Milo.sound.tone({ f: 900, f2: 500, d: .05, v: .05, type: 'square' });
    }

    function boom(d, x, y, col, n) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.28, s = U.rand(40, 300);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(.25, .7), max: .7, col: col });
      }
    }

    return Milo.arcade(host, {
      id: 'astro-blaster',
      w: W, h: H, bg: '#04030f',
      stats: ['Score', 'Wave', 'Lives'],
      emo: '🚀',
      touch: 'dpad',
      touchButtons: [{ key: 'action', label: 'FIRE' }],
      start: {
        title: 'Astro Blaster',
        text: 'Endless waves of hostiles. Shoot them down, grab the power-ups, ' +
          'and see how deep you can get.',
        keys: ['← → ↑ ↓ / WASD', 'Space to fire', 'Mouse to aim']
      },
      init: reset,
      onPointer: function (g, type, x, y) {
        var d = g.data;
        if (!d.ship) return;
        d.ship.x = U.clamp(x, 20, W - 20);
        d.ship.y = U.clamp(y, 60, H - 24);
        if (type === 'down') d.firing = true;
        if (type === 'up') d.firing = false;
      },

      update: function (g, dt) {
        var d = g.data, i = g.input, s = d.ship;

        var sp = 380 * dt;
        if (i.down('left')) s.x -= sp;
        if (i.down('right')) s.x += sp;
        if (i.down('up')) s.y -= sp;
        if (i.down('down')) s.y += sp;
        s.x = U.clamp(s.x, 20, W - 20);
        s.y = U.clamp(s.y, 60, H - 24);

        s.cool -= dt;
        s.inv = Math.max(0, s.inv - dt);
        d.weaponT = Math.max(0, d.weaponT - dt);
        if (d.weaponT === 0 && d.weapon > 1) d.weapon = 1;
        d.shake = Math.max(0, d.shake - dt * 4);

        if (i.down('action') || d.firing) shoot(g);

        d.stars.forEach(function (st) {
          st.y += (28 + st.z * 90) * dt;
          if (st.y > H) { st.y = -2; st.x = Math.random() * W; }
        });

        // waves
        if (!d.enemies.length) {
          d.waveTimer -= dt;
          if (d.waveTimer <= 0) { spawnWave(g); d.waveTimer = 1.6; }
        }

        // bullets
        d.bullets = d.bullets.filter(function (b) {
          b.x += b.vx * dt; b.y += b.vy * dt;
          return b.y > -20 && b.x > -20 && b.x < W + 20;
        });
        d.foeShots = d.foeShots.filter(function (b) {
          b.x += b.vx * dt; b.y += b.vy * dt;
          return b.y < H + 20 && b.x > -20 && b.x < W + 20;
        });

        // enemies
        for (var k = d.enemies.length - 1; k >= 0; k--) {
          var e = d.enemies[k];
          e.t += dt;
          e.y += e.vy * dt;
          if (e.kind === 'zig') e.x += Math.sin(e.t * 2.4) * 110 * dt;
          if (e.kind === 'tank') e.x += Math.sin(e.t * .8) * 50 * dt;
          e.x = U.clamp(e.x, 24, W - 24);

          e.cool -= dt;
          if (e.cool <= 0 && e.y > 0 && e.y < H - 120) {
            e.cool = U.rand(1.6, 3.6) / (1 + d.wave * .05);
            var ang = Math.atan2(s.y - e.y, s.x - e.x);
            var bs = 210 + d.wave * 6;
            d.foeShots.push({ x: e.x, y: e.y + e.r, vx: Math.cos(ang) * bs, vy: Math.sin(ang) * bs, r: 5 });
          }

          if (e.y > H + 50) { d.enemies.splice(k, 1); continue; }

          // hit by player bullet?
          for (var b = d.bullets.length - 1; b >= 0; b--) {
            var bl = d.bullets[b];
            if (U.dist(bl.x, bl.y, e.x, e.y) < e.r + bl.r) {
              d.bullets.splice(b, 1);
              e.hp--;
              boom(d, bl.x, bl.y, '#ffd257', 4);
              if (e.hp <= 0) {
                boom(d, e.x, e.y, e.kind === 'tank' ? '#fb7185' : '#22d3ee', 20);
                d.enemies.splice(k, 1);
                g.score += e.kind === 'tank' ? 120 : (e.kind === 'zig' ? 55 : 25);
                g.set('Score', U.fmt(g.score));
                d.shake = .5;
                Milo.sound.explode();
                if (Math.random() < .16) {
                  d.drops.push({ x: e.x, y: e.y, kind: Math.random() < .3 ? 'life' : 'gun' });
                }
              } else Milo.sound.hit();
              break;
            }
          }

          if (s.inv <= 0 && U.dist(s.x, s.y, e.x, e.y) < e.r + s.r) {
            d.enemies.splice(k, 1);
            boom(d, e.x, e.y, '#fb7185', 20);
            hurt(g);
          }
        }

        // enemy shots vs ship
        for (var f = d.foeShots.length - 1; f >= 0; f--) {
          var fs = d.foeShots[f];
          if (s.inv <= 0 && U.dist(s.x, s.y, fs.x, fs.y) < s.r + fs.r) {
            d.foeShots.splice(f, 1);
            hurt(g);
          }
        }

        // drops
        d.drops = d.drops.filter(function (p) {
          p.y += 120 * dt;
          if (p.y > H + 20) return false;
          if (U.dist(s.x, s.y, p.x, p.y) < 26) {
            Milo.sound.powerup();
            if (p.kind === 'life') { d.lives++; g.set('Lives', d.lives); }
            else { d.weapon = Math.min(3, d.weapon + 1); d.weaponT = 14; }
            g.score += 30;
            g.set('Score', U.fmt(g.score));
            return false;
          }
          return true;
        });

        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
          return p.life > 0;
        });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, s = d.ship;
        c.fillStyle = '#04030f'; c.fillRect(0, 0, W, H);

        c.save();
        if (d.shake > 0) c.translate(U.rand(-1, 1) * d.shake * 4, U.rand(-1, 1) * d.shake * 4);

        d.stars.forEach(function (st) {
          c.globalAlpha = st.z;
          c.fillStyle = '#bcd0ff';
          c.fillRect(st.x, st.y, 1.6 * st.z + .4, 2.6 * st.z + .4);
        });
        c.globalAlpha = 1;

        d.drops.forEach(function (p) {
          var col = p.kind === 'life' ? '#fb7185' : '#34d399';
          c.shadowColor = col; c.shadowBlur = 16;
          c.fillStyle = col;
          U.roundRect(c, p.x - 12, p.y - 12, 24, 24, 7); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = '#06122a';
          c.font = '800 14px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText(p.kind === 'life' ? '♥' : '▲', p.x, p.y + 5);
        });

        d.enemies.forEach(function (e) {
          var col = e.kind === 'tank' ? '#fb7185' : e.kind === 'zig' ? '#a78bfa' : '#22d3ee';
          c.shadowColor = col; c.shadowBlur = 12;
          c.fillStyle = col;
          c.beginPath();
          c.moveTo(e.x, e.y + e.r);
          c.lineTo(e.x - e.r, e.y - e.r * .7);
          c.lineTo(e.x, e.y - e.r * .25);
          c.lineTo(e.x + e.r, e.y - e.r * .7);
          c.closePath(); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = 'rgba(255,255,255,.85)';
          c.beginPath(); c.arc(e.x, e.y - e.r * .2, e.r * .22, 0, 7); c.fill();
        });

        c.fillStyle = '#ffe066';
        d.bullets.forEach(function (b) {
          c.shadowColor = '#ffe066'; c.shadowBlur = 10;
          U.roundRect(c, b.x - 2.5, b.y - 9, 5, 18, 2.5); c.fill();
        });
        c.shadowBlur = 0;

        c.fillStyle = '#ff5b7f';
        d.foeShots.forEach(function (b) {
          c.shadowColor = '#ff5b7f'; c.shadowBlur = 10;
          c.beginPath(); c.arc(b.x, b.y, b.r, 0, 7); c.fill();
        });
        c.shadowBlur = 0;

        // ship
        if (s.inv <= 0 || Math.floor(g.t * 12) % 2 === 0) {
          c.save();
          c.translate(s.x, s.y);
          c.fillStyle = '#ff9d3c';
          c.beginPath();
          c.moveTo(-6, 14); c.lineTo(0, 14 + 10 + Math.random() * 8); c.lineTo(6, 14);
          c.closePath(); c.fill();
          c.shadowColor = '#7c5cff'; c.shadowBlur = 16;
          c.fillStyle = '#e9eeff';
          c.beginPath();
          c.moveTo(0, -18); c.lineTo(-14, 12); c.lineTo(0, 6); c.lineTo(14, 12);
          c.closePath(); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = '#22d3ee';
          c.beginPath(); c.arc(0, -2, 4.5, 0, 7); c.fill();
          c.restore();
        }

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - 2, p.y - 2, 4, 4);
        });
        c.globalAlpha = 1;

        if (d.weapon > 1) {
          c.fillStyle = '#34d399';
          c.font = '700 12px Outfit, sans-serif';
          c.textAlign = 'left';
          c.fillText('WEAPON LV' + d.weapon + '  ' + d.weaponT.toFixed(1) + 's', 14, H - 16);
        }
        c.restore();
      }
    });

    function hurt(g) {
      var d = g.data;
      d.lives--;
      d.ship.inv = 2.2;
      d.shake = 1;
      d.weapon = 1;
      g.set('Lives', Math.max(0, d.lives));
      Milo.sound.explode();
      boom(d, d.ship.x, d.ship.y, '#fff', 26);
      if (d.lives <= 0) {
        g.gameOver({ text: 'You survived to wave ' + d.wave + '.' });
      }
    }
  }

  window.Milo.register({
    id: 'astro-blaster', title: 'Astro Blaster', emo: '🚀', category: 'Action',
    tagline: 'Endless waves of alien attackers',
    description: 'Fly your ship, shoot down wave after wave of hostiles and dodge their ' +
      'return fire. Green power-ups upgrade your gun to spread and then to a four-way ' +
      'cannon; red ones give a spare life. Every wave is bigger and faster than the last.',
    controls: ['WASD / Arrows', 'Space fire', 'Mouse'],
    colors: ['#7c5cff', '#ec4899'],
    featured: true,
    tags: ['shooter', 'space', 'waves', 'action', 'high score'],
    mount: mount
  });
})();
