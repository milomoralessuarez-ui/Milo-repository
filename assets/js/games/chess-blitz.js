/* Chess Blitz — full rules against a piece-square minimax. */
(function () {
  'use strict';
  var W = 640, H = 640, CELL = 72, PAD = (W - 8 * CELL) / 2;
  var GLYPH = {
    P: '♙', N: '♘', B: '♗', R: '♖', Q: '♕', K: '♔',
    p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚'
  };
  var VALUE = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
  var PAWN_PS = [
    0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5,
    0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5,
    5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0
  ];
  var CENTRE = [
    -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 5, 5, 0, -20, -40,
    -30, 5, 10, 15, 15, 10, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30,
    -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 10, 15, 15, 10, 0, -30,
    -40, -20, 0, 0, 0, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      // Rank 8 down to rank 1; lower case is black, upper case white.
      d.b = ('rnbqkbnr' + 'pppppppp' + '........'.repeat(4) + 'PPPPPPPP' + 'RNBQKBNR').split('');
      d.sel = null;
      d.turn = 'w';
      d.over = false;
      d.thinking = 0;
      d.moves = 0;
      d.taken = [];
      d.last = null;
      g.set('Turn', 'White (you)');
      g.set('Moves', 0);
      g.set('Material', '0');
    }

    function isWhite(p) { return p !== '.' && p === p.toUpperCase(); }
    function sideOf(p) { return p === '.' ? null : (isWhite(p) ? 'w' : 'b'); }

    /** Pseudo-legal moves; legality is checked by testing for self-check. */
    function genMoves(b, side) {
      var out = [];
      var dirs = {
        n: [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]],
        b: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
        r: [[1, 0], [-1, 0], [0, 1], [0, -1]],
        k: [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]
      };
      dirs.q = dirs.b.concat(dirs.r);

      for (var i = 0; i < 64; i++) {
        var p = b[i];
        if (p === '.' || sideOf(p) !== side) continue;
        var x = i % 8, y = (i / 8) | 0;
        var t = p.toLowerCase();

        if (t === 'p') {
          var dir = side === 'w' ? -1 : 1;
          var start = side === 'w' ? 6 : 1;
          var one = i + dir * 8;
          if (one >= 0 && one < 64 && b[one] === '.') {
            out.push({ from: i, to: one });
            var two = i + dir * 16;
            if (y === start && b[two] === '.') out.push({ from: i, to: two });
          }
          [-1, 1].forEach(function (dx) {
            var nx = x + dx, ny = y + dir;
            if (nx < 0 || nx > 7 || ny < 0 || ny > 7) return;
            var j = ny * 8 + nx;
            if (b[j] !== '.' && sideOf(b[j]) !== side) out.push({ from: i, to: j });
          });
          continue;
        }

        var sliding = t === 'b' || t === 'r' || t === 'q';
        (dirs[t] || []).forEach(function (o) {
          var nx = x, ny = y;
          while (true) {
            nx += o[0]; ny += o[1];
            if (nx < 0 || nx > 7 || ny < 0 || ny > 7) break;
            var j = ny * 8 + nx;
            if (b[j] === '.') out.push({ from: i, to: j });
            else {
              if (sideOf(b[j]) !== side) out.push({ from: i, to: j });
              break;
            }
            if (!sliding) break;
          }
        });
      }
      return out;
    }

    function apply(b, m) {
      var copy = b.slice();
      var p = copy[m.from];
      copy[m.from] = '.';
      // Auto-queen: the only promotion this game offers.
      if (p === 'P' && m.to < 8) p = 'Q';
      if (p === 'p' && m.to >= 56) p = 'q';
      copy[m.to] = p;
      return copy;
    }

    function inCheck(b, side) {
      var kingChar = side === 'w' ? 'K' : 'k';
      var kingAt = b.indexOf(kingChar);
      if (kingAt === -1) return true;
      var enemy = genMoves(b, side === 'w' ? 'b' : 'w');
      return enemy.some(function (m) { return m.to === kingAt; });
    }

    function legalMoves(b, side) {
      return genMoves(b, side).filter(function (m) { return !inCheck(apply(b, m), side); });
    }

    function evaluate(b) {
      var s = 0;
      for (var i = 0; i < 64; i++) {
        var p = b[i];
        if (p === '.') continue;
        var t = p.toLowerCase();
        var v = VALUE[t];
        var ps = t === 'p' ? PAWN_PS[isWhite(p) ? i : 63 - i] : CENTRE[i];
        s += (isWhite(p) ? -1 : 1) * (v + ps * 0.4);
      }
      return s;   // positive favours black (the CPU)
    }

    function search(b, depth, side, alpha, beta) {
      var moves = legalMoves(b, side);
      if (!moves.length) {
        if (inCheck(b, side)) return { score: side === 'b' ? -99999 : 99999 };
        return { score: 0 };
      }
      if (depth === 0) return { score: evaluate(b) };
      // Captures first, which prunes far more.
      moves.sort(function (m1, m2) {
        return (b[m2.to] !== '.' ? 1 : 0) - (b[m1.to] !== '.' ? 1 : 0);
      });
      var best = null;
      for (var i = 0; i < moves.length; i++) {
        var r = search(apply(b, moves[i]), depth - 1, side === 'w' ? 'b' : 'w', alpha, beta);
        if (!best ||
          (side === 'b' && r.score > best.score) ||
          (side === 'w' && r.score < best.score)) best = { score: r.score, move: moves[i] };
        if (side === 'b') alpha = Math.max(alpha, r.score); else beta = Math.min(beta, r.score);
        if (alpha >= beta) break;
      }
      return best;
    }

    function material(d) {
      var s = 0;
      d.b.forEach(function (p) {
        if (p === '.') return;
        s += (isWhite(p) ? 1 : -1) * VALUE[p.toLowerCase()];
      });
      return Math.round(s / 100);
    }

    function finish(g, msg, won) {
      var d = g.data;
      d.over = true;
      if (won) g.win({ emo: '♟️', title: msg, score: 1000 + Math.max(0, material(d)) * 50 });
      else g.gameOver({ emo: '♟️', title: msg, score: Math.max(0, material(d)) * 50 });
    }

    function doMove(g, m, side) {
      var d = g.data;
      if (d.b[m.to] !== '.') d.taken.push(d.b[m.to]);
      d.b = apply(d.b, m);
      d.last = m;
      d.moves++;
      g.set('Moves', d.moves);
      g.set('Material', (material(d) > 0 ? '+' : '') + material(d));
      Milo.sound.tone({ f: side === 'w' ? 420 : 300, f2: 220, d: .07, v: .06, type: 'triangle' });

      var next = side === 'w' ? 'b' : 'w';
      if (!legalMoves(d.b, next).length) {
        if (inCheck(d.b, next)) finish(g, next === 'b' ? 'Checkmate — you win!' : 'Checkmate — CPU wins', next === 'b');
        else finish(g, 'Stalemate — a draw', false);
        return true;
      }
      return false;
    }

    return Milo.arcade(host, {
      id: 'chess-blitz',
      w: W, h: H, bg: '#20160f',
      stats: ['Turn', 'Moves', 'Material'],
      emo: '♟️',
      start: {
        title: 'Chess Blitz',
        text: 'Full piece movement, check, checkmate and stalemate, with pawns promoting ' +
          'to queens. The CPU searches three plies with a piece-square evaluation. ' +
          '(Castling and en passant are not implemented.)',
        keys: ['Click a piece, then a square']
      },
      init: reset,

      onPointer: function (g, type, px, py) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data;
        if (d.over || d.turn !== 'w' || d.thinking > 0) return;
        var x = Math.floor((px - PAD) / CELL), y = Math.floor((py - PAD) / CELL);
        if (x < 0 || y < 0 || x > 7 || y > 7) return;
        var i = y * 8 + x;

        if (d.sel != null) {
          var m = d.legal.filter(function (q) { return q.from === d.sel && q.to === i; })[0];
          if (m) {
            d.sel = null;
            if (doMove(g, m, 'w')) return;
            d.turn = 'b';
            d.thinking = 0.3;
            g.set('Turn', 'Black (CPU)');
            return;
          }
          d.sel = null;
        }
        if (sideOf(d.b[i]) === 'w') {
          d.sel = i;
          d.legal = legalMoves(d.b, 'w');
          Milo.sound.blip();
        }
      },

      update: function (g, dt) {
        var d = g.data;
        if (d.thinking > 0) {
          d.thinking -= dt;
          if (d.thinking <= 0 && d.turn === 'b' && !d.over) {
            var r = search(d.b, 3, 'b', -Infinity, Infinity);
            if (r && r.move) {
              if (doMove(g, r.move, 'b')) return;
              d.turn = 'w';
              g.set('Turn', 'White (you)');
            }
          }
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.fillStyle = '#20160f'; c.fillRect(0, 0, W, H);

        var targets = d.sel != null && d.legal
          ? d.legal.filter(function (m) { return m.from === d.sel; })
          : [];

        for (var y = 0; y < 8; y++) {
          for (var x = 0; x < 8; x++) {
            var i = y * 8 + x;
            var px = PAD + x * CELL, py = PAD + y * CELL;
            c.fillStyle = (x + y) % 2 === 0 ? '#e8d3ac' : '#7d4f2c';
            c.fillRect(px, py, CELL, CELL);
            if (d.last && (d.last.from === i || d.last.to === i)) {
              c.fillStyle = 'rgba(255,210,87,.28)';
              c.fillRect(px, py, CELL, CELL);
            }
            if (d.sel === i) {
              c.fillStyle = 'rgba(34,211,238,.4)';
              c.fillRect(px, py, CELL, CELL);
            }
          }
        }

        targets.forEach(function (m) {
          var px = PAD + (m.to % 8) * CELL, py = PAD + ((m.to / 8) | 0) * CELL;
          c.fillStyle = d.b[m.to] !== '.' ? 'rgba(251,113,133,.5)' : 'rgba(52,211,153,.5)';
          c.beginPath();
          c.arc(px + CELL / 2, py + CELL / 2, d.b[m.to] !== '.' ? CELL * .42 : CELL * .16, 0, 7);
          c.fill();
        });

        c.textAlign = 'center';
        c.font = (CELL * .78) + 'px serif';
        for (var k = 0; k < 64; k++) {
          var p = d.b[k];
          if (p === '.') continue;
          var px2 = PAD + (k % 8) * CELL, py2 = PAD + ((k / 8) | 0) * CELL;
          c.fillStyle = isWhite(p) ? '#fdfdff' : '#1b1410';
          c.strokeStyle = isWhite(p) ? 'rgba(0,0,0,.45)' : 'rgba(255,255,255,.25)';
          c.lineWidth = 1.5;
          c.fillText(GLYPH[p], px2 + CELL / 2, py2 + CELL * .78);
          c.strokeText(GLYPH[p], px2 + CELL / 2, py2 + CELL * .78);
        }

        if (!d.over && inCheck(d.b, d.turn)) {
          c.fillStyle = '#fb7185';
          c.font = '800 18px Outfit, sans-serif';
          c.fillText('CHECK', W / 2, 26);
        }
      }
    });
  }

  window.Milo.register({
    id: 'chess-blitz', title: 'Chess Blitz', emo: '♟️', category: 'Strategy',
    tagline: 'Real chess against a searching engine',
    description: 'Full piece movement with check, checkmate and stalemate detection, and ' +
      'pawns that promote to queens. Legal moves are shown as dots when you pick up a piece ' +
      '— red rings mark captures. The CPU searches three plies deep with alpha-beta pruning ' +
      'and a piece-square evaluation, ordering captures first. Castling and en passant are ' +
      'not implemented.',
    controls: ['Click a piece, then a square'],
    colors: ['#7d4f2c', '#e8d3ac'],
    featured: true,
    tags: ['chess', 'board game', 'vs cpu', 'strategy'],
    mount: mount
  });
})();
