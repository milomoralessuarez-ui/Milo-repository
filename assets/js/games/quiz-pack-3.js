/* Quiz Pack 3 — "Culture, Sport & Numbers": 25 timed multiple-choice quizzes
   on one shared engine. Each run draws 12 questions from that quiz's
   hand-written bank (18+ each), with a 15-second bar per question, speed and
   streak bonuses, and three lives. */
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
          '.qp3-wrap{width:min(680px,96%);margin:auto;display:flex;flex-direction:column;gap:12px;font-family:Outfit,sans-serif}',
          '.qp3-top{display:flex;justify-content:space-between;color:#a8b0d8;font-size:.88rem;font-weight:700;letter-spacing:.02em}',
          '.qp3-track{height:12px;border-radius:7px;background:rgba(255,255,255,.09);overflow:hidden}',
          '.qp3-fill{height:100%;width:100%;border-radius:7px;background:linear-gradient(90deg,' + c0 + ',' + c1 + ')}',
          '.qp3-fill.low{background:#fb7185}',
          '.qp3-q{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.09);border-radius:14px;' +
          'padding:18px 20px;color:#fff;font-size:clamp(1.02rem,2.6vw,1.26rem);font-weight:700;line-height:1.4;' +
          'min-height:88px;display:flex;align-items:center;justify-content:center;text-align:center}',
          '.qp3-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
          '@media(max-width:600px){.qp3-grid{grid-template-columns:1fr}}',
          '.qp3-btn{display:flex;align-items:center;gap:10px;text-align:left;background:rgba(255,255,255,.05);' +
          'border:2px solid rgba(255,255,255,.13);border-radius:12px;padding:12px 14px;color:#e8ecff;' +
          'font:600 .95rem/1.3 Outfit,sans-serif;cursor:pointer;transition:border-color .12s,background .12s,opacity .2s}',
          '.qp3-btn:hover{border-color:' + c0 + ';background:rgba(255,255,255,.09)}',
          '.qp3-btn .k{flex:0 0 auto;min-width:24px;height:24px;border-radius:7px;background:rgba(255,255,255,.1);' +
          'display:grid;place-items:center;font-size:.78rem;font-weight:800;color:#aab2dd}',
          '.qp3-btn.good{background:#0f5132;border-color:#34d399;color:#fff}',
          '.qp3-btn.bad{background:#6b1d2b;border-color:#fb7185;color:#fff}',
          '.qp3-btn.dim{opacity:.4}',
          '.qp3-fb{min-height:24px;text-align:center;font-weight:800;font-size:1rem}'
        ].join('\n');

        var wrap = document.createElement('div'); wrap.className = 'qp3-wrap';

        var top = document.createElement('div'); top.className = 'qp3-top';
        var counter = document.createElement('div');
        var tally = document.createElement('div'); tally.textContent = '✓ 0';
        top.appendChild(counter); top.appendChild(tally);

        var track = document.createElement('div'); track.className = 'qp3-track';
        var fill = document.createElement('div'); fill.className = 'qp3-fill';
        track.appendChild(fill);

        var qText = document.createElement('div'); qText.className = 'qp3-q';

        var grid = document.createElement('div'); grid.className = 'qp3-grid';
        var btns = [];
        for (var i = 0; i < 4; i++) {
          (function (idx) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'qp3-btn';
            var k = document.createElement('span'); k.className = 'k'; k.textContent = String(idx + 1);
            var t = document.createElement('span');
            b.appendChild(k); b.appendChild(t);
            b.addEventListener('click', function () { answer(g, idx); });
            grid.appendChild(b);
            btns.push({ el: b, txt: t });
          })(i);
        }

        var fb = document.createElement('div'); fb.className = 'qp3-fb';

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
          els.btns[i].el.className = 'qp3-btn';
          els.btns[i].txt.textContent = opts[i].t;
        }
        d.item = item;
        d.timer = QT; d.prevSec = QT; d.low = false;
        d.phase = 'ask';
        els.fill.className = 'qp3-fill';
        els.fill.style.width = '100%';
        els.qText.textContent = item.q;
        els.counter.textContent = 'Question ' + (d.idx + 1) + ' of ' + PER_RUN;
        els.tally.textContent = '✓ ' + d.correct;
        els.fb.textContent = '';
      }

      function dimOthers(keepA, keepB) {
        for (var i = 0; i < 4; i++) {
          if (i !== keepA && i !== keepB) els.btns[i].el.className = 'qp3-btn dim';
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
          els.btns[pick].el.className = 'qp3-btn good';
          dimOthers(pick, -1);
          els.fb.textContent = '+' + pts + (streakBonus ? '  ·  streak ×' + d.streak : '');
          els.fb.style.color = '#34d399';
          Milo.sound.coin();
          d.phase = 'reveal'; d.wait = .75;
        } else {
          d.lives--; d.streak = 0;
          g.set('Streak', 0);
          g.set('Lives', hearts(d.lives));
          if (pick >= 0) els.btns[pick].el.className = 'qp3-btn bad';
          els.btns[d.correctIdx].el.className = 'qp3-btn good';
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
        st.textContent = '@keyframes qp3fall{0%{transform:translateY(-30px) rotate(0deg);opacity:1}' +
          '100%{transform:translateY(110vh) rotate(660deg);opacity:.65}}';
        layer.appendChild(st);
        var palette = [c0, c1, '#fbbf24', '#34d399', '#fb7185', '#60a5fa', '#f9fafb'];
        for (var i = 0; i < 90; i++) {
          var p = document.createElement('div');
          var s = 6 + ((Math.random() * 7) | 0);
          p.style.cssText = 'position:absolute;top:-24px;left:' + (Math.random() * 100).toFixed(1) + '%;' +
            'width:' + s + 'px;height:' + Math.max(4, (s * .62) | 0) + 'px;border-radius:2px;' +
            'background:' + palette[(Math.random() * palette.length) | 0] + ';' +
            'animation:qp3fall ' + (1.7 + Math.random() * 1.6).toFixed(2) + 's linear ' +
            (Math.random() * .9).toFixed(2) + 's both';
          layer.appendChild(p);
        }
        g.hud.appendChild(layer);
        setTimeout(function () { if (layer.parentNode) layer.parentNode.removeChild(layer); }, 4500);
      }

      return Milo.domGame(host, {
        id: meta.id,
        bg: '#101228',
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
            if (d.timer < 4 && !d.low) { d.low = true; els.fill.className = 'qp3-fill low'; }
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
    id: 'quiz-sports', title: 'Sports Quiz', emo: '🏅',
    tagline: 'Shuttlecocks, marathons and perfect 300s',
    desc: 'A whole stadium of sports in one bank: marathon distances, cricket overs, the yellow ' +
      'jersey of the Tour de France and what a perfect game in ten-pin bowling scores. Answer ' +
      'inside the 15-second bar for up to +50 speed points, and keep the streak alive — it is ' +
      'worth more with every consecutive hit.',
    colors: ['#f59e0b', '#ef4444'],
    tags: ['trivia', 'quiz', 'sports', 'facts'],
    bank: [
      Q('In which sport do players hit a shuttlecock?', 'Badminton', 'Tennis', 'Squash', 'Table tennis'),
      Q('How many players does a basketball team have on the court?', '5', '6', '7', '4'),
      Q('A marathon is about how long?', '42 kilometres', '26 kilometres', '50 kilometres', '32 kilometres'),
      Q('In golf, what is a score of one under par on a hole called?', 'A birdie', 'An eagle', 'A bogey', 'An albatross'),
      Q('How many innings are in a standard baseball game?', '9', '7', '10', '12'),
      Q('The Tour de France is a famous race in which sport?', 'Cycling', 'Running', 'Sailing', 'Motor racing'),
      Q('What colour jersey does the Tour de France leader wear?', 'Yellow', 'Green', 'White', 'Red'),
      Q('How many points is a touchdown worth in American football?', '6', '3', '7', '5'),
      Q('Judo originated in which country?', 'Japan', 'China', 'Korea', 'Thailand'),
      Q('In cricket, how many legal balls make up an over?', '6', '4', '5', '8'),
      Q('How often is the soccer World Cup held?', 'Every 4 years', 'Every 2 years', 'Every year', 'Every 5 years'),
      Q('Which sport is played on a field called a diamond?', 'Baseball', 'Cricket', 'Hockey', 'Rugby'),
      Q('How many players does a volleyball team have on court?', '6', '5', '7', '4'),
      Q('In bowling, knocking down all ten pins with the first ball is a what?', 'Strike', 'Spare', 'Split', 'Turkey'),
      Q('What is a perfect score in ten-pin bowling?', '300', '200', '250', '360'),
      Q('How many players per side are on the ice in hockey, goalie included?', '6', '5', '7', '8'),
      Q('Sumo wrestling is the national sport of which country?', 'Japan', 'Mongolia', 'China', 'Korea'),
      Q('In tennis, what is a score of zero called?', 'Love', 'Nil', 'Duck', 'Blank'),
      Q('Which sport awards the Ryder Cup?', 'Golf', 'Tennis', 'Rowing', 'Sailing'),
      Q('In darts, what is the highest score with a single dart?', '60', '50', '100', '20')
    ]
  });

  makeQuiz({
    id: 'quiz-football', title: 'Football Quiz', emo: '⚽',
    tagline: 'From Camp Nou to the 1966 final',
    desc: 'The beautiful game from kick-off to full time: hat-tricks and own goals, Pelé and ' +
      'Maradona, Old Trafford and Camp Nou, plus the countries behind the famous World Cup wins ' +
      'of 1930, 1966 and 1998. Wrong guesses flash the right answer, but each one burns a life.',
    colors: ['#16a34a', '#0ea5e9'],
    tags: ['trivia', 'quiz', 'football', 'soccer', 'sports'],
    bank: [
      Q('How many players does a football team have on the pitch?', '11', '10', '12', '9'),
      Q('How long is a standard football match?', '90 minutes', '80 minutes', '60 minutes', '100 minutes'),
      Q('Which country won the first World Cup, in 1930?', 'Uruguay', 'Brazil', 'Italy', 'Argentina'),
      Q('Which country has won the most World Cups?', 'Brazil', 'Germany', 'Italy', 'Argentina'),
      Q('The legendary Pelé played international football for which country?', 'Brazil', 'Portugal', 'Argentina', 'Spain'),
      Q('A foul by a defender inside their own penalty area gives the attackers a what?', 'Penalty kick', 'Corner kick', 'Free kick outside the box', 'Throw-in'),
      Q('What colour card sends a player off the pitch?', 'Red', 'Yellow', 'Black', 'Blue'),
      Q('What does a yellow card mean?', 'A caution', 'A sending-off', 'A substitution', 'A penalty'),
      Q('Scoring three goals in one match is called a what?', 'Hat-trick', 'Triple crown', 'Treble', 'Trifecta'),
      Q('Diego Maradona starred for which national team?', 'Argentina', 'Brazil', 'Uruguay', 'Mexico'),
      Q('Which club plays its home games at Camp Nou?', 'FC Barcelona', 'Real Madrid', 'Bayern Munich', 'Juventus'),
      Q('Old Trafford is the home ground of which club?', 'Manchester United', 'Liverpool', 'Arsenal', 'Chelsea'),
      Q('Which country won the 1966 World Cup on home soil?', 'England', 'Germany', 'Brazil', 'France'),
      Q('How long is each half of a football match?', '45 minutes', '40 minutes', '30 minutes', '50 minutes'),
      Q('Which player is allowed to handle the ball inside the penalty area?', 'The goalkeeper', 'The captain', 'The sweeper', 'Any defender'),
      Q('Real Madrid is based in which country?', 'Spain', 'Italy', 'Portugal', 'Mexico'),
      Q('Putting the ball into your own net is called an what?', 'Own goal', 'Auto goal', 'Error goal', 'Off goal'),
      Q('Which country hosted and won the 1998 World Cup?', 'France', 'Brazil', 'Italy', 'Germany'),
      Q('What restart is given when the defending team puts the ball over its own goal line?', 'A corner kick', 'A goal kick', 'A throw-in', 'A drop ball'),
      Q('What does FIFA govern?', 'World football', 'World athletics', 'World tennis', 'World swimming')
    ]
  });

  makeQuiz({
    id: 'quiz-olympics', title: 'Olympics Quiz', emo: '🥇',
    tagline: 'Five rings, one 15-second clock',
    desc: 'Faster, higher, stronger: the five rings, the flame lit in Olympia, the 1896 revival in ' +
      'Athens, Jesse Owens in 1936 and Nadia Comăneci\'s perfect 10. Twelve questions a run, and ' +
      'a full sweep sets off the confetti.',
    colors: ['#facc15', '#3b82f6'],
    tags: ['trivia', 'quiz', 'olympics', 'sports', 'history'],
    bank: [
      Q('How many rings are on the Olympic flag?', '5', '4', '6', '7'),
      Q('The Olympic rings represent what?', 'The inhabited continents', 'The founding countries', 'The five oceans', 'The events of the pentathlon'),
      Q('The ancient Olympic Games were held in which country?', 'Greece', 'Italy', 'Egypt', 'Turkey'),
      Q('The first modern Olympics were held in 1896 in which city?', 'Athens', 'Paris', 'London', 'Rome'),
      Q('How often are the Summer Olympics normally held?', 'Every 4 years', 'Every 2 years', 'Every 3 years', 'Every 5 years'),
      Q('Where is the Olympic flame traditionally lit?', 'Olympia, Greece', 'Athens', 'Mount Olympus', 'The host city'),
      Q('Which city has hosted the Summer Olympics three times?', 'London', 'Paris', 'Athens', 'Los Angeles'),
      Q('Jesse Owens won four golds at which Olympics?', 'Berlin 1936', 'Munich 1972', 'Rome 1960', 'London 1948'),
      Q('Michael Phelps, the most decorated Olympian, competed in which sport?', 'Swimming', 'Athletics', 'Gymnastics', 'Rowing'),
      Q('Usain Bolt won his Olympic golds in which sport?', 'Sprinting', 'Long jump', 'Swimming', 'Cycling'),
      Q('Which medal do you win for finishing second?', 'Silver', 'Bronze', 'Gold', 'Platinum'),
      Q('Is figure skating a Summer or Winter Olympic sport?', 'Winter', 'Summer', 'Both', 'Neither'),
      Q('What does the motto "Citius, Altius, Fortius" mean?', 'Faster, Higher, Stronger', 'Honour, Glory, Victory', 'One World, One Dream', 'Strength Through Sport'),
      Q('Who founded the modern Olympic movement?', 'Pierre de Coubertin', 'Juan Antonio Samaranch', 'Avery Brundage', 'Baron Rothschild'),
      Q('Who scored the first perfect 10 in Olympic gymnastics, in 1976?', 'Nadia Comăneci', 'Olga Korbut', 'Mary Lou Retton', 'Simone Biles'),
      Q('In which sport did the young Muhammad Ali win 1960 Olympic gold?', 'Boxing', 'Wrestling', 'Judo', 'Weightlifting'),
      Q('The Sydney 2000 Olympics were held in which country?', 'Australia', 'Canada', 'Greece', 'South Korea'),
      Q('Which nation traditionally marches first in the opening ceremony?', 'Greece', 'The host nation', 'France', 'The previous host'),
      Q('The biathlon combines rifle shooting with which sport?', 'Cross-country skiing', 'Running', 'Cycling', 'Swimming'),
      Q('What is the longest running race in the Olympic athletics programme?', 'The marathon', 'The 10,000 metres', 'The 5,000 metres', 'The steeplechase')
    ]
  });

  makeQuiz({
    id: 'quiz-basketball', title: 'Basketball Quiz', emo: '🏀',
    tagline: 'Ten feet up, 24 seconds to shoot',
    desc: 'From Dr. Naismith\'s peach baskets to the 24-second shot clock: three-pointers, ' +
      'triple-doubles, Wilt\'s 100-point night and the Lakers–Celtics rivalry. Quick answers ' +
      'earn up to +150 a question before the streak bonus even starts stacking.',
    colors: ['#ea580c', '#7c3aed'],
    tags: ['trivia', 'quiz', 'basketball', 'nba', 'sports'],
    bank: [
      Q('How many points is a free throw worth?', '1', '2', '3', '4'),
      Q('How high is a regulation basketball hoop?', '10 feet', '9 feet', '11 feet', '12 feet'),
      Q('Who invented basketball in 1891?', 'James Naismith', 'Abner Doubleday', 'Walter Camp', 'George Mikan'),
      Q('A shot made from beyond the arc is worth how many points?', '3', '2', '4', '5'),
      Q('Who scored 100 points in a single NBA game in 1962?', 'Wilt Chamberlain', 'Bill Russell', 'Michael Jordan', 'Kobe Bryant'),
      Q('Michael Jordan won six championships with which team?', 'The Chicago Bulls', 'The Los Angeles Lakers', 'The Boston Celtics', 'The Detroit Pistons'),
      Q('How many seconds does an NBA team have to attempt a shot?', '24', '30', '20', '35'),
      Q('Taking steps without dribbling the ball is called what?', 'Traveling', 'Charging', 'Goaltending', 'Palming'),
      Q('Kareem Abdul-Jabbar was famous for which unstoppable shot?', 'The skyhook', 'The fadeaway', 'The floater', 'The bank shot'),
      Q('The Lakers play their home games in which city?', 'Los Angeles', 'San Francisco', 'Las Vegas', 'Sacramento'),
      Q('In which US state was basketball invented?', 'Massachusetts', 'New York', 'Indiana', 'Illinois'),
      Q('Double figures in three stat categories in one game is called a what?', 'Triple-double', 'Hat-trick', 'Turkey', 'Three-peat'),
      Q('Which famous team is based in Boston?', 'The Celtics', 'The Knicks', 'The Bulls', 'The Heat'),
      Q('What does NBA stand for?', 'National Basketball Association', 'North American Basketball Alliance', 'National Basketball Alliance', 'New Basketball Association'),
      Q('Grabbing the ball after a missed shot is called a what?', 'Rebound', 'Steal', 'Block', 'Assist'),
      Q('The 1980s Magic Johnson–Larry Bird rivalry starred which two teams?', 'Lakers and Celtics', 'Bulls and Pistons', 'Knicks and Heat', 'Spurs and Suns'),
      Q('The Harlem Globetrotters are famous for what?', 'Entertaining trick-shot basketball', 'Winning NBA titles', 'Olympic gold medals', 'College basketball'),
      Q('Slapping the backboard-bound ball down into the hoop with force is a what?', 'Slam dunk', 'Layup', 'Jump shot', 'Tip-in'),
      Q('A pass that leads directly to a teammate\'s basket is an what?', 'Assist', 'Alley pass', 'Outlet', 'Entry'),
      Q('How many quarters are in an NBA game?', '4', '2', '3', '5')
    ]
  });

  makeQuiz({
    id: 'quiz-tennis', title: 'Tennis Quiz', emo: '🎾',
    tagline: 'Love, deuce and the King of Clay',
    desc: 'Serve into a bank of aces: why zero is "love", what happens at deuce, the grass of ' +
      'Wimbledon versus the clay of Roland-Garros, and champions from Borg to Serena. Miss three ' +
      'and the umpire calls game over.',
    colors: ['#a3e635', '#0d9488'],
    tags: ['trivia', 'quiz', 'tennis', 'sports'],
    bank: [
      Q('How many Grand Slam tournaments are played each year?', '4', '3', '5', '6'),
      Q('Wimbledon is played on which surface?', 'Grass', 'Clay', 'Hard court', 'Carpet'),
      Q('The French Open is played on which surface?', 'Clay', 'Grass', 'Hard court', 'Carpet'),
      Q('What is the score called when both players are on 40?', 'Deuce', 'Advantage', 'Level', 'Set point'),
      Q('What is the point won immediately after deuce called?', 'Advantage', 'Match point', 'Break point', 'Game point'),
      Q('Wimbledon is held in which country?', 'England', 'France', 'Australia', 'The United States'),
      Q('A serve the receiver never touches is called an what?', 'Ace', 'Let', 'Fault', 'Winner'),
      Q('Serena Williams played for which country?', 'The United States', 'Great Britain', 'Australia', 'Canada'),
      Q('Tennis legend Björn Borg comes from which country?', 'Sweden', 'Norway', 'Germany', 'Switzerland'),
      Q('Which Grand Slam is played in Melbourne?', 'The Australian Open', 'The US Open', 'The French Open', 'Wimbledon'),
      Q('The US Open is played in which city?', 'New York', 'Los Angeles', 'Miami', 'Chicago'),
      Q('Roger Federer comes from which country?', 'Switzerland', 'Germany', 'Austria', 'Sweden'),
      Q('Rafael Nadal, the "King of Clay", plays for which country?', 'Spain', 'Portugal', 'Argentina', 'Italy'),
      Q('A serve that clips the net but lands in is called a what?', 'Let', 'Fault', 'Ace', 'Lob'),
      Q('In tennis scoring, what comes after 15 and 30?', '40', '45', '50', '35'),
      Q('The Australian, French and US Opens plus which event make the Grand Slam?', 'Wimbledon', 'The Davis Cup', 'The ATP Finals', 'Indian Wells'),
      Q('A tiebreak is usually won by the first player to how many points?', '7', '5', '6', '10'),
      Q('Steffi Graf, who won all four majors in 1988, comes from which country?', 'Germany', 'Austria', 'Switzerland', 'The Netherlands'),
      Q('Hitting the ball before it bounces is called a what?', 'Volley', 'Lob', 'Slice', 'Drop shot'),
      Q('How many sets must a player win in a best-of-five match?', '3', '2', '4', '5')
    ]
  });

  makeQuiz({
    id: 'quiz-music-theory', title: 'Music Theory Quiz', emo: '🎼',
    tagline: 'Five lines, twelve semitones, one clock',
    desc: 'Read the staff under pressure: sharps and flats, forte and piano, why a waltz counts in ' +
      'three and how many semitones fit in an octave. Crescendos, triads and the G clef all make ' +
      'appearances — answer fast for the +50 speed bonus.',
    colors: ['#8b5cf6', '#ec4899'],
    tags: ['trivia', 'quiz', 'music', 'theory'],
    bank: [
      Q('How many lines does a musical staff have?', '5', '4', '6', '7'),
      Q('How many different notes are in a major scale?', '7', '8', '6', '5'),
      Q('What does the dynamic marking "forte" mean?', 'Loud', 'Soft', 'Fast', 'Slow'),
      Q('What does the dynamic marking "piano" mean?', 'Soft', 'Loud', 'Smooth', 'Short'),
      Q('How many beats does a whole note get in 4/4 time?', '4', '2', '1', '8'),
      Q('The treble clef is also known as which clef?', 'The G clef', 'The F clef', 'The C clef', 'The A clef'),
      Q('The bass clef is also known as which clef?', 'The F clef', 'The G clef', 'The C clef', 'The D clef'),
      Q('How many semitones are in an octave?', '12', '8', '10', '7'),
      Q('Which symbol raises a note by a semitone?', 'A sharp', 'A flat', 'A natural', 'A fermata'),
      Q('Which symbol lowers a note by a semitone?', 'A flat', 'A sharp', 'A rest', 'A tie'),
      Q('What does the tempo marking "allegro" mean?', 'Fast and lively', 'Slow and stately', 'Very quiet', 'Gradually louder'),
      Q('What does the tempo marking "adagio" mean?', 'Slow', 'Fast', 'Loud', 'Bouncy'),
      Q('A waltz is counted in which time signature?', '3/4', '4/4', '2/4', '6/8'),
      Q('The distance between two pitches is called an what?', 'Interval', 'Octave gap', 'Accent', 'Anthem'),
      Q('Three or more notes sounded together make a what?', 'Chord', 'Scale', 'Melody', 'Motif'),
      Q('How many notes are in a basic triad?', '3', '2', '4', '5'),
      Q('Gradually getting louder is called a what?', 'Crescendo', 'Diminuendo', 'Staccato', 'Glissando'),
      Q('Gradually getting softer is called a what?', 'Diminuendo', 'Crescendo', 'Ritardando', 'Vibrato'),
      Q('What does singing "a cappella" mean?', 'Without instruments', 'At full volume', 'In Latin', 'From memory'),
      Q('Tempo is commonly measured in what?', 'Beats per minute', 'Notes per bar', 'Hertz', 'Decibels')
    ]
  });

  makeQuiz({
    id: 'quiz-classical-music', title: 'Classical Music Quiz', emo: '🎻',
    tagline: 'Vivaldi\'s seasons to Wagner\'s Valkyries',
    desc: 'The concert hall\'s greatest hits: The Four Seasons, the Moonlight Sonata, Tchaikovsky\'s ' +
      'Nutcracker and the Ride of the Valkyries, with composer lives from Chopin\'s Poland to ' +
      'Beethoven\'s fading hearing. Streaks are where the big scores live.',
    colors: ['#b45309', '#fbbf24'],
    tags: ['trivia', 'quiz', 'classical', 'music', 'composers'],
    bank: [
      Q('Who composed The Four Seasons?', 'Vivaldi', 'Bach', 'Mozart', 'Handel'),
      Q('What was Mozart\'s first name?', 'Wolfgang', 'Ludwig', 'Johann', 'Franz'),
      Q('Mozart was born in which country?', 'Austria', 'Germany', 'Italy', 'Hungary'),
      Q('Johann Sebastian Bach was what nationality?', 'German', 'Austrian', 'Italian', 'French'),
      Q('Who composed the Ride of the Valkyries?', 'Wagner', 'Beethoven', 'Brahms', 'Liszt'),
      Q('Who composed the Moonlight Sonata?', 'Beethoven', 'Mozart', 'Chopin', 'Schubert'),
      Q('Which Tchaikovsky ballet is a Christmas favourite?', 'The Nutcracker', 'Swan Lake', 'Giselle', 'Coppélia'),
      Q('Who composed Swan Lake?', 'Tchaikovsky', 'Stravinsky', 'Prokofiev', 'Rachmaninoff'),
      Q('The Hallelujah Chorus comes from which Handel work?', 'Messiah', 'Water Music', 'The Creation', 'The Seasons'),
      Q('Chopin composed almost entirely for which instrument?', 'The piano', 'The violin', 'The cello', 'The organ'),
      Q('Chopin was born in which country?', 'Poland', 'France', 'Austria', 'Hungary'),
      Q('Who composed Eine kleine Nachtmusik?', 'Mozart', 'Haydn', 'Bach', 'Beethoven'),
      Q('A classical symphony traditionally has how many movements?', '4', '3', '5', '2'),
      Q('Who composed The Blue Danube waltz?', 'Johann Strauss II', 'Franz Schubert', 'Joseph Haydn', 'Franz Liszt'),
      Q('Which composer is nicknamed the "Father of the Symphony"?', 'Haydn', 'Mozart', 'Bach', 'Handel'),
      Q('Beethoven gradually lost which sense while still composing?', 'Hearing', 'Sight', 'Touch', 'Smell'),
      Q('Who composed the piano piece Für Elise?', 'Beethoven', 'Chopin', 'Mozart', 'Schumann'),
      Q('In the Hall of the Mountain King comes from whose Peer Gynt music?', 'Grieg', 'Sibelius', 'Dvořák', 'Wagner'),
      Q('Who composed the hypnotic one-crescendo orchestral piece Boléro?', 'Ravel', 'Debussy', 'Satie', 'Bizet'),
      Q('Who wrote the frantic Flight of the Bumblebee?', 'Rimsky-Korsakov', 'Mussorgsky', 'Borodin', 'Glinka')
    ]
  });

  makeQuiz({
    id: 'quiz-instruments', title: 'Instruments Quiz', emo: '🎺',
    tagline: 'Slides, reeds, bellows and bows',
    desc: 'Tour the orchestra and beyond: which family the trumpet and flute belong to, the ' +
      'trombone\'s slide, the harp\'s 40-plus strings, and travelling instruments like the sitar, ' +
      'didgeridoo and steelpan. Three lives, twelve questions, fifteen seconds each.',
    colors: ['#eab308', '#dc2626'],
    tags: ['trivia', 'quiz', 'instruments', 'music'],
    bank: [
      Q('How many strings does a standard guitar have?', '6', '4', '5', '7'),
      Q('The trumpet belongs to which instrument family?', 'Brass', 'Woodwind', 'Percussion', 'Strings'),
      Q('The flute belongs to which instrument family?', 'Woodwind', 'Brass', 'Strings', 'Percussion'),
      Q('What is the largest string instrument in the orchestra?', 'The double bass', 'The cello', 'The harp', 'The viola'),
      Q('Timpani are also known as what?', 'Kettledrums', 'Snare drums', 'Bongos', 'Tom-toms'),
      Q('Which plucked orchestral instrument has around 47 strings and pedals?', 'The harp', 'The lute', 'The zither', 'The banjo'),
      Q('Despite its metal body, the saxophone is classified in which family?', 'Woodwind', 'Brass', 'Percussion', 'Strings'),
      Q('Inside a piano, the strings are struck by what?', 'Hammers', 'Picks', 'Quills', 'Mallets'),
      Q('Bagpipes are most associated with which country?', 'Scotland', 'Ireland', 'Wales', 'Norway'),
      Q('The sitar comes from which country?', 'India', 'China', 'Egypt', 'Turkey'),
      Q('The didgeridoo comes from which country?', 'Australia', 'New Zealand', 'Brazil', 'South Africa'),
      Q('An accordion makes sound when air is pushed by its what?', 'Bellows', 'Pistons', 'Pump keys', 'Foot pedal'),
      Q('Which brass instrument changes pitch with a slide?', 'The trombone', 'The trumpet', 'The tuba', 'The French horn'),
      Q('What is the largest and lowest brass instrument in the orchestra?', 'The tuba', 'The trombone', 'The euphonium', 'The French horn'),
      Q('The ukulele is most associated with which islands?', 'Hawaii', 'The Canaries', 'Fiji', 'The Azores'),
      Q('Which percussion instrument has wooden bars struck with mallets?', 'The xylophone', 'The triangle', 'The timpani', 'The cymbals'),
      Q('The oboe uses what kind of reed?', 'A double reed', 'A single reed', 'No reed', 'A metal reed'),
      Q('A violin is usually played with a what?', 'Bow', 'Pick', 'Mallet', 'Thumb pick'),
      Q('What is the smallest, highest-pitched instrument of the flute family?', 'The piccolo', 'The recorder', 'The fife', 'The ocarina'),
      Q('The steelpan (steel drum) was invented in which country?', 'Trinidad and Tobago', 'Jamaica', 'Cuba', 'Brazil')
    ]
  });

  makeQuiz({
    id: 'quiz-art-history', title: 'Art History Quiz', emo: '🎨',
    tagline: 'Renaissance masters to drip painting',
    desc: 'Five centuries of art in twelve questions: Michelangelo on the Sistine ceiling, the ' +
      'movement named after Monet\'s Impression, Sunrise, Picasso\'s Cubism, Dalí\'s Surrealism ' +
      'and Warhol\'s soup cans. One tip: the movements are half the answers.',
    colors: ['#e11d48', '#6366f1'],
    tags: ['trivia', 'quiz', 'art', 'history', 'painters'],
    bank: [
      Q('In which museum does the Mona Lisa hang?', 'The Louvre', 'The Uffizi', 'The Prado', 'The British Museum'),
      Q('Who painted the ceiling of the Sistine Chapel?', 'Michelangelo', 'Leonardo da Vinci', 'Raphael', 'Botticelli'),
      Q('Who painted The Starry Night?', 'Vincent van Gogh', 'Claude Monet', 'Paul Cézanne', 'Paul Gauguin'),
      Q('Van Gogh famously cut off part of his own what?', 'Ear', 'Finger', 'Nose', 'Thumb'),
      Q('Pablo Picasso co-founded which art movement?', 'Cubism', 'Impressionism', 'Surrealism', 'Pop Art'),
      Q('What nationality was Pablo Picasso?', 'Spanish', 'French', 'Italian', 'Mexican'),
      Q('Impressionism took its name from a painting by whom?', 'Claude Monet', 'Édouard Manet', 'Edgar Degas', 'Auguste Renoir'),
      Q('Who sculpted the marble statue of David?', 'Michelangelo', 'Donatello', 'Bernini', 'Rodin'),
      Q('The Renaissance began in which country?', 'Italy', 'France', 'Greece', 'Spain'),
      Q('Rembrandt was a master painter from which country?', 'The Netherlands', 'Germany', 'Belgium', 'Denmark'),
      Q('Andy Warhol was a leading figure of which movement?', 'Pop Art', 'Cubism', 'Dadaism', 'Expressionism'),
      Q('Warhol famously painted cans of which product?', 'Campbell\'s soup', 'Coca-Cola', 'Heinz beans', 'Spam'),
      Q('Painter Frida Kahlo came from which country?', 'Mexico', 'Spain', 'Argentina', 'Colombia'),
      Q('Who sculpted The Thinker?', 'Auguste Rodin', 'Michelangelo', 'Henry Moore', 'Constantin Brâncuși'),
      Q('Who painted The Last Supper on a Milan monastery wall?', 'Leonardo da Vinci', 'Michelangelo', 'Titian', 'Caravaggio'),
      Q('Salvador Dalí belonged to which movement?', 'Surrealism', 'Cubism', 'Impressionism', 'Realism'),
      Q('Jackson Pollock was famous for which technique?', 'Drip painting', 'Pointillism', 'Fresco', 'Collage'),
      Q('Georges Seurat painted with tiny dots in a technique called what?', 'Pointillism', 'Impasto', 'Sfumato', 'Cross-hatching'),
      Q('Georgia O\'Keeffe is celebrated for her giant paintings of what?', 'Flowers', 'Horses', 'Skyscrapers only', 'The sea'),
      Q('Claude Monet painted a famous series of what in his garden at Giverny?', 'Water lilies', 'Sunflowers', 'Haystacks only', 'Roses')
    ]
  });

  makeQuiz({
    id: 'quiz-famous-paintings', title: 'Famous Paintings Quiz', emo: '🖼️',
    tagline: 'Name the hand behind the canvas',
    desc: 'One masterpiece per question: The Scream, Girl with a Pearl Earring, the melting clocks ' +
      'of The Persistence of Memory, Hokusai\'s Great Wave and Grant Wood\'s pitchfork-wielding ' +
      'American Gothic. Match each canvas to its painter before the bar runs dry.',
    colors: ['#0891b2', '#f472b6'],
    tags: ['trivia', 'quiz', 'paintings', 'art'],
    bank: [
      Q('Who painted The Scream?', 'Edvard Munch', 'Gustav Klimt', 'Egon Schiele', 'Paul Klee'),
      Q('Who painted Girl with a Pearl Earring?', 'Johannes Vermeer', 'Rembrandt', 'Frans Hals', 'Jan Steen'),
      Q('The Persistence of Memory, with its melting clocks, is by whom?', 'Salvador Dalí', 'René Magritte', 'Pablo Picasso', 'Joan Miró'),
      Q('Who painted American Gothic, the farmer with a pitchfork?', 'Grant Wood', 'Edward Hopper', 'Norman Rockwell', 'Andrew Wyeth'),
      Q('Who painted The Birth of Venus?', 'Botticelli', 'Titian', 'Raphael', 'Caravaggio'),
      Q('Guernica, a vast protest against war, is by whom?', 'Pablo Picasso', 'Salvador Dalí', 'Francisco Goya', 'Joan Miró'),
      Q('Who painted The Night Watch?', 'Rembrandt', 'Vermeer', 'Rubens', 'Van Dyck'),
      Q('The famous Sunflowers series is by whom?', 'Vincent van Gogh', 'Claude Monet', 'Paul Gauguin', 'Henri Matisse'),
      Q('The Kiss, glittering with gold leaf, is by whom?', 'Gustav Klimt', 'Edvard Munch', 'Marc Chagall', 'Amedeo Modigliani'),
      Q('The huge Water Lilies canvases are by whom?', 'Claude Monet', 'Édouard Manet', 'Camille Pissarro', 'Alfred Sisley'),
      Q('The portrait known as Whistler\'s Mother was painted by whom?', 'James Whistler', 'John Singer Sargent', 'Thomas Gainsborough', 'Winslow Homer'),
      Q('The Mona Lisa is world-famous for her mysterious what?', 'Smile', 'Hat', 'Jewellery', 'Hands'),
      Q('Liberty Leading the People, flag held high, is by whom?', 'Eugène Delacroix', 'Jacques-Louis David', 'Théodore Géricault', 'Gustave Courbet'),
      Q('The Garden of Earthly Delights triptych is by whom?', 'Hieronymus Bosch', 'Pieter Bruegel', 'Albrecht Dürer', 'Jan van Eyck'),
      Q('Nighthawks, the late-night diner scene, is by whom?', 'Edward Hopper', 'Grant Wood', 'Norman Rockwell', 'George Bellows'),
      Q('The Arnolfini Portrait of a merchant couple is by whom?', 'Jan van Eyck', 'Hieronymus Bosch', 'Hans Holbein', 'Rogier van der Weyden'),
      Q('Las Meninas, painted at the Spanish court, is by whom?', 'Diego Velázquez', 'Francisco Goya', 'El Greco', 'Bartolomé Murillo'),
      Q('The Great Wave off Kanagawa is a print by whom?', 'Hokusai', 'Hiroshige', 'Utamaro', 'Sesshū'),
      Q('The Hay Wain, a quiet English river scene, is by whom?', 'John Constable', 'J. M. W. Turner', 'Thomas Gainsborough', 'William Blake'),
      Q('Grids of black lines and primary-colour blocks are the trademark of whom?', 'Piet Mondrian', 'Wassily Kandinsky', 'Kazimir Malevich', 'Paul Klee')
    ]
  });

  makeQuiz({
    id: 'quiz-literature', title: 'Literature Quiz', emo: '📚',
    tagline: 'From Verona to Middle-earth',
    desc: 'Great books and the people who wrote them: Orwell\'s 1984, Austen\'s Pride and ' +
      'Prejudice, Hercule Poirot, Captain Ahab\'s white whale and the city where Romeo met ' +
      'Juliet. Authors, characters and famous settings, twelve at a time from a deep shelf.',
    colors: ['#78350f', '#f59e0b'],
    tags: ['trivia', 'quiz', 'literature', 'books', 'authors'],
    bank: [
      Q('In which Italian city is Romeo and Juliet set?', 'Verona', 'Venice', 'Rome', 'Florence'),
      Q('Who wrote the novel 1984?', 'George Orwell', 'Aldous Huxley', 'Ray Bradbury', 'H. G. Wells'),
      Q('Who wrote Pride and Prejudice?', 'Jane Austen', 'Charlotte Brontë', 'Emily Brontë', 'George Eliot'),
      Q('Who created the detective Sherlock Holmes?', 'Arthur Conan Doyle', 'Agatha Christie', 'Edgar Allan Poe', 'Wilkie Collins'),
      Q('Who wrote Moby-Dick?', 'Herman Melville', 'Mark Twain', 'Nathaniel Hawthorne', 'Jack London'),
      Q('In Moby-Dick, Captain Ahab hunts a giant white what?', 'Whale', 'Shark', 'Squid', 'Bear'),
      Q('Who wrote the Harry Potter series?', 'J. K. Rowling', 'Roald Dahl', 'C. S. Lewis', 'Philip Pullman'),
      Q('Who wrote The Adventures of Tom Sawyer?', 'Mark Twain', 'Charles Dickens', 'Herman Melville', 'Jack London'),
      Q('Who wrote War and Peace?', 'Leo Tolstoy', 'Fyodor Dostoevsky', 'Anton Chekhov', 'Ivan Turgenev'),
      Q('Which Cervantes hero famously tilts at windmills?', 'Don Quixote', 'Sancho Panza', 'El Cid', 'Lazarillo'),
      Q('What is the name of the miser in A Christmas Carol?', 'Ebenezer Scrooge', 'Bob Cratchit', 'Jacob Marley', 'Mr Fezziwig'),
      Q('Who wrote Oliver Twist?', 'Charles Dickens', 'Thomas Hardy', 'Anthony Trollope', 'William Thackeray'),
      Q('Shakespeare was born in which English town?', 'Stratford-upon-Avon', 'Oxford', 'Canterbury', 'York'),
      Q('Who wrote The Old Man and the Sea?', 'Ernest Hemingway', 'John Steinbeck', 'F. Scott Fitzgerald', 'William Faulkner'),
      Q('Who is Agatha Christie\'s famous Belgian detective?', 'Hercule Poirot', 'Miss Marple', 'Inspector Maigret', 'Father Brown'),
      Q('Who wrote Frankenstein?', 'Mary Shelley', 'Bram Stoker', 'Percy Shelley', 'Lord Byron'),
      Q('Who wrote Dracula?', 'Bram Stoker', 'Mary Shelley', 'Edgar Allan Poe', 'Robert Louis Stevenson'),
      Q('Who wrote The Lord of the Rings?', 'J. R. R. Tolkien', 'C. S. Lewis', 'George R. R. Martin', 'Terry Pratchett'),
      Q('Who wrote To Kill a Mockingbird?', 'Harper Lee', 'Toni Morrison', 'John Steinbeck', 'Truman Capote'),
      Q('Who wrote The Three Musketeers?', 'Alexandre Dumas', 'Victor Hugo', 'Jules Verne', 'Gustave Flaubert'),
      Q('Who wrote Alice\'s Adventures in Wonderland?', 'Lewis Carroll', 'J. M. Barrie', 'Kenneth Grahame', 'Edward Lear')
    ]
  });

  makeQuiz({
    id: 'quiz-fairy-tales', title: 'Fairy Tales Quiz', emo: '🧚',
    tagline: 'Glass slippers and gingerbread walls',
    desc: 'Once upon a time, with a timer: Cinderella\'s slipper, the seven dwarfs, the brick house ' +
      'that beat the Big Bad Wolf, Rumpelstiltskin\'s golden straw and the beanstalk Jack ' +
      'climbed. Gentle questions, but the streak bonus rewards a perfect memory of the classics.',
    colors: ['#f472b6', '#a78bfa'],
    tags: ['trivia', 'quiz', 'fairy-tales', 'stories'],
    bank: [
      Q('What did Cinderella leave behind at the ball?', 'A glass slipper', 'A silk glove', 'A tiara', 'A necklace'),
      Q('How many dwarfs live with Snow White?', '7', '6', '8', '5'),
      Q('Who huffed and puffed to blow the little pigs\' houses down?', 'The Big Bad Wolf', 'A giant', 'A troll', 'A dragon'),
      Q('In The Three Little Pigs, which house survives the wolf?', 'The brick house', 'The straw house', 'The stick house', 'The stone castle'),
      Q('Sleeping Beauty pricked her finger on a what?', 'Spindle', 'Rose thorn', 'Needle in a haystack', 'Poisoned pin'),
      Q('Rapunzel is famous for her extremely long what?', 'Hair', 'Dress', 'Ladder', 'Memory'),
      Q('Hansel and Gretel discover a house made of what?', 'Gingerbread and sweets', 'Straw', 'Cheese', 'Gold'),
      Q('What did Jack climb to reach the giant\'s castle?', 'A beanstalk', 'A mountain', 'A rope', 'A tower'),
      Q('What did Jack trade the family cow for?', 'Magic beans', 'A golden egg', 'A harp', 'Three wishes'),
      Q('Little Red Riding Hood sets off to visit whom?', 'Her grandmother', 'Her aunt', 'The woodcutter', 'Her sister'),
      Q('Who wrote The Little Mermaid?', 'Hans Christian Andersen', 'The Brothers Grimm', 'Charles Perrault', 'Aesop'),
      Q('In Andersen\'s tale, the Ugly Duckling grows into a what?', 'Swan', 'Peacock', 'Goose', 'Heron'),
      Q('Rumpelstiltskin spins straw into what?', 'Gold', 'Silk', 'Silver', 'Rope'),
      Q('What happens to Pinocchio\'s nose when he lies?', 'It grows longer', 'It turns blue', 'It falls off', 'It whistles'),
      Q('Who carved and raised Pinocchio?', 'Geppetto', 'Alberto', 'Antonio', 'Giovanni'),
      Q('Goldilocks wanders into the house of the three what?', 'Bears', 'Wolves', 'Goats', 'Giants'),
      Q('The Brothers Grimm collected their fairy tales in which country?', 'Germany', 'France', 'Denmark', 'England'),
      Q('In The Emperor\'s New Clothes, what is the emperor really wearing?', 'Nothing at all', 'Rags', 'A paper crown', 'His old uniform'),
      Q('What kind of animal is Puss in Boots?', 'A cat', 'A fox', 'A rabbit', 'A dog'),
      Q('Snow White\'s stepmother keeps asking her mirror who is the most what?', 'Fair', 'Rich', 'Clever', 'Powerful')
    ]
  });

  makeQuiz({
    id: 'quiz-food-cooking', title: 'Food & Cooking Quiz', emo: '🍳',
    tagline: 'Saffron, sushi and al dente science',
    desc: 'A world tour of the kitchen: the chickpeas in hummus, the basil in pesto, why saffron ' +
      'costs more than any other spice, and which countries gave us sushi, paella, goulash and ' +
      'kimchi. Answer before the bar empties — hesitation costs the speed bonus.',
    colors: ['#f97316', '#84cc16'],
    tags: ['trivia', 'quiz', 'food', 'cooking'],
    bank: [
      Q('Sushi comes from which country?', 'Japan', 'China', 'Thailand', 'Vietnam'),
      Q('What is the main ingredient of guacamole?', 'Avocado', 'Cucumber', 'Green pepper', 'Zucchini'),
      Q('Paella is a rice dish from which country?', 'Spain', 'Italy', 'Portugal', 'Mexico'),
      Q('What is the main ingredient of hummus?', 'Chickpeas', 'Lentils', 'White beans', 'Eggplant'),
      Q('Which herb is the base of classic pesto?', 'Basil', 'Parsley', 'Oregano', 'Mint'),
      Q('The margherita pizza\'s colours honour which country\'s flag?', 'Italy', 'France', 'Spain', 'Greece'),
      Q('Profiteroles and éclairs are made from which pastry?', 'Choux', 'Puff', 'Filo', 'Shortcrust'),
      Q('Goulash is the national stew of which country?', 'Hungary', 'Poland', 'Austria', 'Romania'),
      Q('Sauerkraut is made by fermenting which vegetable?', 'Cabbage', 'Cucumber', 'Turnip', 'Onion'),
      Q('Kimchi is a staple of which country\'s cuisine?', 'Korea', 'Japan', 'China', 'Thailand'),
      Q('Which is the most expensive spice in the world by weight?', 'Saffron', 'Vanilla', 'Cardamom', 'Cinnamon'),
      Q('Saffron threads are harvested from which flower?', 'The crocus', 'The tulip', 'The orchid', 'The marigold'),
      Q('Tofu is made from which plant?', 'Soybeans', 'Rice', 'Chickpeas', 'Wheat'),
      Q('Pasta cooked "al dente" is what?', 'Firm to the bite', 'Very soft', 'Cold', 'Crispy'),
      Q('What are dried plums called?', 'Prunes', 'Raisins', 'Dates', 'Currants'),
      Q('Which gas produced by yeast makes bread rise?', 'Carbon dioxide', 'Oxygen', 'Nitrogen', 'Hydrogen'),
      Q('Wasabi is closest in flavour to which condiment?', 'Horseradish', 'Mustard', 'Chilli sauce', 'Garlic paste'),
      Q('Which cheese belongs in a traditional Greek salad?', 'Feta', 'Mozzarella', 'Cheddar', 'Brie'),
      Q('Bolognese sauce is named after which Italian city?', 'Bologna', 'Naples', 'Milan', 'Turin'),
      Q('Marzipan is made mainly from sugar and which nut?', 'Almonds', 'Hazelnuts', 'Walnuts', 'Pistachios'),
      Q('Ratatouille is a vegetable dish from which country?', 'France', 'Italy', 'Spain', 'Greece')
    ]
  });

  makeQuiz({
    id: 'quiz-coffee-chocolate', title: 'Coffee & Chocolate Quiz', emo: '🍫',
    tagline: 'From cacao pod to espresso shot',
    desc: 'Two beloved beans, one quiz: Ethiopia\'s coffee legend, Brazil\'s harvest crown, arabica ' +
      'versus robusta, the Mesoamerican origins of drinking chocolate and why "theobroma" means ' +
      'food of the gods. Watch out for white chocolate — it hides a trick of chemistry, not wording.',
    colors: ['#92400e', '#fde68a'],
    tags: ['trivia', 'quiz', 'coffee', 'chocolate', 'food'],
    bank: [
      Q('Chocolate is made from the beans of which tree?', 'The cacao tree', 'The carob tree', 'The coffee tree', 'The vanilla vine'),
      Q('Espresso was invented in which country?', 'Italy', 'France', 'Brazil', 'Turkey'),
      Q('A cappuccino tops espresso with what?', 'Steamed milk and foam', 'Whipped cream', 'Hot water', 'Condensed milk'),
      Q('Which chocolate contains cocoa butter but no cocoa solids?', 'White chocolate', 'Milk chocolate', 'Dark chocolate', 'Baking chocolate'),
      Q('Coffee beans are the seeds of a small fruit resembling a what?', 'Cherry', 'Grape', 'Plum', 'Fig'),
      Q('Legend says coffee was first discovered in which country?', 'Ethiopia', 'Brazil', 'Colombia', 'Yemen'),
      Q('Which country grows the most coffee in the world?', 'Brazil', 'Colombia', 'Vietnam', 'Ethiopia'),
      Q('What are the two main species of coffee grown commercially?', 'Arabica and robusta', 'Mocha and java', 'Arabica and liberica', 'Robusta and excelsa'),
      Q('Chocolate was first enjoyed as a drink in which region?', 'Mesoamerica', 'West Africa', 'Southern Europe', 'Southeast Asia'),
      Q('Milk chocolate was pioneered in which country?', 'Switzerland', 'Belgium', 'England', 'The United States'),
      Q('What does a "mocha" add to coffee?', 'Chocolate', 'Caramel', 'Cinnamon', 'Vanilla'),
      Q('An americano is espresso lengthened with what?', 'Hot water', 'Steamed milk', 'Cold milk', 'Cream'),
      Q('What does "latte" mean in Italian?', 'Milk', 'Smooth', 'Morning', 'Strong'),
      Q('The cacao genus name Theobroma translates as what?', 'Food of the gods', 'Sweet seed', 'Brown gold', 'Bitter water'),
      Q('Dark chocolate has a higher percentage of what than milk chocolate?', 'Cocoa solids', 'Sugar', 'Milk powder', 'Butter'),
      Q('A classic praline filling is flavoured with what?', 'Nuts', 'Mint', 'Orange', 'Coconut'),
      Q('The first moulded chocolate bar was made by J. S. Fry & Sons in which country?', 'England', 'Switzerland', 'Belgium', 'France'),
      Q('Decaffeinated coffee has most of its what removed?', 'Caffeine', 'Acidity', 'Sugar', 'Oil'),
      Q('Turkish coffee is traditionally served how?', 'Unfiltered, grounds and all', 'Iced', 'With whipped cream', 'From a paper filter'),
      Q('Ganache is chocolate melted together with what?', 'Cream', 'Butter only', 'Egg whites', 'Honey'),
      Q('Cacao pods grow where on the tree?', 'Straight from the trunk and branches', 'Only on the highest twigs', 'Underground', 'In hanging clusters of leaves')
    ]
  });

  makeQuiz({
    id: 'quiz-board-games', title: 'Board Games Quiz', emo: '🎲',
    tagline: 'Pass Go, collect twelve questions',
    desc: 'Game night turned quiz night: Monopoly\'s $200 salary, the 10-point Q and Z of ' +
      'Scrabble, why opposite die faces always total seven, and where Snakes and Ladders and Go ' +
      'were really born. Roll through all twelve for the confetti finish.',
    colors: ['#dc2626', '#fbbf24'],
    tags: ['trivia', 'quiz', 'board-games', 'games'],
    bank: [
      Q('In Monopoly, how much do you collect for passing Go?', '$200', '$100', '$150', '$500'),
      Q('Which two Scrabble letters are worth 10 points each?', 'Q and Z', 'X and Z', 'J and Q', 'K and X'),
      Q('What is the most expensive property in the classic US Monopoly?', 'Boardwalk', 'Park Place', 'Marvin Gardens', 'Pennsylvania Avenue'),
      Q('In Clue (Cluedo), players race to solve a what?', 'Murder', 'Robbery', 'Kidnapping', 'Forgery'),
      Q('Snakes and Ladders originated in which country?', 'India', 'China', 'Egypt', 'Persia'),
      Q('How many dice does each backgammon player roll on a turn?', '2', '1', '3', '4'),
      Q('How many pieces does each player start with in checkers?', '12', '10', '16', '8'),
      Q('The board game Risk is a battle for control of what?', 'The world map', 'A castle', 'A treasure island', 'The high seas'),
      Q('In Battleship, you win by doing what?', 'Sinking the enemy fleet', 'Capturing the flag', 'Crossing the ocean first', 'Building the biggest fleet'),
      Q('Domino tiles are marked with what?', 'Dots called pips', 'Letters', 'Colours', 'Roman numerals'),
      Q('Opposite faces of a standard die always add up to what?', '7', '6', '8', '9'),
      Q('In Trivial Pursuit, what do you collect for mastering a category?', 'A wedge', 'A star', 'A token ring', 'A card'),
      Q('The ancient game of Go was invented in which country?', 'China', 'Japan', 'Korea', 'India'),
      Q('In Jenga, players take turns removing what?', 'Wooden blocks from a tower', 'Cards from a deck', 'Marbles from a bowl', 'Sticks from a pile'),
      Q('Pictionary is won by being good at what?', 'Drawing', 'Spelling', 'Acting', 'Whistling'),
      Q('A Scrabble board is a grid of how many squares per side?', '15', '12', '20', '10'),
      Q('Mancala is played by moving what around pits on a board?', 'Seeds or stones', 'Dice', 'Cards', 'Pegs'),
      Q('How many railroads are on a classic Monopoly board?', '4', '2', '3', '6'),
      Q('Reversi (Othello) is played with discs of which two colours?', 'Black and white', 'Red and blue', 'Red and black', 'Green and yellow'),
      Q('Ludo descends from Pachisi, a game from which country?', 'India', 'China', 'Greece', 'Mexico'),
      Q('In The Settlers of Catan, players collect what to build roads and towns?', 'Resource cards', 'Gold coins', 'Dice tokens', 'Letter tiles')
    ]
  });

  makeQuiz({
    id: 'quiz-chess-knowledge', title: 'Chess Knowledge Quiz', emo: '♟️',
    tagline: '64 squares of pure trivia',
    desc: 'No board needed, just what you know about the royal game: the knight\'s L-shaped hop, ' +
      'castling with a rook, pawn promotion, stalemate draws and Kasparov\'s famous 1997 match ' +
      'against Deep Blue. Even non-players can streak through the basics.',
    colors: ['#334155', '#94a3b8'],
    tags: ['trivia', 'quiz', 'chess', 'games'],
    bank: [
      Q('How many squares are on a chessboard?', '64', '81', '100', '49'),
      Q('How many pieces does each chess player start with?', '16', '12', '20', '15'),
      Q('How many pawns does each player begin with?', '8', '6', '10', '7'),
      Q('Which piece moves only diagonally?', 'The bishop', 'The rook', 'The knight', 'The queen'),
      Q('Which piece moves in an L-shape?', 'The knight', 'The bishop', 'The king', 'The rook'),
      Q('Which is the most powerful piece on the board?', 'The queen', 'The king', 'The rook', 'The bishop'),
      Q('The goal of chess is to checkmate which piece?', 'The king', 'The queen', 'The last rook', 'Every pawn'),
      Q('Castling is a joint move of the king and which piece?', 'A rook', 'A bishop', 'A knight', 'The queen'),
      Q('Which is the only piece that can leap over others?', 'The knight', 'The queen', 'The rook', 'The pawn'),
      Q('A pawn reaching the far end of the board can be what?', 'Promoted', 'Doubled', 'Castled', 'Freed'),
      Q('Which piece do players almost always promote a pawn into?', 'A queen', 'A rook', 'A knight', 'A second king'),
      Q('What is the result of a stalemate?', 'A draw', 'A win for White', 'A win for Black', 'A replay'),
      Q('"En passant" is a special capture made by which piece?', 'A pawn', 'A knight', 'A bishop', 'The king'),
      Q('The knight piece is traditionally carved as which animal?', 'A horse', 'A lion', 'An eagle', 'A dragon'),
      Q('Chess evolved from chaturanga, a game from which country?', 'India', 'China', 'Persia', 'Egypt'),
      Q('World champion Bobby Fischer came from which country?', 'The United States', 'Russia', 'Iceland', 'Hungary'),
      Q('Which computer beat world champion Garry Kasparov in 1997?', 'Deep Blue', 'Watson', 'AlphaZero', 'HAL'),
      Q('How does a rook move?', 'In straight lines along ranks and files', 'Diagonally only', 'One square any direction', 'In an L-shape'),
      Q('Which side always moves first in chess?', 'White', 'Black', 'The younger player', 'It is decided by a coin toss'),
      Q('How many squares can the king normally move at a time?', '1', '2', '3', 'As many as are free'),
      Q('What does "check" mean?', 'The king is under attack', 'The game is over', 'A piece was captured', 'A draw was offered')
    ]
  });

  makeQuiz({
    id: 'quiz-trains-planes', title: 'Trains & Planes Quiz', emo: '✈️',
    tagline: 'Kitty Hawk to the Shinkansen',
    desc: 'Travel trivia at full speed: the Wright brothers\' 1903 flight, Lindbergh\'s Spirit of ' +
      'St. Louis, Japan\'s bullet trains, the Orient Express route to Istanbul and why the ' +
      '"black box" is really orange. Twelve questions before the doors close.',
    colors: ['#0ea5e9', '#64748b'],
    tags: ['trivia', 'quiz', 'planes', 'trains', 'travel'],
    bank: [
      Q('Who made the first powered airplane flight in 1903?', 'The Wright brothers', 'Charles Lindbergh', 'The Montgolfier brothers', 'Louis Blériot'),
      Q('The Wright brothers first flew at Kitty Hawk, in which US state?', 'North Carolina', 'Ohio', 'Virginia', 'Kansas'),
      Q('The Orient Express classically ran from Paris to which city?', 'Istanbul', 'Moscow', 'Vienna', 'Athens'),
      Q('Japan\'s famous high-speed trains are called what?', 'Shinkansen', 'Maglev Express', 'Sakura Line', 'Hikari Rail'),
      Q('Concorde was famous for flying how?', 'Faster than sound', 'Without a pilot', 'On solar power', 'Around the world nonstop'),
      Q('Which instrument tells a pilot the plane\'s height?', 'The altimeter', 'The compass', 'The airspeed indicator', 'The gyroscope'),
      Q('What colour is an aircraft "black box" recorder actually painted?', 'Bright orange', 'Black', 'Silver', 'Red and white'),
      Q('What did Charles Lindbergh achieve in 1927?', 'The first solo nonstop Atlantic flight', 'The first flight over the North Pole', 'The first round-the-world flight', 'The first jet flight'),
      Q('What was Lindbergh\'s aircraft called?', 'The Spirit of St. Louis', 'The Flyer', 'The Enola Gay', 'The Memphis Belle'),
      Q('Amelia Earhart was the first woman to fly solo across which ocean?', 'The Atlantic', 'The Pacific', 'The Indian', 'The Arctic'),
      Q('The Trans-Siberian Railway runs from Moscow to which port city?', 'Vladivostok', 'St. Petersburg', 'Beijing', 'Murmansk'),
      Q('Which engineer built the pioneering 1829 locomotive "Rocket"?', 'George Stephenson', 'James Watt', 'Isambard Kingdom Brunel', 'Richard Trevithick'),
      Q('The Channel Tunnel links England with which country?', 'France', 'Belgium', 'The Netherlands', 'Ireland'),
      Q('Maglev trains glide above the track using what?', 'Magnets', 'Air cushions', 'Water jets', 'Rubber wheels'),
      Q('The airship Hindenburg was kept aloft by which gas?', 'Hydrogen', 'Helium', 'Hot air', 'Methane'),
      Q('Which airliner earned the nickname "Jumbo Jet"?', 'The Boeing 747', 'The Airbus A380', 'The Concorde', 'The DC-3'),
      Q('A helicopter gets its lift from what?', 'Spinning rotor blades', 'Fixed wings', 'Jet thrust alone', 'A propeller at the tail'),
      Q('What is the London Underground\'s famous nickname?', 'The Tube', 'The Metro', 'The Loop', 'The Subway'),
      Q('The Montgolfier brothers pioneered flight with what?', 'Hot-air balloons', 'Gliders', 'Kites', 'Airships'),
      Q('Who first flew faster than sound, in 1947?', 'Chuck Yeager', 'Neil Armstrong', 'Howard Hughes', 'John Glenn')
    ]
  });

  makeQuiz({
    id: 'quiz-cars-history', title: 'Cars History Quiz', emo: '🚗',
    tagline: 'Tin Lizzies and prancing horses',
    desc: 'A hundred-plus years of motoring: the Model T and its moving assembly line, what ' +
      '"Volkswagen" actually means, Lamborghini\'s tractor-building past and the badges — ' +
      'three-pointed star, four rings, prancing horse. Know your marques and the points pile up.',
    colors: ['#ef4444', '#1e293b'],
    tags: ['trivia', 'quiz', 'cars', 'history'],
    bank: [
      Q('Which car was first mass-produced on a moving assembly line?', 'The Ford Model T', 'The VW Beetle', 'The Chevrolet Bel Air', 'The Fiat 500'),
      Q('What was the Ford Model T\'s affectionate nickname?', 'The Tin Lizzie', 'The Bug', 'The Flivver Queen', 'The Iron Duke'),
      Q('Which US city became the heart of the American car industry?', 'Detroit', 'Chicago', 'Pittsburgh', 'Cleveland'),
      Q('What does "Volkswagen" mean in German?', 'People\'s car', 'Fast car', 'Little car', 'Strong wagon'),
      Q('The Volkswagen Beetle originated in which country?', 'Germany', 'Austria', 'Sweden', 'Italy'),
      Q('Besides luxury cars, Rolls-Royce is famous for building what?', 'Aircraft engines', 'Motorcycles', 'Tractors', 'Ships'),
      Q('Which animal appears on the Ferrari badge?', 'A prancing horse', 'A raging bull', 'A leaping jaguar', 'A lion'),
      Q('Before supercars, Lamborghini built what?', 'Tractors', 'Bicycles', 'Sewing machines', 'Aeroplanes'),
      Q('On which side of the road do cars drive in Britain?', 'The left', 'The right', 'Either side', 'The middle'),
      Q('What does RPM stand for?', 'Revolutions per minute', 'Rate per mile', 'Rotations per motor', 'Revs per machine'),
      Q('The original Mini was launched in 1959 in which country?', 'Britain', 'Italy', 'France', 'Germany'),
      Q('Which company builds the Mustang?', 'Ford', 'Chevrolet', 'Dodge', 'Pontiac'),
      Q('Which company builds the Corvette?', 'Chevrolet', 'Ford', 'Chrysler', 'Cadillac'),
      Q('Porsche is headquartered in which German city?', 'Stuttgart', 'Munich', 'Berlin', 'Frankfurt'),
      Q('Toyota comes from which country?', 'Japan', 'South Korea', 'China', 'The United States'),
      Q('Rudolf Diesel invented what?', 'The diesel engine', 'The seat belt', 'The airbag', 'The carburetor'),
      Q('What does a car\'s odometer measure?', 'Distance travelled', 'Speed', 'Fuel level', 'Engine temperature'),
      Q('Historic Route 66 ran from Chicago to which city?', 'Los Angeles', 'New York', 'Miami', 'Seattle'),
      Q('Which brand wears the three-pointed star?', 'Mercedes-Benz', 'BMW', 'Audi', 'Opel'),
      Q('Which brand wears four interlocking rings?', 'Audi', 'BMW', 'Volkswagen', 'Subaru')
    ]
  });

  makeQuiz({
    id: 'quiz-space-race', title: 'Space Race Quiz', emo: '🛰️',
    tagline: 'Sputnik beeps to Apollo footprints',
    desc: 'The Cold War sprint to the stars: Sputnik\'s 1957 shock, Gagarin\'s Vostok 1, Laika, ' +
      'Tereshkova, and the Eagle landing at Tranquility in 1969. From Kennedy\'s Moon promise to ' +
      'Apollo 17\'s last footprints, every launch is a question.',
    colors: ['#1e1b4b', '#f43f5e'],
    tags: ['trivia', 'quiz', 'space', 'history', 'apollo'],
    bank: [
      Q('What was the first artificial satellite, launched in 1957?', 'Sputnik 1', 'Explorer 1', 'Vanguard 1', 'Telstar'),
      Q('Which country launched Sputnik?', 'The Soviet Union', 'The United States', 'China', 'Britain'),
      Q('Which spacecraft carried Yuri Gagarin into orbit in 1961?', 'Vostok 1', 'Soyuz 1', 'Mercury 7', 'Sputnik 2'),
      Q('Who was the first American in space?', 'Alan Shepard', 'John Glenn', 'Gus Grissom', 'Neil Armstrong'),
      Q('Who was the first American to orbit the Earth?', 'John Glenn', 'Alan Shepard', 'Buzz Aldrin', 'Jim Lovell'),
      Q('Who was the first woman in space?', 'Valentina Tereshkova', 'Sally Ride', 'Svetlana Savitskaya', 'Mae Jemison'),
      Q('In which year did Apollo 11 land on the Moon?', '1969', '1967', '1971', '1965'),
      Q('Who was the second person to walk on the Moon?', 'Buzz Aldrin', 'Michael Collins', 'Pete Conrad', 'John Young'),
      Q('Who stayed in lunar orbit while Armstrong and Aldrin landed?', 'Michael Collins', 'Buzz Aldrin', 'Jim Lovell', 'Frank Borman'),
      Q('Which mission radioed "Houston, we\'ve had a problem"?', 'Apollo 13', 'Apollo 11', 'Apollo 8', 'Gemini 6'),
      Q('Laika, the first animal to orbit Earth, was what?', 'A dog', 'A monkey', 'A cat', 'A mouse'),
      Q('What does NASA stand for?', 'National Aeronautics and Space Administration', 'North American Space Agency', 'National Air and Space Association', 'National Astronautic Science Agency'),
      Q('President Kennedy\'s 1961 goal was to land a man where before 1970?', 'On the Moon', 'On Mars', 'In orbit', 'On a space station'),
      Q('What was the Apollo 11 lunar module called?', 'Eagle', 'Columbia', 'Falcon', 'Intrepid'),
      Q('Armstrong\'s first words on the surface began "That\'s one small step for..."', 'Man', 'Mankind', 'America', 'Humanity'),
      Q('How many Apollo missions landed astronauts on the Moon?', '6', '5', '7', '9'),
      Q('Which mission was the last to put people on the Moon, in 1972?', 'Apollo 17', 'Apollo 18', 'Apollo 15', 'Apollo 16'),
      Q('Who was the Soviet space programme\'s legendary chief designer?', 'Sergei Korolev', 'Andrei Tupolev', 'Igor Sikorsky', 'Mikhail Kalashnikov'),
      Q('Who made the first spacewalk, in 1965?', 'Alexei Leonov', 'Ed White', 'Yuri Gagarin', 'Gherman Titov'),
      Q('Which rocket launched the Apollo astronauts toward the Moon?', 'The Saturn V', 'The Atlas', 'The Titan II', 'The Falcon 9'),
      Q('In 1975, Apollo and which Soviet craft docked together in orbit?', 'Soyuz', 'Vostok', 'Voskhod', 'Salyut')
    ]
  });

  makeQuiz({
    id: 'quiz-famous-buildings', title: 'Famous Buildings Quiz', emo: '🗼',
    tagline: 'Twelve landmarks, three lives',
    desc: 'Architecture\'s greatest hits: the 1889 fair that raised the Eiffel Tower, the bell ' +
      'actually named Big Ben, Gaudí\'s Sagrada Família, the sail-roofed Sydney Opera House and ' +
      'rock-carved Petra. Place each landmark — or its architect — before time runs out.',
    colors: ['#0d9488', '#f59e0b'],
    tags: ['trivia', 'quiz', 'buildings', 'landmarks', 'architecture'],
    bank: [
      Q('The Eiffel Tower was built as the entrance to what?', 'The 1889 World\'s Fair', 'The 1900 Olympics', 'A royal palace', 'A radio station'),
      Q('The Eiffel Tower is made mainly of what?', 'Wrought iron', 'Steel', 'Aluminium', 'Bronze'),
      Q('Big Ben is officially the name of what?', 'The great bell', 'The clock tower', 'The clock faces', 'The parliament building'),
      Q('The Taj Mahal stands in which country?', 'India', 'Pakistan', 'Iran', 'Turkey'),
      Q('The Taj Mahal was built as a what?', 'A tomb for an empress', 'A royal palace', 'A temple', 'A fortress'),
      Q('The Sydney Opera House roof is designed to suggest what?', 'Sails', 'Waves', 'Shells only', 'Mountain peaks'),
      Q('Why does the Tower of Pisa lean?', 'It was built on soft ground', 'An earthquake tilted it', 'It was designed that way', 'Its stones eroded on one side'),
      Q('The Colosseum stands in which city?', 'Rome', 'Athens', 'Naples', 'Istanbul'),
      Q('The Colosseum originally hosted what?', 'Gladiator contests', 'Chariot races only', 'Plays and operas', 'Senate meetings'),
      Q('The Empire State Building rises over which city?', 'New York', 'Chicago', 'Boston', 'Philadelphia'),
      Q('Who designed the glass pyramid at the Louvre?', 'I. M. Pei', 'Frank Gehry', 'Le Corbusier', 'Norman Foster'),
      Q('Antoni Gaudí\'s Sagrada Família rises in which city?', 'Barcelona', 'Madrid', 'Seville', 'Valencia'),
      Q('The White House is in which city?', 'Washington, D.C.', 'New York', 'Philadelphia', 'Boston'),
      Q('The Parthenon crowns the Acropolis of which city?', 'Athens', 'Rome', 'Sparta', 'Alexandria'),
      Q('The Burj Khalifa, the world\'s tallest building, is in which city?', 'Dubai', 'Abu Dhabi', 'Doha', 'Riyadh'),
      Q('St. Basil\'s Cathedral, with its colourful onion domes, is in which city?', 'Moscow', 'St. Petersburg', 'Kyiv', 'Warsaw'),
      Q('The statue of Christ the Redeemer overlooks which city?', 'Rio de Janeiro', 'São Paulo', 'Buenos Aires', 'Lima'),
      Q('The ancient city of Petra, carved into rose-red rock, is in which country?', 'Jordan', 'Egypt', 'Syria', 'Morocco'),
      Q('The vast temple complex of Angkor Wat is in which country?', 'Cambodia', 'Thailand', 'Vietnam', 'Indonesia'),
      Q('What colour is the Golden Gate Bridge painted?', 'Orange-red', 'Gold', 'Silver-grey', 'Yellow')
    ]
  });

  makeQuiz({
    id: 'quiz-classic-films', title: 'Classic Films Quiz', emo: '🎬',
    tagline: 'Ruby slippers and Rosebud',
    desc: 'Golden-age Hollywood and beyond: Dorothy\'s ruby slippers, the Corleone family, HAL ' +
      '9000, the DeLorean time machine and Citizen Kane\'s whispered "Rosebud". Famous lines, ' +
      'famous props and the films they come from — action!',
    colors: ['#eab308', '#18181b'],
    tags: ['trivia', 'quiz', 'films', 'movies', 'cinema'],
    bank: [
      Q('"Frankly, my dear, I don\'t give a damn" is from which film?', 'Gone with the Wind', 'Casablanca', 'Citizen Kane', 'Rebecca'),
      Q('What is the name of Dorothy\'s dog in The Wizard of Oz?', 'Toto', 'Rex', 'Buddy', 'Lassie'),
      Q('What colour are Dorothy\'s magic slippers in the film?', 'Ruby red', 'Silver', 'Emerald green', 'Gold'),
      Q('"May the Force be with you" comes from which saga?', 'Star Wars', 'Star Trek', 'Dune', 'Flash Gordon'),
      Q('Which Star Wars villain turns out to be Luke\'s father?', 'Darth Vader', 'The Emperor', 'Boba Fett', 'Grand Moff Tarkin'),
      Q('The film Casablanca is set in which country?', 'Morocco', 'Egypt', 'Algeria', 'Tunisia'),
      Q('Which Hitchcock film has the infamous shower scene?', 'Psycho', 'The Birds', 'Vertigo', 'Rear Window'),
      Q('What was Charlie Chaplin\'s most famous screen character?', 'The Tramp', 'The Kid', 'The Baron', 'The Clerk'),
      Q('Who sang and danced the title number in Singin\' in the Rain?', 'Gene Kelly', 'Fred Astaire', 'Donald O\'Connor', 'Bing Crosby'),
      Q('In the 1933 classic, King Kong climbs which building?', 'The Empire State Building', 'The Chrysler Building', 'The Eiffel Tower', 'The Brooklyn Bridge'),
      Q('Steven Spielberg\'s Jaws is about a what?', 'A great white shark', 'A giant octopus', 'A killer whale', 'A sea serpent'),
      Q('In the 1982 film, E.T. keeps trying to do what?', 'Phone home', 'Find gold', 'Learn to fly', 'Build a ship'),
      Q('What is the family name at the heart of The Godfather?', 'Corleone', 'Soprano', 'Barzini', 'Tattaglia'),
      Q('The Sound of Music tells the story of which family?', 'The von Trapps', 'The Habsburgs', 'The Bennets', 'The Darlings'),
      Q('Alfred Hitchcock was known by which nickname?', 'The Master of Suspense', 'The King of Comedy', 'The Silent Genius', 'The Maestro of Terror'),
      Q('"I\'ll be back" was made famous by which film?', 'The Terminator', 'RoboCop', 'Predator', 'Die Hard'),
      Q('What is Indiana Jones\'s day job?', 'Archaeology professor', 'Museum guard', 'Army officer', 'Journalist'),
      Q('Which car becomes a time machine in Back to the Future?', 'A DeLorean', 'A Mustang', 'A Corvette', 'A Beetle'),
      Q('In 2001: A Space Odyssey, what is the ship\'s computer called?', 'HAL 9000', 'SAL 2000', 'MU-TH-UR', 'Skynet'),
      Q('What was Disney\'s first feature-length animated film?', 'Snow White and the Seven Dwarfs', 'Pinocchio', 'Bambi', 'Fantasia'),
      Q('What is Charles Foster Kane\'s mysterious last word?', 'Rosebud', 'Xanadu', 'Mother', 'Empire')
    ]
  });

  makeQuiz({
    id: 'quiz-math-puzzlers', title: 'Math Puzzlers', emo: '🧮',
    tagline: 'The bat, the ball and the lily pond',
    desc: 'Worded brainteasers with numeric answers: the $1.10 bat and ball, the lily pad that ' +
      'doubles daily, the snail climbing out of a well and Gauss\'s famous 1-to-100 sum. Slow ' +
      'down just enough to think — the obvious answer is usually one of the wrong options.',
    colors: ['#7c3aed', '#22d3ee'],
    tags: ['trivia', 'quiz', 'math', 'puzzle', 'brainteaser'],
    bank: [
      Q('A bat and ball cost $1.10; the bat costs $1 more than the ball. What does the ball cost?', '5 cents', '10 cents', '15 cents', '1 cent'),
      Q('5 machines make 5 widgets in 5 minutes. How long do 100 machines need for 100 widgets?', '5 minutes', '100 minutes', '20 minutes', '1 minute'),
      Q('A lily patch doubles daily and covers the lake on day 48. When was it half covered?', 'Day 47', 'Day 24', 'Day 46', 'Day 36'),
      Q('What is the sum of all whole numbers from 1 to 100?', '5,050', '5,000', '4,950', '10,100'),
      Q('10 people each shake hands once with every other. How many handshakes?', '45', '90', '100', '55'),
      Q('A brick weighs 1 kg plus half a brick. How heavy is the brick?', '2 kg', '1.5 kg', '3 kg', '1 kg'),
      Q('Three consecutive whole numbers add to 36. What is the largest?', '13', '12', '14', '15'),
      Q('A snail climbs 3 m by day and slips back 2 m by night. When does it top a 10 m well?', 'Day 8', 'Day 10', 'Day 7', 'Day 9'),
      Q('How many squares of every size fit on a 3-by-3 grid of cells?', '14', '9', '13', '10'),
      Q('Two trains 120 km apart head toward each other at 40 and 20 km/h. When do they meet?', 'After 2 hours', 'After 3 hours', 'After 1.5 hours', 'After 4 hours'),
      Q('A penny doubles in value every day. What is it worth on day 10?', '$5.12', '$10.24', '$2.56', '$1.00'),
      Q('A clock takes 5 seconds to strike 6 o\'clock. How long to strike 12?', '11 seconds', '10 seconds', '12 seconds', '9 seconds'),
      Q('What angle do the clock hands make at exactly 3:00?', '90 degrees', '60 degrees', '120 degrees', '45 degrees'),
      Q('A shirt costs $25 after a 50% discount. What was the original price?', '$50', '$37.50', '$45', '$75'),
      Q('What is 15% of 200?', '30', '15', '20', '35'),
      Q('How many items are in a gross — a dozen dozens?', '144', '120', '112', '124'),
      Q('What is the product of the first four prime numbers, 2 × 3 × 5 × 7?', '210', '105', '70', '420'),
      Q('A farmer keeps 10 chickens and 5 cows. How many legs is that?', '40', '30', '35', '50'),
      Q('What is half of a quarter of 80?', '10', '20', '5', '40'),
      Q('A father is 40 and his son is 10. In how many years is he exactly twice as old?', '20 years', '10 years', '15 years', '30 years'),
      Q('Counting from 1 to 100, how many times do you write the digit 9?', '20', '10', '11', '19'),
      Q('3 cats catch 3 mice in 3 minutes. How many cats catch 100 mice in 100 minutes?', '3', '100', '33', '9')
    ]
  });

  makeQuiz({
    id: 'quiz-logic-riddles', title: 'Logic Riddles', emo: '🧩',
    tagline: 'What has keys but opens no locks?',
    desc: 'Classic riddles, four possible answers each: the thing with keys that opens no locks, ' +
      'what gets wetter as it dries, the coat best put on wet and what travels the world from a ' +
      'corner. The wording is the puzzle — read twice, then trust the click.',
    colors: ['#10b981', '#8b5cf6'],
    tags: ['trivia', 'quiz', 'riddles', 'logic', 'brainteaser'],
    bank: [
      Q('What has keys but can\'t open a single lock?', 'A piano', 'A map', 'A clock', 'A book'),
      Q('What gets wetter the more it dries?', 'A towel', 'A sponge', 'An umbrella', 'A mop bucket'),
      Q('What has a neck but no head?', 'A bottle', 'A shirt', 'A guitar', 'A river'),
      Q('What has an eye but cannot see?', 'A needle', 'A potato', 'A storm', 'A camera'),
      Q('What always goes up but never comes down?', 'Your age', 'A balloon', 'Smoke', 'The tide'),
      Q('The more you take, the more you leave behind. What are they?', 'Footsteps', 'Memories', 'Photographs', 'Breaths'),
      Q('What has teeth but never bites?', 'A comb', 'A shark statue', 'A zipper pull', 'A ruler'),
      Q('What runs all around a garden without ever moving?', 'A fence', 'A path', 'A hose', 'A shadow'),
      Q('What can travel around the world while staying in a corner?', 'A stamp', 'A compass', 'A coin', 'A spider'),
      Q('What has one head, one foot and four legs?', 'A bed', 'A table', 'A chair', 'A horse rider'),
      Q('What is full of holes but still holds water?', 'A sponge', 'A net', 'A colander', 'A whistle'),
      Q('What belongs to you but is used far more by other people?', 'Your name', 'Your shadow', 'Your phone', 'Your chair'),
      Q('What has a face and two hands but no arms or legs?', 'A clock', 'A doll', 'A coin', 'A mirror'),
      Q('The one who makes it sells it; the one who buys it never uses it. What is it?', 'A coffin', 'A gift', 'A lock', 'A ticket'),
      Q('What breaks the moment you say its name?', 'Silence', 'A promise', 'Glass', 'A secret'),
      Q('I speak without a mouth and hear without ears. What am I?', 'An echo', 'A telephone', 'A thought', 'The wind'),
      Q('What has a bed but never sleeps and a mouth but never eats?', 'A river', 'A hotel', 'A volcano', 'A garden'),
      Q('What kind of coat is best put on wet?', 'A coat of paint', 'A raincoat', 'A fur coat', 'A winter coat'),
      Q('What has a spine but no bones?', 'A book', 'A jellyfish', 'A ladder', 'A cactus'),
      Q('What flies all day without wings?', 'Time', 'A flag', 'A cloud', 'A kite'),
      Q('What has cities but no houses, and rivers but no water?', 'A map', 'A dream', 'A desert', 'A story'),
      Q('What can you catch but never throw?', 'A cold', 'A ball', 'A fish', 'A wave')
    ]
  });

  makeQuiz({
    id: 'quiz-probability', title: 'Probability Quiz', emo: '🎯',
    tagline: 'Fair coins, loaded questions',
    desc: 'Chance, counted properly: the 1-in-6 die roll, why seven is the likeliest total with ' +
      'two dice, the 52-card deck\'s aces and hearts, and the birthday paradox\'s surprising 23 ' +
      'people. If you can count outcomes, the streak bonus is basically guaranteed.',
    colors: ['#f43f5e', '#38bdf8'],
    tags: ['trivia', 'quiz', 'probability', 'math', 'numbers'],
    bank: [
      Q('What is the probability of heads on one fair coin flip?', '1/2', '1/3', '1/4', '2/3'),
      Q('What is the probability of rolling a six on one fair die?', '1/6', '1/5', '1/12', '1/3'),
      Q('How many spots are on a standard die in total?', '21', '18', '24', '15'),
      Q('What is the chance two coin flips both land heads?', '1/4', '1/2', '1/3', '1/8'),
      Q('How many cards are in a standard deck, jokers aside?', '52', '54', '48', '50'),
      Q('How many aces does a standard deck hold?', '4', '2', '8', '13'),
      Q('What is the probability of drawing a heart from a full deck?', '1/4', '1/13', '1/2', '1/12'),
      Q('What is the probability of drawing an ace from a full deck?', '1/13', '1/4', '1/52', '1/26'),
      Q('Which total is most likely when rolling two dice?', '7', '6', '8', '12'),
      Q('How many different ways can two dice land?', '36', '12', '24', '42'),
      Q('What is the chance of rolling doubles with two dice?', '1/6', '1/12', '1/36', '1/3'),
      Q('An event certain to happen has what probability?', '1', '0', '1/2', '100/1'),
      Q('An impossible event has what probability?', '0', '1', '-1', '1/100'),
      Q('What is the chance of guessing a 4-option question correctly?', '25%', '20%', '50%', '10%'),
      Q('What is the chance three coin flips all land heads?', '1/8', '1/6', '1/4', '1/3'),
      Q('With 23 people in a room, the chance two share a birthday is about what?', '50%', '6%', '23%', '95%'),
      Q('What is the probability of drawing a red card from a full deck?', '1/2', '1/4', '1/3', '1/13'),
      Q('How many face cards — jacks, queens, kings — are in a deck?', '12', '9', '16', '8'),
      Q('On average, how many heads do you expect from 100 fair flips?', '50', '25', '75', '100'),
      Q('How many numbered pockets does a European roulette wheel have?', '37', '36', '38', '40'),
      Q('What is the probability of NOT rolling a six on one die?', '5/6', '1/6', '2/3', '4/5'),
      Q('What is the chance of "snake eyes" — double ones — with two dice?', '1/36', '1/12', '1/6', '2/36')
    ]
  });

  makeQuiz({
    id: 'quiz-measurements', title: 'Measurements Quiz', emo: '📏',
    tagline: 'Knots, carats and bakers\' dozens',
    desc: 'How the world gets measured: centimetres to the metre, ounces to the pound, the 13 rolls ' +
      'in a baker\'s dozen, and which scales handle earthquakes, sound and gemstones. Metric or ' +
      'imperial, the 15-second bar drains at exactly the same rate.',
    colors: ['#64748b', '#4ade80'],
    tags: ['trivia', 'quiz', 'measurements', 'units', 'numbers'],
    bank: [
      Q('How many centimetres are in a metre?', '100', '10', '1,000', '60'),
      Q('How many grams are in a kilogram?', '1,000', '100', '500', '10,000'),
      Q('How many millimetres are in a centimetre?', '10', '100', '5', '25'),
      Q('How many inches are in a foot?', '12', '10', '14', '16'),
      Q('How many feet are in a yard?', '3', '2', '4', '6'),
      Q('How many yards are in a mile?', '1,760', '1,000', '1,500', '2,000'),
      Q('How many pounds are in a stone?', '14', '12', '16', '10'),
      Q('How many ounces are in a pound?', '16', '12', '14', '20'),
      Q('How many items are in a baker\'s dozen?', '13', '12', '14', '11'),
      Q('How many degrees are in a full circle?', '360', '180', '365', '400'),
      Q('How many degrees are in a right angle?', '90', '45', '60', '180'),
      Q('At sea level, water boils at how many degrees Fahrenheit?', '212', '100', '180', '220'),
      Q('Water freezes at how many degrees Fahrenheit?', '32', '0', '20', '40'),
      Q('How many seconds are in an hour?', '3,600', '360', '6,000', '1,440'),
      Q('How many days are in a fortnight?', '14', '7', '10', '28'),
      Q('A hectare is how many square metres?', '10,000', '1,000', '100', '100,000'),
      Q('A speed of one nautical mile per hour is called a what?', 'Knot', 'League', 'Fathom', 'Furlong'),
      Q('A light-year measures what?', 'Distance', 'Time', 'Brightness', 'Speed'),
      Q('A carat measures the weight of what?', 'Gemstones', 'Gold bars only', 'Pearls only', 'Coins'),
      Q('The Richter scale measures the strength of what?', 'Earthquakes', 'Hurricanes', 'Tornadoes', 'Floods'),
      Q('Decibels measure what?', 'Sound intensity', 'Light', 'Pressure', 'Radiation'),
      Q('Hertz is a unit of what?', 'Frequency', 'Force', 'Energy', 'Voltage'),
      Q('A ream of paper is how many sheets?', '500', '100', '250', '1,000'),
      Q('How many pints are in a US gallon?', '8', '4', '6', '10')
    ]
  });

})();
