/* Reversi (Othello) — flank and flip, against a positional AI. */
(function () {
  'use strict';
  var N = 8;
  // Corners are permanent, the squares next to them are traps.
  var WEIGHT = [
    120, -20, 20, 5, 5, 20, -20, 120,
    -20, -40, -5, -5, -5, -5, -40, -20,
    20, -5, 15, 3, 3, 15, -5, 20,
    5, -5, 3, 3, 3, 3, -5, 5,
    5, -5, 3, 3, 3, 3, -5, 5,
    20, -5, 15, 3, 3, 15, -5, 20,
    -20, -40, -5, -5, -5, -5, -40, -20,
    120, -20, 20, 5, 5, 20, -20, 120
  ];
  var DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var cells = [];

    function reset(g) {
      var d = g.data;
      d.b = new Array(N * N).fill(0);       // 1 = you (black), 2 = cpu (white)
      d.b[27] = 2; d.b[28] = 1;
      d.b[35] = 1; d.b[36] = 2;
      d.turn = 1;
      d.over = false;
      d.thinking = false;
      build(g);
      paint(g);
    }

    function build(g) {
      var wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px';
      var board = document.createElement('div');
      board.style.cssText = 'display:grid;grid-template-columns:repeat(8,1fr);gap:2px;' +
        'background:#123d2a;padding:6px;border-radius:10px;' +
        'width:min(88vw,min(64vh,460px));aspect-ratio:1';
      cells = [];
      for (var i = 0; i < N * N; i++) {
        var c = document.createElement('button');
        c.type = 'button';
        c.dataset.i = i;
        c.style.cssText = 'border:0;padding:0;border-radius:3px;background:#1b6b48;cursor:pointer;' +
          'display:grid;place-items:center;transition:background .12s';
        var disc = document.createElement('span');
        disc.style.cssText = 'width:78%;height:78%;border-radius:50%;transition:.18s;transform:scale(0)';
        c.appendChild(disc);
        board.appendChild(c);
        cells.push(c);
      }
      board.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (b) play(g, +b.dataset.i);
      });
      var hint = document.createElement('div');
      hint.style.cssText = 'color:#a8b0d8;font-size:.84rem;text-align:center';
      hint.textContent = 'You are black. Highlighted squares are legal moves.';
      wrap.appendChild(board);
      wrap.appendChild(hint);
      g.root.innerHTML = '';
      g.root.appendChild(wrap);
    }

    /** All discs that would flip if `who` played at `i` — empty means illegal. */
    function gains(b, i, who) {
      if (b[i]) return [];
      var x = i % N, y = (i / N) | 0, them = who === 1 ? 2 : 1, out = [];
      for (var k = 0; k < DIRS.length; k++) {
        var dx = DIRS[k][0], dy = DIRS[k][1], run = [];
        var nx = x + dx, ny = y + dy;
        while (nx >= 0 && ny >= 0 && nx < N && ny < N && b[ny * N + nx] === them) {
          run.push(ny * N + nx);
          nx += dx; ny += dy;
        }
        if (run.length && nx >= 0 && ny >= 0 && nx < N && ny < N && b[ny * N + nx] === who) {
          out = out.concat(run);
        }
      }
      return out;
    }

    function legal(b, who) {
      var out = [];
      for (var i = 0; i < N * N; i++) if (gains(b, i, who).length) out.push(i);
      return out;
    }

    function apply(b, i, who) {
      var flips = gains(b, i, who);
      b[i] = who;
      flips.forEach(function (f) { b[f] = who; });
      return flips.length;
    }

    function counts(b) {
      var you = 0, cpu = 0;
      b.forEach(function (v) { if (v === 1) you++; else if (v === 2) cpu++; });
      return { you: you, cpu: cpu };
    }

    function paint(g) {
      var d = g.data;
      var moves = d.over || d.turn !== 1 ? [] : legal(d.b, 1);
      d.b.forEach(function (v, i) {
        var c = cells[i], disc = c.firstChild;
        disc.style.transform = v ? 'scale(1)' : 'scale(0)';
        disc.style.background = v === 1 ? '#12162e' : '#f1f5ff';
        disc.style.boxShadow = v ? '0 2px 6px rgba(0,0,0,.4)' : 'none';
        var hot = moves.indexOf(i) !== -1;
        c.style.background = hot ? '#2a9c68' : '#1b6b48';
        c.style.cursor = hot ? 'pointer' : 'default';
      });
      var n = counts(d.b);
      g.set('You', n.you);
      g.set('CPU', n.cpu);
      g.set('Turn', d.over ? '—' : (d.turn === 1 ? 'Yours' : 'CPU'));
    }

    function play(g, i) {
      var d = g.data;
      if (g.state !== 'play' || d.over || d.turn !== 1 || d.thinking) return;
      if (!gains(d.b, i, 1).length) return;
      apply(d.b, i, 1);
      Milo.sound.tone({ f: 420, f2: 300, d: .08, v: .07, type: 'triangle' });
      d.turn = 2;
      paint(g);
      d.thinking = true;
      setTimeout(function () { cpuTurn(g); }, 300);
    }

    function cpuTurn(g) {
      var d = g.data;
      d.thinking = false;
      if (g.state !== 'play' || d.over) return;

      var moves = legal(d.b, 2);
      if (moves.length) {
        var best = null;
        moves.forEach(function (m) {
          var copy = d.b.slice();
          apply(copy, m, 2);
          // Positional weight, minus how much freedom it hands back.
          var score = WEIGHT[m] + apply.length * 0 - legal(copy, 1).length * 3;
          var n = counts(copy);
          if (n.you + n.cpu > 52) score += (n.cpu - n.you) * 6;   // endgame: take discs
          if (!best || score > best.score) best = { m: m, score: score };
        });
        apply(d.b, best.m, 2);
        Milo.sound.tone({ f: 300, f2: 220, d: .08, v: .07, type: 'triangle' });
      }

      d.turn = 1;
      paint(g);

      // Whoever has no legal move passes; if neither can, the game is done.
      if (!legal(d.b, 1).length) {
        if (!legal(d.b, 2).length) { finish(g); return; }
        d.turn = 2;
        paint(g);
        Milo.sound.blip();
        d.thinking = true;
        setTimeout(function () { cpuTurn(g); }, 500);
      }
    }

    function finish(g) {
      var d = g.data;
      d.over = true;
      paint(g);
      var n = counts(d.b);
      if (n.you > n.cpu) {
        g.win({ emo: '⚫', title: 'You win ' + n.you + '–' + n.cpu, score: n.you * 20 + (n.you - n.cpu) * 30 });
      } else if (n.cpu > n.you) {
        g.gameOver({ emo: '⚪', title: 'CPU wins ' + n.cpu + '–' + n.you, score: n.you * 20 });
      } else {
        g.gameOver({ emo: '🤝', title: 'A dead heat, ' + n.you + '–' + n.cpu, score: n.you * 20 });
      }
    }

    return Milo.domGame(host, {
      id: 'reversi',
      stats: ['You', 'CPU', 'Turn'],
      bg: '#0c2a1e',
      emo: '⚫',
      start: {
        title: 'Reversi',
        text: 'Trap a line of white discs between two of your black ones and they ' +
          'all flip. Most discs at the end wins. Corners can never be flipped back — ' +
          'take them if you can.',
        keys: ['Click a highlighted square']
      },
      init: reset
    });
  }

  window.Milo.register({
    id: 'reversi', title: 'Reversi', emo: '⚫', category: 'Strategy',
    tagline: 'Flank your opponent and flip the board',
    description: 'Also called Othello. Place a disc so it sandwiches a run of the ' +
      'opponent’s discs between yours, and that whole run flips to your colour. Whoever ' +
      'owns more discs when the board fills up wins. Corners can never be flipped back, ' +
      'and the CPU knows it.',
    controls: ['Click a highlighted square'],
    colors: ['#1b6b48', '#12162e'],
    tags: ['board game', 'othello', 'vs cpu', 'strategy'],
    mount: mount
  });
})();
