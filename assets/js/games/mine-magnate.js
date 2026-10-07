/* Mine Magnate — dispatch carts down a branching mine and keep the drift clear. */
(function () {
  'use strict';

  var CW = 780, CH = 292;
  var TRUNK_Y = 150, HEAD_X = 74, END_X = 752;
  var CLEAR = 34;                 // minimum safe gap between carts on the main drift
  var SHIFT_LEN = 58;
  var FONT = 'Outfit, ui-sans-serif, system-ui, sans-serif';

  /* Six faces off one drift. Ore further in is worth far more but refills
     slowly and costs a long round trip, so late shifts are about routing. */
  var SHAFTS = [
    { n: 'Coal Seam', e: '🪨', d: .08, side: -1, len: 74, val: 2, regen: 1.6, cap: 40, cost: 0, c: '#8b8f9a', glow: '#c9ced9' },
    { n: 'Iron Drift', e: '⛓️', d: .26, side: 1, len: 88, val: 3, regen: 1.5, cap: 38, cost: 0, c: '#b56a3c', glow: '#ef9f63' },
    { n: 'Copper Stope', e: '🟠', d: .44, side: -1, len: 92, val: 5, regen: 1.35, cap: 36, cost: 140, c: '#c9713a', glow: '#ff9d4d' },
    { n: 'Silver Vein', e: '⚪', d: .60, side: 1, len: 80, val: 9, regen: 1.0, cap: 32, cost: 320, c: '#9fb3c8', glow: '#e6f0ff' },
    { n: 'Gold Reef', e: '🟡', d: .78, side: -1, len: 96, val: 15, regen: .74, cap: 28, cost: 640, c: '#d9a520', glow: '#ffe066' },
    { n: 'Gem Pocket', e: '💎', d: .94, side: 1, len: 84, val: 26, regen: .5, cap: 24, cost: 1150, c: '#4fc9d6', glow: '#8df2ff' }
  ];

  var UPG = [
    { id: 'cart', n: 'Another cart', e: '🛒', d: 'one more cart waiting at the portal', base: 150, mult: 1.9, max: 4 },
    { id: 'rail', n: 'Rail grade', e: '🛤️', d: 'carts run 18% faster', base: 120, mult: 1.85, max: 4 },
    { id: 'hoist', n: 'Bigger skip', e: '🪣', d: '+6 tons per cart load', base: 130, mult: 1.9, max: 4 },
    { id: 'drill', n: 'Power drills', e: '🔩', d: 'faces refill 35% faster, loading quicker', base: 170, mult: 1.95, max: 4 },
    { id: 'track', n: 'Passing track', e: '🚦', d: 'double-track the drift one third deeper', base: 200, mult: 2.2, max: 3 }
  ];

  function h(tag, css, html) {
    var n = document.createElement(tag);
    if (css) n.style.cssText = css;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var els = {}, cv, ctx;

    /* ------------------------------------------------------------- state */

    function shaftX(i) { return HEAD_X + (END_X - HEAD_X) * SHAFTS[i].d; }
    function capacity(d) { return 10 + (d.upg.hoist || 0) * 6; }
    function cartSpeed(d) { return 118 * Math.pow(1.18, d.upg.rail || 0); }
    function loadRate(d) { return 3.4 + (d.upg.drill || 0) * 1.9; }
    function regenOf(d, i) { return SHAFTS[i].regen * (1 + (d.upg.drill || 0) * .35) * (1 + d.shift * .05); }
    function safeX(d) { return HEAD_X + (END_X - HEAD_X) * ((d.upg.track || 0) / 3); }
    function costOf(u, owned) { return Math.ceil(u.base * Math.pow(u.mult, owned)); }
    function quotaFor(n) { return Math.round(24 + n * 15 + n * n * 2.4); }

    function reset(g) {
      var d = g.data;
      d.shift = 1;
      d.cash = 0;
      d.gross = 0;
      d.tons = 0;
      d.spilt = 0;
      d.jams = 0;
      d.bonus = 0;
      d.phase = 'shift';
      d.time = SHIFT_LEN;
      d.quota = quotaFor(1);
      d.hauled = 0;
      d.upg = { cart: 0, rail: 0, hoist: 0, drill: 0, track: 0 };
      d.open = [true, true, false, false, false, false];
      d.faces = SHAFTS.map(function (s) { return s.cap * .55; });
      d.busy = [false, false, false, false, false, false];
      d.carts = [newCart(), newCart()];
      d.parts = [];
      d.msg = 'Press 1–6 (or click a face) to send a cart in.';
      d.msgT = 4;
      d.lamp = 0;
      d.uiT = 0;
      build(g);
      refresh(g);
      render(g);
    }

    function newCart() {
      return { phase: 'idle', shaft: -1, x: HEAD_X - 10, y: TRUNK_Y, load: 0, jam: 0 };
    }

    /* --------------------------------------------------------- particles */

    function spark(d, x, y, n, cols, spd, up) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2, v = (spd || 70) * (.35 + Math.random());
        d.parts.push({
          k: 'dot', x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (up || 30),
          g: 210, s: 1.4 + Math.random() * 2.4, c: cols[(Math.random() * cols.length) | 0],
          t: 0, life: .45 + Math.random() * .5
        });
      }
    }
    function dust(d, x, y, n) {
      for (var i = 0; i < n; i++) {
        d.parts.push({
          k: 'dust', x: x + (Math.random() - .5) * 26, y: y + (Math.random() - .5) * 16,
          vx: (Math.random() - .5) * 52, vy: -14 - Math.random() * 28, g: -8,
          s: 5 + Math.random() * 8, t: 0, life: .7 + Math.random() * .7
        });
      }
    }
    function floatText(d, x, y, str, c) {
      d.parts.push({ k: 'txt', x: x, y: y, vx: 0, vy: -40, g: 0, s: 17, c: c, str: str, t: 0, life: 1.15 });
    }

    /* ---------------------------------------------------------- dispatch */

    function idleCart(d) {
      for (var i = 0; i < d.carts.length; i++) if (d.carts[i].phase === 'idle') return d.carts[i];
      return null;
    }

    function say(d, m) { d.msg = m; d.msgT = 2.8; }

    function dispatch(g, i) {
      var d = g.data;
      if (d.phase !== 'shift') return;
      if (!d.open[i]) { say(d, SHAFTS[i].n + ' is still sealed — open it between shifts.'); return; }
      if (d.busy[i]) { say(d, SHAFTS[i].n + ' already has a cart in it.'); return; }
      var c = idleCart(d);
      if (!c) { say(d, 'No cart waiting at the portal.'); return; }
      c.phase = 'out'; c.shaft = i; c.x = HEAD_X - 10; c.y = TRUNK_Y; c.load = 0; c.jam = 0;
      d.busy[i] = true;
      Milo.sound.tone({ f: 300, f2: 420, d: .07, v: .07, type: 'square' });
      refresh(g);
    }

    /* ------------------------------------------------------------ update */

    function update(g, dt) {
      var d = g.data;
      stepParts(d, dt);
      d.lamp += dt;
      if (d.msgT > 0) d.msgT -= dt;

      if (d.phase === 'shift') {
        d.time -= dt;
        for (var i = 0; i < SHAFTS.length; i++) {
          if (!d.open[i]) continue;
          d.faces[i] += regenOf(d, i) * dt;
          if (d.faces[i] > SHAFTS[i].cap) {
            d.spilt += d.faces[i] - SHAFTS[i].cap;
            d.faces[i] = SHAFTS[i].cap;
          }
        }
        moveCarts(g, dt);
        if (d.time <= 0) { d.time = 0; endShift(g); }
      }

      d.uiT += dt;
      if (d.uiT > .12) { d.uiT = 0; refresh(g); }
      if (d.phase !== 'shop') render(g);
    }

    function stepParts(d, dt) {
      for (var i = d.parts.length - 1; i >= 0; i--) {
        var p = d.parts[i];
        p.t += dt;
        if (p.t >= p.life) { d.parts.splice(i, 1); continue; }
        p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      }
    }

    /* Drift traffic: carts queue behind one another going the same way, and
       smash head-on wherever the drift is still single track. */
    function trunkBlock(d, c, dx) {
      var safe = safeX(d);
      for (var i = 0; i < d.carts.length; i++) {
        var o = d.carts[i];
        if (o === c) continue;
        if (o.phase !== 'out' && o.phase !== 'home') continue;
        var gap = o.x - c.x;
        if (dx > 0 ? (gap <= 0 || gap > CLEAR) : (gap >= 0 || gap < -CLEAR)) continue;
        var same = (o.phase === 'out') === (dx > 0);
        if (same) return { stop: true };
        if (c.x > safe && o.x > safe) return { crash: o };
        return { stop: true };     // passing loop: hold a beat, then slip by
      }
      return null;
    }

    function moveCarts(g, dt) {
      var d = g.data, sp = cartSpeed(d);
      for (var i = 0; i < d.carts.length; i++) {
        var c = d.carts[i];
        if (c.jam > 0) { c.jam -= dt; continue; }
        var s = c.shaft >= 0 ? SHAFTS[c.shaft] : null;
        var b;

        if (c.phase === 'out') {
          c.y = TRUNK_Y;
          b = trunkBlock(d, c, 1);
          if (b && b.crash) { crash(g, c, b.crash); continue; }
          if (b && b.stop) continue;
          c.x += sp * dt;
          if (c.x >= shaftX(c.shaft)) { c.x = shaftX(c.shaft); c.phase = 'in'; }
        } else if (c.phase === 'in') {
          c.x = shaftX(c.shaft);
          c.y += s.side * sp * dt;
          if (s.side * (c.y - TRUNK_Y) >= s.len) { c.y = TRUNK_Y + s.side * s.len; c.phase = 'load'; }
        } else if (c.phase === 'load') {
          var want = capacity(d) - c.load;
          var take = Math.min(want, d.faces[c.shaft], loadRate(d) * dt);
          c.load += take; d.faces[c.shaft] -= take;
          if (Math.random() < dt * 16) spark(d, c.x, c.y - 4, 2, [s.glow, '#fff3c4'], 60, 40);
          if (c.load >= capacity(d) - .01 || d.faces[c.shaft] <= .02) {
            c.phase = 'exit';
            if (c.load > .5) Milo.sound.tone({ f: 200, f2: 268, d: .06, v: .05, type: 'triangle' });
          }
        } else if (c.phase === 'exit') {
          c.y -= s.side * sp * dt;
          if (s.side * (c.y - TRUNK_Y) <= 0) { c.y = TRUNK_Y; c.phase = 'home'; }
        } else if (c.phase === 'home') {
          c.y = TRUNK_Y;
          b = trunkBlock(d, c, -1);
          if (b && b.crash) { crash(g, c, b.crash); continue; }
          if (b && b.stop) continue;
          c.x -= sp * dt;
          if (c.x <= HEAD_X - 10) unload(g, c);
        }
      }
    }

    function crash(g, a, b) {
      var d = g.data;
      a.jam = 1.7; b.jam = 1.7;
      d.jams++;
      var lost = (a.load + b.load) * .45;
      a.load *= .55; b.load *= .55;
      d.spilt += lost;
      var mx = (a.x + b.x) / 2;
      dust(d, mx, TRUNK_Y, 16);
      spark(d, mx, TRUNK_Y, 12, ['#ff6b35', '#ffd166'], 140, 10);
      floatText(d, mx, TRUNK_Y - 18, 'JAM!', '#ff6b35');
      Milo.sound.hit();
      say(d, 'Head-on jam — ' + Math.round(lost) + ' tons on the floor. Buy passing track.');
    }

    function unload(g, c) {
      var d = g.data, s = SHAFTS[c.shaft];
      var tons = c.load;
      if (tons > .2) {
        var pay = tons * s.val * (1 + d.shift * .04);
        d.cash += pay; d.gross += pay; d.tons += tons; d.hauled += tons;
        g.score = Math.round(d.gross);
        floatText(d, HEAD_X + 26, TRUNK_Y - 22, '+$' + Math.round(pay), '#ffd166');
        spark(d, HEAD_X, TRUNK_Y, 9, [s.glow, '#ffd166'], 100, 60);
        Milo.sound.coin();
      }
      d.busy[c.shaft] = false;
      c.phase = 'idle'; c.shaft = -1; c.load = 0; c.x = HEAD_X - 10; c.y = TRUNK_Y;
      refresh(g);
    }

    /* ------------------------------------------------------ shift change */

    function endShift(g) {
      var d = g.data, i, c;
      for (i = 0; i < d.carts.length; i++) {
        c = d.carts[i];
        if (c.shaft >= 0) d.busy[c.shaft] = false;
        c.phase = 'idle'; c.shaft = -1; c.load = 0; c.jam = 0; c.x = HEAD_X - 10; c.y = TRUNK_Y;
      }
      if (d.hauled < d.quota) {
        g.gameOver({
          emo: '⛏️',
          title: 'Shift quota missed',
          text: 'Shift ' + d.shift + ' came up ' + Math.ceil(d.quota - d.hauled) + ' tons short. ' +
            Math.round(d.tons) + ' tons hauled across ' + d.shift + ' shifts, ' + Math.round(d.spilt) +
            ' tons spilt, ' + d.jams + ' jams.',
          score: Math.round(d.gross)
        });
        return;
      }
      var bonus = Math.round(d.hauled * 1.6 + d.shift * 45);
      d.cash += bonus; d.gross += bonus;
      g.score = Math.round(d.gross);
      d.phase = 'shop';
      d.bonus = bonus;
      Milo.sound.powerup();
      refresh(g);
    }

    function nextShift(g) {
      var d = g.data;
      d.shift++;
      d.quota = quotaFor(d.shift);
      d.hauled = 0;
      d.time = SHIFT_LEN;
      d.phase = 'shift';
      say(d, 'Shift ' + d.shift + ' — ' + d.quota + ' tons on the board.');
      Milo.sound.blip();
      refresh(g);
      render(g);
    }

    function buy(g, id) {
      var d = g.data, i;
      if (id.indexOf('open:') === 0) {
        i = +id.slice(5);
        if (d.open[i] || d.cash < SHAFTS[i].cost) { Milo.sound.tone({ f: 130, d: .1, v: .05 }); return; }
        d.cash -= SHAFTS[i].cost;
        d.open[i] = true;
        d.faces[i] = SHAFTS[i].cap * .5;
        Milo.sound.powerup();
        refresh(g);
        return;
      }
      for (i = 0; i < UPG.length; i++) {
        if (UPG[i].id !== id) continue;
        var owned = d.upg[id] || 0;
        if (owned >= UPG[i].max) return;
        var cost = costOf(UPG[i], owned);
        if (d.cash < cost) { Milo.sound.tone({ f: 130, d: .1, v: .05 }); return; }
        d.cash -= cost;
        d.upg[id] = owned + 1;
        if (id === 'cart') d.carts.push(newCart());
        Milo.sound.powerup();
        refresh(g);
        return;
      }
    }

    /* -------------------------------------------------------------- view */

    function build(g) {
      var wrap = h('div', 'display:flex;flex-direction:column;gap:7px;width:100%;max-width:860px;' +
        'height:100%;align-self:stretch;font-family:' + FONT + ';color:#efe6d6');

      els.bar = h('div', 'display:flex;gap:8px;align-items:center;justify-content:space-between;' +
        'background:rgba(255,190,90,.07);border:1px solid rgba(255,190,90,.18);border-radius:11px;' +
        'padding:5px 11px;flex:0 0 auto');

      var stageBox = h('div', 'flex:1 1 auto;min-height:0;position:relative;display:flex;' +
        'align-items:center;justify-content:center');

      cv = document.createElement('canvas');
      cv.width = CW; cv.height = CH;
      cv.style.cssText = 'max-width:100%;max-height:100%;width:auto;height:auto;border-radius:12px;' +
        'cursor:pointer;box-shadow:0 14px 34px rgba(0,0,0,.55);border:1px solid rgba(255,190,90,.14)';
      ctx = cv.getContext('2d');
      cv.addEventListener('click', function (e) {
        var r = cv.getBoundingClientRect();
        var x = (e.clientX - r.left) * (CW / r.width);
        var y = (e.clientY - r.top) * (CH / r.height);
        var best = -1, bd = 1e9;
        for (var i = 0; i < SHAFTS.length; i++) {
          var sx = shaftX(i);
          var inSide = (y - TRUNK_Y) * SHAFTS[i].side > -8;
          var dd = Math.abs(x - sx);
          if (inSide && dd < 46 && dd < bd) { bd = dd; best = i; }
        }
        if (best >= 0) dispatch(g, best);
      });

      els.shop = h('div', 'position:absolute;inset:0;overflow-y:auto;display:none;' +
        'flex-direction:column;gap:6px;padding:2px 2px 4px;background:rgba(14,8,4,.94);border-radius:12px');
      els.shop.addEventListener('click', function (e) {
        var b = e.target.closest('[data-buy]');
        if (b) { buy(g, b.getAttribute('data-buy')); return; }
        if (e.target.closest('[data-next]')) nextShift(g);
      });

      stageBox.appendChild(cv);
      stageBox.appendChild(els.shop);

      els.faces = h('div', 'flex:0 0 auto;display:grid;gap:5px;' +
        'grid-template-columns:repeat(auto-fit,minmax(96px,1fr))');
      els.faces.addEventListener('click', function (e) {
        var b = e.target.closest('[data-go]');
        if (b) dispatch(g, +b.getAttribute('data-go'));
      });

      els.msg = h('div', 'flex:0 0 auto;min-height:1.2em;font:600 .74rem/1.2 ' + FONT +
        ';color:#ffca6b;text-align:center');

      wrap.appendChild(els.bar);
      wrap.appendChild(stageBox);
      wrap.appendChild(els.faces);
      wrap.appendChild(els.msg);
      g.root.innerHTML = '';
      g.root.appendChild(wrap);
    }

    function pill(label, val, col) {
      return '<div style="text-align:center;min-width:52px"><div style="font:700 .52rem/1 ' + FONT +
        ';letter-spacing:.09em;text-transform:uppercase;color:#a89982">' + label + '</div>' +
        '<div style="font:800 .92rem/1.25 ' + FONT + ';color:' + col + '">' + val + '</div></div>';
    }

    function refresh(g) {
      var d = g.data;
      g.set('Cash', '$' + U.fmt(Math.round(d.cash)));
      g.set('Shift', d.shift);
      g.set('Quota', Math.round(d.hauled) + '/' + d.quota);
      g.set('Carts', d.carts.length);

      var frac = U.clamp(d.hauled / d.quota, 0, 1);
      var idle = 0;
      for (var q = 0; q < d.carts.length; q++) if (d.carts[q].phase === 'idle') idle++;
      els.bar.innerHTML =
        pill('Shift', d.shift, '#ffd166') +
        pill('Quota', Math.round(d.hauled) + '/' + d.quota + 't', frac >= 1 ? '#7ddf64' : '#ffb454') +
        '<div style="flex:1;min-width:60px;height:8px;border-radius:6px;background:rgba(0,0,0,.45);overflow:hidden">' +
        '<div style="height:100%;width:' + (frac * 100) + '%;background:linear-gradient(90deg,#ffb454,#7ddf64)"></div></div>' +
        pill('Idle carts', idle + '/' + d.carts.length, idle ? '#8df2ff' : '#8a7f70') +
        pill('Clock', d.phase === 'shop' ? '—' : U.time(Math.ceil(d.time)),
          d.phase === 'shift' && d.time < 12 ? '#ff6b6b' : '#e9e2d4');

      faceHtml(g);
      if (d.phase === 'shop') {
        els.shop.style.display = 'flex';
        shopHtml(g);
      } else {
        els.shop.style.display = 'none';
      }
      els.msg.textContent = d.msgT > 0 ? d.msg : '';
    }

    function faceHtml(g) {
      var d = g.data, out = [];
      for (var i = 0; i < SHAFTS.length; i++) {
        var s = SHAFTS[i], open = d.open[i];
        var ore = d.faces[i], f = U.clamp(ore / s.cap, 0, 1);
        var state = !open ? 'sealed $' + s.cost : d.busy[i] ? 'cart inside' :
          f > .96 ? 'SPILLING' : Math.round(ore) + 't ready';
        var col = !open ? '#6d6357' : d.busy[i] ? '#6ea8ff' : f > .96 ? '#ff7b54' : s.glow;
        out.push('<button type="button" ' + (open ? 'data-go="' + i + '"' : '') + ' style="' +
          'display:flex;align-items:center;gap:6px;text-align:left;padding:4px 7px;border-radius:9px;' +
          'font:inherit;color:#efe6d6;cursor:' + (open ? 'pointer' : 'default') + ';' +
          'border:1px solid ' + (open && !d.busy[i] ? 'rgba(255,190,90,.34)' : 'rgba(255,255,255,.08)') + ';' +
          'background:' + (open ? 'linear-gradient(90deg,rgba(255,180,84,.13),rgba(0,0,0,0))' : 'rgba(255,255,255,.03)') + ';' +
          'opacity:' + (open ? 1 : .55) + '">' +
          '<span style="font-size:14px;width:18px;text-align:center">' + (open ? s.e : '🔒') + '</span>' +
          '<span style="flex:1;min-width:0">' +
          '<span style="display:block;font:800 .68rem/1.2 ' + FONT + ';white-space:nowrap;overflow:hidden;' +
          'text-overflow:ellipsis">' + (i + 1) + '. ' + s.n + ' <span style="color:#ffd166">$' + s.val + '</span></span>' +
          '<span style="display:block;font:700 .58rem/1.35 ' + FONT + ';color:' + col + '">' + state + '</span>' +
          '<span style="display:block;height:3px;border-radius:2px;background:rgba(0,0,0,.45);overflow:hidden">' +
          '<span style="display:block;height:100%;width:' + (f * 100) + '%;background:' + s.c + '"></span></span>' +
          '</span></button>');
      }
      els.faces.innerHTML = out.join('');
    }

    function shopHtml(g) {
      var d = g.data, out = [];
      out.push('<div style="font:800 .92rem/1.3 ' + FONT + ';color:#7ddf64;text-align:center;padding-top:4px">' +
        'Shift ' + d.shift + ' cleared · bonus $' + U.fmt(d.bonus) + ' · cash $' + U.fmt(Math.round(d.cash)) + '</div>');
      var i, u, cost, can;
      for (i = 0; i < UPG.length; i++) {
        u = UPG[i];
        var owned = d.upg[u.id] || 0;
        if (owned >= u.max) continue;
        cost = costOf(u, owned);
        can = d.cash >= cost;
        out.push(shopRow(u.e, u.n + (owned ? ' ×' + owned : ''), u.d, cost, can, 'data-buy="' + u.id + '"'));
      }
      for (i = 0; i < SHAFTS.length; i++) {
        if (d.open[i]) continue;
        can = d.cash >= SHAFTS[i].cost;
        out.push(shopRow(SHAFTS[i].e, 'Open ' + SHAFTS[i].n, '$' + SHAFTS[i].val + ' a ton, ' +
          Math.round(SHAFTS[i].d * 100) + '% along the drift', SHAFTS[i].cost, can, 'data-buy="open:' + i + '"'));
      }
      out.push('<button type="button" data-next="1" style="margin-top:4px;padding:10px;border-radius:11px;' +
        'border:0;cursor:pointer;font:800 .88rem ' + FONT + ';color:#241503;' +
        'background:linear-gradient(90deg,#ffd166,#ffb454)">Start shift ' + (d.shift + 1) +
        ' — ' + quotaFor(d.shift + 1) + ' tons</button>');
      els.shop.innerHTML = out.join('');
    }

    function shopRow(emo, name, desc, cost, can, attr) {
      return '<button type="button" ' + attr + ' style="display:flex;align-items:center;gap:8px;' +
        'text-align:left;padding:6px 9px;border-radius:10px;font:inherit;color:#efe6d6;' +
        'cursor:' + (can ? 'pointer' : 'default') + ';opacity:' + (can ? 1 : .55) + ';' +
        'border:1px solid ' + (can ? 'rgba(125,223,100,.42)' : 'rgba(255,255,255,.08)') + ';' +
        'background:' + (can ? 'rgba(125,223,100,.09)' : 'rgba(255,255,255,.03)') + '">' +
        '<span style="font-size:16px;width:20px;text-align:center">' + emo + '</span>' +
        '<span style="flex:1;min-width:0"><span style="font:800 .76rem/1.2 ' + FONT + '">' + name + '</span>' +
        '<span style="display:block;font:600 .62rem/1.3 ' + FONT + ';color:#a89982">' + desc + '</span></span>' +
        '<span style="font:800 .76rem/1 ' + FONT + ';color:' + (can ? '#7ddf64' : '#8a7f70') + '">$' +
        (cost | 0) + '</span></button>';
    }

    /* -------------------------------------------------------------- draw */

    function render(g) {
      var d = g.data;
      var rock = ctx.createLinearGradient(0, 0, 0, CH);
      rock.addColorStop(0, '#2b1c10');
      rock.addColorStop(.5, '#1d1209');
      rock.addColorStop(1, '#120a05');
      ctx.fillStyle = rock;
      ctx.fillRect(0, 0, CW, CH);

      for (var b = 0; b < 10; b++) {
        ctx.fillStyle = b % 2 ? 'rgba(255,220,180,.022)' : 'rgba(0,0,0,.13)';
        ctx.fillRect(0, b * 30, CW, 30);
      }
      ctx.fillStyle = 'rgba(255,225,190,.07)';
      for (var s2 = 0; s2 < 170; s2++) {
        ctx.fillRect((U.hash2(s2, 3, 7) * CW) | 0, (U.hash2(s2, 11, 9) * CH) | 0, 2, 2);
      }

      drawPortal(d);
      drawTrunk(d);
      for (var i = 0; i < SHAFTS.length; i++) drawBranch(d, i);
      for (i = 0; i < d.carts.length; i++) drawCart(d, d.carts[i]);
      drawParts(d);
    }

    function drawPortal(d) {
      // hillside face and the portal the carts run out of
      ctx.fillStyle = '#0d1522';
      ctx.fillRect(0, 0, HEAD_X - 22, CH);
      var sky = ctx.createLinearGradient(0, 0, 0, CH);
      sky.addColorStop(0, '#1a2942'); sky.addColorStop(1, '#0a0f18');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, HEAD_X - 22, CH);
      ctx.fillStyle = 'rgba(200,220,255,.45)';
      for (var i = 0; i < 16; i++) {
        ctx.fillRect((U.hash2(i, 5, 2) * (HEAD_X - 26)) | 0, (U.hash2(i, 9, 4) * 110) | 0, 1.6, 1.6);
      }
      // rocky lip
      ctx.fillStyle = '#2d1d10';
      ctx.beginPath();
      ctx.moveTo(HEAD_X - 22, 0);
      for (var y = 0; y <= CH; y += 24) {
        ctx.lineTo(HEAD_X - 22 + Math.sin(y * .09) * 7, y);
      }
      ctx.lineTo(HEAD_X + 6, CH); ctx.lineTo(HEAD_X + 6, 0);
      ctx.closePath(); ctx.fill();

      // portal arch
      ctx.fillStyle = '#100a06';
      ctx.fillRect(HEAD_X - 30, TRUNK_Y - 27, 42, 54);
      ctx.strokeStyle = '#c4903f'; ctx.lineWidth = 3;
      ctx.strokeRect(HEAD_X - 30, TRUNK_Y - 27, 42, 54);
      var pg = ctx.createRadialGradient(HEAD_X - 9, TRUNK_Y, 2, HEAD_X - 9, TRUNK_Y, 44);
      pg.addColorStop(0, 'rgba(255,196,92,.30)');
      pg.addColorStop(1, 'rgba(255,196,92,0)');
      ctx.fillStyle = pg;
      ctx.beginPath(); ctx.arc(HEAD_X - 9, TRUNK_Y, 44, 0, Math.PI * 2); ctx.fill();

      // ore stockpile grows with the shift
      var pile = U.clamp(d.hauled / Math.max(1, d.quota), 0, 1.2);
      ctx.fillStyle = '#5a4622';
      ctx.beginPath();
      ctx.moveTo(6, CH - 6);
      ctx.lineTo(24, CH - 14 - pile * 40);
      ctx.lineTo(44, CH - 6);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd166';
      ctx.font = '700 11px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText(Math.round(d.hauled) + 't', 25, CH - 20 - pile * 40);
      ctx.textAlign = 'left';

      // idle carts parked outside
      var idle = 0, c;
      for (c = 0; c < d.carts.length; c++) if (d.carts[c].phase === 'idle') idle++;
      for (var k = 0; k < idle; k++) {
        var x = HEAD_X - 44 - (k % 3) * 22, yy = TRUNK_Y + 34 + Math.floor(k / 3) * 20;
        ctx.fillStyle = '#7d5a2e'; ctx.fillRect(x - 8, yy - 6, 16, 10);
        ctx.fillStyle = '#c7963f'; ctx.fillRect(x - 8, yy - 6, 16, 3);
        ctx.fillStyle = '#1b1610';
        ctx.beginPath(); ctx.arc(x - 4, yy + 5, 2.6, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 4, yy + 5, 2.6, 0, 7); ctx.fill();
      }
    }

    function drawTrunk(d) {
      ctx.fillStyle = '#100a06';
      ctx.fillRect(HEAD_X - 30, TRUNK_Y - 21, END_X - HEAD_X + 60, 42);
      ctx.strokeStyle = 'rgba(255,200,140,.13)'; ctx.lineWidth = 2;
      ctx.strokeRect(HEAD_X - 30, TRUNK_Y - 21, END_X - HEAD_X + 60, 42);

      var safe = safeX(d);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#6b5636';
      ctx.beginPath();
      ctx.moveTo(HEAD_X - 30, TRUNK_Y - 7); ctx.lineTo(END_X + 28, TRUNK_Y - 7);
      ctx.moveTo(HEAD_X - 30, TRUNK_Y + 7); ctx.lineTo(END_X + 28, TRUNK_Y + 7);
      ctx.stroke();
      if (safe > HEAD_X) {
        ctx.fillStyle = 'rgba(125,223,100,.08)';
        ctx.fillRect(HEAD_X - 30, TRUNK_Y - 21, safe - HEAD_X + 30, 42);
        ctx.strokeStyle = '#7ddf64';
        ctx.beginPath();
        ctx.moveTo(HEAD_X - 30, TRUNK_Y - 15); ctx.lineTo(safe, TRUNK_Y - 15);
        ctx.moveTo(HEAD_X - 30, TRUNK_Y + 15); ctx.lineTo(safe, TRUNK_Y + 15);
        ctx.stroke();
        ctx.fillStyle = 'rgba(125,223,100,.8)';
        ctx.font = '700 9px ' + FONT;
        ctx.fillText('PASSING TRACK', HEAD_X - 20, TRUNK_Y - 25);
      }
      ctx.strokeStyle = 'rgba(120,96,60,.45)'; ctx.lineWidth = 1;
      for (var x = HEAD_X - 24; x < END_X + 24; x += 15) {
        ctx.beginPath(); ctx.moveTo(x, TRUNK_Y - 10); ctx.lineTo(x, TRUNK_Y + 10); ctx.stroke();
      }
      // roof props and lamps
      for (var i = 0; i < 9; i++) {
        var lx = HEAD_X + 24 + i * 82;
        ctx.fillStyle = '#4a3418';
        ctx.fillRect(lx - 2, TRUNK_Y - 21, 4, 8);
        var flick = .55 + .45 * Math.abs(Math.sin(d.lamp * 3 + i));
        var lg = ctx.createRadialGradient(lx, TRUNK_Y - 18, 0, lx, TRUNK_Y - 18, 30);
        lg.addColorStop(0, 'rgba(255,196,92,' + (.26 * flick) + ')');
        lg.addColorStop(1, 'rgba(255,196,92,0)');
        ctx.fillStyle = lg;
        ctx.beginPath(); ctx.arc(lx, TRUNK_Y - 18, 30, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,214,140,' + flick + ')';
        ctx.fillRect(lx - 2, TRUNK_Y - 20, 4, 3);
      }
    }

    function drawBranch(d, i) {
      var s = SHAFTS[i], x = shaftX(i), open = d.open[i];
      var y0 = TRUNK_Y, y1 = TRUNK_Y + s.side * s.len;
      var lo = Math.min(y0, y1), hh = Math.abs(y1 - y0);
      ctx.fillStyle = open ? '#0f0a06' : 'rgba(255,255,255,.028)';
      ctx.fillRect(x - 13, lo, 26, hh);
      ctx.strokeStyle = open ? 'rgba(255,200,140,.12)' : 'rgba(255,255,255,.05)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - 13, lo, 26, hh);
      if (!open) {
        ctx.fillStyle = 'rgba(170,150,118,.6)';
        ctx.font = '700 10px ' + FONT;
        ctx.textAlign = 'center';
        ctx.fillText('🔒', x, TRUNK_Y + s.side * 26);
        ctx.fillText('$' + s.cost, x, TRUNK_Y + s.side * 42);
        ctx.textAlign = 'left';
        return;
      }
      ctx.strokeStyle = '#6b5636'; ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x - 4, lo); ctx.lineTo(x - 4, lo + hh);
      ctx.moveTo(x + 4, lo); ctx.lineTo(x + 4, lo + hh);
      ctx.stroke();

      var f = U.clamp(d.faces[i] / s.cap, 0, 1);
      var fy = y1 + s.side * 2;
      var rg = ctx.createRadialGradient(x, fy, 1, x, fy, 30);
      rg.addColorStop(0, 'rgba(255,255,255,' + (.10 + f * .34) + ')');
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.arc(x, fy, 30, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = s.c;
      for (var k = 0; k < 7; k++) {
        if (k / 7 > f) break;
        var ang = k * 1.7, rr = 4 + k * 1.3;
        ctx.beginPath();
        ctx.arc(x + Math.cos(ang) * rr, fy + Math.sin(ang) * rr * .6 * s.side, 2.3 + (k % 3), 0, Math.PI * 2);
        ctx.fill();
      }
      if (f > .96) {
        ctx.fillStyle = '#ff7b54';
        ctx.font = '800 9px ' + FONT;
        ctx.textAlign = 'center';
        ctx.fillText('SPILLING', x, fy + s.side * 15 + 3);
        ctx.textAlign = 'left';
      }
      ctx.fillStyle = 'rgba(240,226,200,.8)';
      ctx.font = '700 10px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText((i + 1) + '·$' + s.val, x, TRUNK_Y + s.side * 30 + (s.side < 0 ? 0 : 4));
      ctx.textAlign = 'left';
    }

    function drawCart(d, c) {
      if (c.phase === 'idle') return;
      var s = c.shaft >= 0 ? SHAFTS[c.shaft] : SHAFTS[0];
      var horiz = c.phase === 'out' || c.phase === 'home';
      var w = horiz ? 26 : 20, hh = horiz ? 16 : 20;
      ctx.save();
      ctx.translate(c.x, c.y);
      if (c.jam > 0) ctx.rotate(Math.sin(c.jam * 42) * .13);
      var gl = ctx.createRadialGradient(0, 0, 0, 0, 0, 24);
      gl.addColorStop(0, 'rgba(255,214,140,.28)');
      gl.addColorStop(1, 'rgba(255,214,140,0)');
      ctx.fillStyle = gl;
      ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5a3f22';
      ctx.fillRect(-w / 2, -hh / 2, w, hh);
      ctx.fillStyle = '#8a6430';
      ctx.fillRect(-w / 2, -hh / 2, w, 3);
      var lf = c.load / capacity(d);
      if (lf > 0) {
        var lh = Math.min(7, lf * 8);
        ctx.fillStyle = s.c;
        ctx.fillRect(-w / 2 + 2, -hh / 2 - lh, w - 4, lh + 2);
        ctx.fillStyle = s.glow;
        ctx.fillRect(-w / 2 + 2, -hh / 2 - lh, w - 4, 2);
      }
      ctx.fillStyle = '#1b1610';
      ctx.beginPath(); ctx.arc(-w / 4, hh / 2, 3, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(w / 4, hh / 2, 3, 0, 7); ctx.fill();
      ctx.restore();
      if (c.jam > 0) {
        ctx.fillStyle = '#ff6b35';
        ctx.font = '800 12px ' + FONT;
        ctx.textAlign = 'center';
        ctx.fillText('!', c.x, c.y - 16);
        ctx.textAlign = 'left';
      }
    }

    function drawParts(d) {
      for (var i = 0; i < d.parts.length; i++) {
        var p = d.parts[i], k = 1 - p.t / p.life;
        ctx.globalAlpha = Math.min(1, k * 1.7);
        if (p.k === 'txt') {
          ctx.font = '800 ' + p.s + 'px ' + FONT;
          ctx.textAlign = 'center';
          ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(15,8,3,.9)';
          ctx.strokeText(p.str, p.x, p.y);
          ctx.fillStyle = p.c; ctx.fillText(p.str, p.x, p.y);
          ctx.textAlign = 'left';
        } else if (p.k === 'dust') {
          ctx.fillStyle = 'rgba(196,170,132,' + (.32 * k) + ')';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.s * (1 + p.t), 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.fillStyle = p.c;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.s * k, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }

    /* -------------------------------------------------------------- keys */

    function onKey(g, e) {
      var d = g.data;
      var n = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4, Digit6: 5 }[e.code];
      if (n != null) { e.preventDefault(); dispatch(g, n); return; }
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (d.phase === 'shop') { nextShift(g); return; }
        var best = -1, bv = -1;
        for (var i = 0; i < SHAFTS.length; i++) {
          if (!d.open[i] || d.busy[i]) continue;
          var v = d.faces[i] * SHAFTS[i].val;
          if (v > bv) { bv = v; best = i; }
        }
        if (best >= 0) dispatch(g, best);
      }
    }

    return Milo.domGame(host, {
      id: 'mine-magnate',
      stats: ['Cash', 'Shift', 'Quota', 'Carts'],
      bg: 'radial-gradient(circle at 50% 0%, #2c1d11, #170e07 60%, #0c0704)',
      emo: '⛏️',
      start: {
        title: 'Mine Magnate',
        text: 'One drift, six faces. Send carts in to load ore and back out to the portal — but the drift is ' +
          'single track, so two carts meeting head-on jam and spill. Hit every shift quota, then spend the ' +
          'takings on carts, rails, drills and passing track.',
        keys: ['1–6 send a cart', 'Space fullest face', 'Click a face']
      },
      init: reset,
      update: update,
      onKey: onKey,
      touchButtons: [{ key: 'action', label: '⛏' }]
    });
  }

  window.Milo.register({
    id: 'mine-magnate',
    title: 'Mine Magnate',
    emo: '⛏️',
    category: 'Strategy',
    tagline: 'Six faces, one single-track drift, no pile-ups',
    description: 'Press 1–6 (or click a face) to send an idle cart down the drift, into a side stope, onto the ' +
      'ore and back out to the portal. The drift carries one cart at a time: carts going the same way queue up, ' +
      'but a loaded cart meeting an empty one head-on jams for nearly two seconds and dumps half of both loads. ' +
      'Faces refill on their own and start spilling once they top out, so the deep, rich stopes want visiting on ' +
      'a rhythm while the coal seam soaks up spare carts. Every shift has a tonnage quota that climbs fast; ' +
      'clearing it pays a bonus you spend on carts, rail grade, bigger skips, power drills and passing track ' +
      'that makes the near half of the drift safe to cross. Tip: buy passing track before your third cart — two ' +
      'carts on single track is traffic, three is a pile-up.',
    controls: ['1–6', 'Space', 'Click'],
    colors: ['#ffb454', '#2c1d11'],
    scoreLabel: 'dollars',
    tags: ['mining', 'logistics', 'management', 'sim', 'timing'],
    mount: mount
  });
})();
