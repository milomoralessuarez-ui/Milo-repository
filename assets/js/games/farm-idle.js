/* Farm Idle — sow, harvest, hire, expand. */
(function () {
  'use strict';
  var CROPS = [
    { name: 'Wheat', emo: '🌾', cost: 5, sell: 12, grow: 4 },
    { name: 'Carrot', emo: '🥕', cost: 18, sell: 46, grow: 8 },
    { name: 'Pumpkin', emo: '🎃', cost: 70, sell: 190, grow: 16 },
    { name: 'Melon', emo: '🍉', cost: 260, sell: 760, grow: 30 }
  ];
  var UPGRADES = [
    { id: 'plot', name: 'New plot', emo: '🟫', desc: 'One more field to plant', base: 60, mult: 1.7 },
    { id: 'hand', name: 'Farmhand', emo: '🧑‍🌾', desc: 'Sows and harvests two plots for you', base: 220, mult: 2.1 },
    { id: 'fert', name: 'Fertiliser', emo: '💧', desc: 'Crops grow 12% faster', base: 150, mult: 1.9 },
    { id: 'price', name: 'Market stall', emo: '🏪', desc: 'Sell for 15% more', base: 320, mult: 2.2 }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var moneyEl, shopEl, fieldEl, cropEl;

    function load() {
      var s = Milo.store.get('farm-idle:save', null);
      if (!s) return null;
      s.offline = Math.min(6 * 3600, (Date.now() - (s.at || Date.now())) / 1000);
      return s;
    }
    function save(d) {
      Milo.store.set('farm-idle:save', {
        money: d.money, total: d.total, owned: d.owned, plots: d.plots, crop: d.crop, at: Date.now()
      });
    }

    function growTime(d, i) { return CROPS[i].grow * Math.pow(0.88, d.owned.fert || 0); }
    function sellPrice(d, i) { return CROPS[i].sell * Math.pow(1.15, d.owned.price || 0); }
    function autoPlots(d) { return (d.owned.hand || 0) * 2; }
    function autoRate(d) {
      var plots = Math.min(d.plots.length, autoPlots(d));
      if (!plots) return 0;
      return plots * (sellPrice(d, d.crop) - CROPS[d.crop].cost) / growTime(d, d.crop);
    }
    function costOf(u, owned) { return Math.ceil(u.base * Math.pow(u.mult, owned[u.id] || 0)); }

    function reset(g) {
      var d = g.data;
      var s = load();
      d.money = s ? s.money : 20;
      d.total = s ? (s.total || s.money) : 20;
      d.owned = s ? (s.owned || {}) : {};
      d.crop = s ? (s.crop || 0) : 0;
      d.msg = '';
      d.plots = [];
      for (var i = 0; i < 3 + (d.owned.plot || 0); i++) d.plots.push({ crop: -1, t: 0 });
      if (s && s.plots) s.plots.forEach(function (p, k) { if (d.plots[k]) d.plots[k] = p; });
      d.saveT = 0;
      build(g);
      // Credit offline earnings as a lump sum rather than simulating every tick.
      if (s && s.offline > 120 && autoPlots(d) > 0) {
        var gained = Math.floor(autoRate(d) * s.offline);
        if (gained > 0) {
          d.money += gained;
          d.total += gained;
          d.msg = 'Your farmhands earned ' + U.fmtShort(gained) + ' while you were away.';
        }
      }
      refresh(g);
    }

    function build(g) {
      var wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;gap:18px;width:100%;max-width:820px;flex-wrap:wrap;' +
        'justify-content:center;align-items:flex-start';

      var left = document.createElement('div');
      left.style.cssText = 'flex:1 1 320px;min-width:290px;display:flex;flex-direction:column;gap:10px';

      moneyEl = document.createElement('div');
      moneyEl.style.cssText = 'font:800 clamp(20px,4.4vw,30px)/1 Outfit,sans-serif;color:#ffd257';

      cropEl = document.createElement('div');
      cropEl.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap';
      cropEl.addEventListener('click', function (e) {
        var b = e.target.closest('[data-crop]');
        if (b) { g.data.crop = +b.dataset.crop; Milo.sound.click(); refresh(g); }
      });

      fieldEl = document.createElement('div');
      fieldEl.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(70px,1fr));gap:8px';
      fieldEl.addEventListener('click', function (e) {
        var b = e.target.closest('[data-plot]');
        if (b) tapPlot(g, +b.dataset.plot);
      });

      left.appendChild(moneyEl);
      left.appendChild(cropEl);
      left.appendChild(fieldEl);

      shopEl = document.createElement('div');
      shopEl.style.cssText = 'flex:1 1 280px;min-width:250px;display:flex;flex-direction:column;gap:7px;' +
        'max-height:min(60vh,420px);overflow-y:auto';
      shopEl.addEventListener('click', function (e) {
        var b = e.target.closest('[data-buy]');
        if (b) buy(g, b.dataset.buy);
      });

      wrap.appendChild(left);
      wrap.appendChild(shopEl);
      g.root.innerHTML = '';
      g.root.appendChild(wrap);
    }

    function tapPlot(g, i) {
      var d = g.data, p = d.plots[i];
      if (p.crop < 0) {
        var cost = CROPS[d.crop].cost;
        if (d.money < cost) { d.msg = 'Not enough for ' + CROPS[d.crop].name; refresh(g); return; }
        d.money -= cost;
        p.crop = d.crop;
        p.t = 0;
        Milo.sound.click();
      } else if (p.t >= growTime(d, p.crop)) {
        var earned = sellPrice(d, p.crop);
        d.money += earned;
        d.total += earned;
        p.crop = -1;
        p.t = 0;
        Milo.sound.coin();
      }
      refresh(g);
    }

    function buy(g, id) {
      var d = g.data;
      var u = UPGRADES.filter(function (x) { return x.id === id; })[0];
      var cost = costOf(u, d.owned);
      if (d.money < cost) { Milo.sound.tone({ f: 140, d: .1, v: .05, type: 'square' }); return; }
      d.money -= cost;
      d.owned[id] = (d.owned[id] || 0) + 1;
      if (id === 'plot') d.plots.push({ crop: -1, t: 0 });
      Milo.sound.powerup();
      refresh(g);
      save(d);
    }

    function refresh(g) {
      var d = g.data;
      moneyEl.textContent = U.fmtShort(d.money) + ' coins';
      g.set('Coins', U.fmtShort(d.money));
      g.set('Plots', d.plots.length);
      g.set('Earned', U.fmtShort(d.total));
      g.score = Math.floor(d.total);
      Milo.store.setBest('farm-idle', g.score);

      cropEl.innerHTML = CROPS.map(function (crop, i) {
        if (i > 0 && d.total < crop.cost * 4) return '';
        return '<button data-crop="' + i + '" type="button" style="' +
          'padding:6px 10px;border-radius:10px;cursor:pointer;font:650 .8rem Outfit,sans-serif;' +
          'border:1px solid ' + (d.crop === i ? '#34d399' : 'rgba(255,255,255,.12)') + ';' +
          'background:' + (d.crop === i ? 'rgba(52,211,153,.18)' : 'rgba(255,255,255,.05)') + ';' +
          'color:#eef1ff">' + crop.emo + ' ' + crop.name + ' · ' + crop.cost + '</button>';
      }).join('');

      fieldEl.innerHTML = d.plots.map(function (p, i) {
        var ready = p.crop >= 0 && p.t >= growTime(d, p.crop);
        var frac = p.crop < 0 ? 0 : U.clamp(p.t / growTime(d, p.crop), 0, 1);
        var auto = i < autoPlots(d);
        return '<button data-plot="' + i + '" type="button" style="' +
          'aspect-ratio:1;border:' + (auto ? '2px solid rgba(52,211,153,.5)' : '0') + ';' +
          'border-radius:10px;cursor:pointer;position:relative;display:grid;place-items:center;' +
          'font-size:26px;overflow:hidden;' +
          'background:' + (ready ? '#3d7a3a' : p.crop < 0 ? '#4a3a26' : '#3a4a2c') + '">' +
          (p.crop < 0 ? '<span style="opacity:.45;font-size:18px">+</span>'
            : '<span style="transform:scale(' + (0.5 + frac * 0.5) + ')">' + CROPS[p.crop].emo + '</span>') +
          (p.crop >= 0 && !ready
            ? '<span style="position:absolute;left:0;bottom:0;height:4px;background:#ffd257;width:' +
            (frac * 100) + '%"></span>' : '') +
          '</button>';
      }).join('');

      var rate = autoRate(d);
      shopEl.innerHTML =
        '<div style="color:#a8b0d8;font:600 .78rem Outfit,sans-serif">' +
        (rate ? 'Farmhands earn ' + U.fmtShort(rate) + '/sec' : 'Tap a plot to sow, tap again when ripe') +
        '</div>' +
        (d.msg ? '<div style="color:#34d399;font:600 .8rem Outfit,sans-serif">' + d.msg + '</div>' : '') +
        UPGRADES.map(function (u) {
          var have = d.owned[u.id] || 0;
          var cost = costOf(u, d.owned);
          var can = d.money >= cost;
          if (!have && d.total < u.base * 0.5) return '';
          return '<button data-buy="' + u.id + '" type="button" style="' +
            'display:flex;align-items:center;gap:10px;text-align:left;padding:9px 11px;border-radius:12px;' +
            'cursor:' + (can ? 'pointer' : 'default') + ';font:inherit;color:#eef1ff;' +
            'border:1px solid ' + (can ? 'rgba(52,211,153,.5)' : 'rgba(255,255,255,.08)') + ';' +
            'background:' + (can ? 'rgba(52,211,153,.10)' : 'rgba(255,255,255,.04)') + ';' +
            'opacity:' + (can ? '1' : '.6') + '">' +
            '<span style="font-size:22px">' + u.emo + '</span>' +
            '<span style="flex:1"><span style="font-weight:700;font-size:.9rem">' + u.name +
            (have ? ' <span style="color:#22d3ee">×' + have + '</span>' : '') + '</span><br>' +
            '<span style="font-size:.75rem;color:#a8b0d8">' + u.desc + '</span></span>' +
            '<span style="font-weight:800;font-size:.85rem;color:' + (can ? '#34d399' : '#8b93bd') + '">' +
            U.fmtShort(cost) + '</span></button>';
        }).join('');
    }

    return Milo.domGame(host, {
      id: 'farm-idle',
      stats: ['Coins', 'Plots', 'Earned'],
      bg: '#16220f',
      emo: '🌾',
      trackBest: false,
      autoStart: true,
      start: { title: 'Farm Idle' },
      init: reset,
      update: function (g, dt) {
        var d = g.data;
        var auto = autoPlots(d);
        d.plots.forEach(function (p, i) {
          if (p.crop >= 0) {
            p.t += dt;
            if (p.t >= growTime(d, p.crop) && i < auto) {
              var earned = sellPrice(d, p.crop);
              d.money += earned;
              d.total += earned;
              p.crop = -1;
              p.t = 0;
            }
          } else if (i < auto && d.money >= CROPS[d.crop].cost) {
            d.money -= CROPS[d.crop].cost;
            p.crop = d.crop;
            p.t = 0;
          }
        });
        d.tick = (d.tick || 0) + dt;
        if (d.tick > 0.25) { d.tick = 0; refresh(g); }
        d.saveT += dt;
        if (d.saveT > 5) { d.saveT = 0; save(d); }
      },
      destroy: function (g) { save(g.data); }
    });
  }

  window.Milo.register({
    id: 'farm-idle', title: 'Farm Idle', emo: '🌾', category: 'Casual',
    tagline: 'Sow, harvest, hire, expand',
    description: 'Tap a plot to sow and tap it again once it is ripe to sell. Better crops ' +
      'cost more and take longer but pay far more per plot. Spend the profits on extra ' +
      'plots, fertiliser, a market stall, and farmhands who work two plots each for you — ' +
      'including while the tab is closed. Progress saves in this browser.',
    controls: ['Click a plot to sow', 'Click again to harvest'],
    colors: ['#3a4a2c', '#ffd257'],
    scoreLabel: 'coins',
    tags: ['idle', 'farming', 'upgrades', 'relaxing'],
    mount: mount
  });
})();
