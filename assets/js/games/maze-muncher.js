/* Maze Muncher — eat the dots, dodge the ghosts, grab a power pellet. */
(function () {
  'use strict';
  var MAP = [
    '###################',
    '#........#........#',
    '#o##.###.#.###.##o#',
    '#.................#',
    '#.##.#.#####.#.##.#',
    '#....#...#...#....#',
    '####.###.#.###.####',
    '   #.#.......#.#   ',
    '####.#.##=##.#.####',
    '.......#GGG#.......',
    '####.#.#####.#.####',
    '   #.#.......#.#   ',
    '####.#.#####.#.####',
    '#........#........#',
    '#.##.###.#.###.##.#',
    '#o.#.....P.....#.o#',
    '##.#.#.#####.#.#.##',
    '#....#...#...#....#',
    '#.######.#.######.#',
    '#.................#',
    '###################'
  ];
  var COLS = MAP[0].length, ROWS = MAP.length, CELL = 26;
  var W = COLS * CELL, H = ROWS * CELL + 30;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.walls = [];
      d.dots = [];
      d.pellets = [];
      d.ghostHome = [];
      for (var y = 0; y < ROWS; y++) {
        var wrow = [], drow = [];
        for (var x = 0; x < COLS; x++) {
          var ch = MAP[y][x];
          wrow.push(ch === '#' || ch === '=');
          drow.push(ch === '.');
          if (ch === 'o') d.pellets.push({ x: x, y: y, eaten: false });
          if (ch === 'P') d.start = { x: x, y: y };
          if (ch === 'G') d.ghostHome.push({ x: x, y: y });
        }
        d.walls.push(wrow);
        d.dots.push(drow);
      }
      d.p = { x: d.start.x, y: d.start.y, dir: { x: 0, y: 0 }, want: { x: 0, y: 0 }, t: 0 };
      d.ghosts = d.ghostHome.map(function (h, i) {
        return {
          x: h.x, y: h.y, hx: h.x, hy: h.y, dir: { x: 0, y: -1 }, t: 0,
          col: ['#fb7185', '#38bdf8', '#fb923c'][i % 3], scared: 0, out: i * 2.5
        };
      });
      d.lives = 3;
      d.left = countDots(d);
      d.fright = 0;
      d.dying = 0;
      g.set('Score', 0);
      g.set('Lives', 3);
      g.set('Dots', d.left);
    }

    function countDots(d) {
      var n = 0;
      d.dots.forEach(function (r) { r.forEach(function (v) { if (v) n++; }); });
      return n + d.pellets.filter(function (p) { return !p.eaten; }).length;
    }

    function wall(d, x, y) {
      if (y < 0 || y >= ROWS) return true;
      x = ((x % COLS) + COLS) % COLS;                 // tunnel wraps sideways
      return d.walls[y][x];
    }
    function wrapX(x) { return ((x % COLS) + COLS) % COLS; }

    function stepEntity(d, e, speed, dt) {
      e.t += dt * speed;
      while (e.t >= 1) {
        e.t -= 1;
        var nx = wrapX(Math.round(e.x) + e.dir.x), ny = Math.round(e.y) + e.dir.y;
        if (wall(d, nx, ny)) { e.dir = { x: 0, y: 0 }; }
        else { e.x = nx; e.y = ny; }
        return true;
      }
      return false;
    }

    function die(g) {
      var d = g.data;
      d.lives--;
      g.set('Lives', Math.max(0, d.lives));
      Milo.sound.lose();
      if (d.lives <= 0) {
        g.gameOver({ text: d.left + ' dots left on the board.' });
        return;
      }
      d.p.x = d.start.x; d.p.y = d.start.y;
      d.p.dir = { x: 0, y: 0 }; d.p.want = { x: 0, y: 0 };
      d.ghosts.forEach(function (gh, i) {
        gh.x = gh.hx; gh.y = gh.hy; gh.scared = 0; gh.out = 1 + i * 1.2;
      });
      d.fright = 0;
    }

    return Milo.arcade(host, {
      id: 'maze-muncher',
      w: W, h: H, bg: '#04040f',
      stats: ['Score', 'Lives', 'Dots'],
      touch: 'dpad',
      emo: '👻',
      start: {
        title: 'Maze Muncher',
        text: 'Clear every dot without being caught. The four big pellets turn the ghosts ' +
          'blue for a few seconds — eat them then for bonus points.',
        keys: ['Arrow keys / WASD']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, i = g.input;
        if (i.down('up')) d.p.want = { x: 0, y: -1 };
        if (i.down('down')) d.p.want = { x: 0, y: 1 };
        if (i.down('left')) d.p.want = { x: -1, y: 0 };
        if (i.down('right')) d.p.want = { x: 1, y: 0 };

        // Turn as soon as the wanted direction is clear.
        if (d.p.want.x || d.p.want.y) {
          if (!wall(d, wrapX(Math.round(d.p.x) + d.p.want.x), Math.round(d.p.y) + d.p.want.y)) {
            d.p.dir = d.p.want;
          }
        }
        stepEntity(d, d.p, 7.2, dt);

        var px = Math.round(d.p.x), py = Math.round(d.p.y);
        if (d.dots[py] && d.dots[py][px]) {
          d.dots[py][px] = false;
          d.left--;
          g.score += 10;
          g.set('Score', U.fmt(g.score));
          g.set('Dots', d.left);
          Milo.sound.tone({ f: 620, d: .03, v: .03, type: 'square' });
        }
        d.pellets.forEach(function (p) {
          if (p.eaten || p.x !== px || p.y !== py) return;
          p.eaten = true;
          d.left--;
          d.fright = 7;
          g.score += 50;
          g.set('Score', U.fmt(g.score));
          g.set('Dots', d.left);
          d.ghosts.forEach(function (gh) { gh.scared = 7; });
          Milo.sound.powerup();
        });

        if (d.fright > 0) d.fright -= dt;

        d.ghosts.forEach(function (gh) {
          if (gh.out > 0) { gh.out -= dt; return; }
          gh.scared = Math.max(0, gh.scared - dt);
          if (stepEntity(d, gh, gh.scared > 0 ? 4.2 : 6.0, dt) || (!gh.dir.x && !gh.dir.y)) {
            // Choose a direction at each junction: chase, or flee when scared.
            var opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(function (o) {
              if (o[0] === -gh.dir.x && o[1] === -gh.dir.y) return false;
              return !wall(d, wrapX(Math.round(gh.x) + o[0]), Math.round(gh.y) + o[1]);
            });
            if (!opts.length) {
              opts = [[-gh.dir.x, -gh.dir.y]];
            }
            var best = opts[0], bestScore = -1e9;
            opts.forEach(function (o) {
              var nx = Math.round(gh.x) + o[0], ny = Math.round(gh.y) + o[1];
              var dist = Math.abs(nx - d.p.x) + Math.abs(ny - d.p.y);
              var s = gh.scared > 0 ? dist : -dist;
              s += U.hash2(nx, ny, Math.floor(g.t)) * 2;
              if (s > bestScore) { bestScore = s; best = o; }
            });
            gh.dir = { x: best[0], y: best[1] };
          }

          if (Math.abs(gh.x - d.p.x) < 0.6 && Math.abs(gh.y - d.p.y) < 0.6) {
            if (gh.scared > 0) {
              gh.x = gh.hx; gh.y = gh.hy; gh.scared = 0; gh.out = 3;
              g.score += 200;
              g.set('Score', U.fmt(g.score));
              Milo.sound.coin();
            } else if (d.dying <= 0) {
              d.dying = 0.01;
              die(g);
            }
          }
        });
        d.dying = 0;

        if (d.left <= 0) {
          g.win({ score: g.score, emo: '👻', title: 'Maze cleared!', text: 'Every dot eaten.' });
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.fillStyle = '#04040f'; c.fillRect(0, 0, W, H);

        for (var y = 0; y < ROWS; y++) {
          for (var x = 0; x < COLS; x++) {
            if (d.walls[y][x]) {
              c.fillStyle = MAP[y][x] === '=' ? '#7c5cff' : '#1d2c8a';
              U.roundRect(c, x * CELL + 2, y * CELL + 2, CELL - 4, CELL - 4, 5);
              c.fill();
            } else if (d.dots[y][x]) {
              c.fillStyle = '#ffd9a0';
              c.beginPath(); c.arc(x * CELL + CELL / 2, y * CELL + CELL / 2, 2.6, 0, 7); c.fill();
            }
          }
        }
        d.pellets.forEach(function (p) {
          if (p.eaten) return;
          var pulse = 5 + Math.sin(g.t * 6) * 1.6;
          c.fillStyle = '#ffd257';
          c.beginPath(); c.arc(p.x * CELL + CELL / 2, p.y * CELL + CELL / 2, pulse, 0, 7); c.fill();
        });

        // muncher
        var mx = d.p.x * CELL + CELL / 2, my = d.p.y * CELL + CELL / 2;
        var mouth = Math.abs(Math.sin(g.t * 9)) * 0.34;
        var ang = Math.atan2(d.p.dir.y, d.p.dir.x);
        c.fillStyle = '#ffd257';
        c.beginPath();
        c.moveTo(mx, my);
        c.arc(mx, my, CELL * .42, ang + mouth, ang - mouth + Math.PI * 2);
        c.closePath(); c.fill();

        d.ghosts.forEach(function (gh) {
          if (gh.out > 0) return;
          var gx = gh.x * CELL + CELL / 2, gy = gh.y * CELL + CELL / 2;
          var scared = gh.scared > 0;
          c.fillStyle = scared ? (gh.scared < 2 && Math.floor(g.t * 8) % 2 ? '#fff' : '#3b5bdb') : gh.col;
          c.beginPath();
          c.arc(gx, gy - 2, CELL * .38, Math.PI, 0);
          c.lineTo(gx + CELL * .38, gy + CELL * .34);
          for (var w = 0; w < 3; w++) {
            c.lineTo(gx + CELL * .38 - (w * 2 + 1) * CELL * .127, gy + CELL * .22);
            c.lineTo(gx + CELL * .38 - (w * 2 + 2) * CELL * .127, gy + CELL * .34);
          }
          c.closePath(); c.fill();
          c.fillStyle = '#fff';
          c.beginPath();
          c.arc(gx - 5, gy - 4, 4, 0, 7); c.arc(gx + 5, gy - 4, 4, 0, 7); c.fill();
          c.fillStyle = '#12162e';
          c.beginPath();
          c.arc(gx - 5 + gh.dir.x * 1.6, gy - 4 + gh.dir.y * 1.6, 2, 0, 7);
          c.arc(gx + 5 + gh.dir.x * 1.6, gy - 4 + gh.dir.y * 1.6, 2, 0, 7);
          c.fill();
        });

        if (d.fright > 0) {
          c.fillStyle = '#ffd257';
          c.font = '700 13px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText('POWER ' + d.fright.toFixed(1) + 's', W / 2, H - 8);
        }
      }
    });
  }

  window.Milo.register({
    id: 'maze-muncher', title: 'Maze Muncher', emo: '👻', category: 'Arcade',
    tagline: 'Eat the dots, dodge the ghosts',
    description: 'Clear every dot in the maze while three ghosts hunt you down. The four ' +
      'big pellets in the corners turn them blue for seven seconds — catch one then and it ' +
      'is worth 200 points and a trip back to its box. The side tunnels wrap around, which ' +
      'is usually your best escape.',
    controls: ['Arrow keys', 'WASD', 'Touch pad'],
    colors: ['#1d2c8a', '#ffd257'],
    featured: true,
    tags: ['classic', 'maze', 'arcade', 'chase'],
    mount: mount
  });
})();
