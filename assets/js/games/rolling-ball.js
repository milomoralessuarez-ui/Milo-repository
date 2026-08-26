/* Rolling Ball — tilt a marble down a maze of gaps and switches to the goal. */
(function () {
  'use strict';
  var W = 760, H = 640, CELL = 40, COLS = 19, ROWS = 16;
  var OX = (W - COLS * CELL) / 2, OY = 66;
  var R = 13, ACC = 900, FRICTION = 2.3, MAXV = 340;

  // Tile glyphs keep each level readable as a block of text.
  var WALL = '#', HOLE = 'o', GOAL = 'G', START = 'S', GEM = '*', ICE = '~', SAND = ':', SPACE = '.';

  var LEVELS = [
    [
      '###################',
      '#S....#.......#...#',
      '#.###.#.#####.#.#.#',
      '#.#*..#.....#...#.#',
      '#.#.#####.#.#####.#',
      '#...#...o.#.....#.#',
      '###.#.#.###.###.#.#',
      '#...#.#...#...#...#',
      '#.###.###.#.#.#####',
      '#.#o..#...#.#....*#',
      '#.#.#.#.###.#####.#',
      '#...#.#.#.......#.#',
      '#.###.#.#.#####.#.#',
      '#*..#...#.....#..G#',
      '#.#.#####.###.#####',
      '###################'
    ],
    [
      '###################',
      '#S..~~~~.....*....#',
      '#.#######.#.#####.#',
      '#.#.....#.#.....#.#',
      '#.#.###.#.#####.#.#',
      '#...#o#.#...#...#.#',
      '#####.#.###.#.###.#',
      '#.....#...#.#.#...#',
      '#.#######.#.#.#.###',
      '#.#*..::#.#.#.#...#',
      '#.#.###.#.#.#.###.#',
      '#.#.#o..#...#...#.#',
      '#.#.#.#########.#.#',
      '#...#.........*.#G#',
      '#.###############.#',
      '###################'
    ],
    [
      '###################',
      '#S.#....o....#...*#',
      '#..#.####.##.#.##.#',
      '#.##.#..~~~#.#..#.#',
      '#....#.###.#.####.#',
      '####.#.#o#.#.#....#',
      '#..*.#.#.#.#.#.####',
      '#.####.#.#.#.#....#',
      '#....#.#.#.#.####.#',
      '####.#.#.#.#....#.#',
      '#o...#...#.####.#.#',
      '#.########.#..#.#.#',
      '#........::#.##.#.#',
      '######.#####..#.#.#',
      '#G...*.......##..o#',
      '###################'
    ]
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function tileAt(d, cx, cy) {
      if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) return WALL;
      return d.grid[cy][cx];
    }

    function loadLevel(g, n) {
      var d = g.data;
      var src = LEVELS[n % LEVELS.length];
      d.grid = src.map(function (row) { return row.split(''); });
      d.gems = [];
      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          var t = d.grid[r][c];
          if (t === START) { d.sx = OX + (c + .5) * CELL; d.sy = OY + (r + .5) * CELL; d.grid[r][c] = SPACE; }
          else if (t === GEM) { d.gems.push({ c: c, r: r, got: false }); d.grid[r][c] = SPACE; }
        }
      }
      d.x = d.sx; d.y = d.sy;
      d.vx = 0; d.vy = 0;
      d.falling = 0;
      d.done = false;
      d.parts = [];
      g.set('Level', n + 1);
      g.set('Gems', '0/' + d.gems.length);
    }

    function reset(g) {
      var d = g.data;
      d.level = d.level || 0;
      d.lives = d.lives == null ? 3 : d.lives;
      d.time = 0;
      loadLevel(g, d.level);
      g.set('Lives', d.lives);
      g.set('Best', g.best ? U.fmt(g.best) : '—');
    }

    function respawn(g) {
      var d = g.data;
      d.lives--;
      g.set('Lives', Math.max(0, d.lives));
      if (d.lives <= 0) {
        g.gameOver({ emo: '🔵', title: 'Down the hole', text: 'You reached level ' + (d.level + 1) + '.', score: g.score });
        return;
      }
      d.x = d.sx; d.y = d.sy;
      d.vx = 0; d.vy = 0;
      d.falling = 0;
    }

    /** Resolves the ball against one wall tile, pushing it out along the shallower axis. */
    function collide(d, cx, cy) {
      var wx = OX + cx * CELL, wy = OY + cy * CELL;
      var nx = U.clamp(d.x, wx, wx + CELL), ny = U.clamp(d.y, wy, wy + CELL);
      var dx = d.x - nx, dy = d.y - ny;
      var dd = dx * dx + dy * dy;
      if (dd >= R * R) return false;
      var dist = Math.sqrt(dd) || .0001;
      var push = R - dist;
      d.x += dx / dist * push;
      d.y += dy / dist * push;
      // Bounce with damping so a wall stops the roll rather than pinballing it.
      var dot = d.vx * (dx / dist) + d.vy * (dy / dist);
      if (dot < 0) {
        d.vx -= dot * (dx / dist) * 1.4;
        d.vy -= dot * (dy / dist) * 1.4;
      }
      return true;
    }

    return Milo.arcade(host, {
      id: 'rolling-ball',
      w: W, h: H, bg: '#101a24',
      stats: ['Score', 'Level', 'Gems', 'Lives', 'Best'],
      emo: '🔵',
      trackBest: true,
      touch: 'dpad',
      start: {
        title: 'Rolling Ball',
        text: 'Tilt the board with the arrow keys and roll the marble to the green exit. ' +
          'The marble keeps its momentum, ice will not slow you down, and every dark hole is a lost life.',
        keys: ['Arrows / WASD to tilt', 'Collect the gems on the way for bonus points']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, input = g.input;
        d.time += dt;
        var i;

        for (i = d.parts.length - 1; i >= 0; i--) {
          var pt = d.parts[i];
          pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.life -= dt;
          if (pt.life <= 0) d.parts.splice(i, 1);
        }

        if (d.falling > 0) {
          d.falling += dt;
          if (d.falling > .55) { respawn(g); }
          return;
        }
        if (d.done) {
          d.done += dt;
          if (d.done > 1) {
            d.level++;
            g.score += 300 + Math.max(0, 600 - Math.round(d.time) * 12);
            g.set('Score', g.score);
            d.time = 0;
            loadLevel(g, d.level);
          }
          return;
        }

        var cx = Math.floor((d.x - OX) / CELL), cy = Math.floor((d.y - OY) / CELL);
        var under = tileAt(d, cx, cy);

        // The surface underfoot changes how much the tilt bites.
        var grip = under === ICE ? .18 : under === SAND ? 3.2 : 1;
        var accel = under === ICE ? ACC * .55 : under === SAND ? ACC * .7 : ACC;

        var ax = 0, ay = 0;
        if (input.down('left')) ax -= 1;
        if (input.down('right')) ax += 1;
        if (input.down('up')) ay -= 1;
        if (input.down('down')) ay += 1;
        var m = Math.hypot(ax, ay);
        if (m) { ax /= m; ay /= m; }

        d.vx += ax * accel * dt;
        d.vy += ay * accel * dt;
        var fr = Math.exp(-FRICTION * grip * dt);
        d.vx *= fr;
        d.vy *= fr;
        var sp = Math.hypot(d.vx, d.vy);
        if (sp > MAXV) { d.vx = d.vx / sp * MAXV; d.vy = d.vy / sp * MAXV; }

        // Substeps stop a fast marble squeezing between two wall tiles.
        var steps = 4, sdt = dt / steps;
        for (var s = 0; s < steps; s++) {
          d.x += d.vx * sdt;
          d.y += d.vy * sdt;
          var bc = Math.floor((d.x - OX) / CELL), br = Math.floor((d.y - OY) / CELL);
          for (var r = br - 1; r <= br + 1; r++) {
            for (var c = bc - 1; c <= bc + 1; c++) {
              if (tileAt(d, c, r) === WALL) collide(d, c, r);
            }
          }
        }

        cx = Math.floor((d.x - OX) / CELL);
        cy = Math.floor((d.y - OY) / CELL);
        var here = tileAt(d, cx, cy);

        if (here === HOLE) {
          // Only a real overlap with the hole's mouth counts, so a graze survives.
          var hx = OX + (cx + .5) * CELL, hy = OY + (cy + .5) * CELL;
          if (U.dist(d.x, d.y, hx, hy) < CELL * .3) {
            d.falling = .01;
            d.x = hx; d.y = hy;
            Milo.sound.lose();
            return;
          }
        }

        d.gems.forEach(function (gem) {
          if (gem.got) return;
          var gx = OX + (gem.c + .5) * CELL, gy = OY + (gem.r + .5) * CELL;
          if (U.dist(d.x, d.y, gx, gy) < R + 9) {
            gem.got = true;
            g.score += 150;
            g.set('Score', g.score);
            var got = d.gems.filter(function (q) { return q.got; }).length;
            g.set('Gems', got + '/' + d.gems.length);
            Milo.sound.coin();
            for (var k = 0; k < 10; k++) {
              var a = U.rand(0, Math.PI * 2);
              d.parts.push({ x: gx, y: gy, vx: Math.cos(a) * 90, vy: Math.sin(a) * 90, life: .4, c: '#7fe3ff' });
            }
          }
        });

        if (here === GOAL) {
          var allGems = d.gems.every(function (q) { return q.got; });
          d.done = .01;
          g.score += allGems ? 500 : 200;
          g.set('Score', g.score);
          Milo.sound.win();
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#16233a'); bg.addColorStop(1, '#0b1220');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        for (var r = 0; r < ROWS; r++) {
          for (var cc = 0; cc < COLS; cc++) {
            var t = d.grid[r][cc], x = OX + cc * CELL, y = OY + r * CELL;
            if (t === WALL) {
              c.fillStyle = '#33455f';
              U.roundRect(c, x + 1, y + 1, CELL - 2, CELL - 2, 5); c.fill();
              c.fillStyle = 'rgba(255,255,255,.08)';
              c.fillRect(x + 3, y + 3, CELL - 6, 4);
            } else if (t === HOLE) {
              c.fillStyle = '#0a0f18';
              c.beginPath(); c.arc(x + CELL / 2, y + CELL / 2, CELL * .34, 0, Math.PI * 2); c.fill();
              c.strokeStyle = 'rgba(0,0,0,.6)';
              c.lineWidth = 3;
              c.beginPath(); c.arc(x + CELL / 2, y + CELL / 2, CELL * .34, 0, Math.PI * 2); c.stroke();
            } else if (t === GOAL) {
              var pulse = .6 + Math.sin(g.t * 4) * .2;
              c.fillStyle = 'rgba(90,220,130,' + pulse + ')';
              U.roundRect(c, x + 4, y + 4, CELL - 8, CELL - 8, 7); c.fill();
              c.fillStyle = '#0b1220';
              c.font = '600 15px Outfit, sans-serif';
              c.textAlign = 'center';
              c.textBaseline = 'middle';
              c.fillText('OUT', x + CELL / 2, y + CELL / 2 + 1);
              c.textBaseline = 'alphabetic';
            } else if (t === ICE) {
              c.fillStyle = 'rgba(120,200,255,.22)';
              c.fillRect(x, y, CELL, CELL);
              c.strokeStyle = 'rgba(190,235,255,.3)';
              c.lineWidth = 1;
              c.beginPath(); c.moveTo(x + 6, y + CELL - 6); c.lineTo(x + CELL - 6, y + 6); c.stroke();
            } else if (t === SAND) {
              c.fillStyle = 'rgba(200,165,105,.28)';
              c.fillRect(x, y, CELL, CELL);
              for (var k = 0; k < 4; k++) {
                var hs = U.hash2(cc * 7 + k, r * 13);
                c.fillStyle = 'rgba(230,205,150,.35)';
                c.fillRect(x + (hs % 30) + 4, y + ((hs >> 6) % 30) + 4, 3, 3);
              }
            }
          }
        }

        d.gems.forEach(function (gem) {
          if (gem.got) return;
          var gx = OX + (gem.c + .5) * CELL, gy = OY + (gem.r + .5) * CELL;
          var bob = Math.sin(g.t * 3 + gem.c) * 2;
          c.fillStyle = '#7fe3ff';
          c.beginPath();
          c.moveTo(gx, gy - 9 + bob); c.lineTo(gx + 7, gy + bob); c.lineTo(gx, gy + 9 + bob); c.lineTo(gx - 7, gy + bob);
          c.closePath(); c.fill();
          c.fillStyle = 'rgba(255,255,255,.55)';
          c.beginPath();
          c.moveTo(gx, gy - 9 + bob); c.lineTo(gx + 7, gy + bob); c.lineTo(gx, gy + bob);
          c.closePath(); c.fill();
        });

        d.parts.forEach(function (pt) {
          c.globalAlpha = Math.max(0, pt.life * 2);
          c.fillStyle = pt.c;
          c.fillRect(pt.x - 2, pt.y - 2, 4, 4);
        });
        c.globalAlpha = 1;

        var scale = d.falling > 0 ? Math.max(0, 1 - d.falling / .55) : 1;
        if (scale > 0.02) {
          c.fillStyle = 'rgba(0,0,0,.35)';
          c.beginPath(); c.ellipse(d.x + 3, d.y + 4, R * scale, R * .8 * scale, 0, 0, Math.PI * 2); c.fill();
          var grad = c.createRadialGradient(d.x - 4, d.y - 5, 2, d.x, d.y, R * scale);
          grad.addColorStop(0, '#bfe6ff'); grad.addColorStop(1, '#3d84d6');
          c.fillStyle = grad;
          c.beginPath(); c.arc(d.x, d.y, R * scale, 0, Math.PI * 2); c.fill();
        }

        c.fillStyle = 'rgba(255,255,255,.5)';
        c.font = '600 13px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText('Blue ice slides, sand drags, holes cost a life — grab every gem for the full clear bonus',
          W / 2, H - 16);

        if (d.done) {
          c.fillStyle = 'rgba(0,0,0,.5)';
          c.fillRect(0, H / 2 - 36, W, 72);
          c.fillStyle = '#8ef0a8';
          c.font = '700 28px Outfit, sans-serif';
          c.fillText('Level ' + (d.level + 1) + ' complete', W / 2, H / 2 + 9);
        }
      }
    });
  }

  window.Milo.register({
    id: 'rolling-ball', title: 'Rolling Ball', emo: '🔵', category: 'Casual',
    tagline: 'Tilt the maze, mind the holes',
    description: 'A marble on a tilting board. The arrow keys lean the whole maze, and the ball ' +
      'keeps rolling long after you stop pushing — so the hard part is not getting somewhere, ' +
      'it is stopping once you arrive. Blue ice barely slows you at all, sand grabs at the ball, ' +
      'and every dark hole in the floor costs one of your three marbles. Sweep up the gems on ' +
      'each board for a full-clear bonus.',
    controls: ['Arrows / WASD to tilt the board', 'Reach the green exit'],
    colors: ['#16233a', '#3d84d6'],
    tags: ['maze', 'physics', 'relaxing', 'skill'],
    mount: mount
  });
})();
