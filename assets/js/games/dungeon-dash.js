/* Dungeon Dash — room-to-room sword crawl; clear it, then pick a door. */
(function () {
  'use strict';
  var W = 760, H = 560, WALL = 40;
  var FL = { x: WALL, y: WALL + 24, w: W - WALL * 2, h: H - WALL * 2 - 24 };
  var ANG = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
  var SWING_R = 64, SWING_HALF = 1.15;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.room = 0; d.kills = 0; d.swingId = 0;
      d.p = { x: W / 2, y: FL.y + FL.h - 50, r: 14, face: 'up', swing: 0, cool: 0,
        hp: 3, maxHp: 5, inv: 0, step: 0, vx: 0, vy: 0 };
      d.enemies = []; d.parts = []; d.hearts = []; d.doors = null; d.pillars = [];
      d.fade = 0; d.pending = null; d.shake = 0; d.risk = false; d.msg = ''; d.msgT = 0;
      d.torch = [0, 0, 0, 0].map(function () { return Math.random() * 6.28; });
      newRoom(g, false);
      g.set('Rooms', 0); g.set('Kills', 0); g.set('Hearts', '♥♥♥');
    }

    function inPillar(d, x, y, r) {
      for (var i = 0; i < d.pillars.length; i++) {
        var b = d.pillars[i];
        if (x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h) return b;
      }
      return null;
    }

    function newRoom(g, risk) {
      var d = g.data, p = d.p;
      d.room++;
      d.risk = risk;
      d.pillars = [];
      var np = U.randInt(1, 3);
      for (var i = 0; i < np; i++) {
        var pw = U.rand(44, 96), ph = U.rand(44, 96);
        d.pillars.push({
          x: U.rand(FL.x + 70, FL.x + FL.w - 70 - pw),
          y: U.rand(FL.y + 60, FL.y + FL.h - 150 - ph), w: pw, h: ph
        });
      }
      p.x = W / 2; p.y = FL.y + FL.h - 40; p.face = 'up'; p.vx = p.vy = 0;
      d.enemies = []; d.hearts = []; d.doors = null;
      var n = Math.min(15, 3 + Math.floor(d.room * 0.8));
      if (risk) n = Math.ceil(n * 1.5);
      var spd = 1 + d.room * 0.035 + (risk ? .18 : 0);
      var batP = Math.min(.5, d.room * .07), ogreP = (d.room >= 4 || risk) ? (risk ? .22 : .12) : 0;
      for (var k = 0; k < n; k++) {
        var r = Math.random(), kind = r < ogreP ? 'ogre' : r < ogreP + batP ? 'bat' : 'slime';
        var e = mkEnemy(kind, spd), tries = 0;
        do {
          e.x = U.rand(FL.x + 30, FL.x + FL.w - 30);
          e.y = U.rand(FL.y + 30, FL.y + FL.h * 0.62);
          tries++;
        } while ((inPillar(d, e.x, e.y, e.r + 4) || U.dist(e.x, e.y, p.x, p.y) < 200) && tries < 40);
        d.enemies.push(e);
      }
      d.msg = risk ? '☠ DANGER ROOM ' + d.room : 'ROOM ' + d.room;
      d.msgT = 1.5;
    }

    function mkEnemy(kind, spd) {
      if (kind === 'bat') return { kind: kind, r: 11, hp: 1, col: '#c084fc', speed: 165 * spd, ph: Math.random() * 6.28, swoop: U.rand(1, 3), hurt: 0, hitId: -1, vx: 0, vy: 0 };
      if (kind === 'ogre') return { kind: kind, r: 22, hp: 5, col: '#fb923c', speed: 52 * spd, hurt: 0, hitId: -1, vx: 0, vy: 0, ph: 0 };
      return { kind: 'slime', r: 15, hp: 2, col: '#5ee06a', speed: 175 * spd, hop: U.rand(.2, 1), hurt: 0, hitId: -1, vx: 0, vy: 0, ph: Math.random() * 6.28 };
    }

    function burst(d, x, y, col, n, spd) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.28, s = U.rand(40, spd || 220);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(.3, .7), max: .7, col: col, sz: U.rand(2, 5) });
      }
    }

    function heartsText(p) {
      var s = '';
      for (var i = 0; i < p.maxHp; i++) s += i < p.hp ? '♥' : '♡';
      return s;
    }

    function moveBody(d, b, dt) {
      var nx = b.x + b.vx * dt, ny = b.y + b.vy * dt;
      if (!inPillar(d, nx, b.y, b.r)) b.x = nx;
      if (!inPillar(d, b.x, ny, b.r)) b.y = ny;
      b.x = U.clamp(b.x, FL.x + b.r, FL.x + FL.w - b.r);
      var top = FL.y + b.r;
      if (b === d.p && d.doors) {
        for (var i = 0; i < d.doors.length; i++) if (Math.abs(b.x - d.doors[i].x) < 26) top = FL.y - 30;
      }
      b.y = U.clamp(b.y, top, FL.y + FL.h - b.r);
    }

    function swing(g) {
      var d = g.data, p = d.p;
      if (p.cool > 0 || p.swing > 0) return;
      p.swing = .2; p.cool = .38; d.swingId++;
      Milo.sound.noise(.09, .1, 2400);
      Milo.sound.tone({ f: 900, f2: 300, d: .09, v: .05, type: 'triangle' });
    }

    function hurtPlayer(g, e) {
      var d = g.data, p = d.p;
      if (p.inv > 0) return;
      p.hp--; p.inv = .9; d.shake = .6;
      g.set('Hearts', heartsText(p));
      Milo.sound.hit();
      burst(d, p.x, p.y, '#ff5d73', 14);
      var a = Math.atan2(p.y - e.y, p.x - e.x);
      p.vx += Math.cos(a) * 320; p.vy += Math.sin(a) * 320;
      if (p.hp <= 0) {
        burst(d, p.x, p.y, '#8ec5ff', 30);
        g.gameOver({ text: 'You fell in room ' + d.room + ' after ' + d.kills + ' kills. Rooms cleared: ' + g.score + '.' });
      }
    }

    return Milo.arcade(host, {
      id: 'dungeon-dash',
      w: W, h: H, bg: '#100c0b',
      stats: ['Rooms', 'Kills', 'Hearts'],
      touch: 'dpad',
      touchButtons: [{ key: 'action', label: '⚔' }],
      emo: '🗡️',
      start: {
        title: 'Dungeon Dash',
        text: 'Slimes and bats fill every room. Swing your sword in the direction you face, ' +
          'clear the room, then pick a door: the shield door is safe, the skull door is ' +
          'packed but counts double and always drops a heart.',
        keys: ['WASD / arrows move', 'Space / X swing']
      },
      init: reset,

      onKey: function (g, e, name) {
        if (name === 'action' || name === 'a' || name === 'b') swing(g);
      },

      update: function (g, dt) {
        var d = g.data, p = d.p, inp = g.input;

        // room transition
        if (d.fade > 0) {
          var before = d.fade;
          d.fade -= dt;
          if (before > .35 && d.fade <= .35 && d.pending != null) {
            newRoom(g, d.pending); d.pending = null;
          }
          d.parts = d.parts.filter(function (q) { q.life -= dt; return q.life > 0; });
          return;
        }
        d.msgT = Math.max(0, d.msgT - dt);
        d.shake = Math.max(0, d.shake - dt * 3);

        // player movement
        var ax = (inp.down('right') ? 1 : 0) - (inp.down('left') ? 1 : 0);
        var ay = (inp.down('down') ? 1 : 0) - (inp.down('up') ? 1 : 0);
        if (ax || ay) {
          if (Math.abs(ax) >= Math.abs(ay)) p.face = ax > 0 ? 'right' : 'left';
          else p.face = ay > 0 ? 'down' : 'up';
          var l = Math.hypot(ax, ay); ax /= l; ay /= l;
          p.step += dt * 10;
        }
        var spd = p.swing > 0 ? 90 : 215;
        p.vx += (ax * spd - p.vx) * Math.min(1, dt * 12);
        p.vy += (ay * spd - p.vy) * Math.min(1, dt * 12);
        moveBody(d, p, dt);
        p.cool -= dt; p.inv = Math.max(0, p.inv - dt);
        if (inp.down('action') && p.cool <= 0) swing(g);

        // doors
        if (d.doors && p.y < FL.y - 4) {
          for (var di = 0; di < d.doors.length; di++) {
            if (Math.abs(p.x - d.doors[di].x) < 26) {
              d.pending = !d.doors[di].safe; d.fade = .7;
              Milo.sound.tone({ f: 220, f2: 440, d: .3, v: .08, type: 'triangle' });
              return;
            }
          }
        }

        // sword
        if (p.swing > 0) {
          p.swing -= dt;
          var fa = ANG[p.face];
          d.enemies.forEach(function (e) {
            if (e.hitId === d.swingId) return;
            var dist = U.dist(p.x, p.y, e.x, e.y);
            if (dist > SWING_R + e.r) return;
            var da = Math.atan2(e.y - p.y, e.x - p.x) - fa;
            da = Math.atan2(Math.sin(da), Math.cos(da));
            if (Math.abs(da) > SWING_HALF) return;
            e.hitId = d.swingId; e.hp--; e.hurt = .18;
            e.vx += Math.cos(fa) * 340; e.vy += Math.sin(fa) * 340;
            burst(d, e.x, e.y, e.col, 6, 160);
            Milo.sound.tone({ f: 520, f2: 180, d: .08, v: .07, type: 'square' });
          });
        }

        // enemies
        for (var i = d.enemies.length - 1; i >= 0; i--) {
          var e = d.enemies[i];
          e.hurt = Math.max(0, e.hurt - dt);
          var toA = Math.atan2(p.y - e.y, p.x - e.x);
          if (e.kind === 'slime') {
            e.hop -= dt;
            if (e.hop <= 0) {
              e.hop = U.rand(.7, 1.1);
              e.vx += Math.cos(toA) * e.speed; e.vy += Math.sin(toA) * e.speed;
            }
            e.vx *= Math.pow(.02, dt); e.vy *= Math.pow(.02, dt);
          } else if (e.kind === 'bat') {
            e.ph += dt * 9; e.swoop -= dt;
            var sw = e.swoop < 0 ? 2.1 : 1;
            if (e.swoop < -.45) e.swoop = U.rand(1.6, 3);
            var side = Math.sin(e.ph * .45) * 90;
            var tx = Math.cos(toA) * e.speed * sw + Math.cos(toA + 1.57) * side;
            var ty = Math.sin(toA) * e.speed * sw + Math.sin(toA + 1.57) * side;
            e.vx += (tx - e.vx) * Math.min(1, dt * 5); e.vy += (ty - e.vy) * Math.min(1, dt * 5);
          } else {
            e.ph += dt * 4;
            e.vx += (Math.cos(toA) * e.speed - e.vx) * Math.min(1, dt * 3);
            e.vy += (Math.sin(toA) * e.speed - e.vy) * Math.min(1, dt * 3);
          }
          moveBody(d, e, dt);
          // separate from other enemies a little
          for (var j = 0; j < d.enemies.length; j++) {
            var o = d.enemies[j]; if (o === e) continue;
            var dd = U.dist(e.x, e.y, o.x, o.y), min = e.r + o.r;
            if (dd < min && dd > 0) { e.x += (e.x - o.x) / dd * (min - dd) * .5; e.y += (e.y - o.y) / dd * (min - dd) * .5; }
          }
          if (e.hp <= 0) {
            d.enemies.splice(i, 1);
            d.kills++; g.set('Kills', d.kills);
            burst(d, e.x, e.y, e.col, e.kind === 'ogre' ? 26 : 14);
            d.shake = Math.max(d.shake, e.kind === 'ogre' ? .5 : .2);
            Milo.sound.tone({ f: e.kind === 'ogre' ? 120 : 260, f2: 40, d: .18, v: .1, type: 'sawtooth' });
            if (Math.random() < (e.kind === 'ogre' ? .5 : .14)) d.hearts.push({ x: e.x, y: e.y, t: 0 });
            continue;
          }
          if (U.dist(e.x, e.y, p.x, p.y) < e.r + p.r - 2) hurtPlayer(g, e);
        }

        // hearts
        d.hearts = d.hearts.filter(function (h) {
          h.t += dt;
          if (U.dist(h.x, h.y, p.x, p.y) < p.r + 12) {
            if (p.hp < p.maxHp) { p.hp++; g.set('Hearts', heartsText(p)); }
            Milo.sound.coin();
            burst(d, h.x, h.y, '#ff5d73', 8, 120);
            return false;
          }
          return true;
        });

        // room cleared
        if (!d.enemies.length && !d.doors) {
          d.doors = [{ x: W * .32, safe: true }, { x: W * .68, safe: false }];
          g.score += d.risk ? 2 : 1;
          g.set('Rooms', g.score);
          if (d.risk) d.hearts.push({ x: W / 2, y: FL.y + FL.h / 2, t: 0 });
          d.msg = 'ROOM CLEAR — pick a door'; d.msgT = 2;
          Milo.sound.powerup();
        }

        d.parts = d.parts.filter(function (q) {
          q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= .94; q.vy *= .94; q.life -= dt;
          return q.life > 0;
        });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, p = d.p, t = g.t;
        c.save();
        if (d.shake > 0) c.translate(U.rand(-1, 1) * d.shake * 5, U.rand(-1, 1) * d.shake * 5);

        // walls
        c.fillStyle = '#2a1f1b'; c.fillRect(0, 0, W, H);
        c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1;
        for (var by = 0; by < H; by += 20) {
          c.beginPath(); c.moveTo(0, by); c.lineTo(W, by); c.stroke();
          for (var bx = (by / 20) % 2 ? 0 : 30; bx < W; bx += 60) { c.beginPath(); c.moveTo(bx, by); c.lineTo(bx, by + 20); c.stroke(); }
        }
        // floor
        c.fillStyle = '#3d312b'; c.fillRect(FL.x, FL.y, FL.w, FL.h);
        for (var ty = FL.y; ty < FL.y + FL.h; ty += 40) {
          for (var tx = FL.x; tx < FL.x + FL.w; tx += 40) {
            var hsh = U.hash2(tx, ty, d.room);
            c.fillStyle = hsh < .12 ? 'rgba(0,0,0,.18)' : (((tx + ty) / 40) % 2 ? 'rgba(0,0,0,.09)' : 'rgba(255,255,255,.025)');
            c.fillRect(tx, ty, Math.min(40, FL.x + FL.w - tx), Math.min(40, FL.y + FL.h - ty));
          }
        }
        if (d.risk) { c.fillStyle = 'rgba(160,20,40,.08)'; c.fillRect(FL.x, FL.y, FL.w, FL.h); }
        // inner wall shadow
        c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(FL.x, FL.y, FL.w, 10);
        c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(FL.x, FL.y, 8, FL.h);

        // torches
        [[FL.x + 60, FL.y - 10], [FL.x + FL.w - 60, FL.y - 10], [FL.x - 12, FL.y + FL.h / 2], [FL.x + FL.w + 12, FL.y + FL.h / 2]].forEach(function (tp, i) {
          var fl = .8 + Math.sin(t * 13 + d.torch[i]) * .12 + Math.sin(t * 29 + i) * .08;
          var gr = c.createRadialGradient(tp[0], tp[1], 4, tp[0], tp[1], 140 * fl);
          gr.addColorStop(0, 'rgba(255,160,60,.28)'); gr.addColorStop(1, 'rgba(255,120,30,0)');
          c.fillStyle = gr; c.fillRect(tp[0] - 150, tp[1] - 150, 300, 300);
          c.fillStyle = '#6b4a2b'; c.fillRect(tp[0] - 3, tp[1] - 2, 6, 16);
          c.fillStyle = '#ffb347'; c.beginPath(); c.ellipse(tp[0], tp[1] - 6, 5 * fl, 9 * fl, 0, 0, 7); c.fill();
          c.fillStyle = '#fff3c4'; c.beginPath(); c.arc(tp[0], tp[1] - 4, 2.5, 0, 7); c.fill();
        });

        // doors
        if (d.doors) d.doors.forEach(function (dr) {
          var col = dr.safe ? '#7cc4ff' : '#ff5d73';
          c.fillStyle = '#080506';
          c.beginPath(); c.moveTo(dr.x - 26, FL.y + 8); c.lineTo(dr.x - 26, FL.y - 30);
          c.arc(dr.x, FL.y - 30, 26, Math.PI, 0); c.lineTo(dr.x + 26, FL.y + 8); c.closePath(); c.fill();
          c.shadowColor = col; c.shadowBlur = 16 + Math.sin(t * 5) * 6;
          c.strokeStyle = col; c.lineWidth = 3; c.stroke();
          c.shadowBlur = 0;
          c.font = '26px system-ui, sans-serif'; c.textAlign = 'center'; c.fillStyle = col;
          c.fillText(dr.safe ? '🛡' : '💀', dr.x, FL.y - 22);
          c.font = '800 11px Outfit, sans-serif';
          c.fillText(dr.safe ? 'SAFE  +1' : 'DANGER  +2', dr.x, FL.y + 22);
        });

        // pillars
        d.pillars.forEach(function (b) {
          c.fillStyle = 'rgba(0,0,0,.35)'; U.roundRect(c, b.x + 5, b.y + 7, b.w, b.h, 6); c.fill();
          c.fillStyle = '#5a4a41'; U.roundRect(c, b.x, b.y, b.w, b.h, 6); c.fill();
          c.fillStyle = '#6f5c51'; U.roundRect(c, b.x + 4, b.y + 4, b.w - 8, 10, 4); c.fill();
          c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 2; U.roundRect(c, b.x, b.y, b.w, b.h, 6); c.stroke();
        });

        // hearts
        d.hearts.forEach(function (h) {
          var bob = Math.sin(h.t * 5) * 3;
          drawHeart(c, h.x, h.y + bob, 9, '#ff5d73');
        });

        // enemies
        d.enemies.forEach(function (e) {
          c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(e.x, e.y + e.r * .8, e.r, e.r * .4, 0, 0, 7); c.fill();
          var col = e.hurt > 0 ? '#fff' : e.col;
          if (e.kind === 'slime') {
            var sq = 1 + Math.max(0, Math.hypot(e.vx, e.vy) / 400);
            c.fillStyle = col;
            c.beginPath(); c.ellipse(e.x, e.y, e.r * (2 - sq) * .95 + 2, e.r * sq * .8, 0, 0, 7); c.fill();
            c.fillStyle = '#0f2a12';
            c.beginPath(); c.arc(e.x - 5, e.y - 3, 2.6, 0, 7); c.arc(e.x + 5, e.y - 3, 2.6, 0, 7); c.fill();
          } else if (e.kind === 'bat') {
            var flap = Math.sin(e.ph) * 9;
            c.fillStyle = col;
            c.beginPath(); c.moveTo(e.x, e.y);
            c.lineTo(e.x - 20, e.y - 4 + flap); c.lineTo(e.x - 12, e.y + 6); c.closePath(); c.fill();
            c.beginPath(); c.moveTo(e.x, e.y);
            c.lineTo(e.x + 20, e.y - 4 + flap); c.lineTo(e.x + 12, e.y + 6); c.closePath(); c.fill();
            c.beginPath(); c.arc(e.x, e.y, 8, 0, 7); c.fill();
            c.fillStyle = '#ffe66d';
            c.beginPath(); c.arc(e.x - 3, e.y - 1, 1.6, 0, 7); c.arc(e.x + 3, e.y - 1, 1.6, 0, 7); c.fill();
          } else {
            c.fillStyle = col;
            c.beginPath(); c.arc(e.x, e.y, e.r, 0, 7); c.fill();
            c.fillStyle = '#fde68a';
            c.beginPath(); c.moveTo(e.x - 14, e.y - 12); c.lineTo(e.x - 20, e.y - 26); c.lineTo(e.x - 6, e.y - 18); c.closePath(); c.fill();
            c.beginPath(); c.moveTo(e.x + 14, e.y - 12); c.lineTo(e.x + 20, e.y - 26); c.lineTo(e.x + 6, e.y - 18); c.closePath(); c.fill();
            c.fillStyle = '#3b1105';
            c.beginPath(); c.arc(e.x - 7, e.y - 4, 3, 0, 7); c.arc(e.x + 7, e.y - 4, 3, 0, 7); c.fill();
            c.fillRect(e.x - 8, e.y + 6, 16, 3);
            var hw = 44;
            c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(e.x - hw / 2, e.y - e.r - 12, hw, 5);
            c.fillStyle = '#fb923c'; c.fillRect(e.x - hw / 2, e.y - e.r - 12, hw * e.hp / 5, 5);
          }
        });

        // player
        var fa = ANG[p.face];
        if (p.swing > 0) {
          var k = 1 - p.swing / .2;
          c.save(); c.translate(p.x, p.y); c.rotate(fa);
          c.fillStyle = 'rgba(220,235,255,' + (0.55 * (1 - k)) + ')';
          c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, SWING_R, -SWING_HALF, SWING_HALF); c.closePath(); c.fill();
          var sa = -SWING_HALF + k * SWING_HALF * 2;
          c.strokeStyle = '#f8fbff'; c.lineWidth = 4; c.lineCap = 'round';
          c.beginPath(); c.moveTo(Math.cos(sa) * 10, Math.sin(sa) * 10); c.lineTo(Math.cos(sa) * (SWING_R - 4), Math.sin(sa) * (SWING_R - 4)); c.stroke();
          c.restore();
        }
        if (!(p.inv > 0 && Math.floor(g.t * 20) % 2)) {
          c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(p.x, p.y + 12, 13, 5, 0, 0, 7); c.fill();
          var bobP = Math.sin(p.step) * 1.5;
          c.fillStyle = '#4c7fd1'; U.roundRect(c, p.x - 11, p.y - 10 + bobP, 22, 24, 6); c.fill();
          c.fillStyle = '#9fc2ff'; U.roundRect(c, p.x - 9, p.y - 20 + bobP, 18, 14, 5); c.fill();
          c.fillStyle = '#1c2b4a';
          var ex = p.face === 'left' ? -4 : p.face === 'right' ? 4 : 0;
          if (p.face !== 'up') { c.fillRect(p.x - 4 + ex, p.y - 15 + bobP, 3, 3); c.fillRect(p.x + 1 + ex, p.y - 15 + bobP, 3, 3); }
          c.fillStyle = '#e8eefc';
          if (p.swing <= 0) {
            c.save(); c.translate(p.x, p.y); c.rotate(fa);
            c.fillRect(8, -2, 22, 4); c.fillStyle = '#c99a3a'; c.fillRect(6, -5, 4, 10); c.restore();
          }
        }

        // particles
        d.parts.forEach(function (q) {
          c.globalAlpha = Math.max(0, q.life / q.max); c.fillStyle = q.col;
          c.fillRect(q.x - q.sz / 2, q.y - q.sz / 2, q.sz, q.sz);
        });
        c.globalAlpha = 1;
        c.restore();

        // hearts HUD
        for (var hi = 0; hi < p.maxHp; hi++) drawHeart(c, 30 + hi * 24, H - 26, 9, hi < p.hp ? '#ff5d73' : 'rgba(255,255,255,.15)');
        c.font = '700 12px Outfit, sans-serif'; c.textAlign = 'right'; c.fillStyle = 'rgba(255,255,255,.5)';
        c.fillText('ROOM ' + d.room + (d.risk ? '  ☠' : ''), W - 20, H - 20);

        if (d.msgT > 0) {
          c.globalAlpha = Math.min(1, d.msgT * 2);
          c.font = '900 30px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillStyle = d.risk && d.enemies.length ? '#ff5d73' : '#ffe9b8';
          c.shadowColor = '#000'; c.shadowBlur = 12;
          c.fillText(d.msg, W / 2, H / 2 - 40);
          c.shadowBlur = 0; c.globalAlpha = 1;
        }
        if (d.fade > 0) {
          c.fillStyle = 'rgba(0,0,0,' + U.clamp(d.fade > .35 ? (0.7 - d.fade) / .35 : d.fade / .35, 0, 1) + ')';
          c.fillRect(0, 0, W, H);
        }
      }
    });

    function drawHeart(c, x, y, s, col) {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(x, y + s);
      c.bezierCurveTo(x - s * 1.6, y - s * .2, x - s * .6, y - s * 1.4, x, y - s * .4);
      c.bezierCurveTo(x + s * .6, y - s * 1.4, x + s * 1.6, y - s * .2, x, y + s);
      c.fill();
    }
  }

  window.Milo.register({
    id: 'dungeon-dash', title: 'Dungeon Dash', emo: '🗡️', category: 'Action',
    tagline: 'Clear the room, then choose shield or skull',
    description: 'A top-down sword crawl through endless rooms of hopping slimes, swooping ' +
      'bats and, later, horned ogres. Your swing covers a wide arc in the direction you face ' +
      'but has a short cooldown, so commit to a swing and back off. Every cleared room opens ' +
      'two doors: the shield door is a normal room worth one point, the skull door is half ' +
      'again as crowded, faster, worth two points and always leaves a heart. Tip: bats die in ' +
      'one hit, so let them come to you and swing when they swoop.',
    controls: ['WASD / ← ↑ ↓ →', 'Space / X swing'],
    colors: ['#2a1f1b', '#ff5d73'],
    tags: ['dungeon', 'sword', 'rooms', 'roguelike', 'action'],
    mount: mount
  });
})();
