/* Gravity Swap — flip which way is down to dodge the gauntlet. */
(function () {
  'use strict';
  var W = 860, H = 520, FLOOR = H - 50, ROOF = 50;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.p = { x: 150, y: FLOOR - 20, vy: 0, flip: 1 };
      d.obs = [];
      d.orbs = [];
      d.speed = 300;
      d.dist = 0;
      d.next = 300;
      d.nextOrb = 500;
      d.parts = [];
      d.collected = 0;
      g.set('Distance', 0);
      g.set('Orbs', 0);
      g.set('Best', U.fmt(g.best));
    }

    function flip(g) {
      var d = g.data;
      d.p.flip *= -1;
      d.p.vy = 0;
      Milo.sound.tone({ f: d.p.flip > 0 ? 320 : 620, f2: d.p.flip > 0 ? 220 : 820, d: .1, v: .06, type: 'triangle' });
      for (var i = 0; i < 8; i++) {
        d.parts.push({
          x: d.p.x, y: d.p.y, vx: U.rand(-120, 40), vy: U.rand(-80, 80),
          life: .35, max: .35, col: '#a78bfa'
        });
      }
    }

    return Milo.arcade(host, {
      id: 'gravity-swap',
      w: W, h: H, bg: '#0b0a22',
      stats: ['Distance', 'Orbs', 'Best'],
      touchButtons: [{ key: 'action', label: 'FLIP' }],
      emo: '🔄',
      start: {
        title: 'Gravity Swap',
        text: 'You run along the floor or the ceiling. One tap flips gravity — that is the ' +
          'only control you have. Thread the gaps and collect the orbs.',
        keys: ['Space / click to flip']
      },
      init: reset,
      onKey: function (g, e) { if (e.code === 'Space' || e.code === 'ArrowUp') flip(g); },
      onPointer: function (g, type) { if (type === 'down') flip(g); },

      update: function (g, dt) {
        var d = g.data, p = d.p;
        if (g.input.pressed('action')) flip(g);

        p.vy += 2200 * p.flip * dt;
        p.y += p.vy * dt;
        if (p.flip > 0 && p.y > FLOOR - 20) { p.y = FLOOR - 20; p.vy = 0; }
        if (p.flip < 0 && p.y < ROOF + 20) { p.y = ROOF + 20; p.vy = 0; }

        d.speed = Math.min(680, 300 + d.dist * 0.05);
        d.dist += d.speed * dt * 0.1;
        g.score = Math.floor(d.dist) + d.collected * 15;
        g.set('Distance', Math.floor(d.dist));

        d.next -= d.speed * dt;
        if (d.next <= 0) {
          d.next = U.rand(230, 400) - Math.min(120, d.dist / 12);
          var top = Math.random() < .5;
          var h = U.rand(60, 150);
          d.obs.push({ x: W + 40, y: top ? ROOF : FLOOR - h, w: U.rand(24, 46), h: h });
          if (Math.random() < .3) {
            d.obs.push({ x: W + 40 + U.rand(90, 180), y: top ? FLOOR - h : ROOF, w: 30, h: h });
          }
        }
        d.nextOrb -= d.speed * dt;
        if (d.nextOrb <= 0) {
          d.nextOrb = U.rand(300, 620);
          var oy = Math.random() < .5 ? ROOF + 60 : FLOOR - 60;
          for (var n = 0; n < 4; n++) d.orbs.push({ x: W + 40 + n * 40, y: oy, taken: false });
        }

        d.obs = d.obs.filter(function (o) { o.x -= d.speed * dt; return o.x > -80; });
        d.orbs = d.orbs.filter(function (o) { o.x -= d.speed * dt; return o.x > -40; });

        var px = p.x - 14, py = p.y - 18, pw = 28, ph = 36;
        for (var k = 0; k < d.obs.length; k++) {
          var o = d.obs[k];
          if (px < o.x + o.w && px + pw > o.x && py < o.y + o.h && py + ph > o.y) {
            Milo.sound.explode();
            for (var q = 0; q < 24; q++) {
              var a = Math.random() * 6.28, s = U.rand(60, 280);
              d.parts.push({ x: p.x, y: p.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: .7, max: .7, col: U.choice(['#22d3ee', '#fff', '#a78bfa']) });
            }
            g.gameOver({ text: Math.floor(d.dist) + ' metres and ' + d.collected + ' orbs.' });
            return;
          }
        }

        d.orbs.forEach(function (o) {
          if (o.taken) return;
          if (U.dist(o.x, o.y, p.x, p.y) < 26) {
            o.taken = true;
            d.collected++;
            g.set('Orbs', d.collected);
            Milo.sound.coin();
          }
        });

        d.parts = d.parts.filter(function (pp) {
          pp.x += pp.vx * dt; pp.y += pp.vy * dt; pp.life -= dt;
          return pp.life > 0;
        });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#16123c'); bg.addColorStop(1, '#07061a');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        c.fillStyle = '#2b2a5c';
        c.fillRect(0, 0, W, ROOF);
        c.fillRect(0, FLOOR, W, H - FLOOR);
        c.strokeStyle = '#7c5cff'; c.lineWidth = 3;
        c.beginPath();
        c.moveTo(0, ROOF); c.lineTo(W, ROOF);
        c.moveTo(0, FLOOR); c.lineTo(W, FLOOR);
        c.stroke();

        c.strokeStyle = 'rgba(124,92,255,.16)'; c.lineWidth = 1;
        c.beginPath();
        for (var x = -(d.dist * 4 % 60); x < W; x += 60) {
          c.moveTo(x, ROOF); c.lineTo(x, FLOOR);
        }
        c.stroke();

        d.obs.forEach(function (o) {
          c.fillStyle = '#e5484d';
          U.roundRect(c, o.x, o.y, o.w, o.h, 5); c.fill();
          c.fillStyle = 'rgba(255,255,255,.16)';
          U.roundRect(c, o.x + 4, o.y + 4, o.w - 8, 5, 2); c.fill();
        });

        d.orbs.forEach(function (o) {
          if (o.taken) return;
          c.shadowColor = '#ffd257'; c.shadowBlur = 14;
          c.fillStyle = '#ffd257';
          c.beginPath(); c.arc(o.x, o.y, 9, 0, 7); c.fill();
          c.shadowBlur = 0;
        });

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - 3, p.y - 3, 6, 6);
        });
        c.globalAlpha = 1;

        var p = d.p;
        c.save();
        c.translate(p.x, p.y);
        c.scale(1, p.flip);
        c.shadowColor = '#22d3ee'; c.shadowBlur = 16;
        c.fillStyle = '#22d3ee';
        U.roundRect(c, -14, -18, 28, 36, 8); c.fill();
        c.shadowBlur = 0;
        c.fillStyle = '#062a33';
        c.fillRect(-7, -8, 5, 6);
        c.fillRect(3, -8, 5, 6);
        c.restore();
      }
    });
  }

  window.Milo.register({
    id: 'gravity-swap', title: 'Gravity Swap', emo: '🔄', category: 'Arcade',
    tagline: 'One button: which way is down',
    description: 'You run automatically along either the floor or the ceiling, and your ' +
      'only control flips which. Obstacles come from both surfaces, sometimes staggered so ' +
      'you have to flip twice in quick succession. Gold orbs are worth fifteen metres each, ' +
      'and the whole thing speeds up the further you get.',
    controls: ['Space', 'Click', 'Tap'],
    colors: ['#0b0a22', '#7c5cff'],
    tags: ['one button', 'endless', 'reflex', 'runner'],
    mount: mount
  });
})();
