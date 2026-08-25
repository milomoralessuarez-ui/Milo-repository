/* Whack-a-Mole — 45 seconds, and some of them bite back. */
(function () {
  'use strict';
  var W = 700, H = 540;
  var COLS = 4, ROWS = 3, DURATION = 45;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function holeAt(i) {
      var x = i % COLS, y = (i / COLS) | 0;
      return {
        x: 110 + x * ((W - 220) / (COLS - 1)),
        y: 150 + y * ((H - 230) / (ROWS - 1))
      };
    }

    function reset(g) {
      var d = g.data;
      d.holes = [];
      for (var i = 0; i < COLS * ROWS; i++) {
        d.holes.push({ up: 0, kind: 'mole', timer: U.rand(.4, 2.4), hit: false, bonk: 0 });
      }
      d.time = DURATION;
      d.hits = 0;
      d.misses = 0;
      d.combo = 0;
      d.parts = [];
      d.pop = 1.9;
      g.set('Score', 0);
      g.set('Time', DURATION);
      g.set('Combo', 0);
    }

    return Milo.arcade(host, {
      id: 'whack-a-mole',
      w: W, h: H, bg: '#2a1f12',
      stats: ['Score', 'Time', 'Combo'],
      emo: '🔨',
      start: {
        title: 'Whack-a-Mole',
        text: 'Forty-five seconds. Hit the brown moles, leave the spiky green ones ' +
          'alone — they cost you points and reset your combo.',
        keys: ['Click or tap a mole']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data, got = false;
        d.holes.forEach(function (h, i) {
          if (h.up < .35 || h.hit) return;
          var p = holeAt(i);
          if (U.dist(x, y, p.x, p.y - 18 * h.up) < 46) {
            got = true;
            h.hit = true;
            h.bonk = .25;
            if (h.kind === 'mole') {
              d.hits++;
              d.combo++;
              var pts = 10 + Math.min(40, d.combo * 2);
              g.score += pts;
              Milo.sound.coin();
              burst(d, p.x, p.y - 20, '#ffd257');
            } else {
              d.combo = 0;
              g.score = Math.max(0, g.score - 25);
              Milo.sound.hit();
              burst(d, p.x, p.y - 20, '#fb7185');
            }
            g.set('Score', U.fmt(g.score));
            g.set('Combo', d.combo);
          }
        });
        if (!got) {
          d.combo = 0;
          d.misses++;
          g.set('Combo', 0);
          Milo.sound.click();
        }
      },

      update: function (g, dt) {
        var d = g.data;
        d.time -= dt;
        g.set('Time', Math.max(0, Math.ceil(d.time)));
        if (d.time <= 0) {
          g.gameOver({
            emo: '⏰', title: 'Time!',
            text: d.hits + ' moles bopped, ' + d.misses + ' swings missed.'
          });
          return;
        }

        // Moles come faster as the round goes on.
        d.pop = 1.9 - (1 - d.time / DURATION) * 1.15;

        d.holes.forEach(function (h) {
          h.timer -= dt;
          h.bonk = Math.max(0, h.bonk - dt);
          if (h.timer <= 0) {
            if (h.up > 0) {
              h.up = Math.max(0, h.up - dt * 4);
              if (h.up <= 0) { h.timer = U.rand(.25, d.pop); h.hit = false; }
            } else {
              h.kind = Math.random() < .24 ? 'spike' : 'mole';
              h.up = 0.001;
              h.timer = U.rand(.55, 1.15);
              h.rising = true;
            }
          } else if (h.rising) {
            h.up = Math.min(1, h.up + dt * 5);
            if (h.up >= 1) h.rising = false;
          } else if (h.hit) {
            h.up = Math.max(0, h.up - dt * 6);
          }
        });

        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 700 * dt; p.life -= dt;
          return p.life > 0;
        });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#4a7c34'); sky.addColorStop(1, '#2f5220');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);

        // grass tufts
        c.strokeStyle = 'rgba(255,255,255,.06)'; c.lineWidth = 2;
        c.beginPath();
        for (var i = 0; i < 60; i++) {
          var gx = U.hash2(i, 1, 7) * W, gy = U.hash2(i, 2, 7) * H;
          c.moveTo(gx, gy); c.lineTo(gx + 3, gy - 8);
        }
        c.stroke();

        d.holes.forEach(function (h, i) {
          var p = holeAt(i);
          c.fillStyle = '#241a10';
          c.beginPath(); c.ellipse(p.x, p.y, 50, 20, 0, 0, 7); c.fill();
          c.fillStyle = '#12100c';
          c.beginPath(); c.ellipse(p.x, p.y - 2, 44, 16, 0, 0, 7); c.fill();

          if (h.up <= 0) return;
          var rise = h.up * 46;
          var squash = h.bonk > 0 ? 1 - h.bonk : 1;
          c.save();
          c.beginPath();
          c.rect(p.x - 46, p.y - 90, 92, 90 - 2);
          c.clip();
          c.translate(p.x, p.y - rise);
          c.scale(1, squash);

          if (h.kind === 'mole') {
            c.fillStyle = '#8b5a3c';
            c.beginPath(); c.ellipse(0, 0, 32, 34, 0, 0, 7); c.fill();
            c.fillStyle = '#c9906c';
            c.beginPath(); c.ellipse(0, 10, 18, 15, 0, 0, 7); c.fill();
            c.fillStyle = '#1a1008';
            c.beginPath(); c.arc(-11, -7, 4, 0, 7); c.arc(11, -7, 4, 0, 7); c.fill();
            c.fillStyle = '#f8b8c8';
            c.beginPath(); c.ellipse(0, 6, 6, 4.5, 0, 0, 7); c.fill();
          } else {
            c.fillStyle = '#3fae5f';
            c.beginPath();
            for (var s = 0; s < 12; s++) {
              var a = s / 12 * 6.283;
              var r = s % 2 ? 24 : 36;
              c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            }
            c.closePath(); c.fill();
            c.fillStyle = '#0f2b16';
            c.beginPath(); c.arc(-9, -5, 4.5, 0, 7); c.arc(9, -5, 4.5, 0, 7); c.fill();
            c.strokeStyle = '#0f2b16'; c.lineWidth = 2.5; c.lineCap = 'round';
            c.beginPath(); c.arc(0, 12, 8, Math.PI + .3, -.3); c.stroke();
          }
          c.restore();
        });

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.beginPath(); c.arc(p.x, p.y, 4, 0, 7); c.fill();
        });
        c.globalAlpha = 1;

        if (d.time < 11) {
          c.fillStyle = d.time < 6 ? '#fb7185' : '#ffd257';
          c.font = '800 40px Outfit, sans-serif';
          c.textAlign = 'center';
          c.globalAlpha = .3 + Math.abs(Math.sin(g.t * 4)) * .5;
          c.fillText(Math.ceil(d.time), W / 2, 74);
          c.globalAlpha = 1;
        }
      }
    });

    function burst(d, x, y, col) {
      for (var i = 0; i < 14; i++) {
        var a = Math.random() * 6.28, s = U.rand(60, 240);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, life: U.rand(.3, .6), max: .6, col: col });
      }
    }
  }

  window.Milo.register({
    id: 'whack-a-mole', title: 'Whack-a-Mole', emo: '🔨', category: 'Casual',
    tagline: 'Bop the moles, dodge the spikes',
    description: 'Forty-five seconds of moles popping out of holes. Every brown mole ' +
      'you hit builds a combo worth more points, but the spiky green ones cost you 25 ' +
      'and reset the combo — as does swinging at nothing. They pop faster as the clock runs down.',
    controls: ['Click', 'Tap'],
    colors: ['#8b5a3c', '#4a7c34'],
    tags: ['reflex', 'timed', 'clicking', 'casual'],
    mount: mount
  });
})();
