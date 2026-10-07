/* Bubble Shooter — aim, bank, match three, and drop whatever you cut loose. */
(function () {
  'use strict';
  var W = 480, H = 720;
  var R = 18, COLS = 12, LEFT = 24, TOP = 66;
  var ROWH = R * 1.732, SPAN = COLS * 2 * R;
  var SHX = W / 2, SHY = H - 74, DEATHY = H - 132;
  var COL = ['#ef4444', '#3b82f6', '#facc15', '#22c55e', '#e879f9', '#22d3ee'];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function rowLen(d, r) { return ((r + d.rowOffset) % 2 === 0) ? COLS : COLS - 1; }
    function parity(d, r) { return (r + d.rowOffset) % 2; }
    function cx(d, r, col) { return LEFT + R + col * 2 * R + parity(d, r) * R; }
    function cy(r) { return TOP + R + r * ROWH; }

    function reset(g) {
      var d = g.data;
      d.level = 1;
      d.parts = [];
      d.falling = [];
      d.shake = 0;
      d.banner = null;
      d.angle = -Math.PI / 2;
      g.score = 0;
      g.set('Score', 0);
      g.set('Best', U.fmt(g.best));
      build(g);
    }

    function build(g) {
      var d = g.data;
      d.rowOffset = 0;
      d.nColors = Math.min(COL.length, 3 + Math.floor((d.level + 1) / 2));
      d.grid = [];
      var rows = Math.min(9, 4 + d.level);
      for (var r = 0; r < rows; r++) {
        var row = [];
        for (var c = 0; c < rowLen(d, r); c++) row.push(Math.floor(Math.random() * d.nColors));
        d.grid.push(row);
      }
      d.shot = null;
      d.shots = 0;
      d.perRow = Math.max(4, 8 - Math.floor(d.level / 2));
      d.cur = pickColor(d);
      d.next = pickColor(d);
      d.cleared = false;
      g.set('Level', d.level);
      g.set('Drop in', d.perRow);
    }

    function liveColors(d) {
      var set = {}, out = [];
      for (var r = 0; r < d.grid.length; r++) {
        for (var c = 0; c < d.grid[r].length; c++) {
          var v = d.grid[r][c];
          if (v != null && !set[v]) { set[v] = 1; out.push(v); }
        }
      }
      return out;
    }

    function pickColor(d) {
      var live = liveColors(d);
      if (!live.length) return Math.floor(Math.random() * d.nColors);
      return U.choice(live);
    }

    /** Cheap overlap test: only the two or three rows straddling y can touch. */
    function hitsBubble(d, x, y, rad) {
      var rr = Math.round((y - TOP - R) / ROWH);
      for (var r = Math.max(0, rr - 1); r <= rr + 1 && r < d.grid.length; r++) {
        var row = d.grid[r], yy = cy(r);
        for (var c = 0; c < row.length; c++) {
          if (row[c] == null) continue;
          var dx = x - cx(d, r, c), dy = y - yy;
          if (dx * dx + dy * dy < rad * rad) return true;
        }
      }
      return false;
    }

    function neighbors(d, r, c) {
      var out = [], p = parity(d, r);
      function add(rr, cc) {
        if (rr < 0 || rr >= d.grid.length) return;
        if (cc < 0 || cc >= d.grid[rr].length) return;
        out.push([rr, cc]);
      }
      add(r, c - 1); add(r, c + 1);
      if (p === 0) { add(r - 1, c - 1); add(r - 1, c); add(r + 1, c - 1); add(r + 1, c); }
      else { add(r - 1, c); add(r - 1, c + 1); add(r + 1, c); add(r + 1, c + 1); }
      return out;
    }

    function addRow(g) {
      var d = g.data;
      d.rowOffset++;
      var row = [];
      for (var c = 0; c < rowLen(d, 0); c++) row.push(Math.floor(Math.random() * d.nColors));
      d.grid.unshift(row);
      d.shake = 7;
      Milo.sound.tone({ f: 150, f2: 90, d: .2, v: .08, type: 'sawtooth' });
      checkDeath(g);
    }

    function checkDeath(g) {
      var d = g.data;
      for (var r = d.grid.length - 1; r >= 0; r--) {
        for (var c = 0; c < d.grid[r].length; c++) {
          if (d.grid[r][c] != null && cy(r) + R > DEATHY) {
            Milo.sound.explode();
            d.shake = 16;
            g.gameOver({
              emo: '🫧', title: 'Ceiling wins',
              text: 'The wall reached the line on board ' + d.level + '.'
            });
            return true;
          }
        }
      }
      return false;
    }

    function fire(g) {
      var d = g.data;
      if (d.shot || g.state !== 'play' || d.cleared) return;
      var a = d.angle;
      d.shot = { x: SHX, y: SHY, vx: Math.cos(a) * 760, vy: Math.sin(a) * 760, c: d.cur };
      d.cur = d.next;
      d.next = pickColor(d);
      Milo.sound.tone({ f: 620, f2: 880, d: .07, v: .05, type: 'square' });
    }

    function snap(g) {
      var d = g.data, s = d.shot;
      var guessR = Math.round((s.y - TOP - R) / ROWH);
      var best = null, bestD = 1e9;
      for (var r = Math.max(0, guessR - 2); r <= guessR + 2; r++) {
        while (d.grid.length <= r) {
          var row = [];
          for (var k = 0; k < rowLen(d, d.grid.length); k++) row.push(null);
          d.grid.push(row);
        }
        for (var c = 0; c < d.grid[r].length; c++) {
          if (d.grid[r][c] != null) continue;
          var dd = U.dist(s.x, s.y, cx(d, r, c), cy(r));
          if (dd >= bestD) continue;
          var ok = r === 0;
          if (!ok) {
            var nb = neighbors(d, r, c);
            for (var i = 0; i < nb.length; i++) {
              if (d.grid[nb[i][0]][nb[i][1]] != null) { ok = true; break; }
            }
          }
          if (ok) { bestD = dd; best = [r, c]; }
        }
      }
      if (!best) { d.shot = null; return; }
      d.grid[best[0]][best[1]] = s.c;
      d.shot = null;
      resolve(g, best[0], best[1], s.c);
    }

    function resolve(g, r0, c0, col) {
      var d = g.data;
      var seen = {}, stack = [[r0, c0]], group = [];
      seen[r0 + ':' + c0] = 1;
      while (stack.length) {
        var cur = stack.pop();
        group.push(cur);
        var nb = neighbors(d, cur[0], cur[1]);
        for (var i = 0; i < nb.length; i++) {
          var key = nb[i][0] + ':' + nb[i][1];
          if (seen[key]) continue;
          if (d.grid[nb[i][0]][nb[i][1]] !== col) continue;
          seen[key] = 1; stack.push(nb[i]);
        }
      }

      if (group.length < 3) {
        Milo.sound.tone({ f: 300, f2: 220, d: .06, v: .045, type: 'triangle' });
      } else {
        var gained = 0;
        group.forEach(function (p, i) {
          d.grid[p[0]][p[1]] = null;
          gained += 10 + i * 2;
          burst(d, cx(d, p[0], p[1]), cy(p[0]), COL[col], 5);
        });
        g.score += gained;
        d.shake = Math.min(10, 3 + group.length);
        Milo.sound.tone({ f: 420 + group.length * 40, f2: 900, d: .12, v: .07, type: 'square' });

        // anything no longer hanging from the ceiling falls
        var keep = {}, st = [];
        for (var c = 0; c < d.grid[0].length; c++) {
          if (d.grid[0][c] != null) { keep['0:' + c] = 1; st.push([0, c]); }
        }
        while (st.length) {
          var q = st.pop(), nb2 = neighbors(d, q[0], q[1]);
          for (var j = 0; j < nb2.length; j++) {
            var k2 = nb2[j][0] + ':' + nb2[j][1];
            if (keep[k2]) continue;
            if (d.grid[nb2[j][0]][nb2[j][1]] == null) continue;
            keep[k2] = 1; st.push(nb2[j]);
          }
        }
        var dropped = 0;
        for (var r = 0; r < d.grid.length; r++) {
          for (var cc = 0; cc < d.grid[r].length; cc++) {
            if (d.grid[r][cc] == null) continue;
            if (keep[r + ':' + cc]) continue;
            dropped++;
            d.falling.push({
              x: cx(d, r, cc), y: cy(r), vx: U.rand(-60, 60), vy: U.rand(-180, -40),
              c: d.grid[r][cc], spin: U.rand(-6, 6), rot: 0
            });
            d.grid[r][cc] = null;
          }
        }
        if (dropped) {
          var db = dropped * 30 + dropped * dropped * 5;
          g.score += db;
          d.banner = { text: dropped + ' dropped  +' + db, t: 1.3 };
          Milo.sound.coin();
        }
      }

      g.set('Score', U.fmt(g.score));

      if (!liveColors(d).length) {
        d.cleared = true;
        var bonus = 400 + d.level * 120;
        g.score += bonus;
        g.set('Score', U.fmt(g.score));
        d.banner = { text: 'Board clear  +' + bonus, t: 1.8 };
        d.nextIn = 1.4;
        Milo.sound.win();
        return;
      }

      d.shots++;
      var left = d.perRow - (d.shots % d.perRow);
      g.set('Drop in', left);
      if (d.shots % d.perRow === 0) addRow(g);
      else checkDeath(g);
    }

    function burst(d, x, y, col, n) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.283, s = U.rand(50, 220);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: .5, max: .5, col: col });
      }
    }

    /** Preview of the shot, bouncing off the side walls. */
    function guide(d) {
      var pts = [{ x: SHX, y: SHY }];
      var x = SHX, y = SHY, vx = Math.cos(d.angle), vy = Math.sin(d.angle);
      for (var i = 0; i < 260; i++) {
        x += vx * 9; y += vy * 9;
        if (x < LEFT + R) { x = LEFT + R; vx = -vx; pts.push({ x: x, y: y }); }
        if (x > LEFT + SPAN - R) { x = LEFT + SPAN - R; vx = -vx; pts.push({ x: x, y: y }); }
        if (y < TOP + R) break;
        if (hitsBubble(d, x, y, R * 1.85)) break;
      }
      pts.push({ x: x, y: y });
      return pts;
    }

    return Milo.arcade(host, {
      id: 'bubble-shooter',
      w: W, h: H, bg: '#0a1226',
      stats: ['Score', 'Level', 'Drop in', 'Best'],
      touchButtons: [{ key: 'action', label: 'FIRE' }],
      emo: '🫧',
      start: {
        title: 'Bubble Shooter',
        text: 'Point, bank off the side walls, and land three of a colour together to pop them. ' +
          'Anything left hanging by nothing drops — and dropped bubbles pay far more than popped ' +
          'ones. A fresh row pushes down from the ceiling every few shots.',
        keys: ['Move mouse to aim', 'Click / Space to fire', '← → also aim']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        var d = g.data;
        if (y < SHY - 6) {
          var a = Math.atan2(y - SHY, x - SHX);
          d.angle = U.clamp(a, -Math.PI + 0.28, -0.28);
        }
        if (type === 'down') fire(g);
      },
      onKey: function (g, e) { if (e.code === 'Space') fire(g); },

      update: function (g, dt) {
        var d = g.data, i = g.input;
        if (i.down('left')) d.angle = Math.max(-Math.PI + 0.28, d.angle - 1.9 * dt);
        if (i.down('right')) d.angle = Math.min(-0.28, d.angle + 1.9 * dt);
        if (i.pressed('action')) fire(g);
        if (d.shake > 0) d.shake = Math.max(0, d.shake - dt * 30);
        if (d.banner) { d.banner.t -= dt; if (d.banner.t <= 0) d.banner = null; }

        if (d.shot) {
          var steps = 8, sdt = dt / steps;
          for (var s = 0; s < steps && d.shot; s++) {
            var b = d.shot;
            b.x += b.vx * sdt; b.y += b.vy * sdt;
            if (b.x < LEFT + R) { b.x = LEFT + R; b.vx = -b.vx; Milo.sound.tone({ f: 500, d: .03, v: .03, type: 'triangle' }); }
            if (b.x > LEFT + SPAN - R) { b.x = LEFT + SPAN - R; b.vx = -b.vx; Milo.sound.tone({ f: 500, d: .03, v: .03, type: 'triangle' }); }
            if (b.y <= TOP + R) { b.y = TOP + R; snap(g); break; }
            if (hitsBubble(d, b.x, b.y, R * 1.86)) { snap(g); break; }
            if (b.y > H + 60) { d.shot = null; break; }
          }
        }

        d.falling = d.falling.filter(function (f) {
          f.vy += 900 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.rot += f.spin * dt;
          return f.y < H + 40;
        });
        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 420 * dt; p.life -= dt;
          return p.life > 0;
        });

        if (d.cleared && d.nextIn != null) {
          d.nextIn -= dt;
          if (d.nextIn <= 0) { d.nextIn = null; d.level++; build(g); }
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#132a52'); bg.addColorStop(.6, '#0a1226'); bg.addColorStop(1, '#060a18');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        // play column
        c.fillStyle = 'rgba(255,255,255,.035)';
        c.fillRect(LEFT, TOP - 12, SPAN, DEATHY - TOP + 12);
        c.fillStyle = 'rgba(255,255,255,.14)';
        c.fillRect(LEFT - 6, TOP - 14, 6, DEATHY - TOP + 16);
        c.fillRect(LEFT + SPAN, TOP - 14, 6, DEATHY - TOP + 16);
        // ceiling
        c.fillStyle = '#334a7a';
        c.fillRect(LEFT - 6, TOP - 22, SPAN + 12, 10);

        function bubble(x, y, col, r) {
          c.fillStyle = col;
          c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
          c.fillStyle = 'rgba(255,255,255,.35)';
          c.beginPath(); c.arc(x - r * .3, y - r * .34, r * .3, 0, 7); c.fill();
          c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1.5;
          c.beginPath(); c.arc(x, y, r - .8, 0, 7); c.stroke();
        }

        for (var r = 0; r < d.grid.length; r++) {
          for (var cc = 0; cc < d.grid[r].length; cc++) {
            var v = d.grid[r][cc];
            if (v == null) continue;
            bubble(cx(d, r, cc), cy(r), COL[v], R - 1);
          }
        }

        d.falling.forEach(function (f) { bubble(f.x, f.y, COL[f.c], R - 1); });

        // danger line
        c.strokeStyle = 'rgba(239,68,68,.6)'; c.lineWidth = 2;
        c.setLineDash([8, 8]);
        c.beginPath(); c.moveTo(LEFT, DEATHY); c.lineTo(LEFT + SPAN, DEATHY); c.stroke();
        c.setLineDash([]);

        // aim guide
        if (!d.shot && !d.cleared) {
          var pts = guide(d);
          c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2;
          c.setLineDash([5, 9]);
          c.beginPath(); c.moveTo(pts[0].x, pts[0].y);
          for (var i = 1; i < pts.length; i++) c.lineTo(pts[i].x, pts[i].y);
          c.stroke();
          c.setLineDash([]);
          var end = pts[pts.length - 1];
          c.strokeStyle = COL[d.cur]; c.lineWidth = 2;
          c.beginPath(); c.arc(end.x, end.y, R - 3, 0, 7); c.stroke();
        }

        if (d.shot) bubble(d.shot.x, d.shot.y, COL[d.shot.c], R - 1);

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.beginPath(); c.arc(p.x, p.y, 3.2, 0, 7); c.fill();
        });
        c.globalAlpha = 1;

        // cannon
        c.save();
        c.translate(SHX, SHY);
        c.rotate(d.angle + Math.PI / 2);
        c.fillStyle = '#5b6b96';
        U.roundRect(c, -9, -38, 18, 42, 8); c.fill();
        c.fillStyle = '#8aa0d8';
        U.roundRect(c, -5, -36, 10, 22, 5); c.fill();
        c.restore();
        c.fillStyle = '#2b3a63';
        c.beginPath(); c.arc(SHX, SHY, 24, 0, 7); c.fill();
        bubble(SHX, SHY, COL[d.cur], R - 1);

        // next up
        c.fillStyle = 'rgba(255,255,255,.4)';
        c.font = '700 11px Outfit, system-ui, sans-serif';
        c.textAlign = 'center';
        c.fillText('NEXT', SHX + 84, SHY - 18);
        bubble(SHX + 84, SHY + 2, COL[d.next], R - 5);

        c.restore();

        if (d.banner) {
          c.globalAlpha = Math.min(1, d.banner.t);
          c.fillStyle = '#facc15';
          c.font = '800 26px Outfit, system-ui, sans-serif';
          c.textAlign = 'center';
          c.fillText(d.banner.text, W / 2, H / 2 - 30);
          c.globalAlpha = 1;
        }
      }
    });
  }

  window.Milo.register({
    id: 'bubble-shooter', title: 'Bubble Shooter', emo: '🫧', category: 'Casual',
    tagline: 'Bank it off the wall, drop the whole cluster',
    description: 'The classic: aim the cannon, bounce shots off the side walls into gaps you ' +
      'cannot reach straight on, and land three matching bubbles to pop them. The real points ' +
      'are in the drop — sever a clump from the ceiling and every bubble that falls scores, with ' +
      'the bonus growing on the square of how many go at once. A new row grinds down from the top ' +
      'every few shots, sooner on later boards, and touching the red line ends it.',
    controls: ['Mouse aim', 'Click', 'Space', '← →'],
    colors: ['#0a1226', '#e879f9'],
    tags: ['bubble', 'match 3', 'aiming', 'classic', 'arcade'],
    mount: mount
  });
})();
