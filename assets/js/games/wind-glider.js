/* Wind Glider — trade speed for height, ride the shimmering thermals. */
(function () {
  'use strict';
  var W = 800, H = 500, GX = 240, SEED = 63;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function floorY(x) {
      return H - 58 - U.noise2(x * 0.0013, 0, SEED) * 140 - U.noise2(x * 0.006, 3, SEED) * 24;
    }

    function reset(g) {
      var d = g.data;
      d.px = 0;
      d.y = 190;
      d.vx = 330;
      d.vy = 0;
      d.rot = 0;
      d.bonus = 0;
      d.inTherm = false;
      d.thermGain = 0;
      d.stallBeep = 0;
      d.walls = [];
      d.therms = [];
      d.nextW = 1150;
      d.nextT = 620;
      d.parts = [];
      d.texts = [];
      d.shimmer = [];
      d.shake = 0;
      d.dead = false;
      d.dieT = 0;
      stock(d);
      g.set('Score', 0);
      g.set('Speed', Math.round(d.vx / 3.4) + ' km/h');
      g.set('Best', U.fmt(g.best));
    }

    function stock(d) {
      while (d.nextW < d.px + W + 500) {
        var x = d.nextW;
        if (Math.random() < .58) {
          d.walls.push({ kind: 'fin', x: x, top: Math.min(floorY(x) - 70, U.rand(160, 310)) });
        } else {
          d.walls.push({
            kind: 'arch', x: x,
            cy: U.rand(140, 300),
            r: Math.max(62, 100 - d.px / 2400)
          });
        }
        d.nextW += Math.max(480, 880 - d.px / 60) * U.rand(.85, 1.25);
      }
      while (d.nextT < d.px + W + 500) {
        // keep thermals clear of the walls
        var tx = d.nextT, clear = true;
        for (var k = 0; k < d.walls.length; k++) {
          if (Math.abs(d.walls[k].x - tx) < 150) { clear = false; break; }
        }
        if (clear) d.therms.push({ x: tx, w: U.rand(64, 110), str: U.rand(430, 640) });
        d.nextT += U.rand(680, 1100);
      }
    }

    function crash(g, why) {
      var d = g.data;
      d.dead = true;
      d.why = why;
      d.dieT = .9;
      d.shake = 14;
      for (var k = 0; k < 26; k++) {
        var a = Math.random() * 6.283, s = U.rand(60, 340);
        d.parts.push({
          x: GX, y: d.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60,
          life: U.rand(.4, .9), max: .9, grav: 500,
          col: Math.random() < .5 ? '#f8fafc' : '#06b6d4'
        });
      }
      Milo.sound.explode();
    }

    return Milo.arcade(host, {
      id: 'wind-glider',
      w: W, h: H, bg: '#7dd3fc',
      stats: ['Score', 'Speed', 'Best'],
      emo: '🪂',
      start: {
        title: 'Wind Glider',
        text: 'Hold to pull the nose up — height for speed. Release to dive and buy ' +
          'the speed back. The shimmering columns are thermals: free lift, no speed ' +
          'cost. Drop under 40 km/h and the wing stalls.',
        keys: ['Hold Space / Hold anywhere']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, i = g.input, k;
        d.shake = Math.max(0, d.shake - dt * 40);

        if (d.dead) {
          d.vy += 900 * dt;
          d.y += d.vy * dt;
          d.rot += 7 * dt;
          d.dieT -= dt;
          cool(d, dt);
          if (d.dieT <= 0) {
            g.gameOver({
              text: U.fmt(Math.floor(d.px / 10)) + ' m down the canyon' +
                (d.why === 'ground' ? ' — the floor came up to meet you.' :
                  d.why === 'fin' ? ' — clipped a rock fin.' : ' — missed the arch window.')
            });
          }
          return;
        }

        var hold = i.down('action') || i.pdown;
        var stalled = d.vx < 135;

        // flight model: gravity, wing lift scaled by airspeed, flare, dive trade
        d.vy += 700 * dt;
        d.vy -= Math.min(1.4, d.vx / 260) * 520 * (stalled ? .25 : 1) * dt;
        if (hold) {
          d.vy -= 900 * (d.vx / 300) * (stalled ? .15 : 1) * dt;
          d.vx -= 240 * dt;
        }
        if (d.vy > 0) d.vx += d.vy * 1.1 * dt;    // diving converts to speed
        d.vx -= d.vx * .16 * dt;                   // drag
        d.vx = U.clamp(d.vx, 60, 660);
        d.vy = U.clamp(d.vy, -420, 560);

        // thermals: free lift while inside the column
        d.inTherm = false;
        for (k = d.therms.length - 1; k >= 0; k--) {
          var th = d.therms[k];
          if (th.x < d.px - 400) { d.therms.splice(k, 1); continue; }
          if (Math.abs(th.x - d.px) < th.w / 2) {
            d.inTherm = true;
            d.vy -= th.str * dt;
            d.thermGain += Math.max(0, -d.vy) * dt;
            if (Math.random() < .6) {
              d.parts.push({
                x: GX + U.rand(-th.w / 4, th.w / 4), y: d.y + U.rand(-4, 16),
                vx: U.rand(-20, 20), vy: U.rand(-160, -80),
                life: .5, max: .5, grav: 0, col: 'rgba(254,240,138,.9)'
              });
            }
          }
        }
        if (!d.inTherm && d.thermGain > 60) {
          var pts = 50 + Math.floor(d.thermGain / 4);
          d.bonus += pts;
          d.texts.push({ x: GX, y: d.y - 44, t: 'THERMAL +' + pts, life: .9, max: .9, col: '#fde68a' });
          Milo.sound.coin();
        }
        if (!d.inTherm) d.thermGain = 0;

        // stall warning buzzer
        if (stalled) {
          d.stallBeep -= dt;
          if (d.stallBeep <= 0) {
            d.stallBeep = .4;
            Milo.sound.tone({ f: 190, f2: 150, d: .12, v: .08, type: 'square' });
          }
        }

        d.px += d.vx * dt;
        d.y += d.vy * dt;
        if (d.y < 26) { d.y = 26; d.vy = Math.max(0, d.vy); }
        d.rot += (Math.atan2(d.vy, d.vx) * .8 + (stalled ? .5 : 0) - d.rot) * Math.min(1, 9 * dt);

        // terrain + wall collisions
        if (d.y > floorY(d.px) - 9) { crash(g, 'ground'); return; }
        for (k = d.walls.length - 1; k >= 0; k--) {
          var wl = d.walls[k];
          if (wl.x < d.px - 400) { d.walls.splice(k, 1); continue; }
          if (Math.abs(wl.x - d.px) < 24) {
            if (wl.kind === 'fin' && d.y > wl.top + 6) { crash(g, 'fin'); return; }
            if (wl.kind === 'arch' && Math.abs(d.y - wl.cy) > wl.r - 13) { crash(g, 'arch'); return; }
          }
        }

        stock(d);

        // wingtip ribbon at speed
        if (d.vx > 420 && Math.random() < .8) {
          d.parts.push({
            x: GX - 22, y: d.y - 4, vx: -d.vx * .5, vy: U.rand(-20, 20),
            life: .3, max: .3, grav: 0, col: 'rgba(248,250,252,.7)'
          });
        }

        cool(d, dt);
        g.score = Math.floor(d.px / 10) + d.bonus;
        g.set('Score', U.fmt(g.score));
        g.set('Speed', Math.round(d.vx / 3.4) + ' km/h');
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, k, x;
        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#7dd3fc');
        sky.addColorStop(.5, '#fde68a');
        sky.addColorStop(.85, '#fb923c');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);

        // low sun
        c.save();
        c.shadowColor = '#fff7ed'; c.shadowBlur = 50;
        c.fillStyle = '#fffbeb';
        c.beginPath(); c.arc(W * .7, H * .52, 56, 0, 7); c.fill();
        c.restore();

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        // distant mesas, two parallax layers
        c.fillStyle = 'rgba(154,52,18,.4)';
        c.beginPath();
        c.moveTo(0, H);
        for (x = 0; x <= W; x += 24) {
          var m1 = U.noise2((d.px * .18 + x) * .0016, 7, SEED);
          c.lineTo(x, H - 110 - Math.floor(m1 * 4) * 26);
        }
        c.lineTo(W, H); c.closePath(); c.fill();
        c.fillStyle = 'rgba(124,45,18,.65)';
        c.beginPath();
        c.moveTo(0, H);
        for (x = 0; x <= W; x += 20) {
          var m2 = U.noise2((d.px * .42 + x) * .0019, 11, SEED);
          c.lineTo(x, H - 60 - Math.floor(m2 * 4) * 32);
        }
        c.lineTo(W, H); c.closePath(); c.fill();

        // thermals: warm shimmer columns with rising squiggles
        for (k = 0; k < d.therms.length; k++) {
          var th = d.therms[k];
          var tx = th.x - d.px + GX;
          if (tx < -80 || tx > W + 80) continue;
          var tg = c.createLinearGradient(0, 0, 0, H);
          tg.addColorStop(0, 'rgba(254,240,138,0)');
          tg.addColorStop(.5, 'rgba(254,240,138,.16)');
          tg.addColorStop(1, 'rgba(254,215,170,.22)');
          c.fillStyle = tg;
          c.fillRect(tx - th.w / 2, 0, th.w, floorY(th.x) - 4);
          c.strokeStyle = 'rgba(255,255,255,.4)';
          c.lineWidth = 1.6;
          for (var s = 0; s < 3; s++) {
            var ph = g.t * 130 + s * 173;
            var sy0 = floorY(th.x) - 10 - (ph % 320);
            c.beginPath();
            for (var yy = 0; yy <= 46; yy += 6) {
              var sx = tx + (s - 1) * th.w * .26 + Math.sin((sy0 + yy) * .09 + s) * 7;
              if (yy === 0) c.moveTo(sx, sy0 + yy); else c.lineTo(sx, sy0 + yy);
            }
            c.stroke();
          }
        }

        // canyon floor
        c.beginPath();
        c.moveTo(-10, H + 10);
        for (x = -10; x <= W + 10; x += 8) c.lineTo(x, floorY(d.px + x - GX));
        c.lineTo(W + 10, H + 10);
        c.closePath();
        c.fillStyle = '#451a03'; c.fill();
        c.strokeStyle = '#fb923c'; c.lineWidth = 2.5;
        c.shadowColor = '#fb923c'; c.shadowBlur = 6;
        c.beginPath();
        for (x = -10; x <= W + 10; x += 8) {
          var fy = floorY(d.px + x - GX);
          if (x === -10) c.moveTo(x, fy); else c.lineTo(x, fy);
        }
        c.stroke();
        c.shadowBlur = 0;

        // rock fins and arches
        for (k = 0; k < d.walls.length; k++) {
          var wl = d.walls[k];
          var wx = wl.x - d.px + GX;
          if (wx < -140 || wx > W + 140) continue;
          if (wl.kind === 'fin') {
            var fb = floorY(wl.x) + 12;
            c.fillStyle = '#7c2d12';
            c.beginPath();
            c.moveTo(wx - 44, fb);
            c.lineTo(wx - 12, wl.top + 14);
            c.lineTo(wx, wl.top);
            c.lineTo(wx + 10, wl.top + 20);
            c.lineTo(wx + 40, fb);
            c.closePath(); c.fill();
            c.strokeStyle = '#fdba74'; c.lineWidth = 2;
            c.beginPath();
            c.moveTo(wx - 44, fb); c.lineTo(wx - 12, wl.top + 14); c.lineTo(wx, wl.top);
            c.stroke();
          } else {
            // full-height slab with a round window, cut with even-odd fill
            c.fillStyle = '#7c2d12';
            c.beginPath();
            c.rect(wx - 34, -20, 68, H + 40);
            c.moveTo(wx + wl.r, wl.cy);
            c.arc(wx, wl.cy, wl.r, 0, Math.PI * 2);
            c.fill('evenodd');
            c.strokeStyle = '#fdba74'; c.lineWidth = 2.5;
            c.beginPath(); c.arc(wx, wl.cy, wl.r, 0, 7); c.stroke();
            c.strokeStyle = 'rgba(69,26,3,.5)'; c.lineWidth = 3;
            c.beginPath(); c.moveTo(wx - 34, -20); c.lineTo(wx - 34, H + 20); c.stroke();
            c.beginPath(); c.moveTo(wx + 34, -20); c.lineTo(wx + 34, H + 20); c.stroke();
          }
        }

        // particles
        for (k = 0; k < d.parts.length; k++) {
          var p = d.parts[k];
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - 2.5, p.y - 2.5, 5, 5);
        }
        c.globalAlpha = 1;

        // glider
        if (!d.dead || d.dieT > 0) {
          c.save();
          c.translate(GX, d.y);
          c.rotate(d.rot);
          // sail
          c.shadowColor = '#06b6d4'; c.shadowBlur = 10;
          c.fillStyle = '#f8fafc';
          c.beginPath();
          c.moveTo(-28, 2); c.lineTo(0, -8); c.lineTo(30, 0); c.lineTo(0, -2);
          c.closePath(); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = '#06b6d4';
          c.beginPath();
          c.moveTo(-28, 2); c.lineTo(-6, -6.4); c.lineTo(-4, -2.9);
          c.closePath(); c.fill();
          // rigging + hanging pilot
          c.strokeStyle = '#334155'; c.lineWidth = 1.5;
          c.beginPath(); c.moveTo(-8, -3); c.lineTo(0, 12); c.moveTo(10, -3); c.lineTo(0, 12); c.stroke();
          c.fillStyle = '#1e293b';
          U.roundRect(c, -4, 9, 16, 6, 3); c.fill();
          c.fillStyle = '#fbbf24';
          c.beginPath(); c.arc(-6, 12, 4, 0, 7); c.fill();
          c.restore();
        }

        // stall warning
        if (!d.dead && d.vx < 160) {
          var wob = Math.sin(g.t * 14) > 0;
          c.font = '800 17px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillStyle = wob ? '#dc2626' : '#fca5a5';
          c.fillText(d.vx < 135 ? 'STALL!' : 'SLOW', GX, d.y - 40);
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
      }
    });

    function cool(d, dt) {
      var k;
      for (k = d.parts.length - 1; k >= 0; k--) {
        var p = d.parts[k];
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.grav || 0) * dt; p.life -= dt;
        if (p.life <= 0) d.parts.splice(k, 1);
      }
      for (k = d.texts.length - 1; k >= 0; k--) {
        d.texts[k].y -= 34 * dt; d.texts[k].life -= dt;
        if (d.texts[k].life <= 0) d.texts.splice(k, 1);
      }
    }
  }

  window.Milo.register({
    id: 'wind-glider', title: 'Wind Glider', emo: '🪂', category: 'Arcade',
    tagline: 'Speed is life — thermals are free',
    description: 'A hang-glider run down an endless desert canyon. Holding pulls the ' +
      'nose up and trades airspeed for height; releasing dives and trades it back — ' +
      'let the speed readout drop under 40 km/h and the wing stalls, nose-down, until ' +
      'you dive out of it. The shimmering gold columns are thermals that lift you for ' +
      'free and pay a bonus scaled to the height you gained riding them. Rock fins ' +
      'want you high, arch windows want you threading a shrinking circle, and both ' +
      'arrive faster the further you fly.',
    controls: ['Space (hold)', 'Hold anywhere'],
    colors: ['#fbbf24', '#9a3412'],
    tags: ['endless', 'glider', 'one button', 'thermals', 'canyon'],
    mount: mount
  });
})();
