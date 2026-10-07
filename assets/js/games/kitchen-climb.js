/* Kitchen Climb — walk the layers down onto the plate before the condiments get you. */
(function () {
  'use strict';
  var W = 700, H = 660;
  var FLOORS = [150, 236, 322, 408, 494];
  var LAST = FLOORS.length - 1;
  var PLATE_Y = 592;
  var COLX = [112, 268, 424, 580];
  var QW = 26, QN = 4, IW = QW * QN;

  // top bun, lettuce, cheese, patty, tomato, base bun
  var ING = [
    { n: 'bun', top: '#e8a85a', bot: '#c07b33' },
    { n: 'lettuce', top: '#7ed957', bot: '#4e9c2f' },
    { n: 'cheese', top: '#ffd257', bot: '#e0a21a' },
    { n: 'patty', top: '#7b4a2d', bot: '#4e2c18' },
    { n: 'tomato', top: '#ef4444', bot: '#b91c1c' },
    { n: 'base', top: '#d9973f', bot: '#a86a24' }
  ];

  // Per-level: ladder x/floor pairs, and each column's ingredient floors.
  var LEVELS = [
    {
      ladders: [[64, 0], [346, 0], [636, 0], [190, 1], [502, 1], [64, 2], [346, 2], [636, 2], [190, 3], [502, 3]],
      stacks: [[0, 1, 2, 3], [0, 1, 2, 3], [0, 1, 2, 3], [0, 1, 2, 3]],
      recipe: [0, 1, 3, 5]
    },
    {
      ladders: [[64, 0], [190, 0], [502, 0], [636, 0], [346, 1], [64, 1], [190, 2], [502, 2], [64, 3], [346, 3], [636, 3]],
      stacks: [[0, 1, 3, 4], [0, 2, 3, 4], [0, 1, 2, 4], [1, 2, 3, 4]],
      recipe: [0, 2, 3, 5]
    },
    {
      ladders: [[64, 0], [346, 0], [636, 0], [64, 1], [190, 1], [502, 1], [190, 2], [346, 2], [636, 2], [64, 3], [502, 3]],
      stacks: [[0, 2, 3, 4], [0, 1, 2, 3], [1, 2, 3, 4], [0, 1, 3, 4]],
      recipe: [0, 4, 3, 5]
    },
    {
      ladders: [[190, 0], [346, 0], [502, 0], [64, 1], [636, 1], [190, 2], [502, 2], [64, 3], [346, 3], [636, 3]],
      stacks: [[0, 1, 2, 4], [1, 2, 3, 4], [0, 1, 3, 4], [0, 2, 3, 4]],
      recipe: [0, 1, 4, 5]
    }
  ];

  var FOES = [
    { n: 'egg', col: '#fff4c2', trim: '#f59e0b', sp: 52, emo: '🍳' },
    { n: 'pickle', col: '#86efac', trim: '#15803d', sp: 60, emo: '🥒' },
    { n: 'sausage', col: '#fb7185', trim: '#9f1239', sp: 68, emo: '🌭' }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function floorY(f) { return f > LAST ? PLATE_Y : FLOORS[f]; }

    /* ------------------------------------------------------------ ladders */

    function ladderNear(d, x, f, dir) {
      // dir +1 goes down (connects f and f+1); dir -1 goes up (connects f-1 and f)
      var want = dir > 0 ? f : f - 1;
      var best = null, bd = 1e9;
      for (var i = 0; i < d.ladders.length; i++) {
        var L = d.ladders[i];
        if (L.f !== want) continue;
        var dd = Math.abs(L.x - x);
        if (dd < bd) { bd = dd; best = L; }
      }
      return best;
    }
    function ladderAtX(d, x, f, dir) {
      var want = dir > 0 ? f : f - 1;
      for (var i = 0; i < d.ladders.length; i++) {
        var L = d.ladders[i];
        if (L.f === want && Math.abs(L.x - x) < 13) return L;
      }
      return null;
    }

    /* ------------------------------------------------------------- level */

    function buildLevel(g) {
      var d = g.data;
      var spec = LEVELS[(d.level - 1) % LEVELS.length];
      d.spec = spec;
      d.ladders = spec.ladders.map(function (L) { return { x: L[0], f: L[1] }; });
      d.ings = [];
      for (var col = 0; col < COLX.length; col++) {
        var floorsFor = spec.stacks[col];
        for (var k = 0; k < floorsFor.length; k++) {
          d.ings.push({
            col: col, floor: floorsFor[k], type: spec.recipe[k],
            x: COLX[col] - IW / 2, y: floorY(floorsFor[k]) - 13,
            q: [0, 0, 0, 0], falling: false, target: 0, plated: false, combo: 0
          });
        }
      }
      d.plates = [0, 0, 0, 0];
      d.total = d.ings.length;
      d.done = 0;
      d.p = { x: COLX[3] + 40, f: LAST, y: floorY(LAST) - 17, climb: null, face: -1, ride: null, dead: 0 };
      d.foes = [];
      d.spawnT = 1.6;
      d.pepper = 5;
      d.clouds = [];
      d.parts = [];
      d.shake = 0;
      d.foeSpeed = 1 + (d.level - 1) * 0.11;
      d.maxFoes = Math.min(6, 2 + Math.floor(d.level / 1.5));
      g.set('Level', d.level);
      g.set('Pepper', d.pepper);
      g.set('Layers', d.total - d.done);
    }

    function reset(g) {
      var d = g.data;
      d.level = 1;
      d.lives = 3;
      d.msg = '';
      d.msgT = 0;
      buildLevel(g);
      g.score = 0;
      g.set('Score', 0);
      g.set('Lives', 3);
    }

    function say(d, t) { d.msg = t; d.msgT = 1.7; }
    function award(g, n) { g.score += n; g.set('Score', U.fmt(g.score)); }

    function burst(d, x, y, col, n) {
      for (var i = 0; i < (n || 12); i++) {
        var a = Math.random() * 6.283, s = U.rand(40, 230);
        d.parts.push({
          x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60,
          life: U.rand(.3, .65), max: .65, col: col, r: U.rand(1.6, 3.6)
        });
      }
    }

    /* ------------------------------------------------------------- foes */

    function spawnFoe(d) {
      var kind = FOES[U.randInt(0, Math.min(FOES.length - 1, Math.floor(d.level / 2)))];
      var left = Math.random() < .5;
      d.foes.push({
        kind: kind, x: left ? 40 : W - 40, f: U.randInt(2, LAST),
        y: 0, climb: null, stun: 0, face: left ? 1 : -1, wob: Math.random() * 6
      });
      var f = d.foes[d.foes.length - 1];
      f.y = floorY(f.f) - 16;
    }

    function stepWalker(d, w, speed, dt, tx, tf) {
      if (w.climb) {
        var cl = w.climb;
        cl.t += dt * speed / 58;
        w.x = cl.x;
        w.y = U.lerp(floorY(cl.from) - 16, floorY(cl.to) - 16, U.clamp(cl.t, 0, 1));
        if (cl.t >= 1) { w.f = cl.to; w.climb = null; w.y = floorY(w.f) - 16; }
        return;
      }
      w.y = floorY(w.f) - 16;
      if (w.f !== tf) {
        var dir = tf > w.f ? 1 : -1;
        var here = ladderAtX(d, w.x, w.f, dir);
        if (here) {
          w.climb = { x: here.x, from: w.f, to: w.f + dir, t: 0 };
          return;
        }
        var L = ladderNear(d, tx, w.f, dir) || ladderNear(d, w.x, w.f, dir);
        if (L) {
          var dx = L.x - w.x;
          w.x += U.clamp(dx, -speed * dt, speed * dt);
          if (dx !== 0) w.face = dx > 0 ? 1 : -1;
          return;
        }
      }
      var hx = tx - w.x;
      if (Math.abs(hx) > 2) {
        w.x += U.clamp(hx, -speed * dt, speed * dt);
        w.face = hx > 0 ? 1 : -1;
      }
      w.x = U.clamp(w.x, 34, W - 34);
    }

    /* ------------------------------------------------------- ingredients */

    function dropIng(g, ing, chained) {
      var d = g.data;
      if (ing.falling || ing.plated) return;
      ing.falling = true;
      ing.target = ing.floor + 1;
      ing.combo = chained ? ing.combo + 1 : 0;
      ing.q = [0, 0, 0, 0];
      Milo.sound.tone({ f: 300, f2: 140, d: .16, v: .07, type: 'triangle' });

      // riders: anything standing on this layer comes down with it
      d.foes.forEach(function (f) {
        if (!f.climb && f.f === ing.floor && f.x > ing.x - 6 && f.x < ing.x + IW + 6 && !f.riding) {
          f.riding = ing;
        }
      });
      var p = d.p;
      if (!p.climb && p.f === ing.floor && p.x > ing.x - 4 && p.x < ing.x + IW + 4 && !p.ride) {
        p.ride = ing;
      }
    }

    function landIng(g, ing) {
      var d = g.data;
      ing.floor = ing.target;
      // squash riders
      var squashed = 0;
      d.foes = d.foes.filter(function (f) {
        if (f.riding === ing) {
          squashed++;
          burst(d, f.x, f.y, f.kind.trim, 14);
          return false;
        }
        return true;
      });
      if (squashed) {
        var pts = [0, 500, 1000, 2000, 4000][Math.min(4, squashed)];
        award(g, pts);
        say(d, 'SQUASHED ×' + squashed + '  +' + U.fmt(pts));
        d.shake = 12;
        Milo.sound.coin();
      }
      if (d.p.ride === ing) { d.p.ride = null; d.p.f = Math.min(LAST, ing.floor); }

      if (ing.floor > LAST) {
        ing.plated = true;
        ing.falling = false;
        d.plates[ing.col]++;
        ing.y = PLATE_Y - 13 - (d.plates[ing.col] - 1) * 11;
        d.done++;
        g.set('Layers', Math.max(0, d.total - d.done));
        award(g, 100 + ing.combo * 100);
        Milo.sound.tone({ f: 700, f2: 980, d: .12, v: .07, type: 'square' });
        burst(d, ing.x + IW / 2, ing.y, ING[ing.type].top, 10);
        return;
      }
      // landing on a resting layer pushes it down too
      var below = null;
      for (var i = 0; i < d.ings.length; i++) {
        var o = d.ings[i];
        if (o !== ing && o.col === ing.col && !o.plated && !o.falling && o.floor === ing.floor) below = o;
      }
      if (below) {
        below.combo = ing.combo + 1;
        dropIng(g, below, true);
        ing.target = ing.floor + 1;
        ing.combo++;
        return;                     // keep falling with it
      }
      ing.falling = false;
      ing.y = floorY(ing.floor) - 13;
      d.shake = Math.max(d.shake, 5);
    }

    /* ------------------------------------------------------------- death */

    function hurt(g) {
      var d = g.data;
      if (d.p.dead > 0) return;
      d.p.dead = 1.5;
      d.p.ride = null;
      d.p.climb = null;
      d.shake = 18;
      burst(d, d.p.x, d.p.y, '#f87171', 22);
      Milo.sound.explode();
      d.lives--;
      g.set('Lives', Math.max(0, d.lives));
      if (d.lives <= 0) {
        g.gameOver({ emo: '🍔', title: 'Shift over', text: 'You plated ' + d.done + ' layers on level ' + d.level + '.' });
      }
    }

    /* ------------------------------------------------------------ runner */

    return Milo.arcade(host, {
      id: 'kitchen-climb',
      w: W, h: H, bg: '#140d0a',
      stats: ['Score', 'Level', 'Layers', 'Pepper', 'Lives'],
      touch: 'dpad',
      touchButtons: [{ key: 'action', label: 'PEPPER' }],
      emo: '🍔',
      start: {
        title: 'Kitchen Climb',
        text: 'Walk the full width of a burger layer and it drops to the floor below. Land ' +
          'one on another and both keep going — chains are where the points are. A shake of ' +
          'pepper freezes the condiments for a few seconds, and you only get five.',
        keys: ['Arrows / WASD to walk and climb', 'Space for pepper']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, i = g.input, p = d.p;
        d.shake = Math.max(0, d.shake - dt * 40);
        d.msgT = Math.max(0, d.msgT - dt);

        d.parts = d.parts.filter(function (q) {
          q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 520 * dt; q.life -= dt;
          return q.life > 0;
        });
        d.clouds = d.clouds.filter(function (cl) { cl.life -= dt; return cl.life > 0; });

        if (p.dead > 0) {
          p.dead -= dt;
          if (p.dead <= 0 && d.lives > 0) {
            p.x = COLX[3] + 40; p.f = LAST; p.y = floorY(LAST) - 17; p.climb = null;
            d.foes = [];
            d.spawnT = 1.4;
          }
          return;
        }

        /* -- player -- */
        var ax = (i.down('right') ? 1 : 0) - (i.down('left') ? 1 : 0);
        var ay = (i.down('down') ? 1 : 0) - (i.down('up') ? 1 : 0);
        if (i.pdown) {
          var pdx = i.px - p.x, pdy = i.py - p.y;
          if (Math.abs(pdx) > Math.abs(pdy)) { if (Math.abs(pdx) > 12) ax = pdx > 0 ? 1 : -1; }
          else if (Math.abs(pdy) > 16) ay = pdy > 0 ? 1 : -1;
        }

        if (p.ride) {
          p.y = p.ride.y - 17;
          p.x = U.clamp(p.x, p.ride.x, p.ride.x + IW);
        } else if (p.climb) {
          var cl = p.climb;
          var dirSign = cl.to > cl.from ? 1 : -1;
          if (ay === dirSign || ay === 0) cl.t += dt * 2.0 * (ay === dirSign ? 1 : 0);
          else cl.t -= dt * 2.0;
          p.x = cl.x;
          p.y = U.lerp(floorY(cl.from) - 17, floorY(cl.to) - 17, U.clamp(cl.t, 0, 1));
          if (cl.t >= 1) { p.f = cl.to; p.climb = null; p.y = floorY(p.f) - 17; }
          else if (cl.t <= 0) { p.f = cl.from; p.climb = null; p.y = floorY(p.f) - 17; }
        } else {
          p.y = floorY(p.f) - 17;
          if (ay !== 0) {
            var L = ladderAtX(d, p.x, p.f, ay);
            if (L && (ay > 0 ? p.f < LAST : p.f > 0)) {
              p.climb = ay > 0
                ? { x: L.x, from: p.f, to: p.f + 1, t: 0.001 }
                : { x: L.x, from: p.f - 1, to: p.f, t: 0.999 };
            }
          }
          if (!p.climb && ax) {
            p.x = U.clamp(p.x + ax * 168 * dt, 34, W - 34);
            p.face = ax;
          }
        }

        /* -- pepper -- */
        if ((i.pressed('action') || i.pressed('Space')) && d.pepper > 0 && !p.climb) {
          d.pepper--;
          g.set('Pepper', d.pepper);
          d.clouds.push({ x: p.x + p.face * 36, y: p.y, life: .5, max: .5 });
          var cx0 = p.x + p.face * 36;
          d.foes.forEach(function (f) {
            if (f.f === p.f && Math.abs(f.x - cx0) < 44) { f.stun = 3.4; }
          });
          Milo.sound.tone({ f: 900, f2: 240, d: .18, v: .06, type: 'sawtooth' });
        }

        /* -- pushing layers -- */
        if (!p.climb && !p.ride) {
          d.ings.forEach(function (ing) {
            if (ing.plated || ing.falling || ing.floor !== p.f) return;
            for (var q = 0; q < QN; q++) {
              if (ing.q[q] >= 1) continue;
              var qx = ing.x + q * QW;
              if (p.x > qx - 4 && p.x < qx + QW + 4) {
                ing.q[q] = Math.min(1, ing.q[q] + dt * 7);
                if (ing.q[q] >= 1) Milo.sound.tone({ f: 420 + q * 60, d: .04, v: .04, type: 'square' });
              }
            }
            if (ing.q[0] >= 1 && ing.q[1] >= 1 && ing.q[2] >= 1 && ing.q[3] >= 1) dropIng(g, ing, false);
          });
        }

        /* -- falling layers -- */
        d.ings.forEach(function (ing) {
          if (!ing.falling) return;
          var ty = floorY(ing.target) - 13;
          ing.y += 300 * dt;
          d.foes.forEach(function (f) {
            if (f.riding === ing) { f.y = ing.y - 16; f.climb = null; }
          });
          if (ing.y >= ty) { ing.y = ty; landIng(g, ing); }
        });

        /* -- foes -- */
        d.spawnT -= dt;
        if (d.spawnT <= 0 && d.foes.length < d.maxFoes) {
          d.spawnT = Math.max(2.2, 6 - d.level * 0.35);
          spawnFoe(d);
        }
        d.foes.forEach(function (f) {
          f.wob += dt * 8;
          if (f.riding) return;
          if (f.stun > 0) { f.stun -= dt; return; }
          stepWalker(d, f, f.kind.sp * d.foeSpeed, dt, p.x, p.f);
          if (!f.climb && !p.climb && f.f === p.f && Math.abs(f.x - p.x) < 20 && Math.abs(f.y - p.y) < 26) hurt(g);
          else if (Math.abs(f.x - p.x) < 16 && Math.abs(f.y - p.y) < 20) hurt(g);
        });

        /* -- level clear -- */
        if (d.done >= d.total) {
          award(g, 1000 + d.level * 250 + d.pepper * 200);
          say(d, 'BURGER UP!');
          d.level++;
          Milo.sound.win();
          buildLevel(g);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#1d120c');
        bg.addColorStop(1, '#0d0806');
        c.fillStyle = bg; c.fillRect(-40, -40, W + 80, H + 80);

        // tiled back wall
        c.strokeStyle = 'rgba(255,255,255,.035)';
        c.lineWidth = 1;
        for (var tx = 0; tx < W; tx += 44) { c.beginPath(); c.moveTo(tx, 0); c.lineTo(tx, H); c.stroke(); }
        for (var ty2 = 0; ty2 < H; ty2 += 44) { c.beginPath(); c.moveTo(0, ty2); c.lineTo(W, ty2); c.stroke(); }

        // ladders behind the floors
        d.ladders.forEach(function (L) {
          var y0 = FLOORS[L.f], y1 = FLOORS[L.f + 1];
          c.strokeStyle = '#8b6f4a'; c.lineWidth = 3;
          c.beginPath();
          c.moveTo(L.x - 11, y0); c.lineTo(L.x - 11, y1);
          c.moveTo(L.x + 11, y0); c.lineTo(L.x + 11, y1);
          c.stroke();
          c.lineWidth = 2.4;
          c.strokeStyle = '#a98a5f';
          for (var ry = y0 + 12; ry < y1; ry += 16) {
            c.beginPath(); c.moveTo(L.x - 11, ry); c.lineTo(L.x + 11, ry); c.stroke();
          }
        });

        // floors
        FLOORS.forEach(function (fy) {
          c.fillStyle = '#3f6b8f';
          U.roundRect(c, 28, fy, W - 56, 8, 4); c.fill();
          c.fillStyle = 'rgba(255,255,255,.25)';
          U.roundRect(c, 30, fy + 1, W - 60, 3, 1.5); c.fill();
        });

        // plates
        COLX.forEach(function (cx) {
          c.fillStyle = '#cbd5e1';
          c.beginPath(); c.ellipse(cx, PLATE_Y + 6, 68, 12, 0, 0, 7); c.fill();
          c.fillStyle = '#94a3b8';
          c.beginPath(); c.ellipse(cx, PLATE_Y + 9, 68, 10, 0, 0, 7); c.fill();
        });

        // ingredients
        d.ings.forEach(function (ing) {
          var def = ING[ing.type];
          for (var q = 0; q < QN; q++) {
            var qx = ing.x + q * QW;
            var qy = ing.y + (ing.falling || ing.plated ? 0 : ing.q[q] * 7);
            c.fillStyle = def.bot;
            U.roundRect(c, qx, qy + 6, QW, 7, 3); c.fill();
            c.fillStyle = def.top;
            U.roundRect(c, qx, qy, QW, 8, 3.5); c.fill();
            if (def.n === 'lettuce') {
              c.fillStyle = 'rgba(255,255,255,.28)';
              for (var w2 = 0; w2 < 3; w2++) {
                c.beginPath(); c.arc(qx + 5 + w2 * 8, qy + 2, 3.2, Math.PI, 0); c.fill();
              }
            } else if (def.n === 'bun' || def.n === 'base') {
              c.fillStyle = 'rgba(255,255,255,.35)';
              c.fillRect(qx + 5, qy + 2, 3, 2);
              c.fillRect(qx + 15, qy + 4, 3, 2);
            } else if (def.n === 'patty') {
              c.fillStyle = 'rgba(0,0,0,.3)';
              c.fillRect(qx + 6, qy + 3, 5, 2);
              c.fillRect(qx + 15, qy + 9, 5, 2);
            }
          }
        });

        // pepper clouds
        d.clouds.forEach(function (cl) {
          var a = cl.life / cl.max;
          c.globalAlpha = a * .8;
          for (var n = 0; n < 8; n++) {
            var an = n / 8 * 6.283 + cl.life * 6;
            c.fillStyle = n % 2 ? '#e2e8f0' : '#94a3b8';
            c.beginPath();
            c.arc(cl.x + Math.cos(an) * (1 - a) * 34, cl.y + Math.sin(an) * (1 - a) * 22, 7 * a + 3, 0, 7);
            c.fill();
          }
          c.globalAlpha = 1;
        });

        // foes
        d.foes.forEach(function (f) {
          c.save(); c.translate(f.x, f.y);
          var bob = Math.sin(f.wob) * 2;
          if (f.stun > 0) c.globalAlpha = 0.55 + Math.sin(f.wob * 3) * .2;
          c.fillStyle = f.kind.col;
          c.beginPath(); c.ellipse(0, bob, 14, 13, 0, 0, 7); c.fill();
          c.fillStyle = f.kind.trim;
          c.beginPath(); c.ellipse(0, bob + 6, 12, 6, 0, 0, 7); c.fill();
          c.fillStyle = '#fff';
          c.beginPath(); c.arc(-5, bob - 3, 4.6, 0, 7); c.arc(5, bob - 3, 4.6, 0, 7); c.fill();
          c.fillStyle = '#1b1006';
          c.beginPath();
          c.arc(-5 + f.face * 1.6, bob - 3, 2.3, 0, 7);
          c.arc(5 + f.face * 1.6, bob - 3, 2.3, 0, 7);
          c.fill();
          // angry brows
          c.strokeStyle = '#1b1006'; c.lineWidth = 2; c.lineCap = 'round';
          c.beginPath();
          c.moveTo(-9, bob - 9); c.lineTo(-2, bob - 6);
          c.moveTo(9, bob - 9); c.lineTo(2, bob - 6);
          c.stroke();
          // legs
          c.strokeStyle = f.kind.trim; c.lineWidth = 2.6;
          var lw = Math.sin(f.wob) * 4;
          c.beginPath();
          c.moveTo(-5, bob + 11); c.lineTo(-6 + lw, bob + 17);
          c.moveTo(5, bob + 11); c.lineTo(6 - lw, bob + 17);
          c.stroke();
          if (f.stun > 0) {
            c.fillStyle = '#facc15';
            c.font = '700 12px Outfit, sans-serif';
            c.textAlign = 'center';
            c.fillText('✷', 0, bob - 16);
          }
          c.globalAlpha = 1;
          c.restore();
        });

        // chef
        var p = d.p;
        if (p.dead <= 0) {
          c.save(); c.translate(p.x, p.y);
          c.fillStyle = 'rgba(0,0,0,.25)';
          c.beginPath(); c.ellipse(0, 18, 12, 4, 0, 0, 7); c.fill();
          // body
          c.fillStyle = '#f8fafc';
          U.roundRect(c, -10, -6, 20, 22, 6); c.fill();
          c.fillStyle = '#38bdf8';
          c.fillRect(-10, 8, 20, 4);
          // head
          c.fillStyle = '#fcd9b6';
          c.beginPath(); c.arc(0, -13, 9, 0, 7); c.fill();
          // hat
          c.fillStyle = '#ffffff';
          U.roundRect(c, -10, -28, 20, 10, 5); c.fill();
          c.beginPath(); c.arc(-5, -28, 5.5, 0, 7); c.arc(5, -28, 5.5, 0, 7); c.arc(0, -31, 6, 0, 7); c.fill();
          c.fillStyle = '#1f2937';
          c.beginPath();
          c.arc(-3 + p.face * 2, -13, 1.9, 0, 7);
          c.arc(3 + p.face * 2, -13, 1.9, 0, 7);
          c.fill();
          // moustache
          c.fillStyle = '#7c4a24';
          U.roundRect(c, -6, -9, 12, 3.4, 1.7); c.fill();
          c.restore();
        }

        d.parts.forEach(function (q) {
          c.globalAlpha = Math.max(0, q.life / q.max);
          c.fillStyle = q.col;
          c.fillRect(q.x - q.r, q.y - q.r, q.r * 2, q.r * 2);
        });
        c.globalAlpha = 1;
        c.restore();

        if (d.msgT > 0) {
          c.globalAlpha = Math.min(1, d.msgT);
          c.fillStyle = '#ffd257';
          c.font = '800 26px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(d.msg, W / 2, 112);
          c.globalAlpha = 1;
          c.textAlign = 'left';
        }
      }
    });
  }

  window.Milo.register({
    id: 'kitchen-climb',
    title: 'Kitchen Climb',
    emo: '🍔',
    category: 'Arcade',
    tagline: 'Walk the layers down onto the plate',
    description: 'Four burgers are scattered in pieces across five kitchen floors. Walking ' +
      'the full width of a layer knocks it to the floor below, and a layer landing on ' +
      'another sends both onward — a four-floor chain is worth many times four single ' +
      'drops. Fried eggs, pickles and sausages chase you along the floors and up the ' +
      'ladders; five shakes of pepper freeze them, and a falling layer flattens them for ' +
      '500 each, doubling for every extra one it catches.',
    controls: ['Arrow keys', 'WASD', 'Space for pepper'],
    colors: ['#3f6b8f', '#ffd257'],
    tags: ['classic', 'platform', 'arcade', 'levels', 'chase'],
    mount: mount
  });
})();
