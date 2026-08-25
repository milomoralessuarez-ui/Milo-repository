/* Spider Solitaire (two suits) — build King-to-Ace runs and clear them away. */
(function () {
  'use strict';
  var W = 960, H = 660, CW = 68, CH = 96, GAP = 9, FAN = 24, FAN_DOWN = 9;
  var COLS = 10;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util, C = Milo.cards;

    function reset(g) {
      var d = g.data;
      // Two suits (spades and hearts), four of each — the standard middle setting.
      var deck = [];
      for (var p = 0; p < 4; p++) {
        for (var r = 0; r < 13; r++) { deck.push({ r: r, s: 0 }); deck.push({ r: r, s: 1 }); }
      }
      U.shuffle(deck);
      d.tab = [];
      for (var i = 0; i < COLS; i++) d.tab.push([]);
      var deal = 54;
      for (var k = 0; k < deal; k++) {
        var c = deck.pop();
        c.up = false;
        d.tab[k % COLS].push(c);
      }
      d.tab.forEach(function (pile) { if (pile.length) pile[pile.length - 1].up = true; });
      d.stock = deck;
      d.done = 0;
      d.sel = null;
      d.moves = 0;
      d.time = 0;
      d.won = false;
      d.warn = null;
      g.set('Moves', 0);
      g.set('Time', '0:00');
      g.set('Runs', '0/8');
    }

    function tabXY(i) { return { x: GAP + i * (CW + GAP), y: 96 }; }
    function topOf(p) { return p.length ? p[p.length - 1] : null; }

    function offsetAt(pile, k) {
      var off = 0;
      for (var i = 0; i < k; i++) off += pile[i].up ? FAN : FAN_DOWN;
      return off;
    }

    /** A movable run is same-suit and strictly descending. */
    function runFrom(pile, k) {
      if (!pile[k] || !pile[k].up) return null;
      for (var i = k + 1; i < pile.length; i++) {
        if (pile[i].s !== pile[i - 1].s || pile[i].r !== pile[i - 1].r - 1) return null;
      }
      return pile.slice(k);
    }

    function clearRuns(g) {
      var d = g.data;
      d.tab.forEach(function (pile, i) {
        if (pile.length < 13) return;
        var start = pile.length - 13;
        var run = runFrom(pile, start);
        if (run && run.length === 13 && run[0].r === 12 && run[12].r === 0) {
          pile.splice(start);
          d.done++;
          if (pile.length) pile[pile.length - 1].up = true;
          Milo.sound.powerup();
          g.set('Runs', d.done + '/8');
        }
      });
      if (d.done === 8 && !d.won) {
        d.won = true;
        g.win({
          emo: '🕷️', title: 'All eight runs cleared!',
          text: d.moves + ' moves in ' + U.time(d.time) + '.',
          score: Math.max(300, 9000 - d.moves * 10 - Math.round(d.time) * 4)
        });
      }
    }

    function dealRow(g) {
      var d = g.data;
      if (!d.stock.length) return;
      if (d.tab.some(function (p) { return !p.length; })) {
        d.warn = { t: 1.6, text: 'Every column must have a card before you deal' };
        return;
      }
      for (var i = 0; i < COLS; i++) {
        var c = d.stock.pop();
        if (!c) break;
        c.up = true;
        d.tab[i].push(c);
      }
      d.moves++;
      g.set('Moves', d.moves);
      Milo.sound.click();
      clearRuns(g);
    }

    function inBox(x, y, bx, by, bw, bh) {
      return x >= bx && x <= bx + bw && y >= by && y <= by + bh;
    }

    return Milo.arcade(host, {
      id: 'spider-solitaire',
      w: W, h: H, bg: '#2a1740',
      stats: ['Moves', 'Time', 'Runs'],
      emo: '🕷️',
      start: {
        title: 'Spider Solitaire',
        text: 'Two suits. Build runs from King down to Ace in a single suit and they ' +
          'lift off the board. Clear all eight to win. Tap the stock to deal another row.',
        keys: ['Click to select a run', 'Click a column to move', 'Click the stock to deal']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data;

        if (inBox(x, y, W - 120, 16, 100, 60)) { dealRow(g); d.sel = null; return; }

        for (var i = 0; i < COLS; i++) {
          var p = tabXY(i), pile = d.tab[i];
          var height = pile.length ? offsetAt(pile, pile.length - 1) + CH : CH;
          if (!inBox(x, y, p.x, p.y, CW, Math.max(CH, height))) continue;

          if (d.sel) {
            var onto = topOf(pile);
            var card = d.sel.cards[0];
            if (!onto || card.r === onto.r - 1) {
              d.tab[d.sel.i].splice(d.sel.at);
              d.tab[i] = pile.concat(d.sel.cards);
              if (d.tab[d.sel.i].length) d.tab[d.sel.i][d.tab[d.sel.i].length - 1].up = true;
              d.moves++;
              g.set('Moves', d.moves);
              d.sel = null;
              Milo.sound.tone({ f: 400, f2: 500, d: .06, v: .06, type: 'triangle' });
              clearRuns(g);
              return;
            }
            d.sel = null;
          }

          for (var k = pile.length - 1; k >= 0; k--) {
            var cy = p.y + offsetAt(pile, k);
            var h = (k === pile.length - 1) ? CH : offsetAt(pile, k + 1) - offsetAt(pile, k);
            if (inBox(x, y, p.x, cy, CW, h)) {
              var run = runFrom(pile, k);
              if (run) { d.sel = { i: i, at: k, cards: run }; Milo.sound.blip(); }
              return;
            }
          }
          return;
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
        bg.addColorStop(0, '#33194d'); bg.addColorStop(1, '#1a0f2b');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        // completed runs, stacked as markers
        for (var r = 0; r < d.done; r++) {
          C.draw(c, { r: 12, s: 0 }, GAP + r * 26, 16, CW * .7, CH * .7, { faceUp: true, dim: true });
        }

        // stock
        if (d.stock.length) {
          var rows = Math.ceil(d.stock.length / COLS);
          for (var q = 0; q < Math.min(rows, 5); q++) {
            C.draw(c, { r: 0, s: 0 }, W - 120 + q * 6, 16 + q * 3, CW * .8, CH * .6, { faceUp: false });
          }
          c.fillStyle = 'rgba(255,255,255,.7)';
          c.font = '700 12px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(rows + ' deal' + (rows === 1 ? '' : 's') + ' left', W - 68, 92);
        }

        for (var i = 0; i < COLS; i++) {
          var p = tabXY(i), pile = d.tab[i];
          if (!pile.length) { C.slot(c, p.x, p.y, CW, CH); continue; }
          for (var k = 0; k < pile.length; k++) {
            var sel = d.sel && d.sel.i === i && k >= d.sel.at;
            C.draw(c, pile[k], p.x, p.y + offsetAt(pile, k), CW, CH, {
              faceUp: pile[k].up, selected: sel
            });
          }
        }

        if (d.warn) {
          c.globalAlpha = Math.min(1, d.warn.t);
          c.fillStyle = '#fb7185';
          c.font = '700 15px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(d.warn.text, W / 2, H - 14);
          c.globalAlpha = 1;
        }
      }
    });
  }

  window.Milo.register({
    id: 'spider-solitaire', title: 'Spider Solitaire', emo: '🕷️', category: 'Cards',
    tagline: 'Two suits, eight runs to clear',
    description: 'Ten columns, two suits and a stock that deals a whole row at a time. ' +
      'Any card can sit on one a rank higher, but only a same-suit run moves as a group — ' +
      'and a complete King-to-Ace run in one suit lifts off the board. Clear all eight to win. ' +
      'You cannot deal a new row while any column is empty.',
    controls: ['Click a run', 'Click a column', 'Click the stock to deal'],
    colors: ['#2a1740', '#a78bfa'],
    tags: ['solitaire', 'cards', 'patience', 'logic'],
    mount: mount
  });
})();
