/* Hearts — four handed, pass three, dodge the hearts and the Queen of Spades. */
(function () {
  'use strict';
  var W = 940, H = 620, CW = 60, CH = 84;
  var NAMES = ['You', 'West', 'North', 'East'];
  var PASSDIR = ['left', 'right', 'across', 'nobody'];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util, C = Milo.cards;

    function val(c) { return c.r === 0 ? 14 : c.r + 1; }
    function isQS(c) { return c.s === 0 && c.r === 11; }
    function pts(c) { return isQS(c) ? 13 : (c.s === 1 ? 1 : 0); }
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
      d.total = [0, 0, 0, 0];
      d.handNo = 0;
      d.moon = 0;
      g.score = 0;
      NAMES.forEach(function (n, i) { g.set(n, 0); });
      newHand(g);
    }

    function newHand(g) {
      var d = g.data, i;
      d.handNo++;
      var deck = C.shuffled();
      d.hands = [[], [], [], []];
      for (i = 0; i < 52; i++) d.hands[i % 4].push(deck[i]);
      for (i = 0; i < 4; i++) sortHand(d.hands[i]);
      d.taken = [0, 0, 0, 0];
      d.pile = [[], [], [], []];
      d.broken = false;
      d.trick = [];
      d.first = true;
      d.sel = [];
      d.think = 0;
      d.lastTrick = '';
      d.summary = null;
      d.dir = (d.handNo - 1) % 4;      // 0 left, 1 right, 2 across, 3 hold
      if (d.dir === 3) { d.phase = 'play'; startTrick(g); }
      else {
        d.phase = 'pass';
        d.msg = 'Pass three cards ' + PASSDIR[d.dir] + ' — click three, then Pass';
      }
      updateStats(g);
    }

    function updateStats(g) {
      var d = g.data;
      for (var i = 0; i < 4; i++) g.set(NAMES[i], d.total[i]);
    }

    function passTarget(from, dir) {
      if (dir === 0) return (from + 1) % 4;
      if (dir === 1) return (from + 3) % 4;
      return (from + 2) % 4;
    }

    /* ------------------------------------------------------------ passing */

    function aiPassPick(hand) {
      var spades = hand.filter(function (c) { return c.s === 0; }).length;
      var counts = [0, 0, 0, 0];
      hand.forEach(function (c) { counts[c.s]++; });
      var scored = hand.map(function (c, i) {
        var s = val(c);
        if (isQS(c)) s = spades <= 3 ? 120 : 55;
        else if (c.s === 0 && val(c) > 12) s = spades <= 3 ? 100 - (14 - val(c)) : 45;
        else if (c.s === 1) s = val(c) + 14;
        else s = val(c);
        // shedding a two-or-three card side suit to get void is worth a lot
        if (c.s !== 1 && counts[c.s] <= 2) s += 18;
        return { i: i, s: s };
      });
      scored.sort(function (a, b) { return b.s - a.s; });
      return [scored[0].i, scored[1].i, scored[2].i];
    }

    function doPass(g) {
      var d = g.data, i, k;
      var out = [[], [], [], []];
      d.sel.sort(function (a, b) { return b - a; });
      d.sel.forEach(function (idx) { out[0].push(d.hands[0].splice(idx, 1)[0]); });
      for (i = 1; i < 4; i++) {
        var pick = aiPassPick(d.hands[i]).sort(function (a, b) { return b - a; });
        pick.forEach(function (idx) { out[i].push(d.hands[i].splice(idx, 1)[0]); });
      }
      var got = [[], [], [], []];
      for (i = 0; i < 4; i++) {
        var t = passTarget(i, d.dir);
        for (k = 0; k < out[i].length; k++) got[t].push(out[i][k]);
      }
      for (i = 0; i < 4; i++) {
        d.hands[i] = d.hands[i].concat(got[i]);
        sortHand(d.hands[i]);
      }
      d.received = got[0];
      d.sel = [];
      d.phase = 'play';
      Milo.sound.blip();
      startTrick(g);
    }

    /* --------------------------------------------------------------- play */

    function startTrick(g) {
      var d = g.data, i, k;
      d.trick = [];
      if (d.first) {
        for (i = 0; i < 4; i++) {
          for (k = 0; k < d.hands[i].length; k++) {
            if (d.hands[i][k].s === 3 && d.hands[i][k].r === 1) d.turn = i;
          }
        }
        d.msg = NAMES[d.turn] + (d.turn === 0 ? ' lead' : ' leads') + ' with the 2♣';
      } else {
        d.msg = d.turn === 0 ? 'Your lead' : NAMES[d.turn] + ' leads';
      }
      d.lead = d.turn;
      if (d.turn !== 0) d.think = 0.55;
    }

    function legal(g, seat, card) {
      var d = g.data, hand = d.hands[seat];
      if (d.trick.length === 0) {
        if (d.first) {
          if (!(card.s === 3 && card.r === 1)) return 'the 2♣ must lead the first trick';
          return null;
        }
        if (card.s === 1 && !d.broken) {
          var other = hand.some(function (c) { return c.s !== 1; });
          if (other) return 'hearts have not been broken yet';
        }
        return null;
      }
      var led = d.trick[0].card.s;
      var has = hand.some(function (c) { return c.s === led; });
      if (has && card.s !== led) return 'you must follow suit — play a ' + C.SUITS[led];
      if (d.first && pts(card) > 0) {
        var clean = hand.some(function (c) {
          return pts(c) === 0 && (!has || c.s === led);
        });
        if (clean) return 'no points on the first trick';
      }
      return null;
    }

    function legalCards(g, seat) {
      return g.data.hands[seat].filter(function (c) { return !legal(g, seat, c); });
    }

    function playCard(g, seat, card) {
      var d = g.data;
      var hand = d.hands[seat];
      hand.splice(hand.indexOf(card), 1);
      d.trick.push({ seat: seat, card: card });
      if (card.s === 1) d.broken = true;
      Milo.sound.tone({ f: 430, f2: 520, d: .05, v: .05, type: 'triangle' });
      if (d.trick.length === 4) {
        d.phase = 'trickend';
        d.think = 0.95;
      } else {
        d.turn = (seat + 1) % 4;
        if (d.turn !== 0) d.think = 0.5;
        d.msg = d.turn === 0 ? 'Your turn — follow ' + C.SUITS[d.trick[0].card.s]
          : NAMES[d.turn] + ' to play';
      }
    }

    function finishTrick(g) {
      var d = g.data;
      var ledSuit = d.trick[0].card.s, bestI = 0;
      for (var i = 1; i < 4; i++) {
        if (d.trick[i].card.s === ledSuit && val(d.trick[i].card) > val(d.trick[bestI].card)) bestI = i;
      }
      var winner = d.trick[bestI].seat, p = 0;
      d.trick.forEach(function (t) { p += pts(t.card); d.pile[winner].push(t.card); });
      d.taken[winner] += p;
      d.first = false;
      d.turn = winner;
      if (p > 0) Milo.sound.hit(); else Milo.sound.click();
      d.lastTrick = NAMES[winner] + ' took the trick' + (p ? ' (+' + p + ')' : '');
      if (!d.hands[0].length) { endHand(g); return; }
      d.phase = 'play';
      startTrick(g);
    }

    function endHand(g) {
      var d = g.data, i;
      var add = d.taken.slice(), moon = -1;
      for (i = 0; i < 4; i++) if (d.taken[i] === 26) moon = i;
      var lines = [];
      if (moon >= 0) {
        for (i = 0; i < 4; i++) add[i] = i === moon ? 0 : 26;
        lines.push(NAMES[moon] + ' shot the moon — everyone else takes 26!');
        if (moon === 0) d.moon++;
      } else {
        lines.push('Hearts and the lady are counted.');
      }
      for (i = 0; i < 4; i++) d.total[i] += add[i];
      lines.push(NAMES.map(function (n, k) { return n + ' +' + add[k]; }).join('   '));
      g.score = Math.max(0, d.total[1] + d.total[2] + d.total[3] - d.total[0]);
      d.summary = { title: 'Hand ' + d.handNo + ' scored', lines: lines };
      d.phase = 'summary';
      updateStats(g);
    }

    function nextHand(g) {
      var d = g.data, i;
      var over = d.total.some(function (t) { return t >= 100; });
      var best = 0;
      for (i = 1; i < 4; i++) if (d.total[i] < d.total[best]) best = i;
      g.score = Math.max(0, d.total[1] + d.total[2] + d.total[3] - d.total[0]);
      if (over) {
        var wonIt = best === 0;
        var line = NAMES.map(function (n, k) { return n + ' ' + d.total[k]; }).join('   ');
        (wonIt ? g.win : g.gameOver).call(g, {
          emo: wonIt ? '♥️' : '👑',
          title: wonIt ? 'Lowest score — you win!' : NAMES[best] + ' wins',
          text: line + (d.moon ? '  ·  you shot the moon ' + d.moon + 'x' : ''),
          score: g.score
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
      var qsGone = d.pile.some(function (p) { return p.some(isQS); }) ||
        d.trick.some(function (t) { return isQS(t.card); });
      var pick;

      if (!d.trick.length) {
        // Leading: lowest safe card, prefer suits where we do not hold the top.
        var scored = cards.map(function (c) {
          var s = val(c);
          if (c.s === 1) s += 26;
          if (isQS(c)) s += 60;
          if (c.s === 0 && val(c) > 12 && !qsGone) s += 40;
          if (c.s === 0 && !qsGone && val(c) < 12) s -= 6;   // flush out the queen
          return { c: c, s: s };
        });
        scored.sort(function (a, b) { return a.s - b.s; });
        pick = scored[0].c;
      } else {
        var led = d.trick[0].card.s;
        var topVal = 0;
        d.trick.forEach(function (t) { if (t.card.s === led) topVal = Math.max(topVal, val(t.card)); });
        var potPts = 0;
        d.trick.forEach(function (t) { potPts += pts(t.card); });
        var last = d.trick.length === 3;
        var follow = cards.filter(function (c) { return c.s === led; });

        if (follow.length) {
          var under = follow.filter(function (c) { return val(c) < topVal; });
          if (under.length) {
            // duck as high as is still safe; if last to play and the trick is
            // clean, taking it costs nothing, so unload the biggest instead.
            if (last && potPts === 0 && !d.first) {
              follow.sort(function (a, b) { return val(b) - val(a); });
              pick = follow[0];
            } else {
              under.sort(function (a, b) { return val(b) - val(a); });
              pick = under[0];
            }
          } else {
            follow.sort(function (a, b) { return val(a) - val(b); });
            pick = follow[0];
            if (led === 0 && !qsGone) {
              var safeQ = follow.filter(function (c) { return !isQS(c); });
              if (safeQ.length) pick = safeQ[0];
            }
          }
        } else {
          // Void — throw the most dangerous card away.
          var junk = cards.map(function (c) {
            var s = val(c);
            if (isQS(c)) s = 200;
            else if (c.s === 0 && val(c) > 12 && !qsGone) s = 150 + val(c);
            else if (c.s === 1) s = 60 + val(c);
            return { c: c, s: s };
          });
          junk.sort(function (a, b) { return b.s - a.s; });
          pick = junk[0].c;
        }
      }
      playCard(g, seat, pick);
    }

    /* ------------------------------------------------------------ drawing */

    function fanX(i, n, w) {
      var step = Math.min(w + 6, (W - 170) / Math.max(1, n));
      return (W - (n - 1) * step - w) / 2 + i * step;
    }

    function buttons(g) {
      var d = g.data;
      if (d.phase === 'summary') {
        return [{ id: 'next', label: 'Next hand', x: W / 2 - 70, y: H / 2 + 96, w: 140, h: 40, primary: true }];
      }
      if (d.phase === 'pass') {
        return [{
          id: 'pass', label: 'Pass ' + PASSDIR[d.dir] + ' (' + d.sel.length + '/3)',
          x: W / 2 - 90, y: H - 48, w: 180, h: 38, primary: d.sel.length === 3
        }];
      }
      return [];
    }
    function hit(b, x, y) { return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h; }
    function drawBtn(c, b) {
      c.fillStyle = b.primary ? '#22d3ee' : 'rgba(255,255,255,.14)';
      U.roundRect(c, b.x, b.y, b.w, b.h, 9); c.fill();
      c.fillStyle = b.primary ? '#062a33' : '#eef2ff';
      c.font = '700 14px Outfit, sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 1);
    }

    var SEATPOS = [
      { x: W / 2 - CW / 2, y: H / 2 + 34 },
      { x: W / 2 - CW / 2 - 132, y: H / 2 - 30 },
      { x: W / 2 - CW / 2, y: H / 2 - 122 },
      { x: W / 2 - CW / 2 + 132, y: H / 2 - 30 }
    ];

    return Milo.arcade(host, {
      id: 'hearts',
      w: W, h: H, bg: '#101c16', stats: NAMES,
      emo: '♥️',
      start: {
        title: 'Hearts',
        text: 'Four players, thirteen tricks, and every heart costs a point while the ' +
          'Queen of Spades costs thirteen. Follow suit, duck whenever you can, and pass your ' +
          'danger cards away before the hand starts. Take all 26 and you shoot the moon — ' +
          'everyone else takes them instead. Game ends at 100; lowest score wins.',
        keys: ['Click a card']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data, i;

        var bs = buttons(g);
        for (i = 0; i < bs.length; i++) {
          if (!hit(bs[i], x, y)) continue;
          if (bs[i].id === 'next') { nextHand(g); return; }
          if (bs[i].id === 'pass') {
            if (d.sel.length !== 3) { bad(g, 'Choose exactly three cards to pass'); return; }
            doPass(g);
            return;
          }
        }
        if (d.phase === 'summary' || d.phase === 'trickend') return;

        var n = d.hands[0].length, hy = H - CH - 66;
        for (i = n - 1; i >= 0; i--) {
          var cx = fanX(i, n, CW);
          if (x < cx || x > cx + CW || y < hy || y > hy + CH) continue;
          if (d.phase === 'pass') {
            var at = d.sel.indexOf(i);
            if (at >= 0) d.sel.splice(at, 1);
            else if (d.sel.length >= 3) { bad(g, 'Three cards only — click one again to swap it out'); return; }
            else d.sel.push(i);
            Milo.sound.tone({ f: 520, d: .04, v: .04, type: 'triangle' });
            return;
          }
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
          if (d.phase === 'play' && d.turn !== 0) aiPlay(g, d.turn);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, i;
        var bg = c.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * .72);
        bg.addColorStop(0, '#1b4634'); bg.addColorStop(1, '#0a1712');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        c.textAlign = 'center'; c.textBaseline = 'alphabetic';
        // opponents
        var info = [
          null,
          { x: 82, y: H / 2 - 40, n: 1 },
          { x: W / 2, y: 30, n: 2 },
          { x: W - 82, y: H / 2 - 40, n: 3 }
        ];
        for (i = 1; i < 4; i++) {
          var o = info[i];
          c.fillStyle = d.turn === i && d.phase === 'play' ? '#ffd257' : 'rgba(255,255,255,.62)';
          c.font = '700 13px Outfit, sans-serif';
          c.fillText(NAMES[i] + '  ·  ' + d.total[i] + ' pts', o.x, o.y - 8);
          c.fillStyle = 'rgba(255,255,255,.4)';
          c.font = '600 11px Outfit, sans-serif';
          c.fillText(d.hands[i].length + ' cards  ·  this hand ' + d.taken[i], o.x, o.y + 8);
          for (var k = 0; k < Math.min(d.hands[i].length, 13); k++) {
            C.draw(c, d.hands[i][k], o.x - 34 + k * 5.2, o.y + 18, 40, 56, { faceUp: false });
          }
        }

        // the trick
        d.trick.forEach(function (t) {
          var p = SEATPOS[t.seat];
          C.draw(c, t.card, p.x, p.y, CW, CH, { faceUp: true });
        });
        if (!d.trick.length && d.lastTrick) {
          c.fillStyle = 'rgba(255,255,255,.35)';
          c.font = '600 12px Outfit, sans-serif';
          c.fillText(d.lastTrick, W / 2, H / 2 - 4);
        }

        c.fillStyle = '#e6ecff';
        c.font = '700 16px Outfit, sans-serif';
        c.fillText(d.msg, W / 2, H - CH - 92);

        c.fillStyle = 'rgba(255,255,255,.5)';
        c.font = '600 12px Outfit, sans-serif';
        c.fillText('Hand ' + d.handNo + '  ·  ' +
          (d.dir === 3 ? 'no passing this hand' : 'passing ' + PASSDIR[d.dir]) +
          '  ·  hearts ' + (d.broken ? 'broken' : 'not broken') +
          '  ·  you have taken ' + d.taken[0], W / 2, H - CH - 72);

        var hn = d.hands[0].length, hy = H - CH - 66;
        var canPlay = d.phase === 'play' && d.turn === 0;
        for (i = 0; i < hn; i++) {
          var ok = canPlay && !legal(g, 0, d.hands[0][i]);
          C.draw(c, d.hands[0][i], fanX(i, hn, CW), hy, CW, CH, {
            faceUp: true,
            selected: d.sel.indexOf(i) >= 0,
            hint: ok,
            dim: canPlay && !ok
          });
        }
        c.fillStyle = d.turn === 0 && d.phase === 'play' ? '#ffd257' : 'rgba(255,255,255,.6)';
        c.font = '700 13px Outfit, sans-serif';
        c.fillText('YOU  ·  ' + d.total[0] + ' pts', W / 2, H - 58);

        buttons(g).forEach(function (b) { drawBtn(c, b); });

        if (d.phase === 'summary' && d.summary) {
          c.fillStyle = 'rgba(6,14,10,.92)';
          U.roundRect(c, W / 2 - 280, H / 2 - 120, 560, 268, 16); c.fill();
          c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1.5; c.stroke();
          c.fillStyle = '#ffd257';
          c.font = '800 24px Outfit, sans-serif';
          c.fillText(d.summary.title, W / 2, H / 2 - 80);
          c.fillStyle = '#dbe4ff';
          c.font = '600 14px Outfit, sans-serif';
          d.summary.lines.forEach(function (ln, k) { c.fillText(ln, W / 2, H / 2 - 44 + k * 26); });
          c.fillStyle = '#9fb3d9';
          c.font = '700 12px Outfit, sans-serif';
          c.fillText('MATCH TOTALS  (game ends at 100)', W / 2, H / 2 + 26);
          c.fillStyle = '#fff';
          c.font = '800 17px Outfit, sans-serif';
          c.fillText(NAMES.map(function (n, k) { return n + ' ' + d.total[k]; }).join('    '), W / 2, H / 2 + 54);
        }
      }
    });
  }

  window.Milo.register({
    id: 'hearts', title: 'Hearts', emo: '♥️', category: 'Cards',
    tagline: 'Duck every heart and the black lady',
    description: 'The full four-handed game: pass three cards left, right, across and then ' +
      'hold, lead the 2♣, follow suit, and keep hearts out of your pile — one point each, ' +
      'thirteen for the Queen of Spades. Hearts cannot be led until one has been discarded, ' +
      'and no points are allowed on the first trick. Collect all 26 and you shoot the moon, ' +
      'handing 26 to everyone else. The three opponents duck, flush out the queen and dump ' +
      'their danger cards the moment they run void. Game ends at 100; lowest score wins.',
    controls: ['Click a card', 'Pass'],
    colors: ['#1b4634', '#f43f5e'],
    tags: ['cards', 'trick taking', 'vs cpu', 'classic'],
    mount: mount
  });
})();
