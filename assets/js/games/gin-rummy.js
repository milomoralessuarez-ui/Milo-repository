/* Gin Rummy — draw/discard, knock at 10 deadwood or less, gin and undercut
   bonuses of 25, first to 100 points takes the match (Hoyle scoring). */
(function () {
  'use strict';
  var W = 940, H = 620, CW = 62, CH = 88;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util, C = Milo.cards;

    /* ------------------------------------------------------------ melding */

    function dwVal(c) { return c.r === 0 ? 1 : Math.min(10, c.r + 1); }

    /** Every set and run that can be made from a hand, as index arrays. */
    function allMelds(hand) {
      var out = [], i, j, k, r, s;
      for (r = 0; r < 13; r++) {
        var idx = [];
        for (i = 0; i < hand.length; i++) if (hand[i].r === r) idx.push(i);
        if (idx.length === 3) out.push(idx.slice());
        else if (idx.length === 4) {
          out.push(idx.slice());
          for (i = 0; i < 4; i++) {
            out.push([idx[(i + 1) % 4], idx[(i + 2) % 4], idx[(i + 3) % 4]]);
          }
        }
      }
      for (s = 0; s < 4; s++) {
        var bys = [];
        for (i = 0; i < hand.length; i++) if (hand[i].s === s) bys.push(i);
        bys.sort(function (a, b) { return hand[a].r - hand[b].r; });
        for (i = 0; i < bys.length; i++) {
          for (j = i + 2; j < bys.length; j++) {
            var ok = true;
            for (k = i; k < j; k++) {
              if (hand[bys[k + 1]].r !== hand[bys[k]].r + 1) { ok = false; break; }
            }
            if (!ok) break;
            out.push(bys.slice(i, j + 1));
          }
        }
      }
      return out;
    }

    /** Lowest-deadwood arrangement of a hand: {dw, melds, dead, meldMask}. */
    function layout(hand) {
      var ms = allMelds(hand), n = hand.length, memo = {};
      function best(mask) {
        if (memo[mask]) return memo[mask];
        var dw = 0, i;
        for (i = 0; i < n; i++) if (!(mask & (1 << i))) dw += dwVal(hand[i]);
        var res = { dw: dw, use: [] };
        for (var m = 0; m < ms.length; m++) {
          var bits = 0, ok = true;
          for (var k = 0; k < ms[m].length; k++) {
            var b = 1 << ms[m][k];
            if (mask & b) { ok = false; break; }
            bits |= b;
          }
          if (!ok) continue;
          var sub = best(mask | bits);
          if (sub.dw < res.dw) res = { dw: sub.dw, use: [ms[m]].concat(sub.use) };
        }
        memo[mask] = res;
        return res;
      }
      var r = best(0), mask = 0;
      r.use.forEach(function (m) { m.forEach(function (i) { mask |= 1 << i; }); });
      var dead = [];
      for (var i = 0; i < n; i++) if (!(mask & (1 << i))) dead.push(hand[i]);
      return {
        dw: r.dw, meldMask: mask, dead: dead,
        melds: r.use.map(function (m) {
          return m.map(function (i) { return hand[i]; });
        })
      };
    }

    /** Deadwood after the defender lays cards off onto the knocker's melds. */
    function layOff(dead, melds) {
      var pool = dead.slice(), sets = melds.map(function (m) { return m.slice(); });
      var moved = true;
      while (moved) {
        moved = false;
        for (var i = 0; i < pool.length && !moved; i++) {
          for (var j = 0; j < sets.length && !moved; j++) {
            var m = sets[j], c = pool[i];
            var isSet = m.length >= 3 && m[0].r === m[1].r;
            if (isSet) {
              if (m.length < 4 && c.r === m[0].r) { m.push(c); pool.splice(i, 1); moved = true; }
            } else {
              var rs = m.map(function (x) { return x.r; });
              var lo = Math.min.apply(null, rs), hi = Math.max.apply(null, rs);
              if (c.s === m[0].s && (c.r === lo - 1 || c.r === hi + 1)) {
                m.push(c); pool.splice(i, 1); moved = true;
              }
            }
          }
        }
      }
      var dw = 0;
      pool.forEach(function (c) { dw += dwVal(c); });
      return { dw: dw, laid: dead.length - pool.length };
    }

    function sortHand(h) {
      h.sort(function (a, b) { return a.s - b.s || a.r - b.r; });
    }

    /* -------------------------------------------------------------- setup */

    function reset(g) {
      var d = g.data;
      d.you = 0; d.cpu = 0; d.handNo = 0;
      d.dealer = 'cpu';
      d.log = [];
      g.score = 0;
      g.set('You', 0); g.set('Rival', 0); g.set('Deadwood', 0);
      newHand(g);
    }

    function newHand(g) {
      var d = g.data;
      d.handNo++;
      var deck = C.shuffled();
      d.hand = deck.splice(0, 10);
      d.ai = deck.splice(0, 10);
      d.stock = deck;
      d.discard = [d.stock.pop()];
      sortHand(d.hand); sortHand(d.ai);
      d.turn = d.dealer === 'you' ? 'cpu' : 'you';
      d.phase = 'offer';
      d.offers = 0;
      d.sel = -1;
      d.think = 0;
      d.summary = null;
      d.aiTook = {};        // ranks the human has picked off the discard pile
      d.msg = d.turn === 'you'
        ? 'You are not the dealer — take the upcard or pass'
        : 'Rival looks at the upcard first';
      if (d.turn === 'cpu') d.think = 0.9;
      refresh(g);
    }

    function refresh(g) {
      var d = g.data;
      d.lay = layout(d.hand);
      g.set('Deadwood', d.lay.dw);
      g.set('You', d.you); g.set('Rival', d.cpu);
    }

    function bad(g, why) {
      g.data.msg = why;
      Milo.sound.tone({ f: 150, d: .08, v: .05, type: 'square' });
    }

    /* --------------------------------------------------------- hand logic */

    function takeUp(g, who) {
      var d = g.data;
      var card = d.discard.pop();
      if (who === 'you') { d.hand.push(card); sortHand(d.hand); }
      else { d.ai.push(card); d.aiUpcard = card; }
      Milo.sound.click();
      d.phase = 'discard';
      d.turn = who;
      refresh(g);
    }

    function drawStock(g, who) {
      var d = g.data;
      if (!d.stock.length) return false;
      var card = d.stock.pop();
      if (who === 'you') { d.hand.push(card); sortHand(d.hand); }
      else d.ai.push(card);
      Milo.sound.click();
      d.phase = 'discard';
      refresh(g);
      return true;
    }

    function discardCard(g, who, card) {
      var d = g.data;
      var hand = who === 'you' ? d.hand : d.ai;
      hand.splice(hand.indexOf(card), 1);
      d.discard.push(card);
      Milo.sound.tone({ f: 420, f2: 520, d: .06, v: .05, type: 'triangle' });
      refresh(g);
    }

    function endTurn(g) {
      var d = g.data;
      if (d.stock.length <= 2) { washHand(g); return; }
      d.turn = d.turn === 'you' ? 'cpu' : 'you';
      d.phase = 'draw';
      d.sel = -1;
      if (d.turn === 'you') d.msg = 'Your turn — draw from the stock or take the discard';
      else { d.msg = 'Rival is thinking…'; d.think = 0.8; }
    }

    function washHand(g) {
      var d = g.data;
      d.summary = {
        title: 'No game',
        lines: ['Only two cards left in the stock.', 'Nobody knocked, so the hand is washed out.'],
        you: 0, cpu: 0
      };
      d.phase = 'summary';
      Milo.sound.tone({ f: 260, f2: 200, d: .18, v: .06, type: 'sine' });
    }

    function knock(g, who) {
      var d = g.data;
      var kn = layout(who === 'you' ? d.hand : d.ai);
      var opHand = who === 'you' ? d.ai : d.hand;
      var op = layout(opHand);
      var gin = kn.dw === 0;
      var opDw = op.dw, laid = 0;
      if (!gin) {
        var lo = layOff(op.dead, kn.melds);
        opDw = lo.dw; laid = lo.laid;
      }
      var lines = [], sy = 0, sc = 0;
      var meName = who === 'you' ? 'You' : 'Rival';
      var opName = who === 'you' ? 'Rival' : 'You';
      lines.push(meName + (gin ? ' went GIN' : ' knocked with ' + kn.dw) + '.');
      lines.push(opName + ' had ' + opDw + ' deadwood' +
        (laid ? ' after laying off ' + laid + ' card' + (laid > 1 ? 's' : '') : '') + '.');

      if (gin) {
        var pts = opDw + 25;
        lines.push('Gin bonus 25 — ' + pts + ' points.');
        if (who === 'you') sy = pts; else sc = pts;
      } else if (opDw < kn.dw || opDw === kn.dw) {
        var up = (kn.dw - opDw) + 25;
        lines.push('Undercut! ' + opName + ' scores ' + up + ' (difference + 25 bonus).');
        if (who === 'you') sc = up; else sy = up;
      } else {
        var diff = opDw - kn.dw;
        lines.push(meName + ' scores the ' + diff + '-point difference.');
        if (who === 'you') sy = diff; else sc = diff;
      }

      d.you += sy; d.cpu += sc;
      d.summary = {
        title: gin ? (who === 'you' ? 'Gin!' : 'Rival goes gin') : (who === 'you' ? 'You knock' : 'Rival knocks'),
        lines: lines, you: sy, cpu: sc,
        showAi: true
      };
      d.phase = 'summary';
      refresh(g);
      if (sy > sc) Milo.sound.coin(); else Milo.sound.hit();
    }

    function nextHand(g) {
      var d = g.data;
      g.score = d.you;
      if (d.you >= 100 || d.cpu >= 100) {
        var won = d.you > d.cpu;
        var fn = won ? g.win : g.gameOver;
        fn.call(g, {
          emo: won ? '🃏' : '😤',
          title: won ? 'Match won!' : 'Rival takes the match',
          text: 'Final score ' + d.you + ' – ' + d.cpu + ' over ' + d.handNo + ' hands.',
          score: d.you
        });
        return;
      }
      d.dealer = d.dealer === 'you' ? 'cpu' : 'you';
      newHand(g);
    }

    /* ------------------------------------------------------------ the AI */

    /** Best deadwood reachable from a hand of 11 by throwing one card. */
    function bestDiscard(hand, avoid) {
      var best = null;
      for (var i = 0; i < hand.length; i++) {
        var rest = hand.slice(); rest.splice(i, 1);
        var lay = layout(rest);
        var risk = avoid && avoid[hand[i].r] ? 6 : 0;
        var score = lay.dw + risk - dwVal(hand[i]) * 0.02;
        if (!best || score < best.score) best = { score: score, dw: lay.dw, card: hand[i], lay: lay };
      }
      return best;
    }

    function aiTurn(g) {
      var d = g.data;

      if (d.phase === 'offer') {
        var up = d.discard[d.discard.length - 1];
        var cur = layout(d.ai).dw;
        var withUp = bestDiscard(d.ai.concat([up]), d.aiTook);
        if (withUp.dw <= cur - 5) {
          takeUp(g, 'cpu');
          d.msg = 'Rival takes the ' + C.label(up) + ' from the pile';
        } else {
          d.offers++;
          d.msg = 'Rival passes on the upcard';
          if (d.offers >= 2) {
            d.turn = d.dealer === 'you' ? 'cpu' : 'you';
            d.phase = 'draw';
            d.msg = d.turn === 'you' ? 'Both passed — draw from the stock'
              : 'Both passed — rival draws';
            if (d.turn === 'cpu') d.think = 0.8;
          } else {
            d.turn = 'you'; d.phase = 'offer';
            d.msg = 'Rival passed — the ' + C.label(up) + ' is yours if you want it';
          }
          return;
        }
      } else if (d.phase === 'draw') {
        var upc = d.discard[d.discard.length - 1];
        var now = layout(d.ai).dw;
        var opt = bestDiscard(d.ai.concat([upc]), d.aiTook);
        if (opt.dw < now) {
          takeUp(g, 'cpu');
          d.msg = 'Rival takes the ' + C.label(upc);
        } else if (!drawStock(g, 'cpu')) { washHand(g); return; }
        else d.msg = 'Rival draws from the stock';
      }

      // discard phase
      var pick = bestDiscard(d.ai, d.aiTook);
      // Never hand back the card just taken from the pile.
      if (d.aiUpcard && pick.card === d.aiUpcard && d.ai.length > 1) {
        var alt = null;
        for (var i = 0; i < d.ai.length; i++) {
          if (d.ai[i] === d.aiUpcard) continue;
          var rest = d.ai.slice(); rest.splice(i, 1);
          var lay = layout(rest);
          if (!alt || lay.dw < alt.dw) alt = { dw: lay.dw, card: d.ai[i] };
        }
        if (alt) pick = alt;
      }
      d.aiUpcard = null;
      discardCard(g, 'cpu', pick.card);
      d.msg += ' and throws the ' + C.label(pick.card);

      var after = layout(d.ai);
      var lateGame = d.stock.length < 20;
      if (after.dw === 0 || (after.dw <= 10 && (after.dw <= 4 || lateGame))) {
        knock(g, 'cpu');
        return;
      }
      endTurn(g);
    }

    /* ------------------------------------------------------------ drawing */

    function fanX(i, n, w) {
      var step = Math.min(w + 8, (W - 140) / Math.max(1, n));
      return (W - (n - 1) * step - w) / 2 + i * step;
    }

    function buttons(g) {
      var d = g.data, out = [], y = H - 48;
      if (d.phase === 'summary') {
        out.push({ id: 'next', label: 'Next hand', x: W / 2 - 70, y: H / 2 + 92, w: 140, h: 40, primary: true });
        return out;
      }
      if (d.turn !== 'you') return out;
      if (d.phase === 'offer') {
        out.push({ id: 'take', label: 'Take ' + C.label(d.discard[d.discard.length - 1]), x: W / 2 - 180, y: y, w: 170, h: 38, primary: true });
        out.push({ id: 'pass', label: 'Pass', x: W / 2 + 10, y: y, w: 170, h: 38 });
        return out;
      }
      if (d.phase === 'discard') {
        out.push({ id: 'discard', label: 'Discard', x: W / 2 - 180, y: y, w: 170, h: 38, primary: true });
        out.push({
          id: 'knock', label: 'Knock', x: W / 2 + 10, y: y, w: 170, h: 38,
          off: d.sel < 0 ? 'select a card first' : null
        });
      }
      return out;
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

    return Milo.arcade(host, {
      id: 'gin-rummy',
      w: W, h: H, bg: '#123', stats: ['You', 'Rival', 'Deadwood'],
      emo: '🃏',
      start: {
        title: 'Gin Rummy',
        text: 'Build sets and runs, and get your unmatched cards (deadwood) down to 10 ' +
          'or less to knock. Gin — no deadwood at all — pays a 25 bonus, and if the rival ' +
          'ties or beats your count after laying off, they undercut you for 25. First to 100.',
        keys: ['Click a card', 'Discard', 'Knock']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data, i;

        var bs = buttons(g);
        for (i = 0; i < bs.length; i++) {
          if (!hit(bs[i], x, y)) continue;
          var b = bs[i];
          if (b.off) { bad(g, 'Knock: ' + b.off); return; }
          if (b.id === 'next') { nextHand(g); return; }
          if (b.id === 'take') {
            d.aiTook[d.discard[d.discard.length - 1].r] = 1;
            takeUp(g, 'you');
            d.msg = 'You take the upcard — now discard';
            return;
          }
          if (b.id === 'pass') {
            d.offers++;
            if (d.offers >= 2) {
              d.phase = 'draw';
              d.turn = d.dealer === 'you' ? 'cpu' : 'you';
              if (d.turn === 'cpu') { d.think = 0.8; d.msg = 'Both passed — rival draws'; }
              else d.msg = 'Both passed — you draw from the stock';
            } else {
              d.phase = 'offer'; d.turn = 'cpu'; d.think = 0.7;
              d.msg = 'You passed — the rival may take it';
            }
            return;
          }
          if (b.id === 'discard' || b.id === 'knock') {
            if (d.sel < 0) { bad(g, 'Pick a card from your hand first'); return; }
            var card = d.hand[d.sel];
            if (b.id === 'knock') {
              var rest = d.hand.slice(); rest.splice(d.sel, 1);
              var lay = layout(rest);
              if (lay.dw > 10) {
                bad(g, 'You cannot knock with ' + lay.dw + ' deadwood — 10 or less is needed');
                return;
              }
              discardCard(g, 'you', card);
              d.sel = -1;
              knock(g, 'you');
              return;
            }
            discardCard(g, 'you', card);
            d.sel = -1;
            d.msg = 'You throw the ' + C.label(card);
            endTurn(g);
            return;
          }
        }

        if (d.phase === 'summary') return;
        if (d.turn !== 'you') return;

        // stock / discard pile
        var py = H / 2 - CH / 2 - 26;
        if (d.phase === 'draw') {
          if (x >= W / 2 - 110 && x <= W / 2 - 110 + CW && y >= py && y <= py + CH) {
            if (!drawStock(g, 'you')) { washHand(g); return; }
            d.msg = 'You draw from the stock — now discard';
            return;
          }
          if (x >= W / 2 + 40 && x <= W / 2 + 40 + CW && y >= py && y <= py + CH) {
            var up = d.discard[d.discard.length - 1];
            d.aiTook[up.r] = 1;
            takeUp(g, 'you');
            d.msg = 'You take the ' + C.label(up) + ' — now discard';
            return;
          }
        }

        // hand
        var n = d.hand.length, hy = H - CH - 74;
        for (i = n - 1; i >= 0; i--) {
          var cx = fanX(i, n, CW);
          if (x >= cx && x <= cx + CW && y >= hy && y <= hy + CH) {
            if (d.phase !== 'discard') { bad(g, 'Draw a card before you discard'); return; }
            d.sel = d.sel === i ? -1 : i;
            Milo.sound.tone({ f: 520, d: .04, v: .04, type: 'triangle' });
            return;
          }
        }
      },

      update: function (g, dt) {
        var d = g.data;
        if (d.think > 0) {
          d.think -= dt;
          if (d.think <= 0 && d.turn === 'cpu' && d.phase !== 'summary') aiTurn(g);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, i;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#26364f'); bg.addColorStop(1, '#0d1524');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        c.textAlign = 'center'; c.textBaseline = 'alphabetic';
        c.fillStyle = 'rgba(255,255,255,.55)';
        c.font = '700 12px Outfit, sans-serif';
        c.fillText('RIVAL  ·  ' + d.ai.length + ' cards  ·  ' +
          (d.dealer === 'cpu' ? 'dealing' : 'not dealing'), W / 2, 22);

        var n = d.ai.length;
        for (i = 0; i < n; i++) {
          C.draw(c, d.ai[i], fanX(i, n, CW * .82), 32, CW * .82, CH * .82,
            { faceUp: !!(d.summary && d.summary.showAi) });
        }

        var py = H / 2 - CH / 2 - 26;
        if (d.stock.length) C.draw(c, d.stock[d.stock.length - 1], W / 2 - 110, py, CW, CH, { faceUp: false });
        else C.slot(c, W / 2 - 110, py, CW, CH, '∅');
        c.fillStyle = 'rgba(255,255,255,.5)';
        c.font = '600 11px Outfit, sans-serif';
        c.fillText('Stock ' + d.stock.length, W / 2 - 110 + CW / 2, py + CH + 16);

        if (d.discard.length) {
          C.draw(c, d.discard[d.discard.length - 1], W / 2 + 40, py, CW, CH, { faceUp: true });
        } else C.slot(c, W / 2 + 40, py, CW, CH, '↓');
        c.fillStyle = 'rgba(255,255,255,.5)';
        c.fillText('Discard', W / 2 + 40 + CW / 2, py + CH + 16);

        c.fillStyle = '#e6ecff';
        c.font = '700 16px Outfit, sans-serif';
        c.fillText(d.msg, W / 2, H - CH - 100);

        c.fillStyle = 'rgba(255,255,255,.5)';
        c.font = '600 12px Outfit, sans-serif';
        c.fillText('Match to 100  ·  you ' + d.you + '   rival ' + d.cpu +
          '   ·  deadwood ' + d.lay.dw + ' (melds outlined green)', W / 2, H - CH - 80);

        var hn = d.hand.length, hy = H - CH - 74;
        for (i = 0; i < hn; i++) {
          C.draw(c, d.hand[i], fanX(i, hn, CW), hy, CW, CH, {
            faceUp: true,
            selected: d.sel === i,
            hint: d.sel !== i && !!(d.lay.meldMask & (1 << i))
          });
        }

        buttons(g).forEach(function (b) { drawBtn(c, b); });

        if (d.phase === 'summary' && d.summary) {
          var sm = d.summary;
          c.fillStyle = 'rgba(6,10,24,.9)';
          U.roundRect(c, W / 2 - 250, H / 2 - 120, 500, 260, 16); c.fill();
          c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1.5; c.stroke();
          c.fillStyle = '#ffd257';
          c.font = '800 24px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(sm.title, W / 2, H / 2 - 82);
          c.fillStyle = '#dbe4ff';
          c.font = '600 14px Outfit, sans-serif';
          sm.lines.forEach(function (ln, k) { c.fillText(ln, W / 2, H / 2 - 48 + k * 24); });
          c.fillStyle = '#9fb3d9';
          c.font = '700 15px Outfit, sans-serif';
          c.fillText('This hand:  you +' + sm.you + '   rival +' + sm.cpu, W / 2, H / 2 + 36);
          c.fillStyle = '#fff';
          c.font = '800 17px Outfit, sans-serif';
          c.fillText('Match:  ' + d.you + '  –  ' + d.cpu, W / 2, H / 2 + 66);
        }
      }
    });
  }

  window.Milo.register({
    id: 'gin-rummy', title: 'Gin Rummy', emo: '🃏', category: 'Cards',
    tagline: 'Knock at ten deadwood — or go gin',
    description: 'Ten-card gin rummy against a rival that remembers every card you pull ' +
      'off the discard pile and stops feeding you that rank. Draw, discard, and knock once ' +
      'your unmatched cards total 10 or less; the rival then lays its own deadwood off onto ' +
      'your melds, and if its count matches or beats yours it undercuts you for 25. Gin pays ' +
      '25 too. Standard Hoyle scoring, first to 100 points.',
    controls: ['Click a card', 'Discard', 'Knock'],
    colors: ['#26364f', '#22d3ee'],
    tags: ['cards', 'rummy', 'vs cpu', 'melds'],
    mount: mount
  });
})();
