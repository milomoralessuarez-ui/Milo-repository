/* Power Plant — hold 50 Hz against a live demand curve. */
(function () {
  'use strict';

  var CW = 820, CH = 214;
  var DIAL_W = 168;
  var GX = DIAL_W + 14, GW = CW - GX - 12, GY = 14, GH = CH - 34;
  var SHIFT_LEN = 62;
  var STEP = .25;                    // demand curve sample spacing, seconds
  var FONT = 'Outfit, ui-sans-serif, system-ui, sans-serif';

  /* Every unit trades responsiveness against running cost. Coal is cheap but
     takes an age to spin up; gas answers instantly and burns money. */
  var UNITS = {
    coal1: { n: 'Coal A', e: '🏭', cap: 130, ramp: 11, fuel: .085, spin: 6.5, ctrl: 1, c: '#ff8f4d' },
    coal2: { n: 'Coal B', e: '🏭', cap: 150, ramp: 12, fuel: .082, spin: 7.5, ctrl: 1, c: '#ff7a33' },
    gas1: { n: 'Gas A', e: '🔥', cap: 80, ramp: 46, fuel: .215, spin: 1.1, ctrl: 1, c: '#ffd166' },
    gas2: { n: 'Gas B', e: '🔥', cap: 95, ramp: 52, fuel: .225, spin: 1.0, ctrl: 1, c: '#ffe08a' },
    hydro: { n: 'Hydro', e: '💧', cap: 70, ramp: 90, fuel: .02, spin: .25, ctrl: 1, c: '#4fd6ff', res: 1 },
    solar: { n: 'Solar', e: '☀️', cap: 85, ramp: 999, fuel: 0, spin: 0, ctrl: 0, c: '#ffe45c' },
    wind: { n: 'Wind', e: '🌬️', cap: 65, ramp: 999, fuel: 0, spin: 0, ctrl: 0, c: '#9ef7c8' },
    batt: { n: 'Battery', e: '🔋', cap: 55, ramp: 200, fuel: .01, spin: .05, ctrl: 2, c: '#c58bff' }
  };

  var SHOP = [
    { id: 'gas2', n: 'Second gas turbine', e: '🔥', d: '95 MW, answers in a second', cost: 900, once: 1 },
    { id: 'hydro', n: 'Hydro station', e: '💧', d: '70 MW instant, but the reservoir runs down', cost: 1200, once: 1 },
    { id: 'batt', n: 'Grid battery', e: '🔋', d: '55 MW either way — charge on surplus', cost: 1500, once: 1 },
    { id: 'wind', n: 'Wind farm', e: '🌬️', d: '65 MW of free, gusty power', cost: 1800, once: 1 },
    { id: 'coal2', n: 'Coal unit B', e: '🏭', d: '150 MW of cheap baseload', cost: 2400, once: 1 },
    { id: 'look', n: 'Better forecast', e: '📈', d: 'see 6 more seconds of demand', cost: 700, max: 3 },
    { id: 'ramp', n: 'Governor tuning', e: '🎛️', d: 'every unit ramps 25% faster', cost: 850, max: 3 },
    { id: 'iner', n: 'Flywheel bank', e: '⚙️', d: 'grid inertia: frequency drifts slower', cost: 1000, max: 3 },
    { id: 'tarif', n: 'Peak tariff', e: '💰', d: '+18% paid per MW delivered', cost: 1100, max: 3 }
  ];

  var EVENTS = [
    { n: 'Factory start-up', mw: 60, w: 2.5 },
    { n: 'Half-time surge', mw: 85, w: 1.6 },
    { n: 'Cold snap', mw: 55, w: 6 },
    { n: 'Tram depot', mw: 45, w: 2 },
    { n: 'Steel furnace', mw: 95, w: 1.8 },
    { n: 'Heatwave aircon', mw: 70, w: 5 },
    { n: 'Line fault', mw: -70, w: 1.4 },
    { n: 'Smelter trip', mw: -90, w: 1.2 }
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

    function reset(g) {
      var d = g.data;
      d.shift = 1;
      d.cash = 400;
      d.gross = 0;
      d.mwh = 0;
      d.strikes = 0;
      d.blackouts = 0;
      d.phase = 'run';
      d.t = 0;
      d.freq = 50;
      d.badT = 0;
      d.shed = 0;
      d.upg = { look: 0, ramp: 0, iner: 0, tarif: 0 };
      d.sel = 0;
      d.parts = [];
      d.units = [mkUnit('coal1'), mkUnit('gas1'), mkUnit('solar')];
      d.trace = [];
      d.demand = 0; d.supply = 0;
      d.shiftCash = 0;
      d.msg = 'Match supply to the white demand line. 1–8 pick a unit, ↑↓ set output.';
      d.msgT = 5;
      makeCurve(d);
      // Hand the player a grid that is already balanced, not one mid-blackout.
      var sun0 = sunAt(d, 0) * UNITS.solar.cap;
      var need = Math.max(0, demandAt(d, 0) - sun0);
      d.units[0].tgt = U.clamp(Math.round(need / UNITS.coal1.cap * 100 / 5) * 5, 0, 100);
      d.units[0].sp = 1;
      d.units[0].out = UNITS.coal1.cap * d.units[0].tgt / 100;
      d.units[2].out = sun0;
      d.supply = d.units[0].out + sun0;
      d.demand = demandAt(d, 0);
      build(g);
      refresh(g);
      render(g);
    }

    function mkUnit(id) {
      var u = UNITS[id];
      return { id: id, out: 0, tgt: u.ctrl === 0 ? 100 : 0, sp: 0, store: u.res ? 1 : (id === 'batt' ? .6 : 0) };
    }

    function has(d, id) {
      for (var i = 0; i < d.units.length; i++) if (d.units[i].id === id) return true;
      return false;
    }

    function lookahead(d) { return 8 + d.upg.look * 6; }
    function rampMul(d) { return 1 + d.upg.ramp * .25; }
    function inertia(d) { return 2.4 - d.upg.iner * .45; }
    function tariff(d) { return .36 * (1 + d.upg.tarif * .18); }

    /* Demand is a smooth base load plus a handful of named shocks; later
       shifts get more of them, sharper, on a higher base. */
    function makeCurve(d) {
      var n = Math.ceil((SHIFT_LEN + 34) / STEP);
      var base = 120 + d.shift * 22;
      var amp = 30 + d.shift * 9;
      d.curve = new Array(n);
      d.marks = [];
      var evs = [], i;
      var count = 1 + Math.min(5, Math.floor(d.shift * .9));
      for (i = 0; i < count; i++) {
        var e = EVENTS[(Math.random() * EVENTS.length) | 0];
        var when = 8 + Math.random() * (SHIFT_LEN - 14);
        var mag = e.mw * (.7 + d.shift * .1) * (e.mw > 0 ? 1 : Math.min(1.4, .6 + d.shift * .12));
        evs.push({ t: when, mw: mag, w: Math.max(.8, e.w / (1 + d.shift * .06)) });
        d.marks.push({ t: when, n: e.n, up: e.mw > 0 });
      }
      var ph1 = Math.random() * 6, ph2 = Math.random() * 6;
      for (i = 0; i < n; i++) {
        var t = i * STEP;
        var v = base + Math.sin(t * .16 + ph1) * amp + Math.sin(t * .47 + ph2) * amp * .35;
        for (var k = 0; k < evs.length; k++) {
          var dtv = (t - evs[k].t) / evs[k].w;
          v += evs[k].mw * Math.exp(-dtv * dtv * .5);
        }
        d.curve[i] = Math.max(35, v);
      }
      // A cloud bank that knocks solar down mid-shift keeps renewables honest.
      d.cloudAt = 12 + Math.random() * (SHIFT_LEN - 24);
      d.cloudW = 5 + Math.random() * 5;
    }

    function demandAt(d, t) {
      if (t < 0) t = 0;
      var i = t / STEP, i0 = Math.floor(i);
      if (i0 >= d.curve.length - 1) return d.curve[d.curve.length - 1];
      return U.lerp(d.curve[i0], d.curve[i0 + 1], i - i0);
    }
    function sunAt(d, t) {
      var s = .28 + .72 * Math.sin(Math.PI * U.clamp(t / SHIFT_LEN, 0, 1));
      var c = (t - d.cloudAt) / d.cloudW;
      s *= 1 - .78 * Math.exp(-c * c * .5);
      return U.clamp(s, 0, 1);
    }
    function windAt(d, t) {
      return U.clamp(.28 + .62 * U.fbm(t * .12, d.shift * 3.1, 3, 17), .05, 1);
    }

    /* ------------------------------------------------------------ update */

    function update(g, dt) {
      var d = g.data;
      stepParts(d, dt);
      if (d.msgT > 0) d.msgT -= dt;

      if (d.phase === 'run') {
        d.t += dt;
        if (d.shed > 0) d.shed -= dt;
        var demand = demandAt(d, d.t) * (d.shed > 0 ? .5 : 1);
        var supply = 0, fuel = 0, i, u, def;

        for (i = 0; i < d.units.length; i++) {
          u = d.units[i]; def = UNITS[u.id];
          if (def.ctrl === 0) {
            var f = u.id === 'solar' ? sunAt(d, d.t) : windAt(d, d.t);
            u.sp = f;
            u.out += (def.cap * f * (u.tgt / 100) - u.out) * Math.min(1, dt * 5);
          } else if (u.id === 'batt') {
            var want = def.cap * (u.tgt / 100);
            if (want > 0 && u.store <= 0) want = 0;
            if (want < 0 && u.store >= 1) want = 0;
            u.out += U.clamp(want - u.out, -def.ramp * dt, def.ramp * dt);
            u.store = U.clamp(u.store - u.out * dt / 260, 0, 1);
            u.sp = u.store;
          } else {
            var target = def.cap * (u.tgt / 100);
            if (target > 0) u.sp = Math.min(1, u.sp + dt / def.spin);
            else u.sp = Math.max(0, u.sp - dt / (def.spin * 1.7));
            var maxOut = def.cap * u.sp;
            if (def.res) {
              if (u.store <= 0) maxOut = 0;
              u.store = U.clamp(u.store - u.out * dt / 900 + dt / 260, 0, 1);
            }
            var want2 = Math.min(target, maxOut);
            u.out += U.clamp(want2 - u.out, -def.ramp * rampMul(d) * dt, def.ramp * rampMul(d) * dt);
            if (u.out > maxOut) u.out = maxOut;
            if (u.out < 0) u.out = 0;
          }
          supply += u.out;
          // Spinning reserve burns fuel whether or not anyone buys the power.
          fuel += (u.out * def.fuel + u.sp * def.cap * def.fuel * .055) * dt;
        }

        d.demand = demand; d.supply = supply;
        var mis = supply - demand;
        var targetF = 50 + U.clamp(mis, -160, 160) * .029;
        d.freq += (targetF - d.freq) * Math.min(1, dt * inertia(d));

        var sold = Math.min(supply, demand) * (d.shed > 0 ? 0 : 1);
        var income = sold * tariff(d) * dt;
        d.cash += income - fuel;
        d.gross += income;
        d.shiftCash += income - fuel;
        d.mwh += sold * dt / 60;
        g.score = Math.max(0, Math.round(d.gross));

        var off = Math.abs(d.freq - 50);
        if (off > 1.5) {
          d.badT += dt;
          if (d.badT > 1.9) blackout(g);
        } else if (off < 1.05) d.badT = Math.max(0, d.badT - dt * .9);

        if (d.cash < -400) {
          g.gameOver({
            emo: '💸', title: 'Bankrupt',
            text: 'Fuel costs ran away from you in shift ' + d.shift + '. ' +
              Math.round(d.mwh) + ' MWh delivered, ' + d.blackouts + ' blackouts.',
            score: Math.max(0, Math.round(d.gross))
          });
          return;
        }
        if (d.t >= SHIFT_LEN) endShift(g);
      }

      d.uiT = (d.uiT || 0) + dt;
      if (d.uiT > .09) { d.uiT = 0; refresh(g); }
      if (d.phase !== 'shop') render(g);
    }

    function blackout(g) {
      var d = g.data;
      d.badT = -2.6;
      d.strikes++;
      d.blackouts++;
      d.shed = 4;
      var fine = 180 + d.shift * 60;
      d.cash -= fine;
      d.shiftCash -= fine;
      sparks(d, GX + GW * .5, GY + GH * .5, 26, ['#ff4d4d', '#ffd166', '#fff']);
      d.msg = 'BLACKOUT — load shed, $' + fine + ' fine. ' + (3 - d.strikes) + ' left.';
      d.msgT = 3.4;
      Milo.sound.explode();
      if (d.strikes >= 3) {
        g.gameOver({
          emo: '🕯️',
          title: 'Grid down',
          text: 'Three blackouts in shift ' + d.shift + '. You delivered ' + Math.round(d.mwh) +
            ' MWh before the lights went out for good.',
          score: Math.max(0, Math.round(d.gross))
        });
      }
    }

    function endShift(g) {
      var d = g.data;
      var bonus = Math.round(180 + d.shift * 130 + Math.max(0, d.shiftCash) * .25);
      d.cash += bonus;
      d.gross += bonus;
      d.bonus = bonus;
      d.phase = 'shop';
      g.score = Math.max(0, Math.round(d.gross));
      Milo.sound.powerup();
      refresh(g);
    }

    function nextShift(g) {
      var d = g.data;
      d.shift++;
      d.t = 0;
      d.shiftCash = 0;
      d.trace = [];
      d.badT = -2;
      d.shed = 0;
      d.phase = 'run';
      makeCurve(d);
      d.msg = 'Shift ' + d.shift + ' — peak load is higher and the shocks are sharper.';
      d.msgT = 3;
      Milo.sound.blip();
      refresh(g);
      render(g);
    }

    function buy(g, id) {
      var d = g.data, i, item;
      for (i = 0; i < SHOP.length; i++) if (SHOP[i].id === id) item = SHOP[i];
      if (!item) return;
      var owned = item.once ? (has(d, id) ? 1 : 0) : (d.upg[id] || 0);
      var max = item.once ? 1 : item.max;
      if (owned >= max) return;
      var cost = Math.round(item.cost * Math.pow(1.7, owned));
      if (d.cash < cost) { Milo.sound.tone({ f: 120, d: .12, v: .06 }); return; }
      d.cash -= cost;
      if (item.once) { d.units.push(mkUnit(id)); }
      else d.upg[id] = owned + 1;
      Milo.sound.powerup();
      refresh(g);
    }

    /* --------------------------------------------------------- particles */

    function sparks(d, x, y, n, cols) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2, v = 60 + Math.random() * 200;
        d.parts.push({
          x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 190,
          s: 1.4 + Math.random() * 2.6, c: cols[(Math.random() * cols.length) | 0],
          t: 0, life: .45 + Math.random() * .6
        });
      }
    }
    function stepParts(d, dt) {
      for (var i = d.parts.length - 1; i >= 0; i--) {
        var p = d.parts[i];
        p.t += dt;
        if (p.t >= p.life) { d.parts.splice(i, 1); continue; }
        p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      }
    }

    /* ------------------------------------------------------------ inputs */

    function adjust(g, i, delta) {
      var d = g.data, u = d.units[i];
      if (!u) return;
      var def = UNITS[u.id];
      var lo = def.ctrl === 2 ? -100 : 0;
      u.tgt = U.clamp(Math.round((u.tgt + delta) / 5) * 5, lo, 100);
      Milo.sound.tone({ f: 420 + u.tgt * 3, d: .035, v: .05, type: 'square' });
      refresh(g);
    }

    function toggle(g, i) {
      var d = g.data, u = d.units[i];
      if (!u) return;
      u.tgt = u.tgt > 0 ? 0 : 100;
      Milo.sound.click();
      refresh(g);
    }

    function onKey(g, e) {
      var d = g.data;
      if (d.phase === 'shop') {
        if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); nextShift(g); }
        return;
      }
      var n = 'Digit1 Digit2 Digit3 Digit4 Digit5 Digit6 Digit7 Digit8'.split(' ').indexOf(e.code);
      if (n >= 0) { e.preventDefault(); if (d.units[n]) { d.sel = n; refresh(g); } return; }
      if (e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); adjust(g, d.sel, 10); return; }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') { e.preventDefault(); adjust(g, d.sel, -10); return; }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        e.preventDefault(); d.sel = (d.sel + d.units.length - 1) % d.units.length; refresh(g); return;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault(); d.sel = (d.sel + 1) % d.units.length; refresh(g); return;
      }
      if (e.code === 'Space') { e.preventDefault(); toggle(g, d.sel); }
    }

    /* -------------------------------------------------------------- view */

    function build(g) {
      var wrap = h('div', 'display:flex;flex-direction:column;gap:6px;width:100%;max-width:880px;' +
        'height:100%;align-self:stretch;font-family:' + FONT + ';color:#dff3ee');

      els.bar = h('div', 'flex:0 0 auto;display:flex;gap:8px;align-items:center;justify-content:space-between;' +
        'background:rgba(0,255,190,.05);border:1px solid rgba(0,255,190,.16);border-radius:10px;padding:4px 11px');

      var box = h('div', 'flex:1 1 auto;min-height:0;position:relative;display:flex;' +
        'align-items:center;justify-content:center');
      cv = document.createElement('canvas');
      cv.width = CW; cv.height = CH;
      cv.style.cssText = 'max-width:100%;max-height:100%;width:auto;height:auto;border-radius:10px;' +
        'box-shadow:0 12px 30px rgba(0,0,0,.6);border:1px solid rgba(0,255,190,.14)';
      ctx = cv.getContext('2d');

      els.shop = h('div', 'position:absolute;inset:0;overflow-y:auto;display:none;flex-direction:column;' +
        'gap:5px;padding:4px;background:rgba(4,14,14,.95);border-radius:10px');
      els.shop.addEventListener('click', function (e) {
        var b = e.target.closest('[data-buy]');
        if (b) { buy(g, b.getAttribute('data-buy')); return; }
        if (e.target.closest('[data-next]')) nextShift(g);
      });
      box.appendChild(cv);
      box.appendChild(els.shop);

      els.units = h('div', 'flex:0 0 auto;display:grid;gap:5px;' +
        'grid-template-columns:repeat(auto-fit,minmax(104px,1fr))');
      els.units.addEventListener('click', function (e) {
        var m = e.target.closest('[data-adj]');
        if (m) {
          var parts = m.getAttribute('data-adj').split(':');
          adjust(g, +parts[0], +parts[1]);
          return;
        }
        var c = e.target.closest('[data-sel]');
        if (c) { g.data.sel = +c.getAttribute('data-sel'); refresh(g); }
      });

      els.msg = h('div', 'flex:0 0 auto;min-height:1.2em;text-align:center;font:700 .74rem/1.2 ' +
        FONT + ';color:#ffd166');

      wrap.appendChild(els.bar);
      wrap.appendChild(box);
      wrap.appendChild(els.units);
      wrap.appendChild(els.msg);
      g.root.innerHTML = '';
      g.root.appendChild(wrap);
    }

    function pill(l, v, c) {
      return '<div style="text-align:center;min-width:48px"><div style="font:700 .52rem/1 ' + FONT +
        ';letter-spacing:.09em;text-transform:uppercase;color:#6f9b93">' + l + '</div>' +
        '<div style="font:800 .9rem/1.25 ' + FONT + ';color:' + c + '">' + v + '</div></div>';
    }

    function refresh(g) {
      var d = g.data;
      var off = Math.abs(d.freq - 50);
      g.set('Cash', '$' + U.fmt(Math.round(d.cash)));
      g.set('Shift', d.shift);
      g.set('Hz', d.freq.toFixed(2));
      var dots = '', si;
      for (si = 0; si < 3; si++) dots += si < d.strikes ? '●' : '○';
      g.set('Strikes', dots);

      els.bar.innerHTML =
        pill('Demand', Math.round(d.demand || 0) + ' MW', '#ffffff') +
        pill('Supply', Math.round(d.supply || 0) + ' MW', (d.supply || 0) >= (d.demand || 0) ? '#4dffb8' : '#ff7b6b') +
        pill('Balance', ((d.supply || 0) - (d.demand || 0) > 0 ? '+' : '') +
          Math.round((d.supply || 0) - (d.demand || 0)), off > 1 ? '#ff4d4d' : off > .5 ? '#ffd166' : '#4dffb8') +
        pill('Frequency', d.freq.toFixed(2) + ' Hz', off > 1.5 ? '#ff4d4d' : off > .8 ? '#ffd166' : '#4dffb8') +
        pill('Clock', d.phase === 'shop' ? '—' : U.time(Math.max(0, Math.ceil(SHIFT_LEN - d.t))), '#dff3ee');

      unitHtml(g);
      if (d.phase === 'shop') { els.shop.style.display = 'flex'; shopHtml(g); }
      else els.shop.style.display = 'none';
      els.msg.textContent = d.msgT > 0 ? d.msg : '';
    }

    function unitHtml(g) {
      var d = g.data, out = [];
      for (var i = 0; i < d.units.length; i++) {
        var u = d.units[i], def = UNITS[u.id];
        var sel = d.sel === i;
        var pct = U.clamp(Math.abs(u.out) / def.cap, 0, 1);
        var tp = U.clamp(Math.abs(u.tgt) / 100, 0, 1);
        var sub = def.ctrl === 0
          ? Math.round(u.sp * 100) + '% avail'
          : def.ctrl === 2
            ? (u.out < -.5 ? 'charging' : u.out > .5 ? 'discharging' : 'idle') + ' ' + Math.round(u.store * 100) + '%'
            : (u.sp < .99 && u.tgt > 0 ? 'spinning up ' + Math.round(u.sp * 100) + '%'
              : u.sp <= .01 ? 'cold' : 'online');
        out.push('<div data-sel="' + i + '" style="cursor:pointer;border-radius:9px;padding:3px 6px 4px;' +
          'background:' + (sel ? 'rgba(77,255,184,.12)' : 'rgba(255,255,255,.04)') + ';' +
          'border:1px solid ' + (sel ? 'rgba(77,255,184,.55)' : 'rgba(255,255,255,.08)') + '">' +
          '<div style="display:flex;align-items:center;gap:4px;font:800 .66rem/1.3 ' + FONT + '">' +
          '<span>' + def.e + '</span><span style="flex:1;white-space:nowrap;overflow:hidden;' +
          'text-overflow:ellipsis">' + (i + 1) + ' ' + def.n + '</span>' +
          '<span style="color:' + def.c + '">' + Math.round(u.out) + '</span></div>' +
          '<div style="position:relative;height:6px;border-radius:4px;background:rgba(0,0,0,.45);overflow:hidden;margin:2px 0">' +
          '<div style="height:100%;width:' + (pct * 100) + '%;background:' + def.c + '"></div>' +
          '<div style="position:absolute;top:-1px;left:' + (tp * 100) + '%;width:2px;height:8px;background:#fff"></div></div>' +
          '<div style="display:flex;align-items:center;gap:3px">' +
          (def.ctrl
            ? '<button type="button" data-adj="' + i + ':-10" style="' + miniBtn() + '">−</button>' +
            '<span style="flex:1;text-align:center;font:800 .6rem/1 ' + FONT + ';color:#9fd8cc">' + u.tgt + '%</span>' +
            '<button type="button" data-adj="' + i + ':10" style="' + miniBtn() + '">+</button>'
            : '<span style="flex:1;text-align:center;font:700 .56rem/1.5 ' + FONT + ';color:#7fb3a8">' + sub + '</span>') +
          '</div>' +
          (def.ctrl ? '<div style="font:700 .54rem/1.4 ' + FONT + ';color:#7fb3a8;text-align:center;' +
            'white-space:nowrap;overflow:hidden">' + sub + '</div>' : '') +
          '</div>');
      }
      els.units.innerHTML = out.join('');
    }

    function miniBtn() {
      return 'width:20px;height:16px;border-radius:5px;border:1px solid rgba(255,255,255,.18);' +
        'background:rgba(255,255,255,.07);color:#dff3ee;font:800 .68rem/1 ' + FONT + ';cursor:pointer;padding:0';
    }

    function shopHtml(g) {
      var d = g.data, out = [];
      out.push('<div style="text-align:center;font:800 .9rem/1.3 ' + FONT + ';color:#4dffb8;padding:2px">' +
        'Shift ' + d.shift + ' logged · bonus $' + U.fmt(d.bonus) + ' · cash $' + U.fmt(Math.round(d.cash)) + '</div>');
      for (var i = 0; i < SHOP.length; i++) {
        var it = SHOP[i];
        var owned = it.once ? (has(d, it.id) ? 1 : 0) : (d.upg[it.id] || 0);
        var max = it.once ? 1 : it.max;
        if (owned >= max) continue;
        var cost = Math.round(it.cost * Math.pow(1.7, owned));
        var can = d.cash >= cost;
        out.push('<button type="button" data-buy="' + it.id + '" style="display:flex;align-items:center;gap:8px;' +
          'text-align:left;padding:6px 9px;border-radius:9px;font:inherit;color:#dff3ee;' +
          'cursor:' + (can ? 'pointer' : 'default') + ';opacity:' + (can ? 1 : .5) + ';' +
          'border:1px solid ' + (can ? 'rgba(77,255,184,.4)' : 'rgba(255,255,255,.08)') + ';' +
          'background:' + (can ? 'rgba(77,255,184,.08)' : 'rgba(255,255,255,.03)') + '">' +
          '<span style="font-size:16px;width:20px;text-align:center">' + it.e + '</span>' +
          '<span style="flex:1;min-width:0"><span style="font:800 .75rem/1.2 ' + FONT + '">' + it.n +
          (owned ? ' ×' + owned : '') + '</span><span style="display:block;font:600 .62rem/1.3 ' + FONT +
          ';color:#7fb3a8">' + it.d + '</span></span>' +
          '<span style="font:800 .75rem/1 ' + FONT + ';color:' + (can ? '#4dffb8' : '#5d7d76') + '">$' +
          U.fmt(cost) + '</span></button>');
      }
      out.push('<button type="button" data-next="1" style="margin-top:3px;padding:9px;border-radius:10px;' +
        'border:0;cursor:pointer;font:800 .86rem ' + FONT + ';color:#04211b;' +
        'background:linear-gradient(90deg,#4dffb8,#2ad1ff)">Start shift ' + (d.shift + 1) + '</button>');
      els.shop.innerHTML = out.join('');
    }

    /* -------------------------------------------------------------- draw */

    function render(g) {
      var d = g.data;
      ctx.fillStyle = '#04120f';
      ctx.fillRect(0, 0, CW, CH);
      drawDial(d);
      drawGraph(d);
      for (var i = 0; i < d.parts.length; i++) {
        var p = d.parts[i], k = 1 - p.t / p.life;
        ctx.globalAlpha = Math.min(1, k * 1.8);
        ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s * k, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (d.shed > 0) {
        ctx.fillStyle = 'rgba(255,60,60,' + (.10 + .08 * Math.sin(d.t * 22)) + ')';
        ctx.fillRect(0, 0, CW, CH);
        ctx.fillStyle = '#ff6b6b';
        ctx.font = '800 22px ' + FONT;
        ctx.textAlign = 'center';
        ctx.fillText('LOAD SHED', CW / 2 + DIAL_W / 2, CH / 2);
        ctx.textAlign = 'left';
      }
    }

    function drawDial(d) {
      var cx = DIAL_W / 2, cy = CH / 2 + 8, r = 62;
      ctx.fillStyle = '#061814';
      ctx.fillRect(0, 0, DIAL_W, CH);
      ctx.strokeStyle = 'rgba(0,255,190,.12)';
      ctx.lineWidth = 1;
      ctx.strokeRect(.5, .5, DIAL_W - 1, CH - 1);

      // green safe band, amber caution, red trip
      var a0 = Math.PI * .78, a1 = Math.PI * 2.22;
      function ang(f) { return a0 + (a1 - a0) * U.clamp((f - 47) / 6, 0, 1); }
      ctx.lineWidth = 9;
      ctx.strokeStyle = 'rgba(255,77,77,.35)';
      ctx.beginPath(); ctx.arc(cx, cy, r, a0, a1); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,209,102,.45)';
      ctx.beginPath(); ctx.arc(cx, cy, r, ang(48.5), ang(51.5)); ctx.stroke();
      ctx.strokeStyle = 'rgba(77,255,184,.6)';
      ctx.beginPath(); ctx.arc(cx, cy, r, ang(49.2), ang(50.8)); ctx.stroke();

      // ticks
      ctx.strokeStyle = 'rgba(223,243,238,.45)';
      ctx.lineWidth = 1.5;
      for (var f = 47; f <= 53; f++) {
        var a = ang(f);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * (r - 7), cy + Math.sin(a) * (r - 7));
        ctx.lineTo(cx + Math.cos(a) * (r - 14), cy + Math.sin(a) * (r - 14));
        ctx.stroke();
      }

      // needle
      var na = ang(d.freq);
      var off = Math.abs(d.freq - 50);
      var col = off > 1.5 ? '#ff4d4d' : off > .8 ? '#ffd166' : '#4dffb8';
      ctx.strokeStyle = col; ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.moveTo(cx - Math.cos(na) * 9, cy - Math.sin(na) * 9);
      ctx.lineTo(cx + Math.cos(na) * (r - 12), cy + Math.sin(na) * (r - 12));
      ctx.stroke();
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(cx, cy, 5.5, 0, Math.PI * 2); ctx.fill();

      ctx.textAlign = 'center';
      ctx.fillStyle = col;
      ctx.font = '800 24px ' + FONT;
      ctx.fillText(d.freq.toFixed(2), cx, cy + 34);
      ctx.fillStyle = '#6f9b93';
      ctx.font = '700 10px ' + FONT;
      ctx.fillText('HERTZ', cx, cy + 46);
      ctx.fillStyle = '#9fd8cc';
      ctx.font = '800 12px ' + FONT;
      ctx.fillText('GRID FREQUENCY', cx, 20);
      if (d.badT > 0) {
        ctx.fillStyle = 'rgba(255,77,77,' + (.35 + .3 * Math.sin(d.t * 26)) + ')';
        ctx.fillRect(12, CH - 22, (DIAL_W - 24) * U.clamp(d.badT / 1.9, 0, 1), 6);
        ctx.fillStyle = '#ff6b6b';
        ctx.font = '800 10px ' + FONT;
        ctx.fillText('OUT OF BAND', cx, CH - 26);
      }
      ctx.textAlign = 'left';
    }

    function drawGraph(d) {
      var look = lookahead(d), back = 14;
      var t0 = d.t - back, t1 = d.t + look;
      var maxMW = 0, i, t;
      for (t = Math.max(0, t0); t < t1; t += .5) maxMW = Math.max(maxMW, demandAt(d, t));
      maxMW = Math.max(maxMW, d.supply || 0) * 1.22 + 20;

      function X(tt) { return GX + GW * (tt - t0) / (t1 - t0); }
      function Y(mw) { return GY + GH - GH * U.clamp(mw / maxMW, 0, 1); }

      ctx.fillStyle = '#031a16';
      ctx.fillRect(GX, GY, GW, GH);
      ctx.strokeStyle = 'rgba(0,255,190,.10)';
      ctx.lineWidth = 1;
      for (i = 1; i < 5; i++) {
        var gy = GY + GH * i / 5;
        ctx.beginPath(); ctx.moveTo(GX, gy); ctx.lineTo(GX + GW, gy); ctx.stroke();
      }
      for (i = 0; i <= 6; i++) {
        var gx = GX + GW * i / 6;
        ctx.beginPath(); ctx.moveTo(gx, GY); ctx.lineTo(gx, GY + GH); ctx.stroke();
      }

      // future half is tinted — that is the forecast you bought
      ctx.fillStyle = 'rgba(255,255,255,.028)';
      ctx.fillRect(X(d.t), GY, GX + GW - X(d.t), GH);

      // supply history trace
      if (!d.trace) d.trace = [];
      if (d.phase === 'run') {
        d.trace.push({ t: d.t, s: d.supply || 0 });
        while (d.trace.length && d.trace[0].t < t0 - 1) d.trace.shift();
      }
      ctx.beginPath();
      ctx.moveTo(X(t0), Y(0));
      for (i = 0; i < d.trace.length; i++) ctx.lineTo(X(d.trace[i].t), Y(d.trace[i].s));
      if (d.trace.length) ctx.lineTo(X(d.trace[d.trace.length - 1].t), Y(0));
      ctx.closePath();
      var sg = ctx.createLinearGradient(0, GY, 0, GY + GH);
      sg.addColorStop(0, 'rgba(77,255,184,.42)');
      sg.addColorStop(1, 'rgba(77,255,184,.04)');
      ctx.fillStyle = sg;
      ctx.fill();
      ctx.strokeStyle = '#4dffb8'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (i = 0; i < d.trace.length; i++) {
        var pt = d.trace[i];
        if (i === 0) ctx.moveTo(X(pt.t), Y(pt.s)); else ctx.lineTo(X(pt.t), Y(pt.s));
      }
      ctx.stroke();

      // demand line
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.4;
      ctx.beginPath();
      var first = true;
      for (t = Math.max(0, t0); t <= t1; t += .35) {
        var yy = Y(demandAt(d, t) * (d.shed > 0 && t <= d.t ? .5 : 1));
        if (first) { ctx.moveTo(X(t), yy); first = false; } else ctx.lineTo(X(t), yy);
      }
      ctx.stroke();

      // event markers in the forecast window
      ctx.font = '700 9px ' + FONT;
      for (i = 0; i < d.marks.length; i++) {
        var m = d.marks[i];
        if (m.t < t0 || m.t > t1) continue;
        var mx = X(m.t);
        ctx.strokeStyle = m.up ? 'rgba(255,209,102,.6)' : 'rgba(120,180,255,.6)';
        ctx.lineWidth = 1.4;
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(mx, GY); ctx.lineTo(mx, GY + GH); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = m.up ? '#ffd166' : '#78b4ff';
        ctx.save();
        ctx.translate(mx + 3, GY + 10);
        ctx.fillText(m.n, 0, 0);
        ctx.restore();
      }

      // now line
      var nx = X(d.t);
      ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(nx, GY); ctx.lineTo(nx, GY + GH); ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(nx, Y(d.supply || 0), 3.4, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = '#6f9b93';
      ctx.font = '700 9px ' + FONT;
      ctx.fillText('now', nx + 3, GY + GH - 4);
      ctx.fillText('forecast +' + look + 's →', nx + 26, GY + GH - 4);
      ctx.fillText(Math.round(maxMW) + ' MW', GX + 4, GY + 10);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('demand', GX + GW - 92, GY + 10);
      ctx.fillStyle = '#4dffb8';
      ctx.fillText('supply', GX + GW - 40, GY + 10);
    }

    return Milo.domGame(host, {
      id: 'power-plant',
      stats: ['Cash', 'Shift', 'Hz', 'Strikes'],
      bg: 'radial-gradient(circle at 50% 0%, #0b2b26, #051614 55%, #020b0a)',
      emo: '⚡',
      start: {
        title: 'Power Plant',
        text: 'The white line is what the city is about to draw. Spin generators up and down so your green ' +
          'supply line sits on top of it: too little and the frequency falls, too much and you burn fuel for ' +
          'nothing. Three blackouts ends the shift roster.',
        keys: ['1–8 pick a unit', '↑ ↓ output', 'Space on/off']
      },
      init: reset,
      update: update,
      onKey: onKey,
      touchButtons: [{ key: 'up', label: '▲' }, { key: 'down', label: '▼' }]
    });
  }

  window.Milo.register({
    id: 'power-plant',
    title: 'Power Plant',
    emo: '⚡',
    category: 'Strategy',
    tagline: 'Hold fifty hertz while the city flicks the kettle on',
    description: 'You run the control room. A forecast demand curve scrolls toward you and your job is to keep ' +
      'total generation sitting on it: undersupply drags grid frequency below 50 Hz, oversupply pushes it over, ' +
      'and more than 1.45 Hz off for a second and a half is a blackout — a fine, shed load and one of your three ' +
      'strikes. Coal is cheap but needs six or seven seconds to spin up, gas answers instantly at three times ' +
      'the fuel bill, solar fades under a cloud bank, and a battery can be charged on surplus and sold back at ' +
      'the peak. Spinning reserve burns fuel whether or not anyone buys the power, so the real skill is starting ' +
      'coal early for the shocks you can see and trimming it back before the trough. Each shift raises the base ' +
      'load and sharpens the shocks; between shifts you buy plant, governor tuning, flywheels and more forecast. ' +
      'Tip: buy the forecast upgrade first — reacting to a spike is always too late.',
    controls: ['1–8', '↑ ↓', 'Space', 'Click'],
    colors: ['#4dffb8', '#0b2b26'],
    scoreLabel: 'dollars',
    tags: ['grid', 'management', 'sim', 'balance', 'energy'],
    mount: mount
  });
})();
