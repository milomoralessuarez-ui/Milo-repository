/* Goblin Gates — hold the gate for 15 waves: barricades, cauldrons, arrows, loot. */
(function () {
  'use strict';
  var W = 900, H = 540, GROUND = 462;
  var GATE_X = 770, TOWER_X = 790;
  var SLOT_X = [290, 410, 530, 650], LANE_Y = [382, 418, 454];
  var FINAL = 15;
  var GOB = {
    runner: { hp: 22, speed: 92, dps: 5, loot: 3, col: '#5cb85c', r: 11 },
    brute: { hp: 80, speed: 44, dps: 14, loot: 7, col: '#3f8f3f', r: 16 },
    bomber: { hp: 26, speed: 84, dps: 0, loot: 4, col: '#a3c94a', r: 11 },
    shaman: { hp: 45, speed: 50, dps: 4, loot: 8, col: '#7fd4c1', r: 12 },
    rider: { hp: 38, speed: 160, dps: 7, loot: 6, col: '#b0863d', r: 13 },
    warlord: { hp: 420, speed: 34, dps: 28, loot: 50, col: '#c0392b', r: 22 }
  };
  var SHOP = [
    { key: 'barricade', name: 'Barricade', desc: 'click a slot to place', cost: function () { return 20; }, k: '1' },
    { key: 'cauldron', name: 'Cauldron', desc: 'Space pours it (max 3)', cost: function (d) { return 45 + d.cauldrons.length * 15; }, k: '2' },
    { key: 'bow', name: 'Sharper arrows', desc: '+50% arrow damage', cost: function (d) { return 30 + d.bowLv * 30; }, k: '3' },
    { key: 'archer', name: 'Hire archer', desc: 'shoots on his own (max 4)', cost: function (d) { return 50 + d.archers * 20; }, k: '4' },
    { key: 'repair', name: 'Repair gate', desc: '+80 gate hp', cost: function () { return 25; }, k: '5' },
    { key: 'reinforce', name: 'Reinforce gate', desc: '+100 max hp, full heal', cost: function (d) { return 60 + d.reinforce * 40; }, k: '6' }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.wave = 0; d.phase = 'build'; d.loot = 60; d.earned = 0;
      d.gateMax = 300; d.gateHp = 300; d.reinforce = 0;
      d.bowLv = 0; d.archers = 0; d.archerT = [];
      d.barricades = []; d.cauldrons = []; d.gobs = []; d.arrows = []; d.parts = []; d.pops = [];
      d.placing = false; d.hover = null; d.queue = []; d.spawnT = 0; d.cool = 0; d.pour = 0; d.shake = 0;
      d.msg = 'Build up, then sound the wave'; d.msgT = 3; d.kills = 0; d.buttons = [];
      d.moon = Math.random() * 6.28;
      g.set('Loot', d.loot); g.set('Wave', '0 / ' + FINAL); g.set('Gate', d.gateHp); g.set('Score', 0);
    }

    function score(g) {
      var d = g.data;
      g.score = d.earned + d.wave * 100;
      g.set('Score', U.fmt(g.score));
    }

    function pop(d, x, y, text, col) { d.pops.push({ x: x, y: y, text: text, col: col || '#ffd76a', life: .9, max: .9 }); }
    function puff(d, x, y, col, n, spd) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.28, s = U.rand(30, spd || 180);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life: U.rand(.3, .8), max: .8, col: col, sz: U.rand(2, 5), grav: 300 });
      }
    }

    function buildWave(d, n) {
      var q = [], count = 5 + n * 2;
      for (var i = 0; i < count; i++) {
        var r = Math.random(), kind = 'runner';
        if (n >= 9 && r < .18) kind = 'rider';
        else if (n >= 7 && r < .30) kind = 'shaman';
        else if (n >= 5 && r < .48) kind = 'bomber';
        else if (n >= 3 && r < .72) kind = 'brute';
        q.push(kind);
      }
      if (n % 5 === 0) q.push('warlord');
      if (n === FINAL) q.push('warlord');
      return q;
    }

    function startWave(g) {
      var d = g.data;
      d.wave++; d.phase = 'wave'; d.placing = false;
      d.queue = buildWave(d, d.wave); d.spawnT = .5;
      d.cauldrons.forEach(function (c) { c.filled = true; });
      d.msg = d.wave === FINAL ? 'FINAL WAVE — hold until the horn!' : 'Wave ' + d.wave; d.msgT = 2;
      g.set('Wave', d.wave + ' / ' + FINAL);
      Milo.sound.tone({ f: 140, f2: 320, d: .5, v: .1, type: 'sawtooth' });
    }

    function spawnGob(d, kind) {
      var s = GOB[kind], lane = U.randInt(0, 2), mult = 1 + (d.wave - 1) * .09;
      d.gobs.push({
        kind: kind, x: -30 - Math.random() * 40, lane: lane, y: LANE_Y[lane],
        hp: s.hp * mult, max: s.hp * mult, speed: s.speed * (1 + d.wave * .015), dps: s.dps * (1 + d.wave * .05),
        loot: s.loot, col: s.col, r: s.r, hurt: 0, burn: 0, step: Math.random() * 6.28, healT: 2
      });
    }

    function fire(g, tx, ty, dmg, from) {
      var d = g.data;
      var sx = from ? from.x : TOWER_X + 30, sy = from ? from.y : 300;
      var a = Math.atan2(ty - sy, tx - sx), sp = 780;
      d.arrows.push({ x: sx, y: sy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg: dmg, life: 1.4 });
      Milo.sound.tone({ f: 900, f2: 500, d: .06, v: from ? .02 : .05, type: 'triangle' });
    }

    function pour(g) {
      var d = g.data;
      if (d.phase !== 'wave') return;
      var c = null;
      for (var i = 0; i < d.cauldrons.length; i++) if (d.cauldrons[i].filled) { c = d.cauldrons[i]; break; }
      if (!c) { pop(d, TOWER_X + 40, 250, 'empty', '#aaa'); return; }
      c.filled = false; d.pour = .7; d.shake = .4;
      Milo.sound.noise(.4, .18, 700);
      var hits = 0;
      d.gobs.forEach(function (gb) {
        if (gb.x > GATE_X - 180 && gb.x < GATE_X + 10) { damage(g, gb, 75); gb.burn = 3; hits++; }
      });
      for (var k = 0; k < 40; k++) d.parts.push({ x: U.rand(GATE_X - 180, GATE_X), y: U.rand(300, 330), vx: U.rand(-30, 30), vy: U.rand(80, 260), life: U.rand(.5, 1), max: 1, col: U.choice(['#f97316', '#fbbf24', '#ef4444']), sz: U.rand(3, 6), grav: 500 });
      if (hits) pop(d, GATE_X - 90, 280, hits + ' scalded!', '#fbbf24');
    }

    function damage(g, gb, amt) {
      var d = g.data;
      gb.hp -= amt; gb.hurt = .15;
      if (gb.hp <= 0 && !gb.dead) {
        gb.dead = true; d.kills++;
        d.loot += gb.loot; d.earned += gb.loot;
        g.set('Loot', d.loot); score(g);
        pop(d, gb.x, gb.y - 40, '+' + gb.loot);
        puff(d, gb.x, gb.y - 16, gb.col, gb.kind === 'warlord' ? 40 : 14);
        Milo.sound.tone({ f: gb.kind === 'warlord' ? 110 : 300, f2: 60, d: .14, v: .08, type: 'square' });
      }
    }

    function hurtGate(g, amt) {
      var d = g.data;
      d.gateHp -= amt;
      g.set('Gate', Math.max(0, Math.round(d.gateHp)));
      if (d.gateHp <= 0) {
        d.shake = 1; puff(d, GATE_X, 380, '#8b5a2b', 60, 300);
        g.gameOver({ text: 'The gate fell on wave ' + d.wave + ' after ' + d.kills + ' goblins. Loot earned: ' + d.earned + '.' });
      }
    }

    function tryBuy(g, item) {
      var d = g.data, cost = item.cost(d);
      if (item.key === 'cauldron' && d.cauldrons.length >= 3) return pop(d, W / 2, 200, 'max cauldrons', '#aaa');
      if (item.key === 'archer' && d.archers >= 4) return pop(d, W / 2, 200, 'max archers', '#aaa');
      if (item.key === 'repair' && d.gateHp >= d.gateMax) return pop(d, W / 2, 200, 'gate is whole', '#aaa');
      if (d.loot < cost) { pop(d, W / 2, 200, 'need ' + cost + ' loot', '#f87171'); Milo.sound.click(); return; }
      if (item.key === 'barricade') { d.placing = !d.placing; Milo.sound.click(); return; }
      d.loot -= cost; g.set('Loot', d.loot); Milo.sound.coin();
      if (item.key === 'cauldron') d.cauldrons.push({ filled: true });
      if (item.key === 'bow') d.bowLv++;
      if (item.key === 'archer') { d.archers++; d.archerT.push(Math.random()); }
      if (item.key === 'repair') d.gateHp = Math.min(d.gateMax, d.gateHp + 80);
      if (item.key === 'reinforce') { d.reinforce++; d.gateMax += 100; d.gateHp = d.gateMax; }
      g.set('Gate', Math.round(d.gateHp));
    }

    function placeAt(g, x, y) {
      var d = g.data, best = null, bd = 1e9;
      for (var l = 0; l < 3; l++) for (var s = 0; s < 4; s++) {
        var dd = U.dist(x, y, SLOT_X[s], LANE_Y[l] - 14);
        if (dd < bd) { bd = dd; best = { lane: l, slot: s }; }
      }
      if (!best || bd > 40) return;
      for (var i = 0; i < d.barricades.length; i++) if (d.barricades[i].lane === best.lane && d.barricades[i].slot === best.slot) return pop(d, x, y - 20, 'taken', '#aaa');
      if (d.loot < 20) { pop(d, x, y - 20, 'need 20 loot', '#f87171'); return; }
      d.loot -= 20; g.set('Loot', d.loot);
      d.barricades.push({ lane: best.lane, slot: best.slot, x: SLOT_X[best.slot], y: LANE_Y[best.lane], hp: 120, max: 120 });
      puff(d, SLOT_X[best.slot], LANE_Y[best.lane] - 10, '#b48a5a', 10, 120);
      Milo.sound.tone({ f: 220, f2: 160, d: .1, v: .09, type: 'square' });
      if (d.loot < 20) d.placing = false;
    }

    function layoutButtons(d) {
      var btns = [], x0 = 16, y0 = 66, bw = 196, bh = 40;
      SHOP.forEach(function (it, i) {
        btns.push({ item: it, x: x0 + (i % 2) * (bw + 8), y: y0 + Math.floor(i / 2) * (bh + 8), w: bw, h: bh });
      });
      btns.push({ start: true, x: x0, y: y0 + 3 * (bh + 8) + 4, w: bw * 2 + 8, h: 44 });
      d.buttons = btns;
      return btns;
    }

    return Milo.arcade(host, {
      id: 'goblin-gates',
      w: W, h: H, bg: '#0b1220',
      stats: ['Score', 'Loot', 'Wave', 'Gate'],
      touchButtons: [{ key: 'action', label: 'POUR' }, { key: 'a', label: 'SHOOT' }],
      emo: '🏰',
      start: {
        title: 'Goblin Gates',
        text: 'Fifteen waves of goblins are coming down the road. Spend loot between waves on ' +
          'barricades, cauldrons of oil, archers and gate repairs, then shoot everything ' +
          'that moves. Hold until the horn.',
        keys: ['Click shoot', 'Space pour oil', '1–6 buy', 'Enter start wave']
      },
      init: reset,

      onKey: function (g, e) {
        var d = g.data;
        if (d.phase !== 'build') return;
        for (var i = 0; i < SHOP.length; i++) if (e.key === SHOP[i].k) tryBuy(g, SHOP[i]);
      },

      onPointer: function (g, type, x, y) {
        var d = g.data;
        d.hover = { x: x, y: y };
        if (type !== 'down') return;
        if (d.phase === 'build') {
          var btns = layoutButtons(d);
          for (var i = 0; i < btns.length; i++) {
            var b = btns[i];
            if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
              if (b.start) startWave(g); else tryBuy(g, b.item);
              return;
            }
          }
          if (d.placing && x > 220 && y > 330 && y < 480) placeAt(g, x, y);
          return;
        }
        if (x > GATE_X - 10 && y < 330 && y > 220 && d.cauldrons.length) { pour(g); return; }
        if (d.cool <= 0) { fire(g, x, y, 14 * (1 + d.bowLv * .5)); d.cool = .32; }
      },

      update: function (g, dt) {
        var d = g.data, inp = g.input;
        if (d.phase === 'build' && inp.pressed('action')) startWave(g);
        else if (d.phase === 'wave') {
          if (inp.pressed('action') && !inp.pressed('Enter')) pour(g);
          if (inp.pressed('a') || inp.pressed('Enter')) {
            var near = null, nd = 1e9;
            d.gobs.forEach(function (gb) { if (!gb.dead && GATE_X - gb.x < nd) { nd = GATE_X - gb.x; near = gb; } });
            if (near && d.cool <= 0) { fire(g, near.x + 10, near.y - 16, 14 * (1 + d.bowLv * .5)); d.cool = .35; }
          }
        }
        d.cool -= dt; d.pour = Math.max(0, d.pour - dt); d.shake = Math.max(0, d.shake - dt * 2);
        d.msgT = Math.max(0, d.msgT - dt);
        d.parts = d.parts.filter(function (q) {
          q.x += q.vx * dt; q.y += q.vy * dt; q.vy += (q.grav || 0) * dt; q.life -= dt;
          if (q.y > GROUND + 6) { q.y = GROUND + 6; q.vy *= -.3; }
          return q.life > 0;
        });
        d.pops = d.pops.filter(function (q) { q.life -= dt; q.y -= 28 * dt; return q.life > 0; });
        if (d.phase !== 'wave') return;

        // spawning
        if (d.queue.length) {
          d.spawnT -= dt;
          if (d.spawnT <= 0) {
            spawnGob(d, d.queue.shift());
            d.spawnT = Math.max(.35, 1.4 - d.wave * .07) * U.rand(.7, 1.3);
          }
        }

        // archers on the wall
        for (var ai = 0; ai < d.archers; ai++) {
          d.archerT[ai] -= dt;
          if (d.archerT[ai] <= 0) {
            d.archerT[ai] = 1.3;
            var tgt = null, td = 1e9;
            d.gobs.forEach(function (gb) { if (!gb.dead && GATE_X - gb.x < td) { td = GATE_X - gb.x; tgt = gb; } });
            if (tgt) fire(g, tgt.x + tgt.speed * .3, tgt.y - 16, 9 * (1 + d.bowLv * .5), { x: TOWER_X + 20 + ai * 18, y: 292 });
          }
        }

        // goblins
        d.gobs.forEach(function (gb) {
          if (gb.dead) return;
          gb.hurt = Math.max(0, gb.hurt - dt);
          if (gb.burn > 0) { gb.burn -= dt; damage(g, gb, 8 * dt); if (Math.random() < .3) d.parts.push({ x: gb.x + U.rand(-6, 6), y: gb.y - 20, vx: 0, vy: -60, life: .4, max: .4, col: '#fb923c', sz: 3 }); }
          if (gb.dead) return;
          // target: barricade ahead in this lane, or the gate
          var bar = null;
          for (var i = 0; i < d.barricades.length; i++) {
            var b = d.barricades[i];
            if (b.lane === gb.lane && b.x - 14 > gb.x - 6 && b.x - 14 - gb.x < 12) { bar = b; break; }
          }
          var atGate = gb.x >= GATE_X - 18;
          if (bar || atGate) {
            gb.step += dt * 14;
            if (gb.kind === 'bomber') {
              gb.dead = true; d.kills++; d.shake = .5;
              puff(d, gb.x, gb.y - 14, '#fbbf24', 26, 260); Milo.sound.explode();
              if (bar) bar.hp -= 60; else hurtGate(g, 45);
              d.loot += gb.loot; d.earned += gb.loot; g.set('Loot', d.loot); score(g);
              return;
            }
            if (bar) { bar.hp -= gb.dps * dt; if (Math.random() < dt * 6) puff(d, bar.x, bar.y - 16, '#b48a5a', 2, 90); }
            else hurtGate(g, gb.dps * dt);
          } else {
            gb.x += gb.speed * dt; gb.step += dt * gb.speed * .12;
          }
          if (gb.kind === 'shaman') {
            gb.healT -= dt;
            if (gb.healT <= 0) {
              gb.healT = 2.2;
              d.gobs.forEach(function (o) { if (!o.dead && o !== gb && Math.abs(o.x - gb.x) < 90) { o.hp = Math.min(o.max, o.hp + 12); } });
              pop(d, gb.x, gb.y - 44, '✚', '#7fd4c1');
            }
          }
        });
        d.gobs = d.gobs.filter(function (gb) { return !gb.dead; });
        d.barricades = d.barricades.filter(function (b) {
          if (b.hp <= 0) { puff(d, b.x, b.y - 14, '#b48a5a', 18, 200); Milo.sound.hit(); return false; }
          return true;
        });

        // arrows
        for (var k = d.arrows.length - 1; k >= 0; k--) {
          var a = d.arrows[k];
          a.x += a.vx * dt; a.y += a.vy * dt; a.vy += 220 * dt; a.life -= dt;
          var hit = false;
          for (var j = 0; j < d.gobs.length; j++) {
            var gb2 = d.gobs[j];
            if (Math.abs(a.x - gb2.x) < gb2.r + 4 && a.y > gb2.y - gb2.r * 2.4 && a.y < gb2.y + 4) {
              damage(g, gb2, a.dmg); puff(d, a.x, a.y, '#d1fae5', 4, 80); hit = true; break;
            }
          }
          if (hit || a.life <= 0 || a.y > GROUND || a.x < -20) d.arrows.splice(k, 1);
        }

        // wave done?
        if (!d.queue.length && !d.gobs.length) {
          if (d.wave >= FINAL) {
            d.phase = 'won';
            g.score += Math.round(d.gateHp) * 2; g.set('Score', U.fmt(g.score));
            g.win({ text: 'The horn sounds — the gate held all ' + FINAL + ' waves with ' + Math.round(d.gateHp) + ' hp to spare. ' + d.kills + ' goblins never got in.', score: g.score });
            return;
          }
          d.phase = 'build';
          var bonus = 20 + d.wave * 5;
          d.loot += bonus; d.earned += bonus; g.set('Loot', d.loot); score(g);
          d.msg = 'Wave ' + d.wave + ' held!  +' + bonus + ' loot'; d.msgT = 2.5;
          Milo.sound.powerup();
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, t = g.t;
        c.save();
        if (d.shake > 0) c.translate(U.rand(-1, 1) * d.shake * 6, U.rand(-1, 1) * d.shake * 6);
        // sky
        var sky = c.createLinearGradient(0, 0, 0, GROUND);
        sky.addColorStop(0, '#0b1220'); sky.addColorStop(1, '#1d2a3a');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);
        c.fillStyle = '#f1e6b8'; c.beginPath(); c.arc(140, 90, 30, 0, 7); c.fill();
        c.fillStyle = '#0b1220'; c.beginPath(); c.arc(152, 82, 26, 0, 7); c.fill();
        for (var s = 0; s < 40; s++) { c.fillStyle = 'rgba(255,255,255,' + (0.3 + U.hash2(s, 1, 3) * .5) + ')'; c.fillRect(U.hash2(s, 2, 3) * W, U.hash2(s, 3, 3) * 220, 2, 2); }
        // hills
        c.fillStyle = '#152233'; c.beginPath(); c.moveTo(0, 330);
        for (var hx = 0; hx <= W; hx += 40) c.lineTo(hx, 300 + Math.sin(hx * .01) * 22 + Math.sin(hx * .03) * 10);
        c.lineTo(W, 340); c.closePath(); c.fill();
        // road + ground
        c.fillStyle = '#26361f'; c.fillRect(0, 340, W, H - 340);
        c.fillStyle = '#4a3b2a'; c.fillRect(0, 362, GATE_X + 20, GROUND - 362);
        c.fillStyle = 'rgba(0,0,0,.18)';
        for (var rl = 0; rl < 3; rl++) c.fillRect(0, LANE_Y[rl] - 2, GATE_X, 2);
        c.fillStyle = '#2f2418'; c.fillRect(0, GROUND, W, H - GROUND);

        // slots (build phase)
        if (d.phase === 'build') {
          for (var l = 0; l < 3; l++) for (var sl = 0; sl < 4; sl++) {
            c.strokeStyle = d.placing ? 'rgba(255,215,106,.7)' : 'rgba(255,255,255,.12)'; c.lineWidth = 1.5;
            c.setLineDash([4, 4]);
            c.strokeRect(SLOT_X[sl] - 16, LANE_Y[l] - 30, 32, 30);
            c.setLineDash([]);
          }
        }

        // barricades
        d.barricades.forEach(function (b) {
          var sc = .85 + b.lane * .12;
          c.save(); c.translate(b.x, b.y); c.scale(sc, sc);
          c.fillStyle = '#8b5a2b';
          c.save(); c.rotate(.5); c.fillRect(-4, -34, 8, 40); c.restore();
          c.save(); c.rotate(-.5); c.fillRect(-4, -34, 8, 40); c.restore();
          c.fillStyle = '#b48a5a'; c.fillRect(-20, -18, 40, 6); c.fillRect(-20, -8, 40, 6);
          c.restore();
          if (b.hp < b.max) {
            c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(b.x - 16, b.y - 44, 32, 4);
            c.fillStyle = '#fbbf24'; c.fillRect(b.x - 16, b.y - 44, 32 * b.hp / b.max, 4);
          }
        });

        // goblins
        d.gobs.forEach(function (gb) {
          var sc = .85 + gb.lane * .12;
          c.save(); c.translate(gb.x, gb.y); c.scale(sc, sc);
          c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(0, 0, gb.r + 2, 4, 0, 0, 7); c.fill();
          var leg = Math.sin(gb.step) * 5;
          c.fillStyle = '#2b3a1a';
          c.fillRect(-6, -10, 4, 10 + leg); c.fillRect(2, -10, 4, 10 - leg);
          c.fillStyle = gb.hurt > 0 ? '#fff' : gb.col;
          U.roundRect(c, -gb.r * .7, -gb.r * 2.2, gb.r * 1.4, gb.r * 1.4, 4); c.fill();
          c.beginPath(); c.arc(0, -gb.r * 2.5, gb.r * .75, 0, 7); c.fill();
          // ears
          c.beginPath(); c.moveTo(-gb.r * .6, -gb.r * 2.6); c.lineTo(-gb.r * 1.5, -gb.r * 3); c.lineTo(-gb.r * .5, -gb.r * 2.2); c.fill();
          c.beginPath(); c.moveTo(gb.r * .6, -gb.r * 2.6); c.lineTo(gb.r * 1.5, -gb.r * 3); c.lineTo(gb.r * .5, -gb.r * 2.2); c.fill();
          c.fillStyle = '#ff4444'; c.fillRect(gb.r * .1, -gb.r * 2.7, 3, 3); c.fillRect(gb.r * .5, -gb.r * 2.7, 3, 3);
          if (gb.kind === 'brute' || gb.kind === 'warlord') { c.fillStyle = '#777'; c.fillRect(gb.r * .6, -gb.r * 2.1, 5, gb.r * 1.6); c.fillStyle = '#999'; c.fillRect(gb.r * .3, -gb.r * 2.4, 14, 5); }
          if (gb.kind === 'bomber') { c.fillStyle = '#222'; c.beginPath(); c.arc(-gb.r * .9, -gb.r * 1.6, 6, 0, 7); c.fill(); c.fillStyle = '#fbbf24'; c.fillRect(-gb.r * .9 - 1, -gb.r * 1.6 - 11, 2, 6); }
          if (gb.kind === 'shaman') { c.fillStyle = '#f1e6b8'; c.fillRect(-gb.r * 1.1, -gb.r * 3, 3, gb.r * 3); c.fillStyle = '#7fd4c1'; c.beginPath(); c.arc(-gb.r * 1.1 + 1, -gb.r * 3.1, 4, 0, 7); c.fill(); }
          if (gb.kind === 'rider') { c.fillStyle = '#6b7280'; c.beginPath(); c.ellipse(0, -6, gb.r * 1.3, 6, 0, 0, 7); c.fill(); c.beginPath(); c.arc(gb.r * 1.3, -8, 5, 0, 7); c.fill(); }
          if (gb.kind === 'warlord') { c.fillStyle = '#fbbf24'; c.beginPath(); c.moveTo(-10, -gb.r * 3.1); c.lineTo(-6, -gb.r * 3.6); c.lineTo(-2, -gb.r * 3.1); c.lineTo(2, -gb.r * 3.7); c.lineTo(6, -gb.r * 3.1); c.lineTo(10, -gb.r * 3.6); c.lineTo(12, -gb.r * 3); c.closePath(); c.fill(); }
          c.restore();
          if (gb.hp < gb.max) {
            var hw = gb.r * 2.2;
            c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(gb.x - hw / 2, gb.y - gb.r * 3.4 * sc - 6, hw, 4);
            c.fillStyle = gb.kind === 'warlord' ? '#ef4444' : '#5cb85c'; c.fillRect(gb.x - hw / 2, gb.y - gb.r * 3.4 * sc - 6, hw * Math.max(0, gb.hp / gb.max), 4);
          }
        });

        // oil pour
        if (d.pour > 0) {
          c.fillStyle = 'rgba(251,146,60,' + d.pour * .55 + ')';
          c.fillRect(GATE_X - 180, 300, 180, GROUND - 300);
        }

        // gate tower
        c.fillStyle = '#3b3f4a'; c.fillRect(TOWER_X, 240, W - TOWER_X, GROUND - 240);
        c.fillStyle = '#4b505c';
        for (var by = 250; by < GROUND; by += 18) for (var bx = TOWER_X + ((by / 18) % 2 ? 0 : 14); bx < W; bx += 28) c.fillRect(bx, by, 24, 14);
        for (var m = 0; m < 4; m++) { c.fillStyle = '#3b3f4a'; c.fillRect(TOWER_X + 4 + m * 30, 224, 18, 20); }
        // door
        var doorH = 84, dx = TOWER_X - 22;
        c.fillStyle = '#5b3a1e'; U.roundRect(c, dx, GROUND - doorH, 34, doorH, 6); c.fill();
        c.fillStyle = '#2f2418'; c.fillRect(dx, GROUND - doorH + 26, 34, 3); c.fillRect(dx, GROUND - doorH + 56, 34, 3);
        c.fillStyle = '#c9a34a'; c.beginPath(); c.arc(dx + 8, GROUND - 40, 2.5, 0, 7); c.fill();
        var gf = U.clamp(d.gateHp / d.gateMax, 0, 1);
        if (gf < .6) { c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(dx + 6, GROUND - 70); c.lineTo(dx + 18, GROUND - 40); c.lineTo(dx + 10, GROUND - 12); c.stroke(); }
        // torches
        [TOWER_X - 10, W - 20].forEach(function (tx, i) {
          var fl = .8 + Math.sin(t * 12 + i * 2) * .2;
          var gr = c.createRadialGradient(tx, 380, 2, tx, 380, 90 * fl);
          gr.addColorStop(0, 'rgba(255,170,60,.3)'); gr.addColorStop(1, 'rgba(255,170,60,0)');
          c.fillStyle = gr; c.fillRect(tx - 100, 280, 200, 200);
          c.fillStyle = '#fbbf24'; c.beginPath(); c.ellipse(tx, 374, 4, 8 * fl, 0, 0, 7); c.fill();
        });
        // cauldrons on the wall
        d.cauldrons.forEach(function (cd, i) {
          var cx = TOWER_X + 22 + i * 30, cy = 236;
          c.fillStyle = '#222'; c.beginPath(); c.ellipse(cx, cy, 11, 8, 0, 0, 7); c.fill();
          c.fillStyle = cd.filled ? '#f97316' : '#111'; c.beginPath(); c.ellipse(cx, cy - 5, 9, 3, 0, 0, 7); c.fill();
          if (cd.filled && Math.random() < .3) d.parts.push({ x: cx + U.rand(-5, 5), y: cy - 8, vx: 0, vy: -25, life: .5, max: .5, col: 'rgba(255,255,255,.35)', sz: 3 });
        });
        // archers
        for (var ar = 0; ar < d.archers; ar++) {
          var ax = TOWER_X + 20 + ar * 18;
          c.fillStyle = '#d9c8a0'; c.fillRect(ax - 4, 206, 8, 14);
          c.fillStyle = '#7c9a5a'; c.beginPath(); c.arc(ax, 202, 5, 0, 7); c.fill();
          c.strokeStyle = '#8b5a2b'; c.lineWidth = 2; c.beginPath(); c.arc(ax - 8, 212, 7, 1.8, 4.5); c.stroke();
        }
        // player archer (the hero on the tower top)
        c.fillStyle = '#c9a34a'; c.fillRect(TOWER_X + 26, 296, 10, 16);
        c.fillStyle = '#f1d3a5'; c.beginPath(); c.arc(TOWER_X + 31, 290, 6, 0, 7); c.fill();

        // arrows
        c.strokeStyle = '#e5e7eb'; c.lineWidth = 2;
        d.arrows.forEach(function (a) {
          var l = 14 / Math.hypot(a.vx, a.vy);
          c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(a.x - a.vx * l, a.y - a.vy * l); c.stroke();
        });

        // particles + pops
        d.parts.forEach(function (q) {
          c.globalAlpha = Math.max(0, q.life / q.max); c.fillStyle = q.col; c.fillRect(q.x - q.sz / 2, q.y - q.sz / 2, q.sz, q.sz);
        });
        c.globalAlpha = 1;
        d.pops.forEach(function (q) {
          c.globalAlpha = Math.max(0, q.life / q.max); c.fillStyle = q.col;
          c.font = '800 14px Outfit, sans-serif'; c.textAlign = 'center'; c.fillText(q.text, q.x, q.y);
        });
        c.globalAlpha = 1;
        c.restore();

        // gate hp bar
        c.fillStyle = 'rgba(0,0,0,.5)'; U.roundRect(c, W - 232, H - 30, 216, 16, 6); c.fill();
        c.fillStyle = gf > .4 ? '#5cb85c' : '#ef4444'; U.roundRect(c, W - 230, H - 28, 212 * gf, 12, 5); c.fill();
        c.fillStyle = '#fff'; c.font = '700 11px Outfit, sans-serif'; c.textAlign = 'right';
        c.fillText('GATE ' + Math.max(0, Math.round(d.gateHp)) + ' / ' + d.gateMax, W - 22, H - 36);

        // build panel
        if (d.phase === 'build') {
          var btns = layoutButtons(d);
          c.fillStyle = 'rgba(8,12,20,.82)'; U.roundRect(c, 8, 56, 420, 216, 12); c.fill();
          btns.forEach(function (b) {
            var can, label, sub = '';
            if (b.start) { can = true; label = '▶  Sound wave ' + (d.wave + 1) + (d.wave + 1 === FINAL ? ' — the last' : ''); }
            else {
              var cost = b.item.cost(d);
              can = d.loot >= cost;
              label = b.item.k + '  ' + b.item.name + '  ·  ' + cost;
              sub = b.item.desc;
              if (b.item.key === 'bow') label += '   (lv ' + (d.bowLv + 1) + ')';
              if (b.item.key === 'archer') label += '   (' + d.archers + '/4)';
              if (b.item.key === 'cauldron') label += '   (' + d.cauldrons.length + '/3)';
            }
            var hov = d.hover && d.hover.x >= b.x && d.hover.x <= b.x + b.w && d.hover.y >= b.y && d.hover.y <= b.y + b.h;
            var sel = !b.start && b.item.key === 'barricade' && d.placing;
            c.fillStyle = b.start ? (hov ? '#d97706' : '#b45309') : sel ? '#6d4c1a' : hov ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.07)';
            U.roundRect(c, b.x, b.y, b.w, b.h, 8); c.fill();
            c.fillStyle = can ? '#fff' : 'rgba(255,255,255,.35)';
            c.font = (b.start ? '800 16px' : '700 12px') + ' Outfit, sans-serif'; c.textAlign = b.start ? 'center' : 'left';
            c.fillText(label, b.start ? b.x + b.w / 2 : b.x + 10, b.y + (b.start ? 28 : 17));
            if (sub) { c.fillStyle = 'rgba(255,255,255,.45)'; c.font = '500 10px Outfit, sans-serif'; c.fillText(sub, b.x + 10, b.y + 31); }
          });
          if (d.placing) {
            c.fillStyle = '#ffd76a'; c.font = '800 14px Outfit, sans-serif'; c.textAlign = 'center';
            c.fillText('Click a dotted slot to place a barricade (20 loot)', 470, 330);
          }
        } else {
          c.fillStyle = 'rgba(255,255,255,.5)'; c.font = '700 12px Outfit, sans-serif'; c.textAlign = 'left';
          var filled = d.cauldrons.filter(function (x) { return x.filled; }).length;
          c.fillText((d.gobs.length + d.queue.length) + ' goblins left  ·  ' + filled + ' cauldron' + (filled === 1 ? '' : 's') + ' ready (Space)', 16, H - 22);
        }

        if (d.msgT > 0) {
          c.globalAlpha = Math.min(1, d.msgT);
          c.fillStyle = '#ffd76a'; c.font = '900 28px Outfit, sans-serif'; c.textAlign = 'center';
          c.shadowColor = '#000'; c.shadowBlur = 10;
          c.fillText(d.msg, W / 2 + 60, 180);
          c.shadowBlur = 0; c.globalAlpha = 1;
        }
      }
    });
  }

  window.Milo.register({
    id: 'goblin-gates', title: 'Goblin Gates', emo: '🏰', category: 'Action',
    tagline: 'Hold the gate through 15 waves',
    description: 'Side-view gate defence. Goblins run down a three-lane road at your gate; ' +
      'you shoot from the tower by clicking, and between waves you spend loot on barricades ' +
      '(click a slot to place them in a lane), cauldrons of oil that Space pours over ' +
      'everything near the door, hired archers, sharper arrows and gate repairs. Brutes ' +
      'arrive from wave 3, bombers that blow up barricades from 5, healing shamans from 7, ' +
      'wolf riders from 9, and a warlord every fifth wave. The horn sounds after wave 15; ' +
      'leftover gate hp doubles into your score. Tip: a barricade in each lane near the gate ' +
      'bunches goblins right under the cauldrons.',
    controls: ['Click shoot', 'Space pour', '1–6 buy', 'Enter wave'],
    colors: ['#1d2a3a', '#5cb85c'],
    tags: ['defence', 'waves', 'goblins', 'upgrades', 'action'],
    mount: mount
  });
})();
