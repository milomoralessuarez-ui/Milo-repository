/* Paint Wars — 90 seconds, three blobs, one floor. Paint more of it than they do. */
(function () {
  'use strict';
  var W = 800, H = 560, CELL = 20, GW = W / CELL, GH = H / CELL, TOTAL = GW * GH;
  var TIME = 90;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    var COLS = [null, '#22d3ee', '#f472b6', '#a3e635'];
    var DARK = [null, '#0b4a56', '#5e1e3c', '#3e5214'];
    var NAMES = [null, 'YOU', 'ROSA', 'LIMEY'];

    function reset(g) {
      var d = g.data;
      d.grid = [];
      for (var i = 0; i < TOTAL; i++) d.grid.push(0);
      d.counts = [0, 0, 0, 0];
      d.left = TIME;
      d.blobs = [
        { idx: 1, x: 100, y: H / 2, vx: 0, vy: 0, ink: 100, wob: 0 },
        { idx: 2, x: W - 100, y: 120, vx: 0, vy: 0, ink: 100, wob: 2, think: 0, tx: W / 2, ty: H / 2 },
        { idx: 3, x: W - 100, y: H - 120, vx: 0, vy: 0, ink: 100, wob: 4, think: .5, tx: W / 2, ty: H / 2 }
      ];
      d.bottles = [];
      d.nextBottle = 8;
      d.parts = [];
      d.ptr = null;
      d.beeped = -1;
      d.over = false;
      // everyone starts on a small home patch
      d.blobs.forEach(function (b) { stamp(d, b, 30); });
      g.set('Score', '0%');
      g.set('Time', U.time(TIME));
      g.set('Ink', 100);
    }

    function stamp(d, b, r) {
      var c0 = Math.max(0, Math.floor((b.x - r) / CELL)), c1 = Math.min(GW - 1, Math.floor((b.x + r) / CELL));
      var r0 = Math.max(0, Math.floor((b.y - r) / CELL)), r1 = Math.min(GH - 1, Math.floor((b.y + r) / CELL));
      for (var cy = r0; cy <= r1; cy++) {
        for (var cx = c0; cx <= c1; cx++) {
          var px = cx * CELL + CELL / 2, py = cy * CELL + CELL / 2;
          if (U.dist(px, py, b.x, b.y) > r) continue;
          var i = cy * GW + cx;
          var was = d.grid[i];
          if (was === b.idx) continue;
          if (b.ink < 1) continue;
          b.ink -= was === 0 ? .55 : .85;   // stealing costs more
          d.grid[i] = b.idx;
          d.counts[b.idx]++;
          if (was) {
            d.counts[was]--;
            if (Math.random() < .3) splat(d, px, py, COLS[b.idx]);
          }
        }
      }
    }

    function splat(d, x, y, col) {
      for (var i = 0; i < 3; i++) {
        var a = Math.random() * 6.28, s = U.rand(30, 130);
        d.parts.push({
          x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
          life: U.rand(.25, .5), max: .5, col: col, r: U.rand(2, 5)
        });
      }
    }

    function cellAt(d, x, y) {
      var cx = U.clamp(Math.floor(x / CELL), 0, GW - 1);
      var cy = U.clamp(Math.floor(y / CELL), 0, GH - 1);
      return d.grid[cy * GW + cx];
    }

    function speedOn(d, b) {
      var on = cellAt(d, b.x, b.y);
      if (on === b.idx) return 288;
      if (on === 0) return 240;
      return 182;                       // enemy paint is sticky
    }

    function aiThink(d, b) {
      b.think = U.rand(.5, 1.1);
      if (b.ink < 22) {
        // low ink: run home to own paint
        var best = null, bd = 1e9;
        for (var i = 0; i < TOTAL; i += 3) {
          if (d.grid[i] !== b.idx) continue;
          var px = (i % GW) * CELL + CELL / 2, py = Math.floor(i / GW) * CELL + CELL / 2;
          var dd = U.dist(b.x, b.y, px, py);
          if (dd < bd) { bd = dd; best = { x: px, y: py }; }
        }
        if (best) { b.tx = best.x; b.ty = best.y; return; }
      }
      // otherwise: sample spots, favour dense not-mine territory nearby
      var bestScore = -1e9, tx = b.tx, ty = b.ty;
      for (var s = 0; s < 10; s++) {
        var cx = U.randInt(1, GW - 2), cy = U.randInt(1, GH - 2);
        var dens = 0;
        for (var oy = -1; oy <= 1; oy++) {
          for (var ox = -1; ox <= 1; ox++) {
            var v = d.grid[(cy + oy) * GW + cx + ox];
            if (v !== b.idx) dens += (v === 0 ? 1 : 1.6);   // stealing scores extra
          }
        }
        var px2 = cx * CELL + CELL / 2, py2 = cy * CELL + CELL / 2;
        var score = dens * 60 - U.dist(b.x, b.y, px2, py2) * .55;
        if (score > bestScore) { bestScore = score; tx = px2; ty = py2; }
      }
      b.tx = tx; b.ty = ty;
    }

    function finish(g) {
      var d = g.data;
      d.over = true;
      var pct = [0, 0, 0, 0], best = 1;
      for (var i = 1; i <= 3; i++) {
        pct[i] = d.counts[i] / TOTAL * 100;
        if (pct[i] > pct[best]) best = i;
      }
      var score = Math.round(pct[1] * 10);
      var lines = 'You ' + pct[1].toFixed(1) + '% — Rosa ' + pct[2].toFixed(1) + '% — Limey ' + pct[3].toFixed(1) + '%.';
      if (best === 1) {
        g.win({ score: score, emo: '🎨', title: 'Floor Is Yours!', text: lines });
      } else {
        g.gameOver({
          score: score, emo: '🖌️', title: 'Out-painted by ' + NAMES[best],
          text: lines + ' Refill on your own colour and steal theirs — stolen ground swings two shares.'
        });
      }
    }

    return Milo.arcade(host, {
      id: 'paint-wars',
      w: W, h: H, bg: '#14141c',
      stats: ['Score', 'Time', 'Ink'],
      emo: '🎨',
      touch: 'dpad',
      start: {
        title: 'Paint Wars',
        text: 'Ninety seconds, three blobs, one floor. Ink is finite — it only refills ' +
          'while you sit on your own colour — and enemy paint is sticky to cross. ' +
          'Biggest share of the floor wins.',
        keys: ['WASD / Arrows', 'Or hold the pointer to steer']
      },
      init: reset,
      onPointer: function (g, type, x, y) {
        var d = g.data;
        if (type === 'down' || (type === 'move' && g.input.pdown)) d.ptr = { x: x, y: y };
        if (type === 'up') d.ptr = null;
      },

      update: function (g, dt) {
        var d = g.data;
        if (d.over) return;
        var p = d.blobs[0];

        d.left -= dt;
        if (d.left <= 5 && Math.ceil(d.left) !== d.beeped && d.left > 0) {
          d.beeped = Math.ceil(d.left);
          Milo.sound.tone({ f: 880, d: .08, v: .08, type: 'square' });
        }
        g.set('Time', U.time(Math.max(0, d.left)));
        if (d.left <= 0) { finish(g); return; }

        /* player */
        var ax = g.input.axis();
        var mx = ax.x, my = ax.y;
        if (!mx && !my && d.ptr) {
          var pd = U.dist(p.x, p.y, d.ptr.x, d.ptr.y);
          if (pd > 14) { mx = (d.ptr.x - p.x) / pd; my = (d.ptr.y - p.y) / pd; }
        }
        var ml = Math.hypot(mx, my) || 1;
        var sp = speedOn(d, p);
        p.vx += (mx / ml * sp - p.vx) * Math.min(1, 8 * dt);
        p.vy += (my / ml * sp - p.vy) * Math.min(1, 8 * dt);
        p.x = U.clamp(p.x + p.vx * dt, 16, W - 16);
        p.y = U.clamp(p.y + p.vy * dt, 16, H - 16);
        p.wob += dt * (1 + Math.hypot(p.vx, p.vy) / 60);

        /* AI blobs */
        for (var b2 = 1; b2 < 3; b2++) {
          var b = d.blobs[b2];
          b.think -= dt;
          if (b.think <= 0) aiThink(d, b);
          var bd2 = U.dist(b.x, b.y, b.tx, b.ty);
          if (bd2 < 24) aiThink(d, b);
          var bsp = speedOn(d, b) * .94;   // a touch slower than you
          var bx2 = (b.tx - b.x) / (bd2 || 1), by2 = (b.ty - b.y) / (bd2 || 1);
          b.vx += (bx2 * bsp - b.vx) * Math.min(1, 6 * dt);
          b.vy += (by2 * bsp - b.vy) * Math.min(1, 6 * dt);
          b.x = U.clamp(b.x + b.vx * dt, 16, W - 16);
          b.y = U.clamp(b.y + b.vy * dt, 16, H - 16);
          b.wob += dt * (1 + Math.hypot(b.vx, b.vy) / 60);
        }

        /* painting + ink */
        d.blobs.forEach(function (bb) {
          stamp(d, bb, 17);
          if (cellAt(d, bb.x, bb.y) === bb.idx) bb.ink = Math.min(100, bb.ink + 34 * dt);
        });
        g.set('Ink', Math.round(p.ink));

        /* ink bottles */
        d.nextBottle -= dt;
        if (d.nextBottle <= 0 && d.bottles.length < 2) {
          d.nextBottle = U.rand(9, 14);
          d.bottles.push({ x: U.rand(60, W - 60), y: U.rand(60, H - 60), t: 0 });
        }
        d.bottles = d.bottles.filter(function (bt) {
          bt.t += dt;
          for (var bi = 0; bi < d.blobs.length; bi++) {
            var bb = d.blobs[bi];
            if (U.dist(bb.x, bb.y, bt.x, bt.y) < 22) {
              bb.ink = 100;
              splat(d, bt.x, bt.y, '#ffffff');
              splat(d, bt.x, bt.y, COLS[bb.idx]);
              if (bi === 0) Milo.sound.powerup();
              else Milo.sound.tone({ f: 300, f2: 500, d: .1, v: .05, type: 'triangle' });
              return false;
            }
          }
          return true;
        });

        g.score = Math.round(d.counts[1] / TOTAL * 1000);
        g.set('Score', (d.counts[1] / TOTAL * 100).toFixed(1) + '%');

        d.parts = d.parts.filter(function (q) {
          q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= .92; q.vy *= .92; q.life -= dt;
          return q.life > 0;
        });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.fillStyle = '#14141c'; c.fillRect(0, 0, W, H);

        // painted floor
        for (var cy = 0; cy < GH; cy++) {
          for (var cx = 0; cx < GW; cx++) {
            var v = d.grid[cy * GW + cx];
            if (!v) continue;
            c.fillStyle = DARK[v];
            c.fillRect(cx * CELL, cy * CELL, CELL, CELL);
            c.fillStyle = COLS[v];
            c.globalAlpha = .28;
            c.fillRect(cx * CELL + 1, cy * CELL + 1, CELL - 2, CELL - 2);
            c.globalAlpha = 1;
          }
        }
        // faint tile seams
        c.strokeStyle = 'rgba(255,255,255,.03)'; c.lineWidth = 1;
        for (var gx = 0; gx <= W; gx += CELL * 2) {
          c.beginPath(); c.moveTo(gx, 0); c.lineTo(gx, H); c.stroke();
        }
        for (var gy = 0; gy <= H; gy += CELL * 2) {
          c.beginPath(); c.moveTo(0, gy); c.lineTo(W, gy); c.stroke();
        }

        // bottles
        d.bottles.forEach(function (bt) {
          var bob = Math.sin(bt.t * 4) * 3;
          c.shadowColor = '#ffffff'; c.shadowBlur = 12;
          c.fillStyle = '#f0f0f4';
          U.roundRect(c, bt.x - 7, bt.y - 10 + bob, 14, 20, 4); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = '#14141c';
          c.fillRect(bt.x - 3, bt.y - 14 + bob, 6, 5);
          c.fillStyle = '#9ca3af';
          c.font = '800 9px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText('INK', bt.x, bt.y + 3 + bob);
        });

        // splats
        d.parts.forEach(function (q) {
          c.globalAlpha = Math.max(0, q.life / q.max);
          c.fillStyle = q.col;
          c.beginPath(); c.arc(q.x, q.y, q.r, 0, 7); c.fill();
        });
        c.globalAlpha = 1;

        // blobs
        d.blobs.forEach(function (b, bi) {
          var col = COLS[b.idx];
          var sq = 1 + Math.sin(b.wob * 6) * .07;
          c.save();
          c.translate(b.x, b.y);
          c.scale(sq, 1 / sq);
          c.shadowColor = col; c.shadowBlur = 16;
          c.fillStyle = col;
          c.beginPath(); c.arc(0, 0, 15, 0, 7); c.fill();
          c.shadowBlur = 0;
          // face
          c.fillStyle = '#14141c';
          var la = Math.atan2(b.vy, b.vx) || 0;
          c.beginPath();
          c.arc(Math.cos(la - .5) * 6, Math.sin(la - .5) * 6, 2.6, 0, 7);
          c.arc(Math.cos(la + .5) * 6, Math.sin(la + .5) * 6, 2.6, 0, 7);
          c.fill();
          c.restore();
          // ink ring
          c.strokeStyle = b.ink > 25 ? col : '#f87171';
          c.globalAlpha = .8;
          c.lineWidth = 3;
          c.beginPath();
          c.arc(b.x, b.y, 20, -Math.PI / 2, -Math.PI / 2 + (b.ink / 100) * 6.283);
          c.stroke();
          c.globalAlpha = 1;
          if (bi === 0) {
            c.fillStyle = '#e8edf3';
            c.font = '800 10px Outfit, sans-serif'; c.textAlign = 'center';
            c.fillText('YOU', b.x, b.y - 26);
          }
        });

        // live share bar
        var bw = 300, bx = W / 2 - bw / 2, tot = d.counts[1] + d.counts[2] + d.counts[3] || 1;
        c.fillStyle = 'rgba(0,0,0,.55)';
        U.roundRect(c, bx - 3, 44, bw + 6, 16, 8); c.fill();
        var run = bx;
        for (var i = 1; i <= 3; i++) {
          var seg = bw * d.counts[i] / tot;
          c.fillStyle = COLS[i];
          if (seg > 0) c.fillRect(run, 47, seg, 10);
          run += seg;
        }
        // timer
        var urgent = d.left <= 10;
        c.fillStyle = urgent && Math.floor(g.t * 4) % 2 === 0 ? '#f87171' : '#e8edf3';
        c.font = '800 20px Outfit, sans-serif'; c.textAlign = 'center';
        c.fillText(U.time(Math.max(0, d.left)), W / 2, 36);
      }
    });
  }

  window.Milo.register({
    id: 'paint-wars', title: 'Paint Wars', emo: '🎨', category: 'Action',
    tagline: '90 seconds to out-paint two rival blobs',
    description: 'Skate around the arena leaving your colour on every tile while Rosa ' +
      'and Limey do the same. Ink is the whole game: it drains as you claim tiles ' +
      '(stealing painted ground costs extra), only refills while you ride your own ' +
      'colour, and enemy paint slows you down. White bottles refill you instantly. ' +
      'After ninety seconds the floor is counted — every stolen tile swings the score ' +
      'by two, so raid whoever is winning.',
    controls: ['WASD / Arrows', 'Hold pointer'],
    colors: ['#22d3ee', '#f472b6'],
    tags: ['painting', 'territory', 'arena', 'timed', 'ai rivals'],
    mount: mount
  });
})();
