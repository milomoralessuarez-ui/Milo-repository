/* Space Trader — buy low, sell high, don't get robbed. */
(function () {
  'use strict';
  var W = 880, H = 580;
  var GOODS = ['Ore', 'Water', 'Spice', 'Tech', 'Medicine'];
  var PORTS = ['Ceres', 'Titan', 'Vesta', 'Europa', 'Rhea'];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.credits = 1000;
      d.hold = [0, 0, 0, 0, 0];
      d.capacity = 40;
      d.port = 0;
      d.day = 1;
      d.days = 40;
      d.fuel = 100;
      d.prices = [];
      for (var p = 0; p < PORTS.length; p++) d.prices.push(genPrices(p));
      d.msg = 'Buy low here, sell high somewhere else';
      d.sel = 0;
      g.set('Credits', 1000);
      g.set('Day', '1/40');
      g.set('Hold', '0/40');
    }

    function genPrices(port) {
      var base = [40, 20, 90, 160, 120];
      return base.map(function (b, i) {
        // Each port skews some goods cheap and others dear.
        var bias = 1 + Math.sin((port + 1) * (i + 2)) * 0.35;
        return Math.max(5, Math.round(b * bias * U.rand(0.7, 1.35)));
      });
    }

    function holdUsed(d) {
      return d.hold.reduce(function (a, b) { return a + b; }, 0);
    }

    function travel(g, to) {
      var d = g.data;
      if (to === d.port) return;
      var cost = 10 + Math.abs(to - d.port) * 6;
      if (d.fuel < cost) { d.msg = 'Not enough fuel for that jump'; return; }
      d.fuel -= cost;
      d.port = to;
      d.day++;
      g.set('Day', d.day + '/' + d.days);
      // Prices drift while you travel.
      d.prices = d.prices.map(function (_, p) { return genPrices(p); });

      var event = Math.random();
      if (event < 0.13 && holdUsed(d) > 0) {
        var i = d.hold.findIndex(function (v) { return v > 0; });
        var lost = Math.ceil(d.hold[i] * U.rand(0.2, 0.5));
        d.hold[i] -= lost;
        d.msg = 'Pirates! You lost ' + lost + ' ' + GOODS[i] + '.';
        Milo.sound.hit();
      } else if (event < 0.24) {
        var boom = U.randInt(0, GOODS.length - 1);
        d.prices[d.port][boom] = Math.round(d.prices[d.port][boom] * 2.1);
        d.msg = 'Shortage on ' + PORTS[d.port] + ' — ' + GOODS[boom] + ' is way up.';
        Milo.sound.powerup();
      } else if (event < 0.32) {
        var bonus = U.randInt(60, 200);
        d.credits += bonus;
        d.msg = 'Salvage recovered — ' + bonus + ' credits.';
        Milo.sound.coin();
      } else {
        d.msg = 'Docked at ' + PORTS[d.port] + '.';
        Milo.sound.click();
      }
      g.set('Credits', Math.round(d.credits));
      g.set('Hold', holdUsed(d) + '/' + d.capacity);

      if (d.day > d.days) {
        var net = Math.round(d.credits);
        if (net >= 5000) g.win({ emo: '🚀', title: 'Retired rich', text: net + ' credits banked.', score: net });
        else g.gameOver({ emo: '🚀', title: 'Contract over', text: 'You finished with ' + net + ' credits.', score: net });
      }
    }

    function trade(g, i, qty) {
      var d = g.data;
      var price = d.prices[d.port][i];
      if (qty > 0) {
        var room = d.capacity - holdUsed(d);
        qty = Math.min(qty, room, Math.floor(d.credits / price));
        if (qty <= 0) { d.msg = room <= 0 ? 'Hold is full' : 'Not enough credits'; return; }
        d.credits -= qty * price;
        d.hold[i] += qty;
        d.msg = 'Bought ' + qty + ' ' + GOODS[i] + ' at ' + price + '.';
      } else {
        qty = Math.min(-qty, d.hold[i]);
        if (qty <= 0) { d.msg = 'Nothing to sell'; return; }
        d.credits += qty * price;
        d.hold[i] -= qty;
        d.msg = 'Sold ' + qty + ' ' + GOODS[i] + ' at ' + price + '.';
      }
      Milo.sound.coin();
      g.set('Credits', Math.round(d.credits));
      g.set('Hold', holdUsed(d) + '/' + d.capacity);
      g.score = Math.round(d.credits);
    }

    return Milo.arcade(host, {
      id: 'space-trader',
      w: W, h: H, bg: '#0a0d24',
      stats: ['Credits', 'Day', 'Hold'],
      emo: '🚀',
      start: {
        title: 'Space Trader',
        text: 'Forty days to turn 1,000 credits into a fortune. Every port prices the five ' +
          'goods differently and prices shift every jump. Watch your fuel and mind the pirates.',
        keys: ['Click to buy, sell and travel']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data;

        for (var i = 0; i < GOODS.length; i++) {
          var ry = 150 + i * 54;
          if (y < ry || y > ry + 44) continue;
          if (x > 430 && x < 500) { trade(g, i, 1); return; }
          if (x > 508 && x < 590) { trade(g, i, 10); return; }
          if (x > 600 && x < 670) { trade(g, i, -1); return; }
          if (x > 678 && x < 770) { trade(g, i, -10); return; }
        }
        for (var p = 0; p < PORTS.length; p++) {
          var bx = 40 + p * 160;
          if (x > bx && x < bx + 150 && y > H - 90 && y < H - 34) { travel(g, p); return; }
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#121a44'); bg.addColorStop(1, '#06081a');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);
        for (var s = 0; s < 60; s++) {
          c.fillStyle = 'rgba(200,215,255,.45)';
          c.fillRect(U.hash2(s, 1, 5) * W, U.hash2(s, 2, 5) * H, 1.5, 1.5);
        }

        c.fillStyle = '#fff';
        c.font = '800 26px Outfit, sans-serif';
        c.textAlign = 'left';
        c.fillText('Port of ' + PORTS[d.port], 40, 60);
        c.fillStyle = 'rgba(255,255,255,.6)';
        c.font = '600 14px Outfit, sans-serif';
        c.fillText(d.msg, 40, 88);

        c.fillStyle = 'rgba(255,255,255,.45)';
        c.font = '700 12px Outfit, sans-serif';
        c.fillText('GOOD', 44, 138);
        c.fillText('PRICE', 250, 138);
        c.fillText('HELD', 340, 138);
        c.fillText('BUY', 452, 138);
        c.fillText('SELL', 620, 138);

        GOODS.forEach(function (name, i) {
          var ry = 150 + i * 54;
          c.fillStyle = 'rgba(255,255,255,.05)';
          U.roundRect(c, 36, ry, 740, 44, 8); c.fill();
          c.fillStyle = '#dfe5ff';
          c.font = '700 16px Outfit, sans-serif';
          c.fillText(name, 44, ry + 28);
          var price = d.prices[d.port][i];
          var avg = d.prices.reduce(function (a, p) { return a + p[i]; }, 0) / PORTS.length;
          c.fillStyle = price < avg * .85 ? '#34d399' : price > avg * 1.15 ? '#fb7185' : '#dfe5ff';
          c.fillText(String(price), 250, ry + 28);
          c.fillStyle = '#dfe5ff';
          c.fillText(String(d.hold[i]), 340, ry + 28);

          [['+1', 430, 70], ['+10', 508, 82], ['−1', 600, 70], ['−10', 678, 92]].forEach(function (b, k) {
            c.fillStyle = k < 2 ? 'rgba(52,211,153,.22)' : 'rgba(251,113,133,.22)';
            U.roundRect(c, b[1], ry + 6, b[2], 32, 7); c.fill();
            c.fillStyle = k < 2 ? '#34d399' : '#fb7185';
            c.font = '700 14px Outfit, sans-serif';
            c.textAlign = 'center';
            c.fillText(b[0], b[1] + b[2] / 2, ry + 28);
            c.textAlign = 'left';
          });
        });

        c.fillStyle = 'rgba(255,255,255,.45)';
        c.font = '700 12px Outfit, sans-serif';
        c.fillText('TRAVEL  ·  fuel ' + Math.round(d.fuel), 40, H - 100);
        PORTS.forEach(function (name, p) {
          var bx = 40 + p * 160;
          var here = p === d.port;
          c.fillStyle = here ? 'rgba(255,255,255,.10)' : '#22d3ee';
          U.roundRect(c, bx, H - 90, 150, 56, 10); c.fill();
          c.fillStyle = here ? 'rgba(255,255,255,.4)' : '#062a33';
          c.font = '700 15px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(here ? name + ' (here)' : name, bx + 75, H - 60);
          if (!here) {
            c.font = '600 11px Outfit, sans-serif';
            c.fillText('fuel ' + (10 + Math.abs(p - d.port) * 6), bx + 75, H - 44);
          }
          c.textAlign = 'left';
        });
      }
    });
  }

  window.Milo.register({
    id: 'space-trader', title: 'Space Trader', emo: '🚀', category: 'Strategy',
    tagline: 'Buy low on one moon, sell high on another',
    description: 'Forty days, five ports and 1,000 credits. Each port prices the same five ' +
      'goods differently and every jump reshuffles them, so the game is spotting a spread ' +
      'and having the hold space to exploit it. Green prices are below the going rate, red ' +
      'above. Jumps cost fuel, and pirates occasionally take a cut of your cargo.',
    controls: ['Click to buy, sell, travel'],
    colors: ['#0a0d24', '#22d3ee'],
    scoreLabel: 'credits',
    tags: ['trading', 'economy', 'strategy', 'sim'],
    mount: mount
  });
})();
