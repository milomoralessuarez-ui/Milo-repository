/* Letter Drop — spell words from falling letters before the stack tops out. */
(function () {
  'use strict';
  var COLS = 7, ROWS = 10, CELL = 56;
  var W = COLS * CELL + 260, H = ROWS * CELL + 40;
  var FREQ = 'aaaaaaaabbccddddeeeeeeeeeeeffgghhhiiiiiiiijkllllmmnnnnnnoooooooppqrrrrrrssssssttttttttuuuuvvwwxyyz';

  function mount(host) {
    var Milo = window.Milo, U = Milo.util, WORDS = Milo.words;

    function reset(g) {
      var d = g.data;
      d.grid = [];
      for (var y = 0; y < ROWS; y++) d.grid.push(new Array(COLS).fill(null));
      d.sel = [];
      d.fall = 0;
      d.speed = 3.4;
      d.words = 0;
      d.msg = 'Tap letters to spell a word';
      seedRows(d, 3);
      g.set('Score', 0);
      g.set('Words', 0);
      g.set('Best word', '—');
      d.bestWord = '';
    }

    function seedRows(d, n) {
      for (var i = 0; i < n; i++) addRow(d);
    }

    function addRow(d) {
      // Shift everything up one row, then fill the bottom.
      for (var y = 0; y < ROWS - 1; y++) d.grid[y] = d.grid[y + 1];
      d.grid[ROWS - 1] = [];
      for (var x = 0; x < COLS; x++) {
        d.grid[ROWS - 1].push({ ch: FREQ[U.randInt(0, FREQ.length - 1)] });
      }
      d.sel = [];
    }

    function topRowFull(d) {
      return d.grid[0].some(function (c) { return c; });
    }

    function selWord(d) {
      return d.sel.map(function (p) { return d.grid[p.y][p.x].ch; }).join('');
    }

    function adjacent(a, b) {
      return Math.abs(a.x - b.x) <= 1 && Math.abs(a.y - b.y) <= 1 && !(a.x === b.x && a.y === b.y);
    }

    function submit(g) {
      var d = g.data;
      var word = selWord(d);
      if (word.length < 3) { d.msg = 'Words need at least three letters'; d.sel = []; return; }
      var ok = WORDS.fiveSet[word] || WORDS.general.indexOf(word) !== -1;
      if (!ok) {
        d.msg = word.toUpperCase() + ' is not in the word list';
        d.sel = [];
        Milo.sound.tone({ f: 150, d: .1, v: .05, type: 'square' });
        return;
      }
      // Clear the used tiles and let the columns settle.
      d.sel.forEach(function (p) { d.grid[p.y][p.x] = null; });
      for (var x = 0; x < COLS; x++) {
        var col = [];
        for (var y = ROWS - 1; y >= 0; y--) if (d.grid[y][x]) col.push(d.grid[y][x]);
        for (var y2 = ROWS - 1, k = 0; y2 >= 0; y2--, k++) d.grid[y2][x] = col[k] || null;
      }
      var pts = word.length * word.length * 12;
      g.score += pts;
      d.words++;
      if (word.length > d.bestWord.length) { d.bestWord = word; g.set('Best word', word.toUpperCase()); }
      g.set('Score', U.fmt(g.score));
      g.set('Words', d.words);
      d.msg = word.toUpperCase() + ' +' + pts;
      d.sel = [];
      d.speed = Math.max(1.5, d.speed - 0.06);
      Milo.sound.coin();
    }

    return Milo.arcade(host, {
      id: 'letter-drop',
      w: W, h: H, bg: '#131736',
      stats: ['Score', 'Words', 'Best word'],
      emo: '🔡',
      start: {
        title: 'Letter Drop',
        text: 'Rows of letters push up from the bottom. Chain touching letters into a word ' +
          'and press Enter to clear them. Let the stack reach the top and it is over.',
        keys: ['Click adjoining letters', 'Enter to submit', 'Esc to clear']
      },
      init: reset,

      onKey: function (g, e) {
        var d = g.data;
        if (e.key === 'Enter') submit(g);
        if (e.key === 'Escape') d.sel = [];
      },

      onPointer: function (g, type, px, py) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data;
        var x = Math.floor((px - 20) / CELL), y = Math.floor((py - 20) / CELL);
        if (x < 0 || y < 0 || x >= COLS || y >= ROWS || !d.grid[y][x]) return;

        var already = d.sel.findIndex(function (p) { return p.x === x && p.y === y; });
        if (already !== -1) { d.sel = d.sel.slice(0, already); return; }
        if (d.sel.length && !adjacent(d.sel[d.sel.length - 1], { x: x, y: y })) {
          d.sel = [{ x: x, y: y }];
        } else {
          d.sel.push({ x: x, y: y });
        }
        Milo.sound.blip();
      },

      update: function (g, dt) {
        var d = g.data;
        d.fall += dt;
        if (d.fall >= d.speed) {
          d.fall = 0;
          if (topRowFull(d)) {
            g.gameOver({ text: d.words + ' words made. Longest: ' + (d.bestWord || '—').toUpperCase() + '.' });
            return;
          }
          addRow(d);
          Milo.sound.click();
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.fillStyle = '#131736'; c.fillRect(0, 0, W, H);

        for (var y = 0; y < ROWS; y++) {
          for (var x = 0; x < COLS; x++) {
            var cell = d.grid[y][x];
            var px = 20 + x * CELL, py = 20 + y * CELL;
            if (!cell) {
              c.fillStyle = 'rgba(255,255,255,.03)';
              U.roundRect(c, px + 2, py + 2, CELL - 4, CELL - 4, 8); c.fill();
              continue;
            }
            var order = d.sel.findIndex(function (p) { return p.x === x && p.y === y; });
            var danger = y < 2;
            c.fillStyle = order !== -1 ? '#22d3ee' : danger ? '#5a2740' : '#39406e';
            U.roundRect(c, px + 2, py + 2, CELL - 4, CELL - 4, 8); c.fill();
            c.fillStyle = order !== -1 ? '#062a33' : '#fff';
            c.font = '800 24px Outfit, sans-serif';
            c.textAlign = 'center';
            c.fillText(cell.ch.toUpperCase(), px + CELL / 2, py + CELL / 2 + 9);
          }
        }

        var panelX = 20 + COLS * CELL + 24;
        c.fillStyle = '#fff';
        c.font = '800 22px Outfit, sans-serif';
        c.textAlign = 'left';
        c.fillText(selWord(d).toUpperCase() || '—', panelX, 60);
        c.fillStyle = 'rgba(255,255,255,.5)';
        c.font = '600 12px Outfit, sans-serif';
        c.fillText('Current word', panelX, 34);
        c.fillText(d.msg, panelX, 100);

        c.fillStyle = 'rgba(255,255,255,.35)';
        c.fillText('Enter — submit', panelX, 150);
        c.fillText('Esc — clear', panelX, 170);
        c.fillText('Next row in ' + Math.ceil(d.speed - d.fall) + 's', panelX, 200);
      }
    });
  }

  window.Milo.register({
    id: 'letter-drop', title: 'Letter Drop', emo: '🔡', category: 'Word',
    tagline: 'Spell words before the stack tops out',
    description: 'New rows of letters push up from the bottom on a timer that keeps ' +
      'getting shorter. Click a chain of touching letters — any direction, including ' +
      'diagonals — to spell a word, then press Enter to clear them and drop everything above ' +
      'down. Longer words score much more. If the stack reaches the top row, you are done.',
    controls: ['Click letters', 'Enter', 'Esc'],
    colors: ['#131736', '#22d3ee'],
    tags: ['word', 'action', 'stacking', 'high score'],
    mount: mount
  });
})();
