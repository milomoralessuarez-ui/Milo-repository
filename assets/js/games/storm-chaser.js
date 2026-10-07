/* Storm Chaser — drive tornado alley and drop sensor pods as close as you dare. */
(function () {
  'use strict';
  var W = 880, H = 560, TILE = 160;
  var DEBRIS = ['barn', 'cow', 'bale', 'tractor', 'sign'];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.truck = { x: 0, y: 0, ang: -Math.PI / 2, speed: 0, hp: 3, inv: 0, skid: 0 };
      d.tor = { x: 0, y: -900, ang: Math.PI / 2, speed: 70, r: 46, f: 1, spin: 0, lunge: 0, lungeWarn: 0, ft: 0 };
      d.pods = []; d.slots = [0, 0, 0]; d.debris = []; d.dust = []; d.pops = []; d.parts = [];
      d.cam = { x: 0, y: 0 }; d.shake = 0; d.time = 0; d.gold = 0; d.msg = 'Get close. Not that close.'; d.msgT = 2.5;
      d.fields = {};
      g.set('Science', 0); g.set('Pods', '● ● ●'); g.set('Truck', '▮▮▮'); g.set('Storm', 'F1');
    }

    function fieldCol(cx, cy) {
      var h = U.hash2(cx, cy, 5);
      return h < .3 ? '#8a9a3a' : h < .55 ? '#b5a642' : h < .75 ? '#6f8f3a' : '#a08a4a';
    }

    function pop(d, x, y, text, col, big) { d.pops.push({ x: x, y: y, text: text, col: col || '#fff', life: 1.1, max: 1.1, big: big }); }
    function burst(d, x, y, col, n, spd) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.28, s = U.rand(40, spd || 200);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(.3, .8), max: .8, col: col, sz: U.rand(2, 5) });
      }
    }

    function deploy(g) {
      var d = g.data, t = d.truck;
      var slot = -1;
      for (var i = 0; i < 3; i++) if (d.slots[i] <= 0) { slot = i; break; }
      if (slot < 0) { pop(d, t.x, t.y - 30, 'no pods ready', '#fca5a5'); Milo.sound.click(); return; }
      d.slots[slot] = 4.5;
      var edge = Math.max(0, U.dist(t.x, t.y, d.tor.x, d.tor.y) - d.tor.r);
      d.pods.push({ x: t.x, y: t.y, t: 0, edge: edge, done: false });
      Milo.sound.tone({ f: 500, f2: 900, d: .12, v: .07, type: 'square' });
      podsHud(g);
    }

    function podsHud(g) {
      var d = g.data, s = '';
      for (var i = 0; i < 3; i++) s += (d.slots[i] <= 0 ? '●' : '○') + (i < 2 ? ' ' : '');
      g.set('Pods', s);
    }

    function hurt(g, why) {
      var d = g.data, t = d.truck;
      if (t.inv > 0) return;
      t.hp--; t.inv = 1.5; d.shake = .8;
      g.set('Truck', t.hp > 0 ? '▮▮▮'.slice(0, t.hp) : '—');
      burst(d, t.x, t.y, '#f97316', 18, 240);
      Milo.sound.hit();
      if (t.hp <= 0) {
        burst(d, t.x, t.y, '#1f2937', 40, 300);
        Milo.sound.explode();
        g.gameOver({ text: why + ' The storm reached F' + d.tor.f + '. ' + d.gold + ' gold readings.' });
      }
    }

    function spawnDebris(d) {
      var tor = d.tor, a = Math.random() * 6.28, rad = tor.r * U.rand(1.6, 3);
      d.debris.push({ kind: U.choice(DEBRIS), a: a, rad: rad, h: U.rand(10, 40), x: tor.x + Math.cos(a) * rad, y: tor.y + Math.sin(a) * rad, rot: Math.random() * 6.28, vr: U.rand(-6, 6), state: 'orbit', t: U.rand(1.5, 4), vx: 0, vy: 0 });
    }

    return Milo.arcade(host, {
      id: 'storm-chaser',
      w: W, h: H, bg: '#8a9a3a',
      stats: ['Science', 'Pods', 'Truck', 'Storm'],
      touch: 'dpad',
      touchButtons: [{ key: 'action', label: 'POD' }],
      emo: '🌪️',
      start: {
        title: 'Storm Chaser',
        text: 'Drive the alley and drop sensor pods near the funnel. The closer a pod lands, ' +
          'the more science it sends — if it survives the two seconds it needs to transmit. ' +
          'Dodge flying barns. The storm keeps growing.',
        keys: ['↑ gas  ↓ brake', '← → steer', 'Space drop pod']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, t = d.truck, tor = d.tor, inp = g.input;
        d.time += dt;
        if (inp.pressed('action')) deploy(g);

        // truck physics
        var gas = inp.down('up') ? 1 : inp.down('down') ? -.6 : 0;
        t.speed += gas * 260 * dt;
        t.speed -= t.speed * (gas ? .35 : 1.1) * dt;
        t.speed = U.clamp(t.speed, -110, 270);
        var steer = (inp.down('right') ? 1 : 0) - (inp.down('left') ? 1 : 0);
        t.ang += steer * 2.6 * dt * U.clamp(Math.abs(t.speed) / 120, 0, 1) * Math.sign(t.speed || 1);
        t.skid = Math.abs(steer) * Math.abs(t.speed) > 150 ? 1 : 0;
        // tornado pull
        var dist = U.dist(t.x, t.y, tor.x, tor.y), pullR = tor.r * 4.5;
        if (dist < pullR) {
          var pf = (1 - dist / pullR) * 190 * (1 + tor.f * .12);
          t.x += (tor.x - t.x) / dist * pf * dt; t.y += (tor.y - t.y) / dist * pf * dt;
        }
        t.x += Math.cos(t.ang) * t.speed * dt; t.y += Math.sin(t.ang) * t.speed * dt;
        t.inv = Math.max(0, t.inv - dt);
        if (t.skid && g.frame % 2 === 0) d.dust.push({ x: t.x - Math.cos(t.ang) * 14, y: t.y - Math.sin(t.ang) * 14, r: 4, life: .6, max: .6 });
        if (dist < tor.r + 8) { t.hp = 1; hurt(g, 'The truck went up the funnel.'); return; }

        // tornado wander + growth
        tor.spin += dt * (5 + tor.f);
        tor.ft += dt;
        if (tor.ft > 24) { tor.ft = 0; if (tor.f < 5) { tor.f++; tor.r += 14; tor.speed += 12; g.set('Storm', 'F' + tor.f); d.msg = 'Storm upgraded to F' + tor.f; d.msgT = 2; Milo.sound.tone({ f: 80, f2: 160, d: .6, v: .12, type: 'sawtooth' }); } }
        var toTruck = Math.atan2(t.y - tor.y, t.x - tor.x);
        if (tor.lunge > 0) {
          tor.lunge -= dt;
          tor.x += Math.cos(tor.ang) * tor.speed * 2.6 * dt; tor.y += Math.sin(tor.ang) * tor.speed * 2.6 * dt;
        } else {
          tor.lungeWarn -= dt;
          if (tor.lungeWarn <= 0 && tor.lungeWarn > -0.9 && tor.lungeWarn + dt > 0) Milo.sound.tone({ f: 60, f2: 120, d: .8, v: .1, type: 'sawtooth' });
          if (tor.lungeWarn <= -0.9) { tor.lunge = 1.1; tor.lungeWarn = U.rand(7, 12) - tor.f; tor.ang = toTruck; }
          var diff = Math.atan2(Math.sin(toTruck - tor.ang), Math.cos(toTruck - tor.ang));
          tor.ang += U.clamp(diff, -.5 * dt, .5 * dt) + U.rand(-1, 1) * dt * 1.2;
          tor.x += Math.cos(tor.ang) * tor.speed * dt; tor.y += Math.sin(tor.ang) * tor.speed * dt;
          if (dist > 1300) { tor.x += (t.x - tor.x) * dt * .3; tor.y += (t.y - tor.y) * dt * .3; }
        }
        for (var k = 0; k < 2 + tor.f; k++) {
          var da = Math.random() * 6.28, dr = tor.r * U.rand(.6, 1.6);
          d.dust.push({ x: tor.x + Math.cos(da) * dr, y: tor.y + Math.sin(da) * dr, r: U.rand(3, 9), life: .8, max: .8, swirl: true });
        }

        // debris
        var want = 3 + tor.f * 2;
        if (d.debris.length < want && Math.random() < dt * 1.5) spawnDebris(d);
        for (var i = d.debris.length - 1; i >= 0; i--) {
          var db = d.debris[i];
          db.rot += db.vr * dt;
          if (db.state === 'orbit') {
            db.a += dt * (2.2 + tor.f * .3) * (60 / db.rad);
            db.x = tor.x + Math.cos(db.a) * db.rad; db.y = tor.y + Math.sin(db.a) * db.rad;
            db.t -= dt;
            if (db.t <= 0) {
              db.state = 'fly'; db.t = U.rand(1.2, 2.2);
              var ta = db.a + Math.PI / 2, sp = U.rand(260, 420) + tor.f * 30;
              // bias the throw toward the truck a little — it is a storm with a grudge
              var aimA = Math.atan2(t.y - db.y, t.x - db.x);
              ta = Math.atan2(Math.sin(ta) * .6 + Math.sin(aimA) * .4, Math.cos(ta) * .6 + Math.cos(aimA) * .4);
              db.vx = Math.cos(ta) * sp; db.vy = Math.sin(ta) * sp;
            }
          } else {
            db.x += db.vx * dt; db.y += db.vy * dt; db.t -= dt; db.h = Math.max(0, db.h - 20 * dt);
            if (U.dist(db.x, db.y, t.x, t.y) < 26 && db.h < 30) { hurt(g, 'Wrecked by a flying ' + db.kind + '.'); burst(d, db.x, db.y, '#7f1d1d', 10); d.debris.splice(i, 1); continue; }
            if (db.t <= 0) { burst(d, db.x, db.y, '#8a6a3a', 8, 120); d.debris.splice(i, 1); continue; }
          }
        }

        // pods
        d.pods.forEach(function (p) {
          if (p.done) return;
          p.t += dt;
          var pd = U.dist(p.x, p.y, tor.x, tor.y);
          if (pd < tor.r) { p.done = true; p.lost = true; burst(d, p.x, p.y, '#e5e7eb', 12); pop(d, p.x, p.y - 20, 'pod lost', '#fca5a5'); Milo.sound.tone({ f: 400, f2: 100, d: .2, v: .07, type: 'square' }); return; }
          if (p.t >= 2) {
            p.done = true;
            var near = U.clamp(1 - p.edge / 420, 0, 1);
            var pts = Math.round(20 + 480 * near * near) * tor.f;
            var gold = p.edge < 70;
            if (gold) { pts *= 2; d.gold++; }
            g.score += pts; g.set('Science', U.fmt(g.score));
            pop(d, p.x, p.y - 24, (gold ? 'GOLD DATA  ' : '') + '+' + pts, gold ? '#fde047' : '#e0f2fe', gold);
            if (gold) Milo.sound.powerup(); else Milo.sound.coin();
          }
        });
        d.pods = d.pods.filter(function (p) { return !p.done || U.dist(p.x, p.y, t.x, t.y) < 1400; });
        var changed = false;
        for (var s = 0; s < 3; s++) { if (d.slots[s] > 0) { d.slots[s] -= dt; if (d.slots[s] <= 0) changed = true; } }
        if (changed) { podsHud(g); Milo.sound.blip(); }

        d.shake = Math.max(0, d.shake - dt * 3); d.msgT = Math.max(0, d.msgT - dt);
        d.dust = d.dust.filter(function (q) { q.life -= dt; if (q.swirl) { var a2 = Math.atan2(q.y - tor.y, q.x - tor.x) + dt * 6; var rr = U.dist(q.x, q.y, tor.x, tor.y) * (1 - dt * .4); q.x = tor.x + Math.cos(a2) * rr; q.y = tor.y + Math.sin(a2) * rr; } return q.life > 0; });
        d.parts = d.parts.filter(function (q) { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= .94; q.vy *= .94; q.life -= dt; return q.life > 0; });
        d.pops = d.pops.filter(function (q) { q.life -= dt; q.y -= 22 * dt; return q.life > 0; });

        // camera leads toward the storm a little
        var lead = U.clamp(dist, 0, 500) / 500;
        var cx = t.x + (tor.x - t.x) * .18 * lead, cy = t.y + (tor.y - t.y) * .18 * lead;
        d.cam.x += (cx - W / 2 - d.cam.x) * Math.min(1, dt * 4); d.cam.y += (cy - H / 2 - d.cam.y) * Math.min(1, dt * 4);
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, t = d.truck, tor = d.tor;
        c.save();
        if (d.shake > 0) c.translate(U.rand(-1, 1) * d.shake * 7, U.rand(-1, 1) * d.shake * 7);
        c.translate(-d.cam.x, -d.cam.y);
        // fields
        var x0 = Math.floor(d.cam.x / TILE) - 1, y0 = Math.floor(d.cam.y / TILE) - 1;
        for (var ty = y0; ty < y0 + Math.ceil(H / TILE) + 3; ty++) for (var tx = x0; tx < x0 + Math.ceil(W / TILE) + 3; tx++) {
          c.fillStyle = fieldCol(tx, ty); c.fillRect(tx * TILE, ty * TILE, TILE, TILE);
          var h = U.hash2(tx, ty, 9);
          c.strokeStyle = 'rgba(0,0,0,.08)'; c.lineWidth = 2;
          if (h < .5) for (var r = 12; r < TILE; r += 16) { c.beginPath(); c.moveTo(tx * TILE, ty * TILE + r); c.lineTo(tx * TILE + TILE, ty * TILE + r); c.stroke(); }
          else for (var r2 = 12; r2 < TILE; r2 += 16) { c.beginPath(); c.moveTo(tx * TILE + r2, ty * TILE); c.lineTo(tx * TILE + r2, ty * TILE + TILE); c.stroke(); }
          c.strokeStyle = 'rgba(60,50,20,.35)'; c.lineWidth = 3; c.strokeRect(tx * TILE, ty * TILE, TILE, TILE);
          if (h > .93) { c.fillStyle = '#2f5a2a'; c.beginPath(); c.arc(tx * TILE + 40, ty * TILE + 50, 18, 0, 7); c.arc(tx * TILE + 62, ty * TILE + 40, 14, 0, 7); c.fill(); }
        }
        // road
        c.fillStyle = '#6b6252'; c.fillRect(-20, d.cam.y - 40, 40, H + 80);
        c.fillStyle = '#e8e0c0'; for (var dy = Math.floor(d.cam.y / 60) * 60; dy < d.cam.y + H + 60; dy += 60) c.fillRect(-2, dy, 4, 26);

        // storm shadow on the ground
        var sg = c.createRadialGradient(tor.x, tor.y, tor.r, tor.x, tor.y, tor.r * 5);
        sg.addColorStop(0, 'rgba(20,20,30,.55)'); sg.addColorStop(1, 'rgba(20,20,30,0)');
        c.fillStyle = sg; c.fillRect(tor.x - tor.r * 5, tor.y - tor.r * 5, tor.r * 10, tor.r * 10);

        // pods
        d.pods.forEach(function (p) {
          c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(p.x + 2, p.y + 3, 9, 5, 0, 0, 7); c.fill();
          c.fillStyle = p.done ? (p.lost ? '#7f1d1d' : '#0ea5e9') : '#e5e7eb';
          U.roundRect(c, p.x - 8, p.y - 8, 16, 16, 4); c.fill();
          c.fillStyle = '#111'; c.fillRect(p.x - 1, p.y - 16, 2, 8);
          if (!p.done) {
            c.strokeStyle = '#fde047'; c.lineWidth = 3;
            c.beginPath(); c.arc(p.x, p.y, 15, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (p.t / 2)); c.stroke();
          } else if (!p.lost && Math.floor(g.t * 3) % 2) { c.fillStyle = '#0ea5e9'; c.beginPath(); c.arc(p.x, p.y - 16, 2.5, 0, 7); c.fill(); }
        });

        // dust
        d.dust.forEach(function (q) {
          c.globalAlpha = Math.max(0, q.life / q.max) * .5; c.fillStyle = '#c9b98a';
          c.beginPath(); c.arc(q.x, q.y, q.r, 0, 7); c.fill();
        });
        c.globalAlpha = 1;

        // debris shadows first, then bodies
        d.debris.forEach(function (db) { c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(db.x + db.h * .4, db.y + db.h * .6, 16, 8, 0, 0, 7); c.fill(); });

        // truck
        c.save(); c.translate(t.x, t.y); c.rotate(t.ang);
        c.fillStyle = 'rgba(0,0,0,.3)'; U.roundRect(c, -16, -9, 36, 20, 5); c.fill();
        if (!(t.inv > 0 && Math.floor(g.t * 16) % 2)) {
          c.fillStyle = '#2b2b2b'; c.fillRect(-14, -13, 10, 4); c.fillRect(-14, 9, 10, 4); c.fillRect(6, -13, 10, 4); c.fillRect(6, 9, 10, 4);
          c.fillStyle = '#e5e7eb'; U.roundRect(c, -18, -10, 38, 20, 5); c.fill();
          c.fillStyle = '#dc2626'; c.fillRect(-18, -10, 38, 4);
          c.fillStyle = '#1e3a5f'; U.roundRect(c, 2, -8, 12, 16, 3); c.fill();
          c.fillStyle = '#9ca3af'; c.fillRect(-12, -6, 12, 12);
          c.fillStyle = '#facc15'; c.fillRect(18, -8, 3, 4); c.fillRect(18, 4, 3, 4);
          var dish = g.t * 3;
          c.strokeStyle = '#374151'; c.lineWidth = 2; c.beginPath(); c.arc(-6, 0, 6, dish, dish + 2.5); c.stroke();
        }
        c.restore();

        d.debris.forEach(function (db) {
          c.save(); c.translate(db.x, db.y - db.h); c.rotate(db.rot);
          if (db.kind === 'barn') { c.fillStyle = '#b91c1c'; c.fillRect(-14, -8, 28, 16); c.fillStyle = '#7f1d1d'; c.beginPath(); c.moveTo(-16, -8); c.lineTo(0, -18); c.lineTo(16, -8); c.fill(); c.fillStyle = '#fef3c7'; c.fillRect(-4, 0, 8, 8); }
          else if (db.kind === 'cow') { c.fillStyle = '#f5f5f4'; c.beginPath(); c.ellipse(0, 0, 14, 9, 0, 0, 7); c.fill(); c.fillStyle = '#1c1917'; c.beginPath(); c.arc(-5, -2, 4, 0, 7); c.arc(6, 3, 3, 0, 7); c.fill(); c.fillStyle = '#fbcfe8'; c.beginPath(); c.arc(12, 0, 4, 0, 7); c.fill(); }
          else if (db.kind === 'bale') { c.fillStyle = '#d4a017'; c.beginPath(); c.arc(0, 0, 11, 0, 7); c.fill(); c.strokeStyle = '#a16207'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 6, 0, 7); c.stroke(); }
          else if (db.kind === 'tractor') { c.fillStyle = '#15803d'; c.fillRect(-12, -7, 24, 14); c.fillStyle = '#111'; c.beginPath(); c.arc(-9, 8, 6, 0, 7); c.arc(9, 8, 6, 0, 7); c.fill(); c.fillStyle = '#facc15'; c.fillRect(4, -6, 6, 6); }
          else { c.fillStyle = '#78350f'; c.fillRect(-2, -16, 4, 32); c.fillStyle = '#fbbf24'; c.fillRect(-14, -16, 28, 12); c.fillStyle = '#111'; c.font = '800 8px Outfit, sans-serif'; c.textAlign = 'center'; c.fillText('ALLEY', 0, -7); }
          c.restore();
        });

        // tornado funnel
        var layers = 7;
        for (var l = layers - 1; l >= 0; l--) {
          var k = l / (layers - 1), rr = tor.r * (0.35 + k * 1.1);
          var ox = Math.sin(tor.spin * .7 + l * 1.3) * tor.r * .25 * k, oy = -l * tor.r * .55;
          var shade = tor.lunge > 0 || (tor.lungeWarn < 0) ? 40 + l * 10 : 70 + l * 14;
          c.fillStyle = 'rgba(' + shade + ',' + shade + ',' + (shade + 12) + ',' + (0.85 - k * .35) + ')';
          c.beginPath(); c.ellipse(tor.x + ox, tor.y + oy, rr, rr * .45, 0, 0, 7); c.fill();
          c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 2;
          c.beginPath(); c.ellipse(tor.x + ox, tor.y + oy, rr * .8, rr * .35, tor.spin * .3 + l, 0, 7); c.stroke();
        }
        c.fillStyle = 'rgba(120,100,60,.5)'; c.beginPath(); c.ellipse(tor.x, tor.y + 6, tor.r * 1.5, tor.r * .5, 0, 0, 7); c.fill();

        d.parts.forEach(function (q) { c.globalAlpha = Math.max(0, q.life / q.max); c.fillStyle = q.col; c.fillRect(q.x - q.sz / 2, q.y - q.sz / 2, q.sz, q.sz); });
        c.globalAlpha = 1;
        d.pops.forEach(function (q) {
          c.globalAlpha = Math.max(0, q.life / q.max); c.fillStyle = q.col; c.textAlign = 'center';
          c.font = (q.big ? '900 22px' : '800 14px') + ' Outfit, sans-serif'; c.shadowColor = '#000'; c.shadowBlur = 6; c.fillText(q.text, q.x, q.y); c.shadowBlur = 0;
        });
        c.globalAlpha = 1;
        c.restore();

        // HUD: distance readout + pod slots + storm arrow
        var dist = Math.max(0, U.dist(t.x, t.y, tor.x, tor.y) - tor.r);
        var near = U.clamp(1 - dist / 420, 0, 1), preview = Math.round(20 + 480 * near * near) * tor.f * (dist < 70 ? 2 : 1);
        c.fillStyle = 'rgba(0,0,0,.5)'; U.roundRect(c, 14, H - 62, 250, 48, 10); c.fill();
        c.fillStyle = dist < 70 ? '#fde047' : '#fff'; c.font = '800 13px Outfit, sans-serif'; c.textAlign = 'left';
        c.fillText('FUNNEL ' + Math.round(dist) + ' m', 26, H - 42);
        c.fillStyle = 'rgba(255,255,255,.7)'; c.font = '600 11px Outfit, sans-serif';
        c.fillText('a pod here would send ' + preview + (dist < 70 ? '  (GOLD)' : ''), 26, H - 25);
        for (var s = 0; s < 3; s++) {
          var ready = d.slots[s] <= 0, frac = ready ? 1 : 1 - d.slots[s] / 4.5;
          c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 3; c.beginPath(); c.arc(300 + s * 34, H - 38, 11, 0, 7); c.stroke();
          c.strokeStyle = ready ? '#fde047' : '#e5e7eb'; c.beginPath(); c.arc(300 + s * 34, H - 38, 11, -Math.PI / 2, -Math.PI / 2 + frac * 6.283); c.stroke();
          if (ready) { c.fillStyle = '#fde047'; c.beginPath(); c.arc(300 + s * 34, H - 38, 5, 0, 7); c.fill(); }
        }
        var sa = Math.atan2(tor.y - d.cam.y - H / 2, tor.x - d.cam.x - W / 2);
        var sx = tor.x - d.cam.x, sy = tor.y - d.cam.y;
        if (sx < 0 || sx > W || sy < 0 || sy > H) {
          var ex = U.clamp(W / 2 + Math.cos(sa) * 1000, 30, W - 30), ey = U.clamp(H / 2 + Math.sin(sa) * 1000, 70, H - 80);
          c.save(); c.translate(ex, ey); c.rotate(sa); c.fillStyle = '#1f2937'; c.beginPath(); c.moveTo(16, 0); c.lineTo(-10, -10); c.lineTo(-10, 10); c.fill(); c.restore();
        }
        if (d.msgT > 0) {
          c.globalAlpha = Math.min(1, d.msgT); c.fillStyle = '#fff'; c.font = '900 26px Outfit, sans-serif'; c.textAlign = 'center';
          c.shadowColor = '#000'; c.shadowBlur = 10; c.fillText(d.msg, W / 2, 80); c.shadowBlur = 0; c.globalAlpha = 1;
        }
      }
    });
  }

  window.Milo.register({
    id: 'storm-chaser', title: 'Storm Chaser', emo: '🌪️', category: 'Action',
    tagline: 'Drop pods by the funnel; greed is the difficulty',
    description: 'Top-down tornado chasing. You drive a sensor truck across the fields while ' +
      'the funnel wanders and grows from F1 to F5; a pod dropped with Space needs two ' +
      'seconds to transmit and pays out by how close to the funnel it sat, doubled inside ' +
      '70 metres, but the storm eats any pod it passes over. Barns, cows, bales and tractors ' +
      'orbit the funnel and get flung outward, and every so often the storm growls and lunges ' +
      'at you. Three hits wreck the truck; the pull inside the dust ring is stronger than it ' +
      'looks. Tip: drop on the way OUT of a pass, when you already have speed pointing away.',
    controls: ['↑ ↓ gas / brake', '← → steer', 'Space pod'],
    colors: ['#8a9a3a', '#1f2937'],
    tags: ['driving', 'tornado', 'risk', 'top-down', 'action'],
    mount: mount
  });
})();
