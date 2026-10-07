/* Ice Breaker — smash a path across a lake that freezes shut behind you. */
(function () {
  'use strict';
  var COLS = 20, ROWS = 13, CELL = 40, W = COLS * CELL, H = ROWS * CELL + 40;
  var VEC = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  var ICE_COL = ['#0c2a4a', '#e0f2fe', '#a5d8ff', '#6fb7f0'];
  var STRESS = [0, 7, 13, 20];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.grid = [];
      for (var r = 0; r < ROWS; r++) {
        d.grid.push([]);
        for (var c = 0; c < COLS; c++) d.grid[r].push({ ice: 1, hits: 0, t: 0, seed: Math.random() * 100, frost: 0 });
      }
      var sc = COLS >> 1, sr = ROWS >> 1;
      for (var rr = -1; rr <= 1; rr++) for (var cc = -1; cc <= 1; cc++) d.grid[sr + rr][sc + cc].ice = 0;
      d.ship = { c: sc, r: sr, x: sc * CELL + CELL / 2, y: sr * CELL + CELL / 2, face: 'right', moving: 0, cool: 0, bump: 0 };
      d.fish = []; d.caught = 0; d.stress = 0; d.parts = []; d.pops = []; d.snow = [];
      for (var i = 0; i < 60; i++) d.snow.push({ x: Math.random() * W, y: Math.random() * H, v: U.rand(12, 30), ph: Math.random() * 6.28 });
      d.refreeze = 6.5; d.blizzardT = 32; d.blizzFlash = 0; d.creak = 0; d.time = 0; d.shake = 0;
      d.msg = ''; d.msgT = 0;
      for (var f = 0; f < 2; f++) spawnFish(d);
      g.set('Score', 0); g.set('Fish', 0); g.set('Hull', '100%');
    }

    function spawnFish(d) {
      for (var tries = 0; tries < 60; tries++) {
        var c = U.randInt(1, COLS - 2), r = U.randInt(1, ROWS - 2);
        var tile = d.grid[r][c];
        if (tile.ice === 0) continue;
        if (U.dist(c, r, d.ship.c, d.ship.r) < 3) continue;
        var dup = d.fish.some(function (f) { return f.c === c && f.r === r; });
        if (dup) continue;
        d.fish.push({ c: c, r: r, life: Math.max(7, 14 - d.caught * .2), max: 14, ph: Math.random() * 6.28, big: Math.random() < .2 });
        return;
      }
    }

    function shards(d, x, y, n, col) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.28, s = U.rand(40, 220);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(.3, .7), max: .7, col: col || '#f0f9ff', sz: U.rand(2, 6), spin: U.rand(-8, 8), a: Math.random() * 6.28 });
      }
    }

    function pop(d, x, y, text, col) { d.pops.push({ x: x, y: y, text: text, col: col || '#fde68a', life: .9, max: .9 }); }

    function tryMove(g, dir) {
      var d = g.data, s = d.ship;
      if (s.moving > 0 || s.cool > 0) return;
      s.face = dir;
      var v = VEC[dir], nc = s.c + v[0], nr = s.r + v[1];
      if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS) { s.bump = .15; return; }
      var tile = d.grid[nr][nc];
      if (tile.ice === 0) {
        s.c = nc; s.r = nr; s.moving = .13; s.cool = .04;
        tile.t = 0;
        Milo.sound.tone({ f: 120, f2: 90, d: .05, v: .02, type: 'sine' });
        return;
      }
      // bash the ice
      s.cool = .17; s.bump = .17;
      tile.hits++;
      d.stress = Math.min(100, d.stress + STRESS[tile.ice] * (1 + d.caught * .01));
      d.shake = .25;
      var px = nc * CELL + CELL / 2, py = nr * CELL + CELL / 2;
      Milo.sound.noise(.09, .12, tile.ice === 1 ? 2600 : 1400);
      Milo.sound.tone({ f: 200 - tile.ice * 30, f2: 80, d: .08, v: .07, type: 'square' });
      shards(d, px - v[0] * 10, py - v[1] * 10, 5, ICE_COL[tile.ice]);
      if (tile.hits >= tile.ice) {
        var lvl = tile.ice;
        tile.ice = 0; tile.hits = 0; tile.t = 0;
        shards(d, px, py, 10 + lvl * 4);
        Milo.sound.tone({ f: 420, f2: 160, d: .14, v: .08, type: 'triangle' });
        // any fish under that tile jumps aboard
        for (var i = d.fish.length - 1; i >= 0; i--) {
          var f = d.fish[i];
          if (f.c === nc && f.r === nr) {
            d.fish.splice(i, 1);
            var pts = (f.big ? 25 : 10) * lvl;
            d.caught++; g.score += pts;
            g.set('Score', U.fmt(g.score)); g.set('Fish', d.caught);
            pop(d, px, py - 10, '+' + pts + (f.big ? ' BIG' : ''));
            shards(d, px, py, 8, '#fb923c');
            Milo.sound.coin();
            if (d.caught % 5 === 0) { d.refreeze = Math.max(2.8, d.refreeze - .4); d.msg = 'The lake freezes faster'; d.msgT = 1.6; }
          }
        }
        s.c = nc; s.r = nr; s.moving = .13;
      }
      if (d.stress >= 100) {
        shards(d, s.x, s.y, 40, '#dc2626');
        Milo.sound.explode();
        g.gameOver({ text: 'The hull cracked after ' + d.caught + ' fish and ' + U.time(d.time) + ' on the ice.' });
      }
    }

    function blizzard(g) {
      var d = g.data, s = d.ship;
      d.blizzFlash = .8; d.shake = .6;
      var thick = d.caught >= 20 ? 3 : 2;
      for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
        var t = d.grid[r][c];
        if (t.ice === 0 && !(c === s.c && r === s.r)) { t.ice = thick; t.hits = 0; t.frost = 1; }
      }
      Milo.sound.noise(.6, .2, 500);
      Milo.sound.tone({ f: 500, f2: 120, d: .6, v: .08, type: 'sawtooth' });
      d.msg = 'BLIZZARD — everything refroze'; d.msgT = 2;
    }

    return Milo.arcade(host, {
      id: 'ice-breaker',
      w: W, h: H, bg: '#061a2e',
      stats: ['Score', 'Fish', 'Hull'],
      touch: 'dpad',
      emo: '🧊',
      start: {
        title: 'Ice Breaker',
        text: 'Ram the ice to open a channel, and open the tiles fish are hiding under. ' +
          'Water refreezes behind you into thicker pack ice, every hit stresses the hull, ' +
          'and a blizzard now and then freezes the whole lake at once. Keep a way out.',
        keys: ['← ↑ ↓ → steer / ram']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, s = d.ship, inp = g.input;
        d.time += dt;
        for (var k in VEC) if (inp.down(k)) { tryMove(g, k); break; }
        if (g.state !== 'play') return;

        s.moving = Math.max(0, s.moving - dt); s.cool -= dt; s.bump = Math.max(0, s.bump - dt);
        var tx = s.c * CELL + CELL / 2, ty = s.r * CELL + CELL / 2;
        s.x += (tx - s.x) * Math.min(1, dt * 16); s.y += (ty - s.y) * Math.min(1, dt * 16);

        // hull stress recovers slowly
        d.stress = Math.max(0, d.stress - dt * (d.stress > 70 ? 7 : 10));
        g.set('Hull', Math.round(100 - d.stress) + '%');
        d.creak -= dt;
        if (d.stress > 70 && d.creak <= 0) { d.creak = U.rand(.6, 1.4); Milo.sound.tone({ f: 90, f2: 60, d: .3, v: .06, type: 'sawtooth' }); }

        // refreeze
        var thick = d.caught >= 20 ? 3 : 2;
        for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
          var t = d.grid[r][c];
          t.frost = Math.max(0, t.frost - dt * 1.5);
          if (t.ice !== 0) continue;
          if (c === s.c && r === s.r) { t.t = 0; continue; }
          t.t += dt;
          if (t.t >= d.refreeze) { t.ice = thick; t.hits = 0; t.frost = 1; t.t = 0; }
        }

        // blizzard cycle
        d.blizzardT -= dt;
        if (d.blizzardT <= 3 && d.blizzardT + dt > 3) { d.msg = 'Blizzard coming — get moving'; d.msgT = 2.5; Milo.sound.tone({ f: 300, f2: 200, d: .3, v: .06, type: 'triangle' }); }
        if (d.blizzardT <= 0) { blizzard(g); d.blizzardT = Math.max(16, 32 - d.caught * .5); }
        d.blizzFlash = Math.max(0, d.blizzFlash - dt);
        d.shake = Math.max(0, d.shake - dt * 3);
        d.msgT = Math.max(0, d.msgT - dt);

        // fish
        d.fish = d.fish.filter(function (f) {
          f.life -= dt; f.ph += dt * 3;
          if (d.grid[f.r][f.c].ice === 0) { f.life = 0; }
          return f.life > 0;
        });
        var want = Math.min(4, 2 + Math.floor(d.caught / 8));
        if (d.fish.length < want && Math.random() < dt * .8) spawnFish(d);

        d.parts = d.parts.filter(function (q) {
          q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= .92; q.vy *= .92; q.a += q.spin * dt; q.life -= dt; return q.life > 0;
        });
        d.pops = d.pops.filter(function (q) { q.life -= dt; q.y -= 26 * dt; return q.life > 0; });
        d.snow.forEach(function (sn) { sn.y += sn.v * dt * (d.blizzFlash > 0 ? 12 : 1); sn.x += Math.sin(sn.ph + d.time) * 10 * dt; if (sn.y > H) { sn.y = -4; sn.x = Math.random() * W; } });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, s = d.ship, t = g.t;
        c.save();
        if (d.shake > 0) c.translate(U.rand(-1, 1) * d.shake * 5, U.rand(-1, 1) * d.shake * 5);
        // tiles
        for (var r = 0; r < ROWS; r++) for (var cc = 0; cc < COLS; cc++) {
          var tile = d.grid[r][cc], x = cc * CELL, y = r * CELL;
          if (tile.ice === 0) {
            c.fillStyle = ICE_COL[0]; c.fillRect(x, y, CELL, CELL);
            var rip = Math.sin(t * 2 + tile.seed) * .5 + .5;
            c.fillStyle = 'rgba(147,197,253,' + (0.08 + rip * .06) + ')';
            c.fillRect(x + 6, y + 10 + rip * 6, CELL - 12, 2);
            c.fillRect(x + 10, y + 26 - rip * 4, CELL - 20, 2);
            var fr = U.clamp(tile.t / d.refreeze, 0, 1);
            if (fr > 0) {
              c.fillStyle = 'rgba(224,242,254,' + fr * .75 + ')';
              var band = CELL * fr * .5;
              c.fillRect(x, y, CELL, band); c.fillRect(x, y + CELL - band, CELL, band);
              c.fillRect(x, y, band, CELL); c.fillRect(x + CELL - band, y, band, CELL);
            }
          } else {
            c.fillStyle = ICE_COL[tile.ice]; c.fillRect(x, y, CELL, CELL);
            c.fillStyle = 'rgba(255,255,255,' + (0.12 + U.hash2(cc, r, 7) * .2) + ')';
            c.fillRect(x + 3, y + 3, CELL - 6, 8);
            if (tile.ice >= 2) {
              c.strokeStyle = 'rgba(30,64,120,.25)'; c.lineWidth = 2;
              c.beginPath(); c.moveTo(x + 6, y + 30); c.lineTo(x + 18, y + 18); c.lineTo(x + 34, y + 28); c.stroke();
              if (tile.ice === 3) { c.beginPath(); c.moveTo(x + 8, y + 14); c.lineTo(x + 26, y + 8); c.lineTo(x + 36, y + 16); c.stroke(); }
            }
            if (tile.frost > 0) { c.fillStyle = 'rgba(255,255,255,' + tile.frost * .7 + ')'; c.fillRect(x, y, CELL, CELL); }
            if (tile.hits > 0) {
              c.strokeStyle = 'rgba(12,42,74,.75)'; c.lineWidth = 1.6;
              for (var h = 0; h < tile.hits * 3; h++) {
                var a0 = U.hash2(cc * 7 + h, r * 3, 11) * 6.28, len = 10 + U.hash2(h, cc + r, 13) * 14;
                c.beginPath(); c.moveTo(x + CELL / 2, y + CELL / 2);
                c.lineTo(x + CELL / 2 + Math.cos(a0) * len, y + CELL / 2 + Math.sin(a0) * len);
                c.lineTo(x + CELL / 2 + Math.cos(a0 + .4) * (len + 6), y + CELL / 2 + Math.sin(a0 + .4) * (len + 6)); c.stroke();
              }
            }
          }
          c.strokeStyle = 'rgba(6,26,46,.35)'; c.lineWidth = 1; c.strokeRect(x + .5, y + .5, CELL - 1, CELL - 1);
        }

        // fish shadows under the ice
        d.fish.forEach(function (f) {
          var fx = f.c * CELL + CELL / 2 + Math.sin(f.ph) * 6, fy = f.r * CELL + CELL / 2;
          var urgency = f.life < 3 ? (Math.floor(t * 8) % 2 ? .35 : .85) : .6;
          c.fillStyle = 'rgba(251,146,60,' + urgency + ')';
          var sz = f.big ? 1.5 : 1;
          c.beginPath(); c.ellipse(fx, fy, 11 * sz, 6 * sz, Math.sin(f.ph) * .2, 0, 7); c.fill();
          c.beginPath(); c.moveTo(fx - 10 * sz, fy); c.lineTo(fx - 18 * sz, fy - 6 * sz); c.lineTo(fx - 18 * sz, fy + 6 * sz); c.closePath(); c.fill();
          c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(fx + 5 * sz, fy - 1, 1.6, 0, 7); c.fill();
        });

        // ship
        var v = VEC[s.face], ang = Math.atan2(v[1], v[0]);
        c.save(); c.translate(s.x - v[0] * s.bump * 40, s.y - v[1] * s.bump * 40); c.rotate(ang);
        c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(2, 3, 18, 10, 0, 0, 7); c.fill();
        c.fillStyle = '#dc2626';
        c.beginPath(); c.moveTo(20, 0); c.lineTo(8, -10); c.lineTo(-16, -10); c.lineTo(-18, 0); c.lineTo(-16, 10); c.lineTo(8, 10); c.closePath(); c.fill();
        c.fillStyle = '#7f1d1d'; c.fillRect(-16, -10, 24, 3);
        c.fillStyle = '#f8fafc'; U.roundRect(c, -10, -6, 14, 12, 3); c.fill();
        c.fillStyle = '#1e3a5f'; c.fillRect(-4, -3, 5, 6);
        c.fillStyle = '#facc15'; c.fillRect(-14, -3, 4, 6);
        c.restore();
        // smoke
        if (g.frame % 6 === 0 && g.state === 'play') d.parts.push({ x: s.x - v[0] * 12, y: s.y - v[1] * 12, vx: U.rand(-10, 10), vy: -20, life: .8, max: .8, col: 'rgba(148,163,184,.5)', sz: 4, spin: 0, a: 0 });

        d.parts.forEach(function (q) {
          c.save(); c.globalAlpha = Math.max(0, q.life / q.max); c.translate(q.x, q.y); c.rotate(q.a);
          c.fillStyle = q.col; c.fillRect(-q.sz / 2, -q.sz / 2, q.sz, q.sz); c.restore();
        });
        d.pops.forEach(function (q) {
          c.globalAlpha = Math.max(0, q.life / q.max); c.fillStyle = q.col;
          c.font = '800 15px Outfit, sans-serif'; c.textAlign = 'center'; c.fillText(q.text, q.x, q.y);
        });
        c.globalAlpha = 1;
        c.restore();

        // snow + blizzard flash
        c.fillStyle = 'rgba(255,255,255,.7)';
        d.snow.forEach(function (sn) { c.fillRect(sn.x, sn.y, 2, 2); });
        if (d.blizzFlash > 0) { c.fillStyle = 'rgba(255,255,255,' + d.blizzFlash * .6 + ')'; c.fillRect(0, 0, W, H); }

        // hull meter strip
        c.fillStyle = '#04111f'; c.fillRect(0, ROWS * CELL, W, 40);
        var mw = W - 260, mx = 130, my = ROWS * CELL + 13;
        c.fillStyle = 'rgba(255,255,255,.1)'; U.roundRect(c, mx, my, mw, 14, 7); c.fill();
        var sf = d.stress / 100;
        c.fillStyle = sf > .7 ? (Math.floor(t * 6) % 2 ? '#ef4444' : '#f97316') : sf > .4 ? '#f59e0b' : '#38bdf8';
        U.roundRect(c, mx, my, mw * sf, 14, 7); c.fill();
        c.fillStyle = '#e0f2fe'; c.font = '800 12px Outfit, sans-serif'; c.textAlign = 'right';
        c.fillText('HULL STRESS', mx - 10, my + 11);
        c.textAlign = 'left';
        c.fillText(d.blizzardT < 3 ? '❄ ' + Math.ceil(d.blizzardT) : 'blizzard ' + Math.ceil(d.blizzardT) + 's', mx + mw + 10, my + 11);

        if (d.msgT > 0) {
          c.globalAlpha = Math.min(1, d.msgT); c.fillStyle = '#fff'; c.font = '900 24px Outfit, sans-serif'; c.textAlign = 'center';
          c.shadowColor = '#000'; c.shadowBlur = 10; c.fillText(d.msg, W / 2, 60); c.shadowBlur = 0; c.globalAlpha = 1;
        }
      }
    });
  }

  window.Milo.register({
    id: 'ice-breaker', title: 'Ice Breaker', emo: '🧊', category: 'Action',
    tagline: 'Ram a channel; the lake freezes shut behind you',
    description: 'You steer an icebreaker across a grid lake. Ramming a tile cracks it (thin ' +
      'ice in one hit, refrozen pack ice in two, later three) and every hit stresses the ' +
      'hull, which only recovers while you are not ramming. Fish hide as orange shadows under ' +
      'the ice for a few seconds; open their tile to haul them in, worth more under thicker ' +
      'ice. Open water refreezes into pack ice a few seconds after you leave it, faster with ' +
      'every five fish, and a blizzard every half minute freezes everything at once — get ' +
      'boxed in by pack ice and the hull pays for it. Tip: circle back through your own ' +
      'channel while it is still open instead of ramming fresh pack.',
    controls: ['← ↑ ↓ →', 'WASD'],
    colors: ['#0c2a4a', '#e0f2fe'],
    tags: ['ice', 'grid', 'fishing', 'survival', 'action'],
    mount: mount
  });
})();
