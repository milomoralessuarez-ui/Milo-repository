/* Rummy 500 — draw or dig into the discard pile, meld, lay off, play to 500. */
(function () {
  'use strict';
  var W = 980, H = 660, CW = 58, CH = 82;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util, C = Milo.cards;

    function pts(c, lowAce) { return c.r === 0 ? (lowAce ? 1 : 15) : (c.r >= 9 ? 10 : c.r + 1); }
    function sortHand(h) { h.sort(function (a, b) { return a.s - b.s || a.r - b.r; }); }
    function bad(g, why) {
      g.data.msg = why;
      Milo.sound.tone({ f: 150, d: .08, v: .05, type: 'square' });
    }
    function handValue(h) {
      var v = 0;
      h.forEach(function (c) { v += pts(c, false); });
      return v;
    }

    /* -------------------------------------------------------------- melds */

    /** Sets of 3-4, or runs of 3+ in suit (ace high or low). */
    function meldKind(cards) {
      if (cards.length < 3) return null;
      var i, same = true;
      for (i = 1; i < cards.length; i++) if (cards[i].r !== cards[0].r) same = false;
      if (same) {
        if (cards.length > 4) return null;
        var suits = {};
        for (i = 0; i < cards.length; i++) {
          if (suits[cards[i].s]) return null;
          suits[cards[i].s] = 1;
        }
        return { kind: 'set', lowAce: false };
      }
      for (i = 1; i < cards.length; i++) if (cards[i].s !== cards[0].s) return null;
      var tries = [true, false];
      for (var t = 0; t < 2; t++) {
        var low = tries[t];
        var vals = cards.map(function (c) { return c.r === 0 ? (low ? 1 : 14) : c.r + 1; });
        vals.sort(function (a, b) { return a - b; });
        var ok = true;
        for (i = 1; i < vals.length; i++) if (vals[i] !== vals[i - 1] + 1) ok = false;
        if (ok) return { kind: 'run', lowAce: low };
      }
      return null;
    }

    function runVals(meld) {
      return meld.cards.map(function (c) {
        return c.r === 0 ? (meld.lowAce ? 1 : 14) : c.r + 1;
      }).sort(function (a, b) { return a - b; });
    }

    /** Can `card` be laid off on `meld`? Returns the points it would score. */
    function layOffPts(meld, card) {
      if (meld.kind === 'set') {
        if (meld.cards.length >= 4) return -1;
        if (card.r !== meld.cards[0].r) return -1;
        for (var i = 0; i < meld.cards.length; i++) if (meld.cards[i].s === card.s) return -1;
        return pts(card, false);
      }
      if (card.s !== meld.cards[0].s) return -1;
      var vs = runVals(meld), lo = vs[0], hi = vs[vs.length - 1];
      var cand = card.r === 0 ? [1, 14] : [card.r + 1];
      for (var k = 0; k < cand.length; k++) {
        var pv = cand[k];
        if (pv === lo - 1 || pv === hi + 1) return card.r === 0 ? (pv === 1 ? 1 : 15) : pts(card, false);
      }
      return -1;
    }

    function meldPoints(cards, kind) {
      var total = 0;
      if (kind.kind === 'set') {
        cards.forEach(function (c) { total += pts(c, false); });
      } else {
        cards.forEach(function (c) { total += pts(c, kind.lowAce && c.r === 0); });
      }
      return total;
    }

    /** Could this card be used right away — laid off, or melded from the pool? */
    function canUse(g, card, pool) {
      var d = g.data, i, j;
      for (i = 0; i < d.melds.length; i++) if (layOffPts(d.melds[i], card) >= 0) return true;
      for (i = 0; i < pool.length; i++) {
        for (j = i + 1; j < pool.length; j++) {
          if (pool[i] === card || pool[j] === card) continue;
          if (meldKind([card, pool[i], pool[j]])) return true;
        }
      }
      return false;
    }

    /* -------------------------------------------------------------- setup */

    function reset(g) {
      var d = g.data;
      d.score = [0, 0];
      d.handNo = 0;
      g.score = 0;
      g.set('You', 0); g.set('Rival', 0); g.set('Melded', 0);
      newHand(g);
    }

    function newHand(g) {
      var d = g.data;
      d.handNo++;
      var deck = C.shuffled();
      d.hand = deck.splice(0, 13);
      d.ai = deck.splice(0, 13);
      sortHand(d.hand); sortHand(d.ai);
      d.stock = deck;
      d.pile = [d.stock.pop()];
      d.melds = [];
      d.banked = [0, 0];
      d.turn = 0;
      d.stage = 'draw';
      d.sel = [];
      d.mustUse = null;
      d.think = 0;
      d.phase = 'play';
      d.summary = null;
      d.log = [];
      d.msg = 'Your turn — draw from the stock or dig into the discards';
      stats(g);
    }

    function stats(g) {
      var d = g.data;
      g.set('You', d.score[0]); g.set('Rival', d.score[1]);
      g.set('Melded', d.banked[0]);
    }

    /* ------------------------------------------------------------- actions */

    function addMeld(g, who, cards, kind) {
      var d = g.data;
      var m = { kind: kind.kind, lowAce: kind.lowAce, cards: cards.slice(), owner: who };
      d.melds.push(m);
      var p = meldPoints(cards, kind);
      d.banked[who] += p;
      d.log.unshift((who === 0 ? 'You meld ' : 'Rival melds ') +
        cards.map(function (c) { return C.label(c); }).join(' ') + '  (+' + p + ')');
      Milo.sound.coin();
      stats(g);
      return p;
    }

    function endHandCheck(g, who) {
      var d = g.data;
      var hand = who === 0 ? d.hand : d.ai;
      if (!hand.length) { endHand(g, who); return true; }
      return false;
    }

    function endHand(g, wentOut) {
      var d = g.data;
      var yourLeft = handValue(d.hand), theirLeft = handValue(d.ai);
      var add = [d.banked[0] - yourLeft, d.banked[1] - theirLeft];
      d.score[0] += add[0];
      d.score[1] += add[1];
      d.summary = {
        out: wentOut,
        rows: [
          { n: 'You', meld: d.banked[0], left: yourLeft, add: add[0], tot: d.score[0] },
          { n: 'Rival', meld: d.banked[1], left: theirLeft, add: add[1], tot: d.score[1] }
        ]
      };
      d.phase = 'summary';
      stats(g);
      g.score = Math.max(0, d.score[0]);
      Milo.sound.win();
    }

    function nextHand(g) {
      var d = g.data;
      if (d.score[0] >= 500 || d.score[1] >= 500) {
        var wonIt = d.score[0] > d.score[1];
        (wonIt ? g.win : g.gameOver).call(g, {
          emo: wonIt ? '🂡' : '🫤',
          title: wonIt ? 'Five hundred — you win!' : 'The rival gets to 500 first',
          text: 'Final score  you ' + d.score[0] + '  ·  rival ' + d.score[1] +
            ' over ' + d.handNo + ' hands.',
          score: Math.max(0, d.score[0])
        });
        return;
      }
      newHand(g);
    }

    function startTurn(g, who) {
      var d = g.data;
      d.turn = who;
      d.stage = 'draw';
      d.sel = [];
      d.mustUse = null;
      if (!d.stock.length) {
        d.log.unshift('The stock is empty — the hand ends here');
        endHand(g, -1);
        return;
      }
      if (who === 0) d.msg = 'Your turn — draw from the stock or dig into the discards';
      else { d.msg = 'Rival is thinking…'; d.think = 0.9; }
    }

    function discard(g, who, card) {
      var d = g.data;
      var hand = who === 0 ? d.hand : d.ai;
      hand.splice(hand.indexOf(card), 1);
      d.pile.push(card);
      d.log.unshift((who === 0 ? 'You discard ' : 'Rival discards ') + C.label(card));
      Milo.sound.click();
      if (endHandCheck(g, who)) return;
      startTurn(g, 1 - who);
    }

    /* ----------------------------------------------------------------- AI */

    function allMelds(hand) {
      var out = [], i, j, k, r, s;
      for (r = 0; r < 13; r++) {
        var idx = [];
        for (i = 0; i < hand.length; i++) if (hand[i].r === r) idx.push(i);
        if (idx.length >= 3) {
          out.push(idx.slice());
          if (idx.length === 4) {
            for (i = 0; i < 4; i++) out.push([idx[(i + 1) % 4], idx[(i + 2) % 4], idx[(i + 3) % 4]]);
          }
        }
      }
      for (s = 0; s < 4; s++) {
        for (var lowAce = 0; lowAce < 2; lowAce++) {
          var bys = [];
          for (i = 0; i < hand.length; i++) if (hand[i].s === s) bys.push(i);
          bys.sort(function (a, b) {
            var av = hand[a].r === 0 ? (lowAce ? 1 : 14) : hand[a].r + 1;
            var bv = hand[b].r === 0 ? (lowAce ? 1 : 14) : hand[b].r + 1;
            return av - bv;
          });
          for (i = 0; i < bys.length; i++) {
            for (j = i + 2; j < bys.length; j++) {
              var slice = bys.slice(i, j + 1).map(function (x) { return hand[x]; });
              if (meldKind(slice)) out.push(bys.slice(i, j + 1));
            }
          }
        }
      }
      // de-duplicate
      var seen = {}, uniq = [];
      out.forEach(function (m) {
        var key = m.slice().sort(function (a, b) { return a - b; }).join(',');
        if (!seen[key]) { seen[key] = 1; uniq.push(m); }
      });
      return uniq;
    }

    function bestMeldSet(hand) {
      var ms = allMelds(hand);
      if (!ms.length) return { pts: 0, use: [] };
      // Only cards that appear in some meld matter, so index those compactly.
      var map = {}, back = [];
      ms.forEach(function (m) {
        m.forEach(function (i) {
          if (map[i] === undefined) { map[i] = back.length; back.push(i); }
        });
      });
      if (back.length > 16) {
        // Pathological hand: fall back to a greedy lay-down.
        var used = {}, pts0 = 0, useG = [];
        ms.sort(function (a, b) {
          return meldPoints(b.map(function (i) { return hand[i]; }), meldKind(b.map(function (i) { return hand[i]; })) || { kind: 'set' }) -
            meldPoints(a.map(function (i) { return hand[i]; }), meldKind(a.map(function (i) { return hand[i]; })) || { kind: 'set' });
        });
        ms.forEach(function (m) {
          if (m.some(function (i) { return used[i]; })) return;
          var cards = m.map(function (i) { return hand[i]; });
          var k = meldKind(cards);
          if (!k) return;
          m.forEach(function (i) { used[i] = 1; });
          pts0 += meldPoints(cards, k);
          useG.push(m);
        });
        return { pts: pts0, use: useG };
      }
      var bits = ms.map(function (m) {
        var b = 0;
        m.forEach(function (i) { b |= 1 << map[i]; });
        return b;
      });
      var memo = {};
      function go(mask) {
        if (memo[mask]) return memo[mask];
        var res = { pts: 0, use: [] };
        for (var m = 0; m < ms.length; m++) {
          if (bits[m] & mask) continue;
          var cards = ms[m].map(function (i) { return hand[i]; });
          var kind = meldKind(cards);
          if (!kind) continue;
          var sub = go(mask | bits[m]);
          var total = meldPoints(cards, kind) + sub.pts;
          if (total > res.pts) res = { pts: total, use: [ms[m]].concat(sub.use) };
        }
        memo[mask] = res;
        return res;
      }
      return go(0);
    }

    function aiTurn(g) {
      var d = g.data, i, j;

      // --- draw: is anything in the discard pile worth digging for?
      var bestTake = null;
      for (i = d.pile.length - 1; i >= 0 && d.pile.length - i <= 6; i--) {
        var card = d.pile[i];
        var taken = d.pile.slice(i);
        var pool = d.ai.concat(taken);
        if (!canUse(g, card, pool)) continue;
        var before = bestMeldSet(d.ai).pts;
        var after = bestMeldSet(pool).pts;
        var lay = 0;
        d.melds.forEach(function (m) { var p = layOffPts(m, card); if (p > lay) lay = p; });
        var junk = 0;
        taken.forEach(function (c) { if (c !== card) junk += pts(c, false); });
        var gain = Math.max(after - before, lay) - junk * 0.55;
        if (gain > 4 && (!bestTake || gain > bestTake.gain)) bestTake = { gain: gain, at: i };
      }
      if (bestTake) {
        var got = d.pile.splice(bestTake.at);
        got.forEach(function (c) { d.ai.push(c); });
        sortHand(d.ai);
        d.log.unshift('Rival digs out ' + got.length + ' card' + (got.length > 1 ? 's' : '') +
          ' for the ' + C.label(got[0]));
      } else {
        d.ai.push(d.stock.pop());
        sortHand(d.ai);
        d.log.unshift('Rival draws from the stock');
      }

      // --- meld everything it can
      var plan = bestMeldSet(d.ai);
      // Resolve every group to card objects BEFORE removing any, or the
      // remaining index lists would point at the wrong cards.
      var groups = plan.use.map(function (idxs) {
        return idxs.map(function (k) { return d.ai[k]; });
      });
      groups.forEach(function (cards) {
        if (cards.some(function (c) { return !c; })) return;
        var kind = meldKind(cards);
        if (!kind) return;
        addMeld(g, 1, cards, kind);
        cards.forEach(function (c) {
          var at = d.ai.indexOf(c);
          if (at >= 0) d.ai.splice(at, 1);
        });
      });

      // --- lay off anything that fits
      var moved = true;
      while (moved && d.ai.length) {
        moved = false;
        for (i = 0; i < d.ai.length && !moved; i++) {
          for (j = 0; j < d.melds.length && !moved; j++) {
            var p = layOffPts(d.melds[j], d.ai[i]);
            if (p < 0) continue;
            var c2 = d.ai.splice(i, 1)[0];
            d.melds[j].cards.push(c2);
            d.banked[1] += p;
            d.log.unshift('Rival lays off ' + C.label(c2) + ' (+' + p + ')');
            moved = true;
          }
        }
      }
      stats(g);
      if (!d.ai.length) { endHand(g, 1); return; }

      // --- discard the least useful card
      var worst = null;
      for (i = 0; i < d.ai.length; i++) {
        var rest = d.ai.slice(); rest.splice(i, 1);
        var keep = bestMeldSet(rest).pts;
        var risk = 0;
        d.melds.forEach(function (m) { if (layOffPts(m, d.ai[i]) >= 0) risk += 6; });
        var v = keep * 1.0 - pts(d.ai[i], false) * 0.35 - risk;
        if (!worst || v > worst.v) worst = { v: v, c: d.ai[i] };
      }
      discard(g, 1, worst.c);
    }

    /* ------------------------------------------------------------ drawing */

    function fanX(i, n, w) {
      var step = Math.min(w + 8, (W - 150) / Math.max(1, n));
      return (W - (n - 1) * step - w) / 2 + i * step;
    }
    function meldRects(g) {
      var d = g.data, out = [], rows = [[], []];
      d.melds.forEach(function (m) { rows[m.owner].push(m); });
      [1, 0].forEach(function (owner) {
        var y = owner === 1 ? 54 : 300;
        var x = 40;
        rows[owner].forEach(function (m) {
          var w = 30 + (m.cards.length - 1) * 18 + 10;
          if (x + w > W - 40) { x = 40; y += 74; }
          out.push({ m: m, x: x, y: y, w: w, h: 64, owner: owner });
          x += w + 16;
        });
      });
      return out;
    }
    function hitB(b, x, y) { return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h; }
    function drawBtn(c, b) {
      c.fillStyle = b.primary ? '#22d3ee' : 'rgba(255,255,255,.15)';
      U.roundRect(c, b.x, b.y, b.w, b.h, 9); c.fill();
      c.fillStyle = b.primary ? '#062a33' : '#eef2ff';
      c.font = '700 13px Outfit, sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 1);
    }
    function buttons(g) {
      var d = g.data;
      if (d.phase === 'summary') {
        return [{ id: 'next', label: 'Next hand', x: W / 2 - 75, y: H / 2 + 132, w: 150, h: 40, primary: true }];
      }
      if (d.turn !== 0 || d.stage !== 'play') return [];
      return [
        { id: 'meld', label: 'Meld selection', x: W / 2 - 250, y: H - 44, w: 160, h: 36, primary: true },
        { id: 'discard', label: 'Discard', x: W / 2 - 80, y: H - 44, w: 160, h: 36 },
        { id: 'clear', label: 'Clear picks', x: W / 2 + 90, y: H - 44, w: 160, h: 36 }
      ];
    }

    return Milo.arcade(host, {
      id: 'rummy-500',
      w: W, h: H, bg: '#101826', stats: ['You', 'Rival', 'Melded'],
      emo: '🂡',
      start: {
        title: 'Rummy 500',
        text: 'Thirteen cards each. Draw from the stock, or reach into the discard pile for ' +
          'any card you can use straight away — but you take every card above it too. Lay ' +
          'down sets and runs, add to anyone’s melds, and discard to finish your turn. ' +
          'Melded cards score, cards left in your hand count against you. Aces are 15, or ' +
          '1 in an A-2-3 run. First past 500.',
        keys: ['Click cards', 'Meld', 'Discard']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data, i;
        var bs = buttons(g);
        for (i = 0; i < bs.length; i++) {
          if (!hitB(bs[i], x, y)) continue;
          var id = bs[i].id;
          if (id === 'next') { nextHand(g); return; }
          if (id === 'clear') { d.sel = []; return; }
          if (id === 'meld') {
            if (d.sel.length < 3) { bad(g, 'A meld needs at least three cards'); return; }
            var cards = d.sel.map(function (k) { return d.hand[k]; });
            var kind = meldKind(cards);
            if (!kind) { bad(g, 'That is not a set of the same rank or a run in one suit'); return; }
            addMeld(g, 0, cards, kind);
            if (d.mustUse && cards.indexOf(d.mustUse) >= 0) d.mustUse = null;
            d.sel.slice().sort(function (a, b) { return b - a; })
              .forEach(function (k) { d.hand.splice(k, 1); });
            d.sel = [];
            if (endHandCheck(g, 0)) return;
            d.msg = 'Melded — lay off, or discard to end your turn';
            return;
          }
          if (id === 'discard') {
            if (d.sel.length !== 1) { bad(g, 'Pick exactly one card to discard'); return; }
            var card = d.hand[d.sel[0]];
            if (d.mustUse) {
              bad(g, 'You took the ' + C.label(d.mustUse) + ' from the pile — play it first');
              return;
            }
            d.sel = [];
            discard(g, 0, card);
            return;
          }
        }
        if (d.phase !== 'play') return;

        // stock
        if (x >= 40 && x <= 40 + CW && y >= 190 && y <= 190 + CH) {
          if (d.turn !== 0) { bad(g, 'Wait for the rival'); return; }
          if (d.stage !== 'draw') { bad(g, 'You have already drawn — now discard'); return; }
          d.hand.push(d.stock.pop());
          sortHand(d.hand);
          d.stage = 'play';
          d.sel = [];
          d.msg = 'Drew from the stock — meld, lay off, then discard';
          Milo.sound.click();
          return;
        }

        // discard pile (spread, click any depth)
        var pn = d.pile.length, show = Math.min(pn, 10), step = 34;
        for (i = pn - 1; i >= pn - show; i--) {
          var px = 150 + (i - (pn - show)) * step;
          if (x < px || x > px + CW || y < 190 || y > 190 + CH) continue;
          if (d.turn !== 0) { bad(g, 'Wait for the rival'); return; }
          if (d.stage !== 'draw') { bad(g, 'You have already drawn — now discard'); return; }
          var takeCard = d.pile[i];
          var pool = d.hand.concat(d.pile.slice(i));
          if (!canUse(g, takeCard, pool)) {
            bad(g, 'You may only take the ' + C.label(takeCard) +
              ' if you can meld or lay it off straight away');
            return;
          }
          var got = d.pile.splice(i);
          got.forEach(function (c) { d.hand.push(c); });
          sortHand(d.hand);
          d.mustUse = takeCard;
          d.stage = 'play';
          d.sel = [];
          d.msg = 'You take ' + got.length + ' card' + (got.length > 1 ? 's' : '') +
            ' — the ' + C.label(takeCard) + ' must be played now';
          d.log.unshift('You dig out the ' + C.label(takeCard));
          Milo.sound.blip();
          return;
        }

        // lay off onto a meld
        var rects = meldRects(g);
        for (i = 0; i < rects.length; i++) {
          if (!hitB(rects[i], x, y)) continue;
          if (d.turn !== 0 || d.stage !== 'play') { bad(g, 'You can only lay off on your own turn, after drawing'); return; }
          if (!d.sel.length) { bad(g, 'Pick a card from your hand to lay off'); return; }
          var laid = 0;
          d.sel.slice().sort(function (a, b) { return b - a; }).forEach(function (k) {
            var c2 = d.hand[k];
            var p = layOffPts(rects[i].m, c2);
            if (p < 0) return;
            rects[i].m.cards.push(c2);
            d.hand.splice(k, 1);
            d.banked[0] += p;
            laid++;
            if (d.mustUse === c2) d.mustUse = null;
            d.log.unshift('You lay off ' + C.label(c2) + ' (+' + p + ')');
          });
          d.sel = [];
          if (!laid) { bad(g, 'That card does not extend this meld'); return; }
          Milo.sound.coin();
          stats(g);
          if (endHandCheck(g, 0)) return;
          d.msg = 'Laid off — discard to end your turn';
          return;
        }

        // hand
        var n = d.hand.length, hy = H - CH - 62;
        for (i = n - 1; i >= 0; i--) {
          var cx = fanX(i, n, CW);
          if (x < cx || x > cx + CW || y < hy || y > hy + CH) continue;
          if (d.turn !== 0) { bad(g, 'Wait for the rival'); return; }
          if (d.stage === 'draw') { bad(g, 'Draw a card first — stock or discard pile'); return; }
          var at = d.sel.indexOf(i);
          if (at >= 0) d.sel.splice(at, 1); else d.sel.push(i);
          Milo.sound.tone({ f: 520, d: .04, v: .04, type: 'triangle' });
          return;
        }
      },

      update: function (g, dt) {
        var d = g.data;
        if (d.phase !== 'play') return;
        if (d.think > 0) {
          d.think -= dt;
          if (d.think <= 0 && d.turn === 1) aiTurn(g);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, i;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#1e2a44'); bg.addColorStop(1, '#0a0f1a');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);
        c.textAlign = 'center'; c.textBaseline = 'alphabetic';

        c.fillStyle = d.turn === 1 ? '#ffd257' : 'rgba(255,255,255,.7)';
        c.font = '800 13px Outfit, sans-serif';
        c.textAlign = 'left';
        c.fillText('RIVAL  ·  ' + d.ai.length + ' cards  ·  melded ' + d.banked[1], 40, 34);
        c.fillStyle = 'rgba(255,255,255,.4)';
        c.font = '600 11px Outfit, sans-serif';
        c.fillText('THEIR MELDS', 40, 48);
        c.fillStyle = 'rgba(255,255,255,.4)';
        c.fillText('YOUR MELDS', 40, 294);
        c.textAlign = 'center';

        meldRects(g).forEach(function (r) {
          c.fillStyle = r.owner === 0 ? 'rgba(34,211,238,.10)' : 'rgba(251,113,133,.10)';
          U.roundRect(c, r.x - 6, r.y - 6, r.w + 12, r.h + 12, 8); c.fill();
          r.m.cards.forEach(function (card, k) {
            C.draw(c, card, r.x + k * 18, r.y, 30, 44, { faceUp: true });
          });
        });

        // stock + pile
        if (d.stock.length) C.draw(c, d.stock[d.stock.length - 1], 40, 190, CW, CH, { faceUp: false });
        else C.slot(c, 40, 190, CW, CH, '∅');
        c.fillStyle = 'rgba(255,255,255,.5)';
        c.font = '600 11px Outfit, sans-serif';
        c.fillText('stock ' + d.stock.length, 40 + CW / 2, 190 + CH + 15);

        var pn = d.pile.length, show = Math.min(pn, 10);
        for (i = pn - show; i < pn; i++) {
          var px = 150 + (i - (pn - show)) * 34;
          C.draw(c, d.pile[i], px, 190, CW, CH, {
            faceUp: true, hint: d.turn === 0 && d.stage === 'draw'
          });
        }
        c.fillStyle = 'rgba(255,255,255,.5)';
        c.fillText('discards (' + pn + ') — click any card to take it and everything above',
          150 + (show * 34) / 2 + 60, 190 + CH + 15);

        c.fillStyle = '#e6ecff';
        c.font = '700 16px Outfit, sans-serif';
        c.fillText(d.msg, W / 2, H - CH - 92);
        c.fillStyle = 'rgba(255,255,255,.5)';
        c.font = '600 12px Outfit, sans-serif';
        c.fillText('Game to 500  ·  you ' + d.score[0] + '  ·  rival ' + d.score[1] +
          '  ·  banked this hand ' + d.banked[0] +
          (d.mustUse ? '  ·  must play ' + C.label(d.mustUse) : ''), W / 2, H - CH - 72);

        // log
        c.textAlign = 'right';
        c.font = '600 11px Outfit, sans-serif';
        for (i = 0; i < Math.min(4, d.log.length); i++) {
          c.fillStyle = 'rgba(255,255,255,' + (0.55 - i * 0.11) + ')';
          c.fillText(d.log[i], W - 34, 196 + i * 17);
        }
        c.textAlign = 'center';

        var n = d.hand.length, hy = H - CH - 62;
        for (i = 0; i < n; i++) {
          C.draw(c, d.hand[i], fanX(i, n, CW), hy, CW, CH, {
            faceUp: true,
            selected: d.sel.indexOf(i) >= 0,
            hint: d.mustUse === d.hand[i]
          });
        }
        buttons(g).forEach(function (b) { drawBtn(c, b); });

        if (d.phase === 'summary' && d.summary) {
          c.fillStyle = 'rgba(6,10,20,.94)';
          U.roundRect(c, W / 2 - 280, H / 2 - 150, 560, 320, 16); c.fill();
          c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1.5; c.stroke();
          c.fillStyle = '#ffd257';
          c.font = '800 23px Outfit, sans-serif';
          c.fillText(d.summary.out === 0 ? 'You went out!'
            : d.summary.out === 1 ? 'Rival went out' : 'Stock exhausted', W / 2, H / 2 - 110);
          c.fillStyle = 'rgba(255,255,255,.45)';
          c.font = '700 11px Outfit, sans-serif';
          c.textAlign = 'left';
          c.fillText('PLAYER', W / 2 - 240, H / 2 - 74);
          c.fillText('MELDED', W / 2 - 110, H / 2 - 74);
          c.fillText('IN HAND', W / 2 + 10, H / 2 - 74);
          c.fillText('HAND', W / 2 + 110, H / 2 - 74);
          c.fillText('TOTAL', W / 2 + 190, H / 2 - 74);
          d.summary.rows.forEach(function (r, k) {
            var yy = H / 2 - 40 + k * 34;
            c.fillStyle = k === 0 ? '#22d3ee' : '#fb7185';
            c.font = '700 15px Outfit, sans-serif';
            c.fillText(r.n, W / 2 - 240, yy);
            c.fillStyle = 'rgba(255,255,255,.85)';
            c.fillText('+' + r.meld, W / 2 - 110, yy);
            c.fillText('-' + r.left, W / 2 + 10, yy);
            c.fillStyle = r.add >= 0 ? '#34d399' : '#fb7185';
            c.fillText((r.add >= 0 ? '+' : '') + r.add, W / 2 + 110, yy);
            c.fillStyle = '#fff';
            c.fillText(String(r.tot), W / 2 + 190, yy);
          });
          c.textAlign = 'center';
          c.fillStyle = 'rgba(255,255,255,.5)';
          c.font = '600 12px Outfit, sans-serif';
          c.fillText('cards melded score, cards left in hand count against you', W / 2, H / 2 + 56);
          c.fillText('first past 500 takes the match', W / 2, H / 2 + 78);
        }
      }
    });
  }

  window.Milo.register({
    id: 'rummy-500', title: 'Rummy 500', emo: '🂡', category: 'Cards',
    tagline: 'Dig the discard pile, bank the points',
    description: 'The scoring rummy where the discard pile is fair game: take any card you ' +
      'can use immediately and the whole stack above it comes with you. Melds are sets of ' +
      'three or four and runs in a suit, you can lay off on either player’s melds, and ' +
      'every card you put down scores while every card caught in your hand is taken off ' +
      'again. Aces are worth 15, or 1 in an A-2-3 run. The rival works out its best possible ' +
      'lay-down each turn and hides the cards you are collecting. The hand ends when someone ' +
      'goes out or the stock runs dry; first past 500 wins.',
    controls: ['Click cards', 'Meld', 'Discard'],
    colors: ['#1e2a44', '#fb923c'],
    tags: ['cards', 'rummy', 'melds', 'vs cpu'],
    mount: mount
  });
})();
