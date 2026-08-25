/* Checkers — 8x8 draughts with forced captures, kings and a searching CPU. */
(function () {
  'use strict';
  var N = 8, W = 640, H = 640, CELL = 72;
  var PAD = (W - N * CELL) / 2;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      // 1 = you (moving up), 2 = cpu (moving down); 3/4 are the kings.
      d.b = new Int8Array(N * N);
      for (var y = 0; y < N; y++) {
        for (var x = 0; x < N; x++) {
          if ((x + y) % 2 === 0) continue;
          if (y < 3) d.b[y * N + x] = 2;
          else if (y > 4) d.b[y * N + x] = 1;
        }
      }
      d.sel = null;
      d.turn = 1;
      d.over = false;
      d.thinking = 0;
      d.wins = d.wins || 0;
      updateCounts(g);
      g.set('Turn', 'Yours');
      g.set('Won', d.wins);
    }

    function updateCounts(g) {
      var d = g.data, you = 0, cpu = 0;
      for (var i = 0; i < N * N; i++) {
        if (d.b[i] === 1 || d.b[i] === 3) you++;
        else if (d.b[i] === 2 || d.b[i] === 4) cpu++;
      }
      g.set('Yours', you);
      g.set('CPU', cpu);
      return { you: you, cpu: cpu };
    }

    function side(v) { return v === 1 || v === 3 ? 1 : v === 2 || v === 4 ? 2 : 0; }
    function isKing(v) { return v === 3 || v === 4; }

    function movesFor(b, who, onlyJumps) {
      var jumps = [], steps = [];
      for (var y = 0; y < N; y++) {
        for (var x = 0; x < N; x++) {
          var v = b[y * N + x];
          if (side(v) !== who) continue;
          var dirs = isKing(v) ? [[-1, -1], [1, -1], [-1, 1], [1, 1]]
            : who === 1 ? [[-1, -1], [1, -1]] : [[-1, 1], [1, 1]];
          dirs.forEach(function (dir) {
            var nx = x + dir[0], ny = y + dir[1];
            if (nx < 0 || ny < 0 || nx >= N || ny >= N) return;
            var t = b[ny * N + nx];
            if (t === 0) { steps.push({ x: x, y: y, tx: nx, ty: ny }); return; }
            if (side(t) === who) return;
            var jx = x + dir[0] * 2, jy = y + dir[1] * 2;
            if (jx < 0 || jy < 0 || jx >= N || jy >= N) return;
            if (b[jy * N + jx] !== 0) return;
            jumps.push({ x: x, y: y, tx: jx, ty: jy, cx: nx, cy: ny });
          });
        }
      }
      // Captures are compulsory, as in standard draughts.
      if (jumps.length) return jumps;
      return onlyJumps ? [] : steps;
    }

    function apply(b, m) {
      var v = b[m.y * N + m.x];
      b[m.y * N + m.x] = 0;
      if (m.cx != null) b[m.cy * N + m.cx] = 0;
      if (v === 1 && m.ty === 0) v = 3;
      if (v === 2 && m.ty === N - 1) v = 4;
      b[m.ty * N + m.tx] = v;
      return v;
    }

    function evaluate(b) {
      var s = 0;
      for (var y = 0; y < N; y++) {
        for (var x = 0; x < N; x++) {
          var v = b[y * N + x];
          if (!v) continue;
          var val = isKing(v) ? 5 : 3;
          // Advancing is worth a little, so the CPU doesn't just shuffle about.
          val += side(v) === 2 ? y * 0.08 : (N - 1 - y) * 0.08;
          s += side(v) === 2 ? val : -val;
        }
      }
      return s;
    }

    function search(b, depth, who, alpha, beta) {
      var moves = movesFor(b, who);
      if (!moves.length) return { score: who === 2 ? -9999 : 9999 };
      if (depth === 0) return { score: evaluate(b) };
      var best = null;
      for (var i = 0; i < moves.length; i++) {
        var copy = b.slice();
        apply(copy, moves[i]);
        var r = search(copy, depth - 1, who === 1 ? 2 : 1, alpha, beta);
        if (!best ||
          (who === 2 && r.score > best.score) ||
          (who === 1 && r.score < best.score)) best = { score: r.score, move: moves[i] };
        if (who === 2) alpha = Math.max(alpha, r.score); else beta = Math.min(beta, r.score);
        if (alpha >= beta) break;
      }
      return best;
    }

    function endIfDone(g) {
      var d = g.data;
      var counts = updateCounts(g);
      var youStuck = !movesFor(d.b, 1).length;
      var cpuStuck = !movesFor(d.b, 2).length;
      if (counts.cpu === 0 || cpuStuck) {
        d.over = true; d.wins++; g.set('Won', d.wins);
        g.win({ emo: '⛃', title: 'You win!', score: d.wins * 250 });
        return true;
      }
      if (counts.you === 0 || youStuck) {
        d.over = true;
        g.gameOver({ emo: '⛂', title: 'CPU wins', score: d.wins * 250 });
        return true;
      }
      return false;
    }

    function cpuTurn(g) {
      var d = g.data;
      if (d.over) return;
      var r = search(d.b, 5, 2, -Infinity, Infinity);
      if (!r || !r.move) { endIfDone(g); return; }
      apply(d.b, r.move);
      Milo.sound.tone({ f: 280, f2: 200, d: .08, v: .06, type: 'triangle' });
      // Chain further jumps from the same piece.
      if (r.move.cx != null) {
        var again = movesFor(d.b, 2, true).filter(function (m) {
          return m.x === r.move.tx && m.y === r.move.ty;
        });
        if (again.length) { d.thinking = 0.3; return; }
      }
      if (endIfDone(g)) return;
      d.turn = 1;
      g.set('Turn', 'Yours');
    }

    return Milo.arcade(host, {
      id: 'checkers',
      w: W, h: H, bg: '#2c1c10',
      stats: ['Yours', 'CPU', 'Turn'],
      emo: '⛃',
      start: {
        title: 'Checkers',
        text: 'Standard draughts: move diagonally forward, jump to capture, and reach ' +
          'the far row to be crowned a king that moves both ways. Captures are compulsory.',
        keys: ['Click a piece', 'Click a highlighted square']
      },
      preload: function (g) { g.data.wins = 0; },
      init: reset,

      onPointer: function (g, type, px, py) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data;
        if (d.over || d.turn !== 1 || d.thinking > 0) return;
        var x = Math.floor((px - PAD) / CELL), y = Math.floor((py - PAD) / CELL);
        if (x < 0 || y < 0 || x >= N || y >= N) return;

        var legal = movesFor(d.b, 1);
        if (d.sel) {
          var m = legal.filter(function (q) {
            return q.x === d.sel.x && q.y === d.sel.y && q.tx === x && q.ty === y;
          })[0];
          if (m) {
            apply(d.b, m);
            Milo.sound.tone({ f: 420, f2: 300, d: .08, v: .07, type: 'triangle' });
            d.sel = null;
            if (m.cx != null) {
              var chain = movesFor(d.b, 1, true).filter(function (q) {
                return q.x === m.tx && q.y === m.ty;
              });
              if (chain.length) { d.sel = { x: m.tx, y: m.ty }; updateCounts(g); return; }
            }
            if (endIfDone(g)) return;
            d.turn = 2;
            d.thinking = 0.4;
            g.set('Turn', 'CPU…');
            return;
          }
          d.sel = null;
        }
        if (legal.some(function (q) { return q.x === x && q.y === y; })) {
          d.sel = { x: x, y: y };
          Milo.sound.blip();
        }
      },

      update: function (g, dt) {
        var d = g.data;
        if (d.thinking > 0) {
          d.thinking -= dt;
          if (d.thinking <= 0 && d.turn === 2) cpuTurn(g);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.fillStyle = '#2c1c10'; c.fillRect(0, 0, W, H);

        for (var y = 0; y < N; y++) {
          for (var x = 0; x < N; x++) {
            c.fillStyle = (x + y) % 2 === 0 ? '#e8d3ac' : '#7d4f2c';
            c.fillRect(PAD + x * CELL, PAD + y * CELL, CELL, CELL);
          }
        }

        var legal = d.turn === 1 && !d.over ? movesFor(d.b, 1) : [];
        legal.forEach(function (m) {
          if (d.sel && (m.x !== d.sel.x || m.y !== d.sel.y)) return;
          c.fillStyle = d.sel ? 'rgba(52,211,153,.55)' : 'rgba(34,211,238,.22)';
          c.beginPath();
          c.arc(PAD + (d.sel ? m.tx : m.x) * CELL + CELL / 2,
            PAD + (d.sel ? m.ty : m.y) * CELL + CELL / 2, CELL * .18, 0, 7);
          c.fill();
        });

        for (var y2 = 0; y2 < N; y2++) {
          for (var x2 = 0; x2 < N; x2++) {
            var v = d.b[y2 * N + x2];
            if (!v) continue;
            var cx = PAD + x2 * CELL + CELL / 2, cy = PAD + y2 * CELL + CELL / 2;
            c.fillStyle = 'rgba(0,0,0,.32)';
            c.beginPath(); c.arc(cx + 2, cy + 3, CELL * .34, 0, 7); c.fill();
            var grd = c.createRadialGradient(cx - 6, cy - 8, 3, cx, cy, CELL * .36);
            if (side(v) === 1) { grd.addColorStop(0, '#7fe7ff'); grd.addColorStop(1, '#0f7f9c'); }
            else { grd.addColorStop(0, '#ff9fb0'); grd.addColorStop(1, '#992437'); }
            c.fillStyle = grd;
            c.beginPath(); c.arc(cx, cy, CELL * .34, 0, 7); c.fill();
            if (isKing(v)) {
              c.fillStyle = '#ffd257';
              c.font = '700 20px Outfit, sans-serif';
              c.textAlign = 'center';
              c.fillText('♛', cx, cy + 7);
            }
            if (d.sel && d.sel.x === x2 && d.sel.y === y2) {
              c.strokeStyle = '#ffd257'; c.lineWidth = 3;
              c.beginPath(); c.arc(cx, cy, CELL * .38, 0, 7); c.stroke();
            }
          }
        }
      }
    });
  }

  window.Milo.register({
    id: 'checkers', title: 'Checkers', emo: '⛃', category: 'Strategy',
    tagline: 'Draughts with forced captures and kings',
    description: 'Move diagonally forward one square, or jump an opposing piece to take ' +
      'it. Captures are compulsory and chain, so a single move can clear three pieces off ' +
      'the board. Reach the far row and your piece is crowned a king that moves in every ' +
      'direction. The CPU looks five plies ahead.',
    controls: ['Click a piece', 'Click a target square'],
    colors: ['#7d4f2c', '#22d3ee'],
    tags: ['board game', 'draughts', 'vs cpu', 'classic'],
    mount: mount
  });
})();
