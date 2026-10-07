/* Pet Hotel — check them in, keep them happy, send them home with five stars. */
(function () {
  'use strict';

  var FONT = 'Outfit, ui-sans-serif, system-ui, sans-serif';
  var NEEDS = [
    { n: 'Fed', e: '🍖', c: '#ff8a4c', dur: 2.2, rate: 1 / 34 },
    { n: 'Played', e: '🎾', c: '#2bb673', dur: 3.0, rate: 1 / 27 },
    { n: 'Clean', e: '🧼', c: '#3fa9f5', dur: 2.6, rate: 1 / 42 }
  ];

  var ROOMS = {
    kennel: { n: 'Kennel', e: '🦴', c: '#ffb36b' },
    cattery: { n: 'Cattery', e: '🧶', c: '#f58ea6' },
    aviary: { n: 'Aviary', e: '🪶', c: '#7fd1f5' },
    burrow: { n: 'Burrow', e: '🌰', c: '#c79a6b' },
    terrarium: { n: 'Terrarium', e: '🌿', c: '#7ac77a' },
    aquarium: { n: 'Aquarium', e: '💧', c: '#5fc8d6' }
  };

  /* Ten guests. Every species drains its three needs differently, so a hotel
     full of parrots is a very different shift to one full of snakes. */
  var SPECIES = [
    { n: 'Dog', e: '🐶', room: 'kennel', pay: 18, rep: 0, drain: [1, 1.4, 1.05] },
    { n: 'Cat', e: '🐱', room: 'cattery', pay: 20, rep: 0, drain: [.9, .75, 1.35] },
    { n: 'Rabbit', e: '🐰', room: 'burrow', pay: 17, rep: 0, drain: [1.3, 1.05, 1.15] },
    { n: 'Hamster', e: '🐹', room: 'burrow', pay: 15, rep: 0, drain: [1.2, 1.15, 1.25] },
    { n: 'Canary', e: '🐤', room: 'aviary', pay: 21, rep: 0, drain: [1.1, .9, .9] },
    { n: 'Parrot', e: '🦜', room: 'aviary', pay: 27, rep: 5, drain: [1.25, 1.25, .8] },
    { n: 'Iguana', e: '🦎', room: 'terrarium', pay: 29, rep: 10, drain: [.7, .6, 1.15] },
    { n: 'Goldfish', e: '🐠', room: 'aquarium', pay: 16, rep: 10, drain: [.8, .55, 1.5] },
    { n: 'Turtle', e: '🐢', room: 'aquarium', pay: 31, rep: 16, drain: [.65, .7, 1.2] },
    { n: 'Snake', e: '🐍', room: 'terrarium', pay: 36, rep: 22, drain: [.5, .5, 1.3] }
  ];

  var NAMES = ['Biscuit', 'Pepper', 'Mango', 'Olive', 'Noodle', 'Waffle', 'Pickle', 'Mochi', 'Bramble',
    'Clover', 'Dumpling', 'Sprout', 'Truffle', 'Juniper', 'Marbles', 'Pumpkin', 'Sesame', 'Toffee',
    'Comet', 'Nutmeg', 'Peanut', 'Saffron', 'Tangle', 'Violet', 'Wren', 'Ziggy', 'Barnaby', 'Poppy',
    'Rusty', 'Hazel', 'Domino', 'Muffin'];

  var NEW_ROOMS = [
    { type: 'terrarium', rep: 10, cost: 420 },
    { type: 'aquarium', rep: 18, cost: 760 },
    { type: 'kennel', rep: 26, cost: 1100 },
    { type: 'cattery', rep: 34, cost: 1500 }
  ];

  var DAY = 44, NIGHT = 22;

  function h(tag, css, html) {
    var n = document.createElement(tag);
    if (css) n.style.cssText = css;
    if (html != null) n.innerHTML = html;
    return n;
  }

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
          ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,.85)';
          ctx.strokeText(p.str, p.x, p.y);
          ctx.fillStyle = p.c; ctx.fillText(p.str, p.x, p.y);
        } else if (p.k === 'emo') {
          ctx.font = p.s + 'px ' + FONT;
          ctx.textAlign = 'center';
          ctx.fillText(p.str, p.x, p.y);
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
          var a = Math.random() * Math.PI * 2, v = (spd || 100) * (.35 + Math.random());
          ps.push({
            k: 'dot', x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 45, g: 260,
            s: 2 + Math.random() * 3, c: cols[i % cols.length], t: 0, life: .45 + Math.random() * .45
          });
        }
      },
      pop: function (x, y, str) {
        ps.push({ k: 'emo', x: x, y: y, vx: (Math.random() - .5) * 30, vy: -60, g: 30, s: 20, str: str, t: 0, life: .9 });
      },
      text: function (x, y, str, c, s) {
        ps.push({ k: 'txt', x: x, y: y, vx: 0, vy: -44, g: 0, s: s || 16, c: c, str: str, t: 0, life: 1.1 });
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
      d.cash = 260;
      d.gross = 0;
      d.rep = 4;
      d.stays = 0;
      d.stars = 0;
      d.staff = 2;
      d.busy = [];
      d.rooms = [mkRoom('kennel'), mkRoom('cattery'), mkRoom('aviary'), mkRoom('burrow')];
      d.lobby = [];
      d.sel = -1;
      d.clock = 0;
      d.night = false;
      d.arrive = 2.5;
      d.walked = 0;
      d.nameI = (Math.random() * NAMES.length) | 0;
      d.msg = 'Click a guest in the lobby, then click a free room.';
      d.msgT = 5;
      build(g);
      fx.attach();
      arrival(g, true);
      arrival(g, true);
      refresh(g);
    }

    function mkRoom(type) { return { type: type, pet: null, work: null }; }

    function nextName(d) {
      d.nameI = (d.nameI + 1 + ((Math.random() * 3) | 0)) % NAMES.length;
      return NAMES[d.nameI];
    }

    function pickSpecies(d) {
      var pool = [], i;
      for (i = 0; i < SPECIES.length; i++) if (d.rep >= SPECIES[i].rep) pool.push(i);
      // bias toward species you actually have a room for
      var owned = [];
      for (i = 0; i < pool.length; i++) {
        var want = SPECIES[pool[i]].room, got = false;
        for (var r = 0; r < d.rooms.length; r++) if (d.rooms[r].type === want) got = true;
        if (got) owned.push(pool[i]);
      }
      var src = (owned.length && Math.random() < .82) ? owned : pool;
      return src[(Math.random() * src.length) | 0];
    }

    function arrival(g, quiet) {
      var d = g.data;
      if (d.lobby.length >= 3) {
        d.walked++;
        d.rep = Math.max(0, d.rep - 1);
        d.msg = 'The lobby was full — a guest walked out.';
        d.msgT = 2.6;
        Milo.sound.tone({ f: 260, f2: 150, d: .16, v: .07, type: 'triangle' });
        checkClosed(g);
        return;
      }
      var si = pickSpecies(d), sp = SPECIES[si];
      d.lobby.push({
        sp: si, name: nextName(d),
        stay: Math.round(32 + Math.random() * 26 + d.rep * .5),
        need: [1, 1, 1], hapSum: 0, age: 0, low: 0
      });
      if (!quiet) Milo.sound.tone({ f: 620, f2: 820, d: .09, v: .06, type: 'triangle' });
    }

    function freeStaff(d) { return d.staff - d.busy.length; }

    /* ------------------------------------------------------------ update */

    function update(g, dt) {
      var d = g.data, i, r, p;
      if (d.msgT > 0) d.msgT -= dt;

      d.clock += dt;
      var span = d.night ? NIGHT : DAY;
      if (d.clock >= span) { d.clock = 0; d.night = !d.night; flipDay(g); }
      var nightMul = d.night ? .48 : 1;
      var ramp = 1 + d.rep * .008;

      // staff finishing jobs
      for (i = d.busy.length - 1; i >= 0; i--) {
        var jb = d.busy[i];
        jb.t += dt;
        if (jb.t < jb.total) continue;
        d.busy.splice(i, 1);
        r = d.rooms[jb.room];
        if (r) { r.work = null; if (r.pet) { r.pet.need[jb.act] = 1; sparkleRoom(d, jb.room, NEEDS[jb.act]); } }
      }

      // guests
      for (i = 0; i < d.rooms.length; i++) {
        r = d.rooms[i]; p = r.pet;
        if (!p) continue;
        var sp = SPECIES[p.sp];
        var mismatch = sp.room !== r.type ? 1.75 : 1;
        var j, mean = 0;
        for (j = 0; j < 3; j++) {
          p.need[j] = Math.max(0, p.need[j] - NEEDS[j].rate * sp.drain[j] * mismatch * nightMul * ramp * dt);
          mean += p.need[j];
        }
        mean /= 3;
        if (mismatch > 1) mean = Math.min(mean, .72);
        p.hapSum += mean * dt;
        p.age += dt;
        p.stay -= dt;
        if (mean < .07) {
          p.low += dt;
          if (p.low > 4) { storm(g, i); continue; }
        } else p.low = 0;
        if (p.stay <= 0) checkout(g, i);
      }

      // lobby patience: guests waiting too long give up
      for (i = d.lobby.length - 1; i >= 0; i--) {
        d.lobby[i].wait = (d.lobby[i].wait || 0) + dt;
        if (d.lobby[i].wait > 26) {
          d.lobby.splice(i, 1);
          d.walked++;
          d.rep = Math.max(0, d.rep - 1);
          d.msg = 'A guest got tired of waiting in the lobby.';
          d.msgT = 2.6;
          Milo.sound.hit();
          if (d.sel >= d.lobby.length) d.sel = -1;
          checkClosed(g);
        }
      }

      if (!d.night) {
        d.arrive -= dt;
        if (d.arrive <= 0) {
          d.arrive = Math.max(5.5, 10.5 - d.rep * .13);
          arrival(g);
        }
      }

      d.uiT = (d.uiT || 0) + dt;
      if (d.uiT > .1) { d.uiT = 0; refresh(g); }
    }

    function flipDay(g) {
      var d = g.data;
      d.msg = d.night ? '🌙 Lights out — needs settle and no new guests until morning.'
        : '🌞 Morning shift — the door is open again.';
      d.msgT = 3.4;
      Milo.sound.tone({ f: d.night ? 300 : 700, f2: d.night ? 200 : 900, d: .28, v: .07, type: 'sine' });
    }

    function sparkleRoom(d, i, need) {
      var el = els.room[i];
      if (!el) return;
      var pt = fx.at(el);
      fx.burst(pt.x, pt.y, 8, [need.c, '#ffffff'], 110);
      fx.pop(pt.x, pt.y - 6, need.e);
      Milo.sound.tone({ f: 700, f2: 980, d: .08, v: .06, type: 'triangle' });
    }

    function checkout(g, i) {
      var d = g.data, r = d.rooms[i], p = r.pet;
      var avg = p.age > 0 ? p.hapSum / p.age : 0;
      var stars = U.clamp(Math.round(avg * 5), 1, 5);
      var sp = SPECIES[p.sp];
      var pay = Math.round(sp.pay * (.6 + stars * .34) + stars * 6);
      d.cash += pay; d.gross += pay;
      d.stays++; d.stars += stars;
      d.rep = Math.max(0, d.rep + (stars - 3));
      g.score = Math.round(d.gross);
      var pt = fx.at(els.room[i]);
      fx.burst(pt.x, pt.y, 14, stars >= 4 ? ['#f5a623', '#2bb673', '#fff'] : ['#bfae9a'], 140);
      fx.text(pt.x, pt.y - 12, '+$' + pay + ' ' + new Array(stars + 1).join('★'),
        stars >= 4 ? '#2bb673' : stars >= 3 ? '#f5a623' : '#d9534f', 15);
      r.pet = null; r.work = null;
      for (var b = d.busy.length - 1; b >= 0; b--) if (d.busy[b].room === i) d.busy.splice(b, 1);
      if (stars >= 4) Milo.sound.coin(); else Milo.sound.click();
      d.msg = p.name + ' the ' + sp.n.toLowerCase() + ' checked out with ' + stars + ' star' +
        (stars === 1 ? '' : 's') + '.';
      d.msgT = 2.6;
      checkUnlock(g);
      checkClosed(g);
    }

    function storm(g, i) {
      var d = g.data, r = d.rooms[i], p = r.pet;
      var pt = fx.at(els.room[i]);
      fx.burst(pt.x, pt.y, 16, ['#d9534f', '#ff8a4c'], 170);
      fx.text(pt.x, pt.y - 12, 'stormed out!', '#d9534f', 15);
      d.rep = Math.max(0, d.rep - 4);
      d.msg = p.name + ' was neglected and stormed out. Reputation −4.';
      d.msgT = 3.2;
      r.pet = null; r.work = null;
      for (var b = d.busy.length - 1; b >= 0; b--) if (d.busy[b].room === i) d.busy.splice(b, 1);
      Milo.sound.lose();
      checkClosed(g);
    }

    function checkClosed(g) {
      var d = g.data;
      if (d.rep > 0) return;
      g.gameOver({
        emo: '🐾',
        title: 'Reviews sank the hotel',
        text: 'Reputation hit zero after ' + d.stays + ' stay' + (d.stays === 1 ? '' : 's') +
          ' averaging ' + (d.stays ? (d.stars / d.stays).toFixed(1) : '0') + ' stars. ' +
          d.walked + ' guest' + (d.walked === 1 ? '' : 's') + ' turned away.',
        score: Math.round(d.gross)
      });
    }

    function checkUnlock(g) {
      var d = g.data;
      for (var i = 0; i < NEW_ROOMS.length; i++) {
        if (d.rooms.length === 4 + i && d.rep >= NEW_ROOMS[i].rep) {
          d.msg = '🔓 ' + ROOMS[NEW_ROOMS[i].type].n + ' available to build for $' + NEW_ROOMS[i].cost + '.';
          d.msgT = 3.4;
          return;
        }
      }
    }

    /* ----------------------------------------------------------- actions */

    function checkIn(g, room) {
      var d = g.data, r = d.rooms[room];
      if (!r || r.pet) { say(d, 'That room is occupied.'); return; }
      if (!d.lobby.length) { say(d, 'Nobody is waiting in the lobby.'); return; }
      var idx = d.sel >= 0 && d.sel < d.lobby.length ? d.sel : 0;
      var p = d.lobby.splice(idx, 1)[0];
      d.sel = -1;
      r.pet = p;
      p.wait = 0;
      var sp = SPECIES[p.sp];
      var pt = fx.at(els.room[room]);
      fx.pop(pt.x, pt.y - 6, sp.e);
      if (sp.room === r.type) {
        fx.burst(pt.x, pt.y, 9, ['#2bb673', '#ffffff'], 100);
        Milo.sound.powerup();
        say(d, p.name + ' loves the ' + ROOMS[r.type].n.toLowerCase() + '.');
      } else {
        Milo.sound.click();
        say(d, p.name + ' is a ' + sp.n.toLowerCase() + ' — a ' + ROOMS[sp.room].n.toLowerCase() +
          ' would suit better. Needs drain faster here.');
      }
      refresh(g);
    }

    function doAct(g, room, act) {
      var d = g.data, r = d.rooms[room];
      if (!r || !r.pet) return;
      if (r.work) { say(d, 'Someone is already in that room.'); return; }
      if (freeStaff(d) <= 0) { say(d, 'Every keeper is busy — wait for one to finish.'); Milo.sound.tone({ f: 150, d: .1, v: .05 }); return; }
      if (r.pet.need[act] > .95) { say(d, r.pet.name + ' does not need that yet.'); return; }
      var job = { room: room, act: act, t: 0, total: NEEDS[act].dur };
      d.busy.push(job);
      r.work = job;
      Milo.sound.tone({ f: 380 + act * 90, d: .06, v: .055, type: 'square' });
      refresh(g);
    }

    function hire(g) {
      var d = g.data;
      var cost = Math.round(240 * Math.pow(1.85, d.staff - 2));
      if (d.staff >= 6) { say(d, 'Six keepers is a full roster.'); return; }
      if (d.cash < cost) { say(d, 'A new keeper costs $' + cost + '.'); Milo.sound.tone({ f: 140, d: .1, v: .05 }); return; }
      d.cash -= cost;
      d.staff++;
      Milo.sound.powerup();
      say(d, 'Hired keeper number ' + d.staff + '.');
      refresh(g);
    }

    function buildRoom(g) {
      var d = g.data, i = d.rooms.length - 4;
      if (i < 0 || i >= NEW_ROOMS.length) { say(d, 'The hotel is full.'); return; }
      var nr = NEW_ROOMS[i];
      if (d.rep < nr.rep) { say(d, 'Needs ' + nr.rep + ' reputation first.'); return; }
      if (d.cash < nr.cost) { say(d, ROOMS[nr.type].n + ' costs $' + nr.cost + '.'); Milo.sound.tone({ f: 140, d: .1, v: .05 }); return; }
      d.cash -= nr.cost;
      d.rooms.push(mkRoom(nr.type));
      Milo.sound.powerup();
      say(d, ROOMS[nr.type].n + ' opened.');
      refresh(g);
    }

    function say(d, m) { d.msg = m; d.msgT = 2.8; }

    /* -------------------------------------------------------------- view */

    function build(g) {
      var wrap = h('div', 'display:flex;flex-direction:column;gap:6px;width:100%;max-width:900px;' +
        'height:100%;align-self:stretch;font-family:' + FONT + ';color:#402e26');

      els.bar = h('div', 'flex:0 0 auto;display:flex;gap:7px;align-items:center;flex-wrap:wrap;' +
        'background:rgba(255,248,238,.94);border:1px solid rgba(64,46,38,.14);border-radius:12px;' +
        'padding:5px 10px;box-shadow:0 4px 14px rgba(70,40,20,.18)');
      els.bar.addEventListener('click', function (e) {
        if (e.target.closest('[data-hire]')) hire(g);
        else if (e.target.closest('[data-build]')) buildRoom(g);
      });

      els.lobby = h('div', 'flex:0 0 auto;display:flex;gap:5px;align-items:center;flex-wrap:wrap;' +
        'background:rgba(255,248,238,.9);border:1px dashed rgba(64,46,38,.22);border-radius:12px;padding:4px 8px');
      els.lobby.addEventListener('click', function (e) {
        var b = e.target.closest('[data-lob]');
        if (!b) return;
        g.data.sel = +b.getAttribute('data-lob');
        Milo.sound.click();
        refresh(g);
      });

      els.grid = h('div', 'flex:1 1 auto;min-height:0;display:grid;gap:6px;align-content:center;' +
        'grid-template-columns:repeat(auto-fit,minmax(150px,1fr))');
      els.grid.addEventListener('click', function (e) {
        var a = e.target.closest('[data-act]');
        if (a) { var q = a.getAttribute('data-act').split(','); doAct(g, +q[0], +q[1]); return; }
        var r = e.target.closest('[data-room]');
        if (r) checkIn(g, +r.getAttribute('data-room'));
      });

      els.msg = h('div', 'flex:0 0 auto;min-height:1.2em;text-align:center;font:700 .74rem/1.2 ' +
        FONT + ';color:#fff;text-shadow:0 1px 6px rgba(60,30,10,.75)');

      wrap.appendChild(els.bar);
      wrap.appendChild(els.lobby);
      wrap.appendChild(els.grid);
      wrap.appendChild(els.msg);
      g.root.innerHTML = '';
      g.root.appendChild(wrap);
      els.room = [];
    }

    function refresh(g) {
      var d = g.data, i, j;
      g.set('Cash', '$' + U.fmt(Math.round(d.cash)));
      g.set('Rep', '⭐' + d.rep);
      g.set('Stays', d.stays);
      g.set('Keepers', (d.staff - d.busy.length) + '/' + d.staff);

      host.style.background = d.night
        ? 'linear-gradient(180deg,#2b2350,#171233 70%,#0d0a22)'
        : 'linear-gradient(180deg,#ffe0b0,#ffc38a 60%,#f9a978)';

      // ---- bar
      var keepers = '';
      for (i = 0; i < d.staff; i++) {
        var job = d.busy[i];
        keepers += '<span style="position:relative;display:inline-block;width:20px;text-align:center;' +
          'font-size:15px;opacity:' + (job ? .45 : 1) + '">' + (job ? '🧹' : '🧑‍⚕️') + '</span>';
      }
      var hireCost = Math.round(240 * Math.pow(1.85, d.staff - 2));
      var nr = d.rooms.length - 4 < NEW_ROOMS.length ? NEW_ROOMS[d.rooms.length - 4] : null;
      var span = d.night ? NIGHT : DAY;
      els.bar.innerHTML =
        '<span style="font:800 .82rem/1 ' + FONT + ';color:#c2410c">🐾 $' + U.fmt(Math.round(d.cash)) + '</span>' +
        '<span style="font:800 .74rem/1 ' + FONT + ';color:#a16207">⭐ ' + d.rep + '</span>' +
        '<span style="display:inline-flex;align-items:center;gap:3px">' + keepers + '</span>' +
        '<span style="display:inline-flex;align-items:center;gap:4px;font:800 .7rem/1 ' + FONT + ';color:#6b5545">' +
        (d.night ? '🌙 Night' : '🌞 Day') +
        '<span style="width:44px;height:6px;border-radius:4px;background:rgba(64,46,38,.16);overflow:hidden;' +
        'display:inline-block"><span style="display:block;height:100%;width:' +
        ((1 - d.clock / span) * 100) + '%;background:' + (d.night ? '#8b7ddb' : '#f5a623') + '"></span></span></span>' +
        '<span style="flex:1"></span>' +
        '<button type="button" data-hire="1" style="' + shopBtn(d.cash >= hireCost && d.staff < 6) + '">' +
        (d.staff >= 6 ? 'Full roster' : '🧑‍⚕️ Hire $' + hireCost) + '</button>' +
        (nr ? '<button type="button" data-build="1" style="' +
          shopBtn(d.cash >= nr.cost && d.rep >= nr.rep) + '">' + ROOMS[nr.type].e + ' ' +
          ROOMS[nr.type].n + (d.rep < nr.rep ? ' ⭐' + nr.rep : ' $' + nr.cost) + '</button>' : '');

      // ---- lobby
      var lob = '<span style="font:800 .66rem/1 ' + FONT + ';letter-spacing:.08em;text-transform:uppercase;' +
        'color:#8a6a55">Lobby</span>';
      if (!d.lobby.length) {
        lob += '<span style="font:600 .72rem/1.4 ' + FONT + ';color:#a1836d">empty — ' +
          (d.night ? 'closed until morning' : 'next guest in ' + Math.ceil(d.arrive) + 's') + '</span>';
      }
      for (i = 0; i < d.lobby.length; i++) {
        var p = d.lobby[i], sp = SPECIES[p.sp];
        var pat = U.clamp(1 - (p.wait || 0) / 26, 0, 1);
        lob += '<button type="button" data-lob="' + i + '" style="display:flex;align-items:center;gap:5px;' +
          'padding:3px 8px;border-radius:10px;cursor:pointer;font:inherit;color:#402e26;' +
          'border:2px solid ' + (d.sel === i ? '#c2410c' : 'rgba(64,46,38,.16)') + ';' +
          'background:' + (d.sel === i ? 'rgba(194,65,12,.12)' : 'rgba(255,255,255,.7)') + '">' +
          '<span style="font-size:17px">' + sp.e + '</span>' +
          '<span style="text-align:left"><span style="display:block;font:800 .7rem/1.1 ' + FONT + '">' +
          p.name + '</span><span style="display:block;font:700 .58rem/1.2 ' + FONT + ';color:#8a6a55">' +
          ROOMS[sp.room].e + ' ' + Math.round(p.stay) + 's · $' + sp.pay + '</span></span>' +
          '<span style="width:5px;height:22px;border-radius:3px;background:rgba(64,46,38,.14);overflow:hidden;' +
          'display:inline-block;position:relative"><span style="position:absolute;bottom:0;left:0;right:0;height:' +
          (pat * 100) + '%;background:' + (pat < .3 ? '#d9534f' : '#2bb673') + '"></span></span>' +
          '</button>';
      }
      els.lobby.innerHTML = lob;

      // ---- rooms
      var out = [];
      for (i = 0; i < d.rooms.length; i++) {
        var r = d.rooms[i], rt = ROOMS[r.type], pet = r.pet;
        var body;
        if (!pet) {
          body = '<div style="flex:1;display:grid;place-items:center;font:700 .68rem/1.3 ' + FONT +
            ';color:#a1836d;min-height:54px">' +
            (d.lobby.length ? 'click to check in' : 'vacant') + '</div>';
        } else {
          var sp2 = SPECIES[pet.sp];
          var wrong = sp2.room !== r.type;
          var bars = '';
          for (j = 0; j < 3; j++) {
            var v = pet.need[j];
            var col = v > .55 ? '#2bb673' : v > .25 ? '#f5a623' : '#d9534f';
            bars += '<button type="button" data-act="' + i + ',' + j + '" style="display:flex;align-items:center;' +
              'gap:4px;padding:1px 3px;border-radius:7px;cursor:pointer;font:inherit;width:100%;' +
              'border:1px solid ' + (v < .3 ? 'rgba(217,83,79,.5)' : 'rgba(64,46,38,.1)') + ';' +
              'background:' + (v < .3 ? 'rgba(217,83,79,.1)' : 'rgba(255,255,255,.55)') + '">' +
              '<span style="font-size:11px">' + NEEDS[j].e + '</span>' +
              '<span style="flex:1;height:5px;border-radius:3px;background:rgba(64,46,38,.14);overflow:hidden">' +
              '<span style="display:block;height:100%;width:' + (v * 100) + '%;background:' + col + '"></span></span>' +
              '</button>';
          }
          var mean = (pet.need[0] + pet.need[1] + pet.need[2]) / 3;
          var live = U.clamp(Math.round(mean * 5), 0, 5);
          var starStr = '';
          for (j = 0; j < 5; j++) starStr += j < live ? '★' : '☆';
          body = '<div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">' +
            '<span style="font-size:19px' + (wrong ? ';filter:grayscale(.35)' : '') + '">' + sp2.e + '</span>' +
            '<span style="flex:1;min-width:0"><span style="display:block;font:800 .7rem/1.1 ' + FONT +
            ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + pet.name + '</span>' +
            '<span style="display:block;font:800 .58rem/1.2 ' + FONT + ';color:' +
            (live >= 4 ? '#2bb673' : live >= 3 ? '#f5a623' : '#d9534f') + '">' + starStr + '</span></span>' +
            '<span style="font:800 .62rem/1 ' + FONT + ';color:#6b5545">' + Math.max(0, Math.ceil(pet.stay)) + 's</span>' +
            '</div>' + bars +
            (wrong ? '<div style="font:700 .55rem/1.3 ' + FONT + ';color:#d9534f">wrong room — needs drain fast</div>' : '') +
            (r.work ? '<div style="height:4px;border-radius:3px;background:rgba(64,46,38,.14);overflow:hidden;margin-top:2px">' +
              '<div style="height:100%;width:' + (r.work.t / r.work.total * 100) + '%;background:#3fa9f5"></div></div>' : '');
        }
        out.push('<div data-room="' + i + '" style="display:flex;flex-direction:column;padding:5px 7px;' +
          'border-radius:12px;cursor:' + (pet ? 'default' : 'pointer') + ';min-width:0;' +
          'background:rgba(255,248,238,.95);box-shadow:0 4px 12px rgba(70,40,20,.2);' +
          'border:2px solid ' + (pet ? rt.c : d.lobby.length ? 'rgba(43,182,115,.6)' : 'rgba(64,46,38,.1)') + '">' +
          '<div style="display:flex;align-items:center;gap:4px;font:800 .6rem/1.3 ' + FONT + ';color:#8a6a55;' +
          'letter-spacing:.05em;text-transform:uppercase"><span>' + rt.e + '</span><span>' + rt.n +
          ' ' + (i + 1) + '</span></div>' + body + '</div>');
      }
      els.grid.innerHTML = out.join('');
      els.room = [];
      for (i = 0; i < d.rooms.length; i++) els.room.push(els.grid.children[i]);

      els.msg.textContent = d.msgT > 0 ? d.msg : '';
    }

    function shopBtn(can) {
      return 'padding:4px 9px;border-radius:9px;cursor:' + (can ? 'pointer' : 'default') + ';' +
        'font:800 .66rem/1 ' + FONT + ';color:' + (can ? '#0d3b25' : '#9a8577') + ';' +
        'border:1px solid ' + (can ? 'rgba(43,182,115,.55)' : 'rgba(64,46,38,.12)') + ';' +
        'background:' + (can ? 'rgba(43,182,115,.2)' : 'rgba(64,46,38,.05)') + '';
    }

    /* -------------------------------------------------------------- keys */

    function onKey(g, e) {
      var d = g.data;
      var n = 'Digit1 Digit2 Digit3 Digit4 Digit5 Digit6 Digit7 Digit8'.split(' ').indexOf(e.code);
      if (n >= 0 && d.rooms[n]) {
        e.preventDefault();
        if (d.rooms[n].pet) doAct(g, n, 0); else checkIn(g, n);
        return;
      }
      if (e.code === 'KeyF' || e.code === 'KeyG' || e.code === 'KeyC') {
        e.preventDefault();
        var act = e.code === 'KeyF' ? 0 : e.code === 'KeyG' ? 1 : 2;
        // serve whichever guest is worst off on that need
        var worst = -1, wv = 1;
        for (var i = 0; i < d.rooms.length; i++) {
          var p = d.rooms[i].pet;
          if (!p || d.rooms[i].work) continue;
          if (p.need[act] < wv) { wv = p.need[act]; worst = i; }
        }
        if (worst >= 0) doAct(g, worst, act);
        return;
      }
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        for (var r = 0; r < d.rooms.length; r++) {
          if (!d.rooms[r].pet) { checkIn(g, r); return; }
        }
      }
    }

    return Milo.domGame(host, {
      id: 'pet-hotel',
      stats: ['Cash', 'Rep', 'Stays', 'Keepers'],
      bg: 'linear-gradient(180deg,#ffe0b0,#ffc38a 60%,#f9a978)',
      emo: '🐾',
      start: {
        title: 'Pet Hotel',
        text: 'Guests arrive in the lobby wanting a room that suits their species. Check them in, then keep ' +
          'food, play and cleaning topped up with the keepers you have — each job ties a keeper up for a few ' +
          'seconds. Happy guests check out with five stars; neglected ones storm out and wreck your reputation.',
        keys: ['Click a guest, click a room', 'F feed', 'G play', 'C clean']
      },
      init: reset,
      update: update,
      onKey: onKey,
      destroy: function (g) { fx.destroy(); host.style.background = ''; }
    });
  }

  window.Milo.register({
    id: 'pet-hotel',
    title: 'Pet Hotel',
    emo: '🐾',
    category: 'Casual',
    tagline: 'Ten species, three needs each, never enough keepers',
    description: 'Guests turn up in the lobby with a species, a stay length and a room they would prefer — put ' +
      'a snake in the terrarium and a rabbit in the burrow and their needs drain at a normal rate; put either ' +
      'in the wrong room and everything drains nearly twice as fast and their stay is capped at three stars. ' +
      'Food, play and cleaning each empty on their own clock and each species is fussy about a different one, ' +
      'so a parrot eats and plays constantly while a snake mostly wants a clean tank. Every feed, walk or scrub ' +
      'occupies one keeper for a few seconds, and with two keepers and six rooms the queue is the whole game. ' +
      'Stars are the running average of a guest\'s happiness, not its state at checkout, so a last-second feed ' +
      'will not save a bad stay. Stars pay cash and reputation; reputation unlocks rarer, better-paying species ' +
      'and new rooms, and hitting zero closes the hotel. Night shifts drain slower — use them to catch up.',
    controls: ['Click', '1–8 rooms', 'F / G / C', 'Space'],
    colors: ['#ffc38a', '#c2410c'],
    scoreLabel: 'dollars',
    tags: ['animals', 'time management', 'hotel', 'sim', 'cute'],
    mount: mount
  });
})();
