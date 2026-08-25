/* Quick Math — true or false, as fast as you can read it. */
(function () {
  'use strict';
  var W = 720, H = 480;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.lives = 3;
      d.streak = 0;
      d.best = 0;
      d.answered = 0;
      d.limit = 4;
      d.timer = d.limit;
      d.flash = null;
      next(d);
      g.set('Score', 0);
      g.set('Lives', 3);
      g.set('Streak', 0);
    }

    function next(d) {
      var tier = 1 + Math.floor(d.answered / 8);
      var op = U.choice(tier < 2 ? ['+', '-'] : tier < 4 ? ['+', '-', '×'] : ['+', '-', '×', '÷']);
      var a, b, real;
      if (op === '+') { a = U.randInt(2, 15 * tier); b = U.randInt(2, 15 * tier); real = a + b; }
      else if (op === '-') { a = U.randInt(6, 18 * tier); b = U.randInt(1, a); real = a - b; }
      else if (op === '×') { a = U.randInt(2, 3 + tier * 3); b = U.randInt(2, 3 + tier * 3); real = a * b; }
      else { b = U.randInt(2, 9); var q = U.randInt(2, 9); a = b * q; real = q; }

      var lie = Math.random() < .5;
      var shown = real;
      if (lie) {
        // Wrong answers stay plausible — off by a little, never wildly.
        var off = U.choice([1, 2, 3, -1, -2, -3, 10, -10]);
        shown = real + off;
        if (shown === real) shown = real + 1;
      }
      d.q = { a: a, b: b, op: op, shown: shown, correct: shown === real };
      d.limit = Math.max(1.6, 4 - d.answered * 0.045);
      d.timer = d.limit;
    }

    function answer(g, said) {
      var d = g.data;
      if (said === d.q.correct) {
        d.streak++;
        d.best = Math.max(d.best, d.streak);
        d.answered++;
        var pts = 20 + d.streak * 4 + Math.round(d.timer * 8);
        g.score += pts;
        g.set('Score', U.fmt(g.score));
        g.set('Streak', d.streak);
        d.flash = { t: .35, text: '+' + pts, good: true };
        Milo.sound.coin();
      } else {
        d.lives--;
        d.streak = 0;
        g.set('Lives', Math.max(0, d.lives));
        g.set('Streak', 0);
        d.flash = { t: .5, text: 'Wrong', good: false };
        Milo.sound.hit();
        if (d.lives <= 0) {
          g.gameOver({
            emo: '⚡', title: 'Out of lives',
            text: d.answered + ' answered · best streak ' + d.best + '.'
          });
          return;
        }
      }
      next(d);
    }

    return Milo.arcade(host, {
      id: 'quick-math',
      w: W, h: H, bg: '#111a34',
      stats: ['Score', 'Lives', 'Streak'],
      emo: '⚡',
      start: {
        title: 'Quick Math',
        text: 'Is the sum right or wrong? Press left for true, right for false — or click ' +
          'the buttons. The clock gets shorter with every answer, and wrong ones are only ' +
          'ever off by a little.',
        keys: ['← true', '→ false']
      },
      init: reset,

      onKey: function (g, e) {
        if (e.code === 'ArrowLeft') answer(g, true);
        if (e.code === 'ArrowRight') answer(g, false);
      },

      onPointer: function (g, type, x, y) {
        if (type !== 'down' || y < H - 130) return;
        answer(g, x < W / 2);
      },

      update: function (g, dt) {
        var d = g.data;
        if (d.flash) { d.flash.t -= dt; if (d.flash.t <= 0) d.flash = null; }
        d.timer -= dt;
        if (d.timer <= 0) {
          d.lives--;
          d.streak = 0;
          g.set('Lives', Math.max(0, d.lives));
          g.set('Streak', 0);
          d.flash = { t: .5, text: 'Too slow', good: false };
          Milo.sound.hit();
          if (d.lives <= 0) {
            g.gameOver({
              emo: '⚡', title: 'Out of time',
              text: d.answered + ' answered · best streak ' + d.best + '.'
            });
            return;
          }
          next(d);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#182444');
        bg.addColorStop(1, '#080d1e');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        c.fillStyle = '#fff';
        c.font = '800 56px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText(d.q.a + ' ' + d.q.op + ' ' + d.q.b + ' = ' + d.q.shown, W / 2, 170);

        // time bar
        c.fillStyle = 'rgba(255,255,255,.10)';
        U.roundRect(c, 80, 210, W - 160, 16, 8); c.fill();
        var frac = U.clamp(d.timer / d.limit, 0, 1);
        c.fillStyle = frac > .4 ? '#34d399' : '#fb7185';
        U.roundRect(c, 80, 210, (W - 160) * frac, 16, 8); c.fill();

        if (d.flash) {
          c.globalAlpha = Math.min(1, d.flash.t * 2.5);
          c.fillStyle = d.flash.good ? '#34d399' : '#fb7185';
          c.font = '800 26px Outfit, sans-serif';
          c.fillText(d.flash.text, W / 2, 268);
          c.globalAlpha = 1;
        }

        [['TRUE  ←', 60, '#34d399'], ['→  FALSE', W / 2 + 20, '#fb7185']].forEach(function (b) {
          c.fillStyle = b[2];
          U.roundRect(c, b[1], H - 120, W / 2 - 80, 78, 14); c.fill();
          c.fillStyle = '#08131f';
          c.font = '800 22px Outfit, sans-serif';
          c.fillText(b[0], b[1] + (W / 2 - 80) / 2, H - 72);
        });
      }
    });
  }

  window.Milo.register({
    id: 'quick-math', title: 'Quick Math', emo: '⚡', category: 'Puzzle',
    tagline: 'True or false, before the bar empties',
    description: 'A sum with an answer already filled in — decide whether it is right. ' +
      'Wrong answers are deliberately close to correct, so you have to actually compute ' +
      'rather than eyeball. Your time per question shrinks as you go, and answering fast ' +
      'is worth more than answering at all.',
    controls: ['← true', '→ false', 'Click'],
    colors: ['#111a34', '#34d399'],
    tags: ['maths', 'reflex', 'timed', 'brain'],
    mount: mount
  });
})();
