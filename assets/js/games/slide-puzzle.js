/* Slide Puzzle — the classic 15-puzzle, always shuffled into a solvable state. */
(function () {
  'use strict';
  var N = 4;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var tiles = [];

    function reset(g) {
      var d = g.data;
      d.board = [];
      for (var i = 0; i < N * N - 1; i++) d.board.push(i + 1);
      d.board.push(0);                       // 0 is the empty slot
      d.moves = 0;
      d.time = 0;
      d.solved = false;
      shuffle(d);
      build(g);
      paint(g);
      g.set('Moves', 0);
      g.set('Time', '0:00');
      g.set('Best', g.best ? U.fmt(g.best) : '—');
    }

    /** Shuffle by walking the blank around, which can only reach solvable states. */
    function shuffle(d) {
      var blank = N * N - 1;
      for (var n = 0; n < 400; n++) {
        var opts = neighbours(blank);
        var pick = U.choice(opts);
        d.board[blank] = d.board[pick];
        d.board[pick] = 0;
        blank = pick;
      }
      // A shuffle that happens to land on solved would be a dull start.
      if (isSolved(d)) shuffle(d);
    }

    function neighbours(i) {
      var x = i % N, y = (i / N) | 0, out = [];
      if (x > 0) out.push(i - 1);
      if (x < N - 1) out.push(i + 1);
      if (y > 0) out.push(i - N);
      if (y < N - 1) out.push(i + N);
      return out;
    }

    function isSolved(d) {
      for (var i = 0; i < N * N - 1; i++) if (d.board[i] !== i + 1) return false;
      return true;
    }

    function build(g) {
      var wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px';
      var board = document.createElement('div');
      board.style.cssText = 'width:min(80vw,min(58vh,420px));aspect-ratio:1;background:#191d44;' +
        'border-radius:14px;padding:8px;display:grid;gap:8px;' +
        'grid-template-columns:repeat(' + N + ',1fr);grid-template-rows:repeat(' + N + ',1fr)';
      tiles = [];
      for (var i = 0; i < N * N; i++) {
        var b = document.createElement('button');
        b.type = 'button';
        b.dataset.i = i;
        b.style.cssText = 'border:0;border-radius:10px;cursor:pointer;padding:0;' +
          'font:800 clamp(16px,5vw,32px)/1 Outfit,sans-serif;display:grid;place-items:center;' +
          'transition:background .12s,transform .08s';
        board.appendChild(b);
        tiles.push(b);
      }
      board.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (b) tap(g, +b.dataset.i);
      });
      var hint = document.createElement('div');
      hint.style.cssText = 'color:#a8b0d8;font-size:.86rem';
      hint.textContent = 'Click a tile next to the gap — or use the arrow keys.';
      wrap.appendChild(board);
      wrap.appendChild(hint);
      g.root.innerHTML = '';
      g.root.appendChild(wrap);
    }

    function paint(g) {
      var d = g.data;
      d.board.forEach(function (v, i) {
        var b = tiles[i];
        if (!v) {
          b.textContent = '';
          b.style.background = 'rgba(255,255,255,.04)';
          b.style.cursor = 'default';
          return;
        }
        b.textContent = v;
        b.style.cursor = 'pointer';
        var right = v === i + 1;
        b.style.background = right
          ? 'linear-gradient(140deg,#34d399,#22d3ee)'
          : 'linear-gradient(140deg,#7c5cff,#4d8cff)';
        b.style.color = '#fff';
      });
    }

    function tap(g, i) {
      var d = g.data;
      if (g.state !== 'play' || d.solved) return;
      var blank = d.board.indexOf(0);
      if (neighbours(blank).indexOf(i) === -1) return;
      d.board[blank] = d.board[i];
      d.board[i] = 0;
      d.moves++;
      g.set('Moves', d.moves);
      Milo.sound.click();
      paint(g);
      if (isSolved(d)) {
        d.solved = true;
        // Fewer moves and less time is better, so score rewards efficiency.
        var score = Math.max(50, 4000 - d.moves * 10 - Math.round(d.time) * 5);
        g.win({
          emo: '🧩', title: 'Solved!',
          text: d.moves + ' moves in ' + U.time(d.time) + '.',
          score: score
        });
      }
    }

    /** Arrow keys slide the tile that would move *into* the gap. */
    function key(g, e) {
      var d = g.data;
      var blank = d.board.indexOf(0);
      var x = blank % N, y = (blank / N) | 0;
      var target = null;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') { if (y < N - 1) target = blank + N; }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') { if (y > 0) target = blank - N; }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') { if (x < N - 1) target = blank + 1; }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') { if (x > 0) target = blank - 1; }
      if (target != null) { e.preventDefault(); tap(g, target); }
    }

    return Milo.domGame(host, {
      id: 'slide-puzzle',
      stats: ['Moves', 'Time', 'Best'],
      bg: '#101433',
      emo: '🧩',
      start: {
        title: 'Slide Puzzle',
        text: 'Slide the numbered tiles into order, 1 to 15, with the gap ending ' +
          'bottom-right. Tiles turn green when they are home.',
        keys: ['Click a tile', 'Arrow keys']
      },
      init: reset,
      onKey: key,
      update: function (g, dt) {
        var d = g.data;
        if (d.solved) return;
        d.time += dt;
        g.set('Time', U.time(d.time));
      }
    });
  }

  window.Milo.register({
    id: 'slide-puzzle', title: 'Slide Puzzle', emo: '🧩', category: 'Puzzle',
    tagline: 'Get the 15 tiles back in order',
    description: 'The classic sliding tile puzzle. Only tiles next to the empty space ' +
      'can move, so getting a number home often means taking three others out of the way. ' +
      'Tiles glow green once they are in the right place. Solve it in fewer moves and ' +
      'less time for a higher score.',
    controls: ['Click a tile', 'Arrow keys'],
    colors: ['#7c5cff', '#34d399'],
    tags: ['classic', 'sliding', 'brain', 'logic'],
    mount: mount
  });
})();
