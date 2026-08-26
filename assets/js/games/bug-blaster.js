/* Bug Blaster — a centipede winds down through the mushrooms. */
(function () {
  'use strict';
  var COLS = 24, ROWS = 26, CELL = 26;
  var W = COLS * CELL, H = ROWS * CELL;
  var PLAYER_ROWS = 6;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.shrooms = [];
      for (var y = 0; y < ROWS - PLAYER_ROWS; y++) {
        d.shrooms.push(new Int8Array(COLS));
      }
      for (var i = 0; i < 40; i++) {
        var x = U.randInt(0, COLS - 1), y2 = U.randInt(2, ROWS - PLAYER_ROWS - 1);
        d.shrooms[y2][x] = 4;
      }
      d.p = { x: W / 2, y: H - CELL * 2, cool: 0 };
      d.shots = [];
      d.level = 1;
      d.lives = 3;
      d.spider = null;
      d.spiderT = 6;
      spawnCentipede(d);
      d.parts = [];
      g.set('Score', 0);
      g.set('Lives', 3);
      g.set('Level', 1);
    }

    function spawnCentipede(d) {
      d.segs = [];
      var n = 10 + d.level;
      for (var i = 0; i < n; i++) {
        d.segs.push({ x: (COLS >> 1) - i, y: 0, dir: 1, head: i === 0, t: 0 });
      }
    }

    function shroomAt(d, gx, gy) {
      if (gy < 0 || gy >= d.shrooms.length || gx < 0 || gx >= COLS) return 0;
      return d.shrooms[gy][gx];
    }

    function boom(d, x, y, col, n) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.28, s = U.rand(40, 220);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: .45, max: .45, col: col });
      }
    }

    function hurt(g) {
      var d = g.data;
      d.lives--;
      g.set('Lives', Math.max(0, d.lives));
      boom(d, d.p.x, d.p.y, '#22d3ee', 22);
      Milo.sound.explode();
      if (d.lives <= 0) {
        g.gameOver({ text: 'You cleared ' + (d.level - 1) + ' waves.' });
        return;
      }
      d.p.x = W / 2;
      d.shots = [];
      spawnCentipede(d);
      d.spider = null;
    }

    return Milo.arcade(host, {
      id: 'bug-blaster',
      w: W, h: H, bg: '#04120a',
      stats: ['Score', 'Lives', 'Level'],
      touch: 'dpad',
      touchButtons: [{ key: 'action', label: 'FIRE' }],
      emo: '🐛',
      start: {
        title: 'Bug Blaster',
        text: 'A centipede winds down through the mushrooms toward you. Shooting a middle ' +
          'segment splits it into two. Mushrooms take four hits and steer the bugs.',
        keys: ['Arrow keys / WASD', 'Space fire']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, i = g.input, p = d.p;
        var sp = 280 * dt;
        if (i.down('left')) p.x -= sp;
        if (i.down('right')) p.x += sp;
        if (i.down('up')) p.y -= sp;
        if (i.down('down')) p.y += sp;
        p.x = U.clamp(p.x, CELL / 2, W - CELL / 2);
        p.y = U.clamp(p.y, H - PLAYER_ROWS * CELL, H - CELL / 2);

        p.cool -= dt;
        if ((i.down('action') || i.pdown) && p.cool <= 0 && d.shots.length < 4) {
          p.cool = 0.14;
          d.shots.push({ x: p.x, y: p.y - 12 });
          Milo.sound.tone({ f: 900, f2: 600, d: .04, v: .04, type: 'square' });
        }

        d.shots = d.shots.filter(function (s) {
          s.y -= 780 * dt;
          if (s.y < 0) return false;
          var gx = Math.floor(s.x / CELL), gy = Math.floor(s.y / CELL);
          if (shroomAt(d, gx, gy) > 0) {
            d.shrooms[gy][gx]--;
            if (d.shrooms[gy][gx] <= 0) { g.score += 5; g.set('Score', U.fmt(g.score)); }
            boom(d, s.x, s.y, '#84cc16', 4);
            Milo.sound.tone({ f: 240, d: .04, v: .04, type: 'square' });
            return false;
          }
          for (var k = 0; k < d.segs.length; k++) {
            var sg = d.segs[k];
            if (Math.abs(sg.x * CELL + CELL / 2 - s.x) > CELL * .6) continue;
            if (Math.abs(sg.y * CELL + CELL / 2 - s.y) > CELL * .6) continue;
            // Killing a segment leaves a mushroom and splits the body.
            var mgy = sg.y;
            if (mgy >= 0 && mgy < d.shrooms.length) d.shrooms[mgy][sg.x] = 4;
            d.segs.splice(k, 1);
            if (d.segs[k]) d.segs[k].head = true;
            g.score += sg.head ? 100 : 20;
            g.set('Score', U.fmt(g.score));
            boom(d, s.x, s.y, '#fb7185', 8);
            Milo.sound.hit();
            return false;
          }
          if (d.spider && U.dist(s.x, s.y, d.spider.x, d.spider.y) < 18) {
            g.score += 300;
            g.set('Score', U.fmt(g.score));
            boom(d, d.spider.x, d.spider.y, '#a78bfa', 16);
            d.spider = null;
            Milo.sound.explode();
            return false;
          }
          return true;
        });

        var speed = 5 + d.level * 0.6;
        d.segs.forEach(function (sg) {
          sg.t += dt * speed;
          while (sg.t >= 1) {
            sg.t -= 1;
            var nx = sg.x + sg.dir;
            var blocked = nx < 0 || nx >= COLS || shroomAt(d, nx, sg.y) > 0;
            if (blocked) {
              sg.dir *= -1;
              sg.y++;
              if (sg.y * CELL > H - CELL) { sg.y = 0; }
            } else sg.x = nx;
          }
        });

        d.spiderT -= dt;
        if (!d.spider && d.spiderT <= 0) {
          d.spiderT = U.rand(8, 16);
          d.spider = {
            x: Math.random() < .5 ? 0 : W, y: H - U.rand(60, PLAYER_ROWS * CELL),
            vx: (Math.random() < .5 ? 1 : -1) * 130, vy: 80, t: 0
          };
        }
        if (d.spider) {
          var s2 = d.spider;
          s2.t += dt;
          s2.x += s2.vx * dt;
          s2.y += Math.sin(s2.t * 4) * 90 * dt;
          s2.y = U.clamp(s2.y, H - PLAYER_ROWS * CELL, H - 20);
          if (s2.x < -40 || s2.x > W + 40) d.spider = null;
          else if (U.dist(s2.x, s2.y, p.x, p.y) < 20) { hurt(g); return; }
        }

        for (var q = 0; q < d.segs.length; q++) {
          var sg2 = d.segs[q];
          if (U.dist(sg2.x * CELL + CELL / 2, sg2.y * CELL + CELL / 2, p.x, p.y) < 18) {
            hurt(g);
            return;
          }
        }

        d.parts = d.parts.filter(function (pp) {
          pp.x += pp.vx * dt; pp.y += pp.vy * dt; pp.life -= dt;
          return pp.life > 0;
        });

        if (!d.segs.length) {
          d.level++;
          g.score += 200;
          g.set('Score', U.fmt(g.score));
          g.set('Level', d.level);
          spawnCentipede(d);
          Milo.sound.win();
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.fillStyle = '#04120a'; c.fillRect(0, 0, W, H);

        for (var y = 0; y < d.shrooms.length; y++) {
          for (var x = 0; x < COLS; x++) {
            var hp = d.shrooms[y][x];
            if (!hp) continue;
            var cx = x * CELL + CELL / 2, cy = y * CELL + CELL / 2;
            c.fillStyle = ['#3f2a1a', '#6b4423', '#a15c2b', '#e5484d'][hp - 1] || '#e5484d';
            c.beginPath(); c.arc(cx, cy - 3, CELL * .34, Math.PI, 0); c.fill();
            c.fillStyle = '#e8dcc0';
            c.fillRect(cx - 3, cy - 3, 6, 9);
          }
        }

        d.segs.forEach(function (sg) {
          var cx = (sg.x + sg.t * sg.dir) * CELL + CELL / 2, cy = sg.y * CELL + CELL / 2;
          c.fillStyle = sg.head ? '#fb7185' : '#84cc16';
          c.beginPath(); c.arc(cx, cy, CELL * .38, 0, 7); c.fill();
          c.fillStyle = 'rgba(0,0,0,.35)';
          c.beginPath(); c.arc(cx, cy, CELL * .2, 0, 7); c.fill();
        });

        if (d.spider) {
          c.font = '24px serif';
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText('🕷️', d.spider.x, d.spider.y);
          c.textBaseline = 'alphabetic';
        }

        c.fillStyle = '#ffe066';
        d.shots.forEach(function (s) { c.fillRect(s.x - 2, s.y - 10, 4, 14); });

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - 2, p.y - 2, 4, 4);
        });
        c.globalAlpha = 1;

        var p2 = d.p;
        c.fillStyle = '#22d3ee';
        c.beginPath();
        c.moveTo(p2.x, p2.y - 12); c.lineTo(p2.x - 12, p2.y + 10); c.lineTo(p2.x + 12, p2.y + 10);
        c.closePath(); c.fill();

        c.strokeStyle = 'rgba(255,255,255,.08)'; c.lineWidth = 1;
        c.beginPath();
        c.moveTo(0, H - PLAYER_ROWS * CELL); c.lineTo(W, H - PLAYER_ROWS * CELL);
        c.stroke();
      }
    });
  }

  window.Milo.register({
    id: 'bug-blaster', title: 'Bug Blaster', emo: '🐛', category: 'Arcade',
    tagline: 'Split the centipede, mind the spider',
    description: 'A centipede snakes down the screen, turning and dropping a row every ' +
      'time it meets a mushroom. Shooting a middle segment splits the body into two ' +
      'independent halves and leaves a new mushroom where it died — so careless shooting ' +
      'makes the board worse. Mushrooms take four hits, and a spider drops into your zone ' +
      'every so often for 300 points.',
    controls: ['Arrow keys', 'WASD', 'Space fire'],
    colors: ['#04120a', '#84cc16'],
    tags: ['classic', 'shooter', 'arcade', 'centipede'],
    mount: mount
  });
})();
