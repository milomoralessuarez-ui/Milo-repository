/* Rhythm Tap — hit the notes as they cross the line. */
(function () {
  'use strict';
  var LANES = 4, W = 520, H = 660, HIT_Y = H - 110;
  var KEYS = ['KeyD', 'KeyF', 'KeyJ', 'KeyK'];
  var COLS = ['#fb7185', '#22d3ee', '#ffd257', '#a78bfa'];
  var NOTES = [262, 330, 392, 494];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.notes = [];
      d.beat = 0;
      d.bpm = 100;
      d.speed = 300;
      d.combo = 0;
      d.best = 0;
      d.hits = 0;
      d.misses = 0;
      d.hp = 100;
      d.flash = [0, 0, 0, 0];
      d.judge = null;
      d.parts = [];
      d.spawnT = 0;
      g.set('Score', 0);
      g.set('Combo', 0);
      g.set('Health', 100);
    }

    function judgeAt(dy) {
      var a = Math.abs(dy);
      if (a < 18) return { name: 'PERFECT', pts: 100, col: '#ffd257' };
      if (a < 38) return { name: 'GREAT', pts: 60, col: '#34d399' };
      if (a < 60) return { name: 'GOOD', pts: 30, col: '#38bdf8' };
      return null;
    }

    function hit(g, lane) {
      var d = g.data;
      d.flash[lane] = 0.16;
      // Nearest un-hit note in this lane.
      var best = null;
      d.notes.forEach(function (n) {
        if (n.lane !== lane || n.done) return;
        if (!best || Math.abs(n.y - HIT_Y) < Math.abs(best.y - HIT_Y)) best = n;
      });
      if (!best) return;
      var j = judgeAt(best.y - HIT_Y);
      if (!j) return;
      best.done = true;
      d.hits++;
      d.combo++;
      d.best = Math.max(d.best, d.combo);
      g.score += j.pts + d.combo;
      g.set('Score', U.fmt(g.score));
      g.set('Combo', d.combo);
      d.hp = Math.min(100, d.hp + 1.5);
      g.set('Health', Math.round(d.hp));
      d.judge = { t: .4, text: j.name, col: j.col };
      Milo.sound.tone({ f: NOTES[lane], d: .18, v: .07, type: 'sine' });
      for (var i = 0; i < 8; i++) {
        var a = Math.random() * 6.28;
        d.parts.push({
          x: laneX(lane), y: HIT_Y, vx: Math.cos(a) * 160, vy: Math.sin(a) * 160,
          life: .4, max: .4, col: j.col
        });
      }
    }

    function laneX(i) { return (W - LANES * 100) / 2 + i * 100 + 50; }

    return Milo.arcade(host, {
      id: 'rhythm-tap',
      w: W, h: H, bg: '#0c0a20',
      stats: ['Score', 'Combo', 'Health'],
      touchButtons: [
        { key: 'left', label: 'D' }, { key: 'up', label: 'F' },
        { key: 'down', label: 'J' }, { key: 'right', label: 'K' }
      ],
      emo: '🎵',
      start: {
        title: 'Rhythm Tap',
        text: 'Notes fall down four lanes. Hit D, F, J or K as each one crosses the line — ' +
          'the closer to dead centre, the more it scores. Missing drains your health.',
        keys: ['D F J K', 'Or tap the lanes']
      },
      init: reset,

      onKey: function (g, e) {
        var i = KEYS.indexOf(e.code);
        if (i >= 0) hit(g, i);
      },
      onPointer: function (g, type, x, y) {
        if (type !== 'down') return;
        var lane = Math.floor((x - (W - LANES * 100) / 2) / 100);
        if (lane >= 0 && lane < LANES) hit(g, lane);
      },

      update: function (g, dt) {
        var d = g.data;
        var i = g.input;
        // Touch pads map onto the four lanes.
        if (i.pressed('left')) hit(g, 0);
        if (i.pressed('up')) hit(g, 1);
        if (i.pressed('down')) hit(g, 2);
        if (i.pressed('right')) hit(g, 3);

        d.bpm = Math.min(190, 100 + d.hits * 0.35);
        d.speed = 300 + (d.bpm - 100) * 2.2;

        d.spawnT -= dt;
        if (d.spawnT <= 0) {
          d.spawnT = 60 / d.bpm;
          d.beat++;
          var count = (d.beat % 4 === 0 && Math.random() < .35) ? 2 : 1;
          var used = {};
          for (var k = 0; k < count; k++) {
            var lane;
            do { lane = U.randInt(0, LANES - 1); } while (used[lane]);
            used[lane] = true;
            d.notes.push({ lane: lane, y: -30, done: false });
          }
        }

        for (var n = d.notes.length - 1; n >= 0; n--) {
          var note = d.notes[n];
          note.y += d.speed * dt;
          if (note.done && note.y > HIT_Y + 40) { d.notes.splice(n, 1); continue; }
          if (!note.done && note.y > HIT_Y + 62) {
            note.done = true;
            d.misses++;
            d.combo = 0;
            g.set('Combo', 0);
            d.hp -= 8;
            g.set('Health', Math.max(0, Math.round(d.hp)));
            d.judge = { t: .4, text: 'MISS', col: '#fb7185' };
            Milo.sound.tone({ f: 130, d: .1, v: .05, type: 'square' });
            if (d.hp <= 0) {
              g.gameOver({
                emo: '🎵', title: 'Track failed',
                text: d.hits + ' notes hit · best combo ' + d.best + '.'
              });
              return;
            }
          }
        }

        d.flash = d.flash.map(function (f) { return Math.max(0, f - dt); });
        if (d.judge) { d.judge.t -= dt; if (d.judge.t <= 0) d.judge = null; }
        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
          return p.life > 0;
        });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#181240'); bg.addColorStop(1, '#07061a');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        for (var l = 0; l < LANES; l++) {
          var x = laneX(l);
          c.fillStyle = 'rgba(255,255,255,.03)';
          c.fillRect(x - 48, 0, 96, H);
          c.strokeStyle = 'rgba(255,255,255,.07)'; c.lineWidth = 1;
          c.beginPath(); c.moveTo(x - 50, 0); c.lineTo(x - 50, H); c.stroke();
        }

        c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(0, HIT_Y); c.lineTo(W, HIT_Y); c.stroke();

        for (var k = 0; k < LANES; k++) {
          var x2 = laneX(k);
          var f = d.flash[k];
          c.fillStyle = f > 0 ? COLS[k] : 'rgba(255,255,255,.10)';
          if (f > 0) { c.shadowColor = COLS[k]; c.shadowBlur = 24; }
          U.roundRect(c, x2 - 42, HIT_Y - 26, 84, 52, 12); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = f > 0 ? '#0b0a20' : 'rgba(255,255,255,.5)';
          c.font = '800 18px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(KEYS[k].slice(3), x2, HIT_Y + 7);
        }

        d.notes.forEach(function (n) {
          if (n.done) return;
          var x3 = laneX(n.lane);
          c.fillStyle = COLS[n.lane];
          c.shadowColor = COLS[n.lane]; c.shadowBlur = 12;
          U.roundRect(c, x3 - 40, n.y - 16, 80, 32, 10); c.fill();
          c.shadowBlur = 0;
        });

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - 3, p.y - 3, 6, 6);
        });
        c.globalAlpha = 1;

        if (d.judge) {
          c.globalAlpha = Math.min(1, d.judge.t * 3);
          c.fillStyle = d.judge.col;
          c.font = '800 26px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(d.judge.text, W / 2, HIT_Y - 60);
          c.globalAlpha = 1;
        }
        if (d.combo > 2) {
          c.fillStyle = '#ffd257';
          c.font = '800 20px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(d.combo + ' COMBO', W / 2, 60);
        }

        c.fillStyle = 'rgba(0,0,0,.4)';
        U.roundRect(c, 20, H - 34, W - 40, 14, 7); c.fill();
        c.fillStyle = d.hp > 40 ? '#34d399' : '#fb7185';
        U.roundRect(c, 20, H - 34, (W - 40) * U.clamp(d.hp / 100, 0, 1), 14, 7); c.fill();
      }
    });
  }

  window.Milo.register({
    id: 'rhythm-tap', title: 'Rhythm Tap', emo: '🎵', category: 'Casual',
    tagline: 'Four lanes, one line, keep the combo',
    description: 'Notes drop down four lanes and you hit D, F, J or K as each crosses the ' +
      'line. Timing is graded — dead centre is a PERFECT and worth well over triple a GOOD ' +
      '— and every hit extends your combo, which adds to the score of every note after it. ' +
      'Missed notes drain a health bar, and the tempo climbs the longer you last.',
    controls: ['D F J K', 'Tap the lanes'],
    colors: ['#0c0a20', '#a78bfa'],
    tags: ['rhythm', 'music', 'timing', 'combo'],
    mount: mount
  });
})();
