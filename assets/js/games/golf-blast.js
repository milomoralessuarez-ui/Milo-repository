/* Golf Blast — one mighty shot per hole; closest to the pin wins. */
(function () {
  'use strict';
  var W = 900, H = 560, BASE = 420, SEG = 8, G = 1100, MAXPULL = 150, R = 8;
  var HOLES = [
    { len: 2000, wind: 2, bunkers: 0, water: false, amp: 26 },
    { len: 2400, wind: 3, bunkers: 1, water: false, amp: 30 },
    { len: 2700, wind: 4, bunkers: 1, water: true, amp: 34 },
    { len: 2300, wind: 5, bunkers: 2, water: false, amp: 44 },
    { len: 3100, wind: 5, bunkers: 1, water: true, amp: 38 },
    { len: 2800, wind: 6, bunkers: 2, water: true, amp: 50 },
    { len: 3400, wind: 6, bunkers: 2, water: false, amp: 54 },
    { len: 3000, wind: 7, bunkers: 3, water: true, amp: 58 },
    { len: 3700, wind: 8, bunkers: 3, water: true, amp: 60 }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function buildHole(d, n) {
      var h = HOLES[n], seed = 101 + n * 17;
      var len = h.len + 700;
      var ter = [], cnt = Math.ceil(len / SEG) + 2;
      d.pinX = 260 + h.len;
      d.teeX = 140;
      for (var i = 0; i < cnt; i++) {
        var x = i * SEG;
        var y = BASE - (U.fbm(x / 700, seed, 3, seed) - .5) * h.amp * 2.6 - Math.sin(x / 900 + seed) * h.amp * .5;
        // Flatten the tee box and the green.
        var tee = U.clamp(1 - Math.abs(x - d.teeX) / 160, 0, 1);
        var grn = U.clamp(1 - Math.abs(x - d.pinX) / 220, 0, 1);
        y = U.lerp(y, BASE - 10, tee * tee);
        y = U.lerp(y, BASE - 30, grn * grn);
        ter.push(y);
      }
      d.ter = ter;
      d.len = len;
      d.zones = [];
      var rng = seed;
      function rnd() { rng = (rng * 9301 + 49297) % 233280; return rng / 233280; }
      for (var b = 0; b < h.bunkers; b++) {
        var bx = d.teeX + 500 + rnd() * (h.len - 900);
        d.zones.push({ kind: 'sand', x0: bx, x1: bx + 120 + rnd() * 140 });
      }
      if (h.water) {
        var wx = d.teeX + 700 + rnd() * (h.len - 1300);
        var w1 = wx + 180 + rnd() * 160;
        d.zones.push({ kind: 'water', x0: wx, x1: w1 });
        for (var k = Math.floor(wx / SEG); k <= Math.ceil(w1 / SEG); k++) {
          var t = U.clamp(Math.min(k * SEG - wx, w1 - k * SEG) / 60, 0, 1);
          ter[k] = Math.max(ter[k], U.lerp(ter[k], BASE + 40, t));
        }
      }
      d.waterY = BASE + 8;
      d.wind = (rnd() < .5 ? -1 : 1) * (1 + Math.round(rnd() * (h.wind - 1)));
      d.trees = [];
      for (var tcount = 0; tcount < 26; tcount++) d.trees.push({ x: rnd() * len, s: .6 + rnd() * .8, p: .5 + rnd() * .2 });
      d.clouds = [];
      for (var cc = 0; cc < 6; cc++) d.clouds.push({ x: rnd() * len, y: 50 + rnd() * 120, s: .7 + rnd() });
    }

    function terY(d, x) {
      var i = x / SEG, i0 = Math.floor(i), t = i - i0;
      if (i0 < 0) return d.ter[0];
      if (i0 >= d.ter.length - 1) return d.ter[d.ter.length - 1];
      return d.ter[i0] * (1 - t) + d.ter[i0 + 1] * t;
    }
    function slope(d, x) { return (terY(d, x + 4) - terY(d, x - 4)) / 8; }
    function zoneAt(d, x) {
      for (var i = 0; i < d.zones.length; i++) if (x >= d.zones[i].x0 && x <= d.zones[i].x1) return d.zones[i].kind;
      return 'grass';
    }

    function startHole(g, n) {
      var d = g.data;
      d.hole = n;
      buildHole(d, n);
      d.ball = { x: d.teeX, y: terY(d, d.teeX) - R, vx: 0, vy: 0, flying: false, done: false, rolling: false, rest: 0 };
      d.phase = 'aim';
      d.drag = null;
      d.trail = [];
      d.camX = 0;
      d.result = null;
      d.resT = 0;
      d.flight = 0;
      g.set('Hole', (n + 1) + '/9');
      g.set('Wind', (d.wind > 0 ? '→ ' : '← ') + Math.abs(d.wind));
    }

    function reset(g) {
      var d = g.data;
      d.parts = [];
      d.floats = [];
      d.shake = 0;
      d.totalYards = 0;
      d.holed = 0;
      startHole(g, 0);
      g.set('Score', 0);
    }

    function burst(d, x, y, col, n, spd) {
      for (var i = 0; i < n; i++) {
        var a = -Math.random() * Math.PI, s = U.rand(30, spd || 200);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(.3, .8), max: .8, col: col });
      }
    }

    function shoot(g) {
      var d = g.data, dr = d.drag;
      if (!dr) return;
      var dx = dr.sx - dr.x, dy = dr.sy - dr.y, m = Math.hypot(dx, dy);
      d.drag = null;
      if (m < 16 || dy > 0) return;
      var pow = Math.min(m, MAXPULL) / MAXPULL;
      var sp = 420 + pow * 900;
      d.ball.vx = dx / m * sp; d.ball.vy = dy / m * sp;
      d.ball.flying = true;
      d.phase = 'fly';
      d.flight = 0;
      d.shake = 7;
      burst(d, d.ball.x, d.ball.y + R, '#86efac', 14, 180);
      Milo.sound.tone({ f: 120, f2: 40, d: .12, v: .12, type: 'square' });
      Milo.sound.noise(.18, .12, 900);
    }

    function finishHole(g, reason) {
      var d = g.data, b = d.ball;
      var pts = 0, label = '', yards = 0;
      if (reason === 'water') { label = 'Splash! 0 pts'; }
      else if (reason === 'hole') { pts = 500; label = 'HOLE IN ONE! +500'; d.holed++; }
      else {
        yards = Math.abs(b.x - d.pinX) / 8;
        pts = Math.max(0, Math.round(300 - yards * 3));
        if (yards <= 5) { pts += 100; label = 'Gimme! ' + yards.toFixed(1) + ' yd  +' + pts; }
        else label = yards.toFixed(1) + ' yd from the pin  +' + pts;
      }
      g.score += pts;
      g.set('Score', U.fmt(g.score));
      d.result = { text: label, pts: pts };
      d.resT = 2;
      d.phase = 'result';
      b.done = true;
      if (reason === 'hole') { Milo.sound.win(); d.shake = 10; }
      else if (pts >= 200) Milo.sound.powerup();
      else if (reason === 'water') Milo.sound.lose();
      else Milo.sound.tone({ f: 500, f2: 380, d: .15, v: .08, type: 'triangle' });
    }

    function stepBall(g, d, dt) {
      var b = d.ball;
      var kind = zoneAt(d, b.x);
      b.vy += G * dt;
      b.vx += d.wind * 20 * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      var ty = terY(d, b.x);
      if (kind === 'water' && b.y > d.waterY - R) {
        burst(d, b.x, d.waterY, '#7dd3fc', 22, 260);
        Milo.sound.noise(.3, .18, 600);
        finishHole(g, 'water');
        return;
      }
      if (b.y + R > ty) {
        var s = slope(d, b.x);
        var nl = Math.hypot(s, 1), nx = s / nl, ny = -1 / nl;
        var vn = b.vx * nx + b.vy * ny;
        b.y = ty - R;
        var bounce = kind === 'sand' ? .12 : .42, fr = kind === 'sand' ? .45 : .86;
        if (vn < 0) {
          // split into normal / tangent, reflect normal, damp tangent
          var tx = -ny, tyv = nx, vt = b.vx * tx + b.vy * tyv;
          vn = -vn * bounce; vt *= fr;
          b.vx = vn * nx + vt * tx; b.vy = vn * ny + vt * tyv;
          if (Math.abs(vn) > 90) {
            burst(d, b.x, ty, kind === 'sand' ? '#fcd34d' : '#86efac', 8, 160);
            Milo.sound.tone({ f: 260, f2: 160, d: .07, v: .06, type: 'triangle' });
          }
          if (Math.abs(vn) < 40) b.rolling = true;
        }
        if (b.rolling) {
          // roll along slope with friction
          var roll = kind === 'sand' ? 5 : .9;
          b.vx += s * 380 * dt;
          b.vx *= Math.max(0, 1 - roll * dt);
          b.vy = 0;
          b.y = ty - R;
        }
      } else if (b.rolling && b.y + R < ty - 2) {
        b.rolling = false;
      }
      // pin
      if (Math.abs(b.x - d.pinX) < 11 && b.y + R > terY(d, d.pinX) - 6 && Math.hypot(b.vx, b.vy) < 260) {
        burst(d, d.pinX, terY(d, d.pinX), '#fde68a', 30, 300);
        finishHole(g, 'hole');
        return;
      }
      var sp = Math.hypot(b.vx, b.vy);
      if (b.rolling && sp < 7) b.rest += dt; else b.rest = 0;
      if (b.rest > .4 || b.x > d.len - 20 || b.x < 0) finishHole(g, 'stop');
    }

    return Milo.arcade(host, {
      id: 'golf-blast',
      w: W, h: H, bg: '#7dd3fc',
      stats: ['Score', 'Hole', 'Wind'],
      emo: '⛳',
      start: {
        title: 'Golf Blast',
        text: 'One shot per hole. Drag back from anywhere to aim — the further you pull, the harder ' +
          'you hit. Wind pushes the ball the whole way, sand kills your roll and water swallows ' +
          'the ball outright. Closest to the pin scores; drop it in the cup for 500.',
        keys: ['Drag back and release', 'Watch the wind arrow']
      },
      init: reset,
      onPointer: function (g, type, x, y) {
        var d = g.data;
        if (g.state !== 'play' || d.phase !== 'aim') return;
        if (type === 'down') d.drag = { sx: x, sy: y, x: x, y: y };
        else if (type === 'move' && d.drag) { d.drag.x = x; d.drag.y = y; }
        else if (type === 'up' && d.drag) shoot(g);
      },

      update: function (g, dt) {
        var d = g.data;
        if (d.shake > 0) d.shake = Math.max(0, d.shake - dt * 30);
        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 600 * dt; p.life -= dt; return p.life > 0;
        });
        d.clouds.forEach(function (cl) { cl.x += 8 * d.wind * dt; });

        if (d.phase === 'fly') {
          d.flight += dt;
          var steps = 3, sdt = dt / steps;
          for (var s = 0; s < steps && d.phase === 'fly'; s++) stepBall(g, d, sdt);
          d.trail.push({ x: d.ball.x, y: d.ball.y });
          if (d.trail.length > 70) d.trail.shift();
        } else if (d.phase === 'result') {
          d.resT -= dt;
          if (d.resT <= 0) {
            if (d.hole + 1 >= HOLES.length) {
              g.gameOver({
                emo: '⛳', title: 'Round complete',
                text: 'Nine holes, ' + U.fmt(g.score) + ' points' + (d.holed ? ', ' + d.holed + ' holed out' : '') +
                  '. Perfect is 4,500.',
                score: g.score
              });
            } else startHole(g, d.hole + 1);
          }
        }
        // camera
        var want = d.phase === 'aim' ? d.ball.x - 180 : d.ball.x - W * .45;
        want = U.clamp(want, 0, d.len - W);
        d.camX += (want - d.camX) * Math.min(1, dt * (d.phase === 'fly' ? 10 : 4));
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#38bdf8'); sky.addColorStop(.6, '#bae6fd'); sky.addColorStop(1, '#ecfeff');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);
        c.fillStyle = '#fef3c7';
        c.beginPath(); c.arc(W - 120 - d.camX * .02, 90, 44, 0, 7); c.fill();

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        // clouds
        c.fillStyle = 'rgba(255,255,255,.85)';
        d.clouds.forEach(function (cl) {
          var x = ((cl.x - d.camX * .2) % (d.len + 300) + d.len + 300) % (d.len + 300) - 150;
          if (x < -200 || x > W + 200) return;
          c.beginPath();
          c.arc(x, cl.y, 24 * cl.s, 0, 7); c.arc(x + 26 * cl.s, cl.y + 6, 19 * cl.s, 0, 7); c.arc(x - 24 * cl.s, cl.y + 7, 16 * cl.s, 0, 7);
          c.fill();
        });
        // distant trees
        d.trees.forEach(function (t) {
          var x = t.x - d.camX * t.p;
          if (x < -40 || x > W + 40) return;
          var gy = terY(d, t.x) - 60 * t.s;
          c.fillStyle = '#4d7c0f';
          c.beginPath(); c.moveTo(x, gy - 46 * t.s); c.lineTo(x + 20 * t.s, gy + 10); c.lineTo(x - 20 * t.s, gy + 10); c.closePath(); c.fill();
          c.fillStyle = '#3f6212';
          c.beginPath(); c.moveTo(x, gy - 20 * t.s); c.lineTo(x + 24 * t.s, gy + 30); c.lineTo(x - 24 * t.s, gy + 30); c.closePath(); c.fill();
        });

        c.translate(-d.camX, 0);
        // terrain
        var x0 = Math.max(0, Math.floor(d.camX / SEG) - 1), x1 = Math.min(d.ter.length - 1, Math.ceil((d.camX + W) / SEG) + 1);
        c.fillStyle = '#4ade80';
        c.beginPath(); c.moveTo(x0 * SEG, H);
        for (var i = x0; i <= x1; i++) c.lineTo(i * SEG, d.ter[i]);
        c.lineTo(x1 * SEG, H); c.closePath(); c.fill();
        c.fillStyle = '#16a34a';
        c.beginPath(); c.moveTo(x0 * SEG, H);
        for (i = x0; i <= x1; i++) c.lineTo(i * SEG, d.ter[i] + 14);
        c.lineTo(x1 * SEG, H); c.closePath(); c.fill();
        // green + zones
        d.zones.forEach(function (z) {
          if (z.x1 < d.camX - 50 || z.x0 > d.camX + W + 50) return;
          c.fillStyle = z.kind === 'sand' ? '#fcd34d' : '#0ea5e9';
          c.beginPath();
          var a = Math.floor(z.x0 / SEG), bI = Math.ceil(z.x1 / SEG);
          c.moveTo(a * SEG, d.ter[a] + 30);
          for (var k = a; k <= bI; k++) c.lineTo(k * SEG, z.kind === 'water' ? Math.max(d.ter[k], d.waterY) : d.ter[k] - 1);
          c.lineTo(bI * SEG, d.ter[bI] + 30); c.closePath(); c.fill();
          if (z.kind === 'water') {
            c.fillStyle = '#38bdf8';
            c.fillRect(z.x0, d.waterY, z.x1 - z.x0, 4);
            c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2;
            for (var wv = z.x0 + 20; wv < z.x1 - 20; wv += 46) {
              c.beginPath(); c.arc(wv + Math.sin(g.t * 2 + wv) * 4, d.waterY + 14, 8, Math.PI, 0); c.stroke();
            }
          }
        });
        var gx = d.pinX;
        c.fillStyle = '#86efac';
        c.beginPath();
        var ga = Math.floor((gx - 200) / SEG), gb = Math.ceil((gx + 200) / SEG);
        c.moveTo(ga * SEG, d.ter[ga] + 6);
        for (var q = ga; q <= gb; q++) c.lineTo(q * SEG, d.ter[q] - 1);
        c.lineTo(gb * SEG, d.ter[gb] + 6); c.closePath(); c.fill();
        // cup + flag
        var py = terY(d, gx);
        c.fillStyle = '#14532d';
        c.fillRect(gx - 9, py - 2, 18, 10);
        c.strokeStyle = '#f8fafc'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(gx, py); c.lineTo(gx, py - 70); c.stroke();
        c.fillStyle = '#ef4444';
        var flap = Math.sin(g.t * 6) * 4 * Math.sign(d.wind || 1);
        c.beginPath(); c.moveTo(gx, py - 70); c.lineTo(gx + 30 * Math.sign(d.wind || 1), py - 60 + flap); c.lineTo(gx, py - 48); c.closePath(); c.fill();
        // tee marker
        c.fillStyle = '#fff';
        c.fillRect(d.teeX - 30, terY(d, d.teeX - 30) - 8, 5, 8);
        c.fillRect(d.teeX + 30, terY(d, d.teeX + 30) - 8, 5, 8);

        // trail
        if (d.trail.length > 1) {
          c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2; c.setLineDash([4, 6]);
          c.beginPath(); d.trail.forEach(function (p, k) { if (k) c.lineTo(p.x, p.y); else c.moveTo(p.x, p.y); }); c.stroke();
          c.setLineDash([]);
        }
        // ball
        var b = d.ball;
        c.fillStyle = 'rgba(0,0,0,.2)';
        c.beginPath(); c.ellipse(b.x, terY(d, b.x) + 2, R * .9, 3, 0, 0, 7); c.fill();
        c.fillStyle = '#fff';
        c.shadowColor = 'rgba(0,0,0,.3)'; c.shadowBlur = 4;
        c.beginPath(); c.arc(b.x, b.y, R, 0, 7); c.fill();
        c.shadowBlur = 0;
        c.fillStyle = 'rgba(0,0,0,.12)';
        c.beginPath(); c.arc(b.x + 2, b.y + 2, R * .6, 0, 7); c.fill();

        // aim
        if (d.phase === 'aim' && d.drag) {
          var dr = d.drag, dx = dr.sx - dr.x, dy = dr.sy - dr.y, m = Math.hypot(dx, dy);
          if (m > 16 && dy < 0) {
            var pow = Math.min(m, MAXPULL) / MAXPULL, sp = 420 + pow * 900;
            var vx = dx / m * sp, vy = dy / m * sp, px = b.x, pyy = b.y;
            c.fillStyle = 'rgba(255,255,255,.9)';
            for (var k = 0; k < 16; k++) {
              vy += G * .05; px += vx * .05; pyy += vy * .05;
              if (pyy + R > terY(d, px)) break;
              c.beginPath(); c.arc(px, pyy, 3.5 - k * .12, 0, 7); c.fill();
            }
            c.strokeStyle = pow > .9 ? '#ef4444' : pow > .6 ? '#f59e0b' : '#22c55e'; c.lineWidth = 5; c.lineCap = 'round';
            c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(b.x + dx / m * (20 + pow * 60), b.y + dy / m * (20 + pow * 60)); c.stroke();
          }
        }
        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max); c.fillStyle = p.col;
          c.beginPath(); c.arc(p.x, p.y, 3, 0, 7); c.fill();
        });
        c.globalAlpha = 1;
        c.restore();

        // HUD: wind + minimap
        c.fillStyle = 'rgba(0,0,0,.35)';
        U.roundRect(c, W / 2 - 200, 56, 400, 22, 11); c.fill();
        var mapX = function (x) { return W / 2 - 190 + x / d.len * 380; };
        c.fillStyle = '#4ade80'; c.fillRect(mapX(0), 63, 380, 8);
        d.zones.forEach(function (z) {
          c.fillStyle = z.kind === 'sand' ? '#fcd34d' : '#0ea5e9';
          c.fillRect(mapX(z.x0), 63, Math.max(2, mapX(z.x1) - mapX(z.x0)), 8);
        });
        c.fillStyle = '#ef4444'; c.fillRect(mapX(d.pinX) - 1, 58, 2, 18);
        c.fillStyle = '#fff'; c.beginPath(); c.arc(mapX(b.x), 67, 4, 0, 7); c.fill();

        c.fillStyle = 'rgba(0,0,0,.35)';
        U.roundRect(c, 20, 56, 150, 44, 10); c.fill();
        c.fillStyle = '#fff'; c.font = '700 14px Outfit, sans-serif'; c.textAlign = 'left';
        c.fillText('Wind', 32, 74);
        var wcol = Math.abs(d.wind) >= 5 ? '#fca5a5' : '#e0f2fe';
        c.fillStyle = wcol;
        c.font = '800 16px Outfit, sans-serif';
        var arrows = '';
        for (var w = 0; w < Math.abs(d.wind); w++) arrows += d.wind > 0 ? '›' : '‹';
        c.fillText(arrows, 32, 93);
        c.textAlign = 'right';
        c.fillText(Math.abs(d.wind) + ' mph', 158, 93);

        if (d.phase === 'aim' && !d.drag) {
          c.fillStyle = 'rgba(0,0,0,.4)';
          U.roundRect(c, W / 2 - 150, H - 60, 300, 34, 17); c.fill();
          c.fillStyle = '#fff'; c.font = '600 15px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText('Hole ' + (d.hole + 1) + ' · ' + Math.round(HOLES[d.hole].len / 8) + ' yd · drag back to swing', W / 2, H - 37);
        }
        if (d.phase === 'result' && d.result) {
          c.fillStyle = 'rgba(0,0,0,.5)';
          c.fillRect(0, H / 2 - 40, W, 80);
          c.fillStyle = d.result.pts >= 300 ? '#fde68a' : '#fff';
          c.font = '800 28px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText(d.result.text, W / 2, H / 2 + 10);
        }
      }
    });
  }

  window.Milo.register({
    id: 'golf-blast', title: 'Golf Blast', emo: '⛳', category: 'Casual',
    tagline: 'Nine holes, one huge shot each',
    description: 'Every hole is a long side-view fairway and you get exactly one swing on it. Drag ' +
      'back to set angle and power (the dotted arc only shows the first half-second — after that the ' +
      'wind takes over), then watch the ball bounce and roll on the actual slopes. Points are 300 minus ' +
      'three per yard from the pin, a gimme inside five yards adds 100, holing out is a flat 500, and ' +
      'water is zero. Later holes get longer with stronger wind and more bunkers. Tip: land short of ' +
      'the green on a downslope and let the roll do the last forty yards.',
    controls: ['Drag back and release', 'Touch'],
    colors: ['#38bdf8', '#4ade80'],
    tags: ['golf', 'physics', 'aiming', 'wind', 'sports'],
    mount: mount
  });
})();
