/* Rhyme Time — pick the word that really rhymes, before the bar empties. */
(function () {
  'use strict';

  /* [word, true rhyme, three near-misses]. The near-misses are chosen to look
     or sound close — English spelling lies constantly, so the traps are real
     eye-rhymes (tough/though, finger/singer, plague/plaque). */
  var EASY = [
    ['cat', 'hat', 'cot', 'cut', 'cart'],
    ['dog', 'log', 'dig', 'dug', 'dot'],
    ['moon', 'spoon', 'mood', 'mount', 'man'],
    ['star', 'car', 'stare', 'store', 'stir'],
    ['blue', 'glue', 'bloom', 'blot', 'bled'],
    ['tree', 'free', 'trim', 'true', 'tray'],
    ['night', 'light', 'nigh', 'net', 'note'],
    ['rain', 'plain', 'ruin', 'run', 'rim'],
    ['clock', 'rock', 'cloak', 'click', 'cluck'],
    ['bell', 'shell', 'bill', 'ball', 'belt'],
    ['sing', 'ring', 'sink', 'song', 'sang'],
    ['book', 'look', 'boot', 'back', 'bloke'],
    ['cake', 'lake', 'cook', 'calf', 'cape'],
    ['mouse', 'house', 'moose', 'muse', 'mouth'],
    ['green', 'bean', 'groan', 'grain', 'grin'],
    ['smile', 'mile', 'small', 'smell', 'mill'],
    ['snow', 'glow', 'snap', 'now', 'new'],
    ['chair', 'share', 'cheer', 'char', 'chore'],
    ['nose', 'rose', 'noose', 'news', 'nod'],
    ['fish', 'wish', 'fresh', 'flash', 'fist'],
    ['bird', 'third', 'bread', 'bard', 'beard'],
    ['train', 'brain', 'tram', 'turn', 'tree'],
    ['jump', 'bump', 'lamp', 'junk', 'jam'],
    ['clean', 'mean', 'clan', 'cling', 'cloud'],
    ['stone', 'bone', 'stun', 'stain', 'stole'],
    ['cheese', 'breeze', 'chase', 'chose', 'chest'],
    ['brush', 'crush', 'brash', 'bush', 'birch'],
    ['storm', 'warm', 'stem', 'store', 'strum'],
    ['grape', 'shape', 'grasp', 'group', 'grip'],
    ['plate', 'skate', 'plait', 'plot', 'pleat'],
    ['queen', 'seen', 'quiet', 'quilt', 'quill'],
    ['drum', 'hum', 'dram', 'dream', 'drip'],
    ['flame', 'game', 'flat', 'flute', 'film'],
    ['cloud', 'loud', 'clod', 'clued', 'clown'],
    ['crown', 'down', 'crow', 'cram', 'crone'],
    ['wheel', 'steal', 'whale', 'whirl', 'well'],
    ['spider', 'wider', 'spade', 'spite', 'spinner'],
    ['bright', 'kite', 'brought', 'brick', 'bride'],
    ['hand', 'band', 'hard', 'hind', 'held'],
    ['ship', 'tip', 'shop', 'sheep', 'shape'],
    ['farm', 'charm', 'form', 'firm', 'fame'],
    ['table', 'cable', 'tablet', 'tumble', 'trouble'],
    ['candle', 'handle', 'candy', 'cradle', 'kindle'],
    ['pencil', 'stencil', 'pension', 'pen', 'peril'],
    ['garden', 'pardon', 'garnet', 'gander', 'golden'],
    ['yellow', 'mellow', 'yell', 'hollow', 'willow'],
    ['winter', 'splinter', 'wither', 'wonder', 'winder'],
    ['summer', 'drummer', 'simmer', 'sooner', 'swimmer'],
    ['thunder', 'wonder', 'thinner', 'thumb', 'tender'],
    ['river', 'quiver', 'rival', 'raver', 'ripper'],
    ['mountain', 'fountain', 'mounting', 'maintain', 'moaning'],
    ['forest', 'florist', 'foremost', 'fairest', 'frost'],
    ['flower', 'power', 'follower', 'floor', 'fewer'],
    ['rocket', 'pocket', 'racket', 'locker', 'rotate'],
    ['dragon', 'wagon', 'drag', 'dungeon', 'dagger'],
    ['castle', 'hassle', 'cattle', 'cast', 'cactus'],
    ['turtle', 'hurtle', 'turntable', 'tunnel', 'title'],
    ['bubble', 'trouble', 'bugle', 'bundle', 'babble'],
    ['giggle', 'wiggle', 'gaggle', 'goggle', 'gargle'],
    ['puddle', 'muddle', 'paddle', 'pedal', 'poodle'],
    ['button', 'mutton', 'baton', 'bottom', 'batten'],
    ['kitten', 'bitten', 'kitchen', 'curtain', 'knitting'],
    ['bottle', 'throttle', 'battle', 'bundle', 'botany']
  ];

  var MEDIUM = [
    ['gone', 'on', 'bone', 'tone', 'phone'],
    ['bone', 'phone', 'gone', 'done', 'none'],
    ['done', 'fun', 'bone', 'cone', 'tone'],
    ['none', 'sun', 'bone', 'stone', 'phone'],
    ['one', 'won', 'bone', 'gone', 'cone'],
    ['some', 'thumb', 'dome', 'home', 'foam'],
    ['come', 'drum', 'dome', 'home', 'tome'],
    ['home', 'foam', 'come', 'some', 'bomb'],
    ['shoe', 'too', 'toe', 'hoe', 'foe'],
    ['toe', 'low', 'shoe', 'who', 'do'],
    ['who', 'blue', 'how', 'now', 'bough'],
    ['now', 'cow', 'know', 'low', 'snow'],
    ['know', 'grow', 'now', 'how', 'cow'],
    ['bowl', 'goal', 'owl', 'howl', 'growl'],
    ['owl', 'growl', 'bowl', 'roll', 'soul'],
    ['soul', 'stroll', 'soil', 'foul', 'owl'],
    ['foul', 'howl', 'full', 'fool', 'foal'],
    ['full', 'wool', 'fool', 'cool', 'fuel'],
    ['pull', 'bull', 'pool', 'tool', 'fuel'],
    ['pool', 'rule', 'pull', 'full', 'foul'],
    ['sew', 'so', 'few', 'new', 'dew'],
    ['few', 'view', 'sew', 'saw', 'so'],
    ['new', 'blue', 'now', 'sew', 'no'],
    ['dew', 'due', 'sew', 'dough', 'doe'],
    ['said', 'bed', 'maid', 'paid', 'laid'],
    ['paid', 'made', 'said', 'plaid', 'sad'],
    ['plaid', 'mad', 'paid', 'laid', 'maid'],
    ['friend', 'end', 'fiend', 'fried', 'field'],
    ['fiend', 'cleaned', 'friend', 'fined', 'fend'],
    ['field', 'sealed', 'filed', 'friend', 'fold'],
    ['filed', 'wild', 'field', 'filled', 'folded'],
    ['wind (the breeze)', 'pinned', 'mind', 'find', 'kind'],
    ['mind', 'signed', 'finned', 'sinned', 'winded'],
    ['blind', 'dined', 'skinned', 'tinned', 'blinked'],
    ['put', 'foot', 'but', 'cut', 'hut'],
    ['but', 'cut', 'put', 'soot', 'foot'],
    ['love', 'glove', 'move', 'prove', 'grove'],
    ['move', 'groove', 'love', 'dove', 'shove'],
    ['prove', 'groove', 'love', 'stove', 'drove'],
    ['word', 'herd', 'ford', 'cord', 'lord'],
    ['sword', 'bored', 'word', 'absurd', 'blurred'],
    ['heart', 'art', 'hearth', 'heard', 'beard'],
    ['beard', 'feared', 'heard', 'bread', 'herd'],
    ['heard', 'word', 'beard', 'feared', 'geared'],
    ['bear', 'hair', 'fear', 'near', 'clear'],
    ['fear', 'deer', 'bear', 'pear', 'wear'],
    ['pear', 'care', 'ear', 'spear', 'smear'],
    ['wear', 'share', 'ear', 'gear', 'smear'],
    ['flood', 'mud', 'food', 'mood', 'brood'],
    ['food', 'mood', 'flood', 'blood', 'good'],
    ['good', 'hood', 'food', 'mood', 'brood'],
    ['blood', 'bud', 'brood', 'mood', 'food'],
    ['foot', 'put', 'boot', 'root', 'hoot'],
    ['boot', 'flute', 'foot', 'soot', 'put'],
    ['hear', 'here', 'heart', 'heard', 'hair'],
    ['where', 'hair', 'were', 'weir', 'wire'],
    ['were', 'fur', 'where', 'here', 'wear'],
    ['there', 'care', 'here', 'threw', 'three'],
    ['their', 'bear', 'tier', 'thief', 'three'],
    ['front', 'hunt', 'fort', 'font', 'fruit'],
    ['touch', 'much', 'tough', 'torch', 'couch'],
    ['couch', 'pouch', 'touch', 'cough', 'coach'],
    ['coach', 'poach', 'couch', 'cough', 'catch']
  ];

  var HARD = [
    ['tough', 'cuff', 'though', 'cough', 'bough'],
    ['though', 'throw', 'rough', 'through', 'cough'],
    ['through', 'shoe', 'rough', 'tough', 'plough'],
    ['cough', 'off', 'dough', 'bough', 'through'],
    ['bough', 'cow', 'dough', 'tough', 'through'],
    ['dough', 'toe', 'plough', 'rough', 'cough'],
    ['rough', 'stuff', 'dough', 'bough', 'though'],
    ['enough', 'puff', 'though', 'dough', 'thorough'],
    ['comb', 'home', 'bomb', 'tomb', 'womb'],
    ['bomb', 'mom', 'comb', 'tomb', 'womb'],
    ['tomb', 'room', 'comb', 'bomb', 'home'],
    ['womb', 'boom', 'comb', 'bomb', 'home'],
    ['break', 'lake', 'speak', 'freak', 'weak'],
    ['speak', 'cheek', 'break', 'steak', 'great'],
    ['steak', 'ache', 'leak', 'beak', 'sneak'],
    ['great', 'eight', 'seat', 'treat', 'meat'],
    ['threat', 'debt', 'treat', 'wheat', 'neat'],
    ['sweat', 'bet', 'seat', 'wheat', 'treat'],
    ['bread', 'said', 'bead', 'plead', 'knead'],
    ['bead', 'feed', 'bread', 'dead', 'head'],
    ['dead', 'fed', 'bead', 'plead', 'knead'],
    ['head', 'bed', 'bead', 'plead', 'mead'],
    ['climb', 'time', 'limb', 'lamb', 'crumb'],
    ['limb', 'him', 'climb', 'time', 'lime'],
    ['lamb', 'ham', 'lame', 'calm', 'climb'],
    ['calm', 'palm', 'clam', 'lamb', 'charm'],
    ['half', 'laugh', 'shelf', 'hail', 'halt'],
    ['calf', 'staff', 'cave', 'call', 'clef'],
    ['laugh', 'graph', 'cough', 'dough', 'though'],
    ['busy', 'dizzy', 'bus', 'fussy', 'buoy'],
    ['bury', 'merry', 'fury', 'jury', 'blurry'],
    ['many', 'penny', 'rainy', 'brainy', 'zany'],
    ['eight', 'late', 'height', 'eighth', 'sight'],
    ['height', 'kite', 'weight', 'eight', 'freight'],
    ['weight', 'wait', 'height', 'width', 'weighed'],
    ['gauge', 'page', 'laugh', 'gouge', 'gauze'],
    ['business', 'witness', 'busy', 'bus', 'buzzes'],
    ['sign', 'fine', 'signal', 'sing', 'sin'],
    ['design', 'mine', 'designate', 'dessert', 'decide'],
    ['muscle', 'tussle', 'muscular', 'missile', 'musical'],
    ['island', 'highland', 'inland', 'islet', 'isolate'],
    ['answer', 'dancer', 'anger', 'antler', 'ancient'],
    ['subtle', 'shuttle', 'subtitle', 'sublet', 'stubble'],
    ['debt', 'jet', 'depth', 'doubt', 'dot'],
    ['doubt', 'shout', 'dough', 'debt', 'dot'],
    ['receipt', 'seat', 'recipe', 'reception', 'receive'],
    ['knight', 'bite', 'knit', 'knee', 'knot'],
    ['knee', 'key', 'knew', 'know', 'knot'],
    ['gnome', 'roam', 'gnaw', 'gnat', 'grim'],
    ['wrist', 'kissed', 'write', 'wrest', 'worst'],
    ['write', 'height', 'wrist', 'writ', 'wreath'],
    ['wrong', 'song', 'wring', 'rung', 'wrangle'],
    ['ballet', 'chalet', 'ballot', 'bullet', 'balloon'],
    ['ocean', 'motion', 'oxen', 'occasion', 'option'],
    ['nation', 'station', 'notion', 'nature', 'natural'],
    ['question', 'congestion', 'quest', 'quiet', 'quotient'],
    ['machine', 'marine', 'machete', 'machinist', 'mash'],
    ['chef', 'deaf', 'chief', 'chess', 'chafe'],
    ['chic', 'sleek', 'chick', 'chalk', 'check'],
    ['yacht', 'hot', 'yak', 'yeast', 'yachting'],
    ['choir', 'fire', 'chore', 'choice', 'chair'],
    ['colonel', 'kernel', 'colon', 'cologne', 'column'],
    ['plumber', 'summer', 'plum', 'plumage', 'plume'],
    ['salmon', 'gammon', 'salami', 'sermon', 'simmer'],
    ['suite', 'sweet', 'suit', 'site', 'suede'],
    ['juice', 'loose', 'juicy', 'jute', 'joust'],
    ['bruise', 'news', 'brush', 'brutes', 'browse'],
    ['cruise', 'shoes', 'crust', 'crude', 'cruiser'],
    ['tongue', 'hung', 'tong', 'tune', 'tangle'],
    ['league', 'intrigue', 'leaf', 'legal', 'ledge'],
    ['plague', 'vague', 'plaque', 'plaid', 'plough'],
    ['plaque', 'back', 'plague', 'place', 'plaid'],
    ['ache', 'bake', 'act', 'arch', 'ash'],
    ['ancient', 'patient', 'anchor', 'antique', 'agent'],
    ['treasure', 'pleasure', 'treasury', 'trousers', 'tremor'],
    ['measure', 'pleasure', 'measles', 'mixture', 'master'],
    ['finger', 'linger', 'singer', 'ringer', 'stinger'],
    ['singer', 'ringer', 'finger', 'linger', 'danger'],
    ['danger', 'stranger', 'dancer', 'dagger', 'daring'],
    ['bought', 'taut', 'bough', 'bout', 'boat'],
    ['thought', 'caught', 'though', 'throat', 'thou'],
    ['taught', 'fought', 'tough', 'teach', 'throat'],
    ['caught', 'sought', 'cough', 'cot', 'coat'],
    ['sure', 'cure', 'sore', 'sour', 'soar'],
    ['chalk', 'talk', 'chuck', 'cheek', 'chock'],
    ['walk', 'hawk', 'wall', 'whack', 'woke'],
    ['folk', 'joke', 'fork', 'fold', 'flock'],
    ['yolk', 'soak', 'yellow', 'yank', 'yak'],
    ['salt', 'fault', 'slat', 'silt', 'sail'],
    ['malt', 'halt', 'mall', 'melt', 'moult'],
    ['psalm', 'calm', 'spasm', 'salmon', 'spam'],
    ['shepherd', 'leopard', 'sheep', 'sphere', 'shepherdess'],
    ['leopard', 'peppered', 'leotard', 'leper', 'leaped'],
    ['worry', 'hurry', 'wore', 'wiry', 'weary'],
    ['hurry', 'curry', 'hurl', 'hairy', 'hoary'],
    ['sorry', 'quarry', 'story', 'sour', 'soaring'],
    ['biscuit', 'brisket', 'bisque', 'basket', 'biscuits'],
    ['carriage', 'marriage', 'courage', 'carry', 'cabbage'],
    ['village', 'pillage', 'villa', 'vintage', 'violence'],
    ['echo', 'gecko', 'each', 'ache', 'eco'],
    ['cello', 'yellow', 'cell', 'cellar', 'chilly'],
    ['hello', 'mellow', 'hell', 'halo', 'hollow'],
    ['tornado', 'potato', 'torpedo', 'tomahawk', 'tarnish'],
    ['zero', 'hero', 'zeal', 'zebra', 'zoo'],
    ['quay', 'key', 'quail', 'quote', 'queue'],
    ['queue', 'few', 'quay', 'quick', 'quiet'],
    ['aisle', 'mile', 'ail', 'aid', 'easel'],
    ['isle', 'file', 'islet', 'ill', 'easel'],
    ['corps', 'core', 'corpse', 'cops', 'carps'],
    ['tour', 'poor', 'tore', 'tower', 'tar'],
    ['onion', 'bunion', 'union', 'opinion', 'onward'],
    ['union', 'reunion', 'onion', 'opinion', 'unison'],
    ['turkey', 'murky', 'turnkey', 'tricky', 'tinker'],
    ['money', 'funny', 'monkey', 'moan', 'mono'],
    ['honey', 'sunny', 'phony', 'hone', 'hornet'],
    ['ghost', 'most', 'gust', 'gush', 'gash'],
    ['laughter', 'after', 'daughter', 'slaughter', 'lager'],
    ['daughter', 'slaughter', 'laughter', 'dafter', 'daunt'],
    ['quarter', 'shorter', 'quarry', 'quieter', 'quartz'],
    ['creature', 'feature', 'creator', 'creation', 'crease'],
    ['eye', 'pie', 'ear', 'yea', 'eel'],
    ['buy', 'high', 'bay', 'boy', 'bury'],
    ['guy', 'sigh', 'guide', 'gum', 'guilt'],
    ['rhyme', 'climb', 'rhythm', 'ream', 'rhino']
  ];

  var LIVES = 3;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var els = null, timers = [];

    function later(fn, ms) {
      var t = setTimeout(function () { var i = timers.indexOf(t); if (i >= 0) timers.splice(i, 1); fn(); }, ms);
      timers.push(t);
      return t;
    }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    function build(g) {
      var root = g.root;
      root.innerHTML = '';
      var style = document.createElement('style');
      style.textContent = [
        '.rt-wrap{display:flex;flex-direction:column;align-items:center;gap:14px;font-family:Outfit,sans-serif;',
        'width:100%;max-width:470px;margin:auto;position:relative;user-select:none;-webkit-user-select:none}',
        '.rt-stage{position:relative;width:100%;display:grid;place-items:center;padding:16px 0 6px}',
        '.rt-ring{position:absolute;border:2px solid rgba(244,114,182,.55);border-radius:999px;',
        'width:120px;height:56px;pointer-events:none;animation:rtRing 1.8s ease-out infinite}',
        '@keyframes rtRing{0%{transform:scale(.6);opacity:.75}100%{transform:scale(2.4);opacity:0}}',
        '.rt-word{position:relative;font:900 clamp(30px,8.4vw,48px)/1 Outfit,sans-serif;color:#fde9ff;',
        'text-transform:lowercase;letter-spacing:.01em;text-shadow:0 0 22px rgba(244,114,182,.65)}',
        '.rt-sub{font-size:.76rem;letter-spacing:.2em;text-transform:uppercase;color:#b78ad4}',
        '.rt-bar{width:100%;height:9px;border-radius:6px;background:#3a1b52;overflow:hidden}',
        '.rt-bar i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#f472b6,#a78bfa)}',
        '.rt-opts{display:grid;grid-template-columns:1fr 1fr;gap:9px;width:100%}',
        '.rt-o{position:relative;border:2px solid #52306f;background:#33184a;color:#f6e6ff;border-radius:14px;',
        'padding:13px 8px;font:800 clamp(15px,4.2vw,21px)/1.1 Outfit,sans-serif;cursor:pointer;',
        'transition:transform .1s,background .15s,border-color .15s;text-transform:lowercase}',
        '.rt-o span{position:absolute;top:5px;left:8px;font-size:.6rem;color:#a06fc4;font-weight:700}',
        '.rt-o:active{transform:scale(.97)}',
        '.rt-o.right{background:#1f7a52;border-color:#34d399;color:#eaffee}',
        '.rt-o.wrong{background:#7a1f38;border-color:#fb7185;color:#ffe9ee}',
        '.rt-o.dim{opacity:.45}',
        '.rt-foot{display:flex;justify-content:space-between;width:100%;font-size:.8rem;color:#c8a4e4;min-height:22px}',
        '.rt-foot b{color:#ffd9f2}',
        '.rt-note{text-align:center;font-size:.84rem;color:#e9c9ff;min-height:20px;font-weight:600}',
        '.rt-spark{position:absolute;width:6px;height:6px;border-radius:50%;pointer-events:none;',
        'animation:rtSpark 1s ease-out forwards}',
        '@keyframes rtSpark{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(0);opacity:0}}'
      ].join('');

      var wrap = document.createElement('div'); wrap.className = 'rt-wrap';
      var stage = document.createElement('div'); stage.className = 'rt-stage';
      var ring1 = document.createElement('div'); ring1.className = 'rt-ring';
      var ring2 = document.createElement('div'); ring2.className = 'rt-ring';
      ring2.style.animationDelay = '.9s';
      var sub = document.createElement('div'); sub.className = 'rt-sub'; sub.textContent = 'what rhymes with';
      var word = document.createElement('div'); word.className = 'rt-word';
      stage.appendChild(ring1); stage.appendChild(ring2);
      var col = document.createElement('div');
      col.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;position:relative';
      col.appendChild(sub); col.appendChild(word);
      stage.appendChild(col);

      var bar = document.createElement('div'); bar.className = 'rt-bar';
      var fill = document.createElement('i'); bar.appendChild(fill);

      var opts = document.createElement('div'); opts.className = 'rt-opts';
      var buttons = [];
      for (var i = 0; i < 4; i++) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'rt-o';
        var n = document.createElement('span'); n.textContent = i + 1;
        var t = document.createElement('u'); t.style.textDecoration = 'none';
        b.appendChild(n); b.appendChild(t);
        (function (idx) { b.addEventListener('click', function () { answer(g, idx); }); })(i);
        opts.appendChild(b);
        buttons.push({ el: b, tx: t });
      }

      var note = document.createElement('div'); note.className = 'rt-note';
      var foot = document.createElement('div'); foot.className = 'rt-foot';
      var fL = document.createElement('span'), fR = document.createElement('span');
      foot.appendChild(fL); foot.appendChild(fR);

      wrap.appendChild(stage); wrap.appendChild(bar); wrap.appendChild(opts);
      wrap.appendChild(note); wrap.appendChild(foot);
      root.appendChild(style); root.appendChild(wrap);

      els = { wrap: wrap, word: word, fill: fill, buttons: buttons, note: note, fL: fL, fR: fR };
    }

    /* ------------------------------------------------------------- rounds */

    function reset(g) {
      var d = g.data;
      clearTimers();
      d.gen = (d.gen || 0) + 1;
      d.lives = LIVES;
      d.streak = 0;
      d.best = 0;
      d.asked = 0;
      d.pools = [U.shuffle(EASY.slice()), U.shuffle(MEDIUM.slice()), U.shuffle(HARD.slice())];
      d.idx = [0, 0, 0];
      d.locked = false;
      build(g);
      nextQ(g);
      g.set('Score', 0);
      g.set('Lives', LIVES);
      g.set('Streak', 0);
    }

    function draw(d) {
      var tier = d.asked < 6 ? 0 : d.asked < 16 ? 1 : (d.asked % 4 === 3 ? 1 : 2);
      var pool = d.pools[tier];
      if (d.idx[tier] >= pool.length) { U.shuffle(pool); d.idx[tier] = 0; }
      return { set: pool[d.idx[tier]++], tier: tier };
    }

    function nextQ(g) {
      var d = g.data;
      var got = draw(d);
      var set = got.set;
      d.tier = got.tier;
      d.answer = set[1];
      var choices = [set[1], set[2], set[3], set[4]];
      U.shuffle(choices);
      d.choices = choices;
      d.correct = choices.indexOf(d.answer);
      d.limit = Math.max(3.6, 8.5 - d.asked * 0.16);
      d.left = d.limit;
      d.locked = false;

      els.word.textContent = set[0];
      els.buttons.forEach(function (b, i) {
        b.el.className = 'rt-o';
        b.tx.textContent = choices[i];
      });
      els.note.textContent = '';
      els.fL.textContent = 'Question ' + (d.asked + 1);
      els.fR.innerHTML = '';
      var lab = document.createElement('b');
      lab.textContent = ['warm-up', 'tricky', 'devious'][d.tier];
      els.fR.appendChild(lab);
      els.fill.style.width = '100%';
    }

    function spark(g, node, colour) {
      var r = node.getBoundingClientRect(), w = els.wrap.getBoundingClientRect();
      for (var i = 0; i < 16; i++) {
        var p = document.createElement('div');
        p.className = 'rt-spark';
        p.style.background = colour;
        p.style.left = (r.left - w.left + r.width / 2) + 'px';
        p.style.top = (r.top - w.top + r.height / 2) + 'px';
        var a = Math.random() * Math.PI * 2, dist = 30 + Math.random() * 70;
        p.style.setProperty('--dx', (Math.cos(a) * dist).toFixed(0) + 'px');
        p.style.setProperty('--dy', (Math.sin(a) * dist).toFixed(0) + 'px');
        els.wrap.appendChild(p);
        (function (node2) { later(function () { if (node2.parentNode) node2.parentNode.removeChild(node2); }, 1100); })(p);
      }
    }

    function answer(g, idx) {
      var d = g.data;
      if (g.state !== 'play' || d.locked) return;
      d.locked = true;
      var right = idx === d.correct;
      els.buttons.forEach(function (b, i) {
        if (i === d.correct) b.el.className = 'rt-o right';
        else if (i === idx) b.el.className = 'rt-o wrong';
        else b.el.className = 'rt-o dim';
      });

      if (right) {
        d.streak++;
        if (d.streak > d.best) d.best = d.streak;
        var mult = 1 + Math.min(1.5, (d.streak - 1) * 0.15);
        var pts = Math.round((60 + Math.round(d.left * 18) + d.tier * 40) * mult);
        g.score += pts;
        g.set('Score', U.fmt(g.score));
        g.set('Streak', d.streak);
        els.note.textContent = '+' + pts + (d.streak > 2 ? '  (streak ×' + mult.toFixed(2) + ')' : '');
        Milo.sound.coin();
        spark(g, els.buttons[idx].el, '#34d399');
      } else {
        d.streak = 0;
        d.lives--;
        g.set('Streak', 0);
        g.set('Lives', Math.max(0, d.lives));
        els.note.textContent = '“' + d.choices[idx] + '” looks right but sounds wrong — it is ' +
          '“' + d.answer + '”.';
        Milo.sound.hit();
        spark(g, els.buttons[idx].el, '#fb7185');
      }
      d.asked++;
      finishTurn(g);
    }

    function timeout(g) {
      var d = g.data;
      d.locked = true;
      d.streak = 0;
      d.lives--;
      g.set('Streak', 0);
      g.set('Lives', Math.max(0, d.lives));
      els.buttons.forEach(function (b, i) { b.el.className = 'rt-o' + (i === d.correct ? ' right' : ' dim'); });
      els.note.textContent = 'Too slow — it was “' + d.answer + '”.';
      Milo.sound.lose();
      d.asked++;
      finishTurn(g);
    }

    function finishTurn(g) {
      var d = g.data, gen = d.gen;
      later(function () {
        if (d.gen !== gen || g.state === 'over') return;
        if (d.lives <= 0) {
          g.gameOver({
            emo: '🎤', title: 'Off the beat',
            text: 'Best streak ' + d.best + ' over ' + d.asked + ' rhymes.',
            score: g.score
          });
          return;
        }
        nextQ(g);
      }, 1450);
    }

    return Milo.domGame(host, {
      id: 'rhyme-time',
      bg: '#1d0d30',
      stats: ['Score', 'Lives', 'Streak'],
      emo: '🎤',
      start: {
        title: 'Rhyme Time',
        text: 'One word, four candidates, only one that truly rhymes. English spelling is a liar: ' +
          'tough does not rhyme with though, and finger does not rhyme with singer. The bar shrinks a ' +
          'little every question, consecutive correct answers build a multiplier, and three misses end it.',
        keys: ['1 2 3 4', 'Click an answer']
      },
      init: reset,
      destroy: function () { clearTimers(); },
      update: function (g, dt) {
        var d = g.data;
        if (d.locked) return;
        d.left -= dt;
        els.fill.style.width = Math.max(0, (d.left / d.limit) * 100) + '%';
        if (d.left <= 0) timeout(g);
      },
      onKey: function (g, e) {
        var n = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3 }[e.code];
        if (n != null) answer(g, n);
      }
    });
  }

  window.Milo.register({
    id: 'rhyme-time', title: 'Rhyme Time', emo: '🎤', category: 'Word',
    tagline: 'Four look-alikes, one real rhyme',
    description: 'Over 250 hand-written rhyme sets where the wrong answers are chosen to fool the eye: ' +
      'tough/though, plague/plaque, finger/singer, island/inland. Answer with 1-4 or a tap before the ' +
      'bar empties — the time allowed shrinks a little with every question and the sets get more ' +
      'devious after the first dozen. Correct answers stack a multiplier that resets the moment you slip, ' +
      'and three misses end the run. Tip: say the word out loud in your head before you look at the ' +
      'spelling — the trap is almost always the option that matches the last three letters.',
    controls: ['1 2 3 4', 'Click'],
    colors: ['#1d0d30', '#f472b6'],
    tags: ['word', 'rhyme', 'quiz', 'timed', 'sounds'],
    mount: mount
  });
})();
