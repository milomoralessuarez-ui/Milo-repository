/* Ultimate Tic Tac Toe — nine boards, and your move picks their board. */
(function () {
  'use strict';
  var W = 620, H = 620, PAD = 20;
  var LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.small = [];
      for (var i = 0; i < 9; i++) d.small.push(new Array(9).fill(''));
      d.big = new Array(9).fill('');
      d.active = -1;                 // -1 means any board
      d.turn = 'X';
      d.over = false;
      d.thinking = 0;
      d.last = null;
      g.set('Turn', 'Yours');
      g.set('Boards', '0-0');
      g.set('Won', d.wins || 0);
    }

    function winnerOf(cells) {
      for (var i = 0; i < LINES.length; i++) {
        var L = LINES[i];
        if (cells[L[0]] && cells[L[0]] === cells[L[1]] && cells[L[1]] === cells[L[2]]) return cells[L[0]];
      }
      return cells.indexOf('') === -1 ? 'D' : '';
    }

    function legal(d, b, c) {
      if (d.over || d.big[b] || d.small[b][c]) return false;
      return d.active === -1 || d.active === b;
    }

    function play(g, b, c, who) {
      var d = g.data;
      d.small[b][c] = who;
      d.last = { b: b, c: c };
      var w = winnerOf(d.small[b]);
      if (w) d.big[b] = w;
      // Your move sends the opponent to the matching board — unless it's done.
      d.active = (d.big[c] || d.small[c].indexOf('') === -1) ? -1 : c;
      Milo.sound.tone({ f: who === 'X' ? 460 : 320, d: .07, v: .06, type: 'square' });

      var xw = d.big.filter(function (v) { return v === 'X'; }).length;
      var ow = d.big.filter(function (v) { return v === 'O'; }).length;
      g.set('Boards', xw + '-' + ow);

      var overall = winnerOf(d.big.map(function (v) { return v === 'D' ? '' : v; }));
      if (overall === 'X') {
        d.over = true;
        d.wins = (d.wins || 0) + 1;
        g.set('Won', d.wins);
        g.win({ emo: '❎', title: 'You win the big board!', score: d.wins * 300 });
        return true;
      }
      if (overall === 'O') {
        d.over = true;
        g.gameOver({ emo: '🅾️', title: 'CPU takes the big board', score: (d.wins || 0) * 300 });
        return true;
      }
      if (d.big.every(function (v) { return v; })) {
        d.over = true;
        g.gameOver({ emo: '🤝', title: 'A draw', score: (d.wins || 0) * 300 });
        return true;
      }
      return false;
    }

    /** Simple heuristic: win a board, block one, prefer the centre. */
    function cpuMove(g) {
      var d = g.data;
      var moves = [];
      for (var b = 0; b < 9; b++) {
        for (var c = 0; c < 9; c++) if (legal(d, b, c)) moves.push({ b: b, c: c });
      }
      if (!moves.length) { d.over = true; return; }

      var best = null, bestScore = -1e9;
      moves.forEach(function (m) {
        var s = 0;
        var copy = d.small[m.b].slice();
        copy[m.c] = 'O';
        if (winnerOf(copy) === 'O') s += 90;
        copy[m.c] = 'X';
        if (winnerOf(copy) === 'X') s += 60;      // deny the player
        if (m.c === 4) s += 8;
        if (m.b === 4) s += 6;
        // Avoid handing the player a free choice of board.
        var sends = m.c;
        if (d.big[sends]) s -= 30;
        s += U.hash2(m.b, m.c, 7) * 4;
        if (s > bestScore) { bestScore = s; best = m; }
      });
      if (play(g, best.b, best.c, 'O')) return;
      d.turn = 'X';
      g.set('Turn', 'Yours');
    }

    var CELL = (W - PAD * 2) / 9;

    return Milo.arcade(host, {
      id: 'ultimate-ttt',
      w: W, h: H, bg: '#0f1233',
      stats: ['Turn', 'Boards', 'Won'],
      emo: '❎',
      start: {
        title: 'Ultimate Tic Tac Toe',
        text: 'Nine small boards inside one big one. Win a small board to claim its square; ' +
          'three claimed squares in a line wins. The catch: the square you play in decides ' +
          'which board your opponent must play in next.',
        keys: ['Click a highlighted cell']
      },
      preload: function (g) { g.data.wins = 0; },
      init: reset,

      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data;
        if (d.over || d.turn !== 'X' || d.thinking > 0) return;
        var gx = Math.floor((x - PAD) / CELL), gy = Math.floor((y - PAD) / CELL);
        if (gx < 0 || gy < 0 || gx > 8 || gy > 8) return;
        var b = Math.floor(gy / 3) * 3 + Math.floor(gx / 3);
        var c = (gy % 3) * 3 + (gx % 3);
        if (!legal(d, b, c)) { Milo.sound.tone({ f: 150, d: .06, v: .04, type: 'square' }); return; }
        if (play(g, b, c, 'X')) return;
        d.turn = 'O';
        d.thinking = 0.4;
        g.set('Turn', 'CPU…');
      },

      update: function (g, dt) {
        var d = g.data;
        if (d.thinking > 0) {
          d.thinking -= dt;
          if (d.thinking <= 0 && d.turn === 'O') cpuMove(g);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.fillStyle = '#0f1233'; c.fillRect(0, 0, W, H);

        for (var b = 0; b < 9; b++) {
          var bx = PAD + (b % 3) * CELL * 3, by = PAD + Math.floor(b / 3) * CELL * 3;
          var playable = !d.over && d.turn === 'X' && !d.big[b] && (d.active === -1 || d.active === b);
          c.fillStyle = playable ? 'rgba(34,211,238,.10)' : 'rgba(255,255,255,.02)';
          c.fillRect(bx, by, CELL * 3, CELL * 3);

          for (var cc = 0; cc < 9; cc++) {
            var cx = bx + (cc % 3) * CELL, cy = by + Math.floor(cc / 3) * CELL;
            var v = d.small[b][cc];
            if (!v) continue;
            c.fillStyle = v === 'X' ? '#22d3ee' : '#fb7185';
            c.font = '700 ' + (CELL * .7) + 'px Outfit, sans-serif';
            c.textAlign = 'center';
            c.fillText(v, cx + CELL / 2, cy + CELL * .74);
          }

          if (d.big[b]) {
            c.fillStyle = d.big[b] === 'X' ? 'rgba(34,211,238,.30)'
              : d.big[b] === 'O' ? 'rgba(251,113,133,.30)' : 'rgba(255,255,255,.10)';
            c.fillRect(bx, by, CELL * 3, CELL * 3);
            c.fillStyle = d.big[b] === 'X' ? '#22d3ee' : d.big[b] === 'O' ? '#fb7185' : '#8b93bd';
            c.font = '800 ' + (CELL * 1.9) + 'px Outfit, sans-serif';
            c.textAlign = 'center';
            c.fillText(d.big[b] === 'D' ? '–' : d.big[b], bx + CELL * 1.5, by + CELL * 2.3);
          }

          c.strokeStyle = 'rgba(255,255,255,.10)'; c.lineWidth = 1;
          for (var k = 1; k < 3; k++) {
            c.beginPath();
            c.moveTo(bx + k * CELL, by); c.lineTo(bx + k * CELL, by + CELL * 3);
            c.moveTo(bx, by + k * CELL); c.lineTo(bx + CELL * 3, by + k * CELL);
            c.stroke();
          }
          c.strokeStyle = playable ? '#22d3ee' : 'rgba(255,255,255,.35)';
          c.lineWidth = playable ? 3 : 2;
          c.strokeRect(bx, by, CELL * 3, CELL * 3);
        }

        if (d.last) {
          var lb = d.last.b, lc = d.last.c;
          var lx = PAD + (lb % 3) * CELL * 3 + (lc % 3) * CELL;
          var ly = PAD + Math.floor(lb / 3) * CELL * 3 + Math.floor(lc / 3) * CELL;
          c.strokeStyle = '#ffd257'; c.lineWidth = 2;
          c.strokeRect(lx + 2, ly + 2, CELL - 4, CELL - 4);
        }

        c.fillStyle = 'rgba(255,255,255,.45)';
        c.font = '600 12px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText(d.active === -1 ? 'You may play in any open board'
          : 'You must play in the highlighted board', W / 2, H - 6);
      }
    });
  }

  window.Milo.register({
    id: 'ultimate-ttt', title: 'Ultimate Tic Tac Toe', emo: '❎', category: 'Strategy',
    tagline: 'Nine boards, and every move sends them somewhere',
    description: 'Nine small tic-tac-toe boards arranged in a big one. Win a small board ' +
      'and you claim that square; three claimed squares in a line wins overall. The twist ' +
      'that makes it a real game: whichever square you play in decides which board your ' +
      'opponent has to play in next, so a winning move can hand them the board they wanted.',
    controls: ['Click a highlighted cell'],
    colors: ['#0f1233', '#22d3ee'],
    tags: ['board game', 'vs cpu', 'strategy', 'deep'],
    mount: mount
  });
})();
