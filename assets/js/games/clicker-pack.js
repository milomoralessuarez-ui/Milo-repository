/* Clicker Pack — ten idle/clicker games on one shared engine.
   Every game: tap the big thing for currency, buy generator tiers and
   upgrades with softly-exponential costs, and one TWIST mechanic that the
   game's unlock tree hangs off (brew queues, robot cascades, raids, depth,
   momentum, bee allocation, oxygen upkeep, breeding, prestige, real growth
   timers). Progress saves under Milo.store '<id>:save' so returning players
   continue, offline earnings are credited (capped at 4 h), and every shop
   has a reset button at the bottom. */
(function () {
  'use strict';

  var Milo = window.Milo, U = Milo.util;

  /* ------------------------------------------------------------- helpers */

  function fmt(n) {
    if (!isFinite(n)) return '0';
    if (n < 0) return '-' + fmt(-n);
    if (n >= 1000) return U.fmtShort(n);
    if (n >= 10) return String(Math.floor(n));
    // Upkeep and per-unit rates are often well under 1; "0" would be a lie.
    if (n > 0 && n < 1) {
      var c = Math.round(n * 100) / 100;
      return c === 0 ? n.toFixed(3) : String(c);
    }
    var f = Math.floor(n * 10) / 10;
    return f === Math.floor(f) ? String(f) : f.toFixed(1);
  }
  function secs(t) {
    t = Math.max(0, t);
    return t >= 60 ? Math.floor(t / 60) + 'm ' + Math.floor(t % 60) + 's' : Math.ceil(t) + 's';
  }
  function bar(frac, color, h) {
    return '<span style="display:block;height:' + (h || 6) + 'px;border-radius:4px;background:rgba(255,255,255,.1);overflow:hidden">' +
      '<span style="display:block;height:100%;width:' + (U.clamp(frac, 0, 1) * 100) + '%;background:' + color + '"></span></span>';
  }
  var BTN = 'font:650 .78rem Outfit,sans-serif;color:#eef1ff;cursor:pointer;border-radius:10px;' +
    'border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.07);padding:6px 10px';
  function btn(act, arg, label, on, extra) {
    return '<button type="button" data-act="' + act + '"' + (arg != null ? ' data-arg="' + arg + '"' : '') +
      ' style="' + BTN + ';' + (on === false ? 'opacity:.45;cursor:default;' : '') + (extra || '') + '">' + label + '</button>';
  }
  function title(t) {
    return '<div style="font:700 .72rem Outfit,sans-serif;color:#a8b0d8;letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px">' + t + '</div>';
  }
  function dim(t) { return '<span style="color:#8b93bd">' + t + '</span>'; }
  function deny() { Milo.sound.tone({ f: 140, d: .1, v: .05, type: 'square' }); }
  function sum(obj) { var s = 0; for (var k in obj) s += obj[k] || 0; return s; }

  /* -------------------------------------------------------- shared engine */

  /**
   * def: { id, title, emo, bg, unit, unitLabel, unitEmo, tapEmo, tapLabel,
   *        tapVerb, theme:{accent,glow,btn[],tapF}, gens[], ups[], twist }
   * gens: { id, name, emo, base, mult, rate, unlock?(d,m,api), hint?, info?(d,m,api) }
   * ups:  { id, name, emo, desc, base, mult, max?, fx:{...}, perm?, unlock? }
   * fx keys: tapAdd (+n per tap), tapMul/rateMul (×), tapRate (taps gain a
   *   fraction of rate), discount (generator prices), genMul:{genId:×}, and
   *   any custom key a twist reads back out of mods().
   * twist hooks: init, load, start, update, render, act, tap, rate, rateMul,
   *   tapMul, onBuyGen (return false to veto), onBuyUp, offline, stat, style.
   */
  function makeIdle(def) {
    var T = def.twist || {};
    var upById = {}, genById = {};
    def.ups.forEach(function (u) { upById[u.id] = u; });
    def.gens.forEach(function (g, i) { g.idx = i; genById[g.id] = g; });
    var stats = [def.unitLabel, 'Per sec', 'Earned'];
    if (T.stat) stats.push(T.stat[0]);

    return function mount(host) {
      var KEY = def.id + ':save';
      var curEl, rateEl, bigBtn, twistEl, msgEl, shopEl, wrapEl, hintEl;
      var lastShop = '', lastTwist = '', lastPad = 0, G = null;

      // These games carry four stat chips, which wrap to two rows on a narrow
      // stage and then sit on top of the currency. Keep the board clear of
      // whatever height the HUD actually ended up being.
      function clearHud(g) {
        var top = g.hud && g.hud.querySelector('.hud-top');
        var want = Math.max(58, (top ? top.offsetHeight : 0) + 16);
        if (want !== lastPad) { lastPad = want; g.root.style.paddingTop = want + 'px'; }
      }

      function mods(d) {
        var m = { tapAdd: 0, tapMul: 1, rateMul: 1, tapRate: 0, discount: 0, genMul: {} };
        def.ups.forEach(function (u) {
          var n = d.ups[u.id] || 0;
          if (!n || !u.fx) return;
          for (var k in u.fx) {
            var v = u.fx[k];
            if (k === 'tapMul' || k === 'rateMul') m[k] *= Math.pow(v, n);
            else if (k === 'genMul') { for (var id in v) m.genMul[id] = (m.genMul[id] || 1) * Math.pow(v[id], n); }
            else m[k] = (m[k] || 0) + v * n;
          }
        });
        return m;
      }
      function buffMul(d, k) {
        var x = 1;
        for (var i = 0; i < d.buffs.length; i++) if (d.buffs[i][k]) x *= d.buffs[i][k];
        return x;
      }
      function genRate(d, gen, m) {
        var n = d.gens[gen.id] || 0;
        return n ? n * gen.rate * (m.genMul[gen.id] || 1) : 0;
      }
      // Summed generator output × upgrade multipliers (× timed buffs unless raw).
      function baseRate(d, m, raw) {
        m = m || mods(d);
        var r = 0;
        for (var i = 0; i < def.gens.length; i++) r += genRate(d, def.gens[i], m);
        return r * m.rateMul * (raw ? 1 : buffMul(d, 'rateMul'));
      }
      function rate(d, m) {
        m = m || mods(d);
        var b = baseRate(d, m);
        if (T.rate) return T.rate(d, m, b, api);
        return b * (T.rateMul ? T.rateMul(d, m) : 1);
      }
      function tapValue(d, m) {
        m = m || mods(d);
        var v = (1 + m.tapAdd + rate(d, m) * m.tapRate) * m.tapMul * buffMul(d, 'tapMul');
        if (T.tapMul) v *= T.tapMul(d, m);
        return v;
      }
      function genCost(gen, d, m) {
        var n = def.costCount ? def.costCount(d, gen) : (d.gens[gen.id] || 0);
        var c = gen.base * Math.pow(gen.mult, n);
        if (m && m.discount) c *= Math.max(0.25, 1 - m.discount);
        return Math.ceil(c);
      }
      function upCost(u, d) { return Math.ceil(u.base * Math.pow(u.mult, d.ups[u.id] || 0)); }
      function genUnlocked(d, gen, m) { return !gen.unlock || gen.unlock(d, m, api); }

      var api = {
        fmt: fmt, mods: mods, rate: rate, baseRate: baseRate, tapValue: tapValue, buffMul: buffMul,
        genCost: genCost, gens: def.gens, ups: upById, deny: deny,
        genTotal: function (d) { return sum(d.gens); },
        add: function (d, n) { d.cur += n; d.total += n; },
        msg: function (d, text, t) { d.msg = text; d.msgT = t || 5; },
        buff: function (d, b) {
          for (var i = 0; i < d.buffs.length; i++) {
            if (d.buffs[i].label === b.label) { d.buffs[i].t = Math.max(d.buffs[i].t, b.t); return; }
          }
          d.buffs.push(b);
        },
        refresh: function () { if (G) refresh(G); },
        burst: function (ch, n) { burst(ch, n || 8, null); },
        setBg: function (c) { host.style.background = c; }
      };

      function load() {
        var s = Milo.store.get(KEY, null);
        if (!s || typeof s !== 'object') return null;
        s.away = U.clamp((Date.now() - (s.at || Date.now())) / 1000, 0, 4 * 3600);
        return s;
      }
      function save(d) {
        if (!d || !d.gens) return;
        Milo.store.set(KEY, {
          cur: d.cur, total: d.total, gens: d.gens, ups: d.ups, taps: d.taps,
          tw: d.tw, buffs: d.buffs, at: Date.now()
        });
        Milo.store.setBest(def.id, Math.floor(d.total));
      }

      function init(g) {
        G = g;
        var d = g.data, s = load();
        d.cur = s ? (+s.cur || 0) : (def.startCur || 0);
        d.total = s ? (+s.total || 0) : d.cur;
        d.gens = (s && s.gens) || {};
        d.ups = (s && s.ups) || {};
        d.taps = (s && s.taps) || 0;
        d.buffs = (s && s.buffs) || [];
        d.tw = {};
        if (T.init) T.init(d, api);
        if (s && s.tw) { if (T.load) T.load(d, s.tw, api); else Object.assign(d.tw, s.tw); }
        d.msg = ''; d.msgT = 0; d.saveT = 0; d.tick = 0;
        lastShop = ''; lastTwist = '';
        host.style.background = def.bg;
        build(g);
        if (s && s.away > 60) {
          var r = rate(d);
          var gained = T.offline ? T.offline(d, s.away, r, api) : r * s.away;
          if (gained > 0) {
            api.add(d, gained);
            api.msg(d, 'Welcome back — you earned ' + fmt(gained) + ' ' + def.unit +
              ' while away (' + secs(s.away) + ').', 9);
          }
        }
        // Milestones fire on every new power of ten earned; seed the counter
        // from the loaded save so returning players do not get a fanfare.
        d.mile = Math.max(3, Math.floor(Math.log(Math.max(1, d.total)) / Math.LN10) + 1);
        if (T.start) T.start(g, d, api);
        refresh(g);
      }

      function mk(tag, css) { var n = document.createElement(tag); if (css) n.style.cssText = css; return n; }

      function build(g) {
        wrapEl = mk('div', 'display:flex;gap:16px;width:100%;max-width:900px;flex-wrap:wrap;' +
          'justify-content:center;align-items:flex-start;margin:auto');
        var left = mk('div', 'flex:1 1 300px;min-width:270px;max-width:430px;display:flex;' +
          'flex-direction:column;align-items:center;gap:8px');
        curEl = mk('div', 'font:800 clamp(24px,5vw,38px)/1 Outfit,sans-serif;color:' + def.theme.accent +
          ';text-shadow:0 0 22px ' + def.theme.glow + ';text-align:center');
        rateEl = mk('div', 'color:#a8b0d8;font-size:.82rem;text-align:center;min-height:1.2em;max-width:40ch');
        bigBtn = mk('button', 'width:min(36vw,140px);aspect-ratio:1;border-radius:50%;border:0;cursor:pointer;' +
          'font-size:clamp(40px,10vw,64px);background:radial-gradient(circle at 35% 30%,' + def.theme.btn.join(',') + ');' +
          'box-shadow:0 12px 34px ' + def.theme.glow + ',inset 0 -8px 20px rgba(0,0,0,.25);' +
          'transition:transform .07s,width .3s;user-select:none;-webkit-user-select:none;touch-action:manipulation');
        bigBtn.type = 'button';
        bigBtn.textContent = def.tapEmo;
        bigBtn.title = def.tapLabel;
        bigBtn.setAttribute('aria-label', def.tapLabel);
        bigBtn.addEventListener('pointerdown', function () { bigBtn.style.transform = 'scale(.93)'; });
        bigBtn.addEventListener('pointerup', function () { bigBtn.style.transform = ''; });
        bigBtn.addEventListener('pointerleave', function () { bigBtn.style.transform = ''; });
        bigBtn.addEventListener('click', function (e) { tap(g, e); });
        var hint = hintEl = mk('div', 'color:#8b93bd;font-size:.74rem;text-align:center');
        twistEl = mk('div', 'width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);' +
          'border-radius:14px;padding:10px 12px;font-size:.8rem;color:#dfe3ff;line-height:1.4');
        twistEl.addEventListener('click', function (e) {
          var b = e.target.closest('[data-act]');
          if (!b || !T.act) return;
          T.act(g, g.data, b.dataset.act, b.dataset.arg, api);
          refresh(g); save(g.data);
        });
        msgEl = mk('div', 'color:#34d399;font-size:.8rem;text-align:center;min-height:1.2em;max-width:40ch');
        left.appendChild(curEl); left.appendChild(rateEl); left.appendChild(bigBtn); left.appendChild(hint);
        left.appendChild(twistEl); left.appendChild(msgEl);

        shopEl = mk('div', 'flex:1 1 300px;min-width:270px;max-width:430px;max-height:min(72vh,540px);' +
          'overflow-y:auto;display:flex;flex-direction:column;gap:6px;padding-right:4px');
        shopEl.addEventListener('click', function (e) {
          var b = e.target.closest('[data-gen],[data-up],[data-reset]');
          if (!b) return;
          if (b.dataset.gen) buyGen(g, b.dataset.gen);
          else if (b.dataset.up) buyUp(g, b.dataset.up);
          else askReset(g);
        });
        wrapEl.appendChild(left); wrapEl.appendChild(shopEl);
        g.root.innerHTML = '';
        g.root.appendChild(wrapEl);
      }

      function floatText(text, e) {
        var rect = host.getBoundingClientRect(), x, y;
        if (e && e.clientX) { x = e.clientX - rect.left; y = e.clientY - rect.top; }
        else { var b = bigBtn.getBoundingClientRect(); x = b.left + b.width / 2 - rect.left; y = b.top + b.height / 2 - rect.top; }
        var n = document.createElement('div');
        n.textContent = text;
        n.style.cssText = 'position:absolute;left:' + x + 'px;top:' + y + 'px;pointer-events:none;color:' + def.theme.accent +
          ';font:800 16px Outfit,sans-serif;z-index:7;transition:transform .7s ease-out,opacity .7s';
        host.appendChild(n);
        requestAnimationFrame(function () { n.style.transform = 'translate(-50%,-52px)'; n.style.opacity = '0'; });
        setTimeout(function () { n.remove(); }, 750);
      }

      // A short puff of particles from the tap point — pure juice.
      function burst(ch, count, e) {
        var rect = host.getBoundingClientRect(), x, y;
        if (e && e.clientX) { x = e.clientX - rect.left; y = e.clientY - rect.top; }
        else if (bigBtn) { var b = bigBtn.getBoundingClientRect(); x = b.left + b.width / 2 - rect.left; y = b.top + b.height / 2 - rect.top; }
        else { x = rect.width / 2; y = rect.height / 2; }
        for (var i = 0; i < count; i++) spark(ch, x, y);
      }
      function spark(ch, x, y) {
        var n = document.createElement('div');
        n.textContent = ch;
        n.style.cssText = 'position:absolute;left:' + x + 'px;top:' + y + 'px;pointer-events:none;z-index:6;' +
          'font-size:' + (9 + Math.random() * 13).toFixed(1) + 'px;will-change:transform;' +
          'transition:transform .62s cubic-bezier(.2,.7,.3,1),opacity .62s';
        host.appendChild(n);
        var a = Math.random() * Math.PI * 2, r = 26 + Math.random() * 62;
        requestAnimationFrame(function () {
          n.style.transform = 'translate(' + (Math.cos(a) * r).toFixed(1) + 'px,' + (Math.sin(a) * r - 18).toFixed(1) + 'px) scale(.35)';
          n.style.opacity = '0';
        });
        setTimeout(function () { n.remove(); }, 700);
      }

      function tap(g, e) {
        var d = g.data, m = mods(d);
        var gain = T.tap ? T.tap(g, d, m, api) : tapValue(d, m);
        if (gain > 0) api.add(d, gain);
        d.taps++;
        Milo.sound.tone({ f: def.theme.tapF + Math.random() * 100, f2: def.theme.tapF * 1.5, d: .05, v: .05, type: 'square' });
        floatText('+' + fmt(gain), e);
        if (d.taps % 3 === 0) burst(def.unitEmo, 3, e);
        refresh(g);
      }

      function buyGen(g, id) {
        var d = g.data, gen = genById[id];
        if (!gen) return;
        var m = mods(d), cost = genCost(gen, d, m);
        if (!genUnlocked(d, gen, m)) return;
        if (d.cur < cost) { deny(); return; }
        if (T.onBuyGen && T.onBuyGen(d, gen, api) === false) { deny(); refresh(g); return; }
        d.cur -= cost;
        d.gens[id] = (d.gens[id] || 0) + 1;
        Milo.sound.powerup();
        refresh(g); save(d);
      }
      function buyUp(g, id) {
        var d = g.data, u = upById[id];
        if (!u) return;
        var n = d.ups[id] || 0;
        if (u.max && n >= u.max) return;
        var cost = upCost(u, d);
        if (d.cur < cost) { deny(); return; }
        d.cur -= cost;
        d.ups[id] = n + 1;
        if (T.onBuyUp) T.onBuyUp(d, u, api);
        Milo.sound.powerup();
        refresh(g); save(d);
      }

      function askReset(g) {
        g.overlay({
          emo: '🗑️', title: 'Reset progress?',
          text: 'This wipes your ' + def.title + ' save in this browser and starts again from nothing.',
          actions: [
            { label: 'Keep playing', primary: true, onClick: function () { g.clearOverlay(); } },
            { label: 'Reset everything', onClick: function () { Milo.store.set(KEY, null); g.clearOverlay(); g.restart(); } }
          ]
        });
      }

      function row(attr, emo, name, badge, desc, cost, can, locked) {
        return '<button ' + attr + ' type="button" style="display:flex;align-items:center;gap:10px;text-align:left;' +
          'width:100%;padding:8px 10px;border-radius:12px;cursor:' + (can ? 'pointer' : 'default') + ';font:inherit;color:#eef1ff;' +
          'border:1px solid ' + (can ? 'rgba(52,211,153,.5)' : 'rgba(255,255,255,.08)') + ';' +
          'background:' + (can ? 'rgba(52,211,153,.10)' : 'rgba(255,255,255,.04)') + ';' +
          'opacity:' + (locked ? '.5' : can ? '1' : '.65') + '">' +
          '<span style="font-size:22px">' + emo + '</span>' +
          '<span style="flex:1;min-width:0"><span style="font-weight:700;font-size:.88rem">' + name +
          (badge ? ' <span style="color:#22d3ee">' + badge + '</span>' : '') + '</span><br>' +
          '<span style="font-size:.74rem;color:#a8b0d8">' + desc + '</span></span>' +
          '<span style="font-weight:800;font-size:.84rem;white-space:nowrap;color:' + (can ? '#34d399' : '#8b93bd') + '">' +
          cost + '</span></button>';
      }
      function section(t) {
        return '<div style="font:700 .72rem Outfit,sans-serif;color:#a8b0d8;letter-spacing:.06em;text-transform:uppercase;margin-top:4px">' + t + '</div>';
      }

      function shopHtml(d, m) {
        var h = section(def.genLabel || 'Generators'), lockShown = false;
        def.gens.forEach(function (gen) {
          var n = d.gens[gen.id] || 0;
          if (!n && d.total < gen.base * 0.3) return;
          if (!genUnlocked(d, gen, m)) {
            if (lockShown) return;
            lockShown = true;
            h += row('data-lock="1"', '🔒', gen.name, '', gen.hint || 'Locked', '', false, true);
            return;
          }
          var cost = genCost(gen, d, m);
          var info = gen.info ? gen.info(d, m, api)
            : fmt(gen.rate * (m.genMul[gen.id] || 1)) + ' ' + (def.genUnit || def.unit + '/s') + ' each';
          h += row('data-gen="' + gen.id + '"', gen.emo, gen.name, n ? '×' + fmt(n) : '', info, fmt(cost), d.cur >= cost, false);
        });
        h += section('Upgrades');
        def.ups.forEach(function (u) {
          var n = d.ups[u.id] || 0;
          if (!n && d.total < u.base * 0.35) return;
          if (!n && u.unlock && !u.unlock(d, m, api)) return;
          var maxed = u.max && n >= u.max, cost = upCost(u, d);
          h += row('data-up="' + u.id + '"', u.emo, u.name, n ? 'Lv ' + n + (u.max ? '/' + u.max : '') : '',
            u.desc + (u.perm ? ' · keeps through time travel' : ''), maxed ? 'MAX' : fmt(cost), !maxed && d.cur >= cost, false);
        });
        h += '<button data-reset="1" type="button" style="' + BTN + ';margin-top:8px;opacity:.7;align-self:center">🗑️ Reset progress</button>';
        return h;
      }

      function refresh(g) {
        var d = g.data, m = mods(d), r = rate(d, m);
        curEl.textContent = fmt(d.cur) + ' ' + def.unitEmo;
        var buffTxt = d.buffs.map(function (b) { return b.label + ' ' + secs(b.t); }).join(' · ');
        rateEl.textContent = fmt(r) + ' ' + def.unit + '/s · ' + fmt(tapValue(d, m)) + ' per ' + def.tapVerb +
          (buffTxt ? ' · ' + buffTxt : '');
        g.set(def.unitLabel, fmt(d.cur));
        g.set('Per sec', fmt(r));
        g.set('Earned', fmt(d.total));
        if (T.stat) g.set(T.stat[0], T.stat[1](d, m, api));
        g.score = Math.floor(d.total);
        var best = Milo.store.best(def.id);
        hintEl.textContent = def.tapLabel + (best > d.total + 1 ? '  ·  🏆 best run ' + fmt(best) : '');
        msgEl.textContent = d.msgT > 0 ? d.msg : '';
        clearHud(g);
        var sh = shopHtml(d, m);
        if (sh !== lastShop) { lastShop = sh; shopEl.innerHTML = sh; }
        if (T.render) {
          var th = T.render(d, m, api);
          if (th !== lastTwist) { lastTwist = th; twistEl.innerHTML = th; }
        }
        if (T.style) T.style(d, m, api, bigBtn);
      }

      return Milo.domGame(host, {
        id: def.id,
        stats: stats,
        bg: def.bg,
        emo: def.emo,
        trackBest: false,
        autoStart: true,
        start: { title: def.title },
        init: init,
        update: function (g, dt) {
          var d = g.data, m = mods(d);
          if (def.passive !== false) {
            var r = rate(d, m);
            if (r > 0) api.add(d, r * dt);
          }
          for (var i = d.buffs.length - 1; i >= 0; i--) {
            d.buffs[i].t -= dt;
            if (d.buffs[i].t <= 0) d.buffs.splice(i, 1);
          }
          if (T.update) T.update(g, d, dt, m, api);
          var lvl = Math.floor(Math.log(Math.max(1, d.total)) / Math.LN10) + 1;
          if (lvl > d.mile) {
            var hit = Math.pow(10, lvl - 1);
            d.mile = lvl;
            api.msg(d, '🏆 Milestone — ' + fmt(hit) + ' ' + def.unit + ' earned all told!', 6);
            Milo.sound.win();
            burst('✨', 12, null);
          }
          if (d.msgT > 0) d.msgT -= dt;
          d.tick += dt;
          if (d.tick > 0.2) { d.tick = 0; refresh(g); }
          d.saveT += dt;
          if (d.saveT > 5) { d.saveT = 0; save(d); }
        },
        onKey: function (g, e, name) { if (name === 'action') tap(g, null); },
        destroy: function (g) { save(g.data); }
      });
    };
  }

  function reg(def, meta) {
    Milo.register({
      id: def.id, title: def.title, emo: def.emo, category: 'Casual',
      tagline: meta.tagline, description: meta.description,
      controls: meta.controls || ['Click the ' + def.tapVerb + ' button', 'Click to buy', 'Space also ' + def.tapVerb + 's'],
      colors: meta.colors, scoreLabel: def.unit, tags: meta.tags,
      mount: makeIdle(def)
    });
  }

  /* ================================================== 1. Potion Lab 🧪 */
  /* Twist: a brew queue. Potions cost a slice of your production, take real
     seconds to brew, and each does something different — pure profit, a
     production buff, or a stir multiplier. Generators unlock by potions bottled. */

  var POTIONS = [
    { id: 'tonic', name: 'Tonic', emo: '🧴', secs: 10, time: 10, pay: 2.5, min: 0, desc: 'sells for 2.5× its ingredients' },
    { id: 'haste', name: 'Haste Draught', emo: '💨', secs: 30, time: 20, buff: { rateMul: 2, t: 45 }, min: 300, desc: '×2 production for 45 s' },
    { id: 'midas', name: 'Midas Brew', emo: '👑', secs: 40, time: 30, buff: { tapMul: 10, t: 30 }, min: 2500, desc: '×10 stirs for 30 s' },
    { id: 'plenty', name: 'Elixir of Plenty', emo: '🏺', secs: 60, time: 45, payRate: 180, min: 20000, desc: 'pays out 3 min of production' },
    { id: 'philo', name: "Philosopher's Draught", emo: '💎', secs: 150, time: 90, buff: { rateMul: 4, t: 90 }, min: 250000, desc: '×4 production for 90 s' }
  ];
  var potionById = {};
  POTIONS.forEach(function (p) { potionById[p.id] = p; });
  function potionCost(d, p, m, api) {
    var r = api.baseRate(d, m, true);
    return Math.ceil(Math.max(p.secs * 2, r * p.secs) * Math.max(0.3, 1 - (m.cheap || 0)));
  }
  function brewedAtLeast(n) {
    return { unlock: function (d) { return d.tw.brewed >= n; }, hint: 'Bottle ' + n + ' potions to unlock' };
  }

  reg({
    id: 'idle-potion-lab', title: 'Potion Lab', emo: '🧪', bg: '#1a1030',
    unit: 'essence', unitLabel: 'Essence', unitEmo: '✨', tapEmo: '🧪', tapLabel: 'Stir the cauldron', tapVerb: 'stir',
    theme: { accent: '#c084fc', glow: 'rgba(192,132,252,.4)', btn: ['#f0abfc', '#a855f7 60%', '#4c1d95'], tapF: 620 },
    gens: [
      { id: 'appr', name: 'Apprentice', emo: '🧑‍🎓', base: 15, mult: 1.15, rate: 0.2 },
      { id: 'herb', name: 'Herb Garden', emo: '🌿', base: 100, mult: 1.15, rate: 1 },
      Object.assign({ id: 'alembic', name: 'Copper Alembic', emo: '⚗️', base: 1100, mult: 1.15, rate: 8 }, brewedAtLeast(3)),
      Object.assign({ id: 'mandrake', name: 'Mandrake Choir', emo: '🌱', base: 12000, mult: 1.15, rate: 47 }, brewedAtLeast(10)),
      Object.assign({ id: 'furnace', name: 'Salamander Furnace', emo: '🔥', base: 130000, mult: 1.15, rate: 260 }, brewedAtLeast(25)),
      Object.assign({ id: 'phoenix', name: 'Phoenix Still', emo: '🪶', base: 1.4e6, mult: 1.15, rate: 1400 }, brewedAtLeast(60)),
      Object.assign({ id: 'engine', name: "Philosopher's Engine", emo: '🪙', base: 2e7, mult: 1.15, rate: 7800 }, brewedAtLeast(150))
    ],
    ups: [
      { id: 'ladle', name: 'Longer Ladle', emo: '🥄', desc: '+1 essence per stir', base: 30, mult: 2.6, max: 10, fx: { tapAdd: 1 } },
      { id: 'cauldron2', name: 'Second Cauldron', emo: '🍲', desc: 'Brew queue holds 2 more potions', base: 250, mult: 4, max: 4, fx: { queue: 2 } },
      { id: 'coals', name: 'Hot Coals', emo: '🔥', desc: 'Potions brew 20% faster', base: 800, mult: 3, max: 6, fx: { brewSpeed: 0.2 } },
      { id: 'stir', name: 'Enchanted Stirring', emo: '🌀', desc: 'Each stir also gains 2% of essence/s', base: 400, mult: 3, max: 8, fx: { tapRate: 0.02 } },
      { id: 'bulk', name: 'Bulk Reagents', emo: '🧂', desc: 'Potion ingredients cost 10% less', base: 3000, mult: 3.5, max: 5, fx: { cheap: 0.1 } },
      { id: 'grimoire', name: 'Ancient Grimoire', emo: '📖', desc: 'All production +25%', base: 5000, mult: 4, max: 6, fx: { rateMul: 1.25 } },
      { id: 'goldalembic', name: 'Golden Alembics', emo: '✨', desc: 'Copper Alembics produce ×2', base: 20000, mult: 5, max: 3, fx: { genMul: { alembic: 2 } } }
    ],
    twist: {
      init: function (d) { d.tw = { q: [], cur: null, t: 0, brewed: 0 }; },
      update: function (g, d, dt, m, api) {
        var tw = d.tw;
        if (!tw.cur) return;
        var p = potionById[tw.cur.id];
        if (!p) { tw.cur = null; return; }
        tw.t += dt * (1 + (m.brewSpeed || 0));
        if (tw.t < p.time) return;
        tw.brewed++;
        if (p.pay) {
          api.add(d, tw.cur.paid * p.pay);
          api.msg(d, p.emo + ' ' + p.name + ' sold for ' + fmt(tw.cur.paid * p.pay) + ' essence.');
          Milo.sound.coin();
        } else if (p.payRate) {
          var v = api.baseRate(d, m, true) * p.payRate;
          api.add(d, v);
          api.msg(d, p.emo + ' ' + p.name + ' paid out ' + fmt(v) + ' essence.');
          Milo.sound.coin();
        } else if (p.buff) {
          api.buff(d, { label: p.emo + ' ' + p.name, rateMul: p.buff.rateMul, tapMul: p.buff.tapMul, t: p.buff.t });
          api.msg(d, p.emo + ' ' + p.name + ' is active — ' + p.desc + '.');
          Milo.sound.powerup();
        }
        tw.cur = tw.q.length ? tw.q.shift() : null;
        tw.t = 0;
      },
      act: function (g, d, act, arg, api) {
        var tw = d.tw, m = api.mods(d);
        if (act === 'queue') {
          var p = potionById[arg];
          if (!p || d.total < p.min) return;
          var cap = 1 + (m.queue || 0);
          if ((tw.cur ? 1 : 0) + tw.q.length >= cap) { api.msg(d, 'The brew queue is full — a Second Cauldron adds slots.'); deny(); return; }
          var cost = potionCost(d, p, m, api);
          if (d.cur < cost) { api.msg(d, 'You need ' + fmt(cost) + ' essence of ingredients for a ' + p.name + '.'); deny(); return; }
          d.cur -= cost;
          var item = { id: p.id, paid: cost };
          if (!tw.cur) { tw.cur = item; tw.t = 0; } else tw.q.push(item);
          Milo.sound.click();
        } else if (act === 'clear') {
          tw.q.forEach(function (x) { d.cur += x.paid; });
          tw.q = [];
          Milo.sound.click();
        }
      },
      render: function (d, m, api) {
        var tw = d.tw, cap = 1 + (m.queue || 0);
        var h = title('Cauldron · ' + tw.brewed + ' potions bottled');
        if (tw.cur) {
          var p = potionById[tw.cur.id];
          h += '<div>' + p.emo + ' Brewing <b>' + p.name + '</b> · ' + secs((p.time - tw.t) / (1 + (m.brewSpeed || 0))) + '</div>' +
            bar(tw.t / p.time, '#c084fc');
        } else h += dim('The cauldron is idle — queue a potion below.');
        h += '<div style="margin:6px 0;color:#a8b0d8">Queue ' + ((tw.cur ? 1 : 0) + tw.q.length) + '/' + cap + ' · ' +
          (tw.q.map(function (x) { return potionById[x.id].emo; }).join(' ') || '—') +
          (tw.q.length ? ' ' + btn('clear', null, 'Refund queue', true) : '') + '</div>';
        var lockShown = false;
        h += '<div style="display:flex;flex-direction:column;gap:4px">' + POTIONS.map(function (p) {
          if (d.total < p.min) {
            if (lockShown) return '';
            lockShown = true;
            return dim('🔒 ' + p.name + ' — unlocks at ' + fmt(p.min) + ' essence earned');
          }
          var cost = potionCost(d, p, m, api);
          return '<div style="display:flex;align-items:center;gap:8px"><span style="font-size:18px">' + p.emo +
            '</span><span style="flex:1;min-width:0"><b>' + p.name + '</b> ' + dim(p.desc + ' · brews ' + p.time + ' s') + '</span>' +
            btn('queue', p.id, fmt(cost), d.cur >= cost) + '</div>';
        }).join('') + '</div>';
        return h;
      },
      offline: function (d, away, r) { if (d.tw.cur) d.tw.t += away; return r * away; },
      stat: ['Brewed', function (d) { return d.tw.brewed; }]
    }
  }, {
    tagline: 'Queue the right potion at the right time',
    description: 'Stir the cauldron for essence and spend it on apprentices, herb gardens, alembics and ' +
      'stranger things that stir for you. The twist is the brew queue: a Tonic costs ten seconds of ' +
      'production and sells for 2.5× that, a Haste Draught doubles everything for 45 seconds, and a ' +
      'Midas Brew makes every stir worth ten. Alembics and beyond only unlock once you have bottled ' +
      'enough potions, so keep the cauldron busy. Tip: queue a Haste Draught right before an Elixir of ' +
      'Plenty finishes — the payout is based on live production.',
    controls: ['Click the cauldron', 'Space also stirs', 'Queue a potion to brew'],
    colors: ['#a855f7', '#4c1d95'],
    tags: ['idle', 'clicker', 'potions', 'upgrades']
  });

  /* ================================================ 2. Robot Works 🤖 */
  /* Twist: robots assemble robots. Only Bolt-bots make parts; every higher
     tier builds the tier below it in real time, so output compounds. Prices
     scale off robots you bought, not ones that were assembled for free. */

  var ASM = 0.05; // robots built per second, per robot of the tier above

  reg({
    id: 'idle-robot-works', title: 'Robot Works', emo: '🤖', bg: '#101a24',
    unit: 'parts', unitLabel: 'Parts', unitEmo: '⚙️', tapEmo: '🔧', tapLabel: 'Weld a part', tapVerb: 'weld',
    theme: { accent: '#67e8f9', glow: 'rgba(103,232,249,.35)', btn: ['#cffafe', '#22d3ee 60%', '#155e75'], tapF: 520 },
    genLabel: 'Robots',
    costCount: function (d, gen) { return (d.tw.bought && d.tw.bought[gen.id]) || 0; },
    gens: (function () {
      var names = [
        ['bolt', 'Bolt-bot', '🔩', 12, 1.15],
        ['welder', 'Welder Unit', '🤖', 150, 1.18],
        ['foreman', 'Foreman Frame', '🦾', 2000, 1.2],
        ['brain', 'Factory Brain', '🧠', 30000, 1.22],
        ['swarm', 'Nano Swarm', '🐜', 5e5, 1.24],
        ['forge', 'Orbital Forge', '🛰️', 8e6, 1.26],
        ['core', 'Singularity Core', '🌀', 1.5e8, 1.3]
      ];
      return names.map(function (n, i) {
        var gen = { id: n[0], name: n[1], emo: n[2], base: n[3], mult: n[4], rate: i === 0 ? 0.2 : 0 };
        if (i > 0) {
          gen.unlock = function (d) { return (d.gens[names[i - 1][0]] || 0) >= 3; };
          gen.hint = 'Own 3 ' + names[i - 1][1] + 's to unlock';
          gen.info = function (d, m) {
            var spd = ASM * (1 + (m.asm || 0)) * (d.tw.oc > 0 ? 3 : 1);
            return 'builds ' + fmt(spd * 60) + ' ' + names[i - 1][1] + 's/min each';
          };
        } else gen.info = function (d, m) { return fmt(0.2 * (m.genMul.bolt || 1)) + ' parts/s each'; };
        return gen;
      });
    })(),
    ups: [
      { id: 'torque', name: 'Torque Wrench', emo: '🔧', desc: '+1 part per weld', base: 25, mult: 2.5, max: 12, fx: { tapAdd: 1 } },
      { id: 'belt', name: 'Conveyor Belt', emo: '🏗️', desc: 'Assembly 25% faster on every tier', base: 600, mult: 3, max: 8, fx: { asm: 0.25 } },
      { id: 'lube', name: 'Lubricant', emo: '🛢️', desc: 'Bolt-bots make ×2 parts', base: 1500, mult: 5, max: 4, fx: { genMul: { bolt: 2 } } },
      { id: 'recycler', name: 'Recycler', emo: '♻️', desc: 'Each weld also gains 1% of parts/s', base: 3000, mult: 3, max: 8, fx: { tapRate: 0.01 } },
      { id: 'qc', name: 'Quality Control', emo: '🔍', desc: 'All output +20%', base: 8000, mult: 3.5, max: 6, fx: { rateMul: 1.2 } },
      { id: 'blueprint', name: 'Blueprint Archive', emo: '📐', desc: 'Robot prices 5% lower', base: 25000, mult: 4, max: 5, fx: { discount: 0.05 } },
      { id: 'chip', name: 'Overclock Chip', emo: '⚡', desc: 'Overclock lasts 5 s longer', base: 50000, mult: 3, max: 4, fx: { ocTime: 5 } }
    ],
    twist: {
      init: function (d) { d.tw = { bought: {}, made: 0, oc: 0, cd: 0 }; },
      onBuyGen: function (d, gen) { d.tw.bought[gen.id] = (d.tw.bought[gen.id] || 0) + 1; },
      update: function (g, d, dt, m, api) {
        var tw = d.tw, gens = api.gens;
        var spd = ASM * (1 + (m.asm || 0)) * (tw.oc > 0 ? 3 : 1);
        for (var i = gens.length - 1; i >= 1; i--) {
          var n = d.gens[gens[i].id] || 0;
          if (!n) continue;
          var made = n * spd * dt;
          d.gens[gens[i - 1].id] = (d.gens[gens[i - 1].id] || 0) + made;
          tw.made += made;
        }
        if (tw.oc > 0) { tw.oc -= dt; if (tw.oc <= 0) api.msg(d, 'Overclock finished — the line is back to normal.'); }
        else if (tw.cd > 0) tw.cd -= dt;
      },
      rateMul: function (d) { return d.tw.oc > 0 ? 0.5 : 1; },
      act: function (g, d, act, arg, api) {
        var tw = d.tw, m = api.mods(d);
        if (act !== 'oc' || tw.oc > 0 || tw.cd > 0) return;
        if ((d.gens.welder || 0) < 1) { api.msg(d, 'Nothing to overclock yet — buy a Welder Unit first.'); deny(); return; }
        tw.oc = 15 + (m.ocTime || 0);
        tw.cd = 60;
        api.msg(d, 'Overclock! Assembly ×3, parts output halved for ' + Math.round(tw.oc) + ' s.');
        Milo.sound.powerup();
      },
      render: function (d, m, api) {
        var tw = d.tw, gens = api.gens;
        var h = title('Assembly cascade · ' + fmt(tw.made) + ' robots self-built');
        var rows = [];
        for (var i = gens.length - 1; i >= 0; i--) {
          var n = d.gens[gens[i].id] || 0, b = tw.bought[gens[i].id] || 0;
          if (!n && !b) continue;
          rows.push('<div style="display:flex;justify-content:space-between;gap:8px"><span>' + gens[i].emo + ' ' + gens[i].name +
            '</span><span><b>' + fmt(n) + '</b>' + (n - b > 0.5 ? dim(' (' + fmt(n - b) + ' assembled)') : '') +
            (i > 0 ? ' ↓' : ' → parts') + '</span></div>');
        }
        h += rows.length ? rows.join('') : dim('Buy a Bolt-bot, then Welder Units that build Bolt-bots for you.');
        h += '<div style="margin-top:8px;display:flex;align-items:center;gap:8px">' +
          btn('oc', null, tw.oc > 0 ? '⚡ Overclocked ' + secs(tw.oc) : tw.cd > 0 ? 'Cooling ' + secs(tw.cd) : '⚡ Overclock', tw.oc <= 0 && tw.cd <= 0) +
          dim('×3 assembly, ½ parts, 60 s cooldown') + '</div>';
        return h;
      },
      offline: function (d, away, r, api) {
        // Let the cascade run for the time away in coarse 10 s steps, then pay parts.
        var gens = api.gens, m = api.mods(d), spd = ASM * (1 + (m.asm || 0)), t = 0, earned = 0;
        while (t < away) {
          var step = Math.min(10, away - t);
          for (var i = gens.length - 1; i >= 1; i--) {
            var n = d.gens[gens[i].id] || 0;
            if (n) d.gens[gens[i - 1].id] = (d.gens[gens[i - 1].id] || 0) + n * spd * step;
          }
          earned += api.baseRate(d, m, true) * step;
          t += step;
        }
        return earned;
      },
      stat: ['Robots', function (d, m, api) { return fmt(api.genTotal(d)); }]
    }
  }, {
    tagline: 'Robots that build the robots that build robots',
    description: 'Weld parts by hand, then buy Bolt-bots that make parts for you. Every tier above ' +
      'that — Welder Units, Foreman Frames, Factory Brains — makes no parts at all; instead each one ' +
      'assembles three of the tier below it per minute, forever, so your factory compounds while you ' +
      'watch. Prices only scale with robots you paid for, not ones that were assembled. A tier unlocks ' +
      'once you own three of the one beneath it. Tip: Overclock triples assembly at the cost of half ' +
      'your parts for 15 seconds — use it right after buying a top-tier robot.',
    controls: ['Click the wrench', 'Space also welds', 'Overclock the line'],
    colors: ['#22d3ee', '#155e75'],
    tags: ['idle', 'clicker', 'robots', 'factory']
  });

  /* ============================================== 3. Dragon Hoard 🐉 */
  /* Twist: raids. Send every dragon at a target — income stops while they
     are away, then either a loot jackpot lands or you lose a chunk of the
     hoard and the wounded dragons earn half for a while. Higher dragon tiers
     unlock with raid victories. */

  var RAIDS = [
    { id: 0, name: 'Village', emo: '🏘️', risk: 0.1, mult: 3, time: 15, loss: 0.1, min: 0 },
    { id: 1, name: 'Castle', emo: '🏰', risk: 0.3, mult: 8, time: 30, loss: 0.25, min: 5000 },
    { id: 2, name: "Slayer's Keep", emo: '⚔️', risk: 0.55, mult: 25, time: 45, loss: 0.5, min: 200000 }
  ];
  function winsAtLeast(n) {
    return { unlock: function (d) { return d.tw.wins >= n; }, hint: 'Win ' + n + ' raids to unlock' };
  }

  reg({
    id: 'idle-dragon-hoard', title: 'Dragon Hoard', emo: '🐉', bg: '#2a1608',
    unit: 'gold', unitLabel: 'Gold', unitEmo: '🪙', tapEmo: '💰', tapLabel: 'Polish the hoard', tapVerb: 'polish',
    theme: { accent: '#ffd257', glow: 'rgba(255,210,87,.4)', btn: ['#fff3b0', '#f59e0b 60%', '#7c2d12'], tapF: 700 },
    genLabel: 'Dragons',
    gens: [
      { id: 'wyrmling', name: 'Wyrmling', emo: '🐣', base: 12, mult: 1.16, rate: 0.15 },
      { id: 'drake', name: 'Drake', emo: '🦎', base: 90, mult: 1.16, rate: 0.9 },
      { id: 'wyvern', name: 'Wyvern', emo: '🦇', base: 900, mult: 1.16, rate: 6 },
      Object.assign({ id: 'firedrake', name: 'Fire Drake', emo: '🔥', base: 9000, mult: 1.16, rate: 36 }, winsAtLeast(1)),
      Object.assign({ id: 'frost', name: 'Frost Wyrm', emo: '❄️', base: 90000, mult: 1.16, rate: 200 }, winsAtLeast(5)),
      Object.assign({ id: 'elder', name: 'Elder Dragon', emo: '🐉', base: 1e6, mult: 1.16, rate: 1100 }, winsAtLeast(12)),
      Object.assign({ id: 'cosmic', name: 'Cosmic Leviathan', emo: '🌌', base: 1.5e7, mult: 1.16, rate: 6500 }, winsAtLeast(25))
    ],
    ups: [
      { id: 'polish', name: 'Polished Coins', emo: '✨', desc: '+1 gold per polish', base: 20, mult: 2.5, max: 12, fx: { tapAdd: 1 } },
      { id: 'armour', name: 'Scale Armour', emo: '🛡️', desc: 'Raids 4% less likely to fail', base: 500, mult: 3, max: 8, fx: { armor: 0.04 } },
      { id: 'claws', name: 'Greedy Claws', emo: '🐾', desc: 'Raid loot +25%', base: 800, mult: 3, max: 8, fx: { greed: 0.25 } },
      { id: 'crows', name: 'Scout Crows', emo: '🐦‍⬛', desc: 'Raids 10% shorter', base: 1500, mult: 3.2, max: 5, fx: { scout: 0.1 } },
      { id: 'magnet', name: 'Hoard Magnetism', emo: '🧲', desc: 'Each polish also gains 1.5% of gold/s', base: 2500, mult: 3, max: 8, fx: { tapRate: 0.015 } },
      { id: 'roost', name: 'Dragon Roost', emo: '🏰', desc: 'All dragons +20%', base: 4000, mult: 3.5, max: 8, fx: { rateMul: 1.2 } },
      { id: 'blessing', name: 'Elder Blessing', emo: '🔮', desc: 'Elder Dragons earn ×2', base: 5e6, mult: 5, max: 3, fx: { genMul: { elder: 2 } } }
    ],
    twist: {
      init: function (d) { d.tw = { target: 0, raid: null, wounded: 0, wins: 0, fails: 0 }; },
      rateMul: function (d) { return d.tw.raid ? 0 : d.tw.wounded > 0 ? 0.5 : 1; },
      update: function (g, d, dt, m, api) {
        var tw = d.tw;
        if (tw.wounded > 0) tw.wounded -= dt;
        if (!tw.raid) return;
        tw.raid.t += dt;
        if (tw.raid.t < tw.raid.need) return;
        var R = RAIDS[tw.raid.target];
        var risk = Math.max(0.02, R.risk - (m.armor || 0));
        if (Math.random() >= risk) {
          var loot = api.baseRate(d, m) * R.time * R.mult * (1 + (m.greed || 0));
          api.add(d, loot);
          tw.wins++;
          api.msg(d, R.emo + ' Raid on the ' + R.name + ' succeeded — ' + fmt(loot) + ' gold looted!', 7);
          Milo.sound.win();
        } else {
          var lost = d.cur * R.loss;
          d.cur -= lost;
          tw.fails++;
          tw.wounded = 30;
          api.msg(d, '💥 The ' + R.name + ' fought back — lost ' + fmt(lost) + ' gold, dragons wounded for 30 s.', 7);
          Milo.sound.hit();
        }
        tw.raid = null;
      },
      act: function (g, d, act, arg, api) {
        var tw = d.tw, m = api.mods(d);
        if (act === 'target') { tw.target = +arg; Milo.sound.click(); return; }
        if (act !== 'raid' || tw.raid) return;
        if (api.genTotal(d) < 1) { api.msg(d, 'You need at least one dragon to raid.'); deny(); return; }
        var R = RAIDS[tw.target];
        if (d.total < R.min) return;
        tw.raid = { target: tw.target, t: 0, need: R.time * Math.max(0.4, 1 - (m.scout || 0)) };
        api.msg(d, 'Your dragons take wing toward the ' + R.name + '…');
        Milo.sound.jump();
      },
      render: function (d, m, api) {
        var tw = d.tw;
        var h = title('Raids · ' + tw.wins + ' won, ' + tw.fails + ' failed');
        h += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">' + RAIDS.map(function (R) {
          if (d.total < R.min) return btn('none', null, '🔒 ' + R.name + ' at ' + fmt(R.min), false);
          var on = tw.target === R.id;
          return btn('target', R.id, R.emo + ' ' + R.name, true,
            on ? 'border-color:#ffd257;background:rgba(255,210,87,.15)' : '');
        }).join('') + '</div>';
        var R = RAIDS[tw.target], risk = Math.max(0.02, R.risk - (m.armor || 0));
        var loot = api.baseRate(d, m) * R.time * R.mult * (1 + (m.greed || 0));
        h += '<div>' + dim('Fail chance ') + '<b>' + Math.round(risk * 100) + '%</b> · ' + dim('loot ') + '<b>' + fmt(loot) + '</b> · ' +
          dim('fail loses ') + '<b>' + Math.round(R.loss * 100) + '%</b> of gold · ' + secs(R.time * Math.max(0.4, 1 - (m.scout || 0))) + '</div>';
        if (tw.raid) {
          h += '<div style="margin-top:6px">🐉 Raiding the ' + RAIDS[tw.raid.target].name + ' — income paused · ' +
            secs(tw.raid.need - tw.raid.t) + '</div>' + bar(tw.raid.t / tw.raid.need, '#ffd257');
        } else {
          h += '<div style="margin-top:6px;display:flex;align-items:center;gap:8px">' + btn('raid', null, '⚔️ Send the dragons', api.genTotal(d) >= 1) +
            (tw.wounded > 0 ? '<span style="color:#f87171">🩹 wounded ' + secs(tw.wounded) + '</span>' : '') + '</div>';
        }
        return h;
      },
      offline: function (d, away, r) {
        if (d.tw.raid) d.tw.raid.t = d.tw.raid.need; // resolve on the first frame back
        return r * away;
      },
      stat: ['Raids won', function (d) { return d.tw.wins; }]
    }
  }, {
    tagline: 'Send the dragons raiding — if you dare',
    description: 'Polish the hoard for gold and buy wyrmlings, drakes and wyverns that bring in gold ' +
      'every second. Then gamble: send every dragon to raid a village (10% fail, 3× payout), a castle ' +
      '(30%, 8×) or the Slayer\'s Keep (55%, 25×). Income stops while they are away; a success pays ' +
      'many raids\' worth of production at once, a failure costs a slice of the hoard and halves ' +
      'income for 30 seconds. Fire Drakes and beyond only unlock with raid victories. Tip: Scale ' +
      'Armour knocks 4% off the fail chance per level and stacks, so buy it before touching the Keep.',
    controls: ['Click the hoard', 'Space also polishes', 'Pick a target, send the dragons'],
    colors: ['#f59e0b', '#7c2d12'],
    tags: ['idle', 'clicker', 'dragons', 'risk']
  });

  /* ================================================== 4. Deep Sea 🌊 */
  /* Twist: depth. Light is a second resource (from taps and glow jellies)
     that you spend in lumps to descend; each stratum has its own generators
     and multiplies pearl value, and flares burn light for a production burst. */

  var STRATA = [
    { name: 'Sunlit Zone', emo: '☀️', light: 0, bg: '#0a2e4a' },
    { name: 'Twilight Zone', emo: '🌅', light: 60, bg: '#07223a' },
    { name: 'Midnight Zone', emo: '🌑', light: 500, bg: '#04172c' },
    { name: 'The Abyss', emo: '🕳️', light: 4000, bg: '#030d1c' },
    { name: 'Hadal Trench', emo: '🐉', light: 30000, bg: '#02060f' }
  ];
  function stratum(s) {
    return { unlock: function (d) { return d.tw.depth >= s; }, hint: 'Descend to the ' + STRATA[s].name + ' to unlock' };
  }
  function flareCost(d, m) { return Math.ceil(40 * Math.pow(1.5, d.tw.flares) * Math.max(0.25, 1 - (m.flareDisc || 0))); }

  reg({
    id: 'idle-deep-sea', title: 'Deep Sea', emo: '🌊', bg: '#0a2e4a',
    unit: 'pearls', unitLabel: 'Pearls', unitEmo: '🦪', tapEmo: '🤿', tapLabel: 'Dive for pearls', tapVerb: 'dive',
    theme: { accent: '#7dd3fc', glow: 'rgba(125,211,252,.35)', btn: ['#e0f2fe', '#38bdf8 60%', '#0c4a6e'], tapF: 480 },
    gens: [
      { id: 'snorkel', name: 'Snorkeler', emo: '🏊', base: 15, mult: 1.15, rate: 0.2 },
      { id: 'crab', name: 'Crab Pot', emo: '🦀', base: 100, mult: 1.15, rate: 1 },
      Object.assign({ id: 'diver', name: 'Deep Diver', emo: '🧜', base: 1200, mult: 1.15, rate: 9 }, stratum(1)),
      Object.assign({ id: 'bathy', name: 'Bathysphere', emo: '🔮', base: 13000, mult: 1.15, rate: 55 }, stratum(1)),
      Object.assign({ id: 'angler', name: 'Anglerfish Farm', emo: '🐟', base: 150000, mult: 1.15, rate: 320 }, stratum(2)),
      Object.assign({ id: 'crawler', name: 'Trench Crawler', emo: '🦑', base: 2e6, mult: 1.15, rate: 2000 }, stratum(3)),
      Object.assign({ id: 'leviathan', name: 'Leviathan', emo: '🐋', base: 3e7, mult: 1.15, rate: 12000 }, stratum(4))
    ],
    ups: [
      { id: 'net', name: 'Wider Net', emo: '🕸️', desc: '+1 pearl per dive', base: 25, mult: 2.5, max: 12, fx: { tapAdd: 1 } },
      { id: 'lure', name: 'Lantern Lure', emo: '🏮', desc: '+2 light per dive', base: 80, mult: 2.5, max: 8, fx: { lightTap: 2 } },
      { id: 'jelly', name: 'Glow Jellies', emo: '🪼', desc: '+0.5 light per second', base: 150, mult: 2.8, max: 10, fx: { lightRate: 0.5 } },
      { id: 'polish', name: 'Pearl Polish', emo: '💎', desc: 'Each dive also gains 1% of pearls/s', base: 1500, mult: 3, max: 8, fx: { tapRate: 0.01 } },
      { id: 'suit', name: 'Pressure Suit', emo: '🧑‍🚀', desc: 'All output +20%', base: 2000, mult: 3.5, max: 8, fx: { rateMul: 1.2 } },
      { id: 'hull', name: 'Bioluminescent Hull', emo: '✨', desc: 'Flares cost 25% less light', base: 5000, mult: 3, max: 3, fx: { flareDisc: 0.25 } },
      { id: 'fleet', name: 'Sub Fleet', emo: '🚢', desc: 'Bathyspheres collect ×2', base: 60000, mult: 5, max: 3, fx: { genMul: { bathy: 2 } } }
    ],
    twist: {
      init: function (d) { d.tw = { depth: 0, light: 0, flares: 0, flare: 0 }; },
      start: function (g, d, api) { api.setBg(STRATA[d.tw.depth].bg); },
      tap: function (g, d, m, api) { d.tw.light += 1 + (m.lightTap || 0); return api.tapValue(d, m); },
      update: function (g, d, dt, m) {
        d.tw.light += (m.lightRate || 0) * dt;
        if (d.tw.flare > 0) d.tw.flare -= dt;
      },
      rateMul: function (d) { return (1 + 0.25 * d.tw.depth) * (d.tw.flare > 0 ? 2 : 1); },
      act: function (g, d, act, arg, api) {
        var tw = d.tw, m = api.mods(d);
        if (act === 'descend') {
          if (tw.depth >= STRATA.length - 1) return;
          var need = STRATA[tw.depth + 1].light;
          if (tw.light < need) { api.msg(d, 'You need ' + fmt(need) + ' light to descend safely.'); deny(); return; }
          tw.light -= need;
          tw.depth++;
          api.setBg(STRATA[tw.depth].bg);
          api.msg(d, STRATA[tw.depth].emo + ' Welcome to the ' + STRATA[tw.depth].name + ' — pearls are worth ' + Math.round(25 * tw.depth) + '% more here.', 7);
          Milo.sound.powerup();
        } else if (act === 'flare') {
          var cost = flareCost(d, m);
          if (tw.light < cost) { api.msg(d, 'A flare needs ' + fmt(cost) + ' light.'); deny(); return; }
          tw.light -= cost;
          tw.flares++;
          tw.flare = 30;
          api.msg(d, '🔥 Flare lit — ×2 pearls for 30 s.');
          Milo.sound.coin();
        }
      },
      render: function (d, m, api) {
        var tw = d.tw, S = STRATA[tw.depth];
        var h = title('Depth · ' + S.emo + ' ' + S.name + ' · pearls ×' + (1 + 0.25 * tw.depth).toFixed(2));
        h += '<div>💡 Light <b>' + fmt(tw.light) + '</b> ' + dim('+' + fmt(1 + (m.lightTap || 0)) + ' per dive' +
          ((m.lightRate || 0) ? ', +' + fmt(m.lightRate) + '/s' : '')) + '</div>';
        if (tw.depth < STRATA.length - 1) {
          var N = STRATA[tw.depth + 1];
          h += '<div style="margin-top:4px">' + dim('Next: ' + N.emo + ' ' + N.name + ' costs ' + fmt(N.light) + ' light') + '</div>' +
            bar(tw.light / N.light, '#7dd3fc') +
            '<div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">' + btn('descend', null, '⬇️ Descend', tw.light >= N.light);
        } else h += '<div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">' + dim('You have reached the bottom of the sea.');
        var fc = flareCost(d, m);
        h += btn('flare', null, tw.flare > 0 ? '🔥 Flare ' + secs(tw.flare) : '🔥 Flare · ' + fmt(fc) + ' light', tw.flare <= 0 && tw.light >= fc) + '</div>';
        return h;
      },
      stat: ['Light', function (d) { return fmt(d.tw.light); }]
    }
  }, {
    tagline: 'Every stratum down costs light',
    description: 'Dive for pearls near the surface, then buy snorkelers and crab pots that collect ' +
      'while you rest. Every dive also gathers a little light, and light is what buys depth: 60 to ' +
      'reach the Twilight Zone, 500 for Midnight, 4,000 for the Abyss, 30,000 for the Hadal Trench. ' +
      'Each stratum has its own creatures to hire and makes every pearl worth 25% more, and spare ' +
      'light can be burned as a flare for 30 seconds of double output. Tip: Lantern Lures pay off ' +
      'faster than Glow Jellies if you are actively tapping.',
    controls: ['Click the diver', 'Space also dives', 'Descend / burn a flare'],
    colors: ['#38bdf8', '#0c4a6e'],
    tags: ['idle', 'clicker', 'ocean', 'exploration']
  });

  /* =================================================== 5. Snowball ☃️ */
  /* Twist: momentum. Every pack spins the ball faster and speed multiplies
     BOTH production and packs — but it bleeds away the second you stop, and
     bleeds faster the faster you are going. Crews push for you, which sets a
     lazy equilibrium you can only beat by hand. Tiers unlock at peak speed. */

  var CREWS = [
    ['mitten', 'Mitten Kid', '🧤', 14, 0.2, 0.05, 0],
    ['sled', 'Sled Dog', '🐕', 120, 1.1, 0.10, 0],
    ['toboggan', 'Toboggan Team', '🛷', 1400, 8, 0.18, 2],
    ['plough', 'Snow Plough', '🚜', 16000, 52, 0.28, 4],
    ['yeti', 'Yeti Crew', '🦍', 2.1e5, 330, 0.42, 7],
    ['engine', 'Avalanche Engine', '🏔️', 3e6, 2100, 0.62, 11],
    ['glacier', 'Glacier Drift', '🧊', 5e7, 14000, 0.9, 16]
  ];
  function momDecay(m) { return 0.42 * Math.max(0.2, 1 - (m.wax || 0)); }
  function momCap(m) { return 5 + (m.hill || 0); }
  function momPush(d, m) {
    var p = 0;
    CREWS.forEach(function (c) { p += Math.sqrt(d.gens[c[0]] || 0) * c[5]; });
    return p * (1 + (m.downhill || 0));
  }

  reg({
    id: 'idle-snowball', title: 'Snowball', emo: '☃️', bg: '#0d1b2e',
    unit: 'snow', unitLabel: 'Snow', unitEmo: '❄️', tapEmo: '⛄', tapLabel: 'Pack the snowball', tapVerb: 'pack',
    theme: { accent: '#bae6fd', glow: 'rgba(186,230,253,.42)', btn: ['#ffffff', '#bae6fd 58%', '#3b6ea5'], tapF: 840 },
    genLabel: 'Crews',
    gens: CREWS.map(function (c) {
      var gen = { id: c[0], name: c[1], emo: c[2], base: c[3], mult: 1.15, rate: c[4] };
      if (c[6] > 0) {
        gen.unlock = function (d) { return d.tw.peak >= c[6]; };
        gen.hint = 'Hit ×' + (1 + c[6]) + ' momentum to unlock';
      }
      gen.info = function (d, m) {
        return fmt(c[4] * (m.genMul[c[0]] || 1)) + ' snow/s · +' + c[5].toFixed(2) + ' push';
      };
      return gen;
    }),
    ups: [
      { id: 'core', name: 'Packed Core', emo: '🥎', desc: '+2 snow per pack', base: 30, mult: 2.5, max: 12, fx: { tapAdd: 2 } },
      { id: 'wax', name: 'Ski Wax', emo: '🕯️', desc: 'Momentum bleeds 12% slower', base: 220, mult: 3, max: 6, fx: { wax: 0.12 } },
      { id: 'shoes', name: 'Snowshoes', emo: '👟', desc: '+0.15 momentum per pack', base: 600, mult: 3, max: 8, fx: { pack: 0.15 } },
      { id: 'hill', name: 'Steeper Hill', emo: '⛰️', desc: 'Momentum ceiling +4', base: 2600, mult: 3.4, max: 6, fx: { hill: 4 } },
      { id: 'crust', name: 'Icy Crust', emo: '🧊', desc: 'Each pack also gains 1.5% of snow/s', base: 4200, mult: 3, max: 8, fx: { tapRate: 0.015 } },
      { id: 'downhill', name: 'Downhill Rush', emo: '🏂', desc: 'Crews push 30% harder', base: 9000, mult: 3.5, max: 6, fx: { downhill: 0.3 } },
      { id: 'rolling', name: 'Rolling Start', emo: '🌨️', desc: 'All production +20%', base: 16000, mult: 3.5, max: 8, fx: { rateMul: 1.2 } },
      { id: 'boulder', name: 'Boulder Ball', emo: '🪨', desc: 'Avalanches pay 60% more', base: 70000, mult: 4, max: 5, fx: { boulder: 0.6 } }
    ],
    twist: {
      init: function (d) { d.tw = { mom: 0, peak: 0, aval: 0, best: 0 }; },
      tap: function (g, d, m, api) {
        d.tw.mom = Math.min(momCap(m), d.tw.mom + 0.3 + (m.pack || 0));
        return api.tapValue(d, m);
      },
      rateMul: function (d) { return 1 + d.tw.mom; },
      tapMul: function (d) { return 1 + d.tw.mom * 0.5; },
      update: function (g, d, dt, m) {
        var tw = d.tw, cap = momCap(m);
        tw.mom += momPush(d, m) * dt;
        tw.mom -= tw.mom * momDecay(m) * dt;
        if (tw.mom > cap) tw.mom = cap;
        if (tw.mom < 0) tw.mom = 0;
        if (tw.mom > tw.peak) tw.peak = tw.mom;
      },
      act: function (g, d, act, arg, api) {
        var tw = d.tw, m = api.mods(d);
        if (act !== 'aval') return;
        if (tw.mom < 3) { api.msg(d, 'You need ×4 momentum before the hill will give way.'); deny(); return; }
        var gain = (api.baseRate(d, m, true) * 32 + api.tapValue(d, m) * 14) * tw.mom * (1 + (m.boulder || 0));
        api.add(d, gain);
        tw.aval++;
        if (gain > tw.best) tw.best = gain;
        tw.mom = 0;
        api.msg(d, '🏔️ AVALANCHE — ' + fmt(gain) + ' snow torn off the slope!', 7);
        Milo.sound.explode();
        api.burst('❄️', 18);
      },
      render: function (d, m, api) {
        var tw = d.tw, cap = momCap(m), eq = momPush(d, m) / momDecay(m);
        var h = title('Momentum ×' + (1 + tw.mom).toFixed(2) + ' · peak ×' + (1 + tw.peak).toFixed(2));
        h += bar(tw.mom / cap, tw.mom > cap * 0.75 ? '#fca5a5' : '#bae6fd', 10);
        h += '<div style="margin-top:5px">' + dim('Ceiling ×' + (1 + cap).toFixed(0) + ' · bleeding ' +
          (momDecay(m) * 100).toFixed(0) + '%/s · crews hold it near ×' + (1 + eq).toFixed(2)) + '</div>';
        h += '<div style="margin-top:7px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
          btn('aval', null, tw.mom >= 3 ? '🏔️ Avalanche!' : '🏔️ Avalanche (needs ×4)', tw.mom >= 3) +
          dim(tw.aval ? tw.aval + ' triggered · best ' + fmt(tw.best) : 'Spends all momentum for a lump of snow') +
          '</div>';
        return h;
      },
      style: function (d, m, api, el) {
        var f = U.clamp(d.tw.mom / momCap(m), 0, 1);
        el.style.width = 'min(' + (30 + f * 12).toFixed(1) + 'vw,' + Math.round(112 + f * 62) + 'px)';
      },
      offline: function (d, away, r, api) {
        // Crews keep the ball turning while you are away; it settles at equilibrium.
        var m = api.mods(d);
        d.tw.mom = Math.min(momCap(m), momPush(d, m) / momDecay(m));
        return api.baseRate(d, m, true) * (1 + d.tw.mom) * away;
      },
      stat: ['Momentum', function (d) { return '×' + (1 + d.tw.mom).toFixed(2); }]
    }
  }, {
    tagline: 'Momentum bleeds away — keep packing',
    description: 'Pack the snowball for snow, then hire mitten kids, sled dogs and yeti crews who ' +
      'shove it downhill for you. The catch is momentum: every pack spins the ball faster and speed ' +
      'multiplies production AND every pack you make, but it bleeds off at 42% a second, faster the ' +
      'faster you go. Crews only hold it at a lazy equilibrium, so the big numbers come from hands-on ' +
      'bursts. Crew tiers unlock at peak momentum, and at ×4 you can trigger an avalanche that trades ' +
      'all your speed for a lump of snow. Tip: buy Ski Wax before Steeper Hill — a bigger ceiling is ' +
      'worthless if you cannot hold the climb.',
    controls: ['Click the snowball', 'Space also packs', 'Click to buy'],
    colors: ['#bae6fd', '#1e3a5f'],
    tags: ['idle', 'clicker', 'snow', 'momentum']
  });

  /* =================================================== 6. Bee Hive 🐝 */
  /* Twist: every bee you own is one worker you have to assign. Nectar bees
     make honey, builders raise comb (a permanent multiplier and the unlock
     key), guards fight off wasp raids that get 4% stronger every time. There
     is never enough hive to do all three. */

  var CASTES = [
    ['worker', 'Worker Bee', '🐝', 15, 0.25, 0],
    ['forager', 'Forager', '🌼', 115, 1.2, 0],
    ['drone', 'Drone Squadron', '🛩️', 1350, 9, 3],
    ['nurse', 'Nurse Bee', '🍼', 16000, 60, 8],
    ['guard', 'Royal Guard', '🛡️', 2.2e5, 390, 16],
    ['queen', 'Second Queen', '👑', 3.2e6, 2500, 28],
    ['mind', 'Hive Mind', '🧠', 5.5e7, 17000, 38]
  ];
  var JOBS = [
    { key: 'Nectar', emo: '🍯', note: 'honey output' },
    { key: 'Comb', emo: '🛠️', note: 'builds wax cells' },
    { key: 'Guard', emo: '🛡️', note: 'repels wasp raids' }
  ];
  var HIVE_SLOTS = 12;
  function beePower(d, api) { return Math.pow(api.genTotal(d), 0.6); }
  function combCost(n) { return 25 * Math.pow(1.19, n); }
  function waspStrength(d, api) { return (1 + beePower(d, api)) * 1.2 * Math.pow(1.04, d.tw.raids); }
  function hiveDefence(d, m, api) { return (d.tw.job[2] / HIVE_SLOTS) * 4 * (1 + beePower(d, api)) * (1 + (m.sting || 0)); }

  reg({
    id: 'idle-bee-hive', title: 'Bee Hive', emo: '🐝', bg: '#2a2008',
    unit: 'honey', unitLabel: 'Honey', unitEmo: '🍯', tapEmo: '🌻', tapLabel: 'Shake the blossom', tapVerb: 'shake',
    theme: { accent: '#fbbf24', glow: 'rgba(251,191,36,.4)', btn: ['#fef3c7', '#fbbf24 58%', '#92400e'], tapF: 900 },
    genLabel: 'Castes',
    gens: CASTES.map(function (c) {
      var gen = { id: c[0], name: c[1], emo: c[2], base: c[3], mult: 1.15, rate: c[4] };
      if (c[5] > 0) {
        gen.unlock = function (d) { return d.tw.comb >= c[5]; };
        gen.hint = 'Build ' + c[5] + ' comb cells to unlock';
      }
      return gen;
    }),
    ups: [
      { id: 'pollen', name: 'Pollen Basket', emo: '🧺', desc: '+1 honey per shake', base: 25, mult: 2.5, max: 12, fx: { tapAdd: 1 } },
      { id: 'wax', name: 'Wax Glands', emo: '🕯️', desc: 'Comb is built 30% faster', base: 320, mult: 3, max: 6, fx: { wax: 0.3 } },
      { id: 'sting', name: 'Barbed Stingers', emo: '🗡️', desc: 'Guards fight 25% harder', base: 650, mult: 3, max: 8, fx: { sting: 0.25 } },
      { id: 'smoke', name: 'Smoker', emo: '💨', desc: 'Wasps take 10% longer to find you', base: 1400, mult: 3.2, max: 6, fx: { smoke: 0.1 } },
      { id: 'waggle', name: 'Waggle Dance', emo: '💃', desc: 'Each shake also gains 1.5% of honey/s', base: 3200, mult: 3, max: 8, fx: { tapRate: 0.015 } },
      { id: 'clover', name: 'Clover Meadow', emo: '☘️', desc: 'All output +20%', base: 6500, mult: 3.5, max: 8, fx: { rateMul: 1.2 } },
      { id: 'slot', name: 'Brood Frame', emo: '🗄️', desc: 'Comb cells are 15% cheaper to raise', base: 12000, mult: 3.5, max: 6, fx: { frame: 0.15 } },
      { id: 'jelly', name: 'Royal Jelly', emo: '🍮', desc: 'Nurse Bees produce ×2', base: 90000, mult: 5, max: 3, fx: { genMul: { nurse: 2 } } }
    ],
    twist: {
      init: function (d) { d.tw = { job: [7, 3, 2], comb: 0, bp: 0, wt: 70, raids: 0, won: 0, scared: 0 }; },
      load: function (d, tw) {
        Object.assign(d.tw, tw);
        if (!d.tw.job || d.tw.job.length !== 3) d.tw.job = [7, 3, 2];
      },
      rateMul: function (d) {
        return (d.tw.job[0] / (HIVE_SLOTS / 2)) * (1 + 0.04 * d.tw.comb) * (d.tw.scared > 0 ? 0.4 : 1);
      },
      update: function (g, d, dt, m, api) {
        var tw = d.tw;
        if (tw.scared > 0) tw.scared -= dt;
        tw.bp += (tw.job[1] / HIVE_SLOTS) * (1 + Math.pow(api.genTotal(d), 0.75)) * (1 + (m.wax || 0)) * dt;
        var cost = combCost(tw.comb) * Math.max(0.3, 1 - (m.frame || 0)), made = 0;
        while (tw.bp >= cost && made < 60) {
          tw.bp -= cost;
          tw.comb++;
          made++;
          cost = combCost(tw.comb) * Math.max(0.3, 1 - (m.frame || 0));
        }
        if (made) {
          api.msg(d, '🛠️ ' + (made > 1 ? made + ' comb cells capped' : 'Comb cell ' + tw.comb + ' capped') +
            ' — honey +' + (4 * made) + '%.', 4);
          Milo.sound.blip();
        }
        if (api.genTotal(d) < 1) return;          // no hive, no wasps
        tw.wt -= dt;
        if (tw.wt > 0) return;
        var str = waspStrength(d, api), def_ = hiveDefence(d, m, api);
        tw.raids++;
        if (def_ >= str) {
          tw.won++;
          var spoils = api.baseRate(d, m) * 25;
          api.add(d, spoils);
          api.msg(d, '🐝 Wasp raid ' + tw.raids + ' driven off — ' + fmt(spoils) + ' honey saved.', 7);
          Milo.sound.win();
          api.burst('🐝', 10);
        } else {
          var lost = d.cur * U.clamp(0.35 * (1 - def_ / str), 0.05, 0.35);
          d.cur -= lost;
          tw.scared = 25;
          api.msg(d, '🐝💥 Wasps broke in — ' + fmt(lost) + ' honey stolen, the hive hides for 25 s.', 8);
          Milo.sound.hit();
        }
        tw.wt = 70 * (1 + (m.smoke || 0));
      },
      act: function (g, d, act, arg) {
        if (act !== 'give' && act !== 'take') return;
        var job = d.tw.job, i = +arg, o = -1;
        for (var k = 0; k < 3; k++) {
          if (k === i) continue;
          if (act === 'give' ? job[k] > 0 && (o < 0 || job[k] > job[o]) : (o < 0 || job[k] < job[o])) o = k;
        }
        if (o < 0) return;
        if (act === 'give') { if (job[o] <= 0) { deny(); return; } job[o]--; job[i]++; }
        else { if (job[i] <= 0) { deny(); return; } job[i]--; job[o]++; }
        Milo.sound.click();
      },
      render: function (d, m, api) {
        var tw = d.tw, bees = api.genTotal(d);
        var h = title('Hive roster · ' + fmt(bees) + ' bees · ' + tw.comb + ' comb cells');
        h += '<div style="display:flex;flex-direction:column;gap:4px">' + JOBS.map(function (J, i) {
          var n = tw.job[i];
          return '<div style="display:flex;align-items:center;gap:6px">' +
            '<span style="width:1.4em">' + J.emo + '</span>' +
            '<span style="width:4.2em;font-weight:700">' + J.key + '</span>' +
            '<span style="flex:1;letter-spacing:1px;color:' + (n ? '#fbbf24' : '#555') + '">' +
            (new Array(n + 1).join('▮') + new Array(HIVE_SLOTS - n + 1).join('▯')) + '</span>' +
            btn('take', i, '−', n > 0, 'padding:2px 8px') + btn('give', i, '+', n < HIVE_SLOTS, 'padding:2px 8px') +
            '</div>';
        }).join('') + '</div>';
        h += '<div style="margin-top:6px">' + dim('Honey ×' + ((tw.job[0] / (HIVE_SLOTS / 2)) * (1 + 0.04 * tw.comb)).toFixed(2) +
          ' · next comb cell') + '</div>' +
          bar(tw.bp / (combCost(tw.comb) * Math.max(0.3, 1 - (m.frame || 0))), '#fbbf24');
        if (bees >= 1) {
          var str = waspStrength(d, api), def_ = hiveDefence(d, m, api);
          h += '<div style="margin-top:6px">🐝💢 ' + dim('Wasp raid ' + (tw.raids + 1) + ' in ') + '<b>' + secs(tw.wt) + '</b> · ' +
            dim('their ') + '<b>' + fmt(str) + '</b>' + dim(' vs your ') +
            '<b style="color:' + (def_ >= str ? '#34d399' : '#f87171') + '">' + fmt(def_) + '</b></div>' +
            bar(tw.wt / 70, '#f87171', 4) +
            (tw.scared > 0 ? '<div style="color:#f87171;margin-top:4px">Hiding — honey ×0.4 for ' + secs(tw.scared) + '</div>' : '');
        } else h += '<div style="margin-top:6px">' + dim('Buy a Worker Bee — wasps ignore an empty hive.') + '</div>';
        return h;
      },
      offline: function (d, away, r, api) {
        var m = api.mods(d), tw = d.tw;
        tw.bp += (tw.job[1] / HIVE_SLOTS) * (1 + Math.pow(api.genTotal(d), 0.75)) * (1 + (m.wax || 0)) * away;
        tw.wt = Math.max(4, tw.wt);              // never resolve a raid you could not watch
        return r * away;
      },
      stat: ['Comb', function (d) { return d.tw.comb; }]
    }
  }, {
    tagline: 'Twelve bees, three jobs, never enough',
    description: 'Shake the blossom for honey and buy castes — workers, foragers, drones, nurses — ' +
      'but every bee you own still has to be assigned. Twelve slots split between nectar (raw honey ' +
      'output), comb (wax cells, each a permanent +4% and the key to the next caste) and guards. A ' +
      'wasp raid lands every seventy seconds and each one is 4% stronger than the last: repel it for a ' +
      'honey bonus, or lose up to a third of your stores and have the hive hide for 25 seconds. Tip: ' +
      'park bees on comb early — the multiplier compounds and the wasps are still weak.',
    controls: ['Click the sunflower', 'Space also shakes', '− / + to reassign bees'],
    colors: ['#fbbf24', '#78350f'],
    tags: ['idle', 'clicker', 'bees', 'management']
  });

  /* ================================================== 7. Moon Base 🌕 */
  /* Twist: oxygen upkeep. Every module you bolt on burns O₂ per second and
     life support is an uncapped upgrade you have to keep feeding, so growth
     is a tug of war with your own tank. Run dry and the base browns out.
     Standby mode throttles both sides at once when you need to bank air. */

  var MODULES = [
    ['scoop', 'Regolith Scoop', '🪣', 15, 0.25, 0.06, 0],
    ['driller', 'Ice Driller', '🧊', 120, 1.3, 0.25, 0],
    ['hydro', 'Hydroponics Bay', '🌿', 1500, 10, 1.1, 5],
    ['he3', 'Helium-3 Rig', '⚛️', 18000, 70, 4, 14],
    ['smelter', 'Fusion Smelter', '🔥', 2.4e5, 460, 16, 30],
    ['driver', 'Mass Driver', '🚀', 3.6e6, 3000, 60, 60],
    ['elevator', 'Lunar Elevator', '🛗', 6e7, 20000, 220, 120]
  ];
  function o2Cap(m) { return 120 * Math.pow(1.7, m.tank || 0); }
  function o2Prod(m) { return m.o2 || 0; }
  function o2Use(d, m) {
    var u = 0;
    MODULES.forEach(function (c) { u += (d.gens[c[0]] || 0) * c[5]; });
    return u * Math.max(0.25, 1 - (m.seal || 0)) * (d.tw.standby ? 0.25 : 1);
  }
  function brownMul(m) { return 0.15 + (m.disc || 0); }
  function scrubCost(d, m, api) { return Math.ceil(Math.max(40, api.baseRate(d, m, true) * 40)); }

  reg({
    id: 'idle-moon-base', title: 'Moon Base', emo: '🌕', bg: '#12121c',
    unit: 'credits', unitLabel: 'Credits', unitEmo: '💠', tapEmo: '⛏️', tapLabel: 'Chip the regolith', tapVerb: 'chip',
    theme: { accent: '#e2e8f0', glow: 'rgba(226,232,240,.32)', btn: ['#f8fafc', '#cbd5e1 58%', '#475569'], tapF: 440 },
    genLabel: 'Modules',
    gens: MODULES.map(function (c) {
      var gen = { id: c[0], name: c[1], emo: c[2], base: c[3], mult: 1.16, rate: c[4] };
      if (c[6] > 0) {
        gen.unlock = function (d, m) { return o2Prod(m) >= c[6]; };
        gen.hint = 'Reach ' + c[6] + ' O₂/s of life support to unlock';
      }
      gen.info = function (d, m) {
        return fmt(c[4] * (m.genMul[c[0]] || 1)) + ' credits/s · burns ' +
          fmt(c[5] * Math.max(0.25, 1 - (m.seal || 0))) + ' O₂/s';
      };
      return gen;
    }),
    ups: [
      { id: 'drill', name: 'Powered Drill', emo: '🔨', desc: '+1 credit per chip', base: 25, mult: 2.5, max: 12, fx: { tapAdd: 1 } },
      { id: 'lyser', name: 'Electrolyser', emo: '💨', desc: '+2.5 oxygen per second', base: 45, mult: 1.26, fx: { o2: 2.5 } },
      { id: 'tank', name: 'Bigger Tank', emo: '🛢️', desc: 'Oxygen capacity ×1.7', base: 260, mult: 3, max: 9, fx: { tank: 1 } },
      { id: 'seal', name: 'Seal Kit', emo: '🔩', desc: 'Modules burn 7% less O₂', base: 950, mult: 3, max: 9, fx: { seal: 0.07 } },
      { id: 'sifter', name: 'Regolith Sifter', emo: '🧲', desc: 'Each chip also gains 1% of credits/s', base: 2600, mult: 3, max: 8, fx: { tapRate: 0.01 } },
      { id: 'solar', name: 'Solar Array', emo: '☀️', desc: 'All output +20%', base: 4500, mult: 3.5, max: 8, fx: { rateMul: 1.2 } },
      { id: 'disc', name: 'Airlock Discipline', emo: '🚪', desc: 'Brownouts only cut output to 45%', base: 32000, mult: 4, max: 3, fx: { disc: 0.1 } },
      { id: 'rover', name: 'Rover Fleet', emo: '🛻', desc: 'Ice Drillers mine ×2', base: 55000, mult: 5, max: 3, fx: { genMul: { driller: 2 } } }
    ],
    twist: {
      init: function (d) { d.tw = { o2: 120, standby: false, cd: 0, brown: 0, alarm: false }; },
      rateMul: function (d, m) {
        return (d.tw.o2 <= 0.01 ? brownMul(m) : 1) * (d.tw.standby ? 0.25 : 1);
      },
      update: function (g, d, dt, m, api) {
        var tw = d.tw, cap = o2Cap(m);
        if (tw.cd > 0) tw.cd -= dt;
        tw.o2 = U.clamp(tw.o2 + (o2Prod(m) - o2Use(d, m)) * dt, 0, cap);
        if (tw.o2 <= 0.01) {
          tw.brown += dt;
          if (!tw.alarm) {
            tw.alarm = true;
            api.msg(d, '🚨 Oxygen out — the base is browning out. Buy an Electrolyser or go to standby.', 9);
            Milo.sound.hit();
          }
        } else if (tw.alarm && tw.o2 > cap * 0.15) {
          tw.alarm = false;
          api.msg(d, '✅ Air restored — every module is back online.', 5);
          Milo.sound.powerup();
        }
      },
      act: function (g, d, act, arg, api) {
        var tw = d.tw, m = api.mods(d);
        if (act === 'standby') {
          tw.standby = !tw.standby;
          api.msg(d, tw.standby ? '🌙 Standby — output and O₂ burn both cut to a quarter.'
            : '☀️ Full power — every module is drawing air again.');
          Milo.sound.click();
        } else if (act === 'scrub') {
          if (tw.cd > 0) return;
          var cost = scrubCost(d, m, api);
          if (d.cur < cost) { api.msg(d, 'A canister run costs ' + fmt(cost) + ' credits.'); deny(); return; }
          d.cur -= cost;
          tw.o2 = Math.min(o2Cap(m), tw.o2 + o2Cap(m) * 0.45);
          tw.cd = 18;
          api.msg(d, '🫧 Canisters cracked — tank topped up.');
          Milo.sound.coin();
          api.burst('🫧', 10);
        }
      },
      render: function (d, m, api) {
        var tw = d.tw, cap = o2Cap(m), prod = o2Prod(m), use = o2Use(d, m), net = prod - use;
        var h = title('Life support · ' + (tw.standby ? 'STANDBY' : tw.o2 <= 0.01 ? 'BROWNOUT' : 'nominal'));
        h += '<div>🫁 <b>' + fmt(tw.o2) + '</b> / ' + fmt(cap) + ' O₂ · ' +
          '<span style="color:' + (net >= 0 ? '#34d399' : '#f87171') + '">' + (net >= 0 ? '+' : '') + fmt(net) + '/s</span> ' +
          dim('(' + fmt(prod) + ' made, ' + fmt(use) + ' burned)') + '</div>' +
          bar(tw.o2 / cap, tw.o2 < cap * 0.2 ? '#f87171' : '#7dd3fc', 9);
        if (net < 0) h += '<div style="margin-top:4px;color:#fbbf24">Tank empty in ' + secs(tw.o2 / -net) + '</div>';
        if (tw.o2 <= 0.01) h += '<div style="margin-top:4px;color:#f87171">Output cut to ' +
          Math.round(brownMul(m) * 100) + '% until the tank refills.</div>';
        var sc = scrubCost(d, m, api);
        h += '<div style="margin-top:7px;display:flex;gap:6px;flex-wrap:wrap">' +
          btn('standby', null, tw.standby ? '☀️ Full power' : '🌙 Standby', true,
            tw.standby ? 'border-color:#fbbf24;background:rgba(251,191,36,.15)' : '') +
          btn('scrub', null, tw.cd > 0 ? '🫧 Refilling ' + secs(tw.cd) : '🫧 Canister run · ' + fmt(sc),
            tw.cd <= 0 && d.cur >= sc) + '</div>';
        h += '<div style="margin-top:4px">' + dim('Brownouts so far: ' + secs(tw.brown)) + '</div>';
        return h;
      },
      offline: function (d, away, r, api) {
        // Walk the tank forward; once it empties the base runs browned out.
        var m = api.mods(d), tw = d.tw, cap = o2Cap(m), net = o2Prod(m) - o2Use(d, m);
        if (net >= 0) { tw.o2 = Math.min(cap, tw.o2 + net * away); return r * away; }
        var dry = tw.o2 / -net;
        if (dry >= away) { tw.o2 += net * away; return r * away; }
        tw.o2 = 0;
        tw.brown += away - dry;
        return r * dry + r * brownMul(m) * (away - dry);
      },
      stat: ['Oxygen', function (d) { return fmt(d.tw.o2); }]
    }
  }, {
    tagline: 'Every module you bolt on burns air',
    description: 'Chip regolith for credits and bolt on scoops, ice drillers and hydroponics bays — ' +
      'each of which burns oxygen per second, forever. Life support is the one upgrade with no cap, so ' +
      'the whole game is a tug of war between the modules you want and the air they cost. Let the tank ' +
      'hit zero and the base browns out to 15% output until it refills. Standby throttles production ' +
      'and consumption to a quarter so you can bank air, and a canister run buys back 45% of the tank ' +
      'for credits. Tip: Seal Kits are almost always cheaper than another Electrolyser.',
    controls: ['Click the drill', 'Space also chips', 'Standby / canister buttons'],
    colors: ['#cbd5e1', '#334155'],
    tags: ['idle', 'clicker', 'space', 'survival']
  });

  /* ============================================== 8. Monster Ranch 🐲 */
  /* Twist: you cannot buy a species you have never bred. Eggs cost coins and
     real seconds and come out as a random species and rarity; then you choose
     — sell it for a lump right now, or keep it as a breeding-stock generator
     that pays forever. Keeping is how the shop unlocks. */

  var SPECIES = [
    ['slime', 'Slime', '🟢', 14, 0.22],
    ['boar', 'Boarling', '🐗', 115, 1.2],
    ['gryph', 'Gryphlet', '🦅', 1350, 9],
    ['basil', 'Basilisk', '🐍', 16500, 62],
    ['golem', 'Moss Golem', '🗿', 2.3e5, 400],
    ['chimera', 'Chimera', '🦁', 3.5e6, 2700],
    ['levi', 'Leviathan', '🐲', 6e7, 18500]
  ];
  var RARITY = [
    { name: 'Common', emo: '⚪', mult: 1, keep: 1, col: '#cbd5e1' },
    { name: 'Rare', emo: '🔵', mult: 4, keep: 3, col: '#60a5fa' },
    { name: 'Prime', emo: '🟣', mult: 14, keep: 9, col: '#c084fc' }
  ];
  function eggCost(d, m, api) {
    return Math.ceil(Math.max(30, api.baseRate(d, m, true) * 50) *
      Math.pow(1.1, d.tw.hatch) * Math.max(0.4, 1 - (m.stud || 0)));
  }
  function eggTime(m) { return 12 * Math.max(0.35, 1 - (m.incu || 0)); }
  function tierCap(d) {
    return U.clamp(Math.floor(Math.log(Math.max(10, d.total)) / Math.LN10) - 1, 0, SPECIES.length - 1);
  }
  function sellValue(d, m, api, sp, rar) {
    return Math.max(sp[3] * 1.2, api.baseRate(d, m, true) * 22) * rar.mult * (1 + (m.auction || 0));
  }

  reg({
    id: 'idle-monster-ranch', title: 'Monster Ranch', emo: '🐲', bg: '#1b2a16',
    unit: 'coins', unitLabel: 'Coins', unitEmo: '🪙', tapEmo: '🐾', tapLabel: 'Groom the herd', tapVerb: 'groom',
    theme: { accent: '#a3e635', glow: 'rgba(163,230,53,.35)', btn: ['#ecfccb', '#a3e635 58%', '#3f6212'], tapF: 560 },
    genLabel: 'Breeding stock',
    gens: SPECIES.map(function (c, i) {
      var gen = { id: c[0], name: c[1], emo: c[2], base: c[3], mult: 1.16, rate: c[4] };
      if (i > 0) {
        gen.unlock = function (d) { return !!(d.tw.seen && d.tw.seen[c[0]]); };
        gen.hint = 'Hatch one from an egg before the ranch will stock it';
      }
      return gen;
    }),
    ups: [
      { id: 'trough', name: 'Feed Trough', emo: '🥣', desc: '+1 coin per groom', base: 25, mult: 2.5, max: 12, fx: { tapAdd: 1 } },
      { id: 'incu', name: 'Incubator', emo: '🔆', desc: 'Eggs hatch 12% faster', base: 420, mult: 3, max: 6, fx: { incu: 0.12 } },
      { id: 'pedi', name: 'Pedigree Chart', emo: '📜', desc: 'Better species and rarity odds', base: 1600, mult: 3.4, max: 5, fx: { pedi: 1 } },
      { id: 'auction', name: 'Auction House', emo: '🔨', desc: 'Monsters sell for +35%', base: 2800, mult: 3, max: 8, fx: { auction: 0.35 } },
      { id: 'brush', name: 'Currycomb', emo: '🧽', desc: 'Each groom also gains 1.5% of coins/s', base: 3800, mult: 3, max: 8, fx: { tapRate: 0.015 } },
      { id: 'barn', name: 'Barn Expansion', emo: '🏚️', desc: 'All monsters produce +20%', base: 7500, mult: 3.5, max: 8, fx: { rateMul: 1.2 } },
      { id: 'stud', name: 'Stud Book', emo: '📘', desc: 'Eggs cost 10% less', base: 22000, mult: 3.5, max: 5, fx: { stud: 0.1 } },
      { id: 'blood', name: 'Prime Bloodline', emo: '🧬', desc: 'Basilisks earn ×2', base: 3.2e5, mult: 5, max: 3, fx: { genMul: { basil: 2 } } }
    ],
    twist: {
      init: function (d) { d.tw = { seen: { slime: 1 }, egg: null, offer: null, hatch: 0, sold: 0, kept: 0, prime: 0 }; },
      load: function (d, tw) { Object.assign(d.tw, tw); if (!d.tw.seen) d.tw.seen = { slime: 1 }; },
      update: function (g, d, dt, m, api) {
        var tw = d.tw;
        if (!tw.egg) return;
        tw.egg.t += dt;
        if (tw.egg.t < eggTime(m)) return;
        var cap = tierCap(d), idx = 0, p = 0.45 + 0.05 * (m.pedi || 0);
        while (idx < cap && Math.random() < p) idx++;
        var q = Math.random(), r = q < 0.055 + 0.02 * (m.pedi || 0) ? 2 : q < 0.22 + 0.05 * (m.pedi || 0) ? 1 : 0;
        tw.egg = null;
        tw.hatch++;
        tw.offer = { sp: idx, r: r };
        tw.seen[SPECIES[idx][0]] = 1;
        if (r === 2) tw.prime++;
        api.msg(d, RARITY[r].emo + ' A ' + RARITY[r].name + ' ' + SPECIES[idx][1] + ' hatched — sell it or keep it?', 10);
        Milo.sound[r ? 'win' : 'coin']();
        api.burst(SPECIES[idx][2], r === 2 ? 16 : 8);
      },
      act: function (g, d, act, arg, api) {
        var tw = d.tw, m = api.mods(d);
        if (act === 'hatch') {
          if (tw.egg || tw.offer) return;
          var cost = eggCost(d, m, api);
          if (d.cur < cost) { api.msg(d, 'An egg costs ' + fmt(cost) + ' coins.'); deny(); return; }
          d.cur -= cost;
          tw.egg = { t: 0 };
          api.msg(d, '🥚 The egg is in the incubator…');
          Milo.sound.click();
        } else if (act === 'sell' && tw.offer) {
          var sp = SPECIES[tw.offer.sp], rar = RARITY[tw.offer.r];
          var v = sellValue(d, m, api, sp, rar);
          api.add(d, v);
          tw.sold++;
          tw.offer = null;
          api.msg(d, '🔨 Sold the ' + rar.name + ' ' + sp[1] + ' for ' + fmt(v) + ' coins.', 6);
          Milo.sound.coin();
        } else if (act === 'keep' && tw.offer) {
          var sp2 = SPECIES[tw.offer.sp], rar2 = RARITY[tw.offer.r];
          d.gens[sp2[0]] = (d.gens[sp2[0]] || 0) + rar2.keep;
          tw.kept++;
          tw.offer = null;
          api.msg(d, '🏡 ' + rar2.keep + '× ' + sp2[1] + ' joined the ranch — and the shop now stocks them.', 6);
          Milo.sound.powerup();
        }
      },
      render: function (d, m, api) {
        var tw = d.tw;
        var h = title('Breeding pen · ' + tw.hatch + ' hatched · ' + tw.kept + ' kept · ' + tw.sold + ' sold');
        if (tw.offer) {
          var sp = SPECIES[tw.offer.sp], rar = RARITY[tw.offer.r];
          var v = sellValue(d, m, api, sp, rar);
          h += '<div style="font-size:1.05rem"><span style="font-size:26px">' + sp[2] + '</span> <b style="color:' + rar.col + '">' +
            rar.emo + ' ' + rar.name + ' ' + sp[1] + '</b></div>' +
            '<div style="margin-top:4px">' + dim('Worth ' + fmt(v) + ' coins at auction, or ' + rar.keep + '× ' + sp[1] +
              ' earning ' + fmt(sp[4] * rar.keep * (m.genMul[sp[0]] || 1)) + ' coins/s forever.') + '</div>' +
            '<div style="margin-top:7px;display:flex;gap:6px;flex-wrap:wrap">' +
            btn('sell', null, '🔨 Sell · ' + fmt(v), true) +
            btn('keep', null, '🏡 Keep ' + rar.keep + '×', true, 'border-color:#a3e635;background:rgba(163,230,53,.14)') + '</div>';
        } else if (tw.egg) {
          h += '<div>🥚 Incubating — ' + secs(eggTime(m) - tw.egg.t) + '</div>' + bar(tw.egg.t / eggTime(m), '#a3e635');
        } else {
          var cost = eggCost(d, m, api), cap = tierCap(d);
          h += '<div>' + dim('Rarest stock the pen can throw right now: ') + SPECIES[cap][2] + ' <b>' + SPECIES[cap][1] + '</b>' +
            dim(' — it climbs as you earn.') + '</div>' +
            '<div style="margin-top:7px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
            btn('hatch', null, '🥚 Hatch an egg · ' + fmt(cost), d.cur >= cost) +
            dim(secs(eggTime(m)) + ' · ' + tw.prime + ' Primes so far') + '</div>';
        }
        return h;
      },
      offline: function (d, away, r) { if (d.tw.egg) d.tw.egg.t += away; return r * away; },
      stat: ['Hatched', function (d) { return d.tw.hatch; }]
    }
  }, {
    tagline: 'Sell the monster, or let it breed for you',
    description: 'Groom the herd for coins, then put an egg in the incubator. Twelve seconds later ' +
      'something hatches — a Slime, a Gryphlet, maybe a Prime Basilisk — and you get one decision: ' +
      'auction it for a lump of coins now, or keep it as breeding stock that earns every second ' +
      'forever. Keeping is also the only way the ranch shop ever stocks that species, so a Leviathan ' +
      'you sell is a Leviathan you cannot buy. Rarer hatches climb as your lifetime earnings do, and a ' +
      'Prime keeps nine head at once. Tip: sell Commons, keep anything blue or purple.',
    controls: ['Click the paw print', 'Space also grooms', 'Hatch / Sell / Keep'],
    colors: ['#a3e635', '#3f6212'],
    tags: ['idle', 'clicker', 'monsters', 'breeding']
  });

  /* ============================================== 9. Time Machine ⏳ */
  /* Twist: prestige, themed as travel. Jumping back to the start of the era
     wipes your clocks and most upgrades but banks paradox shards worth +10%
     each, forever. A few upgrades are marked as surviving the jump, and the
     Paradox Anchor drags a slice of your clocks back with you. */

  var CLOCKS = [
    ['watch', 'Pocket Watch', '⌚', 15, 0.2, 0],
    ['pendulum', 'Pendulum Rig', '🕰️', 115, 1.1, 0],
    ['atomic', 'Atomic Clock', '⏰', 1350, 8.5, 1],
    ['loom', 'Chrono Loom', '🧵', 15500, 58, 2],
    ['causal', 'Causal Engine', '🌀', 2.1e5, 390, 4],
    ['tachyon', 'Tachyon Array', '📡', 3.1e6, 2600, 7],
    ['spindle', 'Eternity Spindle', '♾️', 5.2e7, 17500, 11]
  ];
  function shardsFor(run) { return Math.floor(Math.sqrt(Math.max(0, run) / 2e4)); }
  function shardValue(m) { return 0.1 + 0.02 * (m.loop || 0); }

  reg({
    id: 'idle-time-machine', title: 'Time Machine', emo: '⏳', bg: '#141033',
    unit: 'chronons', unitLabel: 'Chronons', unitEmo: '⏳', tapEmo: '🕰️', tapLabel: 'Wind the dial', tapVerb: 'wind',
    theme: { accent: '#818cf8', glow: 'rgba(129,140,248,.4)', btn: ['#e0e7ff', '#818cf8 58%', '#312e81'], tapF: 660 },
    genLabel: 'Clockwork',
    gens: CLOCKS.map(function (c) {
      var gen = { id: c[0], name: c[1], emo: c[2], base: c[3], mult: 1.15, rate: c[4] };
      if (c[5] > 0) {
        gen.unlock = function (d) { return d.tw.jumps >= c[5]; };
        gen.hint = 'Jump back ' + c[5] + (c[5] === 1 ? ' time' : ' times') + ' to unlock';
      }
      return gen;
    }),
    ups: [
      { id: 'dial', name: 'Finer Dial', emo: '🔩', desc: '+1 chronon per wind', base: 25, mult: 2.5, max: 12, fx: { tapAdd: 1 } },
      { id: 'gear', name: 'Escapement Gears', emo: '⚙️', desc: 'All production +25%', base: 500, mult: 3, max: 10, fx: { rateMul: 1.25 } },
      { id: 'spring', name: 'Mainspring', emo: '🌀', desc: 'Each wind also gains 2% of chronons/s', base: 1300, mult: 3, max: 8, fx: { tapRate: 0.02 } },
      { id: 'flux', name: 'Flux Capacitor', emo: '⚡', desc: 'Clockwork costs 5% less', base: 6500, mult: 4, max: 5, fx: { discount: 0.05 } },
      { id: 'loop', name: 'Stable Loop', emo: '♻️', desc: 'Each shard is worth +2% more', base: 26000, mult: 4, max: 10, perm: true, fx: { loop: 1 } },
      { id: 'anchor', name: 'Paradox Anchor', emo: '⚓', desc: 'Drag 12% of your clocks through a jump', base: 65000, mult: 5, max: 5, perm: true, fx: { anchor: 0.12 } },
      { id: 'relic', name: 'Temporal Relic', emo: '🏺', desc: '+6 chronons per wind', base: 160000, mult: 4, max: 8, perm: true, fx: { tapAdd: 6 } },
      { id: 'quartz', name: 'Quartz Resonance', emo: '💎', desc: 'Atomic Clocks tick ×2', base: 2.2e5, mult: 5, max: 3, fx: { genMul: { atomic: 2 } } }
    ],
    twist: {
      init: function (d) { d.tw = { shards: 0, jumps: 0, run: 0, bestRun: 0 }; },
      rateMul: function (d, m) { return 1 + d.tw.shards * shardValue(m); },
      tapMul: function (d, m) { return 1 + d.tw.shards * shardValue(m); },
      tap: function (g, d, m, api) {
        var v = api.tapValue(d, m);
        d.tw.run += v;
        return v;
      },
      update: function (g, d, dt, m, api) {
        d.tw.run += api.rate(d, m) * dt;
        if (d.tw.run > d.tw.bestRun) d.tw.bestRun = d.tw.run;
      },
      act: function (g, d, act, arg, api) {
        if (act !== 'jump') return;
        var tw = d.tw, m = api.mods(d), pend = shardsFor(tw.run);
        if (pend < 1) {
          api.msg(d, 'The engine needs ' + fmt(2e4) + ' chronons this era before it can tear a hole. ' +
            'You are at ' + fmt(tw.run) + '.', 7);
          deny();
          return;
        }
        var anchor = m.anchor || 0, kept = {}, keptN = 0, id;
        if (anchor > 0) {
          for (id in d.gens) {
            var v = Math.floor((d.gens[id] || 0) * anchor);
            if (v > 0) { kept[id] = v; keptN += v; }
          }
        }
        var keepUps = {};
        api.ups && Object.keys(api.ups).forEach(function (k) {
          if (api.ups[k].perm && d.ups[k]) keepUps[k] = d.ups[k];
        });
        tw.shards += pend;
        tw.jumps++;
        tw.run = 0;
        d.gens = kept;
        d.ups = keepUps;
        d.cur = 0;
        d.buffs = [];
        api.msg(d, '⏳ Jump ' + tw.jumps + ' — you fall back to the first tick with ' + pend + ' new shard' +
          (pend === 1 ? '' : 's') + ' (' + tw.shards + ' total, ×' + (1 + tw.shards * shardValue(m)).toFixed(2) + ')' +
          (keptN ? ' and ' + fmt(keptN) + ' anchored clocks' : '') + '.', 12);
        Milo.sound.win();
        api.burst('⏳', 20);
      },
      render: function (d, m, api) {
        var tw = d.tw, pend = shardsFor(tw.run), sv = shardValue(m);
        var need = 2e4 * Math.pow(pend + 1, 2);
        var h = title('Era ' + (tw.jumps + 1) + ' · 💠 ' + tw.shards + ' shards · everything ×' +
          (1 + tw.shards * sv).toFixed(2));
        h += '<div>' + dim('Earned this era ') + '<b>' + fmt(tw.run) + '</b> ' +
          dim('· best era ' + fmt(tw.bestRun)) + '</div>';
        h += '<div style="margin-top:4px">' + dim('Next shard at ' + fmt(need) + ' this era') + '</div>' +
          bar(pend >= 1 ? (tw.run - 2e4 * pend * pend) / Math.max(1, need - 2e4 * pend * pend) : tw.run / 2e4, '#818cf8');
        h += '<div style="margin-top:7px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
          btn('jump', null, pend >= 1 ? '⏳ Jump back · +' + pend + ' shard' + (pend === 1 ? '' : 's') : '⏳ Jump back (no shards yet)', pend >= 1) +
          dim('wipes clocks and non-permanent upgrades') + '</div>';
        h += '<div style="margin-top:4px">' + dim('Each shard: +' + Math.round(sv * 100) + '% to production and winds.') + '</div>';
        return h;
      },
      offline: function (d, away, r) { var got = r * away; d.tw.run += got; return got; },
      stat: ['Shards', function (d) { return d.tw.shards; }]
    }
  }, {
    tagline: 'Throw it all away to go round faster',
    description: 'Wind the dial for chronons and buy pocket watches, pendulum rigs and eventually an ' +
      'Eternity Spindle. Once an era has produced 20,000 chronons the engine can tear a hole: jumping ' +
      'back wipes every clock and every ordinary upgrade, but banks paradox shards worth +10% to ' +
      'production and winds, permanently, and each jump unlocks a clock tier you could not buy before. ' +
      'Three upgrades survive the jump — Stable Loop makes every shard worth more, Paradox Anchor drags ' +
      '12% of your clockwork back with you, and the Temporal Relic keeps paying by hand. Tip: the shard ' +
      'curve is a square root, so four times the era earns you only twice the shards — jump often.',
    controls: ['Click the clock', 'Space also winds', 'Jump back to prestige'],
    colors: ['#818cf8', '#312e81'],
    tags: ['idle', 'clicker', 'prestige', 'time']
  });

  /* =================================================== 10. Garden 🌷 */
  /* Twist: real growth timers on real plots, sped up by soil moisture. The
     watering can is free but on a cooldown and the damp fades, so an active
     player runs the beds at double speed. Every flower brought to bloom is
     a permanent +1% and the key to the next tier of greenery. */

  var BEDS = [
    ['box', 'Window Box', '🪟', 15, 0.2, 0],
    ['bed', 'Flower Bed', '🌷', 115, 1.1, 0],
    ['trellis', 'Trellis', '🌿', 1350, 8.5, 4],
    ['green', 'Greenhouse', '🏡', 15500, 58, 12],
    ['orchard', 'Orchard', '🌳', 2.1e5, 390, 26],
    ['dome', 'Botanical Dome', '🔆', 3.1e6, 2600, 48],
    ['cloud', 'Cloud Garden', '☁️', 5.2e7, 17500, 80]
  ];
  var SEEDS = [
    { id: 'daisy', name: 'Daisy', emo: '🌼', grow: 9, base: 18, min: 0 },
    { id: 'tulip', name: 'Tulip', emo: '🌷', grow: 22, base: 90, min: 250 },
    { id: 'rose', name: 'Rose', emo: '🌹', grow: 50, base: 420, min: 6000 },
    { id: 'lotus', name: 'Lotus', emo: '🪷', grow: 105, base: 2600, min: 1.2e5 },
    { id: 'orchid', name: 'Moon Orchid', emo: '🌺', grow: 210, base: 15000, min: 6e6 }
  ];
  function plotCount(m) { return 2 + (m.plot || 0); }
  function seedCost(d, m, api, s) {
    return Math.ceil(Math.max(s.base / 3, api.baseRate(d, m, true) * s.grow * 0.55));
  }
  function seedPay(d, m, api, s) {
    return Math.max(s.base, api.baseRate(d, m, true) * s.grow * 2.1) * (1 + (m.rich || 0));
  }
  function moistFloor(m) { return Math.min(0.6, m.sprink || 0); }
  function growMul(d) { return 1 + d.tw.w; }
  // Fall back to the best seed the player has actually unlocked.
  function bestSeed(d, pref) {
    var i = U.clamp(pref | 0, 0, SEEDS.length - 1);
    while (i > 0 && d.total < SEEDS[i].min) i--;
    return i;
  }
  function harvest(g, d, m, api, i, auto) {
    var tw = d.tw, p = tw.p[i];
    if (!p || p.s < 0) return;
    var S = SEEDS[p.s], pay = seedPay(d, m, api, S);
    api.add(d, pay);
    tw.grown++;
    tw.cut++;
    p.s = -1;
    p.t = 0;
    if (!auto) {
      api.msg(d, S.emo + ' Cut a ' + S.name + ' for ' + fmt(pay) + ' petals.', 4);
      Milo.sound.coin();
      api.burst(S.emo, 7);
    }
  }

  reg({
    id: 'idle-garden', title: 'Garden', emo: '🌷', bg: '#152418',
    unit: 'petals', unitLabel: 'Petals', unitEmo: '🌸', tapEmo: '🌱', tapLabel: 'Tend the garden', tapVerb: 'tend',
    theme: { accent: '#f9a8d4', glow: 'rgba(249,168,212,.4)', btn: ['#fce7f3', '#f472b6 58%', '#9d174d'], tapF: 780 },
    genLabel: 'Greenery',
    gens: BEDS.map(function (c) {
      var gen = { id: c[0], name: c[1], emo: c[2], base: c[3], mult: 1.15, rate: c[4] };
      if (c[5] > 0) {
        gen.unlock = function (d) { return d.tw.grown >= c[5]; };
        gen.hint = 'Bring ' + c[5] + ' flowers to bloom to unlock';
      }
      return gen;
    }),
    ups: [
      { id: 'shears', name: 'Sharper Shears', emo: '✂️', desc: '+1 petal per tend', base: 25, mult: 2.5, max: 12, fx: { tapAdd: 1 } },
      { id: 'plot', name: 'Extra Bed', emo: '🟫', desc: 'One more plot to plant', base: 160, mult: 3.2, max: 6, fx: { plot: 1 } },
      { id: 'mulch', name: 'Mulch', emo: '🍂', desc: 'Soil stays damp 35% longer', base: 450, mult: 3, max: 6, fx: { mulch: 0.35 } },
      { id: 'hands', name: 'Gardener', emo: '🧑‍🌾', desc: 'Sows and cuts one plot for you', base: 1300, mult: 3.6, max: 8, fx: { hands: 1 } },
      { id: 'rich', name: 'Rich Soil', emo: '🪱', desc: 'Cut flowers pay +40%', base: 3200, mult: 3.2, max: 8, fx: { rich: 0.4 } },
      { id: 'dew', name: 'Dew Collector', emo: '💧', desc: 'Each tend also gains 1.5% of petals/s', base: 5200, mult: 3, max: 8, fx: { tapRate: 0.015 } },
      { id: 'compost', name: 'Compost Heap', emo: '♻️', desc: 'All production +20%', base: 9500, mult: 3.5, max: 8, fx: { rateMul: 1.2 } },
      { id: 'sprink', name: 'Sprinkler', emo: '🚿', desc: 'Soil never dries below 20%', base: 45000, mult: 4, max: 3, fx: { sprink: 0.2 } },
      { id: 'glass', name: 'Crystal Glass', emo: '🔷', desc: 'Greenhouses grow ×2', base: 3.4e5, mult: 5, max: 3, fx: { genMul: { green: 2 } } }
    ],
    twist: {
      init: function (d) { d.tw = { p: [], seed: 0, w: 0, cd: 0, grown: 0, cut: 0 }; },
      load: function (d, tw) {
        Object.assign(d.tw, tw);
        if (!d.tw.p || !d.tw.p.length) d.tw.p = [];
      },
      start: function (g, d, api) {
        var n = plotCount(api.mods(d));
        while (d.tw.p.length < n) d.tw.p.push({ s: -1, t: 0 });
        d.tw.p.length = n;
      },
      rateMul: function (d) { return 1 + Math.min(1, d.tw.grown * 0.01); },
      update: function (g, d, dt, m, api) {
        var tw = d.tw, n = plotCount(m), i;
        while (tw.p.length < n) tw.p.push({ s: -1, t: 0 });
        if (tw.p.length > n) tw.p.length = n;
        if (tw.cd > 0) tw.cd -= dt;
        tw.w = Math.max(moistFloor(m), tw.w - dt / (26 * (1 + (m.mulch || 0))));
        var auto = m.hands || 0, mul = growMul(d);
        for (i = 0; i < tw.p.length; i++) {
          var p = tw.p[i];
          if (p.s >= 0) {
            p.t += dt * mul;
            if (p.t >= SEEDS[p.s].grow && i < auto) harvest(g, d, m, api, i, true);
          } else if (i < auto) {
            var s = SEEDS[bestSeed(d, tw.seed)], c = seedCost(d, m, api, s);
            if (d.cur >= c) { d.cur -= c; p.s = SEEDS.indexOf(s); p.t = 0; }
          }
        }
      },
      act: function (g, d, act, arg, api) {
        var tw = d.tw, m = api.mods(d);
        if (act === 'water') {
          if (tw.cd > 0) return;
          tw.w = 1;
          tw.cd = 7;
          Milo.sound.blip();
          api.burst('💧', 8);
        } else if (act === 'seed') {
          var i = +arg;
          if (d.total < SEEDS[i].min) return;
          tw.seed = i;
          Milo.sound.click();
        } else if (act === 'plot') {
          var k = +arg, p = tw.p[k];
          if (!p) return;
          if (p.s < 0) {
            var s = SEEDS[bestSeed(d, tw.seed)], cost = seedCost(d, m, api, s);
            if (d.cur < cost) { api.msg(d, 'A ' + s.name + ' seed costs ' + fmt(cost) + ' petals.'); deny(); return; }
            d.cur -= cost;
            p.s = SEEDS.indexOf(s);
            p.t = 0;
            Milo.sound.click();
          } else if (p.t >= SEEDS[p.s].grow) harvest(g, d, m, api, k, false);
          else { api.msg(d, SEEDS[p.s].name + ' needs ' + secs((SEEDS[p.s].grow - p.t) / growMul(d)) + ' more — water it to hurry.'); deny(); }
        }
      },
      render: function (d, m, api) {
        var tw = d.tw, mul = growMul(d);
        var h = title('Beds · ' + tw.grown + ' flowers bloomed · +' + Math.round(Math.min(1, tw.grown * 0.01) * 100) + '% output');
        h += '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px">' + SEEDS.map(function (s, i) {
          if (d.total < s.min) return i > 0 && d.total < SEEDS[i - 1].min ? '' :
            btn('none', null, '🔒 ' + s.name + ' at ' + fmt(s.min), false, 'padding:4px 8px');
          return btn('seed', i, s.emo + ' ' + s.name, true,
            'padding:4px 8px' + (tw.seed === i ? ';border-color:#f472b6;background:rgba(244,114,182,.16)' : ''));
        }).join('') + '</div>';
        h += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(58px,1fr));gap:5px">' +
          tw.p.map(function (p, i) {
            var auto = i < (m.hands || 0);
            if (p.s < 0) {
              return '<button type="button" data-act="plot" data-arg="' + i + '" style="aspect-ratio:1;border-radius:9px;cursor:pointer;' +
                'border:' + (auto ? '2px solid rgba(163,230,53,.55)' : '1px solid rgba(255,255,255,.1)') + ';background:#3b2b1c;' +
                'color:#8b93bd;font:600 15px Outfit,sans-serif">+</button>';
            }
            var S = SEEDS[p.s], f = U.clamp(p.t / S.grow, 0, 1), ripe = f >= 1;
            return '<button type="button" data-act="plot" data-arg="' + i + '" style="aspect-ratio:1;border-radius:9px;cursor:pointer;' +
              'border:' + (auto ? '2px solid rgba(163,230,53,.55)' : '1px solid rgba(255,255,255,.1)') + ';position:relative;' +
              'background:' + (ripe ? '#2f5f34' : '#273d26') + ';display:grid;place-items:center;overflow:hidden;font-size:24px">' +
              '<span style="transform:scale(' + (0.45 + f * 0.55).toFixed(2) + ')">' + S.emo + '</span>' +
              (ripe ? '' : '<span style="position:absolute;left:0;bottom:0;height:4px;background:#f9a8d4;width:' + (f * 100).toFixed(1) + '%"></span>') +
              '</button>';
          }).join('') + '</div>';
        h += '<div style="margin-top:7px">💧 ' + dim('Soil moisture — growth ×' + mul.toFixed(2)) + '</div>' + bar(tw.w, '#7dd3fc', 7);
        h += '<div style="margin-top:6px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
          btn('water', null, tw.cd > 0 ? '🚿 Refilling ' + secs(tw.cd) : '🚿 Water the beds', tw.cd <= 0) +
          dim((m.hands || 0) ? (m.hands) + ' plot' + (m.hands > 1 ? 's' : '') + ' tended for you' : 'Click a bed to sow, again when it blooms') +
          '</div>';
        return h;
      },
      offline: function (d, away, r, api) {
        // Beds keep growing at the dry rate; gardeners cut and re-sow them.
        var m = api.mods(d), tw = d.tw, auto = m.hands || 0, extra = 0;
        tw.w = moistFloor(m);
        for (var i = 0; i < tw.p.length; i++) {
          var p = tw.p[i];
          if (p.s < 0) continue;
          var S = SEEDS[p.s];
          if (i < auto) {
            var cycles = Math.floor((p.t + away) / S.grow);
            if (cycles > 0) {
              extra += cycles * (seedPay(d, m, api, S) - seedCost(d, m, api, S));
              tw.grown += cycles;
              p.t = (p.t + away) % S.grow;
            } else p.t += away;
          } else p.t = Math.min(S.grow, p.t + away);
        }
        return r * away + Math.max(0, extra);
      },
      stat: ['Bloomed', function (d) { return d.tw.grown; }]
    }
  }, {
    tagline: 'Water the beds and the flowers come twice as fast',
    description: 'Tend the garden for petals and buy window boxes, greenhouses and eventually a Cloud ' +
      'Garden that grow petals on their own. The beds are the real game: sow a seed and it takes real ' +
      'seconds — nine for a daisy, three and a half minutes for a Moon Orchid — and pays out a lump ' +
      'when you cut it. Moisture is the lever. The watering can is free but on a seven-second ' +
      'cooldown, full soil doubles growth speed and it fades over about half a minute, so an attentive ' +
      'gardener runs every bed twice as fast. Every flower bloomed is a permanent +1% and unlocks the ' +
      'next tier of greenery. Tip: buy a Gardener before a fourth bed — unattended beds sit ripe.',
    controls: ['Click the sprout', 'Space also tends', 'Click a bed to sow or cut'],
    colors: ['#f472b6', '#14532d'],
    tags: ['idle', 'clicker', 'garden', 'growing']
  });

})();
