/* Tic Tac Toe — three difficulties, the hardest one is unbeatable. */
(function () {
  'use strict';
  var LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var cells = [], levelRow;

    function reset(g) {
      var d = g.data;
      d.b = new Array(9).fill('');
      d.over = false;
      d.line = null;
      d.level = d.level || 'hard';
      d.w = d.w || 0; d.l = d.l || 0; d.dr = d.dr || 0;
      build(g);
      paint(g);
      updateScore(g);
    }

    function updateScore(g) {
      var d = g.data;
      g.set('Won', d.w);
      g.set('Lost', d.l);
      g.set('Drawn', d.dr);
    }

    function build(g) {
      var d = g.data;
      var wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:14px';

      levelRow = document.createElement('div');
      levelRow.style.cssText = 'display:flex;gap:8px';
      ['easy', 'medium', 'hard'].forEach(function (lv) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = lv[0].toUpperCase() + lv.slice(1);
        b.dataset.lv = lv;
        b.style.cssText = 'padding:6px 14px;border-radius:99px;cursor:pointer;font:650 .84rem Outfit,sans-serif;' +
          'border:1px solid ' + (d.level === lv ? 'transparent' : 'rgba(255,255,255,.16)') + ';' +
          'background:' + (d.level === lv ? 'linear-gradient(120deg,#7c5cff,#22d3ee)' : 'rgba(255,255,255,.06)') + ';' +
          'color:#fff';
        levelRow.appendChild(b);
      });
      levelRow.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (!b) return;
        g.data.level = b.dataset.lv;
        g.restart();
      });

      var board = document.createElement('div');
      board.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:8px;' +
        'width:min(80vw,min(52vh,360px));aspect-ratio:1';
      cells = [];
      for (var i = 0; i < 9; i++) {
        var c = document.createElement('button');
        c.type = 'button';
        c.dataset.i = i;
        c.style.cssText = 'border:0;border-radius:14px;cursor:pointer;background:#1a1f47;' +
          'font:800 clamp(30px,10vw,64px)/1 Outfit,sans-serif;display:grid;place-items:center;' +
          'transition:background .14s,box-shadow .14s;padding:0';
        board.appendChild(c);
        cells.push(c);
      }
      board.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (b) move(g, +b.dataset.i);
      });

      wrap.appendChild(levelRow);
      wrap.appendChild(board);
      g.root.innerHTML = '';
      g.root.appendChild(wrap);
    }

    function paint(g) {
      var d = g.data;
      d.b.forEach(function (v, i) {
        var c = cells[i];
        c.textContent = v;
        c.style.color = v === 'X' ? '#22d3ee' : '#fb7185';
        var win = d.line && d.line.indexOf(i) !== -1;
        c.style.background = win ? 'rgba(255,210,87,.22)' : '#1a1f47';
        c.style.boxShadow = win ? '0 0 0 2px #ffd257' : 'none';
        c.style.cursor = v || d.over ? 'default' : 'pointer';
      });
    }

    function winner(b) {
      for (var i = 0; i < LINES.length; i++) {
        var L = LINES[i];
        if (b[L[0]] && b[L[0]] === b[L[1]] && b[L[1]] === b[L[2]]) return { who: b[L[0]], line: L };
      }
      return b.indexOf('') === -1 ? { who: 'draw' } : null;
    }

    /** Perfect play for O, with depth so it prefers the quickest win. */
    function best(b, me) {
      var res = winner(b);
      if (res) {
        if (res.who === 'draw') return { score: 0 };
        return { score: res.who === 'O' ? 10 - countFilled(b) : countFilled(b) - 10 };
      }
      var moves = [];
      for (var i = 0; i < 9; i++) {
        if (b[i]) continue;
        b[i] = me;
        var s = best(b, me === 'O' ? 'X' : 'O').score;
        b[i] = '';
        moves.push({ i: i, score: s });
      }
      moves.sort(function (a, z) { return me === 'O' ? z.score - a.score : a.score - z.score; });
      return moves[0];
    }

    function countFilled(b) {
      return b.filter(function (v) { return v; }).length;
    }

    function cpu(g) {
      var d = g.data;
      var empty = [];
      d.b.forEach(function (v, i) { if (!v) empty.push(i); });
      if (!empty.length) return;

      var pick;
      if (d.level === 'easy') pick = U.choice(empty);
      else if (d.level === 'medium') pick = Math.random() < 0.45 ? U.choice(empty) : best(d.b.slice(), 'O').i;
      else pick = best(d.b.slice(), 'O').i;

      place(g, pick, 'O');
    }

    function place(g, i, who) {
      var d = g.data;
      d.b[i] = who;
      Milo.sound.tone({ f: who === 'X' ? 480 : 320, d: .07, v: .07, type: 'square' });
      var res = winner(d.b);
      if (res) {
        d.over = true;
        d.line = res.line || null;
        paint(g);
        if (res.who === 'X') { d.w++; g.win({ emo: '❌', title: 'You win!', text: 'Nice line.', score: d.w * 100 }); }
        else if (res.who === 'O') { d.l++; g.gameOver({ emo: '⭕', title: 'CPU wins', text: d.level === 'hard' ? 'Hard mode plays perfectly — a draw is the best you can force.' : 'Try again.', score: d.w * 100 }); }
        else { d.dr++; g.gameOver({ emo: '🤝', title: 'Draw', text: d.level === 'hard' ? 'A draw against perfect play is a win in itself.' : 'Nobody got three.', score: d.w * 100 }); }
        updateScore(g);
        return true;
      }
      paint(g);
      return false;
    }

    function move(g, i) {
      var d = g.data;
      if (g.state !== 'play' || d.over || d.b[i]) return;
      if (place(g, i, 'X')) return;
      setTimeout(function () {
        if (g.state === 'play' && !d.over) cpu(g);
      }, 260);
    }

    return Milo.domGame(host, {
      id: 'tic-tac-toe',
      stats: ['Won', 'Lost', 'Drawn'],
      bg: '#0f1333',
      emo: '❌',
      start: {
        title: 'Tic Tac Toe',
        text: 'You are X and you go first. Easy plays at random, Medium slips up ' +
          'sometimes, and Hard plays perfectly — the best you can get is a draw.',
        keys: ['Click a square']
      },
      preload: function (g) { g.data.level = 'hard'; g.data.w = 0; g.data.l = 0; g.data.dr = 0; },
      init: reset
    });
  }

  window.Milo.register({
    id: 'tic-tac-toe', title: 'Tic Tac Toe', emo: '❌', category: 'Strategy',
    tagline: 'Three difficulties, one unbeatable',
    description: 'You are X and always move first. Easy picks squares at random and ' +
      'Medium blunders about half the time, but Hard searches the whole game tree and ' +
      'plays perfectly — against it, forcing a draw is the real win.',
    controls: ['Click a square'],
    colors: ['#22d3ee', '#fb7185'],
    tags: ['classic', 'vs cpu', 'quick', 'strategy'],
    mount: mount
  });
})();
