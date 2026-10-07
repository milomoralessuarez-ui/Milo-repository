/* Drum Echo — the machine plays a bar, you play it back in time. */
(function () {
  'use strict';

  var W = 660, H = 580;
  var PADS = [
    { name: 'KICK', emo: '🥁', col: '#ff6b6b', key: 'D' },
    { name: 'SNARE', emo: '🪘', col: '#ffd257', key: 'F' },
    { name: 'HAT', emo: '🎩', col: '#4dd7ff', key: 'J' },
    { name: 'TOM', emo: '🛢️', col: '#a78bfa', key: 'K' }
  ];
  var KEYS = ['KeyD', 'KeyF', 'KeyJ', 'KeyK'];
  var NUMS = ['Digit1', 'Digit2', 'Digit3', 'Digit4'];

  /* Hand-written opening bars. s = step (eighth notes), p = pad. */
  var ROUNDS = [
    { bpm: 84, steps: 8, hits: [[0, 0], [4, 1], [6, 2]] },
    { bpm: 90, steps: 8, hits: [[0, 0], [2, 2], [4, 1], [6, 2]] },
    { bpm: 96, steps: 8, hits: [[0, 0], [3, 0], [4, 1], [7, 2]] },
    { bpm: 102, steps: 8, hits: [[0, 0], [2, 2], [3, 0], [4, 1], [6, 2]] },
    { bpm: 104, steps: 16, hits: [[0, 0], [4, 1], [6, 0], [8, 0], [12, 1], [14, 2]] },
    { bpm: 110, steps: 16, hits: [[0, 0], [2, 2], [4, 1], [7, 0], [8, 0], [10, 2], [12, 1], [15, 3]] },
    { bpm: 116, steps: 16, hits: [[0, 0], [3, 3], [4, 1], [6, 2], [8, 0], [9, 0], [12, 1], [13, 2], [14, 3]] },
    { bpm: 122, steps: 16, hits: [[0, 0], [2, 1], [4, 2], [5, 0], [7, 3], [8, 1], [10, 2], [11, 0], [12, 1], [14, 3]] }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var S = Milo.sound;

    /* ------------------------------------------------------------- voices */

    function voice(pad) {
      if (pad === 0) { S.tone({ f: 152, f2: 45, d: .22, v: .16, type: 'sine' }); S.noise(.05, .06, 200); }
      else if (pad === 1) { S.noise(.15, .13, 3400); S.tone({ f: 210, f2: 150, d: .1, v: .07, type: 'triangle' }); }
      else if (pad === 2) { S.noise(.05, .08, 9000); }
      else { S.tone({ f: 330, f2: 130, d: .26, v: .13, type: 'triangle' }); S.noise(.06, .04, 900); }
    }
    function click(strong) {
      S.tone({ f: strong ? 1500 : 1000, d: .035, v: strong ? .07 : .04, type: 'square' });
    }

    /* -------------------------------------------------------------- setup */

    function roundDef(r) {
      if (r < ROUNDS.length) {
        var base = ROUNDS[r];
        return { bpm: base.bpm, steps: base.steps, hits: base.hits.slice() };
      }
      // Past the written bars, keep generating denser 16-step patterns.
      var extra = r - ROUNDS.length;
      var bpm = Math.min(168, 126 + extra * 5);
      var count = Math.min(13, 10 + Math.floor(extra / 2));
      var pool = [];
      for (var s = 0; s < 16; s++) pool.push(s);
      // Downbeats first so the bar always has a spine.
      var picked = [0];
      var weighted = U.shuffle(pool.slice(1)).sort(function (a, b) {
        return (a % 2) - (b % 2) + (Math.random() - .5) * .8;
      });
      for (var i = 0; i < weighted.length && picked.length < count; i++) picked.push(weighted[i]);
      picked.sort(function (a, b) { return a - b; });
      var hits = picked.map(function (st, k) {
        var pad = st % 8 === 0 ? 0 : st % 8 === 4 ? 1 : U.randInt(0, 3);
        if (k > 0 && st % 2 === 1 && Math.random() < .5) pad = U.choice([2, 3]);
        return [st, pad];
      });
      return { bpm: bpm, steps: 16, hits: hits };
    }

    function reset(g) {
      var d = g.data;
      d.round = 0;
      d.lives = 3;
      d.streak = 0;
      d.bestStreak = 0;
      d.flash = [0, 0, 0, 0];
      d.parts = [];
      d.marks = [];
      d.judge = null;
      d.grade = null;
      d.nailed = 0;
      d.totalHits = 0;
      startRound(g);
      g.score = 0;
      g.set('Score', 0);
      g.set('Round', 1);
      g.set('Lives', 3);
      g.set('Tempo', d.bpm + ' bpm');
    }

    function startRound(g) {
      var d = g.data;
      var def = roundDef(d.round);
      d.bpm = def.bpm;
      d.steps = def.steps;
      d.beat = 60 / def.bpm;
      d.stepDur = d.beat / 2;
      d.barDur = d.steps * d.stepDur;
      d.pattern = def.hits.map(function (h) {
        return { s: h[0], pad: h[1], t: h[0] * d.stepDur, done: 0, err: 0 };
      });
      d.window = Math.min(d.stepDur * .62, .26 - Math.min(.1, d.round * .011));
      d.tight = d.stepDur * .17;
      d.showGhosts = d.round < 3;
      d.clickOnTurn = d.round < 5;
      d.phase = 'count';
      d.pt = 0;
      d.lastStep = -1;
      d.playedIdx = 0;
      d.marks = [];
      d.judge = null;
      g.set('Round', d.round + 1);
      g.set('Tempo', d.bpm + ' bpm');
    }

    function padX(i) { return W / 2 + (i % 2 === 0 ? -1 : 1) * 152; }
    function padY(i) { return 326 + (i < 2 ? 0 : 1) * 146; }
    var PAD_W = 268, PAD_H = 128;

    function burst(g, pad, col, n) {
      var d = g.data;
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.2832;
        d.parts.push({
          x: padX(pad), y: padY(pad),
          vx: Math.cos(a) * U.rand(50, 260), vy: Math.sin(a) * U.rand(50, 260) - 60,
          life: U.rand(.25, .55), max: .55, col: col, r: U.rand(2, 4)
        });
      }
    }

    /* -------------------------------------------------------------- input */

    function strike(g, pad) {
      var d = g.data;
      if (g.state !== 'play') return;
      d.flash[pad] = .22;
      voice(pad);

      if (d.phase !== 'you') {
        if (d.phase === 'machine') { d.judge = { t: .5, text: 'LISTEN FIRST', col: '#ffd257' }; }
        return;
      }
      burst(g, pad, PADS[pad].col, 6);

      // nearest unplayed step in the bar, whatever pad it wants
      var best = null, bestDt = 9;
      for (var i = 0; i < d.pattern.length; i++) {
        var n = d.pattern[i];
        if (n.done) continue;
        var dt = Math.abs(n.t - d.pt);
        if (dt < bestDt) { bestDt = dt; best = n; }
      }

      if (!best || bestDt > d.window) {
        d.judge = { t: .5, text: 'OFF THE GRID', col: '#94a3c8' };
        d.streak = 0;
        d.marks.push({ t: d.pt, pad: pad, kind: 'ghost' });
        S.tone({ f: 120, d: .07, v: .05, type: 'square' });
        return;
      }

      if (best.pad !== pad) {
        best.done = 2;
        d.marks.push({ t: d.pt, pad: pad, kind: 'wrong' });
        d.judge = { t: .7, text: 'WRONG PAD', col: '#ff6b6b' };
        d.streak = 0;
        loseLife(g, 'wrong pad on step ' + (best.s + 1));
        return;
      }

      best.done = 1;
      best.err = d.pt - best.t;
      d.marks.push({ t: d.pt, pad: pad, kind: 'hit' });
      d.totalHits++;
      var tight = Math.abs(best.err) <= d.tight;
      if (tight) d.nailed++;
      d.streak++;
      if (d.streak > d.bestStreak) d.bestStreak = d.streak;
      var pts = (tight ? 140 : 70) + d.round * 12 + Math.min(60, d.streak * 5);
      g.score += pts;
      g.set('Score', U.fmt(g.score));
      d.judge = {
        t: .45,
        text: tight ? 'TIGHT' : (best.err < 0 ? 'EARLY' : 'LATE'),
        col: tight ? '#3ddc97' : '#4dd7ff'
      };
      if (tight) burst(g, pad, '#3ddc97', 10);
      S.tone({ f: tight ? 1320 : 880, d: .06, v: .05, type: 'sine' });
    }

    function loseLife(g, why) {
      var d = g.data;
      d.lives--;
      g.set('Lives', Math.max(0, d.lives));
      S.tone({ f: 190, f2: 70, d: .28, v: .11, type: 'sawtooth' });
      d.shake = .3;
      if (d.lives <= 0) {
        g.gameOver({
          emo: '🥁', title: 'Out of time',
          text: 'Round ' + (d.round + 1) + ' — ' + why + '. ' +
            d.totalHits + ' notes echoed back, best run of ' + d.bestStreak + '.'
        });
      }
    }

    /* ------------------------------------------------------------- update */

    function endTurn(g) {
      var d = g.data;
      var missed = 0, clean = 0, wrong = 0;
      for (var i = 0; i < d.pattern.length; i++) {
        var st = d.pattern[i].done;
        if (st === 1) clean++;
        else if (st === 2) wrong++;     // wrong pad already cost a life when it happened
        else missed++;
      }
      var perfect = clean === d.pattern.length;
      d.grade = { t: 2.0, missed: missed, wrong: wrong, perfect: perfect };
      if (perfect) {
        var bonus = 220 + d.round * 60 + d.bestStreak * 6;
        g.score += bonus;
        d.grade.bonus = bonus;
        g.set('Score', U.fmt(g.score));
        S.powerup();
        for (var p = 0; p < 4; p++) burst(g, p, PADS[p].col, 8);
      } else {
        d.streak = 0;
        if (missed > 0) loseLife(g, missed + ' step' + (missed > 1 ? 's' : '') + ' dropped');
        else S.tone({ f: 200, f2: 120, d: .2, v: .07, type: 'square' });
      }
      d.phase = 'grade';
    }

    return Milo.arcade(host, {
      id: 'drum-echo',
      w: W, h: H, bg: '#0b0f21',
      stats: ['Score', 'Round', 'Lives', 'Tempo'],
      emo: '🥁',
      start: {
        title: 'Drum Echo',
        text: 'The machine plays a bar across four pads, then hands the bar back to you. ' +
          'Play the same pads at the same moments — the playhead never stops, so the timing ' +
          'is half the answer. Three lives, and the bars grow from three hits to thirteen.',
        keys: ['D F J K', '1 2 3 4', 'Tap the pads']
      },
      init: reset,

      onKey: function (g, e) {
        var i = KEYS.indexOf(e.code);
        if (i < 0) i = NUMS.indexOf(e.code);
        if (i >= 0) strike(g, i);
      },
      onPointer: function (g, type, x, y) {
        if (type !== 'down') return;
        for (var i = 0; i < 4; i++) {
          if (Math.abs(x - padX(i)) < PAD_W / 2 && Math.abs(y - padY(i)) < PAD_H / 2) { strike(g, i); return; }
        }
      },

      update: function (g, dt) {
        var d = g.data;
        for (var f = 0; f < 4; f++) d.flash[f] = Math.max(0, d.flash[f] - dt);
        d.shake = Math.max(0, (d.shake || 0) - dt);
        if (d.judge) { d.judge.t -= dt; if (d.judge.t <= 0) d.judge = null; }
        for (var p = d.parts.length - 1; p >= 0; p--) {
          var q = d.parts[p];
          q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 700 * dt; q.life -= dt;
          if (q.life <= 0) d.parts.splice(p, 1);
        }

        if (g.state !== 'play') return;

        if (d.phase === 'grade') {
          d.grade.t -= dt;
          if (d.grade.t <= 0) {
            if (d.lives <= 0) return;
            d.round++;
            d.grade = null;
            startRound(g);
          }
          return;
        }

        d.pt += dt;

        // metronome on every beat
        var stepNow = Math.floor(d.pt / d.stepDur);
        if (stepNow > d.lastStep) {
          for (var s = d.lastStep + 1; s <= stepNow; s++) {
            if (s < 0 || s >= d.steps) continue;
            if (s % 2 === 0 && (d.phase === 'machine' || d.phase === 'count' || d.clickOnTurn)) {
              click(s % 8 === 0);
            }
          }
          d.lastStep = stepNow;
        }

        if (d.phase === 'count') {
          if (d.pt >= d.beat * 4) {
            d.phase = 'machine';
            d.pt -= d.beat * 4;
            d.lastStep = Math.floor(d.pt / d.stepDur) - 1;
            d.playedIdx = 0;
          }
          return;
        }

        if (d.phase === 'machine') {
          while (d.playedIdx < d.pattern.length && d.pattern[d.playedIdx].t <= d.pt) {
            var n = d.pattern[d.playedIdx];
            voice(n.pad);
            d.flash[n.pad] = .22;
            burst(g, n.pad, PADS[n.pad].col, 4);
            d.playedIdx++;
          }
          if (d.pt >= d.barDur) {
            d.phase = 'you';
            d.pt -= d.barDur;
            d.lastStep = Math.floor(d.pt / d.stepDur) - 1;
            S.tone({ f: 660, d: .09, v: .06, type: 'square' });
          }
          return;
        }

        if (d.phase === 'you') {
          // steps whose window has closed without a hit
          for (var i = 0; i < d.pattern.length; i++) {
            var m = d.pattern[i];
            if (!m.done && d.pt > m.t + d.window) {
              m.done = 3;
              d.judge = { t: .45, text: 'MISSED', col: '#ff6b6b' };
              d.streak = 0;
            }
          }
          if (d.pt >= d.barDur + d.window) endTurn(g);
        }
      },

      /* --------------------------------------------------------------- draw */

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.save();
        if (d.shake > 0) c.translate(U.rand(-1, 1) * d.shake * 7, U.rand(-1, 1) * d.shake * 7);

        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#171d3c'); bg.addColorStop(1, '#080b1c');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        // title strip
        c.textAlign = 'center';
        var label = d.phase === 'count' ? 'COUNT IN'
          : d.phase === 'machine' ? 'LISTEN'
            : d.phase === 'you' ? 'YOUR TURN'
              : (d.grade && d.grade.perfect ? 'CLEAN BAR' : 'DROPPED IT');
        var labCol = d.phase === 'you' ? '#3ddc97' : d.phase === 'machine' ? '#ffd257'
          : d.phase === 'grade' ? (d.grade && d.grade.perfect ? '#3ddc97' : '#ff6b6b') : '#94a3c8';
        c.fillStyle = labCol;
        c.font = '800 30px Outfit, sans-serif';
        c.fillText(label, W / 2, 118);
        c.fillStyle = 'rgba(255,255,255,.44)';
        c.font = '700 13px Outfit, sans-serif';
        c.fillText('BAR ' + (d.round + 1) + '  ·  ' + d.pattern.length + ' HITS  ·  ' + d.bpm + ' BPM' +
          (d.clickOnTurn ? '' : '  ·  NO CLICK'), W / 2, 142);

        // step strip
        var sx = 46, sw = W - 92, cw = sw / d.steps;
        c.fillStyle = 'rgba(255,255,255,.05)';
        U.roundRect(c, sx, 162, sw, 56, 12); c.fill();
        for (var s = 0; s < d.steps; s++) {
          var x = sx + s * cw;
          c.fillStyle = s % 4 === 0 ? 'rgba(255,255,255,.10)' : 'rgba(255,255,255,.04)';
          U.roundRect(c, x + 2, 166, cw - 4, 48, 7); c.fill();
        }
        // the pattern's dots — hidden on your turn once the training wheels are off
        var showDots = d.phase !== 'you' || d.showGhosts;
        for (var i = 0; i < d.pattern.length; i++) {
          var n = d.pattern[i];
          var cx = sx + (n.s + .5) * cw;
          var played = d.phase === 'machine' ? (n.t <= d.pt) : true;
          if (d.phase === 'you' || d.phase === 'grade') {
            var col = n.done === 1 ? '#3ddc97' : n.done ? '#ff6b6b' : 'rgba(255,255,255,.22)';
            if (!showDots && !n.done && d.phase === 'you') col = 'rgba(255,255,255,.07)';
            c.fillStyle = col;
            c.beginPath(); c.arc(cx, 190, n.done === 1 ? 10 : 7, 0, 6.2832); c.fill();
          } else if (showDots) {
            c.fillStyle = played ? PADS[n.pad].col : 'rgba(255,255,255,.18)';
            c.beginPath(); c.arc(cx, 190, played ? 10 : 6, 0, 6.2832); c.fill();
          }
        }
        // playhead
        if (d.phase === 'machine' || d.phase === 'you') {
          var hx = sx + U.clamp(d.pt / d.barDur, 0, 1) * sw;
          c.strokeStyle = d.phase === 'you' ? '#3ddc97' : '#ffd257';
          c.lineWidth = 3;
          c.beginPath(); c.moveTo(hx, 160); c.lineTo(hx, 220); c.stroke();
        }
        if (d.phase === 'count') {
          c.fillStyle = '#fff';
          c.font = '800 34px Outfit, sans-serif';
          c.fillText(String(Math.min(4, Math.floor(d.pt / d.beat) + 1)), W / 2, 204);
        }

        // your marks under the strip
        for (var mk = 0; mk < d.marks.length; mk++) {
          var m = d.marks[mk];
          var mx = sx + U.clamp(m.t / d.barDur, 0, 1) * sw;
          c.fillStyle = m.kind === 'hit' ? '#3ddc97' : m.kind === 'wrong' ? '#ff6b6b' : '#64748b';
          c.fillRect(mx - 1.5, 224, 3, 10);
        }

        // pads
        for (var p = 0; p < 4; p++) {
          var px = padX(p), py = padY(p), fl = d.flash[p];
          c.save();
          if (fl > 0) { c.shadowColor = PADS[p].col; c.shadowBlur = 40 * (fl / .22); }
          var pg = c.createLinearGradient(0, py - PAD_H / 2, 0, py + PAD_H / 2);
          if (fl > 0) {
            pg.addColorStop(0, U.shade(PADS[p].col, .3));
            pg.addColorStop(1, PADS[p].col);
          } else {
            pg.addColorStop(0, 'rgba(255,255,255,.09)');
            pg.addColorStop(1, 'rgba(255,255,255,.03)');
          }
          c.fillStyle = pg;
          U.roundRect(c, px - PAD_W / 2, py - PAD_H / 2, PAD_W, PAD_H, 18); c.fill();
          c.restore();
          c.strokeStyle = fl > 0 ? '#fff' : 'rgba(255,255,255,.16)';
          c.lineWidth = 2;
          U.roundRect(c, px - PAD_W / 2, py - PAD_H / 2, PAD_W, PAD_H, 18); c.stroke();

          c.textAlign = 'center';
          c.font = '30px Outfit, sans-serif';
          c.fillText(PADS[p].emo, px, py - 4);
          c.fillStyle = fl > 0 ? '#0b0f21' : PADS[p].col;
          c.font = '800 17px Outfit, sans-serif';
          c.fillText(PADS[p].name, px, py + 26);
          c.fillStyle = fl > 0 ? 'rgba(11,15,33,.65)' : 'rgba(255,255,255,.35)';
          c.font = '700 12px Outfit, sans-serif';
          c.fillText(PADS[p].key + '  ·  ' + (p + 1), px, py + 46);
        }

        // particles
        for (var q = 0; q < d.parts.length; q++) {
          var t = d.parts[q];
          c.globalAlpha = Math.max(0, t.life / t.max);
          c.fillStyle = t.col;
          c.beginPath(); c.arc(t.x, t.y, t.r, 0, 6.2832); c.fill();
        }
        c.globalAlpha = 1;

        if (d.judge) {
          c.globalAlpha = Math.min(1, d.judge.t * 3);
          c.fillStyle = d.judge.col;
          c.font = '800 24px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(d.judge.text, W / 2, 262);
          c.globalAlpha = 1;
        }

        if (d.phase === 'grade' && d.grade) {
          c.fillStyle = 'rgba(8,11,28,.78)';
          U.roundRect(c, W / 2 - 210, H / 2 - 66, 420, 132, 18); c.fill();
          c.strokeStyle = d.grade.perfect ? '#3ddc97' : '#ff6b6b';
          c.lineWidth = 2;
          U.roundRect(c, W / 2 - 210, H / 2 - 66, 420, 132, 18); c.stroke();
          c.textAlign = 'center';
          c.fillStyle = d.grade.perfect ? '#3ddc97' : '#ff6b6b';
          c.font = '800 30px Outfit, sans-serif';
          c.fillText(d.grade.perfect ? 'ECHOED PERFECTLY'
            : d.grade.missed > 0 ? d.grade.missed + ' STEP' + (d.grade.missed > 1 ? 'S' : '') + ' DROPPED'
              : 'WRONG PAD IN THERE', W / 2, H / 2 - 16);
          c.fillStyle = '#fff';
          c.font = '700 16px Outfit, sans-serif';
          c.fillText(d.grade.perfect ? '+' + U.fmt(d.grade.bonus) + ' clean-bar bonus'
            : 'Listen for the pad, then for the gap', W / 2, H / 2 + 18);
          c.fillStyle = 'rgba(255,255,255,.45)';
          c.font = '700 13px Outfit, sans-serif';
          c.fillText('Next bar coming up…', W / 2, H / 2 + 46);
        }
        c.restore();
      }
    });
  }

  window.Milo.register({
    id: 'drum-echo', title: 'Drum Echo', emo: '🥁', category: 'Casual',
    tagline: 'Call and response on four drum pads',
    description: 'A drum machine plays one bar across kick, snare, hat and tom, then the ' +
      'playhead loops straight round and the bar is yours to repeat. Order is only half of ' +
      'it — each pad has to land inside a shrinking window around its step, and hits inside ' +
      'a sixth of a step score double. Bars run three hits at 84 BPM up to thirteen at 168, ' +
      'the guide dots vanish after round three and the click track drops out after round ' +
      'five. Tip: keep nodding through the machine\'s bar so your own comes out at the same ' +
      'tempo instead of a rushed version of it.',
    controls: ['D F J K', '1 2 3 4', 'Tap pads'],
    colors: ['#171d3c', '#ffd257'],
    tags: ['rhythm', 'memory', 'drums', 'timing', 'simon'],
    mount: mount
  });
})();
