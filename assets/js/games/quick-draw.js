/* Quick Draw — a ten-duel ladder where only one tell is the real one. */
(function () {
  'use strict';

  var W = 820, H = 500;
  var HORIZON = 322, GROUND = H;
  var PX = 190, OX = 640;

  var DUELLISTS = [
    { name: 'Slowhand Sal', hat: '#8b5a2b', ms: 720, tells: 1 },
    { name: 'Dusty Pete', hat: '#7c4a21', ms: 660, tells: 1 },
    { name: 'Curly Jim', hat: '#6b4423', ms: 600, tells: 2 },
    { name: 'Black Bart', hat: '#2f2b2a', ms: 550, tells: 2 },
    { name: 'Ada Quickstep', hat: '#9d4b4b', ms: 500, tells: 2 },
    { name: 'Silent Sam', hat: '#4a4238', ms: 460, tells: 3 },
    { name: 'Rattlesnake Ruiz', hat: '#7a6a3a', ms: 420, tells: 3 },
    { name: 'Iron-Eye Ivy', hat: '#3f4d5c', ms: 385, tells: 3 },
    { name: 'The Undertaker', hat: '#1f1f22', ms: 350, tells: 4 },
    { name: 'The Marshal', hat: '#c0a062', ms: 315, tells: 4 }
  ];

  var TELLS = ['bird', 'tumbleweed', 'twitch', 'gust', 'bell', 'gasp'];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var S = Milo.sound;

    function reset(g) {
      var d = g.data;
      d.duel = 0;
      d.lives = 3;
      d.phase = 'card';
      d.pt = 1.7;
      d.result = null;
      d.props = [];
      d.parts = [];
      d.flash = 0;
      d.shake = 0;
      d.fastest = 0;
      d.wins = 0;
      d.youMs = 0;
      d.youFired = false;
      d.oppFired = false;
      d.oppArm = 0;
      d.youArm = 0;
      d.fall = { you: 0, opp: 0 };
      d.nextTell = 0;
      d.twitch = 0;
      g.score = 0;
      g.set('Score', 0);
      g.set('Duel', '1/10');
      g.set('Lives', 3);
      g.set('Best draw', '—');
    }

    function foe(d) { return DUELLISTS[Math.min(d.duel, DUELLISTS.length - 1)]; }

    function startDuel(g) {
      var d = g.data;
      d.phase = 'card';
      d.pt = 1.7;
      d.result = null;
      d.youFired = false;
      d.oppFired = false;
      d.youArm = 0;
      d.oppArm = 0;
      d.twitch = 0;
      d.fall = { you: 0, opp: 0 };
      d.props = [];
      g.set('Duel', (d.duel + 1) + '/10');
    }

    function beginStandoff(g) {
      var d = g.data;
      d.phase = 'standoff';
      d.pt = 0;
      d.wait = U.rand(1.6, 4.6);
      d.nextTell = U.rand(.4, 1.1);
      S.tone({ f: 220, d: .3, v: .06, type: 'sine' });
    }

    /* ---------------------------------------------------------- fake tells */

    function spawnTell(g) {
      var d = g.data;
      var kind = U.choice(TELLS);
      if (kind === 'bird') {
        var dir = Math.random() < .5 ? 1 : -1;
        d.props.push({ k: 'bird', x: dir > 0 ? -40 : W + 40, y: U.rand(70, 170), vx: dir * U.rand(150, 240), t: 0 });
        S.tone({ f: 1500, d: .05, v: .045, type: 'sine' });
        setTimeout(function () { S.tone({ f: 1900, d: .05, v: .04, type: 'sine' }); }, 90);
      } else if (kind === 'tumbleweed') {
        d.props.push({ k: 'weed', x: W + 40, y: GROUND - 54, vx: -U.rand(120, 200), t: 0, r: 0 });
        S.noise(.3, .045, 1400);
      } else if (kind === 'twitch') {
        d.twitch = .34;
        S.tone({ f: 300, d: .04, v: .05, type: 'triangle' });
      } else if (kind === 'gust') {
        for (var i = 0; i < 26; i++) {
          d.parts.push({
            x: U.rand(-60, 0), y: U.rand(HORIZON, H), vx: U.rand(220, 460), vy: U.rand(-30, 20),
            life: U.rand(.6, 1.3), max: 1.3, col: 'rgba(222,190,140,.55)', r: U.rand(1, 3)
          });
        }
        S.noise(.5, .05, 800);
      } else if (kind === 'bell') {
        S.tone({ f: 660, d: .5, v: .06, type: 'sine' });
        d.props.push({ k: 'bell', x: W / 2, y: 90, t: .7 });
      } else {
        S.noise(.18, .05, 500);
        d.props.push({ k: 'gasp', x: W / 2, y: 120, t: .7 });
      }
      d.nextTell = U.rand(.45, 1.15);
    }

    /* --------------------------------------------------------------- shots */

    function muzzle(d, x, y, dir) {
      for (var i = 0; i < 16; i++) {
        d.parts.push({
          x: x, y: y, vx: dir * U.rand(180, 620), vy: U.rand(-90, 90),
          life: U.rand(.12, .3), max: .3, col: U.choice(['#fff3c4', '#ffd257', '#ff9f43']), r: U.rand(1.5, 3.5)
        });
      }
      S.noise(.24, .18, 1500);
      S.tone({ f: 110, f2: 40, d: .28, v: .14, type: 'sawtooth' });
      d.shake = .45;
      d.flash = .3;
    }

    function fire(g) {
      var d = g.data;
      if (g.state !== 'play') return;

      if (d.phase === 'card') { d.pt = 0; beginStandoff(g); return; }

      if (d.phase === 'standoff') {
        d.phase = 'result';
        d.pt = 0;
        d.youArm = 1;
        muzzle(d, PX + 42, 250, 1);
        d.oppArm = 1;
        d.result = { kind: 'early', text: 'TOO EARLY', sub: 'You drew before the call. That is how legends end.' };
        d.fall.you = 1;
        loseLife(g);
        return;
      }

      if (d.phase === 'draw' && !d.youFired) {
        d.youFired = true;
        d.youMs = Math.round(d.pt * 1000);
        d.youArm = 1;
        muzzle(d, PX + 42, 250, 1);
        var f = foe(d);
        if (d.youMs < f.ms) {
          d.phase = 'result';
          d.fall.opp = 1;
          d.wins++;
          if (!d.fastest || d.youMs < d.fastest) { d.fastest = d.youMs; g.set('Best draw', d.fastest + 'ms'); }
          var margin = f.ms - d.youMs;
          var pts = 300 + d.duel * 90 + margin * 2;
          g.score += pts;
          g.set('Score', U.fmt(g.score));
          d.result = {
            kind: 'win', text: 'YOU WIN THE DUEL',
            sub: 'You ' + d.youMs + 'ms · ' + f.name + ' ' + f.ms + 'ms  (+' + U.fmt(pts) + ')'
          };
          S.win();
          d.pt = 0;
        }
        return;
      }
    }

    function loseLife(g) {
      var d = g.data;
      d.lives--;
      g.set('Lives', Math.max(0, d.lives));
      S.lose();
    }

    /* -------------------------------------------------------------- update */

    function endResult(g) {
      var d = g.data;
      if (d.lives <= 0) {
        g.gameOver({
          emo: '🤠', title: 'Boot Hill',
          text: d.wins + ' duel' + (d.wins === 1 ? '' : 's') + ' won' +
            (d.fastest ? ' · fastest draw ' + d.fastest + 'ms' : '') + '.'
        });
        return;
      }
      if (d.result && d.result.kind === 'win') {
        d.duel++;
        if (d.duel >= DUELLISTS.length) {
          g.win({
            emo: '🏆', title: 'Ladder cleared',
            text: 'All ten duellists beaten' + (d.fastest ? ' · fastest draw ' + d.fastest + 'ms' : '') + '.',
            score: g.score
          });
          return;
        }
      }
      startDuel(g);
    }

    return Milo.arcade(host, {
      id: 'quick-draw',
      w: W, h: H, bg: '#2a1a2e',
      stats: ['Score', 'Duel', 'Lives', 'Best draw'],
      emo: '🤠',
      touchButtons: [{ key: 'action', label: 'DRAW' }],
      start: {
        title: 'Quick Draw',
        text: 'Ten duellists, each faster on the draw than the last. Wait for the word DRAW! ' +
          'and fire — but the street is full of liars: birds, tumbleweeds, a distant bell and ' +
          'the twitch of his gun hand. Fire on a fake and you lose the round outright.',
        keys: ['Space', 'Click']
      },
      init: reset,

      onKey: function (g, e) { if (e.code === 'Space' || e.code === 'Enter') fire(g); },
      onPointer: function (g, type) { if (type === 'down') fire(g); },

      update: function (g, dt) {
        var d = g.data;
        if (g.input.pressed('action')) fire(g);

        d.pt += dt;
        d.flash = Math.max(0, d.flash - dt * 3);
        d.shake = Math.max(0, d.shake - dt * 1.8);
        d.twitch = Math.max(0, d.twitch - dt);
        d.youArm = Math.max(0, d.youArm - dt * .8);
        if (d.phase !== 'result') d.oppArm = Math.max(0, d.oppArm - dt * .8);

        for (var i = d.props.length - 1; i >= 0; i--) {
          var p = d.props[i];
          if (p.k === 'bird') { p.x += p.vx * dt; p.t += dt; if (p.x < -70 || p.x > W + 70) d.props.splice(i, 1); }
          else if (p.k === 'weed') { p.x += p.vx * dt; p.r += dt * 7; if (p.x < -70) d.props.splice(i, 1); }
          else { p.t -= dt; if (p.t <= 0) d.props.splice(i, 1); }
        }
        for (var k = d.parts.length - 1; k >= 0; k--) {
          var q = d.parts[k];
          q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 240 * dt; q.life -= dt;
          if (q.life <= 0) d.parts.splice(k, 1);
        }
        if (d.fall.you > 0) d.fall.you = Math.min(1, d.fall.you + dt * 2.4);
        if (d.fall.opp > 0) d.fall.opp = Math.min(1, d.fall.opp + dt * 2.4);

        if (d.phase === 'card') {
          if (d.pt >= 1.7) beginStandoff(g);
          return;
        }

        if (d.phase === 'standoff') {
          d.nextTell -= dt;
          if (d.nextTell <= 0 && d.pt < d.wait - .35) {
            if (Math.random() < .35 + foe(d).tells * .16) spawnTell(g);
            else d.nextTell = U.rand(.4, 1);
          }
          if (d.pt >= d.wait) {
            d.phase = 'draw';
            d.pt = 0;
            d.flash = .5;
            S.tone({ f: 1500, d: .09, v: .12, type: 'square' });
            setTimeout(function () { S.tone({ f: 2000, d: .1, v: .1, type: 'square' }); }, 70);
          }
          return;
        }

        if (d.phase === 'draw') {
          var f = foe(d);
          if (!d.youFired && d.pt * 1000 >= f.ms) {
            d.oppFired = true;
            d.oppArm = 1;
            muzzle(d, OX - 42, 250, -1);
            d.fall.you = 1;
            d.phase = 'result';
            d.pt = 0;
            d.result = {
              kind: 'slow', text: f.name.toUpperCase() + ' WAS FASTER',
              sub: 'He drew in ' + f.ms + 'ms. You were still reaching.'
            };
            loseLife(g);
          }
          return;
        }

        if (d.phase === 'result') {
          if (d.pt >= 2.4) endResult(g);
        }
      },

      /* ---------------------------------------------------------------- draw */

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.save();
        if (d.shake > 0) c.translate(U.rand(-1, 1) * d.shake * 9, U.rand(-1, 1) * d.shake * 9);

        // sky
        var sky = c.createLinearGradient(0, 0, 0, HORIZON);
        sky.addColorStop(0, '#3b1f52');
        sky.addColorStop(.45, '#a8436a');
        sky.addColorStop(.8, '#e8794a');
        sky.addColorStop(1, '#f7b267');
        c.fillStyle = sky; c.fillRect(0, 0, W, HORIZON);

        // sun
        c.fillStyle = '#ffd08a';
        c.beginPath(); c.arc(W / 2, HORIZON - 26, 84, 0, 6.2832); c.fill();
        c.fillStyle = 'rgba(232,121,74,.55)';
        for (var b = 0; b < 6; b++) c.fillRect(W / 2 - 90, HORIZON - 70 + b * 14, 180, 5);

        // mesas
        c.fillStyle = '#5d2f4a';
        c.beginPath();
        c.moveTo(-20, HORIZON); c.lineTo(80, 214); c.lineTo(150, 214); c.lineTo(196, 250);
        c.lineTo(268, 250); c.lineTo(300, HORIZON); c.closePath(); c.fill();
        c.beginPath();
        c.moveTo(540, HORIZON); c.lineTo(592, 232); c.lineTo(690, 232); c.lineTo(726, 262);
        c.lineTo(840, 262); c.lineTo(840, HORIZON); c.closePath(); c.fill();

        // ground
        var gr = c.createLinearGradient(0, HORIZON, 0, H);
        gr.addColorStop(0, '#c98b4b'); gr.addColorStop(1, '#7c4e2a');
        c.fillStyle = gr; c.fillRect(0, HORIZON, W, H - HORIZON);
        c.fillStyle = 'rgba(0,0,0,.12)';
        for (var s = 0; s < 8; s++) {
          c.fillRect(0, HORIZON + 10 + s * s * 2.4, W, 2);
        }

        // cacti
        drawCactus(c, 70, HORIZON + 46, 1);
        drawCactus(c, 760, HORIZON + 66, 1.2);

        // props behind the figures
        for (var i = 0; i < d.props.length; i++) {
          var p = d.props[i];
          if (p.k === 'bird') {
            c.strokeStyle = 'rgba(40,20,40,.8)'; c.lineWidth = 2.5;
            var fl = Math.sin(p.t * 16) * 7;
            c.beginPath();
            c.moveTo(p.x - 11, p.y + fl); c.quadraticCurveTo(p.x, p.y - 6, p.x + 11, p.y + fl);
            c.stroke();
          } else if (p.k === 'weed') {
            c.save();
            c.translate(p.x, p.y);
            c.rotate(p.r);
            c.strokeStyle = '#8a6a33'; c.lineWidth = 2.5;
            for (var a = 0; a < 7; a++) {
              c.beginPath();
              c.moveTo(-22, 0); c.lineTo(22, 0);
              c.rotate(Math.PI / 7);
              c.stroke();
            }
            c.restore();
          } else if (p.k === 'bell') {
            c.textAlign = 'center';
            c.globalAlpha = Math.min(1, p.t * 2);
            c.font = '30px Outfit, sans-serif';
            c.fillText('🔔', p.x, p.y);
            c.globalAlpha = 1;
          } else if (p.k === 'gasp') {
            c.textAlign = 'center';
            c.globalAlpha = Math.min(1, p.t * 2);
            c.fillStyle = 'rgba(255,255,255,.7)';
            c.font = '700 20px Outfit, sans-serif';
            c.fillText('…the crowd holds its breath…', p.x, p.y);
            c.globalAlpha = 1;
          }
        }

        // duellists
        drawGuy(c, PX, 1, '#2b1b2e', '#4b6ea9', d.youArm, d.fall.you, 0);
        drawGuy(c, OX, -1, '#241a22', foe(d).hat, d.oppArm, d.fall.opp, d.twitch);

        // particles
        for (var k = 0; k < d.parts.length; k++) {
          var q = d.parts[k];
          c.globalAlpha = Math.max(0, q.life / q.max);
          c.fillStyle = q.col;
          c.beginPath(); c.arc(q.x, q.y, q.r, 0, 6.2832); c.fill();
        }
        c.globalAlpha = 1;

        if (d.flash > 0) {
          c.fillStyle = 'rgba(255,255,255,' + (d.flash * .5).toFixed(3) + ')';
          c.fillRect(0, 0, W, H);
        }

        // ladder pips
        c.textAlign = 'center';
        c.fillStyle = 'rgba(30,14,24,.42)';
        U.roundRect(c, W / 2 - 124, H - 44, 248, 30, 15); c.fill();
        for (var l = 0; l < DUELLISTS.length; l++) {
          c.fillStyle = l < d.duel ? '#ffd257' : l === d.duel ? '#fff' : 'rgba(255,255,255,.22)';
          c.beginPath(); c.arc(W / 2 - 99 + l * 22, H - 29, l === d.duel ? 7 : 5, 0, 6.2832); c.fill();
        }

        // overlay text
        if (d.phase === 'card') {
          var f2 = foe(d);
          c.fillStyle = 'rgba(20,10,20,.72)';
          U.roundRect(c, W / 2 - 220, 150, 440, 150, 16); c.fill();
          c.strokeStyle = '#ffd257'; c.lineWidth = 2;
          U.roundRect(c, W / 2 - 220, 150, 440, 150, 16); c.stroke();
          c.fillStyle = 'rgba(255,255,255,.55)';
          c.font = '700 13px Outfit, sans-serif';
          c.fillText('DUEL ' + (d.duel + 1) + ' OF 10', W / 2, 184);
          c.fillStyle = '#fff';
          c.font = '800 32px Outfit, sans-serif';
          c.fillText(f2.name, W / 2, 224);
          c.fillStyle = '#ffd257';
          c.font = '800 20px Outfit, sans-serif';
          c.fillText('draws in ' + f2.ms + ' ms', W / 2, 256);
          c.fillStyle = 'rgba(255,255,255,.5)';
          c.font = '700 13px Outfit, sans-serif';
          c.fillText('Space or click to step into the street', W / 2, 284);
        } else if (d.phase === 'standoff') {
          c.fillStyle = 'rgba(20,10,20,.5)';
          U.roundRect(c, W / 2 - 150, 62, 300, 46, 12); c.fill();
          c.fillStyle = '#fff';
          c.font = '800 24px Outfit, sans-serif';
          c.fillText('HOLD…', W / 2, 94);
        } else if (d.phase === 'draw') {
          c.fillStyle = '#fff';
          c.font = '900 92px Outfit, sans-serif';
          c.fillText('DRAW!', W / 2, 150);
          c.fillStyle = 'rgba(255,255,255,.6)';
          c.font = '700 15px Outfit, sans-serif';
          c.fillText(Math.round(d.pt * 1000) + ' ms', W / 2, 180);
        } else if (d.phase === 'result' && d.result) {
          var col = d.result.kind === 'win' ? '#7ee787' : '#ff6b6b';
          c.fillStyle = 'rgba(20,10,20,.76)';
          U.roundRect(c, W / 2 - 250, 120, 500, 120, 16); c.fill();
          c.strokeStyle = col; c.lineWidth = 2;
          U.roundRect(c, W / 2 - 250, 120, 500, 120, 16); c.stroke();
          c.fillStyle = col;
          c.font = '800 30px Outfit, sans-serif';
          c.fillText(d.result.text, W / 2, 168);
          c.fillStyle = 'rgba(255,255,255,.8)';
          c.font = '700 15px Outfit, sans-serif';
          c.fillText(d.result.sub, W / 2, 202);
          c.fillStyle = 'rgba(255,255,255,.45)';
          c.font = '700 13px Outfit, sans-serif';
          c.fillText(d.lives > 0 ? (d.result.kind === 'win' ? 'Next duellist steps up…' : 'One life gone — same man, again.')
            : 'No lives left…', W / 2, 228);
        }
        c.restore();
      }
    });

    function drawCactus(c, x, y, sc) {
      c.save();
      c.translate(x, y); c.scale(sc, sc);
      c.fillStyle = '#3f5c33';
      U.roundRect(c, -9, -70, 18, 70, 9); c.fill();
      U.roundRect(c, -30, -52, 13, 30, 6); c.fill();
      U.roundRect(c, -30, -52, 34, 12, 6); c.fill();
      U.roundRect(c, 18, -62, 13, 34, 6); c.fill();
      U.roundRect(c, -2, -62, 33, 12, 6); c.fill();
      c.restore();
    }

    function drawGuy(c, x, dir, coat, hat, arm, fall, twitch) {
      c.save();
      c.translate(x, 0);
      if (fall > 0) {
        c.translate(0, fall * 30);
        c.rotate(dir * fall * 1.1);
      }
      var bodyY = 196, legY = 300;
      // shadow
      c.fillStyle = 'rgba(0,0,0,.28)';
      c.beginPath(); c.ellipse(0, 372, 46, 10, 0, 0, 6.2832); c.fill();
      // legs
      c.fillStyle = coat;
      U.roundRect(c, -24, legY, 20, 74, 7); c.fill();
      U.roundRect(c, 6, legY, 20, 74, 7); c.fill();
      // boots
      c.fillStyle = '#20161c';
      U.roundRect(c, -28, 366, 28, 12, 5); c.fill();
      U.roundRect(c, 4, 366, 28, 12, 5); c.fill();
      // coat
      c.fillStyle = coat;
      U.roundRect(c, -34, bodyY, 68, 112, 14); c.fill();
      // belt
      c.fillStyle = '#8a6a33';
      c.fillRect(-34, bodyY + 86, 68, 12);
      c.fillStyle = '#ffd257';
      c.fillRect(-7, bodyY + 85, 14, 14);
      // head
      c.fillStyle = '#e0ac69';
      c.beginPath(); c.arc(0, bodyY - 26, 22, 0, 6.2832); c.fill();
      // hat
      c.fillStyle = hat;
      U.roundRect(c, -34, bodyY - 42, 68, 9, 4); c.fill();
      U.roundRect(c, -18, bodyY - 66, 36, 26, 7); c.fill();
      // gun arm — raises as the draw happens, or jerks on a fake tell
      var a = Math.max(arm, twitch * 1.6);
      c.save();
      c.translate(dir * 24, bodyY + 30);
      c.scale(dir, 1);
      c.rotate(0.62 - a * 1.5);
      c.fillStyle = coat;
      U.roundRect(c, -9, -8, 46, 17, 8); c.fill();
      c.fillStyle = '#e0ac69';
      c.beginPath(); c.arc(38, 1, 8, 0, 6.2832); c.fill();
      if (arm > .25) {
        c.fillStyle = '#2b2b30';
        c.fillRect(40, -4, 26, 8);
        c.fillRect(44, 4, 7, 11);
      }
      c.restore();
      // holster
      c.fillStyle = '#5a3d1e';
      U.roundRect(c, dir * 24 - 9, bodyY + 78, 20, 26, 5); c.fill();
      c.restore();
    }
  }

  window.Milo.register({
    id: 'quick-draw', title: 'Quick Draw', emo: '🤠', category: 'Casual',
    tagline: 'Ten duellists, one honest signal',
    description: 'A ladder of ten gunslingers who draw in 720 milliseconds at the bottom and ' +
      '315 at the top. Between "hold" and "DRAW!" the street throws tells at you — a bird ' +
      'crossing the sun, a tumbleweed, a church bell, the crowd gasping and his gun hand ' +
      'twitching toward the holster — and firing on any of them loses the round outright. ' +
      'Only the white flash and the word DRAW! are real. Each win scores double the ' +
      'milliseconds you beat him by, and you get three lives across the whole ladder. ' +
      'Tip: the fakes all make noise before anything moves; keep your eyes on the centre ' +
      'of the screen, not on him.',
    controls: ['Space', 'Click'],
    colors: ['#a8436a', '#f7b267'],
    tags: ['reaction', 'western', 'duel', 'reflex', 'timing'],
    mount: mount
  });
})();
