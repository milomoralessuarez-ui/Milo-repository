/* Word Sleuth — six guesses at a five-letter word, with colour feedback. */
(function () {
  'use strict';
  var LEN = 5, TRIES = 6;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util, WORDS = Milo.words;
    var boardEl, kbEl, msgEl;

    function reset(g) {
      var d = g.data;
      d.answer = WORDS.randomFive();
      d.rows = [];
      d.cur = '';
      d.done = false;
      d.letters = {};             // letter -> 'hit' | 'near' | 'miss'
      d.streak = Milo.store.get('word-sleuth:streak', 0) || 0;
      build(g);
      paint(g);
      g.set('Guess', '1/' + TRIES);
      g.set('Streak', d.streak);
      g.set('Best', g.best || 0);
    }

    function build(g) {
      var wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px';

      boardEl = document.createElement('div');
      boardEl.style.cssText = 'display:grid;grid-template-rows:repeat(' + TRIES + ',1fr);gap:6px';

      msgEl = document.createElement('div');
      msgEl.style.cssText = 'color:#a8b0d8;font-size:.88rem;min-height:1.3em;font-weight:600';

      kbEl = document.createElement('div');
      kbEl.style.cssText = 'display:flex;flex-direction:column;gap:6px;align-items:center';
      ['qwertyuiop', 'asdfghjkl', '↵zxcvbnm⌫'].forEach(function (row) {
        var r = document.createElement('div');
        r.style.cssText = 'display:flex;gap:5px';
        row.split('').forEach(function (ch) {
          var b = document.createElement('button');
          b.type = 'button';
          b.dataset.k = ch;
          b.textContent = ch === '↵' ? 'ENTER' : ch === '⌫' ? 'DEL' : ch.toUpperCase();
          var wide = ch === '↵' || ch === '⌫';
          b.style.cssText = 'border:0;border-radius:7px;cursor:pointer;color:#fff;' +
            'font:700 ' + (wide ? '11px' : '15px') + '/1 Outfit,sans-serif;' +
            'height:44px;min-width:' + (wide ? '54px' : '32px') + ';padding:0 ' + (wide ? '8px' : '6px') + ';' +
            'background:#3a4275;transition:background .15s';
          r.appendChild(b);
        });
        kbEl.appendChild(r);
      });
      kbEl.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (b) key(g, b.dataset.k);
      });

      wrap.appendChild(boardEl);
      wrap.appendChild(msgEl);
      wrap.appendChild(kbEl);
      g.root.innerHTML = '';
      g.root.appendChild(wrap);
    }

    function paint(g) {
      var d = g.data;
      boardEl.innerHTML = '';
      for (var r = 0; r < TRIES; r++) {
        var row = document.createElement('div');
        row.style.cssText = 'display:grid;grid-template-columns:repeat(' + LEN + ',1fr);gap:6px';
        var guess = d.rows[r];
        var text = guess ? guess.word : (r === d.rows.length ? d.cur : '');
        for (var i = 0; i < LEN; i++) {
          var cell = document.createElement('div');
          var ch = text[i] || '';
          var mark = guess ? guess.marks[i] : null;
          cell.textContent = ch.toUpperCase();
          cell.style.cssText = 'width:clamp(38px,9vw,54px);height:clamp(38px,9vw,54px);' +
            'display:grid;place-items:center;border-radius:8px;' +
            'font:800 clamp(17px,4.4vw,24px)/1 Outfit,sans-serif;color:#fff;' +
            'background:' + (mark === 'hit' ? '#34d399' : mark === 'near' ? '#f59e0b' : mark ? '#39406e' : 'transparent') + ';' +
            'border:2px solid ' + (mark ? 'transparent' : ch ? '#5b64a8' : '#2b3163') + ';';
          row.appendChild(cell);
        }
        boardEl.appendChild(row);
      }
      Array.prototype.forEach.call(kbEl.querySelectorAll('button'), function (b) {
        var st = d.letters[b.dataset.k];
        b.style.background = st === 'hit' ? '#34d399' : st === 'near' ? '#f59e0b'
          : st === 'miss' ? '#232848' : '#3a4275';
      });
    }

    /** Two-pass scoring so duplicate letters are counted correctly. */
    function scoreGuess(guess, answer) {
      var marks = new Array(LEN).fill('miss');
      var pool = {};
      for (var i = 0; i < LEN; i++) {
        if (guess[i] === answer[i]) marks[i] = 'hit';
        else pool[answer[i]] = (pool[answer[i]] || 0) + 1;
      }
      for (var j = 0; j < LEN; j++) {
        if (marks[j] === 'hit') continue;
        if (pool[guess[j]]) { marks[j] = 'near'; pool[guess[j]]--; }
      }
      return marks;
    }

    function say(msg) { msgEl.textContent = msg; }

    function submit(g) {
      var d = g.data;
      if (d.cur.length !== LEN) { say('Needs five letters'); return; }
      if (!WORDS.fiveSet[d.cur]) { say('Not in the word list'); Milo.sound.tone({ f: 150, d: .1, v: .05, type: 'square' }); return; }

      var marks = scoreGuess(d.cur, d.answer);
      d.rows.push({ word: d.cur, marks: marks });
      // Never downgrade a letter already known to be a hit.
      for (var i = 0; i < LEN; i++) {
        var ch = d.cur[i], m = marks[i];
        var prev = d.letters[ch];
        if (prev === 'hit') continue;
        if (prev === 'near' && m === 'miss') continue;
        d.letters[ch] = m;
      }
      var solved = d.cur === d.answer;
      d.cur = '';
      say('');
      paint(g);
      g.set('Guess', Math.min(TRIES, d.rows.length + 1) + '/' + TRIES);

      if (solved) {
        d.done = true;
        d.streak++;
        Milo.store.set('word-sleuth:streak', d.streak);
        g.set('Streak', d.streak);
        var score = (TRIES - d.rows.length + 1) * 100 + d.streak * 50;
        g.win({
          emo: '🔤', title: 'Got it in ' + d.rows.length + '!',
          text: 'The word was ' + d.answer.toUpperCase() + '. Streak: ' + d.streak + '.',
          score: score
        });
      } else if (d.rows.length >= TRIES) {
        d.done = true;
        d.streak = 0;
        Milo.store.set('word-sleuth:streak', 0);
        g.set('Streak', 0);
        g.gameOver({
          emo: '🔤', title: 'Out of guesses',
          text: 'The word was ' + d.answer.toUpperCase() + '.',
          score: 0
        });
      } else {
        Milo.sound.blip();
      }
    }

    function key(g, k) {
      var d = g.data;
      if (d.done || g.state !== 'play') return;
      if (k === '↵') { submit(g); return; }
      if (k === '⌫') { d.cur = d.cur.slice(0, -1); paint(g); return; }
      if (!/^[a-z]$/.test(k)) return;
      if (d.cur.length >= LEN) return;
      d.cur += k;
      paint(g);
    }

    return Milo.domGame(host, {
      id: 'word-sleuth',
      stats: ['Guess', 'Streak', 'Best'],
      bg: '#101433',
      emo: '🔤',
      start: {
        title: 'Word Sleuth',
        text: 'Six guesses at a five-letter word. Green means the letter is in the right ' +
          'place, amber means it is in the word but somewhere else, grey means it is out. ' +
          'Solve it in fewer guesses to score more.',
        keys: ['Type a word', 'Enter to guess', 'Backspace to undo']
      },
      init: reset,
      onKey: function (g, e) {
        if (e.key === 'Enter') key(g, '↵');
        else if (e.key === 'Backspace') key(g, '⌫');
        else if (/^[a-zA-Z]$/.test(e.key)) key(g, e.key.toLowerCase());
      }
    });
  }

  window.Milo.register({
    id: 'word-sleuth', title: 'Word Sleuth', emo: '🔤', category: 'Word',
    tagline: 'Six guesses, five letters',
    description: 'Guess the hidden five-letter word. Each guess is colour-coded: green for ' +
      'a letter in exactly the right place, amber for one that is in the word but elsewhere, ' +
      'grey for one that is not there at all. Repeated letters are scored properly, so two ' +
      'of the same letter only light up as often as the answer actually contains it. ' +
      'Consecutive solves build a streak.',
    controls: ['Type', 'Enter', 'Backspace'],
    colors: ['#34d399', '#f59e0b'],
    featured: true,
    tags: ['word', 'guessing', 'daily', 'brain'],
    mount: mount
  });
})();
