/* Curling — six ends, eight stones an end, sweep it home. */
(function () {
  'use strict';

  var W = 780, H = 620;
  var CX = 390, TEE = 150;            // centre line x, button y
  var ICE_L = 150, ICE_R = 630;
  var HOG = 330, BACK = 58;           // far hog line / back line
  var HACK = 590;                     // delivery point
  var R = 13;                         // stone radius
  var HOUSE = 100;                    // 12-foot radius
  var ENDS = 6;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    /* ------------------------------------------------------------ physics */

    // One integration step for a sliding stone. Sweeping cuts the friction
    // (the stone runs further) and flattens the curl (it stays straight).
    function slide(s, dt, sweeping) {
      var sp = Math.hypot(s.vx, s.vy);
      if (sp < 6) { s.vx = 0; s.vy = 0; return false; }
      var dec = sweeping ? 62 : 110;
      s.vx -= (s.vx / sp) * dec * dt;
      s.vy -= (s.vy / sp) * dec * dt;
      var curl = 55 * U.clamp(1 - sp / 200, 0, 1) * (sweeping ? .28 : 1);
      s.vx += s.handle * curl * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      return true;
    }

    // Where would a stone thrown on this line with this weight come to rest,
    // if the sheet were empty? Used by the AI to pick a line.
    function predict(aimX, v, handle) {
      var s = {
        x: CX, y: HACK, handle: handle,
        vx: (aimX - CX) / (HACK - TEE) * v, vy: -v
      };
      for (var i = 0; i < 900; i++) {
        if (!slide(s, 1 / 60, false)) break;
        if (s.y < BACK - 30) break;
      }
      return s;
    }

    function bounce(a, b) {
      var dx = b.x - a.x, dy = b.y - a.y;
      var dd = Math.hypot(dx, dy) || .001;
      if (dd >= R * 2) return false;
      var nx = dx / dd, ny = dy / dd;
      var overlap = R * 2 - dd;
      a.x -= nx * overlap / 2; a.y -= ny * overlap / 2;
      b.x += nx * overlap / 2; b.y += ny * overlap / 2;
      var rvx = b.vx - a.vx, rvy = b.vy - a.vy;
      var sep = rvx * nx + rvy * ny;
      if (sep > 0) return false;
      var imp = -1.9 * sep / 2;
      a.vx -= imp * nx; a.vy -= imp * ny;
      b.vx += imp * nx; b.vy += imp * ny;
      return true;
    }

    function distToButton(s) { return Math.hypot(s.x - CX, s.y - TEE); }

    /* -------------------------------------------------------------- state */

    function teamFor(d, i) {
      var first = d.hammer === 'you' ? 'cpu' : 'you';
      return (i % 2 === 0) ? first : d.hammer;
    }

    function reset(g) {
      var d = g.data;
      d.end = 1;
      d.you = 0; d.cpu = 0;
      d.card = [];
      d.hammer = 'cpu';
      startEnd(g);
      g.set('End', '1/' + ENDS);
      g.set('You', 0);
      g.set('Rink', 0);
    }

    function startEnd(g) {
      var d = g.data;
      d.stones = [];
      d.thrown = 0;
      d.live = null;
      d.flash = 0;
      d.tap = false;
      d.sweep = 3.2;
      nextStone(g);
    }

    function nextStone(g) {
      var d = g.data;
      d.turn = teamFor(d, d.thrown);
      d.aim = CX; d.aimDir = 1;
      d.handle = 1;
      d.weight = 0; d.wDir = 1;
      d.sweep = 3.2;
      if (d.turn === 'you') {
        d.phase = 'line';
        d.msg = 'Pick your line — ←/→ sets the handle, Space locks';
      } else {
        d.phase = 'cpu';
        d.phaseT = .65;
        d.msg = 'Rink Blue steps into the hack…';
      }
    }

    function throwStone(g, team, aimX, v, handle) {
      var d = g.data;
      var s = {
        x: CX, y: HACK, team: team, handle: handle,
        vx: (aimX - CX) / (HACK - TEE) * v, vy: -v
      };
      d.stones.push(s);
      d.live = s;
      d.phase = 'slide';
      d.msg = team === 'you' ? 'Hold Space to sweep!' : 'Blue is away…';
      Milo.sound.tone({ f: 150, f2: 96, d: .28, v: .07, type: 'sawtooth' });
    }

    // The AI draws to the button unless one of your stones is sitting pretty,
    // in which case it goes for the takeout. Its line error shrinks each end.
    function cpuThrow(g) {
      var d = g.data;
      var err = Math.max(13, 48 - d.end * 5);
      var mine = null;
      for (var i = 0; i < d.stones.length; i++) {
        var s = d.stones[i];
        if (s.team !== 'you') continue;
        if (distToButton(s) > HOUSE) continue;
        if (!mine || distToButton(s) < distToButton(mine)) mine = s;
      }
      var tx = CX, ty = TEE, v = 310, handle = Math.random() < .5 ? 1 : -1;
      if (mine && distToButton(mine) < 70 && Math.random() < .55 + d.end * .05) {
        tx = mine.x; ty = mine.y; v = 410;              // takeout weight
      } else if (d.thrown < 2 && Math.random() < .4) {
        tx = CX + U.rand(-30, 30); ty = HOG + 40; v = 248;   // guard
      }
      // Search a line that brings the stone to rest on the target.
      var bestAim = CX, bestErr = 1e9;
      for (var a = -170; a <= 170; a += 10) {
        var p = predict(CX + a, v, handle);
        var e = Math.hypot(p.x - tx, p.y - ty);
        if (e < bestErr) { bestErr = e; bestAim = CX + a; }
      }
      throwStone(g, 'cpu', bestAim + U.rand(-err, err), v * U.rand(.96, 1.04), handle);
    }

    /* ----------------------------------------------------------- end score */

    function scoreEnd(g) {
      var d = g.data;
      // Stones that never reached the house or ran through it are off the sheet.
      d.stones = d.stones.filter(function (s) {
        return s.y < HOG && s.y > BACK && s.x > ICE_L + R && s.x < ICE_R - R;
      });
      var inHouse = d.stones.filter(function (s) { return distToButton(s) <= HOUSE + R; })
        .sort(function (a, b) { return distToButton(a) - distToButton(b); });
      var pts = 0, who = null;
      if (inHouse.length) {
        who = inHouse[0].team;
        for (var i = 0; i < inHouse.length && inHouse[i].team === who; i++) pts++;
      }
      var row = { you: 0, cpu: 0 };
      if (who === 'you') { d.you += pts; row.you = pts; }
      else if (who === 'cpu') { d.cpu += pts; row.cpu = pts; }
      d.card.push(row);
      g.set('You', d.you);
      g.set('Rink', d.cpu);
      g.score = d.you * 140 + Math.max(0, d.you - d.cpu) * 90;

      if (who) d.hammer = who === 'you' ? 'cpu' : 'you';   // scorer loses hammer
      d.msg = !who ? 'Blank end — you keep the hammer.'
        : who === 'you' ? 'You score ' + pts + '!' : 'Blue steals ' + pts + '.';
      if (who === 'you') Milo.sound.coin(); else if (who === 'cpu') Milo.sound.hit();
      else Milo.sound.click();
      d.phase = 'endscore';
      d.phaseT = 1.9;
    }

    function finish(g) {
      var d = g.data;
      var sc = d.you * 140 + Math.max(0, d.you - d.cpu) * 90 + (d.you > d.cpu ? 400 : 0);
      g.score = sc;
      var line = 'Final: ' + d.you + '–' + d.cpu + ' after ' + ENDS + ' ends.';
      if (d.you > d.cpu) g.win({ emo: '🥌', title: 'You take the game', text: line, score: sc });
      else if (d.you === d.cpu) g.gameOver({ emo: '🥌', title: 'Tied ' + d.you + '–' + d.cpu, text: line, score: sc });
      else g.gameOver({ emo: '🥌', title: 'Blue takes it', text: line, score: sc });
    }

    /* --------------------------------------------------------------- draw */

    function drawStone(c, s, live) {
      c.save();
      c.fillStyle = 'rgba(0,0,0,.22)';
      c.beginPath(); c.arc(s.x + 2, s.y + 3, R, 0, 7); c.fill();
      var grad = c.createRadialGradient(s.x - 4, s.y - 5, 2, s.x, s.y, R);
      grad.addColorStop(0, '#8b93a3'); grad.addColorStop(1, '#3f4654');
      c.fillStyle = grad;
      c.beginPath(); c.arc(s.x, s.y, R, 0, 7); c.fill();
      c.fillStyle = s.team === 'you' ? '#ef4444' : '#3b82f6';
      c.beginPath(); c.arc(s.x, s.y, R * .52, 0, 7); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1.5;
      c.beginPath(); c.arc(s.x, s.y, R * .52, 0, 7); c.stroke();
      if (live) {
        c.strokeStyle = 'rgba(253,224,71,.9)'; c.lineWidth = 2;
        c.beginPath(); c.arc(s.x, s.y, R + 5, 0, 7); c.stroke();
      }
      c.restore();
    }

    return Milo.arcade(host, {
      id: 'curling',
      w: W, h: H, bg: '#0e1626',
      stats: ['End', 'You', 'Rink'],
      emo: '🥌',
      touchButtons: [
        { key: 'left', label: '◀ IN' }, { key: 'right', label: 'OUT ▶' },
        { key: 'action', label: 'THROW / SWEEP' }
      ],
      start: {
        title: 'Curling',
        text: 'Three presses to every stone: ←/→ chooses the handle, Space locks the ' +
          'line as the broom swings across, Space again stops the weight bar. Then hold ' +
          'Space to sweep — sweeping runs the stone further and takes the curl out of it. ' +
          'Six ends against Rink Blue, who reads the house better every end.',
        keys: ['← →  handle', 'Space  lock / sweep']
      },
      init: reset,

      onPointer: function (g, type) { if (type === 'down') g.data.tap = true; },

      update: function (g, dt) {
        var d = g.data, k = g.input;
        var tap = k.pressed('action') || d.tap;
        d.tap = false;
        if (d.flash > 0) d.flash -= dt;

        if (d.phase === 'line') {
          if (k.pressed('left')) { d.handle = -1; Milo.sound.click(); }
          if (k.pressed('right')) { d.handle = 1; Milo.sound.click(); }
          d.aim += d.aimDir * 300 * dt;
          if (d.aim > CX + 165) { d.aim = CX + 165; d.aimDir = -1; }
          if (d.aim < CX - 165) { d.aim = CX - 165; d.aimDir = 1; }
          if (tap) {
            d.phase = 'weight';
            d.msg = 'Now the weight — Space at the line you want';
            Milo.sound.blip();
          }
          return;
        }

        if (d.phase === 'weight') {
          d.weight += d.wDir * 1.25 * dt;
          if (d.weight > 1) { d.weight = 1; d.wDir = -1; }
          if (d.weight < 0) { d.weight = 0; d.wDir = 1; }
          if (tap) throwStone(g, 'you', d.aim, U.lerp(230, 420, d.weight), d.handle);
          return;
        }

        if (d.phase === 'cpu') {
          d.phaseT -= dt;
          if (d.phaseT <= 0) cpuThrow(g);
          return;
        }

        if (d.phase === 'slide') {
          var sweeping = false;
          if (d.live && d.live.team === 'you' && k.down('action') && d.sweep > 0 &&
            Math.hypot(d.live.vx, d.live.vy) > 6) {
            sweeping = true;
            d.sweep -= dt;
            if (d.sweep < 0) d.sweep = 0;
            if (g.frame % 7 === 0) Milo.sound.tone({ f: 900 + Math.random() * 300, d: .04, v: .035, type: 'triangle' });
          }
          var moving = false, i, j, sub;
          // Sub-stepped so a fast takeout cannot pass through a guard.
          for (sub = 0; sub < 3; sub++) {
            for (i = 0; i < d.stones.length; i++) {
              var s = d.stones[i];
              if (slide(s, dt / 3, sweeping && s === d.live)) moving = true;
              s.x = U.clamp(s.x, ICE_L - 40, ICE_R + 40);
            }
          }
          for (i = 0; i < d.stones.length; i++) {
            for (j = i + 1; j < d.stones.length; j++) {
              if (bounce(d.stones[i], d.stones[j])) {
                Milo.sound.tone({ f: 520, f2: 220, d: .09, v: .1, type: 'square' });
                d.flash = .2;
              }
            }
          }
          if (!moving) {
            // Clear anything that finished short, long or off the sheet.
            d.stones = d.stones.filter(function (st) {
              return st.y < HOG + 2 && st.y > BACK && st.x > ICE_L + R && st.x < ICE_R - R;
            });
            d.live = null;
            d.thrown++;
            if (d.thrown >= 8) scoreEnd(g);
            else nextStone(g);
          }
          return;
        }

        if (d.phase === 'endscore') {
          d.phaseT -= dt;
          if (d.phaseT <= 0) {
            if (d.end >= ENDS) { finish(g); return; }
            d.end++;
            g.set('End', d.end + '/' + ENDS);
            startEnd(g);
          }
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, i;

        // sheet
        var ice = c.createLinearGradient(0, 0, 0, H);
        ice.addColorStop(0, '#eaf4fb'); ice.addColorStop(1, '#c9dcec');
        c.fillStyle = ice;
        c.fillRect(ICE_L, 20, ICE_R - ICE_L, H - 20);

        // house rings
        var rings = [[HOUSE, '#2f6fd0'], [66, '#f4f8fc'], [34, '#d63a3a'], [13, '#f4f8fc']];
        for (i = 0; i < rings.length; i++) {
          c.fillStyle = rings[i][1];
          c.beginPath(); c.arc(CX, TEE, rings[i][0], 0, 7); c.fill();
        }
        c.strokeStyle = 'rgba(30,50,80,.35)'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(CX, 20); c.lineTo(CX, H); c.stroke();
        c.beginPath(); c.moveTo(ICE_L, TEE); c.lineTo(ICE_R, TEE); c.stroke();
        c.strokeStyle = 'rgba(200,40,40,.55)'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(ICE_L, HOG); c.lineTo(ICE_R, HOG); c.stroke();
        c.beginPath(); c.moveTo(ICE_L, BACK); c.lineTo(ICE_R, BACK); c.stroke();
        c.fillStyle = 'rgba(30,60,100,.45)';
        c.font = '600 11px Outfit, sans-serif'; c.textAlign = 'left';
        c.fillText('HOG LINE', ICE_L + 8, HOG - 7);
        c.fillText('BACK LINE', ICE_L + 8, BACK - 7);

        // hack
        c.fillStyle = '#6b7280';
        U.roundRect(c, CX - 16, HACK + 6, 32, 14, 4); c.fill();

        // aiming line
        if (d.phase === 'line' || d.phase === 'weight') {
          c.strokeStyle = 'rgba(20,40,70,.35)';
          c.setLineDash([6, 8]); c.lineWidth = 2;
          c.beginPath(); c.moveTo(CX, HACK); c.lineTo(d.aim, TEE); c.stroke();
          c.setLineDash([]);
          c.fillStyle = '#f59e0b';
          c.beginPath();
          c.moveTo(d.aim, TEE - 24); c.lineTo(d.aim - 9, TEE - 42); c.lineTo(d.aim + 9, TEE - 42);
          c.closePath(); c.fill();
          // handle arrow
          c.strokeStyle = '#111827'; c.lineWidth = 3;
          c.beginPath();
          c.arc(CX, HACK - 34, 18, d.handle > 0 ? -.4 : Math.PI + .4, d.handle > 0 ? Math.PI - .4 : -.4 + Math.PI * 2, d.handle < 0);
          c.stroke();
          c.fillStyle = '#111827';
          c.font = '700 12px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText(d.handle > 0 ? 'OUT-TURN ▶' : '◀ IN-TURN', CX, HACK - 60);
        }

        // stones
        for (i = 0; i < d.stones.length; i++) drawStone(c, d.stones[i], d.stones[i] === d.live);

        if (d.flash > 0) {
          c.fillStyle = 'rgba(255,255,255,' + (d.flash * .9) + ')';
          c.fillRect(ICE_L, 20, ICE_R - ICE_L, H - 20);
        }

        // weight bar
        if (d.phase === 'weight') {
          var bx = ICE_R + 14, by = 180, bh = 300;
          c.fillStyle = 'rgba(255,255,255,.12)';
          U.roundRect(c, bx, by, 22, bh, 8); c.fill();
          var zones = [[0, .24, '#38bdf8', 'GUARD'], [.24, .55, '#34d399', 'DRAW'], [.55, 1, '#fb7185', 'TAKE']];
          for (i = 0; i < zones.length; i++) {
            c.fillStyle = zones[i][2];
            c.globalAlpha = .45;
            c.fillRect(bx, by + bh - zones[i][1] * bh, 22, (zones[i][1] - zones[i][0]) * bh);
            c.globalAlpha = 1;
          }
          c.fillStyle = '#fff';
          c.fillRect(bx - 5, by + bh - d.weight * bh - 2, 32, 4);
        }

        // sweep meter
        if (d.phase === 'slide' && d.live && d.live.team === 'you') {
          c.fillStyle = 'rgba(0,0,0,.35)';
          U.roundRect(c, 24, H - 84, 190, 16, 8); c.fill();
          c.fillStyle = d.sweep > .8 ? '#facc15' : '#f97316';
          U.roundRect(c, 26, H - 82, 186 * (d.sweep / 3.2), 12, 6); c.fill();
          c.fillStyle = '#e2e8f0';
          c.font = '700 12px Outfit, sans-serif'; c.textAlign = 'left';
          c.fillText('SWEEP', 24, H - 92);
        }

        // scoreboard strip
        c.fillStyle = 'rgba(8,14,26,.82)';
        U.roundRect(c, 12, 62, 126, 116, 10); c.fill();
        c.fillStyle = '#f8fafc';
        c.font = '800 14px Outfit, sans-serif'; c.textAlign = 'left';
        c.fillText('END ' + d.end + ' / ' + ENDS, 24, 84);
        c.font = '700 13px Outfit, sans-serif';
        c.fillStyle = '#ef4444'; c.fillText('You  ' + d.you, 24, 108);
        c.fillStyle = '#3b82f6'; c.fillText('Blue ' + d.cpu, 24, 128);
        c.fillStyle = 'rgba(226,232,240,.75)';
        c.font = '600 11px Outfit, sans-serif';
        c.fillText('Hammer: ' + (d.hammer === 'you' ? 'you' : 'Blue'), 24, 148);
        var left = 8 - d.thrown;
        for (i = 0; i < 8; i++) {
          var mineStone = teamFor(d, i) === 'you';
          c.fillStyle = i < d.thrown ? 'rgba(255,255,255,.18)'
            : (mineStone ? '#ef4444' : '#3b82f6');
          c.beginPath(); c.arc(26 + i * 13, 165, 5, 0, 7); c.fill();
        }
        void left;

        // message
        c.fillStyle = 'rgba(8,14,26,.8)';
        U.roundRect(c, W / 2 - 250, H - 44, 500, 32, 10); c.fill();
        c.fillStyle = '#f1f5f9';
        c.font = '800 17px Outfit, sans-serif'; c.textAlign = 'center';
        c.fillText(d.msg, W / 2, H - 22);
      }
    });
  }

  window.Milo.register({
    id: 'curling',
    title: 'Curling',
    emo: '🥌',
    category: 'Sports',
    tagline: 'Set the line, call the weight, sweep it home',
    description: 'Every stone takes three decisions: the handle (←/→) that decides which ' +
      'way it curls, the line locked as the broom swings across the sheet, and the weight ' +
      'stopped on a moving bar — guard, draw or takeout. Once it is away you get 3.2 ' +
      'seconds of sweeping, and holding Space both carries the stone further and straightens ' +
      'the curl out of it, which is how you rescue a heavy draw. Stones knock each other ' +
      'about, so a guard parked short of the house is worth as much as a shot stone; after ' +
      'eight stones the rink with the closest stone scores for every stone inside the ' +
      'opposition\'s best. Six ends, and Rink Blue\'s line error shrinks every end.',
    controls: ['← →  handle', 'Space  lock / sweep'],
    colors: ['#3b82f6', '#e2e8f0'],
    tags: ['curling', 'ice', 'aiming', 'vs cpu', 'winter'],
    mount: mount
  });
})();
