/* Asteroid Field — rotate, thrust, shoot; rocks split when hit. */
(function () {
  'use strict';
  var W = 860, H = 620;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.ship = { x: W / 2, y: H / 2, vx: 0, vy: 0, a: -Math.PI / 2, cool: 0, inv: 2.5 };
      d.rocks = [];
      d.shots = [];
      d.parts = [];
      d.lives = 3;
      d.wave = 1;
      spawnWave(d);
      g.set('Score', 0);
      g.set('Wave', 1);
      g.set('Lives', 3);
    }

    function spawnWave(d) {
      for (var i = 0; i < 3 + d.wave; i++) {
        // Keep new rocks away from the middle where the ship respawns.
        var edge = Math.random() < .5;
        d.rocks.push(mkRock(
          edge ? U.rand(0, W) : (Math.random() < .5 ? 0 : W),
          edge ? (Math.random() < .5 ? 0 : H) : U.rand(0, H),
          3
        ));
      }
    }

    function mkRock(x, y, size) {
      var pts = [];
      var n = 9;
      for (var i = 0; i < n; i++) pts.push(0.68 + Math.random() * 0.5);
      return {
        x: x, y: y, size: size, r: size * 15,
        vx: U.rand(-70, 70) * (4 - size) * .5, vy: U.rand(-70, 70) * (4 - size) * .5,
        a: Math.random() * 6.28, spin: U.rand(-1.4, 1.4), pts: pts
      };
    }

    function wrap(o) {
      if (o.x < 0) o.x += W; if (o.x > W) o.x -= W;
      if (o.y < 0) o.y += H; if (o.y > H) o.y -= H;
    }

    function boom(d, x, y, n, col) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.28, s = U.rand(40, 260);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(.3, .8), max: .8, col: col });
      }
    }

    return Milo.arcade(host, {
      id: 'asteroid-field',
      w: W, h: H, bg: '#03030c',
      stats: ['Score', 'Wave', 'Lives'],
      touch: 'dpad',
      touchButtons: [{ key: 'action', label: 'FIRE' }],
      emo: '☄️',
      start: {
        title: 'Asteroid Field',
        text: 'Rotate with left and right, thrust with up, and shoot the rocks. Big ones ' +
          'break into two mediums, mediums into two smalls — so it gets busier before it ' +
          'gets better. Everything wraps around the screen.',
        keys: ['← → rotate', '↑ thrust', 'Space fire']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, i = g.input, s = d.ship;

        if (i.down('left')) s.a -= 3.6 * dt;
        if (i.down('right')) s.a += 3.6 * dt;
        s.thrusting = i.down('up');
        if (s.thrusting) {
          s.vx += Math.cos(s.a) * 340 * dt;
          s.vy += Math.sin(s.a) * 340 * dt;
          if (g.frame % 3 === 0) {
            d.parts.push({
              x: s.x - Math.cos(s.a) * 14, y: s.y - Math.sin(s.a) * 14,
              vx: -Math.cos(s.a) * 120 + U.rand(-30, 30), vy: -Math.sin(s.a) * 120 + U.rand(-30, 30),
              life: .3, max: .3, col: '#ffb020'
            });
          }
        }
        var drag = Math.pow(0.55, dt);
        s.vx *= drag; s.vy *= drag;
        s.x += s.vx * dt; s.y += s.vy * dt;
        wrap(s);
        s.cool -= dt;
        s.inv = Math.max(0, s.inv - dt);

        if (i.down('action') && s.cool <= 0) {
          s.cool = 0.22;
          d.shots.push({
            x: s.x + Math.cos(s.a) * 16, y: s.y + Math.sin(s.a) * 16,
            vx: Math.cos(s.a) * 560 + s.vx, vy: Math.sin(s.a) * 560 + s.vy, life: 1.1
          });
          Milo.sound.tone({ f: 760, f2: 380, d: .05, v: .05, type: 'square' });
        }

        d.shots = d.shots.filter(function (b) {
          b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
          wrap(b);
          return b.life > 0;
        });

        for (var r = d.rocks.length - 1; r >= 0; r--) {
          var rock = d.rocks[r];
          rock.x += rock.vx * dt; rock.y += rock.vy * dt; rock.a += rock.spin * dt;
          wrap(rock);

          for (var b = d.shots.length - 1; b >= 0; b--) {
            var shot = d.shots[b];
            if (U.dist(shot.x, shot.y, rock.x, rock.y) > rock.r) continue;
            d.shots.splice(b, 1);
            d.rocks.splice(r, 1);
            g.score += (4 - rock.size) * 30;
            g.set('Score', U.fmt(g.score));
            boom(d, rock.x, rock.y, 14, '#c9d0f0');
            Milo.sound.explode();
            if (rock.size > 1) {
              for (var k = 0; k < 2; k++) d.rocks.push(mkRock(rock.x, rock.y, rock.size - 1));
            }
            break;
          }

          if (s.inv <= 0 && U.dist(s.x, s.y, rock.x, rock.y) < rock.r + 12) {
            d.lives--;
            g.set('Lives', Math.max(0, d.lives));
            boom(d, s.x, s.y, 26, '#fff');
            Milo.sound.explode();
            s.x = W / 2; s.y = H / 2; s.vx = 0; s.vy = 0; s.inv = 2.5;
            if (d.lives <= 0) { g.gameOver({ text: 'You cleared ' + (d.wave - 1) + ' waves.' }); return; }
          }
        }

        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
          return p.life > 0;
        });

        if (!d.rocks.length) {
          d.wave++;
          g.set('Wave', d.wave);
          spawnWave(d);
          Milo.sound.win();
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, s = d.ship;
        c.fillStyle = '#03030c'; c.fillRect(0, 0, W, H);

        c.fillStyle = 'rgba(200,215,255,.5)';
        for (var st = 0; st < 60; st++) {
          c.fillRect(U.hash2(st, 1, 9) * W, U.hash2(st, 2, 9) * H, 1.5, 1.5);
        }

        c.strokeStyle = '#c9d0f0'; c.lineWidth = 2;
        d.rocks.forEach(function (rock) {
          c.save();
          c.translate(rock.x, rock.y);
          c.rotate(rock.a);
          c.beginPath();
          rock.pts.forEach(function (m, i) {
            var a = (i / rock.pts.length) * 6.283;
            var px = Math.cos(a) * rock.r * m, py = Math.sin(a) * rock.r * m;
            if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
          });
          c.closePath(); c.stroke();
          c.restore();
        });

        c.fillStyle = '#ffe066';
        d.shots.forEach(function (b) {
          c.beginPath(); c.arc(b.x, b.y, 3, 0, 7); c.fill();
        });

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
        });
        c.globalAlpha = 1;

        if (s.inv <= 0 || Math.floor(g.t * 10) % 2) {
          c.save();
          c.translate(s.x, s.y);
          c.rotate(s.a);
          c.strokeStyle = '#22d3ee'; c.lineWidth = 2;
          c.beginPath();
          c.moveTo(16, 0); c.lineTo(-11, -10); c.lineTo(-6, 0); c.lineTo(-11, 10);
          c.closePath(); c.stroke();
          c.restore();
        }
      }
    });
  }

  window.Milo.register({
    id: 'asteroid-field', title: 'Asteroid Field', emo: '☄️', category: 'Arcade',
    tagline: 'Shoot the rocks, mind the momentum',
    description: 'Your ship has thrust and inertia but no brakes — pointing where you want ' +
      'to go is only half the problem. Shooting a big rock splits it into two mediums and ' +
      'each of those into two smalls, so a full wave gets much busier before it clears. ' +
      'Everything wraps around the edges of the screen, including you.',
    controls: ['← → rotate', '↑ thrust', 'Space fire'],
    colors: ['#03030c', '#c9d0f0'],
    tags: ['classic', 'shooter', 'space', 'physics'],
    mount: mount
  });
})();
