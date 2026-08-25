/* Memory Sequence — a grid flashes; tap it back in order. */
(function () {
  'use strict';
  var W = 560, H = 560, N = 4;
  var CELL = 116, PAD = (W - N * CELL) / 2, TOP = 70;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.level = 1;
      d.seq = [];
      d.step = 0;
      d.phase = 'show';
      d.showIdx = 0;
      d.timer = 0.6;
      d.lit = -1;
      d.lives = 3;
      grow(d);
      g.set('Level', 1);
      g.set('Lives', 3);
      g.set('Best', U.fmt(g.best));
    }

    function grow(d) {
      d.seq.push(U.randInt(0, N * N - 1));
      d.step = 0;
      d.phase = 'show';
      d.showIdx = 0;
      d.timer = 0.5;
    }

    function tap(g, i) {
      var d = g.data;
      if (d.phase !== 'input') return;
      d.lit = i;
      d.litT = 0.2;
      if (d.seq[d.step] === i) {
        Milo.sound.tone({ f: 400 + i * 30, d: .12, v: .06, type: 'sine' });
        d.step++;
        if (d.step >= d.seq.length) {
          d.level++;
          g.score = d.seq.length;
          g.set('Level', d.level);
          d.phase = 'wait';
          d.timer = 0.6;
        }
      } else {
        d.lives--;
        g.set('Lives', Math.max(0, d.lives));
        Milo.sound.hit();
        if (d.lives <= 0) {
          g.gameOver({
            emo: '🧠', title: 'Sequence broken',
            text: 'You recalled ' + (d.seq.length - 1) + ' step' + (d.seq.length - 1 === 1 ? '' : 's') + '.',
            score: d.seq.length - 1
          });
        } else {
          d.phase = 'show';
          d.showIdx = 0;
          d.step = 0;
          d.timer = 0.8;
        }
      }
    }

    return Milo.arcade(host, {
      id: 'memory-sequence',
      w: W, h: H, bg: '#0d1130',
      stats: ['Level', 'Lives', 'Best'],
      emo: '🧠',
      start: {
        title: 'Memory Sequence',
        text: 'Squares light up one after another. Tap them back in the same order. Every ' +
          'round adds one more, and you have three lives.',
        keys: ['Click the squares']
      },
      init: reset,

      onPointer: function (g, type, px, py) {
        if (type !== 'down') return;
        var x = Math.floor((px - PAD) / CELL), y = Math.floor((py - TOP) / CELL);
        if (x < 0 || y < 0 || x >= N || y >= N) return;
        tap(g, y * N + x);
      },

      update: function (g, dt) {
        var d = g.data;
        if (d.litT > 0) { d.litT -= dt; if (d.litT <= 0) d.lit = -1; }
        d.timer -= dt;
        if (d.timer > 0) return;

        if (d.phase === 'show') {
          if (d.showIdx < d.seq.length) {
            d.lit = d.seq[d.showIdx];
            d.litT = 0.4;
            Milo.sound.tone({ f: 400 + d.lit * 30, d: .35, v: .07, type: 'sine' });
            d.showIdx++;
            // Longer sequences flash a little faster, which is the real difficulty.
            d.timer = Math.max(0.28, 0.62 - d.seq.length * 0.012);
          } else {
            d.phase = 'input';
            d.timer = 999;
          }
        } else if (d.phase === 'wait') {
          grow(d);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#161b46'); bg.addColorStop(1, '#080b1e');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        for (var i = 0; i < N * N; i++) {
          var x = PAD + (i % N) * CELL, y = TOP + Math.floor(i / N) * CELL;
          var hue = 190 + (i % N) * 30 + Math.floor(i / N) * 18;
          c.fillStyle = d.lit === i ? 'hsl(' + hue + ',90%,72%)' : 'hsl(' + hue + ',45%,26%)';
          U.roundRect(c, x + 6, y + 6, CELL - 12, CELL - 12, 14); c.fill();
          if (d.lit === i) {
            c.shadowColor = 'hsl(' + hue + ',90%,65%)'; c.shadowBlur = 26;
            U.roundRect(c, x + 6, y + 6, CELL - 12, CELL - 12, 14); c.fill();
            c.shadowBlur = 0;
          }
        }

        c.fillStyle = '#dfe5ff';
        c.font = '700 16px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText(d.phase === 'show' ? 'Watch…' :
          d.phase === 'input' ? 'Repeat it (' + d.step + '/' + d.seq.length + ')' : '…', W / 2, 42);
      }
    });
  }

  window.Milo.register({
    id: 'memory-sequence', title: 'Memory Sequence', emo: '🧠', category: 'Casual',
    tagline: 'Sixteen squares, growing patterns',
    description: 'A 4×4 grid flashes a sequence of squares and you tap them back in order. ' +
      'Each round adds one more step, and longer sequences flash faster — which is what ' +
      'actually breaks people, rather than the length itself. Three lives, and a mistake ' +
      'replays the current sequence rather than ending the game.',
    controls: ['Click the squares'],
    colors: ['#0d1130', '#22d3ee'],
    tags: ['memory', 'sequence', 'brain', 'focus'],
    mount: mount
  });
})();
