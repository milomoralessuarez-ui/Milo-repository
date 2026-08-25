/* Darts — 301 down to zero, with a moving crosshair. */
(function () {
  'use strict';
  var W = 640, H = 640, CX = W / 2, CY = 300, R = 250;
  var ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.remaining = 301;
      d.darts = 3;
      d.thrown = [];
      d.round = 1;
      d.phase = 'x';               // x | y | done
      d.cross = { x: 0, y: 0 };
      d.dir = 1;
      d.msg = 'Click to lock the horizontal';
      g.set('Left', 301);
      g.set('Darts', 3);
      g.set('Round', 1);
    }

    /** Which bed a point lands in, and what it scores. */
    function scoreAt(x, y) {
      var dx = x - CX, dy = y - CY;
      var r = Math.hypot(dx, dy);
      if (r > R) return { pts: 0, label: 'Miss' };
      if (r < R * 0.05) return { pts: 50, label: 'Bull' };
      if (r < R * 0.11) return { pts: 25, label: '25' };
      var a = Math.atan2(dy, dx) + Math.PI / 2 + Math.PI / 20;
      if (a < 0) a += Math.PI * 2;
      var seg = ORDER[Math.floor(a / (Math.PI * 2 / 20)) % 20];
      if (r > R * 0.60 && r < R * 0.68) return { pts: seg * 3, label: 'T' + seg };
      if (r > R * 0.92) return { pts: seg * 2, label: 'D' + seg };
      return { pts: seg, label: String(seg) };
    }

    function throwDart(g) {
      var d = g.data;
      // A little scatter so a locked crosshair isn't a guaranteed treble.
      var x = CX + d.cross.x * R + U.rand(-9, 9);
      var y = CY + d.cross.y * R + U.rand(-9, 9);
      var s = scoreAt(x, y);
      d.thrown.push({ x: x, y: y, label: s.label });
      d.darts--;
      g.set('Darts', d.darts);

      if (s.pts > d.remaining || d.remaining - s.pts === 1) {
        d.msg = 'Bust! ' + s.label + ' — score stays at ' + d.remaining;
        Milo.sound.hit();
        d.darts = 0;
      } else {
        d.remaining -= s.pts;
        g.set('Left', d.remaining);
        d.msg = s.label + ' scored — ' + d.remaining + ' left';
        if (s.pts >= 40) Milo.sound.coin(); else Milo.sound.click();
      }

      if (d.remaining === 0) {
        g.win({
          emo: '🎯', title: 'Checked out!',
          text: 'Finished 301 in ' + d.round + ' round' + (d.round === 1 ? '' : 's') + '.',
          score: Math.max(200, 3000 - d.round * 120)
        });
        return;
      }
      if (d.darts <= 0) {
        d.round++;
        if (d.round > 12) {
          g.gameOver({ emo: '🎯', title: 'Out of rounds', text: d.remaining + ' left on the board.', score: 301 - d.remaining });
          return;
        }
        d.darts = 3;
        d.thrown = [];
        g.set('Darts', 3);
        g.set('Round', d.round);
      }
      d.phase = 'x';
      d.cross = { x: 0, y: 0 };
      d.dir = 1;
    }

    function advance(g) {
      var d = g.data;
      if (d.phase === 'x') { d.phase = 'y'; d.dir = 1; d.msg = 'Click to lock the vertical'; }
      else if (d.phase === 'y') throwDart(g);
    }

    return Milo.arcade(host, {
      id: 'darts',
      w: W, h: H, bg: '#14100f',
      stats: ['Left', 'Darts', 'Round'],
      emo: '🎯',
      start: {
        title: 'Darts',
        text: 'Standard 301. Two clicks per dart: one to stop the crosshair moving ' +
          'sideways, one to stop it moving up and down. Going below zero — or leaving ' +
          'exactly one — is a bust.',
        keys: ['Click twice per dart']
      },
      init: reset,
      onKey: function (g, e) { if (e.code === 'Space') advance(g); },
      onPointer: function (g, type) { if (type === 'down') advance(g); },

      update: function (g, dt) {
        var d = g.data;
        var speed = 1.3 + d.round * 0.06;
        if (d.phase === 'x') {
          d.cross.x += d.dir * dt * speed;
          if (Math.abs(d.cross.x) > 1) { d.cross.x = Math.sign(d.cross.x); d.dir *= -1; }
        } else if (d.phase === 'y') {
          d.cross.y += d.dir * dt * speed;
          if (Math.abs(d.cross.y) > 1) { d.cross.y = Math.sign(d.cross.y); d.dir *= -1; }
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.fillStyle = '#14100f'; c.fillRect(0, 0, W, H);

        c.fillStyle = '#1c1a18';
        c.beginPath(); c.arc(CX, CY, R + 20, 0, 7); c.fill();

        for (var i = 0; i < 20; i++) {
          var a0 = i * (Math.PI * 2 / 20) - Math.PI / 2 - Math.PI / 20;
          var a1 = a0 + Math.PI * 2 / 20;
          var light = i % 2 === 0;
          // main beds
          c.fillStyle = light ? '#f0e6d2' : '#211f1c';
          c.beginPath(); c.moveTo(CX, CY); c.arc(CX, CY, R, a0, a1); c.closePath(); c.fill();
          // doubles and trebles
          [[0.92, 1, light ? '#e5484d' : '#2fa36b'], [0.60, 0.68, light ? '#e5484d' : '#2fa36b']].forEach(function (band) {
            c.beginPath();
            c.arc(CX, CY, R * band[1], a0, a1);
            c.arc(CX, CY, R * band[0], a1, a0, true);
            c.closePath();
            c.fillStyle = band[2];
            c.fill();
          });
        }
        c.fillStyle = '#2fa36b';
        c.beginPath(); c.arc(CX, CY, R * 0.11, 0, 7); c.fill();
        c.fillStyle = '#e5484d';
        c.beginPath(); c.arc(CX, CY, R * 0.05, 0, 7); c.fill();

        c.fillStyle = '#f5efe2';
        c.font = '700 14px Outfit, sans-serif';
        c.textAlign = 'center';
        ORDER.forEach(function (n, i) {
          var a = i * (Math.PI * 2 / 20) - Math.PI / 2;
          c.fillText(n, CX + Math.cos(a) * (R + 12), CY + Math.sin(a) * (R + 12) + 5);
        });

        d.thrown.forEach(function (t) {
          c.strokeStyle = '#e8ecff'; c.lineWidth = 2;
          c.beginPath(); c.moveTo(t.x, t.y); c.lineTo(t.x + 16, t.y - 20); c.stroke();
          c.fillStyle = '#22d3ee';
          c.beginPath(); c.arc(t.x, t.y, 3.5, 0, 7); c.fill();
        });

        if (d.phase !== 'done') {
          var hx = CX + d.cross.x * R, hy = CY + d.cross.y * R;
          c.strokeStyle = d.phase === 'x' ? '#ffd257' : '#22d3ee';
          c.lineWidth = 2;
          if (d.phase === 'x' || d.phase === 'y') {
            c.beginPath(); c.moveTo(hx, CY - R - 24); c.lineTo(hx, CY + R + 24); c.stroke();
          }
          if (d.phase === 'y') {
            c.beginPath(); c.moveTo(CX - R - 24, hy); c.lineTo(CX + R + 24, hy); c.stroke();
          }
        }

        c.fillStyle = '#f3ede0';
        c.font = '700 17px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText(d.msg, W / 2, H - 26);
      }
    });
  }

  window.Milo.register({
    id: 'darts', title: 'Darts', emo: '🎯', category: 'Sports',
    tagline: '301 down, two clicks a dart',
    description: 'A proper board with doubles, trebles and both bulls. Each dart takes two ' +
      'clicks: the first stops a vertical line sweeping across, the second stops a ' +
      'horizontal one. There is a little scatter on release, so treble twenty is never a ' +
      'certainty. Standard 301 rules — overshooting zero, or leaving exactly one, is a bust.',
    controls: ['Click twice per dart', 'Space'],
    colors: ['#14100f', '#e5484d'],
    tags: ['darts', 'timing', 'sports', 'aiming'],
    mount: mount
  });
})();
