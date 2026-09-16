/* Burger Boss — read the ticket, stack it right, survive the lunch rush. */
(function () {
  'use strict';
  var ING = [
    { n: 'Bun', e: '🍞', c: '#e8a85a', k: '1' },
    { n: 'Patty', e: '🥩', c: '#6e3b2a', k: '2' },
    { n: 'Cheese', e: '🧀', c: '#ffc933', k: '3' },
    { n: 'Lettuce', e: '🥬', c: '#5fbf63', k: '4' },
    { n: 'Tomato', e: '🍅', c: '#e94b3c', k: '5' },
    { n: 'Onion', e: '🧅', c: '#d6b6e8', k: '6' },
    { n: 'Bacon', e: '🥓', c: '#b8352a', k: '7' },
    { n: 'Pickle', e: '🥒', c: '#3f9a3a', k: '8' },
    { n: 'Egg', e: '🍳', c: '#fff0b3', k: '9' },
    { n: 'Sauce', e: '🟠', c: '#f28c28', k: '0' }
  ];
  // The day each ingredient joins the menu (bun and the basics from day 1).
  var UNLOCK_DAY = [1, 1, 1, 1, 1, 2, 2, 3, 4, 5];
  var KEYS = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4, Digit6: 5, Digit7: 6, Digit8: 7, Digit9: 8, Digit0: 9 };
  var NAMES = ['Ava', 'Bo', 'Cleo', 'Dev', 'Eli', 'Fay', 'Gus', 'Hana', 'Ivo', 'Jo', 'Kai', 'Lou', 'Mia',
    'Ned', 'Oli', 'Pia', 'Quin', 'Rae', 'Sam', 'Tia', 'Uma', 'Vic', 'Wren', 'Yu', 'Zed'];
  var FACES = ['😀', '😊', '🙂', '😎', '🤓', '😋', '🧐', '🥸', '😺', '👩‍🦰', '👨‍🦱', '🧑‍🎤', '👵', '🧔', '👧', '🧕', '👷'];
  var UPG = [
    { id: 'pat', n: 'Patient regulars', e: '🪑', d: 'customers wait 15% longer', base: 40, max: 3 },
    { id: 'tip', n: 'Tip jar', e: '🫙', d: 'tips worth 30% more', base: 50, max: 3 },
    { id: 'grill', n: 'Flame grill', e: '🔥', d: 'combo grows faster', base: 60, max: 3 },
    { id: 'slot', n: 'Wider counter', e: '🧾', d: 'one more ticket on the rail', base: 90, max: 2 },
    { id: 'heart', n: 'Comfort break', e: '❤️', d: 'win back one heart', base: 35, max: 99 }
  ];
  var DAY_LEN = 68;
  var MAX_HEARTS = 5;
  var FONT = 'Outfit, ui-sans-serif, system-ui, sans-serif';

  function h(tag, css, html) {
    var n = document.createElement(tag);
    if (css) n.style.cssText = css;
    if (html != null) n.innerHTML = html;
    return n;
  }

  /* Particle overlay: steam puffs, coin sparks and floating pay-outs. */
  function makeFx(host) {
    var cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:4';
    var ctx = cv.getContext('2d');
    var ps = [], raf = 0, dead = false, last = performance.now();
    function size() {
      var r = host.getBoundingClientRect();
      var w = Math.max(1, r.width | 0), hh = Math.max(1, r.height | 0);
      if (cv.width !== w || cv.height !== hh) { cv.width = w; cv.height = hh; }
    }
    function loop(now) {
      if (dead) return;
      raf = requestAnimationFrame(loop);
      var dt = Math.min(.05, (now - last) / 1000); last = now;
      if (!ps.length) return;
      size();
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (var i = ps.length - 1; i >= 0; i--) {
        var p = ps[i];
        p.t += dt;
        if (p.t >= p.life) { ps.splice(i, 1); continue; }
        p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        var k = 1 - p.t / p.life;
        ctx.globalAlpha = Math.min(1, k * 1.6);
        if (p.kind === 'text') {
          ctx.font = '800 ' + p.s + 'px ' + FONT;
          ctx.textAlign = 'center';
          ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(30,12,4,.9)';
          ctx.strokeText(p.str, p.x, p.y);
          ctx.fillStyle = p.c; ctx.fillText(p.str, p.x, p.y);
        } else if (p.kind === 'steam') {
          ctx.fillStyle = p.c;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.s * (1 + p.t * 1.6), 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.fillStyle = p.c;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.s * k, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      if (!ps.length) ctx.clearRect(0, 0, cv.width, cv.height);
    }
    raf = requestAnimationFrame(loop);
    return {
      attach: function () { if (cv.parentNode !== host) host.appendChild(cv); },
      at: function (el) {
        var r = el.getBoundingClientRect(), hr = host.getBoundingClientRect();
        return { x: r.left - hr.left + r.width / 2, y: r.top - hr.top + r.height / 2 };
      },
      burst: function (x, y, n, cols, speed) {
        for (var i = 0; i < n; i++) {
          var a = Math.random() * Math.PI * 2, v = (speed || 120) * (.4 + Math.random());
          ps.push({ kind: 'dot', x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, g: 260,
            s: 3 + Math.random() * 4, c: cols[i % cols.length], t: 0, life: .5 + Math.random() * .5 });
        }
      },
      steam: function (x, y, n) {
        for (var i = 0; i < n; i++) {
          ps.push({ kind: 'steam', x: x + (Math.random() - .5) * 30, y: y, vx: (Math.random() - .5) * 20,
            vy: -40 - Math.random() * 40, g: -20, s: 4 + Math.random() * 5, c: 'rgba(255,240,220,.35)',
            t: 0, life: .8 + Math.random() * .5 });
        }
      },
      text: function (x, y, str, c, s) {
        ps.push({ kind: 'text', x: x, y: y, vx: 0, vy: -55, g: 0, s: s || 20, c: c, str: str, t: 0, life: 1.1 });
      },
      destroy: function () { dead = true; cancelAnimationFrame(raf); if (cv.parentNode) cv.parentNode.removeChild(cv); }
    };
  }

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var fx = makeFx(host);
    var els = {};

    /* ------------------------------------------------------------ state */
    function reset(g) {
      var d = g.data;
      d.day = 1;
      d.cash = 0;
      d.total = 0;
      d.hearts = MAX_HEARTS;
      d.combo = 0;
      d.bestCombo = 0;
      d.upg = { pat: 0, tip: 0, grill: 0, slot: 0, heart: 0 };
      d.served = 0;
      d.walkouts = 0;
      d.nextId = 1;
      d.phase = 'day';
      d.msg = ''; d.msgT = 0;
      startDayState(d);
      build(g);
      refreshAll(g);
    }

    function startDayState(d) {
      d.elapsed = 0;
      d.tickets = [];
      d.plate = [];
      d.plateBad = 0;
      d.sel = 0;
      d.spawnT = 1.2;
      d.rushAt = 20 + Math.random() * 14;
      d.rushLen = 16 + d.day * 1.5;
      d.rush = false;
      d.rushShown = false;
      d.dayServed = 0;
      d.dayTake = 0;
      d.dayWalk = 0;
      d.closing = false;
    }

    function maxSlots(d) { return 4 + d.upg.slot; }
    function unlocked(d) {
      var out = [];
      for (var i = 0; i < ING.length; i++) if (UNLOCK_DAY[i] <= d.day) out.push(i);
      return out;
    }

    function makeOrder(d) {
      var avail = unlocked(d).filter(function (i) { return i !== 0; });
      var lo = Math.min(1 + Math.floor((d.day - 1) / 2), 4);
      var hi = Math.min(2 + d.day, 7);
      var n = U.randInt(lo, hi);
      var items = [0];
      if (Math.random() > .12) items.push(1);
      while (items.length < n + 1) {
        var pick = U.choice(avail);
        // Avoid three identical layers in a row: nobody orders that.
        if (items.length >= 2 && items[items.length - 1] === pick && items[items.length - 2] === pick) continue;
        items.push(pick);
      }
      items.push(0);
      return items;
    }

    function orderName(items) {
      var patties = 0, has = {};
      items.slice(1, -1).forEach(function (i) { if (i === 1) patties++; has[i] = true; });
      var s = patties >= 3 ? 'triple ' : patties === 2 ? 'double ' : '';
      if (has[6]) s += 'bacon ';
      if (has[8]) s += 'brunch ';
      if (has[2]) s += 'cheese';
      else if (!patties) s += 'garden';
      else s += 'classic';
      return s.charAt(0).toUpperCase() + s.slice(1) + ' burger';
    }

    function spawnTicket(g) {
      var d = g.data;
      var items = makeOrder(d);
      var f = items.length - 2;
      var pay = 3 + f * 1.6;
      items.forEach(function (i) { if (i === 6) pay += 1; if (i === 8) pay += 1.5; if (i === 9) pay += .5; });
      var patience = (Math.max(13, 30 - d.day * 1.8) + f * 2.2) * (1 + .15 * d.upg.pat);
      var t = {
        id: d.nextId++, name: U.choice(NAMES), face: U.choice(FACES), items: items,
        pay: Math.round(pay * (d.rush ? 1.25 : 1)), patience: patience, max: patience, title: orderName(items)
      };
      d.tickets.push(t);
      Milo.sound.tone({ f: 880, f2: 1100, d: .08, v: .05, type: 'triangle' });
      paintTickets(g);
    }

    /* -------------------------------------------------------------- DOM */
    function build(g) {
      fx.attach();
      var wrap = h('div', 'width:100%;max-width:900px;margin:auto;display:flex;flex-direction:column;gap:9px;' +
        'font-family:' + FONT + ';color:#fff1d6;user-select:none;-webkit-user-select:none');

      // Day clock + rush banner
      var top = h('div', 'display:flex;align-items:center;gap:10px');
      els.dayLabel = h('div', 'font:800 15px/1 ' + FONT + ';letter-spacing:.04em;text-transform:uppercase;color:#ffd08a;white-space:nowrap');
      var clockWrap = h('div', 'flex:1;height:10px;border-radius:99px;background:rgba(0,0,0,.35);overflow:hidden;position:relative');
      els.clock = h('div', 'position:absolute;left:0;top:0;bottom:0;width:100%;background:linear-gradient(90deg,#ff9f1c,#ffd08a);transition:width .25s linear');
      els.rushMark = h('div', 'position:absolute;top:0;bottom:0;background:rgba(230,57,70,.55)');
      clockWrap.appendChild(els.rushMark);
      clockWrap.appendChild(els.clock);
      els.rush = h('div', 'display:none;font:900 13px/1 ' + FONT + ';letter-spacing:.12em;padding:6px 10px;border-radius:8px;' +
        'background:#e63946;color:#fff;animation:bbPulse .5s infinite alternate', 'LUNCH RUSH');
      top.appendChild(els.dayLabel); top.appendChild(clockWrap); top.appendChild(els.rush);

      // Ticket rail
      els.rail = h('div', 'display:flex;gap:8px;min-height:132px;align-items:stretch;overflow-x:auto;padding:4px 2px');
      els.rail.addEventListener('click', function (e) {
        var t = e.target.closest('[data-ticket]');
        if (!t) return;
        select(g, +t.getAttribute('data-ticket'));
      });

      // Plate + message
      var mid = h('div', 'display:flex;gap:12px;align-items:stretch');
      var plateCard = h('div', 'flex:0 0 190px;background:rgba(0,0,0,.28);border-radius:16px;padding:8px 10px 6px;' +
        'display:flex;flex-direction:column;align-items:center;justify-content:flex-end;position:relative;min-height:150px');
      els.plateTitle = h('div', 'position:absolute;top:8px;left:12px;font:700 11px/1 ' + FONT + ';letter-spacing:.1em;text-transform:uppercase;color:#c9a27a', 'Assembly plate');
      els.plate = h('div', 'display:flex;flex-direction:column-reverse;align-items:center;gap:2px;min-height:108px;justify-content:flex-start');
      els.tray = h('div', 'width:150px;height:8px;border-radius:99px;background:#8c5a3c;margin-top:4px;box-shadow:0 3px 0 #5a3823');
      plateCard.appendChild(els.plateTitle); plateCard.appendChild(els.plate); plateCard.appendChild(els.tray);
      els.plateCard = plateCard;

      var side = h('div', 'flex:1;display:flex;flex-direction:column;gap:6px;min-width:0');
      els.msg = h('div', 'font:700 15px/1.25 ' + FONT + ';min-height:38px;color:#ffd08a');
      els.target = h('div', 'font:600 13px/1.3 ' + FONT + ';color:#e7c7a3');
      var actions = h('div', 'display:flex;gap:8px;margin-top:auto;flex-wrap:wrap');
      var trashBtn = h('button', btnCss('#5a3823', '#fff1d6') + 'flex:1;min-width:120px', '🗑️ Trash plate <kbd style="' + kbdCss() + '">⌫</kbd>');
      trashBtn.type = 'button';
      trashBtn.addEventListener('click', function () { trash(g); });
      var nextBtn = h('button', btnCss('#5a3823', '#fff1d6') + 'flex:1;min-width:120px', '⏭️ Next ticket <kbd style="' + kbdCss() + '">Space</kbd>');
      nextBtn.type = 'button';
      nextBtn.addEventListener('click', function () { cycle(g, 1); });
      actions.appendChild(trashBtn); actions.appendChild(nextBtn);
      side.appendChild(els.msg); side.appendChild(els.target); side.appendChild(actions);
      mid.appendChild(plateCard); mid.appendChild(side);

      // Ingredient buttons
      els.bar = h('div', 'display:grid;grid-template-columns:repeat(5,1fr);gap:6px');
      els.bar.addEventListener('click', function (e) {
        var b = e.target.closest('[data-ing]');
        if (b) place(g, +b.getAttribute('data-ing'));
      });

      var style = h('style', null,
        '@keyframes bbPulse{from{opacity:.75}to{opacity:1}}' +
        '@keyframes bbShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}' +
        '@keyframes bbPop{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}' +
        '@keyframes bbSlide{from{transform:translateY(-14px);opacity:0}to{transform:translateY(0);opacity:1}}');

      wrap.appendChild(style);
      wrap.appendChild(top);
      wrap.appendChild(els.rail);
      wrap.appendChild(mid);
      wrap.appendChild(els.bar);
      g.root.innerHTML = '';
      g.root.appendChild(wrap);
    }

    function btnCss(bg, col) {
      return 'border:0;border-radius:12px;padding:9px 10px;cursor:pointer;font:700 13px/1 ' + FONT + ';' +
        'background:' + bg + ';color:' + col + ';display:flex;align-items:center;justify-content:center;gap:6px;' +
        'box-shadow:0 3px 0 rgba(0,0,0,.35);';
    }
    function kbdCss() {
      return 'font:700 10px/1 ' + FONT + ';padding:3px 5px;border-radius:5px;background:rgba(0,0,0,.35);color:#ffd08a;border:1px solid rgba(255,255,255,.12)';
    }

    function layerHtml(i, w, hgt) {
      var ing = ING[i];
      return '<div style="width:' + w + 'px;height:' + hgt + 'px;border-radius:' + (i === 0 ? '8px 8px 4px 4px' : '5px') +
        ';background:' + ing.c + ';display:flex;align-items:center;justify-content:center;font-size:' + Math.round(hgt * .8) +
        'px;line-height:1;box-shadow:inset 0 -2px 0 rgba(0,0,0,.25);animation:bbPop .16s ease-out">' + ing.e + '</div>';
    }

    function paintTickets(g) {
      var d = g.data;
      els.rail.innerHTML = d.tickets.map(function (t, k) {
        var selected = k === d.sel;
        return '<div data-ticket="' + k + '" style="flex:0 0 118px;background:#fff8e7;color:#3a2416;border-radius:6px 6px 10px 10px;' +
          'padding:7px 8px 8px;cursor:pointer;position:relative;display:flex;flex-direction:column;gap:4px;animation:bbSlide .25s ease-out;' +
          'outline:' + (selected ? '3px solid #ff9f1c' : '3px solid transparent') + ';box-shadow:0 4px 12px rgba(0,0,0,.35);' +
          'background-image:repeating-linear-gradient(0deg,transparent 0 18px,rgba(0,0,0,.035) 18px 19px)">' +
          '<div style="display:flex;align-items:center;gap:5px;font:800 12px/1 ' + FONT + '"><span style="font-size:18px">' + t.face +
          '</span><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + t.name + '</span><span style="color:#9c6b3f">#' + t.id + '</span></div>' +
          '<div style="font:600 10px/1.1 ' + FONT + ';color:#7a5535;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + t.title + '</div>' +
          '<div style="display:flex;flex-direction:column-reverse;align-items:center;gap:1px;flex:1;justify-content:flex-start;min-height:52px">' +
          t.items.map(function (i) {
            return '<div style="width:' + (i === 0 ? 46 : 40) + 'px;height:9px;border-radius:3px;background:' + ING[i].c +
              ';box-shadow:inset 0 -1px 0 rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;font-size:8px;line-height:1">' + ING[i].e + '</div>';
          }).join('') + '</div>' +
          '<div style="display:flex;align-items:center;gap:5px;font:800 11px/1 ' + FONT + '"><span style="color:#2f7d32">$' + t.pay + '</span>' +
          '<div style="flex:1;height:6px;border-radius:99px;background:rgba(0,0,0,.12);overflow:hidden"><div data-bar="' + k + '" style="height:100%;width:' +
          (t.patience / t.max * 100) + '%;background:#2f7d32;border-radius:99px"></div></div></div></div>';
      }).join('') + (d.tickets.length ? '' :
        '<div style="flex:1;display:grid;place-items:center;color:#c9a27a;font:600 13px ' + FONT + '">' +
        (d.closing ? 'Last orders served — closing up…' : 'Waiting for customers…') + '</div>');
      paintTarget(g);
    }

    function tickBars(g) {
      var d = g.data;
      var bars = els.rail.querySelectorAll('[data-bar]');
      for (var i = 0; i < bars.length; i++) {
        var t = d.tickets[+bars[i].getAttribute('data-bar')];
        if (!t) continue;
        var f = t.patience / t.max;
        bars[i].style.width = (f * 100) + '%';
        bars[i].style.background = f > .5 ? '#2f7d32' : f > .25 ? '#e0a020' : '#d62828';
      }
      var left = Math.max(0, DAY_LEN - d.elapsed);
      els.clock.style.width = (left / DAY_LEN * 100) + '%';
      els.rushMark.style.left = ((DAY_LEN - d.rushAt - d.rushLen) / DAY_LEN * 100) + '%';
      els.rushMark.style.width = (d.rushLen / DAY_LEN * 100) + '%';
      els.dayLabel.textContent = 'Day ' + d.day + ' · ' + Math.ceil(left) + 's';
      els.rush.style.display = d.rush ? '' : 'none';
    }

    function paintPlate(g) {
      var d = g.data;
      var t = d.tickets[d.sel];
      els.plate.innerHTML = d.plate.map(function (i, k) {
        var wrong = t && t.items[k] !== i;
        var html = layerHtml(i, i === 0 ? 132 : 118, 18);
        if (wrong) html = html.replace('box-shadow:', 'outline:2px solid #ff3b3b;box-shadow:');
        return html;
      }).join('');
      if (!d.plate.length) els.plate.innerHTML = '<div style="color:#8c6a4c;font:600 12px ' + FONT + ';padding:40px 0">Press 1 for a bun</div>';
    }

    function paintTarget(g) {
      var d = g.data;
      var t = d.tickets[d.sel];
      if (!t) { els.target.textContent = 'No ticket selected. Orders appear on the rail above.'; return; }
      var next = t.items[d.plate.length];
      els.target.innerHTML = 'Building <b style="color:#ffd08a">#' + t.id + ' ' + t.title + '</b> for ' + t.name +
        (next != null ? ' · next: <b>' + ING[next].e + ' ' + ING[next].n + '</b>' : '') +
        ' · combo <b style="color:#ff9f1c">×' + comboMult(d).toFixed(1) + '</b>';
    }

    function paintBar(g) {
      var d = g.data;
      var un = unlocked(d);
      els.bar.innerHTML = ING.map(function (ing, i) {
        var on = un.indexOf(i) !== -1;
        return '<button type="button" data-ing="' + i + '" ' + (on ? '' : 'disabled') + ' style="' + btnCss(on ? ing.c : '#3a2a22', on ? (i === 1 || i === 6 || i === 3 || i === 7 ? '#fff' : '#2a1608') : '#7a5a4a') +
          'flex-direction:column;gap:3px;padding:7px 4px;opacity:' + (on ? 1 : .5) + '">' +
          '<span style="font-size:22px;line-height:1">' + (on ? ing.e : '🔒') + '</span>' +
          '<span style="display:flex;align-items:center;gap:4px"><span>' + (on ? ing.n : 'Day ' + UNLOCK_DAY[i]) + '</span>' +
          '<kbd style="' + kbdCss() + ';color:inherit;background:rgba(0,0,0,.18)">' + ing.k + '</kbd></span></button>';
      }).join('');
    }

    function setMsg(g, str, col) {
      var d = g.data;
      d.msg = str; d.msgT = 2.4;
      els.msg.textContent = str;
      els.msg.style.color = col || '#ffd08a';
    }

    function refreshHud(g) {
      var d = g.data;
      g.score = Math.round(d.total);
      g.set('Cash', '$' + Math.round(d.cash));
      g.set('Day', d.day);
      g.set('Combo', '×' + comboMult(d).toFixed(1));
      var hs = '';
      for (var i = 0; i < MAX_HEARTS; i++) hs += i < d.hearts ? '❤️' : '🖤';
      g.set('Hearts', hs);
    }

    function refreshAll(g) {
      paintTickets(g); paintPlate(g); paintBar(g); tickBars(g); refreshHud(g);
      els.msg.textContent = g.data.msg || 'Match the highlighted ticket, bottom bun first.';
    }

    /* ------------------------------------------------------------ rules */
    function comboMult(d) { return Math.min(3, 1 + d.combo * (.1 + .05 * d.upg.grill)); }

    function select(g, k) {
      var d = g.data;
      if (k < 0 || k >= d.tickets.length) return;
      d.sel = k;
      Milo.sound.click();
      paintTickets(g); paintPlate(g);
    }
    function cycle(g, dir) {
      var d = g.data;
      if (!d.tickets.length) return;
      select(g, (d.sel + dir + d.tickets.length) % d.tickets.length);
    }

    function place(g, i) {
      var d = g.data;
      if (d.phase !== 'day' || g.state !== 'play') return;
      if (unlocked(d).indexOf(i) === -1) return;
      if (i === 0 && d.plate.length > 0) { d.plate.push(0); serve(g); return; }
      if (i !== 0 && !d.plate.length) { setMsg(g, 'Start with a bun!', '#ff8f8f'); Milo.sound.tone({ f: 160, d: .1, v: .06, type: 'square' }); return; }
      if (d.plate.length >= 10) { setMsg(g, 'That tower is not going to fit. Trash it.', '#ff8f8f'); return; }
      d.plate.push(i);
      var t = d.tickets[d.sel];
      var ok = t && t.items[d.plate.length - 1] === i;
      if (!ok) {
        d.plateBad++;
        Milo.sound.tone({ f: 200, f2: 120, d: .14, v: .07, type: 'sawtooth' });
        els.plateCard.style.animation = 'none';
        void els.plateCard.offsetWidth;
        els.plateCard.style.animation = 'bbShake .25s';
      } else {
        Milo.sound.tone({ f: 420 + d.plate.length * 40, f2: 520 + d.plate.length * 40, d: .06, v: .07, type: 'triangle' });
        var p = fx.at(els.plate);
        if (i === 1 || i === 6 || i === 8) fx.steam(p.x, p.y - 20, 4);
      }
      paintPlate(g); paintTarget(g);
    }

    function sameOrder(a, b) {
      if (a.length !== b.length) return false;
      for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
      return true;
    }

    function serve(g) {
      var d = g.data;
      var k = -1;
      if (d.tickets[d.sel] && sameOrder(d.tickets[d.sel].items, d.plate)) k = d.sel;
      else for (var i = 0; i < d.tickets.length; i++) if (sameOrder(d.tickets[i].items, d.plate)) { k = i; break; }
      var p = fx.at(els.plate);
      if (k === -1) {
        d.combo = 0;
        var t0 = d.tickets[d.sel];
        if (t0) t0.patience = Math.max(0.5, t0.patience - t0.max * .25);
        setMsg(g, 'Wrong order — sent back to the kitchen!', '#ff8f8f');
        fx.text(p.x, p.y - 30, 'SENT BACK', '#ff5a5a', 22);
        Milo.sound.hit();
      } else {
        var t = d.tickets[k];
        var clean = d.plateBad === 0;
        if (clean) d.combo++; else d.combo = 0;
        d.bestCombo = Math.max(d.bestCombo, d.combo);
        var tip = t.pay * .5 * (t.patience / t.max) * (1 + .3 * d.upg.tip);
        var earned = Math.round((t.pay + tip) * comboMult(d));
        d.cash += earned; d.total += earned; d.dayTake += earned;
        d.served++; d.dayServed++;
        d.tickets.splice(k, 1);
        if (d.sel >= d.tickets.length) d.sel = Math.max(0, d.tickets.length - 1);
        setMsg(g, (clean ? 'Perfect build! ' : 'Served, but messy. ') + t.name + ' paid $' + earned + (tip > 0.5 ? ' (tip $' + Math.round(tip * comboMult(d)) + ')' : ''), clean ? '#8fe09b' : '#ffd08a');
        fx.text(p.x, p.y - 40, '+$' + earned + (clean && d.combo > 1 ? '  ×' + d.combo : ''), clean ? '#8fe09b' : '#ffd08a', 24);
        fx.burst(p.x, p.y - 10, 16, ['#ffd08a', '#ff9f1c', '#fff1d6'], 160);
        if (clean) Milo.sound.coin(); else Milo.sound.tone({ f: 500, d: .08, v: .06, type: 'triangle' });
        if (clean && d.combo > 0 && d.combo % 5 === 0) Milo.sound.powerup();
      }
      d.plate = []; d.plateBad = 0;
      paintTickets(g); paintPlate(g); refreshHud(g);
    }

    function trash(g) {
      var d = g.data;
      if (d.phase !== 'day' || !d.plate.length) return;
      d.plate = []; d.plateBad = 0;
      var p = fx.at(els.plate);
      fx.burst(p.x, p.y, 10, ['#8c5a3c', '#5fbf63', '#e94b3c'], 90);
      Milo.sound.tone({ f: 260, f2: 90, d: .18, v: .07, type: 'triangle' });
      paintPlate(g); paintTarget(g);
    }

    function walkOut(g, k) {
      var d = g.data;
      var t = d.tickets[k];
      d.tickets.splice(k, 1);
      if (d.sel >= d.tickets.length) d.sel = Math.max(0, d.tickets.length - 1);
      d.hearts--; d.walkouts++; d.dayWalk++;
      d.combo = 0;
      setMsg(g, t.name + ' gave up waiting and walked out.', '#ff8f8f');
      var p = fx.at(els.rail);
      fx.text(p.x, p.y, '💔 walked out', '#ff5a5a', 20);
      Milo.sound.lose();
      paintTickets(g); paintPlate(g); refreshHud(g);
      if (d.hearts <= 0) {
        d.phase = 'over';
        g.gameOver({
          emo: '🍔', title: 'Kitchen closed',
          text: 'Too many customers walked out. You lasted ' + d.day + ' day' + (d.day > 1 ? 's' : '') + ', served ' + d.served +
            ' orders and took $' + Math.round(d.total) + '. Best combo ×' + d.bestCombo + '.',
          score: Math.round(d.total)
        });
      }
    }

    /* ----------------------------------------------------------- days */
    function endDay(g) {
      var d = g.data;
      d.phase = 'shop';
      Milo.sound.win();
      openShop(g);
    }

    function upgCost(d, u) { return Math.round(u.base * Math.pow(1.6, d.upg[u.id])); }

    function openShop(g) {
      var d = g.data;
      var acts = [];
      UPG.forEach(function (u) {
        var lvl = d.upg[u.id];
        if (lvl >= u.max) return;
        if (u.id === 'heart' && d.hearts >= MAX_HEARTS) return;
        var cost = upgCost(d, u);
        var can = d.cash >= cost;
        acts.push({
          label: u.e + ' ' + u.n + (lvl && u.id !== 'heart' ? ' ' + (lvl + 1) : '') + ' · $' + cost + (can ? '' : ' 🔒'),
          onClick: function () {
            if (d.cash < cost) { Milo.sound.tone({ f: 140, d: .12, v: .06, type: 'square' }); return; }
            d.cash -= cost;
            d.upg[u.id]++;
            if (u.id === 'heart') d.hearts = Math.min(MAX_HEARTS, d.hearts + 1);
            Milo.sound.powerup();
            refreshHud(g);
            openShop(g);
          }
        });
      });
      acts.push({ label: '▶  Open day ' + (d.day + 1), primary: true, onClick: function () { startDay(g); } });
      var newIng = ING.filter(function (x, i) { return UNLOCK_DAY[i] === d.day + 1; }).map(function (x) { return x.e + ' ' + x.n; });
      g.overlay({
        emo: '🧾',
        title: 'Day ' + d.day + ' closed',
        text: 'Served ' + d.dayServed + ' · walk-outs ' + d.dayWalk + ' · takings $' + d.dayTake + '. Cash on hand $' + Math.round(d.cash) + '.' +
          (newIng.length ? ' Tomorrow the menu adds ' + newIng.join(' and ') + '.' : ' Tomorrow: faster orders, shorter tempers.'),
        actions: acts,
        hint: 'Upgrades cost cash. Your score counts every dollar you ever took, spent or not.'
      });
    }

    function startDay(g) {
      var d = g.data;
      d.day++;
      startDayState(d);
      d.phase = 'day';
      g.clearOverlay();
      setMsg(g, 'Day ' + d.day + ' — doors open!', '#8fe09b');
      paintBar(g); paintTickets(g); paintPlate(g); tickBars(g); refreshHud(g);
      Milo.sound.blip();
    }

    /* ---------------------------------------------------------- update */
    function update(g, dt) {
      var d = g.data;
      if (d.phase !== 'day') return;
      d.elapsed += dt;
      if (d.msgT > 0) { d.msgT -= dt; if (d.msgT <= 0) els.msg.style.color = '#ffd08a'; }

      var inRush = d.elapsed > d.rushAt && d.elapsed < d.rushAt + d.rushLen && d.elapsed < DAY_LEN;
      if (inRush && !d.rush) {
        d.rush = true;
        setMsg(g, 'LUNCH RUSH! Orders come twice as fast and pay 25% more.', '#ff8f8f');
        Milo.sound.tone({ f: 330, f2: 660, d: .3, v: .08, type: 'square' });
        var p = fx.at(els.rail);
        fx.burst(p.x, p.y, 30, ['#e63946', '#ff9f1c', '#fff'], 220);
      } else if (!inRush && d.rush) {
        d.rush = false;
        setMsg(g, 'Rush over. Breathe.', '#8fe09b');
      }

      if (d.elapsed < DAY_LEN) {
        d.spawnT -= dt;
        if (d.spawnT <= 0 && d.tickets.length < maxSlots(d)) {
          spawnTicket(g);
          d.spawnT = Math.max(2.6, 7.2 - d.day * .55) * (d.rush ? .5 : 1) * U.rand(.8, 1.2);
        }
      } else if (!d.closing) {
        d.closing = true;
        setMsg(g, 'Closing time — finish the tickets on the rail.', '#ffd08a');
        paintTickets(g);
      }

      for (var i = d.tickets.length - 1; i >= 0; i--) {
        var t = d.tickets[i];
        t.patience -= dt;
        if (t.patience <= 0) { walkOut(g, i); if (d.phase !== 'day') return; }
      }
      tickBars(g);

      if (d.closing && !d.tickets.length) endDay(g);
    }

    function onKey(g, e) {
      var d = g.data;
      if (d.phase !== 'day') return;
      if (KEYS[e.code] != null) { e.preventDefault(); place(g, KEYS[e.code]); return; }
      if (e.code === 'Backspace' || e.code === 'Delete') { e.preventDefault(); trash(g); return; }
      if (e.code === 'ArrowRight' || e.code === 'Tab' || e.code === 'Space' || e.code === 'ArrowDown') { e.preventDefault(); cycle(g, 1); return; }
      if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') { e.preventDefault(); cycle(g, -1); return; }
    }

    return Milo.domGame(host, {
      id: 'burger-boss',
      stats: ['Cash', 'Day', 'Combo', 'Hearts'],
      bg: 'radial-gradient(circle at 50% 0%, #4a2a1a, #221109 60%, #150a05)',
      emo: '🍔',
      start: {
        title: 'Burger Boss',
        text: 'Tickets land on the rail with a burger drawn bottom-up. Stack the same layers in the same order — ' +
          'bun first, bun last — before the customer\'s patience bar runs dry. Clean builds chain a combo that ' +
          'multiplies pay; five walk-outs and the kitchen closes.',
        keys: ['1–0 ingredients', '⌫ trash', 'Space next ticket']
      },
      init: reset,
      update: update,
      onKey: onKey,
      destroy: function () { fx.destroy(); }
    });
  }

  window.Milo.register({
    id: 'burger-boss', title: 'Burger Boss', emo: '🍔', category: 'Casual',
    tagline: 'Stack the ticket exactly, beat the lunch rush',
    description: 'Tickets arrive on the rail with the burger drawn layer by layer; you press the ingredient keys ' +
      'in that same order, bottom bun to top bun, and the top bun serves it. Every clean build (no mislaid layer) ' +
      'raises a combo multiplier on pay, plus a tip that shrinks as the customer\'s patience bar drains. Each day ' +
      'is 68 seconds with a lunch rush that doubles order speed; days add ingredients, longer orders and shorter ' +
      'tempers, and between days you spend cash on upgrades like a wider counter or a tip jar. Five walk-outs ' +
      'closes the kitchen. Tip: when a mistake shows red on the plate, trash it straight away — a wrong serve ' +
      'costs the customer a quarter of their patience.',
    controls: ['1–0 ingredients', 'Backspace trash', 'Space / ← → tickets', 'Click'],
    colors: ['#ff9f1c', '#6e3b2a'],
    scoreLabel: 'dollars',
    tags: ['cooking', 'time management', 'restaurant', 'sim', 'combo'],
    mount: mount
  });
})();
