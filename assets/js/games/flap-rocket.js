/* Flap Rocket — one-button flyer through asteroid gates. */
(function () {
  'use strict';
  var W = 800, H = 560;
  var GAP = 175, PIPE_W = 78, SPACING = 260;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.y = H / 2; d.vy = 0; d.rot = 0;
      d.pipes = [];
      d.scroll = 0;
      d.speed = 200;
      d.parts = [];
      d.stars = [];
      d.passed = 0;
      d.dead = false;
      for (var i = 0; i < 70; i++) {
        d.stars.push({ x: Math.random() * W, y: Math.random() * H, z: U.rand(.2, 1) });
      }
      for (var k = 0; k < 4; k++) addPipe(d, W + 200 + k * SPACING);
      g.set('Score', 0);
      g.set('Best', U.fmt(g.best));
    }

    function addPipe(d, x) {
      var margin = 70;
      var gapY = U.rand(margin + GAP / 2, H - margin - GAP / 2);
      d.pipes.push({ x: x, gapY: gapY, scored: false, hue: U.randInt(180, 300) });
    }

    function flap(g) {
      if (g.state !== 'play' || g.data.dead) return;
      g.data.vy = -370;
      Milo.sound.tone({ f: 420, f2: 700, d: .09, v: .07, type: 'square' });
      for (var i = 0; i < 6; i++) {
        g.data.parts.push({
          x: 180, y: g.data.y + 10, vx: U.rand(-140, -40), vy: U.rand(-60, 60),
          life: .4, max: .4, col: U.choice(['#ffb020', '#ff7a45', '#fff'])
        });
      }
    }

    return Milo.arcade(host, {
      id: 'flap-rocket',
      w: W, h: H, bg: '#070b22',
      stats: ['Score', 'Best'],
      emo: '🚁',
      start: {
        title: 'Flap Rocket',
        text: 'Tap to fire the thruster and thread the rocket through the gates. ' +
          'One touch and it’s over.',
        keys: ['Space / Click / Tap']
      },
      init: reset,
      onPointer: function (g, type) { if (type === 'down') flap(g); },
      onKey: function (g, e) { if (e.code === 'Space' || e.code === 'ArrowUp') flap(g); },

      update: function (g, dt) {
        var d = g.data;
        if (g.input.pressed('up')) flap(g);

        d.vy += 1180 * dt;
        d.y += d.vy * dt;
        d.rot = U.clamp(d.vy / 700, -.6, 1.1);
        d.speed = Math.min(340, 200 + d.passed * 4);

        d.stars.forEach(function (s) {
          s.x -= d.speed * s.z * .5 * dt;
          if (s.x < 0) { s.x = W; s.y = Math.random() * H; }
        });

        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
          return p.life > 0;
        });

        // thruster trail
        if (g.frame % 2 === 0) {
          d.parts.push({
            x: 172, y: d.y + 6, vx: U.rand(-200, -110), vy: U.rand(-25, 25),
            life: .3, max: .3, col: U.choice(['#ffb020', '#ff7a45'])
          });
        }

        var rx = 180, ry = d.y, rr = 15;

        for (var i = d.pipes.length - 1; i >= 0; i--) {
          var p = d.pipes[i];
          p.x -= d.speed * dt;

          if (!p.scored && p.x + PIPE_W < rx) {
            p.scored = true;
            d.passed++;
            g.score++;
            g.set('Score', g.score);
            Milo.sound.coin();
          }

          // circle vs the two rectangles
          if (rx + rr > p.x && rx - rr < p.x + PIPE_W) {
            if (ry - rr < p.gapY - GAP / 2 || ry + rr > p.gapY + GAP / 2) { die(g); return; }
          }

          if (p.x < -PIPE_W - 40) {
            d.pipes.splice(i, 1);
            addPipe(d, d.pipes[d.pipes.length - 1].x + SPACING);
          }
        }

        if (d.y > H - 18 || d.y < 18) { die(g); return; }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;

        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#100a35');
        sky.addColorStop(1, '#050817');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);

        d.stars.forEach(function (s) {
          c.globalAlpha = s.z * .8;
          c.fillStyle = '#cfe0ff';
          c.fillRect(s.x, s.y, 2 * s.z, 2 * s.z);
        });
        c.globalAlpha = 1;

        d.pipes.forEach(function (p) {
          var col = 'hsl(' + p.hue + ',70%,';
          [[0, p.gapY - GAP / 2], [p.gapY + GAP / 2, H]].forEach(function (seg) {
            var y0 = seg[0], y1 = seg[1];
            var grd = c.createLinearGradient(p.x, 0, p.x + PIPE_W, 0);
            grd.addColorStop(0, col + '38%)');
            grd.addColorStop(.4, col + '56%)');
            grd.addColorStop(1, col + '32%)');
            c.fillStyle = grd;
            U.roundRect(c, p.x, y0, PIPE_W, y1 - y0, 8); c.fill();
            c.fillStyle = col + '66%)';
            var capY = y0 === 0 ? y1 - 22 : y0;
            U.roundRect(c, p.x - 7, capY, PIPE_W + 14, 22, 6); c.fill();
          });
        });

        // rocket
        c.save();
        c.translate(180, d.y);
        c.rotate(d.rot);
        c.fillStyle = '#e8eeff';
        c.beginPath();
        c.moveTo(22, 0); c.lineTo(-6, -12); c.lineTo(-16, -8);
        c.lineTo(-16, 8); c.lineTo(-6, 12);
        c.closePath(); c.fill();
        c.fillStyle = '#ff4d6d';
        c.beginPath();
        c.moveTo(-4, -11); c.lineTo(-18, -20); c.lineTo(-14, -6);
        c.closePath(); c.fill();
        c.beginPath();
        c.moveTo(-4, 11); c.lineTo(-18, 20); c.lineTo(-14, 6);
        c.closePath(); c.fill();
        c.fillStyle = '#22d3ee';
        c.beginPath(); c.arc(4, 0, 5, 0, 7); c.fill();
        c.restore();

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.beginPath(); c.arc(p.x, p.y, 3.2 * (p.life / p.max) + 1, 0, 7); c.fill();
        });
        c.globalAlpha = 1;

        c.fillStyle = 'rgba(255,255,255,.10)';
        c.fillRect(0, H - 12, W, 12);
      }
    });

    function die(g) {
      if (g.data.dead) return;
      g.data.dead = true;
      Milo.sound.explode();
      for (var i = 0; i < 30; i++) {
        var a = Math.random() * 6.28, s = U.rand(60, 320);
        g.data.parts.push({
          x: 180, y: g.data.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
          life: U.rand(.3, .8), max: .8, col: U.choice(['#ffb020', '#ff4d6d', '#fff'])
        });
      }
      g.gameOver({ text: 'You cleared ' + g.score + ' gate' + (g.score === 1 ? '' : 's') + '.' });
    }
  }

  window.Milo.register({
    id: 'flap-rocket', title: 'Flap Rocket', emo: '🚁', category: 'Arcade',
    tagline: 'One-button flying through tight gates',
    description: 'Tap, click or press Space to fire the thruster. Gravity does the rest. ' +
      'Fly through the gap in every gate — the gates come faster the further you get, ' +
      'and a single scrape ends the run.',
    controls: ['Space', 'Click', 'Tap'],
    colors: ['#ff7a45', '#ffb020'],
    tags: ['one button', 'flappy', 'reflex', 'high score'],
    mount: mount
  });
})();
