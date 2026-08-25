/* Helix Drop — fall down the tower, through the gaps, past the red. */
(function () {
  'use strict';
  var W = 460, H = 700, R = 150, PLAT_H = 22;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.rot = 0;
      d.ball = { y: 120, vy: 0, bounce: 0 };
      d.level = 0;
      d.plats = [];
      for (var i = 0; i < 30; i++) d.plats.push(mkPlat(i));
      d.camY = 0;
      d.combo = 0;
      d.parts = [];
      g.set('Level', 0);
      g.set('Combo', 0);
      g.set('Best', U.fmt(g.best));
    }

    /** Each platform is a ring of eight sectors: gap, safe or deadly. */
    function mkPlat(i) {
      var sectors = [];
      var gaps = U.randInt(1, 3);
      var bad = i < 3 ? 0 : U.randInt(0, Math.min(3, 1 + Math.floor(i / 8)));
      for (var s = 0; s < 8; s++) sectors.push('safe');
      var order = U.shuffle([0, 1, 2, 3, 4, 5, 6, 7]);
      for (var q = 0; q < gaps; q++) sectors[order[q]] = 'gap';
      for (var b = 0; b < bad; b++) sectors[order[gaps + b]] = 'bad';
      return { y: 200 + i * 130, sectors: sectors, broken: false };
    }

    function sectorAt(plat, rot) {
      // The ball sits at the front of the tower; find which sector faces it.
      var a = ((-rot) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      return plat.sectors[Math.floor(a / (Math.PI * 2 / 8)) % 8];
    }

    return Milo.arcade(host, {
      id: 'helix-drop',
      w: W, h: H, bg: '#120b26',
      stats: ['Level', 'Combo', 'Best'],
      emo: '🌀',
      start: {
        title: 'Helix Drop',
        text: 'Drag to spin the tower and drop the ball through the gaps. Red sections ' +
          'end the run — unless you are on a streak, which smashes straight through.',
        keys: ['Drag left / right', '← → also work']
      },
      init: reset,

      onPointer: function (g, type, x, y, e) {
        var d = g.data;
        if (type === 'down') d.dragX = x;
        else if (type === 'move' && d.dragX != null) {
          d.rot -= (x - d.dragX) * 0.012;
          d.dragX = x;
        } else if (type === 'up') d.dragX = null;
      },

      update: function (g, dt) {
        var d = g.data, i = g.input;
        if (i.down('left')) d.rot += 2.6 * dt;
        if (i.down('right')) d.rot -= 2.6 * dt;

        d.ball.vy += 1500 * dt;
        d.ball.y += d.ball.vy * dt;

        d.plats.forEach(function (p) {
          if (p.broken) return;
          var ballBottom = d.ball.y + 14;
          if (ballBottom < p.y || ballBottom > p.y + PLAT_H + 12) return;
          if (d.ball.vy <= 0) return;
          var kind = sectorAt(p, d.rot);
          if (kind === 'gap') return;
          if (kind === 'bad') {
            if (d.combo >= 3) {
              p.broken = true;
              smash(d, p.y);
              g.score += 30;
              return;
            }
            Milo.sound.explode();
            g.gameOver({ text: 'Reached level ' + d.level + '.' });
            return;
          }
          // Safe landing — bounce and reset the streak.
          d.ball.y = p.y - 14;
          d.ball.vy = -430;
          d.combo = 0;
          g.set('Combo', 0);
          Milo.sound.tone({ f: 320, f2: 420, d: .07, v: .06, type: 'triangle' });
        });

        // Count the platforms passed.
        var passed = d.plats.filter(function (p) { return d.ball.y > p.y + PLAT_H; }).length;
        if (passed > d.level) {
          var gained = passed - d.level;
          d.level = passed;
          d.combo += gained;
          g.score += 10 * d.combo;
          g.set('Level', d.level);
          g.set('Combo', d.combo);
          if (d.combo > 1) Milo.sound.tone({ f: 500 + d.combo * 40, d: .05, v: .05, type: 'square' });
        }

        // Extend the tower ahead of the ball.
        while (d.plats.length < d.level + 26) d.plats.push(mkPlat(d.plats.length));

        d.camY = d.ball.y - 200;
        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 700 * dt; p.life -= dt;
          return p.life > 0;
        });

        if (d.level >= 60) {
          g.win({ score: g.score, emo: '🌀', title: 'Tower cleared!', text: 'Sixty levels down.' });
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#1e1240'); bg.addColorStop(1, '#0a0618');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        c.save();
        c.translate(0, -d.camY);

        // central pillar
        c.fillStyle = '#2a1f52';
        c.fillRect(W / 2 - 26, d.camY, 52, H);

        d.plats.forEach(function (p) {
          if (p.broken) return;
          if (p.y < d.camY - 60 || p.y > d.camY + H + 60) return;
          for (var s = 0; s < 8; s++) {
            var kind = p.sectors[s];
            if (kind === 'gap') continue;
            var a0 = s * (Math.PI * 2 / 8) + d.rot;
            var a1 = a0 + (Math.PI * 2 / 8);
            // Flatten the ring into an ellipse for a cheap 3D read.
            c.fillStyle = kind === 'bad' ? '#e5484d' : '#7c5cff';
            c.beginPath();
            c.ellipse(W / 2, p.y + PLAT_H / 2, R, R * 0.30, 0, a0, a1);
            c.lineTo(W / 2, p.y + PLAT_H / 2);
            c.closePath();
            c.fill();
            c.fillStyle = kind === 'bad' ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.12)';
            c.beginPath();
            c.ellipse(W / 2, p.y, R, R * 0.30, 0, a0, a1);
            c.lineTo(W / 2, p.y);
            c.closePath();
            c.fill();
          }
        });

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - 3, p.y - 3, 6, 6);
        });
        c.globalAlpha = 1;

        var col = d.combo >= 3 ? '#ffd257' : '#22d3ee';
        c.shadowColor = col; c.shadowBlur = 22;
        c.fillStyle = col;
        c.beginPath(); c.arc(W / 2, d.ball.y, 14, 0, 7); c.fill();
        c.shadowBlur = 0;
        c.restore();

        if (d.combo >= 3) {
          c.fillStyle = '#ffd257';
          c.font = '800 18px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText('SMASHING THROUGH', W / 2, 56);
        }
      }
    });

    function smash(d, y) {
      for (var i = 0; i < 16; i++) {
        var a = Math.random() * 6.28;
        d.parts.push({
          x: W / 2 + Math.cos(a) * 60, y: y, vx: Math.cos(a) * 200, vy: U.rand(-160, 40),
          life: .5, max: .5, col: '#e5484d'
        });
      }
      Milo.sound.explode();
    }
  }

  window.Milo.register({
    id: 'helix-drop', title: 'Helix Drop', emo: '🌀', category: 'Casual',
    tagline: 'Spin the tower, drop through the gaps',
    description: 'Drag to rotate a tower of coloured rings and let the ball fall through ' +
      'the gaps. Land on a purple section and you bounce; hit a red one and it is over — ' +
      'unless you have fallen through three levels in a row, in which case you smash ' +
      'straight through it instead.',
    controls: ['Drag', '← →'],
    colors: ['#120b26', '#7c5cff'],
    tags: ['one finger', 'falling', 'reflex', 'hyper-casual'],
    mount: mount
  });
})();
