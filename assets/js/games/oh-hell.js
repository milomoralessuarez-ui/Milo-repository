/* Oh Hell! — exact bids, hands of 1 up to 7 and back down, trump flipped
   every deal, and the dealer never allowed to make the bids add up. */
(function () {
  'use strict';
  var W = 940, H = 620, CW = 66, CH = 92;
  var NAMES = ['You', 'Ash', 'Bex', 'Cy'];
  var SIZES = [1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util, C = Milo.cards;

    function val(c) { return c.r === 0 ? 14 : c.r + 1; }
    function sortHand(h, tr) {
      h.sort(function (a, b) {
        var at = a.s === tr ? 1 : 0, bt = b.s === tr ? 1 : 0;
        if (at !== bt) return at - bt;
        return a.s - b.s || val(a) - val(b);
      });
    }
    function bad(g, why) {
      g.data.msg = why;
      Milo.sound.tone({ f: 150, d: .08, v: .05, type: 'square' });
    }

    /* -------------------------------------------------------------- setup */

    function reset(g) {
      var d = g.data;
      d.total = [0, 0, 0, 0];
      d.handIx = -1;
      d.dealer = 3;
      g.score = 0;
      g.set('Score', 0); g.set('Bid', '–'); g.set('Hand', '1 of 13');
      newHand(g);
    }

    function newHand(g) {
      var d = g.data, i, p;
      d.handIx++;
      d.size = SIZES[d.handIx];
      d.dealer = (d.dealer + 1) % 4;
      var deck = C.shuffled();
      d.hands = [[], [], [], []];
      for (p = 0; p < 4; p++) d.hands[p] = deck.splice(0, d.size);
      d.trumpCard = deck.pop();
      d.trump = d.trumpCard.s;
      for (p = 0; p < 4; p++) sortHand(d.hands[p], d.trump);
      d.bids = [null, null, null, null];
      d.won = [0, 0, 0, 0];
      d.trick = [];
      d.phase = 'bid';
      d.turn = (d.dealer + 1) % 4;
      d.think = d.turn === 0 ? 0 : 0.7;
      d.summary = null;
      d.lastTrick = '';
      d.msg = d.turn === 0 ? 'Your bid — exactly how many tricks?' : NAMES[d.turn] + ' is bidding';
      g.set('Hand', (d.handIx + 1) + ' of 13');
      g.set('Bid', '–');
      g.set('Score', d.total[0]);
    }

    function bidsSoFar(g) {
      var d = g.data, t = 0;
      for (var i = 0; i < 4; i++) if (d.bids[i] !== null) t += d.bids[i];
      return t;
    }
    function forbiddenBid(g, seat) {
      var d = g.data;
      if (seat !== d.dealer) return -1;
      var rest = bidsSoFar(g);
      var need = d.size - rest;
      return need >= 0 && need <= d.size ? need : -1;
    }

    /* ------------------------------------------------------------ bidding */

    function estimate(g, seat) {
      var d = g.data, e = 0;
      d.hands[seat].forEach(function (c) {
        if (c.s === d.trump) {
          e += val(c) === 14 ? 0.95 : val(c) === 13 ? 0.85 : val(c) === 12 ? 0.7
            : val(c) >= 10 ? 0.55 : 0.35;
        } else {
          e += val(c) === 14 ? 0.82 : val(c) === 13 ? 0.55 : val(c) === 12 ? 0.3
            : val(c) >= 11 ? 0.15 : 0.05;
        }
      });
      return e;
    }

    function aiBid(g, seat) {
      var d = g.data;
      var bid = Math.round(estimate(g, seat));
      bid = Math.max(0, Math.min(d.size, bid));
      var no = forbiddenBid(g, seat);
      if (bid === no) {
        var e = estimate(g, seat);
        if (e > bid && bid < d.size) bid++;
        else if (bid > 0) bid--;
        else bid++;
        bid = Math.max(0, Math.min(d.size, bid));
      }
      placeBid(g, seat, bid);
    }

    function placeBid(g, seat, bid) {
      var d = g.data;
      d.bids[seat] = bid;
      Milo.sound.click();
      if (seat === 0) g.set('Bid', bid + ' / 0');
      var next = (seat + 1) % 4;
      if (next === (d.dealer + 1) % 4) {
        d.phase = 'play';
        d.turn = (d.dealer + 1) % 4;
        d.msg = d.turn === 0 ? 'Your lead' : NAMES[d.turn] + ' leads';
        if (d.turn !== 0) d.think = 0.6;
        return;
      }
      d.turn = next;
      d.msg = next === 0 ? 'Your bid — exactly how many tricks?' : NAMES[next] + ' is bidding';
      if (next !== 0) d.think = 0.7;
    }

    /* --------------------------------------------------------------- play */

    function legal(g, seat, card) {
      var d = g.data;
      if (!d.trick.length) return null;
      var led = d.trick[0].card.s;
      if (card.s !== led && d.hands[seat].some(function (c) { return c.s === led; })) {
        return 'you must follow suit — play a ' + C.SUITS[led];
      }
      return null;
    }
    function legalCards(g, seat) {
      return g.data.hands[seat].filter(function (c) { return !legal(g, seat, c); });
    }
    function power(g, c, led) {
      var d = g.data;
      if (c.s === d.trump) return 200 + val(c);
      if (c.s === led) return val(c);
      return -1;
    }

    function playCard(g, seat, card) {
      var d = g.data;
      var h = d.hands[seat];
      h.splice(h.indexOf(card), 1);
      d.trick.push({ seat: seat, card: card });
      Milo.sound.tone({ f: 430, f2: 520, d: .05, v: .05, type: 'triangle' });
      if (d.trick.length === 4) { d.phase = 'trickend'; d.think = 0.9; return; }
      d.turn = (seat + 1) % 4;
      if (d.turn !== 0) d.think = 0.5;
      d.msg = d.turn === 0 ? 'Your turn — follow ' + C.SUITS[d.trick[0].card.s]
        : NAMES[d.turn] + ' to play';
    }

    function finishTrick(g) {
      var d = g.data;
      var led = d.trick[0].card.s, best = 0;
      for (var i = 1; i < 4; i++) {
        if (power(g, d.trick[i].card, led) > power(g, d.trick[best].card, led)) best = i;
      }
      var winner = d.trick[best].seat;
      d.won[winner]++;
      d.lastTrick = NAMES[winner] + ' took it with the ' + C.label(d.trick[best].card);
      if (winner === 0) {
        g.set('Bid', d.bids[0] + ' / ' + d.won[0]);
        Milo.sound.coin();
      } else Milo.sound.click();
      d.trick = [];
      if (!d.hands[0].length) { endHand(g); return; }
      d.turn = winner;
      d.phase = 'play';
      d.msg = winner === 0 ? 'Your lead' : NAMES[winner] + ' leads';
      if (winner !== 0) d.think = 0.6;
    }

    function endHand(g) {
      var d = g.data, i;
      var add = [0, 0, 0, 0], lines = [];
      for (i = 0; i < 4; i++) {
        add[i] = d.won[i] === d.bids[i] ? 10 + d.bids[i] : 0;
        d.total[i] += add[i];
      }
      lines.push(NAMES.map(function (n, k) {
        return n + ' bid ' + d.bids[k] + ', took ' + d.won[k] + ' → +' + add[k];
      }).join('\n'));
      d.summary = {
        title: add[0] ? 'Bid made — +' + add[0] : 'Missed the bid — nothing',
        rows: NAMES.map(function (n, k) {
          return { name: n, bid: d.bids[k], won: d.won[k], add: add[k], total: d.total[k] };
        })
      };
      d.phase = 'summary';
      g.score = d.total[0];
      g.set('Score', d.total[0]);
    }

    function nextHand(g) {
      var d = g.data, i;
      if (d.handIx >= SIZES.length - 1) {
        var best = 0;
        for (i = 1; i < 4; i++) if (d.total[i] > d.total[best]) best = i;
        var wonIt = d.total[0] >= d.total[best];
        (wonIt ? g.win : g.gameOver).call(g, {
          emo: wonIt ? '🎯' : '📉',
          title: wonIt ? 'Top of the table!' : NAMES[best] + ' wins the match',
          text: NAMES.map(function (n, k) { return n + ' ' + d.total[k]; }).join('   '),
          score: d.total[0]
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
      var need = d.bids[seat] - d.won[seat];
      var left = d.hands[seat].length;
      var wantTrick = need > 0;
      var mustDuck = need <= 0;
      var pick;

      function byPower(list, led) {
        return list.slice().sort(function (a, b) { return power(g, a, led) - power(g, b, led); });
      }

      if (!d.trick.length) {
        var led0 = -1;
        var sorted = cards.slice().sort(function (a, b) {
          var at = a.s === d.trump ? 1 : 0, bt = b.s === d.trump ? 1 : 0;
          if (at !== bt) return at - bt;
          return val(a) - val(b);
        });
        if (wantTrick && need >= left) pick = sorted[sorted.length - 1];
        else if (wantTrick) {
          var aces = cards.filter(function (c) { return val(c) === 14; });
          var hiTrump = cards.filter(function (c) { return c.s === d.trump && val(c) >= 12; });
          pick = hiTrump.length ? hiTrump[hiTrump.length - 1] : aces.length ? aces[0] : sorted[sorted.length - 1];
        } else {
          var off = cards.filter(function (c) { return c.s !== d.trump; });
          pick = off.length ? off.slice().sort(function (a, b) { return val(a) - val(b); })[0] : sorted[0];
        }
      } else {
        var led = d.trick[0].card.s, bi = 0;
        for (var i = 1; i < d.trick.length; i++) {
          if (power(g, d.trick[i].card, led) > power(g, d.trick[bi].card, led)) bi = i;
        }
        var topPow = power(g, d.trick[bi].card, led);
        var winners = cards.filter(function (c) { return power(g, c, led) > topPow; });
        var losers = cards.filter(function (c) { return power(g, c, led) <= topPow; });
        var lastToPlay = d.trick.length === 3;
        if (wantTrick && winners.length) {
          pick = lastToPlay ? byPower(winners, led)[0] : byPower(winners, led)[0];
        } else if (mustDuck && losers.length) {
          pick = byPower(losers, led)[losers.length - 1];
        } else if (losers.length) {
          pick = byPower(losers, led)[0];
        } else {
          pick = byPower(cards, led)[0];
        }
      }
      playCard(g, seat, pick);
    }

    /* ------------------------------------------------------------ drawing */

    function fanX(i, n, w) {
      var step = Math.min(w + 14, (W - 240) / Math.max(1, n));
      return (W - (n - 1) * step - w) / 2 + i * step;
    }
    function hitB(b, x, y) { return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h; }
    function drawBtn(c, b) {
      c.fillStyle = b.off ? 'rgba(255,255,255,.07)' : b.primary ? '#22d3ee' : 'rgba(255,255,255,.16)';
      U.roundRect(c, b.x, b.y, b.w, b.h, 9); c.fill();
      c.fillStyle = b.off ? 'rgba(255,255,255,.3)' : b.primary ? '#062a33' : '#eef2ff';
      c.font = '700 15px Outfit, sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 1);
    }
    function buttons(g) {
      var d = g.data, out = [];
      if (d.phase === 'summary') {
        return [{ id: 'next', label: d.handIx >= SIZES.length - 1 ? 'Final score' : 'Next deal', x: W / 2 - 75, y: H / 2 + 118, w: 150, h: 40, primary: true }];
      }
      if (d.phase === 'bid' && d.turn === 0) {
        var no = forbiddenBid(g, 0);
        var n = d.size + 1;
        var bw = Math.min(64, (W - 120) / n);
        for (var i = 0; i <= d.size; i++) {
          out.push({
            id: 'b' + i, bid: i, label: String(i),
            x: W / 2 - (n * (bw + 8) - 8) / 2 + i * (bw + 8), y: H - 50, w: bw, h: 38,
            primary: i !== no, off: i === no
          });
        }
      }
      return out;
    }

    var SEATPOS = [
      { x: W / 2 - CW / 2, y: H / 2 + 30 },
      { x: W / 2 - CW / 2 - 140, y: H / 2 - 36 },
      { x: W / 2 - CW / 2, y: H / 2 - 126 },
      { x: W / 2 - CW / 2 + 140, y: H / 2 - 36 }
    ];

    return Milo.arcade(host, {
      id: 'oh-hell',
      w: W, h: H, bg: '#1d1430', stats: ['Score', 'Bid', 'Hand'],
      emo: '🎯',
      start: {
        title: 'Oh Hell!',
        text: 'Thirteen deals: one card, then two, up to seven and back down to one, with a ' +
          'fresh trump turned over every time. Bid the exact number of tricks you will take — ' +
          'ten points plus your bid for getting it spot on, and nothing at all otherwise. The ' +
          'dealer bids last and is never allowed to make the bids add up to the tricks ' +
          'available, so somebody always goes home unhappy.',
        keys: ['Click a bid', 'Click a card']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data, i;
        var bs = buttons(g);
        for (i = 0; i < bs.length; i++) {
          if (!hitB(bs[i], x, y)) continue;
          if (bs[i].id === 'next') { nextHand(g); return; }
          if (bs[i].bid !== undefined) {
            if (bs[i].off) {
              bad(g, 'As dealer you cannot bid ' + bs[i].bid +
                ' — the bids would add up to exactly ' + d.size + ' trick' + (d.size > 1 ? 's' : ''));
              return;
            }
            placeBid(g, 0, bs[i].bid);
            return;
          }
        }
        if (d.phase !== 'play') return;

        var n = d.hands[0].length, hy = H - CH - 70;
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
          if (d.phase === 'bid' && d.turn !== 0) { aiBid(g, d.turn); return; }
          if (d.phase === 'play' && d.turn !== 0) aiPlay(g, d.turn);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, i;
        var bg = c.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * .75);
        bg.addColorStop(0, '#3c2a63'); bg.addColorStop(1, '#130d20');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);
        c.textAlign = 'center'; c.textBaseline = 'alphabetic';

        var info = [null, { x: 96, y: H / 2 - 40 }, { x: W / 2, y: 34 }, { x: W - 96, y: H / 2 - 40 }];
        for (i = 1; i < 4; i++) {
          var o = info[i];
          c.fillStyle = d.turn === i ? '#ffd257' : 'rgba(255,255,255,.7)';
          c.font = '800 14px Outfit, sans-serif';
          c.fillText(NAMES[i] + (d.dealer === i ? '  [D]' : ''), o.x, o.y - 10);
          c.fillStyle = 'rgba(255,255,255,.5)';
          c.font = '600 11px Outfit, sans-serif';
          c.fillText('bid ' + (d.bids[i] === null ? '–' : d.bids[i]) + ' · won ' + d.won[i] +
            ' · total ' + d.total[i], o.x, o.y + 6);
          for (var k = 0; k < d.hands[i].length; k++) {
            C.draw(c, d.hands[i][k], o.x - 26 + k * 11, o.y + 16, 42, 58, { faceUp: false });
          }
        }

        // trump
        C.draw(c, d.trumpCard, 40, 40, CW * .8, CH * .8, { faceUp: true });
        c.fillStyle = 'rgba(255,255,255,.55)';
        c.font = '600 11px Outfit, sans-serif';
        c.fillText('trump ' + C.SUITS[d.trump], 40 + CW * .4, 40 + CH * .8 + 16);

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
        c.fillText(d.msg, W / 2, H - CH - 96);
        c.fillStyle = 'rgba(255,255,255,.5)';
        c.font = '600 12px Outfit, sans-serif';
        c.fillText('Deal ' + (d.handIx + 1) + ' of 13  ·  ' + d.size + ' card' + (d.size > 1 ? 's' : '') +
          ' each  ·  your bid ' + (d.bids[0] === null ? '–' : d.bids[0]) + ', won ' + d.won[0] +
          '  ·  total ' + d.total[0], W / 2, H - CH - 76);

        var hn = d.hands[0].length, hy = H - CH - 70;
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
          var no = forbiddenBid(g, 0);
          c.fillText(no >= 0 ? 'You deal, so ' + no + ' is barred — the bids may not add up to ' + d.size
            : 'How many of the ' + d.size + ' tricks will you take?', W / 2, H - 62);
        }
        buttons(g).forEach(function (b) { drawBtn(c, b); });

        if (d.phase === 'summary' && d.summary) {
          c.fillStyle = 'rgba(8,6,20,.93)';
          U.roundRect(c, W / 2 - 280, H / 2 - 150, 560, 300, 16); c.fill();
          c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1.5; c.stroke();
          c.fillStyle = d.summary.rows[0].add ? '#34d399' : '#fb7185';
          c.font = '800 23px Outfit, sans-serif';
          c.fillText(d.summary.title, W / 2, H / 2 - 108);
          c.fillStyle = 'rgba(255,255,255,.45)';
          c.font = '700 11px Outfit, sans-serif';
          c.textAlign = 'left';
          c.fillText('PLAYER', W / 2 - 250, H / 2 - 74);
          c.fillText('BID', W / 2 - 60, H / 2 - 74);
          c.fillText('TOOK', W / 2 + 10, H / 2 - 74);
          c.fillText('SCORED', W / 2 + 90, H / 2 - 74);
          c.fillText('TOTAL', W / 2 + 190, H / 2 - 74);
          d.summary.rows.forEach(function (r, k) {
            var yy = H / 2 - 44 + k * 30;
            c.fillStyle = k === 0 ? '#22d3ee' : 'rgba(255,255,255,.8)';
            c.font = '700 14px Outfit, sans-serif';
            c.fillText(r.name, W / 2 - 250, yy);
            c.fillStyle = 'rgba(255,255,255,.8)';
            c.fillText(String(r.bid), W / 2 - 60, yy);
            c.fillText(String(r.won), W / 2 + 10, yy);
            c.fillStyle = r.add ? '#34d399' : 'rgba(255,255,255,.35)';
            c.fillText('+' + r.add, W / 2 + 90, yy);
            c.fillStyle = '#fff';
            c.fillText(String(r.total), W / 2 + 190, yy);
          });
          c.textAlign = 'center';
        }
      }
    });
  }

  window.Milo.register({
    id: 'oh-hell', title: 'Oh Hell!', emo: '🎯', category: 'Cards',
    tagline: 'Bid exactly right or score nothing',
    description: 'Thirteen deals that ramp from one card up to seven and back down again, ' +
      'with a new trump turned over each time. You bid the exact number of tricks you will ' +
      'win: hit it and you score ten plus your bid, miss it by one in either direction and ' +
      'you score zero. The dealer bids last under the hook rule — their bid may never make ' +
      'the table total equal the tricks available. The other three count their winners, duck ' +
      'once they are full, and chase hard when they are short. Highest total after the ' +
      'thirteenth deal wins.',
    controls: ['Click a bid', 'Click a card'],
    colors: ['#3c2a63', '#fbbf24'],
    tags: ['cards', 'trick taking', 'bidding', 'vs cpu'],
    mount: mount
  });
})();
