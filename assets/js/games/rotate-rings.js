/* Rotate Rings — a painted scene sliced into concentric rings; spin them back into line. */
(function () {
  'use strict';
  var W = 760, H = 600, PS = 470, R = PS / 2, CX = W / 2, CY = 332, MAX_LEVEL = 16;

  /* ---- seeded random ---- */
  function prng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function grad(c, x0, y0, x1, y1, stops) {
    var g = c.createLinearGradient(x0, y0, x1, y1);
    stops.forEach(function (s, i) { g.addColorStop(i / (stops.length - 1), s); });
    return g;
  }
  function tri(c, x1, y1, x2, y2, x3, y3, col) {
    c.fillStyle = col; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineTo(x3, y3); c.closePath(); c.fill();
  }
  function stars(c, r, n, yMax, col) {
    c.fillStyle = col;
    for (var i = 0; i < n; i++) { var s = r() * 1.6 + .4; c.beginPath(); c.arc(r() * PS, r() * yMax, s, 0, 7); c.fill(); }
  }
  function cloud(c, x, y, s, col) {
    c.fillStyle = col;
    [[0, 0, 1], [.9, -.2, .8], [1.7, .1, .9], [.8, .35, .7], [2.4, .3, .6]].forEach(function (b) {
      c.beginPath(); c.arc(x + b[0] * s, y + b[1] * s, b[2] * s, 0, 7); c.fill();
    });
  }
  function hill(c, y, amp, freq, phase, col) {
    c.fillStyle = col; c.beginPath(); c.moveTo(0, PS);
    for (var x = 0; x <= PS; x += 6) c.lineTo(x, y + Math.sin(x * freq + phase) * amp);
    c.lineTo(PS, PS); c.closePath(); c.fill();
  }

  var SCENES = [
    { name: 'Harbour Sunset', paint: function (c, r) {
      c.fillStyle = grad(c, 0, 0, 0, PS, ['#3b1d5e', '#f97316', '#fde68a']); c.fillRect(0, 0, PS, PS);
      c.fillStyle = '#fff7c2'; c.beginPath(); c.arc(PS * (.35 + r() * .3), PS * .48, 46, 0, 7); c.fill();
      cloud(c, PS * .1, PS * .2, 18, 'rgba(255,220,240,.75)'); cloud(c, PS * .6, PS * .12, 14, 'rgba(255,220,240,.65)');
      c.fillStyle = grad(c, 0, PS * .52, 0, PS, ['#6d28d9', '#1e3a8a', '#0f172a']); c.fillRect(0, PS * .52, PS, PS * .48);
      c.strokeStyle = 'rgba(253,230,138,.5)'; c.lineWidth = 3;
      for (var i = 0; i < 9; i++) { var y = PS * .56 + i * 22, w = 30 + i * 28; c.beginPath(); c.moveTo(PS / 2 - w, y); c.lineTo(PS / 2 + w, y); c.stroke(); }
      var bx = PS * (.3 + r() * .4), by = PS * .74;
      tri(c, bx - 70, by, bx + 70, by, bx + 50, by + 28, '#7c2d12'); c.fillStyle = '#7c2d12'; c.fillRect(bx - 70, by, 120, 6);
      c.fillStyle = '#1c1917'; c.fillRect(bx - 3, by - 120, 6, 120);
      tri(c, bx + 3, by - 118, bx + 3, by - 10, bx + 78, by - 10, '#fef3c7'); tri(c, bx - 3, by - 100, bx - 3, by - 10, bx - 60, by - 10, '#fde68a');
      c.strokeStyle = '#1c1917'; c.lineWidth = 2;
      for (var k = 0; k < 4; k++) { var gx = PS * r(), gy = PS * (.15 + r() * .25); c.beginPath(); c.moveTo(gx - 9, gy); c.quadraticCurveTo(gx - 4, gy - 6, gx, gy); c.quadraticCurveTo(gx + 4, gy - 6, gx + 9, gy); c.stroke(); }
    } },
    { name: 'Mountain Night', paint: function (c, r) {
      c.fillStyle = grad(c, 0, 0, 0, PS, ['#020617', '#1e1b4b', '#312e81']); c.fillRect(0, 0, PS, PS);
      stars(c, r, 90, PS * .6, '#e0e7ff');
      c.fillStyle = '#fef9c3'; c.beginPath(); c.arc(PS * .72, PS * .2, 34, 0, 7); c.fill();
      c.fillStyle = '#1e1b4b'; c.beginPath(); c.arc(PS * .72 + 14, PS * .2 - 8, 30, 0, 7); c.fill();
      hill(c, PS * .5, 40, .02, r() * 6, '#334155'); hill(c, PS * .55, 26, .035, r() * 6, '#1e293b');
      c.fillStyle = '#f8fafc';
      for (var i = 0; i < 4; i++) { var px = 40 + i * 120 + r() * 40, py = PS * .5 + Math.sin(px * .02) * 40; tri(c, px, py - 34, px - 22, py - 4, px + 22, py - 4, '#f1f5f9'); }
      hill(c, PS * .72, 14, .03, r() * 6, '#052e16');
      for (var k = 0; k < 7; k++) { var tx = 20 + k * 68 + r() * 30, ty = PS * .74 + r() * 30; tri(c, tx, ty - 70, tx - 24, ty, tx + 24, ty, '#14532d'); tri(c, tx, ty - 90, tx - 18, ty - 40, tx + 18, ty - 40, '#166534'); }
      var hx = PS * (.3 + r() * .4), hy = PS * .82;
      c.fillStyle = '#78350f'; c.fillRect(hx - 40, hy - 40, 80, 40); tri(c, hx - 48, hy - 40, hx + 48, hy - 40, hx, hy - 78, '#7f1d1d');
      c.fillStyle = '#fde047'; c.fillRect(hx - 14, hy - 30, 12, 12); c.fillRect(hx + 4, hy - 30, 12, 12);
      c.fillStyle = '#0c4a6e'; c.fillRect(0, PS * .9, PS, PS * .1);
    } },
    { name: 'Desert Noon', paint: function (c, r) {
      c.fillStyle = grad(c, 0, 0, 0, PS * .6, ['#38bdf8', '#bae6fd', '#fef3c7']); c.fillRect(0, 0, PS, PS);
      c.fillStyle = '#fde047'; c.beginPath(); c.arc(PS * (.2 + r() * .6), PS * .18, 38, 0, 7); c.fill();
      var px = PS * (.3 + r() * .4), py = PS * .6;
      tri(c, px - 130, py, px, py, px - 30, py - 150, '#f59e0b'); tri(c, px, py, px + 110, py, px - 30, py - 150, '#b45309');
      tri(c, px + 90, py, px + 190, py, px + 130, py - 90, '#fbbf24'); tri(c, px + 130, py - 90, px + 190, py, px + 230, py, '#d97706');
      hill(c, PS * .6, 12, .025, r() * 6, '#fcd34d'); hill(c, PS * .72, 18, .02, 2 + r() * 6, '#f59e0b'); hill(c, PS * .86, 14, .03, 4 + r() * 6, '#d97706');
      var cx = PS * (.15 + r() * .7), cy = PS * .88;
      c.fillStyle = '#166534'; c.fillRect(cx - 9, cy - 90, 18, 90); c.fillRect(cx - 34, cy - 60, 12, 30); c.fillRect(cx - 34, cy - 60, 30, 12); c.fillRect(cx + 22, cy - 75, 12, 36); c.fillRect(cx + 4, cy - 75, 30, 12);
      cloud(c, PS * .1, PS * .3, 12, 'rgba(255,255,255,.8)');
    } },
    { name: 'Ringed Planet', paint: function (c, r) {
      c.fillStyle = grad(c, 0, 0, PS, PS, ['#020617', '#1e1b4b', '#0f172a']); c.fillRect(0, 0, PS, PS);
      var neb = c.createRadialGradient(PS * .25, PS * .75, 10, PS * .25, PS * .75, 220); neb.addColorStop(0, 'rgba(236,72,153,.35)'); neb.addColorStop(1, 'rgba(236,72,153,0)');
      c.fillStyle = neb; c.fillRect(0, 0, PS, PS);
      stars(c, r, 140, PS, '#f8fafc');
      var px = PS * (.4 + r() * .2), py = PS * .45;
      var pg = c.createRadialGradient(px - 40, py - 40, 10, px, py, 120); pg.addColorStop(0, '#fdba74'); pg.addColorStop(.6, '#ea580c'); pg.addColorStop(1, '#7c2d12');
      c.fillStyle = pg; c.beginPath(); c.arc(px, py, 110, 0, 7); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 8; for (var b = 0; b < 4; b++) { c.beginPath(); c.arc(px, py, 110, .3 + b * .25, .9 + b * .25); c.stroke(); }
      c.save(); c.translate(px, py); c.rotate(-.35); c.strokeStyle = '#e2e8f0'; c.lineWidth = 14; c.beginPath(); c.ellipse(0, 0, 190, 40, 0, 0, 7); c.stroke();
      c.strokeStyle = '#94a3b8'; c.lineWidth = 6; c.beginPath(); c.ellipse(0, 0, 214, 48, 0, 0, 7); c.stroke(); c.restore();
      c.fillStyle = '#cbd5e1'; c.beginPath(); c.arc(PS * .85, PS * .2, 26, 0, 7); c.fill(); c.fillStyle = '#94a3b8'; c.beginPath(); c.arc(PS * .85 - 8, PS * .2 + 6, 7, 0, 7); c.fill();
      var rx = PS * .18, ry = PS * .3;
      c.save(); c.translate(rx, ry); c.rotate(.6); c.fillStyle = '#f1f5f9'; c.fillRect(-14, -50, 28, 90); tri(c, -14, -50, 14, -50, 0, -80, '#ef4444');
      tri(c, -14, 40, -30, 60, -14, 20, '#ef4444'); tri(c, 14, 40, 30, 60, 14, 20, '#ef4444'); tri(c, -10, 40, 10, 40, 0, 75, '#fbbf24'); c.fillStyle = '#38bdf8'; c.beginPath(); c.arc(0, -20, 8, 0, 7); c.fill(); c.restore();
    } },
    { name: 'Balloon Meadow', paint: function (c, r) {
      c.fillStyle = grad(c, 0, 0, 0, PS, ['#0ea5e9', '#7dd3fc', '#e0f2fe']); c.fillRect(0, 0, PS, PS);
      cloud(c, PS * .05, PS * .22, 16, '#fff'); cloud(c, PS * .55, PS * .1, 13, '#fff');
      var cols = [['#ef4444', '#fde047'], ['#8b5cf6', '#f9a8d4'], ['#22c55e', '#fef08a']];
      for (var i = 0; i < 3; i++) {
        var bx = PS * (.15 + i * .32) + r() * 40, by = PS * (.25 + r() * .2), s = 34 + r() * 14;
        c.fillStyle = cols[i][0]; c.beginPath(); c.ellipse(bx, by, s, s * 1.2, 0, 0, 7); c.fill();
        c.fillStyle = cols[i][1]; c.beginPath(); c.ellipse(bx, by, s * .45, s * 1.2, 0, 0, 7); c.fill();
        c.strokeStyle = '#78350f'; c.lineWidth = 2; c.beginPath(); c.moveTo(bx - s * .5, by + s); c.lineTo(bx - 8, by + s * 1.9); c.moveTo(bx + s * .5, by + s); c.lineTo(bx + 8, by + s * 1.9); c.stroke();
        c.fillStyle = '#92400e'; c.fillRect(bx - 10, by + s * 1.9, 20, 14);
      }
      hill(c, PS * .66, 22, .018, r() * 6, '#65a30d'); hill(c, PS * .78, 18, .024, 2 + r() * 6, '#4d7c0f'); hill(c, PS * .9, 12, .03, 4 + r() * 6, '#3f6212');
      var wx = PS * (.6 + r() * .25), wy = PS * .72;
      tri(c, wx - 18, wy, wx + 18, wy, wx, wy - 80, '#fef3c7'); c.fillStyle = '#b91c1c'; c.beginPath(); c.moveTo(wx - 18, wy); c.lineTo(wx + 18, wy); c.lineTo(wx + 14, wy - 8); c.lineTo(wx - 14, wy - 8); c.fill();
      c.strokeStyle = '#78350f'; c.lineWidth = 5; for (var k = 0; k < 4; k++) { var a = k * Math.PI / 2 + .4; c.beginPath(); c.moveTo(wx, wy - 70); c.lineTo(wx + Math.cos(a) * 46, wy - 70 + Math.sin(a) * 46); c.stroke(); }
    } },
    { name: 'Lighthouse Dusk', paint: function (c, r) {
      c.fillStyle = grad(c, 0, 0, 0, PS, ['#1e1b4b', '#be185d', '#fb923c']); c.fillRect(0, 0, PS, PS);
      stars(c, r, 40, PS * .3, 'rgba(255,255,255,.7)');
      c.fillStyle = grad(c, 0, PS * .62, 0, PS, ['#1d4ed8', '#0c4a6e']); c.fillRect(0, PS * .62, PS, PS * .38);
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2;
      for (var i = 0; i < 7; i++) { var y = PS * .68 + i * 20; c.beginPath(); for (var x = 0; x <= PS; x += 8) c.lineTo(x, y + Math.sin(x * .05 + i) * 4); c.stroke(); }
      var lx = PS * (.25 + r() * .5), ly = PS * .64;
      c.fillStyle = '#44403c'; c.beginPath(); c.moveTo(lx - 120, PS); c.lineTo(lx - 90, ly + 10); c.lineTo(lx + 80, ly); c.lineTo(lx + 130, PS); c.fill();
      c.fillStyle = '#f5f5f4'; c.beginPath(); c.moveTo(lx - 22, ly); c.lineTo(lx + 22, ly); c.lineTo(lx + 16, ly - 150); c.lineTo(lx - 16, ly - 150); c.fill();
      c.fillStyle = '#dc2626'; for (var k = 0; k < 3; k++) c.fillRect(lx - 21 + k * 1.5, ly - 40 - k * 45, 42 - k * 3, 18);
      c.fillStyle = '#1c1917'; c.fillRect(lx - 20, ly - 170, 40, 20); c.fillStyle = '#fde047'; c.fillRect(lx - 12, ly - 168, 24, 16);
      c.fillStyle = 'rgba(253,224,71,.35)'; c.beginPath(); c.moveTo(lx + 12, ly - 160); c.lineTo(PS, ly - 230); c.lineTo(PS, ly - 90); c.fill();
      tri(c, lx - 26, ly - 170, lx + 26, ly - 170, lx, ly - 196, '#7f1d1d');
    } },
    { name: 'City Lights', paint: function (c, r) {
      c.fillStyle = grad(c, 0, 0, 0, PS, ['#0f172a', '#312e81', '#4c1d95']); c.fillRect(0, 0, PS, PS);
      stars(c, r, 60, PS * .5, '#e0e7ff');
      c.fillStyle = '#fef3c7'; c.beginPath(); c.arc(PS * .2 + r() * PS * .5, PS * .18, 30, 0, 7); c.fill();
      var x = 0, k = 0;
      while (x < PS) {
        var w = 40 + r() * 50, h = PS * (.25 + r() * .4), y = PS * .86 - h;
        c.fillStyle = k % 2 ? '#1e293b' : '#0f172a'; c.fillRect(x, y, w, h);
        c.fillStyle = '#fde047';
        for (var wy = y + 12; wy < PS * .84; wy += 18) for (var wx = x + 8; wx < x + w - 10; wx += 16) if (r() < .55) c.fillRect(wx, wy, 8, 10);
        if (r() < .3) { c.fillStyle = '#ef4444'; c.beginPath(); c.arc(x + w / 2, y - 6, 3, 0, 7); c.fill(); c.fillStyle = '#334155'; c.fillRect(x + w / 2 - 1, y - 6, 2, 6); }
        x += w + 6; k++;
      }
      c.fillStyle = '#111827'; c.fillRect(0, PS * .86, PS, PS * .14);
      c.strokeStyle = '#fbbf24'; c.lineWidth = 3; c.setLineDash([16, 14]); c.beginPath(); c.moveTo(0, PS * .93); c.lineTo(PS, PS * .93); c.stroke(); c.setLineDash([]);
      for (var l = 0; l < 4; l++) { var lx = 50 + l * 120; c.fillStyle = '#6b7280'; c.fillRect(lx, PS * .8, 4, 30); c.fillStyle = '#fde68a'; c.beginPath(); c.arc(lx + 2, PS * .8, 6, 0, 7); c.fill(); }
    } }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var lvl = 0, src = null;

    function config(l) {
      return { rings: Math.min(8, 3 + Math.floor(l / 2)), steps: l < 2 ? 12 : l < 4 ? 16 : l < 7 ? 24 : 36 };
    }

    function reset(g) {
      var d = g.data;
      lvl = U.clamp(lvl | 0, 0, MAX_LEVEL - 1);
      var cfg = config(lvl);
      d.scene = SCENES[lvl % SCENES.length];
      src = document.createElement('canvas');
      src.width = PS; src.height = PS;
      d.scene.paint(src.getContext('2d'), prng(1234 + lvl * 977 + Math.floor(Math.random() * 1e6)));
      d.n = cfg.rings; d.steps = cfg.steps;
      d.stepA = Math.PI * 2 / d.steps;
      d.rings = [];
      for (var i = 0; i < d.n; i++) {
        var st = U.randInt(1, d.steps - 1);
        d.rings.push({ outer: R * (d.n - i) / d.n, inner: R * (d.n - i - 1) / d.n, step: st, angle: st * d.stepA, target: st * d.stepA, flash: 0 });
      }
      d.drag = null;
      d.moves = 0; d.time = 0; d.solved = false; d.parts = []; d.glow = 0;
      g.set('Level', (lvl + 1) + '/' + MAX_LEVEL);
      g.set('Rings', d.n);
      g.set('Moves', 0);
      g.set('Score', U.fmt(g.score));
    }
    function ringAt(d, x, y) {
      var dist = Math.hypot(x - CX, y - CY);
      if (dist > R) return -1;
      return Math.min(d.n - 1, Math.floor((R - dist) / (R / d.n)));
    }
    function isSolved(d) {
      for (var i = 0; i < d.rings.length; i++) if (d.rings[i].step % d.steps !== 0) return false;
      return true;
    }
    function solved(g) {
      var d = g.data;
      d.solved = true;
      var earned = Math.max(100, 500 + d.n * 90 - d.moves * 25 - Math.floor(d.time) * 3);
      g.score += earned;
      g.set('Score', U.fmt(g.score));
      Milo.sound.win();
      for (var i = 0; i < 110; i++) {
        var a = U.rand(0, 6.283), sp = U.rand(120, 420);
        d.parts.push({ x: CX + Math.cos(a) * R, y: CY + Math.sin(a) * R, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 100, life: U.rand(.8, 1.6), r: U.rand(3, 7), c: U.choice(['#fde047', '#fb7185', '#38bdf8', '#4ade80', '#fff', '#f472b6']) });
      }
      var last = lvl >= MAX_LEVEL - 1;
      Milo.store.set('rotate-rings:lvl', last ? 0 : lvl + 1);
      setTimeout(function () {
        if (last) {
          g.win({ emo: '🖼️', title: 'Every picture restored!', text: 'All ' + MAX_LEVEL + ' scenes realigned. Last one: ' + d.n + ' rings in ' + d.moves + ' spins and ' + U.time(d.time) + '.', score: g.score });
          return;
        }
        lvl++;
        var nc = config(lvl);
        g.overlay({
          emo: '🖼️', title: d.scene.name + ' restored!',
          text: d.n + ' rings realigned in ' + d.moves + ' spins and ' + U.time(d.time) + ' — worth ' + earned + ' points. Next: ' + nc.rings + ' rings with ' + nc.steps + ' notches.',
          score: g.score, best: g.best, newBest: Milo.store.setBest('rotate-rings', g.score),
          actions: [
            { label: 'Next picture →', primary: true, onClick: function () { next(g); } },
            { label: 'Start over', onClick: function () { lvl = 0; Milo.store.set('rotate-rings:lvl', 0); g.restart(); } }
          ]
        });
      }, 1300);
    }
    function next(g) {
      g.clearOverlay();
      var keep = g.score;
      reset(g);
      g.score = keep;
      g.set('Score', U.fmt(keep));
      g.state = 'play';
      g.best = Milo.store.best('rotate-rings');
    }

    return Milo.arcade(host, {
      id: 'rotate-rings',
      w: W, h: H, bg: '#14100c',
      stats: ['Level', 'Rings', 'Moves', 'Score'],
      emo: '🖼️',
      start: {
        title: 'Rotate Rings',
        text: 'A painted scene has been cut into rings and each ring spun off by some notches. ' +
          'Drag any ring to turn it; it clicks into the nearest notch when you let go. Line ' +
          'every ring up with the fixed corners of the picture. More rings and finer notches ' +
          'each level.',
        keys: ['Drag a ring']
      },
      preload: function () { lvl = U.clamp(Milo.store.get('rotate-rings:lvl', 0) | 0, 0, MAX_LEVEL - 1); },
      init: reset,

      onPointer: function (g, type, x, y) {
        var d = g.data;
        if (g.state !== 'play' || d.solved) return;
        if (type === 'down') {
          var i = ringAt(d, x, y);
          if (i < 0) return;
          var rg = d.rings[i];
          d.drag = { i: i, a0: Math.atan2(y - CY, x - CX), base: rg.angle, step0: rg.step };
          rg.target = rg.angle;
        } else if (type === 'move') {
          if (!d.drag) return;
          var r2 = d.rings[d.drag.i];
          var a = Math.atan2(y - CY, x - CX), da = a - d.drag.a0;
          while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2;
          r2.angle = d.drag.base + da; r2.target = r2.angle;
        } else if (type === 'up') {
          if (!d.drag) return;
          var rr = d.rings[d.drag.i];
          var st = Math.round(rr.angle / d.stepA);
          rr.step = ((st % d.steps) + d.steps) % d.steps;
          rr.target = st * d.stepA;
          if (rr.step !== d.drag.step0) {
            d.moves++; g.set('Moves', d.moves);
            if (rr.step === 0) { rr.flash = 1; Milo.sound.tone({ f: 880, f2: 1320, d: .12, v: .07, type: 'sine' }); }
            else Milo.sound.tone({ f: 300, f2: 240, d: .05, v: .05, type: 'triangle' });
          } else Milo.sound.click();
          d.drag = null;
          if (isSolved(d)) solved(g);
        }
      },

      update: function (g, dt) {
        var d = g.data;
        if (!d.solved) d.time += dt; else d.glow = Math.min(1, d.glow + dt);
        d.rings.forEach(function (r, i) {
          if (!(d.drag && d.drag.i === i)) r.angle += (r.target - r.angle) * Math.min(1, dt * 14);
          if (r.flash > 0) r.flash = Math.max(0, r.flash - dt * 2);
        });
        for (var i = d.parts.length - 1; i >= 0; i--) {
          var p = d.parts[i]; p.vy += 420 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
          if (p.life <= 0) d.parts.splice(i, 1);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createRadialGradient(CX, CY, 100, CX, CY, 600);
        bg.addColorStop(0, '#2a2118'); bg.addColorStop(1, '#0f0b08');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);
        var px = CX - PS / 2, py = CY - PS / 2;
        // frame
        c.fillStyle = '#5b3a1e'; U.roundRect(c, px - 16, py - 16, PS + 32, PS + 32, 8); c.fill();
        c.fillStyle = '#3b2412'; U.roundRect(c, px - 8, py - 8, PS + 16, PS + 16, 4); c.fill();
        c.drawImage(src, px, py);
        // rings (outer to inner), each rotated about the centre
        d.rings.forEach(function (r, i) {
          c.save();
          c.beginPath(); c.arc(CX, CY, r.outer, 0, 7);
          if (r.inner > 0) c.arc(CX, CY, r.inner, 0, 7, true);
          c.clip();
          c.translate(CX, CY); c.rotate(r.angle);
          c.drawImage(src, -PS / 2, -PS / 2);
          c.restore();
          if (d.drag && d.drag.i === i) {
            c.save(); c.beginPath(); c.arc(CX, CY, r.outer, 0, 7); if (r.inner > 0) c.arc(CX, CY, r.inner, 0, 7, true);
            c.fillStyle = 'rgba(255,255,255,.12)'; c.fill('evenodd'); c.restore();
          }
          if (r.flash > 0) {
            c.strokeStyle = 'rgba(253,224,71,' + r.flash + ')'; c.lineWidth = 6;
            c.beginPath(); c.arc(CX, CY, (r.outer + r.inner) / 2, 0, 7); c.stroke();
          }
        });
        // separators
        c.strokeStyle = d.solved ? 'rgba(253,224,71,' + (.5 * d.glow) + ')' : 'rgba(0,0,0,.55)'; c.lineWidth = 2;
        d.rings.forEach(function (r) { c.beginPath(); c.arc(CX, CY, r.outer, 0, 7); c.stroke(); });
        if (d.solved) { c.strokeStyle = 'rgba(253,224,71,' + d.glow + ')'; c.lineWidth = 8; c.beginPath(); c.arc(CX, CY, R + 4, 0, 7); c.stroke(); }
        d.parts.forEach(function (p) { c.globalAlpha = Math.min(1, p.life); c.fillStyle = p.c; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.fill(); });
        c.globalAlpha = 1;
        c.fillStyle = '#e7e5e4'; c.font = '800 18px Outfit, sans-serif'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
        c.fillText(d.scene.name, 22, H - 34);
        c.fillStyle = 'rgba(255,255,255,.45)'; c.font = '600 12px Outfit, sans-serif';
        c.fillText(d.n + ' rings · ' + d.steps + ' notches · drag a ring to spin it · ' + U.time(d.time), 22, H - 14);
      }
    });
  }

  window.Milo.register({
    id: 'rotate-rings', title: 'Rotate Rings', emo: '🖼️', category: 'Puzzle',
    tagline: 'Spin the sliced picture back into one scene',
    description: 'Seven procedurally painted scenes — a harbour sunset, a mountain cabin at ' +
      'night, a ringed planet, balloons over a meadow and more — each freshly drawn, then cut ' +
      'into concentric rings that have been twisted out of line. Drag a ring and it snaps to ' +
      'the nearest notch; a chime tells you when one is home. Levels climb from three rings ' +
      'with 30° notches to eight rings at 10°, where a single notch is a subtle shift. Points ' +
      'drop with every spin and every second, so read the corners before you touch anything.',
    controls: ['Drag a ring'],
    colors: ['#f97316', '#1e3a8a'],
    tags: ['picture', 'rotate', 'spatial', 'brain', 'levels'],
    mount: mount
  });
})();
