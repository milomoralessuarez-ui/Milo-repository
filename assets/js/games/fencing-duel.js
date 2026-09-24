/* Fencing — right of way, on a piste, against an opponent who really feints. */
(function () {
  'use strict';

  var W = 880, H = 480;
  var PISTE_L = 96, PISTE_R = 784, FLOOR = 350;
  var REACH = 118, LUNGE_REACH = 198;
  var TARGET = 5;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function fencer(x, dir) {
      return {
        x: x, dir: dir, state: 'ready', t: 0, ext: 0, dur: .3,
        moveT: 0, moveDir: 0, moveSpeed: 150, showBlade: 0, feintStage: 0,
        pendingParry: 0, reacted: false,
        reachNow: 0, parry: 0, parryRec: 0, riposte: 0,
        startT: -99, lunge: false, flash: 0
      };
    }

    function reset(g) {
      var d = g.data;
      d.you = fencer(330, 1);
      d.cpu = fencer(556, -1);
      d.sy = 0; d.sc = 0;
      d.lvl = 1;
      d.phase = 'fence';
      d.phaseT = 0;
      d.msg = 'En garde — Space attacks, X parries';
      d.msgT = 2.4;
      d.light = 0;                 // 1 you, -1 them, 0 none
      d.lightT = 0;
      d.priority = 0;
      d.aiNext = .35;
      d.aiPlan = null;
      d.tap = { atk: false, parry: false };
      d.sparks = [];
      d.hist = [];
      g.set('You', 0);
      g.set('Foe', 0);
      g.set('Bout', 'first to ' + TARGET);
    }

    function say(d, t, time) { d.msg = t; d.msgT = time || 1.3; }

    function dist(d) { return d.cpu.x - d.you.x; }

    /* ------------------------------------------------------------ actions */

    function canAct(f) {
      return f.state === 'ready' && f.parry <= 0 && f.parryRec <= 0;
    }

    function extend(g, f, lunge) {
      var d = g.data;
      if (!canAct(f)) return;
      f.state = 'extend';
      f.lunge = lunge;
      f.t = lunge ? .40 : .30;
      f.dur = f.t;
      f.startT = g.t;
      f.reachNow = lunge ? LUNGE_REACH : REACH;
      d.priority = f === d.you ? 1 : -1;
      Milo.sound.tone({ f: lunge ? 300 : 430, f2: 620, d: .07, v: .06, type: 'square' });
    }

    function parryNow(g, f) {
      if (!canAct(f)) return;
      f.parry = .28;
      f.parryRec = .52;
      Milo.sound.tone({ f: 700, d: .05, v: .045, type: 'triangle' });
    }

    function sparks(d, x, y, col) {
      for (var i = 0; i < 9; i++) {
        d.sparks.push({
          x: x, y: y, vx: U.rand(-160, 160), vy: U.rand(-180, 60),
          t: U.rand(.2, .5), col: col
        });
      }
    }

    function touch(g, who, why) {
      var d = g.data;
      if (who === 'you') { d.sy++; d.light = 1; Milo.sound.coin(); }
      else { d.sc++; d.light = -1; Milo.sound.hit(); }
      d.lightT = 1.4;
      d.hist.push(who === 'you' ? 1 : -1);
      g.set('You', d.sy);
      g.set('Foe', d.sc);
      d.lvl = 1 + Math.floor((d.sy + d.sc) / 2);
      g.score = d.sy * 220;
      say(d, why, 1.5);
      d.phase = 'reset';
      d.phaseT = 1.5;
    }

    function noTouch(g, why) {
      var d = g.data;
      d.light = 0;
      d.lightT = 1.2;
      say(d, why, 1.3);
      Milo.sound.tone({ f: 220, f2: 180, d: .16, v: .06, type: 'triangle' });
      d.phase = 'reset';
      d.phaseT = 1.1;
    }

    // An extension has arrived — parry, priority and distance decide it.
    function resolve(g, att, def, isPlayer) {
      var d = g.data;
      var gap = dist(d);
      var bladeX = isPlayer ? att.x + att.reachNow : att.x - att.reachNow;
      if (gap > att.reachNow) {
        att.state = 'recover';
        att.t = att.lunge ? .75 : .52;
        if (isPlayer) say(d, 'Short — you never had the distance', .9);
        return;
      }
      if (def.state === 'extend' && def.t < .09) {
        att.state = 'recover'; att.t = .3;
        def.state = 'recover'; def.t = .3;
        noTouch(g, 'Simultaneous — no touch');
        return;
      }
      if (def.parry > 0) {
        att.state = 'parried';
        att.t = .78;
        def.riposte = .72;
        def.parry = 0;
        d.priority = isPlayer ? -1 : 1;
        sparks(d, isPlayer ? def.x - 40 : def.x + 40, FLOOR - 66, '#fde047');
        Milo.sound.tone({ f: 1200, f2: 700, d: .12, v: .09, type: 'square' });
        say(d, isPlayer ? 'Parried! Their riposte is coming' : 'Parry — riposte now!', 1.2);
        return;
      }
      if (def.state === 'extend' && def.startT < att.startT && att.riposte <= 0) {
        att.state = 'recover'; att.t = .34;
        noTouch(g, 'No touch — theirs was the attack');
        return;
      }
      att.state = 'recover';
      att.t = att.lunge ? .55 : .3;
      def.state = 'ready'; def.t = 0;
      sparks(d, bladeX, FLOOR - 70, isPlayer ? '#4ade80' : '#fb7185');
      def.flash = .5;
      touch(g, isPlayer ? 'you' : 'cpu',
        isPlayer ? (att.riposte > 0 ? 'Riposte lands — touch!' : att.lunge ? 'Lunge — touch!' : 'Touch!')
          : (att.lunge ? 'His lunge finds you' : 'Touch against you'));
    }

    /* ---------------------------------------------------------------- AI */

    function aiThink(g, dt) {
      var d = g.data, a = d.cpu, you = d.you;
      var gap = dist(d);
      if (a.state === 'ready') a.reachNow = REACH;

      // Reacts to your extension with a parry, sometimes.
      if (you.state === 'extend' && a.state === 'ready' && a.parry <= 0 && a.parryRec <= 0 &&
        !a.reacted) {
        a.reacted = true;
        if (Math.random() < .34 + d.lvl * .06 && you.riposte <= 0) {
          a.pendingParry = .1;
        } else if (Math.random() < .3 + d.lvl * .05) {
          // Or he simply breaks distance and lets your attack fall short.
          a.moveDir = 1; a.moveT = .34; a.moveSpeed = 240 + d.lvl * 18;
          d.aiNext = Math.max(d.aiNext, .34);
        }
      }
      if (you.state !== 'extend') a.reacted = false;
      if (a.pendingParry > 0) {
        a.pendingParry -= dt;
        if (a.pendingParry <= 0) { a.pendingParry = 0; parryNow(g, a); }
      }

      if (a.riposte > 0 && a.state === 'ready' && gap < LUNGE_REACH) {
        extend(g, a, gap > REACH - 8);
        return;
      }
      // You are committed and cannot parry — this is when he comes in.
      if (a.state === 'ready' && a.parry <= 0 && a.parryRec <= 0 &&
        (you.state === 'recover' || you.state === 'parried') &&
        you.t > .1 && gap < LUNGE_REACH - 4 && Math.random() < .14 + d.lvl * .03) {
        extend(g, a, gap > REACH - 6);
        d.aiNext = U.rand(.4, .8);
        return;
      }

      d.aiNext -= dt;
      if (a.state !== 'ready' || d.aiNext > 0) return;

      var speed = 200 + d.lvl * 18;
      if (a.feintStage === 1) {
        // The blade goes out far enough to look real, then comes back.
        a.feintStage = 2;
        a.ext = 0;
        d.aiNext = .24;
        a.showBlade = .24;
        return;
      }
      if (a.feintStage === 2) {
        a.feintStage = 0;
        a.showBlade = 0;
        if (gap < LUNGE_REACH) extend(g, a, gap > REACH - 8);
        d.aiNext = U.rand(.45, .9) / (.8 + d.lvl * .1);
        return;
      }

      var roll = Math.random();
      if (gap > LUNGE_REACH + 6) {
        // Nothing is on from here — walk him down.
        a.moveDir = -1; a.moveT = U.rand(.3, .7); a.moveSpeed = speed;
        d.aiNext = a.moveT * .8;
      } else if (gap < REACH - 26 && roll < .4) {
        a.moveDir = 1; a.moveT = U.rand(.2, .45); a.moveSpeed = speed;
        d.aiNext = a.moveT;
      } else if (roll < .42 + d.lvl * .05) {
        extend(g, a, gap > REACH - 8);
        d.aiNext = U.rand(.45, .85);
      } else if (roll < .74 + d.lvl * .04) {
        a.feintStage = 1;
        a.showBlade = .3;
        d.aiNext = .3;
        Milo.sound.tone({ f: 380, d: .04, v: .035, type: 'triangle' });
      } else {
        a.moveDir = Math.random() < .5 ? -1 : 1;
        a.moveT = U.rand(.2, .5); a.moveSpeed = speed;
        d.aiNext = a.moveT;
      }
    }

    /* --------------------------------------------------------------- draw */

    // A foil is long: at rest the arm is bent, fully extended the tip sits
    // exactly at the reach the rules use.
    function bladeLen(f, ext) {
      var reach = f.lunge ? LUNGE_REACH : REACH;
      return 72 + ext * (reach - 72 - (f.lunge ? 26 : 0));
    }

    function drawFencer(c, f, col, extFrac, blade) {
      var x = f.x, dir = f.dir;
      var lungeOff = (f.state === 'extend' && f.lunge ? extFrac * 26 : 0) +
        (f.state === 'recover' && f.lunge ? 26 * U.clamp(f.t / .55, 0, 1) : 0);
      x += dir * lungeOff;
      c.save();
      c.translate(x, FLOOR);
      c.fillStyle = 'rgba(0,0,0,.25)';
      c.beginPath(); c.ellipse(0, 4, 32, 6, 0, 0, 7); c.fill();
      // legs: front leg reaches out on the lunge
      c.strokeStyle = col; c.lineWidth = 9; c.lineCap = 'round';
      c.beginPath();
      c.moveTo(0, -56); c.lineTo(dir * (26 + lungeOff * 1.5), 0);
      c.moveTo(0, -56); c.lineTo(-dir * 26, 0);
      c.stroke();
      c.fillStyle = f.flash > 0 ? '#fecaca' : '#e8edf5';
      U.roundRect(c, -13, -104, 26, 50, 10); c.fill();
      c.fillStyle = col;
      c.fillRect(-13, -104, 26, 9);
      // mask
      c.fillStyle = '#94a3b8';
      c.beginPath(); c.arc(dir * 3, -116, 14, 0, 7); c.fill();
      c.strokeStyle = 'rgba(15,23,42,.55)'; c.lineWidth = 1;
      for (var i = -3; i <= 3; i++) {
        c.beginPath(); c.moveTo(dir * 3 + i * 4, -129); c.lineTo(dir * 3 + i * 4, -103); c.stroke();
      }
      // sword arm
      var ext = blade;
      c.strokeStyle = col; c.lineWidth = 7;
      c.beginPath();
      c.moveTo(0, -92); c.lineTo(dir * (18 + ext * .18), -86); c.stroke();
      c.strokeStyle = '#f1f5f9'; c.lineWidth = 3;
      c.beginPath();
      c.moveTo(dir * (18 + ext * .18), -86);
      c.lineTo(dir * (18 + ext), -84);
      c.stroke();
      c.fillStyle = '#cbd5e1';
      c.beginPath(); c.arc(dir * (20 + ext * .18), -86, 5, 0, 7); c.fill();
      // back arm
      c.strokeStyle = col; c.lineWidth = 5;
      c.beginPath();
      c.moveTo(-dir * 6, -96); c.lineTo(-dir * 26, -112); c.stroke();
      if (f.parry > 0) {
        c.strokeStyle = 'rgba(253,224,71,.85)'; c.lineWidth = 3;
        c.beginPath(); c.arc(dir * 34, -86, 24, 0, 7); c.stroke();
      }
      if (f.riposte > 0) {
        c.fillStyle = '#fde047';
        c.font = '900 12px Outfit, sans-serif'; c.textAlign = 'center';
        c.fillText('RIPOSTE', 0, -142);
      }
      c.restore();
    }

    return Milo.arcade(host, {
      id: 'fencing-duel',
      w: W, h: H, bg: '#0a1020',
      stats: ['You', 'Foe', 'Bout'],
      emo: '🤺',
      touch: 'dpad',
      touchButtons: [{ key: 'action', label: 'ATK' }, { key: 'a', label: 'PRY' }],
      start: {
        title: 'Fencing',
        text: 'Footwork with ← →, attack with Space, parry with X, lunge with ↓. Right of ' +
          'way is shown at the top: whoever extends first owns the attack, and a touch into ' +
          'their attack does not count. Parry their blade and you get a riposte they cannot ' +
          'parry back. Watch for the feint — he will push the blade out to buy your parry, ' +
          'then hit you while it is still recovering. First to five touches; retreat off the ' +
          'end of the piste and you hand one over.',
        keys: ['← →  footwork', 'Space  attack', 'X  parry', '↓  lunge']
      },
      init: reset,

      onPointer: function (g, type) { if (type === 'down') g.data.tap.atk = true; },
      onKey: function (g, e) {
        if (e.code === 'KeyX' || e.code === 'KeyC') g.data.tap.parry = true;
      },

      update: function (g, dt) {
        var d = g.data, k = g.input, i;
        var you = d.you, cpu = d.cpu;
        var atk = k.pressed('action') || d.tap.atk;
        var pry = k.pressed('a') || d.tap.parry;
        d.tap.atk = false; d.tap.parry = false;
        if (d.msgT > 0) d.msgT -= dt;
        if (d.lightT > 0) d.lightT -= dt;

        for (i = d.sparks.length - 1; i >= 0; i--) {
          var s = d.sparks[i];
          s.t -= dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 420 * dt;
          if (s.t <= 0) d.sparks.splice(i, 1);
        }
        [you, cpu].forEach(function (f) {
          if (f.parry > 0) f.parry -= dt;
          if (f.parryRec > 0) f.parryRec -= dt;
          if (f.riposte > 0) f.riposte -= dt;
          if (f.flash > 0) f.flash -= dt;
          if (f.showBlade > 0) f.showBlade -= dt;
        });

        if (d.phase === 'reset') {
          d.phaseT -= dt;
          if (d.phaseT <= 0) {
            if (d.sy >= TARGET || d.sc >= TARGET) {
              var sc2 = d.sy * 220 + Math.max(0, d.sy - d.sc) * 90 + (d.sy > d.sc ? 600 : 0);
              g.score = sc2;
              if (d.sy > d.sc) {
                g.win({
                  emo: '🤺', title: 'Bout won ' + d.sy + '–' + d.sc,
                  text: 'Five touches against an opponent at level ' + d.lvl + '.', score: sc2
                });
              } else {
                g.gameOver({
                  emo: '🤺', title: 'Bout lost ' + d.sy + '–' + d.sc,
                  text: 'You scored ' + d.sy + ' touch' + (d.sy === 1 ? '' : 'es') + '.', score: sc2
                });
              }
              return;
            }
            d.you = fencer(330, 1);
            d.cpu = fencer(556, -1);
            d.phase = 'fence';
            d.priority = 0;
            d.aiNext = .35;
            say(d, 'En garde — allez', 1);
          }
          return;
        }
        if (d.phase !== 'fence') return;

        /* --- player --- */
        if (canAct(you)) {
          var mv = (k.down('right') ? 1 : 0) - (k.down('left') ? 1 : 0);
          you.x += mv * 250 * dt;
          if (atk) extend(g, you, false);
          else if (k.pressed('down') || k.pressed('up')) extend(g, you, true);
          else if (pry) parryNow(g, you);
        }
        you.x = U.clamp(you.x, PISTE_L - 30, cpu.x - 56);
        if (you.x <= PISTE_L - 28) {
          touch(g, 'cpu', 'Off the end of the piste — touch against you');
          return;
        }

        aiThink(g, dt);
        if (cpu.moveT > 0) {
          cpu.moveT -= dt;
          if (cpu.state === 'ready') cpu.x += cpu.moveDir * (cpu.moveSpeed || 150) * dt;
        }
        cpu.x = U.clamp(cpu.x, you.x + 56, PISTE_R + 20);

        /* --- blades --- */
        var pairs = [[you, cpu, true], [cpu, you, false]];
        for (i = 0; i < pairs.length; i++) {
          var f = pairs[i][0], o = pairs[i][1], isP = pairs[i][2];
          if (f.state === 'extend') {
            f.t -= dt;
            f.ext = 1 - U.clamp(f.t / f.dur, 0, 1);
            if (f.t <= 0) { resolve(g, f, o, isP); if (g.state !== 'play') return; }
          } else if (f.state === 'recover' || f.state === 'parried') {
            f.t -= dt;
            f.ext = U.clamp(f.t / (f.state === 'parried' ? .78 : .5), 0, 1) * .5;
            if (f.t <= 0) { f.state = 'ready'; f.ext = 0; f.lunge = false; }
          } else {
            f.ext = Math.max(0, f.ext - dt * 3);
          }
        }
        if (you.state === 'ready' && cpu.state === 'ready') d.priority = 0;
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, i;
        var you = d.you, cpu = d.cpu;

        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#111c33'); bg.addColorStop(1, '#070b16');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        // piste
        c.fillStyle = '#28324d';
        c.fillRect(PISTE_L - 30, FLOOR, PISTE_R - PISTE_L + 60, 40);
        c.fillStyle = '#39456a';
        c.fillRect(PISTE_L, FLOOR, PISTE_R - PISTE_L, 40);
        c.strokeStyle = 'rgba(226,232,240,.5)'; c.lineWidth = 2;
        [PISTE_L, PISTE_L + 150, (PISTE_L + PISTE_R) / 2, PISTE_R - 150, PISTE_R].forEach(function (x) {
          c.beginPath(); c.moveTo(x, FLOOR); c.lineTo(x, FLOOR + 40); c.stroke();
        });
        c.fillStyle = 'rgba(248,113,113,.18)';
        c.fillRect(PISTE_L - 30, FLOOR, 30, 40);
        c.fillRect(PISTE_R, FLOOR, 30, 40);

        var cExt = cpu.state === 'extend' ? cpu.ext : Math.max(cpu.ext, cpu.showBlade > 0 ? .72 : 0);
        drawFencer(c, you, '#2563eb', you.ext, bladeLen(you, you.ext));
        drawFencer(c, cpu, '#b91c1c', cpu.ext, bladeLen(cpu, cExt));

        for (i = 0; i < d.sparks.length; i++) {
          c.fillStyle = d.sparks[i].col;
          c.globalAlpha = U.clamp(d.sparks[i].t * 3, 0, 1);
          c.fillRect(d.sparks[i].x - 2, d.sparks[i].y - 2, 4, 4);
          c.globalAlpha = 1;
        }

        /* --- scoring box --- */
        c.fillStyle = 'rgba(6,10,20,.86)';
        U.roundRect(c, W / 2 - 150, 58, 300, 74, 12); c.fill();
        c.textAlign = 'center';
        c.fillStyle = '#38bdf8';
        c.font = '900 34px Outfit, sans-serif';
        c.fillText(d.sy, W / 2 - 92, 100);
        c.fillStyle = '#fb7185';
        c.fillText(d.sc, W / 2 + 92, 100);
        // lamps
        c.fillStyle = d.lightT > 0 && d.light === 1 ? '#4ade80' : 'rgba(74,222,128,.15)';
        U.roundRect(c, W / 2 - 146, 64, 34, 20, 5); c.fill();
        c.fillStyle = d.lightT > 0 && d.light === -1 ? '#ef4444' : 'rgba(239,68,68,.15)';
        U.roundRect(c, W / 2 + 112, 64, 34, 20, 5); c.fill();
        c.fillStyle = 'rgba(226,232,240,.65)';
        c.font = '700 11px Outfit, sans-serif';
        c.fillText('FIRST TO ' + TARGET + '   ·   OPPONENT LV ' + d.lvl, W / 2, 124);

        // right of way
        var pr = d.priority;
        c.fillStyle = 'rgba(6,10,20,.8)';
        U.roundRect(c, W / 2 - 96, 138, 192, 26, 8); c.fill();
        c.fillStyle = pr === 1 ? '#4ade80' : pr === -1 ? '#fb7185' : 'rgba(226,232,240,.55)';
        c.font = '800 13px Outfit, sans-serif';
        c.fillText(pr === 1 ? 'RIGHT OF WAY: YOURS' : pr === -1 ? 'RIGHT OF WAY: THEIRS' : 'RIGHT OF WAY: OPEN',
          W / 2, 156);

        // distance meter
        var gap = dist(d);
        c.textAlign = 'left';
        c.fillStyle = 'rgba(6,10,20,.8)';
        U.roundRect(c, 24, 126, 190, 58, 10); c.fill();
        c.fillStyle = 'rgba(226,232,240,.6)';
        c.font = '700 10px Outfit, sans-serif';
        c.fillText('DISTANCE', 36, 144);
        c.fillStyle = 'rgba(255,255,255,.12)';
        U.roundRect(c, 36, 150, 166, 12, 6); c.fill();
        var inAtk = gap <= REACH, inLunge = gap <= LUNGE_REACH;
        c.fillStyle = inAtk ? '#4ade80' : inLunge ? '#facc15' : '#64748b';
        U.roundRect(c, 36, 150, 166 * U.clamp(1 - (gap - 60) / 260, .04, 1), 12, 6); c.fill();
        c.fillStyle = inAtk ? '#4ade80' : inLunge ? '#facc15' : 'rgba(226,232,240,.55)';
        c.font = '800 11px Outfit, sans-serif';
        c.fillText(inAtk ? 'IN ATTACK RANGE' : inLunge ? 'LUNGE RANGE ONLY' : 'OUT OF DISTANCE', 36, 176);

        // touch history
        c.textAlign = 'right';
        c.fillStyle = 'rgba(6,10,20,.8)';
        U.roundRect(c, W - 214, 126, 190, 34, 10); c.fill();
        for (i = 0; i < 9; i++) {
          var v = d.hist[i];
          c.fillStyle = v === 1 ? '#38bdf8' : v === -1 ? '#fb7185' : 'rgba(255,255,255,.12)';
          c.beginPath(); c.arc(W - 198 + i * 20, 143, 6, 0, 7); c.fill();
        }

        c.textAlign = 'center';
        if (d.msgT > 0) {
          c.globalAlpha = U.clamp(d.msgT, 0, 1);
          c.fillStyle = '#f1f5f9';
          c.font = '800 19px Outfit, sans-serif';
          c.fillText(d.msg, W / 2, 212);
          c.globalAlpha = 1;
        }
        c.fillStyle = 'rgba(226,232,240,.45)';
        c.font = '600 12px Outfit, sans-serif';
        c.fillText('← → footwork   ·   Space attack   ·   X parry   ·   ↓ lunge', W / 2, H - 16);
      }
    });
  }

  window.Milo.register({
    id: 'fencing-duel',
    title: 'Fencing',
    emo: '🤺',
    category: 'Sports',
    tagline: 'Attack, parry, riposte — and right of way on screen',
    description: 'A foil bout where the right of way is written across the top of the ' +
      'screen: whoever extends first owns the attack, and hitting into their attack simply ' +
      'does not count. Space is a straight attack, ↓ a lunge that buys you 80 more pixels ' +
      'of reach at the price of a long recovery, and X is a parry — catch their blade and ' +
      'the riposte it gives you cannot be parried back. The distance meter tells you whether ' +
      'you are in range at all, and the opponent throws real feints, pushing the blade out ' +
      'to draw your parry before hitting the moment it expires. First to five touches, and ' +
      'backing off the end of the piste hands one over.',
    controls: ['← →  footwork', 'Space  attack', 'X  parry', '↓  lunge'],
    colors: ['#1e3a8a', '#f8fafc'],
    tags: ['fencing', 'duel', 'timing', 'vs cpu', 'foil'],
    mount: mount
  });
})();
