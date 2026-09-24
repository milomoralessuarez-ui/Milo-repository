/* Boxing — three rounds, a stamina bar that punishes flailing, tells you can learn. */
(function () {
  'use strict';

  var W = 800, H = 520;
  var ROUNDS = 3, ROUND_TIME = 45;
  var PX = 250, AX = 550, FLOOR = 400;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    var PUNCH = {
      jab: { wind: .16, recover: .26, dmg: 5, cost: 12 },
      hook: { wind: .34, recover: .50, dmg: 15, cost: 26 }
    };

    function boxer(hp) {
      return {
        hp: hp, sta: 100, state: 'idle', t: 0, kind: null,
        block: false, dodge: 0, counter: 0, hurt: 0, lean: 0
      };
    }

    function reset(g) {
      var d = g.data;
      d.you = boxer(140);
      d.cpu = boxer(140);
      d.round = 1;
      d.clock = ROUND_TIME;
      d.dealt = 0; d.taken = 0;
      d.rdDealt = 0; d.rdTaken = 0;
      d.cards = [];
      d.phase = 'fight';
      d.phaseT = 0;
      d.aiNext = 1.2;
      d.msg = '';
      d.msgT = 0;
      d.parts = [];
      d.flash = 0;
      d.tap = false; d.hookTap = false;
      d.shake = 0;
      g.set('Round', '1/' + ROUNDS);
      g.set('You', 140);
      g.set('Opp', 140);
    }

    function say(d, txt, time) { d.msg = txt; d.msgT = time || .9; }

    function spark(d, x, y, n, col) {
      for (var i = 0; i < n; i++) {
        d.parts.push({
          x: x, y: y, vx: U.rand(-160, 160), vy: U.rand(-190, 40),
          t: U.rand(.25, .55), col: col
        });
      }
    }

    /* ------------------------------------------------------------ actions */

    function canAct(f) {
      return f.state === 'idle' && !f.block;
    }

    function startPunch(g, f, kind, isPlayer) {
      var p = PUNCH[kind];
      if (!canAct(f)) return;
      var weak = f.sta < p.cost;
      f.state = 'wind';
      f.kind = kind;
      f.weak = weak;
      f.t = p.wind * (weak ? 1.5 : 1);
      f.windMax = f.t;
      f.sta = Math.max(0, f.sta - p.cost * (weak ? .5 : 1));
      if (isPlayer) {
        Milo.sound.tone({
          f: kind === 'jab' ? 300 : 210, f2: 150, d: .07,
          v: weak ? .04 : .08, type: 'triangle'
        });
      }
    }

    // The punch has arrived: work out what the other man did about it.
    function land(g, att, def, attIsPlayer) {
      var d = g.data;
      var p = PUNCH[att.kind];
      var dmg = p.dmg * (att.weak ? .45 : 1) * (.4 + .6 * att.sta / 100);
      var x = attIsPlayer ? AX - 40 : PX + 40;
      var y = FLOOR - 92;

      if (def.dodge > 0) {
        def.counter = .75;
        say(d, attIsPlayer ? 'Slipped!' : 'You slip it — counter now!', .8);
        Milo.sound.tone({ f: 720, f2: 1080, d: .1, v: .07, type: 'sine' });
        spark(d, x, y, 5, '#a5b4fc');
        return;
      }
      var countered = att.counter > 0;
      var blocked = !countered && (def.block ||
        (attIsPlayer && def.state === 'idle' && Math.random() < d.aiGuard));
      if (blocked) {
        dmg *= .18;
        def.sta = Math.max(0, def.sta - (att.kind === 'hook' ? 9 : 4));
        Milo.sound.tone({ f: 130, f2: 90, d: .12, v: .1, type: 'square' });
        spark(d, x, y, 4, '#94a3b8');
      } else {
        if (countered) { dmg *= 1.7; att.counter = 0; }
        if (def.state === 'wind') dmg *= 1.35;       // caught him coming in
        Milo.sound.hit();
        spark(d, x, y, 10, attIsPlayer ? '#fbbf24' : '#fb7185');
        d.shake = att.kind === 'hook' ? 9 : 4;
        def.hurt = .35;
      }
      def.hp = Math.max(0, def.hp - dmg);
      if (attIsPlayer) { d.dealt += dmg; d.rdDealt += dmg; g.set('Opp', Math.round(def.hp)); }
      else { d.taken += dmg; d.rdTaken += dmg; g.set('You', Math.round(def.hp)); }
      g.score = Math.round(d.dealt * 6);
    }

    /* ------------------------------------------------------------ rounds */

    function endRound(g) {
      var d = g.data;
      var win = d.rdDealt > d.rdTaken ? 'you' : d.rdDealt < d.rdTaken ? 'cpu' : 'even';
      d.cards.push(win);
      d.phase = 'break';
      d.phaseT = 2.6;
      say(d, 'Round ' + d.round + ' to ' + (win === 'you' ? 'you' : win === 'cpu' ? 'them' : 'nobody'), 2.4);
      Milo.sound.tone({ f: 880, d: .5, v: .1, type: 'sine' });
    }

    function decision(g) {
      var d = g.data;
      var y = 0, c = 0;
      for (var i = 0; i < d.cards.length; i++) {
        if (d.cards[i] === 'you') y++; else if (d.cards[i] === 'cpu') c++;
      }
      var sc = Math.round(d.dealt * 6 + y * 260 + (y > c ? 500 : 0));
      g.score = sc;
      var card = y + '–' + c + ' on rounds';
      if (y > c) g.win({ emo: '🥊', title: 'Decision — you win', text: card + '. ' + Math.round(d.dealt) + ' damage dealt.', score: sc });
      else if (y === c) g.gameOver({ emo: '🥊', title: 'A draw', text: card + '. Nothing in it.', score: sc });
      else g.gameOver({ emo: '🥊', title: 'Decision against you', text: card + '.', score: sc });
    }

    function knockout(g, playerWon) {
      var d = g.data;
      var sc = Math.round(d.dealt * 6 + (playerWon ? 1000 : 0));
      g.score = sc;
      Milo.sound.explode();
      if (playerWon) g.win({ emo: '🥊', title: 'KNOCKOUT — round ' + d.round, text: 'You stopped them with ' + Math.round(d.dealt) + ' damage.', score: sc });
      else g.gameOver({ emo: '🥊', title: 'You are counted out', text: 'Stopped in round ' + d.round + '.', score: sc });
    }

    /* ---------------------------------------------------------------- AI */

    function aiThink(g, dt) {
      var d = g.data, a = d.cpu;
      d.aiNext -= dt;
      if (a.state !== 'idle' || d.aiNext > 0) return;
      // Rounds 2 and 3: quicker hands, tighter tells, better guard.
      var aggr = .5 + d.round * .16;
      if (a.sta < 28) { d.aiNext = U.rand(.7, 1.2); a.block = true; return; }
      a.block = false;
      if (Math.random() < aggr) {
        var kind = Math.random() < (.34 + d.round * .07) ? 'hook' : 'jab';
        startPunch(g, a, kind, false);
        // The opponent winds up visibly — that window is your read, and it
        // shrinks every round.
        a.t = (kind === 'hook' ? .62 : .44) * d.tellScale;
        a.windMax = a.t;
        a.tell = kind;
        Milo.sound.tone({ f: kind === 'hook' ? 180 : 420, d: .05, v: .05, type: 'triangle' });
      } else {
        a.block = Math.random() < .4;
      }
      d.aiNext = U.rand(1.05, 2.15) / (.8 + d.round * .14);
    }

    /* --------------------------------------------------------------- draw */

    function drawBoxer(c, f, x, dir, col, skin, punching) {
      var lean = f.hurt > 0 ? -dir * 8 * f.hurt : 0;
      var ext = 0;
      if (f.state === 'wind') ext = -14 * U.clamp(1 - f.t / (f.windMax || .2), 0, 1);
      if (f.state === 'recover') ext = 54 * U.clamp(f.t / PUNCH[f.kind].recover, 0, 1);
      if (f.state === 'hit') ext = 60;
      var dodgeOff = f.dodge > 0 ? -dir * 22 : 0;
      var bx = x + lean + dodgeOff;

      c.save();
      c.fillStyle = 'rgba(0,0,0,.28)';
      c.beginPath(); c.ellipse(x, FLOOR + 6, 38, 9, 0, 0, 7); c.fill();
      // legs
      c.strokeStyle = col; c.lineWidth = 12; c.lineCap = 'round';
      c.beginPath();
      c.moveTo(bx - 6, FLOOR - 62); c.lineTo(x - 16, FLOOR);
      c.moveTo(bx + 6, FLOOR - 62); c.lineTo(x + 18, FLOOR);
      c.stroke();
      // torso
      c.fillStyle = col;
      U.roundRect(c, bx - 20, FLOOR - 122, 40, 64, 14); c.fill();
      // head
      c.fillStyle = skin;
      c.beginPath(); c.arc(bx + dir * 4, FLOOR - 140, 17, 0, 7); c.fill();
      if (f.hurt > 0) {
        c.fillStyle = 'rgba(248,113,113,' + f.hurt + ')';
        c.beginPath(); c.arc(bx + dir * 4, FLOOR - 140, 18, 0, 7); c.fill();
      }
      // guard / gloves
      var gy = f.block ? FLOOR - 146 : FLOOR - 104;
      var g1x = bx + dir * (f.block ? 12 : 26 + ext);
      var g2x = bx + dir * (f.block ? -2 : 16);
      c.strokeStyle = col; c.lineWidth = 9;
      c.beginPath(); c.moveTo(bx, FLOOR - 108); c.lineTo(g1x, gy); c.stroke();
      c.beginPath(); c.moveTo(bx, FLOOR - 104); c.lineTo(g2x, FLOOR - 112); c.stroke();
      c.fillStyle = punching ? '#fde047' : '#ef4444';
      c.beginPath(); c.arc(g1x, gy, 12, 0, 7); c.fill();
      c.fillStyle = '#ef4444';
      c.beginPath(); c.arc(g2x, FLOOR - 112, 12, 0, 7); c.fill();
      if (f.dodge > 0) {
        c.strokeStyle = 'rgba(165,180,252,.8)'; c.lineWidth = 3;
        c.beginPath(); c.arc(bx, FLOOR - 110, 46, 0, 7); c.stroke();
      }
      if (f.counter > 0) {
        c.fillStyle = '#fde047';
        c.font = '900 13px Outfit, sans-serif'; c.textAlign = 'center';
        c.fillText('COUNTER', bx, FLOOR - 176);
      }
      c.restore();
    }

    function bar(c, x, y, w, h, v, col, bg) {
      c.fillStyle = bg || 'rgba(0,0,0,.45)';
      U.roundRect(c, x, y, w, h, h / 2); c.fill();
      c.fillStyle = col;
      U.roundRect(c, x + 2, y + 2, Math.max(0, (w - 4) * v), h - 4, (h - 4) / 2); c.fill();
    }

    return Milo.arcade(host, {
      id: 'boxing-ring',
      w: W, h: H, bg: '#140d1c',
      stats: ['Round', 'You', 'Opp'],
      emo: '🥊',
      touchButtons: [
        { key: 'action', label: 'JAB' }, { key: 'a', label: 'HOOK' },
        { key: 'down', label: 'BLOCK' }, { key: 'left', label: 'DODGE' }
      ],
      start: {
        title: 'Boxing',
        text: 'Space jabs, X hooks, hold ↓ to block, tap ← or → to slip. Every punch ' +
          'spends stamina and a tired punch barely dents anyone, so throwing everything ' +
          'you have is how you lose. Watch the shoulder: the opponent shows the punch ' +
          'before it comes, and slipping it opens a counter window worth double. Three ' +
          'rounds, then the judges — or a knockout.',
        keys: ['Space jab', 'X hook', '↓ block', '← → slip']
      },
      init: reset,

      onPointer: function (g, type) { if (type === 'down') g.data.tap = true; },
      onKey: function (g, e) {
        if (e.code === 'KeyX' || e.code === 'KeyK') g.data.hookTap = true;
      },

      update: function (g, dt) {
        var d = g.data, k = g.input, i;
        var you = d.you, cpu = d.cpu;
        var jabTap = k.pressed('action') || d.tap;
        var hookTap = k.pressed('a') || d.hookTap;
        d.tap = false; d.hookTap = false;
        if (d.shake > 0) d.shake = Math.max(0, d.shake - dt * 40);
        if (d.msgT > 0) d.msgT -= dt;
        if (d.flash > 0) d.flash -= dt;
        d.tellScale = Math.max(.55, 1.15 - d.round * .2);
        d.aiGuard = .16 + d.round * .1;

        for (i = d.parts.length - 1; i >= 0; i--) {
          var p = d.parts[i];
          p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 520 * dt;
          if (p.t <= 0) d.parts.splice(i, 1);
        }

        if (d.phase === 'break') {
          d.phaseT -= dt;
          you.sta = Math.min(100, you.sta + 26 * dt);
          cpu.sta = Math.min(100, cpu.sta + 26 * dt);
          you.hurt = cpu.hurt = 0;
          if (d.phaseT <= 0) {
            if (d.round >= ROUNDS) { decision(g); return; }
            d.round++;
            g.set('Round', d.round + '/' + ROUNDS);
            d.clock = ROUND_TIME;
            d.rdDealt = 0; d.rdTaken = 0;
            d.phase = 'fight';
            say(d, 'Round ' + d.round + ' — they are faster now', 1.4);
          }
          return;
        }
        if (d.phase !== 'fight') return;

        d.clock -= dt;
        if (d.clock <= 0) { d.clock = 0; endRound(g); return; }

        /* --- player input --- */
        you.block = k.down('down') && you.state === 'idle';
        if ((k.pressed('left') || k.pressed('right')) && you.state === 'idle' && you.dodge <= 0 && you.sta >= 8) {
          you.dodge = .34;
          you.sta -= 8;
          Milo.sound.tone({ f: 600, f2: 900, d: .06, v: .05, type: 'sine' });
        }
        if (jabTap) startPunch(g, you, 'jab', true);
        else if (hookTap) startPunch(g, you, 'hook', true);

        /* --- timers --- */
        [you, cpu].forEach(function (f) {
          if (f.dodge > 0) f.dodge -= dt;
          if (f.counter > 0) f.counter -= dt;
          if (f.hurt > 0) f.hurt -= dt * 2.6;
          var idle = f.state === 'idle' && !f.block;
          f.sta = Math.min(100, f.sta + (idle ? 13 : f.block ? 5 : 0) * dt);
        });

        /* --- punch state machines --- */
        [[you, cpu, true], [cpu, you, false]].forEach(function (pair) {
          var f = pair[0], o = pair[1], isP = pair[2];
          if (f.state === 'wind') {
            f.t -= dt;
            if (f.t <= 0) { land(g, f, o, isP); f.state = 'recover'; f.t = PUNCH[f.kind].recover; f.tell = null; }
          } else if (f.state === 'recover') {
            f.t -= dt;
            if (f.t <= 0) { f.state = 'idle'; f.kind = null; }
          }
        });

        aiThink(g, dt);

        if (cpu.hp <= 0) { knockout(g, true); return; }
        if (you.hp <= 0) { knockout(g, false); return; }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, i;
        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        // crowd + ring
        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#231331'); sky.addColorStop(1, '#0d0714');
        c.fillStyle = sky; c.fillRect(-20, -20, W + 40, H + 40);
        for (i = 0; i < 70; i++) {
          var cxp = (i * 97) % W, cyp = 120 + ((i * 53) % 90);
          c.fillStyle = 'rgba(255,255,255,' + (.02 + (i % 5) * .012) + ')';
          c.beginPath(); c.arc(cxp, cyp, 9, 0, 7); c.fill();
        }
        // canvas floor
        c.fillStyle = '#2a3a63';
        c.beginPath();
        c.moveTo(40, FLOOR + 4); c.lineTo(W - 40, FLOOR + 4);
        c.lineTo(W - 4, H); c.lineTo(4, H); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 2;
        c.stroke();
        // ropes
        for (i = 0; i < 3; i++) {
          c.strokeStyle = ['#ef4444', '#f8fafc', '#38bdf8'][i];
          c.globalAlpha = .55; c.lineWidth = 4;
          c.beginPath();
          c.moveTo(20, 250 + i * 46); c.lineTo(W - 20, 250 + i * 46); c.stroke();
          c.globalAlpha = 1;
        }

        for (i = 0; i < d.parts.length; i++) {
          var p = d.parts[i];
          c.fillStyle = p.col;
          c.globalAlpha = U.clamp(p.t * 3, 0, 1);
          c.fillRect(p.x - 2, p.y - 2, 5, 5);
          c.globalAlpha = 1;
        }

        drawBoxer(c, d.you, PX, 1, '#2563eb', '#f1c7a1', d.you.state === 'wind' || d.you.state === 'recover');
        drawBoxer(c, d.cpu, AX, -1, '#b91c1c', '#e8b98f', d.cpu.state === 'wind' || d.cpu.state === 'recover');

        // the tell
        if (d.cpu.state === 'wind' && d.cpu.tell) {
          var tc = d.cpu.tell === 'hook' ? '#f97316' : '#fde047';
          c.fillStyle = tc;
          c.font = '900 17px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText(d.cpu.tell.toUpperCase() + '!', AX, FLOOR - 190);
          c.beginPath();
          c.arc(AX - (d.cpu.tell === 'hook' ? 26 : 14), FLOOR - 118, d.cpu.tell === 'hook' ? 13 : 8, 0, 7);
          c.fill();
        }

        c.restore();

        /* HUD */
        c.font = '700 12px Outfit, sans-serif'; c.textAlign = 'left';
        c.fillStyle = '#93c5fd'; c.fillText('YOU', 26, 74);
        bar(c, 26, 80, 260, 16, d.you.hp / 140, '#38bdf8');
        c.fillStyle = 'rgba(226,232,240,.65)'; c.fillText('STAMINA', 26, 114);
        bar(c, 26, 120, 260, 11, d.you.sta / 100,
          d.you.sta < 25 ? '#ef4444' : d.you.sta < 55 ? '#f59e0b' : '#34d399');

        c.textAlign = 'right';
        c.fillStyle = '#fca5a5'; c.fillText('OPPONENT', W - 26, 74);
        bar(c, W - 286, 80, 260, 16, d.cpu.hp / 140, '#fb7185');
        c.fillStyle = 'rgba(226,232,240,.65)'; c.fillText('STAMINA', W - 26, 114);
        bar(c, W - 286, 120, 260, 11, d.cpu.sta / 100, 'rgba(255,255,255,.45)');

        // clock + cards
        c.textAlign = 'center';
        c.fillStyle = 'rgba(8,8,16,.75)';
        U.roundRect(c, W / 2 - 58, 62, 116, 54, 10); c.fill();
        c.fillStyle = '#fef08a';
        c.font = '900 26px Outfit, sans-serif';
        c.fillText(Math.ceil(d.clock) + 's', W / 2, 92);
        c.font = '700 11px Outfit, sans-serif';
        c.fillStyle = 'rgba(226,232,240,.7)';
        c.fillText('ROUND ' + d.round + ' / ' + ROUNDS, W / 2, 108);
        for (i = 0; i < ROUNDS; i++) {
          var v = d.cards[i];
          c.fillStyle = v === 'you' ? '#38bdf8' : v === 'cpu' ? '#fb7185' : v ? '#94a3b8' : 'rgba(255,255,255,.16)';
          c.beginPath(); c.arc(W / 2 - 22 + i * 22, 128, 6, 0, 7); c.fill();
        }

        if (d.msgT > 0) {
          c.globalAlpha = U.clamp(d.msgT * 2, 0, 1);
          c.fillStyle = '#fef3c7';
          c.font = '900 24px Outfit, sans-serif';
          c.fillText(d.msg, W / 2, 200);
          c.globalAlpha = 1;
        }

        c.fillStyle = 'rgba(226,232,240,.5)';
        c.font = '600 12px Outfit, sans-serif';
        c.fillText('SPACE jab   ·   X hook   ·   ↓ block   ·   ← → slip', W / 2, H - 14);
      }
    });
  }

  window.Milo.register({
    id: 'boxing-ring',
    title: 'Boxing',
    emo: '🥊',
    category: 'Sports',
    tagline: 'Stamina is the real opponent',
    description: 'Space jabs, X hooks, hold ↓ to block and tap ← or → to slip. Punches ' +
      'cost stamina and land for a fraction of their damage when you are empty, so the ' +
      'fight is really about picking moments rather than mashing. The opponent flashes the ' +
      'punch he is about to throw above his shoulder — slip it and you get a three-quarter ' +
      'second counter window at nearly double damage, block it and he burns stamina on your ' +
      'gloves. Three 45-second rounds scored on damage, with the tells getting shorter and ' +
      'his guard tighter each round; drop him and it is over early.',
    controls: ['Space jab', 'X hook', '↓ block', '← → slip'],
    colors: ['#b91c1c', '#fde047'],
    tags: ['boxing', 'fighting', 'timing', 'stamina', 'vs cpu'],
    mount: mount
  });
})();
