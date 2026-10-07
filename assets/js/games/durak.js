/* Durak — three-handed Russian attack-and-defend with throw-ins.
   Podkidnoy rules: no passing the attack on, last player holding cards is the fool. */
(function () {
  'use strict';
  var W = 960, H = 640, CW = 60, CH = 84;
  var NAMES = ['You', 'Ivan', 'Olga'];
  var RANKS36 = [5, 6, 7, 8, 9, 10, 11, 12, 0];   // 6 7 8 9 10 J Q K A

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
    function beats(att, def, tr) {
      if (def.s === att.s) return val(def) > val(att);
      return def.s === tr && att.s !== tr;
    }
    function bad(g, why) {
      g.data.msg = why;
      Milo.sound.tone({ f: 150, d: .08, v: .05, type: 'square' });
    }

    /* -------------------------------------------------------------- setup */

    function reset(g) {
      var d = g.data, i, s;
      var deck = [];
      for (s = 0; s < 4; s++) for (i = 0; i < RANKS36.length; i++) deck.push({ r: RANKS36[i], s: s });
      U.shuffle(deck);
      d.hands = [[], [], []];
      for (i = 0; i < 18; i++) d.hands[i % 3].push(deck[i]);
      d.stock = deck.slice(18);
      d.trumpCard = d.stock[0];          // the card lying under the stock
      d.trump = d.trumpCard.s;
      for (i = 0; i < 3; i++) sortHand(d.hands[i], d.trump);
      d.discard = 0;
      d.out = [false, false, false];
      d.place = [0, 0, 0];
      d.placed = 0;
      d.bouts = 0;
      d.log = [];
      d.sel = -1;
      d.think = 0;

      // Lowest trump opens.
      var best = -1, bestV = 99;
      for (i = 0; i < 3; i++) {
        d.hands[i].forEach(function (c) {
          if (c.s === d.trump && val(c) < bestV) { bestV = val(c); best = i; }
        });
      }
      if (best < 0) best = 0;
      startBout(g, best);
      g.score = 0;
      g.set('Your cards', d.hands[0].length);
      g.set('Stock', d.stock.length);
      g.set('Bouts', 0);
    }

    function activeList(g) {
      var d = g.data, out = [];
      for (var i = 0; i < 3; i++) if (!d.out[i]) out.push(i);
      return out;
    }
    function nextActive(g, from) {
      var d = g.data, n = from;
      for (var k = 0; k < 3; k++) {
        n = (n + 1) % 3;
        if (!d.out[n]) return n;
      }
      return from;
    }

    function startBout(g, attacker) {
      var d = g.data;
      d.attacker = attacker;
      d.defender = nextActive(g, attacker);
      d.table = [];
      d.taking = false;
      d.passed = {};
      d.maxAttacks = Math.min(6, d.hands[d.defender].length);
      d.mode = 'attack';
      d.actor = attacker;
      d.bouts++;
      g.set('Bouts', d.bouts);
      setMsg(g);
      if (d.actor !== 0) d.think = 0.8;
    }

    function throwers(g) {
      var d = g.data, out = [], n = d.attacker;
      for (var k = 0; k < 3; k++) {
        if (!d.out[n] && n !== d.defender) out.push(n);
        n = (n + 1) % 3;
      }
      return out;
    }

    function setMsg(g) {
      var d = g.data;
      var role = d.defender === 0 ? 'You are defending against ' + NAMES[d.attacker]
        : d.attacker === 0 ? 'You attack ' + NAMES[d.defender]
          : NAMES[d.attacker] + ' attacks ' + NAMES[d.defender];
      if (d.mode === 'defend') {
        d.msg = d.actor === 0 ? 'Beat the ' + C.label(undefendedCard(g)) + ' or take the pile'
          : NAMES[d.actor] + ' is defending…';
      } else if (d.taking) {
        d.msg = d.actor === 0 ? 'Throw in matching ranks, or press Done'
          : NAMES[d.actor] + ' is piling it on…';
      } else {
        d.msg = d.actor === 0
          ? (d.table.length ? 'Throw in a matching rank, or press Done' : role + ' — play a card')
          : role;
      }
    }

    function undefendedCard(g) {
      var d = g.data;
      for (var i = 0; i < d.table.length; i++) if (!d.table[i].d) return d.table[i].a;
      return null;
    }

    function tableRanks(g) {
      var d = g.data, set = {};
      d.table.forEach(function (p) {
        set[p.a.r] = 1;
        if (p.d) set[p.d.r] = 1;
      });
      return set;
    }

    function canThrow(g, seat, card) {
      var d = g.data;
      if (!d.table.length) return null;
      if (d.table.length >= d.maxAttacks) return 'the attack is full (' + d.maxAttacks + ' cards)';
      if (!d.taking) {
        var undef = 0;
        d.table.forEach(function (p) { if (!p.d) undef++; });
        if (undef) return 'wait for the defender';
      }
      var ranks = tableRanks(g);
      if (!ranks[card.r]) return 'only ranks already on the table can be thrown in';
      return null;
    }
    function countDefended(g) {
      var n = 0;
      g.data.table.forEach(function (p) { if (p.d) n++; });
      return n;
    }

    /* ---------------------------------------------------------- the bout */

    function attackWith(g, seat, card) {
      var d = g.data;
      var h = d.hands[seat];
      h.splice(h.indexOf(card), 1);
      d.table.push({ a: card, d: null, by: seat });
      d.passed = {};
      Milo.sound.tone({ f: 380, f2: 460, d: .06, v: .05, type: 'triangle' });
      d.log.unshift(NAMES[seat] + ' attacks with ' + C.label(card));
      if (d.taking) {
        advanceThrower(g, seat);
      } else {
        d.mode = 'defend';
        d.actor = d.defender;
        if (d.actor !== 0) d.think = 0.8;
      }
      setMsg(g);
    }

    function defendWith(g, card) {
      var d = g.data;
      var pair = null;
      for (var i = 0; i < d.table.length; i++) if (!d.table[i].d) { pair = d.table[i]; break; }
      if (!pair) return;
      var h = d.hands[d.defender];
      h.splice(h.indexOf(card), 1);
      pair.d = card;
      d.passed = {};
      Milo.sound.tone({ f: 520, f2: 620, d: .06, v: .05, type: 'triangle' });
      d.log.unshift(NAMES[d.defender] + ' beats it with ' + C.label(card));
      d.mode = 'attack';
      d.actor = d.attacker;
      if (d.actor !== 0) d.think = 0.75;
      setMsg(g);
    }

    function takePile(g) {
      var d = g.data;
      d.taking = true;
      d.log.unshift(NAMES[d.defender] + ' is taking the pile');
      d.mode = 'attack';
      d.passed = {};
      d.actor = d.attacker;
      if (d.actor !== 0) d.think = 0.7;
      setMsg(g);
    }

    function advanceThrower(g, from) {
      var d = g.data;
      var list = throwers(g);
      if (!list.length) { endBout(g); return; }
      var i = list.indexOf(from);
      for (var k = 1; k <= list.length; k++) {
        var cand = list[(i + k) % list.length];
        if (!d.passed[cand]) { d.actor = cand; if (cand !== 0) d.think = 0.7; setMsg(g); return; }
      }
      endBout(g);
    }

    function passThrow(g, seat) {
      var d = g.data;
      d.passed[seat] = 1;
      var list = throwers(g);
      var all = list.every(function (p) { return d.passed[p]; });
      if (all) { endBout(g); return; }
      advanceThrower(g, seat);
    }

    function endBout(g) {
      var d = g.data, i;
      var defended = !d.taking;
      var pileSize = 0;
      d.table.forEach(function (p) { pileSize += p.d ? 2 : 1; });
      if (d.taking) {
        d.table.forEach(function (p) {
          d.hands[d.defender].push(p.a);
          if (p.d) d.hands[d.defender].push(p.d);
        });
        sortHand(d.hands[d.defender], d.trump);
        d.log.unshift(NAMES[d.defender] + ' picks up ' + pileSize + ' cards');
        Milo.sound.hit();
      } else {
        d.discard += pileSize;
        d.log.unshift(NAMES[d.defender] + ' defended — the pile is burned');
        Milo.sound.click();
      }

      // refill: attacker first, then other throwers, defender last
      var order = throwers(g).concat([d.defender]);
      order.forEach(function (p) {
        while (d.hands[p].length < 6 && d.stock.length) d.hands[p].push(d.stock.pop());
        sortHand(d.hands[p], d.trump);
      });
      d.table = [];
      d.taking = false;
      g.set('Stock', d.stock.length);
      g.set('Your cards', d.hands[0].length);

      checkEmptyHands(g);
      var act = activeList(g);
      if (act.length <= 1) { finish(g); return; }

      var next = defended ? d.defender : nextActive(g, d.defender);
      if (d.out[next]) next = nextActive(g, next);
      startBout(g, next);
    }

    function checkEmptyHands(g) {
      var d = g.data;
      if (d.stock.length) return;
      for (var i = 0; i < 3; i++) {
        if (!d.out[i] && !d.hands[i].length) {
          d.out[i] = true;
          d.placed++;
          d.place[i] = d.placed;
          d.log.unshift(NAMES[i] + ' is out — finished ' + d.placed);
        }
      }
    }

    function finish(g) {
      var d = g.data, i;
      var act = activeList(g);
      var fool = act.length ? act[0] : -1;
      var mine = fool === 0 ? 3 : d.place[0];
      var score = mine === 1 ? 1000 : mine === 2 ? 500 : 100;
      g.score = score;
      var text = fool < 0 ? 'Everybody went out together — a rare clean finish.'
        : NAMES[fool] + ' is left holding cards — ' +
        (fool === 0 ? 'you are the durak.' : 'the fool!');
      (fool === 0 ? g.gameOver : g.win).call(g, {
        emo: fool === 0 ? '🤡' : '🐻',
        title: fool === 0 ? 'You are the fool' : (mine === 1 ? 'Out first!' : 'Safe — not the fool'),
        text: text + '  ' + d.bouts + ' bouts played.',
        score: score
      });
      d.mode = 'over';
    }

    /* ----------------------------------------------------------------- AI */

    function cost(c, tr) { return c.s === tr ? val(c) + 30 : val(c); }

    function aiAct(g, seat) {
      var d = g.data;
      if (d.mode === 'over') return;
      if (d.mode === 'defend' && seat === d.defender) {
        var att = undefendedCard(g);
        var opts = d.hands[seat].filter(function (c) { return beats(att, c, d.trump); });
        if (!opts.length) { takePile(g); return; }
        opts.sort(function (a, b) { return cost(a, d.trump) - cost(b, d.trump); });
        var pick = opts[0];
        var pileSize = d.table.length;
        // Burning a big trump on a tiny pile is a bad trade — take it instead.
        if (cost(pick, d.trump) >= 40 && pileSize <= 1 && d.stock.length > 4 &&
          d.hands[seat].length > 3) {
          takePile(g);
          return;
        }
        defendWith(g, pick);
        return;
      }
      // attacking / throwing in
      var legal = d.hands[seat].filter(function (c) { return !canThrow(g, seat, c); });
      if (!d.table.length) {
        var all = d.hands[seat].slice().sort(function (a, b) {
          return cost(a, d.trump) - cost(b, d.trump);
        });
        attackWith(g, seat, all[0]);
        return;
      }
      if (!legal.length) { passThrow(g, seat); return; }
      legal.sort(function (a, b) { return cost(a, d.trump) - cost(b, d.trump); });
      var cheap = legal[0];
      var defCards = d.hands[d.defender].length;
      var pressing = defCards <= 2 || d.taking;
      if (cost(cheap, d.trump) >= 30 && !pressing) { passThrow(g, seat); return; }
      attackWith(g, seat, cheap);
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
      var d = g.data, out = [];
      if (d.mode === 'over') return out;
      if (d.actor !== 0) return out;
      if (d.mode === 'defend') {
        out.push({ id: 'take', label: 'Take the pile', x: W / 2 - 90, y: H - 46, w: 180, h: 38 });
      } else if (d.table.length) {
        out.push({ id: 'done', label: d.taking ? 'Done throwing' : 'Done (bito)', x: W / 2 - 90, y: H - 46, w: 180, h: 38, primary: true });
      }
      return out;
    }

    return Milo.arcade(host, {
      id: 'durak',
      w: W, h: H, bg: '#1a1224', stats: ['Your cards', 'Stock', 'Bouts'],
      emo: '🐻',
      start: {
        title: 'Durak',
        text: 'Three players, thirty-six cards, and a trump suit peeking out from under the ' +
          'stock. The attacker leads a card, the defender must beat it with a higher card of ' +
          'the same suit or any trump, and both attackers may throw in more cards of ranks ' +
          'already on the table. Beat everything and the pile is burned; take it and you are ' +
          'buried. Whoever is left holding cards at the end is the durak — the fool.',
        keys: ['Click a card', 'Take', 'Done']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data, i;
        if (d.mode === 'over') return;
        var bs = buttons(g);
        for (i = 0; i < bs.length; i++) {
          if (!hitB(bs[i], x, y)) continue;
          if (bs[i].id === 'take') { takePile(g); return; }
          if (bs[i].id === 'done') { passThrow(g, 0); return; }
        }
        if (d.actor !== 0) { return; }

        var n = d.hands[0].length, hy = H - CH - 62;
        for (i = n - 1; i >= 0; i--) {
          var cx = fanX(i, n, CW);
          if (x < cx || x > cx + CW || y < hy || y > hy + CH) continue;
          var card = d.hands[0][i];
          if (d.mode === 'defend') {
            var att = undefendedCard(g);
            if (!beats(att, card, d.trump)) {
              bad(g, 'That will not beat the ' + C.label(att) +
                ' — you need a higher ' + C.SUITS[att.s] +
                (att.s === d.trump ? '' : ' or any ' + C.SUITS[d.trump]));
              return;
            }
            defendWith(g, card);
            return;
          }
          var why = canThrow(g, 0, card);
          if (why) { bad(g, 'No: ' + why); return; }
          attackWith(g, 0, card);
          return;
        }
      },

      update: function (g, dt) {
        var d = g.data;
        if (d.mode === 'over') return;
        if (d.think > 0) {
          d.think -= dt;
          if (d.think <= 0 && d.actor !== 0) aiAct(g, d.actor);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, i;
        var bg = c.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * .75);
        bg.addColorStop(0, '#3b2a55'); bg.addColorStop(1, '#130d1d');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);
        c.textAlign = 'center'; c.textBaseline = 'alphabetic';

        var slots = [null, { x: W * .3, y: 84 }, { x: W * .7, y: 84 }];
        for (i = 1; i < 3; i++) {
          var o = slots[i];
          var role = d.out[i] ? 'out (finished ' + d.place[i] + ')'
            : i === d.attacker ? 'attacking' : i === d.defender ? 'defending' : 'waiting';
          c.fillStyle = d.actor === i ? '#ffd257' : 'rgba(255,255,255,.72)';
          c.font = '800 15px Outfit, sans-serif';
          c.fillText(NAMES[i], o.x, o.y - 26);
          c.fillStyle = i === d.defender ? '#fb7185' : 'rgba(255,255,255,.5)';
          c.font = '600 11px Outfit, sans-serif';
          c.fillText(d.hands[i].length + ' cards  ·  ' + role, o.x, o.y - 10);
          for (var k = 0; k < d.hands[i].length; k++) {
            C.draw(c, d.hands[i][k], o.x - 52 + k * 8, o.y, 42, 58, { faceUp: false });
          }
        }

        // stock with the trump card underneath
        if (d.stock.length) {
          C.draw(c, d.trumpCard, 42, H / 2 + 6, CW, CH, { faceUp: true });
          C.draw(c, d.stock[d.stock.length - 1], 64, H / 2 - 40, CW, CH, { faceUp: false });
        } else {
          C.slot(c, 64, H / 2 - 40, CW, CH, C.SUITS[d.trump]);
        }
        c.fillStyle = 'rgba(255,255,255,.6)';
        c.font = '600 11px Outfit, sans-serif';
        c.fillText('stock ' + d.stock.length, 78, H / 2 + 108);
        c.fillStyle = C.isRed({ s: d.trump }) ? '#ff8fa3' : '#cfe0ff';
        c.font = '700 22px serif';
        c.fillText(C.SUITS[d.trump], 78, H / 2 - 62);
        c.fillStyle = 'rgba(255,255,255,.45)';
        c.font = '600 11px Outfit, sans-serif';
        c.fillText('trump', 78, H / 2 - 46);
        c.fillText('burned ' + d.discard, W - 70, H / 2 - 46);

        // the table
        var tn = d.table.length;
        for (i = 0; i < tn; i++) {
          var tx = W / 2 - (tn * 96) / 2 + i * 96 + 6;
          var ty = H / 2 - 54;
          C.draw(c, d.table[i].a, tx, ty, 62, 86, { faceUp: true });
          if (d.table[i].d) C.draw(c, d.table[i].d, tx + 18, ty + 26, 62, 86, { faceUp: true });
        }
        if (!tn) {
          c.fillStyle = 'rgba(255,255,255,.25)';
          c.font = '600 13px Outfit, sans-serif';
          c.fillText('the table is clear', W / 2, H / 2);
        }

        // log
        c.textAlign = 'right';
        c.font = '600 12px Outfit, sans-serif';
        for (i = 0; i < Math.min(5, d.log.length); i++) {
          c.fillStyle = 'rgba(255,255,255,' + (0.6 - i * 0.1) + ')';
          c.fillText(d.log[i], W - 40, 150 + i * 18);
        }
        c.textAlign = 'center';

        c.fillStyle = '#e6ecff';
        c.font = '700 16px Outfit, sans-serif';
        c.fillText(d.msg || '', W / 2, H - CH - 88);
        c.fillStyle = 'rgba(255,255,255,.5)';
        c.font = '600 12px Outfit, sans-serif';
        c.fillText('Attacker ' + NAMES[d.attacker] + '  ·  defender ' + NAMES[d.defender] +
          '  ·  up to ' + d.maxAttacks + ' cards this bout', W / 2, H - CH - 68);

        var hn = d.hands[0].length, hy = H - CH - 62;
        for (i = 0; i < hn; i++) {
          var card = d.hands[0][i], ok = false;
          if (d.actor === 0 && d.mode === 'defend') {
            var a2 = undefendedCard(g);
            ok = a2 && beats(a2, card, d.trump);
          } else if (d.actor === 0 && d.mode === 'attack') {
            ok = !canThrow(g, 0, card);
          }
          C.draw(c, card, fanX(i, hn, CW), hy, CW, CH, {
            faceUp: true, hint: ok, dim: d.actor === 0 && !ok
          });
        }

        buttons(g).forEach(function (b) { drawBtn(c, b); });
      }
    });
  }

  window.Milo.register({
    id: 'durak', title: 'Durak', emo: '🐻', category: 'Cards',
    tagline: 'Beat it, throw it in, or eat the pile',
    description: 'The Russian classic on a 36-card deck, three handed. The trump card lies ' +
      'face up under the stock and stays visible all game. An attack must be beaten by a ' +
      'higher card of the same suit or by any trump, and while the defence holds, both ' +
      'attackers can throw in extra cards — but only of ranks already lying on the table, ' +
      'and never more than six or more than the defender can cover. Defend everything and ' +
      'the pile is burned; take it and it all goes into your hand. Standard podkidnoy rules ' +
      'with no passing the attack along. The last player still holding cards is the durak.',
    controls: ['Click a card', 'Take', 'Done'],
    colors: ['#3b2a55', '#f472b6'],
    tags: ['cards', 'russian', 'shedding', 'vs cpu'],
    mount: mount
  });
})();
