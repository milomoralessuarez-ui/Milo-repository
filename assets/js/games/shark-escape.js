/* Shark Escape — swim up 600 metres past patrolling sharks and through wrecks. */
(function () {
  'use strict';
  var W = 520, H = 720, DEPTH_PX = 2400, PX_PER_M = 4;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.p = { x: W / 2, y: DEPTH_PX - 60, vx: 0, vy: 0, r: 13, face: 1, air: 100, lives: 3, inv: 0, kick: 0 };
      d.camY = d.p.y - H * .55;
      d.sharks = []; d.wrecks = []; d.bubbles = []; d.parts = []; d.pops = []; d.plankton = [];
      d.best = 0; d.shake = 0; d.bite = 0; d.warnT = 0;
      var band = 0;
      for (var y = DEPTH_PX - 260; y > 140; y -= 150, band++) {
        var prog = 1 - y / DEPTH_PX;
        var ns = Math.random() < .3 + prog * .55 ? 1 : 0;
        if (prog > .55 && Math.random() < prog - .35) ns++;
        for (var s = 0; s < ns; s++) {
          var x0 = U.rand(20, W * .45), x1 = U.rand(W * .55, W - 20);
          d.sharks.push({
            x: U.rand(x0, x1), y: y + s * 60 - 30, x0: x0, x1: x1, dir: Math.random() < .5 ? -1 : 1,
            speed: 55 + prog * 80 + Math.random() * 20, cone: 185 + prog * 70, half: .4 + prog * .16,
            alert: 0, state: 'patrol', ct: 0, cvx: 0, cvy: 0, homeY: y + s * 60 - 30, ph: Math.random() * 6.28, big: prog > .7 && Math.random() < .3
          });
        }
        if (band % 3 === 1) {
          var gw = U.rand(150 - prog * 55, 190 - prog * 60);
          d.wrecks.push({ y: y - 70, gapX: U.rand(30, W - 30 - gw), gapW: gw, h: 44, seed: Math.random() * 9 });
        }
        if (Math.random() < .8 || band < 3) d.bubbles.push({ x: U.rand(30, W - 30), y: y + U.rand(-40, 40), r: U.rand(14, 20), t: Math.random() * 6.28 });
      }
      for (var k = 0; k < 90; k++) d.plankton.push({ x: Math.random() * W, y: Math.random() * DEPTH_PX, s: U.rand(1, 2.5) });
      g.set('Depth', '600 m'); g.set('Air', 100); g.set('Lives', '♥♥♥');
    }

    function puff(d, x, y, col, n, spd) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.28, s = U.rand(30, spd || 160);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(.3, .8), max: .8, col: col, r: U.rand(2, 5) });
      }
    }
    function pop(d, x, y, text, col) { d.pops.push({ x: x, y: y, text: text, col: col, life: .9, max: .9 }); }
    function livesText(n) { var s = ''; for (var i = 0; i < 3; i++) s += i < n ? '♥' : '♡'; return s; }

    function bite(g, sh) {
      var d = g.data, p = d.p;
      if (p.inv > 0) return;
      p.lives--; p.inv = 1.6; d.shake = .8; d.bite = .5;
      g.set('Lives', livesText(p.lives));
      puff(d, p.x, p.y, '#dc2626', 22, 200);
      var a = Math.atan2(p.y - sh.y, p.x - sh.x);
      p.vx = Math.cos(a) * 300; p.vy = Math.sin(a) * 300 - 120;
      sh.state = 'return'; sh.alert = 0;
      Milo.sound.hit(); Milo.sound.noise(.25, .15, 600);
      if (p.lives <= 0) {
        g.gameOver({ text: 'Taken at ' + Math.round(p.y / PX_PER_M) + ' m down. You had climbed ' + d.best + ' m.' });
      }
    }

    function circleRect(p, rx, ry, rw, rh) {
      var cx = U.clamp(p.x, rx, rx + rw), cy = U.clamp(p.y, ry, ry + rh);
      var dx = p.x - cx, dy = p.y - cy, dd = Math.hypot(dx, dy);
      if (dd >= p.r) return false;
      if (dd === 0) { p.y = ry - p.r; p.vy = Math.min(0, p.vy); return true; }
      var push = p.r - dd;
      p.x += dx / dd * push; p.y += dy / dd * push;
      if (Math.abs(dx) > Math.abs(dy)) p.vx *= -.2; else p.vy *= -.2;
      return true;
    }

    return Milo.arcade(host, {
      id: 'shark-escape',
      w: W, h: H, bg: '#020a14',
      stats: ['Depth', 'Air', 'Lives'],
      touch: 'dpad',
      emo: '🦈',
      start: {
        title: 'Shark Escape',
        text: 'You are 600 metres down with a leaking tank. Swim for the surface, grab air ' +
          'bubbles on the way, and stay out of the yellow cones — a shark that sees you ' +
          'charges. Wrecks block the way; squeeze through the gaps.',
        keys: ['← ↑ ↓ → swim', 'WASD swim']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, p = d.p, inp = g.input;
        var ax = (inp.down('right') ? 1 : 0) - (inp.down('left') ? 1 : 0);
        var ay = (inp.down('down') ? 1 : 0) - (inp.down('up') ? 1 : 0);
        if (ax) p.face = ax;
        p.vx += ax * 620 * dt; p.vy += ay * 620 * dt + 24 * dt;
        p.vx *= Math.pow(.05, dt); p.vy *= Math.pow(.05, dt);
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.x = U.clamp(p.x, p.r, W - p.r);
        p.y = Math.min(p.y, DEPTH_PX - 20);
        p.kick += dt * (4 + Math.hypot(p.vx, p.vy) * .03);
        p.inv = Math.max(0, p.inv - dt);
        d.shake = Math.max(0, d.shake - dt * 3); d.bite = Math.max(0, d.bite - dt);

        // wrecks
        d.wrecks.forEach(function (w) {
          if (Math.abs(w.y + w.h / 2 - p.y) > 80) return;
          circleRect(p, -10, w.y, w.gapX + 10, w.h);
          circleRect(p, w.gapX + w.gapW, w.y, W - w.gapX - w.gapW + 10, w.h);
        });

        // air
        p.air -= dt * (5.5 + d.best * .004);
        g.set('Air', Math.max(0, Math.round(p.air)));
        if (p.air < 25 && d.warnT <= 0) { d.warnT = .9; Milo.sound.tone({ f: 660, d: .08, v: .05, type: 'sine' }); }
        d.warnT -= dt;
        if (p.air <= 0) {
          g.gameOver({ text: 'Out of air at ' + Math.round(p.y / PX_PER_M) + ' m. You had climbed ' + d.best + ' m.' });
          return;
        }
        d.bubbles = d.bubbles.filter(function (b) {
          b.t += dt; b.y -= 8 * dt;
          if (Math.abs(b.y - p.y) < 60 && U.dist(b.x, b.y, p.x, p.y) < b.r + p.r) {
            p.air = Math.min(100, p.air + 32);
            pop(d, b.x, b.y - 20, '+air', '#e0f2fe');
            puff(d, b.x, b.y, 'rgba(255,255,255,.8)', 10, 120);
            Milo.sound.tone({ f: 700, f2: 1200, d: .12, v: .07, type: 'sine' });
            return false;
          }
          return true;
        });

        // sharks
        d.sharks.forEach(function (sh) {
          sh.ph += dt * 5;
          if (Math.abs(sh.y - p.y) > H) { return; }
          if (sh.state === 'patrol') {
            sh.x += sh.dir * sh.speed * dt;
            if (sh.x < sh.x0) { sh.x = sh.x0; sh.dir = 1; }
            if (sh.x > sh.x1) { sh.x = sh.x1; sh.dir = -1; }
            sh.y = sh.homeY + Math.sin(sh.ph * .3) * 8;
            var dx = p.x - sh.x, dy = p.y - sh.y, dist = Math.hypot(dx, dy);
            var da = Math.atan2(dy, dx) - (sh.dir > 0 ? 0 : Math.PI);
            da = Math.atan2(Math.sin(da), Math.cos(da));
            var sees = dist < sh.cone && Math.abs(da) < sh.half;
            if (sees) {
              if (sh.alert === 0) Milo.sound.tone({ f: 200, f2: 120, d: .2, v: .06, type: 'sawtooth' });
              sh.alert = Math.min(1, sh.alert + dt * 2.8);
              if (sh.alert >= 1) {
                sh.state = 'charge'; sh.ct = 1.1;
                var a = Math.atan2(dy, dx), sp = 330 + (sh.big ? 60 : 0);
                sh.cvx = Math.cos(a) * sp; sh.cvy = Math.sin(a) * sp; sh.dir = dx > 0 ? 1 : -1;
                Milo.sound.tone({ f: 90, f2: 40, d: .35, v: .12, type: 'sawtooth' });
              }
            } else sh.alert = Math.max(0, sh.alert - dt * 1.5);
          } else if (sh.state === 'charge') {
            sh.ct -= dt;
            var ta = Math.atan2(p.y - sh.y, p.x - sh.x), sp2 = Math.hypot(sh.cvx, sh.cvy);
            var ca = Math.atan2(sh.cvy, sh.cvx);
            var diff = Math.atan2(Math.sin(ta - ca), Math.cos(ta - ca));
            ca += U.clamp(diff, -1.6 * dt, 1.6 * dt);
            sh.cvx = Math.cos(ca) * sp2; sh.cvy = Math.sin(ca) * sp2;
            sh.x += sh.cvx * dt; sh.y += sh.cvy * dt; sh.dir = sh.cvx > 0 ? 1 : -1;
            if (g.frame % 3 === 0) d.parts.push({ x: sh.x - sh.dir * 30, y: sh.y, vx: 0, vy: -40, life: .5, max: .5, col: 'rgba(255,255,255,.5)', r: 3 });
            if (sh.ct <= 0 || sh.x < -40 || sh.x > W + 40) { sh.state = 'return'; sh.alert = 0; }
          } else {
            var hx = U.clamp(sh.x, sh.x0, sh.x1);
            var ra = Math.atan2(sh.homeY - sh.y, hx - sh.x);
            sh.x += Math.cos(ra) * 120 * dt; sh.y += Math.sin(ra) * 120 * dt;
            sh.dir = Math.cos(ra) > 0 ? 1 : -1;
            if (U.dist(sh.x, sh.y, hx, sh.homeY) < 8) { sh.state = 'patrol'; sh.y = sh.homeY; }
          }
          var br = sh.big ? 30 : 22;
          if (U.dist(sh.x, sh.y, p.x, p.y) < br + p.r - 4) bite(g, sh);
        });

        // progress + camera
        var climbed = Math.round((DEPTH_PX - 60 - p.y) / PX_PER_M);
        if (climbed > d.best) { d.best = climbed; g.score = d.best; }
        g.set('Depth', Math.max(0, Math.round(p.y / PX_PER_M)) + ' m');
        var target = p.y - H * .55;
        d.camY += (target - d.camY) * Math.min(1, dt * 6);
        d.camY = U.clamp(d.camY, -140, DEPTH_PX - H + 60);
        if (p.y <= 12) {
          g.score = d.best + Math.round(p.air) * 2 + p.lives * 100;
          Milo.sound.win();
          g.win({ score: g.score, text: 'You broke the surface with ' + Math.round(p.air) + '% air and ' + p.lives + ' heart' + (p.lives === 1 ? '' : 's') + ' left. Bonus for both.' });
          return;
        }

        if (g.frame % 9 === 0) d.parts.push({ x: p.x - p.face * 8, y: p.y - 8, vx: U.rand(-8, 8), vy: -50, life: 1, max: 1, col: 'rgba(255,255,255,.55)', r: U.rand(1.5, 3) });
        d.parts = d.parts.filter(function (q) { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= .95; q.life -= dt; return q.life > 0; });
        d.pops = d.pops.filter(function (q) { q.life -= dt; q.y -= 24 * dt; return q.life > 0; });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, p = d.p, t = g.t;
        var depthF = U.clamp(d.camY / DEPTH_PX, 0, 1);
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, 'hsl(200,80%,' + (38 - depthF * 34) + '%)');
        bg.addColorStop(1, 'hsl(205,80%,' + (24 - depthF * 20) + '%)');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);
        c.save();
        if (d.shake > 0) c.translate(U.rand(-1, 1) * d.shake * 6, U.rand(-1, 1) * d.shake * 6);
        c.translate(0, -d.camY);

        // sunbeams near the surface
        if (d.camY < 700) {
          c.globalAlpha = U.clamp(1 - d.camY / 700, 0, 1) * .18;
          c.fillStyle = '#fef3c7';
          for (var b = 0; b < 5; b++) {
            var bx = 60 + b * 100 + Math.sin(t * .4 + b) * 30;
            c.beginPath(); c.moveTo(bx - 20, -100); c.lineTo(bx + 20, -100); c.lineTo(bx + 90, 700); c.lineTo(bx + 30, 700); c.closePath(); c.fill();
          }
          c.globalAlpha = 1;
        }
        // surface + sky
        c.fillStyle = '#7dd3fc'; c.fillRect(0, -400, W, 400);
        c.fillStyle = '#fde68a'; c.beginPath(); c.arc(W - 90, -110, 34, 0, 7); c.fill();
        c.fillStyle = '#e0f2fe'; c.beginPath(); c.moveTo(0, 0);
        for (var sx = 0; sx <= W; sx += 20) c.lineTo(sx, Math.sin(sx * .05 + t * 2) * 5);
        c.lineTo(W, -8); c.lineTo(0, -8); c.closePath(); c.fill();
        // seabed
        c.fillStyle = '#1c1917'; c.fillRect(0, DEPTH_PX, W, 300);
        c.fillStyle = '#292524'; for (var rk = 0; rk < 8; rk++) { c.beginPath(); c.arc(rk * 70 + 20, DEPTH_PX + 6, 22 + (rk % 3) * 8, Math.PI, 0); c.fill(); }

        // plankton
        c.fillStyle = 'rgba(255,255,255,.25)';
        d.plankton.forEach(function (pl) { if (pl.y > d.camY - 10 && pl.y < d.camY + H + 10) c.fillRect(pl.x + Math.sin(t + pl.y) * 4, pl.y, pl.s, pl.s); });

        // wrecks
        d.wrecks.forEach(function (w) {
          if (w.y > d.camY + H + 60 || w.y + w.h < d.camY - 60) return;
          [[-10, w.gapX + 10], [w.gapX + w.gapW, W - w.gapX - w.gapW + 10]].forEach(function (seg) {
            c.fillStyle = '#3b2a1a'; c.fillRect(seg[0], w.y, seg[1], w.h);
            c.fillStyle = '#5c4029'; c.fillRect(seg[0], w.y, seg[1], 8);
            c.fillStyle = '#7c2d12';
            for (var i = 0; i < seg[1]; i += 34) c.fillRect(seg[0] + i + 6, w.y + 16, 14, 6);
            c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 2;
            for (var j = 0; j < seg[1]; j += 40) { c.beginPath(); c.moveTo(seg[0] + j, w.y + 8); c.lineTo(seg[0] + j, w.y + w.h); c.stroke(); }
          });
          // porthole marks the gap
          c.strokeStyle = '#fde68a'; c.lineWidth = 2; c.setLineDash([4, 6]);
          c.beginPath(); c.moveTo(w.gapX, w.y - 6); c.lineTo(w.gapX + w.gapW, w.y - 6); c.stroke(); c.setLineDash([]);
        });

        // bubbles
        d.bubbles.forEach(function (bb) {
          if (bb.y > d.camY + H + 40 || bb.y < d.camY - 40) return;
          var wob = Math.sin(bb.t * 3) * 3;
          c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 2.5;
          c.beginPath(); c.arc(bb.x + wob, bb.y, bb.r, 0, 7); c.stroke();
          c.fillStyle = 'rgba(255,255,255,.18)'; c.fill();
          c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(bb.x + wob - bb.r * .35, bb.y - bb.r * .35, bb.r * .22, 0, 7); c.fill();
          c.beginPath(); c.arc(bb.x + wob + 8, bb.y - bb.r - 10 - (bb.t * 20) % 30, 3, 0, 7); c.stroke();
        });

        // sharks + cones
        d.sharks.forEach(function (sh) {
          if (sh.y > d.camY + H + 80 || sh.y < d.camY - 80) return;
          var fa = sh.dir > 0 ? 0 : Math.PI;
          if (sh.state === 'patrol') {
            var col = sh.alert > 0 ? (Math.floor(t * 10) % 2 ? '255,80,80' : '255,140,60') : '253,224,71';
            var cg = c.createRadialGradient(sh.x, sh.y, 10, sh.x, sh.y, sh.cone);
            cg.addColorStop(0, 'rgba(' + col + ',' + (0.28 + sh.alert * .25) + ')'); cg.addColorStop(1, 'rgba(' + col + ',0.02)');
            c.fillStyle = cg;
            c.beginPath(); c.moveTo(sh.x, sh.y); c.arc(sh.x, sh.y, sh.cone, fa - sh.half, fa + sh.half); c.closePath(); c.fill();
          }
          c.save(); c.translate(sh.x, sh.y); c.scale(sh.dir, 1);
          var sc = sh.big ? 1.4 : 1, tail = Math.sin(sh.ph * (sh.state === 'charge' ? 3 : 1)) * 8;
          c.scale(sc, sc);
          c.fillStyle = sh.state === 'charge' ? '#cbd5e1' : '#94a3b8';
          c.beginPath(); c.moveTo(30, 0); c.quadraticCurveTo(10, -14, -22, -6); c.lineTo(-36, -14 + tail); c.lineTo(-30, 0); c.lineTo(-36, 14 + tail); c.lineTo(-22, 6); c.quadraticCurveTo(10, 14, 30, 0); c.fill();
          c.beginPath(); c.moveTo(-4, -8); c.lineTo(2, -26); c.lineTo(10, -8); c.fill();
          c.fillStyle = '#e2e8f0'; c.beginPath(); c.moveTo(26, 2); c.quadraticCurveTo(8, 13, -20, 6); c.lineTo(-20, 3); c.quadraticCurveTo(8, 6, 26, 2); c.fill();
          c.fillStyle = '#0f172a'; c.beginPath(); c.arc(18, -3, 2.4, 0, 7); c.fill();
          if (sh.state === 'charge' || sh.alert > .4) { c.fillStyle = '#fff'; for (var th = 0; th < 4; th++) { c.beginPath(); c.moveTo(12 + th * 4, 4); c.lineTo(14 + th * 4, 9); c.lineTo(16 + th * 4, 4); c.fill(); } }
          c.restore();
        });

        // diver
        if (!(p.inv > 0 && Math.floor(t * 18) % 2)) {
          c.save(); c.translate(p.x, p.y); c.scale(p.face, 1);
          var fin = Math.sin(p.kick) * 6;
          c.fillStyle = '#facc15'; c.beginPath(); c.moveTo(-8, 4); c.lineTo(-26, 10 + fin); c.lineTo(-24, 2 + fin); c.lineTo(-10, 0); c.fill();
          c.fillStyle = '#1e293b'; U.roundRect(c, -12, -9, 24, 18, 8); c.fill();
          c.fillStyle = '#64748b'; U.roundRect(c, -10, -16, 18, 7, 3); c.fill();
          c.fillStyle = '#fcd5b5'; c.beginPath(); c.arc(11, -4, 6, 0, 7); c.fill();
          c.fillStyle = '#38bdf8'; U.roundRect(c, 9, -8, 9, 7, 2); c.fill();
          c.restore();
        }

        d.parts.forEach(function (q) {
          c.globalAlpha = Math.max(0, q.life / q.max); c.fillStyle = q.col;
          c.beginPath(); c.arc(q.x, q.y, q.r, 0, 7); c.fill();
        });
        d.pops.forEach(function (q) {
          c.globalAlpha = Math.max(0, q.life / q.max); c.fillStyle = q.col; c.font = '800 14px Outfit, sans-serif'; c.textAlign = 'center'; c.fillText(q.text, q.x, q.y);
        });
        c.globalAlpha = 1;
        c.restore();

        // bite flash + air bar
        if (d.bite > 0) { c.fillStyle = 'rgba(220,38,38,' + d.bite * .5 + ')'; c.fillRect(0, 0, W, H); }
        var aw = 14, ah = 260, axp = W - 30, ayp = H / 2 - ah / 2;
        c.fillStyle = 'rgba(0,0,0,.45)'; U.roundRect(c, axp - 3, ayp - 3, aw + 6, ah + 6, 8); c.fill();
        var af = U.clamp(p.air / 100, 0, 1);
        c.fillStyle = af < .25 ? (Math.floor(t * 6) % 2 ? '#ef4444' : '#f97316') : '#7dd3fc';
        U.roundRect(c, axp, ayp + ah * (1 - af), aw, ah * af, 6); c.fill();
        c.fillStyle = '#fff'; c.font = '800 11px Outfit, sans-serif'; c.textAlign = 'center';
        c.fillText('AIR', axp + aw / 2, ayp - 10);
        // depth ladder
        c.fillStyle = 'rgba(0,0,0,.45)'; U.roundRect(c, 14, H / 2 - 133, 20, 266, 8); c.fill();
        c.fillStyle = '#fde68a'; c.fillRect(19, H / 2 - 128 + 256 * U.clamp(p.y / DEPTH_PX, 0, 1), 10, 5);
        c.fillStyle = 'rgba(255,255,255,.6)'; c.font = '700 10px Outfit, sans-serif';
        c.fillText('0 m', 24, H / 2 - 140); c.fillText('600', 24, H / 2 + 148);
      }
    });
  }

  window.Milo.register({
    id: 'shark-escape', title: 'Shark Escape', emo: '🦈', category: 'Action',
    tagline: 'Swim up 600 metres past sharks you can read',
    description: 'A vertical escape from 600 metres down. Your air drains constantly and the ' +
      'only refills are the ringed bubbles drifting up the column, so the run is a chain of ' +
      'bubble to bubble. Sharks patrol side to side with a visible yellow vision cone; sit in ' +
      'one for half a second and it turns red and the shark charges, tracking you a little ' +
      'as it goes. Wrecks cross the whole width with one gap marked by a dashed line. The ' +
      'water gets brighter, the sharks bigger and their cones wider as you rise. Reaching the ' +
      'surface banks bonus points for leftover air and hearts. Tip: pass a shark behind its ' +
      'tail, never across its nose.',
    controls: ['← ↑ ↓ →', 'WASD'],
    colors: ['#020a14', '#7dd3fc'],
    tags: ['underwater', 'sharks', 'stealth', 'escape', 'action'],
    mount: mount
  });
})();
