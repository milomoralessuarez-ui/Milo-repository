/* Eight Queens+ — place N queens so none attack each other, N growing from 4 to 10. */
(function () {
  'use strict';
  var SIZES = [4, 5, 6, 7, 8, 9, 10];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var stage = 0, boardEl = null, cells = [], ro = null, fx = null, hdr = null;

    /* ---- sparkle overlay ---- */
    function makeFx() {
      var cv = document.createElement('canvas');
      cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:5';
      host.appendChild(cv);
      var ctx = cv.getContext('2d'), parts = [], raf = 0, last = 0;
      function size() {
        var r = host.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
        cv.width = Math.max(1, r.width * d); cv.height = Math.max(1, r.height * d); ctx.setTransform(d, 0, 0, d, 0, 0);
      }
      function star(x, y, r, rot) {
        ctx.beginPath();
        for (var i = 0; i < 10; i++) { var rr = i % 2 ? r * .45 : r, a = rot + i * Math.PI / 5; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
        ctx.closePath(); ctx.fill();
      }
      function tick(now) {
        var dt = Math.min(.05, (now - last) / 1000); last = now;
        ctx.clearRect(0, 0, cv.width, cv.height);
        for (var i = parts.length - 1; i >= 0; i--) {
          var p = parts[i]; p.t += dt;
          if (p.t > p.life) { parts.splice(i, 1); continue; }
          p.vy += 260 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += dt * 4;
          ctx.globalAlpha = 1 - p.t / p.life; ctx.fillStyle = p.c;
          star(p.x, p.y, p.r * (1 - p.t / p.life * .5), p.rot);
        }
        ctx.globalAlpha = 1;
        if (parts.length) raf = requestAnimationFrame(tick); else { raf = 0; ctx.clearRect(0, 0, cv.width, cv.height); }
      }
      return {
        burst: function (x, y, n, cols, power) {
          size();
          for (var i = 0; i < n; i++) { var a = U.rand(0, 6.283), s = U.rand(40, power || 180); parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, r: U.rand(4, 9), c: U.choice(cols), t: 0, life: U.rand(.5, 1.1), rot: U.rand(0, 6) }); }
          if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
        },
        destroy: function () { cancelAnimationFrame(raf); cv.remove(); }
      };
    }

    function reset(g) {
      var d = g.data;
      stage = U.clamp(stage | 0, 0, SIZES.length - 1);
      if (!fx) fx = makeFx();
      d.n = SIZES[stage];
      d.q = [];
      for (var i = 0; i < d.n * d.n; i++) d.q.push(false);
      d.moves = 0;
      d.done = false;
      build(g);
      paint(g);
      g.set('Queens', '0/' + d.n);
      g.set('Moves', 0);
      g.set('Conflicts', 0);
      g.set('Score', U.fmt(g.score));
    }

    function build(g) {
      var d = g.data, n = d.n;
      var wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;height:100%;justify-content:center';
      hdr = document.createElement('div');
      hdr.style.cssText = 'color:#e9d5ff;font:600 .9rem Outfit,sans-serif;text-align:center';
      wrap.appendChild(hdr);

      boardEl = document.createElement('div');
      boardEl.style.cssText = 'display:grid;grid-template-columns:repeat(' + n + ',1fr);grid-template-rows:repeat(' + n + ',1fr);' +
        'border:6px solid #3b1d5e;border-radius:12px;box-shadow:0 18px 40px rgba(0,0,0,.5), inset 0 0 0 1px rgba(255,255,255,.08);overflow:hidden;' +
        'touch-action:manipulation;user-select:none;-webkit-user-select:none;background:#3b1d5e';
      cells = [];
      for (var i = 0; i < n * n; i++) {
        var b = document.createElement('button');
        b.type = 'button';
        b.dataset.i = i;
        var x = i % n, y = (i / n) | 0;
        b.style.cssText = 'border:0;padding:0;cursor:pointer;display:grid;place-items:center;position:relative;' +
          'background:' + ((x + y) % 2 ? '#5b3a8a' : '#e9dcff') + ';font-size:1px;transition:background .15s';
        var q = document.createElement('span');
        q.style.cssText = 'display:block;line-height:1;transform:scale(0);transition:transform .18s cubic-bezier(.2,1.6,.4,1);filter:drop-shadow(0 3px 4px rgba(0,0,0,.45))';
        q.textContent = '♛';
        b.appendChild(q);
        b.addEventListener('click', onCell(g, i));
        boardEl.appendChild(b);
        cells.push(b);
      }
      var tip = document.createElement('div');
      tip.style.cssText = 'color:#a78bfa;font:600 .8rem Outfit,sans-serif;text-align:center';
      tip.textContent = 'Tap a square to place or remove a queen · shaded squares are under attack';
      wrap.appendChild(boardEl);
      wrap.appendChild(tip);
      g.root.innerHTML = '';
      g.root.appendChild(wrap);
      fit(g);
      if (!ro && window.ResizeObserver) { ro = new ResizeObserver(function () { fit(g); }); ro.observe(g.root); }
    }
    function fit(g) {
      if (!boardEl) return;
      var r = g.root.getBoundingClientRect();
      var size = Math.max(160, Math.min(r.width - 40, r.height - 76 - 30 - 30 - 20, 520));
      boardEl.style.width = size + 'px';
      boardEl.style.height = size + 'px';
      var fs = Math.floor(size / g.data.n * .62);
      cells.forEach(function (c) { c.firstChild.style.fontSize = fs + 'px'; });
    }

    function onCell(g, i) {
      return function (e) {
        e.stopPropagation();
        var d = g.data;
        if (g.state !== 'play' || d.done) return;
        var placed = d.q.filter(Boolean).length;
        if (!d.q[i] && placed >= d.n) { Milo.sound.tone({ f: 200, f2: 150, d: .1, v: .06, type: 'square' }); shake(cells[i]); return; }
        d.q[i] = !d.q[i];
        d.moves++;
        g.set('Moves', d.moves);
        if (d.q[i]) {
          Milo.sound.tone({ f: 620, f2: 880, d: .09, v: .07, type: 'triangle' });
          var r = cells[i].getBoundingClientRect(), hr = host.getBoundingClientRect();
          fx.burst(r.left - hr.left + r.width / 2, r.top - hr.top + r.height / 2, 8, ['#fde68a', '#fff', '#c4b5fd'], 120);
        } else Milo.sound.click();
        paint(g);
      };
    }
    function shake(el) {
      el.style.transition = 'transform .08s';
      el.style.transform = 'translateX(-4px)';
      setTimeout(function () { el.style.transform = 'translateX(4px)'; }, 80);
      setTimeout(function () { el.style.transform = ''; }, 160);
    }

    function paint(g) {
      var d = g.data, n = d.n;
      var qs = [];
      d.q.forEach(function (v, i) { if (v) qs.push({ x: i % n, y: (i / n) | 0, i: i }); });
      var attacked = {}, conflictCells = {}, pairs = 0;
      qs.forEach(function (a, ai) {
        for (var i = 0; i < n * n; i++) {
          var x = i % n, y = (i / n) | 0;
          if (i !== a.i && (x === a.x || y === a.y || Math.abs(x - a.x) === Math.abs(y - a.y))) attacked[i] = (attacked[i] || 0) + 1;
        }
        for (var bi = ai + 1; bi < qs.length; bi++) {
          var b = qs[bi];
          if (a.x === b.x || a.y === b.y || Math.abs(a.x - b.x) === Math.abs(a.y - b.y)) { pairs++; conflictCells[a.i] = true; conflictCells[b.i] = true; }
        }
      });
      cells.forEach(function (c, i) {
        var x = i % n, y = (i / n) | 0, light = (x + y) % 2 === 0;
        var q = c.firstChild;
        q.style.transform = d.q[i] ? 'scale(1)' : 'scale(0)';
        q.style.color = conflictCells[i] ? '#fb7185' : '#fbbf24';
        if (d.q[i]) c.style.background = conflictCells[i] ? (light ? '#fecdd3' : '#9f1239') : (light ? '#fef3c7' : '#7c4dbd');
        else if (attacked[i]) c.style.background = light ? '#cbb8ea' : '#4a2d72';
        else c.style.background = light ? '#e9dcff' : '#5b3a8a';
      });
      g.set('Queens', qs.length + '/' + n);
      g.set('Conflicts', pairs);
      hdr.innerHTML = '<b style="color:#fff">' + n + ' queens on ' + n + '×' + n + '</b>' +
        (pairs ? ' · <span style="color:#fb7185">' + pairs + ' attacking pair' + (pairs > 1 ? 's' : '') + '</span>' : qs.length ? ' · <span style="color:#86efac">no conflicts</span>' : ' · stage ' + (stage + 1) + ' of ' + SIZES.length);
      if (qs.length === n && pairs === 0) solved(g);
    }

    function solved(g) {
      var d = g.data;
      d.done = true;
      var extra = d.moves - d.n;
      var earned = Math.max(60, d.n * 100 - extra * 8);
      g.score += earned;
      g.set('Score', U.fmt(g.score));
      Milo.sound.win();
      var hr = host.getBoundingClientRect();
      cells.forEach(function (c, i) {
        if (!d.q[i]) return;
        var r = c.getBoundingClientRect();
        fx.burst(r.left - hr.left + r.width / 2, r.top - hr.top + r.height / 2, 14, ['#fde68a', '#fbbf24', '#fff', '#c4b5fd'], 260);
      });
      var last = stage >= SIZES.length - 1;
      setTimeout(function () {
        if (last) {
          g.win({ emo: '👑', title: 'Ten queens crowned!', text: 'Every board from 4×4 to 10×10 solved. The last took ' + d.moves + ' moves for ' + d.n + ' queens.', score: g.score });
          return;
        }
        stage++;
        g.overlay({
          emo: '👑', title: extra === 0 ? 'Flawless!' : 'Board solved!',
          text: d.moves + ' moves for ' + d.n + ' queens' + (extra > 0 ? ' (' + extra + ' more than needed)' : '') + ' — worth ' + earned + ' points. Next: ' + SIZES[stage] + '×' + SIZES[stage] + '.',
          score: g.score, best: g.best, newBest: Milo.store.setBest('queens-eight', g.score),
          actions: [
            { label: 'Next board →', primary: true, onClick: function () { next(g); } },
            { label: 'Start over', onClick: function () { stage = 0; g.restart(); } }
          ]
        });
      }, 800);
    }
    function next(g) {
      g.clearOverlay();
      var keep = g.score;
      reset(g);
      g.score = keep;
      g.set('Score', U.fmt(keep));
      g.state = 'play';
      g.best = Milo.store.best('queens-eight');
    }

    return Milo.domGame(host, {
      id: 'queens-eight',
      stats: ['Queens', 'Moves', 'Conflicts', 'Score'],
      bg: '#1a0b2e',
      emo: '👑',
      start: {
        title: 'Eight Queens+',
        text: 'Place N queens on an N×N board so that no two share a row, column or diagonal. ' +
          'Start on 4×4 and work up to 10×10. Squares under attack are shaded and queens that ' +
          'can capture each other turn red, so you always know what to fix.',
        keys: ['Tap a square']
      },
      preload: function () { stage = 0; },
      init: reset,
      destroy: function () {
        if (ro) { ro.disconnect(); ro = null; }
        if (fx) { fx.destroy(); fx = null; }
      }
    });
  }

  window.Milo.register({
    id: 'queens-eight', title: 'Eight Queens+', emo: '👑', category: 'Puzzle',
    tagline: 'N queens, no two attacking — from 4×4 up to 10×10',
    description: 'The classic chess problem played as a seven-stage climb. Tap a square to drop ' +
      'a queen; every square she attacks is shaded and any pair that can capture each other ' +
      'glows red, so the board itself explains why a layout fails. Each stage pays 100 points ' +
      'per queen minus 8 for every move beyond the minimum, so removing and re-placing costs ' +
      'you. Tip: on the big boards, work in knight-move steps — two along, one up — and the ' +
      'diagonals mostly take care of themselves.',
    controls: ['Tap a square'],
    colors: ['#5b3a8a', '#fbbf24'],
    tags: ['chess', 'queens', 'logic', 'classic', 'brain'],
    mount: mount
  });
})();
