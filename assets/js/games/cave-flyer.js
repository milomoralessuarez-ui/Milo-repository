/* Cave Flyer — thread a widening ship through a narrowing cave. */
(function () {
  'use strict';
  var W = 860, H = 520;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.ship = { y: H / 2, vy: 0 };
      d.slices = [];
      d.scroll = 0;
      d.speed = 210;
      d.gap = 260;
      d.centre = H / 2;
      d.drift = 0;
      d.dist = 0;
      d.gems = [];
      d.parts = [];
      for (var i = 0; i < 90; i++) addSlice(d);
      g.set('Distance', 0);
      g.set('Gems', 0);
      g.set('Best', U.fmt(g.best));
      d.gemCount = 0;
    }

    function addSlice(d) {
      d.drift += U.rand(-0.5, 0.5);
      d.drift = U.clamp(d.drift, -2.4, 2.4);
      d.centre += d.drift * 3;
      d.centre = U.clamp(d.centre, d.gap / 2 + 30, H - d.gap / 2 - 30);
      d.gap = Math.max(110, d.gap - 0.35);
      var s = { top: d.centre - d.gap / 2, bot: d.centre + d.gap / 2 };
      d.slices.push(s);
      if (Math.random() < 0.05) {
        d.gems.push({ i: d.slices.length - 1, y: d.centre + U.rand(-d.gap / 4, d.gap / 4), taken: false });
      }
    }

    var SLICE_W = 12;

    return Milo.arcade(host, {
      id: 'cave-flyer',
      w: W, h: H, bg: '#0a0a1c',
      stats: ['Distance', 'Gems', 'Best'],
      touchButtons: [{ key: 'action', label: 'THRUST' }],
      emo: '🚁',
      start: {
        title: 'Cave Flyer',
        text: 'Hold to climb, release to fall. The cave narrows the further you get and ' +
          'the walls do not forgive. Gems are worth ten metres each.',
        keys: ['Hold Space / click to climb']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, i = g.input;
        var thrust = i.down('action') || i.pdown;

        d.ship.vy += (thrust ? -900 : 780) * dt;
        d.ship.vy = U.clamp(d.ship.vy, -420, 460);
        d.ship.y += d.ship.vy * dt;

        d.speed = Math.min(460, 210 + d.dist * 0.12);
        d.scroll += d.speed * dt;
        d.dist += d.speed * dt * 0.08;
        g.score = Math.floor(d.dist) + d.gemCount * 10;
        g.set('Distance', Math.floor(d.dist));

        while (d.scroll >= SLICE_W) {
          d.scroll -= SLICE_W;
          d.slices.shift();
          d.gems.forEach(function (gm) { gm.i--; });
          d.gems = d.gems.filter(function (gm) { return gm.i >= 0; });
          addSlice(d);
        }

        // The ship sits a third of the way across the screen.
        var idx = Math.floor((W / 3) / SLICE_W);
        var s = d.slices[idx];
        if (s && (d.ship.y - 10 < s.top || d.ship.y + 10 > s.bot)) {
          Milo.sound.explode();
          for (var p = 0; p < 26; p++) {
            var a = Math.random() * 6.28, sp = U.rand(50, 260);
            d.parts.push({ x: W / 3, y: d.ship.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: .7, max: .7, col: U.choice(['#22d3ee', '#fff', '#ffb020']) });
          }
          g.gameOver({ text: Math.floor(d.dist) + ' metres and ' + d.gemCount + ' gems.' });
          return;
        }

        d.gems.forEach(function (gm) {
          if (gm.taken) return;
          var gx = gm.i * SLICE_W - d.scroll;
          if (Math.abs(gx - W / 3) < 14 && Math.abs(gm.y - d.ship.y) < 20) {
            gm.taken = true;
            d.gemCount++;
            g.set('Gems', d.gemCount);
            Milo.sound.coin();
          }
        });

        if (thrust && g.frame % 2 === 0) {
          d.parts.push({
            x: W / 3 - 14, y: d.ship.y + 6,
            vx: U.rand(-160, -70), vy: U.rand(20, 90),
            life: .3, max: .3, col: U.choice(['#ffb020', '#ff7a45'])
          });
        }

        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
          return p.life > 0;
        });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#12123a'); bg.addColorStop(1, '#06060f');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        c.fillStyle = '#2b2d55';
        c.beginPath();
        c.moveTo(0, 0);
        d.slices.forEach(function (s, i) { c.lineTo(i * SLICE_W - d.scroll, s.top); });
        c.lineTo(W, 0);
        c.closePath(); c.fill();
        c.beginPath();
        c.moveTo(0, H);
        d.slices.forEach(function (s, i) { c.lineTo(i * SLICE_W - d.scroll, s.bot); });
        c.lineTo(W, H);
        c.closePath(); c.fill();

        c.strokeStyle = '#5b62b8'; c.lineWidth = 3;
        c.beginPath();
        d.slices.forEach(function (s, i) { i ? c.lineTo(i * SLICE_W - d.scroll, s.top) : c.moveTo(0, s.top); });
        c.stroke();
        c.beginPath();
        d.slices.forEach(function (s, i) { i ? c.lineTo(i * SLICE_W - d.scroll, s.bot) : c.moveTo(0, s.bot); });
        c.stroke();

        d.gems.forEach(function (gm) {
          if (gm.taken) return;
          var gx = gm.i * SLICE_W - d.scroll;
          if (gx < -20 || gx > W + 20) return;
          c.fillStyle = '#ffd257';
          c.beginPath();
          c.moveTo(gx, gm.y - 10); c.lineTo(gx + 8, gm.y);
          c.lineTo(gx, gm.y + 10); c.lineTo(gx - 8, gm.y);
          c.closePath(); c.fill();
        });

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.beginPath(); c.arc(p.x, p.y, 3, 0, 7); c.fill();
        });
        c.globalAlpha = 1;

        c.save();
        c.translate(W / 3, d.ship.y);
        c.rotate(U.clamp(d.ship.vy / 900, -.5, .5));
        c.fillStyle = '#e8ecff';
        c.beginPath();
        c.moveTo(18, 0); c.lineTo(-12, -9); c.lineTo(-8, 0); c.lineTo(-12, 9);
        c.closePath(); c.fill();
        c.fillStyle = '#22d3ee';
        c.beginPath(); c.arc(4, 0, 4, 0, 7); c.fill();
        c.restore();
      }
    });
  }

  window.Milo.register({
    id: 'cave-flyer', title: 'Cave Flyer', emo: '🚁', category: 'Arcade',
    tagline: 'Hold to climb, release to fall',
    description: 'One control: hold to fire the thruster and climb, let go and gravity ' +
      'takes over. The cave winds unpredictably and — crucially — the gap keeps narrowing ' +
      'the further you fly, so a passage that felt generous at the start will not stay that ' +
      'way. Gems are worth ten metres each.',
    controls: ['Hold Space', 'Hold click'],
    colors: ['#2b2d55', '#22d3ee'],
    tags: ['one button', 'endless', 'reflex', 'flying'],
    mount: mount
  });
})();
