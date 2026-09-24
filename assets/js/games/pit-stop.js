/* Pit Stop — you are the crew. The race does not wait for you. */
(function () {
  'use strict';
  var W = 900, H = 600, TAU = Math.PI * 2;
  var RACE_LAPS = 20;
  var PITLANE = 5.4;            // seconds lost in the pit lane, on top of the stop
  var TANK = 21, START_FUEL = 11;

  var FIELD = [
    { name: 'YOU', col: '#ff4f79', pace: 9.05, stops: null },
    { name: 'Harrow', col: '#60a5fa', pace: 8.98, stops: [8, 15] },
    { name: 'Diaz', col: '#4ade80', pace: 9.12, stops: [11] },
    { name: 'Okafor', col: '#fbbf24', pace: 9.02, stops: [7, 14] },
    { name: 'Lindqvist', col: '#a78bfa', pace: 9.2, stops: [10] },
    { name: 'Bertoli', col: '#f472b6', pace: 9.14, stops: [9, 16] }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function lapTime(car) {
      var deg = car.tyre <= 10 ? car.tyre * 0.11 : 1.1 + (car.tyre - 10) * 0.46;
      return car.pace + deg + car.fuel * 0.055 + (Math.random() - .5) * 0.1;
    }

    function reset(g) {
      var d = g.data;
      d.cars = FIELD.map(function (f, i) {
        return {
          name: f.name, col: f.col, pace: f.pace, plan: f.stops,
          lap: 0, prog: (5 - i) * 0.012, tyre: 0, fuel: START_FUEL,
          time: 0, pitting: 0, done: false, finishT: 0, out: false, me: i === 0
        };
      });
      d.me = d.cars[0];
      d.phase = 'race';
      d.clock = 0;
      d.pitCall = false;
      d.stops = [];
      d.stopT = 0;
      d.seq = 0;
      d.bar = 0;
      d.barDir = 1;
      d.holding = false;
      d.wheel = 0;
      d.fuelTake = 0;
      d.penalty = 0;
      d.pitTraffic = 0;
      d.msg = '';
      d.msgT = 0;
      d.flash = 0;
      g.set('Lap', '1/' + RACE_LAPS);
      g.set('Pos', '1st');
      g.set('Tyres', '100%');
      g.set('Fuel', START_FUEL + ' laps');
    }

    function ord(n) { return n + (['st', 'nd', 'rd'][n - 1] || 'th'); }
    function order(d) {
      return d.cars.slice().sort(function (a, b) {
        if (a.out !== b.out) return a.out ? 1 : -1;
        if (a.done !== b.done) return a.done ? -1 : 1;
        if (a.done && b.done) return a.finishT - b.finishT;
        return (b.lap + b.prog) - (a.lap + a.prog);
      });
    }
    function pos(d, car) { return order(d).indexOf(car) + 1; }

    function scoreOf(d) {
      var p = pos(d, d.me);
      var sp = 0;
      for (var i = 0; i < d.stops.length; i++) sp += Math.max(0, Math.round((8 - d.stops[i]) * 2500));
      return Math.max(0, (FIELD.length - p) * 25000 + sp);
    }

    function say(d, t) { d.msg = t; d.msgT = 2.2; }

    function startStop(g) {
      var d = g.data;
      d.phase = 'pit';
      d.seq = 0;
      d.stopT = 0;
      d.bar = 0; d.barDir = 1;
      d.wheel = 0;
      d.fuelTake = 0;
      d.penalty = 0;
      d.holding = false;
      d.pitTraffic = U.rand(2.2, 4.4);
      d.me.pitting = 1;
      Milo.sound.tone({ f: 300, f2: 420, d: .2, v: .1, type: 'square' });
    }

    function endStop(g) {
      var d = g.data;
      var total = d.stopT + d.penalty;
      d.stops.push(total);
      d.me.tyre = 0;
      d.me.fuel = Math.min(TANK, d.me.fuel + d.fuelTake);
      d.me.pitting = PITLANE;
      d.phase = 'race';
      say(d, 'Stop: ' + total.toFixed(2) + 's' + (d.penalty ? ' (+' + d.penalty.toFixed(1) + 's penalty)' : '') +
        ' · ' + Math.round(d.fuelTake) + ' laps of fuel in');
      if (total < 3.2) Milo.sound.win(); else Milo.sound.blip();
    }

    /* ------------------------------------------------------------ input */

    function act(g) {
      var d = g.data;
      if (d.phase === 'race') {
        if (!d.pitCall && !d.me.done && d.me.pitting <= 0) {
          d.pitCall = true;
          say(d, 'Box this lap — crew to the wall');
          Milo.sound.blip();
        }
        return;
      }
      if (d.phase !== 'pit') return;
      if (d.seq === 0) {                       // jack
        var off = Math.abs(d.bar - 0.5);
        if (off < 0.11) { good(g, 'Jack up — clean'); d.seq = 1; d.bar = 0; }
        else { bad(g, 0.7, 'Jack slipped'); d.bar = 0; d.barDir = 1; }
      } else if (d.seq === 6) {                // release
        if (d.pitTraffic > 0.45) {
          d.penalty += 5;
          bad(g, 0, 'UNSAFE RELEASE — 5s penalty');
          endStop(g);
        } else {
          good(g, 'Away clean!');
          endStop(g);
        }
      }
    }

    function good(g, txt) {
      say(g.data, txt);
      Milo.sound.tone({ f: 760, f2: 980, d: .07, v: .08, type: 'square' });
      g.data.flash = .25;
    }
    function bad(g, cost, txt) {
      var d = g.data;
      d.penalty += cost;
      say(d, txt);
      Milo.sound.hit();
    }

    return Milo.arcade(host, {
      id: 'pit-stop',
      w: W, h: H, bg: '#0a0d18',
      stats: ['Lap', 'Pos', 'Tyres', 'Fuel'],
      touchButtons: [{ key: 'action', label: 'GO' }],
      emo: '🔧',
      start: {
        title: 'Pit Stop',
        text: 'You are over the wall, not behind the wheel. Twenty laps run whether you are ' +
          'ready or not: call the car in when the tyres are gone or the tank is dry, then jack ' +
          'it, run four wheel guns, fuel it and release it — into a gap, not into traffic.',
        keys: ['Space calls the car in', 'Space for every crew action']
      },
      init: reset,

      onKey: function (g, e, name) { if (name === 'action') act(g); },
      onPointer: function (g, type) { if (type === 'down') act(g); },

      update: function (g, dt) {
        var d = g.data, i;
        if (d.msgT > 0) d.msgT -= dt;
        if (d.flash > 0) d.flash -= dt;

        /* ---- the race runs in both phases ---- */
        d.clock += dt;
        for (i = 0; i < d.cars.length; i++) {
          var car = d.cars[i];
          if (car.done || car.out) continue;
          if (car.me && d.phase === 'pit') continue;       // frozen in the box
          if (car.pitting > 0) { car.pitting -= dt; continue; }
          var lt = lapTime(car);
          car.prog += dt / lt;
          if (car.prog >= 1) {
            car.prog -= 1;
            car.lap++;
            car.tyre++;
            car.fuel--;
            if (car.lap >= RACE_LAPS) {
              car.done = true;
              car.finishT = d.clock;
              if (car.me) { finishRace(g); return; }
            } else {
              if (car.me && d.pitCall) {          // the stop refuels, so it comes first
                d.pitCall = false;
                startStop(g);
                return;
              }
              if (!car.me && car.plan && car.plan.indexOf(car.lap) >= 0) {
                car.pitting = PITLANE + U.rand(2.4, 3.6);
                car.tyre = 0;
                car.fuel = Math.min(TANK, RACE_LAPS - car.lap + 2);
              }
              if (car.fuel <= 0 && car.pitting <= 0) {
                car.out = true;
                if (car.me) {
                  g.gameOver({
                    emo: '⛽', title: 'Out of fuel',
                    text: 'The car coasted to a stop on lap ' + car.lap +
                      '. Fuel is the one thing the crew can always fix — if you bring it in.',
                    score: scoreOf(d)
                  });
                  return;
                }
              }
            }
          }
        }

        /* ---- the stop ---- */
        if (d.phase === 'pit') {
          d.stopT += dt;
          d.pitTraffic -= dt;
          if (d.pitTraffic < -1.6) d.pitTraffic = U.rand(2.6, 4.6);
          var held = g.input.down('action') || g.input.pdown;

          if (d.seq === 0) {                          // jack: sweeping marker
            d.bar += d.barDir * dt * 1.35;
            if (d.bar > 1) { d.bar = 1; d.barDir = -1; }
            if (d.bar < 0) { d.bar = 0; d.barDir = 1; }
          } else if (d.seq >= 1 && d.seq <= 4) {      // four wheel guns
            if (held) {
              d.bar += dt * 0.95;
              if (g.frame % 2 === 0) Milo.sound.tone({ f: 130 + d.bar * 90, d: .04, v: .05, type: 'sawtooth' });
              if (d.bar > 1.25) {
                bad(g, 0.55, 'Cross-threaded the nut');
                d.bar = 0; d.seq++;
              }
            } else if (d.bar > 0.02) {
              if (d.bar > 0.74 && d.bar < 1.02) good(g, 'Wheel ' + d.seq + ' on');
              else bad(g, d.bar < 0.74 ? 0.65 : 0.45, d.bar < 0.74 ? 'Nut not home' : 'Over-run the gun');
              d.bar = 0;
              d.seq++;
            }
          } else if (d.seq === 5) {                   // fuel rig
            if (held) {
              d.fuelTake = Math.min(TANK - d.me.fuel, d.fuelTake + dt * 6.5);
              if (g.frame % 4 === 0) Milo.sound.tone({ f: 90, d: .05, v: .04, type: 'triangle' });
            } else if (d.fuelTake > 0.4) {
              var need = RACE_LAPS - d.me.lap;
              if (d.me.fuel + d.fuelTake < need) say(d, 'Short fuel — you will need another stop');
              else good(g, Math.round(d.fuelTake) + ' laps in');
              d.seq = 6;
            }
          }
          if (d.stopT > 26) { d.penalty += 3; endStop(g); }   // never hang forever
          return;
        }

        var me = d.me;
        g.set('Lap', Math.min(RACE_LAPS, me.lap + 1) + '/' + RACE_LAPS);
        g.set('Pos', ord(pos(d, me)));
        g.set('Tyres', Math.max(0, Math.round(100 - me.tyre * 7.5)) + '%');
        g.set('Fuel', Math.max(0, me.fuel) + ' laps');
        g.score = scoreOf(d);
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.fillStyle = '#0a0d18'; c.fillRect(0, 0, W, H);
        if (d.phase === 'pit') drawPit(g, c, d);
        else drawRace(g, c, d);
        if (d.msgT > 0) {
          c.textAlign = 'center';
          c.globalAlpha = Math.min(1, d.msgT);
          c.fillStyle = 'rgba(8,10,20,.85)';
          U.roundRect(c, W / 2 - 220, H - 54, 440, 34, 8); c.fill();
          c.fillStyle = '#ffd257'; c.font = 'bold 16px system-ui,sans-serif';
          c.fillText(d.msg, W / 2, H - 32);
          c.globalAlpha = 1;
          c.textAlign = 'left';
        }
      }
    });

    function finishRace(g) {
      var d = g.data;
      d.phase = 'done';
      var p = pos(d, d.me);
      var avg = d.stops.length
        ? (d.stops.reduce(function (a, b) { return a + b; }, 0) / d.stops.length).toFixed(2)
        : '—';
      var txt = 'Finished ' + ord(p) + ' of ' + FIELD.length + ' after ' + d.stops.length +
        ' stop' + (d.stops.length === 1 ? '' : 's') + ', averaging ' + avg + 's over the wall.';
      if (p === 1) g.win({ emo: '🏆', title: 'Won it in the pits', text: txt, score: scoreOf(d) });
      else g.gameOver({ emo: '🔧', title: ord(p) + ' place', text: txt, score: scoreOf(d) });
    }

    /* ------------------------------------------------------------ views */

    function drawRace(g, c, d) {
      var i;
      // circuit schematic
      var cx = 620, cy = 300, rx = 210, ry = 150;
      c.strokeStyle = '#242c40'; c.lineWidth = 26;
      c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, TAU); c.stroke();
      c.strokeStyle = '#141a28'; c.lineWidth = 20;
      c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, TAU); c.stroke();
      c.fillStyle = '#fff';
      c.fillRect(cx + rx - 6, cy - 12, 4, 24);
      // pit lane
      c.strokeStyle = '#2f3a52'; c.lineWidth = 8;
      c.beginPath(); c.ellipse(cx, cy, rx - 26, ry - 20, 0, -0.5, 0.9); c.stroke();
      c.fillStyle = '#7d88ad'; c.font = '11px system-ui,sans-serif';
      c.fillText('PIT LANE', cx + rx - 78, cy + ry - 46);

      var ord2 = order(d);
      for (i = d.cars.length - 1; i >= 0; i--) {
        var car = d.cars[i];
        var a = car.prog * TAU - Math.PI / 2;
        var px = cx + Math.cos(a) * (car.pitting > 0 ? rx - 26 : rx);
        var py = cy + Math.sin(a) * (car.pitting > 0 ? ry - 20 : ry);
        c.fillStyle = car.out ? '#555b70' : car.col;
        c.beginPath(); c.arc(px, py, car.me ? 9 : 7, 0, TAU); c.fill();
        if (car.me) { c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke(); }
      }

      // timing tower
      c.fillStyle = 'rgba(12,16,28,.86)';
      U.roundRect(c, 20, 96, 300, 250, 12); c.fill();
      c.fillStyle = '#9fb0d8'; c.font = 'bold 12px system-ui,sans-serif';
      c.fillText('TIMING', 36, 120);
      c.fillText('LAP ' + Math.min(RACE_LAPS, d.me.lap + 1) + ' / ' + RACE_LAPS, 236, 120);
      for (i = 0; i < ord2.length; i++) {
        var o = ord2[i], y = 142 + i * 33;
        c.fillStyle = o === d.me ? 'rgba(255,79,121,.16)' : 'rgba(255,255,255,.04)';
        U.roundRect(c, 32, y - 16, 276, 28, 6); c.fill();
        c.fillStyle = o.col;
        c.fillRect(38, y - 11, 7, 18);
        c.fillStyle = o === d.me ? '#fff' : '#c3cde6';
        c.font = (o === d.me ? 'bold ' : '') + '14px system-ui,sans-serif';
        c.fillText((i + 1) + '  ' + o.name, 54, y + 4);
        c.fillStyle = '#7d88ad'; c.font = '12px system-ui,sans-serif';
        var lapsDone = o.lap + o.prog;
        var gap = (ord2[0].lap + ord2[0].prog) - lapsDone;
        c.fillText(o.out ? 'OUT' : o.pitting > 0 ? 'IN PIT' :
          i === 0 ? 'LEADER' : '-' + (gap * 9).toFixed(1) + 's', 214, y + 4);
      }

      // car status
      c.fillStyle = 'rgba(12,16,28,.86)';
      U.roundRect(c, 20, 364, 300, 172, 12); c.fill();
      c.fillStyle = '#9fb0d8'; c.font = 'bold 12px system-ui,sans-serif';
      c.fillText('YOUR CAR', 36, 388);

      gauge(c, 36, 400, 268, 'TYRE LIFE', U.clamp(1 - d.me.tyre / 14, 0, 1),
        d.me.tyre > 11 ? '#fb7185' : d.me.tyre > 8 ? '#ffd257' : '#4ade80',
        d.me.tyre + ' laps old' + (d.me.tyre > 11 ? ' — falling off' : ''));
      gauge(c, 36, 450, 268, 'FUEL', U.clamp(d.me.fuel / TANK, 0, 1),
        d.me.fuel <= 2 ? '#fb7185' : '#22d3ee',
        Math.max(0, d.me.fuel) + ' laps in the tank, ' + Math.max(0, RACE_LAPS - d.me.lap) + ' to run');

      c.fillStyle = d.pitCall ? '#ffd257' : (d.me.pitting > 0 ? '#7d88ad' : '#4ade80');
      c.font = 'bold 16px system-ui,sans-serif';
      c.fillText(d.pitCall ? 'BOX THIS LAP — get ready'
        : d.me.pitting > 0 ? 'Rejoining the circuit…'
          : 'Press Space to call the car in', 36, 516);

      // lap-time note
      c.fillStyle = '#7d88ad'; c.font = '12px system-ui,sans-serif';
      c.fillText('Lap time now ~' + lapTimeShow(d.me) + 's  ·  fresh tyres are ~' +
        d.me.pace.toFixed(2) + 's', 360, 556);
    }

    function lapTimeShow(car) {
      var deg = car.tyre <= 10 ? car.tyre * 0.11 : 1.1 + (car.tyre - 10) * 0.46;
      return (car.pace + deg + car.fuel * 0.055).toFixed(2);
    }

    function gauge(c, x, y, w, label, t, col, sub) {
      c.fillStyle = '#7d88ad'; c.font = '11px system-ui,sans-serif';
      c.fillText(label, x, y + 10);
      c.fillStyle = 'rgba(255,255,255,.12)';
      U.roundRect(c, x, y + 16, w, 12, 6); c.fill();
      c.fillStyle = col;
      U.roundRect(c, x, y + 16, w * U.clamp(t, 0, 1), 12, 6); c.fill();
      c.fillStyle = '#c3cde6'; c.font = '12px system-ui,sans-serif';
      c.fillText(sub, x, y + 44);
    }

    function drawPit(g, c, d) {
      var i;
      c.fillStyle = '#12161f'; c.fillRect(0, 0, W, H);
      // pit box
      c.fillStyle = '#1b2130'; c.fillRect(0, 190, W, 230);
      c.strokeStyle = '#ffd257'; c.lineWidth = 4;
      c.setLineDash([16, 12]);
      c.beginPath(); c.moveTo(0, 196); c.lineTo(W, 196); c.moveTo(0, 414); c.lineTo(W, 414); c.stroke();
      c.setLineDash([]);

      // the car
      var cx = W / 2, cy = 310;
      var jacked = d.seq >= 1;
      c.save();
      c.translate(cx, cy - (jacked ? 12 : 0));
      c.fillStyle = 'rgba(0,0,0,.45)';
      U.roundRect(c, -150, 34, 300, 16, 8); c.fill();
      c.fillStyle = '#ff4f79';
      U.roundRect(c, -150, -26, 300, 56, 14); c.fill();
      c.fillStyle = '#2b3242';
      U.roundRect(c, -46, -48, 92, 30, 10); c.fill();
      c.fillStyle = '#0f1420';
      U.roundRect(c, -36, -42, 72, 18, 6); c.fill();
      c.fillStyle = '#ffd257';
      c.fillRect(132, -14, 16, 12);
      // wheels: the ones already done are fresh
      for (i = 0; i < 4; i++) {
        var wx = (i % 2 ? 1 : -1) * 108;
        var wy = (i < 2 ? -1 : 1) * 40;
        var done = d.seq > i + 1 || d.seq >= 5;
        c.fillStyle = done ? '#2f3a52' : '#14161f';
        c.beginPath(); c.arc(wx, wy, 22, 0, TAU); c.fill();
        c.strokeStyle = done ? '#4ade80' : '#3a4256'; c.lineWidth = 5;
        c.beginPath(); c.arc(wx, wy, 17, 0, TAU); c.stroke();
        if (d.seq === i + 1) {
          c.strokeStyle = '#ffd257'; c.lineWidth = 3;
          c.beginPath(); c.arc(wx, wy, 29, 0, TAU); c.stroke();
        }
      }
      c.restore();
      if (jacked) {
        c.fillStyle = '#9fb0d8';
        c.fillRect(cx - 170, cy + 26, 40, 10);
        c.fillRect(cx + 130, cy + 26, 40, 10);
      }

      // phase widget
      var steps = ['JACK', 'WHEEL 1', 'WHEEL 2', 'WHEEL 3', 'WHEEL 4', 'FUEL', 'RELEASE'];
      c.textAlign = 'center';
      c.fillStyle = '#fff'; c.font = 'bold 26px system-ui,sans-serif';
      c.fillText(steps[Math.min(6, d.seq)], W / 2, 130);
      c.fillStyle = '#9fb0d8'; c.font = '14px system-ui,sans-serif';
      var hint = [
        'Tap when the marker is in the green',
        'Hold to run the gun — let go inside the green band',
        'Hold to run the gun — let go inside the green band',
        'Hold to run the gun — let go inside the green band',
        'Hold to run the gun — let go inside the green band',
        'Hold to fuel. You need ' + Math.max(0, RACE_LAPS - d.me.lap - d.me.fuel) + ' more laps of it',
        'Release into a gap, not into traffic'
      ][Math.min(6, d.seq)];
      c.fillText(hint, W / 2, 156);

      // step pips
      for (i = 0; i < 7; i++) {
        c.fillStyle = i < d.seq ? '#4ade80' : i === d.seq ? '#ffd257' : 'rgba(255,255,255,.16)';
        c.beginPath(); c.arc(W / 2 - 96 + i * 32, 96, 7, 0, TAU); c.fill();
      }

      // the widget itself
      var bx = W / 2 - 200, by = 468, bw = 400;
      if (d.seq === 0) {
        c.fillStyle = 'rgba(255,255,255,.12)';
        U.roundRect(c, bx, by, bw, 26, 8); c.fill();
        c.fillStyle = '#4ade80';
        U.roundRect(c, bx + bw * 0.39, by, bw * 0.22, 26, 8); c.fill();
        c.fillStyle = '#fff';
        c.fillRect(bx + bw * d.bar - 3, by - 6, 6, 38);
      } else if (d.seq <= 4) {
        c.fillStyle = 'rgba(255,255,255,.12)';
        U.roundRect(c, bx, by, bw, 26, 8); c.fill();
        c.fillStyle = '#4ade80';
        U.roundRect(c, bx + bw * 0.74 / 1.25, by, bw * (1.02 - 0.74) / 1.25, 26, 8); c.fill();
        c.fillStyle = '#ffd257';
        U.roundRect(c, bx, by, bw * U.clamp(d.bar / 1.25, 0, 1), 26, 8); c.fill();
      } else if (d.seq === 5) {
        c.fillStyle = 'rgba(255,255,255,.12)';
        U.roundRect(c, bx, by, bw, 26, 8); c.fill();
        var need = U.clamp((RACE_LAPS - d.me.lap - d.me.fuel) / TANK, 0, 1);
        c.fillStyle = 'rgba(34,211,238,.35)';
        c.fillRect(bx + bw * need - 2, by - 8, 4, 42);
        c.fillStyle = '#22d3ee';
        U.roundRect(c, bx, by, bw * U.clamp(d.fuelTake / TANK, 0, 1), 26, 8); c.fill();
        c.fillStyle = '#9fb0d8'; c.font = '12px system-ui,sans-serif';
        c.fillText('the marker is exactly enough to reach the flag', W / 2, by + 52);
      } else {
        var clear = d.pitTraffic <= 0.45;
        c.fillStyle = clear ? '#22e07a' : '#ff3b3b';
        c.beginPath(); c.arc(W / 2, by + 13, 22, 0, TAU); c.fill();
        c.fillStyle = '#fff'; c.font = 'bold 16px system-ui,sans-serif';
        c.fillText(clear ? 'LANE CLEAR' : 'CAR COMING', W / 2, by + 60);
        if (!clear) {
          var tx = W / 2 - 300 + (4.6 - d.pitTraffic) * 150;
          c.fillStyle = '#60a5fa';
          U.roundRect(c, tx, 400, 70, 22, 6); c.fill();
        }
      }

      // stop clock
      c.fillStyle = '#fff'; c.font = 'bold 44px system-ui,sans-serif';
      c.fillText((d.stopT + d.penalty).toFixed(2) + 's', W / 2, 60);
      if (d.penalty > 0) {
        c.fillStyle = '#fb7185'; c.font = 'bold 14px system-ui,sans-serif';
        c.fillText('+' + d.penalty.toFixed(1) + 's penalties', W / 2, 78);
      }
      c.textAlign = 'left';

      if (d.flash > 0) {
        c.fillStyle = 'rgba(74,222,128,' + d.flash * .5 + ')';
        c.fillRect(0, 0, W, H);
      }
    }
  }

  window.Milo.register({
    id: 'pit-stop', title: 'Pit Stop', emo: '🔧', category: 'Racing',
    tagline: 'You are over the wall, not in the seat',
    description: 'A twenty-lap race you never drive: you are the crew, and the only laps that ' +
      'are yours are the ones spent in the box. Tyres lose about a tenth a lap and then fall off ' +
      'a cliff around lap eleven, the tank holds eleven laps to start with, and every second in ' +
      'the pit is a second the other five cars are still circulating. A stop is jack, four wheel ' +
      'guns held and released inside a narrow band, a fuel rig you must not over- or under-fill, ' +
      'and a release you only make when the lane is clear — go into traffic and it is five ' +
      'seconds. Tip: one long stop usually beats two short ones, but only if you fuel it right.',
    controls: ['Space call the car in', 'Space for every crew action'],
    colors: ['#ff4f79', '#22d3ee'],
    tags: ['pitstop', 'strategy', 'timing', 'motorsport', 'crew'],
    scoreLabel: 'pts',
    mount: mount
  });
})();
