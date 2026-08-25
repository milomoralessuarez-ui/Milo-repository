/* Mini Golf — nine holes, drag to putt, mind the walls and the sand. */
(function () {
  'use strict';
  var W = 820, H = 560;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    var HOLES = [
      { tee: [90, 280], cup: [720, 280], walls: [], sand: [], par: 2 },
      { tee: [90, 440], cup: [720, 120], walls: [[300, 200, 30, 260]], sand: [], par: 3 },
      { tee: [90, 280], cup: [720, 280], walls: [[380, 0, 30, 210], [380, 350, 30, 210]], sand: [], par: 3 },
      { tee: [90, 450], cup: [730, 110], walls: [[240, 220, 300, 26], [520, 246, 26, 200]], sand: [[300, 330, 140, 90]], par: 4 },
      { tee: [100, 120], cup: [700, 460], walls: [[260, 100, 26, 300], [460, 180, 26, 300]], sand: [], par: 4 },
      { tee: [90, 280], cup: [730, 280], walls: [[340, 120, 26, 140], [340, 300, 26, 140], [560, 220, 26, 120]], sand: [[430, 240, 90, 90]], par: 4 },
      { tee: [110, 460], cup: [700, 100], walls: [[220, 300, 260, 26], [480, 120, 26, 210]], sand: [[560, 300, 120, 120]], par: 4 },
      { tee: [90, 100], cup: [720, 460], walls: [[200, 160, 26, 320], [400, 60, 26, 320], [600, 200, 26, 300]], sand: [], par: 5 },
      { tee: [W / 2, 500], cup: [W / 2, 90], walls: [[240, 200, 340, 26], [240, 226, 26, 160], [554, 226, 26, 160]], sand: [[300, 300, 220, 80]], par: 5 }
    ];

    function reset(g) {
      var d = g.data;
      d.hole = 0;
      d.total = 0;
      d.strokes = 0;
      loadHole(d);
      g.set('Hole', '1/9');
      g.set('Strokes', 0);
      g.set('Total', 0);
    }

    function loadHole(d) {
      var h = HOLES[d.hole];
      d.ball = { x: h.tee[0], y: h.tee[1], vx: 0, vy: 0, r: 9 };
      d.strokes = 0;
      d.aim = null;
      d.sunk = false;
      d.msg = 'Par ' + h.par;
    }

    function inSand(d, x, y) {
      return HOLES[d.hole].sand.some(function (s) {
        return x > s[0] && x < s[0] + s[2] && y > s[1] && y < s[1] + s[3];
      });
    }

    function nextHole(g) {
      var d = g.data;
      d.hole++;
      if (d.hole >= HOLES.length) {
        var par = HOLES.reduce(function (a, h) { return a + h.par; }, 0);
        var diff = d.total - par;
        g.win({
          emo: '⛳',
          title: d.total + ' strokes (' + (diff === 0 ? 'level par' : (diff > 0 ? '+' : '') + diff) + ')',
          text: 'Nine holes complete.',
          score: Math.max(100, 4000 - d.total * 60)
        });
        return;
      }
      loadHole(d);
      g.set('Hole', (d.hole + 1) + '/9');
      g.set('Strokes', 0);
    }

    return Milo.arcade(host, {
      id: 'mini-golf',
      w: W, h: H, bg: '#12401f',
      stats: ['Hole', 'Strokes', 'Total'],
      emo: '⛳',
      start: {
        title: 'Mini Golf',
        text: 'Nine holes. Drag back from the ball and release to putt — the further you ' +
          'drag, the harder you hit it. Sand slows the ball right down.',
        keys: ['Drag from the ball', 'Release to putt']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        var d = g.data;
        if (d.sunk) return;
        var moving = Math.hypot(d.ball.vx, d.ball.vy) > 6;
        if (moving) return;
        if (type === 'down') d.aim = { x: x, y: y };
        else if (type === 'move' && d.aim) { d.aim.x = x; d.aim.y = y; }
        else if (type === 'up' && d.aim) {
          var dx = d.ball.x - d.aim.x, dy = d.ball.y - d.aim.y;
          var power = Math.min(1, Math.hypot(dx, dy) / 190);
          if (power > 0.07) {
            d.ball.vx = dx * 5.2 * power;
            d.ball.vy = dy * 5.2 * power;
            d.strokes++;
            d.total++;
            g.set('Strokes', d.strokes);
            g.set('Total', d.total);
            Milo.sound.tone({ f: 300, f2: 200, d: .1, v: .07, type: 'triangle' });
          }
          d.aim = null;
        }
      },

      update: function (g, dt) {
        var d = g.data;
        var b = d.ball, h = HOLES[d.hole];
        if (d.sunk) {
          d.sunkT -= dt;
          if (d.sunkT <= 0) nextHole(g);
          return;
        }

        b.x += b.vx * dt;
        b.y += b.vy * dt;

        var friction = inSand(d, b.x, b.y) ? 0.02 : 0.28;
        var f = Math.pow(friction, dt);
        b.vx *= f; b.vy *= f;
        if (Math.hypot(b.vx, b.vy) < 6) { b.vx = 0; b.vy = 0; }

        if (b.x - b.r < 12) { b.x = 12 + b.r; b.vx = Math.abs(b.vx) * .78; Milo.sound.click(); }
        if (b.x + b.r > W - 12) { b.x = W - 12 - b.r; b.vx = -Math.abs(b.vx) * .78; Milo.sound.click(); }
        if (b.y - b.r < 12) { b.y = 12 + b.r; b.vy = Math.abs(b.vy) * .78; Milo.sound.click(); }
        if (b.y + b.r > H - 12) { b.y = H - 12 - b.r; b.vy = -Math.abs(b.vy) * .78; Milo.sound.click(); }

        h.walls.forEach(function (wl) {
          var wx = wl[0], wy = wl[1], ww = wl[2], wh = wl[3];
          if (b.x + b.r < wx || b.x - b.r > wx + ww || b.y + b.r < wy || b.y - b.r > wy + wh) return;
          // Bounce on whichever axis is least overlapped.
          var ox = Math.min(b.x + b.r - wx, wx + ww - (b.x - b.r));
          var oy = Math.min(b.y + b.r - wy, wy + wh - (b.y - b.r));
          if (ox < oy) {
            b.vx = -b.vx * .78;
            b.x += b.x < wx + ww / 2 ? -ox : ox;
          } else {
            b.vy = -b.vy * .78;
            b.y += b.y < wy + wh / 2 ? -oy : oy;
          }
          Milo.sound.click();
        });

        var dist = U.dist(b.x, b.y, h.cup[0], h.cup[1]);
        if (dist < 16 && Math.hypot(b.vx, b.vy) < 320) {
          d.sunk = true;
          d.sunkT = 1.1;
          var diff = d.strokes - h.par;
          d.msg = diff <= -2 ? 'Eagle!' : diff === -1 ? 'Birdie!' : diff === 0 ? 'Par' :
            diff === 1 ? 'Bogey' : '+' + diff;
          Milo.sound.win();
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var h = HOLES[d.hole];
        c.fillStyle = '#0d3319'; c.fillRect(0, 0, W, H);
        c.fillStyle = '#1c6b33';
        U.roundRect(c, 12, 12, W - 24, H - 24, 16); c.fill();

        h.sand.forEach(function (s) {
          c.fillStyle = '#d9c27f';
          U.roundRect(c, s[0], s[1], s[2], s[3], 18); c.fill();
        });

        h.walls.forEach(function (wl) {
          c.fillStyle = '#8b5a2b';
          U.roundRect(c, wl[0], wl[1], wl[2], wl[3], 5); c.fill();
          c.fillStyle = 'rgba(255,255,255,.16)';
          U.roundRect(c, wl[0] + 2, wl[1] + 2, wl[2] - 4, 4, 2); c.fill();
        });

        c.fillStyle = '#0a1a0e';
        c.beginPath(); c.arc(h.cup[0], h.cup[1], 15, 0, 7); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 2;
        c.beginPath(); c.arc(h.cup[0], h.cup[1], 15, 0, 7); c.stroke();
        c.strokeStyle = '#e8ecff'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(h.cup[0], h.cup[1]); c.lineTo(h.cup[0], h.cup[1] - 44); c.stroke();
        c.fillStyle = '#fb7185';
        c.beginPath();
        c.moveTo(h.cup[0], h.cup[1] - 44);
        c.lineTo(h.cup[0] + 26, h.cup[1] - 36);
        c.lineTo(h.cup[0], h.cup[1] - 28);
        c.closePath(); c.fill();

        if (d.aim) {
          var dx = d.ball.x - d.aim.x, dy = d.ball.y - d.aim.y;
          var power = Math.min(1, Math.hypot(dx, dy) / 190);
          c.strokeStyle = 'rgba(255,255,255,.45)';
          c.setLineDash([5, 6]); c.lineWidth = 2;
          c.beginPath(); c.moveTo(d.ball.x, d.ball.y); c.lineTo(d.aim.x, d.aim.y); c.stroke();
          c.setLineDash([]);
          c.strokeStyle = power > .8 ? '#fb7185' : '#ffd257';
          c.lineWidth = 4;
          c.beginPath();
          c.moveTo(d.ball.x, d.ball.y);
          c.lineTo(d.ball.x + dx * 0.7, d.ball.y + dy * 0.7);
          c.stroke();
        }

        if (!d.sunk) {
          c.fillStyle = 'rgba(0,0,0,.3)';
          c.beginPath(); c.arc(d.ball.x + 2, d.ball.y + 3, d.ball.r, 0, 7); c.fill();
          c.fillStyle = '#fff';
          c.beginPath(); c.arc(d.ball.x, d.ball.y, d.ball.r, 0, 7); c.fill();
        }

        c.fillStyle = '#eaf6ec';
        c.font = '700 18px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText(d.msg, W / 2, 42);
      }
    });
  }

  window.Milo.register({
    id: 'mini-golf', title: 'Mini Golf', emo: '⛳', category: 'Sports',
    tagline: 'Nine holes of drag-and-putt',
    description: 'Drag back from the ball and let go — the length of the drag sets the ' +
      'power and a guide shows the line. Walls bounce the ball with a bit of energy lost ' +
      'each time, and sand traps kill your roll almost instantly. Nine holes with rising ' +
      'par; your total against par is the score.',
    controls: ['Drag from the ball'],
    colors: ['#1c6b33', '#fff'],
    tags: ['golf', 'physics', 'aiming', 'sports'],
    mount: mount
  });
})();
