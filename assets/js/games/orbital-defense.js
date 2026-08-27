/* Orbital Defense — swing one golden shield around your planet; every leak costs a ring. */
(function () {
  'use strict';
  var W = 800, H = 600, CX = W / 2, CY = H / 2, SHIELD_R = 152;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    var RING_COLS = ['#38bdf8', '#34d399', '#fbbf24'];

    function reset(g) {
      var d = g.data;
      d.sang = -Math.PI / 2;
      d.span = .95;
      d.wideT = 0;
      d.charge = 0;
      d.rings = [
        { r: 120, hp: 3, max: 3, crack: 0 },
        { r: 94, hp: 3, max: 3, crack: 0 },
        { r: 68, hp: 3, max: 3, crack: 0 }
      ];
      d.meteors = [];
      d.cores = [];
      d.parts = [];
      d.shocks = [];
      d.stars = [];
      d.wave = 0;
      d.spawnLeft = 0;
      d.spawnT = 0;
      d.betweenT = 1.5;
      d.coreT = 6;
      d.blocked = 0;
      d.flash = 0;
      d.shake = 0;
      d.banner = ''; d.bannerT = 0;
      d.mouse = null;
      for (var i = 0; i < 110; i++) {
        d.stars.push({ x: Math.random() * W, y: Math.random() * H, z: U.rand(.2, 1), tw: Math.random() * 6.28 });
      }
      g.set('Score', 0);
      g.set('Wave', 0);
      setRings(g);
    }

    function setRings(g) {
      var d = g.data, s = '';
      for (var i = d.rings.length - 1; i >= 0; i--) s += d.rings[i].hp > 0 ? '◉' : '·';
      g.set('Rings', s);
    }

    function outerRing(d) {
      for (var i = 0; i < d.rings.length; i++) if (d.rings[i].hp > 0) return d.rings[i];
      return null;
    }

    function startWave(g) {
      var d = g.data;
      d.wave++;
      g.set('Wave', d.wave);
      d.spawnLeft = 6 + d.wave * 3;
      d.spawnT = .4;
      d.banner = 'WAVE ' + d.wave;
      d.bannerT = 1.5;
      Milo.sound.tone({ f: 150, f2: 300, d: .35, v: .1, type: 'sawtooth' });
    }

    function spawnMeteor(d) {
      var big = d.wave >= 3 && Math.random() < .22;
      d.meteors.push({
        a: Math.random() * 6.283,
        dist: 480 + Math.random() * 60,
        sp: (big ? 52 : 66) + d.wave * 6 + U.rand(-8, 8),
        drift: U.rand(-.16, .16),
        r: big ? 17 : U.rand(8, 12),
        big: big,
        rot: Math.random() * 6.28,
        spin: U.rand(-3, 3),
        verts: makeVerts(big ? 17 : 10)
      });
    }

    function makeVerts(r) {
      var v = [];
      for (var i = 0; i < 8; i++) v.push(r * U.rand(.72, 1.15));
      return v;
    }

    function shatter(d, x, y, col, n) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.28, s = U.rand(50, 280);
        d.parts.push({
          x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
          rot: Math.random() * 6.28, spin: U.rand(-8, 8),
          life: U.rand(.3, .7), max: .7, col: col, sz: U.rand(2.5, 6)
        });
      }
    }

    function angDiff(a, b) {
      var dd = a - b;
      while (dd > Math.PI) dd -= 6.283;
      while (dd < -Math.PI) dd += 6.283;
      return dd;
    }

    function planetHit(g, m) {
      var d = g.data;
      var ring = outerRing(d);
      var hx = CX + Math.cos(m.a) * (ring ? ring.r : 40);
      var hy = CY + Math.sin(m.a) * (ring ? ring.r : 40);
      shatter(d, hx, hy, '#f87171', 16);
      d.shocks.push({ x: hx, y: hy, r: 6, max: 60, col: '#f87171' });
      d.shake = Math.max(d.shake, .9);
      d.flash = .4;
      Milo.sound.explode();
      if (!ring) {
        g.gameOver({
          emo: '🪐', title: 'Planet Lost',
          text: 'The core cracked on wave ' + d.wave + ' after ' + d.blocked + ' blocks.'
        });
        return;
      }
      ring.hp -= m.big ? 2 : 1;
      ring.crack = 1;
      if (ring.hp <= 0) {
        ring.hp = 0;
        // the whole ring blows out
        for (var i = 0; i < 26; i++) {
          var a = Math.random() * 6.283;
          shatter(d, CX + Math.cos(a) * ring.r, CY + Math.sin(a) * ring.r, '#cbd5e1', 1);
        }
        d.shocks.push({ x: CX, y: CY, r: ring.r, max: ring.r + 90, col: '#f87171' });
        d.banner = 'RING DOWN!';
        d.bannerT = 1.8;
        Milo.sound.tone({ f: 200, f2: 40, d: .8, v: .16, type: 'sawtooth' });
      }
      setRings(g);
    }

    return Milo.arcade(host, {
      id: 'orbital-defense',
      w: W, h: H, bg: '#0b0618',
      stats: ['Score', 'Wave', 'Rings'],
      emo: '🪐',
      touch: 'dpad',
      start: {
        title: 'Orbital Defense',
        text: 'One golden shield orbits your planet — swing it into every falling ' +
          'meteor. Leaks burn away the planet rings one by one. Catch amber cores ' +
          'to charge a wider shield, green ones to regrow a ring.',
        keys: ['Mouse swings the shield', '← → also rotate']
      },
      init: reset,
      onPointer: function (g, type, x, y) {
        g.data.mouse = { x: x, y: y };
      },

      update: function (g, dt) {
        var d = g.data;
        d.shake = Math.max(0, d.shake - dt * 3);
        d.flash = Math.max(0, d.flash - dt * 1.5);
        d.bannerT -= dt;

        /* shield steering */
        if (g.input.down('left')) { d.sang -= 3.2 * dt; d.mouse = null; }
        if (g.input.down('right')) { d.sang += 3.2 * dt; d.mouse = null; }
        if (d.mouse) {
          var want = Math.atan2(d.mouse.y - CY, d.mouse.x - CX);
          d.sang += angDiff(want, d.sang) * Math.min(1, 13 * dt);
        }
        if (d.wideT > 0) {
          d.wideT -= dt;
          d.span = U.lerp(d.span, 1.75, Math.min(1, 8 * dt));
        } else {
          d.span = U.lerp(d.span, .95, Math.min(1, 4 * dt));
        }

        /* waves */
        if (d.spawnLeft > 0) {
          d.spawnT -= dt;
          if (d.spawnT <= 0) {
            d.spawnT = Math.max(.32, 1.35 - d.wave * .08) * U.rand(.7, 1.3);
            d.spawnLeft--;
            spawnMeteor(d);
          }
        } else if (!d.meteors.length) {
          d.betweenT -= dt;
          if (d.betweenT <= 0) {
            if (d.wave > 0) {
              g.score += 30 + d.wave * 10;
              g.set('Score', U.fmt(g.score));
            }
            startWave(g);
            d.betweenT = 2.5;
          }
        }

        /* power cores drift in during waves */
        d.coreT -= dt;
        if (d.coreT <= 0 && d.wave > 0) {
          d.coreT = U.rand(6, 10);
          d.cores.push({
            a: Math.random() * 6.283, dist: 500, sp: 52,
            drift: U.rand(-.3, .3),
            kind: Math.random() < .38 ? 'repair' : 'charge', t: 0
          });
        }

        /* meteors fall inward */
        for (var k = d.meteors.length - 1; k >= 0; k--) {
          var m = d.meteors[k];
          m.dist -= m.sp * dt;
          m.a += m.drift * dt;
          m.rot += m.spin * dt;
          var mx = CX + Math.cos(m.a) * m.dist;
          var my = CY + Math.sin(m.a) * m.dist;
          // ember trail
          if (Math.random() < .5) {
            d.parts.push({
              x: mx, y: my, vx: Math.cos(m.a) * 40 + U.rand(-15, 15), vy: Math.sin(m.a) * 40 + U.rand(-15, 15),
              rot: 0, spin: 0, life: .35, max: .35, col: m.big ? '#fb923c' : '#f472b6', sz: U.rand(1.5, 3)
            });
          }

          // big rocks split before reaching the shield
          if (m.big && m.dist < 250) {
            d.meteors.splice(k, 1);
            for (var sp2 = -1; sp2 <= 1; sp2 += 2) {
              d.meteors.push({
                a: m.a + sp2 * .16, dist: m.dist, sp: m.sp + 18,
                drift: m.drift + sp2 * .1, r: 9, big: false,
                rot: Math.random() * 6.28, spin: U.rand(-4, 4), verts: makeVerts(9)
              });
            }
            shatter(d, mx, my, '#fb923c', 8);
            Milo.sound.tone({ f: 240, f2: 120, d: .15, v: .09, type: 'sawtooth' });
            continue;
          }

          // shield block
          if (m.dist <= SHIELD_R + m.r && m.dist > SHIELD_R - 18 &&
            Math.abs(angDiff(m.a, d.sang)) < d.span / 2 + m.r / SHIELD_R) {
            d.meteors.splice(k, 1);
            d.blocked++;
            g.score += 10 + d.wave * 2;
            g.set('Score', U.fmt(g.score));
            shatter(d, mx, my, '#94a3b8', 10);
            d.shocks.push({ x: mx, y: my, r: 4, max: 36, col: '#fbbf24' });
            Milo.sound.tone({ f: 500, f2: 180, d: .09, v: .09, type: 'square' });
            continue;
          }

          // leak: hits the outermost surviving ring (or the core)
          var ring = outerRing(d);
          var hitR = ring ? ring.r : 40;
          if (m.dist <= hitR + m.r) {
            d.meteors.splice(k, 1);
            planetHit(g, m);
            if (g.state === 'over') return;
          }
        }

        /* cores */
        for (var c2 = d.cores.length - 1; c2 >= 0; c2--) {
          var co = d.cores[c2];
          co.t += dt;
          co.dist -= co.sp * dt;
          co.a += co.drift * dt;
          var cx2 = CX + Math.cos(co.a) * co.dist;
          var cy2 = CY + Math.sin(co.a) * co.dist;
          if (co.dist <= SHIELD_R + 10 && co.dist > SHIELD_R - 18 &&
            Math.abs(angDiff(co.a, d.sang)) < d.span / 2 + .06) {
            d.cores.splice(c2, 1);
            if (co.kind === 'repair') {
              // regrow the innermost dead ring, else patch the weakest
              var target = null;
              for (var ri = d.rings.length - 1; ri >= 0; ri--) {
                if (d.rings[ri].hp <= 0) { target = d.rings[ri]; break; }
                if (!target || d.rings[ri].hp < target.hp) target = d.rings[ri];
              }
              if (target && target.hp < target.max) {
                target.hp++;
                d.banner = 'RING RESTORED';
              } else {
                g.score += 50;
                d.banner = '+50';
              }
              d.bannerT = 1.4;
              setRings(g);
            } else {
              g.score += 75;
              d.charge++;
              if (d.charge >= 3) {
                d.charge = 0;
                d.wideT = 9;
                d.banner = 'SHIELD SURGE!';
                d.bannerT = 2;
              }
            }
            g.set('Score', U.fmt(g.score));
            shatter(d, cx2, cy2, co.kind === 'repair' ? '#4ade80' : '#fbbf24', 12);
            Milo.sound.powerup();
            continue;
          }
          if (co.dist < 60) {
            d.cores.splice(c2, 1);
            shatter(d, cx2, cy2, '#64748b', 5);
          }
        }

        d.rings.forEach(function (r) { r.crack = Math.max(0, r.crack - dt); });
        d.shocks = d.shocks.filter(function (s) { s.r += 180 * dt; return s.r < s.max; });
        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.spin * dt; p.life -= dt;
          return p.life > 0;
        });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.fillStyle = '#0b0618'; c.fillRect(0, 0, W, H);

        c.save();
        if (d.shake > 0) c.translate(U.rand(-1, 1) * d.shake * 5, U.rand(-1, 1) * d.shake * 5);

        // nebula washes
        var neb = c.createRadialGradient(160, 120, 20, 160, 120, 300);
        neb.addColorStop(0, 'rgba(124,92,255,.12)'); neb.addColorStop(1, 'rgba(124,92,255,0)');
        c.fillStyle = neb; c.fillRect(0, 0, W, H);
        var neb2 = c.createRadialGradient(660, 480, 20, 660, 480, 280);
        neb2.addColorStop(0, 'rgba(244,114,182,.09)'); neb2.addColorStop(1, 'rgba(244,114,182,0)');
        c.fillStyle = neb2; c.fillRect(0, 0, W, H);

        // stars
        d.stars.forEach(function (st) {
          c.globalAlpha = st.z * (.6 + Math.sin(g.t * 2 + st.tw) * .3);
          c.fillStyle = '#dbe4ff';
          c.fillRect(st.x, st.y, 1.4 + st.z, 1.4 + st.z);
        });
        c.globalAlpha = 1;

        // damage flash
        if (d.flash > 0) {
          c.fillStyle = 'rgba(248,113,113,' + d.flash * .16 + ')';
          c.fillRect(0, 0, W, H);
        }

        // planet rings (outermost first so inner draw on top)
        for (var i = 0; i < d.rings.length; i++) {
          var r = d.rings[i];
          if (r.hp <= 0) continue;
          var col = RING_COLS[i];
          c.globalAlpha = .25 + (r.hp / r.max) * .65 + (r.crack > 0 ? Math.sin(g.t * 30) * .2 : 0);
          c.strokeStyle = col;
          c.lineWidth = 9;
          c.shadowColor = col; c.shadowBlur = 12;
          if (r.hp < r.max) c.setLineDash(r.hp === 1 ? [10, 7] : [24, 5]);
          c.beginPath(); c.arc(CX, CY, r.r, g.t * .2 * (i % 2 ? 1 : -1), g.t * .2 * (i % 2 ? 1 : -1) + 6.283); c.stroke();
          c.setLineDash([]);
          c.shadowBlur = 0;
        }
        c.globalAlpha = 1;

        // the planet core
        var pg = c.createRadialGradient(CX - 12, CY - 12, 4, CX, CY, 42);
        pg.addColorStop(0, '#7de8d8');
        pg.addColorStop(.7, '#1d8a7a');
        pg.addColorStop(1, '#0d4a44');
        c.fillStyle = pg;
        c.beginPath(); c.arc(CX, CY, 40, 0, 7); c.fill();
        // drifting surface blotches
        c.save();
        c.beginPath(); c.arc(CX, CY, 40, 0, 7); c.clip();
        c.fillStyle = 'rgba(10,60,55,.5)';
        for (var bl = 0; bl < 4; bl++) {
          var ba = g.t * .3 + bl * 1.7;
          c.beginPath();
          c.ellipse(CX + Math.cos(ba) * 22, CY + Math.sin(ba * .7) * 18, 12, 7, ba, 0, 7);
          c.fill();
        }
        c.restore();

        // shield arc
        var wide = d.wideT > 0;
        var scol = wide ? '#fde68a' : '#fbbf24';
        c.strokeStyle = scol;
        c.lineWidth = 9;
        c.lineCap = 'round';
        c.shadowColor = scol; c.shadowBlur = 18;
        c.beginPath();
        c.arc(CX, CY, SHIELD_R, d.sang - d.span / 2, d.sang + d.span / 2);
        c.stroke();
        c.shadowBlur = 0;
        // emitter pods at the arc tips
        for (var e = -1; e <= 1; e += 2) {
          var ea = d.sang + e * d.span / 2;
          c.fillStyle = '#78350f';
          c.beginPath(); c.arc(CX + Math.cos(ea) * SHIELD_R, CY + Math.sin(ea) * SHIELD_R, 6.5, 0, 7); c.fill();
          c.fillStyle = scol;
          c.beginPath(); c.arc(CX + Math.cos(ea) * SHIELD_R, CY + Math.sin(ea) * SHIELD_R, 3, 0, 7); c.fill();
        }
        // charge pips
        for (var cp = 0; cp < 3; cp++) {
          var pa = d.sang + (cp - 1) * .16;
          c.fillStyle = cp < d.charge ? '#fbbf24' : 'rgba(251,191,36,.18)';
          c.beginPath();
          c.arc(CX + Math.cos(pa) * (SHIELD_R + 16), CY + Math.sin(pa) * (SHIELD_R + 16), 3, 0, 7);
          c.fill();
        }

        // meteors
        d.meteors.forEach(function (m) {
          var mx = CX + Math.cos(m.a) * m.dist;
          var my = CY + Math.sin(m.a) * m.dist;
          c.save();
          c.translate(mx, my);
          c.rotate(m.rot);
          c.fillStyle = m.big ? '#7c4a28' : '#5b6478';
          c.beginPath();
          for (var v = 0; v < 8; v++) {
            var va = v / 8 * 6.283;
            c.lineTo(Math.cos(va) * m.verts[v], Math.sin(va) * m.verts[v]);
          }
          c.closePath(); c.fill();
          c.fillStyle = 'rgba(0,0,0,.3)';
          c.beginPath(); c.arc(m.r * .3, m.r * .2, m.r * .3, 0, 7); c.fill();
          c.restore();
        });

        // cores
        d.cores.forEach(function (co) {
          var cx2 = CX + Math.cos(co.a) * co.dist;
          var cy2 = CY + Math.sin(co.a) * co.dist;
          var col = co.kind === 'repair' ? '#4ade80' : '#fbbf24';
          c.save();
          c.translate(cx2, cy2);
          c.rotate(co.t * 2);
          c.shadowColor = col; c.shadowBlur = 14;
          c.fillStyle = col;
          c.beginPath();
          c.moveTo(0, -9); c.lineTo(7, 0); c.lineTo(0, 9); c.lineTo(-7, 0);
          c.closePath(); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = '#0b0618';
          c.font = '800 9px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText(co.kind === 'repair' ? '+' : '⚡', 0, 3);
          c.restore();
        });

        // shockwaves + shards
        d.shocks.forEach(function (s) {
          c.globalAlpha = Math.max(0, 1 - s.r / s.max);
          c.strokeStyle = s.col; c.lineWidth = 3;
          c.beginPath(); c.arc(s.x, s.y, s.r, 0, 7); c.stroke();
        });
        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.save();
          c.translate(p.x, p.y); c.rotate(p.rot);
          c.fillStyle = p.col;
          c.fillRect(-p.sz / 2, -p.sz / 2, p.sz, p.sz);
          c.restore();
        });
        c.globalAlpha = 1;

        if (d.wideT > 0) {
          c.fillStyle = '#fde68a';
          c.font = '700 12px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText('SURGE ' + d.wideT.toFixed(1) + 's', CX, CY + 70);
        }

        if (d.bannerT > 0 && d.banner) {
          c.globalAlpha = Math.min(1, d.bannerT);
          c.textAlign = 'center';
          c.fillStyle = d.banner === 'RING DOWN!' ? '#f87171' : '#fde68a';
          c.font = '800 32px Outfit, sans-serif';
          c.fillText(d.banner, W / 2, 96);
          c.globalAlpha = 1;
        }
        c.restore();
      }
    });
  }

  window.Milo.register({
    id: 'orbital-defense', title: 'Orbital Defense', emo: '🪐', category: 'Action',
    tagline: 'One shield between your planet and the storm',
    description: 'Meteors fall in from every angle and you have exactly one shield arc ' +
      'to swing around the planet. Every leak burns the outermost ring — three hits ' +
      'each, big rocks count double and split in two on the way down — and once the ' +
      'rings are gone the next strike is fatal. Catch three amber cores on the shield ' +
      'for a nine-second double-width surge, and green cores to regrow a lost ring.',
    controls: ['Mouse', '← →'],
    colors: ['#0b0618', '#fbbf24'],
    tags: ['defense', 'meteors', 'orbit', 'waves', 'reflex'],
    mount: mount
  });
})();
