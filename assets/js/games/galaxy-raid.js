/* Galaxy Raid — formation flyers that peel off and dive at you. */
(function () {
  'use strict';
  var W = 720, H = 620;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.ship = { x: W / 2, cool: 0, inv: 2, lives: 3 };
      d.foes = [];
      d.shots = [];
      d.enemyShots = [];
      d.parts = [];
      d.stars = [];
      d.wave = 0;
      for (var i = 0; i < 70; i++) d.stars.push({ x: Math.random() * W, y: Math.random() * H, z: U.rand(.3, 1) });
      spawnWave(d);
      g.set('Score', 0);
      g.set('Wave', 1);
      g.set('Lives', 3);
    }

    function spawnWave(d) {
      d.wave++;
      var cols = 8, rows = 3;
      for (var r = 0; r < rows; r++) {
        for (var col = 0; col < cols; col++) {
          d.foes.push({
            hx: 90 + col * 70, hy: 90 + r * 56,     // home position in formation
            x: 90 + col * 70, y: -60 - r * 40,
            state: 'form', t: Math.random() * 6,
            kind: r === 0 ? 1 : 0, cool: U.rand(2, 8),
            dive: null
          });
        }
      }
    }

    return Milo.arcade(host, {
      id: 'galaxy-raid',
      w: W, h: H, bg: '#03030e',
      stats: ['Score', 'Wave', 'Lives'],
      touch: 'dpad',
      touchButtons: [{ key: 'action', label: 'FIRE' }],
      emo: '🛸',
      start: {
        title: 'Galaxy Raid',
        text: 'Ships assemble into a formation, then peel off one at a time and dive at ' +
          'you along a curve. Shoot them in formation or catch them on the way down.',
        keys: ['← → move', 'Space fire']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, i = g.input, s = d.ship;
        var sp = 380 * dt;
        if (i.down('left')) s.x -= sp;
        if (i.down('right')) s.x += sp;
        if (i.pdown) s.x = U.clamp(i.px, 24, W - 24);
        s.x = U.clamp(s.x, 24, W - 24);
        s.cool -= dt;
        s.inv = Math.max(0, s.inv - dt);

        if ((i.down('action') || i.pdown) && s.cool <= 0 && d.shots.length < 4) {
          s.cool = 0.22;
          d.shots.push({ x: s.x, y: H - 76 });
          Milo.sound.tone({ f: 900, f2: 500, d: .05, v: .04, type: 'square' });
        }

        d.stars.forEach(function (st) {
          st.y += (30 + st.z * 90) * dt;
          if (st.y > H) { st.y = -2; st.x = Math.random() * W; }
        });

        var sway = Math.sin(g.t * 0.9) * 34;
        d.foes.forEach(function (f) {
          f.t += dt;
          f.cool -= dt;
          if (f.state === 'form') {
            var tx = f.hx + sway, ty = f.hy;
            f.x += (tx - f.x) * Math.min(1, dt * 3);
            f.y += (ty - f.y) * Math.min(1, dt * 3);
            // Peel off and dive.
            if (f.cool <= 0 && Math.abs(f.y - f.hy) < 6) {
              f.state = 'dive';
              f.dive = { t: 0, sx: f.x, sy: f.y, tx: s.x, phase: U.rand(0, 6.28) };
              f.cool = U.rand(4, 12);
            }
          } else {
            var dv = f.dive;
            dv.t += dt * 0.5;
            // A looping dive path rather than a straight run.
            f.x = dv.sx + Math.sin(dv.t * 3 + dv.phase) * 160 + (dv.tx - dv.sx) * Math.min(1, dv.t);
            f.y = dv.sy + dv.t * 520;
            if (f.y > H + 50) {
              f.state = 'form';
              f.y = -50;
              f.x = f.hx;
            }
            if (f.cool <= 0 && f.y < H - 150) {
              f.cool = 1.2;
              var a = Math.atan2(H - 70 - f.y, s.x - f.x);
              d.enemyShots.push({ x: f.x, y: f.y, vx: Math.cos(a) * 280, vy: Math.sin(a) * 280 });
            }
          }
        });

        d.shots = d.shots.filter(function (b) {
          b.y -= 700 * dt;
          if (b.y < -20) return false;
          for (var k = 0; k < d.foes.length; k++) {
            var f = d.foes[k];
            if (Math.abs(b.x - f.x) > 18 || Math.abs(b.y - f.y) > 16) continue;
            d.foes.splice(k, 1);
            var pts = (f.state === 'dive' ? 150 : 60) * (f.kind + 1);
            g.score += pts;
            g.set('Score', U.fmt(g.score));
            boom(d, f.x, f.y, f.kind ? '#fb7185' : '#22d3ee');
            Milo.sound.explode();
            return false;
          }
          return true;
        });

        d.enemyShots = d.enemyShots.filter(function (b) {
          b.x += b.vx * dt; b.y += b.vy * dt;
          if (b.y > H || b.x < -20 || b.x > W + 20) return false;
          if (s.inv <= 0 && Math.abs(b.x - s.x) < 18 && b.y > H - 84 && b.y < H - 44) {
            hurt(g);
            return false;
          }
          return true;
        });

        d.foes.forEach(function (f) {
          if (s.inv > 0) return;
          if (Math.abs(f.x - s.x) < 22 && Math.abs(f.y - (H - 64)) < 24) {
            boom(d, f.x, f.y, '#fff');
            f.state = 'form';
            f.y = -50;
            hurt(g);
          }
        });

        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
          return p.life > 0;
        });

        if (!d.foes.length) {
          g.score += 300;
          g.set('Score', U.fmt(g.score));
          spawnWave(d);
          g.set('Wave', d.wave);
          Milo.sound.win();
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, s = d.ship;
        c.fillStyle = '#03030e'; c.fillRect(0, 0, W, H);
        d.stars.forEach(function (st) {
          c.globalAlpha = st.z;
          c.fillStyle = '#cfe0ff';
          c.fillRect(st.x, st.y, 1.6 * st.z, 2.4 * st.z);
        });
        c.globalAlpha = 1;

        d.foes.forEach(function (f) {
          var col = f.kind ? '#fb7185' : '#22d3ee';
          c.save();
          c.translate(f.x, f.y);
          if (f.state === 'dive') c.rotate(Math.sin(f.dive.t * 3) * .5);
          c.fillStyle = col;
          c.beginPath();
          c.moveTo(0, 14); c.lineTo(-16, -4); c.lineTo(-6, -10);
          c.lineTo(6, -10); c.lineTo(16, -4);
          c.closePath(); c.fill();
          c.fillStyle = '#fff';
          c.beginPath(); c.arc(0, 0, 3.4, 0, 7); c.fill();
          c.restore();
        });

        c.fillStyle = '#ffe066';
        d.shots.forEach(function (b) { c.fillRect(b.x - 2, b.y - 10, 4, 18); });
        c.fillStyle = '#ff5b7f';
        d.enemyShots.forEach(function (b) {
          c.beginPath(); c.arc(b.x, b.y, 4.5, 0, 7); c.fill();
        });

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - 2, p.y - 2, 4, 4);
        });
        c.globalAlpha = 1;

        if (s.inv <= 0 || Math.floor(g.t * 10) % 2) {
          c.fillStyle = '#e9eeff';
          c.beginPath();
          c.moveTo(s.x, H - 84); c.lineTo(s.x - 20, H - 46); c.lineTo(s.x + 20, H - 46);
          c.closePath(); c.fill();
          c.fillStyle = '#22d3ee';
          c.beginPath(); c.arc(s.x, H - 62, 4.5, 0, 7); c.fill();
        }
      }
    });

    function boom(d, x, y, col) {
      for (var i = 0; i < 14; i++) {
        var a = Math.random() * 6.28, s = U.rand(50, 240);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: .5, max: .5, col: col });
      }
    }

    function hurt(g) {
      var d = g.data;
      d.ship.lives--;
      d.ship.inv = 2.2;
      g.set('Lives', Math.max(0, d.ship.lives));
      boom(d, d.ship.x, H - 64, '#fff');
      Milo.sound.explode();
      if (d.ship.lives <= 0) {
        g.gameOver({ text: 'You reached wave ' + d.wave + '.' });
      }
    }
  }

  window.Milo.register({
    id: 'galaxy-raid', title: 'Galaxy Raid', emo: '🛸', category: 'Arcade',
    tagline: 'Formation flyers that dive at you',
    description: 'Enemies assemble into a swaying formation overhead, then peel off one or ' +
      'two at a time and swoop down along a looping path, firing as they come. Ships shot ' +
      'while diving are worth more than double what they are worth sitting in formation — ' +
      'so the greedy play is to let them come.',
    controls: ['← →', 'Space fire'],
    colors: ['#03030e', '#22d3ee'],
    tags: ['classic', 'shooter', 'space', 'arcade'],
    mount: mount
  });
})();
