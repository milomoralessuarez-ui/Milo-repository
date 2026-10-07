/* Castle Raid — drop raiders past gates, oil and arrows; every survivor multiplies the loot. */
(function () {
  'use strict';
  var W = 900, H = 540, GROUND = 440, WALL_TOP = 196, DROP_X = 236, SAFE_X = 796, RUN_SPD = 215, GRAV = 1500;
  var MAX_RAIDERS = 8;
  var HAZ = {
    gate: { w: 44, name: 'the portcullis' },
    oil: { w: 110, name: 'boiling oil' },
    arrows: { w: 150, name: 'a volley of arrows' },
    blade: { w: 40, name: 'the swinging blade' },
    pit: { w: 84, name: 'the trapdoor' }
  };
  var FALL_T = Math.sqrt(2 * (GROUND - WALL_TOP) / GRAV);

  function gateFrac(p) { if (p < .45) return 0; if (p < .55) return (p - .45) / .1; if (p < .9) return 1; return 1 - (p - .9) / .1; }
  function pitFrac(p) { if (p < .5) return 0; if (p < .58) return (p - .5) / .08; if (p < .9) return 1; return 1 - (p - .9) / .1; }

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.castle = 0; d.loot = 0; d.wall = 6; d.safe = 0; d.runners = []; d.parts = []; d.pops = []; d.time = 0;
      d.sections = []; d.sec = 0; d.phase = 'section'; d.phaseT = 0; d.alarm = 20; d.alarmMax = 20; d.shake = 0;
      d.msg = ''; d.msgT = 0; d.lost = 0; d.dropped = 0; d.flash = 0; d.stars = [];
      for (var i = 0; i < 50; i++) d.stars.push({ x: Math.random() * W, y: Math.random() * 200, s: U.rand(.6, 1.8) });
      newCastle(g);
      g.set('Loot', 0);
    }

    function mkHazard(kind, castle, xc) {
      var speed = 1 + (castle - 1) * .12;
      var h = { kind: kind, xc: xc, x0: xc - HAZ[kind].w / 2, x1: xc + HAZ[kind].w / 2, off: Math.random(), was: false };
      if (kind === 'gate') { h.period = 4.4 / speed; h.danger = function (p) { return gateFrac(p) > .35; }; }
      else if (kind === 'oil') { h.period = 4.8 / speed; h.danger = function (p) { return p >= .62 && p < .9; }; h.warn = function (p) { return p >= .5 && p < .62; }; }
      else if (kind === 'arrows') { h.period = 3.8 / speed; h.danger = function (p) { return p >= .7 && p < .86; }; h.warn = function (p) { return p >= .55 && p < .7; }; }
      else if (kind === 'blade') { h.period = 3.4 / speed; h.danger = function (p) { return Math.abs(Math.sin(p * 6.283)) < .3; }; }
      else { h.period = 4.2 / speed; h.danger = function (p) { return pitFrac(p) > .3; }; }
      return h;
    }
    function phaseOf(h, t) { return (t / h.period + h.off) % 1; }

    function newCastle(g) {
      var d = g.data;
      d.castle++;
      var pool = d.castle === 1 ? ['gate', 'oil', 'pit'] : ['gate', 'oil', 'arrows', 'blade', 'pit'];
      var n = Math.min(6, 2 + d.castle), prev = '';
      d.sections = [];
      for (var i = 0; i < n; i++) {
        var kinds = U.shuffle(pool.slice()).filter(function (k) { return k !== prev; });
        var two = d.castle >= 3 && i >= 1 && Math.random() < .35 + d.castle * .06;
        var hz = two ? [mkHazard(kinds[0], d.castle, 420), mkHazard(kinds[1], d.castle, 620)] : [mkHazard(kinds[0], d.castle, 520)];
        prev = kinds[0];
        d.sections.push(hz);
      }
      d.sec = 0; d.safe = 0; d.runners = [];
      d.alarmMax = Math.max(11, 24 - d.castle * 2); d.alarm = d.alarmMax;
      d.phase = 'section';
      d.msg = 'CASTLE ' + d.castle + '  ·  ' + d.wall + ' raiders'; d.msgT = 2.4;
      g.set('Castle', d.castle); g.set('Section', '1 / ' + n); raidersHud(g);
      Milo.sound.tone({ f: 180, f2: 360, d: .5, v: .1, type: 'sawtooth' });
    }

    function raidersHud(g) {
      var d = g.data, s = '';
      for (var i = 0; i < d.wall + d.safe; i++) s += '♟';
      g.set('Raiders', s || '—');
    }

    function puff(d, x, y, col, n, spd) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.28, s = U.rand(30, spd || 160);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: U.rand(.3, .9), max: .9, col: col, sz: U.rand(2, 6), grav: 260 });
      }
    }
    function pop(d, x, y, text, col, big) { d.pops.push({ x: x, y: y, text: text, col: col || '#fde68a', life: 1.1, max: 1.1, big: !!big }); }

    function drop(g) {
      var d = g.data;
      if (d.phase !== 'section' || d.wall <= 0) return;
      d.wall--; d.dropped++;
      d.runners.push({ x: DROP_X, y: WALL_TOP, vy: 0, state: 'fall', step: Math.random() * 6, t: 0 });
      raidersHud(g);
      Milo.sound.tone({ f: 520, f2: 180, d: .2, v: .06, type: 'triangle' });
    }

    function kill(g, r, h) {
      var d = g.data;
      r.state = 'dead'; d.lost++; d.shake = .5;
      puff(d, r.x, r.y - 14, h.kind === 'oil' ? '#f97316' : h.kind === 'arrows' ? '#e5e7eb' : '#9ca3af', 16, 200);
      pop(d, r.x, r.y - 40, '✕', '#f87171', true);
      Milo.sound.hit();
    }

    function sectionDone(g) {
      var d = g.data;
      if (d.safe === 0) {
        Milo.sound.explode();
        g.gameOver({ text: 'The whole party was lost in castle ' + d.castle + ', section ' + (d.sec + 1) + '. Loot carried out: ' + U.fmt(d.loot) + '.' });
        return;
      }
      d.sec++;
      if (d.sec >= d.sections.length) {
        d.phase = 'loot'; d.phaseT = 0;
        var base = 50 + d.castle * 50, loot = base * d.safe;
        d.loot += loot; g.score = d.loot; g.set('Loot', U.fmt(d.loot));
        d.msg = base + ' × ' + d.safe + ' survivors  =  ' + loot + ' loot'; d.msgT = 3;
        d.flash = .6;
        Milo.sound.powerup();
        for (var i = 0; i < 30; i++) d.parts.push({ x: SAFE_X + 30, y: GROUND - 30, vx: U.rand(-160, 40), vy: U.rand(-320, -80), life: U.rand(.6, 1.4), max: 1.4, col: U.choice(['#fde68a', '#fbbf24', '#f59e0b']), sz: U.rand(3, 6), grav: 500 });
      } else {
        d.phase = 'advance'; d.phaseT = 0;
        d.msg = d.safe + ' made it — section ' + (d.sec + 1) + ' of ' + d.sections.length; d.msgT = 1.6;
        Milo.sound.tone({ f: 400, f2: 600, d: .2, v: .07, type: 'square' });
      }
    }

    function hazardSound(h) {
      if (h.kind === 'gate') { Milo.sound.tone({ f: 160, f2: 60, d: .18, v: .1, type: 'square' }); Milo.sound.noise(.1, .08, 500); }
      else if (h.kind === 'oil') Milo.sound.noise(.5, .12, 1800);
      else if (h.kind === 'arrows') { Milo.sound.tone({ f: 900, f2: 400, d: .12, v: .06, type: 'triangle' }); Milo.sound.noise(.15, .05, 3000); }
      else if (h.kind === 'blade') Milo.sound.noise(.2, .07, 900);
      else Milo.sound.tone({ f: 120, f2: 70, d: .25, v: .07, type: 'sawtooth' });
    }

    function drawRaider(c, x, y, face, step, sack) {
      var leg = Math.sin(step) * 5;
      c.save(); c.translate(x, y); c.scale(face, 1);
      c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(0, 1, 9, 3, 0, 0, 7); c.fill();
      c.fillStyle = '#1f2937'; c.fillRect(-5, -12, 4, 12 + leg); c.fillRect(1, -12, 4, 12 - leg);
      if (sack) { c.fillStyle = '#92400e'; c.beginPath(); c.arc(-8, -20, 7, 0, 7); c.fill(); }
      c.fillStyle = '#166534'; U.roundRect(c, -7, -30, 14, 20, 4); c.fill();
      c.fillStyle = '#facc15'; c.fillRect(-7, -22, 14, 2);
      c.fillStyle = '#14532d'; c.beginPath(); c.moveTo(-9, -30); c.lineTo(9, -30); c.lineTo(0, -42); c.closePath(); c.fill();
      c.fillStyle = '#fcd5b5'; c.fillRect(-4, -34, 8, 6);
      c.fillStyle = '#111'; c.fillRect(1, -33, 2, 2);
      c.restore();
    }

    return Milo.arcade(host, {
      id: 'castle-raid',
      w: W, h: H, bg: '#0b1020',
      stats: ['Loot', 'Raiders', 'Castle', 'Section'],
      touchButtons: [{ key: 'action', label: 'DROP' }],
      emo: '🏹',
      start: {
        title: 'Castle Raid',
        text: 'Your raiders wait on the wall. Drop one and he sprints for the far door — past a ' +
          'portcullis, boiling oil, arrow slits, a blade or a trapdoor, each on its own cycle. ' +
          'The ring above a hazard shows its rhythm: the white arc is where a raider dropped ' +
          'NOW would be. Keep it in the green. Every survivor multiplies the loot.',
        keys: ['Space / click drop a raider']
      },
      init: reset,

      onPointer: function (g, type) { if (type === 'down') drop(g); },

      update: function (g, dt) {
        var d = g.data, inp = g.input;
        d.time += dt;
        d.shake = Math.max(0, d.shake - dt * 3); d.msgT = Math.max(0, d.msgT - dt); d.flash = Math.max(0, d.flash - dt);
        d.parts = d.parts.filter(function (q) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += (q.grav || 0) * dt; q.life -= dt; if (q.y > GROUND + 4) { q.y = GROUND + 4; q.vy *= -.3; q.vx *= .7; } return q.life > 0; });
        d.pops = d.pops.filter(function (q) { q.life -= dt; q.y -= 26 * dt; return q.life > 0; });

        if (d.phase === 'advance') {
          d.phaseT += dt;
          if (d.phaseT >= 1.6) { d.phase = 'section'; d.wall = d.safe; d.safe = 0; d.alarm = d.alarmMax; g.set('Section', (d.sec + 1) + ' / ' + d.sections.length); raidersHud(g); }
          return;
        }
        if (d.phase === 'loot') {
          d.phaseT += dt;
          if (d.phaseT >= 3) {
            var recruits = Math.min(MAX_RAIDERS - d.safe, 2);
            d.wall = d.safe + recruits; d.safe = 0;
            if (recruits > 0) pop(d, DROP_X - 40, WALL_TOP - 60, '+' + recruits + ' recruits', '#86efac', true);
            newCastle(g);
          }
          return;
        }

        if (inp.pressed('action')) drop(g);
        var hz = d.sections[d.sec];

        // hazard sounds on the turn to dangerous
        hz.forEach(function (h) {
          var now = h.danger(phaseOf(h, d.time));
          if (now && !h.was) hazardSound(h);
          if (h.warn && h.warn(phaseOf(h, d.time)) && !h.warned) { h.warned = true; Milo.sound.tone({ f: h.kind === 'oil' ? 300 : 700, f2: h.kind === 'oil' ? 200 : 900, d: .15, v: .04, type: 'sine' }); }
          if (!now && h.warn && !h.warn(phaseOf(h, d.time))) h.warned = false;
          h.was = now;
        });

        // runners
        for (var i = d.runners.length - 1; i >= 0; i--) {
          var r = d.runners[i];
          r.t += dt;
          if (r.state === 'fall') {
            r.vy += GRAV * dt; r.y += r.vy * dt;
            if (r.y >= GROUND) { r.y = GROUND; r.state = 'run'; puff(d, r.x, r.y, '#6b7280', 5, 80); Milo.sound.tone({ f: 140, f2: 80, d: .08, v: .05, type: 'triangle' }); }
          } else if (r.state === 'run') {
            r.x += RUN_SPD * dt; r.step += dt * 18;
            for (var k = 0; k < hz.length; k++) {
              var h = hz[k];
              if (r.x > h.x0 && r.x < h.x1 && h.danger(phaseOf(h, d.time))) { kill(g, r, h); break; }
            }
            if (r.state === 'run' && r.x >= SAFE_X) {
              r.state = 'safe'; d.safe++; raidersHud(g);
              pop(d, r.x, r.y - 44, '✓', '#86efac');
              Milo.sound.tone({ f: 700, f2: 1000, d: .1, v: .06, type: 'square' });
            }
          }
          if (r.state === 'dead' || r.state === 'safe') d.runners.splice(i, 1);
        }

        // alarm
        d.alarm -= dt;
        if (d.alarm <= 3 && d.alarm + dt > 3) Milo.sound.tone({ f: 500, f2: 300, d: .3, v: .06, type: 'square' });
        if (d.alarm <= 0 && d.wall > 0) {
          pop(d, DROP_X - 40, WALL_TOP - 70, 'SPOTTED — ' + d.wall + ' lost on the wall', '#f87171', true);
          for (var w = 0; w < d.wall; w++) puff(d, DROP_X - 10 - w * 22, WALL_TOP - 16, '#9ca3af', 8, 140);
          d.lost += d.wall; d.wall = 0; d.shake = .6; raidersHud(g);
          Milo.sound.explode();
        }

        if (d.wall === 0 && d.runners.length === 0 && d.phase === 'section') sectionDone(g);
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, t = g.t;
        c.save();
        if (d.shake > 0) c.translate(U.rand(-1, 1) * d.shake * 6, U.rand(-1, 1) * d.shake * 6);
        // sky
        var sky = c.createLinearGradient(0, 0, 0, GROUND);
        sky.addColorStop(0, '#0b1020'); sky.addColorStop(1, '#232a4a');
        c.fillStyle = sky; c.fillRect(-10, -10, W + 20, H + 20);
        c.fillStyle = 'rgba(255,255,255,.7)'; d.stars.forEach(function (s) { c.fillRect(s.x, s.y, s.s, s.s); });
        c.fillStyle = '#e9e4c8'; c.beginPath(); c.arc(760, 70, 34, 0, 7); c.fill();
        c.fillStyle = '#d8d2b4'; c.beginPath(); c.arc(748, 62, 6, 0, 7); c.arc(772, 84, 4, 0, 7); c.fill();
        // distant towers
        c.fillStyle = '#141a33';
        [[300, 120, 60], [560, 90, 50], [680, 130, 70]].forEach(function (tw) { c.fillRect(tw[0], tw[1], tw[2], GROUND - tw[1]); for (var m = 0; m < tw[2]; m += 16) c.fillRect(tw[0] + m, tw[1] - 10, 9, 10); });

        // courtyard back wall
        c.fillStyle = '#2f3550'; c.fillRect(260, 150, 540, GROUND - 150);
        c.fillStyle = 'rgba(0,0,0,.18)';
        for (var by = 150; by < GROUND; by += 22) for (var bx = 260 + ((by / 22) % 2 ? 0 : 24); bx < 800; bx += 48) c.fillRect(bx, by, 44, 18);
        // floor
        c.fillStyle = '#3b3f57'; c.fillRect(0, GROUND, W, H - GROUND);
        c.fillStyle = 'rgba(0,0,0,.25)'; for (var fx = 0; fx < W; fx += 60) c.fillRect(fx, GROUND, 2, H - GROUND);
        c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(0, GROUND, W, 4);

        var hz = d.sections[d.sec] || [];
        // hazards
        hz.forEach(function (h) {
          var p = phaseOf(h, d.time), dang = h.danger(p);
          if (h.kind === 'gate') {
            var gy = 150 + gateFrac(p) * (GROUND - 150 - 10);
            c.fillStyle = '#4b5170'; c.fillRect(h.x0 - 16, 150, 16, GROUND - 150); c.fillRect(h.x1, 150, 16, GROUND - 150);
            c.fillStyle = '#5c6284'; c.beginPath(); c.arc(h.xc, 175, HAZ.gate.w / 2 + 16, Math.PI, 0); c.fill();
            c.fillStyle = '#0b1020'; c.fillRect(h.x0, 160, HAZ.gate.w, GROUND - 160);
            c.fillStyle = dang ? '#9aa3c7' : '#6b7280';
            for (var gb = 0; gb < 4; gb++) { c.fillRect(h.x0 + 4 + gb * 12, gy - (GROUND - 150), 4, GROUND - 150); }
            for (var gh = 0; gh < 3; gh++) c.fillRect(h.x0, gy - 20 - gh * 60, HAZ.gate.w, 4);
            c.fillStyle = '#cbd5e1';
            for (var sp = 0; sp < 4; sp++) { c.beginPath(); c.moveTo(h.x0 + 2 + sp * 12, gy); c.lineTo(h.x0 + 6 + sp * 12, gy + 10); c.lineTo(h.x0 + 10 + sp * 12, gy); c.fill(); }
          } else if (h.kind === 'oil') {
            var warn = h.warn(p), tilt = dang ? 1.5 : warn ? Math.sin((p - .5) / .12 * 9) * .16 + (p - .5) / .12 * .35 : 0;
            c.fillStyle = '#4b5170'; c.fillRect(h.x0 - 10, 250, HAZ.oil.w + 20, 12);
            c.fillStyle = '#2f3550'; c.fillRect(h.xc - 42, 232, 6, 26); c.fillRect(h.xc + 36, 232, 6, 26);
            var ff = .7 + Math.sin(t * 15 + h.off * 9) * .3;
            c.fillStyle = '#fbbf24'; c.beginPath(); c.ellipse(h.xc, 248, 16 * ff, 6 * ff, 0, 0, 7); c.fill();
            c.save(); c.translate(h.xc, 226); c.rotate(tilt);
            c.fillStyle = '#111827'; c.beginPath(); c.ellipse(0, 0, 34, 22, 0, 0, 7); c.fill();
            c.fillStyle = '#374151'; c.beginPath(); c.ellipse(0, -14, 34, 8, 0, 0, 7); c.fill();
            c.fillStyle = '#f97316'; c.beginPath(); c.ellipse(0, -14, 28, 5, 0, 0, 7); c.fill();
            c.restore();
            if (warn) for (var st = 0; st < 3; st++) { c.fillStyle = 'rgba(255,255,255,' + (0.25 + Math.sin(t * 6 + st) * .15) + ')'; c.beginPath(); c.arc(h.xc - 16 + st * 16, 196 - ((t * 40 + st * 13) % 30), 5, 0, 7); c.fill(); }
            if (warn || dang) { c.fillStyle = 'rgba(249,115,22,' + (dang ? .25 : .12) + ')'; c.fillRect(h.x0, 260, HAZ.oil.w, GROUND - 260); }
            if (dang) {
              var og = c.createLinearGradient(0, 256, 0, GROUND);
              og.addColorStop(0, 'rgba(251,146,60,.95)'); og.addColorStop(1, 'rgba(249,115,22,.6)');
              c.fillStyle = og;
              c.beginPath(); c.moveTo(h.xc + 6, 256); c.lineTo(h.xc + 26, 256); c.lineTo(h.x1, GROUND); c.lineTo(h.x0, GROUND); c.closePath(); c.fill();
              c.fillStyle = 'rgba(255,255,255,.35)';
              for (var os = 0; os < 6; os++) {
                var oy = 256 + ((t * 700 + os * 47) % (GROUND - 256)), fr = (oy - 256) / (GROUND - 256);
                var ox = h.xc + 16 + (h.x0 + HAZ.oil.w * (os + .5) / 6 - h.xc - 16) * fr;
                c.fillRect(ox - 2, oy, 4, 14);
              }
              c.fillStyle = '#fde68a'; c.fillRect(h.x0, GROUND - 6, HAZ.oil.w, 6);
              if (g.frame % 2 === 0) d.parts.push({ x: U.rand(h.x0, h.x1), y: GROUND, vx: U.rand(-60, 60), vy: U.rand(-160, -40), life: .4, max: .4, col: '#fb923c', sz: 3, grav: 400 });
            }
          } else if (h.kind === 'arrows') {
            var aw = h.warn(p);
            for (var sl = 0; sl < 4; sl++) {
              var sx = h.x0 + 15 + sl * 40;
              c.fillStyle = '#1a1f36'; U.roundRect(c, sx, 175, 12, 40, 3); c.fill();
              if (aw || dang) { c.fillStyle = dang ? '#fde68a' : 'rgba(253,230,138,' + (0.3 + Math.sin(t * 20) * .2) + ')'; c.fillRect(sx + 4, 180, 4, 30); }
            }
            if (dang) {
              c.strokeStyle = '#e5e7eb'; c.lineWidth = 2;
              for (var ar = 0; ar < 14; ar++) {
                var ax = h.x0 + ((ar * 37 + t * 900) % HAZ.arrows.w), ay = 200 + ((ar * 53 + t * 1400) % (GROUND - 200));
                c.beginPath(); c.moveTo(ax, ay); c.lineTo(ax - 6, ay - 16); c.stroke();
              }
              c.fillStyle = 'rgba(229,231,235,.08)'; c.fillRect(h.x0, 200, HAZ.arrows.w, GROUND - 200);
            }
          } else if (h.kind === 'blade') {
            var ang = 1.15 * Math.sin(p * 6.283), L = 262;
            c.fillStyle = '#4b5170'; c.fillRect(h.xc - 30, 150, 60, 14);
            c.save(); c.translate(h.xc, 156); c.rotate(ang);
            c.strokeStyle = '#94a3b8'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, L); c.stroke();
            c.fillStyle = dang ? '#f1f5f9' : '#cbd5e1';
            c.beginPath(); c.moveTo(-34, L - 16); c.quadraticCurveTo(0, L + 32, 34, L - 16); c.quadraticCurveTo(0, L + 4, -34, L - 16); c.fill();
            c.restore();
            c.fillStyle = 'rgba(241,245,249,' + (dang ? .12 : .03) + ')'; c.fillRect(h.x0, GROUND - 60, HAZ.blade.w, 60);
          } else {
            var pf = pitFrac(p);
            c.fillStyle = '#05070f'; c.fillRect(h.x0, GROUND, HAZ.pit.w, H - GROUND);
            c.fillStyle = '#7f1d1d'; for (var pk = 0; pk < 6; pk++) { c.beginPath(); c.moveTo(h.x0 + 6 + pk * 14, H - 30); c.lineTo(h.x0 + 12 + pk * 14, GROUND + 30 + pf * 0); c.lineTo(h.x0 + 18 + pk * 14, H - 30); c.fill(); }
            c.save(); c.translate(h.x0, GROUND); c.rotate(pf * 1.5); c.fillStyle = '#6b4f2a'; c.fillRect(0, 0, HAZ.pit.w / 2, 6); c.restore();
            c.save(); c.translate(h.x1, GROUND); c.rotate(-pf * 1.5); c.fillStyle = '#6b4f2a'; c.fillRect(-HAZ.pit.w / 2, 0, HAZ.pit.w / 2, 6); c.restore();
          }
          // rhythm ring
          var rx = h.xc, ry = 112, R = 22;
          c.fillStyle = 'rgba(11,16,32,.7)'; c.beginPath(); c.arc(rx, ry, R + 9, 0, 7); c.fill();
          c.lineWidth = 6; c.lineCap = 'butt';
          for (var seg = 0; seg < 48; seg++) {
            var p0 = seg / 48, p1 = (seg + 1) / 48;
            c.strokeStyle = h.danger((p0 + p1) / 2) ? '#ef4444' : '#22c55e';
            c.beginPath(); c.arc(rx, ry, R, p0 * 6.283 - Math.PI / 2, p1 * 6.283 - Math.PI / 2 + .02); c.stroke();
          }
          // where a raider dropped now would cross the zone
          if (d.phase === 'section') {
            var tIn = FALL_T + (h.x0 - DROP_X) / RUN_SPD, tOut = FALL_T + (h.x1 - DROP_X) / RUN_SPD;
            var pIn = phaseOf(h, d.time + tIn), pOut = phaseOf(h, d.time + tOut);
            var ok = true;
            for (var q = 0; q <= 10; q++) if (h.danger(phaseOf(h, d.time + tIn + (tOut - tIn) * q / 10))) { ok = false; break; }
            c.strokeStyle = ok ? '#fff' : 'rgba(255,255,255,.55)'; c.lineWidth = ok ? 5 : 3;
            c.beginPath(); c.arc(rx, ry, R + 9, pIn * 6.283 - Math.PI / 2, pOut * 6.283 - Math.PI / 2 + (pOut < pIn ? 6.283 : 0)); c.stroke();
          }
          var pn = phaseOf(h, d.time);
          c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx + Math.cos(pn * 6.283 - Math.PI / 2) * (R - 4), ry + Math.sin(pn * 6.283 - Math.PI / 2) * (R - 4)); c.stroke();
          c.fillStyle = dang ? '#ef4444' : '#22c55e'; c.beginPath(); c.arc(rx, ry, 4, 0, 7); c.fill();
        });

        // outer wall (left) where raiders wait
        c.fillStyle = '#3d4466'; c.fillRect(0, WALL_TOP, 262, GROUND - WALL_TOP);
        c.fillStyle = 'rgba(0,0,0,.2)';
        for (var wy = WALL_TOP; wy < GROUND; wy += 22) for (var wx = ((wy / 22) % 2 ? 0 : 24); wx < 262; wx += 48) c.fillRect(wx, wy, 44, 18);
        c.fillStyle = '#4b5382'; c.fillRect(0, WALL_TOP - 8, 262, 10);
        for (var mm = 0; mm < 262; mm += 30) c.fillRect(mm, WALL_TOP - 24, 16, 18);
        // torch on the wall
        var fl = .8 + Math.sin(t * 13) * .2;
        var tg = c.createRadialGradient(150, WALL_TOP - 40, 4, 150, WALL_TOP - 40, 90 * fl);
        tg.addColorStop(0, 'rgba(255,170,60,.35)'); tg.addColorStop(1, 'rgba(255,170,60,0)');
        c.fillStyle = tg; c.fillRect(50, WALL_TOP - 140, 200, 200);
        c.fillStyle = '#6b4a2b'; c.fillRect(148, WALL_TOP - 36, 4, 26);
        c.fillStyle = '#fbbf24'; c.beginPath(); c.ellipse(150, WALL_TOP - 42, 5 * fl, 9 * fl, 0, 0, 7); c.fill();
        // raiders queued on the wall
        for (var i = 0; i < d.wall; i++) drawRaider(c, DROP_X - 12 - i * 22, WALL_TOP - 8, 1, t * 3 + i, false);
        if (d.wall > 0 && d.phase === 'section') {
          c.fillStyle = '#fde68a'; c.font = '800 12px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText('▼', DROP_X - 12, WALL_TOP - 60 + Math.sin(t * 5) * 3);
        }

        // safe door on the right
        c.fillStyle = '#3d4466'; c.fillRect(SAFE_X - 4, 150, W - SAFE_X + 4, GROUND - 150);
        var dg = c.createRadialGradient(SAFE_X + 40, GROUND - 40, 4, SAFE_X + 40, GROUND - 40, 110);
        dg.addColorStop(0, 'rgba(253,224,71,.35)'); dg.addColorStop(1, 'rgba(253,224,71,0)');
        c.fillStyle = dg; c.fillRect(SAFE_X - 80, GROUND - 160, 240, 200);
        c.fillStyle = '#1c1917'; c.beginPath(); c.moveTo(SAFE_X + 8, GROUND); c.lineTo(SAFE_X + 8, GROUND - 60); c.arc(SAFE_X + 40, GROUND - 60, 32, Math.PI, 0); c.lineTo(SAFE_X + 72, GROUND); c.closePath(); c.fill();
        c.fillStyle = '#fde68a'; c.beginPath(); c.moveTo(SAFE_X + 16, GROUND); c.lineTo(SAFE_X + 16, GROUND - 58); c.arc(SAFE_X + 40, GROUND - 58, 24, Math.PI, 0); c.lineTo(SAFE_X + 64, GROUND); c.closePath(); c.fill();
        if (d.phase === 'loot') {
          c.fillStyle = '#92400e'; U.roundRect(c, SAFE_X + 18, GROUND - 30, 44, 26, 4); c.fill();
          c.fillStyle = '#fbbf24'; c.fillRect(SAFE_X + 18, GROUND - 32, 44, 6);
        }
        for (var sfi = 0; sfi < d.safe; sfi++) drawRaider(c, SAFE_X + 22 + (sfi % 4) * 12, GROUND - (sfi >= 4 ? 4 : 0), -1, t * 4 + sfi, true);

        // runners
        d.runners.forEach(function (r) { drawRaider(c, r.x, r.y, 1, r.state === 'run' ? r.step : 0, false); });

        // particles + pops
        d.parts.forEach(function (q) { c.globalAlpha = Math.max(0, q.life / q.max); c.fillStyle = q.col; c.fillRect(q.x - q.sz / 2, q.y - q.sz / 2, q.sz, q.sz); });
        c.globalAlpha = 1;
        d.pops.forEach(function (q) {
          c.globalAlpha = Math.max(0, q.life / q.max); c.fillStyle = q.col; c.textAlign = 'center';
          c.font = (q.big ? '900 22px' : '800 14px') + ' Outfit, sans-serif'; c.shadowColor = '#000'; c.shadowBlur = 6; c.fillText(q.text, q.x, q.y); c.shadowBlur = 0;
        });
        c.globalAlpha = 1;
        c.restore();

        if (d.flash > 0) { c.fillStyle = 'rgba(253,224,71,' + d.flash * .4 + ')'; c.fillRect(0, 0, W, H); }

        // alarm bar
        var af = U.clamp(d.alarm / d.alarmMax, 0, 1), abw = 300, abx = W / 2 - abw / 2, aby = H - 36;
        c.fillStyle = 'rgba(0,0,0,.5)'; U.roundRect(c, abx - 8, aby - 8, abw + 16, 30, 8); c.fill();
        c.fillStyle = 'rgba(255,255,255,.12)'; U.roundRect(c, abx, aby, abw, 14, 7); c.fill();
        c.fillStyle = af < .25 ? (Math.floor(t * 6) % 2 ? '#ef4444' : '#f97316') : '#a78bfa'; U.roundRect(c, abx, aby, abw * af, 14, 7); c.fill();
        c.fillStyle = '#fff'; c.font = '800 11px Outfit, sans-serif'; c.textAlign = 'center';
        c.fillText(d.phase === 'section' ? 'ALARM IN ' + Math.max(0, Math.ceil(d.alarm)) + 's — anyone still on the wall is lost' : 'ALARM', W / 2, aby + 11);

        c.fillStyle = 'rgba(255,255,255,.55)'; c.font = '700 12px Outfit, sans-serif'; c.textAlign = 'left';
        var names = hz.map(function (h) { return HAZ[h.kind].name; }).join(' and ');
        c.fillText('Castle ' + d.castle + '  ·  section ' + (d.sec + 1) + ' / ' + d.sections.length + (names ? '  ·  ' + names : ''), 16, H - 20);
        c.textAlign = 'right'; c.fillText(d.lost + ' lost so far', W - 16, H - 20);

        if (d.msgT > 0) {
          c.globalAlpha = Math.min(1, d.msgT); c.fillStyle = '#fde68a'; c.font = '900 26px Outfit, sans-serif'; c.textAlign = 'center';
          c.shadowColor = '#000'; c.shadowBlur = 10; c.fillText(d.msg, W / 2, 178); c.shadowBlur = 0; c.globalAlpha = 1;
        }
      }
    });
  }

  window.Milo.register({
    id: 'castle-raid', title: 'Castle Raid', emo: '🏹', category: 'Action',
    tagline: 'Time each drop; every survivor multiplies the loot',
    description: 'A side-view raid built on timing. Your party waits on the outer wall and each ' +
      'press drops one raider, who falls into the courtyard and sprints for the lit door past ' +
      'a portcullis, tipping oil, arrow slits, a swinging blade or a trapdoor — each cycling on ' +
      'its own period. The ring above every hazard is its clock, red where it kills and green ' +
      'where it is safe, and the white arc on the rim is exactly where a raider dropped this ' +
      'instant would be crossing, so you wait for the white to sit in the green and press. An ' +
      'alarm timer strands anyone left on the wall, later castles run two hazards per section ' +
      'and faster cycles, and the treasury pays castle value times survivors, so losing a raider ' +
      'early costs you on every room after. Tip: when the white arc is fully green, tap twice ' +
      'quickly — two raiders fit through most windows.',
    controls: ['Space drop', 'Click / tap drop'],
    colors: ['#232a4a', '#fde68a'],
    tags: ['timing', 'castle', 'raid', 'rhythm', 'action'],
    mount: mount
  });
})();
