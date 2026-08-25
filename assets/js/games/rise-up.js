/* Rise Up — shield the balloon from everything falling toward it. */
(function () {
  'use strict';
  var W = 480, H = 700;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.balloon = { x: W / 2, y: H - 140, r: 26 };
      d.shield = { x: W / 2, y: H - 240, r: 46 };
      d.obs = [];
      d.parts = [];
      d.height = 0;
      d.speed = 90;
      d.spawn = 0;
      g.set('Height', 0);
      g.set('Speed', 0);
      g.set('Best', U.fmt(g.best));
    }

    return Milo.arcade(host, {
      id: 'rise-up',
      w: W, h: H, bg: '#0b1330',
      stats: ['Height', 'Speed', 'Best'],
      emo: '🎈',
      start: {
        title: 'Rise Up',
        text: 'The balloon rises on its own. Move your shield to push the falling ' +
          'obstacles out of its way — one touch and it pops.',
        keys: ['Move the mouse', 'Or drag on touch']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        var d = g.data;
        d.shield.x = U.clamp(x, 40, W - 40);
        d.shield.y = U.clamp(y, 120, H - 90);
      },

      update: function (g, dt) {
        var d = g.data;
        var i = g.input;
        if (i.down('left')) d.shield.x -= 360 * dt;
        if (i.down('right')) d.shield.x += 360 * dt;
        if (i.down('up')) d.shield.y -= 320 * dt;
        if (i.down('down')) d.shield.y += 320 * dt;
        d.shield.x = U.clamp(d.shield.x, 40, W - 40);
        d.shield.y = U.clamp(d.shield.y, 120, H - 90);

        d.speed = 90 + d.height * 0.35;
        d.height += d.speed * dt * 0.05;
        g.score = Math.floor(d.height);
        g.set('Height', g.score);
        g.set('Speed', Math.round(d.speed));

        d.spawn -= dt;
        if (d.spawn <= 0) {
          d.spawn = U.rand(0.5, 1.2) * (90 / d.speed) + 0.18;
          var kind = Math.random();
          if (kind < .6) {
            d.obs.push({ kind: 'bar', x: U.rand(60, W - 60), y: -40, w: U.rand(60, 150), h: 18, vx: U.rand(-40, 40), spin: U.rand(-1, 1), a: 0 });
          } else if (kind < .85) {
            d.obs.push({ kind: 'ball', x: U.rand(40, W - 40), y: -40, r: U.rand(14, 26), vx: U.rand(-60, 60) });
          } else {
            d.obs.push({ kind: 'spike', x: U.rand(50, W - 50), y: -40, r: 20, vx: U.rand(-30, 30) });
          }
        }

        for (var k = d.obs.length - 1; k >= 0; k--) {
          var o = d.obs[k];
          o.y += d.speed * dt;
          o.x += (o.vx || 0) * dt;
          if (o.a != null) o.a += (o.spin || 0) * dt;
          if (o.x < 30 || o.x > W - 30) o.vx *= -1;

          // The shield shoves things aside rather than destroying them.
          var dist = U.dist(o.x, o.y, d.shield.x, d.shield.y);
          var reach = d.shield.r + (o.r || o.w / 2);
          if (dist < reach && dist > 0.01) {
            var push = (reach - dist);
            o.x += (o.x - d.shield.x) / dist * push;
            o.y += (o.y - d.shield.y) / dist * push;
            o.vx += (o.x - d.shield.x) / dist * 40;
          }

          if (o.y > H + 60) { d.obs.splice(k, 1); continue; }

          var br = d.balloon.r + (o.kind === 'bar' ? 10 : o.r);
          var hit = o.kind === 'bar'
            ? (Math.abs(o.x - d.balloon.x) < o.w / 2 + d.balloon.r && Math.abs(o.y - d.balloon.y) < 16 + d.balloon.r)
            : U.dist(o.x, o.y, d.balloon.x, d.balloon.y) < br;
          if (hit) {
            Milo.sound.explode();
            for (var p = 0; p < 22; p++) {
              var a = Math.random() * 6.28, s = U.rand(50, 240);
              d.parts.push({ x: d.balloon.x, y: d.balloon.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: .6, max: .6, col: '#fb7185' });
            }
            g.gameOver({ text: 'Reached a height of ' + g.score + '.' });
            return;
          }
        }

        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
          return p.life > 0;
        });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var t = U.clamp(d.height / 900, 0, 1);
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, 'hsl(' + (225 - t * 20) + ',' + (55 - t * 35) + '%,' + (22 - t * 16) + '%)');
        bg.addColorStop(1, 'hsl(230,45%,' + (10 - t * 6) + '%)');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        for (var s = 0; s < 40; s++) {
          c.globalAlpha = t * .8;
          c.fillStyle = '#fff';
          c.fillRect(U.hash2(s, 1, 4) * W, ((U.hash2(s, 2, 4) * H) + d.height * 2) % H, 1.6, 1.6);
        }
        c.globalAlpha = 1;

        d.obs.forEach(function (o) {
          if (o.kind === 'bar') {
            c.save();
            c.translate(o.x, o.y);
            c.rotate(o.a);
            c.fillStyle = '#8b93bd';
            U.roundRect(c, -o.w / 2, -o.h / 2, o.w, o.h, 8); c.fill();
            c.restore();
          } else if (o.kind === 'spike') {
            c.fillStyle = '#e5484d';
            c.beginPath();
            for (var i = 0; i < 10; i++) {
              var a = i / 10 * 6.283, r = i % 2 ? o.r * .5 : o.r;
              c.lineTo(o.x + Math.cos(a) * r, o.y + Math.sin(a) * r);
            }
            c.closePath(); c.fill();
          } else {
            c.fillStyle = '#64748b';
            c.beginPath(); c.arc(o.x, o.y, o.r, 0, 7); c.fill();
          }
        });

        // shield
        c.strokeStyle = 'rgba(34,211,238,.85)';
        c.lineWidth = 5;
        c.beginPath(); c.arc(d.shield.x, d.shield.y, d.shield.r, 0, 7); c.stroke();
        c.fillStyle = 'rgba(34,211,238,.12)';
        c.beginPath(); c.arc(d.shield.x, d.shield.y, d.shield.r, 0, 7); c.fill();

        // balloon
        var b = d.balloon;
        c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(b.x, b.y + b.r); c.lineTo(b.x, b.y + b.r + 26); c.stroke();
        c.fillStyle = '#fb7185';
        c.beginPath(); c.ellipse(b.x, b.y, b.r, b.r * 1.15, 0, 0, 7); c.fill();
        c.fillStyle = 'rgba(255,255,255,.4)';
        c.beginPath(); c.ellipse(b.x - 8, b.y - 9, 5, 8, -.4, 0, 7); c.fill();

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - 3, p.y - 3, 6, 6);
        });
        c.globalAlpha = 1;
      }
    });
  }

  window.Milo.register({
    id: 'rise-up', title: 'Rise Up', emo: '🎈', category: 'Casual',
    tagline: 'Shield the balloon on its way up',
    description: 'The balloon climbs by itself and everything else falls toward it. Your ' +
      'shield does not destroy anything — it shoves obstacles aside, so you have to nudge ' +
      'them clear early rather than block at the last second. One touch pops the balloon, ' +
      'and the descent speeds up the higher you get.',
    controls: ['Move the mouse', 'Drag', 'Arrow keys'],
    colors: ['#0b1330', '#fb7185'],
    tags: ['one finger', 'protect', 'reflex', 'hyper-casual'],
    mount: mount
  });
})();
