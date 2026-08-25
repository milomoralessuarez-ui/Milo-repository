/* Connect Four — drop discs, line up four, against a minimax opponent. */
(function () {
  'use strict';
  var COLS = 7, ROWS = 6;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var cellEls = [], colBtns = [];

    function reset(g) {
      var d = g.data;
      d.board = new Array(COLS * ROWS).fill(0);   // 0 empty, 1 you, 2 cpu
      d.turn = 1;
      d.over = false;
      d.wins = d.wins || 0;
      d.games = d.games || 0;
      d.winLine = null;
      d.thinking = false;
      build(g);
      paint(g);
      g.set('You', d.wins);
      g.set('Played', d.games);
      g.set('Turn', 'Yours');
    }

    function build(g) {
      var wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px';

      var top = document.createElement('div');
      top.style.cssText = 'display:grid;grid-template-columns:repeat(' + COLS + ',1fr);gap:6px;' +
        'width:min(92vw,min(62vh*' + (COLS / (ROWS + 1)) + ',520px))';
      colBtns = [];
      for (var x = 0; x < COLS; x++) {
        var b = document.createElement('button');
        b.type = 'button';
        b.dataset.c = x;
        b.textContent = '▼';
        b.style.cssText = 'aspect-ratio:1;border:0;border-radius:8px;cursor:pointer;' +
          'background:rgba(255,255,255,.06);color:#8b93bd;font-size:clamp(10px,2.4vw,16px);' +
          'transition:background .12s,color .12s';
        top.appendChild(b);
        colBtns.push(b);
      }
      top.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (b) play(g, +b.dataset.c);
      });

      var board = document.createElement('div');
      board.style.cssText = 'display:grid;grid-template-columns:repeat(' + COLS + ',1fr);gap:6px;' +
        'background:#1b2050;padding:8px;border-radius:12px;' +
        'width:min(92vw,min(62vh*' + (COLS / (ROWS + 1)) + ',520px))';
      cellEls = [];
      for (var i = 0; i < COLS * ROWS; i++) {
        var c = document.createElement('div');
        c.style.cssText = 'aspect-ratio:1;border-radius:50%;background:#0f1330;' +
          'transition:background .18s,box-shadow .18s';
        board.appendChild(c);
        cellEls.push(c);
      }
      board.addEventListener('click', function (e) {
        var i = cellEls.indexOf(e.target);
        if (i >= 0) play(g, i % COLS);
      });

      wrap.appendChild(top);
      wrap.appendChild(board);
      g.root.innerHTML = '';
      g.root.appendChild(wrap);
    }

    function paint(g) {
      var d = g.data;
      d.board.forEach(function (v, i) {
        var c = cellEls[i];
        var win = d.winLine && d.winLine.indexOf(i) !== -1;
        c.style.background = v === 1 ? '#22d3ee' : v === 2 ? '#fb7185' : '#0f1330';
        c.style.boxShadow = win ? '0 0 0 3px #ffd257, 0 0 20px #ffd25799'
          : v ? '0 0 14px ' + (v === 1 ? '#22d3ee66' : '#fb718566') : 'none';
      });
      colBtns.forEach(function (b, x) {
        var open = !d.over && dropRow(d.board, x) >= 0 && d.turn === 1;
        b.style.color = open ? '#22d3ee' : '#464e78';
        b.style.cursor = open ? 'pointer' : 'default';
      });
    }

    function dropRow(board, col) {
      for (var y = ROWS - 1; y >= 0; y--) if (!board[y * COLS + col]) return y;
      return -1;
    }

    /** Returns the four winning indices, or null. */
    function winnerLine(board, who) {
      var dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
      for (var y = 0; y < ROWS; y++) {
        for (var x = 0; x < COLS; x++) {
          if (board[y * COLS + x] !== who) continue;
          for (var k = 0; k < dirs.length; k++) {
            var dx = dirs[k][0], dy = dirs[k][1], line = [y * COLS + x], ok = true;
            for (var n = 1; n < 4; n++) {
              var nx = x + dx * n, ny = y + dy * n;
              if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS || board[ny * COLS + nx] !== who) { ok = false; break; }
              line.push(ny * COLS + nx);
            }
            if (ok) return line;
          }
        }
      }
      return null;
    }

    function full(board) { return board.every(function (v) { return v; }); }

    /** Positional heuristic: centre columns and open threes are worth more. */
    function evaluate(board) {
      var score = 0;
      for (var y = 0; y < ROWS; y++) {
        for (var x = 0; x < COLS; x++) {
          var v = board[y * COLS + x];
          if (v) score += (v === 2 ? 1 : -1) * (3 - Math.abs(x - 3));
        }
      }
      var dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
      for (var y2 = 0; y2 < ROWS; y2++) {
        for (var x2 = 0; x2 < COLS; x2++) {
          for (var k = 0; k < dirs.length; k++) {
            var dx = dirs[k][0], dy = dirs[k][1];
            var ex = x2 + dx * 3, ey = y2 + dy * 3;
            if (ex < 0 || ey < 0 || ex >= COLS || ey >= ROWS) continue;
            var mine = 0, yours = 0;
            for (var n = 0; n < 4; n++) {
              var v2 = board[(y2 + dy * n) * COLS + (x2 + dx * n)];
              if (v2 === 2) mine++; else if (v2 === 1) yours++;
            }
            if (mine && yours) continue;
            if (mine === 3) score += 60;
            else if (mine === 2) score += 10;
            if (yours === 3) score -= 80;
            else if (yours === 2) score -= 12;
          }
        }
      }
      return score;
    }

    function minimax(board, depth, alpha, beta, maximising) {
      if (winnerLine(board, 2)) return { score: 100000 + depth };
      if (winnerLine(board, 1)) return { score: -100000 - depth };
      if (depth === 0 || full(board)) return { score: evaluate(board) };

      // Search the middle first — it prunes far more.
      var order = [3, 2, 4, 1, 5, 0, 6];
      var best = null;
      for (var i = 0; i < order.length; i++) {
        var col = order[i];
        var row = dropRow(board, col);
        if (row < 0) continue;
        board[row * COLS + col] = maximising ? 2 : 1;
        var res = minimax(board, depth - 1, alpha, beta, !maximising);
        board[row * COLS + col] = 0;
        if (!best ||
          (maximising && res.score > best.score) ||
          (!maximising && res.score < best.score)) {
          best = { score: res.score, col: col };
        }
        if (maximising) alpha = Math.max(alpha, res.score);
        else beta = Math.min(beta, res.score);
        if (alpha >= beta) break;
      }
      return best || { score: evaluate(board) };
    }

    function play(g, col) {
      var d = g.data;
      if (g.state !== 'play' || d.over || d.turn !== 1 || d.thinking) return;
      if (!drop(g, col, 1)) return;
      if (d.over) return;
      d.turn = 2;
      d.thinking = true;
      g.set('Turn', 'CPU…');
      paint(g);
      // Let the disc render before the search blocks the thread.
      setTimeout(function () { cpuMove(g); }, 220);
    }

    function drop(g, col, who) {
      var d = g.data;
      var row = dropRow(d.board, col);
      if (row < 0) return false;
      d.board[row * COLS + col] = who;
      Milo.sound.tone({ f: who === 1 ? 380 : 300, f2: 200, d: .1, v: .08, type: 'triangle' });
      paint(g);

      var line = winnerLine(d.board, who);
      if (line) {
        d.over = true;
        d.winLine = line;
        d.games++;
        paint(g);
        if (who === 1) {
          d.wins++;
          g.set('You', d.wins);
          g.win({ emo: '🔵', title: 'You win!', text: 'Four in a row.', score: d.wins * 100 });
        } else {
          g.gameOver({ emo: '🔴', title: 'CPU wins', text: 'It lined up four.', score: d.wins * 100 });
        }
        g.set('Played', d.games);
        return true;
      }
      if (full(d.board)) {
        d.over = true;
        d.games++;
        g.set('Played', d.games);
        g.gameOver({ emo: '🤝', title: 'Draw', text: 'The board filled up.', score: d.wins * 100 });
      }
      return true;
    }

    function cpuMove(g) {
      var d = g.data;
      if (g.state !== 'play' || d.over) { d.thinking = false; return; }
      var move = minimax(d.board.slice(), 5, -Infinity, Infinity, true);
      var col = move && move.col != null ? move.col : 3;
      if (dropRow(d.board, col) < 0) {
        for (var x = 0; x < COLS; x++) if (dropRow(d.board, x) >= 0) { col = x; break; }
      }
      d.thinking = false;
      drop(g, col, 2);
      if (!d.over) {
        d.turn = 1;
        g.set('Turn', 'Yours');
        paint(g);
      }
    }

    return Milo.domGame(host, {
      id: 'connect-four',
      stats: ['You', 'Played', 'Turn'],
      bg: '#0d1130',
      emo: '🔵',
      start: {
        title: 'Connect Four',
        text: 'Drop your discs and line up four — across, down or diagonally — ' +
          'before the CPU does. It looks five moves ahead, so it will punish a loose one.',
        keys: ['Click a column']
      },
      preload: function (g) { g.data.wins = 0; g.data.games = 0; },
      init: reset
    });
  }

  window.Milo.register({
    id: 'connect-four', title: 'Connect Four', emo: '🔵', category: 'Strategy',
    tagline: 'Four in a row against a thinking CPU',
    description: 'Take turns dropping discs into the columns. The first to line up four ' +
      'in a row — horizontally, vertically or diagonally — wins. The CPU searches five ' +
      'moves ahead and values the centre columns, so it will block your threats and set ' +
      'up its own.',
    controls: ['Click a column'],
    colors: ['#22d3ee', '#fb7185'],
    tags: ['board game', 'vs cpu', 'classic', 'strategy'],
    mount: mount
  });
})();
