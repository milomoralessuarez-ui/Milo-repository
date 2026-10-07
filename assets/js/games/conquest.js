/* Conquest — a compact risk-style map: reinforce, attack with the odds on
   screen, fortify once, and take all fourteen territories. */
(function () {
  'use strict';

  var COLS = ['#5aa9ff', '#ff7a59', '#9d7bff'];
  var NAMES = ['You', 'Vex', 'Mora'];

  /* Fourteen territories in four regions, drawn as polygons on a 760x520 map. */
  var TERR = [
    { n: 'Frostmark', c: 0, p: [[40, 40], [200, 34], [214, 150], [120, 176], [42, 150]] },
    { n: 'Pinehold', c: 0, p: [[200, 34], [372, 40], [382, 140], [214, 150]] },
    { n: 'Ironvale', c: 0, p: [[372, 40], [548, 36], [556, 152], [382, 140]] },
    { n: 'Coldspur', c: 0, p: [[548, 36], [716, 44], [712, 168], [556, 152]] },
    { n: 'Greenfen', c: 1, p: [[42, 150], [120, 176], [196, 166], [204, 292], [56, 300]] },
    { n: 'Hallow', c: 1, p: [[196, 166], [382, 140], [376, 284], [204, 292]] },
    { n: 'Tarn', c: 1, p: [[56, 300], [204, 292], [196, 416], [62, 424]] },
    { n: 'Suncleft', c: 2, p: [[382, 140], [556, 152], [548, 286], [376, 284]] },
    { n: 'Dunes', c: 2, p: [[556, 152], [712, 168], [706, 296], [548, 286]] },
    { n: 'Emberport', c: 2, p: [[548, 286], [706, 296], [700, 420], [552, 412]] },
    { n: 'Saltmarsh', c: 2, p: [[376, 284], [548, 286], [552, 412], [380, 404]] },
    { n: 'Redcliff', c: 3, p: [[204, 292], [376, 284], [380, 404], [196, 416]] },
    { n: 'Vale', c: 3, p: [[62, 424], [196, 416], [356, 424], [350, 492], [70, 488]] },
    { n: 'Longbay', c: 3, p: [[356, 424], [552, 412], [700, 420], [694, 492], [350, 492]] }
  ];
  var REGIONS = [
    { n: 'Northreach', bonus: 3, of: [0, 1, 2, 3] },
    { n: 'Westmoor', bonus: 2, of: [4, 5, 6] },
    { n: 'Eastrim', bonus: 3, of: [7, 8, 9, 10] },
    { n: 'Southend', bonus: 2, of: [11, 12, 13] }
  ];
  var LINKS = [
    [0, 1], [0, 4], [1, 2], [1, 5], [1, 4], [2, 3], [2, 5], [2, 7], [3, 7], [3, 8],
    [4, 5], [4, 6], [5, 6], [5, 7], [5, 11], [6, 11], [6, 12],
    [7, 8], [7, 10], [8, 9], [9, 10], [9, 13], [10, 11], [10, 13],
    [11, 12], [11, 13], [12, 13]
  ];
  var ADJ = (function () {
    var a = [], i;
    for (i = 0; i < TERR.length; i++) a.push([]);
    for (i = 0; i < LINKS.length; i++) {
      a[LINKS[i][0]].push(LINKS[i][1]);
      a[LINKS[i][1]].push(LINKS[i][0]);
    }
    return a;
  })();

  function centroid(poly) {
    var x = 0, y = 0, i;
    for (i = 0; i < poly.length; i++) { x += poly[i][0]; y += poly[i][1]; }
    return [x / poly.length, y / poly.length];
  }

  /* --- dice odds, worked out exactly rather than guessed ------------------ */

  /** P(defender loses k) for a single roll of a dice vs d dice. */
  function rollOdds(a, d) {
    var total = Math.pow(6, a + d), out = [0, 0, 0], i;
    var A = [], D = [];
    (function roll(n, arr, then) {
      if (!n) { then(); return; }
      for (var v = 1; v <= 6; v++) { arr.push(v); roll(n - 1, arr, then); arr.pop(); }
    })(a, A, function () {
      (function rollD(n) {
        if (!n) {
          var sa = A.slice().sort(function (p, q) { return q - p; });
          var sd = D.slice().sort(function (p, q) { return q - p; });
          var cmp = Math.min(a, d), lost = 0;
          for (i = 0; i < cmp; i++) if (sa[i] > sd[i]) lost++;
          out[lost]++;
          return;
        }
        for (var v = 1; v <= 6; v++) { D.push(v); rollD(n - 1); D.pop(); }
      })(d);
    });
    return [out[0] / total, out[1] / total, out[2] / total];
  }

  var ODDS = {};
  (function () {
    for (var a = 1; a <= 3; a++) for (var d = 1; d <= 2; d++) ODDS[a + 'v' + d] = rollOdds(a, d);
  })();

  /** Probability the attacker eventually takes the territory. */
  var takeMemo = {};
  function takeChance(att, def) {
    if (def <= 0) return 1;
    if (att <= 1) return 0;
    var key = att + ':' + def;
    if (takeMemo[key] !== undefined) return takeMemo[key];
    var a = Math.min(3, att - 1), d = Math.min(2, def);
    var o = ODDS[a + 'v' + d], cmp = Math.min(a, d), p = 0, k;
    for (k = 0; k <= cmp; k++) {
      var pk = o[k];
      if (!pk) continue;
      p += pk * takeChance(att - (cmp - k), def - k);
    }
    takeMemo[key] = p;
    return p;
  }

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var NS = 'http://www.w3.org/2000/svg';
    var svg, polyEls = [], labelEls = [], statusEl, phaseBar;

    function sv(name, attrs) {
      var e = document.createElementNS(NS, name);
      for (var k in attrs) if (attrs.hasOwnProperty(k)) e.setAttribute(k, attrs[k]);
      return e;
    }
    function elm(tag, css, txt) {
      var e = document.createElement(tag);
      if (css) e.style.cssText = css;
      if (txt != null) e.textContent = txt;
      return e;
    }
    function button(label, fn, primary) {
      var b = elm('button', 'font:600 .8rem/1 Outfit,system-ui,sans-serif;padding:8px 13px;' +
        'border-radius:9px;border:1px solid rgba(255,255,255,.22);cursor:pointer;color:#eef3ff;' +
        'background:' + (primary ? 'rgba(90,169,255,.35)' : 'rgba(255,255,255,.1)'), label);
      b.type = 'button';
      b.addEventListener('click', fn);
      return b;
    }

    function build(g) {
      var wrap = elm('div', 'display:flex;flex-direction:column;align-items:center;gap:8px;width:100%');
      svg = sv('svg', { viewBox: '0 0 760 520' });
      svg.style.cssText = 'width:min(96vw,780px);max-height:58vh;border-radius:10px;' +
        'background:#0d1a2b;box-shadow:0 8px 26px rgba(0,0,0,.45);touch-action:manipulation';

      var i, j;
      for (i = 0; i < LINKS.length; i++) {
        var A = centroid(TERR[LINKS[i][0]].p), B = centroid(TERR[LINKS[i][1]].p);
        svg.appendChild(sv('line', {
          x1: A[0], y1: A[1], x2: B[0], y2: B[1],
          stroke: '#ffffff', 'stroke-width': 1, opacity: .12
        }));
      }
      polyEls = []; labelEls = [];
      for (i = 0; i < TERR.length; i++) {
        var pts = TERR[i].p.map(function (p) { return p[0] + ',' + p[1]; }).join(' ');
        var poly = sv('polygon', { points: pts, fill: '#33465e', stroke: '#0d1a2b', 'stroke-width': 3 });
        poly.style.cursor = 'pointer';
        (function (idx) { poly.addEventListener('click', function () { clickTerr(g, idx); }); })(i);
        svg.appendChild(poly);
        polyEls.push(poly);
      }
      for (i = 0; i < TERR.length; i++) {
        var c = centroid(TERR[i].p);
        var gp = sv('g', {});
        gp.setAttribute('pointer-events', 'none');
        var circ = sv('circle', { cx: c[0], cy: c[1] - 2, r: 15, fill: 'rgba(0,0,0,.5)' });
        var num = sv('text', {
          x: c[0], y: c[1] + 4, 'text-anchor': 'middle', fill: '#fff',
          'font-size': 17, 'font-weight': 700, 'font-family': 'Outfit, sans-serif'
        });
        var nm = sv('text', {
          x: c[0], y: c[1] + 32, 'text-anchor': 'middle', fill: '#dfe8f5',
          'font-size': 12, 'font-weight': 600, 'font-family': 'Outfit, sans-serif'
        });
        nm.textContent = TERR[i].n;
        gp.appendChild(circ); gp.appendChild(num); gp.appendChild(nm);
        svg.appendChild(gp);
        labelEls.push(num);
      }

      statusEl = elm('div', 'color:#e6eefb;font:600 .86rem/1.35 Outfit,system-ui,sans-serif;' +
        'text-align:center;min-height:2.4em;max-width:40em');
      phaseBar = elm('div', 'display:flex;gap:8px;flex-wrap:wrap;justify-content:center');
      wrap.appendChild(svg);
      wrap.appendChild(statusEl);
      wrap.appendChild(phaseBar);
      g.root.innerHTML = '';
      g.root.appendChild(wrap);
    }

    function reset(g) {
      var d = g.data;
      d.own = new Int8Array(TERR.length);
      d.army = new Int8Array(TERR.length);
      var order = U.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]), i;
      for (i = 0; i < order.length; i++) { d.own[order[i]] = i % 3; d.army[order[i]] = 1; }
      // Spread the rest of each starting force over the land they hold.
      for (var pl = 0; pl < 3; pl++) {
        var mine = [];
        for (i = 0; i < TERR.length; i++) if (d.own[i] === pl) mine.push(i);
        var left = 20 - mine.length;
        while (left > 0) { d.army[mine[(Math.random() * mine.length) | 0]]++; left--; }
      }
      d.turnPl = 0;
      d.phase = 'reinforce';
      d.pool = 0;
      d.sel = null;
      d.fortified = false;
      d.over = false;
      d.busy = false;
      d.dead = [false, false, false];
      d.round = 1;
      d.placed = [];
      build(g);
      startReinforce(g);
    }

    function countOf(d, pl) {
      var n = 0;
      for (var i = 0; i < TERR.length; i++) if (d.own[i] === pl) n++;
      return n;
    }
    function armiesOf(d, pl) {
      var n = 0;
      for (var i = 0; i < TERR.length; i++) if (d.own[i] === pl) n += d.army[i];
      return n;
    }

    function income(d, pl) {
      var t = countOf(d, pl);
      if (!t) return 0;
      var n = Math.max(3, Math.floor(t / 3)), r, k, all;
      for (r = 0; r < REGIONS.length; r++) {
        all = true;
        for (k = 0; k < REGIONS[r].of.length; k++) if (d.own[REGIONS[r].of[k]] !== pl) all = false;
        if (all) n += REGIONS[r].bonus;
      }
      return n;
    }

    function regionsHeld(d, pl) {
      var out = [], r, k, all;
      for (r = 0; r < REGIONS.length; r++) {
        all = true;
        for (k = 0; k < REGIONS[r].of.length; k++) if (d.own[REGIONS[r].of[k]] !== pl) all = false;
        if (all) out.push(REGIONS[r].n);
      }
      return out;
    }

    function paint(g) {
      var d = g.data, i;
      for (i = 0; i < TERR.length; i++) {
        var base = COLS[d.own[i]];
        var hot = false;
        if (!d.over && d.turnPl === 0 && !d.busy) {
          if (d.phase === 'reinforce') hot = d.own[i] === 0;
          else if (d.phase === 'attack') {
            hot = d.sel === null ? (d.own[i] === 0 && d.army[i] > 1)
              : (d.own[i] !== 0 && ADJ[d.sel].indexOf(i) !== -1);
          } else if (d.phase === 'fortify') {
            hot = d.sel === null ? (d.own[i] === 0 && d.army[i] > 1)
              : (d.own[i] === 0 && ADJ[d.sel].indexOf(i) !== -1);
          }
        }
        polyEls[i].setAttribute('fill', base);
        polyEls[i].setAttribute('fill-opacity', i === d.sel ? 1 : (hot ? .9 : .6));
        polyEls[i].setAttribute('stroke', i === d.sel ? '#ffd257' : (hot ? '#ffffff' : '#0d1a2b'));
        polyEls[i].setAttribute('stroke-width', i === d.sel ? 4 : (hot ? 3 : 2));
        labelEls[i].textContent = d.army[i];
      }
      g.set('Your land', countOf(d, 0) + '/14');
      g.set('Your armies', armiesOf(d, 0));
      g.set('Phase', d.over ? '—' : (d.turnPl === 0 ? d.phase : NAMES[d.turnPl]));
      g.score = countOf(d, 0) * 40 + armiesOf(d, 0) * 4;
      statusEl.textContent = d.msg;
      buildBar(g);
    }

    function buildBar(g) {
      var d = g.data;
      phaseBar.innerHTML = '';
      if (d.over || d.turnPl !== 0 || d.busy) return;
      if (d.phase === 'reinforce') {
        phaseBar.appendChild(elm('div', 'color:#ffd257;font:700 .84rem/2.2 Outfit,system-ui,sans-serif',
          d.pool + ' to place'));
        if (d.placed.length) phaseBar.appendChild(button('Undo placement', function () { undoPlace(g); }));
        if (d.pool === 0) phaseBar.appendChild(button('Start attacking →', function () { toAttack(g); }, true));
      } else if (d.phase === 'attack') {
        if (d.sel !== null) phaseBar.appendChild(button('Cancel', function () { d.sel = null; d.msg = 'Pick a territory of yours with two or more armies.'; paint(g); }));
        phaseBar.appendChild(button('Done attacking →', function () { toFortify(g); }, true));
      } else if (d.phase === 'fortify') {
        if (d.sel !== null) phaseBar.appendChild(button('Cancel', function () { d.sel = null; d.msg = 'Move armies between two touching territories of yours, once per turn.'; paint(g); }));
        phaseBar.appendChild(button('End turn →', function () { endTurn(g); }, true));
      }
    }

    /* ------------------------------------------------------------- phases */

    function startReinforce(g) {
      var d = g.data;
      if (d.over) return;
      d.phase = 'reinforce';
      d.sel = null;
      d.placed = [];
      d.fortified = false;
      d.pool = income(d, d.turnPl);
      if (d.turnPl === 0) {
        var reg = regionsHeld(d, 0);
        d.msg = 'Round ' + d.round + '. You get ' + d.pool + ' armies — ' +
          Math.max(3, Math.floor(countOf(d, 0) / 3)) + ' for land' +
          (reg.length ? ' plus ' + reg.join(' and ') : '') + '. Click your territories to place them.';
        paint(g);
      } else {
        d.msg = NAMES[d.turnPl] + ' is taking their turn…';
        paint(g);
        d.busy = true;
        setTimeout(function () { aiTurn(g); }, 520);
      }
    }

    function toAttack(g) {
      var d = g.data;
      if (d.pool > 0) return;
      d.phase = 'attack';
      d.sel = null;
      d.msg = 'Attack: click one of your territories with two or more armies, then a neighbour to hit.';
      paint(g);
    }

    function toFortify(g) {
      var d = g.data;
      d.phase = 'fortify';
      d.sel = null;
      d.msg = 'Fortify: move armies once between two touching territories of yours, or end your turn.';
      paint(g);
    }

    function endTurn(g) {
      var d = g.data;
      d.sel = null;
      if (checkOver(g)) return;
      do {
        d.turnPl = (d.turnPl + 1) % 3;
        if (d.turnPl === 0) d.round++;
      } while (countOf(d, d.turnPl) === 0);
      startReinforce(g);
    }

    function checkOver(g) {
      var d = g.data, alive = [], i;
      for (i = 0; i < 3; i++) if (countOf(d, i) > 0) alive.push(i);
      if (alive.length > 1 && countOf(d, 0) > 0) return false;
      d.over = true;
      paint(g);
      var who = countOf(d, 0) > 0 ? 0 : (alive[0] === 0 ? alive[1] : alive[0]);
      if (who === 0 && alive.length === 1) {
        g.win({
          emo: '👑', title: 'The whole map is yours',
          text: 'All fourteen territories taken after ' + d.round + ' rounds.',
          score: 1400 + Math.max(0, 600 - d.round * 25)
        });
      } else {
        g.gameOver({
          emo: '🏴', title: 'You have been driven off the map',
          text: 'Your last territory fell in round ' + d.round + ' and ' + NAMES[who] +
            ' is still standing. Holding a whole region is what pays — the bonus arrives ' +
            'every single turn, so take the smallest one first and keep its borders thick.',
          score: 0
        });
      }
      return true;
    }

    /* ------------------------------------------------------ your own turn */

    function clickTerr(g, i) {
      var d = g.data;
      if (g.state !== 'play' || d.over || d.busy || d.turnPl !== 0) return;

      if (d.phase === 'reinforce') {
        if (d.own[i] !== 0) { d.msg = 'You can only reinforce your own land.'; paint(g); return; }
        if (d.pool <= 0) { d.msg = 'Nothing left to place — start attacking.'; paint(g); return; }
        d.army[i]++; d.pool--;
        d.placed.push(i);
        Milo.sound.tone({ f: 380, f2: 460, d: .06, v: .05, type: 'triangle' });
        d.msg = d.pool ? d.pool + ' armies left to place.' : 'All placed. Now attack, or skip straight to fortifying.';
        paint(g);
        return;
      }

      if (d.phase === 'attack') {
        if (d.sel === null) {
          if (d.own[i] !== 0 || d.army[i] < 2) {
            d.msg = 'Attack from one of your own territories that has at least two armies.';
          } else { d.sel = i; d.msg = 'Now click an enemy neighbour.'; Milo.sound.blip(); }
          paint(g);
          return;
        }
        if (i === d.sel) { d.sel = null; paint(g); return; }
        if (d.own[i] === 0 || ADJ[d.sel].indexOf(i) === -1) {
          d.msg = 'That is not an enemy territory next to ' + TERR[d.sel].n + '.';
          paint(g);
          return;
        }
        confirmAttack(g, d.sel, i);
        return;
      }

      if (d.phase === 'fortify') {
        if (d.fortified) { d.msg = 'You have already fortified this turn.'; paint(g); return; }
        if (d.sel === null) {
          if (d.own[i] !== 0 || d.army[i] < 2) { d.msg = 'Pick one of your territories with a spare army.'; }
          else { d.sel = i; d.msg = 'Now pick a touching territory of yours to move them to.'; Milo.sound.blip(); }
          paint(g);
          return;
        }
        if (i === d.sel) { d.sel = null; paint(g); return; }
        if (d.own[i] !== 0 || ADJ[d.sel].indexOf(i) === -1) {
          d.msg = 'Fortify between two of your own territories that touch.';
          paint(g);
          return;
        }
        var move = d.army[d.sel] - 1;
        d.army[i] += move;
        d.army[d.sel] = 1;
        d.fortified = true;
        d.sel = null;
        Milo.sound.tone({ f: 300, f2: 420, d: .1, v: .06, type: 'triangle' });
        d.msg = 'Moved ' + move + ' armies into ' + TERR[i].n + '. That is your one fortify — end the turn.';
        paint(g);
        return;
      }
    }

    function undoPlace(g) {
      var d = g.data;
      if (!d.placed.length) return;
      var i = d.placed.pop();
      d.army[i]--; d.pool++;
      d.msg = d.pool + ' armies left to place.';
      Milo.sound.blip();
      paint(g);
    }

    /** Show the real numbers, then let the player commit. */
    function confirmAttack(g, from, to) {
      var d = g.data;
      var a = Math.min(3, d.army[from] - 1), df = Math.min(2, d.army[to]);
      var o = ODDS[a + 'v' + df];
      var win = Math.round(takeChance(d.army[from], d.army[to]) * 100);
      var cmp = Math.min(a, df);
      var best = Math.round(o[cmp] * 100);
      d.msg = 'Attack ' + TERR[to].n + ' (' + d.army[to] + ') from ' + TERR[from].n + ' (' +
        d.army[from] + '):  ' + a + ' dice against ' + df + '.  This roll: ' + best + '% to take ' +
        cmp + ' off them, ' + Math.round(o[0] * 100) + '% to lose ' + cmp +
        '.  Overall chance of capturing it: ' + win + '%.';
      paint(g);
      phaseBar.innerHTML = '';
      phaseBar.appendChild(button('⚔ Roll', function () { doAttack(g, from, to); }, true));
      phaseBar.appendChild(button('Back off', function () {
        d.sel = null;
        d.msg = 'Attack called off. Pick another target, or finish attacking.';
        paint(g);
      }));
    }

    function rollBatch(n) {
      var out = [], i;
      for (i = 0; i < n; i++) out.push(U.randInt(1, 6));
      return out.sort(function (p, q) { return q - p; });
    }

    function battle(d, from, to) {
      var a = Math.min(3, d.army[from] - 1), df = Math.min(2, d.army[to]);
      var ar = rollBatch(a), dr = rollBatch(df), cmp = Math.min(a, df), i;
      var lostA = 0, lostD = 0;
      for (i = 0; i < cmp; i++) {
        if (ar[i] > dr[i]) lostD++; else lostA++;      // ties go to the defender
      }
      d.army[from] -= lostA;
      d.army[to] -= lostD;
      return { ar: ar, dr: dr, lostA: lostA, lostD: lostD, dice: a };
    }

    function doAttack(g, from, to) {
      var d = g.data;
      var r = battle(d, from, to);
      Milo.sound.hit();
      var line = 'You rolled ' + r.ar.join(', ') + ' against ' + r.dr.join(', ') + '. ';
      if (d.army[to] <= 0) {
        var moving = Math.min(d.army[from] - 1, Math.max(r.dice, Math.ceil((d.army[from] - 1) / 2)));
        d.own[to] = 0;
        d.army[to] = moving;
        d.army[from] -= moving;
        Milo.sound.coin();
        line += TERR[to].n + ' is yours — ' + moving + ' armies march in, the rest hold the line.';
        d.sel = null;
        if (checkOver(g)) return;
      } else {
        line += 'You lost ' + r.lostA + ', they lost ' + r.lostD + '. ' + TERR[to].n +
          ' still holds ' + d.army[to] + '.';
        if (d.army[from] < 2) { d.sel = null; line += ' ' + TERR[from].n + ' is down to one army and cannot attack again.'; }
      }
      d.msg = line;
      paint(g);
    }

    /* ------------------------------------------------------------- the AI */

    function borderThreat(d, i) {
      var t = 0, k;
      for (k = 0; k < ADJ[i].length; k++) {
        var j = ADJ[i][k];
        if (d.own[j] !== d.own[i]) t += d.army[j];
      }
      return t;
    }

    /** How much a player wants a territory: region progress plus position. */
    function want(d, pl, i) {
      var v = 10, r, k, mine, tot;
      for (r = 0; r < REGIONS.length; r++) {
        if (REGIONS[r].of.indexOf(i) === -1) continue;
        mine = 0; tot = REGIONS[r].of.length;
        for (k = 0; k < tot; k++) if (d.own[REGIONS[r].of[k]] === pl) mine++;
        v += REGIONS[r].bonus * 4 * (mine + 1) / tot;
        if (mine === tot - 1) v += 26;                 // completes the region
      }
      return v;
    }

    function aiTurn(g) {
      var d = g.data;
      d.busy = false;
      if (g.state !== 'play' || d.over) return;
      var pl = d.turnPl, bold = pl === 1 ? .52 : .66;   // Vex gambles, Mora waits
      var i, k, mine = [];
      for (i = 0; i < TERR.length; i++) if (d.own[i] === pl) mine.push(i);
      if (!mine.length) { endTurn(g); return; }

      // Reinforce: everything onto the most useful threatened border.
      var pool = income(d, pl);
      while (pool > 0) {
        var bestI = mine[0], bestV = -1e9;
        for (k = 0; k < mine.length; k++) {
          var i2 = mine[k], th = borderThreat(d, i2);
          if (!th) continue;
          var v = th * 2 - d.army[i2] + want(d, pl, i2) * .4;
          if (v > bestV) { bestV = v; bestI = i2; }
        }
        d.army[bestI]++;
        pool--;
      }

      // Attack while the odds are good enough for this rival's temperament.
      var attacks = 0, took = [];
      for (var guard = 0; guard < 14; guard++) {
        var pick = null;
        for (k = 0; k < mine.length; k++) {
          var f = mine[k];
          if (d.army[f] < 3) continue;
          for (var q = 0; q < ADJ[f].length; q++) {
            var t = ADJ[f][q];
            if (d.own[t] === pl) continue;
            var chance = takeChance(d.army[f], d.army[t]);
            var score = chance * want(d, pl, t) - (1 - chance) * 12;
            if (chance < bold) continue;
            if (!pick || score > pick.score) pick = { f: f, t: t, score: score, chance: chance };
          }
        }
        if (!pick) break;
        // Press the attack until it is won or the stack is spent.
        while (d.army[pick.f] > 1 && d.own[pick.t] !== pl) {
          battle(d, pick.f, pick.t);
          if (d.army[pick.t] <= 0) {
            var moving = Math.min(d.army[pick.f] - 1, Math.max(3, Math.ceil((d.army[pick.f] - 1) / 2)));
            d.own[pick.t] = pl;
            d.army[pick.t] = moving;
            d.army[pick.f] -= moving;
            mine.push(pick.t);
            took.push(TERR[pick.t].n);
            attacks++;
          }
          if (takeChance(d.army[pick.f], d.army[pick.t]) < .28 && d.own[pick.t] !== pl) break;
        }
      }

      // Fortify: pull one idle stack towards the nearest front.
      var fromI = -1, toI = -1, bestGain = 0;
      for (k = 0; k < mine.length; k++) {
        var s = mine[k];
        if (d.army[s] < 3 || borderThreat(d, s) > 0) continue;
        for (var q2 = 0; q2 < ADJ[s].length; q2++) {
          var n2 = ADJ[s][q2];
          if (d.own[n2] !== pl) continue;
          var gain = borderThreat(d, n2);
          if (gain > bestGain) { bestGain = gain; fromI = s; toI = n2; }
        }
      }
      if (fromI >= 0) {
        d.army[toI] += d.army[fromI] - 1;
        d.army[fromI] = 1;
      }

      d.msg = NAMES[pl] + (took.length
        ? ' took ' + took.join(', ') + '.'
        : ' reinforced but did not break through.');
      paint(g);
      if (checkOver(g)) return;
      d.busy = true;
      setTimeout(function () { d.busy = false; endTurn(g); }, 820);
    }

    return Milo.domGame(host, {
      id: 'conquest',
      stats: ['Your land', 'Your armies', 'Phase'],
      bg: '#081422',
      emo: '👑',
      start: {
        title: 'Conquest',
        text: 'Fourteen territories, two rivals, one map. Each turn you get armies for the ' +
          'land you hold plus a bonus for any whole region, then you attack and finally ' +
          'fortify once. Attacks roll up to three dice against two and ties go to the ' +
          'defender — the exact odds are shown before you commit to any roll.',
        keys: ['Click a territory', 'Roll', 'End turn']
      },
      init: reset
    });
  }

  window.Milo.register({
    id: 'conquest', title: 'Conquest', emo: '👑', category: 'Strategy',
    tagline: 'Fourteen territories, two rivals, dice you can see the odds on',
    description: 'A compact risk-style campaign on a hand-drawn map of fourteen ' +
      'territories in four regions. Every turn gives you one army per three territories ' +
      '(minimum three) plus a standing bonus for each whole region you hold, then you ' +
      'attack as often as you dare and fortify one stack at the end. Combat is the classic ' +
      'three dice against two with ties going to the defender, and before you commit the ' +
      'game shows you the real numbers — this roll and the overall chance of taking the ' +
      'territory — computed exactly, not guessed. Vex attacks on anything better than even; ' +
      'Mora waits for two-to-one.',
    controls: ['Click a territory', 'Roll', 'End turn'],
    colors: ['#5aa9ff', '#9d7bff'],
    tags: ['risk', 'map', 'dice', 'vs cpu', 'strategy'],
    mount: mount
  });
})();
