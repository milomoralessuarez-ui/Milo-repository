/* Word Grid — three minutes to find every word you can in a 4x4 tray. */
(function () {
  'use strict';
  var N = 4, W = 780, H = 560, CELL = 88, TIME = 180;
  var DICE = ['aaeegn', 'abbjoo', 'achops', 'affkps', 'aoottw', 'cimotu', 'deilrx', 'delrvy',
    'distty', 'eeghnw', 'eeinsu', 'ehrtvw', 'eiosst', 'elrtty', 'himnqu', 'hlnnrz'];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util, WORDS = Milo.words;

    function reset(g) {
      var d = g.data;
      var dice = U.shuffle(DICE.slice());
      d.grid = [];
      for (var y = 0; y < N; y++) {
        var row = [];
        for (var x = 0; x < N; x++) {
          var die = dice[y * N + x];
          row.push(die[U.randInt(0, die.length - 1)]);
        }
        d.grid.push(row);
      }
      d.sel = [];
      d.found = [];
      d.time = TIME;
      d.msg = 'Drag through touching letters';
      g.set('Score', 0);
      g.set('Time', U.time(TIME));
      g.set('Words', 0);
    }

    function cellAt(px, py) {
      var gx = (W - 240 - N * CELL) / 2 + 20;
      var x = Math.floor((px - gx) / CELL), y = Math.floor((py - 90) / CELL);
      if (x < 0 || y < 0 || x >= N || y >= N) return null;
      return { x: x, y: y };
    }
    function cellXY(x, y) {
      var gx = (W - 240 - N * CELL) / 2 + 20;
      return { x: gx + x * CELL, y: 90 + y * CELL };
    }

    function selWord(d) {
      return d.sel.map(function (p) { return d.grid[p.y][p.x]; }).join('');
    }

    function adjacent(a, b) {
      return Math.abs(a.x - b.x) <= 1 && Math.abs(a.y - b.y) <= 1 && !(a.x === b.x && a.y === b.y);
    }

    function submit(g) {
      var d = g.data;
      var w = selWord(d);
      d.sel = [];
      if (w.length < 3) { d.msg = 'At least three letters'; return; }
      if (d.found.indexOf(w) !== -1) { d.msg = 'Already found ' + w.toUpperCase(); return; }
      var known = WORDS.fiveSet[w] || WORDS.general.indexOf(w) !== -1;
      if (!known) {
        d.msg = w.toUpperCase() + ' is not in the word list';
        Milo.sound.tone({ f: 150, d: .1, v: .05, type: 'square' });
        return;
      }
      // Standard Boggle scoring.
      var pts = [0, 0, 0, 1, 1, 2, 3, 5][Math.min(7, w.length)] || 11;
      g.score += pts;
      d.found.unshift(w);
      g.set('Score', g.score);
      g.set('Words', d.found.length);
      d.msg = w.toUpperCase() + ' +' + pts;
      Milo.sound.coin();
    }

    return Milo.arcade(host, {
      id: 'word-grid',
      w: W, h: H, bg: '#1b1533',
      stats: ['Score', 'Time', 'Words'],
      emo: '🎲',
      start: {
        title: 'Word Grid',
        text: 'Three minutes to find as many words as you can. Letters must touch — ' +
          'including diagonally — and you cannot reuse a tile within one word.',
        keys: ['Drag through letters', 'Release to submit']
      },
      init: reset,

      onPointer: function (g, type, px, py) {
        var d = g.data;
        if (type === 'down') {
          var a = cellAt(px, py);
          d.sel = a ? [a] : [];
        } else if (type === 'move' && d.sel.length) {
          var b = cellAt(px, py);
          if (!b) return;
          var already = d.sel.findIndex(function (p) { return p.x === b.x && p.y === b.y; });
          if (already !== -1) { d.sel = d.sel.slice(0, already + 1); return; }
          if (adjacent(d.sel[d.sel.length - 1], b)) d.sel.push(b);
        } else if (type === 'up' && d.sel.length) {
          submit(g);
        }
      },

      update: function (g, dt) {
        var d = g.data;
        d.time -= dt;
        g.set('Time', U.time(Math.max(0, d.time)));
        if (d.time <= 0) {
          g.gameOver({
            emo: '🎲', title: 'Time!',
            text: d.found.length + ' words for ' + g.score + ' points.'
          });
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#251b45'); bg.addColorStop(1, '#0f0b1e');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        // trace the current chain
        if (d.sel.length > 1) {
          c.strokeStyle = 'rgba(255,210,87,.6)';
          c.lineWidth = 8; c.lineCap = 'round'; c.lineJoin = 'round';
          c.beginPath();
          d.sel.forEach(function (p, i) {
            var q = cellXY(p.x, p.y);
            var mx = q.x + CELL / 2, my = q.y + CELL / 2;
            if (i === 0) c.moveTo(mx, my); else c.lineTo(mx, my);
          });
          c.stroke();
        }

        for (var y = 0; y < N; y++) {
          for (var x = 0; x < N; x++) {
            var q = cellXY(x, y);
            var on = d.sel.some(function (p) { return p.x === x && p.y === y; });
            c.fillStyle = on ? '#ffd257' : '#f2eee3';
            U.roundRect(c, q.x + 5, q.y + 5, CELL - 10, CELL - 10, 12); c.fill();
            c.fillStyle = '#231a12';
            c.font = '800 34px Outfit, sans-serif';
            c.textAlign = 'center';
            var ch = d.grid[y][x];
            c.fillText(ch === 'q' ? 'Qu' : ch.toUpperCase(), q.x + CELL / 2, q.y + CELL / 2 + 12);
          }
        }

        var px2 = W - 220;
        c.fillStyle = '#fff';
        c.font = '800 22px Outfit, sans-serif';
        c.textAlign = 'left';
        c.fillText(selWord(d).toUpperCase() || '—', px2, 96);
        c.fillStyle = 'rgba(255,255,255,.45)';
        c.font = '600 12px Outfit, sans-serif';
        c.fillText(d.msg, px2, 122);
        c.fillText('FOUND', px2, 156);
        d.found.slice(0, 12).forEach(function (w, i) {
          c.fillStyle = 'rgba(255,255,255,' + (0.85 - i * 0.05) + ')';
          c.font = '600 14px Outfit, sans-serif';
          c.fillText(w.toUpperCase(), px2, 180 + i * 22);
        });
      }
    });
  }

  window.Milo.register({
    id: 'word-grid', title: 'Word Grid', emo: '🎲', category: 'Word',
    tagline: 'Three minutes, sixteen letters',
    description: 'A 4×4 tray of letter dice and three minutes on the clock. Drag through ' +
      'touching letters — diagonals count — to spell words, with no reusing a tile inside ' +
      'one word. Scoring follows the classic table, so a six-letter find is worth three ' +
      'times a four-letter one.',
    controls: ['Drag through letters'],
    colors: ['#1b1533', '#ffd257'],
    tags: ['word', 'timed', 'boggle', 'brain'],
    mount: mount
  });
})();
