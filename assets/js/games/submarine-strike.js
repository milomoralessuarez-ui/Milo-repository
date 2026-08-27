/* Submarine Strike — buoyant torpedoes, depth charges, and a sonar that shows the mines. */
(function () {
  'use strict';
  var W = 800, H = 560, SURF = 92;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function floorY(d, wx) {
      return 512 + (U.noise2(wx * .002, 3, d.seed) - .5) * 52;
    }

    function reset(g) {
      var d = g.data;
      d.seed = (Math.random() * 9999) | 0;
      d.dist = 0;
      d.sub = { x: 180, y: 300, vx: 0, vy: 0, hull: 3, inv: 2, cool: 0 };
      d.pingCd = 0;
      d.torps = [];
      d.ships = [];
      d.charges = [];
      d.mines = [];
      d.rings = [];       // sonar rings
      d.booms = [];       // explosion rings
      d.parts = [];
      d.bubbles = [];
      d.kelp = [];
      d.sunk = 0;
      d.zone = 1;
      d.nextMine = 500;
      d.nextShip = 700;
      d.shake = 0;
      d.banner = ''; d.bannerT = 0;
      d.firing = false;
      for (var i = 0; i < 10; i++) {
        d.kelp.push({ wx: U.rand(0, 2000), h: U.rand(30, 70), ph: Math.random() * 6.28 });
      }
      g.set('Score', 0);
      g.set('Ships', 0);
      g.set('Hull', '♥♥♥');
    }

    function setHull(g) {
      var s = '', n = Math.max(0, g.data.sub.hull);
      for (var i = 0; i < n; i++) s += '♥';
      g.set('Hull', s || '—');
    }

    function bubble(d, x, y, n, spread) {
      for (var i = 0; i < n; i++) {
        d.bubbles.push({
          x: x + U.rand(-(spread || 4), spread || 4), y: y + U.rand(-3, 3),
          vy: U.rand(-70, -30), wob: Math.random() * 6.28,
          r: U.rand(1.5, 4), life: U.rand(.6, 1.4)
        });
      }
    }

    function boom(g, x, y, big) {
      var d = g.data;
      d.booms.push({ x: x, y: y, r: 4, max: big ? 64 : 42 });
      for (var i = 0; i < (big ? 18 : 10); i++) {
        var a = Math.random() * 6.28, s = U.rand(30, 200);
        d.parts.push({
          x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
          life: U.rand(.25, .6), max: .6,
          col: Math.random() < .5 ? '#ffb03c' : '#7dffce', r: U.rand(2, 5)
        });
      }
      bubble(d, x, y, big ? 14 : 8, 16);
      Milo.sound.explode();
    }

    function damage(g, x, y) {
      var d = g.data, s = d.sub;
      if (s.inv > 0) return;
      s.inv = 1.8;
      s.hull--;
      d.shake = Math.max(d.shake, .9);
      setHull(g);
      boom(g, x, y, false);
      if (s.hull <= 0) {
        boom(g, s.x, s.y, true);
        g.gameOver({
          emo: '🌊', title: 'Lost With All Hands',
          text: 'You ran ' + Math.floor(d.dist / 10) + 'm and sank ' + d.sunk + ' ship' + (d.sunk === 1 ? '' : 's') + '.'
        });
      }
    }

    function fireTorp(g) {
      var d = g.data, s = d.sub;
      if (s.cool > 0) return;
      s.cool = .8;
      d.torps.push({ x: s.x + 40, y: s.y + 4, vx: 330, vy: -26 });
      bubble(d, s.x + 40, s.y + 4, 5);
      Milo.sound.tone({ f: 220, f2: 480, d: .18, v: .09, type: 'triangle' });
    }

    function ping(g) {
      var d = g.data;
      if (d.pingCd > 0) return;
      d.pingCd = 4;
      d.rings.push({ x: d.sub.x, y: d.sub.y, r: 10, max: 480 });
      Milo.sound.tone({ f: 1400, f2: 700, d: .5, v: .09, type: 'sine' });
    }

    return Milo.arcade(host, {
      id: 'submarine-strike',
      w: W, h: H, bg: '#04141c',
      stats: ['Score', 'Ships', 'Hull'],
      emo: '🚢',
      touch: 'dpad',
      touchButtons: [{ key: 'action', label: 'FIRE' }, { key: 'a', label: 'PING' }],
      start: {
        title: 'Submarine Strike',
        text: 'Torpedoes rise as they run, so dive below a convoy ship and let the ' +
          'shot float up into her hull. Destroyers answer with depth charges, and ' +
          'the minefield is invisible until you ping it.',
        keys: ['WASD / Arrows dive & steer', 'Space / Click torpedo', 'X sonar ping']
      },
      init: reset,
      onPointer: function (g, type, x, y) {
        var d = g.data;
        if (type === 'down') { d.firing = true; d.ptr = { x: x, y: y }; }
        if (type === 'move' && g.input.pdown) d.ptr = { x: x, y: y };
        if (type === 'up') { d.firing = false; d.ptr = null; }
      },

      update: function (g, dt) {
        var d = g.data, s = d.sub, i = g.input;

        d.dist += 90 * dt;
        s.cool -= dt;
        s.inv = Math.max(0, s.inv - dt);
        d.pingCd = Math.max(0, d.pingCd - dt);
        d.shake = Math.max(0, d.shake - dt * 3);
        d.bannerT -= dt;

        /* difficulty zones */
        var zone = Math.floor(d.dist / 1500) + 1;
        if (zone > d.zone) {
          d.zone = zone;
          d.banner = 'ZONE ' + zone + ' — DENSER MINEFIELD';
          d.bannerT = 2.2;
          Milo.sound.tone({ f: 140, f2: 320, d: .5, v: .1, type: 'sawtooth' });
        }

        /* steering */
        var ax = i.axis();
        var mx = ax.x, my = ax.y;
        if (!mx && !my && d.ptr) {
          var pd = U.dist(s.x, s.y, d.ptr.x, d.ptr.y);
          if (pd > 24) { mx = (d.ptr.x - s.x) / pd; my = (d.ptr.y - s.y) / pd; }
        }
        s.vx += (mx * 190 - s.vx) * Math.min(1, 3.4 * dt);
        s.vy += (my * 170 - s.vy) * Math.min(1, 3.4 * dt);
        s.x = U.clamp(s.x + s.vx * dt, 46, 560);
        s.y = U.clamp(s.y + s.vy * dt, SURF + 34, floorY(d, s.x + d.dist) - 22);

        if (i.down('action') || d.firing) fireTorp(g);
        if (i.pressed('a')) ping(g);

        // prop wash
        if (Math.random() < .35) bubble(d, s.x - 38, s.y, 1);

        /* spawn mines + ships ahead of the scroll */
        var mineGap = Math.max(110, 280 - d.zone * 28);
        while (d.nextMine < d.dist + W + 200) {
          d.nextMine += U.rand(mineGap * .7, mineGap * 1.4);
          d.mines.push({
            wx: d.nextMine, y: U.rand(SURF + 70, 470),
            r: 11, seen: 0, ph: Math.random() * 6.28
          });
        }
        var shipGap = Math.max(300, 780 - d.zone * 70);
        while (d.nextShip < d.dist + W + 300) {
          d.nextShip += U.rand(shipGap * .8, shipGap * 1.5);
          d.ships.push({ wx: d.nextShip, hp: 2, cool: U.rand(.5, 1.5), sunkT: 0, roll: Math.random() * 6.28 });
        }

        /* ships steam left overhead, dropping charges */
        for (var k = d.ships.length - 1; k >= 0; k--) {
          var sh = d.ships[k];
          sh.wx -= 26 * dt;
          sh.roll += dt;
          var sx = sh.wx - d.dist;
          if (sx < -120) { d.ships.splice(k, 1); continue; }
          if (sh.sunkT > 0) {
            sh.sunkT += dt;
            if (sh.sunkT > 2.5) d.ships.splice(k, 1);
            continue;
          }
          sh.cool -= dt;
          if (sh.cool <= 0 && Math.abs(sx - s.x) < 150 && sx > 0 && sx < W) {
            sh.cool = Math.max(1.1, 2.6 - d.zone * .25);
            d.charges.push({
              x: sx + U.rand(-14, 14), y: SURF + 6, vy: 30,
              fuse: s.y + U.rand(-24, 24), t: 0
            });
            bubble(d, sx, SURF + 8, 4, 8);
            Milo.sound.tone({ f: 180, f2: 120, d: .1, v: .06, type: 'square' });
          }
        }

        /* depth charges sink to their fuse depth */
        for (var c2 = d.charges.length - 1; c2 >= 0; c2--) {
          var ch = d.charges[c2];
          ch.t += dt;
          ch.vy = Math.min(150, ch.vy + 160 * dt);
          ch.y += ch.vy * dt;
          ch.x -= 90 * dt;
          if (Math.random() < .3) bubble(d, ch.x, ch.y - 4, 1);
          var fl = floorY(d, ch.x + d.dist);
          if (ch.y >= ch.fuse || ch.y > fl - 6) {
            d.charges.splice(c2, 1);
            boom(g, ch.x, ch.y, true);
            if (U.dist(ch.x, ch.y, s.x, s.y) < 74) {
              damage(g, s.x, s.y);
              if (g.state === 'over') return;
            }
            // sympathetic mine detonations
            for (var mm = d.mines.length - 1; mm >= 0; mm--) {
              var mn2 = d.mines[mm];
              if (U.dist(ch.x, ch.y, mn2.wx - d.dist, mn2.y) < 74) {
                d.mines.splice(mm, 1);
                boom(g, mn2.wx - d.dist, mn2.y, false);
              }
            }
          } else if (ch.x < -30) d.charges.splice(c2, 1);
        }

        /* mines */
        for (var m = d.mines.length - 1; m >= 0; m--) {
          var mn = d.mines[m];
          mn.seen = Math.max(0, mn.seen - dt);
          mn.ph += dt;
          var mxp = mn.wx - d.dist;
          if (mxp < -40) { d.mines.splice(m, 1); continue; }
          if (s.inv <= 0 && U.dist(mxp, mn.y + Math.sin(mn.ph) * 4, s.x, s.y) < mn.r + 16) {
            d.mines.splice(m, 1);
            damage(g, mxp, mn.y);
            if (g.state === 'over') return;
          }
        }

        /* torpedoes rise as they run */
        for (var t2 = d.torps.length - 1; t2 >= 0; t2--) {
          var tp = d.torps[t2];
          tp.x += tp.vx * dt; tp.y += tp.vy * dt;
          if (Math.random() < .6) bubble(d, tp.x - 14, tp.y, 1);
          var dead = tp.x > W + 30 || tp.y < SURF - 4;
          if (tp.y <= SURF + 16 && !dead) {
            // in the hull zone — check ships
            for (var sk = 0; sk < d.ships.length; sk++) {
              var shp = d.ships[sk], shx = shp.wx - d.dist;
              if (shp.sunkT === 0 && Math.abs(tp.x - shx) < 42) {
                shp.hp--;
                dead = true;
                if (shp.hp <= 0) {
                  shp.sunkT = .01;
                  d.sunk++;
                  g.score += 100;
                  g.set('Ships', d.sunk);
                  boom(g, shx, SURF, true);
                  d.shake = Math.max(d.shake, .6);
                } else boom(g, tp.x, tp.y, false);
                break;
              }
            }
          }
          if (!dead) {
            for (var m2 = d.mines.length - 1; m2 >= 0; m2--) {
              var mn3 = d.mines[m2];
              if (U.dist(tp.x, tp.y, mn3.wx - d.dist, mn3.y) < mn3.r + 6) {
                d.mines.splice(m2, 1);
                dead = true;
                g.score += 20;
                boom(g, tp.x, tp.y, false);
                break;
              }
            }
          }
          if (dead) d.torps.splice(t2, 1);
        }

        /* sonar rings reveal mines they wash over */
        d.rings = d.rings.filter(function (rg) {
          rg.r += 420 * dt;
          d.mines.forEach(function (mn) {
            if (U.dist(rg.x, rg.y, mn.wx - d.dist, mn.y) < rg.r) mn.seen = 3.6;
          });
          return rg.r < rg.max;
        });

        g.score = Math.max(g.score, Math.floor(d.dist / 10) + d.sunk * 100);
        g.set('Score', U.fmt(g.score));

        d.booms = d.booms.filter(function (b) { b.r += 200 * dt; return b.r < b.max; });
        d.bubbles = d.bubbles.filter(function (b) {
          b.wob += dt * 6;
          b.x += Math.sin(b.wob) * 14 * dt - 20 * dt;
          b.y += b.vy * dt; b.life -= dt;
          return b.life > 0 && b.y > SURF;
        });
        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .95; p.vy *= .95; p.life -= dt;
          return p.life > 0;
        });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, s = d.sub;
        // water column
        var sea = c.createLinearGradient(0, SURF, 0, H);
        sea.addColorStop(0, '#0a3d4a');
        sea.addColorStop(.5, '#073040');
        sea.addColorStop(1, '#021018');
        c.fillStyle = sea; c.fillRect(0, 0, W, H);

        c.save();
        if (d.shake > 0) c.translate(U.rand(-1, 1) * d.shake * 5, U.rand(-1, 1) * d.shake * 5);

        // light rays from the surface
        c.globalAlpha = .05;
        c.fillStyle = '#9fe8d8';
        for (var lr = 0; lr < 4; lr++) {
          var lx = ((lr * 260 - d.dist * .3) % (W + 300) + W + 300) % (W + 300) - 150;
          c.beginPath();
          c.moveTo(lx, SURF); c.lineTo(lx + 60, SURF);
          c.lineTo(lx + 170, H); c.lineTo(lx + 40, H);
          c.closePath(); c.fill();
        }
        c.globalAlpha = 1;

        // misty sky band + moon
        var sky = c.createLinearGradient(0, 0, 0, SURF);
        sky.addColorStop(0, '#1c2a30');
        sky.addColorStop(1, '#3d5a58');
        c.fillStyle = sky; c.fillRect(0, 0, W, SURF);
        c.fillStyle = '#cfe8d8';
        c.beginPath(); c.arc(660, 34, 16, 0, 7); c.fill();
        c.fillStyle = 'rgba(207,232,216,.2)';
        c.beginPath(); c.arc(660, 34, 26, 0, 7); c.fill();

        // surface swell
        c.strokeStyle = '#7dd8c8'; c.lineWidth = 2.5;
        c.beginPath();
        for (var wx2 = 0; wx2 <= W; wx2 += 8) {
          var wy = SURF + Math.sin((wx2 + d.dist * 1.2) * .04) * 3 + Math.sin((wx2 + d.dist * 2) * .11) * 1.5;
          if (wx2 === 0) c.moveTo(wx2, wy); else c.lineTo(wx2, wy);
        }
        c.stroke();

        // ships
        d.ships.forEach(function (sh) {
          var sx = sh.wx - d.dist;
          if (sx < -110 || sx > W + 110) return;
          c.save();
          c.translate(sx, SURF + (sh.sunkT > 0 ? sh.sunkT * 46 : Math.sin(sh.roll) * 2));
          c.rotate(sh.sunkT > 0 ? sh.sunkT * .4 : Math.sin(sh.roll * .8) * .03);
          c.fillStyle = '#2a3438';
          c.beginPath();
          c.moveTo(-52, 0); c.lineTo(52, 0); c.lineTo(38, 16); c.lineTo(-40, 16);
          c.closePath(); c.fill();
          c.fillStyle = '#46545a';
          c.fillRect(-30, -14, 34, 14);
          c.fillRect(-8, -24, 10, 12);
          c.fillStyle = '#c85a3c';
          c.fillRect(12, -10, 6, 10);
          if (sh.hp === 1 && sh.sunkT === 0) {
            c.fillStyle = 'rgba(60,63,68,.8)';
            c.beginPath(); c.arc(20 + Math.random() * 6, -16, 5 + Math.random() * 3, 0, 7); c.fill();
          }
          c.restore();
        });

        // sea floor
        c.fillStyle = '#132420';
        c.beginPath();
        c.moveTo(0, H);
        for (var fx = 0; fx <= W; fx += 16) c.lineTo(fx, floorY(d, fx + d.dist));
        c.lineTo(W, H);
        c.closePath(); c.fill();

        // kelp sways above the floor
        d.kelp.forEach(function (kp) {
          var kx = ((kp.wx - d.dist) % 2000 + 2000) % 2000 - 300;
          if (kx < -30 || kx > W + 30) return;
          var base = floorY(d, kx + d.dist);
          c.strokeStyle = '#1e4a38'; c.lineWidth = 4; c.lineCap = 'round';
          c.beginPath();
          c.moveTo(kx, base);
          c.quadraticCurveTo(
            kx + Math.sin(g.t * 1.4 + kp.ph) * 12, base - kp.h * .55,
            kx + Math.sin(g.t * 1.1 + kp.ph) * 20, base - kp.h);
          c.stroke();
        });

        // mines: near-black until pinged
        d.mines.forEach(function (mn) {
          var mxp = mn.wx - d.dist;
          if (mxp < -30 || mxp > W + 30) return;
          var my2 = mn.y + Math.sin(mn.ph) * 4;
          var vis = mn.seen > 0 ? Math.min(1, mn.seen) : .1;
          c.globalAlpha = .18 + vis * .2;
          c.strokeStyle = '#4a5a58'; c.lineWidth = 1.5;
          c.beginPath(); c.moveTo(mxp, my2); c.lineTo(mxp, floorY(d, mn.wx)); c.stroke();
          c.globalAlpha = .25 + vis * .75;
          c.fillStyle = mn.seen > 0 ? '#3c4a48' : '#152325';
          c.beginPath(); c.arc(mxp, my2, mn.r, 0, 7); c.fill();
          for (var hn = 0; hn < 6; hn++) {
            var ha = hn / 6 * 6.283 + .5;
            c.strokeStyle = c.fillStyle; c.lineWidth = 3;
            c.beginPath();
            c.moveTo(mxp + Math.cos(ha) * mn.r, my2 + Math.sin(ha) * mn.r);
            c.lineTo(mxp + Math.cos(ha) * (mn.r + 5), my2 + Math.sin(ha) * (mn.r + 5));
            c.stroke();
          }
          if (mn.seen > 0) {
            c.globalAlpha = Math.min(1, mn.seen) * (.5 + Math.sin(g.t * 8) * .3);
            c.strokeStyle = '#ff5b6e'; c.lineWidth = 2;
            c.beginPath(); c.arc(mxp, my2, mn.r + 7, 0, 7); c.stroke();
          }
          c.globalAlpha = 1;
        });

        // depth charges
        d.charges.forEach(function (ch) {
          c.save();
          c.translate(ch.x, ch.y);
          c.rotate(ch.t * 2);
          c.fillStyle = '#5a5044';
          U.roundRect(c, -5, -8, 10, 16, 3); c.fill();
          c.fillStyle = '#8a7a5c';
          c.fillRect(-5, -2, 10, 4);
          c.restore();
        });

        // torpedoes
        d.torps.forEach(function (tp) {
          c.save();
          c.translate(tp.x, tp.y);
          c.rotate(Math.atan2(tp.vy, tp.vx));
          c.fillStyle = '#b8c8c0';
          U.roundRect(c, -14, -3.5, 28, 7, 3.5); c.fill();
          c.fillStyle = '#ff8c5a';
          c.beginPath(); c.arc(13, 0, 3.4, 0, 7); c.fill();
          c.restore();
        });

        // the sub
        if (s.inv <= 0 || Math.floor(g.t * 14) % 2 === 0) {
          c.save();
          c.translate(s.x, s.y);
          c.rotate(U.clamp(s.vy * .0012, -.2, .2));
          c.fillStyle = '#3d5a48';
          c.beginPath(); c.ellipse(0, 0, 40, 14, 0, 0, 7); c.fill();
          c.fillStyle = '#2c4436';
          U.roundRect(c, -12, -24, 22, 14, 4); c.fill();      // conning tower
          c.fillRect(-2, -32, 3, 9);                           // periscope
          c.fillStyle = '#2c4436';
          c.beginPath();                                       // tail fin
          c.moveTo(-38, 0); c.lineTo(-50, -10); c.lineTo(-50, 10);
          c.closePath(); c.fill();
          c.fillStyle = '#ffd257';                             // portholes
          c.beginPath();
          c.arc(-14, 0, 2.6, 0, 7); c.arc(0, 0, 2.6, 0, 7); c.arc(14, 0, 2.6, 0, 7);
          c.fill();
          c.restore();
        }

        // sonar rings
        d.rings.forEach(function (rg) {
          c.globalAlpha = Math.max(0, 1 - rg.r / rg.max) * .8;
          c.strokeStyle = '#7dffce'; c.lineWidth = 2.5;
          c.beginPath(); c.arc(rg.x, rg.y, rg.r, 0, 7); c.stroke();
        });
        c.globalAlpha = 1;

        // explosions
        d.booms.forEach(function (b) {
          c.globalAlpha = Math.max(0, 1 - b.r / b.max);
          c.strokeStyle = '#ffb03c'; c.lineWidth = 4;
          c.beginPath(); c.arc(b.x, b.y, b.r, 0, 7); c.stroke();
        });
        c.globalAlpha = 1;

        // bubbles + sparks
        d.bubbles.forEach(function (b) {
          c.globalAlpha = Math.min(.6, b.life);
          c.strokeStyle = '#bfeee0'; c.lineWidth = 1.2;
          c.beginPath(); c.arc(b.x, b.y, b.r, 0, 7); c.stroke();
        });
        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.fill();
        });
        c.globalAlpha = 1;

        // sonar readiness bar under the sub
        c.fillStyle = 'rgba(0,0,0,.45)';
        U.roundRect(c, s.x - 24, s.y + 24, 48, 5, 2.5); c.fill();
        c.fillStyle = d.pingCd <= 0 ? '#7dffce' : '#3d7a68';
        U.roundRect(c, s.x - 23, s.y + 25, 46 * (1 - d.pingCd / 4), 3, 1.5); c.fill();

        if (d.bannerT > 0 && d.banner) {
          c.globalAlpha = Math.min(1, d.bannerT);
          c.textAlign = 'center';
          c.fillStyle = '#7dffce';
          c.font = '800 26px Outfit, sans-serif';
          c.fillText(d.banner, W / 2, 150);
          c.globalAlpha = 1;
        }
        c.restore();
      }
    });
  }

  window.Milo.register({
    id: 'submarine-strike', title: 'Submarine Strike', emo: '🚢', category: 'Action',
    tagline: 'Torpedoes float up — dive under, then fire',
    description: 'Your torpedoes are buoyant: they rise as they run, so the killing shot ' +
      'is fired from below and ahead of a convoy ship, two torpedoes per hull. The ' +
      'destroyers answer with depth charges fused to explode at the depth you were at ' +
      'when they dropped — change depth immediately. Mines are nearly invisible in the ' +
      'murk until a sonar ping (X) washes over them, and every zone packs them tighter.',
    controls: ['WASD / Arrows', 'Space / Click fire', 'X ping'],
    colors: ['#0a3d4a', '#7dffce'],
    tags: ['submarine', 'torpedo', 'sonar', 'shooter', 'underwater'],
    mount: mount
  });
})();
