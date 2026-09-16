/* Alien Swarm — arena shooter: you steer, the gun aims itself, the swarm flocks. */
(function () {
  'use strict';
  var W = 800, H = 600, WALL = 18;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    var UPGRADES = [
      { name: 'RAPID COILS', apply: function (d) { d.rate = .22; } },
      { name: 'TWIN CANNONS', apply: function (d) { d.guns = 2; } },
      { name: 'HEAVY ROUNDS', apply: function (d) { d.dmg = 2; } },
      { name: 'RAPID COILS II', apply: function (d) { d.rate = .16; } },
      { name: 'TRIPLE SPREAD', apply: function (d) { d.guns = 3; } },
      { name: 'PIERCING BOLTS', apply: function (d) { d.pierce = true; } },
      { name: 'HEAVY ROUNDS II', apply: function (d) { d.dmg = 3; } },
      { name: 'OVERDRIVE', apply: function (d) { d.rate = .11; } }
    ];

    function reset(g) {
      var d = g.data;
      d.p = { x: W / 2, y: H / 2, r: 14, hp: 5, inv: 1.5, cool: 0, aim: 0 };
      d.aliens = [];
      d.bullets = [];
      d.globs = [];
      d.parts = [];
      d.wave = 0;
      d.spawnLeft = 0;
      d.spawnT = 0;
      d.betweenT = 1.2;
      d.rate = .28; d.guns = 1; d.dmg = 1; d.pierce = false;
      d.upgradeIdx = 0;
      d.banner = null; d.bannerT = 0;
      d.shake = 0;
      d.ptr = null;
      g.set('Score', 0);
      g.set('Wave', 0);
      g.set('Hull', '♥♥♥♥♥');
    }

    function setHull(g) {
      var s = '', hp = Math.max(0, g.data.p.hp);
      for (var i = 0; i < hp; i++) s += '♥';
      g.set('Hull', s || '—');
    }

    function startWave(g) {
      var d = g.data;
      d.wave++;
      g.set('Wave', d.wave);
      d.spawnLeft = 8 + d.wave * 4;
      d.spawnT = 0;
      d.banner = 'WAVE ' + d.wave;
      d.bannerT = 1.4;
      Milo.sound.tone({ f: 160, f2: 340, d: .35, v: .1, type: 'sawtooth' });
    }

    function spawnAlien(d) {
      var side = (Math.random() * 4) | 0, x, y;
      if (side === 0) { x = U.rand(0, W); y = -20; }
      else if (side === 1) { x = U.rand(0, W); y = H + 20; }
      else if (side === 2) { x = -20; y = U.rand(0, H); }
      else { x = W + 20; y = U.rand(0, H); }
      var r = Math.random(), kind = 'drone';
      if (d.wave >= 5 && r < .12) kind = 'hulk';
      else if (d.wave >= 3 && r < .32) kind = 'spitter';
      d.aliens.push({
        kind: kind, x: x, y: y,
        r: kind === 'hulk' ? 26 : kind === 'spitter' ? 13 : 10,
        hp: kind === 'hulk' ? 10 + d.wave : kind === 'spitter' ? 3 : 1 + Math.floor(d.wave / 4),
        sp: (kind === 'hulk' ? 42 : kind === 'spitter' ? 68 : 92) + d.wave * 4,
        t: Math.random() * 6, cool: U.rand(1.5, 3),
        vx: 0, vy: 0
      });
    }

    function shard(d, x, y, col, n) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.28, s = U.rand(50, 260);
        d.parts.push({
          x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
          rot: Math.random() * 6.28, spin: U.rand(-9, 9),
          life: U.rand(.3, .6), max: .6, col: col, sz: U.rand(3, 7)
        });
      }
    }

    function shoot(g) {
      var d = g.data, p = d.p;
      if (p.cool > 0 || !d.aliens.length) return;
      var best = null, bd = 1e9;
      d.aliens.forEach(function (a) {
        var dd = U.dist(p.x, p.y, a.x, a.y);
        if (dd < bd) { bd = dd; best = a; }
      });
      if (!best) return;
      p.cool = d.rate;
      p.aim = Math.atan2(best.y - p.y, best.x - p.x);
      var spread = d.guns === 3 ? .18 : d.guns === 2 ? .07 : 0;
      for (var i = 0; i < d.guns; i++) {
        var off = d.guns === 1 ? 0 : (i - (d.guns - 1) / 2) * spread * 2;
        d.bullets.push({
          x: p.x + Math.cos(p.aim) * 16, y: p.y + Math.sin(p.aim) * 16,
          vx: Math.cos(p.aim + off) * 560, vy: Math.sin(p.aim + off) * 560,
          hits: d.pierce ? 3 : 1
        });
      }
      Milo.sound.tone({ f: 1100, f2: 480, d: .05, v: .04, type: 'square' });
    }

    return Milo.arcade(host, {
      id: 'alien-swarm',
      w: W, h: H, bg: '#12081f',
      stats: ['Score', 'Wave', 'Hull'],
      emo: '👾',
      touch: 'dpad',
      start: {
        title: 'Alien Swarm',
        text: 'Your cannon aims and fires itself at the nearest alien — all you do is ' +
          'not get touched. Clear a wave, get a weapon upgrade. The swarm flocks.',
        keys: ['WASD / Arrows to move', 'Or hold the pointer where you want to go']
      },
      init: reset,
      onPointer: function (g, type, x, y) {
        if (type === 'down' || type === 'move') {
          if (g.input.pdown) g.data.ptr = { x: x, y: y };
        }
        if (type === 'up') g.data.ptr = null;
      },

      update: function (g, dt) {
        var d = g.data, p = d.p;

        var ax = g.input.axis();
        var mx = ax.x, my = ax.y;
        if (!mx && !my && d.ptr) {
          var pd = U.dist(p.x, p.y, d.ptr.x, d.ptr.y);
          if (pd > 10) { mx = (d.ptr.x - p.x) / pd; my = (d.ptr.y - p.y) / pd; }
        }
        var ml = Math.hypot(mx, my) || 1;
        p.x = U.clamp(p.x + mx / ml * 270 * dt, WALL + p.r, W - WALL - p.r);
        p.y = U.clamp(p.y + my / ml * 270 * dt, WALL + p.r, H - WALL - p.r);
        p.cool -= dt;
        p.inv = Math.max(0, p.inv - dt);
        d.shake = Math.max(0, d.shake - dt * 3);
        d.bannerT -= dt;

        shoot(g);

        /* waves */
        if (d.spawnLeft > 0) {
          d.spawnT -= dt;
          if (d.spawnT <= 0) {
            d.spawnT = Math.max(.12, .55 - d.wave * .03);
            d.spawnLeft--;
            spawnAlien(d);
          }
        } else if (!d.aliens.length) {
          d.betweenT -= dt;
          if (d.betweenT <= 0) {
            if (d.wave > 0) {
              g.score += 40 + d.wave * 10;
              g.set('Score', U.fmt(g.score));
              if (d.upgradeIdx < UPGRADES.length) {
                var up = UPGRADES[d.upgradeIdx++];
                up.apply(d);
                d.banner = '⬆ ' + up.name;
                d.bannerT = 2;
                Milo.sound.powerup();
              }
            }
            startWave(g);
            d.betweenT = 1.6;
          }
        }

        /* aliens flock: seek + separate */
        for (var k = d.aliens.length - 1; k >= 0; k--) {
          var a = d.aliens[k];
          a.t += dt;
          var ang = Math.atan2(p.y - a.y, p.x - a.x);
          var want = a.sp;
          if (a.kind === 'spitter') {
            var dd = U.dist(a.x, a.y, p.x, p.y);
            if (dd < 200) want = -a.sp * .8; // back off to spit range
            a.cool -= dt;
            if (a.cool <= 0 && dd < 420) {
              a.cool = U.rand(1.8, 3.2) / (1 + d.wave * .04);
              var gs = 190 + d.wave * 8;
              d.globs.push({ x: a.x, y: a.y, vx: Math.cos(ang) * gs, vy: Math.sin(ang) * gs, r: 6 });
              Milo.sound.tone({ f: 300, f2: 140, d: .1, v: .06, type: 'triangle' });
            }
          }
          a.vx += (Math.cos(ang) * want - a.vx) * 2.4 * dt;
          a.vy += (Math.sin(ang) * want - a.vy) * 2.4 * dt;
          a.vx += Math.cos(a.t * 3.1) * 30 * dt;
          a.vy += Math.sin(a.t * 2.7) * 30 * dt;
          for (var o = 0; o < d.aliens.length; o++) {
            var oa = d.aliens[o];
            if (oa === a) continue;
            var sd = U.dist(a.x, a.y, oa.x, oa.y);
            if (sd < a.r + oa.r + 4 && sd > 0) {
              a.vx += (a.x - oa.x) / sd * 90 * dt;
              a.vy += (a.y - oa.y) / sd * 90 * dt;
            }
          }
          a.x += a.vx * dt; a.y += a.vy * dt;

          if (p.inv <= 0 && U.dist(a.x, a.y, p.x, p.y) < a.r + p.r) {
            hurt(g, a.kind === 'hulk' ? 2 : 1);
            if (a.kind !== 'hulk') { killAlien(g, k, false); }
            if (g.state === 'over') return;
          }
        }

        /* bullets */
        for (var b = d.bullets.length - 1; b >= 0; b--) {
          var bl = d.bullets[b];
          bl.x += bl.vx * dt; bl.y += bl.vy * dt;
          if (bl.x < 0 || bl.x > W || bl.y < 0 || bl.y > H) { d.bullets.splice(b, 1); continue; }
          for (var j = d.aliens.length - 1; j >= 0; j--) {
            var al = d.aliens[j];
            if (U.dist(bl.x, bl.y, al.x, al.y) < al.r + 4) {
              al.hp -= d.dmg;
              shard(d, bl.x, bl.y, '#e9d5ff', 3);
              if (al.hp <= 0) killAlien(g, j, true);
              else Milo.sound.tone({ f: 500, f2: 320, d: .04, v: .04, type: 'square' });
              bl.hits--;
              if (bl.hits <= 0) { d.bullets.splice(b, 1); }
              break;
            }
          }
        }

        /* spitter globs */
        for (var q = d.globs.length - 1; q >= 0; q--) {
          var gb = d.globs[q];
          gb.x += gb.vx * dt; gb.y += gb.vy * dt;
          if (gb.x < 0 || gb.x > W || gb.y < 0 || gb.y > H) { d.globs.splice(q, 1); continue; }
          if (p.inv <= 0 && U.dist(gb.x, gb.y, p.x, p.y) < gb.r + p.r) {
            d.globs.splice(q, 1);
            hurt(g, 1);
            if (g.state === 'over') return;
          }
        }

        d.parts = d.parts.filter(function (pt) {
          pt.x += pt.vx * dt; pt.y += pt.vy * dt;
          pt.vx *= .96; pt.vy *= .96;
          pt.rot += pt.spin * dt; pt.life -= dt;
          return pt.life > 0;
        });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, p = d.p;
        c.fillStyle = '#12081f'; c.fillRect(0, 0, W, H);
        c.save();
        if (d.shake > 0) c.translate(U.rand(-1, 1) * d.shake * 5, U.rand(-1, 1) * d.shake * 5);

        // grid floor
        c.strokeStyle = 'rgba(217,70,239,.09)'; c.lineWidth = 1;
        for (var gx = WALL; gx <= W - WALL; gx += 48) {
          c.beginPath(); c.moveTo(gx, WALL); c.lineTo(gx, H - WALL); c.stroke();
        }
        for (var gy = WALL; gy <= H - WALL; gy += 48) {
          c.beginPath(); c.moveTo(WALL, gy); c.lineTo(W - WALL, gy); c.stroke();
        }
        // arena wall
        c.strokeStyle = '#d946ef'; c.lineWidth = 3;
        c.shadowColor = '#d946ef'; c.shadowBlur = 14;
        c.strokeRect(WALL, WALL, W - WALL * 2, H - WALL * 2);
        c.shadowBlur = 0;

        // globs
        d.globs.forEach(function (gb) {
          c.shadowColor = '#4ade80'; c.shadowBlur = 10;
          c.fillStyle = '#4ade80';
          c.beginPath(); c.arc(gb.x, gb.y, gb.r, 0, 7); c.fill();
          c.shadowBlur = 0;
        });

        // aliens
        d.aliens.forEach(function (a) {
          var col = a.kind === 'hulk' ? '#f43f5e' : a.kind === 'spitter' ? '#4ade80' : '#a78bfa';
          var pulse = 1 + Math.sin(a.t * 6) * .08;
          c.save();
          c.translate(a.x, a.y);
          c.rotate(Math.atan2(p.y - a.y, p.x - a.x));
          c.shadowColor = col; c.shadowBlur = 12;
          c.fillStyle = col;
          if (a.kind === 'hulk') {
            // heavy hexagon
            c.beginPath();
            for (var h = 0; h < 6; h++) {
              var ha = h / 6 * 6.283;
              c.lineTo(Math.cos(ha) * a.r * pulse, Math.sin(ha) * a.r * pulse);
            }
            c.closePath(); c.fill();
          } else if (a.kind === 'spitter') {
            // diamond with a maw
            c.beginPath();
            c.moveTo(a.r * 1.2, 0); c.lineTo(0, a.r); c.lineTo(-a.r, 0); c.lineTo(0, -a.r);
            c.closePath(); c.fill();
          } else {
            // chevron drone
            c.beginPath();
            c.moveTo(a.r * 1.1, 0); c.lineTo(-a.r, a.r * .9); c.lineTo(-a.r * .4, 0); c.lineTo(-a.r, -a.r * .9);
            c.closePath(); c.fill();
          }
          c.shadowBlur = 0;
          c.fillStyle = '#12081f';
          c.beginPath(); c.arc(a.r * .2, 0, a.r * .24, 0, 7); c.fill();
          c.restore();
          if (a.kind === 'hulk') {
            c.fillStyle = 'rgba(0,0,0,.5)';
            c.fillRect(a.x - 20, a.y - a.r - 10, 40, 4);
            c.fillStyle = '#f43f5e';
            c.fillRect(a.x - 20, a.y - a.r - 10, 40 * a.hp / (10 + d.wave), 4);
          }
        });

        // bullets
        d.bullets.forEach(function (b) {
          c.shadowColor = '#22d3ee'; c.shadowBlur = 8;
          c.strokeStyle = '#a5f3fc'; c.lineWidth = 3; c.lineCap = 'round';
          c.beginPath();
          c.moveTo(b.x, b.y);
          c.lineTo(b.x - b.vx * .018, b.y - b.vy * .018);
          c.stroke();
          c.shadowBlur = 0;
        });

        // shard particles (spinning triangles)
        d.parts.forEach(function (pt) {
          c.globalAlpha = Math.max(0, pt.life / pt.max);
          c.save();
          c.translate(pt.x, pt.y); c.rotate(pt.rot);
          c.fillStyle = pt.col;
          c.beginPath();
          c.moveTo(pt.sz, 0); c.lineTo(-pt.sz * .6, pt.sz * .7); c.lineTo(-pt.sz * .6, -pt.sz * .7);
          c.closePath(); c.fill();
          c.restore();
        });
        c.globalAlpha = 1;

        // player
        if (p.inv <= 0 || Math.floor(g.t * 14) % 2 === 0) {
          c.save();
          c.translate(p.x, p.y);
          c.rotate(p.aim);
          c.shadowColor = '#22d3ee'; c.shadowBlur = 18;
          c.fillStyle = '#f0fdff';
          c.beginPath(); c.arc(0, 0, p.r, 0, 7); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = '#22d3ee';
          c.fillRect(6, -3.5, 16, 7);
          if (d.guns >= 2) { c.fillRect(4, -9, 12, 4); c.fillRect(4, 5, 12, 4); }
          c.fillStyle = '#0e7490';
          c.beginPath(); c.arc(0, 0, 5.5, 0, 7); c.fill();
          c.restore();
        }

        if (d.bannerT > 0 && d.banner) {
          c.globalAlpha = Math.min(1, d.bannerT);
          c.textAlign = 'center';
          c.fillStyle = '#e9d5ff';
          c.font = '800 34px Outfit, sans-serif';
          c.fillText(d.banner, W / 2, H / 2 - 90);
          c.globalAlpha = 1;
        }
        c.restore();
      }
    });

    function killAlien(g, idx, scored) {
      var d = g.data, a = d.aliens[idx];
      if (!a) return;
      d.aliens.splice(idx, 1);
      var col = a.kind === 'hulk' ? '#f43f5e' : a.kind === 'spitter' ? '#4ade80' : '#a78bfa';
      shard(d, a.x, a.y, col, a.kind === 'hulk' ? 22 : 10);
      if (a.kind === 'hulk') d.shake = Math.max(d.shake, .5);
      if (scored) {
        g.score += a.kind === 'hulk' ? 80 : a.kind === 'spitter' ? 30 : 15;
        g.set('Score', window.Milo.util.fmt(g.score));
      }
      window.Milo.sound.explode();
    }

    function hurt(g, dmg) {
      var d = g.data, p = d.p;
      p.hp -= dmg;
      p.inv = 1.4;
      d.shake = Math.max(d.shake, .7);
      setHull(g);
      shard(d, p.x, p.y, '#f0fdff', 14);
      window.Milo.sound.hit();
      if (p.hp <= 0) {
        g.gameOver({ text: 'Overrun on wave ' + d.wave + ' with ' + (d.upgradeIdx) + ' upgrades earned.' });
      }
    }
  }

  window.Milo.register({
    id: 'alien-swarm', title: 'Alien Swarm', emo: '👾', category: 'Action',
    tagline: 'You steer, the cannon does the killing',
    description: 'A twin-stick shooter where the second stick is automatic: your cannon ' +
      'always fires at the nearest alien, so the whole game is positioning. Chevron drones ' +
      'flock straight at you, green spitters hang back and lob globs, and rose hulks soak a ' +
      'dozen hits. Every cleared wave bolts on a real upgrade — twin cannons, piercing ' +
      'bolts, overdrive — and kiting the swarm into one line is how you survive the late waves.',
    controls: ['WASD / Arrows', 'Hold pointer to steer'],
    colors: ['#a855f7', '#4ade80'],
    tags: ['shooter', 'aliens', 'arena', 'waves', 'auto-fire'],
    mount: mount
  });
})();
