/* Frost Peak — climb icy ledges up a mountain while blizzard gusts shove you about. */
(function () {
  'use strict';
  var W = 480, H = 720, WALL = 26;
  var PW = 22, PH = 30;
  var JUMP_V = -640, G_RISE = 1700, G_CUT = 3600, G_FALL = 2300, MAXFALL = 900;
  var COYOTE = .1, BUFFER = .12, RUN = 250;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.p = {
        x: W / 2, y: H - 120 - PH, vx: 0, vy: 0, ground: null, coyote: 0, buffer: 0,
        face: 1, squash: 1, scarf: []
      };
      d.ledges = [{ x: WALL, y: H - 120, w: W - WALL * 2, ice: false, base: true }];
      d.nextY = H - 210;
      d.lastX = W / 2;
      d.camY = 0;
      d.alt = 0;
      d.fogY = H + 260;
      d.parts = [];
      d.flakes = [];
      for (var i = 0; i < 70; i++) d.flakes.push({ x: Math.random() * W, y: Math.random() * H, s: U.rand(.6, 1.6), v: U.rand(30, 80) });
      d.gust = null;
      d.gustIn = U.rand(7, 11);
      d.shake = 0;
      d.over = false;
      d.stars = [];
      for (i = 0; i < 60; i++) d.stars.push({ x: Math.random() * W, y: Math.random() * H, a: Math.random() });
      seed(d);
      g.set('Altitude', '0m');
      g.set('Best', g.best ? U.fmt(g.best) + 'm' : '—');
    }

    function seed(d) {
      while (d.nextY > d.camY - 400) {
        var diff = Math.min(1, d.alt / 900);
        var w = U.rand(110, 150) - diff * 60;
        var reach = 150 + (1 - diff) * 40;
        var cx = U.clamp(d.lastX + U.rand(-reach, reach), WALL + w / 2 + 6, W - WALL - w / 2 - 6);
        d.ledges.push({ x: cx - w / 2, y: d.nextY, w: w, ice: Math.random() < .22 + diff * .5, t: Math.random() * 7 });
        d.lastX = cx;
        d.nextY -= U.rand(72, 100) + diff * 24;
      }
    }

    function burst(d, x, y, col, n, spd, up) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2, s = U.rand(20, spd);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (up || 0), life: U.rand(.3, .6), max: .6, col: col, r: U.rand(1.5, 3) });
      }
    }

    function die(g, why) {
      var d = g.data;
      if (d.over) return;
      d.over = true;
      d.shake = 8;
      burst(d, d.p.x, d.p.y + PH / 2, '#ff8a8a', 26, 260, 80);
      Milo.sound.explode();
      g.gameOver({ emo: '🏔️', title: why, text: 'You reached ' + U.fmt(d.alt) + ' metres up Frost Peak.', score: d.alt });
    }

    return Milo.arcade(host, {
      id: 'frost-peak',
      w: W, h: H, bg: '#0a1230',
      stats: ['Altitude', 'Best'],
      touch: 'dpad',
      touchButtons: [{ key: 'action', label: 'JUMP' }],
      emo: '🏔️',
      start: {
        title: 'Frost Peak',
        text: 'Climb the ledges. Grey rock grips; blue ice does not, so momentum carries you ' +
          'right off the end. When the wind picks up, a gust is coming — brace on rock or ' +
          'lean into it. The whiteout below never stops rising.',
        keys: ['← → move', 'Space / ↑ jump', 'Short tap = short hop']
      },
      init: reset,
      onPointer: function (g, type, x, y) {
        var d = g.data;
        if (type === 'up') { d.lean = 0; return; }
        if (type === 'down' && y < H * .45) { d.tapJump = true; return; }
        d.lean = x < W / 2 ? -1 : 1;
      },

      update: function (g, dt) {
        var d = g.data, p = d.p, inp = g.input, i;
        d.shake = Math.max(0, d.shake - dt * 30);
        for (i = d.parts.length - 1; i >= 0; i--) {
          var pt = d.parts[i];
          pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 400 * dt; pt.life -= dt;
          if (pt.life <= 0) d.parts.splice(i, 1);
        }
        d.flakes.forEach(function (f) {
          var wind = d.gust && d.gust.phase === 'blow' ? d.gust.dir * 700 : (d.gust ? d.gust.dir * 120 : 0);
          f.y += f.v * f.s * dt; f.x += (Math.sin(g.t * 1.3 + f.y * .02) * 18 + wind * f.s) * dt;
          if (f.y > H) { f.y = -6; f.x = Math.random() * W; }
          if (f.x < -10) f.x = W + 8; if (f.x > W + 10) f.x = -8;
        });
        if (d.over) return;

        // --- gusts -----------------------------------------------------------------
        var diff = Math.min(1, d.alt / 900);
        if (!d.gust) {
          d.gustIn -= dt;
          if (d.gustIn <= 0) {
            d.gust = { phase: 'warn', t: 1.3, dir: Math.random() < .5 ? -1 : 1 };
            Milo.sound.tone({ f: 200, f2: 420, d: 1.1, v: .05, type: 'sawtooth' });
          }
        } else {
          d.gust.t -= dt;
          if (d.gust.phase === 'warn' && d.gust.t <= 0) {
            d.gust.phase = 'blow'; d.gust.t = 1.6 + diff * .6;
            Milo.sound.noise(1.2, .12, 600);
          } else if (d.gust.phase === 'blow' && d.gust.t <= 0) {
            d.gust = null; d.gustIn = U.rand(9, 13) - diff * 5;
          }
        }

        // --- input ---------------------------------------------------------------------
        var move = (inp.down('right') ? 1 : 0) - (inp.down('left') ? 1 : 0);
        if (!move && d.lean) move = d.lean;
        var jumpPressed = inp.pressed('action') || inp.pressed('up') || inp.pressed('a') || d.tapJump;
        var jumpHeld = inp.down('action') || inp.down('up') || inp.down('a') || inp.pdown;
        d.tapJump = false;
        if (move) p.face = move;

        var onIce = p.ground && p.ground.ice, onRock = p.ground && !p.ground.ice;
        var accel = onRock ? 3000 : onIce ? 520 : 1300;
        var drag = onRock ? .0004 : onIce ? .55 : .25;
        if (move) {
          if (onIce && Math.abs(p.vx) > 40 && Math.sign(p.vx) !== move) accel = 380; // turning on ice is slow
          p.vx += move * accel * dt;
          if (Math.abs(p.vx) > RUN + (onIce ? 120 : 0)) p.vx = Math.sign(p.vx) * (RUN + (onIce ? 120 : 0));
        } else p.vx *= Math.pow(drag, dt);
        if (Math.abs(p.vx) < 1) p.vx = 0;
        if (d.gust && d.gust.phase === 'blow') {
          var force = onRock ? 140 : onIce ? 520 : 780;
          p.vx += d.gust.dir * force * dt;
        }

        p.coyote = p.ground ? COYOTE : p.coyote - dt;
        p.buffer = jumpPressed ? BUFFER : p.buffer - dt;
        if (p.buffer > 0 && p.coyote > 0) {
          p.vy = JUMP_V; p.coyote = 0; p.buffer = 0; p.ground = null; p.squash = .72;
          burst(d, p.x, p.y + PH, '#e6f2ff', 6, 60, 20);
          Milo.sound.tone({ f: 340, f2: 800, d: .1, v: .06, type: 'square' });
        }
        var grav = p.vy < 0 ? (jumpHeld ? G_RISE : G_CUT) : G_FALL;
        if (Math.abs(p.vy) < 80 && !p.ground) grav *= .55;
        p.vy = Math.min(p.vy + grav * dt, MAXFALL);

        var prevBottom = p.y + PH;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x - PW / 2 < WALL) { p.x = WALL + PW / 2; if (p.vx < 0) p.vx = -p.vx * .3; }
        if (p.x + PW / 2 > W - WALL) { p.x = W - WALL - PW / 2; if (p.vx > 0) p.vx = -p.vx * .3; }

        // one-way ledges: land only when coming down across the top edge
        var landed = null;
        if (p.vy >= 0) {
          for (i = 0; i < d.ledges.length; i++) {
            var L = d.ledges[i];
            if (p.x + PW / 2 - 4 < L.x || p.x - PW / 2 + 4 > L.x + L.w) continue;
            if (prevBottom <= L.y + .5 && p.y + PH >= L.y) { landed = L; break; }
          }
        }
        if (landed) {
          if (!p.ground) {
            p.squash = p.vy > 600 ? 1.4 : 1.18;
            burst(d, p.x, landed.y, landed.ice ? '#bfe9ff' : '#d9d9e6', 5, 70, 30);
            Milo.sound.tone({ f: landed.ice ? 700 : 200, f2: landed.ice ? 900 : 120, d: .06, v: .04, type: 'triangle' });
          }
          p.y = landed.y - PH; p.vy = 0; p.ground = landed;
        } else if (p.ground) {
          // still standing on the same ledge?
          var G = p.ground;
          if (p.x + PW / 2 - 4 < G.x || p.x - PW / 2 + 4 > G.x + G.w || p.vy < 0) p.ground = null;
          else { p.y = G.y - PH; p.vy = 0; }
        }
        p.squash += (1 - p.squash) * Math.min(1, dt * 12);

        // scarf trail
        p.scarf.unshift({ x: p.x - p.face * 8, y: p.y + 9 });
        if (p.scarf.length > 7) p.scarf.pop();

        // --- camera / altitude / fog -------------------------------------------------
        var target = p.y - H * .55;
        if (target < d.camY) d.camY = target;
        var alt = Math.max(0, Math.floor((H - 120 - PH - p.y) / 10));
        if (alt > d.alt) { d.alt = alt; g.score = alt; g.set('Altitude', U.fmt(alt) + 'm'); }

        var fogSpeed = Math.min(150, 22 + d.alt * .09);
        d.fogY -= fogSpeed * dt;
        if (d.fogY > d.camY + H + 200) d.fogY = d.camY + H + 200;
        if (p.y > d.fogY + 10) { die(g, 'Lost in the whiteout'); return; }
        if (p.y - d.camY > H + 60) { die(g, 'Fell off the mountain'); return; }

        seed(d);
        d.ledges = d.ledges.filter(function (L) { return L.y < d.camY + H + 200; });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, p = d.p, cam = d.camY;
        var deep = U.clamp(d.alt / 1200, 0, 1);
        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, 'hsl(' + (228 - deep * 40) + ',55%,' + (12 + deep * 4) + '%)');
        sky.addColorStop(1, 'hsl(' + (215 - deep * 20) + ',45%,' + (22 - deep * 6) + '%)');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);

        d.stars.forEach(function (s) {
          var y = ((s.y - cam * .1) % H + H) % H;
          c.globalAlpha = .3 + Math.sin(g.t * 2 + s.a * 9) * .25;
          c.fillStyle = '#ffffff'; c.fillRect(s.x, y, 1.6, 1.6);
        });
        c.globalAlpha = 1;
        // aurora ribbons
        for (var a = 0; a < 3; a++) {
          c.beginPath();
          var base = 90 + a * 55 - (cam * .05 % 200);
          for (var x = 0; x <= W; x += 16) {
            var y = base + Math.sin(x * .012 + g.t * .6 + a * 2) * 28 + Math.sin(x * .03 - g.t * .4) * 10;
            if (x === 0) c.moveTo(x, y); else c.lineTo(x, y);
          }
          for (x = W; x >= 0; x -= 16) c.lineTo(x, base + 70 + Math.sin(x * .012 + g.t * .6 + a * 2) * 28);
          c.closePath();
          var ag = c.createLinearGradient(0, base, 0, base + 70);
          ag.addColorStop(0, a === 1 ? 'rgba(180,120,255,.14)' : 'rgba(90,230,190,.13)');
          ag.addColorStop(1, 'rgba(90,230,190,0)');
          c.fillStyle = ag; c.fill();
        }

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));
        c.translate(0, -cam);

        // rock walls with a jagged inner edge
        var top = Math.floor(cam / 40) * 40 - 40;
        c.fillStyle = '#2b2f45';
        c.beginPath(); c.moveTo(0, top);
        for (var wy = top; wy < cam + H + 80; wy += 40) c.lineTo(WALL + U.hash2(1, wy / 40, 7) * 10 - 4, wy);
        c.lineTo(0, cam + H + 80); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(W, top);
        for (wy = top; wy < cam + H + 80; wy += 40) c.lineTo(W - WALL - U.hash2(2, wy / 40, 7) * 10 + 4, wy);
        c.lineTo(W, cam + H + 80); c.closePath(); c.fill();
        c.fillStyle = 'rgba(255,255,255,.35)';
        for (wy = top; wy < cam + H + 80; wy += 40) {
          if (U.hash2(3, wy / 40, 7) > .5) c.fillRect(2, wy + 4, WALL - 8, 4);
          if (U.hash2(4, wy / 40, 7) > .5) c.fillRect(W - WALL + 6, wy + 12, WALL - 8, 4);
        }

        d.ledges.forEach(function (L) {
          if (L.y < cam - 40 || L.y > cam + H + 40) return;
          if (L.ice) {
            c.fillStyle = 'rgba(150,215,255,.75)';
            U.roundRect(c, L.x, L.y, L.w, 14, 5); c.fill();
            c.fillStyle = 'rgba(255,255,255,.75)';
            c.fillRect(L.x + 6, L.y + 2, L.w * .45, 3);
            c.fillStyle = 'rgba(150,215,255,.7)';
            for (var ix = L.x + 8; ix < L.x + L.w - 6; ix += 14) {
              var il = 6 + U.hash2(ix, L.y, 3) * 10;
              c.beginPath(); c.moveTo(ix, L.y + 14); c.lineTo(ix + 3, L.y + 14 + il); c.lineTo(ix + 6, L.y + 14); c.fill();
            }
          } else {
            c.fillStyle = L.base ? '#3a3f5c' : '#4b4f6b';
            U.roundRect(c, L.x, L.y + 3, L.w, L.base ? 140 : 15, 4); c.fill();
            c.fillStyle = '#f2f6ff';
            U.roundRect(c, L.x - 2, L.y - 2, L.w + 4, 8, 4); c.fill();
            c.fillStyle = 'rgba(0,0,0,.18)';
            c.fillRect(L.x + 4, L.y + 12, L.w - 8, 3);
          }
        });

        d.parts.forEach(function (pt) {
          c.globalAlpha = Math.max(0, pt.life / pt.max);
          c.fillStyle = pt.col;
          c.beginPath(); c.arc(pt.x, pt.y, pt.r, 0, 7); c.fill();
        });
        c.globalAlpha = 1;

        // the climber: red parka, hood, scarf
        if (!d.over) {
          c.strokeStyle = '#ffd257'; c.lineWidth = 4; c.lineCap = 'round';
          c.beginPath();
          p.scarf.forEach(function (s, i) { if (i === 0) c.moveTo(s.x, s.y); else c.lineTo(s.x - p.face * i * 2 - p.vx * .01 * i, s.y + Math.sin(g.t * 12 + i) * 1.5); });
          c.stroke();
          c.save();
          c.translate(p.x, p.y + PH);
          c.scale(p.face / p.squash, p.squash);
          c.fillStyle = '#d63b3b';
          U.roundRect(c, -PW / 2, -PH, PW, PH - 5, 7); c.fill();
          c.fillStyle = '#2b2f45';
          c.fillRect(-PW / 2 + 2, -6, 7, 6); c.fillRect(PW / 2 - 9, -6, 7, 6);
          c.fillStyle = '#b12f2f';
          c.beginPath(); c.arc(0, -PH + 7, 9, 0, 7); c.fill();
          c.fillStyle = '#f5d3b0';
          c.beginPath(); c.arc(1, -PH + 8, 5.5, 0, 7); c.fill();
          c.fillStyle = '#222';
          c.fillRect(3, -PH + 6, 2, 2);
          c.restore();
        }

        // the whiteout
        var fg = c.createLinearGradient(0, d.fogY - 90, 0, d.fogY + 40);
        fg.addColorStop(0, 'rgba(235,242,255,0)');
        fg.addColorStop(.6, 'rgba(235,242,255,.85)');
        fg.addColorStop(1, 'rgba(225,235,255,1)');
        c.fillStyle = fg;
        c.fillRect(0, d.fogY - 90, W, cam + H + 300 - d.fogY);
        c.restore();

        d.flakes.forEach(function (f) {
          c.globalAlpha = .35 + f.s * .3;
          c.fillStyle = '#ffffff';
          c.beginPath(); c.arc(f.x, f.y, f.s * 1.6, 0, 7); c.fill();
        });
        c.globalAlpha = 1;

        if (d.gust) {
          var blow = d.gust.phase === 'blow';
          var n = blow ? 40 : 12;
          c.strokeStyle = 'rgba(255,255,255,' + (blow ? .5 : .25) + ')'; c.lineWidth = 1.5;
          c.beginPath();
          for (var k = 0; k < n; k++) {
            var ly = (U.hash2(k, 3, 11) * H + g.t * 30) % H;
            var lx = ((U.hash2(k, 5, 11) * W + d.gust.dir * g.t * (blow ? 900 : 200)) % W + W) % W;
            c.moveTo(lx, ly); c.lineTo(lx - d.gust.dir * (blow ? 60 : 24), ly + 2);
          }
          c.stroke();
          c.fillStyle = blow ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.7)';
          c.font = '800 20px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText(blow ? (d.gust.dir < 0 ? '◀◀ GUST' : 'GUST ▶▶') : (d.gust.dir < 0 ? '◀ wind rising' : 'wind rising ▶'), W / 2, 140);
        }
      }
    });
  }

  window.Milo.register({
    id: 'frost-peak', title: 'Frost Peak', emo: '🏔️', category: 'Arcade',
    tagline: 'Icy ledges, grip on rock, gusts that shove',
    description: 'A vertical climb up a mountain of ledges. Rock ledges have grip — you stop ' +
      'dead and turn on a coin. Ice ledges have none, so your momentum slides you along and off ' +
      'the end unless you plan the landing. Every few seconds the wind rises for a second and ' +
      'then a gust hits, shoving you hard while airborne, less on ice, barely at all on rock. ' +
      'Higher up the ledges narrow, more of them are ice, and the whiteout chasing you from ' +
      'below climbs faster. Altitude is the score.',
    controls: ['← →', 'Space / ↑ jump', 'Touch: sides to move, top to jump'],
    colors: ['#0a1230', '#bfe9ff'],
    tags: ['platformer', 'endless', 'climbing', 'ice', 'vertical'],
    mount: mount
  });
})();
