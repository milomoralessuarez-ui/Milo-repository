/* Anagram Hunt — unscramble as many words as you can in 90 seconds. */
(function () {
  'use strict';
  var W = 760, H = 480, TIME = 90;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util, WORDS = Milo.words;

    function reset(g) {
      var d = g.data;
      d.time = TIME;
      d.solved = 0;
      d.skipped = 0;
      d.streak = 0;
      d.typed = '';
      d.flash = null;
      next(d);
      g.set('Score', 0);
      g.set('Time', TIME);
      g.set('Solved', 0);
    }

    function next(d) {
      d.word = WORDS.randomGeneral(5, 8);
      var letters = d.word.split('');
      // Reshuffle until it actually looks scrambled.
      for (var i = 0; i < 20 && letters.join('') === d.word; i++) U.shuffle(letters);
      d.scramble = letters.join('');
      d.typed = '';
    }

    function submit(g) {
      var d = g.data;
      if (d.typed === d.word) {
        d.solved++;
        d.streak++;
        var pts = 50 + d.word.length * 10 + d.streak * 5;
        g.score += pts;
        g.set('Score', U.fmt(g.score));
        g.set('Solved', d.solved);
        d.flash = { t: .6, text: '+' + pts, good: true };
        Milo.sound.coin();
        next(d);
      } else {
        d.streak = 0;
        d.flash = { t: .6, text: 'Not it', good: false };
        Milo.sound.tone({ f: 160, d: .1, v: .06, type: 'square' });
        d.typed = '';
      }
    }

    function skip(g) {
      var d = g.data;
      d.skipped++;
      d.streak = 0;
      d.flash = { t: .8, text: d.word.toUpperCase(), good: false };
      d.time = Math.max(0, d.time - 3);
      Milo.sound.click();
      next(d);
    }

    return Milo.arcade(host, {
      id: 'anagram-hunt',
      w: W, h: H, bg: '#171a3d',
      stats: ['Score', 'Time', 'Solved'],
      emo: '🔠',
      start: {
        title: 'Anagram Hunt',
        text: 'Ninety seconds to unscramble as many words as you can. Longer words and ' +
          'consecutive solves are worth more. Skipping costs three seconds.',
        keys: ['Type the word', 'Enter to submit', 'Tab to skip']
      },
      init: reset,

      onKey: function (g, e) {
        var d = g.data;
        if (e.key === 'Enter') { submit(g); return; }
        if (e.key === 'Backspace') { d.typed = d.typed.slice(0, -1); return; }
        if (e.key === 'Tab') { e.preventDefault(); skip(g); return; }
        if (/^[a-zA-Z]$/.test(e.key) && d.typed.length < 14) d.typed += e.key.toLowerCase();
      },
      onPointer: function (g, type, x, y) {
        if (type === 'down' && y > H - 74 && x > W / 2 - 70 && x < W / 2 + 70) skip(g);
      },

      update: function (g, dt) {
        var d = g.data;
        if (d.flash) { d.flash.t -= dt; if (d.flash.t <= 0) d.flash = null; }
        d.time -= dt;
        g.set('Time', Math.max(0, Math.ceil(d.time)));
        if (d.time <= 0) {
          g.gameOver({
            emo: '⏰', title: 'Time!',
            text: d.solved + ' solved, ' + d.skipped + ' skipped.'
          });
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#212657'); bg.addColorStop(1, '#0d1029');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        // scrambled letters as tiles
        var n = d.scramble.length, tw = 58, gap = 10;
        var sx = (W - (n * tw + (n - 1) * gap)) / 2;
        for (var i = 0; i < n; i++) {
          var x = sx + i * (tw + gap);
          c.fillStyle = '#3a4275';
          U.roundRect(c, x, 120, tw, tw, 10); c.fill();
          c.fillStyle = '#fff';
          c.font = '800 30px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(d.scramble[i].toUpperCase(), x + tw / 2, 120 + tw / 2 + 11);
        }

        // what you've typed
        c.fillStyle = 'rgba(255,255,255,.08)';
        U.roundRect(c, W / 2 - 200, 232, 400, 62, 12); c.fill();
        c.fillStyle = d.typed ? '#22d3ee' : 'rgba(255,255,255,.3)';
        c.font = '800 30px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText(d.typed.toUpperCase() || 'TYPE HERE', W / 2, 274);

        if (d.flash) {
          c.globalAlpha = Math.min(1, d.flash.t * 2);
          c.fillStyle = d.flash.good ? '#34d399' : '#fb7185';
          c.font = '800 24px Outfit, sans-serif';
          c.fillText(d.flash.text, W / 2, 330);
          c.globalAlpha = 1;
        }

        if (d.streak > 1) {
          c.fillStyle = '#ffd257';
          c.font = '700 15px Outfit, sans-serif';
          c.fillText('STREAK ×' + d.streak, W / 2, 84);
        }

        c.fillStyle = 'rgba(255,255,255,.14)';
        U.roundRect(c, W / 2 - 70, H - 74, 140, 42, 10); c.fill();
        c.fillStyle = '#fff';
        c.font = '700 14px Outfit, sans-serif';
        c.fillText('Skip (−3s)', W / 2, H - 47);
      }
    });
  }

  window.Milo.register({
    id: 'anagram-hunt', title: 'Anagram Hunt', emo: '🔠', category: 'Word',
    tagline: 'Unscramble against the clock',
    description: 'Ninety seconds, one scrambled word at a time. Type the answer and hit ' +
      'Enter. Longer words pay more and consecutive solves build a streak bonus, but every ' +
      'skip costs you three seconds off the clock.',
    controls: ['Type', 'Enter', 'Tab to skip'],
    colors: ['#171a3d', '#22d3ee'],
    tags: ['word', 'timed', 'typing', 'brain'],
    mount: mount
  });
})();
