/* Reaction Time — five rounds of "click when it turns green". */
(function () {
  'use strict';
  var W = 700, H = 460, ROUNDS = 5;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.phase = 'ready';           // ready | waiting | go | result | done
      d.times = [];
      d.round = 0;
      d.wait = 0;
      d.msg = 'Click to begin';
      g.set('Round', '0/' + ROUNDS);
      g.set('Last', '—');
      g.set('Average', '—');
    }

    function arm(d) {
      d.phase = 'waiting';
      d.wait = U.rand(1.2, 4.2);
      d.msg = 'Wait for green…';
    }

    function click(g) {
      var d = g.data;
      if (d.phase === 'ready' || d.phase === 'result') {
        if (d.round >= ROUNDS) return;
        arm(d);
        return;
      }
      if (d.phase === 'waiting') {
        // Jumped the gun.
        d.phase = 'result';
        d.msg = 'Too early! Click to retry this round.';
        Milo.sound.tone({ f: 150, d: .2, v: .07, type: 'square' });
        return;
      }
      if (d.phase === 'go') {
        var ms = Math.round((performance.now() - d.goAt));
        d.times.push(ms);
        d.round++;
        g.set('Round', d.round + '/' + ROUNDS);
        g.set('Last', ms + 'ms');
        var avg = Math.round(d.times.reduce(function (a, b) { return a + b; }, 0) / d.times.length);
        g.set('Average', avg + 'ms');
        Milo.sound.coin();
        if (d.round >= ROUNDS) {
          d.phase = 'done';
          // Lower is better, so the recorded score inverts the average.
          g.gameOver({
            emo: '⚡', title: avg + 'ms average',
            text: 'Times: ' + d.times.join('ms, ') + 'ms',
            score: Math.max(1, 1000 - avg)
          });
        } else {
          d.phase = 'result';
          d.msg = ms + 'ms — click for round ' + (d.round + 1);
        }
      }
    }

    return Milo.arcade(host, {
      id: 'reaction-time',
      w: W, h: H, bg: '#1b2040',
      stats: ['Round', 'Last', 'Average'],
      emo: '⚡',
      start: {
        title: 'Reaction Time',
        text: 'The screen turns red, then green at a random moment. Click the instant it ' +
          'goes green — five rounds, and your average is the score.',
        keys: ['Click or press Space']
      },
      init: reset,
      onKey: function (g, e) { if (e.code === 'Space') click(g); },
      onPointer: function (g, type) { if (type === 'down') click(g); },

      update: function (g, dt) {
        var d = g.data;
        if (d.phase !== 'waiting') return;
        d.wait -= dt;
        if (d.wait <= 0) {
          d.phase = 'go';
          d.goAt = performance.now();
          d.msg = 'CLICK!';
          Milo.sound.tone({ f: 700, d: .08, v: .06, type: 'square' });
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var col = d.phase === 'go' ? '#22c55e'
          : d.phase === 'waiting' ? '#dc2626'
            : '#1b2040';
        c.fillStyle = col; c.fillRect(0, 0, W, H);

        c.textAlign = 'center';
        c.fillStyle = '#fff';
        c.font = '800 40px Outfit, sans-serif';
        c.fillText(d.msg, W / 2, H / 2);

        if (d.times.length) {
          c.font = '600 15px Outfit, sans-serif';
          c.fillStyle = 'rgba(255,255,255,.75)';
          c.fillText(d.times.map(function (t) { return t + 'ms'; }).join('  ·  '), W / 2, H / 2 + 52);
        }
        if (d.phase === 'ready') {
          c.font = '600 14px Outfit, sans-serif';
          c.fillStyle = 'rgba(255,255,255,.5)';
          c.fillText('Anything under 250ms is quick', W / 2, H / 2 + 52);
        }
      }
    });
  }

  window.Milo.register({
    id: 'reaction-time', title: 'Reaction Time', emo: '⚡', category: 'Casual',
    tagline: 'Click the moment it turns green',
    description: 'The screen goes red, then turns green after an unpredictable pause of ' +
      'one to four seconds. Click as fast as you can once it does — clicking early makes ' +
      'you retry the round. Five rounds, averaged. Around 250 milliseconds is a good human ' +
      'result; under 200 is genuinely fast.',
    controls: ['Click', 'Space'],
    colors: ['#dc2626', '#22c55e'],
    scoreLabel: 'pts',
    tags: ['reflex', 'reaction time', 'quick', 'test'],
    mount: mount
  });
})();
