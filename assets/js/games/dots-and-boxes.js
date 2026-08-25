/* Dots and Boxes — claim squares, chain your moves, beat the CPU. */
(function () {
  'use strict';
  var N = 6;                            // dots per side => 5x5 boxes
  var W = 620, H = 660, CELL = 96;
  var PAD = (W - (N - 1) * CELL) / 2, TOP = 60;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      // Edges stored as two grids: horizontal above each cell, vertical left of each.
      d.hor = [];
      d.ver = [];
      for (var y = 0; y < N; y++) d.hor.push(new Int8Array(N - 1));
      for (var y2 = 0; y2 < N - 1; y2++) d.ver.push(new Int8Array(N));
      d.owner = [];
      for (var y3 = 0; y3 < N - 1; y3++) d.owner.push(new Int8Array(N - 1));
      d.you = 0; d.cpu = 0;
      d.turn = 1;
      d.thinking = 0;
      d.over = false;
      d.hover = null;
      g.set('You', 0);
      g.set('CPU', 0);
      g.set('Turn', 'Yours');
    }

    function sidesOf(d, bx, by) {
      return (d.hor[by][bx] ? 1 : 0) + (d.hor[by + 1][bx] ? 1 : 0) +
        (d.ver[by][bx] ? 1 : 0) + (d.ver[by][bx + 1] ? 1 : 0);
    }

    /** Draw an edge; returns how many boxes it completed. */
    function drawEdge(g, kind, x, y, who) {
      var d = g.data;
      if (kind === 'h') { if (d.hor[y][x]) return -1; d.hor[y][x] = who; }
      else { if (d.ver[y][x]) return -1; d.ver[y][x] = who; }

      var made = 0;
      for (var by = 0; by < N - 1; by++) {
        for (var bx = 0; bx < N - 1; bx++) {
          if (!d.owner[by][bx] && sidesOf(d, bx, by) === 4) {
            d.owner[by][bx] = who;
            made++;
            if (who === 1) d.you++; else d.cpu++;
          }
        }
      }
      g.set('You', d.you);
      g.set('CPU', d.cpu);
      if (made) Milo.sound.coin(); else Milo.sound.click();

      var total = (N - 1) * (N - 1);
      if (d.you + d.cpu === total) {
        d.over = true;
        if (d.you > d.cpu) g.win({ emo: '🟦', title: 'You win ' + d.you + '–' + d.cpu, score: d.you * 100 });
        else if (d.cpu > d.you) g.gameOver({ emo: '🟥', title: 'CPU wins ' + d.cpu + '–' + d.you, score: d.you * 100 });
        else g.gameOver({ emo: '🤝', title: 'A draw at ' + d.you + '–' + d.cpu, score: d.you * 100 });
      }
      return made;
    }

    function freeEdges(d) {
      var out = [];
      for (var y = 0; y < N; y++) {
        for (var x = 0; x < N - 1; x++) if (!d.hor[y][x]) out.push({ k: 'h', x: x, y: y });
      }
      for (var y2 = 0; y2 < N - 1; y2++) {
        for (var x2 = 0; x2 < N; x2++) if (!d.ver[y2][x2]) out.push({ k: 'v', x: x2, y: y2 });
      }
      return out;
    }

    /** Boxes an edge would complete, and whether it hands one to the opponent. */
    function inspect(d, e) {
      var completes = 0, gives = 0;
      var touch = e.k === 'h'
        ? [[e.x, e.y - 1], [e.x, e.y]]
        : [[e.x - 1, e.y], [e.x, e.y]];
      touch.forEach(function (b) {
        var bx = b[0], by = b[1];
        if (bx < 0 || by < 0 || bx >= N - 1 || by >= N - 1) return;
        var s = sidesOf(d, bx, by);
        if (s === 3) completes++;
        else if (s === 2) gives++;
      });
      return { completes: completes, gives: gives };
    }

    function cpuMove(g) {
      var d = g.data;
      if (d.over) return;
      var edges = freeEdges(d);
      if (!edges.length) return;

      // Take anything that completes a box, then any move that gives nothing away.
      var scoring = edges.filter(function (e) { return inspect(d, e).completes > 0; });
      var safe = edges.filter(function (e) {
        var r = inspect(d, e);
        return r.completes === 0 && r.gives === 0;
      });
      var pick = scoring.length ? U.choice(scoring)
        : safe.length ? U.choice(safe)
          : U.choice(edges);

      var made = drawEdge(g, pick.k, pick.x, pick.y, 2);
      if (d.over) return;
      if (made > 0) { d.thinking = 0.35; return; }   // another go
      d.turn = 1;
      g.set('Turn', 'Yours');
    }

    /** Nearest edge to a point, if it is close enough to be intentional. */
    function pickEdge(px, py) {
      var best = null, bestD = 22;
      for (var y = 0; y < N; y++) {
        for (var x = 0; x < N - 1; x++) {
          var mx = PAD + x * CELL + CELL / 2, my = TOP + y * CELL;
          var dist = Math.max(Math.abs(px - mx) - CELL / 2, Math.abs(py - my));
          if (dist < bestD) { bestD = dist; best = { k: 'h', x: x, y: y }; }
        }
      }
      for (var y2 = 0; y2 < N - 1; y2++) {
        for (var x2 = 0; x2 < N; x2++) {
          var mx2 = PAD + x2 * CELL, my2 = TOP + y2 * CELL + CELL / 2;
          var dist2 = Math.max(Math.abs(px - mx2), Math.abs(py - my2) - CELL / 2);
          if (dist2 < bestD) { bestD = dist2; best = { k: 'v', x: x2, y: y2 }; }
        }
      }
      return best;
    }

    return Milo.arcade(host, {
      id: 'dots-and-boxes',
      w: W, h: H, bg: '#101538',
      stats: ['You', 'CPU', 'Turn'],
      emo: '🟦',
      start: {
        title: 'Dots & Boxes',
        text: 'Draw one line per turn. Complete the fourth side of a square and you claim ' +
          'it — and get another go straight away. Most boxes when the grid fills up wins.',
        keys: ['Click between two dots']
      },
      init: reset,

      onPointer: function (g, type, px, py) {
        var d = g.data;
        if (type === 'move') { d.hover = pickEdge(px, py); return; }
        if (type !== 'down' || g.state !== 'play') return;
        if (d.over || d.turn !== 1 || d.thinking > 0) return;
        var e = pickEdge(px, py);
        if (!e) return;
        var made = drawEdge(g, e.k, e.x, e.y, 1);
        if (made < 0 || d.over) return;
        if (made > 0) return;                       // keep your turn
        d.turn = 2;
        d.thinking = 0.4;
        g.set('Turn', 'CPU…');
      },

      update: function (g, dt) {
        var d = g.data;
        if (d.thinking > 0) {
          d.thinking -= dt;
          if (d.thinking <= 0 && d.turn === 2) cpuMove(g);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.fillStyle = '#101538'; c.fillRect(0, 0, W, H);

        for (var by = 0; by < N - 1; by++) {
          for (var bx = 0; bx < N - 1; bx++) {
            var o = d.owner[by][bx];
            if (!o) continue;
            c.fillStyle = o === 1 ? 'rgba(34,211,238,.24)' : 'rgba(251,113,133,.24)';
            c.fillRect(PAD + bx * CELL, TOP + by * CELL, CELL, CELL);
            c.fillStyle = o === 1 ? '#22d3ee' : '#fb7185';
            c.font = '800 26px Outfit, sans-serif';
            c.textAlign = 'center';
            c.fillText(o === 1 ? 'Y' : 'C', PAD + bx * CELL + CELL / 2, TOP + by * CELL + CELL / 2 + 10);
          }
        }

        function edgeStyle(owner, isHover) {
          if (owner === 1) return '#22d3ee';
          if (owner === 2) return '#fb7185';
          return isHover ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.08)';
        }

        c.lineCap = 'round';
        for (var y = 0; y < N; y++) {
          for (var x = 0; x < N - 1; x++) {
            var hov = d.hover && d.hover.k === 'h' && d.hover.x === x && d.hover.y === y;
            c.strokeStyle = edgeStyle(d.hor[y][x], hov);
            c.lineWidth = d.hor[y][x] || hov ? 6 : 3;
            c.beginPath();
            c.moveTo(PAD + x * CELL + 8, TOP + y * CELL);
            c.lineTo(PAD + (x + 1) * CELL - 8, TOP + y * CELL);
            c.stroke();
          }
        }
        for (var y2 = 0; y2 < N - 1; y2++) {
          for (var x2 = 0; x2 < N; x2++) {
            var hov2 = d.hover && d.hover.k === 'v' && d.hover.x === x2 && d.hover.y === y2;
            c.strokeStyle = edgeStyle(d.ver[y2][x2], hov2);
            c.lineWidth = d.ver[y2][x2] || hov2 ? 6 : 3;
            c.beginPath();
            c.moveTo(PAD + x2 * CELL, TOP + y2 * CELL + 8);
            c.lineTo(PAD + x2 * CELL, TOP + (y2 + 1) * CELL - 8);
            c.stroke();
          }
        }

        c.fillStyle = '#eef1ff';
        for (var dy = 0; dy < N; dy++) {
          for (var dx = 0; dx < N; dx++) {
            c.beginPath();
            c.arc(PAD + dx * CELL, TOP + dy * CELL, 5, 0, 7);
            c.fill();
          }
        }

        c.fillStyle = 'rgba(255,255,255,.45)';
        c.font = '600 12px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText('Completing a box earns another turn', W / 2, H - 16);
      }
    });
  }

  window.Milo.register({
    id: 'dots-and-boxes', title: 'Dots & Boxes', emo: '🟦', category: 'Strategy',
    tagline: 'Close the square, take another turn',
    description: 'Take turns drawing a single line between two adjacent dots. Whoever ' +
      'draws the fourth side of a box claims it and immediately goes again, so a well-timed ' +
      'sacrifice can hand you a whole chain. Most boxes on a full grid wins.',
    controls: ['Click between two dots'],
    colors: ['#101538', '#22d3ee'],
    tags: ['board game', 'vs cpu', 'strategy', 'pencil and paper'],
    mount: mount
  });
})();
