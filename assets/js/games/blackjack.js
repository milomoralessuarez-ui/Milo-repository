/* Blackjack — dealer stands on 17, blackjack pays 3:2, with split and double. */
(function () {
  'use strict';
  var W = 880, H = 580, CW = 82, CH = 116;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util, C = Milo.cards;

    function reset(g) {
      var d = g.data;
      d.chips = 500;
      d.bet = 25;
      d.shoe = C.shuffled(4);
      d.hands = [];
      d.dealer = [];
      d.active = 0;
      d.phase = 'bet';         // bet | play | dealer | done
      d.msg = 'Place your bet';
      d.hidden = true;
      d.best = d.chips;
      g.set('Chips', 500);
      g.set('Bet', 25);
      g.set('Hands', 0);
      d.played = 0;
    }

    function drawCard(d) {
      if (d.shoe.length < 20) d.shoe = C.shuffled(4);
      return d.shoe.pop();
    }

    /** Best total under 21, treating aces as 11 then dropping to 1 as needed. */
    function total(cards) {
      var sum = 0, aces = 0;
      cards.forEach(function (c) {
        var v = C.value(c);
        if (c.r === 0) aces++;
        sum += v;
      });
      while (sum > 21 && aces > 0) { sum -= 10; aces--; }
      return sum;
    }
    function isBlackjack(cards) { return cards.length === 2 && total(cards) === 21; }

    function deal(g) {
      var d = g.data;
      if (d.chips < d.bet) { d.msg = 'Not enough chips — lower your bet'; return; }
      d.chips -= d.bet;
      g.set('Chips', d.chips);
      d.hands = [{ cards: [drawCard(d), drawCard(d)], bet: d.bet, done: false, result: null }];
      d.dealer = [drawCard(d), drawCard(d)];
      d.active = 0;
      d.hidden = true;
      d.phase = 'play';
      d.played++;
      g.set('Hands', d.played);
      Milo.sound.click();

      if (isBlackjack(d.hands[0].cards)) {
        d.hands[0].done = true;
        finishRound(g);
      } else d.msg = 'Hit, stand, double or split';
    }

    function hit(g) {
      var d = g.data;
      if (d.phase !== 'play') return;
      var h = d.hands[d.active];
      h.cards.push(drawCard(d));
      Milo.sound.tone({ f: 400, f2: 320, d: .07, v: .06, type: 'triangle' });
      if (total(h.cards) > 21) { h.done = true; h.result = 'bust'; nextHand(g); }
      else if (total(h.cards) === 21) { h.done = true; nextHand(g); }
    }

    function stand(g) {
      var d = g.data;
      if (d.phase !== 'play') return;
      d.hands[d.active].done = true;
      nextHand(g);
    }

    function double(g) {
      var d = g.data;
      var h = d.hands[d.active];
      if (d.phase !== 'play' || h.cards.length !== 2 || d.chips < h.bet) return;
      d.chips -= h.bet;
      h.bet *= 2;
      g.set('Chips', d.chips);
      h.cards.push(drawCard(d));
      h.done = true;
      if (total(h.cards) > 21) h.result = 'bust';
      Milo.sound.powerup();
      nextHand(g);
    }

    function split(g) {
      var d = g.data;
      var h = d.hands[d.active];
      if (d.phase !== 'play' || h.cards.length !== 2 || d.hands.length >= 3) return;
      if (C.value(h.cards[0]) !== C.value(h.cards[1]) || d.chips < h.bet) return;
      d.chips -= h.bet;
      g.set('Chips', d.chips);
      var moved = h.cards.pop();
      h.cards.push(drawCard(d));
      d.hands.splice(d.active + 1, 0, {
        cards: [moved, drawCard(d)], bet: h.bet, done: false, result: null
      });
      Milo.sound.blip();
    }

    function nextHand(g) {
      var d = g.data;
      while (d.active < d.hands.length && d.hands[d.active].done) d.active++;
      if (d.active >= d.hands.length) finishRound(g);
    }

    function finishRound(g) {
      var d = g.data;
      d.phase = 'dealer';
      d.hidden = false;
      // Dealer draws to 17, standing on all 17s.
      while (total(d.dealer) < 17) d.dealer.push(drawCard(d));
      var dt = total(d.dealer);
      var won = 0;

      d.hands.forEach(function (h) {
        var t = total(h.cards);
        if (t > 21) { h.result = 'bust'; return; }
        if (isBlackjack(h.cards) && !isBlackjack(d.dealer)) {
          h.result = 'blackjack';
          won += Math.floor(h.bet * 2.5);
          return;
        }
        if (dt > 21 || t > dt) { h.result = 'win'; won += h.bet * 2; }
        else if (t === dt) { h.result = 'push'; won += h.bet; }
        else h.result = 'lose';
      });

      d.chips += won;
      g.set('Chips', d.chips);
      d.best = Math.max(d.best, d.chips);
      Milo.store.setBest('blackjack', d.best);
      g.score = d.best;

      var results = d.hands.map(function (h) { return h.result; });
      d.msg = results.indexOf('blackjack') !== -1 ? 'Blackjack! Pays 3:2'
        : results.indexOf('win') !== -1 ? 'You win'
          : results.every(function (r) { return r === 'push'; }) ? 'Push'
            : 'Dealer takes it';
      if (results.indexOf('win') !== -1 || results.indexOf('blackjack') !== -1) Milo.sound.coin();
      else Milo.sound.hit();

      d.phase = 'done';
      if (d.chips < 5) {
        g.gameOver({
          emo: '🎰', title: 'Out of chips',
          text: 'You peaked at ' + U.fmt(d.best) + ' chips over ' + d.played + ' hands.',
          score: d.best
        });
      }
    }

    /* --- buttons -------------------------------------------------------- */
    function buttons(d) {
      var y = H - 56;
      if (d.phase === 'bet' || d.phase === 'done') {
        return [
          { id: 'deal', label: 'Deal', x: W / 2 - 190, y: y, w: 120, primary: true },
          { id: 'less', label: '– Bet', x: W / 2 - 56, y: y, w: 90 },
          { id: 'more', label: '+ Bet', x: W / 2 + 48, y: y, w: 90 },
          { id: 'max', label: 'Max', x: W / 2 + 152, y: y, w: 80 }
        ];
      }
      var h = d.hands[d.active];
      var out = [
        { id: 'hit', label: 'Hit', x: W / 2 - 210, y: y, w: 100, primary: true },
        { id: 'stand', label: 'Stand', x: W / 2 - 100, y: y, w: 100 }
      ];
      if (h && h.cards.length === 2 && d.chips >= h.bet) {
        out.push({ id: 'double', label: 'Double', x: W / 2 + 10, y: y, w: 100 });
        if (C.value(h.cards[0]) === C.value(h.cards[1]) && d.hands.length < 3) {
          out.push({ id: 'split', label: 'Split', x: W / 2 + 120, y: y, w: 100 });
        }
      }
      return out;
    }

    return Milo.arcade(host, {
      id: 'blackjack',
      w: W, h: H, bg: '#0d3320',
      stats: ['Chips', 'Bet', 'Hands'],
      emo: '🎰',
      trackBest: true,
      start: {
        title: 'Blackjack',
        text: 'Get closer to 21 than the dealer without going over. Dealer stands on 17, ' +
          'blackjack pays 3:2, and you can double or split a pair. You start with 500 chips.',
        keys: ['H hit', 'S stand', 'D double', 'Click the buttons']
      },
      init: reset,

      onKey: function (g, e) {
        var d = g.data;
        if (e.code === 'KeyH') hit(g);
        if (e.code === 'KeyS') stand(g);
        if (e.code === 'KeyD') double(g);
        if (e.code === 'Space' && (d.phase === 'bet' || d.phase === 'done')) deal(g);
      },

      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data;
        buttons(d).forEach(function (b) {
          if (x < b.x || x > b.x + b.w || y < b.y || y > b.y + 42) return;
          if (b.id === 'deal') deal(g);
          else if (b.id === 'hit') hit(g);
          else if (b.id === 'stand') stand(g);
          else if (b.id === 'double') double(g);
          else if (b.id === 'split') split(g);
          else if (b.id === 'less') { d.bet = Math.max(5, d.bet - 25); g.set('Bet', d.bet); }
          else if (b.id === 'more') { d.bet = Math.min(d.chips, d.bet + 25); g.set('Bet', d.bet); }
          else if (b.id === 'max') { d.bet = Math.max(5, d.chips); g.set('Bet', d.bet); }
        });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, W * .7);
        bg.addColorStop(0, '#15492c'); bg.addColorStop(1, '#08240f');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        c.strokeStyle = 'rgba(255,255,255,.10)';
        c.lineWidth = 2;
        c.beginPath(); c.arc(W / 2, -70, 300, 0.25, Math.PI - 0.25); c.stroke();

        // dealer
        c.fillStyle = 'rgba(255,255,255,.6)';
        c.font = '700 13px Outfit, sans-serif';
        c.textAlign = 'center';
        var dealerTotal = d.hidden && d.dealer.length
          ? C.value(d.dealer[0]) : total(d.dealer);
        c.fillText('DEALER' + (d.dealer.length ? '  ·  ' + dealerTotal + (d.hidden ? '+' : '') : ''),
          W / 2, 52);
        d.dealer.forEach(function (card, i) {
          var x = W / 2 - (d.dealer.length * (CW + 10) - 10) / 2 + i * (CW + 10);
          C.draw(c, card, x, 66, CW, CH, { faceUp: !(d.hidden && i === 1) });
        });

        // player hands
        var handCount = d.hands.length || 1;
        d.hands.forEach(function (h, hi) {
          var slotW = W / handCount;
          var cx = slotW * hi + slotW / 2;
          var t = total(h.cards);
          var label = isBlackjack(h.cards) ? 'BLACKJACK' : String(t);
          c.fillStyle = hi === d.active && d.phase === 'play' ? '#ffd257' : 'rgba(255,255,255,.6)';
          c.font = '700 13px Outfit, sans-serif';
          c.fillText('YOU · ' + label + '  (' + h.bet + ')', cx, 236);
          h.cards.forEach(function (card, i) {
            var x = cx - (h.cards.length * (CW * .82 + 8) - 8) / 2 + i * (CW * .82 + 8);
            C.draw(c, card, x, 250, CW * .82, CH * .82, { faceUp: true });
          });
          if (h.result) {
            var col = h.result === 'win' || h.result === 'blackjack' ? '#34d399'
              : h.result === 'push' ? '#ffd257' : '#fb7185';
            c.fillStyle = col;
            c.font = '800 16px Outfit, sans-serif';
            c.fillText(h.result.toUpperCase(), cx, 250 + CH * .82 + 22);
          }
        });

        c.fillStyle = '#e6ecff';
        c.font = '700 18px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText(d.msg, W / 2, H - 82);

        buttons(d).forEach(function (b) {
          c.fillStyle = b.primary ? '#22d3ee' : 'rgba(255,255,255,.14)';
          U.roundRect(c, b.x, b.y, b.w, 42, 10); c.fill();
          c.fillStyle = b.primary ? '#062a33' : '#fff';
          c.font = '700 14px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(b.label, b.x + b.w / 2, b.y + 27);
        });
      }
    });
  }

  window.Milo.register({
    id: 'blackjack', title: 'Blackjack', emo: '🎰', category: 'Cards',
    tagline: 'Beat the dealer to 21',
    description: 'Standard casino rules: the dealer draws to 17 and stands, a natural ' +
      'blackjack pays 3 to 2, and you can double down or split a pair. You start with 500 ' +
      'chips and a four-deck shoe — your high-water chip count is what gets recorded.',
    controls: ['H hit', 'S stand', 'D double', 'Click'],
    colors: ['#0d3320', '#ffd257'],
    tags: ['cards', 'casino', 'classic', '21'],
    mount: mount
  });
})();
