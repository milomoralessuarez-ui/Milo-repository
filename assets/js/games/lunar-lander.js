/* Lunar Lander — land gently on the pads with the fuel you have. */
(function () {
  'use strict';
  var W = 820, H = 600, G = 22;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.level = 1;
      d.landed = 0;
      startLevel(d);
      g.set('Score', 0);
      g.set('Fuel', 100);
      g.set('Level', 1);
    }

    function startLevel(d) {
      d.terrain = [];
      var y = H - 120;
      for (var x = 0; x <= W; x += 20) {
        y += U.rand(-24, 24);
        y = U.clamp(y, H - 260, H - 40);
        d.terrain.push({ x: x, y: y });
      }
      // Flatten a couple of stretches into landing pads.
      d.pads = [];
      var padCount = Math.max(1, 3 - Math.floor(d.level / 3));
      for (var p = 0; p < padCount; p++) {
        var i = U.randInt(3, d.terrain.length - 6);
        var py = d.terrain[i].y;
        var wide = Math.max(2, 4 - Math.floor(d.level / 2));
        for (var k = 0; k < wide; k++) {
          if (d.terrain[i + k]) d.terrain[i + k].y = py;
        }
        d.pads.push({ x0: d.terrain[i].x, x1: d.terrain[i].x + wide * 20, y: py, mult: wide <= 2 ? 3 : 1 });
      }
      d.ship = { x: U.rand(80, W - 80), y: 60, vx: U.rand(-24, 24), vy: 10, a: 0, alive: true };
      d.fuel = 100;
      d.parts = [];
      d.msg = '';
      d.resultT = 0;
    }

    function groundAt(d, x) {
      for (var i = 0; i < d.terrain.length - 1; i++) {
        var a = d.terrain[i], b = d.terrain[i + 1];
        if (x >= a.x && x <= b.x) {
          var t = (x - a.x) / (b.x - a.x);
          return a.y + (b.y - a.y) * t;
        }
      }
      return H;
    }

    function boom(d, x, y) {
      for (var i = 0; i < 30; i++) {
        var a = Math.random() * 6.28, s = U.rand(40, 260);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(.4, 1), max: 1, col: U.choice(['#fff', '#ffb020', '#fb7185']) });
      }
    }

    return Milo.arcade(host, {
      id: 'lunar-lander',
      w: W, h: H, bg: '#05060f',
      stats: ['Score', 'Fuel', 'Level'],
      touch: 'dpad',
      emo: '🌙',
      start: {
        title: 'Lunar Lander',
        text: 'Land on a flat pad, upright, slowly. Thrust burns fuel and gravity never ' +
          'stops. Narrow pads are worth triple.',
        keys: ['↑ thrust', '← → rotate']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, i = g.input, s = d.ship;
        if (d.resultT > 0) {
          d.resultT -= dt;
          if (d.resultT <= 0) {
            if (s.alive) { d.level++; g.set('Level', d.level); startLevel(d); g.set('Fuel', 100); }
            else g.gameOver({ text: 'You landed ' + d.landed + ' time' + (d.landed === 1 ? '' : 's') + '.' });
          }
          return;
        }
        if (!s.alive) return;

        if (i.down('left')) s.a -= 2.2 * dt;
        if (i.down('right')) s.a += 2.2 * dt;
        s.thrust = (i.down('up') || i.down('action')) && d.fuel > 0;
        if (s.thrust) {
          s.vx += Math.sin(s.a) * 46 * dt;
          s.vy -= Math.cos(s.a) * 46 * dt;
          d.fuel = Math.max(0, d.fuel - 16 * dt);
          g.set('Fuel', Math.round(d.fuel));
          if (g.frame % 2 === 0) {
            d.parts.push({
              x: s.x - Math.sin(s.a) * 14, y: s.y + Math.cos(s.a) * 14,
              vx: -Math.sin(s.a) * 90 + U.rand(-25, 25), vy: Math.cos(s.a) * 90 + U.rand(-25, 25),
              life: .35, max: .35, col: U.choice(['#ffb020', '#ff7a45'])
            });
          }
        }

        s.vy += G * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (s.x < 0) s.x = W; if (s.x > W) s.x = 0;

        var gy = groundAt(d, s.x);
        if (s.y + 14 >= gy) {
          var pad = d.pads.filter(function (p) { return s.x > p.x0 && s.x < p.x1; })[0];
          var gentle = Math.abs(s.vy) < 42 && Math.abs(s.vx) < 26;
          var upright = Math.abs(((s.a + Math.PI) % (Math.PI * 2)) - Math.PI) < 0.28;
          if (pad && gentle && upright) {
            s.alive = true;
            d.landed++;
            var pts = 500 * pad.mult + Math.round(d.fuel) * 8;
            g.score += pts;
            g.set('Score', U.fmt(g.score));
            d.msg = 'Touchdown! +' + U.fmt(pts);
            Milo.sound.win();
          } else {
            s.alive = false;
            d.msg = !pad ? 'Crashed — not on a pad'
              : !upright ? 'Crashed — you were tilted'
                : 'Crashed — coming in too fast';
            boom(d, s.x, s.y);
            Milo.sound.explode();
          }
          d.resultT = 1.8;
        }

        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
          return p.life > 0;
        });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, s = d.ship;
        c.fillStyle = '#05060f'; c.fillRect(0, 0, W, H);
        for (var st = 0; st < 70; st++) {
          c.fillStyle = 'rgba(210,220,255,' + (0.3 + U.hash2(st, 3, 7) * 0.6) + ')';
          c.fillRect(U.hash2(st, 1, 7) * W, U.hash2(st, 2, 7) * H * .7, 1.6, 1.6);
        }

        c.fillStyle = '#2a2f4a';
        c.beginPath();
        c.moveTo(0, H);
        d.terrain.forEach(function (p) { c.lineTo(p.x, p.y); });
        c.lineTo(W, H);
        c.closePath(); c.fill();
        c.strokeStyle = '#8b93bd'; c.lineWidth = 2;
        c.beginPath();
        d.terrain.forEach(function (p, i) { i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y); });
        c.stroke();

        d.pads.forEach(function (p) {
          c.strokeStyle = p.mult > 1 ? '#ffd257' : '#34d399';
          c.lineWidth = 5;
          c.beginPath(); c.moveTo(p.x0, p.y); c.lineTo(p.x1, p.y); c.stroke();
          c.fillStyle = p.mult > 1 ? '#ffd257' : '#34d399';
          c.font = '700 11px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(p.mult + '×', (p.x0 + p.x1) / 2, p.y - 10);
        });

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - 2, p.y - 2, 4, 4);
        });
        c.globalAlpha = 1;

        if (s.alive || d.resultT > 0) {
          c.save();
          c.translate(s.x, s.y);
          c.rotate(s.a);
          c.fillStyle = '#e8ecff';
          c.beginPath();
          c.moveTo(0, -16); c.lineTo(11, 6); c.lineTo(-11, 6);
          c.closePath(); c.fill();
          c.strokeStyle = '#8b93bd'; c.lineWidth = 2.5;
          c.beginPath();
          c.moveTo(-8, 6); c.lineTo(-13, 16);
          c.moveTo(8, 6); c.lineTo(13, 16);
          c.stroke();
          c.restore();
        }

        // instruments
        var vy = Math.abs(s.vy), vx = Math.abs(s.vx);
        c.font = '600 12px Outfit, sans-serif';
        c.textAlign = 'left';
        c.fillStyle = vy < 42 ? '#34d399' : '#fb7185';
        c.fillText('descent ' + vy.toFixed(0), 16, H - 40);
        c.fillStyle = vx < 26 ? '#34d399' : '#fb7185';
        c.fillText('drift ' + vx.toFixed(0), 16, H - 22);

        if (d.msg) {
          c.fillStyle = s.alive ? '#34d399' : '#fb7185';
          c.font = '800 24px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(d.msg, W / 2, 70);
        }
      }
    });
  }

  window.Milo.register({
    id: 'lunar-lander', title: 'Lunar Lander', emo: '🌙', category: 'Arcade',
    tagline: 'Down slowly, upright, on the pad',
    description: 'Gravity is constant and your thruster burns fuel you cannot replace. To ' +
      'land you need all three at once: on a flat pad, close to upright, and slow — the ' +
      'descent and drift readouts turn green when each is safe. Narrow pads pay triple, and ' +
      'leftover fuel is worth points, so the greedy landing is also the risky one.',
    controls: ['↑ thrust', '← → rotate'],
    colors: ['#05060f', '#8b93bd'],
    tags: ['classic', 'physics', 'precision', 'space'],
    mount: mount
  });
})();
