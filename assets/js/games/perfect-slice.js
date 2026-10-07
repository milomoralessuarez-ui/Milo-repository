/* Perfect Slice — one straight cut, two halves, and a percentage you cannot argue with. */
(function () {
  'use strict';
  var W = 560, H = 700;
  var CX = W / 2, CY = 322, SCALE = 132;

  function reg(n, rot) {
    var p = [];
    for (var i = 0; i < n; i++) {
      var a = rot + i * Math.PI * 2 / n;
      p.push([Math.cos(a), Math.sin(a)]);
    }
    return p;
  }
  function star(n, r1, r2, rot) {
    var p = [];
    for (var i = 0; i < n * 2; i++) {
      var a = rot + i * Math.PI / n, r = i % 2 ? r2 : r1;
      p.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    return p;
  }
  function arcPts(cx, cy, r, a0, a1, n) {
    var p = [];
    for (var i = 0; i <= n; i++) {
      var a = a0 + (a1 - a0) * (i / n);
      p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return p;
  }
  function heart() {
    var p = [];
    for (var i = 0; i < 28; i++) {
      var t = i / 28 * Math.PI * 2;
      var x = 16 * Math.pow(Math.sin(t), 3);
      var y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      p.push([x / 17, y / 17]);
    }
    return p;
  }
  /* Big circle minus an offset smaller one: outer arc round the left, then the
     small circle's left bulge traced back between the same two crossings. */
  function crescent() {
    var R = 1, r = .85, dx = .5;
    var a = (dx * dx - r * r + R * R) / (2 * dx);
    var h = Math.sqrt(R * R - a * a);
    var t1 = Math.atan2(h, a), s1 = Math.atan2(h, a - dx);
    return arcPts(0, 0, R, t1, Math.PI * 2 - t1, 20)
      .concat(arcPts(dx, 0, r, -s1, s1 - Math.PI * 2, 18));
  }
  function gear(teeth) {
    var p = [];
    for (var i = 0; i < teeth; i++) {
      var a0 = i * Math.PI * 2 / teeth, step = Math.PI * 2 / teeth / 4;
      p.push([Math.cos(a0) * 1, Math.sin(a0) * 1]);
      p.push([Math.cos(a0 + step) * 1, Math.sin(a0 + step) * 1]);
      p.push([Math.cos(a0 + step * 1.15) * .68, Math.sin(a0 + step * 1.15) * .68]);
      p.push([Math.cos(a0 + step * 2.85) * .68, Math.sin(a0 + step * 2.85) * .68]);
    }
    return p;
  }
  function blob(seed) {
    var p = [], s = seed;
    for (var i = 0; i < 20; i++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      var r = 0.68 + (s / 0x7fffffff) * 0.42;
      var a = i * Math.PI * 2 / 20;
      p.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    return p;
  }
  function egg() {
    var p = [];
    for (var i = 0; i < 26; i++) {
      var a = i * Math.PI * 2 / 26;
      p.push([Math.cos(a) * (0.78 - Math.sin(a) * 0.1), Math.sin(a) * 1]);
    }
    return p;
  }

  var SHAPES = [
    { n: 'Square', p: reg(4, Math.PI / 4) },
    { n: 'Triangle', p: reg(3, -Math.PI / 2) },
    { n: 'Pentagon', p: reg(5, -Math.PI / 2) },
    { n: 'Diamond', p: [[0, -1], [.7, 0], [0, 1], [-.7, 0]] },
    { n: 'Hexagon', p: reg(6, 0) },
    { n: 'Trapezoid', p: [[-.55, -.72], [.55, -.72], [.98, .72], [-.98, .72]] },
    { n: 'House', p: [[0, -1], [.86, -.22], [.86, .9], [-.86, .9], [-.86, -.22]] },
    { n: 'Octagon', p: reg(8, Math.PI / 8) },
    { n: 'Plus', p: [[-.34, -1], [.34, -1], [.34, -.34], [1, -.34], [1, .34], [.34, .34],
      [.34, 1], [-.34, 1], [-.34, .34], [-1, .34], [-1, -.34], [-.34, -.34]] },
    { n: 'Arrow', p: [[-.92, -.34], [.1, -.34], [.1, -.82], [.96, 0], [.1, .82], [.1, .34], [-.92, .34]] },
    { n: 'L-Block', p: [[-.8, -1], [-.08, -1], [-.08, .28], [.92, .28], [.92, 1], [-.8, 1]] },
    { n: 'Egg', p: egg() },
    { n: 'Five-Point Star', p: star(5, 1, .46, -Math.PI / 2) },
    { n: 'T-Block', p: [[-1, -.9], [1, -.9], [1, -.24], [.32, -.24], [.32, 1], [-.32, 1],
      [-.32, -.24], [-1, -.24]] },
    { n: 'Chevron', p: [[-.9, -.82], [-.18, -.82], [.54, 0], [-.18, .82], [-.9, .82], [-.24, 0]] },
    { n: 'Bowtie', p: [[-1, -.76], [-.1, -.08], [1, -.76], [1, .76], [-.1, .08], [-1, .76]] },
    { n: 'Heart', p: heart() },
    { n: 'Six-Point Star', p: star(6, 1, .56, 0) },
    { n: 'Zigzag', p: [[-1, -.48], [-.5, -.92], [0, -.48], [.5, -.92], [1, -.48], [1, .22],
      [.5, -.2], [0, .22], [-.5, -.2], [-1, .22]] },
    { n: 'Crescent', p: crescent() },
    { n: 'Blob', p: blob(9137) },
    { n: 'Cog', p: gear(8) },
    { n: 'Keyhole', p: arcPts(0, -.38, .56, Math.PI * .82, Math.PI * 2.18, 16)
      .concat([[.26, .96], [-.26, .96]]) },
    { n: 'Splat', p: blob(48291) },
    { n: 'Twelve-Point Star', p: star(12, 1, .74, 0) }
  ];

  function area(poly) {
    var a = 0;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      a += poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1];
    }
    return Math.abs(a) / 2;
  }

  /** Sutherland–Hodgman: keep the side of the line where dot(v-P, n) >= 0. */
  function clip(poly, px, py, nx, ny) {
    var out = [];
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var A = poly[j], B = poly[i];
      var da = (A[0] - px) * nx + (A[1] - py) * ny;
      var db = (B[0] - px) * nx + (B[1] - py) * ny;
      if (db >= 0) {
        if (da < 0) {
          var t = da / (da - db);
          out.push([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t]);
        }
        out.push(B);
      } else if (da >= 0) {
        var t2 = da / (da - db);
        out.push([A[0] + (B[0] - A[0]) * t2, A[1] + (B[1] - A[1]) * t2]);
      }
    }
    return out;
  }

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.idx = 0;
      d.lives = 3;
      d.streak = 0;
      d.perfects = 0;
      d.parts = [];
      d.shake = 0;
      d.banner = null;
      d.drag = null;
      g.score = 0;
      g.set('Score', 0);
      g.set('Shape', '1/' + SHAPES.length);
      g.set('Lives', 3);
      loadShape(g);
    }

    function loadShape(g) {
      var d = g.data, s = SHAPES[d.idx % SHAPES.length];
      d.shape = s;
      d.phase = 'aim';
      d.t0 = 0;
      d.halves = null;
      d.result = null;
      var lv = d.idx;
      d.spin = lv >= 5 ? (lv % 2 ? 1 : -1) * (0.25 + lv * 0.035) : 0;
      d.wob = lv >= 10 ? 0.06 + (lv - 10) * 0.012 : 0;
      d.drift = lv >= 15 ? 40 + (lv - 15) * 7 : 0;
      g.set('Shape', ((d.idx % SHAPES.length) + 1) + '/' + SHAPES.length);
    }

    /** Current on-screen vertices with spin, wobble and drift applied. */
    function verts(d, t) {
      var p = d.shape.p, out = [], a = d.spin * t;
      var ca = Math.cos(a), sa = Math.sin(a);
      var ox = d.drift ? Math.sin(t * 1.15) * d.drift : 0;
      for (var i = 0; i < p.length; i++) {
        var x = p[i][0], y = p[i][1];
        if (d.wob) {
          var k = 1 + Math.sin(t * 3.1 + i * 1.7) * d.wob;
          x *= k; y *= k;
        }
        out.push([CX + ox + (x * ca - y * sa) * SCALE, CY + (x * sa + y * ca) * SCALE]);
      }
      return out;
    }

    function doCut(g, x1, y1, x2, y2) {
      var d = g.data;
      if (d.phase !== 'aim') return;
      var dx = x2 - x1, dy = y2 - y1;
      if (Math.hypot(dx, dy) < 26) return;
      var L = Math.hypot(dx, dy);
      var nx = -dy / L, ny = dx / L;
      var poly = verts(d, d.t0);
      var A = clip(poly, x1, y1, nx, ny);
      var B = clip(poly, x1, y1, -nx, -ny);
      var aA = A.length > 2 ? area(A) : 0;
      var aB = B.length > 2 ? area(B) : 0;
      var tot = aA + aB;
      if (tot < 1) return;
      var acc = 100 * (1 - Math.abs(aA - aB) / tot);

      d.halves = [
        { pts: A, ox: nx, oy: ny, pct: aA / tot * 100 },
        { pts: B, ox: -nx, oy: -ny, pct: aB / tot * 100 }
      ];
      d.phase = 'split';
      d.splitT = 0;

      var pass = acc >= 70;
      var perfect = acc >= 97.5;
      var gain = 0;
      if (pass) {
        var mult = 1 + Math.min(3, d.streak * 0.25);
        gain = Math.round(Math.pow(Math.max(0, (acc - 68) / 32), 3) * 1000 * mult);
        if (perfect) { gain += 700; d.perfects++; }
        if (acc >= 90) d.streak++; else d.streak = 0;
        g.score += gain;
        g.set('Score', U.fmt(g.score));
        d.banner = {
          text: (perfect ? 'PERFECT!  ' : acc >= 90 ? 'CLEAN  ' : '') + acc.toFixed(1) + '%  +' + gain,
          t: 1.6, col: perfect ? '#16a34a' : acc >= 90 ? '#0891b2' : '#475569'
        };
        if (perfect) { Milo.sound.powerup(); d.shake = 8; }
        else Milo.sound.tone({ f: 500 + acc * 6, f2: 900, d: .12, v: .06, type: 'square' });
      } else {
        d.streak = 0;
        d.lives--;
        d.shake = 12;
        g.set('Lives', Math.max(0, d.lives));
        d.banner = { text: acc.toFixed(1) + '%  —  ruined', t: 1.6, col: '#dc2626' };
        Milo.sound.hit();
      }
      d.result = { acc: acc, pass: pass, perfect: perfect };

      for (var i = 0; i < 20; i++) {
        var sp = U.rand(60, 300), sgn = Math.random() < .5 ? 1 : -1;
        d.parts.push({
          x: U.lerp(x1, x2, Math.random()), y: U.lerp(y1, y2, Math.random()),
          vx: nx * sp * sgn + U.rand(-40, 40), vy: ny * sp * sgn + U.rand(-40, 40),
          life: .7, max: .7, col: pass ? '#38bdf8' : '#f87171'
        });
      }
    }

    function drawPoly(c, pts) {
      if (!pts || pts.length < 3) return;
      c.beginPath();
      c.moveTo(pts[0][0], pts[0][1]);
      for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
      c.closePath();
    }

    return Milo.arcade(host, {
      id: 'perfect-slice',
      w: W, h: H, bg: '#eef2f8',
      stats: ['Score', 'Shape', 'Lives'],
      emo: '🔪',
      start: {
        title: 'Perfect Slice',
        text: 'Drag a straight line across the shape and it is cut exactly where you dragged. ' +
          'The two halves are measured against each other and you are paid on how close to ' +
          'fifty-fifty you got — under 72% and the piece is ruined. Twenty-five shapes, and from ' +
          'the sixth they start turning, then wobbling, then sliding.',
        keys: ['Drag across the shape']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        var d = g.data;
        if (d.phase !== 'aim') return;
        if (type === 'down') d.drag = { x1: x, y1: y, x2: x, y2: y };
        else if (type === 'move' && d.drag) { d.drag.x2 = x; d.drag.y2 = y; }
        else if (type === 'up' && d.drag) {
          var dr = d.drag;
          d.drag = null;
          doCut(g, dr.x1, dr.y1, dr.x2, dr.y2);
        }
      },

      update: function (g, dt) {
        var d = g.data;
        if (d.shake > 0) d.shake = Math.max(0, d.shake - dt * 30);
        if (d.banner) { d.banner.t -= dt; if (d.banner.t <= 0) d.banner = null; }
        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 520 * dt; p.life -= dt;
          return p.life > 0;
        });

        if (d.phase === 'aim') { d.t0 += dt; return; }

        d.splitT += dt;
        if (d.splitT > 1.15) {
          if (!d.result.pass && d.lives <= 0) {
            g.gameOver({
              emo: '🔪', title: 'Ruined it',
              text: 'Sliced ' + d.idx + ' shape' + (d.idx === 1 ? '' : 's') + ' with ' +
                d.perfects + ' perfect cut' + (d.perfects === 1 ? '' : 's') + '.'
            });
            return;
          }
          d.idx++;
          if (d.idx >= SHAPES.length) {
            g.win({
              score: g.score, emo: '🔪', title: 'Every shape halved',
              text: 'All ' + SHAPES.length + ' shapes cut, ' + d.perfects + ' of them perfectly.'
            });
            return;
          }
          loadShape(g);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#f7f9fc'); bg.addColorStop(1, '#dde5ef');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        // cutting-mat grid
        c.strokeStyle = 'rgba(30,60,90,.07)'; c.lineWidth = 1;
        for (var gx = 30; gx < W; gx += 30) { c.beginPath(); c.moveTo(gx, 88); c.lineTo(gx, H - 74); c.stroke(); }
        for (var gy = 88; gy < H - 74; gy += 30) { c.beginPath(); c.moveTo(0, gy); c.lineTo(W, gy); c.stroke(); }

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        function paint(pts, fill, stroke) {
          drawPoly(c, pts);
          c.fillStyle = fill;
          c.fill();
          c.strokeStyle = stroke; c.lineWidth = 3;
          c.stroke();
        }

        if (d.phase === 'aim') {
          var pts = verts(d, d.t0);
          c.save();
          c.shadowColor = 'rgba(20,40,70,.28)'; c.shadowBlur = 18; c.shadowOffsetY = 8;
          var grd = c.createLinearGradient(CX - SCALE, CY - SCALE, CX + SCALE, CY + SCALE);
          grd.addColorStop(0, '#34d399'); grd.addColorStop(1, '#0ea5e9');
          paint(pts, grd, '#0f2d3f');
          c.restore();

          if (d.drag) {
            var dx = d.drag.x2 - d.drag.x1, dy = d.drag.y2 - d.drag.y1;
            var L = Math.hypot(dx, dy) || 1;
            var ux = dx / L, uy = dy / L, far = 900;
            c.strokeStyle = 'rgba(220,38,38,.85)'; c.lineWidth = 2.5;
            c.setLineDash([10, 7]);
            c.beginPath();
            c.moveTo(d.drag.x1 - ux * far, d.drag.y1 - uy * far);
            c.lineTo(d.drag.x1 + ux * far, d.drag.y1 + uy * far);
            c.stroke();
            c.setLineDash([]);
            c.fillStyle = '#dc2626';
            c.beginPath(); c.arc(d.drag.x2, d.drag.y2, 5, 0, 7); c.fill();
          }
        } else if (d.halves) {
          var k = Math.min(1, d.splitT / 1.15);
          var push = k * k * 72;
          var fall = d.result.pass ? 0 : k * k * 300;
          d.halves.forEach(function (h, hi) {
            c.save();
            c.translate(h.ox * push, h.oy * push + fall);
            c.rotate(d.result.pass ? 0 : (hi ? 1 : -1) * k * 0.5);
            c.shadowColor = 'rgba(20,40,70,.25)'; c.shadowBlur = 14; c.shadowOffsetY = 6;
            var col = d.result.perfect ? (hi ? '#22c55e' : '#16a34a')
              : d.result.pass ? (hi ? '#38bdf8' : '#0ea5e9') : (hi ? '#fb7185' : '#f43f5e');
            paint(h.pts, col, '#0f2d3f');
            c.restore();
            if (d.result.pass && h.pts.length > 2) {
              var cx = 0, cy = 0;
              h.pts.forEach(function (p) { cx += p[0]; cy += p[1]; });
              cx /= h.pts.length; cy /= h.pts.length;
              c.fillStyle = '#0f2d3f';
              c.font = '800 16px Outfit, system-ui, sans-serif';
              c.textAlign = 'center';
              c.fillText(h.pct.toFixed(1) + '%', cx + h.ox * push, cy + h.oy * push);
            }
          });
        }

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - 2.5, p.y - 2.5, 5, 5);
        });
        c.globalAlpha = 1;
        c.restore();

        // header
        c.textAlign = 'center';
        c.fillStyle = '#0f2d3f';
        c.font = '800 22px Outfit, system-ui, sans-serif';
        c.fillText(d.shape.n, W / 2, 118);
        c.fillStyle = 'rgba(15,45,63,.55)';
        c.font = '600 13px Outfit, system-ui, sans-serif';
        var mods = [];
        if (d.spin) mods.push('turning');
        if (d.wob) mods.push('wobbling');
        if (d.drift) mods.push('sliding');
        c.fillText(mods.length ? mods.join(' + ') : 'holding still', W / 2, 140);

        if (d.streak > 1) {
          c.fillStyle = '#0891b2';
          c.font = '800 15px Outfit, system-ui, sans-serif';
          c.fillText('STREAK ' + d.streak + '  ×' + (1 + Math.min(3, d.streak * 0.25)).toFixed(2),
            W / 2, H - 92);
        }

        c.fillStyle = 'rgba(15,45,63,.5)';
        c.font = '700 14px Outfit, system-ui, sans-serif';
        c.fillText(d.phase === 'aim' ? 'Drag a line all the way across' : '', W / 2, H - 44);
        c.fillStyle = 'rgba(15,45,63,.35)';
        c.font = '600 11px Outfit, system-ui, sans-serif';
        c.fillText('97.5%+ = PERFECT     under 70% = ruined', W / 2, H - 22);

        // lives
        for (var l = 0; l < 3; l++) {
          c.fillStyle = l < d.lives ? '#dc2626' : 'rgba(15,45,63,.15)';
          c.beginPath(); c.arc(34 + l * 22, H - 40, 8, 0, 7); c.fill();
        }

        if (d.banner) {
          c.globalAlpha = Math.min(1, d.banner.t);
          c.fillStyle = d.banner.col;
          c.font = '800 30px Outfit, system-ui, sans-serif';
          c.fillText(d.banner.text, W / 2, 190);
          c.globalAlpha = 1;
        }
      }
    });
  }

  window.Milo.register({
    id: 'perfect-slice', title: 'Perfect Slice', emo: '🔪', category: 'Casual',
    tagline: 'Halve the shape. The maths is watching.',
    description: 'Drag one straight line across the shape and it is cut exactly there, then both ' +
      'pieces are measured and you are paid on how near fifty-fifty you got — a 97.5% cut counts as ' +
      'PERFECT and is worth about three times a 90% one, and anything under 70% ruins the piece ' +
      'and costs a life. ' +
      'Twenty-five shapes from a plain square to a crescent, a cog and a bowtie, and from the ' +
      'sixth they start slowly turning, then breathing in and out, then sliding across the mat.',
    controls: ['Drag', 'Swipe'],
    colors: ['#eef2f8', '#0ea5e9'],
    tags: ['precision', 'slicing', 'geometry', 'shapes', 'one more go'],
    mount: mount
  });
})();
