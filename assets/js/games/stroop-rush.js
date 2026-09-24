/* Stroop Rush — the word says one colour, the ink says another. */
(function () {
  'use strict';

  var RUN = 60;
  var COLOURS = [
    { name: 'RED', hex: '#ef4444', f: 392 },
    { name: 'BLUE', hex: '#3b82f6', f: 440 },
    { name: 'GREEN', hex: '#22c55e', f: 494 },
    { name: 'YELLOW', hex: '#eab308', f: 523 },
    { name: 'PURPLE', hex: '#a855f7', f: 587 },
    { name: 'ORANGE', hex: '#f97316', f: 659 }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var S = Milo.sound;
    var els = null;

    /* ---------------------------------------------------------------- DOM */

    function build(g) {
      var root = g.root;
      root.innerHTML = '';
      var style = document.createElement('style');
      style.textContent = [
        '.sr-wrap{position:relative;display:flex;flex-direction:column;align-items:center;gap:9px;',
        'font-family:Outfit,sans-serif;width:100%;max-width:520px;height:100%;margin:auto;',
        'justify-content:center;user-select:none;-webkit-user-select:none}',
        '.sr-rule{flex:0 0 auto;font:800 .78rem/1 Outfit,sans-serif;letter-spacing:.24em;',
        'text-transform:uppercase;padding:9px 18px;border-radius:999px;background:#10203a;color:#7dd3fc;',
        'border:1px solid #1e4a72;transition:background .2s,color .2s,border-color .2s}',
        '.sr-rule.word{background:#3a1030;color:#f9a8d4;border-color:#7e2a5c}',
        '.sr-card{position:relative;flex:1 1 auto;width:100%;min-height:96px;max-height:190px;',
        'display:flex;align-items:center;justify-content:center;overflow:hidden;',
        'background:linear-gradient(160deg,#141a30,#0a0e1c);border:1px solid #23304e;border-radius:20px;',
        'box-shadow:0 16px 44px rgba(0,0,0,.5)}',
        '.sr-word{font:900 clamp(34px,7.2vw,72px)/1 Outfit,sans-serif;letter-spacing:.04em;',
        'animation:srPop .22s ease-out}',
        '@keyframes srPop{from{transform:scale(.82);opacity:.2}to{transform:scale(1);opacity:1}}',
        '.sr-card.bad{animation:srShake .34s}',
        '@keyframes srShake{20%{transform:translateX(-9px)}55%{transform:translateX(9px)}80%{transform:translateX(-4px)}}',
        '.sr-msg{position:absolute;left:0;right:0;bottom:9px;min-height:18px;',
        'font:800 .82rem Outfit,sans-serif;letter-spacing:.06em;text-align:center}',
        '.sr-bar{flex:0 0 auto;width:100%;height:8px;border-radius:5px;background:#16203a;overflow:hidden}',
        '.sr-bar i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#22d3ee,#a855f7)}',
        '.sr-grid{flex:0 0 auto;display:grid;grid-template-columns:repeat(2,1fr);gap:8px;width:100%}',
        '.sr-btn{position:relative;border:0;border-radius:13px;height:clamp(44px,8vh,58px);cursor:pointer;',
        'color:#fff;font:800 .88rem/1 Outfit,sans-serif;letter-spacing:.1em;',
        'text-shadow:0 1px 3px rgba(0,0,0,.55);box-shadow:inset 0 -4px 0 rgba(0,0,0,.28);',
        'transition:transform .08s}',
        '.sr-btn:active{transform:translateY(3px) scale(.98)}',
        '.sr-btn b{position:absolute;top:4px;left:7px;font:700 .6rem Outfit,sans-serif;opacity:.7}',
        '.sr-float{position:absolute;right:16px;top:34%;pointer-events:none;z-index:3;',
        'font:900 1.25rem Outfit,sans-serif;animation:srFloat .8s ease-out forwards}',
        '@keyframes srFloat{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-58px)}}',
        '.sr-flip{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;',
        'pointer-events:none;font:900 clamp(20px,5vw,38px) Outfit,sans-serif;letter-spacing:.1em;',
        'color:#fff;background:rgba(10,14,28,.86);animation:srFlip 1.15s ease-out forwards}',
        '@keyframes srFlip{0%{opacity:0;transform:scale(1.3)}18%{opacity:1;transform:scale(1)}',
        '78%{opacity:1}100%{opacity:0}}',
        '.sr-foot{flex:0 0 auto;font:700 .7rem Outfit,sans-serif;color:#64748b;letter-spacing:.1em;',
        'text-align:center}'
      ].join('');

      var wrap = document.createElement('div'); wrap.className = 'sr-wrap';
      var rule = document.createElement('div'); rule.className = 'sr-rule';
      var card = document.createElement('div'); card.className = 'sr-card';
      var word = document.createElement('div'); word.className = 'sr-word';
      var msg = document.createElement('div'); msg.className = 'sr-msg';
      card.appendChild(word); card.appendChild(msg);
      var bar = document.createElement('div'); bar.className = 'sr-bar';
      var fill = document.createElement('i'); bar.appendChild(fill);
      var grid = document.createElement('div'); grid.className = 'sr-grid';
      var foot = document.createElement('div'); foot.className = 'sr-foot';
      foot.textContent = 'CLICK A SWATCH  ·  OR PRESS 1 – 6';

      var btns = [];
      for (var i = 0; i < COLOURS.length; i++) {
        (function (idx) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'sr-btn';
          b.style.background = COLOURS[idx].hex;
          b.innerHTML = '<b>' + (idx + 1) + '</b>' + COLOURS[idx].name;
          b.addEventListener('click', function () { answer(g, idx); });
          grid.appendChild(b);
          btns.push(b);
        })(i);
      }

      wrap.appendChild(rule); wrap.appendChild(card); wrap.appendChild(bar);
      wrap.appendChild(grid); wrap.appendChild(foot);
      root.appendChild(style); root.appendChild(wrap);

      els = { wrap: wrap, rule: rule, card: card, word: word, fill: fill, grid: grid, msg: msg, btns: btns };
    }

    /* -------------------------------------------------------------- rounds */

    function reset(g) {
      var d = g.data;
      d.left = RUN;
      d.shown = -1;
      d.rule = 'ink';
      d.asked = 0;
      d.right = 0;
      d.wrong = 0;
      d.streak = 0;
      d.best = 0;
      d.pool = 4;
      d.nextFlip = U.randInt(7, 11);
      d.sinceFlip = 0;
      d.limit = 3.2;
      d.qt = 3.2;
      d.locked = false;
      d.flips = 0;
      d.bonusLeft = 10;      // a run can only buy back ten seconds
      build(g);
      paintRule(g);
      paintPool(g);
      nextQ(g);
      g.score = 0;
      g.set('Score', 0);
      g.set('Time', RUN);
      g.set('Streak', 0);
      g.set('Best run', 0);
    }

    function paintRule(g) {
      var d = g.data;
      els.rule.className = 'sr-rule' + (d.rule === 'word' ? ' word' : '');
      els.rule.textContent = d.rule === 'ink' ? 'Tap the INK colour' : 'Tap the WORD';
    }

    function paintPool(g) {
      var d = g.data;
      els.grid.style.gridTemplateColumns = d.pool === 4 ? 'repeat(2,1fr)' : 'repeat(3,1fr)';
      for (var i = 0; i < els.btns.length; i++) {
        els.btns[i].style.display = i < d.pool ? '' : 'none';
      }
    }

    function nextQ(g) {
      var d = g.data;
      var wi = U.randInt(0, d.pool - 1);
      var ii = wi;
      if (Math.random() < .84) {
        while (ii === wi) ii = U.randInt(0, d.pool - 1);
      }
      d.q = { word: wi, ink: ii };
      d.limit = Math.max(1.35, 3.2 - d.asked * .055);
      d.qt = d.limit;
      d.locked = false;
      els.word.textContent = COLOURS[wi].name;
      els.word.style.color = COLOURS[ii].hex;
      // restart the pop animation
      els.word.style.animation = 'none';
      void els.word.offsetWidth;
      els.word.style.animation = '';
    }

    function floatText(txt, col) {
      var f = document.createElement('div');
      f.className = 'sr-float';
      f.style.color = col;
      f.textContent = txt;
      els.wrap.appendChild(f);
      setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 850);
    }

    function flipBanner(g) {
      var d = g.data;
      d.rule = d.rule === 'ink' ? 'word' : 'ink';
      d.flips++;
      paintRule(g);
      var f = document.createElement('div');
      f.className = 'sr-flip';
      f.textContent = d.rule === 'ink' ? 'NOW TAP THE INK' : 'NOW TAP THE WORD';
      els.card.appendChild(f);
      setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 1200);
      S.tone({ f: 300, f2: 900, d: .22, v: .1, type: 'square' });
      setTimeout(function () { S.tone({ f: 900, f2: 300, d: .22, v: .09, type: 'square' }); }, 200);
      d.sinceFlip = 0;
      d.nextFlip = Math.max(5, U.randInt(7, 11) - Math.floor(d.asked / 14));
    }

    function correctIndex(d) { return d.rule === 'ink' ? d.q.ink : d.q.word; }

    function answer(g, idx) {
      var d = g.data;
      if (g.state !== 'play' || d.locked) return;
      if (idx >= d.pool) return;
      d.asked++;
      d.sinceFlip++;

      if (idx === correctIndex(d)) {
        d.right++;
        d.streak++;
        if (d.streak > d.best) { d.best = d.streak; g.set('Best run', d.best); }
        var speed = Math.round((d.qt / d.limit) * 90);
        var pts = 100 + speed + Math.min(150, (d.streak - 1) * 12);
        g.score += pts;
        g.set('Score', U.fmt(g.score));
        g.set('Streak', d.streak);
        els.msg.style.color = '#4ade80';
        els.msg.textContent = d.streak >= 5 ? '🔥 ' + d.streak + ' IN A ROW' : 'RIGHT';
        floatText('+' + pts, '#4ade80');
        S.tone({ f: COLOURS[idx].f * (d.streak > 6 ? 2 : 1), d: .09, v: .07, type: 'sine' });
        if (d.streak > 0 && d.streak % 10 === 0 && d.bonusLeft > 0) {
          var add = Math.min(2, d.bonusLeft);
          d.bonusLeft -= add;
          d.left = Math.min(RUN, d.left + add);
          S.powerup();
          floatText('+' + add + 's', '#fde047');
        }
        // more colours as you settle in
        var want = d.right >= 26 ? 6 : d.right >= 12 ? 5 : 4;
        if (want !== d.pool) { d.pool = want; paintPool(g); floatText(d.pool + ' COLOURS', '#7dd3fc'); }
      } else {
        d.wrong++;
        d.streak = 0;
        g.set('Streak', 0);
        d.left = Math.max(0, d.left - 2);
        els.msg.style.color = '#f87171';
        els.msg.textContent = d.rule === 'ink' ? 'THE INK, NOT THE WORD' : 'THE WORD, NOT THE INK';
        floatText('−2s', '#f87171');
        S.hit();
        els.card.classList.remove('bad');
        void els.card.offsetWidth;
        els.card.classList.add('bad');
      }

      if (d.sinceFlip >= d.nextFlip) flipBanner(g);
      nextQ(g);
    }

    function timeUp(g) {
      var d = g.data;
      d.locked = true;
      d.streak = 0;
      d.wrong++;
      g.set('Streak', 0);
      els.msg.style.color = '#fbbf24';
      els.msg.textContent = 'TOO SLOW';
      d.left = Math.max(0, d.left - 1);
      S.tone({ f: 200, f2: 90, d: .2, v: .08, type: 'sawtooth' });
      d.asked++;
      d.sinceFlip++;
      if (d.sinceFlip >= d.nextFlip) flipBanner(g);
      nextQ(g);
    }

    return Milo.domGame(host, {
      id: 'stroop-rush',
      bg: '#080b16',
      stats: ['Score', 'Time', 'Streak', 'Best run'],
      emo: '🎨',
      start: {
        title: 'Stroop Rush',
        text: 'The word RED written in blue ink: tap BLUE. Sixty seconds, and every so often ' +
          'the rule flips and you have to tap the word instead of the ink. Wrong answers cost ' +
          'two seconds; every tenth right in a row hands two back.',
        keys: ['Click a swatch', '1 – 6']
      },
      init: reset,

      onKey: function (g, e) {
        var i = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'].indexOf(e.code);
        if (i < 0) i = ['Numpad1', 'Numpad2', 'Numpad3', 'Numpad4', 'Numpad5', 'Numpad6'].indexOf(e.code);
        if (i >= 0) answer(g, i);
      },

      update: function (g, dt) {
        var d = g.data;
        d.left -= dt;
        var secs = Math.max(0, Math.ceil(d.left));
        if (secs !== d.shown) { d.shown = secs; g.set('Time', secs); }

        if (!d.locked) {
          d.qt -= dt;
          els.fill.style.width = Math.max(0, (d.qt / d.limit) * 100) + '%';
          els.fill.style.background = d.qt / d.limit < .3
            ? 'linear-gradient(90deg,#f87171,#fbbf24)'
            : 'linear-gradient(90deg,#22d3ee,#a855f7)';
          if (d.qt <= 0) timeUp(g);
        }

        if (d.left <= 0) {
          var pct = d.asked ? Math.round((d.right / d.asked) * 100) : 0;
          g.gameOver({
            emo: '🎨', title: 'Time!',
            text: d.right + ' right of ' + d.asked + ' (' + pct + '%) · best run ' + d.best +
              ' · the rule flipped ' + d.flips + ' time' + (d.flips === 1 ? '' : 's') + '.'
          });
        }
      }
    });
  }

  window.Milo.register({
    id: 'stroop-rush', title: 'Stroop Rush', emo: '🎨', category: 'Casual',
    tagline: 'Tap the ink, ignore the word',
    description: 'The classic interference test as a sixty-second sprint: the word RED printed ' +
      'in blue ink means you tap blue, and your reading brain will fight you the whole way. ' +
      'Every eight or so answers the rule inverts with a bang and suddenly you have to tap ' +
      'the word instead of the ink. Answers score for speed and for streak, a wrong tap or a ' +
      'timed-out question costs seconds off the clock, and every tenth correct in a row hands ' +
      'two back (up to ten seconds a run). The palette grows from four colours to six as you get comfortable and the ' +
      'per-question timer tightens from 3.2 seconds to 1.35. Tip: squint so the letters blur ' +
      '— it genuinely helps on the ink rounds.',
    controls: ['Click', 'Tap', '1 – 6'],
    colors: ['#3b82f6', '#ef4444'],
    tags: ['reflex', 'brain', 'colours', 'stroop', 'speed'],
    mount: mount
  });
})();
