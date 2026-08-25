/* Pong Duel — first to seven against an AI that gets sharper as you win. */
(function () {
  'use strict';
  var W = 800, H = 500, PH = 92, PW = 14, TARGET = 7;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.you = { y: H / 2 - PH / 2, score: 0 };
      d.cpu = { y: H / 2 - PH / 2, score: 0 };
      d.rally = 0;
      d.best = 0;
      d.trail = [];
      d.serveT = 1.1;
      d.difficulty = 0.72;
      serve(d, Math.random() < .5 ? 1 : -1);
      g.set('You', 0);
      g.set('CPU', 0);
      g.set('Rally', 0);
    }

    function serve(d, dir) {
      d.ball = {
        x: W / 2, y: H / 2, r: 9,
        vx: dir * 330, vy: U.rand(-150, 150)
      };
      d.serveT = 1.0;
      d.rally = 0;
    }

    return Milo.arcade(host, {
      id: 'pong-duel',
      w: W, h: H, bg: '#080b1c',
      stats: ['You', 'CPU', 'Rally'],
      touch: 'dpad',
      emo: '🏓',
      start: {
        title: 'Pong Duel',
        text: 'First to seven. Where the ball hits your paddle decides the angle it ' +
          'leaves at, and every rally speeds it up.',
        keys: ['↑ ↓ / W S', 'Move the mouse']
      },
      init: reset,
      onPointer: function (g, type, x, y) {
        g.data.you.y = U.clamp(y - PH / 2, 0, H - PH);
      },

      update: function (g, dt) {
        var d = g.data, i = g.input, b = d.ball;

        var sp = 520 * dt;
        if (i.down('up')) d.you.y -= sp;
        if (i.down('down')) d.you.y += sp;
        d.you.y = U.clamp(d.you.y, 0, H - PH);

        if (d.serveT > 0) { d.serveT -= dt; return; }

        b.x += b.vx * dt;
        b.y += b.vy * dt;

        d.trail.unshift({ x: b.x, y: b.y });
        if (d.trail.length > 12) d.trail.pop();

        if (b.y - b.r < 0) { b.y = b.r; b.vy = Math.abs(b.vy); Milo.sound.click(); }
        if (b.y + b.r > H) { b.y = H - b.r; b.vy = -Math.abs(b.vy); Milo.sound.click(); }

        // paddles
        hitPaddle(d, 26, d.you.y, 1);
        hitPaddle(d, W - 26 - PW, d.cpu.y, -1);

        // AI: aims for where the ball will be, with a deliberate reaction limit.
        var aim = H / 2;
        if (b.vx > 0) {
          var t = (W - 26 - PW - b.x) / Math.max(1, b.vx);
          aim = b.y + b.vy * t;
          // Fold the predicted point back inside the court (bounces).
          var span = H * 2;
          aim = ((aim % span) + span) % span;
          if (aim > H) aim = span - aim;
        }
        var target = aim - PH / 2;
        var maxSpeed = 210 + d.difficulty * 320;
        var delta = U.clamp(target - d.cpu.y, -maxSpeed * dt, maxSpeed * dt);
        d.cpu.y = U.clamp(d.cpu.y + delta, 0, H - PH);

        if (b.x < -30) point(g, 'cpu');
        else if (b.x > W + 30) point(g, 'you');
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.fillStyle = '#080b1c'; c.fillRect(0, 0, W, H);

        c.strokeStyle = 'rgba(124,92,255,.30)';
        c.lineWidth = 3; c.setLineDash([12, 16]);
        c.beginPath(); c.moveTo(W / 2, 0); c.lineTo(W / 2, H); c.stroke();
        c.setLineDash([]);

        c.font = '800 62px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillStyle = 'rgba(255,255,255,.07)';
        c.fillText(d.you.score, W / 2 - 90, 84);
        c.fillText(d.cpu.score, W / 2 + 90, 84);

        d.trail.forEach(function (t, i) {
          c.globalAlpha = (1 - i / d.trail.length) * .32;
          c.fillStyle = '#22d3ee';
          c.beginPath(); c.arc(t.x, t.y, d.ball.r * (1 - i / 24), 0, 7); c.fill();
        });
        c.globalAlpha = 1;

        function paddle(x, y, col) {
          c.shadowColor = col; c.shadowBlur = 18;
          c.fillStyle = col;
          U.roundRect(c, x, y, PW, PH, 7); c.fill();
          c.shadowBlur = 0;
        }
        paddle(26, d.you.y, '#22d3ee');
        paddle(W - 26 - PW, d.cpu.y, '#fb7185');

        c.shadowColor = '#fff'; c.shadowBlur = 20;
        c.fillStyle = '#fff';
        c.beginPath(); c.arc(d.ball.x, d.ball.y, d.ball.r, 0, 7); c.fill();
        c.shadowBlur = 0;

        if (d.serveT > 0) {
          c.fillStyle = 'rgba(255,255,255,.7)';
          c.font = '600 17px Outfit, sans-serif';
          c.fillText('First to ' + TARGET, W / 2, H - 42);
        }
      }
    });

    function hitPaddle(d, px, py, dir) {
      var b = d.ball;
      if (dir > 0 && b.vx > 0) return;
      if (dir < 0 && b.vx < 0) return;
      if (b.x + b.r < px || b.x - b.r > px + PW) return;
      if (b.y + b.r < py || b.y - b.r > py + PH) return;

      var rel = U.clamp((b.y - (py + PH / 2)) / (PH / 2), -1, 1);
      var speed = Math.min(760, Math.hypot(b.vx, b.vy) * 1.06);
      var ang = rel * 0.92;
      b.vx = Math.cos(ang) * speed * dir;
      b.vy = Math.sin(ang) * speed;
      b.x = dir > 0 ? px + PW + b.r : px - b.r;
      d.rally++;
      d.best = Math.max(d.best, d.rally);
      Milo.sound.tone({ f: dir > 0 ? 440 : 330, f2: dir > 0 ? 620 : 240, d: .06, v: .08, type: 'square' });
    }

    function point(g, who) {
      var d = g.data;
      d[who].score++;
      g.set('You', d.you.score);
      g.set('CPU', d.cpu.score);
      g.set('Rally', d.best);
      if (who === 'you') { Milo.sound.powerup(); d.difficulty = Math.min(1, d.difficulty + .06); }
      else Milo.sound.hit();

      if (d.you.score >= TARGET) {
        g.win({
          emo: '🏆', title: 'Game, set, match',
          text: 'You won ' + d.you.score + '–' + d.cpu.score + '. Longest rally: ' + d.best + '.',
          score: d.you.score * 100 + d.best * 20 + (TARGET - d.cpu.score) * 60
        });
        return;
      }
      if (d.cpu.score >= TARGET) {
        g.gameOver({
          title: 'CPU wins',
          text: 'Final score ' + d.you.score + '–' + d.cpu.score + '. Longest rally: ' + d.best + '.',
          score: d.you.score * 100 + d.best * 20
        });
        return;
      }
      serve(d, who === 'you' ? 1 : -1);
    }
  }

  window.Milo.register({
    id: 'pong-duel', title: 'Pong Duel', emo: '🏓', category: 'Sports',
    tagline: 'First to seven against the machine',
    description: 'The original video game, sharpened up. Where the ball strikes your ' +
      'paddle sets the angle it comes off at, and every return makes it faster. The CPU ' +
      'predicts where the ball is heading — and it gets a little quicker every point you take.',
    controls: ['↑ ↓', 'W S', 'Mouse'],
    colors: ['#22d3ee', '#fb7185'],
    tags: ['classic', 'vs cpu', 'paddle', 'sports'],
    mount: mount
  });
})();
