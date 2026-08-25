/* Neon Snake — the classic, with a glow and a speed ramp. */
(function () {
  'use strict';
  var COLS = 24, ROWS = 16, CELL = 32;
  var W = COLS * CELL, H = ROWS * CELL;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.snake = [{ x: 6, y: 8 }, { x: 5, y: 8 }, { x: 4, y: 8 }];
      d.dir = { x: 1, y: 0 };
      d.queue = [];
      d.step = 0;
      d.interval = 0.13;
      d.grow = 0;
      d.parts = [];
      d.shake = 0;
      placeFood(d);
      g.set('Score', 0);
      g.set('Best', U.fmt(g.best));
      g.set('Length', d.snake.length);
    }

    function placeFood(d) {
      var free = [];
      for (var y = 0; y < ROWS; y++) {
        for (var x = 0; x < COLS; x++) {
          if (!d.snake.some(function (s) { return s.x === x && s.y === y; })) free.push({ x: x, y: y });
        }
      }
      d.food = free.length ? U.choice(free) : null;
      d.golden = Math.random() < 0.18;
    }

    function turn(d, x, y) {
      var last = d.queue.length ? d.queue[d.queue.length - 1] : d.dir;
      if (last.x === -x && last.y === -y) return;   // no instant reversal
      if (last.x === x && last.y === y) return;
      if (d.queue.length < 2) d.queue.push({ x: x, y: y });
    }

    return Milo.arcade(host, {
      id: 'neon-snake',
      w: W, h: H, bg: '#080b1d',
      stats: ['Score', 'Length', 'Best'],
      touch: 'dpad',
      emo: '🐍',
      start: {
        title: 'Neon Snake',
        text: 'Eat the glowing orbs, grow long, and don’t bite yourself. ' +
          'Gold orbs are worth triple.',
        keys: ['Arrows / WASD', 'Swipe on mobile']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data;
        var i = g.input;
        if (i.pressed('up')) turn(d, 0, -1);
        if (i.pressed('down')) turn(d, 0, 1);
        if (i.pressed('left')) turn(d, -1, 0);
        if (i.pressed('right')) turn(d, 1, 0);

        d.shake = Math.max(0, d.shake - dt * 4);
        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
          p.vy += 240 * dt;
          return p.life > 0;
        });

        d.step += dt;
        if (d.step < d.interval) return;
        d.step -= d.interval;

        if (d.queue.length) d.dir = d.queue.shift();
        var head = d.snake[0];
        var nx = head.x + d.dir.x, ny = head.y + d.dir.y;

        if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) { crash(g); return; }
        // The tail tip moves away this tick, so it is safe to step onto.
        var body = d.grow > 0 ? d.snake : d.snake.slice(0, -1);
        if (body.some(function (s) { return s.x === nx && s.y === ny; })) { crash(g); return; }

        d.snake.unshift({ x: nx, y: ny });
        if (d.grow > 0) d.grow--; else d.snake.pop();

        if (d.food && nx === d.food.x && ny === d.food.y) {
          var pts = d.golden ? 30 : 10;
          g.score += pts;
          d.grow += d.golden ? 3 : 1;
          d.interval = Math.max(0.055, d.interval * 0.978);
          burst(d, nx, ny, d.golden ? '#ffd257' : '#22d3ee');
          d.shake = d.golden ? 1 : .5;
          if (d.golden) Milo.sound.powerup(); else Milo.sound.coin();
          placeFood(d);
          g.set('Score', U.fmt(g.score));
          g.set('Length', d.snake.length);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.save();
        if (d.shake > 0) c.translate(U.rand(-1, 1) * d.shake * 3, U.rand(-1, 1) * d.shake * 3);

        // grid
        c.strokeStyle = 'rgba(120,140,255,.07)';
        c.lineWidth = 1;
        c.beginPath();
        for (var x = 0; x <= COLS; x++) { c.moveTo(x * CELL, 0); c.lineTo(x * CELL, H); }
        for (var y = 0; y <= ROWS; y++) { c.moveTo(0, y * CELL); c.lineTo(W, y * CELL); }
        c.stroke();

        // food
        if (d.food) {
          var pulse = 1 + Math.sin(g.t * 7) * .13;
          var fx = d.food.x * CELL + CELL / 2, fy = d.food.y * CELL + CELL / 2;
          var col = d.golden ? '#ffd257' : '#22d3ee';
          c.shadowColor = col; c.shadowBlur = 24;
          c.fillStyle = col;
          c.beginPath(); c.arc(fx, fy, CELL * .3 * pulse, 0, 7); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = 'rgba(255,255,255,.75)';
          c.beginPath(); c.arc(fx - 3, fy - 3, CELL * .09, 0, 7); c.fill();
        }

        // snake
        for (var i = d.snake.length - 1; i >= 0; i--) {
          var s = d.snake[i];
          var f = i / Math.max(1, d.snake.length);
          var col2 = i === 0 ? '#a5ffd6' : 'hsl(' + (150 + f * 90) + ',85%,' + (62 - f * 18) + '%)';
          c.shadowColor = col2;
          c.shadowBlur = i === 0 ? 22 : 12;
          c.fillStyle = col2;
          var pad = i === 0 ? 2 : 3.5;
          U.roundRect(c, s.x * CELL + pad, s.y * CELL + pad,
            CELL - pad * 2, CELL - pad * 2, i === 0 ? 9 : 7);
          c.fill();
        }
        c.shadowBlur = 0;

        // eyes
        var hd = d.snake[0];
        if (hd) {
          var cx = hd.x * CELL + CELL / 2, cy = hd.y * CELL + CELL / 2;
          c.fillStyle = '#07240f';
          var px = d.dir.y !== 0 ? 5 : 3, py = d.dir.x !== 0 ? 5 : 3;
          c.beginPath();
          c.arc(cx + d.dir.x * 5 - px * .6, cy + d.dir.y * 5 - py * .6, 2.6, 0, 7);
          c.arc(cx + d.dir.x * 5 + px * .6, cy + d.dir.y * 5 + py * .6, 2.6, 0, 7);
          c.fill();
        }

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - 2, p.y - 2, 4, 4);
        });
        c.globalAlpha = 1;
        c.restore();
      }
    });

    function burst(d, gx, gy, col) {
      for (var i = 0; i < 16; i++) {
        var a = Math.random() * 6.28, sp = U.rand(50, 190);
        d.parts.push({
          x: gx * CELL + CELL / 2, y: gy * CELL + CELL / 2,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60,
          life: U.rand(.3, .7), max: .7, col: col
        });
      }
    }

    function crash(g) {
      g.data.shake = 1.6;
      Milo.sound.explode();
      g.gameOver({ text: 'You reached ' + g.data.snake.length + ' segments.' });
    }
  }

  window.Milo.register({
    id: 'neon-snake', title: 'Neon Snake', emo: '🐍', category: 'Arcade',
    tagline: 'Classic snake with a neon glow',
    description: 'Steer the snake around the grid, eat every orb you can and grow. ' +
      'Gold orbs are worth triple and add three segments. The snake speeds up with ' +
      'every bite — hitting a wall or your own body ends the run.',
    controls: ['Arrow keys', 'WASD', 'Touch pad'],
    colors: ['#22d3ee', '#0ea5e9'],
    tags: ['classic', 'snake', 'solo', 'high score'],
    mount: mount
  });
})();
