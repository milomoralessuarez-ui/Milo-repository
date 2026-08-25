/* Video Poker — Jacks or Better, one draw, standard paytable. */
(function () {
  'use strict';
  var W = 860, H = 560, CW = 116, CH = 164;

  var PAYS = [
    { name: 'Royal Flush', mult: 250 },
    { name: 'Straight Flush', mult: 50 },
    { name: 'Four of a Kind', mult: 25 },
    { name: 'Full House', mult: 9 },
    { name: 'Flush', mult: 6 },
    { name: 'Straight', mult: 4 },
    { name: 'Three of a Kind', mult: 3 },
    { name: 'Two Pair', mult: 2 },
    { name: 'Jacks or Better', mult: 1 }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util, C = Milo.cards;

    function reset(g) {
      var d = g.data;
      d.credits = 200;
      d.bet = 5;
      d.hand = [];
      d.hold = [false, false, false, false, false];
      d.phase = 'bet';                 // bet | draw | done
      d.msg = 'Press Deal to play';
      d.win = null;
      d.best = 200;
      d.rounds = 0;
      g.set('Credits', 200);
      g.set('Bet', 5);
      g.set('Best win', 0);
      d.bestWin = 0;
    }

    function deal(g) {
      var d = g.data;
      if (d.phase === 'draw') return;
      if (d.credits < d.bet) { d.msg = 'Not enough credits'; return; }
      d.credits -= d.bet;
      g.set('Credits', d.credits);
      d.deck = C.shuffled();
      d.hand = [d.deck.pop(), d.deck.pop(), d.deck.pop(), d.deck.pop(), d.deck.pop()];
      d.hold = [false, false, false, false, false];
      d.phase = 'draw';
      d.win = null;
      d.rounds++;
      d.msg = 'Tap the cards you want to keep, then Draw';
      Milo.sound.click();
    }

    function draw(g) {
      var d = g.data;
      if (d.phase !== 'draw') return;
      for (var i = 0; i < 5; i++) {
        if (!d.hold[i]) d.hand[i] = d.deck.pop();
      }
      var r = score(d.hand);
      d.win = r;
      if (r) {
        var pay = r.mult * d.bet;
        d.credits += pay;
        d.bestWin = Math.max(d.bestWin, pay);
        g.set('Best win', d.bestWin);
        d.msg = r.name + ' — ' + pay + ' credits';
        Milo.sound.win();
      } else {
        d.msg = 'No win. Deal again?';
        Milo.sound.hit();
      }
      g.set('Credits', d.credits);
      d.best = Math.max(d.best, d.credits);
      Milo.store.setBest('video-poker', d.best);
      g.score = d.best;
      d.phase = 'done';

      if (d.credits < 1) {
        g.gameOver({
          emo: '🎴', title: 'Out of credits',
          text: 'You peaked at ' + U.fmt(d.best) + ' over ' + d.rounds + ' hands.',
          score: d.best
        });
      }
    }

    /** Standard Jacks-or-Better evaluation. */
    function score(hand) {
      var ranks = hand.map(function (c) { return c.r; }).sort(function (a, b) { return a - b; });
      var suits = hand.map(function (c) { return c.s; });
      var flush = suits.every(function (s) { return s === suits[0]; });

      var counts = {};
      ranks.forEach(function (r) { counts[r] = (counts[r] || 0) + 1; });
      var groups = Object.keys(counts).map(function (k) { return counts[k]; })
        .sort(function (a, b) { return b - a; });

      var straight = ranks.every(function (r, i) { return i === 0 || r === ranks[i - 1] + 1; });
      // Ace can also finish a 10-J-Q-K-A run.
      var royalRun = ranks.join(',') === '0,9,10,11,12';
      if (royalRun) straight = true;

      if (straight && flush && royalRun) return PAYS[0];
      if (straight && flush) return PAYS[1];
      if (groups[0] === 4) return PAYS[2];
      if (groups[0] === 3 && groups[1] === 2) return PAYS[3];
      if (flush) return PAYS[4];
      if (straight) return PAYS[5];
      if (groups[0] === 3) return PAYS[6];
      if (groups[0] === 2 && groups[1] === 2) return PAYS[7];
      if (groups[0] === 2) {
        // Only a pair of Jacks or better pays.
        for (var k in counts) {
          if (counts[k] === 2 && (+k >= 10 || +k === 0)) return PAYS[8];
        }
      }
      return null;
    }

    function cardX(i) { return (W - (5 * (CW + 14) - 14)) / 2 + i * (CW + 14); }
    var CARD_Y = 200;

    function buttons(d) {
      var y = H - 58;
      if (d.phase === 'draw') return [{ id: 'draw', label: 'Draw', x: W / 2 - 70, y: y, w: 140, primary: true }];
      return [
        { id: 'deal', label: 'Deal', x: W / 2 - 150, y: y, w: 130, primary: true },
        { id: 'less', label: '– Bet', x: W / 2 - 6, y: y, w: 70 },
        { id: 'more', label: '+ Bet', x: W / 2 + 74, y: y, w: 70 }
      ];
    }

    return Milo.arcade(host, {
      id: 'video-poker',
      w: W, h: H, bg: '#131a3d',
      stats: ['Credits', 'Bet', 'Best win'],
      emo: '🎴',
      start: {
        title: 'Video Poker',
        text: 'Jacks or Better. You get one draw: keep the cards you want, replace the ' +
          'rest, and get paid for anything from a pair of Jacks upwards.',
        keys: ['1–5 hold a card', 'Space deal / draw']
      },
      init: reset,

      onKey: function (g, e) {
        var d = g.data;
        var m = /^Digit([1-5])$/.exec(e.code);
        if (m && d.phase === 'draw') {
          d.hold[+m[1] - 1] = !d.hold[+m[1] - 1];
          Milo.sound.blip();
        }
        if (e.code === 'Space') { if (d.phase === 'draw') draw(g); else deal(g); }
      },

      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data;

        if (d.phase === 'draw' && y > CARD_Y && y < CARD_Y + CH) {
          for (var i = 0; i < 5; i++) {
            if (x >= cardX(i) && x <= cardX(i) + CW) {
              d.hold[i] = !d.hold[i];
              Milo.sound.blip();
              return;
            }
          }
        }
        buttons(d).forEach(function (b) {
          if (x < b.x || x > b.x + b.w || y < b.y || y > b.y + 42) return;
          if (b.id === 'deal') deal(g);
          else if (b.id === 'draw') draw(g);
          else if (b.id === 'less') { d.bet = Math.max(1, d.bet - 1); g.set('Bet', d.bet); }
          else if (b.id === 'more') { d.bet = Math.min(25, d.bet + 1); g.set('Bet', d.bet); }
        });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#1a2350'); bg.addColorStop(1, '#0b1029');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        // paytable
        c.font = '600 12px Outfit, sans-serif';
        PAYS.forEach(function (p, i) {
          var y = 56 + i * 16;
          var hot = d.win && d.win.name === p.name;
          c.fillStyle = hot ? '#ffd257' : 'rgba(255,255,255,.55)';
          c.textAlign = 'left';
          c.fillText(p.name, 26, y);
          c.textAlign = 'right';
          c.fillText(String(p.mult * d.bet), 250, y);
        });
        c.strokeStyle = 'rgba(255,255,255,.14)';
        c.strokeRect(16, 40, 246, PAYS.length * 16 + 8);

        d.hand.forEach(function (card, i) {
          C.draw(c, card, cardX(i), CARD_Y, CW, CH, {
            faceUp: true, selected: d.hold[i]
          });
          if (d.hold[i]) {
            c.fillStyle = '#ffd257';
            c.font = '800 13px Outfit, sans-serif';
            c.textAlign = 'center';
            c.fillText('HELD', cardX(i) + CW / 2, CARD_Y - 10);
          }
        });

        if (!d.hand.length) {
          c.fillStyle = 'rgba(255,255,255,.3)';
          c.font = '600 16px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText('Press Deal to start a hand', W / 2, CARD_Y + CH / 2);
        }

        c.fillStyle = d.win ? '#ffd257' : '#dfe4ff';
        c.font = '700 18px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText(d.msg, W / 2, H - 84);

        buttons(d).forEach(function (b) {
          c.fillStyle = b.primary ? '#22d3ee' : 'rgba(255,255,255,.14)';
          U.roundRect(c, b.x, b.y, b.w, 42, 10); c.fill();
          c.fillStyle = b.primary ? '#062a33' : '#fff';
          c.font = '700 14px Outfit, sans-serif';
          c.fillText(b.label, b.x + b.w / 2, b.y + 27);
        });
      }
    });
  }

  window.Milo.register({
    id: 'video-poker', title: 'Video Poker', emo: '🎴', category: 'Cards',
    tagline: 'Jacks or Better, one draw',
    description: 'Five cards, one draw. Hold the ones you want and replace the rest, ' +
      'then get paid off the table — anything from a pair of Jacks up to a royal flush at ' +
      '250 times your bet. Raise the bet and every payout scales with it.',
    controls: ['1–5 to hold', 'Space to deal/draw', 'Click'],
    colors: ['#131a3d', '#ffd257'],
    tags: ['cards', 'poker', 'casino', 'gambling'],
    mount: mount
  });
})();
