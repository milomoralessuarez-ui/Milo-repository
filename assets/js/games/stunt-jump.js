/* Stunt Jump — one ramp, one car, and a row of buses that keeps growing. */
(function () {
  'use strict';
  var W = 900, H = 560, TAU = Math.PI * 2;
  var GRAV = 1150, PPM = 14;              // px per metre
  var RUNWAY = 1500;                      // px of run-up before the ramp
  var RAMPX = RUNWAY;                     // ramp base
  var BUSW = 80, BUSGAP = 6;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function rampLen(d) { return 190; }
    function rampTop(d) { return { x: RAMPX + Math.cos(-d.angle) * rampLen(d), y: 420 + Math.sin(-d.angle) * rampLen(d) }; }
    function busesStart(d) { return RAMPX + 150; }
    function busesEnd(d) { return busesStart(d) + d.buses * (BUSW + BUSGAP); }
    function landStart(d) { return busesEnd(d); }
    function landEnd(d) { return landStart(d) + 340; }

    // The landing ramp picks up exactly at bus-roof height and falls to the ground.
    function landY(d, x) {
      var s = landStart(d), e = landEnd(d);
      if (x <= s || x >= e) return 420;
      var t = (x - s) / (e - s);
      return 420 - 88 * Math.pow(1 - t, 1.25);
    }

    function newRound(g, first) {
      var d = g.data;
      d.buses = first ? 4 : d.buses + 1;
      d.phase = 'setup';
      d.angle = d.angle || 0.62;
      d.x = 120; d.y = 420; d.vx = 0; d.vy = 0;
      d.a = 0; d.av = 0; d.rot = 0;
      d.airT = 0;
      d.jumped = 0;
      d.style = 0;
      d.parts = [];
      d.camX = 0; d.camY = 0; d.zoom = 1;
      d.msg = '';
      g.set('Round', d.round);
      g.set('Buses', d.buses);
      g.set('Speed', 0);
    }

    function reset(g) {
      var d = g.data;
      d.round = 1;
      d.total = 0;
      d.styleTotal = 0;
      d.best = 0;
      d.angle = 0.62;
      d.buses = 3;
      newRound(g, true);
    }

    function scoreOf(d) { return Math.round(d.total * 10) + d.styleTotal; }

    function boom(d, x, y, n, cols) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * TAU, s = U.rand(60, 340);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 110,
          t: U.rand(.4, 1), max: 1, col: U.choice(cols) });
      }
    }

    return Milo.arcade(host, {
      id: 'stunt-jump',
      w: W, h: H, bg: '#101a30',
      stats: ['Round', 'Buses', 'Speed'],
      touch: 'dpad',
      touchButtons: [{ key: 'action', label: 'GO' }],
      emo: '🚐',
      start: {
        title: 'Stunt Jump',
        text: 'Set the ramp angle, floor it down the run-up and clear the buses. In the air, ' +
          '← and → spin the car for style points — but you have to land wheels-down on the far ' +
          'ramp. Every round they wheel out one more bus.',
        keys: ['← → set ramp / rotate', 'Space throttle']
      },
      init: reset,

      onKey: function (g, e, name) {
        var d = g.data;
        if (d.phase === 'setup') {
          if (name === 'left') { d.angle = U.clamp(d.angle - 0.04, 0.22, 1.05); Milo.sound.click(); }
          if (name === 'right') { d.angle = U.clamp(d.angle + 0.04, 0.22, 1.05); Milo.sound.click(); }
          if (name === 'action' || name === 'up') {
            d.phase = 'run';
            Milo.sound.tone({ f: 150, f2: 320, d: .3, v: .1, type: 'sawtooth' });
          }
        } else if (d.phase === 'result') {
          if (name === 'action') next(g);
        }
      },
      onPointer: function (g, type, x) {
        var d = g.data;
        if (type !== 'down') return;
        if (d.phase === 'setup') {
          if (x < W * .3) d.angle = U.clamp(d.angle - 0.06, 0.22, 1.05);
          else if (x > W * .7) d.angle = U.clamp(d.angle + 0.06, 0.22, 1.05);
          else d.phase = 'run';
        } else if (d.phase === 'result') next(g);
      },

      update: function (g, dt) {
        var d = g.data, inp = g.input, i;

        for (i = d.parts.length - 1; i >= 0; i--) {
          var p = d.parts[i];
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 980 * dt; p.t -= dt;
          if (p.t <= 0) d.parts.splice(i, 1);
        }

        if (d.phase === 'setup') { camera(d, dt); return; }

        if (d.phase === 'run') {
          var thr = inp.down('action') || inp.down('up') || inp.pdown;
          d.vx += (thr ? 900 : 260) * dt;
          d.vx = Math.min(d.vx, 1250);
          d.x += d.vx * dt;
          d.y = 420;
          d.a = 0;
          if (g.frame % 4 === 0) {
            Milo.sound.tone({ f: 70 + d.vx * .14, d: .05, v: .04, type: 'sawtooth' });
          }
          if (d.x >= RAMPX) {
            d.phase = 'ramp';
            d.rampT = 0;
          }
          camera(d, dt);
          g.set('Speed', Math.round(d.vx * .27));
          return;
        }

        if (d.phase === 'ramp') {
          // climbing the ramp: speed bleeds, the car takes the ramp's angle
          var top = rampTop(d);
          var dx = Math.cos(-d.angle), dy = Math.sin(-d.angle);
          d.x += d.vx * dx * dt;
          d.y += d.vx * dy * dt;
          d.vx = Math.max(120, d.vx - 210 * dt);
          d.a = -d.angle;
          if (d.x >= top.x) {
            d.phase = 'air';
            d.vy = d.vx * dy;
            d.vx = d.vx * dx;
            d.launchX = d.x;
            d.airT = 0; d.rot = 0; d.av = 0;
            Milo.sound.jump();
            boom(d, d.x, d.y + 10, 10, ['#9fb0d8', '#fff']);
          }
          camera(d, dt);
          g.set('Speed', Math.round(Math.hypot(d.vx, d.vy) * .27));
          return;
        }

        if (d.phase === 'air') {
          d.airT += dt;
          var spin = (inp.down('right') ? 1 : 0) - (inp.down('left') ? 1 : 0);
          if (inp.pdown) spin = inp.px > W / 2 ? 1 : -1;
          d.av += spin * 7.2 * dt;
          d.av *= Math.pow(0.86, dt);
          d.av = U.clamp(d.av, -9, 9);
          d.a += d.av * dt;
          d.rot += d.av * dt;
          d.vy += GRAV * dt;
          d.x += d.vx * dt;
          d.y += d.vy * dt;

          var gy = groundY(d, d.x);
          if (d.y >= gy) { touchdown(g, d, gy); return; }
          camera(d, dt);
          g.set('Speed', Math.round(Math.hypot(d.vx, d.vy) * .27));
          return;
        }

        if (d.phase === 'roll') {
          d.vx = Math.max(0, d.vx - 520 * dt);
          d.x += d.vx * dt;
          d.y = groundY(d, d.x);
          d.a = U.lerp(d.a, groundAng(d, d.x), Math.min(1, dt * 8));
          camera(d, dt);
          d.rollT -= dt;
          if (d.rollT <= 0 || d.vx < 6) {
            d.phase = 'result';
            Milo.sound.win();
          }
          return;
        }

        if (d.phase === 'crash') {
          d.vy += GRAV * dt;
          d.x += d.vx * dt; d.y += d.vy * dt;
          d.a += d.av * dt;
          var g2 = groundY(d, d.x);
          if (d.y > g2) { d.y = g2; d.vy *= -.3; d.vx *= .6; d.av *= .5; }
          camera(d, dt);
          d.crashT -= dt;
          if (d.crashT <= 0) {
            g.gameOver({
              emo: '💥',
              title: d.why === 'short' ? 'Landed on the buses'
                : d.why === 'over' ? 'Flew clean over the landing ramp' : 'Landed on its roof',
              text: 'Round ' + d.round + ' with ' + d.buses + ' buses. ' +
                Math.round(d.total) + ' m jumped in total, ' + U.fmt(d.styleTotal) + ' style points.',
              score: scoreOf(d)
            });
          }
          return;
        }
      },

      draw: function (g) { render(g, g.ctx, g.data); }
    });

    function groundY(d, x) {
      if (x < RAMPX) return 420;
      var top = rampTop(d);
      if (x < top.x) return 420 - (x - RAMPX) * Math.tan(d.angle);
      if (x < busesStart(d)) return 420;
      if (x < busesEnd(d)) return 420 - 88;         // bus roofs
      return landY(d, x);
    }
    function groundAng(d, x) {
      return Math.atan2(groundY(d, x + 12) - groundY(d, x - 12), 24);
    }

    function touchdown(g, d, gy) {
      d.y = gy;
      var dist = (d.x - d.launchX) / PPM;
      d.lastDist = dist;
      var onBuses = d.x > busesStart(d) - 6 && d.x < busesEnd(d) + 6;
      var slope = groundAng(d, d.x);
      var diff = wrap(d.a - slope);
      var rolls = Math.floor((Math.abs(d.rot) + 0.85) / TAU);

      if (onBuses) {
        d.why = 'short';
        crash(g, d);
        return;
      }
      if (d.x > landEnd(d) + 110) {
        d.why = 'over';
        crash(g, d);
        return;
      }
      if (Math.abs(diff) > 1.15) {
        d.why = 'roof';
        crash(g, d);
        return;
      }
      // good landing
      d.total += dist;
      if (dist > d.best) d.best = dist;
      var st = rolls * 800 + Math.round(d.airT * 120) + (Math.abs(diff) < 0.22 ? 300 : 0);
      d.style = st;
      d.styleTotal += st;
      d.rolls = rolls;
      d.clean = Math.abs(diff) < 0.22;
      d.a = slope;
      d.phase = 'roll';
      d.rollT = 1.6;
      d.vx = Math.hypot(d.vx, d.vy) * .8;
      d.vy = 0;
      boom(d, d.x, d.y + 8, 16, ['#9fb0d8', '#fff', '#ffd257']);
      Milo.sound.coin();
      g.score = scoreOf(d);
    }

    function crash(g, d) {
      d.phase = 'crash';
      d.crashT = 1.4;
      d.av = (Math.random() - .5) * 12;
      d.vy = -260;
      d.vx *= .5;
      Milo.sound.explode();
      boom(d, d.x, d.y, 30, ['#fb7185', '#ffd257', '#fff']);
    }

    function next(g) {
      var d = g.data;
      d.round++;
      newRound(g, false);
    }

    function wrap(a) { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; }

    function camera(d, dt) {
      var wide = d.phase === 'air' || d.phase === 'roll' || d.phase === 'result' || d.phase === 'crash';
      var tz = wide ? U.clamp(520 / Math.max(260, (landEnd(d) - RAMPX + 260)), .34, 1) : 0.85;
      if (d.phase === 'setup' || d.phase === 'run') tz = 0.85;
      d.zoom = U.lerp(d.zoom, tz, Math.min(1, dt * 3));
      var focusX = d.phase === 'setup' ? RAMPX - 60 : d.x;
      var tx = focusX - (W / 2) / d.zoom;
      var ty = (d.phase === 'air' ? d.y : 420) - (H * .62) / d.zoom;
      d.camX = U.lerp(d.camX, tx, Math.min(1, dt * 6));
      d.camY = U.lerp(d.camY, ty, Math.min(1, dt * 4));
    }

    /* ------------------------------------------------------------ paint */

    function render(g, c, d) {
      var i;
      var sky = c.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#0d1730'); sky.addColorStop(.62, '#2a3a63'); sky.addColorStop(1, '#6b4a5c');
      c.fillStyle = sky; c.fillRect(0, 0, W, H);

      // crowd stand
      c.fillStyle = 'rgba(16,22,44,.9)';
      c.fillRect(0, H * .48, W, H * .1);
      for (i = 0; i < 90; i++) {
        c.fillStyle = 'rgba(' + (120 + (i * 37) % 120) + ',' + (110 + (i * 53) % 110) + ',160,.5)';
        c.fillRect((i * 11 + (d.camX * .08) % 11) % W, H * .48 + (i % 3) * 7, 5, 6);
      }

      c.save();
      c.scale(d.zoom, d.zoom);
      c.translate(-d.camX, -d.camY);

      var vx0 = d.camX - 40, vx1 = d.camX + W / d.zoom + 40;

      // ground
      c.fillStyle = '#2b2f3f';
      c.fillRect(vx0, 420, vx1 - vx0, 500);
      c.fillStyle = '#3a4055';
      c.fillRect(vx0, 420, vx1 - vx0, 8);
      // run-up markings
      c.fillStyle = 'rgba(255,255,255,.22)';
      for (i = Math.floor(vx0 / 120) * 120; i < Math.min(RAMPX, vx1); i += 120) {
        if (i < 0) continue;
        c.fillRect(i, 432, 60, 5);
      }

      // ramp
      var top = rampTop(d);
      c.fillStyle = '#556';
      c.beginPath();
      c.moveTo(RAMPX, 420); c.lineTo(top.x, top.y); c.lineTo(top.x, 420);
      c.closePath(); c.fill();
      c.fillStyle = '#ffd257';
      c.beginPath();
      c.moveTo(RAMPX, 420); c.lineTo(top.x, top.y); c.lineTo(top.x - 14, top.y + 10);
      c.lineTo(RAMPX, 430);
      c.closePath(); c.fill();

      // buses
      var bs = busesStart(d);
      for (i = 0; i < d.buses; i++) {
        var bx = bs + i * (BUSW + BUSGAP);
        c.fillStyle = ['#e8a33d', '#d9483b', '#3d7fe8', '#46b86a'][i % 4];
        U.roundRect(c, bx, 420 - 88, BUSW, 88, 6); c.fill();
        c.fillStyle = 'rgba(12,18,34,.7)';
        c.fillRect(bx + 8, 420 - 74, BUSW - 16, 26);
        c.fillStyle = '#14161f';
        c.beginPath(); c.arc(bx + 20, 420, 11, 0, TAU); c.fill();
        c.beginPath(); c.arc(bx + BUSW - 20, 420, 11, 0, TAU); c.fill();
      }

      // landing ramp
      c.fillStyle = '#4a5064';
      c.beginPath();
      c.moveTo(landStart(d), 420);
      for (var lx = landStart(d); lx <= landEnd(d); lx += 10) c.lineTo(lx, landY(d, lx));
      c.lineTo(landEnd(d), 420);
      c.closePath(); c.fill();
      c.strokeStyle = '#8f9bc4'; c.lineWidth = 4;
      c.beginPath();
      for (lx = landStart(d); lx <= landEnd(d); lx += 10) c.lineTo(lx, landY(d, lx));
      c.stroke();
      // landing target markings
      c.fillStyle = 'rgba(74,222,128,.45)';
      c.fillRect(landStart(d), 414, landEnd(d) - landStart(d) + 110, 6);
      c.fillStyle = 'rgba(251,113,133,.5)';
      c.fillRect(landEnd(d) + 110, 414, 400, 6);
      drawPrediction(c, d);

      drawCar(c, d);

      for (i = 0; i < d.parts.length; i++) {
        var p = d.parts[i];
        c.globalAlpha = Math.max(0, p.t / p.max);
        c.fillStyle = p.col;
        c.fillRect(p.x - 3, p.y - 3, 6, 6);
      }
      c.globalAlpha = 1;
      c.restore();

      drawHud(g, c, d);
    }

    // Faint dotted arc showing where this speed and angle would put the car.
    function drawPrediction(c, d) {
      if (d.phase !== 'run' && d.phase !== 'ramp') return;
      var L = rampLen(d);
      var lx = RAMPX + Math.cos(d.angle) * L, ly = 420 - Math.sin(d.angle) * L;
      var v = Math.max(120, d.vx - 210 * (L / Math.max(200, d.vx)));
      if (d.phase === 'ramp') { lx = d.x; ly = d.y; v = d.vx; }
      var vx = v * Math.cos(d.angle), vy = -v * Math.sin(d.angle);
      var x = lx, y = ly, t = 0;
      c.fillStyle = 'rgba(255,255,255,.34)';
      while (t < 3.2) {
        x += vx * 0.03; y += vy * 0.03; vy += GRAV * 0.03; t += 0.03;
        if (y > 420) break;
        if (((t * 100) | 0) % 9 < 3) { c.fillRect(x - 2, y - 2, 4, 4); }
      }
      c.fillStyle = 'rgba(255,255,255,.55)';
      c.beginPath(); c.arc(x, Math.min(y, 424), 7, 0, TAU); c.fill();
    }

    function drawCar(c, d) {
      c.save();
      c.translate(d.x, d.y);
      c.rotate(d.a);
      c.fillStyle = 'rgba(0,0,0,.4)';
      U.roundRect(c, -34, -8, 68, 16, 6); c.fill();
      c.fillStyle = '#14161f';
      c.beginPath(); c.arc(-21, 0, 11, 0, TAU); c.fill();
      c.beginPath(); c.arc(21, 0, 11, 0, TAU); c.fill();
      c.fillStyle = '#22d3ee';
      U.roundRect(c, -34, -20, 68, 20, 6); c.fill();
      c.fillStyle = '#0f766e';
      U.roundRect(c, -16, -34, 34, 16, 5); c.fill();
      c.fillStyle = 'rgba(220,245,255,.85)';
      U.roundRect(c, -12, -31, 26, 10, 3); c.fill();
      c.fillStyle = '#ffd257';
      c.fillRect(30, -16, 6, 6);
      c.restore();
    }

    function drawHud(g, c, d) {
      var i;
      c.textAlign = 'center';
      if (d.phase === 'setup') {
        c.fillStyle = 'rgba(8,12,24,.84)';
        U.roundRect(c, W / 2 - 250, 120, 500, 200, 14); c.fill();
        c.fillStyle = '#fff'; c.font = 'bold 26px system-ui,sans-serif';
        c.fillText('Round ' + d.round + ' — ' + d.buses + ' buses', W / 2, 162);
        c.fillStyle = '#9fb0d8'; c.font = '15px system-ui,sans-serif';
        c.fillText('That is ' + Math.round(d.buses * (BUSW + BUSGAP) / PPM) + ' m of bus to clear.', W / 2, 190);

        c.fillStyle = '#ffd257'; c.font = 'bold 20px system-ui,sans-serif';
        c.fillText('RAMP ANGLE  ' + Math.round(d.angle * 180 / Math.PI) + '°', W / 2, 232);
        // angle dial
        c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = 4;
        c.beginPath(); c.arc(W / 2, 286, 46, -Math.PI, 0); c.stroke();
        c.strokeStyle = '#ffd257'; c.lineWidth = 5;
        c.beginPath(); c.moveTo(W / 2, 286);
        c.lineTo(W / 2 + Math.cos(-d.angle) * 46, 286 + Math.sin(-d.angle) * 46);
        c.stroke();
        c.fillStyle = '#9fb0d8'; c.font = '13px system-ui,sans-serif';
        c.fillText('Low and fast goes further; steep buys air time for spins.', W / 2, 308);
        c.fillStyle = '#4ade80'; c.font = 'bold 16px system-ui,sans-serif';
        c.fillText('← →  set angle      Space  go', W / 2, 344);
      }

      if (d.phase === 'run' || d.phase === 'ramp') {
        c.fillStyle = 'rgba(8,12,24,.7)';
        U.roundRect(c, W / 2 - 150, H - 62, 300, 40, 10); c.fill();
        c.fillStyle = '#9fb0d8'; c.font = '11px system-ui,sans-serif';
        c.textAlign = 'left';
        c.fillText('APPROACH SPEED', W / 2 - 138, H - 44);
        c.fillStyle = 'rgba(255,255,255,.15)';
        U.roundRect(c, W / 2 - 138, H - 38, 276, 10, 5); c.fill();
        c.fillStyle = '#22d3ee';
        U.roundRect(c, W / 2 - 138, H - 38, 276 * U.clamp(d.vx / 1250, 0, 1), 10, 5); c.fill();
        c.textAlign = 'center';
      }

      if (d.phase === 'air') {
        c.fillStyle = '#fff'; c.font = 'bold 20px system-ui,sans-serif';
        c.fillText(((d.x - d.launchX) / PPM).toFixed(1) + ' m', W / 2, 112);
        c.fillStyle = '#a78bfa'; c.font = '15px system-ui,sans-serif';
        c.fillText('spin ' + Math.round(Math.abs(d.rot) / TAU * 100) / 100 + ' turns', W / 2, 136);
      }

      if (d.phase === 'result') {
        c.fillStyle = 'rgba(8,12,24,.86)';
        U.roundRect(c, W / 2 - 240, 130, 480, 200, 14); c.fill();
        c.fillStyle = '#4ade80'; c.font = 'bold 30px system-ui,sans-serif';
        c.fillText('Landed it!', W / 2, 176);
        c.fillStyle = '#fff'; c.font = 'bold 40px system-ui,sans-serif';
        c.fillText(d.lastDist.toFixed(1) + ' m', W / 2, 224);
        c.fillStyle = '#9fb0d8'; c.font = '15px system-ui,sans-serif';
        c.fillText(d.buses + ' buses cleared' + (d.rolls ? ', ' + d.rolls + ' full rotation' + (d.rolls > 1 ? 's' : '') : '') +
          (d.clean ? ', wheels dead flat' : ''), W / 2, 254);
        c.fillStyle = '#a78bfa'; c.font = 'bold 18px system-ui,sans-serif';
        c.fillText('+' + U.fmt(d.style) + ' style', W / 2, 284);
        c.fillStyle = '#ffd257'; c.font = 'bold 15px system-ui,sans-serif';
        c.fillText('Space for round ' + (d.round + 1) + ' — one more bus', W / 2, 312);
      }
      c.textAlign = 'left';
    }
  }

  window.Milo.register({
    id: 'stunt-jump', title: 'Stunt Jump', emo: '🚐', category: 'Racing',
    tagline: 'One ramp, and one more bus each round',
    description: 'Evel Knievel arithmetic: pick a ramp angle, build speed down a long run-up, ' +
      'and clear a row of buses that grows by one every round. A shallow ramp carries further, a ' +
      'steep one buys hang time you can spend on rotations — each full turn is 800 style points ' +
      'and a dead-flat landing is worth 300 more. Come down on the buses or land past 65 degrees ' +
      'off the slope and the run is over, so the last thing you do in the air is stop spinning ' +
      'and line the wheels up with the landing ramp.',
    controls: ['← → ramp angle / rotate', 'Space throttle'],
    colors: ['#22d3ee', '#e8a33d'],
    tags: ['stunt', 'jump', 'ramp', 'physics', 'rounds'],
    scoreLabel: 'pts',
    mount: mount
  });
})();
