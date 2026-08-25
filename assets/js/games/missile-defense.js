/* Missile Defense — intercept the incoming before the cities go. */
(function () {
  'use strict';
  var W = 860, H = 600, GROUND = H - 60;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.cities = [];
      for (var i = 0; i < 6; i++) {
        var x = 120 + i * ((W - 240) / 5);
        if (i === 3) x += 0;
        d.cities.push({ x: x, alive: true });
      }
      d.bases = [{ x: 60, ammo: 10 }, { x: W / 2, ammo: 10 }, { x: W - 60, ammo: 10 }];
      d.incoming = [];
      d.mine = [];
      d.blasts = [];
      d.wave = 1;
      d.spawned = 0;
      d.toSpawn = 8;
      d.spawnT = 0;
      d.between = 1.5;
      g.set('Score', 0);
      g.set('Wave', 1);
      g.set('Cities', 6);
    }

    function launch(g, tx, ty) {
      var d = g.data;
      // Fire from the nearest base that still has ammunition.
      var best = null, bestD = 1e9;
      d.bases.forEach(function (b) {
        if (!b.ammo) return;
        var dist = Math.abs(b.x - tx);
        if (dist < bestD) { bestD = dist; best = b; }
      });
      if (!best) { Milo.sound.tone({ f: 130, d: .1, v: .05, type: 'square' }); return; }
      best.ammo--;
      var a = Math.atan2(ty - GROUND, tx - best.x);
      d.mine.push({
        x: best.x, y: GROUND, tx: tx, ty: ty,
        vx: Math.cos(a) * 480, vy: Math.sin(a) * 480, sx: best.x, sy: GROUND
      });
      Milo.sound.tone({ f: 500, f2: 900, d: .1, v: .05, type: 'triangle' });
    }

    function blast(d, x, y) {
      d.blasts.push({ x: x, y: y, r: 2, max: 62, grow: true });
      Milo.sound.explode();
    }

    return Milo.arcade(host, {
      id: 'missile-defense',
      w: W, h: H, bg: '#050818',
      stats: ['Score', 'Wave', 'Cities'],
      emo: '🚀',
      noContextMenu: true,
      start: {
        title: 'Missile Defense',
        text: 'Click where you want a counter-missile to detonate. The blast takes out ' +
          'anything that flies through it, so lead the incoming rather than chasing it. ' +
          'Thirty rounds per wave, split across three batteries.',
        keys: ['Click to intercept']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play') return;
        if (y > GROUND - 10) return;
        launch(g, x, y);
      },

      update: function (g, dt) {
        var d = g.data;

        if (d.spawned < d.toSpawn) {
          d.spawnT -= dt;
          if (d.spawnT <= 0) {
            d.spawnT = U.rand(0.5, 1.5) / (1 + d.wave * 0.08);
            d.spawned++;
            var sx = U.rand(40, W - 40);
            var targets = d.cities.filter(function (c) { return c.alive; })
              .map(function (c) { return c.x; })
              .concat(d.bases.map(function (b) { return b.x; }));
            var tx = targets.length ? U.choice(targets) : W / 2;
            var speed = 40 + d.wave * 7;
            var a = Math.atan2(GROUND - 0, tx - sx);
            d.incoming.push({
              x: sx, y: 0, sx: sx, sy: 0,
              vx: Math.cos(a) * speed, vy: Math.sin(a) * speed
            });
          }
        } else if (!d.incoming.length && !d.mine.length && !d.blasts.length) {
          d.between -= dt;
          if (d.between <= 0) {
            d.wave++;
            g.set('Wave', d.wave);
            var bonus = d.bases.reduce(function (a, b) { return a + b.ammo; }, 0) * 5 +
              d.cities.filter(function (c) { return c.alive; }).length * 100;
            g.score += bonus;
            g.set('Score', U.fmt(g.score));
            d.bases.forEach(function (b) { b.ammo = 10; });
            d.spawned = 0;
            d.toSpawn = 8 + d.wave * 2;
            d.between = 1.5;
            Milo.sound.win();
          }
        }

        d.mine = d.mine.filter(function (m) {
          m.x += m.vx * dt; m.y += m.vy * dt;
          if (U.dist(m.x, m.y, m.tx, m.ty) < 12) { blast(d, m.tx, m.ty); return false; }
          return m.y > 0 && m.y < H;
        });

        for (var i = d.incoming.length - 1; i >= 0; i--) {
          var inc = d.incoming[i];
          inc.x += inc.vx * dt; inc.y += inc.vy * dt;

          var hit = d.blasts.some(function (b) { return U.dist(inc.x, inc.y, b.x, b.y) < b.r; });
          if (hit) {
            d.incoming.splice(i, 1);
            g.score += 25;
            g.set('Score', U.fmt(g.score));
            blast(d, inc.x, inc.y);
            continue;
          }
          if (inc.y >= GROUND) {
            d.incoming.splice(i, 1);
            blast(d, inc.x, GROUND);
            d.cities.forEach(function (city) {
              if (city.alive && Math.abs(city.x - inc.x) < 40) {
                city.alive = false;
                g.set('Cities', d.cities.filter(function (q) { return q.alive; }).length);
              }
            });
            d.bases.forEach(function (b) {
              if (Math.abs(b.x - inc.x) < 40) b.ammo = 0;
            });
            if (!d.cities.some(function (q) { return q.alive; })) {
              g.gameOver({ emo: '🚀', title: 'All cities lost', text: 'You held out to wave ' + d.wave + '.' });
              return;
            }
          }
        }

        d.blasts = d.blasts.filter(function (b) {
          if (b.grow) { b.r += 150 * dt; if (b.r >= b.max) b.grow = false; }
          else b.r -= 90 * dt;
          return b.r > 0;
        });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#0b1233'); sky.addColorStop(1, '#03040e');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);

        c.fillStyle = '#1b2a4a';
        c.fillRect(0, GROUND, W, H - GROUND);

        d.cities.forEach(function (city) {
          if (!city.alive) {
            c.fillStyle = '#3a2030';
            c.fillRect(city.x - 26, GROUND - 8, 52, 8);
            return;
          }
          c.fillStyle = '#38bdf8';
          for (var b = 0; b < 4; b++) {
            var bh = 16 + ((b * 7 + city.x) % 18);
            c.fillRect(city.x - 24 + b * 13, GROUND - bh, 10, bh);
          }
        });

        d.bases.forEach(function (b) {
          c.fillStyle = b.ammo ? '#34d399' : '#4a4a5a';
          c.beginPath();
          c.moveTo(b.x - 26, GROUND);
          c.lineTo(b.x, GROUND - 26);
          c.lineTo(b.x + 26, GROUND);
          c.closePath(); c.fill();
          c.fillStyle = '#062a1a';
          c.font = '700 13px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(b.ammo, b.x, GROUND - 6);
        });

        c.lineWidth = 2;
        c.strokeStyle = '#fb7185';
        d.incoming.forEach(function (m) {
          c.beginPath(); c.moveTo(m.sx, m.sy); c.lineTo(m.x, m.y); c.stroke();
          c.fillStyle = '#fff';
          c.beginPath(); c.arc(m.x, m.y, 3, 0, 7); c.fill();
        });
        c.strokeStyle = '#22d3ee';
        d.mine.forEach(function (m) {
          c.beginPath(); c.moveTo(m.sx, m.sy); c.lineTo(m.x, m.y); c.stroke();
        });

        d.blasts.forEach(function (b) {
          var grd = c.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
          grd.addColorStop(0, 'rgba(255,255,255,.95)');
          grd.addColorStop(.5, 'rgba(255,210,87,.8)');
          grd.addColorStop(1, 'rgba(251,113,133,0)');
          c.fillStyle = grd;
          c.beginPath(); c.arc(b.x, b.y, b.r, 0, 7); c.fill();
        });
      }
    });
  }

  window.Milo.register({
    id: 'missile-defense', title: 'Missile Defense', emo: '🚀', category: 'Arcade',
    tagline: 'Intercept the incoming, save the cities',
    description: 'Click where you want your counter-missile to detonate — the fireball ' +
      'destroys anything that flies through it while it lasts, so the trick is to lead the ' +
      'incoming rather than aim at it. Three batteries with ten rounds each per wave, and ' +
      'a hit on a battery wipes out its remaining ammunition.',
    controls: ['Click to intercept'],
    colors: ['#050818', '#22d3ee'],
    tags: ['classic', 'aiming', 'arcade', 'defence'],
    mount: mount
  });
})();
