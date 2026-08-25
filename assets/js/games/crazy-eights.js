/* Crazy Eights — match suit or rank, eights are wild. */
(function () {
  'use strict';
  var W = 900, H = 600, CW = 74, CH = 104;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util, C = Milo.cards;

    function reset(g) {
      var d = g.data;
      var deck = C.shuffled();
      d.you = deck.splice(0, 8);
      d.cpu = deck.splice(0, 8);
      d.stock = deck;
      d.pile = [d.stock.pop()];
      d.suit = d.pile[0].s;
      d.turn = 'you';
      d.msg = 'Match the suit or the rank';
      d.picking = false;
      d.wins = d.wins || 0;
      d.games = d.games || 0;
      d.thinking = 0;
      sortHand(d.you);
      g.set('Your cards', d.you.length);
      g.set('Dealer', d.cpu.length);
      g.set('Won', d.wins);
    }

    function sortHand(h) {
      h.sort(function (a, b) { return a.s - b.s || a.r - b.r; });
    }

    function playable(card, d) {
      return card.r === 7 || card.s === d.suit || card.r === d.pile[d.pile.length - 1].r;
    }

    function handX(i, n) {
      var step = Math.min(CW + 8, (W - 80) / Math.max(1, n));
      return (W - (n - 1) * step - CW) / 2 + i * step;
    }

    function drawFromStock(g, who) {
      var d = g.data;
      if (!d.stock.length) {
        // Recycle everything but the top card.
        var top = d.pile.pop();
        d.stock = U.shuffle(d.pile);
        d.pile = [top];
        if (!d.stock.length) return false;
      }
      (who === 'you' ? d.you : d.cpu).push(d.stock.pop());
      if (who === 'you') sortHand(d.you);
      g.set('Your cards', d.you.length);
      g.set('Dealer', d.cpu.length);
      Milo.sound.click();
      return true;
    }

    function play(g, who, idx, chosenSuit) {
      var d = g.data;
      var hand = who === 'you' ? d.you : d.cpu;
      var card = hand.splice(idx, 1)[0];
      d.pile.push(card);
      d.suit = card.r === 7 ? chosenSuit : card.s;
      g.set('Your cards', d.you.length);
      g.set('Dealer', d.cpu.length);
      Milo.sound.tone({ f: 440, f2: 540, d: .06, v: .06, type: 'triangle' });

      if (!hand.length) {
        d.games++;
        if (who === 'you') {
          d.wins++;
          g.set('Won', d.wins);
          g.win({ emo: '8️⃣', title: 'You went out!', text: 'Games won: ' + d.wins, score: d.wins * 150 });
        } else {
          g.gameOver({ emo: '8️⃣', title: 'Dealer went out', text: 'Games won: ' + d.wins, score: d.wins * 150 });
        }
        return true;
      }
      return false;
    }

    function cpuTurn(g) {
      var d = g.data;
      var options = [];
      d.cpu.forEach(function (card, i) { if (playable(card, d)) options.push(i); });

      if (!options.length) {
        if (drawFromStock(g, 'cpu')) {
          var last = d.cpu.length - 1;
          if (playable(d.cpu[last], d)) options = [last];
        }
      }
      if (!options.length) {
        d.msg = 'Dealer passes';
        d.turn = 'you';
        return;
      }
      // Save eights for when they're needed; otherwise dump the commonest suit.
      var nonEight = options.filter(function (i) { return d.cpu[i].r !== 7; });
      var pick = nonEight.length ? U.choice(nonEight) : options[0];
      var suitCounts = [0, 0, 0, 0];
      d.cpu.forEach(function (card) { suitCounts[card.s]++; });
      var bestSuit = suitCounts.indexOf(Math.max.apply(null, suitCounts));
      if (play(g, 'cpu', pick, bestSuit)) return;
      d.msg = 'Your turn';
      d.turn = 'you';
    }

    return Milo.arcade(host, {
      id: 'crazy-eights',
      w: W, h: H, bg: '#1b2b52',
      stats: ['Your cards', 'Dealer', 'Won'],
      emo: '8️⃣',
      start: {
        title: 'Crazy Eights',
        text: 'Play a card matching the suit or the rank on the pile. Eights are wild — ' +
          'play one and name any suit. First to empty their hand wins.',
        keys: ['Click a card', 'Click the stock to draw']
      },
      preload: function (g) { g.data.wins = 0; g.data.games = 0; },
      init: reset,

      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data;
        if (d.turn !== 'you' || d.thinking > 0) return;

        if (d.picking) {
          for (var s = 0; s < 4; s++) {
            var bx = W / 2 - 140 + s * 72;
            if (x >= bx && x <= bx + 62 && y >= H / 2 - 30 && y <= H / 2 + 32) {
              var idx = d.picking.idx;
              d.picking = false;
              if (play(g, 'you', idx, s)) return;
              d.turn = 'cpu';
              d.thinking = 0.7;
              d.msg = 'Dealer is thinking…';
              return;
            }
          }
          return;
        }

        // stock
        if (x >= 60 && x <= 60 + CW && y >= H / 2 - CH / 2 && y <= H / 2 + CH / 2) {
          if (drawFromStock(g, 'you')) {
            d.msg = 'Drew a card';
            var last = d.you.length - 1;
            if (!d.you.some(function (card) { return playable(card, d); })) {
              d.msg = 'Nothing playable — passing';
              d.turn = 'cpu';
              d.thinking = 0.7;
            }
          }
          return;
        }

        var n = d.you.length;
        for (var i = n - 1; i >= 0; i--) {
          var cx = handX(i, n);
          if (x >= cx && x <= cx + CW && y >= H - CH - 24 && y <= H - 24) {
            if (!playable(d.you[i], d)) {
              d.msg = 'That card does not match';
              Milo.sound.tone({ f: 150, d: .07, v: .05, type: 'square' });
              return;
            }
            if (d.you[i].r === 7) { d.picking = { idx: i }; d.msg = 'Choose a suit'; return; }
            if (play(g, 'you', i, d.you[i].s)) return;
            d.turn = 'cpu';
            d.thinking = 0.7;
            d.msg = 'Dealer is thinking…';
            return;
          }
        }
      },

      update: function (g, dt) {
        var d = g.data;
        if (d.thinking > 0) {
          d.thinking -= dt;
          if (d.thinking <= 0 && d.turn === 'cpu') cpuTurn(g);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#22366a'); bg.addColorStop(1, '#101a34');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        // dealer hand, face down
        var n = d.cpu.length;
        for (var i = 0; i < n; i++) {
          C.draw(c, d.cpu[i], handX(i, n), 26, CW, CH, { faceUp: false });
        }

        if (d.stock.length) C.draw(c, d.stock[d.stock.length - 1], 60, H / 2 - CH / 2, CW, CH, { faceUp: false });
        else C.slot(c, 60, H / 2 - CH / 2, CW, CH, '↻');
        c.fillStyle = 'rgba(255,255,255,.5)';
        c.font = '600 12px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText('Draw (' + d.stock.length + ')', 60 + CW / 2, H / 2 + CH / 2 + 20);

        C.draw(c, d.pile[d.pile.length - 1], W / 2 - CW / 2, H / 2 - CH / 2, CW, CH, { faceUp: true });

        // the suit in force, which an eight can change
        c.fillStyle = C.isRed({ s: d.suit }) ? '#ff8fa3' : '#cfe0ff';
        c.font = '700 30px serif';
        c.fillText(C.SUITS[d.suit], W / 2 + CW / 2 + 40, H / 2 + 10);
        c.fillStyle = 'rgba(255,255,255,.5)';
        c.font = '600 11px Outfit, sans-serif';
        c.fillText('in play', W / 2 + CW / 2 + 40, H / 2 + 28);

        var yn = d.you.length;
        for (var k = 0; k < yn; k++) {
          C.draw(c, d.you[k], handX(k, yn), H - CH - 24, CW, CH, {
            faceUp: true, hint: d.turn === 'you' && playable(d.you[k], d)
          });
        }

        c.fillStyle = '#e6ecff';
        c.font = '700 16px Outfit, sans-serif';
        c.fillText(d.msg, W / 2, H / 2 + CH / 2 + 44);

        if (d.picking) {
          c.fillStyle = 'rgba(6,8,22,.8)';
          U.roundRect(c, W / 2 - 152, H / 2 - 42, 304, 86, 12); c.fill();
          c.fillStyle = '#fff';
          c.font = '700 13px Outfit, sans-serif';
          c.fillText('Name a suit', W / 2, H / 2 - 22);
          for (var s = 0; s < 4; s++) {
            var bx = W / 2 - 140 + s * 72;
            c.fillStyle = 'rgba(255,255,255,.12)';
            U.roundRect(c, bx, H / 2 - 8, 62, 40, 8); c.fill();
            c.fillStyle = (s === 1 || s === 2) ? '#ff8fa3' : '#e8ecff';
            c.font = '700 24px serif';
            c.fillText(C.SUITS[s], bx + 31, H / 2 + 20);
          }
        }
      }
    });
  }

  window.Milo.register({
    id: 'crazy-eights', title: 'Crazy Eights', emo: '8️⃣', category: 'Cards',
    tagline: 'Match the suit or rank, eights are wild',
    description: 'Play a card that matches either the suit or the rank of the top card. ' +
      'Eights are wild: play one and name whatever suit you like. If you cannot go, draw ' +
      'from the stock. First to empty their hand takes the game — and the dealer hangs on ' +
      'to its eights for exactly the moments you would.',
    controls: ['Click a card', 'Click the stock'],
    colors: ['#1b2b52', '#60a5fa'],
    tags: ['cards', 'vs cpu', 'classic', 'family'],
    mount: mount
  });
})();
