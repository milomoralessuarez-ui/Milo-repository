/* Beat Drop — four lanes over a synth track the game sequences itself. */
(function () {
  'use strict';

  var W = 560, H = 680, LANES = 4, LANE_W = 104;
  var TOP_Y = 46, HIT_Y = H - 120;
  var KEYS = ['KeyD', 'KeyF', 'KeyJ', 'KeyK'];
  var LABEL = ['D', 'F', 'J', 'K'];
  var COLS = ['#ff4d8d', '#ffb43d', '#3ddc97', '#4dabff'];
  var NOTE_F = [261.6, 329.6, 392.0, 523.3];

  var APPROACH = 1.55;            // seconds a note spends on screen
  var W_PERFECT = 0.055, W_GOOD = 0.105, W_OK = 0.155;

  /* Charts are 16-step bars: '-' rest, '1'-'4' a lane, '5'-'8' a two-lane
     chord. `form` strings the parts into a song, `prog` moves the bass. */
  var DOUBLE = { '5': [0, 3], '6': [1, 2], '7': [0, 2], '8': [1, 3] };

  var SONGS = [
    {
      name: 'Neon Sunrise', bpm: 92, root: 98, prog: [0, 0, -4, -2], hats: 4,
      parts: {
        a: '1---2---3---4---',
        b: '1---3---2---4---',
        c: '1-2-3---4-3-2---',
        d: '1---2-3---4---3-'
      },
      form: 'aabaacbd'
    },
    {
      name: 'Cassette Loop', bpm: 102, root: 104, prog: [0, -3, -5, -3], hats: 4,
      parts: {
        a: '1---2-3---4---2-',
        b: '4---3-2---1---3-',
        c: '1-1-2-2-3-3-4-4-',
        d: '1---6---2---7---'
      },
      form: 'aabaacbdcb'
    },
    {
      name: 'Midnight Drive', bpm: 112, root: 110, prog: [0, -2, -5, -7], hats: 2,
      parts: {
        a: '1--2--3--4--2--3',
        b: '4--3--2--1--3--2',
        c: '1-2-3-4-5---8---',
        d: '1---1-2-3---3-4-'
      },
      form: 'aabacbdcab'
    },
    {
      name: 'Static Bloom', bpm: 122, root: 116, prog: [0, -4, -7, -4], hats: 2,
      parts: {
        a: '1-3-2-4-1-3-2-4-',
        b: '6---5---6---7---',
        c: '1-1-3-3-2-2-4-4-',
        d: '1-2-3-4-3-2-1-6-'
      },
      form: 'acabacdbcd'
    },
    {
      name: 'Glass Circuit', bpm: 134, root: 123, prog: [0, -5, -3, -7], hats: 2,
      parts: {
        a: '1-2-3-4-2-1-4-3-',
        b: '5-2-6-3-7-4-8-1-',
        c: '12--23--34--41--',
        d: '12--34--43--21--'
      },
      form: 'acabcabdcd'
    },
    {
      name: 'Red Shift', bpm: 146, root: 131, prog: [0, -3, -7, -10], hats: 2,
      parts: {
        a: '1-2-3-4-4-3-2-1-',
        b: '5-6-7-8-5-6-7-8-',
        c: '12--34--21--43--',
        d: '1-5-2-6-3-7-4-8-'
      },
      form: 'adacbdacdc'
    },
    {
      name: 'Terminal Velocity', bpm: 160, root: 139, prog: [0, -2, -5, -9], hats: 1,
      parts: {
        a: '1-2-3-4-3-2-1-4-',
        b: '5-6-7-8-8-7-6-5-',
        c: '1---2-3-4---3-2-',
        d: '1-2-3-4-5---8---'
      },
      form: 'acabadcbdca'
    }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var S = Milo.sound;

    function bar16(s) {
      s = String(s || '');
      while (s.length < 16) s += '-';
      return s.slice(0, 16);
    }

    function buildChart(song) {
      var stepDur = 60 / song.bpm / 4;
      var notes = [], bars = song.form.length;
      for (var b = 0; b < bars; b++) {
        var p = bar16(song.parts[song.form.charAt(b)]);
        for (var s = 0; s < 16; s++) {
          var ch = p.charAt(s);
          if (ch === '-' || ch === ' ') continue;
          var t = (b * 16 + s) * stepDur;
          if (DOUBLE[ch]) {
            notes.push(mkNote(DOUBLE[ch][0], t));
            notes.push(mkNote(DOUBLE[ch][1], t));
          } else {
            var lane = parseInt(ch, 10) - 1;
            if (lane >= 0 && lane < LANES) notes.push(mkNote(lane, t));
          }
        }
      }
      notes.sort(function (x, y) { return x.t - y.t; });
      return { notes: notes, stepDur: stepDur, steps: bars * 16, dur: bars * 16 * stepDur };
    }

    function mkNote(lane, t) { return { lane: lane, t: t, judged: 0, pop: 0 }; }

    /* ------------------------------------------------------------ backing */

    function semi(f, n) { return f * Math.pow(2, n / 12); }

    function playStep(g, step) {
      var d = g.data, song = d.song;
      var sib = step % 16, bar = Math.floor(step / 16);
      var chord = song.prog[bar % song.prog.length];
      var bass = semi(song.root, chord);

      if (sib === 0 || sib === 8 || (d.drop && sib === 12)) {
        S.tone({ f: 128, f2: 44, d: .17, v: .13, type: 'sine' });
        S.noise(.05, .05, 260);
        d.pulse = 1;
        d.kick = 1;
      }
      if (sib === 4 || sib === 12) {
        S.noise(.11, d.drop ? .1 : .075, 3200);
        d.snare = 1;
      }
      if (song.hats && sib % song.hats === (song.hats > 1 ? 2 % song.hats : 0)) {
        S.noise(.028, .026, 7000);
      }
      if (sib === 0 || sib === 3 || sib === 8 || sib === 11) {
        S.tone({ f: bass, d: .19, v: .075, type: 'triangle' });
      }
      if (sib === 4 || sib === 12) {
        S.tone({ f: semi(bass * 4, 0), d: .22, v: .035, type: 'sine' });
        S.tone({ f: semi(bass * 4, 7), d: .22, v: .028, type: 'sine' });
        if (d.drop) S.tone({ f: semi(bass * 4, 12), d: .2, v: .022, type: 'sine' });
      }
      if (d.drop && (sib === 6 || sib === 14)) {
        S.tone({ f: semi(bass * 2, 12), d: .1, v: .03, type: 'square' });
      }
    }

    /* -------------------------------------------------------------- state */

    function reset(g) {
      var d = g.data;
      d.track = 0;
      d.parts = [];
      d.flash = [0, 0, 0, 0];
      d.pulse = 0; d.kick = 0; d.snare = 0; d.shake = 0;
      d.combo = 0; d.bestCombo = 0;
      d.totPerfect = 0; d.totGood = 0; d.totOk = 0; d.totMiss = 0;
      d.judge = null;
      d.result = null;
      loadTrack(g, 0);
      g.score = 0;
      g.set('Score', 0);
      g.set('Combo', 0);
      g.set('Accuracy', '—');
      g.set('Track', '1/' + SONGS.length);
    }

    function loadTrack(g, i) {
      var d = g.data;
      d.track = i;
      d.song = SONGS[i];
      d.chart = buildChart(d.song);
      d.notes = d.chart.notes;
      d.songT = -0.0001;
      d.lastStep = -1;
      d.phase = 'count';
      d.countT = (60 / d.song.bpm) * 4;
      d.countBeat = -1;
      d.drop = false;
      d.perfect = 0; d.good = 0; d.ok = 0; d.miss = 0;
      d.judge = null;
      g.set('Track', (i + 1) + '/' + SONGS.length);
    }

    function acc(d) {
      var n = d.perfect + d.good + d.ok + d.miss;
      if (!n) return 1;
      return (d.perfect + d.good * .68 + d.ok * .32) / n;
    }
    function totalAcc(d) {
      var n = d.totPerfect + d.totGood + d.totOk + d.totMiss;
      if (!n) return 1;
      return (d.totPerfect + d.totGood * .68 + d.totOk * .32) / n;
    }

    function burst(g, lane, col, n, power) {
      var d = g.data;
      for (var i = 0; i < n; i++) {
        var a = -Math.PI / 2 + U.rand(-1.25, 1.25);
        d.parts.push({
          x: laneX(lane, HIT_Y), y: HIT_Y,
          vx: Math.cos(a) * U.rand(60, 260) * power,
          vy: Math.sin(a) * U.rand(90, 320) * power,
          life: U.rand(.28, .6), max: .6, col: col, r: U.rand(2, 4.5)
        });
      }
    }

    function hit(g, lane) {
      var d = g.data;
      d.flash[lane] = .2;
      if (d.phase !== 'song') return;
      var best = null, bestDt = 9;
      for (var i = 0; i < d.notes.length; i++) {
        var n = d.notes[i];
        if (n.lane !== lane || n.judged) continue;
        var dt = Math.abs(n.t - d.songT);
        if (dt < bestDt) { bestDt = dt; best = n; }
      }
      if (!best || bestDt > W_OK) {
        S.tone({ f: 150, d: .05, v: .05, type: 'square' });
        return;
      }
      var name, pts, col;
      if (bestDt <= W_PERFECT) { name = 'PERFECT'; pts = 300; col = '#ffd257'; d.perfect++; d.totPerfect++; }
      else if (bestDt <= W_GOOD) { name = 'GOOD'; pts = 160; col = '#3ddc97'; d.good++; d.totGood++; }
      else { name = (best.t > d.songT ? 'EARLY' : 'LATE'); pts = 70; col = '#4dabff'; d.ok++; d.totOk++; }

      best.judged = 1;
      best.pop = 1;
      d.combo++;
      if (d.combo > d.bestCombo) d.bestCombo = d.combo;
      g.score += pts + Math.min(d.combo, 60) * 3;
      g.set('Score', U.fmt(g.score));
      g.set('Combo', d.combo);
      g.set('Accuracy', Math.round(totalAcc(d) * 100) + '%');
      d.judge = { t: .45, text: name, col: col, lane: lane };
      S.tone({ f: NOTE_F[lane] * (name === 'PERFECT' ? 2 : 1), d: .16, v: .08, type: 'sine' });
      if (name === 'PERFECT') S.tone({ f: NOTE_F[lane] * 4, d: .08, v: .03, type: 'sine' });
      burst(g, lane, col, name === 'PERFECT' ? 14 : 8, name === 'PERFECT' ? 1.25 : .85);
      if (d.combo > 0 && d.combo % 25 === 0) { S.powerup(); d.shake = .35; }
    }

    function missNote(g, n) {
      var d = g.data;
      n.judged = 2;
      d.miss++; d.totMiss++;
      d.combo = 0;
      g.set('Combo', 0);
      g.set('Accuracy', Math.round(totalAcc(d) * 100) + '%');
      d.judge = { t: .4, text: 'MISS', col: '#ff4d8d', lane: n.lane };
      d.shake = .18;
      S.tone({ f: 110, d: .09, v: .05, type: 'sawtooth' });
    }

    function endTrack(g) {
      var d = g.data;
      var a = acc(d);
      var cleared = a >= .6;
      d.phase = 'result';
      d.resultT = cleared ? 2.6 : 2.2;
      d.result = { acc: a, cleared: cleared, name: d.song.name };
      if (cleared) {
        var bonus = Math.round(1200 * a) + d.bestCombo * 8;
        g.score += bonus;
        d.result.bonus = bonus;
        g.set('Score', U.fmt(g.score));
        S.powerup();
      } else {
        S.lose();
      }
    }

    function laneX(lane, y) {
      var s = persp(y);
      return W / 2 + (lane - (LANES - 1) / 2) * LANE_W * s;
    }
    function persp(y) {
      return .40 + .60 * U.clamp((y - TOP_Y) / (HIT_Y - TOP_Y), 0, 1);
    }
    function noteY(d, t) {
      return HIT_Y - (t - d.songT) * ((HIT_Y - TOP_Y + 90) / APPROACH);
    }

    /* --------------------------------------------------------------- draw */

    function drawHighway(c, d) {
      var g1 = c.createLinearGradient(0, 0, 0, H);
      g1.addColorStop(0, '#120a2e');
      g1.addColorStop(.55, '#170d3a');
      g1.addColorStop(1, '#07061c');
      c.fillStyle = g1; c.fillRect(0, 0, W, H);

      // horizon glow that breathes with the kick
      var glow = c.createRadialGradient(W / 2, TOP_Y + 10, 8, W / 2, TOP_Y + 10, 300);
      glow.addColorStop(0, 'rgba(124,92,255,' + (.28 + d.pulse * .42).toFixed(3) + ')');
      glow.addColorStop(1, 'rgba(124,92,255,0)');
      c.fillStyle = glow; c.fillRect(0, 0, W, 380);

      // lane trapezoids
      for (var l = 0; l < LANES; l++) {
        var xt = laneX(l, TOP_Y), xb = laneX(l, HIT_Y);
        var wt = LANE_W * persp(TOP_Y) * .92, wb = LANE_W * persp(HIT_Y) * .92;
        c.beginPath();
        c.moveTo(xt - wt / 2, TOP_Y); c.lineTo(xt + wt / 2, TOP_Y);
        c.lineTo(xb + wb / 2, H); c.lineTo(xb - wb / 2, H);
        c.closePath();
        var lg = c.createLinearGradient(0, TOP_Y, 0, H);
        lg.addColorStop(0, 'rgba(255,255,255,.015)');
        lg.addColorStop(1, 'rgba(255,255,255,' + (.05 + d.flash[l] * .5).toFixed(3) + ')');
        c.fillStyle = lg; c.fill();
        c.strokeStyle = 'rgba(160,150,255,.16)'; c.lineWidth = 1; c.stroke();
      }

      // beat rails sliding toward the player
      if (d.chart) {
        var beat = d.chart.stepDur * 4;
        var first = Math.floor(d.songT / beat) - 1;
        for (var i = 0; i < 8; i++) {
          var bt = (first + i) * beat;
          var y = noteY(d, bt);
          if (y < TOP_Y || y > HIT_Y + 4) continue;
          var s = persp(y);
          c.strokeStyle = 'rgba(200,190,255,' + (.05 + .12 * s).toFixed(3) + ')';
          c.lineWidth = 1;
          c.beginPath();
          c.moveTo(W / 2 - LANE_W * 2 * s, y); c.lineTo(W / 2 + LANE_W * 2 * s, y);
          c.stroke();
        }
      }
    }

    function drawPads(c, d, U) {
      c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(20, HIT_Y); c.lineTo(W - 20, HIT_Y); c.stroke();
      for (var l = 0; l < LANES; l++) {
        var x = laneX(l, HIT_Y), f = d.flash[l];
        var w = LANE_W * .86;
        c.save();
        if (f > 0) { c.shadowColor = COLS[l]; c.shadowBlur = 26 * (f / .2); }
        c.fillStyle = f > 0 ? COLS[l] : 'rgba(255,255,255,.08)';
        U.roundRect(c, x - w / 2, HIT_Y - 26, w, 52, 13); c.fill();
        c.restore();
        c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 2;
        U.roundRect(c, x - w / 2, HIT_Y - 26, w, 52, 13); c.stroke();
        c.fillStyle = f > 0 ? '#100a22' : 'rgba(255,255,255,.55)';
        c.font = '800 19px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText(LABEL[l], x, HIT_Y + 7);
      }
    }

    return Milo.arcade(host, {
      id: 'beat-drop',
      w: W, h: H, bg: '#07061c',
      stats: ['Score', 'Combo', 'Accuracy', 'Track'],
      emo: '🎧',
      touchButtons: [
        { key: 'left', label: 'D' }, { key: 'up', label: 'F' },
        { key: 'down', label: 'J' }, { key: 'right', label: 'K' }
      ],
      start: {
        title: 'Beat Drop',
        text: 'Seven charted tracks, and the game plays the music itself — kick, bass and ' +
          'stabs on the grid the notes fall to. Hit D, F, J, K as each note lands on the ' +
          'line. Clear 60% accuracy to unlock the next track.',
        keys: ['D F J K', 'Tap a lane']
      },
      init: reset,

      onKey: function (g, e) {
        var i = KEYS.indexOf(e.code);
        if (i >= 0) hit(g, i);
      },
      onPointer: function (g, type, x) {
        if (type !== 'down') return;
        var lane = Math.round((x - W / 2) / LANE_W + (LANES - 1) / 2);
        if (lane >= 0 && lane < LANES) hit(g, lane);
      },

      update: function (g, dt) {
        var d = g.data, inp = g.input;
        if (inp.pressed('left')) hit(g, 0);
        if (inp.pressed('up')) hit(g, 1);
        if (inp.pressed('down')) hit(g, 2);
        if (inp.pressed('right')) hit(g, 3);

        d.pulse = Math.max(0, d.pulse - dt * 3.4);
        d.kick = Math.max(0, d.kick - dt * 4.5);
        d.snare = Math.max(0, d.snare - dt * 6);
        d.shake = Math.max(0, d.shake - dt);
        for (var f = 0; f < LANES; f++) d.flash[f] = Math.max(0, d.flash[f] - dt);
        if (d.judge) { d.judge.t -= dt; if (d.judge.t <= 0) d.judge = null; }
        for (var p = d.parts.length - 1; p >= 0; p--) {
          var q = d.parts[p];
          q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 620 * dt; q.life -= dt;
          if (q.life <= 0) d.parts.splice(p, 1);
        }
        for (var k = 0; k < d.notes.length; k++) if (d.notes[k].pop > 0) d.notes[k].pop -= dt * 4;

        if (d.phase === 'count') {
          var beat = 60 / d.song.bpm;
          d.countT -= dt;
          var b = 3 - Math.floor(d.countT / beat);
          if (b > d.countBeat && b < 4) {
            d.countBeat = b;
            S.tone({ f: b >= 3 ? 1180 : 880, d: .07, v: .07, type: 'square' });
            d.pulse = .7;
          }
          if (d.countT <= 0) {
            d.phase = 'song';
            d.songT = 0;
            d.lastStep = -1;
          }
          return;
        }

        if (d.phase === 'result') {
          d.resultT -= dt;
          if (d.resultT <= 0) {
            if (!d.result.cleared) {
              g.gameOver({
                emo: '🎧', title: 'Track failed',
                text: d.result.name + ' fell to ' + Math.round(d.result.acc * 100) +
                  '% — you need 60%. Best combo ' + d.bestCombo + '.'
              });
              return;
            }
            if (d.track + 1 >= SONGS.length) {
              g.win({
                emo: '🏆', title: 'All seven tracks cleared',
                text: 'Overall accuracy ' + Math.round(totalAcc(d) * 100) +
                  '% · best combo ' + d.bestCombo + '.',
                score: g.score
              });
              return;
            }
            loadTrack(g, d.track + 1);
          }
          return;
        }

        // --- song running ---
        d.songT += dt;
        d.drop = d.songT > d.chart.dur * .55;
        var step = Math.floor(d.songT / d.chart.stepDur);
        if (step - d.lastStep > 5) d.lastStep = step - 1;
        while (d.lastStep < step && d.lastStep < d.chart.steps - 1) {
          d.lastStep++;
          playStep(g, d.lastStep);
        }

        for (var n = 0; n < d.notes.length; n++) {
          var note = d.notes[n];
          if (!note.judged && note.t < d.songT - W_OK) missNote(g, note);
        }

        if (d.songT > d.chart.dur + 1.1) endTrack(g);
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, U2 = g.u;
        c.save();
        if (d.shake > 0) c.translate(U2.rand(-1, 1) * d.shake * 9, U2.rand(-1, 1) * d.shake * 9);

        drawHighway(c, d);

        // notes
        for (var i = 0; i < d.notes.length; i++) {
          var n = d.notes[i];
          if (n.judged) continue;
          var y = noteY(d, n.t);
          if (y < TOP_Y - 30 || y > HIT_Y + 40) continue;
          var s = persp(y), x = laneX(n.lane, y);
          var w = LANE_W * .78 * s, h = 26 * s;
          c.save();
          c.shadowColor = COLS[n.lane]; c.shadowBlur = 16 * s;
          var ng = c.createLinearGradient(0, y - h / 2, 0, y + h / 2);
          ng.addColorStop(0, U2.shade(COLS[n.lane], .35));
          ng.addColorStop(1, COLS[n.lane]);
          c.fillStyle = ng;
          U2.roundRect(c, x - w / 2, y - h / 2, w, h, 7 * s); c.fill();
          c.restore();
          c.fillStyle = 'rgba(255,255,255,.55)';
          U2.roundRect(c, x - w / 2 + 4 * s, y - h / 2 + 3 * s, w - 8 * s, 3 * s, 2); c.fill();
        }

        drawPads(c, d, U2);

        // particles
        for (var p = 0; p < d.parts.length; p++) {
          var q = d.parts[p];
          c.globalAlpha = Math.max(0, q.life / q.max);
          c.fillStyle = q.col;
          c.beginPath(); c.arc(q.x, q.y, q.r, 0, 6.2832); c.fill();
        }
        c.globalAlpha = 1;

        // judgement
        if (d.judge) {
          var a = Math.min(1, d.judge.t * 3.2);
          c.globalAlpha = a;
          c.fillStyle = d.judge.col;
          c.font = '800 30px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(d.judge.text, W / 2, HIT_Y - 74 - (.45 - d.judge.t) * 26);
          c.globalAlpha = 1;
        }
        if (d.combo >= 3) {
          c.textAlign = 'center';
          c.fillStyle = '#ffd257';
          c.font = '800 ' + (30 + Math.min(12, d.combo / 8)) + 'px Outfit, sans-serif';
          c.fillText(d.combo, W / 2, 110);
          c.fillStyle = 'rgba(255,255,255,.55)';
          c.font = '700 12px Outfit, sans-serif';
          c.fillText('COMBO', W / 2, 128);
        }

        // header
        c.textAlign = 'left';
        c.fillStyle = 'rgba(255,255,255,.8)';
        c.font = '800 16px Outfit, sans-serif';
        c.fillText(d.song.name, 22, H - 56);
        c.fillStyle = 'rgba(255,255,255,.42)';
        c.font = '700 12px Outfit, sans-serif';
        c.fillText(d.song.bpm + ' BPM' + (d.drop && d.phase === 'song' ? '  ·  DROP' : ''), 22, H - 38);

        // progress bar
        if (d.chart) {
          var pw = W - 44;
          c.fillStyle = 'rgba(255,255,255,.1)';
          U2.roundRect(c, 22, H - 26, pw, 7, 4); c.fill();
          c.fillStyle = '#7c5cff';
          U2.roundRect(c, 22, H - 26, pw * U2.clamp(d.songT / d.chart.dur, 0, 1), 7, 4); c.fill();
        }

        if (d.phase === 'count') {
          c.textAlign = 'center';
          c.fillStyle = 'rgba(8,6,26,.72)'; c.fillRect(0, H / 2 - 92, W, 184);
          c.fillStyle = '#fff';
          c.font = '800 34px Outfit, sans-serif';
          c.fillText(d.song.name, W / 2, H / 2 - 24);
          c.fillStyle = '#9d8cff';
          c.font = '800 62px Outfit, sans-serif';
          c.fillText(String(Math.max(1, Math.ceil(d.countT / (60 / d.song.bpm)))), W / 2, H / 2 + 44);
          c.fillStyle = 'rgba(255,255,255,.55)';
          c.font = '700 13px Outfit, sans-serif';
          c.fillText('TRACK ' + (d.track + 1) + ' OF ' + SONGS.length + '  ·  ' + d.song.bpm + ' BPM', W / 2, H / 2 + 74);
        }

        if (d.phase === 'result' && d.result) {
          c.textAlign = 'center';
          c.fillStyle = 'rgba(8,6,26,.8)'; c.fillRect(0, H / 2 - 110, W, 220);
          c.fillStyle = d.result.cleared ? '#3ddc97' : '#ff4d8d';
          c.font = '800 36px Outfit, sans-serif';
          c.fillText(d.result.cleared ? 'TRACK CLEAR' : 'FAILED', W / 2, H / 2 - 42);
          c.fillStyle = '#fff';
          c.font = '800 46px Outfit, sans-serif';
          c.fillText(Math.round(d.result.acc * 100) + '%', W / 2, H / 2 + 12);
          c.fillStyle = 'rgba(255,255,255,.7)';
          c.font = '700 14px Outfit, sans-serif';
          c.fillText(d.perfect + ' perfect · ' + d.good + ' good · ' + d.ok +
            ' ok · ' + d.miss + ' miss', W / 2, H / 2 + 44);
          if (d.result.cleared) {
            c.fillStyle = '#ffd257';
            c.fillText('+' + U2.fmt(d.result.bonus) + ' clear bonus', W / 2, H / 2 + 72);
          }
        }
        c.restore();
      }
    });
  }

  window.Milo.register({
    id: 'beat-drop', title: 'Beat Drop', emo: '🎧', category: 'Arcade',
    tagline: 'Seven charted tracks the game plays for you',
    description: 'A four-lane rhythm game where the backing track is sequenced live — kick, ' +
      'bassline and chord stabs sit on the same 16-step grid the notes fall to, so the chart ' +
      'is the music. Every hit is graded PERFECT, GOOD or EARLY/LATE by how close it lands ' +
      'to the line, and combo adds up to 180 a note on top. Each of the seven tracks needs ' +
      '60% accuracy to unlock the next, and they climb from 92 BPM to 160 with two-lane ' +
      'chords appearing from track four. Tip: play to the kick drum, not to the note — the ' +
      'chart never lands off the beat you can hear.',
    controls: ['D F J K', 'Tap lanes'],
    colors: ['#120a2e', '#ff4d8d'],
    tags: ['rhythm', 'music', 'timing', 'combo', 'lanes'],
    mount: mount
  });
})();
