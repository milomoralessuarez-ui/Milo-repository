/* Sumo — read the stance, pick the answer, keep your balance. */
(function () {
  'use strict';

  var W = 800, H = 520;
  var CX = 400, CY = 340, RX = 268, RY = 96;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    var RANKS = [
      { name: 'Maegashira', kg: 128, speed: 1.00, tell: 1.00, watch: .14 },
      { name: 'Komusubi', kg: 142, speed: 1.14, tell: .86, watch: .20 },
      { name: 'Sekiwake', kg: 158, speed: 1.30, tell: .74, watch: .26 },
      { name: 'Ozeki', kg: 172, speed: 1.46, tell: .64, watch: .32 },
      { name: 'Yokozuna', kg: 188, speed: 1.62, tell: .55, watch: .38 }
    ];

    var STANCE = {
      brace: { label: 'PLANTED', col: '#38bdf8', hint: 'pull him over' },
      push: { label: 'PUSHING', col: '#f59e0b', hint: 'out-shove or step aside' },
      charge: { label: 'CHARGING', col: '#ef4444', hint: 'step aside!' },
      watch: { label: 'WATCHING', col: '#a78bfa', hint: 'do not commit' },
      stumble: { label: 'OFF BALANCE', col: '#94a3b8', hint: 'shove him out' }
    };

    function reset(g) {
      var d = g.data;
      d.rank = 0;
      d.wins = 0; d.losses = 0;
      d.bouts = 0;
      d.beaten = 0;
      newBout(g, true);
      g.set('Rank', RANKS[0].name);
      g.set('You', 0);
      g.set('Foe', 0);
    }

    function newBout(g, silent) {
      var d = g.data;
      d.pos = 0;              // -1 you are out, +1 he is out
      d.bal = 0; d.cbal = 0;
      d.stun = 0; d.cstun = 0;
      d.charge = 0; d.charging = false;
      d.cool = 0;
      d.stance = 'brace';
      d.stanceT = 1.4;
      d.chargeT = 0;
      d.phase = 'fight';
      d.phaseT = 0;
      d.msg = silent ? 'Hold Space to charge' : '';
      d.msgT = silent ? 2 : 0;
      d.flash = 0;
      d.shake = 0;
      d.tap = { side: false, pull: false };
    }

    function say(d, t, time) { d.msg = t; d.msgT = time || 1.1; }

    function rank(d) { return RANKS[d.rank]; }
    function mass(d) { return 128 / rank(d).kg; }   // heavier men shift less

    /* ------------------------------------------------------- resolutions */

    function shove(g, power) {
      var d = g.data, m = mass(d), st = d.stance;
      if (st === 'watch' && power > .35) {
        d.bal += .8; d.pos += .12;
        say(d, 'He read it — you lurch past him!', 1.2);
        Milo.sound.tone({ f: 200, f2: 90, d: .25, v: .1, type: 'sawtooth' });
      } else if (st === 'stumble') {
        d.pos += power * .55 * m; d.cbal += .5;
        say(d, 'Straight through him!', .9);
        Milo.sound.coin();
      } else if (st === 'charge') {
        d.pos -= power * .06; d.bal += .35; d.cbal += power * .2;
        say(d, 'You meet his charge head on.', .9);
        Milo.sound.hit();
      } else if (st === 'push') {
        var edge = power - .45;
        d.pos += edge * .5 * m;
        if (edge > 0) { d.cbal += .35; say(d, 'You out-muscle him.', .9); }
        else { d.bal += .3; say(d, 'He holds you off.', .9); }
        Milo.sound.tone({ f: 260, f2: 140, d: .16, v: .09, type: 'square' });
      } else {
        d.pos += power * .2 * m; d.cbal += power * .3; d.bal += power * .18;
        Milo.sound.tone({ f: 300, f2: 170, d: .14, v: .08, type: 'square' });
      }
      d.shake = 4 + power * 6;
      d.cool = .25;
    }

    function sidestep(g) {
      var d = g.data, m = mass(d), st = d.stance;
      if (st === 'charge') {
        d.cbal += 1.25; d.pos += .3 * m;
        say(d, 'He flies past — henka!', 1.2);
        Milo.sound.powerup();
      } else if (st === 'push') {
        d.cbal += .5; d.pos += .13 * m;
        say(d, 'You slide off his push.', .9);
        Milo.sound.blip();
      } else if (st === 'stumble') {
        d.cbal += .25;
        Milo.sound.blip();
      } else {
        d.bal += .3;
        say(d, 'Nothing there to step around.', .8);
        Milo.sound.click();
      }
      d.cool = .45;
    }

    function pull(g) {
      var d = g.data, m = mass(d), st = d.stance;
      if (st === 'brace') {
        d.cbal += .75; d.pos += .22 * m;
        say(d, 'You yank him off his heels!', 1.1);
        Milo.sound.coin();
      } else if (st === 'push') {
        d.cbal += .34; d.pos += .11 * m;
        Milo.sound.blip();
      } else if (st === 'charge') {
        d.bal += .62; d.pos -= .2 / m;
        say(d, 'He crashes right into the space.', 1.1);
        Milo.sound.hit();
      } else {
        d.cbal += .12;
        Milo.sound.click();
      }
      d.bal += .12;
      d.cool = .5;
    }

    /* -------------------------------------------------------------- bout */

    function bumpStance(g) {
      var d = g.data, r = rank(d);
      var roll = Math.random();
      if (d.cstun > 0) return;
      if (roll < r.watch) d.stance = 'watch';
      else if (roll < r.watch + .3) d.stance = 'charge';
      else if (roll < r.watch + .62) d.stance = 'push';
      else d.stance = 'brace';
      d.stanceT = U.rand(1.3, 2.4) / r.speed;
      if (d.stance === 'charge') {
        d.chargeT = 1.25 * r.tell;
        Milo.sound.tone({ f: 150, d: .12, v: .06, type: 'sawtooth' });
      }
    }

    function boutOver(g, youWon) {
      var d = g.data;
      d.phase = 'result';
      d.phaseT = 2;
      if (youWon) { d.wins++; Milo.sound.win(); } else { d.losses++; Milo.sound.lose(); }
      d.bouts++;
      g.set('You', d.wins);
      g.set('Foe', d.losses);
      g.score = d.beaten * 520 + d.wins * 120;
      say(d, youWon ? 'Out of the ring — your bout!' : 'You step outside. His bout.', 1.9);
    }

    function finishMatch(g) {
      var d = g.data;
      if (d.wins >= 3) {
        d.beaten++;
        g.score = d.beaten * 520 + d.wins * 120;
        if (d.rank >= RANKS.length - 1) {
          g.win({
            emo: '🤼', title: 'You beat the Yokozuna',
            text: 'Through all ' + RANKS.length + ' ranks of the ladder.',
            score: d.beaten * 520 + d.wins * 120 + 700
          });
          return;
        }
        d.rank++;
        d.wins = 0; d.losses = 0;
        g.set('Rank', RANKS[d.rank].name);
        g.set('You', 0); g.set('Foe', 0);
        newBout(g);
        say(d, 'Next up: ' + RANKS[d.rank].name + ', ' + RANKS[d.rank].kg + 'kg', 2.2);
        return;
      }
      g.gameOver({
        emo: '🤼', title: 'Beaten by the ' + rank(d).name,
        text: 'You cleared ' + d.beaten + ' opponent' + (d.beaten === 1 ? '' : 's') +
          ' and won ' + (d.beaten * 3 + d.wins) + ' bouts.',
        score: d.beaten * 520 + d.wins * 120
      });
    }

    /* --------------------------------------------------------------- draw */

    function drawWrestler(c, x, dir, col, lean, stun) {
      c.save();
      c.translate(x, CY);
      c.rotate(lean * .16 * dir);
      c.fillStyle = 'rgba(0,0,0,.25)';
      c.beginPath(); c.ellipse(0, 8, 34, 10, 0, 0, 7); c.fill();
      c.fillStyle = col;
      c.beginPath(); c.ellipse(0, -46, 34, 42, 0, 0, 7); c.fill();       // body
      c.fillStyle = '#e2b892';
      c.beginPath(); c.arc(dir * 6, -98, 17, 0, 7); c.fill();            // head
      c.fillStyle = '#2b2b33';
      c.beginPath(); c.arc(dir * 4, -108, 12, Math.PI, 0); c.fill();     // topknot
      c.strokeStyle = col; c.lineWidth = 15; c.lineCap = 'round';
      c.beginPath();
      c.moveTo(0, -56); c.lineTo(dir * 44, -52 - lean * 10); c.stroke(); // arms
      c.beginPath();
      c.moveTo(0, -44); c.lineTo(dir * 40, -26); c.stroke();
      c.fillStyle = '#f8fafc';
      c.fillRect(-30, -22, 60, 12);                                       // mawashi
      c.strokeStyle = col; c.lineWidth = 16;
      c.beginPath();
      c.moveTo(-14, -8); c.lineTo(-20, 8);
      c.moveTo(14, -8); c.lineTo(20, 8);
      c.stroke();
      if (stun > 0) {
        c.fillStyle = '#fde047';
        c.font = '900 16px Outfit, sans-serif'; c.textAlign = 'center';
        c.fillText('✷ ✷ ✷', dir * 4, -124);
      }
      c.restore();
    }

    function meter(c, x, y, w, v, label) {
      c.fillStyle = 'rgba(0,0,0,.45)';
      U.roundRect(c, x, y, w, 14, 7); c.fill();
      var t = U.clamp(Math.abs(v), 0, 1);
      c.fillStyle = t > .8 ? '#ef4444' : t > .5 ? '#f59e0b' : '#34d399';
      U.roundRect(c, x + 2, y + 2, Math.max(2, (w - 4) * t), 10, 5);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,.5)';
      c.fillRect(x + w * .8, y, 2, 14);
      c.fillStyle = 'rgba(226,232,240,.7)';
      c.font = '700 10px Outfit, sans-serif'; c.textAlign = 'left';
      c.fillText(label, x, y - 5);
    }

    return Milo.arcade(host, {
      id: 'sumo-push',
      w: W, h: H, bg: '#1b1410',
      stats: ['Rank', 'You', 'Foe'],
      emo: '🤼',
      touchButtons: [
        { key: 'action', label: 'PUSH' }, { key: 'left', label: 'STEP' },
        { key: 'down', label: 'PULL' }
      ],
      start: {
        title: 'Sumo',
        text: 'Read his stance and answer it. PLANTED — pull him over (↓). PUSHING — ' +
          'out-shove him with a longer charge. CHARGING — step aside (← →) and he goes ' +
          'past you. WATCHING — he is waiting to slip a big shove, so keep it light. Hold ' +
          'Space to build a charge and release to shove. Your balance meter is the real ' +
          'clock: tip it over and he walks you out. First to three bouts, then a heavier man.',
        keys: ['Space  charge / shove', '← →  sidestep', '↓  pull']
      },
      init: reset,

      onPointer: function (g, type) { if (type === 'down') g.data.tap.side = true; },

      update: function (g, dt) {
        var d = g.data, k = g.input, r = rank(d);
        if (d.msgT > 0) d.msgT -= dt;
        if (d.shake > 0) d.shake = Math.max(0, d.shake - dt * 30);
        if (d.cool > 0) d.cool -= dt;

        if (d.phase === 'result') {
          d.phaseT -= dt;
          if (d.phaseT <= 0) {
            if (d.wins >= 3 || d.losses >= 3) finishMatch(g);
            else newBout(g);
          }
          return;
        }

        /* --- player --- */
        var free = d.stun <= 0 && d.cool <= 0;
        if (free) {
          if (k.down('action')) {
            d.charging = true;
            d.charge = Math.min(1, d.charge + dt / 1.05);
          } else if (d.charging) {
            d.charging = false;
            shove(g, Math.max(.16, d.charge));
            d.charge = 0;
          }
          if (!d.charging) {
            if (k.pressed('left') || k.pressed('right') || d.tap.side) sidestep(g);
            else if (k.pressed('down')) pull(g);
          }
        } else {
          d.charging = false; d.charge = 0;
        }
        d.tap.side = false;

        /* --- opponent stance machine --- */
        if (d.cstun > 0) {
          d.cstun -= dt;
          d.stance = 'stumble';
          if (d.cstun <= 0) { d.cbal = .3; bumpStance(g); }
        } else {
          d.stanceT -= dt;
          if (d.stance === 'charge') {
            d.chargeT -= dt;
            if (d.chargeT <= 0) {
              // The charge lands: anyone still standing in front of it goes back.
              d.pos -= .26 / mass(d); d.bal += .72;
              say(d, 'His charge slams in!', 1.1);
              Milo.sound.explode();
              d.shake = 12;
              d.stance = 'push';
              d.stanceT = 1;
            }
          } else if (d.stance === 'push') {
            d.pos -= .085 * dt * r.speed / mass(d);
            d.bal += .2 * dt * r.speed;
          } else if (d.stance === 'brace') {
            d.cbal = Math.max(0, d.cbal - .3 * dt);
          }
          if (d.stanceT <= 0 && d.stance !== 'charge') bumpStance(g);
        }

        /* --- balance --- */
        d.bal = Math.max(0, d.bal - .34 * dt);
        d.cbal = Math.max(0, d.cbal - .3 * dt);
        if (d.stun > 0) {
          d.stun -= dt;
          d.pos -= .25 * dt / mass(d);
          if (d.stun <= 0) d.bal = .25;
        } else if (d.bal >= 1) {
          d.stun = 1.05; d.bal = 1;
          say(d, 'You are off balance!', 1);
          Milo.sound.lose();
        }
        if (d.cstun <= 0 && d.cbal >= 1) {
          d.cstun = 1.15; d.cbal = 1;
          d.stance = 'stumble';
          say(d, 'He is off balance — shove!', 1);
          Milo.sound.powerup();
        }

        d.pos = U.clamp(d.pos, -1.05, 1.05);
        if (d.pos >= 1) boutOver(g, true);
        else if (d.pos <= -1) boutOver(g, false);
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, i;
        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#2a1d16'); bg.addColorStop(1, '#130d09');
        c.fillStyle = bg; c.fillRect(-20, -20, W + 40, H + 40);

        // dohyo
        c.fillStyle = '#c8a06a';
        c.beginPath(); c.ellipse(CX, CY + 30, RX + 40, RY + 24, 0, 0, 7); c.fill();
        c.fillStyle = '#e0bd88';
        c.beginPath(); c.ellipse(CX, CY + 30, RX, RY, 0, 0, 7); c.fill();
        c.strokeStyle = '#f3e3c4'; c.lineWidth = 9;
        c.beginPath(); c.ellipse(CX, CY + 30, RX, RY, 0, 0, 7); c.stroke();
        c.strokeStyle = 'rgba(120,80,40,.35)'; c.lineWidth = 2;
        for (i = -3; i <= 3; i++) {
          c.beginPath();
          c.moveTo(CX + i * 60, CY + 30 - RY + 14);
          c.lineTo(CX + i * 60, CY + 30 + RY - 14);
          c.stroke();
        }
        c.fillStyle = '#f8fafc';
        c.fillRect(CX - 80, CY + 22, 22, 6);
        c.fillRect(CX + 58, CY + 22, 22, 6);

        var px = CX + d.pos * (RX - 40) - 58;
        var ax = CX + d.pos * (RX - 40) + 58;
        drawWrestler(c, px, 1, '#2563eb', d.bal, d.stun);
        drawWrestler(c, ax, -1, '#b91c1c', d.cbal, d.cstun);

        // stance banner over the opponent
        var st = STANCE[d.stance];
        c.textAlign = 'center';
        c.fillStyle = 'rgba(0,0,0,.55)';
        U.roundRect(c, ax - 78, CY - 166, 156, 42, 9); c.fill();
        c.fillStyle = st.col;
        c.font = '900 19px Outfit, sans-serif';
        c.fillText(st.label, ax, CY - 142);
        c.fillStyle = 'rgba(226,232,240,.75)';
        c.font = '600 11px Outfit, sans-serif';
        c.fillText(st.hint, ax, CY - 130);
        if (d.stance === 'charge') {
          var f = 1 - U.clamp(d.chargeT / (1.25 * rank(d).tell), 0, 1);
          c.fillStyle = 'rgba(0,0,0,.5)';
          U.roundRect(c, ax - 60, CY - 120, 120, 9, 4); c.fill();
          c.fillStyle = '#ef4444';
          U.roundRect(c, ax - 58, CY - 118, 116 * f, 5, 3); c.fill();
        }
        c.restore();

        /* HUD */
        c.textAlign = 'left';
        meter(c, 28, 130, 240, d.bal, 'YOUR BALANCE');
        c.textAlign = 'left';
        meter(c, W - 268, 130, 240, d.cbal, 'HIS BALANCE');

        // charge meter
        c.fillStyle = 'rgba(0,0,0,.45)';
        U.roundRect(c, W / 2 - 110, H - 56, 220, 16, 8); c.fill();
        c.fillStyle = d.charge > .8 ? '#fde047' : '#f97316';
        U.roundRect(c, W / 2 - 108, H - 54, 216 * d.charge, 12, 6); c.fill();
        c.fillStyle = 'rgba(226,232,240,.7)';
        c.font = '700 10px Outfit, sans-serif'; c.textAlign = 'center';
        c.fillText('CHARGE  (hold Space)', W / 2, H - 62);

        // ring-out bar
        c.fillStyle = 'rgba(0,0,0,.4)';
        U.roundRect(c, W / 2 - 160, 96, 320, 12, 6); c.fill();
        c.fillStyle = '#fbbf24';
        c.beginPath(); c.arc(W / 2 + d.pos * 156, 102, 8, 0, 7); c.fill();
        c.fillStyle = 'rgba(226,232,240,.6)';
        c.font = '600 10px Outfit, sans-serif';
        c.fillText(rank(d).name + '  ·  ' + rank(d).kg + 'kg  ·  first to 3', W / 2, 86);

        if (d.msgT > 0) {
          c.globalAlpha = U.clamp(d.msgT * 2, 0, 1);
          c.fillStyle = '#fef3c7';
          c.font = '900 22px Outfit, sans-serif';
          c.fillText(d.msg, W / 2, 168);
          c.globalAlpha = 1;
        }

        c.fillStyle = 'rgba(226,232,240,.45)';
        c.font = '600 12px Outfit, sans-serif';
        c.fillText('Space charge/shove   ·   ← → sidestep   ·   ↓ pull', W / 2, H - 14);
      }
    });
  }

  window.Milo.register({
    id: 'sumo-push',
    title: 'Sumo',
    emo: '🤼',
    category: 'Sports',
    tagline: 'Four stances, four answers, one balance meter',
    description: 'A pure reading duel on the dohyo. His stance is written above his head ' +
      'and each one has a right answer: pull a PLANTED man off his heels with ↓, out-shove ' +
      'a PUSHING one by holding Space longer, sidestep a CHARGE with ← or → so he sails ' +
      'past, and keep everything light while he is WATCHING, because a big shove into that ' +
      'is how you end up face down. Balance decays back to centre, so the cost of a wrong ' +
      'answer is time as much as ground. First to three bouts wins the match, then the next ' +
      'man up the ladder is heavier, quicker and hides his charge better.',
    controls: ['Space  charge / shove', '← →  sidestep', '↓  pull'],
    colors: ['#b45309', '#f8fafc'],
    tags: ['sumo', 'timing', 'duel', 'vs cpu', 'balance'],
    mount: mount
  });
})();
