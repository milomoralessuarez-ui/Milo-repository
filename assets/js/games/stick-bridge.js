/* Stick Bridge — hold to grow a stick, let go, and hope it reaches. */
(function () {
  'use strict';
  var W = 480, H = 720, FLOOR = H - 200, LEFT = 60, HW = 16, HH = 26, ZONE = 7;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    /** The next pillar: narrower and further away as the score climbs, sometimes drifting. */
    function nextPlat(d, prev) {
      var s = d.score;
      var camX = prev.x - LEFT;
      var w = U.rand(Math.max(22, 90 - s * 2.6), Math.max(36, 112 - s * 1.8));
      var minGap = 56, maxGap = Math.min(300, 120 + s * 11);
      var maxX = camX + W - 22 - w;
      var x = Math.min(prev.x + prev.w + U.rand(minGap, maxGap), maxX);
      var p = { x: x, base: x, w: w, moving: false, amp: 0, ph: Math.random() * 6.28, spd: U.rand(1.2, 2.2), frozen: false };
      if (s >= 4 && Math.random() < Math.min(.4, .06 + s * .025)) {
        var amp = U.rand(16, 36);
        var lo = prev.x + prev.w + minGap + amp, hi = maxX - amp;
        if (hi > lo) { p.moving = true; p.amp = amp; p.base = U.clamp(x, lo, hi); p.x = p.base; }
      }
      return p;
    }

    function reset(g) {
      var d = g.data;
      d.score = 0; d.perfect = 0; d.combo = 0;
      d.plats = [{ x: LEFT, base: LEFT, w: 90, moving: false, amp: 0, frozen: false, ph: 0, spd: 1 }];
      d.plats.push(nextPlat(d, d.plats[0]));
      d.cam = 0; d.camFrom = 0; d.camTo = 0;
      d.hero = { x: LEFT + 90 - HW / 2 - 5, y: FLOOR, vy: 0, step: 0 };
      d.stick = null; d.old = [];
      d.phase = 'idle'; d.t = 0; d.tick = 0;
      d.parts = []; d.floats = []; d.shake = 0;
      d.hills = [];
      for (var i = 0; i < 24; i++) d.hills.push(U.rand(.3, 1));
      d.clouds = [];
      for (i = 0; i < 5; i++) d.clouds.push({ x: Math.random() * W, y: U.rand(80, 260), s: U.rand(.6, 1.3) });
      d.hint = true;
      g.set('Score', 0); g.set('Perfect', 0); g.set('Best', U.fmt(g.best));
    }

    function burst(d, x, y, col, n, spd) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2, s = U.rand(40, spd || 200);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, life: U.rand(.3, .7), max: .7, col: col });
      }
    }
    function float(d, x, y, text, col) { d.floats.push({ x: x, y: y, text: text, life: 1.1, col: col }); }

    function evaluate(g) {
      var d = g.data, p1 = d.plats[1], tip = d.stick.x + d.stick.len;
      var hit = tip >= p1.x && tip <= p1.x + p1.w;
      var perfect = hit && Math.abs(tip - (p1.x + p1.w / 2)) <= ZONE;
      d.hit = hit; d.perf = perfect;
      d.walkTo = hit ? p1.x + p1.w - HW / 2 - 5 : tip + HW / 2 + 2;
      d.phase = 'walk';
      d.shake = 3;
      Milo.sound.tone({ f: 180, f2: 70, d: .14, v: .1, type: 'triangle' });
      Milo.sound.noise(.08, .05, 700);
      if (perfect) {
        burst(d, tip, FLOOR, '#ef4444', 16, 220);
        float(d, tip - d.cam, FLOOR - 40, 'PERFECT', '#ef4444');
        Milo.sound.coin();
      } else if (hit) burst(d, tip, FLOOR, '#1e293b', 6, 90);
    }

    function crossed(g) {
      var d = g.data, p1 = d.plats[1];
      d.score += 1;
      if (d.perf) {
        d.combo++; d.perfect++; d.score += d.combo;
        float(d, p1.x + p1.w / 2 - d.cam, FLOOR - 80, '+' + (1 + d.combo) + (d.combo > 1 ? '  ×' + d.combo : ''), '#f59e0b');
        if (d.combo > 1) Milo.sound.powerup();
      } else d.combo = 0;
      g.score = d.score;
      g.set('Score', d.score); g.set('Perfect', d.perfect);
      Milo.sound.blip();
      d.phase = 'shift'; d.t = 0; d.camFrom = d.cam; d.camTo = p1.x - LEFT;
    }

    function fall(g) {
      var d = g.data;
      d.phase = 'fall'; d.t = 0; d.hero.vy = 0;
      d.stickDrops = d.stick.x + d.stick.len < d.plats[1].x;
      d.shake = 8;
      Milo.sound.explode();
    }

    return Milo.arcade(host, {
      id: 'stick-bridge',
      w: W, h: H, bg: '#bfe9ff',
      stats: ['Score', 'Perfect', 'Best'],
      emo: '🌉',
      start: {
        title: 'Stick Bridge',
        text: 'Hold to grow a stick, release to drop it across the gap. Too short or too long and ' +
          'you walk straight off the end. Hit the red mark for a perfect and a combo bonus.',
        keys: ['Hold Space / click / touch', 'Release to drop']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, h = d.hero, p0 = d.plats[0], p1 = d.plats[1];
        if (d.shake > 0) d.shake = Math.max(0, d.shake - dt * 30);
        d.parts = d.parts.filter(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 900 * dt; p.life -= dt; return p.life > 0; });
        d.floats = d.floats.filter(function (f) { f.y -= 36 * dt; f.life -= dt; return f.life > 0; });
        d.clouds.forEach(function (cl) { cl.x -= 5 * cl.s * dt; if (cl.x < -140) cl.x = W + 140; });
        var holding = g.input.pdown || g.input.down('action');
        if (p1.moving && !p1.frozen) p1.x = p1.base + Math.sin(g.t * p1.spd + p1.ph) * p1.amp;

        if (d.phase === 'idle') {
          if (holding) { d.stick = { x: p0.x + p0.w, len: 0, ang: 0 }; d.phase = 'grow'; d.hint = false; d.tick = 0; }
        } else if (d.phase === 'grow') {
          d.stick.len += (230 + d.stick.len * .35) * dt;
          d.tick += dt;
          if (d.tick > .07) { d.tick = 0; Milo.sound.tone({ f: 260 + Math.min(700, d.stick.len * 1.6), d: .05, v: .035, type: 'square' }); }
          if (!holding || d.stick.len > 900) { d.phase = 'drop'; d.t = 0; p1.frozen = true; }
        } else if (d.phase === 'drop') {
          d.t += dt;
          var k = Math.min(1, d.t / .3);
          d.stick.ang = k * k * Math.PI / 2;
          if (d.t >= .3) { d.stick.ang = Math.PI / 2; evaluate(g); }
        } else if (d.phase === 'walk') {
          h.x += 240 * dt; h.step += dt * 14;
          if (h.x >= d.walkTo) { h.x = d.walkTo; if (d.hit) crossed(g); else fall(g); }
        } else if (d.phase === 'shift') {
          d.t += dt;
          var s = Math.min(1, d.t / .4); s = s * s * (3 - 2 * s);
          d.cam = U.lerp(d.camFrom, d.camTo, s);
          if (d.t >= .4) {
            d.cam = d.camTo;
            d.old.push({ x: d.stick.x, len: d.stick.len });
            d.old = d.old.filter(function (o) { return o.x + o.len > d.cam - 40; });
            d.stick = null;
            d.plats.shift();
            d.plats.push(nextPlat(d, d.plats[0]));
            d.phase = 'idle';
          }
        } else if (d.phase === 'fall') {
          d.t += dt;
          h.y += h.vy * dt; h.vy += 2200 * dt; h.step += dt * 20;
          if (d.stickDrops) d.stick.ang = Math.min(Math.PI, d.stick.ang + 4 * dt);
          if (h.y > H + 60 || d.t > 1.4) {
            g.gameOver({
              emo: '🌉', title: d.stickDrops ? 'Too short!' : 'Too long!',
              text: 'You bridged ' + d.score + ' point' + (d.score === 1 ? '' : 's') + ' worth of gaps with ' + d.perfect + ' perfect drop' + (d.perfect === 1 ? '' : 's') + '.'
            });
          }
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#bfe9ff'); sky.addColorStop(.7, '#fde7d6'); sky.addColorStop(1, '#f7c9a8');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(255,241,204,.95)';
        c.beginPath(); c.arc(W * .78 - d.cam * .02, 150, 46, 0, 7); c.fill();
        c.fillStyle = 'rgba(255,255,255,.8)';
        d.clouds.forEach(function (cl) {
          var x = cl.x - d.cam * .05;
          c.beginPath();
          c.arc(x, cl.y, 22 * cl.s, 0, 7); c.arc(x + 24 * cl.s, cl.y + 6, 17 * cl.s, 0, 7); c.arc(x - 22 * cl.s, cl.y + 7, 14 * cl.s, 0, 7);
          c.fill();
        });

        function hills(par, base, col, amp) {
          c.fillStyle = col;
          c.beginPath(); c.moveTo(0, H);
          var off = d.cam * par;
          for (var x = -40; x <= W + 40; x += 40) {
            var i = Math.floor((x + off) / 40);
            var hh = d.hills[((i % 24) + 24) % 24];
            c.lineTo(x, base - hh * amp - Math.sin((x + off) * .013) * 10);
          }
          c.lineTo(W, H); c.closePath(); c.fill();
        }
        hills(.12, FLOOR + 40, 'rgba(147,112,190,.35)', 130);
        hills(.28, FLOOR + 80, 'rgba(99,70,150,.45)', 80);

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));
        c.translate(-d.cam, 0);

        c.strokeStyle = '#0f172a'; c.lineWidth = 4; c.lineCap = 'round';
        d.old.forEach(function (o) { c.beginPath(); c.moveTo(o.x, FLOOR); c.lineTo(o.x + o.len, FLOOR); c.stroke(); });

        d.plats.forEach(function (p, i) {
          c.fillStyle = '#0f172a';
          c.fillRect(p.x, FLOOR, p.w, H - FLOOR);
          if (i === 1 || d.phase === 'idle') {
            c.fillStyle = '#ef4444';
            c.fillRect(p.x + p.w / 2 - ZONE, FLOOR, ZONE * 2, 4);
          }
          if (p.moving && !p.frozen) {
            c.fillStyle = 'rgba(15,23,42,.35)';
            c.font = '800 12px Outfit, sans-serif'; c.textAlign = 'center';
            c.fillText('◀ ▶', p.x + p.w / 2, FLOOR + 22);
          }
        });

        if (d.stick) {
          var st = d.stick;
          c.strokeStyle = '#0f172a'; c.lineWidth = 4;
          c.beginPath(); c.moveTo(st.x, FLOOR);
          c.lineTo(st.x + st.len * Math.sin(st.ang), FLOOR - st.len * Math.cos(st.ang)); c.stroke();
        }

        drawHero(c, d);

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max); c.fillStyle = p.col;
          c.fillRect(p.x - 3, p.y - 3, 6, 6);
        });
        c.globalAlpha = 1;
        c.restore();

        c.fillStyle = 'rgba(15,23,42,.85)'; c.font = '800 56px Outfit, sans-serif'; c.textAlign = 'center';
        c.fillText(d.score, W / 2, 150);
        if (d.combo > 1 && d.phase !== 'fall') {
          c.fillStyle = '#ef4444'; c.font = '800 18px Outfit, sans-serif';
          c.fillText('PERFECT ×' + d.combo, W / 2, 180);
        }
        if (d.hint) {
          c.fillStyle = 'rgba(15,23,42,.55)'; c.font = '600 16px Outfit, sans-serif';
          c.fillText('hold to grow · release to drop', W / 2, H - 60);
        }
        d.floats.forEach(function (f) {
          c.globalAlpha = Math.min(1, f.life);
          c.fillStyle = f.col; c.font = '800 22px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText(f.text, f.x, f.y);
        });
        c.globalAlpha = 1;
      }
    });

    function drawHero(c, d) {
      var h = d.hero, x = h.x, y = h.y;
      var walking = d.phase === 'walk' || d.phase === 'fall';
      var leg = walking ? Math.sin(h.step) * 4 : 0;
      var flut = Math.sin(d.t * 18 + h.step) * 3;
      c.fillStyle = '#0f172a';
      c.fillRect(x - 7 + leg, y - 6, 6, 6);
      c.fillRect(x + 1 - leg, y - 6, 6, 6);
      U.roundRect(c, x - HW / 2, y - HH, HW, HH - 4, 5); c.fill();
      c.beginPath(); c.arc(x, y - HH - 2, 5, 0, 7); c.fill();
      c.fillStyle = '#ef4444';
      c.fillRect(x - HW / 2, y - HH + 12, HW, 4);
      c.beginPath();
      c.moveTo(x - HW / 2, y - HH + 12); c.lineTo(x - HW / 2 - 13 - Math.abs(flut), y - HH + 9 + flut); c.lineTo(x - HW / 2, y - HH + 16);
      c.closePath(); c.fill();
      c.fillStyle = '#fff';
      c.beginPath(); c.arc(x + 4, y - HH + 7, 3, 0, 7); c.fill();
      c.fillStyle = '#0f172a';
      c.beginPath(); c.arc(x + 5, y - HH + 7, 1.4, 0, 7); c.fill();
    }
  }

  window.Milo.register({
    id: 'stick-bridge', title: 'Stick Bridge', emo: '🌉', category: 'Casual',
    tagline: 'Grow the stick, drop it, pray it reaches',
    description: 'Hold to grow a stick straight up, let go and it topples across the gap. Land the tip ' +
      'on the next pillar and your hero walks over; miss short and the stick drops into the void, ' +
      'miss long and he walks right off the end. The red centre mark is a perfect drop worth a growing ' +
      'combo bonus, pillars get thinner and further apart as you go, and from the fifth or so some ' +
      'of them drift sideways until the moment you release. Tip: watch the tip of the stick, not the ' +
      'base — you are judging where it lands, not how tall it is.',
    controls: ['Hold Space', 'Hold click', 'Hold touch'],
    colors: ['#bfe9ff', '#0f172a'],
    tags: ['one button', 'timing', 'endless', 'physics', 'hyper-casual'],
    mount: mount
  });
})();
