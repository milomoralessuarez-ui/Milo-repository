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

  makeQuiz({
    id: 'quiz-world-flags', title: 'World Flags Quiz', emo: '🚩',
    tagline: 'Name the country from its flag, described in words',
    desc: 'Every flag is painted in words: the red circle on white, the maple leaf, the eagle ' +
      'eating a snake on a cactus, and the only non-rectangular national flag on Earth. Crescents, ' +
      'Nordic crosses and near-identical tricolours hide plenty of lookalikes, so read the whole ' +
      'description before the 15-second bar drains.',
    colors: ['#e11d48', '#3b82f6'],
    tags: ['trivia', 'quiz', 'geography', 'flags'],
    bank: [
      Q('Which country\'s flag is a plain red circle on a white background?', 'Japan', 'China', 'South Korea', 'Bangladesh'),
      Q('Which country\'s flag is a red maple leaf between two red bands?', 'Canada', 'The United States', 'Switzerland', 'Denmark'),
      Q('Which country\'s flag is a square red flag with a white cross?', 'Switzerland', 'Denmark', 'Norway', 'England'),
      Q('Which country\'s flag is red with a white off-centre Nordic cross?', 'Denmark', 'Switzerland', 'Sweden', 'Austria'),
      Q('Which country\'s flag shows the Union Jack with four red five-pointed stars?', 'New Zealand', 'Australia', 'Fiji', 'The United Kingdom'),
      Q('Which country\'s flag pairs the Union Jack with a large seven-pointed white star?', 'Australia', 'New Zealand', 'Canada', 'South Africa'),
      Q('Which country\'s flag is a horizontal bicolour, blue over yellow?', 'Ukraine', 'Sweden', 'Romania', 'Colombia'),
      Q('Which country\'s flag shows a red dragon on green and white?', 'Wales', 'Scotland', 'Bhutan', 'China'),
      Q('Which country\'s flag shows an eagle eating a snake while perched on a cactus?', 'Mexico', 'Egypt', 'Spain', 'Albania'),
      Q('Which country\'s flag is red with one large gold star and four smaller ones?', 'China', 'Vietnam', 'Turkey', 'North Korea'),
      Q('Which country\'s flag is red with a white crescent moon and star?', 'Turkey', 'Tunisia', 'Pakistan', 'Algeria'),
      Q('Which country\'s flag has a green cedar tree at its centre?', 'Lebanon', 'Syria', 'Cyprus', 'Jordan'),
      Q('Which country flies the only non-rectangular national flag, shaped like two stacked triangles?', 'Nepal', 'Switzerland', 'Bhutan', 'Vatican City'),
      Q('Which country\'s flag shows a blue Star of David between two blue stripes?', 'Israel', 'Greece', 'Argentina', 'Finland'),
      Q('Which country\'s flag is three horizontal bands of black, red and gold?', 'Germany', 'Belgium', 'Spain', 'The Netherlands'),
      Q('Which country\'s flag is a vertical tricolour of green, white and orange?', 'Ireland', 'Italy', 'India', 'France'),
      Q('Which country\'s flag is a plain vertical tricolour of green, white and red?', 'Italy', 'Mexico', 'Hungary', 'Bulgaria'),
      Q('Which country\'s flag has light blue and white bands with a golden sun in the middle?', 'Argentina', 'Uruguay', 'Greece', 'Honduras'),
      Q('Which country\'s flag carries 50 white stars?', 'The United States', 'Brazil', 'Australia', 'Chile'),
      Q('Which country\'s flag is green with a yellow diamond around a blue globe?', 'Brazil', 'Jamaica', 'Portugal', 'South Africa'),
      Q('Which country\'s flag is orange, white and green with a wheel at the centre?', 'India', 'Ireland', 'Niger', 'Ivory Coast'),
      Q('Which country\'s flag is the red cross of St George on white?', 'England', 'Denmark', 'Georgia', 'Switzerland')
    ]
  });

  makeQuiz({
    id: 'quiz-landmarks', title: 'Landmarks Quiz', emo: '🗼',
    tagline: 'Eiffel Tower to Angkor Wat in one sprint',
    desc: 'A postcard rack of famous places: the Eiffel Tower and the Colosseum, the Taj Mahal at ' +
      'Agra, Petra\'s rose-red cliffs, Machu Picchu, Stonehenge and the Golden Gate Bridge. Twelve ' +
      'landmarks per run against the 15-second bar, with speed and streak bonuses stacking on the ' +
      'base +100 and three lives between you and the exit.',
    colors: ['#8b5cf6', '#f97316'],
    tags: ['trivia', 'quiz', 'geography', 'landmarks'],
    bank: [
      Q('The Eiffel Tower stands beside the Seine in which city?', 'Paris', 'Lyon', 'Brussels', 'Marseille'),
      Q('The Colosseum, the great Roman amphitheatre, is in which city?', 'Rome', 'Athens', 'Naples', 'Verona'),
      Q('The Statue of Liberty was a gift to the USA from which country?', 'France', 'The United Kingdom', 'Italy', 'Spain'),
      Q('The Great Wall winds across the north of which country?', 'China', 'India', 'Mongolia', 'Japan'),
      Q('The Taj Mahal stands in which Indian city?', 'Agra', 'Delhi', 'Mumbai', 'Jaipur'),
      Q('The statue of Christ the Redeemer overlooks which city?', 'Rio de Janeiro', 'São Paulo', 'Buenos Aires', 'Lisbon'),
      Q('The Sydney Opera House, with its sail-shaped roof, is in which country?', 'Australia', 'New Zealand', 'Canada', 'Denmark'),
      Q('Big Ben is the great bell of the clock at which building?', 'The Palace of Westminster', 'Buckingham Palace', 'St Paul\'s Cathedral', 'The Tower of London'),
      Q('The famous Leaning Tower is in which Italian city?', 'Pisa', 'Venice', 'Florence', 'Siena'),
      Q('The Kremlin fortress and Red Square are in which city?', 'Moscow', 'St. Petersburg', 'Kyiv', 'Warsaw'),
      Q('The Parthenon temple crowns the Acropolis of which city?', 'Athens', 'Rome', 'Istanbul', 'Alexandria'),
      Q('Gaudí\'s still-unfinished Sagrada Família church rises over which city?', 'Barcelona', 'Madrid', 'Seville', 'Lisbon'),
      Q('Machu Picchu was built by which civilisation?', 'The Inca', 'The Aztec', 'The Maya', 'The Olmec'),
      Q('The Great Sphinx of Giza has a human head on the body of which animal?', 'A lion', 'A horse', 'A bull', 'An eagle'),
      Q('Petra, a city carved into rose-red cliffs, is in which country?', 'Jordan', 'Egypt', 'Greece', 'Morocco'),
      Q('The Brandenburg Gate is the landmark of which capital?', 'Berlin', 'Vienna', 'Munich', 'Amsterdam'),
      Q('Mount Rushmore\'s four carved presidents are in which US state?', 'South Dakota', 'Wyoming', 'Montana', 'Colorado'),
      Q('The Golden Gate Bridge spans the bay of which city?', 'San Francisco', 'New York', 'Los Angeles', 'Seattle'),
      Q('The vast temple complex of Angkor Wat is in which country?', 'Cambodia', 'Thailand', 'Vietnam', 'Indonesia'),
      Q('The prehistoric stone circle of Stonehenge stands in which country?', 'England', 'Scotland', 'Ireland', 'Wales'),
      Q('The Burj Khalifa, the world\'s tallest building, is in which city?', 'Dubai', 'Abu Dhabi', 'Doha', 'Riyadh')
    ]
  });

  makeQuiz({
    id: 'quiz-rivers', title: 'Rivers Quiz', emo: '🏞',
    tagline: 'Follow the Nile, Amazon and Danube to the sea',
    desc: 'Twelve questions floating downstream: the Seine through Paris, the Danube through Vienna ' +
      'and Budapest, the Colorado carving the Grand Canyon, the Zambezi at Victoria Falls and the ' +
      'Volga\'s claim as Europe\'s longest. Speed pays up to +50 on top of the +100, and a wrong ' +
      'answer always flashes the right river before you drift on.',
    colors: ['#0ea5e9', '#34d399'],
    tags: ['trivia', 'quiz', 'geography', 'rivers'],
    bank: [
      Q('Which river flows through the heart of Paris?', 'The Seine', 'The Loire', 'The Rhône', 'The Danube'),
      Q('Which river flows through London?', 'The Thames', 'The Severn', 'The Mersey', 'The Trent'),
      Q('Which river carries more water than any other on Earth?', 'The Amazon', 'The Nile', 'The Mississippi', 'The Yangtze'),
      Q('Which is the longest river in Europe?', 'The Volga', 'The Danube', 'The Rhine', 'The Loire'),
      Q('Which river flows through both Vienna and Budapest?', 'The Danube', 'The Rhine', 'The Elbe', 'The Volga'),
      Q('The Grand Canyon was carved by which river?', 'The Colorado', 'The Mississippi', 'The Rio Grande', 'The Missouri'),
      Q('Which river forms much of the border between the USA and Mexico?', 'The Rio Grande', 'The Colorado', 'The Mississippi', 'The Hudson'),
      Q('The sacred Ganges flows past Varanasi in which country?', 'India', 'Nepal', 'Pakistan', 'Sri Lanka'),
      Q('Which river runs through Cairo on its way to the Mediterranean?', 'The Nile', 'The Tigris', 'The Euphrates', 'The Jordan'),
      Q('The Yangtze, Asia\'s longest river, flows through which country?', 'China', 'India', 'Vietnam', 'Russia'),
      Q('Which river flows through Rome?', 'The Tiber', 'The Po', 'The Arno', 'The Adige'),
      Q('The Mekong Delta, a maze of rice paddies and waterways, is in which country?', 'Vietnam', 'Thailand', 'Cambodia', 'Laos'),
      Q('Victoria Falls thunders on which African river?', 'The Zambezi', 'The Nile', 'The Congo', 'The Niger'),
      Q('Which castle-lined river flows past Cologne on its way to the North Sea?', 'The Rhine', 'The Danube', 'The Elbe', 'The Seine'),
      Q('The Mississippi empties into which body of water?', 'The Gulf of Mexico', 'The Atlantic Ocean', 'The Caribbean Sea', 'Hudson Bay'),
      Q('The Orinoco river flows mainly through which country?', 'Venezuela', 'Brazil', 'Peru', 'Argentina'),
      Q('Which river flows through Baghdad?', 'The Tigris', 'The Nile', 'The Jordan', 'The Indus'),
      Q('The Amazon empties into which ocean?', 'The Atlantic', 'The Pacific', 'The Indian', 'The Arctic'),
      Q('The Po, which waters Italy\'s northern plain, is the longest river of which country?', 'Italy', 'Spain', 'France', 'Greece'),
      Q('The Murray, the longest river of its continent, flows through which country?', 'Australia', 'South Africa', 'Brazil', 'Canada'),
      Q('Which river runs along the west side of Manhattan in New York?', 'The Hudson', 'The Potomac', 'The Charles', 'The Delaware')
    ]
  });

  makeQuiz({
    id: 'quiz-mountains', title: 'Mountains Quiz', emo: '🏔',
    tagline: 'Everest, K2 and the ranges that hold them',
    desc: 'High-altitude trivia: Everest and the Himalayas, K2 in the Karakoram, Mont Blanc, ' +
      'Kilimanjaro, the Matterhorn on the Swiss-Italian border and Vesuvius burying Pompeii. ' +
      'Answer fast for the +50 speed bonus and keep the streak alive — three slips and the ' +
      'expedition turns back.',
    colors: ['#64748b', '#e0e7ff'],
    tags: ['trivia', 'quiz', 'geography', 'mountains'],
    bank: [
      Q('What is the highest mountain above sea level on Earth?', 'Mount Everest', 'K2', 'Kangchenjunga', 'Denali'),
      Q('Mount Everest rises in which mountain range?', 'The Himalayas', 'The Karakoram', 'The Andes', 'The Alps'),
      Q('Which peak is the highest in the Alps?', 'Mont Blanc', 'The Matterhorn', 'The Eiger', 'Monte Rosa'),
      Q('What is the highest mountain in Africa?', 'Kilimanjaro', 'Mount Kenya', 'Mount Elgon', 'Ras Dashen'),
      Q('Mount Fuji is the highest peak of which country?', 'Japan', 'China', 'South Korea', 'Taiwan'),
      Q('K2, the world\'s second-highest mountain, is in which range?', 'The Karakoram', 'The Himalayas', 'The Hindu Kush', 'The Pamirs'),
      Q('The Matterhorn stands on the border of Switzerland and which country?', 'Italy', 'France', 'Austria', 'Germany'),
      Q('Denali is the highest peak of which continent?', 'North America', 'South America', 'Europe', 'Australia'),
      Q('Aconcagua, the highest peak outside Asia, is in which country?', 'Argentina', 'Chile', 'Peru', 'Bolivia'),
      Q('Which range runs down the spine of the Italian peninsula?', 'The Apennines', 'The Alps', 'The Pyrenees', 'The Dolomites'),
      Q('Flat-topped Table Mountain looms over which city?', 'Cape Town', 'Rio de Janeiro', 'Sydney', 'Nairobi'),
      Q('Mount Vesuvius buried which Roman town in ash in AD 79?', 'Pompeii', 'Ostia', 'Ravenna', 'Capri'),
      Q('The Rocky Mountains run through Canada and which country?', 'The United States', 'Mexico', 'Greenland', 'Russia'),
      Q('Which range is the traditional boundary between Europe and Asia in Russia?', 'The Urals', 'The Alps', 'The Caucasus', 'The Carpathians'),
      Q('Mount Olympus, mythical home of the Greek gods, is in which country?', 'Greece', 'Turkey', 'Italy', 'Cyprus'),
      Q('Sagarmatha is the Nepali name for which mountain?', 'Mount Everest', 'K2', 'Annapurna', 'Kangchenjunga'),
      Q('Ben Nevis, the highest peak in the UK, stands in which of its nations?', 'Scotland', 'Wales', 'England', 'Northern Ireland'),
      Q('Mount Elbrus, Europe\'s highest summit, is in which range?', 'The Caucasus', 'The Alps', 'The Urals', 'The Pyrenees'),
      Q('The giant volcanoes Mauna Kea and Mauna Loa are in which US state?', 'Hawaii', 'Alaska', 'Washington', 'California'),
      Q('The Eiger and the Jungfrau are famous peaks of which country?', 'Switzerland', 'Austria', 'France', 'Norway')
    ]
  });

  makeQuiz({
    id: 'quiz-islands', title: 'Islands Quiz', emo: '🏝',
    tagline: 'Greenland to Bali without getting your feet wet',
    desc: 'Island-hopping trivia: Greenland\'s claim as the world\'s largest, Sicily topping the ' +
      'Mediterranean, Honshu and Borneo, Corsica as Napoleon\'s birthplace and the island once ' +
      'called Ceylon. Each correct answer inside the 15-second bar banks +100 plus speed and ' +
      'streak bonuses; three wrecks and the voyage ends.',
    colors: ['#14b8a6', '#fde047'],
    tags: ['trivia', 'quiz', 'geography', 'islands'],
    bank: [
      Q('What is the largest island in the world?', 'Greenland', 'Madagascar', 'Borneo', 'New Guinea'),
      Q('Which big island nation lies off the southeast coast of Africa?', 'Madagascar', 'The Seychelles', 'Mauritius', 'The Comoros'),
      Q('Honshu is the largest island of which country?', 'Japan', 'The Philippines', 'Indonesia', 'New Zealand'),
      Q('Which is the largest island in the Mediterranean?', 'Sicily', 'Sardinia', 'Cyprus', 'Crete'),
      Q('Bali is a famous resort island of which country?', 'Indonesia', 'Thailand', 'Malaysia', 'The Philippines'),
      Q('Tasmania is an island state of which country?', 'Australia', 'New Zealand', 'The United Kingdom', 'Canada'),
      Q('Which two main islands make up most of New Zealand?', 'The North and South Islands', 'The East and West Islands', 'The Upper and Lower Islands', 'The Windward and Leeward Islands'),
      Q('Corsica, Napoleon\'s birthplace, belongs to which country?', 'France', 'Italy', 'Spain', 'Greece'),
      Q('Crete is the largest island of which country?', 'Greece', 'Italy', 'Turkey', 'Cyprus'),
      Q('Borneo is shared by Malaysia, Brunei and which country?', 'Indonesia', 'The Philippines', 'Thailand', 'Vietnam'),
      Q('Greenland is an autonomous territory of which country?', 'Denmark', 'Canada', 'Norway', 'Iceland'),
      Q('The Canary Islands belong to which country?', 'Spain', 'Portugal', 'Morocco', 'Italy'),
      Q('The Azores, far out in the Atlantic, belong to which country?', 'Portugal', 'Spain', 'France', 'The United Kingdom'),
      Q('Which island country was formerly called Ceylon?', 'Sri Lanka', 'The Maldives', 'Madagascar', 'Fiji'),
      Q('The Galápagos Islands, famed for giant tortoises, belong to which country?', 'Ecuador', 'Peru', 'Chile', 'Mexico'),
      Q('Majorca (Mallorca) is the largest of which island group?', 'The Balearic Islands', 'The Canary Islands', 'The Azores', 'The Cyclades'),
      Q('Which is the largest island in the Caribbean?', 'Cuba', 'Jamaica', 'Hispaniola', 'Puerto Rico'),
      Q('Which US state is a chain of volcanic islands in the Pacific?', 'Hawaii', 'Alaska', 'Florida', 'California'),
      Q('Great Britain contains England, Scotland and which other nation?', 'Wales', 'Northern Ireland', 'Ireland', 'Cornwall'),
      Q('Sardinia belongs to which country?', 'Italy', 'Spain', 'France', 'Greece')
    ]
  });

  makeQuiz({
    id: 'quiz-us-states', title: 'US States Quiz', emo: '🗽',
    tagline: 'Capitals, nicknames and the fifty-state map',
    desc: 'Coast-to-coast Americana: Sacramento and Austin as sneaky state capitals, the Sunshine ' +
      'and Lone Star nicknames, Alaska\'s size record, Yellowstone in Wyoming and which state ' +
      'joined the Union last. The capital questions are the classic traps — the biggest city is ' +
      'rarely the right answer.',
    colors: ['#b91c1c', '#1d4ed8'],
    tags: ['trivia', 'quiz', 'geography', 'usa', 'states'],
    bank: [
      Q('Which is the largest US state by area?', 'Alaska', 'Texas', 'California', 'Montana'),
      Q('Which is the smallest US state?', 'Rhode Island', 'Delaware', 'Connecticut', 'Hawaii'),
      Q('What is the capital of California?', 'Sacramento', 'Los Angeles', 'San Francisco', 'San Diego'),
      Q('What is the capital of Texas?', 'Austin', 'Houston', 'Dallas', 'San Antonio'),
      Q('What is the capital of New York State?', 'Albany', 'New York City', 'Buffalo', 'Rochester'),
      Q('Which state is nicknamed the Sunshine State?', 'Florida', 'California', 'Arizona', 'Hawaii'),
      Q('Which state is nicknamed the Golden State?', 'California', 'Colorado', 'Nevada', 'Alaska'),
      Q('Which state was the 50th and last to join the Union?', 'Hawaii', 'Alaska', 'Arizona', 'New Mexico'),
      Q('The Grand Canyon is mostly in which state?', 'Arizona', 'Utah', 'Nevada', 'Colorado'),
      Q('Yellowstone National Park is mostly in which state?', 'Wyoming', 'Montana', 'Idaho', 'Colorado'),
      Q('New Orleans and its Mardi Gras are in which state?', 'Louisiana', 'Mississippi', 'Alabama', 'Georgia'),
      Q('Las Vegas is in which state?', 'Nevada', 'Arizona', 'California', 'Utah'),
      Q('Which state is called the Lone Star State?', 'Texas', 'Arizona', 'Oklahoma', 'Kansas'),
      Q('Mount Rushmore is in which state?', 'South Dakota', 'North Dakota', 'Wyoming', 'Montana'),
      Q('Which two states share no border with any other state?', 'Alaska and Hawaii', 'Florida and Maine', 'Texas and California', 'Washington and Oregon'),
      Q('Chicago is the largest city of which state?', 'Illinois', 'Indiana', 'Michigan', 'Ohio'),
      Q('Seattle is the largest city of which state?', 'Washington', 'Oregon', 'California', 'Idaho'),
      Q('Which state was the first to ratify the US Constitution?', 'Delaware', 'Virginia', 'Massachusetts', 'Pennsylvania'),
      Q('Which state is nicknamed the Empire State?', 'New York', 'New Jersey', 'Massachusetts', 'Pennsylvania'),
      Q('Denver, the Mile High City, is the capital of which state?', 'Colorado', 'Utah', 'Wyoming', 'New Mexico'),
      Q('Nashville, the home of country music, is in which state?', 'Tennessee', 'Kentucky', 'Texas', 'Georgia')
    ]
  });

  makeQuiz({
    id: 'quiz-currencies', title: 'Currencies Quiz', emo: '💰',
    tagline: 'Yen, zloty, rand — whose money is it?',
    desc: 'A wallet full of world money: the yen and the won, Switzerland\'s franc, Poland\'s ' +
      'zloty, South Africa\'s rand and what Germany and France spent before the euro. The ' +
      'sound-alike pairs — yen, yuan and won — are where streaks go to die, so slow down half a ' +
      'beat on those.',
    colors: ['#16a34a', '#fbbf24'],
    tags: ['trivia', 'quiz', 'money', 'currencies'],
    bank: [
      Q('What is the currency of Japan?', 'The yen', 'The won', 'The yuan', 'The ringgit'),
      Q('What is the currency of the United Kingdom?', 'The pound sterling', 'The euro', 'The dollar', 'The franc'),
      Q('What is the currency of India?', 'The rupee', 'The rupiah', 'The taka', 'The baht'),
      Q('Which currency is shared by most European Union countries?', 'The euro', 'The franc', 'The mark', 'The ecu'),
      Q('What is the currency of Switzerland?', 'The Swiss franc', 'The euro', 'The krona', 'The schilling'),
      Q('What is the currency of Russia?', 'The ruble', 'The hryvnia', 'The zloty', 'The lev'),
      Q('What is the currency of China?', 'The yuan', 'The yen', 'The won', 'The dong'),
      Q('What is the currency of Mexico?', 'The peso', 'The real', 'The dollar', 'The bolívar'),
      Q('What is the currency of South Korea?', 'The won', 'The yen', 'The yuan', 'The baht'),
      Q('What is the currency of Sweden?', 'The krona', 'The euro', 'The mark', 'The florin'),
      Q('What is the currency of South Africa?', 'The rand', 'The shilling', 'The naira', 'The cedi'),
      Q('What is the currency of Brazil?', 'The real', 'The peso', 'The escudo', 'The bolívar'),
      Q('What is the currency of Turkey?', 'The lira', 'The dinar', 'The drachma', 'The forint'),
      Q('What is the currency of Thailand?', 'The baht', 'The ringgit', 'The dong', 'The kip'),
      Q('Which country uses the zloty?', 'Poland', 'Hungary', 'The Czech Republic', 'Romania'),
      Q('Which country uses the shekel?', 'Israel', 'Egypt', 'Jordan', 'Greece'),
      Q('Which country uses the dong?', 'Vietnam', 'Thailand', 'Laos', 'Cambodia'),
      Q('Which country uses the forint?', 'Hungary', 'Poland', 'Bulgaria', 'Austria'),
      Q('Before adopting the euro, Germany used which currency?', 'The Deutsche Mark', 'The thaler', 'The franc', 'The guilder'),
      Q('Before adopting the euro, France used which currency?', 'The franc', 'The livre', 'The mark', 'The lira'),
      Q('Which country uses the riyal?', 'Saudi Arabia', 'Turkey', 'Israel', 'Morocco'),
      Q('The dirham is the money of the United Arab Emirates and which North African country?', 'Morocco', 'Egypt', 'Tunisia', 'Algeria')
    ]
  });

  makeQuiz({
    id: 'quiz-languages', title: 'Languages Quiz', emo: '🗣',
    tagline: 'Alphabets, scripts and who speaks what',
    desc: 'What the world speaks and how it writes: Portuguese in Brazil, Switzerland\'s fourth ' +
      'language Romansh, the Hangul and Cyrillic alphabets, Swahili in East Africa and where ' +
      'Quechua survives from the Inca Empire. Watch for the invented-language and ' +
      'written-right-to-left questions — easy points if you know them cold.',
    colors: ['#a855f7', '#22d3ee'],
    tags: ['trivia', 'quiz', 'languages', 'world'],
    bank: [
      Q('Which language has the most native speakers in the world?', 'Mandarin Chinese', 'English', 'Spanish', 'Hindi'),
      Q('What is the official language of Brazil?', 'Portuguese', 'Spanish', 'Brazilian', 'Italian'),
      Q('Which language is spoken in Austria?', 'German', 'Austrian', 'French', 'Hungarian'),
      Q('What is the main language of Egypt?', 'Arabic', 'Egyptian', 'French', 'Turkish'),
      Q('Which two languages are official across Canada?', 'English and French', 'English and Spanish', 'French and Inuktitut', 'English only'),
      Q('German, French, Italian and which fourth language are national languages of Switzerland?', 'Romansh', 'Latin', 'Dutch', 'Slovene'),
      Q('Which of these languages is written from right to left?', 'Arabic', 'Greek', 'Hindi', 'Spanish'),
      Q('Which language is official in Spain and most of South America?', 'Spanish', 'Portuguese', 'Catalan', 'Italian'),
      Q('Afrikaans, spoken in South Africa, developed from which European language?', 'Dutch', 'German', 'English', 'Portuguese'),
      Q('The Greek alphabet begins with which letter?', 'Alpha', 'Omega', 'Beta', 'Delta'),
      Q('French, Spanish and Italian all grew out of which ancient language?', 'Latin', 'Greek', 'Sanskrit', 'Phoenician'),
      Q('Hindi is one of the main official languages of which country?', 'India', 'Indonesia', 'Iran', 'Bangladesh'),
      Q('Swahili is a major language of which region?', 'East Africa', 'West Africa', 'North Africa', 'Southeast Asia'),
      Q('Cantonese is the everyday language of which city?', 'Hong Kong', 'Beijing', 'Shanghai', 'Taipei'),
      Q('Japanese writing uses kanji, hiragana and which third script?', 'Katakana', 'Hangul', 'Pinyin', 'Cyrillic'),
      Q('Korean is written in which alphabet?', 'Hangul', 'Kanji', 'Cyrillic', 'Sanskrit'),
      Q('Russian is written in which alphabet?', 'Cyrillic', 'Latin', 'Greek', 'Runic'),
      Q('Quechua, a language of the Inca Empire, is still spoken in which mountains?', 'The Andes', 'The Alps', 'The Himalayas', 'The Rockies'),
      Q('Hebrew is an official language of which country?', 'Israel', 'Egypt', 'Greece', 'Lebanon'),
      Q('English, German and Dutch all belong to which language family?', 'Germanic', 'Romance', 'Slavic', 'Celtic'),
      Q('Which language gave English the words "croissant" and "ballet"?', 'French', 'Italian', 'Spanish', 'German'),
      Q('Esperanto is what kind of language?', 'An invented language', 'An extinct Roman dialect', 'A Chinese dialect', 'A Viking language')
    ]
  });

  makeQuiz({
    id: 'quiz-world-foods', title: 'World Foods Quiz', emo: '🍜',
    tagline: 'Match the dish to its homeland',
    desc: 'A tasting menu of origins: paella from Valencia, pho from Vietnam, goulash from ' +
      'Hungary, kimchi, haggis and the Italian city behind bolognese sauce. Most rounds are ' +
      'dish-to-country, with a few curveballs like what borscht is made from. Answer before the ' +
      'bar empties to stack the speed bonus on your streak.',
    colors: ['#f97316', '#84cc16'],
    tags: ['trivia', 'quiz', 'food', 'world'],
    bank: [
      Q('Sushi originated in which country?', 'Japan', 'China', 'Thailand', 'South Korea'),
      Q('Paella, a saffron rice dish, comes from which region of Spain?', 'Valencia', 'Catalonia', 'Andalusia', 'Galicia'),
      Q('Which country gave the world pizza?', 'Italy', 'Greece', 'The United States', 'France'),
      Q('Croissants and baguettes are staples of which country?', 'France', 'Belgium', 'Italy', 'Austria'),
      Q('Tacos, tortillas and guacamole come from which country?', 'Mexico', 'Spain', 'Peru', 'Brazil'),
      Q('Pad Thai, stir-fried rice noodles, is the signature dish of which country?', 'Thailand', 'Vietnam', 'China', 'Malaysia'),
      Q('Goulash, a paprika-spiced stew, comes from which country?', 'Hungary', 'Poland', 'Germany', 'Russia'),
      Q('Which country is famous for bratwurst, pretzels and sauerkraut?', 'Germany', 'Austria', 'Switzerland', 'The Netherlands'),
      Q('Hummus and falafel are staples of which region\'s cooking?', 'The Middle East', 'Scandinavia', 'The Caribbean', 'East Asia'),
      Q('Kimchi, spicy fermented cabbage, is the national dish of which country?', 'South Korea', 'Japan', 'China', 'Vietnam'),
      Q('Feta cheese and moussaka come from which country?', 'Greece', 'Turkey', 'Italy', 'Lebanon'),
      Q('Borscht is a soup made from which vegetable?', 'Beetroot', 'Potato', 'Pumpkin', 'Carrot'),
      Q('Which country is famous for maple syrup?', 'Canada', 'Norway', 'Russia', 'Switzerland'),
      Q('Dal, naan and biryani belong to which country\'s cuisine?', 'India', 'Thailand', 'Iran', 'Indonesia'),
      Q('Pho, a fragrant noodle soup, comes from which country?', 'Vietnam', 'Thailand', 'China', 'Cambodia'),
      Q('Peking duck is a classic dish of which city?', 'Beijing', 'Shanghai', 'Hong Kong', 'Tokyo'),
      Q('Which country is famous for its chocolate, waffles and hundreds of beers?', 'Belgium', 'France', 'Germany', 'Denmark'),
      Q('Haggis is a traditional dish of which country?', 'Scotland', 'Ireland', 'Wales', 'England'),
      Q('Tapas, churros and gazpacho belong to which country\'s cuisine?', 'Spain', 'Portugal', 'Mexico', 'Italy'),
      Q('Gouda and Edam cheeses are named after towns in which country?', 'The Netherlands', 'Belgium', 'Denmark', 'Switzerland'),
      Q('Cheese fondue is a national dish of which country?', 'Switzerland', 'France', 'Italy', 'Austria'),
      Q('Ceviche, fish cured in citrus juice, is the signature dish of which country?', 'Peru', 'Mexico', 'Spain', 'Portugal'),
      Q('Which Italian city gave its name to bolognese sauce?', 'Bologna', 'Naples', 'Rome', 'Milan'),
      Q('Wiener schnitzel takes its name from which city?', 'Vienna', 'Berlin', 'Zurich', 'Prague')
    ]
  });

  makeQuiz({
    id: 'quiz-festivals', title: 'Festivals Quiz', emo: '🎉',
    tagline: 'Carnival, Diwali and a nationwide water fight',
    desc: 'The world\'s party calendar: Rio\'s Carnival, Oktoberfest in Munich, Diwali and Holi, ' +
      'Thailand\'s Songkran water fight, the Day of the Dead and Pamplona\'s bull run. A few ' +
      'questions dig one layer deeper — the pastry of the Mid-Autumn Festival, the season Nowruz ' +
      'begins — so streaks reward the well-travelled.',
    colors: ['#ec4899', '#8b5cf6'],
    tags: ['trivia', 'quiz', 'festivals', 'culture'],
    bank: [
      Q('Which city\'s Carnival, with its samba parades, is the world\'s most famous?', 'Rio de Janeiro', 'Venice', 'New Orleans', 'Barcelona'),
      Q('Oktoberfest, the giant beer festival, is held in which city?', 'Munich', 'Berlin', 'Vienna', 'Amsterdam'),
      Q('Diwali, the festival of lights, is a major festival of which religion?', 'Hinduism', 'Buddhism', 'Islam', 'Christianity'),
      Q('Chinese New Year is also known as which festival?', 'The Spring Festival', 'The Lantern Festival', 'The Moon Festival', 'The Dragon Festival'),
      Q('La Tomatina, a giant tomato fight, is held in which country?', 'Spain', 'Italy', 'Mexico', 'Portugal'),
      Q('The Day of the Dead honours ancestors in which country?', 'Mexico', 'Spain', 'Brazil', 'Peru'),
      Q('The Running of the Bulls takes place in which Spanish city?', 'Pamplona', 'Madrid', 'Seville', 'Valencia'),
      Q('Songkran, a nationwide new-year water fight, is celebrated in which country?', 'Thailand', 'India', 'Vietnam', 'Japan'),
      Q('Holi, the festival of colours, began in which country?', 'India', 'Nepal', 'Thailand', 'Indonesia'),
      Q('Which festival ends Ramadan, the Islamic month of fasting?', 'Eid al-Fitr', 'Eid al-Adha', 'Ashura', 'Mawlid'),
      Q('Mardi Gras, or Fat Tuesday, is famous in which US city?', 'New Orleans', 'Miami', 'New York', 'Las Vegas'),
      Q('Hanukkah, the eight-night festival of lights, belongs to which religion?', 'Judaism', 'Christianity', 'Islam', 'Hinduism'),
      Q('Venice\'s historic carnival is famous for which accessory?', 'Masks', 'Kilts', 'Lanterns', 'Sombreros'),
      Q('The world\'s largest arts festival, the Fringe, is held in which city?', 'Edinburgh', 'London', 'Dublin', 'Manchester'),
      Q('Hanami parties in Japan celebrate the blossom of which tree?', 'Cherry', 'Plum', 'Maple', 'Pine'),
      Q('Bastille Day, 14 July, is the national day of which country?', 'France', 'Belgium', 'Italy', 'Canada'),
      Q('St. Patrick\'s Day celebrates the patron saint of which country?', 'Ireland', 'Scotland', 'Wales', 'England'),
      Q('In which month do Americans celebrate Thanksgiving?', 'November', 'October', 'December', 'September'),
      Q('Which round pastry is eaten at the Mid-Autumn Festival?', 'Mooncakes', 'Pretzels', 'Panettone', 'Baklava'),
      Q('Nowruz, the Persian New Year, begins at the start of which season?', 'Spring', 'Summer', 'Autumn', 'Winter'),
      Q('Waitangi Day is the national day of which country?', 'New Zealand', 'Australia', 'Fiji', 'Canada')
    ]
  });

  makeQuiz({
    id: 'quiz-deserts', title: 'Deserts Quiz', emo: '🏜',
    tagline: 'Sahara, Gobi, Atacama — mind the mirage',
    desc: 'Twelve questions across the dry places: the Sahara\'s size record, the Atacama as the ' +
      'driest non-polar desert, Uluru rising from Australia\'s red centre, the Empty Quarter and ' +
      'why Antarctica technically out-deserts them all. Even the camel question has a catch — ' +
      'their humps store fat, not water.',
    colors: ['#d97706', '#fde68a'],
    tags: ['trivia', 'quiz', 'geography', 'deserts'],
    bank: [
      Q('What is the largest hot desert in the world?', 'The Sahara', 'The Gobi', 'The Arabian', 'The Kalahari'),
      Q('The Sahara stretches across the north of which continent?', 'Africa', 'Asia', 'Australia', 'South America'),
      Q('The Gobi Desert spans northern China and which country?', 'Mongolia', 'Kazakhstan', 'Russia', 'India'),
      Q('The Atacama, the driest non-polar desert, is in which country?', 'Chile', 'Peru', 'Mexico', 'Argentina'),
      Q('The Kalahari Desert spans Botswana, Namibia and which country?', 'South Africa', 'Zambia', 'Angola', 'Zimbabwe'),
      Q('The Mojave Desert, home of the Joshua tree, is in which country?', 'The United States', 'Mexico', 'Australia', 'Egypt'),
      Q('The Rub\' al Khali, or Empty Quarter, covers much of which peninsula?', 'The Arabian Peninsula', 'The Iberian Peninsula', 'The Sinai Peninsula', 'The Malay Peninsula'),
      Q('Uluru, the huge red sandstone rock, rises from the desert of which country?', 'Australia', 'Namibia', 'The United States', 'Chile'),
      Q('The Thar Desert lies mainly in which country?', 'India', 'Iran', 'Egypt', 'Turkey'),
      Q('Which coastal desert of towering dunes gave Namibia its name?', 'The Namib', 'The Kalahari', 'The Sahara', 'The Karoo'),
      Q('Death Valley, holder of the hottest recorded temperature, is in which US state?', 'California', 'Arizona', 'Nevada', 'Texas'),
      Q('What do camels actually store in their humps?', 'Fat', 'Water', 'Milk', 'Salt'),
      Q('A desert spot where water reaches the surface and palms grow is called what?', 'An oasis', 'A delta', 'A geyser', 'A lagoon'),
      Q('The giant saguaro cactus grows wild in which desert?', 'The Sonoran', 'The Sahara', 'The Gobi', 'The Atacama'),
      Q('Counting cold deserts, which continent is the largest desert on Earth?', 'Antarctica', 'Africa', 'Australia', 'Asia'),
      Q('Camel caravans crossed the Sahara for centuries trading gold and which mineral?', 'Salt', 'Coal', 'Iron', 'Silver'),
      Q('The Painted Desert\'s banded badlands are in which US state?', 'Arizona', 'Utah', 'New Mexico', 'Colorado'),
      Q('Which desert\'s name is Mongolian for "waterless place"?', 'The Gobi', 'The Thar', 'The Namib', 'The Atacama'),
      Q('Hills of wind-blown sand in a desert are called what?', 'Dunes', 'Buttes', 'Wadis', 'Mesas'),
      Q('The Negev Desert covers the south of which country?', 'Israel', 'Jordan', 'Egypt', 'Lebanon'),
      Q('The Taklamakan Desert, skirted by the old Silk Road, is in which country?', 'China', 'Mongolia', 'Kazakhstan', 'Iran')
    ]
  });

  makeQuiz({
    id: 'quiz-oceans-seas', title: 'Oceans & Seas Quiz', emo: '🌊',
    tagline: 'From the Mariana Trench to the Gulf Stream',
    desc: 'Salt-water geography: the Pacific\'s size crown, the Challenger Deep, the Dead Sea ' +
      'between Israel and Jordan, the Bering Strait\'s narrow gap to Alaska and the Gulf Stream ' +
      'that keeps Europe mild. A couple of questions cover ocean science — what drives the tides, ' +
      'how much of Earth is water — for easy streak fuel.',
    colors: ['#1e40af', '#06b6d4'],
    tags: ['trivia', 'quiz', 'geography', 'oceans'],
    bank: [
      Q('What is the largest ocean on Earth?', 'The Pacific', 'The Atlantic', 'The Indian', 'The Arctic'),
      Q('Which small, ice-covered ocean surrounds the North Pole?', 'The Arctic', 'The Antarctic', 'The Atlantic', 'The Baltic'),
      Q('Which ocean lies between Africa and Australia?', 'The Indian', 'The Pacific', 'The Atlantic', 'The Southern'),
      Q('The Challenger Deep, the deepest known point in the sea, is in which trench?', 'The Mariana Trench', 'The Puerto Rico Trench', 'The Java Trench', 'The Tonga Trench'),
      Q('Which sea separates southern Europe from North Africa?', 'The Mediterranean', 'The Black Sea', 'The Red Sea', 'The North Sea'),
      Q('The Dead Sea lies between Israel and which country?', 'Jordan', 'Egypt', 'Lebanon', 'Syria'),
      Q('The Great Barrier Reef lies off the coast of which country?', 'Australia', 'Indonesia', 'The Philippines', 'Mexico'),
      Q('Which ocean separates Europe from North America?', 'The Atlantic', 'The Pacific', 'The Indian', 'The Arctic'),
      Q('The Red Sea separates Africa from which peninsula?', 'The Arabian Peninsula', 'The Iberian Peninsula', 'The Balkan Peninsula', 'The Malay Peninsula'),
      Q('St. Petersburg sits on the Gulf of Finland, an arm of which sea?', 'The Baltic Sea', 'The North Sea', 'The Black Sea', 'The Barents Sea'),
      Q('The Caribbean Sea is part of which ocean?', 'The Atlantic', 'The Pacific', 'The Indian', 'The Southern'),
      Q('The Bering Strait separates Russia from which US state?', 'Alaska', 'Hawaii', 'Washington', 'California'),
      Q('Which giant salt lake is the world\'s largest inland body of water?', 'The Caspian Sea', 'The Black Sea', 'Lake Superior', 'The Aral Sea'),
      Q('Which warm Atlantic current keeps northwest Europe\'s winters mild?', 'The Gulf Stream', 'The Humboldt Current', 'El Niño', 'The Trade Winds'),
      Q('Ocean tides are caused mainly by the pull of what?', 'The Moon', 'The wind', 'Earth\'s core', 'Ocean currents'),
      Q('Which sea lies between Italy and Croatia?', 'The Adriatic', 'The Aegean', 'The Tyrrhenian', 'The Ligurian'),
      Q('The English Channel separates England from which country?', 'France', 'Belgium', 'The Netherlands', 'Ireland'),
      Q('The Southern Ocean encircles which continent?', 'Antarctica', 'Australia', 'South America', 'Africa'),
      Q('The Aegean Sea lies between Greece and which country?', 'Turkey', 'Italy', 'Egypt', 'Albania'),
      Q('Which sea lies between Great Britain and Denmark?', 'The North Sea', 'The Baltic Sea', 'The Irish Sea', 'The Norwegian Sea'),
      Q('Ships sailing from the Black Sea to the Mediterranean pass which city?', 'Istanbul', 'Athens', 'Venice', 'Alexandria'),
      Q('Roughly how much of Earth\'s surface is covered by ocean?', 'About 70%', 'About 50%', 'About 30%', 'About 90%')
    ]
  });

  makeQuiz({
    id: 'quiz-borders', title: 'Borders Quiz', emo: '🛂',
    tagline: 'Neighbours, enclaves and the world\'s longest line',
    desc: 'Who touches whom: the record-length Canada–USA border, Lesotho locked inside South ' +
      'Africa, Vatican City inside Rome, the Korean DMZ and which two South American countries ' +
      'Brazil never reaches. The enclave and both-sides-of-a-strait questions are the streak ' +
      'breakers — picture the map before you tap.',
    colors: ['#7c3aed', '#f43f5e'],
    tags: ['trivia', 'quiz', 'geography', 'borders'],
    bank: [
      Q('Which two countries share the world\'s longest land border?', 'Canada and the USA', 'Russia and China', 'Argentina and Chile', 'India and China'),
      Q('Which tiny country sits in the Pyrenees between Spain and France?', 'Andorra', 'Monaco', 'Liechtenstein', 'San Marino'),
      Q('Which country is completely surrounded by South Africa?', 'Lesotho', 'Eswatini', 'Botswana', 'Malawi'),
      Q('Which country lies entirely inside the city of Rome?', 'Vatican City', 'San Marino', 'Monaco', 'Malta'),
      Q('Which small republic is landlocked within north-central Italy?', 'San Marino', 'Vatican City', 'Andorra', 'Liechtenstein'),
      Q('Besides Canada, which country shares a land border with the USA?', 'Mexico', 'Cuba', 'Guatemala', 'Panama'),
      Q('Which country between France and Germany has Brussels as its capital?', 'Belgium', 'The Netherlands', 'Luxembourg', 'Switzerland'),
      Q('Portugal shares its only land border with which country?', 'Spain', 'France', 'Morocco', 'Andorra'),
      Q('Sweden borders Norway to the west and which country to the east?', 'Finland', 'Denmark', 'Russia', 'Estonia'),
      Q('The heavily guarded DMZ separates which two countries?', 'North and South Korea', 'China and Taiwan', 'India and Pakistan', 'Israel and Egypt'),
      Q('Mexico\'s southern border touches Belize and which country?', 'Guatemala', 'Honduras', 'Panama', 'Nicaragua'),
      Q('Across the Strait of Gibraltar from Spain lies which country?', 'Morocco', 'Algeria', 'Tunisia', 'Portugal'),
      Q('Which two countries share the island of Hispaniola?', 'Haiti and the Dominican Republic', 'Cuba and Jamaica', 'Haiti and Puerto Rico', 'Cuba and Haiti'),
      Q('Germany\'s northwestern neighbour, home of Amsterdam, is which country?', 'The Netherlands', 'Belgium', 'Denmark', 'Luxembourg'),
      Q('The Berlin Wall divided the capital of which country until 1989?', 'Germany', 'Austria', 'Poland', 'Hungary'),
      Q('Which river forms much of the border between Texas and Mexico?', 'The Rio Grande', 'The Colorado', 'The Mississippi', 'The Brazos'),
      Q('Which mountain range forms most of the Chile–Argentina border?', 'The Andes', 'The Rockies', 'The Sierra Madre', 'The Pampas'),
      Q('Which small country is wedged between France, Germany and Belgium?', 'Luxembourg', 'Liechtenstein', 'Andorra', 'Monaco'),
      Q('Egypt borders Libya to the west and which country to the south?', 'Sudan', 'Ethiopia', 'Chad', 'Israel'),
      Q('Brazil borders every South American country except Chile and which other?', 'Ecuador', 'Peru', 'Uruguay', 'Bolivia'),
      Q('Which Himalayan kingdom borders both India and China?', 'Bhutan', 'Bangladesh', 'Myanmar', 'Sri Lanka'),
      Q('Switzerland borders France, Germany, Italy, Liechtenstein and which country?', 'Austria', 'Slovenia', 'Belgium', 'Hungary')
    ]
  });

  makeQuiz({
    id: 'quiz-capital-or-not', title: 'Capital or Not?', emo: '🏙',
    tagline: 'The biggest city is usually the wrong answer',
    desc: 'Every round dangles a famous city that is NOT the capital: Sydney against Canberra, ' +
      'Istanbul against Ankara, Toronto against Ottawa, Rio against Brasília. Some rounds flip it ' +
      'and ask which of four big names really is a capital — or is not one at all. Trust the ' +
      'boring administrative city and the streak takes care of itself.',
    colors: ['#0891b2', '#f472b6'],
    tags: ['trivia', 'quiz', 'capitals', 'geography'],
    bank: [
      Q('Which of these Australian cities is the national capital?', 'Canberra', 'Sydney', 'Melbourne', 'Perth'),
      Q('Which of these is the capital of Canada?', 'Ottawa', 'Toronto', 'Vancouver', 'Montreal'),
      Q('Which of these is the capital of Turkey?', 'Ankara', 'Istanbul', 'Izmir', 'Antalya'),
      Q('Which of these is the capital of Brazil?', 'Brasília', 'Rio de Janeiro', 'São Paulo', 'Salvador'),
      Q('Which of these is the capital of the United States?', 'Washington, D.C.', 'New York', 'Los Angeles', 'Chicago'),
      Q('Which of these is the capital of Switzerland?', 'Bern', 'Zurich', 'Geneva', 'Basel'),
      Q('Which of these is the capital of New Zealand?', 'Wellington', 'Auckland', 'Christchurch', 'Queenstown'),
      Q('Which of these is the capital of Morocco?', 'Rabat', 'Casablanca', 'Marrakesh', 'Fez'),
      Q('Which of these is the capital of Pakistan?', 'Islamabad', 'Karachi', 'Lahore', 'Peshawar'),
      Q('Which of these is the capital of Nigeria?', 'Abuja', 'Lagos', 'Kano', 'Ibadan'),
      Q('Which of these is the capital of Vietnam?', 'Hanoi', 'Ho Chi Minh City', 'Da Nang', 'Hue'),
      Q('Which of these is the capital of India?', 'New Delhi', 'Mumbai', 'Kolkata', 'Bangalore'),
      Q('Which of these is Tanzania\'s official capital?', 'Dodoma', 'Dar es Salaam', 'Arusha', 'Mwanza'),
      Q('Which of these Italian cities is the national capital?', 'Rome', 'Milan', 'Turin', 'Florence'),
      Q('Which of these is the capital of Japan?', 'Tokyo', 'Osaka', 'Kyoto', 'Yokohama'),
      Q('Which of these four cities is a national capital?', 'Madrid', 'Barcelona', 'Munich', 'Milan'),
      Q('Which of these four cities is a national capital?', 'Vienna', 'Zurich', 'Hamburg', 'Naples'),
      Q('Which of these cities is NOT a national capital?', 'Sydney', 'Paris', 'Lisbon', 'Oslo'),
      Q('Which of these cities is NOT a national capital?', 'Istanbul', 'Athens', 'Cairo', 'Madrid'),
      Q('Which of these is the capital of Myanmar?', 'Naypyidaw', 'Yangon', 'Mandalay', 'Bagan'),
      Q('Which of these is the capital of the Philippines?', 'Manila', 'Quezon City', 'Cebu', 'Davao'),
      Q('Which of these is the capital of the United Arab Emirates?', 'Abu Dhabi', 'Dubai', 'Sharjah', 'Al Ain'),
      Q('Which of these is the capital of Saudi Arabia?', 'Riyadh', 'Jeddah', 'Mecca', 'Medina'),
      Q('Which of these is the capital of Scotland?', 'Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee')
    ]
  });

  makeQuiz({
    id: 'quiz-city-match', title: 'City Match Quiz', emo: '📍',
    tagline: 'Pin the city to its country',
    desc: 'A rapid-fire game of pin-the-city: Marrakesh, Kraków, Busan, Medellín, Dubrovnik and ' +
      'more, each needing its country inside 15 seconds. The distractors are always neighbouring ' +
      'or lookalike countries — Porto is not in Spain, Zurich is not in Germany — so near enough ' +
      'is not good enough.',
    colors: ['#f59e0b', '#6366f1'],
    tags: ['trivia', 'quiz', 'cities', 'geography'],
    bank: [
      Q('Marrakesh is a city in which country?', 'Morocco', 'Egypt', 'Tunisia', 'Turkey'),
      Q('Osaka is a city in which country?', 'Japan', 'China', 'South Korea', 'Taiwan'),
      Q('Munich is a city in which country?', 'Germany', 'Austria', 'Switzerland', 'Belgium'),
      Q('Kraków is a city in which country?', 'Poland', 'The Czech Republic', 'Hungary', 'Ukraine'),
      Q('Porto is a city in which country?', 'Portugal', 'Spain', 'Italy', 'Brazil'),
      Q('Zurich is a city in which country?', 'Switzerland', 'Germany', 'Austria', 'Sweden'),
      Q('Shanghai is a city in which country?', 'China', 'Japan', 'South Korea', 'Singapore'),
      Q('Mumbai is a city in which country?', 'India', 'Pakistan', 'Bangladesh', 'Indonesia'),
      Q('São Paulo is a city in which country?', 'Brazil', 'Portugal', 'Argentina', 'Mexico'),
      Q('Barcelona is a city in which country?', 'Spain', 'Italy', 'Portugal', 'France'),
      Q('Milan is a city in which country?', 'Italy', 'France', 'Switzerland', 'Spain'),
      Q('Lyon is a city in which country?', 'France', 'Belgium', 'Switzerland', 'Canada'),
      Q('Rotterdam, Europe\'s biggest port, is in which country?', 'The Netherlands', 'Belgium', 'Germany', 'Denmark'),
      Q('Gothenburg is a city in which country?', 'Sweden', 'Denmark', 'Norway', 'Germany'),
      Q('Busan is a port city in which country?', 'South Korea', 'Japan', 'China', 'Vietnam'),
      Q('Alexandria is a Mediterranean city in which country?', 'Egypt', 'Greece', 'Turkey', 'Libya'),
      Q('Medellín is a city in which country?', 'Colombia', 'Mexico', 'Venezuela', 'Peru'),
      Q('Auckland is a city in which country?', 'New Zealand', 'Australia', 'Fiji', 'Canada'),
      Q('Vancouver is a city in which country?', 'Canada', 'The United States', 'Australia', 'The United Kingdom'),
      Q('The walled port of Dubrovnik is in which country?', 'Croatia', 'Greece', 'Italy', 'Montenegro'),
      Q('Salzburg, Mozart\'s birthplace, is in which country?', 'Austria', 'Germany', 'Switzerland', 'Hungary'),
      Q('Istanbul, the city on two continents, is in which country?', 'Turkey', 'Greece', 'Bulgaria', 'Egypt')
    ]
  });

  makeQuiz({
    id: 'quiz-wonders', title: 'Wonders Quiz', emo: '🗿',
    tagline: 'Seven ancient, seven new, all quizzable',
    desc: 'Both wonder lists in one run: the Great Pyramid as the last ancient survivor, the ' +
      'Colossus of Rhodes and the Pharos of Alexandria, then Machu Picchu, Petra and Chichén Itzá ' +
      'from the modern seven. A few natural wonders sneak in too — the Great Barrier Reef, the ' +
      'northern lights and what Mosi-oa-Tunya actually means.',
    colors: ['#eab308', '#92400e'],
    tags: ['trivia', 'quiz', 'wonders', 'history'],
    bank: [
      Q('Which is the only Ancient Wonder still standing today?', 'The Great Pyramid of Giza', 'The Colossus of Rhodes', 'The Hanging Gardens', 'The Lighthouse of Alexandria'),
      Q('The Hanging Gardens, an Ancient Wonder, were said to bloom in which city?', 'Babylon', 'Athens', 'Alexandria', 'Persepolis'),
      Q('The Colossus, a giant bronze statue, stood at the harbour of which island?', 'Rhodes', 'Crete', 'Cyprus', 'Malta'),
      Q('The Pharos, the great ancient lighthouse, guided ships into which city?', 'Alexandria', 'Carthage', 'Athens', 'Rome'),
      Q('The Temple of Artemis at Ephesus stood in which modern country?', 'Turkey', 'Greece', 'Egypt', 'Italy'),
      Q('The gold-and-ivory Statue of Zeus sat at Olympia in which country?', 'Greece', 'Turkey', 'Italy', 'Egypt'),
      Q('The tomb of King Mausolus at Halicarnassus gave us which word?', 'Mausoleum', 'Monument', 'Museum', 'Mansion'),
      Q('Which New Seven Wonder hides high in the Peruvian Andes?', 'Machu Picchu', 'Chichén Itzá', 'Petra', 'The Colosseum'),
      Q('Christ the Redeemer, a New Seven Wonder, stretches its arms over which city?', 'Rio de Janeiro', 'Lisbon', 'Buenos Aires', 'Mexico City'),
      Q('Petra, the rock-carved city on the New Seven Wonders list, is in which country?', 'Jordan', 'Egypt', 'Syria', 'Israel'),
      Q('Chichén Itzá and its stepped pyramid El Castillo are in which country?', 'Mexico', 'Guatemala', 'Peru', 'Honduras'),
      Q('The Colosseum was built to stage which spectacle?', 'Gladiator games', 'Chariot races', 'Olympic games', 'Theatre plays'),
      Q('The Great Wall of China was built to keep out invaders from which direction?', 'The north', 'The south', 'The east', 'The west'),
      Q('Emperor Shah Jahan built the Taj Mahal as a tomb for whom?', 'His wife', 'His father', 'His general', 'Himself'),
      Q('The Great Pyramid was built as the tomb of which pharaoh?', 'Khufu', 'Tutankhamun', 'Ramses II', 'Cleopatra'),
      Q('Which natural wonder is the world\'s largest coral reef system?', 'The Great Barrier Reef', 'The Belize Reef', 'The Red Sea Reef', 'The Coral Triangle'),
      Q('The aurora borealis is better known as what?', 'The northern lights', 'The midnight sun', 'The green flash', 'St. Elmo\'s fire'),
      Q('Victoria Falls\' local name, Mosi-oa-Tunya, means what?', 'The smoke that thunders', 'The endless river', 'The wall of water', 'The great divide'),
      Q('How many wonders made up the classic ancient list?', 'Seven', 'Five', 'Nine', 'Twelve'),
      Q('The Grand Canyon, a natural wonder a mile deep, is in which country?', 'The United States', 'Mexico', 'Canada', 'Australia')
    ]
  });

  makeQuiz({
    id: 'quiz-superlatives', title: 'Superlatives Quiz', emo: '🥇',
    tagline: 'Biggest, smallest, longest, deepest — go',
    desc: 'Nothing but records: Russia\'s size, Vatican City\'s smallness, Lake Baikal\'s depth, ' +
      'Canada\'s absurdly long coastline and the highest capital city in the world. Every answer ' +
      'is a record-holder, so the distractors are always the runners-up — second place scores ' +
      'nothing here.',
    colors: ['#ef4444', '#22d3ee'],
    tags: ['trivia', 'quiz', 'records', 'geography'],
    bank: [
      Q('Which is the largest country in the world by area?', 'Russia', 'Canada', 'China', 'The United States'),
      Q('Which is the smallest country in the world?', 'Vatican City', 'Monaco', 'San Marino', 'Malta'),
      Q('Which river is traditionally listed as the world\'s longest?', 'The Nile', 'The Amazon', 'The Yangtze', 'The Mississippi'),
      Q('Which is the largest ocean?', 'The Pacific', 'The Atlantic', 'The Indian', 'The Arctic'),
      Q('What is the world\'s tallest waterfall?', 'Angel Falls', 'Niagara Falls', 'Victoria Falls', 'Iguazu Falls'),
      Q('Which is the deepest lake in the world?', 'Lake Baikal', 'Lake Superior', 'Lake Tanganyika', 'Loch Ness'),
      Q('What is the largest island in the world?', 'Greenland', 'Madagascar', 'Borneo', 'New Guinea'),
      Q('Which is the longest mountain range on land?', 'The Andes', 'The Himalayas', 'The Rockies', 'The Alps'),
      Q('Which is the largest continent?', 'Asia', 'Africa', 'North America', 'Europe'),
      Q('Which is the smallest continent?', 'Australia', 'Europe', 'Antarctica', 'South America'),
      Q('Which city anchors the world\'s most populous metropolitan area?', 'Tokyo', 'New York', 'London', 'Mexico City'),
      Q('Which is the world\'s largest lake by surface area?', 'The Caspian Sea', 'Lake Superior', 'Lake Victoria', 'Lake Baikal'),
      Q('What is the longest man-made structure on Earth?', 'The Great Wall of China', 'The Suez Canal', 'The Panama Canal', 'The Channel Tunnel'),
      Q('Which is the largest rainforest in the world?', 'The Amazon', 'The Congo', 'The Daintree', 'The Black Forest'),
      Q('Which is the coldest continent?', 'Antarctica', 'Europe', 'North America', 'Asia'),
      Q('Which is the largest hot desert?', 'The Sahara', 'The Gobi', 'The Arabian', 'The Atacama'),
      Q('Which is the highest capital city in the world?', 'La Paz', 'Quito', 'Kathmandu', 'Bogotá'),
      Q('Which country is the world\'s largest archipelago, with over 17,000 islands?', 'Indonesia', 'The Philippines', 'Japan', 'Greece'),
      Q('Which country has the longest coastline in the world?', 'Canada', 'Russia', 'Australia', 'Indonesia'),
      Q('The lowest land on Earth\'s surface lies on the shore of which sea?', 'The Dead Sea', 'The Caspian Sea', 'The Red Sea', 'The Black Sea'),
      Q('The deepest point in any ocean lies in which trench?', 'The Mariana Trench', 'The Java Trench', 'The Tonga Trench', 'The Puerto Rico Trench'),
      Q('Which is the world\'s highest mountain above sea level?', 'Mount Everest', 'K2', 'Denali', 'Aconcagua')
    ]
  });

  makeQuiz({
    id: 'quiz-tiny-countries', title: 'Tiny Countries Quiz', emo: '🤏',
    tagline: 'Microstates punching above their weight',
    desc: 'The world\'s smallest sovereigns: Vatican City inside Rome, Monaco\'s casino and Grand ' +
      'Prix, Liechtenstein\'s capital Vaduz, San Marino\'s oldest-republic claim and Pacific ' +
      'specks like Nauru and Tuvalu. Twelve questions, three lives, and a bank deep enough that ' +
      'no two runs feel the same.',
    colors: ['#10b981', '#a78bfa'],
    tags: ['trivia', 'quiz', 'microstates', 'geography'],
    bank: [
      Q('What is the smallest country in the world?', 'Vatican City', 'Monaco', 'Nauru', 'San Marino'),
      Q('Monaco is a tiny principality on the Riviera coast of which country?', 'France', 'Italy', 'Spain', 'Switzerland'),
      Q('San Marino is completely surrounded by which country?', 'Italy', 'France', 'Switzerland', 'Austria'),
      Q('Liechtenstein is squeezed between Switzerland and which country?', 'Austria', 'Germany', 'Italy', 'France'),
      Q('Andorra sits high in which mountain range?', 'The Pyrenees', 'The Alps', 'The Apennines', 'The Carpathians'),
      Q('Which microstate hosts a Grand Prix through its streets and the Monte Carlo casino?', 'Monaco', 'San Marino', 'Andorra', 'Malta'),
      Q('Malta is a small island country in which sea?', 'The Mediterranean', 'The Adriatic', 'The Aegean', 'The Baltic'),
      Q('Which small country between France, Germany and Belgium is ruled by a Grand Duke?', 'Luxembourg', 'Liechtenstein', 'Monaco', 'Andorra'),
      Q('Nauru and Tuvalu, two of the world\'s smallest countries, are in which ocean?', 'The Pacific', 'The Atlantic', 'The Indian', 'The Arctic'),
      Q('Vatican City lies entirely within which city?', 'Rome', 'Florence', 'Milan', 'Naples'),
      Q('Singapore is a city-state at the tip of which peninsula?', 'The Malay Peninsula', 'The Korean Peninsula', 'The Indochinese Peninsula', 'The Arabian Peninsula'),
      Q('The Maldives, a nation of low coral atolls, is in which ocean?', 'The Indian', 'The Pacific', 'The Atlantic', 'The Southern'),
      Q('Who is the head of state of Vatican City?', 'The Pope', 'A king', 'A president', 'An emperor'),
      Q('Brunei, a small oil-rich sultanate, sits on which island?', 'Borneo', 'Java', 'Sumatra', 'Sulawesi'),
      Q('Which two-island nation is the smallest country in the Americas?', 'St. Kitts and Nevis', 'Barbados', 'Grenada', 'St. Lucia'),
      Q('Andorra\'s two big neighbours are France and which country?', 'Spain', 'Italy', 'Portugal', 'Switzerland'),
      Q('What is the capital of Liechtenstein?', 'Vaduz', 'Bern', 'Luxembourg City', 'Innsbruck'),
      Q('San Marino claims to be the world\'s oldest surviving what?', 'Republic', 'Kingdom', 'Empire', 'City'),
      Q('Which tiny Pacific nation, once called Pleasant Island, grew rich on phosphate?', 'Nauru', 'Tuvalu', 'Palau', 'Kiribati'),
      Q('What is the capital of Malta?', 'Valletta', 'Palermo', 'Nicosia', 'Mdina'),
      Q('Which small Himalayan kingdom measures Gross National Happiness?', 'Bhutan', 'Nepal', 'Laos', 'Mongolia'),
      Q('Grenada, the Caribbean\'s Spice Isle, is famous for which spice?', 'Nutmeg', 'Vanilla', 'Saffron', 'Cinnamon')
    ]
  });

  makeQuiz({
    id: 'quiz-travel', title: 'Travel Quiz', emo: '✈',
    tagline: 'Famous routes, rails and rites of passage',
    desc: 'For the departure-lounge daydreamer: the Orient Express to Istanbul, Route 66, the ' +
      'Trans-Siberian to Vladivostok, Japan\'s Shinkansen and the Camino de Santiago. A few ' +
      'practical ones too — which side Britain drives on, what safari means in Swahili — so ' +
      'street smarts count as much as map smarts.',
    colors: ['#06b6d4', '#fb923c'],
    tags: ['trivia', 'quiz', 'travel', 'world'],
    bank: [
      Q('The Orient Express famously linked Paris with which city?', 'Istanbul', 'Moscow', 'Cairo', 'Vienna'),
      Q('Historic Route 66 ran from Chicago to which city?', 'Los Angeles', 'New York', 'Miami', 'Seattle'),
      Q('The Trans-Siberian Railway runs from Moscow to which Pacific port?', 'Vladivostok', 'St. Petersburg', 'Beijing', 'Murmansk'),
      Q('In which city do gondolas ferry visitors along canal streets?', 'Venice', 'Amsterdam', 'Bruges', 'Stockholm'),
      Q('Which document do travellers need to cross most international borders?', 'A passport', 'A birth certificate', 'A driving licence', 'A boarding pass'),
      Q('In the UK and Japan, cars drive on which side of the road?', 'The left', 'The right', 'Either side', 'The middle'),
      Q('The Camino de Santiago pilgrimage routes end in which country?', 'Spain', 'France', 'Italy', 'Portugal'),
      Q('Which city\'s underground railway is nicknamed the Tube?', 'London', 'Paris', 'New York', 'Berlin'),
      Q('Famous cable cars climb the steep streets of which bayside city?', 'San Francisco', 'Lisbon', 'Naples', 'Hong Kong'),
      Q('Japan\'s high-speed bullet trains are called what?', 'Shinkansen', 'Maglev', 'Eurostar', 'TGV'),
      Q('The word safari means what in Swahili?', 'Journey', 'Lion', 'Sunset', 'Hunt'),
      Q('Which canal saves ships the long voyage around South America?', 'The Panama Canal', 'The Suez Canal', 'The Kiel Canal', 'The Corinth Canal'),
      Q('Which canal saves ships the long voyage around Africa?', 'The Suez Canal', 'The Panama Canal', 'The Corinth Canal', 'The Grand Canal'),
      Q('For years the world\'s busiest passenger airport has been in which US city?', 'Atlanta', 'New York', 'Los Angeles', 'Chicago'),
      Q('The Eurostar train crosses the Channel Tunnel between England and which country?', 'France', 'Belgium', 'The Netherlands', 'Ireland'),
      Q('In which country would you sleep in a ryokan inn and bathe in an onsen?', 'Japan', 'South Korea', 'China', 'Thailand'),
      Q('The Inca Trail is a famous hike to which site?', 'Machu Picchu', 'Chichén Itzá', 'Angkor Wat', 'Petra'),
      Q('Camel treks from Marrakesh head into which desert?', 'The Sahara', 'The Gobi', 'The Kalahari', 'The Atacama'),
      Q('Santorini and Mykonos belong to which Greek island group?', 'The Cyclades', 'The Dodecanese', 'The Ionian Islands', 'The Sporades'),
      Q('Interrailing is a classic rail-pass adventure across which continent?', 'Europe', 'Asia', 'South America', 'Africa'),
      Q('The Ring Road, Route 1, loops all the way around which island country?', 'Iceland', 'Ireland', 'New Zealand', 'Sri Lanka'),
      Q('Which US city is nicknamed the Big Apple?', 'New York', 'Chicago', 'Boston', 'Los Angeles'),
      Q('Visitors to Machu Picchu usually set out from which Peruvian city?', 'Cusco', 'Lima', 'Arequipa', 'Iquitos')
    ]
  });

  makeQuiz({
    id: 'quiz-maps-directions', title: 'Maps & Directions Quiz', emo: '🧭',
    tagline: 'Latitude, legends and which way is north',
    desc: 'The reader\'s guide to any map: latitude versus longitude, the Prime Meridian and the ' +
      'Equator, what contour lines join, the tropics of Cancer and Capricorn and why crossing the ' +
      'International Date Line changes your calendar. Pure map literacy — nail the compass rose ' +
      'questions fast and let the streak bonus climb.',
    colors: ['#475569', '#34d399'],
    tags: ['trivia', 'quiz', 'maps', 'navigation'],
    bank: [
      Q('On a standard map, which direction is at the top?', 'North', 'South', 'East', 'West'),
      Q('What does a map\'s scale tell you?', 'How map distance relates to real distance', 'How old the map is', 'Which way is north', 'How accurate the map is'),
      Q('Lines circling the globe parallel to the Equator are lines of what?', 'Latitude', 'Longitude', 'Altitude', 'Magnitude'),
      Q('Lines running from pole to pole are lines of what?', 'Longitude', 'Latitude', 'Altitude', 'Symmetry'),
      Q('The 0° line of longitude through Greenwich is called what?', 'The Prime Meridian', 'The Equator', 'The Date Line', 'The Tropic of Cancer'),
      Q('The 0° line of latitude around the middle of the Earth is called what?', 'The Equator', 'The Prime Meridian', 'The Arctic Circle', 'The Date Line'),
      Q('Which instrument\'s needle points toward magnetic north?', 'A compass', 'A barometer', 'A sextant', 'An altimeter'),
      Q('On a compass rose, which direction sits opposite east?', 'West', 'North', 'South', 'Northeast'),
      Q('What does a map\'s legend, or key, explain?', 'The symbols used on the map', 'The map\'s author', 'The best route to take', 'The country names'),
      Q('The tropic that lies north of the Equator is the Tropic of what?', 'Cancer', 'Capricorn', 'Aquarius', 'Taurus'),
      Q('The tropic that lies south of the Equator is the Tropic of what?', 'Capricorn', 'Cancer', 'Scorpio', 'Libra'),
      Q('Contour lines on a map connect points with the same what?', 'Elevation', 'Temperature', 'Population', 'Rainfall'),
      Q('What does GPS stand for?', 'Global Positioning System', 'General Path Service', 'Geographic Plotting Scale', 'Global Passenger Signal'),
      Q('Halfway between north and east lies which compass direction?', 'Northeast', 'Northwest', 'Southeast', 'True north'),
      Q('A book of maps is called what?', 'An atlas', 'An almanac', 'A gazette', 'A ledger'),
      Q('The atlas is named after Atlas, a titan from which mythology?', 'Greek', 'Norse', 'Egyptian', 'Celtic'),
      Q('Crossing which line in the Pacific moves you to a different calendar day?', 'The International Date Line', 'The Equator', 'The Prime Meridian', 'The Tropic of Cancer'),
      Q('Latitude 90° North marks which spot on Earth?', 'The North Pole', 'The Equator', 'The Arctic Circle', 'Greenland'),
      Q('How many degrees are on a full compass circle?', '360', '180', '100', '400'),
      Q('Which colour almost always shows water on a map?', 'Blue', 'Green', 'Brown', 'Purple'),
      Q('Most of Earth\'s land lies in which hemisphere?', 'The Northern', 'The Southern', 'The Western', 'The polar'),
      Q('Someone watching the sunrise is facing roughly which direction?', 'East', 'West', 'North', 'South'),
      Q('Maps of seas and coastlines made for sailors are called what?', 'Nautical charts', 'Blueprints', 'Star maps', 'Surveys')
    ]
  });
})();
