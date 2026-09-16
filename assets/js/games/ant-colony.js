/* Ant Colony — split the workers between trails, tunnels and the nursery. */
(function () {
  'use strict';

  var CW = 760, CH = 232;
  var GROUND = 92;
  var FONT = 'Outfit, ui-sans-serif, system-ui, sans-serif';
  var MONTH = 14;                       // seconds per month
  var SEASONS = [
    { n: 'Spring', e: '🌱', sky: ['#8fd4ff', '#c9f0d8'], soil: '#4a3520', c: '#7ddf64' },
    { n: 'Summer', e: '☀️', sky: ['#ffd98a', '#ffefc2'], soil: '#54391f', c: '#ffc247' },
    { n: 'Autumn', e: '🍂', sky: ['#f7b26a', '#f3d7a6'], soil: '#463019', c: '#ff8f4d' },
    { n: 'Winter', e: '❄️', sky: ['#9fb6cc', '#e4eef6'], soil: '#33271a', c: '#bfe0ff' }
  ];

  /* Four trails, each with its own season. Winter shuts all of them. */
  var TRAILS = [
    { n: 'Leaf Litter', e: '🍃', x: 104, y: 40, yield: .135, mul: [1, .8, 1.15, 0], risk: .7, c: '#7ddf64' },
    { n: 'Aphid Farm', e: '🐛', x: 262, y: 30, yield: .16, mul: [.7, 1.55, .9, 0], risk: 1, c: '#a6e3a1' },
    { n: 'Seed Cache', e: '🌾', x: 498, y: 34, yield: .15, mul: [.5, .8, 1.65, 0], risk: .8, c: '#ffd166' },
    { n: 'Sugar Spill', e: '🍬', x: 654, y: 46, yield: .235, mul: [1.2, 1.25, 1.15, 0], risk: 1.9, c: '#ff8fd0' }
  ];

  var JOBS = [
    { k: 'trail', i: 0 }, { k: 'trail', i: 1 }, { k: 'trail', i: 2 }, { k: 'trail', i: 3 },
    { k: 'dig', n: 'Tunnellers', e: '⛏️', d: 'dig chambers: store + nursery', c: '#c9a227' },
    { k: 'nurse', n: 'Nursery', e: '🥚', d: 'turn food into new ants', c: '#ffb3c6' },
    { k: 'guard', n: 'Soldiers', e: '🛡️', d: 'hold the entrance against raiders', c: '#8ecae6' }
  ];

  var EAT = .034;                       // food per ant per second

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
      d.month = 1;
      d.mt = 0;
      d.pop = 12;
      d.food = 44;
      d.cap = 120;
      d.slots = 3;
      d.chambers = 0;
      d.dig = 0;
      d.eggs = 0;
      d.raised = 0;
      d.jobs = [4, 3, 0, 0, 2, 2, 1];
      d.trail = [
        { closed: 0, spider: 0, boost: 0 }, { closed: 0, spider: 0, boost: 0 },
        { closed: 0, spider: 0, boost: 0 }, { closed: 0, spider: 0, boost: 0 }
      ];
      d.raid = null;
      d.raidT = 26;
      d.evT = 16;
      d.parts = [];
      d.ants = [];
      d.tapT = 0;
      d.starve = 0;
      d.msg = 'Move ants between trails, tunnels and the nursery. Winter is coming.';
      d.msgT = 5;
      d.anim = 0;
      build(g);
      refresh(g);
      render(g);
    }

    function season(d) { return Math.min(3, Math.floor((d.month - 1) / 3)); }
    function idle(d) {
      var s = 0;
      for (var i = 0; i < d.jobs.length; i++) s += d.jobs[i];
      return d.pop - s;
    }
    function trailOpen(d, i) {
      return d.trail[i].closed <= 0 && TRAILS[i].mul[season(d)] > 0;
    }

    /* ------------------------------------------------------------ update */

    function update(g, dt) {
      var d = g.data, i;
      d.anim += dt;
      if (d.msgT > 0) d.msgT -= dt;
      if (d.tapT > 0) d.tapT -= dt;
      stepParts(d, dt);
      stepAnts(d, dt);

      var se = season(d);

      // ---- foraging
      var gain = 0;
      for (i = 0; i < 4; i++) {
        var t = d.trail[i];
        if (t.closed > 0) { t.closed -= dt; if (t.closed <= 0) say(d, TRAILS[i].n + ' is passable again.'); }
        if (t.boost > 0) t.boost -= dt;
        if (t.spider > 0) {
          t.spider -= dt;
          if (d.jobs[i] > 0 && Math.random() < dt * .32) {
            d.jobs[i]--; d.pop--;
            burst(d, TRAILS[i].x, TRAILS[i].y + 10, 8, ['#d94f4f', '#ffd166']);
            say(d, 'A spider took a forager on ' + TRAILS[i].n + '!');
            Milo.sound.hit();
          }
        }
        if (!trailOpen(d, i)) continue;
        gain += d.jobs[i] * TRAILS[i].yield * TRAILS[i].mul[se] * (t.boost > 0 ? 2.1 : 1);
      }
      d.food += gain * dt;

      // ---- eating
      d.food -= d.pop * EAT * dt * (se === 3 ? 1.25 : 1);
      if (d.food < 0) {
        d.food = 0;
        d.starve += dt;
        if (d.starve > 1.4) {
          d.starve = 0;
          killAnts(g, 1, 'The colony is starving.');
          if (d.pop <= 0) return;
        }
      } else d.starve = 0;
      if (d.food > d.cap) d.food = d.cap;

      // ---- digging
      if (d.jobs[4] > 0) {
        d.dig += d.jobs[4] * .042 * dt;
        while (d.dig >= 1) {
          d.dig -= 1;
          d.chambers++;
          if (d.chambers % 2) { d.cap += 55; say(d, 'New store chamber — capacity ' + d.cap + '.'); }
          else { d.slots += 2; say(d, 'New brood chamber — ' + d.slots + ' egg slots.'); }
          burst(d, 380, GROUND + 60, 10, ['#c9a227', '#e8d5a0']);
          Milo.sound.tone({ f: 300, f2: 460, d: .12, v: .06, type: 'triangle' });
        }
      }

      // ---- nursery
      var nurses = Math.min(d.jobs[5], d.slots);
      if (nurses > 0 && d.food > 1) {
        var cost = nurses * .13 * dt;
        if (d.food >= cost) {
          d.food -= cost;
          d.eggs += nurses * .052 * dt;
          while (d.eggs >= 1) {
            d.eggs -= 1;
            d.pop++; d.raised++;
            burst(d, 300, GROUND + 92, 9, ['#ffb3c6', '#ffffff']);
            Milo.sound.tone({ f: 820, f2: 1080, d: .09, v: .06, type: 'triangle' });
          }
        }
      }

      // ---- events
      d.evT -= dt;
      if (d.evT <= 0) {
        d.evT = Math.max(9, 19 - d.month * .55);
        randomEvent(g);
      }

      // ---- raids
      if (d.raid) {
        d.raid.t -= dt;
        d.raid.x += (330 - d.raid.x) * Math.min(1, dt * .7);
        if (d.raid.t <= 0) resolveRaid(g);
      } else {
        d.raidT -= dt;
        if (d.raidT <= 0 && d.month >= 2) {
          d.raidT = Math.max(20, 42 - d.month * 1.7);
          d.raid = { str: 1 + Math.round(d.month * .75), t: 5.5, x: -40, taps: 0 };
          say(d, '⚔️ Raiders inbound — strength ' + d.raid.str + '. Tap them or post soldiers!');
          Milo.sound.tone({ f: 180, f2: 90, d: .4, v: .09, type: 'sawtooth' });
        }
      }

      // ---- calendar
      d.mt += dt;
      if (d.mt >= MONTH) {
        d.mt = 0;
        d.month++;
        if (d.month > 12) { winYear(g); return; }
        monthTick(g);
      }

      g.score = Math.max(0, Math.round(d.pop * 12 + d.food + d.raised * 6));

      d.uiT = (d.uiT || 0) + dt;
      if (d.uiT > .11) { d.uiT = 0; refresh(g); }
      render(g);
    }

    function monthTick(g) {
      var d = g.data, se = season(d);
      if (d.month === 4) say(d, '☀️ Summer — aphids are running. Raids get heavier.');
      else if (d.month === 7) say(d, '🍂 Autumn — seed caches are full. Stockpile for winter.');
      else if (d.month === 10) {
        say(d, '❄️ Winter — every trail is shut. You live on what you stored.');
        for (var i = 0; i < 4; i++) d.trail[i].closed = 0;
        Milo.sound.tone({ f: 420, f2: 200, d: .5, v: .08, type: 'sine' });
      } else say(d, SEASONS[se].e + ' Month ' + d.month + ' of 12.');
      Milo.sound.blip();
    }

    function randomEvent(g) {
      var d = g.data, se = season(d);
      var roll = Math.random();
      var i = (Math.random() * 4) | 0;
      if (se === 3) {
        // winter only bites
        if (roll < .5) {
          killAnts(g, 1, '❄️ A cold snap took an ant.');
        } else {
          d.food = Math.max(0, d.food - d.food * .08);
          say(d, '❄️ Frost spoiled part of the store.');
        }
        return;
      }
      if (roll < .28) {
        d.trail[i].closed = 8 + Math.random() * 5;
        say(d, '🌧️ Rain flooded ' + TRAILS[i].n + ' — closed for a while, or scout it open.');
        Milo.sound.tone({ f: 260, f2: 150, d: .2, v: .07, type: 'triangle' });
      } else if (roll < .48) {
        d.trail[i].spider = 7 + Math.random() * 5;
        say(d, '🕷️ A spider is hunting on ' + TRAILS[i].n + ' — pull your ants off it.');
        Milo.sound.hit();
      } else if (roll < .70) {
        d.trail[i].boost = 12;
        say(d, '✨ ' + TRAILS[i].n + ' is swarming with food — double yield for 12 seconds.');
        Milo.sound.powerup();
      } else if (roll < .86) {
        var lost = d.food * .16;
        d.food -= lost;
        say(d, '🍄 Fungus bloomed in the store — ' + Math.round(lost) + ' food lost.');
        Milo.sound.tone({ f: 200, f2: 110, d: .2, v: .07, type: 'sawtooth' });
      } else {
        var found = 10 + Math.random() * 16 + d.month;
        d.food = Math.min(d.cap, d.food + found);
        say(d, '🎁 A dropped crumb — ' + Math.round(found) + ' food carried home.');
        burst(d, 330, GROUND - 10, 12, ['#ffd166', '#ffffff']);
        Milo.sound.coin();
      }
    }

    function resolveRaid(g) {
      var d = g.data;
      var def = d.jobs[6] + Math.floor(d.raid.taps / 3);
      if (def >= d.raid.str) {
        var loot = 8 + d.raid.str * 3;
        d.food = Math.min(d.cap, d.food + loot);
        say(d, '🛡️ Raiders driven off — ' + Math.round(loot) + ' food salvaged.');
        burst(d, 330, GROUND - 6, 16, ['#8ecae6', '#ffffff']);
        Milo.sound.win();
      } else {
        var deficit = d.raid.str - def;
        var lost = Math.min(d.pop - 1, deficit);
        killAnts(g, lost, '⚔️ The nest was overrun — ' + lost + ' ants lost.');
        d.food = Math.max(0, d.food - d.food * .18);
        burst(d, 330, GROUND - 6, 20, ['#d94f4f', '#ffd166']);
        Milo.sound.explode();
      }
      d.raid = null;
    }

    function killAnts(g, n, why) {
      var d = g.data, i;
      for (i = 0; i < n; i++) {
        if (d.pop <= 0) break;
        d.pop--;
        // take from the biggest job first so assignments stay valid
        var big = -1, bv = 0;
        for (var j = 0; j < d.jobs.length; j++) if (d.jobs[j] > bv) { bv = d.jobs[j]; big = j; }
        if (idle(d) < 0 && big >= 0) d.jobs[big]--;
      }
      say(d, why);
      burst(d, 330, GROUND + 20, 8, ['#d94f4f']);
      if (d.pop <= 0) {
        Milo.sound.lose();
        g.gameOver({
          emo: '🐜',
          title: 'The colony died out',
          text: 'It ended in ' + SEASONS[season(d)].n.toLowerCase() + ', month ' + d.month +
            ' of 12. You raised ' + d.raised + ' ants and dug ' + d.chambers + ' chambers.',
          score: Math.max(0, Math.round(d.raised * 6))
        });
      }
    }

    function winYear(g) {
      var d = g.data;
      var score = Math.round(d.pop * 12 + d.food + d.raised * 6);
      g.win({
        emo: '🐜',
        title: 'The colony overwintered',
        text: 'Twelve months survived with ' + d.pop + ' ants, ' + Math.round(d.food) +
          ' food stored and ' + d.chambers + ' chambers dug.',
        score: score
      });
    }

    /* ----------------------------------------------------------- actions */

    function assign(g, j, delta) {
      var d = g.data;
      if (delta > 0) {
        if (idle(d) <= 0) { say(d, 'No idle ants — take some off another job.'); return; }
        d.jobs[j]++;
      } else {
        if (d.jobs[j] <= 0) return;
        d.jobs[j]--;
      }
      Milo.sound.tone({ f: 420 + j * 40, d: .035, v: .045, type: 'square' });
      refresh(g);
    }

    function scout(g, i) {
      var d = g.data;
      if (d.trail[i].closed <= 0) { say(d, TRAILS[i].n + ' is already open.'); return; }
      if (d.food < 10) { say(d, 'Scouting a new way round costs 10 food.'); return; }
      d.food -= 10;
      d.trail[i].closed = 0;
      burst(d, TRAILS[i].x, TRAILS[i].y + 12, 10, [TRAILS[i].c, '#ffffff']);
      Milo.sound.powerup();
      say(d, 'Scouts found a way round to ' + TRAILS[i].n + '.');
      refresh(g);
    }

    function say(d, m) { d.msg = m; d.msgT = 3; }

    /* --------------------------------------------------------- particles */

    function burst(d, x, y, n, cols) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2, v = 40 + Math.random() * 120;
        d.parts.push({
          x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, g: 230,
          s: 1.6 + Math.random() * 2.6, c: cols[(Math.random() * cols.length) | 0],
          t: 0, life: .4 + Math.random() * .5
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

    /* Walking ants are pure decoration, capped so big colonies stay smooth. */
    function stepAnts(d, dt) {
      var want = [], i, j;
      for (i = 0; i < 4; i++) {
        var n = Math.min(9, d.jobs[i]);
        if (!trailOpen(d, i)) n = 0;
        for (j = 0; j < n; j++) want.push(i);
      }
      while (d.ants.length > want.length) d.ants.pop();
      while (d.ants.length < want.length) {
        d.ants.push({ t: Math.random(), dir: Math.random() < .5 ? 1 : -1, sp: .17 + Math.random() * .1 });
      }
      for (i = 0; i < d.ants.length; i++) {
        var a = d.ants[i];
        a.tr = want[i];
        a.t += a.sp * a.dir * dt;
        if (a.t > 1) { a.t = 1; a.dir = -1; }
        if (a.t < 0) { a.t = 0; a.dir = 1; }
      }
    }

    /* -------------------------------------------------------------- view */

    function build(g) {
      var wrap = h('div', 'display:flex;flex-direction:column;gap:6px;width:100%;max-width:880px;' +
        'height:100%;align-self:stretch;font-family:' + FONT + ';color:#f2e6d2');

      els.bar = h('div', 'flex:0 0 auto;display:flex;gap:8px;align-items:center;flex-wrap:wrap;' +
        'background:rgba(201,162,39,.09);border:1px solid rgba(201,162,39,.26);border-radius:11px;padding:4px 10px');

      var box = h('div', 'flex:1 1 auto;min-height:0;display:flex;align-items:center;justify-content:center');
      cv = document.createElement('canvas');
      cv.width = CW; cv.height = CH;
      cv.style.cssText = 'max-width:100%;max-height:100%;width:auto;height:auto;border-radius:11px;' +
        'cursor:pointer;box-shadow:0 12px 30px rgba(0,0,0,.5);border:1px solid rgba(201,162,39,.2)';
      ctx = cv.getContext('2d');
      cv.addEventListener('click', function (e) {
        var d = g.data;
        if (g.state !== 'play') return;
        var r = cv.getBoundingClientRect();
        var x = (e.clientX - r.left) * (CW / r.width);
        var y = (e.clientY - r.top) * (CH / r.height);
        if (d.raid && Math.abs(x - d.raid.x) < 40 && Math.abs(y - (GROUND - 16)) < 34) {
          d.raid.taps++;
          burst(d, x, y, 6, ['#ffd166', '#d94f4f']);
          Milo.sound.tone({ f: 520 + d.raid.taps * 20, d: .04, v: .05, type: 'square' });
          return;
        }
        for (var i = 0; i < 4; i++) {
          if (Math.abs(x - TRAILS[i].x) > 34 || Math.abs(y - TRAILS[i].y) > 30) continue;
          if (!trailOpen(d, i)) { scout(g, i); return; }
          if (d.tapT > 0) return;
          d.tapT = .3;
          var got = 1.6 + d.month * .25;
          d.food = Math.min(d.cap, d.food + got);
          burst(d, TRAILS[i].x, TRAILS[i].y + 8, 6, [TRAILS[i].c, '#ffffff']);
          Milo.sound.tone({ f: 640, f2: 860, d: .05, v: .05, type: 'triangle' });
          return;
        }
      });
      box.appendChild(cv);

      els.jobs = h('div', 'flex:0 0 auto;display:grid;gap:5px;' +
        'grid-template-columns:repeat(auto-fit,minmax(104px,1fr))');
      els.jobs.addEventListener('click', function (e) {
        var b = e.target.closest('[data-as]');
        if (b) { var a = b.getAttribute('data-as').split(','); assign(g, +a[0], +a[1]); return; }
        var s = e.target.closest('[data-scout]');
        if (s) scout(g, +s.getAttribute('data-scout'));
      });

      els.msg = h('div', 'flex:0 0 auto;min-height:1.2em;text-align:center;font:600 .74rem/1.2 ' +
        FONT + ';color:#ffd166');

      wrap.appendChild(els.bar);
      wrap.appendChild(box);
      wrap.appendChild(els.jobs);
      wrap.appendChild(els.msg);
      g.root.innerHTML = '';
      g.root.appendChild(wrap);
    }

    function refresh(g) {
      var d = g.data, i, se = season(d);
      g.set('Month', d.month + '/12');
      g.set('Ants', d.pop);
      g.set('Food', Math.round(d.food) + '/' + d.cap);
      g.set('Raised', d.raised);

      var ff = U.clamp(d.food / d.cap, 0, 1);
      els.bar.innerHTML =
        '<span style="font:800 .78rem/1 ' + FONT + ';color:' + SEASONS[se].c + '">' + SEASONS[se].e + ' ' +
        SEASONS[se].n + ' · month ' + d.month + '/12</span>' +
        '<span style="width:44px;height:6px;border-radius:4px;background:rgba(0,0,0,.4);overflow:hidden;' +
        'display:inline-block"><span style="display:block;height:100%;width:' + (d.mt / MONTH * 100) +
        '%;background:' + SEASONS[se].c + '"></span></span>' +
        '<span style="font:800 .76rem/1 ' + FONT + ';color:#f2e6d2">🐜 ' + d.pop + '</span>' +
        '<span style="display:inline-flex;align-items:center;gap:4px;font:800 .74rem/1 ' + FONT +
        ';color:' + (ff < .18 ? '#ff6b6b' : '#ffd166') + '">🍽 ' + Math.round(d.food) +
        '<span style="width:62px;height:7px;border-radius:5px;background:rgba(0,0,0,.4);overflow:hidden;' +
        'display:inline-block"><span style="display:block;height:100%;width:' + (ff * 100) +
        '%;background:linear-gradient(90deg,#c9a227,#ffd166)"></span></span></span>' +
        '<span style="font:800 .72rem/1 ' + FONT + ';color:#ffb3c6">🥚 ' + Math.floor(d.eggs * 100) / 100 +
        ' · ' + d.slots + ' slots</span>' +
        '<span style="flex:1"></span>' +
        '<span style="font:800 .74rem/1 ' + FONT + ';color:' + (idle(d) > 0 ? '#7ddf64' : '#8a7f70') +
        '">idle ' + idle(d) + '</span>';

      var out = [];
      for (i = 0; i < JOBS.length; i++) {
        var j = JOBS[i], name, emo, note, col;
        if (j.k === 'trail') {
          var T = TRAILS[j.i], st = d.trail[j.i];
          name = T.n; emo = T.e; col = T.c;
          var mul = T.mul[se];
          note = st.closed > 0 ? '🌧️ flooded — tap to scout'
            : st.spider > 0 ? '🕷️ spider hunting!'
              : mul <= 0 ? '❄️ shut for winter'
                : (st.boost > 0 ? '✨ ×2 ' : '') + (mul >= 1.4 ? 'in season' : mul >= .9 ? 'steady' : 'thin')
                  + ' · ' + (d.jobs[i] * T.yield * mul * (st.boost > 0 ? 2.1 : 1)).toFixed(2) + '/s';
        } else {
          name = j.n; emo = j.e; col = j.c;
          note = j.k === 'dig' ? 'chamber ' + Math.round(d.dig * 100) + '%'
            : j.k === 'nurse' ? (d.jobs[i] > d.slots ? 'only ' + d.slots + ' slots!' : 'egg ' + Math.round(d.eggs * 100) + '%')
              : d.raid ? 'raid str ' + d.raid.str : 'on watch';
        }
        out.push('<div style="border-radius:10px;padding:3px 6px 4px;min-width:0;' +
          'border:1px solid ' + (d.jobs[i] ? col + '66' : 'rgba(255,255,255,.08)') + ';' +
          'background:' + (d.jobs[i] ? col + '14' : 'rgba(255,255,255,.035)') + '">' +
          '<div style="display:flex;align-items:center;gap:4px;font:800 .66rem/1.3 ' + FONT + '">' +
          '<span>' + emo + '</span><span style="flex:1;white-space:nowrap;overflow:hidden;' +
          'text-overflow:ellipsis">' + name + '</span>' +
          '<span style="color:' + col + '">' + d.jobs[i] + '</span></div>' +
          '<div style="font:700 .56rem/1.3 ' + FONT + ';color:#bda98a;white-space:nowrap;overflow:hidden;' +
          'text-overflow:ellipsis">' + note + '</div>' +
          '<div style="display:flex;gap:3px;margin-top:2px">' +
          '<button type="button" data-as="' + i + ',-1" style="' + mini() + '">−</button>' +
          '<button type="button" data-as="' + i + ',1" style="' + mini() + '">+</button>' +
          '</div></div>');
      }
      els.jobs.innerHTML = out.join('');
      els.msg.textContent = d.msgT > 0 ? d.msg : '';
    }

    function mini() {
      return 'flex:1;height:16px;border-radius:5px;border:1px solid rgba(255,255,255,.16);' +
        'background:rgba(255,255,255,.07);color:#f2e6d2;font:800 .68rem/1 ' + FONT + ';cursor:pointer;padding:0';
    }

    /* -------------------------------------------------------------- draw */

    function render(g) {
      var d = g.data, se = season(d), S = SEASONS[se], i;

      var sky = ctx.createLinearGradient(0, 0, 0, GROUND);
      sky.addColorStop(0, S.sky[0]); sky.addColorStop(1, S.sky[1]);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, CW, GROUND);

      if (se === 3) {
        ctx.fillStyle = 'rgba(255,255,255,.75)';
        for (i = 0; i < 40; i++) {
          var sx = (U.hash2(i, 2, 5) * CW + d.anim * 14) % CW;
          var sy = (U.hash2(i, 7, 3) * GROUND + d.anim * 22) % GROUND;
          ctx.fillRect(sx | 0, sy | 0, 2, 2);
        }
      } else if (se === 2) {
        for (i = 0; i < 12; i++) {
          var lx = (U.hash2(i, 3, 9) * CW + d.anim * 11) % CW;
          var ly = (U.hash2(i, 5, 4) * GROUND * .8 + d.anim * 16) % (GROUND - 6);
          ctx.fillStyle = 'rgba(200,110,40,.55)';
          ctx.beginPath();
          ctx.ellipse(lx, ly, 4, 2.2, d.anim + i, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // soil
      var soil = ctx.createLinearGradient(0, GROUND, 0, CH);
      soil.addColorStop(0, S.soil);
      soil.addColorStop(1, '#1d1409');
      ctx.fillStyle = soil;
      ctx.fillRect(0, GROUND, CW, CH - GROUND);
      ctx.fillStyle = 'rgba(0,0,0,.22)';
      for (i = 0; i < 120; i++) {
        ctx.fillRect((U.hash2(i, 11, 6) * CW) | 0, (GROUND + U.hash2(i, 13, 8) * (CH - GROUND)) | 0, 2, 2);
      }
      ctx.fillStyle = se === 3 ? '#e8f2fa' : '#2f7d32';
      ctx.fillRect(0, GROUND - 4, CW, 5);

      drawNest(d);
      for (i = 0; i < 4; i++) drawTrail(d, i);
      drawAnts(d);
      if (d.raid) drawRaid(d);

      for (i = 0; i < d.parts.length; i++) {
        var p = d.parts[i], k = 1 - p.t / p.life;
        ctx.globalAlpha = Math.min(1, k * 1.8);
        ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s * k, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function nestX() { return 336; }

    function drawNest(d) {
      var nx = nestX();
      // entrance mound
      ctx.fillStyle = '#6b4b25';
      ctx.beginPath();
      ctx.moveTo(nx - 30, GROUND); ctx.lineTo(nx, GROUND - 16); ctx.lineTo(nx + 30, GROUND);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#1a1008';
      ctx.beginPath(); ctx.ellipse(nx, GROUND - 4, 8, 5, 0, 0, Math.PI * 2); ctx.fill();

      // shaft
      ctx.fillStyle = '#120c06';
      ctx.fillRect(nx - 7, GROUND - 2, 14, CH - GROUND - 8);

      // store chamber (left) and brood chamber (right)
      var cy1 = GROUND + 46, cy2 = GROUND + 96;
      chamber(nx - 82, cy1, 66, 26, '#120c06');
      chamber(nx + 16, cy1, 66, 26, '#120c06');
      chamber(nx - 52, cy2, 104, 26, '#120c06');
      ctx.strokeStyle = '#120c06'; ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(nx, cy1); ctx.lineTo(nx - 30, cy1);
      ctx.moveTo(nx, cy1); ctx.lineTo(nx + 30, cy1);
      ctx.moveTo(nx, cy1); ctx.lineTo(nx, cy2);
      ctx.stroke();

      // stored food as grains
      var ff = U.clamp(d.food / d.cap, 0, 1);
      var grains = Math.round(ff * 26);
      for (var i = 0; i < grains; i++) {
        var gx = nx - 78 + (i % 13) * 5.2, gy = cy1 + 8 - Math.floor(i / 13) * 6;
        ctx.fillStyle = i % 3 ? '#ffd166' : '#c9a227';
        ctx.beginPath(); ctx.arc(gx, gy, 2.2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#e8d5a0';
      ctx.font = '700 9px ' + FONT;
      ctx.fillText('STORE ' + Math.round(d.food), nx - 80, cy1 - 16);

      // tunnellers at work on the right chamber
      ctx.fillStyle = '#c9a227';
      ctx.fillRect(nx + 20, cy1 + 10, 58 * U.clamp(d.dig, 0, 1), 3);
      ctx.fillStyle = '#e8d5a0';
      ctx.fillText('DIG ' + d.chambers + ' chambers', nx + 18, cy1 - 16);

      // brood
      var eggs = Math.min(d.slots, Math.max(0, Math.round(d.jobs[5])));
      for (i = 0; i < d.slots; i++) {
        var ex = nx - 46 + i * 12, ey = cy2 + 2;
        if (ex > nx + 48) break;
        ctx.fillStyle = i < eggs ? '#ffb3c6' : 'rgba(255,179,198,.22)';
        ctx.beginPath(); ctx.ellipse(ex, ey, 4, 5.5, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#ffb3c6';
      ctx.fillText('NURSERY ' + Math.round(d.eggs * 100) + '%', nx - 50, cy2 - 16);

      // soldiers on the mound
      for (i = 0; i < Math.min(8, d.jobs[6]); i++) {
        ant(nx - 24 + i * 7, GROUND - 8, 1, '#8ecae6');
      }
    }

    function chamber(x, y, w, hh, c) {
      ctx.fillStyle = c;
      U.roundRect(ctx, x, y - hh / 2, w, hh, 11);
      ctx.fill();
    }

    function drawTrail(d, i) {
      var T = TRAILS[i], st = d.trail[i], nx = nestX();
      var open = trailOpen(d, i);
      ctx.strokeStyle = open ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.12)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.moveTo(nx, GROUND - 8);
      ctx.quadraticCurveTo((nx + T.x) / 2, GROUND - 26, T.x, T.y + 12);
      ctx.stroke();
      ctx.setLineDash([]);

      // food node
      var glow = ctx.createRadialGradient(T.x, T.y, 1, T.x, T.y, 26);
      glow.addColorStop(0, (open ? T.c : '#7a7a7a') + '66');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(T.x, T.y, 26, 0, Math.PI * 2); ctx.fill();
      ctx.font = (st.boost > 0 ? 26 : 22) + 'px ' + FONT;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.globalAlpha = open ? 1 : .4;
      ctx.fillText(T.e, T.x, T.y);
      ctx.globalAlpha = 1;
      ctx.font = '700 10px ' + FONT;
      ctx.fillStyle = open ? '#ffffff' : '#c9c2b4';
      ctx.fillText(T.n, T.x, T.y + 22);
      if (st.closed > 0) {
        ctx.fillStyle = '#7fb3ff';
        ctx.fillText('🌧️ ' + Math.ceil(st.closed) + 's · tap to scout', T.x, T.y - 20);
      } else if (st.spider > 0) {
        ctx.fillStyle = '#ff6b6b';
        ctx.fillText('🕷️ danger', T.x, T.y - 20);
      } else if (st.boost > 0) {
        ctx.fillStyle = '#ffd166';
        ctx.fillText('✨ ×2', T.x, T.y - 20);
      }
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    }

    function drawAnts(d) {
      var nx = nestX();
      for (var i = 0; i < d.ants.length; i++) {
        var a = d.ants[i], T = TRAILS[a.tr];
        var t = a.t;
        var x0 = nx, y0 = GROUND - 8, x1 = T.x, y1 = T.y + 12;
        var cxp = (x0 + x1) / 2, cyp = GROUND - 26;
        var mt = 1 - t;
        var x = mt * mt * x0 + 2 * mt * t * cxp + t * t * x1;
        var y = mt * mt * y0 + 2 * mt * t * cyp + t * t * y1;
        ant(x, y, a.dir, a.dir < 0 ? '#ffd166' : '#2b1c10');
      }
    }

    function ant(x, y, dir, c) {
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + dir * 3.2, y - .6, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x - dir * 3.4, y, 2.6, 0, Math.PI * 2); ctx.fill();
    }

    function drawRaid(d) {
      var r = d.raid;
      var y = GROUND - 16;
      ctx.font = '26px ' + FONT;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🪲', r.x, y + Math.sin(d.anim * 9) * 2);
      ctx.font = '800 11px ' + FONT;
      ctx.fillStyle = '#ff6b6b';
      ctx.fillText('RAID ' + r.str + ' · ' + r.t.toFixed(1) + 's', r.x, y - 22);
      var def = d.jobs[6] + Math.floor(r.taps / 3);
      ctx.fillStyle = def >= r.str ? '#7ddf64' : '#ffd166';
      ctx.fillText('defence ' + def, r.x, y + 22);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    }

    /* -------------------------------------------------------------- keys */

    function onKey(g, e) {
      var d = g.data;
      var n = 'Digit1 Digit2 Digit3 Digit4 Digit5 Digit6 Digit7'.split(' ').indexOf(e.code);
      if (n >= 0) { e.preventDefault(); d.pick = n; assign(g, n, e.shiftKey ? -1 : 1); return; }
      if (e.code === 'Space' && d.raid) {
        e.preventDefault();
        d.raid.taps++;
        burst(d, d.raid.x, GROUND - 16, 5, ['#ffd166']);
        Milo.sound.tone({ f: 520, d: .04, v: .05, type: 'square' });
      }
    }

    return Milo.domGame(host, {
      id: 'ant-colony',
      stats: ['Month', 'Ants', 'Food', 'Raised'],
      bg: 'radial-gradient(circle at 50% 0%, #4a3520, #241708 60%, #130c05)',
      emo: '🐜',
      start: {
        title: 'Ant Colony',
        text: 'Twelve months, one nest. Split your workers between four foraging trails, tunnellers who dig ' +
          'store and brood chambers, nurses who turn food into new ants, and soldiers on the entrance. Trails ' +
          'come in and out of season and winter shuts every one of them — store enough to live on.',
        keys: ['− / + on each job', '1–7 add an ant', 'Shift+number removes', 'Tap food or raiders']
      },
      init: reset,
      update: update,
      onKey: onKey
    });
  }

  window.Milo.register({
    id: 'ant-colony',
    title: 'Ant Colony',
    emo: '🐜',
    category: 'Strategy',
    tagline: 'Twelve months, four trails, one nest to keep fed',
    description: 'Every ant you have is on exactly one job. Foragers bring food in from four trails whose yield ' +
      'swings with the season — leaf litter is steady, the aphid farm peaks in summer, the seed cache in autumn, ' +
      'and the sugar spill pays double but draws spiders. Tunnellers dig alternating store and brood chambers, ' +
      'nurses burn food to raise new ants up to the number of brood slots you have dug, and soldiers hold the ' +
      'entrance when beetle raids arrive — you can tap the raider to help, but only soldiers really count. ' +
      'Rain floods trails until you pay to scout a way round, fungus spoils the store, and from month ten every ' +
      'trail shuts for winter while the colony eats what it saved. Survive all twelve months; score is the ants ' +
      'alive, the food left and every ant you raised. Tip: over-dig in spring — store capacity is what you ' +
      'actually take into winter.',
    controls: ['− / +', '1–7', 'Shift + number', 'Click the map'],
    colors: ['#c9a227', '#3a2612'],
    tags: ['ants', 'colony', 'management', 'seasons', 'survival'],
    mount: mount
  });
})();
