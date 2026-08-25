/* Coin Tycoon — an idle clicker with upgrades that keeps earning offline. */
(function () {
  'use strict';

  var UPGRADES = [
    { id: 'grip', name: 'Better Grip', emo: '✋', desc: '+1 coin per click', cost: 25, mult: 1.45, kind: 'click', amount: 1 },
    { id: 'intern', name: 'Intern', emo: '🧑‍💼', desc: '+0.5 coins per second', cost: 60, mult: 1.5, kind: 'auto', amount: 0.5 },
    { id: 'press', name: 'Coin Press', emo: '⚙️', desc: '+3 coins per second', cost: 420, mult: 1.55, kind: 'auto', amount: 3 },
    { id: 'gloves', name: 'Gold Gloves', emo: '🧤', desc: '+6 coins per click', cost: 900, mult: 1.5, kind: 'click', amount: 6 },
    { id: 'mint', name: 'Private Mint', emo: '🏛️', desc: '+22 coins per second', cost: 5200, mult: 1.6, kind: 'auto', amount: 22 },
    { id: 'vault', name: 'Vault Network', emo: '🏦', desc: '+140 coins per second', cost: 48000, mult: 1.62, kind: 'auto', amount: 140 },
    { id: 'orbit', name: 'Orbital Foundry', emo: '🛰️', desc: '+1,100 coins per second', cost: 520000, mult: 1.7, kind: 'auto', amount: 1100 }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var coinsEl, rateEl, shopEl, bigBtn, parts = [], fx;

    function load() {
      var s = Milo.store.get('coin-tycoon:save', null);
      if (!s) return null;
      // Credit whatever the mint earned while the tab was closed (capped at 8h).
      var away = Math.min(8 * 3600, (Date.now() - (s.at || Date.now())) / 1000);
      var rate = rateOf(s.owned || {});
      s.offline = away > 60 ? rate * away : 0;
      s.coins = (s.coins || 0) + s.offline;
      return s;
    }

    function save(d) {
      Milo.store.set('coin-tycoon:save', {
        coins: d.coins, total: d.total, owned: d.owned, clicks: d.clicks, at: Date.now()
      });
    }

    function rateOf(owned) {
      var r = 0;
      UPGRADES.forEach(function (u) {
        if (u.kind === 'auto') r += (owned[u.id] || 0) * u.amount;
      });
      return r;
    }
    function perClick(owned) {
      var c = 1;
      UPGRADES.forEach(function (u) {
        if (u.kind === 'click') c += (owned[u.id] || 0) * u.amount;
      });
      return c;
    }
    function costOf(u, owned) {
      return Math.ceil(u.cost * Math.pow(u.mult, owned[u.id] || 0));
    }

    function reset(g) {
      var d = g.data;
      var s = load();
      d.coins = s ? s.coins : 0;
      d.total = s ? s.total || s.coins : 0;
      d.owned = s ? s.owned || {} : {};
      d.clicks = s ? s.clicks || 0 : 0;
      d.saveT = 0;
      build(g);
      if (s && s.offline > 1) {
        fx.textContent = 'Welcome back — your mints earned ' + U.fmtShort(s.offline) + ' while you were away.';
        setTimeout(function () { if (fx) fx.textContent = ''; }, 6000);
      }
      refresh(g);
    }

    function build(g) {
      var wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;gap:18px;align-items:stretch;width:100%;max-width:760px;' +
        'flex-wrap:wrap;justify-content:center';

      var left = document.createElement('div');
      left.style.cssText = 'flex:1 1 240px;display:flex;flex-direction:column;align-items:center;' +
        'justify-content:center;gap:10px;min-width:230px';

      coinsEl = document.createElement('div');
      coinsEl.style.cssText = 'font:800 clamp(26px,6vw,44px)/1 Outfit,sans-serif;color:#ffd257;' +
        'text-shadow:0 0 24px rgba(255,210,87,.4)';
      rateEl = document.createElement('div');
      rateEl.style.cssText = 'color:#a8b0d8;font-size:.9rem';

      bigBtn = document.createElement('button');
      bigBtn.type = 'button';
      bigBtn.textContent = '🪙';
      bigBtn.style.cssText = 'width:min(46vw,168px);aspect-ratio:1;border-radius:50%;border:0;cursor:pointer;' +
        'font-size:clamp(46px,12vw,78px);background:radial-gradient(circle at 35% 30%,#ffe9a8,#f0b429 62%,#b47b12);' +
        'box-shadow:0 12px 34px rgba(240,180,41,.45),inset 0 -8px 20px rgba(0,0,0,.25);' +
        'transition:transform .07s;user-select:none;-webkit-user-select:none';
      bigBtn.addEventListener('mousedown', function () { bigBtn.style.transform = 'scale(.94)'; });
      bigBtn.addEventListener('mouseup', function () { bigBtn.style.transform = ''; });
      bigBtn.addEventListener('mouseleave', function () { bigBtn.style.transform = ''; });
      bigBtn.addEventListener('click', function (e) { clickCoin(g, e); });

      fx = document.createElement('div');
      fx.style.cssText = 'color:#34d399;font-size:.84rem;height:2.4em;text-align:center;max-width:26ch';

      left.appendChild(coinsEl);
      left.appendChild(rateEl);
      left.appendChild(bigBtn);
      left.appendChild(fx);

      shopEl = document.createElement('div');
      shopEl.style.cssText = 'flex:1 1 300px;min-width:270px;max-height:min(62vh,430px);overflow-y:auto;' +
        'display:flex;flex-direction:column;gap:7px;padding-right:4px';
      shopEl.addEventListener('click', function (e) {
        var b = e.target.closest('[data-buy]');
        if (b) buy(g, b.dataset.buy);
      });

      wrap.appendChild(left);
      wrap.appendChild(shopEl);
      g.root.innerHTML = '';
      g.root.appendChild(wrap);
    }

    function clickCoin(g, e) {
      var d = g.data;
      var gain = perClick(d.owned);
      d.coins += gain;
      d.total += gain;
      d.clicks++;
      Milo.sound.tone({ f: 760 + Math.random() * 120, f2: 1100, d: .05, v: .05, type: 'square' });
      floatText(g, '+' + U.fmtShort(gain), e);
      refresh(g);
    }

    function floatText(g, text, e) {
      var n = document.createElement('div');
      n.textContent = text;
      var rect = host.getBoundingClientRect();
      var x = e && e.clientX ? e.clientX - rect.left : rect.width / 2;
      var y = e && e.clientY ? e.clientY - rect.top : rect.height / 2;
      n.style.cssText = 'position:absolute;left:' + x + 'px;top:' + y + 'px;pointer-events:none;' +
        'color:#ffd257;font:800 16px Outfit,sans-serif;z-index:7;transition:transform .7s ease-out,opacity .7s';
      host.appendChild(n);
      requestAnimationFrame(function () {
        n.style.transform = 'translate(-50%,-52px)';
        n.style.opacity = '0';
      });
      setTimeout(function () { n.remove(); }, 750);
    }

    function buy(g, id) {
      var d = g.data;
      var u = UPGRADES.filter(function (x) { return x.id === id; })[0];
      if (!u) return;
      var cost = costOf(u, d.owned);
      if (d.coins < cost) { Milo.sound.tone({ f: 140, d: .1, v: .05, type: 'square' }); return; }
      d.coins -= cost;
      d.owned[id] = (d.owned[id] || 0) + 1;
      Milo.sound.powerup();
      refresh(g);
      save(d);
    }

    function refresh(g) {
      var d = g.data;
      var rate = rateOf(d.owned), click = perClick(d.owned);
      coinsEl.textContent = U.fmtShort(d.coins) + ' 🪙';
      rateEl.textContent = U.fmtShort(rate) + '/sec  ·  ' + U.fmtShort(click) + ' per click';
      g.set('Coins', U.fmtShort(d.coins));
      g.set('Per sec', U.fmtShort(rate));
      g.set('Earned', U.fmtShort(d.total));
      g.score = Math.floor(d.total);
      Milo.store.setBest('coin-tycoon', g.score);

      shopEl.innerHTML = UPGRADES.map(function (u) {
        var have = d.owned[u.id] || 0;
        var cost = costOf(u, d.owned);
        var can = d.coins >= cost;
        // Hide upgrades that are still far out of reach, so the shop stays readable.
        var visible = have > 0 || d.total >= u.cost * 0.4;
        if (!visible) return '';
        return '<button data-buy="' + u.id + '" type="button" style="' +
          'display:flex;align-items:center;gap:10px;text-align:left;width:100%;padding:9px 11px;' +
          'border-radius:12px;cursor:' + (can ? 'pointer' : 'default') + ';' +
          'border:1px solid ' + (can ? 'rgba(52,211,153,.5)' : 'rgba(255,255,255,.08)') + ';' +
          'background:' + (can ? 'rgba(52,211,153,.10)' : 'rgba(255,255,255,.04)') + ';' +
          'color:#eef1ff;font:inherit;opacity:' + (can ? '1' : '.6') + '">' +
          '<span style="font-size:22px">' + u.emo + '</span>' +
          '<span style="flex:1">' +
          '<span style="font-weight:700;font-size:.9rem">' + u.name +
          (have ? ' <span style="color:#22d3ee">×' + have + '</span>' : '') + '</span><br>' +
          '<span style="font-size:.76rem;color:#a8b0d8">' + u.desc + '</span></span>' +
          '<span style="font-weight:800;font-size:.85rem;color:' + (can ? '#34d399' : '#8b93bd') + '">' +
          U.fmtShort(cost) + '</span></button>';
      }).join('');
    }

    return Milo.domGame(host, {
      id: 'coin-tycoon',
      stats: ['Coins', 'Per sec', 'Earned'],
      bg: '#12142e',
      emo: '🪙',
      trackBest: false,
      autoStart: true,
      start: { title: 'Coin Tycoon' },
      init: reset,
      update: function (g, dt) {
        var d = g.data;
        var rate = rateOf(d.owned);
        if (rate) {
          d.coins += rate * dt;
          d.total += rate * dt;
        }
        d.tick = (d.tick || 0) + dt;
        if (d.tick > 0.2) { d.tick = 0; refresh(g); }
        d.saveT += dt;
        if (d.saveT > 5) { d.saveT = 0; save(d); }
      },
      destroy: function (g) { save(g.data); }
    });
  }

  window.Milo.register({
    id: 'coin-tycoon', title: 'Coin Tycoon', emo: '🪙', category: 'Casual',
    tagline: 'Click, upgrade, and let it run',
    description: 'Tap the coin to earn. Spend what you make on interns, presses, mints ' +
      'and eventually an orbital foundry, each of which earns for you automatically. ' +
      'Your progress saves in this browser and the mints keep working while the tab is ' +
      'closed — up to eight hours’ worth.',
    controls: ['Click the coin', 'Click an upgrade to buy'],
    colors: ['#f0b429', '#b47b12'],
    scoreLabel: 'coins',
    tags: ['idle', 'clicker', 'upgrades', 'relaxing'],
    mount: mount
  });
})();
