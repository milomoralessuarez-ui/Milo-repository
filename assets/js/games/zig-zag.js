/* Zig Zag — one tap turns; stay on the winding path. */
(function () {
  'use strict';
  var W = 480, H = 700, TILE = 40;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.path = [{ x: 0, y: 0 }];
      d.dir = { x: 1, y: 0 };
      for (var i = 0; i < 60; i++) grow(d);
      d.ball = { x: 0, y: 0, dir: { x: 1, y: 0 } };
      d.t = 0;
      d.speed = 4.4;
      d.gems = [];
      d.parts = [];
      d.dead = false;
      d.tiles = 0;
      g.set('Score', 0);
      g.set('Gems', 0);
      g.set('Best', U.fmt(g.best));
      d.gemCount = 0;
    }

    function grow(d) {
      var last = d.path[d.path.length - 1];
      // Turn now and then; otherwise carry straight on.
      if (Math.random() < 0.34) d.dir = d.dir.x ? { x: 0, y: 1 } : { x: 1, y: 0 };
      var next = { x: last.x + d.dir.x, y: last.y + d.dir.y };
      d.path.push(next);
      if (Math.random() < 0.16) d.gems = (d.gems || []).concat([{ x: next.x, y: next.y, taken: false }]);
    }

    function onPath(d, x, y) {
      for (var i = 0; i < d.path.length; i++) {
        if (d.path[i].x === x && d.path[i].y === y) return true;
      }
      return false;
    }

    function turn(g) {
      var d = g.data;
      if (d.dead) return;
      d.ball.dir = d.ball.dir.x ? { x: 0, y: 1 } : { x: 1, y: 0 };
      Milo.sound.tone({ f: 620, f2: 760, d: .05, v: .05, type: 'square' });
    }

    return Milo.arcade(host, {
      id: 'zig-zag',
      w: W, h: H, bg: '#0a1026',
      stats: ['Score', 'Gems', 'Best'],
      touchButtons: [{ key: 'action', label: 'TURN' }],
      emo: '📐',
      start: {
        title: 'Zig Zag',
        text: 'The ball rolls along a narrow path that keeps turning. Tap to switch ' +
          'direction — one tap too late and you are off the edge.',
        keys: ['Click / Space / Tap']
      },
      init: reset,
      onPointer: function (g, type) { if (type === 'down') turn(g); },
      onKey: function (g, e) { if (e.code === 'Space') turn(g); },

      update: function (g, dt) {
        var d = g.data;
        if (g.input.pressed('action')) turn(g);
        if (d.dead) return;

        d.speed = 4.4 + d.tiles * 0.012;
        d.t += dt * d.speed;
        while (d.t >= 1) {
          d.t -= 1;
          d.ball.x += d.ball.dir.x;
          d.ball.y += d.ball.dir.y;
          d.tiles++;
          g.score = d.tiles + d.gemCount * 5;
          g.set('Score', g.score);

          if (!onPath(d, d.ball.x, d.ball.y)) {
            d.dead = true;
            Milo.sound.explode();
            for (var p = 0; p < 20; p++) {
              var a = Math.random() * 6.28, s = U.rand(40, 200);
              d.parts.push({ x: 0, y: 0, vx: Math.cos(a) * s, vy: Math.sin(a) * s + 60, life: .8, max: .8, col: '#22d3ee' });
            }
            g.gameOver({ text: d.tiles + ' tiles and ' + d.gemCount + ' gems.' });
            return;
          }

          d.gems.forEach(function (gm) {
            if (!gm.taken && gm.x === d.ball.x && gm.y === d.ball.y) {
              gm.taken = true;
              d.gemCount++;
              g.set('Gems', d.gemCount);
              Milo.sound.coin();
            }
          });

          // keep the path ahead stocked
          var last = d.path[d.path.length - 1];
          while (last.x + last.y < d.ball.x + d.ball.y + 60) { grow(d); last = d.path[d.path.length - 1]; }
        }

        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 400 * dt; p.life -= dt;
          return p.life > 0;
        });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#101a3c'); bg.addColorStop(1, '#05081a');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        // Isometric-ish view: x goes right-down, y goes left-down.
        var bx = d.ball.x + d.ball.dir.x * d.t;
        var by = d.ball.y + d.ball.dir.y * d.t;
        function proj(x, y) {
          return {
            x: W / 2 + (x - bx) * TILE * 0.86 - (y - by) * TILE * 0.86,
            y: H * 0.66 + (x - bx) * TILE * 0.5 + (y - by) * TILE * 0.5
          };
        }

        d.path.forEach(function (t) {
          var p = proj(t.x, t.y);
          if (p.x < -80 || p.x > W + 80 || p.y < -80 || p.y > H + 80) return;
          c.fillStyle = '#2b3a8a';
          c.beginPath();
          c.moveTo(p.x, p.y - TILE * .5);
          c.lineTo(p.x + TILE * .86, p.y);
          c.lineTo(p.x, p.y + TILE * .5);
          c.lineTo(p.x - TILE * .86, p.y);
          c.closePath(); c.fill();
          c.fillStyle = 'rgba(255,255,255,.06)';
          c.beginPath();
          c.moveTo(p.x, p.y - TILE * .5);
          c.lineTo(p.x + TILE * .86, p.y);
          c.lineTo(p.x, p.y);
          c.closePath(); c.fill();
        });

        d.gems.forEach(function (gm) {
          if (gm.taken) return;
          var p = proj(gm.x, gm.y);
          if (p.x < -40 || p.x > W + 40) return;
          c.fillStyle = '#ffd257';
          c.beginPath();
          c.moveTo(p.x, p.y - 22); c.lineTo(p.x + 10, p.y - 10);
          c.lineTo(p.x, p.y + 2); c.lineTo(p.x - 10, p.y - 10);
          c.closePath(); c.fill();
        });

        if (!d.dead) {
          c.shadowColor = '#22d3ee'; c.shadowBlur = 20;
          c.fillStyle = '#22d3ee';
          c.beginPath(); c.arc(W / 2, H * 0.66 - 14, 13, 0, 7); c.fill();
          c.shadowBlur = 0;
        }

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.fillRect(W / 2 + p.x - 3, H * 0.66 + p.y - 3, 6, 6);
        });
        c.globalAlpha = 1;
      }
    });
  }

  window.Milo.register({
    id: 'zig-zag', title: 'Zig Zag', emo: '📐', category: 'Casual',
    tagline: 'One tap to turn, don’t fall off',
    description: 'A ball rolls along a narrow zig-zagging path with nothing either side of ' +
      'it. Every tap switches your direction ninety degrees — the whole game is knowing ' +
      'exactly when. Gems along the way are worth five tiles each, and the roll speeds up ' +
      'the further you get.',
    controls: ['Click', 'Space', 'Tap'],
    colors: ['#0a1026', '#22d3ee'],
    tags: ['one tap', 'reflex', 'endless', 'hyper-casual'],
    mount: mount
  });
})();
