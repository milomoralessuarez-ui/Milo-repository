/* Quiz Pack 2 — "World & Geography": 25 timed multiple-choice quizzes on one
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
          '.qp2-wrap{width:min(680px,96%);margin:auto;display:flex;flex-direction:column;gap:12px;font-family:Outfit,sans-serif}',
          '.qp2-top{display:flex;justify-content:space-between;color:#a8b0d8;font-size:.88rem;font-weight:700;letter-spacing:.02em}',
          '.qp2-track{height:12px;border-radius:7px;background:rgba(255,255,255,.09);overflow:hidden}',
          '.qp2-fill{height:100%;width:100%;border-radius:7px;background:linear-gradient(90deg,' + c0 + ',' + c1 + ')}',
          '.qp2-fill.low{background:#fb7185}',
          '.qp2-q{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.09);border-radius:14px;' +
          'padding:18px 20px;color:#fff;font-size:clamp(1.02rem,2.6vw,1.26rem);font-weight:700;line-height:1.4;' +
          'min-height:88px;display:flex;align-items:center;justify-content:center;text-align:center}',
          '.qp2-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
          '@media(max-width:600px){.qp2-grid{grid-template-columns:1fr}}',
          '.qp2-btn{display:flex;align-items:center;gap:10px;text-align:left;background:rgba(255,255,255,.05);' +
          'border:2px solid rgba(255,255,255,.13);border-radius:12px;padding:12px 14px;color:#e8ecff;' +
          'font:600 .95rem/1.3 Outfit,sans-serif;cursor:pointer;transition:border-color .12s,background .12s,opacity .2s}',
          '.qp2-btn:hover{border-color:' + c0 + ';background:rgba(255,255,255,.09)}',
          '.qp2-btn .k{flex:0 0 auto;min-width:24px;height:24px;border-radius:7px;background:rgba(255,255,255,.1);' +
          'display:grid;place-items:center;font-size:.78rem;font-weight:800;color:#aab2dd}',
          '.qp2-btn.good{background:#0f5132;border-color:#34d399;color:#fff}',
          '.qp2-btn.bad{background:#6b1d2b;border-color:#fb7185;color:#fff}',
          '.qp2-btn.dim{opacity:.4}',
          '.qp2-fb{min-height:24px;text-align:center;font-weight:800;font-size:1rem}'
        ].join('\n');

        var wrap = document.createElement('div'); wrap.className = 'qp2-wrap';

        var top = document.createElement('div'); top.className = 'qp2-top';
        var counter = document.createElement('div');
        var tally = document.createElement('div'); tally.textContent = '✓ 0';
        top.appendChild(counter); top.appendChild(tally);

        var track = document.createElement('div'); track.className = 'qp2-track';
        var fill = document.createElement('div'); fill.className = 'qp2-fill';
        track.appendChild(fill);

        var qText = document.createElement('div'); qText.className = 'qp2-q';

        var grid = document.createElement('div'); grid.className = 'qp2-grid';
        var btns = [];
        for (var i = 0; i < 4; i++) {
          (function (idx) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'qp2-btn';
            var k = document.createElement('span'); k.className = 'k'; k.textContent = String(idx + 1);
            var t = document.createElement('span');
            b.appendChild(k); b.appendChild(t);
            b.addEventListener('click', function () { answer(g, idx); });
            grid.appendChild(b);
            btns.push({ el: b, txt: t });
          })(i);
        }

        var fb = document.createElement('div'); fb.className = 'qp2-fb';

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
          els.btns[i].el.className = 'qp2-btn';
          els.btns[i].txt.textContent = opts[i].t;
        }
        d.item = item;
        d.timer = QT; d.prevSec = QT; d.low = false;
        d.phase = 'ask';
        els.fill.className = 'qp2-fill';
        els.fill.style.width = '100%';
        els.qText.textContent = item.q;
        els.counter.textContent = 'Question ' + (d.idx + 1) + ' of ' + PER_RUN;
        els.tally.textContent = '✓ ' + d.correct;
        els.fb.textContent = '';
      }

      function dimOthers(keepA, keepB) {
        for (var i = 0; i < 4; i++) {
          if (i !== keepA && i !== keepB) els.btns[i].el.className = 'qp2-btn dim';
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
          els.btns[pick].el.className = 'qp2-btn good';
          dimOthers(pick, -1);
          els.fb.textContent = '+' + pts + (streakBonus ? '  ·  streak ×' + d.streak : '');
          els.fb.style.color = '#34d399';
          Milo.sound.coin();
          d.phase = 'reveal'; d.wait = .75;
        } else {
          d.lives--; d.streak = 0;
          g.set('Streak', 0);
          g.set('Lives', hearts(d.lives));
          if (pick >= 0) els.btns[pick].el.className = 'qp2-btn bad';
          els.btns[d.correctIdx].el.className = 'qp2-btn good';
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
        st.textContent = '@keyframes qp2fall{0%{transform:translateY(-30px) rotate(0deg);opacity:1}' +
          '100%{transform:translateY(110vh) rotate(660deg);opacity:.65}}';
        layer.appendChild(st);
        var palette = [c0, c1, '#fbbf24', '#34d399', '#fb7185', '#60a5fa', '#f9fafb'];
        for (var i = 0; i < 90; i++) {
          var p = document.createElement('div');
          var s = 6 + ((Math.random() * 7) | 0);
          p.style.cssText = 'position:absolute;top:-24px;left:' + (Math.random() * 100).toFixed(1) + '%;' +
            'width:' + s + 'px;height:' + Math.max(4, (s * .62) | 0) + 'px;border-radius:2px;' +
            'background:' + palette[(Math.random() * palette.length) | 0] + ';' +
            'animation:qp2fall ' + (1.7 + Math.random() * 1.6).toFixed(2) + 's linear ' +
            (Math.random() * .9).toFixed(2) + 's both';
          layer.appendChild(p);
        }
        g.hud.appendChild(layer);
        setTimeout(function () { if (layer.parentNode) layer.parentNode.removeChild(layer); }, 4500);
      }

      return Milo.domGame(host, {
        id: meta.id,
        bg: '#101430',
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
            if (d.timer < 4 && !d.low) { d.low = true; els.fill.className = 'qp2-fill low'; }
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
    id: 'quiz-world-capitals', title: 'World Capitals Quiz', emo: '🏛',
    tagline: 'From Madrid to Mexico City in 12 stops',
    desc: 'A round-the-world capital check: Madrid and Lisbon, Cairo and Nairobi, Seoul, Bangkok ' +
      'and the Nordic trio of Stockholm, Oslo and Helsinki. Twelve capitals a run against a ' +
      '15-second bar, with speed and streak bonuses stacking on the base +100. Miss one and the ' +
      'right city flashes up before the next border crossing.',
    colors: ['#6366f1', '#f472b6'],
    tags: ['trivia', 'quiz', 'geography', 'capitals'],
    bank: [
      Q('What is the capital of Spain?', 'Madrid', 'Barcelona', 'Seville', 'Valencia'),
      Q('What is the capital of Germany?', 'Berlin', 'Munich', 'Hamburg', 'Frankfurt'),
      Q('What is the capital of Italy?', 'Rome', 'Milan', 'Venice', 'Naples'),
      Q('What is the capital of Russia?', 'Moscow', 'St. Petersburg', 'Kyiv', 'Minsk'),
      Q('What is the capital of Egypt?', 'Cairo', 'Alexandria', 'Giza', 'Luxor'),
      Q('What is the capital of Iceland?', 'Reykjavik', 'Oslo', 'Helsinki', 'Nuuk'),
      Q('What is the capital of Peru?', 'Lima', 'Cusco', 'Quito', 'Bogotá'),
      Q('What is the capital of Chile?', 'Santiago', 'Lima', 'Buenos Aires', 'Quito'),
      Q('What is the capital of Argentina?', 'Buenos Aires', 'Santiago', 'Montevideo', 'Córdoba'),
      Q('What is the capital of Greece?', 'Athens', 'Thessaloniki', 'Patras', 'Sparta'),
      Q('What is the capital of Portugal?', 'Lisbon', 'Porto', 'Madrid', 'Seville'),
      Q('What is the capital of Sweden?', 'Stockholm', 'Oslo', 'Copenhagen', 'Helsinki'),
      Q('What is the capital of Norway?', 'Oslo', 'Stockholm', 'Bergen', 'Copenhagen'),
      Q('What is the capital of Finland?', 'Helsinki', 'Oslo', 'Stockholm', 'Copenhagen'),
      Q('What is the capital of South Korea?', 'Seoul', 'Busan', 'Pyongyang', 'Incheon'),
      Q('What is the capital of Mexico?', 'Mexico City', 'Guadalajara', 'Cancún', 'Monterrey'),
      Q('What is the capital of Kenya?', 'Nairobi', 'Mombasa', 'Kampala', 'Addis Ababa'),
      Q('What is the capital of Thailand?', 'Bangkok', 'Hanoi', 'Phuket', 'Chiang Mai'),
      Q('What is the capital of Austria?', 'Vienna', 'Salzburg', 'Zurich', 'Prague'),
      Q('What is the capital of Ireland?', 'Dublin', 'Belfast', 'Cork', 'Edinburgh')
    ]
  });

  makeQuiz({
    id: 'quiz-europe', title: 'Europe Quiz', emo: '🏰',
    tagline: 'Fjords, gondolas and the boot of Italy',
    desc: 'Europe from the Pyrenees to the Bosporus: the boot-shaped country, the canals of Venice, ' +
      'Norwegian fjords, the Danube\'s path to the Black Sea and which trio makes up Scandinavia. ' +
      'Answer inside 15 seconds for a speed bonus, and guard your three lives — streaks are where ' +
      'the big points pile up.',
    colors: ['#2563eb', '#fbbf24'],
    tags: ['trivia', 'quiz', 'geography', 'europe'],
    bank: [
      Q('The Pyrenees mountains separate France from which country?', 'Spain', 'Italy', 'Germany', 'Switzerland'),
      Q('Which European country is shaped like a boot?', 'Italy', 'Greece', 'Portugal', 'Norway'),
      Q('The Rhine river empties into which sea?', 'The North Sea', 'The Baltic Sea', 'The Mediterranean', 'The Black Sea'),
      Q('The Danube river empties into which sea?', 'The Black Sea', 'The Mediterranean', 'The Baltic Sea', 'The North Sea'),
      Q('Amsterdam is the capital of which country?', 'The Netherlands', 'Belgium', 'Denmark', 'Austria'),
      Q('Which European city is famous for canals and gondolas?', 'Venice', 'Vienna', 'Prague', 'Lisbon'),
      Q('Which strait separates Europe from Africa?', 'The Strait of Gibraltar', 'The Bosporus', 'The English Channel', 'The Dardanelles'),
      Q('Istanbul straddles which strait between Europe and Asia?', 'The Bosporus', 'The Strait of Gibraltar', 'The English Channel', 'The Strait of Messina'),
      Q('Which sea lies between Italy and the Balkan Peninsula?', 'The Adriatic Sea', 'The Baltic Sea', 'The North Sea', 'The Bay of Biscay'),
      Q('Norway, Sweden and which country make up Scandinavia?', 'Denmark', 'Finland', 'Iceland', 'The Netherlands'),
      Q('Which country is famous for the fjords of Bergen and Geiranger?', 'Norway', 'Switzerland', 'Scotland', 'Iceland'),
      Q('Mont Blanc is the highest peak of which mountain range?', 'The Alps', 'The Pyrenees', 'The Carpathians', 'The Urals'),
      Q('Which volcanic island country in the North Atlantic is famous for geysers?', 'Iceland', 'Ireland', 'Greenland', 'Norway'),
      Q('Which European capital sits on the River Thames?', 'London', 'Dublin', 'Paris', 'Amsterdam'),
      Q('Paris stands on which river?', 'The Seine', 'The Loire', 'The Rhône', 'The Danube'),
      Q('Warsaw is the capital of which country?', 'Poland', 'Hungary', 'Romania', 'Ukraine'),
      Q('Budapest is the capital of which country?', 'Hungary', 'Romania', 'Bulgaria', 'Austria'),
      Q('Which European country is famous for tulips and windmills?', 'The Netherlands', 'Belgium', 'Denmark', 'Germany'),
      Q('Which island country lies just west of Great Britain?', 'Ireland', 'Iceland', 'Malta', 'Cyprus'),
      Q('The ancient Acropolis overlooks which European capital?', 'Athens', 'Rome', 'Lisbon', 'Madrid')
    ]
  });

  makeQuiz({
    id: 'quiz-asia', title: 'Asia Quiz', emo: '⛩',
    tagline: 'From Mount Fuji to the Malay Peninsula',
    desc: 'The biggest continent in twelve questions: Mount Fuji, the Gobi Desert, the old kingdom ' +
      'of Siam, Kyoto\'s imperial past and the islands of Java, Sumatra and Sri Lanka. Every fast ' +
      'answer is worth up to +150 before the streak bonus even starts. Three misses and the ' +
      'expedition is over.',
    colors: ['#dc2626', '#f59e0b'],
    tags: ['trivia', 'quiz', 'geography', 'asia'],
    bank: [
      Q('Mount Fuji is an iconic volcano in which country?', 'Japan', 'China', 'South Korea', 'Vietnam'),
      Q('Which desert covers much of Mongolia and northern China?', 'The Gobi', 'The Sahara', 'The Thar', 'The Kalahari'),
      Q('Which country was formerly called Siam?', 'Thailand', 'Vietnam', 'Cambodia', 'Myanmar'),
      Q('Java and Sumatra are major islands of which country?', 'Indonesia', 'The Philippines', 'Malaysia', 'India'),
      Q('Beijing is the capital of which country?', 'China', 'Japan', 'South Korea', 'Vietnam'),
      Q('Which Japanese city was the country\'s imperial capital for over 1,000 years?', 'Kyoto', 'Tokyo', 'Osaka', 'Sapporo'),
      Q('The Forbidden City palace complex is in which city?', 'Beijing', 'Shanghai', 'Xi\'an', 'Nanjing'),
      Q('Which country shares the Korean Peninsula with South Korea?', 'North Korea', 'China', 'Japan', 'Mongolia'),
      Q('Which Asian country is nicknamed the Land of the Rising Sun?', 'Japan', 'China', 'Thailand', 'India'),
      Q('Ulaanbaatar is the capital of which country?', 'Mongolia', 'Kazakhstan', 'Nepal', 'Laos'),
      Q('Which city-state sits at the southern tip of the Malay Peninsula?', 'Singapore', 'Hong Kong', 'Macau', 'Brunei'),
      Q('Luzon and Mindanao are the two biggest islands of which country?', 'The Philippines', 'Indonesia', 'Malaysia', 'Japan'),
      Q('Mount Everest sits on the border of Nepal and which country?', 'China', 'India', 'Bhutan', 'Pakistan'),
      Q('Which island nation lies off the southern tip of India?', 'Sri Lanka', 'The Maldives', 'Madagascar', 'Fiji'),
      Q('What is the capital of Malaysia?', 'Kuala Lumpur', 'Jakarta', 'Singapore', 'Bangkok'),
      Q('The temple complex of Angkor Wat is in which country?', 'Cambodia', 'Thailand', 'Vietnam', 'Laos'),
      Q('Which vast Russian region stretches across northern Asia?', 'Siberia', 'Mongolia', 'Manchuria', 'The Caucasus'),
      Q('Kathmandu is the capital of which country?', 'Nepal', 'Bhutan', 'Bangladesh', 'Tibet'),
      Q('The ancient Silk Road connected China with which continent\'s markets?', 'Europe', 'Australia', 'South America', 'Antarctica'),
      Q('Saudi Arabia and Yemen occupy most of which peninsula?', 'The Arabian Peninsula', 'The Sinai Peninsula', 'The Malay Peninsula', 'The Korean Peninsula')
    ]
  });

  makeQuiz({
    id: 'quiz-africa', title: 'Africa Quiz', emo: '🌍',
    tagline: 'Kilimanjaro, the Nile and the Okavango',
    desc: 'Fifty-four countries, one quiz: Kilimanjaro and Lake Victoria, Victoria Falls on the ' +
      'Zambia–Zimbabwe border, Timbuktu, the Okavango Delta and the Suez Canal. +100 per correct ' +
      'with up to +50 for speed, and a streak bonus that grows every consecutive hit. The bank is ' +
      'deeper than one run, so replays keep asking new things.',
    colors: ['#ea580c', '#facc15'],
    tags: ['trivia', 'quiz', 'geography', 'africa'],
    bank: [
      Q('Which is the largest country in Africa by area?', 'Algeria', 'Sudan', 'DR Congo', 'Libya'),
      Q('Which African country has the largest population?', 'Nigeria', 'Egypt', 'Ethiopia', 'South Africa'),
      Q('Mount Kilimanjaro is in which country?', 'Tanzania', 'Kenya', 'Uganda', 'Ethiopia'),
      Q('The Nile flows north into which sea?', 'The Mediterranean', 'The Red Sea', 'The Black Sea', 'The Indian Ocean'),
      Q('Victoria Falls lies on the border of Zambia and which country?', 'Zimbabwe', 'Botswana', 'Mozambique', 'Angola'),
      Q('What is the largest lake in Africa?', 'Lake Victoria', 'Lake Tanganyika', 'Lake Malawi', 'Lake Chad'),
      Q('Casablanca is the largest city of which country?', 'Morocco', 'Algeria', 'Tunisia', 'Egypt'),
      Q('Which island nation off Africa\'s southeast coast is famous for lemurs?', 'Madagascar', 'The Seychelles', 'Mauritius', 'The Comoros'),
      Q('Cape Town sits near which famous cape?', 'The Cape of Good Hope', 'Cape Horn', 'Cape Verde', 'Cape Cod'),
      Q('The Maasai Mara wildlife reserve is in which country?', 'Kenya', 'Tanzania', 'Uganda', 'Zambia'),
      Q('Timbuktu, the ancient trading city, is in which country?', 'Mali', 'Niger', 'Chad', 'Morocco'),
      Q('Which canal connects the Mediterranean to the Red Sea?', 'The Suez Canal', 'The Panama Canal', 'The Corinth Canal', 'The Kiel Canal'),
      Q('Dakar is the capital of which country?', 'Senegal', 'Mali', 'Ivory Coast', 'Guinea'),
      Q('Which two oceans meet near the southern tip of Africa?', 'The Atlantic and Indian', 'The Atlantic and Pacific', 'The Indian and Pacific', 'The Atlantic and Arctic'),
      Q('The Okavango Delta, a huge inland wetland, is in which country?', 'Botswana', 'Namibia', 'Zambia', 'South Africa'),
      Q('Addis Ababa is the capital of which country?', 'Ethiopia', 'Eritrea', 'Somalia', 'Kenya'),
      Q('The Atlas Mountains stretch across Morocco and which neighbour?', 'Algeria', 'Egypt', 'Mali', 'Libya'),
      Q('Lake Victoria is a main source of which great river?', 'The Nile', 'The Congo', 'The Zambezi', 'The Niger'),
      Q('Accra is the capital of which country?', 'Ghana', 'Ivory Coast', 'Senegal', 'Cameroon'),
      Q('The Sahel is a semi-arid belt just south of which desert?', 'The Sahara', 'The Kalahari', 'The Namib', 'The Karoo')
    ]
  });

  makeQuiz({
    id: 'quiz-americas', title: 'The Americas Quiz', emo: '🌎',
    tagline: 'Andes to Niagara, pole to pole',
    desc: 'Two continents in one run: the Andes down the Pacific coast, the Amazon through Brazil, ' +
      'Machu Picchu, Patagonia, Lake Titicaca and the Panama Canal stitching the oceans together. ' +
      'Quick answers bank the +50 speed bonus; three wrong answers strands the expedition. Watch ' +
      'for the Caribbean capitals — they trip up most first runs.',
    colors: ['#059669', '#38bdf8'],
    tags: ['trivia', 'quiz', 'geography', 'americas'],
    bank: [
      Q('Which mountain range runs down South America\'s west coast?', 'The Andes', 'The Rockies', 'The Alps', 'The Appalachians'),
      Q('The Amazon River flows mainly through which country?', 'Brazil', 'Argentina', 'Chile', 'Colombia'),
      Q('Niagara Falls sits on the border of Canada and which country?', 'The United States', 'Mexico', 'Greenland', 'France'),
      Q('Which language is most widely spoken in Brazil?', 'Portuguese', 'Spanish', 'English', 'French'),
      Q('The Panama Canal links the Atlantic with which ocean?', 'The Pacific', 'The Indian', 'The Arctic', 'The Southern'),
      Q('The mountain citadel of Machu Picchu is in which country?', 'Peru', 'Mexico', 'Chile', 'Bolivia'),
      Q('Which country is home to the Galápagos Islands?', 'Ecuador', 'Peru', 'Chile', 'Mexico'),
      Q('Patagonia spans Argentina and which other country?', 'Chile', 'Brazil', 'Peru', 'Uruguay'),
      Q('Which is the largest country in South America?', 'Brazil', 'Argentina', 'Peru', 'Colombia'),
      Q('The Aztec civilisation flourished in which modern country?', 'Mexico', 'Peru', 'Guatemala', 'Colombia'),
      Q('What is the capital of Cuba?', 'Havana', 'Santiago', 'San Juan', 'Kingston'),
      Q('Which cape marks the southern tip of South America?', 'Cape Horn', 'The Cape of Good Hope', 'Cape Canaveral', 'Cape Cod'),
      Q('Which North American country has Spanish as its main language?', 'Mexico', 'Canada', 'The United States', 'Belize'),
      Q('What is the capital of Jamaica?', 'Kingston', 'Havana', 'Nassau', 'Port-au-Prince'),
      Q('Angel Falls, the world\'s tallest waterfall, is in which country?', 'Venezuela', 'Brazil', 'Guyana', 'Colombia'),
      Q('Greenland is a territory of which country?', 'Denmark', 'Canada', 'Norway', 'Iceland'),
      Q('Which great river drains the plains of the central United States?', 'The Mississippi', 'The Colorado', 'The Hudson', 'The Rio Grande'),
      Q('Lake Titicaca lies between Peru and which country?', 'Bolivia', 'Chile', 'Ecuador', 'Argentina'),
      Q('Which Central American country joins North and South America?', 'Panama', 'Costa Rica', 'Nicaragua', 'Honduras'),
      Q('Toronto and Vancouver are major cities of which country?', 'Canada', 'The United States', 'The United Kingdom', 'Australia')
    ]
  });
})();
