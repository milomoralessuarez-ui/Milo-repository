/* Javelin — alternate for the run-up, catch the angle dial, beat the wind. */
(function () {
  'use strict';

  var W = 880, H = 520;
  var GROUND = 430;
  var RUNWAY = 22;                 // metres of run-up
  var G = 9.81, K = 0.005, DT = 1 / 240;
  var THROWS = 6, QUALIFY = 70;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.throwNo = 1;
      d.best = 0;
      d.marks = [];
      d.view = 0;
      newThrow(g);
      g.set('Throw', '1/' + THROWS);
      g.set('Best', '0.00m');
      g.set('Wind', '—');
    }

    function newThrow(g) {
      var d = g.data;
      d.phase = 'runup';
      d.pos = -RUNWAY;
      d.speed = 0;
      d.expect = 'right';
      d.stepPhase = 0;
      d.dial = 15; d.dialDir = 1;
      d.jav = null;
      d.trail = [];
      d.view = 0;
      d.result = '';
      d.resT = 0;
      d.tap = false;
      // The breeze stiffens as the competition goes on.
      var mag = U.rand(.4, 1.4 + d.throwNo * .95);
      d.wind = mag * (Math.random() < .5 ? -1 : 1);
      g.set('Wind', (d.wind > 0 ? '+' : '') + d.wind.toFixed(1) + ' m/s');
      d.msg = 'Alternate ← → to build speed';
      d.msgT = 1.8;
    }

    function say(d, t, time) { d.msg = t; d.msgT = time || 1.2; }

    function release(g) {
      var d = g.data;
      var v0 = U.lerp(20, 34, d.speed);
      var a = d.dial * Math.PI / 180;
      d.jav = {
        x: d.pos, y: 1.9,
        vx: Math.cos(a) * v0, vy: Math.sin(a) * v0,
        ang: -a
      };
      d.v0 = v0;
      d.relAngle = d.dial;
      d.phase = 'flight';
      d.trail = [];
      Milo.sound.tone({ f: 620, f2: 240, d: .22, v: .1, type: 'triangle' });
      say(d, Math.round(v0 * 3.6) + ' km/h at ' + Math.round(d.dial) + '°', 1.4);
    }

    function foul(g, why) {
      var d = g.data;
      d.phase = 'result';
      d.resT = 2.2;
      d.result = 'FOUL';
      d.resultSub = why;
      d.marks.push(0);
      Milo.sound.tone({ f: 200, f2: 120, d: .35, v: .12, type: 'sawtooth' });
    }

    function landJavelin(g) {
      var d = g.data;
      var m = Math.max(0, d.jav.x);
      d.marks.push(m);
      d.phase = 'result';
      d.resT = 2.4;
      d.result = m.toFixed(2) + 'm';
      d.resultSub = m > d.best ? 'Personal best of the day' : 'Best so far ' + d.best.toFixed(2) + 'm';
      if (m > d.best) {
        d.best = m;
        g.set('Best', m.toFixed(2) + 'm');
        Milo.sound.coin();
      } else {
        Milo.sound.tone({ f: 260, f2: 160, d: .18, v: .08, type: 'triangle' });
      }
      g.score = Math.round(d.best * 100);
    }

    function nextThrow(g) {
      var d = g.data;
      if (d.throwNo >= THROWS) {
        var sc = Math.round(d.best * 100);
        g.score = sc;
        var txt = 'Six throws, best ' + d.best.toFixed(2) + 'm.';
        if (d.best >= QUALIFY) {
          g.win({ emo: '🥇', title: 'Qualified — ' + d.best.toFixed(2) + 'm', text: txt, score: sc });
        } else if (d.best <= 0) {
          g.gameOver({ emo: '🚩', title: 'Six fouls', text: 'Not one throw counted.', score: 0 });
        } else {
          g.gameOver({
            emo: '🎽', title: d.best.toFixed(2) + 'm',
            text: txt + ' ' + QUALIFY + 'm was the qualifying mark.', score: sc
          });
        }
        return;
      }
      d.throwNo++;
      g.set('Throw', d.throwNo + '/' + THROWS);
      newThrow(g);
    }

    /* --------------------------------------------------------------- view */

    function ppm(d) { return U.lerp(24, 7.6, d.view); }
    function foulX(d) { return U.lerp(620, 120, d.view); }
    function sx(d, m) { return foulX(d) + m * ppm(d); }

    /* --------------------------------------------------------------- draw */

    function drawAthlete(c, d) {
      var x = sx(d, d.pos), y = GROUND;
      var run = d.phase === 'runup';
      var sw = Math.sin(d.stepPhase) * .9;
      c.save();
      c.translate(x, y);
      c.fillStyle = 'rgba(0,0,0,.25)';
      c.beginPath(); c.ellipse(0, 4, 14, 4, 0, 0, 7); c.fill();
      c.strokeStyle = '#facc15'; c.lineWidth = 6; c.lineCap = 'round';
      c.beginPath();
      c.moveTo(0, -28); c.lineTo(Math.sin(sw) * 16, 0);
      c.moveTo(0, -28); c.lineTo(-Math.sin(sw) * 16, 0);
      c.stroke();
      c.fillStyle = '#22d3ee';
      U.roundRect(c, -8, -58, 16, 32, 7); c.fill();
      c.fillStyle = '#f3c8a0';
      c.beginPath(); c.arc(2, -68, 9, 0, 7); c.fill();
      // throwing arm carries the javelin back over the shoulder
      c.strokeStyle = '#22d3ee'; c.lineWidth = 5;
      c.beginPath(); c.moveTo(0, -52); c.lineTo(-14, -62); c.stroke();
      if (run) {
        c.strokeStyle = '#e2e8f0'; c.lineWidth = 3;
        c.beginPath();
        c.moveTo(-42, -74); c.lineTo(34, -56);
        c.stroke();
        c.fillStyle = '#94a3b8';
        c.beginPath();
        c.moveTo(34, -56); c.lineTo(26, -62); c.lineTo(26, -50); c.closePath(); c.fill();
      }
      c.restore();
    }

    function drawJavelin(c, d) {
      var j = d.jav;
      if (!j) return;
      var x = sx(d, j.x), y = GROUND - j.y * ppm(d);
      c.save();
      c.translate(x, y);
      c.rotate(-Math.atan2(j.vy, j.vx));
      var len = U.lerp(70, 26, d.view);
      c.strokeStyle = '#e2e8f0'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(-len * .55, 0); c.lineTo(len * .45, 0); c.stroke();
      c.fillStyle = '#cbd5e1';
      c.beginPath();
      c.moveTo(len * .45, 0); c.lineTo(len * .3, -4); c.lineTo(len * .3, 4); c.closePath(); c.fill();
      c.strokeStyle = '#38bdf8'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(-len * .1, 0); c.lineTo(len * .05, 0); c.stroke();
      c.restore();
    }

    function drawDial(c, d) {
      var cx = 118, cy = 186, r = 58;
      c.fillStyle = 'rgba(8,14,26,.72)';
      c.beginPath(); c.arc(cx, cy, r + 14, 0, 7); c.fill();
      c.strokeStyle = 'rgba(226,232,240,.25)'; c.lineWidth = 10;
      c.beginPath(); c.arc(cx, cy, r, -Math.PI * 65 / 180, -Math.PI * 15 / 180); c.stroke();
      // the band that actually flies
      c.strokeStyle = 'rgba(52,211,153,.55)'; c.lineWidth = 10;
      c.beginPath(); c.arc(cx, cy, r, -Math.PI * 46 / 180, -Math.PI * 38 / 180); c.stroke();
      var a = -d.dial * Math.PI / 180;
      c.strokeStyle = '#fde047'; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath();
      c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * (r + 8), cy + Math.sin(a) * (r + 8));
      c.stroke();
      c.fillStyle = '#f8fafc';
      c.font = '900 20px Outfit, sans-serif'; c.textAlign = 'center';
      c.fillText(Math.round(d.dial) + '°', cx, cy + 34);
      c.font = '600 10px Outfit, sans-serif';
      c.fillStyle = 'rgba(226,232,240,.6)';
      c.fillText('RELEASE ANGLE', cx, cy + 50);
    }

    return Milo.arcade(host, {
      id: 'javelin-throw',
      w: W, h: H, bg: '#0b1220',
      stats: ['Throw', 'Best', 'Wind'],
      emo: '🎽',
      touchButtons: [
        { key: 'left', label: '◀' }, { key: 'right', label: '▶' },
        { key: 'action', label: 'THROW' }
      ],
      start: {
        title: 'Javelin',
        text: 'Hammer ← and → alternately to wind the run-up up to full speed while the ' +
          'angle dial sweeps between 15° and 65°, then hit Space to let it go. The dial ' +
          'matters as much as the speed — around 42° carries furthest — and you have to ' +
          'release before the foul line, so the last stride is always a gamble. Six ' +
          'throws, the best one counts, and the wind gets stronger every round.',
        keys: ['← →  run-up', 'Space  release']
      },
      init: reset,

      onPointer: function (g, type) { if (type === 'down') g.data.tap = true; },

      update: function (g, dt) {
        var d = g.data, k = g.input, i;
        var tap = k.pressed('action') || d.tap;
        d.tap = false;
        if (d.msgT > 0) d.msgT -= dt;

        if (d.phase === 'runup') {
          var hit = null;
          if (k.pressed('left')) hit = 'left';
          else if (k.pressed('right')) hit = 'right';
          if (hit) {
            if (hit === d.expect) {
              d.speed = Math.min(1, d.speed + .085);
              d.expect = hit === 'left' ? 'right' : 'left';
              Milo.sound.tone({ f: 300 + d.speed * 320, d: .04, v: .05, type: 'square' });
            } else {
              d.speed = Math.max(0, d.speed - .04);
              Milo.sound.tone({ f: 150, d: .05, v: .04, type: 'triangle' });
            }
          }
          d.speed = Math.max(0, d.speed - .2 * dt);
          var v = 2.5 + d.speed * 9;
          d.pos += v * dt;
          d.stepPhase += dt * (4 + d.speed * 16);
          d.dial += d.dialDir * 70 * dt;
          if (d.dial > 65) { d.dial = 65; d.dialDir = -1; }
          if (d.dial < 15) { d.dial = 15; d.dialDir = 1; }
          if (tap) { release(g); return; }
          if (d.pos > 0) { d.pos = .6; foul(g, 'You crossed the line'); }
          return;
        }

        if (d.phase === 'flight') {
          d.view = Math.min(1, d.view + dt * 2.6);
          var j = d.jav;
          for (i = 0; i < 4; i++) {
            var rvx = j.vx - d.wind;
            var sp = Math.hypot(rvx, j.vy);
            var dg = K * sp;
            j.vx -= rvx * dg * (dt / 4);
            j.vy -= j.vy * dg * (dt / 4);
            j.vy -= G * (dt / 4);
            j.x += j.vx * (dt / 4);
            j.y += j.vy * (dt / 4);
            if (j.y <= 0) { j.y = 0; landJavelin(g); return; }
          }
          if (g.frame % 3 === 0) {
            d.trail.push({ x: j.x, y: j.y });
            if (d.trail.length > 90) d.trail.shift();
          }
          return;
        }

        if (d.phase === 'result') {
          d.resT -= dt;
          if (d.resT <= 0) nextThrow(g);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, i;

        var sky = c.createLinearGradient(0, 0, 0, GROUND);
        sky.addColorStop(0, '#16305c'); sky.addColorStop(1, '#2b4a7a');
        c.fillStyle = sky; c.fillRect(0, 0, W, GROUND);
        // crowd bank
        c.fillStyle = '#131c33';
        c.fillRect(0, 210, W, 70);
        for (i = 0; i < 120; i++) {
          c.fillStyle = 'rgba(255,255,255,' + (.03 + (i % 6) * .012) + ')';
          c.beginPath(); c.arc((i * 61) % W, 220 + ((i * 37) % 52), 6, 0, 7); c.fill();
        }

        // field
        c.fillStyle = '#1f6b3a';
        c.fillRect(0, GROUND, W, H - GROUND);
        c.fillStyle = '#1a5c32';
        for (i = 0; i < 12; i++) if (i % 2) c.fillRect(0, GROUND + i * 8, W, 8);

        // runway
        var fx = foulX(d), pm = ppm(d);
        c.fillStyle = '#8a3b2a';
        c.fillRect(fx - RUNWAY * pm - 40, GROUND, RUNWAY * pm + 40, H - GROUND);
        c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2;
        c.beginPath();
        c.moveTo(fx - RUNWAY * pm - 40, GROUND + 34); c.lineTo(fx, GROUND + 34); c.stroke();

        // foul line
        c.fillStyle = '#f8fafc';
        c.fillRect(fx - 2, GROUND - 4, 5, 46);
        c.fillStyle = 'rgba(248,250,252,.8)';
        c.font = '700 11px Outfit, sans-serif'; c.textAlign = 'center';
        c.fillText('FOUL LINE', fx, GROUND + 58);

        // distance markers
        if (d.view > .1) {
          c.globalAlpha = d.view;
          for (i = 10; i <= 100; i += 10) {
            var mx = sx(d, i);
            if (mx > W) break;
            c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 1;
            c.beginPath(); c.moveTo(mx, GROUND); c.lineTo(mx, GROUND + 26); c.stroke();
            c.fillStyle = 'rgba(226,232,240,.6)';
            c.font = '600 10px Outfit, sans-serif';
            c.fillText(i + 'm', mx, GROUND + 38);
          }
          // previous marks
          for (i = 0; i < d.marks.length; i++) {
            if (d.marks[i] <= 0) continue;
            var px = sx(d, d.marks[i]);
            c.fillStyle = 'rgba(250,204,21,.5)';
            c.fillRect(px - 1, GROUND - 12, 2, 12);
          }
          c.globalAlpha = 1;
        }

        // trail + javelin
        for (i = 0; i < d.trail.length; i++) {
          c.fillStyle = 'rgba(148,197,255,' + (i / d.trail.length * .35) + ')';
          c.beginPath();
          c.arc(sx(d, d.trail[i].x), GROUND - d.trail[i].y * pm, 2, 0, 7);
          c.fill();
        }
        drawJavelin(c, d);
        if (d.phase === 'runup' || d.phase === 'result') drawAthlete(c, d);

        /* HUD */
        if (d.phase === 'runup') {
          drawDial(c, d);
          // speed bar
          c.fillStyle = 'rgba(8,14,26,.72)';
          U.roundRect(c, W / 2 - 150, 74, 300, 40, 10); c.fill();
          c.fillStyle = 'rgba(255,255,255,.14)';
          U.roundRect(c, W / 2 - 138, 94, 276, 12, 6); c.fill();
          c.fillStyle = d.speed > .8 ? '#4ade80' : d.speed > .45 ? '#facc15' : '#fb7185';
          U.roundRect(c, W / 2 - 138, 94, 276 * d.speed, 12, 6); c.fill();
          c.fillStyle = '#e2e8f0';
          c.font = '700 12px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText('RUN-UP SPEED  ·  next key: ' + (d.expect === 'left' ? '←' : '→'), W / 2, 88);
          // distance to the line
          c.fillStyle = 'rgba(226,232,240,.75)';
          c.font = '800 15px Outfit, sans-serif';
          c.fillText(Math.max(0, -d.pos).toFixed(1) + 'm to the line', W / 2, 140);
        }

        // wind flag
        c.save();
        c.translate(W - 96, 104);
        c.strokeStyle = '#94a3b8'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(0, -26); c.lineTo(0, 30); c.stroke();
        var wdir = d.wind >= 0 ? 1 : -1;
        var wlen = 14 + Math.abs(d.wind) * 6;
        c.fillStyle = d.wind >= 0 ? '#4ade80' : '#fb7185';
        c.beginPath();
        c.moveTo(0, -26); c.lineTo(wdir * wlen, -18); c.lineTo(0, -8); c.closePath(); c.fill();
        c.fillStyle = 'rgba(226,232,240,.8)';
        c.font = '700 12px Outfit, sans-serif'; c.textAlign = 'center';
        c.fillText((d.wind >= 0 ? 'TAIL ' : 'HEAD ') + Math.abs(d.wind).toFixed(1), 0, 46);
        c.restore();

        if (d.phase === 'result' && d.result) {
          c.textAlign = 'center';
          c.fillStyle = d.result === 'FOUL' ? '#fb7185' : '#fde047';
          c.font = '900 40px Outfit, sans-serif';
          c.fillText(d.result, W / 2, 180);
          c.fillStyle = 'rgba(226,232,240,.8)';
          c.font = '700 14px Outfit, sans-serif';
          c.fillText(d.resultSub || '', W / 2, 206);
        }

        if (d.msgT > 0) {
          c.globalAlpha = U.clamp(d.msgT, 0, 1);
          c.textAlign = 'center';
          c.fillStyle = '#e2e8f0';
          c.font = '800 17px Outfit, sans-serif';
          c.fillText(d.msg, W / 2, H - 66);
          c.globalAlpha = 1;
        }

        // throw card
        c.textAlign = 'left';
        c.fillStyle = 'rgba(8,14,26,.7)';
        U.roundRect(c, 20, H - 46, 300, 34, 9); c.fill();
        c.fillStyle = 'rgba(226,232,240,.85)';
        c.font = '700 12px Outfit, sans-serif';
        var line = 'THROW ' + d.throwNo + '/' + THROWS + '   ';
        for (i = 0; i < d.marks.length; i++) {
          line += (d.marks[i] > 0 ? d.marks[i].toFixed(1) : 'X') + '  ';
        }
        c.fillText(line, 32, H - 25);
      }
    });
  }

  window.Milo.register({
    id: 'javelin-throw',
    title: 'Javelin',
    emo: '🎽',
    category: 'Sports',
    tagline: 'Alternate, aim the dial, release before the line',
    description: 'The run-up is an alternating-key sprint — press ← then → then ← in ' +
      'rhythm and the speed bar climbs; break the pattern and it drops. At the same time a ' +
      'dial sweeps the release angle between 15° and 65°, and with real drag in the flight ' +
      'model the ground is longest at about 42°, so you are watching two things while the ' +
      'foul line comes at you. Release too early and you throw from thirty metres back; ' +
      'too late and it is a foul and a zero. Six throws, the best counts, the wind builds ' +
      'each round, and 70m qualifies.',
    controls: ['← →  run-up', 'Space  release'],
    colors: ['#065f46', '#fbbf24'],
    tags: ['athletics', 'throwing', 'power', 'track and field', 'wind'],
    mount: mount
  });
})();
