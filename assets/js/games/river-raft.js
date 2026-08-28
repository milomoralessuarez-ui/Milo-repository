/* River Raft — steer the rapids: rocks, drifting logs, and forked dead ends. */
(function () {
  'use strict';
  var W = 480, H = 720, RY = 180, SEED = 47;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function centerX(wy) {
      return 240 + (U.noise2(wy * 0.00085, 0, SEED) - .5) * 230;
    }
    function halfW(wy) {
      return 150 - Math.min(46, wy / 900);
    }

    // Channel bounds at a world y, including any island from an active fork.
    function channel(d, wy) {
      var cx = centerX(wy), hw = halfW(wy);
      var ch = { l: cx - hw, r: cx + hw, il: null, ir: null };
      for (var i = 0; i < d.forks.length; i++) {
        var f = d.forks[i];
        if (wy > f.y0 && wy < f.y0 + f.len) {
          var t = (wy - f.y0) / f.len;
          var iw = Math.sin(Math.PI * t) * 72;
          ch.il = cx - iw; ch.ir = cx + iw;
        }
      }
      return ch;
    }

    function reset(g) {
      var d = g.data;
      d.wy = 0;
      d.x = centerX(RY);
      d.vx = 0;
      d.hull = 3;
      d.ptr = null;
      d.inv = 0;
      d.scrapeCd = 0;
      d.slowT = 0;
      d.bonus = 0;
      d.forks = [];
      d.obs = [];
      d.nextY = 620;
      d.lastForkEnd = -400;
      d.parts = [];
      d.texts = [];
      d.shake = 0;
      d.dead = false;
      d.dieT = 0;
      d.rot = 0;
      stock(d);
      g.set('Score', 0);
      g.set('Hull', '♥♥♥');
      g.set('Best', U.fmt(g.best));
    }

    function stock(d) {
      while (d.nextY < d.wy + H + 260) {
        var wy = d.nextY;
        var canFork = wy > d.lastForkEnd + 950;
        if (canFork && Math.random() < .45) {
          var f = { y0: wy, len: 640, safe: Math.random() < .5 ? -1 : 1, cleared: false };
          d.forks.push(f);
          // the dead-end branch is blocked partway down by a log jam
          d.obs.push({ type: 'jam', y: f.y0 + f.len * .55, f: f });
          d.lastForkEnd = f.y0 + f.len;
          d.nextY += f.len + 240;
        } else {
          var cx = centerX(wy), hw = halfW(wy);
          if (Math.random() < .62) {
            d.obs.push({ type: 'rock', y: wy, x: U.rand(cx - hw + 40, cx + hw - 40), r: U.rand(16, 26) });
          } else {
            d.obs.push({
              type: 'log', y: wy, x: U.rand(cx - hw + 60, cx + hw - 60),
              w: U.rand(90, 150), vx: (Math.random() < .5 ? -1 : 1) * U.rand(24, 60)
            });
          }
          d.nextY += Math.max(150, 300 - d.wy / 120) * U.rand(.8, 1.25);
        }
      }
    }

    function foam(d, x, y, n, col) {
      for (var k = 0; k < n; k++) {
        d.parts.push({
          x: x + U.rand(-8, 8), y: y + U.rand(-6, 6),
          vx: U.rand(-70, 70), vy: U.rand(-140, -30),
          life: U.rand(.3, .6), max: .6, col: col || '#e0f2fe'
        });
      }
    }

    function damage(g, why) {
      var d = g.data;
      if (d.inv > 0 || d.dead) return;
      d.hull--;
      d.inv = 1.25;
      d.shake = 10;
      foam(d, d.x, RY, 14, '#fecdd3');
      Milo.sound.hit();
      g.set('Hull', d.hull > 0 ? new Array(d.hull + 1).join('♥') : '—');
      d.texts.push({ x: d.x, y: RY - 46, t: '-1 HULL', life: .8, max: .8, col: '#fda4af' });
      if (d.hull <= 0) sink(g, why);
    }

    function sink(g, why) {
      var d = g.data;
      d.dead = true;
      d.why = why;
      d.dieT = 1;
      d.shake = 14;
      for (var k = 0; k < 26; k++) {
        var a = Math.random() * 6.283, s = U.rand(50, 300);
        d.parts.push({
          x: d.x, y: RY, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
          life: U.rand(.4, .9), max: .9,
          col: Math.random() < .5 ? '#e0f2fe' : '#b45309'
        });
      }
      Milo.sound.explode();
    }

    return Milo.arcade(host, {
      id: 'river-raft',
      w: W, h: H, bg: '#052e16',
      stats: ['Score', 'Hull', 'Best'],
      touch: 'dpad',
      emo: '🛶',
      start: {
        title: 'River Raft',
        text: 'Steer the raft down the rapids — three hull points between you and the ' +
          'riverbed. When the river forks around an island, look ahead: one branch is ' +
          'jammed with logs, and hitting the jam sinks you outright.',
        keys: ['← →  or  A D', 'Drag to steer']
      },
      init: reset,
      onPointer: function (g, type, x) {
        g.data.ptr = type === 'up' ? null : x;
      },

      update: function (g, dt) {
        var d = g.data, i = g.input, k;
        d.shake = Math.max(0, d.shake - dt * 40);

        if (d.dead) {
          d.dieT -= dt;
          d.rot += 4 * dt;
          cool(d, dt);
          if (d.dieT <= 0) {
            g.gameOver({
              text: (d.why === 'jam' ? 'Wedged into the log jam after ' : 'The raft came apart after ') +
                U.fmt(Math.floor(d.wy / 10)) + ' m of river.'
            });
          }
          return;
        }

        var v = (235 + Math.min(225, d.wy / 650)) * (d.slowT > 0 ? .6 : 1);
        d.slowT = Math.max(0, d.slowT - dt);
        d.inv = Math.max(0, d.inv - dt);
        d.scrapeCd = Math.max(0, d.scrapeCd - dt);
        d.wy += v * dt;

        // steering
        var steer = (i.down('right') ? 1 : 0) - (i.down('left') ? 1 : 0);
        if (d.ptr != null) {
          d.x += (U.clamp(d.ptr, 40, W - 40) - d.x) * Math.min(1, 10 * dt);
          d.vx = 0;
        } else {
          d.vx += steer * 2200 * dt;
          d.vx *= Math.pow(.003, dt);
          d.vx = U.clamp(d.vx, -300, 300);
          d.x += d.vx * dt;
        }
        d.rot += (U.clamp(d.vx * .0012, -.4, .4) - d.rot) * Math.min(1, 10 * dt);

        // bank + island scraping
        var ch = channel(d, d.wy);
        function scrape(px) {
          d.x = px; d.vx = 0;
          if (d.scrapeCd <= 0) {
            d.scrapeCd = .9;
            d.slowT = .5;
            foam(d, d.x, RY, 8);
            damage(g, 'rocks');
          }
        }
        if (d.x < ch.l + 17) scrape(ch.l + 17);
        else if (d.x > ch.r - 17) scrape(ch.r - 17);
        if (!d.dead && ch.il != null && d.x > ch.il - 17 && d.x < ch.ir + 17) {
          scrape(d.x < (ch.il + ch.ir) / 2 ? ch.il - 17 : ch.ir + 17);
        }
        if (d.dead) { cool(d, dt); return; }

        // obstacles
        for (k = d.obs.length - 1; k >= 0; k--) {
          var o = d.obs[k];
          if (o.y < d.wy - 260) { d.obs.splice(k, 1); continue; }
          if (o.type === 'log') {
            o.x += o.vx * dt;
            var lc = channel(d, o.y);
            if (o.x - o.w / 2 < lc.l + 8) { o.x = lc.l + 8 + o.w / 2; o.vx = Math.abs(o.vx); }
            if (o.x + o.w / 2 > lc.r - 8) { o.x = lc.r - 8 - o.w / 2; o.vx = -Math.abs(o.vx); }
            if (Math.abs(o.y - d.wy) < 24 && Math.abs(o.x - d.x) < o.w / 2 + 14) {
              damage(g, 'log');
              o.y -= 60; // shove it off the raft so it doesn't double-hit
            }
          } else if (o.type === 'rock') {
            if (U.dist(o.x, o.y, d.x, d.wy) < o.r + 17) damage(g, 'rock');
          } else if (o.type === 'jam') {
            var jc = channel(d, o.y);
            if (jc.il != null && Math.abs(o.y - d.wy) < 22) {
              var lo = o.f.safe === 1 ? jc.l : jc.ir;
              var hi = o.f.safe === 1 ? jc.il : jc.r;
              if (d.x > lo - 10 && d.x < hi + 10) { sink(g, 'jam'); cool(d, dt); return; }
            }
          }
          if (d.dead) { cool(d, dt); return; }
        }

        // fork cleared bonus
        for (k = 0; k < d.forks.length; k++) {
          var f = d.forks[k];
          if (!f.cleared && d.wy > f.y0 + f.len) {
            f.cleared = true;
            d.bonus += 150;
            d.texts.push({ x: d.x, y: RY - 50, t: 'FORK CLEARED +150', life: .9, max: .9, col: '#fde68a' });
            Milo.sound.coin();
          }
        }
        d.forks = d.forks.filter(function (fk) { return fk.y0 + fk.len > d.wy - 300; });

        stock(d);

        // raft wake
        if (Math.random() < .7) {
          d.parts.push({
            x: d.x + U.rand(-14, 14), y: RY + 20, vx: U.rand(-20, 20), vy: -v * .55,
            life: .4, max: .4, col: 'rgba(224,242,254,.8)'
          });
        }

        cool(d, dt);
        g.score = Math.floor(d.wy / 10) + d.bonus;
        g.set('Score', U.fmt(g.score));
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, k, sy;
        function toScreen(wy) { return wy - d.wy + RY; }

        // water
        var wg = c.createLinearGradient(0, 0, 0, H);
        wg.addColorStop(0, '#0e7490');
        wg.addColorStop(1, '#155e75');
        c.fillStyle = wg; c.fillRect(0, 0, W, H);

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        // current chevrons, world-locked
        c.strokeStyle = 'rgba(255,255,255,.10)';
        c.lineWidth = 2;
        var row0 = Math.floor((d.wy - RY) / 60);
        for (var rr = row0; rr < row0 + H / 60 + 2; rr++) {
          var ry = toScreen(rr * 60);
          for (var q = 0; q < 3; q++) {
            var hx = 60 + U.hash2(rr, q, 8) * 360;
            c.beginPath();
            c.moveTo(hx - 9, ry); c.lineTo(hx, ry + 7); c.lineTo(hx + 9, ry);
            c.stroke();
          }
        }

        // banks
        var pl = [], pr = [];
        for (sy = -24; sy <= H + 24; sy += 16) {
          var ch = channel(d, sy + d.wy - RY);
          pl.push([sy, ch.l]); pr.push([sy, ch.r]);
        }
        c.fillStyle = '#14532d';
        c.beginPath();
        c.moveTo(-10, -24);
        for (k = 0; k < pl.length; k++) c.lineTo(pl[k][1], pl[k][0]);
        c.lineTo(-10, H + 24); c.closePath(); c.fill();
        c.beginPath();
        c.moveTo(W + 10, -24);
        for (k = 0; k < pr.length; k++) c.lineTo(pr[k][1], pr[k][0]);
        c.lineTo(W + 10, H + 24); c.closePath(); c.fill();
        // bank foam edges
        c.strokeStyle = 'rgba(224,242,254,.5)'; c.lineWidth = 3;
        c.beginPath();
        for (k = 0; k < pl.length; k++) { if (k === 0) c.moveTo(pl[k][1], pl[k][0]); else c.lineTo(pl[k][1], pl[k][0]); }
        c.stroke();
        c.beginPath();
        for (k = 0; k < pr.length; k++) { if (k === 0) c.moveTo(pr[k][1], pr[k][0]); else c.lineTo(pr[k][1], pr[k][0]); }
        c.stroke();
        // trees on the banks, hash-scattered
        var trow0 = Math.floor((d.wy - RY) / 90);
        for (var tr = trow0; tr < trow0 + H / 90 + 2; tr++) {
          var ty = toScreen(tr * 90) + U.hash2(tr, 1, 12) * 40;
          var tch = channel(d, tr * 90 + U.hash2(tr, 1, 12) * 40);
          var h1 = U.hash2(tr, 2, 12), h2 = U.hash2(tr, 3, 12);
          c.fillStyle = h1 < .5 ? '#166534' : '#15803d';
          c.beginPath(); c.arc(tch.l - 30 - h1 * 60, ty, 16 + h2 * 12, 0, 7); c.fill();
          c.fillStyle = h2 < .5 ? '#166534' : '#15803d';
          c.beginPath(); c.arc(tch.r + 30 + h2 * 60, ty + 30, 16 + h1 * 12, 0, 7); c.fill();
        }

        // islands
        for (k = 0; k < d.forks.length; k++) {
          var f = d.forks[k];
          var iy0 = toScreen(f.y0), iy1 = toScreen(f.y0 + f.len);
          if (iy1 < -40 || iy0 > H + 40) continue;
          c.beginPath();
          var first = true;
          for (var iw = f.y0; iw <= f.y0 + f.len; iw += 22) {
            var ic = channel(d, iw);
            if (ic.il == null) continue;
            if (first) { c.moveTo(ic.il, toScreen(iw)); first = false; }
            else c.lineTo(ic.il, toScreen(iw));
          }
          for (iw = f.y0 + f.len; iw >= f.y0; iw -= 22) {
            var ic2 = channel(d, iw);
            if (ic2.ir == null) continue;
            c.lineTo(ic2.ir, toScreen(iw));
          }
          c.closePath();
          c.fillStyle = '#166534'; c.fill();
          c.strokeStyle = 'rgba(224,242,254,.45)'; c.lineWidth = 2.5; c.stroke();
          // a palm-ish tuft in the middle
          var mid = channel(d, f.y0 + f.len / 2);
          if (mid.il != null) {
            c.fillStyle = '#15803d';
            c.beginPath(); c.arc((mid.il + mid.ir) / 2, toScreen(f.y0 + f.len / 2), 18, 0, 7); c.fill();
          }
        }

        // obstacles
        for (k = 0; k < d.obs.length; k++) {
          var o = d.obs[k];
          var oy = toScreen(o.y);
          if (oy < -80 || oy > H + 80) continue;
          if (o.type === 'rock') {
            c.strokeStyle = 'rgba(224,242,254,.6)'; c.lineWidth = 3;
            c.beginPath(); c.arc(o.x, oy, o.r + 5, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
            c.fillStyle = '#475569';
            c.beginPath(); c.arc(o.x, oy, o.r, 0, 7); c.fill();
            c.fillStyle = '#64748b';
            c.beginPath(); c.arc(o.x - o.r * .25, oy - o.r * .3, o.r * .55, 0, 7); c.fill();
          } else if (o.type === 'log') {
            c.fillStyle = '#7c2d12';
            U.roundRect(c, o.x - o.w / 2, oy - 11, o.w, 22, 11); c.fill();
            c.fillStyle = '#92400e';
            U.roundRect(c, o.x - o.w / 2 + 3, oy - 8, o.w - 6, 8, 4); c.fill();
            c.strokeStyle = '#451a03'; c.lineWidth = 2;
            c.beginPath(); c.arc(o.x - o.w / 2 + 11, oy, 7, 0, 7); c.stroke();
            c.beginPath(); c.arc(o.x + o.w / 2 - 11, oy, 7, 0, 7); c.stroke();
          } else if (o.type === 'jam') {
            var jc = channel(d, o.y);
            if (jc.il == null) continue;
            var lo = o.f.safe === 1 ? jc.l : jc.ir;
            var hi = o.f.safe === 1 ? jc.il : jc.r;
            // crossed timber + boulders across the dead-end branch
            c.strokeStyle = 'rgba(224,242,254,.5)'; c.lineWidth = 3;
            c.beginPath(); c.moveTo(lo, oy - 16); c.lineTo(hi, oy - 16); c.stroke();
            for (var bx = lo + 12; bx < hi - 6; bx += 26) {
              c.save();
              c.translate(bx, oy);
              c.rotate(U.hash2(bx | 0, 1, 3) * 1.2 - .6);
              c.fillStyle = '#7c2d12';
              U.roundRect(c, -6, -20, 12, 40, 6); c.fill();
              c.fillStyle = '#451a03';
              U.roundRect(c, -6, -20, 12, 8, 4); c.fill();
              c.restore();
            }
            c.fillStyle = '#fca5a5';
            c.font = '800 13px Outfit, sans-serif'; c.textAlign = 'center';
            c.fillText('✕', (lo + hi) / 2, oy - 26);
          }
        }

        // particles
        for (k = 0; k < d.parts.length; k++) {
          var p = d.parts[k];
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.beginPath(); c.arc(p.x, p.y, 3, 0, 7); c.fill();
        }
        c.globalAlpha = 1;

        // raft
        if (!d.dead || d.dieT > .3) {
          c.save();
          c.translate(d.x, RY);
          c.rotate(d.rot + (d.dead ? (1 - d.dieT) * 5 : 0));
          if (d.dead) { var s = Math.max(.2, d.dieT); c.scale(s, s); }
          if (d.inv > 0) c.globalAlpha = Math.sin(g.t * 24) > 0 ? .4 : .9;
          for (var pk = -2; pk <= 2; pk++) {
            c.fillStyle = pk % 2 ? '#b45309' : '#d97706';
            U.roundRect(c, pk * 7 - 3.5, -24, 7, 48, 3.5); c.fill();
          }
          c.strokeStyle = '#78350f'; c.lineWidth = 2.5;
          c.beginPath(); c.moveTo(-18, -12); c.lineTo(18, -12); c.stroke();
          c.beginPath(); c.moveTo(-18, 12); c.lineTo(18, 12); c.stroke();
          // paddler
          c.fillStyle = '#fbbf24';
          c.beginPath(); c.arc(0, 2, 6, 0, 7); c.fill();
          c.strokeStyle = '#78350f'; c.lineWidth = 3;
          c.beginPath(); c.moveTo(-10, -6); c.lineTo(12, 8); c.stroke();
          // flag
          c.strokeStyle = '#78350f'; c.lineWidth = 2;
          c.beginPath(); c.moveTo(0, -24); c.lineTo(0, -36); c.stroke();
          c.fillStyle = '#ef4444';
          c.beginPath(); c.moveTo(0, -36); c.lineTo(12, -32); c.lineTo(0, -28); c.closePath(); c.fill();
          c.restore();
          c.globalAlpha = 1;
        }

        // floating texts
        c.font = '800 15px Outfit, sans-serif';
        c.textAlign = 'center';
        for (k = 0; k < d.texts.length; k++) {
          var t = d.texts[k];
          c.globalAlpha = Math.max(0, t.life / t.max);
          c.fillStyle = t.col;
          c.fillText(t.t, t.x, t.y);
        }
        c.globalAlpha = 1;
        c.restore();
      }
    });

    function cool(d, dt) {
      var k;
      for (k = d.parts.length - 1; k >= 0; k--) {
        var p = d.parts[k];
        p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
        if (p.life <= 0) d.parts.splice(k, 1);
      }
      for (k = d.texts.length - 1; k >= 0; k--) {
        d.texts[k].y -= 32 * dt; d.texts[k].life -= dt;
        if (d.texts[k].life <= 0) d.texts.splice(k, 1);
      }
    }
  }

  window.Milo.register({
    id: 'river-raft', title: 'River Raft', emo: '🛶', category: 'Arcade',
    tagline: 'Read the fork before the river does',
    description: 'Steer a timber raft down an endless winding river. Rocks and drifting ' +
      'logs each cost one of your three hull points, and scraping the banks does too — ' +
      'but the real test is the forks, where an island splits the water and one branch ' +
      'ends in a log jam marked with a ✕ that sinks you outright. Clearing a fork pays ' +
      '150 points, the current speeds up and the channel narrows the further you get, ' +
      'so commit to a branch early: the jam is always visible before the split if you ' +
      'look downstream.',
    controls: ['← →', 'A D', 'Drag to steer'],
    colors: ['#166534', '#38bdf8'],
    tags: ['endless', 'dodge', 'river', 'steering', 'rapids'],
    mount: mount
  });
})();
