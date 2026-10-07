/* Casino — capture by pairing and summing, make builds, sweep the table.
   Scoring: 3 for most cards, 1 for most spades, 2 for big casino, 1 for
   little casino, 1 per ace, 1 per sweep. First to 21. */
(function () {
  'use strict';
  var W = 960, H = 640, CW = 62, CH = 88;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util, C = Milo.cards;

    function cval(c) { return c.r === 0 ? 1 : (c.r <= 9 ? c.r + 1 : 0); }
    function isFace(c) { return c.r >= 10; }
    function bad(g, why) {
      g.data.msg = why;
      Milo.sound.tone({ f: 150, d: .08, v: .05, type: 'square' });
    }
    function sortHand(h) { h.sort(function (a, b) { return a.r - b.r || a.s - b.s; }); }

    /** Can these numeric values be split into groups that each total v? */
    function partitions(vals, v) {
      var n = vals.length;
      if (!n) return 0;
      var memo = {};
      function go(mask) {
        if (mask === (1 << n) - 1) return 0;
        if (memo[mask] !== undefined) return memo[mask];
        var first = 0;
        while (mask & (1 << first)) first++;
        var best = -1;
        for (var sub = 0; sub < (1 << n); sub++) {
          if (!(sub & (1 << first))) continue;
          if (sub & mask) continue;
          var sum = 0, cnt = 0;
          for (var i = 0; i < n; i++) if (sub & (1 << i)) { sum += vals[i]; cnt++; }
          if (sum !== v) continue;
          var rest = go(mask | sub);
          if (rest >= 0 && rest + 1 > best) best = rest + 1;
        }
        memo[mask] = best;
        return best;
      }
      return go(0);
    }

    /** Is taking `items` with `card` a legal capture? */
    function captureOK(card, items) {
      if (!items.length) return false;
      var i;
      if (isFace(card)) {
        for (i = 0; i < items.length; i++) {
          if (items[i].kind !== 'card' || items[i].card.r !== card.r) return false;
        }
        return true;
      }
      var v = cval(card), loose = [];
      for (i = 0; i < items.length; i++) {
        var it = items[i];
        if (it.kind === 'build') {
          if (it.value !== v) return false;
        } else {
          if (isFace(it.card)) return false;
          loose.push(cval(it.card));
        }
      }
      if (!loose.length) return true;
      var sum = 0;
      for (i = 0; i < loose.length; i++) sum += loose[i];
      if (v <= 0 || sum % v !== 0) return false;
      return partitions(loose, v) > 0;
    }

    function itemCards(it) { return it.kind === 'build' ? it.cards : [it.card]; }

    /* -------------------------------------------------------------- setup */

    function reset(g) {
      var d = g.data;
      d.score = [0, 0];
      d.roundNo = 0;
      g.score = 0;
      g.set('You', 0); g.set('Rival', 0); g.set('Cards', 0);
      newRound(g);
    }

    function newRound(g) {
      var d = g.data;
      d.roundNo++;
      d.deck = C.shuffled();
      d.hands = [d.deck.splice(0, 4), d.deck.splice(0, 4)];
      sortHand(d.hands[0]);
      d.table = d.deck.splice(0, 4).map(function (c) { return { kind: 'card', card: c }; });
      d.piles = [[], []];
      d.sweeps = [0, 0];
      d.lastCapture = -1;
      d.turn = 0;
      d.sel = -1;
      d.pick = [];
      d.think = 0;
      d.phase = 'play';
      d.summary = null;
      d.log = [];
      d.msg = 'Your turn — pick a card, then the table cards to take';
      stats(g);
    }

    function stats(g) {
      var d = g.data;
      g.set('You', d.score[0]); g.set('Rival', d.score[1]);
      g.set('Cards', d.piles[0].length);
    }

    function ownsBuild(g, who) {
      return g.data.table.some(function (it) { return it.kind === 'build' && it.owner === who; });
    }

    /** Is any capture or build open to this player? (Used to police trailing.) */
    function hasPlay(g, who) {
      var d = g.data, i, j, k;
      var hand = d.hands[who];
      for (i = 0; i < hand.length; i++) {
        for (j = 0; j < d.table.length; j++) {
          if (captureOK(hand[i], [d.table[j]])) return true;
          for (k = j + 1; k < d.table.length; k++) {
            if (captureOK(hand[i], [d.table[j], d.table[k]])) return true;
          }
          if (!planBuild(g, who, hand[i], [d.table[j]]).err) return true;
        }
      }
      return false;
    }

    /* ------------------------------------------------------------- actions */

    function doCapture(g, who, card, items) {
      var d = g.data;
      var hand = d.hands[who];
      hand.splice(hand.indexOf(card), 1);
      d.piles[who].push(card);
      var taken = 0;
      items.forEach(function (it) {
        itemCards(it).forEach(function (c) { d.piles[who].push(c); taken++; });
        d.table.splice(d.table.indexOf(it), 1);
      });
      d.lastCapture = who;
      var swept = d.table.length === 0;
      if (swept) { d.sweeps[who]++; }
      d.log.unshift((who === 0 ? 'You take ' : 'Rival takes ') + taken + ' card' +
        (taken === 1 ? '' : 's') + ' with the ' + C.label(card) + (swept ? ' — SWEEP!' : ''));
      Milo.sound[swept ? 'powerup' : 'coin']();
      stats(g);
      endTurn(g, who);
    }

    function doTrail(g, who, card) {
      var d = g.data;
      var hand = d.hands[who];
      hand.splice(hand.indexOf(card), 1);
      d.table.push({ kind: 'card', card: card });
      d.log.unshift((who === 0 ? 'You trail ' : 'Rival trails ') + C.label(card));
      Milo.sound.click();
      endTurn(g, who);
    }

    /** Work out what build the selection makes, or a reason it cannot. */
    function planBuild(g, who, card, items) {
      var d = g.data;
      var hand = d.hands[who].filter(function (c) { return c !== card; });
      function holds(v) { return hand.some(function (c) { return cval(c) === v; }); }
      if (isFace(card)) return { err: 'court cards cannot be built with' };
      if (!items.length) return { err: 'pick the table cards to build with' };
      var builds = [], loose = [], i;
      for (i = 0; i < items.length; i++) {
        if (items[i].kind === 'build') builds.push(items[i]);
        else if (isFace(items[i].card)) return { err: 'court cards cannot be part of a build' };
        else loose.push(items[i]);
      }
      var looseVals = loose.map(function (it) { return cval(it.card); });
      var sum = looseVals.reduce(function (a, b) { return a + b; }, 0) + cval(card);

      if (builds.length) {
        var v = builds[0].value;
        for (i = 1; i < builds.length; i++) if (builds[i].value !== v) {
          return { err: 'those builds are different values' };
        }
        var vals = looseVals.concat([cval(card)]);
        if (partitions(vals, v) > 0) {
          if (!holds(v)) return { err: 'you must keep a ' + v + ' in hand to take a build of ' + v };
          return { value: v, multi: true };
        }
        if (builds.length === 1 && !builds[0].multi && !loose.length) {
          var nv = v + cval(card);
          if (nv > 10) return { err: 'a build cannot be worth more than 10' };
          if (!holds(nv)) return { err: 'you must hold a ' + nv + ' to raise that build' };
          return { value: nv, multi: false };
        }
        return { err: 'that does not fit the build of ' + v };
      }

      if (sum <= 10 && holds(sum)) return { value: sum, multi: false };
      for (var v2 = 10; v2 >= 2; v2--) {
        if (!holds(v2)) continue;
        var p = partitions(looseVals.concat([cval(card)]), v2);
        if (p >= 2) return { value: v2, multi: true };
      }
      if (sum > 10) return { err: 'a build cannot be worth more than 10' };
      return { err: 'you have no ' + sum + ' in hand to take a build of ' + sum };
    }

    function doBuild(g, who, card, items, plan) {
      var d = g.data;
      var hand = d.hands[who];
      hand.splice(hand.indexOf(card), 1);
      var cards = [card];
      items.forEach(function (it) {
        itemCards(it).forEach(function (c) { cards.push(c); });
        d.table.splice(d.table.indexOf(it), 1);
      });
      d.table.push({ kind: 'build', cards: cards, value: plan.value, owner: who, multi: !!plan.multi });
      d.log.unshift((who === 0 ? 'You build ' : 'Rival builds ') + plan.value +
        (plan.multi ? ' (multiple)' : ''));
      Milo.sound.blip();
      endTurn(g, who);
    }

    /* ---------------------------------------------------------- turn flow */

    function endTurn(g, who) {
      var d = g.data;
      d.sel = -1;
      d.pick = [];
      if (!d.hands[0].length && !d.hands[1].length) {
        if (d.deck.length >= 8) {
          d.hands[0] = d.deck.splice(0, 4);
          d.hands[1] = d.deck.splice(0, 4);
          sortHand(d.hands[0]);
          d.log.unshift('Four more each');
        } else {
          endRound(g);
          return;
        }
      }
      d.turn = 1 - who;
      if (!d.hands[d.turn].length) d.turn = who;
      if (d.turn === 0) d.msg = 'Your turn — pick a card, then the table cards to take';
      else { d.msg = 'Rival is thinking…'; d.think = 0.85; }
    }

    function endRound(g) {
      var d = g.data, i;
      if (d.lastCapture >= 0 && d.table.length) {
        var n = 0;
        d.table.forEach(function (it) {
          itemCards(it).forEach(function (c) { d.piles[d.lastCapture].push(c); n++; });
        });
        d.log.unshift((d.lastCapture === 0 ? 'You' : 'Rival') + ' take the last ' + n + ' cards');
        d.table = [];
      }
      var rows = [], add = [0, 0];
      function spades(p) { return d.piles[p].filter(function (c) { return c.s === 0; }).length; }
      function has(p, r, s) {
        return d.piles[p].some(function (c) { return c.r === r && c.s === s; });
      }
      var cards0 = d.piles[0].length, cards1 = d.piles[1].length;
      if (cards0 > cards1) { add[0] += 3; rows.push({ t: 'Most cards (' + cards0 + ')', v: '+3 you' }); }
      else if (cards1 > cards0) { add[1] += 3; rows.push({ t: 'Most cards (' + cards1 + ')', v: '+3 rival' }); }
      else rows.push({ t: 'Cards tied', v: 'no points' });

      var s0 = spades(0), s1 = spades(1);
      if (s0 > s1) { add[0] += 1; rows.push({ t: 'Most spades (' + s0 + ')', v: '+1 you' }); }
      else if (s1 > s0) { add[1] += 1; rows.push({ t: 'Most spades (' + s1 + ')', v: '+1 rival' }); }

      if (has(0, 9, 2)) { add[0] += 2; rows.push({ t: 'Big casino (10♦)', v: '+2 you' }); }
      else if (has(1, 9, 2)) { add[1] += 2; rows.push({ t: 'Big casino (10♦)', v: '+2 rival' }); }
      if (has(0, 1, 0)) { add[0] += 1; rows.push({ t: 'Little casino (2♠)', v: '+1 you' }); }
      else if (has(1, 1, 0)) { add[1] += 1; rows.push({ t: 'Little casino (2♠)', v: '+1 rival' }); }

      for (i = 0; i < 2; i++) {
        var aces = d.piles[i].filter(function (c) { return c.r === 0; }).length;
        if (aces) { add[i] += aces; rows.push({ t: aces + ' ace' + (aces > 1 ? 's' : ''), v: '+' + aces + (i === 0 ? ' you' : ' rival') }); }
        if (d.sweeps[i]) { add[i] += d.sweeps[i]; rows.push({ t: d.sweeps[i] + ' sweep' + (d.sweeps[i] > 1 ? 's' : ''), v: '+' + d.sweeps[i] + (i === 0 ? ' you' : ' rival') }); }
      }

      d.score[0] += add[0];
      d.score[1] += add[1];
      d.summary = { rows: rows, add: add };
      d.phase = 'summary';
      stats(g);
      g.score = d.score[0];
      Milo.sound.win();
    }

    function nextRound(g) {
      var d = g.data;
      if (d.score[0] >= 21 || d.score[1] >= 21) {
        var wonIt = d.score[0] > d.score[1];
        (wonIt ? g.win : g.gameOver).call(g, {
          emo: wonIt ? '🏛️' : '🥈',
          title: wonIt ? 'Game — you reach 21' : 'The rival gets to 21 first',
          text: 'Final score  you ' + d.score[0] + '  ·  rival ' + d.score[1] +
            ' after ' + d.roundNo + ' round' + (d.roundNo > 1 ? 's' : '') + '.',
          score: d.score[0]
        });
        return;
      }
      newRound(g);
    }

    /* ----------------------------------------------------------------- AI */

    function cardWorth(c) {
      var v = 1;
      if (c.r === 9 && c.s === 2) v += 6;        // big casino
      if (c.r === 1 && c.s === 0) v += 3;        // little casino
      if (c.r === 0) v += 3;                     // aces
      if (c.s === 0) v += 0.8;                   // spades
      return v;
    }

    function aiTurn(g) {
      var d = g.data, i, k;
      var hand = d.hands[1];
      if (!hand.length) { endTurn(g, 1); return; }
      var n = d.table.length;
      var best = null;

      function worthOf(card, items) {
        var w = cardWorth(card);
        items.forEach(function (it) {
          itemCards(it).forEach(function (cc) { w += cardWorth(cc); });
        });
        if (items.length === n) w += 5;              // sweep
        return w;
      }
      for (i = 0; i < hand.length; i++) {
        var h = hand[i];
        if (isFace(h)) {
          var same = d.table.filter(function (it) {
            return it.kind === 'card' && it.card.r === h.r;
          });
          if (same.length) {
            var w0 = worthOf(h, same);
            if (!best || w0 > best.worth) best = { worth: w0, card: h, items: same };
          }
          continue;
        }
        var v = cval(h);
        var cands = d.table.filter(function (it) {
          return it.kind === 'build' ? it.value === v : (!isFace(it.card) && cval(it.card) <= v);
        });
        if (cands.length > 12) cands = cands.slice(0, 12);
        var cn = cands.length;
        for (var mask = 1; mask < (1 << cn); mask++) {
          var items = [];
          for (k = 0; k < cn; k++) if (mask & (1 << k)) items.push(cands[k]);
          if (!captureOK(h, items)) continue;
          var worth = worthOf(h, items);
          if (!best || worth > best.worth) best = { worth: worth, card: h, items: items };
        }
      }

      // A build is worth making when it is safe-ish and we hold the value.
      var bestBuild = null;
      var bn = Math.min(n, 8);
      for (i = 0; i < hand.length; i++) {
        for (var m2 = 1; m2 < (1 << bn); m2++) {
          var its = [];
          for (k = 0; k < bn; k++) if (m2 & (1 << k)) its.push(d.table[k]);
          if (its.length > 3) continue;
          var plan = planBuild(g, 1, hand[i], its);
          if (plan.err) continue;
          var score = 4 + plan.value * 0.2 + (plan.multi ? 2 : 0);
          if (!bestBuild || score > bestBuild.score) {
            bestBuild = { score: score, card: hand[i], items: its, plan: plan };
          }
        }
      }

      if (best && best.worth >= 4) { doCapture(g, 1, best.card, best.items); return; }
      if (bestBuild) { doBuild(g, 1, bestBuild.card, bestBuild.items, bestBuild.plan); return; }
      if (best) { doCapture(g, 1, best.card, best.items); return; }
      if (ownsBuild(g, 1)) {
        // must not trail: take our own build if we can, else dump anything legal
        for (i = 0; i < hand.length; i++) {
          for (k = 0; k < d.table.length; k++) {
            if (captureOK(hand[i], [d.table[k]])) { doCapture(g, 1, hand[i], [d.table[k]]); return; }
          }
        }
      }
      var junk = hand.slice().sort(function (a, b) { return cardWorth(a) - cardWorth(b); });
      doTrail(g, 1, junk[0]);
    }

    /* ------------------------------------------------------------ drawing */

    function tableRect(i) {
      var col = i % 6, row = (i / 6) | 0;
      return { x: W / 2 - 3 * 92 + col * 92 + 8, y: 146 + row * 112, w: 72, h: 100 };
    }
    function fanX(i, n, w) {
      var step = Math.min(w + 16, (W - 260) / Math.max(1, n));
      return (W - (n - 1) * step - w) / 2 + i * step;
    }
    function hitB(b, x, y) { return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h; }
    function drawBtn(c, b) {
      c.fillStyle = b.primary ? '#22d3ee' : 'rgba(255,255,255,.15)';
      U.roundRect(c, b.x, b.y, b.w, b.h, 9); c.fill();
      c.fillStyle = b.primary ? '#062a33' : '#eef2ff';
      c.font = '700 14px Outfit, sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 1);
    }
    function buttons(g) {
      var d = g.data;
      if (d.phase === 'summary') {
        return [{ id: 'next', label: 'Next round', x: W / 2 - 75, y: H / 2 + 150, w: 150, h: 40, primary: true }];
      }
      if (d.turn !== 0 || d.phase !== 'play') return [];
      return [
        { id: 'cap', label: 'Capture', x: W / 2 - 250, y: H - 46, w: 150, h: 38, primary: true },
        { id: 'build', label: 'Build', x: W / 2 - 88, y: H - 46, w: 150, h: 38 },
        { id: 'trail', label: 'Trail', x: W / 2 + 74, y: H - 46, w: 150, h: 38 }
      ];
    }

    return Milo.arcade(host, {
      id: 'casino-cards',
      w: W, h: H, bg: '#0c2a1c', stats: ['You', 'Rival', 'Cards'],
      emo: '🏛️',
      start: {
        title: 'Casino',
        text: 'Take table cards with a matching card, or with any set that adds up to the ' +
          'card you play — aces are one, court cards pair only. Push two cards together into ' +
          'a build if you are holding the total, and clear the whole table for a sweep. When ' +
          'the deck runs out you score 3 for most cards, 1 for most spades, 2 for the ten of ' +
          'diamonds, 1 for the two of spades and 1 for every ace. First to 21.',
        keys: ['Click your card', 'Click table cards', 'Capture / Build / Trail']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data, i;
        var bs = buttons(g);
        for (i = 0; i < bs.length; i++) {
          if (!hitB(bs[i], x, y)) continue;
          var id = bs[i].id;
          if (id === 'next') { nextRound(g); return; }
          if (d.sel < 0) { bad(g, 'Pick one of your own cards first'); return; }
          var card = d.hands[0][d.sel];
          var items = d.pick.map(function (k) { return d.table[k]; });
          if (id === 'cap') {
            if (!items.length) { bad(g, 'Click the table cards you want to take'); return; }
            if (!captureOK(card, items)) {
              bad(g, isFace(card)
                ? 'A ' + C.RANKS[card.r] + ' can only take other ' + C.RANKS[card.r] + 's'
                : 'Those do not pair with or add up to ' + cval(card));
              return;
            }
            doCapture(g, 0, card, items);
            return;
          }
          if (id === 'build') {
            var plan = planBuild(g, 0, card, items);
            if (plan.err) { bad(g, 'Cannot build: ' + plan.err); return; }
            doBuild(g, 0, card, items, plan);
            return;
          }
          if (id === 'trail') {
            if (ownsBuild(g, 0) && hasPlay(g, 0)) {
              bad(g, 'You have a build on the table — capture it or add to it, do not trail');
              return;
            }
            if (items.length) { bad(g, 'Trailing just lays the card down — unpick the table cards'); return; }
            doTrail(g, 0, card);
            return;
          }
        }
        if (d.phase !== 'play') return;

        for (i = 0; i < d.table.length; i++) {
          var r = tableRect(i);
          if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
            if (d.turn !== 0) { bad(g, 'Wait for the rival to play'); return; }
            var at = d.pick.indexOf(i);
            if (at >= 0) d.pick.splice(at, 1); else d.pick.push(i);
            Milo.sound.tone({ f: 480, d: .04, v: .04, type: 'triangle' });
            return;
          }
        }

        var n = d.hands[0].length, hy = H - CH - 64;
        for (i = n - 1; i >= 0; i--) {
          var cx = fanX(i, n, CW);
          if (x < cx || x > cx + CW || y < hy || y > hy + CH) continue;
          if (d.turn !== 0) { bad(g, 'Wait for the rival to play'); return; }
          d.sel = d.sel === i ? -1 : i;
          Milo.sound.tone({ f: 540, d: .04, v: .04, type: 'triangle' });
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
        var bg2 = c.createRadialGradient(W / 2, H * .4, 40, W / 2, H / 2, W * .7);
        bg2.addColorStop(0, '#16503a'); bg2.addColorStop(1, '#061710');
        c.fillStyle = bg2; c.fillRect(0, 0, W, H);
        c.textAlign = 'center'; c.textBaseline = 'alphabetic';

        // rival
        c.fillStyle = d.turn === 1 ? '#ffd257' : 'rgba(255,255,255,.7)';
        c.font = '800 14px Outfit, sans-serif';
        c.fillText('RIVAL  ·  ' + d.hands[1].length + ' cards  ·  pile ' + d.piles[1].length +
          '  ·  sweeps ' + d.sweeps[1], W / 2, 34);
        for (i = 0; i < d.hands[1].length; i++) {
          C.draw(c, d.hands[1][i], W / 2 - 2 * 46 + i * 46 - 10, 46, 52, 74, { faceUp: false });
        }

        // deck
        if (d.deck.length) C.draw(c, d.deck[0], 44, 60, 52, 74, { faceUp: false });
        c.fillStyle = 'rgba(255,255,255,.5)';
        c.font = '600 11px Outfit, sans-serif';
        c.fillText('deck ' + d.deck.length, 70, 150);

        // table
        for (i = 0; i < d.table.length; i++) {
          var r = tableRect(i), it = d.table[i];
          var on = d.pick.indexOf(i) >= 0;
          if (it.kind === 'build') {
            for (var k = 0; k < it.cards.length; k++) {
              C.draw(c, it.cards[k], r.x + k * 7, r.y + k * 5, r.w, r.h, {
                faceUp: true, selected: on && k === it.cards.length - 1
              });
            }
            c.fillStyle = it.owner === 0 ? '#22d3ee' : '#fb7185';
            U.roundRect(c, r.x + r.w - 20, r.y - 12, 40, 22, 6); c.fill();
            c.fillStyle = '#04141a';
            c.font = '800 13px Outfit, sans-serif';
            c.fillText(String(it.value) + (it.multi ? '·' : ''), r.x + r.w, r.y + 4);
          } else {
            C.draw(c, it.card, r.x, r.y, r.w, r.h, { faceUp: true, selected: on });
          }
        }
        if (!d.table.length) {
          c.fillStyle = 'rgba(255,255,255,.25)';
          c.font = '600 13px Outfit, sans-serif';
          c.fillText('the table is empty', W / 2, 210);
        }

        // log
        c.textAlign = 'right';
        c.font = '600 12px Outfit, sans-serif';
        for (i = 0; i < Math.min(4, d.log.length); i++) {
          c.fillStyle = 'rgba(255,255,255,' + (0.6 - i * 0.12) + ')';
          c.fillText(d.log[i], W - 34, 70 + i * 18);
        }
        c.textAlign = 'center';

        c.fillStyle = '#e6ecff';
        c.font = '700 16px Outfit, sans-serif';
        c.fillText(d.msg, W / 2, H - CH - 92);
        c.fillStyle = 'rgba(255,255,255,.5)';
        c.font = '600 12px Outfit, sans-serif';
        c.fillText('Game to 21  ·  you ' + d.score[0] + '  ·  rival ' + d.score[1] +
          '  ·  your pile ' + d.piles[0].length + ', sweeps ' + d.sweeps[0], W / 2, H - CH - 72);

        var hn = d.hands[0].length, hy = H - CH - 64;
        for (i = 0; i < hn; i++) {
          C.draw(c, d.hands[0][i], fanX(i, hn, CW), hy, CW, CH, {
            faceUp: true, selected: d.sel === i
          });
        }
        buttons(g).forEach(function (b) { drawBtn(c, b); });

        if (d.phase === 'summary' && d.summary) {
          c.fillStyle = 'rgba(4,16,10,.94)';
          U.roundRect(c, W / 2 - 250, H / 2 - 190, 500, 380, 16); c.fill();
          c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1.5; c.stroke();
          c.fillStyle = '#ffd257';
          c.font = '800 24px Outfit, sans-serif';
          c.fillText('Round ' + d.roundNo + ' scored', W / 2, H / 2 - 150);
          c.font = '600 13px Outfit, sans-serif';
          d.summary.rows.forEach(function (r, k) {
            c.textAlign = 'left';
            c.fillStyle = 'rgba(255,255,255,.72)';
            c.fillText(r.t, W / 2 - 210, H / 2 - 116 + k * 24);
            c.textAlign = 'right';
            c.fillStyle = r.v.indexOf('you') >= 0 ? '#34d399' : '#fb7185';
            c.fillText(r.v, W / 2 + 210, H / 2 - 116 + k * 24);
          });
          c.textAlign = 'center';
          c.fillStyle = '#fff';
          c.font = '800 20px Outfit, sans-serif';
          c.fillText('YOU ' + d.score[0] + '   —   RIVAL ' + d.score[1], W / 2, H / 2 + 116);
          c.fillStyle = 'rgba(255,255,255,.45)';
          c.font = '600 12px Outfit, sans-serif';
          c.fillText('this round: you +' + d.summary.add[0] + ', rival +' + d.summary.add[1], W / 2, H / 2 + 138);
        }
      }
    });
  }

  window.Milo.register({
    id: 'casino-cards', title: 'Casino', emo: '🏛️', category: 'Cards',
    tagline: 'Match it, add up to it, or build it',
    description: 'The old fishing game, played properly. A card takes any table card of the ' +
      'same rank and any group that adds up to its value — aces count one, and court cards ' +
      'pair only. Push a card onto the table to declare a build (a 4 and a 3 become a build ' +
      'of seven) as long as you are holding the card that takes it, and you may not trail ' +
      'while a build of yours is sitting there. Clearing the table is a sweep for a point. ' +
      'At the end of the deck: 3 for most cards, 1 for most spades, 2 for the ten of ' +
      'diamonds, 1 for the two of spades, 1 per ace. First to 21 wins.',
    controls: ['Click your card', 'Click the table', 'Capture / Build / Trail'],
    colors: ['#16503a', '#fde047'],
    tags: ['cards', 'capture', 'builds', 'vs cpu'],
    mount: mount
  });
})();
