/* Wrecking Ball — wind the crane back, let go, and flatten the tower. */
(function () {
  'use strict';
  var W = 900, H = 560, GROUND = H - 64, PIV = { x: 210, y: 44 }, L = 268, BR = 24, G = 1500, BW = 40, BH = 28;
  var LEVELS = [
    { swings: 3, need: .5, towers: [{ x: 560, cols: 2, rows: 5 }] },
    { swings: 3, need: .5, towers: [{ x: 500, cols: 2, rows: 4 }, { x: 660, cols: 2, rows: 6 }] },
    { swings: 4, need: .55, towers: [{ x: 540, cols: 3, rows: 6, shape: 'pyramid' }] },
    { swings: 4, need: .55, towers: [{ x: 480, cols: 2, rows: 6, concrete: 1 }, { x: 640, cols: 1, rows: 9 }, { x: 740, cols: 2, rows: 5 }] },
    { swings: 4, need: .6, towers: [{ x: 500, cols: 3, rows: 7, glass: [2, 5] }, { x: 700, cols: 2, rows: 8, concrete: 2 }] },
    { swings: 4, need: .6, towers: [{ x: 460, cols: 1, rows: 10 }, { x: 560, cols: 1, rows: 12 }, { x: 660, cols: 1, rows: 10 }, { x: 760, cols: 2, rows: 6, concrete: 1 }] },
    { swings: 5, need: .62, towers: [{ x: 480, cols: 4, rows: 8, shape: 'pyramid', concrete: 1, glass: [3] }] },
    { swings: 5, need: .62, towers: [{ x: 460, cols: 2, rows: 9, concrete: 3 }, { x: 620, cols: 3, rows: 7, glass: [1, 4] }, { x: 800, cols: 1, rows: 11 }] },
    { swings: 5, need: .65, towers: [{ x: 470, cols: 5, rows: 9, shape: 'pyramid', concrete: 2, glass: [4, 6] }] },
    { swings: 6, need: .68, towers: [{ x: 450, cols: 2, rows: 12, concrete: 4 }, { x: 600, cols: 2, rows: 10, glass: [2, 5, 8] }, { x: 750, cols: 3, rows: 8, concrete: 2 }] }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function build(d, n) {
      var Lv = LEVELS[n];
      d.blocks = [];
      Lv.towers.forEach(function (t) {
        for (var r = 0; r < t.rows; r++) {
          var width = t.cols;
          if (t.shape === 'pyramid') width = Math.max(1, t.cols - Math.floor(r * t.cols / t.rows));
          var off = (t.cols - width) * BW / 2;
          for (var k = 0; k < width; k++) {
            var kind = 'brick';
            if (t.concrete && r < t.concrete) kind = 'concrete';
            else if (t.glass && t.glass.indexOf(r) >= 0) kind = 'glass';
            var x = t.x + off + k * BW + BW / 2, y = GROUND - r * BH - BH / 2;
            d.blocks.push({
              x: x, y: y, x0: x, y0: y, w: BW - 2, h: BH - 1, vx: 0, vy: 0, rot: 0, vr: 0, kind: kind,
              mass: kind === 'concrete' ? 2.4 : kind === 'glass' ? .6 : 1, settled: true, dead: false, cd: 0
            });
          }
        }
      });
    }

    function startLevel(g, n) {
      var d = g.data, Lv = LEVELS[n];
      d.level = n;
      build(d, n);
      d.swings = Lv.swings; d.need = Lv.need;
      d.phase = 'ready';
      d.ball = { th: 0, om: 0, x: PIV.x, y: PIV.y + L };
      d.rub = 0; d.intro = 1.2;
      g.set('Level', (n + 1) + '/' + LEVELS.length);
      g.set('Swings', d.swings);
      g.set('Rubble', '0%');
    }

    function reset(g) {
      var d = g.data;
      d.banked = 0;
      d.parts = []; d.floats = []; d.shake = 0; d.tick = 0;
      d.sky = [];
      for (var i = 0; i < 14; i++) d.sky.push({ x: i * 70 + U.rand(-20, 20), w: U.rand(30, 70), h: U.rand(60, 220) });
      startLevel(g, 0);
      g.set('Score', 0);
    }

    function dust(d, x, y, col, n, spd) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2, s = U.rand(30, spd || 180);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: U.rand(.3, .8), max: .8, col: col, r: U.rand(2, 4) });
      }
    }

    function settle(bl, floorY) {
      var k = Math.round(bl.rot / (Math.PI / 2));
      if (k % 2 !== 0) { var t = bl.w; bl.w = bl.h; bl.h = t; }
      bl.rot = 0; bl.vx = bl.vy = bl.vr = 0;
      bl.y = floorY - bl.h / 2;
      bl.settled = true;
    }

    function shatter(g, d, bl) {
      bl.dead = true;
      dust(d, bl.x, bl.y, '#7dd3fc', 14, 260);
      Milo.sound.noise(.2, .12, 3000);
      Milo.sound.tone({ f: 1400, f2: 300, d: .18, v: .08, type: 'triangle' });
      d.floats.push({ x: bl.x, y: bl.y - 20, text: 'SMASH', life: .9, col: '#7dd3fc' });
    }

    function rubble(d) {
      var sum = 0, n = d.blocks.length;
      d.blocks.forEach(function (b) {
        if (b.dead) { sum += 1; return; }
        var maxDrop = (GROUND - b.h / 2) - b.y0;
        var vd = maxDrop > 4 ? U.clamp((b.y - b.y0) / maxDrop, 0, 1) : 0;
        var hd = U.clamp(Math.abs(b.x - b.x0) / (BW * 1.5), 0, 1);
        sum += Math.max(vd, hd);
      });
      return n ? sum / n : 0;
    }

    function physics(g, d, dt) {
      var b = d.ball;
      if (d.phase === 'wind') { b.th = Math.max(-2.2, b.th - 1.5 * dt); b.om = 0; }
      else if (d.phase === 'swing') { var al = -(G / L) * Math.sin(b.th) - .1 * b.om; b.om += al * dt; b.th += b.om * dt; }
      else { b.th += (0 - b.th) * Math.min(1, dt * 5); b.om = 0; }
      var bx = PIV.x + L * Math.sin(b.th), by = PIV.y + L * Math.cos(b.th);
      var vx = L * b.om * Math.cos(b.th), vy = -L * b.om * Math.sin(b.th);
      b.x = bx; b.y = by;
      var speed = Math.hypot(vx, vy);

      if (d.phase === 'swing') d.blocks.forEach(function (bl) {
        if (bl.dead || bl.cd > 0) return;
        var cx = U.clamp(bx, bl.x - bl.w / 2, bl.x + bl.w / 2), cy = U.clamp(by, bl.y - bl.h / 2, bl.y + bl.h / 2);
        var dx = bx - cx, dy = by - cy, dist = Math.hypot(dx, dy);
        if (dist >= BR) return;
        var nx, ny;
        if (dist < .01) { nx = vx >= 0 ? 1 : -1; ny = 0; } else { nx = dx / dist; ny = dy / dist; }
        var vn = vx * nx + vy * ny;
        if (vn > -10) return;
        var imp = Math.min(speed, 900);
        if (bl.kind === 'glass' && imp > 200) { shatter(g, d, bl); b.om *= .85; return; }
        bl.vx += (-nx * imp * .9 + vx * .25) / bl.mass;
        bl.vy += (-ny * imp * .5 + vy * .2 - 30) / bl.mass;
        bl.vr += U.rand(-5, 5) / bl.mass;
        bl.settled = false; bl.cd = .18;
        b.om *= bl.kind === 'concrete' ? .35 : .6;
        dust(d, cx, cy, bl.kind === 'concrete' ? '#94a3b8' : '#ea580c', 8);
        Milo.sound.hit();
        d.shake = Math.max(d.shake, Math.min(9, imp / 60));
      });

      var n = d.blocks.length, i, j;
      for (i = 0; i < n; i++) {
        var bl = d.blocks[i];
        if (bl.dead) continue;
        if (bl.cd > 0) bl.cd -= dt;
        if (bl.settled) continue;
        bl.vy += G * dt; bl.x += bl.vx * dt; bl.y += bl.vy * dt; bl.rot += bl.vr * dt; bl.vr *= Math.pow(.6, dt);
        if (bl.y + bl.h / 2 > GROUND) {
          bl.y = GROUND - bl.h / 2;
          if (bl.vy > 140) {
            dust(d, bl.x, GROUND, '#a8a29e', 6, 120);
            Milo.sound.tone({ f: 95, f2: 40, d: .09, v: .06, type: 'triangle' });
            d.shake = Math.max(d.shake, 2);
          }
          bl.vy = bl.vy > 60 ? -bl.vy * .12 : 0; bl.vx *= .7; bl.vr *= .4;
          if (Math.abs(bl.vx) < 10 && bl.vy === 0) settle(bl, GROUND);
        }
        if (bl.x > W + 80 || bl.x < -80) bl.dead = true;
      }

      for (i = 0; i < n; i++) {
        var a = d.blocks[i];
        if (a.dead) continue;
        for (j = i + 1; j < n; j++) {
          var c2 = d.blocks[j];
          if (c2.dead || (a.settled && c2.settled)) continue;
          var ox = (a.w + c2.w) / 2 - Math.abs(a.x - c2.x); if (ox <= 0) continue;
          var oy = (a.h + c2.h) / 2 - Math.abs(a.y - c2.y); if (oy <= 0) continue;
          if (ox < oy) {
            var ia = a.settled ? 0 : 1 / a.mass, ib = c2.settled ? 0 : 1 / c2.mass, tot = ia + ib;
            var sx = a.x < c2.x ? -1 : 1;
            a.x += sx * ox * ia / tot; c2.x -= sx * ox * ib / tot;
            var rel = (a.vx - c2.vx) * sx;
            if (rel < 0) {
              var ma = a.settled ? 50 : a.mass, mb = c2.settled ? 50 : c2.mass;
              var vcm = (ma * a.vx + mb * c2.vx) / (ma + mb), e = .15;
              var na = vcm + (vcm - a.vx) * e, nb = vcm + (vcm - c2.vx) * e;
              if (a.settled) { if (Math.abs(na) > 35) { a.settled = false; a.vx = na; } } else a.vx = na;
              if (c2.settled) { if (Math.abs(nb) > 35) { c2.settled = false; c2.vx = nb; } } else c2.vx = nb;
            }
          } else {
            var up = a.y < c2.y ? a : c2, lo = up === a ? c2 : a;
            var iu = up.settled ? 0 : 1 / up.mass, il = lo.settled ? 0 : 1 / lo.mass, tt = iu + il;
            up.y -= oy * iu / tt; lo.y += oy * il / tt;
            if (up.vy > lo.vy) {
              if (lo.settled) {
                if (up.vy > 140) { dust(d, up.x, up.y + up.h / 2, '#a8a29e', 4, 100); Milo.sound.tone({ f: 120, f2: 50, d: .07, v: .05, type: 'triangle' }); }
                up.vy = up.vy > 80 ? -up.vy * .1 : 0;
                up.vx *= .6; up.vr *= .5;
                if (!up.settled && Math.abs(up.vx) < 10 && up.vy === 0 && Math.abs(up.vr) < .6) {
                  var ov = (up.w + lo.w) / 2 - Math.abs(up.x - lo.x);
                  if (ov > up.w * .3) settle(up, lo.y - lo.h / 2);
                }
              } else {
                var mu = up.mass, ml = lo.mass, vc = (mu * up.vy + ml * lo.vy) / (mu + ml);
                up.vy = vc; lo.vy = vc; up.vx = U.lerp(up.vx, lo.vx, .3);
                up.settled = false;
              }
            } else if (!lo.settled && up.settled) up.settled = false;
          }
        }
      }

      for (i = 0; i < n; i++) {
        var s = d.blocks[i];
        if (s.dead || !s.settled) continue;
        var bottom = s.y + s.h / 2;
        if (bottom > GROUND - 3) continue;
        var ok = false;
        for (j = 0; j < n && !ok; j++) {
          var o = d.blocks[j];
          if (o === s || o.dead || !o.settled) continue;
          if (Math.abs((o.y - o.h / 2) - bottom) < 5 && (s.w + o.w) / 2 - Math.abs(s.x - o.x) > s.w * .3) ok = true;
        }
        if (!ok) { s.settled = false; s.vr += U.rand(-1.5, 1.5); }
      }
    }

    function evaluate(g) {
      var d = g.data, r = rubble(d);
      var lvlPts = Math.round(r * d.blocks.length * 25);
      if (r >= d.need) {
        d.phase = 'clear'; d.t = 1.8;
        d.bonus = d.swings * 100;
        d.banked += lvlPts + d.bonus;
        g.score = d.banked; g.set('Score', U.fmt(g.score));
        Milo.sound.win();
      } else if (d.swings > 0) {
        d.phase = 'ready';
      } else {
        g.gameOver({
          emo: '🏗️', title: 'Out of swings',
          text: Math.round(r * 100) + '% flattened on level ' + (d.level + 1) + ' — you needed ' + Math.round(d.need * 100) + '%.',
          score: g.score
        });
      }
    }

    return Milo.arcade(host, {
      id: 'wrecking-ball',
      w: W, h: H, bg: '#dbe4ee',
      stats: ['Score', 'Level', 'Swings', 'Rubble'],
      emo: '🏗️',
      start: {
        title: 'Wrecking Ball',
        text: 'Hold to wind the ball back, release to let it swing. Knock enough of each tower flat ' +
          'before your swings run out — bricks tumble, concrete barely budges, glass shatters.',
        keys: ['Hold Space / click / touch', 'Release to swing']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data;
        if (d.shake > 0) d.shake = Math.max(0, d.shake - dt * 30);
        d.parts = d.parts.filter(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 700 * dt; p.life -= dt; return p.life > 0; });
        d.floats = d.floats.filter(function (f) { f.y -= 30 * dt; f.life -= dt; return f.life > 0; });
        if (d.intro > 0) d.intro -= dt;
        var holding = g.input.pdown || g.input.down('action');

        if (d.phase === 'ready') {
          if (holding && d.swings > 0 && d.intro <= 0) { d.phase = 'wind'; d.tick = 0; }
        } else if (d.phase === 'wind') {
          d.tick += dt;
          if (d.tick > .1) { d.tick = 0; Milo.sound.tone({ f: 160 - d.ball.th * 90, d: .03, v: .04, type: 'square' }); }
          if (!holding) {
            d.phase = 'swing'; d.swT = 0; d.calm = 0;
            d.swings--; g.set('Swings', d.swings);
            Milo.sound.noise(.3, .08, 900);
          }
        } else if (d.phase === 'swing') {
          d.swT += dt;
          if (Math.abs(d.ball.om) < .35 && Math.abs(d.ball.th) < .12) d.calm += dt; else d.calm = 0;
          if (d.calm > .7 || d.swT > 7) { d.phase = 'settle'; d.setT = 0; }
        } else if (d.phase === 'settle') {
          d.setT += dt;
          var moving = d.blocks.some(function (b) { return !b.dead && !b.settled; });
          if (!moving || d.setT > 3.5) evaluate(g);
        } else if (d.phase === 'clear') {
          d.t -= dt;
          if (d.t <= 0) {
            if (d.level + 1 >= LEVELS.length) {
              g.win({ emo: '🏗️', title: 'Site cleared!', text: 'Every tower flattened. ' + U.fmt(g.score) + ' points.', score: g.score });
            } else startLevel(g, d.level + 1);
          }
        }

        physics(g, d, dt / 2); physics(g, d, dt / 2);

        if (d.phase !== 'clear') {
          d.rub = rubble(d);
          g.score = d.banked + Math.round(d.rub * d.blocks.length * 25);
          g.set('Score', U.fmt(g.score));
          g.set('Rubble', Math.round(d.rub * 100) + '%');
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, b = d.ball;
        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#cbd5e1'); sky.addColorStop(1, '#f1f5f9');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(100,116,139,.28)';
        d.sky.forEach(function (s) { c.fillRect(s.x, GROUND - s.h, s.w, s.h); });

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        // ground
        c.fillStyle = '#475569'; c.fillRect(0, GROUND, W, H - GROUND);
        c.fillStyle = '#64748b'; c.fillRect(0, GROUND, W, 6);
        c.fillStyle = '#facc15';
        for (var sx = 0; sx < W; sx += 60) c.fillRect(sx, GROUND + 30, 30, 4);

        // crane
        c.fillStyle = '#facc15';
        c.fillRect(46, 30, 44, GROUND - 30);
        c.strokeStyle = '#a16207'; c.lineWidth = 3;
        for (var ly = 40; ly < GROUND; ly += 34) {
          c.beginPath(); c.moveTo(46, ly); c.lineTo(90, ly + 34); c.moveTo(90, ly); c.lineTo(46, ly + 34); c.stroke();
        }
        c.fillStyle = '#facc15'; c.fillRect(30, 30, PIV.x + 22 - 30, 14);
        c.fillStyle = '#a16207';
        for (var ax = 36; ax < PIV.x + 16; ax += 20) c.fillRect(ax, 33, 8, 8);
        c.fillStyle = '#1e293b'; U.roundRect(c, 92, 44, 44, 34, 5); c.fill();
        c.fillStyle = '#7dd3fc'; c.fillRect(100, 50, 20, 14);
        c.fillStyle = '#334155'; c.fillRect(20, 30, 26, 22);
        // chain
        c.strokeStyle = '#334155'; c.lineWidth = 4; c.setLineDash([7, 5]);
        c.beginPath(); c.moveTo(PIV.x, PIV.y); c.lineTo(b.x, b.y); c.stroke();
        c.setLineDash([]);
        c.fillStyle = '#1e293b'; c.beginPath(); c.arc(PIV.x, PIV.y, 7, 0, 7); c.fill();

        d.blocks.forEach(function (bl) { if (!bl.dead) drawBlock(c, bl); });

        // ball
        var grd = c.createRadialGradient(b.x - 8, b.y - 8, 4, b.x, b.y, BR);
        grd.addColorStop(0, '#94a3b8'); grd.addColorStop(1, '#0f172a');
        c.fillStyle = grd; c.beginPath(); c.arc(b.x, b.y, BR, 0, 7); c.fill();
        c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 2; c.stroke();

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max); c.fillStyle = p.col;
          c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.fill();
        });
        c.globalAlpha = 1;
        d.floats.forEach(function (f) {
          c.globalAlpha = Math.min(1, f.life); c.fillStyle = f.col;
          c.font = '800 20px Outfit, sans-serif'; c.textAlign = 'center'; c.fillText(f.text, f.x, f.y);
        });
        c.globalAlpha = 1;
        c.restore();

        // rubble meter
        var mx = W / 2 - 150;
        c.fillStyle = 'rgba(15,23,42,.75)'; U.roundRect(c, mx - 10, 56, 320, 40, 10); c.fill();
        c.fillStyle = 'rgba(255,255,255,.2)'; U.roundRect(c, mx, 76, 300, 12, 6); c.fill();
        var ratio = U.clamp(d.rub, 0, 1);
        c.fillStyle = ratio >= d.need ? '#4ade80' : '#fb923c';
        U.roundRect(c, mx, 76, 300 * ratio, 12, 6); c.fill();
        c.fillStyle = '#fff'; c.fillRect(mx + 300 * d.need - 1, 72, 2, 20);
        c.font = '700 13px Outfit, sans-serif'; c.textAlign = 'left';
        c.fillText('Rubble ' + Math.round(ratio * 100) + '%', mx, 70);
        c.textAlign = 'right'; c.fillText('need ' + Math.round(d.need * 100) + '%', mx + 300, 70);

        // swings left
        for (var s = 0; s < d.swings; s++) {
          c.fillStyle = '#1e293b'; c.beginPath(); c.arc(W - 30 - s * 24, GROUND + 40, 8, 0, 7); c.fill();
        }

        c.textAlign = 'center';
        if (d.phase === 'ready' && d.intro <= 0) {
          c.fillStyle = 'rgba(15,23,42,.7)'; c.font = '600 15px Outfit, sans-serif';
          c.fillText('hold to wind back · release to swing', W / 2, H - 22);
        } else if (d.phase === 'wind') {
          c.fillStyle = '#b45309'; c.font = '800 16px Outfit, sans-serif';
          c.fillText(Math.round(-b.th * 57.3) + '°', b.x, b.y - BR - 12);
        }
        if (d.intro > 0) {
          c.fillStyle = 'rgba(15,23,42,.6)'; c.fillRect(0, H / 2 - 40, W, 80);
          c.fillStyle = '#fff'; c.font = '800 30px Outfit, sans-serif';
          c.fillText('Site ' + (d.level + 1) + ' · ' + LEVELS[d.level].swings + ' swings · flatten ' + Math.round(d.need * 100) + '%', W / 2, H / 2 + 10);
        }
        if (d.phase === 'clear') {
          c.fillStyle = 'rgba(15,23,42,.6)'; c.fillRect(0, H / 2 - 40, W, 80);
          c.fillStyle = '#fde68a'; c.font = '800 30px Outfit, sans-serif';
          c.fillText('Flattened! +' + d.bonus + ' swing bonus', W / 2, H / 2 + 10);
        }
      }
    });

    function drawBlock(c, bl) {
      c.save(); c.translate(bl.x, bl.y); c.rotate(bl.rot);
      var w = bl.w, h = bl.h;
      if (bl.kind === 'brick') {
        c.fillStyle = '#c2410c'; c.fillRect(-w / 2, -h / 2, w, h);
        c.fillStyle = 'rgba(255,255,255,.16)'; c.fillRect(-w / 2 + 2, -h / 2 + 2, w - 4, 3);
        c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(-1, -h / 2, 2, h / 2); c.fillRect(-w / 2, -1, w, 2); c.fillRect(-w / 4 - 1, 0, 2, h / 2);
      } else if (bl.kind === 'concrete') {
        c.fillStyle = '#94a3b8'; c.fillRect(-w / 2, -h / 2, w, h);
        c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(-w / 2 + 2, -h / 2 + 2, w - 4, 3);
        c.fillStyle = 'rgba(0,0,0,.18)';
        c.fillRect(-w / 2 + 6, -3, 3, 3); c.fillRect(w / 2 - 12, 4, 3, 3); c.fillRect(-2, h / 2 - 8, 3, 3);
      } else {
        c.fillStyle = 'rgba(125,211,252,.55)'; c.fillRect(-w / 2, -h / 2, w, h);
        c.strokeStyle = '#7dd3fc'; c.lineWidth = 1.5; c.strokeRect(-w / 2 + 1, -h / 2 + 1, w - 2, h - 2);
        c.strokeStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.moveTo(-w / 2 + 4, h / 2 - 4); c.lineTo(w / 2 - 6, -h / 2 + 4); c.stroke();
      }
      c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1; c.strokeRect(-w / 2, -h / 2, w, h);
      c.restore();
    }
  }

  window.Milo.register({
    id: 'wrecking-ball', title: 'Wrecking Ball', emo: '🏗️', category: 'Casual',
    tagline: 'Wind up, let go, flatten the tower',
    description: 'Hold to haul the crane ball back and release to send it swinging into the block ' +
      'towers. Every site gives you a handful of swings and a rubble target: bricks shove and tumble, ' +
      'concrete blocks barely move and soak up your momentum, and glass rows shatter outright at speed. ' +
      'Knocking out a low block drops everything above it, and blocks that lose their support keep ' +
      'collapsing after the ball has stopped. Rubble is measured by how far every block has fallen or ' +
      'slid, and unused swings pay a bonus. Tip: a full wind-up straight into the second row is the ' +
      'classic opener.',
    controls: ['Hold Space', 'Hold click', 'Hold touch'],
    colors: ['#cbd5e1', '#facc15'],
    tags: ['physics', 'destruction', 'crane', 'levels', 'casual'],
    mount: mount
  });
})();
