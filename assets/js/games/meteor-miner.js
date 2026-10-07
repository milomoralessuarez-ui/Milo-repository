/* Meteor Miner — crack rocks in stages, haul the ore home, make quota before the horn. */
(function () {
  'use strict';
  var W = 900, H = 600, SHIFT_T = 60;
  var DEPOT = { x: 118, y: 300, r: 50 };
  var STAGE_T = { 3: 1.1, 2: .85, 1: .6 };
  var UPG = [
    { key: 'drill', name: 'Drill bit', desc: 'cracks rock 45% faster per level', base: 60, step: 50, max: 5, k: '1' },
    { key: 'thrust', name: 'Thrusters', desc: 'more push and a higher top speed', base: 50, step: 45, max: 5, k: '2' },
    { key: 'cargo', name: 'Cargo bay', desc: '+4 ore per trip', base: 40, step: 40, max: 5, k: '3' },
    { key: 'hull', name: 'Hull plating', desc: 'full repair and +1 max hull', base: 45, step: 35, max: 3, k: '4' }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.shift = 0; d.credits = 0; d.earned = 0; d.lv = { drill: 0, thrust: 0, cargo: 0, hull: 0 };
      d.ship = { x: DEPOT.x + 110, y: H / 2, vx: 0, vy: 0, ang: 0, hp: 3, maxHp: 3, inv: 0, drilling: null, spin: 0, thr: false };
      d.rocks = []; d.chunks = []; d.parts = []; d.pops = []; d.stars = [];
      for (var i = 0; i < 110; i++) d.stars.push({ x: Math.random() * W, y: Math.random() * H, s: U.rand(.5, 2), tw: Math.random() * 6.28 });
      d.cargo = 0; d.delivered = 0; d.quota = 0; d.timeLeft = SHIFT_T; d.phase = 'shift';
      d.shake = 0; d.msg = ''; d.msgT = 0; d.hover = null; d.buttons = []; d.drillT = 0; d.unloadT = 0; d.clockT = 0;
      d.alarm = false; d.ringA = 0; d.bonus = 0; d.totalOre = 0;
      startShift(g);
      g.set('Credits', 0);
    }

    function cargoMax(d) { return 6 + d.lv.cargo * 4; }
    function price(d) { return 5 + d.shift * 2; }

    function startShift(g) {
      var d = g.data, s = d.ship;
      d.shift++; d.phase = 'shift'; d.timeLeft = SHIFT_T; d.delivered = 0; d.cargo = 0; d.alarm = false; d.clockT = 0;
      d.quota = 6 + d.shift * 4;
      s.x = DEPOT.x + 110; s.y = H / 2; s.vx = s.vy = 0; s.ang = 0; s.inv = 1; s.drilling = null;
      d.rocks = []; d.chunks = [];
      var n = 4 + Math.min(6, d.shift);
      for (var i = 0; i < n; i++) spawnRock(d, i % 3 === 2 ? 2 : 3);
      d.msg = 'SHIFT ' + d.shift + '  ·  quota ' + d.quota + ' ore'; d.msgT = 2.6;
      g.set('Ore', '0 / ' + cargoMax(d)); g.set('Quota', '0 / ' + d.quota); g.set('Time', SHIFT_T);
      Milo.sound.tone({ f: 300, f2: 600, d: .3, v: .08, type: 'square' });
    }

    function spawnRock(d, size, x, y) {
      var r = size === 3 ? U.rand(44, 56) : size === 2 ? U.rand(27, 33) : U.rand(15, 19);
      if (x == null) {
        var tries = 0;
        do { x = U.rand(40, W - 40); y = U.rand(100, H - 40); tries++; }
        while ((U.dist(x, y, d.ship.x, d.ship.y) < 190 || U.dist(x, y, DEPOT.x, DEPOT.y) < DEPOT.r + r + 40) && tries < 60);
      }
      var verts = [], nv = 7 + size * 2;
      for (var i = 0; i < nv; i++) verts.push(U.rand(.76, 1.08));
      var sp = 10 + d.shift * 3 + (3 - size) * 12, a = Math.random() * 6.28;
      d.rocks.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: r, size: size, verts: verts, rot: Math.random() * 6.28, vr: U.rand(-.5, .5), dmg: 0, stage: 0, veins: U.randInt(2, 4), seed: Math.random() * 100, hit: 0 });
    }

    function spawnChunk(d, x, y) {
      var a = Math.random() * 6.28, s = U.rand(40, 120);
      d.chunks.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: Math.random() * 6.28, rot: Math.random() * 6.28, fullT: 0 });
    }

    function burst(d, x, y, col, n, spd) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.28, s = U.rand(30, spd || 200);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(.3, .8), max: .8, col: col, sz: U.rand(2, 5) });
      }
    }
    function pop(d, x, y, text, col, big) { d.pops.push({ x: x, y: y, text: text, col: col || '#fbbf24', life: 1, max: 1, big: !!big }); }

    function crack(g, rock, x, y) {
      var d = g.data;
      d.shake = Math.max(d.shake, .25);
      burst(d, x, y, '#b8b3c4', 8, 160);
      if (rock.stage >= 3) {
        d.rocks.splice(d.rocks.indexOf(rock), 1);
        var n = rock.size === 1 ? 2 : 1;
        for (var i = 0; i < n; i++) spawnChunk(d, rock.x, rock.y);
        if (rock.size > 1) {
          for (var k = 0; k < 2; k++) {
            var a = rock.rot + k * Math.PI;
            spawnRock(d, rock.size - 1, rock.x + Math.cos(a) * rock.r * .5, rock.y + Math.sin(a) * rock.r * .5);
            var nr = d.rocks[d.rocks.length - 1];
            nr.vx += Math.cos(a) * 40; nr.vy += Math.sin(a) * 40;
          }
        }
        burst(d, rock.x, rock.y, '#8f8a9c', 18, 220);
        burst(d, rock.x, rock.y, '#fbbf24', 6, 140);
        d.shake = Math.max(d.shake, .45);
        Milo.sound.tone({ f: 200, f2: 50, d: .22, v: .1, type: 'sawtooth' }); Milo.sound.noise(.2, .12, 600);
      } else {
        spawnChunk(d, x, y);
        Milo.sound.tone({ f: 520, f2: 240, d: .1, v: .07, type: 'square' });
      }
    }

    function hurt(g) {
      var d = g.data, s = d.ship;
      if (s.inv > 0) return;
      s.hp--; s.inv = 1.2; d.shake = .7;
      burst(d, s.x, s.y, '#fb7185', 14, 220);
      Milo.sound.hit();
      if (s.hp <= 0) {
        burst(d, s.x, s.y, '#22d3ee', 40, 300);
        Milo.sound.explode();
        g.gameOver({ text: 'Hull breached on shift ' + d.shift + ' with ' + d.delivered + ' of ' + d.quota + ' ore delivered. ' + U.fmt(d.earned) + ' credits earned over ' + d.totalOre + ' ore.' });
      }
    }

    function endShift(g) {
      var d = g.data;
      if (d.delivered < d.quota) {
        g.gameOver({ text: 'Quota missed — ' + d.delivered + ' of ' + d.quota + ' ore on shift ' + d.shift + '. The foreman pulled your licence. ' + U.fmt(d.earned) + ' credits earned.' });
        return;
      }
      var bonus = Math.round(Math.max(0, d.timeLeft)) * 2 + (d.delivered - d.quota) * 3;
      d.credits += bonus; d.earned += bonus; d.bonus = bonus;
      g.score = d.earned; g.set('Credits', U.fmt(d.credits));
      d.phase = 'shop'; d.msgT = 0; d.cargo = 0; d.ship.drilling = null;
      Milo.sound.powerup();
    }

    function cost(d, it) { return it.base + it.step * d.lv[it.key]; }

    function tryBuy(g, it) {
      var d = g.data, lv = d.lv[it.key];
      if (lv >= it.max) { pop(d, W / 2, 150, 'maxed out', '#aaa'); Milo.sound.click(); return; }
      var c = cost(d, it);
      if (d.credits < c) { pop(d, W / 2, 150, 'need ' + c + ' credits', '#f87171'); Milo.sound.click(); return; }
      d.credits -= c; d.lv[it.key]++;
      if (it.key === 'hull') { d.ship.maxHp++; d.ship.hp = d.ship.maxHp; }
      g.set('Credits', U.fmt(d.credits));
      Milo.sound.coin();
    }

    function layoutButtons(d) {
      var btns = [], px = W / 2 - 260, py = 132, bw = 520, bh = 46;
      UPG.forEach(function (it, i) { btns.push({ item: it, x: px + 16, y: py + 64 + i * (bh + 8), w: bw - 32, h: bh }); });
      btns.push({ start: true, x: px + 16, y: py + 64 + 4 * (bh + 8) + 6, w: bw - 32, h: 48 });
      d.buttons = btns;
      return btns;
    }

    function rockPath(c, r) {
      var n = r.verts.length;
      c.beginPath();
      for (var i = 0; i < n; i++) {
        var a = r.rot + i / n * 6.283, rr = r.r * r.verts[i];
        if (i === 0) c.moveTo(r.x + Math.cos(a) * rr, r.y + Math.sin(a) * rr);
        else c.lineTo(r.x + Math.cos(a) * rr, r.y + Math.sin(a) * rr);
      }
      c.closePath();
    }

    return Milo.arcade(host, {
      id: 'meteor-miner',
      w: W, h: H, bg: '#070b1a',
      stats: ['Credits', 'Ore', 'Quota', 'Time'],
      touch: 'dpad',
      touchButtons: [{ key: 'action', label: 'DRILL' }],
      emo: '⛏️',
      start: {
        title: 'Meteor Miner',
        text: 'Every shift is sixty seconds and a quota. Nose up to a rock and hold the drill: it ' +
          'cracks in three stages and sheds ore each time. Fly the ore back to the depot, then ' +
          'spend credits on a better drill, thrusters, cargo or hull between shifts.',
        keys: ['← → turn', '↑ thrust  ↓ brake', 'Space drill']
      },
      init: reset,

      onKey: function (g, e) {
        var d = g.data;
        if (d.phase !== 'shop') return;
        for (var i = 0; i < UPG.length; i++) if (e.key === UPG[i].k) tryBuy(g, UPG[i]);
      },

      onPointer: function (g, type, x, y) {
        var d = g.data;
        d.hover = { x: x, y: y };
        if (type !== 'down' || d.phase !== 'shop') return;
        var btns = layoutButtons(d);
        for (var i = 0; i < btns.length; i++) {
          var b = btns[i];
          if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
            if (b.start) startShift(g); else tryBuy(g, b.item);
            return;
          }
        }
      },

      update: function (g, dt) {
        var d = g.data, s = d.ship, inp = g.input;
        d.shake = Math.max(0, d.shake - dt * 3); d.msgT = Math.max(0, d.msgT - dt); d.ringA += dt * .5;
        d.parts = d.parts.filter(function (q) { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= .93; q.vy *= .93; q.life -= dt; return q.life > 0; });
        d.pops = d.pops.filter(function (q) { q.life -= dt; q.y -= 24 * dt; return q.life > 0; });
        if (d.phase === 'shop') {
          if (inp.pressed('action')) startShift(g);
          return;
        }

        d.timeLeft -= dt;
        g.set('Time', Math.max(0, Math.ceil(d.timeLeft)));
        if (d.timeLeft <= 10 && !d.alarm) { d.alarm = true; d.msg = d.delivered >= d.quota ? 'TEN SECONDS — get home' : 'TEN SECONDS — quota not met!'; d.msgT = 2; Milo.sound.tone({ f: 700, f2: 500, d: .3, v: .08, type: 'square' }); }
        if (d.alarm && Math.floor(d.timeLeft) !== Math.floor(d.timeLeft + dt) && d.timeLeft > 0) Milo.sound.tone({ f: 900, d: .05, v: .04, type: 'sine' });
        if (d.timeLeft <= 0) { endShift(g); return; }

        // ship
        var rot = (inp.down('right') ? 1 : 0) - (inp.down('left') ? 1 : 0);
        s.ang += rot * 3.6 * dt;
        s.thr = inp.down('up');
        var acc = 250 + d.lv.thrust * 55, vmax = 210 + d.lv.thrust * 45;
        if (s.thr) {
          s.vx += Math.cos(s.ang) * acc * dt; s.vy += Math.sin(s.ang) * acc * dt;
          if (g.frame % 2 === 0) d.parts.push({ x: s.x - Math.cos(s.ang) * 14, y: s.y - Math.sin(s.ang) * 14, vx: -Math.cos(s.ang) * 160 + U.rand(-30, 30), vy: -Math.sin(s.ang) * 160 + U.rand(-30, 30), life: .3, max: .3, col: U.choice(['#f97316', '#fbbf24', '#fde68a']), sz: 4 });
        }
        if (inp.down('down')) { s.vx *= Math.pow(.08, dt); s.vy *= Math.pow(.08, dt); }
        var sp = Math.hypot(s.vx, s.vy);
        if (sp > vmax) { s.vx *= vmax / sp; s.vy *= vmax / sp; }
        s.vx *= Math.pow(.55, dt); s.vy *= Math.pow(.55, dt);
        s.x += s.vx * dt; s.y += s.vy * dt;
        if (s.x < -10) s.x += W + 20; if (s.x > W + 10) s.x -= W + 20;
        if (s.y < -10) s.y += H + 20; if (s.y > H + 10) s.y -= H + 20;
        s.inv = Math.max(0, s.inv - dt);

        // drilling
        var tipX = s.x + Math.cos(s.ang) * 22, tipY = s.y + Math.sin(s.ang) * 22;
        s.drilling = null;
        if (inp.down('action')) {
          var best = null, bd = 1e9;
          for (var ri = 0; ri < d.rocks.length; ri++) {
            var rk = d.rocks[ri], dd = U.dist(tipX, tipY, rk.x, rk.y) - rk.r;
            if (dd < 6 && dd < bd) { bd = dd; best = rk; }
          }
          if (best) {
            s.drilling = best; s.spin += dt * 40; best.hit = .1;
            best.dmg += (1 + d.lv.drill * .45) * dt;
            s.vx *= Math.pow(.02, dt); s.vy *= Math.pow(.02, dt);
            if (g.frame % 2 === 0) {
              var sa = s.ang + Math.PI + U.rand(-1.2, 1.2), ss = U.rand(60, 200);
              d.parts.push({ x: tipX, y: tipY, vx: Math.cos(sa) * ss, vy: Math.sin(sa) * ss, life: U.rand(.15, .4), max: .4, col: U.choice(['#fbbf24', '#fff7d6', '#f97316']), sz: U.rand(1.5, 3.5) });
            }
            d.drillT -= dt;
            if (d.drillT <= 0) { d.drillT = .11; Milo.sound.noise(.08, .045, 900); }
            var st = Math.floor(best.dmg / STAGE_T[best.size]);
            if (st > best.stage) { best.stage = st; crack(g, best, tipX, tipY); }
          }
        }
        if (!s.drilling) s.spin += dt * 6;

        // rocks
        for (var i = 0; i < d.rocks.length; i++) {
          var r = d.rocks[i];
          r.x += r.vx * dt; r.y += r.vy * dt; r.rot += r.vr * dt; r.hit = Math.max(0, r.hit - dt);
          if (r.x < -r.r) r.x += W + r.r * 2; if (r.x > W + r.r) r.x -= W + r.r * 2;
          if (r.y < -r.r) r.y += H + r.r * 2; if (r.y > H + r.r) r.y -= H + r.r * 2;
          // depot keeps rocks off its pad
          var ddx = r.x - DEPOT.x, ddy = r.y - DEPOT.y, dl = Math.hypot(ddx, ddy), dmin = DEPOT.r + r.r + 6;
          if (dl < dmin && dl > 0) { r.x = DEPOT.x + ddx / dl * dmin; r.y = DEPOT.y + ddy / dl * dmin; var dv = r.vx * ddx / dl + r.vy * ddy / dl; if (dv < 0) { r.vx -= 2 * dv * ddx / dl; r.vy -= 2 * dv * ddy / dl; } }
          // ship collision
          var dx = s.x - r.x, dy = s.y - r.y, dist = Math.hypot(dx, dy), min = r.r + 11;
          if (dist < min && dist > 0) {
            var nx = dx / dist, ny = dy / dist;
            s.x = r.x + nx * min; s.y = r.y + ny * min;
            var rel = (s.vx - r.vx) * nx + (s.vy - r.vy) * ny;
            if (rel < 0) {
              s.vx -= 1.5 * rel * nx; s.vy -= 1.5 * rel * ny;
              r.vx += rel * nx * .3; r.vy += rel * ny * .3;
              if (rel < -150) { hurt(g); if (g.state !== 'play') return; }
              else if (rel < -60) { Milo.sound.tone({ f: 120, f2: 60, d: .08, v: .05, type: 'triangle' }); burst(d, s.x - nx * 11, s.y - ny * 11, '#94a3b8', 4, 100); }
            }
          }
        }

        // ore chunks
        var cmax = cargoMax(d);
        for (var k = d.chunks.length - 1; k >= 0; k--) {
          var ch = d.chunks[k];
          ch.t += dt; ch.rot += dt * 2;
          var cd = U.dist(ch.x, ch.y, s.x, s.y);
          if (cd < 120 && d.cargo < cmax) { ch.vx += (s.x - ch.x) / cd * 600 * dt; ch.vy += (s.y - ch.y) / cd * 600 * dt; }
          ch.x += ch.vx * dt; ch.y += ch.vy * dt; ch.vx *= Math.pow(.4, dt); ch.vy *= Math.pow(.4, dt);
          if (ch.x < 8) { ch.x = 8; ch.vx = Math.abs(ch.vx); } if (ch.x > W - 8) { ch.x = W - 8; ch.vx = -Math.abs(ch.vx); }
          if (ch.y < 8) { ch.y = 8; ch.vy = Math.abs(ch.vy); } if (ch.y > H - 8) { ch.y = H - 8; ch.vy = -Math.abs(ch.vy); }
          ch.fullT = Math.max(0, ch.fullT - dt);
          if (cd < 24) {
            if (d.cargo < cmax) {
              d.cargo++; d.chunks.splice(k, 1);
              g.set('Ore', d.cargo + ' / ' + cmax);
              burst(d, ch.x, ch.y, '#fbbf24', 6, 120);
              Milo.sound.tone({ f: 660 + d.cargo * 30, f2: 900 + d.cargo * 30, d: .08, v: .07, type: 'square' });
              if (d.cargo === cmax) { pop(d, s.x, s.y - 30, 'CARGO FULL — head home', '#fde68a'); }
            } else if (ch.fullT <= 0) { ch.fullT = 1.2; }
          }
        }

        // depot
        var atDepot = U.dist(s.x, s.y, DEPOT.x, DEPOT.y) < DEPOT.r + 16;
        if (atDepot && d.cargo > 0) {
          s.vx *= Math.pow(.2, dt); s.vy *= Math.pow(.2, dt);
          d.unloadT -= dt;
          if (d.unloadT <= 0) {
            d.unloadT = .1;
            d.cargo--; d.delivered++; d.totalOre++;
            var pr = price(d);
            d.credits += pr; d.earned += pr; g.score = d.earned;
            g.set('Credits', U.fmt(d.credits)); g.set('Ore', d.cargo + ' / ' + cmax); g.set('Quota', d.delivered + ' / ' + d.quota);
            Milo.sound.tone({ f: 800 + d.delivered * 15, d: .06, v: .06, type: 'square' });
            d.parts.push({ x: s.x, y: s.y, vx: (DEPOT.x - s.x) * 3, vy: (DEPOT.y - s.y) * 3, life: .3, max: .3, col: '#fbbf24', sz: 5 });
            if (d.delivered === d.quota) { d.msg = 'QUOTA MET — park to clock out, or keep mining'; d.msgT = 3; Milo.sound.powerup(); }
            else if (d.cargo === 0) pop(d, DEPOT.x, DEPOT.y - 70, '+' + pr * (d.delivered) + ' this trip', '#fde68a');
          }
        } else d.unloadT = 0;
        if (atDepot && d.cargo === 0 && d.delivered >= d.quota && !inp.down('up')) {
          d.clockT += dt;
          if (d.clockT >= 1.3) { endShift(g); return; }
        } else d.clockT = 0;

        if (d.rocks.length < 3 + Math.min(5, d.shift) && Math.random() < dt * .6) spawnRock(d, Math.random() < .6 ? 3 : 2);
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, s = d.ship, t = g.t;
        c.save();
        if (d.shake > 0) c.translate(U.rand(-1, 1) * d.shake * 6, U.rand(-1, 1) * d.shake * 6);
        // space
        c.fillStyle = '#070b1a'; c.fillRect(-10, -10, W + 20, H + 20);
        var neb = c.createRadialGradient(700, 140, 20, 700, 140, 420);
        neb.addColorStop(0, 'rgba(124,58,237,.22)'); neb.addColorStop(1, 'rgba(124,58,237,0)');
        c.fillStyle = neb; c.fillRect(0, 0, W, H);
        var neb2 = c.createRadialGradient(240, 520, 20, 240, 520, 380);
        neb2.addColorStop(0, 'rgba(14,165,233,.14)'); neb2.addColorStop(1, 'rgba(14,165,233,0)');
        c.fillStyle = neb2; c.fillRect(0, 0, W, H);
        d.stars.forEach(function (st) {
          c.fillStyle = 'rgba(255,255,255,' + (0.35 + Math.sin(t * 2 + st.tw) * .3) + ')';
          c.fillRect(st.x, st.y, st.s, st.s);
        });

        // depot
        var pulse = d.delivered >= d.quota ? .5 + Math.sin(t * 6) * .3 : .18;
        var dg = c.createRadialGradient(DEPOT.x, DEPOT.y, 10, DEPOT.x, DEPOT.y, DEPOT.r + 40);
        dg.addColorStop(0, 'rgba(34,211,238,' + pulse + ')'); dg.addColorStop(1, 'rgba(34,211,238,0)');
        c.fillStyle = dg; c.fillRect(DEPOT.x - 100, DEPOT.y - 100, 200, 200);
        c.strokeStyle = 'rgba(34,211,238,.5)'; c.lineWidth = 3; c.setLineDash([14, 10]); c.lineDashOffset = -d.ringA * 40;
        c.beginPath(); c.arc(DEPOT.x, DEPOT.y, DEPOT.r + 8, 0, 7); c.stroke(); c.setLineDash([]);
        c.fillStyle = '#1e293b';
        c.beginPath(); for (var hx = 0; hx < 6; hx++) { var ha = hx / 6 * 6.283 + d.ringA * .2; c.lineTo(DEPOT.x + Math.cos(ha) * DEPOT.r * .8, DEPOT.y + Math.sin(ha) * DEPOT.r * .8); } c.closePath(); c.fill();
        c.strokeStyle = '#38bdf8'; c.lineWidth = 2; c.stroke();
        c.fillStyle = '#0f172a'; c.beginPath(); c.arc(DEPOT.x, DEPOT.y, 16, 0, 7); c.fill();
        for (var li = 0; li < 6; li++) { var la = li / 6 * 6.283 + d.ringA * .2; c.fillStyle = Math.floor(t * 4 + li) % 3 ? '#22d3ee' : '#fbbf24'; c.beginPath(); c.arc(DEPOT.x + Math.cos(la) * DEPOT.r * .8, DEPOT.y + Math.sin(la) * DEPOT.r * .8, 3, 0, 7); c.fill(); }
        c.fillStyle = 'rgba(255,255,255,.7)'; c.font = '800 11px Outfit, sans-serif'; c.textAlign = 'center';
        c.fillText('DEPOT', DEPOT.x, DEPOT.y + 4);
        if (d.clockT > 0) {
          c.strokeStyle = '#fbbf24'; c.lineWidth = 5;
          c.beginPath(); c.arc(DEPOT.x, DEPOT.y, DEPOT.r + 20, -Math.PI / 2, -Math.PI / 2 + 6.283 * d.clockT / 1.3); c.stroke();
          c.fillStyle = '#fde68a'; c.fillText('CLOCKING OUT', DEPOT.x, DEPOT.y - DEPOT.r - 30);
        }

        // rocks
        d.rocks.forEach(function (r) {
          c.save();
          if (r.hit > 0) c.translate(U.rand(-1.5, 1.5), U.rand(-1.5, 1.5));
          var rg = c.createRadialGradient(r.x - r.r * .3, r.y - r.r * .3, 2, r.x, r.y, r.r * 1.1);
          rg.addColorStop(0, '#6b6578'); rg.addColorStop(1, '#2b2735');
          c.fillStyle = rg; rockPath(c, r); c.fill();
          c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 2; c.stroke();
          // ore veins glow more as the rock cracks
          for (var v = 0; v < r.veins; v++) {
            var va = r.rot + U.hash2(v, 1, r.seed) * 6.283, vr = r.r * (.25 + U.hash2(v, 2, r.seed) * .4);
            var vx = r.x + Math.cos(va) * vr, vy = r.y + Math.sin(va) * vr;
            c.shadowColor = '#fbbf24'; c.shadowBlur = 4 + r.stage * 8;
            c.fillStyle = r.stage >= 2 ? '#fde68a' : '#f59e0b';
            c.beginPath(); c.arc(vx, vy, 2 + r.size * .6 + r.stage * .5, 0, 7); c.fill();
            c.shadowBlur = 0;
          }
          // cracks
          if (r.stage > 0) {
            c.strokeStyle = 'rgba(255,240,200,' + (0.35 + r.stage * .2) + ')'; c.lineWidth = 1.5;
            for (var ck = 0; ck < r.stage * 3; ck++) {
              var ca = U.hash2(ck, 7, r.seed) * 6.283, cl = r.r * (.5 + U.hash2(ck, 9, r.seed) * .45);
              c.beginPath(); c.moveTo(r.x, r.y);
              c.lineTo(r.x + Math.cos(ca) * cl * .5, r.y + Math.sin(ca) * cl * .5);
              c.lineTo(r.x + Math.cos(ca + .35) * cl, r.y + Math.sin(ca + .35) * cl); c.stroke();
            }
          }
          c.restore();
          if (r === s.drilling) {
            var prog = (r.dmg / STAGE_T[r.size]) % 1;
            c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 4; c.beginPath(); c.arc(r.x, r.y, r.r + 8, 0, 7); c.stroke();
            c.strokeStyle = '#fbbf24'; c.beginPath(); c.arc(r.x, r.y, r.r + 8, -Math.PI / 2, -Math.PI / 2 + prog * 6.283); c.stroke();
          }
        });

        // chunks
        d.chunks.forEach(function (ch) {
          c.save(); c.translate(ch.x, ch.y + Math.sin(ch.t * 4) * 2); c.rotate(ch.rot);
          c.shadowColor = '#fbbf24'; c.shadowBlur = 10;
          c.fillStyle = '#fbbf24'; c.fillRect(-6, -6, 12, 12);
          c.fillStyle = '#fff3c4'; c.fillRect(-3, -3, 4, 4);
          c.shadowBlur = 0; c.restore();
          if (ch.fullT > 0) { c.fillStyle = 'rgba(253,230,138,' + ch.fullT + ')'; c.font = '700 10px Outfit, sans-serif'; c.textAlign = 'center'; c.fillText('full', ch.x, ch.y - 12); }
        });

        // ship
        if (!(s.inv > 0 && Math.floor(t * 18) % 2 && d.phase === 'shift')) {
          c.save(); c.translate(s.x, s.y); c.rotate(s.ang);
          if (s.thr) {
            c.fillStyle = Math.floor(t * 30) % 2 ? '#f97316' : '#fbbf24';
            c.beginPath(); c.moveTo(-12, -5); c.lineTo(-22 - Math.random() * 10, 0); c.lineTo(-12, 5); c.closePath(); c.fill();
          }
          c.shadowColor = '#22d3ee'; c.shadowBlur = 12;
          c.fillStyle = '#22d3ee';
          c.beginPath(); c.moveTo(14, 0); c.lineTo(-12, -12); c.lineTo(-6, 0); c.lineTo(-12, 12); c.closePath(); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = '#0c1a2e'; c.beginPath(); c.ellipse(2, 0, 6, 4, 0, 0, 7); c.fill();
          // drill bit
          c.fillStyle = s.drilling ? '#fde68a' : '#cbd5e1';
          c.beginPath(); c.moveTo(12, -5); c.lineTo(28, 0); c.lineTo(12, 5); c.closePath(); c.fill();
          c.fillStyle = '#475569';
          for (var dk = 0; dk < 3; dk++) { var dxp = 13 + ((s.spin * 6 + dk * 5) % 14); var hw = 5 * (1 - (dxp - 12) / 16); c.fillRect(dxp, -hw, 1.6, hw * 2); }
          c.restore();
        }

        // particles & pops
        d.parts.forEach(function (q) { c.globalAlpha = Math.max(0, q.life / q.max); c.fillStyle = q.col; c.fillRect(q.x - q.sz / 2, q.y - q.sz / 2, q.sz, q.sz); });
        c.globalAlpha = 1;
        d.pops.forEach(function (q) {
          c.globalAlpha = Math.max(0, q.life / q.max); c.fillStyle = q.col; c.textAlign = 'center';
          c.font = (q.big ? '900 22px' : '800 13px') + ' Outfit, sans-serif'; c.shadowColor = '#000'; c.shadowBlur = 6; c.fillText(q.text, q.x, q.y); c.shadowBlur = 0;
        });
        c.globalAlpha = 1;
        c.restore();

        // bottom HUD: cargo pips, quota bar, hull, timer
        var cmax = cargoMax(d);
        c.fillStyle = 'rgba(7,11,26,.7)'; U.roundRect(c, 12, H - 46, W - 24, 34, 10); c.fill();
        c.fillStyle = '#94a3b8'; c.font = '700 11px Outfit, sans-serif'; c.textAlign = 'left';
        c.fillText('CARGO', 24, H - 25);
        for (var cp = 0; cp < cmax; cp++) { c.fillStyle = cp < d.cargo ? '#fbbf24' : 'rgba(255,255,255,.12)'; U.roundRect(c, 70 + cp * 11, H - 36, 8, 16, 2); c.fill(); }
        var qx = 340, qw = 260;
        c.fillStyle = '#94a3b8'; c.fillText('QUOTA', qx - 48, H - 25);
        c.fillStyle = 'rgba(255,255,255,.12)'; U.roundRect(c, qx, H - 35, qw, 14, 7); c.fill();
        var qf = U.clamp(d.delivered / d.quota, 0, 1);
        c.fillStyle = qf >= 1 ? '#34d399' : '#38bdf8'; U.roundRect(c, qx, H - 35, qw * qf, 14, 7); c.fill();
        c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText(d.delivered + ' / ' + d.quota + ' ore  ·  ' + price(d) + ' cr each', qx + qw / 2, H - 24);
        c.textAlign = 'left'; c.fillStyle = '#94a3b8'; c.fillText('HULL', 640, H - 25);
        for (var hp = 0; hp < s.maxHp; hp++) { c.fillStyle = hp < s.hp ? (s.hp === 1 && Math.floor(t * 4) % 2 ? '#fb7185' : '#34d399') : 'rgba(255,255,255,.12)'; U.roundRect(c, 676 + hp * 16, H - 36, 12, 16, 3); c.fill(); }
        var tl = Math.max(0, d.timeLeft);
        c.fillStyle = tl <= 10 ? (Math.floor(t * 4) % 2 ? '#fb7185' : '#fff') : '#fff';
        c.font = '900 20px Outfit, sans-serif'; c.textAlign = 'right';
        c.fillText(d.phase === 'shop' ? '—' : Math.ceil(tl) + 's', W - 26, H - 21);

        if (d.msgT > 0) {
          c.globalAlpha = Math.min(1, d.msgT); c.fillStyle = '#fde68a'; c.font = '900 26px Outfit, sans-serif'; c.textAlign = 'center';
          c.shadowColor = '#000'; c.shadowBlur = 10; c.fillText(d.msg, W / 2, 140); c.shadowBlur = 0; c.globalAlpha = 1;
        }

        // shop
        if (d.phase === 'shop') {
          c.fillStyle = 'rgba(7,11,26,.72)'; c.fillRect(0, 0, W, H);
          var btns = layoutButtons(d), px = W / 2 - 260, py = 132;
          c.fillStyle = '#0f172a'; U.roundRect(c, px, py, 520, 356, 14); c.fill();
          c.strokeStyle = '#22d3ee'; c.lineWidth = 2; U.roundRect(c, px, py, 520, 356, 14); c.stroke();
          c.fillStyle = '#fff'; c.font = '900 22px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText('SHIFT ' + d.shift + ' COMPLETE', W / 2, py + 30);
          c.fillStyle = '#fde68a'; c.font = '600 12px Outfit, sans-serif';
          c.fillText('+' + d.bonus + ' bonus for time and extra ore  ·  ' + U.fmt(d.credits) + ' credits to spend', W / 2, py + 50);
          btns.forEach(function (b) {
            var hov = d.hover && d.hover.x >= b.x && d.hover.x <= b.x + b.w && d.hover.y >= b.y && d.hover.y <= b.y + b.h;
            if (b.start) {
              c.fillStyle = hov ? '#0891b2' : '#0e7490'; U.roundRect(c, b.x, b.y, b.w, b.h, 10); c.fill();
              c.fillStyle = '#fff'; c.font = '800 16px Outfit, sans-serif'; c.textAlign = 'center';
              c.fillText('▶  Start shift ' + (d.shift + 1) + '  —  quota ' + (6 + (d.shift + 1) * 4) + ' ore, ' + (5 + (d.shift + 1) * 2) + ' cr each', b.x + b.w / 2, b.y + 30);
              return;
            }
            var it = b.item, lv = d.lv[it.key], maxed = lv >= it.max, cst = cost(d, it), can = !maxed && d.credits >= cst;
            c.fillStyle = hov ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.07)'; U.roundRect(c, b.x, b.y, b.w, b.h, 8); c.fill();
            c.fillStyle = can ? '#fff' : 'rgba(255,255,255,.4)'; c.font = '800 14px Outfit, sans-serif'; c.textAlign = 'left';
            c.fillText(it.k + '   ' + it.name, b.x + 14, b.y + 20);
            c.fillStyle = 'rgba(255,255,255,.5)'; c.font = '500 11px Outfit, sans-serif';
            c.fillText(it.desc, b.x + 14, b.y + 36);
            for (var p = 0; p < it.max; p++) { c.fillStyle = p < lv ? '#22d3ee' : 'rgba(255,255,255,.15)'; U.roundRect(c, b.x + 300 + p * 14, b.y + 18, 10, 10, 2); c.fill(); }
            c.fillStyle = maxed ? '#34d399' : can ? '#fde68a' : '#f87171'; c.font = '800 14px Outfit, sans-serif'; c.textAlign = 'right';
            c.fillText(maxed ? 'MAX' : cst + ' cr', b.x + b.w - 14, b.y + 28);
          });
          c.fillStyle = 'rgba(255,255,255,.45)'; c.font = '600 11px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText('1–4 or click to buy  ·  Space / Enter to start', W / 2, py + 346);
        }
      }
    });
  }

  window.Milo.register({
    id: 'meteor-miner', title: 'Meteor Miner', emo: '⛏️', category: 'Action',
    tagline: 'Crack rocks in stages, make quota before the horn',
    description: 'Asteroids with a day job. Each shift is sixty seconds with an ore quota that ' +
      'climbs by four every time; nose up to a rock and hold Space to drill it, and it cracks ' +
      'in three stages, shedding a glowing ore chunk at each one before it splits into two ' +
      'smaller rocks. Ore only counts once you fly it back to the depot, your cargo bay holds ' +
      'six to start, and ramming a rock at speed costs hull. Between shifts you spend credits ' +
      'on the drill, thrusters, cargo bay or hull, and once quota is met you can park at the ' +
      'depot to clock out early for a time bonus or push your luck for extra ore. Tip: brake ' +
      'with the down key before the drill bites — a drifting ship drills in bursts.',
    controls: ['← → turn', '↑ thrust', '↓ brake', 'Space drill'],
    colors: ['#070b1a', '#fbbf24'],
    tags: ['mining', 'asteroids', 'upgrades', 'quota', 'action'],
    mount: mount
  });
})();
