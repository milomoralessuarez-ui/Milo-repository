/* Dance Arrows — arrows climb to the beat, stomp them in the target zone. */
(function () {
  'use strict';

  var W = 540, H = 700;
  var RECEPT_Y = 156, SPAWN_Y = H + 40;
  var APPROACH = 1.45;                   // seconds from the floor to the zone
  var SPEED = (SPAWN_Y - RECEPT_Y) / APPROACH;
  var LANES = ['left', 'down', 'up', 'right'];
  var ANGLE = [-Math.PI / 2, Math.PI, 0, Math.PI / 2];
  var COLS = ['#ff5d9e', '#4dd7ff', '#3ddc97', '#ffc93d'];
  var LANE_X = [100, 213, 327, 440];

  var W_PERFECT = .048, W_GREAT = .092, W_GOOD = .142, W_MISS = .19;
  var LEAD = 2.6;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var S = Milo.sound;

    /* ---------------------------------------------------------- generator */

    var SCALE = [0, 3, 5, 7, 10];
    function semi(f, n) { return f * Math.pow(2, n / 12); }

    function levelOf(bar) { return Math.min(9, Math.floor(bar / 6)); }
    function bpmOf(lvl) { return Math.min(178, 100 + lvl * 9); }

    function generateBar(g) {
      var d = g.data;
      var bar = d.bar;
      var lvl = levelOf(bar);
      var bpm = bpmOf(lvl);
      var beat = 60 / bpm, step = beat / 2;
      var t0 = d.nextBarT;
      d.bpmNow = bpm;

      // backing track: 4-on-the-floor with a hat and a rolling bass
      var chord = [0, -3, -5, -3][bar % 4];
      for (var s = 0; s < 8; s++) {
        var t = t0 + s * step;
        if (s % 2 === 0) d.beats.push({ t: t, kind: 'kick' });
        if (s % 2 === 1) d.beats.push({ t: t, kind: 'hat' });
        if (s === 2 || s === 6) d.beats.push({ t: t, kind: 'snare' });
        if (s === 0 || s === 3 || s === 5) {
          d.beats.push({ t: t, kind: 'bass', f: semi(110, chord + SCALE[(bar + s) % SCALE.length] - 12) });
        }
        if (lvl >= 4 && s % 2 === 1) d.beats.push({ t: t + step / 2, kind: 'hat' });
      }

      // arrows
      var slots = [];
      if (lvl <= 0) slots = [0, 2, 4, 6];
      else if (lvl === 1) slots = [0, 2, 3, 4, 6];
      else if (lvl === 2) slots = [0, 1, 2, 4, 5, 6];
      else if (lvl <= 4) slots = [0, 1, 2, 3, 4, 5, 6, 7];
      else slots = [0, 1, 2, 3, 4, 5, 6, 7];

      var density = [.55, .62, .68, .72, .76, .8, .84, .88, .92, .95][lvl];
      var lastLane = d.lastLane;
      var holdUntil = -1;

      for (var k = 0; k < slots.length; k++) {
        var si = slots[k];
        if (si <= holdUntil) continue;
        if (Math.random() > density && si !== 0) continue;
        var nt = t0 + si * step;

        // sixteenth-note flourish at the top levels
        if (lvl >= 6 && Math.random() < .18 && si < 7) {
          var l1 = pickLane(lastLane);
          push(d, l1, nt, 0);
          lastLane = l1;
          var l2 = pickLane(lastLane);
          push(d, l2, nt + step / 2, 0);
          lastLane = l2;
          continue;
        }

        // holds from level 2: a long arrow you keep standing on
        if (lvl >= 2 && (si === 0 || si === 4) && Math.random() < (lvl >= 5 ? .3 : .22)) {
          var hl = pickLane(lastLane);
          var len = (lvl >= 5 ? U.randInt(3, 5) : U.randInt(2, 4)) * step;
          push(d, hl, nt, len);
          lastLane = hl;
          holdUntil = si + Math.round(len / step);
          continue;
        }

        // jumps from level 3: two panels at once
        if (lvl >= 3 && si % 4 === 0 && Math.random() < (lvl >= 6 ? .34 : .2)) {
          var a = U.randInt(0, 3), b = (a + U.randInt(1, 3)) % 4;
          push(d, a, nt, 0);
          push(d, b, nt, 0);
          lastLane = b;
          continue;
        }

        var lane = pickLane(lastLane);
        push(d, lane, nt, 0);
        lastLane = lane;
      }

      d.lastLane = lastLane;
      d.nextBarT = t0 + 8 * step;
      d.bar++;
      if (levelOf(d.bar) > lvl) {
        d.banner = { t: 2.2, text: 'SPEED UP  ·  ' + bpmOf(levelOf(d.bar)) + ' BPM' };
      }
    }

    function pickLane(last) {
      var l = U.randInt(0, 3);
      if (l === last && Math.random() < .55) l = (l + U.randInt(1, 3)) % 4;
      return l;
    }

    function push(d, lane, t, len) {
      d.notes.push({
        lane: lane, t: t, len: len, judged: 0, holding: false,
        holdOk: 0, broke: false, pop: 0
      });
    }

    /* --------------------------------------------------------------- state */

    function reset(g) {
      var d = g.data;
      d.notes = [];
      d.beats = [];
      d.beatIdx = 0;
      d.songT = -LEAD;
      d.nextBarT = 0;
      d.bar = 0;
      d.lastLane = -1;
      d.bpmNow = 100;
      d.combo = 0; d.bestCombo = 0;
      d.perfect = 0; d.great = 0; d.good = 0; d.miss = 0; d.holds = 0; d.breaks = 0;
      d.life = 58;
      d.flash = [0, 0, 0, 0];
      d.press = [0, 0, 0, 0];
      d.parts = [];
      d.judge = null;
      d.banner = { t: 2.4, text: 'HERE WE GO' };
      d.pulse = 0;
      d.shake = 0;
      while (d.nextBarT < LEAD + 3) generateBar(g);
      g.score = 0;
      g.set('Score', 0);
      g.set('Combo', 0);
      g.set('Accuracy', '100%');
      g.set('BPM', 100);
    }

    function accuracy(d) {
      var n = d.perfect + d.great + d.good + d.miss;
      if (!n) return 1;
      return (d.perfect + d.great * .82 + d.good * .45) / n;
    }

    function grade(a) {
      return a >= .95 ? 'S' : a >= .9 ? 'A' : a >= .8 ? 'B' : a >= .7 ? 'C' : a >= .55 ? 'D' : 'F';
    }

    function burst(g, lane, col, n, up) {
      var d = g.data;
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.2832;
        d.parts.push({
          x: LANE_X[lane] + U.rand(-16, 16), y: RECEPT_Y,
          vx: Math.cos(a) * U.rand(40, 230), vy: Math.sin(a) * U.rand(40, 200) - (up || 0),
          life: U.rand(.24, .55), max: .55, col: col, r: U.rand(2, 4.4)
        });
      }
    }

    function drain(g, amount) {
      var d = g.data;
      d.life = U.clamp(d.life + amount, 0, 100);
      if (d.life <= 0 && g.state === 'play') {
        var a = accuracy(d);
        g.gameOver({
          emo: '💃', title: 'Grade ' + grade(a),
          text: Math.round(a * 100) + '% accuracy · ' + d.perfect + ' perfect · best combo ' +
            d.bestCombo + ' · ' + d.holds + ' holds nailed.'
        });
      }
    }

    function stomp(g, lane) {
      var d = g.data;
      d.press[lane] = .16;
      var best = null, bestDt = 9;
      for (var i = 0; i < d.notes.length; i++) {
        var n = d.notes[i];
        if (n.lane !== lane || n.judged) continue;
        var dt = Math.abs(n.t - d.songT);
        if (dt < bestDt) { bestDt = dt; best = n; }
      }
      if (!best || bestDt > W_MISS) {
        S.tone({ f: 150, d: .04, v: .04, type: 'square' });
        return;
      }
      var name, pts, col, life;
      if (bestDt <= W_PERFECT) { name = 'PERFECT'; pts = 320; col = '#ffd257'; d.perfect++; life = 1.4; }
      else if (bestDt <= W_GREAT) { name = 'GREAT'; pts = 190; col = '#3ddc97'; d.great++; life = .9; }
      else { name = 'GOOD'; pts = 80; col = '#4dd7ff'; d.good++; life = .1; }

      best.judged = 1;
      best.pop = 1;
      if (best.len > 0) { best.holding = true; best.holdOk = 0; }
      d.combo++;
      if (d.combo > d.bestCombo) d.bestCombo = d.combo;
      g.score += pts + Math.min(d.combo, 80) * 3;
      g.set('Score', U.fmt(g.score));
      g.set('Combo', d.combo);
      g.set('Accuracy', Math.round(accuracy(d) * 100) + '%');
      d.judge = { t: .42, text: name, col: col };
      d.flash[lane] = .22;
      drain(g, life);
      S.tone({ f: [392, 523, 659, 784][lane] * (name === 'PERFECT' ? 2 : 1), d: .12, v: .06, type: 'sine' });
      burst(g, lane, col, name === 'PERFECT' ? 14 : 8, 90);
      if (d.combo % 50 === 0) { S.powerup(); d.shake = .3; }
    }

    function missNote(g, n) {
      var d = g.data;
      n.judged = 2;
      d.miss++;
      d.combo = 0;
      g.set('Combo', 0);
      g.set('Accuracy', Math.round(accuracy(d) * 100) + '%');
      d.judge = { t: .4, text: 'MISS', col: '#ff5d9e' };
      d.shake = .16;
      S.tone({ f: 120, d: .09, v: .05, type: 'sawtooth' });
      drain(g, -6.5);
    }

    function playBeat(d, b) {
      if (b.kind === 'kick') { S.tone({ f: 130, f2: 46, d: .16, v: .12, type: 'sine' }); d.pulse = 1; }
      else if (b.kind === 'hat') S.noise(.026, .022, 8200);
      else if (b.kind === 'snare') { S.noise(.1, .07, 3200); }
      else if (b.kind === 'bass') S.tone({ f: b.f, d: .17, v: .06, type: 'triangle' });
    }

    /* ---------------------------------------------------------------- draw */

    function arrowPath(c, x, y, dir, size) {
      c.save();
      c.translate(x, y);
      c.rotate(ANGLE[dir]);
      var s = size / 2;
      c.beginPath();
      c.moveTo(0, -s);
      c.lineTo(s, 0);
      c.lineTo(s * .45, 0);
      c.lineTo(s * .45, s);
      c.lineTo(-s * .45, s);
      c.lineTo(-s * .45, 0);
      c.lineTo(-s, 0);
      c.closePath();
      c.restore();
    }

    return Milo.arcade(host, {
      id: 'dance-arrows',
      w: W, h: H, bg: '#0a0718',
      stats: ['Score', 'Combo', 'Accuracy', 'BPM'],
      emo: '💃',
      touch: 'dpad',
      start: {
        title: 'Dance Arrows',
        text: 'Arrows climb from the floor to the target zone at the top — stomp each one ' +
          'with its arrow key as it lands inside the ring. Long arrows have to be held, ' +
          'and from the third stage two arrows arrive at once. Miss too many and the ' +
          'life bar empties; your accuracy becomes a letter grade.',
        keys: ['← ↓ ↑ →', 'Hold for long arrows']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, inp = g.input;

        for (var l = 0; l < 4; l++) {
          if (inp.pressed(LANES[l])) stomp(g, l);
          d.flash[l] = Math.max(0, d.flash[l] - dt);
          d.press[l] = Math.max(0, d.press[l] - dt);
        }

        d.songT += dt;
        d.pulse = Math.max(0, d.pulse - dt * 3.2);
        d.shake = Math.max(0, d.shake - dt);
        if (d.judge) { d.judge.t -= dt; if (d.judge.t <= 0) d.judge = null; }
        if (d.banner) { d.banner.t -= dt; if (d.banner.t <= 0) d.banner = null; }

        while (d.nextBarT < d.songT + LEAD) generateBar(g);

        // backing track
        while (d.beatIdx < d.beats.length && d.beats[d.beatIdx].t <= d.songT) {
          var b = d.beats[d.beatIdx++];
          if (b.t > d.songT - .2) playBeat(d, b);
        }
        if (d.beatIdx > 400) { d.beats.splice(0, d.beatIdx); d.beatIdx = 0; }

        // note lifecycle
        for (var i = d.notes.length - 1; i >= 0; i--) {
          var n = d.notes[i];
          if (!n.judged && n.t < d.songT - W_MISS) { missNote(g, n); continue; }
          if (n.pop > 0) n.pop -= dt * 4;
          if (n.holding) {
            var tailT = n.t + n.len;
            if (g.input.down(LANES[n.lane])) {
              n.holdOk += dt;
              if (Math.random() < dt * 22) burst(g, n.lane, COLS[n.lane], 1, 40);
              g.score += Math.round(120 * dt);
              g.set('Score', U.fmt(g.score));
            } else if (d.songT < tailT - .1) {
              n.holding = false;
              n.broke = true;
              d.breaks++;
              d.combo = 0;
              g.set('Combo', 0);
              d.judge = { t: .5, text: 'LET GO!', col: '#ff5d9e' };
              S.tone({ f: 200, f2: 90, d: .2, v: .07, type: 'sawtooth' });
              drain(g, -4.5);
            }
            if (n.holding && d.songT >= tailT) {
              n.holding = false;
              d.holds++;
              d.combo++;
              if (d.combo > d.bestCombo) d.bestCombo = d.combo;
              g.set('Combo', d.combo);
              g.score += 250;
              g.set('Score', U.fmt(g.score));
              d.judge = { t: .5, text: 'HELD!', col: '#ffd257' };
              drain(g, 3);
              S.powerup();
              burst(g, n.lane, '#ffd257', 14, 120);
            }
          }
          if (n.t + n.len < d.songT - 1.4) d.notes.splice(i, 1);
        }

        for (var p = d.parts.length - 1; p >= 0; p--) {
          var q = d.parts[p];
          q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 540 * dt; q.life -= dt;
          if (q.life <= 0) d.parts.splice(p, 1);
        }

        g.set('BPM', d.bpmNow);
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.save();
        if (d.shake > 0) c.translate(U.rand(-1, 1) * d.shake * 8, U.rand(-1, 1) * d.shake * 8);

        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#1b1040'); bg.addColorStop(.6, '#120a2c'); bg.addColorStop(1, '#07040f');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        // dance-floor grid that breathes on the kick
        c.save();
        c.globalAlpha = .12 + d.pulse * .18;
        c.strokeStyle = '#a78bfa'; c.lineWidth = 1;
        for (var gy = RECEPT_Y + 40; gy < H; gy += 46) {
          c.beginPath(); c.moveTo(0, gy + (d.songT * 40) % 46); c.lineTo(W, gy + (d.songT * 40) % 46); c.stroke();
        }
        c.restore();

        // lanes
        for (var l = 0; l < 4; l++) {
          c.fillStyle = 'rgba(255,255,255,' + (.028 + d.flash[l] * .5).toFixed(3) + ')';
          c.fillRect(LANE_X[l] - 46, 0, 92, H);
        }

        // hold bodies first
        for (var i = 0; i < d.notes.length; i++) {
          var n = d.notes[i];
          if (n.len <= 0) continue;
          var yh = RECEPT_Y + (n.t - d.songT) * SPEED;
          var yt = RECEPT_Y + (n.t + n.len - d.songT) * SPEED;
          if (yt < RECEPT_Y - 78 || yh > H + 60) continue;
          var topY = Math.max(n.holding ? Math.max(yh, RECEPT_Y) : yh, RECEPT_Y - 78);
          var done = n.judged === 1 && !n.holding && d.songT > n.t + n.len;
          c.save();
          c.globalAlpha = (n.broke || n.judged === 2 || done) ? .2 : .85;
          var hg = c.createLinearGradient(0, topY, 0, yt);
          hg.addColorStop(0, COLS[n.lane]);
          hg.addColorStop(1, U.shade(COLS[n.lane], -.35));
          c.fillStyle = hg;
          U.roundRect(c, LANE_X[n.lane] - 15, topY, 30, Math.max(6, yt - topY), 15); c.fill();
          c.restore();
        }

        // receptors
        for (var r = 0; r < 4; r++) {
          var pr = d.press[r], fl = d.flash[r];
          c.save();
          if (fl > 0) { c.shadowColor = COLS[r]; c.shadowBlur = 34 * (fl / .22); }
          arrowPath(c, LANE_X[r], RECEPT_Y, r, 62 + (fl > 0 ? 8 : 0) + d.pulse * 3);
          c.strokeStyle = fl > 0 ? '#fff' : 'rgba(255,255,255,.32)';
          c.lineWidth = 3;
          c.stroke();
          if (fl > 0 || pr > 0) {
            c.fillStyle = fl > 0 ? COLS[r] : 'rgba(255,255,255,.14)';
            c.fill();
          }
          c.restore();
        }

        // arrows
        for (var k = 0; k < d.notes.length; k++) {
          var m = d.notes[k];
          if (m.judged === 1 && m.len <= 0) continue;
          if (m.judged === 1 && m.holding) continue;
          var y = RECEPT_Y + (m.t - d.songT) * SPEED;
          if (y < RECEPT_Y - 78 || y > H + 50) continue;
          // arrows fade out just past the ring rather than flying into the HUD
          var fade = U.clamp((y - (RECEPT_Y - 78)) / 58, 0, 1);
          c.save();
          c.globalAlpha = (m.judged === 2 ? .25 : 1) * fade;
          c.shadowColor = COLS[m.lane]; c.shadowBlur = 14;
          arrowPath(c, LANE_X[m.lane], y, m.lane, 58);
          var ag = c.createLinearGradient(0, y - 30, 0, y + 30);
          ag.addColorStop(0, U.shade(COLS[m.lane], .35));
          ag.addColorStop(1, COLS[m.lane]);
          c.fillStyle = ag; c.fill();
          c.shadowBlur = 0;
          c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2; c.stroke();
          c.restore();
        }

        // particles
        for (var p = 0; p < d.parts.length; p++) {
          var q = d.parts[p];
          c.globalAlpha = Math.max(0, q.life / q.max);
          c.fillStyle = q.col;
          c.beginPath(); c.arc(q.x, q.y, q.r, 0, 6.2832); c.fill();
        }
        c.globalAlpha = 1;

        // judgement + combo
        c.textAlign = 'center';
        if (d.judge) {
          c.globalAlpha = Math.min(1, d.judge.t * 3.4);
          c.fillStyle = d.judge.col;
          c.font = '800 30px Outfit, sans-serif';
          c.fillText(d.judge.text, W / 2, RECEPT_Y + 116);
          c.globalAlpha = 1;
        }
        if (d.combo >= 4) {
          c.fillStyle = '#ffd257';
          c.font = '800 ' + (34 + Math.min(14, d.combo / 10)) + 'px Outfit, sans-serif';
          c.fillText(d.combo, W / 2, RECEPT_Y + 190);
          c.fillStyle = 'rgba(255,255,255,.5)';
          c.font = '700 12px Outfit, sans-serif';
          c.fillText('COMBO', W / 2, RECEPT_Y + 208);
        }

        if (d.banner) {
          c.globalAlpha = Math.min(1, d.banner.t);
          c.fillStyle = 'rgba(10,7,24,.75)';
          c.fillRect(0, H / 2 - 40, W, 80);
          c.fillStyle = '#3ddc97';
          c.font = '800 30px Outfit, sans-serif';
          c.fillText(d.banner.text, W / 2, H / 2 + 10);
          c.globalAlpha = 1;
        }

        // life bar
        var bw = W - 44;
        c.fillStyle = 'rgba(0,0,0,.45)';
        U.roundRect(c, 22, H - 34, bw, 16, 8); c.fill();
        var lifeCol = d.life > 55 ? '#3ddc97' : d.life > 25 ? '#ffc93d' : '#ff5d9e';
        c.fillStyle = lifeCol;
        U.roundRect(c, 22, H - 34, bw * U.clamp(d.life / 100, 0, 1), 16, 8); c.fill();
        c.fillStyle = 'rgba(255,255,255,.75)';
        c.font = '800 11px Outfit, sans-serif';
        c.textAlign = 'left';
        c.fillText('LIFE', 26, H - 42);
        c.textAlign = 'right';
        c.fillText('STAGE ' + (levelOf(d.bar) + 1) + '  ·  GRADE ' + grade(accuracy(d)), W - 24, H - 42);
        c.restore();
      }
    });
  }

  window.Milo.register({
    id: 'dance-arrows', title: 'Dance Arrows', emo: '💃', category: 'Arcade',
    tagline: 'Stomp the arrows as they reach the ring',
    description: 'Arrows scroll up from the floor to a ring of target arrows and you hit each ' +
      'one with its arrow key the instant it lands there, graded PERFECT, GREAT or GOOD by ' +
      'how close you were. Long arrows have to be held to their tail for a 250-point bonus ' +
      'and break your combo if you step off early; from stage three arrows arrive in pairs ' +
      'and stage six adds sixteenth-note runs. The backing track speeds from 100 to 178 BPM ' +
      'as you climb, misses drain the life bar, and the run ends with a letter grade from F ' +
      'to S. Tip: the kick drum is always on the beat the arrows land on.',
    controls: ['← ↓ ↑ →', 'Hold long arrows', 'D-pad on touch'],
    colors: ['#1b1040', '#3ddc97'],
    tags: ['rhythm', 'dance', 'arrows', 'timing', 'combo'],
    mount: mount
  });
})();
