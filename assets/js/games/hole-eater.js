/* Hole Eater — swallow the town, one lamppost at a time. */
(function () {
  'use strict';
  var W = 900, H = 620, TIME = 90;
  var THINGS = [
    { emo: '🌳', r: 14, size: 1, pts: 10 }, { emo: '🚏', r: 12, size: 1, pts: 10 },
    { emo: '🧍', r: 10, size: 1, pts: 15 }, { emo: '🚗', r: 20, size: 2, pts: 40 },
    { emo: '🏍️', r: 15, size: 2, pts: 30 }, { emo: '🚌', r: 28, size: 3, pts: 90 },
    { emo: '🏠', r: 34, size: 4, pts: 180 }, { emo: '🏢', r: 44, size: 5, pts: 400 }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.hole = { x: W / 2, y: H / 2, r: 22 };
      d.items = [];
      for (var i = 0; i < 130; i++) {
        d.items.push({
          x: U.rand(30, W - 30), y: U.rand(30, H - 30),
          kind: THINGS[U.randInt(0, THINGS.length - 1)], gone: false, wob: 0
        });
      }
      d.time = TIME;
      d.eaten = 0;
      d.falling = [];
      g.set('Score', 0);
      g.set('Time', TIME);
      g.set('Size', 1);
    }

    /** What the hole can swallow, derived from its radius. */
    function tier(r) { return Math.min(5, Math.floor((r - 22) / 13) + 1); }

    return Milo.arcade(host, {
      id: 'hole-eater',
      w: W, h: H, bg: '#1d2a1a',
      stats: ['Score', 'Time', 'Size'],
      touch: 'dpad',
      emo: '🕳️',
      start: {
        title: 'Hole Eater',
        text: 'Move the hole around and swallow anything smaller than it. Every mouthful ' +
          'widens the hole, until whole buildings start to fit. Ninety seconds.',
        keys: ['Move the mouse', 'Arrow keys / WASD']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, i = g.input;
        var speed = 260 - Math.min(120, d.hole.r);

        if (i.px || i.py) {
          var dist = U.dist(i.px, i.py, d.hole.x, d.hole.y);
          if (dist > 8) {
            var a = Math.atan2(i.py - d.hole.y, i.px - d.hole.x);
            d.hole.x += Math.cos(a) * speed * dt;
            d.hole.y += Math.sin(a) * speed * dt;
          }
        }
        if (i.down('left')) d.hole.x -= speed * dt;
        if (i.down('right')) d.hole.x += speed * dt;
        if (i.down('up')) d.hole.y -= speed * dt;
        if (i.down('down')) d.hole.y += speed * dt;
        d.hole.x = U.clamp(d.hole.x, d.hole.r, W - d.hole.r);
        d.hole.y = U.clamp(d.hole.y, d.hole.r, H - d.hole.r);

        d.time -= dt;
        g.set('Time', Math.max(0, Math.ceil(d.time)));
        if (d.time <= 0) {
          g.gameOver({
            emo: '🕳️', title: 'Time!',
            text: d.eaten + ' things swallowed. Final size ' + tier(d.hole.r) + '.'
          });
          return;
        }

        var can = tier(d.hole.r);
        d.items.forEach(function (it) {
          if (it.gone) return;
          var dist = U.dist(it.x, it.y, d.hole.x, d.hole.y);
          if (dist > d.hole.r + it.kind.r) return;
          if (it.kind.size > can) { it.wob = 0.3; return; }
          if (dist < d.hole.r) {
            it.gone = true;
            d.eaten++;
            g.score += it.kind.pts;
            g.set('Score', U.fmt(g.score));
            d.hole.r += 0.5 + it.kind.size * 0.6;
            g.set('Size', tier(d.hole.r));
            d.falling.push({ x: it.x, y: it.y, emo: it.kind.emo, t: .5, r: it.kind.r });
            Milo.sound.tone({ f: 260 - it.kind.size * 20, f2: 90, d: .12, v: .05, type: 'sine' });
          } else {
            // Drag it toward the rim before it drops in.
            var a2 = Math.atan2(d.hole.y - it.y, d.hole.x - it.x);
            it.x += Math.cos(a2) * 120 * dt;
            it.y += Math.sin(a2) * 120 * dt;
          }
        });

        d.items.forEach(function (it) { it.wob = Math.max(0, it.wob - dt); });
        d.falling = d.falling.filter(function (f) { f.t -= dt; return f.t > 0; });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.fillStyle = '#2b3d24'; c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(0,0,0,.10)';
        for (var s = 0; s < 30; s++) {
          c.fillRect(U.hash2(s, 1, 4) * W, U.hash2(s, 2, 4) * H, 60, 22);
        }

        var can = tier(d.hole.r);
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        d.items.forEach(function (it) {
          if (it.gone) return;
          var wob = it.wob > 0 ? Math.sin(it.wob * 60) * 3 : 0;
          c.globalAlpha = it.kind.size > can ? .55 : 1;
          c.font = (it.kind.r * 2) + 'px serif';
          c.fillText(it.kind.emo, it.x + wob, it.y);
          c.globalAlpha = 1;
        });

        var grd = c.createRadialGradient(d.hole.x, d.hole.y, d.hole.r * .3, d.hole.x, d.hole.y, d.hole.r);
        grd.addColorStop(0, '#000');
        grd.addColorStop(.82, '#050505');
        grd.addColorStop(1, 'rgba(0,0,0,.6)');
        c.fillStyle = grd;
        c.beginPath(); c.arc(d.hole.x, d.hole.y, d.hole.r, 0, 7); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.16)'; c.lineWidth = 2;
        c.beginPath(); c.arc(d.hole.x, d.hole.y, d.hole.r, 0, 7); c.stroke();

        d.falling.forEach(function (f) {
          c.globalAlpha = f.t / .5;
          c.font = (f.r * 2 * (f.t / .5)) + 'px serif';
          c.fillText(f.emo, f.x, f.y);
          c.globalAlpha = 1;
        });
        c.textBaseline = 'alphabetic';

        c.fillStyle = 'rgba(255,255,255,.5)';
        c.font = '600 12px Outfit, sans-serif';
        c.fillText('Faded things are still too big for you', W / 2, H - 12);
      }
    });
  }

  window.Milo.register({
    id: 'hole-eater', title: 'Hole Eater', emo: '🕳️', category: 'Action',
    tagline: 'Swallow the town and grow',
    description: 'You are a hole in the ground. Move around and anything small enough ' +
      'falls in — trees and people first, then cars, then buses, then whole buildings as ' +
      'you widen. Objects still too big for you are drawn faded and just rattle at the rim. ' +
      'Ninety seconds to eat as much of the town as you can.',
    controls: ['Move the mouse', 'WASD', 'Touch pad'],
    colors: ['#2b3d24', '#0b0b0b'],
    tags: ['io-style', 'growth', 'timed', 'action'],
    mount: mount
  });
})();
