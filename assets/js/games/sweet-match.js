/* Sweet Match — match-3 with objectives instead of a raw score chase. */
(function () {
  'use strict';
  var N = 8, CELL = 60, W = N * CELL + 220, H = N * CELL + 40;
  var GX = 16, GY = 20;
  var SWEETS = ['🍬', '🍭', '🍩', '🧁', '🍪', '🍫'];
  var COLS = ['#fb7185', '#a78bfa', '#f59e0b', '#22d3ee', '#84cc16', '#f472b6'];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.level = d.level || 1;
      d.b = [];
      for (var y = 0; y < N; y++) {
        d.b.push([]);
        for (var x = 0; x < N; x++) d.b[y].push(U.randInt(0, SWEETS.length - 1));
      }
      var guard = 0;
      while (findMatches(d).length && guard++ < 60) resolve(d);
      d.goalKind = U.randInt(0, SWEETS.length - 1);
      d.goalNeed = 18 + d.level * 6;
      d.goalDone = 0;
      d.moves = 22;
      d.sel = null;
      d.combo = 0;
      d.pops = [];
      g.set('Goal', d.goalDone + '/' + d.goalNeed);
      g.set('Moves', d.moves);
      g.set('Level', d.level);
    }

    function findMatches(d) {
      var out = [];
      for (var y = 0; y < N; y++) {
        for (var x = 0; x < N - 2; x++) {
          var v = d.b[y][x];
          if (v < 0) continue;
          if (d.b[y][x + 1] === v && d.b[y][x + 2] === v) {
            var run = [];
            var k = x;
            while (k < N && d.b[y][k] === v) { run.push({ x: k, y: y }); k++; }
            out.push(run);
          }
        }
      }
      for (var x2 = 0; x2 < N; x2++) {
        for (var y2 = 0; y2 < N - 2; y2++) {
          var v2 = d.b[y2][x2];
          if (v2 < 0) continue;
          if (d.b[y2 + 1][x2] === v2 && d.b[y2 + 2][x2] === v2) {
            var run2 = [];
            var k2 = y2;
            while (k2 < N && d.b[k2][x2] === v2) { run2.push({ x: x2, y: k2 }); k2++; }
            out.push(run2);
          }
        }
      }
      return out;
    }

    function resolve(d, g) {
      var matches = findMatches(d);
      if (!matches.length) return 0;
      var cleared = {};
      matches.forEach(function (run) {
        run.forEach(function (p) { cleared[p.y * N + p.x] = d.b[p.y][p.x]; });
      });
      var keys = Object.keys(cleared);
      keys.forEach(function (k) {
        var i = +k;
        if (g && cleared[k] === d.goalKind) d.goalDone++;
        if (g) d.pops.push({ x: i % N, y: (i / N) | 0, t: .35 });
        d.b[(i / N) | 0][i % N] = -1;
      });
      for (var x = 0; x < N; x++) {
        var col = [];
        for (var y = N - 1; y >= 0; y--) if (d.b[y][x] >= 0) col.push(d.b[y][x]);
        for (var y2 = N - 1, c = 0; y2 >= 0; y2--, c++) {
          d.b[y2][x] = col[c] != null ? col[c] : U.randInt(0, SWEETS.length - 1);
        }
      }
      return keys.length;
    }

    function cascade(g) {
      var d = g.data;
      d.combo = 0;
      var guard = 0, total = 0;
      while (guard++ < 30) {
        var n = resolve(d, g);
        if (!n) break;
        d.combo++;
        total += n * 12 * d.combo;
        Milo.sound.tone({ f: 440 + d.combo * 70, d: .07, v: .06, type: 'square' });
      }
      if (total) { g.score += total; }
      g.set('Goal', Math.min(d.goalDone, d.goalNeed) + '/' + d.goalNeed);
    }

    function swap(g, a, b) {
      var d = g.data;
      var t = d.b[a.y][a.x];
      d.b[a.y][a.x] = d.b[b.y][b.x];
      d.b[b.y][b.x] = t;
      if (!findMatches(d).length) {
        d.b[b.y][b.x] = d.b[a.y][a.x];
        d.b[a.y][a.x] = t;
        Milo.sound.tone({ f: 150, d: .07, v: .05, type: 'square' });
        return;
      }
      d.moves--;
      g.set('Moves', d.moves);
      cascade(g);

      if (d.goalDone >= d.goalNeed) {
        var earned = 500 + d.moves * 40;
        g.score += earned;
        Milo.sound.win();
        d.level++;
        g.overlay({
          emo: '🍬', title: 'Order filled!',
          text: d.moves + ' moves to spare — worth ' + U.fmt(earned) + ' bonus.',
          score: g.score, best: g.best,
          newBest: Milo.store.setBest('sweet-match', g.score),
          actions: [
            { label: 'Next order →', primary: true, onClick: function () { next(g); } },
            { label: 'Start over', onClick: function () { g.data.level = 1; g.restart(); } }
          ]
        });
        return;
      }
      if (d.moves <= 0) {
        g.gameOver({
          emo: '🍬', title: 'Out of moves',
          text: 'You needed ' + (d.goalNeed - d.goalDone) + ' more ' + SWEETS[d.goalKind] + '.'
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
      g.set('Level', keepLevel);
      g.best = Milo.store.best('sweet-match');
    }

    return Milo.arcade(host, {
      id: 'sweet-match',
      w: W, h: H, bg: '#2a1030',
      stats: ['Goal', 'Moves', 'Level'],
      emo: '🍬',
      start: {
        title: 'Sweet Match',
        text: 'Each level asks for a set number of one particular sweet. Swap adjacent ' +
          'sweets to line up three or more — but you only get so many moves, so clearing ' +
          'the right colour matters more than clearing the most.',
        keys: ['Click a sweet, then a neighbour']
      },
      preload: function (g) { g.data.level = 1; },
      init: reset,

      onPointer: function (g, type, px, py) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data;
        var x = Math.floor((px - GX) / CELL), y = Math.floor((py - GY) / CELL);
        if (x < 0 || y < 0 || x >= N || y >= N) return;
        if (!d.sel) { d.sel = { x: x, y: y }; Milo.sound.blip(); return; }
        if (Math.abs(d.sel.x - x) + Math.abs(d.sel.y - y) === 1) {
          swap(g, d.sel, { x: x, y: y });
          d.sel = null;
        } else d.sel = { x: x, y: y };
      },

      update: function (g, dt) {
        g.data.pops = g.data.pops.filter(function (p) { p.t -= dt; return p.t > 0; });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#3a1440'); bg.addColorStop(1, '#180820');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        for (var y = 0; y < N; y++) {
          for (var x = 0; x < N; x++) {
            var px = GX + x * CELL, py = GY + y * CELL;
            c.fillStyle = (x + y) % 2 ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.02)';
            U.roundRect(c, px + 2, py + 2, CELL - 4, CELL - 4, 8); c.fill();
            var v = d.b[y][x];
            if (v < 0) continue;
            var sel = d.sel && d.sel.x === x && d.sel.y === y;
            if (sel) {
              c.fillStyle = 'rgba(255,210,87,.3)';
              U.roundRect(c, px + 2, py + 2, CELL - 4, CELL - 4, 8); c.fill();
            }
            c.font = (CELL * .62) + 'px serif';
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.fillText(SWEETS[v], px + CELL / 2, py + CELL / 2 + 2);
          }
        }
        c.textBaseline = 'alphabetic';

        d.pops.forEach(function (p) {
          c.globalAlpha = p.t / .35;
          c.strokeStyle = '#fff'; c.lineWidth = 3;
          c.beginPath();
          c.arc(GX + p.x * CELL + CELL / 2, GY + p.y * CELL + CELL / 2, (1 - p.t / .35) * CELL * .6, 0, 7);
          c.stroke();
        });
        c.globalAlpha = 1;

        var px2 = GX + N * CELL + 20;
        c.fillStyle = 'rgba(255,255,255,.55)';
        c.font = '700 12px Outfit, sans-serif';
        c.textAlign = 'left';
        c.fillText('THIS ORDER', px2, 46);
        c.font = '44px serif';
        c.fillText(SWEETS[d.goalKind], px2, 100);
        c.fillStyle = COLS[d.goalKind];
        c.font = '800 22px Outfit, sans-serif';
        c.fillText(Math.min(d.goalDone, d.goalNeed) + ' / ' + d.goalNeed, px2, 136);

        c.fillStyle = 'rgba(255,255,255,.10)';
        U.roundRect(c, px2, 152, 168, 12, 6); c.fill();
        c.fillStyle = COLS[d.goalKind];
        U.roundRect(c, px2, 152, 168 * U.clamp(d.goalDone / d.goalNeed, 0, 1), 12, 6); c.fill();

        if (d.combo > 1) {
          c.fillStyle = '#ffd257';
          c.font = '800 18px Outfit, sans-serif';
          c.fillText('COMBO ×' + d.combo, px2, 210);
        }
      }
    });
  }

  window.Milo.register({
    id: 'sweet-match', title: 'Sweet Match', emo: '🍬', category: 'Puzzle',
    tagline: 'Fill the order before the moves run out',
    description: 'A match-three where score is not the point: each level names one sweet ' +
      'and a number of them to clear, and gives you a fixed number of moves to do it. That ' +
      'turns it into a planning game — a big cascade of the wrong colour is a wasted move, ' +
      'and leftover moves pay a bonus.',
    controls: ['Click a sweet, then a neighbour'],
    colors: ['#2a1030', '#f472b6'],
    tags: ['match 3', 'objectives', 'puzzle', 'levels'],
    mount: mount
  });
})();
