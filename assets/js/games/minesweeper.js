/* Minesweeper — classic sweeping with flags, chording and a timer. */
(function () {
  'use strict';
  var COLS = 16, ROWS = 14, MINES = 38;
  var NUM_COL = ['', '#60a5fa', '#34d399', '#fb7185', '#a78bfa', '#fb923c', '#22d3ee', '#e2e8f0', '#94a3b8'];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var cellEls = [];

    function reset(g) {
      var d = g.data;
      d.mine = new Array(COLS * ROWS).fill(false);
      d.open = new Array(COLS * ROWS).fill(false);
      d.flag = new Array(COLS * ROWS).fill(false);
      d.count = new Array(COLS * ROWS).fill(0);
      d.placed = false;          // mines are laid after the first click
      d.time = 0;
      d.left = MINES;
      d.done = false;
      build(g);
      g.set('Mines', MINES);
      g.set('Time', '0:00');
      g.set('Best', g.best ? U.time(g.best) : '—');
    }

    function build(g) {
      var wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px';
      var grid = document.createElement('div');
      grid.style.cssText = 'display:grid;grid-template-columns:repeat(' + COLS + ',1fr);' +
        'gap:2px;background:#1b2046;padding:6px;border-radius:10px;' +
        'width:min(94vw,min(70vh*' + (COLS / ROWS) + ',640px))';
      cellEls = [];
      for (var i = 0; i < COLS * ROWS; i++) {
        var b = document.createElement('button');
        b.type = 'button';
        b.dataset.i = i;
        b.style.cssText = 'aspect-ratio:1;border:0;border-radius:4px;cursor:pointer;' +
          'background:#2b3167;color:#fff;font:800 clamp(9px,1.8vw,15px)/1 Outfit,sans-serif;' +
          'display:grid;place-items:center;padding:0;user-select:none;-webkit-user-select:none';
        grid.appendChild(b);
        cellEls.push(b);
      }
      var hint = document.createElement('div');
      hint.style.cssText = 'color:#a8b0d8;font-size:.84rem;text-align:center';
      hint.innerHTML = 'Click to reveal · Right-click (or long-press) to flag · ' +
        'Click a number with its flags placed to clear around it';
      wrap.appendChild(grid);
      wrap.appendChild(hint);
      g.root.innerHTML = '';
      g.root.appendChild(wrap);

      grid.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      grid.addEventListener('mousedown', function (e) {
        var b = e.target.closest('button');
        if (!b) return;
        var i = +b.dataset.i;
        if (e.button === 2) toggleFlag(g, i);
        else if (e.button === 0) click(g, i);
      });

      // Long-press flags on touch.
      var timer = null, moved = false;
      grid.addEventListener('touchstart', function (e) {
        var b = e.target.closest('button');
        if (!b) return;
        moved = false;
        var i = +b.dataset.i;
        timer = setTimeout(function () { timer = null; toggleFlag(g, i); }, 380);
      }, { passive: true });
      grid.addEventListener('touchmove', function () { moved = true; });
      grid.addEventListener('touchend', function (e) {
        var b = e.target.closest('button');
        if (timer) {
          clearTimeout(timer); timer = null;
          if (b && !moved) click(g, +b.dataset.i);
        }
        if (e.cancelable) e.preventDefault();
      });
    }

    function idx(x, y) { return y * COLS + x; }
    function around(i, fn) {
      var x = i % COLS, y = (i / COLS) | 0;
      for (var dy = -1; dy <= 1; dy++) {
        for (var dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          var nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
          fn(idx(nx, ny));
        }
      }
    }

    function place(d, safe) {
      // Keep the first click and its neighbours clear so it always opens up.
      var forbidden = [safe];
      around(safe, function (n) { forbidden.push(n); });
      var pool = [];
      for (var i = 0; i < COLS * ROWS; i++) if (forbidden.indexOf(i) === -1) pool.push(i);
      U.shuffle(pool);
      for (var m = 0; m < MINES; m++) d.mine[pool[m]] = true;
      for (var k = 0; k < COLS * ROWS; k++) {
        var n = 0;
        around(k, function (j) { if (d.mine[j]) n++; });
        d.count[k] = n;
      }
      d.placed = true;
    }

    function reveal(g, i) {
      var d = g.data;
      if (d.open[i] || d.flag[i]) return;
      d.open[i] = true;
      if (d.count[i] === 0 && !d.mine[i]) around(i, function (n) { reveal(g, n); });
    }

    function click(g, i) {
      var d = g.data;
      if (d.done || g.state !== 'play') return;
      if (!d.placed) place(d, i);

      if (d.open[i]) { chord(g, i); return; }
      if (d.flag[i]) return;

      if (d.mine[i]) {
        d.done = true;
        d.open[i] = true;
        paint(g, i);
        Milo.sound.explode();
        g.gameOver({ emo: '💣', title: 'Boom', text: 'You hit a mine.', score: 0 });
        return;
      }
      reveal(g, i);
      Milo.sound.click();
      paint(g);
      checkWin(g);
    }

    /** Clicking an open number clears its neighbours if enough flags are set. */
    function chord(g, i) {
      var d = g.data;
      if (!d.count[i]) return;
      var flags = 0;
      around(i, function (n) { if (d.flag[n]) flags++; });
      if (flags !== d.count[i]) return;
      var boom = false;
      around(i, function (n) {
        if (d.flag[n] || d.open[n]) return;
        if (d.mine[n]) boom = true;
        reveal(g, n);
      });
      if (boom) {
        d.done = true;
        paint(g);
        Milo.sound.explode();
        g.gameOver({ emo: '💣', title: 'Boom', text: 'A flag was in the wrong place.', score: 0 });
        return;
      }
      paint(g);
      checkWin(g);
    }

    function toggleFlag(g, i) {
      var d = g.data;
      if (d.done || d.open[i] || g.state !== 'play') return;
      d.flag[i] = !d.flag[i];
      d.left += d.flag[i] ? -1 : 1;
      g.set('Mines', d.left);
      Milo.sound.blip();
      paint(g);
    }

    function checkWin(g) {
      var d = g.data;
      for (var i = 0; i < COLS * ROWS; i++) {
        if (!d.mine[i] && !d.open[i]) return;
      }
      d.done = true;
      // Score is time taken, so a *lower* number is better — track it separately.
      var t = Math.round(d.time);
      var prev = Milo.store.get('best:minesweeper-time', 0);
      if (!prev || t < prev) Milo.store.set('best:minesweeper-time', t);
      Milo.store.set('best:minesweeper', Math.max(0, 9999 - t));
      g.win({
        emo: '🚩', title: 'Field cleared!',
        text: 'You swept all ' + MINES + ' mines in ' + U.time(t) + '.',
        score: Math.max(0, 9999 - t)
      });
    }

    function paint(g, blownAt) {
      var d = g.data;
      for (var i = 0; i < COLS * ROWS; i++) {
        var b = cellEls[i];
        if (d.open[i]) {
          if (d.mine[i]) {
            b.textContent = '💥';
            b.style.background = i === blownAt ? '#fb7185' : '#4a2038';
          } else {
            b.textContent = d.count[i] || '';
            b.style.background = '#171c40';
            b.style.color = NUM_COL[d.count[i]] || '#fff';
          }
          b.style.cursor = 'default';
        } else if (d.flag[i]) {
          b.textContent = '🚩';
          b.style.background = '#333a72';
        } else {
          b.textContent = d.done && d.mine[i] ? '💣' : '';
          b.style.background = d.done && d.mine[i] ? '#3a2050' : '#2b3167';
        }
      }
    }

    return Milo.domGame(host, {
      id: 'minesweeper',
      stats: ['Mines', 'Time', 'Best'],
      bg: '#0f1330',
      emo: '💣',
      start: {
        title: 'Minesweeper',
        text: 'A ' + COLS + '×' + ROWS + ' field with ' + MINES + ' mines. Numbers tell ' +
          'you how many mines touch that square. Your first click is always safe.',
        keys: ['Click reveal', 'Right-click flag', 'Long-press flag']
      },
      init: reset,
      update: function (g, dt) {
        var d = g.data;
        if (d.done || !d.placed) return;
        d.time += dt;
        g.set('Time', U.time(d.time));
      }
    });
  }

  window.Milo.register({
    id: 'minesweeper', title: 'Minesweeper', emo: '💣', category: 'Puzzle',
    tagline: 'Find every mine without touching one',
    description: 'Reveal squares to uncover the field. Each number tells you how many ' +
      'of the eight neighbouring squares hide a mine — use that to work out where they ' +
      'are and flag them. Your first click is always safe, and clicking a number that ' +
      'already has enough flags around it clears the rest in one go.',
    controls: ['Click', 'Right-click flag', 'Long-press'],
    colors: ['#64748b', '#fb7185'],
    scoreLabel: 'pts',
    tags: ['logic', 'classic', 'brain', 'deduction'],
    mount: mount
  });
})();
