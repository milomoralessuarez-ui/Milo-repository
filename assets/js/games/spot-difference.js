/* Spot the Difference — two generated scenes, five changes, one ticking clock. */
(function () {
  'use strict';
  var W = 900, H = 620;
  var PW = 420, PH = 420, GAP = 26;
  var LX = (W - PW * 2 - GAP) / 2, RX = LX + PW + GAP, PY = 96;
  var DIFFS = 5;

  var SHAPES = ['circle', 'square', 'triangle', 'star', 'diamond', 'heart'];
  var PALETTE = ['#e0553f', '#4a86d8', '#5fae6a', '#e8c24a', '#9a6fd8', '#e88fb0', '#4fc8d0', '#e8934a'];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    /** Builds a scene as a list of shapes, then a mutated copy with exactly DIFFS changes. */
    function buildScene(d, level) {
      var count = 16 + Math.min(14, level * 2);
      var a = [];
      var tries = 0;
      while (a.length < count && tries < 900) {
        tries++;
        var r = U.rand(20, 34);
        var x = U.rand(r + 8, PW - r - 8), y = U.rand(r + 8, PH - r - 8);
        // Keep shapes apart so a difference is never hidden under another shape.
        var clash = a.some(function (s) { return U.dist(s.x, s.y, x, y) < s.r + r + 10; });
        if (clash) continue;
        a.push({
          x: x, y: y, r: r,
          shape: U.choice(SHAPES),
          color: U.choice(PALETTE),
          rot: U.rand(0, Math.PI * 2),
          hidden: false
        });
      }

      var b = a.map(function (s) { return Object.assign({}, s); });

      // Pick distinct shapes to alter, one change each.
      var idx = [];
      for (var i = 0; i < a.length; i++) idx.push(i);
      U.shuffle(idx);
      var chosen = idx.slice(0, DIFFS);
      d.diffs = [];
      chosen.forEach(function (i) {
        var s = b[i], orig = a[i];
        var kind = U.choice(['color', 'shape', 'size', 'gone', 'move']);
        if (kind === 'color') {
          var pool = PALETTE.filter(function (p) { return p !== orig.color; });
          s.color = U.choice(pool);
        } else if (kind === 'shape') {
          var pool2 = SHAPES.filter(function (p) { return p !== orig.shape; });
          s.shape = U.choice(pool2);
        } else if (kind === 'size') {
          s.r = orig.r * (Math.random() < .5 ? .62 : 1.42);
          s.r = U.clamp(s.r, 14, 42);
        } else if (kind === 'gone') {
          s.hidden = true;
        } else {
          // A nudge big enough to notice but small enough to be work.
          var ang = U.rand(0, Math.PI * 2), amt = U.rand(16, 26);
          s.x = U.clamp(orig.x + Math.cos(ang) * amt, orig.r + 6, PW - orig.r - 6);
          s.y = U.clamp(orig.y + Math.sin(ang) * amt, orig.r + 6, PH - orig.r - 6);
        }
        d.diffs.push({ x: orig.x, y: orig.y, r: Math.max(orig.r, s.r) + 8, found: false, kind: kind });
      });

      d.a = a;
      d.b = b;
    }

    function newRound(g, level) {
      var d = g.data;
      buildScene(d, level);
      d.found = 0;
      d.wrong = 0;
      d.marks = [];
      d.between = 0;
      g.set('Found', '0/' + DIFFS);
      g.set('Round', level);
    }

    function reset(g) {
      var d = g.data;
      d.level = d.level || 1;
      d.time = 60;
      d.parts = [];
      newRound(g, d.level);
      g.set('Time', '60s');
      g.set('Best', g.best ? U.fmt(g.best) : '—');
    }

    function drawShape(c, s, dim) {
      if (s.hidden) return;
      c.save();
      c.translate(s.x, s.y);
      c.rotate(s.rot);
      c.fillStyle = dim ? U.shade(s.color, -45) : s.color;
      c.beginPath();
      var r = s.r, i;
      if (s.shape === 'circle') {
        c.arc(0, 0, r, 0, Math.PI * 2);
      } else if (s.shape === 'square') {
        c.rect(-r * .8, -r * .8, r * 1.6, r * 1.6);
      } else if (s.shape === 'triangle') {
        c.moveTo(0, -r); c.lineTo(r * .9, r * .7); c.lineTo(-r * .9, r * .7);
      } else if (s.shape === 'diamond') {
        c.moveTo(0, -r); c.lineTo(r * .78, 0); c.lineTo(0, r); c.lineTo(-r * .78, 0);
      } else if (s.shape === 'star') {
        for (i = 0; i < 10; i++) {
          var a = Math.PI / 5 * i - Math.PI / 2;
          var rr = i % 2 ? r * .46 : r;
          if (i) c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
          else c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
      } else {
        // heart
        c.moveTo(0, r * .75);
        c.bezierCurveTo(-r * 1.3, -r * .2, -r * .5, -r, 0, -r * .35);
        c.bezierCurveTo(r * .5, -r, r * 1.3, -r * .2, 0, r * .75);
      }
      c.closePath();
      c.fill();
      c.strokeStyle = 'rgba(0,0,0,.22)';
      c.lineWidth = 2;
      c.stroke();
      c.restore();
    }

    return Milo.arcade(host, {
      id: 'spot-difference',
      w: W, h: H, bg: '#161a2a',
      stats: ['Score', 'Round', 'Found', 'Time', 'Best'],
      emo: '🔍',
      trackBest: true,
      start: {
        title: 'Spot the Difference',
        text: 'Five things are different between the two pictures. Click each one in either ' +
          'panel. A wrong click costs you three seconds, so look before you tap.',
        keys: ['Click a difference in either picture', 'H highlights one, once per round']
      },
      init: reset,

      onKey: function (g, e) {
        if (g.state !== 'play') return;
        var d = g.data;
        if (e.code === 'KeyH' && !d.usedHint && !d.between) {
          // A single hint per round: outline one difference you have not found yet.
          var left = d.diffs.filter(function (q) { return !q.found; });
          if (!left.length) return;
          d.usedHint = true;
          d.hint = { d: U.choice(left), t: 2 };
          g.score = Math.max(0, g.score - 100);
          g.set('Score', g.score);
          Milo.sound.blip();
        }
      },

      onPointer: function (g, type, px, py) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data;
        if (d.between > 0) return;

        // Either panel works — map the click into scene coordinates.
        var sx, sy, inPanel = false;
        if (px >= LX && px <= LX + PW && py >= PY && py <= PY + PH) {
          sx = px - LX; sy = py - PY; inPanel = true;
        } else if (px >= RX && px <= RX + PW && py >= PY && py <= PY + PH) {
          sx = px - RX; sy = py - PY; inPanel = true;
        }
        if (!inPanel) return;

        var hit = null;
        d.diffs.forEach(function (q) {
          if (q.found) return;
          if (U.dist(sx, sy, q.x, q.y) < q.r) hit = q;
        });

        if (hit) {
          hit.found = true;
          d.found++;
          g.score += 250;
          g.set('Score', g.score);
          g.set('Found', d.found + '/' + DIFFS);
          Milo.sound.coin();
          for (var i = 0; i < 14; i++) {
            var a = U.rand(0, Math.PI * 2);
            d.parts.push({
              x: px, y: py, vx: Math.cos(a) * 130, vy: Math.sin(a) * 130,
              life: .5, c: '#8ef0a8'
            });
          }
          if (d.found === DIFFS) {
            d.between = 1.2;
            // Time left rolls over, so a fast round makes the next one easier.
            g.score += 300 + Math.round(d.time) * 5;
            g.set('Score', g.score);
            Milo.sound.win();
          }
        } else {
          d.wrong++;
          d.time -= 3;
          d.marks.push({ x: px, y: py, life: .8 });
          Milo.sound.tone({ f: 150, d: .12, v: .05, type: 'square' });
        }
      },

      update: function (g, dt) {
        var d = g.data;
        var i;

        for (i = d.parts.length - 1; i >= 0; i--) {
          var pt = d.parts[i];
          pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vx *= .92; pt.vy *= .92; pt.life -= dt;
          if (pt.life <= 0) d.parts.splice(i, 1);
        }
        for (i = d.marks.length - 1; i >= 0; i--) {
          d.marks[i].life -= dt;
          if (d.marks[i].life <= 0) d.marks.splice(i, 1);
        }
        if (d.hint) { d.hint.t -= dt; if (d.hint.t <= 0) d.hint = null; }

        if (d.between > 0) {
          d.between -= dt;
          if (d.between <= 0) {
            d.level++;
            d.time = Math.min(75, d.time + 25);
            d.usedHint = false;
            newRound(g, d.level);
          }
          return;
        }

        d.time -= dt;
        g.set('Time', Math.max(0, Math.ceil(d.time)) + 's');
        if (d.time <= 0) {
          g.gameOver({
            emo: '🔍', title: 'Out of time',
            text: 'You cleared ' + (d.level - 1) + ' round' + (d.level - 1 === 1 ? '' : 's') +
              ' and found ' + d.found + ' of ' + DIFFS + ' on this one.',
            score: g.score
          });
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#1e2338'); bg.addColorStop(1, '#101322');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        [[LX, d.a], [RX, d.b]].forEach(function (pair) {
          var ox = pair[0], shapes = pair[1];
          c.save();
          c.fillStyle = '#f3f0e6';
          U.roundRect(c, ox, PY, PW, PH, 12); c.fill();
          U.roundRect(c, ox, PY, PW, PH, 12); c.clip();
          c.translate(ox, PY);

          // A faint paper texture keeps the panels from reading as flat white.
          c.fillStyle = 'rgba(0,0,0,.03)';
          for (var gx = 0; gx < PW; gx += 26) c.fillRect(gx, 0, 13, PH);

          shapes.forEach(function (s) { drawShape(c, s); });
          c.restore();

          c.strokeStyle = 'rgba(255,255,255,.16)';
          c.lineWidth = 2;
          U.roundRect(c, ox, PY, PW, PH, 12); c.stroke();
        });

        // Found differences get ringed in both panels at once.
        d.diffs.forEach(function (q) {
          if (!q.found) return;
          [LX, RX].forEach(function (ox) {
            c.strokeStyle = '#3aa860';
            c.lineWidth = 3.5;
            c.beginPath(); c.arc(ox + q.x, PY + q.y, q.r, 0, Math.PI * 2); c.stroke();
          });
        });

        if (d.hint) {
          var pulse = .4 + Math.sin(g.t * 9) * .3;
          [LX, RX].forEach(function (ox) {
            c.strokeStyle = 'rgba(230,170,60,' + pulse + ')';
            c.lineWidth = 4;
            c.setLineDash([7, 6]);
            c.beginPath(); c.arc(ox + d.hint.d.x, PY + d.hint.d.y, d.hint.d.r + 8, 0, Math.PI * 2); c.stroke();
            c.setLineDash([]);
          });
        }

        d.marks.forEach(function (m) {
          c.globalAlpha = m.life * 1.25;
          c.strokeStyle = '#e0553f';
          c.lineWidth = 3.5;
          c.beginPath();
          c.moveTo(m.x - 9, m.y - 9); c.lineTo(m.x + 9, m.y + 9);
          c.moveTo(m.x + 9, m.y - 9); c.lineTo(m.x - 9, m.y + 9);
          c.stroke();
          c.globalAlpha = 1;
        });

        d.parts.forEach(function (pt) {
          c.globalAlpha = Math.max(0, pt.life * 2);
          c.fillStyle = pt.c;
          c.fillRect(pt.x - 2.5, pt.y - 2.5, 5, 5);
        });
        c.globalAlpha = 1;

        // Five pips make the remaining count readable without reading the HUD.
        c.textAlign = 'center';
        for (var i = 0; i < DIFFS; i++) {
          var px = W / 2 - (DIFFS - 1) * 13 + i * 26;
          c.fillStyle = i < d.found ? '#8ef0a8' : 'rgba(255,255,255,.2)';
          c.beginPath(); c.arc(px, PY - 22, 7, 0, Math.PI * 2); c.fill();
        }

        // Timer bar turns red as it runs down.
        var frac = U.clamp(d.time / 75, 0, 1);
        c.fillStyle = 'rgba(255,255,255,.12)';
        U.roundRect(c, LX, H - 42, PW * 2 + GAP, 10, 5); c.fill();
        c.fillStyle = frac < .2 ? '#e0553f' : frac < .45 ? '#e8a44a' : '#4fc8d0';
        U.roundRect(c, LX, H - 42, (PW * 2 + GAP) * frac, 10, 5); c.fill();

        c.fillStyle = 'rgba(255,255,255,.5)';
        c.font = '600 12px Outfit, sans-serif';
        c.fillText(d.usedHint ? 'Hint used this round' : 'Press H for a hint (costs 100 points)',
          W / 2, H - 50);

        if (d.between > 0) {
          c.fillStyle = 'rgba(0,0,0,.5)';
          c.fillRect(0, H / 2 - 40, W, 80);
          c.fillStyle = '#8ef0a8';
          c.font = '700 30px Outfit, sans-serif';
          c.fillText('All five found! +' + (300 + Math.round(d.time) * 5), W / 2, H / 2 + 10);
        }
      }
    });
  }

  window.Milo.register({
    id: 'spot-difference', title: 'Spot the Difference', emo: '🔍', category: 'Casual',
    tagline: 'Five changes, sixty seconds',
    description: 'Two pictures side by side with exactly five differences between them, and a ' +
      'clock that does not wait. Something might have changed colour, changed shape, grown, ' +
      'shrunk, shuffled a little to one side, or simply gone — so there is no single thing to ' +
      'scan for. Click a difference in either picture and it gets ringed in both. Wrong guesses ' +
      'cost three seconds each. Every scene is generated fresh, so nobody can memorise them.',
    controls: ['Click a difference in either picture', 'H reveals one, once per round'],
    colors: ['#1e2338', '#4fc8d0'],
    tags: ['observation', 'casual', 'brain', 'timed'],
    mount: mount
  });
})();
