/* Merge Drop — drop fruit, equal ones merge, don't overflow. */
(function () {
  'use strict';
  var W = 460, H = 660, WALL = 16, TOP = 110;
  var TIERS = [
    { r: 16, col: '#fb7185', emo: '🍒' }, { r: 22, col: '#f472b6', emo: '🍓' },
    { r: 29, col: '#a78bfa', emo: '🍇' }, { r: 36, col: '#fb923c', emo: '🍊' },
    { r: 44, col: '#facc15', emo: '🍋' }, { r: 54, col: '#84cc16', emo: '🍏' },
    { r: 65, col: '#22c55e', emo: '🍉' }, { r: 78, col: '#e5484d', emo: '🎃' }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.balls = [];
      d.dropX = W / 2;
      d.nextTier = U.randInt(0, 2);
      d.cool = 0;
      d.overT = 0;
      d.best = 0;
      d.parts = [];
      g.set('Score', 0);
      g.set('Biggest', TIERS[0].emo);
      g.set('Best', U.fmt(g.best));
    }

    function drop(g) {
      var d = g.data;
      if (d.cool > 0) return;
      d.cool = 0.42;
      var t = d.nextTier;
      d.balls.push({
        x: U.clamp(d.dropX, WALL + TIERS[t].r, W - WALL - TIERS[t].r),
        y: TOP - 20, vx: 0, vy: 0, t: t, rest: 0
      });
      d.nextTier = U.randInt(0, 2);
      Milo.sound.tone({ f: 420, f2: 300, d: .07, v: .05, type: 'triangle' });
    }

    return Milo.arcade(host, {
      id: 'merge-drop',
      w: W, h: H, bg: '#2a1a10',
      stats: ['Score', 'Biggest', 'Best'],
      emo: '🍉',
      start: {
        title: 'Merge Drop',
        text: 'Drop fruit into the jar. Two of the same kind merge into the next size up. ' +
          'Let the pile spill over the line and it is over.',
        keys: ['Move to aim', 'Click to drop']
      },
      init: reset,

      onPointer: function (g, type, x) {
        var d = g.data;
        d.dropX = U.clamp(x, WALL + 20, W - WALL - 20);
        if (type === 'down') drop(g);
      },
      onKey: function (g, e) { if (e.code === 'Space') drop(g); },

      update: function (g, dt) {
        var d = g.data;
        d.cool -= dt;
        var i = g.input;
        if (i.down('left')) d.dropX = Math.max(WALL + 20, d.dropX - 340 * dt);
        if (i.down('right')) d.dropX = Math.min(W - WALL - 20, d.dropX + 340 * dt);

        // Simple circle physics with positional resolution.
        d.balls.forEach(function (b) {
          b.vy += 1500 * dt;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.vx *= Math.pow(.4, dt);
          var r = TIERS[b.t].r;
          if (b.x < WALL + r) { b.x = WALL + r; b.vx = Math.abs(b.vx) * .3; }
          if (b.x > W - WALL - r) { b.x = W - WALL - r; b.vx = -Math.abs(b.vx) * .3; }
          if (b.y > H - WALL - r) { b.y = H - WALL - r; b.vy = -Math.abs(b.vy) * .18; }
        });

        for (var pass = 0; pass < 4; pass++) {
          for (var a = 0; a < d.balls.length; a++) {
            for (var bi = a + 1; bi < d.balls.length; bi++) {
              var A = d.balls[a], B = d.balls[bi];
              if (!A || !B) continue;
              var ra = TIERS[A.t].r, rb = TIERS[B.t].r;
              var dx = B.x - A.x, dy = B.y - A.y;
              var dist = Math.hypot(dx, dy);
              if (dist >= ra + rb || dist < 0.01) continue;

              if (A.t === B.t && A.t < TIERS.length - 1 && pass === 0) {
                var nt = A.t + 1;
                var nx = (A.x + B.x) / 2, ny = (A.y + B.y) / 2;
                d.balls.splice(Math.max(a, bi), 1);
                d.balls.splice(Math.min(a, bi), 1);
                d.balls.push({ x: nx, y: ny, vx: 0, vy: -120, t: nt, rest: 0 });
                g.score += (nt + 1) * 12;
                g.set('Score', U.fmt(g.score));
                if (nt > d.best) { d.best = nt; g.set('Biggest', TIERS[nt].emo); }
                for (var q = 0; q < 12; q++) {
                  var ang = Math.random() * 6.28;
                  d.parts.push({ x: nx, y: ny, vx: Math.cos(ang) * 180, vy: Math.sin(ang) * 180, life: .4, max: .4, col: TIERS[nt].col });
                }
                Milo.sound.tone({ f: 300 + nt * 70, f2: 500 + nt * 60, d: .1, v: .06, type: 'square' });
                if (nt === TIERS.length - 1) {
                  g.score += 500;
                  Milo.sound.win();
                }
                a = -1;
                break;
              }

              var overlap = (ra + rb - dist) / 2;
              var nx2 = dx / dist, ny2 = dy / dist;
              A.x -= nx2 * overlap; A.y -= ny2 * overlap;
              B.x += nx2 * overlap; B.y += ny2 * overlap;
              var rel = (B.vx - A.vx) * nx2 + (B.vy - A.vy) * ny2;
              if (rel < 0) {
                A.vx += nx2 * rel * .5; A.vy += ny2 * rel * .5;
                B.vx -= nx2 * rel * .5; B.vy -= ny2 * rel * .5;
              }
            }
          }
        }

        // Overflow check, with grace so a bouncing drop doesn't kill you.
        var over = d.balls.some(function (b) {
          return b.y - TIERS[b.t].r < TOP && Math.abs(b.vy) < 60;
        });
        d.overT = over ? d.overT + dt : 0;
        if (d.overT > 1.6) {
          Milo.sound.explode();
          g.gameOver({ text: 'Biggest fruit: ' + TIERS[d.best].emo + '.' });
          return;
        }

        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 600 * dt; p.life -= dt;
          return p.life > 0;
        });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.fillStyle = '#2a1a10'; c.fillRect(0, 0, W, H);
        c.fillStyle = '#1a1008';
        c.fillRect(WALL, TOP, W - WALL * 2, H - TOP - WALL);
        c.strokeStyle = '#7a5330'; c.lineWidth = 8;
        c.beginPath();
        c.moveTo(WALL, TOP); c.lineTo(WALL, H - WALL);
        c.lineTo(W - WALL, H - WALL); c.lineTo(W - WALL, TOP);
        c.stroke();

        c.strokeStyle = d.overT > 0 ? '#fb7185' : 'rgba(255,255,255,.2)';
        c.setLineDash([8, 8]); c.lineWidth = 2;
        c.beginPath(); c.moveTo(WALL, TOP); c.lineTo(W - WALL, TOP); c.stroke();
        c.setLineDash([]);

        d.balls.forEach(function (b) {
          var t = TIERS[b.t];
          c.fillStyle = t.col;
          c.beginPath(); c.arc(b.x, b.y, t.r, 0, 7); c.fill();
          c.fillStyle = 'rgba(255,255,255,.25)';
          c.beginPath(); c.arc(b.x - t.r * .3, b.y - t.r * .32, t.r * .22, 0, 7); c.fill();
          c.font = (t.r * 1.1) + 'px serif';
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText(t.emo, b.x, b.y + 1);
        });
        c.textBaseline = 'alphabetic';

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - 3, p.y - 3, 6, 6);
        });
        c.globalAlpha = 1;

        // aim line and next fruit
        c.strokeStyle = 'rgba(255,255,255,.22)';
        c.setLineDash([4, 8]); c.lineWidth = 2;
        c.beginPath(); c.moveTo(d.dropX, TOP); c.lineTo(d.dropX, H - WALL); c.stroke();
        c.setLineDash([]);
        var nt = TIERS[d.nextTier];
        c.fillStyle = nt.col;
        c.beginPath(); c.arc(d.dropX, TOP - 34, nt.r, 0, 7); c.fill();
        c.font = (nt.r * 1.1) + 'px serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(nt.emo, d.dropX, TOP - 33);
        c.textBaseline = 'alphabetic';
      }
    });
  }

  window.Milo.register({
    id: 'merge-drop', title: 'Merge Drop', emo: '🍉', category: 'Puzzle',
    tagline: 'Two of a kind become one bigger one',
    description: 'Drop fruit into a jar where everything rolls and settles properly. Two ' +
      'of the same fruit touching merge into the next size up, which can set off a chain ' +
      'all the way down the pile. The jar fills faster than you expect — let it sit above ' +
      'the line and you are out.',
    controls: ['Move to aim', 'Click to drop'],
    colors: ['#2a1a10', '#e5484d'],
    tags: ['merging', 'physics', 'puzzle', 'relaxing'],
    mount: mount
  });
})();
