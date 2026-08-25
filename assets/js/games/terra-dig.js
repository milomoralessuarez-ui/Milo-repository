/* Terra Dig — 2D side-on mining sandbox: dig, collect ore, build. */
(function () {
  'use strict';
  var TS = 20;                  // tile size in pixels
  var MW = 220, MH = 150;       // world size in tiles
  var SURFACE = 42;

  var TILES = {
    0: null,
    1: { name: 'Grass', col: '#5aa02c', top: '#79c93f', hp: 1 },
    2: { name: 'Dirt', col: '#8b5a2b', hp: 1 },
    3: { name: 'Stone', col: '#7c7c85', hp: 2 },
    4: { name: 'Coal', col: '#3b3b45', hp: 2, ore: true, value: 5 },
    5: { name: 'Iron', col: '#c6a68b', hp: 3, ore: true, value: 12 },
    6: { name: 'Gold', col: '#f0c040', hp: 3, ore: true, value: 30 },
    7: { name: 'Gem', col: '#22d3ee', hp: 4, ore: true, value: 80 },
    8: { name: 'Wood', col: '#7a4a26', hp: 1 },
    9: { name: 'Leaves', col: '#2f7a34', hp: 1 },
    10: { name: 'Plank', col: '#b9884f', hp: 1 },
    11: { name: 'Brick', col: '#a3402f', hp: 2 },
    12: { name: 'Lamp', col: '#ffd257', hp: 1, glow: true }
  };
  var PLACEABLE = [2, 3, 8, 10, 11, 12];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      var saved = Milo.store.get('terra-dig:save', null);
      d.seed = (saved && saved.seed) || U.randInt(1, 99999);
      d.map = new Uint8Array(MW * MH);
      generate(d);
      d.edits = (saved && saved.edits) || {};
      for (var k in d.edits) d.map[+k] = d.edits[k];

      d.inv = (saved && saved.inv) || {};
      d.coins = (saved && saved.coins) || 0;
      d.slot = 0;
      d.mined = 0;

      var sx = MW >> 1;
      var sy = 0;
      while (sy < MH && !d.map[sy * MW + sx]) sy++;
      d.p = { x: sx * TS + TS / 2, y: (sy - 3) * TS, vx: 0, vy: 0, w: 14, h: 30, onGround: false };
      d.cam = { x: 0, y: 0 };
      d.digging = null;
      d.digT = 0;
      d.parts = [];
      d.saveT = 0;
      g.set('Coins', 0);
      g.set('Mined', 0);
      updateInvStat(g);
    }

    function generate(d) {
      var seed = d.seed;
      for (var x = 0; x < MW; x++) {
        var h = Math.floor(SURFACE + U.fbm(x * 0.03, 0.5, 4, seed) * 22 - 8);
        h = U.clamp(h, 20, MH - 30);
        for (var y = h; y < MH; y++) {
          var t;
          if (y === h) t = 1;
          else if (y < h + 5) t = 2;
          else {
            t = 3;
            var n = U.hash2(x, y, seed + 3);
            var depth = (y - h) / (MH - h);
            if (n < 0.055) t = 4;
            else if (n < 0.055 + depth * 0.05) t = 5;
            else if (n > 0.985 && depth > .35) t = 6;
            else if (n > 0.9975 && depth > .6) t = 7;
            // Caves carved out of the noise field.
            if (U.fbm(x * 0.08, y * 0.08, 3, seed + 9) > 0.68 && y > h + 6) t = 0;
          }
          d.map[y * MW + x] = t;
        }
        // Trees on the surface.
        if (U.hash2(x, 0, seed + 21) < 0.045 && x > 3 && x < MW - 4) {
          var th = U.randInt(4, 7);
          for (var i = 1; i <= th; i++) d.map[(h - i) * MW + x] = 8;
          for (var lx = -2; lx <= 2; lx++) {
            for (var ly = -2; ly <= 0; ly++) {
              if (Math.abs(lx) === 2 && ly === 0) continue;
              var yy = h - th + ly, xx = x + lx;
              if (yy > 0 && xx > 0 && xx < MW && !d.map[yy * MW + xx]) d.map[yy * MW + xx] = 9;
            }
          }
        }
      }
    }

    function at(d, tx, ty) {
      if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) return ty >= MH ? 3 : 0;
      return d.map[ty * MW + tx];
    }
    function solid(d, tx, ty) {
      var t = at(d, tx, ty);
      return t !== 0 && t !== 9;      // you can walk through leaves
    }
    function setTile(d, tx, ty, v) {
      if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) return;
      var i = ty * MW + tx;
      d.map[i] = v;
      d.edits[i] = v;
    }

    function save(d) {
      Milo.store.set('terra-dig:save', {
        seed: d.seed, edits: d.edits, inv: d.inv, coins: d.coins
      });
    }

    function updateInvStat(g) {
      var d = g.data;
      var n = 0;
      for (var k in d.inv) n += d.inv[k];
      g.set('Blocks', n);
    }

    function collides(d, px, py, w, h) {
      var x0 = Math.floor((px - w / 2) / TS), x1 = Math.floor((px + w / 2 - .01) / TS);
      var y0 = Math.floor(py / TS), y1 = Math.floor((py + h - .01) / TS);
      for (var y = y0; y <= y1; y++) {
        for (var x = x0; x <= x1; x++) if (solid(d, x, y)) return true;
      }
      return false;
    }

    return Milo.arcade(host, {
      id: 'terra-dig',
      fit: 'resize',
      bg: '#0a0f22',
      stats: ['Coins', 'Mined', 'Blocks'],
      touch: 'dpad',
      touchButtons: [{ key: 'b', label: 'PLACE' }],
      noContextMenu: true,
      wheel: true,
      emo: '🪓',
      start: {
        title: 'Terra Dig',
        text: 'A side-on world to tunnel through. Dig for coal, iron, gold and gems, ' +
          'then build with what you collect. Your world is saved between visits.',
        keys: ['A D move', 'W / Space jump', 'Left click dig', 'Right click place', '1–6 pick block']
      },
      init: reset,

      onKey: function (g, e) {
        var m = /^Digit([1-6])$/.exec(e.code);
        if (m) { g.data.slot = +m[1] - 1; Milo.sound.click(); }
      },

      onPointer: function (g, type, x, y, e) {
        if (type !== 'down') return;
        // Right-click places on a mouse; on touch, hold PLACE and tap.
        if ((e && e.button === 2) || g.input.down('b')) placeAt(g, x, y);
      },

      update: function (g, dt) {
        var d = g.data, p = d.p, i = g.input;

        if (i.wheel) {
          d.slot = (d.slot + (i.wheel > 0 ? 1 : -1) + PLACEABLE.length) % PLACEABLE.length;
        }

        var move = (i.down('right') ? 1 : 0) - (i.down('left') ? 1 : 0);
        p.vx += (move * 168 - p.vx) * Math.min(1, dt * 16);
        p.vy += 900 * dt;
        p.vy = Math.min(p.vy, 620);

        if ((i.down('up') || i.down('action')) && p.onGround) {
          p.vy = -330;
          p.onGround = false;
          Milo.sound.tone({ f: 240, f2: 180, d: .07, v: .05, type: 'triangle' });
        }

        // Move on each axis separately, with a small step-up for single blocks.
        var nx = p.x + p.vx * dt;
        if (!collides(d, nx, p.y, p.w, p.h)) p.x = nx;
        else if (!collides(d, nx, p.y - TS * .8, p.w, p.h) && p.onGround) { p.x = nx; p.y -= TS * .8; }
        else p.vx = 0;

        var ny = p.y + p.vy * dt;
        if (!collides(d, p.x, ny, p.w, p.h)) { p.y = ny; p.onGround = false; }
        else {
          if (p.vy > 0) p.onGround = true;
          p.vy = 0;
        }

        p.x = U.clamp(p.x, TS, MW * TS - TS);
        if (p.y > MH * TS + 200) { p.y = 0; p.vy = 0; }

        d.cam.x = U.clamp(p.x - g.W / 2, 0, MW * TS - g.W);
        d.cam.y = U.clamp(p.y - g.H / 2, 0, MH * TS - g.H);

        // Digging: hold the left button on a tile within reach. Placing (right
        // button, or the PLACE pad on touch) must not dig at the same time.
        if (i.pdown && i.pbutton === 0 && !i.down('b')) {
          var wx = i.px + d.cam.x, wy = i.py + d.cam.y;
          var tx = Math.floor(wx / TS), ty = Math.floor(wy / TS);
          var reach = U.dist(wx, wy, p.x, p.y + p.h / 2) < TS * 5.5;
          var t = at(d, tx, ty);
          if (reach && t) {
            if (!d.digging || d.digging.x !== tx || d.digging.y !== ty) {
              d.digging = { x: tx, y: ty };
              d.digT = 0;
            }
            d.digT += dt;
            if (d.digT >= TILES[t].hp * 0.22) {
              breakTile(g, tx, ty, t);
              d.digging = null;
              d.digT = 0;
            }
          } else d.digging = null;
        } else { d.digging = null; d.digT = 0; }

        d.parts = d.parts.filter(function (q) {
          q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 700 * dt; q.life -= dt;
          return q.life > 0;
        });

        d.saveT += dt;
        if (d.saveT > 6) { d.saveT = 0; save(d); }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, p = d.p;
        var sky = c.createLinearGradient(0, 0, 0, g.H);
        var depth = U.clamp((d.cam.y / TS - SURFACE) / 60, 0, 1);
        sky.addColorStop(0, 'hsl(' + (206 - depth * 20) + ',' + (62 - depth * 40) + '%,' + (58 - depth * 50) + '%)');
        sky.addColorStop(1, 'hsl(' + (215 - depth * 15) + ',' + (50 - depth * 34) + '%,' + (30 - depth * 25) + '%)');
        c.fillStyle = sky;
        c.fillRect(0, 0, g.W, g.H);

        var x0 = Math.floor(d.cam.x / TS), x1 = Math.ceil((d.cam.x + g.W) / TS);
        var y0 = Math.floor(d.cam.y / TS), y1 = Math.ceil((d.cam.y + g.H) / TS);

        for (var y = y0; y <= y1; y++) {
          for (var x = x0; x <= x1; x++) {
            var t = at(d, x, y);
            if (!t) continue;
            var def = TILES[t];
            var px = x * TS - d.cam.x, py = y * TS - d.cam.y;
            c.fillStyle = def.col;
            c.fillRect(px, py, TS, TS);
            // Subtle per-tile shading so large areas don't read as flat.
            var n = U.hash2(x, y, 5);
            c.fillStyle = 'rgba(0,0,0,' + (n * .16).toFixed(3) + ')';
            c.fillRect(px, py, TS, TS);
            if (t === 1) { c.fillStyle = def.top; c.fillRect(px, py, TS, 5); }
            if (def.ore) {
              c.fillStyle = 'rgba(255,255,255,.32)';
              c.beginPath();
              c.arc(px + TS * .35, py + TS * .38, 2.4, 0, 7);
              c.arc(px + TS * .68, py + TS * .66, 1.9, 0, 7);
              c.fill();
            }
            if (def.glow) {
              c.fillStyle = 'rgba(255,210,87,.25)';
              c.beginPath(); c.arc(px + TS / 2, py + TS / 2, TS * 1.6, 0, 7); c.fill();
            }
          }
        }

        // dig progress
        if (d.digging) {
          var t2 = at(d, d.digging.x, d.digging.y);
          if (t2) {
            var frac = U.clamp(d.digT / (TILES[t2].hp * 0.22), 0, 1);
            var dx = d.digging.x * TS - d.cam.x, dy = d.digging.y * TS - d.cam.y;
            c.strokeStyle = '#fff'; c.lineWidth = 2;
            c.strokeRect(dx + 1, dy + 1, TS - 2, TS - 2);
            c.fillStyle = 'rgba(255,255,255,' + (frac * .45) + ')';
            c.fillRect(dx, dy, TS, TS);
          }
        }

        d.parts.forEach(function (q) {
          c.globalAlpha = Math.max(0, q.life / q.max);
          c.fillStyle = q.col;
          c.fillRect(q.x - d.cam.x - 2, q.y - d.cam.y - 2, 4, 4);
        });
        c.globalAlpha = 1;

        // player
        var px2 = p.x - d.cam.x, py2 = p.y - d.cam.y;
        c.fillStyle = '#22d3ee';
        U.roundRect(c, px2 - p.w / 2, py2, p.w, p.h, 4); c.fill();
        c.fillStyle = '#e9f4ff';
        c.beginPath(); c.arc(px2, py2 + 7, 5.5, 0, 7); c.fill();
        c.fillStyle = '#0d2740';
        c.fillRect(px2 - 3 + (p.vx > 5 ? 2 : p.vx < -5 ? -2 : 0), py2 + 5, 2, 2.5);
        c.fillRect(px2 + 1 + (p.vx > 5 ? 2 : p.vx < -5 ? -2 : 0), py2 + 5, 2, 2.5);

        // Hotbar, lifted clear of the on-screen d-pad when there is one.
        var touch = Milo.touchLayout();
        var hbW = PLACEABLE.length * 40;
        var hx = (g.W - hbW) / 2, hy = g.H - (touch ? 178 : 52);
        c.fillStyle = 'rgba(8,10,26,.6)';
        U.roundRect(c, hx - 6, hy - 6, hbW + 12, 46, 10); c.fill();
        PLACEABLE.forEach(function (id, i2) {
          var def = TILES[id];
          var have = d.inv[id] || 0;
          c.fillStyle = def.col;
          U.roundRect(c, hx + i2 * 40 + 3, hy, 34, 34, 6); c.fill();
          c.strokeStyle = i2 === d.slot ? '#fff' : 'rgba(255,255,255,.2)';
          c.lineWidth = i2 === d.slot ? 2.5 : 1;
          U.roundRect(c, hx + i2 * 40 + 3, hy, 34, 34, 6); c.stroke();
          c.fillStyle = have ? '#fff' : '#ff9aa8';
          c.font = '700 10px Outfit, sans-serif';
          c.textAlign = 'right';
          c.fillText(have, hx + i2 * 40 + 34, hy + 31);
        });

        c.fillStyle = 'rgba(255,255,255,.55)';
        c.font = '600 12px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText(touch ? 'Tap to dig  ·  hold PLACE and tap to build'
          : 'Left click: dig   ·   Right click: place   ·   1–6 or scroll: choose block',
          g.W / 2, hy - 12);
      },

      destroy: function (g) { if (g.data.map) save(g.data); }
    });

    function breakTile(g, tx, ty, t) {
      var d = g.data, def = TILES[t];
      setTile(d, tx, ty, 0);
      d.mined++;
      g.set('Mined', d.mined);
      d.inv[t] = (d.inv[t] || 0) + 1;
      if (def.ore) {
        d.coins += def.value;
        g.score = d.coins;
        g.set('Coins', U.fmt(d.coins));
        Milo.store.setBest('terra-dig', d.coins);
        Milo.sound.coin();
      } else {
        Milo.sound.tone({ f: 200 + Math.random() * 60, f2: 130, d: .07, v: .06, type: 'square' });
      }
      updateInvStat(g);
      for (var i = 0; i < 8; i++) {
        var a = Math.random() * 6.28;
        d.parts.push({
          x: tx * TS + TS / 2, y: ty * TS + TS / 2,
          vx: Math.cos(a) * U.rand(30, 130), vy: Math.sin(a) * U.rand(30, 130) - 60,
          life: U.rand(.3, .6), max: .6, col: def.col
        });
      }
    }

    function placeAt(g, sx, sy) {
      var d = g.data, p = d.p;
      var wx = sx + d.cam.x, wy = sy + d.cam.y;
      var tx = Math.floor(wx / TS), ty = Math.floor(wy / TS);
      if (at(d, tx, ty)) return;
      if (U.dist(wx, wy, p.x, p.y + p.h / 2) > TS * 5.5) return;
      // Don't wall the player into a block.
      var bx = tx * TS, by = ty * TS;
      if (p.x + p.w / 2 > bx && p.x - p.w / 2 < bx + TS &&
        p.y + p.h > by && p.y < by + TS) return;

      var id = PLACEABLE[d.slot];
      if (!d.inv[id]) { Milo.sound.tone({ f: 130, d: .08, v: .05, type: 'square' }); return; }
      d.inv[id]--;
      setTile(d, tx, ty, id);
      updateInvStat(g);
      Milo.sound.tone({ f: 340, f2: 420, d: .06, v: .06, type: 'triangle' });
    }
  }

  window.Milo.register({
    id: 'terra-dig', title: 'Terra Dig', emo: '🪓', category: 'Sandbox',
    tagline: 'Dig deep, strike gems, build back up',
    description: 'A side-on world you can tunnel straight through. Hold the left button ' +
      'to dig — harder rock takes longer — and everything you break goes into your ' +
      'inventory. Coal, iron, gold and gems are worth coins, and the deeper you go the ' +
      'better the seams get. Right-click to build with what you have collected. Your ' +
      'world and inventory are saved in this browser.',
    controls: ['A D move', 'W / Space jump', 'Left click dig', 'Right click place', '1–6 blocks'],
    colors: ['#8b5a2b', '#22d3ee'],
    featured: true,
    tags: ['sandbox', 'mining', 'building', '2d', 'exploration'],
    mount: mount
  });
})();
