/* Pyramid — pair cards that add up to 13 and dismantle the pyramid. */
(function () {
  'use strict';
  var W = 880, H = 640, CW = 74, CH = 104, ROWS = 7;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util, C = Milo.cards;

    function reset(g) {
      var d = g.data;
      var deck = C.shuffled();
      d.pyr = [];
      for (var r = 0; r < ROWS; r++) {
        var row = [];
        for (var i = 0; i <= r; i++) row.push({ card: deck.pop(), gone: false });
        d.pyr.push(row);
      }
      d.stock = deck;
      d.waste = [];
      d.sel = null;
      d.cleared = 0;
      d.time = 0;
      d.passes = 2;
      d.won = false;
      d.warn = null;
      g.set('Cleared', '0/28');
      g.set('Time', '0:00');
      g.set('Passes', 2);
    }

    function cellXY(r, i) {
      var rowW = (r + 1) * CW - r * (CW * 0.42);
      var x0 = (W - rowW) / 2;
      return { x: x0 + i * (CW * 0.58), y: 20 + r * (CH * 0.52) };
    }

    /** A pyramid card is playable only when nothing rests on top of it. */
    function free(d, r, i) {
      var cell = d.pyr[r][i];
      if (cell.gone) return false;
      if (r === ROWS - 1) return true;
      return d.pyr[r + 1][i].gone && d.pyr[r + 1][i + 1].gone;
    }

    function rankValue(c) { return c.r + 1; }   // A=1 … K=13

    function remove(g, a, b) {
      var d = g.data;
      [a, b].forEach(function (ref) {
        if (!ref) return;
        if (ref.where === 'pyr') { d.pyr[ref.r][ref.i].gone = true; d.cleared++; }
        else if (ref.where === 'waste') d.waste.pop();
        else if (ref.where === 'stock') d.stock.pop();
      });
      g.set('Cleared', d.cleared + '/28');
      Milo.sound.coin();
      d.sel = null;
      if (d.cleared === 28 && !d.won) {
        d.won = true;
        g.win({
          emo: '▲', title: 'Pyramid cleared!',
          text: 'Done in ' + U.time(d.time) + ' with ' + d.passes + ' pass' +
            (d.passes === 1 ? '' : 'es') + ' to spare.',
          score: Math.max(200, 5000 - Math.round(d.time) * 12 + d.passes * 400)
        });
      }
    }

    function cardAt(d, ref) {
      if (ref.where === 'pyr') return d.pyr[ref.r][ref.i].card;
      if (ref.where === 'waste') return d.waste[d.waste.length - 1];
      return null;
    }

    function pick(g, ref) {
      var d = g.data;
      var card = cardAt(d, ref);
      if (!card) return;
      if (rankValue(card) === 13) { remove(g, ref, null); return; }   // a King goes alone
      if (!d.sel) { d.sel = ref; Milo.sound.blip(); return; }

      var prev = cardAt(d, d.sel);
      if (d.sel.where === ref.where && d.sel.r === ref.r && d.sel.i === ref.i) { d.sel = null; return; }
      if (prev && rankValue(prev) + rankValue(card) === 13) remove(g, d.sel, ref);
      else {
        d.warn = { t: 1.2, text: 'Pairs must add up to 13' };
        d.sel = ref;
      }
    }

    function inBox(x, y, bx, by, bw, bh) {
      return x >= bx && x <= bx + bw && y >= by && y <= by + bh;
    }

    return Milo.arcade(host, {
      id: 'pyramid-solitaire',
      w: W, h: H, bg: '#3a2a12',
      stats: ['Cleared', 'Time', 'Passes'],
      emo: '🔺',
      start: {
        title: 'Pyramid Solitaire',
        text: 'Pair up cards that total 13 to remove them — Ace is 1, Jack 11, Queen 12. ' +
          'Kings are worth 13 on their own, so they go straight off. Only uncovered cards count.',
        keys: ['Click two cards that add to 13', 'Click the stock to turn a card']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data;

        if (inBox(x, y, 40, H - 130, CW, CH)) {
          if (d.stock.length) {
            d.waste.push(d.stock.pop());
            Milo.sound.click();
          } else if (d.passes > 0 && d.waste.length) {
            d.stock = d.waste.reverse();
            d.waste = [];
            d.passes--;
            g.set('Passes', d.passes);
            Milo.sound.click();
          } else {
            d.warn = { t: 1.6, text: 'No passes left through the stock' };
          }
          d.sel = null;
          return;
        }
        if (d.waste.length && inBox(x, y, 40 + CW + 20, H - 130, CW, CH)) {
          pick(g, { where: 'waste' });
          return;
        }

        // Top rows draw last, so hit-test them first.
        for (var r = ROWS - 1; r >= 0; r--) {
          for (var i = 0; i <= r; i++) {
            var p = cellXY(r, i);
            if (inBox(x, y, p.x, p.y, CW, CH) && free(d, r, i)) {
              pick(g, { where: 'pyr', r: r, i: i });
              return;
            }
          }
        }
        d.sel = null;
      },

      update: function (g, dt) {
        var d = g.data;
        if (d.warn) { d.warn.t -= dt; if (d.warn.t <= 0) d.warn = null; }
        if (d.won) return;
        d.time += dt;
        g.set('Time', U.time(d.time));
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#4a3517'); bg.addColorStop(1, '#241a0c');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        for (var r = 0; r < ROWS; r++) {
          for (var i = 0; i <= r; i++) {
            var cell = d.pyr[r][i];
            if (cell.gone) continue;
            var p = cellXY(r, i);
            var isFree = free(d, r, i);
            var sel = d.sel && d.sel.where === 'pyr' && d.sel.r === r && d.sel.i === i;
            C.draw(c, cell.card, p.x, p.y, CW, CH, {
              faceUp: true, dim: !isFree, selected: sel
            });
          }
        }

        if (d.stock.length) C.draw(c, d.stock[d.stock.length - 1], 40, H - 130, CW, CH, { faceUp: false });
        else C.slot(c, 40, H - 130, CW, CH, d.passes > 0 ? '↻' : '×');

        if (d.waste.length) {
          C.draw(c, d.waste[d.waste.length - 1], 40 + CW + 20, H - 130, CW, CH, {
            faceUp: true, selected: d.sel && d.sel.where === 'waste'
          });
        } else C.slot(c, 40 + CW + 20, H - 130, CW, CH);

        c.fillStyle = 'rgba(255,255,255,.55)';
        c.font = '600 13px Outfit, sans-serif';
        c.textAlign = 'right';
        c.fillText('A=1  ·  J=11  ·  Q=12  ·  K=13 (goes alone)', W - 30, H - 60);

        if (d.warn) {
          c.globalAlpha = Math.min(1, d.warn.t);
          c.fillStyle = '#fb7185';
          c.font = '700 15px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(d.warn.text, W / 2, H - 20);
          c.globalAlpha = 1;
        }
      }
    });
  }

  window.Milo.register({
    id: 'pyramid-solitaire', title: 'Pyramid Solitaire', emo: '🔺', category: 'Cards',
    tagline: 'Pair cards that add up to 13',
    description: 'A pyramid of 28 cards. Remove pairs that total thirteen — Ace counts 1, ' +
      'Jack 11 and Queen 12 — and Kings are worth 13 all by themselves. A card can only be ' +
      'taken once nothing rests on top of it, and you get two more passes through the stock ' +
      'once it runs out.',
    controls: ['Click two cards', 'Click the stock'],
    colors: ['#3a2a12', '#f59e0b'],
    tags: ['solitaire', 'cards', 'numbers', 'patience'],
    mount: mount
  });
})();
