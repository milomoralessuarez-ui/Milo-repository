/* Lava Run — the floor is rising; keep climbing. */
(function () {
  'use strict';
  var W = 560, H = 700;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.p = { x: W / 2, y: H - 160, vx: 0, vy: 0, onGround: false, face: 1, coyote: 0 };
      d.plats = [{ x: W / 2 - 90, y: H - 120, w: 180, kind: 'solid' }];
      var y = H - 220;
      while (y > -400) { addPlat(d, y); y -= U.rand(74, 104); }
      d.lava = H + 60;
      d.camY = 0;
      d.height = 0;
      d.gems = 0;
      d.parts = [];
      g.set('Height', 0);
      g.set('Gems', 0);
      g.set('Best', U.fmt(g.best));
    }

    function addPlat(d, y) {
      var r = Math.random();
      var kind = r < .12 ? 'crumble' : r < .22 ? 'moving' : r < .28 ? 'bounce' : 'solid';
      var w = U.rand(80, 150);
      d.plats.push({
        x: U.rand(10, W - w - 10), y: y, w: w, kind: kind,
        dir: Math.random() < .5 ? -1 : 1, t: 0, gone: false,
        gem: Math.random() < .18
      });
    }

    return Milo.arcade(host, {
      id: 'lava-run',
      w: W, h: H, bg: '#1a0a08',
      stats: ['Height', 'Gems', 'Best'],
      touch: 'dpad',
      touchButtons: [{ key: 'action', label: 'JUMP' }],
      emo: '🌋',
      start: {
        title: 'Lava Run',
        text: 'The lava is rising and it never stops. Jump from ledge to ledge and keep ' +
          'climbing — orange ledges crumble, green ones launch you.',
        keys: ['← → move', 'Space / ↑ jump']
      },
      init: reset,

      onKey: function (g, e) {
        var d = g.data;
        if ((e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') && d.p.coyote > 0) {
          d.p.vy = -560;
          d.p.coyote = 0;
          Milo.sound.jump();
        }
      },

      update: function (g, dt) {
        var d = g.data, p = d.p, i = g.input;

        var move = (i.down('right') ? 1 : 0) - (i.down('left') ? 1 : 0);
        if (move) p.face = move;
        p.vx += (move * 240 - p.vx) * Math.min(1, dt * 14);
        p.vy += 1400 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < 12) { p.x = 12; p.vx = 0; }
        if (p.x > W - 12) { p.x = W - 12; p.vx = 0; }

        p.coyote = Math.max(0, p.coyote - dt);
        if ((i.down('action') || i.down('up')) && p.coyote > 0) {
          p.vy = -560;
          p.coyote = 0;
          Milo.sound.jump();
        }

        d.plats.forEach(function (pl) {
          pl.t += dt;
          if (pl.kind === 'moving') {
            pl.x += pl.dir * 70 * dt;
            if (pl.x < 6) { pl.x = 6; pl.dir = 1; }
            if (pl.x + pl.w > W - 6) { pl.x = W - 6 - pl.w; pl.dir = -1; }
          }
          if (pl.fading != null) pl.fading -= dt;
        });

        if (p.vy > 0) {
          for (var k = 0; k < d.plats.length; k++) {
            var pl = d.plats[k];
            if (pl.gone) continue;
            if (p.y < pl.y || p.y > pl.y + 24) continue;
            if (p.x < pl.x - 8 || p.x > pl.x + pl.w + 8) continue;
            p.y = pl.y;
            p.vy = pl.kind === 'bounce' ? -880 : 0;
            p.coyote = 0.12;
            if (pl.kind === 'bounce') Milo.sound.tone({ f: 300, f2: 1000, d: .18, v: .08, type: 'square' });
            else Milo.sound.tone({ f: 420, d: .05, v: .04, type: 'triangle' });
            if (pl.kind === 'crumble') { pl.gone = true; pl.fading = .3; }
            if (pl.gem) {
              pl.gem = false;
              d.gems++;
              g.set('Gems', d.gems);
              Milo.sound.coin();
            }
            break;
          }
        }

        var target = p.y - H * 0.55;
        if (target < d.camY) d.camY = target;
        var h = Math.max(0, Math.floor((H - 120 - p.y) / 10));
        if (h > d.height) {
          d.height = h;
          g.score = h + d.gems * 20;
          g.set('Height', U.fmt(h));
        }

        // Lava chases you and speeds up as you climb.
        var lavaSpeed = 55 + d.height * 0.13;
        d.lava -= lavaSpeed * dt;
        d.lava = Math.min(d.lava, d.camY + H + 220);

        d.plats = d.plats.filter(function (pl) {
          if (pl.fading != null && pl.fading <= 0) return false;
          return pl.y < d.camY + H + 200;
        });
        var lowest = Math.min.apply(null, d.plats.map(function (q) { return q.y; }));
        while (lowest > d.camY - 500) { lowest -= U.rand(74, 104); addPlat(d, lowest); }

        d.parts = d.parts.filter(function (q) {
          q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 500 * dt; q.life -= dt;
          return q.life > 0;
        });
        if (g.frame % 4 === 0) {
          d.parts.push({
            x: U.rand(0, W), y: d.lava, vx: U.rand(-20, 20), vy: U.rand(-120, -50),
            life: .8, max: .8, col: U.choice(['#f97316', '#facc15', '#ef4444'])
          });
        }

        if (p.y > d.lava - 10) {
          Milo.sound.explode();
          g.gameOver({ text: 'Caught by the lava at ' + U.fmt(d.height) + ' metres.' });
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var t = U.clamp(d.height / 2500, 0, 1);
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, 'hsl(' + (18 - t * 12) + ',45%,' + (14 - t * 6) + '%)');
        bg.addColorStop(1, 'hsl(12,55%,' + (7 - t * 3) + '%)');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        c.save();
        c.translate(0, -d.camY);

        d.plats.forEach(function (pl) {
          var col = pl.kind === 'bounce' ? '#34d399'
            : pl.kind === 'crumble' ? '#f59e0b'
              : pl.kind === 'moving' ? '#38bdf8' : '#8b7355';
          c.globalAlpha = pl.fading != null ? Math.max(0, pl.fading / .3) : 1;
          c.fillStyle = col;
          U.roundRect(c, pl.x, pl.y, pl.w, 14, 6); c.fill();
          c.fillStyle = 'rgba(255,255,255,.22)';
          U.roundRect(c, pl.x + 4, pl.y + 3, pl.w - 8, 4, 2); c.fill();
          if (pl.gem) {
            c.fillStyle = '#ffd257';
            c.beginPath();
            var gx = pl.x + pl.w / 2, gy = pl.y - 16;
            c.moveTo(gx, gy - 9); c.lineTo(gx + 7, gy); c.lineTo(gx, gy + 9); c.lineTo(gx - 7, gy);
            c.closePath(); c.fill();
          }
          c.globalAlpha = 1;
        });

        d.parts.forEach(function (q) {
          c.globalAlpha = Math.max(0, q.life / q.max);
          c.fillStyle = q.col;
          c.beginPath(); c.arc(q.x, q.y, 3.5, 0, 7); c.fill();
        });
        c.globalAlpha = 1;

        var p = d.p;
        c.fillStyle = '#22d3ee';
        U.roundRect(c, p.x - 11, p.y - 30, 22, 30, 7); c.fill();
        c.fillStyle = '#e9f4ff';
        c.beginPath(); c.arc(p.x, p.y - 24, 6.5, 0, 7); c.fill();
        c.fillStyle = '#0d2740';
        c.fillRect(p.x - 3 + p.face * 2, p.y - 26, 2.5, 3);
        c.fillRect(p.x + 1 + p.face * 2, p.y - 26, 2.5, 3);

        // lava
        var lg = c.createLinearGradient(0, d.lava - 30, 0, d.lava + 200);
        lg.addColorStop(0, '#facc15');
        lg.addColorStop(.25, '#f97316');
        lg.addColorStop(1, '#7f1d1d');
        c.fillStyle = lg;
        c.beginPath();
        c.moveTo(0, d.lava + 200);
        for (var x = 0; x <= W; x += 20) {
          c.lineTo(x, d.lava + Math.sin(x * .05 + Date.now() * .004) * 6);
        }
        c.lineTo(W, d.lava + 200);
        c.closePath(); c.fill();
        c.restore();
      }
    });
  }

  window.Milo.register({
    id: 'lava-run', title: 'Lava Run', emo: '🌋', category: 'Action',
    tagline: 'Climb — the lava never stops',
    description: 'A vertical scramble with a rising tide of lava underneath that gets ' +
      'faster the higher you climb. Brown ledges are solid, blue ones slide sideways, orange ' +
      'ones crumble the moment you leave them, and green ones fling you well above a normal ' +
      'jump. Gems on the ledges are worth twenty metres each.',
    controls: ['← → move', 'Space / ↑ jump'],
    colors: ['#1a0a08', '#f97316'],
    tags: ['platformer', 'climbing', 'endless', 'action'],
    mount: mount
  });
})();
