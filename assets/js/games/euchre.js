/* Euchre — 24 cards, bowers, order it up or go alone. First team to 10. */
(function () {
  'use strict';
  var W = 940, H = 620, CW = 66, CH = 94;
  var NAMES = ['You', 'West', 'Partner', 'East'];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util, C = Milo.cards;

    var EUCHRE_RANKS = [8, 9, 10, 11, 12, 0];       // 9 10 J Q K A
    function baseVal(c) { return c.r === 0 ? 14 : c.r + 1; }
    function mate(s) { return s === 0 ? 3 : s === 3 ? 0 : s === 1 ? 2 : 1; }
    function effSuit(c, tr) { return (c.r === 10 && c.s === mate(tr)) ? tr : c.s; }
    function isTrump(c, tr) { return effSuit(c, tr) === tr; }
    function trumpOrder(c, tr) {
      if (c.r === 10 && c.s === tr) return 6;
      if (c.r === 10 && c.s === mate(tr)) return 5;
      if (c.r === 0) return 4;
      if (c.r === 12) return 3;
      if (c.r === 11) return 2;
      if (c.r === 9) return 1;
      return 0;
    }
    function power(c, tr, led) {
      if (isTrump(c, tr)) return 200 + trumpOrder(c, tr);
      if (effSuit(c, tr) === led) return baseVal(c);
      return -1;
    }
    function sortHand(h, tr) {
      h.sort(function (a, b) {
        var at = isTrump(a, tr) ? 1 : 0, bt = isTrump(b, tr) ? 1 : 0;
        if (at !== bt) return bt - at;
        if (at) return trumpOrder(b, tr) - trumpOrder(a, tr);
        return a.s - b.s || baseVal(a) - baseVal(b);
      });
    }
    function bad(g, why) {
      g.data.msg = why;
      Milo.sound.tone({ f: 150, d: .08, v: .05, type: 'square' });
    }
    function euchreDeck() {
      var out = [];
      for (var s = 0; s < 4; s++) for (var i = 0; i < EUCHRE_RANKS.length; i++) {
        out.push({ r: EUCHRE_RANKS[i], s: s });
      }
      return U.shuffle(out);
    }

    /* -------------------------------------------------------------- setup */

    function reset(g) {
      var d = g.data;
      d.score = [0, 0];
      d.dealer = 3;
      d.handNo = 0;
      g.score = 0;
      g.set('Us', 0); g.set('Them', 0); g.set('Tricks', 0);
      newHand(g);
    }

    function newHand(g) {
      var d = g.data, i;
      d.handNo++;
      d.dealer = (d.dealer + 1) % 4;
      var deck = euchreDeck();
      d.hands = [[], [], [], []];
      for (i = 0; i < 20; i++) d.hands[i % 4].push(deck[i]);
      d.up = deck[20];
      d.kitty = deck.slice(21);
      d.trump = -1;
      d.maker = -1;
      d.alone = false;
      d.out = -1;
      d.tricks = [0, 0, 0, 0];
      d.trick = [];
      d.round = 1;
      d.passes = 0;
      d.phase = 'bid1';
      d.think = 0;
      d.summary = null;
      d.lastTrick = '';
      d.wantAlone = false;
      d.turn = (d.dealer + 1) % 4;
      for (i = 0; i < 4; i++) sortHand(d.hands[i], d.up.s);
      d.msg = d.turn === 0 ? 'Order it up, or pass' : NAMES[d.turn] + ' is bidding';
      if (d.turn !== 0) d.think = 0.7;
      stats(g);
    }

    function stats(g) {
      var d = g.data;
      g.set('Us', d.score[0]); g.set('Them', d.score[1]);
      g.set('Tricks', d.tricks[0] + d.tricks[2]);
    }

    function nextSeat(g, s) {
      var d = g.data, n = (s + 1) % 4;
      if (n === d.out) n = (n + 1) % 4;
      return n;
    }
    function activeCount(g) { return g.data.out < 0 ? 4 : 3; }

    /* ------------------------------------------------------------ bidding */

    function handStrength(hand, tr, extra) {
      var v = 0, suits = {}, cards = hand.concat(extra ? [extra] : []);
      cards.forEach(function (c) {
        if (isTrump(c, tr)) {
          var o = trumpOrder(c, tr);
          v += o === 6 ? 3 : o === 5 ? 2.5 : o === 4 ? 2 : o === 3 ? 1.3 : o === 2 ? 0.9 : 0.7;
        } else {
          if (c.r === 0) v += 1;
          else if (c.r === 12) v += 0.35;
          suits[effSuit(c, tr)] = (suits[effSuit(c, tr)] || 0) + 1;
        }
      });
      var voids = 0;
      for (var s = 0; s < 4; s++) if (s !== tr && !suits[s]) voids++;
      v += voids * 0.45;
      return v;
    }

    function aiBid(g, seat) {
      var d = g.data;
      if (d.round === 1) {
        var tr = d.up.s;
        var dealerIsPartner = ((d.dealer + 2) % 4) === seat || d.dealer === seat;
        var extra = d.dealer === seat ? d.up : null;
        var v = handStrength(d.hands[seat], tr, extra);
        if (dealerIsPartner) v += 0.6; else v -= 0.5;
        if (v >= 4.2) {
          var alone = v >= 6.6;
          orderUp(g, seat, alone);
          return;
        }
        pass(g, seat);
        return;
      }
      var best = -1, bestV = 0;
      for (var s = 0; s < 4; s++) {
        if (s === d.up.s) continue;
        var val = handStrength(d.hands[seat], s, null);
        if (val > bestV) { bestV = val; best = s; }
      }
      if (bestV >= 4.2) { nameTrump(g, seat, best, bestV >= 6.6); return; }
      pass(g, seat);
    }

    function pass(g, seat) {
      var d = g.data;
      d.passes++;
      d.msg = NAMES[seat] + ' passes';
      if (d.passes >= 4) {
        if (d.round === 1) {
          d.round = 2;
          d.passes = 0;
          d.phase = 'bid2';
          d.turn = (d.dealer + 1) % 4;
          d.msg = 'Everyone passed — name a different suit, or pass again';
          if (d.turn !== 0) d.think = 0.7;
          return;
        }
        d.summary = {
          title: 'Throw it in',
          lines: ['Nobody would name a trump suit.', 'The deal passes on.'],
          delta: [0, 0]
        };
        d.phase = 'summary';
        return;
      }
      d.turn = (seat + 1) % 4;
      if (d.turn === 0) d.msg = d.round === 1 ? 'Your call — order it up or pass' : 'Name a suit, or pass';
      else { d.msg = NAMES[d.turn] + ' is bidding'; d.think = 0.7; }
    }

    function beginPlay(g) {
      var d = g.data;
      var i;
      for (i = 0; i < 4; i++) sortHand(d.hands[i], d.trump);
      if (d.alone) d.out = (d.maker + 2) % 4;
      if (d.out === 0) d.msg = 'Your partner went alone — you sit this one out';
      d.turn = (d.dealer + 1) % 4;
      if (d.turn === d.out) d.turn = (d.turn + 1) % 4;
      d.phase = 'play';
      d.trick = [];
      d.msg = d.turn === 0 ? 'Your lead' : NAMES[d.turn] + ' leads';
      if (d.turn !== 0) d.think = 0.6;
      Milo.sound.blip();
    }

    function orderUp(g, seat, alone) {
      var d = g.data;
      d.trump = d.up.s;
      d.maker = seat;
      d.alone = !!alone;
      d.msg = NAMES[seat] + ' orders it up' + (alone ? ' and goes alone!' : '');
      // The dealer takes the upcard and throws one away.
      if (d.dealer === 0) {
        d.hands[0].push(d.up);
        sortHand(d.hands[0], d.trump);
        d.phase = 'toss';
        d.msg = NAMES[seat] + ' orders it up — click a card to discard';
        return;
      }
      var h = d.hands[d.dealer];
      h.push(d.up);
      var worst = null, wi = 0;
      h.forEach(function (c, i) {
        var v = isTrump(c, d.trump) ? 100 + trumpOrder(c, d.trump) : baseVal(c);
        if (worst === null || v < worst) { worst = v; wi = i; }
      });
      h.splice(wi, 1);
      beginPlay(g);
    }

    function nameTrump(g, seat, suit, alone) {
      var d = g.data;
      d.trump = suit;
      d.maker = seat;
      d.alone = !!alone;
      d.msg = NAMES[seat] + ' names ' + C.SUITS[suit] + (alone ? ' and goes alone!' : '');
      beginPlay(g);
    }

    /* --------------------------------------------------------------- play */

    function legal(g, seat, card) {
      var d = g.data;
      if (!d.trick.length) return null;
      var led = effSuit(d.trick[0].card, d.trump);
      var has = d.hands[seat].some(function (c) { return effSuit(c, d.trump) === led; });
      if (has && effSuit(card, d.trump) !== led) {
        return 'you must follow ' + C.SUITS[led] +
          (led === d.trump ? ' (the left bower counts as trump)' : '');
      }
      return null;
    }
    function legalCards(g, seat) {
      return g.data.hands[seat].filter(function (c) { return !legal(g, seat, c); });
    }

    function playCard(g, seat, card) {
      var d = g.data;
      var h = d.hands[seat];
      h.splice(h.indexOf(card), 1);
      d.trick.push({ seat: seat, card: card });
      Milo.sound.tone({ f: 430, f2: 520, d: .05, v: .05, type: 'triangle' });
      if (d.trick.length === activeCount(g)) { d.phase = 'trickend'; d.think = 0.9; return; }
      d.turn = nextSeat(g, seat);
      if (d.turn !== 0) d.think = 0.5;
      d.msg = d.turn === 0 ? 'Your turn' : NAMES[d.turn] + ' to play';
    }

    function finishTrick(g) {
      var d = g.data;
      var led = effSuit(d.trick[0].card, d.trump), best = 0;
      for (var i = 1; i < d.trick.length; i++) {
        if (power(d.trick[i].card, d.trump, led) > power(d.trick[best].card, d.trump, led)) best = i;
      }
      var winner = d.trick[best].seat;
      d.tricks[winner]++;
      d.lastTrick = NAMES[winner] + ' took it with the ' + C.label(d.trick[best].card);
      if (winner % 2 === 0) Milo.sound.coin(); else Milo.sound.click();
      d.trick = [];
      stats(g);
      var done = true;
      for (var j = 0; j < 4; j++) if (j !== d.out && d.hands[j].length) done = false;
      if (done) { endHand(g); return; }
      d.turn = winner;
      d.phase = 'play';
      d.msg = winner === 0 ? 'Your lead' : NAMES[winner] + ' leads';
      if (winner !== 0) d.think = 0.6;
    }

    function endHand(g) {
      var d = g.data;
      var mk = d.maker % 2;
      var made = d.tricks[mk] + d.tricks[mk + 2];
      var pts = 0, line;
      if (made >= 3) {
        if (made === 5) { pts = d.alone ? 4 : 2; line = 'a march — all five tricks'; }
        else { pts = 1; line = made + ' tricks, contract made'; }
      } else {
        pts = 2; line = 'euchred! only ' + made + ' trick' + (made === 1 ? '' : 's');
      }
      var winner = made >= 3 ? mk : 1 - mk;
      d.score[winner] += pts;
      var delta = [0, 0]; delta[winner] = pts;
      d.summary = {
        title: (winner === 0 ? 'We score ' : 'They score ') + pts,
        lines: [
          NAMES[d.maker] + ' made it ' + C.SUITS[d.trump] + (d.alone ? ' alone' : '') + '.',
          (mk === 0 ? 'We' : 'They') + ' took ' + made + ' of 5 — ' + line + '.'
        ],
        delta: delta
      };
      d.phase = 'summary';
      stats(g);
      g.score = Math.max(0, d.score[0]);
    }

    function nextHand(g) {
      var d = g.data;
      if (d.score[0] >= 10 || d.score[1] >= 10) {
        var wonIt = d.score[0] >= 10;
        (wonIt ? g.win : g.gameOver).call(g, {
          emo: wonIt ? '🎴' : '😬',
          title: wonIt ? 'Game — 10 points!' : 'They got to 10 first',
          text: 'Final score  us ' + d.score[0] + '  ·  them ' + d.score[1] +
            ' after ' + d.handNo + ' hands.',
          score: Math.max(0, d.score[0])
        });
        return;
      }
      newHand(g);
    }

    /* ----------------------------------------------------------------- AI */

    function aiPlay(g, seat) {
      var d = g.data;
      var cards = legalCards(g, seat);
      if (!cards.length) cards = d.hands[seat].slice();
      var partner = (seat + 2) % 4;
      var pick;
      function byPower(list, led) {
        return list.slice().sort(function (a, b) {
          return power(a, d.trump, led) - power(b, d.trump, led);
        });
      }
      if (!d.trick.length) {
        var trumps = cards.filter(function (c) { return isTrump(c, d.trump); });
        var offAces = cards.filter(function (c) { return !isTrump(c, d.trump) && c.r === 0; });
        var makerSide = (d.maker % 2) === (seat % 2);
        if (makerSide && trumps.length >= 2) {
          pick = byPower(trumps, d.trump)[trumps.length - 1];
        } else if (offAces.length) pick = offAces[0];
        else {
          var off = cards.filter(function (c) { return !isTrump(c, d.trump); });
          if (off.length) {
            pick = off.slice().sort(function (a, b) { return baseVal(b) - baseVal(a); })[0];
          } else pick = byPower(trumps, d.trump)[0];
        }
      } else {
        var led = effSuit(d.trick[0].card, d.trump);
        var bi = 0;
        for (var i = 1; i < d.trick.length; i++) {
          if (power(d.trick[i].card, d.trump, led) > power(d.trick[bi].card, d.trump, led)) bi = i;
        }
        var winSeat = d.trick[bi].seat, winPow = power(d.trick[bi].card, d.trump, led);
        var partnerWins = winSeat === partner;
        var winners = cards.filter(function (c) { return power(c, d.trump, led) > winPow; });
        var last = d.trick.length === activeCount(g) - 1;
        if (partnerWins && !(last && false)) {
          var losers = cards.filter(function (c) { return power(c, d.trump, led) <= winPow; });
          pick = losers.length ? byPower(losers, led)[0] : byPower(winners, led)[0];
        } else if (winners.length) {
          pick = byPower(winners, led)[0];        // win as cheaply as possible
        } else {
          pick = byPower(cards, led)[0];
        }
      }
      playCard(g, seat, pick);
    }

    /* ------------------------------------------------------------ drawing */

    function fanX(i, n, w) {
      var step = Math.min(w + 12, (W - 220) / Math.max(1, n));
      return (W - (n - 1) * step - w) / 2 + i * step;
    }
    function hitB(b, x, y) { return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h; }
    function drawBtn(c, b) {
      c.fillStyle = b.primary ? '#22d3ee' : b.on ? '#ffd257' : 'rgba(255,255,255,.14)';
      U.roundRect(c, b.x, b.y, b.w, b.h, 9); c.fill();
      c.fillStyle = b.primary || b.on ? '#062a33' : '#eef2ff';
      c.font = '700 14px Outfit, sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 1);
    }

    function buttons(g) {
      var d = g.data, out = [], y = H - 46;
      if (d.phase === 'summary') {
        return [{ id: 'next', label: 'Next deal', x: W / 2 - 70, y: H / 2 + 92, w: 140, h: 40, primary: true }];
      }
      if (d.turn !== 0) return out;
      if (d.phase === 'bid1') {
        out.push({
          id: 'order', label: d.dealer === 0 ? 'Pick it up' : 'Order it up',
          x: W / 2 - 250, y: y, w: 160, h: 38, primary: true
        });
        out.push({ id: 'alone', label: 'Alone: ' + (d.wantAlone ? 'ON' : 'off'), x: W / 2 - 80, y: y, w: 150, h: 38, on: d.wantAlone });
        out.push({ id: 'pass', label: 'Pass', x: W / 2 + 90, y: y, w: 160, h: 38 });
        return out;
      }
      if (d.phase === 'bid2') {
        var k = 0;
        for (var s = 0; s < 4; s++) {
          if (s === d.up.s) continue;
          out.push({ id: 'name' + s, suit: s, label: C.SUITS[s], x: W / 2 - 290 + k * 86, y: y, w: 76, h: 38, primary: true });
          k++;
        }
        out.push({ id: 'alone', label: 'Alone: ' + (d.wantAlone ? 'ON' : 'off'), x: W / 2 - 20, y: y, w: 150, h: 38, on: d.wantAlone });
        out.push({ id: 'pass', label: 'Pass', x: W / 2 + 146, y: y, w: 140, h: 38 });
        return out;
      }
      return out;
    }

    var SEATPOS = [
      { x: W / 2 - CW / 2, y: H / 2 + 26 },
      { x: W / 2 - CW / 2 - 140, y: H / 2 - 40 },
      { x: W / 2 - CW / 2, y: H / 2 - 126 },
      { x: W / 2 - CW / 2 + 140, y: H / 2 - 40 }
    ];

    return Milo.arcade(host, {
      id: 'euchre',
      w: W, h: H, bg: '#0f1f24', stats: ['Us', 'Them', 'Tricks'],
      emo: '🎴',
      start: {
        title: 'Euchre',
        text: 'Twenty-four cards, five tricks, and the Jack of trump (the right bower) beats ' +
          'everything — with the other Jack of the same colour right behind it as the left ' +
          'bower. Order up the turned card or name your own suit; make three tricks to score, ' +
          'all five for two, and going alone for all five pays four. Fail and you are euchred ' +
          'for two. First team to 10.',
        keys: ['Click a card', 'Order up', 'Alone']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data, i;
        var bs = buttons(g);
        for (i = 0; i < bs.length; i++) {
          if (!hitB(bs[i], x, y)) continue;
          var b = bs[i];
          if (b.id === 'next') { nextHand(g); return; }
          if (b.id === 'alone') { d.wantAlone = !d.wantAlone; Milo.sound.click(); return; }
          if (b.id === 'pass') { pass(g, 0); return; }
          if (b.id === 'order') { orderUp(g, 0, d.wantAlone); return; }
          if (b.suit !== undefined) { nameTrump(g, 0, b.suit, d.wantAlone); return; }
        }
        if (d.phase === 'summary') return;

        var n = d.hands[0].length, hy = H - CH - 64;
        for (i = n - 1; i >= 0; i--) {
          var cx = fanX(i, n, CW);
          if (x < cx || x > cx + CW || y < hy || y > hy + CH) continue;
          if (d.phase === 'toss') {
            var card = d.hands[0].splice(i, 1)[0];
            d.msg = 'You bury the ' + C.label(card);
            beginPlay(g);
            return;
          }
          if (d.phase !== 'play') { bad(g, 'Finish the bidding first'); return; }
          if (d.turn !== 0) { bad(g, 'Wait — it is ' + NAMES[d.turn] + "'s turn"); return; }
          var why = legal(g, 0, d.hands[0][i]);
          if (why) { bad(g, 'Illegal: ' + why); return; }
          playCard(g, 0, d.hands[0][i]);
          return;
        }
      },

      update: function (g, dt) {
        var d = g.data;
        if (d.think > 0) {
          d.think -= dt;
          if (d.think > 0) return;
          if (d.phase === 'trickend') { finishTrick(g); return; }
          if ((d.phase === 'bid1' || d.phase === 'bid2') && d.turn !== 0) { aiBid(g, d.turn); return; }
          if (d.phase === 'play' && d.turn !== 0) aiPlay(g, d.turn);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, i;
        var bg = c.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * .72);
        bg.addColorStop(0, '#1b4750'); bg.addColorStop(1, '#08161a');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);
        c.textAlign = 'center'; c.textBaseline = 'alphabetic';

        var info = [null, { x: 80, y: H / 2 - 40 }, { x: W / 2, y: 30 }, { x: W - 80, y: H / 2 - 40 }];
        for (i = 1; i < 4; i++) {
          var o = info[i];
          c.fillStyle = d.turn === i ? '#ffd257' : 'rgba(255,255,255,.62)';
          c.font = '700 13px Outfit, sans-serif';
          c.fillText(NAMES[i] + (i === 2 ? ' (ours)' : '') + (d.dealer === i ? '  [D]' : ''), o.x, o.y - 8);
          c.fillStyle = 'rgba(255,255,255,.45)';
          c.font = '600 11px Outfit, sans-serif';
          c.fillText(i === d.out ? 'sitting out' : d.tricks[i] + ' trick' + (d.tricks[i] === 1 ? '' : 's'), o.x, o.y + 8);
          if (i !== d.out) {
            for (var k = 0; k < d.hands[i].length; k++) {
              C.draw(c, d.hands[i][k], o.x - 30 + k * 12, o.y + 18, 44, 62, { faceUp: false });
            }
          }
        }

        if (d.trump < 0) {
          C.draw(c, d.up, W / 2 - CW / 2, H / 2 - CH / 2 - 10, CW, CH, { faceUp: d.phase === 'bid1' });
          c.fillStyle = 'rgba(255,255,255,.6)';
          c.font = '600 12px Outfit, sans-serif';
          c.fillText(d.phase === 'bid1' ? 'turned up' : 'turned down', W / 2, H / 2 + CH / 2 + 8);
        } else {
          d.trick.forEach(function (t) {
            var p = SEATPOS[t.seat];
            C.draw(c, t.card, p.x, p.y, CW, CH, { faceUp: true });
          });
          if (!d.trick.length && d.lastTrick) {
            c.fillStyle = 'rgba(255,255,255,.35)';
            c.font = '600 12px Outfit, sans-serif';
            c.fillText(d.lastTrick, W / 2, H / 2 - 6);
          }
          c.fillStyle = C.isRed({ s: d.trump }) ? '#ff8fa3' : '#cfe0ff';
          c.font = '700 30px serif';
          c.fillText(C.SUITS[d.trump], 70, H / 2 - 10);
          c.fillStyle = 'rgba(255,255,255,.5)';
          c.font = '600 11px Outfit, sans-serif';
          c.fillText('trump', 70, H / 2 + 10);
          c.fillText('made by ' + NAMES[d.maker] + (d.alone ? ' (alone)' : ''), 70, H / 2 + 28);
        }

        c.fillStyle = '#e6ecff';
        c.font = '700 16px Outfit, sans-serif';
        c.fillText(d.msg, W / 2, H - CH - 90);
        c.fillStyle = 'rgba(255,255,255,.5)';
        c.font = '600 12px Outfit, sans-serif';
        c.fillText('Game to 10  ·  us ' + d.score[0] + '  ·  them ' + d.score[1] +
          '  ·  this hand: us ' + (d.tricks[0] + d.tricks[2]) + ' / them ' + (d.tricks[1] + d.tricks[3]),
          W / 2, H - CH - 70);

        var hn = d.hands[0].length, hy = H - CH - 64;
        var canPlay = d.phase === 'play' && d.turn === 0;
        for (i = 0; i < hn; i++) {
          var ok = canPlay && !legal(g, 0, d.hands[0][i]);
          C.draw(c, d.hands[0][i], fanX(i, hn, CW), hy, CW, CH, {
            faceUp: true, hint: ok || d.phase === 'toss',
            dim: d.out === 0 || (canPlay && !ok)
          });
        }
        c.fillStyle = d.turn === 0 ? '#ffd257' : 'rgba(255,255,255,.6)';
        c.font = '700 13px Outfit, sans-serif';
        c.fillText('YOU' + (d.dealer === 0 ? '  [dealer]' : '') +
          (d.out === 0 ? '  ·  sitting out' : '  ·  ' + d.tricks[0] + ' tricks'), W / 2, H - 56);

        buttons(g).forEach(function (b) { drawBtn(c, b); });

        if (d.phase === 'summary' && d.summary) {
          c.fillStyle = 'rgba(4,14,16,.93)';
          U.roundRect(c, W / 2 - 280, H / 2 - 120, 560, 256, 16); c.fill();
          c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1.5; c.stroke();
          c.fillStyle = '#ffd257';
          c.font = '800 24px Outfit, sans-serif';
          c.fillText(d.summary.title, W / 2, H / 2 - 76);
          c.fillStyle = '#dbe4ff';
          c.font = '600 14px Outfit, sans-serif';
          d.summary.lines.forEach(function (ln, k) { c.fillText(ln, W / 2, H / 2 - 40 + k * 26); });
          c.fillStyle = '#fff';
          c.font = '800 19px Outfit, sans-serif';
          c.fillText('US ' + d.score[0] + '   —   THEM ' + d.score[1], W / 2, H / 2 + 40);
          c.fillStyle = 'rgba(255,255,255,.45)';
          c.font = '600 12px Outfit, sans-serif';
          c.fillText('first to 10 wins the game', W / 2, H / 2 + 64);
        }
      }
    });
  }

  window.Milo.register({
    id: 'euchre', title: 'Euchre', emo: '🎴', category: 'Cards',
    tagline: 'Right bower, left bower, and a lone hand',
    description: 'Partnership euchre on the 24-card deck. The Jack of trump is the right ' +
      'bower and the other Jack of the same colour becomes the left bower — it even counts as ' +
      'a trump for following suit, which catches people out. Order up the turned card or, ' +
      'after it is turned down, name a different suit; three tricks scores one, all five ' +
      'scores two, and a lone hand that sweeps all five scores four. Miss your contract and ' +
      'the other side is euchred you for two. No stick-the-dealer: a passed-out deal is ' +
      'simply thrown in. First to 10.',
    controls: ['Click a card', 'Order up', 'Alone'],
    colors: ['#1b4750', '#34d399'],
    tags: ['cards', 'trick taking', 'partnership', 'bowers'],
    mount: mount
  });
})();
