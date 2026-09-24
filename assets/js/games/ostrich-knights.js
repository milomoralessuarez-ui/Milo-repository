/* Ostrich Knights — flap-to-fly jousting over the lava; the higher lance wins. */
(function () {
  'use strict';
  var W = 900, H = 620;
  var LAVA_Y = 566;

  var PLATS = [
    { x: 120, y: 528, w: 660 },
    { x: -20, y: 404, w: 210 },
    { x: 710, y: 404, w: 210 },
    { x: 318, y: 336, w: 264 },
    { x: 118, y: 236, w: 188 },
    { x: 594, y: 236, w: 188 },
    { x: 384, y: 142, w: 172 }
  ];

  var FOES = [
    { n: 'Bounder', body: '#f87185', bird: '#fca5a5', pts: 500, sp: 128, flap: 250, agg: .55 },
    { n: 'Hunter', body: '#c084fc', bird: '#e9d5ff', pts: 750, sp: 168, flap: 272, agg: .8 },
    { n: 'Shadow Lord', body: '#38bdf8', bird: '#bae6fd', pts: 1500, sp: 214, flap: 300, agg: 1.1 }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function wrap(x) { return ((x % W) + W) % W; }
    function dxWrap(a, b) {
      var v = a - b;
      if (v > W / 2) v -= W;
      if (v < -W / 2) v += W;
      return v;
    }

    function burst(d, x, y, col, n, spd) {
      for (var i = 0; i < (n || 16); i++) {
        var a = Math.random() * 6.283, s = U.rand(40, spd || 260);
        d.parts.push({
          x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40,
          life: U.rand(.3, .8), max: .8, col: col, r: U.rand(1.6, 3.8)
        });
      }
    }

    function say(d, t) { d.msg = t; d.msgT = 1.8; }
    function award(g, n) {
      g.score += n;
      g.set('Score', U.fmt(g.score));
      var d = g.data;
      if (g.score >= d.nextLife) {
        d.nextLife += 20000;
        d.lives++;
        g.set('Lives', d.lives);
        say(d, 'EXTRA KNIGHT');
        Milo.sound.powerup();
      }
    }

    /* ---------------------------------------------------------- physics */

    function physics(d, r, dt, lean, flapping) {
      var accel = r.foe ? r.kind.sp * 5 : 760;
      if (lean) {
        if (Math.sign(lean) !== Math.sign(r.vx) && r.vx !== 0) r.skid = .18;
        r.vx += lean * accel * dt;
        r.face = lean;
      }
      var maxV = r.foe ? r.kind.sp * 1.9 : 330;
      r.vx = U.clamp(r.vx, -maxV, maxV);
      r.skid = Math.max(0, (r.skid || 0) - dt);

      if (flapping && r.flapCd <= 0) {
        r.vy = Math.max(r.vy - (r.foe ? r.kind.flap : 262), r.foe ? -300 : -330);
        r.flapCd = r.foe ? 0.2 : 0.16;
        r.wing = 1;
        if (!r.foe) Milo.sound.tone({ f: 170, f2: 300, d: .07, v: .05, type: 'triangle' });
      }
      r.flapCd -= dt;
      r.wing = Math.max(0, r.wing - dt * 3.4);

      r.vy += 840 * dt;
      r.vy = Math.min(r.vy, 560);
      r.x = wrap(r.x + r.vx * dt);
      r.y += r.vy * dt;
      if (!r.grounded) r.vx *= Math.pow(0.55, dt);
      else r.vx *= Math.pow(0.06, dt);

      // platforms
      r.grounded = false;
      for (var i = 0; i < PLATS.length; i++) {
        var p = PLATS[i];
        if (r.x + 16 > p.x && r.x - 16 < p.x + p.w) {
          if (r.vy >= 0 && r.y + 20 >= p.y && r.y + 20 <= p.y + 26) {
            r.y = p.y - 20; r.vy = 0; r.grounded = true;
          } else if (r.vy < 0 && r.y - 20 <= p.y + 14 && r.y + 6 > p.y + 14) {
            r.y = p.y + 34; r.vy = 40;
          }
        }
      }
      if (r.y < 26) { r.y = 26; r.vy = Math.max(r.vy, 40); }
    }

    /* ------------------------------------------------------------- waves */

    function spawnWave(g) {
      var d = g.data;
      d.foes = [];
      var n = Math.min(8, 2 + d.wave);
      for (var i = 0; i < n; i++) {
        var tier = 0;
        var roll = Math.random() + d.wave * 0.1;
        if (roll > 1.5) tier = 2; else if (roll > 0.75) tier = 1;
        tier = Math.min(tier, Math.floor(d.wave / 2));
        addFoe(d, FOES[Math.max(0, tier)]);
      }
      d.pterryT = d.wave >= 4 ? 26 : 1e9;
      g.set('Wave', d.wave);
      say(d, 'WAVE ' + d.wave);
    }

    function addFoe(d, kind, atX, atY) {
      var p = PLATS[U.randInt(1, PLATS.length - 1)];
      d.foes.push({
        foe: true, kind: kind,
        x: atX == null ? p.x + p.w / 2 : atX,
        y: atY == null ? p.y - 24 : atY,
        vx: U.rand(-60, 60), vy: 0, face: Math.random() < .5 ? -1 : 1,
        flapCd: 0, wing: 0, grounded: false, spawn: 1.1, think: 0, skid: 0
      });
    }

    /* ------------------------------------------------------------- reset */

    function reset(g) {
      var d = g.data;
      d.wave = 1;
      d.lives = 3;
      d.nextLife = 20000;
      d.parts = [];
      d.eggs = [];
      d.foes = [];
      d.msg = '';
      d.msgT = 0;
      d.shake = 0;
      d.respawn = 0;
      d.hand = null;
      d.handT = U.rand(9, 16);
      d.p = {
        foe: false, x: W * 0.5, y: PLATS[0].y - 24, vx: 0, vy: 0, face: 1,
        flapCd: 0, wing: 0, grounded: true, skid: 0
      };
      d.pterryT = 1e9;
      d.waveClear = 0;
      spawnWave(g);
      g.score = 0;
      g.set('Score', 0);
      g.set('Lives', 3);
      g.set('Eggs', 0);
      d.eggsGot = 0;
    }

    function killPlayer(g, why) {
      var d = g.data;
      if (d.respawn > 0) return;
      d.respawn = 1.7;
      d.shake = 22;
      burst(d, d.p.x, d.p.y, '#fbbf24', 28, 340);
      Milo.sound.explode();
      d.lives--;
      g.set('Lives', Math.max(0, d.lives));
      if (d.lives <= 0) {
        g.gameOver({
          emo: '🪶', title: why || 'Unhorsed',
          text: 'Wave ' + d.wave + ' with ' + d.eggsGot + ' egg' + (d.eggsGot === 1 ? '' : 's') + ' gathered.'
        });
      }
    }

    function dropEgg(d, x, y, vx, tier) {
      d.eggs.push({ x: x, y: y, vx: vx * .5, vy: -80, hatch: 7.5, grounded: false, tier: tier, wob: 0 });
    }

    /* ------------------------------------------------------------ runner */

    return Milo.arcade(host, {
      id: 'ostrich-knights',
      w: W, h: H, bg: '#100a2a',
      stats: ['Score', 'Wave', 'Eggs', 'Lives'],
      touch: 'dpad',
      touchButtons: [{ key: 'action', label: 'FLAP' }],
      emo: '🪶',
      start: {
        title: 'Ostrich Knights',
        text: 'Your bird only climbs when you flap, and momentum carries. When two riders ' +
          'collide the higher lance wins — so meet every enemy from above. Beaten riders ' +
          'leave an egg: collect it before it hatches into something worse.',
        keys: ['← → to steer', 'Space / ↑ to flap']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, i = g.input, p = d.p;
        d.shake = Math.max(0, d.shake - dt * 44);
        d.msgT = Math.max(0, d.msgT - dt);

        d.parts = d.parts.filter(function (q) {
          q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 380 * dt; q.life -= dt;
          return q.life > 0;
        });

        /* -- player -- */
        if (d.respawn > 0) {
          d.respawn -= dt;
          if (d.respawn <= 0 && d.lives > 0) {
            p.x = W * 0.5; p.y = PLATS[0].y - 24; p.vx = 0; p.vy = 0; p.grounded = true;
          }
        } else {
          var lean = (i.down('right') ? 1 : 0) - (i.down('left') ? 1 : 0);
          if (i.pdown) {
            if (i.px > p.x + 24) lean = 1; else if (i.px < p.x - 24) lean = -1;
          }
          var flap = i.pressed('action') || i.pressed('up') || i.ptap;
          physics(d, p, dt, lean, flap);
          if (p.y > LAVA_Y - 10) { killPlayer(g, 'Into the lava'); }
        }

        /* -- foes -- */
        d.foes.forEach(function (f) {
          if (f.spawn > 0) { f.spawn -= dt; return; }
          f.think -= dt;
          var dx = dxWrap(p.x, f.x);
          var dy = p.y - f.y;
          var lean2 = 0, flap2 = false;
          if (d.respawn > 0) {
            // no target: patrol
            lean2 = f.face;
            flap2 = f.y > 420 && Math.random() < dt * 5;
          } else {
            var aggro = f.kind.agg;
            lean2 = dx > 8 ? 1 : dx < -8 ? -1 : 0;
            // Try to get above the player before closing in.
            var wantY = p.y - 34;
            if (f.y > wantY) flap2 = Math.random() < dt * (7 + aggro * 6);
            else if (f.y < wantY - 60) flap2 = false;
            else flap2 = Math.random() < dt * 2;
            if (Math.abs(dx) > 260) lean2 *= 1;
            if (f.y > LAVA_Y - 90) flap2 = true;
          }
          physics(d, f, dt, lean2, flap2);
          if (f.y > LAVA_Y - 10) {
            burst(d, f.x, LAVA_Y, '#fb923c', 14, 200);
            f.dead = true;
            Milo.sound.hit();
          }
        });

        /* -- jousting -- */
        if (d.respawn <= 0) {
          for (var k = 0; k < d.foes.length; k++) {
            var f2 = d.foes[k];
            if (f2.dead || f2.spawn > 0) continue;
            var jdx = dxWrap(p.x, f2.x), jdy = p.y - f2.y;
            if (Math.abs(jdx) < 30 && Math.abs(jdy) < 26) {
              if (jdy < -5) {                       // you are higher: you win
                f2.dead = true;
                award(g, f2.kind.pts);
                say(d, f2.kind.n + ' UNHORSED  +' + U.fmt(f2.kind.pts));
                burst(d, f2.x, f2.y, f2.kind.body, 20, 280);
                dropEgg(d, f2.x, f2.y, f2.vx, FOES.indexOf(f2.kind));
                d.shake = 10;
                p.vx = -jdx > 0 ? 160 : -160;
                Milo.sound.coin();
              } else if (jdy > 5) {
                killPlayer(g, 'Lanced');
                break;
              } else {                              // level pegging: bounce apart
                var push = jdx > 0 ? 1 : -1;
                p.vx = push * 260; f2.vx = -push * 260;
                p.vy -= 60; f2.vy -= 60;
                Milo.sound.tone({ f: 300, f2: 620, d: .1, v: .07, type: 'square' });
              }
            }
          }
          // foes bump each other apart so they don't stack
          for (var a2 = 0; a2 < d.foes.length; a2++) {
            for (var b2 = a2 + 1; b2 < d.foes.length; b2++) {
              var A = d.foes[a2], B = d.foes[b2];
              if (A.dead || B.dead) continue;
              var bdx = dxWrap(A.x, B.x);
              if (Math.abs(bdx) < 26 && Math.abs(A.y - B.y) < 22) {
                var s2 = bdx > 0 ? 1 : -1;
                A.vx = s2 * 180; B.vx = -s2 * 180;
              }
            }
          }
        }
        d.foes = d.foes.filter(function (f3) { return !f3.dead; });

        /* -- eggs -- */
        d.eggs.forEach(function (e) {
          e.wob += dt * 6;
          e.vy += 700 * dt;
          e.x = wrap(e.x + e.vx * dt);
          e.y += e.vy * dt;
          e.grounded = false;
          for (var q = 0; q < PLATS.length; q++) {
            var pl = PLATS[q];
            if (e.x > pl.x && e.x < pl.x + pl.w && e.vy >= 0 && e.y + 10 >= pl.y && e.y + 10 <= pl.y + 22) {
              e.y = pl.y - 10; e.vy = 0; e.grounded = true;
              e.vx *= 0.9;
            }
          }
          if (e.y > LAVA_Y - 4) { e.dead = true; burst(d, e.x, LAVA_Y, '#fb923c', 8, 150); }
          if (e.grounded) e.hatch -= dt;
          if (e.hatch <= 0) {
            e.dead = true;
            addFoe(d, FOES[Math.min(FOES.length - 1, e.tier + 1)], e.x, e.y - 14);
            say(d, 'HATCHED!');
            Milo.sound.lose();
          }
          if (d.respawn <= 0 && Math.abs(dxWrap(e.x, p.x)) < 26 && Math.abs(e.y - p.y) < 26) {
            e.dead = true;
            d.eggsGot++;
            g.set('Eggs', d.eggsGot);
            var pts = e.grounded ? 250 : 500;
            award(g, pts);
            burst(d, e.x, e.y, '#fef3c7', 12, 180);
            Milo.sound.tone({ f: 880, f2: 1320, d: .1, v: .07, type: 'square' });
          }
        });
        d.eggs = d.eggs.filter(function (e) { return !e.dead; });

        /* -- lava hand -- */
        d.handT -= dt;
        if (d.handT <= 0 && !d.hand) {
          d.handT = U.rand(11, 20);
          d.hand = { x: U.rand(180, W - 180), t: 0, reach: 0 };
        }
        if (d.hand) {
          d.hand.t += dt;
          d.hand.reach = Math.sin(U.clamp(d.hand.t / 2.4, 0, 1) * Math.PI) * 86;
          if (d.hand.t > 2.4) d.hand = null;
          else if (d.respawn <= 0 && Math.abs(p.x - d.hand.x) < 28 && p.y > LAVA_Y - d.hand.reach - 16) {
            killPlayer(g, 'Dragged under');
          }
        }

        /* -- wave clear -- */
        if (!d.foes.length && !d.eggs.length) {
          d.waveClear += dt;
          if (d.waveClear > 1.1) {
            d.waveClear = 0;
            d.wave++;
            award(g, 500 * d.wave);
            Milo.sound.win();
            spawnWave(g);
          }
        } else d.waveClear = 0;
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#191046');
        sky.addColorStop(.6, '#150b31');
        sky.addColorStop(1, '#3a0f18');
        c.fillStyle = sky; c.fillRect(-40, -40, W + 80, H + 80);

        for (var s = 0; s < 60; s++) {
          var sx = U.hash2(s, 1, 4) * W, sy = U.hash2(s, 2, 8) * (H - 200);
          c.globalAlpha = .2 + U.hash2(s, 3, 12) * .5;
          c.fillStyle = '#e9d5ff';
          c.fillRect(sx, sy, 2, 2);
        }
        c.globalAlpha = 1;

        // lava
        var lav = c.createLinearGradient(0, LAVA_Y - 14, 0, H);
        lav.addColorStop(0, '#fb923c');
        lav.addColorStop(.4, '#ea580c');
        lav.addColorStop(1, '#7c2d12');
        c.fillStyle = lav;
        c.beginPath();
        c.moveTo(-40, LAVA_Y + 6);
        for (var lx = -40; lx <= W + 40; lx += 20) {
          c.lineTo(lx, LAVA_Y + Math.sin(lx * 0.03 + g.t * 2.2) * 6);
        }
        c.lineTo(W + 40, H + 40); c.lineTo(-40, H + 40);
        c.closePath(); c.fill();
        c.fillStyle = 'rgba(253,224,71,.45)';
        for (var b = 0; b < 8; b++) {
          var bx = ((b * 137 + g.t * 26) % (W + 80)) - 40;
          var by = LAVA_Y + 14 + Math.sin(g.t * 3 + b) * 8;
          c.beginPath(); c.arc(bx, by, 3 + Math.sin(g.t * 5 + b) * 2, 0, 7); c.fill();
        }

        // lava hand
        if (d.hand) {
          var hy = LAVA_Y - d.hand.reach;
          c.fillStyle = '#ea580c';
          c.fillRect(d.hand.x - 11, hy, 22, d.hand.reach + 20);
          c.fillStyle = '#fb923c';
          for (var fg = -2; fg <= 2; fg++) {
            c.fillRect(d.hand.x - 3 + fg * 9, hy - 14, 6, 18);
          }
        }

        // platforms
        PLATS.forEach(function (p) {
          c.fillStyle = '#6b4c2a';
          U.roundRect(c, p.x, p.y, p.w, 16, 5); c.fill();
          c.fillStyle = '#a3763f';
          U.roundRect(c, p.x + 2, p.y + 2, p.w - 4, 6, 3); c.fill();
          c.fillStyle = 'rgba(0,0,0,.35)';
          c.fillRect(p.x + 4, p.y + 12, p.w - 8, 4);
        });

        // eggs
        d.eggs.forEach(function (e) {
          c.save(); c.translate(e.x, e.y);
          var soon = e.hatch < 2.2;
          c.rotate(Math.sin(e.wob) * (soon ? .22 : .05));
          c.fillStyle = soon && Math.floor(g.t * 9) % 2 ? '#fde68a' : '#fef3c7';
          c.beginPath(); c.ellipse(0, 0, 9, 12, 0, 0, 7); c.fill();
          c.fillStyle = 'rgba(180,140,60,.45)';
          c.beginPath(); c.arc(-3, -3, 2.4, 0, 7); c.arc(3, 2, 1.8, 0, 7); c.fill();
          c.restore();
        });

        // riders
        function drawRider(r, isPlayer) {
          c.save();
          c.translate(r.x, r.y);
          c.scale(r.face >= 0 ? 1 : -1, 1);
          var body = isPlayer ? '#fbbf24' : r.kind.body;
          var bird = isPlayer ? '#fef3c7' : r.kind.bird;
          // legs
          c.strokeStyle = '#eab308'; c.lineWidth = 3; c.lineCap = 'round';
          var stride = r.grounded ? Math.sin(g.t * 14) * 6 : 5;
          c.beginPath();
          c.moveTo(-2, 10); c.lineTo(-4 + stride, 20);
          c.moveTo(4, 10); c.lineTo(6 - stride, 20);
          c.stroke();
          // body
          c.fillStyle = bird;
          c.beginPath(); c.ellipse(0, 4, 17, 12, 0, 0, 7); c.fill();
          // neck + head
          c.strokeStyle = bird; c.lineWidth = 6; c.lineCap = 'round';
          c.beginPath(); c.moveTo(8, -2); c.lineTo(17, -16); c.stroke();
          c.fillStyle = bird;
          c.beginPath(); c.arc(18, -19, 6, 0, 7); c.fill();
          c.fillStyle = '#f97316';
          c.beginPath(); c.moveTo(23, -20); c.lineTo(33, -18); c.lineTo(23, -15); c.closePath(); c.fill();
          c.fillStyle = '#111827';
          c.beginPath(); c.arc(20, -21, 1.9, 0, 7); c.fill();
          // wing
          c.save();
          c.translate(-2, 2);
          c.rotate(-r.wing * 1.1);
          c.fillStyle = U.shade(bird, -.28);
          c.beginPath(); c.ellipse(-4, 0, 14, 7, -0.2, 0, 7); c.fill();
          c.restore();
          // rider
          c.fillStyle = body;
          U.roundRect(c, -6, -18, 12, 16, 5); c.fill();
          c.fillStyle = U.shade(body, .35);
          c.beginPath(); c.arc(0, -23, 6, 0, 7); c.fill();
          c.fillStyle = '#1f2937';
          c.fillRect(-1, -25, 7, 3);
          // lance
          c.strokeStyle = '#e5e7eb'; c.lineWidth = 3.4;
          c.beginPath(); c.moveTo(2, -14); c.lineTo(34, -26); c.stroke();
          c.fillStyle = '#f8fafc';
          c.beginPath(); c.moveTo(34, -30); c.lineTo(44, -26); c.lineTo(34, -22); c.closePath(); c.fill();
          c.restore();
        }

        d.foes.forEach(function (f) {
          if (f.spawn > 0) {
            c.globalAlpha = .4 + Math.sin(g.t * 20) * .3;
            c.fillStyle = f.kind.body;
            c.beginPath(); c.arc(f.x, f.y, 18, 0, 7); c.fill();
            c.globalAlpha = 1;
            return;
          }
          drawRider(f, false);
        });
        if (d.respawn <= 0 || Math.floor(g.t * 12) % 2) drawRider(d.p, true);

        d.parts.forEach(function (q) {
          c.globalAlpha = Math.max(0, q.life / q.max);
          c.fillStyle = q.col;
          c.fillRect(q.x - q.r, q.y - q.r, q.r * 2, q.r * 2);
        });
        c.globalAlpha = 1;
        c.restore();

        if (d.msgT > 0) {
          c.globalAlpha = Math.min(1, d.msgT);
          c.fillStyle = '#fde68a';
          c.font = '800 26px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(d.msg, W / 2, 62);
          c.globalAlpha = 1;
          c.textAlign = 'left';
        }
      }
    });
  }

  window.Milo.register({
    id: 'ostrich-knights',
    title: 'Ostrich Knights',
    emo: '🪶',
    category: 'Arcade',
    tagline: 'Flap-to-fly jousting over the lava',
    description: 'Your mount only climbs while you flap and it keeps every bit of momentum, ' +
      'so the whole game is managing height. Collide with a rival rider and the higher lance ' +
      'wins outright — Bounders pay 500, Hunters 750, Shadow Lords 1500. Each one you unhorse ' +
      'leaves an egg: grab it in mid-air for 500, let it sit and it hatches into a tougher ' +
      'rider. From wave four a hand reaches out of the lava for anyone flying low.',
    controls: ['← →', 'Space to flap', '↑ to flap'],
    colors: ['#3a0f18', '#fbbf24'],
    tags: ['classic', 'flying', 'arcade', 'joust', 'waves'],
    mount: mount
  });
})();
