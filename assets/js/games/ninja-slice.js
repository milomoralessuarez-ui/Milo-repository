/* Ninja Slice — read the timing ring, slice inside the window, parry the perfect moment. */
(function () {
  'use strict';
  var W = 800, H = 600, R0 = 118, WIN = 20, PERFECT = 7, GRACE = .12;
  var KIND = {
    grunt: { col: '#ef4444', T: 1.75, r: 26, pts: 100 },
    swift: { col: '#a855f7', T: 1.15, r: 22, pts: 150 },
    boss: { col: '#f59e0b', T: 1.5, r: 36, pts: 500 }
  };

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.enemies = []; d.halves = []; d.parts = []; d.pops = []; d.trail = []; d.petals = []; d.flashes = [];
      for (var i = 0; i < 26; i++) d.petals.push({ x: Math.random() * W, y: Math.random() * H, vx: U.rand(-20, 10), vy: U.rand(18, 40), ph: Math.random() * 6.28, s: U.rand(3, 6) });
      d.lives = 3; d.combo = 0; d.bestCombo = 0; d.kills = 0; d.parries = 0; d.bossKills = 0;
      d.spawnT = 1.1; d.nextBoss = 12; d.hurtT = 0; d.shake = 0; d.flash = 0; d.msg = 'They come for you. Read the ring.'; d.msgT = 2.5;
      d.lastPt = null; d.time = 0;
      g.set('Score', 0); g.set('Combo', 0); g.set('Lives', '♥♥♥');
    }

    function mult(d) { return Math.min(5, 1 + Math.floor(d.combo / 8)); }
    function livesText(n) { var s = ''; for (var i = 0; i < 3; i++) s += i < n ? '♥' : '♡'; return s; }
    function pop(d, x, y, text, col, big) { d.pops.push({ x: x, y: y, text: text, col: col || '#fff', life: .9, max: .9, big: !!big }); }
    function ink(d, x, y, col, n) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.28, s = U.rand(60, 320);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(.3, .8), max: .8, col: col, r: U.rand(2, 7) });
      }
    }

    function freeSpot(d, r) {
      for (var tries = 0; tries < 40; tries++) {
        var x = U.rand(110, W - 110), y = U.rand(155, H - 110), ok = true;
        for (var i = 0; i < d.enemies.length; i++) if (U.dist(x, y, d.enemies[i].x, d.enemies[i].y) < r + d.enemies[i].r + 90) { ok = false; break; }
        if (ok) return { x: x, y: y };
      }
      return { x: U.rand(110, W - 110), y: U.rand(130, H - 110) };
    }

    function spawn(d, kind) {
      var k = KIND[kind], sp = freeSpot(d, k.r);
      var speedUp = Math.max(.55, 1 - d.kills * .009);
      d.enemies.push({ x: sp.x, y: sp.y, kind: kind, col: k.col, r: k.r, T: k.T * (kind === 'boss' ? 1 : speedUp), t: 0, ring: R0, state: 'live', hp: kind === 'boss' ? 3 : 1, feint: kind === 'boss', blockT: 0, appear: .25, bob: Math.random() * 6.28, snapT: 0 });
      if (kind === 'boss') { d.msg = 'BOSS — he feints first, then strikes'; d.msgT = 2.2; Milo.sound.tone({ f: 120, f2: 240, d: .5, v: .12, type: 'sawtooth' }); }
      else Milo.sound.tone({ f: 200, f2: 300, d: .06, v: .03, type: 'triangle' });
    }

    function teleport(d, e) {
      ink(d, e.x, e.y, 'rgba(30,20,50,.9)', 14);
      var sp = freeSpot(d, e.r); e.x = sp.x; e.y = sp.y; e.t = 0; e.ring = R0; e.appear = .3; e.state = 'live';
      Milo.sound.noise(.12, .06, 1200);
    }

    function hurt(g, e) {
      var d = g.data;
      d.lives--; d.combo = 0; d.hurtT = .5; d.shake = .7;
      g.set('Lives', livesText(d.lives)); g.set('Combo', 0);
      ink(d, e.x, e.y, '#ef4444', 20);
      d.flashes.push({ x1: e.x - 80, y1: e.y - 60, x2: e.x + 80, y2: e.y + 60, life: .25 });
      Milo.sound.hit();
      if (d.lives <= 0) {
        g.gameOver({ text: 'Cut down after ' + d.kills + ' ninjas and ' + d.bossKills + ' bosses, ' + d.parries + ' perfect parries. Best combo ' + d.bestCombo + '.' });
      }
    }

    function slice(g, e, fromX, fromY) {
      var d = g.data;
      if (e.state === 'dead' || e.appear > 0) return;
      var err = e.ring - e.r;
      if (e.state === 'feint') {
        d.combo = 0; g.set('Combo', 0);
        pop(d, e.x, e.y - e.r - 20, 'FEINT!', '#f59e0b', true);
        e.feint = false; teleport(d, e);
        Milo.sound.tone({ f: 500, f2: 150, d: .2, v: .08, type: 'square' });
        return;
      }
      if (err > WIN) {
        if (e.blockT > 0) return;
        e.blockT = .3; d.combo = 0; g.set('Combo', 0);
        pop(d, e.x, e.y - e.r - 18, 'too early — blocked', 'rgba(255,255,255,.7)');
        d.flashes.push({ x1: e.x - 24, y1: e.y - 10, x2: e.x + 24, y2: e.y + 10, life: .18 });
        Milo.sound.click();
        return;
      }
      var perfect = Math.abs(err) <= PERFECT;
      d.combo++; if (d.combo > d.bestCombo) d.bestCombo = d.combo;
      var m = mult(d), pts = KIND[e.kind].pts * (perfect ? 3 : 1) * m;
      if (perfect) d.parries++;
      g.score += pts; g.set('Score', U.fmt(g.score)); g.set('Combo', d.combo + (m > 1 ? '  x' + m : ''));
      var ang = Math.atan2(e.y - fromY, e.x - fromX);
      if (e.kind === 'boss' && e.hp > 1) {
        e.hp--;
        pop(d, e.x, e.y - e.r - 20, (perfect ? 'PARRY x3  ' : '') + '+' + pts, perfect ? '#fde68a' : '#fff', perfect);
        ink(d, e.x, e.y, e.col, 12);
        e.feint = true; teleport(d, e);
        Milo.sound.tone({ f: perfect ? 1200 : 700, f2: perfect ? 1800 : 900, d: .12, v: .09, type: 'square' });
        return;
      }
      e.state = 'dead';
      d.kills++;
      if (e.kind === 'boss') { d.bossKills++; d.shake = .8; d.flash = .3; }
      d.halves.push({ x: e.x, y: e.y, r: e.r, col: e.col, ang: ang, side: 1, vx: Math.cos(ang + 1.57) * 140, vy: -120, rot: 0, life: .7 });
      d.halves.push({ x: e.x, y: e.y, r: e.r, col: e.col, ang: ang, side: -1, vx: Math.cos(ang - 1.57) * 140, vy: -120, rot: 0, life: .7 });
      ink(d, e.x, e.y, perfect ? '#fde68a' : e.col, perfect ? 26 : 14);
      ink(d, e.x, e.y, 'rgba(20,12,40,.9)', 10);
      pop(d, e.x, e.y - e.r - 22, perfect ? 'PARRY  x3  +' + pts : '+' + pts, perfect ? '#fde68a' : '#fff', perfect);
      if (perfect) { d.flash = Math.max(d.flash, .18); Milo.sound.tone({ f: 1100, f2: 1700, d: .14, v: .1, type: 'square' }); }
      else Milo.sound.tone({ f: 600, f2: 900, d: .08, v: .07, type: 'square' });
      Milo.sound.noise(.08, .07, 3000);
    }

    function segCircle(ax, ay, bx, by, cx, cy, r) {
      var dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
      var tt = l2 ? U.clamp(((cx - ax) * dx + (cy - ay) * dy) / l2, 0, 1) : 0;
      return U.dist(ax + dx * tt, ay + dy * tt, cx, cy) < r;
    }

    function swipe(g, x0, y0, x1, y1) {
      var d = g.data;
      d.enemies.forEach(function (e) { if (segCircle(x0, y0, x1, y1, e.x, e.y, e.r + 8)) slice(g, e, x0, y0); });
    }

    // keyboard: slash the enemy whose ring is closest to closing
    function autoSlash(g) {
      var d = g.data, best = null, be = 1e9;
      d.enemies.forEach(function (e) { if (e.state === 'dead' || e.appear > 0) return; var err = e.ring - e.r; if (err < be) { be = err; best = e; } });
      if (!best) { Milo.sound.noise(.06, .04, 1500); return; }
      var a = Math.random() * 6.28, fx = best.x + Math.cos(a) * 90, fy = best.y + Math.sin(a) * 90;
      d.trail = [{ x: fx, y: fy, t: d.time }, { x: best.x - Math.cos(a) * 60, y: best.y - Math.sin(a) * 60, t: d.time }];
      slice(g, best, fx, fy);
    }

    return Milo.arcade(host, {
      id: 'ninja-slice',
      w: W, h: H, bg: '#0f0a1e',
      stats: ['Score', 'Combo', 'Lives'],
      touchButtons: [{ key: 'action', label: 'SLASH' }],
      emo: '🥷',
      start: {
        title: 'Ninja Slice',
        text: 'Each ninja wears a shrinking ring. Swipe through him while the ring is on his body ' +
          '— too early and he blocks, too late and he strikes. Dead centre is a parry worth ' +
          'triple. Bosses feint first: the ring snaps back out. The strike after a feint is real.',
        keys: ['Drag to slice', 'Space slash the closest']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        var d = g.data;
        if (type === 'down') { d.lastPt = { x: x, y: y }; d.trail = [{ x: x, y: y, t: d.time }]; return; }
        if (type === 'up') { d.lastPt = null; return; }
        if (type === 'move' && d.lastPt) {
          if (U.dist(x, y, d.lastPt.x, d.lastPt.y) < 4) return;
          d.trail.push({ x: x, y: y, t: d.time });
          if (d.trail.length > 14) d.trail.shift();
          swipe(g, d.lastPt.x, d.lastPt.y, x, y);
          d.lastPt = { x: x, y: y };
        }
      },

      update: function (g, dt) {
        var d = g.data, inp = g.input;
        d.time += dt;
        d.shake = Math.max(0, d.shake - dt * 3); d.hurtT = Math.max(0, d.hurtT - dt); d.flash = Math.max(0, d.flash - dt); d.msgT = Math.max(0, d.msgT - dt);
        if (inp.pressed('action') || inp.pressed('up') || inp.pressed('down') || inp.pressed('left') || inp.pressed('right') || inp.pressed('a') || inp.pressed('b')) autoSlash(g);

        // spawning
        d.spawnT -= dt;
        var alive = d.enemies.filter(function (e) { return e.state !== 'dead'; }).length;
        var maxAlive = Math.min(4, 1 + Math.floor(d.kills / 6));
        var hasBoss = d.enemies.some(function (e) { return e.kind === 'boss'; });
        if (d.spawnT <= 0 && alive < maxAlive) {
          if (d.kills >= d.nextBoss && !hasBoss) { spawn(d, 'boss'); d.nextBoss += 12; }
          else spawn(d, d.kills >= 8 && Math.random() < Math.min(.45, .1 + d.kills * .01) ? 'swift' : 'grunt');
          d.spawnT = Math.max(.5, 1.5 - d.kills * .025) * U.rand(.8, 1.2);
        }

        // enemies
        for (var i = d.enemies.length - 1; i >= 0; i--) {
          var e = d.enemies[i];
          e.bob += dt * 4; e.blockT = Math.max(0, e.blockT - dt); e.snapT = Math.max(0, e.snapT - dt);
          if (e.state === 'dead') { d.enemies.splice(i, 1); continue; }
          if (e.appear > 0) { e.appear -= dt; continue; }
          e.t += dt;
          e.ring = e.r + (R0 - e.r) * Math.max(0, 1 - e.t / e.T);
          if (e.kind === 'boss' && e.feint && e.state === 'live') e.state = 'feint';
          if (e.state === 'feint') {
            // the fake ring snaps back out before it ever reaches him
            if (e.ring <= e.r * 1.45) {
              e.state = 'live'; e.feint = false; e.t = 0; e.ring = R0; e.snapT = .3;
              pop(d, e.x, e.y - e.r - 20, '!', '#f59e0b', true);
              Milo.sound.tone({ f: 800, f2: 300, d: .15, v: .07, type: 'triangle' });
            }
            continue;
          }
          if (e.t >= e.T + GRACE) {
            hurt(g, e);
            if (g.state !== 'play') return;
            if (e.kind === 'boss') { e.feint = true; teleport(d, e); }
            else d.enemies.splice(i, 1);
          }
        }

        d.halves = d.halves.filter(function (h) { h.x += h.vx * dt; h.y += h.vy * dt; h.vy += 500 * dt; h.rot += h.side * 6 * dt; h.life -= dt; return h.life > 0; });
        d.parts = d.parts.filter(function (q) { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= .92; q.vy *= .92; q.vy += 120 * dt; q.life -= dt; return q.life > 0; });
        d.pops = d.pops.filter(function (q) { q.life -= dt; q.y -= 30 * dt; return q.life > 0; });
        d.flashes = d.flashes.filter(function (f) { f.life -= dt; return f.life > 0; });
        d.trail = d.trail.filter(function (p) { return d.time - p.t < .22; });
        d.petals.forEach(function (p) { p.ph += dt; p.x += (p.vx + Math.sin(p.ph) * 18) * dt; p.y += p.vy * dt; if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; } if (p.x < -10) p.x = W + 10; });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, t = g.t;
        c.save();
        if (d.shake > 0) c.translate(U.rand(-1, 1) * d.shake * 6, U.rand(-1, 1) * d.shake * 6);
        // dojo night
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#0f0a1e'); bg.addColorStop(1, '#1a1030');
        c.fillStyle = bg; c.fillRect(-10, -10, W + 20, H + 20);
        c.fillStyle = '#f5e9c8'; c.beginPath(); c.arc(660, 90, 46, 0, 7); c.fill();
        c.fillStyle = 'rgba(15,10,30,.25)'; c.beginPath(); c.arc(675, 80, 12, 0, 7); c.arc(650, 105, 8, 0, 7); c.fill();
        [[120, 130], [400, 90], [700, 250]].forEach(function (l, i) {
          var fl = .85 + Math.sin(t * 7 + i * 2) * .15;
          var lg = c.createRadialGradient(l[0], l[1], 6, l[0], l[1], 130 * fl);
          lg.addColorStop(0, 'rgba(251,146,60,.28)'); lg.addColorStop(1, 'rgba(251,146,60,0)');
          c.fillStyle = lg; c.fillRect(l[0] - 140, l[1] - 140, 280, 280);
          c.fillStyle = '#c2410c'; U.roundRect(c, l[0] - 12, l[1] - 18, 24, 36, 10); c.fill();
          c.fillStyle = '#fdba74'; U.roundRect(c, l[0] - 8, l[1] - 12, 16, 24, 6); c.fill();
          c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 1; c.beginPath(); c.moveTo(l[0], l[1] - 18); c.lineTo(l[0], 0); c.stroke();
        });
        // floor boards
        c.fillStyle = '#231733'; c.fillRect(0, H - 90, W, 90);
        c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 2;
        for (var fb = 0; fb < W; fb += 80) { c.beginPath(); c.moveTo(fb, H - 90); c.lineTo(fb, H); c.stroke(); }
        c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(0, H - 90, W, 3);
        // petals
        d.petals.forEach(function (p) { c.fillStyle = 'rgba(251,182,206,.7)'; c.beginPath(); c.ellipse(p.x, p.y, p.s, p.s * .55, p.ph, 0, 7); c.fill(); });

        // enemies
        d.enemies.forEach(function (e) {
          var ap = e.appear > 0 ? 1 - e.appear / .3 : 1;
          c.globalAlpha = U.clamp(ap, 0, 1);
          c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(e.x, e.y + e.r + 6, e.r * .9, e.r * .3, 0, 0, 7); c.fill();
          // timing ring
          if (e.appear <= 0) {
            var err = e.ring - e.r, inWin = err <= WIN, feint = e.state === 'feint';
            var k = U.clamp(1 - err / (R0 - e.r), 0, 1);
            c.lineWidth = inWin ? 4 : 2.5;
            c.strokeStyle = feint ? 'rgba(245,158,11,.8)' : inWin ? (Math.abs(err) <= PERFECT ? '#fde68a' : '#fff') : 'rgba(255,' + Math.round(255 - k * 160) + ',' + Math.round(255 - k * 200) + ',' + (0.45 + k * .5) + ')';
            if (inWin) { c.shadowColor = c.strokeStyle; c.shadowBlur = 14; }
            c.beginPath(); c.arc(e.x, e.y, e.ring, 0, 7); c.stroke();
            c.shadowBlur = 0;
            if (feint) { c.setLineDash([6, 6]); c.strokeStyle = 'rgba(245,158,11,.5)'; c.lineWidth = 1.5; c.beginPath(); c.arc(e.x, e.y, e.r * 1.45, 0, 7); c.stroke(); c.setLineDash([]); }
            // window band + perfect line on the body
            c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = WIN; c.beginPath(); c.arc(e.x, e.y, e.r + WIN / 2, 0, 7); c.stroke();
            c.strokeStyle = 'rgba(253,230,138,.6)'; c.lineWidth = 1.5; c.beginPath(); c.arc(e.x, e.y, e.r, 0, 7); c.stroke();
          }
          // body
          var bob = Math.sin(e.bob) * 2, ex = e.x, ey = e.y + bob;
          if (e.snapT > 0) { ex += U.rand(-3, 3); }
          c.fillStyle = e.blockT > 0 ? '#e5e7eb' : '#1c1633';
          c.beginPath(); c.arc(ex, ey, e.r, 0, 7); c.fill();
          c.strokeStyle = e.col; c.lineWidth = e.kind === 'boss' ? 6 : 4;
          c.beginPath(); c.arc(ex, ey, e.r - 3, -2.6, -.5); c.stroke();
          c.fillStyle = e.col; c.beginPath(); c.moveTo(ex + e.r * .6, ey - e.r * .6); c.lineTo(ex + e.r * 1.1, ey - e.r * .9); c.lineTo(ex + e.r * .9, ey - e.r * .4); c.closePath(); c.fill();
          c.fillStyle = '#fff'; c.fillRect(ex - e.r * .45, ey - 4, e.r * .3, 3); c.fillRect(ex + e.r * .15, ey - 4, e.r * .3, 3);
          c.fillStyle = e.state === 'feint' ? '#f59e0b' : '#ef4444'; c.fillRect(ex - e.r * .4, ey - 4, e.r * .16, 3); c.fillRect(ex + e.r * .2, ey - 4, e.r * .16, 3);
          // blade
          var reach = e.appear <= 0 ? U.clamp(1 - (e.ring - e.r) / (R0 - e.r), 0, 1) : 0;
          c.strokeStyle = '#e2e8f0'; c.lineWidth = 3; c.lineCap = 'round';
          c.beginPath(); c.moveTo(ex + e.r * .5, ey + e.r * .5); c.lineTo(ex + e.r * .5 + (18 + reach * 22) * Math.cos(-.9 + reach * 1.4), ey + e.r * .5 + (18 + reach * 22) * Math.sin(-.9 + reach * 1.4)); c.stroke();
          if (e.kind === 'boss') {
            for (var hp = 0; hp < 3; hp++) { c.fillStyle = hp < e.hp ? '#f59e0b' : 'rgba(255,255,255,.2)'; c.beginPath(); c.arc(ex - 14 + hp * 14, ey - e.r - 14, 4, 0, 7); c.fill(); }
          }
          c.globalAlpha = 1;
        });

        // halves of sliced ninjas
        d.halves.forEach(function (h) {
          c.save(); c.globalAlpha = Math.max(0, h.life / .7); c.translate(h.x, h.y); c.rotate(h.ang + h.rot);
          c.fillStyle = '#1c1633'; c.beginPath(); c.arc(0, h.side * 3, h.r, h.side > 0 ? 0 : Math.PI, h.side > 0 ? Math.PI : 6.283); c.closePath(); c.fill();
          c.strokeStyle = h.col; c.lineWidth = 3; c.stroke();
          c.restore();
        });
        c.globalAlpha = 1;

        // ink + flashes + trail
        d.parts.forEach(function (q) { c.globalAlpha = Math.max(0, q.life / q.max); c.fillStyle = q.col; c.beginPath(); c.arc(q.x, q.y, q.r * (q.life / q.max), 0, 7); c.fill(); });
        c.globalAlpha = 1;
        d.flashes.forEach(function (f) { c.strokeStyle = 'rgba(255,255,255,' + f.life * 3 + ')'; c.lineWidth = 3; c.beginPath(); c.moveTo(f.x1, f.y1); c.lineTo(f.x2, f.y2); c.stroke(); });
        if (d.trail.length > 1) {
          c.lineCap = 'round'; c.lineJoin = 'round';
          for (var ti = 1; ti < d.trail.length; ti++) {
            var a = d.trail[ti - 1], b = d.trail[ti], age = 1 - (d.time - b.t) / .22;
            c.strokeStyle = 'rgba(165,243,252,' + U.clamp(age, 0, 1) + ')'; c.lineWidth = 2 + age * 7;
            c.shadowColor = '#22d3ee'; c.shadowBlur = 10;
            c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
          }
          c.shadowBlur = 0;
        }
        d.pops.forEach(function (q) {
          c.globalAlpha = Math.max(0, q.life / q.max); c.fillStyle = q.col; c.textAlign = 'center';
          c.font = (q.big ? '900 24px' : '800 14px') + ' Outfit, sans-serif'; c.shadowColor = '#000'; c.shadowBlur = 6; c.fillText(q.text, q.x, q.y); c.shadowBlur = 0;
        });
        c.globalAlpha = 1;
        c.restore();

        if (d.hurtT > 0) { c.fillStyle = 'rgba(239,68,68,' + d.hurtT * .5 + ')'; c.fillRect(0, 0, W, H); }
        if (d.flash > 0) { c.fillStyle = 'rgba(253,230,138,' + d.flash * .5 + ')'; c.fillRect(0, 0, W, H); }

        // bottom readout
        c.fillStyle = 'rgba(15,10,30,.7)'; U.roundRect(c, 12, H - 40, W - 24, 28, 8); c.fill();
        c.fillStyle = 'rgba(255,255,255,.6)'; c.font = '700 12px Outfit, sans-serif'; c.textAlign = 'left';
        c.fillText(d.kills + ' cut  ·  ' + d.parries + ' parries  ·  next boss in ' + Math.max(0, d.nextBoss - d.kills), 24, H - 22);
        c.textAlign = 'right';
        c.fillText('x' + mult(d) + ' multiplier  ·  ' + (8 - d.combo % 8) + ' to next', W - 24, H - 22);

        if (d.msgT > 0) {
          c.globalAlpha = Math.min(1, d.msgT); c.fillStyle = '#fff'; c.font = '900 24px Outfit, sans-serif'; c.textAlign = 'center';
          c.shadowColor = '#000'; c.shadowBlur = 10; c.fillText(d.msg, W / 2, 112); c.shadowBlur = 0; c.globalAlpha = 1;
        }
      }
    });
  }

  window.Milo.register({
    id: 'ninja-slice', title: 'Ninja Slice', emo: '🥷', category: 'Action',
    tagline: 'Slice inside the ring; parry the exact moment for x3',
    description: 'A swipe game about timing rather than speed. Every ninja appears with a ring ' +
      'that shrinks onto his body; drag the blade through him while the ring sits within the ' +
      'pale band around him and he splits, but swipe early and he blocks it (combo gone), miss ' +
      'the window and he strikes you for a life. Land the cut with the ring dead on his outline ' +
      'and it counts as a parry for triple points. Purple ninjas close their rings in two thirds ' +
      'the time, the ring speeds up as your count rises, and every twelve kills a gold boss ' +
      'shows up who alternates feints and real strikes — his fake ring snaps back out at the ' +
      'dashed line, and slicing during it hands him a free teleport. Space slashes whichever ' +
      'ninja is closest to striking if you would rather play on keys. Tip: watch the blade in ' +
      'his hand — it swings out as the ring closes.',
    controls: ['Drag to slice', 'Space slash', 'Tap / swipe'],
    colors: ['#1a1030', '#ef4444'],
    tags: ['ninja', 'swipe', 'timing', 'parry', 'action'],
    mount: mount
  });
})();
