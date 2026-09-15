/* Knight's Tour — visit every square exactly once with knight moves, 5×5 up to 8×8. */
(function () {
  'use strict';
  var SIZES = [5, 6, 7, 8];
  var MOVES = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
  var NS = 'http://www.w3.org/2000/svg';

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var stage = 0, boardEl = null, wrapEl = null, cells = [], svg = null, trail = null, knight = null, ro = null, fx = null, hdr = null, tipEl = null;

    /* ---- hoof-dust particles ---- */
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
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy -= 40 * dt; p.vx *= .96;
          var k = p.t / p.life;
          ctx.globalAlpha = (1 - k) * .9; ctx.fillStyle = p.c;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + k * 1.5), 0, 7); ctx.fill();
        }
        ctx.globalAlpha = 1;
        if (parts.length) raf = requestAnimationFrame(tick); else { raf = 0; ctx.clearRect(0, 0, cv.width, cv.height); }
      }
      return {
        puff: function (x, y, n, cols, spd) {
          size();
          for (var i = 0; i < n; i++) { var a = U.rand(0, 6.283), s = U.rand(20, spd || 90); parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: U.rand(2, 5), c: U.choice(cols), t: 0, life: U.rand(.4, .9) }); }
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
      d.visited = [];
      for (var i = 0; i < d.n * d.n; i++) d.visited.push(0);
      d.path = [];
      d.undos = 0;
      d.done = false;
      d.stuck = false;
      build(g);
      paint(g);
      g.set('Board', d.n + '×' + d.n);
      g.set('Visited', '0/' + d.n * d.n);
      g.set('Undos', 0);
      g.set('Score', U.fmt(g.score));
    }

    function el(tag, attrs, parent) {
      var n = document.createElementNS(NS, tag);
      for (var k in attrs) n.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(n);
      return n;
    }

    function build(g) {
      var d = g.data, n = d.n;
      wrapEl = document.createElement('div');
      wrapEl.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;height:100%;justify-content:center';
      hdr = document.createElement('div');
      hdr.style.cssText = 'color:#fde68a;font:700 .92rem Outfit,sans-serif;text-align:center;min-height:1.2em';
      wrapEl.appendChild(hdr);

      var frame = document.createElement('div');
      frame.style.cssText = 'position:relative;border:8px solid #5c3a1e;border-radius:12px;box-shadow:0 18px 40px rgba(0,0,0,.5), inset 0 0 0 2px #2b1a0c;background:#5c3a1e;touch-action:manipulation;user-select:none;-webkit-user-select:none';
      boardEl = document.createElement('div');
      boardEl.style.cssText = 'display:grid;grid-template-columns:repeat(' + n + ',1fr);grid-template-rows:repeat(' + n + ',1fr);width:100%;height:100%';
      cells = [];
      for (var i = 0; i < n * n; i++) {
        var b = document.createElement('button');
        b.type = 'button';
        b.dataset.i = i;
        b.style.cssText = 'border:0;padding:0;cursor:pointer;display:grid;place-items:center;position:relative;font:800 12px Outfit,sans-serif;color:rgba(0,0,0,.5);transition:background .15s';
        b.addEventListener('click', onCell(g, i));
        boardEl.appendChild(b);
        cells.push(b);
      }
      frame.appendChild(boardEl);
      svg = el('svg', { viewBox: '0 0 ' + n * 10 + ' ' + n * 10, preserveAspectRatio: 'none' });
      svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
      trail = el('polyline', { fill: 'none', stroke: '#fbbf24', 'stroke-width': 1.1, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', opacity: .95 }, svg);
      frame.appendChild(svg);
      knight = document.createElement('div');
      knight.style.cssText = 'position:absolute;width:' + (100 / n) + '%;height:' + (100 / n) + '%;display:grid;place-items:center;pointer-events:none;' +
        'transition:left .22s cubic-bezier(.3,1.3,.5,1), top .22s cubic-bezier(.3,1.3,.5,1);filter:drop-shadow(0 4px 5px rgba(0,0,0,.5));opacity:0;line-height:1';
      knight.textContent = '♞';
      frame.appendChild(knight);

      var bar = document.createElement('div');
      bar.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center';
      function btn(label, fn) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'btn btn-ghost btn-sm'; b.textContent = label;
        b.addEventListener('click', function (e) { e.stopPropagation(); fn(); });
        bar.appendChild(b);
      }
      btn('↶ Undo (−15)', function () { undo(g); });
      btn('↻ Reset board', function () { resetBoard(g); });
      tipEl = document.createElement('div');
      tipEl.style.cssText = 'color:#a8a29e;font:600 .8rem Outfit,sans-serif';
      bar.appendChild(tipEl);
      wrapEl.appendChild(frame);
      wrapEl.appendChild(bar);
      g.root.innerHTML = '';
      g.root.appendChild(wrapEl);
      d.frame = frame;
      fit(g);
      if (!ro && window.ResizeObserver) { ro = new ResizeObserver(function () { fit(g); }); ro.observe(g.root); }
    }
    function fit(g) {
      if (!g.data.frame) return;
      var r = g.root.getBoundingClientRect();
      var size = Math.max(160, Math.min(r.width - 40, r.height - 76 - 30 - 46 - 24, 520));
      g.data.frame.style.width = size + 'px';
      g.data.frame.style.height = size + 'px';
      var cs = size / g.data.n;
      knight.style.fontSize = Math.floor(cs * .7) + 'px';
      cells.forEach(function (c) { c.style.fontSize = Math.max(9, Math.floor(cs * .26)) + 'px'; });
    }

    function idx(d, x, y) { return y * d.n + x; }
    function validStart(d, i) {
      if (d.n % 2 === 0) return true;
      return ((i % d.n) + ((i / d.n) | 0)) % 2 === 0;
    }
    function nextMoves(d, i) {
      var x = i % d.n, y = (i / d.n) | 0, out = [];
      MOVES.forEach(function (m) {
        var px = x + m[0], py = y + m[1];
        if (px < 0 || py < 0 || px >= d.n || py >= d.n) return;
        var j = idx(d, px, py);
        if (!d.visited[j]) out.push(j);
      });
      return out;
    }

    function onCell(g, i) {
      return function (e) {
        e.stopPropagation();
        var d = g.data;
        if (g.state !== 'play' || d.done) return;
        if (!d.path.length) {
          if (!validStart(d, i)) { Milo.sound.tone({ f: 200, f2: 150, d: .1, v: .06, type: 'square' }); return; }
          step(g, i);
          return;
        }
        var cur = d.path[d.path.length - 1];
        if (nextMoves(d, cur).indexOf(i) === -1) { Milo.sound.tone({ f: 220, f2: 160, d: .08, v: .05, type: 'square' }); return; }
        step(g, i);
      };
    }
    function step(g, i) {
      var d = g.data;
      d.visited[i] = d.path.length + 1;
      d.path.push(i);
      d.stuck = false;
      Milo.sound.tone({ f: 300 + d.path.length * 6, f2: 380 + d.path.length * 6, d: .07, v: .06, type: 'triangle' });
      var r = cells[i].getBoundingClientRect(), hr = host.getBoundingClientRect();
      fx.puff(r.left - hr.left + r.width / 2, r.top - hr.top + r.height * .7, 8, ['#d6b48a', '#f5deb3', '#fff'], 80);
      paint(g);
      if (d.path.length === d.n * d.n) { solved(g); return; }
      if (!nextMoves(d, i).length) {
        d.stuck = true;
        Milo.sound.tone({ f: 180, f2: 90, d: .25, v: .08, type: 'sawtooth' });
        paint(g);
      }
    }
    function undo(g) {
      var d = g.data;
      if (g.state !== 'play' || d.done || !d.path.length) return;
      var i = d.path.pop();
      d.visited[i] = 0;
      d.undos++;
      d.stuck = false;
      g.set('Undos', d.undos);
      Milo.sound.click();
      paint(g);
    }
    function resetBoard(g) {
      var d = g.data;
      if (g.state !== 'play' || d.done) return;
      for (var i = 0; i < d.visited.length; i++) d.visited[i] = 0;
      d.path = [];
      d.stuck = false;
      Milo.sound.click();
      paint(g);
    }

    function paint(g) {
      var d = g.data, n = d.n;
      var cur = d.path.length ? d.path[d.path.length - 1] : -1;
      var cand = cur >= 0 ? nextMoves(d, cur) : [];
      var degs = {};
      cand.forEach(function (j) { degs[j] = nextMoves(d, j).length; });
      cells.forEach(function (c, i) {
        var x = i % n, y = (i / n) | 0, light = (x + y) % 2 === 0;
        var base = light ? '#e8d3ad' : '#9c6b3f';
        if (d.visited[i]) {
          c.style.background = i === cur ? '#fbbf24' : (light ? '#7dd3c0' : '#2f8f7a');
          c.textContent = d.visited[i];
          c.style.color = i === cur ? '#3b2a05' : 'rgba(0,0,0,.55)';
          c.style.boxShadow = 'none';
        } else if (cur < 0) {
          var ok = validStart(d, i);
          c.style.background = ok ? (light ? '#f3e2bf' : '#b07a48') : base;
          c.style.boxShadow = ok ? 'inset 0 0 0 3px rgba(251,191,36,.55)' : 'none';
          c.textContent = ok ? '·' : '';
          c.style.color = 'rgba(251,191,36,.9)';
        } else if (degs[i] != null) {
          c.style.background = light ? '#fde68a' : '#d97706';
          c.textContent = degs[i];
          c.style.color = degs[i] === 0 ? '#b91c1c' : 'rgba(0,0,0,.6)';
          c.style.boxShadow = 'inset 0 0 0 3px rgba(255,255,255,.5)';
        } else {
          c.style.background = base;
          c.textContent = '';
          c.style.boxShadow = 'none';
        }
      });
      // trail + knight
      var pts = d.path.map(function (i) { return ((i % n) * 10 + 5) + ',' + (((i / n) | 0) * 10 + 5); });
      trail.setAttribute('points', pts.join(' '));
      if (cur >= 0) {
        knight.style.opacity = 1;
        knight.style.left = (cur % n) / n * 100 + '%';
        knight.style.top = ((cur / n) | 0) / n * 100 + '%';
      } else knight.style.opacity = 0;
      g.set('Visited', d.path.length + '/' + n * n);
      if (d.stuck) hdr.innerHTML = '<span style="color:#fb7185">Dead end — no legal move left. Undo or reset the board.</span>';
      else if (cur < 0) hdr.textContent = 'Stage ' + (stage + 1) + ' · ' + n + '×' + n + ' · tap a marked square to start';
      else hdr.textContent = (n * n - d.path.length) + ' squares to go · numbers show each move’s onward options';
      tipEl.textContent = 'Fewest-options-first (small numbers) is the classic Warnsdorff trick';
    }

    function solved(g) {
      var d = g.data;
      d.done = true;
      var earned = Math.max(50, d.n * d.n * 10 + 150 - d.undos * 15);
      g.score += earned;
      g.set('Score', U.fmt(g.score));
      Milo.sound.win();
      var hr = host.getBoundingClientRect();
      d.path.forEach(function (i, k) {
        setTimeout(function () {
          var r = cells[i].getBoundingClientRect();
          cells[i].style.background = '#fbbf24';
          fx.puff(r.left - hr.left + r.width / 2, r.top - hr.top + r.height / 2, 5, ['#fde68a', '#fff'], 120);
        }, k * 18);
      });
      var last = stage >= SIZES.length - 1;
      setTimeout(function () {
        if (last) {
          g.win({ emo: '♞', title: 'Full tour of the 8×8!', text: 'All four boards toured. Final board: ' + d.n * d.n + ' squares with ' + d.undos + ' undos.', score: g.score });
          return;
        }
        stage++;
        g.overlay({
          emo: '♞', title: 'Tour complete!',
          text: d.n + '×' + d.n + ' covered with ' + d.undos + ' undo' + (d.undos === 1 ? '' : 's') + ' — worth ' + earned + ' points. Next: ' + SIZES[stage] + '×' + SIZES[stage] + '.',
          score: g.score, best: g.best, newBest: Milo.store.setBest('knight-tour', g.score),
          actions: [
            { label: 'Next board →', primary: true, onClick: function () { next(g); } },
            { label: 'Start over', onClick: function () { stage = 0; g.restart(); } }
          ]
        });
      }, d.path.length * 18 + 500);
    }
    function next(g) {
      g.clearOverlay();
      var keep = g.score;
      reset(g);
      g.score = keep;
      g.set('Score', U.fmt(keep));
      g.state = 'play';
      g.best = Milo.store.best('knight-tour');
    }

    return Milo.domGame(host, {
      id: 'knight-tour',
      stats: ['Board', 'Visited', 'Undos', 'Score'],
      bg: '#1c1108',
      emo: '♞',
      start: {
        title: 'Knight’s Tour',
        text: 'Move a chess knight so it lands on every square exactly once. Pick a start ' +
          'square, then tap any highlighted square to jump there. Each candidate shows how ' +
          'many onward moves it would leave you. Boards grow from 5×5 to 8×8; undo costs 15 points.',
        keys: ['Tap a square', 'U undo', 'R reset']
      },
      preload: function () { stage = 0; },
      init: reset,
      onKey: function (g, e) {
        if (e.code === 'KeyU') undo(g);
        if (e.code === 'KeyR') resetBoard(g);
      },
      destroy: function () {
        if (ro) { ro.disconnect(); ro = null; }
        if (fx) { fx.destroy(); fx = null; }
      }
    });
  }

  window.Milo.register({
    id: 'knight-tour', title: 'Knight’s Tour', emo: '♞', category: 'Puzzle',
    tagline: 'Land on every square once with knight moves',
    description: 'A knight hops in an L — two squares one way, one square across — and your ' +
      'job is to route it over every square of the board without ever landing twice. Every ' +
      'legal jump is highlighted with the number of exits it would leave, which is the ' +
      'Warnsdorff heuristic laid bare: choosing the smallest number almost always works. ' +
      'Four boards, 5×5 to 8×8; on the odd boards only half the squares can start a tour, ' +
      'and those are marked. Undo is allowed but costs 15 points a time.',
    controls: ['Tap a square', 'U undo', 'R reset'],
    colors: ['#9c6b3f', '#fbbf24'],
    tags: ['chess', 'knight', 'hamiltonian', 'brain', 'classic'],
    mount: mount
  });
})();
