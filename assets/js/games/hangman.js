/* Hangman — guess the word before the drawing finishes. */
(function () {
  'use strict';
  var W = 760, H = 560, LIVES = 7;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util, WORDS = Milo.words;

    function reset(g) {
      var d = g.data;
      d.word = WORDS.randomGeneral(5, 10);
      d.guessed = {};
      d.wrong = 0;
      d.done = false;
      d.streak = d.streak || 0;
      d.hint = false;
      g.set('Lives', LIVES);
      g.set('Streak', d.streak);
      g.set('Word', d.word.length + ' letters');
    }

    function revealed(d) {
      return d.word.split('').every(function (ch) { return d.guessed[ch]; });
    }

    function guess(g, ch) {
      var d = g.data;
      if (d.done || d.guessed[ch] || g.state !== 'play') return;
      d.guessed[ch] = true;
      if (d.word.indexOf(ch) !== -1) {
        Milo.sound.coin();
        if (revealed(d)) {
          d.done = true;
          d.streak++;
          g.set('Streak', d.streak);
          g.win({
            emo: '🎪', title: 'Saved!',
            text: 'The word was ' + d.word.toUpperCase() + '. Streak: ' + d.streak + '.',
            score: (LIVES - d.wrong) * 100 + d.streak * 40
          });
        }
      } else {
        d.wrong++;
        g.set('Lives', Math.max(0, LIVES - d.wrong));
        Milo.sound.hit();
        if (d.wrong >= LIVES) {
          d.done = true;
          d.streak = 0;
          g.set('Streak', 0);
          g.gameOver({
            emo: '🎪', title: 'Out of guesses',
            text: 'The word was ' + d.word.toUpperCase() + '.',
            score: 0
          });
        }
      }
    }

    var ROWS = ['abcdefghi', 'jklmnopqr', 'stuvwxyz'];
    function keyRect(row, i) {
      var n = ROWS[row].length;
      var kw = 54, kh = 46, gap = 7;
      var totalW = n * kw + (n - 1) * gap;
      return { x: (W - totalW) / 2 + i * (kw + gap), y: H - 172 + row * (kh + gap), w: kw, h: kh };
    }

    return Milo.arcade(host, {
      id: 'hangman',
      w: W, h: H, bg: '#141a38',
      stats: ['Lives', 'Streak', 'Word'],
      emo: '🎪',
      start: {
        title: 'Hangman',
        text: 'Guess the hidden word one letter at a time. Seven wrong guesses and the ' +
          'drawing is finished — and so are you.',
        keys: ['Type a letter', 'Or click the keyboard']
      },
      preload: function (g) { g.data.streak = 0; },
      init: reset,
      onKey: function (g, e) {
        if (/^[a-zA-Z]$/.test(e.key)) guess(g, e.key.toLowerCase());
      },
      onPointer: function (g, type, x, y) {
        if (type !== 'down') return;
        for (var r = 0; r < ROWS.length; r++) {
          for (var i = 0; i < ROWS[r].length; i++) {
            var k = keyRect(r, i);
            if (x >= k.x && x <= k.x + k.w && y >= k.y && y <= k.y + k.h) {
              guess(g, ROWS[r][i]);
              return;
            }
          }
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#1b2149'); bg.addColorStop(1, '#0b0e22');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        // gallows and figure — one stroke per wrong guess
        var ox = 150, oy = 60;
        c.strokeStyle = '#c98a4b'; c.lineWidth = 8; c.lineCap = 'round';
        c.beginPath();
        c.moveTo(ox - 60, oy + 230); c.lineTo(ox + 40, oy + 230);
        c.moveTo(ox - 10, oy + 230); c.lineTo(ox - 10, oy);
        c.lineTo(ox + 90, oy); c.lineTo(ox + 90, oy + 30);
        c.stroke();

        c.strokeStyle = '#e6ecff'; c.lineWidth = 5;
        var parts = [
          function () { c.beginPath(); c.arc(ox + 90, oy + 54, 24, 0, 7); c.stroke(); },
          function () { c.beginPath(); c.moveTo(ox + 90, oy + 78); c.lineTo(ox + 90, oy + 150); c.stroke(); },
          function () { c.beginPath(); c.moveTo(ox + 90, oy + 96); c.lineTo(ox + 58, oy + 124); c.stroke(); },
          function () { c.beginPath(); c.moveTo(ox + 90, oy + 96); c.lineTo(ox + 122, oy + 124); c.stroke(); },
          function () { c.beginPath(); c.moveTo(ox + 90, oy + 150); c.lineTo(ox + 62, oy + 196); c.stroke(); },
          function () { c.beginPath(); c.moveTo(ox + 90, oy + 150); c.lineTo(ox + 118, oy + 196); c.stroke(); },
          function () {
            c.strokeStyle = '#fb7185';
            c.beginPath();
            c.moveTo(ox + 82, oy + 48); c.lineTo(ox + 88, oy + 54);
            c.moveTo(ox + 88, oy + 48); c.lineTo(ox + 82, oy + 54);
            c.moveTo(ox + 94, oy + 48); c.lineTo(ox + 100, oy + 54);
            c.moveTo(ox + 100, oy + 48); c.lineTo(ox + 94, oy + 54);
            c.stroke();
          }
        ];
        for (var p = 0; p < Math.min(d.wrong, parts.length); p++) parts[p]();

        // the word
        var letters = d.word.split('');
        var lw = 40, gap = 10;
        var totalW = letters.length * lw + (letters.length - 1) * gap;
        var sx = W - 60 - totalW;
        if (sx < 340) sx = 340;
        letters.forEach(function (ch, i) {
          var x = sx + i * (lw + gap);
          var known = d.guessed[ch] || d.done;
          c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 3;
          c.beginPath(); c.moveTo(x, 210); c.lineTo(x + lw, 210); c.stroke();
          if (known) {
            c.fillStyle = d.guessed[ch] ? '#22d3ee' : '#fb7185';
            c.font = '800 30px Outfit, sans-serif';
            c.textAlign = 'center';
            c.fillText(ch.toUpperCase(), x + lw / 2, 202);
          }
        });

        for (var r = 0; r < ROWS.length; r++) {
          for (var i = 0; i < ROWS[r].length; i++) {
            var ch = ROWS[r][i], k = keyRect(r, i);
            var used = d.guessed[ch];
            var good = used && d.word.indexOf(ch) !== -1;
            c.fillStyle = good ? '#34d399' : used ? '#232848' : '#3a4275';
            U.roundRect(c, k.x, k.y, k.w, k.h, 8); c.fill();
            c.fillStyle = used && !good ? 'rgba(255,255,255,.35)' : '#fff';
            c.font = '700 19px Outfit, sans-serif';
            c.textAlign = 'center';
            c.fillText(ch.toUpperCase(), k.x + k.w / 2, k.y + k.h / 2 + 7);
          }
        }
      }
    });
  }

  window.Milo.register({
    id: 'hangman', title: 'Hangman', emo: '🎪', category: 'Word',
    tagline: 'Guess the word, save the stick figure',
    description: 'A hidden word and one letter at a time. Every wrong guess adds another ' +
      'line to the drawing, and after seven you are out. Type on your keyboard or click the ' +
      'on-screen one; correct letters fill in everywhere they appear. Consecutive saves build a streak.',
    controls: ['Type a letter', 'Click the keyboard'],
    colors: ['#141a38', '#c98a4b'],
    tags: ['word', 'guessing', 'classic', 'family'],
    mount: mount
  });
})();
