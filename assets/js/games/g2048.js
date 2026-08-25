/* 2048 — slide and merge to reach the 2048 tile (and keep going). */
(function () {
  'use strict';
  var N = 4;
  var TILE_COL = {
    2: ['#eee4da', '#776e65'], 4: ['#ede0c8', '#776e65'],
    8: ['#f2b179', '#fff'], 16: ['#f59563', '#fff'],
    32: ['#f67c5f', '#fff'], 64: ['#f65e3b', '#fff'],
    128: ['#edcf72', '#fff'], 256: ['#edcc61', '#fff'],
    512: ['#edc850', '#fff'], 1024: ['#edc53f', '#fff'],
    2048: ['#edc22e', '#fff']
  };

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var board, cells = [];

    function build(g) {
      var wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px';

      board = document.createElement('div');
      board.style.cssText = 'position:relative;width:min(78vw,min(56vh,420px));' +
        'aspect-ratio:1;background:#1c2044;border-radius:14px;padding:10px;' +
        'display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(4,1fr);gap:10px';

      cells = [];
      for (var i = 0; i < N * N; i++) {
        var c = document.createElement('div');
        c.style.cssText = 'border-radius:8px;display:grid;place-items:center;' +
          'font:800 clamp(14px,4.4vw,30px)/1 Outfit,sans-serif;background:rgba(255,255,255,.05);' +
          'transition:transform .1s ease';
        board.appendChild(c);
        cells.push(c);
      }

      var hint = document.createElement('div');
      hint.style.cssText = 'color:#a8b0d8;font-size:.86rem;text-align:center';
      hint.textContent = 'Arrow keys or WASD — or swipe. Equal tiles merge.';

      wrap.appendChild(board);
      wrap.appendChild(hint);
      g.root.innerHTML = '';
      g.root.appendChild(wrap);
    }

    function reset(g) {
      var d = g.data;
      d.grid = new Array(N * N).fill(0);
      d.won = false;
      d.paused = false;
      build(g);
      add(d); add(d);
      paint(g);
      g.set('Score', 0);
      g.set('Best', U.fmt(g.best));
      g.set('Top tile', 2);
    }

    function add(d) {
      var free = [];
      d.grid.forEach(function (v, i) { if (!v) free.push(i); });
      if (!free.length) return;
      d.grid[U.choice(free)] = Math.random() < 0.9 ? 2 : 4;
    }

    function paint(g) {
      var d = g.data;
      var top = 0;
      d.grid.forEach(function (v, i) {
        var c = cells[i];
        top = Math.max(top, v);
        if (!v) {
          c.textContent = '';
          c.style.background = 'rgba(255,255,255,.05)';
          c.style.color = 'transparent';
          c.style.boxShadow = 'none';
          return;
        }
        var pair = TILE_COL[v] || ['#3c3a32', '#fff'];
        c.textContent = v;
        c.style.background = pair[0];
        c.style.color = pair[1];
        c.style.fontSize = v >= 1024 ? 'clamp(11px,3.2vw,22px)' : v >= 128 ? 'clamp(13px,3.8vw,26px)' : '';
        c.style.boxShadow = v >= 128 ? '0 0 18px ' + pair[0] + '66' : 'none';
      });
      g.set('Top tile', top);
    }

    /** Slide+merge one line (already ordered from the moving edge). */
    function collapse(line) {
      var vals = line.filter(function (v) { return v; });
      var out = [], gained = 0;
      for (var i = 0; i < vals.length; i++) {
        if (vals[i] === vals[i + 1]) {
          out.push(vals[i] * 2);
          gained += vals[i] * 2;
          i++;
        } else out.push(vals[i]);
      }
      while (out.length < N) out.push(0);
      return { line: out, gained: gained };
    }

    function move(g, dir) {
      var d = g.data;
      if (g.state !== 'play' || d.paused) return;
      var before = d.grid.join(',');
      var gained = 0;

      for (var i = 0; i < N; i++) {
        var idx = [];
        for (var j = 0; j < N; j++) {
          if (dir === 'left') idx.push(i * N + j);
          else if (dir === 'right') idx.push(i * N + (N - 1 - j));
          else if (dir === 'up') idx.push(j * N + i);
          else idx.push((N - 1 - j) * N + i);
        }
        var r = collapse(idx.map(function (k) { return d.grid[k]; }));
        gained += r.gained;
        idx.forEach(function (k, n) { d.grid[k] = r.line[n]; });
      }

      if (d.grid.join(',') === before) return;

      g.score += gained;
      g.set('Score', U.fmt(g.score));
      if (gained) Milo.sound.tone({ f: 300 + Math.min(600, gained), d: .07, v: .07, type: 'square' });
      else Milo.sound.click();

      add(d);
      paint(g);

      if (!d.won && d.grid.indexOf(2048) !== -1) {
        d.won = true;
        // Reaching 2048 is a win, but it does not have to end the run — so
        // hold the board with a flag rather than moving to the 'over' state,
        // which would turn Space into "restart".
        d.paused = true;
        Milo.store.setBest('g2048', g.score);
        g.best = Milo.store.best('g2048');
        Milo.sound.win();
        g.overlay({
          emo: '🏅',
          title: 'You made 2048!',
          text: 'You can stop here — or carry on for 4096.',
          score: g.score,
          best: g.best,
          actions: [
            {
              label: 'Keep playing', primary: true,
              onClick: function () { d.paused = false; g.clearOverlay(); }
            },
            { label: 'New game', onClick: function () { g.restart(); } }
          ]
        });
        return;
      }
      if (stuck(d)) {
        g.gameOver({ text: 'No moves left. Top tile: ' + Math.max.apply(null, d.grid) + '.' });
      }
    }

    function stuck(d) {
      if (d.grid.indexOf(0) !== -1) return false;
      for (var y = 0; y < N; y++) {
        for (var x = 0; x < N; x++) {
          var v = d.grid[y * N + x];
          if (x < N - 1 && d.grid[y * N + x + 1] === v) return false;
          if (y < N - 1 && d.grid[(y + 1) * N + x] === v) return false;
        }
      }
      return true;
    }

    var runner = Milo.domGame(host, {
      id: 'g2048',
      stats: ['Score', 'Top tile', 'Best'],
      bg: '#12163a',
      emo: '🔢',
      start: {
        title: '2048',
        text: 'Slide the tiles. Two of the same number merge into one that is twice ' +
          'as big. Get to 2048 — then see how far past it you can go.',
        keys: ['Arrows / WASD', 'Swipe']
      },
      init: reset,
      onKey: function (g, e) {
        var map = {
          ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
          ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down'
        };
        if (map[e.code]) { e.preventDefault(); move(g, map[e.code]); }
      }
    });

    // Swipe support on the board itself.
    var sx = 0, sy = 0, tracking = false;
    function down(e) {
      var p = e.touches ? e.touches[0] : e;
      sx = p.clientX; sy = p.clientY; tracking = true;
    }
    function up(e) {
      if (!tracking) return;
      tracking = false;
      var p = e.changedTouches ? e.changedTouches[0] : e;
      var dx = p.clientX - sx, dy = p.clientY - sy;
      if (Math.hypot(dx, dy) < 26) return;
      if (Math.abs(dx) > Math.abs(dy)) move(runner.g, dx > 0 ? 'right' : 'left');
      else move(runner.g, dy > 0 ? 'down' : 'up');
    }
    host.addEventListener('touchstart', down, { passive: true });
    host.addEventListener('touchend', up);
    host.addEventListener('mousedown', down);
    host.addEventListener('mouseup', up);

    return runner;
  }

  window.Milo.register({
    id: 'g2048', title: '2048', emo: '🔢', category: 'Puzzle',
    tagline: 'Slide, merge, double',
    description: 'Every move slides all the tiles to one side. Two tiles with the same ' +
      'number merge into their sum, and a new tile appears after each move. Reaching ' +
      '2048 wins — but nothing stops you carrying on for 4096.',
    controls: ['Arrows', 'WASD', 'Swipe'],
    colors: ['#edc22e', '#f67c5f'],
    tags: ['numbers', 'classic', 'merge', 'brain'],
    mount: mount
  });
})();
