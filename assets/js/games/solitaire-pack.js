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
  /** Green "this is legal" outline used for empty-slot hints. */
  function hintRect(ctx, x, y, w, h) {
    ctx.save();
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = Math.max(1.5, w * 0.035);
    U.roundRect(ctx, x, y, w, h, Math.max(3, w * 0.09));
    ctx.stroke();
    ctx.restore();
  }

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

  /* ============================================================ ACES UP */
  function mountAcesUp(host) {
    var W = 720, H = 560, CW = 84, CH = 118, FAN = 26;
    var COL_Y = 90, AVAIL = H - COL_Y - CH - 30;

    function stockXY() { return { x: 24, y: COL_Y }; }
    function colXY(i) { return { x: 168 + i * (CW + 18), y: COL_Y }; }
    function offs(pile) { return fanOffsets(pile, AVAIL, FAN, FAN); }
    function aceVal(c) { return c.r === 0 ? 13 : c.r; }

    function reset(g) {
      var d = g.data;
      d.stock = C.shuffled();
      d.cols = [[], [], [], []];
      for (var i = 0; i < 4; i++) d.cols[i].push(d.stock.pop());
      d.discarded = 0; d.sel = null; d.time = 0; d.won = false;
      g.set('Discarded', '0/48'); g.set('Stock', d.stock.length); g.set('Time', '0:00');
    }

    /** A top card can go if a higher card of its suit tops another column. */
    function discardable(d, ci) {
      var c = topOf(d.cols[ci]);
      if (!c || c.r === 0) return false;      // aces are the highest card
      for (var j = 0; j < 4; j++) {
        if (j === ci) continue;
        var t = topOf(d.cols[j]);
        if (t && t.s === c.s && aceVal(t) > aceVal(c)) return true;
      }
      return false;
    }

    function checkEnd(g) {
      var d = g.data;
      if (d.won) return;
      if (d.discarded === 48) {
        d.won = true;
        g.win({
          emo: '♠️', title: 'Four aces stand!',
          text: 'All 48 cards discarded in ' + U.time(d.time) + '.',
          score: Math.max(500, 5200 - Math.round(d.time) * 8)
        });
        return;
      }
      if (d.stock.length) return;
      var anyDiscard = false, anyEmpty = false, anyDeep = false;
      for (var i = 0; i < 4; i++) {
        if (discardable(d, i)) anyDiscard = true;
        if (!d.cols[i].length) anyEmpty = true;
        if (d.cols[i].length >= 2) anyDeep = true;
      }
      if (!anyDiscard && !(anyEmpty && anyDeep)) {
        d.won = true;
        g.gameOver({
          emo: '♠️', title: 'No moves left',
          text: d.discarded + ' of 48 discarded.',
          score: d.discarded * 60
        });
      }
    }

    return Milo.arcade(host, {
      id: 'sol-aces-up',
      w: W, h: H, bg: '#26323e',
      stats: ['Discarded', 'Stock', 'Time'],
      emo: '♠️',
      start: {
        title: 'Aces Up',
        text: 'Deal four cards at a time. Discard any top card when a HIGHER card of ' +
          'the same suit shows on another column — aces are highest and never leave. ' +
          'Move a top card into an empty column to dig. Win with only the 4 aces left.',
        keys: ['Click a card to discard it', 'Click card then empty column', 'Click the stock to deal 4']
      },
      init: reset,
      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play' || g.data.won) return;
        var d = g.data;
        var s = stockXY();
        if (inBox(x, y, s.x, s.y, CW, CH)) {
          if (d.stock.length) {
            for (var i = 0; i < 4; i++) d.cols[i].push(d.stock.pop());
            g.set('Stock', d.stock.length);
            d.sel = null;
            Milo.sound.click();
            checkEnd(g);
          } else badTone();
          return;
        }
        for (var ci = 0; ci < 4; ci++) {
          var p = colXY(ci), col = d.cols[ci];
          if (!col.length) {
            if (inBox(x, y, p.x, p.y, CW, CH)) {
              if (d.sel != null && d.cols[d.sel].length) {
                d.cols[ci].push(d.cols[d.sel].pop());
                d.sel = null;
                goodTone();
                checkEnd(g);
              }
            }
            continue;
          }
          var o = offs(col);
          var cy = p.y + o[col.length - 1];
          if (inBox(x, y, p.x, p.y, CW, o[col.length - 1] + CH)) {
            if (!inBox(x, y, p.x, cy, CW, CH)) return;   // only the top card acts
            if (discardable(d, ci)) {
              col.pop();
              d.discarded++;
              d.sel = null;
              g.set('Discarded', d.discarded + '/48');
              Milo.sound.tone({ f: 500 + d.discarded * 10, d: .06, v: .06, type: 'triangle' });
              checkEnd(g);
            } else if (d.sel === ci) d.sel = null;
            else { d.sel = ci; Milo.sound.blip(); }
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
        tableBg(c, W, H, '#2c3947', '#161d25');
        c.fillStyle = 'rgba(255,255,255,.35)';
        c.font = '700 15px Outfit, sans-serif';
        c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText('ACES UP — aces are high and stay put', 24, 46);
        var s = stockXY();
        if (d.stock.length) {
          C.draw(c, d.stock[d.stock.length - 1], s.x, s.y, CW, CH, { faceUp: false });
          c.fillStyle = 'rgba(255,255,255,.6)';
          c.font = '700 13px Outfit, sans-serif';
          c.textAlign = 'left'; c.textBaseline = 'top';
          c.fillText(d.stock.length + ' left', s.x, s.y + CH + 8);
        } else C.slot(c, s.x, s.y, CW, CH, '×');
        for (var i = 0; i < 4; i++) {
          var p = colXY(i), col = d.cols[i];
          if (!col.length) {
            C.slot(c, p.x, p.y, CW, CH);
            if (d.sel != null) hintRect(c, p.x, p.y, CW, CH);
            continue;
          }
          var o = offs(col);
          for (var k = 0; k < col.length; k++) {
            var isTop = k === col.length - 1;
            C.draw(c, col[k], p.x, p.y + o[k], CW, CH, {
              faceUp: true,
              selected: isTop && d.sel === i,
              hint: isTop && discardable(d, i),
              dim: !isTop
            });
          }
        }
        footer(c, W, H, 'Green outline = can be discarded under a higher card of its suit');
      }
    });
  }

  Milo.register({
    id: 'sol-aces-up', title: 'Aces Up', emo: '♠️', category: 'Cards',
    tagline: 'Discard everything under the four aces',
    description: 'The anti-Klondike: no foundations, no building — you DISCARD. Deal four ' +
      'cards at a time onto four columns, and throw away any top card whenever a higher ' +
      'card of the same suit is showing; aces rank highest and never leave. A top card may ' +
      'move into an empty column, which is your only way to dig. Win by discarding all 48 ' +
      'non-aces. Tip: free a column before dealing — empty slots are worth more than tempo.',
    controls: ['Click a card to discard', 'Click card, then empty column', 'Click stock to deal'],
    colors: ['#26323e', '#f87171'],
    tags: ['solitaire', 'cards', 'quick', 'discard'],
    mount: mountAcesUp
  });

  /* ============================================================== CLOCK */
  function mountClock(host) {
    var W = 940, H = 640, CW = 66, CH = 92;
    var CX = W / 2, CY = H / 2 + 8, RX = 356, RY = 236;

    function pileXY(i) {
      if (i === 12) return { x: CX - CW / 2, y: CY - CH / 2 };
      var a = ((i + 1) * 30 - 90) * Math.PI / 180;    // rank i sits at hour i+1
      return { x: CX + RX * Math.cos(a) - CW / 2, y: CY + RY * Math.sin(a) - CH / 2 };
    }

    function reset(g) {
      var d = g.data;
      var deck = C.shuffled();
      d.down = []; d.up = [];
      for (var i = 0; i < 13; i++) {
        d.down.push([deck.pop(), deck.pop(), deck.pop(), deck.pop()]);
        d.up.push([]);
      }
      d.hand = d.down[12].pop();     // the game opens on the king pile
      d.placed = 0; d.time = 0; d.won = false;
      g.set('Placed', '0/52'); g.set('Kings', '0/4'); g.set('Time', '0:00');
    }

    function place(g) {
      var d = g.data, r = d.hand.r;
      d.up[r].push(d.hand);
      d.placed++;
      g.set('Placed', d.placed + '/52');
      g.set('Kings', d.up[12].length + '/4');
      if (d.down[r].length) {
        d.hand = d.down[r].pop();
        Milo.sound.tone({ f: 380 + d.placed * 8, d: .05, v: .06, type: 'triangle' });
        return;
      }
      // Nothing to draw — this is always the fourth king turning up.
      d.hand = null;
      d.won = true;
      if (d.placed === 52) {
        g.win({
          emo: '🕐', title: 'The clock struck!',
          text: 'All 52 cards home before the fourth king — a 1-in-13 shot.',
          score: Math.max(600, 4000 - Math.round(d.time) * 5)
        });
      } else {
        g.gameOver({
          emo: '🕐', title: 'Fourth king too soon',
          text: d.placed + ' of 52 placed when the last king surfaced.',
          score: d.placed * 30
        });
      }
    }

    return Milo.arcade(host, {
      id: 'sol-clock',
      w: W, h: H, bg: '#2a1f3d',
      stats: ['Placed', 'Kings', 'Time'],
      emo: '🕐',
      start: {
        title: 'Clock Solitaire',
        text: 'Thirteen face-down piles laid out as a clock — Ace at 1 through Queen at ' +
          '12, Kings in the middle. Tuck the card in hand under the pile matching its ' +
          'rank, then flip that pile’s top card. You win if everything turns face up ' +
          'before the fourth king appears.',
        keys: ['Click the matching pile', 'Click the hand card to auto-place']
      },
      init: reset,
      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data;
        if (!d.hand) return;
        // Clicking the card in hand plays it to its (only legal) pile.
        if (inBox(x, y, 20, H - CH - 24, CW, CH)) { place(g); return; }
        for (var i = 0; i < 13; i++) {
          var p = pileXY(i);
          if (inBox(x, y, p.x - 4, p.y - 4, CW + 22, CH + 22)) {
            if (i === d.hand.r) place(g);
            else badTone();
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
        tableBg(c, W, H, '#332450', '#191129');
        for (var i = 0; i < 13; i++) {
          var p = pileXY(i);
          var top = topOf(d.up[i]);
          if (top) C.draw(c, top, p.x + 14, p.y + 14, CW, CH, { faceUp: true, dim: !!d.down[i].length });
          if (d.down[i].length) C.draw(c, d.down[i][d.down[i].length - 1], p.x, p.y, CW, CH, { faceUp: false });
          else if (!top) C.slot(c, p.x, p.y, CW, CH, i === 12 ? '♚' : C.RANKS[i]);
          if (d.hand && d.hand.r === i) hintRect(c, p.x - 3, p.y - 3, CW + 6, CH + 6);
          c.fillStyle = 'rgba(255,255,255,.45)';
          c.font = '700 12px Outfit, sans-serif';
          c.textAlign = 'center'; c.textBaseline = 'top';
          c.fillText((i === 12 ? 'K' : C.RANKS[i]) + ' · ' + d.up[i].length + '/4',
            p.x + CW / 2 + 7, p.y + CH + 18);
        }
        if (d.hand) {
          c.fillStyle = 'rgba(255,255,255,.5)';
          c.font = '700 13px Outfit, sans-serif';
          c.textAlign = 'left'; c.textBaseline = 'bottom';
          c.fillText('In hand → ' + C.RANKS[d.hand.r] + ' pile', 20, H - CH - 32);
          C.draw(c, d.hand, 20, H - CH - 24, CW, CH, { faceUp: true, selected: true });
        }
        c.fillStyle = 'rgba(255,255,255,.42)';
        c.font = '600 12px Outfit, sans-serif';
        c.textAlign = 'left'; c.textBaseline = 'top';
        c.fillText('The green pile is where the card in hand goes', 20, 14);
      }
    });
  }

  Milo.register({
    id: 'sol-clock', title: 'Clock Solitaire', emo: '🕐', category: 'Cards',
    tagline: 'Race the fourth king around the dial',
    description: 'Nothing like Klondike: no building at all. Four face-down cards sit on ' +
      'each hour of a clock face (Ace = 1 o’clock up to Queen = 12) with the Kings in ' +
      'the centre. Each card you turn is tucked under the pile matching its rank, and you ' +
      'flip that pile’s top card next. When the fourth king surfaces the game ends — ' +
      'you win only if all 52 cards are already face up, a genuine 1-in-13 chance. Pure ' +
      'luck by design, so the real game is beating your fastest winning run.',
    controls: ['Click the matching pile', 'Click the hand card'],
    colors: ['#2a1f3d', '#c084fc'],
    tags: ['solitaire', 'cards', 'luck', 'clock', 'quick'],
    mount: mountClock
  });

  /* =========================================================== CANFIELD */
  function mountCanfield(host) {
    var W = 940, H = 640, CW = 84, CH = 118, GAP = 14;
    var TAB_Y = GAP + CH + 34, AVAIL = H - TAB_Y - CH - 24;

    function stockXY() { return { x: GAP, y: GAP }; }
    function wasteXY() { return { x: GAP + CW + GAP, y: GAP }; }
    function foundXY(i) { return { x: GAP + (3 + i) * (CW + GAP), y: GAP }; }
    function reserveXY() { return { x: GAP, y: TAB_Y }; }
    function tabXY(i) { return { x: GAP + (3 + i) * (CW + GAP), y: TAB_Y }; }
    function offs(pile) { return fanOffsets(pile, AVAIL, 24, 24); }

    function reset(g) {
      var d = g.data;
      var deck = C.shuffled();
      d.reserve = deck.splice(0, 13);
      var base = deck.pop();
      d.base = base.r;
      d.found = [[], [], [], []];
      d.found[base.s].push(base);
      d.tab = [];
      for (var i = 0; i < 4; i++) d.tab.push([deck.pop()]);
      d.stock = deck;                // 34 cards, dealt three at a time
      d.waste = [];
      d.sel = null; d.moves = 0; d.time = 0; d.won = false;
      g.set('Reserve', 13); g.set('Foundations', '1/52'); g.set('Time', '0:00');
    }

    /** Foundations build up BY SUIT from the base rank, wrapping K→A. */
    function canFound(d, card, pile) {
      if (pile.length >= 13) return false;
      if (!pile.length) return card.r === d.base;
      var t = pile[pile.length - 1];
      return t.s === card.s && card.r === (t.r + 1) % 13;
    }
    /** Tableau builds down, alternating colours, wrapping A→K. */
    function canTab(d, card, onto) {
      if (!onto) return !d.reserve.length;   // spaces belong to the reserve first
      return C.isRed(card) !== C.isRed(onto) && card.r === (onto.r + 12) % 13;
    }

    function refill(d, g) {
      for (var i = 0; i < 4; i++) {
        if (!d.tab[i].length && d.reserve.length) d.tab[i].push(d.reserve.pop());
      }
      g.set('Reserve', d.reserve.length);
    }

    function selTop(d, s) {
      if (s.kind === 'waste') return topOf(d.waste);
      if (s.kind === 'reserve') return topOf(d.reserve);
      if (s.kind === 'found') return topOf(d.found[s.i]);
      return topOf(d.tab[s.i]);
    }
    function takeTop(d, s) {
      if (s.kind === 'waste') return d.waste.pop();
      if (s.kind === 'reserve') return d.reserve.pop();
      if (s.kind === 'found') return d.found[s.i].pop();
      return d.tab[s.i].pop();
    }

    function checkWin(g) {
      var d = g.data, n = pileSum(d.found);
      g.set('Foundations', n + '/52');
      if (n === 52 && !d.won) {
        d.won = true;
        g.win({
          emo: '🎰', title: 'Canfield beaten!',
          text: d.moves + ' moves in ' + U.time(d.time) + ' — the casino rarely paid this out.',
          score: Math.max(300, 9000 - d.moves * 12 - Math.round(d.time) * 6)
        });
      }
    }

    function moveTo(g, target) {
      var d = g.data, s = d.sel;
      if (!s) return false;
      if (target.kind === 'found') {
        var card = selTop(d, s);
        if (s.kind === 'found' || !card || !canFound(d, card, d.found[target.i])) return false;
        takeTop(d, s);
        d.found[target.i].push(card);
      } else if (target.kind === 'tab') {
        var onto = topOf(d.tab[target.i]);
        if (s.kind === 'tab') {
          if (s.i === target.i) return false;
          var pile = d.tab[s.i];
          if (!pile.length || !onto || !canTab(d, pile[0], onto)) return false;   // whole piles only
          d.tab[target.i] = d.tab[target.i].concat(pile);
          d.tab[s.i] = [];
        } else {
          var c1 = selTop(d, s);
          if (!c1 || !canTab(d, c1, onto)) return false;
          if (!onto && s.kind !== 'waste') return false;   // only the waste may fill a space
          takeTop(d, s);
          d.tab[target.i].push(c1);
        }
      } else return false;
      d.moves++;
      refill(d, g);
      d.sel = null;
      goodTone();
      checkWin(g);
      return true;
    }

    function autoPlay(g, from) {
      var d = g.data, card = selTop(d, from);
      if (!card) return false;
      for (var i = 0; i < 4; i++) {
        if (canFound(d, card, d.found[i])) {
          d.sel = from;
          return moveTo(g, { kind: 'found', i: i });
        }
      }
      return false;
    }

    function hit(d, x, y) {
      var p = stockXY();
      if (inBox(x, y, p.x, p.y, CW, CH)) return { kind: 'stock' };
      p = wasteXY();
      if (d.waste.length && inBox(x, y, p.x, p.y, CW + 44, CH)) return { kind: 'waste' };
      for (var f = 0; f < 4; f++) {
        p = foundXY(f);
        if (inBox(x, y, p.x, p.y, CW, CH)) return { kind: 'found', i: f };
      }
      p = reserveXY();
      if (d.reserve.length && inBox(x, y, p.x, p.y, CW, CH)) return { kind: 'reserve' };
      for (var t = 0; t < 4; t++) {
        p = tabXY(t);
        var pile = d.tab[t];
        var span = pile.length ? offs(pile)[pile.length - 1] + CH : CH;
        if (inBox(x, y, p.x, p.y, CW, span)) return { kind: 'tab', i: t };
      }
      return null;
    }

    return Milo.arcade(host, {
      id: 'sol-canfield',
      w: W, h: H, bg: '#0e3b3b',
      stats: ['Reserve', 'Foundations', 'Time'],
      emo: '🎰',
      start: {
        title: 'Canfield',
        text: 'Foundations start at a random rank and build up by suit, wrapping King to ' +
          'Ace. The tableau builds down in alternating colours (also wrapping) and piles ' +
          'move as WHOLE units. Empty spots refill from the 13-card reserve. Stock deals ' +
          'three at a time, unlimited redeals.',
        keys: ['Click a pile, then its destination', 'Double-click sends to foundation', 'Click stock to deal 3']
      },
      init: reset,
      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data;
        var h = hit(d, x, y);
        if (!h) { d.sel = null; return; }
        if (h.kind === 'stock') {
          if (d.stock.length) {
            for (var i = 0; i < 3 && d.stock.length; i++) d.waste.push(d.stock.pop());
            Milo.sound.click();
          } else if (d.waste.length) {
            d.stock = d.waste.reverse();
            d.waste = [];
            Milo.sound.click();
          }
          d.sel = null;
          return;
        }
        if (isDouble(d, x, y) && h.kind !== 'found') {
          if (autoPlay(g, h)) return;
        }
        if (d.sel) {
          if (moveTo(g, h)) return;
          d.sel = null;
        }
        if (h.kind !== 'found' && selTop(d, h)) { d.sel = h; Milo.sound.blip(); }
      },
      update: function (g, dt) {
        var d = g.data;
        if (d.won) return;
        d.time += dt;
        g.set('Time', U.time(d.time));
      },
      draw: function (g) {
        var c = g.ctx, d = g.data, p, i;
        tableBg(c, W, H, '#124a48', '#082423');
        p = stockXY();
        if (d.stock.length) C.draw(c, d.stock[d.stock.length - 1], p.x, p.y, CW, CH, { faceUp: false });
        else C.slot(c, p.x, p.y, CW, CH, '↻');
        p = wasteXY();
        if (d.waste.length) {
          var n = Math.min(3, d.waste.length);
          for (i = n; i >= 1; i--) {
            C.draw(c, d.waste[d.waste.length - i], p.x + (n - i) * 22, p.y, CW, CH, {
              faceUp: true, dim: i > 1,
              selected: i === 1 && d.sel && d.sel.kind === 'waste'
            });
          }
        } else C.slot(c, p.x, p.y, CW, CH);
        for (var f = 0; f < 4; f++) {
          p = foundXY(f);
          if (d.found[f].length) C.draw(c, topOf(d.found[f]), p.x, p.y, CW, CH, { faceUp: true });
          else C.slot(c, p.x, p.y, CW, CH, C.RANKS[d.base]);
        }
        c.fillStyle = 'rgba(255,255,255,.45)';
        c.font = '700 13px Outfit, sans-serif';
        c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText('Foundations build up from ' + C.RANKS[d.base] + ', wrapping', GAP, TAB_Y - 14);
        p = reserveXY();
        if (d.reserve.length) {
          if (d.reserve.length > 1) C.draw(c, d.reserve[0], p.x + 5, p.y + 4, CW, CH, { faceUp: false });
          C.draw(c, topOf(d.reserve), p.x, p.y, CW, CH, {
            faceUp: true, selected: d.sel && d.sel.kind === 'reserve'
          });
          c.fillStyle = 'rgba(255,255,255,.6)';
          c.font = '700 13px Outfit, sans-serif';
          c.textAlign = 'left'; c.textBaseline = 'top';
          c.fillText('Reserve · ' + d.reserve.length, p.x, p.y + CH + 10);
        } else C.slot(c, p.x, p.y, CW, CH, '·');
        for (var t = 0; t < 4; t++) {
          p = tabXY(t);
          var pile = d.tab[t];
          if (!pile.length) { C.slot(c, p.x, p.y, CW, CH); continue; }
          var selAll = (d.sel && d.sel.kind === 'tab' && d.sel.i === t) ? 0 : null;
          drawFan(c, pile, offs(pile), p.x, p.y, CW, CH, selAll);
        }
        footer(c, W, H, 'Tableau piles move as whole units · sequences wrap around the corner');
      }
    });
  }

  Milo.register({
    id: 'sol-canfield', title: 'Canfield', emo: '🎰', category: 'Cards',
    tagline: 'The casino game with a wrapping twist',
    description: 'Three twists on Klondike, straight from Canfield’s 1890s casino: the ' +
      'foundations start at a random base rank and build up by suit WRAPPING King to Ace; ' +
      'tableau sequences wrap too and move only as whole piles; and a 13-card reserve ' +
      'feeds every space that opens up. The stock turns three at a time with unlimited ' +
      'redeals. Famously stingy — the casino paid out on ~10 foundation cards. ' +
      'Tip: burn the reserve down first; it is the only pile you cannot reorganise.',
    controls: ['Click a pile, then a spot', 'Double-click to auto-play', 'Click stock to deal'],
    colors: ['#0e3b3b', '#2dd4bf'],
    tags: ['solitaire', 'cards', 'patience', 'casino'],
    mount: mountCanfield
  });

  /* ======================================================= BAKER'S DOZEN */
  function mountBakersDozen(host) {
    var W = 940, H = 640, CW = 62, CH = 88, STEP = 70, MX = 19;
    var TAB_Y = 12 + CH + 24, AVAIL = H - TAB_Y - CH - 22;

    function foundXY(i) { return { x: W - MX - (4 - i) * STEP + 8, y: 12 }; }
    function colXY(i) { return { x: MX + i * STEP, y: TAB_Y }; }
    function offs(pile) { return fanOffsets(pile, AVAIL, 24, 24); }

    function reset(g) {
      var d = g.data;
      var deck = C.shuffled();
      d.tab = [];
      for (var i = 0; i < 13; i++) {
        var pile = [deck.pop(), deck.pop(), deck.pop(), deck.pop()];
        // Kings sink to the bottom of their column so nothing rots beneath them.
        var kings = pile.filter(function (c) { return c.r === 12; });
        var rest = pile.filter(function (c) { return c.r !== 12; });
        d.tab.push(kings.concat(rest));
      }
      d.found = [[], [], [], []];
      d.sel = null; d.moves = 0; d.time = 0; d.won = false;
      g.set('Moves', 0); g.set('Foundations', '0/52'); g.set('Time', '0:00');
    }

    function checkWin(g) {
      var d = g.data, n = pileSum(d.found);
      g.set('Foundations', n + '/52');
      if (n === 52 && !d.won) {
        d.won = true;
        g.win({
          emo: '🥖', title: 'All thirteen cleared!',
          text: d.moves + ' moves in ' + U.time(d.time) + '.',
          score: Math.max(300, 8000 - d.moves * 10 - Math.round(d.time) * 6)
        });
        return true;
      }
      return false;
    }

    function checkStuck(g) {
      var d = g.data;
      var tops = [], i, j;
      for (i = 0; i < 13; i++) if (d.tab[i].length) tops.push(topOf(d.tab[i]));
      for (i = 0; i < tops.length; i++) {
        for (j = 0; j < 4; j++) if (canFoundStd(tops[i], d.found[j])) return;
        for (j = 0; j < tops.length; j++) {
          if (i !== j && tops[i].r === tops[j].r - 1) return;
        }
      }
      d.won = true;
      g.gameOver({
        emo: '🥖', title: 'No moves left',
        text: pileSum(d.found) + ' of 52 on the foundations.',
        score: pileSum(d.found) * 40
      });
    }

    function moveTo(g, target) {
      var d = g.data, s = d.sel;
      if (!s) return false;
      var card = topOf(d.tab[s.i]);
      if (!card) return false;
      if (target.kind === 'found') {
        if (!canFoundStd(card, d.found[target.i])) return false;
        d.tab[s.i].pop();
        d.found[target.i].push(card);
      } else if (target.kind === 'tab') {
        var onto = topOf(d.tab[target.i]);
        if (!onto || target.i === s.i) return false;     // spaces stay empty for good
        if (card.r !== onto.r - 1) return false;         // down by one, ANY suit
        d.tab[s.i].pop();
        d.tab[target.i].push(card);
      } else return false;
      d.moves++;
      g.set('Moves', d.moves);
      d.sel = null;
      goodTone();
      if (!checkWin(g)) checkStuck(g);
      return true;
    }

    function hit(d, x, y) {
      var f, p;
      for (f = 0; f < 4; f++) {
        p = foundXY(f);
        if (inBox(x, y, p.x, p.y, CW, CH)) return { kind: 'found', i: f };
      }
      for (var t = 0; t < 13; t++) {
        p = colXY(t);
        var pile = d.tab[t];
        if (!pile.length) continue;
        var span = offs(pile)[pile.length - 1] + CH;
        if (inBox(x, y, p.x, p.y, CW, span)) return { kind: 'tab', i: t };
      }
      return null;
    }

    return Milo.arcade(host, {
      id: 'sol-bakers-dozen',
      w: W, h: H, bg: '#3b2f14',
      stats: ['Moves', 'Foundations', 'Time'],
      emo: '🥖',
      start: {
        title: 'Baker’s Dozen',
        text: 'Thirteen columns, every card face up, no stock. Build down by ONE rank in ' +
          'any suit, one card at a time. Kings were dealt to the bottom of their columns. ' +
          'Emptied columns can never be refilled, so plan before you strip one.',
        keys: ['Click a column, then another', 'Double-click sends to foundation']
      },
      init: reset,
      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play' || g.data.won) return;
        var d = g.data;
        var h = hit(d, x, y);
        if (!h) { d.sel = null; return; }
        if (isDouble(d, x, y) && h.kind === 'tab') {
          var card = topOf(d.tab[h.i]);
          if (card) {
            for (var i = 0; i < 4; i++) {
              if (canFoundStd(card, d.found[i])) {
                d.sel = h;
                if (moveTo(g, { kind: 'found', i: i })) return;
              }
            }
          }
        }
        if (d.sel) {
          if (moveTo(g, h)) return;
          d.sel = null;
        }
        if (h.kind === 'tab') { d.sel = h; Milo.sound.blip(); }
      },
      update: function (g, dt) {
        var d = g.data;
        if (d.won) return;
        if (!d.checkedDeal) { d.checkedDeal = true; checkStuck(g); }
        d.time += dt;
        g.set('Time', U.time(d.time));
      },
      draw: function (g) {
        var c = g.ctx, d = g.data, p;
        tableBg(c, W, H, '#4a3c1c', '#241c0a');
        c.fillStyle = 'rgba(255,255,255,.35)';
        c.font = '700 15px Outfit, sans-serif';
        c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText('BAKER’S DOZEN — down by one, any suit, one card at a time', MX, 12 + CH / 2);
        for (var f = 0; f < 4; f++) {
          p = foundXY(f);
          if (d.found[f].length) C.draw(c, topOf(d.found[f]), p.x, p.y, CW, CH, { faceUp: true });
          else C.slot(c, p.x, p.y, CW, CH, C.SUITS[f]);
        }
        for (var t = 0; t < 13; t++) {
          p = colXY(t);
          var pile = d.tab[t];
          if (!pile.length) { C.slot(c, p.x, p.y, CW, CH); continue; }
          var o = offs(pile);
          for (var k = 0; k < pile.length; k++) {
            var isTop = k === pile.length - 1;
            C.draw(c, pile[k], p.x, p.y + o[k], CW, CH, {
              faceUp: true,
              selected: isTop && d.sel && d.sel.kind === 'tab' && d.sel.i === t
            });
          }
        }
        footer(c, W, H, 'Only top cards move · emptied columns are gone for good');
      }
    });
  }

  Milo.register({
    id: 'sol-bakers-dozen', title: 'Baker’s Dozen', emo: '🥖', category: 'Cards',
    tagline: 'Thirteen open columns, no second chances',
    description: 'Everything is face up from the deal — thirteen columns of four with the ' +
      'Kings pre-sunk to the bottoms. Unlike Klondike you build down by rank in ANY suit, ' +
      'move strictly one card at a time, and an emptied column can never be refilled. ' +
      'Foundations run Ace to King by suit as usual. With full information it is very ' +
      'winnable, but one careless burial locks the game. Tip: before moving a card, check ' +
      'you are not covering the next card a foundation needs.',
    controls: ['Click a column, then another', 'Double-click to auto-play'],
    colors: ['#3b2f14', '#fbbf24'],
    tags: ['solitaire', 'cards', 'patience', 'open'],
    mount: mountBakersDozen
  });

  /* ======================================================= FORTY THIEVES */
  function mountFortyThieves(host) {
    var W = 940, H = 640, CW = 82, CH = 110, STEP = 92, MX = 15;
    var TAB_Y = 12 + CH + 26, AVAIL = H - TAB_Y - CH - 20;

    function topXY(i) { return { x: MX + i * STEP, y: 12 }; }   // 0 stock, 1 waste, 2-9 founds
    function colXY(i) { return { x: MX + i * STEP, y: TAB_Y }; }
    function offs(pile) { return fanOffsets(pile, AVAIL, 24, 24); }

    function reset(g) {
      var d = g.data;
      var deck = C.shuffled(2);          // two full decks
      d.tab = [];
      for (var i = 0; i < 10; i++) {
        d.tab.push([deck.pop(), deck.pop(), deck.pop(), deck.pop()]);
      }
      d.stock = deck;                    // 64 cards
      d.waste = [];
      d.found = [[], [], [], [], [], [], [], []];
      d.sel = null; d.moves = 0; d.time = 0; d.won = false;
      g.set('Stock', 64); g.set('Foundations', '0/104'); g.set('Time', '0:00');
    }

    function canTab(card, onto) {
      if (!onto) return true;                       // any card may fill a space
      return card.s === onto.s && card.r === onto.r - 1;   // down by SAME suit
    }

    function checkWin(g) {
      var d = g.data, n = pileSum(d.found);
      g.set('Foundations', n + '/104');
      if (n === 104 && !d.won) {
        d.won = true;
        g.win({
          emo: '💰', title: 'The forty thieves are beaten!',
          text: d.moves + ' moves in ' + U.time(d.time) + ' — a rare win.',
          score: Math.max(500, 12000 - d.moves * 10 - Math.round(d.time) * 5)
        });
        return true;
      }
      return false;
    }

    function checkStuck(g) {
      var d = g.data;
      if (d.won || d.stock.length) return;
      var tops = [], i, j;
      for (i = 0; i < 10; i++) {
        if (d.tab[i].length) tops.push(topOf(d.tab[i]));
        else if (d.waste.length || tops.length || anyCard(d)) return;   // a space + any card = a move
      }
      if (d.waste.length) tops.push(topOf(d.waste));
      for (i = 0; i < tops.length; i++) {
        for (j = 0; j < 8; j++) if (canFoundStd(tops[i], d.found[j])) return;
        for (j = 0; j < tops.length; j++) {
          if (i !== j && tops[i].s === tops[j].s && tops[i].r === tops[j].r - 1) return;
        }
      }
      d.won = true;
      g.gameOver({
        emo: '💰', title: 'No moves left',
        text: pileSum(d.found) + ' of 104 banked.',
        score: pileSum(d.found) * 30
      });
    }
    function anyCard(d) {
      for (var i = 0; i < 10; i++) if (d.tab[i].length) return true;
      return false;
    }

    function moveTo(g, target) {
      var d = g.data, s = d.sel;
      if (!s) return false;
      var card = s.kind === 'waste' ? topOf(d.waste) : topOf(d.tab[s.i]);
      if (!card) return false;
      if (target.kind === 'found') {
        if (!canFoundStd(card, d.found[target.i])) return false;
        (s.kind === 'waste' ? d.waste : d.tab[s.i]).pop();
        d.found[target.i].push(card);
      } else if (target.kind === 'tab') {
        if (s.kind === 'tab' && s.i === target.i) return false;
        if (!canTab(card, topOf(d.tab[target.i]))) return false;
        (s.kind === 'waste' ? d.waste : d.tab[s.i]).pop();
        d.tab[target.i].push(card);
      } else return false;
      d.moves++;
      d.sel = null;
      goodTone();
      if (!checkWin(g)) checkStuck(g);
      return true;
    }

    function hit(d, x, y) {
      var p = topXY(0);
      if (inBox(x, y, p.x, p.y, CW, CH)) return { kind: 'stock' };
      p = topXY(1);
      if (inBox(x, y, p.x, p.y, CW, CH)) return { kind: 'waste' };
      for (var f = 0; f < 8; f++) {
        p = topXY(2 + f);
        if (inBox(x, y, p.x, p.y, CW, CH)) return { kind: 'found', i: f };
      }
      for (var t = 0; t < 10; t++) {
        p = colXY(t);
        var pile = d.tab[t];
        var span = pile.length ? offs(pile)[pile.length - 1] + CH : CH;
        if (inBox(x, y, p.x, p.y, CW, span)) return { kind: 'tab', i: t };
      }
      return null;
    }

    return Milo.arcade(host, {
      id: 'sol-forty-thieves',
      w: W, h: H, bg: '#1b2440',
      stats: ['Stock', 'Foundations', 'Time'],
      emo: '💰',
      start: {
        title: 'Forty Thieves',
        text: 'Two decks, eight foundations. The tableau builds down by the SAME suit ' +
          'and only one card moves at a time. Any card may fill a space. The stock ' +
          'deals one card to the waste with NO redeal, so spend it carefully.',
        keys: ['Click a card, then its destination', 'Double-click sends to foundation', 'Click stock to deal 1']
      },
      init: reset,
      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play' || g.data.won) return;
        var d = g.data;
        var h = hit(d, x, y);
        if (!h) { d.sel = null; return; }
        if (h.kind === 'stock') {
          if (d.stock.length) {
            d.waste.push(d.stock.pop());
            g.set('Stock', d.stock.length);
            Milo.sound.click();
            checkStuck(g);
          } else badTone();
          d.sel = null;
          return;
        }
        if (isDouble(d, x, y) && (h.kind === 'waste' || h.kind === 'tab')) {
          var card = h.kind === 'waste' ? topOf(d.waste) : topOf(d.tab[h.i]);
          if (card) {
            for (var i = 0; i < 8; i++) {
              if (canFoundStd(card, d.found[i])) {
                d.sel = h;
                if (moveTo(g, { kind: 'found', i: i })) return;
              }
            }
          }
        }
        if (d.sel) {
          if (moveTo(g, h)) return;
          d.sel = null;
        }
        if (h.kind === 'waste' && d.waste.length) { d.sel = h; Milo.sound.blip(); }
        else if (h.kind === 'tab' && d.tab[h.i].length) { d.sel = h; Milo.sound.blip(); }
      },
      update: function (g, dt) {
        var d = g.data;
        if (d.won) return;
        d.time += dt;
        g.set('Time', U.time(d.time));
      },
      draw: function (g) {
        var c = g.ctx, d = g.data, p;
        tableBg(c, W, H, '#212c4e', '#101527');
        p = topXY(0);
        if (d.stock.length) {
          C.draw(c, d.stock[d.stock.length - 1], p.x, p.y, CW, CH, { faceUp: false });
          c.fillStyle = 'rgba(255,255,255,.7)';
          c.font = '700 13px Outfit, sans-serif';
          c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText(String(d.stock.length), p.x + CW / 2, p.y + CH / 2);
        } else C.slot(c, p.x, p.y, CW, CH, '×');
        p = topXY(1);
        if (d.waste.length) {
          C.draw(c, topOf(d.waste), p.x, p.y, CW, CH, {
            faceUp: true, selected: d.sel && d.sel.kind === 'waste'
          });
        } else C.slot(c, p.x, p.y, CW, CH);
        for (var f = 0; f < 8; f++) {
          p = topXY(2 + f);
          if (d.found[f].length) C.draw(c, topOf(d.found[f]), p.x, p.y, CW, CH, { faceUp: true });
          else C.slot(c, p.x, p.y, CW, CH, C.SUITS[f % 4]);
        }
        for (var t = 0; t < 10; t++) {
          p = colXY(t);
          var pile = d.tab[t];
          if (!pile.length) { C.slot(c, p.x, p.y, CW, CH); continue; }
          var o = offs(pile);
          for (var k = 0; k < pile.length; k++) {
            var isTop = k === pile.length - 1;
            C.draw(c, pile[k], p.x, p.y + o[k], CW, CH, {
              faceUp: true,
              selected: isTop && d.sel && d.sel.kind === 'tab' && d.sel.i === t
            });
          }
        }
        footer(c, W, H, 'Down by same suit, one card at a time · the stock never recycles');
      }
    });
  }

  Milo.register({
    id: 'sol-forty-thieves', title: 'Forty Thieves', emo: '💰', category: 'Cards',
    tagline: 'Two decks, same-suit builds, no mercy',
    description: 'The double-deck classic, harder than Klondike in three ways: the ten ' +
      'tableau columns build down by the SAME suit instead of alternating colours, only ' +
      'one card ever moves at a time, and the stock deals singly with no redeal. Eight ' +
      'foundations climb Ace to King, and any card may claim an empty column. Napoleon ' +
      'supposedly played it in exile. Tip: don’t deal from the stock while any tableau ' +
      'move remains — every buried waste card is usually buried forever.',
    controls: ['Click a card, then a spot', 'Double-click to auto-play', 'Click stock to deal'],
    colors: ['#1b2440', '#818cf8'],
    tags: ['solitaire', 'cards', 'two decks', 'hard', 'patience'],
    mount: mountFortyThieves
  });

  /* ========================================================== EASTHAVEN */
  function mountEasthaven(host) {
    var W = 940, H = 640, CW = 84, CH = 118, GAP = 14;
    var TAB_Y = GAP + CH + 28, AVAIL = H - TAB_Y - CH - 20;

    function stockXY() { return { x: GAP, y: GAP }; }
    function foundXY(i) { return { x: GAP + (3 + i) * (CW + GAP), y: GAP }; }
    function tabXY(i) { return { x: GAP + i * (CW + GAP), y: TAB_Y }; }
    function offs(pile) { return fanOffsets(pile, AVAIL, 24, 11); }

    function reset(g) {
      var d = g.data;
      var deck = C.shuffled();
      d.tab = [];
      for (var i = 0; i < 7; i++) {
        var pile = [], c, j;
        for (j = 0; j < 2; j++) { c = deck.pop(); c.up = false; pile.push(c); }
        c = deck.pop(); c.up = true; pile.push(c);
        d.tab.push(pile);
      }
      d.stock = deck;          // 31 cards; each deal drops one on every column
      d.found = [[], [], [], []];
      d.sel = null; d.moves = 0; d.time = 0; d.won = false;
      g.set('Stock', 31); g.set('Foundations', '0/52'); g.set('Time', '0:00');
    }

    function canStack(card, onto) {
      if (!onto) return card.r === 12;    // spaces take a King (or King-led run)
      return onto.up && C.isRed(card) !== C.isRed(onto) && card.r === onto.r - 1;
    }

    function checkWin(g) {
      var d = g.data, n = pileSum(d.found);
      g.set('Foundations', n + '/52');
      if (n === 52 && !d.won) {
        d.won = true;
        g.win({
          emo: '⚓', title: 'Harbour cleared!',
          text: d.moves + ' moves in ' + U.time(d.time) + '.',
          score: Math.max(300, 8500 - d.moves * 12 - Math.round(d.time) * 6)
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
        if (s.kind === 'tab' && s.i === target.i) return false;
        if (!canStack(cards[0], topOf(d.tab[target.i]))) return false;
        take(d, s);
        d.tab[target.i] = d.tab[target.i].concat(cards);
      } else return false;
      d.moves++;
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
      var p = stockXY();
      if (inBox(x, y, p.x, p.y, CW, CH)) return { kind: 'stock' };
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
        var k = hitFan(pile, offs(pile), x, y, p.x, p.y, CW, CH);
        if (k >= 0) {
          if (!pile[k].up) return { kind: 'tab', i: t, at: k, cards: null };
          return { kind: 'tab', i: t, at: k, cards: pile.slice(k) };
        }
      }
      return null;
    }

    return Milo.arcade(host, {
      id: 'sol-easthaven',
      w: W, h: H, bg: '#123d2a',
      stats: ['Stock', 'Foundations', 'Time'],
      emo: '⚓',
      start: {
        title: 'Easthaven',
        text: 'Klondike rules on the columns — build down in alternating colours, move ' +
          'ordered runs, Kings claim spaces. But there is no waste pile: the stock deals ' +
          'a card onto EVERY column at once, and it never recycles. Tidy up before you deal.',
        keys: ['Click to select', 'Click again to move', 'Click stock to deal a row']
      },
      init: reset,
      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data;
        var h = hit(d, x, y);
        if (!h) { d.sel = null; return; }
        if (h.kind === 'stock') {
          if (d.stock.length) {
            for (var i = 0; i < 7 && d.stock.length; i++) {
              var c = d.stock.pop();
              c.up = true;
              d.tab[i].push(c);
            }
            d.moves++;
            g.set('Stock', d.stock.length);
            Milo.sound.click();
          } else badTone();
          d.sel = null;
          return;
        }
        if (isDouble(d, x, y) && h.cards && h.cards.length === 1 && h.kind === 'tab') {
          for (var f = 0; f < 4; f++) {
            if (canFoundStd(h.cards[0], d.found[f])) {
              d.sel = h;
              if (moveTo(g, { kind: 'found', i: f })) return;
            }
          }
        }
        if (d.sel) {
          if (moveTo(g, h)) return;
          d.sel = null;
        }
        if (h.cards && h.cards.length) {
          var ok = true;    // only properly ordered alternating runs travel
          for (var k = 1; k < h.cards.length; k++) {
            var a = h.cards[k - 1], b = h.cards[k];
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
        var c = g.ctx, d = g.data, p;
        tableBg(c, W, H, '#164a33', '#0a2418');
        p = stockXY();
        if (d.stock.length) {
          C.draw(c, d.stock[d.stock.length - 1], p.x, p.y, CW, CH, { faceUp: false });
          c.fillStyle = 'rgba(255,255,255,.7)';
          c.font = '700 13px Outfit, sans-serif';
          c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText(String(d.stock.length), p.x + CW / 2, p.y + CH / 2);
        } else C.slot(c, p.x, p.y, CW, CH, '×');
        c.fillStyle = 'rgba(255,255,255,.4)';
        c.font = '700 13px Outfit, sans-serif';
        c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText('deals to all 7', p.x + CW + 10, p.y + CH / 2);
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
        footer(c, W, H, 'Each stock deal buries every column under one more card — clear runs first');
      }
    });
  }

  Milo.register({
    id: 'sol-easthaven', title: 'Easthaven', emo: '⚓', category: 'Cards',
    tagline: 'Klondike columns, Spider-style deals',
    description: 'The columns play exactly like Klondike — alternating colours downward, ' +
      'ordered runs move together, only Kings settle on spaces. The twist is the stock: ' +
      'there is no waste pile, and each click deals a fresh card face-up onto EVERY ' +
      'column at once with no redeal, exactly like Spider. Each deal buries your careful ' +
      'runs, so squeeze out every move first. Tip: hold deals until no aces or builds ' +
      'remain, and keep one short column as a landing strip.',
    controls: ['Click to select', 'Click to place', 'Double-click to auto-play'],
    colors: ['#123d2a', '#4ade80'],
    tags: ['solitaire', 'cards', 'patience', 'spider-like'],
    mount: mountEasthaven
  });

  /* =========================================================== TRI PEAKS */
  function mountTriPeaks(host) {
    var W = 940, H = 600, CW = 84, CH = 112, HALF = 42, ROW_DY = 58, MX = 50, TOP_Y = 56;
    var SLOTS = (function () {
      var s = [], i;
      var r0 = [3, 9, 15], r1 = [2, 4, 8, 10, 14, 16];
      for (i = 0; i < r0.length; i++) s.push({ row: 0, s2: r0[i] });
      for (i = 0; i < r1.length; i++) s.push({ row: 1, s2: r1[i] });
      for (i = 1; i <= 17; i += 2) s.push({ row: 2, s2: i });
      for (i = 0; i <= 18; i += 2) s.push({ row: 3, s2: i });
      return s;    // 3 + 6 + 9 + 10 = 28 board positions
    })();
    function slotXY(sl) { return { x: MX + sl.s2 * HALF, y: TOP_Y + sl.row * ROW_DY }; }
    function wasteXY() { return { x: W / 2 - CW / 2, y: H - CH - 44 }; }
    function stockXY() { return { x: W / 2 - CW / 2 - CW - 36, y: H - CH - 44 }; }

    function reset(g) {
      var d = g.data;
      var deck = C.shuffled();
      d.board = [];
      for (var i = 0; i < 28; i++) d.board.push({ card: deck.pop(), gone: false });
      d.waste = [deck.pop()];
      d.stock = deck;             // 23 cards
      d.left = 28; d.streak = 0; d.pts = 0; d.time = 0; d.won = false;
      g.set('Score', 0); g.set('Streak', 0); g.set('Stock', d.stock.length);
    }

    function exposed(d, i) {
      var a = SLOTS[i];
      if (a.row === 3) return !d.board[i].gone && true;
      for (var j = 0; j < 28; j++) {
        if (d.board[j].gone) continue;
        var b = SLOTS[j];
        if (b.row === a.row + 1 && Math.abs(b.s2 - a.s2) === 1) return false;
      }
      return !d.board[i].gone;
    }
    /** One rank up or down, and King wraps round to Ace here. */
    function playable(card, top) {
      var diff = Math.abs(card.r - top.r);
      return diff === 1 || diff === 12;
    }

    function checkStuck(g) {
      var d = g.data;
      if (d.won || d.stock.length) return;
      var top = topOf(d.waste);
      for (var i = 0; i < 28; i++) {
        if (!d.board[i].gone && exposed(d, i) && playable(d.board[i].card, top)) return;
      }
      d.won = true;
      g.gameOver({
        emo: '⛰️', title: 'Snowed in',
        text: (28 - d.left) + ' of 28 cleared.',
        score: d.pts
      });
    }

    return Milo.arcade(host, {
      id: 'sol-tri-peaks',
      w: W, h: H, bg: '#0f3050',
      stats: ['Score', 'Streak', 'Stock'],
      emo: '⛰️',
      start: {
        title: 'Tri Peaks',
        text: 'Clear three overlapping peaks onto the waste pile. Play any uncovered ' +
          'card one rank above or below the waste top — and here King wraps round to ' +
          'Ace. Unbroken streaks are worth big points; drawing from the stock resets them.',
        keys: ['Click an uncovered card', 'Click the stock to draw']
      },
      init: reset,
      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play' || g.data.won) return;
        var d = g.data;
        var s = stockXY();
        if (inBox(x, y, s.x, s.y, CW, CH)) {
          if (d.stock.length) {
            d.waste.push(d.stock.pop());
            d.streak = 0;
            g.set('Streak', 0);
            g.set('Stock', d.stock.length);
            Milo.sound.click();
            checkStuck(g);
          } else badTone();
          return;
        }
        var top = topOf(d.waste);
        // Walk lower rows first so the visually-on-top card wins the tap.
        for (var i = 27; i >= 0; i--) {
          var cell = d.board[i];
          if (cell.gone) continue;
          var p = slotXY(SLOTS[i]);
          if (!inBox(x, y, p.x, p.y, CW, CH)) continue;
          if (!exposed(d, i)) continue;
          if (playable(cell.card, top)) {
            cell.gone = true;
            d.waste.push(cell.card);
            d.left--;
            d.streak++;
            d.pts += 10 * d.streak;
            g.set('Score', d.pts);
            g.set('Streak', d.streak);
            Milo.sound.tone({ f: 440 + d.streak * 40, d: .06, v: .07, type: 'triangle' });
            if (d.left === 0) {
              d.won = true;
              g.win({
                emo: '⛰️', title: 'All three peaks!',
                text: 'Cleared with ' + d.stock.length + ' stock cards to spare.',
                score: d.pts + 500 + d.stock.length * 100
              });
              return;
            }
            checkStuck(g);
          } else badTone();
          return;
        }
      },
      update: function (g, dt) {
        var d = g.data;
        if (d.won) return;
        d.time += dt;
      },
      draw: function (g) {
        var c = g.ctx, d = g.data;
        tableBg(c, W, H, '#143d63', '#081b2e');
        var top = topOf(d.waste);
        for (var i = 0; i < 28; i++) {     // rows draw top-down, so overlaps stack right
          var cell = d.board[i];
          if (cell.gone) continue;
          var p = slotXY(SLOTS[i]);
          var ex = exposed(d, i);
          C.draw(c, cell.card, p.x, p.y, CW, CH, {
            faceUp: ex,
            hint: ex && playable(cell.card, top)
          });
        }
        var s = stockXY();
        if (d.stock.length) C.draw(c, d.stock[d.stock.length - 1], s.x, s.y, CW, CH, { faceUp: false });
        else C.slot(c, s.x, s.y, CW, CH, '×');
        var wp = wasteXY();
        C.draw(c, top, wp.x, wp.y, CW, CH, { faceUp: true });
        c.fillStyle = 'rgba(255,255,255,.5)';
        c.font = '600 12px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText('Green = playable · K and A link up', W / 2, H - 12);
      }
    });
  }

  Milo.register({
    id: 'sol-tri-peaks', title: 'Tri Peaks', emo: '⛰️', category: 'Cards',
    tagline: 'Three peaks, one waste pile, big streaks',
    description: 'No foundations, no tableau builds — this is Golf’s arcade cousin. ' +
      'Twenty-eight cards form three overlapping peaks; play any uncovered card that ' +
      'sits one rank above or below the waste top, and unlike our Golf table the King ' +
      'wraps round to Ace. Covered cards flip face-up as you dig. Every card in an ' +
      'unbroken streak is worth more than the last, and drawing from the 23-card stock ' +
      'resets the run. Tip: trace the longest chain before you tap — a 7-streak pays ' +
      'quadruple what two short ones do.',
    controls: ['Click an uncovered card', 'Click the stock'],
    colors: ['#0f3050', '#38bdf8'],
    tags: ['solitaire', 'cards', 'quick', 'streak', 'golf-like'],
    mount: mountTriPeaks
  });

  /* ======================================================== MONTE CARLO */
  function mountMonteCarlo(host) {
    var W = 820, H = 640, CW = 76, CH = 104, GX = 200, GY = 46, SX = 88, SY = 10;

    function cellXY(i) {
      return { x: GX + (i % 5) * SX, y: GY + Math.floor(i / 5) * (CH + SY) };
    }
    function dealXY() { return { x: 30, y: GY }; }

    function reset(g) {
      var d = g.data;
      var deck = C.shuffled();
      d.grid = [];
      for (var i = 0; i < 25; i++) d.grid.push(deck.pop());
      d.stock = deck;            // 27 cards
      d.pairs = 0; d.sel = null; d.time = 0; d.won = false;
      g.set('Pairs', '0/26'); g.set('Stock', 27); g.set('Time', '0:00');
    }

    function adjacent(a, b) {
      var r1 = Math.floor(a / 5), c1 = a % 5, r2 = Math.floor(b / 5), c2 = b % 5;
      return a !== b && Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1;
    }
    function anyPair(grid) {
      for (var i = 0; i < 25; i++) {
        if (!grid[i]) continue;
        for (var j = i + 1; j < 25; j++) {
          if (grid[j] && grid[j].r === grid[i].r && adjacent(i, j)) return true;
        }
      }
      return false;
    }

    /** Slide the survivors up in reading order, then refill from the stock. */
    function consolidate(d, g) {
      var cards = d.grid.filter(function (c) { return !!c; });
      while (cards.length < 25 && d.stock.length) cards.push(d.stock.pop());
      d.grid = [];
      for (var i = 0; i < 25; i++) d.grid.push(cards[i] || null);
      g.set('Stock', d.stock.length);
    }

    function checkEnd(g, afterDeal) {
      var d = g.data;
      if (d.won) return;
      if (d.pairs === 26) {
        d.won = true;
        g.win({
          emo: '🎲', title: 'The table is bare!',
          text: 'All 26 pairs matched in ' + U.time(d.time) + '.',
          score: Math.max(400, 6000 - Math.round(d.time) * 8)
        });
        return;
      }
      // Only a pack-up can prove the game dead: until then the player may
      // still choose the ORDER pairs come off in before sliding cards around.
      if (afterDeal && !anyPair(d.grid)) {
        if (!d.stock.length) {
          d.won = true;
          g.gameOver({
            emo: '🎲', title: 'No pairs touch',
            text: d.pairs + ' of 26 pairs made.',
            score: d.pairs * 60
          });
        } else {
          // Nudge: nothing matches until the next deal, and that is legal info.
          Milo.sound.tone({ f: 220, d: .08, v: .05, type: 'sine' });
        }
      }
    }

    return Milo.arcade(host, {
      id: 'sol-monte-carlo',
      w: W, h: H, bg: '#3d1226',
      stats: ['Pairs', 'Stock', 'Time'],
      emo: '🎲',
      start: {
        title: 'Monte Carlo',
        text: 'A 5×5 grid. Remove PAIRS of the same rank that touch — sideways, up-down ' +
          'or diagonally. Click the deal pile to slide everything up in reading order ' +
          'and refill the gaps, creating brand-new neighbours. Clear all 26 pairs.',
        keys: ['Click two touching cards of one rank', 'Click the deal pile to consolidate']
      },
      init: reset,
      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play' || g.data.won) return;
        var d = g.data;
        var p = dealXY();
        if (inBox(x, y, p.x, p.y, CW, CH)) {
          consolidate(d, g);
          d.sel = null;
          Milo.sound.click();
          checkEnd(g, true);
          return;
        }
        for (var i = 0; i < 25; i++) {
          p = cellXY(i);
          if (!inBox(x, y, p.x, p.y, CW, CH)) continue;
          if (!d.grid[i]) return;
          if (d.sel === null) { d.sel = i; Milo.sound.blip(); return; }
          if (d.sel === i) { d.sel = null; return; }
          if (d.grid[d.sel] && d.grid[d.sel].r === d.grid[i].r && adjacent(d.sel, i)) {
            d.grid[d.sel] = null;
            d.grid[i] = null;
            d.sel = null;
            d.pairs++;
            g.set('Pairs', d.pairs + '/26');
            Milo.sound.coin();
            checkEnd(g, false);
          } else { d.sel = i; Milo.sound.blip(); }
          return;
        }
        d.sel = null;
      },
      update: function (g, dt) {
        var d = g.data;
        if (d.won) return;
        d.time += dt;
        g.set('Time', U.time(d.time));
      },
      draw: function (g) {
        var c = g.ctx, d = g.data;
        tableBg(c, W, H, '#4a1830', '#200a15');
        var p = dealXY();
        if (d.stock.length) {
          C.draw(c, d.stock[d.stock.length - 1], p.x, p.y, CW, CH, { faceUp: false });
          c.fillStyle = 'rgba(255,255,255,.7)';
          c.font = '700 13px Outfit, sans-serif';
          c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText(String(d.stock.length), p.x + CW / 2, p.y + CH / 2);
        } else C.slot(c, p.x, p.y, CW, CH, '↧');
        c.fillStyle = 'rgba(255,255,255,.5)';
        c.font = '700 12px Outfit, sans-serif';
        c.textAlign = 'center'; c.textBaseline = 'top';
        c.fillText('deal / pack up', p.x + CW / 2, p.y + CH + 8);
        for (var i = 0; i < 25; i++) {
          var q = cellXY(i);
          if (!d.grid[i]) { C.slot(c, q.x, q.y, CW, CH); continue; }
          var mate = d.sel !== null && d.sel !== i && d.grid[d.sel] &&
            d.grid[d.sel].r === d.grid[i].r && adjacent(d.sel, i);
          C.draw(c, d.grid[i], q.x, q.y, CW, CH, {
            faceUp: true, selected: d.sel === i, hint: mate
          });
        }
        footer(c, W, H, 'Pairs must touch — packing up shifts every card and makes new neighbours');
      }
    });
  }

  Milo.register({
    id: 'sol-monte-carlo', title: 'Monte Carlo', emo: '🎲', category: 'Cards',
    tagline: 'Match touching pairs, then shuffle the room',
    description: 'Forget building runs — Monte Carlo (a.k.a. Weddings) is pure pair ' +
      'matching. Any two cards of the same rank that touch on the 5×5 grid — including ' +
      'diagonally — can be removed together. When nothing touches, "pack up": the ' +
      'survivors slide up in reading order and the stock refills the tail, giving every ' +
      'card new neighbours. Win by clearing all 26 pairs; lose if the stock runs dry ' +
      'with strangers everywhere. Tip: removing a pair mid-grid changes what packs next ' +
      'to what, so look one consolidation ahead.',
    controls: ['Click two touching cards', 'Click the deal pile'],
    colors: ['#3d1226', '#fb7185'],
    tags: ['solitaire', 'cards', 'pairs', 'matching'],
    mount: mountMonteCarlo
  });

  /* ====================================================== GAPS / MONTANA */
  function mountGaps(host) {
    var W = 940, H = 540, CW = 62, CH = 86, STEP = 70, MX = 19, TOP = 46, ROW_DY = 98;

    function cellXY(r, c) { return { x: MX + c * STEP, y: TOP + r * ROW_DY }; }
    function redealBox() { return { x: W - 168, y: 8, w: 148, h: 30 }; }

    function reset(g) {
      var d = g.data;
      var deck = C.shuffled();
      d.rows = [];
      for (var r = 0; r < 4; r++) {
        var row = [];
        for (var c = 0; c < 13; c++) {
          var card = deck.pop();
          row.push(card.r === 0 ? null : card);   // aces leave the game as gaps
        }
        d.rows.push(row);
      }
      d.redeals = 2;
      d.sel = null; d.moves = 0; d.time = 0; d.won = false;
      g.set('Moves', 0); g.set('Redeals', 2); g.set('Time', '0:00');
    }

    /** Where may this card legally go? 2s take leftmost gaps; anything else
        must sit directly right of its same-suit predecessor. */
    function legalGaps(d, card, fromR, fromC) {
      var out = [];
      for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 13; c++) {
          if (d.rows[r][c]) continue;
          if (r === fromR && c === fromC) continue;
          if (c === 0) {
            if (card.r === 1) out.push({ r: r, c: c });
          } else {
            var left = d.rows[r][c - 1];
            if (left && left.s === card.s && left.r === card.r - 1) out.push({ r: r, c: c });
          }
        }
      }
      return out;
    }

    function prefixLen(d, r) {
      var first = d.rows[r][0];
      if (!first || first.r !== 1) return 0;
      var n = 1;
      while (n < 12) {
        var cell = d.rows[r][n];
        if (!cell || cell.s !== first.s || cell.r !== n + 1) break;
        n++;
      }
      return n;    // 12 = the full 2..K run
    }

    function checkWin(g) {
      var d = g.data, done = 0;
      for (var r = 0; r < 4; r++) if (prefixLen(d, r) === 12) done++;
      if (done === 4 && !d.won) {
        d.won = true;
        g.win({
          emo: '🌵', title: 'Four suits in a row!',
          text: d.moves + ' moves, ' + d.redeals + ' redeal' + (d.redeals === 1 ? '' : 's') + ' unused.',
          score: Math.max(400, 6000 - d.moves * 15 - Math.round(d.time) * 5 + d.redeals * 800)
        });
        return true;
      }
      return false;
    }

    function checkStuck(g) {
      var d = g.data;
      if (d.won) return;
      for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 13; c++) {
          if (d.rows[r][c]) continue;
          if (c === 0) return;                      // a leftmost gap always takes a 2
          var left = d.rows[r][c - 1];
          if (left && left.r !== 12) return;        // live gap: its filler exists somewhere
        }
      }
      if (d.redeals > 0) return;                    // dead gaps, but a redeal remains
      d.won = true;
      var placed = 0;
      for (var i = 0; i < 4; i++) placed += prefixLen(d, i);
      g.gameOver({
        emo: '🌵', title: 'Every gap is dead',
        text: placed + ' of 48 cards locked into their rows.',
        score: placed * 60
      });
    }

    function redeal(g) {
      var d = g.data;
      if (!d.redeals || d.won) { badTone(); return; }
      d.redeals--;
      g.set('Redeals', d.redeals);
      var keep = [], loose = [], r, c;
      for (r = 0; r < 4; r++) {
        keep.push(prefixLen(d, r));
        for (c = keep[r]; c < 13; c++) {
          if (d.rows[r][c]) loose.push(d.rows[r][c]);
        }
      }
      loose = U.shuffle(loose);
      for (r = 0; r < 4; r++) {
        // A fresh gap sits right after each kept run; the rest is re-dealt.
        for (c = keep[r]; c < 13; c++) {
          d.rows[r][c] = (c === keep[r]) ? null : loose.pop();
        }
      }
      d.sel = null;
      d.moves++;
      g.set('Moves', d.moves);
      Milo.sound.tone({ f: 300, f2: 180, d: .2, v: .07, type: 'triangle' });
      checkStuck(g);
    }

    function place(g, card, fr, fc, tr, tc) {
      var d = g.data;
      d.rows[tr][tc] = card;
      d.rows[fr][fc] = null;
      d.sel = null;
      d.moves++;
      g.set('Moves', d.moves);
      goodTone();
      if (!checkWin(g)) checkStuck(g);
    }

    return Milo.arcade(host, {
      id: 'sol-gaps',
      w: W, h: H, bg: '#203515',
      stats: ['Moves', 'Redeals', 'Time'],
      emo: '🌵',
      start: {
        title: 'Gaps (Montana)',
        text: 'The whole deck is dealt in four rows and the aces are removed, leaving ' +
          'four gaps. A gap accepts only the same-suit card one higher than its left ' +
          'neighbour; leftmost gaps take any 2. Arrange every row 2→K in one suit. ' +
          'Gaps behind Kings are dead — two redeals can rescue you.',
        keys: ['Click a card to slot it', 'Click a gap to choose', 'Redeal button (2 left)']
      },
      init: reset,
      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play' || g.data.won) return;
        var d = g.data;
        var rb = redealBox();
        if (inBox(x, y, rb.x, rb.y, rb.w, rb.h)) { redeal(g); return; }
        for (var r = 0; r < 4; r++) {
          for (var c = 0; c < 13; c++) {
            var p = cellXY(r, c);
            if (!inBox(x, y, p.x, p.y, CW, CH)) continue;
            var card = d.rows[r][c];
            if (card) {
              var gaps = legalGaps(d, card, r, c);
              if (gaps.length === 1) place(g, card, r, c, gaps[0].r, gaps[0].c);
              else if (gaps.length > 1) { d.sel = { r: r, c: c }; Milo.sound.blip(); }
              else { d.sel = null; badTone(); }
            } else if (d.sel) {
              var sc = d.rows[d.sel.r][d.sel.c];
              var ok = sc && legalGaps(d, sc, d.sel.r, d.sel.c).some(function (gp) {
                return gp.r === r && gp.c === c;
              });
              if (ok) place(g, sc, d.sel.r, d.sel.c, r, c);
              else { d.sel = null; badTone(); }
            }
            return;
          }
        }
        d.sel = null;
      },
      update: function (g, dt) {
        var d = g.data;
        if (d.won) return;
        d.time += dt;
        g.set('Time', U.time(d.time));
      },
      draw: function (g) {
        var c = g.ctx, d = g.data;
        tableBg(c, W, H, '#2a4519', '#12200a');
        c.fillStyle = 'rgba(255,255,255,.35)';
        c.font = '700 15px Outfit, sans-serif';
        c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText('GAPS — each row wants 2 → K of one suit', MX, 24);
        var rb = redealBox();
        c.fillStyle = d.redeals ? 'rgba(52,211,153,.18)' : 'rgba(255,255,255,.07)';
        U.roundRect(c, rb.x, rb.y, rb.w, rb.h, 8);
        c.fill();
        c.strokeStyle = d.redeals ? '#34d399' : 'rgba(255,255,255,.2)';
        c.lineWidth = 1.5;
        U.roundRect(c, rb.x, rb.y, rb.w, rb.h, 8);
        c.stroke();
        c.fillStyle = d.redeals ? '#a7f3d0' : 'rgba(255,255,255,.35)';
        c.font = '700 13px Outfit, sans-serif';
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('Redeal (' + d.redeals + ' left)', rb.x + rb.w / 2, rb.y + rb.h / 2);
        var selCard = d.sel ? d.rows[d.sel.r][d.sel.c] : null;
        var selGaps = selCard ? legalGaps(d, selCard, d.sel.r, d.sel.c) : [];
        for (var r = 0; r < 4; r++) {
          var kept = prefixLen(d, r);
          for (var cc = 0; cc < 13; cc++) {
            var p = cellXY(r, cc);
            var card = d.rows[r][cc];
            if (!card) {
              var left = cc > 0 ? d.rows[r][cc - 1] : null;
              var dead = cc > 0 && (!left || left.r === 12);
              C.slot(c, p.x, p.y, CW, CH, dead ? '✕' : null);
              for (var q = 0; q < selGaps.length; q++) {
                if (selGaps[q].r === r && selGaps[q].c === cc) hintRect(c, p.x, p.y, CW, CH);
              }
              continue;
            }
            C.draw(c, card, p.x, p.y, CW, CH, {
              faceUp: true,
              selected: d.sel && d.sel.r === r && d.sel.c === cc,
              hint: cc < kept
            });
          }
        }
        footer(c, W, H, 'Green cards are locked in place · ✕ gaps are dead until a redeal');
      }
    });
  }

  Milo.register({
    id: 'sol-gaps', title: 'Gaps (Montana)', emo: '🌵', category: 'Cards',
    tagline: 'Sort four rows with only four holes',
    description: 'There are no piles at all — the deck lies flat in four rows of 13, the ' +
      'aces are thrown away, and their four gaps are the only space you get. A gap only ' +
      'accepts the same-suit card one rank above whatever sits to its left, and a gap in ' +
      'the first column takes any 2. Goal: every row running 2 to King in a single suit. ' +
      'A gap that ends up behind a King is dead, and when all four die you must spend one ' +
      'of your two redeals, which keep each row’s sorted start. Tip: moves that free a ' +
      'column-one slot for a 2 are worth more than they look.',
    controls: ['Click a card', 'Click a gap', 'Redeal button'],
    colors: ['#203515', '#a3e635'],
    tags: ['solitaire', 'cards', 'montana', 'arrangement'],
    mount: mountGaps
  });

  /* ======================================================= SIMPLE SIMON */
  function mountSimpleSimon(host) {
    var W = 940, H = 640, CW = 82, CH = 110, STEP = 92, MX = 15;
    var TAB_Y = 12 + CH + 26, AVAIL = H - TAB_Y - CH - 20;

    function doneXY(i) { return { x: W - MX - (4 - i) * STEP + 10, y: 12 }; }
    function colXY(i) { return { x: MX + i * STEP, y: TAB_Y }; }
    function offs(pile) { return fanOffsets(pile, AVAIL, 24, 24); }

    function reset(g) {
      var d = g.data;
      var deck = C.shuffled();
      var sizes = [8, 8, 8, 7, 6, 5, 4, 3, 2, 1];
      d.tab = [];
      for (var i = 0; i < 10; i++) {
        var pile = [];
        for (var j = 0; j < sizes[i]; j++) pile.push(deck.pop());
        d.tab.push(pile);
      }
      d.doneSuits = [];
      d.sel = null; d.moves = 0; d.time = 0; d.won = false;
      g.set('Moves', 0); g.set('Done', '0/4'); g.set('Time', '0:00');
    }

    /** Only an in-suit descending run may be picked up together. */
    function liftable(pile, at) {
      for (var k = at + 1; k < pile.length; k++) {
        if (pile[k].s !== pile[k - 1].s || pile[k].r !== pile[k - 1].r - 1) return false;
      }
      return true;
    }

    function sweepRuns(g) {
      var d = g.data;
      d.tab.forEach(function (pile) {
        if (pile.length < 13) return;
        var base = pile.length - 13;
        if (pile[base].r !== 12) return;
        for (var k = 0; k < 13; k++) {
          var c = pile[base + k];
          if (c.s !== pile[base].s || c.r !== 12 - k) return;
        }
        d.doneSuits.push(pile[base].s);
        pile.splice(base);
        g.set('Done', d.doneSuits.length + '/4');
        Milo.sound.coin();
        if (d.doneSuits.length === 4 && !d.won) {
          d.won = true;
          g.win({
            emo: '🥧', title: 'Simple? Hardly!',
            text: d.moves + ' moves in ' + U.time(d.time) + '.',
            score: Math.max(400, 9000 - d.moves * 14 - Math.round(d.time) * 6)
          });
        }
      });
    }

    function moveTo(g, target) {
      var d = g.data, s = d.sel;
      if (!s || target.kind !== 'tab' || target.i === s.i) return false;
      var onto = topOf(d.tab[target.i]);
      if (onto && s.cards[0].r !== onto.r - 1) return false;   // down by one, ANY suit
      d.tab[s.i].splice(s.at);
      d.tab[target.i] = d.tab[target.i].concat(s.cards);
      d.moves++;
      g.set('Moves', d.moves);
      d.sel = null;
      goodTone();
      sweepRuns(g);
      return true;
    }

    function hit(d, x, y) {
      for (var t = 0; t < 10; t++) {
        var p = colXY(t);
        var pile = d.tab[t];
        if (!pile.length) {
          if (inBox(x, y, p.x, p.y, CW, CH)) return { kind: 'tab', i: t, cards: null };
          continue;
        }
        var k = hitFan(pile, offs(pile), x, y, p.x, p.y, CW, CH);
        if (k >= 0) return { kind: 'tab', i: t, at: k, cards: pile.slice(k) };
      }
      return null;
    }

    return Milo.arcade(host, {
      id: 'sol-simple-simon',
      w: W, h: H, bg: '#33202f',
      stats: ['Moves', 'Done', 'Time'],
      emo: '🥧',
      start: {
        title: 'Simple Simon',
        text: 'Spider with everything face up and no stock. Stack downward on any suit, ' +
          'but only IN-SUIT runs can be picked up together. Assemble each full King-to-Ace ' +
          'suit inside the columns and it flies off. Anything may land on an empty column.',
        keys: ['Click to select a run', 'Click again to move']
      },
      init: reset,
      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play' || g.data.won) return;
        var d = g.data;
        var h = hit(d, x, y);
        if (!h) { d.sel = null; return; }
        if (d.sel) {
          if (moveTo(g, h)) return;
          d.sel = null;
        }
        if (h.cards && h.cards.length && liftable(d.tab[h.i], h.at)) {
          d.sel = h;
          Milo.sound.blip();
        }
      },
      update: function (g, dt) {
        var d = g.data;
        if (d.won) return;
        d.time += dt;
        g.set('Time', U.time(d.time));
      },
      draw: function (g) {
        var c = g.ctx, d = g.data, p;
        tableBg(c, W, H, '#3f2839', '#1d1019');
        c.fillStyle = 'rgba(255,255,255,.35)';
        c.font = '700 15px Outfit, sans-serif';
        c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText('SIMPLE SIMON — build King → Ace in suit, in place', MX, 12 + CH / 2);
        for (var f = 0; f < 4; f++) {
          p = doneXY(f);
          if (f < d.doneSuits.length) {
            C.draw(c, { r: 12, s: d.doneSuits[f] }, p.x, p.y, CW, CH, { faceUp: true });
          } else C.slot(c, p.x, p.y, CW, CH, '♛');
        }
        for (var t = 0; t < 10; t++) {
          p = colXY(t);
          var pile = d.tab[t];
          if (!pile.length) { C.slot(c, p.x, p.y, CW, CH); continue; }
          var selFrom = (d.sel && d.sel.i === t) ? d.sel.at : null;
          drawFan(c, pile, offs(pile), p.x, p.y, CW, CH, selFrom);
        }
        footer(c, W, H, 'Any suit stacks downward, but only same-suit runs travel together');
      }
    });
  }

  Milo.register({
    id: 'sol-simple-simon', title: 'Simple Simon', emo: '🥧', category: 'Cards',
    tagline: 'One-deck Spider, all cards on the table',
    description: 'Spider’s logic with none of its luck: every card is face up from the ' +
      'deal (ten columns from 8 down to 1) and there is no stock. Unlike Klondike there ' +
      'are no foundations to feed — you build each complete King-to-Ace suit inside the ' +
      'tableau and it lifts off. Cards stack down on ANY suit, but only in-suit runs move ' +
      'together, and empty columns take anything. Tip: off-suit stacking is a loan, not a ' +
      'gift — every mixed pile must be unpicked through an empty column later.',
    controls: ['Click to select a run', 'Click to place'],
    colors: ['#33202f', '#f0abfc'],
    tags: ['solitaire', 'cards', 'spider-like', 'open', 'hard'],
    mount: mountSimpleSimon
  });

})();
