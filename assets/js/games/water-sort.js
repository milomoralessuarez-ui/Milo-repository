/* Water Sort — pour between tubes until each holds one colour. */
(function () {
  'use strict';
  var W = 760, H = 560, CAP = 4;
  var COLORS = ['#fb7185', '#22d3ee', '#ffd257', '#34d399', '#a78bfa', '#fb923c',
    '#f472b6', '#60a5fa', '#a3e635'];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.level = d.level || 1;
      var colours = Math.min(COLORS.length, 3 + Math.floor(d.level / 2));
      var spare = d.level < 4 ? 2 : 2;
      var pool = [];
      for (var i = 0; i < colours; i++) {
        for (var k = 0; k < CAP; k++) pool.push(i);
      }
      U.shuffle(pool);
      d.tubes = [];
      for (var t = 0; t < colours; t++) d.tubes.push(pool.splice(0, CAP));
      for (var s = 0; s < spare; s++) d.tubes.push([]);
      d.sel = null;
      d.moves = 0;
      d.done = false;
      d.history = [];
      g.set('Level', d.level);
      g.set('Moves', 0);
      g.set('Tubes', d.tubes.length);
    }

    function tubeRect(d, i) {
      var n = d.tubes.length;
      var perRow = Math.min(n, 7);
      var rows = Math.ceil(n / perRow);
      var row = Math.floor(i / perRow), col = i % perRow;
      var inRow = Math.min(perRow, n - row * perRow);
      var tw = 62, th = 190, gap = 26;
      var totalW = inRow * tw + (inRow - 1) * gap;
      var x = (W - totalW) / 2 + (col % perRow) * (tw + gap);
      var y = 70 + row * (th + 50) - (rows - 1) * 20;
      return { x: x, y: y, w: tw, h: th };
    }

    function topRun(tube) {
      if (!tube.length) return null;
      var v = tube[tube.length - 1], n = 1;
      for (var i = tube.length - 2; i >= 0 && tube[i] === v; i--) n++;
      return { v: v, n: n };
    }

    function canPour(from, to) {
      if (!from.length) return 0;
      if (to.length >= CAP) return 0;
      var run = topRun(from);
      if (to.length && to[to.length - 1] !== run.v) return 0;
      return Math.min(run.n, CAP - to.length);
    }

    function solved(d) {
      return d.tubes.every(function (t) {
        return !t.length || (t.length === CAP && t.every(function (v) { return v === t[0]; }));
      });
    }

    function pour(g, fromIdx, toIdx) {
      var d = g.data;
      var n = canPour(d.tubes[fromIdx], d.tubes[toIdx]);
      if (!n) { Milo.sound.tone({ f: 150, d: .08, v: .05, type: 'square' }); return false; }
      d.history.push({ from: fromIdx, to: toIdx, n: n });
      for (var i = 0; i < n; i++) d.tubes[toIdx].push(d.tubes[fromIdx].pop());
      d.moves++;
      g.set('Moves', d.moves);
      Milo.sound.tone({ f: 340 + n * 40, f2: 460, d: .12, v: .06, type: 'sine' });

      if (solved(d)) {
        d.done = true;
        var earned = Math.max(100, 900 - d.moves * 12) * d.level;
        g.score += earned;
        Milo.sound.win();
        d.level++;
        g.overlay({
          emo: '🧪', title: 'All sorted!',
          text: d.moves + ' pours — worth ' + U.fmt(earned) + ' points.',
          score: g.score,
          best: g.best,
          newBest: Milo.store.setBest('water-sort', g.score),
          actions: [
            { label: 'Next level →', primary: true, onClick: function () { nextLevel(g); } },
            { label: 'Start over', onClick: function () { g.data.level = 1; g.restart(); } }
          ]
        });
      }
      return true;
    }

    function nextLevel(g) {
      g.clearOverlay();
      var keepScore = g.score, keepLevel = g.data.level;
      reset(g);
      g.data.level = keepLevel;
      g.score = keepScore;
      g.state = 'play';
      g.set('Level', keepLevel);
      g.best = Milo.store.best('water-sort');
    }

    function undo(g) {
      var d = g.data;
      var last = d.history.pop();
      if (!last) return;
      for (var i = 0; i < last.n; i++) d.tubes[last.from].push(d.tubes[last.to].pop());
      d.moves++;
      g.set('Moves', d.moves);
      Milo.sound.click();
    }

    return Milo.arcade(host, {
      id: 'water-sort',
      w: W, h: H, bg: '#0d1430',
      stats: ['Level', 'Moves', 'Tubes'],
      emo: '🧪',
      start: {
        title: 'Water Sort',
        text: 'Pour liquid between tubes until every tube holds a single colour. You can ' +
          'only pour onto the same colour, or into an empty tube. Press U to undo.',
        keys: ['Click a tube to lift', 'Click another to pour', 'U to undo']
      },
      preload: function (g) { g.data.level = 1; },
      init: reset,

      onKey: function (g, e) { if (e.code === 'KeyU') undo(g); },

      onPointer: function (g, type, px, py) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data;
        if (d.done) return;
        for (var i = 0; i < d.tubes.length; i++) {
          var r = tubeRect(d, i);
          if (px < r.x - 8 || px > r.x + r.w + 8 || py < r.y - 30 || py > r.y + r.h + 10) continue;
          if (d.sel == null) {
            if (d.tubes[i].length) { d.sel = i; Milo.sound.blip(); }
          } else if (d.sel === i) {
            d.sel = null;
          } else {
            pour(g, d.sel, i);
            d.sel = null;
          }
          return;
        }
        d.sel = null;
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#141c44'); bg.addColorStop(1, '#080c20');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        d.tubes.forEach(function (tube, i) {
          var r = tubeRect(d, i);
          var lift = d.sel === i ? -18 : 0;

          c.fillStyle = 'rgba(255,255,255,.05)';
          U.roundRect(c, r.x, r.y + lift, r.w, r.h, 14); c.fill();

          var slot = r.h / CAP;
          tube.forEach(function (v, k) {
            var y = r.y + r.h - (k + 1) * slot + lift;
            c.fillStyle = COLORS[v];
            var isBottom = k === 0;
            U.roundRect(c, r.x + 4, y + 2, r.w - 8, slot - 3, isBottom ? 11 : 3);
            c.fill();
          });

          c.strokeStyle = d.sel === i ? '#ffd257' : 'rgba(255,255,255,.28)';
          c.lineWidth = d.sel === i ? 3 : 2;
          U.roundRect(c, r.x, r.y + lift, r.w, r.h, 14); c.stroke();
        });

        c.fillStyle = 'rgba(255,255,255,.45)';
        c.font = '600 12px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText('Click a tube, then another to pour · U undoes', W / 2, H - 12);
      }
    });
  }

  window.Milo.register({
    id: 'water-sort', title: 'Water Sort', emo: '🧪', category: 'Puzzle',
    tagline: 'Pour until every tube is one colour',
    description: 'Tubes of stacked coloured liquid, jumbled up. Pour from one to another ' +
      'to sort them — but liquid only pours onto the same colour or into an empty tube, and ' +
      'a whole run of matching colour moves at once. Two spare tubes are all the room you ' +
      'get. Press U to undo when you paint yourself into a corner.',
    controls: ['Click a tube', 'Click another', 'U to undo'],
    colors: ['#0d1430', '#22d3ee'],
    tags: ['sorting', 'logic', 'relaxing', 'levels'],
    mount: mount
  });
})();
