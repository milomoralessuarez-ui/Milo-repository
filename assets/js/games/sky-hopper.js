/* Sky Hopper — bounce endlessly up a tower of platforms. */
(function () {
  'use strict';
  var W = 480, H = 720;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.p = { x: W / 2, y: H - 140, vx: 0, vy: -700, r: 17 };
      d.plats = [];
      d.height = 0;
      d.camY = 0;
      d.parts = [];
      d.clouds = [];
      for (var i = 0; i < 8; i++) {
        d.clouds.push({ x: Math.random() * W, y: Math.random() * H, s: U.rand(.5, 1.3) });
      }
      // A wide starting platform, then a climbing ladder of them.
      d.plats.push({ x: W / 2 - 60, y: H - 90, w: 120, kind: 'solid', t: 0 });
      var y = H - 190;
      while (y > -600) {
        addPlat(d, y);
        y -= U.rand(66, 96);
      }
      g.set('Height', 0);
      g.set('Best', U.fmt(g.best));
    }

    function addPlat(d, y) {
      var r = Math.random();
      var kind = 'solid';
      var diff = Math.min(1, d.height / 4000);
      if (r < .13 + diff * .16) kind = 'moving';
      else if (r < .20 + diff * .22) kind = 'crumble';
      else if (r < .24 + diff * .06) kind = 'spring';
      var w = U.rand(62, 96) - diff * 16;
      d.plats.push({
        x: U.rand(6, W - w - 6), y: y, w: w, kind: kind, t: Math.random() * 6,
        dir: Math.random() < .5 ? -1 : 1, gone: false
      });
    }

    return Milo.arcade(host, {
      id: 'sky-hopper',
      w: W, h: H, bg: '#0a1030',
      stats: ['Height', 'Best'],
      touch: 'dpad',
      emo: '🦘',
      start: {
        title: 'Sky Hopper',
        text: 'Bounce your way up. Green pads launch you higher, orange ones ' +
          'crumble the moment you leave them. Falling off the bottom ends it.',
        keys: ['← →  or  A D', 'Tilt your aim, gravity does the rest']
      },
      init: reset,
      onPointer: function (g, type, x) {
        // Touch/mouse steering: the pointer's side of centre sets the lean.
        g.data.lean = x < W / 2 ? -1 : 1;
        if (type === 'up') g.data.lean = 0;
      },

      update: function (g, dt) {
        var d = g.data, p = d.p, i = g.input;

        var lean = (i.down('right') ? 1 : 0) - (i.down('left') ? 1 : 0);
        if (!lean && d.lean) lean = d.lean;
        p.vx += lean * 1700 * dt;
        p.vx *= Math.pow(0.0016, dt);
        p.vx = U.clamp(p.vx, -420, 420);

        p.vy += 1500 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // wrap horizontally
        if (p.x < -p.r) p.x = W + p.r;
        if (p.x > W + p.r) p.x = -p.r;

        // camera follows only upward
        var target = p.y - H * 0.42;
        if (target < d.camY) d.camY = target;
        var h = Math.max(0, Math.floor((H - 140 - p.y) / 10));
        if (h > d.height) {
          d.height = h;
          g.score = h;
          g.set('Height', U.fmt(h));
        }

        d.plats.forEach(function (pl) {
          pl.t += dt;
          if (pl.kind === 'moving') {
            pl.x += pl.dir * 92 * dt;
            if (pl.x < 4) { pl.x = 4; pl.dir = 1; }
            if (pl.x + pl.w > W - 4) { pl.x = W - 4 - pl.w; pl.dir = -1; }
          }
          if (pl.fading != null) pl.fading -= dt;
        });

        // Land only while falling, and only from above the pad.
        if (p.vy > 0) {
          for (var k = 0; k < d.plats.length; k++) {
            var pl = d.plats[k];
            if (pl.gone) continue;
            var top = pl.y;
            if (p.y + p.r >= top && p.y + p.r <= top + 22 &&
              p.x > pl.x - p.r * .6 && p.x < pl.x + pl.w + p.r * .6) {
              if (pl.kind === 'spring') {
                p.vy = -1180;
                Milo.sound.tone({ f: 300, f2: 1100, d: .2, v: .1, type: 'square' });
              } else {
                p.vy = -740;
                Milo.sound.tone({ f: 520, f2: 700, d: .06, v: .06, type: 'triangle' });
              }
              puff(d, p.x, top);
              if (pl.kind === 'crumble') { pl.gone = true; pl.fading = .35; }
              break;
            }
          }
        }

        // Recycle platforms that scrolled off the bottom.
        var lowest = 1e9;
        d.plats = d.plats.filter(function (pl) {
          if (pl.fading != null && pl.fading <= 0) return false;
          return pl.y < d.camY + H + 120;
        });
        d.plats.forEach(function (pl) { lowest = Math.min(lowest, pl.y); });
        while (lowest > d.camY - 420) {
          lowest -= U.rand(66, 96);
          addPlat(d, lowest);
        }

        d.parts = d.parts.filter(function (q) {
          q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 600 * dt; q.life -= dt;
          return q.life > 0;
        });

        if (p.y - d.camY > H + 80) {
          Milo.sound.lose();
          g.gameOver({ text: 'You climbed ' + U.fmt(d.height) + ' metres.' });
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var sky = c.createLinearGradient(0, 0, 0, H);
        var deep = U.clamp(d.height / 3000, 0, 1);
        sky.addColorStop(0, 'hsl(' + (232 - deep * 30) + ',60%,' + (16 + deep * 6) + '%)');
        sky.addColorStop(1, 'hsl(' + (250 - deep * 20) + ',55%,' + (8 + deep * 4) + '%)');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);

        c.save();
        c.translate(0, -d.camY);

        d.clouds.forEach(function (cl) {
          var y = ((cl.y - d.camY * .25) % (H + 200)) - 100 + d.camY;
          c.globalAlpha = .09;
          c.fillStyle = '#dfe8ff';
          c.beginPath(); c.ellipse(cl.x, y, 60 * cl.s, 22 * cl.s, 0, 0, 7); c.fill();
        });
        c.globalAlpha = 1;

        d.plats.forEach(function (pl) {
          var col = pl.kind === 'spring' ? '#34d399'
            : pl.kind === 'crumble' ? '#f59e0b'
              : pl.kind === 'moving' ? '#22d3ee' : '#7c5cff';
          c.globalAlpha = pl.fading != null ? Math.max(0, pl.fading / .35) : 1;
          c.shadowColor = col; c.shadowBlur = 12;
          c.fillStyle = col;
          U.roundRect(c, pl.x, pl.y, pl.w, 13, 6.5); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = 'rgba(255,255,255,.28)';
          U.roundRect(c, pl.x + 3, pl.y + 2.5, pl.w - 6, 4, 2); c.fill();
          if (pl.kind === 'spring') {
            c.fillStyle = '#062d1e';
            c.font = '800 10px Outfit, sans-serif'; c.textAlign = 'center';
            c.fillText('▲▲', pl.x + pl.w / 2, pl.y + 10);
          }
          c.globalAlpha = 1;
        });

        d.parts.forEach(function (q) {
          c.globalAlpha = Math.max(0, q.life / q.max);
          c.fillStyle = q.col;
          c.beginPath(); c.arc(q.x, q.y, 3, 0, 7); c.fill();
        });
        c.globalAlpha = 1;

        var p = d.p;
        var squash = U.clamp(1 + p.vy / 2600, .78, 1.22);
        c.save();
        c.translate(p.x, p.y);
        c.scale(1 / squash, squash);
        c.shadowColor = '#ffd257'; c.shadowBlur = 20;
        c.fillStyle = '#ffd257';
        c.beginPath(); c.arc(0, 0, p.r, 0, 7); c.fill();
        c.shadowBlur = 0;
        c.fillStyle = '#3a2a05';
        c.beginPath();
        c.arc(-5.5, -3, 2.6, 0, 7);
        c.arc(5.5, -3, 2.6, 0, 7);
        c.fill();
        c.strokeStyle = '#3a2a05'; c.lineWidth = 1.8; c.lineCap = 'round';
        c.beginPath(); c.arc(0, 2, 6, .25, Math.PI - .25); c.stroke();
        c.restore();
        c.restore();
      }
    });

    function puff(d, x, y) {
      for (var i = 0; i < 8; i++) {
        var a = Math.random() * 3.14 + 3.14;
        d.parts.push({
          x: x, y: y, vx: Math.cos(a) * U.rand(30, 120), vy: Math.sin(a) * U.rand(20, 70),
          life: .35, max: .35, col: '#cfe0ff'
        });
      }
    }
  }

  window.Milo.register({
    id: 'sky-hopper', title: 'Sky Hopper', emo: '🦘', category: 'Arcade',
    tagline: 'Bounce up an endless tower',
    description: 'Every platform bounces you back up — you only have to steer. Green ' +
      'springs launch you much higher, cyan pads slide side to side, and orange pads ' +
      'crumble the instant you leave them. Fall off the bottom of the screen and it’s over.',
    controls: ['← →', 'A D', 'Touch left/right'],
    colors: ['#38bdf8', '#a78bfa'],
    tags: ['jumping', 'endless', 'reflex', 'high score'],
    mount: mount
  });
})();
