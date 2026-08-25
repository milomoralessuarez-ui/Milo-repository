/* Perfect Circle — draw a circle by hand and get scored on it. */
(function () {
  'use strict';
  var W = 620, H = 620;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.pts = [];
      d.drawing = false;
      d.result = null;
      d.attempts = 0;
      d.best = Milo.store.best('perfect-circle');
      g.set('Score', '—');
      g.set('Attempts', 0);
      g.set('Best', d.best ? d.best + '%' : '—');
    }

    var CX = W / 2, CY = H / 2;

    /**
     * Score the stroke: how consistent the radius is, and how much of the
     * full turn was actually drawn. Both matter — a perfect arc is not a circle.
     */
    function evaluate(pts) {
      if (pts.length < 24) return null;
      var rs = pts.map(function (p) { return U.dist(p.x, p.y, CX, CY); });
      var mean = rs.reduce(function (a, b) { return a + b; }, 0) / rs.length;
      if (mean < 40) return null;
      var variance = rs.reduce(function (a, r) { return a + (r - mean) * (r - mean); }, 0) / rs.length;
      var sd = Math.sqrt(variance);
      var roundness = U.clamp(1 - (sd / mean) * 3.2, 0, 1);

      // Total angle swept, unwrapped so it can exceed a full turn.
      var swept = 0;
      for (var i = 1; i < pts.length; i++) {
        var a0 = Math.atan2(pts[i - 1].y - CY, pts[i - 1].x - CX);
        var a1 = Math.atan2(pts[i].y - CY, pts[i].x - CX);
        var dA = a1 - a0;
        while (dA > Math.PI) dA -= Math.PI * 2;
        while (dA < -Math.PI) dA += Math.PI * 2;
        swept += dA;
      }
      var completeness = U.clamp(Math.abs(swept) / (Math.PI * 2), 0, 1);
      return {
        pct: Math.round(roundness * completeness * 100),
        mean: mean,
        completeness: completeness
      };
    }

    return Milo.arcade(host, {
      id: 'perfect-circle',
      w: W, h: H, bg: '#0e1230',
      stats: ['Score', 'Attempts', 'Best'],
      emo: '⭕',
      trackBest: true,
      start: {
        title: 'Perfect Circle',
        text: 'Draw a circle around the dot in one stroke, freehand. You are scored on ' +
          'how even your radius stays and how much of the full turn you actually complete.',
        keys: ['Drag to draw', 'Release to score']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        var d = g.data;
        if (type === 'down') {
          d.pts = [{ x: x, y: y }];
          d.drawing = true;
          d.result = null;
        } else if (type === 'move' && d.drawing) {
          var last = d.pts[d.pts.length - 1];
          if (U.dist(x, y, last.x, last.y) > 3) d.pts.push({ x: x, y: y });
        } else if (type === 'up' && d.drawing) {
          d.drawing = false;
          d.attempts++;
          g.set('Attempts', d.attempts);
          var r = evaluate(d.pts);
          d.result = r;
          if (!r) {
            g.set('Score', '—');
            Milo.sound.tone({ f: 150, d: .12, v: .05, type: 'square' });
            return;
          }
          g.set('Score', r.pct + '%');
          g.score = r.pct;
          if (r.pct > d.best) {
            d.best = r.pct;
            g.set('Best', d.best + '%');
            Milo.store.setBest('perfect-circle', r.pct);
            Milo.sound.win();
          } else Milo.sound.coin();
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createRadialGradient(CX, CY, 20, CX, CY, W * .7);
        bg.addColorStop(0, '#1a2050'); bg.addColorStop(1, '#080b1c');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        c.fillStyle = '#ffd257';
        c.beginPath(); c.arc(CX, CY, 6, 0, 7); c.fill();

        // ideal circle for reference once a stroke is scored
        if (d.result) {
          c.strokeStyle = 'rgba(52,211,153,.45)';
          c.setLineDash([6, 8]); c.lineWidth = 2;
          c.beginPath(); c.arc(CX, CY, d.result.mean, 0, 7); c.stroke();
          c.setLineDash([]);
        }

        if (d.pts.length > 1) {
          var pct = d.result ? d.result.pct : 100;
          c.strokeStyle = d.result
            ? (pct > 90 ? '#34d399' : pct > 75 ? '#ffd257' : '#fb7185')
            : '#22d3ee';
          c.lineWidth = 4; c.lineCap = 'round'; c.lineJoin = 'round';
          c.beginPath();
          d.pts.forEach(function (p, i) { i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y); });
          c.stroke();
        }

        c.textAlign = 'center';
        if (d.result) {
          c.fillStyle = '#fff';
          c.font = '800 46px Outfit, sans-serif';
          c.fillText(d.result.pct + '%', CX, CY - 10);
          c.fillStyle = 'rgba(255,255,255,.55)';
          c.font = '600 13px Outfit, sans-serif';
          c.fillText(d.result.completeness < 0.9 ? 'Close the loop for a better score'
            : d.result.pct > 92 ? 'That is a very good circle'
              : 'Keep your radius steady', CX, CY + 22);
        } else if (!d.drawing) {
          c.fillStyle = 'rgba(255,255,255,.4)';
          c.font = '600 16px Outfit, sans-serif';
          c.fillText('Draw a circle around the dot', CX, CY + 90);
        }
      }
    });
  }

  window.Milo.register({
    id: 'perfect-circle', title: 'Perfect Circle', emo: '⭕', category: 'Casual',
    tagline: 'How round can you draw freehand?',
    description: 'One stroke, around the dot, no lifting. Your score multiplies how ' +
      'consistent your radius stayed by how much of the full turn you actually drew, so a ' +
      'beautiful three-quarter arc will not save you. The dashed line afterwards shows the ' +
      'circle you were closest to drawing.',
    controls: ['Drag to draw'],
    colors: ['#0e1230', '#34d399'],
    scoreLabel: '%',
    tags: ['drawing', 'skill', 'one finger', 'relaxing'],
    mount: mount
  });
})();
