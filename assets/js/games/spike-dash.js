/* Spike Dash — one-button rhythm runner; spike bars on the beat, 3 hearts. */
(function () {
  'use strict';
  var W = 800, H = 460, GY = 372, PXS = 190, PH = 15; // PH = player half-size

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var attempts = 0; // per-session, survives restarts

    // Patterns: arrays of [beatOffset, type]. Types: s=spike, s2=double,
    // s3=triple, b=block. tier gates when they start appearing.
    var PATTERNS = [
      { tier: 0, ev: [] },
      { tier: 0, ev: [[2, 's']] },
      { tier: 0, ev: [[1, 's'], [3, 's']] },
      { tier: 1, ev: [[2, 's2']] },
      { tier: 1, ev: [[1, 's'], [3, 's2']] },
      { tier: 1, ev: [[2, 'b']] },
      { tier: 2, ev: [[1, 's'], [2, 'b'], [3, 's']] },
      { tier: 2, ev: [[0.5, 's'], [2, 's2']] },
      { tier: 2, ev: [[1, 'b'], [3, 's2']] },
      { tier: 3, ev: [[2, 's3']] },
      { tier: 3, ev: [[1, 's2'], [3, 's2']] },
      { tier: 3, ev: [[0.5, 's'], [2, 's'], [3.5, 's']] }
    ];

    function reset(g) {
      var d = g.data;
      attempts++;
      d.px = 0;
      d.y = GY - PH;
      d.vy = 0;
      d.onG = true;
      d.rot = 0;
      d.hearts = 3;
      d.inv = 0;
      d.jumpBuf = 0;
      d.obs = [];
      d.nextX = 700;
      d.bars = 0;
      d.beat = 0;
      d.beatT = 0;
      d.pulse = 0;
      d.parts = [];
      d.texts = [];
      d.shake = 0;
      d.flash = 0;
      d.dead = false;
      d.dieT = 0;
      g.set('Score', 0);
      g.set('Hearts', '♥♥♥');
      g.set('Attempt', attempts);
      g.set('Best', U.fmt(g.best));
    }

    function speedNow(d) { return 330 + Math.min(190, d.bars * 4); }
    function bpmNow(d) { return 112 + Math.min(50, d.bars); }

    function spawnBar(d) {
      var tier = Math.min(3, Math.floor(d.bars / 7));
      var pool = PATTERNS.filter(function (p) { return p.tier <= tier; });
      // early bars stay gentle
      var pat = d.bars < 2 ? PATTERNS[1] : U.choice(pool);
      var beatPx = speedNow(d) * (60 / bpmNow(d));
      for (var i = 0; i < pat.ev.length; i++) {
        var x = d.nextX + pat.ev[i][0] * beatPx, t = pat.ev[i][1];
        if (t === 's') d.obs.push({ x: x, type: 'spike', n: 1 });
        else if (t === 's2') d.obs.push({ x: x, type: 'spike', n: 2 });
        else if (t === 's3') d.obs.push({ x: x, type: 'spike', n: 3 });
        else if (t === 'b') d.obs.push({ x: x, type: 'block', w: beatPx * .8, h: 34 });
      }
      d.nextX += 4 * beatPx;
      d.bars++;
    }

    function tryJump(d) {
      if (d.onG) {
        d.vy = -560;
        d.onG = false;
        d.jumpBuf = 0;
        Milo.sound.tone({ f: 340, f2: 700, d: .09, v: .08, type: 'square' });
        return true;
      }
      d.jumpBuf = .12;
      return false;
    }

    function burst(d, x, y, cols, n) {
      for (var k = 0; k < n; k++) {
        var a = Math.random() * 6.283, s = U.rand(60, 320);
        d.parts.push({
          x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60,
          life: U.rand(.35, .8), max: .8, col: U.choice(cols)
        });
      }
    }

    function hitPlayer(g) {
      var d = g.data;
      d.hearts--;
      d.shake = 12;
      d.flash = .35;
      burst(d, PXS, d.y, ['#facc15', '#f472b6', '#ffffff'], 22);
      Milo.sound.hit();
      g.set('Hearts', d.hearts > 0 ? new Array(d.hearts + 1).join('♥') : '—');
      if (d.hearts <= 0) {
        d.dead = true;
        d.dieT = .8;
        Milo.sound.explode();
        return;
      }
      // practice-friendly respawn: clear the road ahead, brief ghost mode
      d.inv = 1.6;
      d.vy = 0;
      d.y = GY - PH;
      d.onG = true;
      d.rot = 0;
      for (var k = d.obs.length - 1; k >= 0; k--) {
        if (d.obs[k].x > d.px - 80 && d.obs[k].x < d.px + 560) d.obs.splice(k, 1);
      }
      d.texts.push({ x: PXS, y: d.y - 54, t: '-1 ♥', life: .9, max: .9, col: '#f472b6' });
    }

    return Milo.arcade(host, {
      id: 'spike-dash',
      w: W, h: H, bg: '#0b0612',
      stats: ['Score', 'Hearts', 'Attempt', 'Best'],
      emo: '🔺',
      start: {
        title: 'Spike Dash',
        text: 'The cube runs itself — you only jump. Spikes arrive in four-beat bars ' +
          'that follow the pulse, so listen as much as you look. Three hearts per ' +
          'run, and losing one respawns you on the spot with the road cleared.',
        keys: ['Space / Click / Tap']
      },
      init: reset,
      onPointer: function (g, type) { if (type === 'down' && !g.data.dead) tryJump(g.data); },
      onKey: function (g, e) {
        if ((e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') && !g.data.dead) tryJump(g.data);
      },

      update: function (g, dt) {
        var d = g.data, k;
        d.shake = Math.max(0, d.shake - dt * 40);
        d.flash = Math.max(0, d.flash - dt * 2.4);
        d.pulse = Math.max(0, d.pulse - dt * 3);

        if (d.dead) {
          d.dieT -= dt;
          cool(d, dt);
          if (d.dieT <= 0) {
            g.gameOver({
              text: 'Attempt ' + attempts + ' ended at ' + U.fmt(Math.floor(d.px / 10)) +
                ' m, bar ' + d.bars + '.'
            });
          }
          return;
        }

        var v = speedNow(d);
        d.px += v * dt;

        // metronome
        var beatSec = 60 / bpmNow(d);
        d.beatT += dt;
        while (d.beatT >= beatSec) {
          d.beatT -= beatSec;
          d.beat++;
          if (d.beat % 4 === 0) {
            Milo.sound.tone({ f: 82, f2: 44, d: .12, v: .1, type: 'sine' });
            d.pulse = 1;
          } else {
            Milo.sound.tone({ f: 660, d: .02, v: .018, type: 'square' });
          }
        }

        // physics
        var prevBot = d.y + PH;
        d.vy += 1500 * dt;
        d.y += d.vy * dt;
        var support = GY;
        for (k = 0; k < d.obs.length; k++) {
          var o = d.obs[k];
          if (o.type !== 'block') continue;
          var ox = o.x - d.px + PXS;
          if (PXS + PH - 4 > ox - o.w / 2 && PXS - PH + 4 < ox + o.w / 2) {
            var top = GY - o.h;
            if (prevBot <= top + 6 && d.vy >= 0) support = Math.min(support, top);
            else if (d.y + PH > top + 10 && d.inv <= 0) {
              // ran into the block face
              hitPlayer(g);
              if (d.dead) { cool(d, dt); return; }
            }
          }
        }
        if (d.y + PH >= support) {
          if (!d.onG) {
            d.onG = true;
            d.rot = 0;
            burst(d, PXS, support, ['#facc15'], 4);
            if (d.jumpBuf > 0) { d.y = support - PH; tryJump(d); }
          }
          d.y = support - PH;
          if (d.onG) d.vy = 0;
        } else if (d.onG && d.y + PH < support - 4) {
          d.onG = false;
        }
        if (!d.onG) d.rot += 4.4 * dt;
        d.jumpBuf = Math.max(0, d.jumpBuf - dt);
        d.inv = Math.max(0, d.inv - dt);

        // spikes
        if (d.inv <= 0) {
          for (k = 0; k < d.obs.length; k++) {
            var s = d.obs[k];
            if (s.type !== 'spike') continue;
            var sx = s.x - d.px + PXS;
            var halfW = s.n * 15 - 6;
            if (Math.abs(PXS - sx) < halfW + PH - 6 && d.y + PH > GY - 20) {
              hitPlayer(g);
              if (d.dead) { cool(d, dt); return; }
              break;
            }
          }
        }

        // keep bars stocked, drop old obstacles
        while (d.nextX < d.px + W + 300) spawnBar(d);
        for (k = d.obs.length - 1; k >= 0; k--) {
          if (d.obs[k].x < d.px - 300) d.obs.splice(k, 1);
        }

        // ground slide sparks
        if (d.onG && Math.random() < .5) {
          d.parts.push({
            x: PXS - PH, y: GY - 2, vx: U.rand(-220, -120), vy: U.rand(-90, -20),
            life: .25, max: .25, col: Math.random() < .5 ? '#facc15' : '#f472b6'
          });
        }

        cool(d, dt);
        g.score = Math.floor(d.px / 10);
        g.set('Score', U.fmt(g.score));
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, k, x;
        c.fillStyle = '#0b0612'; c.fillRect(0, 0, W, H);

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        // perspective grid floor glow, pulsing on the bar
        var gl = .12 + d.pulse * .25;
        c.strokeStyle = 'rgba(244,114,182,' + gl + ')';
        c.lineWidth = 1.5;
        for (k = 0; k < 9; k++) {
          var gyy = GY + 8 + k * k * 1.6;
          c.beginPath(); c.moveTo(0, gyy); c.lineTo(W, gyy); c.stroke();
        }
        var off = (d.px * 1.2) % 90;
        for (x = -off; x < W + 90; x += 90) {
          c.beginPath(); c.moveTo(x, GY + 8); c.lineTo((x - W / 2) * 2.1 + W / 2, H); c.stroke();
        }

        // beat markers floating above the horizon
        var beatPx = speedNow(d) * (60 / bpmNow(d));
        c.fillStyle = 'rgba(250,204,21,.2)';
        for (k = 0; k < d.obs.length + 40; k++) {
          var bx = (Math.floor(d.px / beatPx) + k - 2) * beatPx - d.px + PXS;
          if (bx < -20) continue;
          if (bx > W + 20) break;
          var isBar = ((Math.floor(d.px / beatPx) + k - 2) % 4 + 4) % 4 === 0;
          c.fillRect(bx - 1, GY + 4, isBar ? 3 : 1.5, isBar ? 10 : 5);
        }

        // ground line
        c.shadowColor = '#f472b6'; c.shadowBlur = 10 + d.pulse * 14;
        c.strokeStyle = '#f472b6'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(0, GY); c.lineTo(W, GY); c.stroke();
        c.shadowBlur = 0;

        // obstacles
        for (k = 0; k < d.obs.length; k++) {
          var o = d.obs[k];
          var ox = o.x - d.px + PXS;
          if (ox < -120 || ox > W + 120) continue;
          if (o.type === 'spike') {
            c.shadowColor = '#facc15'; c.shadowBlur = 10;
            c.fillStyle = '#facc15';
            for (var n = 0; n < o.n; n++) {
              var cx = ox + (n - (o.n - 1) / 2) * 30;
              c.beginPath();
              c.moveTo(cx - 15, GY);
              c.lineTo(cx, GY - 32);
              c.lineTo(cx + 15, GY);
              c.closePath(); c.fill();
            }
            c.shadowBlur = 0;
            c.fillStyle = 'rgba(11,6,18,.55)';
            for (n = 0; n < o.n; n++) {
              var cx2 = ox + (n - (o.n - 1) / 2) * 30;
              c.beginPath();
              c.moveTo(cx2 - 6, GY); c.lineTo(cx2, GY - 14); c.lineTo(cx2 + 6, GY);
              c.closePath(); c.fill();
            }
          } else {
            c.shadowColor = '#c084fc'; c.shadowBlur = 10;
            c.fillStyle = '#7e22ce';
            c.fillRect(ox - o.w / 2, GY - o.h, o.w, o.h);
            c.shadowBlur = 0;
            c.fillStyle = '#c084fc';
            c.fillRect(ox - o.w / 2, GY - o.h, o.w, 4);
          }
        }

        // particles
        for (k = 0; k < d.parts.length; k++) {
          var p = d.parts[k];
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - 2.5, p.y - 2.5, 5, 5);
        }
        c.globalAlpha = 1;

        // the cube
        if (!d.dead) {
          c.save();
          c.translate(PXS, d.y);
          c.rotate(d.rot);
          if (d.inv > 0) c.globalAlpha = Math.sin(g.t * 26) > 0 ? .35 : .85;
          c.shadowColor = '#facc15'; c.shadowBlur = 16;
          c.fillStyle = '#facc15';
          U.roundRect(c, -PH, -PH, PH * 2, PH * 2, 5); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = '#0b0612';
          c.fillRect(-8, -6, 6, 6);
          c.fillRect(3, -6, 6, 6);
          c.fillRect(-6, 5, 12, 3);
          c.restore();
          c.globalAlpha = 1;
        }

        // floating texts
        c.font = '800 17px Outfit, sans-serif';
        c.textAlign = 'center';
        for (k = 0; k < d.texts.length; k++) {
          var t = d.texts[k];
          c.globalAlpha = Math.max(0, t.life / t.max);
          c.fillStyle = t.col;
          c.fillText(t.t, t.x, t.y);
        }
        c.globalAlpha = 1;
        c.restore();

        if (d.flash > 0) {
          c.fillStyle = 'rgba(244,114,182,' + d.flash * .3 + ')';
          c.fillRect(0, 0, W, H);
        }
      }
    });

    function cool(d, dt) {
      var k;
      for (k = d.parts.length - 1; k >= 0; k--) {
        var p = d.parts[k];
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; p.life -= dt;
        if (p.life <= 0) d.parts.splice(k, 1);
      }
      for (k = d.texts.length - 1; k >= 0; k--) {
        d.texts[k].y -= 34 * dt; d.texts[k].life -= dt;
        if (d.texts[k].life <= 0) d.texts.splice(k, 1);
      }
    }
  }

  window.Milo.register({
    id: 'spike-dash', title: 'Spike Dash', emo: '🔺', category: 'Arcade',
    tagline: 'Jump the spike bars on the beat',
    description: 'An auto-running cube and one jump button. Spikes and purple blocks ' +
      'are laid out in four-beat musical bars that land on the metronome you can hear ' +
      'ticking, so the reliable way through a fast section is to jump on the beat ' +
      'rather than by eye. You get three hearts a run — losing one respawns you on the ' +
      'spot with the next stretch swept clean — and the session attempt counter keeps ' +
      'honest score of your practice. Tempo and pattern difficulty climb every seven bars.',
    controls: ['Space', 'Click', 'Tap'],
    colors: ['#18181b', '#facc15'],
    tags: ['rhythm', 'one button', 'endless', 'runner', 'reflex'],
    mount: mount
  });
})();
