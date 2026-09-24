/* Centipede Strike — the segmented crawler weaves down through the spore field. */
(function () {
  'use strict';
  var CELL = 32, COLS = 20, ROWS = 22;
  var W = COLS * CELL, H = ROWS * CELL;
  var PLAYER_TOP = ROWS - 6;          // the band the gunner is allowed to roam

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    /* ------------------------------------------------------------ helpers */

    function key(cx, cy) { return cy * COLS + cx; }

    function sporeAt(d, cx, cy) {
      if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) return null;
      return d.spores[key(cx, cy)] || null;
    }

    function plantSpore(d, cx, cy) {
      if (cx < 0 || cx >= COLS || cy < 1 || cy >= ROWS - 1) return;
      if (d.spores[key(cx, cy)]) return;
      d.spores[key(cx, cy)] = { x: cx, y: cy, hp: 4, pop: 0 };
    }

    function seedField(d, count) {
      var tries = 0;
      while (count > 0 && tries < 900) {
        tries++;
        var cx = U.randInt(0, COLS - 1), cy = U.randInt(2, ROWS - 4);
        if (d.spores[key(cx, cy)]) continue;
        plantSpore(d, cx, cy);
        count--;
      }
    }

    function burst(d, x, y, col, n, spd) {
      for (var i = 0; i < (n || 10); i++) {
        var a = Math.random() * 6.283, s = U.rand(30, spd || 190);
        d.parts.push({
          x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
          life: U.rand(.25, .55), max: .55, col: col, r: U.rand(1.6, 3.4)
        });
      }
    }

    /* --------------------------------------------------------- the crawler */

    function makeChain(d, len, col, startCol) {
      var segs = [];
      for (var i = 0; i < len; i++) {
        segs.push({ cx: startCol - i, cy: 0, px: (startCol - i) * CELL + CELL / 2, py: CELL / 2 });
      }
      d.chains.push({ segs: segs, dir: 1, down: 1, step: 0, col: col });
    }

    function buildRound(d, g) {
      d.chains = [];
      var len = Math.min(12, 6 + d.round);
      makeChain(d, len, '#ff4d9d', COLS - 2);
      if (d.round >= 3) makeChain(d, Math.min(6, 2 + ((d.round / 2) | 0)), '#c084fc', 3);
      d.stepTime = Math.max(0.055, 0.15 - d.round * 0.008);
      d.spiderTimer = Math.max(2.4, 7 - d.round * 0.5);
      d.fleaTimer = d.round >= 2 ? U.rand(5, 9) : 1e9;
      d.spiders = [];
      d.fleas = [];
      seedField(d, 4 + Math.min(14, d.round * 2));
      g.set('Round', d.round);
    }

    /* ------------------------------------------------------------- reset */

    function reset(g) {
      var d = g.data;
      d.spores = {};
      d.chains = [];
      d.spiders = [];
      d.fleas = [];
      d.shots = [];
      d.parts = [];
      d.round = 1;
      d.lives = 3;
      d.shake = 0;
      d.respawn = 0;
      d.cool = 0;
      d.flash = 0;
      d.p = { x: W / 2, y: H - CELL * 1.6 };
      seedField(d, 34);
      buildRound(d, g);
      g.score = 0;
      g.set('Score', 0);
      g.set('Lives', 3);
      g.set('Round', 1);
    }

    function loseLife(g, why) {
      var d = g.data;
      if (d.respawn > 0) return;
      d.lives--;
      d.shake = 18;
      d.flash = .35;
      g.set('Lives', Math.max(0, d.lives));
      burst(d, d.p.x, d.p.y, '#ffe066', 26, 300);
      Milo.sound.explode();
      if (d.lives <= 0) {
        g.gameOver({ emo: '🐛', title: why || 'Overrun', text: 'You held out to round ' + d.round + '.' });
        return;
      }
      d.respawn = 1.4;
      d.p.x = W / 2; d.p.y = H - CELL * 1.6;
      d.shots = [];
      d.spiders = [];
    }

    function award(g, n) {
      g.score += n;
      g.set('Score', U.fmt(g.score));
    }

    /* -------------------------------------------------------- chain motion */

    function stepChain(d, ch, g) {
      var head = ch.segs[0];
      var nx = head.cx + ch.dir, ny = head.cy;
      var blocked = nx < 0 || nx >= COLS || !!sporeAt(d, nx, ny);
      if (blocked) {
        ch.dir *= -1;
        ny = head.cy + ch.down;
        nx = head.cx;
        if (ny >= ROWS - 1) { ch.down = -1; ny = head.cy - 1; }
        else if (ny < 1) { ch.down = 1; ny = head.cy + 1; }
      }
      // shift the body along the head's old trail
      for (var i = ch.segs.length - 1; i > 0; i--) {
        ch.segs[i].cx = ch.segs[i - 1].cx;
        ch.segs[i].cy = ch.segs[i - 1].cy;
      }
      head.cx = U.clamp(nx, 0, COLS - 1);
      head.cy = U.clamp(ny, 0, ROWS - 1);
      // Down in the gunner's band it eats its way through instead of turning.
      if (head.cy >= PLAYER_TOP) {
        var s = sporeAt(d, head.cx, head.cy);
        if (s) { delete d.spores[key(head.cx, head.cy)]; burst(d, s.x * CELL + 16, s.y * CELL + 16, '#2dd4bf', 6); }
      }
    }

    function splitChain(d, ch, idx) {
      var front = ch.segs.slice(0, idx);
      var back = ch.segs.slice(idx + 1);
      var made = [];
      if (front.length) made.push({ segs: front, dir: ch.dir, down: ch.down, step: ch.step, col: ch.col });
      if (back.length) made.push({ segs: back, dir: -ch.dir, down: ch.down, step: ch.step, col: ch.col });
      return made;
    }

    /* ------------------------------------------------------------- runner */

    return Milo.arcade(host, {
      id: 'centipede-strike',
      w: W, h: H, bg: '#03130c',
      stats: ['Score', 'Round', 'Lives'],
      touch: 'dpad',
      touchButtons: [{ key: 'action', label: 'FIRE' }],
      emo: '🐛',
      start: {
        title: 'Centipede Strike',
        text: 'A segmented crawler winds down through the spore field. Every shot that ' +
          'lands splits it into two shorter crawlers, and every burst spore plants a new ' +
          'blocker. Spiders bounce through your band — they are worth the most.',
        keys: ['Arrows / WASD to move', 'Space to fire']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, i = g.input;
        d.shake = Math.max(0, d.shake - dt * 44);
        d.flash = Math.max(0, d.flash - dt);
        if (d.respawn > 0) { d.respawn -= dt; }

        /* -- gunner -- */
        var sp = 260 * dt;
        var ax = (i.down('right') ? 1 : 0) - (i.down('left') ? 1 : 0);
        var ay = (i.down('down') ? 1 : 0) - (i.down('up') ? 1 : 0);
        if (i.pdown) {
          var dx = i.px - d.p.x, dy = i.py - d.p.y, m = Math.hypot(dx, dy);
          if (m > 6) { ax = dx / m; ay = dy / m; }
        }
        d.p.x = U.clamp(d.p.x + ax * sp, 14, W - 14);
        d.p.y = U.clamp(d.p.y + ay * sp, PLAYER_TOP * CELL + 12, H - 16);

        d.cool -= dt;
        if ((i.down('action') || i.pdown) && d.cool <= 0 && d.shots.length < 4 && d.respawn <= 0) {
          d.cool = 0.13;
          d.shots.push({ x: d.p.x, y: d.p.y - 16 });
          Milo.sound.tone({ f: 1020, f2: 560, d: .05, v: .045, type: 'square' });
        }

        /* -- shots -- */
        d.shots = d.shots.filter(function (s) {
          s.y -= 760 * dt;
          if (s.y < -10) return false;
          var scx = (s.x / CELL) | 0, scy = (s.y / CELL) | 0;

          // crawler segments
          for (var ci = 0; ci < d.chains.length; ci++) {
            var ch = d.chains[ci];
            for (var si = 0; si < ch.segs.length; si++) {
              var sg = ch.segs[si];
              if (Math.abs(sg.px - s.x) < 15 && Math.abs(sg.py - s.y) < 15) {
                plantSpore(d, sg.cx, sg.cy);
                award(g, si === 0 ? 100 : 10);
                burst(d, sg.px, sg.py, ch.col, 12, 200);
                Milo.sound.hit();
                var made = splitChain(d, ch, si);
                d.chains.splice(ci, 1);
                for (var k = 0; k < made.length; k++) d.chains.push(made[k]);
                return false;
              }
            }
          }
          // spiders
          for (var q = 0; q < d.spiders.length; q++) {
            var sp2 = d.spiders[q];
            if (Math.abs(sp2.x - s.x) < 20 && Math.abs(sp2.y - s.y) < 18) {
              var near = Math.abs(sp2.y - d.p.y);
              award(g, near < 60 ? 900 : near < 140 ? 600 : 300);
              burst(d, sp2.x, sp2.y, '#a78bfa', 18, 250);
              d.spiders.splice(q, 1);
              Milo.sound.coin();
              return false;
            }
          }
          // fleas
          for (var f = 0; f < d.fleas.length; f++) {
            var fl = d.fleas[f];
            if (Math.abs(fl.x - s.x) < 15 && Math.abs(fl.y - s.y) < 16) {
              fl.hp--;
              burst(d, fl.x, fl.y, '#fbbf24', 6, 140);
              if (fl.hp <= 0) { award(g, 200); d.fleas.splice(f, 1); Milo.sound.hit(); }
              else { fl.fast = true; Milo.sound.blip(); }
              return false;
            }
          }
          // spores
          var sporeHit = sporeAt(d, scx, scy);
          if (sporeHit) {
            sporeHit.hp--;
            sporeHit.pop = .18;
            burst(d, scx * CELL + 16, scy * CELL + 16, '#2dd4bf', 4, 90);
            if (sporeHit.hp <= 0) { delete d.spores[key(scx, scy)]; award(g, 1); }
            Milo.sound.tone({ f: 260, f2: 170, d: .04, v: .035, type: 'triangle' });
            return false;
          }
          return true;
        });

        /* -- crawler -- */
        for (var c2 = 0; c2 < d.chains.length; c2++) {
          var chain = d.chains[c2];
          chain.step += dt;
          while (chain.step >= d.stepTime) {
            chain.step -= d.stepTime;
            stepChain(d, chain, g);
          }
          var lerpT = U.clamp(chain.step / d.stepTime, 0, 1);
          for (var s3 = 0; s3 < chain.segs.length; s3++) {
            var seg = chain.segs[s3];
            var tx = seg.cx * CELL + CELL / 2, ty = seg.cy * CELL + CELL / 2;
            seg.px = U.lerp(seg.px, tx, Math.min(1, dt * 22));
            seg.py = U.lerp(seg.py, ty, Math.min(1, dt * 22));
            if (d.respawn <= 0 && U.dist(seg.px, seg.py, d.p.x, d.p.y) < 20) loseLife(g, 'Bitten');
          }
          if (lerpT < 0) lerpT = 0;
        }

        /* -- spiders -- */
        d.spiderTimer -= dt;
        if (d.spiderTimer <= 0) {
          d.spiderTimer = Math.max(2.2, 8 - d.round * 0.45) + U.rand(0, 2.5);
          var side = Math.random() < .5 ? -1 : 1;
          d.spiders.push({
            x: side < 0 ? -20 : W + 20, y: U.rand(PLAYER_TOP * CELL, H - 40),
            vx: side * U.rand(90, 130 + d.round * 6), vy: U.rand(90, 150), phase: 0
          });
        }
        d.spiders = d.spiders.filter(function (s) {
          s.phase += dt * 6;
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          var top = (PLAYER_TOP - 1) * CELL;
          if (s.y < top) { s.y = top; s.vy = Math.abs(s.vy); }
          if (s.y > H - 20) { s.y = H - 20; s.vy = -Math.abs(s.vy); }
          if (Math.random() < dt * 2.2) s.vy = -s.vy;
          // spiders clear the field as they go
          var cx = (s.x / CELL) | 0, cy = (s.y / CELL) | 0;
          if (sporeAt(d, cx, cy) && Math.random() < dt * 8) delete d.spores[key(cx, cy)];
          if (d.respawn <= 0 && U.dist(s.x, s.y, d.p.x, d.p.y) < 22) { loseLife(g, 'Spider got you'); return false; }
          return s.x > -60 && s.x < W + 60;
        });

        /* -- fleas: drop down replanting the field when it thins out -- */
        d.fleaTimer -= dt;
        var sporeCount = 0;
        for (var kk in d.spores) if (d.spores[kk]) sporeCount++;
        if (d.fleaTimer <= 0 && sporeCount < 26 && d.fleas.length < 2) {
          d.fleaTimer = U.rand(6, 11);
          d.fleas.push({ x: U.randInt(1, COLS - 2) * CELL + CELL / 2, y: -14, hp: 2, fast: false, drop: 0 });
        }
        d.fleas = d.fleas.filter(function (f) {
          f.y += (f.fast ? 260 : 130) * dt;
          f.drop -= dt;
          if (f.drop <= 0) {
            f.drop = .13;
            if (Math.random() < .55) plantSpore(d, (f.x / CELL) | 0, (f.y / CELL) | 0);
          }
          if (d.respawn <= 0 && U.dist(f.x, f.y, d.p.x, d.p.y) < 20) { loseLife(g, 'Flattened'); return false; }
          return f.y < H + 20;
        });

        /* -- particles -- */
        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .94; p.vy *= .94; p.life -= dt;
          return p.life > 0;
        });
        for (var kp in d.spores) { if (d.spores[kp] && d.spores[kp].pop > 0) d.spores[kp].pop -= dt; }

        /* -- round clear -- */
        if (!d.chains.length) {
          d.round++;
          award(g, 250 + d.round * 50);
          Milo.sound.powerup();
          buildRound(d, g);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#04170e');
        bg.addColorStop(1, '#010806');
        c.fillStyle = bg; c.fillRect(-30, -30, W + 60, H + 60);

        // faint hex-ish field grid
        c.strokeStyle = 'rgba(45,212,191,.06)';
        c.lineWidth = 1;
        for (var gx = 0; gx <= COLS; gx++) {
          c.beginPath(); c.moveTo(gx * CELL, 0); c.lineTo(gx * CELL, H); c.stroke();
        }
        for (var gy = 0; gy <= ROWS; gy++) {
          c.beginPath(); c.moveTo(0, gy * CELL); c.lineTo(W, gy * CELL); c.stroke();
        }

        // gunner band
        c.fillStyle = 'rgba(45,212,191,.05)';
        c.fillRect(0, PLAYER_TOP * CELL, W, H - PLAYER_TOP * CELL);
        c.strokeStyle = 'rgba(45,212,191,.28)';
        c.setLineDash([8, 8]);
        c.beginPath(); c.moveTo(0, PLAYER_TOP * CELL); c.lineTo(W, PLAYER_TOP * CELL); c.stroke();
        c.setLineDash([]);

        // spores
        for (var k in d.spores) {
          var s = d.spores[k];
          if (!s) continue;
          var sx = s.x * CELL + CELL / 2, sy = s.y * CELL + CELL / 2;
          var scale = 1 + (s.pop > 0 ? s.pop * 1.6 : 0);
          var tint = ['#0f766e', '#14b8a6', '#2dd4bf', '#5eead4'][U.clamp(s.hp - 1, 0, 3)];
          c.save(); c.translate(sx, sy); c.scale(scale, scale);
          c.fillStyle = '#053b34';
          c.fillRect(-3, 0, 6, 11);
          c.fillStyle = tint;
          c.beginPath(); c.arc(0, 0, 11, Math.PI, 0); c.closePath(); c.fill();
          c.fillStyle = 'rgba(255,255,255,.35)';
          c.beginPath(); c.arc(-3.5, -4, 2.4, 0, 7); c.fill();
          c.beginPath(); c.arc(4, -2, 1.7, 0, 7); c.fill();
          c.restore();
        }

        // crawler
        d.chains.forEach(function (ch) {
          for (var i = ch.segs.length - 1; i >= 0; i--) {
            var sg = ch.segs[i];
            var head = i === 0;
            c.save(); c.translate(sg.px, sg.py);
            // legs
            c.strokeStyle = head ? '#fde68a' : U.shade(ch.col, -.35);
            c.lineWidth = 2.4; c.lineCap = 'round';
            var wig = Math.sin(g.t * 16 + i) * 3;
            for (var L = -1; L <= 1; L += 2) {
              c.beginPath();
              c.moveTo(L * 5, -2); c.lineTo(L * 14, -8 + wig);
              c.moveTo(L * 5, 4); c.lineTo(L * 14, 10 - wig);
              c.stroke();
            }
            c.shadowColor = ch.col; c.shadowBlur = head ? 16 : 8;
            c.fillStyle = head ? '#bef264' : ch.col;
            c.beginPath(); c.arc(0, 0, head ? 13 : 11.5, 0, 7); c.fill();
            c.shadowBlur = 0;
            c.fillStyle = 'rgba(0,0,0,.35)';
            c.beginPath(); c.arc(2, 2, head ? 7 : 6, 0, 7); c.fill();
            if (head) {
              c.fillStyle = '#04140c';
              c.beginPath(); c.arc(-4, -3, 2.6, 0, 7); c.arc(4, -3, 2.6, 0, 7); c.fill();
            }
            c.restore();
          }
        });

        // spiders
        d.spiders.forEach(function (s) {
          c.save(); c.translate(s.x, s.y);
          var bob = Math.sin(s.phase) * 2;
          c.strokeStyle = '#8b5cf6'; c.lineWidth = 2.6; c.lineCap = 'round';
          for (var L = -1; L <= 1; L += 2) {
            for (var n = 0; n < 4; n++) {
              c.beginPath();
              c.moveTo(0, 0);
              c.lineTo(L * (10 + n * 3), -10 + n * 7 + bob);
              c.stroke();
            }
          }
          c.fillStyle = '#a78bfa';
          c.beginPath(); c.ellipse(0, bob, 13, 10, 0, 0, 7); c.fill();
          c.fillStyle = '#f0abfc';
          c.beginPath(); c.arc(-4, bob - 2, 2.6, 0, 7); c.arc(4, bob - 2, 2.6, 0, 7); c.fill();
          c.restore();
        });

        // fleas
        d.fleas.forEach(function (f) {
          c.fillStyle = f.fast ? '#fbbf24' : '#f59e0b';
          c.save(); c.translate(f.x, f.y);
          c.beginPath(); c.moveTo(0, -10); c.lineTo(9, 8); c.lineTo(-9, 8); c.closePath(); c.fill();
          c.fillStyle = '#7c2d12';
          c.fillRect(-3, -2, 6, 6);
          c.restore();
        });

        // shots
        d.shots.forEach(function (s) {
          var grd = c.createLinearGradient(0, s.y - 18, 0, s.y + 4);
          grd.addColorStop(0, 'rgba(255,224,102,0)');
          grd.addColorStop(1, '#ffe066');
          c.fillStyle = grd;
          c.fillRect(s.x - 2.5, s.y - 18, 5, 22);
        });

        // gunner
        if (d.respawn <= 0 || Math.floor(g.t * 14) % 2) {
          var p = d.p;
          c.save(); c.translate(p.x, p.y);
          c.shadowColor = '#bef264'; c.shadowBlur = 14;
          c.fillStyle = '#bef264';
          c.beginPath();
          c.moveTo(0, -15); c.lineTo(13, 10); c.lineTo(0, 4); c.lineTo(-13, 10);
          c.closePath(); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = '#052e16';
          c.fillRect(-2.5, -12, 5, 9);
          c.restore();
        }

        // particles
        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.fill();
        });
        c.globalAlpha = 1;
        c.restore();

        if (d.flash > 0) {
          c.fillStyle = 'rgba(255,80,120,' + (d.flash * .5) + ')';
          c.fillRect(0, 0, W, H);
        }
      }
    });
  }

  window.Milo.register({
    id: 'centipede-strike',
    title: 'Centipede Strike',
    emo: '🐛',
    category: 'Arcade',
    tagline: 'Split the crawler before it reaches your band',
    description: 'A twelve-segment crawler winds down a field of teal spores, turning and ' +
      'dropping a row every time something blocks it. Shooting a segment splits the chain ' +
      'in two and plants a fresh spore where it died, so the field thickens as you clear it ' +
      '— heads are worth 100, body parts 10. Spiders bounce through your six-row band and ' +
      'pay 900 if you shoot one point blank, which is also the fastest way to die.',
    controls: ['Arrow keys', 'WASD', 'Space to fire', 'Drag'],
    colors: ['#03130c', '#ff4d9d'],
    tags: ['classic', 'shooter', 'arcade', 'bugs', 'rounds'],
    mount: mount
  });
})();
