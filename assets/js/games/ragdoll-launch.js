/* Ragdoll Launch — catapult a floppy ragdoll as far as it will go. */
(function () {
  'use strict';
  var W = 900, H = 560, GROUND = 470, G = 1500, STEP = 1 / 120, LAUNCHES = 3;
  var SAVE = 'ragdoll-launch:save';
  var CAT = { x: 130, y: GROUND - 36, len: 105 };
  var UPG = [
    { key: 'power', name: 'Launch Power', desc: '+12% launch speed', base: 60, mult: 1.55, max: 8, col: '#fb7185' },
    { key: 'boosts', name: 'Boost Taps', desc: '+1 mid-air boost', base: 90, mult: 1.6, max: 6, col: '#38bdf8' },
    { key: 'bounce', name: 'Rubber Bones', desc: 'bouncier landings', base: 70, mult: 1.6, max: 6, col: '#a3e635' }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function load() {
      var s = Milo.store.get(SAVE, null) || {};
      return { coins: s.coins | 0, power: s.power | 0, boosts: s.boosts | 0, bounce: s.bounce | 0 };
    }
    function persist(d) { Milo.store.set(SAVE, d.save); }
    function cost(u, lvl) { return Math.round(u.base * Math.pow(u.mult, lvl)); }

    /** Seven verlet points joined by distance constraints: head, chest, hip, two hands, two feet. */
    function makeDoll(x, y) {
      var offs = [[0, -36], [0, -16], [0, 8], [-17, -2], [17, -2], [-9, 32], [9, 32]];
      var pts = offs.map(function (o) { return { x: x + o[0], y: y + o[1], ox: x + o[0], oy: y + o[1], r: 6 }; });
      pts[0].r = 12;
      var cons = [[0, 1, 20, 1], [1, 2, 24, 1], [1, 3, 22, 1], [1, 4, 22, 1], [2, 5, 26, 1], [2, 6, 26, 1],
        [0, 2, 44, .35], [3, 4, 34, .08], [5, 6, 18, .1], [3, 5, 34, .06], [4, 6, 34, .06]];
      return { pts: pts, cons: cons.map(function (c) { return { a: c[0], b: c[1], len: c[2], k: c[3] }; }) };
    }

    function bucketPos(d) {
      var a = d.angle * Math.PI / 180;
      return { x: CAT.x + Math.cos(a) * CAT.len, y: CAT.y - Math.sin(a) * CAT.len };
    }

    function newAttempt(d) {
      d.phase = 'aim';
      d.t = 0;
      d.angle = 45;
      d.power = 0;
      d.items = [];
      d.genX = 420;
      d.dist = 0;
      d.ringCoins = 0;
      d.boosts = 2 + d.save.boosts;
      d.camX = 0; d.camY = 0;
      d.restT = 0;
      d.acc = 0;
      d.startX = CAT.x;
      var b = bucketPos(d);
      d.doll = makeDoll(b.x, b.y - 10);
      gen(d, 3200);
    }

    function reset(g) {
      var d = g.data;
      d.save = load();
      d.launch = 1;
      d.total = 0;
      d.bestThrow = 0;
      d.parts = [];
      d.floats = [];
      d.shake = 0;
      d.hills = [];
      for (var i = 0; i < 40; i++) d.hills.push(U.rand(.4, 1));
      newAttempt(d);
      g.set('Distance', '0 m');
      g.set('Total', '0 m');
      g.set('Coins', d.save.coins);
      g.set('Boosts', d.boosts);
      g.set('Launch', d.launch + '/' + LAUNCHES);
    }

    function gen(d, upTo) {
      while (d.genX < upTo) {
        d.genX += U.rand(240, 520);
        var r = Math.random();
        var padChance = .42 - Math.min(.28, d.genX / 60000);
        if (r < padChance) d.items.push({ type: 'pad', x: d.genX, w: 76, cd: 0, squash: 0 });
        else if (r < .92) d.items.push({ type: 'ring', x: d.genX, y: GROUND - U.rand(80, 360), r: 32, got: false, spin: Math.random() * 6 });
      }
    }

    function burst(d, x, y, col, n, spd) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2, s = U.rand(40, spd || 220);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life: U.rand(.3, .7), max: .7, col: col });
      }
    }
    function float(d, x, y, text, col) {
      d.floats.push({ x: x, y: y, text: text, life: 1.1, col: col || '#fff' });
    }

    function centroid(doll) {
      var cx = 0, cy = 0, vx = 0, vy = 0, n = doll.pts.length;
      doll.pts.forEach(function (p) { cx += p.x; cy += p.y; vx += p.x - p.ox; vy += p.y - p.oy; });
      return { x: cx / n, y: cy / n, vx: vx / n / STEP, vy: vy / n / STEP };
    }

    function stepDoll(g, d) {
      var doll = d.doll, pts = doll.pts, i, p;
      var bounce = .22 + d.save.bounce * .09;
      for (i = 0; i < pts.length; i++) {
        p = pts[i];
        var vx = (p.x - p.ox) * .9985, vy = (p.y - p.oy) * .9985;
        p.ox = p.x; p.oy = p.y;
        p.x += vx; p.y += vy + G * STEP * STEP;
      }
      for (var it = 0; it < 5; it++) {
        doll.cons.forEach(function (c) {
          var a = pts[c.a], b = pts[c.b];
          var dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy) || .001;
          var diff = (dist - c.len) / dist * .5 * c.k;
          a.x += dx * diff; a.y += dy * diff; b.x -= dx * diff; b.y -= dy * diff;
        });
        for (i = 0; i < pts.length; i++) {
          p = pts[i];
          if (p.y > GROUND - p.r) {
            var vyd = p.y - p.oy;
            p.y = GROUND - p.r;
            if (vyd > 0) {
              // Landing on a pad fires the whole body back up.
              var pad = null;
              for (var k = 0; k < d.items.length; k++) {
                var itm = d.items[k];
                if (itm.type === 'pad' && itm.cd <= 0 && p.x > itm.x - itm.w / 2 && p.x < itm.x + itm.w / 2) pad = itm;
              }
              if (pad && vyd > 1.2) {
                pad.cd = .5; pad.squash = 1;
                var up = Math.max(760, vyd / STEP * 1.25);
                pts.forEach(function (q) { q.oy = q.y + up * STEP; q.ox = q.x - 180 * STEP; });
                burst(d, pad.x, GROUND, '#a3e635', 14, 260);
                float(d, pad.x, GROUND - 60, 'BOING!', '#a3e635');
                Milo.sound.tone({ f: 220, f2: 900, d: .18, v: .1, type: 'square' });
                d.shake = Math.max(d.shake, 6);
              } else {
                p.oy = p.y + vyd * bounce;
                p.ox = p.x - (p.x - p.ox) * .78;
                if (vyd > 4) {
                  burst(d, p.x, GROUND, '#c2410c', 5, 120);
                  if (vyd > 7) { Milo.sound.hit(); d.shake = Math.max(d.shake, Math.min(10, vyd)); }
                }
              }
            }
          }
        }
      }
    }

    function launch(g) {
      var d = g.data;
      var speed = (600 + d.save.power * 72) * (.5 + .5 * d.power);
      var a = d.angle * Math.PI / 180;
      var vx = Math.cos(a) * speed, vy = -Math.sin(a) * speed;
      d.doll.pts.forEach(function (p) { p.ox = p.x - vx * STEP; p.oy = p.y - vy * STEP; });
      d.phase = 'fly';
      d.startX = d.doll.pts[2].x;
      d.shake = 8;
      burst(d, d.doll.pts[2].x, d.doll.pts[2].y, '#fde68a', 18, 300);
      Milo.sound.tone({ f: 160, f2: 720, d: .3, v: .12, type: 'sawtooth' });
      Milo.sound.noise(.25, .1, 1200);
    }

    function boost(g) {
      var d = g.data;
      if (d.boosts <= 0) return;
      d.boosts--;
      g.set('Boosts', d.boosts);
      var c = centroid(d.doll);
      var vx = 300, vy = -260;
      d.doll.pts.forEach(function (p) { p.ox -= vx * STEP; p.oy -= vy * STEP; });
      burst(d, c.x, c.y, '#38bdf8', 16, 240);
      float(d, c.x, c.y - 40, 'BOOST', '#38bdf8');
      Milo.sound.tone({ f: 400, f2: 1200, d: .16, v: .1, type: 'triangle' });
      d.shake = Math.max(d.shake, 4);
    }

    function land(g) {
      var d = g.data;
      var m = Math.floor(d.dist);
      var earned = Math.floor(m / 4) + d.ringCoins;
      d.save.coins += earned;
      persist(d);
      d.total += m;
      d.bestThrow = Math.max(d.bestThrow, m);
      g.score = d.total;
      g.set('Total', U.fmt(d.total) + ' m');
      g.set('Coins', d.save.coins);
      var c = centroid(d.doll);
      float(d, c.x, c.y - 70, m + ' m  +' + earned + ' coins', '#fde68a');
      Milo.sound.coin();
      if (d.launch < LAUNCHES) {
        d.phase = 'shop';
        d.t = 0;
      } else {
        d.phase = 'done';
        g.gameOver({
          emo: '🤸', title: 'Run complete',
          text: 'Three launches for ' + U.fmt(d.total) + ' m total. Best single throw ' + U.fmt(d.bestThrow) +
            ' m. Coins carry over — spend them on the shop next run.',
          score: d.total
        });
      }
    }

    function tap(g, x, y) {
      var d = g.data;
      if (d.phase === 'aim') { d.phase = 'power'; d.t = 0; Milo.sound.click(); }
      else if (d.phase === 'power') launch(g);
      else if (d.phase === 'fly') boost(g);
      else if (d.phase === 'shop') shopClick(g, x, y);
    }

    function cardRect(i) { return { x: 100 + i * 245, y: 150, w: 210, h: 210 }; }
    function launchBtn() { return { x: W / 2 - 120, y: 410, w: 240, h: 56 }; }
    function inside(r, x, y) { return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }

    function buy(g, i) {
      var d = g.data, u = UPG[i], lvl = d.save[u.key];
      if (lvl >= u.max) return;
      var c = cost(u, lvl);
      if (d.save.coins < c) { Milo.sound.tone({ f: 200, f2: 120, d: .12, v: .08, type: 'square' }); return; }
      d.save.coins -= c;
      d.save[u.key]++;
      persist(d);
      g.set('Coins', d.save.coins);
      var r = cardRect(i);
      burst(d, r.x + r.w / 2 + d.camX, r.y + 60 + d.camY, u.col, 14, 200);
      Milo.sound.powerup();
    }

    function shopClick(g, x, y) {
      var d = g.data;
      for (var i = 0; i < 3; i++) if (inside(cardRect(i), x, y)) { buy(g, i); return; }
      if (inside(launchBtn(), x, y)) nextLaunch(g);
    }

    function nextLaunch(g) {
      var d = g.data;
      d.launch++;
      newAttempt(d);
      g.set('Launch', d.launch + '/' + LAUNCHES);
      g.set('Boosts', d.boosts);
      g.set('Distance', '0 m');
      Milo.sound.blip();
    }

    return Milo.arcade(host, {
      id: 'ragdoll-launch',
      w: W, h: H, bg: '#2a1040',
      stats: ['Distance', 'Total', 'Coins', 'Boosts', 'Launch'],
      emo: '🤸',
      start: {
        title: 'Ragdoll Launch',
        text: 'Tap once to lock the catapult angle, again to lock power. In the air, every tap ' +
          'spends a boost. Green pads bounce you, gold rings pay coins, and coins buy upgrades ' +
          'between launches. Three launches per run — total distance is your score.',
        keys: ['Click / Tap / Space', '1 2 3 buy upgrades in the shop']
      },
      init: reset,
      onPointer: function (g, type, x, y) { if (type === 'down' && g.state === 'play') tap(g, x, y); },
      onKey: function (g, e) {
        var d = g.data;
        if (e.code === 'Space' || e.code === 'Enter') { if (d.phase === 'shop') nextLaunch(g); else tap(g, 0, 0); }
        if (d.phase === 'shop' && /^Digit[123]$/.test(e.code)) buy(g, Number(e.code.slice(5)) - 1);
      },

      update: function (g, dt) {
        var d = g.data;
        d.t += dt;
        if (d.shake > 0) d.shake = Math.max(0, d.shake - dt * 30);
        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 700 * dt; p.life -= dt;
          return p.life > 0;
        });
        d.floats = d.floats.filter(function (f) { f.y -= 40 * dt; f.life -= dt; return f.life > 0; });
        d.items.forEach(function (it) {
          if (it.cd > 0) it.cd -= dt;
          if (it.squash > 0) it.squash = Math.max(0, it.squash - dt * 4);
          if (it.type === 'ring') it.spin += dt * 2;
        });

        if (d.phase === 'aim') {
          d.angle = 45 + 27 * Math.sin(d.t * 2.4);
          var b = bucketPos(d);
          d.doll = makeDoll(b.x, b.y - 10);
        } else if (d.phase === 'power') {
          d.power = .5 + .5 * Math.sin(d.t * 4.6 - Math.PI / 2);
        } else if (d.phase === 'fly') {
          d.acc += dt;
          var guard = 0;
          while (d.acc >= STEP && guard++ < 8) { stepDoll(g, d); d.acc -= STEP; }
          var c = centroid(d.doll);
          var m = (c.x - d.startX) / 10;
          if (m > d.dist) { d.dist = m; g.set('Distance', Math.floor(m) + ' m'); }
          // rings
          d.items.forEach(function (it) {
            if (it.type !== 'ring' || it.got) return;
            if (U.dist(c.x, c.y, it.x, it.y) < it.r + 6) {
              it.got = true;
              d.ringCoins += 5;
              d.doll.pts.forEach(function (p) { p.ox -= 240 * STEP; p.oy += 170 * STEP; });
              burst(d, it.x, it.y, '#fde68a', 16, 260);
              float(d, it.x, it.y - 40, '+5', '#fde68a');
              Milo.sound.coin();
            }
          });
          gen(d, c.x + 2600);
          d.items = d.items.filter(function (it) { return it.x > c.x - 1500; });
          // camera
          d.camX += ((c.x - W * .36) - d.camX) * Math.min(1, dt * 8);
          d.camY += (Math.min(0, c.y - 230) - d.camY) * Math.min(1, dt * 6);
          // came to rest?
          var sp = Math.hypot(c.vx, c.vy);
          if (sp < 14 && c.y > GROUND - 46) d.restT += dt; else d.restT = 0;
          if (d.restT > .8 || m > 90000) land(g);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        // sky
        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#2a1040'); sky.addColorStop(.45, '#8b2f6b'); sky.addColorStop(.85, '#ff7a59'); sky.addColorStop(1, '#ffc27a');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);
        c.fillStyle = '#ffd08a';
        c.beginPath(); c.arc(W * .72 - d.camX * .02, 330 - d.camY * .05, 70, 0, 7); c.fill();
        c.fillStyle = 'rgba(255,255,255,.08)';
        c.beginPath(); c.arc(W * .72 - d.camX * .02, 330 - d.camY * .05, 110, 0, 7); c.fill();

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        // far hills (parallax)
        function hills(par, base, col, amp) {
          c.fillStyle = col;
          c.beginPath();
          c.moveTo(0, H);
          var off = d.camX * par;
          for (var x = -40; x <= W + 40; x += 40) {
            var i = Math.floor((x + off) / 40);
            var hh = d.hills[((i % 40) + 40) % 40];
            var y = base - d.camY * par - hh * amp - Math.sin((x + off) * .01) * 12;
            c.lineTo(x, y);
          }
          c.lineTo(W, H); c.closePath(); c.fill();
        }
        hills(.12, 400, '#4c1d5f', 110);
        hills(.3, 430, '#6b2a5a', 70);

        c.translate(-d.camX, -d.camY);

        // ground
        c.fillStyle = '#3b1e2e';
        c.fillRect(d.camX - 20, GROUND, W + 40, H);
        c.fillStyle = '#7a3a49';
        c.fillRect(d.camX - 20, GROUND, W + 40, 10);
        // distance markers every 100 m
        c.font = '700 13px Outfit, sans-serif'; c.textAlign = 'center';
        var k0 = Math.max(1, Math.floor((d.camX - d.startX) / 1000));
        for (var k = k0; k < k0 + 3; k++) {
          var mx = d.startX + k * 1000;
          c.fillStyle = 'rgba(255,255,255,.25)';
          c.fillRect(mx, GROUND - 26, 3, 26);
          c.fillStyle = 'rgba(255,255,255,.7)';
          c.fillText(k * 100 + ' m', mx, GROUND - 32);
        }

        // items
        d.items.forEach(function (it) {
          if (it.type === 'pad') {
            var sq = 1 - it.squash * .5;
            c.fillStyle = '#365314';
            U.roundRect(c, it.x - it.w / 2, GROUND - 6, it.w, 8, 3); c.fill();
            c.fillStyle = '#a3e635';
            U.roundRect(c, it.x - it.w / 2 - 4, GROUND - 6 - 12 * sq, it.w + 8, 12 * sq, 5); c.fill();
            c.fillStyle = '#365314'; c.font = '800 11px Outfit, sans-serif';
            c.fillText('▲ ▲ ▲', it.x, GROUND - 8 - 2 * sq);
          } else {
            var squ = Math.abs(Math.cos(it.spin)) * .7 + .3;
            c.globalAlpha = it.got ? .18 : 1;
            c.strokeStyle = '#fde68a'; c.lineWidth = 7;
            c.shadowColor = '#fde68a'; c.shadowBlur = it.got ? 0 : 14;
            c.beginPath(); c.ellipse(it.x, it.y, it.r * squ, it.r, 0, 0, 7); c.stroke();
            c.shadowBlur = 0;
            c.strokeStyle = '#b45309'; c.lineWidth = 2;
            c.beginPath(); c.ellipse(it.x, it.y, it.r * squ, it.r, 0, 0, 7); c.stroke();
            c.globalAlpha = 1;
          }
        });

        // catapult
        c.strokeStyle = '#3b1f0e'; c.lineWidth = 12; c.lineCap = 'round';
        c.beginPath(); c.moveTo(CAT.x - 40, GROUND); c.lineTo(CAT.x, CAT.y); c.lineTo(CAT.x + 40, GROUND); c.stroke();
        c.strokeStyle = '#8b4a1f'; c.lineWidth = 9;
        var ang = (d.phase === 'aim' || d.phase === 'power') ? d.angle : (d.phase === 'fly' ? 82 : 45);
        var a = ang * Math.PI / 180;
        var bx = CAT.x + Math.cos(a) * CAT.len, by = CAT.y - Math.sin(a) * CAT.len;
        c.beginPath(); c.moveTo(CAT.x - Math.cos(a) * 30, CAT.y + Math.sin(a) * 30); c.lineTo(bx, by); c.stroke();
        c.fillStyle = '#5b2e12';
        c.beginPath(); c.arc(bx, by, 16, 0, Math.PI); c.fill();
        c.fillStyle = '#3b1f0e';
        c.beginPath(); c.arc(CAT.x, CAT.y, 8, 0, 7); c.fill();

        // doll
        if (d.doll) drawDoll(c, d.doll);

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.beginPath(); c.arc(p.x, p.y, 3.5, 0, 7); c.fill();
        });
        c.globalAlpha = 1;
        d.floats.forEach(function (f) {
          c.globalAlpha = Math.min(1, f.life);
          c.fillStyle = f.col; c.font = '800 20px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText(f.text, f.x, f.y);
        });
        c.globalAlpha = 1;
        c.restore();

        // UI overlays in screen space
        if (d.phase === 'aim' || d.phase === 'power') {
          c.fillStyle = 'rgba(0,0,0,.35)';
          U.roundRect(c, 20, 60, 230, 84, 10); c.fill();
          c.fillStyle = '#fff'; c.font = '700 15px Outfit, sans-serif'; c.textAlign = 'left';
          c.fillText('Angle ' + Math.round(d.angle) + '°', 34, 86);
          c.fillText(d.phase === 'aim' ? 'Tap to lock angle' : 'Tap to launch!', 34, 130);
          c.fillStyle = 'rgba(255,255,255,.2)';
          U.roundRect(c, 34, 96, 200, 14, 7); c.fill();
          if (d.phase === 'power') {
            var pw = d.power;
            c.fillStyle = pw > .85 ? '#a3e635' : pw > .5 ? '#fde68a' : '#fb7185';
            U.roundRect(c, 34, 96, 200 * pw, 14, 7); c.fill();
          }
          var ptr = 0; // aim indicator dotted arc from bucket
          var sp = (600 + d.save.power * 72) * (d.phase === 'power' ? (.5 + .5 * d.power) : .75);
          var px = bx - d.camX, py = by - d.camY, vx = Math.cos(a) * sp, vy = -Math.sin(a) * sp;
          c.fillStyle = 'rgba(255,255,255,.55)';
          for (ptr = 0; ptr < 14; ptr++) {
            px += vx * .06; vy += G * .06; py += vy * .06;
            if (py > GROUND) break;
            c.beginPath(); c.arc(px, py, 3, 0, 7); c.fill();
          }
        } else if (d.phase === 'fly') {
          c.fillStyle = 'rgba(0,0,0,.35)';
          U.roundRect(c, 20, 60, 170, 34, 8); c.fill();
          c.fillStyle = '#38bdf8'; c.font = '700 14px Outfit, sans-serif'; c.textAlign = 'left';
          c.fillText('Tap to boost  ×' + d.boosts, 32, 83);
        } else if (d.phase === 'shop') {
          drawShop(c, d);
        }
      }
    });

    function drawDoll(c, doll) {
      var p = doll.pts;
      function limb(a, b, col, w) {
        c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round';
        c.beginPath(); c.moveTo(p[a].x, p[a].y); c.lineTo(p[b].x, p[b].y); c.stroke();
      }
      limb(1, 2, '#0ea5e9', 14);
      limb(1, 3, '#38bdf8', 8); limb(1, 4, '#38bdf8', 8);
      limb(2, 5, '#1d4ed8', 9); limb(2, 6, '#1d4ed8', 9);
      c.fillStyle = '#fde68a';
      [3, 4].forEach(function (i) { c.beginPath(); c.arc(p[i].x, p[i].y, 5, 0, 7); c.fill(); });
      c.fillStyle = '#7c2d12';
      [5, 6].forEach(function (i) { c.beginPath(); c.arc(p[i].x, p[i].y, 5.5, 0, 7); c.fill(); });
      var h = p[0];
      var dx = p[1].x - h.x, dy = p[1].y - h.y, ang = Math.atan2(dy, dx) - Math.PI / 2;
      c.save(); c.translate(h.x, h.y); c.rotate(ang);
      c.fillStyle = '#fde68a';
      c.beginPath(); c.arc(0, 0, 12, 0, 7); c.fill();
      c.fillStyle = '#1e1b4b';
      c.beginPath(); c.arc(-4, -2, 2, 0, 7); c.arc(4, -2, 2, 0, 7); c.fill();
      c.strokeStyle = '#1e1b4b'; c.lineWidth = 1.6;
      c.beginPath(); c.arc(0, 3, 5, .2, Math.PI - .2); c.stroke();
      c.restore();
    }

    function drawShop(c, d) {
      c.fillStyle = 'rgba(20,6,30,.72)';
      c.fillRect(0, 0, W, H);
      c.fillStyle = '#fde68a'; c.font = '800 30px Outfit, sans-serif'; c.textAlign = 'center';
      c.fillText('Upgrade shop', W / 2, 80);
      c.fillStyle = '#fff'; c.font = '600 16px Outfit, sans-serif';
      c.fillText('Launch ' + d.launch + ' of ' + LAUNCHES + ' done  ·  ' + d.save.coins + ' coins', W / 2, 112);
      UPG.forEach(function (u, i) {
        var r = cardRect(i), lvl = d.save[u.key], maxed = lvl >= u.max, price = cost(u, lvl);
        var can = !maxed && d.save.coins >= price;
        c.fillStyle = can ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.06)';
        U.roundRect(c, r.x, r.y, r.w, r.h, 14); c.fill();
        c.strokeStyle = u.col; c.lineWidth = can ? 3 : 1.5;
        U.roundRect(c, r.x, r.y, r.w, r.h, 14); c.stroke();
        c.fillStyle = u.col; c.font = '800 19px Outfit, sans-serif';
        c.fillText(u.name, r.x + r.w / 2, r.y + 40);
        c.fillStyle = '#fff'; c.font = '500 14px Outfit, sans-serif';
        c.fillText(u.desc, r.x + r.w / 2, r.y + 66);
        // pips
        for (var k = 0; k < u.max; k++) {
          c.fillStyle = k < lvl ? u.col : 'rgba(255,255,255,.15)';
          U.roundRect(c, r.x + 22 + k * ((r.w - 44) / u.max), r.y + 92, (r.w - 44) / u.max - 4, 10, 3); c.fill();
        }
        c.fillStyle = maxed ? '#a3e635' : can ? '#fde68a' : 'rgba(255,255,255,.4)';
        c.font = '800 22px Outfit, sans-serif';
        c.fillText(maxed ? 'MAXED' : price + ' coins', r.x + r.w / 2, r.y + 145);
        c.fillStyle = 'rgba(255,255,255,.5)'; c.font = '600 12px Outfit, sans-serif';
        c.fillText('press ' + (i + 1) + ' or click', r.x + r.w / 2, r.y + 185);
      });
      var b = launchBtn();
      c.fillStyle = '#fb7185';
      U.roundRect(c, b.x, b.y, b.w, b.h, 28); c.fill();
      c.fillStyle = '#fff'; c.font = '800 22px Outfit, sans-serif';
      c.fillText('LAUNCH  ▶', b.x + b.w / 2, b.y + 37);
      c.fillStyle = 'rgba(255,255,255,.5)'; c.font = '600 13px Outfit, sans-serif';
      c.fillText('Space to launch', W / 2, b.y + 80);
    }
  }

  window.Milo.register({
    id: 'ragdoll-launch', title: 'Ragdoll Launch', emo: '🤸', category: 'Casual',
    tagline: 'Catapult a floppy ragdoll for distance',
    description: 'Lock the swinging catapult angle with one tap and the pulsing power bar with the ' +
      'next, then watch a seven-joint ragdoll tumble down the valley. Every tap in the air spends a ' +
      'boost, green pads fire you back up if you land on them with any speed, and gold rings pay ' +
      'five coins plus a shove forward. You get three launches per run and the total distance is your ' +
      'score; coins persist between runs and buy power, extra boosts and rubberier bones in the shop. ' +
      'Tip: save a boost for the moment you are about to touch down — it turns a thud into a skip.',
    controls: ['Click', 'Tap', 'Space', '1 2 3 in the shop'],
    colors: ['#8b2f6b', '#ff7a59'],
    tags: ['physics', 'launch', 'ragdoll', 'upgrades', 'distance'],
    mount: mount
  });
})();
