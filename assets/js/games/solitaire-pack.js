/* Solitaire Pack — twelve real solitaire variants on the shared card engine.
   Same conventions as klondike.js / golf-solitaire.js: tap a card to pick it
   up, tap where it goes, double-tap sends a card to its foundation. */
(function () {
  'use strict';
  var Milo = window.Milo, U = Milo.util, C = Milo.cards;

  /* ------------------------------------------------------ shared helpers */
  function inBox(x, y, bx, by, bw, bh) {
    return x >= bx && x <= bx + bw && y >= by && y <= by + bh;
  }
  function topOf(pile) { return pile.length ? pile[pile.length - 1] : null; }
  function pileSum(piles) {
    return piles.reduce(function (a, p) { return a + p.length; }, 0);
  }
  /** Double-tap detector shared by all the games (klondike's timings). */
  function isDouble(d, x, y) {
    var now = performance.now();
    var dbl = d.lastTap && now - d.lastTap.t < 380 &&
      Math.abs(d.lastTap.x - x) < 14 && Math.abs(d.lastTap.y - y) < 14;
    d.lastTap = { t: now, x: x, y: y };
    return dbl;
  }
  /** Ace-to-King, same suit — the standard foundation rule. */
  function canFoundStd(card, pile) {
    if (!pile.length) return card.r === 0;
    var t = pile[pile.length - 1];
    return t.s === card.s && card.r === t.r + 1;
  }
  /**
   * Per-card y offsets for a fanned pile, compressed so the whole pile fits
   * inside `avail` pixels above the last card. Cards with .up === false get
   * the tighter face-down spacing.
   */
  function fanOffsets(pile, avail, fu, fd) {
    var down = 0, up = 0, i;
    for (i = 0; i < pile.length; i++) {
      if (pile[i].up === false) down++; else up++;
    }
    var span = down * fd + Math.max(0, up - 1) * fu + (down && up ? fd : 0);
    // simpler: span of offsets before the last card
    span = 0;
    for (i = 0; i < pile.length - 1; i++) span += (pile[i].up === false) ? fd : fu;
    if (span > avail && span > 0) {
      var k = avail / span;
      fu = Math.max(7, fu * k);
      fd = Math.max(4, fd * k);
    }
    var out = [], off = 0;
    for (i = 0; i < pile.length; i++) {
      out.push(off);
      off += (pile[i].up === false) ? fd : fu;
    }
    return out;
  }
  /** Hit-test a fanned pile; returns the card index or -1. */
  function hitFan(pile, offs, x, y, px, py, cw, ch) {
    for (var k = pile.length - 1; k >= 0; k--) {
      var cy = py + offs[k];
      var hh = (k === pile.length - 1) ? ch : offs[k + 1] - offs[k];
      if (inBox(x, y, px, cy, cw, hh)) return k;
    }
    return -1;
  }
  function drawFan(ctx, pile, offs, px, py, cw, ch, selFrom) {
    for (var k = 0; k < pile.length; k++) {
      C.draw(ctx, pile[k], px, py + offs[k], cw, ch, {
        faceUp: pile[k].up !== false,
        selected: selFrom != null && k >= selFrom
      });
    }
  }
  function tableBg(ctx, W, H, top, bottom) {
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, top); bg.addColorStop(1, bottom);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  }
  function footer(ctx, W, H, text) {
    ctx.fillStyle = 'rgba(255,255,255,.42)';
    ctx.font = '600 12px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, W / 2, H - 10);
  }
  function goodTone() { Milo.sound.tone({ f: 420, f2: 520, d: .06, v: .06, type: 'triangle' }); }
  function badTone() { Milo.sound.tone({ f: 150, d: .07, v: .05, type: 'square' }); }

  /* ============================================================== YUKON */
  function mountYukon(host) {
    var W = 940, H = 640, CW = 84, CH = 118, GAP = 14;
    var TAB_Y = GAP + CH + 28, AVAIL = H - TAB_Y - CH - 12;

    function foundXY(i) { return { x: GAP + (3 + i) * (CW + GAP), y: GAP }; }
    function tabXY(i) { return { x: GAP + i * (CW + GAP), y: TAB_Y }; }
    function offs(pile) { return fanOffsets(pile, AVAIL, 24, 10); }

    function reset(g) {
      var d = g.data;
      var deck = C.shuffled();
      d.tab = [];
      for (var i = 0; i < 7; i++) {
        var pile = [], j, c;
        if (i === 0) {
          c = deck.pop(); c.up = true; pile.push(c);
        } else {
          for (j = 0; j < i; j++) { c = deck.pop(); c.up = false; pile.push(c); }
          for (j = 0; j < 5; j++) { c = deck.pop(); c.up = true; pile.push(c); }
        }
        d.tab.push(pile);
      }
      d.found = [[], [], [], []];
      d.sel = null; d.moves = 0; d.time = 0; d.won = false;
      g.set('Moves', 0); g.set('Time', '0:00'); g.set('Foundations', '0/52');
    }

    function canStack(card, onto) {
      if (!onto) return card.r === 12;
      return onto.up && C.isRed(card) !== C.isRed(onto) && card.r === onto.r - 1;
    }

    function checkWin(g) {
      var d = g.data, n = pileSum(d.found);
      g.set('Foundations', n + '/52');
      if (n === 52 && !d.won) {
        d.won = true;
        g.win({
          emo: '🏔️', title: 'Yukon cleared!',
          text: d.moves + ' moves in ' + U.time(d.time) + '.',
          score: Math.max(200, 8000 - d.moves * 12 - Math.round(d.time) * 6)
        });
      }
    }

    function moveTo(g, target) {
      var d = g.data, s = d.sel;
      if (!s) return false;
      var cards = s.cards;
      if (target.kind === 'found') {
        if (cards.length !== 1 || !canFoundStd(cards[0], d.found[target.i])) return false;
        take(d, s);
        d.found[target.i].push(cards[0]);
      } else if (target.kind === 'tab') {
        if (!canStack(cards[0], topOf(d.tab[target.i]))) return false;
        take(d, s);
        d.tab[target.i] = d.tab[target.i].concat(cards);
      } else return false;
      d.moves++;
      g.set('Moves', d.moves);
      d.tab.forEach(function (p) { var t = topOf(p); if (t && !t.up) t.up = true; });
      d.sel = null;
      goodTone();
      checkWin(g);
      return true;
    }
    function take(d, s) {
      if (s.kind === 'found') d.found[s.i].pop();
      else d.tab[s.i].splice(s.at);
    }

    function hit(d, x, y) {
      var f, p;
      for (f = 0; f < 4; f++) {
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
        var k = hitFan(pile, offs(pile), x, y, p.x, p.y, CW, CH);
        if (k >= 0) {
          if (!pile[k].up) return { kind: 'tab', i: t, at: k, cards: null };
          return { kind: 'tab', i: t, at: k, cards: pile.slice(k) };
        }
      }
      return null;
    }

    return Milo.arcade(host, {
      id: 'sol-yukon',
      w: W, h: H, bg: '#22303f',
      stats: ['Moves', 'Time', 'Foundations'],
      emo: '🏔️',
      start: {
        title: 'Yukon',
        text: 'Like Klondike with no stock — everything is dealt. You may pick up ANY ' +
          'face-up card together with whatever sits on top of it, even out of order, as ' +
          'long as it lands on an alternating-colour card one rank higher.',
        keys: ['Click to select', 'Click again to move', 'Double-click sends to foundation']
      },
      init: reset,
      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data;
        var h = hit(d, x, y);
        if (!h) { d.sel = null; return; }
        if (isDouble(d, x, y) && h.cards && h.kind === 'tab' &&
            h.at === d.tab[h.i].length - 1) {
          for (var i = 0; i < 4; i++) {
            if (canFoundStd(h.cards[0], d.found[i])) {
              d.sel = { kind: 'tab', i: h.i, at: h.at, cards: [h.cards[0]] };
              if (moveTo(g, { kind: 'found', i: i })) return;
            }
          }
        }
        if (d.sel) {
          if (moveTo(g, h)) return;
          d.sel = null;
        }
        if (h.cards && h.cards.length) { d.sel = h; Milo.sound.blip(); }
      },
      update: function (g, dt) {
        var d = g.data;
        if (d.won) return;
        d.time += dt;
        g.set('Time', U.time(d.time));
      },
      draw: function (g) {
        var c = g.ctx, d = g.data, p;
        tableBg(c, W, H, '#27384a', '#151f2b');
        c.fillStyle = 'rgba(255,255,255,.35)';
        c.font = '700 15px Outfit, sans-serif';
        c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText('YUKON — no stock, messy piles allowed', GAP, GAP + CH / 2);
        for (var f = 0; f < 4; f++) {
          p = foundXY(f);
          if (d.found[f].length) C.draw(c, topOf(d.found[f]), p.x, p.y, CW, CH, { faceUp: true });
          else C.slot(c, p.x, p.y, CW, CH, C.SUITS[f]);
        }
        for (var t = 0; t < 7; t++) {
          p = tabXY(t);
          var pile = d.tab[t];
          if (!pile.length) { C.slot(c, p.x, p.y, CW, CH); continue; }
          var selFrom = (d.sel && d.sel.kind === 'tab' && d.sel.i === t) ? d.sel.at : null;
          drawFan(c, pile, offs(pile), p.x, p.y, CW, CH, selFrom);
        }
        footer(c, W, H, 'Any face-up card can be picked up with everything on top of it');
      }
    });
  }

  Milo.register({
    id: 'sol-yukon', title: 'Yukon', emo: '🏔️', category: 'Cards',
    tagline: 'Klondike with no stock and messy pickups',
    description: 'All 52 cards are dealt at the start — there is no stock to dig through. ' +
      'The twist versus Klondike: you may grab any face-up card along with the whole jumble ' +
      'sitting on top of it, order be damned, so long as the card you grabbed lands on an ' +
      'alternating-colour card one rank higher. Foundations still build Ace to King by suit. ' +
      'Tip: dig out face-down cards early — buried cards are what lose Yukon games.',
    controls: ['Click to select', 'Click to place', 'Double-click to auto-play'],
    colors: ['#22303f', '#7dd3fc'],
    tags: ['solitaire', 'cards', 'patience', 'yukon'],
    mount: mountYukon
  });

  /* =========================================================== SCORPION */
  function mountScorpion(host) {
    var W = 940, H = 640, CW = 84, CH = 118, GAP = 14;
    var TAB_Y = GAP + CH + 28, AVAIL = H - TAB_Y - CH - 12;

    function stockXY() { return { x: GAP, y: GAP }; }
    function foundXY(i) { return { x: GAP + (3 + i) * (CW + GAP), y: GAP }; }
    function tabXY(i) { return { x: GAP + i * (CW + GAP), y: TAB_Y }; }
    function offs(pile) { return fanOffsets(pile, AVAIL, 24, 12); }

    function reset(g) {
      var d = g.data;
      var deck = C.shuffled();
      d.tab = [];
      for (var i = 0; i < 7; i++) {
        var pile = [];
        for (var j = 0; j < 7; j++) {
          var c = deck.pop();
          c.up = i >= 4 || j >= 3;   // first 4 piles: 3 face down, 4 face up
          pile.push(c);
        }
        d.tab.push(pile);
      }
      d.reserve = deck;              // 3 cards, dealt to piles 0-2 on demand
      d.done = 0;                    // completed K→A suit runs
      d.doneSuits = [];
      d.sel = null; d.moves = 0; d.time = 0; d.won = false;
      g.set('Moves', 0); g.set('Time', '0:00'); g.set('Done', '0/4');
    }

    function canStack(card, onto) {
      if (!onto) return card.r === 12;
      return onto.up && onto.s === card.s && card.r === onto.r - 1;
    }

    /** Remove a finished K→A same-suit run from the top of any pile. */
    function sweepRuns(g) {
      var d = g.data;
      d.tab.forEach(function (pile) {
        if (pile.length < 13) return;
        var base = pile.length - 13;
        if (!pile[base].up || pile[base].r !== 12) return;
        for (var k = 0; k < 13; k++) {
          var c = pile[base + k];
          if (!c.up || c.s !== pile[base].s || c.r !== 12 - k) return;
        }
        d.doneSuits.push(pile[base].s);
        pile.splice(base);
        d.done++;
        g.set('Done', d.done + '/4');
        Milo.sound.coin();
        var t = topOf(pile);
        if (t && !t.up) t.up = true;
        if (d.done === 4 && !d.won) {
          d.won = true;
          g.win({
            emo: '🦂', title: 'All four suits!',
            text: d.moves + ' moves in ' + U.time(d.time) + '.',
            score: Math.max(300, 9000 - d.moves * 14 - Math.round(d.time) * 6)
          });
        }
      });
    }

    function moveTo(g, target) {
      var d = g.data, s = d.sel;
      if (!s || target.kind !== 'tab') return false;
      if (target.i === s.i) return false;
      if (!canStack(s.cards[0], topOf(d.tab[target.i]))) return false;
      d.tab[s.i].splice(s.at);
      d.tab[target.i] = d.tab[target.i].concat(s.cards);
      d.moves++;
      g.set('Moves', d.moves);
      d.tab.forEach(function (p) { var t = topOf(p); if (t && !t.up) t.up = true; });
      d.sel = null;
      goodTone();
      sweepRuns(g);
      return true;
    }

    function hit(d, x, y) {
      var p = stockXY();
      if (inBox(x, y, p.x, p.y, CW, CH)) return { kind: 'stock' };
      for (var t = 0; t < 7; t++) {
        p = tabXY(t);
        var pile = d.tab[t];
        if (!pile.length) {
          if (inBox(x, y, p.x, p.y, CW, CH)) return { kind: 'tab', i: t, cards: null };
          continue;
        }
        var k = hitFan(pile, offs(pile), x, y, p.x, p.y, CW, CH);
        if (k >= 0) {
          if (!pile[k].up) return { kind: 'tab', i: t, at: k, cards: null };
          return { kind: 'tab', i: t, at: k, cards: pile.slice(k) };
        }
      }
      return null;
    }

    return Milo.arcade(host, {
      id: 'sol-scorpion',
      w: W, h: H, bg: '#3a1d12',
      stats: ['Moves', 'Time', 'Done'],
      emo: '🦂',
      start: {
        title: 'Scorpion',
        text: 'Build four complete King-to-Ace runs in a single suit, inside the tableau ' +
          'itself. Pick up any face-up card with everything on top of it; it must land on ' +
          'the same-suit card one rank higher. The 3-card tail deals onto the first columns.',
        keys: ['Click to select', 'Click again to move', 'Click the tail to deal 3']
      },
      init: reset,
      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data;
        var h = hit(d, x, y);
        if (!h) { d.sel = null; return; }
        if (h.kind === 'stock') {
          if (d.reserve.length) {
            for (var i = 0; i < 3 && d.reserve.length; i++) {
              var c = d.reserve.pop();
              c.up = true;
              d.tab[i].push(c);
            }
            d.moves++;
            g.set('Moves', d.moves);
            Milo.sound.click();
            sweepRuns(g);
          } else badTone();
          d.sel = null;
          return;
        }
        isDouble(d, x, y);           // keep the tap tracker warm (no auto-play here)
        if (d.sel) {
          if (moveTo(g, h)) return;
          d.sel = null;
        }
        if (h.cards && h.cards.length) { d.sel = h; Milo.sound.blip(); }
      },
      update: function (g, dt) {
        var d = g.data;
        if (d.won) return;
        d.time += dt;
        g.set('Time', U.time(d.time));
      },
      draw: function (g) {
        var c = g.ctx, d = g.data, p;
        tableBg(c, W, H, '#47251a', '#20100a');
        p = stockXY();
        if (d.reserve.length) {
          C.draw(c, d.reserve[d.reserve.length - 1], p.x, p.y, CW, CH, { faceUp: false });
          c.fillStyle = 'rgba(255,255,255,.6)';
          c.font = '700 13px Outfit, sans-serif';
          c.textAlign = 'left'; c.textBaseline = 'top';
          c.fillText(d.reserve.length + ' in tail', p.x, p.y + CH + 6);
        } else C.slot(c, p.x, p.y, CW, CH, '×');
        for (var f = 0; f < 4; f++) {
          p = foundXY(f);
          if (f < d.doneSuits.length) {
            C.draw(c, { r: 12, s: d.doneSuits[f] }, p.x, p.y, CW, CH, { faceUp: true });
          } else C.slot(c, p.x, p.y, CW, CH, '♛');
        }
        for (var t = 0; t < 7; t++) {
          p = tabXY(t);
          var pile = d.tab[t];
          if (!pile.length) { C.slot(c, p.x, p.y, CW, CH); continue; }
          var selFrom = (d.sel && d.sel.kind === 'tab' && d.sel.i === t) ? d.sel.at : null;
          drawFan(c, pile, offs(pile), p.x, p.y, CW, CH, selFrom);
        }
        footer(c, W, H, 'Build King → Ace in one suit inside the columns — finished runs fly off');
      }
    });
  }

  Milo.register({
    id: 'sol-scorpion', title: 'Scorpion', emo: '🦂', category: 'Cards',
    tagline: 'Build whole suits inside the tableau',
    description: 'No foundations to feed one card at a time — you assemble each full ' +
      'King-to-Ace run in a single suit right in the columns, and it lifts off when complete. ' +
      'Unlike Klondike you stack by SAME suit, and like Yukon you may pick up any face-up ' +
      'card with the whole heap on top of it. Only Kings land on empty columns, and a ' +
      '3-card tail deals onto the first three piles when you need fresh blood. Tip: never ' +
      'bury a card on the one directly below it in sequence — that loop is unbreakable.',
    controls: ['Click to select', 'Click to place', 'Click tail to deal'],
    colors: ['#3a1d12', '#fb923c'],
    tags: ['solitaire', 'cards', 'patience', 'spider-like'],
    mount: mountScorpion
  });

/*__MORE__*/
})();
