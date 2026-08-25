/* Color Rush — match the ring colour to the gate before you hit it. */
(function () {
  'use strict';
  var W = 480, H = 700;
  var COLORS = ['#ff4d6d', '#22d3ee', '#ffd257', '#a78bfa'];
  var NAMES = ['Red', 'Cyan', 'Gold', 'Violet'];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.color = 0;
      d.ball = { x: W / 2, y: H - 130, r: 16 };
      d.gates = [];
      d.speed = 210;
      d.parts = [];
      d.combo = 0;
      d.passed = 0;
      for (var i = 0; i < 4; i++) addGate(d, -i * 210);
      g.set('Score', 0);
      g.set('Combo', 0);
      g.set('Best', U.fmt(g.best));
    }

    function addGate(d, y) {
      // Each gate is a ring of four coloured arcs; you must enter through the
      // arc that matches your current colour.
      d.gates.push({ y: y, rot: Math.random() * 6.28, spin: U.rand(-1.1, 1.1), scored: false });
    }

    function cycle(g, dir) {
      var d = g.data;
      d.color = (d.color + (dir || 1) + COLORS.length) % COLORS.length;
      Milo.sound.click();
    }

    return Milo.arcade(host, {
      id: 'color-rush',
      w: W, h: H, bg: '#080b1e',
      stats: ['Score', 'Combo', 'Best'],
      emo: '🎨',
      touchButtons: [{ key: 'action', label: 'SWAP' }],
      start: {
        title: 'Colour Rush',
        text: 'Your ball climbs through spinning rings. Switch colour so you pass ' +
          'through the matching quarter — anything else and you burst.',
        keys: ['Space / Click to swap colour', '← → for a specific colour']
      },
      init: reset,
      onPointer: function (g, type) { if (type === 'down') cycle(g, 1); },
      onKey: function (g, e) {
        if (e.code === 'Space') cycle(g, 1);
        if (e.code === 'ArrowLeft') cycle(g, -1);
        if (e.code === 'ArrowRight') cycle(g, 1);
      },

      update: function (g, dt) {
        var d = g.data;
        if (g.input.pressed('action')) cycle(g, 1);

        d.speed = Math.min(430, 210 + d.passed * 6);
        var by = d.ball.y;

        d.gates.forEach(function (gt) {
          gt.y += d.speed * dt;
          gt.rot += gt.spin * dt;

          if (!gt.scored && gt.y > by) {
            gt.scored = true;
            // Which quarter is facing up as the ball crosses?
            var seg = quarterAt(gt, d.ball.x, by);
            if (seg !== d.color) { burst(g); return; }
            d.passed++;
            d.combo++;
            g.score += 10 + d.combo * 2;
            g.set('Score', U.fmt(g.score));
            g.set('Combo', 'x' + d.combo);
            Milo.sound.tone({ f: 500 + d.combo * 22, d: .08, v: .07, type: 'square' });
            for (var i = 0; i < 12; i++) {
              var a = Math.random() * 6.28;
              d.parts.push({
                x: d.ball.x, y: by, vx: Math.cos(a) * U.rand(50, 200), vy: Math.sin(a) * U.rand(50, 200),
                life: .5, max: .5, col: COLORS[d.color]
              });
            }
          }
        });

        d.gates = d.gates.filter(function (gt) { return gt.y < H + 140; });
        while (d.gates.length < 4) {
          var top = Math.min.apply(null, d.gates.map(function (x) { return x.y; }));
          addGate(d, top - U.rand(180, 240));
        }

        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
          return p.life > 0;
        });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#12103a'); sky.addColorStop(1, '#05060f');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);

        d.gates.forEach(function (gt) {
          var R = 118, th = 20;
          c.lineWidth = th;
          for (var s = 0; s < 4; s++) {
            c.strokeStyle = COLORS[s];
            c.shadowColor = COLORS[s]; c.shadowBlur = 14;
            c.beginPath();
            c.arc(W / 2, gt.y, R, gt.rot + s * Math.PI / 2, gt.rot + (s + 1) * Math.PI / 2);
            c.stroke();
          }
          c.shadowBlur = 0;
        });

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.beginPath(); c.arc(p.x, p.y, 3.5, 0, 7); c.fill();
        });
        c.globalAlpha = 1;

        var b = d.ball;
        c.shadowColor = COLORS[d.color]; c.shadowBlur = 26;
        c.fillStyle = COLORS[d.color];
        c.beginPath(); c.arc(b.x, b.y, b.r, 0, 7); c.fill();
        c.shadowBlur = 0;
        c.fillStyle = 'rgba(255,255,255,.55)';
        c.beginPath(); c.arc(b.x - 5, b.y - 5, 4.5, 0, 7); c.fill();

        c.fillStyle = 'rgba(255,255,255,.6)';
        c.font = '600 13px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText(NAMES[d.color] + ' — tap to swap', W / 2, H - 60);

        // upcoming colour swatches
        for (var s2 = 0; s2 < 4; s2++) {
          c.globalAlpha = s2 === d.color ? 1 : .28;
          c.fillStyle = COLORS[s2];
          U.roundRect(c, W / 2 - 62 + s2 * 34, H - 42, 24, 10, 5); c.fill();
        }
        c.globalAlpha = 1;
      }
    });

    /** Which coloured quarter of the ring sits where the ball crosses it. */
    function quarterAt(gt, bx, by) {
      var ang = Math.atan2(by - gt.y, bx - W / 2) - gt.rot;
      ang = ((ang % 6.283185) + 6.283185) % 6.283185;
      return Math.floor(ang / (Math.PI / 2)) % 4;
    }

    function burst(g) {
      var d = g.data;
      Milo.sound.explode();
      for (var i = 0; i < 26; i++) {
        var a = Math.random() * 6.28, s = U.rand(60, 300);
        d.parts.push({
          x: d.ball.x, y: d.ball.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
          life: U.rand(.3, .7), max: .7, col: U.choice(COLORS)
        });
      }
      g.gameOver({ text: 'Best combo this run: x' + d.combo + '.' });
    }
  }

  window.Milo.register({
    id: 'color-rush', title: 'Colour Rush', emo: '🎨', category: 'Arcade',
    tagline: 'Match your colour to the gate',
    description: 'Rings made of four coloured quarters spin toward you. Swap your ball ' +
      'to the colour of the quarter you are about to pass through — get it wrong and ' +
      'you burst. Every clean pass builds your combo, and the rings speed up as you go.',
    controls: ['Space swap', '← → pick colour', 'Tap'],
    colors: ['#ff4d6d', '#a78bfa'],
    tags: ['reflex', 'colour', 'timing', 'high score'],
    mount: mount
  });
})();
