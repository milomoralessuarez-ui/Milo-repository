/* Factory Lines — lay belts, splitters and painters until the order cards fill. */
(function () {
  'use strict';

  var CW = 740, CH = 340;
  var FONT = 'Outfit, ui-sans-serif, system-ui, sans-serif';
  var SPEED = 3.1;                       // cells per second
  var DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  var ARROW = ['▶', '▼', '◀', '▲'];

  var COL = {
    w: { n: 'Blank', c: '#cfd6e4', d: '#8e97a8' },
    r: { n: 'Red', c: '#ff5f5f', d: '#b62f2f' },
    b: { n: 'Blue', c: '#4ea8ff', d: '#1f5fa8' },
    y: { n: 'Yellow', c: '#ffd34d', d: '#b78a10' },
    g: { n: 'Green', c: '#5ce08a', d: '#219a52' }
  };

  /* Seventeen hand-built floors. Every one is solvable with the budget given;
     the squeeze is time, waste allowance and how tidy your routing is. */
  var LEVELS = [
    {
      n: 'Loading Bay', cols: 9, rows: 5, time: 50, waste: 8,
      src: [{ x: 0, y: 2, dir: 0, c: 'r', every: 1.5 }],
      snk: [{ x: 8, y: 2, c: 'r', need: 8 }],
      bud: { belt: 14 },
      hint: 'Click cells to lay belt. Click a belt again to turn it.'
    },
    {
      n: 'Around the Pillar', cols: 9, rows: 5, time: 55, waste: 8,
      walls: [[4, 1], [4, 2], [4, 3]],
      src: [{ x: 0, y: 2, dir: 0, c: 'r', every: 1.5 }],
      snk: [{ x: 8, y: 2, c: 'r', need: 8 }],
      bud: { belt: 18 },
      hint: 'Steel pillars cannot be built on. Go over or under.'
    },
    {
      n: 'Two Lines', cols: 10, rows: 6, time: 62, waste: 8,
      src: [{ x: 0, y: 1, dir: 0, c: 'r', every: 1.5 }, { x: 0, y: 4, dir: 0, c: 'b', every: 1.5 }],
      snk: [{ x: 9, y: 1, c: 'r', need: 7 }, { x: 9, y: 4, c: 'b', need: 7 }],
      bud: { belt: 24 },
      hint: 'A crate only counts the colour printed on it. Wrong colour is waste.'
    },
    {
      n: 'Switchback', cols: 9, rows: 6, time: 62, waste: 8,
      walls: [[3, 0], [3, 1], [3, 2], [3, 3], [6, 2], [6, 3], [6, 4], [6, 5]],
      src: [{ x: 0, y: 0, dir: 0, c: 'y', every: 1.4 }],
      snk: [{ x: 8, y: 5, c: 'y', need: 8 }],
      bud: { belt: 28 },
      hint: 'Down the left of the first wall, over the top of the second.'
    },
    {
      n: 'Split the Load', cols: 10, rows: 6, time: 66, waste: 8,
      src: [{ x: 0, y: 2, dir: 0, c: 'r', every: .85 }],
      snk: [{ x: 9, y: 1, c: 'r', need: 7 }, { x: 9, y: 4, c: 'r', need: 7 }],
      bud: { belt: 24, split: 1 },
      hint: 'A splitter sends every other crate a quarter-turn clockwise.'
    },
    {
      n: 'Paint Shop', cols: 9, rows: 5, time: 60, waste: 8,
      src: [{ x: 0, y: 2, dir: 0, c: 'w', every: 1.4 }],
      snk: [{ x: 8, y: 2, c: 'r', need: 8 }],
      bud: { belt: 14, paint: { r: 1 } },
      hint: 'Blanks come off the line grey. Run them through the red painter.'
    },
    {
      n: 'Two Tone', cols: 11, rows: 6, time: 78, waste: 10,
      src: [{ x: 0, y: 2, dir: 0, c: 'w', every: .9 }],
      snk: [{ x: 10, y: 1, c: 'r', need: 6 }, { x: 10, y: 4, c: 'b', need: 6 }],
      bud: { belt: 28, split: 1, paint: { r: 1, b: 1 } },
      hint: 'Split first, then paint each branch its own colour.'
    },
    {
      n: 'Long Haul', cols: 12, rows: 6, time: 82, waste: 10,
      walls: [[3, 0], [3, 1], [6, 4], [6, 5], [9, 0], [9, 1], [9, 2]],
      src: [{ x: 0, y: 0, dir: 0, c: 'y', every: .8 }],
      snk: [{ x: 11, y: 5, c: 'y', need: 14 }],
      bud: { belt: 36 },
      hint: 'One long line, fourteen crates. Keep it moving.'
    },
    {
      n: 'Confluence', cols: 11, rows: 6, time: 74, waste: 10,
      src: [{ x: 0, y: 1, dir: 0, c: 'g', every: 1.2 }, { x: 0, y: 4, dir: 0, c: 'g', every: 1.2 }],
      snk: [{ x: 10, y: 2, c: 'g', need: 14 }],
      bud: { belt: 30 },
      hint: 'Two belts can feed the same cell — they take turns.'
    },
    {
      n: 'Sorting Office', cols: 12, rows: 6, time: 88, waste: 10,
      src: [{ x: 0, y: 2, dir: 0, c: 'w', every: .7 }],
      snk: [{ x: 11, y: 0, c: 'r', need: 6 }, { x: 11, y: 3, c: 'b', need: 6 }, { x: 11, y: 5, c: 'y', need: 5 }],
      bud: { belt: 36, split: 2, paint: { r: 1, b: 1, y: 1 } },
      hint: 'Two splitters make three lanes — but not equal ones.'
    },
    {
      n: 'Tight Budget', cols: 10, rows: 5, time: 66, waste: 6,
      src: [{ x: 0, y: 0, dir: 0, c: 'b', every: 1.2 }],
      snk: [{ x: 9, y: 4, c: 'b', need: 9 }],
      bud: { belt: 13 },
      hint: 'Exactly enough belt for the shortest route. No detours.'
    },
    {
      n: 'Two Grades', cols: 12, rows: 6, time: 84, waste: 8,
      walls: [[5, 2], [5, 3], [6, 2], [6, 3]],
      src: [{ x: 0, y: 1, dir: 0, c: 'w', every: 1 }, { x: 0, y: 4, dir: 0, c: 'w', every: 1 }],
      snk: [{ x: 11, y: 1, c: 'r', need: 8 }, { x: 11, y: 4, c: 'g', need: 8 }],
      bud: { belt: 32, paint: { r: 1, g: 1 } },
      hint: 'Two independent lines. Keep them apart and nothing crosses.'
    },
    {
      n: 'Quality Control', cols: 12, rows: 6, time: 92, waste: 8,
      walls: [[4, 0], [4, 5], [8, 2], [8, 3]],
      src: [{ x: 0, y: 2, dir: 0, c: 'w', every: .65 }],
      snk: [{ x: 11, y: 0, c: 'y', need: 7 }, { x: 11, y: 2, c: 'r', need: 7 }, { x: 11, y: 5, c: 'b', need: 7 }],
      bud: { belt: 40, split: 2, paint: { r: 1, b: 1, y: 1 } },
      hint: 'Paint after the split, never before it.'
    },
    {
      n: 'Double Shift', cols: 12, rows: 6, time: 96, waste: 10,
      src: [{ x: 0, y: 0, dir: 0, c: 'w', every: .8 }, { x: 0, y: 5, dir: 0, c: 'w', every: .8 }],
      snk: [{ x: 11, y: 0, c: 'g', need: 9 }, { x: 11, y: 2, c: 'r', need: 8 }, { x: 11, y: 5, c: 'y', need: 9 }],
      bud: { belt: 42, split: 1, paint: { r: 1, g: 1, y: 1 } },
      hint: 'Two loaders, three crates. One line has to branch.'
    },
    {
      n: 'Night Order', cols: 12, rows: 6, time: 104, waste: 10,
      walls: [[6, 0], [6, 1], [6, 4], [6, 5]],
      src: [{ x: 0, y: 1, dir: 0, c: 'w', every: .6 }, { x: 0, y: 4, dir: 0, c: 'w', every: .6 }],
      snk: [{ x: 11, y: 0, c: 'r', need: 10 }, { x: 11, y: 2, c: 'b', need: 10 },
      { x: 11, y: 3, c: 'y', need: 10 }, { x: 11, y: 5, c: 'g', need: 10 }],
      bud: { belt: 48, split: 3, paint: { r: 1, b: 1, y: 1, g: 1 } },
      hint: 'Forty crates. Every splitter you place halves a lane again.'
    },
    {
      n: 'Rush Order', cols: 11, rows: 6, time: 72, waste: 6,
      walls: [[5, 0], [5, 1], [5, 2]],
      src: [{ x: 0, y: 3, dir: 0, c: 'w', every: .5 }],
      snk: [{ x: 10, y: 1, c: 'b', need: 9 }, { x: 10, y: 5, c: 'y', need: 9 }],
      bud: { belt: 32, split: 1, paint: { b: 1, y: 1 } },
      hint: 'The loader fires twice a second. Build fast, waste nothing.'
    },
    {
      n: 'The Big One', cols: 12, rows: 6, time: 112, waste: 12,
      walls: [[4, 2], [4, 3], [7, 0], [7, 5], [9, 2], [9, 3]],
      src: [{ x: 0, y: 0, dir: 0, c: 'w', every: .55 }, { x: 0, y: 3, dir: 0, c: 'w', every: .55 },
      { x: 0, y: 5, dir: 0, c: 'r', every: 1.1 }],
      snk: [{ x: 11, y: 0, c: 'r', need: 12 }, { x: 11, y: 1, c: 'g', need: 10 },
      { x: 11, y: 4, c: 'b', need: 10 }, { x: 11, y: 5, c: 'y', need: 10 }],
      bud: { belt: 52, split: 3, paint: { r: 1, b: 1, y: 1, g: 1 } },
      hint: 'Last floor. Forty-two crates, three loaders, everything you know.'
    }
  ];

  function h(tag, css, html) {
    var n = document.createElement(tag);
    if (css) n.style.cssText = css;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var els = {}, cv, ctx;

    /* ------------------------------------------------------------- state */

    function reset(g) {
      var d = g.data;
      d.lvl = 0;
      d.total = 0;
      d.parts = [];
      d.anim = 0;
      g.score = 0;
      build(g);
      loadLevel(g);
    }

    function loadLevel(g) {
      var d = g.data, L = LEVELS[d.lvl], x, y;
      d.L = L;
      d.cols = L.cols; d.rows = L.rows;
      d.cell = Math.min(Math.floor((CW - 20) / L.cols), Math.floor((CH - 20) / L.rows));
      d.ox = Math.round((CW - d.cell * L.cols) / 2);
      d.oy = Math.round((CH - d.cell * L.rows) / 2);
      d.tiles = [];
      for (y = 0; y < L.rows; y++) {
        d.tiles.push([]);
        for (x = 0; x < L.cols; x++) d.tiles[y].push(null);
      }
      (L.walls || []).forEach(function (w) { d.tiles[w[1]][w[0]] = { k: 'wall' }; });
      d.srcs = L.src.map(function (s) {
        d.tiles[s.y][s.x] = { k: 'src', dir: s.dir, c: s.c };
        return { x: s.x, y: s.y, dir: s.dir, c: s.c, every: s.every, t: s.every * .35, held: false };
      });
      d.snks = L.snk.map(function (s) {
        d.tiles[s.y][s.x] = { k: 'snk', c: s.c };
        return { x: s.x, y: s.y, c: s.c, need: s.need, got: 0, flash: 0 };
      });
      d.left = { belt: L.bud.belt || 0, split: L.bud.split || 0, paint: {} };
      var pc = L.bud.paint || {};
      for (var k in pc) if (pc.hasOwnProperty(k)) d.left.paint[k] = pc[k];
      d.tools = [{ k: 'belt' }];
      if (d.left.split) d.tools.push({ k: 'split' });
      for (k in d.left.paint) if (d.left.paint.hasOwnProperty(k)) d.tools.push({ k: 'paint', c: k });
      d.tools.push({ k: 'erase' });
      d.tool = 0;
      d.dir = 0;
      d.widgets = [];
      d.waste = 0;
      d.time = L.time;
      d.phase = 'run';
      d.msg = L.hint;
      d.msgT = 6;
      d.parts = [];
      refresh(g);
      render(g);
    }

    function tileAt(d, x, y) {
      if (x < 0 || y < 0 || x >= d.cols || y >= d.rows) return null;
      return d.tiles[y][x];
    }
    function widgetAt(d, x, y) {
      for (var i = 0; i < d.widgets.length; i++) {
        if (d.widgets[i].cx === x && d.widgets[i].cy === y) return d.widgets[i];
      }
      return null;
    }

    /* ------------------------------------------------------------ build */

    function toolCount(d, t) {
      if (t.k === 'belt') return d.left.belt;
      if (t.k === 'split') return d.left.split;
      if (t.k === 'paint') return d.left.paint[t.c] || 0;
      return -1;
    }
    function spend(d, t, n) {
      if (t.k === 'belt') d.left.belt += n;
      else if (t.k === 'split') d.left.split += n;
      else if (t.k === 'paint') d.left.paint[t.c] = (d.left.paint[t.c] || 0) + n;
    }
    function refundTile(d, tile) {
      if (!tile) return;
      if (tile.k === 'belt') d.left.belt++;
      else if (tile.k === 'split') d.left.split++;
      else if (tile.k === 'paint') d.left.paint[tile.c] = (d.left.paint[tile.c] || 0) + 1;
    }

    function place(g, x, y) {
      var d = g.data;
      if (d.phase !== 'run') return;
      var cur = tileAt(d, x, y);
      if (cur && (cur.k === 'wall' || cur.k === 'src' || cur.k === 'snk')) {
        say(d, cur.k === 'wall' ? 'Solid steel — nothing builds there.' :
          cur.k === 'src' ? 'That is the loader.' : 'That is the order crate.');
        return;
      }
      var t = d.tools[d.tool];
      if (t.k === 'erase') {
        if (!cur) return;
        refundTile(d, cur);
        d.tiles[y][x] = null;
        Milo.sound.tone({ f: 220, f2: 160, d: .06, v: .06, type: 'triangle' });
        refresh(g);
        return;
      }
      if (cur && cur.k === t.k && (t.k !== 'paint' || cur.c === t.c)) {
        cur.dir = (cur.dir + 1) % 4;
        Milo.sound.tone({ f: 500, f2: 640, d: .045, v: .05, type: 'square' });
        render(g);
        return;
      }
      if (toolCount(d, t) <= 0) { say(d, 'No ' + t.k + ' left in the budget.'); Milo.sound.tone({ f: 130, d: .1, v: .05 }); return; }
      refundTile(d, cur);
      spend(d, t, -1);
      d.tiles[y][x] = t.k === 'paint' ? { k: 'paint', dir: d.dir, c: t.c } :
        t.k === 'split' ? { k: 'split', dir: d.dir, flip: 0 } : { k: 'belt', dir: d.dir };
      Milo.sound.tone({ f: 380, f2: 520, d: .05, v: .055, type: 'square' });
      puff(d, x, y, 5, ['#8fd3ff', '#ffffff']);
      refresh(g);
    }

    function say(d, m) { d.msg = m; d.msgT = 2.6; }

    /* ------------------------------------------------------------ update */

    function update(g, dt) {
      var d = g.data;
      d.anim += dt;
      stepParts(d, dt);
      if (d.msgT > 0) d.msgT -= dt;
      for (var s = 0; s < d.snks.length; s++) if (d.snks[s].flash > 0) d.snks[s].flash -= dt;

      if (d.phase === 'run') {
        d.time -= dt;
        stepWidgets(g, dt);
        stepSources(g, dt);
        if (d.waste > d.L.waste) {
          fail(g, 'Too much waste — ' + d.waste + ' crates on the floor.');
          return;
        }
        if (d.time <= 0) {
          var done = allDone(d);
          if (!done) { fail(g, 'The shift bell went with the order unfinished.'); return; }
        }
        if (allDone(d)) complete(g);
      }

      d.uiT = (d.uiT || 0) + dt;
      if (d.uiT > .1) { d.uiT = 0; refresh(g); }
      render(g);
    }

    function allDone(d) {
      for (var i = 0; i < d.snks.length; i++) if (d.snks[i].got < d.snks[i].need) return false;
      return true;
    }

    function stepSources(g, dt) {
      var d = g.data;
      for (var i = 0; i < d.srcs.length; i++) {
        var s = d.srcs[i];
        s.t += dt;
        if (s.t < s.every) continue;
        var nx = s.x + DIRS[s.dir][0], ny = s.y + DIRS[s.dir][1];
        var tl = tileAt(d, nx, ny);
        if (!tl || tl.k === 'wall' || tl.k === 'src' || widgetAt(d, nx, ny)) { s.held = true; continue; }
        s.held = false;
        s.t = 0;
        var w = { cx: nx, cy: ny, p: 0, dir: 0, c: s.c };
        enter(g, w, tl, nx, ny);
        if (w.gone) continue;
        d.widgets.push(w);
      }
    }

    /* Entering a cell decides what the crate becomes and which way it leaves. */
    function enter(g, w, tl, x, y) {
      var d = g.data;
      if (tl.k === 'belt') { w.dir = tl.dir; return; }
      if (tl.k === 'paint') { w.c = tl.c; w.dir = tl.dir; puff(d, x, y, 4, [COL[tl.c].c]); return; }
      if (tl.k === 'split') {
        w.dir = tl.flip ? (tl.dir + 1) % 4 : tl.dir;
        tl.flip = tl.flip ? 0 : 1;
        return;
      }
      if (tl.k === 'snk') {
        var s = null;
        for (var i = 0; i < d.snks.length; i++) if (d.snks[i].x === x && d.snks[i].y === y) s = d.snks[i];
        w.gone = true;
        if (s && s.c === w.c && s.got < s.need) {
          s.got++; s.flash = .45;
          var pay = 8 + d.lvl;
          d.total += pay;
          g.score = d.total;
          puff(d, x, y, 10, [COL[s.c].c, '#ffffff']);
          Milo.sound.tone({ f: 660 + s.got * 18, d: .06, v: .07, type: 'square' });
        } else if (s && s.got >= s.need) {
          puff(d, x, y, 5, ['#8e97a8']);
          Milo.sound.click();
        } else {
          d.waste++;
          puff(d, x, y, 8, ['#ff6b6b']);
          Milo.sound.hit();
          say(d, 'Wrong colour in the ' + (s ? COL[s.c].n.toLowerCase() : '') + ' crate.');
        }
        return;
      }
      w.gone = true;
      d.waste++;
      puff(d, x, y, 7, ['#ff6b6b']);
    }

    function stepWidgets(g, dt) {
      var d = g.data;
      for (var i = d.widgets.length - 1; i >= 0; i--) {
        var w = d.widgets[i];
        w.p += SPEED * dt;
        if (w.p < 1) continue;
        var nx = w.cx + DIRS[w.dir][0], ny = w.cy + DIRS[w.dir][1];
        var tl = tileAt(d, nx, ny);
        if (!tl || tl.k === 'wall' || tl.k === 'src') {
          // rolled off the end of the line
          d.widgets.splice(i, 1);
          d.waste++;
          puff(d, nx, ny, 7, ['#ff6b6b', '#ffd166']);
          Milo.sound.tone({ f: 200, f2: 90, d: .12, v: .07, type: 'sawtooth' });
          continue;
        }
        if (widgetAt(d, nx, ny)) { w.p = 1; continue; }
        w.cx = nx; w.cy = ny; w.p = 0;
        enter(g, w, tl, nx, ny);
        if (w.gone) d.widgets.splice(i, 1);
      }
    }

    /* --------------------------------------------------------- particles */

    function puff(d, cx, cy, n, cols) {
      var px = d.ox + (cx + .5) * d.cell, py = d.oy + (cy + .5) * d.cell;
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2, v = 40 + Math.random() * 110;
        d.parts.push({
          x: px, y: py, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, g: 210,
          s: 1.6 + Math.random() * 2.6, c: cols[(Math.random() * cols.length) | 0],
          t: 0, life: .35 + Math.random() * .45
        });
      }
    }
    function stepParts(d, dt) {
      for (var i = d.parts.length - 1; i >= 0; i--) {
        var p = d.parts[i];
        p.t += dt;
        if (p.t >= p.life) { d.parts.splice(i, 1); continue; }
        p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      }
    }

    /* ---------------------------------------------------- level outcomes */

    function complete(g) {
      var d = g.data;
      d.phase = 'done';
      var bonus = Math.round(d.time * 6 + (d.L.waste - d.waste) * 14 + 40 + d.lvl * 12);
      d.bonus = bonus;
      d.total += bonus;
      g.score = d.total;
      Milo.sound.win();
      if (d.lvl >= LEVELS.length - 1) {
        g.win({
          emo: '🏭',
          title: 'Every floor signed off',
          text: 'All ' + LEVELS.length + ' floors cleared. Final bonus ' + bonus + '.',
          score: d.total
        });
        return;
      }
      refresh(g);
    }

    function nextLevel(g) {
      var d = g.data;
      d.lvl++;
      loadLevel(g);
      Milo.sound.blip();
    }

    function fail(g, why) {
      var d = g.data;
      d.phase = 'over';
      Milo.sound.lose();
      g.gameOver({
        emo: '🏭',
        title: 'Line stopped',
        text: why + ' You signed off ' + d.lvl + ' floor' + (d.lvl === 1 ? '' : 's') + ' on floor ' +
          (d.lvl + 1) + ': ' + d.L.n + '.',
        score: d.total
      });
    }

    /* -------------------------------------------------------------- view */

    function build(g) {
      var wrap = h('div', 'display:flex;flex-direction:column;gap:6px;width:100%;max-width:880px;' +
        'height:100%;align-self:stretch;font-family:' + FONT + ';color:#dbe4f0');

      els.bar = h('div', 'flex:0 0 auto;display:flex;gap:8px;align-items:center;flex-wrap:wrap;' +
        'background:rgba(120,170,255,.06);border:1px solid rgba(120,170,255,.18);border-radius:10px;' +
        'padding:4px 10px');

      var box = h('div', 'flex:1 1 auto;min-height:0;position:relative;display:flex;' +
        'align-items:center;justify-content:center');
      cv = document.createElement('canvas');
      cv.width = CW; cv.height = CH;
      cv.style.cssText = 'max-width:100%;max-height:100%;width:auto;height:auto;border-radius:10px;' +
        'cursor:crosshair;box-shadow:0 12px 30px rgba(0,0,0,.6);border:1px solid rgba(120,170,255,.16)';
      ctx = cv.getContext('2d');
      cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      cv.addEventListener('mousedown', function (e) {
        var d = g.data;
        if (g.state !== 'play') return;
        var r = cv.getBoundingClientRect();
        var x = Math.floor(((e.clientX - r.left) * (CW / r.width) - d.ox) / d.cell);
        var y = Math.floor(((e.clientY - r.top) * (CH / r.height) - d.oy) / d.cell);
        if (x < 0 || y < 0 || x >= d.cols || y >= d.rows) return;
        if (e.button === 2) {
          var cur = tileAt(d, x, y);
          if (cur && cur.k !== 'wall' && cur.k !== 'src' && cur.k !== 'snk') {
            refundTile(d, cur); d.tiles[y][x] = null;
            Milo.sound.tone({ f: 220, f2: 160, d: .06, v: .06, type: 'triangle' });
            refresh(g);
          }
          return;
        }
        place(g, x, y);
      });
      cv.addEventListener('touchstart', function (e) {
        var d = g.data;
        if (g.state !== 'play' || !e.touches.length) return;
        var r = cv.getBoundingClientRect();
        var x = Math.floor(((e.touches[0].clientX - r.left) * (CW / r.width) - d.ox) / d.cell);
        var y = Math.floor(((e.touches[0].clientY - r.top) * (CH / r.height) - d.oy) / d.cell);
        if (x >= 0 && y >= 0 && x < d.cols && y < d.rows) { place(g, x, y); e.preventDefault(); }
      }, { passive: false });

      els.done = h('div', 'position:absolute;inset:0;display:none;flex-direction:column;gap:8px;' +
        'align-items:center;justify-content:center;background:rgba(6,12,22,.92);border-radius:10px;padding:12px');
      els.done.addEventListener('click', function (e) {
        if (e.target.closest('[data-next]')) nextLevel(g);
      });
      box.appendChild(cv);
      box.appendChild(els.done);

      els.tools = h('div', 'flex:0 0 auto;display:flex;gap:5px;flex-wrap:wrap;justify-content:center');
      els.tools.addEventListener('click', function (e) {
        var b = e.target.closest('[data-tool]');
        if (b) { g.data.tool = +b.getAttribute('data-tool'); Milo.sound.click(); refresh(g); return; }
        if (e.target.closest('[data-rot]')) { g.data.dir = (g.data.dir + 1) % 4; Milo.sound.click(); refresh(g); }
      });

      els.msg = h('div', 'flex:0 0 auto;min-height:1.2em;text-align:center;font:600 .74rem/1.2 ' +
        FONT + ';color:#ffd166');

      wrap.appendChild(els.bar);
      wrap.appendChild(box);
      wrap.appendChild(els.tools);
      wrap.appendChild(els.msg);
      g.root.innerHTML = '';
      g.root.appendChild(wrap);
    }

    function refresh(g) {
      var d = g.data, i;
      g.set('Score', U.fmt(d.total));
      g.set('Floor', (d.lvl + 1) + '/' + LEVELS.length);
      g.set('Time', U.time(Math.max(0, Math.ceil(d.time))));
      g.set('Waste', d.waste + '/' + d.L.waste);

      var bar = '<span style="font:800 .8rem/1.2 ' + FONT + ';color:#8fd3ff">' +
        (d.lvl + 1) + '. ' + d.L.n + '</span>';
      for (i = 0; i < d.snks.length; i++) {
        var s = d.snks[i], full = s.got >= s.need;
        bar += '<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 7px;border-radius:8px;' +
          'background:' + (full ? 'rgba(92,224,138,.18)' : 'rgba(0,0,0,.28)') + ';' +
          'border:1px solid ' + (full ? 'rgba(92,224,138,.5)' : 'rgba(255,255,255,.1)') + '">' +
          '<span style="width:10px;height:10px;border-radius:3px;background:' + COL[s.c].c + '"></span>' +
          '<span style="font:800 .72rem/1 ' + FONT + ';color:' + (full ? '#5ce08a' : '#dbe4f0') + '">' +
          s.got + '/' + s.need + '</span></span>';
      }
      bar += '<span style="flex:1"></span>' +
        '<span style="font:800 .78rem/1 ' + FONT + ';color:' + (d.time < 12 ? '#ff6b6b' : '#dbe4f0') + '">⏱ ' +
        U.time(Math.max(0, Math.ceil(d.time))) + '</span>' +
        '<span style="font:800 .78rem/1 ' + FONT + ';color:' + (d.waste > d.L.waste * .6 ? '#ff6b6b' : '#8e97a8') +
        '">🗑 ' + d.waste + '/' + d.L.waste + '</span>';
      els.bar.innerHTML = bar;

      var out = [];
      for (i = 0; i < d.tools.length; i++) {
        var t = d.tools[i], sel = d.tool === i;
        var n = toolCount(d, t);
        var label = t.k === 'belt' ? '▬ Belt' : t.k === 'split' ? '⑂ Splitter' :
          t.k === 'paint' ? '🖌 ' + COL[t.c].n : '✖ Erase';
        var col = t.k === 'paint' ? COL[t.c].c : t.k === 'erase' ? '#ff8080' : '#8fd3ff';
        out.push('<button type="button" data-tool="' + i + '" style="display:flex;align-items:center;gap:5px;' +
          'padding:5px 9px;border-radius:9px;cursor:pointer;font:800 .72rem/1 ' + FONT + ';color:#dbe4f0;' +
          'border:1px solid ' + (sel ? col : 'rgba(255,255,255,.1)') + ';' +
          'background:' + (sel ? 'rgba(143,211,255,.14)' : 'rgba(255,255,255,.04)') + ';' +
          'opacity:' + (n === 0 ? .45 : 1) + '">' +
          '<span style="color:' + col + '">' + label + '</span>' +
          (n >= 0 ? '<span style="font:800 .68rem/1 ' + FONT + ';color:' +
            (n > 0 ? '#5ce08a' : '#ff6b6b') + '">' + n + '</span>' : '') +
          '</button>');
      }
      out.push('<button type="button" data-rot="1" style="padding:5px 9px;border-radius:9px;cursor:pointer;' +
        'font:800 .72rem/1 ' + FONT + ';color:#ffd166;border:1px solid rgba(255,209,102,.4);' +
        'background:rgba(255,209,102,.1)">R ' + ARROW[d.dir] + '</button>');
      els.tools.innerHTML = out.join('');

      if (d.phase === 'done') {
        els.done.style.display = 'flex';
        els.done.innerHTML =
          '<div style="font:800 1.4rem/1.2 ' + FONT + ';color:#5ce08a">Floor ' + (d.lvl + 1) + ' signed off</div>' +
          '<div style="font:700 .85rem/1.4 ' + FONT + ';color:#dbe4f0;text-align:center">Bonus ' + d.bonus +
          ' · running total ' + U.fmt(d.total) + '</div>' +
          '<button type="button" data-next="1" style="margin-top:6px;padding:10px 22px;border-radius:11px;' +
          'border:0;cursor:pointer;font:800 .9rem ' + FONT + ';color:#04121f;' +
          'background:linear-gradient(90deg,#8fd3ff,#5ce08a)">Floor ' + (d.lvl + 2) + ': ' +
          LEVELS[Math.min(LEVELS.length - 1, d.lvl + 1)].n + ' →</button>';
      } else els.done.style.display = 'none';

      els.msg.textContent = d.msgT > 0 ? d.msg : '';
    }

    /* -------------------------------------------------------------- draw */

    function render(g) {
      var d = g.data, x, y, cell = d.cell;
      ctx.fillStyle = '#0a1420';
      ctx.fillRect(0, 0, CW, CH);
      ctx.fillStyle = 'rgba(143,211,255,.03)';
      for (var i = 0; i < 90; i++) {
        ctx.fillRect((U.hash2(i, 4, 11) * CW) | 0, (U.hash2(i, 8, 13) * CH) | 0, 2, 2);
      }

      // floor plate
      ctx.fillStyle = '#0e1c2c';
      ctx.fillRect(d.ox - 4, d.oy - 4, cell * d.cols + 8, cell * d.rows + 8);
      ctx.strokeStyle = 'rgba(143,211,255,.14)';
      ctx.lineWidth = 1;
      for (y = 0; y <= d.rows; y++) {
        ctx.beginPath();
        ctx.moveTo(d.ox, d.oy + y * cell); ctx.lineTo(d.ox + d.cols * cell, d.oy + y * cell);
        ctx.stroke();
      }
      for (x = 0; x <= d.cols; x++) {
        ctx.beginPath();
        ctx.moveTo(d.ox + x * cell, d.oy); ctx.lineTo(d.ox + x * cell, d.oy + d.rows * cell);
        ctx.stroke();
      }

      for (y = 0; y < d.rows; y++) for (x = 0; x < d.cols; x++) drawTile(d, x, y, d.tiles[y][x]);
      for (var w = 0; w < d.widgets.length; w++) drawWidget(d, d.widgets[w]);

      for (i = 0; i < d.parts.length; i++) {
        var p = d.parts[i], k = 1 - p.t / p.life;
        ctx.globalAlpha = Math.min(1, k * 1.8);
        ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s * k, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function drawTile(d, x, y, t) {
      if (!t) return;
      var c = d.cell, px = d.ox + x * c, py = d.oy + y * c;
      var cx = px + c / 2, cy = py + c / 2;
      if (t.k === 'wall') {
        ctx.fillStyle = '#2a3646';
        U.roundRect(ctx, px + 2, py + 2, c - 4, c - 4, 4); ctx.fill();
        ctx.strokeStyle = '#3d4e64'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#1b2532';
        ctx.fillRect(px + 6, py + 6, c - 12, 3);
        return;
      }
      if (t.k === 'src') {
        ctx.fillStyle = '#20344a';
        U.roundRect(ctx, px + 2, py + 2, c - 4, c - 4, 6); ctx.fill();
        ctx.strokeStyle = '#8fd3ff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = COL[t.c].c;
        U.roundRect(ctx, cx - c * .16, cy - c * .16, c * .32, c * .32, 3); ctx.fill();
        ctx.fillStyle = '#8fd3ff';
        ctx.font = '700 ' + Math.round(c * .3) + 'px ' + FONT;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(ARROW[t.dir], cx + DIRS[t.dir][0] * c * .32, cy + DIRS[t.dir][1] * c * .32);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        return;
      }
      if (t.k === 'snk') {
        var s = null;
        for (var i = 0; i < d.snks.length; i++) if (d.snks[i].x === x && d.snks[i].y === y) s = d.snks[i];
        var full = s && s.got >= s.need;
        ctx.fillStyle = full ? 'rgba(92,224,138,.25)' : 'rgba(0,0,0,.35)';
        U.roundRect(ctx, px + 2, py + 2, c - 4, c - 4, 6); ctx.fill();
        ctx.strokeStyle = s && s.flash > 0 ? '#ffffff' : (full ? '#5ce08a' : COL[t.c].c);
        ctx.lineWidth = s && s.flash > 0 ? 3.5 : 2.4;
        ctx.stroke();
        ctx.fillStyle = COL[t.c].c;
        U.roundRect(ctx, cx - c * .2, py + c * .16, c * .4, c * .22, 3); ctx.fill();
        ctx.fillStyle = full ? '#5ce08a' : '#dbe4f0';
        ctx.font = '800 ' + Math.round(c * .27) + 'px ' + FONT;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(s ? s.got + '/' + s.need : '', cx, cy + c * .17);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        return;
      }

      // conveyor family
      var base = t.k === 'paint' ? COL[t.c].d : t.k === 'split' ? '#4a3d6b' : '#26374b';
      ctx.fillStyle = base;
      U.roundRect(ctx, px + 2, py + 2, c - 4, c - 4, 5); ctx.fill();
      ctx.strokeStyle = t.k === 'paint' ? COL[t.c].c : t.k === 'split' ? '#b58cff' : '#3d5a78';
      ctx.lineWidth = 1.5; ctx.stroke();

      // animated chevrons along the facing direction
      var dx = DIRS[t.dir][0], dy = DIRS[t.dir][1];
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t.dir * Math.PI / 2);
      ctx.strokeStyle = t.k === 'paint' ? 'rgba(255,255,255,.55)' : 'rgba(143,211,255,.65)';
      ctx.lineWidth = 2;
      var ph = (d.anim * 34) % (c * .38);
      for (var k = -1; k <= 1; k++) {
        var ox = -c * .28 + k * c * .38 + ph;
        if (ox > c * .34) continue;
        ctx.beginPath();
        ctx.moveTo(ox - c * .08, -c * .14);
        ctx.lineTo(ox + c * .06, 0);
        ctx.lineTo(ox - c * .08, c * .14);
        ctx.stroke();
      }
      ctx.restore();

      if (t.k === 'split') {
        var sd = (t.dir + 1) % 4;
        ctx.strokeStyle = 'rgba(181,140,255,.85)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + DIRS[sd][0] * c * .33, cy + DIRS[sd][1] * c * .33);
        ctx.stroke();
        ctx.fillStyle = '#b58cff';
        ctx.beginPath();
        ctx.arc(cx + DIRS[sd][0] * c * .33, cy + DIRS[sd][1] * c * .33, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      if (t.k === 'paint') {
        ctx.fillStyle = COL[t.c].c;
        ctx.beginPath(); ctx.arc(cx, cy, c * .13, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.75)';
        ctx.beginPath(); ctx.arc(cx - c * .04, cy - c * .04, c * .04, 0, Math.PI * 2); ctx.fill();
      }
      // subtle nub showing where it feeds
      ctx.fillStyle = 'rgba(255,255,255,.18)';
      ctx.fillRect(cx + dx * (c * .42) - 2, cy + dy * (c * .42) - 2, 4, 4);
    }

    function drawWidget(d, w) {
      var c = d.cell;
      var px = d.ox + (w.cx + .5 + DIRS[w.dir][0] * Math.min(1, w.p)) * c;
      var py = d.oy + (w.cy + .5 + DIRS[w.dir][1] * Math.min(1, w.p)) * c;
      var s = c * .3;
      ctx.fillStyle = 'rgba(0,0,0,.4)';
      U.roundRect(ctx, px - s / 2 + 2, py - s / 2 + 3, s, s, 3); ctx.fill();
      ctx.fillStyle = COL[w.c].c;
      U.roundRect(ctx, px - s / 2, py - s / 2, s, s, 3); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.4)';
      ctx.fillRect(px - s / 2 + 2, py - s / 2 + 2, s - 4, 2);
    }

    /* -------------------------------------------------------------- keys */

    function onKey(g, e) {
      var d = g.data;
      if (d.phase === 'done') {
        if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); nextLevel(g); }
        return;
      }
      var n = 'Digit1 Digit2 Digit3 Digit4 Digit5 Digit6'.split(' ').indexOf(e.code);
      if (n >= 0 && d.tools[n]) { e.preventDefault(); d.tool = n; refresh(g); return; }
      if (e.code === 'KeyR' || e.code === 'Space') { e.preventDefault(); d.dir = (d.dir + 1) % 4; refresh(g); return; }
      if (e.code === 'KeyE') { e.preventDefault(); d.tool = d.tools.length - 1; refresh(g); return; }
      var ar = { ArrowRight: 0, ArrowDown: 1, ArrowLeft: 2, ArrowUp: 3 }[e.code];
      if (ar != null) { e.preventDefault(); d.dir = ar; refresh(g); }
    }

    return Milo.domGame(host, {
      id: 'factory-lines',
      stats: ['Score', 'Floor', 'Time', 'Waste'],
      bg: 'radial-gradient(circle at 50% 0%, #142639, #0a1420 60%, #060c14)',
      emo: '🏭',
      start: {
        title: 'Factory Lines',
        text: 'Seventeen factory floors. Lay belt from the loaders to the order crates, add splitters to feed ' +
          'two lanes and painters to make the colour the crate wants. Belts that lead nowhere drop crates on ' +
          'the floor, and every floor has a waste allowance.',
        keys: ['Click to build', 'R rotate', '1–6 tools', 'Right-click erase']
      },
      init: reset,
      update: update,
      onKey: onKey
    });
  }

  window.Milo.register({
    id: 'factory-lines',
    title: 'Factory Lines',
    emo: '🏭',
    category: 'Puzzle',
    tagline: 'Seventeen floors of belts, splitters and paint',
    description: 'Each floor gives you loaders that fire crates at a fixed rate, order crates that only count ' +
      'one colour, and a strict budget of belt, splitters and painters. Click a cell to lay the current tool ' +
      'facing the current direction, click it again to turn it, right-click to take it back. Splitters send ' +
      'every other crate a quarter-turn clockwise, painters recolour whatever rolls through them, and a belt ' +
      'pointing into thin air dumps crates on the floor — each floor has a waste allowance and a clock, and the ' +
      'loaders never stop while you build. Later floors want four colours from two grey loaders with only three ' +
      'splitters, so throughput matters as much as the route. Tip: split before you paint — a painter after the ' +
      'split only has to colour half the line.',
    controls: ['Click', 'Right-click', 'R', '1–6', '← ↑ → ↓'],
    colors: ['#8fd3ff', '#142639'],
    tags: ['factory', 'logistics', 'routing', 'levels', 'builder'],
    mount: mount
  });
})();
