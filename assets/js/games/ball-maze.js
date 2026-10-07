/* Ball Maze — tilt the wooden board and roll the bearing past the holes. */
(function () {
  'use strict';
  var W = 540, H = 700;
  var N = 13, CELL = 38, BX = (W - N * CELL) / 2, BY = 120, BR = 11;

  /* 13x13 boards: # wall, . floor, o hole, S start, G goal.
     Generated with a recursive-backtracker + braiding pass; every board was
     checked with a breadth-first search that avoids the holes, so each one has
     a route from S to G that never crosses a hole. */
  var BOARDS = [
// level 1  holes=2 pathLen=21
  ['#############',
   '#S..#.#.....#',
   '###.#.#.#.###',
   '#...#...#...#',
   '#.#.#.###.#.#',
   '#...#.......#',
   '###.#.#.###.#',
   '#.....#.#...#',
   '#.#.###.#.#.#',
   '#.....#o....#',
   '#####.#####.#',
   '#...o......G#',
   '#############'],
// level 2  holes=2 pathLen=25
  ['#############',
   '#.........#G#',
   '#.#.#.#.#.#.#',
   '#.#...#.#...#',
   '#.###.#.#.#.#',
   '#.......#...#',
   '#.#####.###.#',
   '#.o...#.#...#',
   '#.###o#.#.###',
   '#...#.#.#...#',
   '#.###.#.#.#.#',
   '#S....#.....#',
   '#############'],
// level 3  holes=3 pathLen=25
  ['#############',
   '#.....#...#S#',
   '#.#.###.#.#.#',
   '#.......#...#',
   '#.###.#######',
   '#.#.#......o#',
   '#.#.#.#.###.#',
   '#.....#.....#',
   '#.###.#.###.#',
   '#.....o.#.#.#',
   '#.#######.#.#',
   '#G........o.#',
   '#############'],
// level 4  holes=4 pathLen=29
  ['#############',
   '#G..o.#.....#',
   '#.###o#.###.#',
   '#.#.o.#...#o#',
   '#.#.###.###.#',
   '#.#.#.#.....#',
   '#.#.#.#.#.#.#',
   '#.....#.#...#',
   '#.###.#.#.#.#',
   '#.......#.#.#',
   '#.#.###.#.###',
   '#.......#..S#',
   '#############'],
// level 5  holes=5 pathLen=27
  ['#############',
   '#S#.#...#..G#',
   '#.#.#.#.#.#.#',
   '#.#...#.....#',
   '#.#######o#.#',
   '#...#...#...#',
   '###.#.#.#.#.#',
   '#oo...#...#.#',
   '#.###.###.#.#',
   '#...#.#...#o#',
   '###.#.#.#.#.#',
   '#....o......#',
   '#############'],
// level 6  holes=6 pathLen=35
  ['#############',
   '#S......#.o.#',
   '#######.###.#',
   '#.o...#.....#',
   '#.#.#.#####.#',
   '#...#.......#',
   '#.#.#.#.#####',
   '#.#...o...oo#',
   '#.#####.#.#.#',
   '#.....#.#...#',
   '#.###o#####.#',
   '#G..........#',
   '#############'],
// level 7  holes=7 pathLen=33
  ['#############',
   '#.........#G#',
   '#.###o###.#.#',
   '#o#.........#',
   '#o#.#.#######',
   '#.....o.#...#',
   '#.###.###.#.#',
   '#.#.o.....#.#',
   '#.#.#######.#',
   '#.#o#.......#',
   '#.#.#.#.#.#.#',
   '#..o#S#...#.#',
   '#############'],
// level 8  holes=8 pathLen=29
  ['#############',
   '#.#.o....o..#',
   '#o#o#.###.#o#',
   '#.........#.#',
   '###########.#',
   '#S#.....o.#.#',
   '#.#.#.###.#.#',
   '#...#.....#G#',
   '#####.#o###.#',
   '#.......#...#',
   '#.#.#######.#',
   '#o..........#',
   '#############'],
// level 9  holes=9 pathLen=35
  ['#############',
   '#...oo#.....#',
   '#o#.###.#.###',
   '#...#...#...#',
   '#o#o#.#####.#',
   '#...#.#.#...#',
   '#.###.#.#.###',
   '#.......#...#',
   '#.#.###.#.#.#',
   '#...o.#.#...#',
   '#.#####.#.###',
   '#G.o..oo#..S#',
   '#############'],
// level 10  holes=10 pathLen=33
  ['#############',
   '#..o#..S#o..#',
   '#o###.###.###',
   '#.....#.#o..#',
   '#.#####.#.#.#',
   '#........o#o#',
   '###.###.###.#',
   '#...#.......#',
   '#.#o#.###.#.#',
   '#.....#.#o..#',
   '#######o###.#',
   '#.o..G......#',
   '#############'],
// level 11  holes=11 pathLen=33
  ['#############',
   '#S......o.#.#',
   '#######.#.#o#',
   '#.........#o#',
   '#.#########.#',
   '#..o.....o..#',
   '#.#########.#',
   '#....o#.#...#',
   '#.#.#.#o#.###',
   '#.#..o..#oo.#',
   '#o#.#######.#',
   '#..........G#',
   '#############'],
// level 12  holes=12 pathLen=35
  ['#############',
   '#G.o#.o...#S#',
   '#.#.#.#.#.#.#',
   '#.....#.oo#.#',
   '#.#o#.#####.#',
   '#...#o#.....#',
   '#o#.###.#####',
   '#.#.#...#o..#',
   '###.#.###.#.#',
   '#...#...#o#o#',
   '#.#.###.###.#',
   '#.......o.o.#',
   '#############'],
// level 13  holes=13 pathLen=47
  ['#############',
   '#...........#',
   '#.#########.#',
   '#..o#.......#',
   '#.#.#.#.#.#o#',
   '#...#.o.#.o.#',
   '#o#.#.#######',
   '#o#.#.....#o#',
   '###.#####.#.#',
   '#...#o.o#.#o#',
   '#.###o#o#.#.#',
   '#S#...#o...G#',
   '#############'],
// level 14  holes=14 pathLen=37
  ['#############',
   '#oo.......#o#',
   '###.#####.#.#',
   '#...#ooo#.#o#',
   '#.#####.#.#.#',
   '#....S#.#...#',
   '#######.###.#',
   '#.o.oo......#',
   '#.###.#.#####',
   '#o#...#.....#',
   '#.#.#.#.###.#',
   '#o..o..o#..G#',
   '#############'],
// level 15  holes=14 pathLen=49
  ['#############',
   '#S#.o.......#',
   '#.#.#.#o#o#.#',
   '#.#o#.#o..o.#',
   '#.###.#####.#',
   '#...#...#o#.#',
   '###.#.#o#o#.#',
   '#o#.#...#.#.#',
   '#o#.###.#o#.#',
   '#...#...#.#.#',
   '#.###.###.#.#',
   '#.....#oo..G#',
   '#############']
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function starStr(n) {
      var out = '';
      for (var i = 0; i < 3; i++) out += i < n ? '\u2605' : '\u2606';
      return out;
    }

    function reset(g) {
      var d = g.data;
      d.level = 0;
      d.lives = 3;
      d.stars = 0;
      d.parts = [];
      d.shake = 0;
      d.banner = null;
      g.score = 0;
      g.set('Score', 0);
      g.set('Stars', 0);
      load(g);
    }

    function load(g) {
      var d = g.data, rows = BOARDS[d.level];
      d.rows = rows;
      d.holes = [];
      d.walls = [];
      var y, x, run;
      for (y = 0; y < N; y++) {
        run = null;
        for (x = 0; x < N; x++) {
          var ch = rows[y][x];
          if (ch === '#') {
            if (run) run.w += CELL;
            else { run = { x: BX + x * CELL, y: BY + y * CELL, w: CELL, h: CELL }; d.walls.push(run); }
          } else {
            run = null;
            if (ch === 'o') d.holes.push({ x: BX + (x + .5) * CELL, y: BY + (y + .5) * CELL });
            else if (ch === 'S') d.start = { x: BX + (x + .5) * CELL, y: BY + (y + .5) * CELL };
            else if (ch === 'G') d.goal = { x: BX + (x + .5) * CELL, y: BY + (y + .5) * CELL };
          }
        }
      }
      d.cells = [];
      for (y = 0; y < N; y++) {
        var line = [];
        for (x = 0; x < N; x++) line.push(rows[y][x] === '#');
        d.cells.push(line);
      }
      d.ball = { x: d.start.x, y: d.start.y, vx: 0, vy: 0, spin: 0 };
      d.tilt = { x: 0, y: 0 };
      d.time = 0;
      d.falling = null;
      d.trail = [];
      d.par3 = 5 + d.level * 1.1;
      d.par2 = d.par3 * 2.1;
      d.done = false;
      g.set('Level', d.level + 1);
      g.set('Lives', d.lives);
    }

    function fallIn(g, h) {
      var d = g.data;
      d.falling = { x: h.x, y: h.y, t: 0 };
      d.ball.vx = 0; d.ball.vy = 0;
      d.lives--;
      d.shake = 10;
      g.set('Lives', Math.max(0, d.lives));
      Milo.sound.tone({ f: 420, f2: 90, d: .4, v: .09, type: 'sine' });
      for (var i = 0; i < 10; i++) {
        d.parts.push({ x: h.x, y: h.y, vx: U.rand(-60, 60), vy: U.rand(-60, 60),
          life: .5, max: .5, col: '#1b1109' });
      }
    }

    function finish(g) {
      var d = g.data;
      d.done = true;
      var st = d.time <= d.par3 ? 3 : d.time <= d.par2 ? 2 : 1;
      d.stars += st;
      var bonus = 200 + st * 150 + Math.max(0, Math.round((d.par2 - d.time) * 12));
      g.score += bonus;
      g.set('Score', U.fmt(g.score));
      g.set('Stars', d.stars);
      d.banner = { text: starStr(st) + '   +' + bonus, t: 1.7 };
      d.nextIn = 1.5;
      Milo.sound.win();
      for (var i = 0; i < 28; i++) {
        var a = Math.random() * 6.283;
        d.parts.push({ x: d.goal.x, y: d.goal.y, vx: Math.cos(a) * U.rand(60, 260),
          vy: Math.sin(a) * U.rand(60, 260), life: .9, max: .9,
          col: U.choice(['#4ade80', '#a3e635', '#fde68a']) });
      }
    }

    function collide(d, b) {
      var cx0 = Math.max(0, Math.floor((b.x - BX - BR - 2) / CELL));
      var cx1 = Math.min(N - 1, Math.floor((b.x - BX + BR + 2) / CELL));
      var cy0 = Math.max(0, Math.floor((b.y - BY - BR - 2) / CELL));
      var cy1 = Math.min(N - 1, Math.floor((b.y - BY + BR + 2) / CELL));
      var bumped = 0;
      for (var cy = cy0; cy <= cy1; cy++) {
        for (var cx = cx0; cx <= cx1; cx++) {
          if (!d.cells[cy] || !d.cells[cy][cx]) continue;
          var rx = BX + cx * CELL, ry = BY + cy * CELL;
          var nx = U.clamp(b.x, rx, rx + CELL), ny = U.clamp(b.y, ry, ry + CELL);
          var dx = b.x - nx, dy = b.y - ny, dist = Math.hypot(dx, dy);
          if (dist >= BR) continue;
          if (dist < 0.0001) { dx = b.x - (rx + CELL / 2); dy = b.y - (ry + CELL / 2); dist = Math.hypot(dx, dy) || 1; }
          var ux = dx / dist, uy = dy / dist, pen = BR - dist;
          b.x += ux * pen; b.y += uy * pen;
          var vn = b.vx * ux + b.vy * uy;
          if (vn < 0) {
            b.vx -= ux * vn * 1.35;
            b.vy -= uy * vn * 1.35;
            if (-vn > 150) bumped = Math.max(bumped, -vn);
          }
        }
      }
      return bumped;
    }

    return Milo.arcade(host, {
      id: 'ball-maze',
      w: W, h: H, bg: '#20150c',
      stats: ['Score', 'Level', 'Lives', 'Stars'],
      touch: 'dpad',
      emo: '🌀',
      start: {
        title: 'Ball Maze',
        text: 'Tilt the board with the arrow keys — or drag anywhere on it — and roll the ball ' +
          'bearing to the green ring. The black holes take a life each and there are only three. ' +
          'Fifteen boards, each with more holes than the last, and three stars for anyone quick ' +
          'enough to beat par.',
        keys: ['← ↑ → ↓  or  WASD', 'Drag the board']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        var d = g.data;
        if (type === 'down') d.drag = { x: x, y: y };
        else if (type === 'move' && d.drag) {
          d.pt = {
            x: U.clamp((x - d.drag.x) / 70, -1, 1),
            y: U.clamp((y - d.drag.y) / 70, -1, 1)
          };
        } else if (type === 'up') { d.drag = null; d.pt = null; }
      },

      update: function (g, dt) {
        var d = g.data, i = g.input, b = d.ball;
        if (d.shake > 0) d.shake = Math.max(0, d.shake - dt * 30);
        if (d.banner) { d.banner.t -= dt; if (d.banner.t <= 0) d.banner = null; }
        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.pow(.1, dt); p.vy *= Math.pow(.1, dt);
          p.life -= dt;
          return p.life > 0;
        });

        var ax = (i.down('right') ? 1 : 0) - (i.down('left') ? 1 : 0);
        var ay = (i.down('down') ? 1 : 0) - (i.down('up') ? 1 : 0);
        if (d.pt) { ax = d.pt.x; ay = d.pt.y; }
        d.tilt.x = U.lerp(d.tilt.x, ax, Math.min(1, 9 * dt));
        d.tilt.y = U.lerp(d.tilt.y, ay, Math.min(1, 9 * dt));

        if (d.done) {
          d.nextIn -= dt;
          if (d.nextIn <= 0) {
            d.level++;
            if (d.level >= BOARDS.length) {
              g.win({ score: g.score, emo: '🌀', title: 'Labyrinth solved',
                text: 'All ' + BOARDS.length + ' boards cleared with ' + d.stars + ' of ' +
                  (BOARDS.length * 3) + ' stars.' });
            } else load(g);
          }
          return;
        }

        if (d.falling) {
          d.falling.t += dt;
          if (d.falling.t > .6) {
            d.falling = null;
            if (d.lives <= 0) {
              g.gameOver({ emo: '🌀', title: 'Down the hole',
                text: 'Board ' + (d.level + 1) + ' of ' + BOARDS.length + ', ' + d.stars + ' stars banked.' });
              return;
            }
            b.x = d.start.x; b.y = d.start.y; b.vx = 0; b.vy = 0;
            d.trail = [];
          }
          return;
        }

        d.time += dt;

        var steps = 4, sdt = dt / steps;
        for (var s = 0; s < steps; s++) {
          b.vx += d.tilt.x * 1150 * sdt;
          b.vy += d.tilt.y * 1150 * sdt;
          var damp = Math.pow(0.15, sdt);
          b.vx *= damp; b.vy *= damp;
          b.x += b.vx * sdt;
          b.y += b.vy * sdt;
          var bump = collide(d, b);
          if (bump) {
            Milo.sound.tone({ f: 180 + Math.min(300, bump), f2: 120, d: .04,
              v: Math.min(.07, bump / 6000), type: 'square' });
            if (bump > 420) d.shake = Math.min(7, bump / 90);
          }
          for (var h = 0; h < d.holes.length; h++) {
            if (U.dist(b.x, b.y, d.holes[h].x, d.holes[h].y) < 12) { fallIn(g, d.holes[h]); return; }
          }
          if (U.dist(b.x, b.y, d.goal.x, d.goal.y) < 14) { finish(g); return; }
        }

        b.spin += Math.hypot(b.vx, b.vy) * dt * 0.05;
        d.trail.push({ x: b.x, y: b.y });
        if (d.trail.length > 16) d.trail.shift();
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, b = d.ball;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#3a2515'); bg.addColorStop(1, '#170e07');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));
        c.translate(d.tilt.x * 5, d.tilt.y * 5);

        // board
        c.fillStyle = '#3f2a18';
        U.roundRect(c, BX - 16, BY - 16, N * CELL + 32, N * CELL + 32, 14); c.fill();
        var wood = c.createLinearGradient(BX, BY, BX + N * CELL, BY + N * CELL);
        wood.addColorStop(0, '#d8ae74'); wood.addColorStop(.5, '#c79a60'); wood.addColorStop(1, '#b8894f');
        c.fillStyle = wood;
        U.roundRect(c, BX - 6, BY - 6, N * CELL + 12, N * CELL + 12, 8); c.fill();
        c.strokeStyle = 'rgba(90,60,30,.28)'; c.lineWidth = 1;
        for (var wl = 0; wl < 26; wl++) {
          var wy = BY - 6 + wl * 19.5;
          c.beginPath();
          c.moveTo(BX - 6, wy);
          c.bezierCurveTo(BX + 160, wy + 5, BX + 330, wy - 5, BX + N * CELL + 6, wy);
          c.stroke();
        }

        // walls
        d.walls.forEach(function (w) {
          c.fillStyle = '#6b4526';
          U.roundRect(c, w.x, w.y, w.w, w.h, 3); c.fill();
          c.fillStyle = 'rgba(255,225,180,.22)';
          U.roundRect(c, w.x + 1, w.y + 1, w.w - 2, 5, 2); c.fill();
          c.fillStyle = 'rgba(0,0,0,.22)';
          c.fillRect(w.x + 1, w.y + w.h - 4, w.w - 2, 3);
        });

        // holes
        d.holes.forEach(function (h) {
          var hg = c.createRadialGradient(h.x - 3, h.y - 3, 1, h.x, h.y, 14);
          hg.addColorStop(0, '#000'); hg.addColorStop(.75, '#0d0805'); hg.addColorStop(1, '#5a3c22');
          c.fillStyle = hg;
          c.beginPath(); c.arc(h.x, h.y, 14, 0, 7); c.fill();
        });

        // goal
        c.strokeStyle = '#4ade80'; c.lineWidth = 3;
        c.beginPath(); c.arc(d.goal.x, d.goal.y, 15, 0, 7); c.stroke();
        c.fillStyle = 'rgba(74,222,128,' + (0.18 + Math.sin(g.t * 4) * 0.1) + ')';
        c.beginPath(); c.arc(d.goal.x, d.goal.y, 14, 0, 7); c.fill();
        c.fillStyle = '#4ade80';
        c.font = '700 14px Outfit, system-ui, sans-serif';
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('◎', d.goal.x, d.goal.y + 1);
        c.textBaseline = 'alphabetic';

        // start pad
        c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 2;
        c.setLineDash([4, 4]);
        c.beginPath(); c.arc(d.start.x, d.start.y, 13, 0, 7); c.stroke();
        c.setLineDash([]);

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - 2, p.y - 2, 4, 4);
        });
        c.globalAlpha = 1;

        // ball (or the ball disappearing into a hole)
        var bx = b.x, by = b.y, br = BR;
        if (d.falling) {
          var k = Math.min(1, d.falling.t / .6);
          bx = U.lerp(b.x, d.falling.x, Math.min(1, k * 2.2));
          by = U.lerp(b.y, d.falling.y, Math.min(1, k * 2.2));
          br = BR * (1 - k);
        } else {
          c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 3;
          c.beginPath();
          d.trail.forEach(function (t, i) { i ? c.lineTo(t.x, t.y) : c.moveTo(t.x, t.y); });
          c.stroke();
        }
        if (br > 0.5) {
          c.fillStyle = 'rgba(0,0,0,.35)';
          c.beginPath(); c.ellipse(bx + d.tilt.x * 4 + 2, by + d.tilt.y * 4 + 3, br, br * .85, 0, 0, 7); c.fill();
          var bgd = c.createRadialGradient(bx - br * .4, by - br * .45, br * .1, bx, by, br);
          bgd.addColorStop(0, '#ffffff'); bgd.addColorStop(.35, '#cbd5e1');
          bgd.addColorStop(.8, '#7d8798'); bgd.addColorStop(1, '#4b5563');
          c.fillStyle = bgd;
          c.beginPath(); c.arc(bx, by, br, 0, 7); c.fill();
          c.fillStyle = 'rgba(255,255,255,.7)';
          c.beginPath(); c.arc(bx - br * .35, by - br * .4, br * .22, 0, 7); c.fill();
        }
        c.restore();

        // tilt readout
        c.textAlign = 'center';
        var tx = W - 54, ty = BY - 58;
        c.fillStyle = 'rgba(255,255,255,.08)';
        c.beginPath(); c.arc(tx, ty, 22, 0, 7); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 2;
        c.beginPath(); c.arc(tx, ty, 22, 0, 7); c.stroke();
        c.fillStyle = '#f59e0b';
        c.beginPath(); c.arc(tx + d.tilt.x * 15, ty + d.tilt.y * 15, 6, 0, 7); c.fill();

        c.fillStyle = 'rgba(255,255,255,.6)';
        c.font = '700 14px Outfit, system-ui, sans-serif';
        c.textAlign = 'left';
        var st = d.time <= d.par3 ? 3 : d.time <= d.par2 ? 2 : 1;
        c.fillText('Board ' + (d.level + 1) + '/' + BOARDS.length + '   ' + d.time.toFixed(1) + 's   ' +
          starStr(st), 26, BY - 44);
        c.fillStyle = 'rgba(255,255,255,.35)';
        c.font = '600 12px Outfit, system-ui, sans-serif';
        c.fillText('par ' + d.par3.toFixed(1) + 's for three stars', 26, BY - 26);

        if (d.banner) {
          c.globalAlpha = Math.min(1, d.banner.t);
          c.fillStyle = '#fde68a';
          c.font = '800 30px Outfit, system-ui, sans-serif';
          c.textAlign = 'center';
          c.fillText(d.banner.text, W / 2, H - 42);
          c.globalAlpha = 1;
        }
      }
    });
  }

  window.Milo.register({
    id: 'ball-maze', title: 'Ball Maze', emo: '🌀', category: 'Casual',
    tagline: 'Tilt the wooden board, mind the holes',
    description: 'The old wooden labyrinth toy: tilt the board and the steel bearing rolls, ' +
      'keeps rolling, and does not care that there is a hole coming. Fifteen hand-verified ' +
      'boards run from two holes to fourteen, and every one has a route to the green ring that ' +
      'never crosses a hole. You get three lives for the whole set and three stars on any board ' +
      'you finish under par, so the fast line is worth learning.',
    controls: ['← ↑ → ↓', 'WASD', 'Drag'],
    colors: ['#20150c', '#c79a60'],
    tags: ['tilt', 'labyrinth', 'levels', 'physics', 'stars'],
    mount: mount
  });
})();
