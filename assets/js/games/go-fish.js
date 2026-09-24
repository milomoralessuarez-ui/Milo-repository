/* Go Fish — ask for ranks, collect books of four, against opponents that
   remember every question asked at the table. */
(function () {
  'use strict';
  var W = 940, H = 620, CW = 58, CH = 82;
  var NAMES = ['You', 'Ada', 'Bo', 'Cleo'];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util, C = Milo.cards;

    function bad(g, why) {
      g.data.msg = why;
      Milo.sound.tone({ f: 150, d: .08, v: .05, type: 'square' });
    }
    function sortHand(h) { h.sort(function (a, b) { return a.r - b.r || a.s - b.s; }); }

    function reset(g) {
      var d = g.data;
      d.np = d.np || 3;
      d.phase = 'setup';
      d.msg = 'How many players at the table?';
      d.hands = [[], [], [], []];
      d.books = [0, 0, 0, 0];
      d.bookRanks = [[], [], [], []];
      d.stock = [];
      d.log = [];
      d.sel = -1;
      d.turn = 0;
      d.think = 0;
      d.mem = {};
      g.score = 0;
      g.set('Your books', 0); g.set('Cards left', 0); g.set('Books made', 0);
    }

    function deal(g) {
      var d = g.data;
      var deck = C.shuffled();
      var per = d.np <= 3 ? 7 : 5;
      d.hands = [[], [], [], []];
      for (var p = 0; p < d.np; p++) {
        d.hands[p] = deck.splice(0, per);
        sortHand(d.hands[p]);
      }
      d.stock = deck;
      d.books = [0, 0, 0, 0];
      d.bookRanks = [[], [], [], []];
      d.mem = {};
      d.log = [];
      d.turn = 0;
      d.sel = -1;
      d.phase = 'play';
      d.msg = 'Your turn — click a card, then pick who to ask';
      for (p = 0; p < d.np; p++) checkBooks(g, p);
      stats(g);
    }

    function stats(g) {
      var d = g.data;
      g.set('Your books', d.books[0]);
      g.set('Cards left', d.stock.length);
      var tot = 0;
      for (var i = 0; i < d.np; i++) tot += d.books[i];
      g.set('Books made', tot + ' / 13');
    }

    /* ------------------------------------------------------------- memory */

    function note(g, who, rank, has) {
      var d = g.data;
      if (!d.mem[who]) d.mem[who] = {};
      d.mem[who][rank] = has ? 1 : -1;
    }
    function forgetRank(g, rank) {
      var d = g.data;
      for (var p = 0; p < 4; p++) if (d.mem[p]) delete d.mem[p][rank];
    }

    function checkBooks(g, p) {
      var d = g.data, counts = {}, i;
      d.hands[p].forEach(function (c) { counts[c.r] = (counts[c.r] || 0) + 1; });
      var made = false;
      for (var r in counts) {
        if (counts[r] === 4) {
          d.hands[p] = d.hands[p].filter(function (c) { return c.r !== Number(r); });
          d.books[p]++;
          d.bookRanks[p].push(Number(r));
          forgetRank(g, Number(r));
          d.log.unshift(NAMES[p] + ' books the ' + C.RANKS[r] + 's');
          made = true;
        }
      }
      if (made) Milo.sound.coin();
      return made;
    }

    function drawUp(g, p) {
      var d = g.data;
      if (!d.stock.length) return null;
      var c = d.stock.pop();
      d.hands[p].push(c);
      sortHand(d.hands[p]);
      stats(g);
      return c;
    }

    function gameEnded(g) {
      var d = g.data, tot = 0, cards = 0;
      for (var i = 0; i < d.np; i++) { tot += d.books[i]; cards += d.hands[i].length; }
      return tot >= 13 || (!d.stock.length && !cards);
    }

    function finish(g) {
      var d = g.data, i;
      var best = 0;
      for (i = 1; i < d.np; i++) if (d.books[i] > d.books[best]) best = i;
      var tie = [];
      for (i = 0; i < d.np; i++) if (d.books[i] === d.books[best]) tie.push(NAMES[i]);
      var wonIt = d.books[0] === d.books[best];
      var line = [];
      for (i = 0; i < d.np; i++) line.push(NAMES[i] + ' ' + d.books[i]);
      g.score = d.books[0] * 100 + (wonIt ? 250 : 0);
      (wonIt ? g.win : g.gameOver).call(g, {
        emo: wonIt ? '🐟' : '🎣',
        title: wonIt ? (tie.length > 1 ? 'Shared the lead!' : 'Most books — you win!')
          : NAMES[best] + ' takes it',
        text: line.join('   ') + '  ·  books are worth 100 each.',
        score: g.score
      });
    }

    function nextTurn(g, p) {
      var d = g.data;
      if (gameEnded(g)) { finish(g); return; }
      var n = p, guard = 0;
      do {
        n = (n + 1) % d.np;
        guard++;
        if (!d.hands[n].length && !d.stock.length) continue;
        break;
      } while (guard < 8);
      d.turn = n;
      d.sel = -1;
      if (!d.hands[n].length) {
        var c = drawUp(g, n);
        if (c) d.log.unshift(NAMES[n] + ' was out of cards and drew one');
      }
      if (!d.hands[n].length) { nextTurn(g, n); return; }
      if (n === 0) d.msg = 'Your turn — click a card, then pick who to ask';
      else { d.msg = NAMES[n] + ' is thinking…'; d.think = 0.9; }
    }

    /* ---------------------------------------------------------- the asking */

    function ask(g, from, to, rank) {
      var d = g.data;
      d.log.unshift(NAMES[from] + ' asks ' + NAMES[to] + ' for ' + C.RANKS[rank] + 's');
      note(g, from, rank, true);
      var got = d.hands[to].filter(function (c) { return c.r === rank; });
      if (got.length) {
        d.hands[to] = d.hands[to].filter(function (c) { return c.r !== rank; });
        got.forEach(function (c) { d.hands[from].push(c); });
        sortHand(d.hands[from]);
        note(g, to, rank, false);
        d.log.unshift(NAMES[to] + ' hands over ' + got.length + ' × ' + C.RANKS[rank]);
        Milo.sound.blip();
        checkBooks(g, from);
        stats(g);
        if (gameEnded(g)) { finish(g); return; }
        if (!d.hands[from].length) {
          if (!drawUp(g, from)) { nextTurn(g, from); return; }
        }
        d.turn = from;
        d.sel = -1;
        if (from === 0) d.msg = 'A hit! Ask again — click a card';
        else { d.msg = NAMES[from] + ' goes again'; d.think = 0.9; }
        return;
      }
      note(g, to, rank, false);
      d.log.unshift(NAMES[to] + ' says GO FISH');
      Milo.sound.tone({ f: 260, f2: 180, d: .12, v: .06, type: 'sine' });
      var drawn = drawUp(g, from);
      if (drawn) {
        if (from === 0) d.log.unshift('You fish up the ' + C.label(drawn));
        else d.log.unshift(NAMES[from] + ' fishes a card');
        checkBooks(g, from);
        stats(g);
        if (gameEnded(g)) { finish(g); return; }
        if (drawn.r === rank) {
          d.log.unshift(NAMES[from] + ' fished the rank asked for — another go');
          d.turn = from;
          d.sel = -1;
          if (from === 0) d.msg = 'You fished the ' + C.RANKS[rank] + ' you asked for — go again';
          else { d.msg = NAMES[from] + ' goes again'; d.think = 0.9; }
          return;
        }
      } else if (from === 0) d.log.unshift('The pond is empty');
      nextTurn(g, from);
    }

    function aiTurn(g, p) {
      var d = g.data, i;
      var counts = {};
      d.hands[p].forEach(function (c) { counts[c.r] = (counts[c.r] || 0) + 1; });
      var ranks = Object.keys(counts).map(Number);
      if (!ranks.length) { nextTurn(g, p); return; }

      var best = null;
      for (i = 0; i < d.np; i++) {
        if (i === p) continue;
        if (!d.hands[i].length) continue;
        for (var k = 0; k < ranks.length; k++) {
          var r = ranks[k];
          var m = d.mem[i] && d.mem[i][r];
          var sc = (m === 1 ? 100 : m === -1 ? -50 : 8) + counts[r] * 4 + Math.random() * 3;
          if (!best || sc > best.sc) best = { sc: sc, to: i, r: r };
        }
      }
      if (!best) { nextTurn(g, p); return; }
      ask(g, p, best.to, best.r);
    }

    /* ------------------------------------------------------------ drawing */

    function fanX(i, n, w) {
      var step = Math.min(w + 8, (W - 160) / Math.max(1, n));
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
      var d = g.data, out = [], i;
      if (d.phase === 'setup') {
        for (i = 2; i <= 4; i++) {
          out.push({ id: 'np' + i, np: i, label: i + ' players', x: W / 2 - 240 + (i - 2) * 160, y: H / 2 + 20, w: 140, h: 44, primary: d.np === i });
        }
        out.push({ id: 'deal', label: 'Deal', x: W / 2 - 70, y: H / 2 + 90, w: 140, h: 44, primary: true });
        return out;
      }
      if (d.phase === 'play' && d.turn === 0 && d.sel >= 0) {
        var k = 0;
        for (i = 1; i < d.np; i++) {
          out.push({
            id: 'ask' + i, to: i,
            label: 'Ask ' + NAMES[i], x: W / 2 - (d.np - 1) * 90 + k * 180, y: H - 46, w: 170, h: 38, primary: true
          });
          k++;
        }
      }
      return out;
    }

    return Milo.arcade(host, {
      id: 'go-fish',
      w: W, h: H, bg: '#062a3a', stats: ['Your books', 'Cards left', 'Books made'],
      emo: '🐟',
      start: {
        title: 'Go Fish',
        text: 'Ask another player for a rank you already hold. Guess right and they hand over ' +
          'every card of it and you go again; guess wrong and you go fish from the pond. Four ' +
          'of a kind is a book. The opponents listen to every question at the table and will ' +
          'come straight back for the rank you just asked about.',
        keys: ['Click a card', 'Ask a player']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data, i;
        var bs = buttons(g);
        for (i = 0; i < bs.length; i++) {
          if (!hitB(bs[i], x, y)) continue;
          var b = bs[i];
          if (b.np) { d.np = b.np; Milo.sound.click(); return; }
          if (b.id === 'deal') { deal(g); Milo.sound.blip(); return; }
          if (b.to !== undefined) {
            if (d.sel < 0) { bad(g, 'Pick a card from your hand first'); return; }
            if (!d.hands[b.to].length) { bad(g, NAMES[b.to] + ' has no cards to ask for'); return; }
            ask(g, 0, b.to, d.hands[0][d.sel].r);
            return;
          }
        }
        if (d.phase !== 'play') return;

        var n = d.hands[0].length, hy = H - CH - 64;
        for (i = n - 1; i >= 0; i--) {
          var cx = fanX(i, n, CW);
          if (x < cx || x > cx + CW || y < hy || y > hy + CH) continue;
          if (d.turn !== 0) { bad(g, 'Wait — ' + NAMES[d.turn] + ' is asking'); return; }
          d.sel = d.sel === i ? -1 : i;
          if (d.sel >= 0) d.msg = 'Asking for ' + C.RANKS[d.hands[0][i].r] + 's — who has them?';
          else d.msg = 'Your turn — click a card, then pick who to ask';
          Milo.sound.tone({ f: 520, d: .04, v: .04, type: 'triangle' });
          return;
        }
      },

      update: function (g, dt) {
        var d = g.data;
        if (d.phase !== 'play') return;
        if (d.think > 0) {
          d.think -= dt;
          if (d.think <= 0 && d.turn !== 0) aiTurn(g, d.turn);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, i;
        var bg = c.createRadialGradient(W / 2, H * .3, 40, W / 2, H / 2, W * .8);
        bg.addColorStop(0, '#0b5673'); bg.addColorStop(1, '#03202c');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);
        c.textAlign = 'center'; c.textBaseline = 'alphabetic';

        if (d.phase === 'setup') {
          c.fillStyle = '#e6ecff';
          c.font = '800 30px Outfit, sans-serif';
          c.fillText('Go Fish', W / 2, H / 2 - 70);
          c.fillStyle = 'rgba(255,255,255,.65)';
          c.font = '600 14px Outfit, sans-serif';
          c.fillText('Two or three players get seven cards each; four players get five.', W / 2, H / 2 - 36);
          c.fillText('Thirteen books are in the deck — take the most of them.', W / 2, H / 2 - 12);
          buttons(g).forEach(function (b) { drawBtn(c, b); });
          return;
        }

        var slots = [null, { x: W * .2, y: 90 }, { x: W * .5, y: 74 }, { x: W * .8, y: 90 }];
        if (d.np === 2) slots[1] = { x: W * .5, y: 84 };
        if (d.np === 3) { slots[1] = { x: W * .3, y: 84 }; slots[2] = { x: W * .7, y: 84 }; }
        for (i = 1; i < d.np; i++) {
          var o = slots[i];
          c.fillStyle = d.turn === i ? '#ffd257' : 'rgba(255,255,255,.7)';
          c.font = '800 15px Outfit, sans-serif';
          c.fillText(NAMES[i], o.x, o.y - 26);
          c.fillStyle = 'rgba(255,255,255,.5)';
          c.font = '600 11px Outfit, sans-serif';
          c.fillText(d.hands[i].length + ' cards  ·  ' + d.books[i] + ' books', o.x, o.y - 10);
          for (var k = 0; k < d.hands[i].length; k++) {
            C.draw(c, d.hands[i][k], o.x - 50 + k * 7.5, o.y, 42, 58, { faceUp: false });
          }
          c.fillStyle = 'rgba(255,255,255,.55)';
          c.font = '600 12px Outfit, sans-serif';
          if (d.bookRanks[i].length) {
            c.fillText(d.bookRanks[i].map(function (r) { return C.RANKS[r]; }).join(' '), o.x, o.y + 76);
          }
        }

        // the pond
        if (d.stock.length) {
          C.draw(c, d.stock[d.stock.length - 1], 56, H / 2 - 50, CW, CH, { faceUp: false });
        } else C.slot(c, 56, H / 2 - 50, CW, CH, '🐟');
        c.fillStyle = 'rgba(255,255,255,.55)';
        c.font = '600 11px Outfit, sans-serif';
        c.fillText('pond: ' + d.stock.length, 56 + CW / 2, H / 2 + 50);

        // log
        c.textAlign = 'right';
        c.font = '600 12px Outfit, sans-serif';
        for (i = 0; i < Math.min(6, d.log.length); i++) {
          c.fillStyle = 'rgba(255,255,255,' + (0.62 - i * 0.09) + ')';
          c.fillText(d.log[i], W - 40, H / 2 - 54 + i * 19);
        }
        c.textAlign = 'center';

        c.fillStyle = '#e6ecff';
        c.font = '700 16px Outfit, sans-serif';
        c.fillText(d.msg, W / 2, H - CH - 92);
        c.fillStyle = 'rgba(255,255,255,.5)';
        c.font = '600 12px Outfit, sans-serif';
        c.fillText('Your books: ' + (d.bookRanks[0].length
          ? d.bookRanks[0].map(function (r) { return C.RANKS[r]; }).join(' ') : 'none yet'), W / 2, H - CH - 72);

        var hn = d.hands[0].length, hy = H - CH - 64;
        for (i = 0; i < hn; i++) {
          C.draw(c, d.hands[0][i], fanX(i, hn, CW), hy, CW, CH, {
            faceUp: true,
            selected: d.sel === i,
            hint: d.sel >= 0 && d.hands[0][i].r === d.hands[0][d.sel].r && d.sel !== i
          });
        }

        buttons(g).forEach(function (b) { drawBtn(c, b); });
      }
    });
  }

  window.Milo.register({
    id: 'go-fish', title: 'Go Fish', emo: '🐟', category: 'Cards',
    tagline: 'Books of four, and opponents who listen',
    description: 'Two to four players, seven cards each (five with four players). Ask any ' +
      'player for a rank you already hold: a hit means they hand over every card of it and ' +
      'you ask again, a miss sends you fishing — and if you fish up the very rank you asked ' +
      'for, you get another go. Four of a kind makes a book. The opponents track every ' +
      'question and every card handed over, so asking for Queens tells the whole table you ' +
      'have one. Most books when the thirteenth is made wins.',
    controls: ['Click a card', 'Ask a player'],
    colors: ['#0b5673', '#38bdf8'],
    tags: ['cards', 'family', 'memory', 'vs cpu'],
    mount: mount
  });
})();
