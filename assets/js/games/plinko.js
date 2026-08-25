/* Plinko — drop chips through the pegs and bank the multipliers. */
(function () {
  'use strict';
  var W = 620, H = 660, ROWS = 12;
  var SLOTS = [10, 4, 2, 1.2, 0.6, 0.3, 0.2, 0.3, 0.6, 1.2, 2, 4, 10];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.credits = 100;
      d.bet = 5;
      d.chips = [];
      d.pegs = [];
      d.flash = [];
      for (var r = 0; r < ROWS; r++) {
        var n = r + 3;
        for (var i = 0; i < n; i++) {
          d.pegs.push({
            x: W / 2 + (i - (n - 1) / 2) * 44,
            y: 110 + r * 40
          });
        }
      }
      d.best = 100;
      d.drops = 0;
      g.set('Credits', 100);
      g.set('Bet', 5);
      g.set('Drops', 0);
    }

    function drop(g, x) {
      var d = g.data;
      if (d.credits < d.bet) return;
      d.credits -= d.bet;
      g.set('Credits', Math.round(d.credits));
      d.chips.push({
        x: U.clamp(x, W / 2 - 60, W / 2 + 60), y: 60,
        vx: U.rand(-20, 20), vy: 0, r: 12, bet: d.bet
      });
      d.drops++;
      g.set('Drops', d.drops);
      Milo.sound.click();
    }

    function slotAt(x) {
      var w = W / SLOTS.length;
      return U.clamp(Math.floor(x / w), 0, SLOTS.length - 1);
    }

    return Milo.arcade(host, {
      id: 'plinko',
      w: W, h: H, bg: '#0f1030',
      stats: ['Credits', 'Bet', 'Drops'],
      emo: '🪙',
      trackBest: true,
      start: {
        title: 'Plinko',
        text: 'Drop a chip and watch it bounce down through the pegs. The slot it lands ' +
          'in multiplies your stake — the edges pay ten times, the middle barely pays at all.',
        keys: ['Click to drop', '↑ ↓ to change your bet']
      },
      init: reset,

      onKey: function (g, e) {
        var d = g.data;
        if (e.code === 'ArrowUp') { d.bet = Math.min(50, d.bet + 5); g.set('Bet', d.bet); }
        if (e.code === 'ArrowDown') { d.bet = Math.max(1, d.bet - 5); g.set('Bet', d.bet); }
        if (e.code === 'Space') drop(g, W / 2 + U.rand(-40, 40));
      },
      onPointer: function (g, type, x) { if (type === 'down') drop(g, x); },

      update: function (g, dt) {
        var d = g.data;
        for (var i = d.chips.length - 1; i >= 0; i--) {
          var ch = d.chips[i];
          ch.vy += 900 * dt;
          ch.x += ch.vx * dt;
          ch.y += ch.vy * dt;
          ch.vx *= Math.pow(0.75, dt);

          d.pegs.forEach(function (p) {
            var dist = U.dist(ch.x, ch.y, p.x, p.y);
            if (dist < ch.r + 6 && dist > 0.01) {
              var nx = (ch.x - p.x) / dist, ny = (ch.y - p.y) / dist;
              ch.x = p.x + nx * (ch.r + 6);
              ch.y = p.y + ny * (ch.r + 6);
              var dot = ch.vx * nx + ch.vy * ny;
              ch.vx = (ch.vx - 2 * dot * nx) * .55 + U.rand(-40, 40);
              ch.vy = (ch.vy - 2 * dot * ny) * .55;
              Milo.sound.tone({ f: 800 + Math.random() * 400, d: .03, v: .025, type: 'square' });
            }
          });

          if (ch.x < ch.r) { ch.x = ch.r; ch.vx = Math.abs(ch.vx); }
          if (ch.x > W - ch.r) { ch.x = W - ch.r; ch.vx = -Math.abs(ch.vx); }

          if (ch.y > H - 60) {
            var s = slotAt(ch.x);
            var won = ch.bet * SLOTS[s];
            d.credits += won;
            d.best = Math.max(d.best, d.credits);
            g.set('Credits', Math.round(d.credits));
            g.score = Math.round(d.best);
            Milo.store.setBest('plinko', g.score);
            d.flash.push({ slot: s, t: .8, amount: won });
            if (SLOTS[s] >= 2) Milo.sound.win(); else Milo.sound.tone({ f: 260, d: .1, v: .05, type: 'triangle' });
            d.chips.splice(i, 1);
          }
        }

        d.flash = d.flash.filter(function (f) { f.t -= dt; return f.t > 0; });

        if (d.credits < 1 && !d.chips.length) {
          g.gameOver({
            emo: '🪙', title: 'Out of credits',
            text: 'You peaked at ' + Math.round(d.best) + ' over ' + d.drops + ' drops.',
            score: Math.round(d.best)
          });
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#191a4a'); bg.addColorStop(1, '#0a0a20');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        c.fillStyle = '#c9d0f0';
        d.pegs.forEach(function (p) {
          c.beginPath(); c.arc(p.x, p.y, 5, 0, 7); c.fill();
        });

        var sw = W / SLOTS.length;
        SLOTS.forEach(function (m, i) {
          var hot = d.flash.filter(function (f) { return f.slot === i; })[0];
          var t = m >= 4 ? '#e5484d' : m >= 1.2 ? '#f59e0b' : '#3b4a8a';
          c.fillStyle = hot ? '#ffd257' : t;
          U.roundRect(c, i * sw + 2, H - 56, sw - 4, 46, 7); c.fill();
          c.fillStyle = hot ? '#2a1c00' : '#fff';
          c.font = '700 13px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(m + '×', i * sw + sw / 2, H - 27);
        });

        d.chips.forEach(function (ch) {
          c.fillStyle = '#ffd257';
          c.beginPath(); c.arc(ch.x, ch.y, ch.r, 0, 7); c.fill();
          c.fillStyle = 'rgba(0,0,0,.25)';
          c.beginPath(); c.arc(ch.x, ch.y, ch.r * .55, 0, 7); c.fill();
        });

        d.flash.forEach(function (f) {
          c.globalAlpha = f.t / .8;
          c.fillStyle = '#ffd257';
          c.font = '800 18px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText('+' + Math.round(f.amount), f.slot * sw + sw / 2, H - 70);
          c.globalAlpha = 1;
        });

        c.fillStyle = 'rgba(255,255,255,.5)';
        c.font = '600 12px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText('Click along the top to drop a chip · ↑ ↓ change your bet', W / 2, 34);
      }
    });
  }

  window.Milo.register({
    id: 'plinko', title: 'Plinko', emo: '🪙', category: 'Casual',
    tagline: 'Drop the chip, chase the edges',
    description: 'Chips bounce down through a triangle of pegs into slots that multiply ' +
      'your stake. The outer slots pay ten times, but almost everything drifts toward the ' +
      'middle where the multipliers are less than one — which is the whole tension. Raise ' +
      'your bet with the arrow keys and drop as many as your credits allow.',
    controls: ['Click to drop', '↑ ↓ bet'],
    colors: ['#0f1030', '#ffd257'],
    tags: ['physics', 'luck', 'relaxing', 'casual'],
    mount: mount
  });
})();
