/* Knife Throw — stick every blade in the spinning log. */
(function () {
  'use strict';
  var W = 480, H = 660, CX = W / 2, CY = 240, R = 96;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.stage = 1;
      startStage(d);
      g.set('Stage', 1);
      g.set('Knives', d.left);
      g.set('Apples', 0);
      d.apples = 0;
    }

    function startStage(d) {
      d.stuck = [];
      d.left = 5 + Math.floor(d.stage / 2);
      d.rot = 0;
      d.speed = (1.4 + d.stage * 0.18) * (Math.random() < 0.35 ? -1 : 1);
      d.wobble = d.stage > 4;
      d.flying = null;
      d.parts = [];
      d.done = false;
      // Pre-stuck blades to dodge, and apples to hit for bonus.
      var obstacles = Math.min(6, Math.floor(d.stage / 2));
      for (var i = 0; i < obstacles; i++) {
        d.stuck.push({ a: (i / obstacles) * 6.283 + 0.4, fixed: true });
      }
      d.apple = d.stage % 2 === 0 ? { a: Math.random() * 6.283, taken: false } : null;
    }

    function throwKnife(g) {
      var d = g.data;
      if (d.flying || !d.left || d.done) return;
      d.flying = { y: H - 90 };
      Milo.sound.tone({ f: 700, f2: 400, d: .07, v: .05, type: 'triangle' });
    }

    function land(g) {
      var d = g.data;
      // The impact angle is straight up from below, in the log's frame.
      var a = ((-Math.PI / 2 - d.rot) % 6.283 + 6.283) % 6.283;
      var clash = d.stuck.some(function (s) {
        var diff = Math.abs(((s.a - a + Math.PI * 3) % 6.283) - Math.PI);
        return diff < 0.30;
      });
      if (clash) {
        Milo.sound.explode();
        for (var i = 0; i < 18; i++) {
          var ang = Math.random() * 6.28, sp = U.rand(60, 240);
          d.parts.push({ x: CX, y: CY + R, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: .6, max: .6, col: '#c9d0f0' });
        }
        d.done = true;
        g.gameOver({ emo: '🔪', title: 'Clang!', text: 'You hit another blade on stage ' + d.stage + '.' });
        return;
      }

      if (d.apple && !d.apple.taken) {
        var adiff = Math.abs(((d.apple.a - a + Math.PI * 3) % 6.283) - Math.PI);
        if (adiff < 0.30) {
          d.apple.taken = true;
          d.apples++;
          g.set('Apples', d.apples);
          g.score += 50;
          Milo.sound.coin();
        }
      }

      d.stuck.push({ a: a, fixed: false });
      d.left--;
      d.flying = null;
      g.set('Knives', d.left);
      g.score += 10;
      g.set('Stage', d.stage);
      Milo.sound.tone({ f: 320, f2: 180, d: .08, v: .06, type: 'square' });

      if (d.left <= 0) {
        d.stage++;
        g.score += 100;
        Milo.sound.win();
        startStage(d);
        g.set('Stage', d.stage);
        g.set('Knives', d.left);
      }
    }

    return Milo.arcade(host, {
      id: 'knife-throw',
      w: W, h: H, bg: '#1b1220',
      stats: ['Stage', 'Knives', 'Apples'],
      touchButtons: [{ key: 'action', label: 'THROW' }],
      emo: '🔪',
      start: {
        title: 'Knife Throw',
        text: 'Stick every knife into the spinning log without hitting one already there. ' +
          'Apples are worth a bonus. The log spins faster and carries more blades each stage.',
        keys: ['Click / Space to throw']
      },
      init: reset,
      onPointer: function (g, type) { if (type === 'down') throwKnife(g); },
      onKey: function (g, e) { if (e.code === 'Space') throwKnife(g); },

      update: function (g, dt) {
        var d = g.data;
        if (g.input.pressed('action')) throwKnife(g);
        if (d.done) return;

        var sp = d.speed;
        if (d.wobble) sp *= 1 + Math.sin(g.t * 1.6) * 0.55;
        d.rot += sp * dt;

        if (d.flying) {
          d.flying.y -= 1150 * dt;
          if (d.flying.y <= CY + R) land(g);
        }

        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 600 * dt; p.life -= dt;
          return p.life > 0;
        });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#2a1830'); bg.addColorStop(1, '#120a16');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        c.save();
        c.translate(CX, CY);
        c.rotate(d.rot);

        d.stuck.forEach(function (s) {
          c.save();
          c.rotate(s.a);
          c.fillStyle = s.fixed ? '#8b93bd' : '#dfe5ff';
          c.fillRect(-3, R, 6, 40);
          c.fillStyle = s.fixed ? '#5b628a' : '#94a3b8';
          c.beginPath();
          c.moveTo(-4, R); c.lineTo(4, R); c.lineTo(0, R - 16);
          c.closePath(); c.fill();
          c.restore();
        });

        if (d.apple && !d.apple.taken) {
          c.save();
          c.rotate(d.apple.a);
          c.font = '26px serif';
          c.textAlign = 'center';
          c.fillText('🍎', 0, R + 10);
          c.restore();
        }

        var grd = c.createRadialGradient(-24, -28, 8, 0, 0, R);
        grd.addColorStop(0, '#a86f3c'); grd.addColorStop(1, '#6b4423');
        c.fillStyle = grd;
        c.beginPath(); c.arc(0, 0, R, 0, 7); c.fill();
        c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = 3;
        for (var r = 1; r <= 3; r++) {
          c.beginPath(); c.arc(0, 0, R * (r / 4), 0, 7); c.stroke();
        }
        c.restore();

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - 2, p.y - 2, 4, 4);
        });
        c.globalAlpha = 1;

        if (d.flying) {
          c.fillStyle = '#dfe5ff';
          c.fillRect(CX - 3, d.flying.y, 6, 40);
          c.beginPath();
          c.moveTo(CX - 4, d.flying.y); c.lineTo(CX + 4, d.flying.y); c.lineTo(CX, d.flying.y - 16);
          c.closePath(); c.fill();
        }

        // remaining knives along the bottom
        for (var i = 0; i < d.left; i++) {
          c.fillStyle = '#dfe5ff';
          c.fillRect(30 + i * 18, H - 60, 5, 30);
        }
      }
    });
  }

  window.Milo.register({
    id: 'knife-throw', title: 'Knife Throw', emo: '🔪', category: 'Casual',
    tagline: 'Stick every blade in the spinning log',
    description: 'Throw knives into a rotating log without hitting one already stuck in it. ' +
      'Every stage adds knives to throw, speeds the spin up and leaves more grey blades in ' +
      'the way — and past stage four the log starts changing speed as it turns. Apples are ' +
      'worth a bonus if you can time one.',
    controls: ['Click', 'Space', 'Tap'],
    colors: ['#6b4423', '#dfe5ff'],
    tags: ['timing', 'one tap', 'reflex', 'stages'],
    mount: mount
  });
})();
