/* Basket Fall — rotate the whole maze so the ball rolls into the basket. */
(function () {
  'use strict';
  var W = 720, H = 720, CELL = 36, BR = 11, G = 980;
  // # wall  . floor  S start  B basket  x spikes
  var LEVELS = [
    { par: 6, m: [
      '#############',
      '#S..........#',
      '#####.#######',
      '#...........#',
      '#.#########.#',
      '#...........#',
      '###########.#',
      '#..........B#',
      '#############'] },
    { par: 8, m: [
      '#############',
      '#S....#.....#',
      '#.###.#.###.#',
      '#.#...#...#.#',
      '#.#.#####.#.#',
      '#.#.......#.#',
      '#.#########.#',
      '#...........#',
      '#####.#######',
      '#B....#.....#',
      '#############'] },
    { par: 9, m: [
      '#############',
      '#.....#....S#',
      '#.###.#.###.#',
      '#.#...#.#...#',
      '#.#.###.#.###',
      '#.#.....#...#',
      '#.#####.###.#',
      '#...#...#...#',
      '###.#.###.#.#',
      '#B..#.....#.#',
      '#############'] },
    { par: 10, m: [
      '#############',
      '#S..........#',
      '#.#########.#',
      '#.#.......#.#',
      '#.#.#####.#.#',
      '#.#.#B..#.#.#',
      '#.#.#.#.#.#.#',
      '#.#...#...#.#',
      '#.###.#####.#',
      '#x..........#',
      '#############'] },
    { par: 12, m: [
      '#############',
      '#S.....x....#',
      '#####.#####.#',
      '#...........#',
      '#.#####.#####',
      '#.....#.....#',
      '#####.#.###.#',
      '#..x..#...#.#',
      '#.#######.#.#',
      '#B........#.#',
      '#############'] },
    { par: 12, m: [
      '#############',
      '#.....#....S#',
      '#.#.#.#.###.#',
      '#.#.#.#.#...#',
      '#.#.#.#.#.#.#',
      '#.#.#...#.#.#',
      '#.#.#####.#.#',
      '#.#x......#.#',
      '#.#########.#',
      '#B...x......#',
      '#############'] },
    { par: 14, m: [
      '#############',
      '#S..#.......#',
      '#.#.#.#####.#',
      '#.#...#...#.#',
      '#.#####.#.#.#',
      '#.......#.#.#',
      '#.#######.#.#',
      '#.#x......#.#',
      '#.#.#######.#',
      '#...#......B#',
      '#############'] },
    { par: 14, m: [
      '#############',
      '#.....x.....#',
      '#.###.###.#.#',
      '#.#S#.....#.#',
      '#.#.#####.#.#',
      '#.#.......#.#',
      '#.#######.#.#',
      '#.#.....#.#.#',
      '#.#.###.#.#.#',
      '#...#B..#...#',
      '#############'] },
    { par: 16, m: [
      '###############',
      '#S............#',
      '#.#########.#.#',
      '#.#x........#.#',
      '#.#.#######.#.#',
      '#.#.#.....#.#.#',
      '#.#.#.###.#.#.#',
      '#.#.#.#B#.#.#.#',
      '#.#.#.#.#.#.#.#',
      '#.#.#...#.#.#.#',
      '#.#.#####.#.#.#',
      '#.#.........#.#',
      '#.###########.#',
      '#x............#',
      '###############'] },
    { par: 16, m: [
      '###############',
      '#S....#.......#',
      '#.##.##.#####.#',
      '#.#.....#...#.#',
      '#.#.#####.#.#.#',
      '#.#.#x....#.#.#',
      '#.#.#####.#.#.#',
      '#.#.......#.#.#',
      '#.#########.#.#',
      '#...x.......#.#',
      '#.#########.#.#',
      '#.#.......#...#',
      '#.#.#####.###.#',
      '#...#B....x...#',
      '###############'] },
    { par: 18, m: [
      '###############',
      '#......#.....S#',
      '#.####.#.###.##',
      '#.#..#.#.#.#..#',
      '#.#.##.#.#.##.#',
      '#.#....#.#....#',
      '#.######.#.####',
      '#........#....#',
      '####.#####.##.#',
      '#x...#.....#..#',
      '#.####.###.#.##',
      '#......#...#..#',
      '#.######.###..#',
      '#B.....x......#',
      '###############'] },
    { par: 18, m: [
      '###############',
      '#S.#.........x#',
      '#.#..#######.##',
      '#.#.##.....#..#',
      '#.#....###.##.#',
      '#.####.#.#....#',
      '#....#.#.####.#',
      '#.##.#.#......#',
      '#.#..#.######.#',
      '#.#.##......#.#',
      '#.#..#.####.#.#',
      '#.##.#.#B...#.#',
      '#....#.########',
      '#x............#',
      '###############'] },
    { par: 20, m: [
      '###############',
      '#S......x.....#',
      '#.#####.#####.#',
      '#.#...#.#...#.#',
      '#.#.#.#.#.#.#.#',
      '#.#.#...#.#...#',
      '#.#.#####.###.#',
      '#.#.......#...#',
      '#.#######.#.###',
      '#.....x...#...#',
      '#####.#####.#.#',
      '#.....#.....#.#',
      '#.#####.#####.#',
      '#B......x.....#',
      '###############'] },
    { par: 20, m: [
      '###############',
      '#.............#',
      '#.###########.#',
      '#.#S........#.#',
      '#.#.#.#####.#.#',
      '#.#.#..x..#.#.#',
      '#.#.#.###.#.#.#',
      '#.#.#.#B..#.#.#',
      '#.#.#.###.###.#',
      '#.#.#.......#.#',
      '#.#.#######.#.#',
      '#.#x..........#',
      '#.#############',
      '#.......x.....#',
      '###############'] },
    { par: 22, m: [
      '###############',
      '#S.....#......#',
      '#.###.##.####.#',
      '#.#.#....#..#.#',
      '#.#.####.#.##.#',
      '#.#....#.#....#',
      '#.####.#.####.#',
      '#....#.#....#.#',
      '####.#.####.#.#',
      '#x...#......#.#',
      '#.#######.#.#.#',
      '#.#.......#.#.#',
      '#.#.#####.#.#.#',
      '#...#B....#..x#',
      '###############'] },
    { par: 24, m: [
      '###############',
      '#S.#.....#....#',
      '#.#.#.##.#.##.#',
      '#.#.#..#...#..#',
      '#.#.##.###.#.##',
      '#...#..#...#..#',
      '##.##.##.###.##',
      '#x.....#.....x#',
      '#.####.#.###..#',
      '#.#......#....#',
      '#.#.#####.###.#',
      '#.#.#.....#...#',
      '#.#.#.###.###.#',
      '#...#..B#.....#',
      '###############'] }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function loadLevel(g, n) {
      var d = g.data, L = LEVELS[n];
      d.level = n;
      d.map = L.m;
      d.rows = L.m.length; d.cols = L.m[0].length;
      d.par = L.par;
      for (var r = 0; r < d.rows; r++) for (var q = 0; q < d.cols; q++) {
        var ch = L.m[r][q];
        if (ch === 'S') d.start = { x: (q + .5) * CELL, y: (r + .5) * CELL };
        if (ch === 'B') d.goal = { x: (q + .5) * CELL, y: (r + .5) * CELL };
      }
      d.ball = { x: d.start.x, y: d.start.y, vx: 0, vy: 0 };
      d.theta = 0; d.omega = 0;
      d.time = 0;
      d.intro = 1.1;
      d.deaths = 0;
      d.done = 0;
      d.trail = [];
      g.set('Level', (n + 1) + '/' + LEVELS.length);
      g.set('Time', '0.0');
    }

    function reset(g) {
      var d = g.data;
      d.parts = [];
      d.shake = 0;
      d.stars = 0;
      d.pointer = 0;
      d.flash = null;
      loadLevel(g, 0);
      g.set('Stars', 0);
      g.set('Score', 0);
    }

    function cellAt(d, x, y) {
      var q = Math.floor(x / CELL), r = Math.floor(y / CELL);
      if (r < 0 || r >= d.rows || q < 0 || q >= d.cols) return '#';
      return d.map[r][q];
    }

    function burst(d, x, y, col, n) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.283, s = U.rand(40, 240);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(.3, .7), max: .7, col: col });
      }
    }

    function die(g) {
      var d = g.data;
      burst(d, d.ball.x, d.ball.y, '#fbbf24', 22);
      d.ball.x = d.start.x; d.ball.y = d.start.y; d.ball.vx = d.ball.vy = 0;
      d.deaths++;
      d.time += 3;
      d.shake = 9;
      d.flash = { text: '+3 s', t: .9, col: '#f87171' };
      Milo.sound.explode();
    }

    function starsFor(d) {
      return d.time <= d.par ? 3 : d.time <= d.par * 1.7 ? 2 : 1;
    }

    function complete(g) {
      var d = g.data;
      var s = starsFor(d);
      d.stars += s;
      var pts = s * 100 + Math.max(0, Math.round((d.par * 2 - d.time) * 10));
      g.score += pts;
      g.set('Stars', d.stars);
      g.set('Score', U.fmt(g.score));
      d.done = 1.6;
      d.flash = { text: '★'.repeat(s) + '☆'.repeat(3 - s) + '  +' + pts, t: 1.6, col: '#fde68a' };
      burst(d, d.goal.x, d.goal.y, '#fde68a', 30);
      Milo.sound.win();
    }

    function stepBall(g, d, dt) {
      var b = d.ball;
      var gx = Math.sin(d.theta) * G, gy = Math.cos(d.theta) * G;
      b.vx += gx * dt; b.vy += gy * dt;
      b.vx *= Math.pow(.55, dt); b.vy *= Math.pow(.55, dt);
      // x
      b.x += b.vx * dt;
      resolve(d, b, true);
      b.y += b.vy * dt;
      resolve(d, b, false);
    }

    function resolve(d, b, horiz) {
      var q0 = Math.floor((b.x - BR) / CELL), q1 = Math.floor((b.x + BR) / CELL);
      var r0 = Math.floor((b.y - BR) / CELL), r1 = Math.floor((b.y + BR) / CELL);
      for (var r = r0; r <= r1; r++) for (var q = q0; q <= q1; q++) {
        var ch = (r < 0 || r >= d.rows || q < 0 || q >= d.cols) ? '#' : d.map[r][q];
        if (ch !== '#') continue;
        var cx = U.clamp(b.x, q * CELL, (q + 1) * CELL), cy = U.clamp(b.y, r * CELL, (r + 1) * CELL);
        var dx = b.x - cx, dy = b.y - cy, dist = Math.hypot(dx, dy);
        if (dist >= BR) continue;
        if (dist < .001) { dx = horiz ? (b.vx > 0 ? -1 : 1) : 0; dy = horiz ? 0 : (b.vy > 0 ? -1 : 1); dist = 1; }
        var nx = dx / dist, ny = dy / dist, pen = BR - dist;
        b.x += nx * pen; b.y += ny * pen;
        var vn = b.vx * nx + b.vy * ny;
        if (vn < 0) {
          if (vn < -140) { Milo.sound.tone({ f: 200 + Math.random() * 60, f2: 120, d: .06, v: .05, type: 'triangle' }); }
          b.vx -= (1 + .28) * vn * nx; b.vy -= (1 + .28) * vn * ny;
          // tangential friction
          var tx = -ny, ty = nx, vt = b.vx * tx + b.vy * ty;
          var vn2 = b.vx * nx + b.vy * ny;
          vt *= .96;
          b.vx = vn2 * nx + vt * tx;
          b.vy = vn2 * ny + vt * ty;
        }
      }
    }

    return Milo.arcade(host, {
      id: 'basket-fall',
      w: W, h: H, bg: '#0b1026',
      stats: ['Level', 'Time', 'Stars', 'Score'],
      emo: '🧺',
      touch: 'dpad',
      start: {
        title: 'Basket Fall',
        text: 'The ball only ever falls straight down — so turn the whole maze instead. ' +
          'Roll it into the basket as fast as you can for three stars; spikes send it back to ' +
          'the start and cost three seconds.',
        keys: ['← →  or  A D to rotate', 'Touch: left / right half of the screen']
      },
      init: reset,
      onPointer: function (g, type, x) {
        var d = g.data;
        if (type === 'up') d.pointer = 0;
        else d.pointer = x < W / 2 ? -1 : 1;
      },

      update: function (g, dt) {
        var d = g.data, b = d.ball;
        if (d.shake > 0) d.shake = Math.max(0, d.shake - dt * 30);
        d.parts = d.parts.filter(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; return p.life > 0; });
        if (d.flash) { d.flash.t -= dt; if (d.flash.t <= 0) d.flash = null; }

        if (d.done > 0) {
          d.done -= dt;
          if (d.done <= 0) {
            if (d.level + 1 >= LEVELS.length) {
              g.win({
                emo: '🧺', title: 'All baskets filled!',
                text: d.stars + ' of ' + (LEVELS.length * 3) + ' stars across ' + LEVELS.length + ' mazes.',
                score: g.score
              });
            } else loadLevel(g, d.level + 1);
          }
          return;
        }

        var turn = (g.input.down('right') ? 1 : 0) - (g.input.down('left') ? 1 : 0);
        if (!turn) turn = d.pointer;
        var target = turn * 2.4;
        d.omega += (target - d.omega) * Math.min(1, dt * 9);
        d.theta += d.omega * dt;

        if (d.intro > 0) { d.intro -= dt; return; }
        d.time += dt;
        g.set('Time', d.time.toFixed(1));

        var steps = 4;
        for (var s = 0; s < steps; s++) stepBall(g, d, dt / steps);
        d.trail.push({ x: b.x, y: b.y });
        if (d.trail.length > 14) d.trail.shift();

        var ch = cellAt(d, b.x, b.y);
        if (ch === 'x') {
          var cx = (Math.floor(b.x / CELL) + .5) * CELL, cy = (Math.floor(b.y / CELL) + .5) * CELL;
          if (Math.abs(b.x - cx) < CELL * .38 && Math.abs(b.y - cy) < CELL * .38) { die(g); return; }
        }
        if (U.dist(b.x, b.y, d.goal.x, d.goal.y) < 12) complete(g);
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, 520);
        bg.addColorStop(0, '#1b1f4a'); bg.addColorStop(1, '#070a1c');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));
        c.translate(W / 2, H / 2 + 10);
        c.rotate(d.theta);
        var mw = d.cols * CELL, mh = d.rows * CELL;
        c.translate(-mw / 2, -mh / 2);

        // floor
        c.fillStyle = '#1e2350';
        c.fillRect(0, 0, mw, mh);
        for (var r = 0; r < d.rows; r++) for (var q = 0; q < d.cols; q++) {
          var ch = d.map[r][q], x = q * CELL, y = r * CELL;
          if (ch === '#') {
            c.fillStyle = '#f472b6';
            c.fillRect(x, y, CELL, CELL);
            c.fillStyle = '#fb7fc4';
            c.fillRect(x + 2, y + 2, CELL - 4, 5);
            c.fillStyle = '#be185d';
            c.fillRect(x + 2, y + CELL - 6, CELL - 4, 4);
          } else if (ch === 'x') {
            c.fillStyle = '#2a1e3a';
            c.fillRect(x, y, CELL, CELL);
            c.fillStyle = '#cbd5e1';
            var m = CELL / 2;
            c.beginPath();
            for (var k = 0; k < 4; k++) {
              var ax = x + m + Math.cos(k * Math.PI / 2 + Math.PI / 4) * 14, ay = y + m + Math.sin(k * Math.PI / 2 + Math.PI / 4) * 14;
              c.moveTo(x + m, y + m);
              c.lineTo(ax + 4, ay); c.lineTo(ax, ay + 4);
            }
            c.fill();
            c.fillStyle = '#94a3b8';
            c.beginPath(); c.arc(x + m, y + m, 4, 0, 7); c.fill();
          }
        }
        // basket
        var gx = d.goal.x, gy = d.goal.y;
        c.fillStyle = '#92400e';
        c.beginPath(); c.moveTo(gx - 15, gy - 10); c.lineTo(gx + 15, gy - 10); c.lineTo(gx + 11, gy + 14); c.lineTo(gx - 11, gy + 14); c.closePath(); c.fill();
        c.strokeStyle = '#d97706'; c.lineWidth = 1.5;
        for (var ln = -8; ln <= 12; ln += 5) { c.beginPath(); c.moveTo(gx - 14 + (ln + 8) * .15, gy + ln); c.lineTo(gx + 14 - (ln + 8) * .15, gy + ln); c.stroke(); }
        c.strokeStyle = '#b45309'; c.lineWidth = 3;
        c.beginPath(); c.arc(gx, gy - 8, 13, Math.PI, 0); c.stroke();
        c.strokeStyle = 'rgba(253,230,138,' + (.35 + .25 * Math.sin(g.t * 4)) + ')'; c.lineWidth = 2;
        c.beginPath(); c.arc(gx, gy, 20, 0, 7); c.stroke();

        // trail + ball
        d.trail.forEach(function (p, i) {
          c.globalAlpha = i / d.trail.length * .35;
          c.fillStyle = '#fbbf24';
          c.beginPath(); c.arc(p.x, p.y, BR * i / d.trail.length, 0, 7); c.fill();
        });
        c.globalAlpha = 1;
        var b = d.ball;
        c.shadowColor = '#fbbf24'; c.shadowBlur = 14;
        c.fillStyle = '#fbbf24';
        c.beginPath(); c.arc(b.x, b.y, BR, 0, 7); c.fill();
        c.shadowBlur = 0;
        c.fillStyle = 'rgba(255,255,255,.55)';
        c.beginPath(); c.arc(b.x - 4, b.y - 4, 3.5, 0, 7); c.fill();
        c.fillStyle = '#b45309';
        c.beginPath(); c.arc(b.x + 3, b.y + 3, 3, 0, 7); c.fill();

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.beginPath(); c.arc(p.x, p.y, 3, 0, 7); c.fill();
        });
        c.globalAlpha = 1;
        c.restore();

        // star target readout
        c.fillStyle = 'rgba(0,0,0,.35)';
        U.roundRect(c, W / 2 - 130, 60, 260, 30, 15); c.fill();
        c.fillStyle = '#fde68a'; c.font = '700 14px Outfit, sans-serif'; c.textAlign = 'center';
        var s = d.intro > 0 ? 3 : starsFor(d);
        c.fillText('★'.repeat(s) + '☆'.repeat(3 - s) + '   under ' + d.par + ' s for three', W / 2, 80);

        if (d.intro > 0) {
          c.fillStyle = 'rgba(0,0,0,.5)';
          c.fillRect(0, H / 2 - 44, W, 88);
          c.fillStyle = '#fff'; c.font = '800 34px Outfit, sans-serif';
          c.fillText('Maze ' + (d.level + 1), W / 2, H / 2 + 12);
        }
        if (d.flash) {
          c.globalAlpha = Math.min(1, d.flash.t * 2);
          c.fillStyle = d.flash.col; c.font = '800 30px Outfit, sans-serif';
          c.fillText(d.flash.text, W / 2, H - 50);
          c.globalAlpha = 1;
        }
      }
    });
  }

  window.Milo.register({
    id: 'basket-fall', title: 'Basket Fall', emo: '🧺', category: 'Puzzle',
    tagline: 'Spin the maze, not the ball',
    description: 'Gravity is fixed and the ball is dumb — you steer by rotating the entire maze with ' +
      'two keys. Sixteen hand-built mazes get longer and start hiding spike traps in the ' +
      'corridors; touch one and the ball snaps back to the start with three seconds added to your ' +
      'clock. Beat each maze’s par time for three stars, and stars plus leftover time become your ' +
      'score. Tip: a half-turn is faster than waiting for the ball to roll around a U-bend.',
    controls: ['← →', 'A D', 'Touch left / right'],
    colors: ['#1e2350', '#f472b6'],
    tags: ['maze', 'rotate', 'gravity', 'physics', 'levels'],
    mount: mount
  });
})();
