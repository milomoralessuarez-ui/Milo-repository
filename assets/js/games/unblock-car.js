/* Unblock Car — Rush-Hour-style sliding blocks: free the red car through the exit. */
(function () {
  'use strict';
  var N = 6, EXIT_ROW = 2;
  // [par (minimum moves, BFS-verified), rows]. 'A' is the red car.
  var LEVELS = [
    [2, ["......", "...B..", "AA.B..", "...B..", "......", "......"]],
    [3, ["......", "..B...", "AAB.C.", "....C.", "....C.", "......"]],
    [3, ["..BC..", "..BC..", "AA.C..", ".DDD..", "......", "......"]],
    [3, ["...BBB", "HH.DD.", "AAIG..", "J.IGEE", "JF....", ".F..CC"]],
    [4, ["...B..", "...B..", "AA.B.C", ".....C", ".DDD.C", "......"]],
    [4, ["...GG.", "....D.", ".AAFDC", "..HF.C", "BBHF..", "..H.EE"]],
    [5, ["..B...", "..B.CC", "AAB.D.", ".EEED.", "......", "..FF.."]],
    [5, ["......", "C..BF.", "CAABFD", ".....D", "...GGD", "....EE"]],
    [6, [".IBBB.", "EILLGJ", "EAA.GJ", ".F....", ".FDCCC", "HHDKK."]],
    [6, ["...FFF", "KK.J.B", "AAEJGB", ".IEHG.", "DIEH.C", "D..H.C"]],
    [7, ["....IB", "D..FIB", "DAAFJ.", "..H.J.", "..HCCC", "EEGGG."]],
    [7, [".FFLLK", "..GBBK", "AAG.J.", "EEG.JD", "IICC.D", "HH...D"]],
    [8, [".CC.MM", "..GBBI", "AAGJFI", "KEEJFD", "K..J.D", "KLLHH."]],
    [8, [".H..IB", ".H.DIB", "GAAD.B", "G...EE", "G..FJJ", "...FCC"]],
    [9, ["JJ..IF", "MGGDIF", "MAADIF", "EL.BB.", "EL.HHH", "KK..CC"]],
    [9, [".II.BK", "GGLLBK", "AA.DB.", ".EEDHH", "..FCC.", "..F.JJ"]],
    [10, ["B.EEKK", "B...II", "AALFJD", "G.LFJD", "GM..HH", ".M.CCC"]],
    [10, [".BCCC.", ".BF.GK", "AAFEGK", "JJFELL", ".IIE..", "HHDD.."]],
    [11, ["..BBHH", "..FF.J", ".AAG.J", "DDCG..", "..CIEE", "KKCI.."]],
    [11, [".II.C.", ".BBBC.", "AAF.C.", "..FGG.", "DD..HH", ".EEE.."]],
    [12, ["..DDB.", "JJ..B.", "FAA.BC", "F.H..C", "F.HEEC", ".II.GG"]],
    [12, ["GDIIK.", "GD.HK.", "CAAH.B", "C.FLJB", "C.FLJ.", ".EEEJ."]],
    [13, ["EE.D.H", "...D.H", "AA.D..", ".G....", ".GBB.F", "..CCCF"]],
    [13, ["G.DCCK", "G.D.LK", "AA..LM", "IIIHJM", "BBBHJ.", ".FF.EE"]],
    [14, ["..GHH.", "DDG..B", "FAA.IB", "F...IB", "EECCC.", "..JJ.."]],
    [15, ["LL.DB.", "IHHDB.", "IAA.B.", "..CKK.", "JJCFFE", ".GG..E"]],
    [15, ["JJ...C", "G..BKC", "GAABKI", ".H.B.I", ".HFEE.", "..FDD."]],
    [16, ["ICC.E.", "I.DLEH", "AADL.H", "BBBGG.", "JJ..KK", ".FF..."]],
    [17, ["C..DD.", "C.HHEE", "AAJF..", "..JF.B", "GGGF.B", "...II."]],
    [17, ["EFF.DD", "E..CKK", "AA.C..", "HI.CJJ", "HIMMBL", ".GG.BL"]],
    [18, ["FHHE.I", "F..ECI", ".AAEC.", "LGGKK.", "L.DBBB", "..DJJ."]],
    [20, ["E.BBLL", "E.J.KK", "AAJH..", ".FFHDC", ".GGGDC", "II...C"]],
    [22, ["BBBCM.", "IIJCME", "AAJC.E", "H.GG..", "H.KKDD", "..LLFF"]],
    [24, ["GCCEB.", "G.MEBJ", "AAML.J", "KKFLII", "DDF...", "HHH..."]]
  ];
  var PALETTE = ['#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f97316', '#14b8a6',
    '#ec4899', '#84cc16', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#6366f1', '#d946ef', '#0ea5e9'];

  function rating(par) { return par <= 5 ? 'Easy' : par <= 10 ? 'Medium' : par <= 16 ? 'Hard' : 'Expert'; }

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var lvl = 0, board = null, vehEls = [], ro = null, fx = null, drag = null, hdr = null, movesEl = null;

    /* ---- confetti overlay ---- */
    function makeFx() {
      var cv = document.createElement('canvas');
      cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:5';
      host.appendChild(cv);
      var ctx = cv.getContext('2d'), parts = [], raf = 0, last = 0;
      function size() {
        var r = host.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
        cv.width = Math.max(1, r.width * d); cv.height = Math.max(1, r.height * d);
        ctx.setTransform(d, 0, 0, d, 0, 0);
      }
      function tick(now) {
        var dt = Math.min(.05, (now - last) / 1000); last = now;
        ctx.clearRect(0, 0, cv.width, cv.height);
        for (var i = parts.length - 1; i >= 0; i--) {
          var p = parts[i];
          p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.life -= dt;
          if (p.life <= 0) { parts.splice(i, 1); continue; }
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.globalAlpha = Math.min(1, p.life * 2);
          ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
        if (parts.length) raf = requestAnimationFrame(tick); else { raf = 0; ctx.clearRect(0, 0, cv.width, cv.height); }
      }
      return {
        burst: function (x, y, n, cols) {
          size();
          for (var i = 0; i < n; i++) {
            var a = U.rand(-Math.PI, 0), sp = U.rand(160, 520);
            parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vr: U.rand(-9, 9), rot: U.rand(0, 6),
              w: U.rand(5, 11), h: U.rand(4, 8), c: U.choice(cols), life: U.rand(.9, 1.7) });
          }
          if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
        },
        destroy: function () { cancelAnimationFrame(raf); cv.remove(); }
      };
    }

    /* ---- level parsing ---- */
    function parse(rows) {
      var cells = {}, vs = [];
      for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
        var ch = rows[y][x];
        if (ch === '.') continue;
        (cells[ch] = cells[ch] || []).push([x, y]);
      }
      Object.keys(cells).sort().forEach(function (id, i) {
        var c = cells[id], h = c.length > 1 && c[0][1] === c[1][1];
        var xs = c.map(function (p) { return p[0]; }), ys = c.map(function (p) { return p[1]; });
        vs.push({ id: id, x: Math.min.apply(null, xs), y: Math.min.apply(null, ys), len: c.length, h: h,
          pos: h ? Math.min.apply(null, xs) : Math.min.apply(null, ys),
          col: id === 'A' ? '#ef4444' : PALETTE[(i - 1 + PALETTE.length) % PALETTE.length] });
      });
      return vs;
    }

    function occupied(d, skip) {
      var occ = [];
      for (var i = 0; i < N * N; i++) occ.push(false);
      d.vs.forEach(function (v) {
        if (v === skip) return;
        for (var k = 0; k < v.len; k++) occ[v.h ? v.y * N + v.pos + k : (v.pos + k) * N + v.x] = true;
      });
      return occ;
    }
    function range(d, v) {
      var occ = occupied(d, v), lo = v.pos, hi = v.pos;
      while (lo > 0 && !occ[v.h ? v.y * N + lo - 1 : (lo - 1) * N + v.x]) lo--;
      while (hi + v.len < N && !occ[v.h ? v.y * N + hi + v.len : (hi + v.len) * N + v.x]) hi++;
      return [lo, hi];
    }

    /* ---- DOM ---- */
    function build(g) {
      var d = g.data;
      var wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;height:100%;justify-content:center';

      hdr = document.createElement('div');
      hdr.style.cssText = 'display:flex;gap:14px;align-items:baseline;color:#cbd5e1;font:600 .9rem Outfit,sans-serif;letter-spacing:.01em';
      wrap.appendChild(hdr);

      board = document.createElement('div');
      board.style.cssText = 'position:relative;background:#232a3d;border:7px solid #4b5563;border-radius:14px;' +
        'box-shadow:0 18px 40px rgba(0,0,0,.45), inset 0 0 0 2px #1a2030;touch-action:none;user-select:none;-webkit-user-select:none;' +
        'background-image:linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px);' +
        'background-size:calc(100%/6) calc(100%/6);flex:0 0 auto';
      // exit notch on the right wall
      var gap = document.createElement('div');
      gap.style.cssText = 'position:absolute;right:-7px;top:' + (EXIT_ROW / N * 100) + '%;height:' + (100 / N) + '%;width:7px;background:#232a3d;z-index:3';
      board.appendChild(gap);
      var arrow = document.createElement('div');
      arrow.style.cssText = 'position:absolute;right:-30px;top:' + (EXIT_ROW / N * 100) + '%;height:' + (100 / N) + '%;width:22px;display:grid;place-items:center;color:#fbbf24;font:900 18px Outfit,sans-serif';
      arrow.textContent = '➜';
      board.appendChild(arrow);
      var lane = document.createElement('div');
      lane.style.cssText = 'position:absolute;left:0;right:0;top:' + (EXIT_ROW / N * 100) + '%;height:' + (100 / N) + '%;background:rgba(251,191,36,.07);pointer-events:none';
      board.appendChild(lane);

      vehEls = [];
      d.vs.forEach(function (v, i) {
        var el = document.createElement('div');
        el.dataset.v = i;
        var dark = U.shade(v.col, -.35);
        el.style.cssText = 'position:absolute;border-radius:' + (v.len === 3 ? '8px' : '10px') + ';cursor:' + (v.h ? 'ew-resize' : 'ns-resize') + ';' +
          'background:linear-gradient(' + (v.h ? '180deg' : '90deg') + ',' + U.shade(v.col, .18) + ',' + v.col + ' 55%,' + dark + ');' +
          'box-shadow:0 4px 10px rgba(0,0,0,.45), inset 0 0 0 2px rgba(255,255,255,.15);z-index:2;box-sizing:border-box;' +
          'width:calc(' + (v.h ? v.len : 1) + '*100%/6 - 6px);height:calc(' + (v.h ? 1 : v.len) + '*100%/6 - 6px);margin:3px';
        // windshield + light
        var win = document.createElement('div');
        win.style.cssText = 'position:absolute;background:rgba(15,23,42,.55);border-radius:4px;' +
          (v.h ? 'right:22%;top:18%;bottom:18%;width:16%' : 'bottom:22%;left:18%;right:18%;height:16%');
        el.appendChild(win);
        if (v.id === 'A') {
          var star = document.createElement('div');
          star.style.cssText = 'position:absolute;left:12%;top:50%;transform:translateY(-50%);color:#fff;font:900 clamp(10px,2.2vw,16px) Outfit,sans-serif;opacity:.9';
          star.textContent = '★';
          el.appendChild(star);
        }
        board.appendChild(el);
        vehEls.push(el);
      });
      place(d);

      var bar = document.createElement('div');
      bar.style.cssText = 'display:flex;gap:8px;align-items:center';
      function btn(label, fn) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'btn btn-ghost btn-sm'; b.textContent = label;
        b.addEventListener('click', function (e) { e.stopPropagation(); fn(); });
        bar.appendChild(b); return b;
      }
      btn('↶ Undo', function () { undo(g); });
      btn('↻ Reset level', function () { resetLevel(g); });
      movesEl = document.createElement('div');
      movesEl.style.cssText = 'color:#94a3b8;font:600 .84rem Outfit,sans-serif;margin-left:6px';
      bar.appendChild(movesEl);
      wrap.appendChild(board);
      wrap.appendChild(bar);
      g.root.innerHTML = '';
      g.root.appendChild(wrap);

      board.addEventListener('pointerdown', function (e) { onDown(g, e); });
      board.addEventListener('pointermove', function (e) { onMove(g, e); });
      board.addEventListener('pointerup', function (e) { onUp(g, e); });
      board.addEventListener('pointercancel', function (e) { onUp(g, e); });

      fit(g);
      if (!ro && window.ResizeObserver) { ro = new ResizeObserver(function () { fit(g); }); ro.observe(g.root); }
      header(g);
    }

    function fit(g) {
      if (!board) return;
      var r = g.root.getBoundingClientRect();
      var size = Math.max(160, Math.min(r.width - 70, r.height - 76 - 34 - 46 - 24, 520));
      board.style.width = size + 'px';
      board.style.height = size + 'px';
    }

    function header(g) {
      var d = g.data;
      hdr.innerHTML = '<span style="color:#fff;font-weight:800">Level ' + (lvl + 1) + '<span style="color:#64748b;font-weight:600"> / ' + LEVELS.length + '</span></span>' +
        '<span style="color:' + ({ Easy: '#34d399', Medium: '#fbbf24', Hard: '#fb923c', Expert: '#fb7185' })[rating(d.par)] + '">' + rating(d.par) + '</span>' +
        '<span>Par <b style="color:#fff">' + d.par + '</b></span>';
      movesEl.textContent = d.moves + (d.moves === 1 ? ' move' : ' moves') + (d.moves > d.par ? ' · ' + (d.moves - d.par) + ' over par' : '');
    }

    function place(d) {
      d.vs.forEach(function (v, i) {
        var el = vehEls[i];
        el.style.left = (v.h ? v.pos : v.x) / N * 100 + '%';
        el.style.top = (v.h ? v.y : v.pos) / N * 100 + '%';
      });
    }

    /* ---- input ---- */
    function onDown(g, e) {
      var d = g.data;
      if (g.state !== 'play' || d.done || drag) return;
      var el = e.target.closest('[data-v]');
      if (!el) return;
      var v = d.vs[+el.dataset.v], rg = range(d, v);
      drag = { v: v, el: el, sx: e.clientX, sy: e.clientY, start: v.pos, lo: rg[0], hi: rg[1], cur: v.pos };
      el.style.transition = 'none';
      el.style.zIndex = 4;
      try { board.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      e.preventDefault();
    }
    function onMove(g, e) {
      if (!drag) return;
      var cell = board.clientWidth / N;
      var delta = (drag.v.h ? e.clientX - drag.sx : e.clientY - drag.sy) / cell;
      drag.cur = U.clamp(drag.start + delta, drag.lo, drag.hi);
      if (drag.v.h) drag.el.style.left = drag.cur / N * 100 + '%';
      else drag.el.style.top = drag.cur / N * 100 + '%';
    }
    function onUp(g, e) {
      if (!drag) return;
      var d = g.data, v = drag.v, el = drag.el;
      var fin = U.clamp(Math.round(drag.cur), drag.lo, drag.hi);
      el.style.transition = 'left .12s ease-out, top .12s ease-out';
      el.style.zIndex = 2;
      drag = null;
      if (fin !== v.pos) {
        d.history.push({ v: v, from: v.pos });
        v.pos = fin;
        d.moves++;
        g.set('Moves', d.moves);
        Milo.sound.tone({ f: 170, f2: 120, d: .09, v: .07, type: 'triangle' });
        Milo.sound.noise(.06, .05, 700);
      }
      place(d);
      header(g);
      if (v.id === 'A' && v.pos === N - 2) solved(g);
    }

    function undo(g) {
      var d = g.data;
      if (d.done || g.state !== 'play' || !d.history.length) return;
      var h = d.history.pop();
      h.v.pos = h.from;
      d.moves = Math.max(0, d.moves - 1);
      g.set('Moves', d.moves);
      place(d); header(g);
      Milo.sound.click();
    }
    function resetLevel(g) {
      if (g.state !== 'play' || g.data.done) return;
      load(g);
      Milo.sound.click();
    }

    /* ---- flow ---- */
    function load(g) {
      var d = g.data, L = LEVELS[lvl];
      d.par = L[0];
      d.vs = parse(L[1]);
      d.moves = 0;
      d.history = [];
      d.done = false;
      build(g);
      g.set('Level', lvl + 1);
      g.set('Moves', 0);
      g.set('Par', d.par);
      g.set('Score', U.fmt(g.score));
    }

    function reset(g) {
      lvl = U.clamp(lvl | 0, 0, LEVELS.length - 1);
      if (!fx) fx = makeFx();
      load(g);
    }

    function solved(g) {
      var d = g.data;
      d.done = true;
      var a = d.vs.filter(function (v) { return v.id === 'A'; })[0];
      var el = vehEls[d.vs.indexOf(a)];
      el.style.transition = 'left .55s cubic-bezier(.4,0,1,1)';
      el.style.left = '125%';
      board.style.overflow = 'hidden';
      Milo.sound.tone({ f: 220, f2: 520, d: .35, v: .09, type: 'sawtooth' });
      var over = d.moves - d.par;
      var stars = over <= 0 ? 3 : over <= 3 ? 2 : 1;
      var earned = Math.max(60, 200 + d.par * 40 - Math.max(0, over) * 20);
      g.score += earned;
      g.set('Score', U.fmt(g.score));
      var br = board.getBoundingClientRect(), hr = host.getBoundingClientRect();
      fx.burst(br.right - hr.left, br.top - hr.top + br.height * (EXIT_ROW + .5) / N, 70, ['#ef4444', '#fbbf24', '#fff', '#3b82f6', '#22c55e']);
      var last = lvl >= LEVELS.length - 1;
      Milo.store.set('unblock-car:lvl', last ? 0 : lvl + 1);
      setTimeout(function () {
        Milo.sound.win();
        if (last) {
          g.win({ emo: '🏁', title: 'Every jam cleared!', text: 'All ' + LEVELS.length + ' levels solved. Final level: ' + d.moves + ' moves against a par of ' + d.par + '.', score: g.score });
          return;
        }
        lvl++;
        g.overlay({
          emo: stars === 3 ? '⭐' : '🚗', title: stars === 3 ? 'Perfect — on par!' : 'Car freed!',
          text: d.moves + ' moves (par ' + d.par + ') · ' + '★'.repeat(stars) + '☆'.repeat(3 - stars) + ' · +' + earned + ' points',
          score: g.score, best: g.best, newBest: Milo.store.setBest('unblock-car', g.score),
          actions: [
            { label: 'Next level →', primary: true, onClick: function () { next(g); } },
            { label: 'Replay level', onClick: function () { lvl--; next(g); } },
            { label: 'Start over', onClick: function () { lvl = 0; Milo.store.set('unblock-car:lvl', 0); g.restart(); } }
          ]
        });
      }, 620);
    }

    function next(g) {
      g.clearOverlay();
      var keep = g.score;
      reset(g);
      g.score = keep;
      g.set('Score', U.fmt(keep));
      g.state = 'play';
      g.best = Milo.store.best('unblock-car');
    }

    var saved = Milo.store.get('unblock-car:lvl', 0) | 0;
    return Milo.domGame(host, {
      id: 'unblock-car',
      stats: ['Level', 'Moves', 'Par', 'Score'],
      bg: '#151a29',
      emo: '🚗',
      start: {
        title: 'Unblock Car',
        text: 'Slide the cars and trucks along their lanes to open a path for the red car ' +
          'and drive it out of the exit on the right. Every level is rated by the fewest moves ' +
          'that can solve it — match par for three stars.' + (saved > 0 ? ' Resuming at level ' + (saved + 1) + '.' : ''),
        keys: ['Drag a vehicle', 'U undo', 'R reset']
      },
      preload: function () { lvl = U.clamp(saved, 0, LEVELS.length - 1); },
      init: reset,
      onKey: function (g, e) {
        if (e.code === 'KeyU') undo(g);
        if (e.code === 'KeyR') resetLevel(g);
      },
      destroy: function () {
        if (ro) { ro.disconnect(); ro = null; }
        if (fx) { fx.destroy(); fx = null; }
      }
    });
  }

  window.Milo.register({
    id: 'unblock-car', title: 'Unblock Car', emo: '🚗', category: 'Puzzle',
    tagline: 'Slide the traffic apart and drive the red car out',
    description: 'A six-by-six car park with one exit. Cars slide two squares, trucks three, ' +
      'and each only moves along its own axis, so the trick is working out which vehicle is ' +
      'really in the way. All 34 levels were solved by a breadth-first search, and that ' +
      'minimum-move count is your par: match it for three stars, drift more than three over ' +
      'and you drop to one. Tip: on the expert boards, look at what is blocking the blockers ' +
      'before you touch anything.',
    controls: ['Drag a vehicle', 'U undo', 'R reset'],
    colors: ['#ef4444', '#4b5563'],
    tags: ['rush hour', 'sliding', 'logic', 'brain', 'levels'],
    mount: mount
  });
})();
