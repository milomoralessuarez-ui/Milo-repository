/* Quiz Pack 1 — "Knowledge & Nature": 25 timed multiple-choice quizzes on one
   shared engine. Each run draws 12 questions from that quiz's hand-written
   bank (18+ each), with a 15-second bar per question, speed + streak bonuses,
   and three lives. */
(function () {
  'use strict';

  var QT = 15;        // seconds per question
  var PER_RUN = 12;   // questions per run

  function Q(q, a, d1, d2, d3) { return { q: q, a: a, d: [d1, d2, d3] }; }

  function hearts(n) { return n >= 1 ? new Array(n + 1).join('❤') : '💔'; }

  function makeQuiz(meta) {
    function mount(host) {
      var Milo = window.Milo, U = Milo.util;
      var els = null;
      var c0 = meta.colors[0], c1 = meta.colors[1];

      function build(g) {
        var root = g.root;
        root.innerHTML = '';

        var style = document.createElement('style');
        style.textContent = [
          '.qp-wrap{width:min(680px,96%);margin:auto;display:flex;flex-direction:column;gap:12px;font-family:Outfit,sans-serif}',
          '.qp-top{display:flex;justify-content:space-between;color:#a8b0d8;font-size:.88rem;font-weight:700;letter-spacing:.02em}',
          '.qp-track{height:12px;border-radius:7px;background:rgba(255,255,255,.09);overflow:hidden}',
          '.qp-fill{height:100%;width:100%;border-radius:7px;background:linear-gradient(90deg,' + c0 + ',' + c1 + ')}',
          '.qp-fill.low{background:#fb7185}',
          '.qp-q{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.09);border-radius:14px;' +
          'padding:18px 20px;color:#fff;font-size:clamp(1.02rem,2.6vw,1.26rem);font-weight:700;line-height:1.4;' +
          'min-height:88px;display:flex;align-items:center;justify-content:center;text-align:center}',
          '.qp-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
          '@media(max-width:600px){.qp-grid{grid-template-columns:1fr}}',
          '.qp-btn{display:flex;align-items:center;gap:10px;text-align:left;background:rgba(255,255,255,.05);' +
          'border:2px solid rgba(255,255,255,.13);border-radius:12px;padding:12px 14px;color:#e8ecff;' +
          'font:600 .95rem/1.3 Outfit,sans-serif;cursor:pointer;transition:border-color .12s,background .12s,opacity .2s}',
          '.qp-btn:hover{border-color:' + c0 + ';background:rgba(255,255,255,.09)}',
          '.qp-btn .k{flex:0 0 auto;min-width:24px;height:24px;border-radius:7px;background:rgba(255,255,255,.1);' +
          'display:grid;place-items:center;font-size:.78rem;font-weight:800;color:#aab2dd}',
          '.qp-btn.good{background:#0f5132;border-color:#34d399;color:#fff}',
          '.qp-btn.bad{background:#6b1d2b;border-color:#fb7185;color:#fff}',
          '.qp-btn.dim{opacity:.4}',
          '.qp-fb{min-height:24px;text-align:center;font-weight:800;font-size:1rem}'
        ].join('\n');

        var wrap = document.createElement('div'); wrap.className = 'qp-wrap';

        var top = document.createElement('div'); top.className = 'qp-top';
        var counter = document.createElement('div');
        var tally = document.createElement('div'); tally.textContent = '✓ 0';
        top.appendChild(counter); top.appendChild(tally);

        var track = document.createElement('div'); track.className = 'qp-track';
        var fill = document.createElement('div'); fill.className = 'qp-fill';
        track.appendChild(fill);

        var qText = document.createElement('div'); qText.className = 'qp-q';

        var grid = document.createElement('div'); grid.className = 'qp-grid';
        var btns = [];
        for (var i = 0; i < 4; i++) {
          (function (idx) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'qp-btn';
            var k = document.createElement('span'); k.className = 'k'; k.textContent = String(idx + 1);
            var t = document.createElement('span');
            b.appendChild(k); b.appendChild(t);
            b.addEventListener('click', function () { answer(g, idx); });
            grid.appendChild(b);
            btns.push({ el: b, txt: t });
          })(i);
        }

        var fb = document.createElement('div'); fb.className = 'qp-fb';

        wrap.appendChild(top); wrap.appendChild(track); wrap.appendChild(qText);
        wrap.appendChild(grid); wrap.appendChild(fb);
        root.appendChild(style); root.appendChild(wrap);
        els = { counter: counter, tally: tally, fill: fill, qText: qText, btns: btns, fb: fb };
      }

      function reset(g) {
        var d = g.data;
        d.qs = U.shuffle(meta.bank.slice()).slice(0, PER_RUN);
        d.idx = 0; d.lives = 3; d.streak = 0; d.bestStreak = 0; d.correct = 0;
        build(g);
        ask(g);
        g.set('Score', 0);
        g.set('Streak', 0);
        g.set('Lives', hearts(3));
      }

      function ask(g) {
        var d = g.data, item = d.qs[d.idx];
        var opts = U.shuffle([{ t: item.a, ok: true }, { t: item.d[0] }, { t: item.d[1] }, { t: item.d[2] }]);
        for (var i = 0; i < 4; i++) {
          if (opts[i].ok) d.correctIdx = i;
          els.btns[i].el.className = 'qp-btn';
          els.btns[i].txt.textContent = opts[i].t;
        }
        d.item = item;
        d.timer = QT; d.prevSec = QT; d.low = false;
        d.phase = 'ask';
        els.fill.className = 'qp-fill';
        els.fill.style.width = '100%';
        els.qText.textContent = item.q;
        els.counter.textContent = 'Question ' + (d.idx + 1) + ' of ' + PER_RUN;
        els.tally.textContent = '✓ ' + d.correct;
        els.fb.textContent = '';
      }

      function dimOthers(keepA, keepB) {
        for (var i = 0; i < 4; i++) {
          if (i !== keepA && i !== keepB) els.btns[i].el.className = 'qp-btn dim';
        }
      }

      function answer(g, i) {
        if (g.state !== 'play' || g.data.phase !== 'ask') return;
        grade(g, i);
      }

      function grade(g, pick) {
        var d = g.data;
        if (d.phase !== 'ask') return;
        if (pick === d.correctIdx) {
          d.streak++; d.correct++;
          if (d.streak > d.bestStreak) d.bestStreak = d.streak;
          var timeBonus = Math.round(50 * Math.max(0, d.timer) / QT);
          var streakBonus = Math.min(150, (d.streak - 1) * 25);
          var pts = 100 + timeBonus + streakBonus;
          g.score += pts;
          g.set('Score', U.fmt(g.score));
          g.set('Streak', d.streak);
          els.btns[pick].el.className = 'qp-btn good';
          dimOthers(pick, -1);
          els.fb.textContent = '+' + pts + (streakBonus ? '  ·  streak ×' + d.streak : '');
          els.fb.style.color = '#34d399';
          Milo.sound.coin();
          d.phase = 'reveal'; d.wait = .75;
        } else {
          d.lives--; d.streak = 0;
          g.set('Streak', 0);
          g.set('Lives', hearts(d.lives));
          if (pick >= 0) els.btns[pick].el.className = 'qp-btn bad';
          els.btns[d.correctIdx].el.className = 'qp-btn good';
          dimOthers(d.correctIdx, pick);
          els.fb.textContent = (pick < 0 ? '⏰ Time!  ' : '') + 'Answer: ' + d.item.a;
          els.fb.style.color = '#fb7185';
          Milo.sound.hit();
          d.phase = d.lives <= 0 ? 'end' : 'reveal';
          d.wait = 1.6;
        }
        els.tally.textContent = '✓ ' + d.correct;
      }

      function advance(g) {
        var d = g.data;
        d.idx++;
        if (d.idx >= PER_RUN) {
          g.win({
            score: g.score, emo: '🎊', title: 'Quiz complete!',
            text: d.correct + ' of ' + PER_RUN + ' correct · best streak ' + d.bestStreak + '.'
          });
          confetti(g);
        } else ask(g);
      }

      function confetti(g) {
        var layer = document.createElement('div');
        layer.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:20';
        var st = document.createElement('style');
        st.textContent = '@keyframes qp1fall{0%{transform:translateY(-30px) rotate(0deg);opacity:1}' +
          '100%{transform:translateY(110vh) rotate(660deg);opacity:.65}}';
        layer.appendChild(st);
        var palette = [c0, c1, '#fbbf24', '#34d399', '#fb7185', '#60a5fa', '#f9fafb'];
        for (var i = 0; i < 90; i++) {
          var p = document.createElement('div');
          var s = 6 + ((Math.random() * 7) | 0);
          p.style.cssText = 'position:absolute;top:-24px;left:' + (Math.random() * 100).toFixed(1) + '%;' +
            'width:' + s + 'px;height:' + Math.max(4, (s * .62) | 0) + 'px;border-radius:2px;' +
            'background:' + palette[(Math.random() * palette.length) | 0] + ';' +
            'animation:qp1fall ' + (1.7 + Math.random() * 1.6).toFixed(2) + 's linear ' +
            (Math.random() * .9).toFixed(2) + 's both';
          layer.appendChild(p);
        }
        g.hud.appendChild(layer);
        setTimeout(function () { if (layer.parentNode) layer.parentNode.removeChild(layer); }, 4500);
      }

      return Milo.domGame(host, {
        id: meta.id,
        bg: '#0f1330',
        stats: ['Score', 'Streak', 'Lives'],
        emo: meta.emo,
        start: {
          title: meta.title,
          text: PER_RUN + ' questions, ' + QT + ' seconds each. +100 per correct answer, plus up to +50 ' +
            'for speed and a streak bonus that grows with every consecutive hit. Three wrong answers ' +
            'ends the run — every miss flashes the right answer first.',
          keys: ['1–4', 'Click']
        },
        init: reset,
        update: function (g, dt) {
          var d = g.data;
          if (d.phase === 'ask') {
            d.timer -= dt;
            els.fill.style.width = (Math.max(0, d.timer / QT) * 100) + '%';
            if (d.timer < 4 && !d.low) { d.low = true; els.fill.className = 'qp-fill low'; }
            var sec = Math.ceil(Math.max(0, d.timer));
            if (sec !== d.prevSec) {
              d.prevSec = sec;
              if (sec <= 3 && sec > 0) Milo.sound.tone({ f: 740, d: .05, v: .05, type: 'square' });
            }
            if (d.timer <= 0) grade(g, -1);
          } else if (d.phase === 'reveal' || d.phase === 'end') {
            d.wait -= dt;
            if (d.wait <= 0) {
              if (d.phase === 'end') {
                g.gameOver({
                  text: 'Question ' + (d.idx + 1) + ' of ' + PER_RUN + ' stopped you · ' +
                    d.correct + ' correct · best streak ' + d.bestStreak + '.'
                });
              } else advance(g);
            }
          }
        },
        onKey: function (g, e) {
          var i = {
            Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3,
            Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3
          }[e.code];
          if (i != null) answer(g, i);
        }
      });
    }

    window.Milo.register({
      id: meta.id, title: meta.title, emo: meta.emo, category: 'Trivia',
      tagline: meta.tagline, description: meta.desc,
      controls: ['1–4', 'Click'],
      colors: meta.colors, tags: meta.tags, mount: mount
    });
  }

  /* ==================================================================== */
  /* Question banks — every question a well-established, verifiable fact. */
  /* ==================================================================== */

  makeQuiz({
    id: 'quiz-general-1', title: 'General Knowledge Vol. 1', emo: '🧠',
    tagline: 'Capitals, continents and 88 piano keys',
    desc: 'Twelve questions a run from a wide bank: world capitals and giant countries, leap years ' +
      'and hexagons, Everest, the Nile and which instrument has 88 keys. Answer fast — +100 per ' +
      'correct plus a speed bonus, and unbroken streaks pile a growing bonus on top. Every miss ' +
      'flashes the right answer, so the next run goes better.',
    colors: ['#6366f1', '#22d3ee'],
    tags: ['trivia', 'quiz', 'general', 'facts'],
    bank: [
      Q('What is the capital of France?', 'Paris', 'London', 'Rome', 'Madrid'),
      Q('How many continents are there on Earth?', '7', '5', '6', '8'),
      Q('Which is the largest ocean?', 'The Pacific', 'The Atlantic', 'The Indian', 'The Arctic'),
      Q('How many days are in a leap year?', '366', '365', '364', '367'),
      Q('What is the currency of Japan?', 'The yen', 'The won', 'The yuan', 'The ringgit'),
      Q('How many sides does a hexagon have?', '6', '5', '7', '8'),
      Q('Which language has the most native speakers in the world?', 'Mandarin Chinese', 'English', 'Spanish', 'Hindi'),
      Q('What is the tallest mountain above sea level?', 'Mount Everest', 'K2', 'Kilimanjaro', 'Denali'),
      Q('Who wrote the play Romeo and Juliet?', 'William Shakespeare', 'Charles Dickens', 'Jane Austen', 'Mark Twain'),
      Q('How many strings does a standard violin have?', '4', '5', '6', '7'),
      Q('What do bees collect from flowers to make honey?', 'Nectar', 'Pollen only', 'Dew', 'Sap'),
      Q('How many minutes are in a full day?', '1,440', '1,240', '1,360', '1,540'),
      Q('Which is the largest country in the world by area?', 'Russia', 'Canada', 'China', 'The United States'),
      Q('Which instrument has 88 keys?', 'The piano', 'The organ', 'The accordion', 'The harpsichord'),
      Q('What is H2O better known as?', 'Water', 'Table salt', 'Hydrogen peroxide', 'Ozone'),
      Q('The Great Barrier Reef lies off the coast of which country?', 'Australia', 'Brazil', 'South Africa', 'Mexico'),
      Q('How many players does a soccer team have on the field?', '11', '9', '10', '12'),
      Q('What is the longest river in Africa?', 'The Nile', 'The Congo', 'The Zambezi', 'The Niger'),
      Q('Which fruit is dried to make raisins?', 'Grapes', 'Plums', 'Apricots', 'Figs')
    ]
  });

  makeQuiz({
    id: 'quiz-general-2', title: 'General Knowledge Vol. 2', emo: '🌍',
    tagline: 'From the Vatican to the Big Apple',
    desc: 'A second helping of everyday knowledge: the smallest country in the world, the painter of ' +
      'the Mona Lisa, the Leaning Tower, Wimbledon and what a group of lions is called. Same rules ' +
      '— 15 seconds a question, and streaks are where the big points live. The bank is bigger than ' +
      'one run, so replays keep surprising you.',
    colors: ['#f97316', '#ef4444'],
    tags: ['trivia', 'quiz', 'general', 'facts'],
    bank: [
      Q('What is the capital of Japan?', 'Tokyo', 'Kyoto', 'Osaka', 'Seoul'),
      Q('How many colours are in a rainbow, traditionally?', '7', '5', '6', '8'),
      Q('Which metal is liquid at room temperature?', 'Mercury', 'Iron', 'Aluminium', 'Silver'),
      Q('The Leaning Tower is in which Italian city?', 'Pisa', 'Rome', 'Venice', 'Florence'),
      Q('What is the smallest country in the world?', 'Vatican City', 'Monaco', 'Malta', 'San Marino'),
      Q('In which city is the Eiffel Tower?', 'Paris', 'London', 'Berlin', 'Brussels'),
      Q('The Statue of Liberty was a gift to the USA from which country?', 'France', 'England', 'Spain', 'Italy'),
      Q('What is the hardest natural substance?', 'Diamond', 'Gold', 'Iron', 'Quartz'),
      Q('Pizza originally comes from which country?', 'Italy', 'France', 'Greece', 'Spain'),
      Q('How many weeks are in a year?', '52', '48', '50', '54'),
      Q('What is the capital of Canada?', 'Ottawa', 'Toronto', 'Vancouver', 'Montreal'),
      Q('Who painted the Mona Lisa?', 'Leonardo da Vinci', 'Michelangelo', 'Raphael', 'Vincent van Gogh'),
      Q('What is the largest hot desert in the world?', 'The Sahara', 'The Gobi', 'The Kalahari', 'The Mojave'),
      Q('What is a group of lions called?', 'A pride', 'A pack', 'A herd', 'A flock'),
      Q('Which sport is played at Wimbledon?', 'Tennis', 'Golf', 'Cricket', 'Rugby'),
      Q('How many zeros are in one million?', '6', '5', '7', '8'),
      Q('Which composer wrote the Ninth Symphony with its "Ode to Joy"?', 'Beethoven', 'Mozart', 'Bach', 'Haydn'),
      Q('What is the currency of the United Kingdom?', 'The pound sterling', 'The euro', 'The dollar', 'The franc'),
      Q('Which city is nicknamed the Big Apple?', 'New York City', 'Chicago', 'Los Angeles', 'Boston')
    ]
  });

  makeQuiz({
    id: 'quiz-science', title: 'Science Quiz', emo: '🔬',
    tagline: 'Boiling points and simple machines',
    desc: 'Everyday science without the jargon: boiling and freezing points, the gas that fills our ' +
      'atmosphere, levers and seesaws, kinetic energy and which materials sound travels fastest ' +
      'through. +100 per correct with up to +50 for speed, and a streak bonus that grows every ' +
      'consecutive hit. Miss one and the right answer flashes up before the next question.',
    colors: ['#22d3ee', '#34d399'],
    tags: ['trivia', 'quiz', 'science', 'facts'],
    bank: [
      Q('Which gas do plants absorb for photosynthesis?', 'Carbon dioxide', 'Oxygen', 'Nitrogen', 'Hydrogen'),
      Q('What force pulls objects toward the centre of the Earth?', 'Gravity', 'Magnetism', 'Friction', 'Inertia'),
      Q('At what temperature does water boil at sea level?', '100°C', '90°C', '110°C', '120°C'),
      Q('Which state of matter has a fixed volume but no fixed shape?', 'Liquid', 'Solid', 'Gas', 'Plasma'),
      Q('What is the dense centre of an atom called?', 'The nucleus', 'The electron', 'The molecule', 'The ion'),
      Q('Roughly how fast does light travel?', '300,000 km per second', '150,000 km per second', '500,000 km per second', '1 million km per second'),
      Q('Which instrument measures temperature?', 'A thermometer', 'A barometer', 'A hygrometer', 'An anemometer'),
      Q('Which gas makes up most of Earth\'s atmosphere?', 'Nitrogen', 'Oxygen', 'Carbon dioxide', 'Argon'),
      Q('Which molecule carries genetic instructions in living things?', 'DNA', 'ATP', 'Glucose', 'Hemoglobin'),
      Q('A seesaw is an example of which simple machine?', 'A lever', 'A pulley', 'A wedge', 'A screw'),
      Q('Who set out the three famous laws of motion?', 'Isaac Newton', 'Albert Einstein', 'Galileo Galilei', 'Johannes Kepler'),
      Q('What kind of energy does a moving object have?', 'Kinetic energy', 'Potential energy', 'Thermal energy', 'Chemical energy'),
      Q('Sound travels fastest through which of these?', 'Solids', 'Liquids', 'Gases', 'A vacuum'),
      Q('What do we call animals that eat only plants?', 'Herbivores', 'Carnivores', 'Omnivores', 'Insectivores'),
      Q('At what temperature does water freeze?', '0°C', '-10°C', '10°C', '32°C'),
      Q('Which colour of visible light has the longest wavelength?', 'Red', 'Blue', 'Green', 'Violet'),
      Q('What is it called when liquid water turns into vapour?', 'Evaporation', 'Condensation', 'Precipitation', 'Sublimation'),
      Q('What do two like magnetic poles do to each other?', 'Repel', 'Attract', 'Cancel out', 'Merge'),
      Q('Which unit measures electric current?', 'The ampere', 'The volt', 'The watt', 'The ohm')
    ]
  });

  makeQuiz({
    id: 'quiz-space', title: 'Space Quiz', emo: '🚀',
    tagline: 'Eight planets, one 15-second clock',
    desc: 'From the Red Planet to the edge of the solar system: ringed Saturn, scorching Venus, the ' +
      'Great Red Spot, Apollo 11 and the first human in space. Twelve questions against a ' +
      '15-second bar, with speed and streak bonuses stacking on the base +100. Lose all three ' +
      'lives and the run ends on the spot.',
    colors: ['#312e81', '#a78bfa'],
    tags: ['trivia', 'quiz', 'space', 'astronomy', 'planets'],
    bank: [
      Q('Which planet is known as the Red Planet?', 'Mars', 'Venus', 'Jupiter', 'Mercury'),
      Q('What is the largest planet in our solar system?', 'Jupiter', 'Saturn', 'Neptune', 'Earth'),
      Q('Which planet is closest to the Sun?', 'Mercury', 'Venus', 'Mars', 'Earth'),
      Q('Who was the first human to walk on the Moon?', 'Neil Armstrong', 'Buzz Aldrin', 'Yuri Gagarin', 'John Glenn'),
      Q('What kind of object is the Sun?', 'A star', 'A planet', 'A comet', 'A galaxy'),
      Q('Which planet is famous for its spectacular rings?', 'Saturn', 'Mars', 'Venus', 'Mercury'),
      Q('What is the name of our galaxy?', 'The Milky Way', 'Andromeda', 'The Whirlpool', 'The Sombrero'),
      Q('Who was the first person in space?', 'Yuri Gagarin', 'Neil Armstrong', 'Alan Shepard', 'John Glenn'),
      Q('How long does Earth take to orbit the Sun once?', 'About 365 days', 'About 30 days', 'About 24 hours', 'About 100 days'),
      Q('Which planet has the hottest surface in the solar system?', 'Venus', 'Mercury', 'Mars', 'Jupiter'),
      Q('What is Earth\'s only natural satellite?', 'The Moon', 'Titan', 'Phobos', 'Europa'),
      Q('How many planets are in our solar system?', '8', '7', '9', '10'),
      Q('What causes day and night on Earth?', 'Earth spinning on its axis', 'Earth orbiting the Sun', 'The Moon\'s shadow', 'Solar flares'),
      Q('Which planet has the Great Red Spot, a giant storm?', 'Jupiter', 'Mars', 'Saturn', 'Neptune'),
      Q('The path a planet takes around the Sun is called its what?', 'Orbit', 'Axis', 'Eclipse', 'Rotation'),
      Q('Which planet is farthest from the Sun?', 'Neptune', 'Uranus', 'Pluto', 'Saturn'),
      Q('What is a "shooting star" actually?', 'A meteor burning up', 'A comet', 'A dying star', 'A satellite'),
      Q('Which 1969 mission first landed people on the Moon?', 'Apollo 11', 'Apollo 13', 'Gemini 4', 'Voyager 1'),
      Q('In a solar eclipse, what blocks the Sun from view?', 'The Moon', 'The Earth', 'Venus', 'Clouds')
    ]
  });

  makeQuiz({
    id: 'quiz-human-body', title: 'Human Body Quiz', emo: '🦴',
    tagline: '206 bones, 3 lives',
    desc: 'How well do you know your own machine? Heart chambers, the 206 bones, the tiny one in ' +
      'your ear, what the pancreas makes and which blood type can give to everyone. Quick answers ' +
      'score up to +150 before the streak bonus even starts. Three wrong answers and the run ' +
      'flatlines.',
    colors: ['#fb7185', '#fbbf24'],
    tags: ['trivia', 'quiz', 'body', 'anatomy', 'health'],
    bank: [
      Q('How many chambers does the human heart have?', '4', '2', '3', '6'),
      Q('What is the largest organ of the human body?', 'The skin', 'The liver', 'The brain', 'The lungs'),
      Q('How many bones are in an adult human body?', '206', '106', '306', '250'),
      Q('Which organ pumps blood around the body?', 'The heart', 'The liver', 'The lungs', 'The kidneys'),
      Q('What carries oxygen around in your blood?', 'Red blood cells', 'White blood cells', 'Platelets', 'Plasma'),
      Q('Where is the smallest bone in the human body?', 'In the ear', 'In the toe', 'In the finger', 'In the nose'),
      Q('Which organs filter waste from the blood to make urine?', 'The kidneys', 'The liver', 'The stomach', 'The lungs'),
      Q('Which bone protects the brain?', 'The skull', 'The ribs', 'The spine', 'The pelvis'),
      Q('How many teeth are in a full adult set, wisdom teeth included?', '32', '28', '30', '34'),
      Q('Which sense organ also helps you keep your balance?', 'The ear', 'The eye', 'The nose', 'The tongue'),
      Q('Which nutrient is the body\'s main quick energy source?', 'Carbohydrates', 'Proteins', 'Vitamins', 'Minerals'),
      Q('Which dome-shaped muscle below the lungs helps you breathe?', 'The diaphragm', 'The biceps', 'The trapezius', 'The Achilles'),
      Q('What is the main job of white blood cells?', 'Fighting infection', 'Carrying oxygen', 'Clotting blood', 'Digesting food'),
      Q('What is the hardest substance in the human body?', 'Tooth enamel', 'Bone', 'Cartilage', 'Fingernail'),
      Q('Where are most nutrients from food absorbed?', 'The small intestine', 'The stomach', 'The large intestine', 'The esophagus'),
      Q('What is the medical name for the windpipe?', 'The trachea', 'The esophagus', 'The larynx', 'The aorta'),
      Q('What is normal human body temperature?', 'About 37°C', 'About 33°C', 'About 40°C', 'About 42°C'),
      Q('Which organ produces insulin?', 'The pancreas', 'The liver', 'The kidney', 'The spleen'),
      Q('What are the individual bones of the spine called?', 'Vertebrae', 'Ribs', 'Femurs', 'Tarsals'),
      Q('Which blood type is the universal donor?', 'O negative', 'AB positive', 'A positive', 'B negative')
    ]
  });

  makeQuiz({
    id: 'quiz-animals', title: 'Animal Quiz', emo: '🦁',
    tagline: 'Fastest, tallest, and 22-month pregnancies',
    desc: 'Cheetahs, joeys, Bactrian camels and the only mammal that truly flies. The bank roams ' +
      'from record holders — tallest, fastest, biggest cat — to group names and the elephant\'s ' +
      '22-month pregnancy. Keep a streak alive for the growing bonus; a single miss resets it ' +
      'and costs a life.',
    colors: ['#84cc16', '#f59e0b'],
    tags: ['trivia', 'quiz', 'animals', 'nature'],
    bank: [
      Q('What is the fastest land animal?', 'The cheetah', 'The lion', 'The greyhound', 'The pronghorn'),
      Q('What is the largest land animal?', 'The African elephant', 'The giraffe', 'The hippopotamus', 'The white rhino'),
      Q('Which is the only mammal capable of true flight?', 'The bat', 'The flying squirrel', 'The sugar glider', 'The colugo'),
      Q('What is a baby kangaroo called?', 'A joey', 'A cub', 'A calf', 'A kit'),
      Q('What is the tallest animal in the world?', 'The giraffe', 'The elephant', 'The ostrich', 'The camel'),
      Q('How many legs does a spider have?', '8', '6', '10', '12'),
      Q('What do giant pandas mainly eat?', 'Bamboo', 'Fish', 'Meat', 'Eucalyptus'),
      Q('Which of these birds cannot fly?', 'The penguin', 'The eagle', 'The swan', 'The owl'),
      Q('Which animal is nicknamed the King of the Jungle?', 'The lion', 'The tiger', 'The gorilla', 'The elephant'),
      Q('What is a group of wolves called?', 'A pack', 'A pride', 'A herd', 'A school'),
      Q('A zebra\'s stripe pattern is unique, like a human\'s what?', 'Fingerprints', 'Eye colour', 'Blood type', 'Voice'),
      Q('How many humps does a Bactrian camel have?', '2', '1', '3', '4'),
      Q('Which animal is famous for changing colour to blend in?', 'The chameleon', 'The iguana', 'The gecko', 'The salamander'),
      Q('What is the largest big cat?', 'The tiger', 'The lion', 'The leopard', 'The jaguar'),
      Q('What is the largest primate?', 'The gorilla', 'The orangutan', 'The chimpanzee', 'The baboon'),
      Q('What is a female deer called?', 'A doe', 'A fawn', 'A mare', 'A ewe'),
      Q('What is the deep winter sleep of some animals called?', 'Hibernation', 'Migration', 'Camouflage', 'Metamorphosis'),
      Q('What do we call animals that are active at night?', 'Nocturnal', 'Diurnal', 'Dormant', 'Migratory'),
      Q('About how long is an elephant\'s pregnancy?', '22 months', '9 months', '12 months', '5 months'),
      Q('Which animal is famous for building dams in rivers?', 'The beaver', 'The otter', 'The muskrat', 'The badger')
    ]
  });

  makeQuiz({
    id: 'quiz-ocean-life', title: 'Ocean Life Quiz', emo: '🐙',
    tagline: 'Three hearts, eight arms, twelve questions',
    desc: 'Dive in with blue whales, three-hearted octopuses, cartilage-boned sharks and seahorse ' +
      'dads who carry the young. Expect schools, pods, the Mariana Trench and the biggest fish ' +
      'in the sea. Twelve questions, 15 seconds each, three lives between you and the surface.',
    colors: ['#0ea5e9', '#155e75'],
    tags: ['trivia', 'quiz', 'ocean', 'sea', 'nature'],
    bank: [
      Q('What is the largest animal ever known to have lived?', 'The blue whale', 'The great white shark', 'The colossal squid', 'The orca'),
      Q('How many arms does an octopus have?', '8', '6', '10', '12'),
      Q('How many hearts does an octopus have?', '3', '1', '2', '4'),
      Q('What is a shark\'s skeleton made of?', 'Cartilage', 'Bone', 'Chitin', 'Keratin'),
      Q('In which fish does the male carry the developing young?', 'The seahorse', 'The clownfish', 'The salmon', 'The angelfish'),
      Q('What is the largest fish in the sea?', 'The whale shark', 'The blue whale', 'The great white shark', 'The giant manta ray'),
      Q('Coral is built by what kind of living thing?', 'Tiny animals', 'Plants', 'Fungi', 'Minerals'),
      Q('Which ocean contains the deepest point on Earth?', 'The Pacific', 'The Atlantic', 'The Indian', 'The Arctic'),
      Q('What is the deepest known place in the ocean called?', 'The Mariana Trench', 'The Puerto Rico Trench', 'The Java Trench', 'The Mid-Atlantic Ridge'),
      Q('What do dolphins use to locate prey in murky water?', 'Echolocation', 'Smell', 'Electric fields', 'Heat vision'),
      Q('What is a group of fish called?', 'A school', 'A flock', 'A troop', 'A herd'),
      Q('What is a group of whales called?', 'A pod', 'A school', 'A colony', 'A pack'),
      Q('Why do sea turtles come ashore onto beaches?', 'To lay eggs', 'To hunt crabs', 'To shed their shells', 'To sleep'),
      Q('Which sea creature has stinging tentacles but no brain?', 'The jellyfish', 'The starfish', 'The sea cucumber', 'The crab'),
      Q('How many legs does a crab have?', '10', '6', '8', '12'),
      Q('How many arms does a common starfish have?', '5', '4', '6', '8'),
      Q('Clownfish famously live among which sea creatures?', 'Sea anemones', 'Kelp forests', 'Sea urchins', 'Sponges'),
      Q('What is the largest member of the dolphin family?', 'The orca (killer whale)', 'The bottlenose dolphin', 'The spinner dolphin', 'The porpoise'),
      Q('What are baby fish called?', 'Fry', 'Pups', 'Chicks', 'Kits'),
      Q('Which gas do fish take from the water using their gills?', 'Oxygen', 'Carbon dioxide', 'Nitrogen', 'Hydrogen')
    ]
  });

  makeQuiz({
    id: 'quiz-dinosaurs', title: 'Dinosaur Quiz', emo: '🦖',
    tagline: 'Sixty-six million years of questions',
    desc: 'T. rex and its tiny arms, Triceratops horns, the turkey-sized truth about Velociraptor ' +
      'and the asteroid that ended the Mesozoic. Fast answers earn a time bonus and streaks keep ' +
      'growing in value. Survive all twelve questions to trigger the confetti.',
    colors: ['#65a30d', '#78350f'],
    tags: ['trivia', 'quiz', 'dinosaurs', 'prehistory'],
    bank: [
      Q('What does the word "dinosaur" mean?', 'Terrible lizard', 'Giant reptile', 'Ancient beast', 'Thunder foot'),
      Q('Which dinosaur had huge jaws and famously tiny arms?', 'Tyrannosaurus rex', 'Triceratops', 'Stegosaurus', 'Brachiosaurus'),
      Q('How many horns did Triceratops have on its face?', '3', '1', '2', '4'),
      Q('Which dinosaur had bony back plates and a spiked tail?', 'Stegosaurus', 'Ankylosaurus', 'Diplodocus', 'Velociraptor'),
      Q('What most likely wiped out the dinosaurs?', 'A giant asteroid impact', 'A worldwide flood', 'A plague', 'Hunting by early humans'),
      Q('About how long ago did the dinosaurs die out?', '66 million years', '6,500 years', '1 million years', '600 million years'),
      Q('Which era is called the Age of Dinosaurs?', 'The Mesozoic', 'The Paleozoic', 'The Cenozoic', 'The Precambrian'),
      Q('Which of these was a long-necked plant eater?', 'Brachiosaurus', 'Velociraptor', 'Tyrannosaurus rex', 'Ankylosaurus'),
      Q('Which living animals are descended from dinosaurs?', 'Birds', 'Lizards', 'Crocodiles', 'Turtles'),
      Q('How do scientists know dinosaurs existed?', 'From fossils', 'From cave paintings', 'From ancient books', 'From photographs'),
      Q('What is a scientist who studies fossils called?', 'A paleontologist', 'An archaeologist', 'A geologist', 'A meteorologist'),
      Q('About how big was a real Velociraptor?', 'The size of a turkey', 'As big as a bus', 'Elephant-sized', 'House-sized'),
      Q('Which flying reptiles soared during the age of dinosaurs?', 'Pterosaurs', 'Bats', 'Flying squirrels', 'Giant dragonflies'),
      Q('Which armoured dinosaur swung a bony club on its tail?', 'Ankylosaurus', 'Stegosaurus', 'Triceratops', 'Iguanodon'),
      Q('What did Tyrannosaurus rex eat?', 'Meat', 'Plants', 'Only fish', 'Insects'),
      Q('Where have the best Tyrannosaurus rex fossils been found?', 'North America', 'Australia', 'Antarctica', 'Africa'),
      Q('The Mesozoic era: Triassic, Jurassic and which third period?', 'Cretaceous', 'Permian', 'Devonian', 'Cambrian'),
      Q('Which dinosaur\'s name means "three-horned face"?', 'Triceratops', 'Stegosaurus', 'Diplodocus', 'Allosaurus'),
      Q('Fossils show some dinosaurs were covered in what?', 'Feathers', 'Thick fur', 'Smooth skin like frogs', 'Shells'),
      Q('Diplodocus was famous for its extremely long what?', 'Neck and tail', 'Horns', 'Wings', 'Claws')
    ]
  });

  makeQuiz({
    id: 'quiz-inventions', title: 'Inventions Quiz', emo: '💡',
    tagline: 'Who really invented that?',
    desc: 'Who gets the credit for the telephone, the light bulb, the ballpoint pen — and Velcro\'s ' +
      'burr-covered origin story? A run visits printing presses, powered flight, penicillin and ' +
      'the wheel itself. Answer before the 15-second bar drains: speed is worth up to 50 extra ' +
      'points a question.',
    colors: ['#fbbf24', '#f97316'],
    tags: ['trivia', 'quiz', 'inventions', 'history'],
    bank: [
      Q('Who is credited with inventing the telephone?', 'Alexander Graham Bell', 'Thomas Edison', 'Nikola Tesla', 'Guglielmo Marconi'),
      Q('Who is credited with the first practical light bulb?', 'Thomas Edison', 'Alexander Graham Bell', 'Benjamin Franklin', 'Isaac Newton'),
      Q('Who introduced the movable-type printing press to Europe?', 'Johannes Gutenberg', 'William Caxton', 'Benjamin Franklin', 'Leonardo da Vinci'),
      Q('Who invented the World Wide Web?', 'Tim Berners-Lee', 'Bill Gates', 'Steve Jobs', 'Alan Turing'),
      Q('The Wright brothers are famous for what achievement?', 'The first powered airplane flight', 'The first car', 'The telegraph', 'The steamboat'),
      Q('Who developed the first successful polio vaccine?', 'Jonas Salk', 'Louis Pasteur', 'Alexander Fleming', 'Edward Jenner'),
      Q('What did Alexander Fleming discover in 1928?', 'Penicillin', 'Aspirin', 'Insulin', 'X-rays'),
      Q('Who invented dynamite?', 'Alfred Nobel', 'Albert Einstein', 'Michael Faraday', 'James Watt'),
      Q('What did Karl Benz build in 1886?', 'An early gasoline-powered car', 'The first airplane', 'The first bicycle', 'The first train'),
      Q('Paper was first invented in which country?', 'China', 'Egypt', 'Greece', 'India'),
      Q('Who created the telegraph code of dots and dashes?', 'Samuel Morse', 'Alexander Graham Bell', 'Thomas Edison', 'Guglielmo Marconi'),
      Q('Galileo improved which instrument to study the night sky?', 'The telescope', 'The microscope', 'The compass', 'The barometer'),
      Q('What did John Logie Baird first demonstrate in 1926?', 'Television', 'Radio', 'The telephone', 'Cinema film'),
      Q('What did Willis Carrier invent in 1902?', 'Air conditioning', 'The refrigerator', 'The elevator', 'The toaster'),
      Q('Whose moving assembly line made the Model T affordable?', 'Henry Ford', 'Karl Benz', 'Rudolf Diesel', 'Walter Chrysler'),
      Q('What clothing did Levi Strauss make famous?', 'Blue jeans', 'Sneakers', 'T-shirts', 'Top hats'),
      Q('What inspired George de Mestral to invent Velcro?', 'Burrs stuck to his dog', 'Spider webs', 'Snail shells', 'Bird feathers'),
      Q('What did László Bíró invent?', 'The ballpoint pen', 'The typewriter', 'The pencil', 'The stapler'),
      Q('Who pioneered vaccination with his smallpox vaccine?', 'Edward Jenner', 'Louis Pasteur', 'Jonas Salk', 'Joseph Lister'),
      Q('The earliest known wheels come from which region?', 'Mesopotamia', 'Scandinavia', 'Japan', 'Peru')
    ]
  });

  makeQuiz({
    id: 'quiz-world-history', title: 'World History Quiz', emo: '📜',
    tagline: 'From 1492 to the Berlin Wall',
    desc: 'March through 1492, 1789, 1912 and 1989 alongside Genghis Khan, Queen Victoria and the ' +
      'Mayflower. Dates, empires and famous firsts, twelve at a time from a deep bank. Streaks ' +
      'build a growing bonus, but every wrong answer burns one of three lives.',
    colors: ['#b45309', '#57534e'],
    tags: ['trivia', 'quiz', 'history', 'world'],
    bank: [
      Q('Who was the first President of the United States?', 'George Washington', 'Thomas Jefferson', 'Abraham Lincoln', 'John Adams'),
      Q('In which year did World War II end?', '1945', '1939', '1942', '1950'),
      Q('The Great Wall was built to protect which country?', 'China', 'India', 'Japan', 'Korea'),
      Q('Who sailed across the Atlantic and reached the Americas in 1492?', 'Christopher Columbus', 'Ferdinand Magellan', 'James Cook', 'Amerigo Vespucci'),
      Q('The pyramids of Giza stand in which country?', 'Egypt', 'Mexico', 'Iraq', 'Sudan'),
      Q('Which British queen reigned for most of the 1800s?', 'Queen Victoria', 'Elizabeth I', 'Mary I', 'Queen Anne'),
      Q('In which year did the Titanic sink?', '1912', '1905', '1920', '1931'),
      Q('Which civilisation built Machu Picchu?', 'The Inca', 'The Maya', 'The Aztec', 'The Olmec'),
      Q('Who led the Soviet Union during World War II?', 'Joseph Stalin', 'Vladimir Lenin', 'Nikita Khrushchev', 'Leon Trotsky'),
      Q('The French Revolution began in which year?', '1789', '1776', '1804', '1848'),
      Q('Who was the main author of the US Declaration of Independence?', 'Thomas Jefferson', 'George Washington', 'Benjamin Franklin', 'Alexander Hamilton'),
      Q('In which year did the Berlin Wall come down?', '1989', '1975', '1985', '1995'),
      Q('Which Roman city was buried by Mount Vesuvius in AD 79?', 'Pompeii', 'Athens', 'Troy', 'Carthage'),
      Q('Genghis Khan founded which empire?', 'The Mongol Empire', 'The Ottoman Empire', 'The Persian Empire', 'The Roman Empire'),
      Q('The Hundred Years\' War was fought mainly between which countries?', 'England and France', 'Spain and Portugal', 'France and Germany', 'England and Spain'),
      Q('Whose expedition was the first to sail all the way around the world?', 'Ferdinand Magellan\'s', 'Christopher Columbus\'s', 'Francis Drake\'s', 'James Cook\'s'),
      Q('The Industrial Revolution began in which country?', 'Britain', 'France', 'Germany', 'The United States'),
      Q('On which ship did the Pilgrims sail to America in 1620?', 'The Mayflower', 'The Santa Maria', 'The Endeavour', 'The Beagle'),
      Q('Which US president delivered the Gettysburg Address?', 'Abraham Lincoln', 'Ulysses S. Grant', 'George Washington', 'Theodore Roosevelt'),
      Q('World War I began in which year?', '1914', '1905', '1918', '1920'),
      Q('Nelson Mandela became president of which country in 1994?', 'South Africa', 'Kenya', 'Nigeria', 'Ghana')
    ]
  });

  makeQuiz({
    id: 'quiz-ancient-egypt', title: 'Ancient Egypt Quiz', emo: '🐪',
    tagline: 'Pharaohs, mummies and one mighty river',
    desc: 'Pharaohs, pyramids and the river that made it all possible. Meet Khufu, Tutankhamun, ' +
      'jackal-headed Anubis, the Rosetta Stone and the feather your heart was weighed against. ' +
      'Fifteen seconds per question — the sands run quickly.',
    colors: ['#eab308', '#a16207'],
    tags: ['trivia', 'quiz', 'egypt', 'history', 'ancient'],
    bank: [
      Q('Which river was the lifeline of ancient Egypt?', 'The Nile', 'The Tigris', 'The Euphrates', 'The Jordan'),
      Q('What were the kings of ancient Egypt called?', 'Pharaohs', 'Emperors', 'Sultans', 'Caesars'),
      Q('The Great Pyramid of Giza was built for which pharaoh?', 'Khufu', 'Tutankhamun', 'Ramses II', 'Cleopatra'),
      Q('The Great Sphinx has a lion\'s body and the head of a what?', 'A human', 'An eagle', 'A crocodile', 'A ram'),
      Q('What was the ancient Egyptian picture-writing system called?', 'Hieroglyphics', 'Cuneiform', 'The Latin alphabet', 'Sanskrit'),
      Q('Why did Egyptians mummify their dead?', 'To preserve the body for the afterlife', 'To scare enemies', 'To honour the Nile', 'To save space in tombs'),
      Q('Which boy king\'s tomb was discovered nearly intact in 1922?', 'Tutankhamun', 'Khufu', 'Akhenaten', 'Thutmose III'),
      Q('Who discovered Tutankhamun\'s tomb?', 'Howard Carter', 'Heinrich Schliemann', 'Jean-François Champollion', 'Flinders Petrie'),
      Q('What did the Rosetta Stone help scholars do?', 'Decode hieroglyphics', 'Find hidden tombs', 'Date the pyramids', 'Map the Nile'),
      Q('Egyptians made a paper-like material from which plant?', 'Papyrus reeds', 'Bamboo', 'Cotton', 'Palm leaves'),
      Q('Which sun god was among the most important Egyptian deities?', 'Ra', 'Anubis', 'Osiris', 'Sobek'),
      Q('Which jackal-headed god watched over the dead?', 'Anubis', 'Ra', 'Thoth', 'Horus'),
      Q('How were cats regarded in ancient Egypt?', 'As sacred animals', 'As pests', 'As food', 'They were unknown there'),
      Q('What did Egyptians store in canopic jars?', 'Organs removed during mummification', 'Jewels', 'Grain', 'Perfume'),
      Q('After Cleopatra, Egypt fell under the rule of which power?', 'Rome', 'Greece', 'Persia', 'Babylon'),
      Q('The pyramids of Giza stand near which modern city?', 'Cairo', 'Alexandria', 'Luxor', 'Aswan'),
      Q('In Egyptian belief, the heart was weighed against a what?', 'A feather', 'A stone', 'A gold coin', 'A scarab'),
      Q('Which beetle was a sacred Egyptian symbol of rebirth?', 'The scarab', 'The locust', 'The bee', 'The ant'),
      Q('What was the Valley of the Kings used for?', 'Royal tombs', 'Markets', 'Farming', 'Chariot races'),
      Q('The Nile flows into which sea?', 'The Mediterranean', 'The Red Sea', 'The Black Sea', 'The Arabian Sea')
    ]
  });

  makeQuiz({
    id: 'quiz-ancient-rome', title: 'Ancient Rome Quiz', emo: '🏛️',
    tagline: 'Gladiators, gods and the Ides of March',
    desc: 'Gladiators in the Colosseum, elephants over the Alps, aqueducts, togas and the Ides of ' +
      'March. The bank covers gods, emperors, legions and what X means in Roman numerals. Chain ' +
      'correct answers for a bonus worthy of a triumph.',
    colors: ['#dc2626', '#7f1d1d'],
    tags: ['trivia', 'quiz', 'rome', 'history', 'ancient'],
    bank: [
      Q('Which legendary twins are said to have founded Rome?', 'Romulus and Remus', 'Castor and Pollux', 'Antony and Octavian', 'Caesar and Brutus'),
      Q('What language did the ancient Romans speak?', 'Latin', 'Greek', 'Italian', 'Hebrew'),
      Q('What contests was the Colosseum most famous for?', 'Gladiator fights', 'Senate debates', 'Poetry readings', 'Horse auctions'),
      Q('Julius Caesar was assassinated on which date?', 'The Ides of March (15 March)', '1 January', '4 July', '31 October'),
      Q('Roman soldiers were organised into large units called what?', 'Legions', 'Phalanxes', 'Regiments', 'Squadrons'),
      Q('Who was the first Roman emperor?', 'Augustus', 'Julius Caesar', 'Nero', 'Caligula'),
      Q('Who was the Roman god of war?', 'Mars', 'Jupiter', 'Neptune', 'Apollo'),
      Q('Who was the king of the Roman gods?', 'Jupiter', 'Mars', 'Saturn', 'Pluto'),
      Q('What did the Romans build to carry fresh water to cities?', 'Aqueducts', 'Viaducts', 'Catacombs', 'Ramparts'),
      Q('What was the main public square of ancient Rome called?', 'The Forum', 'The Circus', 'The Atrium', 'The Villa'),
      Q('Which volcano destroyed Pompeii in AD 79?', 'Vesuvius', 'Etna', 'Stromboli', 'Olympus'),
      Q('Hannibal famously crossed the Alps with which animals?', 'Elephants', 'Camels', 'Only horses', 'Oxen'),
      Q('Hannibal fought for which city against Rome?', 'Carthage', 'Athens', 'Sparta', 'Alexandria'),
      Q('What draped garment did Roman citizens wear on formal occasions?', 'The toga', 'The kimono', 'The sari', 'The kilt'),
      Q('What number does X stand for in Roman numerals?', '10', '5', '50', '100'),
      Q('Which sea did Romans call "Mare Nostrum" — our sea?', 'The Mediterranean', 'The Adriatic', 'The Black Sea', 'The Aegean'),
      Q('Where were Roman chariot races held?', 'The Circus Maximus', 'The Colosseum', 'The Pantheon', 'The Forum'),
      Q('Which emperor built a wall across northern Britain?', 'Hadrian', 'Nero', 'Trajan', 'Claudius'),
      Q('The Roman Republic was led each year by two elected what?', 'Consuls', 'Emperors', 'Princes', 'Pharaohs'),
      Q('Who was the Roman god of the sea?', 'Neptune', 'Poseidon', 'Pluto', 'Vulcan'),
      Q('The Pantheon in Rome was built as a temple to what?', 'All the gods', 'One emperor', 'The sun only', 'Victory in war')
    ]
  });

  makeQuiz({
    id: 'quiz-greek-myths', title: 'Greek Myths Quiz', emo: '🏺',
    tagline: 'Olympians, monsters and wax wings',
    desc: 'Zeus\'s thunderbolts, Medusa\'s snake hair, the Minotaur\'s maze and the wax wings of ' +
      'Icarus. Twelve questions on heroes, monsters and Olympians, each against a 15-second ' +
      'clock. Miss three and Hades collects your run.',
    colors: ['#0284c7', '#fbbf24'],
    tags: ['trivia', 'quiz', 'mythology', 'greek'],
    bank: [
      Q('Who was the king of the Greek gods?', 'Zeus', 'Hades', 'Apollo', 'Ares'),
      Q('What was Zeus\'s famous weapon?', 'The thunderbolt', 'The trident', 'A war hammer', 'A silver bow'),
      Q('Who was the Greek god of the sea?', 'Poseidon', 'Zeus', 'Hermes', 'Dionysus'),
      Q('Who was the Greek goddess of wisdom?', 'Athena', 'Aphrodite', 'Hera', 'Artemis'),
      Q('Who ruled the underworld in Greek myth?', 'Hades', 'Poseidon', 'Apollo', 'Hephaestus'),
      Q('Which hero completed twelve mighty labours?', 'Heracles', 'Perseus', 'Theseus', 'Jason'),
      Q('Which monster had living snakes for hair?', 'Medusa', 'The Hydra', 'The Chimera', 'The Sphinx'),
      Q('Which hero cut off Medusa\'s head?', 'Perseus', 'Heracles', 'Achilles', 'Odysseus'),
      Q('What creature — half man, half bull — lived in the Labyrinth?', 'The Minotaur', 'The Centaur', 'The Cyclops', 'The Satyr'),
      Q('Who defeated the Minotaur?', 'Theseus', 'Perseus', 'Jason', 'Paris'),
      Q('Where did the Greek gods live?', 'Mount Olympus', 'Mount Etna', 'Mount Athos', 'Mount Parnassus'),
      Q('Which messenger god wore winged sandals?', 'Hermes', 'Apollo', 'Ares', 'Pan'),
      Q('Who flew too close to the sun on wings of wax and feathers?', 'Icarus', 'Daedalus', 'Achilles', 'Orpheus'),
      Q('What was Achilles\' only vulnerable spot?', 'His heel', 'His wrist', 'His eye', 'His knee'),
      Q('Who was the Greek goddess of love?', 'Aphrodite', 'Athena', 'Demeter', 'Hestia'),
      Q('Who stole fire from the gods and gave it to humans?', 'Prometheus', 'Atlas', 'Epimetheus', 'Hephaestus'),
      Q('Which Titan was condemned to hold up the sky?', 'Atlas', 'Prometheus', 'Cronus', 'Hyperion'),
      Q('What were the one-eyed giants of Greek myth called?', 'Cyclopes', 'Titans', 'Gorgons', 'Harpies'),
      Q('Jason and the Argonauts went questing for what?', 'The Golden Fleece', 'The Golden Apple', 'The Trident', 'The Winged Horse'),
      Q('How did the Greeks finally get inside the city of Troy?', 'Hiding in a giant wooden horse', 'Digging a tunnel', 'A night naval attack', 'Bribing the guards'),
      Q('Odysseus\'s long journey home is told in which epic poem?', 'The Odyssey', 'The Iliad', 'The Aeneid', 'The Theogony')
    ]
  });

  makeQuiz({
    id: 'quiz-norse-myths', title: 'Norse Myths Quiz', emo: '🔨',
    tagline: 'Ravens, runes and Ragnarok',
    desc: 'Odin\'s ravens, Thor\'s hammer Mjolnir, the world tree Yggdrasil and the wolf waiting ' +
      'for Ragnarok. Learn which weekdays hide Norse gods while racing the timer. Streak bonuses ' +
      'grow like Jormungandr — until one wrong answer cuts them down.',
    colors: ['#475569', '#38bdf8'],
    tags: ['trivia', 'quiz', 'mythology', 'norse', 'vikings'],
    bank: [
      Q('Who was the chief of the Norse gods?', 'Odin', 'Thor', 'Loki', 'Tyr'),
      Q('What was the name of Thor\'s hammer?', 'Mjolnir', 'Gungnir', 'Gram', 'Skofnung'),
      Q('Thor was the Norse god of what?', 'Thunder', 'The sea', 'The hunt', 'Fire'),
      Q('Which Norse god was the great trickster?', 'Loki', 'Baldur', 'Heimdall', 'Njord'),
      Q('What did Odin sacrifice to gain wisdom?', 'An eye', 'A hand', 'His hair', 'His voice'),
      Q('What is the great world tree of Norse myth called?', 'Yggdrasil', 'Bifrost', 'Valhalla', 'Midgard'),
      Q('What is the rainbow bridge to Asgard called?', 'Bifrost', 'Yggdrasil', 'Gjallarhorn', 'Vanaheim'),
      Q('In which great hall do warriors slain in battle feast with Odin?', 'Valhalla', 'Helheim', 'Jotunheim', 'Alfheim'),
      Q('Which warrior maidens carried the slain to Valhalla?', 'The Valkyries', 'The Norns', 'The Furies', 'The Sirens'),
      Q('What is the Norse name for the world of humans?', 'Midgard', 'Asgard', 'Niflheim', 'Vanaheim'),
      Q('What were Odin\'s two ravens called?', 'Huginn and Muninn', 'Geri and Freki', 'Skoll and Hati', 'Sleipnir and Fenrir'),
      Q('What was special about Odin\'s horse Sleipnir?', 'It had eight legs', 'It breathed fire', 'It could turn invisible', 'It had wings'),
      Q('Which giant wolf is fated to fight Odin at the end of the world?', 'Fenrir', 'Jormungandr', 'Garm', 'Nidhogg'),
      Q('Which great serpent encircles Midgard beneath the sea?', 'Jormungandr', 'Fenrir', 'Nidhogg', 'Fafnir'),
      Q('What is the Norse doomsday battle called?', 'Ragnarok', 'Valhalla', 'Ginnungagap', 'Yule'),
      Q('Who was the Norse goddess of love and beauty?', 'Freyja', 'Sif', 'Hel', 'Skadi'),
      Q('Which of Loki\'s children rules over the dead?', 'Hel', 'Freyja', 'Sif', 'Idun'),
      Q('What does the god Heimdall stand guard over?', 'The rainbow bridge Bifrost', 'Odin\'s throne', 'The world tree', 'Thor\'s hammer'),
      Q('Which day of the week is named after Thor?', 'Thursday', 'Tuesday', 'Wednesday', 'Friday'),
      Q('Which day of the week is named after Odin (Woden)?', 'Wednesday', 'Monday', 'Thursday', 'Saturday'),
      Q('Which goddess kept the apples that kept the gods young?', 'Idun', 'Sif', 'Hel', 'Skadi')
    ]
  });

  makeQuiz({
    id: 'quiz-chemistry', title: 'Chemistry Quiz', emo: '⚗️',
    tagline: 'Au, Na, Fe — and dry ice',
    desc: 'Symbols and substances: why gold is Au, salt is sodium chloride, dry ice is frozen ' +
      'carbon dioxide and lemons pack citric acid. Mendeleev\'s table, noble gases and pH all ' +
      'show up too. +100 a hit, plus speed and streak bonuses for confident chemists.',
    colors: ['#a3e635', '#14b8a6'],
    tags: ['trivia', 'quiz', 'chemistry', 'science', 'elements'],
    bank: [
      Q('What is the chemical symbol for gold?', 'Au', 'Ag', 'Go', 'Gd'),
      Q('What is the chemical formula for water?', 'H2O', 'CO2', 'HO2', 'H2O2'),
      Q('What is the chemical symbol for sodium?', 'Na', 'So', 'Sd', 'S'),
      Q('What is the most abundant element in the universe?', 'Hydrogen', 'Helium', 'Oxygen', 'Carbon'),
      Q('What is the chemical name for table salt?', 'Sodium chloride', 'Potassium chloride', 'Calcium carbonate', 'Sodium bicarbonate'),
      Q('An element\'s atomic number counts what in each atom?', 'Protons', 'Neutrons', 'Electron shells', 'Isotopes'),
      Q('A solution with a pH of 7 is what?', 'Neutral', 'Acidic', 'Basic', 'Frozen'),
      Q('Which gas do we breathe out more of than we breathe in?', 'Carbon dioxide', 'Oxygen', 'Nitrogen', 'Methane'),
      Q('The symbol Fe stands for which element?', 'Iron', 'Fluorine', 'Lead', 'Tin'),
      Q('What are the vertical columns of the periodic table called?', 'Groups', 'Periods', 'Rows', 'Blocks'),
      Q('Who arranged the first widely used periodic table?', 'Dmitri Mendeleev', 'John Dalton', 'Marie Curie', 'Antoine Lavoisier'),
      Q('Diamond and graphite are both forms of which element?', 'Carbon', 'Silicon', 'Calcium', 'Sulfur'),
      Q('Which of these elements is a noble gas?', 'Helium', 'Hydrogen', 'Oxygen', 'Chlorine'),
      Q('What is rust, chemically speaking?', 'Iron oxide', 'Iron chloride', 'Copper oxide', 'Zinc sulfate'),
      Q('What is the main gas in natural gas?', 'Methane', 'Propane', 'Butane', 'Ethanol'),
      Q('Which acid gives lemons their sour taste?', 'Citric acid', 'Sulfuric acid', 'Lactic acid', 'Nitric acid'),
      Q('Which acid is found in vinegar?', 'Acetic acid', 'Citric acid', 'Nitric acid', 'Carbonic acid'),
      Q('A molecule of ozone is made of what?', 'Three oxygen atoms', 'Two oxygen atoms', 'One oxygen and one hydrogen', 'Three nitrogen atoms'),
      Q('The symbol K stands for which element?', 'Potassium', 'Krypton', 'Calcium', 'Carbon'),
      Q('What is dry ice?', 'Frozen carbon dioxide', 'Frozen water', 'Frozen nitrogen', 'Frozen methane')
    ]
  });

  makeQuiz({
    id: 'quiz-physics', title: 'Physics Quiz', emo: '⚡',
    tagline: 'Newtons, joules and falling feathers',
    desc: 'Newtons, joules and watts; ramps, prisms and friction. The bank leans on famous ideas — ' +
      'E=mc², the hammer-and-feather drop, why lightning beats thunder to your senses. Answer ' +
      'inside the 15-second bar to bank the speed bonus.',
    colors: ['#facc15', '#4f46e5'],
    tags: ['trivia', 'quiz', 'physics', 'science'],
    bank: [
      Q('Which unit measures force?', 'The newton', 'The joule', 'The watt', 'The pascal'),
      Q('Which unit measures energy?', 'The joule', 'The newton', 'The volt', 'The hertz'),
      Q('Which unit measures power?', 'The watt', 'The ampere', 'The ohm', 'The tesla'),
      Q('Which force does Newton\'s famous falling-apple story describe?', 'Gravity', 'Magnetism', 'Friction', 'Tension'),
      Q('Who wrote the equation E = mc²?', 'Albert Einstein', 'Isaac Newton', 'Niels Bohr', 'James Maxwell'),
      Q('Roughly how fast does sound travel through air?', 'About 340 metres per second', 'About 34 metres per second', 'About 3,400 metres per second', 'About 3 metres per second'),
      Q('Why do you see lightning before you hear thunder?', 'Light travels much faster than sound', 'Thunder happens a few seconds later', 'Your eyes react faster than your ears', 'Sound gets lost in the clouds'),
      Q('A ramp is an example of which simple machine?', 'An inclined plane', 'A lever', 'A pulley', 'A screw'),
      Q('What happens to white light passing through a prism?', 'It splits into colours', 'It speeds up', 'It disappears', 'It bounces straight back'),
      Q('Which type of lens bends light rays together toward a point?', 'Convex', 'Concave', 'Flat', 'Polarized'),
      Q('Which force slows a box sliding across the floor?', 'Friction', 'Gravity', 'Magnetism', 'Momentum'),
      Q('"An object in motion stays in motion" is Newton\'s which law?', 'First law', 'Second law', 'Third law', 'Law of gravitation'),
      Q('"Every action has an equal and opposite reaction" is Newton\'s which law?', 'Third law', 'First law', 'Second law', 'Fourth law'),
      Q('What does a barometer measure?', 'Air pressure', 'Humidity', 'Wind speed', 'Temperature'),
      Q('Electrical resistance is measured in what?', 'Ohms', 'Volts', 'Amperes', 'Watts'),
      Q('What travels as waves of compressed air?', 'Sound', 'Light', 'Heat', 'Gravity'),
      Q('In a vacuum, which falls faster — a hammer or a feather?', 'They fall at the same rate', 'The hammer', 'The feather', 'Neither falls'),
      Q('What kind of energy is stored in a stretched spring?', 'Potential energy', 'Kinetic energy', 'Thermal energy', 'Nuclear energy'),
      Q('Heat naturally flows in which direction?', 'From hotter objects to colder ones', 'From colder objects to hotter ones', 'Only downward', 'Only through metal'),
      Q('What is the bending of light as it enters water called?', 'Refraction', 'Reflection', 'Diffusion', 'Absorption')
    ]
  });

  makeQuiz({
    id: 'quiz-biology', title: 'Biology Quiz', emo: '🧬',
    tagline: 'Cells, peas and natural selection',
    desc: 'Cells and what powers them, chlorophyll, metamorphosis, Darwin\'s big idea and Mendel\'s ' +
      'peas. From invertebrates to whales-are-mammals, it\'s life science in twelve-question ' +
      'doses. Three lives, a growing streak bonus, and an instant reveal on every miss.',
    colors: ['#10b981', '#065f46'],
    tags: ['trivia', 'quiz', 'biology', 'science', 'nature'],
    bank: [
      Q('What is the basic unit of all living things?', 'The cell', 'The atom', 'The organ', 'The molecule'),
      Q('Which cell part is nicknamed the "powerhouse of the cell"?', 'The mitochondria', 'The nucleus', 'The ribosome', 'The vacuole'),
      Q('Which green pigment lets plants capture sunlight?', 'Chlorophyll', 'Melanin', 'Carotene', 'Keratin'),
      Q('In which cell structures does photosynthesis happen?', 'Chloroplasts', 'Mitochondria', 'Nuclei', 'Vacuoles'),
      Q('What do we call animals without a backbone?', 'Invertebrates', 'Vertebrates', 'Amphibians', 'Mammals'),
      Q('A caterpillar becoming a butterfly is an example of what?', 'Metamorphosis', 'Hibernation', 'Photosynthesis', 'Germination'),
      Q('Genes are made of which molecule?', 'DNA', 'Protein', 'Sugar', 'Cellulose'),
      Q('How many pairs of chromosomes do humans normally have?', '23', '21', '24', '46'),
      Q('What is the scientific study of plants called?', 'Botany', 'Zoology', 'Geology', 'Ecology'),
      Q('Frogs belong to which class of animals?', 'Amphibians', 'Reptiles', 'Fish', 'Mammals'),
      Q('Snakes belong to which class of animals?', 'Reptiles', 'Amphibians', 'Insects', 'Arachnids'),
      Q('Which of these is a fungus?', 'A mushroom', 'Moss', 'Seaweed', 'A fern'),
      Q('Whales belong to which group of animals?', 'Mammals', 'Fish', 'Reptiles', 'Amphibians'),
      Q('An animal that eats both plants and meat is called a what?', 'An omnivore', 'A herbivore', 'A carnivore', 'A decomposer'),
      Q('Charles Darwin is famous for which theory?', 'Evolution by natural selection', 'Relativity', 'Continental drift', 'Spontaneous generation'),
      Q('Gregor Mendel discovered the rules of heredity using which plants?', 'Pea plants', 'Roses', 'Oak trees', 'Sunflowers'),
      Q('What is it called when one cell divides into two identical cells?', 'Mitosis', 'Meiosis', 'Osmosis', 'Diffusion'),
      Q('Water passing through a cell membrane is called what?', 'Osmosis', 'Mitosis', 'Digestion', 'Respiration'),
      Q('What usually forms the first link of a food chain?', 'Plants (producers)', 'Predators', 'Scavengers', 'Decomposers'),
      Q('Sunlight helps your body make which vitamin?', 'Vitamin D', 'Vitamin A', 'Vitamin C', 'Vitamin B12')
    ]
  });

  makeQuiz({
    id: 'quiz-weather', title: 'Weather Quiz', emo: '⛈️',
    tagline: 'Clouds, storms and hurricane eyes',
    desc: 'Anemometers, cumulonimbus, the eye of a hurricane and what a falling barometer is ' +
      'warning you about. Cloud-spotting, storm scales and why thunder happens at all. Beat the ' +
      '15-second bar for up to +50 speed points a question.',
    colors: ['#93c5fd', '#3b82f6'],
    tags: ['trivia', 'quiz', 'weather', 'nature', 'science'],
    bank: [
      Q('Which instrument measures wind speed?', 'An anemometer', 'A barometer', 'A thermometer', 'A hygrometer'),
      Q('Cumulonimbus clouds are known for bringing what?', 'Thunderstorms', 'Clear skies', 'Light drizzle', 'Morning fog'),
      Q('What does a rain gauge measure?', 'How much rain has fallen', 'Wind direction', 'Air pressure', 'Humidity'),
      Q('Tornado strength is rated on which scale?', 'The Enhanced Fujita scale', 'The Richter scale', 'The Kelvin scale', 'The Mercalli scale'),
      Q('Hurricane strength is rated on which scale?', 'The Saffir-Simpson scale', 'The Fujita scale', 'The Richter scale', 'The Beaufort scale'),
      Q('What causes the sound of thunder?', 'Lightning rapidly heating the air', 'Clouds crashing together', 'Rain hitting mountains', 'Wind spinning very fast'),
      Q('What is fog?', 'A cloud at ground level', 'Smoke trapped by wind', 'Steam rising from soil', 'Very light rain'),
      Q('What are hurricanes called in the northwest Pacific?', 'Typhoons', 'Monsoons', 'Tornadoes', 'Waterspouts'),
      Q('What does "precipitation" mean?', 'Any water falling from the sky', 'Water evaporating', 'Clouds forming', 'Wind rising'),
      Q('What appears when sunlight shines through falling raindrops?', 'A rainbow', 'An aurora', 'Lightning', 'A halo of dust'),
      Q('Snow forms when water vapour does what?', 'Freezes into ice crystals', 'Melts', 'Evaporates', 'Condenses into drops'),
      Q('What is the calm centre of a hurricane called?', 'The eye', 'The funnel', 'The core ring', 'The spiral'),
      Q('A rapidly falling barometer usually warns of what?', 'Stormy weather coming', 'Clear skies ahead', 'A heatwave', 'Nothing at all'),
      Q('Which clouds are the thin, wispy ones very high in the sky?', 'Cirrus', 'Cumulus', 'Stratus', 'Nimbostratus'),
      Q('Which clouds are the puffy, cotton-like fair-weather ones?', 'Cumulus', 'Cirrus', 'Stratus', 'Cumulonimbus'),
      Q('What is dew?', 'Water condensed onto cool surfaces overnight', 'Frozen rain', 'Light rain that fell at night', 'Melted frost only'),
      Q('A long period with far too little rain is called a what?', 'Drought', 'Monsoon', 'Flood', 'Blizzard'),
      Q('A blizzard combines heavy snow with what?', 'Strong winds', 'Thunder', 'Hail', 'Warm air'),
      Q('Hail forms inside which kind of cloud?', 'Thunderstorm clouds', 'Fog banks', 'Cirrus clouds', 'Stratus clouds'),
      Q('At what relative humidity does air hold all the vapour it can?', '100%', '50%', '75%', '90%')
    ]
  });

  makeQuiz({
    id: 'quiz-geology', title: 'Geology Quiz', emo: '🌋',
    tagline: 'Magma, Mohs and Pangaea',
    desc: 'Rocks in three flavours, magma versus lava, floating pumice and the supercontinent ' +
      'Pangaea. Expect Mohs-scale extremes, fossil-bearing layers and the river that carved the ' +
      'Grand Canyon. A steady streak is worth far more than a lucky guess.',
    colors: ['#ea580c', '#3f3f46'],
    tags: ['trivia', 'quiz', 'geology', 'earth', 'rocks'],
    bank: [
      Q('What are the three main types of rock?', 'Igneous, sedimentary, metamorphic', 'Granite, marble, slate', 'Crystal, mineral, fossil', 'Crust, mantle, core'),
      Q('What is molten rock called while it is still underground?', 'Magma', 'Lava', 'Basalt', 'Ash'),
      Q('What is molten rock called once it erupts onto the surface?', 'Lava', 'Magma', 'Granite', 'Obsidian'),
      Q('Which scale is famous for measuring earthquake strength?', 'The Richter scale', 'The Fujita scale', 'The Beaufort scale', 'The Saffir-Simpson scale'),
      Q('What is Earth\'s thin, rocky outer layer called?', 'The crust', 'The mantle', 'The core', 'The magma belt'),
      Q('What is the very centre of the Earth called?', 'The core', 'The crust', 'The mantle', 'The axis'),
      Q('The huge moving slabs of Earth\'s outer shell are called what?', 'Tectonic plates', 'Lava shelves', 'Rock rafts', 'Crust wheels'),
      Q('Rock formed from cooled molten rock is called what?', 'Igneous rock', 'Sedimentary rock', 'Metamorphic rock', 'Fossil rock'),
      Q('Which rock type most often contains fossils?', 'Sedimentary', 'Igneous', 'Metamorphic', 'Volcanic glass'),
      Q('What is the hardest mineral on the Mohs scale?', 'Diamond', 'Quartz', 'Topaz', 'Corundum'),
      Q('What is the softest mineral on the Mohs scale?', 'Talc', 'Gypsum', 'Chalk', 'Graphite'),
      Q('What is a geyser?', 'A hot spring that erupts water and steam', 'A small volcano', 'An underground river', 'A crack that leaks gas'),
      Q('The Grand Canyon was carved mainly by which river?', 'The Colorado River', 'The Mississippi River', 'The Rio Grande', 'The Missouri River'),
      Q('Stalactites grow from which part of a cave?', 'The ceiling', 'The floor', 'The walls only', 'The entrance'),
      Q('Ruby is the red variety of which mineral?', 'Corundum', 'Quartz', 'Feldspar', 'Calcite'),
      Q('What is naturally formed volcanic glass called?', 'Obsidian', 'Basalt', 'Granite', 'Flint'),
      Q('Which volcanic rock is so full of gas holes that it can float?', 'Pumice', 'Granite', 'Marble', 'Slate'),
      Q('Marble forms when which rock is transformed by heat and pressure?', 'Limestone', 'Sandstone', 'Granite', 'Shale'),
      Q('What is the ancient supercontinent called?', 'Pangaea', 'Atlantis', 'Laurasia', 'Eurasia'),
      Q('Coal formed from what, buried over millions of years?', 'Ancient swamp plants', 'Seashells', 'Volcanic ash', 'Desert sand')
    ]
  });

  makeQuiz({
    id: 'quiz-plants', title: 'Plant Quiz', emo: '🌱',
    tagline: 'The quiz where bamboo is a grass',
    desc: 'Photosynthesis, pollination and germination — plus vanilla orchids, cactus spines that ' +
      'are really leaves, and bamboo\'s secret identity as a grass. Twelve green questions per ' +
      'run from a larger bank. Wrong answers cost a life but always show you the truth.',
    colors: ['#4ade80', '#166534'],
    tags: ['trivia', 'quiz', 'plants', 'nature', 'botany'],
    bank: [
      Q('What do plants produce during photosynthesis?', 'Sugar and oxygen', 'Salt and nitrogen', 'Protein and carbon dioxide', 'Water and methane'),
      Q('Which part of a plant absorbs water from the soil?', 'The roots', 'The leaves', 'The petals', 'The seeds'),
      Q('Which part of a plant makes most of its food?', 'The leaves', 'The roots', 'The bark', 'The petals'),
      Q('Why do flowers produce nectar?', 'To attract pollinators', 'To store water', 'To poison pests', 'To feed their roots'),
      Q('Moving pollen from one flower to another is called what?', 'Pollination', 'Germination', 'Photosynthesis', 'Respiration'),
      Q('A seed beginning to sprout is called what?', 'Germination', 'Pollination', 'Decomposition', 'Fermentation'),
      Q('Which gas do plants release in daylight?', 'Oxygen', 'Carbon dioxide', 'Nitrogen', 'Hydrogen'),
      Q('What is the tallest tree species on Earth?', 'The coast redwood', 'The giant sequoia', 'The baobab', 'The Douglas fir'),
      Q('Trees that drop their leaves each autumn are called what?', 'Deciduous', 'Evergreen', 'Coniferous', 'Succulent'),
      Q('Pines and spruces belong to which group of trees?', 'Conifers', 'Palms', 'Ferns', 'Broadleaf oaks'),
      Q('How can you estimate a felled tree\'s age?', 'Count its growth rings', 'Measure its height', 'Weigh its bark', 'Count its branches'),
      Q('Where do cactus plants store water?', 'In their thick stems', 'In their spines', 'Only in their roots', 'In their flowers'),
      Q('Cactus spines are actually modified what?', 'Leaves', 'Branches', 'Roots', 'Bark'),
      Q('Which young flower famously turns to track the sun?', 'The sunflower', 'The rose', 'The tulip', 'The fern'),
      Q('What does the Venus flytrap catch and digest?', 'Insects', 'Mice', 'Birds', 'Fish'),
      Q('Bamboo is actually a type of what?', 'Grass', 'Tree', 'Fern', 'Vine'),
      Q('What is the male, pollen-making part of a flower called?', 'The stamen', 'The pistil', 'The sepal', 'The petal'),
      Q('Vanilla pods grow on what kind of plant?', 'An orchid', 'A palm', 'A cocoa tree', 'A grapevine'),
      Q('Chocolate is made from the seeds of which tree?', 'The cacao tree', 'The coffee tree', 'The maple tree', 'The almond tree'),
      Q('Fruit develops from which part of a flower?', 'The ovary', 'The stem', 'The petal', 'The leaf'),
      Q('What is the largest single flower in the world?', 'The Rafflesia', 'The sunflower', 'The lotus', 'The water lily')
    ]
  });

  makeQuiz({
    id: 'quiz-birds', title: 'Bird Quiz', emo: '🦉',
    tagline: 'From bee hummingbird to wandering albatross',
    desc: 'Ostriches, bee hummingbirds and the peregrine\'s record dive. Cygnets, murders of crows, ' +
      'New Zealand\'s kiwi and the puffin they call the sea parrot. Fifteen seconds a question — ' +
      'fly through them for the speed bonus.',
    colors: ['#f472b6', '#818cf8'],
    tags: ['trivia', 'quiz', 'birds', 'nature'],
    bank: [
      Q('What is the largest living bird?', 'The ostrich', 'The emu', 'The albatross', 'The condor'),
      Q('What is the smallest bird in the world?', 'The bee hummingbird', 'The sparrow', 'The wren', 'The goldcrest'),
      Q('Which bird can fly backwards?', 'The hummingbird', 'The sparrow', 'The eagle', 'The swallow'),
      Q('Which bird reaches the fastest speed of any animal, in a dive?', 'The peregrine falcon', 'The golden eagle', 'The swift', 'The osprey'),
      Q('Which bird has the largest wingspan of any living bird?', 'The wandering albatross', 'The bald eagle', 'The Andean condor', 'The marabou stork'),
      Q('Wild penguins live almost entirely in which hemisphere?', 'The Southern Hemisphere', 'The Northern Hemisphere', 'Both equally', 'Only the Arctic'),
      Q('What is the male peacock famous for?', 'Its huge fanned tail feathers', 'Its bright beak', 'Its long legs', 'Its singing voice'),
      Q('Which bird is famous for mimicking human speech?', 'The parrot', 'The seagull', 'The duck', 'The robin'),
      Q('When do most owls hunt?', 'At night', 'At midday', 'Only at dawn', 'Underwater'),
      Q('What do birds have that no other living animals have?', 'Feathers', 'Wings', 'Claws', 'Beaks'),
      Q('Which bird lays the largest egg?', 'The ostrich', 'The emu', 'The swan', 'The eagle'),
      Q('What is a baby swan called?', 'A cygnet', 'A gosling', 'A duckling', 'A chick'),
      Q('What is a group of crows called?', 'A murder', 'A gaggle', 'A parliament', 'A charm'),
      Q('Which bird is the national symbol of the United States?', 'The bald eagle', 'The golden eagle', 'The hawk', 'The falcon'),
      Q('When birds migrate, what are they doing?', 'Travelling seasonally between regions', 'Sleeping all winter', 'Changing colour', 'Shedding all their feathers'),
      Q('Which flightless bird is the national icon of New Zealand?', 'The kiwi', 'The ostrich', 'The puffin', 'The dodo'),
      Q('The extinct dodo lived on which island?', 'Mauritius', 'Madagascar', 'Iceland', 'Cuba'),
      Q('Why do woodpeckers hammer into trees?', 'To find insects and dig nest holes', 'To sharpen their claws', 'To scare predators', 'To crack seeds'),
      Q('Which seabird with a colourful beak is nicknamed the "sea parrot"?', 'The puffin', 'The pelican', 'The tern', 'The gannet'),
      Q('What were homing pigeons famously used for?', 'Carrying messages', 'Hunting rats', 'Pulling carts', 'Guarding homes'),
      Q('What is an eagle\'s nest called?', 'An eyrie', 'A den', 'A burrow', 'A hive')
    ]
  });

  makeQuiz({
    id: 'quiz-insects', title: 'Insect Quiz', emo: '🐝',
    tagline: 'Six legs, three body parts, big facts',
    desc: 'Six legs, three body parts and a world of detail: fireflies, waggle-dancing bees, ' +
      'monarch migrations and why a spider doesn\'t count as an insect. ' +
      'Butterflies-taste-with-their-feet strangeness throughout. Streaks grow your bonus until ' +
      'a single miss snaps them.',
    colors: ['#fde047', '#22c55e'],
    tags: ['trivia', 'quiz', 'insects', 'bugs', 'nature'],
    bank: [
      Q('How many legs does an insect have?', '6', '4', '8', '10'),
      Q('How many main body parts does an insect have?', '3', '2', '4', '5'),
      Q('Which insect makes honey?', 'The honeybee', 'The wasp', 'The hornet', 'The ant'),
      Q('What is a bee colony\'s home called?', 'A hive', 'A den', 'A web', 'A warren'),
      Q('What is the queen bee\'s main job?', 'Laying eggs', 'Making honey', 'Guarding the hive', 'Collecting pollen'),
      Q('Butterflies taste things using which body part?', 'Their feet', 'Their wings', 'Their tongues', 'Their eyes'),
      Q('What do caterpillars turn into?', 'Butterflies or moths', 'Beetles', 'Bees', 'Dragonflies'),
      Q('The hard case a butterfly caterpillar forms is called a what?', 'Chrysalis', 'Cocoon', 'Husk', 'Pod'),
      Q('Which insect glows to signal others at night?', 'The firefly', 'The dragonfly', 'The ladybug', 'The cricket'),
      Q('How do crickets make their chirping sound?', 'Rubbing their wings together', 'Singing with their mouths', 'Stamping their feet', 'Clicking their jaws'),
      Q('What do female mosquitoes feed on to produce eggs?', 'Blood', 'Leaves', 'Wood', 'Honey'),
      Q('An ant colony is led by a what?', 'Queen', 'King', 'General', 'Chief worker'),
      Q('What do ladybugs famously eat, making gardeners love them?', 'Aphids', 'Leaves', 'Nectar only', 'Seeds'),
      Q('Which insects build huge earthen mounds?', 'Termites', 'Bees', 'Butterflies', 'Fleas'),
      Q('Why is a spider not an insect?', 'It has eight legs and two body parts', 'It has six legs', 'It has wings', 'It is too small'),
      Q('Which butterfly migrates thousands of miles across North America?', 'The monarch', 'The ladybug', 'The housefly', 'The bumblebee'),
      Q('Honeybees tell each other where food is by doing what?', 'A waggle dance', 'Glowing', 'Changing colour', 'Whistling'),
      Q('What do silkworms produce?', 'Silk threads', 'Honey', 'Wax', 'Cotton'),
      Q('What are grasshoppers famous for?', 'Powerful jumping legs', 'Spinning webs', 'Painful stings', 'Hard shells'),
      Q('Which insect spreads the disease malaria?', 'The mosquito', 'The housefly', 'The flea', 'The ant'),
      Q('What do dragonflies mostly eat?', 'Other insects caught in flight', 'Pollen', 'Leaves', 'Small fish')
    ]
  });

  makeQuiz({
    id: 'quiz-math-facts', title: 'Math Facts Quiz', emo: '➗',
    tagline: 'Pi, primes and Fibonacci',
    desc: 'Pi to two places, the only even prime, Fibonacci\'s next number and what perimeter ' +
      'actually means. Quick mental sums like 7×8 and 12² keep the clock honest. Speed pays: up ' +
      'to +50 extra for near-instant answers, and streaks stack on top.',
    colors: ['#818cf8', '#e879f9'],
    tags: ['trivia', 'quiz', 'maths', 'numbers'],
    bank: [
      Q('What is pi, rounded to two decimal places?', '3.14', '3.41', '3.12', '3.24'),
      Q('What is the only even prime number?', '2', '1', '0', '4'),
      Q('How many degrees are in a full circle?', '360', '180', '90', '270'),
      Q('The angles inside any triangle add up to how many degrees?', '180', '90', '270', '360'),
      Q('What is 7 × 8?', '56', '54', '48', '64'),
      Q('What do you call a shape with eight sides?', 'An octagon', 'A hexagon', 'A pentagon', 'A heptagon'),
      Q('A number divisible only by 1 and itself is called what?', 'A prime number', 'A composite number', 'A fraction', 'A multiple'),
      Q('What is 12 squared?', '144', '124', '122', '148'),
      Q('What is the square root of 81?', '9', '8', '7', '11'),
      Q('What does the Roman numeral C stand for?', '100', '50', '500', '1,000'),
      Q('How many items are in one dozen?', '12', '10', '6', '20'),
      Q('What does "perimeter" mean?', 'The distance around a shape', 'The space inside a shape', 'The height of a shape', 'The number of corners'),
      Q('How do you find the area of a rectangle?', 'Length × width', 'Length + width', '2 × length', 'Side × 4'),
      Q('What comes next: 1, 1, 2, 3, 5, 8, ...?', '13', '11', '12', '15'),
      Q('The sequence 1, 1, 2, 3, 5, 8 ... is named after whom?', 'Fibonacci', 'Pythagoras', 'Euclid', 'Archimedes'),
      Q('A triangle with all three sides equal is called what?', 'Equilateral', 'Isosceles', 'Scalene', 'Right-angled'),
      Q('What is 25% of 200?', '50', '25', '75', '100'),
      Q('Any number multiplied by zero equals what?', '0', 'Itself', '1', '10'),
      Q('How many sides does a pentagon have?', '5', '4', '6', '7'),
      Q('An angle of exactly 90 degrees is called what?', 'A right angle', 'An acute angle', 'An obtuse angle', 'A reflex angle')
    ]
  });

  makeQuiz({
    id: 'quiz-computers', title: 'Computer Quiz', emo: '💻',
    tagline: 'Bits, bytes and QWERTY',
    desc: 'CPUs, bytes and the QWERTY keyboard; Ada Lovelace, Alan Turing and the founders of ' +
      'Microsoft and Apple. Acronym literacy — RAM, USB, PDF, HTTP — earns the big streaks. ' +
      'Twelve questions, three lives, no reboots.',
    colors: ['#06b6d4', '#3b82f6'],
    tags: ['trivia', 'quiz', 'computers', 'technology'],
    bank: [
      Q('What does CPU stand for?', 'Central Processing Unit', 'Computer Power Unit', 'Central Program Utility', 'Core Processing Utility'),
      Q('What does WWW stand for?', 'World Wide Web', 'World Web Wire', 'Wide World Web', 'Web World Wide'),
      Q('Binary code uses which two digits?', '0 and 1', '1 and 2', '0 to 9', 'A and B'),
      Q('How many bits are in one byte?', '8', '4', '10', '16'),
      Q('What does RAM stand for?', 'Random Access Memory', 'Read All Memory', 'Rapid Action Module', 'Run And Manage'),
      Q('Which device moves the pointer around the screen?', 'The mouse', 'The printer', 'The speaker', 'The scanner'),
      Q('What does USB stand for?', 'Universal Serial Bus', 'United System Board', 'Universal System Backup', 'Uniform Serial Bank'),
      Q('Who co-founded Microsoft?', 'Bill Gates', 'Steve Jobs', 'Mark Zuckerberg', 'Jeff Bezos'),
      Q('Who co-founded Apple?', 'Steve Jobs', 'Bill Gates', 'Elon Musk', 'Larry Page'),
      Q('What does the HTTP in web addresses stand for?', 'HyperText Transfer Protocol', 'High Tech Transfer Process', 'Home Terminal Text Program', 'Hyper Tool Transport Path'),
      Q('What is "software"?', 'The programs a computer runs', 'The physical parts of a computer', 'The screen only', 'The power supply'),
      Q('Which company created the Windows operating system?', 'Microsoft', 'Apple', 'IBM', 'Google'),
      Q('What is HTML mainly used for?', 'Building web pages', 'Editing photos', 'Sending email only', 'Making spreadsheets'),
      Q('What is a computer virus?', 'A harmful program that spreads itself', 'A broken chip', 'An overheated CPU', 'A loose cable'),
      Q('Saving files "in the cloud" means storing them where?', 'On internet servers', 'Inside the monitor', 'On paper backups', 'In RAM forever'),
      Q('Ada Lovelace is celebrated as what?', 'An early pioneer of computer programming', 'The inventor of email', 'The first astronaut', 'A famous painter'),
      Q('Alan Turing is famous for what?', 'Pioneering computer science and codebreaking', 'Inventing the telephone', 'Discovering DNA', 'Building the first car'),
      Q('What does PDF stand for?', 'Portable Document Format', 'Printed Data File', 'Personal Document Folder', 'Public Digital Form'),
      Q('What does "QWERTY" refer to?', 'A keyboard layout', 'A computer brand', 'An internet speed', 'A programming language'),
      Q('Which of these storage units is the largest?', 'A terabyte', 'A megabyte', 'A kilobyte', 'A gigabyte'),
      Q('What is the internet?', 'A global network of connected computers', 'One giant computer', 'A software program', 'A type of cable'),
      Q('Computers in the 1940s were roughly the size of what?', 'A whole room', 'A wristwatch', 'A phone', 'A shoebox')
    ]
  });

  makeQuiz({
    id: 'quiz-famous-scientists', title: 'Famous Scientists Quiz', emo: '🧪',
    tagline: 'Match the discovery to the mind',
    desc: 'Einstein, Newton and double-Nobel Marie Curie; Jane Goodall\'s chimpanzees, Hawking\'s ' +
      'black holes and Archimedes shouting Eureka. Match the discovery to the mind behind it ' +
      'inside 15 seconds. All twelve correct is worth a confetti shower.',
    colors: ['#9333ea', '#fb7185'],
    tags: ['trivia', 'quiz', 'scientists', 'science', 'history'],
    bank: [
      Q('Who developed the theory of general relativity?', 'Albert Einstein', 'Isaac Newton', 'Stephen Hawking', 'Niels Bohr'),
      Q('Who set out the laws of motion and universal gravitation?', 'Isaac Newton', 'Galileo Galilei', 'Johannes Kepler', 'Michael Faraday'),
      Q('Marie Curie won Nobel Prizes in which two fields?', 'Physics and chemistry', 'Peace and medicine', 'Chemistry and literature', 'Physics and medicine'),
      Q('Marie Curie is famous for her research on what?', 'Radioactivity', 'Evolution', 'Vaccines', 'Electricity'),
      Q('Charles Darwin sailed around the world on which ship?', 'HMS Beagle', 'HMS Victory', 'The Mayflower', 'The Endeavour'),
      Q('Who proposed in 1543 that the Earth orbits the Sun?', 'Nicolaus Copernicus', 'Ptolemy', 'Galileo Galilei', 'Tycho Brahe'),
      Q('Galileo was put on trial for supporting which idea?', 'That the Earth moves around the Sun', 'Vaccination', 'Evolution', 'Electricity'),
      Q('In which decade did Alexander Fleming discover penicillin?', 'The 1920s', 'The 1850s', 'The 1970s', 'The 1990s'),
      Q('Louis Pasteur gave his name to which food-safety process?', 'Pasteurization', 'Refrigeration', 'Canning', 'Distillation'),
      Q('Which inventor championed alternating current electricity?', 'Nikola Tesla', 'Guglielmo Marconi', 'James Watt', 'Alessandro Volta'),
      Q('Stephen Hawking was famous for studying what?', 'Black holes', 'Volcanoes', 'DNA', 'Weather'),
      Q('Jane Goodall spent decades studying which animals?', 'Chimpanzees', 'Dolphins', 'Gorillas', 'Lions'),
      Q('Gregor Mendel is called the father of which science?', 'Genetics', 'Chemistry', 'Astronomy', 'Geology'),
      Q('What did Archimedes supposedly shout in his bath?', 'Eureka!', 'Excelsior!', 'Veni vidi vici!', 'Onward!'),
      Q('Rosalind Franklin\'s X-ray images helped reveal the structure of what?', 'DNA', 'The atom', 'Penicillin', 'Radio waves'),
      Q('Watson and Crick described DNA\'s shape as a what?', 'Double helix', 'Single spiral', 'Flat sheet', 'Ring'),
      Q('Alfred Nobel\'s fortune funds which famous awards?', 'The Nobel Prizes', 'The Olympics', 'The Oscars', 'The Booker Prize'),
      Q('Benjamin Franklin\'s kite experiment investigated what?', 'Electricity in lightning', 'Wind power', 'Magnetism', 'Gravity'),
      Q('Edwin Hubble showed that the universe is doing what?', 'Expanding', 'Shrinking', 'Standing still', 'Spinning backwards'),
      Q('Florence Nightingale founded which modern profession?', 'Nursing', 'Surgery', 'Radiology', 'Dentistry'),
      Q('George Washington Carver found hundreds of uses for which crop?', 'Peanuts', 'Wheat', 'Rice', 'Grapes')
    ]
  });

})();
