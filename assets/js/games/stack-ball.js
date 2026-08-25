/* Stack Ball — smash down the tower, but not through the black rings. */
(function () {
  'use strict';
  var W = 440, H = 700, R = 120;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.level = 1;
      buildTower(d);
      d.ball = { y: 130, vy: 0, smashing: false };
      d.rot = 0;
      d.parts = [];
      d.combo = 0;
      g.set('Level', 1);
      g.set('Rings', d.rings.length);
      g.set('Best', U.fmt(g.best));
    }

    function buildTower(d) {
      d.rings = [];
      var n = 16 + d.level * 3;
      for (var i = 0; i < n; i++) {
        var sectors = [];
        var bad = i < 3 ? 0 : U.randInt(1, Math.min(4, 1 + Math.floor(d.level / 2)));
        for (var s = 0; s < 8; s++) sectors.push('safe');
        var order = U.shuffle([0, 1, 2, 3, 4, 5, 6, 7]);
        for (var b = 0; b < bad; b++) sectors[order[b]] = 'bad';
        d.rings.push({ y: 210 + i * 44, sectors: sectors, gone: false });
      }
      d.cleared = 0;
    }

    function sectorAt(ring, rot) {
      var a = ((-rot) % 6.283 + 6.283) % 6.283;
      return ring.sectors[Math.floor(a / (6.283 / 8)) % 8];
    }

    return Milo.arcade(host, {
      id: 'stack-ball',
      w: W, h: H, bg: '#120a24',
      stats: ['Level', 'Rings', 'Best'],
      touchButtons: [{ key: 'action', label: 'SMASH' }],
      emo: '⚫',
      start: {
        title: 'Stack Ball',
        text: 'Hold to smash straight down through the tower. Break enough rings in a row ' +
          'and you turn unstoppable — otherwise a black section bounces you off.',
        keys: ['Hold Space / click to smash']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, i = g.input;
        var pressing = i.down('action') || i.pdown;
        d.rot += 1.1 * dt;

        d.ball.vy += (pressing ? 2400 : 900) * dt;
        d.ball.y += d.ball.vy * dt;

        var live = d.rings.filter(function (r) { return !r.gone; });
        for (var k = 0; k < live.length; k++) {
          var r = live[k];
          if (d.ball.y + 20 < r.y || d.ball.y - 20 > r.y + 30) continue;
          if (d.ball.vy <= 0) continue;
          var kind = sectorAt(r, d.rot);
          if (kind === 'bad' && d.combo < 5) {
            d.ball.y = r.y - 22;
            d.ball.vy = -520;
            d.combo = 0;
            Milo.sound.hit();
            if (d.ball.y < 60) {
              g.gameOver({ text: 'Bounced out on level ' + d.level + '.' });
              return;
            }
          } else {
            r.gone = true;
            d.cleared++;
            d.combo++;
            g.score += 10 * Math.max(1, d.combo);
            g.set('Rings', d.rings.length - d.cleared);
            smash(d, r.y, kind === 'bad');
            Milo.sound.tone({ f: 300 + d.combo * 30, f2: 180, d: .06, v: .06, type: 'square' });
          }
          break;
        }

        if (d.ball.y > 210 + (d.rings.length - 1) * 44 + 90) {
          d.level++;
          g.score += 200;
          g.set('Level', d.level);
          Milo.sound.win();
          buildTower(d);
          d.ball.y = 130;
          d.ball.vy = 0;
          d.combo = 0;
          g.set('Rings', d.rings.length);
        }

        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 900 * dt; p.life -= dt;
          return p.life > 0;
        });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#1e1140'); bg.addColorStop(1, '#0a0518');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        var camY = Math.max(0, d.ball.y - 220);
        c.save();
        c.translate(0, -camY);

        c.fillStyle = '#3a2a5e';
        c.fillRect(W / 2 - 22, 0, 44, H + camY + 400);

        d.rings.forEach(function (r) {
          if (r.gone) return;
          if (r.y - camY < -60 || r.y - camY > H + 60) return;
          for (var s = 0; s < 8; s++) {
            var a0 = s * (6.283 / 8) + d.rot, a1 = a0 + 6.283 / 8;
            c.fillStyle = r.sectors[s] === 'bad' ? '#221c33' : 'hsl(' + (280 + s * 8) + ',65%,58%)';
            c.beginPath();
            c.ellipse(W / 2, r.y + 14, R, R * 0.28, 0, a0, a1);
            c.lineTo(W / 2, r.y + 14);
            c.closePath(); c.fill();
            c.fillStyle = 'rgba(255,255,255,.10)';
            c.beginPath();
            c.ellipse(W / 2, r.y, R, R * 0.28, 0, a0, a1);
            c.lineTo(W / 2, r.y);
            c.closePath(); c.fill();
          }
        });

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - 4, p.y - 4, 8, 8);
        });
        c.globalAlpha = 1;

        var col = d.combo >= 5 ? '#ffd257' : '#22d3ee';
        c.shadowColor = col; c.shadowBlur = 24;
        c.fillStyle = col;
        c.beginPath(); c.arc(W / 2, d.ball.y, 20, 0, 7); c.fill();
        c.shadowBlur = 0;
        c.restore();

        if (d.combo >= 5) {
          c.fillStyle = '#ffd257';
          c.font = '800 18px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText('UNSTOPPABLE', W / 2, 50);
        }
      }
    });

    function smash(d, y, bad) {
      for (var i = 0; i < 14; i++) {
        var a = Math.random() * 6.28;
        d.parts.push({
          x: W / 2 + Math.cos(a) * 60, y: y + 10,
          vx: Math.cos(a) * 220, vy: U.rand(-180, 40),
          life: .5, max: .5, col: bad ? '#221c33' : 'hsl(' + U.randInt(270, 320) + ',70%,60%)'
        });
      }
    }
  }

  window.Milo.register({
    id: 'stack-ball', title: 'Stack Ball', emo: '⚫', category: 'Casual',
    tagline: 'Smash down the tower without bouncing',
    description: 'Hold to drive the ball down through a spinning tower of coloured rings. ' +
      'Coloured sections shatter; black ones bounce you back up, and bouncing off the top ' +
      'ends the run. Break five in a row though and you go briefly unstoppable, smashing ' +
      'through black sections too — which is the only way through the crowded lower levels.',
    controls: ['Hold Space', 'Hold click'],
    colors: ['#120a24', '#a78bfa'],
    tags: ['one button', 'smashing', 'combo', 'hyper-casual'],
    mount: mount
  });
})();
