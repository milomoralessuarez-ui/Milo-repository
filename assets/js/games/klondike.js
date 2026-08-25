/* Klondike — the classic solitaire. Tap a card, then tap where it goes. */
(function () {
  'use strict';
  var W = 940, H = 640, CW = 84, CH = 118, GAP = 14, FAN = 26, FAN_DOWN = 11;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util, C = Milo.cards;

    function reset(g) {
      var d = g.data;
      var deck = C.shuffled();
      d.tab = [];
      for (var i = 0; i < 7; i++) {
        var pile = [];
        for (var j = 0; j <= i; j++) {
          var c = deck.pop();
          c.up = (j === i);
          pile.push(c);
        }
        d.tab.push(pile);
      }
      d.stock = deck.map(function (c) { c.up = false; return c; });
      d.waste = [];
      d.found = [[], [], [], []];
      d.sel = null;
      d.moves = 0;
      d.time = 0;
      d.won = false;
      g.set('Moves', 0);
      g.set('Time', '0:00');
      g.set('Foundations', '0/52');
    }

    /* --- layout: where every pile sits --------------------------------- */
    function stockXY() { return { x: GAP, y: GAP }; }
    function wasteXY() { return { x: GAP + CW + GAP, y: GAP }; }
    function foundXY(i) { return { x: GAP + (3 + i) * (CW + GAP), y: GAP }; }
    function tabXY(i) { return { x: GAP + i * (CW + GAP), y: GAP + CH + 28 }; }

    function topOf(pile) { return pile.length ? pile[pile.length - 1] : null; }

    /* --- rules ---------------------------------------------------------- */
    function canStack(card, onto) {
      // Tableau: descending rank, alternating colour. Empty takes a King.
      if (!onto) return card.r === 12;
      return onto.up && C.isRed(card) !== C.isRed(onto) && card.r === onto.r - 1;
    }
    function canFound(card, pile) {
      if (!pile.length) return card.r === 0;
      var t = pile[pile.length - 1];
      return t.s === card.s && card.r === t.r + 1;
    }

    function autoFlip(d) {
      d.tab.forEach(function (p) {
        var t = topOf(p);
        if (t && !t.up) t.up = true;
      });
    }

    function checkWin(g) {
      var d = g.data;
      var n = d.found.reduce(function (a, p) { return a + p.length; }, 0);
      g.set('Foundations', n + '/52');
      if (n === 52 && !d.won) {
        d.won = true;
        var score = Math.max(200, 8000 - d.moves * 12 - Math.round(d.time) * 6);
        g.win({
          emo: '🃏', title: 'Solved!',
          text: d.moves + ' moves in ' + U.time(d.time) + '.',
          score: score
        });
      }
    }

    /* --- moving --------------------------------------------------------- */
    function moveTo(g, target) {
      var d = g.data, s = d.sel;
      if (!s) return false;
      var cards = s.cards;

      if (target.kind === 'found') {
        if (cards.length !== 1 || !canFound(cards[0], d.found[target.i])) return false;
        take(d, s);
        d.found[target.i].push(cards[0]);
      } else if (target.kind === 'tab') {
        var onto = topOf(d.tab[target.i]);
        if (!canStack(cards[0], onto)) return false;
        take(d, s);
        d.tab[target.i] = d.tab[target.i].concat(cards);
      } else return false;

      d.moves++;
      g.set('Moves', d.moves);
      autoFlip(d);
      d.sel = null;
      Milo.sound.tone({ f: 420, f2: 520, d: .06, v: .06, type: 'triangle' });
      checkWin(g);
      return true;
    }

    function take(d, s) {
      if (s.kind === 'waste') d.waste.pop();
      else if (s.kind === 'found') d.found[s.i].pop();
      else d.tab[s.i].splice(s.at);
    }

    /** Send a card straight to a foundation if it will go. */
    function autoPlay(g, card, from) {
      var d = g.data;
      for (var i = 0; i < 4; i++) {
        if (canFound(card, d.found[i])) {
          d.sel = from;
          return moveTo(g, { kind: 'found', i: i });
        }
      }
      return false;
    }

    /* --- hit testing ----------------------------------------------------- */
    function hit(d, x, y) {
      var p = stockXY();
      if (inBox(x, y, p.x, p.y, CW, CH)) return { kind: 'stock' };
      p = wasteXY();
      if (d.waste.length && inBox(x, y, p.x, p.y, CW, CH)) {
        return { kind: 'waste', cards: [topOf(d.waste)] };
      }
      for (var f = 0; f < 4; f++) {
        p = foundXY(f);
        if (inBox(x, y, p.x, p.y, CW, CH)) {
          return { kind: 'found', i: f, cards: d.found[f].length ? [topOf(d.found[f])] : null };
        }
      }
      for (var t = 0; t < 7; t++) {
        p = tabXY(t);
        var pile = d.tab[t];
        if (!pile.length) {
          if (inBox(x, y, p.x, p.y, CW, CH)) return { kind: 'tab', i: t, cards: null };
          continue;
        }
        // Walk from the top card down so overlapping fans resolve correctly.
        for (var k = pile.length - 1; k >= 0; k--) {
          var cy = p.y + offsetAt(pile, k);
          var h = (k === pile.length - 1) ? CH : offsetAt(pile, k + 1) - offsetAt(pile, k);
          if (inBox(x, y, p.x, cy, CW, h)) {
            if (!pile[k].up) return { kind: 'tab', i: t, at: k, cards: null };
            return { kind: 'tab', i: t, at: k, cards: pile.slice(k) };
          }
        }
      }
      return null;
    }

    function offsetAt(pile, k) {
      var off = 0;
      for (var i = 0; i < k; i++) off += pile[i].up ? FAN : FAN_DOWN;
      return off;
    }

    function inBox(x, y, bx, by, bw, bh) {
      return x >= bx && x <= bx + bw && y >= by && y <= by + bh;
    }

    return Milo.arcade(host, {
      id: 'klondike',
      w: W, h: H, bg: '#0e3b26',
      stats: ['Moves', 'Time', 'Foundations'],
      emo: '🃏',
      start: {
        title: 'Klondike Solitaire',
        text: 'Build the four foundations up from Ace to King. In the tableau, ' +
          'stack downwards in alternating colours. Tap a card, then tap where it goes.',
        keys: ['Click to select', 'Click again to move', 'Double-click sends to foundation']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data;
        var h = hit(d, x, y);
        if (!h) { d.sel = null; return; }

        if (h.kind === 'stock') {
          if (d.stock.length) {
            var c = d.stock.pop();
            c.up = true;
            d.waste.push(c);
          } else {
            // Recycle the waste back into the stock, face down.
            d.stock = d.waste.reverse().map(function (q) { q.up = false; return q; });
            d.waste = [];
          }
          d.moves++;
          g.set('Moves', d.moves);
          d.sel = null;
          Milo.sound.click();
          return;
        }

        var now = performance.now();
        var isDouble = d.lastTap && now - d.lastTap.t < 380 &&
          Math.abs(d.lastTap.x - x) < 14 && Math.abs(d.lastTap.y - y) < 14;
        d.lastTap = { t: now, x: x, y: y };

        if (isDouble && h.cards && h.cards.length === 1) {
          if (autoPlay(g, h.cards[0], h)) return;
        }

        if (d.sel) {
          if (moveTo(g, h)) return;
          d.sel = null;
        }
        if (h.cards && h.cards.length) {
          // Only a properly ordered run can be picked up from the tableau.
          var ok = true;
          for (var i = 1; i < h.cards.length; i++) {
            var a = h.cards[i - 1], b = h.cards[i];
            if (!(C.isRed(a) !== C.isRed(b) && b.r === a.r - 1)) { ok = false; break; }
          }
          if (ok) { d.sel = h; Milo.sound.blip(); }
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
        bg.addColorStop(0, '#11402a'); bg.addColorStop(1, '#0a2b1c');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        var p = stockXY();
        if (d.stock.length) C.draw(c, d.stock[d.stock.length - 1], p.x, p.y, CW, CH, { faceUp: false });
        else C.slot(c, p.x, p.y, CW, CH, '↻');

        p = wasteXY();
        if (d.waste.length) {
          C.draw(c, topOf(d.waste), p.x, p.y, CW, CH, {
            faceUp: true, selected: d.sel && d.sel.kind === 'waste'
          });
        } else C.slot(c, p.x, p.y, CW, CH);

        for (var f = 0; f < 4; f++) {
          p = foundXY(f);
          if (d.found[f].length) C.draw(c, topOf(d.found[f]), p.x, p.y, CW, CH, { faceUp: true });
          else C.slot(c, p.x, p.y, CW, CH, C.SUITS[f]);
        }

        for (var t = 0; t < 7; t++) {
          p = tabXY(t);
          var pile = d.tab[t];
          if (!pile.length) { C.slot(c, p.x, p.y, CW, CH); continue; }
          for (var k = 0; k < pile.length; k++) {
            var sel = d.sel && d.sel.kind === 'tab' && d.sel.i === t && k >= d.sel.at;
            C.draw(c, pile[k], p.x, p.y + offsetAt(pile, k), CW, CH, {
              faceUp: pile[k].up, selected: sel
            });
          }
        }

        c.fillStyle = 'rgba(255,255,255,.42)';
        c.font = '600 12px Outfit, sans-serif';
        c.textAlign = 'left';
        c.fillText('Tap a card, then tap its destination · double-tap to send it to a foundation',
          GAP, H - 10);
      }
    });
  }

  window.Milo.register({
    id: 'klondike', title: 'Klondike Solitaire', emo: '🃏', category: 'Cards',
    tagline: 'The solitaire everyone knows',
    description: 'Build all four foundations from Ace up to King. The tableau stacks ' +
      'downwards in alternating colours, only a King can start an empty column, and the ' +
      'stock recycles when you run out. Tap a card to pick it up and tap where it should ' +
      'go; double-tap sends a card straight to its foundation.',
    controls: ['Click to select', 'Click to place', 'Double-click to auto-play'],
    colors: ['#0e3b26', '#22d3ee'],
    featured: true,
    tags: ['solitaire', 'cards', 'classic', 'patience'],
    mount: mount
  });
})();
