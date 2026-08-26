/* Turret Tower — one gun, every direction, and a heat gauge that punishes spray. */
(function () {
  'use strict';
  var W = 800, H = 600, CX = W / 2, CY = H / 2;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.ang = -Math.PI / 2;
      d.heat = 0;
      d.locked = 0;      // overheat vent timer
      d.cool = 0;
      d.hp = 10;
      d.wave = 0;
      d.foes = [];
      d.bullets = [];
      d.casings = [];
      d.parts = [];
      d.orbs = [];
      d.spawnLeft = 0;
      d.spawnT = 0;
      d.betweenT = 1.5;
      d.banner = ''; d.bannerT = 0;
      d.shake = 0;
      d.firing = false;
      d.recoil = 0;
      g.set('Score', 0);
      g.set('Wave', 0);
      g.set('Tower', 10);
    }

    function startWave(g) {
      var d = g.data;
      d.wave++;
      g.set('Wave', d.wave);
      d.spawnLeft = 8 + d.wave * 4;
      d.spawnT = .4;
      d.banner = 'WAVE ' + d.wave;
      d.bannerT = 1.5;
      Milo.sound.tone({ f: 120, f2: 260, d: .4, v: .1, type: 'sawtooth' });
    }

    function spawnFoe(d) {
      var a = Math.random() * 6.283;
      var r = Math.max(W, H) * .62;
      var roll = Math.random(), kind = 'walker';
      if (d.wave >= 4 && roll < .15) kind = 'bomber';
      else if (d.wave >= 2 && roll < .45) kind = 'skimmer';
      d.foes.push({
        kind: kind,
        a: a, dist: r,
        drift: kind === 'skimmer' ? (Math.random() < .5 ? 1 : -1) * U.rand(.5, .9) : 0,
        sp: (kind === 'bomber' ? 34 : kind === 'skimmer' ? 62 : 48) + d.wave * 3,
        hp: kind === 'bomber' ? 8 + d.wave : kind === 'skimmer' ? 2 : 3 + Math.floor(d.wave / 3),
        r: kind === 'bomber' ? 22 : kind === 'skimmer' ? 11 : 14,
        t: Math.random() * 6
      });
    }

    function sparks(d, x, y, col, n) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.28, s = U.rand(60, 320);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(.15, .45), max: .45, col: col, w: U.rand(4, 10) });
      }
    }

    function fire(g) {
      var d = g.data;
      if (d.locked > 0 || d.cool > 0) return;
      d.cool = .11;
      d.heat += 8.5;
      d.recoil = 1;
      // hot barrel throws shots wide
      var wobble = (d.heat / 100) * .22;
      var a = d.ang + U.rand(-wobble, wobble);
      d.bullets.push({ x: CX + Math.cos(a) * 46, y: CY + Math.sin(a) * 46, vx: Math.cos(a) * 640, vy: Math.sin(a) * 640 });
      d.casings.push({
        x: CX + Math.cos(d.ang) * 20, y: CY + Math.sin(d.ang) * 20,
        vx: Math.cos(d.ang + 2.2) * U.rand(90, 160), vy: Math.sin(d.ang + 2.2) * U.rand(90, 160),
        rot: Math.random() * 6.28, spin: U.rand(-12, 12), life: .8
      });
      Milo.sound.tone({ f: 620 - d.heat * 2, f2: 220, d: .05, v: .06, type: 'square' });
      if (d.heat >= 100) {
        d.heat = 100;
        d.locked = 2.6;
        d.banner = 'OVERHEAT!';
        d.bannerT = 2.4;
        Milo.sound.tone({ f: 220, f2: 60, d: .7, v: .14, type: 'sawtooth' });
      }
    }

    return Milo.arcade(host, {
      id: 'turret-tower',
      w: W, h: H, bg: '#101216',
      stats: ['Score', 'Wave', 'Tower'],
      emo: '🗼',
      touch: 'dpad',
      touchButtons: [{ key: 'action', label: 'FIRE' }],
      start: {
        title: 'Turret Tower',
        text: 'Bots close in from every bearing. Swing the turret with the mouse and ' +
          'fire in bursts — a hot barrel shoots crooked, and a maxed gauge locks the ' +
          'gun for two and a half long seconds.',
        keys: ['Mouse aim', 'Click / Space fire', '← → also rotate']
      },
      init: reset,
      onPointer: function (g, type, x, y) {
        var d = g.data;
        d.mouse = { x: x, y: y };
        if (type === 'down') d.firing = true;
        if (type === 'up') d.firing = false;
      },

      update: function (g, dt) {
        var d = g.data, i = g.input;

        if (d.mouse) {
          var want = Math.atan2(d.mouse.y - CY, d.mouse.x - CX);
          var diff = want - d.ang;
          while (diff > Math.PI) diff -= 6.283;
          while (diff < -Math.PI) diff += 6.283;
          d.ang += diff * Math.min(1, 14 * dt);
        }
        if (i.down('left')) { d.ang -= 3.4 * dt; d.mouse = null; }
        if (i.down('right')) { d.ang += 3.4 * dt; d.mouse = null; }

        d.cool -= dt;
        d.recoil = Math.max(0, d.recoil - dt * 6);
        d.shake = Math.max(0, d.shake - dt * 3);
        d.bannerT -= dt;
        if (d.locked > 0) {
          d.locked -= dt;
          if (d.locked <= 0) { d.heat = 30; Milo.sound.blip(); }
          if (Math.random() < .5) {
            d.parts.push({
              x: CX + Math.cos(d.ang) * 40, y: CY + Math.sin(d.ang) * 40,
              vx: U.rand(-20, 20), vy: U.rand(-70, -30), life: .8, max: .8, col: '#cfd6dd', w: U.rand(6, 12)
            });
          }
        } else {
          d.heat = Math.max(0, d.heat - (d.firing || i.down('action') ? 20 : 34) * dt);
        }

        if (i.down('action') || d.firing) fire(g);

        /* waves */
        if (d.spawnLeft > 0) {
          d.spawnT -= dt;
          if (d.spawnT <= 0) {
            d.spawnT = Math.max(.18, .8 - d.wave * .045);
            d.spawnLeft--;
            spawnFoe(d);
          }
        } else if (!d.foes.length) {
          d.betweenT -= dt;
          if (d.betweenT <= 0) {
            if (d.wave > 0) {
              g.score += 30 + d.wave * 15;
              g.set('Score', U.fmt(g.score));
              d.heat = Math.max(0, d.heat - 40);
            }
            startWave(g);
            d.betweenT = 2.4;
          }
        }

        /* foes advance in polar space */
        for (var k = d.foes.length - 1; k >= 0; k--) {
          var f = d.foes[k];
          f.t += dt;
          f.dist -= f.sp * dt;
          f.a += f.drift * dt * (60 / Math.max(60, f.dist));
          f.x = CX + Math.cos(f.a) * f.dist;
          f.y = CY + Math.sin(f.a) * f.dist;
          if (f.dist < 62) {
            d.foes.splice(k, 1);
            var dmg = f.kind === 'bomber' ? 3 : 1;
            d.hp -= dmg;
            d.shake = Math.max(d.shake, .9);
            g.set('Tower', Math.max(0, d.hp));
            sparks(d, f.x, f.y, '#ff8c2a', 18);
            Milo.sound.explode();
            if (d.hp <= 0) {
              g.gameOver({ emo: '💥', title: 'Tower Destroyed', text: 'It fell on wave ' + d.wave + '.' });
              return;
            }
          }
        }

        /* bullets */
        for (var b = d.bullets.length - 1; b >= 0; b--) {
          var bl = d.bullets[b];
          bl.x += bl.vx * dt; bl.y += bl.vy * dt;
          if (bl.x < -20 || bl.x > W + 20 || bl.y < -20 || bl.y > H + 20) { d.bullets.splice(b, 1); continue; }
          for (var j = d.foes.length - 1; j >= 0; j--) {
            var fo = d.foes[j];
            if (U.dist(bl.x, bl.y, fo.x, fo.y) < fo.r + 4) {
              d.bullets.splice(b, 1);
              fo.hp--;
              sparks(d, bl.x, bl.y, '#ffd257', 4);
              if (fo.hp <= 0) {
                d.foes.splice(j, 1);
                sparks(d, fo.x, fo.y, fo.kind === 'bomber' ? '#ff5b3c' : '#d08a3c', fo.kind === 'bomber' ? 24 : 12);
                g.score += fo.kind === 'bomber' ? 50 : fo.kind === 'skimmer' ? 20 : 10;
                g.set('Score', U.fmt(g.score));
                if (fo.kind === 'bomber') d.shake = Math.max(d.shake, .5);
                Milo.sound.explode();
                if (Math.random() < .18) {
                  d.orbs.push({ x: fo.x, y: fo.y, kind: Math.random() < .3 ? 'repair' : 'coolant' });
                }
              } else Milo.sound.hit();
              break;
            }
          }
        }

        /* pickups drift home to the tower */
        d.orbs = d.orbs.filter(function (ob) {
          var a = Math.atan2(CY - ob.y, CX - ob.x);
          ob.x += Math.cos(a) * 130 * dt;
          ob.y += Math.sin(a) * 130 * dt;
          if (U.dist(ob.x, ob.y, CX, CY) < 52) {
            if (ob.kind === 'coolant') { d.heat = Math.max(0, d.heat - 35); }
            else { d.hp = Math.min(10, d.hp + 1); g.set('Tower', d.hp); }
            Milo.sound.powerup();
            return false;
          }
          return true;
        });

        d.casings = d.casings.filter(function (cs) {
          cs.x += cs.vx * dt; cs.y += cs.vy * dt;
          cs.vy += 500 * dt; cs.rot += cs.spin * dt; cs.life -= dt;
          return cs.life > 0;
        });
        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .93; p.vy *= .93; p.life -= dt;
          return p.life > 0;
        });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.fillStyle = '#101216'; c.fillRect(0, 0, W, H);
        c.save();
        if (d.shake > 0) c.translate(U.rand(-1, 1) * d.shake * 5, U.rand(-1, 1) * d.shake * 5);

        // hazard range rings
        for (var rr = 1; rr <= 4; rr++) {
          c.strokeStyle = 'rgba(160,170,185,' + (0.05 + rr * .008) + ')';
          c.lineWidth = 1;
          c.beginPath(); c.arc(CX, CY, 70 + rr * 78, 0, 7); c.stroke();
        }
        // kill line
        c.strokeStyle = 'rgba(255,140,42,.28)';
        c.setLineDash([8, 8]);
        c.beginPath(); c.arc(CX, CY, 62, 0, 7); c.stroke();
        c.setLineDash([]);

        // casings
        d.casings.forEach(function (cs) {
          c.save();
          c.globalAlpha = Math.min(1, cs.life * 2);
          c.translate(cs.x, cs.y); c.rotate(cs.rot);
          c.fillStyle = '#caa64a';
          c.fillRect(-3, -1.5, 6, 3);
          c.restore();
        });
        c.globalAlpha = 1;

        // pickups
        d.orbs.forEach(function (ob) {
          var col = ob.kind === 'coolant' ? '#4dd8ff' : '#7ee08a';
          c.shadowColor = col; c.shadowBlur = 12;
          c.fillStyle = col;
          c.beginPath(); c.arc(ob.x, ob.y, 8, 0, 7); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = '#0d1013';
          c.font = '800 9px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText(ob.kind === 'coolant' ? '❄' : '+', ob.x, ob.y + 3);
        });

        // foes: rusty bots
        d.foes.forEach(function (f) {
          c.save();
          c.translate(f.x, f.y);
          c.rotate(f.a + Math.PI); // face the tower
          if (f.kind === 'bomber') {
            c.fillStyle = '#8c2a2a';
            U.roundRect(c, -f.r, -f.r * .8, f.r * 2, f.r * 1.6, 6); c.fill();
            c.fillStyle = '#5a1a1a';
            U.roundRect(c, -f.r * .5, -f.r * .5, f.r, f.r, 4); c.fill();
            c.fillStyle = '#ffb03c';
            c.beginPath(); c.arc(f.r * .55, 0, 4, 0, 7); c.fill();
          } else if (f.kind === 'skimmer') {
            c.fillStyle = '#d08a3c';
            c.beginPath();
            c.moveTo(f.r * 1.3, 0); c.lineTo(-f.r * .8, f.r); c.lineTo(-f.r * .3, 0); c.lineTo(-f.r * .8, -f.r);
            c.closePath(); c.fill();
            c.fillStyle = '#5a3a18';
            c.beginPath(); c.arc(f.r * .3, 0, 3, 0, 7); c.fill();
          } else {
            c.fillStyle = '#b3552a';
            U.roundRect(c, -f.r * .9, -f.r * .9, f.r * 1.8, f.r * 1.8, 5); c.fill();
            // stubby legs churn
            c.strokeStyle = '#6e3418'; c.lineWidth = 4; c.lineCap = 'round';
            var lg = Math.sin(f.t * 12) * 5;
            c.beginPath();
            c.moveTo(-f.r, -f.r * .5 + lg); c.lineTo(-f.r * 1.5, -f.r * .5 - lg);
            c.moveTo(-f.r, f.r * .5 - lg); c.lineTo(-f.r * 1.5, f.r * .5 + lg);
            c.stroke();
            c.fillStyle = '#ffd257';
            c.beginPath(); c.arc(f.r * .35, 0, 3.4, 0, 7); c.fill();
          }
          c.restore();
        });

        // bullets
        c.strokeStyle = '#ffd257'; c.lineWidth = 3; c.lineCap = 'round';
        d.bullets.forEach(function (b) {
          c.shadowColor = '#ffd257'; c.shadowBlur = 8;
          c.beginPath();
          c.moveTo(b.x, b.y); c.lineTo(b.x - b.vx * .016, b.y - b.vy * .016);
          c.stroke();
        });
        c.shadowBlur = 0;

        // sparks
        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.strokeStyle = p.col; c.lineWidth = 2;
          c.beginPath();
          c.moveTo(p.x, p.y);
          c.lineTo(p.x - p.vx * .02, p.y - p.vy * .02);
          c.stroke();
        });
        c.globalAlpha = 1;

        /* tower + turret */
        c.fillStyle = '#22262c';
        c.beginPath(); c.arc(CX, CY, 46, 0, 7); c.fill();
        c.strokeStyle = '#3a4048'; c.lineWidth = 5;
        c.beginPath(); c.arc(CX, CY, 46, 0, 7); c.stroke();
        // bolts
        c.fillStyle = '#565e68';
        for (var bo = 0; bo < 8; bo++) {
          var ba = bo / 8 * 6.283 + g.t * .1;
          c.beginPath(); c.arc(CX + Math.cos(ba) * 36, CY + Math.sin(ba) * 36, 3, 0, 7); c.fill();
        }
        // barrel
        var rec = d.recoil * 7;
        c.save();
        c.translate(CX, CY);
        c.rotate(d.ang);
        var hotCol = d.locked > 0 ? '#ff5b3c' : d.heat > 60 ? '#ff8c2a' : '#9aa3ad';
        c.fillStyle = '#565e68';
        U.roundRect(c, -14 - rec, -11, 34, 22, 5); c.fill();
        c.fillStyle = hotCol;
        U.roundRect(c, 16 - rec, -5.5, 40, 11, 3); c.fill();
        c.fillStyle = '#2c3036';
        U.roundRect(c, 50 - rec, -7, 8, 14, 2); c.fill();
        c.restore();
        c.fillStyle = '#ff8c2a';
        c.beginPath(); c.arc(CX, CY, 9, 0, 7); c.fill();
        c.fillStyle = '#2c1608';
        c.beginPath(); c.arc(CX, CY, 4, 0, 7); c.fill();

        // heat gauge under the tower
        var hw = 130;
        c.fillStyle = 'rgba(0,0,0,.5)';
        U.roundRect(c, CX - hw / 2, CY + 58, hw, 11, 5.5); c.fill();
        var frac = d.heat / 100;
        var barCol = d.locked > 0 ? (Math.floor(g.t * 8) % 2 ? '#ff2a2a' : '#ff8c2a') :
          frac > .75 ? '#ff5b3c' : frac > .45 ? '#ff8c2a' : '#ffd257';
        c.fillStyle = barCol;
        U.roundRect(c, CX - hw / 2 + 2, CY + 60, Math.max(2, (hw - 4) * frac), 7, 3.5); c.fill();
        c.fillStyle = '#9aa3ad';
        c.font = '700 10px Outfit, sans-serif'; c.textAlign = 'center';
        c.fillText(d.locked > 0 ? 'VENTING…' : 'HEAT', CX, CY + 82);

        if (d.bannerT > 0 && d.banner) {
          c.globalAlpha = Math.min(1, d.bannerT);
          c.fillStyle = d.banner === 'OVERHEAT!' ? '#ff5b3c' : '#e8edf3';
          c.font = '800 32px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText(d.banner, CX, 90);
          c.globalAlpha = 1;
        }
        c.restore();
      }
    });
  }

  window.Milo.register({
    id: 'turret-tower', title: 'Turret Tower', emo: '🗼', category: 'Action',
    tagline: 'One turret, 360°, and a hot barrel',
    description: 'You are a fixed turret in the middle of an open field, and rust-bots ' +
      'march in from every bearing — skimmers spiral, bombers hit the tower for three. ' +
      'Every shot heats the barrel: a hot gun sprays wide, and a maxed gauge locks you ' +
      'out while it vents. Fire in short bursts, grab the blue coolant orbs, and save ' +
      'the cold accurate gun for the bombers.',
    controls: ['Mouse aim', 'Click / Space', '← →'],
    colors: ['#2c3036', '#ff8c2a'],
    tags: ['turret', 'shooter', 'waves', 'overheat', '360'],
    mount: mount
  });
})();
