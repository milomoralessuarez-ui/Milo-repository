/* Batting Cage — read the windup, meet the ball, aim for the lights. */
(function () {
  'use strict';
  var W = 800, H = 560, TAU = Math.PI * 2;
  var PITCHES = 10, FENCE = 340;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    // Pseudo-3D: x in [-1,1] across the plate, y in "strike-zone units",
    // z from 0 (the plate) to 1 (the mound).
    function halfW(z) { return U.lerp(300, 62, z); }
    function PX(x, z) { return W / 2 + x * halfW(z); }
    function PY(y, z) { return U.lerp(492, 302, z) - y * U.lerp(300, 74, z); }

    var TYPES = [
      { name: 'FASTBALL', wind: .55, T: .78, curve: 0, sink: 0 },
      { name: 'CURVEBALL', wind: .95, T: 1.0, curve: .9, sink: .18 },
      { name: 'CHANGE-UP', wind: 1.35, T: 1.18, curve: .25, sink: .3 }
    ];

    function reset(g) {
      var d = g.data;
      d.round = 1;
      d.pitch = 0;
      d.hr = 0; d.hrRound = 0;
      d.totalFt = 0;
      d.phase = 'ready';       // ready | windup | fly | hit | result
      d.phaseT = 1.2;
      d.type = null;
      d.ball = null;
      d.fly = null;
      d.swingT = 0;
      d.swung = false;
      d.batX = 0; d.batY = .45;
      d.msg = 'Round 1 — ' + PITCHES + ' pitches. 2 homers moves you on.';
      d.result = '';
      d.parts = [];
      d.fireworks = [];
      d.flash = 0;
      g.set('Score', 0);
      g.set('HR', 0);
      g.set('Pitch', '1/' + PITCHES);
    }

    function startWindup(g) {
      var d = g.data;
      d.pitch++;
      g.set('Pitch', Math.min(d.pitch, PITCHES) + '/' + PITCHES);
      var pool = d.round === 1 ? [0, 0, 1, 2] : [0, 1, 2];
      d.type = TYPES[U.choice(pool)];
      d.phase = 'windup';
      d.phaseT = 0;
      d.windDur = d.type.wind + U.rand(-.05, .05);
      d.swung = false;
      d.result = '';
    }

    function throwBall(g) {
      var d = g.data, ty = d.type;
      var speedUp = 1 + (d.round - 1) * .09;
      var curve = ty.curve * (d.round >= 2 ? 1 : .7) * (Math.random() < .5 ? -1 : 1);
      d.ball = {
        z: 1, t: 0,
        T: ty.T / speedUp,
        x0: U.rand(-.25, .25), x1: U.rand(-.3, .3),
        y0: 1.05, y1: U.rand(.25, .68) - ty.sink * (d.round > 2 ? 1.4 : 1),
        curve: curve
      };
      d.phase = 'fly';
      Milo.sound.tone({ f: 300, f2: 180, d: .1, v: .06, type: 'triangle' });
    }

    function ballPos(b) {
      var t = U.clamp(b.t / b.T, 0, 1);
      return {
        x: U.lerp(b.x0, b.x1, t) + b.curve * Math.sin(Math.PI * t) * .5,
        y: U.lerp(b.y0, b.y1, t) - Math.sin(Math.PI * t) * .12,
        z: 1 - t
      };
    }

    function settle(g, txt, col) {
      var d = g.data;
      d.result = txt;
      d.resultCol = col || '#e8ecff';
      d.phase = 'result';
      d.phaseT = 1.15;
      d.ball = null;
    }

    function contact(g) {
      var d = g.data, b = d.ball;
      var p = ballPos(b);
      // Timing: ideal contact just in front of the plate.
      var timing = (b.t / b.T) - .92;
      var dx = p.x - d.batX, dy = p.y - d.batY;
      var reach = Math.hypot(dx * 1.1, dy);
      if (reach > .42 || timing < -.16) {
        // Clean whiff.
        Milo.sound.tone({ f: 180, f2: 120, d: .14, v: .09, type: 'sawtooth' });
        d.whiffT = .3;
        return;
      }
      var q = (1 - Math.abs(timing) / .16) * (1 - reach / .42);
      // Bat angle: best contact is the bat a touch under the ball.
      var under = dy;                        // >0 means bat under the ball
      var launch = U.clamp(.55 + under * 2.6, 0, 1.35);
      var ft, kind, col;
      if (launch < .22) {
        ft = Math.round(40 + q * 90); kind = 'Chopped into the dirt'; col = '#9aa3d0';
      } else if (launch > 1.12) {
        ft = Math.round(60 + q * 110); kind = 'Popped straight up'; col = '#9aa3d0';
      } else {
        var sweet = 1 - Math.abs(launch - .72) / .55;
        ft = Math.round(90 + q * sweet * 390 + U.rand(0, 18));
        kind = ft >= FENCE ? 'HOME RUN!' : ft >= 260 ? 'Deep drive' : ft >= 150 ? 'Line drive' : 'Soft liner';
        col = ft >= FENCE ? '#ffd257' : ft >= 260 ? '#4ade80' : '#e8ecff';
      }
      var pts = ft + (ft >= FENCE ? 150 : 0) + (ft >= 430 ? 300 : 0);
      g.score += pts;
      d.totalFt += ft;
      g.set('Score', U.fmt(g.score));
      if (ft >= FENCE) {
        d.hr++; d.hrRound++;
        g.set('HR', d.hr);
        d.flash = .28;
        Milo.sound.explode();
        for (var i = 0; i < 22; i++) {
          var a2 = Math.random() * TAU, s2 = U.rand(50, 200);
          d.fireworks.push({
            x: PX(p.x, .9) + U.rand(-60, 60), y: 120 + U.rand(-40, 30),
            vx: Math.cos(a2) * s2, vy: Math.sin(a2) * s2, t: U.rand(.5, 1), max: 1,
            col: U.choice(['#ffd257', '#fb7185', '#22d3ee', '#a78bfa', '#4ade80'])
          });
        }
      } else {
        Milo.sound.tone({ f: 700 + q * 500, f2: 200, d: .12, v: .14, type: 'square' });
        Milo.sound.noise(.08, .1, 3000);
      }
      // Send the ball flying out toward the field.
      d.fly = {
        x: p.x, y: p.y, z: .06, t: 0,
        dur: .8 + ft / 460,
        dx: U.clamp(dx * -3 + U.rand(-.3, .3), -1.4, 1.4),
        ft: ft, kind: kind, col: col, pts: pts,
        arc: launch
      };
      d.phase = 'hit';
      d.ball = null;
    }

    function endRound(g) {
      var d = g.data;
      if (d.hrRound >= 2) {
        d.round++;
        d.pitch = 0;
        d.hrRound = 0;
        d.phase = 'ready';
        d.phaseT = 2.4;
        d.msg = 'Round ' + d.round + ' — pitching gets ' + (d.round > 2 ? 'nasty' : 'quicker') + '.';
        Milo.sound.powerup();
      } else {
        g.gameOver({
          emo: '⚾',
          title: d.hr === 0 ? 'No homers today' : d.hr + ' homer' + (d.hr === 1 ? '' : 's') + '!',
          text: U.fmt(d.totalFt) + ' total feet across ' + (d.round * PITCHES) + ' pitches. ' +
            'Two home runs in a round keeps the cage open.',
          score: g.score
        });
      }
    }

    return Milo.arcade(host, {
      id: 'batting-cage',
      w: W, h: H, bg: '#101b2e',
      stats: ['Score', 'HR', 'Pitch'],
      emo: '⚾',
      start: {
        title: 'Batting Cage',
        text: 'Ten pitches under the lights. The windup is the tell — quick means ' +
          'fastball, a long pause means change-up, a high kick means curve. Move the ' +
          'bat with the mouse, click to swing, and catch the ball just under its ' +
          'middle to send it over the ' + FENCE + ' ft sign.',
        keys: ['Mouse to aim', 'Click / Space swing']
      },
      init: reset,

      onPointer: function (g, type) {
        if (type === 'down' && g.state === 'play') swing(g);
      },
      onKey: function (g, e) {
        if (e.code === 'Space' || e.code === 'Enter') swing(g);
      },

      update: function (g, dt) {
        var d = g.data;

        d.batX = U.clamp((g.input.px - W / 2) / 300, -.9, .9);
        d.batY = U.clamp((492 - g.input.py) / 300, .05, 1.05);
        if (d.swingT > 0) d.swingT -= dt;
        if (d.whiffT > 0) d.whiffT -= dt;
        if (d.flash > 0) d.flash -= dt;

        if (d.phase === 'ready') {
          d.phaseT -= dt;
          if (d.phaseT <= 0) startWindup(g);
        } else if (d.phase === 'windup') {
          d.phaseT += dt;
          if (d.phaseT >= d.windDur) throwBall(g);
        } else if (d.phase === 'fly') {
          var b = d.ball;
          b.t += dt;
          if (b.t >= b.T + .06) {
            settle(g, d.swung ? 'Strike — swung through it' : 'Taken. Swing the bat!', '#fb7185');
            Milo.sound.tone({ f: 220, f2: 140, d: .12, v: .08, type: 'triangle' });
          }
        } else if (d.phase === 'hit') {
          var f = d.fly;
          f.t += dt;
          var ht = f.t / f.dur;
          if (ht >= 1) {
            settle(g, f.kind + ' — ' + f.ft + ' ft  (+' + U.fmt(f.pts) + ')', f.col);
          }
        } else if (d.phase === 'result') {
          d.phaseT -= dt;
          if (d.phaseT <= 0) {
            if (d.pitch >= PITCHES) endRound(g);
            else { d.phase = 'ready'; d.phaseT = .35; }
          }
        }

        for (var i = d.fireworks.length - 1; i >= 0; i--) {
          var p = d.fireworks[i];
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; p.t -= dt;
          if (p.t <= 0) d.fireworks.splice(i, 1);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;

        // Night sky + floodlit field.
        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#0a1222');
        sky.addColorStop(.5, '#16233c');
        sky.addColorStop(.52, '#1e4d33');
        sky.addColorStop(1, '#2c6a43');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);

        // Light towers.
        [[120, 46], [680, 46]].forEach(function (t) {
          c.strokeStyle = '#2c3752'; c.lineWidth = 6;
          c.beginPath(); c.moveTo(t[0], t[1] + 30); c.lineTo(t[0], 250); c.stroke();
          c.fillStyle = '#39456b';
          U.roundRect(c, t[0] - 34, t[1], 68, 30, 6); c.fill();
          for (var lx = 0; lx < 4; lx++) {
            for (var ly = 0; ly < 2; ly++) {
              c.fillStyle = '#fff7d6';
              c.beginPath(); c.arc(t[0] - 24 + lx * 16, t[1] + 8 + ly * 14, 4.6, 0, TAU); c.fill();
            }
          }
          var glow = c.createRadialGradient(t[0], t[1] + 15, 10, t[0], t[1] + 15, 190);
          glow.addColorStop(0, 'rgba(255,247,214,.20)');
          glow.addColorStop(1, 'rgba(255,247,214,0)');
          c.fillStyle = glow;
          c.beginPath(); c.arc(t[0], t[1] + 15, 190, 0, TAU); c.fill();
        });

        // Outfield fence with distance signs.
        c.fillStyle = '#173a5c';
        c.fillRect(0, 268, W, 24);
        c.fillStyle = '#0f2c47';
        c.fillRect(0, 288, W, 6);
        c.font = '800 12px Outfit, sans-serif'; c.textAlign = 'center';
        [[190, '340'], [400, '410'], [610, '340']].forEach(function (s) {
          c.fillStyle = '#ffd257';
          c.fillText(s[1], s[0], 285);
        });
        // Crowd dots above the fence.
        for (var cd = 0; cd < 90; cd++) {
          var cx2 = (cd * 61) % W, cy2 = 240 + (cd * 37) % 24;
          c.fillStyle = 'hsl(' + ((cd * 47) % 360) + ',36%,' + (44 + (cd % 3) * 8) + '%)';
          c.beginPath(); c.arc(cx2, cy2, 3, 0, TAU); c.fill();
        }

        // Infield dirt wedge + mound.
        c.fillStyle = '#7a5638';
        c.beginPath();
        c.moveTo(W / 2 - 320, 512);
        c.quadraticCurveTo(W / 2, 236, W / 2 + 320, 512);
        c.closePath(); c.fill();
        c.fillStyle = '#8a6342';
        c.beginPath(); c.ellipse(W / 2, PY(0, 1) + 12, 56, 16, 0, 0, TAU); c.fill();
        // Foul lines.
        c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(W / 2, 500); c.lineTo(70, 280); c.stroke();
        c.beginPath(); c.moveTo(W / 2, 500); c.lineTo(W - 70, 280); c.stroke();
        // Plate.
        c.fillStyle = '#e8ecff';
        c.beginPath();
        c.moveTo(W / 2 - 26, 500); c.lineTo(W / 2 + 26, 500);
        c.lineTo(W / 2 + 18, 514); c.lineTo(W / 2, 522); c.lineTo(W / 2 - 18, 514);
        c.closePath(); c.fill();

        // Pitcher (windup pose driven by phase).
        var wind = d.phase === 'windup' ? U.clamp(d.phaseT / d.windDur, 0, 1) : 0;
        var px3 = PX(0, 1), py3 = PY(0, 1);
        var kick = d.phase === 'windup' ? Math.sin(wind * Math.PI) * (d.type && d.type.name === 'CURVEBALL' ? 16 : 8) : 0;
        var lean = d.phase === 'windup' ? Math.sin(wind * Math.PI) * (d.type && d.type.name === 'CHANGE-UP' ? -.35 : -.18) : 0;
        c.save();
        c.translate(px3, py3);
        c.rotate(lean);
        c.fillStyle = '#c9d2e8';
        U.roundRect(c, -11, -46, 22, 30, 8); c.fill();     // jersey
        c.fillStyle = '#31427a';
        U.roundRect(c, -10, -18, 20, 16, 5); c.fill();      // pants
        c.strokeStyle = '#31427a'; c.lineWidth = 5; c.lineCap = 'round';
        c.beginPath(); c.moveTo(-6, -4); c.lineTo(-8 - kick * .4, 10); c.stroke();
        c.beginPath(); c.moveTo(6, -4); c.lineTo(4, 10 - kick); c.stroke();
        // Throwing arm rises with the windup.
        c.strokeStyle = '#c9d2e8'; c.lineWidth = 5;
        c.beginPath();
        c.moveTo(8, -38);
        c.lineTo(8 + Math.cos(-.6 - wind * 2.2) * 16, -38 + Math.sin(-.6 - wind * 2.2) * 16);
        c.stroke();
        c.fillStyle = '#f4cba4';
        c.beginPath(); c.arc(0, -54, 9, 0, TAU); c.fill();  // head
        c.fillStyle = '#31427a';
        c.beginPath(); c.arc(0, -57, 9, Math.PI, TAU); c.fill();
        c.restore();

        // Strike zone.
        var zx0 = PX(-.35, .05), zx1 = PX(.35, .05);
        var zy0 = PY(.75, .05), zy1 = PY(.15, .05);
        c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 2;
        c.setLineDash([6, 6]);
        c.strokeRect(zx0, zy0, zx1 - zx0, zy1 - zy0);
        c.setLineDash([]);

        // Incoming ball (with curve shadow trail).
        if (d.ball) {
          var p = ballPos(d.ball);
          for (var tr = 1; tr <= 4; tr++) {
            var bt = Math.max(0, d.ball.t - tr * .035);
            var pp = ballPos({ t: bt, T: d.ball.T, x0: d.ball.x0, x1: d.ball.x1, y0: d.ball.y0, y1: d.ball.y1, curve: d.ball.curve });
            c.globalAlpha = .3 - tr * .06;
            c.fillStyle = '#fff';
            c.beginPath(); c.arc(PX(pp.x, pp.z), PY(pp.y, pp.z), U.lerp(13, 4, pp.z), 0, TAU); c.fill();
          }
          c.globalAlpha = 1;
          var r = U.lerp(13, 4, p.z);
          c.fillStyle = '#fffdf2';
          c.beginPath(); c.arc(PX(p.x, p.z), PY(p.y, p.z), r, 0, TAU); c.fill();
          c.strokeStyle = '#d64545'; c.lineWidth = 1.6;
          c.beginPath(); c.arc(PX(p.x, p.z), PY(p.y, p.z), r * .6, .5, 2.4); c.stroke();
          c.beginPath(); c.arc(PX(p.x, p.z), PY(p.y, p.z), r * .6, 3.6, 5.5); c.stroke();
        }

        // Ball flying out after a hit.
        if (d.phase === 'hit' && d.fly) {
          var f = d.fly;
          var ht = U.clamp(f.t / f.dur, 0, 1);
          var fz = .06 + ht * .97;
          var fx = f.x + f.dx * ht;
          var fy = f.y + Math.sin(Math.PI * ht) * f.arc * 2.2 + ht * .2;
          c.fillStyle = '#fffdf2';
          c.beginPath();
          c.arc(PX(fx, fz), PY(fy, fz), Math.max(2.4, U.lerp(12, 2.4, fz)), 0, TAU);
          c.fill();
          if (f.ft >= FENCE) {
            c.fillStyle = 'rgba(255,210,87,.5)';
            c.beginPath();
            c.arc(PX(fx, fz), PY(fy, fz), Math.max(4, U.lerp(18, 4, fz)), 0, TAU);
            c.fill();
          }
        }

        // The bat cursor — barrel follows the mouse.
        var bx2 = PX(d.batX, .03), by2 = PY(d.batY, .03);
        var swingA = d.swingT > 0 ? (1 - d.swingT / .22) * 2.4 : 0;
        c.save();
        c.translate(bx2, by2);
        c.rotate(-.7 + swingA);
        c.fillStyle = 'rgba(0,0,0,.3)';
        U.roundRect(c, -6, -4, 74, 12, 6); c.fill();
        var wood = c.createLinearGradient(0, 0, 70, 0);
        wood.addColorStop(0, '#8a5a2e');
        wood.addColorStop(1, '#d8a05c');
        c.fillStyle = wood;
        U.roundRect(c, -8, -6, 76, 12, 6); c.fill();
        c.fillStyle = '#3a2c1c';
        U.roundRect(c, -14, -5, 10, 10, 4); c.fill();
        c.restore();
        if (d.whiffT > 0) {
          c.fillStyle = '#fb7185';
          c.font = '800 15px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText('whiff!', bx2, by2 - 26);
        }

        // Fireworks.
        d.fireworks.forEach(function (p2) {
          c.globalAlpha = Math.max(0, p2.t / p2.max);
          c.fillStyle = p2.col;
          c.fillRect(p2.x - 2.5, p2.y - 2.5, 5, 5);
        });
        c.globalAlpha = 1;
        if (d.flash > 0) {
          c.fillStyle = 'rgba(255,244,200,' + (d.flash * .8) + ')';
          c.fillRect(0, 0, W, H);
        }

        // Messages.
        c.textAlign = 'center';
        if (d.phase === 'windup' && d.phaseT > .12) {
          c.fillStyle = 'rgba(232,236,255,.55)';
          c.font = '700 13px Outfit, sans-serif';
          c.fillText('· · · windup · · ·', W / 2, 88);
        }
        if (d.result) {
          c.fillStyle = d.resultCol || '#e8ecff';
          c.font = '800 22px Outfit, sans-serif';
          c.fillText(d.result, W / 2, 88);
        } else if (d.phase === 'ready' && d.msg) {
          c.fillStyle = '#e8ecff';
          c.font = '800 18px Outfit, sans-serif';
          c.fillText(d.msg, W / 2, 88);
        }
        if (d.phase === 'hit' && d.fly) {
          c.fillStyle = '#ffd257';
          c.font = '800 30px Outfit, sans-serif';
          c.fillText(Math.round(d.fly.ft * U.clamp(d.fly.t / d.fly.dur, 0, 1)) + ' ft', W / 2, 130);
        }
        // Round + HR-this-round tracker.
        c.fillStyle = 'rgba(232,236,255,.6)';
        c.font = '700 13px Outfit, sans-serif';
        c.textAlign = 'left';
        c.fillText('ROUND ' + d.round + '   HR this round: ' + d.hrRound + '/2', 18, H - 16);
      }
    });

    function swing(g) {
      var d = g.data;
      if (d.swingT > 0) return;
      d.swingT = .22;
      d.swung = true;
      Milo.sound.tone({ f: 240, f2: 420, d: .08, v: .05, type: 'triangle' });
      if (d.phase === 'fly' && d.ball) contact(g);
    }
  }

  window.Milo.register({
    id: 'batting-cage', title: 'Batting Cage', emo: '⚾', category: 'Sports',
    tagline: 'Read the windup, clear the fence',
    description: 'Home-run derby under the floodlights, ten pitches a round. The windup ' +
      'telegraphs what is coming — a quick arm is a fastball, a long pause is a ' +
      'change-up, a high leg kick means the ball will break sideways. Your mouse is the ' +
      'barrel: distance comes from swing timing plus bat height, and catching the ball ' +
      'just below its middle is what clears the 340 ft sign. Two homers in a round earns ' +
      'ten more pitches at higher speed.',
    controls: ['Mouse to aim', 'Click / Space swing'],
    colors: ['#16233c', '#ffd257'],
    tags: ['baseball', 'timing', 'home run', 'derby', 'batting'],
    mount: mount
  });
})();
