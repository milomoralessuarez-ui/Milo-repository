/* Lemonade Stand — read the sky, set the recipe and the price, run the day. */
(function () {
  'use strict';
  var DAYS = 14;
  var SELL_LEN = 16;
  var FONT = 'Outfit, ui-sans-serif, system-ui, sans-serif';
  var WEATHER = [
    { id: 'rain', n: 'Rain', e: '🌧️', temp: [14, 19], traffic: .32, willing: .55, sky: ['#4b5d78', '#2c3547'] },
    { id: 'cloud', n: 'Cloudy', e: '⛅', temp: [18, 23], traffic: .8, willing: .85, sky: ['#7fa2c7', '#4e6f94'] },
    { id: 'sun', n: 'Sunny', e: '☀️', temp: [23, 28], traffic: 1.2, willing: 1.15, sky: ['#5ec8f5', '#2a8fd6'] },
    { id: 'hot', n: 'Scorching', e: '🔥', temp: [29, 36], traffic: 1.55, willing: 1.55, sky: ['#ffb347', '#ff6f3c'] }
  ];
  var STOCK = [
    { id: 'lemons', n: 'Lemons', e: '🍋', price: .45, pack: 6 },
    { id: 'sugar', n: 'Sugar', e: '🍬', price: .25, pack: 8 },
    { id: 'ice', n: 'Ice', e: '🧊', price: .06, pack: 25 },
    { id: 'cups', n: 'Cups', e: '🥤', price: .05, pack: 20 }
  ];
  var EVENTS = [
    { id: 'heat', n: 'Heat wave', e: '🥵', d: 'Ten degrees hotter than forecast. Everyone wants ice.', traffic: 1.5, willing: 1.3, temp: 10, ice: 2 },
    { id: 'fair', n: 'Street fair', e: '🎪', d: 'Main Street is packed all day.', traffic: 2.1, willing: 1.05 },
    { id: 'works', n: 'Road works', e: '🚧', d: 'Half the street is fenced off. Thin crowd.', traffic: .5, willing: 1 },
    { id: 'rival', n: 'Rival stand', e: '😤', d: 'A rival stand opened across the road. People compare prices.', traffic: 1, willing: .68 },
    { id: 'lemons', n: 'Lemon shortage', e: '📈', d: 'The market doubled lemon prices today.', traffic: 1, willing: 1, lemonPrice: 2 },
    { id: 'school', n: 'School\'s out', e: '🎒', d: 'Kids everywhere — lots of thirsty small budgets.', traffic: 1.45, willing: .8 },
    { id: 'news', n: 'Local news', e: '📰', d: 'The paper ran a piece on your stand. Reputation +10.', traffic: 1.2, willing: 1.05, rep: 10 },
    { id: 'sugar', n: 'Sugar sale', e: '🏷️', d: 'Sugar is half price at the store today.', traffic: 1, willing: 1, sugarPrice: .5 },
    { id: 'crew', n: 'Construction crew', e: '👷', d: 'A crew of eight ordered ahead. They pay up to $2 a cup.', traffic: 1.1, willing: 1, crew: 8 },
    { id: 'storm', n: 'Storm warning', e: '⛈️', d: 'Forecast says sun, the sky says otherwise.', traffic: .35, willing: .6, force: 0 }
  ];
  var WALKERS = ['🚶', '🚶‍♀️', '🧑‍🦱', '👩‍🦳', '🧒', '👨‍🦰', '👩‍🦱', '🧓', '🏃', '👩‍🎤', '🧑‍💼', '👷'];

  function h(tag, css, html) {
    var n = document.createElement(tag);
    if (css) n.style.cssText = css;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function money(v) { return '$' + (Math.round(v * 100) / 100).toFixed(2); }

  function makeFx(host) {
    var cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:4';
    var ctx = cv.getContext('2d');
    var ps = [], raf = 0, dead = false, last = performance.now(), rain = 0;
    function size() {
      var r = host.getBoundingClientRect();
      var w = Math.max(1, r.width | 0), hh = Math.max(1, r.height | 0);
      if (cv.width !== w || cv.height !== hh) { cv.width = w; cv.height = hh; }
    }
    function loop(now) {
      if (dead) return;
      raf = requestAnimationFrame(loop);
      var dt = Math.min(.05, (now - last) / 1000); last = now;
      size();
      if (rain > 0) {
        for (var r = 0; r < rain * dt * 60; r++) {
          ps.push({ kind: 'rain', x: Math.random() * cv.width, y: -10, vx: -60, vy: 520, g: 0, t: 0, life: cv.height / 500, c: 'rgba(200,220,255,.5)' });
        }
      }
      if (!ps.length) { ctx.clearRect(0, 0, cv.width, cv.height); return; }
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (var i = ps.length - 1; i >= 0; i--) {
        var p = ps[i];
        p.t += dt;
        if (p.t >= p.life) { ps.splice(i, 1); continue; }
        p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        var k = 1 - p.t / p.life;
        if (p.kind === 'rain') {
          ctx.strokeStyle = p.c; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 2, p.y - 12); ctx.stroke();
        } else if (p.kind === 'text') {
          ctx.globalAlpha = Math.min(1, k * 1.5);
          ctx.font = '800 ' + p.s + 'px ' + FONT; ctx.textAlign = 'center';
          ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(40,30,0,.85)'; ctx.strokeText(p.str, p.x, p.y);
          ctx.fillStyle = p.c; ctx.fillText(p.str, p.x, p.y);
          ctx.globalAlpha = 1;
        } else if (p.kind === 'emo') {
          ctx.globalAlpha = Math.min(1, k * 1.5);
          ctx.font = p.s + 'px sans-serif'; ctx.textAlign = 'center';
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.t * p.spin); ctx.fillText(p.str, 0, p.s / 3); ctx.restore();
          ctx.globalAlpha = 1;
        } else {
          ctx.globalAlpha = Math.min(1, k * 1.5);
          ctx.fillStyle = p.c;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.s * k, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    }
    raf = requestAnimationFrame(loop);
    return {
      attach: function () { if (cv.parentNode !== host) host.appendChild(cv); },
      setRain: function (r) { rain = r; },
      at: function (el) {
        var r = el.getBoundingClientRect(), hr = host.getBoundingClientRect();
        return { x: r.left - hr.left + r.width / 2, y: r.top - hr.top + r.height / 2, w: r.width, h: r.height, l: r.left - hr.left, t: r.top - hr.top };
      },
      coins: function (x, y, n) {
        for (var i = 0; i < n; i++) {
          var a = -Math.PI / 2 + (Math.random() - .5) * 1.6, v = 120 + Math.random() * 120;
          ps.push({ kind: 'dot', x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 420, s: 3 + Math.random() * 3,
            c: i % 2 ? '#ffd23f' : '#fff7c2', t: 0, life: .7 + Math.random() * .4 });
        }
      },
      emo: function (x, y, str, n) {
        for (var i = 0; i < n; i++) {
          var a = -Math.PI / 2 + (Math.random() - .5) * 2, v = 90 + Math.random() * 110;
          ps.push({ kind: 'emo', x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 380, s: 14 + Math.random() * 8,
            spin: (Math.random() - .5) * 10, str: str, t: 0, life: .8 + Math.random() * .5 });
        }
      },
      text: function (x, y, str, c, s) {
        ps.push({ kind: 'text', x: x, y: y, vx: 0, vy: -50, g: 0, s: s || 18, c: c, str: str, t: 0, life: 1.1 });
      },
      destroy: function () { dead = true; cancelAnimationFrame(raf); if (cv.parentNode) cv.parentNode.removeChild(cv); }
    };
  }

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var fx = makeFx(host);
    var els = {};

    /* ----------------------------------------------------------- state */
    function reset(g) {
      var d = g.data;
      d.day = 1;
      d.cash = 20;
      d.rep = 50;
      d.stock = { lemons: 0, sugar: 0, ice: 0, cups: 0 };
      d.recipe = { lemons: 4, sugar: 4, ice: 3 };
      d.price = 1.0;
      d.totalSold = 0;
      d.log = [];
      d.phase = 'plan';
      d.forecast = null;
      d.event = null;
      d.actual = null;
      d.temp = 24;
      d.walkers = [];
      d.spawnT = 0;
      d.sellT = 0;
      d.pitcher = 0;
      d.sold = 0; d.revenue = 0; d.passed = 0; d.turnedAway = 0;
      d.wave = 0; d.waveCd = 0;
      d.crewLeft = 0;
      d.ended = false;
      rollDay(d);
      build(g);
      paintAll(g);
    }

    function pickWeather(day) {
      // Later in the season it gets hotter on average.
      var r = Math.random() + day * .02;
      return r < .17 ? 0 : r < .42 ? 1 : r < .8 ? 2 : 3;
    }

    function rollDay(d) {
      var w = pickWeather(d.day);
      d.forecast = w;
      d.actual = Math.random() < .78 ? w : U.clamp(w + (Math.random() < .5 ? -1 : 1), 0, 3);
      d.event = null;
      if (d.day >= 2 && Math.random() < .6) {
        d.event = U.choice(EVENTS);
        if (d.event.force != null) d.actual = d.event.force;
        if (d.event.id === 'heat' && d.actual < 2) d.actual = 2;
      }
      var wt = WEATHER[d.actual];
      d.temp = U.randInt(wt.temp[0], wt.temp[1]) + (d.event && d.event.temp ? d.event.temp : 0);
      d.forecastTemp = U.randInt(WEATHER[d.forecast].temp[0], WEATHER[d.forecast].temp[1]);
    }

    function stockPrice(d, id) {
      var s = STOCK.filter(function (x) { return x.id === id; })[0];
      var p = s.price;
      if (d.event && d.event.lemonPrice && id === 'lemons') p *= d.event.lemonPrice;
      if (d.event && d.event.sugarPrice && id === 'sugar') p *= d.event.sugarPrice;
      return p;
    }

    function idealIce(d) { return d.temp >= 30 ? 5 : d.temp >= 26 ? 4 : d.temp >= 22 ? 3 : d.temp >= 18 ? 2 : 1; }
    function taste(d, useActual) {
      var r = d.recipe;
      var ice = useActual ? idealIce(d) : idealIce({ temp: d.forecastTemp });
      var a = 1 - Math.abs(r.lemons - 4) / 5, b = 1 - Math.abs(r.sugar - 4) / 5, c = 1 - Math.abs(r.ice - ice) / 5;
      return U.clamp((a * .4 + b * .35 + c * .25), 0, 1);
    }
    function costPerCup(d) {
      var r = d.recipe;
      return (r.lemons * stockPrice(d, 'lemons') + r.sugar * stockPrice(d, 'sugar')) / 10 + r.ice * stockPrice(d, 'ice') + stockPrice(d, 'cups');
    }
    function stars(v) {
      var n = Math.round(v * 5), s = '';
      for (var i = 0; i < 5; i++) s += i < n ? '★' : '☆';
      return s;
    }
    function cupsPossible(d) {
      var r = d.recipe;
      var pitchers = Math.min(Math.floor(d.stock.lemons / r.lemons), Math.floor(d.stock.sugar / r.sugar));
      var cups = pitchers * 10 + d.pitcher;
      var byIce = r.ice ? Math.floor(d.stock.ice / r.ice) : 1e9;
      return Math.max(0, Math.min(cups, byIce, d.stock.cups));
    }

    /* ------------------------------------------------------------- DOM */
    function build(g) {
      fx.attach();
      var wrap = h('div', 'width:100%;max-width:900px;margin:auto;display:flex;flex-direction:column;gap:8px;' +
        'font-family:' + FONT + ';color:#fff9e6;user-select:none;-webkit-user-select:none');
      var style = h('style', null,
        '@keyframes lsWalk{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}' +
        '@keyframes lsPop{from{transform:scale(.5);opacity:0}to{transform:scale(1);opacity:1}}' +
        '@keyframes lsBob{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(6deg)}}' +
        '.ls-btn{border:0;border-radius:10px;cursor:pointer;font:800 13px/1 ' + FONT + ';padding:8px 10px;color:#3a2a00;background:#ffe45c;box-shadow:0 3px 0 #c9a600;transition:transform .08s}' +
        '.ls-btn:active{transform:translateY(2px);box-shadow:0 1px 0 #c9a600}' +
        '.ls-btn.sec{background:rgba(255,255,255,.16);color:#fff9e6;box-shadow:0 3px 0 rgba(0,0,0,.25)}' +
        '.ls-btn.sec:active{box-shadow:0 1px 0 rgba(0,0,0,.25)}' +
        '.ls-btn:disabled{opacity:.45;cursor:default}' +
        '.ls-card{background:rgba(15,25,45,.45);border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:10px 12px;backdrop-filter:blur(4px)}' +
        '.ls-row{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px dashed rgba(255,255,255,.12)}' +
        '.ls-row:last-child{border-bottom:0}' +
        '.ls-lab{font:700 11px/1 ' + FONT + ';letter-spacing:.12em;text-transform:uppercase;color:#ffe45c;margin-bottom:6px}');
      wrap.appendChild(style);

      // Header: forecast + event
      els.head = h('div', 'display:flex;gap:8px;flex-wrap:wrap;align-items:stretch');
      wrap.appendChild(els.head);

      // Plan panel
      els.plan = h('div', 'display:grid;grid-template-columns:1fr 1fr;gap:8px');
      els.stockCard = h('div', 'ls-card');
      els.stockCard.className = 'ls-card';
      els.recipeCard = h('div');
      els.recipeCard.className = 'ls-card';
      els.plan.appendChild(els.stockCard); els.plan.appendChild(els.recipeCard);
      wrap.appendChild(els.plan);

      // Sell panel
      els.sell = h('div', 'display:none;flex-direction:column;gap:8px');
      els.street = h('div', 'position:relative;height:120px;border-radius:14px;overflow:hidden;' +
        'background:linear-gradient(180deg,rgba(255,255,255,.08) 0,rgba(255,255,255,.08) 55%,#6b6b6b 55%,#6b6b6b 62%,#d9c27a 62%,#c9b06a 100%)');
      els.stand = h('div', 'position:absolute;left:50%;top:22px;transform:translateX(-50%);width:90px;height:64px;text-align:center;font-size:12px;font-weight:800;color:#3a2a00');
      els.stand.innerHTML = '<div style="background:repeating-linear-gradient(90deg,#ffe45c 0 12px,#fff 12px 24px);height:14px;border-radius:6px 6px 0 0;box-shadow:0 2px 0 rgba(0,0,0,.2)"></div>' +
        '<div style="background:#f5d68a;height:34px;border-radius:0 0 6px 6px;display:grid;place-items:center;font-size:20px">🍋</div>' +
        '<div id="ls-sign" style="position:absolute;left:-26px;top:10px;font-size:22px;transform-origin:50% 100%">🪧</div>';
      els.street.appendChild(els.stand);
      els.walkerLayer = h('div', 'position:absolute;inset:0');
      els.street.appendChild(els.walkerLayer);
      els.sell.appendChild(els.street);
      var live = h('div', 'display:flex;gap:8px;flex-wrap:wrap;align-items:center');
      els.liveStats = h('div', 'flex:1;min-width:200px;font:700 14px/1.4 ' + FONT);
      var waveBtn = h('button', null, '🪧 Wave the sign <span style="opacity:.7;font-size:11px">Space</span>');
      waveBtn.className = 'ls-btn'; waveBtn.type = 'button';
      waveBtn.addEventListener('click', function () { wave(g); });
      els.waveBtn = waveBtn;
      els.waveBar = h('div', 'width:120px;height:6px;border-radius:99px;background:rgba(0,0,0,.3);overflow:hidden');
      els.waveFill = h('div', 'height:100%;width:100%;background:#ffe45c');
      els.waveBar.appendChild(els.waveFill);
      var priceLive = h('div', 'display:flex;align-items:center;gap:6px');
      priceLive.innerHTML = '<span style="font:700 12px ' + FONT + '">Price</span>';
      var pm = h('button', null, '−'); pm.className = 'ls-btn sec'; pm.type = 'button'; pm.addEventListener('click', function () { adjPrice(g, -.1); });
      els.livePrice = h('span', 'font:800 16px ' + FONT + ';min-width:56px;text-align:center');
      var pp = h('button', null, '+'); pp.className = 'ls-btn sec'; pp.type = 'button'; pp.addEventListener('click', function () { adjPrice(g, .1); });
      priceLive.appendChild(pm); priceLive.appendChild(els.livePrice); priceLive.appendChild(pp);
      live.appendChild(els.liveStats); live.appendChild(priceLive); live.appendChild(waveBtn); live.appendChild(els.waveBar);
      els.sell.appendChild(live);
      els.dayBar = h('div', 'height:8px;border-radius:99px;background:rgba(0,0,0,.3);overflow:hidden');
      els.dayFill = h('div', 'height:100%;width:0;background:linear-gradient(90deg,#ffe45c,#ff9f1c)');
      els.dayBar.appendChild(els.dayFill);
      els.sell.appendChild(els.dayBar);
      wrap.appendChild(els.sell);

      // Delegated clicks for plan buttons
      els.plan.addEventListener('click', function (e) {
        var b = e.target.closest('[data-act]');
        if (!b) return;
        var a = b.getAttribute('data-act'), v = b.getAttribute('data-v');
        if (a === 'buy') buy(g, v, +b.getAttribute('data-n'));
        else if (a === 'recipe') adjRecipe(g, v, +b.getAttribute('data-n'));
        else if (a === 'price') adjPrice(g, +b.getAttribute('data-n'));
        else if (a === 'open') openStand(g);
      });

      g.root.innerHTML = '';
      g.root.appendChild(wrap);
      els.wrap = wrap;
    }

    function paintHead(g) {
      var d = g.data;
      var fw = WEATHER[d.forecast];
      var showActual = d.phase !== 'plan';
      var aw = WEATHER[d.actual];
      els.head.innerHTML =
        '<div class="ls-card" style="flex:1;min-width:190px;display:flex;align-items:center;gap:10px">' +
        '<div style="font-size:38px;line-height:1;animation:lsPop .3s">' + (showActual ? aw.e : fw.e) + '</div>' +
        '<div><div class="ls-lab">' + (showActual ? 'Today' : 'Forecast for today') + '</div>' +
        '<div style="font:800 17px/1.1 ' + FONT + '">' + (showActual ? aw.n : fw.n) + ' · ' + (showActual ? d.temp : d.forecastTemp) + '°C</div>' +
        '<div style="font:600 11px/1.3 ' + FONT + ';color:#ffe9a8">' + (showActual && d.actual !== d.forecast ? 'The forecast was wrong.' :
          'Ideal ice for this: ' + idealIce(showActual ? d : { temp: d.forecastTemp }) + ' cubes a cup') + '</div></div></div>' +
        '<div class="ls-card" style="flex:1.4;min-width:220px;display:flex;align-items:center;gap:10px">' +
        '<div style="font-size:30px;line-height:1">' + (d.event ? d.event.e : '🗓️') + '</div>' +
        '<div><div class="ls-lab">Day ' + d.day + ' of ' + DAYS + (d.event ? ' · ' + d.event.n : '') + '</div>' +
        '<div style="font:600 12px/1.35 ' + FONT + '">' + (d.event ? d.event.d : 'A normal day on Main Street. Stock up, set a price, open the stand.') + '</div></div></div>';
    }

    function paintPlan(g) {
      var d = g.data;
      els.stockCard.innerHTML = '<div class="ls-lab">Stock room · cash ' + money(d.cash) + '</div>' +
        STOCK.map(function (s) {
          var p = stockPrice(d, s.id);
          return '<div class="ls-row"><span style="font-size:20px">' + s.e + '</span>' +
            '<span style="flex:1"><b>' + s.n + '</b><br><span style="font-size:11px;color:#ffe9a8">' + money(p) + ' each · have <b>' + d.stock[s.id] + '</b></span></span>' +
            '<button class="ls-btn sec" data-act="buy" data-v="' + s.id + '" data-n="1" type="button" ' + (d.cash < p ? 'disabled' : '') + '>+1</button>' +
            '<button class="ls-btn" data-act="buy" data-v="' + s.id + '" data-n="' + s.pack + '" type="button" ' + (d.cash < p * s.pack ? 'disabled' : '') + '>+' + s.pack + ' ' + money(p * s.pack) + '</button></div>';
        }).join('') +
        '<div style="font:600 11px/1.4 ' + FONT + ';color:#ffe9a8;margin-top:6px">Ice melts overnight. Open pitchers spoil. Everything else keeps.</div>';

      var t = taste(d, false);
      var cpc = costPerCup(d);
      var can = cupsPossible(d);
      els.recipeCard.innerHTML = '<div class="ls-lab">Recipe · per pitcher of 10 cups</div>' +
        [['lemons', '🍋 Lemons', 1, 8], ['sugar', '🍬 Sugar', 0, 8], ['ice', '🧊 Ice per cup', 0, 6]].map(function (r) {
          return '<div class="ls-row"><span style="flex:1;font-weight:700">' + r[1] + '</span>' +
            '<button class="ls-btn sec" data-act="recipe" data-v="' + r[0] + '" data-n="-1" type="button" ' + (d.recipe[r[0]] <= r[2] ? 'disabled' : '') + '>−</button>' +
            '<b style="min-width:22px;text-align:center;font-size:16px">' + d.recipe[r[0]] + '</b>' +
            '<button class="ls-btn sec" data-act="recipe" data-v="' + r[0] + '" data-n="1" type="button" ' + (d.recipe[r[0]] >= r[3] ? 'disabled' : '') + '>+</button></div>';
        }).join('') +
        '<div class="ls-row"><span style="flex:1;font-weight:700">💵 Price per cup</span>' +
        '<button class="ls-btn sec" data-act="price" data-n="-0.1" type="button">−</button>' +
        '<b style="min-width:52px;text-align:center;font-size:16px">' + money(d.price) + '</b>' +
        '<button class="ls-btn sec" data-act="price" data-n="0.1" type="button">+</button></div>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;margin:8px 0 6px;font:600 12px/1.4 ' + FONT + '">' +
        '<span>Taste <b style="color:#ffe45c">' + stars(t) + '</b></span>' +
        '<span>Cost/cup <b>' + money(cpc) + '</b></span>' +
        '<span>Margin <b style="color:' + (d.price > cpc ? '#8fe09b' : '#ff8f8f') + '">' + money(d.price - cpc) + '</b></span>' +
        '<span>Can pour <b>' + can + '</b> cups</span></div>' +
        '<button class="ls-btn" data-act="open" type="button" style="width:100%;padding:12px;font-size:15px">🍋 Open the stand <span style="opacity:.7;font-size:11px">Enter</span></button>';
    }

    function paintAll(g) {
      var d = g.data;
      paintHead(g);
      if (d.phase === 'plan') { els.plan.style.display = 'grid'; els.sell.style.display = 'none'; paintPlan(g); }
      else { els.plan.style.display = 'none'; els.sell.style.display = 'flex'; paintLive(g); }
      var sky = WEATHER[d.phase === 'plan' ? d.forecast : d.actual].sky;
      host.style.background = 'linear-gradient(180deg,' + sky[0] + ',' + sky[1] + ')';
      fx.setRain(d.phase === 'sell' && d.actual === 0 ? 2.2 : 0);
      refreshHud(g);
    }

    function paintLive(g) {
      var d = g.data;
      var can = cupsPossible(d);
      els.liveStats.innerHTML = 'Sold <b style="color:#ffe45c">' + d.sold + '</b> · today ' + money(d.revenue) +
        ' · passers-by ' + d.passed + '<br><span style="font-size:12px;color:#ffe9a8">' +
        (can > 0 ? 'Enough stock for ' + can + ' more cup' + (can === 1 ? '' : 's') : '<b style="color:#ff8f8f">SOLD OUT</b> — customers are walking on') +
        (d.crewLeft ? ' · crew still waiting: ' + d.crewLeft : '') + '</span>';
      els.livePrice.textContent = money(d.price);
      els.waveFill.style.width = (100 - U.clamp(d.waveCd / 4, 0, 1) * 100) + '%';
      els.waveFill.style.background = d.wave > 0 ? '#8fe09b' : '#ffe45c';
      els.waveBtn.disabled = d.waveCd > 0;
    }

    function refreshHud(g) {
      var d = g.data;
      g.score = Math.round(d.cash);
      g.set('Cash', money(d.cash));
      g.set('Day', d.day + '/' + DAYS);
      g.set('Rep', Math.round(d.rep));
      g.set('Sold', d.totalSold);
    }

    /* --------------------------------------------------------- actions */
    function buy(g, id, n) {
      var d = g.data;
      if (d.phase !== 'plan') return;
      var cost = stockPrice(d, id) * n;
      if (d.cash < cost - 1e-9) { Milo.sound.tone({ f: 140, d: .1, v: .06, type: 'square' }); return; }
      d.cash -= cost;
      d.stock[id] += n;
      Milo.sound.click();
      paintPlan(g); refreshHud(g);
    }
    function adjRecipe(g, k, n) {
      var d = g.data;
      var lim = { lemons: [1, 8], sugar: [0, 8], ice: [0, 6] }[k];
      d.recipe[k] = U.clamp(d.recipe[k] + n, lim[0], lim[1]);
      Milo.sound.blip();
      paintPlan(g);
    }
    function adjPrice(g, n) {
      var d = g.data;
      d.price = U.clamp(Math.round((d.price + n) * 100) / 100, .1, 4);
      Milo.sound.tone({ f: n > 0 ? 700 : 500, d: .05, v: .06, type: 'triangle' });
      if (d.phase === 'plan') paintPlan(g); else paintLive(g);
    }

    function openStand(g) {
      var d = g.data;
      if (d.phase !== 'plan') return;
      if (cupsPossible(d) === 0) {
        Milo.sound.hit();
        els.recipeCard.style.animation = 'none'; void els.recipeCard.offsetWidth;
        els.recipeCard.style.animation = 'lsPop .3s';
        var p = fx.at(els.recipeCard);
        fx.text(p.x, p.t + 30, 'No stock to pour a single cup!', '#ff8f8f', 16);
        return;
      }
      d.phase = 'sell';
      d.sellT = 0; d.sold = 0; d.revenue = 0; d.passed = 0; d.turnedAway = 0;
      d.walkers = []; els.walkerLayer.innerHTML = '';
      d.wave = 0; d.waveCd = 0;
      d.crewLeft = d.event && d.event.crew ? d.event.crew : 0;
      if (d.event && d.event.rep) d.rep = U.clamp(d.rep + d.event.rep, 0, 100);
      var traffic = 26 * WEATHER[d.actual].traffic * (d.event ? d.event.traffic : 1) * (0.7 + d.rep / 100 * .6);
      d.traffic = Math.max(4, Math.round(traffic));
      d.spawnT = .4;
      Milo.sound.powerup();
      paintAll(g);
      var p2 = fx.at(els.street);
      fx.text(p2.x, p2.y - 20, WEATHER[d.actual].e + ' ' + WEATHER[d.actual].n + ', ' + d.temp + '°', '#fff9e6', 22);
    }

    function wave(g) {
      var d = g.data;
      if (d.phase !== 'sell' || d.waveCd > 0) return;
      d.wave = 3; d.waveCd = 4;
      var sign = els.stand.querySelector('#ls-sign');
      if (sign) { sign.style.animation = 'none'; void sign.offsetWidth; sign.style.animation = 'lsBob .3s 6'; }
      Milo.sound.tone({ f: 520, f2: 780, d: .18, v: .08, type: 'triangle' });
      var p = fx.at(els.stand);
      fx.text(p.x, p.y - 30, 'Ice cold lemonade!', '#ffe45c', 16);
      paintLive(g);
    }

    function spawnWalker(g) {
      var d = g.data;
      var w = fx.at(els.street).w;
      var dir = Math.random() < .5 ? 1 : -1;
      var el = h('div', 'position:absolute;top:44px;font-size:30px;line-height:1;animation:lsWalk .5s infinite;will-change:transform');
      el.innerHTML = '<span style="display:inline-block;transform:scaleX(' + dir + ')">' + U.choice(WALKERS) + '</span>' +
        '<div data-bubble style="position:absolute;left:50%;top:-26px;transform:translateX(-50%);font-size:18px;opacity:0;transition:opacity .15s;white-space:nowrap"></div>';
      els.walkerLayer.appendChild(el);
      var speed = 60 + Math.random() * 50;
      d.walkers.push({ el: el, x: dir > 0 ? -40 : w + 10, dir: dir, v: speed, decided: false, pause: 0, w: w, crew: d.crewLeft > 0 && Math.random() < .5 });
    }

    function decide(g, wk) {
      var d = g.data;
      d.passed++;
      var wt = WEATHER[d.actual];
      var willing = 1.05 * wt.willing * (d.event ? d.event.willing : 1) * (0.75 + d.rep / 100 * .5);
      if (wk.crew) { willing = 2.0; d.crewLeft--; }
      var t = taste(d, true);
      var p = U.clamp((willing * 1.35 - d.price) / (willing * 1.35), 0, 1);
      p = p * (0.35 + t * .75) * (d.wave > 0 ? 1.7 : 1);
      if (wk.crew) p = 1;
      var bubble = wk.el.querySelector('[data-bubble]');
      var pos = fx.at(wk.el);
      if (p > Math.random()) {
        if (cupsPossible(d) <= 0) {
          d.turnedAway++;
          d.rep = U.clamp(d.rep - .6, 0, 100);
          bubble.textContent = '🚫'; bubble.style.opacity = 1;
          Milo.sound.tone({ f: 220, f2: 160, d: .12, v: .05, type: 'square' });
          return;
        }
        pour(d);
        d.sold++; d.totalSold++; d.revenue += d.price; d.cash += d.price;
        var repD = t >= .8 ? .45 : t >= .55 ? .1 : -.7;
        d.rep = U.clamp(d.rep + repD, 0, 100);
        wk.pause = .45;
        bubble.textContent = t >= .8 ? '😋' : t >= .55 ? '🍋' : '🤢';
        bubble.style.opacity = 1;
        fx.coins(pos.x, pos.y - 10, 5);
        if (t >= .8 && Math.random() < .4) fx.emo(pos.x, pos.y - 10, '🍋', 2);
        Milo.sound.coin();
        fx.text(pos.x, pos.y - 34, '+' + money(d.price), '#fff7c2', 14);
      } else {
        bubble.textContent = d.price > willing * 1.1 ? '💸' : t < .5 ? '🤢' : '😐';
        bubble.style.opacity = 1;
        if (d.price > willing * 1.35) d.rep = U.clamp(d.rep - .15, 0, 100);
      }
    }

    function pour(d) {
      var r = d.recipe;
      if (d.pitcher <= 0) { d.stock.lemons -= r.lemons; d.stock.sugar -= r.sugar; d.pitcher = 10; }
      d.pitcher--;
      d.stock.ice -= r.ice;
      d.stock.cups--;
    }

    function endDay(g) {
      var d = g.data;
      d.phase = 'report';
      fx.setRain(0);
      var spoiled = d.pitcher;
      d.pitcher = 0;
      var melted = d.stock.ice;
      d.stock.ice = 0;
      d.walkers.forEach(function (w) { w.el.remove(); });
      d.walkers = [];
      var profit = d.revenue;
      d.log.push({ day: d.day, sold: d.sold, rev: d.revenue });
      var text = 'Sold ' + d.sold + ' of ' + d.passed + ' passers-by for ' + money(d.revenue) + '.' +
        (d.turnedAway ? ' Turned away ' + d.turnedAway + ' when you sold out.' : '') +
        (melted ? ' ' + melted + ' ice melted overnight.' : '') + (spoiled ? ' ' + spoiled + ' cups of open pitcher spoiled.' : '') +
        ' Reputation ' + Math.round(d.rep) + '/100. Cash ' + money(d.cash) + '.';
      refreshHud(g);
      if (d.day >= DAYS) {
        d.ended = true;
        var final = Math.round(d.cash);
        if (final >= 20) g.win({ emo: '🍋', title: 'Season over — ' + money(d.cash), text: text + ' You started with $20.', score: final });
        else g.gameOver({ emo: '🍋', title: 'Season over', text: text + ' You ended with less than you started.', score: final });
        return;
      }
      if (d.sold >= 20) Milo.sound.win(); else Milo.sound.tone({ f: 440, f2: 330, d: .25, v: .07, type: 'triangle' });
      var next = d.day + 1;
      g.overlay({
        emo: d.sold >= 20 ? '🤑' : d.sold >= 8 ? '🙂' : '😬',
        title: 'Day ' + d.day + ' — ' + (profit > 0 ? '+' : '') + money(profit),
        text: text,
        actions: [{ label: '▶  Plan day ' + next, primary: true, onClick: function () { nextDay(g); } }],
        hint: 'Tomorrow\'s forecast waits in the morning. Stock keeps; ice does not.'
      });
    }

    function nextDay(g) {
      var d = g.data;
      d.day++;
      d.phase = 'plan';
      rollDay(d);
      g.clearOverlay();
      if (d.cash < 1 && cupsPossible(d) === 0) {
        g.gameOver({ emo: '🍋', title: 'Bankrupt', text: 'No cash and no stock on day ' + d.day + '. The stand closes.', score: Math.round(d.cash) });
        return;
      }
      Milo.sound.blip();
      paintAll(g);
    }

    /* ---------------------------------------------------------- update */
    function update(g, dt) {
      var d = g.data;
      if (d.phase !== 'sell') return;
      d.sellT += dt;
      els.dayFill.style.width = U.clamp(d.sellT / SELL_LEN * 100, 0, 100) + '%';
      if (d.wave > 0) d.wave -= dt;
      if (d.waveCd > 0) { d.waveCd -= dt; if (d.waveCd <= 0) { d.waveCd = 0; paintLive(g); } }
      if (d.sellT < SELL_LEN - 1.5) {
        d.spawnT -= dt;
        if (d.spawnT <= 0) {
          spawnWalker(g);
          d.spawnT = (SELL_LEN - 2) / d.traffic * U.rand(.5, 1.5);
        }
      }
      // Ice melts in the heat while the stand is open.
      if (d.temp >= 28 && d.stock.ice > 0 && Math.random() < dt * (d.temp - 26) * .06) d.stock.ice--;

      var standX = fx.at(els.street).w / 2;
      for (var i = d.walkers.length - 1; i >= 0; i--) {
        var wk = d.walkers[i];
        if (wk.pause > 0) { wk.pause -= dt; }
        else {
          wk.x += wk.v * wk.dir * dt;
          if (!wk.decided && ((wk.dir > 0 && wk.x >= standX - 24) || (wk.dir < 0 && wk.x <= standX + 4))) {
            wk.decided = true;
            decide(g, wk);
          }
        }
        wk.el.style.transform = 'translateX(' + wk.x + 'px)';
        if (wk.x < -60 || wk.x > wk.w + 40) { wk.el.remove(); d.walkers.splice(i, 1); }
      }
      d.liveT = (d.liveT || 0) + dt;
      if (d.liveT > .2) { d.liveT = 0; paintLive(g); refreshHud(g); }
      if (d.sellT >= SELL_LEN && !d.walkers.length) endDay(g);
      else if (d.sellT >= SELL_LEN + 3) endDay(g);
    }

    function onKey(g, e) {
      var d = g.data;
      if (e.code === 'Space') { e.preventDefault(); if (d.phase === 'sell') wave(g); return; }
      if (e.code === 'Enter') { if (d.phase === 'plan') openStand(g); return; }
      if (e.code === 'ArrowUp') { e.preventDefault(); adjPrice(g, .1); return; }
      if (e.code === 'ArrowDown') { e.preventDefault(); adjPrice(g, -.1); return; }
      if (d.phase === 'plan' && (e.code === 'ArrowLeft' || e.code === 'ArrowRight')) {
        e.preventDefault(); adjRecipe(g, 'ice', e.code === 'ArrowRight' ? 1 : -1);
      }
    }

    return Milo.domGame(host, {
      id: 'lemonade-stand',
      stats: ['Cash', 'Day', 'Rep', 'Sold'],
      bg: 'linear-gradient(180deg,#5ec8f5,#2a8fd6)',
      emo: '🍋',
      start: {
        title: 'Lemonade Stand',
        text: 'Fourteen days, twenty dollars. Each morning read the forecast, buy lemons, sugar, ice and cups, ' +
          'tune the recipe and set a price. Then open the stand and watch Main Street decide — wave the sign to ' +
          'pull people in, and nudge the price while they walk past.',
        keys: ['Click', 'Enter open', 'Space wave sign', '↑↓ price']
      },
      init: reset,
      update: update,
      onKey: onKey,
      destroy: function () { fx.destroy(); }
    });
  }

  window.Milo.register({
    id: 'lemonade-stand', title: 'Lemonade Stand', emo: '🍋', category: 'Strategy',
    tagline: 'Fourteen days of weather, recipes and prices',
    description: 'A season of fourteen days starting with $20. Every morning you see a forecast (right about ' +
      'three days in four), buy lemons, sugar, ice and cups, set the recipe per pitcher and the price per cup, ' +
      'then open the stand and watch passers-by decide in real time — wave the sign for a burst of interest and ' +
      'change the price on the fly. Hot days bring crowds who pay more and want more ice; rain empties the ' +
      'street; events like a street fair, road works, a rival stand or a lemon shortage change the sums. ' +
      'Reputation, earned by a good-tasting cup at a fair price, feeds tomorrow\'s traffic. Score is your closing ' +
      'cash. Tip: ice melts overnight, so buy it for the day you have, not the week.',
    controls: ['Click', 'Enter', 'Space', '↑ ↓'],
    colors: ['#ffe45c', '#2a8fd6'],
    scoreLabel: 'dollars',
    tags: ['economy', 'tycoon', 'classic', 'weather', 'sim'],
    mount: mount
  });
})();
