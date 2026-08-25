/* Air Hockey — first to seven against a reading opponent. */
(function () {
  'use strict';
  var W = 520, H = 760, TARGET = 7;
  var GOAL_W = 180, WALL = 14;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.you = { x: W / 2, y: H - 120, r: 32, px: W / 2, py: H - 120 };
      d.cpu = { x: W / 2, y: 120, r: 32 };
      d.puck = { x: W / 2, y: H / 2, vx: 0, vy: 0, r: 18 };
      d.yourScore = 0;
      d.cpuScore = 0;
      d.serveT = 1;
      d.trail = [];
      g.set('You', 0);
      g.set('CPU', 0);
      g.set('First to', TARGET);
    }

    function serve(d, toward) {
      d.puck.x = W / 2; d.puck.y = H / 2;
      d.puck.vx = U.rand(-90, 90);
      d.puck.vy = toward * U.rand(190, 260);
      d.serveT = 0.9;
    }

    function goal(g, who) {
      var d = g.data;
      if (who === 'you') d.yourScore++; else d.cpuScore++;
      g.set('You', d.yourScore);
      g.set('CPU', d.cpuScore);
      if (who === 'you') Milo.sound.win(); else Milo.sound.hit();

      if (d.yourScore >= TARGET) {
        g.win({ emo: '🏒', title: 'You win ' + d.yourScore + '–' + d.cpuScore, score: d.yourScore * 100 + (TARGET - d.cpuScore) * 60 });
        return;
      }
      if (d.cpuScore >= TARGET) {
        g.gameOver({ emo: '🏒', title: 'CPU wins ' + d.cpuScore + '–' + d.yourScore, score: d.yourScore * 100 });
        return;
      }
      serve(d, who === 'you' ? -1 : 1);
    }

    function collide(paddle, puck, extraVx, extraVy) {
      var dx = puck.x - paddle.x, dy = puck.y - paddle.y;
      var dist = Math.hypot(dx, dy);
      var min = paddle.r + puck.r;
      if (dist >= min || dist < 0.01) return false;
      var nx = dx / dist, ny = dy / dist;
      puck.x = paddle.x + nx * min;
      puck.y = paddle.y + ny * min;
      var speed = Math.max(300, Math.hypot(puck.vx, puck.vy) * 1.06);
      puck.vx = nx * speed + (extraVx || 0) * 0.5;
      puck.vy = ny * speed + (extraVy || 0) * 0.5;
      return true;
    }

    return Milo.arcade(host, {
      id: 'air-hockey',
      w: W, h: H, bg: '#0b2036',
      stats: ['You', 'CPU', 'First to'],
      emo: '🏒',
      start: {
        title: 'Air Hockey',
        text: 'Drag your mallet to strike the puck. Hitting it while moving adds your own ' +
          'speed to the shot. First to seven.',
        keys: ['Move the mouse', 'Drag on touch']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        var d = g.data;
        d.you.x = U.clamp(x, WALL + d.you.r, W - WALL - d.you.r);
        d.you.y = U.clamp(y, H / 2 + d.you.r, H - WALL - d.you.r);
      },

      update: function (g, dt) {
        var d = g.data;
        var p = d.puck;

        var pvx = (d.you.x - d.you.px) / Math.max(dt, .001);
        var pvy = (d.you.y - d.you.py) / Math.max(dt, .001);
        d.you.px = d.you.x; d.you.py = d.you.y;

        if (d.serveT > 0) { d.serveT -= dt; }

        p.x += p.vx * dt;
        p.y += p.vy * dt;
        var f = Math.pow(0.72, dt);
        p.vx *= f; p.vy *= f;

        d.trail.unshift({ x: p.x, y: p.y });
        if (d.trail.length > 10) d.trail.pop();

        if (p.x - p.r < WALL) { p.x = WALL + p.r; p.vx = Math.abs(p.vx); Milo.sound.click(); }
        if (p.x + p.r > W - WALL) { p.x = W - WALL - p.r; p.vx = -Math.abs(p.vx); Milo.sound.click(); }

        var inGoal = Math.abs(p.x - W / 2) < GOAL_W / 2;
        if (p.y - p.r < WALL) {
          if (inGoal) { goal(g, 'you'); return; }
          p.y = WALL + p.r; p.vy = Math.abs(p.vy); Milo.sound.click();
        }
        if (p.y + p.r > H - WALL) {
          if (inGoal) { goal(g, 'cpu'); return; }
          p.y = H - WALL - p.r; p.vy = -Math.abs(p.vy); Milo.sound.click();
        }

        if (collide(d.you, p, pvx, pvy)) {
          Milo.sound.tone({ f: 520, f2: 700, d: .06, v: .07, type: 'square' });
        }

        // CPU: intercept when the puck is coming, otherwise fall back to goal.
        var targetX, targetY;
        if (p.vy < 0 && p.y < H / 2 + 80) {
          targetX = p.x + p.vx * 0.12;
          targetY = Math.min(p.y - 6, H / 2 - 40);
        } else {
          targetX = W / 2 + (p.x - W / 2) * 0.35;
          targetY = 100;
        }
        var speed = 260 + Math.min(220, (d.cpuScore + d.yourScore) * 22);
        var dx = U.clamp(targetX - d.cpu.x, -speed * dt, speed * dt);
        var dy = U.clamp(targetY - d.cpu.y, -speed * dt, speed * dt);
        d.cpu.x = U.clamp(d.cpu.x + dx, WALL + d.cpu.r, W - WALL - d.cpu.r);
        d.cpu.y = U.clamp(d.cpu.y + dy, WALL + d.cpu.r, H / 2 - d.cpu.r);
        if (collide(d.cpu, p, dx / dt, dy / dt)) {
          Milo.sound.tone({ f: 360, f2: 240, d: .06, v: .06, type: 'square' });
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.fillStyle = '#0b2036'; c.fillRect(0, 0, W, H);
        c.fillStyle = '#123a5e';
        c.fillRect(WALL, WALL, W - WALL * 2, H - WALL * 2);

        c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(WALL, H / 2); c.lineTo(W - WALL, H / 2); c.stroke();
        c.beginPath(); c.arc(W / 2, H / 2, 70, 0, 7); c.stroke();

        // goals
        c.fillStyle = '#061726';
        c.fillRect(W / 2 - GOAL_W / 2, 0, GOAL_W, WALL);
        c.fillRect(W / 2 - GOAL_W / 2, H - WALL, GOAL_W, WALL);
        c.strokeStyle = '#22d3ee'; c.lineWidth = 3;
        c.beginPath();
        c.moveTo(W / 2 - GOAL_W / 2, WALL); c.lineTo(W / 2 + GOAL_W / 2, WALL);
        c.moveTo(W / 2 - GOAL_W / 2, H - WALL); c.lineTo(W / 2 + GOAL_W / 2, H - WALL);
        c.stroke();

        d.trail.forEach(function (t, i) {
          c.globalAlpha = (1 - i / d.trail.length) * .25;
          c.fillStyle = '#fff';
          c.beginPath(); c.arc(t.x, t.y, d.puck.r * (1 - i / 20), 0, 7); c.fill();
        });
        c.globalAlpha = 1;

        function mallet(m, col) {
          c.fillStyle = 'rgba(0,0,0,.3)';
          c.beginPath(); c.arc(m.x + 2, m.y + 4, m.r, 0, 7); c.fill();
          c.fillStyle = col;
          c.beginPath(); c.arc(m.x, m.y, m.r, 0, 7); c.fill();
          c.fillStyle = 'rgba(255,255,255,.22)';
          c.beginPath(); c.arc(m.x, m.y, m.r * .55, 0, 7); c.fill();
        }
        mallet(d.cpu, '#fb7185');
        mallet(d.you, '#22d3ee');

        c.fillStyle = '#e8ecff';
        c.beginPath(); c.arc(d.puck.x, d.puck.y, d.puck.r, 0, 7); c.fill();
        c.fillStyle = 'rgba(0,0,0,.35)';
        c.beginPath(); c.arc(d.puck.x, d.puck.y, d.puck.r * .5, 0, 7); c.fill();
      }
    });
  }

  window.Milo.register({
    id: 'air-hockey', title: 'Air Hockey', emo: '🏒', category: 'Sports',
    tagline: 'First to seven on the table',
    description: 'Drag your mallet around your half of the table. The puck picks up your ' +
      'mallet’s own speed on contact, so a moving strike is far more dangerous than a ' +
      'stationary block. The opponent intercepts when the puck is heading its way and drops ' +
      'back to cover the goal otherwise — and it gets quicker as the score climbs.',
    controls: ['Move the mouse', 'Drag'],
    colors: ['#123a5e', '#22d3ee'],
    tags: ['vs cpu', 'physics', 'sports', 'fast'],
    mount: mount
  });
})();
