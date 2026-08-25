/* Typing Test — 60 seconds of words, reporting WPM and accuracy. */
(function () {
  'use strict';
  var W = 860, H = 460, TIME = 60;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util, WORDS = Milo.words;

    function reset(g) {
      var d = g.data;
      d.queue = [];
      for (var i = 0; i < 60; i++) d.queue.push(U.choice(WORDS.general));
      d.idx = 0;
      d.typed = '';
      d.time = TIME;
      d.correct = 0;
      d.wrong = 0;
      d.chars = 0;
      d.started = false;
      d.errors = 0;
      g.set('WPM', 0);
      g.set('Time', TIME);
      g.set('Accuracy', '100%');
    }

    function wpm(d) {
      var elapsed = TIME - d.time;
      if (elapsed < 1) return 0;
      // Standard definition: five characters counts as one word.
      return Math.round((d.chars / 5) / (elapsed / 60));
    }

    function commitWord(g) {
      var d = g.data;
      var target = d.queue[d.idx];
      if (d.typed === target) { d.correct++; d.chars += target.length + 1; Milo.sound.blip(); }
      else { d.wrong++; Milo.sound.tone({ f: 150, d: .06, v: .04, type: 'square' }); }
      d.idx++;
      d.typed = '';
      if (d.idx > d.queue.length - 20) {
        for (var i = 0; i < 30; i++) d.queue.push(U.choice(WORDS.general));
      }
      g.set('WPM', wpm(d));
      var total = d.correct + d.wrong;
      g.set('Accuracy', total ? Math.round(d.correct / total * 100) + '%' : '100%');
    }

    return Milo.arcade(host, {
      id: 'typing-test',
      w: W, h: H, bg: '#0f1330',
      stats: ['WPM', 'Time', 'Accuracy'],
      emo: '⌨️',
      start: {
        title: 'Typing Test',
        text: 'Type each word and press space. Sixty seconds on the clock — the timer ' +
          'starts on your first keystroke. Your score is words per minute.',
        keys: ['Just start typing', 'Space for the next word']
      },
      init: reset,

      onKey: function (g, e) {
        var d = g.data;
        if (e.key === ' ') { e.preventDefault(); if (d.typed) { d.started = true; commitWord(g); } return; }
        if (e.key === 'Backspace') { d.typed = d.typed.slice(0, -1); return; }
        if (e.key.length === 1 && /\S/.test(e.key)) {
          d.started = true;
          d.typed += e.key.toLowerCase();
          var target = d.queue[d.idx];
          if (d.typed[d.typed.length - 1] !== target[d.typed.length - 1]) d.errors++;
        }
      },

      update: function (g, dt) {
        var d = g.data;
        if (!d.started) return;
        d.time -= dt;
        g.set('Time', Math.max(0, Math.ceil(d.time)));
        g.set('WPM', wpm(d));
        if (d.time <= 0) {
          var total = d.correct + d.wrong;
          var acc = total ? Math.round(d.correct / total * 100) : 100;
          g.gameOver({
            emo: '⌨️', title: wpm(d) + ' words per minute',
            text: d.correct + ' words typed correctly at ' + acc + '% accuracy.',
            score: wpm(d)
          });
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#161b40'); bg.addColorStop(1, '#0a0d22');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        // upcoming words, current one highlighted
        c.textAlign = 'left';
        var x = 60, y = 170;
        for (var i = d.idx; i < Math.min(d.idx + 10, d.queue.length); i++) {
          var word = d.queue[i];
          c.font = (i === d.idx ? '800 30px' : '600 24px') + ' Outfit, sans-serif';
          var wdt = c.measureText(word).width;
          if (x + wdt > W - 60) { x = 60; y += 46; if (y > 260) break; }
          if (i === d.idx) {
            c.fillStyle = 'rgba(34,211,238,.16)';
            U.roundRect(c, x - 8, y - 30, wdt + 16, 44, 8); c.fill();
            // colour each character by whether it matches so far
            var cx = x;
            for (var k = 0; k < word.length; k++) {
              var typed = d.typed[k];
              c.fillStyle = typed == null ? '#e6ecff'
                : typed === word[k] ? '#34d399' : '#fb7185';
              c.fillText(word[k], cx, y);
              cx += c.measureText(word[k]).width;
            }
          } else {
            c.fillStyle = 'rgba(255,255,255,.32)';
            c.fillText(word, x, y);
          }
          x += wdt + 20;
        }

        c.fillStyle = 'rgba(255,255,255,.08)';
        U.roundRect(c, 60, 300, W - 120, 60, 12); c.fill();
        c.fillStyle = '#22d3ee';
        c.font = '700 26px Outfit, sans-serif';
        c.fillText(d.typed || '', 78, 340);
        if (!d.started) {
          c.fillStyle = 'rgba(255,255,255,.3)';
          c.font = '600 18px Outfit, sans-serif';
          c.fillText('Start typing — the clock begins on your first key', 78, 340);
        }

        c.fillStyle = 'rgba(255,255,255,.4)';
        c.font = '600 12px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText('Space submits a word · Backspace to correct', W / 2, H - 20);
      }
    });
  }

  window.Milo.register({
    id: 'typing-test', title: 'Typing Test', emo: '⌨️', category: 'Word',
    tagline: 'How fast can you actually type?',
    description: 'Sixty seconds of ordinary words. Type each one and press space; letters ' +
      'go green as you get them right and red as you get them wrong, so you can see a ' +
      'mistake before you commit it. Your score is words per minute on the standard ' +
      'five-characters-per-word measure, with accuracy reported alongside.',
    controls: ['Type', 'Space', 'Backspace'],
    colors: ['#0f1330', '#22d3ee'],
    scoreLabel: 'WPM',
    tags: ['typing', 'speed', 'word', 'skill'],
    mount: mount
  });
})();
