/* High Jump — approach rhythm, takeoff timing, then the arch over the bar. */
(function () {
  'use strict';

  var W = 820, H = 540;
  var GROUND = 430, BARX = 560;
  var START_H = 165, RISE = 6;      // centimetres

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.height = START_H;
      d.cleared = 0;
      d.attempt = 1;
      d.jumps = 0;
      d.beats = [];              // accuracy of each approach step
      d.phase = 'approach';
      d.step = 0;
      d.beatT = 0;
      d.tempo = .46;             // seconds between footfalls
      d.speed = 0;
      d.cursor = 0; d.cdir = 1;
      d.power = 0; d.arch = 0;
      d.runner = { x: 90, y: GROUND, vy: 0, rot: 0, air: false };
      d.msg = 'Tap Space on each beat';
      d.msgT = 2;
      d.result = '';
      d.resT = 0;
      d.barDown = 0;
      d.tap = false;
      d.flashT = 0;
      d.stepPhase = 0;
      d.archT = 0;
      d.knocked = false;
      d.lastCm = 0;
      d.nextHeight = false;
      g.set('Bar', START_H + 'cm');
      g.set('Best', '–');
      g.set('Try', '1/3');
    }

    function say(d, t, time) { d.msg = t; d.msgT = time || 1.2; }

    function beginAttempt(g) {
      var d = g.data;
      d.phase = 'approach';
      d.step = 0;
      d.beats = [];
      d.beatT = 0;
      d.speed = 0;
      d.power = 0; d.arch = 0;
      d.cursor = 0; d.cdir = 1;
      d.runner = { x: 90, y: GROUND, vy: 0, rot: 0, air: false };
      d.result = '';
      d.barDown = 0;
      d.archT = 0;
      d.knocked = false;
      // Faster metronome as the bar climbs — the run-up has to be sharper.
      d.tempo = Math.max(.27, .46 - (d.height - START_H) * .0035);
      say(d, 'Approach — Space on every beat', 1.4);
    }

    function approachScore(d) {
      if (!d.beats.length) return 0;
      var s = 0;
      for (var i = 0; i < d.beats.length; i++) s += d.beats[i];
      return s / 6;               // six beats in a full run-up
    }

    function jump(g) {
      var d = g.data;
      // Everything the player did turns into one number: how high they go.
      var app = approachScore(d);                       // 0 .. 1
      var take = d.power;                               // 0 .. 1
      var arch = d.arch;                                // 0 .. 1
      var cm = 96 + app * 62 + take * 58 + arch * 34;
      d.lastCm = cm;
      d.lastParts = [app, take, arch];
      d.phase = 'flight';
      d.flightT = 0;
      d.runner.air = true;
      d.cleared_this = cm >= d.height;
      Milo.sound.tone({ f: 300, f2: 620, d: .18, v: .09, type: 'triangle' });
    }

    function land(g) {
      var d = g.data;
      var ok = d.cleared_this;
      d.jumps++;
      if (ok) {
        d.cleared = d.height;
        g.set('Best', d.cleared + 'cm');
        g.score = (d.cleared - START_H + RISE) * 14 + d.jumps * 4;
        d.result = 'CLEARED ' + d.height + 'cm';
        d.resT = 2.1;
        Milo.sound.win();
        d.phase = 'result';
        d.nextHeight = true;
      } else {
        d.barDown = 1;
        d.result = 'Bar down — ' + Math.round(d.lastCm) + 'cm';
        d.resT = 2.1;
        Milo.sound.hit();
        d.phase = 'result';
        d.nextHeight = false;
      }
    }

    function afterResult(g) {
      var d = g.data;
      if (d.nextHeight) {
        d.height += RISE;
        d.attempt = 1;
        g.set('Bar', d.height + 'cm');
        g.set('Try', '1/3');
        beginAttempt(g);
        say(d, 'Bar up to ' + d.height + 'cm', 1.6);
        return;
      }
      d.attempt++;
      if (d.attempt > 3) {
        var sc = (d.cleared ? d.cleared - START_H + RISE : 0) * 14 + d.jumps * 4;
        g.score = sc;
        if (d.cleared >= 215) {
          g.win({
            emo: '🏆', title: 'World class — ' + d.cleared + 'cm',
            text: 'Three failures at ' + d.height + 'cm, but you cleared ' + d.cleared + 'cm.',
            score: sc
          });
        } else if (!d.cleared) {
          g.gameOver({
            emo: '🤸', title: 'No height',
            text: 'Three failures at the opening height of ' + START_H + 'cm.', score: 0
          });
        } else {
          g.gameOver({
            emo: '🤸', title: 'Out at ' + d.height + 'cm',
            text: 'Your best clearance was ' + d.cleared + 'cm from ' + d.jumps + ' jumps.',
            score: sc
          });
        }
        return;
      }
      g.set('Try', d.attempt + '/3');
      beginAttempt(g);
      say(d, 'Attempt ' + d.attempt + ' of 3', 1.4);
    }

    /* --------------------------------------------------------------- draw */

    function drawRunner(c, d) {
      var r = d.runner;
      c.save();
      c.translate(r.x, r.y);
      c.rotate(r.rot);
      c.fillStyle = 'rgba(0,0,0,.22)';
      c.beginPath(); c.ellipse(0, GROUND - r.y + 4, 16, 5, 0, 0, 7); c.fill();
      var swing = r.air ? 0 : Math.sin(d.stepPhase * 6.28) * .8;
      c.strokeStyle = '#f97316'; c.lineWidth = 7; c.lineCap = 'round';
      c.beginPath();
      c.moveTo(0, -26); c.lineTo(Math.sin(swing) * 14, -2);
      c.moveTo(0, -26); c.lineTo(-Math.sin(swing) * 14, -2);
      c.stroke();
      c.fillStyle = '#38bdf8';
      U.roundRect(c, -8, -56, 16, 32, 7); c.fill();
      c.strokeStyle = '#38bdf8'; c.lineWidth = 6;
      c.beginPath();
      c.moveTo(0, -50); c.lineTo(Math.cos(swing + 1) * 18, -58 - Math.sin(swing) * 8);
      c.moveTo(0, -50); c.lineTo(-Math.cos(swing + 1) * 14, -56);
      c.stroke();
      c.fillStyle = '#f5cba7';
      c.beginPath(); c.arc(0, -66, 10, 0, 7); c.fill();
      c.restore();
    }

    function timingBar(c, x, y, w, cursor, zoneA, zoneB, label, col) {
      c.fillStyle = 'rgba(0,0,0,.5)';
      U.roundRect(c, x, y, w, 26, 8); c.fill();
      c.fillStyle = 'rgba(52,211,153,.35)';
      c.fillRect(x + w * zoneA, y + 2, w * (zoneB - zoneA), 22);
      c.fillStyle = col;
      c.fillRect(x + w * cursor - 2, y - 3, 4, 32);
      c.fillStyle = 'rgba(226,232,240,.8)';
      c.font = '700 11px Outfit, sans-serif'; c.textAlign = 'left';
      c.fillText(label, x, y - 8);
    }

    return Milo.arcade(host, {
      id: 'high-jump',
      w: W, h: H, bg: '#0d1526',
      stats: ['Bar', 'Best', 'Try'],
      emo: '🤸',
      touch: 'a',
      touchButtons: [{ key: 'action', label: 'TIME IT' }],
      start: {
        title: 'High Jump',
        text: 'Three presses of Space per jump, and each one is a different skill. Six ' +
          'footfalls come at you on a metronome — hit each beat to build run-up speed. ' +
          'Then a fast bar sweeps the take-off board: stop it in the green. Then a faster ' +
          'one for the arch of your back over the bar. The bar rises 5cm a round and the ' +
          'metronome quickens with it; three failures at one height and you are out.',
        keys: ['Space  beat / take off / arch']
      },
      init: reset,

      onPointer: function (g, type) { if (type === 'down') g.data.tap = true; },

      update: function (g, dt) {
        var d = g.data;
        var tap = g.input.pressed('action') || d.tap;
        d.tap = false;
        if (d.msgT > 0) d.msgT -= dt;
        if (d.flashT > 0) d.flashT -= dt;
        d.stepPhase = (d.stepPhase || 0) + dt * (1 + d.speed) * 1.6;

        if (d.phase === 'approach') {
          d.beatT += dt;
          if (tap) {
            // How close to the beat? 0 is perfect, half a tempo is hopeless.
            var off = Math.abs(d.beatT - d.tempo);
            var acc = U.clamp(1 - off / (d.tempo * .55), 0, 1);
            d.beats.push(acc);
            d.beatT = 0;
            d.step++;
            d.speed = approachScore(d);
            Milo.sound.tone({
              f: 380 + acc * 420, d: .05, v: .07,
              type: acc > .7 ? 'square' : 'triangle'
            });
            d.flashT = .18;
            if (d.step >= 6) {
              d.phase = 'takeoff';
              d.cursor = 0; d.cdir = 1;
              say(d, 'Take off — stop it in the green', 1.2);
            }
          } else if (d.beatT > d.tempo * 1.9) {
            // Missed a beat entirely.
            d.beats.push(0);
            d.beatT = 0;
            d.step++;
            d.speed = approachScore(d);
            Milo.sound.tone({ f: 170, d: .08, v: .05, type: 'triangle' });
            if (d.step >= 6) {
              d.phase = 'takeoff';
              say(d, 'Take off — stop it in the green', 1.2);
            }
          }
          d.runner.x = 90 + d.step * 52 + U.clamp(d.beatT / d.tempo, 0, 1.3) * 52 * (d.step < 6 ? 1 : 0);
          return;
        }

        if (d.phase === 'takeoff') {
          d.cursor += d.cdir * dt * (1.15 + d.speed * .5);
          if (d.cursor > 1) { d.cursor = 1; d.cdir = -1; }
          if (d.cursor < 0) { d.cursor = 0; d.cdir = 1; }
          if (tap) {
            // Green zone sits at 0.62–0.80 — late is better than early here.
            var c0 = .62, c1 = .8;
            var mid = (c0 + c1) / 2;
            d.power = U.clamp(1 - Math.abs(d.cursor - mid) / .3, 0, 1);
            Milo.sound.tone({ f: 280 + d.power * 400, f2: 200, d: .1, v: .09, type: 'square' });
            d.phase = 'arch';
            d.cursor = 0; d.cdir = 1;
            say(d, 'Arch!', .9);
          }
          return;
        }

        if (d.phase === 'arch') {
          d.cursor += d.cdir * dt * 2.1;
          if (d.cursor > 1) { d.cursor = 1; d.cdir = -1; }
          if (d.cursor < 0) { d.cursor = 0; d.cdir = 1; }
          d.archT = (d.archT || 0) + dt;
          if (tap || d.archT > 2.4) {
            d.arch = tap ? U.clamp(1 - Math.abs(d.cursor - .5) / .28, 0, 1) : 0;
            d.archT = 0;
            jump(g);
          }
          return;
        }

        if (d.phase === 'flight') {
          d.flightT += dt;
          var t = d.flightT / 1.35;
          var r = d.runner;
          // The drawn arc matches the bar's own scale, so what you see over the
          // bar is exactly what the judges gave you.
          var peak = Math.max(14, 40 + (d.lastCm - 120) * 1.6);
          r.x = 400 + t * 300;
          r.y = GROUND - Math.sin(U.clamp(t, 0, 1) * Math.PI) * peak;
          r.rot = t * 3.4;
          if (!d.cleared_this && t > .5 && !d.knocked) {
            d.knocked = true;
            Milo.sound.tone({ f: 160, f2: 80, d: .2, v: .1, type: 'sawtooth' });
          }
          if (t >= 1) { d.knocked = false; r.air = false; land(g); }
          return;
        }

        if (d.phase === 'result') {
          d.resT -= dt;
          if (d.barDown > 0) d.barDown = Math.min(1, d.barDown + dt);
          if (d.resT <= 0) afterResult(g);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, i;

        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#12233f'); sky.addColorStop(1, '#0a1020');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);
        // stadium lights
        for (i = 0; i < 6; i++) {
          c.fillStyle = 'rgba(255,255,255,.05)';
          c.beginPath();
          c.moveTo(60 + i * 140, 0); c.lineTo(20 + i * 140, GROUND); c.lineTo(160 + i * 140, GROUND);
          c.closePath(); c.fill();
        }

        // track + landing mat
        c.fillStyle = '#7f2d2d';
        c.fillRect(0, GROUND, W, H - GROUND);
        c.fillStyle = '#8f3636';
        for (i = 0; i < 26; i++) c.fillRect(i * 34, GROUND, 18, 5);
        c.fillStyle = '#2f4d8a';
        U.roundRect(c, BARX + 20, GROUND - 46, 230, 78, 10); c.fill();
        c.fillStyle = 'rgba(255,255,255,.08)';
        U.roundRect(c, BARX + 26, GROUND - 40, 218, 24, 8); c.fill();

        // uprights + bar
        var barY = GROUND - 40 - (d.height - 120) * 1.6;
        c.fillStyle = '#cbd5e1';
        c.fillRect(BARX - 6, barY - 16, 9, GROUND - barY + 16);
        c.fillRect(BARX + 224, barY - 16, 9, GROUND - barY + 16);
        c.save();
        if (d.barDown > 0) {
          c.translate(BARX + 114, barY);
          c.rotate(d.barDown * .7);
          c.translate(-(BARX + 114), -barY + d.barDown * 60);
        }
        c.fillStyle = '#facc15';
        U.roundRect(c, BARX - 4, barY - 5, 236, 9, 4); c.fill();
        c.restore();
        c.fillStyle = '#fef08a';
        c.font = '800 14px Outfit, sans-serif'; c.textAlign = 'left';
        c.fillText(d.height + 'cm', BARX + 244, barY + 4);

        drawRunner(c, d);

        // the approach beat track
        if (d.phase === 'approach') {
          var tw = 420, tx = W / 2 - tw / 2, ty = 96;
          c.fillStyle = 'rgba(0,0,0,.45)';
          U.roundRect(c, tx - 10, ty - 22, tw + 20, 54, 10); c.fill();
          for (i = 0; i < 6; i++) {
            var bx = tx + i * (tw / 5);
            var got = d.beats[i];
            c.fillStyle = got == null ? 'rgba(255,255,255,.2)'
              : got > .75 ? '#34d399' : got > .4 ? '#facc15' : '#ef4444';
            c.beginPath(); c.arc(bx, ty, 10, 0, 7); c.fill();
          }
          var pulse = U.clamp(d.beatT / d.tempo, 0, 1.4);
          c.strokeStyle = d.flashT > 0 ? '#fff' : 'rgba(250,204,21,.9)';
          c.lineWidth = 3;
          c.beginPath();
          c.arc(tx + Math.min(5, d.step) * (tw / 5), ty, 10 + (1 - Math.min(pulse, 1)) * 16, 0, 7);
          c.stroke();
          c.fillStyle = 'rgba(226,232,240,.8)';
          c.font = '700 12px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText('SPACE ON THE BEAT  ·  step ' + Math.min(6, d.step + 1) + ' of 6', W / 2, ty + 28);
        }

        if (d.phase === 'takeoff') timingBar(c, W / 2 - 200, 100, 400, d.cursor, .62, .8, 'TAKE-OFF', '#fde047');
        if (d.phase === 'arch') timingBar(c, W / 2 - 200, 100, 400, d.cursor, .36, .64, 'ARCH', '#f472b6');

        // power read-out
        c.fillStyle = 'rgba(0,0,0,.42)';
        U.roundRect(c, 24, 74, 190, 66, 10); c.fill();
        var rows = [['RUN-UP', d.speed], ['TAKE-OFF', d.power], ['ARCH', d.arch]];
        c.font = '700 10px Outfit, sans-serif'; c.textAlign = 'left';
        for (i = 0; i < rows.length; i++) {
          c.fillStyle = 'rgba(226,232,240,.7)';
          c.fillText(rows[i][0], 34, 92 + i * 19);
          c.fillStyle = 'rgba(255,255,255,.14)';
          c.fillRect(100, 84 + i * 19, 100, 8);
          c.fillStyle = ['#38bdf8', '#fde047', '#f472b6'][i];
          c.fillRect(100, 84 + i * 19, 100 * U.clamp(rows[i][1] || 0, 0, 1), 8);
        }

        if (d.result && d.resT > 0) {
          c.textAlign = 'center';
          c.fillStyle = d.nextHeight ? '#4ade80' : '#fb7185';
          c.font = '900 30px Outfit, sans-serif';
          c.fillText(d.result, W / 2, 210);
        }
        if (d.msgT > 0) {
          c.globalAlpha = U.clamp(d.msgT, 0, 1);
          c.textAlign = 'center';
          c.fillStyle = '#e2e8f0';
          c.font = '800 18px Outfit, sans-serif';
          c.fillText(d.msg, W / 2, H - 30);
          c.globalAlpha = 1;
        }
        c.textAlign = 'center';
        c.fillStyle = 'rgba(226,232,240,.5)';
        c.font = '600 12px Outfit, sans-serif';
        c.fillText('Best cleared: ' + (d.cleared ? d.cleared + 'cm' : '–') +
          '   ·   attempt ' + d.attempt + ' of 3 at ' + d.height + 'cm', W / 2, H - 12);
      }
    });
  }

  window.Milo.register({
    id: 'high-jump',
    title: 'High Jump',
    emo: '🤸',
    category: 'Sports',
    tagline: 'Six beats, a board and an arch',
    description: 'One jump is three separate timing tests on the same key. First the ' +
      'approach: six footfalls arrive on a metronome and every beat you nail adds run-up ' +
      'speed, while a missed one scores zero and cannot be taken back. Then a sweeping bar ' +
      'for the take-off, with the green window sitting late so you have to hold your nerve, ' +
      'and finally a faster sweep for the arch of your back over the bar. Those three ' +
      'numbers add up to a height in centimetres — clear the bar and it goes up 5cm with a ' +
      'quicker metronome, miss three times at one height and the competition is over.',
    controls: ['Space  beat / take off / arch'],
    colors: ['#1d4ed8', '#facc15'],
    tags: ['athletics', 'timing', 'rhythm', 'track and field'],
    mount: mount
  });
})();
