/* Volcano Escape — wall-jump up an erupting caldera; the lava surges on a beat. */
(function () {
  'use strict';
  var W = 520, H = 720, SURGE_P = 2.6, GRAV = 1350;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function shaft(y, seed) {
      var n1 = U.noise2(y * .0018, 0, seed), n2 = U.noise2(y * .0011 + 50, 0, seed + 3);
      var half = 112 + n1 * 95, cx = W / 2 + (n2 - .5) * 120;
      return [cx - half, cx + half];
    }

    function reset(g) {
      var d = g.data;
      d.seed = U.randInt(1, 9999);
      d.p = { x: 0, y: 0, vx: 0, vy: 0, side: -1, grip: 1, hp: 3, inv: 0, face: 1, stand: 0 };
      d.p.x = shaft(0, d.seed)[0] + 14;
      d.lava = 300; d.camY = d.p.y - H * .62; d.height = 0;
      d.beatT = SURGE_P; d.surge = 0; d.warned = false; d.cool = 0; d.glow = 0; d.shake = 0;
      d.rocks = []; d.feats = []; d.parts = []; d.pops = []; d.ash = []; d.rockT = 2.2; d.genY = 160; d.time = 0;
      d.msg = 'Jump wall to wall. Blue vents freeze the lava.'; d.msgT = 3;
      for (var i = 0; i < 40; i++) d.ash.push({ x: Math.random() * W, y: Math.random() * H, v: U.rand(15, 40), ph: Math.random() * 6.28 });
      genFeats(d);
      g.set('Height', 0); g.set('Best', U.fmt(g.best)); g.set('Hearts', '♥♥♥');
    }

    function genFeats(d) {
      while (d.genY > d.camY - 1200) {
        d.genY -= 150;
        var h = U.hash2(Math.round(d.genY), 1, d.seed), side = U.hash2(Math.round(d.genY), 2, d.seed) < .5 ? -1 : 1;
        var climb = Math.max(0, -d.genY / 10);
        if (h < .2) d.feats.push({ y: d.genY, side: side, kind: 'vent', used: false, ph: Math.random() * 6.28 });
        else if (h < .2 + Math.min(.45, .12 + climb * .0008)) d.feats.push({ y: d.genY, side: side, kind: 'hot', ph: Math.random() * 6.28 });
      }
    }

    function burst(d, x, y, col, n, spd, grav) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.28, s = U.rand(30, spd || 200);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(.3, .9), max: .9, col: col, sz: U.rand(2, 5), grav: grav || 0 });
      }
    }
    function pop(d, x, y, text, col) { d.pops.push({ x: x, y: y, text: text, col: col || '#fff', life: 1, max: 1 }); }
    function heartsText(n) { var s = ''; for (var i = 0; i < 3; i++) s += i < n ? '♥' : '♡'; return s; }

    function jump(g) {
      var d = g.data, p = d.p;
      if (p.side === 0) return;
      p.vx = -p.side * 400; p.vy = -560; p.face = -p.side; p.side = 0; p.stand = 0;
      burst(d, p.x, p.y + 8, '#57534e', 5, 90, 300);
      Milo.sound.jump();
    }

    function cling(d, p, side) {
      p.side = side; p.vx = 0; p.vy = Math.max(0, p.vy * .1); p.grip = Math.max(p.grip, .35);
      Milo.sound.tone({ f: 260, f2: 160, d: .06, v: .04, type: 'triangle' });
      burst(d, p.x + side * 10, p.y, '#78716c', 3, 60, 300);
    }

    function hurt(g, rock) {
      var d = g.data, p = d.p;
      if (p.inv > 0) return;
      p.hp--; p.inv = 1.3; d.shake = .7;
      g.set('Hearts', heartsText(p.hp));
      burst(d, p.x, p.y, '#fb7185', 14, 220, 300);
      Milo.sound.hit();
      if (p.side !== 0) { p.vx = -p.side * 180; p.side = 0; p.vy = 80; }
      else { p.vx = (p.x > rock.x ? 1 : -1) * 200; p.vy = 100; }
      if (p.hp <= 0) {
        burst(d, p.x, p.y, '#fde68a', 30, 300, 300);
        g.gameOver({ text: 'Knocked off the wall by falling rock at ' + U.fmt(d.height) + ' metres.' });
      }
    }

    function spawnRock(d) {
      var y = d.camY - 140, sh = shaft(y, d.seed);
      var r = U.rand(9, 18 + Math.min(10, d.height * .01));
      d.rocks.push({ x: U.rand(sh[0] + r + 10, sh[1] - r - 10), y: y, vx: U.rand(-90, 90), vy: U.rand(0, 60), r: r, rot: Math.random() * 6.28, vr: U.rand(-4, 4), hot: Math.random() < .5 });
    }

    return Milo.arcade(host, {
      id: 'volcano-escape',
      w: W, h: H, bg: '#0c0607',
      stats: ['Height', 'Best', 'Hearts'],
      touch: 'dpad',
      touchButtons: [{ key: 'action', label: 'JUMP' }],
      emo: '🌋',
      start: {
        title: 'Volcano Escape',
        text: 'You are clinging to the wall of an erupting caldera. Jump to kick across to the ' +
          'other wall and gain height; your grip slips the longer you hang on. The lava surges ' +
          'up on every beat, rocks bounce down the shaft, and blue vents freeze the lava for ' +
          'three seconds.',
        keys: ['Space / ↑ / tap jump', '← → steer in the air']
      },
      init: reset,

      onPointer: function (g, type) { if (type === 'down') jump(g); },

      update: function (g, dt) {
        var d = g.data, p = d.p, inp = g.input;
        d.time += dt;
        d.shake = Math.max(0, d.shake - dt * 3); d.msgT = Math.max(0, d.msgT - dt); p.inv = Math.max(0, p.inv - dt);
        if (inp.pressed('action') || inp.pressed('up')) jump(g);

        var sh = shaft(p.y, d.seed);
        if (p.side !== 0) {
          // clinging: slide, lose grip
          var hotHere = false, feat;
          for (var fi = 0; fi < d.feats.length; fi++) {
            feat = d.feats[fi];
            if (feat.side !== p.side || Math.abs(feat.y - p.y) > 42) continue;
            if (feat.kind === 'hot') hotHere = true;
            else if (feat.kind === 'vent' && !feat.used) {
              feat.used = true; d.cool = 3.2; p.grip = 1;
              pop(d, p.x, p.y - 40, 'COOLING — lava frozen', '#7dd3fc');
              burst(d, p.x, p.y, '#bae6fd', 24, 240, -80);
              Milo.sound.tone({ f: 900, f2: 1500, d: .35, v: .09, type: 'sine' }); Milo.sound.noise(.4, .08, 2500);
            }
          }
          if (d.cool > 0) p.grip = Math.min(1, p.grip + dt); // resting on a cool vent
          else p.grip -= dt * (hotHere ? 1.1 : .32 + d.height * .00025);
          if (hotHere && g.frame % 3 === 0) { d.parts.push({ x: p.x + p.side * 10, y: p.y + U.rand(-10, 10), vx: -p.side * 40, vy: -80, life: .4, max: .4, col: '#f97316', sz: 3, grav: 0 }); }
          if (p.grip <= 0) { p.grip = 0; }
          var slide = 26 + (1 - p.grip) * 230;
          p.y += slide * dt;
          sh = shaft(p.y, d.seed);
          p.x = p.side < 0 ? sh[0] + 14 : sh[1] - 14;
          p.stand += dt;
        } else {
          var ax = (inp.down('right') ? 1 : 0) - (inp.down('left') ? 1 : 0);
          p.vx += ax * 520 * dt; p.vy += GRAV * dt;
          p.x += p.vx * dt; p.y += p.vy * dt;
          sh = shaft(p.y, d.seed);
          if (p.x < sh[0] + 14) { p.x = sh[0] + 14; cling(d, p, -1); }
          else if (p.x > sh[1] - 14) { p.x = sh[1] - 14; cling(d, p, 1); }
        }

        // height
        var hgt = Math.max(0, Math.floor(-p.y / 10));
        if (hgt > d.height) { d.height = hgt; g.score = hgt; g.set('Height', U.fmt(hgt)); }

        // lava rhythm
        if (d.cool > 0) { d.cool -= dt; d.glow = 0; if (d.cool <= 0) { d.msg = 'the crust breaks'; d.msgT = 1.2; Milo.sound.tone({ f: 100, f2: 60, d: .4, v: .1, type: 'sawtooth' }); } }
        else {
          d.beatT -= dt;
          if (d.beatT <= .5 && !d.warned) { d.warned = true; Milo.sound.tone({ f: 70, f2: 50, d: .35, v: .12, type: 'sawtooth' }); }
          d.glow = d.beatT <= .5 ? 1 - d.beatT / .5 : 0;
          if (d.beatT <= 0) {
            d.beatT += SURGE_P; d.warned = false;
            d.surge = 60 + d.height * .07; d.shake = Math.max(d.shake, .5);
            Milo.sound.noise(.3, .14, 400); Milo.sound.tone({ f: 160, f2: 60, d: .3, v: .1, type: 'square' });
            for (var sp = 0; sp < 14; sp++) d.parts.push({ x: U.rand(sh[0], sh[1]), y: d.lava, vx: U.rand(-60, 60), vy: U.rand(-380, -160), life: U.rand(.5, 1), max: 1, col: U.choice(['#fbbf24', '#f97316', '#ef4444']), sz: U.rand(3, 7), grav: 500 });
          }
          var rise = (22 + d.height * .04) * dt;
          if (d.surge > 0) { var s = Math.min(d.surge, d.surge * dt * 9 + 40 * dt); d.lava -= s; d.surge -= s; }
          d.lava -= rise;
          d.lava = Math.min(d.lava, p.y + H * .95);
        }
        if (g.frame % 5 === 0) d.parts.push({ x: U.rand(sh[0], sh[1]), y: d.lava - 4, vx: U.rand(-15, 15), vy: U.rand(-120, -50), life: U.rand(.6, 1.4), max: 1.4, col: d.cool > 0 ? '#94a3b8' : U.choice(['#fbbf24', '#f97316']), sz: U.rand(1.5, 3), grav: -20 });
        if (p.y + 8 > d.lava) {
          burst(d, p.x, p.y, '#fbbf24', 30, 260, 300);
          Milo.sound.explode();
          g.gameOver({ text: 'The lava caught you at ' + U.fmt(d.height) + ' metres.' });
          return;
        }

        // rocks
        d.rockT -= dt;
        if (d.rockT <= 0) { spawnRock(d); d.rockT = Math.max(.55, 2 - d.height * .0022) * U.rand(.7, 1.3); }
        for (var i = d.rocks.length - 1; i >= 0; i--) {
          var r = d.rocks[i];
          r.vy = Math.min(480, r.vy + 900 * dt); r.x += r.vx * dt; r.y += r.vy * dt; r.rot += r.vr * dt;
          var rs = shaft(r.y, d.seed);
          if (r.x - r.r < rs[0]) { r.x = rs[0] + r.r; r.vx = Math.abs(r.vx) * .8 + 50; r.vy *= .85; burst(d, r.x - r.r, r.y, '#a8a29e', 3, 80, 300); Milo.sound.tone({ f: 180, f2: 90, d: .06, v: .03, type: 'triangle' }); }
          if (r.x + r.r > rs[1]) { r.x = rs[1] - r.r; r.vx = -Math.abs(r.vx) * .8 - 50; r.vy *= .85; burst(d, r.x + r.r, r.y, '#a8a29e', 3, 80, 300); Milo.sound.tone({ f: 180, f2: 90, d: .06, v: .03, type: 'triangle' }); }
          if (r.hot && g.frame % 4 === 0) d.parts.push({ x: r.x, y: r.y, vx: 0, vy: -30, life: .3, max: .3, col: '#f97316', sz: 3, grav: 0 });
          if (U.dist(r.x, r.y, p.x, p.y - 8) < r.r + 12) { hurt(g, r); if (g.state !== 'play') return; d.rocks.splice(i, 1); burst(d, r.x, r.y, '#78716c', 10, 160, 300); continue; }
          if (r.y > d.lava + 10) { burst(d, r.x, d.lava, '#fbbf24', 10, 200, 400); Milo.sound.noise(.1, .05, 800); d.rocks.splice(i, 1); continue; }
          if (r.y > d.camY + H + 300) d.rocks.splice(i, 1);
        }

        // camera + generation
        var target = p.y - H * .62;
        d.camY += (target - d.camY) * Math.min(1, dt * 5);
        genFeats(d);
        d.feats = d.feats.filter(function (f) { return f.y < d.camY + H + 300; });

        d.parts = d.parts.filter(function (q) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += q.grav * dt; q.life -= dt; return q.life > 0; });
        d.pops = d.pops.filter(function (q) { q.life -= dt; q.y -= 26 * dt; return q.life > 0; });
        d.ash.forEach(function (a) { a.y += a.v * dt; a.x += Math.sin(a.ph + d.time) * 12 * dt; if (a.y > H) { a.y = -4; a.x = Math.random() * W; } });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, p = d.p, t = g.t;
        c.save();
        if (d.shake > 0) c.translate(U.rand(-1, 1) * d.shake * 6, U.rand(-1, 1) * d.shake * 6);
        // caldera air: red-lit from below
        var near = U.clamp(1 - (d.lava - (d.camY + H)) / 500, 0, 1);
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#0c0607'); bg.addColorStop(1, d.cool > 0 ? '#1a1416' : 'rgb(' + Math.round(60 + near * 90) + ',' + Math.round(14 + near * 20) + ',8)');
        c.fillStyle = bg; c.fillRect(-10, -10, W + 20, H + 20);
        if (d.glow > 0) { c.fillStyle = 'rgba(249,115,22,' + d.glow * .18 + ')'; c.fillRect(0, 0, W, H); }

        c.translate(0, -d.camY);
        // walls as two polygons following the shaft
        var y0 = Math.floor(d.camY / 12) * 12 - 24, y1 = d.camY + H + 24, k;
        [-1, 1].forEach(function (side) {
          c.beginPath();
          c.moveTo(side < 0 ? -10 : W + 10, y0);
          for (k = y0; k <= y1; k += 12) { var s = shaft(k, d.seed); c.lineTo(side < 0 ? s[0] : s[1], k); }
          c.lineTo(side < 0 ? -10 : W + 10, y1); c.closePath();
          c.fillStyle = '#1c1719'; c.fill();
          c.save(); c.clip();
          // basalt columns
          c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 2;
          for (var cx = 0; cx < W; cx += 26) { c.beginPath(); c.moveTo(cx, y0); c.lineTo(cx, y1); c.stroke(); }
          c.strokeStyle = 'rgba(255,255,255,.04)';
          for (var cy = Math.floor(y0 / 60) * 60; cy < y1; cy += 60) { c.beginPath(); c.moveTo(0, cy); c.lineTo(W, cy); c.stroke(); }
          // lava rim light on the wall face
          var rim = c.createLinearGradient(0, d.lava - 260, 0, d.lava);
          rim.addColorStop(0, 'rgba(249,115,22,0)'); rim.addColorStop(1, d.cool > 0 ? 'rgba(148,163,184,.25)' : 'rgba(249,115,22,.45)');
          c.fillStyle = rim; c.fillRect(0, d.lava - 260, W, 300);
          c.restore();
        });

        // wall features
        d.feats.forEach(function (f) {
          var s = shaft(f.y, d.seed), fx = f.side < 0 ? s[0] : s[1];
          if (f.kind === 'hot') {
            var fl = .7 + Math.sin(t * 9 + f.ph) * .3;
            var hg = c.createRadialGradient(fx, f.y, 2, fx, f.y, 70 * fl);
            hg.addColorStop(0, 'rgba(239,68,68,.55)'); hg.addColorStop(1, 'rgba(239,68,68,0)');
            c.fillStyle = hg; c.fillRect(fx - 80, f.y - 80, 160, 160);
            c.fillStyle = '#ef4444'; c.fillRect(f.side < 0 ? fx - 6 : fx, f.y - 36, 6, 72);
            c.fillStyle = '#fde68a'; for (var cr = 0; cr < 4; cr++) c.fillRect(f.side < 0 ? fx - 14 - cr * 3 : fx + 8 + cr * 3, f.y - 30 + cr * 18, 4 + cr * 2, 3);
          } else {
            var vg = c.createRadialGradient(fx, f.y, 2, fx, f.y, 60);
            vg.addColorStop(0, f.used ? 'rgba(148,163,184,.15)' : 'rgba(125,211,252,.5)'); vg.addColorStop(1, 'rgba(125,211,252,0)');
            c.fillStyle = vg; c.fillRect(fx - 70, f.y - 70, 140, 140);
            c.fillStyle = f.used ? '#64748b' : '#7dd3fc'; c.fillRect(f.side < 0 ? fx - 10 : fx, f.y - 30, 10, 60);
            c.fillStyle = '#0f172a'; for (var gr = 0; gr < 5; gr++) c.fillRect(f.side < 0 ? fx - 10 : fx, f.y - 26 + gr * 12, 10, 4);
            if (!f.used && g.frame % 4 === 0) d.parts.push({ x: fx - f.side * 8, y: f.y + U.rand(-24, 24), vx: -f.side * U.rand(20, 60), vy: U.rand(-40, -10), life: .7, max: .7, col: 'rgba(224,242,254,.6)', sz: U.rand(3, 6), grav: -30 });
          }
        });

        // rocks
        d.rocks.forEach(function (r) {
          c.save(); c.translate(r.x, r.y); c.rotate(r.rot);
          c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.arc(4, 5, r.r, 0, 7); c.fill();
          c.fillStyle = '#3f3a3c'; c.beginPath();
          for (var v = 0; v < 7; v++) { var va = v / 7 * 6.283, vr = r.r * (0.8 + U.hash2(v, 3, Math.round(r.r * 10)) * .3); c.lineTo(Math.cos(va) * vr, Math.sin(va) * vr); }
          c.closePath(); c.fill();
          c.strokeStyle = '#6b6366'; c.lineWidth = 2; c.stroke();
          if (r.hot) { c.strokeStyle = '#f97316'; c.lineWidth = 2; c.beginPath(); c.moveTo(-r.r * .5, -r.r * .2); c.lineTo(0, r.r * .3); c.lineTo(r.r * .5, -r.r * .1); c.stroke(); }
          c.restore();
        });

        // climber
        if (!(p.inv > 0 && Math.floor(t * 18) % 2)) {
          c.save(); c.translate(p.x, p.y);
          var face = p.side !== 0 ? -p.side : p.face;
          c.scale(face, 1);
          var lampG = c.createRadialGradient(6, -22, 2, 6, -22, 60);
          lampG.addColorStop(0, 'rgba(253,230,138,.35)'); lampG.addColorStop(1, 'rgba(253,230,138,0)');
          c.fillStyle = lampG; c.fillRect(-60, -80, 130, 120);
          if (p.side !== 0) {
            // arms reaching back to the wall
            c.strokeStyle = '#fdba74'; c.lineWidth = 4; c.lineCap = 'round';
            c.beginPath(); c.moveTo(-6, -14); c.lineTo(-18, -26 + Math.sin(p.stand * 3) * 2); c.stroke();
            c.beginPath(); c.moveTo(-6, -8); c.lineTo(-18, 4); c.stroke();
          } else {
            c.strokeStyle = '#fdba74'; c.lineWidth = 4; c.lineCap = 'round';
            c.beginPath(); c.moveTo(-6, -14); c.lineTo(-16, -24); c.stroke();
            c.beginPath(); c.moveTo(6, -14); c.lineTo(16, -22); c.stroke();
          }
          c.fillStyle = '#f97316'; U.roundRect(c, -8, -22, 16, 24, 5); c.fill();
          c.fillStyle = '#7c2d12'; c.fillRect(-8, -10, 16, 3);
          c.fillStyle = '#fcd5b5'; c.beginPath(); c.arc(0, -28, 7, 0, 7); c.fill();
          c.fillStyle = '#facc15'; c.beginPath(); c.arc(0, -30, 8, Math.PI, 0); c.fill();
          c.fillStyle = '#fff'; c.beginPath(); c.arc(6, -31, 2.5, 0, 7); c.fill();
          c.fillStyle = '#1c1917'; c.fillRect(2, -28, 2, 2);
          // legs
          c.fillStyle = '#292524';
          if (p.side !== 0) { c.fillRect(-7, 1, 5, 10); c.fillRect(2, 1, 5, 10); }
          else { c.fillRect(-9, 0, 5, 10); c.fillRect(4, -2, 5, 10); }
          c.restore();
        }

        // lava
        var lg = c.createLinearGradient(0, d.lava - 20, 0, d.lava + 260);
        if (d.cool > 0) { lg.addColorStop(0, '#475569'); lg.addColorStop(.2, '#1e293b'); lg.addColorStop(1, '#0f172a'); }
        else { lg.addColorStop(0, '#fde68a'); lg.addColorStop(.18, '#f97316'); lg.addColorStop(.6, '#b91c1c'); lg.addColorStop(1, '#450a0a'); }
        c.fillStyle = lg;
        c.beginPath(); c.moveTo(-10, d.lava + 400);
        for (var lx = -10; lx <= W + 10; lx += 16) c.lineTo(lx, d.lava + Math.sin(lx * .06 + t * 3) * 5 + Math.sin(lx * .13 - t * 5) * 3 - d.glow * 8);
        c.lineTo(W + 10, d.lava + 400); c.closePath(); c.fill();
        if (d.cool > 0) {
          c.strokeStyle = 'rgba(249,115,22,' + (0.4 + Math.sin(t * 8) * .2) + ')'; c.lineWidth = 2;
          for (var ck = 0; ck < 8; ck++) { var kx = ck * 70 + 20; c.beginPath(); c.moveTo(kx, d.lava + 6); c.lineTo(kx + 18, d.lava + 30); c.lineTo(kx + 8, d.lava + 52); c.stroke(); }
        } else {
          c.fillStyle = 'rgba(255,255,255,.35)';
          for (var bb = 0; bb < 6; bb++) { var bx = ((bb * 97 + t * 40) % W), by = d.lava + 30 + ((bb * 53 + t * 30) % 120); c.beginPath(); c.arc(bx, by, 4 + (bb % 3), 0, 7); c.fill(); }
        }
        var lgl = c.createLinearGradient(0, d.lava - 160, 0, d.lava);
        lgl.addColorStop(0, 'rgba(249,115,22,0)'); lgl.addColorStop(1, 'rgba(249,115,22,' + (d.cool > 0 ? .08 : .3 + d.glow * .3) + ')');
        c.fillStyle = lgl; c.fillRect(0, d.lava - 160, W, 160);

        d.parts.forEach(function (q) { c.globalAlpha = Math.max(0, q.life / q.max); c.fillStyle = q.col; c.fillRect(q.x - q.sz / 2, q.y - q.sz / 2, q.sz, q.sz); });
        c.globalAlpha = 1;
        d.pops.forEach(function (q) {
          c.globalAlpha = Math.max(0, q.life / q.max); c.fillStyle = q.col; c.font = '800 14px Outfit, sans-serif'; c.textAlign = 'center';
          c.shadowColor = '#000'; c.shadowBlur = 6; c.fillText(q.text, q.x, q.y); c.shadowBlur = 0;
        });
        c.globalAlpha = 1;
        c.restore();

        // ash
        c.fillStyle = 'rgba(200,190,180,.35)';
        d.ash.forEach(function (a) { c.fillRect(a.x, a.y, 2, 2); });

        // HUD: grip, beat, lava distance
        var gw = 150, gx = 16, gy = H - 34;
        c.fillStyle = 'rgba(12,6,7,.7)'; U.roundRect(c, gx - 6, gy - 22, gw + 12, 46, 8); c.fill();
        c.fillStyle = '#e7e5e4'; c.font = '800 11px Outfit, sans-serif'; c.textAlign = 'left'; c.fillText('GRIP', gx, gy - 8);
        c.fillStyle = 'rgba(255,255,255,.12)'; U.roundRect(c, gx, gy, gw, 12, 6); c.fill();
        c.fillStyle = p.grip < .3 ? (Math.floor(t * 6) % 2 ? '#ef4444' : '#f97316') : '#fbbf24'; U.roundRect(c, gx, gy, gw * U.clamp(p.grip, 0, 1), 12, 6); c.fill();
        var bw = 120, bx0 = W / 2 - bw / 2;
        c.fillStyle = 'rgba(12,6,7,.7)'; U.roundRect(c, bx0 - 8, gy - 22, bw + 16, 46, 8); c.fill();
        c.fillStyle = '#e7e5e4'; c.textAlign = 'center'; c.fillText(d.cool > 0 ? 'FROZEN ' + d.cool.toFixed(1) + 's' : 'SURGE', W / 2, gy - 8);
        c.fillStyle = 'rgba(255,255,255,.12)'; U.roundRect(c, bx0, gy, bw, 12, 6); c.fill();
        var bf = d.cool > 0 ? d.cool / 3.2 : 1 - d.beatT / SURGE_P;
        c.fillStyle = d.cool > 0 ? '#7dd3fc' : bf > .8 ? '#fde68a' : '#ef4444'; U.roundRect(c, bx0, gy, bw * U.clamp(bf, 0, 1), 12, 6); c.fill();
        var dist = Math.max(0, Math.round((d.lava - p.y) / 10));
        c.fillStyle = 'rgba(12,6,7,.7)'; U.roundRect(c, W - 128, gy - 22, 112, 46, 8); c.fill();
        c.fillStyle = dist < 12 ? '#ef4444' : '#e7e5e4'; c.font = '900 18px Outfit, sans-serif'; c.textAlign = 'right'; c.fillText(dist + ' m', W - 24, gy + 10);
        c.font = '800 11px Outfit, sans-serif'; c.fillText('LAVA BELOW', W - 24, gy - 8);

        if (d.msgT > 0) {
          c.globalAlpha = Math.min(1, d.msgT); c.fillStyle = '#fde68a'; c.font = '900 22px Outfit, sans-serif'; c.textAlign = 'center';
          c.shadowColor = '#000'; c.shadowBlur = 10; c.fillText(d.msg, W / 2, 150); c.shadowBlur = 0; c.globalAlpha = 1;
        }
      }
    });
  }

  window.Milo.register({
    id: 'volcano-escape', title: 'Volcano Escape', emo: '🌋', category: 'Action',
    tagline: 'Wall-jump out of the caldera between lava surges',
    description: 'A wall-kick climber. You cling to one side of a winding basalt shaft and every ' +
      'jump kicks you across to the other wall a little higher up; hang on too long and your ' +
      'grip drains until you slide, faster on the red-hot patches. The lava underneath creeps ' +
      'up constantly and surges on a steady beat — a low rumble and an orange flash half a ' +
      'second before each jump — while rocks tumble down the shaft and ricochet off the walls, ' +
      'costing a heart and your hold if one lands on you. Blue vents freeze the lava for three ' +
      'seconds and refill your grip, once each. Height is the score; the shaft narrows and ' +
      'widens, so short hops and long arcs both matter. Tip: jump just after a surge, not just ' +
      'before it — the next beat is the one that will catch you mid-slide.',
    controls: ['Space / ↑ jump', '← → air steer', 'Tap jump'],
    colors: ['#1c1719', '#f97316'],
    tags: ['climbing', 'wall-jump', 'volcano', 'endless', 'action'],
    mount: mount
  });
})();
