/* Truck Haul — forty tonnes downhill, and the brakes only work while they are cold. */
(function () {
  'use strict';
  var W = 900, H = 560, TAU = Math.PI * 2;
  var STEP = 20;
  var GACC = 620, BRAKE = 430, DRAGC = 0.0016;
  var GEARS = [
    { name: '1', eb: 210, top: 70 },
    { name: '2', eb: 158, top: 118 },
    { name: '3', eb: 116, top: 175 },
    { name: '4', eb: 82, top: 240 },
    { name: '5', eb: 54, top: 310 },
    { name: '6', eb: 32, top: 400 }
  ];

  var ROUTES = [
    { name: 'Pine Grade', len: 8200, steep: 0.9, pay: 420, cargo: 'Timber' },
    { name: 'Copper Pass', len: 9400, steep: 1.05, pay: 580, cargo: 'Ore' },
    { name: 'Devil\'s Elbow', len: 10200, steep: 1.2, pay: 760, cargo: 'Sheet glass' },
    { name: 'Cold Spring Drop', len: 11000, steep: 1.34, pay: 1000, cargo: 'Turbine blade' },
    { name: 'The Long Descent', len: 12400, steep: 1.5, pay: 1400, cargo: 'Reactor vessel' }
  ];

  var UPGRADES = [
    { key: 'brakes', name: 'Brake package', desc: 'Bigger drums cool faster and fade later.', cost: [380, 620, 980] },
    { key: 'straps', name: 'Load straps', desc: 'The cargo shifts less, so you lean less.', cost: [320, 540, 880] },
    { key: 'engine', name: 'Engine brake', desc: 'Stronger retarder: hold speed without the pedal.', cost: [460, 760, 1200] }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    /* ------------------------------------------------------------ route */

    function buildRoute(r, seed) {
      var n = Math.ceil(r.len / STEP) + 40;
      var hs = new Array(n), y = 0, i;
      for (i = 0; i < n; i++) {
        var s = i * STEP;
        var grade = 0.055 * r.steep * (1 + 0.55 * Math.sin(s * 0.00062 + seed) + 0.3 * Math.sin(s * 0.0017 + seed * 2));
        if (s < 400) grade *= s / 400;
        if (s > r.len - 500) grade *= Math.max(0, (r.len + 100 - s) / 600);
        hs[i] = y;
        y += Math.max(0, grade) * STEP;
      }
      var corners = [], s2 = 900;
      while (s2 < r.len - 700) {
        var tight = U.hash2((s2 / 71) | 0, 3, seed | 0);
        var lim = 92 + tight * 130 - r.steep * 22;
        corners.push({ s: s2, len: 260 + tight * 200, lim: Math.round(lim), dir: tight > .5 ? 1 : -1 });
        s2 += 620 + tight * 640;
      }
      var ramps = [{ s: r.len * 0.42 }, { s: r.len * 0.72 }];
      return { hs: hs, corners: corners, ramps: ramps, len: r.len, name: r.name, def: r };
    }

    function hAt(d, s) {
      var f = s / STEP, i = Math.floor(f);
      var hs = d.route.hs;
      if (i < 0) return hs[0];
      if (i >= hs.length - 1) return hs[hs.length - 1];
      return U.lerp(hs[i], hs[i + 1], f - i);
    }
    function slopeAt(d, s) { return Math.atan2(hAt(d, s + 40) - hAt(d, s - 40), 80); }

    function cornerAt(d, s) {
      var cs = d.route.corners;
      for (var i = 0; i < cs.length; i++) {
        if (s >= cs[i].s && s <= cs[i].s + cs[i].len) return cs[i];
      }
      return null;
    }
    function nextCorner(d, s) {
      var cs = d.route.corners;
      for (var i = 0; i < cs.length; i++) if (cs[i].s + cs[i].len > s) return cs[i];
      return null;
    }

    /* ----------------------------------------------------------- state */

    function startRun(g) {
      var d = g.data;
      d.route = buildRoute(ROUTES[d.leg], d.leg * 1.7 + 1);
      d.s = 60;
      d.v = 40;
      d.gear = 2;
      d.heat = 12;
      d.lean = 0;
      d.damage = 0;
      d.phase = 'drive';
      d.msg = 'Roll it out — ' + ROUTES[d.leg].cargo + ' on the back';
      d.msgT = 2.6;
      d.runT = 0;
      d.parts = [];
      d.tookRamp = false;
      d.warnT = 0;
      d.camX = 0; d.camY = 0;
      g.set('Speed', 0);
      g.set('Brakes', '12%');
      g.set('Load', 'OK');
      g.set('Paid', '$' + d.money);
    }

    function reset(g) {
      var d = g.data;
      d.money = 0;
      d.earned = 0;
      d.leg = 0;
      d.lvl = { brakes: 0, straps: 0, engine: 0 };
      d.sel = 0;
      startRun(g);
    }

    function brakePower(d) { return BRAKE * (1 + d.lvl.brakes * 0.16); }
    function coolRate(d) { return 8 + d.lvl.brakes * 4.2; }
    function heatRate(d) { return 0.00023 / (1 + d.lvl.brakes * 0.28); }
    function strapK(d) { return 0.0062 / (1 + d.lvl.straps * 0.42); }
    function ebMul(d) { return 1 + d.lvl.engine * 0.3; }

    function say(d, t, dur) { d.msg = t; d.msgT = dur || 2.2; }

    function finishLeg(g, half) {
      var d = g.data;
      var r = ROUTES[d.leg];
      var pay = Math.round(r.pay * (1 - d.damage / 100) * (half ? 0.45 : 1));
      var bonus = half ? 0 : Math.max(0, Math.round(140 - d.runT * 1.4));
      d.lastPay = pay; d.lastBonus = bonus; d.lastHalf = half;
      d.money += pay + bonus;
      d.earned += pay + bonus;
      d.phase = 'shop';
      d.sel = 0;
      Milo.sound.win();
      g.score = d.earned;
    }

    function wreck(g, why) {
      var d = g.data;
      d.phase = 'wreck';
      d.wreckT = 1.5;
      d.why = why;
      Milo.sound.explode();
      for (var i = 0; i < 30; i++) {
        var a = Math.random() * TAU, sp = U.rand(60, 320);
        d.parts.push({ x: 0, y: 0, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120, t: U.rand(.4, 1), max: 1,
          col: U.choice(['#fb7185', '#ffd257', '#fff', '#8a6136']) });
      }
    }

    function buy(g, i) {
      var d = g.data;
      var up = UPGRADES[i];
      var lv = d.lvl[up.key];
      if (lv >= 3) { say(d, up.name + ' is already maxed'); return; }
      var cost = up.cost[lv];
      if (d.money < cost) { say(d, 'Not enough in the account for that'); Milo.sound.hit(); return; }
      d.money -= cost;
      d.lvl[up.key] = lv + 1;
      say(d, up.name + ' upgraded to level ' + (lv + 1));
      Milo.sound.powerup();
    }

    return Milo.arcade(host, {
      id: 'truck-haul',
      w: W, h: H, bg: '#101a26',
      stats: ['Speed', 'Brakes', 'Load', 'Paid'],
      touch: 'dpad',
      touchButtons: [{ key: 'action', label: 'A' }],
      emo: '🚛',
      start: {
        title: 'Truck Haul',
        text: 'Five loads down five mountain roads. Gravity does the driving; your job is to ' +
          'arrive. The service brakes fade if you lean on them, so hold the speed with a low gear, ' +
          'and take every corner under its posted limit or the load shifts and puts you on your side.',
        keys: ['↓ brake', '↑ throttle', '← → gears', 'Space runaway ramp']
      },
      init: reset,

      onKey: function (g, e, name) {
        var d = g.data;
        if (d.phase === 'drive') {
          if (name === 'right' && d.gear < GEARS.length - 1) { d.gear++; Milo.sound.click(); }
          if (name === 'left' && d.gear > 0) { d.gear--; Milo.sound.click(); }
          if (name === 'action') tryRamp(g);
        } else if (d.phase === 'shop') {
          if (name === 'right') { d.sel = (d.sel + 1) % 4; Milo.sound.blip(); }
          if (name === 'left') { d.sel = (d.sel + 3) % 4; Milo.sound.blip(); }
          if (name === 'action' || name === 'up') {
            if (d.sel === 3) nextLeg(g); else buy(g, d.sel);
          }
        }
      },
      onPointer: function (g, type, x) {
        var d = g.data;
        if (type !== 'down') return;
        if (d.phase === 'shop') {
          d.sel = U.clamp(Math.floor(x / (W / 4)), 0, 3);
          if (d.sel === 3) nextLeg(g); else buy(g, d.sel);
        } else if (d.phase === 'drive' && g.input.py < H * 0.4) tryRamp(g);
      },

      update: function (g, dt) {
        var d = g.data, inp = g.input, i;
        if (d.msgT > 0) d.msgT -= dt;

        for (i = d.parts.length - 1; i >= 0; i--) {
          var p = d.parts[i];
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 900 * dt; p.t -= dt;
          if (p.t <= 0) d.parts.splice(i, 1);
        }

        if (d.phase === 'wreck') {
          d.wreckT -= dt;
          if (d.wreckT <= 0) {
            g.gameOver({
              emo: '🚨',
              title: d.why === 'tip' ? 'Rolled it' : 'Off the edge',
              text: d.why === 'tip'
                ? 'The load went over before the truck did, on ' + ROUTES[d.leg].name + '.'
                : 'Too much speed and nothing left in the brakes on ' + ROUTES[d.leg].name + '.' +
                ' Earned $' + U.fmt(d.earned) + ' over ' + d.leg + ' delivered load' + (d.leg === 1 ? '' : 's') + '.',
              score: d.earned
            });
          }
          return;
        }
        if (d.phase !== 'drive') return;

        d.runT += dt;
        var thr = inp.down('up');
        var brk = inp.down('down') || (inp.pdown && inp.py > H * .6);
        var gear = GEARS[d.gear];
        var slope = slopeAt(d, d.s);

        // gravity along the road
        var a = GACC * Math.sin(slope);
        if (thr) a += 90 * (1 - d.v / Math.max(40, gear.top * 1.25));
        // engine braking only bites below the gear's top speed
        var eb = gear.eb * ebMul(d);
        if (d.v > gear.top) {
          a -= eb * 1.35;                    // over-revving: it holds hard and complains
          if (g.frame % 4 === 0) Milo.sound.tone({ f: 180 + d.v, d: .05, v: .05, type: 'sawtooth' });
          if (d.v > gear.top * 1.45) {
            d.damage += 5 * dt;
            if (d.warnT <= 0) { say(d, 'Over-revving — change up!', 1.4); d.warnT = 2; }
          }
        } else if (!thr) {
          a -= eb * (0.35 + 0.65 * (d.v / gear.top));
        }
        if (d.warnT > 0) d.warnT -= dt;

        // service brakes and heat
        var fade = d.heat > 88 ? U.clamp(1 - (d.heat - 88) / 24, 0.16, 1) : 1;
        if (brk) {
          a -= brakePower(d) * fade;
          d.heat += brakePower(d) * fade * d.v * heatRate(d);
          if (d.heat > 96 && g.frame % 8 === 0) {
            d.parts.push({ x: U.rand(-30, 30), y: U.rand(-6, 10), vx: U.rand(-20, 20), vy: -50,
              t: .8, max: .8, col: '#cfd6e6' });
          }
        }
        d.heat = U.clamp(d.heat - coolRate(d) * dt, 0, 130);
        a -= DRAGC * d.v * d.v;

        d.v = Math.max(0, d.v + a * dt);
        d.s += d.v * dt;

        if (g.frame % 6 === 0 && d.v > 20) {
          Milo.sound.tone({ f: 46 + d.v * .22, d: .06, v: .035, type: 'sawtooth' });
        }

        // the corner, and what the load thinks of it
        var cor = cornerAt(d, d.s);
        if (cor) {
          var over = d.v - cor.lim;
          if (over > 0) d.lean += over * strapK(d) * dt;
          else d.lean -= 0.5 * dt;
          if (brk) d.lean += 0.28 * dt * (1 + d.v / 220);
        } else {
          d.lean -= 1.1 * dt;
        }
        d.lean = U.clamp(d.lean, 0, 1.35);
        if (d.lean > 0.58) d.damage += (d.lean - 0.58) * 26 * dt;
        if (d.lean >= 1) { wreck(g, 'tip'); return; }
        if (d.heat >= 128 && d.v > 320) { wreck(g, 'brakes'); return; }

        d.damage = Math.min(100, d.damage);

        if (d.s >= d.route.len) { finishLeg(g, false); return; }

        d.camX = U.lerp(d.camX, d.s - W * 0.34, Math.min(1, dt * 8));
        d.camY = U.lerp(d.camY, hAt(d, d.s) - H * 0.44, Math.min(1, dt * 6));

        g.set('Speed', Math.round(d.v * .42));
        g.set('Brakes', Math.round(d.heat) + '%');
        g.set('Load', d.lean > .78 ? 'TIPPING' : d.lean > .45 ? 'SHIFTING' : 'OK');
        g.set('Paid', '$' + U.fmt(d.money));
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        if (d.phase === 'shop') { drawShop(g, c, d); return; }
        render(g, c, d);
      }
    });

    function tryRamp(g) {
      var d = g.data;
      if (d.phase !== 'drive') return;
      for (var i = 0; i < d.route.ramps.length; i++) {
        if (Math.abs(d.route.ramps[i].s - d.s) < 180) {
          d.tookRamp = true;
          say(d, 'Into the gravel arrester — load saved, pay halved');
          Milo.sound.blip();
          finishLeg(g, true);
          return;
        }
      }
      say(d, 'No runaway ramp here', 1.2);
    }

    function nextLeg(g) {
      var d = g.data;
      if (d.leg + 1 >= ROUTES.length) {
        g.win({
          emo: '🏔️', title: 'All five loads down',
          text: 'Every route run and every load delivered, for $' + U.fmt(d.earned) + ' earned.',
          score: d.earned
        });
        return;
      }
      d.leg++;
      startRun(g);
    }

    /* ------------------------------------------------------------ paint */

    function render(g, c, d) {
      var i;
      var sky = c.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#16263d'); sky.addColorStop(.55, '#3a5470'); sky.addColorStop(1, '#8a7a72');
      c.fillStyle = sky; c.fillRect(0, 0, W, H);

      for (var layer = 0; layer < 2; layer++) {
        var pr = layer === 0 ? .18 : .4;
        c.fillStyle = layer === 0 ? 'rgba(24,38,58,.95)' : 'rgba(34,50,70,.95)';
        c.beginPath(); c.moveTo(-10, H);
        for (var bx = -10; bx <= W + 30; bx += 26) {
          var wx = (d.camX * pr + bx) * .0016;
          c.lineTo(bx, 300 - d.camY * pr * .35 - U.noise2(wx, layer * 7 + 2, 4) * 170);
        }
        c.lineTo(W + 30, H); c.closePath(); c.fill();
      }

      c.save();
      c.translate(-d.camX, -d.camY);

      var s0 = Math.max(0, d.camX - 60), s1 = d.camX + W + 60;
      // road
      c.beginPath();
      c.moveTo(s0, hAt(d, s0));
      for (i = s0; i <= s1; i += STEP) c.lineTo(i, hAt(d, i));
      c.lineTo(s1, d.camY + H + 500);
      c.lineTo(s0, d.camY + H + 500);
      c.closePath();
      var rock = c.createLinearGradient(0, d.camY, 0, d.camY + H);
      rock.addColorStop(0, '#5a5148'); rock.addColorStop(1, '#221c18');
      c.fillStyle = rock; c.fill();
      c.strokeStyle = '#2f3644'; c.lineWidth = 16;
      c.beginPath();
      for (i = s0; i <= s1; i += STEP) c.lineTo(i, hAt(d, i) - 4);
      c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2;
      c.setLineDash([26, 26]);
      c.beginPath();
      for (i = s0; i <= s1; i += STEP) c.lineTo(i, hAt(d, i) - 4);
      c.stroke();
      c.setLineDash([]);

      // corner sections + signs
      for (i = 0; i < d.route.corners.length; i++) {
        var cor = d.route.corners[i];
        if (cor.s + cor.len < s0 - 400 || cor.s > s1) continue;
        c.fillStyle = 'rgba(255,180,32,.16)';
        for (var cs = cor.s; cs < cor.s + cor.len; cs += STEP) {
          c.fillRect(cs, hAt(d, cs) - 46, STEP + 1, 42);
        }
        var sx = cor.s - 280, sy = hAt(d, sx);
        c.fillStyle = '#5a5f70';
        c.fillRect(sx, sy - 74, 6, 62);
        c.fillStyle = '#ffd257';
        U.roundRect(c, sx - 28, sy - 116, 62, 46, 6); c.fill();
        c.fillStyle = '#1b2030';
        c.font = 'bold 22px system-ui,sans-serif'; c.textAlign = 'center';
        c.fillText(String(Math.round(cor.lim * .42)), sx + 3, sy - 86);
        c.font = 'bold 10px system-ui,sans-serif';
        c.fillText(cor.dir > 0 ? 'RIGHT' : 'LEFT', sx + 3, sy - 74);
        c.textAlign = 'left';
      }

      // runaway ramps
      for (i = 0; i < d.route.ramps.length; i++) {
        var rs = d.route.ramps[i].s;
        if (rs < s0 - 300 || rs > s1) continue;
        var ry = hAt(d, rs);
        c.fillStyle = '#9a8468';
        c.beginPath();
        c.moveTo(rs - 90, ry - 4); c.lineTo(rs + 90, ry - 74); c.lineTo(rs + 90, ry - 4);
        c.closePath(); c.fill();
        c.fillStyle = '#4ade80'; c.font = 'bold 12px system-ui,sans-serif';
        c.fillText('RUNAWAY RAMP · SPACE', rs - 86, ry - 88);
      }

      drawTruck(c, d);

      for (i = 0; i < d.parts.length; i++) {
        var p = d.parts[i];
        c.globalAlpha = Math.max(0, p.t / p.max);
        c.fillStyle = p.col;
        c.fillRect(d.s + p.x - 3, hAt(d, d.s) + p.y - 3, 6, 6);
      }
      c.globalAlpha = 1;
      c.restore();

      drawHud(g, c, d);
    }

    function drawTruck(c, d) {
      var ang = slopeAt(d, d.s);
      var lean = d.lean;
      c.save();
      c.translate(d.s, hAt(d, d.s) - 6);
      c.rotate(ang);
      if (d.phase === 'wreck') c.rotate(Math.min(1.4, (1.5 - d.wreckT) * 1.6));

      // trailer
      c.save();
      c.translate(-72, 0);
      c.rotate(-lean * 0.16);
      c.fillStyle = '#14161f';
      c.beginPath(); c.arc(-26, -10, 12, 0, TAU); c.fill();
      c.beginPath(); c.arc(0, -10, 12, 0, TAU); c.fill();
      c.fillStyle = '#39445c';
      U.roundRect(c, -62, -58, 122, 44, 5); c.fill();
      c.fillStyle = lean > .7 ? '#fb7185' : lean > .45 ? '#ffd257' : '#8a93ad';
      U.roundRect(c, -56, -54 - lean * 5, 110, 12, 3); c.fill();
      c.fillStyle = '#2a3142';
      c.fillRect(-62, -18, 122, 6);
      c.restore();

      // cab
      c.fillStyle = '#14161f';
      c.beginPath(); c.arc(30, -10, 13, 0, TAU); c.fill();
      c.beginPath(); c.arc(-4, -10, 13, 0, TAU); c.fill();
      c.fillStyle = '#e63946';
      U.roundRect(c, -18, -46, 62, 36, 6); c.fill();
      c.fillStyle = '#ffd6da';
      U.roundRect(c, 10, -62, 32, 20, 5); c.fill();
      c.fillStyle = 'rgba(12,18,34,.8)';
      U.roundRect(c, 14, -58, 26, 13, 3); c.fill();
      c.fillStyle = '#ffd257';
      c.fillRect(40, -24, 8, 7);
      c.fillStyle = '#5a6278';
      c.fillRect(6, -74, 5, 14);
      c.restore();
    }

    function drawHud(g, c, d) {
      var i;
      // gears
      c.fillStyle = 'rgba(8,12,24,.78)';
      U.roundRect(c, 16, H - 96, 178, 80, 10); c.fill();
      c.fillStyle = '#9fb0d8'; c.font = '11px system-ui,sans-serif';
      c.fillText('GEAR', 28, H - 78);
      for (i = 0; i < GEARS.length; i++) {
        c.fillStyle = i === d.gear ? '#ffd257' : 'rgba(255,255,255,.14)';
        U.roundRect(c, 28 + i * 26, H - 70, 22, 26, 5); c.fill();
        c.fillStyle = i === d.gear ? '#1b2030' : '#8f9bc4';
        c.font = 'bold 14px system-ui,sans-serif'; c.textAlign = 'center';
        c.fillText(GEARS[i].name, 39 + i * 26, H - 52);
        c.textAlign = 'left';
      }
      c.fillStyle = '#7d88ad'; c.font = '11px system-ui,sans-serif';
      c.fillText('holds to ' + Math.round(GEARS[d.gear].top * .42) + ' km/h', 28, H - 26);

      // brake heat
      c.fillStyle = 'rgba(8,12,24,.78)';
      U.roundRect(c, 210, H - 96, 220, 46, 10); c.fill();
      c.fillStyle = '#9fb0d8'; c.font = '11px system-ui,sans-serif';
      c.fillText('BRAKE TEMPERATURE', 222, H - 78);
      c.fillStyle = 'rgba(255,255,255,.14)';
      U.roundRect(c, 222, H - 72, 196, 12, 6); c.fill();
      var ht = U.clamp(d.heat / 110, 0, 1);
      c.fillStyle = d.heat > 88 ? '#fb7185' : d.heat > 60 ? '#ffd257' : '#4ade80';
      U.roundRect(c, 222, H - 72, 196 * ht, 12, 6); c.fill();
      c.fillStyle = 'rgba(255,255,255,.5)';
      c.fillRect(222 + 196 * 0.8, H - 76, 2, 20);
      if (d.heat > 88) {
        c.fillStyle = '#fb7185'; c.font = 'bold 13px system-ui,sans-serif';
        c.fillText('FADE', 380, H - 78);
      }

      // load lean
      c.fillStyle = 'rgba(8,12,24,.78)';
      U.roundRect(c, 446, H - 96, 200, 46, 10); c.fill();
      c.fillStyle = '#9fb0d8'; c.font = '11px system-ui,sans-serif';
      c.fillText('LOAD', 458, H - 78);
      c.fillStyle = 'rgba(255,255,255,.14)';
      U.roundRect(c, 458, H - 72, 176, 12, 6); c.fill();
      c.fillStyle = d.lean > .78 ? '#fb7185' : d.lean > .45 ? '#ffd257' : '#4ade80';
      U.roundRect(c, 458, H - 72, 176 * U.clamp(d.lean, 0, 1), 12, 6); c.fill();

      // route progress
      var prog = U.clamp(d.s / d.route.len, 0, 1);
      c.fillStyle = 'rgba(8,12,24,.78)';
      U.roundRect(c, W - 236, 96, 220, 58, 10); c.fill();
      c.fillStyle = '#fff'; c.font = 'bold 14px system-ui,sans-serif';
      c.fillText(d.route.name, W - 224, 116);
      c.fillStyle = 'rgba(255,255,255,.14)';
      U.roundRect(c, W - 224, 124, 196, 10, 5); c.fill();
      c.fillStyle = '#22d3ee';
      U.roundRect(c, W - 224, 124, 196 * prog, 10, 5); c.fill();
      c.fillStyle = '#7d88ad'; c.font = '11px system-ui,sans-serif';
      c.fillText(ROUTES[d.leg].cargo + '  ·  load ' + (d.leg + 1) + '/5  ·  damage ' +
        Math.round(d.damage) + '%', W - 224, 148);

      // upcoming corner
      var nc = nextCorner(d, d.s);
      if (nc) {
        var away = Math.max(0, Math.round((nc.s - d.s) / 3));
        var inside = d.s >= nc.s;
        c.textAlign = 'center';
        c.fillStyle = 'rgba(8,12,24,.8)';
        U.roundRect(c, W / 2 - 132, 96, 264, 48, 10); c.fill();
        c.fillStyle = inside ? (d.v > nc.lim ? '#fb7185' : '#4ade80') : '#ffd257';
        c.font = 'bold 17px system-ui,sans-serif';
        c.fillText(inside ? 'IN THE CORNER · limit ' + Math.round(nc.lim * .42)
          : 'Corner in ' + away + ' m · limit ' + Math.round(nc.lim * .42), W / 2, 122);
        c.fillStyle = '#9fb0d8'; c.font = '12px system-ui,sans-serif';
        c.fillText('you are doing ' + Math.round(d.v * .42) + ' km/h', W / 2, 138);
        c.textAlign = 'left';
      }

      if (d.msgT > 0) {
        c.textAlign = 'center';
        c.globalAlpha = Math.min(1, d.msgT);
        c.fillStyle = '#fff'; c.font = 'bold 17px system-ui,sans-serif';
        c.fillText(d.msg, W / 2, 180);
        c.globalAlpha = 1;
        c.textAlign = 'left';
      }
    }

    function drawShop(g, c, d) {
      var i;
      c.fillStyle = '#0e1420'; c.fillRect(0, 0, W, H);
      c.textAlign = 'center';
      c.fillStyle = '#4ade80'; c.font = 'bold 30px system-ui,sans-serif';
      c.fillText(d.lastHalf ? 'Load saved on the arrester bed' : 'Delivered: ' + ROUTES[d.leg].cargo, W / 2, 128);
      c.fillStyle = '#dfe5ff'; c.font = '16px system-ui,sans-serif';
      c.fillText('$' + U.fmt(d.lastPay) + ' for the load' +
        (d.lastBonus ? ' + $' + d.lastBonus + ' early' : '') +
        '  ·  ' + Math.round(d.damage) + '% cargo damage', W / 2, 158);
      c.fillStyle = '#ffd257'; c.font = 'bold 22px system-ui,sans-serif';
      c.fillText('Account: $' + U.fmt(d.money), W / 2, 194);

      for (i = 0; i < 3; i++) {
        var up = UPGRADES[i], lv = d.lvl[up.key];
        var x = 40 + i * 230, y = 224;
        var sel = d.sel === i;
        c.fillStyle = sel ? 'rgba(124,92,255,.22)' : 'rgba(255,255,255,.05)';
        U.roundRect(c, x, y, 210, 190, 12); c.fill();
        if (sel) { c.strokeStyle = '#a78bfa'; c.lineWidth = 2; c.stroke(); }
        c.fillStyle = '#fff'; c.font = 'bold 16px system-ui,sans-serif';
        c.fillText(up.name, x + 105, y + 32);
        c.fillStyle = '#8f9bc4'; c.font = '12px system-ui,sans-serif';
        wrapText(c, up.desc, x + 105, y + 58, 186, 16);
        for (var k = 0; k < 3; k++) {
          c.fillStyle = k < lv ? '#4ade80' : 'rgba(255,255,255,.16)';
          U.roundRect(c, x + 46 + k * 42, y + 106, 32, 12, 6); c.fill();
        }
        c.fillStyle = lv >= 3 ? '#4ade80' : (d.money >= up.cost[lv] ? '#ffd257' : '#fb7185');
        c.font = 'bold 18px system-ui,sans-serif';
        c.fillText(lv >= 3 ? 'MAXED' : '$' + up.cost[lv], x + 105, y + 152);
      }

      var bx = 730, by = 224, bsel = d.sel === 3;
      c.fillStyle = bsel ? 'rgba(74,222,128,.25)' : 'rgba(255,255,255,.05)';
      U.roundRect(c, bx, by, 130, 190, 12); c.fill();
      if (bsel) { c.strokeStyle = '#4ade80'; c.lineWidth = 2; c.stroke(); }
      c.fillStyle = '#4ade80'; c.font = 'bold 18px system-ui,sans-serif';
      c.fillText(d.leg + 1 >= ROUTES.length ? 'FINISH' : 'NEXT', bx + 65, by + 92);
      c.fillStyle = '#9fb0d8'; c.font = '12px system-ui,sans-serif';
      c.fillText(d.leg + 1 >= ROUTES.length ? 'Cash out' : ROUTES[d.leg + 1].name, bx + 65, by + 116);

      c.fillStyle = '#7d88ad'; c.font = '14px system-ui,sans-serif';
      c.fillText('← →  choose      Space  buy / go', W / 2, 470);
      if (d.msgT > 0) {
        c.globalAlpha = Math.min(1, d.msgT);
        c.fillStyle = '#ffd257'; c.font = 'bold 15px system-ui,sans-serif';
        c.fillText(d.msg, W / 2, 500);
        c.globalAlpha = 1;
      }
      c.textAlign = 'left';
    }

    function wrapText(c, txt, x, y, maxw, lh) {
      var words = txt.split(' '), line = '', n = 0;
      for (var i = 0; i < words.length; i++) {
        var test = line + words[i] + ' ';
        if (c.measureText(test).width > maxw && line) { c.fillText(line, x, y + n * lh); line = words[i] + ' '; n++; }
        else line = test;
      }
      c.fillText(line, x, y + n * lh);
    }
  }

  window.Milo.register({
    id: 'truck-haul', title: 'Truck Haul', emo: '🚛', category: 'Racing',
    tagline: 'Gravity drives, you just arrive',
    description: 'Five loads down five mountain descents, where the enemy is momentum rather ' +
      'than a rival. Riding the service brakes cooks them: the temperature gauge climbs while you ' +
      'are on the pedal and past 88% they fade to almost nothing, so the speed has to be held with ' +
      'a low gear and the engine brake instead. Every corner carries a posted limit, and arriving ' +
      'over it shifts the load sideways — the lean bar climbs, the cargo takes damage, and at full ' +
      'lean the trailer puts you on your side. Gravel arrester beds will save the truck for half ' +
      'the money. Pay buys brakes, straps and a stronger retarder for the next run.',
    controls: ['↓ brake', '↑ throttle', '← → gears', 'Space runaway ramp'],
    colors: ['#e63946', '#5a5148'],
    tags: ['truck', 'downhill', 'brakes', 'cargo', 'upgrades'],
    scoreLabel: 'dollars',
    mount: mount
  });
})();
