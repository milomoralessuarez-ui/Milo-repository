/* Word Ladder — change one letter at a time to reach the target word. */
(function () {
  'use strict';
  var W = 700, H = 560;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util, WORDS = Milo.words;

    /** Words reachable from `w` by changing exactly one letter. */
    function neighbours(w) {
      return WORDS.five.filter(function (o) {
        var diff = 0;
        for (var i = 0; i < 5; i++) if (o[i] !== w[i]) diff++;
        return diff === 1;
      });
    }

    /** Breadth-first search for a start/target pair a set distance apart. */
    function makePuzzle(steps) {
      for (var attempt = 0; attempt < 60; attempt++) {
        var start = WORDS.randomFive();
        var seen = Object.create(null);
        seen[start] = 0;
        var frontier = [start], depth = 0, layer = [start];
        while (depth < steps && frontier.length) {
          var next = [];
          frontier.forEach(function (w) {
            neighbours(w).forEach(function (o) {
              if (seen[o] == null) { seen[o] = depth + 1; next.push(o); }
            });
          });
          if (!next.length) break;
          frontier = next;
          layer = next;
          depth++;
        }
        if (depth === steps && layer.length) {
          return { start: start, target: U.choice(layer), par: steps };
        }
      }
      return { start: 'stone', target: 'stony', par: 1 };
    }

    function reset(g) {
      var d = g.data;
      d.level = d.level || 1;
      var puzzle = makePuzzle(Math.min(5, 2 + Math.floor(d.level / 2)));
      d.start = puzzle.start;
      d.target = puzzle.target;
      d.par = puzzle.par;
      d.chain = [d.start];
      d.typed = '';
      d.msg = 'Change one letter at a time';
      d.done = false;
      g.set('Level', d.level);
      g.set('Steps', 0);
      g.set('Par', d.par);
    }

    function submit(g) {
      var d = g.data;
      var w = d.typed;
      d.typed = '';
      if (w.length !== 5) { d.msg = 'Five letters, please'; return; }
      if (!WORDS.fiveSet[w]) { d.msg = w.toUpperCase() + ' is not in the word list'; Milo.sound.tone({ f: 150, d: .1, v: .05, type: 'square' }); return; }
      var last = d.chain[d.chain.length - 1];
      var diff = 0;
      for (var i = 0; i < 5; i++) if (w[i] !== last[i]) diff++;
      if (diff !== 1) { d.msg = 'Exactly one letter must change'; Milo.sound.tone({ f: 150, d: .1, v: .05, type: 'square' }); return; }
      if (d.chain.indexOf(w) !== -1) { d.msg = 'You have already used that word'; return; }

      d.chain.push(w);
      g.set('Steps', d.chain.length - 1);
      Milo.sound.blip();
      d.msg = '';

      if (w === d.target) {
        d.done = true;
        var steps = d.chain.length - 1;
        var bonus = Math.max(0, d.par - steps + 1) * 200;
        g.score += 300 + bonus;
        Milo.sound.win();
        d.level++;
        g.overlay({
          emo: '🪜',
          title: 'Reached ' + d.target.toUpperCase() + '!',
          text: steps + ' step' + (steps === 1 ? '' : 's') + ' (par ' + d.par + ')',
          score: g.score,
          best: g.best,
          newBest: Milo.store.setBest('word-ladder', g.score),
          actions: [
            { label: 'Next ladder →', primary: true, onClick: function () { nextLevel(g); } },
            { label: 'Start over', onClick: function () { g.data.level = 1; g.restart(); } }
          ]
        });
      }
    }

    function nextLevel(g) {
      g.clearOverlay();
      var keepScore = g.score, keepLevel = g.data.level;
      reset(g);
      g.data.level = keepLevel;
      g.score = keepScore;
      g.state = 'play';
      g.set('Level', keepLevel);
      g.best = Milo.store.best('word-ladder');
    }

    return Milo.arcade(host, {
      id: 'word-ladder',
      w: W, h: H, bg: '#132a3d',
      stats: ['Level', 'Steps', 'Par'],
      emo: '🪜',
      start: {
        title: 'Word Ladder',
        text: 'Get from the first word to the last by changing a single letter at a time. ' +
          'Every rung has to be a real word. Beat par for a bonus.',
        keys: ['Type a word', 'Enter to add a rung', 'Backspace to undo']
      },
      preload: function (g) { g.data.level = 1; },
      init: reset,

      onKey: function (g, e) {
        var d = g.data;
        if (d.done) return;
        if (e.key === 'Enter') { submit(g); return; }
        if (e.key === 'Backspace') {
          if (d.typed) d.typed = d.typed.slice(0, -1);
          else if (d.chain.length > 1) {
            d.chain.pop();
            g.set('Steps', d.chain.length - 1);
          }
          return;
        }
        if (/^[a-zA-Z]$/.test(e.key) && d.typed.length < 5) d.typed += e.key.toLowerCase();
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#16344b'); bg.addColorStop(1, '#0a1a26');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        function word(text, y, style) {
          var tw = 46, gap = 8;
          var sx = (W - (5 * tw + 4 * gap)) / 2;
          for (var i = 0; i < 5; i++) {
            var x = sx + i * (tw + gap);
            c.fillStyle = style === 'target' ? '#34d399'
              : style === 'typing' ? 'rgba(34,211,238,.22)' : 'rgba(255,255,255,.10)';
            U.roundRect(c, x, y, tw, tw, 8); c.fill();
            if (text[i]) {
              c.fillStyle = style === 'target' ? '#062a1a' : '#fff';
              c.font = '800 24px Outfit, sans-serif';
              c.textAlign = 'center';
              c.fillText(text[i].toUpperCase(), x + tw / 2, y + tw / 2 + 9);
            }
          }
        }

        c.fillStyle = 'rgba(255,255,255,.5)';
        c.font = '700 12px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText('TARGET', W / 2, 42);
        word(d.target, 52, 'target');

        var startY = 128;
        var maxShow = 5;
        var shown = d.chain.slice(-maxShow);
        shown.forEach(function (w, i) {
          word(w, startY + i * 58, 'chain');
        });
        word(d.typed, startY + shown.length * 58, 'typing');

        c.fillStyle = d.msg ? '#fb7185' : 'rgba(255,255,255,.4)';
        c.font = '600 14px Outfit, sans-serif';
        c.fillText(d.msg || 'Type a word and press Enter · Backspace removes the last rung',
          W / 2, H - 24);
      }
    });
  }

  window.Milo.register({
    id: 'word-ladder', title: 'Word Ladder', emo: '🪜', category: 'Word',
    tagline: 'One letter at a time to the target',
    description: 'Climb from the starting word to the target by changing exactly one ' +
      'letter per step — and every rung has to be a real five-letter word. Each puzzle is ' +
      'generated by searching outwards from a random word, so par is the true shortest ' +
      'route; matching or beating it pays a bonus.',
    controls: ['Type', 'Enter', 'Backspace'],
    colors: ['#132a3d', '#34d399'],
    tags: ['word', 'brain', 'puzzle', 'levels'],
    mount: mount
  });
})();
