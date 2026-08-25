/* FreeCell — every deal is winnable if you plan the free cells right. */
(function () {
  'use strict';
  var W = 940, H = 660, CW = 84, CH = 118, GAP = 13, FAN = 27;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util, C = Milo.cards;

    function reset(g) {
      var d = g.data;
      var deck = C.shuffled();
      d.tab = [[], [], [], [], [], [], [], []];
      deck.forEach(function (c, i) { c.up = true; d.tab[i % 8].push(c); });
      d.free = [null, null, null, null];
      d.found = [[], [], [], []];
      d.sel = null;
      d.moves = 0;
      d.time = 0;
      d.won = false;
      g.set('Moves', 0);
      g.set('Time', '0:00');
      g.set('Home', '0/52');
    }

    function freeXY(i) { return { x: GAP + i * (CW + GAP), y: GAP }; }
    function foundXY(i) { return { x: GAP + (4 + i) * (CW + GAP), y: GAP }; }
    function tabXY(i) { return { x: GAP + i * (CW + GAP), y: GAP + CH + 26 }; }
    function topOf(p) { return p.length ? p[p.length - 1] : null; }

    function canStack(card, onto) {
      if (!onto) return true;                    // any card starts an empty column
      return C.isRed(card) !== C.isRed(onto) && card.r === onto.r - 1;
    }
    function canFound(card, pile) {
      if (!pile.length) return card.r === 0;
      var t = pile[pile.length - 1];
      return t.s === card.s && card.r === t.r + 1;
    }

    /** How many cards can move at once: (free cells + 1) x 2^(empty columns). */
    function capacity(d, toEmpty) {
      var f = d.free.filter(function (x) { return !x; }).length;
      var e = d.tab.filter(function (p) { return !p.length; }).length;
      if (toEmpty) e = Math.max(0, e - 1);
      return (f + 1) * Math.pow(2, e);
    }

    function checkWin(g) {
      var d = g.data;
      var n = d.found.reduce(function (a, p) { return a + p.length; }, 0);
      g.set('Home', n + '/52');
      if (n === 52 && !d.won) {
        d.won = true;
        g.win({
          emo: '🂡', title: 'Cleared!',
          text: d.moves + ' moves in ' + U.time(d.time) + '.',
          score: Math.max(200, 7000 - d.moves * 14 - Math.round(d.time) * 5)
        });
      }
    }

    function take(d, s) {
      if (s.kind === 'free') d.free[s.i] = null;
      else if (s.kind === 'found') d.found[s.i].pop();
      else d.tab[s.i].splice(s.at);
    }

    function moveTo(g, target) {
      var d = g.data, s = d.sel;
      if (!s || !s.cards) return false;
      var cards = s.cards;

      if (target.kind === 'free') {
        if (cards.length !== 1 || d.free[target.i]) return false;
        take(d, s);
        d.free[target.i] = cards[0];
      } else if (target.kind === 'found') {
        if (cards.length !== 1 || !canFound(cards[0], d.found[target.i])) return false;
        take(d, s);
        d.found[target.i].push(cards[0]);
      } else if (target.kind === 'tab') {
        var pile = d.tab[target.i];
        if (!canStack(cards[0], topOf(pile))) return false;
        if (cards.length > capacity(d, !pile.length)) {
          d.warn = { t: 1.4, text: 'Not enough free cells to move ' + cards.length + ' cards' };
          return false;
        }
        take(d, s);
        d.tab[target.i] = pile.concat(cards);
      } else return false;

      d.moves++;
      g.set('Moves', d.moves);
      d.sel = null;
      Milo.sound.tone({ f: 430, f2: 520, d: .06, v: .06, type: 'triangle' });
      checkWin(g);
      return true;
    }

    function autoPlay(g, card, from) {
      var d = g.data;
      for (var i = 0; i < 4; i++) {
        if (canFound(card, d.found[i])) { d.sel = from; return moveTo(g, { kind: 'found', i: i }); }
      }
      for (var f = 0; f < 4; f++) {
        if (!d.free[f]) { d.sel = from; return moveTo(g, { kind: 'free', i: f }); }
      }
      return false;
    }

    function inBox(x, y, bx, by, bw, bh) {
      return x >= bx && x <= bx + bw && y >= by && y <= by + bh;
    }

    function hit(d, x, y) {
      var p, i;
      for (i = 0; i < 4; i++) {
        p = freeXY(i);
        if (inBox(x, y, p.x, p.y, CW, CH)) {
          return { kind: 'free', i: i, cards: d.free[i] ? [d.free[i]] : null };
        }
      }
      for (i = 0; i < 4; i++) {
        p = foundXY(i);
        if (inBox(x, y, p.x, p.y, CW, CH)) {
          return { kind: 'found', i: i, cards: d.found[i].length ? [topOf(d.found[i])] : null };
        }
      }
      for (i = 0; i < 8; i++) {
        p = tabXY(i);
        var pile = d.tab[i];
        if (!pile.length) {
          if (inBox(x, y, p.x, p.y, CW, CH)) return { kind: 'tab', i: i, cards: null };
          continue;
        }
        for (var k = pile.length - 1; k >= 0; k--) {
          var cy = p.y + k * FAN;
          var h = (k === pile.length - 1) ? CH : FAN;
          if (inBox(x, y, p.x, cy, CW, h)) return { kind: 'tab', i: i, at: k, cards: pile.slice(k) };
        }
      }
      return null;
    }

    return Milo.arcade(host, {
      id: 'freecell',
      w: W, h: H, bg: '#12324a',
      stats: ['Moves', 'Time', 'Home'],
      emo: '🂡',
      start: {
        title: 'FreeCell',
        text: 'Every card is face up from the start, so this one is pure planning. ' +
          'Four free cells hold one card each — the more you keep empty, the more cards ' +
          'you can shift at once.',
        keys: ['Click to select', 'Click to place', 'Double-click to auto-play']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data;
        var h = hit(d, x, y);
        if (!h) { d.sel = null; return; }

        var now = performance.now();
        var isDouble = d.lastTap && now - d.lastTap.t < 380 &&
          Math.abs(d.lastTap.x - x) < 14 && Math.abs(d.lastTap.y - y) < 14;
        d.lastTap = { t: now, x: x, y: y };

        if (isDouble && h.cards && h.cards.length === 1 && autoPlay(g, h.cards[0], h)) return;

        if (d.sel) {
          if (moveTo(g, h)) return;
          d.sel = null;
        }
        if (h.cards && h.cards.length) {
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
        if (d.warn) { d.warn.t -= dt; if (d.warn.t <= 0) d.warn = null; }
        if (d.won) return;
        d.time += dt;
        g.set('Time', U.time(d.time));
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#15395a'); bg.addColorStop(1, '#0c2233');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        var p, i;
        for (i = 0; i < 4; i++) {
          p = freeXY(i);
          if (d.free[i]) {
            C.draw(c, d.free[i], p.x, p.y, CW, CH, {
              faceUp: true, selected: d.sel && d.sel.kind === 'free' && d.sel.i === i
            });
          } else C.slot(c, p.x, p.y, CW, CH, '·');
        }
        for (i = 0; i < 4; i++) {
          p = foundXY(i);
          if (d.found[i].length) C.draw(c, topOf(d.found[i]), p.x, p.y, CW, CH, { faceUp: true });
          else C.slot(c, p.x, p.y, CW, CH, C.SUITS[i]);
        }
        for (i = 0; i < 8; i++) {
          p = tabXY(i);
          var pile = d.tab[i];
          if (!pile.length) { C.slot(c, p.x, p.y, CW, CH); continue; }
          for (var k = 0; k < pile.length; k++) {
            var sel = d.sel && d.sel.kind === 'tab' && d.sel.i === i && k >= d.sel.at;
            C.draw(c, pile[k], p.x, p.y + k * FAN, CW, CH, { faceUp: true, selected: sel });
          }
        }

        c.fillStyle = 'rgba(255,255,255,.5)';
        c.font = '600 12px Outfit, sans-serif';
        c.textAlign = 'left';
        c.fillText('Can move ' + capacity(d, false) + ' cards at once', GAP, H - 10);

        if (d.warn) {
          c.globalAlpha = Math.min(1, d.warn.t);
          c.fillStyle = '#fb7185';
          c.font = '700 15px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(d.warn.text, W / 2, H - 12);
          c.globalAlpha = 1;
        }
      }
    });
  }

  window.Milo.register({
    id: 'freecell', title: 'FreeCell', emo: '🂡', category: 'Cards',
    tagline: 'All cards face up — pure planning',
    description: 'Every card is visible from the deal, so nothing is left to luck. Four ' +
      'free cells each hold a single card, and how many you keep empty decides how long a ' +
      'run you can move in one go. Build the foundations Ace to King by suit; any card may ' +
      'start an empty column.',
    controls: ['Click to select', 'Click to place', 'Double-click to auto-play'],
    colors: ['#12324a', '#38bdf8'],
    tags: ['solitaire', 'cards', 'logic', 'patience'],
    mount: mount
  });
})();
