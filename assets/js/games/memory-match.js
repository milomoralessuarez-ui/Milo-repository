/* Memory Match — find the pairs; fewer flips is better. */
(function () {
  'use strict';
  var ICONS = ['🍕', '🚀', '🐙', '🌵', '🎧', '🦊', '⚡', '🍩', '🎲', '🌙', '🐝', '🔮',
    '🍉', '🎈', '🐳', '🧊', '🌻', '🪐'];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var cards = [];

    function layoutFor(level) {
      // 3x4, 4x4, 4x5, 4x6, 5x6 …
      var layouts = [[4, 3], [4, 4], [5, 4], [6, 4], [6, 5], [7, 4], [8, 4]];
      return layouts[Math.min(layouts.length - 1, level - 1)];
    }

    function reset(g) {
      var d = g.data;
      d.level = d.level || 1;
      var lay = layoutFor(d.level);
      d.cols = lay[0]; d.rows = lay[1];
      var pairs = (d.cols * d.rows) / 2;
      var picked = U.shuffle(ICONS.slice()).slice(0, pairs);
      d.deck = U.shuffle(picked.concat(picked));
      d.flipped = [];
      d.found = [];
      d.moves = 0;
      d.time = 0;
      d.busy = false;
      d.done = false;
      build(g);
      g.set('Level', d.level);
      g.set('Moves', 0);
      g.set('Pairs', '0/' + pairs);
    }

    function build(g) {
      var d = g.data;
      var wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px';
      var grid = document.createElement('div');
      grid.style.cssText = 'display:grid;gap:8px;' +
        'grid-template-columns:repeat(' + d.cols + ',1fr);' +
        'width:min(94vw,' + (d.cols * 84) + 'px)';
      cards = [];
      for (var i = 0; i < d.deck.length; i++) {
        var b = document.createElement('button');
        b.type = 'button';
        b.dataset.i = i;
        b.style.cssText = 'aspect-ratio:3/4;border:0;border-radius:10px;cursor:pointer;padding:0;' +
          'font-size:clamp(18px,4.6vw,34px);display:grid;place-items:center;' +
          'background:linear-gradient(140deg,#7c5cff,#4d8cff);color:transparent;' +
          'transition:background .2s,transform .16s,color .12s';
        grid.appendChild(b);
        cards.push(b);
      }
      grid.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (b) flip(g, +b.dataset.i);
      });
      var hint = document.createElement('div');
      hint.style.cssText = 'color:#a8b0d8;font-size:.86rem';
      hint.textContent = 'Turn over two cards. Match them and they stay.';
      wrap.appendChild(grid);
      wrap.appendChild(hint);
      g.root.innerHTML = '';
      g.root.appendChild(wrap);
      paint(g);
    }

    function paint(g) {
      var d = g.data;
      d.deck.forEach(function (icon, i) {
        var b = cards[i];
        var open = d.flipped.indexOf(i) !== -1 || d.found.indexOf(i) !== -1;
        var matched = d.found.indexOf(i) !== -1;
        b.textContent = icon;
        b.style.color = open ? '#fff' : 'transparent';
        b.style.background = matched ? 'linear-gradient(140deg,#34d399,#22d3ee)'
          : open ? '#232a58' : 'linear-gradient(140deg,#7c5cff,#4d8cff)';
        b.style.transform = open ? 'rotateY(0deg) scale(1)' : 'scale(1)';
        b.style.opacity = matched ? '.72' : '1';
        b.style.cursor = open ? 'default' : 'pointer';
      });
    }

    function flip(g, i) {
      var d = g.data;
      if (g.state !== 'play' || d.busy || d.done) return;
      if (d.flipped.indexOf(i) !== -1 || d.found.indexOf(i) !== -1) return;
      if (d.flipped.length >= 2) return;

      d.flipped.push(i);
      Milo.sound.blip();
      paint(g);

      if (d.flipped.length < 2) return;

      d.moves++;
      g.set('Moves', d.moves);
      var a = d.flipped[0], b = d.flipped[1];

      if (d.deck[a] === d.deck[b]) {
        d.found.push(a, b);
        d.flipped = [];
        Milo.sound.coin();
        paint(g);
        g.set('Pairs', (d.found.length / 2) + '/' + (d.deck.length / 2));
        if (d.found.length === d.deck.length) win(g);
      } else {
        d.busy = true;
        Milo.sound.tone({ f: 200, d: .1, v: .06, type: 'square' });
        setTimeout(function () {
          d.flipped = [];
          d.busy = false;
          paint(g);
        }, 700);
      }
    }

    function win(g) {
      var d = g.data;
      d.done = true;
      var perfect = d.deck.length / 2;
      var earned = Math.max(60, (600 - (d.moves - perfect) * 18 - Math.round(d.time) * 3)) * d.level;
      g.score += earned;
      Milo.sound.win();
      d.level++;
      g.overlay({
        emo: '🃏',
        title: 'All pairs found!',
        text: d.moves + ' flips in ' + U.time(d.time) + ' — worth ' + U.fmt(earned) + ' points.',
        score: g.score,
        best: g.best,
        newBest: Milo.store.setBest('memory-match', g.score),
        actions: [
          { label: 'Bigger board →', primary: true, onClick: function () { next(g); } },
          { label: 'Start over', onClick: function () { g.data.level = 1; g.restart(); } }
        ]
      });
    }

    function next(g) {
      g.clearOverlay();
      var keepScore = g.score, keepLevel = g.data.level;
      reset(g);
      g.data.level = keepLevel;
      g.score = keepScore;
      g.state = 'play';
      g.set('Level', keepLevel);
      g.best = Milo.store.best('memory-match');
    }

    return Milo.domGame(host, {
      id: 'memory-match',
      stats: ['Level', 'Moves', 'Pairs'],
      bg: '#111536',
      emo: '🃏',
      start: {
        title: 'Memory Match',
        text: 'Turn over two cards at a time and remember what you saw. Match every ' +
          'pair to move up to a bigger board.',
        keys: ['Click a card']
      },
      preload: function (g) { g.data.level = 1; },
      init: reset,
      update: function (g, dt) {
        var d = g.data;
        if (!d.done) d.time += dt;
      }
    });
  }

  window.Milo.register({
    id: 'memory-match', title: 'Memory Match', emo: '🃏', category: 'Casual',
    tagline: 'Find every pair from memory',
    description: 'Cards start face down. Turn two over — if they match they stay up, ' +
      'otherwise they flip back and you have to remember where they were. Clear the ' +
      'board and the next level deals a bigger one. Fewer flips and less time score higher.',
    controls: ['Click a card'],
    colors: ['#7c5cff', '#34d399'],
    tags: ['memory', 'cards', 'relaxing', 'levels'],
    mount: mount
  });
})();
