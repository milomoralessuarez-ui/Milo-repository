/* Hover Bike — skim the dunes at sunset; thrust, rings, and a fuel gauge. */
(function () {
  'use strict';
  var W = 800, H = 500, PX = 210, SEED = 91;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function duneY(x) {
      return H - 46 - U.noise2(x * 0.0011, 0, SEED) * (150 + Math.min(90, x / 700)) -
        U.noise2(x * 0.004, 5, SEED) * 30;
    }

    function reset(g) {
      var d = g.data;
      d.px = 0;
      d.y = duneY(0) - 130;
      d.vy = 0;
      d.fuel = 100;
      d.boostT = 0;
      d.bonus = 0;
      d.rings = [];
      d.cans = [];
      d.nextRing = 900;
      d.nextCan = 500;
      d.parts = [];
      d.texts = [];
      d.shake = 0;
      d.warnT = 0;
      d.dead = false;
      d.dieT = 0;
      g.set('Score', 0);
      g.set('Fuel', '100%');
      g.set('Best', U.fmt(g.best));
    }

    function txt(d, x, y, t, col) {
      d.texts.push({ x: x, y: y, t: t, life: .8, max: .8, col: col || '#ffd166' });
    }

    function crash(g) {
      var d = g.data;
      d.dead = true;
      d.dieT = .9;
      d.shake = 15;
      d.vy = -240;
      for (var k = 0; k < 28; k++) {
        var a = Math.random() * 6.283, s = U.rand(70, 360);
        d.parts.push({
          x: PX, y: d.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60,
          life: U.rand(.4, .9), max: .9, grav: 500,
          col: Math.random() < .4 ? '#67e8f9' : (Math.random() < .5 ? '#ffd166' : '#fb7185')
        });
      }
      Milo.sound.explode();
    }

    return Milo.arcade(host, {
      id: 'hover-bike',
      w: W, h: H, bg: '#1b0b3b',
      stats: ['Score', 'Fuel', 'Best'],
      emo: '🛵',
      start: {
        title: 'Hover Bike',
        text: 'Hold to fire the thruster, let go to sink. Thread the amber rings for ' +
          'boosts, grab fuel cells before the gauge dies — an empty tank ends the ' +
          'ride the hard way.',
        keys: ['Hold Space / Hold anywhere']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, i = g.input, k;
        d.shake = Math.max(0, d.shake - dt * 40);

        if (d.dead) {
          d.vy += 1100 * dt;
          d.y += d.vy * dt;
          d.dieT -= dt;
          cool(d, dt);
          if (d.dieT <= 0) {
            g.gameOver({
              text: U.fmt(Math.floor(d.px / 10)) + ' m across the dunes' +
                (d.fuel <= 0 ? ' — the tank ran dry.' : '.')
            });
          }
          return;
        }

        var hold = (i.down('action') || i.pdown) && d.fuel > 0;
        var v = 270 + Math.min(230, d.px / 450) + (d.boostT > 0 ? 210 : 0);
        d.boostT = Math.max(0, d.boostT - dt);
        d.px += v * dt;

        d.vy += (hold ? -2450 : 0) * dt + 1000 * dt;
        d.vy = U.clamp(d.vy, -480, 540);
        d.y += d.vy * dt;
        if (d.y < 46) { d.y = 46; d.vy = Math.max(0, d.vy); }

        d.fuel -= (hold ? 8.5 : 1.6) * dt;
        if (d.fuel < 0) d.fuel = 0;
        g.set('Fuel', Math.ceil(d.fuel) + '%');
        if (d.fuel < 25) {
          d.warnT -= dt;
          if (d.warnT <= 0) {
            d.warnT = .8;
            Milo.sound.tone({ f: 220, f2: 160, d: .1, v: .07, type: 'square' });
          }
        }

        // thrust flame + skim sparks
        if (hold) {
          d.parts.push({
            x: PX - 8 + U.rand(-4, 4), y: d.y + 16, vx: U.rand(-30, 30), vy: U.rand(140, 260),
            life: .3, max: .3, grav: 0, col: Math.random() < .5 ? '#67e8f9' : '#e0f2fe'
          });
        }
        var gy = duneY(d.px);
        if (gy - d.y < 46) {
          d.parts.push({
            x: PX + U.rand(-6, 6), y: gy - 2, vx: U.rand(-160, -60), vy: U.rand(-140, -40),
            life: .35, max: .35, grav: 400, col: '#ffb457'
          });
        }

        // terrain collision (nose and tail)
        if (d.y + 13 > gy || d.y + 10 > duneY(d.px + 20)) { crash(g); return; }

        // rings
        while (d.nextRing < d.px + 1200) {
          var ry = duneY(d.nextRing) - U.rand(130, 250);
          d.rings.push({ x: d.nextRing, y: Math.max(84, ry), got: 0 });
          d.nextRing += U.rand(620, 900);
        }
        for (k = d.rings.length - 1; k >= 0; k--) {
          var r = d.rings[k];
          if (r.x < d.px - 300) { d.rings.splice(k, 1); continue; }
          if (!r.got && Math.abs(r.x - d.px) < 13) {
            if (Math.abs(d.y - r.y) < 40) {
              r.got = 1;
              d.boostT = 2.2;
              d.bonus += 100;
              txt(d, PX, d.y - 44, 'BOOST +100');
              Milo.sound.powerup();
              for (var q = 0; q < 12; q++) {
                var a = Math.random() * 6.283;
                d.parts.push({
                  x: PX, y: r.y, vx: Math.cos(a) * U.rand(60, 220), vy: Math.sin(a) * U.rand(60, 220),
                  life: .5, max: .5, grav: 0, col: '#ffd166'
                });
              }
            } else {
              r.got = -1;
              Milo.sound.tone({ f: 200, f2: 140, d: .08, v: .05, type: 'triangle' });
            }
          }
        }

        // fuel cells
        while (d.nextCan < d.px + 1200) {
          var cy = duneY(d.nextCan) - U.rand(70, 240);
          d.cans.push({ x: d.nextCan, y: Math.max(70, cy), taken: false, bob: Math.random() * 6.28 });
          d.nextCan += U.rand(520, 780);
        }
        for (k = d.cans.length - 1; k >= 0; k--) {
          var cn = d.cans[k];
          if (cn.x < d.px - 300) { d.cans.splice(k, 1); continue; }
          if (!cn.taken && U.dist(d.px, d.y, cn.x, cn.y + Math.sin(cn.bob + g.t * 3) * 8) < 34) {
            cn.taken = true;
            d.fuel = Math.min(100, d.fuel + 35);
            txt(d, PX, d.y - 44, '+FUEL', '#4ade80');
            Milo.sound.coin();
          }
        }

        cool(d, dt);
        g.score = Math.floor(d.px / 10) + d.bonus;
        g.set('Score', U.fmt(g.score));
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, k, x;
        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#1b0b3b');
        sky.addColorStop(.45, '#6d1b4e');
        sky.addColorStop(.66, '#e2543a');
        sky.addColorStop(.8, '#ffb457');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);

        // synthwave sun with slit lines
        var sunY = H * .56;
        c.save();
        c.shadowColor = '#ffd166'; c.shadowBlur = 40;
        c.fillStyle = '#ffd166';
        c.beginPath(); c.arc(W * .62, sunY, 74, 0, 7); c.fill();
        c.shadowBlur = 0;
        c.fillStyle = 'rgba(226,84,58,.85)';
        for (k = 0; k < 5; k++) c.fillRect(W * .62 - 80, sunY + 8 + k * 14, 160, 4 + k);
        c.restore();

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        // far dunes, parallax
        c.fillStyle = '#3a1140';
        c.beginPath();
        c.moveTo(0, H);
        for (x = 0; x <= W; x += 16) {
          c.lineTo(x, H - 90 - U.noise2((d.px * .35 + x) * .0014, 3, SEED) * 110);
        }
        c.lineTo(W, H); c.closePath(); c.fill();

        // main dunes with rim light
        c.beginPath();
        c.moveTo(-10, H + 10);
        for (x = -10; x <= W + 10; x += 8) c.lineTo(x, duneY(d.px + x - PX));
        c.lineTo(W + 10, H + 10);
        c.closePath();
        var dg = c.createLinearGradient(0, H - 240, 0, H);
        dg.addColorStop(0, '#2a0f2e');
        dg.addColorStop(1, '#0e0714');
        c.fillStyle = dg; c.fill();
        c.strokeStyle = '#ff8c42'; c.lineWidth = 2.5;
        c.shadowColor = '#ff8c42'; c.shadowBlur = 8;
        c.beginPath();
        for (x = -10; x <= W + 10; x += 8) {
          var dy = duneY(d.px + x - PX);
          if (x === -10) c.moveTo(x, dy); else c.lineTo(x, dy);
        }
        c.stroke();
        c.shadowBlur = 0;

        // rings
        for (k = 0; k < d.rings.length; k++) {
          var r = d.rings[k];
          var rx = r.x - d.px + PX;
          if (rx < -60 || rx > W + 60) continue;
          c.save();
          c.translate(rx, r.y);
          c.globalAlpha = r.got === -1 ? .25 : 1;
          c.strokeStyle = r.got === 1 ? '#4ade80' : '#ffd166';
          c.shadowColor = c.strokeStyle; c.shadowBlur = r.got ? 4 : 14;
          c.lineWidth = 7;
          c.beginPath(); c.ellipse(0, 0, 13, 44, 0, 0, 7); c.stroke();
          c.shadowBlur = 0;
          c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2;
          c.beginPath(); c.ellipse(-3, 0, 13, 44, 0, Math.PI * .6, Math.PI * 1.4); c.stroke();
          c.restore();
        }
        c.globalAlpha = 1;

        // fuel cells
        for (k = 0; k < d.cans.length; k++) {
          var cn = d.cans[k];
          if (cn.taken) continue;
          var cx = cn.x - d.px + PX;
          if (cx < -40 || cx > W + 40) continue;
          var cyy = cn.y + Math.sin(cn.bob + g.t * 3) * 8;
          c.save();
          c.translate(cx, cyy);
          c.shadowColor = '#4ade80'; c.shadowBlur = 12;
          c.fillStyle = '#166534';
          U.roundRect(c, -11, -14, 22, 28, 5); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = '#4ade80';
          U.roundRect(c, -11, -14, 22, 9, 4); c.fill();
          c.fillStyle = '#bbf7d0';
          c.font = '800 12px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText('F', 0, 9);
          c.restore();
        }

        // particles
        for (k = 0; k < d.parts.length; k++) {
          var p = d.parts[k];
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - 2.5, p.y - 2.5, 5, 5);
        }
        c.globalAlpha = 1;

        // bike
        if (!d.dead || d.dieT > 0) {
          c.save();
          c.translate(PX, d.y);
          c.rotate(U.clamp(d.vy * .0007, -.34, .34) + (d.dead ? d.dieT * 4 : 0));
          if (d.boostT > 0) {
            c.strokeStyle = 'rgba(103,232,249,.5)'; c.lineWidth = 3;
            c.beginPath(); c.moveTo(-58, -2); c.lineTo(-26, -2); c.stroke();
            c.beginPath(); c.moveTo(-52, 8); c.lineTo(-24, 8); c.stroke();
          }
          c.shadowColor = '#22d3ee'; c.shadowBlur = 16;
          c.fillStyle = '#22d3ee';
          c.beginPath();
          c.moveTo(26, 2); c.lineTo(8, -10); c.lineTo(-20, -8);
          c.lineTo(-24, 4); c.lineTo(-10, 12); c.lineTo(18, 10);
          c.closePath(); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = '#0e7490';
          c.beginPath(); c.ellipse(-2, 10, 14, 5, 0, 0, 7); c.fill();
          // rider
          c.fillStyle = '#312e81';
          U.roundRect(c, -8, -20, 12, 14, 5); c.fill();
          c.fillStyle = '#fda4af';
          c.beginPath(); c.arc(-2, -24, 5.5, 0, 7); c.fill();
          c.fillStyle = '#e0f2fe';
          c.fillRect(24, -2, 5, 4);
          c.restore();
        }

        // floating texts
        c.font = '800 16px Outfit, sans-serif';
        c.textAlign = 'center';
        for (k = 0; k < d.texts.length; k++) {
          var t = d.texts[k];
          c.globalAlpha = Math.max(0, t.life / t.max);
          c.fillStyle = t.col;
          c.fillText(t.t, t.x, t.y);
        }
        c.globalAlpha = 1;
        c.restore();

        // fuel bar
        var fw = 150;
        c.fillStyle = 'rgba(0,0,0,.4)';
        U.roundRect(c, 18, H - 34, fw + 4, 16, 8); c.fill();
        var fr = d.fuel / 100;
        c.fillStyle = fr < .25 ? (Math.sin(g.t * 10) > 0 ? '#ef4444' : '#7f1d1d') : '#4ade80';
        if (fr > 0) { U.roundRect(c, 20, H - 32, fw * fr, 12, 6); c.fill(); }
        c.fillStyle = 'rgba(255,255,255,.7)';
        c.font = '700 11px Outfit, sans-serif'; c.textAlign = 'left';
        c.fillText('FUEL', 22, H - 40);
      }
    });

    function cool(d, dt) {
      var k;
      for (k = d.parts.length - 1; k >= 0; k--) {
        var p = d.parts[k];
        p.x += (p.vx - 120) * dt; p.y += p.vy * dt; p.vy += (p.grav || 0) * dt; p.life -= dt;
        if (p.life <= 0) d.parts.splice(k, 1);
      }
      for (k = d.texts.length - 1; k >= 0; k--) {
        d.texts[k].y -= 36 * dt; d.texts[k].life -= dt;
        if (d.texts[k].life <= 0) d.texts.splice(k, 1);
      }
    }
  }

  window.Milo.register({
    id: 'hover-bike', title: 'Hover Bike', emo: '🛵', category: 'Action',
    tagline: 'Thrust, sink, and thread the boost rings',
    description: 'A hover bike hugs the dunes at sunset: hold to fire the thruster, ' +
      'release and gravity drags you back toward the sand. Amber rings pay 100 points ' +
      'and a two-second speed boost if you pass through their centre, and green fuel ' +
      'cells refill the tank the thruster is constantly draining — run dry and you can ' +
      'only watch the next dune arrive. The dunes swell taller as the metres pile up, ' +
      'so save some altitude for the big ones.',
    controls: ['Space (hold)', 'Hold anywhere'],
    colors: ['#e2543a', '#22d3ee'],
    tags: ['endless', 'one button', 'fuel', 'rings', 'sunset'],
    mount: mount
  });
})();
