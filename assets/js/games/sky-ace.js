/* Sky Ace — dawn-patrol biplane dogfights with arcing bullets and wave medals. */
(function () {
  'use strict';
  var W = 800, H = 560, GROUND = 508;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.p = { x: 200, y: 240, vy: 0, hp: 3, inv: 2, cool: 0 };
      d.bullets = [];
      d.foeShots = [];
      d.foes = [];
      d.smoke = [];
      d.debris = [];
      d.clouds = [];
      d.medals = [];
      d.wave = 0;
      d.spawnLeft = 0;
      d.spawnT = 0;
      d.betweenT = 1.5;
      d.hitsTaken = 0;
      d.escaped = 0;
      d.banner = ''; d.bannerT = 0;
      d.scroll = 0;
      d.shake = 0;
      d.firing = false;
      for (var i = 0; i < 9; i++) {
        d.clouds.push({ x: Math.random() * W, y: U.rand(50, 380), s: U.rand(.6, 1.5), z: U.rand(.3, 1) });
      }
      g.set('Score', 0);
      g.set('Wave', 0);
      g.set('Plane', '✈✈✈');
    }

    function setHp(g) {
      var s = '', n = Math.max(0, g.data.p.hp);
      for (var i = 0; i < n; i++) s += '✈';
      g.set('Plane', s || '—');
    }

    function startWave(g) {
      var d = g.data;
      d.wave++;
      g.set('Wave', d.wave);
      d.spawnLeft = 4 + d.wave * 2;
      d.spawnT = .6;
      d.hitsTaken = 0;
      d.escaped = 0;
      d.banner = 'WAVE ' + d.wave;
      d.bannerT = 1.5;
      Milo.sound.tone({ f: 392, f2: 523, d: .25, v: .08, type: 'triangle' });
    }

    function spawnFoe(d) {
      var roll = Math.random(), kind = 'scout';
      if (d.wave >= 2 && roll < .3) kind = 'ace';
      else if (d.wave >= 3 && roll < .55) kind = 'gunner';
      d.foes.push({
        kind: kind,
        x: W + 50, y: U.rand(80, 420),
        cx: W + 50,
        ph: Math.random() * 6.28,
        vx: -((kind === 'gunner' ? 85 : kind === 'ace' ? 105 : 130) + d.wave * 7),
        hp: kind === 'gunner' ? 3 : kind === 'ace' ? 2 : 1,
        cool: U.rand(1.2, 2.6),
        t: Math.random() * 6
      });
    }

    function fire(g) {
      var d = g.data, p = d.p;
      if (p.cool > 0) return;
      p.cool = .18;
      d.bullets.push({
        x: p.x + 30, y: p.y,
        vx: 560, vy: p.vy * .35, r: 3
      });
      Milo.sound.tone({ f: 820, f2: 420, d: .05, v: .05, type: 'square' });
    }

    function puffSmoke(d, x, y, col, big) {
      d.smoke.push({
        x: x, y: y, vx: U.rand(-30, -10), vy: U.rand(-16, 6),
        r: big ? U.rand(7, 13) : U.rand(3, 6),
        life: U.rand(.5, .9), max: .9, col: col || '#8a8f96'
      });
    }

    function wreck(g, f) {
      var d = g.data;
      for (var i = 0; i < 10; i++) {
        var a = Math.random() * 6.28, s = U.rand(40, 220);
        d.debris.push({
          x: f.x, y: f.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60,
          rot: Math.random() * 6.28, spin: U.rand(-10, 10),
          w: U.rand(4, 12), life: 1, max: 1, col: Math.random() < .5 ? '#a83232' : '#5a3a22'
        });
      }
      for (var j = 0; j < 6; j++) puffSmoke(d, f.x, f.y, '#3c3f44', true);
      d.shake = Math.max(d.shake, .5);
      Milo.sound.explode();
    }

    return Milo.arcade(host, {
      id: 'sky-ace',
      w: W, h: H, bg: '#5a6ea0',
      stats: ['Score', 'Wave', 'Plane'],
      emo: '🛩️',
      touch: 'dpad',
      touchButtons: [{ key: 'action', label: 'FIRE' }],
      start: {
        title: 'Sky Ace',
        text: 'Climb, dive and shoot down the red squadron. Your bullets drop as they ' +
          'fly, so lead your shots — and fly a clean wave to earn the gold medal.',
        keys: ['↑ ↓ / W S climb & dive', 'Space / Click fire', "Don't hit the ground"]
      },
      init: reset,
      onPointer: function (g, type, x, y) {
        var d = g.data;
        if (type === 'down') { d.firing = true; d.ptrY = y; }
        if (type === 'move' && g.input.pdown) d.ptrY = y;
        if (type === 'up') { d.firing = false; d.ptrY = null; }
      },

      update: function (g, dt) {
        var d = g.data, p = d.p, i = g.input;

        d.scroll += 150 * dt;
        var wantVy = 0;
        if (i.down('up')) wantVy = -250;
        else if (i.down('down')) wantVy = 250;
        else if (d.ptrY != null) wantVy = U.clamp((d.ptrY - p.y) * 3, -250, 250);
        p.vy += (wantVy - p.vy) * Math.min(1, 6 * dt);
        p.y += p.vy * dt;
        if (i.down('left')) p.x -= 160 * dt;
        if (i.down('right')) p.x += 160 * dt;
        p.x = U.clamp(p.x, 90, 430);

        if (p.y > GROUND - 18) {
          // clipped the ground
          p.y = GROUND - 18; p.vy = -120;
          hurt(g);
          if (g.state === 'over') return;
        }
        if (p.y < 42) { p.y = 42; p.vy = 0; }

        p.cool -= dt;
        p.inv = Math.max(0, p.inv - dt);
        d.shake = Math.max(0, d.shake - dt * 3);
        d.bannerT -= dt;

        if (i.down('action') || d.firing) fire(g);
        if (p.hp === 1 && Math.random() < .4) puffSmoke(d, p.x - 24, p.y, '#3c3f44');

        d.clouds.forEach(function (cl) {
          cl.x -= (30 + cl.z * 60) * dt;
          if (cl.x < -120) { cl.x = W + 120; cl.y = U.rand(50, 380); }
        });

        /* waves */
        if (d.spawnLeft > 0) {
          d.spawnT -= dt;
          if (d.spawnT <= 0) {
            d.spawnT = U.rand(.7, 1.6) * Math.max(.4, 1 - d.wave * .06);
            d.spawnLeft--;
            spawnFoe(d);
          }
        } else if (!d.foes.length) {
          d.betweenT -= dt;
          if (d.betweenT <= 0) {
            if (d.wave > 0) awardMedal(g);
            startWave(g);
            d.betweenT = 2.2;
          }
        }

        /* enemy planes */
        for (var k = d.foes.length - 1; k >= 0; k--) {
          var f = d.foes[k];
          f.t += dt;
          f.cx += f.vx * dt;
          if (f.kind === 'ace') {
            // the ace corkscrews forward in loops
            if (f.baseY == null) f.baseY = f.y;
            f.ph += 2.4 * dt;
            f.x = f.cx + Math.cos(f.ph) * 48;
            f.y = f.baseY + Math.sin(f.ph) * 78;
          } else {
            f.x = f.cx;
            f.y += Math.sin(f.t * (f.kind === 'gunner' ? 1.2 : 2.2)) * 40 * dt;
          }
          f.y = U.clamp(f.y, 60, GROUND - 40);

          if (f.x < -60) {
            d.foes.splice(k, 1);
            d.escaped++;
            continue;
          }

          // return fire (their bullets arc too)
          f.cool -= dt;
          if (f.cool <= 0 && f.x > p.x + 80 && f.x < W - 20 && f.kind !== 'scout') {
            f.cool = U.rand(1.4, 2.8) / (1 + d.wave * .05);
            var lead = U.clamp((f.x - p.x) / 300, 0, 1.4);
            var ang = Math.atan2((p.y + p.vy * lead * .5) - f.y, p.x - f.x);
            var bs = 250 + d.wave * 8;
            d.foeShots.push({ x: f.x - 24, y: f.y, vx: Math.cos(ang) * bs, vy: Math.sin(ang) * bs - 30, r: 3.4 });
            Milo.sound.tone({ f: 480, f2: 300, d: .05, v: .04, type: 'square' });
          }

          // ram the player?
          if (p.inv <= 0 && U.dist(f.x, f.y, p.x, p.y) < 30) {
            wreck(g, f);
            d.foes.splice(k, 1);
            hurt(g);
            if (g.state === 'over') return;
            continue;
          }

          // player bullets
          for (var b = d.bullets.length - 1; b >= 0; b--) {
            var bl = d.bullets[b];
            if (U.dist(bl.x, bl.y, f.x, f.y) < 24) {
              d.bullets.splice(b, 1);
              f.hp--;
              puffSmoke(d, f.x, f.y, '#3c3f44');
              if (f.hp <= 0) {
                wreck(g, f);
                d.foes.splice(k, 1);
                g.score += f.kind === 'ace' ? 50 : f.kind === 'gunner' ? 40 : 20;
                g.set('Score', U.fmt(g.score));
              } else Milo.sound.hit();
              break;
            }
          }
        }

        /* bullets arc under gravity */
        d.bullets = d.bullets.filter(function (b) {
          b.vy += 130 * dt;
          b.x += b.vx * dt; b.y += b.vy * dt;
          return b.x < W + 30 && b.y < GROUND;
        });
        d.foeShots = d.foeShots.filter(function (b) {
          b.vy += 100 * dt;
          b.x += b.vx * dt; b.y += b.vy * dt;
          if (p.inv <= 0 && U.dist(b.x, b.y, p.x, p.y) < 18) {
            hurt(g);
            return false;
          }
          return b.x > -30 && b.y < GROUND;
        });
        if (g.state === 'over') return;

        d.smoke = d.smoke.filter(function (s) {
          s.x += s.vx * dt; s.y += s.vy * dt; s.r += 6 * dt; s.life -= dt;
          return s.life > 0;
        });
        d.debris = d.debris.filter(function (q) {
          q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 500 * dt;
          q.rot += q.spin * dt; q.life -= dt;
          return q.life > 0 && q.y < GROUND;
        });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, p = d.p;
        // dawn sky
        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#54679c');
        sky.addColorStop(.5, '#c97f6e');
        sky.addColorStop(.85, '#f2b56b');
        sky.addColorStop(1, '#f2b56b');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);

        c.save();
        if (d.shake > 0) c.translate(U.rand(-1, 1) * d.shake * 4, U.rand(-1, 1) * d.shake * 4);

        // low sun
        c.fillStyle = 'rgba(255,220,150,.5)';
        c.beginPath(); c.arc(620, 400, 60, 0, 7); c.fill();
        c.fillStyle = '#ffe9b8';
        c.beginPath(); c.arc(620, 400, 38, 0, 7); c.fill();

        // clouds
        d.clouds.forEach(function (cl) {
          c.globalAlpha = .25 + cl.z * .3;
          c.fillStyle = '#ffe7cf';
          c.beginPath();
          c.ellipse(cl.x, cl.y, 52 * cl.s, 16 * cl.s, 0, 0, 7);
          c.ellipse(cl.x + 30 * cl.s, cl.y - 8 * cl.s, 30 * cl.s, 12 * cl.s, 0, 0, 7);
          c.fill();
        });
        c.globalAlpha = 1;

        // patchwork fields scroll below
        var fw = 130;
        for (var fx = -((d.scroll) % (fw * 2)) - fw * 2; fx < W + fw; fx += fw) {
          var idx = Math.floor((fx + d.scroll) / fw);
          c.fillStyle = (idx % 2 === 0) ? '#4d5e2a' : '#5f6e33';
          c.fillRect(fx, GROUND, fw + 1, H - GROUND);
        }
        c.fillStyle = '#3a4720';
        c.fillRect(0, GROUND, W, 5);

        // smoke
        d.smoke.forEach(function (s) {
          c.globalAlpha = Math.max(0, s.life / s.max) * .7;
          c.fillStyle = s.col;
          c.beginPath(); c.arc(s.x, s.y, s.r, 0, 7); c.fill();
        });
        c.globalAlpha = 1;

        // debris
        d.debris.forEach(function (q) {
          c.save();
          c.globalAlpha = Math.max(0, q.life / q.max);
          c.translate(q.x, q.y); c.rotate(q.rot);
          c.fillStyle = q.col;
          c.fillRect(-q.w / 2, -q.w / 6, q.w, q.w / 3);
          c.restore();
        });
        c.globalAlpha = 1;

        // enemy planes (red triplanes)
        d.foes.forEach(function (f) {
          drawPlane(c, f.x, f.y, Math.PI, f.kind === 'ace' ? Math.cos(f.ph) * .5 : Math.sin(f.t * 2) * .08,
            f.kind === 'gunner' ? '#7c2626' : '#a83232', '#d9c8a0', f.kind !== 'scout');
        });

        // player bullets
        d.bullets.forEach(function (b) {
          c.strokeStyle = '#ffe9a0'; c.lineWidth = 2.4; c.lineCap = 'round';
          c.beginPath();
          c.moveTo(b.x, b.y);
          c.lineTo(b.x - b.vx * .02, b.y - b.vy * .02);
          c.stroke();
        });
        // enemy bullets
        d.foeShots.forEach(function (b) {
          c.strokeStyle = '#ffb08a'; c.lineWidth = 2.4;
          c.beginPath();
          c.moveTo(b.x, b.y);
          c.lineTo(b.x - b.vx * .02, b.y - b.vy * .02);
          c.stroke();
        });

        // player biplane
        if (p.inv <= 0 || Math.floor(g.t * 14) % 2 === 0) {
          drawPlane(c, p.x, p.y, 0, p.vy * .0011, '#4f7a34', '#e8dcb8', true);
        }

        // medal shelf
        c.textAlign = 'left';
        c.font = '18px Outfit, sans-serif';
        for (var m = 0; m < d.medals.length && m < 14; m++) {
          c.fillText(d.medals[m], 14 + m * 22, H - 14);
        }

        if (d.bannerT > 0 && d.banner) {
          c.globalAlpha = Math.min(1, d.bannerT);
          c.textAlign = 'center';
          c.fillStyle = '#fff3d9';
          c.font = '800 32px Outfit, sans-serif';
          c.fillText(d.banner, W / 2, 110);
          c.globalAlpha = 1;
        }
        c.restore();
      }
    });

    /* a chunky little biplane, dir=0 faces right, Math.PI faces left */
    function drawPlane(c, x, y, dir, pitch, body, wing, biplane) {
      c.save();
      c.translate(x, y);
      if (dir) c.scale(-1, 1);
      c.rotate(dir ? -pitch : pitch);
      // fuselage
      c.fillStyle = body;
      U.roundRect(c, -26, -5, 50, 11, 5); c.fill();
      // tail
      c.fillStyle = body;
      c.beginPath();
      c.moveTo(-26, 0); c.lineTo(-36, -10); c.lineTo(-30, 0);
      c.closePath(); c.fill();
      c.fillRect(-36, -2, 10, 4);
      // wings
      c.fillStyle = wing;
      U.roundRect(c, -8, 2, 30, 5, 2.5); c.fill();
      if (biplane) { U.roundRect(c, -8, -14, 30, 5, 2.5); c.fill(); }
      // struts
      c.strokeStyle = 'rgba(40,30,15,.7)'; c.lineWidth = 1.6;
      if (biplane) {
        c.beginPath();
        c.moveTo(-4, -10); c.lineTo(-4, 3);
        c.moveTo(18, -10); c.lineTo(18, 3);
        c.stroke();
      }
      // prop disc
      c.fillStyle = 'rgba(255,255,255,.35)';
      c.beginPath(); c.ellipse(27, 0, 3, 12, 0, 0, 7); c.fill();
      // cockpit
      c.fillStyle = 'rgba(20,25,35,.8)';
      c.beginPath(); c.arc(2, -5, 3.6, 0, 7); c.fill();
      c.restore();
    }

    function awardMedal(g) {
      var d = g.data, medal, bonus;
      if (d.hitsTaken === 0 && d.escaped === 0) { medal = '🥇'; bonus = 300; }
      else if (d.hitsTaken <= 1 && d.escaped <= 1) { medal = '🥈'; bonus = 150; }
      else { medal = '🥉'; bonus = 50; }
      d.medals.push(medal);
      g.score += bonus;
      g.set('Score', U.fmt(g.score));
      d.banner = medal + ' +' + bonus;
      d.bannerT = 2;
      Milo.sound.coin();
    }

    function hurt(g) {
      var d = g.data, p = d.p;
      if (p.inv > 0) return;
      p.hp--;
      p.inv = 2;
      d.hitsTaken++;
      d.shake = Math.max(d.shake, .8);
      setHp(g);
      for (var i = 0; i < 8; i++) puffSmoke(d, p.x, p.y, '#3c3f44', true);
      Milo.sound.hit();
      if (p.hp <= 0) {
        Milo.sound.explode();
        g.gameOver({
          emo: '🛩️', title: 'Shot Down',
          text: 'Wave ' + d.wave + ', with ' + d.medals.length + ' medal' + (d.medals.length === 1 ? '' : 's') + ' on your chest.'
        });
      }
    }
  }

  window.Milo.register({
    id: 'sky-ace', title: 'Sky Ace', emo: '🛩️', category: 'Action',
    tagline: 'Biplane dogfights at dawn',
    description: 'A side-view dogfight where physics matters: your bullets drop as they ' +
      'travel, so you aim above distant planes and lead the fast ones. Red scouts fly ' +
      'straight, gunners shoot back, and enemy aces corkscrew through loops that make ' +
      'them maddening to hit. Finish a wave without taking a hit or letting anyone ' +
      'escape past you and you earn the gold medal worth 300.',
    controls: ['↑ ↓ / W S', 'Space / Click', '← → trim'],
    colors: ['#c97f6e', '#4f7a34'],
    tags: ['planes', 'dogfight', 'shooter', 'waves', 'medals'],
    mount: mount
  });
})();
