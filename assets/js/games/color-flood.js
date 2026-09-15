/* Color Flood — swallow the whole board from the top-left corner. */
(function () {
  'use strict';
  var W = 520, H = 720;
  var BOARD = 430, BX = (W - BOARD) / 2, BY = 108;
  var PAL = ['#ef4444', '#fb923c', '#facc15', '#22c55e', '#22d3ee', '#818cf8', '#f472b6'];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    /* mulberry32 — small seeded RNG so a board can be reproduced by number. */
    function rng(seed) {
      var s = seed >>> 0;
      return function () {
        s = (s + 0x6D2B79F5) >>> 0;
        var t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    function spec(lv) {
      return {
        n: Math.min(18, 8 + Math.floor((lv + 1) / 2)),
        c: Math.min(PAL.length, 4 + Math.floor((lv + 2) / 3))
      };
    }

    function reset(g) {
      var d = g.data;
      d.day = Math.floor(Date.now() / 86400000);
      d.level = 1;
      d.parts = [];
      d.flash = 0;
      d.banner = null;
      g.score = 0;
      buildBoard(g);
      g.set('Score', 0);
    }

    function buildBoard(g) {
      var d = g.data;
      var sp = spec(d.level);
      var n = d.n = sp.n, nc = d.nc = sp.c;
      d.boardNo = d.day * 100 + d.level;
      var r = rng(d.boardNo * 2654435761 % 4294967296);
      d.col = new Array(n * n);
      d.prev = new Array(n * n);
      d.t0 = new Array(n * n);
      d.pulse = new Array(n * n);
      for (var i = 0; i < n * n; i++) {
        d.col[i] = Math.floor(r() * nc);
        d.prev[i] = d.col[i];
        d.t0[i] = -9;
        d.pulse[i] = -9;
      }
      d.moves = Math.ceil((n + nc) * 1.35);
      d.used = 0;
      d.cell = BOARD / n;
      d.clock = 0;
      d.done = false;
      recount(d);
      g.set('Level', d.level);
      g.set('Moves', d.moves);
    }

    /** Indices reachable from the corner through one continuous colour. */
    function regionOf(d, colArr) {
      var n = d.n, target = colArr[0];
      var seen = new Uint8Array(n * n), stack = [0], out = [];
      seen[0] = 1;
      while (stack.length) {
        var i = stack.pop();
        out.push(i);
        var x = i % n, y = (i / n) | 0;
        if (x > 0 && !seen[i - 1] && colArr[i - 1] === target) { seen[i - 1] = 1; stack.push(i - 1); }
        if (x < n - 1 && !seen[i + 1] && colArr[i + 1] === target) { seen[i + 1] = 1; stack.push(i + 1); }
        if (y > 0 && !seen[i - n] && colArr[i - n] === target) { seen[i - n] = 1; stack.push(i - n); }
        if (y < n - 1 && !seen[i + n] && colArr[i + n] === target) { seen[i + n] = 1; stack.push(i + n); }
      }
      return { list: out, mask: seen };
    }

    /** Refresh the owned region plus the "cells gained" preview per swatch. */
    function recount(d) {
      var reg = regionOf(d, d.col);
      d.region = reg.mask;
      d.owned = reg.list.length;
      d.gain = [];
      for (var c = 0; c < d.nc; c++) {
        if (c === d.col[0]) { d.gain.push(0); continue; }
        var test = d.col.slice();
        for (var k = 0; k < reg.list.length; k++) test[reg.list[k]] = c;
        d.gain.push(regionOf(d, test).list.length - reg.list.length);
      }
    }

    function pick(g, c) {
      var d = g.data;
      if (d.done || c >= d.nc || c === d.col[0]) return;
      var n = d.n;
      var before = regionOf(d, d.col).mask;
      var i, k;
      for (i = 0; i < n * n; i++) {
        if (before[i]) { d.prev[i] = d.col[i]; d.col[i] = c; d.t0[i] = d.clock; }
      }
      var after = regionOf(d, d.col);
      var added = 0;
      for (k = 0; k < after.list.length; k++) {
        i = after.list[k];
        if (!before[i]) {
          added++;
          d.pulse[i] = d.clock + 0.02;
          if (added % 3 === 0) spark(d, i, PAL[c]);
        }
      }
      d.used++;
      d.owned = after.list.length;
      d.region = after.mask;
      recount(d);

      g.score += added * 2;
      g.set('Score', U.fmt(g.score));
      g.set('Moves', Math.max(0, d.moves - d.used));
      d.flash = 0.16;

      if (added > 0) Milo.sound.tone({ f: 260 + added * 4, f2: 380 + added * 5, d: .07, v: .05, type: 'triangle' });
      else Milo.sound.tone({ f: 200, f2: 140, d: .09, v: .05, type: 'sawtooth' });

      if (d.owned >= n * n) {
        var left = d.moves - d.used;
        var bonus = 120 * d.level + 40 * left;
        g.score += bonus;
        g.set('Score', U.fmt(g.score));
        d.banner = { text: 'Board ' + d.level + ' flooded  +' + bonus, t: 1.6 };
        Milo.sound.win();
        d.done = true;
        d.nextIn = 1.1;
      } else if (d.used >= d.moves) {
        d.done = true;
        var pct = Math.round(d.owned / (n * n) * 100);
        Milo.sound.explode();
        g.gameOver({
          emo: '🎨',
          title: 'Out of moves',
          text: 'Board ' + d.level + ' was ' + pct + '% flooded when the moves ran out.'
        });
      }
    }

    function spark(d, i, col) {
      var n = d.n, cs = d.cell;
      var x = BX + (i % n) * cs + cs / 2, y = BY + (((i / n) | 0)) * cs + cs / 2;
      for (var k = 0; k < 2; k++) {
        var a = Math.random() * 6.283, s = U.rand(40, 150);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: .45, max: .45, col: col });
      }
    }

    function swatchAt(d, x, y) {
      var n = d.nc, gapW = BOARD / n, r = Math.min(30, gapW / 2 - 5);
      for (var c = 0; c < n; c++) {
        var cx = BX + gapW * (c + 0.5), cy = BY + BOARD + 62;
        if (U.dist(x, y, cx, cy) < r + 8) return c;
      }
      return -1;
    }

    return Milo.arcade(host, {
      id: 'color-flood',
      w: W, h: H, bg: '#0b0e24',
      stats: ['Score', 'Level', 'Moves'],
      emo: '🎨',
      start: {
        title: 'Color Flood',
        text: 'The top-left corner is yours. Pick a colour and your blob becomes it, ' +
          'swallowing every touching cell of that colour. Fill the whole board before ' +
          'the move counter runs out — the number on each swatch is what it would gain.',
        keys: ['Click a colour', '1 – 7']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        if (type !== 'down') return;
        var c = swatchAt(g.data, x, y);
        if (c >= 0) pick(g, c);
      },
      onKey: function (g, e) {
        var m = /^Digit([1-7])$/.exec(e.code);
        if (m) pick(g, parseInt(m[1], 10) - 1);
      },

      update: function (g, dt) {
        var d = g.data;
        d.clock += dt;
        if (d.flash > 0) d.flash -= dt;
        if (d.banner) { d.banner.t -= dt; if (d.banner.t <= 0) d.banner = null; }
        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; p.life -= dt;
          return p.life > 0;
        });
        if (d.done && d.nextIn != null) {
          d.nextIn -= dt;
          if (d.nextIn <= 0) {
            d.nextIn = null;
            d.level++;
            buildBoard(g);
          }
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, n = d.n, cs = d.cell;
        var bg = c.createLinearGradient(0, 0, W, H);
        bg.addColorStop(0, '#141a45'); bg.addColorStop(1, '#070818');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        // faint grid glow behind the board
        c.fillStyle = 'rgba(255,255,255,.04)';
        U.roundRect(c, BX - 10, BY - 10, BOARD + 20, BOARD + 20, 16);
        c.fill();

        for (var i = 0; i < n * n; i++) {
          var x = BX + (i % n) * cs, y = BY + (((i / n) | 0)) * cs;
          var age = d.clock - d.t0[i];
          var col = PAL[d.col[i]];
          var inset = 1;
          if (age >= 0 && age < .26) {
            var k = age / .26;
            col = k < .5 ? PAL[d.prev[i]] : PAL[d.col[i]];
            inset = 1 + Math.sin(k * Math.PI) * (cs * 0.16);
          }
          var pa = d.clock - d.pulse[i];
          if (pa >= 0 && pa < .3) inset = 1 + Math.sin(pa / .3 * Math.PI) * (cs * 0.12);

          c.fillStyle = col;
          U.roundRect(c, x + inset, y + inset, cs - inset * 2, cs - inset * 2, Math.min(6, cs * 0.22));
          c.fill();
          c.fillStyle = 'rgba(255,255,255,.16)';
          U.roundRect(c, x + inset, y + inset, cs - inset * 2, (cs - inset * 2) * 0.38, Math.min(6, cs * 0.22));
          c.fill();
        }

        // outline of the owned blob
        c.strokeStyle = d.flash > 0 ? '#ffffff' : 'rgba(255,255,255,.85)';
        c.lineWidth = d.flash > 0 ? 4 : 2.5;
        c.beginPath();
        for (i = 0; i < n * n; i++) {
          if (!d.region[i]) continue;
          var gx = i % n, gy = (i / n) | 0;
          var px = BX + gx * cs, py = BY + gy * cs;
          if (gy === 0 || !d.region[i - n]) { c.moveTo(px, py); c.lineTo(px + cs, py); }
          if (gy === n - 1 || !d.region[i + n]) { c.moveTo(px, py + cs); c.lineTo(px + cs, py + cs); }
          if (gx === 0 || !d.region[i - 1]) { c.moveTo(px, py); c.lineTo(px, py + cs); }
          if (gx === n - 1 || !d.region[i + 1]) { c.moveTo(px + cs, py); c.lineTo(px + cs, py + cs); }
        }
        c.stroke();

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - 2.5, p.y - 2.5, 5, 5);
        });
        c.globalAlpha = 1;

        // swatches
        var gapW = BOARD / d.nc, r = Math.min(30, gapW / 2 - 5);
        for (var s = 0; s < d.nc; s++) {
          var cx = BX + gapW * (s + 0.5), cy = BY + BOARD + 62;
          var cur = s === d.col[0];
          c.fillStyle = PAL[s];
          c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill();
          if (cur) {
            c.strokeStyle = '#fff'; c.lineWidth = 3;
            c.beginPath(); c.arc(cx, cy, r + 5, 0, 7); c.stroke();
          }
          c.fillStyle = 'rgba(0,0,0,.35)';
          c.beginPath(); c.arc(cx, cy + r * .28, r * .62, 0, 7); c.fill();
          c.fillStyle = '#fff';
          c.font = '800 15px Outfit, system-ui, sans-serif';
          c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText(cur ? '•' : '+' + d.gain[s], cx, cy + r * .28);
          c.fillStyle = 'rgba(255,255,255,.45)';
          c.font = '700 11px Outfit, system-ui, sans-serif';
          c.fillText(String(s + 1), cx, cy - r - 11);
        }

        // header
        c.textAlign = 'center'; c.textBaseline = 'alphabetic';
        c.fillStyle = 'rgba(255,255,255,.55)';
        c.font = '700 13px Outfit, system-ui, sans-serif';
        c.fillText('BOARD #' + d.boardNo + '   ' + n + '×' + n + '   ' +
          Math.round(d.owned / (n * n) * 100) + '% yours', W / 2, BY - 30);

        // move pips
        var total = d.moves, pipW = Math.min(14, (BOARD - 4) / total);
        for (var m = 0; m < total; m++) {
          c.fillStyle = m < d.used ? 'rgba(255,255,255,.14)' : (total - m <= 3 ? '#ef4444' : '#22d3ee');
          c.fillRect(BX + m * pipW + 1, BY - 18, pipW - 3, 7);
        }

        if (d.banner) {
          c.globalAlpha = Math.min(1, d.banner.t);
          c.fillStyle = '#facc15';
          c.font = '800 26px Outfit, system-ui, sans-serif';
          c.textAlign = 'center';
          c.fillText(d.banner.text, W / 2, BY + BOARD / 2);
          c.globalAlpha = 1;
        }
      }
    });
  }

  window.Milo.register({
    id: 'color-flood', title: 'Color Flood', emo: '🎨', category: 'Casual',
    tagline: 'Swallow the board one colour at a time',
    description: 'Your blob starts as the single top-left cell. Each colour you pick repaints ' +
      'the blob and absorbs every touching cell already wearing that colour, so the trick is ' +
      'picking the shade that opens the biggest corridor rather than the one that grabs most ' +
      'now. Each swatch shows exactly how many cells it would gain. Boards grow from 9×9 up ' +
      'to 18×18 and add a seventh colour, and every leftover move at the end is worth 40 points.',
    controls: ['Click', '1 – 7', 'Tap'],
    colors: ['#0b0e24', '#22d3ee'],
    tags: ['flood fill', 'puzzle', 'colours', 'one more go', 'daily'],
    mount: mount
  });
})();
