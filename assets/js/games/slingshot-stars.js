/* Slingshot Stars — fling a comet through gravity wells and collect every star. */
(function () {
  'use strict';
  var W = 800, H = 600, STEP = 1 / 120, GC = 3.4e6, MAXPULL = 130, MAXV = 560;

  /** planets: [x, y, radius, mass] — negative mass repels. */
  var LEVELS = [
    { name: 'First light', comet: [110, 320], planets: [], stars: [[280, 320], [420, 320], [560, 320]], shots: 2 },
    { name: 'Gentle pull', comet: [110, 440], planets: [[420, 190, 28, 1]], stars: [[300, 400], [430, 350], [560, 330]], shots: 2 },
    { name: 'Slingshot', comet: [110, 300], planets: [[420, 300, 32, 1.6]], stars: [[380, 190], [480, 215], [600, 300]], shots: 2 },
    { name: 'Keep out', comet: [110, 300], planets: [[400, 300, 30, -1.2]], stars: [[300, 240], [400, 160], [508, 110]], shots: 2 },
    { name: 'Orbit', comet: [110, 470], planets: [[400, 310, 36, 2.4]], stars: [[374, 469], [468, 392], [495, 325], [489, 252], [460, 194], [420, 151]], shots: 3 },
    { name: 'Binary', comet: [110, 300], planets: [[330, 220, 26, 1], [500, 400, 26, 1]], stars: [[300, 330], [420, 300], [560, 270], [650, 200]], shots: 2 },
    { name: 'Push and pull', comet: [110, 320], planets: [[300, 320, 24, -1], [560, 320, 30, 1.6]], stars: [[300, 200], [300, 440], [640, 240], [640, 400]], shots: 3 },
    { name: 'Corridor', comet: [110, 320], planets: [[380, 150, 30, 1], [380, 490, 30, 1], [620, 320, 26, 1]], stars: [[380, 320], [500, 280], [500, 360], [720, 320]], shots: 2 },
    { name: 'Comet cradle', comet: [110, 520], planets: [[400, 300, 40, 3]], stars: [[560, 300], [400, 140], [240, 300], [400, 460]], shots: 3 },
    { name: 'Pinball', comet: [110, 300], planets: [[350, 300, 28, -1.6], [600, 180, 28, -1.6], [600, 420, 28, -1.6]], stars: [[350, 150], [350, 450], [480, 300], [720, 300]], shots: 3 },
    { name: 'Triple', comet: [110, 320], planets: [[300, 220, 22, .9], [450, 420, 22, .9], [600, 220, 22, .9]], stars: [[300, 320], [450, 320], [600, 320], [380, 120], [520, 520]], shots: 3 },
    { name: 'Black hole', comet: [110, 320], planets: [[420, 320, 18, 4.5]], stars: [[443, 278], [327, 156], [209, 109], [121, 118], [96, 171], [125, 232], [212, 310], [345, 361]], shots: 3 },
    { name: 'Asteroid field', comet: [110, 300], planets: [[260, 180, 20, .8], [420, 420, 24, 1], [560, 200, 22, .9], [680, 440, 20, -.8]], stars: [[340, 300], [480, 300], [620, 320], [700, 200], [560, 520]], shots: 3 },
    { name: 'Grand tour', comet: [80, 540], planets: [[250, 380, 30, 1.4], [520, 220, 34, 2], [700, 460, 26, 1]], stars: [[250, 250], [400, 300], [560, 120], [660, 300], [740, 560], [520, 480]], shots: 4 }
  ];

  /* ------------------------------------------------------------ physics */
  var Sim = {
    make: function (L) {
      return {
        sx: L.comet[0], sy: L.comet[1], x: L.comet[0], y: L.comet[1], vx: 0, vy: 0, flying: false,
        planets: L.planets.map(function (p) { return { x: p[0], y: p[1], r: p[2], m: p[3] }; }),
        stars: L.stars.map(function (s) { return { x: s[0], y: s[1], got: false }; }),
        t: 0, done: null, got: 0, event: null
      };
    },
    reset: function (s) { s.x = s.sx; s.y = s.sy; s.vx = s.vy = 0; s.flying = false; s.done = null; s.t = 0; },
    launch: function (s, vx, vy) { s.vx = vx; s.vy = vy; s.flying = true; s.done = null; s.t = 0; },
    accel: function (s, x, y) {
      var ax = 0, ay = 0;
      for (var i = 0; i < s.planets.length; i++) {
        var p = s.planets[i], dx = p.x - x, dy = p.y - y, r2 = dx * dx + dy * dy, r = Math.sqrt(r2);
        var f = GC * p.m / Math.max(r2, 900);
        ax += f * dx / r; ay += f * dy / r;
      }
      return { x: ax, y: ay };
    },
    step: function (s) {
      if (!s.flying || s.done) return;
      s.event = null;
      var a = Sim.accel(s, s.x, s.y);
      s.vx += a.x * STEP; s.vy += a.y * STEP;
      s.x += s.vx * STEP; s.y += s.vy * STEP;
      s.t += STEP;
      for (var i = 0; i < s.planets.length; i++) {
        var p = s.planets[i];
        if (Math.hypot(p.x - s.x, p.y - s.y) < p.r + 6) { s.done = 'crash'; s.event = 'crash'; s.flying = false; return; }
      }
      for (i = 0; i < s.stars.length; i++) {
        var st = s.stars[i];
        if (!st.got && Math.hypot(st.x - s.x, st.y - s.y) < 19) { st.got = true; s.got++; s.event = 'star'; }
      }
      if (s.got === s.stars.length) { s.done = 'all'; s.event = s.event || 'all'; s.flying = false; return; }
      if (s.x < -150 || s.x > W + 150 || s.y < -150 || s.y > H + 150) { s.done = 'lost'; s.event = 'lost'; s.flying = false; return; }
      if (s.t > 14) { s.done = 'timeout'; s.event = 'timeout'; s.flying = false; }
    }
  };

  /* --------------------------------------------------------------- game */
  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function loadLevel(g, n) {
      var d = g.data;
      d.level = n;
      d.sim = Sim.make(LEVELS[n]);
      d.shots = LEVELS[n].shots;
      d.phase = 'aim';
      d.drag = null; d.pull = { x: 0, y: 0 };
      d.trail = [];
      d.intro = 1.2;
      d.wait = 0;
      d.acc = 0;
      d.attempt = d.attempt || 1;
      g.set('Level', (n + 1) + '/' + LEVELS.length);
      g.set('Stars', '0/' + d.sim.stars.length);
      g.set('Shots', d.shots);
    }

    function reset(g) {
      var d = g.data;
      d.parts = []; d.shake = 0; d.flash = null;
      d.field = [];
      for (var i = 0; i < 120; i++) d.field.push({ x: Math.random() * W, y: Math.random() * H, s: U.rand(.4, 1.6), tw: Math.random() * 6 });
      d.attempt = 1;
      d.totalStars = 0;
      loadLevel(g, 0);
      g.set('Score', 0);
    }

    function burst(d, x, y, col, n, spd) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2, s = U.rand(30, spd || 220);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(.3, .8), max: .8, col: col });
      }
    }

    function launch(g) {
      var d = g.data, s = d.sim;
      var m = Math.hypot(d.pull.x, d.pull.y);
      if (m < 10) { d.drag = null; return; }
      var pow = Math.min(m, MAXPULL) / MAXPULL;
      Sim.launch(s, -d.pull.x / m * pow * MAXV, -d.pull.y / m * pow * MAXV);
      d.phase = 'fly';
      d.shots--;
      g.set('Shots', d.shots);
      d.trail = [];
      d.drag = null;
      burst(d, s.x, s.y, '#67e8f9', 12, 200);
      Milo.sound.tone({ f: 220, f2: 900, d: .25, v: .1, type: 'sawtooth' });
    }

    function endShot(g, why) {
      var d = g.data, s = d.sim;
      if (why === 'all') {
        var pts = s.stars.length * 100 + d.shots * 150 + (d.attempt === 1 ? 100 : 0);
        g.score += pts; g.set('Score', U.fmt(g.score));
        d.totalStars += s.stars.length;
        d.flash = { text: 'All stars! +' + pts, t: 1.6, col: '#fde68a' };
        d.phase = 'clear'; d.wait = 1.7;
        Milo.sound.win();
        return;
      }
      if (why === 'crash') { burst(d, s.x, s.y, '#fb923c', 26, 300); d.shake = 8; Milo.sound.explode(); }
      else if (why === 'lost') Milo.sound.tone({ f: 500, f2: 200, d: .3, v: .07, type: 'triangle' });
      if (d.shots > 0) {
        d.phase = 'return'; d.wait = .8;
      } else {
        d.flash = { text: 'Out of comets — ' + s.got + '/' + s.stars.length + ' stars', t: 1.5, col: '#fca5a5' };
        d.phase = 'retry'; d.wait = 1.6;
        Milo.sound.lose();
      }
    }

    function predict(d) {
      var s = d.sim, m = Math.hypot(d.pull.x, d.pull.y);
      if (m < 10) return [];
      var pow = Math.min(m, MAXPULL) / MAXPULL;
      var p = { x: s.x, y: s.y, vx: -d.pull.x / m * pow * MAXV, vy: -d.pull.y / m * pow * MAXV, planets: s.planets };
      var pts = [];
      for (var i = 0; i < 300; i++) {
        var a = Sim.accel(p, p.x, p.y);
        p.vx += a.x * STEP; p.vy += a.y * STEP; p.x += p.vx * STEP; p.y += p.vy * STEP;
        var hit = false;
        for (var k = 0; k < s.planets.length; k++) if (Math.hypot(s.planets[k].x - p.x, s.planets[k].y - p.y) < s.planets[k].r + 6) hit = true;
        if (i % 5 === 0) pts.push({ x: p.x, y: p.y });
        if (hit || p.x < -60 || p.x > W + 60 || p.y < -60 || p.y > H + 60) break;
      }
      return pts;
    }

    return Milo.arcade(host, {
      id: 'slingshot-stars',
      w: W, h: H, bg: '#050a1e',
      stats: ['Level', 'Stars', 'Shots', 'Score'],
      emo: '☄️',
      start: {
        title: 'Slingshot Stars',
        text: 'Drag back from the comet and release to fling it. Planets bend its path — use them to ' +
          'curve through every star. Red ones push you away. Collect all the stars before your ' +
          'comets run out.',
        keys: ['Drag back and release', 'The dotted line predicts the bend']
      },
      init: reset,
      onPointer: function (g, type, x, y) {
        var d = g.data, s = d.sim;
        if (g.state !== 'play' || d.phase !== 'aim' || d.intro > 0) return;
        if (type === 'down') { d.drag = true; d.pull = { x: 0, y: 0 }; }
        if (d.drag && (type === 'down' || type === 'move')) {
          var dx = x - s.x, dy = y - s.y, m = Math.hypot(dx, dy);
          if (m > MAXPULL) { dx = dx / m * MAXPULL; dy = dy / m * MAXPULL; }
          d.pull = { x: dx, y: dy };
        }
        if (type === 'up' && d.drag) launch(g);
      },

      update: function (g, dt) {
        var d = g.data, s = d.sim;
        if (d.shake > 0) d.shake = Math.max(0, d.shake - dt * 30);
        d.parts = d.parts.filter(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; return p.life > 0; });
        if (d.flash) { d.flash.t -= dt; if (d.flash.t <= 0) d.flash = null; }
        if (d.intro > 0) { d.intro -= dt; return; }

        if (d.phase === 'fly') {
          d.acc += dt;
          var guard = 0;
          while (d.acc >= STEP && guard++ < 10 && d.phase === 'fly') {
            Sim.step(s); d.acc -= STEP;
            if (s.event === 'star') { burst(d, s.x, s.y, '#fde68a', 10, 180); Milo.sound.coin(); g.set('Stars', s.got + '/' + s.stars.length); }
            if (s.done) endShot(g, s.done);
          }
          if (d.phase === 'fly') {
            d.trail.push({ x: s.x, y: s.y });
            if (d.trail.length > 70) d.trail.shift();
            if (Math.random() < .6) d.parts.push({ x: s.x, y: s.y, vx: -s.vx * .1 + U.rand(-20, 20), vy: -s.vy * .1 + U.rand(-20, 20), life: .5, max: .5, col: '#67e8f9' });
          }
        } else if (d.phase === 'return') {
          d.wait -= dt;
          if (d.wait <= 0) { Sim.reset(s); d.trail = []; d.phase = 'aim'; burst(d, s.x, s.y, '#67e8f9', 8, 120); Milo.sound.blip(); }
        } else if (d.phase === 'retry') {
          d.wait -= dt;
          if (d.wait <= 0) { d.attempt++; loadLevel(g, d.level); }
        } else if (d.phase === 'clear') {
          d.wait -= dt;
          if (d.wait <= 0) {
            if (d.level + 1 >= LEVELS.length) {
              g.win({ emo: '☄️', title: 'Galaxy cleared!', text: d.totalStars + ' stars collected across ' + LEVELS.length + ' star fields.', score: g.score });
            } else { d.attempt = 1; loadLevel(g, d.level + 1); }
          }
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, s = d.sim, L = LEVELS[d.level];
        var bg = c.createRadialGradient(W * .7, H * .3, 40, W * .5, H * .5, 700);
        bg.addColorStop(0, '#12183a'); bg.addColorStop(1, '#03060f');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);
        d.field.forEach(function (f) {
          c.globalAlpha = .35 + .35 * Math.sin(g.t * 2 + f.tw);
          c.fillStyle = '#dbeafe'; c.fillRect(f.x, f.y, f.s, f.s);
        });
        c.globalAlpha = 1;

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        s.planets.forEach(function (p, i) {
          var rep = p.m < 0;
          if (rep) {
            c.strokeStyle = 'rgba(248,113,113,' + (.25 + .2 * Math.sin(g.t * 4)) + ')'; c.lineWidth = 2;
            c.beginPath(); c.arc(p.x, p.y, p.r + 14 + Math.sin(g.t * 4) * 4, 0, 7); c.stroke();
          } else {
            c.strokeStyle = 'rgba(148,163,184,.14)'; c.lineWidth = 1;
            c.beginPath(); c.arc(p.x, p.y, p.r * 2.6 * Math.sqrt(Math.abs(p.m)), 0, 7); c.stroke();
          }
          var hue = rep ? 0 : (i * 70 + d.level * 40) % 360;
          var grd = c.createRadialGradient(p.x - p.r * .35, p.y - p.r * .35, p.r * .1, p.x, p.y, p.r);
          grd.addColorStop(0, 'hsl(' + hue + ',70%,' + (rep ? 60 : 68) + '%)'); grd.addColorStop(1, 'hsl(' + hue + ',60%,' + (rep ? 22 : 28) + '%)');
          c.fillStyle = grd; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.fill();
          if (Math.abs(p.m) >= 2) {
            c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 3;
            c.beginPath(); c.ellipse(p.x, p.y, p.r * 1.7, p.r * .45, -.4, 0, 7); c.stroke();
          }
          if (rep) {
            c.fillStyle = '#fecaca'; c.font = '800 14px Outfit, sans-serif'; c.textAlign = 'center';
            c.fillText('−', p.x, p.y + 5);
          }
        });

        s.stars.forEach(function (st) {
          if (st.got) return;
          c.save(); c.translate(st.x, st.y); c.rotate(g.t * 1.5);
          c.fillStyle = '#fde68a'; c.shadowColor = '#fde68a'; c.shadowBlur = 14;
          c.beginPath();
          for (var k = 0; k < 10; k++) { var rr = k % 2 ? 5 : 12, an = k * Math.PI / 5; c.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); }
          c.closePath(); c.fill(); c.shadowBlur = 0; c.restore();
        });

        if (d.trail.length > 1) {
          c.strokeStyle = 'rgba(103,232,249,.4)'; c.lineWidth = 2;
          c.beginPath(); d.trail.forEach(function (p, k) { if (k) c.lineTo(p.x, p.y); else c.moveTo(p.x, p.y); }); c.stroke();
        }
        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max); c.fillStyle = p.col;
          c.beginPath(); c.arc(p.x, p.y, 2.5, 0, 7); c.fill();
        });
        c.globalAlpha = 1;

        // sling + preview
        if (d.phase === 'aim' && d.drag) {
          var hx = s.x + d.pull.x, hy = s.y + d.pull.y;
          c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2;
          c.beginPath(); c.moveTo(s.x, s.y); c.lineTo(hx, hy); c.stroke();
          var pts = predict(d);
          c.fillStyle = '#a5f3fc';
          pts.forEach(function (p, i) { c.globalAlpha = .8 - i / pts.length * .7; c.beginPath(); c.arc(p.x, p.y, 2.6, 0, 7); c.fill(); });
          c.globalAlpha = 1;
        }

        // comet
        if (d.phase === 'aim' || d.phase === 'fly' || d.phase === 'clear') {
          var cx = d.phase === 'aim' && d.drag ? s.x + d.pull.x * .3 : s.x, cy = d.phase === 'aim' && d.drag ? s.y + d.pull.y * .3 : s.y;
          c.fillStyle = '#67e8f9'; c.shadowColor = '#67e8f9'; c.shadowBlur = 18;
          c.beginPath(); c.arc(cx, cy, 8, 0, 7); c.fill(); c.shadowBlur = 0;
          c.fillStyle = '#fff'; c.beginPath(); c.arc(cx - 2, cy - 2, 3, 0, 7); c.fill();
        }
        c.restore();

        // comets left
        for (var k = 0; k < d.shots; k++) {
          c.fillStyle = '#67e8f9'; c.beginPath(); c.arc(30 + k * 22, H - 26, 6, 0, 7); c.fill();
        }
        c.textAlign = 'center';
        if (d.intro > 0) {
          c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(0, H / 2 - 40, W, 80);
          c.fillStyle = '#fff'; c.font = '800 30px Outfit, sans-serif';
          c.fillText('Field ' + (d.level + 1) + ' · ' + L.name + (d.attempt > 1 ? '  (attempt ' + d.attempt + ')' : ''), W / 2, H / 2 + 10);
        } else if (d.phase === 'aim' && !d.drag) {
          c.fillStyle = 'rgba(255,255,255,.55)'; c.font = '600 14px Outfit, sans-serif';
          c.fillText('drag back from the comet · release to fling', W / 2, H - 20);
        }
        if (d.flash) {
          c.globalAlpha = Math.min(1, d.flash.t * 1.5); c.fillStyle = d.flash.col; c.font = '800 30px Outfit, sans-serif';
          c.fillText(d.flash.text, W / 2, 110); c.globalAlpha = 1;
        }
      }
    });
  }

  window.Milo.register({
    id: 'slingshot-stars', title: 'Slingshot Stars', emo: '☄️', category: 'Puzzle',
    tagline: 'Curve a comet through gravity to catch every star',
    description: 'Pull back on the comet and let go; from then on the planets steer. Each one bends ' +
      'your path in proportion to its mass, red planets shove you away, and the dotted preview shows ' +
      'the first couple of seconds of the curve. Fourteen star fields each hand you two to four comets ' +
      'to sweep up every star — collected stars stay collected between shots, but hitting a planet or ' +
      'drifting off the map costs the comet. Clearing a field pays 100 a star, 150 per spare comet and ' +
      '100 for doing it first try. Tip: aim slightly past a planet rather than at the star behind it and ' +
      'let the pull do the turning.',
    controls: ['Drag back and release', 'Touch'],
    colors: ['#12183a', '#67e8f9'],
    tags: ['physics', 'gravity', 'space', 'levels', 'puzzle'],
    _sim: Sim, _levels: LEVELS,
    mount: mount
  });
})();
