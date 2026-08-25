/* Hoop Shot — drag-to-shoot basketball against a 60-second clock. */
(function () {
  'use strict';
  var W = 700, H = 560, G = 1500;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.ball = { x: 150, y: H - 90, vx: 0, vy: 0, r: 20, live: false, spin: 0 };
      d.hoop = { x: 520, y: 220, r: 34, vx: 0 };
      d.time = 60;
      d.made = 0;
      d.streak = 0;
      d.bestStreak = 0;
      d.aim = null;
      d.parts = [];
      d.msg = null;
      d.shots = 0;
      d.scoredThisShot = false;
      g.set('Score', 0);
      g.set('Time', '60');
      g.set('Streak', 0);
    }

    function resetBall(d) {
      d.ball.x = 150; d.ball.y = H - 90;
      d.ball.vx = 0; d.ball.vy = 0;
      d.ball.live = false;
      d.ball.spin = 0;
      d.scoredThisShot = false;
    }

    return Milo.arcade(host, {
      id: 'hoop-shot',
      w: W, h: H, bg: '#12162e',
      stats: ['Score', 'Time', 'Streak'],
      emo: '🏀',
      start: {
        title: 'Hoop Shot',
        text: 'Sixty seconds on the clock. Drag back from the ball and let go to ' +
          'shoot — the hoop starts drifting once you get hot.',
        keys: ['Drag and release', 'Swish for bonus points']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        var d = g.data;
        if (g.state !== 'play') return;
        if (type === 'down' && !d.ball.live) {
          d.aim = { x: x, y: y };
        } else if (type === 'move' && d.aim) {
          d.aim.x = x; d.aim.y = y;
        } else if (type === 'up' && d.aim) {
          var dx = d.ball.x - d.aim.x, dy = d.ball.y - d.aim.y;
          var power = Math.min(1, Math.hypot(dx, dy) / 200);
          if (power > 0.08) {
            d.ball.vx = dx * 4.2 * power;
            d.ball.vy = dy * 4.2 * power;
            d.ball.live = true;
            d.shots++;
            d.ball.spin = dx * 0.02;
            Milo.sound.tone({ f: 220, f2: 320, d: .1, v: .08, type: 'triangle' });
          }
          d.aim = null;
        }
      },

      update: function (g, dt) {
        var d = g.data, b = d.ball, h = d.hoop;

        d.time -= dt;
        g.set('Time', Math.max(0, Math.ceil(d.time)));
        if (d.time <= 0) {
          g.gameOver({
            emo: '⏰', title: 'Time!',
            text: d.made + ' of ' + d.shots + ' shots made · best streak ' + d.bestStreak + '.'
          });
          return;
        }

        // The hoop starts moving once you're on a streak.
        if (d.bestStreak >= 3) {
          h.vx = h.vx || 70;
          h.x += h.vx * dt * Math.min(2, 1 + d.bestStreak * .1);
          if (h.x < 380) { h.x = 380; h.vx = Math.abs(h.vx); }
          if (h.x > W - 70) { h.x = W - 70; h.vx = -Math.abs(h.vx); }
        }

        if (b.live) {
          b.vy += G * dt;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.spin += b.vx * dt * 0.01;

          if (b.x - b.r < 0) { b.x = b.r; b.vx = Math.abs(b.vx) * .72; }
          if (b.x + b.r > W) { b.x = W - b.r; b.vx = -Math.abs(b.vx) * .72; }

          // Rim: two small circles the ball can bounce off.
          [[h.x - h.r, h.y], [h.x + h.r, h.y]].forEach(function (rim) {
            var dx = b.x - rim[0], dy = b.y - rim[1];
            var dist = Math.hypot(dx, dy);
            if (dist < b.r + 5 && dist > 0.01) {
              var nx = dx / dist, ny = dy / dist;
              b.x = rim[0] + nx * (b.r + 5);
              b.y = rim[1] + ny * (b.r + 5);
              var dot = b.vx * nx + b.vy * ny;
              b.vx = (b.vx - 2 * dot * nx) * .62;
              b.vy = (b.vy - 2 * dot * ny) * .62;
              Milo.sound.tone({ f: 180, d: .06, v: .06, type: 'square' });
            }
          });

          // Through the hoop: falling, inside the rim span, crossing the plane.
          if (!d.scoredThisShot && b.vy > 0 &&
            b.y > h.y && b.y < h.y + 26 &&
            b.x > h.x - h.r + 5 && b.x < h.x + h.r - 5) {
            d.scoredThisShot = true;
            d.made++;
            d.streak++;
            d.bestStreak = Math.max(d.bestStreak, d.streak);
            var swish = Math.abs(b.vx) < 130;
            var pts = (swish ? 5 : 2) + Math.min(8, d.streak);
            g.score += pts;
            g.set('Score', g.score);
            g.set('Streak', d.streak);
            d.msg = { t: 1, text: swish ? 'SWISH +' + pts : '+' + pts, col: swish ? '#ffd257' : '#34d399' };
            Milo.sound.powerup();
            for (var i = 0; i < 18; i++) {
              var a = Math.random() * 6.28, s = U.rand(60, 240);
              d.parts.push({ x: h.x, y: h.y + 14, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: .6, max: .6, col: swish ? '#ffd257' : '#34d399' });
            }
          }

          if (b.y - b.r > H + 40 || (b.y + b.r >= H - 20 && Math.abs(b.vy) < 60)) {
            if (!d.scoredThisShot) {
              d.streak = 0;
              g.set('Streak', 0);
              d.msg = { t: .8, text: 'MISS', col: '#fb7185' };
            }
            resetBall(d);
          }
          if (b.y + b.r > H - 20) {
            b.y = H - 20 - b.r;
            b.vy = -Math.abs(b.vy) * .55;
            b.vx *= .82;
          }
        }

        if (d.msg) { d.msg.t -= dt; if (d.msg.t <= 0) d.msg = null; }
        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; p.life -= dt;
          return p.life > 0;
        });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, b = d.ball, h = d.hoop;
        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#1d2145'); sky.addColorStop(1, '#0d1024');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);

        c.fillStyle = '#7a4a26';
        c.fillRect(0, H - 20, W, 20);
        c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(0, H - 20); c.lineTo(W, H - 20); c.stroke();

        // backboard + rim + net
        c.fillStyle = 'rgba(226,232,240,.9)';
        U.roundRect(c, h.x + h.r + 6, h.y - 76, 12, 104, 4); c.fill();
        c.strokeStyle = '#fb923c'; c.lineWidth = 6; c.lineCap = 'round';
        c.beginPath(); c.moveTo(h.x - h.r, h.y); c.lineTo(h.x + h.r, h.y); c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 1.5;
        c.beginPath();
        for (var n = 0; n <= 6; n++) {
          var t0 = n / 6;
          c.moveTo(h.x - h.r + t0 * h.r * 2, h.y);
          c.lineTo(h.x - h.r * .55 + t0 * h.r * 1.1, h.y + 30);
        }
        for (var r2 = 1; r2 <= 2; r2++) {
          var yy = h.y + r2 * 12;
          var half = h.r * (1 - r2 * .22);
          c.moveTo(h.x - half, yy); c.lineTo(h.x + half, yy);
        }
        c.stroke();

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.beginPath(); c.arc(p.x, p.y, 3.5, 0, 7); c.fill();
        });
        c.globalAlpha = 1;

        // aim guide
        if (d.aim) {
          var dx = b.x - d.aim.x, dy = b.y - d.aim.y;
          var power = Math.min(1, Math.hypot(dx, dy) / 200);
          c.strokeStyle = 'rgba(255,255,255,.35)';
          c.setLineDash([5, 6]); c.lineWidth = 2;
          c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(d.aim.x, d.aim.y); c.stroke();
          c.setLineDash([]);
          // predicted arc
          var sx = b.x, sy = b.y, svx = dx * 4.2 * power, svy = dy * 4.2 * power;
          c.strokeStyle = 'rgba(255,210,87,.55)';
          c.beginPath(); c.moveTo(sx, sy);
          for (var s = 0; s < 26; s++) {
            svy += G * 0.03;
            sx += svx * 0.03; sy += svy * 0.03;
            c.lineTo(sx, sy);
          }
          c.stroke();
        }

        // ball
        c.save();
        c.translate(b.x, b.y);
        c.rotate(b.spin);
        c.fillStyle = '#f97316';
        c.beginPath(); c.arc(0, 0, b.r, 0, 7); c.fill();
        c.strokeStyle = '#7c2d12'; c.lineWidth = 2;
        c.beginPath();
        c.moveTo(-b.r, 0); c.lineTo(b.r, 0);
        c.moveTo(0, -b.r); c.lineTo(0, b.r);
        c.stroke();
        c.beginPath(); c.arc(0, 0, b.r, 0, 7); c.stroke();
        c.restore();

        if (d.msg) {
          c.globalAlpha = Math.min(1, d.msg.t * 2);
          c.fillStyle = d.msg.col;
          c.font = '800 30px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(d.msg.text, h.x, h.y - 40);
          c.globalAlpha = 1;
        }

        if (!b.live && !d.aim) {
          c.fillStyle = 'rgba(255,255,255,.55)';
          c.font = '600 14px Outfit, sans-serif';
          c.textAlign = 'left';
          c.fillText('Drag back from the ball, then release', 40, H - 48);
        }
      }
    });
  }

  window.Milo.register({
    id: 'hoop-shot', title: 'Hoop Shot', emo: '🏀', category: 'Sports',
    tagline: 'Sixty seconds of free throws',
    description: 'Drag back from the ball and release to shoot — a dotted arc shows ' +
      'roughly where it will go. Clean shots that miss the rim are swishes and score more, ' +
      'consecutive baskets build a streak bonus, and once you are on a run of three the ' +
      'hoop starts sliding side to side.',
    controls: ['Drag & release', 'Touch drag'],
    colors: ['#f97316', '#fb923c'],
    tags: ['basketball', 'aiming', 'timed', 'sports'],
    mount: mount
  });
})();
