/* Logic Pack — ten grid-logic puzzles on one shared DOM board engine:
   five nonogram sizes plus a two-colour board, Skyscrapers at 4x4 and 5x5,
   magic squares, and a hand-crafted number-path set. */
(function () {
  'use strict';
  var Milo = window.Milo, U = Milo.util;

  /* ====================================================== shared furniture */

  var CSS = [
    '.lp-wrap{margin:auto;display:flex;flex-direction:column;align-items:center;gap:11px;',
    'font-family:var(--font,sans-serif);color:#eef1ff;max-width:100%}',
    '.lp-head{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;justify-content:center}',
    '.lp-head b{font-size:1.04rem;font-weight:850;letter-spacing:.005em}',
    '.lp-head span{font-size:.68rem;color:#8a93c4;text-transform:uppercase;letter-spacing:.15em;font-weight:800}',
    '.lp-grid{display:grid;touch-action:none;position:relative;',
    '-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}',
    '.lp-k{display:flex;align-items:center;justify-content:flex-end;font-weight:800;line-height:1;',
    'font-variant-numeric:tabular-nums;color:#ccd3f5;padding-right:3px;transition:opacity .2s}',
    '.lp-k.v{justify-content:center;align-items:flex-end;padding:0 0 3px}',
    '.lp-k.done{opacity:.28}',
    '.lp-c{box-sizing:border-box;border:1px solid rgba(255,255,255,.11);background:rgba(255,255,255,.05);',
    'border-radius:2px;position:relative;cursor:pointer;overflow:hidden}',
    '.lp-c.hv{border-top-width:2px;border-top-color:rgba(255,255,255,.45)}',
    '.lp-c.hl{border-left-width:2px;border-left-color:rgba(255,255,255,.45)}',
    '.lp-c.he{border-right-width:2px;border-right-color:rgba(255,255,255,.45)}',
    '.lp-c.hb{border-bottom-width:2px;border-bottom-color:rgba(255,255,255,.45)}',
    '.lp-c.on{border-color:rgba(0,0,0,.28);animation:lpPop .18s ease-out}',
    '.lp-c.x::before,.lp-c.x::after{content:"";position:absolute;left:26%;right:26%;top:calc(50% - 1px);',
    'height:2px;background:rgba(255,255,255,.36);border-radius:2px}',
    '.lp-c.x::before{transform:rotate(45deg)}.lp-c.x::after{transform:rotate(-45deg)}',
    '.bad{animation:lpBad .45s ease-out}',
    '@keyframes lpPop{from{transform:scale(.55);opacity:.4}to{transform:scale(1);opacity:1}}',
    '@keyframes lpBad{0%,100%{box-shadow:none}30%{box-shadow:inset 0 0 0 40px rgba(251,113,133,.6)}}',
    '@keyframes lpWin{0%{transform:scale(1)}40%{transform:scale(1.06)}100%{transform:scale(1)}}',
    '.lp-grid.won{animation:lpWin .5s ease-out}',
    '.lp-bar{display:flex;gap:7px;align-items:center;flex-wrap:wrap;justify-content:center}',
    '.lp-btn{font:inherit;font-size:.78rem;font-weight:750;color:#dfe4ff;background:rgba(255,255,255,.08);',
    'border:1px solid rgba(255,255,255,.16);border-radius:9px;padding:6px 11px;cursor:pointer;',
    'transition:background .15s,transform .1s;line-height:1.1}',
    '.lp-btn:hover{background:rgba(255,255,255,.16)}.lp-btn:active{transform:translateY(1px)}',
    '.lp-btn[disabled]{opacity:.38;cursor:default}',
    '.lp-btn.sel{background:#7c5cff;border-color:#9f8bff;color:#fff;box-shadow:0 6px 16px rgba(124,92,255,.45)}',
    '.lp-sw{width:30px;height:30px;border-radius:8px;border:2px solid rgba(255,255,255,.22);cursor:pointer;padding:0}',
    '.lp-sw.sel{border-color:#fff;box-shadow:0 0 0 3px rgba(255,255,255,.22)}',
    '.lp-note{font-size:.72rem;color:#8a93c4;text-align:center;max-width:32em;line-height:1.45}',
    '.lp-num{box-sizing:border-box;display:flex;align-items:center;justify-content:center;font-weight:850;',
    'font-variant-numeric:tabular-nums;border-radius:4px;cursor:pointer;border:1px solid rgba(255,255,255,.12);',
    'background:rgba(255,255,255,.05);color:#eef1ff;position:relative;transition:background .12s}',
    '.lp-num.fix{background:rgba(124,92,255,.26);border-color:rgba(159,139,255,.6);color:#fff}',
    '.lp-num.ent{background:rgba(34,211,238,.17);border-color:rgba(34,211,238,.45);color:#fff}',
    '.lp-num.sel{box-shadow:inset 0 0 0 2px #22d3ee}',
    '.lp-num.dupe{background:rgba(251,113,133,.3);border-color:rgba(251,113,133,.7)}',
    '.lp-clue{display:flex;align-items:center;justify-content:center;font-weight:850;color:#9aa3d0;',
    'font-variant-numeric:tabular-nums;transition:color .2s}',
    '.lp-clue.ok{color:#34d399}.lp-clue.no{color:#fb7185}',
    '.lp-chip{font:inherit;font-weight:850;font-variant-numeric:tabular-nums;border-radius:8px;cursor:pointer;',
    'border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.07);color:#eef1ff;padding:5px 0;',
    'min-width:34px;text-align:center;transition:background .12s,transform .1s}',
    '.lp-chip:hover{background:rgba(255,255,255,.16)}',
    '.lp-chip.sel{background:#22d3ee;border-color:#67e8f9;color:#04222a;box-shadow:0 6px 16px rgba(34,211,238,.4)}',
    '.lp-chip.gone{opacity:.2;pointer-events:none}',
    '.lp-sum{display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.74rem;',
    'color:#8a93c4;font-variant-numeric:tabular-nums}',
    '.lp-sum.ok{color:#34d399}.lp-sum.no{color:#fb7185}',
    '.lp-pc{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible}',
    '.lp-pcell{box-sizing:border-box;display:flex;align-items:center;justify-content:center;',
    'border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.045);border-radius:4px;',
    'font-weight:850;font-variant-numeric:tabular-nums;cursor:pointer;position:relative;z-index:2;color:#dbe1ff}',
    '.lp-pcell.given{color:#fff;background:rgba(124,92,255,.22);border-color:rgba(159,139,255,.55);',
    'box-shadow:inset 0 0 0 2px rgba(159,139,255,.5)}',
    '.lp-pcell.pathed{color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.6)}',
    '.lp-pcell.head{outline:2px solid #fde68a;outline-offset:1px;z-index:3}',
    '@media (max-width:560px){.lp-wrap{gap:8px;padding-top:34px}',
    '.lp-head b{font-size:.92rem}.lp-head span{font-size:.6rem}',
    '.lp-note{font-size:.66rem;line-height:1.36}}'
  ].join('');

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function styleInto(root) { root.appendChild(el('style', null, CSS)); }

  /** Centre of a DOM node in host-local pixels, for aiming particles. */
  function centreIn(node, host) {
    var a = node.getBoundingClientRect(), b = host.getBoundingClientRect();
    return [a.left - b.left + a.width / 2, a.top - b.top + a.height / 2];
  }

  /** Sparks, rings and rising score text over the board. */
  function makeFx(host) {
    var cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:7';
    host.appendChild(cv);
    var ctx = cv.getContext('2d'), parts = [], raf = 0, last = 0;

    function size() {
      var r = host.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(1, Math.round(r.width * d)), h = Math.max(1, Math.round(r.height * d));
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      ctx.setTransform(d, 0, 0, d, 0, 0);
    }
    function tick(now) {
      // rAF hands out the frame's start time, which can predate the performance.now()
      // recorded when the loop was kicked off — clamp so no particle ages backwards.
      var dt = U.clamp((now - last) / 1000, 0, .05); last = now;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      var d = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(d, 0, 0, d, 0, 0);
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i]; p.t += dt;
        if (p.t > p.life) { parts.splice(i, 1); continue; }
        var k = p.t / p.life;
        if (p.kind === 'ring') {
          ctx.globalAlpha = (1 - k) * .75; ctx.strokeStyle = p.c; ctx.lineWidth = 3 * (1 - k) + 1;
          ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(.5, 4 + k * p.r), 0, 6.2832); ctx.stroke();
        } else if (p.kind === 'text') {
          ctx.globalAlpha = 1 - k * k; ctx.fillStyle = p.c;
          ctx.font = '850 ' + p.s + 'px var(--font, sans-serif)';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(p.txt, p.x, p.y - k * 46);
        } else {
          p.vy += 620 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
          ctx.globalAlpha = 1 - k; ctx.fillStyle = p.c;
          ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(.5, p.r * (1 - k * .5)), 0, 6.2832); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      if (parts.length) raf = requestAnimationFrame(tick);
      else { raf = 0; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); }
    }
    function go() { if (!raf) { size(); last = performance.now(); raf = requestAnimationFrame(tick); } }

    return {
      burst: function (x, y, n, cols) {
        size();
        for (var i = 0; i < n; i++) {
          var a = U.rand(0, 6.2832), s = U.rand(70, 320);
          parts.push({ kind: 'dot', x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 130,
            r: U.rand(2, 5.5), c: U.choice(cols), t: 0, life: U.rand(.5, 1.1) });
        }
        go();
      },
      ring: function (x, y, c, r) { size(); parts.push({ kind: 'ring', x: x, y: y, r: r || 40, c: c, t: 0, life: .5 }); go(); },
      text: function (x, y, txt, c, s) {
        size(); parts.push({ kind: 'text', x: x, y: y, txt: txt, c: c, s: s || 20, t: 0, life: .95 }); go();
      },
      clear: function () { parts.length = 0; },
      destroy: function () { cancelAnimationFrame(raf); raf = 0; cv.remove(); }
    };
  }

  /**
   * Picks the largest cell size that keeps the whole board — clue gutters,
   * buttons and caption — inside the stage. It measures the laid-out board
   * rather than guessing at the chrome, so every game fits at any window size.
   */
  function fitBoard(host, wrap, grid, cols, minC, maxC, apply) {
    var r = host.getBoundingClientRect();
    var availW = Math.max(120, r.width - 26);
    var availH = Math.max(120, r.height - 80);
    function set(c) {
      grid.style.setProperty('--c', c + 'px');
      if (apply) apply(c);
    }
    var lo = minC, hi = Math.max(minC, Math.floor(Math.min(availW / cols, maxC)));
    var best = lo;
    while (lo <= hi) {
      var mid = (lo + hi) >> 1;
      set(mid);
      if (wrap.scrollHeight <= availH && wrap.scrollWidth <= availW) { best = mid; lo = mid + 1; }
      else hi = mid - 1;
    }
    set(best);
    return best;
  }

  /** Re-runs `fn` whenever the stage changes size. */
  function watchSize(host, fn) {
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(fn); ro.observe(host); }
    else window.addEventListener('resize', fn);
    return function () { if (ro) ro.disconnect(); else window.removeEventListener('resize', fn); };
  }

  /** 'a' or 'an', so the win banner reads properly for every picture name. */
  function article(word) { return /^[aeiou]/i.test(word) ? 'an ' : 'a '; }

  function hearts(n, max) {
    var s = '';
    for (var i = 0; i < max; i++) s += i < n ? '♥' : '·';
    return s;
  }

  function shuffledBag(n) {
    var a = [];
    for (var i = 0; i < n; i++) a.push(i);
    return U.shuffle(a);
  }

  /* ================================================== nonogram puzzle data */
  /* Hand-designed pixel art. Every pattern below was checked with a line
     solver: each one is solvable by pure row/column logic, which also proves
     its clues admit exactly one picture. */
  var NONO = {
    n5: [
      ['Heart', '.#.#.|#####|#####|.###.|..#..'],
      ['Plus', '..#..|..#..|#####|..#..|..#..'],
      ['Arrow', '..#..|.###.|#####|..#..|..#..'],
      ['Star', '..#..|#####|.###.|.#.#.|#...#'],
      ['Boat', '..#..|..##.|..#..|#####|.###.'],
      ['Tree', '..#..|.###.|#####|..#..|.###.'],
      ['Key', '.###.|.#.#.|.###.|..#..|..##.'],
      ['House', '..#..|.###.|#####|##.##|##.##'],
      ['Cat', '#...#|#####|#.#.#|#####|.###.'],
      ['Diamond', '..#..|.###.|#####|.###.|..#..'],
      ['Invader', '#...#|.###.|#####|#.#.#|#...#'],
      ['Anchor', '..#..|.###.|..#..|#.#.#|.###.'],
      ['Cup', '#####|#...#|#...#|.###.|..#..'],
      ['Moon', '.###.|##...|##...|##...|.###.'],
      ['Bowtie', '#...#|##.##|..#..|##.##|#...#']
    ],
    n8: [
      ['Heart', '........|.##..##.|########|########|########|.######.|..####..|...##...'],
      ['Cat', '.#....#.|.##..##.|.######.|.#.##.#.|.######.|.#.##.#.|.######.|..####..'],
      ['Sailboat', '...#....|...##...|...###..|...####.|...#####|...#....|########|.######.'],
      ['Key', '..####..|..#..#..|..#..#..|..####..|...##...|...###..|...##...|...###..'],
      ['Tree', '...##...|..####..|.######.|...##...|..####..|.######.|########|...##...'],
      ['Invader', '..#..#..|...##...|..####..|.##..##.|########|#.####.#|#.#..#.#|..#..#..'],
      ['House', '...##...|..####..|.######.|########|##.##.##|##.##.##|###..###|###..###'],
      ['Star', '...##...|...##...|########|.######.|..####..|.######.|.##..##.|##....##'],
      ['Ghost', '..####..|.######.|##.##.##|########|########|########|########|#.#..#.#'],
      ['Mushroom', '..####..|.######.|########|########|.######.|...##...|...##...|..####..'],
      ['Umbrella', '...##...|.######.|########|########|...##...|...##...|...##...|..###...'],
      ['Crown', '#......#|##....##|##.##.##|########|########|########|#.#..#.#|########'],
      ['Anchor', '...##...|..#..#..|...##...|.######.|...##...|...##...|#.####.#|.######.'],
      ['Gem', '.######.|##.##.##|########|.######.|.######.|..####..|...##...|....#...'],
      ['Rocket', '...##...|..####..|..####..|..#..#..|..####..|.######.|##.##.##|...##...'],
      ['Fish', '...##...|..####..|.######.|#######.|######.#|.#####.#|..####..|...##...'],
      ['Mug', '........|######..|#....#..|#....###|#....#.#|#....###|#....#..|######..']
    ],
    n10: [
      ['Heart', '..##..##..|.########.|##########|##########|##########|##########|.########.|..######..|...####...|....##....'],
      ['Cat', '.#......#.|.##....##.|.########.|.########.|.#.####.#.|.########.|.#.####.#.|.########.|..######..|...####...'],
      ['Sailboat', '....#.....|....##....|....###...|....####..|....#####.|....######|....#.....|....#.....|##########|.########.'],
      ['Key', '..####....|.##..##...|.#....#...|.#....#...|.##..##...|..####....|...##.....|...####...|...##.....|...####...'],
      ['Tree', '....##....|...####...|..######..|....##....|...####...|..######..|.########.|##########|....##....|....##....'],
      ['Invader', '...#..#...|....##....|...####...|..#.##.#..|.########.|##.####.##|##########|#.#....#.#|...#..#...|..##..##..'],
      ['House', '....##....|...####...|..######..|.########.|##########|##########|##########|###....###|###....###|###....###'],
      ['Star', '....##....|....##....|...####...|##########|##########|.########.|..######..|..######..|.##....##.|##......##'],
      ['Ghost', '...####...|..######..|.########.|##.####.##|##.####.##|##########|##########|##########|##########|#.##.##.##'],
      ['Mushroom', '...####...|..######..|.########.|##########|##########|..######..|...####...|....##....|....##....|...####...'],
      ['Umbrella', '....##....|..######..|.########.|##########|##########|....##....|....##....|....##....|...###....|...##.....'],
      ['Crown', '#........#|#........#|##......##|##..##..##|##.####.##|##########|##########|##########|#.#.##.#.#|##########'],
      ['Anchor', '....##....|...#..#...|...#..#...|....##....|.########.|....##....|....##....|....##....|#.######.#|.########.'],
      ['Rocket', '....##....|...####...|..######..|..#.##.#..|..#.##.#..|..######..|..######..|.########.|##########|...#..#...'],
      ['Apple', '.....##...|....##....|..######..|.########.|##########|##########|##########|.########.|.###..###.|..##..##..'],
      ['Butterfly', '##......##|###....###|##########|.########.|..#.##.#..|..#.##.#..|.########.|##########|###....###|##......##'],
      ['Snowman', '...####...|..######..|..#.##.#..|..######..|...####...|..######..|.########.|.########.|.########.|..######..'],
      ['Balloon', '...####...|..######..|.########.|##########|##########|.########.|..######..|...####...|....##....|....##....']
    ],
    n12: [
      ['Heart', '..##....##..|.####..####.|############|############|############|############|############|.##########.|..########..|...######...|....####....|.....##.....'],
      ['Cat', '.#........#.|.##......##.|.###....###.|.##########.|.##########.|.#.##..##.#.|.##########.|.####..####.|.##########.|..########..|...######...|....####....'],
      ['Sailboat', '.....#......|.....##.....|.....###....|.....####...|.....#####..|.....######.|.....#######|.....#......|.....#......|############|.##########.|..########..'],
      ['Key', '...#####....|..##...##...|.##.....##..|.##.....##..|..##...##...|...#####....|.....##.....|.....##.....|.....#####..|.....##.....|.....####...|.....##.....'],
      ['Tree', '.....##.....|....####....|...######...|.....##.....|....####....|...######...|..########..|....####....|...######...|..########..|.##########.|.....##.....'],
      ['Invader', '..#......#..|..#......#..|...#....#...|..########..|.##.####.##.|############|############|#.########.#|#.#......#.#|...##..##...|..##....##..|.##......##.'],
      ['House', '.....##.....|....####....|...######...|..########..|.##########.|############|############|##.##..##.##|##.##..##.##|############|####....####|####....####'],
      ['Star', '.....##.....|.....##.....|....####....|....####....|############|############|.##########.|..########..|..########..|.###....###.|.##......##.|##........##'],
      ['Ghost', '....####....|..########..|.##########.|###.####.###|###.####.###|############|############|##.##..##.##|############|############|############|#.##.##.##.#'],
      ['Mushroom', '....####....|..########..|.##########.|############|############|############|..########..|...######...|....####....|....####....|....####....|...######...'],
      ['Umbrella', '.....##.....|...######...|.##########.|############|############|############|.....##.....|.....##.....|.....##.....|.....##.....|....###.....|....##......'],
      ['Crown', '#..........#|#..........#|##........##|##...##...##|##..####..##|##.######.##|############|############|############|#.##.##.##.#|############|############'],
      ['Anchor', '.....##.....|....#..#....|....#..#....|.....##.....|..########..|.....##.....|.....##.....|.....##.....|##...##...##|##...##...##|###......###|.##########.'],
      ['Rocket', '.....##.....|....####....|...######...|...#.##.#...|...#.##.#...|...######...|...######...|..########..|.##########.|##.######.##|....####....|....#..#....'],
      ['Gem', '..########..|.##########.|##.##..##.##|############|############|.##########.|.##########.|..########..|..########..|...######...|....####....|.....##.....'],
      ['Butterfly', '##........##|###......###|#####..#####|############|.##########.|..#.####.#..|..#.####.#..|.##########.|############|#####..#####|###......###|##........##']
    ],
    n15: [
      ['Heart', '...###...###...|..#####.#####..|.#############.|###############|###############|###############|###############|###############|.#############.|..###########..|...#########...|....#######....|.....#####.....|......###......|.......#.......'],
      ['Cat', '.##.........##.|.###.......###.|.####.....####.|.#############.|.#############.|.##.###.###.##.|.#############.|.######.######.|.#############.|#.###########.#|.#############.|..###########..|...#########...|....#######....|......###......'],
      ['Sailboat', '......#........|......##.......|......###......|......####.....|......#####....|......######...|......#######..|......########.|......#########|......#........|......#........|......#........|###############|.#############.|..###########..'],
      ['Key', '.....####......|....##..##.....|...##....##....|...##....##....|....##..##.....|.....####......|.......##......|.......##......|.......##......|.......#####...|.......##......|.......##......|.......######..|.......##......|.......####....'],
      ['Tree', '.......#.......|......###......|.....#####.....|....#######....|......###......|.....#####.....|....#######....|...#########...|.....#####.....|....#######....|...#########...|..###########..|.......#.......|......###......|......###......'],
      ['Invader', '....#.....#....|....#.....#....|.....#...#.....|.....#...#.....|....#######....|....#######....|...##.###.##...|..###########..|..###########..|..#.#######.#..|..#.#######.#..|..#.#.....#.#..|..#.#.....#.#..|.....##.##.....|.....##.##.....'],
      ['House', '.......#.......|......###......|.....#####.....|....#######....|...#########...|..###########..|.#############.|###############|###############|##.###...###.##|##.###...###.##|###############|#####.....#####|#####.....#####|#####.....#####'],
      ['Star', '.......#.......|.......#.......|......###......|......###......|###############|###############|.#############.|..###########..|...#########...|...#########...|..####...####..|..###.....###..|.###.......###.|.##.........##.|##...........##'],
      ['Ghost', '.....#####.....|...#########...|..###########..|.#############.|###..#####..###|###..#####..###|###############|###############|#####.....#####|###############|###############|###############|###############|###############|#..##..##..####'],
      ['Mushroom', '....#######....|..###########..|.#############.|###############|###############|###############|.#############.|..###########..|.....#####.....|.....#####.....|.....#####.....|.....#####.....|.....#####.....|....#######....|...#########...'],
      ['Umbrella', '.......#.......|.....#####.....|...#########...|.#############.|###############|###############|###############|.......#.......|.......#.......|.......#.......|.......#.......|.......#.......|.....###.......|....###........|....##.........'],
      ['Crown', '#.............#|#.............#|##...........##|##.....#.....##|##....###....##|##...#####...##|##..#######..##|###############|###############|###############|###############|#.###.###.###.#|###############|###############|###############'],
      ['Whale', '............#..|...........#.#.|...........#.#.|....######.....|..##########...|.############..|##############.|###############|##.############|###############|.#############.|..###########..|...##.....##...|...##.....##...|..####...####..'],
      ['Rocket', '.......#.......|......###......|.....#####.....|....##.#.##....|....##.#.##....|....#######....|....#######....|....#######....|...#########...|..###########..|.##.#######.##.|##...#####...##|.....#####.....|.....#.#.#.....|......#.#......'],
      ['Butterfly', '###.........###|####.......####|######...######|###############|###############|.####.###.####.|..###.###.###..|...##.###.##...|..###.###.###..|.####.###.####.|###############|###############|######...######|####.......####|###.........###'],
      ['Apple', '.........##....|........##.....|...####.##.....|..###########..|.#############.|###############|###############|###############|###############|###############|.#############.|.#############.|..###.....###..|..##.......##..|.###.......###.'],
      ['Penguin', '.....#####.....|....#######....|...#########...|...##.###.##...|...#########...|.....#####.....|....#######....|...####.####...|..#####.#####..|..####...####..|.####.....####.|.####.....####.|.#############.|..###########..|.###.......###.'],
      ['Gem', '..###########..|.#############.|###############|###############|.#############.|.#############.|..###########..|..###########..|...#########...|...#########...|....#######....|.....#####.....|......###......|......###......|.......#.......']
    ]
  };

  var NONO_C = [
    ['Strawberry', '#ef4444', '#22c55e', '....B.....|...BBB....|..BBBBB...|.AAAAAAA..|AAAAAAAAA.|AAAAAAAAA.|.AAAAAAA..|.AAAAAAA..|..AAAAA...|...AAA....'],
    ['Penguin', '#1f2a44', '#fb923c', '...AAAA...|..AAAAAA..|..A.AA.A..|..AAAAAA..|...BBBB...|.AAAAAAAA.|.AAABBAAA.|.AAABBAAA.|.AAAAAAAA.|..BB..BB..'],
    ['Mushroom', '#ef4444', '#f1f5f9', '..AAAAAA..|.AAAAAAAA.|AAAAAAAAAA|AAAAAAAAAA|.AAAAAAAA.|..BBBBBB..|...BBBB...|...BBBB...|...BBBB...|..BBBBBB..'],
    ['Tree', '#22c55e', '#a16207', '....AA....|...AAAA...|..AAAAAA..|.AAAAAAAA.|..AAAAAA..|.AAAAAAAA.|AAAAAAAAAA|....BB....|....BB....|...BBBB...'],
    ['Fish', '#38bdf8', '#fb923c', '....B.....|...AAA....|..AAAAA.B.|.AAAAAAABB|AAAAAAAAAB|AAAAAAAAAB|.AAAAAAABB|..AAAAA.B.|...AAA....|....B.....'],
    ['IceCream', '#f472b6', '#d97706', '...AAAA...|..AAAAAA..|.AAAAAAAA.|.AAAAAAAA.|..AAAAAA..|..BBBBBB..|..BBBBBB..|...BBBB...|...BBBB...|....BB....'],
    ['Flower', '#f472b6', '#facc15', '..AA..AA..|.AAAAAAAA.|.AAABBAAA.|.AAABBAAA.|.AAAAAAAA.|..AA..AA..|....AA....|...AAA....|....AA....|....AA....'],
    ['Watermelon', '#ef4444', '#16a34a', 'BBBBBBBBBB|BBBBBBBBBB|AAAAAAAAAA|AAAAAAAAAA|AAAAAAAAAA|.AAAAAAAA.|.AAAAAAAA.|..AAAAAA..|...AAAA...|....AA....'],
    ['Rocket', '#e2e8f0', '#ef4444', '....AA....|...AAAA...|..AAAAAA..|..ABBBBA..|..ABBBBA..|..AAAAAA..|..AAAAAA..|.AAAAAAAA.|AA.AAAA.AA|...B..B...'],
    ['Duck', '#facc15', '#f97316', '...AAA....|..AAAAA...|..A.AAA...|..AAAAABB.|..AAAAAA..|.AAAAAAAA.|AAAAAAAAA.|AAAAAAAAA.|.AAAAAAAA.|..BB..BB..'],
    ['Cake', '#f9a8d4', '#a16207', '....B.....|...BBB....|..AAAAAA..|.AAAAAAAA.|AAAAAAAAAA|BBBBBBBBBB|BBBBBBBBBB|AAAAAAAAAA|BBBBBBBBBB|BBBBBBBBBB'],
    ['Lighthouse', '#f8fafc', '#ef4444', '...BBBB...|..AAAAAA..|..ABBBBA..|..AAAAAA..|...AAAA...|...BBBB...|...AAAA...|...BBBB...|..AAAAAA..|.AAAAAAAA.'],
    ['Butterfly', '#a78bfa', '#fbbf24', 'AA......AA|AAA....AAA|AAAABBAAAA|AAAABBAAAA|.AAABBAAA.|.AAABBAAA.|AAAABBAAAA|AAAABBAAAA|AAA.BB.AAA|AA..BB..AA'],
    ['House', '#ef4444', '#fcd34d', '....AA....|...AAAA...|..AAAAAA..|.AAAAAAAA.|AAAAAAAAAA|BBBBBBBBBB|BBBBBBBBBB|BB.BB.BBBB|BBBBBBBBBB|BBBB..BBBB'],
    ['Apple', '#ef4444', '#16a34a', '.....B....|....BB....|..AAAA....|.AAAAAAA..|AAAAAAAAA.|AAAAAAAAA.|AAAAAAAAA.|.AAAAAAA..|.AAA.AAA..|..AA..AA..'],
    ['Ghost', '#f8fafc', '#60a5fa', '...AAAA...|..AAAAAA..|.AAAAAAAA.|AABBAABBAA|AABBAABBAA|AAAAAAAAAA|AAAAAAAAAA|AAAAAAAAAA|AAAAAAAAAA|A.AA.AA.AA']
  ];


  /* 4x4 magic squares (rows, columns and both diagonals all total 34), each
     one a genuine square found by exhaustive search; the game rotates and
     reflects them so the same board rarely looks the same twice. */
  var MAGIC4 = [
    [1,2,15,16,12,14,3,5,13,7,10,4,8,11,6,9],
    [1,4,13,16,15,14,3,2,8,5,12,9,10,11,6,7],
    [1,4,16,13,15,14,2,3,10,11,7,6,8,5,9,12],
    [1,6,11,16,14,15,2,3,7,4,13,10,12,9,8,5],
    [1,6,16,11,15,12,2,5,10,13,7,4,8,3,9,14],
    [1,7,14,12,6,15,4,9,11,2,13,8,16,10,3,5],
    [1,8,10,15,5,14,4,11,16,3,13,2,12,9,7,6],
    [1,8,13,12,10,15,6,3,16,9,4,5,7,2,11,14],
    [1,9,8,16,7,15,2,10,14,4,13,3,12,6,11,5],
    [1,10,7,16,15,11,6,2,14,8,9,3,4,5,12,13],
    [1,10,15,8,16,7,2,9,6,13,12,3,11,4,5,14],
    [1,11,8,14,6,16,3,9,12,2,13,7,15,5,10,4],
    [1,12,5,16,15,13,4,2,10,6,11,7,8,3,14,9],
    [1,12,15,6,3,13,8,10,14,4,9,7,16,5,2,11]
  ];

  /* Number-path levels: [w, h, solution path, revealed steps] in base-36 pairs.
     Each grid was generated with a Hamiltonian-path search and then thinned
     while a solver confirmed exactly one route still fits the checkpoints. */
  var PATHS = [
    [4,4,'0a0e0f0b070302060501000408090d0c','000104060a0c0f'],
    [4,4,'080c0d090a0e0f0b0703020605040001','000204050c0f'],
    [4,5,'03070b0f0j0i0h0g0c08040001020605090a0e0d','0005090a0f0g0j'],
    [5,5,'000102030409080706050a0f0k0l0m0n0o0j0e0d0i0h0c0b0g','0001030b0c0e0k0n0o'],
    [5,5,'04090e0j0o0n0i0d080302070c0h0m0l0k0f0g0b0a05060100','00020a0g0j0m0n0o'],
    [5,6,'0m0r0s0t0o0n0i0j0e090403020100050a0f0k0p0q0l0g0h0c0d0807060b','0002030607080d0q0t'],
    [6,5,'0r0q0p0o0i0j0k0l0m0s0t0n0h0g0f0e0d0c06000107080203090a0b0504','0001020307080g0n0t'],
    [6,6,'060001020304050b0h0n0t0z0y0x0w0v0u0o0p0q0r0s0m0l0k0j0i0c0d07080e0f0g0a09','00050b0c0i0n0p0s0x0y0z'],
    [6,6,'0e0d0c0i0o0u0v0p0j0k0q0w0x0y0z0t0s0r0l0m0n0h0b05040a0g0f0903020807010006','0008090c0d0l0r0u0z'],
    [6,7,'0p0o0u10110v0w12130x0r0q0k0j0i0c060001020304050b0h0n0t0z15140y0s0m0l0f0g0a09080e0d07','0001050c0h0j0o0q0x1115'],
    [7,6,'0d06050c0b04030a0h0i0j0k0r0q0p0o0v0w0x0y15141312110u0n0g0902010007080f0e0l0m0t100z0s','0003040a0i0m0o0p0t0w15'],
    [7,7,'0c0d0605040b0i0j0k0r0q0p0o0h0a030201000708090g0n0u0v0w0x0y151c1b14131a1912111817160z100t0s0l0e0f0m','00020308090b0f0m0o0t10141c'],
    [7,7,'000102030405060d0c0b0a0908070e0f0g0h0i0j0k0r0q0p0o0n0m0l0s0t0u0v0w0x0y151c1b14131a1912111817100z16','000103040a0g0i0w101a1b1c'],
    [6,8,'01000607080203090f0e0d0c0i0j0k0l0r0q0p0o0u101617110v0w121819130x0y0s0m0g0a04050b0h0n0t0z151b1a14','00070b0k0l0m0q0v0w0y161b'],
    [8,6,'0c04050d0l0k0j0b03020100080g0o0w1415161718191a1b130v0n0f07060e0m0u12110t0s100z0r0q0y0x0p0h0i0a09','0005080c0i0m0p0u0x0z181b'],
    [7,8,'150y0r0k0d06050c0j0q0x14130w0p0i0b04030a0h0o0v12110u0n0g0902010007080f0e0l0m0t0s0z1017161d1e1f18191g1h1a1b1c1j1i','0002070d0e0r0s16181a1f1h1j'],
    [8,7,'0c04050d0e06070f0n0m0l0k0s0t0u0v1312111018191a1b1j1i1h1g1f1e1d1c140w0o0g080001090h0p0x1516170z0y0q0r0j0i0a0b0302','00030d0f0m0n0p0y15191e1j'],
    [8,8,'140w0o0g080001090h0p0x151d1c1k1l1m1n1o1p1q1r1j1b130v0n0f07060e0m0u121a1i1h1g1f1e160y0q0i0a02030b0j0r0z17181911100s0t0l0k0c0d0504','000i0o0p0y11191a1c1f1h1m1o1r']
  ];


  /* ================================================== nonogram board engine */

  /** Run lengths of `ink` along a line, in order. */
  function runsOf(line, ink) {
    var out = [], run = 0, i;
    for (i = 0; i < line.length; i++) {
      if (line[i] === ink) run++;
      else { if (run) out.push(run); run = 0; }
    }
    if (run) out.push(run);
    return out;
  }

  function sameRuns(a, b) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  /** A line's clue as coloured tokens: colour-A runs first, then colour-B. */
  function clueTokens(line, inkCount) {
    var out = [], k, i;
    for (k = 1; k <= inkCount; k++) {
      var r = runsOf(line, k);
      for (i = 0; i < r.length; i++) out.push({ v: r[i], ink: k });
    }
    if (!out.length) out.push({ v: 0, ink: 1 });
    return out;
  }

  /**
   * One nonogram game. `opt` fixes the grid size, how many pictures make a
   * run, and whether the board carries one ink or two.
   */
  function mountNono(host, opt) {
    var N = opt.size;
    var LIST = opt.colour ? NONO_C : NONO['n' + opt.size];
    var GAME = null, fx = null, unwatch = null, bag = [];
    var grid = null, cells = [], rowKeys = [], colKeys = [];
    var gRC = 1, gCC = 1, wrapEl = null;
    var drag = null, pending = null, lpTimer = 0, lastTone = 0;
    var hintBtn = null, inkBtns = [];

    function pick() {
      if (!bag.length) bag = shuffledBag(LIST.length);
      return LIST[bag.pop()];
    }

    /* ----------------------------------------------------------- new puzzle */

    function load(g) {
      var d = g.data, entry = pick(), x, y;
      d.name = entry[0];
      var rows;
      if (opt.colour) { d.inks = [entry[1], entry[2]]; rows = entry[3].split('|'); }
      else { d.inks = [opt.ink]; rows = entry[1].split('|'); }
      d.sol = [];
      d.need = 0;
      for (y = 0; y < N; y++) {
        var line = [];
        for (x = 0; x < N; x++) {
          var ch = rows[y].charAt(x);
          var v = (ch === '#' || ch === 'A') ? 1 : ch === 'B' ? 2 : 0;
          line.push(v);
          if (v) d.need++;
        }
        d.sol.push(line);
      }
      d.cell = [];
      for (y = 0; y < N; y++) d.cell.push(new Array(N).fill(0));   // 0 blank, 1/2 ink, 3 crossed out
      d.left = d.need;
      d.rowClue = []; d.colClue = [];
      for (y = 0; y < N; y++) d.rowClue.push(clueTokens(d.sol[y], d.inks.length));
      for (x = 0; x < N; x++) {
        var col = [];
        for (y = 0; y < N; y++) col.push(d.sol[y][x]);
        d.colClue.push(clueTokens(col, d.inks.length));
      }
      gRC = 1; gCC = 1;
      for (var i = 0; i < N; i++) {
        gRC = Math.max(gRC, d.rowClue[i].length);
        gCC = Math.max(gCC, d.colClue[i].length);
      }
      d.time = 0; d.done = false; d.hints = opt.hints; d.ink = 1;
      build(g);
      paintStats(g);
    }

    function build(g) {
      var d = g.data, y, x, i, k;
      var root = g.root;
      root.innerHTML = '';
      styleInto(root);
      var wrap = el('div', 'lp-wrap');

      var head = el('div', 'lp-head');
      head.appendChild(el('b', null, 'Picture ' + d.puzzle + ' of ' + opt.run));
      head.appendChild(el('span', null, N + ' × ' + N + ' · ' + d.need + ' squares to fill'));
      wrap.appendChild(head);

      grid = el('div', 'lp-grid');
      grid.style.gridTemplateColumns = 'repeat(' + (gRC + N) + ', var(--c))';
      grid.style.gridTemplateRows = 'repeat(' + (gCC + N) + ', var(--c))';
      cells = []; rowKeys = []; colKeys = [];
      for (x = 0; x < N; x++) colKeys[x] = [];

      for (y = 0; y < gCC; y++) {                       // column clues, bottom-aligned
        for (x = 0; x < gRC + N; x++) {
          var slot = el('div', 'lp-k v');
          if (x >= gRC) {
            var cl = d.colClue[x - gRC];
            k = cl.length - (gCC - y);
            if (k >= 0) {
              slot.textContent = cl[k].v;
              if (d.inks.length > 1) slot.style.color = d.inks[cl[k].ink - 1];
              colKeys[x - gRC].push(slot);
            }
          }
          grid.appendChild(slot);
        }
      }
      for (y = 0; y < N; y++) {
        var rcl = d.rowClue[y];
        rowKeys[y] = [];
        for (x = 0; x < gRC; x++) {                     // row clues, right-aligned
          var rslot = el('div', 'lp-k');
          k = rcl.length - (gRC - x);
          if (k >= 0) {
            rslot.textContent = rcl[k].v;
            if (d.inks.length > 1) rslot.style.color = d.inks[rcl[k].ink - 1];
            rowKeys[y].push(rslot);
          }
          grid.appendChild(rslot);
        }
        for (x = 0; x < N; x++) {
          var c = el('div', 'lp-c');
          if (y % 5 === 0) c.className += ' hv';
          if (x % 5 === 0) c.className += ' hl';
          if (x === N - 1) c.className += ' he';
          if (y === N - 1) c.className += ' hb';
          c.setAttribute('data-i', y * N + x);
          cells.push(c);
          grid.appendChild(c);
        }
      }
      wrap.appendChild(grid);

      var bar = el('div', 'lp-bar');
      inkBtns = [];
      if (d.inks.length > 1) {
        for (i = 0; i < 2; i++) {
          (function (n) {
            var b = el('button', 'lp-sw' + (n === 0 ? ' sel' : ''));
            b.type = 'button';
            b.style.background = d.inks[n];
            b.title = 'Paint colour ' + (n + 1) + '  (key ' + (n + 1) + ')';
            b.addEventListener('click', function () { setInk(g, n + 1); });
            inkBtns.push(b);
            bar.appendChild(b);
          })(i);
        }
      }
      hintBtn = el('button', 'lp-btn');
      hintBtn.type = 'button';
      hintBtn.addEventListener('click', function () { useHint(g); });
      bar.appendChild(hintBtn);
      var clr = el('button', 'lp-btn', 'Clear crosses');
      clr.type = 'button';
      clr.addEventListener('click', function () { clearMarks(g); });
      bar.appendChild(clr);
      wrap.appendChild(bar);

      wrap.appendChild(el('div', 'lp-note', d.inks.length > 1
        ? 'Click to paint the chosen colour · right-click or long-press to cross out · drag to sweep'
        : 'Click or drag to fill · right-click or long-press to cross out'));

      root.appendChild(wrap);
      wrapEl = wrap;
      grid.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      grid.addEventListener('pointerdown', onDown);
      refreshHint(g);
      relayout();
      redrawAll(g);
    }

    function relayout() {
      if (!grid || !wrapEl) return;
      var keys = grid.querySelectorAll('.lp-k');
      fitBoard(host, wrapEl, grid, gRC + N, 13, 46, function (c) {
        var fs = Math.max(8, Math.round(c * 0.54));
        for (var i = 0; i < keys.length; i++) keys[i].style.fontSize = fs + 'px';
      });
    }

    /* ---------------------------------------------------------- interaction */

    function cellAt(cx, cy) {
      var t = document.elementFromPoint(cx, cy);
      if (!t || !t.classList || !t.classList.contains('lp-c')) return -1;
      return +t.getAttribute('data-i');
    }

    function startDrag(g, i, mode) {
      var d = g.data, cur = d.cell[(i / N) | 0][i % N];
      drag = { mode: mode, target: mode === 'mark' ? (cur === 3 ? 0 : 3) : (cur === d.ink ? 0 : d.ink), last: -1 };
      apply(g, i);
    }

    function apply(g, i) {
      if (!drag) return;
      var d = g.data;
      if (d.done || g.state !== 'play') return;
      drag.last = i;
      var y = (i / N) | 0, x = i % N, cur = d.cell[y][x], want = drag.target;
      if (cur === want) return;

      if (want === 1 || want === 2) {
        if (d.sol[y][x] !== want) {                     // a square the clues rule out
          d.cell[y][x] = d.sol[y][x] === 0 ? 3 : 0;
          d.mistakes++;
          d.lives--;
          g.score = Math.max(0, g.score - 25);
          drag = null;
          paintCell(g, i);
          recount(d);
          var node = cells[i];
          node.classList.remove('bad');
          void node.offsetWidth;
          node.classList.add('bad');
          Milo.sound.tone({ f: 190, f2: 90, d: .18, v: .1, type: 'sawtooth' });
          var p = centreIn(node, host);
          fx.burst(p[0], p[1], 9, ['#fb7185', '#f43f5e', '#fda4af']);
          paintStats(g);
          markLine(g, y, x);
          if (d.lives <= 0) bust(g);
          return;
        }
        d.cell[y][x] = want;
        var now = performance.now();
        if (now - lastTone > 38) {
          lastTone = now;
          Milo.sound.tone({ f: 470 + (x + y) * 11, d: .045, v: .06, type: 'square' });
        }
      } else {
        d.cell[y][x] = want;
        if (want === 3) Milo.sound.click();
      }
      recount(d);
      paintCell(g, i);
      markLine(g, y, x);
      if (d.left === 0) solved(g);
    }

    function recount(d) {
      var n = 0;
      for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
        if (d.sol[y][x] && d.cell[y][x] !== d.sol[y][x]) n++;
      }
      d.left = n;
    }

    function onDown(e) {
      var g = GAME;
      if (!g || g.state !== 'play' || g.data.done) return;
      var i = cellAt(e.clientX, e.clientY);
      if (i < 0) return;
      e.preventDefault();
      if (e.pointerType === 'touch') {
        // Tap fills, press-and-hold crosses out, a slide starts a fill sweep.
        pending = { i: i, x: e.clientX, y: e.clientY };
        clearTimeout(lpTimer);
        lpTimer = setTimeout(function () {
          if (!pending) return;
          var p = pending; pending = null;
          startDrag(g, p.i, 'mark');
        }, 430);
      } else {
        startDrag(g, i, (e.button === 2 || e.ctrlKey || e.shiftKey) ? 'mark' : 'fill');
      }
    }

    function onMove(e) {
      var g = GAME;
      if (!g || g.state !== 'play' || g.data.done) return;
      if (pending) {
        if (Math.abs(e.clientX - pending.x) < 9 && Math.abs(e.clientY - pending.y) < 9) return;
        clearTimeout(lpTimer);
        var p = pending; pending = null;
        startDrag(g, p.i, 'fill');
        return;
      }
      if (!drag) return;
      var i = cellAt(e.clientX, e.clientY);
      if (i >= 0 && i !== drag.last) apply(g, i);
    }

    function onUp() {
      clearTimeout(lpTimer);
      if (pending && GAME) { var p = pending; pending = null; startDrag(GAME, p.i, 'fill'); }
      pending = null;
      drag = null;
    }

    function setInk(g, n) {
      if (g.data.inks.length < 2) return;
      g.data.ink = n;
      for (var i = 0; i < inkBtns.length; i++) inkBtns[i].classList.toggle('sel', i === n - 1);
      Milo.sound.click();
    }

    function clearMarks(g) {
      var d = g.data;
      if (g.state !== 'play') return;
      for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
        if (d.cell[y][x] === 3) { d.cell[y][x] = 0; paintCell(g, y * N + x); }
      }
      Milo.sound.click();
    }

    function useHint(g) {
      var d = g.data;
      if (d.done || !d.hints || g.state !== 'play') return;
      var opts = [], y, x;
      for (y = 0; y < N; y++) for (x = 0; x < N; x++) {
        if (d.sol[y][x] && d.cell[y][x] !== d.sol[y][x]) opts.push(y * N + x);
      }
      if (!opts.length) return;
      var i = U.choice(opts), yy = (i / N) | 0, xx = i % N;
      d.cell[yy][xx] = d.sol[yy][xx];
      d.hints--;
      d.hintsUsed++;
      g.score = Math.max(0, g.score - 120);
      recount(d);
      paintCell(g, i);
      markLine(g, yy, xx);
      refreshHint(g);
      paintStats(g);
      var p = centreIn(cells[i], host);
      fx.ring(p[0], p[1], '#fde68a', 34);
      fx.text(p[0], p[1], '-120', '#fde68a', 15);
      Milo.sound.powerup();
      if (d.left === 0) solved(g);
    }

    function refreshHint(g) {
      if (!hintBtn) return;
      hintBtn.textContent = '💡 Hint (' + g.data.hints + ')';
      hintBtn.disabled = !g.data.hints;
    }

    /* -------------------------------------------------------------- drawing */

    function paintCell(g, i) {
      var d = g.data, v = d.cell[(i / N) | 0][i % N], node = cells[i];
      node.classList.toggle('x', v === 3);
      node.classList.toggle('on', v === 1 || v === 2);
      node.style.background = (v === 1 || v === 2) ? d.inks[v - 1] : '';
    }

    function redrawAll(g) {
      for (var i = 0; i < cells.length; i++) paintCell(g, i);
      for (var y = 0; y < N; y++) markRow(g, y);
      for (var x = 0; x < N; x++) markCol(g, x);
    }

    function lineDone(player, sol, inks) {
      for (var k = 1; k <= inks; k++) if (!sameRuns(runsOf(player, k), runsOf(sol, k))) return false;
      return true;
    }

    function markRow(g, y) {
      var d = g.data, player = [], i;
      for (i = 0; i < N; i++) player.push(d.cell[y][i] === 3 ? 0 : d.cell[y][i]);
      var ok = lineDone(player, d.sol[y], d.inks.length);
      for (i = 0; i < rowKeys[y].length; i++) rowKeys[y][i].classList.toggle('done', ok);
    }

    function markCol(g, x) {
      var d = g.data, player = [], sol = [], i;
      for (i = 0; i < N; i++) { player.push(d.cell[i][x] === 3 ? 0 : d.cell[i][x]); sol.push(d.sol[i][x]); }
      var ok = lineDone(player, sol, d.inks.length);
      for (i = 0; i < colKeys[x].length; i++) colKeys[x][i].classList.toggle('done', ok);
    }

    function markLine(g, y, x) { markRow(g, y); markCol(g, x); }

    function paintStats(g) {
      var d = g.data;
      g.set('Lives', hearts(d.lives, opt.lives));
      g.set('Score', U.fmt(g.score));
    }

    /* ------------------------------------------------------------ end state */

    function bust(g) {
      g.data.done = true;
      drag = null;
      Milo.sound.explode();
      g.gameOver({
        emo: '💔',
        title: 'Out of lives',
        text: 'Filled one square too many that the clues had already ruled out. You got through ' +
          (g.data.puzzle - 1) + ' picture' + (g.data.puzzle === 2 ? '' : 's') +
          ' and were working on ' + article(g.data.name) + g.data.name.toLowerCase() + '.',
        score: g.score
      });
    }

    function solved(g) {
      var d = g.data;
      d.done = true;
      drag = null;
      grid.classList.add('won');
      var bonus = Math.max(0, Math.round((opt.par - d.time) * opt.tick));
      var clean = d.mistakes === 0 ? Math.round(opt.base * .4) : 0;
      var earned = opt.base + bonus + clean;
      g.score += earned;
      if (!d.mistakes && d.lives < opt.lives) d.lives++;
      paintStats(g);
      Milo.sound.win();
      var box = centreIn(grid, host);
      fx.ring(box[0], box[1], d.inks[0], 190);
      fx.text(box[0], box[1] - 24, '+' + U.fmt(earned), '#fde68a', 28);
      for (var i = 0; i < 5; i++) {
        (function (k) {
          setTimeout(function () {
            if (!fx) return;
            fx.burst(box[0] + U.rand(-90, 90), box[1] + U.rand(-80, 80), 13,
              [d.inks[0], d.inks[d.inks.length - 1], '#ffffff', '#fde68a']);
          }, k * 120);
        })(i);
      }
      var last = d.puzzle >= opt.run;
      var name = d.name.toLowerCase(), took = U.time(d.time), miss = d.mistakes;
      setTimeout(function () {
        if (!GAME || GAME.state === 'over') return;
        if (last) {
          g.win({
            emo: opt.emo, title: 'Gallery complete!',
            text: 'All ' + opt.run + ' pictures at ' + N + '×' + N + ' — the last was ' +
              article(name) + name + ', cleared in ' + took + '.',
            score: g.score
          });
          return;
        }
        g.overlay({
          emo: opt.emo,
          title: 'It’s ' + article(name) + name + '!',
          text: took + ', ' + miss + ' mis-fill' + (miss === 1 ? '' : 's') + ' — worth ' + U.fmt(earned) + '.' +
            (bonus > 0 ? ' Speed bonus ' + bonus + '.' : '') +
            (clean ? ' Flawless bonus ' + clean + ', and a life back.' : ''),
          score: g.score, best: g.best, newBest: Milo.store.setBest(opt.id, g.score),
          actions: [
            { label: 'Next picture →', primary: true, onClick: function () { next(g); } },
            { label: 'Start over', onClick: function () { g.restart(); } }
          ]
        });
      }, 850);
    }

    function next(g) {
      g.clearOverlay();
      g.data.puzzle++;
      load(g);
      g.state = 'play';
      g.best = Milo.store.best(opt.id);
    }

    /* ----------------------------------------------------------- lifecycle */

    function reset(g) {
      GAME = g;
      if (!fx) fx = makeFx(host);
      fx.clear();
      if (!unwatch) unwatch = watchSize(host, relayout);
      var d = g.data;
      d.puzzle = 1; d.mistakes = 0; d.hintsUsed = 0; d.lives = opt.lives;
      bag = [];
      load(g);
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    return Milo.domGame(host, {
      id: opt.id,
      stats: ['Lives', 'Time', 'Score'],
      bg: opt.bg,
      emo: opt.emo,
      start: {
        title: opt.title,
        text: opt.blurb,
        keys: ['Click / drag to fill', 'Right-click to cross out', 'H for a hint']
      },
      init: reset,
      onKey: function (g, e) {
        if (e.code === 'Digit1') setInk(g, 1);
        else if (e.code === 'Digit2') setInk(g, 2);
        else if (e.code === 'KeyH') useHint(g);
      },
      update: function (g, dt) {
        if (g.data.done) return;
        g.data.time += dt;
        g.set('Time', U.time(g.data.time));
      },
      destroy: function () {
        clearTimeout(lpTimer);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        if (unwatch) { unwatch(); unwatch = null; }
        if (fx) { fx.destroy(); fx = null; }
        grid = null; GAME = null; cells = [];
      }
    });
  }

  /* ============================================================ skyscrapers */

  var PERM_CACHE = {};
  function permsOf(n) {
    if (PERM_CACHE[n]) return PERM_CACHE[n];
    var out = [], cur = [], used = new Array(n + 1).fill(false);
    (function rec() {
      if (cur.length === n) { out.push(cur.slice()); return; }
      for (var v = 1; v <= n; v++) {
        if (used[v]) continue;
        used[v] = true; cur.push(v);
        rec();
        cur.pop(); used[v] = false;
      }
    })();
    PERM_CACHE[n] = out;
    return out;
  }

  /** How many towers you can see looking along `line` from its first cell. */
  function visCount(line) {
    var m = 0, c = 0;
    for (var i = 0; i < line.length; i++) if (line[i] > m) { m = line[i]; c++; }
    return c;
  }

  function revd(a) { return a.slice().reverse(); }

  /** Counts solutions of a clue set, capped at `cap`. Clue 0 means hidden. */
  function skySolve(n, clue, cap) {
    var P = permsOf(n), rowOpts = [], r, i, c;
    for (r = 0; r < n; r++) {
      var opts = [];
      for (i = 0; i < P.length; i++) {
        var p = P[i];
        if (clue.l[r] && visCount(p) !== clue.l[r]) continue;
        if (clue.r[r] && visCount(revd(p)) !== clue.r[r]) continue;
        opts.push(p);
      }
      if (!opts.length) return 0;
      rowOpts.push(opts);
    }
    var found = 0, rows = [], colUsed = new Array(n).fill(0);

    function colsOk(depth) {
      for (var cc = 0; cc < n; cc++) {
        var mx = 0, vis = 0;
        for (var y = 0; y < depth; y++) { var v = rows[y][cc]; if (v > mx) { mx = v; vis++; } }
        if (clue.t[cc]) {
          if (vis > clue.t[cc]) return false;
          if ((mx === n || depth === n) && vis !== clue.t[cc]) return false;
        }
        if (depth === n && clue.b[cc]) {
          var mx2 = 0, v2 = 0;
          for (var y2 = n - 1; y2 >= 0; y2--) { var w = rows[y2][cc]; if (w > mx2) { mx2 = w; v2++; } }
          if (v2 !== clue.b[cc]) return false;
        }
      }
      return true;
    }

    function rec(depth) {
      if (depth === n) { found++; return found >= cap; }
      var opts = rowOpts[depth];
      for (var k = 0; k < opts.length; k++) {
        var p = opts[k], ok = true, j;
        for (j = 0; j < n; j++) if (colUsed[j] & (1 << p[j])) { ok = false; break; }
        if (!ok) continue;
        for (j = 0; j < n; j++) colUsed[j] |= (1 << p[j]);
        rows[depth] = p;
        var stop = colsOk(depth + 1) && rec(depth + 1);
        for (j = 0; j < n; j++) colUsed[j] &= ~(1 << p[j]);
        if (stop) return true;
      }
      return false;
    }

    rec(0);
    return found;
  }

  function randLatin(n) {
    var P = U.shuffle(permsOf(n).slice()), rows = [], colUsed = new Array(n).fill(0);
    function rec(r) {
      if (r === n) return true;
      for (var i = 0; i < P.length; i++) {
        var p = P[i], ok = true, j;
        for (j = 0; j < n; j++) if (colUsed[j] & (1 << p[j])) { ok = false; break; }
        if (!ok) continue;
        for (j = 0; j < n; j++) colUsed[j] |= (1 << p[j]);
        rows[r] = p;
        if (rec(r + 1)) return true;
        for (j = 0; j < n; j++) colUsed[j] &= ~(1 << p[j]);
      }
      return false;
    }
    return rec(0) ? rows : null;
  }

  function skyClues(n, rows) {
    var t = [], b = [], l = [], rr = [], c, y;
    for (c = 0; c < n; c++) {
      var col = [];
      for (y = 0; y < n; y++) col.push(rows[y][c]);
      t.push(visCount(col)); b.push(visCount(revd(col)));
    }
    for (y = 0; y < n; y++) { l.push(visCount(rows[y])); rr.push(visCount(revd(rows[y]))); }
    return { t: t, b: b, l: l, r: rr };
  }

  /**
   * Builds a puzzle with at most `keep` visible edge clues, brute-force
   * checking after every removal that exactly one solution survives.
   */
  function genSky(n, keep) {
    for (var att = 0; att < 40; att++) {
      var sol = randLatin(n);
      if (!sol) continue;
      var clue = skyClues(n, sol), slots = [], i;
      for (i = 0; i < n; i++) slots.push(['t', i], ['b', i], ['l', i], ['r', i]);
      U.shuffle(slots);
      var count = 4 * n;
      for (var k = 0; k < slots.length && count > keep; k++) {
        var s = slots[k], save = clue[s[0]][s[1]];
        if (!save) continue;
        clue[s[0]][s[1]] = 0;
        if (skySolve(n, clue, 2) === 1) count--;
        else clue[s[0]][s[1]] = save;
      }
      if (count <= keep + 1) return { sol: sol, clue: clue, given: count };
    }
    return null;
  }

  var SKY_KEEP = {
    4: [11, 10, 9, 8, 8, 7, 6, 6],
    5: [15, 14, 13, 12, 11, 10, 9, 8]
  };

  function mountSky(host, opt) {
    var N = opt.size, RUN = 8;
    var GAME = null, fx = null, unwatch = null;
    var grid = null, wrapEl = null, cellEls = [], clueEls = { t: [], b: [], l: [], r: [] };
    var hintBtn = null, chips = [];

    function load(g) {
      var d = g.data;
      var keep = SKY_KEEP[N][Math.min(d.level, RUN) - 1];
      var made = genSky(N, keep) || genSky(N, keep + 3) || genSky(N, 4 * N);
      d.sol = made.sol;
      d.clue = made.clue;
      d.given = made.given;
      d.cell = [];
      for (var y = 0; y < N; y++) d.cell.push(new Array(N).fill(0));
      d.sel = -1;
      d.time = 0;
      d.done = false;
      d.hints = 3;
      build(g);
      stats(g);
    }

    function build(g) {
      var d = g.data, y, x, i;
      var root = g.root;
      root.innerHTML = '';
      styleInto(root);
      var wrap = el('div', 'lp-wrap');

      var head = el('div', 'lp-head');
      head.appendChild(el('b', null, 'City ' + d.level));
      head.appendChild(el('span', null, N + ' × ' + N + ' · ' + d.given + ' clues · ' + d.level + ' of ' + RUN));
      wrap.appendChild(head);

      grid = el('div', 'lp-grid');
      grid.style.gridTemplateColumns = 'repeat(' + (N + 2) + ', var(--c))';
      grid.style.gridTemplateRows = 'repeat(' + (N + 2) + ', var(--c))';
      cellEls = [];
      clueEls = { t: [], b: [], l: [], r: [] };

      function clueBox(side, idx) {
        var v = d.clue[side][idx];
        var n = el('div', 'lp-clue', v ? String(v) : '');
        clueEls[side][idx] = n;
        return n;
      }

      grid.appendChild(el('div'));
      for (x = 0; x < N; x++) grid.appendChild(clueBox('t', x));
      grid.appendChild(el('div'));
      for (y = 0; y < N; y++) {
        grid.appendChild(clueBox('l', y));
        for (x = 0; x < N; x++) {
          var c = el('div', 'lp-num');
          c.setAttribute('data-i', y * N + x);
          cellEls.push(c);
          grid.appendChild(c);
        }
        grid.appendChild(clueBox('r', y));
      }
      grid.appendChild(el('div'));
      for (x = 0; x < N; x++) grid.appendChild(clueBox('b', x));
      grid.appendChild(el('div'));
      wrap.appendChild(grid);

      var pad = el('div', 'lp-bar');
      chips = [];
      for (i = 1; i <= N; i++) {
        (function (v) {
          var b = el('button', 'lp-chip', String(v));
          b.type = 'button';
          b.addEventListener('click', function () { place(g, v); });
          chips.push(b);
          pad.appendChild(b);
        })(i);
      }
      var erase = el('button', 'lp-chip', '✕');
      erase.type = 'button';
      erase.addEventListener('click', function () { place(g, 0); });
      pad.appendChild(erase);
      wrap.appendChild(pad);

      var bar = el('div', 'lp-bar');
      hintBtn = el('button', 'lp-btn');
      hintBtn.type = 'button';
      hintBtn.addEventListener('click', function () { useHint(g); });
      bar.appendChild(hintBtn);
      var clr = el('button', 'lp-btn', 'Clear grid');
      clr.type = 'button';
      clr.addEventListener('click', function () { wipe(g); });
      bar.appendChild(clr);
      wrap.appendChild(bar);

      wrap.appendChild(el('div', 'lp-note',
        'Every row and column holds each height 1–' + N + ' exactly once. A number outside the grid ' +
        'is how many towers you can see from there — taller ones hide everything shorter behind them.'));

      root.appendChild(wrap);
      wrapEl = wrap;
      grid.addEventListener('pointerdown', onDown);
      refreshHint(g);
      relayout();
      redraw(g);
    }

    function relayout() {
      if (!grid || !wrapEl) return;
      var cs = grid.querySelectorAll('.lp-clue');
      fitBoard(host, wrapEl, grid, N + 2, 20, 72, function (c) {
        grid.style.gap = Math.max(1, Math.round(c * .05)) + 'px';
        var i, cw = Math.max(24, Math.round(c * .68));
        for (i = 0; i < cellEls.length; i++) cellEls[i].style.fontSize = Math.round(c * .48) + 'px';
        for (i = 0; i < cs.length; i++) cs[i].style.fontSize = Math.round(c * .38) + 'px';
        for (i = 0; i < chips.length; i++) {
          chips[i].style.minWidth = cw + 'px';
          chips[i].style.fontSize = Math.max(12, Math.round(cw * .46)) + 'px';
          chips[i].style.padding = Math.max(3, Math.round(cw * .12)) + 'px 0';
        }
      });
    }

    /* -------------------------------------------------------- interaction */

    function onDown(e) {
      var g = GAME;
      if (!g || g.state !== 'play' || g.data.done) return;
      var t = document.elementFromPoint(e.clientX, e.clientY);
      if (!t || !t.classList || !t.classList.contains('lp-num')) return;
      e.preventDefault();
      var i = +t.getAttribute('data-i'), d = g.data;
      if (d.sel === i && d.cell[(i / N) | 0][i % N]) place(g, 0);
      else { d.sel = i; Milo.sound.click(); }
      redraw(g);
    }

    function place(g, v) {
      var d = g.data;
      if (g.state !== 'play' || d.done || d.sel < 0) return;
      var y = (d.sel / N) | 0, x = d.sel % N;
      if (d.cell[y][x] === v) return;
      d.cell[y][x] = v;
      if (v) {
        Milo.sound.tone({ f: 380 + v * 70, d: .06, v: .07, type: 'triangle' });
        var p = centreIn(cellEls[d.sel], host);
        fx.ring(p[0], p[1], '#22d3ee', 22);
      } else Milo.sound.click();
      // Step on to the next empty square so a run of entries stays quick.
      if (v) {
        for (var k = 1; k <= N * N; k++) {
          var j = (d.sel + k) % (N * N);
          if (!d.cell[(j / N) | 0][j % N]) { d.sel = j; break; }
        }
      }
      redraw(g);
      checkWin(g);
    }

    function wipe(g) {
      var d = g.data;
      if (g.state !== 'play' || d.done) return;
      for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) d.cell[y][x] = 0;
      Milo.sound.click();
      redraw(g);
    }

    function useHint(g) {
      var d = g.data;
      if (g.state !== 'play' || d.done || !d.hints) return;
      var opts = [], y, x;
      for (y = 0; y < N; y++) for (x = 0; x < N; x++) if (d.cell[y][x] !== d.sol[y][x]) opts.push(y * N + x);
      if (!opts.length) return;
      var i = U.choice(opts);
      d.cell[(i / N) | 0][i % N] = d.sol[(i / N) | 0][i % N];
      d.hints--;
      g.score = Math.max(0, g.score - 120);
      var p = centreIn(cellEls[i], host);
      fx.ring(p[0], p[1], '#fde68a', 34);
      fx.text(p[0], p[1], '-120', '#fde68a', 15);
      Milo.sound.powerup();
      refreshHint(g);
      stats(g);
      redraw(g);
      checkWin(g);
    }

    function refreshHint(g) {
      if (!hintBtn) return;
      hintBtn.textContent = '💡 Hint (' + g.data.hints + ')';
      hintBtn.disabled = !g.data.hints;
    }

    /* ------------------------------------------------------------- drawing */

    function redraw(g) {
      var d = g.data, y, x, i, v;
      var dupe = [];
      for (i = 0; i < N * N; i++) dupe.push(false);
      for (y = 0; y < N; y++) {
        for (x = 0; x < N; x++) {
          v = d.cell[y][x];
          if (!v) continue;
          for (var k = 0; k < N; k++) {
            if (k !== x && d.cell[y][k] === v) { dupe[y * N + x] = true; }
            if (k !== y && d.cell[k][x] === v) { dupe[y * N + x] = true; }
          }
        }
      }
      for (i = 0; i < cellEls.length; i++) {
        v = d.cell[(i / N) | 0][i % N];
        cellEls[i].textContent = v ? String(v) : '';
        cellEls[i].classList.toggle('sel', d.sel === i);
        cellEls[i].classList.toggle('dupe', dupe[i]);
      }
      // Edge clues turn green once their line is finished and matches.
      for (y = 0; y < N; y++) {
        var row = d.cell[y].slice(), full = row.indexOf(0) < 0;
        tint(clueEls.l[y], d.clue.l[y], full ? visCount(row) : -1);
        tint(clueEls.r[y], d.clue.r[y], full ? visCount(revd(row)) : -1);
      }
      for (x = 0; x < N; x++) {
        var col = [];
        for (y = 0; y < N; y++) col.push(d.cell[y][x]);
        var cfull = col.indexOf(0) < 0;
        tint(clueEls.t[x], d.clue.t[x], cfull ? visCount(col) : -1);
        tint(clueEls.b[x], d.clue.b[x], cfull ? visCount(revd(col)) : -1);
      }
    }

    function tint(node, want, got) {
      node.classList.remove('ok', 'no');
      if (!want || got < 0) return;
      node.classList.add(got === want ? 'ok' : 'no');
    }

    function stats(g) {
      g.set('City', g.data.level + '/' + RUN);
      g.set('Score', U.fmt(g.score));
    }

    /* ----------------------------------------------------------- end state */

    function checkWin(g) {
      var d = g.data, y, x;
      for (y = 0; y < N; y++) for (x = 0; x < N; x++) if (d.cell[y][x] !== d.sol[y][x]) return;
      d.done = true;
      grid.classList.add('won');
      var bonus = Math.max(0, Math.round((opt.par - d.time) * 6));
      var earned = opt.base + bonus + d.level * 40;
      g.score += earned;
      stats(g);
      Milo.sound.win();
      var box = centreIn(grid, host);
      fx.ring(box[0], box[1], '#22d3ee', 170);
      fx.text(box[0], box[1] - 20, '+' + U.fmt(earned), '#fde68a', 26);
      for (var i = 0; i < 4; i++) {
        (function (k) {
          setTimeout(function () {
            if (!fx) return;
            fx.burst(box[0] + U.rand(-80, 80), box[1] + U.rand(-70, 70), 12,
              ['#22d3ee', '#7c5cff', '#fde68a', '#ffffff']);
          }, k * 120);
        })(i);
      }
      var last = d.level >= RUN, took = U.time(d.time);
      setTimeout(function () {
        if (!GAME || GAME.state === 'over') return;
        if (last) {
          g.win({
            emo: '🏙️', title: 'Skyline signed off!',
            text: 'All ' + RUN + ' cities laid out. The last one took ' + took + '.',
            score: g.score
          });
          return;
        }
        g.overlay({
          emo: '🏙️', title: 'City ' + d.level + ' zoned!',
          text: took + ' — worth ' + U.fmt(earned) + '.' + (bonus ? ' Speed bonus ' + bonus + '.' : '') +
            ' Next city drops to ' + SKY_KEEP[N][d.level] + ' clues.',
          score: g.score, best: g.best, newBest: Milo.store.setBest(opt.id, g.score),
          actions: [
            { label: 'Next city →', primary: true, onClick: function () { next(g); } },
            { label: 'Start over', onClick: function () { g.restart(); } }
          ]
        });
      }, 850);
    }

    function next(g) {
      g.clearOverlay();
      g.data.level++;
      load(g);
      g.state = 'play';
      g.best = Milo.store.best(opt.id);
    }

    function reset(g) {
      GAME = g;
      if (!fx) fx = makeFx(host);
      fx.clear();
      if (!unwatch) unwatch = watchSize(host, relayout);
      g.data.level = 1;
      load(g);
    }

    return Milo.domGame(host, {
      id: opt.id,
      stats: ['City', 'Time', 'Score'],
      bg: opt.bg,
      emo: '🏙️',
      start: {
        title: opt.title,
        text: opt.blurb,
        keys: ['Tap a square', 'Tap a height', '1–' + N + ' keys']
      },
      init: reset,
      onKey: function (g, e) {
        var d = g.data;
        if (e.code === 'KeyH') { useHint(g); return; }
        if (d.sel < 0) d.sel = 0;
        var y = (d.sel / N) | 0, x = d.sel % N;
        if (e.code === 'ArrowLeft') { d.sel = y * N + (x + N - 1) % N; redraw(g); return; }
        if (e.code === 'ArrowRight') { d.sel = y * N + (x + 1) % N; redraw(g); return; }
        if (e.code === 'ArrowUp') { d.sel = ((y + N - 1) % N) * N + x; redraw(g); return; }
        if (e.code === 'ArrowDown') { d.sel = ((y + 1) % N) * N + x; redraw(g); return; }
        if (e.code === 'Backspace' || e.code === 'Delete' || e.code === 'Digit0') { place(g, 0); return; }
        var m = /^Digit([1-9])$/.exec(e.code);
        if (m && +m[1] <= N) place(g, +m[1]);
      },
      update: function (g, dt) {
        if (g.data.done) return;
        g.data.time += dt;
        g.set('Time', U.time(g.data.time));
      },
      destroy: function () {
        if (unwatch) { unwatch(); unwatch = null; }
        if (fx) { fx.destroy(); fx = null; }
        grid = null; GAME = null; cellEls = [];
      }
    });
  }

  /* =========================================================== magic squares */

  var MAGIC3 = [2, 7, 6, 9, 5, 1, 4, 3, 8];

  function magicTransform(a, n, t) {
    var out = a.slice(), tmp, x, y, k;
    for (k = 0; k < (t & 3); k++) {
      tmp = new Array(n * n);
      for (y = 0; y < n; y++) for (x = 0; x < n; x++) tmp[x * n + (n - 1 - y)] = out[y * n + x];
      out = tmp;
    }
    if (t & 4) {
      tmp = new Array(n * n);
      for (y = 0; y < n; y++) for (x = 0; x < n; x++) tmp[y * n + (n - 1 - x)] = out[y * n + x];
      out = tmp;
    }
    return out;
  }

  /**
   * Counts the ways `given` (0 = blank) completes to a magic square, capped at
   * `cap`. Returns -1 if the search budget ran out.
   */
  function magicSolve(n, given, cap, budget) {
    var T = n * n, M = n === 3 ? 15 : 34;
    var grid = given.slice(), pool = [], seen = {}, i, v;
    for (i = 0; i < T; i++) if (grid[i]) seen[grid[i]] = 1;
    for (v = 1; v <= T; v++) if (!seen[v]) pool.push(v);
    var found = 0, steps = 0, over = false;

    function drop(val) { pool.splice(pool.indexOf(val), 1); }
    function give(val) {
      var lo = 0;
      while (lo < pool.length && pool[lo] < val) lo++;
      pool.splice(lo, 0, val);
    }

    function fits(k, r, c) {
      var rs = 0, q;
      for (q = 0; q <= c; q++) rs += grid[r * n + q];
      if (rs > M) return false;
      if (c === n - 1) { if (rs !== M) return false; }
      else {
        var rem = 0, fixed = 0;
        for (q = c + 1; q < n; q++) { if (grid[r * n + q]) fixed += grid[r * n + q]; else rem++; }
        var lo = fixed, hi = fixed;
        for (q = 0; q < rem; q++) { lo += pool[q]; hi += pool[pool.length - 1 - q]; }
        if (rs + lo > M || rs + hi < M) return false;
      }
      var cs = 0;
      for (q = 0; q <= r; q++) cs += grid[q * n + c];
      if (cs > M) return false;
      if (r === n - 1 && cs !== M) return false;
      return true;
    }

    function place(k) {
      if (++steps > budget) { over = true; return true; }
      if (k === T) {
        var d1 = 0, d2 = 0;
        for (var j = 0; j < n; j++) { d1 += grid[j * n + j]; d2 += grid[j * n + (n - 1 - j)]; }
        if (d1 === M && d2 === M) found++;
        return found >= cap;
      }
      var r = (k / n) | 0, c = k % n;
      if (grid[k]) return fits(k, r, c) && place(k + 1);
      var vals = pool.slice();
      for (var q = 0; q < vals.length; q++) {
        var val = vals[q];
        drop(val); grid[k] = val;
        var stop = fits(k, r, c) && place(k + 1);
        grid[k] = 0; give(val);
        if (stop) return true;
      }
      return false;
    }

    place(0);
    return over ? -1 : found;
  }

  /** Reveals as few cells as possible while the square stays the only answer. */
  function genMagic(n, keep) {
    var T = n * n;
    var base = magicTransform(n === 3 ? MAGIC3 : U.choice(MAGIC4), n, U.randInt(0, 7));
    var given = base.slice(), order = shuffledBag(T), count = T;
    for (var i = 0; i < order.length && count > keep; i++) {
      var idx = order[i], save = given[idx];
      given[idx] = 0;
      if (magicSolve(n, given, 2, 900000) === 1) count--;
      else given[idx] = save;
    }
    return { sol: base, given: given, count: count };
  }

  var MAGIC_LV = [
    [3, 5], [3, 4], [3, 4], [3, 3], [3, 3], [3, 2],
    [4, 11], [4, 10], [4, 9], [4, 9], [4, 8], [4, 7]
  ];

  function mountMagic(host) {
    var ID = 'magic-15', RUN = MAGIC_LV.length;
    var GAME = null, fx = null, unwatch = null;
    var grid = null, wrapEl = null, cellEls = [], sumEls = [], colEls = [], diagEls = [], chipEls = [];
    var hintBtn = null, N = 3, M = 15, typed = '', typeTimer = 0;

    function load(g) {
      var d = g.data, spec = MAGIC_LV[Math.min(d.level, RUN) - 1];
      N = spec[0];
      M = N === 3 ? 15 : 34;
      var made = genMagic(N, spec[1]);
      d.n = N; d.m = M;
      d.sol = made.sol;
      d.fix = made.given.map(function (v) { return v !== 0; });
      d.cell = made.given.slice();
      d.given = made.count;
      d.sel = -1;
      for (var i = 0; i < N * N; i++) if (!d.fix[i]) { d.sel = i; break; }
      d.time = 0; d.done = false; d.hints = 2;
      build(g);
      stats(g);
    }

    function build(g) {
      var d = g.data, i, x, y;
      var root = g.root;
      root.innerHTML = '';
      styleInto(root);
      var wrap = el('div', 'lp-wrap');

      var head = el('div', 'lp-head');
      head.appendChild(el('b', null, N === 3 ? 'Sum to 15' : 'Sum to 34'));
      head.appendChild(el('span', null, 'Level ' + d.level + ' of ' + RUN + ' · ' + N + ' × ' + N +
        ' · ' + d.given + ' given'));
      wrap.appendChild(head);

      grid = el('div', 'lp-grid');
      grid.style.gridTemplateColumns = 'repeat(' + (N + 1) + ', var(--c))';
      grid.style.gridTemplateRows = 'repeat(' + (N + 1) + ', var(--c))';
      cellEls = []; sumEls = []; colEls = [];
      for (y = 0; y < N; y++) {
        for (x = 0; x < N; x++) {
          var c = el('div', 'lp-num' + (d.fix[y * N + x] ? ' fix' : ''));
          c.setAttribute('data-i', y * N + x);
          cellEls.push(c);
          grid.appendChild(c);
        }
        var rs = el('div', 'lp-sum');
        sumEls.push(rs);
        grid.appendChild(rs);
      }
      for (x = 0; x < N; x++) {
        var cs = el('div', 'lp-sum');
        colEls.push(cs);
        grid.appendChild(cs);
      }
      var corner = el('div', 'lp-sum');
      diagEls = [corner];
      grid.appendChild(corner);
      wrap.appendChild(grid);

      var tray = el('div', 'lp-bar');
      tray.style.maxWidth = '420px';
      chipEls = [];
      for (i = 1; i <= N * N; i++) {
        (function (v) {
          var b = el('button', 'lp-chip', String(v));
          b.type = 'button';
          b.addEventListener('click', function () { put(g, v); });
          chipEls.push(b);
          tray.appendChild(b);
        })(i);
      }
      wrap.appendChild(tray);

      var bar = el('div', 'lp-bar');
      var dd = el('div', 'lp-sum');
      dd.style.minWidth = '64px';
      diagEls.push(dd);
      bar.appendChild(dd);
      hintBtn = el('button', 'lp-btn');
      hintBtn.type = 'button';
      hintBtn.addEventListener('click', function () { useHint(g); });
      bar.appendChild(hintBtn);
      var clr = el('button', 'lp-btn', 'Clear entries');
      clr.type = 'button';
      clr.addEventListener('click', function () { wipe(g); });
      bar.appendChild(clr);
      wrap.appendChild(bar);

      wrap.appendChild(el('div', 'lp-note',
        'Use every number from 1 to ' + (N * N) + ' once so each row, each column and both ' +
        'diagonals add up to ' + M + '. Purple squares are fixed. Tap a square, then tap a number.'));

      root.appendChild(wrap);
      wrapEl = wrap;
      grid.addEventListener('pointerdown', onDown);
      refreshHint(g);
      relayout();
      redraw(g);
    }

    function relayout() {
      if (!grid || !wrapEl) return;
      fitBoard(host, wrapEl, grid, N + 1, 20, 84, function (c) {
        grid.style.gap = Math.max(2, Math.round(c * .06)) + 'px';
        var i, cw = Math.max(22, Math.round(c * .52));
        for (i = 0; i < cellEls.length; i++) cellEls[i].style.fontSize = Math.round(c * .42) + 'px';
        // The tray of sixteen chips is what squeezes a phone, so it shrinks with the board.
        for (i = 0; i < chipEls.length; i++) {
          chipEls[i].style.minWidth = cw + 'px';
          chipEls[i].style.fontSize = Math.max(11, Math.round(cw * .5)) + 'px';
          chipEls[i].style.padding = Math.max(2, Math.round(cw * .1)) + 'px 0';
        }
      });
    }

    /* -------------------------------------------------------- interaction */

    function onDown(e) {
      var g = GAME;
      if (!g || g.state !== 'play' || g.data.done) return;
      var t = document.elementFromPoint(e.clientX, e.clientY);
      if (!t || !t.classList || !t.classList.contains('lp-num')) return;
      e.preventDefault();
      var i = +t.getAttribute('data-i'), d = g.data;
      if (d.fix[i]) { Milo.sound.tone({ f: 200, d: .07, v: .06, type: 'triangle' }); return; }
      if (d.cell[i]) { d.cell[i] = 0; Milo.sound.click(); }
      d.sel = i;
      redraw(g);
    }

    function put(g, v) {
      var d = g.data;
      if (g.state !== 'play' || d.done || d.sel < 0 || d.fix[d.sel]) return;
      if (d.cell.indexOf(v) >= 0) {            // that number is already on the board
        Milo.sound.tone({ f: 200, f2: 150, d: .1, v: .07, type: 'triangle' });
        return;
      }
      d.cell[d.sel] = v;
      Milo.sound.tone({ f: 340 + v * 26, d: .07, v: .07, type: 'triangle' });
      var p = centreIn(cellEls[d.sel], host);
      fx.ring(p[0], p[1], '#7c5cff', 24);
      for (var k = 1; k <= N * N; k++) {
        var j = (d.sel + k) % (N * N);
        if (!d.cell[j] && !d.fix[j]) { d.sel = j; break; }
      }
      redraw(g);
      checkWin(g);
    }

    function wipe(g) {
      var d = g.data;
      if (g.state !== 'play' || d.done) return;
      for (var i = 0; i < N * N; i++) if (!d.fix[i]) d.cell[i] = 0;
      Milo.sound.click();
      redraw(g);
    }

    function useHint(g) {
      var d = g.data;
      if (g.state !== 'play' || d.done || !d.hints) return;
      var opts = [];
      for (var i = 0; i < N * N; i++) if (!d.fix[i] && d.cell[i] !== d.sol[i]) opts.push(i);
      if (!opts.length) return;
      var pickI = U.choice(opts), want = d.sol[pickI];
      var dup = d.cell.indexOf(want);
      if (dup >= 0 && !d.fix[dup]) d.cell[dup] = 0;
      d.cell[pickI] = want;
      d.fix[pickI] = true;
      d.hints--;
      g.score = Math.max(0, g.score - 150);
      var p = centreIn(cellEls[pickI], host);
      fx.ring(p[0], p[1], '#fde68a', 34);
      fx.text(p[0], p[1], '-150', '#fde68a', 15);
      Milo.sound.powerup();
      refreshHint(g);
      stats(g);
      redraw(g);
      checkWin(g);
    }

    function refreshHint(g) {
      if (!hintBtn) return;
      hintBtn.textContent = '💡 Hint (' + g.data.hints + ')';
      hintBtn.disabled = !g.data.hints;
    }

    /* ------------------------------------------------------------- drawing */

    function lineSum(d, idx, kind) {
      var s = 0, full = true, i, v;
      for (i = 0; i < N; i++) {
        v = kind === 'row' ? d.cell[idx * N + i]
          : kind === 'col' ? d.cell[i * N + idx]
            : kind === 'd1' ? d.cell[i * N + i] : d.cell[i * N + (N - 1 - i)];
        if (!v) full = false;
        s += v;
      }
      return { sum: s, full: full };
    }

    function badge(node, r, label) {
      node.textContent = (label || '') + r.sum;
      node.classList.remove('ok', 'no');
      if (r.full) node.classList.add(r.sum === M ? 'ok' : 'no');
    }

    function redraw(g) {
      var d = g.data, i;
      for (i = 0; i < cellEls.length; i++) {
        cellEls[i].textContent = d.cell[i] ? String(d.cell[i]) : '';
        cellEls[i].classList.toggle('sel', d.sel === i);
        cellEls[i].classList.toggle('fix', !!d.fix[i]);
        cellEls[i].classList.toggle('ent', !d.fix[i] && !!d.cell[i]);
      }
      for (i = 0; i < N; i++) badge(sumEls[i], lineSum(d, i, 'row'));
      for (i = 0; i < N; i++) badge(colEls[i], lineSum(d, i, 'col'));
      badge(diagEls[0], lineSum(d, 0, 'd1'), '↘ ');
      badge(diagEls[1], lineSum(d, 0, 'd2'), '↗ ');
      for (i = 0; i < chipEls.length; i++) {
        chipEls[i].classList.toggle('gone', d.cell.indexOf(i + 1) >= 0);
      }
    }

    function stats(g) {
      g.set('Level', g.data.level + '/' + RUN);
      g.set('Score', U.fmt(g.score));
    }

    /* ----------------------------------------------------------- end state */

    function checkWin(g) {
      var d = g.data, i;
      for (i = 0; i < N * N; i++) if (!d.cell[i]) return;
      for (i = 0; i < N; i++) {
        if (lineSum(d, i, 'row').sum !== M) return;
        if (lineSum(d, i, 'col').sum !== M) return;
      }
      if (lineSum(d, 0, 'd1').sum !== M || lineSum(d, 0, 'd2').sum !== M) return;
      d.done = true;
      grid.classList.add('won');
      var bonus = Math.max(0, Math.round((90 + N * 40 - d.time) * 5));
      var earned = 260 + d.level * 55 + bonus;
      g.score += earned;
      stats(g);
      Milo.sound.win();
      var box = centreIn(grid, host);
      fx.ring(box[0], box[1], '#7c5cff', 165);
      fx.text(box[0], box[1] - 18, '+' + U.fmt(earned), '#fde68a', 26);
      for (i = 0; i < 4; i++) {
        (function (k) {
          setTimeout(function () {
            if (!fx) return;
            fx.burst(box[0] + U.rand(-80, 80), box[1] + U.rand(-70, 70), 12,
              ['#7c5cff', '#22d3ee', '#fde68a', '#ffffff']);
          }, k * 120);
        })(i);
      }
      var last = d.level >= RUN, took = U.time(d.time);
      setTimeout(function () {
        if (!GAME || GAME.state === 'over') return;
        if (last) {
          g.win({
            emo: '🔢', title: 'Every square balanced!',
            text: 'All ' + RUN + ' levels solved, right through the 4×4 boards. Last one: ' + took + '.',
            score: g.score
          });
          return;
        }
        var nx = MAGIC_LV[d.level];
        g.overlay({
          emo: '🔢', title: 'Balanced!',
          text: took + ' — worth ' + U.fmt(earned) + '.' + (bonus ? ' Speed bonus ' + bonus + '.' : '') +
            ' Next: a ' + nx[0] + '×' + nx[0] + ' board with about ' + nx[1] + ' numbers given.',
          score: g.score, best: g.best, newBest: Milo.store.setBest(ID, g.score),
          actions: [
            { label: 'Next square →', primary: true, onClick: function () { next(g); } },
            { label: 'Start over', onClick: function () { g.restart(); } }
          ]
        });
      }, 850);
    }

    function next(g) {
      g.clearOverlay();
      g.data.level++;
      load(g);
      g.state = 'play';
      g.best = Milo.store.best(ID);
    }

    function reset(g) {
      GAME = g;
      if (!fx) fx = makeFx(host);
      fx.clear();
      if (!unwatch) unwatch = watchSize(host, relayout);
      g.data.level = 1;
      load(g);
    }

    return Milo.domGame(host, {
      id: ID,
      stats: ['Level', 'Time', 'Score'],
      bg: '#131033',
      emo: '🔢',
      start: {
        title: 'Magic 15',
        text: 'Drop 1–9 into the grid so every row, column and diagonal adds up to 15 — then the ' +
          'board grows to 4×4 and the target becomes 34, with fewer numbers handed to you each level.',
        keys: ['Tap a square', 'Tap a number', 'Type digits']
      },
      init: reset,
      onKey: function (g, e) {
        if (e.code === 'KeyH') { useHint(g); return; }
        var d = g.data;
        if (e.code === 'Backspace' || e.code === 'Delete') {
          if (d.sel >= 0 && !d.fix[d.sel]) { d.cell[d.sel] = 0; redraw(g); }
          return;
        }
        if (d.sel < 0) return;
        var y = (d.sel / N) | 0, x = d.sel % N;
        if (e.code === 'ArrowLeft') { d.sel = y * N + (x + N - 1) % N; redraw(g); return; }
        if (e.code === 'ArrowRight') { d.sel = y * N + (x + 1) % N; redraw(g); return; }
        if (e.code === 'ArrowUp') { d.sel = ((y + N - 1) % N) * N + x; redraw(g); return; }
        if (e.code === 'ArrowDown') { d.sel = ((y + 1) % N) * N + x; redraw(g); return; }
        var m = /^Digit([0-9])$/.exec(e.code);
        if (!m) return;
        clearTimeout(typeTimer);
        typed += m[1];
        var val = parseInt(typed, 10);
        if (val < 1 || val > N * N) { typed = ''; return; }
        if (val * 10 > N * N) { put(g, val); typed = ''; return; }
        typeTimer = setTimeout(function () {
          var only = parseInt(typed, 10);
          typed = '';
          if (only >= 1 && only <= N * N) put(g, only);
        }, 480);
      },
      update: function (g, dt) {
        if (g.data.done) return;
        g.data.time += dt;
        g.set('Time', U.time(g.data.time));
      },
      destroy: function () {
        clearTimeout(typeTimer);
        if (unwatch) { unwatch(); unwatch = null; }
        if (fx) { fx.destroy(); fx = null; }
        grid = null; GAME = null; cellEls = [];
      }
    });
  }

  /* ============================================================ number path */

  function dec36(s) {
    var out = [];
    for (var i = 0; i < s.length; i += 2) out.push(parseInt(s.substr(i, 2), 36));
    return out;
  }

  function mountPath(host) {
    var ID = 'number-path', RUN = PATHS.length;
    var GAME = null, fx = null, unwatch = null;
    var grid = null, wrapEl = null, cellEls = [], svg = null, line = null;
    var W = 4, H = 4, NT = 16;
    var dragging = false, hintBtn = null;

    function load(g) {
      var d = g.data, lv = PATHS[U.clamp(d.level, 1, RUN) - 1];
      W = lv[0]; H = lv[1]; NT = W * H;
      d.w = W; d.h = H; d.n = NT;
      d.sol = dec36(lv[2]);
      d.clue = new Array(NT).fill(0);
      var show = dec36(lv[3]);
      for (var i = 0; i < show.length; i++) d.clue[d.sol[show[i]]] = show[i] + 1;
      d.path = [];
      d.idx = new Array(NT).fill(-1);
      d.start = d.sol[0];
      d.time = 0; d.done = false; d.hints = 3;
      build(g);
      stats(g);
    }

    function build(g) {
      var d = g.data, i;
      var root = g.root;
      root.innerHTML = '';
      styleInto(root);
      var wrap = el('div', 'lp-wrap');

      var head = el('div', 'lp-head');
      head.appendChild(el('b', null, 'Route ' + d.level));
      head.appendChild(el('span', null, W + ' × ' + H + ' · walk 1 to ' + NT + ' · ' + d.level + ' of ' + RUN));
      wrap.appendChild(head);

      grid = el('div', 'lp-grid');
      grid.style.gridTemplateColumns = 'repeat(' + W + ', var(--c))';
      grid.style.gridTemplateRows = 'repeat(' + H + ', var(--c))';
      cellEls = [];
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'lp-pc');
      svg.style.zIndex = '1';
      line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      line.setAttribute('fill', 'none');
      line.setAttribute('stroke', '#22d3ee');
      line.setAttribute('stroke-linecap', 'round');
      line.setAttribute('stroke-linejoin', 'round');
      line.setAttribute('opacity', '.85');
      svg.appendChild(line);
      grid.appendChild(svg);
      for (i = 0; i < NT; i++) {
        var c = el('div', 'lp-pcell' + (d.clue[i] ? ' given' : ''));
        c.setAttribute('data-i', i);
        cellEls.push(c);
        grid.appendChild(c);
      }
      wrap.appendChild(grid);

      var bar = el('div', 'lp-bar');
      var undo = el('button', 'lp-btn', '↶ Undo');
      undo.type = 'button';
      undo.addEventListener('click', function () { stepBack(g); });
      bar.appendChild(undo);
      hintBtn = el('button', 'lp-btn');
      hintBtn.type = 'button';
      hintBtn.addEventListener('click', function () { useHint(g); });
      bar.appendChild(hintBtn);
      var clr = el('button', 'lp-btn', 'Clear route');
      clr.type = 'button';
      clr.addEventListener('click', function () { wipe(g); });
      bar.appendChild(clr);
      wrap.appendChild(bar);

      wrap.appendChild(el('div', 'lp-note',
        'Start on the 1 and drag a single unbroken route through every square, ending on ' + NT +
        '. The route only moves up, down, left or right, and each numbered square has to be ' +
        'reached on exactly that step.'));

      root.appendChild(wrap);
      wrapEl = wrap;
      grid.addEventListener('pointerdown', onDown);
      refreshHint(g);
      relayout();
      redraw(g);
    }

    function relayout() {
      if (!grid || !wrapEl) return;
      fitBoard(host, wrapEl, grid, W, 22, 66, function (c) {
        grid.style.gap = Math.max(2, Math.round(c * .07)) + 'px';
        for (var i = 0; i < cellEls.length; i++) cellEls[i].style.fontSize = Math.round(c * .38) + 'px';
        if (line) line.setAttribute('stroke-width', Math.max(4, Math.round(c * .28)));
      });
      if (GAME) drawLine(GAME);
    }

    /* -------------------------------------------------------- interaction */

    function adjacent(a, b) {
      var ax = a % W, ay = (a / W) | 0, bx = b % W, by = (b / W) | 0;
      return Math.abs(ax - bx) + Math.abs(ay - by) === 1;
    }

    function tryCell(g, i) {
      var d = g.data;
      if (d.done || g.state !== 'play') return;
      if (d.idx[i] >= 0) {                       // stepping back onto the route trims it
        if (d.idx[i] === d.path.length - 1) return;
        trim(g, d.idx[i] + 1);
        Milo.sound.click();
        redraw(g);
        return;
      }
      if (!d.path.length) {
        if (i !== d.start) {
          Milo.sound.tone({ f: 190, d: .09, v: .07, type: 'triangle' });
          return;
        }
      } else if (!adjacent(d.path[d.path.length - 1], i)) return;
      if (d.clue[i] && d.clue[i] !== d.path.length + 1) {
        Milo.sound.tone({ f: 190, f2: 130, d: .12, v: .08, type: 'sawtooth' });
        var node = cellEls[i];
        node.classList.remove('bad');
        void node.offsetWidth;
        node.classList.add('bad');
        return;
      }
      d.idx[i] = d.path.length;
      d.path.push(i);
      Milo.sound.tone({ f: 330 + d.path.length * 9, d: .04, v: .055, type: 'square' });
      redraw(g);
      if (d.path.length === NT) checkWin(g);
    }

    function trim(g, len) {
      var d = g.data;
      while (d.path.length > len) d.idx[d.path.pop()] = -1;
    }

    function stepBack(g) {
      var d = g.data;
      if (g.state !== 'play' || d.done || !d.path.length) return;
      trim(g, d.path.length - 1);
      Milo.sound.click();
      redraw(g);
    }

    function wipe(g) {
      if (g.state !== 'play' || g.data.done) return;
      trim(g, 0);
      Milo.sound.click();
      redraw(g);
    }

    function cellAt(cx, cy) {
      var t = document.elementFromPoint(cx, cy);
      if (!t || !t.classList || !t.classList.contains('lp-pcell')) return -1;
      return +t.getAttribute('data-i');
    }

    function onDown(e) {
      var g = GAME;
      if (!g || g.state !== 'play' || g.data.done) return;
      var i = cellAt(e.clientX, e.clientY);
      if (i < 0) return;
      e.preventDefault();
      dragging = true;
      tryCell(g, i);
    }

    function onMove(e) {
      var g = GAME;
      if (!dragging || !g || g.state !== 'play' || g.data.done) return;
      var i = cellAt(e.clientX, e.clientY);
      if (i >= 0) tryCell(g, i);
    }

    function onUp() { dragging = false; }

    function useHint(g) {
      var d = g.data;
      if (g.state !== 'play' || d.done || !d.hints) return;
      var k = 0;
      while (k < d.path.length && d.path[k] === d.sol[k]) k++;
      if (k < d.path.length) trim(g, k);          // the route went astray — rewind to there
      else if (d.path.length < NT) {
        var i = d.sol[d.path.length];
        d.idx[i] = d.path.length;
        d.path.push(i);
      }
      d.hints--;
      g.score = Math.max(0, g.score - 120);
      var last = d.path.length ? cellEls[d.path[d.path.length - 1]] : cellEls[d.start];
      var p = centreIn(last, host);
      fx.ring(p[0], p[1], '#fde68a', 34);
      fx.text(p[0], p[1], '-120', '#fde68a', 15);
      Milo.sound.powerup();
      refreshHint(g);
      stats(g);
      redraw(g);
      if (d.path.length === NT) checkWin(g);
    }

    function refreshHint(g) {
      if (!hintBtn) return;
      hintBtn.textContent = '💡 Hint (' + g.data.hints + ')';
      hintBtn.disabled = !g.data.hints;
    }

    /* ------------------------------------------------------------- drawing */

    function drawLine(g) {
      if (!svg || !line || !grid) return;
      var d = g.data, pts = [], i;
      svg.setAttribute('width', grid.clientWidth);
      svg.setAttribute('height', grid.clientHeight);
      for (i = 0; i < d.path.length; i++) {
        var n = cellEls[d.path[i]];
        pts.push((n.offsetLeft + n.offsetWidth / 2) + ',' + (n.offsetTop + n.offsetHeight / 2));
      }
      line.setAttribute('points', pts.join(' '));
    }

    function redraw(g) {
      var d = g.data, i;
      for (i = 0; i < cellEls.length; i++) {
        var node = cellEls[i], step = d.idx[i] >= 0 ? d.idx[i] + 1 : 0;
        node.textContent = d.clue[i] ? String(d.clue[i]) : (step ? String(step) : '');
        node.classList.toggle('given', !!d.clue[i]);
        node.classList.toggle('pathed', !!step);
        node.classList.toggle('head', d.path.length > 0 && i === d.path[d.path.length - 1]);
        node.style.background = step ? 'transparent' : '';
      }
      drawLine(g);
      g.set('Filled', d.path.length + '/' + NT);
    }

    function stats(g) {
      g.set('Filled', g.data.path.length + '/' + NT);
      g.set('Score', U.fmt(g.score));
    }

    /* ----------------------------------------------------------- end state */

    function checkWin(g) {
      var d = g.data, i;
      if (d.path.length !== NT) return;
      for (i = 0; i < NT; i++) if (d.clue[i] && d.clue[i] !== d.idx[i] + 1) return;
      d.done = true;
      dragging = false;
      grid.classList.add('won');
      var bonus = Math.max(0, Math.round((NT * 4 - d.time) * 5));
      var earned = 180 + NT * 6 + bonus;
      g.score += earned;
      stats(g);
      Milo.sound.win();
      Milo.store.set(ID + ':lvl', d.level >= RUN ? 1 : d.level + 1);
      var box = centreIn(grid, host);
      fx.ring(box[0], box[1], '#22d3ee', 170);
      fx.text(box[0], box[1] - 18, '+' + U.fmt(earned), '#fde68a', 26);
      for (i = 0; i < NT; i += Math.max(1, Math.round(NT / 10))) {
        (function (k) {
          setTimeout(function () {
            if (!fx || !cellEls[d.sol[k]]) return;
            var p = centreIn(cellEls[d.sol[k]], host);
            fx.burst(p[0], p[1], 5, ['#22d3ee', '#7c5cff', '#fde68a']);
          }, k * 16);
        })(i);
      }
      var last = d.level >= RUN, took = U.time(d.time);
      setTimeout(function () {
        if (!GAME || GAME.state === 'over') return;
        if (last) {
          g.win({
            emo: '🧭', title: 'Every route walked!',
            text: 'All ' + RUN + ' grids joined up, finishing on an ' + W + '×' + H +
              ' in ' + took + '.',
            score: g.score
          });
          return;
        }
        var nx = PATHS[d.level];
        g.overlay({
          emo: '🧭', title: 'Route complete!',
          text: took + ' — worth ' + U.fmt(earned) + '.' + (bonus ? ' Speed bonus ' + bonus + '.' : '') +
            ' Next grid is ' + nx[0] + '×' + nx[1] + '.',
          score: g.score, best: g.best, newBest: Milo.store.setBest(ID, g.score),
          actions: [
            { label: 'Next route →', primary: true, onClick: function () { next(g); } },
            { label: 'Start over', onClick: function () { Milo.store.set(ID + ':lvl', 1); g.restart(); } }
          ]
        });
      }, 800);
    }

    function next(g) {
      g.clearOverlay();
      g.data.level++;
      load(g);
      g.state = 'play';
      g.best = Milo.store.best(ID);
    }

    function reset(g) {
      GAME = g;
      if (!fx) fx = makeFx(host);
      fx.clear();
      if (!unwatch) unwatch = watchSize(host, relayout);
      g.data.level = U.clamp(Milo.store.get(ID + ':lvl', 1) | 0 || 1, 1, RUN);
      load(g);
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    var saved = U.clamp(Milo.store.get(ID + ':lvl', 1) | 0 || 1, 1, RUN);
    return Milo.domGame(host, {
      id: ID,
      stats: ['Filled', 'Time', 'Score'],
      bg: '#0a1f2e',
      emo: '🧭',
      start: {
        title: 'Number Path',
        text: 'Draw one unbroken route that steps through every square exactly once, from 1 up to ' +
          'the last number. The numbers already on the board are checkpoints: your route has to ' +
          'arrive at each of them on precisely that step.' +
          (saved > 1 ? ' Resuming at route ' + saved + '.' : ''),
        keys: ['Drag from the 1', 'Tap back to rewind']
      },
      init: reset,
      onKey: function (g, e) {
        if (e.code === 'KeyH') useHint(g);
        else if (e.code === 'KeyZ' || e.code === 'Backspace') stepBack(g);
      },
      update: function (g, dt) {
        if (g.data.done) return;
        g.data.time += dt;
        g.set('Time', U.time(g.data.time));
      },
      destroy: function () {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        if (unwatch) { unwatch(); unwatch = null; }
        if (fx) { fx.destroy(); fx = null; }
        grid = null; GAME = null; cellEls = []; svg = null; line = null;
      }
    });
  }

  /* ============================================================ catalogue */

  var NONO_GAMES = [
    {
      id: 'nono-5', size: 5, run: 8, lives: 5, hints: 2, base: 220, par: 55, tick: 4,
      ink: '#38bdf8', bg: '#0a1020', emo: '🟦', title: 'Nonogram 5×5',
      blurb: 'Eight little pictures, five squares across. The numbers down the side and across ' +
        'the top are the lengths of the filled runs in that line, in order, with at least one ' +
        'gap between them. Fill a square the clues rule out and it costs a life.'
    },
    {
      id: 'nono-8', size: 8, run: 6, lives: 5, hints: 3, base: 420, par: 150, tick: 3,
      ink: '#34d399', bg: '#08161f', emo: '🧩', title: 'Nonogram 8×8',
      blurb: 'Six pictures on an 8×8 board — boats, keys, invaders, a mug. Cross out the squares ' +
        'you have ruled out as you go; the clue numbers fade once a line is finished, which is ' +
        'the fastest way to see what is left.'
    },
    {
      id: 'nono-10', size: 10, run: 5, lives: 5, hints: 3, base: 640, par: 260, tick: 2.5,
      ink: '#c084fc', bg: '#150e26', emo: '🖼️', title: 'Nonogram 10×10',
      blurb: 'Five 10×10 pictures with heavy rules every five squares so you can count without ' +
        'losing your place. Start from the biggest clue in a line: a run of 7 on a board of 10 ' +
        'only fits four ways, and the overlap is always filled.'
    },
    {
      id: 'nono-12', size: 12, run: 4, lives: 6, hints: 4, base: 900, par: 400, tick: 2.2,
      ink: '#fb7185', bg: '#1c0d1a', emo: '🎞️', title: 'Nonogram 12×12',
      blurb: 'Four 12×12 pictures, six lives and four hints. The larger board means more lines ' +
        'that resolve only after a neighbour does, so sweep whole rows with a drag once you are ' +
        'sure and leave the ambiguous middles for last.'
    },
    {
      id: 'nono-15', size: 15, run: 3, lives: 6, hints: 5, base: 1400, par: 640, tick: 2.2,
      ink: '#fbbf24', bg: '#101a17', emo: '🏆', title: 'Nonogram Marathon',
      blurb: 'Three full 15×15 pictures in one sitting — whales, penguins, a rocket on the pad. ' +
        'Six lives have to last all three, so cross out everything you have eliminated instead ' +
        'of guessing, and lean on the five hints only when a board truly stalls.'
    },
    {
      id: 'nono-color', size: 10, colour: true, run: 4, lives: 5, hints: 3, base: 760, par: 320, tick: 2.4,
      bg: '#190f2b', emo: '🎨', title: 'Colour Nonogram',
      blurb: 'Same rules, two inks. Each line carries a separate clue list per colour, written in ' +
        'that colour, and each colour is read as if the other were empty. Pick an ink from the ' +
        'swatches below the board (or press 1 and 2) and paint.'
    }
  ];

  var SKY_GAMES = [
    {
      id: 'sky-4', size: 4, base: 200, par: 100, bg: '#05202f', title: 'Skyscrapers 4×4',
      blurb: 'Every row and column gets one tower of each height 1 to 4. The number on an edge is ' +
        'how many towers are visible looking in from there — a taller tower hides everything ' +
        'shorter behind it. A 4 means the heights climb 1-2-3-4; a 1 means the tallest is nearest.'
    },
    {
      id: 'sky-5', size: 5, base: 320, par: 200, bg: '#0a1533', title: 'Skyscrapers 5×5',
      blurb: 'Heights 1 to 5, one of each per row and column, and edge clues counting the visible ' +
        'skyline. Bigger board, far fewer clues by the last city — start with the 1s and 5s, then ' +
        'work the pairs of clues that face each other across a line.'
    }
  ];

  function reg(def) { Milo.register(def); }

  NONO_GAMES.forEach(function (opt) {
    reg({
      id: opt.id,
      title: opt.title,
      emo: opt.emo,
      category: 'Puzzle',
      tagline: opt.colour
        ? 'Two inks, two clue lists, one picture'
        : opt.size + '×' + opt.size + ' picross from hand-drawn pixel art',
      description: opt.blurb + ' ' + (opt.colour
        ? 'Sixteen hand-drawn two-colour pictures — a strawberry, a lighthouse, a slice of watermelon — and four of them make a run.'
        : 'Pictures are drawn by hand, not generated, and every one has been checked to be solvable by pure row-and-column logic with no guessing.') +
        ' A flawless picture hands a life back and pays a bonus, so accuracy beats speed.',
      controls: ['Click / drag fill', 'Right-click mark', 'Long-press mark', 'H hint'],
      colors: opt.colour ? ['#190f2b', '#f472b6'] :
        opt.size === 5 ? ['#0a1020', '#38bdf8'] :
          opt.size === 8 ? ['#08161f', '#34d399'] :
            opt.size === 10 ? ['#150e26', '#c084fc'] :
              opt.size === 12 ? ['#1c0d1a', '#fb7185'] : ['#101a17', '#fbbf24'],
      tags: opt.colour
        ? ['nonogram', 'picross', 'colour', 'logic', 'levels']
        : ['nonogram', 'picross', 'logic', 'pixel art', 'levels'],
      aliases: ['picross', 'griddler', 'paint by numbers'],
      mount: function (host) { return mountNono(host, opt); }
    });
  });

  SKY_GAMES.forEach(function (opt) {
    reg({
      id: opt.id,
      title: opt.title,
      emo: opt.size === 4 ? '🏙️' : '🌆',
      category: 'Puzzle',
      tagline: 'Build the skyline the edge numbers describe',
      description: opt.blurb + ' Eight cities per run, each generated fresh and brute-force ' +
        'checked to have exactly one solution, with the clue count falling from ' +
        SKY_KEEP[opt.size][0] + ' down to ' + SKY_KEEP[opt.size][7] + ' as you go. Clues turn ' +
        'green the moment their line is finished and matches, red when it does not. Tip: two ' +
        'facing clues that add up to ' + (opt.size + 1) + ' pin the tallest tower exactly.',
      controls: ['Tap a square', 'Tap a height', '1–' + opt.size, 'Arrows', 'H hint'],
      colors: opt.size === 4 ? ['#05202f', '#22d3ee'] : ['#0a1533', '#818cf8'],
      tags: ['skyscrapers', 'logic', 'latin square', 'towers', 'levels'],
      aliases: ['towers', 'skyline puzzle'],
      mount: function (host) { return mountSky(host, opt); }
    });
  });

  reg({
    id: 'magic-15',
    title: 'Magic 15',
    emo: '🔢',
    category: 'Puzzle',
    tagline: 'Every row, column and diagonal has to add up',
    description: 'Place 1 to 9 in a 3×3 grid so every row, column and both diagonals total 15 — ' +
      'then the board grows to 4×4, the target becomes 34, and you are placing 1 to 16. Twelve ' +
      'levels hand you fewer fixed numbers each time, from five givens down to two on the small ' +
      'boards and eleven down to seven on the large ones. Running sums sit beside every line and ' +
      'turn green when they land, so you can see a wrong total the moment you make it. Tip: on ' +
      'the 3×3 the centre is always 5 and the corners are always even.',
    controls: ['Tap a square', 'Tap a number', 'Type digits', 'H hint'],
    colors: ['#131033', '#a78bfa'],
    tags: ['magic square', 'numbers', 'arithmetic', 'logic', 'levels'],
    aliases: ['magic square', 'lo shu'],
    mount: mountMagic
  });

  reg({
    id: 'number-path',
    title: 'Number Path',
    emo: '🧭',
    category: 'Puzzle',
    tagline: 'One unbroken walk through every square, 1 to the end',
    description: 'Drag a single route from 1 through every square of the grid, up, down, left and ' +
      'right only, finishing on the last number. The numbers already printed are checkpoints — ' +
      'your route has to hit each one on exactly that step. Eighteen hand-built grids run from a ' +
      '4×4 with seven checkpoints up to an 8×8 with fourteen, and every one was verified to have ' +
      'a single solution, so there is always a way in without guessing. Tap any square already ' +
      'on the route to rewind to it; your place is saved between visits.',
    controls: ['Drag from the 1', 'Tap to rewind', 'Z undo', 'H hint'],
    colors: ['#0a1f2e', '#2dd4bf'],
    tags: ['path', 'hamiltonian', 'logic', 'numbers', 'levels'],
    aliases: ['numbrix', 'hidato', 'snake path'],
    mount: mountPath
  });
})();
