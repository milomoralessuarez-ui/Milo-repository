/* Laser Duel — 1v1 arena. Lasers bounce twice, so the banked shot is king. */
(function () {
  'use strict';
  var W = 800, H = 560, WALL = 22;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    var PILLARS = [
      { x: 245, y: 170, w: 38, h: 220 },
      { x: 517, y: 170, w: 38, h: 220 }
    ];

    function resetRound(d) {
      d.p = { x: 120, y: H / 2, r: 13, cool: 0 };
      d.ai = { x: W - 120, y: H / 2, r: 13, cool: 1.2, orbit: Math.random() * 6.28, drift: Math.random() < .5 ? 1 : -1, think: 0 };
      d.bolts = [];
      d.parts = [];
      d.rings = [];
    }

    function reset(g) {
      var d = g.data;
      d.round = 1;
      d.you = 0; d.cpu = 0;
      d.phase = 'pause';
      d.phaseT = 1.6;
      d.banner = 'ROUND 1';
      d.aim = { x: W - 120, y: H / 2 };
      d.shake = 0;
      resetRound(d);
      g.set('Score', 0);
      g.set('You', 0);
      g.set('AI', 0);
    }

    function inPillar(x, y, pad) {
      for (var i = 0; i < PILLARS.length; i++) {
        var pl = PILLARS[i];
        if (x > pl.x - pad && x < pl.x + pl.w + pad && y > pl.y - pad && y < pl.y + pl.h + pad) return pl;
      }
      return null;
    }

    function pushOut(o) {
      var pl = inPillar(o.x, o.y, o.r);
      if (!pl) return;
      var dl = o.x - (pl.x - o.r), dr = (pl.x + pl.w + o.r) - o.x;
      var dtp = o.y - (pl.y - o.r), db = (pl.y + pl.h + o.r) - o.y;
      var m = Math.min(dl, dr, dtp, db);
      if (m === dl) o.x = pl.x - o.r;
      else if (m === dr) o.x = pl.x + pl.w + o.r;
      else if (m === dtp) o.y = pl.y - o.r;
      else o.y = pl.y + pl.h + o.r;
    }

    function fireBolt(d, owner, x, y, ang) {
      d.bolts.push({
        owner: owner, x: x, y: y,
        vx: Math.cos(ang) * 470, vy: Math.sin(ang) * 470,
        r: 4, bounces: 0, trail: [], age: 0
      });
      Milo.sound.tone({ f: owner === 'you' ? 980 : 620, f2: 300, d: .12, v: .08, type: 'sawtooth' });
    }

    function ringBurst(d, x, y, col) {
      d.rings.push({ x: x, y: y, r: 6, max: 70, col: col });
      for (var i = 0; i < 16; i++) {
        var a = Math.random() * 6.28, s = U.rand(60, 300);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(.25, .6), max: .6, col: col });
      }
    }

    function endRound(g, winner, banked) {
      var d = g.data;
      d.phase = 'pause';
      d.phaseT = 2;
      if (winner === 'you') {
        d.you++;
        g.set('You', d.you);
        g.score += banked ? 150 : 100;
        g.set('Score', U.fmt(g.score));
        d.banner = banked ? 'BANK SHOT! +150' : 'ROUND YOURS +100';
        Milo.sound.coin();
      } else {
        d.cpu++;
        g.set('AI', d.cpu);
        d.banner = 'AI SCORES';
        Milo.sound.hit();
      }
      d.shake = .8;
      if (d.you >= 3) {
        g.score += 200;
        g.set('Score', U.fmt(g.score));
        g.win({ score: g.score, title: 'Duel Won ' + d.you + '–' + d.cpu, text: 'The arena dims. The best banked shot in the grid.' });
      } else if (d.cpu >= 3) {
        g.gameOver({ title: 'Duel Lost ' + d.you + '–' + d.cpu, text: 'Beaten ' + d.cpu + '–' + d.you + '. Use the walls — straight shots are easy to read.' });
      }
    }

    return Milo.arcade(host, {
      id: 'laser-duel',
      w: W, h: H, bg: '#04070d',
      stats: ['Score', 'You', 'AI'],
      emo: '⚡',
      touch: 'dpad',
      touchButtons: [{ key: 'action', label: 'FIRE' }],
      start: {
        title: 'Laser Duel',
        text: 'Best of five, one hit each. Bolts bounce off the walls twice before ' +
          'dying — a banked shot around a pillar is worth extra, and yes, your own ' +
          'ricochet can hit you.',
        keys: ['WASD move', 'Mouse aim, Click / Space fire']
      },
      init: reset,
      onPointer: function (g, type, x, y) {
        var d = g.data;
        d.aim.x = x; d.aim.y = y;
        if (type === 'down' && g.state === 'play') tryFire(g);
      },
      onKey: function (g, e) {
        if (e.code === 'Space' || e.code === 'Enter') tryFire(g);
      },

      update: function (g, dt) {
        var d = g.data, p = d.p, ai = d.ai;
        d.shake = Math.max(0, d.shake - dt * 3);

        if (d.phase === 'pause') {
          d.phaseT -= dt;
          if (d.phaseT <= 0) {
            if (d.you + d.cpu + 1 > d.round) d.round = d.you + d.cpu + 1;
            resetRound(d);
            d.phase = 'fight';
            d.banner = '';
            Milo.sound.blip();
          }
          updateFx(d, dt);
          return;
        }

        if (g.input.pressed('action')) tryFire(g);

        /* --- player --- */
        var ax = g.input.axis();
        p.x = U.clamp(p.x + ax.x * 255 * dt, WALL + p.r, W - WALL - p.r);
        p.y = U.clamp(p.y + ax.y * 255 * dt, WALL + p.r, H - WALL - p.r);
        pushOut(p);
        p.cool -= dt;

        /* --- AI --- */
        var n = d.round;
        var aiSp = 175 + n * 22, aimErr = Math.max(.04, .3 - n * .055), fireCd = Math.max(.9, 1.7 - n * .16);
        ai.think -= dt;
        if (ai.think <= 0) {
          ai.think = U.rand(.5, 1.1);
          ai.drift = Math.random() < .3 ? -ai.drift : ai.drift;
        }
        ai.orbit += ai.drift * 1.1 * dt;
        var tx = p.x + Math.cos(ai.orbit) * 270;
        var ty = p.y + Math.sin(ai.orbit) * 200;
        // dodge the most threatening bolt
        var dodge = null;
        for (var bi = 0; bi < d.bolts.length; bi++) {
          var bb = d.bolts[bi];
          if (bb.owner === 'ai' && bb.bounces === 0) continue;
          var rx = ai.x - bb.x, ry = ai.y - bb.y;
          var bv = Math.hypot(bb.vx, bb.vy);
          var along = (rx * bb.vx + ry * bb.vy) / bv;
          if (along > 0 && along < 260) {
            var perp = Math.abs(rx * bb.vy - ry * bb.vx) / bv;
            if (perp < 70) { dodge = bb; break; }
          }
        }
        if (dodge) {
          var bvl = Math.hypot(dodge.vx, dodge.vy);
          var side = ((ai.x - dodge.x) * dodge.vy - (ai.y - dodge.y) * dodge.vx) > 0 ? 1 : -1;
          tx = ai.x + (-dodge.vy / bvl) * side * 160;
          ty = ai.y + (dodge.vx / bvl) * side * 160;
        }
        var da = Math.atan2(ty - ai.y, tx - ai.x);
        ai.x = U.clamp(ai.x + Math.cos(da) * aiSp * dt, WALL + ai.r, W - WALL - ai.r);
        ai.y = U.clamp(ai.y + Math.sin(da) * aiSp * dt, WALL + ai.r, H - WALL - ai.r);
        pushOut(ai);

        ai.cool -= dt;
        if (ai.cool <= 0) {
          ai.cool = fireCd * U.rand(.8, 1.3);
          var aang;
          if (Math.random() < .28 + n * .06) {
            // banked shot: aim at the player's mirror image across a wall
            var wall = (Math.random() * 4) | 0, mx = p.x, my = p.y;
            if (wall === 0) mx = 2 * WALL - p.x;
            else if (wall === 1) mx = 2 * (W - WALL) - p.x;
            else if (wall === 2) my = 2 * WALL - p.y;
            else my = 2 * (H - WALL) - p.y;
            aang = Math.atan2(my - ai.y, mx - ai.x);
          } else {
            aang = Math.atan2(p.y - ai.y, p.x - ai.x) + U.rand(-aimErr, aimErr);
          }
          fireBolt(d, 'ai', ai.x + Math.cos(aang) * 18, ai.y + Math.sin(aang) * 18, aang);
        }

        /* --- bolts --- */
        for (var k = d.bolts.length - 1; k >= 0; k--) {
          var b = d.bolts[k];
          b.age += dt;
          b.x += b.vx * dt; b.y += b.vy * dt;
          b.trail.push({ x: b.x, y: b.y });
          if (b.trail.length > 12) b.trail.shift();

          var bounced = false;
          if (b.x < WALL + b.r) { b.x = WALL + b.r; b.vx = -b.vx; bounced = true; }
          else if (b.x > W - WALL - b.r) { b.x = W - WALL - b.r; b.vx = -b.vx; bounced = true; }
          if (b.y < WALL + b.r) { b.y = WALL + b.r; b.vy = -b.vy; bounced = true; }
          else if (b.y > H - WALL - b.r) { b.y = H - WALL - b.r; b.vy = -b.vy; bounced = true; }
          var pl = inPillar(b.x, b.y, b.r);
          if (pl) {
            var dl = b.x - (pl.x - b.r), dr = (pl.x + pl.w + b.r) - b.x;
            var dtp = b.y - (pl.y - b.r), db = (pl.y + pl.h + b.r) - b.y;
            var m = Math.min(dl, dr, dtp, db);
            if (m === dl) { b.x = pl.x - b.r; b.vx = -Math.abs(b.vx); }
            else if (m === dr) { b.x = pl.x + pl.w + b.r; b.vx = Math.abs(b.vx); }
            else if (m === dtp) { b.y = pl.y - b.r; b.vy = -Math.abs(b.vy); }
            else { b.y = pl.y + pl.h + b.r; b.vy = Math.abs(b.vy); }
            bounced = true;
          }
          if (bounced) {
            b.bounces++;
            if (b.bounces > 2) {
              ringBurst(d, b.x, b.y, b.owner === 'you' ? '#22d3ee' : '#ff9d3c');
              d.bolts.splice(k, 1);
              continue;
            }
            Milo.sound.tone({ f: 340 + b.bounces * 120, f2: 220, d: .06, v: .05, type: 'square' });
          }

          // hits — the shooter is only safe from an unbounced bolt of their own
          if ((b.owner !== 'you' || b.bounces > 0) && U.dist(b.x, b.y, p.x, p.y) < p.r + b.r) {
            ringBurst(d, p.x, p.y, '#22d3ee');
            d.bolts.splice(k, 1);
            Milo.sound.explode();
            endRound(g, 'ai', false);
            return;
          }
          if ((b.owner !== 'ai' || b.bounces > 0) && U.dist(b.x, b.y, ai.x, ai.y) < ai.r + b.r) {
            var banked = b.owner === 'you' && b.bounces > 0;
            ringBurst(d, ai.x, ai.y, '#ff9d3c');
            d.bolts.splice(k, 1);
            Milo.sound.explode();
            endRound(g, b.owner === 'you' ? 'you' : 'ai', banked);
            return;
          }
        }

        updateFx(d, dt);
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, p = d.p, ai = d.ai;
        c.fillStyle = '#04070d'; c.fillRect(0, 0, W, H);
        c.save();
        if (d.shake > 0) c.translate(U.rand(-1, 1) * d.shake * 5, U.rand(-1, 1) * d.shake * 5);

        // floor grid
        c.strokeStyle = 'rgba(34,211,238,.06)'; c.lineWidth = 1;
        for (var gx = WALL; gx <= W - WALL; gx += 40) {
          c.beginPath(); c.moveTo(gx, WALL); c.lineTo(gx, H - WALL); c.stroke();
        }
        for (var gy = WALL; gy <= H - WALL; gy += 40) {
          c.beginPath(); c.moveTo(WALL, gy); c.lineTo(W - WALL, gy); c.stroke();
        }

        // arena walls
        c.strokeStyle = '#1b3a4d'; c.lineWidth = 8;
        c.strokeRect(WALL, WALL, W - WALL * 2, H - WALL * 2);
        c.strokeStyle = '#7ceaff'; c.lineWidth = 2;
        c.shadowColor = '#22d3ee'; c.shadowBlur = 10;
        c.strokeRect(WALL, WALL, W - WALL * 2, H - WALL * 2);
        c.shadowBlur = 0;

        // pillars
        PILLARS.forEach(function (pl) {
          c.fillStyle = '#0a1420';
          c.fillRect(pl.x, pl.y, pl.w, pl.h);
          c.strokeStyle = '#3ba8c4'; c.lineWidth = 2;
          c.shadowColor = '#22d3ee'; c.shadowBlur = 8;
          c.strokeRect(pl.x, pl.y, pl.w, pl.h);
          c.shadowBlur = 0;
        });

        // score pips
        c.textAlign = 'center';
        for (var s = 0; s < 3; s++) {
          c.fillStyle = s < d.you ? '#22d3ee' : 'rgba(34,211,238,.18)';
          c.beginPath(); c.arc(W / 2 - 60 + s * 18, 40, 5.5, 0, 7); c.fill();
          c.fillStyle = s < d.cpu ? '#ff9d3c' : 'rgba(255,157,60,.18)';
          c.beginPath(); c.arc(W / 2 + 60 - s * 18, 40, 5.5, 0, 7); c.fill();
        }
        c.fillStyle = 'rgba(230,240,255,.5)';
        c.font = '700 12px Outfit, sans-serif';
        c.fillText('VS', W / 2, 44);

        // bolts + trails
        d.bolts.forEach(function (b) {
          var col = b.owner === 'you' ? '#22d3ee' : '#ff9d3c';
          for (var t = 0; t < b.trail.length - 1; t++) {
            c.globalAlpha = (t / b.trail.length) * .5;
            c.strokeStyle = col; c.lineWidth = 3;
            c.beginPath();
            c.moveTo(b.trail[t].x, b.trail[t].y);
            c.lineTo(b.trail[t + 1].x, b.trail[t + 1].y);
            c.stroke();
          }
          c.globalAlpha = 1;
          c.shadowColor = col; c.shadowBlur = 14;
          c.fillStyle = '#eaffff';
          c.beginPath(); c.arc(b.x, b.y, b.r, 0, 7); c.fill();
          c.shadowBlur = 0;
        });

        // aim line
        if (d.phase === 'fight') {
          var aa = Math.atan2(d.aim.y - p.y, d.aim.x - p.x);
          c.globalAlpha = .25;
          c.setLineDash([4, 8]);
          c.strokeStyle = '#22d3ee'; c.lineWidth = 1.4;
          c.beginPath();
          c.moveTo(p.x + Math.cos(aa) * 20, p.y + Math.sin(aa) * 20);
          c.lineTo(p.x + Math.cos(aa) * 120, p.y + Math.sin(aa) * 120);
          c.stroke();
          c.setLineDash([]);
          c.globalAlpha = 1;
        }

        drawDuelist(c, p.x, p.y, p.r, '#22d3ee', Math.atan2(d.aim.y - p.y, d.aim.x - p.x));
        drawDuelist(c, ai.x, ai.y, ai.r, '#ff9d3c', Math.atan2(p.y - ai.y, p.x - ai.x));

        // fx
        d.rings.forEach(function (rg) {
          c.globalAlpha = Math.max(0, 1 - rg.r / rg.max);
          c.strokeStyle = rg.col; c.lineWidth = 3;
          c.beginPath(); c.arc(rg.x, rg.y, rg.r, 0, 7); c.stroke();
        });
        d.parts.forEach(function (q) {
          c.globalAlpha = Math.max(0, q.life / q.max);
          c.fillStyle = q.col;
          c.fillRect(q.x - 2, q.y - 2, 4, 4);
        });
        c.globalAlpha = 1;

        if (d.phase === 'pause' && d.banner) {
          c.fillStyle = '#eaffff';
          c.font = '800 34px Outfit, sans-serif';
          c.textAlign = 'center';
          c.shadowColor = '#22d3ee'; c.shadowBlur = 18;
          c.fillText(d.banner, W / 2, H / 2 - 60);
          c.shadowBlur = 0;
          c.font = '700 15px Outfit, sans-serif';
          c.fillStyle = 'rgba(230,240,255,.6)';
          c.fillText('Round ' + Math.min(5, d.you + d.cpu + 1) + ' of 5 — first to 3', W / 2, H / 2 - 30);
        }
        c.restore();
      }
    });

    function drawDuelist(c, x, y, r, col, ang) {
      c.shadowColor = col; c.shadowBlur = 18;
      c.fillStyle = col;
      c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
      c.shadowBlur = 0;
      c.fillStyle = '#04070d';
      c.beginPath(); c.arc(x, y, r * .55, 0, 7); c.fill();
      c.fillStyle = col;
      c.beginPath(); c.arc(x, y, r * .25, 0, 7); c.fill();
      // gun nub
      c.strokeStyle = col; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath();
      c.moveTo(x + Math.cos(ang) * r, y + Math.sin(ang) * r);
      c.lineTo(x + Math.cos(ang) * (r + 8), y + Math.sin(ang) * (r + 8));
      c.stroke();
    }

    function tryFire(g) {
      var d = g.data, p = d.p;
      if (d.phase !== 'fight' || p.cool > 0) return;
      var live = 0;
      for (var i = 0; i < d.bolts.length; i++) if (d.bolts[i].owner === 'you') live++;
      if (live >= 2) return;
      p.cool = .55;
      var ang = Math.atan2(d.aim.y - p.y, d.aim.x - p.x);
      fireBolt(d, 'you', p.x + Math.cos(ang) * 18, p.y + Math.sin(ang) * 18, ang);
    }

    function updateFx(d, dt) {
      d.rings = d.rings.filter(function (rg) { rg.r += 240 * dt; return rg.r < rg.max; });
      d.parts = d.parts.filter(function (q) {
        q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= .94; q.vy *= .94; q.life -= dt;
        return q.life > 0;
      });
    }
  }

  window.Milo.register({
    id: 'laser-duel', title: 'Laser Duel', emo: '⚡', category: 'Action',
    tagline: 'Bounce a laser round the pillar, win the round',
    description: 'A one-hit duel against an AI gunslinger, best of five rounds. Every ' +
      'bolt survives two wall bounces, so the strongest play is the shot your opponent ' +
      'never sees coming — banked off a wall or around a pillar, worth 150 instead of ' +
      '100. The AI dodges what it can see and banks its own shots more often each round; ' +
      'careful, your own ricochet is live too.',
    controls: ['WASD', 'Mouse aim', 'Click / Space'],
    colors: ['#0e7490', '#ff9d3c'],
    tags: ['duel', 'lasers', 'ricochet', '1v1', 'arena'],
    mount: mount
  });
})();
