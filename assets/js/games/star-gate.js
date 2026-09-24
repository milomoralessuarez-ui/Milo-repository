/* Star Gate — hold the line above the ridge and get the scientists home. */
(function () {
  'use strict';
  var W = 880, H = 580;
  var RADAR_H = 56;
  var WW = 3200;                        // world width, wraps
  var TSTEP = 40, TN = WW / TSTEP;      // terrain samples
  var SKY_TOP = RADAR_H + 6;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    /* ------------------------------------------------------------ world */

    function wrapX(x) { return ((x % WW) + WW) % WW; }
    function relX(d, x) {
      var v = wrapX(x - d.cam);
      if (v > WW / 2) v -= WW;
      return v;
    }
    function groundAt(d, x) {
      x = wrapX(x);
      var i = Math.floor(x / TSTEP), f = (x % TSTEP) / TSTEP;
      var a = d.terrain[i % TN], b = d.terrain[(i + 1) % TN];
      return U.lerp(a, b, f);
    }

    function burst(d, x, y, col, n, spd) {
      for (var i = 0; i < (n || 16); i++) {
        var a = Math.random() * 6.283, s = U.rand(40, spd || 280);
        d.parts.push({
          x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
          life: U.rand(.25, .7), max: .7, col: col, r: U.rand(1.4, 3.4)
        });
      }
    }

    function say(d, t) { d.msg = t; d.msgT = 1.8; }
    function award(g, n) { g.score += n; g.set('Score', U.fmt(g.score)); }

    /* ----------------------------------------------------------- spawning */

    function spawnWave(g) {
      var d = g.data;
      d.enemies = [];
      var n = Math.min(14, 4 + d.wave);
      for (var i = 0; i < n; i++) {
        d.enemies.push(makeLander(d, U.rand(0, WW)));
      }
      var bombers = Math.min(5, Math.floor(d.wave / 2));
      for (var b = 0; b < bombers; b++) {
        d.enemies.push({
          kind: 'bomber', x: U.rand(0, WW), y: U.rand(SKY_TOP + 40, H - 160),
          vx: U.rand(-60, 60), vy: U.rand(-40, 40), t: Math.random() * 6, hp: 1
        });
      }
      if (!d.people.length) mutateAll(d);
      d.waveIntro = 2;
      g.set('Wave', d.wave);
      Milo.sound.powerup();
    }

    function makeLander(d, x) {
      return {
        kind: 'lander', x: x, y: U.rand(SKY_TOP + 20, SKY_TOP + 130),
        vx: U.rand(-30, 30), vy: 30, hp: 1, grab: null, state: 'hunt',
        t: Math.random() * 6, fire: U.rand(1.5, 4)
      };
    }

    function mutateAll(d) {
      d.enemies.forEach(function (e) {
        if (e.kind === 'lander') { e.kind = 'mutant'; e.grab = null; e.t = 0; }
      });
      d.planetGone = true;
    }

    /* ------------------------------------------------------------- reset */

    function reset(g) {
      var d = g.data;
      d.terrain = [];
      for (var i = 0; i < TN; i++) {
        var h = U.fbm(i * 0.11, 3.3, 4, 7);
        d.terrain.push(H - 40 - h * 110);
      }
      d.cam = 0;
      d.wave = 1;
      d.lives = 3;
      d.bombs = 3;
      d.planetGone = false;
      d.parts = [];
      d.shots = [];
      d.eshots = [];
      d.msg = '';
      d.msgT = 0;
      d.shake = 0;
      d.flash = 0;
      d.respawn = 0;
      d.bombFlash = 0;
      d.people = [];
      for (var p = 0; p < 10; p++) {
        var px = (p + 0.5) * (WW / 10) + U.rand(-90, 90);
        d.people.push({ x: wrapX(px), y: 0, state: 'walk', vy: 0, dir: Math.random() < .5 ? -1 : 1, held: null });
      }
      d.people.forEach(function (q) { q.y = groundAt(d, q.x) - 9; });
      d.ship = { x: WW * 0.25, y: H * 0.5, vx: 0, vy: 0, face: 1, cool: 0, carry: null };
      d.enemies = [];
      spawnWave(g);
      g.score = 0;
      g.set('Score', 0);
      g.set('Lives', 3);
      g.set('Saved', d.people.length);
      g.set('Bombs', d.bombs);
    }

    function killShip(g) {
      var d = g.data;
      if (d.respawn > 0) return;
      d.respawn = 1.8;
      d.shake = 24;
      d.flash = .5;
      burst(d, W / 2, d.ship.y, '#38bdf8', 34, 400);
      Milo.sound.explode();
      if (d.ship.carry) { d.ship.carry.state = 'fall'; d.ship.carry.held = null; d.ship.carry = null; }
      d.lives--;
      g.set('Lives', Math.max(0, d.lives));
      if (d.lives <= 0) {
        g.gameOver({
          emo: '🛸', title: 'Ship down',
          text: 'Wave ' + d.wave + ', ' + d.people.length + ' scientist' + (d.people.length === 1 ? '' : 's') + ' still down there.'
        });
      }
    }

    function smartBomb(g) {
      var d = g.data;
      if (d.bombs <= 0 || d.respawn > 0) return;
      d.bombs--;
      g.set('Bombs', d.bombs);
      d.bombFlash = .5;
      d.shake = 16;
      var killed = 0;
      d.enemies = d.enemies.filter(function (e) {
        var r = relX(d, e.x);
        if (r > -40 && r < W + 40) {
          burst(d, r, e.y, '#fcd34d', 12, 260);
          if (e.grab) { e.grab.state = 'fall'; e.grab.vy = 0; e.grab.held = null; }
          killed++;
          return false;
        }
        return true;
      });
      d.eshots = d.eshots.filter(function (s) { var r = relX(d, s.x); return !(r > -40 && r < W + 40); });
      award(g, killed * 120);
      say(d, 'SMART BOMB — ' + killed + ' cleared');
      Milo.sound.explode();
    }

    /* ------------------------------------------------------------ runner */

    return Milo.arcade(host, {
      id: 'star-gate',
      w: W, h: H, bg: '#02030c',
      stats: ['Score', 'Wave', 'Saved', 'Lives', 'Bombs'],
      touch: 'dpad',
      touchButtons: [{ key: 'action', label: 'FIRE' }, { key: 'b', label: 'BOMB' }],
      emo: '🛸',
      start: {
        title: 'Star Gate',
        text: 'Landers drop out of the sky, grab a scientist off the ridge and haul them ' +
          'to the top — where they come back as a mutant that hunts you. Shoot the lander, ' +
          'catch the falling scientist, and set them down gently. The radar strip is the ' +
          'only way to see the far side of the planet.',
        keys: ['← → thrust', '↑ ↓ climb', 'Space fire', 'Z smart bomb']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, i = g.input, sh = d.ship;
        d.shake = Math.max(0, d.shake - dt * 46);
        d.flash = Math.max(0, d.flash - dt);
        d.bombFlash = Math.max(0, d.bombFlash - dt);
        d.msgT = Math.max(0, d.msgT - dt);
        d.waveIntro = Math.max(0, (d.waveIntro || 0) - dt);

        d.parts = d.parts.filter(function (q) {
          q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= .94; q.vy *= .94; q.life -= dt;
          return q.life > 0;
        });

        if (d.respawn > 0) {
          d.respawn -= dt;
          if (d.respawn <= 0 && d.lives > 0) {
            sh.x = wrapX(sh.x + 200); sh.y = H * 0.45; sh.vx = 0; sh.vy = 0;
            d.eshots = [];
          }
          return;
        }

        /* -- ship -- */
        var ax = (i.down('right') ? 1 : 0) - (i.down('left') ? 1 : 0);
        var ay = (i.down('down') ? 1 : 0) - (i.down('up') ? 1 : 0);
        if (i.pdown) {
          if (i.px > W * 0.62) ax = 1; else if (i.px < W * 0.38) ax = -1;
          if (i.py > sh.y + 24) ay = 1; else if (i.py < sh.y - 24) ay = -1;
        }
        if (ax) sh.face = ax;
        sh.vx += ax * 1500 * dt;
        sh.vx *= Math.pow(0.02, dt);
        sh.vx = U.clamp(sh.vx, -520, 520);
        sh.vy += ay * 1300 * dt;
        sh.vy *= Math.pow(0.004, dt);
        sh.vy = U.clamp(sh.vy, -400, 400);
        sh.x = wrapX(sh.x + sh.vx * dt);
        sh.y = U.clamp(sh.y + sh.vy * dt, SKY_TOP + 16, H - 22);
        var gh = groundAt(d, sh.x);
        if (sh.y > gh - 10) { sh.y = gh - 10; sh.vy = Math.min(0, sh.vy); }

        // camera leads the way you are facing
        var want = wrapX(sh.x - W * 0.5 + sh.face * W * 0.2);
        var camDelta = wrapX(want - d.cam);
        if (camDelta > WW / 2) camDelta -= WW;
        d.cam = wrapX(d.cam + camDelta * Math.min(1, dt * 3.4));

        /* -- weapons -- */
        sh.cool -= dt;
        if ((i.down('action') || i.pdown) && sh.cool <= 0) {
          sh.cool = 0.12;
          d.shots.push({ x: sh.x + sh.face * 22, y: sh.y, vx: sh.face * 1500, life: .42 });
          Milo.sound.tone({ f: 1400, f2: 300, d: .07, v: .04, type: 'sawtooth' });
        }
        if (i.pressed('b') || i.pressed('KeyZ')) smartBomb(g);

        d.shots = d.shots.filter(function (s) {
          s.life -= dt;
          s.x = wrapX(s.x + s.vx * dt);
          if (s.life <= 0) return false;
          for (var k = 0; k < d.enemies.length; k++) {
            var e = d.enemies[k];
            var dx = wrapX(s.x - e.x); if (dx > WW / 2) dx -= WW;
            if (Math.abs(dx) < 22 && Math.abs(s.y - e.y) < 18) {
              e.hp--;
              if (e.hp <= 0) {
                var r = relX(d, e.x);
                burst(d, r, e.y, e.kind === 'mutant' ? '#f472b6' : e.kind === 'bomber' ? '#fb923c' : '#a78bfa', 18, 300);
                award(g, e.kind === 'lander' ? 150 : e.kind === 'bomber' ? 250 : 200);
                if (e.grab) { e.grab.state = 'fall'; e.grab.vy = 0; e.grab.held = null; }
                d.enemies.splice(k, 1);
                Milo.sound.hit();
              }
              return false;
            }
          }
          return true;
        });

        /* -- enemies -- */
        d.enemies.forEach(function (e) {
          e.t += dt;
          var dx = wrapX(sh.x - e.x); if (dx > WW / 2) dx -= WW;
          var dy = sh.y - e.y;

          if (e.kind === 'lander') {
            if (e.state === 'hunt') {
              // find the nearest free scientist and drift over it
              var best = null, bd = 1e9;
              for (var p = 0; p < d.people.length; p++) {
                var pp = d.people[p];
                if (pp.held || pp.state !== 'walk') continue;
                var pd = wrapX(pp.x - e.x); if (pd > WW / 2) pd -= WW;
                if (Math.abs(pd) < bd) { bd = Math.abs(pd); best = pp; }
              }
              if (best) {
                var bdx = wrapX(best.x - e.x); if (bdx > WW / 2) bdx -= WW;
                e.vx = U.clamp(bdx * 1.4, -120, 120);
                e.vy = 58 + d.wave * 3;
                if (Math.abs(bdx) < 14 && e.y > best.y - 26) {
                  e.grab = best; best.held = e; best.state = 'lifted';
                  e.state = 'rise';
                  Milo.sound.tone({ f: 200, f2: 520, d: .2, v: .06, type: 'sawtooth' });
                }
              } else {
                e.vx = Math.sin(e.t * 0.8) * 90;
                e.vy = Math.sin(e.t * 1.6) * 50;
              }
            } else {
              e.vy = -72;
              e.vx = Math.sin(e.t * 2) * 40;
              if (e.grab) { e.grab.x = e.x; e.grab.y = e.y + 24; }
              if (e.y < SKY_TOP + 12) {
                // made it to the top: the scientist comes back as a mutant
                if (e.grab) {
                  var idx = d.people.indexOf(e.grab);
                  if (idx >= 0) d.people.splice(idx, 1);
                  g.set('Saved', d.people.length);
                  e.grab = null;
                  say(d, 'SCIENTIST LOST');
                  Milo.sound.lose();
                  if (!d.people.length) { mutateAll(d); say(d, 'PLANET GONE — ALL MUTANTS'); }
                }
                e.kind = 'mutant'; e.state = 'hunt'; e.t = 0;
              }
            }
            e.fire -= dt;
            if (e.fire <= 0 && Math.abs(dx) < W * 0.55) {
              e.fire = U.rand(1.6, 4) / (1 + d.wave * 0.06);
              var m = Math.hypot(dx, dy) || 1;
              d.eshots.push({ x: e.x, y: e.y, vx: dx / m * 240, vy: dy / m * 240, life: 3 });
            }
          } else if (e.kind === 'mutant') {
            var mm = Math.hypot(dx, dy) || 1;
            var sp = 150 + d.wave * 8;
            e.vx = (dx / mm) * sp + Math.sin(e.t * 7) * 90;
            e.vy = (dy / mm) * sp + Math.cos(e.t * 6) * 70;
            e.fire = (e.fire || 2) - dt;
            if (e.fire <= 0) {
              e.fire = U.rand(1.2, 2.6);
              var m2 = Math.hypot(dx, dy) || 1;
              d.eshots.push({ x: e.x, y: e.y, vx: dx / m2 * 280, vy: dy / m2 * 280, life: 3 });
            }
          } else {                                  // bomber: lazy grid drift, deadly touch
            if (Math.random() < dt * 0.8) { e.vx = U.rand(-70, 70); e.vy = U.rand(-60, 60); }
          }

          e.x = wrapX(e.x + e.vx * dt);
          e.y = U.clamp(e.y + e.vy * dt, SKY_TOP + 8, H - 24);
          var eg = groundAt(d, e.x);
          if (e.kind !== 'lander' && e.y > eg - 12) { e.y = eg - 12; e.vy = -Math.abs(e.vy); }

          if (Math.abs(dx) < 20 && Math.abs(dy) < 16) killShip(g);
        });

        /* -- enemy fire -- */
        d.eshots = d.eshots.filter(function (s) {
          s.life -= dt;
          s.x = wrapX(s.x + s.vx * dt);
          s.y += s.vy * dt;
          if (s.life <= 0 || s.y < SKY_TOP || s.y > H) return false;
          var sdx = wrapX(s.x - sh.x); if (sdx > WW / 2) sdx -= WW;
          if (Math.abs(sdx) < 16 && Math.abs(s.y - sh.y) < 13) { killShip(g); return false; }
          return true;
        });

        /* -- scientists -- */
        d.people.forEach(function (p) {
          if (p.state === 'walk') {
            p.x = wrapX(p.x + p.dir * 16 * dt);
            if (Math.random() < dt * 0.4) p.dir *= -1;
            p.y = groundAt(d, p.x) - 9;
          } else if (p.state === 'fall') {
            p.vy += 420 * dt;
            p.y += p.vy * dt;
            var gy = groundAt(d, p.x) - 9;
            // catching a faller
            var cdx = wrapX(p.x - sh.x); if (cdx > WW / 2) cdx -= WW;
            if (!sh.carry && Math.abs(cdx) < 22 && Math.abs(p.y - sh.y) < 24) {
              sh.carry = p; p.state = 'carried'; p.held = sh;
              award(g, 250);
              say(d, 'CAUGHT  +250');
              Milo.sound.coin();
            } else if (p.y >= gy) {
              if (p.vy > 330) {
                var ix = d.people.indexOf(p);
                if (ix >= 0) d.people.splice(ix, 1);
                g.set('Saved', d.people.length);
                burst(d, relX(d, p.x), gy, '#f87171', 12, 160);
                say(d, 'SCIENTIST LOST');
                Milo.sound.lose();
                if (!d.people.length) { mutateAll(d); say(d, 'PLANET GONE — ALL MUTANTS'); }
              } else {
                p.y = gy; p.state = 'walk'; p.vy = 0;
              }
            }
          } else if (p.state === 'carried') {
            p.x = sh.x; p.y = sh.y + 20;
            var gy2 = groundAt(d, p.x) - 9;
            if (p.y >= gy2 - 6) {
              p.state = 'walk'; p.y = gy2; sh.carry = null; p.held = null;
              award(g, 500);
              say(d, 'SCIENTIST HOME  +500');
              Milo.sound.win();
            }
          } else if (p.state === 'lifted') {
            // position handled by the lander
          }
        });

        /* -- wave clear -- */
        if (!d.enemies.length) {
          d.wave++;
          var bonus = d.people.length * 100 * d.wave;
          award(g, 1000 + bonus);
          say(d, 'WAVE ' + d.wave + '  +' + U.fmt(1000 + bonus));
          if (d.wave % 3 === 0) { d.bombs++; g.set('Bombs', d.bombs); }
          spawnWave(g);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#050a22');
        sky.addColorStop(.7, '#02030c');
        sky.addColorStop(1, d.planetGone ? '#2a0509' : '#020610');
        c.fillStyle = sky; c.fillRect(-40, -40, W + 80, H + 80);

        // parallax stars
        for (var s = 0; s < 90; s++) {
          var swx = U.hash2(s, 1, 5) * WW;
          var par = 0.3 + U.hash2(s, 2, 6) * 0.5;
          var sxp = ((swx - d.cam * par) % WW + WW) % WW;
          if (sxp > W) continue;
          c.globalAlpha = .25 + U.hash2(s, 4, 8) * .6;
          c.fillStyle = '#dbeafe';
          c.fillRect(sxp, SKY_TOP + U.hash2(s, 3, 9) * (H - SKY_TOP - 120), 2, 2);
        }
        c.globalAlpha = 1;

        // terrain
        var tcol = d.planetGone ? '#f43f5e' : '#34d399';
        c.strokeStyle = tcol; c.lineWidth = 2.4;
        c.shadowColor = tcol; c.shadowBlur = 10;
        c.beginPath();
        var startI = Math.floor(d.cam / TSTEP) - 1;
        for (var i2 = 0; i2 <= W / TSTEP + 3; i2++) {
          var ti = ((startI + i2) % TN + TN) % TN;
          var wx = (startI + i2) * TSTEP;
          var rx = relX(d, wx);
          if (i2 === 0) c.moveTo(rx, d.terrain[ti]); else c.lineTo(rx, d.terrain[ti]);
        }
        c.stroke();
        c.shadowBlur = 0;
        c.lineTo(W + 60, H + 20); c.lineTo(-60, H + 20); c.closePath();
        c.fillStyle = d.planetGone ? 'rgba(244,63,94,.12)' : 'rgba(52,211,153,.10)';
        c.fill();

        // scientists
        d.people.forEach(function (p) {
          var rx = relX(d, p.x);
          if (rx < -30 || rx > W + 30) return;
          c.fillStyle = '#fef08a';
          c.fillRect(rx - 3, p.y - 4, 6, 10);
          c.fillStyle = '#fff';
          c.beginPath(); c.arc(rx, p.y - 8, 3.4, 0, 7); c.fill();
          c.fillStyle = '#22d3ee';
          c.fillRect(rx - 4, p.y + 5, 8, 2);
          if (p.state === 'fall') {
            c.strokeStyle = 'rgba(254,240,138,.5)'; c.lineWidth = 1;
            c.beginPath(); c.moveTo(rx, p.y + 8); c.lineTo(rx, p.y + 22); c.stroke();
          }
        });

        // enemies
        d.enemies.forEach(function (e) {
          var rx = relX(d, e.x);
          if (rx < -40 || rx > W + 40) return;
          c.save(); c.translate(rx, e.y);
          if (e.kind === 'lander') {
            c.fillStyle = '#a78bfa';
            c.beginPath(); c.moveTo(0, -12); c.lineTo(14, 4); c.lineTo(-14, 4); c.closePath(); c.fill();
            c.fillStyle = '#c4b5fd';
            c.fillRect(-4, 4, 8, 8);
            c.strokeStyle = '#ddd6fe'; c.lineWidth = 2;
            c.beginPath(); c.moveTo(-12, 6); c.lineTo(-16, 14); c.moveTo(12, 6); c.lineTo(16, 14); c.stroke();
            if (e.grab) {
              c.strokeStyle = 'rgba(167,139,250,.7)';
              c.beginPath(); c.moveTo(0, 10); c.lineTo(0, 22); c.stroke();
            }
          } else if (e.kind === 'mutant') {
            c.shadowColor = '#f472b6'; c.shadowBlur = 14;
            c.fillStyle = '#f472b6';
            var wob = Math.sin(e.t * 14) * 3;
            c.beginPath();
            c.moveTo(0, -13 + wob); c.lineTo(13, -2); c.lineTo(7, 12);
            c.lineTo(-7, 12); c.lineTo(-13, -2);
            c.closePath(); c.fill();
            c.shadowBlur = 0;
            c.fillStyle = '#4c0519';
            c.fillRect(-6, -4, 4, 4); c.fillRect(2, -4, 4, 4);
          } else {
            c.fillStyle = '#fb923c';
            c.beginPath();
            c.moveTo(0, -14); c.lineTo(14, 0); c.lineTo(0, 14); c.lineTo(-14, 0);
            c.closePath(); c.fill();
            c.fillStyle = '#7c2d12';
            c.beginPath();
            c.moveTo(0, -7); c.lineTo(7, 0); c.lineTo(0, 7); c.lineTo(-7, 0);
            c.closePath(); c.fill();
          }
          c.restore();
        });

        // shots
        c.fillStyle = '#e0f2fe';
        d.shots.forEach(function (s) {
          var rx = relX(d, s.x);
          if (rx < -70 || rx > W + 70) return;
          var len = s.vx > 0 ? -46 : 46;
          var grd = c.createLinearGradient(rx, 0, rx + len, 0);
          grd.addColorStop(0, '#ffffff');
          grd.addColorStop(1, 'rgba(56,189,248,0)');
          c.fillStyle = grd;
          c.fillRect(Math.min(rx, rx + len), s.y - 2, Math.abs(len), 4);
        });
        c.fillStyle = '#f43f5e';
        d.eshots.forEach(function (s) {
          var rx = relX(d, s.x);
          if (rx < -20 || rx > W + 20) return;
          c.beginPath(); c.arc(rx, s.y, 3.6, 0, 7); c.fill();
        });

        // ship
        if (d.respawn <= 0 || Math.floor(g.t * 14) % 2) {
          var sh = d.ship;
          var sx = relX(d, sh.x);
          c.save(); c.translate(sx, sh.y);
          c.scale(sh.face, 1);
          if (Math.abs(sh.vx) > 40) {
            var jg = c.createLinearGradient(-40, 0, -14, 0);
            jg.addColorStop(0, 'rgba(56,189,248,0)');
            jg.addColorStop(1, '#67e8f9');
            c.fillStyle = jg;
            c.fillRect(-40, -4, 26, 8);
          }
          c.shadowColor = '#22d3ee'; c.shadowBlur = 14;
          c.fillStyle = '#e0f2fe';
          c.beginPath();
          c.moveTo(24, 0); c.lineTo(2, -9); c.lineTo(-18, -7);
          c.lineTo(-18, 7); c.lineTo(2, 9);
          c.closePath(); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = '#0ea5e9';
          c.fillRect(-14, -4, 22, 8);
          c.restore();
          if (sh.carry) {
            c.strokeStyle = 'rgba(254,240,138,.7)'; c.lineWidth = 1.5;
            c.beginPath(); c.moveTo(sx, sh.y + 8); c.lineTo(sx, sh.y + 16); c.stroke();
          }
        }

        d.parts.forEach(function (q) {
          c.globalAlpha = Math.max(0, q.life / q.max);
          c.fillStyle = q.col;
          c.fillRect(q.x - q.r, q.y - q.r, q.r * 2, q.r * 2);
        });
        c.globalAlpha = 1;
        c.restore();

        /* ---- radar strip ---- */
        c.fillStyle = '#05081c';
        c.fillRect(0, 0, W, RADAR_H);
        c.strokeStyle = '#1e3a8a'; c.lineWidth = 2;
        c.strokeRect(1, 1, W - 2, RADAR_H - 2);
        var k = W / WW;
        // mini terrain
        c.strokeStyle = d.planetGone ? 'rgba(244,63,94,.6)' : 'rgba(52,211,153,.55)';
        c.lineWidth = 1;
        c.beginPath();
        for (var t2 = 0; t2 < TN; t2++) {
          var ry = 8 + (d.terrain[t2] - (H - 160)) / 160 * (RADAR_H - 18);
          ry = U.clamp(ry, 6, RADAR_H - 6);
          if (t2 === 0) c.moveTo(t2 * TSTEP * k, ry); else c.lineTo(t2 * TSTEP * k, ry);
        }
        c.stroke();
        d.people.forEach(function (p) {
          c.fillStyle = '#fef08a';
          c.fillRect(p.x * k - 1, RADAR_H - 12, 2, 5);
        });
        d.enemies.forEach(function (e) {
          c.fillStyle = e.kind === 'mutant' ? '#f472b6' : e.kind === 'bomber' ? '#fb923c' : '#a78bfa';
          var ry2 = U.clamp((e.y - SKY_TOP) / (H - SKY_TOP) * (RADAR_H - 12) + 6, 4, RADAR_H - 5);
          c.fillRect(e.x * k - 1.5, ry2, 3, 3);
        });
        c.fillStyle = '#22d3ee';
        var pry = U.clamp((d.ship.y - SKY_TOP) / (H - SKY_TOP) * (RADAR_H - 12) + 6, 4, RADAR_H - 5);
        c.fillRect(d.ship.x * k - 2.5, pry - 1, 5, 4);
        // viewport bracket
        c.strokeStyle = 'rgba(226,232,240,.5)';
        var vx0 = wrapX(d.cam) * k, vw = W * k;
        c.strokeRect(vx0, 3, vw, RADAR_H - 6);
        if (vx0 + vw > W) c.strokeRect(vx0 - W, 3, vw, RADAR_H - 6);

        if (d.msgT > 0) {
          c.globalAlpha = Math.min(1, d.msgT);
          c.fillStyle = '#fde047';
          c.font = '800 22px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(d.msg, W / 2, RADAR_H + 40);
          c.globalAlpha = 1;
          c.textAlign = 'left';
        }
        if (d.bombFlash > 0) {
          c.fillStyle = 'rgba(253,224,71,' + (d.bombFlash * .6) + ')';
          c.fillRect(0, RADAR_H, W, H - RADAR_H);
        }
        if (d.flash > 0) {
          c.fillStyle = 'rgba(244,63,94,' + (d.flash * .45) + ')';
          c.fillRect(0, RADAR_H, W, H - RADAR_H);
        }
      }
    });
  }

  window.Milo.register({
    id: 'star-gate',
    title: 'Star Gate',
    emo: '🛸',
    category: 'Arcade',
    tagline: 'Rescue the scientists before the landers lift them',
    description: 'A wrapping planet you patrol at speed, with a radar strip along the top ' +
      'showing the whole ridge at once. Purple landers descend, hook a scientist and haul ' +
      'them to the ceiling — if one makes it, the scientist returns as a mutant that hunts ' +
      'you down. Shoot the lander, catch the falling scientist mid-air for 250 and set them ' +
      'down for 500. Lose all ten and the planet burns and every lander turns mutant at once.',
    controls: ['← → thrust', '↑ ↓ climb', 'Space fire', 'Z smart bomb'],
    colors: ['#02030c', '#34d399'],
    tags: ['classic', 'shooter', 'rescue', 'arcade', 'radar'],
    mount: mount
  });
})();
