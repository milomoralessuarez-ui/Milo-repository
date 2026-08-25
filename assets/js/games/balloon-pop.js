/* Balloon Pop — pop the colour that's called, before the timer runs out. */
(function () {
  'use strict';
  var W = 760, H = 560;
  var COLORS = [
    { name: 'Red', col: '#ef4444' }, { name: 'Blue', col: '#3b82f6' },
    { name: 'Green', col: '#22c55e' }, { name: 'Yellow', col: '#eab308' },
    { name: 'Purple', col: '#a855f7' }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.balloons = [];
      d.parts = [];
      d.time = 45;
      d.target = 0;
      d.hits = 0;
      d.misses = 0;
      d.combo = 0;
      d.spawn = 0;
      pickTarget(d);
      g.set('Score', 0);
      g.set('Time', 45);
      g.set('Pop', COLORS[d.target].name);
    }

    function pickTarget(d) {
      d.target = U.randInt(0, COLORS.length - 1);
    }

    return Milo.arcade(host, {
      id: 'balloon-pop',
      w: W, h: H, bg: '#0e1a34',
      stats: ['Score', 'Time', 'Pop'],
      emo: '🎈',
      start: {
        title: 'Balloon Pop',
        text: 'Only pop the colour named at the top — it changes as you go. Popping the ' +
          'wrong one costs you points and time.',
        keys: ['Click the balloons']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data;
        for (var i = d.balloons.length - 1; i >= 0; i--) {
          var b = d.balloons[i];
          if (U.dist(x, y, b.x, b.y) > b.r + 4) continue;
          d.balloons.splice(i, 1);
          if (b.kind === d.target) {
            d.hits++;
            d.combo++;
            var pts = 20 + d.combo * 3;
            g.score += pts;
            g.set('Score', U.fmt(g.score));
            burst(d, b.x, b.y, COLORS[b.kind].col);
            Milo.sound.tone({ f: 600 + d.combo * 30, f2: 900, d: .07, v: .06, type: 'square' });
            // Change the target now and then to keep people reading it.
            if (d.hits % 4 === 0) { pickTarget(d); g.set('Pop', COLORS[d.target].name); }
          } else {
            d.misses++;
            d.combo = 0;
            g.score = Math.max(0, g.score - 15);
            d.time = Math.max(0, d.time - 2);
            g.set('Score', U.fmt(g.score));
            Milo.sound.tone({ f: 160, d: .12, v: .06, type: 'square' });
            burst(d, b.x, b.y, '#64748b');
          }
          return;
        }
      },

      update: function (g, dt) {
        var d = g.data;
        d.time -= dt;
        g.set('Time', Math.max(0, Math.ceil(d.time)));
        if (d.time <= 0) {
          g.gameOver({
            emo: '🎈', title: 'Time!',
            text: d.hits + ' correct pops, ' + d.misses + ' wrong.'
          });
          return;
        }

        d.spawn -= dt;
        if (d.spawn <= 0) {
          d.spawn = U.rand(0.24, 0.6);
          var kind = Math.random() < .45 ? d.target : U.randInt(0, COLORS.length - 1);
          d.balloons.push({
            x: U.rand(50, W - 50), y: H + 40, r: U.rand(24, 34),
            vy: -U.rand(60, 130), sway: U.rand(-1, 1), t: Math.random() * 6, kind: kind
          });
        }

        d.balloons = d.balloons.filter(function (b) {
          b.t += dt;
          b.y += b.vy * dt;
          b.x += Math.sin(b.t * 1.5) * b.sway * 30 * dt;
          return b.y > -60;
        });

        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; p.life -= dt;
          return p.life > 0;
        });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#1a3054'); sky.addColorStop(1, '#0a1428');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);

        d.balloons.forEach(function (b) {
          var col = COLORS[b.kind].col;
          c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 1.4;
          c.beginPath();
          c.moveTo(b.x, b.y + b.r);
          c.quadraticCurveTo(b.x + 8, b.y + b.r + 20, b.x, b.y + b.r + 38);
          c.stroke();
          c.fillStyle = col;
          c.beginPath(); c.ellipse(b.x, b.y, b.r, b.r * 1.18, 0, 0, 7); c.fill();
          c.fillStyle = 'rgba(255,255,255,.4)';
          c.beginPath(); c.ellipse(b.x - b.r * .3, b.y - b.r * .35, b.r * .18, b.r * .28, -.4, 0, 7); c.fill();
        });

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - 3, p.y - 3, 6, 6);
        });
        c.globalAlpha = 1;

        c.fillStyle = 'rgba(0,0,0,.45)';
        U.roundRect(c, W / 2 - 130, 12, 260, 46, 12); c.fill();
        c.fillStyle = 'rgba(255,255,255,.6)';
        c.font = '600 12px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText('POP ONLY', W / 2, 30);
        c.fillStyle = COLORS[d.target].col;
        c.font = '800 22px Outfit, sans-serif';
        c.fillText(COLORS[d.target].name.toUpperCase(), W / 2, 52);

        if (d.combo > 2) {
          c.fillStyle = '#ffd257';
          c.font = '700 16px Outfit, sans-serif';
          c.fillText('STREAK ×' + d.combo, W / 2, 84);
        }
      }
    });

    function burst(d, x, y, col) {
      for (var i = 0; i < 14; i++) {
        var a = Math.random() * 6.28, s = U.rand(60, 240);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: .5, max: .5, col: col });
      }
    }
  }

  window.Milo.register({
    id: 'balloon-pop', title: 'Balloon Pop', emo: '🎈', category: 'Casual',
    tagline: 'Pop only the colour that’s called',
    description: 'Balloons drift up the screen in five colours, but only one colour counts ' +
      'at a time — and it changes every few pops, so you have to keep reading the banner ' +
      'rather than settling into a rhythm. Correct pops build a streak; wrong ones cost ' +
      'points and two seconds off the clock.',
    controls: ['Click', 'Tap'],
    colors: ['#0e1a34', '#ef4444'],
    tags: ['reflex', 'colour', 'timed', 'focus'],
    mount: mount
  });
})();
