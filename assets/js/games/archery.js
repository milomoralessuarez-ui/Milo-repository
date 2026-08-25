/* Archery — judge the wind and the drop; ten arrows. */
(function () {
  'use strict';
  var W = 860, H = 520, ARROWS = 10;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.arrowsLeft = ARROWS;
      d.hits = [];
      d.arrow = null;
      d.aim = null;
      d.round = 0;
      newRound(d);
      g.set('Score', 0);
      g.set('Arrows', ARROWS);
      g.set('Wind', '0');
    }

    function newRound(d) {
      d.round++;
      d.target = {
        x: U.rand(560, 780),
        y: U.rand(140, 380),
        r: Math.max(34, 62 - d.round * 2),
        drift: d.round > 3 ? U.rand(-40, 40) : 0,
        t: 0
      };
      d.wind = U.rand(-1, 1) * Math.min(90, 20 + d.round * 8);
    }

    function shoot(g, dx, dy) {
      var d = g.data;
      if (d.arrow || !d.arrowsLeft) return;
      var power = Math.min(1, Math.hypot(dx, dy) / 180);
      if (power < 0.1) return;
      d.arrow = {
        x: 70, y: H / 2, vx: dx * 6 * power, vy: dy * 6 * power, a: 0, trail: []
      };
      d.arrowsLeft--;
      g.set('Arrows', d.arrowsLeft);
      Milo.sound.tone({ f: 700, f2: 300, d: .12, v: .06, type: 'triangle' });
    }

    function ringFor(dist, r) {
      var f = dist / r;
      if (f > 1) return 0;
      if (f < 0.16) return 10;
      if (f < 0.34) return 9;
      if (f < 0.52) return 7;
      if (f < 0.72) return 5;
      return 3;
    }

    return Milo.arcade(host, {
      id: 'archery',
      w: W, h: H, bg: '#12281a',
      stats: ['Score', 'Arrows', 'Wind'],
      emo: '🏹',
      start: {
        title: 'Archery',
        text: 'Ten arrows. Drag back from the bow and release. The arrow drops as it ' +
          'flies and the wind pushes it sideways — both get worse as the rounds go on.',
        keys: ['Drag and release']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        var d = g.data;
        if (type === 'down') d.aim = { x: x, y: y };
        else if (type === 'move' && d.aim) { d.aim.x = x; d.aim.y = y; }
        else if (type === 'up' && d.aim) {
          shoot(g, 70 - d.aim.x, H / 2 - d.aim.y);
          d.aim = null;
        }
      },

      update: function (g, dt) {
        var d = g.data;
        d.target.t += dt;
        if (d.target.drift) {
          d.target.y += Math.sin(d.target.t * 1.2) * d.target.drift * dt;
          d.target.y = U.clamp(d.target.y, 110, H - 110);
        }

        if (!d.arrow) return;
        var a = d.arrow;
        a.vy += 190 * dt;
        a.vx += d.wind * dt;
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        a.a = Math.atan2(a.vy, a.vx);
        a.trail.push({ x: a.x, y: a.y });
        if (a.trail.length > 20) a.trail.shift();

        var dist = U.dist(a.x, a.y, d.target.x, d.target.y);
        if (dist < d.target.r) {
          var ring = ringFor(dist, d.target.r);
          g.score += ring;
          g.set('Score', g.score);
          d.hits.push({ x: a.x - d.target.x, y: a.y - d.target.y, ring: ring });
          if (ring === 10) Milo.sound.win(); else Milo.sound.coin();
          d.arrow = null;
          finishOrNext(g);
          return;
        }
        if (a.x > W + 40 || a.y > H + 40 || a.y < -200) {
          d.arrow = null;
          Milo.sound.tone({ f: 140, d: .12, v: .05, type: 'square' });
          finishOrNext(g);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#2b4a63'); sky.addColorStop(1, '#16321f');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);
        c.fillStyle = '#1c4a29';
        c.fillRect(0, H - 60, W, 60);

        // target
        var t = d.target;
        var rings = [
          { f: 1, col: '#f8fafc' }, { f: 0.72, col: '#0f172a' },
          { f: 0.52, col: '#38bdf8' }, { f: 0.34, col: '#ef4444' },
          { f: 0.16, col: '#facc15' }
        ];
        rings.forEach(function (r) {
          c.fillStyle = r.col;
          c.beginPath(); c.arc(t.x, t.y, t.r * r.f, 0, 7); c.fill();
        });
        c.fillStyle = '#78350f';
        c.fillRect(t.x - 5, t.y + t.r, 10, H - 60 - (t.y + t.r));

        d.hits.forEach(function (h) {
          c.fillStyle = '#1c1917';
          c.beginPath(); c.arc(t.x + h.x, t.y + h.y, 3.5, 0, 7); c.fill();
        });

        // archer
        c.strokeStyle = '#8b5a2b'; c.lineWidth = 5;
        c.beginPath(); c.arc(70, H / 2, 34, -1.1, 1.1); c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1.6;
        var pull = d.aim ? U.clamp((70 - d.aim.x) * .18, 0, 26) : 0;
        c.beginPath();
        c.moveTo(70 + Math.cos(-1.1) * 34, H / 2 + Math.sin(-1.1) * 34);
        c.lineTo(70 - pull, d.aim ? H / 2 + (d.aim.y - H / 2) * .18 : H / 2);
        c.lineTo(70 + Math.cos(1.1) * 34, H / 2 + Math.sin(1.1) * 34);
        c.stroke();

        if (d.aim) {
          var dx = 70 - d.aim.x, dy = H / 2 - d.aim.y;
          var power = Math.min(1, Math.hypot(dx, dy) / 180);
          var sx = 70, sy = H / 2, svx = dx * 6 * power, svy = dy * 6 * power;
          c.strokeStyle = 'rgba(255,210,87,.5)'; c.lineWidth = 2;
          c.beginPath(); c.moveTo(sx, sy);
          for (var s = 0; s < 34; s++) {
            svy += 190 * 0.035; svx += d.wind * 0.035;
            sx += svx * 0.035; sy += svy * 0.035;
            c.lineTo(sx, sy);
          }
          c.stroke();
        }

        if (d.arrow) {
          var a = d.arrow;
          c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 2;
          c.beginPath();
          a.trail.forEach(function (p, i) { i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y); });
          c.stroke();
          c.save();
          c.translate(a.x, a.y);
          c.rotate(a.a);
          c.strokeStyle = '#e8ecff'; c.lineWidth = 3;
          c.beginPath(); c.moveTo(-22, 0); c.lineTo(10, 0); c.stroke();
          c.fillStyle = '#94a3b8';
          c.beginPath(); c.moveTo(16, 0); c.lineTo(6, -4); c.lineTo(6, 4); c.closePath(); c.fill();
          c.restore();
        }

        // wind gauge
        c.fillStyle = 'rgba(0,0,0,.4)';
        U.roundRect(c, W / 2 - 90, 16, 180, 26, 8); c.fill();
        c.fillStyle = '#fff';
        c.font = '700 12px Outfit, sans-serif';
        c.textAlign = 'center';
        var dirTxt = Math.abs(d.wind) < 5 ? 'calm' : (d.wind > 0 ? '→ ' : '← ') + Math.abs(Math.round(d.wind));
        c.fillText('WIND  ' + dirTxt, W / 2, 33);
      }
    });

    function finishOrNext(g) {
      var d = g.data;
      if (d.arrowsLeft <= 0) {
        g.gameOver({
          emo: '🏹', title: g.score + ' points',
          text: 'Ten arrows shot, ' + d.hits.length + ' on target.',
          score: g.score
        });
        return;
      }
      newRound(d);
      g.set('Wind', Math.round(d.wind));
    }
  }

  window.Milo.register({
    id: 'archery', title: 'Archery', emo: '🏹', category: 'Sports',
    tagline: 'Ten arrows, moving target, real wind',
    description: 'Drag back from the bow to set power and angle, and a dotted arc shows ' +
      'roughly where the arrow will land — accounting for both gravity and the crosswind, ' +
      'which is shown at the top. The target shrinks and starts drifting as the rounds go ' +
      'on. Gold centre is ten points.',
    controls: ['Drag and release'],
    colors: ['#12281a', '#facc15'],
    tags: ['aiming', 'physics', 'sports', 'wind'],
    mount: mount
  });
})();
