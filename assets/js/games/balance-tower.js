/* Balance Tower — stack odd shapes on a see-saw plank without tipping it. */
(function () {
  'use strict';
  var W = 480, H = 720, CELL = 26, PIVY = H - 150, PLAT_T = 14, HALF = 7, MAXCOL = 9, TIP = 20 * Math.PI / 180;
  var SHAPES = [
    { n: 'I2', c: [[0, 0], [1, 0]], hue: 190 },
    { n: 'I3', c: [[0, 0], [1, 0], [2, 0]], hue: 200 },
    { n: 'L', c: [[0, 0], [0, 1], [1, 0]], hue: 30 },
    { n: 'J', c: [[1, 0], [1, 1], [0, 0]], hue: 260 },
    { n: 'T', c: [[0, 0], [1, 0], [2, 0], [1, 1]], hue: 300 },
    { n: 'O', c: [[0, 0], [1, 0], [0, 1], [1, 1]], hue: 50 },
    { n: 'S', c: [[0, 0], [1, 0], [1, 1], [2, 1]], hue: 130 },
    { n: 'Z', c: [[1, 0], [2, 0], [0, 1], [1, 1]], hue: 0 },
    { n: 'Plus', c: [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]], hue: 340 },
    { n: 'U', c: [[0, 0], [2, 0], [0, 1], [1, 1], [2, 1]], hue: 160 },
    { n: 'BigL', c: [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0]], hue: 20 },
    { n: 'Long', c: [[0, 0], [1, 0], [2, 0], [3, 0]], hue: 210 },
    { n: 'Anvil', c: [[0, 0]], hue: 220, mass: 3, dark: true },
    { n: 'Brick', c: [[0, 0], [1, 0]], hue: 15, mass: 2, dark: true }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function rotateCells(cells) {
      var out = cells.map(function (p) { return [p[1], -p[0]]; });
      var mx = Infinity, my = Infinity;
      out.forEach(function (p) { mx = Math.min(mx, p[0]); my = Math.min(my, p[1]); });
      return out.map(function (p) { return [p[0] - mx, p[1] - my]; });
    }

    function spawn(d) {
      var placed = d.placed;
      var pool = SHAPES.filter(function (s) {
        if (s.n === 'Anvil') return placed >= 8;
        if (s.n === 'Brick') return placed >= 5;
        if (s.n === 'Plus' || s.n === 'U' || s.n === 'BigL') return placed >= 3;
        return true;
      });
      var sh = U.choice(pool);
      var cells = sh.c.slice();
      var rots = U.randInt(0, 3);
      for (var i = 0; i < rots; i++) cells = rotateCells(cells);
      return { cells: cells, hue: sh.hue, mass: sh.mass || 1, dark: !!sh.dark, name: sh.n, col: 0, y: 0, falling: false, vy: 0 };
    }

    function width(p) { var m = 0; p.cells.forEach(function (q) { m = Math.max(m, q[0]); }); return m + 1; }

    function clampCol(p) {
      var w = width(p);
      p.col = U.clamp(p.col, -MAXCOL, MAXCOL - w + 1);
    }

    function colTop(d, col) {
      var top = d.tops[col];
      if (top != null) return top;
      return Math.abs(col) <= HALF ? 0 : null;
    }

    function landingRow(d, p) {
      var best = null;
      p.cells.forEach(function (q) {
        var t = colTop(d, p.col + q[0]);
        if (t == null) return;
        var r = t - q[1];
        if (best == null || r > best) best = r;
      });
      return best;
    }

    function topRow(d) { var m = 0; for (var k in d.tops) m = Math.max(m, d.tops[k]); return m; }

    function newPiece(d) {
      d.cur = d.next || spawn(d);
      d.next = spawn(d);
      d.cur.col = -Math.floor(width(d.cur) / 2);
      d.cur.y = topRow(d) + 9;
      d.cur.falling = false;
    }

    function reset(g) {
      var d = g.data;
      d.grid = []; d.tops = {};
      d.placed = 0; d.height = 0; d.lives = 3;
      d.theta = 0; d.omega = 0; d.moment = 0; d.mass = 0; d.comx = 0;
      d.camY = 0;
      d.parts = []; d.floats = []; d.shake = 0;
      d.dead = false; d.deadT = 0; d.fallers = [];
      d.creak = 0; d.rep = 0;
      d.next = null;
      newPiece(d);
      g.set('Height', 0); g.set('Score', 0); g.set('Best', U.fmt(g.best));
    }

    function burst(d, x, y, col, n) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2, s = U.rand(30, 160);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life: U.rand(.3, .6), max: .6, col: col });
      }
    }

    function drop(g) {
      var d = g.data, p = d.cur;
      if (!p || p.falling || d.dead) return;
      var r = landingRow(d, p);
      if (r == null) {
        // Nothing under any cell: it slides straight off the plank.
        p.falling = true; p.target = -30; p.miss = true;
        Milo.sound.tone({ f: 400, f2: 120, d: .3, v: .08, type: 'sawtooth' });
        return;
      }
      p.falling = true; p.target = r; p.miss = false;
      Milo.sound.click();
    }

    function land(g) {
      var d = g.data, p = d.cur;
      var r = p.target;
      var sumx = 0;
      p.cells.forEach(function (q) {
        var col = p.col + q[0], row = r + q[1];
        d.grid.push({ col: col, row: row, hue: p.hue, dark: p.dark, mass: p.mass });
        d.tops[col] = Math.max(d.tops[col] || 0, row + 1);
        d.moment += p.mass * col; d.mass += p.mass;
        sumx += col;
      });
      d.comx = d.mass ? d.moment / d.mass : 0;
      d.placed++;
      var top = topRow(d);
      var pts = p.cells.length * p.mass * 10;
      if (top > d.height) { pts += (top - d.height) * 15; d.height = top; g.set('Height', d.height); }
      g.score += pts; g.set('Score', U.fmt(g.score));
      d.omega += (sumx / p.cells.length) * p.mass * .035;
      d.floats.push({ x: (p.col + width(p) / 2) * CELL, row: r + 2, text: '+' + pts, life: .9 });
      burst(d, (p.col + width(p) / 2) * CELL - CELL / 2, -(r * CELL) - PLAT_T / 2, 'hsl(' + p.hue + ',70%,60%)', 8);
      Milo.sound.tone({ f: 220 + p.mass * 40, f2: 120, d: .1, v: .09, type: 'triangle' });
      d.shake = 2 + p.mass;
      newPiece(d);
    }

    function topple(g) {
      var d = g.data;
      d.dead = true; d.deadT = 0;
      var dir = d.theta > 0 ? 1 : -1;
      d.fallers = d.grid.map(function (c) {
        return { col: c.col, row: c.row, hue: c.hue, dark: c.dark, vx: dir * U.rand(40, 160) + c.row * 6 * dir, vy: U.rand(-80, 40), rot: 0, vr: U.rand(-4, 4), x: c.col * CELL, y: -(c.row * CELL) - CELL / 2 - PLAT_T / 2 };
      });
      d.grid = []; d.tops = {};
      d.cur = null;
      d.shake = 10;
      Milo.sound.explode();
    }

    return Milo.arcade(host, {
      id: 'balance-tower',
      w: W, h: H, bg: '#f6efe3',
      stats: ['Height', 'Score', 'Best'],
      emo: '⚖️',
      touch: 'dpad+a',
      start: {
        title: 'Balance Tower',
        text: 'Drop odd shapes onto a plank balanced on a single point. The red dot is the centre of ' +
          'mass — keep it over the pivot or the whole tower slowly tips. Tilt past twenty degrees and ' +
          'everything slides off.',
        keys: ['← → move · ↑ rotate', 'Space / ↓ / tap to drop']
      },
      init: reset,
      onPointer: function (g, type, x) {
        var d = g.data, p = d.cur;
        if (!p || p.falling || d.dead || g.state !== 'play') return;
        var col = Math.round((x - W / 2) / CELL - width(p) / 2 + .5);
        p.col = col; clampCol(p);
        if (type === 'down') drop(g);
      },
      onKey: function (g, e) {
        var d = g.data, p = d.cur;
        if (!p || p.falling || d.dead) return;
        if (e.code === 'ArrowUp' || e.code === 'KeyW') { p.cells = rotateCells(p.cells); clampCol(p); Milo.sound.blip(); }
        if (e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'KeyS' || e.code === 'KeyX') drop(g);
      },

      update: function (g, dt) {
        var d = g.data, i = g.input;
        if (d.shake > 0) d.shake = Math.max(0, d.shake - dt * 30);
        d.parts = d.parts.filter(function (q) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 500 * dt; q.life -= dt; return q.life > 0; });
        d.floats = d.floats.filter(function (f) { f.row += dt * 1.2; f.life -= dt; return f.life > 0; });

        if (d.dead) {
          d.deadT += dt;
          d.theta += (d.theta > 0 ? 1 : -1) * 1.4 * dt;
          d.fallers.forEach(function (f) { f.vy += 900 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.rot += f.vr * dt; });
          if (d.deadT > 1.5) {
            g.gameOver({ emo: '⚖️', title: 'Timber!', text: 'The tower tipped at ' + d.height + ' rows after ' + d.placed + ' pieces.' });
          }
          return;
        }

        var p = d.cur;
        if (p && !p.falling) {
          var ax = (i.pressed('right') ? 1 : 0) - (i.pressed('left') ? 1 : 0);
          if (i.down('left') || i.down('right')) { d.rep += dt; if (d.rep > .16) { d.rep = 0; ax = i.down('right') ? 1 : -1; } } else d.rep = .1;
          if (ax) { p.col += ax; clampCol(p); }
          if (i.pressed('up')) { p.cells = rotateCells(p.cells); clampCol(p); Milo.sound.blip(); }
          if (i.pressed('action') || i.pressed('down') || i.pressed('a')) drop(g);
          var hover = topRow(d) + 9;
          p.y += (hover - p.y) * Math.min(1, dt * 6);
        } else if (p && p.falling) {
          p.vy = Math.min(p.vy + 90 * dt, 34);
          p.y -= p.vy * dt;
          if (p.miss) {
            if (p.y < -6) {
              d.lives--;
              d.floats.push({ x: p.col * CELL, row: 2, text: 'MISSED', life: 1, col: '#ef4444' });
              Milo.sound.hit();
              if (d.lives <= 0) { g.gameOver({ emo: '⚖️', title: 'Out of pieces', text: 'Three pieces slid off the plank. You reached ' + d.height + ' rows.' }); return; }
              newPiece(d);
            }
          } else if (p.y <= p.target) { p.y = p.target; land(g); }
        }

        // plank dynamics: target tilt from the moment, stiffer as the tower grows
        var factor = 1 + d.height * .03;
        var target = U.clamp(d.moment * factor * .0165, -TIP * 1.6, TIP * 1.6);
        var acc = (target - d.theta) * 28 - d.omega * 6;
        d.omega += acc * dt;
        d.theta += d.omega * dt;
        if (Math.abs(d.theta) > TIP * .6) {
          d.creak -= dt;
          if (d.creak <= 0) { d.creak = U.rand(.4, .9); Milo.sound.tone({ f: 90, f2: 70, d: .25, v: .05, type: 'sawtooth' }); }
        }
        if (Math.abs(d.theta) >= TIP && d.placed > 0) topple(g);

        var wantCam = Math.max(0, d.height * CELL - 260);
        d.camY += (wantCam - d.camY) * Math.min(1, dt * 3);
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.fillStyle = '#f6efe3'; c.fillRect(0, 0, W, H);
        c.strokeStyle = 'rgba(120,90,60,.08)'; c.lineWidth = 1;
        for (var ly = ((d.camY * .5) % 40); ly < H; ly += 40) { c.beginPath(); c.moveTo(0, ly); c.lineTo(W, ly); c.stroke(); }

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));
        // pivot
        var py = PIVY + d.camY;
        c.fillStyle = '#334155';
        c.beginPath(); c.moveTo(W / 2, py); c.lineTo(W / 2 + 26, py + 60); c.lineTo(W / 2 - 26, py + 60); c.closePath(); c.fill();
        c.fillStyle = '#1e293b'; c.fillRect(W / 2 - 70, py + 60, 140, 12);

        c.translate(W / 2, py);
        c.rotate(d.theta);
        // plank
        var pw = (HALF * 2 + 1) * CELL;
        c.fillStyle = '#7c4a1d';
        U.roundRect(c, -pw / 2, -PLAT_T / 2, pw, PLAT_T, 4); c.fill();
        c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(-pw / 2 + 4, -PLAT_T / 2 + 2, pw - 8, 3);
        // tick marks
        c.fillStyle = 'rgba(0,0,0,.25)';
        for (var k = -HALF; k <= HALF; k++) c.fillRect(k * CELL - 1, PLAT_T / 2 - 4, 2, 4);

        function cell(col, row, hue, dark, alpha) {
          var x = col * CELL - CELL / 2, y = -(row * CELL) - CELL - PLAT_T / 2;
          c.globalAlpha = alpha == null ? 1 : alpha;
          c.fillStyle = dark ? 'hsl(' + hue + ',30%,28%)' : 'hsl(' + hue + ',72%,58%)';
          U.roundRect(c, x + 1, y + 1, CELL - 2, CELL - 2, 4); c.fill();
          c.fillStyle = 'rgba(255,255,255,.28)'; U.roundRect(c, x + 3, y + 3, CELL - 6, 5, 2); c.fill();
          c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x + 3, y + CELL - 6, CELL - 6, 3);
          c.globalAlpha = 1;
        }
        d.grid.forEach(function (q) { cell(q.col, q.row, q.hue, q.dark); });

        var p = d.cur;
        if (p) {
          if (!p.falling) {
            var lr = landingRow(d, p);
            if (lr != null) p.cells.forEach(function (q) { cell(p.col + q[0], lr + q[1], p.hue, p.dark, .22); });
          }
          p.cells.forEach(function (q) {
            var col = p.col + q[0], row = p.y + q[1];
            var x = col * CELL - CELL / 2, y = -(row * CELL) - CELL - PLAT_T / 2;
            c.fillStyle = p.dark ? 'hsl(' + p.hue + ',30%,28%)' : 'hsl(' + p.hue + ',72%,58%)';
            U.roundRect(c, x + 1, y + 1, CELL - 2, CELL - 2, 4); c.fill();
            c.fillStyle = 'rgba(255,255,255,.28)'; U.roundRect(c, x + 3, y + 3, CELL - 6, 5, 2); c.fill();
          });
        }
        d.fallers.forEach(function (f) {
          c.save(); c.translate(f.x, f.y); c.rotate(f.rot);
          c.fillStyle = f.dark ? 'hsl(' + f.hue + ',30%,28%)' : 'hsl(' + f.hue + ',72%,58%)';
          U.roundRect(c, -CELL / 2 + 1, -CELL / 2 + 1, CELL - 2, CELL - 2, 4); c.fill();
          c.restore();
        });

        // centre of mass marker
        if (d.mass > 0) {
          var cx = d.comx * CELL;
          c.strokeStyle = 'rgba(239,68,68,.45)'; c.setLineDash([3, 4]); c.lineWidth = 1.5;
          c.beginPath(); c.moveTo(cx, PLAT_T / 2 + 4); c.lineTo(cx, -(d.height * CELL) - 40 - PLAT_T / 2); c.stroke();
          c.setLineDash([]);
          c.fillStyle = '#ef4444'; c.shadowColor = '#ef4444'; c.shadowBlur = 10;
          c.beginPath(); c.arc(cx, 0, 6, 0, 7); c.fill(); c.shadowBlur = 0;
          c.fillStyle = '#fff'; c.beginPath(); c.arc(cx, 0, 2.2, 0, 7); c.fill();
        }
        d.parts.forEach(function (q) {
          c.globalAlpha = Math.max(0, q.life / q.max); c.fillStyle = q.col;
          c.fillRect(q.x - 2, q.y - 2, 4, 4);
        });
        c.globalAlpha = 1;
        d.floats.forEach(function (f) {
          c.globalAlpha = Math.min(1, f.life); c.fillStyle = f.col || '#334155';
          c.font = '800 16px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText(f.text, f.x, -(f.row * CELL) - PLAT_T / 2);
        });
        c.globalAlpha = 1;
        c.restore();

        // tilt gauge
        var gx = W / 2, gy = 72;
        c.fillStyle = 'rgba(51,65,85,.9)'; U.roundRect(c, gx - 110, gy - 12, 220, 24, 12); c.fill();
        var frac = U.clamp(d.theta / TIP, -1, 1);
        c.fillStyle = Math.abs(frac) > .6 ? '#ef4444' : Math.abs(frac) > .35 ? '#f59e0b' : '#22c55e';
        U.roundRect(c, gx + (frac < 0 ? frac * 100 : 0), gy - 6, Math.max(4, Math.abs(frac) * 100), 12, 6); c.fill();
        c.fillStyle = '#fff'; c.fillRect(gx - 1, gy - 10, 2, 20);
        c.font = '700 11px Outfit, sans-serif'; c.textAlign = 'center';
        c.fillText(Math.abs(Math.round(d.theta * 57.3)) + '° of 20°', gx, gy + 32);

        // next piece + lives
        c.fillStyle = '#334155'; c.font = '700 12px Outfit, sans-serif'; c.textAlign = 'left';
        c.fillText('NEXT', 20, 66);
        if (d.next) d.next.cells.forEach(function (q) {
          c.fillStyle = d.next.dark ? 'hsl(' + d.next.hue + ',30%,28%)' : 'hsl(' + d.next.hue + ',72%,58%)';
          U.roundRect(c, 20 + q[0] * 14, 108 - q[1] * 14, 12, 12, 3); c.fill();
        });
        c.textAlign = 'right'; c.font = '800 18px Outfit, sans-serif';
        var hearts = '';
        for (var h = 0; h < 3; h++) hearts += h < d.lives ? '♥ ' : '♡ ';
        c.fillStyle = '#ef4444'; c.fillText(hearts, W - 16, 70);
        if (d.placed === 0 && !d.dead) {
          c.fillStyle = 'rgba(51,65,85,.7)'; c.font = '600 14px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText('← → move · ↑ rotate · Space / tap to drop', W / 2, H - 40);
        }
      }
    });
  }

  window.Milo.register({
    id: 'balance-tower', title: 'Balance Tower', emo: '⚖️', category: 'Casual',
    tagline: 'Stack on a see-saw and watch the red dot',
    description: 'A plank sits on a single pivot and every piece you drop shifts its centre of mass — ' +
      'the red dot shows exactly where that is. Land weight on one side and the plank tilts slowly ' +
      'towards it; past twenty degrees the whole tower slides off. Pieces are tetromino-ish shapes ' +
      'plus heavy anvils and bricks that count triple, and the taller the tower the more every offset ' +
      'matters. Drop a piece with nothing under it and it falls straight off, costing one of three ' +
      'hearts. Tip: alternate sides, and keep the heavy stuff within two columns of the pivot.',
    controls: ['← →', '↑ rotate', 'Space / ↓ drop', 'Tap to drop'],
    colors: ['#f6efe3', '#ef4444'],
    tags: ['stacking', 'balance', 'physics', 'puzzle', 'high score'],
    mount: mount
  });
})();
