/* The Floor Is Lava — living-room parkour while the lava below rises in surges. */
(function () {
  'use strict';
  var W = 480, H = 720, WALL = 22;
  var PW = 22, PH = 32;
  var JUMP_V = -620, G_RISE = 1650, G_CUT = 3500, G_FALL = 2250, MAXFALL = 900;
  var COYOTE = .1, BUFFER = .12, RUN = 250;

  // Furniture types: width range, height of the drawn body, whether it is bouncy.
  var FURN = [
    { kind: 'sofa', w: [140, 170], body: 44, bouncy: true, min: 0 },
    { kind: 'table', w: [110, 140], body: 30, min: 0 },
    { kind: 'chair', w: [64, 80], body: 46, min: 0 },
    { kind: 'shelf', w: [90, 120], body: 130, min: 100 },
    { kind: 'tv', w: [100, 120], body: 34, min: 150 },
    { kind: 'lamp', w: [40, 48], body: 90, min: 250, wobbly: true },
    { kind: 'bed', w: [150, 180], body: 40, bouncy: true, min: 300 },
    { kind: 'piano', w: [120, 140], body: 70, min: 500 },
    { kind: 'stool', w: [36, 46], body: 36, min: 650 }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.p = { x: W / 2, y: H - 100 - PH, vx: 0, vy: 0, ground: null, coyote: 0, buffer: 0, face: 1, squash: 1 };
      d.furn = [{ kind: 'rug', x: WALL, y: H - 100, w: W - WALL * 2, body: 12, base: true }];
      d.cushions = [];
      d.nextY = H - 190;
      d.lastX = W / 2;
      d.camY = 0;
      d.height = 0;
      d.cushionCount = 0;
      d.lavaY = H + 120;
      d.lava = { phase: 'calm', t: U.rand(5, 7) };
      d.surges = 0;
      d.parts = [];
      d.texts = [];
      d.embers = [];
      d.shake = 0;
      d.over = false;
      d.lean = 0;
      d.frames = [];
      for (var i = 0; i < 14; i++) d.frames.push({ x: U.rand(WALL + 30, W - WALL - 60), y: -i * 260 - U.rand(0, 200), w: U.rand(34, 60), h: U.rand(40, 70), hue: U.randInt(0, 4) });
      seed(d);
      g.set('Score', 0);
      g.set('Height', '0m');
      g.set('Cushions', 0);
      g.set('Best', g.best ? U.fmt(g.best) : '—');
    }

    function seed(d) {
      while (d.nextY > d.camY - 400) {
        var diff = Math.min(1, d.height / 700);
        var pool = FURN.filter(function (f) { return d.height >= f.min; });
        var f = U.choice(pool);
        var w = U.rand(f.w[0], f.w[1]) - diff * 18;
        var reach = 130 + (1 - diff) * 60;
        var cx = U.clamp(d.lastX + U.rand(-reach, reach), WALL + w / 2 + 4, W - WALL - w / 2 - 4);
        var item = { kind: f.kind, x: cx - w / 2, y: d.nextY, w: w, body: f.body, bouncy: !!f.bouncy, wobbly: !!f.wobbly, t: Math.random() * 7, tone: U.randInt(0, 2) };
        d.furn.push(item);
        if (Math.random() < .45) d.cushions.push({ x: cx + U.rand(-w * .3, w * .3), y: d.nextY - 16, got: false, hue: U.randInt(0, 3) });
        d.lastX = cx;
        d.nextY -= U.rand(78, 104) + diff * 22;
      }
    }

    function burst(d, x, y, col, n, spd, up) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2, s = U.rand(20, spd);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (up || 0), life: U.rand(.3, .6), max: .6, col: col, r: U.rand(2, 4) });
      }
    }

    function die(g, why) {
      var d = g.data;
      if (d.over) return;
      d.over = true;
      d.shake = 10;
      burst(d, d.p.x, d.p.y + PH, '#ff7a3d', 30, 280, 160);
      burst(d, d.p.x, d.p.y + PH, '#ffd166', 16, 200, 200);
      Milo.sound.explode();
      g.gameOver({ emo: '🌋', title: why, text: 'You climbed ' + U.fmt(d.height) + 'm and grabbed ' + d.cushionCount + ' cushions through ' + d.surges + ' surges.', score: g.score });
    }

    return Milo.arcade(host, {
      id: 'floor-is-lava',
      w: W, h: H, bg: '#2a1810',
      stats: ['Score', 'Height', 'Cushions', 'Best'],
      touch: 'dpad',
      touchButtons: [{ key: 'action', label: 'JUMP' }],
      emo: '🛋️',
      start: {
        title: 'The Floor Is Lava',
        text: 'Climb the furniture. The lava creeps up all the time, and every so often the ' +
          'room rumbles — that is your warning that a surge is about to shoot it upward. ' +
          'Sofas and beds bounce you higher, lamps wobble, and cushions are worth 15 each.',
        keys: ['← → move', 'Space / ↑ jump', 'Tap release for a short hop']
      },
      init: reset,
      onPointer: function (g, type, x, y) {
        var d = g.data;
        if (type === 'up') { d.lean = 0; return; }
        if (type === 'down' && y < H * .45) { d.tapJump = true; return; }
        d.lean = x < W / 2 ? -1 : 1;
      },

      update: function (g, dt) {
        var d = g.data, p = d.p, inp = g.input, i;
        d.shake = Math.max(0, d.shake - dt * 30);
        for (i = d.parts.length - 1; i >= 0; i--) {
          var pt = d.parts[i];
          pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 500 * dt; pt.life -= dt;
          if (pt.life <= 0) d.parts.splice(i, 1);
        }
        for (i = d.texts.length - 1; i >= 0; i--) { d.texts[i].y -= 40 * dt; d.texts[i].life -= dt; if (d.texts[i].life <= 0) d.texts.splice(i, 1); }
        // embers rise off the lava
        if (Math.random() < dt * 12) d.embers.push({ x: U.rand(WALL, W - WALL), y: d.lavaY, vy: -U.rand(40, 110), life: U.rand(.8, 1.6), max: 1.6 });
        for (i = d.embers.length - 1; i >= 0; i--) {
          var e = d.embers[i];
          e.y += e.vy * dt; e.x += Math.sin(g.t * 5 + i) * 20 * dt; e.life -= dt;
          if (e.life <= 0) d.embers.splice(i, 1);
        }
        d.furn.forEach(function (f) { f.t += dt; });

        // --- the lava's moods ------------------------------------------------------------
        var diff = Math.min(1, d.height / 700);
        var L = d.lava;
        L.t -= dt;
        var rise = 14 + diff * 18;
        if (L.phase === 'calm') {
          if (L.t <= 0) { L.phase = 'rumble'; L.t = 1.3; Milo.sound.noise(1.2, .1, 200); Milo.sound.tone({ f: 60, f2: 45, d: 1.2, v: .1, type: 'sawtooth' }); }
        } else if (L.phase === 'rumble') {
          d.shake = Math.max(d.shake, 3 + (1.3 - L.t) * 3);
          if (L.t <= 0) { L.phase = 'surge'; L.t = .9 + diff * .3; d.surges++; Milo.sound.tone({ f: 120, f2: 320, d: .5, v: .12, type: 'sawtooth' }); }
        } else if (L.phase === 'surge') {
          rise = 260 + diff * 160;
          d.shake = Math.max(d.shake, 5);
          if (L.t <= 0) { L.phase = 'calm'; L.t = U.rand(4.5, 7) - diff * 2.5; }
        }
        if (!d.over) {
          d.lavaY -= rise * dt;
          // never let the lava fall too far behind the camera, so it always threatens
          if (d.lavaY > d.camY + H + 140) d.lavaY = d.camY + H + 140;
        }
        if (d.over) return;

        // --- input & jump feel -----------------------------------------------------------
        var move = (inp.down('right') ? 1 : 0) - (inp.down('left') ? 1 : 0);
        if (!move && d.lean) move = d.lean;
        var jumpPressed = inp.pressed('action') || inp.pressed('up') || inp.pressed('a') || d.tapJump;
        var jumpHeld = inp.down('action') || inp.down('up') || inp.down('a') || inp.pdown;
        d.tapJump = false;
        if (move) p.face = move;
        var accel = p.ground ? 2800 : 1500;
        if (move) p.vx += (move * RUN - p.vx) * Math.min(1, accel / RUN * dt);
        else p.vx *= Math.pow(p.ground ? .0005 : .1, dt);
        if (Math.abs(p.vx) < 1) p.vx = 0;

        p.coyote = p.ground ? COYOTE : p.coyote - dt;
        p.buffer = jumpPressed ? BUFFER : p.buffer - dt;
        if (p.buffer > 0 && p.coyote > 0) {
          var bouncy = p.ground && p.ground.bouncy;
          p.vy = bouncy ? JUMP_V * 1.28 : JUMP_V;
          p.coyote = 0; p.buffer = 0; p.ground = null; p.squash = .72;
          burst(d, p.x, p.y + PH, bouncy ? '#ffb4c8' : '#d9c7a8', bouncy ? 10 : 5, 70, 30);
          Milo.sound.tone({ f: bouncy ? 260 : 330, f2: bouncy ? 900 : 760, d: bouncy ? .16 : .1, v: .07, type: 'square' });
          if (bouncy) d.texts.push({ x: p.x, y: p.y - 10, s: 'BOING', col: '#ff8fb1', life: .8 });
        }
        var grav = p.vy < 0 ? (jumpHeld ? G_RISE : G_CUT) : G_FALL;
        if (Math.abs(p.vy) < 80 && !p.ground) grav *= .55;
        p.vy = Math.min(p.vy + grav * dt, MAXFALL);

        var prevBottom = p.y + PH;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x - PW / 2 < WALL) { p.x = WALL + PW / 2; if (p.vx < 0) p.vx = 0; }
        if (p.x + PW / 2 > W - WALL) { p.x = W - WALL - PW / 2; if (p.vx > 0) p.vx = 0; }

        // one-way furniture tops
        var landed = null;
        if (p.vy >= 0) {
          for (i = 0; i < d.furn.length; i++) {
            var f = d.furn[i];
            var fx = f.x + (f.wobbly ? Math.sin(f.t * 2.2) * 10 : 0);
            if (p.x + PW / 2 - 4 < fx || p.x - PW / 2 + 4 > fx + f.w) continue;
            if (prevBottom <= f.y + .5 && p.y + PH >= f.y) { landed = f; break; }
          }
        }
        if (landed) {
          if (!p.ground) {
            p.squash = p.vy > 650 ? 1.42 : 1.18;
            burst(d, p.x, landed.y, '#d9c7a8', 5, 60, 30);
            Milo.sound.tone({ f: landed.bouncy ? 180 : 210, f2: 120, d: .06, v: .04, type: 'triangle' });
          }
          p.y = landed.y - PH; p.vy = 0; p.ground = landed;
        } else if (p.ground) {
          var G = p.ground, gx = G.x + (G.wobbly ? Math.sin(G.t * 2.2) * 10 : 0);
          if (p.x + PW / 2 - 4 < gx || p.x - PW / 2 + 4 > gx + G.w || p.vy < 0) p.ground = null;
          else { p.y = G.y - PH; p.vy = 0; }
        }
        if (p.ground && p.ground.wobbly) p.x += Math.cos(p.ground.t * 2.2) * 2.2 * 10 * dt;
        p.squash += (1 - p.squash) * Math.min(1, dt * 12);

        // --- cushions -----------------------------------------------------------------------
        for (i = 0; i < d.cushions.length; i++) {
          var cu = d.cushions[i];
          if (cu.got) continue;
          if (Math.abs(cu.x - p.x) < 24 && Math.abs(cu.y - (p.y + PH / 2)) < 30) {
            cu.got = true; d.cushionCount++;
            burst(d, cu.x, cu.y, ['#ff8fb1', '#7fd3ff', '#ffe36b', '#9fe88a'][cu.hue], 12, 140, 60);
            d.texts.push({ x: cu.x, y: cu.y - 10, s: '+15', col: '#ffe36b', life: 1 });
            g.set('Cushions', d.cushionCount);
            Milo.sound.coin();
          }
        }

        // --- camera / height ----------------------------------------------------------------
        var target = p.y - H * .55;
        if (target < d.camY) d.camY = target;
        var h = Math.max(0, Math.floor((H - 100 - PH - p.y) / 10));
        if (h > d.height) { d.height = h; g.set('Height', U.fmt(h) + 'm'); }
        g.score = d.height + d.cushionCount * 15;
        g.set('Score', U.fmt(g.score));

        if (p.y + PH > d.lavaY + 6) { die(g, 'The lava got you'); return; }

        seed(d);
        d.furn = d.furn.filter(function (f) { return f.y < d.camY + H + 260; });
        d.cushions = d.cushions.filter(function (c) { return c.y < d.camY + H + 100; });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, p = d.p, cam = d.camY;
        var glow = d.lava.phase === 'surge' ? .25 : d.lava.phase === 'rumble' ? .12 : 0;
        // wallpaper
        c.fillStyle = '#f0dcc0';
        c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(180,120,90,.18)';
        for (var sx = 0; sx < W; sx += 28) c.fillRect(sx, 0, 12, H);
        var py0 = ((-cam * .5) % 90 + 90) % 90;
        c.fillStyle = 'rgba(160,90,70,.12)';
        for (var yy = py0 - 90; yy < H; yy += 90) {
          for (sx = 14; sx < W; sx += 56) { c.beginPath(); c.arc(sx, yy, 5, 0, 7); c.fill(); }
        }

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));
        c.translate(0, -cam);

        // picture frames on the wall
        d.frames.forEach(function (fr) {
          var fy = fr.y - cam * .3 + cam;
          if (fy < cam - 100 || fy > cam + H + 20) return;
          c.fillStyle = '#7a4a2a';
          c.fillRect(fr.x, fy, fr.w, fr.h);
          c.fillStyle = ['#8fb8d8', '#d8b08f', '#9fd39a', '#d89fc0', '#e8d090'][fr.hue];
          c.fillRect(fr.x + 5, fy + 5, fr.w - 10, fr.h - 10);
          c.fillStyle = 'rgba(0,0,0,.25)';
          c.beginPath(); c.arc(fr.x + fr.w / 2, fy + fr.h / 2 + 4, Math.min(fr.w, fr.h) * .22, 0, 7); c.fill();
        });

        // skirting walls
        c.fillStyle = '#b48a62';
        c.fillRect(0, cam - 10, WALL, H + 20); c.fillRect(W - WALL, cam - 10, WALL, H + 20);
        c.fillStyle = 'rgba(255,255,255,.25)';
        c.fillRect(WALL - 4, cam - 10, 4, H + 20); c.fillRect(W - WALL, cam - 10, 4, H + 20);

        d.furn.forEach(function (f) {
          if (f.y < cam - 160 || f.y > cam + H + 40) return;
          var x = f.x + (f.wobbly ? Math.sin(f.t * 2.2) * 10 : 0), y = f.y, w = f.w;
          if (f.kind === 'rug') {
            c.fillStyle = '#8a3b3b'; U.roundRect(c, x, y, w, 140, 4); c.fill();
            c.fillStyle = '#c95c4a'; U.roundRect(c, x + 10, y + 8, w - 20, 120, 4); c.fill();
            c.fillStyle = '#ffd9a0';
            for (var rx = x + 20; rx < x + w - 20; rx += 26) c.fillRect(rx, y + 60, 12, 12);
          } else if (f.kind === 'sofa') {
            var col = ['#4a6fb5', '#b54a6f', '#5a9a5a'][f.tone];
            c.fillStyle = U.shade(col, -.25); U.roundRect(c, x - 6, y - 26, 16, 70, 8); c.fill(); U.roundRect(c, x + w - 10, y - 26, 16, 70, 8); c.fill();
            c.fillStyle = col; U.roundRect(c, x, y, w, f.body, 10); c.fill();
            c.fillStyle = U.shade(col, .18);
            for (var k = 0; k < 3; k++) U.roundRect(c, x + 8 + k * (w - 16) / 3, y + 3, (w - 16) / 3 - 6, 18, 6), c.fill();
            c.fillStyle = '#3a2a1a'; c.fillRect(x + 8, y + f.body, 8, 10); c.fillRect(x + w - 16, y + f.body, 8, 10);
          } else if (f.kind === 'bed') {
            c.fillStyle = '#7a4a2a'; c.fillRect(x - 4, y - 40, 10, 84);
            c.fillStyle = '#f4f0e6'; U.roundRect(c, x, y, w, f.body, 8); c.fill();
            c.fillStyle = ['#e06070', '#6090e0', '#70c080'][f.tone]; U.roundRect(c, x + w * .35, y + 6, w * .65 - 6, f.body - 12, 6); c.fill();
            c.fillStyle = '#ffffff'; U.roundRect(c, x + 10, y + 6, w * .22, 16, 6); c.fill();
            c.fillStyle = '#3a2a1a'; c.fillRect(x + 6, y + f.body, 8, 10); c.fillRect(x + w - 14, y + f.body, 8, 10);
          } else if (f.kind === 'table') {
            c.fillStyle = '#9a6a3a'; U.roundRect(c, x, y, w, 12, 4); c.fill();
            c.fillStyle = '#7a4a2a'; c.fillRect(x + 8, y + 12, 8, f.body - 12); c.fillRect(x + w - 16, y + 12, 8, f.body - 12);
            c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x + 4, y + 2, w - 8, 3);
          } else if (f.kind === 'chair') {
            c.fillStyle = '#c9a36a'; U.roundRect(c, x, y, w, 10, 3); c.fill();
            c.fillStyle = '#a07a44'; c.fillRect(x + w - 10, y - 30, 8, 30); c.fillRect(x + 4, y + 10, 6, f.body - 10); c.fillRect(x + w - 10, y + 10, 6, f.body - 10);
            c.fillStyle = ['#b54a6f', '#4a6fb5', '#5a9a5a'][f.tone]; U.roundRect(c, x + 4, y - 30, w - 8, 8, 3); c.fill();
          } else if (f.kind === 'shelf') {
            c.fillStyle = '#6a4224'; c.fillRect(x, y, w, f.body);
            c.fillStyle = '#8a5a34'; c.fillRect(x, y, w, 8);
            for (var sh = 1; sh < 4; sh++) {
              var sy = y + sh * 32;
              c.fillStyle = '#8a5a34'; c.fillRect(x + 4, sy, w - 8, 5);
              for (var bx = x + 8; bx < x + w - 14; bx += 11) {
                c.fillStyle = ['#c94a4a', '#4a8ac9', '#c9a04a', '#5aa04a', '#9a4ac9'][Math.floor(U.hash2(bx, sy, 3) * 5)];
                c.fillRect(bx, sy - 22 + U.hash2(bx, sy, 4) * 6, 8, 22 - U.hash2(bx, sy, 4) * 6);
              }
            }
          } else if (f.kind === 'tv') {
            c.fillStyle = '#3a3a44'; U.roundRect(c, x, y, w, 10, 3); c.fill();
            c.fillStyle = '#1a1a22'; U.roundRect(c, x + 8, y - 54, w - 16, 54, 4); c.fill();
            c.fillStyle = 'hsl(' + ((f.t * 40) % 360) + ',60%,55%)'; c.fillRect(x + 12, y - 50, w - 24, 44);
            c.fillStyle = '#5a4a3a'; c.fillRect(x + 6, y + 10, w - 12, f.body - 10);
          } else if (f.kind === 'lamp') {
            c.fillStyle = '#f2d27a'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w - 8, y - 30); c.lineTo(x + 8, y - 30); c.closePath(); c.fill();
            c.fillStyle = 'rgba(255,230,150,.18)'; c.beginPath(); c.arc(x + w / 2, y + 10, 70, 0, 7); c.fill();
            c.fillStyle = '#5a4a3a'; c.fillRect(x + w / 2 - 3, y, 6, f.body - 8);
            c.fillStyle = '#3a2a1a'; U.roundRect(c, x + 4, y + f.body - 10, w - 8, 10, 4); c.fill();
          } else if (f.kind === 'piano') {
            c.fillStyle = '#1e1a22'; U.roundRect(c, x, y, w, f.body, 4); c.fill();
            c.fillStyle = '#f8f4ec'; c.fillRect(x + 6, y + 24, w - 12, 14);
            c.fillStyle = '#1e1a22';
            for (var kx = x + 10; kx < x + w - 12; kx += 9) if (((kx - x) / 9 | 0) % 7 !== 3 && ((kx - x) / 9 | 0) % 7 !== 0) c.fillRect(kx, y + 24, 4, 8);
            c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(x + 4, y + 3, w - 8, 3);
          } else if (f.kind === 'stool') {
            c.fillStyle = '#c94a4a'; c.beginPath(); c.ellipse(x + w / 2, y + 5, w / 2, 6, 0, 0, 7); c.fill();
            c.fillStyle = '#8a8a96'; c.fillRect(x + w / 2 - 2, y + 8, 4, f.body - 10);
            c.fillStyle = '#6a6a76'; c.beginPath(); c.ellipse(x + w / 2, y + f.body, w / 2 + 2, 4, 0, 0, 7); c.fill();
          }
        });

        d.cushions.forEach(function (cu) {
          if (cu.got || cu.y < cam - 40 || cu.y > cam + H + 40) return;
          var y = cu.y + Math.sin(g.t * 3 + cu.x * .05) * 3;
          c.fillStyle = ['#ff8fb1', '#7fd3ff', '#ffe36b', '#9fe88a'][cu.hue];
          U.roundRect(c, cu.x - 13, y - 9, 26, 18, 6); c.fill();
          c.fillStyle = 'rgba(255,255,255,.45)';
          U.roundRect(c, cu.x - 9, y - 6, 18, 6, 3); c.fill();
          c.fillStyle = 'rgba(0,0,0,.2)';
          c.beginPath(); c.arc(cu.x, y + 1, 2, 0, 7); c.fill();
        });

        d.parts.forEach(function (pt) {
          c.globalAlpha = Math.max(0, pt.life / pt.max);
          c.fillStyle = pt.col;
          c.beginPath(); c.arc(pt.x, pt.y, pt.r, 0, 7); c.fill();
        });
        c.globalAlpha = 1;

        // the kid: striped shirt, big sneakers
        if (!d.over) {
          c.save();
          c.translate(p.x, p.y + PH);
          c.scale(p.face / p.squash, p.squash);
          c.fillStyle = '#2f4fd0';
          c.fillRect(-PW / 2 + 2, -12, 8, 12); c.fillRect(PW / 2 - 10, -12, 8, 12);
          c.fillStyle = '#ffffff';
          U.roundRect(c, -PW / 2, -5, 10, 5, 2); c.fill(); U.roundRect(c, PW / 2 - 10, -5, 10, 5, 2); c.fill();
          c.fillStyle = '#e8503c';
          U.roundRect(c, -PW / 2, -PH + 8, PW, PH - 18, 5); c.fill();
          c.fillStyle = '#ffffff';
          c.fillRect(-PW / 2, -PH + 13, PW, 3); c.fillRect(-PW / 2, -PH + 19, PW, 3);
          c.fillStyle = '#f5cfa8';
          c.beginPath(); c.arc(0, -PH + 3, 9, 0, 7); c.fill();
          c.fillStyle = '#5a3418';
          c.beginPath(); c.arc(0, -PH, 9, Math.PI, 0); c.fill();
          c.fillStyle = '#222';
          c.fillRect(3, -PH + 2, 2.5, 2.5);
          c.restore();
        }

        // the lava
        var lg = c.createLinearGradient(0, d.lavaY - 30, 0, d.lavaY + 200);
        lg.addColorStop(0, '#ffb347'); lg.addColorStop(.15, '#ff5c2a'); lg.addColorStop(1, '#7a1a0a');
        c.fillStyle = lg;
        c.beginPath();
        c.moveTo(0, cam + H + 400);
        for (var lx = 0; lx <= W; lx += 12) {
          var wob = Math.sin(lx * .04 + g.t * 3) * 5 + Math.sin(lx * .11 - g.t * 5) * 3;
          if (d.lava.phase !== 'calm') wob *= 2.2;
          c.lineTo(lx, d.lavaY + wob);
        }
        c.lineTo(W, cam + H + 400); c.closePath(); c.fill();
        c.fillStyle = 'rgba(255,240,180,.55)';
        for (lx = 0; lx <= W; lx += 12) {
          var wob2 = Math.sin(lx * .04 + g.t * 3) * 5 + Math.sin(lx * .11 - g.t * 5) * 3;
          if (d.lava.phase !== 'calm') wob2 *= 2.2;
          c.fillRect(lx, d.lavaY + wob2 - 2, 8, 3);
        }
        // bubbles
        for (var b = 0; b < 8; b++) {
          var bt = (g.t * (0.6 + b * .1) + b) % 1.8;
          var bxx = WALL + 20 + U.hash2(b, 2, 9) * (W - WALL * 2 - 40);
          c.fillStyle = 'rgba(255,200,80,' + (0.6 - bt * .3) + ')';
          c.beginPath(); c.arc(bxx, d.lavaY + 30 + bt * 40, 3 + bt * 6, 0, 7); c.fill();
        }
        d.embers.forEach(function (e) {
          c.globalAlpha = Math.max(0, e.life / e.max);
          c.fillStyle = '#ffd166';
          c.fillRect(e.x - 1.5, e.y - 1.5, 3, 3);
        });
        c.globalAlpha = 1;

        d.texts.forEach(function (t) {
          c.globalAlpha = Math.max(0, t.life);
          c.fillStyle = t.col; c.font = '800 16px Outfit, sans-serif'; c.textAlign = 'center';
          c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 3;
          c.strokeText(t.s, t.x, t.y); c.fillText(t.s, t.x, t.y);
        });
        c.globalAlpha = 1;
        c.restore();

        // heat haze / warning glow at the bottom
        if (glow > 0) {
          var hz = c.createLinearGradient(0, H * .4, 0, H);
          hz.addColorStop(0, 'rgba(255,90,40,0)'); hz.addColorStop(1, 'rgba(255,90,40,' + glow + ')');
          c.fillStyle = hz; c.fillRect(0, 0, W, H);
        }
        if (d.lava.phase === 'rumble') {
          c.fillStyle = 'rgba(120,20,10,' + (.6 + Math.sin(g.t * 20) * .3) + ')';
          c.font = '900 26px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText('RUMBLE… SURGE COMING', W / 2, 150);
        } else if (d.lava.phase === 'surge') {
          c.fillStyle = '#ff3b1f';
          c.font = '900 30px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText('SURGE!', W / 2, 150);
        }
      }
    });
  }

  window.Milo.register({
    id: 'floor-is-lava', title: 'The Floor Is Lava', emo: '🛋️', category: 'Arcade',
    tagline: 'Furniture parkour over lava that surges',
    description: 'Jump up the living room — sofas, tables, bookshelves, lamps, a piano — while ' +
      'the lava below creeps upward. Every few seconds the room rumbles and shakes, and a ' +
      'moment later the lava surges up several platforms at once, so treat a rumble as ' +
      'an order to climb. Sofas and beds bounce you higher, lamps sway under you, and the ' +
      'cushions scattered about are worth 15 each on top of your height. Higher up the ' +
      'furniture gets narrower and the surges come faster.',
    controls: ['← →', 'Space / ↑ jump', 'Touch: sides to move, top to jump'],
    colors: ['#f0dcc0', '#ff5c2a'],
    tags: ['platformer', 'endless', 'climbing', 'lava', 'vertical'],
    mount: mount
  });
})();
