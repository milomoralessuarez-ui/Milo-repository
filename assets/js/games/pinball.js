/* Pinball — flippers, bumpers, targets and a real plunger. */
(function () {
  'use strict';
  var W = 460, H = 720;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.ball = null;
      d.balls = 3;
      d.plunger = 0;
      d.charging = false;
      d.left = { a: 0.5, target: 0.5 };
      d.right = { a: -0.5, target: -0.5 };
      d.bumpers = [
        { x: 150, y: 200, r: 26, flash: 0 },
        { x: 300, y: 190, r: 26, flash: 0 },
        { x: 225, y: 280, r: 30, flash: 0 }
      ];
      d.targets = [
        { x: 90, y: 340, w: 44, h: 12, lit: false },
        { x: 160, y: 340, w: 44, h: 12, lit: false },
        { x: 230, y: 340, w: 44, h: 12, lit: false }
      ];
      d.parts = [];
      d.msg = 'Hold to charge the plunger';
      g.set('Score', 0);
      g.set('Balls', 3);
      g.set('Multi', '×1');
      d.mult = 1;
    }

    var LANE_X = W - 34;

    function launch(d, power) {
      d.ball = { x: LANE_X, y: H - 90, vx: 0, vy: -power * 1150, r: 10 };
      d.msg = '';
      Milo.sound.tone({ f: 200, f2: 500, d: .2, v: .07, type: 'triangle' });
    }

    function bump(d, g, pts, x, y, col) {
      g.score += pts * d.mult;
      g.set('Score', U.fmt(g.score));
      for (var i = 0; i < 8; i++) {
        var a = Math.random() * 6.28, s = U.rand(60, 200);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: .4, max: .4, col: col });
      }
    }

    return Milo.arcade(host, {
      id: 'pinball',
      w: W, h: H, bg: '#120b22',
      stats: ['Score', 'Balls', 'Multi'],
      touchButtons: [{ key: 'left', label: 'L' }, { key: 'right', label: 'R' }],
      emo: '🎱',
      start: {
        title: 'Pinball',
        text: 'Hold Space to charge the plunger, release to launch. Left and right arrows ' +
          'work the flippers. Light all three drop targets to raise your multiplier.',
        keys: ['Hold Space to launch', '← → flippers']
      },
      init: reset,

      onKey: function (g, e) {
        var d = g.data;
        if (e.code === 'Space' && !d.ball) d.charging = true;
      },

      update: function (g, dt) {
        var d = g.data, i = g.input;

        if (!d.ball) {
          var holding = i.down('action') || i.pdown || d.charging;
          if (holding) {
            d.plunger = Math.min(1, d.plunger + dt * 1.2);
            d.msg = 'Power ' + Math.round(d.plunger * 100) + '%';
          } else if (d.plunger > 0.05) {
            launch(d, d.plunger);
            d.plunger = 0;
            d.charging = false;
          }
        }

        d.left.target = i.down('left') ? -0.75 : 0.5;
        d.right.target = i.down('right') ? 0.75 : -0.5;
        d.left.a += (d.left.target - d.left.a) * Math.min(1, dt * 22);
        d.right.a += (d.right.target - d.right.a) * Math.min(1, dt * 22);

        d.bumpers.forEach(function (b) { b.flash = Math.max(0, b.flash - dt * 3); });

        var b = d.ball;
        if (b) {
          b.vy += 900 * dt;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.vx *= Math.pow(0.86, dt);

          if (b.x < 22 + b.r) { b.x = 22 + b.r; b.vx = Math.abs(b.vx) * .8; }
          if (b.x > W - 22 - b.r) { b.x = W - 22 - b.r; b.vx = -Math.abs(b.vx) * .8; }
          if (b.y < 40 + b.r) { b.y = 40 + b.r; b.vy = Math.abs(b.vy) * .8; }

          d.bumpers.forEach(function (bp) {
            var dist = U.dist(b.x, b.y, bp.x, bp.y);
            if (dist > bp.r + b.r || dist < 0.01) return;
            var nx = (b.x - bp.x) / dist, ny = (b.y - bp.y) / dist;
            b.x = bp.x + nx * (bp.r + b.r);
            b.y = bp.y + ny * (bp.r + b.r);
            var sp = Math.max(320, Math.hypot(b.vx, b.vy));
            b.vx = nx * sp; b.vy = ny * sp;
            bp.flash = 1;
            bump(d, g, 100, bp.x, bp.y, '#ffd257');
            Milo.sound.tone({ f: 640, f2: 900, d: .07, v: .06, type: 'square' });
          });

          d.targets.forEach(function (t) {
            if (t.lit) return;
            if (b.x + b.r < t.x || b.x - b.r > t.x + t.w) return;
            if (b.y + b.r < t.y || b.y - b.r > t.y + t.h) return;
            t.lit = true;
            b.vy = Math.abs(b.vy) * .9;
            bump(d, g, 250, t.x + t.w / 2, t.y, '#34d399');
            Milo.sound.coin();
            if (d.targets.every(function (q) { return q.lit; })) {
              d.mult++;
              g.set('Multi', '×' + d.mult);
              d.targets.forEach(function (q) { q.lit = false; });
              d.msg = 'Multiplier ×' + d.mult + '!';
              Milo.sound.win();
            }
          });

          // flippers, as rotating line segments
          [[70, d.left, 1], [W - 70, d.right, -1]].forEach(function (f) {
            var ox = f[0], fl = f[1], side = f[2];
            var fy = H - 150;
            var ex = ox + Math.cos(fl.a) * 78 * side;
            var ey = fy + Math.sin(fl.a) * 78;
            var t = U.clamp(((b.x - ox) * (ex - ox) + (b.y - fy) * (ey - fy)) /
              (Math.pow(ex - ox, 2) + Math.pow(ey - fy, 2) || 1), 0, 1);
            var cx = ox + (ex - ox) * t, cy = fy + (ey - fy) * t;
            var dist = U.dist(b.x, b.y, cx, cy);
            if (dist > b.r + 8 || dist < 0.01) return;
            var nx = (b.x - cx) / dist, ny = (b.y - cy) / dist;
            b.x = cx + nx * (b.r + 8);
            b.y = cy + ny * (b.r + 8);
            var moving = Math.abs(fl.target - fl.a) > 0.1;
            var sp = moving ? 720 : Math.max(260, Math.hypot(b.vx, b.vy) * .8);
            b.vx = nx * sp * .8 + side * 60;
            b.vy = -Math.abs(ny * sp);
            Milo.sound.tone({ f: 300, f2: 420, d: .06, v: .06, type: 'square' });
          });

          if (b.y > H + 40) {
            d.ball = null;
            d.balls--;
            d.mult = 1;
            g.set('Balls', Math.max(0, d.balls));
            g.set('Multi', '×1');
            Milo.sound.lose();
            if (d.balls <= 0) {
              g.gameOver({ emo: '🎱', title: 'Ball three drained', text: 'Final score ' + U.fmt(g.score) + '.' });
              return;
            }
            d.msg = 'Hold to charge the plunger';
          }
        }

        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; p.life -= dt;
          return p.life > 0;
        });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#241243'); bg.addColorStop(1, '#0c0618');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        c.fillStyle = '#3a2a5e';
        c.fillRect(0, 0, 22, H);
        c.fillRect(W - 22, 0, 22, H);
        c.fillRect(0, 0, W, 40);

        d.targets.forEach(function (t) {
          c.fillStyle = t.lit ? '#34d399' : '#4a5570';
          U.roundRect(c, t.x, t.y, t.w, t.h, 4); c.fill();
        });

        d.bumpers.forEach(function (bp) {
          c.fillStyle = bp.flash > 0 ? '#fff' : '#fb7185';
          c.shadowColor = '#fb7185'; c.shadowBlur = bp.flash > 0 ? 26 : 12;
          c.beginPath(); c.arc(bp.x, bp.y, bp.r, 0, 7); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = 'rgba(0,0,0,.35)';
          c.beginPath(); c.arc(bp.x, bp.y, bp.r * .5, 0, 7); c.fill();
        });

        // flippers
        [[70, d.left, 1], [W - 70, d.right, -1]].forEach(function (f) {
          var ox = f[0], fl = f[1], side = f[2];
          var fy = H - 150;
          c.strokeStyle = '#22d3ee'; c.lineWidth = 16; c.lineCap = 'round';
          c.beginPath();
          c.moveTo(ox, fy);
          c.lineTo(ox + Math.cos(fl.a) * 78 * side, fy + Math.sin(fl.a) * 78);
          c.stroke();
        });

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - 2.5, p.y - 2.5, 5, 5);
        });
        c.globalAlpha = 1;

        if (d.ball) {
          c.fillStyle = '#e8ecff';
          c.beginPath(); c.arc(d.ball.x, d.ball.y, d.ball.r, 0, 7); c.fill();
          c.fillStyle = 'rgba(255,255,255,.5)';
          c.beginPath(); c.arc(d.ball.x - 3, d.ball.y - 4, 3.5, 0, 7); c.fill();
        } else {
          c.fillStyle = '#fb7185';
          c.fillRect(LANE_X - 10, H - 70 + d.plunger * 34, 20, 40);
        }

        c.fillStyle = '#dfe5ff';
        c.font = '700 14px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText(d.msg, W / 2, H - 22);
      }
    });
  }

  window.Milo.register({
    id: 'pinball', title: 'Pinball', emo: '🎱', category: 'Arcade',
    tagline: 'Bumpers, targets and a multiplier to build',
    description: 'A single-screen table with a charging plunger, two flippers and real ' +
      'physics. Bumpers kick the ball away hard and pay a hundred; the three drop targets ' +
      'pay 250 each and lighting all three raises your multiplier — which resets when you ' +
      'drain, so it is always a decision between banking and pushing on. Three balls.',
    controls: ['Hold Space to launch', '← → flippers'],
    colors: ['#120b22', '#fb7185'],
    tags: ['pinball', 'physics', 'arcade', 'classic'],
    mount: mount
  });
})();
