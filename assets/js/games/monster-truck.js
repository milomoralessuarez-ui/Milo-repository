/* Monster Truck — spring-and-damper side-view physics over crushed cars. */
(function () {
  'use strict';
  var W = 900, H = 560;
  var STEP = 10, PPM = 22, TAU = Math.PI * 2;
  var GRAV = 1250, SPRING = 96, DAMP = 9, TRAVEL = 54;
  var WB = 56, WOY = 26, WR = 28;        // half wheelbase, wheel offset, wheel radius
  var INERTIA = 1400, DRIVE = 950, DRAGC = 0.0078;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    /* --------------------------------------------------------- terrain */

    function put(d, y) { d.hs.push(y); }
    function groundAt(d, x) {
      var f = x / STEP, i = Math.floor(f);
      if (i < 0) return d.hs[0];
      if (i >= d.hs.length - 1) return d.hs[d.hs.length - 1];
      return U.lerp(d.hs[i], d.hs[i + 1], f - i);
    }

    function addFeature(d) {
      var diff = Math.min(1, d.hs.length * STEP / 26000);
      var r = Math.random();
      var i, n, y0 = d.baseY;

      if (d.hs.length < 60) { for (i = 0; i < 40; i++) put(d, y0); return; }

      if (r < 0.26) {                       // rolling ground
        n = U.randInt(18, 30);
        var amp = 16 + diff * 46;
        var cyc = U.randInt(1, 2) * 2;
        for (i = 0; i < n; i++) put(d, y0 + Math.sin(i / n * Math.PI * cyc) * amp);
        return;
      }
      if (r < 0.52) {                       // stack of cars to crush
        n = U.randInt(3, 3 + Math.round(diff * 4));
        var top = y0 - 30;
        put(d, y0); put(d, y0 - 14);
        var startIdx = d.hs.length;
        for (i = 0; i < n * 4; i++) put(d, top);
        for (i = 0; i < n; i++) {
          d.cars.push({
            x: (startIdx + i * 4 + 2) * STEP, y: top, crushed: false,
            col: U.choice(['#4ade80', '#60a5fa', '#f472b6', '#ffd257', '#fb7185', '#a78bfa'])
          });
        }
        put(d, y0 - 14); put(d, y0);
        for (i = 0; i < 10; i++) put(d, y0);
        return;
      }
      if (r < 0.76) {                       // kicker, gap, landing ramp
        var h = 70 + diff * 90 + U.rand(0, 40);
        var rise = 16;
        for (i = 0; i < rise; i++) put(d, y0 - h * (i / rise) * (i / rise));
        var gap = 7 + Math.round(diff * 13) + U.randInt(0, 4);
        var pit = y0 + 70;
        for (i = 0; i < gap; i++) put(d, pit);
        var land = 16;
        for (i = 0; i < land; i++) put(d, U.lerp(pit, y0 - h * 0.35, i / land));
        for (i = 0; i < 12; i++) put(d, U.lerp(y0 - h * 0.35, y0, i / 12));
        for (i = 0; i < 8; i++) put(d, y0);
        return;
      }
      // tabletop
      var th = 60 + diff * 70;
      for (i = 0; i < 12; i++) put(d, U.lerp(y0, y0 - th, i / 12));
      for (i = 0; i < U.randInt(6, 16); i++) put(d, y0 - th);
      for (i = 0; i < 10; i++) put(d, U.lerp(y0 - th, y0, i / 10));
      d.baseY = y0 + U.rand(-26, 26);
      for (i = 0; i < 14; i++) put(d, d.baseY);
    }

    function genTo(d, x) {
      while (d.hs.length * STEP < x + 3200) addFeature(d);
    }

    /* ----------------------------------------------------------- state */

    function reset(g) {
      var d = g.data;
      d.hs = [];
      d.cars = [];
      d.baseY = 380;
      genTo(d, 0);
      d.x = 160;
      d.y = groundAt(d, 160) - WOY - WR - 10;
      d.a = 0; d.av = 0;
      d.vx = 0; d.vy = 0;
      d.wheelSpin = 0;
      d.damage = 0;
      d.air = 0; d.rot = 0; d.wasAir = false;
      d.flips = 0; d.stunt = 0; d.crushed = 0;
      d.best = 160;
      d.parts = [];
      d.floats = [];
      d.impactVy = 0;
      d.dying = 0;
      d.stuck = 0;
      d.camX = d.x - W * 0.34;
      d.camY = d.y - H * 0.55;
      g.set('Distance', '0 m');
      g.set('Stunts', 0);
      g.set('Damage', '0%');
    }

    function metres(d) { return Math.max(0, (d.best - 160) / PPM); }
    function scoreOf(d) { return Math.floor(metres(d)) * 3 + d.stunt; }

    function float(d, txt, col) {
      d.floats.push({ x: d.x, y: d.y - 70 - d.floats.length * 28, txt: txt, col: col || '#ffd257', t: 1.5 });
    }

    function boom(d, x, y, n, cols) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * TAU, s = U.rand(50, 320);
        d.parts.push({
          x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 90,
          t: U.rand(.35, .95), max: .95, col: U.choice(cols)
        });
      }
    }

    function wreck(g, why) {
      var d = g.data;
      if (d.dying > 0) return;
      d.dying = 1.3;
      d.why = why;
      Milo.sound.explode();
      boom(d, d.x, d.y, 30, ['#ffd257', '#fb7185', '#fff', '#f97316']);
    }

    function angWrap(a) {
      while (a > Math.PI) a -= TAU;
      while (a < -Math.PI) a += TAU;
      return a;
    }

    return Milo.arcade(host, {
      id: 'monster-truck',
      w: W, h: H, bg: '#140d22',
      stats: ['Distance', 'Stunts', 'Damage'],
      touchButtons: [{ key: 'left', label: 'BRAKE' }, { key: 'right', label: 'GAS' }],
      emo: '🛻',
      start: {
        title: 'Monster Truck',
        text: 'Four feet of suspension travel and a very heavy right foot. Gas pitches the ' +
          'nose up, brake drops it — use that in the air to land on all four wheels. Flatten ' +
          'the car stacks, chain the ramps, and watch the damage bar: bad landings break it.',
        keys: ['→ gas', '← brake', 'Lean in the air']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, inp = g.input, i;

        if (d.dying > 0) {
          d.dying -= dt;
          d.vy += GRAV * dt;
          d.x += d.vx * dt; d.y += d.vy * dt; d.a += d.av * dt;
          var gy0 = groundAt(d, d.x) - 20;
          if (d.y > gy0) { d.y = gy0; d.vy *= -0.25; d.vx *= 0.7; d.av *= 0.6; }
          stepFx(d, dt);
          camera(d, dt);
          if (d.dying <= 0) {
            g.gameOver({
              emo: '💥',
              title: d.why === 'roll' ? 'On its roof' : (d.why === 'pit' ? 'Into the wall' : 'Chassis broken'),
              text: Math.floor(metres(d)) + ' m, ' + d.crushed + ' cars flattened, ' +
                d.flips + ' flip' + (d.flips === 1 ? '' : 's') + '.',
              score: scoreOf(d)
            });
          }
          return;
        }

        genTo(d, d.x);
        var thr = inp.down('right') || inp.down('up') || inp.down('action');
        var brk = inp.down('left') || inp.down('down');
        if (inp.pdown) { if (inp.px > W / 2) thr = true; else brk = true; }

        var ca = Math.cos(d.a), sa = Math.sin(d.a);
        var fx = 0, fy = GRAV, tq = 0, contact = 0;

        for (i = 0; i < 2; i++) {
          var ox = i === 0 ? -WB : WB;
          var ax = d.x + ox * ca - WOY * sa;
          var ay = d.y + ox * sa + WOY * ca;
          var gy = groundAt(d, ax);
          var pen = (ay + WR) - gy;
          if (pen <= 0) continue;
          contact++;
          // velocity of this point (rigid body)
          var rx = ax - d.x, ry = ay - d.y;
          var pvy = d.vy + d.av * rx;
          var pvx = d.vx - d.av * ry;
          var over = Math.max(0, pen - TRAVEL);
          var F = SPRING * Math.min(pen, TRAVEL) + SPRING * 2.0 * over + DAMP * U.clamp(pvy, -1200, 1200);
          F = U.clamp(F, 0, 7200);
          if (over > 8) {
            // Bottomed out: a steady trickle of damage, not a per-frame spike.
            d.damage += 7 * dt;
            if (g.frame % 6 === 0) boom(d, ax, gy, 3, ['#c9a06a', '#8d6f48']);
          }
          // longitudinal force from the tyre
          var lf = 0;
          if (thr) lf = DRIVE;
          else if (brk) lf = -DRIVE * 0.85;
          var grip = Math.min(1, F / 900);
          lf = lf * grip - pvx * 0.42 * grip;

          fy -= F;
          fx += lf * ca;
          fy += lf * sa;
          tq += (rx * (-F) + rx * (lf * sa) - ry * (lf * ca)) / INERTIA;
        }

        var airborne = contact === 0;
        if (airborne) {
          d.impactVy = Math.max(d.impactVy || 0, d.vy);
          d.air += dt;
          var lean = (inp.down('right') || inp.down('up') ? 1 : 0) - (inp.down('left') || inp.down('down') ? 1 : 0);
          if (inp.pdown) lean = inp.px > W / 2 ? 1 : -1;
          d.av += lean * 6.0 * dt;
          d.av *= Math.pow(0.8, dt);
        } else {
          if (d.air > 0.25) landing(g, d);
          d.air = 0; d.rot = 0; d.impactVy = 0;
          d.av *= Math.pow(0.02, dt);
        }
        if (airborne) d.rot += d.av * dt;

        fx -= DRAGC * d.vx * Math.abs(d.vx);
        d.vx += fx * dt;
        d.vy += fy * dt;
        d.av = U.clamp(d.av + tq * dt, -9, 9);
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.a += d.av * dt;
        d.wheelSpin += d.vx / WR * dt;

        if (d.x < 40) { d.x = 40; d.vx = Math.max(0, d.vx); }
        if (d.x > d.best) d.best = d.x;

        // rolled over
        var au = angWrap(d.a);
        if (contact && Math.abs(au) > 2.0) { wreck(g, 'roll'); return; }
        // slammed into the far wall of a gap
        if (contact && d.vx > 180 && groundAt(d, d.x + 40) < groundAt(d, d.x) - 70) {
          d.damage += 22; d.vx *= 0.2; Milo.sound.hit();
          boom(d, d.x + 30, d.y, 10, ['#c9a06a', '#fb7185']);
        }

        // crush the cars
        for (i = 0; i < d.cars.length; i++) {
          var cr = d.cars[i];
          if (cr.crushed || Math.abs(cr.x - d.x) > 46) continue;
          if (d.y + WOY + WR > cr.y - 34) {
            cr.crushed = true;
            d.crushed++;
            d.stunt += 150;
            float(d, 'CRUSHED +150', '#4ade80');
            Milo.sound.explode();
            boom(d, cr.x, cr.y - 14, 12, [cr.col, '#fff', '#9fb0d8']);
            var k0 = Math.floor((cr.x - 22) / STEP), k1 = Math.floor((cr.x + 22) / STEP);
            for (var k = k0; k <= k1; k++) if (d.hs[k] != null) d.hs[k] += 11;
          }
        }

        if (d.damage >= 100) { d.damage = 100; wreck(g, 'damage'); return; }
        if (d.y > d.baseY + 900) { wreck(g, 'pit'); return; }

        // Out of momentum in a hole: end the run rather than stall forever.
        d.stuck = (Math.abs(d.vx) < 26 && !airborne) ? d.stuck + dt : 0;
        if (d.stuck > 5) {
          g.gameOver({
            emo: '🪫', title: 'Out of momentum',
            text: 'Beached with ' + Math.floor(metres(d)) + ' m on the board and ' +
              d.crushed + ' cars flattened.',
            score: scoreOf(d)
          });
          return;
        }

        stepFx(d, dt);
        camera(d, dt);

        g.score = scoreOf(d);
        g.set('Distance', Math.floor(metres(d)) + ' m');
        g.set('Stunts', U.fmt(d.stunt));
        g.set('Damage', Math.round(d.damage) + '%');
      },

      draw: function (g) { render(g.ctx, g.data, g); }
    });

    function landing(g, d) {
      var slope = Math.atan2(groundAt(d, d.x + 26) - groundAt(d, d.x - 26), 52);
      var diff = angWrap(d.a - slope);
      var n = Math.floor((Math.abs(d.rot) + 0.9) / TAU);
      var slam = Math.max(0, (d.impactVy || 0) - 950) * 0.05;
      d.damage += slam;
      if (slam > 6) Milo.sound.hit();
      if (Math.abs(diff) > 1.55) {
        d.damage += 26;
        Milo.sound.explode();
        boom(d, d.x, d.y + 30, 14, ['#fb7185', '#ffd257']);
        float(d, 'BAD LANDING', '#fb7185');
      } else {
        if (n > 0) {
          d.flips += n;
          d.stunt += n * 450;
          float(d, (n > 1 ? n + 'x FLIP ' : 'FLIP ') + '+' + (n * 450), '#a78bfa');
          Milo.sound.powerup();
        } else if (d.air > 1.1) {
          var pts = Math.round(d.air * 180);
          d.stunt += pts;
          float(d, 'BIG AIR +' + pts, '#22d3ee');
          Milo.sound.coin();
        } else {
          Milo.sound.tone({ f: 130, f2: 80, d: .1, v: .08, type: 'triangle' });
        }
        if (Math.abs(diff) < 0.25 && d.air > 0.8) {
          d.stunt += 120; float(d, 'CLEAN +120', '#4ade80');
        }
      }
      d.a = slope + U.clamp(diff, -0.5, 0.5);
    }

    function stepFx(d, dt) {
      var i;
      for (i = d.parts.length - 1; i >= 0; i--) {
        var p = d.parts[i];
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 900 * dt; p.t -= dt;
        if (p.t <= 0) d.parts.splice(i, 1);
      }
      for (i = d.floats.length - 1; i >= 0; i--) {
        d.floats[i].t -= dt; d.floats[i].y -= 34 * dt;
        if (d.floats[i].t <= 0) d.floats.splice(i, 1);
      }
    }

    function camera(d, dt) {
      var tx = d.x - W * 0.34, ty = d.y - H * 0.55;
      d.camX = U.lerp(d.camX, tx, Math.min(1, dt * 7));
      d.camY = U.lerp(d.camY, ty, Math.min(1, dt * 6));
      d.camY = U.clamp(d.camY, d.y - H * 0.74, d.y - H * 0.24);
    }

    /* ------------------------------------------------------------ paint */

    function render(c, d, g) {
      var i;
      var sky = c.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#1b1036'); sky.addColorStop(.6, '#3a1c46'); sky.addColorStop(1, '#5a2c3a');
      c.fillStyle = sky; c.fillRect(0, 0, W, H);

      // grandstand parallax
      for (var layer = 0; layer < 2; layer++) {
        var p = layer === 0 ? .22 : .45;
        c.fillStyle = layer === 0 ? 'rgba(20,12,36,.85)' : 'rgba(34,18,44,.9)';
        c.beginPath(); c.moveTo(-10, H);
        for (var bx = -10; bx <= W + 30; bx += 26) {
          var wx = (d.camX * p + bx) * .01;
          c.lineTo(bx, 340 - d.camY * p * .3 - U.noise2(wx, layer * 9 + 3, 5) * 120);
        }
        c.lineTo(W + 30, H); c.closePath(); c.fill();
      }

      c.save();
      c.translate(-d.camX, -d.camY);

      // terrain
      var x0 = Math.max(0, Math.floor(d.camX / STEP) - 2);
      var x1 = Math.min(d.hs.length - 1, Math.ceil((d.camX + W) / STEP) + 2);
      c.beginPath();
      c.moveTo(x0 * STEP, d.hs[x0]);
      for (i = x0; i <= x1; i++) c.lineTo(i * STEP, d.hs[i]);
      c.lineTo(x1 * STEP, d.camY + H + 400);
      c.lineTo(x0 * STEP, d.camY + H + 400);
      c.closePath();
      var dirt = c.createLinearGradient(0, d.camY, 0, d.camY + H);
      dirt.addColorStop(0, '#6b4a2f'); dirt.addColorStop(1, '#2d1d13');
      c.fillStyle = dirt; c.fill();
      c.strokeStyle = '#8a6136'; c.lineWidth = 4;
      c.beginPath();
      c.moveTo(x0 * STEP, d.hs[x0]);
      for (i = x0; i <= x1; i++) c.lineTo(i * STEP, d.hs[i]);
      c.stroke();

      // cars
      for (i = 0; i < d.cars.length; i++) {
        var cr = d.cars[i];
        if (cr.x < d.camX - 80 || cr.x > d.camX + W + 80) continue;
        var hgt = cr.crushed ? 10 : 30;
        c.fillStyle = cr.crushed ? U.shade(cr.col, -.45) : cr.col;
        U.roundRect(c, cr.x - 20, cr.y - hgt, 40, hgt, cr.crushed ? 3 : 6); c.fill();
        if (!cr.crushed) {
          c.fillStyle = 'rgba(10,14,32,.7)';
          U.roundRect(c, cr.x - 12, cr.y - 26, 24, 11, 3); c.fill();
          c.fillStyle = '#14161f';
          c.beginPath(); c.arc(cr.x - 12, cr.y, 5, 0, TAU); c.fill();
          c.beginPath(); c.arc(cr.x + 12, cr.y, 5, 0, TAU); c.fill();
        }
      }

      drawTruck(c, d);

      for (i = 0; i < d.parts.length; i++) {
        var p = d.parts[i];
        c.globalAlpha = Math.max(0, p.t / p.max);
        c.fillStyle = p.col;
        c.fillRect(p.x - 3, p.y - 3, 6, 6);
      }
      c.globalAlpha = 1;
      c.textAlign = 'center';
      for (i = 0; i < d.floats.length; i++) {
        var f = d.floats[i];
        c.globalAlpha = Math.min(1, f.t);
        c.fillStyle = f.col;
        c.font = 'bold 21px system-ui,sans-serif';
        c.fillText(f.txt, f.x, f.y);
      }
      c.globalAlpha = 1;
      c.restore();

      // damage bar
      c.textAlign = 'left';
      c.fillStyle = 'rgba(8,10,20,.72)';
      U.roundRect(c, W - 214, H - 58, 196, 40, 10); c.fill();
      c.fillStyle = '#9fb0d8'; c.font = '12px system-ui,sans-serif';
      c.fillText('CHASSIS', W - 202, H - 40);
      c.fillStyle = 'rgba(255,255,255,.16)';
      U.roundRect(c, W - 202, H - 34, 170, 12, 6); c.fill();
      var dm = U.clamp(d.damage / 100, 0, 1);
      c.fillStyle = dm > .75 ? '#fb7185' : dm > .45 ? '#ffd257' : '#4ade80';
      U.roundRect(c, W - 202, H - 34, 170 * dm, 12, 6); c.fill();

      if (d.stuck > 2.2 && d.dying <= 0) {
        c.textAlign = 'center';
        c.fillStyle = '#fb7185'; c.font = 'bold 17px system-ui,sans-serif';
        c.fillText('Get moving! ' + Math.ceil(5 - d.stuck) + 's', W / 2, 68);
        c.textAlign = 'left';
      }
      if (d.air > 0.35 && d.dying <= 0) {
        c.textAlign = 'center';
        c.fillStyle = 'rgba(255,255,255,.8)';
        c.font = 'bold 15px system-ui,sans-serif';
        c.fillText('AIR ' + d.air.toFixed(1) + 's', W / 2, 40);
        c.textAlign = 'left';
      }
    }

    function drawTruck(c, d) {
      c.save();
      c.translate(d.x, d.y);
      c.rotate(d.a);
      // chassis
      c.fillStyle = '#1b2030';
      c.fillRect(-WB - 10, WOY - 10, (WB + 10) * 2, 12);
      c.fillStyle = '#7c5cff';
      U.roundRect(c, -66, -26, 132, 48, 9); c.fill();
      c.fillStyle = '#c7b6ff';
      U.roundRect(c, -6, -50, 60, 28, 7); c.fill();
      c.fillStyle = 'rgba(10,14,32,.8)';
      U.roundRect(c, 0, -45, 48, 18, 4); c.fill();
      c.fillStyle = '#5a3fd6';
      U.roundRect(c, -64, -36, 56, 14, 4); c.fill();
      c.fillStyle = '#ffd257';
      c.fillRect(56, -18, 12, 10);
      c.fillStyle = '#0f1420';
      c.fillRect(-70, -14, 10, 22);
      c.restore();

      // wheels (drawn in world space so the suspension visibly travels)
      for (var i = 0; i < 2; i++) {
        var ox = i === 0 ? -WB : WB;
        var ca = Math.cos(d.a), sa = Math.sin(d.a);
        var ax = d.x + ox * ca - WOY * sa;
        var ay = d.y + ox * sa + WOY * ca;
        var gy = groundAt(d, ax);
        var pen = U.clamp((ay + WR) - gy, 0, TRAVEL);
        var hx = ax + sa * pen, hy = ay - ca * pen;
        c.strokeStyle = '#48506b'; c.lineWidth = 6;
        c.beginPath();
        c.moveTo(ax - sa * 16, ay + ca * 16);
        c.lineTo(hx, hy); c.stroke();
        c.fillStyle = '#14161f';
        c.beginPath(); c.arc(hx, hy, WR, 0, TAU); c.fill();
        c.strokeStyle = '#2f3346'; c.lineWidth = 7;
        c.beginPath(); c.arc(hx, hy, WR - 5, 0, TAU); c.stroke();
        c.save();
        c.translate(hx, hy); c.rotate(d.wheelSpin);
        c.strokeStyle = '#8e97b8'; c.lineWidth = 3;
        for (var k = 0; k < 5; k++) {
          var a = k / 5 * TAU;
          c.beginPath();
          c.moveTo(Math.cos(a) * 5, Math.sin(a) * 5);
          c.lineTo(Math.cos(a) * (WR - 8), Math.sin(a) * (WR - 8));
          c.stroke();
        }
        c.restore();
      }
    }
  }

  window.Milo.register({
    id: 'monster-truck', title: 'Monster Truck', emo: '🛻', category: 'Racing',
    tagline: 'Springs, car stacks and very big air',
    description: 'A side-view truck built on real suspension: two spring-and-damper legs that ' +
      'compress, rebound and pitch the chassis, so every landing is the springs\' problem before ' +
      'it is yours. The throttle lifts the nose and the brake drops it — that is your only air ' +
      'control, and you need it to line the wheels up with a downslope. Rows of cars flatten for ' +
      '150 each, flips pay 450, and long hang time pays by the second. Bottoming out the ' +
      'suspension or landing on the roof breaks the chassis; at 100% damage the run is over. ' +
      'Tip: ease off just before a kicker so the nose does not sky.',
    controls: ['→ gas', '← brake', 'Lean in the air'],
    colors: ['#8b5cf6', '#7a4a1e'],
    tags: ['truck', 'physics', 'stunts', 'suspension', 'jumps'],
    scoreLabel: 'pts',
    mount: mount
  });
})();
