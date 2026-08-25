/* Space Defender — the invaders march down; hold the line. */
(function () {
  'use strict';
  var W = 760, H = 620;
  var COLS = 11, ROWS = 5;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.wave = 1;
      d.lives = 3;
      buildWave(d);
      d.ship = { x: W / 2, cool: 0 };
      d.shots = [];
      d.bombs = [];
      d.parts = [];
      d.shields = [];
      for (var s = 0; s < 4; s++) {
        d.shields.push({ x: 100 + s * 180, y: H - 150, hp: 12 });
      }
      g.set('Score', 0);
      g.set('Wave', 1);
      g.set('Lives', 3);
    }

    function buildWave(d) {
      d.aliens = [];
      for (var r = 0; r < ROWS; r++) {
        for (var col = 0; col < COLS; col++) {
          d.aliens.push({
            x: 90 + col * 52, y: 70 + r * 44,
            row: r, alive: true,
            kind: r === 0 ? 2 : r < 3 ? 1 : 0
          });
        }
      }
      d.dir = 1;
      d.drop = 0;
      d.march = 0;
      d.step = 0.7;
    }

    function alive(d) { return d.aliens.filter(function (a) { return a.alive; }); }

    return Milo.arcade(host, {
      id: 'space-defender',
      w: W, h: H, bg: '#04040f',
      stats: ['Score', 'Wave', 'Lives'],
      touch: 'dpad',
      touchButtons: [{ key: 'action', label: 'FIRE' }],
      emo: '👾',
      start: {
        title: 'Space Defender',
        text: 'Rows of invaders shuffle sideways and drop closer with every turn. Shoot ' +
          'them all before they reach you — and mind your shields, they wear away.',
        keys: ['← → move', 'Space to fire']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, i = g.input;
        var sp = 340 * dt;
        if (i.down('left')) d.ship.x -= sp;
        if (i.down('right')) d.ship.x += sp;
        d.ship.x = U.clamp(d.ship.x, 26, W - 26);

        d.ship.cool -= dt;
        if ((i.down('action') || i.pdown) && d.ship.cool <= 0 && d.shots.length < 3) {
          d.ship.cool = 0.34;
          d.shots.push({ x: d.ship.x, y: H - 76 });
          Milo.sound.tone({ f: 880, f2: 460, d: .06, v: .05, type: 'square' });
        }

        var live = alive(d);
        // The fewer left, the faster they march.
        d.step = Math.max(0.08, 0.7 * (live.length / (COLS * ROWS)) + 0.06);
        d.march += dt;
        if (d.march >= d.step) {
          d.march = 0;
          var hitEdge = live.some(function (a) {
            return (d.dir > 0 && a.x > W - 60) || (d.dir < 0 && a.x < 40);
          });
          if (hitEdge) {
            d.dir *= -1;
            live.forEach(function (a) { a.y += 22; });
          } else {
            live.forEach(function (a) { a.x += d.dir * 14; });
          }
          Milo.sound.tone({ f: 120 + live.length, d: .04, v: .03, type: 'square' });

          // Bottom-most alien in a random column drops a bomb.
          if (live.length && Math.random() < 0.55) {
            var shooter = live[U.randInt(0, live.length - 1)];
            var lowest = shooter;
            live.forEach(function (a) {
              if (Math.abs(a.x - shooter.x) < 6 && a.y > lowest.y) lowest = a;
            });
            d.bombs.push({ x: lowest.x, y: lowest.y + 16 });
          }
        }

        d.shots = d.shots.filter(function (s) {
          s.y -= 620 * dt;
          if (s.y < 0) return false;
          for (var k = 0; k < d.aliens.length; k++) {
            var a = d.aliens[k];
            if (!a.alive) continue;
            if (Math.abs(s.x - a.x) < 18 && Math.abs(s.y - a.y) < 14) {
              a.alive = false;
              g.score += (a.kind + 1) * 20;
              g.set('Score', U.fmt(g.score));
              boom(d, a.x, a.y, '#22d3ee');
              Milo.sound.hit();
              return false;
            }
          }
          for (var q = 0; q < d.shields.length; q++) {
            var sh = d.shields[q];
            if (sh.hp > 0 && Math.abs(s.x - sh.x) < 40 && Math.abs(s.y - sh.y) < 18) {
              sh.hp--;
              return false;
            }
          }
          return true;
        });

        d.bombs = d.bombs.filter(function (b) {
          b.y += 260 * dt;
          if (b.y > H) return false;
          for (var q = 0; q < d.shields.length; q++) {
            var sh = d.shields[q];
            if (sh.hp > 0 && Math.abs(b.x - sh.x) < 40 && Math.abs(b.y - sh.y) < 18) {
              sh.hp--;
              boom(d, b.x, b.y, '#fb923c');
              return false;
            }
          }
          if (Math.abs(b.x - d.ship.x) < 22 && b.y > H - 74) {
            d.lives--;
            g.set('Lives', Math.max(0, d.lives));
            boom(d, d.ship.x, H - 60, '#fff');
            Milo.sound.explode();
            if (d.lives <= 0) g.gameOver({ text: 'You held out to wave ' + d.wave + '.' });
            return false;
          }
          return true;
        });

        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
          return p.life > 0;
        });

        if (live.some(function (a) { return a.y > H - 130; })) {
          g.gameOver({ emo: '👾', title: 'They got through', text: 'Wave ' + d.wave + '.' });
          return;
        }
        if (!live.length) {
          d.wave++;
          g.set('Wave', d.wave);
          g.score += 200;
          g.set('Score', U.fmt(g.score));
          buildWave(d);
          d.bombs = [];
          Milo.sound.win();
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.fillStyle = '#04040f'; c.fillRect(0, 0, W, H);

        d.aliens.forEach(function (a) {
          if (!a.alive) return;
          var col = ['#34d399', '#22d3ee', '#fb7185'][a.kind];
          c.fillStyle = col;
          var wob = Math.floor(g.t * 4) % 2;
          c.fillRect(a.x - 14, a.y - 8, 28, 12);
          c.fillRect(a.x - 18, a.y - 4, 6, 10);
          c.fillRect(a.x + 12, a.y - 4, 6, 10);
          c.fillRect(a.x - 10 + wob * 3, a.y + 4, 6, 6);
          c.fillRect(a.x + 4 - wob * 3, a.y + 4, 6, 6);
          c.fillStyle = '#04040f';
          c.fillRect(a.x - 8, a.y - 4, 4, 4);
          c.fillRect(a.x + 4, a.y - 4, 4, 4);
        });

        d.shields.forEach(function (sh) {
          if (sh.hp <= 0) return;
          c.fillStyle = 'rgba(52,211,153,' + (0.25 + sh.hp / 16) + ')';
          U.roundRect(c, sh.x - 40, sh.y - 16, 80, 32, 8); c.fill();
        });

        c.fillStyle = '#ffe066';
        d.shots.forEach(function (s) { c.fillRect(s.x - 2, s.y - 10, 4, 16); });
        c.fillStyle = '#ff5b7f';
        d.bombs.forEach(function (b) { c.fillRect(b.x - 3, b.y - 8, 6, 14); });

        c.fillStyle = '#22d3ee';
        c.beginPath();
        c.moveTo(d.ship.x, H - 78);
        c.lineTo(d.ship.x - 24, H - 52);
        c.lineTo(d.ship.x + 24, H - 52);
        c.closePath(); c.fill();
        c.fillRect(d.ship.x - 4, H - 88, 8, 12);

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - 2, p.y - 2, 4, 4);
        });
        c.globalAlpha = 1;
      }
    });

    function boom(d, x, y, col) {
      for (var i = 0; i < 12; i++) {
        var a = Math.random() * 6.28, s = U.rand(40, 200);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: .4, max: .4, col: col });
      }
    }
  }

  window.Milo.register({
    id: 'space-defender', title: 'Space Defender', emo: '👾', category: 'Arcade',
    tagline: 'Hold the line against the invaders',
    description: 'Five rows of invaders shuffle across the screen and drop a step closer ' +
      'every time they hit the edge. They march faster the fewer of them are left, so the ' +
      'last few are the hardest. Four shields absorb fire from both sides — including yours ' +
      '— and wear away as they take hits.',
    controls: ['← →', 'Space to fire'],
    colors: ['#04040f', '#34d399'],
    tags: ['classic', 'shooter', 'arcade', 'invaders'],
    mount: mount
  });
})();
