/* Mech Storm — pilot a walking mech through a dusk canyon, jets and arm cannon. */
(function () {
  'use strict';
  var W = 800, H = 560, MX = 180; // mech's screen x

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function groundY(d, worldX) {
      return 442 + (U.noise2(worldX * .0016, 0, d.seed) - .5) * 110;
    }

    function reset(g) {
      var d = g.data;
      d.seed = (Math.random() * 9999) | 0;
      d.dist = 0;
      d.m = { y: 380, vy: 0, x: MX, fuel: 100, cool: 0, onGround: true, walk: 0 };
      d.shield = 100;
      d.hull = 3;
      d.inv = 0;
      d.aim = { x: 600, y: 300 };
      d.bullets = [];
      d.drones = [];
      d.turrets = [];
      d.shells = [];
      d.bolts = [];
      d.parts = [];
      d.rings = [];
      d.skirmish = 0;
      d.nextZone = 900;
      d.inFight = false;
      d.kills = 0;
      d.killScore = 0;
      d.shake = 0;
      d.firing = false;
      d.banner = ''; d.bannerT = 0;
      g.set('Score', 0);
      g.set('Shield', '100%');
      g.set('Hull', '▮▮▮');
    }

    function setHud(g) {
      var d = g.data;
      g.set('Shield', Math.max(0, Math.round(d.shield)) + '%');
      var s = '';
      for (var i = 0; i < Math.max(0, d.hull); i++) s += '▮';
      g.set('Hull', s || '—');
    }

    function spawnSkirmish(g) {
      var d = g.data;
      d.skirmish++;
      d.inFight = true;
      d.banner = 'SKIRMISH ' + d.skirmish;
      d.bannerT = 1.6;
      var n = 3 + d.skirmish;
      for (var i = 0; i < n; i++) {
        // V formation off the right edge
        var row = Math.floor(i / 2), side = i % 2 ? 1 : -1;
        d.drones.push({
          wx: d.dist + W + 120 + row * 70,
          y: 200 + side * row * 46 + U.rand(-16, 16),
          hp: 2 + Math.floor(d.skirmish / 3),
          t: Math.random() * 6,
          sp: 120 + d.skirmish * 8,
          cool: U.rand(1.5, 3),
          dive: false
        });
      }
      var nt = Math.min(3, 1 + Math.floor(d.skirmish / 3));
      for (var t = 0; t < nt; t++) {
        var wx = d.dist + W + U.rand(300, 900) + t * 380;
        d.turrets.push({ wx: wx, hp: 4 + Math.floor(d.skirmish / 2), cool: U.rand(1, 2), t: 0 });
      }
      Milo.sound.tone({ f: 100, f2: 240, d: .5, v: .13, type: 'sawtooth' });
    }

    function flame(d, x, y, col) {
      d.parts.push({
        x: x, y: y, vx: U.rand(-25, 25), vy: U.rand(60, 160),
        life: U.rand(.15, .3), max: .3, col: col || (Math.random() < .5 ? '#ffb03c' : '#ff6a2a'), r: U.rand(3, 7)
      });
    }

    function explode(d, x, y, big) {
      d.rings.push({ x: x, y: y, r: 4, max: big ? 70 : 44, col: '#ffb03c' });
      for (var i = 0; i < (big ? 20 : 12); i++) {
        var a = Math.random() * 6.28, s = U.rand(40, 240);
        d.parts.push({
          x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40,
          life: U.rand(.3, .7), max: .7,
          col: Math.random() < .5 ? '#ff6a2a' : '#3c3f44', r: U.rand(3, 8)
        });
      }
      Milo.sound.explode();
    }

    function damage(g, amt) {
      var d = g.data;
      if (d.inv > 0) return;
      d.inv = .6;
      d.shake = Math.max(d.shake, .8);
      if (d.shield > 0) {
        d.shield -= amt;
        Milo.sound.tone({ f: 500, f2: 180, d: .15, v: .1, type: 'triangle' });
        if (d.shield <= 0) {
          d.shield = 0;
          Milo.sound.tone({ f: 200, f2: 60, d: .5, v: .14, type: 'sawtooth' });
        }
      } else {
        d.hull--;
        explode(d, MX, d.m.y - 30, false);
        if (d.hull <= 0) {
          setHud(g);
          explode(d, MX, d.m.y - 30, true);
          g.gameOver({ emo: '🤖', title: 'Mech Down', text: 'You marched ' + Math.floor(d.dist / 10) + 'm and cleared ' + Math.max(0, d.skirmish - 1) + ' skirmishes.' });
          return;
        }
      }
      setHud(g);
    }

    return Milo.arcade(host, {
      id: 'mech-storm',
      w: W, h: H, bg: '#241028',
      stats: ['Score', 'Shield', 'Hull'],
      emo: '🤖',
      touchButtons: [{ key: 'action', label: 'JETS' }, { key: 'a', label: 'FIRE' }],
      start: {
        title: 'Mech Storm',
        text: 'March the mech down the canyon. Hold Space to burn the jump jets, ' +
          'aim the arm cannon with the mouse. Your shield only recharges in the ' +
          'quiet between skirmishes — hull damage is forever.',
        keys: ['Space / ↑ jets', 'Mouse aim + click fire', 'X also fires']
      },
      init: reset,
      onPointer: function (g, type, x, y) {
        var d = g.data;
        d.aim.x = x; d.aim.y = y;
        if (type === 'down') d.firing = true;
        if (type === 'up') d.firing = false;
      },

      update: function (g, dt) {
        var d = g.data, m = d.m, i = g.input;

        d.dist += 120 * dt;
        m.walk += dt * (m.onGround ? 7 : 0);
        d.inv = Math.max(0, d.inv - dt);
        d.shake = Math.max(0, d.shake - dt * 3);
        d.bannerT -= dt;
        m.cool -= dt;

        /* jets */
        var jets = i.down('action') || i.down('up');
        if (jets && m.fuel > 0) {
          m.vy -= 1500 * dt;
          m.fuel = Math.max(0, m.fuel - 42 * dt);
          m.onGround = false;
          flame(d, MX - 14 + U.rand(-3, 3), m.y - 26);
          flame(d, MX + 2 + U.rand(-3, 3), m.y - 26);
          if (Math.random() < .1) Milo.sound.tone({ f: 90, f2: 70, d: .08, v: .03, type: 'sawtooth' });
        }
        m.vy += 1300 * dt;
        m.vy = U.clamp(m.vy, -420, 700);
        m.y += m.vy * dt;
        var gy = groundY(d, d.dist);
        if (m.y >= gy) {
          if (!m.onGround && m.vy > 300) {
            d.shake = Math.max(d.shake, .3);
            Milo.sound.tone({ f: 90, f2: 50, d: .12, v: .1, type: 'sawtooth' });
          }
          m.y = gy; m.vy = 0; m.onGround = true;
        }
        if (m.onGround) m.fuel = Math.min(100, m.fuel + 34 * dt);
        if (m.y < 60) { m.y = 60; m.vy = Math.max(0, m.vy); }

        /* cannon */
        if (d.firing || i.down('a')) {
          if (m.cool <= 0) {
            m.cool = .15;
            var ang = Math.atan2(d.aim.y - (m.y - 46), d.aim.x - MX);
            d.bullets.push({
              x: MX + Math.cos(ang) * 30, y: m.y - 46 + Math.sin(ang) * 30,
              vx: Math.cos(ang) * 660, vy: Math.sin(ang) * 660
            });
            d.parts.push({ x: MX + Math.cos(ang) * 34, y: m.y - 46 + Math.sin(ang) * 34, vx: 0, vy: 0, life: .05, max: .05, col: '#9be8ff', r: 8 });
            Milo.sound.tone({ f: 760, f2: 320, d: .06, v: .06, type: 'square' });
          }
        }

        /* skirmish structure */
        var alive = d.drones.length + d.turrets.length;
        if (d.inFight && alive === 0) {
          d.inFight = false;
          d.killScore += 100 + d.skirmish * 20;
          d.banner = 'CLEAR — SHIELD RECHARGING';
          d.bannerT = 2;
          Milo.sound.powerup();
        }
        if (!d.inFight) {
          d.shield = Math.min(100, d.shield + 26 * dt);
          setHud(g);
          if (d.dist > d.nextZone) {
            spawnSkirmish(g);
            d.nextZone = d.dist + 1600 + d.skirmish * 120;
          }
        }

        /* drones */
        for (var k = d.drones.length - 1; k >= 0; k--) {
          var dr = d.drones[k];
          dr.t += dt;
          var sx = dr.wx - d.dist + MX;
          if (!dr.dive) {
            dr.wx -= (dr.sp - 120) * dt; // close in relative to the mech
            dr.y += Math.sin(dr.t * 3) * 30 * dt;
            if (sx < MX + 300 && Math.random() < .3 * dt * 10) dr.dive = Math.random() < .35;
          } else {
            var da = Math.atan2((m.y - 40) - dr.y, MX - sx);
            dr.wx += Math.cos(da) * 200 * dt;
            dr.y += Math.sin(da) * 200 * dt;
          }
          dr.cool -= dt;
          sx = dr.wx - d.dist + MX;
          if (dr.cool <= 0 && sx > MX + 60 && sx < W) {
            dr.cool = U.rand(1.6, 3) / (1 + d.skirmish * .05);
            var ba = Math.atan2((m.y - 40) - dr.y, MX - sx);
            var bs = 260 + d.skirmish * 10;
            d.bolts.push({ x: sx, y: dr.y, vx: Math.cos(ba) * bs, vy: Math.sin(ba) * bs });
            Milo.sound.tone({ f: 420, f2: 260, d: .05, v: .04, type: 'square' });
          }
          if (sx < -120 || dr.y > gy + 20) {
            if (dr.y > gy + 20) explode(d, sx, gy, false);
            d.drones.splice(k, 1);
            continue;
          }
          if (U.dist(sx, dr.y, MX, m.y - 40) < 34) {
            explode(d, sx, dr.y, false);
            d.drones.splice(k, 1);
            damage(g, 26);
            if (g.state === 'over') return;
          }
        }

        /* turrets */
        for (var tk = d.turrets.length - 1; tk >= 0; tk--) {
          var tu = d.turrets[tk];
          var tx = tu.wx - d.dist + MX;
          var ty = groundY(d, tu.wx) + 4;
          if (tx < -80) { d.turrets.splice(tk, 1); continue; }
          tu.cool -= dt;
          if (tu.cool <= 0 && tx > MX + 100 && tx < W + 40) {
            tu.cool = U.rand(1.8, 2.8) / (1 + d.skirmish * .04);
            // lob a shell: solve rough arc toward the mech
            var dx = MX - tx, fly = Math.abs(dx) / 300;
            d.shells.push({
              x: tx, y: ty - 18,
              vx: dx / fly, vy: ((m.y - 40) - (ty - 18)) / fly - 380 * fly
            });
            Milo.sound.tone({ f: 180, f2: 90, d: .15, v: .08, type: 'sawtooth' });
          }
        }

        /* player bullets vs enemies */
        for (var b = d.bullets.length - 1; b >= 0; b--) {
          var bl = d.bullets[b];
          bl.x += bl.vx * dt; bl.y += bl.vy * dt;
          var dead = bl.x < -20 || bl.x > W + 20 || bl.y < -20 || bl.y > groundY(d, bl.x - MX + d.dist);
          if (!dead) {
            for (var dj = d.drones.length - 1; dj >= 0; dj--) {
              var dd = d.drones[dj], dsx = dd.wx - d.dist + MX;
              if (U.dist(bl.x, bl.y, dsx, dd.y) < 20) {
                dd.hp--; dead = true;
                d.parts.push({ x: bl.x, y: bl.y, vx: 0, vy: 0, life: .08, max: .08, col: '#9be8ff', r: 5 });
                if (dd.hp <= 0) {
                  explode(d, dsx, dd.y, false);
                  d.drones.splice(dj, 1);
                  d.kills++; d.killScore += 25;
                } else Milo.sound.hit();
                break;
              }
            }
            if (!dead) {
              for (var tj = d.turrets.length - 1; tj >= 0; tj--) {
                var tt = d.turrets[tj], ttx = tt.wx - d.dist + MX, tty = groundY(d, tt.wx);
                if (bl.x > ttx - 24 && bl.x < ttx + 24 && bl.y > tty - 32 && bl.y < tty + 6) {
                  tt.hp--; dead = true;
                  d.parts.push({ x: bl.x, y: bl.y, vx: U.rand(-60, 60), vy: U.rand(-90, -20), life: .3, max: .3, col: '#ffd257', r: 3 });
                  if (tt.hp <= 0) {
                    explode(d, ttx, tty - 14, true);
                    d.turrets.splice(tj, 1);
                    d.kills++; d.killScore += 60;
                    d.shake = Math.max(d.shake, .5);
                  } else Milo.sound.hit();
                  break;
                }
              }
            }
          }
          if (dead) d.bullets.splice(b, 1);
        }

        /* enemy fire */
        d.bolts = d.bolts.filter(function (bo) {
          bo.x += (bo.vx - 120) * dt; bo.y += bo.vy * dt;
          if (U.dist(bo.x, bo.y, MX, m.y - 40) < 22) { damage(g, 18); return false; }
          return bo.x > -30 && bo.y < H + 30;
        });
        d.shells = d.shells.filter(function (sh) {
          sh.vy += 380 * dt;
          sh.x += (sh.vx - 120) * dt; sh.y += sh.vy * dt;
          if (Math.random() < .5) d.parts.push({ x: sh.x, y: sh.y, vx: 0, vy: -10, life: .25, max: .25, col: '#6a6f78', r: 3 });
          if (U.dist(sh.x, sh.y, MX, m.y - 40) < 26) { explode(d, sh.x, sh.y, false); damage(g, 30); return false; }
          if (sh.y > groundY(d, sh.x - MX + d.dist)) { explode(d, sh.x, sh.y, false); return false; }
          return sh.x > -40;
        });
        if (g.state === 'over') return;

        g.score = Math.floor(d.dist / 10) + d.killScore;
        g.set('Score', U.fmt(g.score));

        d.parts = d.parts.filter(function (p) {
          p.x += (p.vx - (p.ground ? 120 : 0)) * dt; p.y += p.vy * dt; p.life -= dt;
          return p.life > 0;
        });
        d.rings = d.rings.filter(function (r) { r.r += 220 * dt; return r.r < r.max; });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, m = d.m;
        // dusk sky
        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#241028');
        sky.addColorStop(.55, '#61213a');
        sky.addColorStop(.85, '#b0503a');
        sky.addColorStop(1, '#b0503a');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);

        c.save();
        if (d.shake > 0) c.translate(U.rand(-1, 1) * d.shake * 5, U.rand(-1, 1) * d.shake * 5);

        // far canyon rims (parallax silhouettes)
        drawRim(c, d, .25, 300, '#3a1630', 90);
        drawRim(c, d, .5, 360, '#4c1c34', 70);

        // ground
        c.fillStyle = '#2e1420';
        c.beginPath();
        c.moveTo(0, H);
        for (var x = 0; x <= W; x += 16) {
          c.lineTo(x, groundY(d, x - MX + d.dist));
        }
        c.lineTo(W, H);
        c.closePath(); c.fill();
        c.strokeStyle = '#7a3a44'; c.lineWidth = 3;
        c.beginPath();
        for (var x2 = 0; x2 <= W; x2 += 16) {
          var yy = groundY(d, x2 - MX + d.dist);
          if (x2 === 0) c.moveTo(x2, yy); else c.lineTo(x2, yy);
        }
        c.stroke();

        // turrets
        d.turrets.forEach(function (tu) {
          var tx = tu.wx - d.dist + MX, ty = groundY(d, tu.wx);
          if (tx < -60 || tx > W + 60) return;
          c.fillStyle = '#1c1420';
          U.roundRect(c, tx - 22, ty - 26, 44, 28, 5); c.fill();
          c.strokeStyle = '#8c4a3c'; c.lineWidth = 2;
          U.roundRect(c, tx - 22, ty - 26, 44, 28, 5); c.stroke();
          var ba = Math.atan2((m.y - 40) - (ty - 18), MX - tx);
          c.strokeStyle = '#5a5f68'; c.lineWidth = 6; c.lineCap = 'round';
          c.beginPath();
          c.moveTo(tx, ty - 18);
          c.lineTo(tx + Math.cos(ba) * 24, ty - 18 + Math.sin(ba) * 24);
          c.stroke();
          c.fillStyle = '#ff5b3c';
          c.beginPath(); c.arc(tx, ty - 18, 4, 0, 7); c.fill();
        });

        // drones
        d.drones.forEach(function (dr) {
          var sx = dr.wx - d.dist + MX;
          if (sx < -40 || sx > W + 140) return;
          c.save();
          c.translate(sx, dr.y);
          c.fillStyle = '#701c2c';
          c.beginPath(); c.ellipse(0, 0, 16, 8, 0, 0, 7); c.fill();
          c.fillStyle = '#a12a3a';
          c.beginPath(); c.ellipse(0, -4, 10, 5, 0, 0, 7); c.fill();
          // rotor shimmer
          c.globalAlpha = .5 + Math.sin(dr.t * 40) * .3;
          c.strokeStyle = '#e8a0a8'; c.lineWidth = 1.6;
          c.beginPath(); c.moveTo(-20, -9); c.lineTo(20, -9); c.stroke();
          c.globalAlpha = 1;
          c.fillStyle = '#ffd257';
          c.beginPath(); c.arc(0, 2, 2.6, 0, 7); c.fill();
          c.restore();
        });

        // shells + bolts
        d.shells.forEach(function (sh) {
          c.fillStyle = '#e8e0d0';
          c.beginPath(); c.arc(sh.x, sh.y, 5, 0, 7); c.fill();
        });
        c.strokeStyle = '#ff7a5a'; c.lineWidth = 3; c.lineCap = 'round';
        d.bolts.forEach(function (bo) {
          c.beginPath();
          c.moveTo(bo.x, bo.y);
          c.lineTo(bo.x - bo.vx * .03, bo.y - bo.vy * .03);
          c.stroke();
        });

        // player bullets
        c.strokeStyle = '#7ce4ff'; c.lineWidth = 3.4;
        d.bullets.forEach(function (bl) {
          c.shadowColor = '#7ce4ff'; c.shadowBlur = 8;
          c.beginPath();
          c.moveTo(bl.x, bl.y);
          c.lineTo(bl.x - bl.vx * .018, bl.y - bl.vy * .018);
          c.stroke();
        });
        c.shadowBlur = 0;

        drawMech(c, g, d);

        // particles + rings
        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.fill();
        });
        c.globalAlpha = 1;
        d.rings.forEach(function (r) {
          c.globalAlpha = Math.max(0, 1 - r.r / r.max);
          c.strokeStyle = r.col; c.lineWidth = 3;
          c.beginPath(); c.arc(r.x, r.y, r.r, 0, 7); c.stroke();
        });
        c.globalAlpha = 1;

        // fuel + shield bars over the mech
        c.fillStyle = 'rgba(0,0,0,.45)';
        U.roundRect(c, MX - 30, m.y - 108, 60, 6, 3); c.fill();
        c.fillStyle = '#ffb03c';
        U.roundRect(c, MX - 29, m.y - 107, 58 * (m.fuel / 100), 4, 2); c.fill();
        c.fillStyle = 'rgba(0,0,0,.45)';
        U.roundRect(c, MX - 30, m.y - 99, 60, 6, 3); c.fill();
        c.fillStyle = d.shield > 30 ? '#58e8ff' : '#ff5b6e';
        U.roundRect(c, MX - 29, m.y - 98, 58 * (d.shield / 100), 4, 2); c.fill();

        if (d.bannerT > 0 && d.banner) {
          c.globalAlpha = Math.min(1, d.bannerT);
          c.textAlign = 'center';
          c.fillStyle = '#ffd9c0';
          c.font = '800 28px Outfit, sans-serif';
          c.fillText(d.banner, W / 2, 100);
          c.globalAlpha = 1;
        }
        c.restore();
      }
    });

    function drawRim(c, d, par, base, col, amp) {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(0, H);
      for (var x = 0; x <= W; x += 24) {
        var wx = x + d.dist * par;
        c.lineTo(x, base + (U.noise2(wx * .003, par * 10, d.seed) - .5) * amp * 2);
      }
      c.lineTo(W, H);
      c.closePath(); c.fill();
    }

    function drawMech(c, g, d) {
      var m = d.m, y = m.y;
      var ang = Math.atan2(d.aim.y - (y - 46), d.aim.x - MX);
      c.save();
      c.translate(MX, y);
      // legs — walking scissor
      var lw = Math.sin(m.walk) * (m.onGround ? 10 : 3);
      c.strokeStyle = '#3a3f4a'; c.lineWidth = 7; c.lineCap = 'round';
      c.beginPath();
      c.moveTo(-6, -30); c.lineTo(-8 + lw, -14); c.lineTo(-10 + lw * 1.4, 0);
      c.moveTo(6, -30); c.lineTo(8 - lw, -14); c.lineTo(10 - lw * 1.4, 0);
      c.stroke();
      // torso
      c.fillStyle = '#4a4f5a';
      U.roundRect(c, -18, -62, 36, 34, 7); c.fill();
      c.fillStyle = '#2e323c';
      U.roundRect(c, -22, -66, 44, 10, 4); c.fill(); // shoulders
      // jetpack
      c.fillStyle = '#32363e';
      U.roundRect(c, -24, -56, 8, 22, 3); c.fill();
      // head + visor
      c.fillStyle = '#4a4f5a';
      U.roundRect(c, -9, -78, 18, 14, 4); c.fill();
      c.fillStyle = '#58e8ff';
      c.shadowColor = '#58e8ff'; c.shadowBlur = 8;
      c.fillRect(-6, -74, 12, 4);
      c.shadowBlur = 0;
      // core light: white = shielded, red = exposed
      c.fillStyle = d.shield > 0 ? '#c8f4ff' : '#ff5b6e';
      c.beginPath(); c.arc(0, -46, 4.5, 0, 7); c.fill();
      // arm cannon
      c.save();
      c.translate(0, -46);
      c.rotate(ang);
      c.fillStyle = '#32363e';
      U.roundRect(c, 4, -6, 26, 12, 4); c.fill();
      c.fillStyle = '#58e8ff';
      U.roundRect(c, 26, -3.5, 8, 7, 2); c.fill();
      c.restore();
      // shield shimmer
      if (d.shield > 0 && d.inv > .3) {
        c.globalAlpha = .5;
        c.strokeStyle = '#58e8ff'; c.lineWidth = 2.5;
        c.beginPath(); c.arc(0, -44, 34, 0, 7); c.stroke();
        c.globalAlpha = 1;
      }
      c.restore();
    }
  }

  window.Milo.register({
    id: 'mech-storm', title: 'Mech Storm', emo: '🤖', category: 'Action',
    tagline: 'Jump jets, arm cannon, one long canyon',
    description: 'Your mech marches itself down the canyon — you work the jump jets ' +
      'and the arm cannon. Drone squadrons dive from the right while dug-in turrets ' +
      'lob arcing shells you have to jet over. The shield soaks hits but only ' +
      'recharges in the calm between skirmishes, so end fights fast; hull damage ' +
      'never heals, and three hull hits end the march.',
    controls: ['Space / ↑ jets', 'Mouse aim + fire', 'X fire'],
    colors: ['#61213a', '#58e8ff'],
    tags: ['mech', 'shooter', 'canyon', 'jetpack', 'skirmish'],
    mount: mount
  });
})();
