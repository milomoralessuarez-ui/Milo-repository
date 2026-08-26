/* Nine Men's Morris — place, move, mill and remove. */
(function () {
  'use strict';
  var W = 620, H = 620;
  // 24 points on three nested squares, in a fixed layout.
  var PTS = [
    [0, 0], [3, 0], [6, 0], [1, 1], [3, 1], [5, 1], [2, 2], [3, 2], [4, 2],
    [0, 3], [1, 3], [2, 3], [4, 3], [5, 3], [6, 3],
    [2, 4], [3, 4], [4, 4], [1, 5], [3, 5], [5, 5], [0, 6], [3, 6], [6, 6]
  ];
  var ADJ = [
    [1, 9], [0, 2, 4], [1, 14], [4, 10], [1, 3, 5, 7], [4, 13], [7, 11], [4, 6, 8], [7, 12],
    [0, 10, 21], [3, 9, 11, 18], [6, 10, 15], [8, 13, 17], [5, 12, 14, 20], [2, 13, 23],
    [11, 16], [15, 17, 19], [12, 16], [10, 19], [16, 18, 20, 22], [13, 19], [9, 22], [19, 21, 23], [14, 22]
  ];
  var MILLS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11], [12, 13, 14], [15, 16, 17], [18, 19, 20], [21, 22, 23],
    [0, 9, 21], [3, 10, 18], [6, 11, 15], [1, 4, 7], [16, 19, 22], [8, 12, 17], [5, 13, 20], [2, 14, 23]
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var STEP = 84, PAD = (W - 6 * STEP) / 2;

    function reset(g) {
      var d = g.data;
      d.b = new Int8Array(24);        // 0 empty, 1 you, 2 cpu
      d.hand = { 1: 9, 2: 9 };
      d.turn = 1;
      d.sel = null;
      d.removing = false;
      d.over = false;
      d.thinking = 0;
      d.msg = 'Place a piece';
      g.set('Turn', 'Yours');
      g.set('In hand', 9);
      g.set('Won', d.wins || 0);
    }

    function xy(i) {
      return { x: PAD + PTS[i][0] * STEP, y: PAD + PTS[i][1] * STEP };
    }

    function millsAt(b, i, who) {
      return MILLS.filter(function (m) {
        return m.indexOf(i) !== -1 && m.every(function (k) { return b[k] === who; });
      });
    }

    function countOf(b, who) {
      var n = 0;
      for (var i = 0; i < 24; i++) if (b[i] === who) n++;
      return n;
    }

    function canFly(d, who) { return d.hand[who] === 0 && countOf(d.b, who) === 3; }

    function legalTargets(d, from, who) {
      if (canFly(d, who)) {
        var all = [];
        for (var i = 0; i < 24; i++) if (!d.b[i]) all.push(i);
        return all;
      }
      return ADJ[from].filter(function (i) { return !d.b[i]; });
    }

    /** Pieces you may take: not in a mill, unless everything is. */
    function removable(d, who) {
      var out = [], all = [];
      for (var i = 0; i < 24; i++) {
        if (d.b[i] !== who) continue;
        all.push(i);
        if (!millsAt(d.b, i, who).length) out.push(i);
      }
      return out.length ? out : all;
    }

    function endTurn(g, who, formedMill) {
      var d = g.data;
      if (formedMill) {
        d.removing = who;
        d.msg = who === 1 ? 'Mill! Take one of theirs' : 'CPU made a mill';
        Milo.sound.powerup();
        if (who === 2) { d.thinking = 0.6; }
        return;
      }
      var next = who === 1 ? 2 : 1;
      var pieces = countOf(d.b, next) + d.hand[next];
      var stuck = d.hand[next] === 0 && !canFly(d, next) &&
        ![].concat.apply([], Array.from({ length: 24 }, function (_, i) {
          return d.b[i] === next ? legalTargets(d, i, next) : [];
        })).length;

      if (pieces < 3 || stuck) {
        d.over = true;
        if (next === 2) {
          d.wins = (d.wins || 0) + 1;
          g.set('Won', d.wins);
          g.win({ emo: '⚪', title: 'You win!', score: d.wins * 250 });
        } else {
          g.gameOver({ emo: '⚫', title: 'CPU wins', score: (d.wins || 0) * 250 });
        }
        return;
      }
      d.turn = next;
      g.set('Turn', next === 1 ? 'Yours' : 'CPU…');
      g.set('In hand', d.hand[1]);
      d.msg = next === 1 ? (d.hand[1] ? 'Place a piece' : 'Move a piece') : 'CPU thinking…';
      if (next === 2) d.thinking = 0.6;
    }

    function place(g, i, who) {
      var d = g.data;
      d.b[i] = who;
      d.hand[who]--;
      Milo.sound.tone({ f: who === 1 ? 440 : 300, d: .07, v: .06, type: 'triangle' });
      endTurn(g, who, millsAt(d.b, i, who).length > 0);
    }

    function move(g, from, to, who) {
      var d = g.data;
      d.b[from] = 0;
      d.b[to] = who;
      Milo.sound.tone({ f: who === 1 ? 400 : 280, f2: 240, d: .08, v: .06, type: 'triangle' });
      endTurn(g, who, millsAt(d.b, to, who).length > 0);
    }

    function cpuTurn(g) {
      var d = g.data;
      if (d.over) return;

      if (d.removing === 2) {
        var opts = removable(d, 1);
        // Prefer taking a piece that is one away from completing a mill.
        var best = opts[0], bestScore = -1;
        opts.forEach(function (i) {
          var s = MILLS.filter(function (m) {
            if (m.indexOf(i) === -1) return false;
            var mine = m.filter(function (k) { return d.b[k] === 1; }).length;
            return mine === 2;
          }).length;
          if (s > bestScore) { bestScore = s; best = i; }
        });
        d.b[best] = 0;
        d.removing = false;
        Milo.sound.hit();
        endTurn(g, 2, false);
        return;
      }

      var moves = [];
      if (d.hand[2] > 0) {
        for (var i = 0; i < 24; i++) if (!d.b[i]) moves.push({ to: i });
      } else {
        for (var f = 0; f < 24; f++) {
          if (d.b[f] !== 2) continue;
          legalTargets(d, f, 2).forEach(function (t) { moves.push({ from: f, to: t }); });
        }
      }
      if (!moves.length) { endTurn(g, 2, false); return; }

      var bestMove = null, bestScore = -1e9;
      moves.forEach(function (m) {
        var copy = Int8Array.from(d.b);
        if (m.from != null) copy[m.from] = 0;
        copy[m.to] = 2;
        var s = 0;
        if (millsAt(copy, m.to, 2).length) s += 120;
        // Block a mill the player is about to complete.
        MILLS.forEach(function (mm) {
          if (mm.indexOf(m.to) === -1) return;
          var mine = mm.filter(function (k) { return d.b[k] === 1; }).length;
          var empty = mm.filter(function (k) { return !d.b[k]; }).length;
          if (mine === 2 && empty === 1) s += 90;
        });
        s += ADJ[m.to].filter(function (k) { return !copy[k]; }).length * 3;
        s += U.hash2(m.to, m.from || 0, 5) * 4;
        if (s > bestScore) { bestScore = s; bestMove = m; }
      });

      if (bestMove.from != null) move(g, bestMove.from, bestMove.to, 2);
      else place(g, bestMove.to, 2);
    }

    return Milo.arcade(host, {
      id: 'nine-mens-morris',
      w: W, h: H, bg: '#2b1d12',
      stats: ['Turn', 'In hand', 'Won'],
      emo: '⚪',
      start: {
        title: 'Nine Men’s Morris',
        text: 'Place your nine pieces, then slide them along the lines. Three in a row is ' +
          'a mill, and every mill lets you take one of theirs. Reduce them to two pieces, ' +
          'or leave them with no move, to win.',
        keys: ['Click a point to place', 'Click a piece then a point to move']
      },
      preload: function (g) { g.data.wins = 0; },
      init: reset,

      onPointer: function (g, type, px, py) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data;
        if (d.over || d.turn !== 1 || d.thinking > 0) return;

        var hit = -1;
        for (var i = 0; i < 24; i++) {
          var p = xy(i);
          if (U.dist(px, py, p.x, p.y) < 24) { hit = i; break; }
        }
        if (hit < 0) { d.sel = null; return; }

        if (d.removing === 1) {
          if (removable(d, 2).indexOf(hit) === -1) {
            d.msg = 'That piece is in a mill — pick another';
            return;
          }
          d.b[hit] = 0;
          d.removing = false;
          Milo.sound.hit();
          endTurn(g, 1, false);
          return;
        }

        if (d.hand[1] > 0) {
          if (d.b[hit]) { Milo.sound.tone({ f: 150, d: .06, v: .04, type: 'square' }); return; }
          place(g, hit, 1);
          return;
        }

        if (d.sel != null) {
          if (legalTargets(d, d.sel, 1).indexOf(hit) !== -1) {
            move(g, d.sel, hit, 1);
            d.sel = null;
            return;
          }
          d.sel = null;
        }
        if (d.b[hit] === 1) { d.sel = hit; Milo.sound.blip(); }
      },

      update: function (g, dt) {
        var d = g.data;
        if (d.thinking > 0) {
          d.thinking -= dt;
          if (d.thinking <= 0 && (d.turn === 2 || d.removing === 2)) cpuTurn(g);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#3d2a17'); bg.addColorStop(1, '#1d1409');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        c.strokeStyle = '#a1815a'; c.lineWidth = 3;
        [0, 1, 2].forEach(function (ring) {
          var o = ring * STEP;
          c.strokeRect(PAD + o, PAD + o, 6 * STEP - o * 2, 6 * STEP - o * 2);
        });
        c.beginPath();
        c.moveTo(PAD + 3 * STEP, PAD); c.lineTo(PAD + 3 * STEP, PAD + 2 * STEP);
        c.moveTo(PAD + 3 * STEP, PAD + 4 * STEP); c.lineTo(PAD + 3 * STEP, PAD + 6 * STEP);
        c.moveTo(PAD, PAD + 3 * STEP); c.lineTo(PAD + 2 * STEP, PAD + 3 * STEP);
        c.moveTo(PAD + 4 * STEP, PAD + 3 * STEP); c.lineTo(PAD + 6 * STEP, PAD + 3 * STEP);
        c.stroke();

        var targets = d.sel != null ? legalTargets(d, d.sel, 1) : [];
        var takeable = d.removing === 1 ? removable(d, 2) : [];

        for (var i = 0; i < 24; i++) {
          var p = xy(i);
          if (!d.b[i]) {
            c.fillStyle = targets.indexOf(i) !== -1 ? 'rgba(52,211,153,.6)' : '#6b5436';
            c.beginPath(); c.arc(p.x, p.y, targets.indexOf(i) !== -1 ? 12 : 7, 0, 7); c.fill();
            continue;
          }
          var mine = d.b[i] === 1;
          c.fillStyle = 'rgba(0,0,0,.35)';
          c.beginPath(); c.arc(p.x + 2, p.y + 3, 20, 0, 7); c.fill();
          var grd = c.createRadialGradient(p.x - 6, p.y - 7, 3, p.x, p.y, 21);
          if (mine) { grd.addColorStop(0, '#fff'); grd.addColorStop(1, '#c8ccd8'); }
          else { grd.addColorStop(0, '#555'); grd.addColorStop(1, '#141414'); }
          c.fillStyle = grd;
          c.beginPath(); c.arc(p.x, p.y, 20, 0, 7); c.fill();
          if (d.sel === i) {
            c.strokeStyle = '#ffd257'; c.lineWidth = 3;
            c.beginPath(); c.arc(p.x, p.y, 24, 0, 7); c.stroke();
          }
          if (takeable.indexOf(i) !== -1) {
            c.strokeStyle = '#fb7185'; c.lineWidth = 3;
            c.beginPath(); c.arc(p.x, p.y, 24, 0, 7); c.stroke();
          }
        }

        c.fillStyle = '#f3e6d2';
        c.font = '700 16px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText(d.msg, W / 2, H - 18);
        c.font = '600 12px Outfit, sans-serif';
        c.fillStyle = 'rgba(255,255,255,.5)';
        c.fillText('You ' + (countOf(d.b, 1) + d.hand[1]) + '  ·  CPU ' + (countOf(d.b, 2) + d.hand[2]), W / 2, 24);
      }
    });
  }

  window.Milo.register({
    id: 'nine-mens-morris', title: 'Nine Men’s Morris', emo: '⚪', category: 'Strategy',
    tagline: 'Place, slide, mill, remove',
    description: 'An ancient game in three phases. First you both place nine pieces on the ' +
      'board; then you slide them along the lines; and once you are down to three you may ' +
      'fly anywhere. Getting three in a row is a mill, and every mill you form lets you take ' +
      'one of your opponent’s pieces — but not one that is itself in a mill, unless they all are.',
    controls: ['Click a point', 'Click a piece then a point'],
    colors: ['#3d2a17', '#f3e6d2'],
    tags: ['board game', 'ancient', 'vs cpu', 'strategy'],
    mount: mount
  });
})();
