/* Tempo Tap — the metronome cuts out and you have to keep the beat alive. */
(function () {
  'use strict';

  var W = 740, H = 560;

  /* audible = beats you get to hear, silent = beats you must carry alone */
  var LEVELS = [
    { bpm: 100, audible: 8, silent: 8 },
    { bpm: 120, audible: 8, silent: 10 },
    { bpm: 84, audible: 8, silent: 12 },
    { bpm: 140, audible: 6, silent: 14 },
    { bpm: 72, audible: 6, silent: 16 },
    { bpm: 160, audible: 6, silent: 20 },
    { bpm: 92, audible: 4, silent: 24 },
    { bpm: 132, audible: 4, silent: 28 },
    { bpm: 176, audible: 4, silent: 32 }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var S = Milo.sound;

    function levelDef(i) {
      if (i < LEVELS.length) return LEVELS[i];
      var extra = i - LEVELS.length;
      return {
        bpm: U.choice([68, 76, 88, 108, 128, 148, 168, 184, 190]),
        audible: 4,
        silent: Math.min(60, 34 + extra * 4)
      };
    }

    function reset(g) {
      var d = g.data;
      d.level = 0;
      d.bar = 100;
      d.streak = 0;
      d.longest = 0;
      d.tapped = 0;
      d.locked = 0;
      d.parts = [];
      d.rings = [];
      d.drift = [];
      d.judge = null;
      d.flash = 0;
      d.pulse = 0;
      d.shake = 0;
      startLevel(g);
      g.score = 0;
      g.set('Score', 0);
      g.set('Level', 1);
      g.set('Streak', 0);
      g.set('Longest', 0);
    }

    function startLevel(g) {
      var d = g.data;
      var def = levelDef(d.level);
      d.bpm = def.bpm;
      d.beatDur = 60 / def.bpm;
      d.audible = def.audible;
      d.silent = def.silent;
      d.lt = -1.1;                    // short breath before the count starts
      d.lastBeat = -1;
      d.phase = 'listen';
      d.marks = [];
      for (var i = 0; i < def.silent; i++) d.marks.push({ k: def.audible + i, state: 0, err: 0 });
      d.drift = [];
      d.result = null;
      d.judge = null;
      g.set('Level', d.level + 1);
    }

    function beatTime(d, k) { return k * d.beatDur; }
    function markFor(d, k) {
      var i = k - d.audible;
      return (i >= 0 && i < d.marks.length) ? d.marks[i] : null;
    }

    function ripple(d, col, big) {
      d.rings.push({ r: big ? 18 : 10, max: big ? 200 : 140, life: .55, t: .55, col: col });
    }
    function spark(d, col, n) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.2832;
        d.parts.push({
          x: W / 2 + Math.cos(a) * 44, y: 268 + Math.sin(a) * 44,
          vx: Math.cos(a) * U.rand(70, 300), vy: Math.sin(a) * U.rand(70, 300),
          life: U.rand(.25, .6), max: .6, col: col, r: U.rand(2, 4.4)
        });
      }
    }

    function addBar(g, v) {
      var d = g.data;
      d.bar = U.clamp(d.bar + v, 0, 100);
      if (d.bar <= 0 && g.state === 'play') {
        g.gameOver({
          emo: '🎼', title: 'Tempo lost',
          text: 'Level ' + (d.level + 1) + ' at ' + d.bpm + ' BPM · longest silent run ' +
            d.longest + ' beats · ' + d.locked + ' of ' + d.tapped + ' taps dead on.'
        });
      }
    }

    function tap(g) {
      var d = g.data;
      if (g.state !== 'play') return;
      d.flash = .2;

      if (d.phase === 'listen') {
        // warming up with the click costs nothing and scores nothing
        S.tone({ f: 520, d: .04, v: .05, type: 'triangle' });
        ripple(d, 'rgba(148,163,200,.6)', false);
        return;
      }
      if (d.phase !== 'silent') return;

      var k = Math.round(d.lt / d.beatDur);
      k = U.clamp(k, d.audible, d.audible + d.silent - 1);
      var m = markFor(d, k);
      var err = d.lt - beatTime(d, k);
      var e = Math.abs(err) / d.beatDur;

      if (m && m.state !== 0) {
        d.judge = { t: .5, text: 'DOUBLE TAP', col: '#fb7185' };
        addBar(g, -9);
        d.streak = 0;
        g.set('Streak', 0);
        S.tone({ f: 170, d: .08, v: .06, type: 'square' });
        return;
      }

      d.tapped++;
      var name, col, pts, bar;
      if (e <= .045) { name = 'LOCKED'; col = '#3ddc97'; pts = 200 + d.level * 20; bar = 9; d.locked++; }
      else if (e <= .09) { name = 'TIGHT'; col = '#7dd3fc'; pts = 110 + d.level * 10; bar = 5; }
      else if (e <= .16) { name = err < 0 ? 'A HAIR EARLY' : 'A HAIR LATE'; col = '#ffd257'; pts = 40; bar = -3; }
      else if (e <= .3) { name = err < 0 ? 'RUSHING' : 'DRAGGING'; col = '#fb923c'; pts = 10; bar = -12; }
      else { name = 'OFF THE BEAT'; col = '#fb7185'; pts = 0; bar = -19; }

      if (m) { m.state = bar > 0 ? 1 : (pts > 0 ? 2 : 3); m.err = err; }
      d.drift.push({ err: err / d.beatDur, t: 1 });
      if (d.drift.length > 26) d.drift.shift();

      if (bar > 0) {
        d.streak++;
        if (d.streak > d.longest) { d.longest = d.streak; g.set('Longest', d.longest); }
        g.set('Streak', d.streak);
      } else {
        d.streak = 0;
        g.set('Streak', 0);
        d.shake = .2;
      }

      g.score += pts + (bar > 0 ? Math.min(d.streak, 40) * 4 : 0);
      g.set('Score', U.fmt(g.score));
      d.judge = { t: .55, text: name, col: col, err: err };
      addBar(g, bar);

      S.tone({
        f: name === 'LOCKED' ? 1180 : name === 'TIGHT' ? 880 : 520,
        d: .05, v: .06, type: 'triangle'
      });
      ripple(d, col, name === 'LOCKED');
      if (name === 'LOCKED') spark(d, col, 10);
      if (d.streak > 0 && d.streak % 8 === 0) S.powerup();
    }

    function click(d, strong) {
      S.tone({ f: strong ? 1560 : 1040, d: .045, v: strong ? .09 : .055, type: 'square' });
      d.pulse = 1;
    }

    return Milo.arcade(host, {
      id: 'tempo-tap',
      w: W, h: H, bg: '#0d1226',
      stats: ['Score', 'Level', 'Streak', 'Longest'],
      emo: '🎼',
      touchButtons: [{ key: 'action', label: 'TAP' }],
      start: {
        title: 'Tempo Tap',
        text: 'A metronome counts you in, then cuts out completely — no click, no swinging ' +
          'arm, nothing. Keep tapping the same tempo on your own. Every beat you land drains ' +
          'or fills the bar depending on how close it was, and the silences get longer each ' +
          'level.',
        keys: ['Space', 'Click anywhere']
      },
      init: reset,

      onKey: function (g, e) { if (e.code === 'Space' || e.code === 'Enter') tap(g); },
      onPointer: function (g, type) { if (type === 'down') tap(g); },

      update: function (g, dt) {
        var d = g.data;
        if (g.input.pressed('action')) tap(g);

        d.flash = Math.max(0, d.flash - dt * 4);
        d.pulse = Math.max(0, (d.pulse || 0) - dt * 3.4);
        d.shake = Math.max(0, d.shake - dt);
        if (d.judge) { d.judge.t -= dt; if (d.judge.t <= 0) d.judge = null; }
        for (var i = d.rings.length - 1; i >= 0; i--) {
          var r = d.rings[i];
          r.t -= dt; r.r += (r.max - r.r) * dt * 5;
          if (r.t <= 0) d.rings.splice(i, 1);
        }
        for (var p = d.parts.length - 1; p >= 0; p--) {
          var q = d.parts[p];
          q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 420 * dt; q.life -= dt;
          if (q.life <= 0) d.parts.splice(p, 1);
        }
        for (var k = 0; k < d.drift.length; k++) d.drift[k].t = Math.max(0, d.drift[k].t - dt * .25);

        if (d.phase === 'result') {
          d.result.t -= dt;
          if (d.result.t <= 0) { d.level++; startLevel(g); }
          return;
        }

        d.lt += dt;

        var beatNow = Math.floor(d.lt / d.beatDur);
        if (d.lt >= 0 && beatNow > d.lastBeat) {
          for (var b = d.lastBeat + 1; b <= beatNow; b++) {
            if (b < d.audible) click(d, b % 4 === 0);
            if (b === d.audible && d.phase === 'listen') {
              d.phase = 'silent';
              S.tone({ f: 260, f2: 90, d: .3, v: .08, type: 'sine' });
              d.judge = { t: 1.1, text: 'KEEP GOING', col: '#7dd3fc' };
            }
          }
          d.lastBeat = beatNow;
        }

        if (d.phase === 'silent') {
          // any beat whose window has closed without a tap is a dropped beat
          for (var m = 0; m < d.marks.length; m++) {
            var mk = d.marks[m];
            if (mk.state === 0 && d.lt > beatTime(d, mk.k) + d.beatDur * .5) {
              mk.state = 4;
              d.streak = 0;
              g.set('Streak', 0);
              d.judge = { t: .6, text: 'DROPPED A BEAT', col: '#fb7185' };
              d.shake = .3;
              S.tone({ f: 140, f2: 70, d: .22, v: .08, type: 'sawtooth' });
              addBar(g, -21);
              if (g.state !== 'play') return;
            }
          }
          var lastK = d.audible + d.silent - 1;
          if (d.lt > beatTime(d, lastK) + d.beatDur * .5) {
            var clean = 0;
            for (var c2 = 0; c2 < d.marks.length; c2++) if (d.marks[c2].state === 1) clean++;
            var bonus = 150 + clean * 40 + d.level * 60;
            g.score += bonus;
            g.set('Score', U.fmt(g.score));
            addBar(g, 14 + clean);
            d.phase = 'result';
            d.result = { t: 2.1, clean: clean, bonus: bonus };
            S.win();
          }
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.save();
        if (d.shake > 0) c.translate(U.rand(-1, 1) * d.shake * 8, U.rand(-1, 1) * d.shake * 8);

        var silent = d.phase === 'silent';
        var bg = c.createLinearGradient(0, 0, 0, H);
        if (silent) { bg.addColorStop(0, '#0b1020'); bg.addColorStop(1, '#05070f'); }
        else { bg.addColorStop(0, '#1a2350'); bg.addColorStop(1, '#0a0e22'); }
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        if (d.flash > 0) {
          c.fillStyle = 'rgba(255,255,255,' + (d.flash * .12).toFixed(3) + ')';
          c.fillRect(0, 0, W, H);
        }

        c.textAlign = 'center';

        // rings
        for (var i = 0; i < d.rings.length; i++) {
          var r = d.rings[i];
          c.globalAlpha = Math.max(0, r.t / .55) * .8;
          c.strokeStyle = r.col; c.lineWidth = 3;
          c.beginPath(); c.arc(W / 2, 268, r.r, 0, 6.2832); c.stroke();
        }
        c.globalAlpha = 1;

        // the metronome — visible only while it is audible
        var cx = W / 2, cy = 268;
        if (!silent) {
          var phase = d.lt / d.beatDur;
          var swing = Math.sin(phase * Math.PI) * .62;
          c.save();
          c.translate(cx, cy + 74);
          c.rotate(swing);
          c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 6; c.lineCap = 'round';
          c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -150); c.stroke();
          c.fillStyle = '#ffd257';
          U.roundRect(c, -15, -118, 30, 22, 5); c.fill();
          c.restore();
          c.fillStyle = 'rgba(255,255,255,.14)';
          c.beginPath(); c.moveTo(cx - 86, cy + 84); c.lineTo(cx + 86, cy + 84);
          c.lineTo(cx + 46, cy - 92); c.lineTo(cx - 46, cy - 92); c.closePath(); c.fill();
          c.fillStyle = '#fff';
          c.beginPath(); c.arc(cx, cy + 74, 9 + d.pulse * 5, 0, 6.2832); c.fill();
        } else {
          c.save();
          c.globalAlpha = .75;
          c.fillStyle = '#131a33';
          U.roundRect(c, cx - 150, cy - 96, 300, 176, 22); c.fill();
          c.strokeStyle = 'rgba(125,211,252,.35)'; c.lineWidth = 2;
          U.roundRect(c, cx - 150, cy - 96, 300, 176, 22); c.stroke();
          c.restore();
          c.fillStyle = '#7dd3fc';
          c.font = '800 44px Outfit, sans-serif';
          c.fillText('SILENCE', cx, cy - 22);
          c.fillStyle = 'rgba(255,255,255,.45)';
          c.font = '700 14px Outfit, sans-serif';
          c.fillText('hold the tempo yourself', cx, cy + 6);
          var doneN = 0;
          for (var s = 0; s < d.marks.length; s++) if (d.marks[s].state) doneN++;
          c.fillStyle = '#fff';
          c.font = '800 26px Outfit, sans-serif';
          c.fillText(doneN + ' / ' + d.marks.length, cx, cy + 46);
        }

        // particles
        for (var p = 0; p < d.parts.length; p++) {
          var q = d.parts[p];
          c.globalAlpha = Math.max(0, q.life / q.max);
          c.fillStyle = q.col;
          c.beginPath(); c.arc(q.x, q.y, q.r, 0, 6.2832); c.fill();
        }
        c.globalAlpha = 1;

        // header
        c.fillStyle = 'rgba(255,255,255,.9)';
        c.font = '800 24px Outfit, sans-serif';
        c.fillText('LEVEL ' + (d.level + 1) + '  ·  ' + d.bpm + ' BPM', W / 2, 106);
        c.fillStyle = 'rgba(255,255,255,.45)';
        c.font = '700 13px Outfit, sans-serif';
        c.fillText(d.audible + ' beats of click, then ' + d.silent + ' on your own', W / 2, 128);

        // silent-beat dots
        var n = d.marks.length;
        var dw = Math.min(22, (W - 120) / n), dx0 = W / 2 - (n * dw) / 2;
        for (var m = 0; m < n; m++) {
          var mk = d.marks[m];
          var x = dx0 + m * dw + dw / 2;
          var col = mk.state === 1 ? '#3ddc97' : mk.state === 2 ? '#ffd257'
            : mk.state === 3 ? '#fb923c' : mk.state === 4 ? '#fb7185' : 'rgba(255,255,255,.16)';
          c.fillStyle = col;
          c.beginPath(); c.arc(x, 158, mk.state === 1 ? 7 : 5.5, 0, 6.2832); c.fill();
        }

        // drift meter
        var my = 428, mw = 420;
        c.fillStyle = 'rgba(255,255,255,.06)';
        U.roundRect(c, W / 2 - mw / 2, my - 16, mw, 32, 16); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(W / 2, my - 18); c.lineTo(W / 2, my + 18); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.3)';
        c.font = '700 11px Outfit, sans-serif';
        c.textAlign = 'left'; c.fillText('EARLY', W / 2 - mw / 2, my + 32);
        c.textAlign = 'right'; c.fillText('LATE', W / 2 + mw / 2, my + 32);
        c.textAlign = 'center';
        for (var k2 = 0; k2 < d.drift.length; k2++) {
          var dv = d.drift[k2];
          c.globalAlpha = .25 + dv.t * .75;
          c.fillStyle = Math.abs(dv.err) <= .045 ? '#3ddc97' : Math.abs(dv.err) <= .09 ? '#7dd3fc' : '#fb7185';
          c.fillRect(W / 2 + U.clamp(dv.err, -.5, .5) * mw - 1.5, my - 12, 3, 24);
        }
        c.globalAlpha = 1;

        // judgement
        if (d.judge) {
          c.globalAlpha = Math.min(1, d.judge.t * 3);
          c.fillStyle = d.judge.col;
          c.font = '800 32px Outfit, sans-serif';
          c.fillText(d.judge.text, W / 2, 372);
          if (d.judge.err != null) {
            c.font = '700 14px Outfit, sans-serif';
            c.fillStyle = 'rgba(255,255,255,.55)';
            c.fillText((d.judge.err > 0 ? '+' : '') + Math.round(d.judge.err * 1000) + ' ms', W / 2, 394);
          }
          c.globalAlpha = 1;
        }

        // bar
        var bw = W - 80;
        c.fillStyle = 'rgba(0,0,0,.42)';
        U.roundRect(c, 40, H - 58, bw, 20, 10); c.fill();
        c.fillStyle = d.bar > 55 ? '#3ddc97' : d.bar > 25 ? '#ffd257' : '#fb7185';
        U.roundRect(c, 40, H - 58, bw * U.clamp(d.bar / 100, 0, 1), 20, 10); c.fill();
        c.fillStyle = 'rgba(255,255,255,.75)';
        c.font = '800 12px Outfit, sans-serif';
        c.textAlign = 'left';
        c.fillText('TEMPO LOCK', 42, H - 66);
        c.textAlign = 'right';
        c.fillText('Longest run ' + d.longest, W - 42, H - 66);
        c.textAlign = 'center';
        c.fillStyle = 'rgba(255,255,255,.4)';
        c.font = '700 12px Outfit, sans-serif';
        c.fillText('SPACE or CLICK on every beat', W / 2, H - 20);

        if (d.phase === 'result' && d.result) {
          c.fillStyle = 'rgba(5,7,15,.82)';
          U.roundRect(c, W / 2 - 220, H / 2 - 80, 440, 160, 20); c.fill();
          c.strokeStyle = '#3ddc97'; c.lineWidth = 2;
          U.roundRect(c, W / 2 - 220, H / 2 - 80, 440, 160, 20); c.stroke();
          c.fillStyle = '#3ddc97';
          c.font = '800 32px Outfit, sans-serif';
          c.fillText('SILENCE SURVIVED', W / 2, H / 2 - 28);
          c.fillStyle = '#fff';
          c.font = '700 17px Outfit, sans-serif';
          c.fillText(d.result.clean + ' of ' + d.marks.length + ' beats dead on', W / 2, H / 2 + 6);
          c.fillStyle = '#ffd257';
          c.font = '800 20px Outfit, sans-serif';
          c.fillText('+' + U.fmt(d.result.bonus), W / 2, H / 2 + 38);
          c.fillStyle = 'rgba(255,255,255,.45)';
          c.font = '700 13px Outfit, sans-serif';
          c.fillText('Next tempo loading…', W / 2, H / 2 + 62);
        }
        c.restore();
      }
    });
  }

  window.Milo.register({
    id: 'tempo-tap', title: 'Tempo Tap', emo: '🎼', category: 'Casual',
    tagline: 'The click stops. Keep the beat anyway.',
    description: 'A metronome gives you a few bars — arm swinging, click on every beat — and ' +
      'then everything stops at once, sound and picture, and you have to keep tapping the ' +
      'exact same tempo into the silence. Each beat is measured in milliseconds: dead on ' +
      'fills the tempo bar, a hair off drains a little, rushing or dragging drains a lot and ' +
      'a dropped beat costs a fifth of the bar. The silences grow from eight beats to sixty ' +
      'and the tempo jumps between 68 and 190 BPM, so you cannot coast on one internal clock. ' +
      'Tip: keep your head or foot moving through the click and never stop it.',
    controls: ['Space', 'Click'],
    colors: ['#1a2350', '#7dd3fc'],
    tags: ['rhythm', 'timing', 'metronome', 'precision', 'music'],
    mount: mount
  });
})();
