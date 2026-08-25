/* Golf Solitaire — clear seven columns onto a single rising/falling pile. */
(function () {
  'use strict';
  var W = 820, H = 560, CW = 78, CH = 110, GAP = 16, FAN = 30;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util, C = Milo.cards;

    function reset(g) {
      var d = g.data;
      var deck = C.shuffled();
      d.cols = [];
      for (var i = 0; i < 7; i++) {
        var col = [];
        for (var j = 0; j < 5; j++) col.push(deck.pop());
        d.cols.push(col);
      }
      d.stock = deck;
      d.pile = [d.stock.pop()];
      d.left = 35;
      d.time = 0;
      d.round = (d.round || 0);
      d.won = false;
      g.set('Left', 35);
      g.set('Stock', d.stock.length);
      g.set('Time', '0:00');
    }

    function colXY(i) { return { x: (W - (7 * (CW + GAP) - GAP)) / 2 + i * (CW + GAP), y: 70 }; }
    function pileXY() { return { x: W / 2 - CW / 2, y: H - CH - 40 }; }
    function stockXY() { return { x: W / 2 - CW / 2 - CW - 40, y: H - CH - 40 }; }

    /** Playable if it is one rank above or below the pile top; no wrapping. */
    function playable(card, top) {
      return Math.abs(card.r - top.r) === 1;
    }

    function inBox(x, y, bx, by, bw, bh) {
      return x >= bx && x <= bx + bw && y >= by && y <= by + bh;
    }

    function finish(g, won) {
      var d = g.data;
      d.won = true;
      if (won) {
        g.win({
          emo: '⛳', title: 'Course cleared!',
          text: 'All 35 cards away in ' + U.time(d.time) + '.',
          score: Math.max(300, 4000 - Math.round(d.time) * 10 + d.stock.length * 60)
        });
      } else {
        g.gameOver({
          emo: '⛳', title: 'No moves left',
          text: d.left + ' card' + (d.left === 1 ? '' : 's') + ' still on the course.',
          score: (35 - d.left) * 40
        });
      }
    }

    function checkStuck(g) {
      var d = g.data;
      if (d.stock.length) return;
      var top = d.pile[d.pile.length - 1];
      var any = d.cols.some(function (col) {
        return col.length && playable(col[col.length - 1], top);
      });
      if (!any) finish(g, false);
    }

    return Milo.arcade(host, {
      id: 'golf-solitaire',
      w: W, h: H, bg: '#123d1f',
      stats: ['Left', 'Stock', 'Time'],
      emo: '⛳',
      start: {
        title: 'Golf Solitaire',
        text: 'Clear all 35 cards onto the pile. You can play any card that is exactly ' +
          'one rank above or below the top card — no wrapping around from King to Ace.',
        keys: ['Click a bottom card', 'Click the stock when stuck']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play' || g.data.won) return;
        var d = g.data;

        var s = stockXY();
        if (inBox(x, y, s.x, s.y, CW, CH)) {
          if (d.stock.length) {
            d.pile.push(d.stock.pop());
            g.set('Stock', d.stock.length);
            Milo.sound.click();
            checkStuck(g);
          }
          return;
        }

        var top = d.pile[d.pile.length - 1];
        for (var i = 0; i < 7; i++) {
          var col = d.cols[i];
          if (!col.length) continue;
          var p = colXY(i);
          var cy = p.y + (col.length - 1) * FAN;
          if (inBox(x, y, p.x, cy, CW, CH)) {
            var card = col[col.length - 1];
            if (playable(card, top)) {
              col.pop();
              d.pile.push(card);
              d.left--;
              g.set('Left', d.left);
              Milo.sound.tone({ f: 500 + (35 - d.left) * 8, d: .06, v: .06, type: 'triangle' });
              if (d.left === 0) { finish(g, true); return; }
              checkStuck(g);
            } else {
              Milo.sound.tone({ f: 150, d: .07, v: .05, type: 'square' });
            }
            return;
          }
        }
      },

      update: function (g, dt) {
        var d = g.data;
        if (d.won) return;
        d.time += dt;
        g.set('Time', U.time(d.time));
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#174a26'); bg.addColorStop(1, '#0b2a15');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        var top = d.pile[d.pile.length - 1];
        for (var i = 0; i < 7; i++) {
          var p = colXY(i), col = d.cols[i];
          if (!col.length) { C.slot(c, p.x, p.y, CW, CH); continue; }
          for (var k = 0; k < col.length; k++) {
            var isTop = k === col.length - 1;
            C.draw(c, col[k], p.x, p.y + k * FAN, CW, CH, {
              faceUp: true,
              hint: isTop && playable(col[k], top),
              dim: !isTop
            });
          }
        }

        var s = stockXY();
        if (d.stock.length) C.draw(c, d.stock[d.stock.length - 1], s.x, s.y, CW, CH, { faceUp: false });
        else C.slot(c, s.x, s.y, CW, CH, '×');

        var pp = pileXY();
        C.draw(c, top, pp.x, pp.y, CW, CH, { faceUp: true });

        c.fillStyle = 'rgba(255,255,255,.5)';
        c.font = '600 12px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText('Green outline = playable', W / 2, H - 12);
      }
    });
  }

  window.Milo.register({
    id: 'golf-solitaire', title: 'Golf Solitaire', emo: '⛳', category: 'Cards',
    tagline: 'One rank up or down, clear the course',
    description: 'Seven columns of five cards and a single waste pile. Play any exposed ' +
      'card that sits exactly one rank above or below the top of the pile — and unlike some ' +
      'versions, King does not wrap round to Ace. When you run dry, turn a card from the stock. ' +
      'Clearing all 35 is the hole in one.',
    controls: ['Click a bottom card', 'Click the stock'],
    colors: ['#123d1f', '#34d399'],
    tags: ['solitaire', 'cards', 'quick', 'patience'],
    mount: mount
  });
})();
