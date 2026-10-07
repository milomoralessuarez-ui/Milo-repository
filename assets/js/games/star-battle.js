/* Star Battle — every row, column and region gets exactly its quota of stars, none touching. */
(function () {
  'use strict';
  // [stars per row/column/region, region rows] — generator-built, solver-verified unique.
  var PUZZLES = [
    [1, ['AAAAA', 'BBBAD', 'EECCD', 'EEEED', 'EEEEE']],
    [1, ['AAAAB', 'AABBB', 'CAABE', 'DDDDE', 'DDEEE']],
    [1, ['AAACCB', 'CCCCBB', 'ECFFFD', 'EEEFFD', 'EFEEFF', 'EFFFFF']],
    [1, ['AAAABB', 'CCABBB', 'CCCCBE', 'CCDDEE', 'CCDDDE', 'DDDFDE']],
    [1, ['AAAAAC', 'BBAAAC', 'BDACCC', 'DDDCCF', 'DDDEEF', 'DDDFFF']],
    [1, ['CCCCBBA', 'CCCBBBD', 'CCDDBDD', 'CCDDDDD', 'CEEEEDD', 'FFEEEDD', 'FEEGEDD']],
    [1, ['BBDAEEE', 'BDDEEEC', 'DDDDEEC', 'DFDDDEC', 'DFFDEEE', 'FFFDGGE', 'FFFGGEE']],
    [1, ['CAAAAAAA', 'CABBBEAE', 'CABBEEAE', 'CCDDEEEE', 'CCDGGGEG', 'CDDFFGEG', 'CCDDDGGG', 'CCCDDDDH']],
    [1, ['CCCAAAAD', 'CAAAABDD', 'CAADDDDD', 'EAAFFDDD', 'EEEHFFFD', 'EGEHFFFD', 'EGEHHFDD', 'HHHHHDDD']],
    [2, ['CCCGGEEE', 'CCCGEEEE', 'DDGGGEEE', 'DDDDAAAF', 'DDAAAAAF', 'BBBBAAAF', 'BBHHAAFF', 'HHHHHAFF']],
    [2, ['HHHHCCCII', 'BHHCCCIIF', 'BHHHCIIFF', 'BHCCCFFFF', 'HHHECCFFF', 'GGEEEFFFF', 'GGGGEDDDF', 'GGGEEEEAF', 'GEEEEAAAF']],
    [2, ['CCCAHHHHH', 'CCAAAHEEE', 'CCAAAIEEE', 'CBBAAIEII', 'CBBBBIIII', 'CDBFFIIII', 'DDFFFFIGI', 'DDFFFIIGI', 'DDFFFGGGI']],
    [2, ['FFFFFFCCHH', 'FFFAAFCCHH', 'FBFFAFFCHH', 'BBAAAFFCHH', 'BBADDDDCII', 'EEAADADDII', 'EEAAAADDII', 'EEJAGIIIII', 'EJJGGGIIII', 'JJJGGGIIII']],
    [2, ['DDDJJJJJJJ', 'DBBBJJJJJG', 'EBBBIIJJJG', 'EEBBBIJCCG', 'EEEBBIJCCG', 'EAABBIICCC', 'AAAAIIIICC', 'AAFAFIHICC', 'AAFFFIHICC', 'FFFFFFHICC']],
    [2, ['DFFFFFAAAA', 'DDFFFFFFFA', 'DDFFHFHFAA', 'JDJHHHHAAA', 'JJJHHHHHAC', 'EEJHHHHIIC', 'EEEHIIIIIC', 'EEEEBBBIBB', 'EGEGGBBBBB', 'GGGGBBBBBB']]
  ];
  var TINTS = ['#3a3f7c', '#7c3a5f', '#2f6b52', '#7a6531', '#2f5f7a', '#5a3a7c', '#7c3d3d', '#4b7a35', '#33477c', '#7a4c2f'];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var lvl = 0, grid = null, cells = [], ro = null, fx = null, hdr = null;

    /* ---- twinkle overlay ---- */
    function makeFx() {
      var cv = document.createElement('canvas');
      cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:5';
      host.appendChild(cv);
      var ctx = cv.getContext('2d'), parts = [], raf = 0, last = 0;
      function size() {
        var r = host.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
        cv.width = Math.max(1, r.width * d); cv.height = Math.max(1, r.height * d); ctx.setTransform(d, 0, 0, d, 0, 0);
      }
      function tick(now) {
        var dt = Math.min(.05, (now - last) / 1000); last = now;
        ctx.clearRect(0, 0, cv.width, cv.height);
        for (var i = parts.length - 1; i >= 0; i--) {
          var p = parts[i]; p.t += dt;
          if (p.t > p.life) { parts.splice(i, 1); continue; }
          var k = p.t / p.life;
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt;
          ctx.globalAlpha = 1 - k; ctx.strokeStyle = p.c; ctx.lineWidth = 2; ctx.lineCap = 'round';
          var s = p.r * (1 - k * .6);
          ctx.beginPath(); ctx.moveTo(p.x - s, p.y); ctx.lineTo(p.x + s, p.y); ctx.moveTo(p.x, p.y - s); ctx.lineTo(p.x, p.y + s); ctx.stroke();
        }
        ctx.globalAlpha = 1;
        if (parts.length) raf = requestAnimationFrame(tick); else { raf = 0; ctx.clearRect(0, 0, cv.width, cv.height); }
      }
      return {
        twinkle: function (x, y, n, cols, spd) {
          size();
          for (var i = 0; i < n; i++) { var a = U.rand(0, 6.283), s = U.rand(20, spd || 120); parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: U.rand(3, 7), c: U.choice(cols), t: 0, life: U.rand(.4, .9) }); }
          if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
        },
        destroy: function () { cancelAnimationFrame(raf); cv.remove(); }
      };
    }

    function load(g) {
      var d = g.data, P = PUZZLES[lvl];
      d.k = P[0];
      d.n = P[1].length;
      d.reg = [];
      for (var y = 0; y < d.n; y++) for (var x = 0; x < d.n; x++) d.reg.push(P[1][y].charCodeAt(x) - 65);
      d.mark = [];
      for (var i = 0; i < d.n * d.n; i++) d.mark.push(0);   // 0 empty, 1 star, 2 dot
      d.time = 0;
      d.done = false;
      build(g);
      paint(g);
      g.set('Puzzle', (lvl + 1) + '/' + PUZZLES.length);
      g.set('Time', '0:00');
      g.set('Score', U.fmt(g.score));
    }

    function build(g) {
      var d = g.data, n = d.n;
      var wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;height:100%;justify-content:center';
      hdr = document.createElement('div');
      hdr.style.cssText = 'color:#cbd5e1;font:600 .88rem Outfit,sans-serif;text-align:center';
      wrap.appendChild(hdr);
      grid = document.createElement('div');
      grid.style.cssText = 'display:grid;grid-template-columns:repeat(' + n + ',1fr);grid-template-rows:repeat(' + n + ',1fr);' +
        'border:4px solid #e2e8f0;border-radius:8px;background:#e2e8f0;box-shadow:0 18px 40px rgba(0,0,0,.5);overflow:hidden;' +
        'touch-action:manipulation;user-select:none;-webkit-user-select:none';
      cells = [];
      for (var i = 0; i < n * n; i++) {
        var x = i % n, y = (i / n) | 0, r = d.reg[i];
        var b = document.createElement('button');
        b.type = 'button';
        b.dataset.i = i;
        var br = x < n - 1 && d.reg[i + 1] !== r, bb = y < n - 1 && d.reg[i + n] !== r;
        b.style.cssText = 'border:0;padding:0;cursor:pointer;display:grid;place-items:center;position:relative;line-height:1;' +
          'background:' + TINTS[r % TINTS.length] + ';' +
          'border-right:' + (x < n - 1 ? (br ? '3px solid #e2e8f0' : '1px solid rgba(0,0,0,.35)') : '0') + ';' +
          'border-bottom:' + (y < n - 1 ? (bb ? '3px solid #e2e8f0' : '1px solid rgba(0,0,0,.35)') : '0') + ';' +
          'transition:background .12s, box-shadow .12s;color:#fff';
        b.addEventListener('click', onCell(g, i, false));
        b.addEventListener('contextmenu', onCell(g, i, true));
        grid.appendChild(b);
        cells.push(b);
      }
      wrap.appendChild(grid);
      var tip = document.createElement('div');
      tip.style.cssText = 'color:#64748b;font:600 .8rem Outfit,sans-serif;text-align:center';
      tip.textContent = 'Tap: empty → ★ → · → empty · right-click marks a dot · stars may not touch, even diagonally';
      wrap.appendChild(tip);
      g.root.innerHTML = '';
      g.root.appendChild(wrap);
      fit(g);
      if (!ro && window.ResizeObserver) { ro = new ResizeObserver(function () { fit(g); }); ro.observe(g.root); }
    }
    function fit(g) {
      if (!grid) return;
      var r = g.root.getBoundingClientRect();
      var size = Math.max(160, Math.min(r.width - 40, r.height - 76 - 30 - 30 - 16, 520));
      grid.style.width = size + 'px';
      grid.style.height = size + 'px';
      var fs = Math.floor(size / g.data.n * .6);
      cells.forEach(function (c) { c.style.fontSize = fs + 'px'; });
    }

    function onCell(g, i, right) {
      return function (e) {
        e.preventDefault(); e.stopPropagation();
        var d = g.data;
        if (g.state !== 'play' || d.done) return;
        if (right) d.mark[i] = d.mark[i] === 2 ? 0 : 2;
        else d.mark[i] = (d.mark[i] + 1) % 3;
        if (d.mark[i] === 1) {
          Milo.sound.tone({ f: 700, f2: 1000, d: .08, v: .07, type: 'triangle' });
          var r = cells[i].getBoundingClientRect(), hr = host.getBoundingClientRect();
          fx.twinkle(r.left - hr.left + r.width / 2, r.top - hr.top + r.height / 2, 7, ['#fde68a', '#fff'], 90);
        } else Milo.sound.click();
        paint(g);
      };
    }

    function paint(g) {
      var d = g.data, n = d.n, k = d.k;
      var rows = [], cols = [], regs = [], i, x, y;
      for (i = 0; i < n; i++) { rows.push(0); cols.push(0); regs.push(0); }
      var total = 0;
      for (i = 0; i < n * n; i++) if (d.mark[i] === 1) { rows[(i / n) | 0]++; cols[i % n]++; regs[d.reg[i]]++; total++; }
      var touching = {}, bad = 0;
      for (i = 0; i < n * n; i++) {
        if (d.mark[i] !== 1) continue;
        x = i % n; y = (i / n) | 0;
        for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          var px = x + dx, py = y + dy;
          if (px < 0 || py < 0 || px >= n || py >= n) continue;
          if (d.mark[py * n + px] === 1) { touching[i] = true; bad++; }
        }
      }
      var over = 0;
      cells.forEach(function (c, j) {
        x = j % n; y = (j / n) | 0;
        var m = d.mark[j], r = d.reg[j];
        var wrong = m === 1 && (touching[j] || rows[y] > k || cols[x] > k || regs[r] > k);
        c.textContent = m === 1 ? '★' : m === 2 ? '·' : '';
        c.style.color = m === 1 ? (wrong ? '#fb7185' : '#fde047') : 'rgba(255,255,255,.55)';
        c.style.textShadow = m === 1 && !wrong ? '0 0 10px rgba(253,224,71,.7)' : 'none';
        var lineFull = rows[y] === k && cols[x] === k && regs[r] === k;
        c.style.boxShadow = wrong ? 'inset 0 0 0 3px #fb7185' : (m === 1 && lineFull ? 'inset 0 0 0 2px rgba(74,222,128,.7)' : 'none');
        c.style.filter = (rows[y] > k || cols[x] > k || regs[r] > k) ? 'saturate(1.4) brightness(1.15)' : '';
      });
      for (i = 0; i < n; i++) { if (rows[i] > k) over++; if (cols[i] > k) over++; if (regs[i] > k) over++; }
      g.set('Stars', total + '/' + n * k);
      var need = n * k;
      hdr.innerHTML = '<b style="color:#fff">' + n + '×' + n + ' · ' + k + ' star' + (k > 1 ? 's' : '') + ' per row, column and region</b>' +
        (bad ? ' · <span style="color:#fb7185">stars touching</span>' : over ? ' · <span style="color:#fb7185">too many in a line or region</span>' : total === need ? ' · <span style="color:#fbbf24">check the counts…</span>' : ' · ' + (need - total) + ' to place');
      if (!bad && !over && total === need) {
        var ok = true;
        for (i = 0; i < n; i++) if (rows[i] !== k || cols[i] !== k || regs[i] !== k) ok = false;
        if (ok) solved(g);
      }
    }

    function solved(g) {
      var d = g.data;
      d.done = true;
      var earned = Math.max(100, 250 + d.n * d.n * 3 + d.k * 120 - Math.floor(d.time) * 2);
      g.score += earned;
      g.set('Score', U.fmt(g.score));
      Milo.sound.win();
      var hr = host.getBoundingClientRect();
      cells.forEach(function (c, i) {
        if (d.mark[i] !== 1) return;
        var r = c.getBoundingClientRect();
        setTimeout(function () { fx.twinkle(r.left - hr.left + r.width / 2, r.top - hr.top + r.height / 2, 14, ['#fde68a', '#fbbf24', '#fff'], 200); }, i * 12);
      });
      var last = lvl >= PUZZLES.length - 1;
      Milo.store.set('star-battle:lvl', last ? 0 : lvl + 1);
      setTimeout(function () {
        if (last) {
          g.win({ emo: '⭐', title: 'Every sky charted!', text: 'All ' + PUZZLES.length + ' puzzles solved. Final 10×10 two-star grid in ' + U.time(d.time) + '.', score: g.score });
          return;
        }
        lvl++;
        var nxt = PUZZLES[lvl];
        g.overlay({
          emo: '⭐', title: 'Constellation complete!',
          text: U.time(d.time) + ' — worth ' + earned + ' points. Next: ' + nxt[1].length + '×' + nxt[1].length + ' with ' + nxt[0] + ' star' + (nxt[0] > 1 ? 's' : '') + ' per line.',
          score: g.score, best: g.best, newBest: Milo.store.setBest('star-battle', g.score),
          actions: [
            { label: 'Next puzzle →', primary: true, onClick: function () { next(g); } },
            { label: 'Start over', onClick: function () { lvl = 0; Milo.store.set('star-battle:lvl', 0); g.restart(); } }
          ]
        });
      }, 900);
    }
    function next(g) {
      g.clearOverlay();
      var keep = g.score;
      reset(g);
      g.score = keep;
      g.set('Score', U.fmt(keep));
      g.state = 'play';
      g.best = Milo.store.best('star-battle');
    }
    function reset(g) {
      lvl = U.clamp(lvl | 0, 0, PUZZLES.length - 1);
      if (!fx) fx = makeFx();
      load(g);
    }

    var saved = Milo.store.get('star-battle:lvl', 0) | 0;
    return Milo.domGame(host, {
      id: 'star-battle',
      stats: ['Puzzle', 'Stars', 'Time', 'Score'],
      bg: '#0b0f24',
      emo: '⭐',
      start: {
        title: 'Star Battle',
        text: 'Place stars so that every row, every column and every outlined region holds ' +
          'exactly the quota — one star on the small grids, two on the big ones — and no two ' +
          'stars touch, not even at a corner. Dots mark squares you have ruled out.' +
          (saved > 0 ? ' Resuming at puzzle ' + (saved + 1) + '.' : ''),
        keys: ['Tap to cycle', 'Right-click for a dot']
      },
      preload: function () { lvl = U.clamp(saved, 0, PUZZLES.length - 1); },
      init: reset,
      update: function (g, dt) {
        var d = g.data;
        if (d.done) return;
        d.time += dt;
        g.set('Time', U.time(d.time));
      },
      destroy: function () {
        if (ro) { ro.disconnect(); ro = null; }
        if (fx) { fx.destroy(); fx = null; }
      }
    });
  }

  window.Milo.register({
    id: 'star-battle', title: 'Star Battle', emo: '⭐', category: 'Puzzle',
    tagline: 'One star per row, column and region — never touching',
    description: 'A grid carved into bold regions. Each row, each column and each region must ' +
      'end up with exactly the quota of stars, and stars can never be adjacent, diagonals ' +
      'included. Tap cycles a cell through star and dot; a star that breaks a rule turns red ' +
      'at once. Fifteen puzzles: one-star grids from 5×5 to 8×8, then the proper two-star ' +
      '8×8 to 10×10 boards, each solver-checked for a unique answer. Tip: a region that is ' +
      'only two cells wide fixes which columns its stars can use.',
    controls: ['Tap', 'Right-click'],
    colors: ['#3a3f7c', '#fde047'],
    tags: ['logic', 'stars', 'regions', 'brain', 'levels'],
    mount: mount
  });
})();
