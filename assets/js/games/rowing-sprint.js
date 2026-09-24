/* Rowing Sprint — 500m, and every stroke is one press at the catch. */
(function () {
  'use strict';

  var W = 860, H = 520;
  var COURSE = 500;                      // metres
  var YOU_LANE = 250, RIVAL_LANE = 370;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    var CREWS = [
      { name: 'Heat — Riverside', base: 6.42, push: .30, sprint: .5 },
      { name: 'Semi — Cambridge Blues', base: 6.74, push: .42, sprint: .68 },
      { name: 'Final — National Squad', base: 6.92, push: .48, sprint: .78 }
    ];

    function reset(g) {
      var d = g.data;
      d.race = 0;
      d.wins = 0;
      d.totalTime = 0;
      startRace(g);
      g.set('Metres', '0 / ' + COURSE);
      g.set('Rate', '0 spm');
      g.set('Race', '1/3');
    }

    function startRace(g) {
      var d = g.data;
      d.dist = 0; d.speed = 0;
      d.rivalDist = 0; d.rivalSpeed = 0;
      d.stamina = 100;
      d.time = 0;
      d.strokes = 0;
      d.rate = 0;
      d.lastStroke = 0;
      d.slide = 0;                 // 0 = at the catch, 1 = fully back at the finish
      d.driving = false;
      d.driveT = 0;
      d.recovery = .9;             // seconds the slide takes to come forward
      d.power = 0;
      d.catchQ = [];
      d.phase = 'countdown';
      d.phaseT = 3;
      d.msg = '';
      d.msgT = 0;
      d.puddles = [];
      d.tap = false;
      d.flash = 0;
      d.checked = 0;
      g.set('Metres', '0 / ' + COURSE);
      g.set('Rate', '0 spm');
      g.set('Race', (d.race + 1) + '/' + CREWS.length);
    }

    function say(d, t, time) { d.msg = t; d.msgT = time || 1.2; }

    function crew(d) { return CREWS[d.race]; }

    /* ------------------------------------------------------------ strokes */

    // The catch window opens when the slide has come all the way forward.
    function catchQuality(d) {
      var s = d.slide;                       // 1 = at the front stop
      if (s < .62) return -1;                // rushing the slide
      return U.clamp(1 - Math.abs(1 - s) / .38, 0, 1);
    }

    function takeStroke(g) {
      var d = g.data;
      if (d.driving) return;
      var q = catchQuality(d);
      if (q < 0) {
        // Checking the boat: the hull slows and the stroke is wasted.
        d.speed *= .93;
        d.checked++;
        d.flash = .25;
        say(d, 'Rushed the slide — you check the boat', .9);
        Milo.sound.tone({ f: 130, f2: 80, d: .14, v: .08, type: 'sawtooth' });
        d.slide = 0;
        d.driving = false;
        return;
      }
      var gap = d.time - d.lastStroke;
      d.lastStroke = d.time;
      if (d.strokes > 0) {
        var spm = 60 / Math.max(.4, gap);
        d.rate = d.rate ? d.rate * .6 + spm * .4 : spm;
        g.set('Rate', Math.round(d.rate) + ' spm');
      }
      d.strokes++;
      d.catchQ.push(q);
      if (d.catchQ.length > 8) d.catchQ.shift();
      // A long, loaded stroke at a low rating moves more water than a snatchy
      // one — but you only get so many of them.
      var load = U.clamp(1.35 - d.rate / 60, .55, 1.3);
      var fatigue = U.clamp(.35 + d.stamina / 100 * .65, .35, 1);
      d.power = q * load * fatigue;
      d.speed += d.power * 3.6;
      d.driving = true;
      d.driveT = 0;
      d.stamina -= 2.1 + Math.max(0, d.rate - 26) * .22;
      d.puddles.push({ d: d.dist, t: 1.4, lane: YOU_LANE });
      Milo.sound.tone({
        f: q > .8 ? 300 : 210, f2: 120, d: .13,
        v: .05 + q * .06, type: 'triangle'
      });
      d.flash = q > .85 ? .2 : 0;
    }

    function rivalUpdate(d, dt) {
      var cr = crew(d);
      var frac = d.rivalDist / COURSE;
      var target = cr.base;
      if (frac < .12) target += .5;                       // fly off the start
      else if (frac > .5 && frac < .72) target += cr.push;
      else if (frac > .82) target += cr.sprint;
      else target -= .08;
      d.rivalSpeed += (target - d.rivalSpeed) * Math.min(1, dt * 1.6);
      d.rivalDist += d.rivalSpeed * dt;
    }

    function finishRace(g) {
      var d = g.data;
      var won = d.dist >= COURSE && d.rivalDist < COURSE ? true : d.dist > d.rivalDist;
      d.totalTime += d.time;
      if (won) d.wins++;
      var margin = Math.abs(d.dist - d.rivalDist);
      var sc = Math.round(d.wins * 600 + Math.max(0, 200 - d.time) * 12 + d.strokes * 2);
      g.score = sc;
      if (!won) {
        g.gameOver({
          emo: '🚣', title: 'Beaten in the ' + crew(d).name.split(' — ')[0].toLowerCase(),
          text: d.time.toFixed(1) + 's, ' + margin.toFixed(1) + 'm down, ' +
            d.strokes + ' strokes at ' + Math.round(d.rate) + ' spm.',
          score: sc
        });
        return;
      }
      if (d.race >= CREWS.length - 1) {
        g.win({
          emo: '🏅', title: 'Regatta won',
          text: 'Three races in ' + d.totalTime.toFixed(1) + 's total. Final margin ' +
            margin.toFixed(1) + 'm.',
          score: sc + 800
        });
        return;
      }
      d.phase = 'won';
      d.phaseT = 2.6;
      say(d, 'Won by ' + margin.toFixed(1) + 'm in ' + d.time.toFixed(1) + 's', 2.4);
      Milo.sound.win();
    }

    /* --------------------------------------------------------------- draw */

    function drawBoat(c, x, y, slide, driving, col, oarCol) {
      c.save();
      c.translate(x, y);
      c.fillStyle = 'rgba(0,0,0,.2)';
      U.roundRect(c, -76, 6, 152, 10, 5); c.fill();
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(-80, 0); c.quadraticCurveTo(0, -13, 84, 0);
      c.quadraticCurveTo(0, 12, -80, 0); c.fill();
      c.fillStyle = 'rgba(255,255,255,.25)';
      c.fillRect(-60, -3, 120, 2);
      // four rowers, sliding together
      for (var i = 0; i < 4; i++) {
        var bx = -46 + i * 30;
        var lean = (driving ? -1 : 1) * (slide - .5) * 8;
        c.fillStyle = '#f8fafc';
        c.beginPath(); c.arc(bx + lean, -12, 5, 0, 7); c.fill();
        c.strokeStyle = oarCol; c.lineWidth = 3; c.lineCap = 'round';
        var oa = (driving ? .5 : -.5) + (slide - .5) * .9;
        c.beginPath();
        c.moveTo(bx + lean, -10);
        c.lineTo(bx + lean - Math.cos(oa) * 46, -10 + Math.sin(oa) * 30);
        c.stroke();
        c.beginPath();
        c.moveTo(bx + lean, -8);
        c.lineTo(bx + lean - Math.cos(oa) * 46, -8 - Math.sin(oa) * 30);
        c.stroke();
      }
      c.restore();
    }

    return Milo.arcade(host, {
      id: 'rowing-sprint',
      w: W, h: H, bg: '#07203a',
      stats: ['Metres', 'Rate', 'Race'],
      emo: '🚣',
      touch: 'a',
      touchButtons: [{ key: 'action', label: 'CATCH' }],
      start: {
        title: 'Rowing Sprint',
        text: 'One press per stroke, and it has to land at the catch — the moment the slide ' +
          'reaches the front stop, shown by the marker on the stroke arc. Press early and ' +
          'you check the boat and lose speed. Press late and you are simply rowing a lower ' +
          'rating. A low rating loads each stroke harder; a high one burns the stamina bar, ' +
          'and an empty crew barely moves the hull. 500 metres, three races, each rival ' +
          'faster than the last.',
        keys: ['Space  catch']
      },
      init: reset,

      onPointer: function (g, type) { if (type === 'down') g.data.tap = true; },

      update: function (g, dt) {
        var d = g.data, i;
        var tap = g.input.pressed('action') || d.tap;
        d.tap = false;
        if (d.msgT > 0) d.msgT -= dt;
        if (d.flash > 0) d.flash -= dt;
        for (i = d.puddles.length - 1; i >= 0; i--) {
          d.puddles[i].t -= dt;
          if (d.puddles[i].t <= 0) d.puddles.splice(i, 1);
        }

        if (d.phase === 'countdown') {
          d.phaseT -= dt;
          if (d.phaseT <= 0) {
            d.phase = 'row';
            d.slide = 1;
            say(d, 'Attention — GO!', 1);
            Milo.sound.tone({ f: 880, d: .3, v: .12, type: 'square' });
          }
          return;
        }
        if (d.phase === 'won') {
          d.phaseT -= dt;
          if (d.phaseT <= 0) { d.race++; startRace(g); }
          return;
        }
        if (d.phase !== 'row') return;

        d.time += dt;
        if (tap) takeStroke(g);

        // Drive, then recovery: the slide runs forward on its own and the
        // catch window is at the end of it.
        if (d.driving) {
          d.driveT += dt;
          d.slide = Math.max(0, 1 - d.driveT / .34);
          if (d.driveT >= .34) { d.driving = false; d.slide = 0; }
        } else {
          d.slide = Math.min(1, d.slide + dt / d.recovery);
        }

        // Hull: the drag on a racing shell goes up steeply with speed.
        d.speed -= (0.03 * d.speed * d.speed) * dt;
        d.speed = Math.max(0, d.speed);
        d.dist += d.speed * dt;
        d.stamina = Math.min(100, d.stamina + 3.4 * dt);
        if (d.stamina <= 0) {
          d.stamina = 0;
          if (d.msgT <= 0) say(d, 'The crew is empty — drop the rating', 1.4);
        }
        rivalUpdate(d, dt);

        g.set('Metres', Math.min(COURSE, Math.round(d.dist)) + ' / ' + COURSE);
        g.score = Math.round(d.wins * 600 + d.dist * 2);

        if (d.dist >= COURSE || d.rivalDist >= COURSE) { finishRace(g); }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, i;

        var SCALE = 8;
        var sky = c.createLinearGradient(0, 0, 0, 180);
        sky.addColorStop(0, '#1b3f6b'); sky.addColorStop(1, '#2f6b95');
        c.fillStyle = sky; c.fillRect(0, 0, W, 180);
        c.fillStyle = '#123a2c';
        c.fillRect(0, 150, W, 40);
        for (i = 0; i < 30; i++) {
          c.fillStyle = 'rgba(20,70,50,.8)';
          c.beginPath(); c.arc(((i * 71 - d.dist * 2.4) % (W + 60) + W + 60) % (W + 60) - 30, 156, 18, Math.PI, 0); c.fill();
        }
        var water = c.createLinearGradient(0, 190, 0, H);
        water.addColorStop(0, '#13527f'); water.addColorStop(1, '#062138');
        c.fillStyle = water; c.fillRect(0, 190, W, H - 190);

        // lane buoys scroll past, so speed is visible
        for (i = -1; i < 14; i++) {
          var bx = ((i * 70 - (d.dist * SCALE) % 70) + W + 70) % (W + 70) - 35;
          [YOU_LANE - 52, YOU_LANE + 58, RIVAL_LANE + 58].forEach(function (ly, n) {
            c.fillStyle = n === 1 ? 'rgba(255,255,255,.4)' : 'rgba(255,255,255,.22)';
            c.beginPath(); c.arc(bx, ly, 4, 0, 7); c.fill();
          });
        }
        for (i = 0; i < d.puddles.length; i++) {
          var p = d.puddles[i];
          var px = 150 + (p.d - d.dist) * SCALE;
          c.strokeStyle = 'rgba(255,255,255,' + (p.t * .3) + ')';
          c.lineWidth = 2;
          c.beginPath(); c.ellipse(px - 60, p.lane + 22, 16 * (1.4 - p.t), 5, 0, 0, 7); c.stroke();
          c.beginPath(); c.ellipse(px - 60, p.lane - 22, 16 * (1.4 - p.t), 5, 0, 0, 7); c.stroke();
        }

        // boats: you are pinned, the rival slides relative to you
        var relative = U.clamp((d.rivalDist - d.dist) * SCALE, -300, 330);
        drawBoat(c, 250, YOU_LANE, d.slide, d.driving, '#38bdf8', '#e2e8f0');
        drawBoat(c, 250 + relative, RIVAL_LANE, (d.time * 1.6) % 1, ((d.time * 1.6) % 1) < .35, '#f97316', '#fed7aa');

        if (d.flash > 0) {
          c.fillStyle = 'rgba(56,189,248,' + d.flash * .5 + ')';
          c.fillRect(0, 0, W, H);
        }

        /* --- stroke arc: the catch window --- */
        var ax = W / 2, ay = H - 96, ar = 62;
        c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 14;
        c.beginPath(); c.arc(ax, ay, ar, Math.PI, Math.PI * 2); c.stroke();
        c.strokeStyle = 'rgba(52,211,153,.5)'; c.lineWidth = 14;
        c.beginPath(); c.arc(ax, ay, ar, Math.PI * 1.62, Math.PI * 2); c.stroke();
        c.strokeStyle = 'rgba(248,113,113,.35)'; c.lineWidth = 14;
        c.beginPath(); c.arc(ax, ay, ar, Math.PI, Math.PI * 1.62); c.stroke();
        var sa = Math.PI + d.slide * Math.PI;
        c.strokeStyle = d.driving ? '#fde047' : '#f8fafc'; c.lineWidth = 4;
        c.beginPath();
        c.moveTo(ax + Math.cos(sa) * (ar - 16), ay + Math.sin(sa) * (ar - 16));
        c.lineTo(ax + Math.cos(sa) * (ar + 16), ay + Math.sin(sa) * (ar + 16));
        c.stroke();
        c.fillStyle = 'rgba(226,232,240,.75)';
        c.font = '700 11px Outfit, sans-serif'; c.textAlign = 'center';
        c.fillText(d.driving ? 'DRIVE' : 'RECOVERY', ax, ay + 18);
        c.fillStyle = 'rgba(248,113,113,.9)';
        c.font = '600 10px Outfit, sans-serif'; c.textAlign = 'left';
        c.fillText('rushing', ax - ar - 44, ay - 6);
        c.fillStyle = 'rgba(52,211,153,.9)'; c.textAlign = 'right';
        c.fillText('CATCH', ax + ar + 48, ay - 6);

        /* --- read-outs --- */
        c.textAlign = 'left';
        c.fillStyle = 'rgba(4,16,30,.72)';
        U.roundRect(c, 22, 128, 200, 96, 10); c.fill();
        var rows = [
          ['SPEED', (d.speed).toFixed(2) + ' m/s', '#38bdf8'],
          ['RATING', Math.round(d.rate) + ' spm', d.rate > 38 ? '#fb7185' : '#e2e8f0'],
          ['STROKES', d.strokes + '', '#e2e8f0'],
          ['CHECKS', d.checked + '', d.checked ? '#fb7185' : '#e2e8f0']
        ];
        c.font = '700 10px Outfit, sans-serif';
        for (i = 0; i < rows.length; i++) {
          c.fillStyle = 'rgba(226,232,240,.55)';
          c.fillText(rows[i][0], 34, 150 + i * 21);
          c.fillStyle = rows[i][2];
          c.font = '800 13px Outfit, sans-serif';
          c.fillText(rows[i][1], 116, 150 + i * 21);
          c.font = '700 10px Outfit, sans-serif';
        }

        // stamina
        c.fillStyle = 'rgba(4,16,30,.72)';
        U.roundRect(c, W - 232, 128, 210, 46, 10); c.fill();
        c.fillStyle = 'rgba(226,232,240,.6)';
        c.fillText('CREW STAMINA', W - 220, 146);
        c.fillStyle = 'rgba(255,255,255,.14)';
        U.roundRect(c, W - 220, 152, 186, 12, 6); c.fill();
        c.fillStyle = d.stamina > 55 ? '#4ade80' : d.stamina > 22 ? '#facc15' : '#fb7185';
        U.roundRect(c, W - 220, 152, 186 * U.clamp(d.stamina / 100, 0, 1), 12, 6); c.fill();

        // course bar
        c.fillStyle = 'rgba(255,255,255,.12)';
        U.roundRect(c, 60, 100, W - 120, 12, 6); c.fill();
        c.fillStyle = '#f97316';
        c.beginPath();
        c.arc(60 + (W - 120) * U.clamp(d.rivalDist / COURSE, 0, 1), 106, 6, 0, 7); c.fill();
        c.fillStyle = '#38bdf8';
        c.beginPath();
        c.arc(60 + (W - 120) * U.clamp(d.dist / COURSE, 0, 1), 106, 7, 0, 7); c.fill();
        c.textAlign = 'center';
        c.fillStyle = 'rgba(226,232,240,.6)';
        c.font = '600 10px Outfit, sans-serif';
        c.fillText(crew(d).name + '   ·   ' + d.time.toFixed(1) + 's', W / 2, 92);

        if (d.phase === 'countdown') {
          c.fillStyle = '#fde047';
          c.font = '900 52px Outfit, sans-serif';
          c.fillText(Math.ceil(d.phaseT) + '', W / 2, 200);
          c.fillStyle = 'rgba(226,232,240,.8)';
          c.font = '700 15px Outfit, sans-serif';
          c.fillText('Space on the catch — when the marker reaches the green', W / 2, 232);
        }
        if (d.msgT > 0) {
          c.globalAlpha = U.clamp(d.msgT, 0, 1);
          c.fillStyle = '#f1f5f9';
          c.font = '800 19px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText(d.msg, W / 2, 200);
          c.globalAlpha = 1;
        }
      }
    });
  }

  window.Milo.register({
    id: 'rowing-sprint',
    title: 'Rowing Sprint',
    emo: '🚣',
    category: 'Sports',
    tagline: 'One press a stroke, and only at the catch',
    description: 'Every stroke is a single press of Space, and it only counts at the catch ' +
      '— the instant the slide finishes coming forward, marked on the stroke arc at the ' +
      'bottom. Go early and you check the boat, killing speed you spent strokes building. ' +
      'The real decision is rating versus power: rowing long at 26 strokes a minute loads ' +
      'each stroke far harder than snatching at 40, but the rival crews wind up at halfway ' +
      'and again at 400m, and stamina drains faster the higher you rate. 500 metres, three ' +
      'races, and the Heat crew is nothing like the National Squad.',
    controls: ['Space  catch'],
    colors: ['#0c4a6e', '#f43f5e'],
    tags: ['rowing', 'rhythm', 'timing', 'race', 'stamina'],
    mount: mount
  });
})();
