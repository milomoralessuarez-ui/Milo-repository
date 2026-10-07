/* Paper Planes — sling a dart down the hallway and keep it up on other people's air. */
(function () {
  'use strict';
  var W = 780, H = 520;
  var GY = 470, THROWS = 5;

  var FOLDS = [
    { k: 'power', name: 'Nose Fold', emo: '📐', desc: '+ launch speed' },
    { k: 'glide', name: 'Wing Fold', emo: '🪽', desc: '+ glide, slower sink' },
    { k: 'light', name: 'Thin Stock', emo: '📄', desc: '- weight' },
    { k: 'steady', name: 'Tail Fold', emo: '🎏', desc: '+ gust control' },
    { k: 'lucky', name: 'Gold Leaf', emo: '✨', desc: '+ star value' }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.throw = 1;
      d.up = { power: 0, glide: 0, light: 0, steady: 0, lucky: 0 };
      d.total = 0;
      d.bestThrow = 0;
      d.stars = 0;
      d.parts = [];
      d.shake = 0;
      d.banner = null;
      d.cards = null;
      g.score = 0;
      g.set('Score', 0);
      g.set('Throw', '1/' + THROWS);
      g.set('Metres', 0);
      newThrow(d);
    }

    function newThrow(d) {
      d.plane = { x: 60, y: 300, vx: 0, vy: 0, a: -0.35, dead: false, chop: 0 };
      d.phase = 'aim';
      d.aim = null;
      d.objs = [];
      d.gen = 0;
      d.dist = 0;
      d.flyT = 0;
      d.trail = [];
      d.camX = 0; d.camY = 40;
      generate(d, 2400);
    }

    /** Lay out obstacles ahead of the plane in 320px slots. */
    function generate(d, upto) {
      while (d.gen < upto) {
        d.gen += U.rand(260, 380);
        var x = d.gen, roll = Math.random();
        var hard = Math.min(1, x / 6000);
        if (roll < .28) {
          d.objs.push({ t: 'fan', x: x, w: 64, p: U.rand(320, 520) });
        } else if (roll < .52) {
          d.objs.push({
            t: 'gust', x: x, w: U.rand(180, 300), y: U.rand(-40, 300), h: U.rand(90, 150),
            dir: Math.random() < .62 ? 1 : -1, p: U.rand(90, 190)
          });
        } else if (roll < .52 + .26 * (0.4 + hard)) {
          d.objs.push({ t: 'cfan', x: x, y: U.rand(-220, 260), r: U.rand(34, 50), rot: Math.random() * 6 });
        }
        var n = U.randInt(1, 3);
        for (var i = 0; i < n; i++) {
          d.objs.push({ t: 'star', x: x + U.rand(-90, 90), y: U.rand(-300, 380), got: false });
        }
      }
    }

    function launch(d) {
      var a = d.aim;
      var dx = a.sx - a.x, dy = a.sy - a.y;
      var len = Math.hypot(dx, dy);
      if (len < 12) { d.aim = null; return; }
      var pw = Math.min(len, 150) / 150;
      var sp = 300 + pw * (330 + d.up.power * 78);
      var ang = Math.atan2(dy, dx);
      d.plane.vx = Math.cos(ang) * sp;
      d.plane.vy = Math.sin(ang) * sp;
      d.plane.a = ang;
      d.phase = 'fly';
      d.aim = null;
      Milo.sound.tone({ f: 260, f2: 720, d: .16, v: .07, type: 'triangle' });
    }

    function land(g, reason) {
      var d = g.data;
      if (d.phase !== 'fly') return;
      d.phase = 'landed';
      d.landT = 1.1;
      d.reason = reason;
      var m = Math.round(d.dist);
      d.total += m;
      if (m > d.bestThrow) d.bestThrow = m;
      g.score = d.total + d.stars * (12 + d.up.lucky * 8);
      g.set('Score', U.fmt(g.score));
      if (reason === 'chop') Milo.sound.explode(); else Milo.sound.hit();
      for (var i = 0; i < 16; i++) {
        d.parts.push({
          x: d.plane.x, y: d.plane.y, vx: U.rand(-110, 110), vy: U.rand(-160, 20),
          life: .7, max: .7, col: reason === 'chop' ? '#f8fafc' : '#dbe6f5'
        });
      }
    }

    function offerFolds(d) {
      var pool = U.shuffle(FOLDS.slice());
      d.cards = pool.slice(0, 3).map(function (f, i) {
        return { f: f, x: W / 2 - 300 + i * 200, y: H / 2 - 60, w: 176, h: 148 };
      });
      d.phase = 'shop';
    }

    function takeFold(g, card) {
      var d = g.data;
      d.up[card.f.k]++;
      Milo.sound.powerup();
      d.cards = null;
      d.throw++;
      if (d.throw > THROWS) {
        g.gameOver({
          emo: '✈️', title: 'Out of paper',
          text: d.total + ' m over ' + THROWS + ' throws, best single flight ' + d.bestThrow +
            ' m, ' + d.stars + ' stars picked up.'
        });
        return;
      }
      g.set('Throw', d.throw + '/' + THROWS);
      newThrow(d);
    }

    return Milo.arcade(host, {
      id: 'paper-planes',
      w: W, h: H, bg: '#8fd2f2',
      stats: ['Score', 'Throw', 'Metres'],
      touchButtons: [{ key: 'action', label: 'DIVE' }],
      emo: '✈️',
      start: {
        title: 'Paper Planes',
        text: 'Drag back from the dart and let go — the further you pull, the harder the throw. ' +
          'In the air, hold to dive for speed and release to glide. Floor fans lift you, gusts ' +
          'shove you about and ceiling fans shred you. Five throws, and a fold to add between each.',
        keys: ['Drag to throw', 'Hold to dive', 'Space']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        var d = g.data;
        if (d.phase === 'aim') {
          if (type === 'down') d.aim = { sx: x, sy: y, x: x, y: y };
          else if (type === 'move' && d.aim) { d.aim.x = x; d.aim.y = y; }
          else if (type === 'up' && d.aim) launch(d);
        } else if (d.phase === 'shop' && type === 'down' && d.cards) {
          for (var i = 0; i < d.cards.length; i++) {
            var cd = d.cards[i];
            if (x > cd.x && x < cd.x + cd.w && y > cd.y && y < cd.y + cd.h) { takeFold(g, cd); return; }
          }
        }
      },

      update: function (g, dt) {
        var d = g.data, p = d.plane;
        if (d.shake > 0) d.shake = Math.max(0, d.shake - dt * 32);
        if (d.banner) { d.banner.t -= dt; if (d.banner.t <= 0) d.banner = null; }
        d.parts = d.parts.filter(function (q) {
          q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 340 * dt; q.life -= dt;
          return q.life > 0;
        });
        d.objs.forEach(function (o) { if (o.t === 'cfan') o.rot += 9 * dt; });

        if (d.phase === 'landed') {
          d.landT -= dt;
          if (d.landT <= 0) offerFolds(d);
          return;
        }
        if (d.phase !== 'fly') return;

        d.flyT += dt;
        if (d.flyT > 45) { land(g, 'ground'); return; }
        var diving = g.input.down('action') || g.input.pdown;
        var grav = 640 - d.up.light * 52;
        var glide = 1.45 + d.up.glide * 0.26;

        p.vy += grav * dt;
        if (p.vy > 0) {
          var sink = p.vy * glide * dt;
          p.vy -= sink;
          p.vx += sink * 0.55;           // trade height for distance
        }
        if (diving) { p.vy += 460 * dt; p.vx += 70 * dt; }
        p.vx *= Math.pow(0.86, dt);
        p.vy *= Math.pow(0.92, dt);

        // world effects
        for (var i = 0; i < d.objs.length; i++) {
          var o = d.objs[i];
          if (o.t === 'fan') {
            if (p.x > o.x - o.w && p.x < o.x + o.w && p.y > GY - 340) {
              p.vy -= o.p * dt * 3.2;
            }
          } else if (o.t === 'gust') {
            if (p.x > o.x && p.x < o.x + o.w && p.y > o.y && p.y < o.y + o.h) {
              var res = 1 - Math.min(.6, d.up.steady * .14);
              p.vx += o.dir * o.p * dt * 3 * (o.dir > 0 ? 1 : res);
              p.vy += Math.sin(g.t * 6 + o.x) * 40 * dt * res;
            }
          } else if (o.t === 'cfan') {
            if (U.dist(p.x, p.y, o.x, o.y) < o.r + 8) {
              d.shake = 14;
              p.vy = 420; p.vx *= .3;
              land(g, 'chop');
              return;
            }
          } else if (o.t === 'star' && !o.got) {
            if (U.dist(p.x, p.y, o.x, o.y) < 26) {
              o.got = true;
              d.stars++;
              Milo.sound.coin();
              for (var k = 0; k < 7; k++) {
                d.parts.push({ x: o.x, y: o.y, vx: U.rand(-90, 90), vy: U.rand(-90, 90),
                  life: .5, max: .5, col: '#ffd257' });
              }
            }
          }
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < 40) { p.x = 40; p.vx = Math.abs(p.vx) * .3; }
        p.a = U.lerp(p.a, Math.atan2(p.vy, p.vx), Math.min(1, 7 * dt));

        d.trail.push({ x: p.x, y: p.y });
        if (d.trail.length > 46) d.trail.shift();

        d.dist = Math.max(d.dist, (p.x - 60) / 10);
        g.set('Metres', Math.round(d.dist));
        generate(d, p.x + 2600);

        if (p.y > GY - 8) {
          p.y = GY - 8;
          land(g, 'ground');
          return;
        }
        if (p.y < -2200) { p.y = -2200; p.vy = 60; }
        if (Math.abs(p.vx) < 26 && p.vy < 40 && p.y < GY - 40) {
          // stalled dead in the air — let gravity finish the job
          p.vy += 120 * dt;
        }

        d.camX = p.x - 250;
        d.camY = Math.min(80, p.y - H * 0.5);
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, p = d.plane;
        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#4fa8dc'); sky.addColorStop(.55, '#9fdcf5'); sky.addColorStop(1, '#dff3fb');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);

        // parallax clouds, drawn in screen space so they wrap forever
        var span = W + 320;
        for (var i = 0; i < 7; i++) {
          var cxp = (((i * 168 - d.camX * 0.22) % span) + span) % span - 160;
          var cyp = 40 + (i % 4) * 110 - d.camY * 0.22 + Math.sin(i * 2.1) * 26;
          cyp = ((cyp % (H + 200)) + (H + 200)) % (H + 200) - 100;
          c.fillStyle = 'rgba(255,255,255,.5)';
          c.beginPath();
          c.ellipse(cxp, cyp, 78, 28, 0, 0, 7);
          c.ellipse(cxp + 52, cyp + 8, 54, 22, 0, 0, 7);
          c.fill();
        }

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));
        c.translate(-d.camX, -d.camY);

        // ground
        c.fillStyle = '#5fae6a';
        c.fillRect(d.camX - 100, GY, W + 200, H + 400);
        c.fillStyle = '#4b9459';
        for (var gx = Math.floor((d.camX - 100) / 40) * 40; gx < d.camX + W + 100; gx += 40) {
          c.fillRect(gx, GY, 20, 7);
        }
        c.fillStyle = 'rgba(255,255,255,.35)';
        c.fillRect(d.camX - 100, GY, W + 200, 3);

        // distance markers
        c.font = '700 12px Outfit, system-ui, sans-serif';
        c.textAlign = 'center';
        for (var m = 0; m < 400; m++) {
          var mx = 60 + m * 500;
          if (mx < d.camX - 80 || mx > d.camX + W + 80) continue;
          c.fillStyle = 'rgba(255,255,255,.7)';
          c.fillRect(mx, GY - 34, 3, 34);
          c.fillStyle = '#2b4a36';
          c.fillText((m * 50) + 'm', mx + 2, GY - 40);
        }

        d.objs.forEach(function (o) {
          if (o.x < d.camX - 200 || o.x > d.camX + W + 200) return;
          if (o.t === 'fan') {
            c.fillStyle = 'rgba(255,255,255,.28)';
            for (var s = 0; s < 6; s++) {
              var yy = GY - 40 - ((g.t * 190 + s * 58) % 330);
              c.fillRect(o.x - 22 + (s % 3) * 20, yy, 5, 22);
            }
            c.fillStyle = '#3f4a5c';
            U.roundRect(c, o.x - 26, GY - 52, 52, 52, 8); c.fill();
            c.fillStyle = '#9fb4d8';
            c.beginPath(); c.arc(o.x, GY - 30, 19, 0, 7); c.fill();
            c.strokeStyle = '#3f4a5c'; c.lineWidth = 3;
            for (var b = 0; b < 3; b++) {
              var aa = g.t * 12 + b * 2.09;
              c.beginPath(); c.moveTo(o.x, GY - 30);
              c.lineTo(o.x + Math.cos(aa) * 17, GY - 30 + Math.sin(aa) * 17);
              c.stroke();
            }
          } else if (o.t === 'gust') {
            c.fillStyle = o.dir > 0 ? 'rgba(120,220,255,.24)' : 'rgba(255,150,150,.24)';
            U.roundRect(c, o.x, o.y, o.w, o.h, 14); c.fill();
            c.strokeStyle = o.dir > 0 ? 'rgba(255,255,255,.75)' : 'rgba(255,190,190,.85)';
            c.lineWidth = 3; c.lineCap = 'round';
            for (var k = 0; k < 4; k++) {
              var ly = o.y + 18 + k * (o.h - 36) / 3;
              var off = ((g.t * 150 * o.dir) % o.w + o.w) % o.w;
              c.beginPath();
              c.moveTo(o.x + off, ly);
              c.lineTo(o.x + Math.max(6, Math.min(o.w, off + 40 * o.dir)), ly);
              c.stroke();
            }
          } else if (o.t === 'cfan') {
            c.strokeStyle = '#6b7280'; c.lineWidth = 4;
            c.beginPath(); c.moveTo(o.x, o.y - o.r - 40); c.lineTo(o.x, o.y); c.stroke();
            c.save();
            c.translate(o.x, o.y); c.rotate(o.rot);
            c.fillStyle = 'rgba(70,80,100,.85)';
            for (var f = 0; f < 4; f++) {
              c.save(); c.rotate(f * 1.5708);
              c.beginPath();
              c.moveTo(0, 0); c.lineTo(o.r, -9); c.lineTo(o.r, 9);
              c.closePath(); c.fill();
              c.restore();
            }
            c.fillStyle = '#374151';
            c.beginPath(); c.arc(0, 0, 8, 0, 7); c.fill();
            c.restore();
            c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 2;
            c.beginPath(); c.arc(o.x, o.y, o.r + 6, 0, 7); c.stroke();
          } else if (o.t === 'star' && !o.got) {
            c.save();
            c.translate(o.x, o.y + Math.sin(g.t * 3 + o.x) * 5);
            c.rotate(g.t * 1.4);
            c.fillStyle = '#ffd257';
            c.beginPath();
            for (var v = 0; v < 10; v++) {
              var rr = v % 2 ? 5 : 12, av = v * Math.PI / 5 - Math.PI / 2;
              c.lineTo(Math.cos(av) * rr, Math.sin(av) * rr);
            }
            c.closePath(); c.fill();
            c.restore();
          }
        });

        // trail
        c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 2;
        c.beginPath();
        d.trail.forEach(function (t, i) { i ? c.lineTo(t.x, t.y) : c.moveTo(t.x, t.y); });
        c.stroke();

        d.parts.forEach(function (q) {
          c.globalAlpha = Math.max(0, q.life / q.max);
          c.fillStyle = q.col;
          c.fillRect(q.x - 3, q.y - 3, 6, 6);
        });
        c.globalAlpha = 1;

        // the dart
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.a);
        c.fillStyle = 'rgba(0,0,0,.14)';
        c.beginPath(); c.moveTo(24, 2); c.lineTo(-16, -11); c.lineTo(-9, 2); c.lineTo(-16, 13); c.closePath(); c.fill();
        c.fillStyle = '#ffffff';
        c.beginPath(); c.moveTo(24, 0); c.lineTo(-16, -12); c.lineTo(-9, 0); c.lineTo(-16, 12); c.closePath(); c.fill();
        c.fillStyle = '#c9d6e8';
        c.beginPath(); c.moveTo(24, 0); c.lineTo(-16, 12); c.lineTo(-9, 0); c.closePath(); c.fill();
        c.strokeStyle = '#8ea3bd'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(24, 0); c.lineTo(-13, 0); c.stroke();
        c.restore();

        // slingshot band while aiming
        if (d.phase === 'aim' && d.aim) {
          c.strokeStyle = 'rgba(30,40,60,.6)'; c.lineWidth = 3;
          c.setLineDash([7, 6]);
          c.beginPath();
          c.moveTo(p.x, p.y);
          c.lineTo(p.x + (d.aim.x - d.aim.sx), p.y + (d.aim.y - d.aim.sy));
          c.stroke();
          c.setLineDash([]);
          var dx = d.aim.sx - d.aim.x, dy = d.aim.sy - d.aim.y;
          var len = Math.min(Math.hypot(dx, dy), 150), ang = Math.atan2(dy, dx);
          c.strokeStyle = '#ef4444'; c.lineWidth = 4;
          c.beginPath();
          c.moveTo(p.x, p.y);
          c.lineTo(p.x + Math.cos(ang) * len, p.y + Math.sin(ang) * len);
          c.stroke();
        }

        c.restore();

        // HUD overlays
        c.textAlign = 'left';
        c.fillStyle = 'rgba(12,30,45,.72)';
        c.font = '800 15px Outfit, system-ui, sans-serif';
        var folds = [];
        for (var key in d.up) if (d.up[key]) folds.push(key + ' ×' + d.up[key]);
        if (folds.length) c.fillText('Folds: ' + folds.join('  '), 16, H - 14);
        c.textAlign = 'right';
        c.fillText('⭐ ' + d.stars + '   best flight ' + d.bestThrow + ' m', W - 16, H - 14);

        if (d.phase === 'aim') {
          c.textAlign = 'center';
          c.fillStyle = 'rgba(12,30,45,.8)';
          c.font = '800 20px Outfit, system-ui, sans-serif';
          c.fillText('Drag back and release — throw ' + d.throw + ' of ' + THROWS, W / 2, 60);
        }

        if (d.phase === 'landed') {
          c.textAlign = 'center';
          c.fillStyle = 'rgba(12,30,45,.85)';
          c.font = '800 30px Outfit, system-ui, sans-serif';
          c.fillText(Math.round(d.dist) + ' m' + (d.reason === 'chop' ? ' — shredded!' : ''), W / 2, 88);
        }

        if (d.phase === 'shop' && d.cards) {
          c.fillStyle = 'rgba(8,24,40,.55)';
          c.fillRect(0, 0, W, H);
          c.textAlign = 'center';
          c.fillStyle = '#ffffff';
          c.font = '800 24px Outfit, system-ui, sans-serif';
          c.fillText('Add one fold before throw ' + (d.throw + 1), W / 2, H / 2 - 100);
          d.cards.forEach(function (cd) {
            c.fillStyle = '#f8fbff';
            U.roundRect(c, cd.x, cd.y, cd.w, cd.h, 14); c.fill();
            c.fillStyle = '#0b2438';
            c.font = '34px serif';
            c.fillText(cd.f.emo, cd.x + cd.w / 2, cd.y + 52);
            c.font = '800 17px Outfit, system-ui, sans-serif';
            c.fillText(cd.f.name, cd.x + cd.w / 2, cd.y + 88);
            c.fillStyle = '#41637d';
            c.font = '600 13px Outfit, system-ui, sans-serif';
            c.fillText(cd.f.desc, cd.x + cd.w / 2, cd.y + 112);
            c.fillStyle = '#0ea5e9';
            c.font = '700 12px Outfit, system-ui, sans-serif';
            c.fillText('now ×' + d.up[cd.f.k], cd.x + cd.w / 2, cd.y + 133);
          });
        }
      }
    });
  }

  window.Milo.register({
    id: 'paper-planes', title: 'Paper Planes', emo: '✈️', category: 'Casual',
    tagline: 'Five throws down a very long corridor',
    description: 'Pull the dart back like a slingshot and let it go, then hold to dive when you ' +
      'need speed and let go to stretch the glide — height is the fuel you spend on distance. ' +
      'Floor fans throw you back up, blue gusts shove you along, red ones fight you, and the ' +
      'ceiling fans turn the whole thing into confetti. Between each of your five throws you fold ' +
      'the plane once more: a thinner stock, a longer wing, a steadier tail.',
    controls: ['Drag', 'Hold to dive', 'Space'],
    colors: ['#8fd2f2', '#ffffff'],
    tags: ['distance', 'flying', 'upgrades', 'drag', 'one more go'],
    mount: mount
  });
})();
