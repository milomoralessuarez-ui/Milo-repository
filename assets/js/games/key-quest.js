/* Key Quest — a small dungeon of locked doors, keys and one very grumpy exit. */
(function () {
  'use strict';
  var W = 800, H = 640, CELL = 40, COLS = 19, ROWS = 13;
  var OX = (W - COLS * CELL) / 2, OY = 56;
  var COLORS = { r: '#e0553f', g: '#4fb865', b: '#4a86d8', y: '#e8c24a' };
  var NAMES = { r: 'red', g: 'green', b: 'blue', y: 'gold' };

  /* # wall  . floor  @ start  X exit  rgby key  RGBY door  * coin  ~ spikes  P pusher block */
  var ROOMS = [
    [
      '###################',
      '#@....#.........#.#',
      '#.#.#.#.#.#####.#.#',
      '#....R.....G..#...#',
      '#.###.#######.###.#',
      '#.......g.....#...#',
      '###.###.#.###.#.###',
      '#.#.#...#..b.B#...#',
      '#.#r#.#######.###.#',
      '#...#....*....#..y#',
      '#.#####.#.#.###.###',
      '#......*..#Y.*...X#',
      '###################'
    ],
    [
      '###################',
      '#@#.........*.....#',
      '#.#.#.#####.#####.#',
      '#.#........*#..*..#',
      '#r#########.#.#####',
      '#.R....G.....B....#',
      '###.#.#####.#.#.#Y#',
      '#.....#.g...#.....#',
      '#.#####.#.###.###.#',
      '#.#...#.#....b..#.#',
      '#.#.#.#.#######.#.#',
      '#...#..........y#X#',
      '###################'
    ],
    [
      '###################',
      '#@....R.#...#.....#',
      '#.#####.#.#.#.###.#',
      '#.....#..G....#.#r#',
      '#.#.#####.#####.#.#',
      '#.g.#........B..#.#',
      '#.#.#.#########.#.#',
      '#.#.#........y..Y.#',
      '#.###*#.#######.#.#',
      '#.*.#.#...#...#...#',
      '#.#*#.#.#.#.#.###.#',
      '#.#.....#....b...X#',
      '###################'
    ]
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function loadRoom(g, n) {
      var d = g.data;
      var src = ROOMS[n % ROOMS.length];
      d.grid = src.map(function (r) { return r.split(''); });
      d.keys = { r: 0, g: 0, b: 0, y: 0 };
      d.coins = 0;
      d.totalCoins = 0;
      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          var t = d.grid[r][c];
          if (t === '@') { d.px = c; d.py = r; d.grid[r][c] = '.'; }
          else if (t === '*') d.totalCoins++;
        }
      }
      d.steps = 0;
      d.moveT = 0;
      d.from = { x: d.px, y: d.py };
      d.done = 0;
      d.msg = '';
      d.msgT = 0;
      g.set('Room', (n % ROOMS.length) + 1);
      g.set('Coins', '0/' + d.totalCoins);
      g.set('Keys', '—');
    }

    function reset(g) {
      var d = g.data;
      d.room = d.room || 0;
      d.parts = [];
      loadRoom(g, d.room);
      g.set('Best', g.best ? U.fmt(g.best) : '—');
    }

    function say(d, text) { d.msg = text; d.msgT = 1.6; }

    function keyLabel(d) {
      var parts = [];
      'rgby'.split('').forEach(function (k) { if (d.keys[k]) parts.push(d.keys[k] + '×' + NAMES[k]); });
      return parts.length ? parts.join(' ') : '—';
    }

    function at(d, x, y) {
      if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return '#';
      return d.grid[y][x];
    }

    function step(g, dx, dy) {
      var d = g.data;
      if (d.done || d.moveT > 0) return;
      var nx = d.px + dx, ny = d.py + dy;
      var t = at(d, nx, ny);

      if (t === '#') return;

      // A door opens only if you are carrying its colour, and it spends the key.
      if ('RGBY'.indexOf(t) >= 0) {
        var col = t.toLowerCase();
        if (d.keys[col] > 0) {
          d.keys[col]--;
          d.grid[ny][nx] = '.';
          say(d, 'The ' + NAMES[col] + ' door swings open');
          g.set('Keys', keyLabel(d));
          g.score += 60;
          g.set('Score', g.score);
          Milo.sound.powerup();
          for (var i = 0; i < 12; i++) {
            var a = U.rand(0, Math.PI * 2);
            d.parts.push({
              x: OX + (nx + .5) * CELL, y: OY + (ny + .5) * CELL,
              vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, life: .5, c: COLORS[col]
            });
          }
        } else {
          say(d, 'Locked — you need a ' + NAMES[col] + ' key');
          Milo.sound.tone({ f: 130, d: .12, v: .05, type: 'square' });
        }
        return;
      }

      // Pushers slide one cell if the space beyond is clear.
      if (t === 'P') {
        var bx = nx + dx, by = ny + dy;
        if (at(d, bx, by) !== '.') { say(d, 'The crate will not budge'); return; }
        d.grid[by][bx] = 'P';
        d.grid[ny][nx] = '.';
        Milo.sound.hit();
      }

      d.from = { x: d.px, y: d.py };
      d.px = nx; d.py = ny;
      d.moveT = .12;
      d.steps++;

      var here = at(d, nx, ny);
      if ('rgby'.indexOf(here) >= 0) {
        d.keys[here]++;
        d.grid[ny][nx] = '.';
        g.set('Keys', keyLabel(d));
        g.score += 100;
        g.set('Score', g.score);
        say(d, 'Picked up a ' + NAMES[here] + ' key');
        Milo.sound.coin();
      } else if (here === '*') {
        d.grid[ny][nx] = '.';
        d.coins++;
        g.score += 75;
        g.set('Score', g.score);
        g.set('Coins', d.coins + '/' + d.totalCoins);
        Milo.sound.coin();
      } else if (here === '~') {
        say(d, 'Ouch — the spikes');
        g.score = Math.max(0, g.score - 50);
        g.set('Score', g.score);
        Milo.sound.hit();
      } else if (here === 'X') {
        d.done = .01;
        Milo.sound.win();
      }
    }

    return Milo.arcade(host, {
      id: 'key-quest',
      w: W, h: H, bg: '#171325',
      stats: ['Score', 'Room', 'Keys', 'Coins', 'Best'],
      emo: '🗝️',
      trackBest: true,
      touch: 'dpad',
      start: {
        title: 'Key Quest',
        text: 'Find the keys, open the matching doors, and reach the exit. Each key opens ' +
          'exactly one door of its colour, so the order you spend them in is the puzzle.',
        keys: ['Arrows / WASD to walk', 'R to restart the room']
      },
      init: reset,

      onKey: function (g, e, name) {
        if (g.state !== 'play') return;
        var d = g.data;
        if (e.code === 'KeyR') { loadRoom(g, d.room); return; }
        if (name === 'left') step(g, -1, 0);
        else if (name === 'right') step(g, 1, 0);
        else if (name === 'up') step(g, 0, -1);
        else if (name === 'down') step(g, 0, 1);
      },

      update: function (g, dt) {
        var d = g.data, input = g.input;
        var i;

        for (i = d.parts.length - 1; i >= 0; i--) {
          var pt = d.parts[i];
          pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.life -= dt;
          if (pt.life <= 0) d.parts.splice(i, 1);
        }

        if (d.moveT > 0) d.moveT = Math.max(0, d.moveT - dt);
        if (d.msgT > 0) d.msgT -= dt;

        // Holding a direction repeats the step once the previous one lands.
        if (!d.done && d.moveT <= 0) {
          if (input.down('left')) step(g, -1, 0);
          else if (input.down('right')) step(g, 1, 0);
          else if (input.down('up')) step(g, 0, -1);
          else if (input.down('down')) step(g, 0, 1);
        }

        if (d.done) {
          d.done += dt;
          if (d.done > 1.1) {
            var full = d.coins === d.totalCoins;
            g.score += 400 + (full ? 300 : 0) + Math.max(0, 400 - d.steps * 3);
            g.set('Score', g.score);
            d.room++;
            if (d.room >= ROOMS.length) {
              g.win({
                emo: '🗝️', title: 'Dungeon cleared!',
                text: 'You opened every door across ' + ROOMS.length + ' rooms.',
                score: g.score
              });
              d.room = 0;
              return;
            }
            loadRoom(g, d.room);
          }
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#231d3a'); bg.addColorStop(1, '#100d1c');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        c.textAlign = 'center';
        c.textBaseline = 'middle';

        for (var r = 0; r < ROWS; r++) {
          for (var cc = 0; cc < COLS; cc++) {
            var t = d.grid[r][cc], x = OX + cc * CELL, y = OY + r * CELL;
            if (t === '#') {
              c.fillStyle = (cc + r) % 2 ? '#3b3357' : '#362f50';
              c.fillRect(x, y, CELL, CELL);
              c.fillStyle = 'rgba(255,255,255,.06)';
              c.fillRect(x + 2, y + 2, CELL - 4, 3);
              continue;
            }
            c.fillStyle = (cc + r) % 2 ? '#1d1930' : '#1a1730';
            c.fillRect(x, y, CELL, CELL);

            if ('rgby'.indexOf(t) >= 0) {
              // Keys bob so they read as pickups rather than floor decoration.
              var bob = Math.sin(g.t * 3.5 + cc) * 2;
              c.fillStyle = COLORS[t];
              c.beginPath(); c.arc(x + CELL / 2 - 4, y + CELL / 2 + bob, 6, 0, Math.PI * 2); c.fill();
              c.fillRect(x + CELL / 2 - 2, y + CELL / 2 - 2 + bob, 13, 4);
              c.fillRect(x + CELL / 2 + 7, y + CELL / 2 + 2 + bob, 4, 4);
            } else if ('RGBY'.indexOf(t) >= 0) {
              var col = COLORS[t.toLowerCase()];
              c.fillStyle = U.shade(col, -25);
              U.roundRect(c, x + 3, y + 3, CELL - 6, CELL - 6, 5); c.fill();
              c.fillStyle = col;
              U.roundRect(c, x + 6, y + 6, CELL - 12, CELL - 12, 4); c.fill();
              c.fillStyle = 'rgba(0,0,0,.5)';
              c.beginPath(); c.arc(x + CELL - 13, y + CELL / 2, 3.5, 0, Math.PI * 2); c.fill();
            } else if (t === '*') {
              var cb = Math.sin(g.t * 4 + r) * 2;
              c.fillStyle = '#ffd166';
              c.beginPath(); c.ellipse(x + CELL / 2, y + CELL / 2 + cb, 7, 8, 0, 0, Math.PI * 2); c.fill();
              c.fillStyle = '#c9992f';
              c.beginPath(); c.ellipse(x + CELL / 2, y + CELL / 2 + cb, 3.5, 4.5, 0, 0, Math.PI * 2); c.fill();
            } else if (t === '~') {
              c.fillStyle = '#8d93a8';
              for (var k = 0; k < 3; k++) {
                c.beginPath();
                c.moveTo(x + 7 + k * 11, y + CELL - 7);
                c.lineTo(x + 12 + k * 11, y + 9);
                c.lineTo(x + 17 + k * 11, y + CELL - 7);
                c.closePath(); c.fill();
              }
            } else if (t === 'P') {
              c.fillStyle = '#8a6a3a';
              U.roundRect(c, x + 4, y + 4, CELL - 8, CELL - 8, 5); c.fill();
              c.strokeStyle = '#6b5029';
              c.lineWidth = 2;
              c.beginPath();
              c.moveTo(x + 6, y + 6); c.lineTo(x + CELL - 6, y + CELL - 6);
              c.moveTo(x + CELL - 6, y + 6); c.lineTo(x + 6, y + CELL - 6);
              c.stroke();
            } else if (t === 'X') {
              var pulse = .55 + Math.sin(g.t * 3.5) * .22;
              c.fillStyle = 'rgba(120,240,170,' + pulse + ')';
              U.roundRect(c, x + 3, y + 3, CELL - 6, CELL - 6, 6); c.fill();
              c.fillStyle = '#0d1a12';
              c.font = '600 13px Outfit, sans-serif';
              c.fillText('EXIT', x + CELL / 2, y + CELL / 2 + 1);
            }
          }
        }

        // Interpolating the last step keeps the walk from looking like teleporting.
        var k2 = d.moveT > 0 ? d.moveT / .12 : 0;
        var dx = OX + (d.px + .5) * CELL - (d.px - d.from.x) * CELL * k2;
        var dy = OY + (d.py + .5) * CELL - (d.py - d.from.y) * CELL * k2;
        var scale = d.done ? Math.max(0, 1 - d.done / 1.1) : 1;

        if (scale > .02) {
          c.fillStyle = 'rgba(0,0,0,.3)';
          c.beginPath(); c.ellipse(dx, dy + 12, 11 * scale, 5 * scale, 0, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#f0e3c8';
          U.roundRect(c, dx - 10 * scale, dy - 13 * scale, 20 * scale, 24 * scale, 6 * scale); c.fill();
          c.fillStyle = '#4a86d8';
          c.fillRect(dx - 10 * scale, dy - 2 * scale, 20 * scale, 11 * scale);
          c.fillStyle = '#2b2438';
          c.beginPath(); c.arc(dx - 4 * scale, dy - 6 * scale, 2 * scale, 0, Math.PI * 2); c.fill();
          c.beginPath(); c.arc(dx + 4 * scale, dy - 6 * scale, 2 * scale, 0, Math.PI * 2); c.fill();
        }

        d.parts.forEach(function (pt) {
          c.globalAlpha = Math.max(0, pt.life * 2);
          c.fillStyle = pt.c;
          c.fillRect(pt.x - 2.5, pt.y - 2.5, 5, 5);
        });
        c.globalAlpha = 1;

        if (d.msgT > 0) {
          c.globalAlpha = Math.min(1, d.msgT * 1.6);
          c.fillStyle = 'rgba(0,0,0,.6)';
          U.roundRect(c, W / 2 - 170, H - 46, 340, 30, 8); c.fill();
          c.fillStyle = '#ffe4a8';
          c.font = '600 14px Outfit, sans-serif';
          c.fillText(d.msg, W / 2, H - 30);
          c.globalAlpha = 1;
        }
        c.textBaseline = 'alphabetic';
      }
    });
  }

  window.Milo.register({
    id: 'key-quest', title: 'Key Quest', emo: '🗝️', category: 'Action',
    tagline: 'Every door wants a different key',
    description: 'A top-down dungeon built entirely out of locked doors. Keys come in four ' +
      'colours and each one opens a single door of its colour and is then gone, so the room ' +
      'unlocks in a fixed order that you have to work out by exploring. ' +
      'Crates can be shoved out of the way, spikes cost you points, and the coins tucked behind ' +
      'the most awkward doors are worth a clean-sweep bonus if you get all of them.',
    controls: ['Arrows / WASD to walk', 'R to restart the room'],
    colors: ['#231d3a', '#e8c24a'],
    tags: ['dungeon', 'puzzle', 'adventure', 'keys'],
    mount: mount
  });
})();
