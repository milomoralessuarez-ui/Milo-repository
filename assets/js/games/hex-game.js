/* Hex — connect your two sides of a rhombus board before the computer connects its own. */
(function () {
  'use strict';
  var W = 860, H = 620, N = 11, S = 24;
  var HW = Math.sqrt(3) * S, VSTEP = 1.5 * S;
  var OX = (W - (N + (N - 1) * .5) * HW) / 2 + HW / 2;
  var OY = (H - ((N - 1) * VSTEP + 2 * S)) / 2 + S + 6;
  var YOU = 1, CPU = 2;
  // Six neighbours on a rhombus hex grid.
  var NB = [[0, -1], [0, 1], [-1, 0], [-1, 1], [1, -1], [1, 0]];

  function center(r, c) {
    return { x: OX + (c + r * .5) * HW, y: OY + r * VSTEP };
  }

  function hexPath(ctx, x, y) {
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
      var a = Math.PI / 180 * (60 * i - 90);
      var px = x + S * Math.cos(a), py = y + S * Math.sin(a);
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.closePath();
  }

  function idx(r, c) { return r * N + c; }
  function inside(r, c) { return r >= 0 && r < N && c >= 0 && c < N; }

  /**
   * Cheapest chain still needed to join a player's two sides: own stones are free,
   * empty cells cost one move, enemy stones are impassable. Fewer moves means closer
   * to winning, so both the win check (cost 0) and the AI read the same number.
   */
  function pathCost(board, who) {
    var dist = new Int32Array(N * N).fill(0x3fffffff);
    // A 0-1 weighted graph, so a deque keeps this linear without a heap.
    var dq = new Int32Array(N * N * 4), head = N * N * 2, tail = head;
    for (var i = 0; i < N; i++) {
      // Player 1 runs left to right along columns; player 2 runs top to bottom.
      var r = who === YOU ? i : 0, c = who === YOU ? 0 : i;
      var v = board[idx(r, c)];
      if (v === (who === YOU ? CPU : YOU)) continue;
      var w = v === who ? 0 : 1;
      if (w < dist[idx(r, c)]) { dist[idx(r, c)] = w; if (w) dq[tail++] = idx(r, c); else dq[--head] = idx(r, c); }
    }
    var best = 0x3fffffff;
    while (head < tail) {
      var cur = dq[head++], cr = (cur / N) | 0, cc = cur % N, dcur = dist[cur];
      if (dcur >= best) continue;
      if (who === YOU ? cc === N - 1 : cr === N - 1) { best = Math.min(best, dcur); continue; }
      for (var k = 0; k < 6; k++) {
        var nr = cr + NB[k][0], nc = cc + NB[k][1];
        if (!inside(nr, nc)) continue;
        var nv = board[idx(nr, nc)];
        if (nv === (who === YOU ? CPU : YOU)) continue;
        var nd = dcur + (nv === who ? 0 : 1);
        if (nd < dist[idx(nr, nc)]) {
          dist[idx(nr, nc)] = nd;
          if (nv === who) dq[--head] = idx(nr, nc); else dq[tail++] = idx(nr, nc);
        }
      }
    }
    return best;
  }

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.board = new Uint8Array(N * N);
      d.turn = YOU;
      d.over = false;
      d.hover = -1;
      d.last = -1;
      d.moves = 0;
      d.think = 0;
      d.win = null;
      g.set('Turn', 'You');
      g.set('Moves', 0);
      g.set('Best', g.best ? g.best : '—');
    }

    /** Cells on the winning chain, so the finished game shows the line it was won by. */
    function chain(board, who) {
      var seen = new Uint8Array(N * N), stack = [], out = [];
      for (var i = 0; i < N; i++) {
        var r = who === YOU ? i : 0, c = who === YOU ? 0 : i;
        if (board[idx(r, c)] === who) { seen[idx(r, c)] = 1; stack.push(idx(r, c)); }
      }
      var reached = false;
      while (stack.length) {
        var cur = stack.pop(), cr = (cur / N) | 0, cc = cur % N;
        out.push(cur);
        if (who === YOU ? cc === N - 1 : cr === N - 1) reached = true;
        for (var k = 0; k < 6; k++) {
          var nr = cr + NB[k][0], nc = cc + NB[k][1];
          if (!inside(nr, nc) || seen[idx(nr, nc)] || board[idx(nr, nc)] !== who) continue;
          seen[idx(nr, nc)] = 1;
          stack.push(idx(nr, nc));
        }
      }
      return reached ? out : [];
    }

    function finish(g, who) {
      var d = g.data;
      d.over = true;
      d.win = chain(d.board, who);
      if (who === YOU) {
        // Shorter wins are better wins, so the score rewards an efficient connection.
        var pts = Math.max(120, 900 - d.moves * 18);
        Milo.sound.win();
        g.win({ emo: '⬡', title: 'You linked left to right!', text: 'Connected in ' + d.moves + ' moves.', score: pts });
      } else {
        Milo.sound.lose();
        g.gameOver({ emo: '⬡', title: 'The computer got across', text: 'It joined top to bottom first.', score: d.moves * 6 });
      }
    }

    function play(g, cell, who) {
      var d = g.data;
      d.board[cell] = who;
      d.last = cell;
      if (who === YOU) { d.moves++; g.set('Moves', d.moves); }
      if (pathCost(d.board, who) === 0) { finish(g, who); return true; }
      return false;
    }

    /**
     * One-ply search on the two path costs: a move is good when it shortens my chain
     * and lengthens theirs. Defence is weighted slightly higher, which is what keeps
     * the computer from racing ahead and losing to a block.
     */
    function cpuMove(g) {
      var d = g.data, board = d.board;
      var best = -Infinity, pick = -1;
      for (var i = 0; i < N * N; i++) {
        if (board[i]) continue;
        board[i] = CPU;
        var mine = pathCost(board, CPU), theirs = pathCost(board, YOU);
        board[i] = 0;
        if (mine >= 0x3fffffff) continue;
        var score = theirs * 1.15 - mine * 1.0;
        // A nudge toward the middle breaks ties in the direction that keeps options open.
        var r = (i / N) | 0, c = i % N;
        score += (1 - (Math.abs(r - (N - 1) / 2) + Math.abs(c - (N - 1) / 2)) / N) * .25;
        score += Math.random() * .12;
        if (score > best) { best = score; pick = i; }
      }
      if (pick < 0) { for (var j = 0; j < N * N; j++) if (!board[j]) { pick = j; break; } }
      if (pick >= 0) play(g, pick, CPU);
    }

    function cellAt(px, py) {
      var best = -1, bd = S * S;
      for (var r = 0; r < N; r++) {
        for (var c = 0; c < N; c++) {
          var p = center(r, c), dx = px - p.x, dy = py - p.y, dd = dx * dx + dy * dy;
          if (dd < bd) { bd = dd; best = idx(r, c); }
        }
      }
      return best;
    }

    return Milo.arcade(host, {
      id: 'hex-game',
      w: W, h: H, bg: '#141a2c',
      stats: ['Turn', 'Moves', 'Best'],
      emo: '⬡',
      trackBest: true,
      start: {
        title: 'Hex',
        text: 'Claim cells to build an unbroken chain from the left edge to the right edge. ' +
          'The computer is trying to link top to bottom. Every cell you take is one it cannot use.',
        keys: ['Click a cell to place a stone']
      },
      init: reset,

      onPointer: function (g, type, px, py) {
        var d = g.data;
        if (type === 'move') { d.hover = g.state === 'play' && d.turn === YOU ? cellAt(px, py) : -1; return; }
        if (type !== 'down' || g.state !== 'play' || d.over || d.turn !== YOU) return;
        var cell = cellAt(px, py);
        if (cell < 0 || d.board[cell]) { Milo.sound.tone({ f: 140, d: .07, v: .05, type: 'square' }); return; }
        Milo.sound.blip();
        if (play(g, cell, YOU)) return;
        d.turn = CPU;
        d.think = .35;
        g.set('Turn', 'Computer');
      },

      update: function (g, dt) {
        var d = g.data;
        if (d.over || d.turn !== CPU) return;
        d.think -= dt;
        if (d.think > 0) return;
        cpuMove(g);
        if (d.over) return;
        Milo.sound.click();
        d.turn = YOU;
        g.set('Turn', 'You');
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#1b2340'); bg.addColorStop(1, '#0d1120');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        // Edge bands name each player's goal without needing a legend.
        c.lineWidth = 7;
        c.lineCap = 'round';
        for (var i = 0; i < N; i++) {
          var l = center(i, 0), r = center(i, N - 1), t = center(0, i), b = center(N - 1, i);
          c.strokeStyle = '#f0713f';
          c.beginPath(); c.moveTo(l.x - S * .95, l.y - VSTEP * .4); c.lineTo(l.x - S * .95, l.y + VSTEP * .4); c.stroke();
          c.beginPath(); c.moveTo(r.x + S * .95, r.y - VSTEP * .4); c.lineTo(r.x + S * .95, r.y + VSTEP * .4); c.stroke();
          c.strokeStyle = '#4fa8ff';
          c.beginPath(); c.moveTo(t.x - HW * .4, t.y - S * .95); c.lineTo(t.x + HW * .4, t.y - S * .95); c.stroke();
          c.beginPath(); c.moveTo(b.x - HW * .4, b.y + S * .95); c.lineTo(b.x + HW * .4, b.y + S * .95); c.stroke();
        }

        var winSet = {};
        if (d.win) d.win.forEach(function (n) { winSet[n] = 1; });

        for (var rr = 0; rr < N; rr++) {
          for (var cc = 0; cc < N; cc++) {
            var p = center(rr, cc), id = idx(rr, cc), v = d.board[id];
            hexPath(c, p.x, p.y);
            if (v === YOU) c.fillStyle = winSet[id] ? '#ffa46a' : '#e05f2c';
            else if (v === CPU) c.fillStyle = winSet[id] ? '#8fd0ff' : '#2f7fd6';
            else c.fillStyle = d.hover === id && !d.over ? '#2f3a5e' : '#212a45';
            c.fill();
            c.lineWidth = d.last === id ? 3 : 1.5;
            c.strokeStyle = d.last === id ? '#ffe9a8' : 'rgba(255,255,255,.13)';
            c.stroke();
          }
        }

        c.fillStyle = 'rgba(255,255,255,.55)';
        c.font = '600 13px Outfit, sans-serif';
        c.textAlign = 'left';
        c.fillText('You: orange, left → right', 18, H - 16);
        c.textAlign = 'right';
        c.fillText('Computer: blue, top → bottom', W - 18, H - 16);
      }
    });
  }

  window.Milo.register({
    id: 'hex-game', title: 'Hex', emo: '⬡', category: 'Strategy',
    tagline: 'Build a bridge across the board',
    description: 'A board game with one rule and no draws: place a stone anywhere empty, and ' +
      'win by joining your two coloured edges with an unbroken chain of your own cells. You run ' +
      'left to right, the computer runs top to bottom, and because every chain must cross the ' +
      'other, exactly one of you gets there. The computer measures how many moves each side ' +
      'still needs and plays the cell that helps it most while hurting you most.',
    controls: ['Click an empty cell to claim it'],
    colors: ['#1b2340', '#f0713f'],
    tags: ['board', 'strategy', 'two player', 'classic'],
    mount: mount
  });
})();
