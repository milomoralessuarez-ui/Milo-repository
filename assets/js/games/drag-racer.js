/* Drag Racer — stage the revs, cut the light, shift on the needle. */
(function () {
  'use strict';
  var W = 900, H = 560;
  var TAU = Math.PI * 2;
  var QUARTER = 402;              // metres
  var REDLINE = 9000, IDLE = 900, SHIFT_LIGHT = 8350;
  var GEARS = [3.25, 2.15, 1.56, 1.18, 0.92];
  var WHEEL = 0.33, MASS = 1150;

  var LADDER = [
    { name: 'Rusty Rhodes', et: 11.35, rt: 0.48, col: '#4ade80', round: 'Round 1' },
    { name: '"Lefty" Vance', et: 10.55, rt: 0.31, col: '#60a5fa', round: 'Semi-final' },
    { name: 'Dee Kowalski', et: 9.78, rt: 0.17, col: '#f472b6', round: 'FINAL' }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function rpmFromSpeed(v, gear, finalD) {
      return (v / WHEEL) * GEARS[gear] * finalD * 9.5493;
    }
    function torque(rpm) {
      var t = 1 - Math.pow((rpm - 6400) / 4600, 2);
      return 940 * U.clamp(t, 0.22, 1);
    }

    function reset(g) {
      var d = g.data;
      d.round = 0;
      d.wins = 0;
      d.bestTotal = 99;
      d.finalD = 3.9;
      d.launchRpm = 5000;
      d.tuneRow = 0;
      d.log = [];
      enterTune(g);
    }

    function enterTune(g) {
      var d = g.data;
      d.phase = 'tune';
      d.phaseT = 0;
      d.rpm = IDLE;
      d.v = 0; d.x = 0; d.gear = 0;
      d.oppX = 0; d.oppT = 0;
      d.et = 0; d.rt = 0; d.trap = 0;
      d.smoke = [];
      d.foul = false;
      d.staged = 0;
      d.tree = -1;
      d.treeT = 0;
      d.shiftT = 0;
      d.launched = false;
      d.autoT = 0;
      d.msg = '';
      g.set('Round', LADDER[d.round].round);
      g.set('RPM', '0');
      g.set('MPH', '0');
      g.set('ET', '—');
    }

    function enterStage(g) {
      var d = g.data;
      d.phase = 'stage';
      d.rpm = IDLE;
      d.staged = 0;
      d.tree = -1;
      d.autoT = 0;
      d.msg = 'Hold REV to bring it up to your launch band';
      Milo.sound.tone({ f: 220, f2: 180, d: .3, v: .09, type: 'sawtooth' });
    }

    function launch(g, early) {
      var d = g.data;
      d.launched = true;
      d.phase = 'run';
      d.runT = 0;
      d.clutch = 0;
      d.v = 0; d.x = 0; d.gear = 0;
      d.oppT = 0;
      d.rt = early ? 0 : U.clamp(d.treeT, 0, 3);
      d.spinAmt = U.clamp((d.rpm - 5200) / 2600, 0, 1);
      d.bog = d.rpm < 3900 ? 1 : 0;
      d.startRpm = d.rpm;
      d.hitLimiter = 0;
      Milo.sound.tone({ f: 120, f2: 400, d: .4, v: .13, type: 'sawtooth' });
      for (var i = 0; i < 26; i++) {
        d.smoke.push({ x: -1.4, y: U.rand(-6, 8), r: U.rand(10, 26), t: U.rand(.5, 1.3), max: 1.3 });
      }
    }

    function redLight(g) {
      var d = g.data;
      d.foul = true;
      d.phase = 'result';
      d.phaseT = 0;
      Milo.sound.hit();
      d.result = {
        win: false, red: true,
        text: 'Red light. You left before the green and the win light goes to ' +
          LADDER[d.round].name + '.'
      };
    }

    function finishRun(g) {
      var d = g.data;
      var opp = LADDER[d.round];
      var mine = d.rt + d.et;
      var theirs = opp.rt + opp.et;
      if (mine < d.bestTotal) d.bestTotal = mine;
      var win = mine < theirs;
      d.phase = 'result';
      d.phaseT = 0;
      var how = d.spinAmt > .62 ? 'Smoked the tyres off the line. ' :
        d.bog > 0 ? 'Bogged down at the hit. ' :
          d.rt < .12 ? 'Perfect light. ' : '';
      d.result = {
        win: win, red: false,
        text: how + 'You ran ' + d.et.toFixed(3) + ' at ' + Math.round(d.trap) +
          ' mph on a ' + d.rt.toFixed(3) + ' light; ' + opp.name + ' ran ' + opp.et.toFixed(3) +
          ' on a ' + opp.rt.toFixed(3) + '.'
      };
      d.log.push({ round: opp.round, et: d.et, rt: d.rt, win: win });
      if (win) { d.wins++; Milo.sound.win(); } else Milo.sound.lose();
      g.score = scoreOf(d);
    }

    function scoreOf(d) {
      var bonus = d.bestTotal < 90 ? Math.max(0, Math.round((13.5 - d.bestTotal) * 5000)) : 0;
      return d.wins * 25000 + bonus;
    }

    function oppDist(t, et) {
      if (t <= 0) return 0;
      var p = U.clamp(t / et, 0, 1.6);
      return QUARTER * Math.pow(p, 1.62);
    }

    return Milo.arcade(host, {
      id: 'drag-racer',
      w: W, h: H, bg: '#080a14',
      stats: ['Round', 'RPM', 'MPH', 'ET'],
      touchButtons: [
        { key: 'left', label: '◀' }, { key: 'right', label: '▶' },
        { key: 'action', label: 'REV' }, { key: 'up', label: 'GO' }
      ],
      emo: '🏁',
      start: {
        title: 'Drag Racer',
        text: 'Four hundred metres, straight ahead. Set your gearing and launch revs, ' +
          'bring the motor up into the band, cut the tree without red-lighting, then shift ' +
          'on the needle — too early and you fall out of the power, too late and the limiter ' +
          'eats your run. Win three rounds of the ladder.',
        keys: ['← → tune', 'Space rev', '↑ launch & shift']
      },
      init: reset,

      onKey: function (g, e, name) {
        var d = g.data;
        if (d.phase === 'tune') {
          if (name === 'up' || name === 'down') {
            d.tuneRow = 1 - d.tuneRow;
            Milo.sound.click();
          } else if (name === 'left' || name === 'right') {
            var s = name === 'right' ? 1 : -1;
            if (d.tuneRow === 0) d.finalD = U.clamp(+(d.finalD + s * 0.15).toFixed(2), 3.0, 4.8);
            else d.launchRpm = U.clamp(d.launchRpm + s * 250, 2500, 7500);
            Milo.sound.blip();
          } else if (name === 'action') {
            enterStage(g);
          }
          return;
        }
        if (d.phase === 'stage') {
          if (name === 'up') {
            if (d.tree >= 0 && d.tree < 3) redLight(g);
            else if (d.tree === 3) launch(g, false);
          }
          return;
        }
        if (d.phase === 'run' && name === 'up') {
          if (d.gear < GEARS.length - 1 && d.shiftT <= 0) {
            var before = d.rpm;
            d.gear++;
            d.shiftT = 0.17;
            if (before < 5600) d.msg = 'Short-shifted — off the cam';
            Milo.sound.tone({ f: 300, f2: 180, d: .07, v: .09, type: 'square' });
          }
          return;
        }
        if (d.phase === 'result' && name === 'action') advance(g);
      },

      onPointer: function (g, type) {
        if (type !== 'down') return;
        var d = g.data;
        if (d.phase === 'result') advance(g);
        else if (d.phase === 'tune') enterStage(g);
        else if (d.phase === 'stage' && d.tree === 3) launch(g, false);
        else if (d.phase === 'run') g.input.set('up', true);
      },

      update: function (g, dt) {
        var d = g.data, inp = g.input, i;
        d.phaseT += dt;

        if (d.phase === 'tune') {
          d.rpm = U.lerp(d.rpm, IDLE + Math.sin(g.t * 9) * 120, Math.min(1, dt * 5));
          if (d.phaseT > 22) enterStage(g);   // never leave a player stranded
          return;
        }

        if (d.phase === 'stage') {
          d.autoT += dt;
          var revving = inp.down('action') || inp.pdown;
          d.rpm += (revving ? 5600 : -4200) * dt;
          d.rpm = U.clamp(d.rpm, IDLE, REDLINE + 200);
          if (g.frame % 4 === 0 && revving) {
            Milo.sound.tone({ f: 60 + d.rpm * .035, d: .05, v: .05, type: 'sawtooth' });
          }
          if (d.tree < 0) {
            var inBand = Math.abs(d.rpm - d.launchRpm) < 420;
            d.staged = inBand ? Math.min(1, d.staged + dt / 0.55) : Math.max(0, d.staged - dt);
            if (d.staged >= 1 || d.autoT > 9) {
              d.staged = 1;
              d.tree = 0; d.treeT = 0;
              d.msg = 'Staged. Watch the tree.';
              Milo.sound.tone({ f: 660, d: .1, v: .09 });
            }
          } else {
            d.treeT += dt;
            if (d.tree < 3) {
              var want = Math.min(3, Math.floor(d.treeT / 0.5));
              if (want !== d.tree) {
                d.tree = want;
                Milo.sound.tone({ f: d.tree === 3 ? 880 : 420, d: .09, v: .1 });
                if (d.tree === 3) d.treeT = 0;
              }
            } else if (d.treeT > 2.4) {
              launch(g, false);       // asleep at the line
            }
          }
          g.set('RPM', Math.round(d.rpm));
          return;
        }

        if (d.phase === 'run') {
          d.runT += dt;
          d.et = d.runT;
          d.oppT += dt;
          d.clutch = Math.min(1, d.clutch + dt / 0.65);

          var ratio = GEARS[d.gear] * d.finalD;
          var vRpm = Math.max(IDLE, rpmFromSpeed(d.v, d.gear, d.finalD));
          d.rpm = d.clutch < 1 ? Math.max(vRpm, U.lerp(d.startRpm, vRpm, d.clutch)) : vRpm;

          var cut = 1;
          if (d.rpm >= REDLINE) { d.rpm = REDLINE; cut = 0.28; d.hitLimiter += dt; }
          if (d.shiftT > 0) { d.shiftT -= dt; cut = 0; }
          if (d.bog && d.clutch < 1) cut *= 0.5;

          var F = torque(d.rpm) * ratio / WHEEL * 0.92 * cut;
          // Traction: a big launch is free power only if the tyres take it.
          var grip = 1.55 - Math.max(0, d.finalD - 3.7) * 0.3;
          if (d.clutch < 1) grip *= 1 - 0.5 * d.spinAmt;
          var Fmax = grip * MASS * 9.81;
          var spinning = F > Fmax;
          if (spinning) {
            F = Fmax * 0.6;
            if (g.frame % 3 === 0) {
              d.smoke.push({ x: d.x - 1.2, y: U.rand(-4, 10), r: U.rand(8, 20), t: .9, max: .9 });
            }
          }
          var drag = 0.42 * d.v * d.v + 26;
          d.v = Math.max(0, d.v + (F - drag) / MASS * dt);
          d.x += d.v * dt;

          if (g.frame % 5 === 0) {
            Milo.sound.tone({ f: 55 + d.rpm * .04, d: .06, v: .045, type: 'sawtooth' });
          }
          for (i = d.smoke.length - 1; i >= 0; i--) {
            var s = d.smoke[i];
            s.t -= dt; s.r += 34 * dt; s.y -= 12 * dt;
            if (s.t <= 0) d.smoke.splice(i, 1);
          }

          d.oppX = oppDist(d.oppT - LADDER[d.round].rt + d.rt, LADDER[d.round].et);

          g.set('RPM', Math.round(d.rpm));
          g.set('MPH', Math.round(d.v * 2.2369));
          g.set('ET', d.et.toFixed(2));

          if (d.x >= QUARTER) {
            d.trap = d.v * 2.2369;
            finishRun(g);
          } else if (d.runT > 26) {
            d.trap = d.v * 2.2369;
            finishRun(g);
          }
          return;
        }

        if (d.phase === 'result') {
          if (d.phaseT > 6.5) advance(g);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.fillStyle = '#080a14'; c.fillRect(0, 0, W, H);
        if (d.phase === 'tune') { drawTune(c, d); drawTacho(g, c, d); return; }
        drawStrip(g, c, d);
        drawTree(c, d);
        drawTacho(g, c, d);
        drawBars(c, d);
        if (d.phase === 'result') drawResult(c, d);
      }
    });

    function advance(g) {
      var d = g.data;
      if (d.phase !== 'result') return;
      if (!d.result.win) {
        g.gameOver({
          emo: d.result.red ? '🟥' : '🏁',
          title: d.result.red ? 'Red light' : 'Beaten to the stripe',
          text: d.result.text + ' Ladder over after ' + d.wins + ' win' + (d.wins === 1 ? '' : 's') + '.',
          score: scoreOf(d)
        });
        return;
      }
      if (d.round + 1 >= LADDER.length) {
        g.win({
          emo: '🏆', title: 'Wally in the cabinet',
          text: 'Three rounds, three win lights. Best pass ' + d.bestTotal.toFixed(3) +
            ' including reaction.',
          score: scoreOf(d)
        });
        return;
      }
      d.round++;
      enterTune(g);
    }

    /* ------------------------------------------------------------- views */

    function drawTune(c, d) {
      c.fillStyle = '#0d1120'; c.fillRect(0, 0, W, H);
      c.textAlign = 'center';
      c.fillStyle = '#fff';
      c.font = 'bold 30px system-ui,sans-serif';
      c.fillText(LADDER[d.round].round + ' vs ' + LADDER[d.round].name, W / 2, 62);
      c.fillStyle = '#9fb0d8';
      c.font = '16px system-ui,sans-serif';
      c.fillText('They ran ' + LADDER[d.round].et.toFixed(2) + ' last time out on a ' +
        LADDER[d.round].rt.toFixed(2) + ' light.', W / 2, 90);

      var rows = [
        {
          label: 'Final drive', val: d.finalD.toFixed(2) + ':1',
          t: (d.finalD - 3.0) / 1.8,
          hint: 'Short gearing rips off the line but runs out of legs; tall gearing needs a clean launch.'
        },
        {
          label: 'Launch RPM', val: Math.round(d.launchRpm),
          t: (d.launchRpm - 2500) / 5000,
          hint: 'Too low and it bogs, too high and the tyres go up in smoke. The sweet spot moves with gearing.'
        }
      ];
      for (var i = 0; i < 2; i++) {
        var r = rows[i], y = 150 + i * 116;
        var sel = d.tuneRow === i;
        c.fillStyle = sel ? 'rgba(124,92,255,.22)' : 'rgba(255,255,255,.05)';
        U.roundRect(c, 110, y, W - 220, 96, 12); c.fill();
        if (sel) { c.strokeStyle = '#a78bfa'; c.lineWidth = 2; c.stroke(); }
        c.textAlign = 'left';
        c.fillStyle = '#dfe5ff'; c.font = 'bold 19px system-ui,sans-serif';
        c.fillText(r.label, 134, y + 32);
        c.textAlign = 'right';
        c.fillStyle = '#ffd257'; c.font = 'bold 26px system-ui,sans-serif';
        c.fillText(r.val, W - 134, y + 34);
        c.fillStyle = 'rgba(255,255,255,.14)';
        U.roundRect(c, 134, y + 46, W - 268, 10, 5); c.fill();
        c.fillStyle = sel ? '#a78bfa' : '#5b6488';
        U.roundRect(c, 134, y + 46, (W - 268) * U.clamp(r.t, 0, 1), 10, 5); c.fill();
        c.textAlign = 'left';
        c.fillStyle = '#8f9bc4'; c.font = '13px system-ui,sans-serif';
        c.fillText(r.hint, 134, y + 78);
      }
      c.textAlign = 'center';
      c.fillStyle = '#4ade80'; c.font = 'bold 18px system-ui,sans-serif';
      c.fillText('↑ ↓ pick a setting   ·   ← → change it   ·   Space to stage', W / 2, H - 46);
      if (d.log.length) {
        c.fillStyle = '#7d88ad'; c.font = '13px system-ui,sans-serif';
        var last = d.log[d.log.length - 1];
        c.fillText('Last pass: ' + last.et.toFixed(3) + ' on a ' + last.rt.toFixed(3) + ' light',
          W / 2, H - 20);
      }
      c.textAlign = 'left';
    }

    function drawStrip(g, c, d) {
      var live = d.phase === 'run' || d.phase === 'result';
      var camX = live ? d.x : 0;
      var ppm = 5.4;
      var sx = 170 - camX * ppm;
      c.fillStyle = '#12161f'; c.fillRect(0, 150, W, 250);
      // lanes
      c.fillStyle = '#1b2030'; c.fillRect(0, 168, W, 106);
      c.fillStyle = '#1b2030'; c.fillRect(0, 286, W, 106);
      c.fillStyle = '#2a3247'; c.fillRect(0, 274, W, 12);
      // distance markers
      c.font = '12px system-ui,sans-serif';
      for (var m = 0; m <= QUARTER; m += 30) {
        var mx = sx + m * ppm;
        if (mx < -40 || mx > W + 40) continue;
        c.fillStyle = m === 0 || m >= QUARTER ? '#ffd257' : 'rgba(255,255,255,.22)';
        c.fillRect(mx, 152, m % 60 === 0 ? 3 : 1, 248);
        if (m % 60 === 0) {
          c.fillStyle = 'rgba(255,255,255,.4)'; c.textAlign = 'center';
          c.fillText(m + 'm', mx, 146);
        }
      }
      // finish
      var fx = sx + QUARTER * ppm;
      if (fx > -30 && fx < W + 30) {
        for (var k = 0; k < 16; k++) {
          c.fillStyle = k % 2 ? '#fff' : '#111';
          c.fillRect(fx, 152 + k * 16, 10, 16);
        }
      }
      // smoke
      for (var i = 0; i < d.smoke.length; i++) {
        var s = d.smoke[i];
        c.globalAlpha = (s.t / s.max) * 0.42;
        c.fillStyle = '#d7dbe6';
        c.beginPath(); c.arc(sx + s.x * ppm, 330 + s.y, s.r, 0, TAU); c.fill();
      }
      c.globalAlpha = 1;

      drawCar(c, sx + (live ? d.oppX : 0) * ppm, 210, LADDER[d.round].col, false);
      drawCar(c, sx + (live ? d.x : 0) * ppm, 330, '#ff4f79', true);

      c.textAlign = 'left';
      c.fillStyle = '#9fb0d8'; c.font = '13px system-ui,sans-serif';
      c.fillText(LADDER[d.round].name, 16, 196);
      c.fillStyle = '#ff9db4';
      c.fillText('YOU', 16, 316);

      if (d.msg) {
        c.textAlign = 'center';
        c.fillStyle = '#ffd257'; c.font = 'bold 17px system-ui,sans-serif';
        c.fillText(d.msg, W / 2, 428);
        c.textAlign = 'left';
      }
    }

    function drawCar(c, x, y, col, mine) {
      c.save();
      c.translate(x, y);
      c.fillStyle = 'rgba(0,0,0,.45)';
      U.roundRect(c, -60, 16, 120, 12, 6); c.fill();
      c.fillStyle = '#14161f';
      c.beginPath(); c.arc(-40, 18, 15, 0, TAU); c.fill();
      c.beginPath(); c.arc(42, 18, 20, 0, TAU); c.fill();
      c.fillStyle = col;
      U.roundRect(c, -62, -16, 122, 34, 8); c.fill();
      U.roundRect(c, -18, -34, 52, 22, 6); c.fill();
      c.fillStyle = 'rgba(10,14,32,.75)';
      U.roundRect(c, -12, -30, 40, 16, 4); c.fill();
      c.fillStyle = '#2a3247';
      c.fillRect(-4, -46, 28, 14);     // blower / scoop
      if (mine) {
        c.fillStyle = 'rgba(255,255,255,.85)';
        c.fillRect(-66, -6, 6, 14);
      }
      c.restore();
    }

    function drawTree(c, d) {
      if (d.phase === 'result') return;
      var tx = W / 2 - 34, ty = 8;
      c.fillStyle = 'rgba(10,12,22,.85)';
      U.roundRect(c, tx, ty, 68, 126, 10); c.fill();
      function bulb(i, on, col) {
        c.beginPath();
        c.arc(tx + 34, ty + 18 + i * 22, 8.5, 0, TAU);
        c.fillStyle = on ? col : 'rgba(255,255,255,.1)';
        if (on) { c.shadowColor = col; c.shadowBlur = 14; }
        c.fill(); c.shadowBlur = 0;
      }
      var pre = d.phase === 'stage' || d.phase === 'run';
      bulb(0, pre && d.staged > 0.15, '#60a5fa');
      bulb(1, pre && d.staged >= 1, '#60a5fa');
      bulb(2, d.tree >= 0 && d.tree < 3, '#ffb020');
      bulb(3, d.tree >= 1 && d.tree < 3, '#ffb020');
      bulb(4, d.tree >= 2 && d.tree < 3, '#ffb020');
      bulb(5, d.tree === 3 || d.phase === 'run', d.foul ? '#ff3b3b' : '#22e07a');
    }

    function drawTacho(g, c, d) {
      var cx = 118, cy = H - 108, R = 86;
      c.save();
      c.fillStyle = 'rgba(8,10,20,.82)';
      c.beginPath(); c.arc(cx, cy, R + 12, 0, TAU); c.fill();
      // scale
      var a0 = Math.PI * 0.82, a1 = Math.PI * 2.18;
      c.lineWidth = 12;
      c.strokeStyle = 'rgba(255,255,255,.12)';
      c.beginPath(); c.arc(cx, cy, R, a0, a1); c.stroke();
      // launch band
      if (d.phase === 'stage' || d.phase === 'tune') {
        var b0 = a0 + (a1 - a0) * U.clamp((d.launchRpm - 420) / REDLINE, 0, 1);
        var b1 = a0 + (a1 - a0) * U.clamp((d.launchRpm + 420) / REDLINE, 0, 1);
        c.strokeStyle = '#22e07a';
        c.beginPath(); c.arc(cx, cy, R, b0, b1); c.stroke();
      }
      // redline
      c.strokeStyle = '#ff3b3b';
      c.beginPath(); c.arc(cx, cy, R, a0 + (a1 - a0) * (SHIFT_LIGHT / REDLINE), a1); c.stroke();
      // ticks
      c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2;
      c.font = '11px system-ui,sans-serif'; c.textAlign = 'center'; c.fillStyle = '#b9c3e6';
      for (var k = 0; k <= 9; k++) {
        var a = a0 + (a1 - a0) * (k / 9);
        c.beginPath();
        c.moveTo(cx + Math.cos(a) * (R - 10), cy + Math.sin(a) * (R - 10));
        c.lineTo(cx + Math.cos(a) * (R - 20), cy + Math.sin(a) * (R - 20));
        c.stroke();
        c.fillText(String(k), cx + Math.cos(a) * (R - 33), cy + Math.sin(a) * (R - 33) + 4);
      }
      // needle
      var na = a0 + (a1 - a0) * U.clamp(d.rpm / REDLINE, 0, 1);
      c.strokeStyle = d.rpm >= SHIFT_LIGHT ? '#ff3b3b' : '#ffd257';
      c.lineWidth = 4;
      c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(na) * (R - 14), cy + Math.sin(na) * (R - 14));
      c.stroke();
      c.fillStyle = '#ffd257';
      c.beginPath(); c.arc(cx, cy, 6, 0, TAU); c.fill();
      // shift light
      if (d.phase === 'run' && d.rpm >= SHIFT_LIGHT && d.gear < GEARS.length - 1) {
        c.fillStyle = (g.frame % 10 < 5) ? '#ff3b3b' : '#7a1020';
        U.roundRect(c, cx - 44, cy - R - 36, 88, 22, 6); c.fill();
        c.fillStyle = '#fff'; c.font = 'bold 14px system-ui,sans-serif';
        c.fillText('SHIFT!', cx, cy - R - 20);
      }
      c.fillStyle = '#fff'; c.font = 'bold 24px system-ui,sans-serif';
      c.fillText(d.phase === 'run' ? (d.gear + 1) + '' : '–', cx, cy + 44);
      c.fillStyle = '#8f9bc4'; c.font = '11px system-ui,sans-serif';
      c.fillText('GEAR', cx, cy + 60);
      c.restore();
      c.textAlign = 'left';
    }

    function drawBars(c, d) {
      var bx = 250, bw = W - 290, by = H - 150;
      c.fillStyle = 'rgba(255,255,255,.07)';
      U.roundRect(c, bx, by, bw, 18, 9); c.fill();
      U.roundRect(c, bx, by + 26, bw, 18, 9); c.fill();
      var runny = d.phase === 'run' || d.phase === 'result';
      var p1 = U.clamp((runny ? d.oppX : 0) / QUARTER, 0, 1);
      var p2 = U.clamp((runny ? d.x : 0) / QUARTER, 0, 1);
      c.fillStyle = LADDER[d.round].col;
      U.roundRect(c, bx, by, Math.max(6, bw * p1), 18, 9); c.fill();
      c.fillStyle = '#ff4f79';
      U.roundRect(c, bx, by + 26, Math.max(6, bw * p2), 18, 9); c.fill();
      c.fillStyle = '#8f9bc4'; c.font = '12px system-ui,sans-serif';
      c.fillText('402 m', bx + bw - 40, by - 6);
      c.fillStyle = '#dfe5ff'; c.font = 'bold 14px system-ui,sans-serif';
      c.fillText('Reaction ' + (d.phase === 'run' || d.phase === 'result' ? d.rt.toFixed(3) : '—') +
        '   Final drive ' + d.finalD.toFixed(2) + '   Launch ' + Math.round(d.launchRpm) + ' rpm',
        bx, by + 66);
    }

    function drawResult(c, d) {
      c.fillStyle = 'rgba(6,8,16,.86)';
      U.roundRect(c, 80, 140, W - 160, 250, 16); c.fill();
      c.textAlign = 'center';
      c.fillStyle = d.result.win ? '#4ade80' : '#fb7185';
      c.font = 'bold 40px system-ui,sans-serif';
      c.fillText(d.result.red ? 'RED LIGHT' : (d.result.win ? 'WIN LIGHT' : 'LOSS'), W / 2, 200);
      c.fillStyle = '#dfe5ff'; c.font = '16px system-ui,sans-serif';
      var words = d.result.text.split(' '), line = '', y = 244;
      for (var i = 0; i < words.length; i++) {
        var test = line + words[i] + ' ';
        if (c.measureText(test).width > W - 220) { c.fillText(line, W / 2, y); line = words[i] + ' '; y += 24; }
        else line = test;
      }
      c.fillText(line, W / 2, y);
      c.fillStyle = '#ffd257'; c.font = 'bold 16px system-ui,sans-serif';
      c.fillText('Space / tap to continue', W / 2, 362);
      c.textAlign = 'left';
    }
  }

  window.Milo.register({
    id: 'drag-racer', title: 'Drag Racer', emo: '🏁', category: 'Racing',
    tagline: 'Launch, light, shift — no corners',
    description: 'A racing game with no steering in it at all: 402 metres, and everything ' +
      'is decided in the first half second and at four shift points. Pick a final drive and a ' +
      'launch rpm, hold the motor in the green band to stage, then cut the tree — go before ' +
      'the green and you red-light out on the spot. Short gearing spins the tyres, tall gearing ' +
      'bogs, and the needle tells you when to pull the next gear: short-shift and you drop off ' +
      'the cam, hang on and the limiter cuts power. Three rounds of a bracket ladder, each ' +
      'opponent quicker than the last.',
    controls: ['← → tune', 'Space rev', '↑ launch / shift'],
    colors: ['#ff4f79', '#ffd257'],
    tags: ['drag', 'racing', 'timing', 'reaction', 'gears'],
    scoreLabel: 'pts',
    mount: mount
  });
})();
