/* Paper Claim — leave your trail, close the loop, own the ground. */
(function () {
  'use strict';
  var COLS = 60, ROWS = 40, CELL = 16;
  var W = COLS * CELL, H = ROWS * CELL;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.owner = new Int8Array(COLS * ROWS);     // 0 none, 1 you, 2+ bots
      d.trail = new Int8Array(COLS * ROWS);
      d.players = [{
        x: COLS >> 1, y: ROWS >> 1, dir: { x: 1, y: 0 }, id: 1,
        col: '#22d3ee', trailCol: '#0e7490', t: 0, alive: true, bot: false, trail: []
      }];
      for (var b = 0; b < 3; b++) {
        d.players.push({
          x: U.randInt(6, COLS - 7), y: U.randInt(6, ROWS - 7),
          dir: { x: 0, y: 1 }, id: 2 + b,
          col: ['#fb7185', '#facc15', '#a78bfa'][b],
          trailCol: ['#9f1239', '#a16207', '#5b21b6'][b],
          t: 0, alive: true, bot: true, trail: [], turn: 0
        });
      }
      d.players.forEach(function (p) { claimBlock(d, p, 2); });
      d.speed = 9;
      g.set('Land', '0%');
      g.set('Rivals', 3);
      g.set('Best', U.fmt(g.best));
    }

    function claimBlock(d, p, r) {
      for (var dy = -r; dy <= r; dy++) {
        for (var dx = -r; dx <= r; dx++) {
          var x = p.x + dx, y = p.y + dy;
          if (x < 0 || y < 0 || x >= COLS || y >= ROWS) continue;
          d.owner[y * COLS + x] = p.id;
        }
      }
    }

    /** Flood from the border; anything unreached is enclosed and becomes yours. */
    function fillEnclosed(d, p) {
      var seen = new Uint8Array(COLS * ROWS);
      var stack = [];
      for (var x = 0; x < COLS; x++) { stack.push(x); stack.push((ROWS - 1) * COLS + x); }
      for (var y = 0; y < ROWS; y++) { stack.push(y * COLS); stack.push(y * COLS + COLS - 1); }
      while (stack.length) {
        var i = stack.pop();
        if (seen[i]) continue;
        if (d.owner[i] === p.id) continue;
        seen[i] = 1;
        var cx = i % COLS, cy = (i / COLS) | 0;
        if (cx > 0) stack.push(i - 1);
        if (cx < COLS - 1) stack.push(i + 1);
        if (cy > 0) stack.push(i - COLS);
        if (cy < ROWS - 1) stack.push(i + COLS);
      }
      var gained = 0;
      for (var k = 0; k < COLS * ROWS; k++) {
        if (!seen[k] && d.owner[k] !== p.id) { d.owner[k] = p.id; gained++; }
      }
      return gained;
    }

    function closeLoop(d, p, g) {
      p.trail.forEach(function (t) {
        d.owner[t.y * COLS + t.x] = p.id;
        d.trail[t.y * COLS + t.x] = 0;
      });
      var gained = fillEnclosed(d, p);
      p.trail = [];
      if (!p.bot) {
        g.score += gained * 2 + 10;
        Milo.sound.coin();
      }
    }

    function kill(d, p, g) {
      p.trail.forEach(function (t) { d.trail[t.y * COLS + t.x] = 0; });
      p.trail = [];
      if (!p.bot) {
        p.alive = false;
        return;
      }
      // Respawn bots somewhere fresh.
      p.x = U.randInt(6, COLS - 7);
      p.y = U.randInt(6, ROWS - 7);
      claimBlock(d, p, 2);
    }

    return Milo.arcade(host, {
      id: 'paper-claim',
      w: W, h: H, bg: '#0c1024',
      stats: ['Land', 'Rivals', 'Best'],
      touch: 'dpad',
      emo: '🟦',
      start: {
        title: 'Paper Claim',
        text: 'Drive out of your territory to leave a trail, then return to your own land ' +
          'to claim everything you enclosed. Your trail is your weakness — if anything ' +
          'crosses it, including you, you are out.',
        keys: ['Arrow keys / WASD']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, i = g.input;
        var me = d.players[0];

        if (i.down('up') && me.dir.y === 0) me.dir = { x: 0, y: -1 };
        if (i.down('down') && me.dir.y === 0) me.dir = { x: 0, y: 1 };
        if (i.down('left') && me.dir.x === 0) me.dir = { x: -1, y: 0 };
        if (i.down('right') && me.dir.x === 0) me.dir = { x: 1, y: 0 };

        d.players.forEach(function (p) {
          if (!p.alive) return;
          p.t += dt * d.speed;
          if (p.t < 1) return;
          p.t -= 1;

          if (p.bot) {
            p.turn -= 1;
            if (p.turn <= 0) {
              p.turn = U.randInt(3, 9);
              // Head back home once the trail is getting long.
              if (p.trail.length > 14) {
                var home = null;
                for (var k = 0; k < COLS * ROWS; k += 7) {
                  if (d.owner[k] === p.id) { home = { x: k % COLS, y: (k / COLS) | 0 }; break; }
                }
                if (home) {
                  p.dir = Math.abs(home.x - p.x) > Math.abs(home.y - p.y)
                    ? { x: Math.sign(home.x - p.x) || 1, y: 0 }
                    : { x: 0, y: Math.sign(home.y - p.y) || 1 };
                }
              } else {
                p.dir = p.dir.x ? { x: 0, y: Math.random() < .5 ? 1 : -1 } : { x: Math.random() < .5 ? 1 : -1, y: 0 };
              }
            }
          }

          var nx = p.x + p.dir.x, ny = p.y + p.dir.y;
          if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) { kill(d, p, g); return; }
          p.x = nx; p.y = ny;
          var idx = ny * COLS + nx;

          // Anyone's trail is fatal to whoever touches it.
          if (d.trail[idx]) {
            var victim = d.players.filter(function (q) { return q.id === d.trail[idx]; })[0];
            if (victim) kill(d, victim, g);
            if (victim === p) return;
          }

          if (d.owner[idx] === p.id) {
            if (p.trail.length) closeLoop(d, p, g);
          } else {
            p.trail.push({ x: nx, y: ny });
            d.trail[idx] = p.id;
          }
        });

        var mine = 0;
        for (var k2 = 0; k2 < COLS * ROWS; k2++) if (d.owner[k2] === 1) mine++;
        var pct = Math.round(mine / (COLS * ROWS) * 100);

        if (!me.alive) {
          Milo.sound.explode();
          g.gameOver({
            score: mine,
            text: 'You were holding ' + pct + '% of the map when your trail was cut.'
          });
          return;
        }
        g.set('Land', pct + '%');
        g.score = Math.max(g.score, mine);
        if (pct >= 60) {
          g.win({ score: g.score, emo: '🟦', title: 'You own the map!', text: pct + '% claimed.' });
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.fillStyle = '#0c1024'; c.fillRect(0, 0, W, H);

        for (var y = 0; y < ROWS; y++) {
          for (var x = 0; x < COLS; x++) {
            var i = y * COLS + x;
            var o = d.owner[i], t = d.trail[i];
            if (!o && !t) continue;
            var p = d.players.filter(function (q) { return q.id === (t || o); })[0];
            if (!p) continue;
            c.fillStyle = t ? p.trailCol : p.col;
            c.fillRect(x * CELL, y * CELL, CELL, CELL);
          }
        }

        d.players.forEach(function (p) {
          if (!p.alive) return;
          c.fillStyle = '#fff';
          U.roundRect(c, p.x * CELL - 2, p.y * CELL - 2, CELL + 4, CELL + 4, 4); c.fill();
          c.fillStyle = p.col;
          U.roundRect(c, p.x * CELL, p.y * CELL, CELL, CELL, 3); c.fill();
        });
      }
    });
  }

  window.Milo.register({
    id: 'paper-claim', title: 'Paper Claim', emo: '🟦', category: 'Action',
    tagline: 'Claim ground by closing the loop',
    description: 'You start with a small square of territory. Drive outside it and you ' +
      'leave a trail behind you; get back to your own land and everything the loop enclosed ' +
      'becomes yours. While you are outside, that trail is lethal — anything that crosses it, ' +
      'including you, dies. Three rivals are doing the same thing. Claim 60% to win.',
    controls: ['Arrow keys', 'WASD', 'Touch pad'],
    colors: ['#0c1024', '#22d3ee'],
    tags: ['io-style', 'territory', 'arena', 'action'],
    mount: mount
  });
})();
