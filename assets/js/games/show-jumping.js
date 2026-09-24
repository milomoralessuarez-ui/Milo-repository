/* Show Jumping — find the stride, meet the fence, leave the poles up. */
(function () {
  'use strict';

  var W = 860, H = 520;
  var GROUND = 396, PPM = 26;
  var ALLOWED = 46;               // seconds before time faults start

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function course() {
      return [
        { x: 28, h: 1.00, name: '1' },
        { x: 52, h: 1.10, name: '2' },
        { x: 78, h: 1.15, name: '3' },
        { x: 104, h: 1.20, name: '4a' },
        { x: 113.5, h: 1.15, name: '4b' },
        { x: 140, h: 1.25, name: '5' },
        { x: 166, h: 1.30, name: '6' },
        { x: 192, h: 1.30, name: '7a' },
        { x: 201.5, h: 1.25, name: '7b' },
        { x: 228, h: 1.35, name: '9' }
      ];
    }

    function jumpOff() {
      return [
        { x: 26, h: 1.25, name: '1' },
        { x: 48, h: 1.35, name: '2' },
        { x: 70, h: 1.30, name: '3a' },
        { x: 79, h: 1.35, name: '3b' },
        { x: 104, h: 1.40, name: '4' },
        { x: 128, h: 1.40, name: '5' }
      ];
    }

    function reset(g) {
      var d = g.data;
      d.round = 1;
      d.jumpOffTime = 0;
      startRound(g, course());
      g.set('Faults', 0);
      g.set('Fence', '1/10');
      g.set('Time', '0.0s');
    }

    function startRound(g, fences) {
      var d = g.data;
      d.fences = fences;
      for (var i = 0; i < fences.length; i++) {
        fences[i].down = 0;
        fences[i].cleared = false;
      }
      d.idx = 0;
      d.x = 0;
      d.v = 6.4;
      d.targetV = 6.4;
      d.phase = 'canter';
      d.phaseT = 0;
      d.faults = 0;
      d.refusals = 0;
      d.time = 0;
      d.stridePhase = 0;
      d.jump = null;
      d.msg = 'Find your stride — ↑ lengthens, ↓ shortens';
      d.msgT = 2.6;
      d.tap = false;
      d.dust = [];
      d.lastResult = '';
      d.lastResultT = 0;
      g.set('Faults', 0);
      g.set('Fence', '1/' + fences.length);
    }

    function say(d, t, time) { d.msg = t; d.msgT = time || 1.2; }

    function stride(d) { return d.v * .56; }

    function fence(d) { return d.fences[d.idx]; }

    function window_(f) {
      var tight = (f.h - 1) * .6;
      return [1.15 + tight, 2.6 - tight];
    }

    function addFaults(g, n, why) {
      var d = g.data;
      d.faults += n;
      g.set('Faults', d.faults);
      d.lastResult = why;
      d.lastResultT = 1.6;
    }

    function takeOff(g) {
      var d = g.data;
      var f = fence(d);
      if (!f) return;
      var dist = f.x - d.x;
      if (dist > 6.5) {
        say(d, 'Too far out — nothing to jump yet', .8);
        Milo.sound.tone({ f: 160, d: .06, v: .04, type: 'triangle' });
        return;
      }
      var win = window_(f);
      var res;
      if (dist < .8) res = 'refuse';
      else if (dist >= win[0] && dist <= win[1]) res = 'clear';
      else if (dist > 3.6) res = 'down';
      else res = Math.random() < .5 ? 'down' : 'clear';

      if (res === 'refuse') { refuse(g, 'Too close — he ducks out'); return; }
      d.jump = {
        t: 0, T: .82, from: d.x, dist: d.v * .86,
        peak: f.h * 92 + 26, fence: f, knock: res === 'down'
      };
      d.phase = 'jump';
      Milo.sound.tone({ f: 260, f2: 520, d: .16, v: .08, type: 'triangle' });
      if (res === 'clear') say(d, 'Met it perfectly', .9);
    }

    function refuse(g, why) {
      var d = g.data;
      d.refusals++;
      addFaults(g, 4, 'REFUSAL  +4');
      say(d, why + ' — 4 faults', 1.6);
      Milo.sound.tone({ f: 200, f2: 90, d: .3, v: .11, type: 'sawtooth' });
      d.phase = 'refusal';
      d.phaseT = 1.9;
      if (d.refusals >= 3) {
        finish(g, true);
      }
    }

    function land(g) {
      var d = g.data, j = d.jump, f = j.fence;
      d.x = j.from + j.dist;
      if (j.knock) {
        f.down = .01;
        addFaults(g, 4, 'POLE DOWN  +4');
        say(d, 'Rail down — 4 faults', 1.3);
        Milo.sound.tone({ f: 170, f2: 70, d: .28, v: .11, type: 'square' });
      } else {
        f.cleared = true;
        Milo.sound.tone({ f: 620, f2: 880, d: .09, v: .07, type: 'square' });
      }
      d.jump = null;
      d.phase = 'canter';
      d.idx++;
      g.set('Fence', Math.min(d.idx + 1, d.fences.length) + '/' + d.fences.length);
      if (d.idx >= d.fences.length) finish(g, false);
    }

    function finish(g, eliminated) {
      var d = g.data;
      var over = Math.max(0, Math.ceil(d.time - ALLOWED));
      if (over > 0 && !eliminated) {
        d.faults += over;
        g.set('Faults', d.faults);
      }
      var sc = Math.max(0, Math.round(1400 - d.faults * 95 - d.time * 5));
      if (eliminated) {
        g.score = Math.max(0, Math.round(400 - d.faults * 40));
        g.gameOver({
          emo: '🐴', title: 'Eliminated — three refusals',
          text: 'You were on ' + d.faults + ' faults at fence ' + (d.idx + 1) + '.',
          score: g.score
        });
        return;
      }
      if (d.round === 2) {
        var total = Math.round(sc + Math.max(0, 900 - d.time * 18));
        g.score = total;
        if (d.faults === 0) {
          g.win({
            emo: '🏆', title: 'Jump-off won — clear in ' + d.time.toFixed(2) + 's',
            text: 'Double clear round. Nothing left to beat.', score: total
          });
        } else {
          g.gameOver({
            emo: '🐴', title: 'Jump-off: ' + d.faults + ' faults',
            text: d.time.toFixed(2) + 's over the short course.', score: total
          });
        }
        return;
      }
      g.score = sc;
      if (d.faults === 0) {
        d.round = 2;
        startRound(g, jumpOff());
        say(d, 'Clear round! Into the jump-off — six fences against the clock', 3);
        Milo.sound.win();
        return;
      }
      g.gameOver({
        emo: '🐴', title: d.faults + ' faults',
        text: 'Round of ' + d.time.toFixed(1) + 's' + (over ? ' including ' + over + ' time faults' : '') +
          '. A clear round takes you to the jump-off.',
        score: sc
      });
    }

    /* --------------------------------------------------------------- draw */

    function drawHorse(c, x, y, phase, airborne, tilt) {
      c.save();
      c.translate(x, y);
      c.rotate(tilt);
      var s = Math.sin(phase * 6.283);
      c.fillStyle = 'rgba(0,0,0,.2)';
      if (!airborne) { c.beginPath(); c.ellipse(0, 6, 36, 6, 0, 0, 7); c.fill(); }
      c.strokeStyle = '#6b3f26'; c.lineWidth = 7; c.lineCap = 'round';
      var l1 = airborne ? -1.1 : s * .8, l2 = airborne ? -.9 : -s * .8;
      c.beginPath();
      c.moveTo(-20, -26); c.lineTo(-20 + Math.sin(l1) * 18, 4 - (airborne ? 10 : 0));
      c.moveTo(18, -26); c.lineTo(18 + Math.sin(l2) * 18, 4 - (airborne ? 14 : 0));
      c.stroke();
      c.fillStyle = '#8b5a33';
      U.roundRect(c, -34, -46, 70, 26, 12); c.fill();
      c.beginPath();
      c.moveTo(30, -42); c.lineTo(52, -62); c.lineTo(58, -54); c.lineTo(38, -30);
      c.closePath(); c.fill();                                     // neck
      c.fillStyle = '#7a4d2c';
      U.roundRect(c, 50, -70, 20, 12, 5); c.fill();                // head
      c.strokeStyle = '#3b2415'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(-34, -42); c.lineTo(-52, -30 + s * 6); c.stroke();  // tail
      // rider
      c.fillStyle = '#b91c1c';
      U.roundRect(c, -8, -74, 16, 26, 7); c.fill();
      c.fillStyle = '#111827';
      c.beginPath(); c.arc(0, -82, 8, 0, 7); c.fill();
      c.strokeStyle = '#111827'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(4, -66); c.lineTo(30, -56); c.stroke();
      c.restore();
    }

    function drawFence(c, f, sx) {
      var hpx = f.h * 92;
      c.fillStyle = '#e2e8f0';
      c.fillRect(sx - 26, GROUND - hpx - 10, 7, hpx + 10);
      c.fillRect(sx + 20, GROUND - hpx - 10, 7, hpx + 10);
      var poles = Math.max(2, Math.round(f.h * 3));
      for (var i = 0; i < poles; i++) {
        var py = GROUND - 14 - i * (hpx / poles);
        var isTop = i === poles - 1;
        c.save();
        if (isTop && f.down > 0) {
          c.translate(sx, py);
          c.rotate(Math.min(1.4, f.down * 3));
          c.translate(-sx, -py + Math.min(hpx, f.down * 140));
        }
        c.fillStyle = i % 2 ? '#f8fafc' : (isTop ? '#ef4444' : '#38bdf8');
        U.roundRect(c, sx - 26, py - 6, 53, 9, 4); c.fill();
        c.restore();
      }
      c.fillStyle = 'rgba(15,23,42,.8)';
      U.roundRect(c, sx - 14, GROUND + 4, 28, 16, 4); c.fill();
      c.fillStyle = f.cleared ? '#4ade80' : '#f8fafc';
      c.font = '800 11px Outfit, sans-serif'; c.textAlign = 'center';
      c.fillText(f.name, sx, GROUND + 16);
    }

    return Milo.arcade(host, {
      id: 'show-jumping',
      w: W, h: H, bg: '#0d1b2a',
      stats: ['Faults', 'Fence', 'Time'],
      emo: '🐴',
      touch: 'dpad+a',
      start: {
        title: 'Show Jumping',
        text: 'The horse canters on its own; you choose the stride. ↑ lengthens and ↓ ' +
          'shortens it, and the ticks on the ground show you where the next footfalls will ' +
          'land. Line one of them up with the green take-off zone in front of the fence and ' +
          'press Space there. Stand off too far and the pole comes down, get in too deep ' +
          'and he refuses. Ten fences, four faults a mistake, time faults after 46 seconds ' +
          '— go clear and you get a jump-off.',
        keys: ['↑ ↓  stride length', 'Space  take off']
      },
      init: reset,

      onPointer: function (g, type) { if (type === 'down') g.data.tap = true; },

      update: function (g, dt) {
        var d = g.data, k = g.input, i;
        var tap = k.pressed('action') || d.tap;
        d.tap = false;
        if (d.msgT > 0) d.msgT -= dt;
        if (d.lastResultT > 0) d.lastResultT -= dt;
        for (i = 0; i < d.fences.length; i++) {
          if (d.fences[i].down > 0 && d.fences[i].down < 1) d.fences[i].down += dt * 1.6;
        }
        for (i = d.dust.length - 1; i >= 0; i--) {
          d.dust[i].t -= dt; d.dust[i].x -= dt * 1.5;
          if (d.dust[i].t <= 0) d.dust.splice(i, 1);
        }

        if (d.phase === 'refusal') {
          d.phaseT -= dt;
          d.time += dt;
          if (d.phaseT <= 0) {
            d.x = Math.max(0, fence(d).x - 11);
            d.phase = 'canter';
            say(d, 'Come again', .9);
          }
          g.set('Time', d.time.toFixed(1) + 's');
          return;
        }

        if (d.phase === 'jump') {
          d.time += dt;
          var j = d.jump;
          j.t += dt;
          d.x = j.from + j.dist * (j.t / j.T);
          if (j.t >= j.T) land(g);
          g.set('Time', d.time.toFixed(1) + 's');
          return;
        }

        if (d.phase !== 'canter') return;

        d.time += dt;
        g.set('Time', d.time.toFixed(1) + 's');

        if (k.down('up')) d.targetV = Math.min(9.2, d.targetV + 2.4 * dt);
        if (k.down('down')) d.targetV = Math.max(4.6, d.targetV - 2.4 * dt);
        d.v += (d.targetV - d.v) * Math.min(1, dt * 3.4);
        d.x += d.v * dt;
        d.stridePhase += (d.v / stride(d)) * dt;
        if (d.stridePhase >= 1) {
          d.stridePhase -= 1;
          d.dust.push({ x: d.x - .4, t: .5 });
          Milo.sound.tone({ f: 120, d: .04, v: .035, type: 'triangle' });
        }

        if (tap) takeOff(g);

        var f = fence(d);
        if (f && d.x > f.x - .2) refuse(g, 'He runs past it');
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, i;
        var cam = d.x - 7;
        function SX(m) { return (m - cam) * PPM; }

        var sky = c.createLinearGradient(0, 0, 0, GROUND);
        sky.addColorStop(0, '#14263f'); sky.addColorStop(1, '#2d4f63');
        c.fillStyle = sky; c.fillRect(0, 0, W, GROUND);
        // stand
        c.fillStyle = '#152238';
        c.fillRect(0, 180, W, 110);
        for (i = 0; i < 150; i++) {
          c.fillStyle = 'rgba(255,255,255,' + (.025 + (i % 7) * .008) + ')';
          c.beginPath(); c.arc((i * 53) % W, 195 + ((i * 29) % 80), 6, 0, 7); c.fill();
        }
        // arena
        c.fillStyle = '#b08557';
        c.fillRect(0, GROUND, W, H - GROUND);
        c.fillStyle = 'rgba(255,255,255,.05)';
        for (i = 0; i < 40; i++) c.fillRect((i * 40 - (cam * PPM) % 40), GROUND + 30, 20, 3);

        // take-off zone for the next fence
        var f = d.fences[d.idx];
        if (f && d.phase !== 'jump') {
          var win = window_(f);
          var zx0 = SX(f.x - win[1]), zx1 = SX(f.x - win[0]);
          c.fillStyle = 'rgba(74,222,128,.28)';
          c.fillRect(zx0, GROUND - 4, zx1 - zx0, 14);
          c.strokeStyle = 'rgba(74,222,128,.7)'; c.lineWidth = 2;
          c.strokeRect(zx0, GROUND - 4, zx1 - zx0, 14);
          c.fillStyle = 'rgba(248,113,113,.2)';
          c.fillRect(SX(f.x - win[0]), GROUND - 4, SX(f.x) - SX(f.x - win[0]), 14);
          c.fillStyle = 'rgba(226,232,240,.85)';
          c.font = '700 10px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText('TAKE OFF', (zx0 + zx1) / 2, GROUND - 10);
        }

        // projected footfalls
        if (d.phase === 'canter') {
          var L = stride(d);
          for (i = 0; i < 7; i++) {
            var fx = d.x + (1 - d.stridePhase) * L + i * L;
            var s = SX(fx);
            if (s > W) break;
            c.fillStyle = 'rgba(255,255,255,' + (.7 - i * .08) + ')';
            c.fillRect(s - 2, GROUND + 4, 4, 10);
          }
        }
        for (i = 0; i < d.dust.length; i++) {
          c.fillStyle = 'rgba(255,255,255,' + (d.dust[i].t * .35) + ')';
          c.beginPath(); c.arc(SX(d.dust[i].x), GROUND + 2, 6 * (1 - d.dust[i].t), 0, 7); c.fill();
        }

        for (i = 0; i < d.fences.length; i++) {
          var sx = SX(d.fences[i].x);
          if (sx > -80 && sx < W + 80) drawFence(c, d.fences[i], sx);
        }

        // horse
        var hy = GROUND, tilt = 0, air = false;
        if (d.phase === 'jump') {
          var j = d.jump, t = j.t / j.T;
          hy = GROUND - Math.sin(t * Math.PI) * j.peak;
          tilt = -Math.cos(t * Math.PI) * .45;
          air = true;
        }
        drawHorse(c, SX(d.x), hy, d.stridePhase, air, tilt);

        /* HUD */
        c.textAlign = 'left';
        c.fillStyle = 'rgba(8,14,26,.72)';
        U.roundRect(c, 22, 72, 212, 74, 10); c.fill();
        c.fillStyle = 'rgba(226,232,240,.6)';
        c.font = '700 10px Outfit, sans-serif';
        c.fillText('STRIDE LENGTH', 34, 90);
        c.fillStyle = 'rgba(255,255,255,.14)';
        U.roundRect(c, 34, 96, 188, 10, 5); c.fill();
        c.fillStyle = '#facc15';
        U.roundRect(c, 34, 96, 188 * U.clamp((d.v - 4.6) / 4.6, 0, 1), 10, 5); c.fill();
        c.fillStyle = '#f8fafc';
        c.font = '800 13px Outfit, sans-serif';
        c.fillText(stride(d).toFixed(2) + 'm  ·  ' + d.v.toFixed(1) + ' m/s', 34, 126);
        c.fillStyle = 'rgba(226,232,240,.55)';
        c.font = '600 10px Outfit, sans-serif';
        c.fillText(d.round === 2 ? 'JUMP-OFF — against the clock'
          : 'time allowed ' + ALLOWED + 's', 34, 140);

        // distance to the next fence
        if (f) {
          var gap = f.x - d.x;
          c.textAlign = 'right';
          c.fillStyle = 'rgba(8,14,26,.72)';
          U.roundRect(c, W - 214, 72, 192, 56, 10); c.fill();
          c.fillStyle = gap < 3.4 && gap > 1 ? '#4ade80' : '#f8fafc';
          c.font = '900 24px Outfit, sans-serif';
          c.fillText(Math.max(0, gap).toFixed(1) + 'm', W - 34, 102);
          c.fillStyle = 'rgba(226,232,240,.6)';
          c.font = '600 10px Outfit, sans-serif';
          c.fillText('TO FENCE ' + f.name + '  ·  ' + (f.h * 100).toFixed(0) + 'cm', W - 34, 118);
        }

        c.textAlign = 'center';
        if (d.lastResultT > 0) {
          c.globalAlpha = U.clamp(d.lastResultT, 0, 1);
          c.fillStyle = '#fb7185';
          c.font = '900 26px Outfit, sans-serif';
          c.fillText(d.lastResult, W / 2, 176);
          c.globalAlpha = 1;
        }
        if (d.msgT > 0) {
          c.globalAlpha = U.clamp(d.msgT, 0, 1);
          c.fillStyle = '#f1f5f9';
          c.font = '800 17px Outfit, sans-serif';
          c.fillText(d.msg, W / 2, H - 26);
          c.globalAlpha = 1;
        }
      }
    });
  }

  window.Milo.register({
    id: 'show-jumping',
    title: 'Show Jumping',
    emo: '🐴',
    category: 'Sports',
    tagline: 'Lengthen or shorten until the stride fits',
    description: 'The canter never stops, so the whole round is about arriving at each ' +
      'fence on a good stride. ↑ lengthens the stride and ↓ shortens it, white ticks on the ' +
      'ground project where the next seven footfalls will land, and a green zone marks the ' +
      'take-off — press Space inside it. Stand off too far and the front rail comes down for ' +
      'four faults; get in too deep and he refuses, costing four faults and the time to come ' +
      'again. Ten fences including two doubles, 46 seconds before time faults, three refusals ' +
      'and you are eliminated. A clear round earns a six-fence jump-off against the clock.',
    controls: ['↑ ↓  stride length', 'Space  take off'],
    colors: ['#166534', '#f59e0b'],
    tags: ['equestrian', 'horse', 'timing', 'course', 'jumping'],
    mount: mount
  });
})();
