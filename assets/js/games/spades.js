/* Spades — partnerships, nil bids, bags, spades always trump. Race to 500. */
(function () {
  'use strict';
  var W = 940, H = 620, CW = 58, CH = 82;
  var NAMES = ['You', 'West', 'Partner', 'East'];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util, C = Milo.cards;

    function val(c) { return c.r === 0 ? 14 : c.r + 1; }
    function team(seat) { return seat % 2; }          // 0 = you + partner
    function sortHand(h) {
      h.sort(function (a, b) { return a.s - b.s || val(a) - val(b); });
    }
    function bad(g, why) {
      g.data.msg = why;
      Milo.sound.tone({ f: 150, d: .08, v: .05, type: 'square' });
    }

    /* -------------------------------------------------------------- setup */

    function reset(g) {
      var d = g.data;
      d.score = [0, 0];
      d.bags = [0, 0];
      d.handNo = 0;
      d.dealer = 3;
      g.score = 0;
      g.set('Us', 0); g.set('Them', 0); g.set('Bags', 0);
      newHand(g);
    }

    function newHand(g) {
      var d = g.data, i;
      d.handNo++;
      d.dealer = (d.dealer + 1) % 4;
      var deck = C.shuffled();
      d.hands = [[], [], [], []];
      for (i = 0; i < 52; i++) d.hands[i % 4].push(deck[i]);
      for (i = 0; i < 4; i++) sortHand(d.hands[i]);
      d.bids = [null, null, null, null];
      d.tricks = [0, 0, 0, 0];
      d.broken = false;
      d.trick = [];
      d.think = 0;
      d.summary = null;
      d.lastTrick = '';
      d.phase = 'bid';
      d.turn = (d.dealer + 1) % 4;
      d.msg = d.turn === 0 ? 'Your bid — how many tricks?' : NAMES[d.turn] + ' is bidding';
      if (d.turn !== 0) d.think = 0.6;
      stats(g);
    }

    function stats(g) {
      var d = g.data;
      g.set('Us', d.score[0]); g.set('Them', d.score[1]);
      g.set('Bags', d.bags[0]);
    }

    /* ------------------------------------------------------------ bidding */

    function aiBid(g, seat) {
      var d = g.data, hand = d.hands[seat], i;
      var spades = hand.filter(function (c) { return c.s === 0; });
      var pts = 0;
      // high spades
      spades.forEach(function (c) {
        if (val(c) === 14) pts += 1;
        else if (val(c) === 13) pts += spades.length > 1 ? 0.9 : 0.5;
        else if (val(c) === 12) pts += spades.length > 2 ? 0.7 : 0.3;
      });
      if (spades.length > 3) pts += (spades.length - 3) * 0.7;
      for (var s = 1; s < 4; s++) {
        var suit = hand.filter(function (c) { return c.s === s; });
        suit.forEach(function (c) {
          if (val(c) === 14) pts += 0.95;
          else if (val(c) === 13) pts += suit.length >= 2 ? 0.6 : 0.2;
          else if (val(c) === 12 && suit.length >= 3) pts += 0.25;
        });
        if (suit.length === 0 && spades.length >= 2) pts += 0.8;
        else if (suit.length === 1 && spades.length >= 3) pts += 0.4;
      }
      var bid = Math.round(pts);
      // Nil: no aces, no high spades, short in spades.
      var hasAce = hand.some(function (c) { return val(c) === 14; });
      var highSpade = spades.some(function (c) { return val(c) >= 11; });
      var kings = hand.filter(function (c) { return val(c) === 13; }).length;
      var partnerBid = d.bids[(seat + 2) % 4];
      if (!hasAce && !highSpade && spades.length <= 3 && kings === 0 &&
        (partnerBid === null || partnerBid > 0)) return 0;
      return Math.max(1, Math.min(13, bid));
    }

    function placeBid(g, seat, bid) {
      var d = g.data;
      d.bids[seat] = bid;
      Milo.sound.click();
      var next = (seat + 1) % 4;
      if (next === (d.dealer + 1) % 4) {
        d.phase = 'play';
        d.turn = (d.dealer + 1) % 4;
        d.msg = d.turn === 0 ? 'Your lead — spades cannot be led yet'
          : NAMES[d.turn] + ' leads';
        if (d.turn !== 0) d.think = 0.6;
        return;
      }
      d.turn = next;
      d.msg = next === 0 ? 'Your bid — how many tricks?' : NAMES[next] + ' is bidding';
      if (next !== 0) d.think = 0.6;
    }

    /* --------------------------------------------------------------- play */

    function legal(g, seat, card) {
      var d = g.data, hand = d.hands[seat];
      if (!d.trick.length) {
        if (card.s === 0 && !d.broken) {
          if (hand.some(function (c) { return c.s !== 0; })) return 'spades are not broken yet';
        }
        return null;
      }
      var led = d.trick[0].card.s;
      if (card.s !== led && hand.some(function (c) { return c.s === led; })) {
        return 'you must follow suit — play a ' + C.SUITS[led];
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
      if (card.s === 0) d.broken = true;
      Milo.sound.tone({ f: 430, f2: 520, d: .05, v: .05, type: 'triangle' });
      if (d.trick.length === 4) { d.phase = 'trickend'; d.think = 0.9; return; }
      d.turn = (seat + 1) % 4;
      if (d.turn !== 0) d.think = 0.5;
      d.msg = d.turn === 0 ? 'Your turn — follow ' + C.SUITS[d.trick[0].card.s]
        : NAMES[d.turn] + ' to play';
    }

    function trickWinner(trick) {
      var led = trick[0].card.s, best = 0;
      for (var i = 1; i < trick.length; i++) {
        var a = trick[i].card, b = trick[best].card;
        if (a.s === 0 && b.s !== 0) best = i;
        else if (a.s === b.s && val(a) > val(b)) best = i;
      }
      return best;
    }

    function finishTrick(g) {
      var d = g.data;
      var wi = trickWinner(d.trick), winner = d.trick[wi].seat;
      d.tricks[winner]++;
      d.lastTrick = NAMES[winner] + ' took it with the ' + C.label(d.trick[wi].card);
      if (team(winner) === 0) Milo.sound.coin(); else Milo.sound.click();
      d.trick = [];
      d.turn = winner;
      if (!d.hands[0].length) { endHand(g); return; }
      d.phase = 'play';
      d.msg = winner === 0 ? 'Your lead' : NAMES[winner] + ' leads';
      if (winner !== 0) d.think = 0.6;
    }

    function endHand(g) {
      var d = g.data, t, lines = [];
      var delta = [0, 0];
      for (t = 0; t < 2; t++) {
        var a = t, b = t + 2;
        var contract = (d.bids[a] || 0) + (d.bids[b] || 0);
        var took = d.tricks[a] + d.tricks[b];
        var pts = 0, note = [];
        [a, b].forEach(function (seat) {
          if (d.bids[seat] === 0) {
            if (d.tricks[seat] === 0) { pts += 100; note.push(NAMES[seat] + ' made nil +100'); }
            else { pts -= 100; note.push(NAMES[seat] + ' broke nil -100'); }
          }
        });
        if (contract > 0) {
          if (took >= contract) {
            var bags = took - contract;
            pts += contract * 10 + bags;
            d.bags[t] += bags;
            note.push('bid ' + contract + ', took ' + took + ' (+' + (contract * 10 + bags) + ')');
            if (d.bags[t] >= 10) { d.bags[t] -= 10; pts -= 100; note.push('ten bags — 100 penalty'); }
          } else {
            pts -= contract * 10;
            note.push('bid ' + contract + ', took only ' + took + ' (-' + contract * 10 + ')');
          }
        } else if (took > 0) {
          d.bags[t] += took;
          pts += took;
          note.push(took + ' bag' + (took > 1 ? 's' : ''));
          if (d.bags[t] >= 10) { d.bags[t] -= 10; pts -= 100; note.push('ten bags — 100 penalty'); }
        }
        delta[t] = pts;
        d.score[t] += pts;
        lines.push((t === 0 ? 'Us: ' : 'Them: ') + note.join(', '));
      }
      d.summary = {
        title: 'Hand ' + d.handNo,
        lines: lines,
        delta: delta
      };
      d.phase = 'summary';
      stats(g);
      g.score = Math.max(0, d.score[0]);
    }

    function nextHand(g) {
      var d = g.data;
      var over = d.score[0] >= 500 || d.score[1] >= 500 || d.score[0] <= -200 || d.score[1] <= -200;
      if (over) {
        var wonIt = d.score[0] > d.score[1];
        (wonIt ? g.win : g.gameOver).call(g, {
          emo: wonIt ? '♠️' : '🙃',
          title: wonIt ? 'Game — you and your partner win' : 'The opponents get there first',
          text: 'Final score  us ' + d.score[0] + '  ·  them ' + d.score[1] +
            '  over ' + d.handNo + ' hands.',
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
      var myBid = d.bids[seat] || 0;
      var teamBid = myBid + (d.bids[partner] || 0);
      var teamTook = d.tricks[seat] + d.tricks[partner];
      var iAmNil = d.bids[seat] === 0;
      var partnerNil = d.bids[partner] === 0;
      var need = teamTook < teamBid;
      var pick;

      function lowest(list) {
        return list.slice().sort(function (a, b) { return val(a) - val(b); })[0];
      }
      function highest(list) {
        return list.slice().sort(function (a, b) { return val(b) - val(a); })[0];
      }

      if (!d.trick.length) {
        var side = cards.filter(function (c) { return c.s !== 0; });
        if (iAmNil) {
          pick = lowest(side.length ? side : cards);
        } else {
          var aces = side.filter(function (c) { return val(c) === 14; });
          var bigSpades = cards.filter(function (c) { return c.s === 0 && val(c) >= 13; });
          if (need && aces.length) pick = aces[0];
          else if (need && bigSpades.length && d.broken) pick = highest(bigSpades);
          else if (partnerNil && side.length) pick = highest(side);
          else pick = lowest(side.length ? side : cards);
        }
      } else {
        var led = d.trick[0].card.s;
        var wi = trickWinner(d.trick);
        var winSeat = d.trick[wi].seat, winCard = d.trick[wi].card;
        var partnerWins = winSeat === partner;
        var follow = cards.filter(function (c) { return c.s === led; });

        function beats(c) {
          if (c.s === 0 && winCard.s !== 0) return true;
          return c.s === winCard.s && val(c) > val(winCard);
        }
        var winners = cards.filter(beats);

        if (iAmNil) {
          var safe = cards.filter(function (c) { return !beats(c); });
          pick = safe.length ? highest(safe) : lowest(cards);
        } else if (follow.length) {
          if (partnerWins && !partnerNil) pick = lowest(follow);
          else if (partnerNil) {
            var cover = follow.filter(beats);
            pick = cover.length ? lowest(cover) : lowest(follow);
          } else if (need || d.trick.length === 3) {
            var w2 = follow.filter(beats);
            pick = w2.length ? lowest(w2) : lowest(follow);
          } else pick = lowest(follow);
        } else {
          var spades = cards.filter(function (c) { return c.s === 0; });
          var junk = cards.filter(function (c) { return c.s !== 0; });
          if (partnerWins && !partnerNil) pick = junk.length ? lowest(junk) : lowest(spades);
          else if (spades.length && (need || partnerNil || d.trick.length === 3)) {
            var goodTrumps = spades.filter(beats);
            pick = goodTrumps.length ? lowest(goodTrumps) : lowest(spades);
          } else pick = junk.length ? lowest(junk) : lowest(spades);
        }
      }
      playCard(g, seat, pick);
    }

    /* ------------------------------------------------------------ drawing */

    function fanX(i, n, w) {
      var step = Math.min(w + 6, (W - 170) / Math.max(1, n));
      return (W - (n - 1) * step - w) / 2 + i * step;
    }
    function hit(b, x, y) { return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h; }
    function drawBtn(c, b) {
      c.fillStyle = b.primary ? '#22d3ee' : 'rgba(255,255,255,.14)';
      U.roundRect(c, b.x, b.y, b.w, b.h, 8); c.fill();
      c.fillStyle = b.primary ? '#062a33' : '#eef2ff';
      c.font = '700 ' + (b.w < 56 ? 13 : 14) + 'px Outfit, sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 1);
    }

    function buttons(g) {
      var d = g.data, out = [];
      if (d.phase === 'summary') {
        out.push({ id: 'next', label: 'Next hand', x: W / 2 - 70, y: H / 2 + 104, w: 140, h: 40, primary: true });
        return out;
      }
      if (d.phase === 'bid' && d.turn === 0) {
        for (var i = 0; i <= 13; i++) {
          out.push({
            id: 'bid' + i, bid: i, label: i === 0 ? 'Nil' : String(i),
            x: 30 + i * 64, y: H - 50, w: 56, h: 38, primary: i === 0
          });
        }
      }
      return out;
    }

    var SEATPOS = [
      { x: W / 2 - CW / 2, y: H / 2 + 30 },
      { x: W / 2 - CW / 2 - 128, y: H / 2 - 32 },
      { x: W / 2 - CW / 2, y: H / 2 - 120 },
      { x: W / 2 - CW / 2 + 128, y: H / 2 - 32 }
    ];

    return Milo.arcade(host, {
      id: 'spades',
      w: W, h: H, bg: '#101b2e', stats: ['Us', 'Them', 'Bags'],
      emo: '♠️',
      start: {
        title: 'Spades',
        text: 'You and your partner sit across from each other and bid the tricks you think ' +
          'you will take. Spades are always trump and may not be led until one has been ' +
          'played. Make your contract for ten a trick; miss it and you lose the lot. Bid nil ' +
          'for 100 if you can dodge every trick. Overtricks are bags — ten of them costs 100. ' +
          'First side to 500.',
        keys: ['Click a card', 'Click a bid']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data, i;
        var bs = buttons(g);
        for (i = 0; i < bs.length; i++) {
          if (!hit(bs[i], x, y)) continue;
          if (bs[i].id === 'next') { nextHand(g); return; }
          if (bs[i].bid !== undefined) { placeBid(g, 0, bs[i].bid); return; }
        }
        if (d.phase !== 'play') return;

        var n = d.hands[0].length, hy = H - CH - 68;
        for (i = n - 1; i >= 0; i--) {
          var cx = fanX(i, n, CW);
          if (x < cx || x > cx + CW || y < hy || y > hy + CH) continue;
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
          if (d.phase === 'bid' && d.turn !== 0) { placeBid(g, d.turn, aiBid(g, d.turn)); return; }
          if (d.phase === 'play' && d.turn !== 0) aiPlay(g, d.turn);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, i;
        var bg = c.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * .72);
        bg.addColorStop(0, '#22345c'); bg.addColorStop(1, '#0a1020');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        c.textAlign = 'center'; c.textBaseline = 'alphabetic';
        var info = [null, { x: 82, y: H / 2 - 40 }, { x: W / 2, y: 30 }, { x: W - 82, y: H / 2 - 40 }];
        for (i = 1; i < 4; i++) {
          var o = info[i];
          c.fillStyle = d.turn === i ? '#ffd257' : 'rgba(255,255,255,.62)';
          c.font = '700 13px Outfit, sans-serif';
          c.fillText(NAMES[i] + (i === 2 ? ' (ours)' : ''), o.x, o.y - 8);
          c.fillStyle = 'rgba(255,255,255,.45)';
          c.font = '600 11px Outfit, sans-serif';
          c.fillText('bid ' + (d.bids[i] === null ? '—' : d.bids[i] === 0 ? 'NIL' : d.bids[i]) +
            '  ·  won ' + d.tricks[i], o.x, o.y + 8);
          for (var k = 0; k < d.hands[i].length; k++) {
            C.draw(c, d.hands[i][k], o.x - 34 + k * 5.2, o.y + 18, 40, 56, { faceUp: false });
          }
        }

        d.trick.forEach(function (t) {
          var p = SEATPOS[t.seat];
          C.draw(c, t.card, p.x, p.y, CW, CH, { faceUp: true });
        });
        if (!d.trick.length && d.lastTrick) {
          c.fillStyle = 'rgba(255,255,255,.35)';
          c.font = '600 12px Outfit, sans-serif';
          c.fillText(d.lastTrick, W / 2, H / 2 - 6);
        }

        c.fillStyle = '#e6ecff';
        c.font = '700 16px Outfit, sans-serif';
        c.fillText(d.msg, W / 2, H - CH - 94);
        c.fillStyle = 'rgba(255,255,255,.5)';
        c.font = '600 12px Outfit, sans-serif';
        var us = (d.bids[0] === null ? '—' : d.bids[0] === 0 ? 'NIL' : d.bids[0]);
        c.fillText('Your bid ' + us + '  ·  you have won ' + d.tricks[0] +
          '  ·  spades ' + (d.broken ? 'broken' : 'not broken') +
          '  ·  bags us ' + d.bags[0] + ' / them ' + d.bags[1], W / 2, H - CH - 74);

        var hn = d.hands[0].length, hy = H - CH - 68;
        var canPlay = d.phase === 'play' && d.turn === 0;
        for (i = 0; i < hn; i++) {
          var ok = canPlay && !legal(g, 0, d.hands[0][i]);
          C.draw(c, d.hands[0][i], fanX(i, hn, CW), hy, CW, CH, {
            faceUp: true, hint: ok, dim: canPlay && !ok
          });
        }

        if (d.phase === 'bid' && d.turn === 0) {
          c.fillStyle = 'rgba(255,255,255,.55)';
          c.font = '600 12px Outfit, sans-serif';
          c.fillText('Pick your bid — Nil pays 100 if you take no tricks at all', W / 2, H - 58);
        }
        buttons(g).forEach(function (b) { drawBtn(c, b); });

        if (d.phase === 'summary' && d.summary) {
          c.fillStyle = 'rgba(6,10,24,.92)';
          U.roundRect(c, W / 2 - 300, H / 2 - 130, 600, 288, 16); c.fill();
          c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1.5; c.stroke();
          c.fillStyle = '#ffd257';
          c.font = '800 24px Outfit, sans-serif';
          c.fillText(d.summary.title, W / 2, H / 2 - 90);
          c.fillStyle = '#dbe4ff';
          c.font = '600 13px Outfit, sans-serif';
          d.summary.lines.forEach(function (ln, k) { c.fillText(ln, W / 2, H / 2 - 52 + k * 24); });
          c.fillStyle = '#9fb3d9';
          c.font = '700 14px Outfit, sans-serif';
          c.fillText('This hand:  us ' + (d.summary.delta[0] >= 0 ? '+' : '') + d.summary.delta[0] +
            '   them ' + (d.summary.delta[1] >= 0 ? '+' : '') + d.summary.delta[1], W / 2, H / 2 + 22);
          c.fillStyle = '#fff';
          c.font = '800 19px Outfit, sans-serif';
          c.fillText('US ' + d.score[0] + '   —   THEM ' + d.score[1], W / 2, H / 2 + 58);
          c.fillStyle = 'rgba(255,255,255,.45)';
          c.font = '600 12px Outfit, sans-serif';
          c.fillText('game to 500  ·  bags: us ' + d.bags[0] + ', them ' + d.bags[1], W / 2, H / 2 + 82);
        }
      }
    });
  }

  window.Milo.register({
    id: 'spades', title: 'Spades', emo: '♠️', category: 'Cards',
    tagline: 'Bid it, make it, and watch the bags',
    description: 'Partnership spades played to 500. Everyone bids the tricks they expect; ' +
      'the team score is ten a trick for making the combined contract and nothing at all for ' +
      'missing it. Spades are trump and cannot be led until one has been played off-suit. ' +
      'Bid nil for a 100-point bonus, or 100 against you if a single trick sticks to your ' +
      'hand — your partner will try to cover you. Overtricks pile up as bags and every tenth ' +
      'bag costs 100. Tricks a nil bidder does take still count toward their partner\'s contract, which is the usual online rule.',
    controls: ['Click a bid', 'Click a card'],
    colors: ['#22345c', '#a78bfa'],
    tags: ['cards', 'trick taking', 'partnership', 'vs cpu'],
    mount: mount
  });
})();
