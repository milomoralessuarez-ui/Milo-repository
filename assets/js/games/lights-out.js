/* Lights Out — every tap flips a plus-shape; turn the whole grid off. */
(function () {
  'use strict';
  var N = 5;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var cells = [];

    function reset(g) {
      var d = g.data;
      d.level = d.level || 1;
      d.on = new Array(N * N).fill(false);
      d.moves = 0;
      d.done = false;
      // Generate by starting solved and applying random taps — always solvable.
      var taps = Math.min(14, 3 + d.level * 2);
      for (var i = 0; i < taps; i++) flip(d, U.randInt(0, N * N - 1));
      if (d.on.every(function (v) { return !v; })) flip(d, U.randInt(0, N * N - 1));
      build(g);
      paint(g);
      g.set('Level', d.level);
      g.set('Moves', 0);
      g.set('Best', g.best ? U.fmt(g.best) : '—');
    }

    function flip(d, i) {
      var x = i % N, y = (i / N) | 0;
      [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (o) {
        var nx = x + o[0], ny = y + o[1];
        if (nx < 0 || ny < 0 || nx >= N || ny >= N) return;
        var k = ny * N + nx;
        d.on[k] = !d.on[k];
      });
    }

    function build(g) {
      var wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px';
      var grid = document.createElement('div');
      grid.style.cssText = 'width:min(80vw,min(58vh,400px));aspect-ratio:1;display:grid;gap:9px;' +
        'grid-template-columns:repeat(' + N + ',1fr);grid-template-rows:repeat(' + N + ',1fr)';
      cells = [];
      for (var i = 0; i < N * N; i++) {
        var b = document.createElement('button');
        b.type = 'button';
        b.dataset.i = i;
        b.style.cssText = 'border:0;border-radius:12px;cursor:pointer;padding:0;' +
          'transition:background .14s,box-shadow .14s,transform .08s';
        grid.appendChild(b);
        cells.push(b);
      }
      grid.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (b) tap(g, +b.dataset.i);
      });
      var hint = document.createElement('div');
      hint.style.cssText = 'color:#a8b0d8;font-size:.86rem;text-align:center;max-width:34ch';
      hint.textContent = 'Tapping a light also flips the four around it. Turn them all off.';
      wrap.appendChild(grid);
      wrap.appendChild(hint);
      g.root.innerHTML = '';
      g.root.appendChild(wrap);
    }

    function paint(g) {
      g.data.on.forEach(function (v, i) {
        var b = cells[i];
        b.style.background = v ? 'linear-gradient(140deg,#ffd257,#f59e0b)' : '#1c2149';
        b.style.boxShadow = v ? '0 0 22px rgba(255,210,87,.55)' : 'inset 0 0 0 1px rgba(255,255,255,.05)';
      });
    }

    function tap(g, i) {
      var d = g.data;
      if (g.state !== 'play' || d.done) return;
      flip(d, i);
      d.moves++;
      g.set('Moves', d.moves);
      Milo.sound.blip();
      paint(g);
      if (d.on.every(function (v) { return !v; })) {
        d.done = true;
        Milo.sound.win();
        var earned = Math.max(20, 300 - d.moves * 8) * d.level;
        g.score += earned;
        d.level++;
        g.overlay({
          emo: '💡',
          title: 'Lights out!',
          text: 'Cleared in ' + d.moves + ' move' + (d.moves === 1 ? '' : 's') +
            ' — worth ' + U.fmt(earned) + ' points.',
          score: g.score,
          best: g.best,
          newBest: Milo.store.setBest('lights-out', g.score),
          actions: [
            { label: 'Next level →', primary: true, onClick: function () { nextLevel(g); } },
            { label: 'Start over', onClick: function () { g.data.level = 1; g.restart(); } }
          ]
        });
      }
    }

    function nextLevel(g) {
      g.clearOverlay();
      g.state = 'play';
      var keepScore = g.score;
      var keepLevel = g.data.level;
      reset(g);
      g.score = keepScore;
      g.data.level = keepLevel;
      g.set('Level', keepLevel);
      g.best = Milo.store.best('lights-out');
    }

    return Milo.domGame(host, {
      id: 'lights-out',
      stats: ['Level', 'Moves', 'Best'],
      bg: '#0d1130',
      emo: '💡',
      start: {
        title: 'Lights Out',
        text: 'Tap a light and it flips — along with the four lights touching it. ' +
          'Switch every light off to clear the level. Each level starts more tangled.',
        keys: ['Click / tap a light']
      },
      preload: function (g) { g.data.level = 1; },
      init: reset
    });
  }

  window.Milo.register({
    id: 'lights-out', title: 'Lights Out', emo: '💡', category: 'Puzzle',
    tagline: 'Switch off every light',
    description: 'A 5×5 grid of lights. Tapping one toggles it and its four neighbours, ' +
      'so undoing a mistake is rarely as simple as tapping again. Clear the board to move ' +
      'up a level — and the fewer moves you use, the more the level is worth.',
    controls: ['Click', 'Tap'],
    colors: ['#ffd257', '#f59e0b'],
    tags: ['logic', 'brain', 'levels', 'relaxing'],
    mount: mount
  });
})();
