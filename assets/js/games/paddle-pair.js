/* Paddle Pair — you are both paddles, and the ball keeps splitting. */
(function () {
  'use strict';
  var W = 840, H = 520;
  var PW = 14, PH = 92, MARGIN = 26;
  var BALL_COLS = ['#4ade80', '#a3e635', '#22d3ee', '#fde047', '#f472b6', '#fb923c'];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function spawnBall(d, from) {
      var ang = U.rand(-0.6, 0.6) + (Math.random() < .5 ? 0 : Math.PI);
      var sp = d.speed;
      var b = {
        x: from ? from.x : W / 2, y: from ? from.y : H / 2,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp * 0.9 + U.rand(-60, 60),
        r: 8, col: BALL_COLS[d.ballSeq % BALL_COLS.length], trail: [], hits: 0, born: 0
      };
      d.ballSeq++;
      d.balls.push(b);
      return b;
    }

    function burst(d, x, y, col, n, spd) {
      for (var i = 0; i < (n || 14); i++) {
        var a = Math.random() * 6.283, s = U.rand(40, spd || 260);
        d.parts.push({
          x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
          life: U.rand(.25, .7), max: .7, col: col, r: U.rand(1.6, 3.4)
        });
      }
    }

    function say(d, t) { d.msg = t; d.msgT = 1.6; }

    function reset(g) {
      var d = g.data;
      d.left = { y: H / 2, vy: 0 };
      d.right = { y: H / 2, vy: 0 };
      d.balls = [];
      d.parts = [];
      d.ballSeq = 0;
      d.speed = 270;
      d.lives = 3;
      d.rally = 0;
      d.best = 0;
      d.splitT = 12;
      d.stage = 1;
      d.shake = 0;
      d.flash = 0;
      d.msg = '';
      d.msgT = 0;
      d.serve = 1.2;
      d.elapsed = 0;
      spawnBall(d, null);
      g.score = 0;
      g.set('Score', 0);
      g.set('Balls', 1);
      g.set('Rally', 0);
      g.set('Lives', 3);
    }

    function loseBall(g, b, side) {
      var d = g.data;
      var ix = d.balls.indexOf(b);
      if (ix >= 0) d.balls.splice(ix, 1);
      burst(d, side < 0 ? 4 : W - 4, b.y, b.col, 26, 340);
      d.shake = 20;
      d.flash = .45;
      d.rally = 0;
      g.set('Rally', 0);
      d.lives--;
      g.set('Lives', Math.max(0, d.lives));
      g.set('Balls', d.balls.length);
      Milo.sound.explode();
      if (d.lives <= 0) {
        g.gameOver({
          emo: '🏓', title: 'Court empty',
          text: 'Longest rally ' + d.best + ' at ' + d.stage + ' ball' + (d.stage === 1 ? '' : 's') + ' on court.'
        });
        return;
      }
      if (!d.balls.length) { d.serve = 1.1; }
      say(d, d.lives + ' LIVES LEFT');
    }

    return Milo.arcade(host, {
      id: 'paddle-pair',
      w: W, h: H, bg: '#020604',
      stats: ['Score', 'Balls', 'Rally', 'Lives'],
      emo: '🏓',
      start: {
        title: 'Paddle Pair',
        text: 'Both paddles are yours. W and S drive the left one, ↑ and ↓ the right one — ' +
          'or drag on either half of the court. Balls split as the rally goes on and every ' +
          'one of them has to stay alive. Three misses and the court is empty.',
        keys: ['W S — left paddle', '↑ ↓ — right paddle', 'Drag either half']
      },
      init: reset,
      onPointer: function (g, type, x, y) {
        var d = g.data;
        if (type === 'up') return;
        if (x < W / 2) d.left.y = U.clamp(y, PH / 2, H - PH / 2);
        else d.right.y = U.clamp(y, PH / 2, H - PH / 2);
      },

      update: function (g, dt) {
        var d = g.data, i = g.input;
        d.shake = Math.max(0, d.shake - dt * 46);
        d.flash = Math.max(0, d.flash - dt * 1.8);
        d.msgT = Math.max(0, d.msgT - dt);
        d.elapsed += dt;

        d.parts = d.parts.filter(function (q) {
          q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= .95; q.vy *= .95; q.life -= dt;
          return q.life > 0;
        });

        /* -- paddles -- */
        var PSPD = 620;
        var lIn = (i.down('KeyS') ? 1 : 0) - (i.down('KeyW') ? 1 : 0);
        var rIn = (i.down('ArrowDown') ? 1 : 0) - (i.down('ArrowUp') ? 1 : 0);
        if (lIn) d.left.y += lIn * PSPD * dt;
        if (rIn) d.right.y += rIn * PSPD * dt;
        d.left.y = U.clamp(d.left.y, PH / 2, H - PH / 2);
        d.right.y = U.clamp(d.right.y, PH / 2, H - PH / 2);

        /* -- serve after a loss -- */
        if (d.serve > 0) {
          d.serve -= dt;
          if (d.serve <= 0 && !d.balls.length) spawnBall(d, null);
        }

        /* -- split timer: the court fills up as you survive -- */
        d.splitT -= dt;
        if (d.splitT <= 0 && d.balls.length && d.balls.length < 7) {
          d.splitT = Math.max(9, 20 - d.stage * 1.6);
          var src = d.balls[U.randInt(0, d.balls.length - 1)];
          var nb = spawnBall(d, src);
          nb.vy = -src.vy;
          nb.vx = src.vx;
          d.stage = d.balls.length;
          g.set('Balls', d.balls.length);
          say(d, 'BALL ' + d.balls.length + ' ON COURT');
          Milo.sound.powerup();
        }

        /* -- balls -- */
        var LX = MARGIN + PW, RX = W - MARGIN - PW;
        for (var k = d.balls.length - 1; k >= 0; k--) {
          var b = d.balls[k];
          b.born += dt;
          b.trail.push({ x: b.x, y: b.y });
          if (b.trail.length > 14) b.trail.shift();

          b.x += b.vx * dt;
          b.y += b.vy * dt;

          if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy); ping(d, b, 1); }
          if (b.y > H - b.r) { b.y = H - b.r; b.vy = -Math.abs(b.vy); ping(d, b, 1); }

          // left paddle
          if (b.vx < 0 && b.x - b.r <= LX && b.x > MARGIN - 14) {
            if (Math.abs(b.y - d.left.y) < PH / 2 + b.r) {
              hitPaddle(g, b, d.left, 1);
              b.x = LX + b.r;
            }
          }
          // right paddle
          if (b.vx > 0 && b.x + b.r >= RX && b.x < W - MARGIN + 14) {
            if (Math.abs(b.y - d.right.y) < PH / 2 + b.r) {
              hitPaddle(g, b, d.right, -1);
              b.x = RX - b.r;
            }
          }

          if (b.x < -20) { loseBall(g, b, -1); if (g.state === 'over') return; continue; }
          if (b.x > W + 20) { loseBall(g, b, 1); if (g.state === 'over') return; continue; }
        }

        // ambient scoring: staying alive with more balls is worth more
        d.scoreAcc = (d.scoreAcc || 0) + dt * d.balls.length * 8;
        if (d.scoreAcc >= 1) {
          var add = Math.floor(d.scoreAcc);
          d.scoreAcc -= add;
          g.score += add;
          g.set('Score', U.fmt(g.score));
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        c.fillStyle = '#020604'; c.fillRect(-40, -40, W + 80, H + 80);

        // CRT scanlines + vignette
        c.fillStyle = 'rgba(74,222,128,.035)';
        for (var y = 0; y < H; y += 4) c.fillRect(0, y, W, 2);
        var vig = c.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.95);
        vig.addColorStop(0, 'rgba(0,0,0,0)');
        vig.addColorStop(1, 'rgba(0,0,0,.65)');
        c.fillStyle = vig; c.fillRect(0, 0, W, H);

        // court
        c.strokeStyle = 'rgba(74,222,128,.35)'; c.lineWidth = 3;
        c.strokeRect(6, 6, W - 12, H - 12);
        c.setLineDash([12, 14]);
        c.strokeStyle = 'rgba(74,222,128,.28)';
        c.beginPath(); c.moveTo(W / 2, 12); c.lineTo(W / 2, H - 12); c.stroke();
        c.setLineDash([]);
        c.strokeStyle = 'rgba(74,222,128,.16)';
        c.lineWidth = 2;
        c.beginPath(); c.arc(W / 2, H / 2, 58, 0, 7); c.stroke();

        // half labels
        c.fillStyle = 'rgba(74,222,128,.25)';
        c.font = '800 13px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText('W / S', W * 0.25, H - 20);
        c.fillText('↑ / ↓', W * 0.75, H - 20);

        // trails
        d.balls.forEach(function (b) {
          for (var t = 0; t < b.trail.length; t++) {
            var p = b.trail[t];
            c.globalAlpha = (t / b.trail.length) * .35;
            c.fillStyle = b.col;
            c.beginPath(); c.arc(p.x, p.y, b.r * (0.3 + t / b.trail.length * 0.7), 0, 7); c.fill();
          }
          c.globalAlpha = 1;
        });

        // paddles
        function paddle(x, y, col) {
          c.shadowColor = col; c.shadowBlur = 18;
          c.fillStyle = col;
          U.roundRect(c, x, y - PH / 2, PW, PH, 7); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = 'rgba(255,255,255,.4)';
          U.roundRect(c, x + 3, y - PH / 2 + 5, PW - 6, PH - 10, 4); c.fill();
        }
        paddle(MARGIN, d.left.y, '#4ade80');
        paddle(W - MARGIN - PW, d.right.y, '#22d3ee');

        // balls
        d.balls.forEach(function (b) {
          c.shadowColor = b.col; c.shadowBlur = 20;
          c.fillStyle = b.col;
          c.beginPath(); c.arc(b.x, b.y, b.r, 0, 7); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = 'rgba(255,255,255,.75)';
          c.beginPath(); c.arc(b.x - 2.4, b.y - 2.4, b.r * .38, 0, 7); c.fill();
        });

        d.parts.forEach(function (q) {
          c.globalAlpha = Math.max(0, q.life / q.max);
          c.fillStyle = q.col;
          c.fillRect(q.x - q.r, q.y - q.r, q.r * 2, q.r * 2);
        });
        c.globalAlpha = 1;
        c.restore();

        // HUD strip
        c.fillStyle = 'rgba(74,222,128,.8)';
        c.font = '800 15px Outfit, sans-serif';
        c.textAlign = 'center';
        if (d.serve > 0 && !d.balls.length) {
          c.fillStyle = '#fde047';
          c.font = '800 30px Outfit, sans-serif';
          c.fillText('SERVE IN ' + Math.ceil(d.serve), W / 2, H / 2 - 8);
        } else if (d.msgT > 0) {
          c.globalAlpha = Math.min(1, d.msgT);
          c.fillStyle = '#fde047';
          c.font = '800 24px Outfit, sans-serif';
          c.fillText(d.msg, W / 2, 48);
          c.globalAlpha = 1;
        }
        // next-split meter
        var meter = U.clamp(1 - d.splitT / Math.max(9, 20 - d.stage * 1.6), 0, 1);
        c.fillStyle = 'rgba(255,255,255,.1)';
        U.roundRect(c, W / 2 - 70, H - 14, 140, 6, 3); c.fill();
        c.fillStyle = '#f472b6';
        U.roundRect(c, W / 2 - 70, H - 14, 140 * meter, 6, 3); c.fill();
        c.textAlign = 'left';

        if (d.flash > 0) {
          c.fillStyle = 'rgba(248,113,113,' + U.clamp(d.flash * .5, 0, .6) + ')';
          c.fillRect(0, 0, W, H);
        }
      }
    });

    function ping(d, b, wall) {
      Milo.sound.tone({ f: wall ? 420 : 520, f2: wall ? 300 : 700, d: .04, v: .035, type: 'square' });
      for (var i = 0; i < 3; i++) {
        d.parts.push({
          x: b.x, y: b.y, vx: U.rand(-60, 60), vy: U.rand(-60, 60),
          life: .2, max: .2, col: b.col, r: 2
        });
      }
    }

    function hitPaddle(g, b, pad, dir) {
      var d = g.data;
      var off = U.clamp((b.y - pad.y) / (PH / 2), -1, 1);
      var ang = off * 0.82;
      d.speed = Math.min(660, d.speed + 4);
      var sp = Math.min(700, Math.hypot(b.vx, b.vy) + 14);
      b.vx = Math.cos(ang) * sp * dir;
      b.vy = Math.sin(ang) * sp;
      b.hits++;
      d.rally++;
      if (d.rally > d.best) d.best = d.rally;
      g.set('Rally', d.rally);
      g.score += 10 + d.balls.length * 5;
      g.set('Score', U.fmt(g.score));
      for (var i = 0; i < 6; i++) {
        d.parts.push({
          x: b.x, y: b.y, vx: -dir * U.rand(40, 160), vy: U.rand(-120, 120),
          life: .28, max: .28, col: dir > 0 ? '#4ade80' : '#22d3ee', r: U.rand(1.4, 2.8)
        });
      }
      Milo.sound.tone({ f: 640 + Math.abs(off) * 240, f2: 900, d: .05, v: .05, type: 'square' });
    }
  }

  window.Milo.register({
    id: 'paddle-pair',
    title: 'Paddle Pair',
    emo: '🏓',
    category: 'Arcade',
    tagline: 'You play both ends of the court',
    description: 'One court, two paddles, and both of them are yours — W and S run the left, ' +
      'the arrow keys run the right, and on touch you drag on either half. Every twenty ' +
      'seconds or so a ball splits in two and the interval shortens, up to seven balls at ' +
      'once, while every return adds a little speed. Points come from returns and from ' +
      'simply keeping a crowded court alive; three balls past you and it is over.',
    controls: ['W S', '↑ ↓', 'Drag either half'],
    colors: ['#020604', '#4ade80'],
    tags: ['classic', 'pong', 'reflex', 'arcade', 'hard'],
    mount: mount
  });
})();
