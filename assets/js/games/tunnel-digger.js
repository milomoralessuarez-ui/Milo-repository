/* Tunnel Digger — carve the soil, pump the crawlers, drop boulders on the rest. */
(function () {
  'use strict';
  var CELL = 40, COLS = 18, ROWS = 13;
  var SKY = 46;                               // surface strip above the soil
  var W = COLS * CELL, H = ROWS * CELL + SKY;

  var BANDS = ['#c98b4b', '#b06f3c', '#8d5330', '#6d3d26'];
  var BAND_EDGE = ['#e0a866', '#c98357', '#a5674a', '#82513c'];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function cellX(cx) { return cx * CELL + CELL / 2; }
    function cellY(cy) { return SKY + cy * CELL + CELL / 2; }

    function solid(d, cx, cy) {
      if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) return true;
      return d.dirt[cy][cx] === 1;
    }
    function open(d, cx, cy) {
      if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) return false;
      return d.dirt[cy][cx] === 0;
    }
    function rockAt(d, cx, cy) {
      for (var i = 0; i < d.rocks.length; i++) {
        var r = d.rocks[i];
        if (!r.gone && r.cx === cx && Math.round(r.cy) === cy) return r;
      }
      return null;
    }

    function dig(d, cx, cy) {
      if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) return;
      if (d.dirt[cy][cx] === 1) {
        d.dirt[cy][cx] = 0;
        d.dug++;
        for (var i = 0; i < 4; i++) {
          d.parts.push({
            x: cellX(cx) + U.rand(-16, 16), y: cellY(cy) + U.rand(-16, 16),
            vx: U.rand(-40, 40), vy: U.rand(-70, -10),
            life: .4, max: .4, col: BANDS[Math.min(3, (cy / 4) | 0)], r: U.rand(1.5, 3)
          });
        }
      }
    }

    function burst(d, x, y, col, n) {
      for (var i = 0; i < (n || 14); i++) {
        var a = Math.random() * 6.283, s = U.rand(40, 230);
        d.parts.push({
          x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40,
          life: U.rand(.3, .7), max: .7, col: col, r: U.rand(2, 4.2)
        });
      }
    }

    /* ------------------------------------------------------------- levels */

    function buildLevel(g) {
      var d = g.data;
      d.dirt = [];
      for (var y = 0; y < ROWS; y++) {
        var row = [];
        for (var x = 0; x < COLS; x++) row.push(1);
        d.dirt.push(row);
      }
      d.dug = 0;
      d.rocks = [];
      d.monsters = [];
      d.parts = [];
      d.harpoon = null;
      d.pumped = null;
      d.shake = 0;
      d.clearTimer = 0;

      var lv = d.level;
      // Entry shaft down from the surface so the first dig is never blind.
      var entryCol = (COLS / 2) | 0;
      for (var e = 0; e < 2; e++) d.dirt[e][entryCol] = 0;

      // A couple of pre-cut galleries make each level read differently.
      var seed = lv * 977;
      var galleries = 2 + (lv % 3);
      for (var gi = 0; gi < galleries; gi++) {
        var gy = 3 + ((U.hash2(gi, lv, seed) * (ROWS - 5)) | 0);
        var gx = 1 + ((U.hash2(gi + 7, lv, seed) * (COLS - 8)) | 0);
        var len = 4 + ((U.hash2(gi + 13, lv, seed) * 5) | 0);
        for (var q = 0; q < len; q++) if (gx + q < COLS) d.dirt[gy][gx + q] = 0;
      }

      // Boulders: never in the top two rows, never on the entry shaft.
      var rocks = Math.min(7, 3 + ((lv / 2) | 0));
      var placed = 0, tries = 0;
      while (placed < rocks && tries < 200) {
        tries++;
        var rx = U.randInt(0, COLS - 1), ry = U.randInt(2, ROWS - 3);
        if (rx === entryCol && ry < 3) continue;
        if (rockAt(d, rx, ry)) continue;
        d.rocks.push({ cx: rx, cy: ry, state: 'set', wob: 0, vy: 0, gone: false });
        placed++;
      }

      // Monsters live in little pockets of their own.
      var count = Math.min(7, 3 + ((lv + 1) / 2) | 0);
      for (var m = 0; m < count; m++) {
        var mx, my, t2 = 0;
        do {
          mx = U.randInt(1, COLS - 2); my = U.randInt(3, ROWS - 1); t2++;
        } while ((rockAt(d, mx, my) || (mx === entryCol && my < 4)) && t2 < 80);
        d.dirt[my][mx] = 0;
        d.monsters.push({
          x: cellX(mx), y: cellY(my), cx: mx, cy: my,
          kind: (m % 3 === 2 && lv >= 2) ? 'dragon' : 'grub',
          dirx: -1, diry: 0, ghost: 0, ghostCd: U.rand(4, 9),
          inflate: 0, stun: 0, fire: 0, fireCd: U.rand(2, 5), dead: false,
          speed: 46 + lv * 4
        });
      }

      d.p = { x: cellX(entryCol), y: SKY + CELL * 0.5, cx: entryCol, cy: 0, dirx: 0, diry: 1, dead: 0 };
      d.left = d.monsters.length;
      g.set('Level', lv);
      g.set('Left', d.left);
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

    function say(d, text) { d.msg = text; d.msgT = 1.7; }

    function award(g, n) { g.score += n; g.set('Score', U.fmt(g.score)); }

    function depthBonus(cy) { return 200 + Math.min(3, (cy / 4) | 0) * 100; }

    function killPlayer(g) {
      var d = g.data;
      if (d.p.dead > 0) return;
      d.p.dead = 1.6;
      d.shake = 20;
      burst(d, d.p.x, d.p.y, '#ffe066', 24);
      Milo.sound.explode();
      d.lives--;
      g.set('Lives', Math.max(0, d.lives));
      if (d.lives <= 0) {
        g.gameOver({ emo: '⛏️', title: 'Buried', text: 'You cleared ' + (d.level - 1) + ' seam' + (d.level === 2 ? '' : 's') + '.' });
      }
    }

    /* -------------------------------------------------------------- pump */

    function firePump(g) {
      var d = g.data;
      if (d.p.dead > 0) return;
      if (d.pumped) {                       // already latched — keep pumping
        var mo = d.pumped;
        mo.inflate += 1;
        Milo.sound.tone({ f: 200 + mo.inflate * 90, f2: 380 + mo.inflate * 110, d: .12, v: .07, type: 'triangle' });
        if (mo.inflate >= 4) {
          mo.dead = true;
          burst(d, mo.x, mo.y, mo.kind === 'dragon' ? '#4ade80' : '#f87171', 22);
          award(g, depthBonus(mo.cy) + (mo.kind === 'dragon' ? 100 : 0));
          d.left--;
          g.set('Left', Math.max(0, d.left));
          d.pumped = null;
          d.harpoon = null;
          Milo.sound.explode();
        }
        return;
      }
      if (d.harpoon) return;
      d.harpoon = { len: 0, dirx: d.p.dirx || 0, diry: d.p.diry || 1, hit: null, t: 0 };
      if (!d.harpoon.dirx && !d.harpoon.diry) d.harpoon.diry = 1;
      Milo.sound.tone({ f: 520, f2: 240, d: .08, v: .05, type: 'square' });
    }

    /* ------------------------------------------------------------ runner */

    return Milo.arcade(host, {
      id: 'tunnel-digger',
      w: W, h: H, bg: '#2b1a12',
      stats: ['Score', 'Level', 'Left', 'Lives'],
      touch: 'dpad',
      touchButtons: [{ key: 'action', label: 'PUMP' }],
      emo: '⛏️',
      start: {
        title: 'Tunnel Digger',
        text: 'Chew your own tunnels through four soil bands. The pump harpoon latches onto ' +
          'a crawler down a clear tunnel — four taps and it pops. Or dig out the soil under ' +
          'a boulder and let it fall on a whole queue of them.',
        keys: ['Arrows / WASD to dig', 'Space to fire and pump']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, i = g.input;
        d.shake = Math.max(0, d.shake - dt * 44);
        d.msgT = Math.max(0, d.msgT - dt);

        if (d.p.dead > 0) {
          d.p.dead -= dt;
          if (d.p.dead <= 0 && d.lives > 0) buildLevel(g);
          stepParts(d, dt);
          return;
        }

        /* -- digger movement, one axis at a time, snapped to the other -- */
        var p = d.p;
        var ax = (i.down('right') ? 1 : 0) - (i.down('left') ? 1 : 0);
        var ay = (i.down('down') ? 1 : 0) - (i.down('up') ? 1 : 0);
        if (i.pdown) {
          var ddx = i.px - p.x, ddy = i.py - p.y;
          if (Math.abs(ddx) > Math.abs(ddy)) { if (Math.abs(ddx) > 12) ax = ddx > 0 ? 1 : -1; }
          else if (Math.abs(ddy) > 12) ay = ddy > 0 ? 1 : -1;
        }
        var spd = 122 * dt;
        if (ax) {
          p.dirx = ax; p.diry = 0;
          var tgtY = cellY(p.cy);
          p.y += U.clamp(tgtY - p.y, -spd, spd);
          if (Math.abs(p.y - tgtY) < 3) {
            var nx = p.x + ax * spd;
            var edge = nx + ax * (CELL / 2 - 4);
            var ecx = Math.floor((edge) / CELL);
            if (ecx >= 0 && ecx < COLS) {
              var blockRock = rockAt(d, ecx, p.cy);
              if (!(blockRock && blockRock.state !== 'falling')) p.x = nx;
            }
            p.x = U.clamp(p.x, CELL / 2, W - CELL / 2);
          }
        } else if (ay) {
          p.diry = ay; p.dirx = 0;
          var tgtX = cellX(p.cx);
          p.x += U.clamp(tgtX - p.x, -spd, spd);
          if (Math.abs(p.x - tgtX) < 3) {
            var ny = p.y + ay * spd;
            var eY = ny + ay * (CELL / 2 - 4);
            var ecy = Math.floor((eY - SKY) / CELL);
            if (ecy < 0) { if (ny > SKY * 0.5) p.y = ny; }
            else if (ecy < ROWS) {
              var br = rockAt(d, p.cx, ecy);
              if (!(br && br.state !== 'falling')) p.y = ny;
            }
            p.y = U.clamp(p.y, SKY * 0.45, SKY + ROWS * CELL - CELL / 2);
          }
        }
        p.cx = U.clamp(Math.floor(p.x / CELL), 0, COLS - 1);
        p.cy = U.clamp(Math.floor((p.y - SKY) / CELL), 0, ROWS - 1);
        if (p.y > SKY) dig(d, p.cx, p.cy);

        /* -- harpoon -- */
        if (i.pressed('action') || i.ptap) firePump(g);
        if (d.harpoon && !d.pumped) {
          var hp = d.harpoon;
          hp.t += dt;
          hp.len += dt * 460;
          var maxLen = CELL * 3.1;
          var hx = p.x + hp.dirx * hp.len, hy = p.y + hp.diry * hp.len;
          var hcx = Math.floor(hx / CELL), hcy = Math.floor((hy - SKY) / CELL);
          var stop = false;
          if (hcx < 0 || hcx >= COLS || hcy >= ROWS) stop = true;
          else if (hcy >= 0 && solid(d, hcx, hcy)) stop = true;
          for (var mi = 0; mi < d.monsters.length && !stop; mi++) {
            var mo = d.monsters[mi];
            if (mo.dead) continue;
            if (U.dist(mo.x, mo.y, hx, hy) < 22) {
              d.pumped = mo;
              mo.inflate = 1;
              mo.stun = 99;
              Milo.sound.tone({ f: 290, f2: 470, d: .12, v: .07, type: 'triangle' });
              stop = true;
            }
          }
          if (hp.len > maxLen) stop = true;
          if (stop && !d.pumped) d.harpoon = null;
        }
        if (d.pumped) {
          var pm = d.pumped;
          // Latched monsters deflate again if you stop pumping.
          pm.deflate = (pm.deflate || 0) + dt;
          if (pm.deflate > 1.5) {
            pm.inflate -= 1; pm.deflate = 0;
            if (pm.inflate <= 0) { pm.stun = 0; pm.inflate = 0; d.pumped = null; d.harpoon = null; }
          }
          if (d.pumped && U.dist(pm.x, pm.y, p.x, p.y) > CELL * 3.4) {
            pm.stun = 0; pm.inflate = 0; d.pumped = null; d.harpoon = null;
          }
        }

        /* -- boulders -- */
        d.rocks.forEach(function (r) {
          if (r.gone) return;
          if (r.state === 'set') {
            var belowY = Math.round(r.cy) + 1;
            if (belowY >= ROWS) return;
            if (open(d, r.cx, belowY) && !rockAt(d, r.cx, belowY)) { r.state = 'wobble'; r.wob = 0; }
          } else if (r.state === 'wobble') {
            r.wob += dt;
            if (r.wob > 0.85) { r.state = 'falling'; r.vy = 0; Milo.sound.tone({ f: 120, f2: 60, d: .2, v: .08, type: 'sawtooth' }); }
          } else if (r.state === 'falling') {
            r.vy += 900 * dt;
            r.cy += (r.vy * dt) / CELL;
            var rx = cellX(r.cx), ry = cellY(r.cy);
            // crush anything in the column
            d.monsters.forEach(function (mo) {
              if (mo.dead) return;
              if (Math.abs(mo.x - rx) < 24 && Math.abs(mo.y - ry) < 26) {
                mo.dead = true;
                d.left--;
                g.set('Left', Math.max(0, d.left));
                d.crushCombo = (d.crushCombo || 0) + 1;
                award(g, 400 * d.crushCombo);
                say(d, 'CRUSHED ×' + d.crushCombo + '  +' + (400 * d.crushCombo));
                burst(d, mo.x, mo.y, '#fca5a5', 18);
                if (d.pumped === mo) { d.pumped = null; d.harpoon = null; }
              }
            });
            if (Math.abs(p.x - rx) < 22 && Math.abs(p.y - ry) < 24) killPlayer(g);
            var landRow = Math.floor(r.cy + 0.5) + 1;
            if (landRow >= ROWS || solid(d, r.cx, landRow) || (rockAt(d, r.cx, landRow) && rockAt(d, r.cx, landRow) !== r)) {
              r.gone = true;
              d.shake = 14;
              d.crushCombo = 0;
              burst(d, rx, ry, '#a8a29e', 16);
              Milo.sound.explode();
            }
          }
        });

        /* -- monsters -- */
        d.monsters.forEach(function (mo) {
          if (mo.dead) return;
          if (mo.stun > 0) { mo.stun -= dt; if (mo.stun < 0) mo.stun = 0; return; }
          mo.cx = U.clamp(Math.floor(mo.x / CELL), 0, COLS - 1);
          mo.cy = U.clamp(Math.floor((mo.y - SKY) / CELL), 0, ROWS - 1);

          if (mo.ghost > 0) {
            // Phasing straight through the soil toward the digger.
            mo.ghost -= dt;
            var gdx = p.x - mo.x, gdy = p.y - mo.y, gm = Math.hypot(gdx, gdy) || 1;
            mo.x += (gdx / gm) * mo.speed * 0.62 * dt;
            mo.y += (gdy / gm) * mo.speed * 0.62 * dt;
            mo.y = U.clamp(mo.y, SKY + 10, SKY + ROWS * CELL - 10);
            mo.x = U.clamp(mo.x, 12, W - 12);
            if (mo.ghost <= 0 && solid(d, mo.cx, mo.cy)) mo.ghost = 0.5;   // keep going until a tunnel
            return;
          }

          mo.ghostCd -= dt;
          if (mo.ghostCd <= 0) { mo.ghost = U.rand(1.6, 3.2); mo.ghostCd = U.rand(7, 13); return; }

          // Tunnel chasing: pick the axis that closes the gap and is dug out.
          var atX = Math.abs(mo.x - cellX(mo.cx)) < 4;
          var atY = Math.abs(mo.y - cellY(mo.cy)) < 4;
          if (atX && atY) {
            var opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(function (o) {
              var nx2 = mo.cx + o[0], ny2 = mo.cy + o[1];
              if (nx2 < 0 || nx2 >= COLS || ny2 < 0 || ny2 >= ROWS) return false;
              if (!open(d, nx2, ny2)) return false;
              var rk = rockAt(d, nx2, ny2);
              return !(rk && rk.state !== 'falling');
            });
            if (opts.length) {
              var back = [-mo.dirx, -mo.diry];
              var fwd = opts.filter(function (o) { return !(o[0] === back[0] && o[1] === back[1]); });
              var pool = fwd.length ? fwd : opts;
              var best = pool[0], bs = 1e9;
              pool.forEach(function (o) {
                var dd = U.dist(cellX(mo.cx + o[0]), cellY(mo.cy + o[1]), p.x, p.y);
                dd += U.hash2(mo.cx + o[0], mo.cy + o[1], (g.t * 2) | 0) * 60;
                if (dd < bs) { bs = dd; best = o; }
              });
              mo.dirx = best[0]; mo.diry = best[1];
            } else { mo.dirx = 0; mo.diry = 0; }
          }
          mo.x += mo.dirx * mo.speed * dt;
          mo.y += mo.diry * mo.speed * dt;
          if (mo.dirx) mo.y += U.clamp(cellY(mo.cy) - mo.y, -60 * dt, 60 * dt);
          if (mo.diry) mo.x += U.clamp(cellX(mo.cx) - mo.x, -60 * dt, 60 * dt);

          // Dragon breath: a short jet along the tunnel.
          if (mo.kind === 'dragon') {
            mo.fireCd -= dt;
            if (mo.fire > 0) {
              mo.fire -= dt;
              var fx = mo.x + mo.dirx * 46, fy = mo.y + mo.diry * 46;
              if (U.dist(fx, fy, p.x, p.y) < 34) killPlayer(g);
              if (Math.random() < .6) {
                d.parts.push({
                  x: fx + U.rand(-10, 10), y: fy + U.rand(-10, 10),
                  vx: mo.dirx * 60, vy: mo.diry * 60 - 20,
                  life: .3, max: .3, col: Math.random() < .5 ? '#fb923c' : '#fde047', r: U.rand(2, 5)
                });
              }
            } else if (mo.fireCd <= 0 && Math.abs(mo.y - p.y) < 30 && Math.abs(mo.x - p.x) < CELL * 3) {
              mo.fire = .7; mo.fireCd = U.rand(3.5, 6);
              Milo.sound.tone({ f: 340, f2: 90, d: .3, v: .07, type: 'sawtooth' });
            }
          }

          if (U.dist(mo.x, mo.y, p.x, p.y) < 24) killPlayer(g);
        });
        d.monsters = d.monsters.filter(function (m) { return !m.dead; });

        stepParts(d, dt);

        /* -- level clear -- */
        if (d.left <= 0 && d.p.dead <= 0) {
          d.clearTimer += dt;
          if (d.clearTimer > 0.7) {
            d.level++;
            award(g, 500 + d.dug * 2);
            Milo.sound.powerup();
            buildLevel(g);
          }
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        // sky + grass strip
        var sky = c.createLinearGradient(0, 0, 0, SKY);
        sky.addColorStop(0, '#2b3f6b');
        sky.addColorStop(1, '#6b8dbf');
        c.fillStyle = sky; c.fillRect(-30, -30, W + 60, SKY + 30);
        c.fillStyle = '#3f8f4a';
        c.fillRect(-30, SKY - 8, W + 60, 8);

        // soil bands
        for (var y = 0; y < ROWS; y++) {
          var band = Math.min(3, (y / 4) | 0);
          for (var x = 0; x < COLS; x++) {
            var px = x * CELL, py = SKY + y * CELL;
            if (d.dirt[y][x] === 1) {
              c.fillStyle = BANDS[band];
              c.fillRect(px, py, CELL, CELL);
              // speckle so soil doesn't read as flat colour
              var hh = U.hash2(x, y, 9);
              c.fillStyle = 'rgba(0,0,0,.09)';
              c.fillRect(px + hh * 24, py + ((hh * 91) % 1) * 28, 7, 5);
              c.fillStyle = 'rgba(255,255,255,.05)';
              c.fillRect(px + ((hh * 37) % 1) * 28, py + ((hh * 53) % 1) * 26, 5, 4);
              // edge highlight against tunnels
              if (y > 0 && d.dirt[y - 1][x] === 0) {
                c.fillStyle = BAND_EDGE[band]; c.fillRect(px, py, CELL, 3);
              }
            } else {
              c.fillStyle = '#1a0f0a';
              c.fillRect(px, py, CELL, CELL);
            }
          }
        }

        // boulders
        d.rocks.forEach(function (r) {
          if (r.gone) return;
          var rx = cellX(r.cx), ry = cellY(r.cy);
          var wob = r.state === 'wobble' ? Math.sin(r.wob * 34) * 4 : 0;
          c.save(); c.translate(rx + wob, ry);
          c.fillStyle = '#8b8178';
          c.beginPath();
          c.moveTo(-17, 8); c.lineTo(-13, -12); c.lineTo(4, -17);
          c.lineTo(17, -4); c.lineTo(13, 13); c.lineTo(-6, 16);
          c.closePath(); c.fill();
          c.fillStyle = '#b5aca2';
          c.beginPath();
          c.moveTo(-13, -12); c.lineTo(4, -17); c.lineTo(6, -8); c.lineTo(-9, -4);
          c.closePath(); c.fill();
          c.fillStyle = 'rgba(0,0,0,.28)';
          c.beginPath(); c.arc(6, 5, 4, 0, 7); c.fill();
          c.restore();
        });

        // harpoon line
        if (d.harpoon) {
          var hp = d.harpoon, p0 = d.p;
          var tipX = d.pumped ? d.pumped.x : p0.x + hp.dirx * hp.len;
          var tipY = d.pumped ? d.pumped.y : p0.y + hp.diry * hp.len;
          c.strokeStyle = '#fde047'; c.lineWidth = 3; c.lineCap = 'round';
          c.beginPath(); c.moveTo(p0.x, p0.y); c.lineTo(tipX, tipY); c.stroke();
          c.fillStyle = '#fde047';
          c.beginPath(); c.arc(tipX, tipY, 5, 0, 7); c.fill();
        }

        // monsters
        d.monsters.forEach(function (mo) {
          var infl = 1 + mo.inflate * 0.26;
          c.save();
          c.translate(mo.x, mo.y);
          c.globalAlpha = mo.ghost > 0 ? .45 : 1;
          c.scale(infl, infl);
          var body = mo.kind === 'dragon' ? '#4ade80' : '#f87171';
          var trim = mo.kind === 'dragon' ? '#166534' : '#7f1d1d';
          c.fillStyle = body;
          c.beginPath(); c.ellipse(0, 0, 15, 13, 0, 0, 7); c.fill();
          c.fillStyle = trim;
          c.beginPath(); c.ellipse(0, 6, 12, 6, 0, 0, 7); c.fill();
          // goggle eyes
          c.fillStyle = '#fff';
          c.beginPath(); c.arc(-5, -4, 5, 0, 7); c.arc(5, -4, 5, 0, 7); c.fill();
          c.fillStyle = '#111';
          var lx = U.clamp(mo.dirx * 2, -2, 2), ly = U.clamp(mo.diry * 2, -2, 2);
          c.beginPath(); c.arc(-5 + lx, -4 + ly, 2.2, 0, 7); c.arc(5 + lx, -4 + ly, 2.2, 0, 7); c.fill();
          if (mo.kind === 'dragon') {
            c.fillStyle = '#facc15';
            c.beginPath(); c.moveTo(-4, -12); c.lineTo(0, -19); c.lineTo(4, -12); c.closePath(); c.fill();
          }
          c.restore();
          c.globalAlpha = 1;
        });

        // digger
        if (d.p.dead <= 0) {
          var p = d.p;
          c.save(); c.translate(p.x, p.y);
          if (p.dirx < 0) c.scale(-1, 1);
          c.fillStyle = '#e2e8f0';
          U.roundRect(c, -11, -6, 22, 20, 6); c.fill();
          c.fillStyle = '#38bdf8';
          U.roundRect(c, -10, -4, 20, 9, 4); c.fill();
          c.fillStyle = '#fbbf24';
          c.beginPath(); c.arc(0, -12, 10, Math.PI, 0); c.closePath(); c.fill();
          c.fillStyle = '#fff7ed';
          c.beginPath(); c.arc(0, -11, 5.5, 0, 7); c.fill();
          c.fillStyle = '#111827';
          c.beginPath(); c.arc(1.5, -11, 2.2, 0, 7); c.fill();
          c.restore();
        }

        // particles
        d.parts.forEach(function (q) {
          c.globalAlpha = Math.max(0, q.life / q.max);
          c.fillStyle = q.col;
          c.beginPath(); c.arc(q.x, q.y, q.r, 0, 7); c.fill();
        });
        c.globalAlpha = 1;
        c.restore();

        if (d.msgT > 0) {
          c.globalAlpha = Math.min(1, d.msgT);
          c.fillStyle = '#fde047';
          c.font = '800 22px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(d.msg, W / 2, SKY - 16);
          c.globalAlpha = 1;
          c.textAlign = 'left';
        }
      }
    });

    function stepParts(d, dt) {
      d.parts = d.parts.filter(function (q) {
        q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 420 * dt; q.life -= dt;
        return q.life > 0;
      });
    }
  }

  window.Milo.register({
    id: 'tunnel-digger',
    title: 'Tunnel Digger',
    emo: '⛏️',
    category: 'Arcade',
    tagline: 'Pump the crawlers or drop a boulder on them',
    description: 'You chew tunnels through four bands of soil while red grubs and green ' +
      'fire-breathers hunt you down them. The pump harpoon reaches three tiles along a ' +
      'clear tunnel: latch on, then tap four times to pop — deeper kills pay more. Digging ' +
      'the soil out from under a boulder is worth far more, because every monster the same ' +
      'boulder flattens doubles the payout. Monsters phase through solid soil when you hide.',
    controls: ['Arrow keys', 'WASD', 'Space to pump', 'Drag'],
    colors: ['#b06f3c', '#4ade80'],
    tags: ['classic', 'digging', 'arcade', 'levels', 'chase'],
    mount: mount
  });
})();
