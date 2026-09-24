/* Draw Dominoes, double-six, four players, first to 100. */
(function () {
  'use strict';

  var NAMES = ['You', 'Rune', 'Pia', 'Ozzy'];
  var TARGET = 100;
  // Pip layout inside a 3x3 grid, for each face value.
  var PIPS = [[], [4], [0, 8], [0, 4, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 2, 3, 5, 6, 8]];

  function fullSet() {
    var out = [];
    for (var a = 0; a <= 6; a++) for (var b = a; b <= 6; b++) out.push([a, b]);
    return out;
  }
  function pipsOf(t) { return t[0] + t[1]; }
  function handPips(h) {
    var n = 0;
    for (var i = 0; i < h.length; i++) n += pipsOf(h[i]);
    return n;
  }
  function isDouble(t) { return t[0] === t[1]; }

  /** Which ends a tile can be attached to. */
  function fits(t, L, R, empty) {
    if (empty) return { left: true, right: true };
    return {
      left: t[0] === L || t[1] === L,
      right: t[0] === R || t[1] === R
    };
  }
  function canPlay(t, L, R, empty) {
    var f = fits(t, L, R, empty);
    return f.left || f.right;
  }

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var lineEl, handEl, rivalEl, statusEl, endBar;

    function elm(tag, css, txt) {
      var e = document.createElement(tag);
      if (css) e.style.cssText = css;
      if (txt != null) e.textContent = txt;
      return e;
    }

    /** One half of a domino face, drawn as pips on a 3x3 grid. */
    function half(v, w) {
      var box = elm('div', 'display:grid;grid-template-columns:repeat(3,1fr);' +
        'grid-template-rows:repeat(3,1fr);gap:1px;padding:3px;width:' + w + 'px;height:' + w + 'px');
      for (var i = 0; i < 9; i++) {
        var on = PIPS[v].indexOf(i) !== -1;
        box.appendChild(elm('div', 'border-radius:50%;background:' + (on ? '#20242e' : 'transparent')));
      }
      return box;
    }

    function tileEl(t, vertical, size) {
      var w = size || 26;
      var box = elm('div', 'display:flex;' + (vertical ? 'flex-direction:column;' : '') +
        'background:#f3efe3;border-radius:5px;box-shadow:0 2px 5px rgba(0,0,0,.4);' +
        'border:1px solid #cdc7b5;overflow:hidden;flex:0 0 auto');
      box.appendChild(half(t[0], w));
      box.appendChild(elm('div', vertical
        ? 'height:1px;background:#cdc7b5;margin:0 4px'
        : 'width:1px;background:#cdc7b5;margin:4px 0'));
      box.appendChild(half(t[1], w));
      return box;
    }

    function backEl(size) {
      var w = size || 18;
      return elm('div', 'width:' + w + 'px;height:' + (w * 2) + 'px;border-radius:4px;' +
        'background:linear-gradient(160deg,#5c4a86,#33285c);border:1px solid #241c40;flex:0 0 auto');
    }

    function button(label, fn) {
      var b = elm('button', 'font:600 .78rem/1 Outfit,system-ui,sans-serif;padding:7px 12px;' +
        'border-radius:8px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.1);' +
        'color:#f1ece0;cursor:pointer', label);
      b.type = 'button';
      b.addEventListener('click', fn);
      return b;
    }

    function build(g) {
      var wrap = elm('div', 'display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;max-width:820px');
      rivalEl = elm('div', 'display:flex;gap:10px;flex-wrap:wrap;justify-content:center');
      lineEl = elm('div', 'display:flex;gap:2px;align-items:center;overflow-x:auto;width:100%;' +
        'min-height:74px;padding:8px;background:rgba(0,0,0,.28);border-radius:10px');
      statusEl = elm('div', 'color:#f2e9d8;font:600 .86rem/1.35 Outfit,system-ui,sans-serif;' +
        'text-align:center;min-height:2.3em;max-width:34em');
      endBar = elm('div', 'display:flex;gap:8px;justify-content:center;min-height:0');
      handEl = elm('div', 'display:flex;gap:6px;flex-wrap:wrap;justify-content:center');
      wrap.appendChild(rivalEl);
      wrap.appendChild(lineEl);
      wrap.appendChild(statusEl);
      wrap.appendChild(endBar);
      wrap.appendChild(handEl);
      g.root.innerHTML = '';
      g.root.appendChild(wrap);
    }

    function reset(g) {
      var d = g.data;
      d.scores = [0, 0, 0, 0];
      d.round = 0;
      d.over = false;
      d.busy = false;
      d.lastWinner = -1;
      build(g);
      startRound(g);
    }

    function startRound(g) {
      var d = g.data;
      d.round++;
      var deck = U.shuffle(fullSet());
      d.hands = [[], [], [], []];
      var i, k;
      for (k = 0; k < 5; k++) for (i = 0; i < 4; i++) d.hands[i].push(deck.pop());
      d.bone = deck;                       // eight tiles in the boneyard
      d.line = [];
      d.passes = 0;
      d.sel = null;
      d.lacks = [{}, {}, {}, {}];          // what each player has shown they lack
      d.roundOver = false;

      if (d.lastWinner >= 0) {
        d.turn = d.lastWinner;
        d.msg = NAMES[d.turn] + ' won the last round and leads with any tile.';
        paint(g);
        nextStep(g);
        return;
      }
      // Opening round: the highest double leads, or the heaviest tile if none.
      var bestP = 0, bestT = -1, bestScore = -1;
      for (i = 0; i < 4; i++) {
        for (k = 0; k < d.hands[i].length; k++) {
          var t = d.hands[i][k];
          var sc = (isDouble(t) ? 1000 : 0) + pipsOf(t);
          if (sc > bestScore) { bestScore = sc; bestP = i; bestT = k; }
        }
      }
      var opener = d.hands[bestP].splice(bestT, 1)[0];
      d.line.push(opener.slice());
      d.turn = (bestP + 1) % 4;
      d.msg = NAMES[bestP] + ' held the ' + (isDouble(opener) ? 'highest double' : 'heaviest tile') +
        ' — the ' + opener[0] + '–' + opener[1] + ' — and opens with it.';
      Milo.sound.blip();
      paint(g);
      nextStep(g);
    }

    function ends(d) {
      if (!d.line.length) return { L: -1, R: -1, empty: true };
      return { L: d.line[0][0], R: d.line[d.line.length - 1][1], empty: false };
    }

    function paint(g) {
      var d = g.data, i;
      var e = ends(d);

      rivalEl.innerHTML = '';
      for (i = 0; i < 4; i++) {
        var pan = elm('div', 'display:flex;flex-direction:column;align-items:center;gap:3px;' +
          'padding:6px 10px;border-radius:9px;min-width:82px;background:' +
          (i === d.turn && !d.over ? 'rgba(255,210,87,.22)' : 'rgba(255,255,255,.07)') +
          ';border:1px solid ' + (i === d.turn && !d.over ? '#ffd257' : 'transparent'));
        pan.appendChild(elm('div', 'font:700 .78rem/1 Outfit,system-ui,sans-serif;color:#f6efdf', NAMES[i]));
        pan.appendChild(elm('div', 'font:600 .7rem/1 Outfit,system-ui,sans-serif;color:#c8bda6',
          d.scores[i] + ' pts  ·  ' + d.hands[i].length + ' tiles'));
        if (i !== 0) {
          var row = elm('div', 'display:flex;gap:2px');
          for (var k = 0; k < d.hands[i].length; k++) row.appendChild(backEl(10));
          pan.appendChild(row);
        }
        rivalEl.appendChild(pan);
      }

      lineEl.innerHTML = '';
      if (!d.line.length) {
        lineEl.appendChild(elm('div', 'color:#b3a894;font:600 .8rem/1 Outfit,system-ui,sans-serif',
          'The table is empty.'));
      }
      for (i = 0; i < d.line.length; i++) {
        lineEl.appendChild(tileEl(d.line[i], isDouble(d.line[i]), isDouble(d.line[i]) ? 20 : 24));
      }

      handEl.innerHTML = '';
      var yourTurn = !d.over && !d.roundOver && d.turn === 0 && !d.busy && g.state === 'play';
      for (i = 0; i < d.hands[0].length; i++) {
        (function (idx) {
          var t = d.hands[0][idx];
          var el2 = tileEl(t, true, 26);
          var playable = yourTurn && canPlay(t, e.L, e.R, e.empty);
          el2.style.cursor = playable ? 'pointer' : 'default';
          el2.style.outline = d.sel === idx ? '3px solid #ffd257' : 'none';
          el2.style.opacity = yourTurn && !playable ? .42 : 1;
          if (playable) el2.style.boxShadow = '0 0 0 2px #4ade80, 0 2px 6px rgba(0,0,0,.4)';
          el2.addEventListener('click', function () { clickTile(g, idx); });
          handEl.appendChild(el2);
        })(i);
      }

      endBar.innerHTML = '';
      if (d.sel !== null && yourTurn) {
        var t2 = d.hands[0][d.sel], f = fits(t2, e.L, e.R, e.empty);
        if (f.left && f.right && !e.empty) {
          endBar.appendChild(button('◀ Play on the ' + e.L, function () { playTile(g, 0, d.sel, 'L'); }));
          endBar.appendChild(button('Play on the ' + e.R + ' ▶', function () { playTile(g, 0, d.sel, 'R'); }));
        }
      }

      var leader = 0;
      for (i = 1; i < 4; i++) if (d.scores[i] > d.scores[leader]) leader = i;
      g.set('Your score', d.scores[0]);
      g.set('Leader', NAMES[leader] + ' ' + d.scores[leader]);
      g.set('Boneyard', d.bone.length);
      statusEl.textContent = d.msg;
      g.score = d.scores[0];
      if (lineEl.scrollWidth > lineEl.clientWidth) lineEl.scrollLeft = lineEl.scrollWidth;
    }

    function clickTile(g, idx) {
      var d = g.data;
      if (g.state !== 'play' || d.over || d.roundOver || d.busy || d.turn !== 0) return;
      var e = ends(d), t = d.hands[0][idx];
      if (!canPlay(t, e.L, e.R, e.empty)) {
        d.msg = 'That tile matches neither end. You need a ' + e.L +
          (e.L === e.R ? '' : ' or a ' + e.R) + '.';
        paint(g);
        return;
      }
      var f = fits(t, e.L, e.R, e.empty);
      if (e.empty || (f.left && !f.right)) { playTile(g, 0, idx, 'L'); return; }
      if (f.right && !f.left) { playTile(g, 0, idx, 'R'); return; }
      d.sel = d.sel === idx ? null : idx;
      d.msg = d.sel === null ? 'Pick a tile.' : 'That tile fits both ends — choose which.';
      Milo.sound.blip();
      paint(g);
    }

    function playTile(g, pl, idx, side) {
      var d = g.data;
      var t = d.hands[pl].splice(idx, 1)[0].slice();
      var e = ends(d);
      if (e.empty) {
        d.line.push(t);
      } else if (side === 'L') {
        if (t[1] !== e.L) { var a = t[0]; t[0] = t[1]; t[1] = a; }
        d.line.unshift(t);
      } else {
        if (t[0] !== e.R) { var b = t[0]; t[0] = t[1]; t[1] = b; }
        d.line.push(t);
      }
      d.passes = 0;
      d.sel = null;
      Milo.sound.tone({ f: pl === 0 ? 430 : 300, f2: 250, d: .07, v: .06, type: 'triangle' });
      var e2 = ends(d);
      d.msg = NAMES[pl] + ' played the ' + t[0] + '–' + t[1] + '. Ends: ' + e2.L + ' and ' + e2.R + '.';

      if (!d.hands[pl].length) { endRound(g, pl, false); return; }
      d.turn = (pl + 1) % 4;
      paint(g);
      nextStep(g);
    }

    /** Nobody may pass while the boneyard still has a tile they could use. */
    function drawUntilPlayable(g, pl) {
      var d = g.data, e = ends(d), drew = 0;
      while (!d.hands[pl].some(function (t) { return canPlay(t, e.L, e.R, e.empty); }) && d.bone.length) {
        d.hands[pl].push(d.bone.pop());
        drew++;
      }
      return drew;
    }

    function nextStep(g) {
      var d = g.data;
      if (d.over || d.roundOver) return;
      var pl = d.turn, e = ends(d), note = '';

      if (!d.hands[pl].some(function (t) { return canPlay(t, e.L, e.R, e.empty); })) {
        var drew = drawUntilPlayable(g, pl);
        e = ends(d);
        var able = d.hands[pl].some(function (t) { return canPlay(t, e.L, e.R, e.empty); });
        if (drew) {
          note = NAMES[pl] + ' drew ' + drew + ' tile' + (drew > 1 ? 's' : '') +
            ' from the boneyard' + (able ? '.' : ' and still cannot go.') + '  ';
          d.msg = note;
          Milo.sound.tone({ f: 200, d: .06, v: .05, type: 'square' });
        }
        if (!able) {
          if (!d.lacks[pl]) d.lacks[pl] = {};
          d.lacks[pl][e.L] = 1; d.lacks[pl][e.R] = 1;
          d.passes++;
          d.msg = NAMES[pl] + ' cannot go and passes.';
          if (d.passes >= 4) { paint(g); endRound(g, -1, true); return; }
          d.turn = (pl + 1) % 4;
          paint(g);
          d.busy = true;
          setTimeout(function () { d.busy = false; nextStep(g); }, 520);
          return;
        }
      }

      if (pl === 0) {
        d.msg = note + 'Your turn — the ends are ' + ends(d).L + ' and ' + ends(d).R + '.';
      }
      paint(g);
      if (pl === 0) return;
      d.busy = true;
      setTimeout(function () { aiPlay(g, pl); }, 620);
    }

    function aiPlay(g, pl) {
      var d = g.data;
      d.busy = false;
      if (g.state !== 'play' || d.over || d.roundOver) return;
      var e = ends(d), opts = [], i;
      for (i = 0; i < d.hands[pl].length; i++) {
        var t = d.hands[pl][i], f = fits(t, e.L, e.R, e.empty);
        if (f.left || e.empty) opts.push({ i: i, side: 'L' });
        if (f.right && !e.empty) opts.push({ i: i, side: 'R' });
      }
      if (!opts.length) { nextStep(g); return; }

      var next = (pl + 1) % 4, best = null;
      for (i = 0; i < opts.length; i++) {
        var o = opts[i], tile = d.hands[pl][o.i];
        var newL = e.empty ? tile[0] : e.L, newR = e.empty ? tile[1] : e.R;
        if (!e.empty) {
          if (o.side === 'L') newL = tile[0] === e.L ? tile[1] : tile[0];
          else newR = tile[0] === e.R ? tile[1] : tile[0];
        }
        var s = pipsOf(tile) * .8;                       // shed weight early
        if (isDouble(tile)) s += 7;                      // doubles are hard to place later
        // Leave the next player stuck if what they lack is showing.
        if (d.lacks[next][newL]) s += 9;
        if (d.lacks[next][newR]) s += 9;
        // Keep ends you can still answer.
        var mine = 0;
        for (var k = 0; k < d.hands[pl].length; k++) {
          if (k === o.i) continue;
          var h = d.hands[pl][k];
          if (h[0] === newL || h[1] === newL || h[0] === newR || h[1] === newR) mine++;
        }
        s += mine * 2.2;
        if (newL === newR) s += 3;                       // both ends alike is easy to answer
        s += Math.random() * 2.5;
        if (!best || s > best.s) best = { s: s, o: o };
      }
      playTile(g, pl, best.o.i, best.o.side);
    }

    function endRound(g, winner, blocked) {
      var d = g.data;
      d.roundOver = true;
      var i, pts = 0, why;
      if (blocked) {
        var low = 0, lowPips = handPips(d.hands[0]), tie = false;
        for (i = 1; i < 4; i++) {
          var hp = handPips(d.hands[i]);
          if (hp < lowPips) { lowPips = hp; low = i; tie = false; }
          else if (hp === lowPips) tie = true;
        }
        if (tie) {
          why = 'The game blocked and the lightest hands tied on ' + lowPips +
            ' pips, so nobody scores.';
          winner = -1;
        } else {
          winner = low;
          for (i = 0; i < 4; i++) if (i !== winner) pts += handPips(d.hands[i]);
          d.scores[winner] += pts;
          why = 'The game blocked. ' + NAMES[winner] + ' had the lightest hand (' + lowPips +
            ' pips) and scores the other three hands: ' + pts + '.';
        }
      } else {
        for (i = 0; i < 4; i++) if (i !== winner) pts += handPips(d.hands[i]);
        d.scores[winner] += pts;
        why = NAMES[winner] + ' played the last tile and scores the ' + pts +
          ' pips left in the other hands.';
      }
      d.lastWinner = winner >= 0 ? winner : d.turn;
      d.msg = why;
      Milo.sound[winner === 0 ? 'coin' : 'blip']();
      paint(g);

      var champ = -1;
      for (i = 0; i < 4; i++) if (d.scores[i] >= TARGET && (champ < 0 || d.scores[i] > d.scores[champ])) champ = i;
      if (champ >= 0) {
        d.over = true;
        var board = NAMES.map(function (n, k) { return n + ' ' + d.scores[k]; }).join(' · ');
        if (champ === 0) {
          g.win({ emo: '🁫', title: 'You reach ' + d.scores[0] + ' and take the match',
            text: why + '  Final: ' + board, score: d.scores[0] * 10 });
        } else {
          g.gameOver({ emo: '🁫', title: NAMES[champ] + ' reaches ' + TARGET + ' first',
            text: why + '  Final: ' + board, score: d.scores[0] * 8 });
        }
        return;
      }
      d.busy = true;
      setTimeout(function () {
        d.busy = false;
        if (g.state === 'play' && !d.over) startRound(g);
      }, 2200);
    }

    return Milo.domGame(host, {
      id: 'dominoes',
      stats: ['Your score', 'Leader', 'Boneyard'],
      bg: '#1d2430',
      emo: '🁫',
      start: {
        title: 'Dominoes',
        text: 'Draw dominoes with a double-six set against three opponents. Match either ' +
          'open end of the line; if you cannot, you draw from the boneyard until you can ' +
          'or it runs dry, and only then do you pass. Go out first and you score every pip ' +
          'left in the other three hands. First to 100 wins the match.',
        keys: ['Click a tile', 'Pick an end']
      },
      init: reset
    });
  }

  window.Milo.register({
    id: 'dominoes', title: 'Dominoes', emo: '🁫', category: 'Strategy',
    tagline: 'Double-six draw dominoes, three rivals, first to 100',
    description: 'The classic draw game with a 28-tile double-six set: five tiles each, ' +
      'eight in the boneyard, and the highest double opens. You must play if you can, and ' +
      'if you cannot you keep drawing until you can or the boneyard empties. Going out ' +
      'scores every pip left in the other three hands; if everyone is stuck the lightest ' +
      'hand takes those pips instead. The three opponents remember which numbers you have ' +
      'passed on and will happily leave both ends showing a suit you have none of, so hold ' +
      'a spare of whatever keeps coming round.',
    controls: ['Click a tile', 'Click an end'],
    colors: ['#f3efe3', '#33285c'],
    tags: ['dominoes', 'tiles', 'vs cpu', 'family', 'strategy'],
    mount: mount
  });
})();
