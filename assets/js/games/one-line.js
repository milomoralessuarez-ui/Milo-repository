/* One Line — trace every edge of the shape without lifting your finger. */
(function () {
  'use strict';
  var W = 620, H = 620;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    // Each puzzle is nodes plus the edges that must all be drawn.
    var PUZZLES = [
      { nodes: [[.5, .2], [.2, .7], [.8, .7]], edges: [[0, 1], [1, 2], [2, 0]] },
      { nodes: [[.25, .25], [.75, .25], [.75, .75], [.25, .75]], edges: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2]] },
      { nodes: [[.5, .15], [.15, .45], [.85, .45], [.3, .85], [.7, .85]],
        edges: [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [3, 4], [1, 4], [2, 3]] },
      { nodes: [[.5, .12], [.2, .38], [.8, .38], [.32, .82], [.68, .82], [.5, .55]],
        edges: [[0, 1], [0, 2], [1, 5], [2, 5], [1, 3], [2, 4], [3, 5], [4, 5], [3, 4]] },
      { nodes: [[.2, .2], [.5, .2], [.8, .2], [.2, .5], [.5, .5], [.8, .5], [.5, .8]],
        edges: [[0, 1], [1, 2], [0, 3], [1, 4], [2, 5], [3, 4], [4, 5], [3, 6], [4, 6], [5, 6]] }
    ];

    function reset(g) {
      var d = g.data;
      d.level = d.level || 0;
      var p = PUZZLES[d.level % PUZZLES.length];
      d.nodes = p.nodes.map(function (n) { return { x: n[0] * W, y: n[1] * H }; });
      d.edges = p.edges.map(function (e) { return { a: e[0], b: e[1], drawn: false }; });
      d.at = null;
      d.path = [];
      d.done = false;
      g.set('Level', d.level + 1);
      g.set('Lines', '0/' + d.edges.length);
      g.set('Best', g.best ? U.fmt(g.best) : '—');
    }

    function nodeAt(d, x, y) {
      for (var i = 0; i < d.nodes.length; i++) {
        if (U.dist(x, y, d.nodes[i].x, d.nodes[i].y) < 34) return i;
      }
      return -1;
    }

    function edgeBetween(d, a, b) {
      for (var i = 0; i < d.edges.length; i++) {
        var e = d.edges[i];
        if ((e.a === a && e.b === b) || (e.a === b && e.b === a)) return e;
      }
      return null;
    }

    function go(g, to) {
      var d = g.data;
      if (d.at == null) {
        d.at = to;
        d.path = [to];
        Milo.sound.blip();
        return;
      }
      var e = edgeBetween(d, d.at, to);
      if (!e || e.drawn) { Milo.sound.tone({ f: 150, d: .07, v: .05, type: 'square' }); return; }
      e.drawn = true;
      d.at = to;
      d.path.push(to);
      var n = d.edges.filter(function (q) { return q.drawn; }).length;
      g.set('Lines', n + '/' + d.edges.length);
      Milo.sound.tone({ f: 380 + n * 30, d: .07, v: .06, type: 'triangle' });

      if (n === d.edges.length) {
        d.done = true;
        g.score += 300;
        Milo.sound.win();
        d.level++;
        if (d.level >= PUZZLES.length) {
          g.win({ score: g.score, emo: '✏️', title: 'All shapes drawn!', text: 'Every puzzle solved in one line.' });
          return;
        }
        g.overlay({
          emo: '✏️', title: 'Solved in one line!',
          score: g.score, best: g.best,
          newBest: Milo.store.setBest('one-line', g.score),
          actions: [
            { label: 'Next shape →', primary: true, onClick: function () { next(g); } },
            { label: 'Start over', onClick: function () { g.data.level = 0; g.restart(); } }
          ]
        });
      }
    }

    function next(g) {
      g.clearOverlay();
      var keepScore = g.score, keepLevel = g.data.level;
      reset(g);
      g.data.level = keepLevel;
      g.score = keepScore;
      g.state = 'play';
      g.set('Level', keepLevel + 1);
      g.best = Milo.store.best('one-line');
    }

    return Milo.arcade(host, {
      id: 'one-line',
      w: W, h: H, bg: '#0f1130',
      stats: ['Level', 'Lines', 'Best'],
      emo: '✏️',
      start: {
        title: 'One Line',
        text: 'Trace every line in the shape without drawing the same one twice and ' +
          'without lifting off. Start anywhere. Press R to start the shape again.',
        keys: ['Click node to node', 'R to reset the shape']
      },
      preload: function (g) { g.data.level = 0; },
      init: reset,

      onKey: function (g, e) {
        if (e.code === 'KeyR') {
          var d = g.data;
          d.edges.forEach(function (q) { q.drawn = false; });
          d.at = null;
          d.path = [];
          g.set('Lines', '0/' + d.edges.length);
        }
      },

      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.data.done) return;
        var i = nodeAt(g.data, x, y);
        if (i >= 0) go(g, i);
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * .7);
        bg.addColorStop(0, '#1a1d4a'); bg.addColorStop(1, '#08091c');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        c.lineCap = 'round';
        d.edges.forEach(function (e) {
          var a = d.nodes[e.a], b = d.nodes[e.b];
          c.strokeStyle = e.drawn ? '#22d3ee' : 'rgba(255,255,255,.14)';
          c.lineWidth = e.drawn ? 8 : 4;
          if (e.drawn) { c.shadowColor = '#22d3ee'; c.shadowBlur = 16; }
          c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
          c.shadowBlur = 0;
        });

        d.nodes.forEach(function (n, i) {
          var here = d.at === i;
          var reachable = d.at != null && !here && edgeBetween(d, d.at, i) &&
            !edgeBetween(d, d.at, i).drawn;
          c.fillStyle = here ? '#ffd257' : reachable ? '#34d399' : '#5b62b8';
          c.beginPath(); c.arc(n.x, n.y, here ? 17 : 13, 0, 7); c.fill();
          c.fillStyle = 'rgba(255,255,255,.35)';
          c.beginPath(); c.arc(n.x - 3, n.y - 4, 4, 0, 7); c.fill();
        });

        c.fillStyle = 'rgba(255,255,255,.45)';
        c.font = '600 13px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText(d.at == null ? 'Click any dot to start' : 'Click a green dot to draw that line',
          W / 2, H - 22);
      }
    });
  }

  window.Milo.register({
    id: 'one-line', title: 'One Line', emo: '✏️', category: 'Puzzle',
    tagline: 'Draw the shape without lifting off',
    description: 'Trace every line in the figure in a single unbroken stroke, never going ' +
      'over the same line twice. Where you start matters — most of these shapes only work ' +
      'from one or two dots, which is the actual puzzle. Green dots show which lines you can ' +
      'still draw from where you are.',
    controls: ['Click dot to dot', 'R to reset'],
    colors: ['#0f1130', '#22d3ee'],
    tags: ['logic', 'brain', 'drawing', 'levels'],
    mount: mount
  });
})();
