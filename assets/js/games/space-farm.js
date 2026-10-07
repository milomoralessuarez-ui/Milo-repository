/* Space Farm — four domes on a rotating ring, one sun, and a ship to load. */
(function () {
  'use strict';

  var FONT = 'Outfit, ui-sans-serif, system-ui, sans-serif';
  var GRAV = [
    { n: 'Low', e: '🪶', c: '#8df2ff' },
    { n: 'Mid', e: '⚖️', c: '#a78bfa' },
    { n: 'High', e: '🪨', c: '#ff8fbf' }
  ];
  var LIGHT = { sun: 'Full sun', half: 'Half light', dark: 'Shade' };

  /* Seven alien crops. Each wants one light band and one spin setting, so a
     dome can only ever grow part of the catalogue at once. */
  var CROPS = [
    { n: 'Glowberry', e: '🫐', grow: 9, light: 'sun', grav: 1, val: 14, at: 0, c: '#5ad0ff' },
    { n: 'Voidbean', e: '🫒', grow: 12, light: 'dark', grav: 0, val: 20, at: 0, c: '#9b7bff' },
    { n: 'Sunfruit', e: '🍊', grow: 7, light: 'sun', grav: 2, val: 12, at: 0, c: '#ffab4d' },
    { n: 'Moss Coral', e: '🪸', grow: 15, light: 'half', grav: 0, val: 26, at: 2, c: '#ff6fa8' },
    { n: 'Ironroot', e: '🥕', grow: 18, light: 'half', grav: 2, val: 34, at: 4, c: '#ffd166' },
    { n: 'Star Lily', e: '🌸', grow: 11, light: 'sun', grav: 0, val: 22, at: 6, c: '#ffc2f0' },
    { n: 'Nebula Cap', e: '🍄', grow: 14, light: 'dark', grav: 2, val: 30, at: 8, c: '#6ef2c0' }
  ];

  var DOMES = ['Alpha', 'Beta', 'Gamma', 'Delta'];
  var ROT_COST = 10, GRAV_COST = 6, PLANT_POWER = 2, PATCH_COST = 4;

  function h(tag, css, html) {
    var n = document.createElement(tag);
    if (css) n.style.cssText = css;
    if (html != null) n.innerHTML = html;
    return n;
  }

  /* Particle layer floating over the whole stage. */
  function makeFx(host) {
    var cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:6';
    var ctx = cv.getContext('2d'), ps = [], raf = 0, dead = false, last = performance.now();
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
        ctx.globalAlpha = Math.min(1, k * 1.7);
        if (p.k === 'txt') {
          ctx.font = '800 ' + p.s + 'px ' + FONT;
          ctx.textAlign = 'center';
          ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(8,4,24,.92)';
          ctx.strokeText(p.str, p.x, p.y);
          ctx.fillStyle = p.c; ctx.fillText(p.str, p.x, p.y);
        } else if (p.k === 'ring') {
          ctx.strokeStyle = p.c; ctx.lineWidth = 2.4 * k;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.s * (1 + p.t * 9), 0, Math.PI * 2); ctx.stroke();
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
      burst: function (x, y, n, cols, spd) {
        for (var i = 0; i < n; i++) {
          var a = Math.random() * Math.PI * 2, v = (spd || 110) * (.35 + Math.random());
          ps.push({
            k: 'dot', x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, g: 190,
            s: 2 + Math.random() * 3.4, c: cols[i % cols.length], t: 0, life: .5 + Math.random() * .5
          });
        }
      },
      ring: function (x, y, c) { ps.push({ k: 'ring', x: x, y: y, vx: 0, vy: 0, g: 0, s: 6, c: c, t: 0, life: .6 }); },
      text: function (x, y, str, c, s) {
        ps.push({ k: 'txt', x: x, y: y, vx: 0, vy: -46, g: 0, s: s || 17, c: c, str: str, t: 0, life: 1.1 });
      },
      destroy: function () { dead = true; cancelAnimationFrame(raf); if (cv.parentNode) cv.parentNode.removeChild(cv); }
    };
  }

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var fx = makeFx(host), els = {};

    /* ------------------------------------------------------------- state */

    function reset(g) {
      var d = g.data;
      d.credits = 120;
      d.gross = 0;
      d.power = 70;
      d.maxPower = 110;
      d.rep = 0;
      d.done = 0;
      d.missed = 0;
      d.ring = 0;
      d.ringTo = 0;
      d.ringT = 0;
      d.sel = 0;
      d.crop = 0;
      d.store = [0, 0, 0, 0, 0, 0, 0];
      d.domes = [];
      for (var i = 0; i < 4; i++) {
        d.domes.push({ grav: i === 0 ? 1 : i === 1 ? 0 : i === 2 ? 2 : 1, pods: [pod(), pod(), pod(), pod()] });
      }
      d.flare = 0;
      d.flareT = 26;
      d.msg = 'Plant a crop, then rotate the ring so its dome faces the sun.';
      d.msgT = 5;
      newContract(d);
      build(g);
      fx.attach();
      refresh(g);
    }

    function pod() { return { c: -1, p: 0, ripe: 0, crack: 0 }; }

    function lightOf(d, i) {
      var a = (i * 90 + d.ring) * Math.PI / 180;
      return U.clamp(.5 + .5 * Math.cos(a), 0, 1);
    }
    function bandOf(l) { return l > .75 ? 'sun' : l > .25 ? 'half' : 'dark'; }
    function unlocked(d, i) { return d.done >= CROPS[i].at; }

    function newContract(d) {
      var pool = [], i;
      for (i = 0; i < CROPS.length; i++) if (unlocked(d, i)) pool.push(i);
      U.shuffle(pool);
      var count = Math.min(pool.length, 2 + (d.done > 2 ? 1 : 0) + (d.done > 6 ? 1 : 0));
      var items = [], total = 0, reward = 0;
      for (i = 0; i < count; i++) {
        var q = 2 + Math.floor(Math.random() * (2 + Math.min(3, d.done * .4)));
        items.push({ c: pool[i], n: q });
        total += q;
        reward += q * CROPS[pool[i]].val;
      }
      d.ct = {
        items: items,
        reward: Math.round(reward * 1.7 + 60 + d.done * 18),
        t: Math.max(30, 46 + total * 5.5 - d.done * 1.6),
        max: Math.max(30, 46 + total * 5.5 - d.done * 1.6)
      };
    }

    function haveAll(d) {
      for (var i = 0; i < d.ct.items.length; i++) {
        if (d.store[d.ct.items[i].c] < d.ct.items[i].n) return false;
      }
      return true;
    }

    /* ------------------------------------------------------------ update */

    function update(g, dt) {
      var d = g.data, i, j;
      if (d.msgT > 0) d.msgT -= dt;

      // ring animation between the four 90-degree stops
      if (d.ringT > 0) {
        d.ringT -= dt;
        var k = U.clamp(1 - d.ringT / 1.1, 0, 1);
        d.ring = d.ringFrom + (d.ringTo - d.ringFrom) * (k * k * (3 - 2 * k));
        if (d.ringT <= 0) d.ring = ((d.ringTo % 360) + 360) % 360;
      }

      // solar panels on the lit faces
      var lightSum = 0;
      for (i = 0; i < 4; i++) lightSum += lightOf(d, i);
      d.power = Math.min(d.maxPower, d.power + lightSum * 2.1 * dt);

      for (i = 0; i < 4; i++) {
        var dome = d.domes[i], l = lightOf(d, i), band = bandOf(l);
        for (j = 0; j < dome.pods.length; j++) {
          var p = dome.pods[j];
          if (p.c < 0) continue;
          var cr = CROPS[p.c];
          if (p.crack > 0) { p.crack += dt; if (p.crack > 8) killPod(g, i, j, 'A cracked pod vented — crop lost.'); continue; }
          if (p.p < 1) {
            var lf = cr.light === band ? 1 : .3;
            var gd = Math.abs(cr.grav - dome.grav);
            var gf = gd === 0 ? 1 : gd === 1 ? .5 : .18;
            p.p += dt / cr.grow * lf * gf;
            if (p.p >= 1) {
              p.p = 1; p.ripe = 0;
              Milo.sound.tone({ f: 720, f2: 980, d: .09, v: .06, type: 'triangle' });
            }
          } else {
            p.ripe += dt;
            if (p.ripe > cr.grow * .85) killPod(g, i, j, cr.n + ' went over and spoiled.');
          }
        }
      }

      // contract clock
      d.ct.t -= dt;
      if (d.ct.t <= 0) {
        d.missed++;
        d.rep = Math.max(0, d.rep - 2);
        Milo.sound.lose();
        d.msg = 'The supply ship left without a full manifest.';
        d.msgT = 3.2;
        if (d.missed >= 3) {
          g.gameOver({
            emo: '🛰️',
            title: 'Contract cancelled',
            text: 'Three ships left empty. You filled ' + d.done + ' manifest' + (d.done === 1 ? '' : 's') +
              ' and banked ' + Math.round(d.gross) + ' credits.',
            score: Math.round(d.gross)
          });
          return;
        }
        newContract(d);
      }

      // solar flares scorch whatever is sitting in full sun
      if (d.done >= 1) {
        if (d.flare > 0) {
          d.flare -= dt;
          if (d.flare <= 0) doFlare(g);
        } else {
          d.flareT -= dt;
          if (d.flareT <= 0) {
            d.flare = 4.5;
            d.msg = '☢️ Solar flare in 4 seconds — clear the sunward dome!';
            d.msgT = 4.5;
            Milo.sound.tone({ f: 880, f2: 500, d: .3, v: .09, type: 'sawtooth' });
          }
        }
        // the odd micrometeor cracks a pod
        if (Math.random() < dt * (.03 + d.done * .006)) crackPod(g);
      }

      d.uiT = (d.uiT || 0) + dt;
      if (d.uiT > .1) { d.uiT = 0; refresh(g); }
    }

    function doFlare(g) {
      var d = g.data, i, j, hit = 0;
      d.flareT = Math.max(16, 34 - d.done * 1.2);
      for (i = 0; i < 4; i++) {
        if (lightOf(d, i) < .75) continue;
        var dome = d.domes[i];
        for (j = 0; j < dome.pods.length; j++) {
          var p = dome.pods[j];
          if (p.c < 0) continue;
          hit++;
          if (p.p >= 1) { p.c = -1; p.p = 0; p.ripe = 0; }
          else p.p = Math.max(0, p.p - .45);
        }
        var el = els.pod[i * 4];
        if (el) {
          var pt = fx.at(el);
          fx.burst(pt.x + 40, pt.y, 18, ['#ffd166', '#ff7b54', '#fff'], 180);
        }
      }
      if (hit) {
        d.msg = 'Flare scorched ' + hit + ' pod' + (hit === 1 ? '' : 's') + ' in the sunward dome.';
        d.msgT = 3;
        Milo.sound.explode();
      } else {
        d.msg = 'Flare passed over an empty sunward dome. Nicely played.';
        d.msgT = 3;
        Milo.sound.blip();
      }
      refresh(g);
    }

    function crackPod(g) {
      var d = g.data;
      var cands = [], i, j;
      for (i = 0; i < 4; i++) for (j = 0; j < 4; j++) {
        if (d.domes[i].pods[j].c >= 0 && d.domes[i].pods[j].crack <= 0) cands.push([i, j]);
      }
      if (!cands.length) return;
      var pick = cands[(Math.random() * cands.length) | 0];
      d.domes[pick[0]].pods[pick[1]].crack = .01;
      d.msg = '☄️ Micrometeor cracked a pod in ' + DOMES[pick[0]] + ' — click it to patch.';
      d.msgT = 3.2;
      Milo.sound.hit();
    }

    function killPod(g, i, j, why) {
      var d = g.data, p = d.domes[i].pods[j];
      p.c = -1; p.p = 0; p.ripe = 0; p.crack = 0;
      d.rep = Math.max(0, d.rep - 1);
      d.msg = why;
      d.msgT = 2.6;
      Milo.sound.tone({ f: 200, f2: 90, d: .18, v: .08, type: 'sawtooth' });
    }

    /* ------------------------------------------------------------ actions */

    function tapPod(g, i, j) {
      var d = g.data, dome = d.domes[i], p = dome.pods[j];
      d.sel = i;
      var el = els.pod[i * 4 + j], pt = el ? fx.at(el) : { x: 0, y: 0 };
      if (p.crack > 0) {
        if (d.power < PATCH_COST) { say(d, 'Not enough power to patch the pod.'); return; }
        d.power -= PATCH_COST;
        p.crack = 0;
        fx.ring(pt.x, pt.y, '#8df2ff');
        Milo.sound.powerup();
        refresh(g);
        return;
      }
      if (p.c < 0) {
        if (!unlocked(d, d.crop)) { say(d, CROPS[d.crop].n + ' unlocks after ' + CROPS[d.crop].at + ' contracts.'); return; }
        var cost = Math.ceil(CROPS[d.crop].val * .3);
        if (d.credits < cost) { say(d, 'Seed costs ' + cost + ' credits.'); return; }
        if (d.power < PLANT_POWER) { say(d, 'The dome needs power to seed a pod.'); return; }
        d.credits -= cost; d.power -= PLANT_POWER;
        p.c = d.crop; p.p = 0; p.ripe = 0;
        fx.burst(pt.x, pt.y, 7, [CROPS[d.crop].c, '#ffffff'], 80);
        Milo.sound.click();
        refresh(g);
        return;
      }
      if (p.p >= 1) {
        d.store[p.c]++;
        fx.burst(pt.x, pt.y, 12, [CROPS[p.c].c, '#ffffff'], 140);
        fx.text(pt.x, pt.y - 10, '+1 ' + CROPS[p.c].e, CROPS[p.c].c, 15);
        p.c = -1; p.p = 0; p.ripe = 0;
        Milo.sound.coin();
        refresh(g);
        return;
      }
      say(d, CROPS[p.c].n + ' is ' + Math.round(p.p * 100) + '% grown. ' + growthNote(d, i, p.c));
    }

    function growthNote(d, i, ci) {
      var cr = CROPS[ci], band = bandOf(lightOf(d, i)), dome = d.domes[i];
      var out = [];
      if (cr.light !== band) out.push('wants ' + LIGHT[cr.light].toLowerCase());
      if (cr.grav !== dome.grav) out.push('wants ' + GRAV[cr.grav].n.toLowerCase() + ' spin');
      return out.length ? 'It ' + out.join(' and ') + '.' : 'Conditions are perfect.';
    }

    function say(d, m) { d.msg = m; d.msgT = 2.6; }

    function rotate(g, dir) {
      var d = g.data;
      if (d.ringT > 0) return;
      if (d.power < ROT_COST) { say(d, 'Not enough power to swing the ring.'); Milo.sound.tone({ f: 130, d: .1, v: .05 }); return; }
      d.power -= ROT_COST;
      d.ringFrom = d.ring;
      d.ringTo = d.ring + dir * 90;
      d.ringT = 1.1;
      Milo.sound.tone({ f: 220, f2: 420, d: .35, v: .07, type: 'triangle' });
      refresh(g);
    }

    function setGrav(g, i, dir) {
      var d = g.data, dome = d.domes[i];
      var nv = U.clamp(dome.grav + dir, 0, 2);
      if (nv === dome.grav) return;
      if (d.power < GRAV_COST) { say(d, 'Not enough power to change the spin.'); return; }
      d.power -= GRAV_COST;
      dome.grav = nv;
      Milo.sound.tone({ f: 300 + nv * 120, d: .09, v: .06, type: 'square' });
      refresh(g);
    }

    function loadShip(g) {
      var d = g.data;
      if (!haveAll(d)) { say(d, 'The manifest is not complete yet.'); return; }
      var i;
      for (i = 0; i < d.ct.items.length; i++) d.store[d.ct.items[i].c] -= d.ct.items[i].n;
      d.credits += d.ct.reward;
      d.gross += d.ct.reward;
      d.rep += 2;
      d.done++;
      g.score = Math.round(d.gross);
      var pt = els.ship ? fx.at(els.ship) : { x: 200, y: 60 };
      fx.burst(pt.x, pt.y, 26, ['#2ee6c4', '#ffd166', '#ffffff'], 210);
      fx.text(pt.x, pt.y - 16, '+' + d.ct.reward + '🪙', '#2ee6c4', 20);
      Milo.sound.win();
      var was = d.done;
      newContract(d);
      for (i = 0; i < CROPS.length; i++) {
        if (CROPS[i].at === was) { say(d, '🔓 ' + CROPS[i].n + ' seed stock unlocked.'); break; }
      }
      refresh(g);
    }

    /* -------------------------------------------------------------- view */

    function build(g) {
      var wrap = h('div', 'display:flex;flex-direction:column;gap:6px;width:100%;max-width:880px;' +
        'height:100%;align-self:stretch;font-family:' + FONT + ';color:#e8e2ff');

      els.bar = h('div', 'flex:0 0 auto;display:flex;gap:7px;align-items:center;flex-wrap:wrap;' +
        'background:rgba(46,230,196,.06);border:1px solid rgba(46,230,196,.2);border-radius:11px;padding:5px 10px');
      els.bar.addEventListener('click', function (e) {
        if (e.target.closest('[data-rot="-1"]')) rotate(g, -1);
        else if (e.target.closest('[data-rot="1"]')) rotate(g, 1);
        else if (e.target.closest('[data-ship]')) loadShip(g);
      });

      els.grid = h('div', 'flex:1 1 auto;min-height:0;display:grid;gap:6px;' +
        'grid-template-columns:repeat(auto-fit,minmax(142px,1fr))');
      els.grid.addEventListener('click', function (e) {
        var p = e.target.closest('[data-pod]');
        if (p) { var a = p.getAttribute('data-pod').split(','); tapPod(g, +a[0], +a[1]); return; }
        var gr = e.target.closest('[data-grav]');
        if (gr) { var b = gr.getAttribute('data-grav').split(','); setGrav(g, +b[0], +b[1]); return; }
        var dm = e.target.closest('[data-dome]');
        if (dm) { g.data.sel = +dm.getAttribute('data-dome'); refresh(g); }
      });

      els.seeds = h('div', 'flex:0 0 auto;display:flex;gap:4px;flex-wrap:wrap;justify-content:center');
      els.seeds.addEventListener('click', function (e) {
        var b = e.target.closest('[data-seed]');
        if (!b) return;
        g.data.crop = +b.getAttribute('data-seed');
        Milo.sound.click();
        refresh(g);
      });

      els.msg = h('div', 'flex:0 0 auto;min-height:1.2em;text-align:center;font:600 .74rem/1.2 ' +
        FONT + ';color:#ffd166');

      wrap.appendChild(els.bar);
      wrap.appendChild(els.grid);
      wrap.appendChild(els.seeds);
      wrap.appendChild(els.msg);
      g.root.innerHTML = '';
      g.root.appendChild(wrap);
      els.pod = [];
    }

    function refresh(g) {
      var d = g.data, i, j;
      g.set('Credits', U.fmt(Math.round(d.credits)));
      g.set('Ship', U.time(Math.max(0, Math.ceil(d.ct.t))));
      g.set('Power', Math.round(d.power) + '%');
      g.set('Rep', '⭐' + d.rep);

      // ---- top bar: manifest, ring control, power
      var man = '';
      for (i = 0; i < d.ct.items.length; i++) {
        var it = d.ct.items[i], got = Math.min(d.store[it.c], it.n), ok = got >= it.n;
        man += '<span style="display:inline-flex;align-items:center;gap:3px;padding:1px 6px;border-radius:7px;' +
          'background:' + (ok ? 'rgba(46,230,196,.18)' : 'rgba(0,0,0,.3)') + ';border:1px solid ' +
          (ok ? 'rgba(46,230,196,.55)' : 'rgba(255,255,255,.1)') + ';font:800 .68rem/1.5 ' + FONT + '">' +
          CROPS[it.c].e + ' ' + got + '/' + it.n + '</span>';
      }
      var ready = haveAll(d);
      var urgent = d.ct.t < 12;
      els.bar.innerHTML =
        '<span style="font:800 .72rem/1 ' + FONT + ';color:#2ee6c4">🚀 MANIFEST</span>' + man +
        '<span style="font:800 .72rem/1 ' + FONT + ';color:#ffd166">' + d.ct.reward + '🪙</span>' +
        '<span style="font:800 .74rem/1 ' + FONT + ';color:' + (urgent ? '#ff6b9d' : '#bdb3ff') + '">⏱ ' +
        U.time(Math.max(0, Math.ceil(d.ct.t))) + '</span>' +
        '<button type="button" data-ship="1" style="padding:4px 10px;border-radius:9px;cursor:pointer;' +
        'font:800 .72rem/1 ' + FONT + ';border:0;color:' + (ready ? '#04231d' : '#7a72a8') + ';' +
        'background:' + (ready ? 'linear-gradient(90deg,#2ee6c4,#8df2ff)' : 'rgba(255,255,255,.06)') + '">Load ship</button>' +
        '<span style="flex:1"></span>' +
        '<span style="display:inline-flex;align-items:center;gap:4px">' +
        '<button type="button" data-rot="-1" style="' + rotBtn() + '">⟲</button>' +
        '<span style="font:800 .66rem/1 ' + FONT + ';color:#ffe45c">☀ RING</span>' +
        '<button type="button" data-rot="1" style="' + rotBtn() + '">⟳</button></span>' +
        '<span style="display:inline-flex;align-items:center;gap:4px">' +
        '<span style="font:800 .62rem/1 ' + FONT + ';color:#8df2ff">⚡</span>' +
        '<span style="width:56px;height:7px;border-radius:5px;background:rgba(0,0,0,.4);overflow:hidden;display:inline-block">' +
        '<span style="display:block;height:100%;width:' + (d.power / d.maxPower * 100) + '%;' +
        'background:linear-gradient(90deg,#8df2ff,#2ee6c4)"></span></span></span>';
      els.ship = els.bar.querySelector('[data-ship]');

      // ---- domes
      var out = [];
      for (i = 0; i < 4; i++) {
        var dome = d.domes[i], l = lightOf(d, i), band = bandOf(l);
        var bc = band === 'sun' ? '#ffe45c' : band === 'half' ? '#a78bfa' : '#5b5580';
        var lit = band === 'sun' ? '☀️' : band === 'half' ? '🌗' : '🌑';
        var pods = '';
        for (j = 0; j < dome.pods.length; j++) {
          var p = dome.pods[j];
          var cr = p.c >= 0 ? CROPS[p.c] : null;
          var okL = cr && cr.light === band, okG = cr && cr.grav === dome.grav;
          var ripe = cr && p.p >= 1;
          var rot = ripe ? U.clamp(p.ripe / (cr.grow * .85), 0, 1) : 0;
          pods += '<button type="button" data-pod="' + i + ',' + j + '" style="position:relative;' +
            'aspect-ratio:1;border-radius:10px;cursor:pointer;display:grid;place-items:center;overflow:hidden;' +
            'font:inherit;padding:0;' +
            'border:1px solid ' + (p.crack > 0 ? '#ff6b6b' : ripe ? '#2ee6c4' : 'rgba(255,255,255,.12)') + ';' +
            'background:' + (p.crack > 0 ? 'rgba(255,107,107,.16)' :
              cr ? 'radial-gradient(circle at 50% 120%,' + cr.c + '33,rgba(255,255,255,.04))'
                : 'rgba(255,255,255,.04)') + '">' +
            (p.crack > 0 ? '<span style="font-size:15px">💢</span>'
              : cr ? '<span style="font-size:' + (14 + Math.round(p.p * 7)) + 'px;filter:drop-shadow(0 0 5px ' + cr.c + ')">' +
                cr.e + '</span>' : '<span style="font-size:12px;opacity:.4">+</span>') +
            (cr && !ripe ? '<span style="position:absolute;left:2px;right:2px;bottom:2px;height:3px;border-radius:2px;' +
              'background:rgba(0,0,0,.5);overflow:hidden"><span style="display:block;height:100%;width:' +
              (p.p * 100) + '%;background:' + cr.c + '"></span></span>' : '') +
            (ripe ? '<span style="position:absolute;left:2px;right:2px;bottom:2px;height:3px;border-radius:2px;' +
              'background:rgba(0,0,0,.5);overflow:hidden"><span style="display:block;height:100%;width:' +
              ((1 - rot) * 100) + '%;background:' + (rot > .6 ? '#ff6b6b' : '#2ee6c4') + '"></span></span>' : '') +
            (cr && !ripe && (!okL || !okG) ? '<span style="position:absolute;top:1px;right:2px;font-size:8px">⚠️</span>' : '') +
            '</button>';
        }
        out.push('<div data-dome="' + i + '" style="display:flex;flex-direction:column;gap:4px;padding:5px 6px;' +
          'border-radius:12px;min-width:0;' +
          'border:1px solid ' + (d.sel === i ? 'rgba(46,230,196,.6)' : 'rgba(255,255,255,.09)') + ';' +
          'background:linear-gradient(160deg,' + bc + '18,rgba(20,8,48,.55))">' +
          '<div style="display:flex;align-items:center;gap:4px;font:800 .68rem/1.2 ' + FONT + '">' +
          '<span>' + lit + '</span><span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' +
          DOMES[i] + '</span><span style="color:' + bc + ';font-size:.6rem">' + LIGHT[band] + '</span></div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">' + pods + '</div>' +
          '<div style="display:flex;align-items:center;gap:3px">' +
          '<button type="button" data-grav="' + i + ',-1" style="' + miniBtn() + '">−</button>' +
          '<span style="flex:1;text-align:center;font:800 .62rem/1 ' + FONT + ';color:' + GRAV[dome.grav].c + '">' +
          GRAV[dome.grav].e + ' ' + GRAV[dome.grav].n + '</span>' +
          '<button type="button" data-grav="' + i + ',1" style="' + miniBtn() + '">+</button></div>' +
          '</div>');
      }
      els.grid.innerHTML = out.join('');
      els.pod = [];
      for (i = 0; i < 4; i++) {
        var btns = els.grid.children[i].querySelectorAll('[data-pod]');
        for (j = 0; j < 4; j++) els.pod.push(btns[j]);
      }

      // ---- seed palette
      var seeds = [];
      for (i = 0; i < CROPS.length; i++) {
        var c = CROPS[i], un = unlocked(d, i), sel = d.crop === i;
        var cost = Math.ceil(c.val * .3);
        seeds.push('<button type="button" data-seed="' + i + '" style="display:flex;align-items:center;gap:4px;' +
          'padding:3px 7px;border-radius:9px;cursor:pointer;font:800 .64rem/1.2 ' + FONT + ';color:#e8e2ff;' +
          'opacity:' + (un ? 1 : .42) + ';' +
          'border:1px solid ' + (sel ? c.c : 'rgba(255,255,255,.1)') + ';' +
          'background:' + (sel ? c.c + '26' : 'rgba(255,255,255,.04)') + '">' +
          '<span style="font-size:13px">' + (un ? c.e : '🔒') + '</span>' +
          '<span>' + c.n + '</span>' +
          '<span style="color:' + c.c + '">' + (un ? cost + '🪙' : d.done + '/' + c.at) + '</span>' +
          '<span style="color:#9a92c8;font-size:.58rem">' + (LIGHT[c.light] === 'Full sun' ? '☀️' :
            c.light === 'half' ? '🌗' : '🌑') + GRAV[c.grav].e + '</span>' +
          '<span style="color:#ffd166">' + (d.store[i] ? '×' + d.store[i] : '') + '</span>' +
          '</button>');
      }
      els.seeds.innerHTML = seeds.join('');
      els.msg.innerHTML = d.flare > 0
        ? '<span style="color:#ff6b9d">☢️ SOLAR FLARE IN ' + d.flare.toFixed(1) + 's — clear the sunward dome</span>'
        : (d.msgT > 0 ? d.msg : '');
    }

    function rotBtn() {
      return 'width:26px;height:20px;border-radius:7px;border:1px solid rgba(255,228,92,.4);' +
        'background:rgba(255,228,92,.12);color:#ffe45c;font:800 .8rem/1 ' + FONT + ';cursor:pointer;padding:0';
    }
    function miniBtn() {
      return 'width:18px;height:15px;border-radius:5px;border:1px solid rgba(255,255,255,.16);' +
        'background:rgba(255,255,255,.07);color:#e8e2ff;font:800 .64rem/1 ' + FONT + ';cursor:pointer;padding:0';
    }

    /* -------------------------------------------------------------- keys */

    function onKey(g, e) {
      var d = g.data;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); rotate(g, -1); return; }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); rotate(g, 1); return; }
      if (e.code === 'Enter') { e.preventDefault(); loadShip(g); return; }
      var n = 'Digit1 Digit2 Digit3 Digit4 Digit5 Digit6 Digit7'.split(' ').indexOf(e.code);
      if (n >= 0) { e.preventDefault(); d.crop = n; refresh(g); }
    }

    return Milo.domGame(host, {
      id: 'space-farm',
      stats: ['Credits', 'Ship', 'Power', 'Rep'],
      bg: 'radial-gradient(circle at 20% 0%, #2a0f52, #150833 55%, #080418)',
      emo: '🛸',
      start: {
        title: 'Space Farm',
        text: 'Four domes ride a ring around one sun. Only one dome is ever in full light, one is in shade and ' +
          'two are half lit — and every alien crop wants a particular light band and spin setting. Plant, swing ' +
          'the ring, harvest, and fill the supply ship before it leaves.',
        keys: ['Click a pod', '← → rotate ring', '1–7 pick seed', 'Enter load ship']
      },
      init: reset,
      update: update,
      onKey: onKey,
      destroy: function () { fx.destroy(); }
    });
  }

  window.Milo.register({
    id: 'space-farm',
    title: 'Space Farm',
    emo: '🛸',
    category: 'Strategy',
    tagline: 'One sun, four domes, seven fussy alien crops',
    description: 'Your station is a ring of four greenhouse domes turning around a single star, so exactly one ' +
      'dome sits in full sun, one in shade and two at half light — and swinging the ring moves all four at once. ' +
      'Each crop wants a light band and a spin setting: Voidbeans only swell in the dark at low gravity, ' +
      'Ironroot wants half light and heavy spin, and anything in the wrong dome crawls along at a third speed. ' +
      'Seeding pods and turning the ring both burn power that the lit faces generate, ripe crops spoil if you ' +
      'leave them, micrometeors crack pods you have to patch, and solar flares torch whatever is sitting in the ' +
      'sunward dome when they hit. Fill each supply ship manifest before its clock runs out; three missed ships ' +
      'and the contract is cancelled. Tip: plant the shade crops first, then rotate — a dome you are about to ' +
      'turn away from is the safest place to be during a flare.',
    controls: ['Click', '← →', '1–7', 'Enter'],
    colors: ['#2ee6c4', '#2a0f52'],
    scoreLabel: 'credits',
    tags: ['farming', 'space', 'management', 'sim', 'contracts'],
    mount: mount
  });
})();
