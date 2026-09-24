/* Cribbage — six cards, a crib, the play to 31 and the show. First to 121. */
(function () {
  'use strict';
  var W = 960, H = 640, CW = 62, CH = 88;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util, C = Milo.cards;

    function cval(c) { return Math.min(10, c.r === 0 ? 1 : c.r + 1); }
    function crank(c) { return c.r === 0 ? 1 : c.r + 1; }
    function sortHand(h) { h.sort(function (a, b) { return crank(a) - crank(b) || a.s - b.s; }); }
    function bad(g, why) {
      g.data.msg = why;
      Milo.sound.tone({ f: 150, d: .08, v: .05, type: 'square' });
    }

    /* ------------------------------------------------------------ scoring */

    function scoreHand(hand4, starter, isCrib) {
      var all = hand4.concat([starter]), parts = [], total = 0, i, j;
      var n = all.length;

      var f = 0;
      for (var m = 1; m < (1 << n); m++) {
        var s = 0;
        for (i = 0; i < n; i++) if (m & (1 << i)) s += cval(all[i]);
        if (s === 15) f++;
      }
      if (f) { total += f * 2; parts.push(f + ' fifteen' + (f > 1 ? 's' : '') + ' = ' + f * 2); }

      var pc = 0;
      for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) if (all[i].r === all[j].r) pc++;
      if (pc) {
        total += pc * 2;
        parts.push(pc === 1 ? 'pair = 2' : pc === 3 ? 'three of a kind = 6'
          : pc === 6 ? 'four of a kind = 12' : pc + ' pairs = ' + pc * 2);
      }

      var counts = {};
      all.forEach(function (c) { counts[crank(c)] = (counts[crank(c)] || 0) + 1; });
      var ranks = Object.keys(counts).map(Number).sort(function (a, b) { return a - b; });
      var bestLen = 0, bestMult = 1;
      i = 0;
      while (i < ranks.length) {
        var len = 1, mult = counts[ranks[i]], k = i;
        while (k + 1 < ranks.length && ranks[k + 1] === ranks[k] + 1) {
          k++; len++; mult *= counts[ranks[k]];
        }
        if (len >= 3 && len > bestLen) { bestLen = len; bestMult = mult; }
        i = k + 1;
      }
      if (bestLen >= 3) {
        var rp = bestLen * bestMult;
        total += rp;
        parts.push((bestMult > 1 ? bestMult + ' runs of ' + bestLen : 'run of ' + bestLen) + ' = ' + rp);
      }

      var fs = hand4[0].s;
      var same = hand4.every(function (c) { return c.s === fs; });
      if (same) {
        if (starter.s === fs) { total += 5; parts.push('flush of five = 5'); }
        else if (!isCrib) { total += 4; parts.push('flush = 4'); }
      }
      hand4.forEach(function (c) {
        if (c.r === 10 && c.s === starter.s) { total += 1; parts.push('his nobs = 1'); }
      });

      return { total: total, parts: parts.length ? parts : ['nothing'] };
    }

    /** Pegging score for the card just added to the run of play. */
    function pegScore(seq, count) {
      var pts = 0, parts = [], i;
      if (count === 15) { pts += 2; parts.push('fifteen 2'); }
      if (count === 31) { pts += 2; parts.push('thirty-one 2'); }
      var last = seq[seq.length - 1].card, k = 0;
      for (i = seq.length - 1; i >= 0; i--) {
        if (seq[i].card.r === last.r) k++; else break;
      }
      if (k >= 2) {
        var pp = k * (k - 1);
        pts += pp;
        parts.push(k === 2 ? 'pair 2' : k === 3 ? 'three of a kind 6' : 'four of a kind 12');
      }
      for (var L = seq.length; L >= 3; L--) {
        var sub = [];
        for (i = seq.length - L; i < seq.length; i++) sub.push(crank(seq[i].card));
        var seen = {}, ok = true;
        for (i = 0; i < sub.length; i++) { if (seen[sub[i]]) { ok = false; break; } seen[sub[i]] = 1; }
        if (!ok) continue;
        if (Math.max.apply(null, sub) - Math.min.apply(null, sub) === L - 1) {
          pts += L; parts.push('run of ' + L + ' = ' + L); break;
        }
      }
      return { pts: pts, parts: parts };
    }

    /* -------------------------------------------------------------- setup */

    function reset(g) {
      var d = g.data;
      d.pts = [0, 0];                   // 0 = you, 1 = rival
      d.dealer = 1;                     // rival deals first, you count first
      d.handNo = 0;
      d.over = false;
      g.score = 0;
      g.set('You', 0); g.set('Rival', 0); g.set('Count', 0);
      newHand(g);
    }

    function newHand(g) {
      var d = g.data;
      d.handNo++;
      d.dealer = 1 - d.dealer;
      var deck = C.shuffled();
      d.deck = deck;
      d.hand = deck.splice(0, 6);
      d.ai = deck.splice(0, 6);
      sortHand(d.hand); sortHand(d.ai);
      d.crib = [];
      d.starter = null;
      d.sel = [];
      d.seq = [];
      d.count = 0;
      d.played = [[], []];
      d.playHand = null;
      d.phase = 'discard';
      d.think = 0;
      d.show = null;
      d.pegNote = '';
      d.turn = 1 - d.dealer;
      d.msg = 'Discard two cards to ' + (d.dealer === 0 ? 'your own crib' : "the rival's crib");
      g.set('Count', 0);
    }

    function peg(g, who, n, why) {
      var d = g.data;
      if (!n || d.over) return;
      d.pts[who] += n;
      d.pegNote = (who === 0 ? 'You peg ' : 'Rival pegs ') + n + (why ? ' — ' + why : '');
      g.set('You', d.pts[0]); g.set('Rival', d.pts[1]);
      g.score = d.pts[0];
      Milo.sound.tone({ f: who === 0 ? 620 : 300, f2: who === 0 ? 780 : 240, d: .07, v: .06, type: 'triangle' });
      if (d.pts[who] >= 121) {
        d.pts[who] = 121;
        d.over = true;
        d.phase = 'over';
        var wonIt = who === 0;
        (wonIt ? g.win : g.gameOver).call(g, {
          emo: wonIt ? '🎯' : '🪵',
          title: wonIt ? 'Pegged out — you win!' : 'The rival pegs out',
          text: 'Final ' + d.pts[0] + ' – ' + d.pts[1] +
            (d.pts[1 - who] < 91 ? '  ·  skunked!' : '') + ' after ' + d.handNo + ' hands.',
          score: d.pts[0]
        });
      }
    }

    /* ------------------------------------------------------- AI discarding */

    function cribValue(a, b) {
      var v = 0;
      if (a.r === b.r) v += 2;
      if (cval(a) + cval(b) === 15) v += 2.4;
      if (Math.abs(crank(a) - crank(b)) === 1) v += 1.2;
      if (Math.abs(crank(a) - crank(b)) === 2) v += 0.6;
      if (cval(a) === 5 || cval(b) === 5) v += 2.2;
      if (a.r === 10 || b.r === 10) v += 0.7;
      if (a.s === b.s) v += 0.5;
      return v;
    }

    function aiDiscard(g) {
      var d = g.data, i, j, k;
      var mine = d.dealer === 1;
      var seen = {};
      d.ai.forEach(function (c) { seen[c.s * 13 + c.r] = 1; });
      var pool = [];
      for (i = 0; i < 4; i++) for (j = 0; j < 13; j++) {
        if (!seen[i * 13 + j]) pool.push({ r: j, s: i });
      }
      var best = null;
      for (i = 0; i < 6; i++) for (j = i + 1; j < 6; j++) {
        var keep = [], toss = [];
        for (k = 0; k < 6; k++) (k === i || k === j ? toss : keep).push(d.ai[k]);
        var sum = 0;
        for (k = 0; k < pool.length; k++) sum += scoreHand(keep, pool[k], false).total;
        var exp = sum / pool.length + (mine ? 0.9 : -0.9) * cribValue(toss[0], toss[1]);
        if (!best || exp > best.exp) best = { exp: exp, keep: keep, toss: toss };
      }
      d.ai = best.keep;
      sortHand(d.ai);
      d.crib = d.crib.concat(best.toss);
    }

    function doDiscard(g) {
      var d = g.data;
      var idx = d.sel.slice().sort(function (a, b) { return b - a; });
      idx.forEach(function (i) { d.crib.push(d.hand.splice(i, 1)[0]); });
      d.sel = [];
      aiDiscard(g);
      d.starter = d.deck.pop();
      Milo.sound.blip();
      if (d.starter.r === 10) peg(g, d.dealer, 2, 'his heels (Jack cut)');
      if (d.over) return;
      d.playHand = [d.hand.slice(), d.ai.slice()];
      d.phase = 'play';
      d.turn = 1 - d.dealer;
      d.count = 0;
      g.set('Count', 0);
      d.msg = d.turn === 0 ? 'Your lead — play a card' : 'The rival leads';
      if (d.turn === 1) d.think = 0.8;
    }

    /* --------------------------------------------------------- the play */

    function canPlay(g, who) {
      var d = g.data;
      return d.playHand[who].some(function (c) { return d.count + cval(c) <= 31; });
    }

    function playPeg(g, who, card) {
      var d = g.data;
      var h = d.playHand[who];
      h.splice(h.indexOf(card), 1);
      d.played[who].push(card);
      d.seq.push({ who: who, card: card });
      d.count += cval(card);
      g.set('Count', d.count);
      var sc = pegScore(d.seq, d.count);
      if (sc.pts) peg(g, who, sc.pts, sc.parts.join(', '));
      else d.pegNote = (who === 0 ? 'You play ' : 'Rival plays ') + C.label(card);
      if (d.over) return;

      var other = 1 - who;
      var empty = !d.playHand[0].length && !d.playHand[1].length;

      if (empty) {
        if (d.count !== 31) peg(g, who, 1, 'last card');
        if (d.over) return;
        startShow(g);
        return;
      }
      if (d.count === 31) { resetRound(g, other); return; }
      if (canPlay(g, other)) {
        d.turn = other;
        d.msg = other === 0 ? 'Your turn — count is ' + d.count : 'Rival to play';
        if (other === 1) d.think = 0.7;
      } else if (canPlay(g, who)) {
        d.turn = who;
        d.msg = (other === 0 ? 'You cannot play — go' : 'Rival says go') +
          ' — ' + (who === 0 ? 'you play on' : 'rival plays on');
        if (who === 1) d.think = 0.7;
      } else {
        peg(g, who, 1, 'go');
        if (d.over) return;
        resetRound(g, other);
      }
    }

    function resetRound(g, next) {
      var d = g.data;
      d.seq = [];
      d.count = 0;
      g.set('Count', 0);
      if (!d.playHand[0].length && !d.playHand[1].length) { startShow(g); return; }
      if (!canPlay(g, next)) next = 1 - next;
      d.turn = next;
      d.msg = next === 0 ? 'New count — your lead' : 'New count — rival leads';
      if (next === 1) d.think = 0.8;
    }

    function aiPeg(g) {
      var d = g.data;
      var legal = d.playHand[1].filter(function (c) { return d.count + cval(c) <= 31; });
      if (!legal.length) return;
      var best = null;
      legal.forEach(function (c) {
        var seq = d.seq.concat([{ who: 1, card: c }]);
        var cnt = d.count + cval(c);
        var sc = pegScore(seq, cnt).pts;
        var risk = 0;
        if (cnt === 5 || cnt === 21) risk += 3.2;     // a ten-card makes 15 / 31
        if (cnt === 15 || cnt === 31) risk -= 0.5;
        if (!d.seq.length && cval(c) === 5) risk += 2.5;
        if (cnt <= 4) risk -= 0.4;
        var v = sc * 2 - risk + (cnt === 31 ? 1 : 0);
        if (!best || v > best.v) best = { v: v, c: c };
      });
      playPeg(g, 1, best.c);
    }

    /* --------------------------------------------------------- the show */

    function startShow(g) {
      var d = g.data;
      var order = [1 - d.dealer, d.dealer];
      var rows = [];
      var names = ['You', 'Rival'];
      var handsFor = [d.hand, d.ai];
      var i;
      for (i = 0; i < 2; i++) {
        var who = order[i];
        var sc = scoreHand(handsFor[who], d.starter, false);
        rows.push({ who: who, label: names[who] + "'s hand", cards: handsFor[who], sc: sc });
        peg(g, who, sc.total, 'the show');
        if (d.over) break;
      }
      if (!d.over) {
        var cs = scoreHand(d.crib, d.starter, true);
        rows.push({ who: d.dealer, label: names[d.dealer] + "'s crib", cards: d.crib, sc: cs });
        peg(g, d.dealer, cs.total, 'the crib');
      }
      d.show = rows;
      if (!d.over) { d.phase = 'show'; d.msg = 'The show — then a fresh deal'; }
    }

    /* ------------------------------------------------------------ drawing */

    function fanX(i, n, w, span) {
      var step = Math.min(w + 10, (span || (W - 200)) / Math.max(1, n));
      return (W - (n - 1) * step - w) / 2 + i * step;
    }
    function hitB(b, x, y) { return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h; }
    function drawBtn(c, b) {
      c.fillStyle = b.primary ? '#22d3ee' : 'rgba(255,255,255,.14)';
      U.roundRect(c, b.x, b.y, b.w, b.h, 9); c.fill();
      c.fillStyle = b.primary ? '#062a33' : '#eef2ff';
      c.font = '700 14px Outfit, sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 1);
    }
    function buttons(g) {
      var d = g.data;
      if (d.phase === 'discard') {
        return [{
          id: 'toss', label: 'Discard to crib (' + d.sel.length + '/2)',
          x: W / 2 - 110, y: H - 46, w: 220, h: 38, primary: d.sel.length === 2
        }];
      }
      if (d.phase === 'show') {
        return [{ id: 'next', label: 'Next deal', x: W / 2 - 70, y: H - 46, w: 140, h: 40, primary: true }];
      }
      return [];
    }

    /* The board: two streets of sixty holes each, out and back, per player. */
    function drawBoard(c, d) {
      var x0 = 40, y0 = 18, step = (W - 110) / 60;
      c.fillStyle = 'rgba(18,10,6,.7)';
      U.roundRect(c, 22, 10, W - 44, 78, 12); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1; c.stroke();
      var cols = ['#22d3ee', '#fb7185'];
      for (var p = 0; p < 2; p++) {
        var base = y0 + p * 34;
        for (var i = 1; i <= 121; i++) {
          var lane = i <= 60 ? 0 : 1;
          var x = lane === 0 ? x0 + (i - 1) * step : x0 + (121 - i) * step;
          var y = base + lane * 14;
          var on = d.pts[p] >= i;
          c.beginPath();
          c.arc(x, y, i % 5 === 0 ? 2.6 : 1.9, 0, 7);
          c.fillStyle = on ? cols[p] : 'rgba(255,255,255,.16)';
          c.fill();
          if (i === d.pts[p]) {
            c.beginPath(); c.arc(x, y, 5, 0, 7);
            c.fillStyle = cols[p]; c.fill();
            c.strokeStyle = '#fff'; c.lineWidth = 1.2; c.stroke();
          }
        }
        c.fillStyle = cols[p];
        c.font = '800 12px Outfit, sans-serif';
        c.textAlign = 'right';
        c.fillText((p === 0 ? 'YOU ' : 'RIVAL ') + d.pts[p], W - 32, base + 12);
      }
      c.textAlign = 'center';
    }

    return Milo.arcade(host, {
      id: 'cribbage',
      w: W, h: H, bg: '#14100c', stats: ['You', 'Rival', 'Count'],
      emo: '🪵',
      start: {
        title: 'Cribbage',
        text: 'Six cards each, two into the dealer’s crib, then a cut. In the play you ' +
          'alternate cards up to 31, pegging for fifteens, pairs, runs and the go. Then the ' +
          'show: fifteens, pairs, runs, flushes and his nobs, non-dealer counting first. ' +
          'A cut Jack gives the dealer two for his heels. Race up the board to 121.',
        keys: ['Click a card', 'Discard']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data, i;
        var bs = buttons(g);
        for (i = 0; i < bs.length; i++) {
          if (!hitB(bs[i], x, y)) continue;
          if (bs[i].id === 'toss') {
            if (d.sel.length !== 2) { bad(g, 'Choose exactly two cards for the crib'); return; }
            doDiscard(g);
            return;
          }
          if (bs[i].id === 'next') { newHand(g); return; }
        }
        if (d.phase === 'show' || d.phase === 'over') return;

        var n = d.phase === 'discard' ? d.hand.length : d.playHand[0].length;
        var list = d.phase === 'discard' ? d.hand : d.playHand[0];
        var hy = H - CH - 64;
        for (i = n - 1; i >= 0; i--) {
          var cx = fanX(i, n, CW);
          if (x < cx || x > cx + CW || y < hy || y > hy + CH) continue;
          if (d.phase === 'discard') {
            var at = d.sel.indexOf(i);
            if (at >= 0) d.sel.splice(at, 1);
            else if (d.sel.length >= 2) { bad(g, 'Two cards only — click one again to swap it'); return; }
            else d.sel.push(i);
            Milo.sound.tone({ f: 520, d: .04, v: .04, type: 'triangle' });
            return;
          }
          if (d.turn !== 0) { bad(g, 'Wait — the rival is still playing'); return; }
          if (d.count + cval(list[i]) > 31) {
            bad(g, 'That would take the count past 31 (it is ' + d.count + ')');
            return;
          }
          playPeg(g, 0, list[i]);
          return;
        }
      },

      update: function (g, dt) {
        var d = g.data;
        if (d.over) return;
        if (d.think > 0) {
          d.think -= dt;
          if (d.think > 0) return;
          if (d.phase === 'play' && d.turn === 1) {
            if (canPlay(g, 1)) aiPeg(g);
            else {
              // rival cannot play: you keep going, or the go point is scored
              if (canPlay(g, 0)) { d.turn = 0; d.msg = 'Rival says go — play on'; }
              else if (d.seq.length) {
                var lastWho = d.seq[d.seq.length - 1].who;
                peg(g, lastWho, 1, 'go');
                if (!d.over) resetRound(g, 1 - lastWho);
              }
            }
          }
        }
        // your side of a go: nothing playable and it is your turn
        if (d.phase === 'play' && d.turn === 0 && !canPlay(g, 0) && d.playHand[0].length + d.playHand[1].length) {
          if (canPlay(g, 1)) { d.turn = 1; d.think = 0.7; d.msg = 'You say go — rival plays on'; }
          else if (d.seq.length) {
            var lw = d.seq[d.seq.length - 1].who;
            peg(g, lw, 1, 'go');
            if (!d.over) resetRound(g, 1 - lw);
          }
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, i;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#3a2a1c'); bg.addColorStop(1, '#140f0a');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);
        drawBoard(c, d);

        c.textAlign = 'center'; c.textBaseline = 'alphabetic';
        c.fillStyle = 'rgba(255,255,255,.6)';
        c.font = '700 12px Outfit, sans-serif';
        c.fillText('RIVAL  ·  ' + (d.phase === 'discard' ? d.ai.length : d.playHand ? d.playHand[1].length : 0) +
          ' cards  ·  ' + (d.dealer === 1 ? 'deals (their crib)' : 'not dealing'), W / 2, 112);
        var rn = d.phase === 'discard' ? d.ai.length : (d.playHand ? d.playHand[1].length : 0);
        for (i = 0; i < rn; i++) {
          C.draw(c, { r: 0, s: 0 }, fanX(i, rn, CW * .8, 380), 120, CW * .8, CH * .8, { faceUp: false });
        }

        // starter + crib
        if (d.starter) {
          C.draw(c, d.starter, 60, H / 2 - 66, CW, CH, { faceUp: true });
          c.fillStyle = 'rgba(255,255,255,.55)';
          c.font = '600 11px Outfit, sans-serif';
          c.fillText('starter', 60 + CW / 2, H / 2 + 38);
        } else {
          C.slot(c, 60, H / 2 - 66, CW, CH, '?');
        }
        if (d.crib.length) {
          for (i = 0; i < d.crib.length; i++) {
            C.draw(c, d.crib[i], W - 130 + i * 9, H / 2 - 66, CW, CH,
              { faceUp: d.phase === 'show' && d.show && d.show.length === 3 });
          }
          c.fillStyle = 'rgba(255,255,255,.55)';
          c.font = '600 11px Outfit, sans-serif';
          c.fillText((d.dealer === 0 ? 'your' : "rival's") + ' crib', W - 130 + CW / 2, H / 2 + 38);
        }

        // the run of play
        if (d.phase === 'play' || d.phase === 'show') {
          var sq = d.seq.length;
          for (i = 0; i < sq; i++) {
            var sx = W / 2 - (sq * 46) / 2 + i * 46;
            C.draw(c, d.seq[i].card, sx, d.seq[i].who === 0 ? H / 2 - 30 : H / 2 - 70, 54, 76, { faceUp: true });
          }
          c.fillStyle = '#ffd257';
          c.font = '800 26px Outfit, sans-serif';
          c.fillText(String(d.count), W / 2, H / 2 + 78);
          c.fillStyle = 'rgba(255,255,255,.45)';
          c.font = '600 11px Outfit, sans-serif';
          c.fillText('count', W / 2, H / 2 + 94);
        }

        c.fillStyle = '#e6ecff';
        c.font = '700 16px Outfit, sans-serif';
        c.fillText(d.msg, W / 2, H - CH - 92);
        if (d.pegNote) {
          c.fillStyle = 'rgba(255,255,255,.55)';
          c.font = '600 12px Outfit, sans-serif';
          c.fillText(d.pegNote, W / 2, H - CH - 72);
        }

        var list = d.phase === 'discard' ? d.hand : (d.playHand ? d.playHand[0] : d.hand);
        var hy = H - CH - 64;
        for (i = 0; i < list.length; i++) {
          var playableNow = d.phase === 'play' && d.turn === 0 && d.count + cval(list[i]) <= 31;
          C.draw(c, list[i], fanX(i, list.length, CW), hy, CW, CH, {
            faceUp: true,
            selected: d.phase === 'discard' && d.sel.indexOf(i) >= 0,
            hint: playableNow,
            dim: d.phase === 'play' && d.turn === 0 && !playableNow
          });
        }

        buttons(g).forEach(function (b) { drawBtn(c, b); });

        if (d.phase === 'show' && d.show) {
          c.fillStyle = 'rgba(10,7,4,.94)';
          U.roundRect(c, W / 2 - 320, 118, 640, 380, 16); c.fill();
          c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = 1.5; c.stroke();
          c.fillStyle = '#ffd257';
          c.font = '800 24px Outfit, sans-serif';
          c.fillText('The show  ·  starter ' + C.label(d.starter), W / 2, 156);
          var yy = 186;
          d.show.forEach(function (row) {
            c.fillStyle = row.who === 0 ? '#22d3ee' : '#fb7185';
            c.font = '800 15px Outfit, sans-serif';
            c.textAlign = 'left';
            c.fillText(row.label, W / 2 - 290, yy);
            c.fillStyle = '#fff';
            c.textAlign = 'right';
            c.fillText(row.sc.total + ' pts', W / 2 + 290, yy);
            c.textAlign = 'left';
            c.fillStyle = 'rgba(255,255,255,.62)';
            c.font = '600 12px Outfit, sans-serif';
            c.fillText(row.cards.map(function (x) { return C.label(x); }).join('  '), W / 2 - 290, yy + 18);
            c.fillStyle = 'rgba(255,255,255,.45)';
            c.fillText(row.sc.parts.join(' · '), W / 2 - 290, yy + 34);
            yy += 66;
          });
          c.textAlign = 'center';
          c.fillStyle = '#fff';
          c.font = '800 19px Outfit, sans-serif';
          c.fillText('YOU ' + d.pts[0] + '   —   RIVAL ' + d.pts[1], W / 2, 452);
          c.fillStyle = 'rgba(255,255,255,.45)';
          c.font = '600 12px Outfit, sans-serif';
          c.fillText('game to 121  ·  ' + (d.dealer === 0 ? 'rival deals next' : 'you deal next'), W / 2, 476);
        }
      }
    });
  }

  window.Milo.register({
    id: 'cribbage', title: 'Cribbage', emo: '🪵', category: 'Cards',
    tagline: 'Fifteen two, fifteen four, and a pair is six',
    description: 'The whole game on a real board: throw two cards into the crib, cut a ' +
      'starter (a Jack pegs the dealer two for his heels), then play to 31 scoring fifteens, ' +
      'pairs, runs, the go and last card. The show counts non-dealer first, then dealer, then ' +
      'the crib — fifteens, pairs, runs, a four-card flush (five in the crib) and his nobs. ' +
      'The rival picks its crib throw by averaging every possible cut, so it keeps the right ' +
      'four. First peg to 121 wins; under 91 and you have been skunked.',
    controls: ['Click a card', 'Discard'],
    colors: ['#3a2a1c', '#f59e0b'],
    tags: ['cards', 'pegging', 'classic', 'vs cpu'],
    mount: mount
  });
})();
