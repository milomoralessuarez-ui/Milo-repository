/* Snowboard Halfpipe — pump the transition, spin the air, land it facing somewhere. */
(function () {
  'use strict';

  var W = 820, H = 540;
  var CX = 410, PIPE_HW = 300, BOTTOM = 430, WALL = 250;
  var FLAT = .26;                 // fraction of the pipe that is flat bottom
  var GA = 2.4;                   // gravity in pipe units
  var HITS = 6;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    // Pipe profile: flat in the middle, quadratic transition up to the lip.
    function hOf(u) {
      var a = Math.abs(u);
      if (a <= FLAT) return 0;
      var t = (a - FLAT) / (1 - FLAT);
      return t * t;
    }
    function slopeOf(u) {
      var a = Math.abs(u);
      if (a <= FLAT) return 0;
      var t = (a - FLAT) / (1 - FLAT);
      return 2 * t / (1 - FLAT) * (u < 0 ? -1 : 1);
    }
    function pipeX(u) { return CX + u * PIPE_HW; }
    function pipeY(u) { return BOTTOM - hOf(u) * WALL; }

    function reset(g) {
      var d = g.data;
      d.u = -.08; d.vu = 1.25;
      d.air = null;
      d.hit = 0;
      d.total = 0;
      d.crashes = 0;
      d.rot = 0;
      d.grab = 0; d.grabbing = false;
      d.board = 0;
      d.progress = 0;
      d.phase = 'ride';
      d.msg = 'Pump in the flat, launch at the lip';
      d.msgT = 2.4;
      d.pops = [];
      d.last = null;
      d.snow = [];
      d.tap = false;
      d.pumpCool = 0;
      d.shake = 0;
      for (var i = 0; i < 40; i++) {
        d.snow.push({ x: Math.random() * W, y: Math.random() * H, v: U.rand(20, 70) });
      }
      g.set('Hit', '0/' + HITS);
      g.set('Judges', 0);
      g.set('Air', '0 ft');
    }

    function say(d, t, time) { d.msg = t; d.msgT = time || 1.3; }

    function pop(d, x, y, text, col) {
      d.pops.push({ x: x, y: y, t: 1.3, text: text, col: col });
    }

    function judged(d) {
      return Math.min(100, Math.round(d.total / 3.8));
    }

    function launch(g, dir) {
      var d = g.data;
      var over = Math.max(0, .5 * d.vu * d.vu / GA);     // energy above the lip
      var amp = Math.min(2.2, over);
      d.air = {
        dir: dir, t: 0,
        T: .42 + amp * 1.5,
        amp: amp,
        ft: amp * 13 + 1.5,
        lipX: pipeX(dir), lipY: pipeY(dir),
        speed: Math.abs(d.vu)
      };
      d.rot = 0; d.grab = 0; d.grabbing = false;
      d.phase = 'air';
      g.set('Air', d.air.ft.toFixed(1) + ' ft');
      Milo.sound.tone({ f: 300, f2: 700, d: .16, v: .08, type: 'triangle' });
    }

    function landing(g) {
      var d = g.data, a = d.air;
      var spins = Math.abs(d.rot) / 180;
      var off = Math.abs(d.rot % 180);
      if (off > 90) off = 180 - off;
      // The window closes as the run goes on — the judges want it stomped.
      var tol = 46 - d.hit * 4;
      var clean = off <= tol && !d.grabbing;
      var pts = 0;
      if (clean) {
        pts = a.ft * 1.7 + Math.floor(spins) * 13 + Math.min(1.4, d.grab) * 11;
        if (off < 14) pts += 6;
        d.total += pts;
        pop(d, a.lipX, a.lipY - 60, '+' + Math.round(pts), '#4ade80');
        var name = Math.floor(spins) >= 1 ? (Math.floor(spins) * 180) + '°' : 'straight air';
        say(d, name + (d.grab > .35 ? ' with a grab' : '') + ' — stomped', 1.2);
        Milo.sound.coin();
        d.vu = a.speed * .93;
      } else {
        d.crashes++;
        pop(d, a.lipX, a.lipY - 40, d.grabbing ? 'STILL GRABBING' : 'SKETCHY', '#fb7185');
        say(d, d.grabbing ? 'Let go of the grab before you land!' : 'Not facing the landing — washed out', 1.5);
        Milo.sound.hit();
        d.shake = 10;
        d.vu = a.speed * .42;
      }
      g.set('Judges', judged(d));
      g.score = Math.round(d.total);
      d.hit++;
      g.set('Hit', Math.min(d.hit, HITS) + '/' + HITS);
      d.u = a.dir * .985;
      d.vu *= (a.dir > 0 ? -1 : 1);
      if (a.dir > 0 && d.vu > 0) d.vu = -d.vu;
      if (a.dir < 0 && d.vu < 0) d.vu = -d.vu;
      d.air = null;
      d.rot = 0; d.grab = 0; d.grabbing = false;
      d.phase = 'ride';
      d.progress = d.hit / HITS;

      if (d.crashes >= 3) { finish(g, true); return; }
      if (d.hit >= HITS) finish(g, false);
    }

    function finish(g, bailed) {
      var d = g.data;
      var j = judged(d);
      var sc = Math.round(d.total);
      g.score = sc;
      var txt = 'Judges: ' + j + '/100 over ' + d.hit + ' hits, ' + d.crashes + ' crash' +
        (d.crashes === 1 ? '' : 'es') + '.';
      if (bailed) {
        g.gameOver({ emo: '🏂', title: 'Run over — three crashes', text: txt, score: sc });
      } else if (j >= 75) {
        g.win({ emo: '🏂', title: 'Podium run — ' + j + '/100', text: txt, score: sc });
      } else {
        g.gameOver({ emo: '🏂', title: 'Run scored ' + j + '/100', text: txt + ' 75 gets you on the podium.', score: sc });
      }
    }

    /* --------------------------------------------------------------- draw */

    function drawRider(c, x, y, rot, grabbing, tilt) {
      c.save();
      c.translate(x, y);
      c.rotate(rot * Math.PI / 180 + tilt);
      c.strokeStyle = '#f97316'; c.lineWidth = 6; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-17, 12); c.lineTo(17, 12); c.stroke();   // board
      c.fillStyle = '#facc15';
      c.fillRect(-5, 8, 4, 5); c.fillRect(2, 8, 4, 5);
      c.fillStyle = '#22d3ee';
      U.roundRect(c, -7, -16, 14, 26, 6); c.fill();
      c.fillStyle = '#f1f5f9';
      c.beginPath(); c.arc(0, -22, 8, 0, 7); c.fill();
      c.strokeStyle = '#22d3ee'; c.lineWidth = 4;
      if (grabbing) {
        c.beginPath(); c.moveTo(0, -8); c.lineTo(-12, 10); c.stroke();
      } else {
        c.beginPath(); c.moveTo(0, -10); c.lineTo(-15, -20); c.stroke();
        c.beginPath(); c.moveTo(0, -8); c.lineTo(14, -18); c.stroke();
      }
      c.restore();
    }

    return Milo.arcade(host, {
      id: 'snowboard-pipe',
      w: W, h: H, bg: '#0b1626',
      stats: ['Hit', 'Judges', 'Air'],
      emo: '🏂',
      touchButtons: [
        { key: 'left', label: '◀ SPIN' }, { key: 'right', label: 'SPIN ▶' },
        { key: 'action', label: 'PUMP / GRAB' }
      ],
      start: {
        title: 'Snowboard Halfpipe',
        text: 'Ride wall to wall. Tap Space through the flat bottom to pump speed into the ' +
          'transition — that speed is your air. Off the lip, hold ← or → to spin and hold ' +
          'Space to grab, then let go of the grab and stop the spin near a half-turn or you ' +
          'wash out on the landing. Six hits down the pipe, judged out of 100, and the ' +
          'landing window tightens every hit.',
        keys: ['← →  carve / spin', 'Space  pump / grab']
      },
      init: reset,

      onPointer: function (g, type) { if (type === 'down') g.data.tap = true; },

      update: function (g, dt) {
        var d = g.data, k = g.input, i;
        var tap = k.pressed('action') || d.tap;
        d.tap = false;
        if (d.msgT > 0) d.msgT -= dt;
        if (d.pumpCool > 0) d.pumpCool -= dt;
        if (d.shake > 0) d.shake = Math.max(0, d.shake - dt * 30);
        for (i = d.pops.length - 1; i >= 0; i--) {
          d.pops[i].t -= dt; d.pops[i].y -= 26 * dt;
          if (d.pops[i].t <= 0) d.pops.splice(i, 1);
        }
        for (i = 0; i < d.snow.length; i++) {
          var s = d.snow[i];
          s.y += s.v * dt; s.x -= s.v * .3 * dt;
          if (s.y > H) { s.y = -6; s.x = Math.random() * W; }
        }

        if (d.phase === 'air') {
          var a = d.air;
          a.t += dt;
          var spin = (k.down('left') ? -1 : 0) + (k.down('right') ? 1 : 0);
          d.rot += spin * 330 * dt;
          if (k.down('action')) { d.grabbing = true; d.grab += dt; }
          else d.grabbing = false;
          if (a.t >= a.T) landing(g);
          return;
        }

        if (d.phase !== 'ride') return;

        // Pumping in the flat bottom is the only way to add energy.
        if (tap && d.pumpCool <= 0) {
          if (Math.abs(d.u) < .45) {
            d.vu *= 1.17;
            d.pumpCool = .22;
            Milo.sound.tone({ f: 200 + Math.abs(d.vu) * 90, d: .06, v: .06, type: 'square' });
            pop(d, pipeX(d.u), BOTTOM - 30, 'PUMP', '#38bdf8');
          } else {
            d.pumpCool = .18;
            Milo.sound.tone({ f: 140, d: .05, v: .04, type: 'triangle' });
          }
        }
        // Carving up the wall a little with the steering keys.
        var carve = (k.down('right') ? 1 : 0) - (k.down('left') ? 1 : 0);
        d.vu += carve * .55 * dt;

        d.vu -= GA * slopeOf(d.u) * dt;
        d.vu -= d.vu * .13 * dt;
        d.u += d.vu * dt;
        d.board = U.clamp(d.vu * .3, -.9, .9);

        if (Math.abs(d.u) >= 1) {
          var dir = d.u > 0 ? 1 : -1;
          if (d.vu * dir > 0) { d.u = dir; launch(g, dir); return; }
          d.u = dir * .999;
        }
        d.progress = Math.min(1, (d.hit + U.clamp(Math.abs(d.u), 0, 1) * .5) / HITS);
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, i, u;

        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#12304f'); sky.addColorStop(.6, '#2b5d86'); sky.addColorStop(1, '#0e1c2c');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);

        // distant peaks
        c.fillStyle = 'rgba(226,240,255,.16)';
        for (i = 0; i < 5; i++) {
          var mx = i * 210 - 40;
          c.beginPath();
          c.moveTo(mx, 210); c.lineTo(mx + 105, 78); c.lineTo(mx + 210, 210);
          c.closePath(); c.fill();
        }
        for (i = 0; i < d.snow.length; i++) {
          c.fillStyle = 'rgba(255,255,255,.5)';
          c.fillRect(d.snow[i].x, d.snow[i].y, 2, 2);
        }

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        // pipe
        c.beginPath();
        c.moveTo(pipeX(-1), pipeY(-1));
        for (u = -1; u <= 1.0001; u += .02) c.lineTo(pipeX(u), pipeY(u));
        c.lineTo(pipeX(1) + 60, pipeY(1));
        c.lineTo(pipeX(1) + 60, H); c.lineTo(pipeX(-1) - 60, H);
        c.lineTo(pipeX(-1) - 60, pipeY(-1));
        c.closePath();
        var snowg = c.createLinearGradient(0, BOTTOM - WALL, 0, H);
        snowg.addColorStop(0, '#e8f2ff'); snowg.addColorStop(1, '#9db6d0');
        c.fillStyle = snowg; c.fill();
        // transition shading lines
        c.strokeStyle = 'rgba(120,150,190,.35)'; c.lineWidth = 1;
        for (i = 1; i < 8; i++) {
          c.beginPath();
          for (u = -1; u <= 1.0001; u += .04) {
            var yy = pipeY(u) + i * 9 + hOf(u) * 12;
            if (u === -1) c.moveTo(pipeX(u), yy); else c.lineTo(pipeX(u), yy);
          }
          c.stroke();
        }
        // coping
        c.fillStyle = '#e2e8f0';
        c.fillRect(pipeX(-1) - 10, pipeY(-1) - 6, 22, 7);
        c.fillRect(pipeX(1) - 12, pipeY(1) - 6, 22, 7);

        // rider
        if (d.phase === 'air' && d.air) {
          var a = d.air;
          var t = a.t / a.T;
          var h = 4 * t * (1 - t);
          var rx = a.lipX + a.dir * (18 + Math.sin(t * Math.PI) * 26);
          var ry = a.lipY - Math.min(h * a.ft * 9, 152);
          // air-height guide
          c.strokeStyle = 'rgba(255,255,255,.25)';
          c.setLineDash([4, 6]); c.lineWidth = 1;
          c.beginPath(); c.moveTo(a.lipX, a.lipY); c.lineTo(rx, ry); c.stroke();
          c.setLineDash([]);
          drawRider(c, rx, ry, d.rot, d.grabbing, 0);
          c.fillStyle = '#fde047';
          c.font = '800 13px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText(Math.abs(Math.round(d.rot)) + '°', rx, ry - 34);
        } else {
          drawRider(c, pipeX(d.u), pipeY(d.u) - 14, 0, false,
            Math.atan(slopeOf(d.u) * WALL / PIPE_HW) * .9);
        }

        for (i = 0; i < d.pops.length; i++) {
          var p = d.pops[i];
          c.globalAlpha = U.clamp(p.t, 0, 1);
          c.fillStyle = p.col;
          c.font = '900 18px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText(p.text, p.x, p.y);
          c.globalAlpha = 1;
        }
        c.restore();

        /* HUD */
        // speed / pump meter
        c.fillStyle = 'rgba(8,14,26,.68)';
        U.roundRect(c, 22, 72, 178, 56, 10); c.fill();
        c.fillStyle = 'rgba(226,232,240,.75)';
        c.font = '700 10px Outfit, sans-serif'; c.textAlign = 'left';
        c.fillText('SPEED', 34, 90);
        c.fillStyle = 'rgba(255,255,255,.16)';
        U.roundRect(c, 34, 96, 154, 10, 5); c.fill();
        c.fillStyle = Math.abs(d.vu) > 2.1 ? '#4ade80' : Math.abs(d.vu) > 1.5 ? '#facc15' : '#fb7185';
        U.roundRect(c, 34, 96, 154 * U.clamp(Math.abs(d.vu) / 2.8, 0, 1), 10, 5); c.fill();
        c.fillStyle = 'rgba(226,232,240,.6)';
        c.font = '600 10px Outfit, sans-serif';
        c.fillText(Math.abs(d.u) < .45 ? 'IN THE FLAT — PUMP NOW' : 'on the transition', 34, 120);

        // judges card
        c.textAlign = 'right';
        c.fillStyle = 'rgba(8,14,26,.68)';
        U.roundRect(c, W - 200, 72, 178, 56, 10); c.fill();
        c.fillStyle = '#fde047';
        c.font = '900 26px Outfit, sans-serif';
        c.fillText(judged(d) + '/100', W - 34, 104);
        c.fillStyle = 'rgba(226,232,240,.6)';
        c.font = '600 10px Outfit, sans-serif';
        c.fillText('HIT ' + Math.min(d.hit + 1, HITS) + ' OF ' + HITS + '  ·  ' + d.crashes + '/3 CRASHES', W - 34, 120);

        // run progress ribbon
        c.fillStyle = 'rgba(255,255,255,.12)';
        U.roundRect(c, W / 2 - 120, H - 30, 240, 10, 5); c.fill();
        c.fillStyle = '#38bdf8';
        U.roundRect(c, W / 2 - 120, H - 30, 240 * U.clamp(d.progress, 0, 1), 10, 5); c.fill();

        if (d.msgT > 0) {
          c.globalAlpha = U.clamp(d.msgT, 0, 1);
          c.textAlign = 'center';
          c.fillStyle = '#f1f5f9';
          c.font = '800 18px Outfit, sans-serif';
          c.fillText(d.msg, W / 2, 168);
          c.globalAlpha = 1;
        }
      }
    });
  }

  window.Milo.register({
    id: 'snowboard-pipe',
    title: 'Snowboard Halfpipe',
    emo: '🏂',
    category: 'Sports',
    tagline: 'Pump the flat, spin the lip, stomp the landing',
    description: 'The pipe runs on a real energy model: you fall down one transition, roll ' +
      'across the flat and climb the other wall, and the only way to gain height is to tap ' +
      'Space through the bottom to pump. Whatever speed you carry over the lip becomes your ' +
      'amplitude, and in the air you hold ← or → to spin and Space to grab. Land within the ' +
      'window of a half rotation with the grab released and the judges pay for amplitude, ' +
      'rotation and grab time; land sideways or still holding the board and you wash out. ' +
      'Six hits down the pipe, the landing window narrows each time, three crashes ends the ' +
      'run, and 75 out of 100 puts you on the podium.',
    controls: ['← →  carve / spin', 'Space  pump / grab'],
    colors: ['#0ea5e9', '#e2e8f0'],
    tags: ['snowboard', 'tricks', 'winter', 'timing', 'halfpipe'],
    mount: mount
  });
})();
