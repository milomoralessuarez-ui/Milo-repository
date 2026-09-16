/* Emoji Riddles — read the pictures, type the thing. */
(function () {
  'use strict';

  /* Hand-written riddles grouped into themed rounds. `a` is the canonical
     answer, `alt` holds other spellings that should also be accepted. */
  var ROUNDS = [
    { name: 'Silver Screen', emo: '🎬', q: [
      { e: '🦁👑', a: 'the lion king' },
      { e: '🚢🧊💔', a: 'titanic' },
      { e: '🕷️🧑', a: 'spider-man', alt: ['spiderman', 'spider man'] },
      { e: '🦖🏝️🚙', a: 'jurassic park' },
      { e: '🔍🐠🌊', a: 'finding nemo' },
      { e: '💍🌋🧙', a: 'the lord of the rings', alt: ['lord of the rings'] },
      { e: '❄️👸⛄', a: 'frozen' },
      { e: '👻🚫🔫', a: 'ghostbusters' },
      { e: '🤖🗑️🌱', a: 'wall-e', alt: ['walle', 'wall e'] },
      { e: '🐼🥋🥢', a: 'kung fu panda' },
      { e: '🐀👨‍🍳🇫🇷', a: 'ratatouille' },
      { e: '🦈🌊🏖️', a: 'jaws' },
      { e: '🧸🤠🚀', a: 'toy story' },
      { e: '🚗⚡🕰️', a: 'back to the future' },
      { e: '🐝🎥🍯', a: 'bee movie' }
    ] },
    { name: 'Say What?', emo: '💬', q: [
      { e: '🐱🎒🔓', a: 'let the cat out of the bag' },
      { e: '🍰🧩', a: 'a piece of cake', alt: ['piece of cake'] },
      { e: '🌧️🐱🐶', a: 'raining cats and dogs' },
      { e: '🐦✋🌳🐦🐦', a: 'a bird in the hand is worth two in the bush',
        alt: ['bird in the hand', 'a bird in the hand'] },
      { e: '🎂❄️', a: 'the icing on the cake', alt: ['icing on the cake'] },
      { e: '❄️🔨', a: 'break the ice' },
      { e: '👀🍽️🫄', a: 'eyes bigger than your stomach' },
      { e: '🐟🟥', a: 'a red herring', alt: ['red herring'] },
      { e: '🐘🚪🛋️', a: 'the elephant in the room', alt: ['elephant in the room'] },
      { e: '🍳🔥', a: 'out of the frying pan into the fire',
        alt: ['out of the frying pan', 'from the frying pan into the fire'] },
      { e: '⏰🐦🪱', a: 'the early bird catches the worm', alt: ['early bird catches the worm'] },
      { e: '🥛😭', a: 'no use crying over spilt milk',
        alt: ['crying over spilt milk', 'dont cry over spilt milk', 'crying over spilled milk'] },
      { e: '🙈🙉🙊', a: 'see no evil hear no evil speak no evil', alt: ['three wise monkeys'] },
      { e: '🍎🍏🌳', a: 'the apple never falls far from the tree',
        alt: ['the apple doesnt fall far from the tree', 'apple doesnt fall far from the tree'] },
      { e: '🐄🌙🦘', a: 'the cow jumped over the moon', alt: ['cow jumped over the moon'] }
    ] },
    { name: 'On the Menu', emo: '🍽️', q: [
      { e: '🐟🍟', a: 'fish and chips' },
      { e: '🥓🍳', a: 'bacon and eggs' },
      { e: '🍞🧈', a: 'bread and butter' },
      { e: '🥜🧈🍇', a: 'peanut butter and jelly', alt: ['peanut butter and jam'] },
      { e: '🍎🥧', a: 'apple pie' },
      { e: '🍦🍒🍌', a: 'banana split' },
      { e: '🥞🍯', a: 'pancakes', alt: ['pancake'] },
      { e: '☕🍩', a: 'coffee and doughnuts', alt: ['coffee and donuts'] },
      { e: '🍚🍛', a: 'curry and rice', alt: ['rice and curry', 'curry'] },
      { e: '🧀🍷', a: 'cheese and wine', alt: ['wine and cheese'] },
      { e: '🍫🍪', a: 'chocolate chip cookie', alt: ['chocolate cookie'] },
      { e: '🐄🧀🍔', a: 'cheeseburger', alt: ['cheese burger'] },
      { e: '🍗🍟🥤', a: 'fried chicken', alt: ['chicken and chips'] },
      { e: '🍋🥤🧊', a: 'lemonade' },
      { e: '🍅🍝🧄', a: 'spaghetti bolognese', alt: ['spaghetti'] }
    ] },
    { name: 'Around the World', emo: '🌍', q: [
      { e: '🗼🥖🎨', a: 'paris' },
      { e: '🗽🍎🚕', a: 'new york' },
      { e: '🌸🗻🍣', a: 'japan' },
      { e: '🐨🦘🪃', a: 'australia' },
      { e: '🍕🍝🛵', a: 'italy' },
      { e: '🐼🏯🧧', a: 'china' },
      { e: '☂️👑🫖', a: 'england', alt: ['britain', 'great britain'] },
      { e: '🐫🏜️🔺', a: 'egypt' },
      { e: '🌷🚲🧀', a: 'the netherlands', alt: ['netherlands', 'holland'] },
      { e: '💃🐂🥘', a: 'spain' },
      { e: '🍁🏒🦫', a: 'canada' },
      { e: '🗿🌴🌊', a: 'easter island' },
      { e: '🏰🍺🥨', a: 'germany' },
      { e: '🐘🍛🕌', a: 'india' },
      { e: '🎿🏔️🍫', a: 'switzerland' }
    ] },
    { name: 'Once Upon a Time', emo: '📖', q: [
      { e: '👠🎃🕛', a: 'cinderella' },
      { e: '🍎😴7️⃣', a: 'snow white' },
      { e: '🐺🐷🐷🐷', a: 'the three little pigs', alt: ['three little pigs'] },
      { e: '🔴🧥🐺🧺', a: 'little red riding hood', alt: ['red riding hood'] },
      { e: '🐻🐻🐻🥣', a: 'goldilocks and the three bears', alt: ['goldilocks'] },
      { e: '🫘🌱☁️👣', a: 'jack and the beanstalk' },
      { e: '🧜🐚🌊', a: 'the little mermaid', alt: ['little mermaid'] },
      { e: '🐸👑💋', a: 'the frog prince', alt: ['frog prince'] },
      { e: '👃🪵👦', a: 'pinocchio' },
      { e: '🌹🫖🕯️', a: 'beauty and the beast' },
      { e: '👑🧵🚫👕', a: 'the emperors new clothes', alt: ['the emperors new clothes', 'emperors new clothes'] },
      { e: '🍪🏃‍♂️', a: 'the gingerbread man', alt: ['gingerbread man'] },
      { e: '🦆🦢', a: 'the ugly duckling', alt: ['ugly duckling'] },
      { e: '🐰⏰🕳️🫖', a: 'alice in wonderland' },
      { e: '👦👧🍞🏠🍬', a: 'hansel and gretel' }
    ] },
    { name: 'Two Words, One Thing', emo: '🧩', q: [
      { e: '☀️🌻', a: 'sunflower' },
      { e: '🔥🚒', a: 'fire engine', alt: ['fire truck'] },
      { e: '🍯🐝', a: 'honeybee', alt: ['honey bee'] },
      { e: '⭐🐟', a: 'starfish' },
      { e: '🌊🐴', a: 'seahorse', alt: ['sea horse'] },
      { e: '🦇🧑', a: 'batman' },
      { e: '🌙💡', a: 'moonlight' },
      { e: '❄️⚪', a: 'snowball' },
      { e: '🐦🏠', a: 'birdhouse', alt: ['bird house'] },
      { e: '🎂📅', a: 'birthday' },
      { e: '📚🐛', a: 'bookworm', alt: ['book worm'] },
      { e: '🌧️🧥', a: 'raincoat', alt: ['rain coat'] },
      { e: '🧠🌩️', a: 'brainstorm' },
      { e: '🦷🖌️', a: 'toothbrush', alt: ['tooth brush'] },
      { e: '🌊🐚', a: 'seashell', alt: ['sea shell'] },
      { e: '🔑🕳️', a: 'keyhole', alt: ['key hole'] },
      { e: '🦶⚽', a: 'football' },
      { e: '👁️🏀', a: 'eyeball', alt: ['eye ball'] },
      { e: '🐄👦', a: 'cowboy', alt: ['cow boy'] },
      { e: '🔥🪰', a: 'firefly', alt: ['fire fly'] }
    ] },
    { name: 'Game On', emo: '🏆', q: [
      { e: '🏒🧊', a: 'ice hockey', alt: ['hockey'] },
      { e: '🏓🏓', a: 'table tennis', alt: ['ping pong'] },
      { e: '🎯🍺', a: 'darts' },
      { e: '⛳🕳️1️⃣', a: 'hole in one' },
      { e: '🥊🔔', a: 'boxing' },
      { e: '🏊🚴🏃', a: 'triathlon' },
      { e: '🎳💥', a: 'a strike', alt: ['strike'] },
      { e: '🏏🌞🫖', a: 'cricket' },
      { e: '🧗🪨', a: 'rock climbing', alt: ['climbing'] },
      { e: '🏇🌹🏆', a: 'horse racing', alt: ['racing', 'horseracing'] }
    ] },
    { name: 'What’s the Job?', emo: '🧰', q: [
      { e: '🔪🔥🍲', a: 'chef', alt: ['cook'] },
      { e: '🚒💦🪜', a: 'firefighter', alt: ['fireman', 'fire fighter'] },
      { e: '🦷🪥🪑', a: 'dentist' },
      { e: '✂️💇', a: 'hairdresser', alt: ['barber', 'hair dresser'] },
      { e: '📮✉️🚶', a: 'postman', alt: ['postal worker', 'mailman'] },
      { e: '🚀🌌🪐', a: 'astronaut' },
      { e: '💊🩺🏥', a: 'doctor' },
      { e: '🐄🚜🌾', a: 'farmer' },
      { e: '📷🎞️🔦', a: 'photographer' },
      { e: '⚖️👨‍⚖️🔨', a: 'judge' }
    ] },
    { name: 'Wild Weather', emo: '🌦️', q: [
      { e: '⛈️⚡🌧️', a: 'thunderstorm', alt: ['storm', 'thunder storm'] },
      { e: '🍂🍁🌰', a: 'autumn', alt: ['fall'] },
      { e: '❄️⛄🎿', a: 'winter' },
      { e: '🌋🔥💨', a: 'volcano' },
      { e: '🏜️🌵☀️', a: 'desert' },
      { e: '🌪️🏠💨', a: 'tornado' },
      { e: '🌕🌗🌑', a: 'phases of the moon', alt: ['moon phases', 'the moon'] },
      { e: '💧☁️🔄', a: 'the water cycle', alt: ['water cycle', 'rain'] },
      { e: '🌈☀️🌧️', a: 'rainbow' },
      { e: '🧊🏔️🌊', a: 'iceberg' }
    ] }
  ];

  var PER_ROUND = 5;
  var TOTAL_ROUNDS = 5;
  var LIVES = 3;

  function norm(s) {
    return String(s).toLowerCase()
      .replace(/[^a-z0-9 ]+/g, '')
      .replace(/\b(the|a|an|and|of|in|on|to|is|it|your|you)\b/g, '')
      .replace(/\s+/g, '');
  }

  function dist(a, b) {
    var m = a.length, n = b.length, i, j;
    if (Math.abs(m - n) > 3) return 99;
    var prev = [], cur = [];
    for (j = 0; j <= n; j++) prev[j] = j;
    for (i = 1; i <= m; i++) {
      cur[0] = i;
      for (j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1,
          prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
      }
      for (j = 0; j <= n; j++) prev[j] = cur[j];
    }
    return prev[n];
  }

  function accepts(q, typed) {
    var t = norm(typed);
    if (!t) return false;
    var list = [q.a].concat(q.alt || []);
    for (var i = 0; i < list.length; i++) {
      var w = norm(list[i]);
      if (t === w) return true;
      var slack = w.length > 14 ? 3 : w.length > 8 ? 2 : w.length > 4 ? 1 : 0;
      if (dist(t, w) <= slack) return true;
    }
    return false;
  }

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var els = null, timers = [];

    function later(fn, ms) {
      var t = setTimeout(function () { var i = timers.indexOf(t); if (i >= 0) timers.splice(i, 1); fn(); }, ms);
      timers.push(t);
      return t;
    }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    var KB = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

    function build(g) {
      var root = g.root;
      root.innerHTML = '';
      var style = document.createElement('style');
      style.textContent = [
        '.er-wrap{display:flex;flex-direction:column;align-items:center;gap:11px;font-family:Outfit,sans-serif;',
        'width:100%;max-width:470px;margin:auto;position:relative;user-select:none;-webkit-user-select:none}',
        '.er-theme{font-size:.72rem;letter-spacing:.24em;text-transform:uppercase;color:#5eead4}',
        '.er-card{width:100%;background:linear-gradient(160deg,#083b44,#04222a);border:1px solid #0e6b72;',
        'border-radius:18px;padding:20px 14px;display:flex;flex-direction:column;align-items:center;gap:8px;',
        'box-shadow:0 14px 40px rgba(0,0,0,.45)}',
        '.er-emo{font-size:clamp(34px,10vw,54px);letter-spacing:.06em;line-height:1.25;text-align:center;',
        'animation:erFloat 3.2s ease-in-out infinite}',
        '@keyframes erFloat{50%{transform:translateY(-7px)}}',
        '.er-pat{font:700 clamp(15px,4vw,20px)/1 "Courier New",monospace;letter-spacing:.22em;color:#7dd3fc;min-height:22px}',
        '.er-in{width:100%;display:flex;align-items:center;justify-content:center;min-height:46px;',
        'background:#04222a;border:2px solid #0e6b72;border-radius:12px;padding:6px 12px;',
        'font:800 clamp(16px,4.4vw,22px)/1.15 Outfit,sans-serif;color:#d8fffb;text-align:center;word-break:break-word}',
        '.er-in.empty{color:#3c7c83}',
        '.er-in.ok{border-color:#34d399;background:#07352c}',
        '.er-in.no{border-color:#fb7185;background:#3a1220;animation:erShake .4s}',
        '@keyframes erShake{20%{transform:translateX(-6px)}60%{transform:translateX(6px)}}',
        '.er-bar{width:100%;height:8px;border-radius:5px;background:#06333b;overflow:hidden}',
        '.er-bar i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#2dd4bf,#7dd3fc)}',
        '.er-msg{min-height:22px;font-size:.85rem;font-weight:700;color:#9becdf;text-align:center}',
        '.er-kb{display:flex;flex-direction:column;gap:4px;width:100%;align-items:center}',
        '.er-kr{display:flex;gap:3px;justify-content:center;width:100%}',
        '.er-k{flex:1 1 0;max-width:36px;height:36px;border:0;border-radius:6px;background:#0d5b63;color:#d8fffb;',
        'font:700 .85rem Outfit,sans-serif;text-transform:uppercase;cursor:pointer;padding:0}',
        '.er-k.wide{max-width:60px;flex:1.7 1 0}',
        '.er-k:active{background:#2dd4bf;color:#04222a}',
        '.er-conf{position:absolute;width:8px;height:8px;pointer-events:none;border-radius:2px;',
        'animation:erConf 1.3s ease-out forwards}',
        '@keyframes erConf{0%{transform:translate(0,0) rotate(0);opacity:1}100%{transform:translate(var(--dx),var(--dy)) rotate(620deg);opacity:0}}'
      ].join('');

      var wrap = document.createElement('div'); wrap.className = 'er-wrap';
      var theme = document.createElement('div'); theme.className = 'er-theme';
      var card = document.createElement('div'); card.className = 'er-card';
      var emo = document.createElement('div'); emo.className = 'er-emo';
      var pat = document.createElement('div'); pat.className = 'er-pat';
      card.appendChild(emo); card.appendChild(pat);

      var input = document.createElement('div'); input.className = 'er-in empty';
      var bar = document.createElement('div'); bar.className = 'er-bar';
      var fill = document.createElement('i'); bar.appendChild(fill);
      var msg = document.createElement('div'); msg.className = 'er-msg';

      var kb = document.createElement('div'); kb.className = 'er-kb';
      KB.forEach(function (line, li) {
        var kr = document.createElement('div'); kr.className = 'er-kr';
        if (li === 2) kr.appendChild(mkKey(g, '␣', 'wide'));
        line.split('').forEach(function (ch) { kr.appendChild(mkKey(g, ch)); });
        if (li === 2) kr.appendChild(mkKey(g, '⌫', 'wide'));
        kb.appendChild(kr);
      });
      var go = document.createElement('button');
      go.type = 'button';
      go.style.cssText = 'border:0;border-radius:10px;background:#2dd4bf;color:#04222a;font:800 .9rem Outfit,sans-serif;' +
        'padding:9px 26px;cursor:pointer;letter-spacing:.06em';
      go.textContent = 'ANSWER';
      go.addEventListener('click', function () { submit(g); });

      wrap.appendChild(theme); wrap.appendChild(card); wrap.appendChild(input);
      wrap.appendChild(bar); wrap.appendChild(msg); wrap.appendChild(kb); wrap.appendChild(go);
      root.appendChild(style); root.appendChild(wrap);

      els = { wrap: wrap, theme: theme, emo: emo, pat: pat, input: input, fill: fill, msg: msg };
    }

    function mkKey(g, ch, cls) {
      var k = document.createElement('button');
      k.type = 'button'; k.className = 'er-k' + (cls ? ' ' + cls : '');
      k.textContent = ch;
      k.addEventListener('click', function () {
        if (ch === '⌫') back(g);
        else if (ch === '␣') typeCh(g, ' ');
        else typeCh(g, ch);
      });
      return k;
    }

    /* ------------------------------------------------------------ rounds */

    function reset(g) {
      var d = g.data;
      clearTimers();
      d.gen = (d.gen || 0) + 1;
      d.lives = LIVES;
      d.streak = 0;
      d.solved = 0;
      d.asked = 0;
      d.round = 0;
      d.rounds = U.shuffle(ROUNDS.slice()).slice(0, TOTAL_ROUNDS);
      build(g);
      startRound(g);
      g.set('Score', 0);
      g.set('Lives', LIVES);
      g.set('Round', '1 / ' + TOTAL_ROUNDS);
    }

    function startRound(g) {
      var d = g.data;
      var r = d.rounds[d.round];
      d.theme = r;
      d.queue = U.shuffle(r.q.slice()).slice(0, PER_ROUND);
      d.qi = 0;
      g.set('Round', (d.round + 1) + ' / ' + TOTAL_ROUNDS);
      nextQ(g);
    }

    function nextQ(g) {
      var d = g.data;
      d.q = d.queue[d.qi];
      d.typed = '';
      d.locked = false;
      d.limit = Math.max(12, 26 - d.round * 2.5);
      d.left = d.limit;
      d.hinted = false;
      els.theme.textContent = d.theme.emo + '  ' + d.theme.name + '  ·  ' + (d.qi + 1) + ' of ' + PER_ROUND;
      els.emo.textContent = d.q.e;
      els.pat.textContent = '';
      els.msg.textContent = '';
      paintIn(g);
    }

    function paintIn(g) {
      var d = g.data;
      els.input.className = 'er-in' + (d.typed ? '' : ' empty');
      els.input.textContent = d.typed ? d.typed.toUpperCase() : 'type your answer';
    }

    function hintPattern(q) {
      return q.a.split('').map(function (ch, i) {
        if (ch === ' ') return ' ';
        return i === 0 || /[^a-z]/.test(ch) ? ch.toUpperCase() : '_';
      }).join('');
    }

    function typeCh(g, ch) {
      var d = g.data;
      if (g.state !== 'play' || d.locked) return;
      if (d.typed.length >= 40) return;
      if (ch === ' ' && (!d.typed || d.typed.charAt(d.typed.length - 1) === ' ')) return;
      d.typed += ch;
      Milo.sound.tone({ f: 620, d: .02, v: .04, type: 'sine' });
      paintIn(g);
    }

    function back(g) {
      var d = g.data;
      if (g.state !== 'play' || d.locked) return;
      d.typed = d.typed.slice(0, -1);
      Milo.sound.tone({ f: 250, d: .04, v: .05, type: 'triangle' });
      paintIn(g);
    }

    function submit(g) {
      var d = g.data;
      if (g.state !== 'play' || d.locked || !d.typed) return;
      if (accepts(d.q, d.typed)) { good(g); return; }
      els.input.className = 'er-in no';
      els.msg.textContent = 'Not it — keep going.';
      Milo.sound.tone({ f: 160, d: .11, v: .07, type: 'square' });
      d.left = Math.max(1.5, d.left - 2.5);
      later(function () { if (!d.locked) paintIn(g); }, 400);
    }

    function confetti(g) {
      var cols = ['#2dd4bf', '#7dd3fc', '#fbbf24', '#f472b6', '#a3e635'];
      for (var i = 0; i < 30; i++) {
        var p = document.createElement('div');
        p.className = 'er-conf';
        p.style.background = cols[(Math.random() * cols.length) | 0];
        p.style.left = (44 + Math.random() * 12) + '%';
        p.style.top = '22%';
        p.style.setProperty('--dx', (Math.random() * 340 - 170).toFixed(0) + 'px');
        p.style.setProperty('--dy', (Math.random() * 240 - 60).toFixed(0) + 'px');
        p.style.animationDelay = (Math.random() * .18).toFixed(2) + 's';
        els.wrap.appendChild(p);
        (function (n) { later(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 1500); })(p);
      }
    }

    function good(g) {
      var d = g.data;
      d.locked = true;
      d.solved++;
      d.streak++;
      var pts = 90 + Math.round(d.left * 7) + d.round * 15 + (d.hinted ? 0 : 40) + (d.streak - 1) * 20;
      g.score += pts;
      g.set('Score', U.fmt(g.score));
      els.input.className = 'er-in ok';
      els.input.textContent = d.q.a.toUpperCase();
      els.msg.textContent = '+' + pts + (d.streak > 1 ? '  ·  streak ' + d.streak : '');
      Milo.sound.coin();
      confetti(g);
      d.asked++;
      advance(g);
    }

    function fail(g) {
      var d = g.data;
      d.locked = true;
      d.streak = 0;
      d.lives--;
      g.set('Lives', Math.max(0, d.lives));
      els.input.className = 'er-in no';
      els.input.textContent = d.q.a.toUpperCase();
      els.msg.textContent = 'Time! That one was “' + d.q.a + '”.';
      Milo.sound.lose();
      d.asked++;
      advance(g);
    }

    function advance(g) {
      var d = g.data, gen = d.gen;
      later(function () {
        if (d.gen !== gen || g.state === 'over') return;
        if (d.lives <= 0) {
          g.gameOver({
            emo: '🧩', title: 'Riddled out',
            text: d.solved + ' of ' + d.asked + ' riddles cracked.',
            score: g.score
          });
          return;
        }
        d.qi++;
        if (d.qi >= d.queue.length) {
          d.round++;
          if (d.round >= TOTAL_ROUNDS) {
            g.win({
              emo: '🎉', title: 'All five rounds cleared!',
              text: d.solved + ' of ' + d.asked + ' riddles solved.',
              score: g.score
            });
            return;
          }
          startRound(g);
        } else nextQ(g);
      }, 1500);
    }

    function key(g, e) {
      var d = g.data;
      if (e.code === 'Enter' || e.code === 'NumpadEnter') { submit(g); return; }
      if (e.code === 'Backspace') { back(g); return; }
      if (e.code === 'Space') { typeCh(g, ' '); return; }
      if (/^[a-zA-Z0-9'-]$/.test(e.key)) typeCh(g, e.key.toLowerCase());
    }

    return Milo.domGame(host, {
      id: 'emoji-riddles',
      bg: '#04222a',
      stats: ['Score', 'Lives', 'Round'],
      emo: '🧩',
      start: {
        title: 'Emoji Riddles',
        text: 'A string of emoji stands for a film, a saying, a place or a thing. Type what you think ' +
          'it is and hit Enter — spelling is forgiven, and "the" and "a" are optional. Halfway through ' +
          'the clock a letter pattern appears, but taking the hint costs you the clean-solve bonus. ' +
          'Five themed rounds, three lives.',
        keys: ['Type', 'Enter', 'Backspace']
      },
      init: reset,
      destroy: function () { clearTimers(); },
      update: function (g, dt) {
        var d = g.data;
        if (d.locked) return;
        d.left -= dt;
        els.fill.style.width = Math.max(0, (d.left / d.limit) * 100) + '%';
        if (!d.hinted && d.left <= d.limit * 0.5) {
          d.hinted = true;
          els.pat.textContent = hintPattern(d.q);
          Milo.sound.blip();
        }
        if (d.left <= 0) fail(g);
      },
      preload: function (g) {
        var prev = g.input._onKey;
        g.input._onKey = function (e, name) {
          if (g.state === 'play' && e.code === 'KeyP') { key(g, e); return; }
          prev(e, name);
        };
      },
      onKey: key
    });
  }

  window.Milo.register({
    id: 'emoji-riddles', title: 'Emoji Riddles', emo: '🧩', category: 'Trivia',
    tagline: 'Decode the pictures, type the phrase',
    description: 'Over 125 hand-written emoji riddles across nine themed rounds — films, idioms, food, ' +
      'countries, fairy tales, compound words, sport, jobs and weather. Type your answer: the matcher ' +
      'forgives typos and ignores "the" and "a", so ⏰🐦🪱 will take "early bird catches the worm". Each ' +
      'riddle pays for speed, a clean solve adds forty and a streak adds twenty a time, but the letter ' +
      'pattern that appears halfway through the clock costs you the clean bonus. Tip: read the emoji ' +
      'left to right as words, not as a picture — 🧠🌩️ is brain plus storm.',
    controls: ['Type letters', 'Space', 'Enter', 'Backspace'],
    colors: ['#04222a', '#2dd4bf'],
    tags: ['emoji', 'riddles', 'quiz', 'guessing', 'puzzle'],
    mount: mount
  });
})();
