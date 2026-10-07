/* Moto Hill Climb — throttle, brake and nerve over endless procedural dirt. */
(function () {
  'use strict';
  var W = 900, H = 560;
  var G = 1250, RIDE = 20, TAU = Math.PI * 2;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function groundY(d, x) {
      var t = U.clamp((x - 260) / 900, 0, 1);
      var amp = (46 + Math.min(120, x * 0.0038)) * t;
      var n = U.noise2(x * 0.0013, 11.7, d.seed) - 0.5;
      var n2 = U.noise2(x * 0.003, 31.2, d.seed) - 0.5;
      return 400 + n * 2 * amp + n2 * amp * 0.6;
    }
    function slopeAng(d, x) {
      return Math.atan2(groundY(d, x + 16) - groundY(d, x - 16), 32);
    }
    function angDiff(a, b) {
      var r = (a - b) % TAU;
      if (r > Math.PI) r -= TAU;
      if (r < -Math.PI) r += TAU;
      return r;
    }
    function addFloat(d, x, y, txt, col) {
      d.floats.push({ x: x, y: y, txt: txt, col: col || '#ffd257', t: 1.4 });
    }
    function meters(d) { return Math.max(0, (d.dist - 200) / 22); }
    function totalScore(d) { return Math.floor(meters(d)) * 3 + d.flipPts; }

    function reset(g) {
      var d = g.data;
      d.seed = (Math.random() * 9999) | 0;
      d.x = 200;
      d.y = groundY(d, 200) - RIDE;
      d.a = slopeAng(d, 200);
      d.vx = 0; d.vy = 0; d.av = 0;
      d.air = false; d.rot = 0; d.airT = 0;
      d.wheel = 0;
      d.fuel = 100;
      d.flips = 0; d.flipPts = 0;
      d.dist = 200;
      d.cans = [];
      d.nextCan = 950;
      d.parts = [];
      d.floats = [];
      d.stopT = 0;
      d.dying = 0;
      d.camY = d.y - H * 0.55;
      g.set('Score', 0);
      g.set('Flips', 0);
    }

    function crash(g, why) {
      var d = g.data;
      if (d.dying > 0) return;
      d.dying = 1.1;
      d.deadWhy = why;
      Milo.sound.explode();
      for (var i = 0; i < 26; i++) {
        var a = Math.random() * TAU, s = U.rand(60, 320);
        d.parts.push({
          x: d.x, y: d.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 120,
          t: U.rand(.4, .9), max: .9, col: U.choice(['#ffd257', '#fb7185', '#e0a266', '#fff'])
        });
      }
    }

    return Milo.arcade(host, {
      id: 'moto-hill',
      w: W, h: H, bg: '#2a1245',
      stats: ['Score', 'Flips'],
      touchButtons: [{ key: 'left', label: 'BRAKE' }, { key: 'right', label: 'GAS' }],
      emo: '🏍️',
      start: {
        title: 'Moto Hill Climb',
        text: 'Ride as far as the fuel lasts. Gas and brake also pitch the bike in the ' +
          'air — land on your wheels, flip for bonus points, and grab every jerry can.',
        keys: ['→ / ↑ gas', '← / ↓ brake', 'Backflip in the air for +300']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, inp = g.input;

        // Tumbling out after a crash.
        if (d.dying > 0) {
          d.dying -= dt;
          d.vy += G * dt;
          d.x += d.vx * dt; d.y += d.vy * dt;
          d.a += 9 * dt;
          var gy0 = groundY(d, d.x) - 8;
          if (d.y > gy0) { d.y = gy0; d.vx *= .7; d.vy = -Math.abs(d.vy) * .3; }
          stepFx(d, dt);
          if (d.dying <= 0) {
            var m0 = Math.floor(meters(d));
            g.gameOver({
              emo: '💥',
              title: d.deadWhy === 'fuel' ? 'Out of fuel' : 'Rider down!',
              text: m0 + ' m ridden, ' + d.flips + ' flip' + (d.flips === 1 ? '' : 's') + '.',
              score: totalScore(d)
            });
          }
          return;
        }

        var throttle = inp.down('right') || inp.down('up') || inp.down('action');
        var brake = inp.down('left') || inp.down('down');
        if (inp.pdown) { if (inp.px > W / 2) throttle = true; else brake = true; }
        if (d.fuel <= 0) throttle = false;

        // Fuel drain.
        d.fuel = Math.max(0, d.fuel - (2.2 + (throttle ? 2.9 : 0)) * dt);

        // Free-body integration, then clamp to terrain.
        d.vy += G * dt;
        d.x = Math.max(60, d.x + d.vx * dt);
        d.y += d.vy * dt;

        var gy = groundY(d, d.x) - RIDE;
        if (d.y >= gy - 2) {
          var sa = slopeAng(d, d.x);
          if (d.air && d.airT > .12) {
            // Landing — check the neck, count the flips.
            var diff = angDiff(d.a, sa);
            if (Math.abs(diff) > 1.75) { crash(g, 'neck'); return; }
            var n = Math.floor((Math.abs(d.rot) + 1.0) / TAU);
            if (n > 0) {
              d.flips += n;
              d.flipPts += n * 300;
              g.set('Flips', d.flips);
              addFloat(d, d.x, d.y - 60, (n > 1 ? n + 'x FLIP +' + n * 300 : 'FLIP +300'), '#a78bfa');
              Milo.sound.powerup();
            } else if (d.airT > .55) {
              Milo.sound.tone({ f: 160, f2: 90, d: .1, v: .09, type: 'triangle' });
            }
            d.a = sa + angDiff(d.a, sa);
          }
          d.air = false; d.airT = 0; d.rot = 0;
          d.y = gy;
          var s = d.vx * Math.cos(sa) + d.vy * Math.sin(sa);
          if (throttle) s += 385 * dt;
          if (brake) s -= 500 * dt;
          s += G * Math.sin(sa) * dt;
          s *= 1 - .28 * dt;
          s = U.clamp(s, -160, 560);
          d.vx = Math.cos(sa) * s;
          d.vy = Math.sin(sa) * s;
          d.a += angDiff(sa, d.a) * Math.min(1, dt * 13);
          d.av = 0;
          d.wheel += s / 13 * dt;

          // Dirt kicked up by the rear wheel.
          if (throttle && Math.abs(s) > 60 && Math.random() < .6) {
            d.parts.push({
              x: d.x - Math.cos(d.a) * 24, y: d.y + 10,
              vx: -Math.cos(sa) * U.rand(40, 130), vy: -U.rand(20, 90),
              t: U.rand(.25, .5), max: .5, col: U.choice(['#8a5a36', '#6b4226', '#c98d4e'])
            });
          }

          // Out of fuel and stopped = end of the run.
          if (d.fuel <= 0 && Math.abs(s) < 26) {
            d.stopT += dt;
            if (d.stopT > 1.2) { crash(g, 'fuel'); return; }
          } else d.stopT = 0;
        } else {
          if (!d.air) { d.air = true; d.rot = 0; d.airT = 0; }
          d.airT += dt;
          if (throttle) d.av -= 6.4 * dt;
          if (brake) d.av += 6.4 * dt;
          d.av *= 1 - .4 * dt;
          d.a += d.av * dt;
          d.rot += d.av * dt;
          d.wheel += d.vx / 13 * dt;
        }

        d.dist = Math.max(d.dist, d.x);

        // Jerry cans.
        while (d.nextCan < d.x + 1400) {
          d.cans.push({ x: d.nextCan, taken: false });
          d.nextCan += U.rand(520, 860) + Math.min(500, d.nextCan * 0.03);
        }
        for (var i = d.cans.length - 1; i >= 0; i--) {
          var cn = d.cans[i];
          if (cn.x < d.x - 900) { d.cans.splice(i, 1); continue; }
          if (cn.taken) continue;
          var cy = groundY(d, cn.x) - 26;
          if (Math.abs(cn.x - d.x) < 38 && Math.abs(cy - d.y) < 64) {
            cn.taken = true;
            d.fuel = Math.min(100, d.fuel + 42);
            addFloat(d, cn.x, cy - 30, '+FUEL', '#34d399');
            Milo.sound.coin();
          }
        }

        stepFx(d, dt);
        d.camY += (d.y - H * 0.55 - d.camY) * Math.min(1, dt * 4);
        g.score = totalScore(d);
        g.set('Score', U.fmt(g.score));
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var camX = d.x - W * 0.38;
        var camY = d.camY;

        // Dusk sky.
        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#2a1245');
        sky.addColorStop(.55, '#c73e5f');
        sky.addColorStop(1, '#ff9a5c');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(255,217,160,.9)';
        c.beginPath(); c.arc(W * .72 - camX * .02 % W, 160, 56, 0, TAU); c.fill();
        c.fillStyle = 'rgba(255,217,160,.18)';
        c.beginPath(); c.arc(W * .72 - camX * .02 % W, 160, 86, 0, TAU); c.fill();

        // Parallax dune silhouettes.
        bgHills(c, d, camX, camY, .18, 300, 90, '#61294f');
        bgHills(c, d, camX, camY, .42, 360, 120, '#3c1f52');

        // Terrain.
        var grad = c.createLinearGradient(0, 200, 0, H);
        grad.addColorStop(0, '#6b4226');
        grad.addColorStop(1, '#301c12');
        c.fillStyle = grad;
        c.beginPath();
        c.moveTo(-20, H + 40);
        for (var sx = -20; sx <= W + 40; sx += 22) {
          c.lineTo(sx, groundY(d, camX + sx) - camY);
        }
        c.lineTo(W + 40, H + 40);
        c.closePath(); c.fill();
        c.strokeStyle = '#e0a266'; c.lineWidth = 5; c.lineJoin = 'round';
        c.beginPath();
        for (sx = -20; sx <= W + 40; sx += 22) {
          var yy = groundY(d, camX + sx) - camY;
          if (sx === -20) c.moveTo(sx, yy); else c.lineTo(sx, yy);
        }
        c.stroke();

        // Cacti.
        for (var wi = Math.floor((camX - 100) / 240); wi < Math.floor((camX + W + 200) / 240); wi++) {
          var h = U.hash2(wi, 3, d.seed);
          if (h < .7) continue;
          var wx = wi * 240 + h * 160;
          var gy = groundY(d, wx);
          var px = wx - camX, py = gy - camY;
          c.fillStyle = '#265c38';
          U.roundRect(c, px - 5, py - 44, 10, 46, 5); c.fill();
          U.roundRect(c, px - 20, py - 34, 8, 16, 4); c.fill();
          U.roundRect(c, px - 20, py - 34, 18, 7, 3); c.fill();
          U.roundRect(c, px + 12, py - 28, 8, 14, 4); c.fill();
          U.roundRect(c, px + 4, py - 28, 16, 7, 3); c.fill();
        }

        // Fuel cans.
        d.cans.forEach(function (cn) {
          if (cn.taken) return;
          var px = cn.x - camX;
          if (px < -40 || px > W + 40) return;
          var py = groundY(d, cn.x) - 26 - camY + Math.sin(g.t * 3 + cn.x) * 3;
          c.fillStyle = '#e23d3d';
          U.roundRect(c, px - 11, py - 12, 22, 24, 4); c.fill();
          c.fillStyle = '#a32626';
          c.fillRect(px - 3, py - 16, 8, 5);
          c.fillStyle = '#ffe9e9';
          c.font = '800 11px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText('F', px, py + 5);
        });

        // Particles.
        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.t / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - camX - 3, p.y - camY - 3, 6, 6);
        });
        c.globalAlpha = 1;

        // The bike + rider.
        c.save();
        c.translate(d.x - camX, d.y - camY);
        c.rotate(d.a);
        wheelDraw(c, -23, 9, d.wheel);
        wheelDraw(c, 23, 9, d.wheel);
        c.strokeStyle = '#d6d9e8'; c.lineWidth = 4; c.lineCap = 'round';
        c.beginPath();
        c.moveTo(-23, 9); c.lineTo(-6, -8); c.lineTo(12, -8); c.lineTo(23, 9);
        c.moveTo(12, -8); c.lineTo(20, -16);
        c.stroke();
        c.fillStyle = '#f97316';
        U.roundRect(c, -16, -14, 26, 10, 4); c.fill();
        // rider
        c.strokeStyle = '#1e2338'; c.lineWidth = 6;
        c.beginPath(); c.moveTo(-6, -12); c.lineTo(-1, -30); c.stroke();   // torso
        c.beginPath(); c.moveTo(-1, -28); c.lineTo(16, -17); c.stroke();   // arm
        c.beginPath(); c.moveTo(-6, -12); c.lineTo(3, -2); c.stroke();     // leg
        c.fillStyle = '#22d3ee';
        c.beginPath(); c.arc(0, -36, 8, 0, TAU); c.fill();                 // helmet
        c.fillStyle = '#0b0e1a';
        c.fillRect(2, -39, 7, 5);                                          // visor
        c.restore();

        // Floating texts.
        c.textAlign = 'center';
        c.font = '800 17px Outfit, sans-serif';
        d.floats.forEach(function (f) {
          c.globalAlpha = Math.min(1, f.t);
          c.fillStyle = f.col;
          c.fillText(f.txt, f.x - camX, f.y - camY - (1.4 - f.t) * 34);
        });
        c.globalAlpha = 1;

        // Fuel gauge.
        var fw = 170, fx = W / 2 - fw / 2, fy = 16;
        c.fillStyle = 'rgba(10,8,24,.55)';
        U.roundRect(c, fx - 8, fy - 6, fw + 16, 24, 9); c.fill();
        c.fillStyle = 'rgba(255,255,255,.18)';
        U.roundRect(c, fx, fy, fw, 12, 6); c.fill();
        var f = d.fuel / 100;
        c.fillStyle = f > .45 ? '#34d399' : f > .22 ? '#ffd257' : '#fb7185';
        if (f > 0) { U.roundRect(c, fx, fy, Math.max(6, fw * f), 12, 6); c.fill(); }
        c.fillStyle = 'rgba(255,255,255,.8)';
        c.font = '800 10px Outfit, sans-serif';
        c.fillText('FUEL', W / 2, fy + 10 + 14);
        if (d.fuel < 22 && d.dying <= 0 && Math.sin(g.t * 9) > 0) {
          c.fillStyle = '#fb7185';
          c.font = '800 15px Outfit, sans-serif';
          c.fillText('LOW FUEL', W / 2, fy + 44);
        }

        // Distance readout.
        c.fillStyle = 'rgba(255,255,255,.75)';
        c.font = '700 13px Outfit, sans-serif';
        c.textAlign = 'right';
        c.fillText(Math.floor(meters(d)) + ' m', W - 18, H - 16);
      }
    });

    function stepFx(d, dt) {
      var i;
      for (i = d.parts.length - 1; i >= 0; i--) {
        var p = d.parts[i];
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 700 * dt; p.t -= dt;
        if (p.t <= 0) d.parts.splice(i, 1);
      }
      for (i = d.floats.length - 1; i >= 0; i--) {
        d.floats[i].t -= dt;
        if (d.floats[i].t <= 0) d.floats.splice(i, 1);
      }
    }

    function wheelDraw(c, x, y, rot) {
      c.save();
      c.translate(x, y);
      c.fillStyle = '#14161f';
      c.beginPath(); c.arc(0, 0, 13, 0, TAU); c.fill();
      c.strokeStyle = '#9aa3d0'; c.lineWidth = 2;
      c.beginPath(); c.arc(0, 0, 8, 0, TAU); c.stroke();
      c.rotate(rot);
      c.beginPath();
      c.moveTo(-8, 0); c.lineTo(8, 0);
      c.moveTo(0, -8); c.lineTo(0, 8);
      c.stroke();
      c.restore();
    }

    function bgHills(c, d, camX, camY, p, base, amp, col) {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(-10, H + 10);
      for (var sx = -10; sx <= W + 30; sx += 34) {
        var wx = camX * p + sx;
        var y = base - camY * p * .5 + (window.Milo.util.noise2(wx * .002, p * 51, d.seed) - .5) * amp;
        c.lineTo(sx, y);
      }
      c.lineTo(W + 30, H + 10);
      c.closePath(); c.fill();
    }
  }

  window.Milo.register({
    id: 'moto-hill', title: 'Moto Hill Climb', emo: '🏍️', category: 'Racing',
    tagline: 'Gas, brake, backflip, refuel',
    description: 'A side-on physics bike over endless procedurally-generated hills that ' +
      'get taller the further you ride. Gas and brake work on the ground, but in the air ' +
      'they pitch the bike back and forward — land a full rotation for a 300-point flip ' +
      'bonus, land on your head and the run is over. Fuel drains constantly, so every ' +
      'jerry can matters; if a climb is too steep, roll back down and take it with momentum.',
    controls: ['→ / ↑ gas', '← / ↓ brake'],
    colors: ['#f97316', '#7c2d12'],
    tags: ['bike', 'physics', 'stunts', 'endless', 'driving'],
    mount: mount
  });
})();
