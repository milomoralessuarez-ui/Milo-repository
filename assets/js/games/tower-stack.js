/* Tower Stack — time each drop; overhang gets sliced off. */
(function () {
  'use strict';
  var W = 480, H = 720, BASE_W = 220, BH = 32;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.stack = [{ x: (W - BASE_W) / 2, w: BASE_W, hue: 200 }];
      d.camY = 0;
      d.speed = 190;
      d.dir = 1;
      d.cur = { x: 0, w: BASE_W, hue: 210 };
      d.slices = [];
      d.perfect = 0;
      d.dropping = false;
      g.set('Height', 0);
      g.set('Perfect', 0);
      g.set('Best', U.fmt(g.best));
    }

    function levelY(d, i) {
      // Row 0 sits at the bottom; the tower grows upward.
      return H - 110 - i * BH;
    }

    function place(g) {
      var d = g.data;
      var top = d.stack[d.stack.length - 1];
      var cur = d.cur;
      var overlapL = Math.max(cur.x, top.x);
      var overlapR = Math.min(cur.x + cur.w, top.x + top.w);
      var w = overlapR - overlapL;

      if (w <= 0) {
        Milo.sound.explode();
        d.slices.push({ x: cur.x, y: levelY(d, d.stack.length), w: cur.w, hue: cur.hue, vy: 0, vx: 0 });
        g.gameOver({ text: 'Your tower reached ' + d.stack.length + ' blocks.' });
        return;
      }

      var off = Math.abs(cur.x - top.x);
      if (off < 4) {
        // Close enough counts as perfect: snap it and give the width back.
        w = top.w;
        overlapL = top.x;
        d.perfect++;
        g.score += 20 + d.perfect * 5;
        Milo.sound.powerup();
        g.set('Perfect', d.perfect);
      } else {
        d.perfect = 0;
        g.set('Perfect', 0);
        g.score += 10;
        Milo.sound.tone({ f: 420, f2: 300, d: .1, v: .08, type: 'triangle' });
        // The overhang falls away.
        var sliceX = cur.x < top.x ? cur.x : overlapR;
        var sliceW = cur.w - w;
        d.slices.push({
          x: sliceX, y: levelY(d, d.stack.length), w: sliceW, hue: cur.hue,
          vy: 0, vx: cur.x < top.x ? -60 : 60
        });
      }

      d.stack.push({ x: overlapL, w: w, hue: cur.hue });
      g.set('Height', d.stack.length - 1);
      g.score = Math.max(g.score, (d.stack.length - 1) * 10);
      d.speed = Math.min(520, 190 + d.stack.length * 9);
      d.dir = Math.random() < .5 ? 1 : -1;
      d.cur = { x: d.dir > 0 ? -w : W, w: w, hue: (d.stack.length * 24) % 360 };

      if (w < 8) {
        Milo.sound.lose();
        g.gameOver({ text: 'The tower got too thin at ' + (d.stack.length - 1) + ' blocks.' });
      }
    }

    return Milo.arcade(host, {
      id: 'tower-stack',
      w: W, h: H, bg: '#0a0d22',
      stats: ['Height', 'Perfect', 'Best'],
      emo: '🗼',
      touchButtons: [{ key: 'action', label: 'DROP' }],
      start: {
        title: 'Tower Stack',
        text: 'Drop each block right on top of the last one. Anything hanging over ' +
          'the edge is sliced off, so a sloppy drop makes the next one harder.',
        keys: ['Space / Click to drop']
      },
      init: reset,
      onPointer: function (g, type) { if (type === 'down') place(g); },
      onKey: function (g, e) { if (e.code === 'Space') place(g); },

      update: function (g, dt) {
        var d = g.data;
        if (g.input.pressed('action')) place(g);

        d.cur.x += d.dir * d.speed * dt;
        if (d.cur.x + d.cur.w > W) { d.cur.x = W - d.cur.w; d.dir = -1; }
        if (d.cur.x < 0) { d.cur.x = 0; d.dir = 1; }

        // Scroll once the tower climbs past the middle of the screen.
        var topY = levelY(d, d.stack.length);
        var want = Math.min(0, topY - H * 0.45);
        d.camY += (want - d.camY) * Math.min(1, dt * 6);

        d.slices = d.slices.filter(function (s) {
          s.vy += 1500 * dt;
          s.y += s.vy * dt;
          s.x += s.vx * dt;
          return s.y < H - d.camY + 200;
        });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#1a1550'); sky.addColorStop(1, '#070a1c');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);

        c.save();
        c.translate(0, -d.camY);

        function block(x, y, w, hue, glow) {
          var grd = c.createLinearGradient(x, y, x, y + BH);
          grd.addColorStop(0, 'hsl(' + hue + ',72%,62%)');
          grd.addColorStop(1, 'hsl(' + hue + ',72%,46%)');
          if (glow) { c.shadowColor = 'hsl(' + hue + ',80%,60%)'; c.shadowBlur = 18; }
          c.fillStyle = grd;
          U.roundRect(c, x, y, w, BH - 3, 5); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = 'rgba(255,255,255,.22)';
          U.roundRect(c, x + 3, y + 3, Math.max(0, w - 6), 5, 2.5); c.fill();
        }

        d.stack.forEach(function (b, i) { block(b.x, levelY(d, i), b.w, b.hue, false); });
        d.slices.forEach(function (s) {
          c.globalAlpha = .8;
          block(s.x, s.y, s.w, s.hue, false);
          c.globalAlpha = 1;
        });
        if (g.state === 'play' || g.state === 'start') {
          block(d.cur.x, levelY(d, d.stack.length), d.cur.w, d.cur.hue, true);
        }

        // guide line from the top of the stack
        var top = d.stack[d.stack.length - 1];
        c.strokeStyle = 'rgba(255,255,255,.16)';
        c.setLineDash([4, 6]); c.lineWidth = 1;
        c.beginPath();
        c.moveTo(top.x, levelY(d, d.stack.length - 1));
        c.lineTo(top.x, levelY(d, d.stack.length) - 4);
        c.moveTo(top.x + top.w, levelY(d, d.stack.length - 1));
        c.lineTo(top.x + top.w, levelY(d, d.stack.length) - 4);
        c.stroke();
        c.setLineDash([]);
        c.restore();

        if (d.perfect > 1) {
          c.fillStyle = '#ffd257';
          c.font = '800 22px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText('PERFECT ×' + d.perfect, W / 2, 108);
        }
      }
    });
  }

  window.Milo.register({
    id: 'tower-stack', title: 'Tower Stack', emo: '🗼', category: 'Casual',
    tagline: 'One-tap tower building',
    description: 'A block slides back and forth above your tower. Tap to drop it. ' +
      'Whatever hangs over the edge is sliced away, so every sloppy drop leaves you ' +
      'a narrower target. Land it dead centre for a perfect — those keep your full width.',
    controls: ['Space', 'Click', 'Tap'],
    colors: ['#f59e0b', '#ef4444'],
    tags: ['one button', 'timing', 'stacking', 'relaxing'],
    mount: mount
  });
})();
