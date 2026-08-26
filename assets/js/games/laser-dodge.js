/* Laser Dodge — survive a room that fills with telegraphed beams. */
(function () {
  'use strict';
  var W = 780, H = 620, PAD = 28;
  var PR = 11, SPEED = 300;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.x = W / 2; d.y = H / 2;
      d.vx = 0; d.vy = 0;
      d.beams = [];
      d.orbs = [];
      d.parts = [];
      d.time = 0;
      d.spawn = 1.4;
      d.wave = 1;
      d.dash = 0;
      d.dashCool = 0;
      d.grazed = 0;
      d.shield = 0;
      d.over = false;
      d.trail = [];
      g.set('Time', '0:00');
      g.set('Wave', 1);
      g.set('Score', 0);
      g.set('Best', g.best ? U.fmt(g.best) : '—');
    }

    /**
     * A beam is a line segment with a warm-up. During warm-up it is a thin sight line
     * you can cross freely; once it fires the full width is lethal for a moment.
     */
    function addBeam(d, kind) {
      var b = { kind: kind, warn: U.rand(.85, 1.25), fire: .42, life: 0, w: 20, hit: false };
      if (kind === 'h') {
        b.y = U.rand(PAD + 30, H - PAD - 30);
        b.x1 = 0; b.x2 = W; b.y1 = b.y; b.y2 = b.y;
      } else if (kind === 'v') {
        b.x = U.rand(PAD + 30, W - PAD - 30);
        b.x1 = b.x; b.x2 = b.x; b.y1 = 0; b.y2 = H;
      } else {
        // A sweeping beam pivots from a wall anchor, so standing still never works.
        var edge = U.randInt(0, 3);
        var ax = edge === 0 ? 0 : edge === 1 ? W : U.rand(0, W);
        var ay = edge === 2 ? 0 : edge === 3 ? H : U.rand(0, H);
        b.ax = ax; b.ay = ay;
        b.a = Math.atan2(H / 2 - ay, W / 2 - ax) + U.rand(-.7, .7);
        b.spin = U.rand(-.9, .9);
        b.warn = U.rand(1.0, 1.4);
        b.fire = .8;
        b.w = 22;
      }
      d.beams.push(b);
    }

    function beamEnds(b) {
      if (b.kind === 'sweep') {
        var len = Math.hypot(W, H) * 1.2;
        return { x1: b.ax, y1: b.ay, x2: b.ax + Math.cos(b.a) * len, y2: b.ay + Math.sin(b.a) * len };
      }
      return { x1: b.x1, y1: b.y1, x2: b.x2, y2: b.y2 };
    }

    function distToSeg(px, py, x1, y1, x2, y2) {
      var dx = x2 - x1, dy = y2 - y1;
      var len2 = dx * dx + dy * dy;
      var t = len2 ? U.clamp(((px - x1) * dx + (py - y1) * dy) / len2, 0, 1) : 0;
      return U.dist(px, py, x1 + dx * t, y1 + dy * t);
    }

    function burst(d, x, y, color, n) {
      for (var i = 0; i < n; i++) {
        var a = U.rand(0, Math.PI * 2), s = U.rand(60, 240);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(.3, .7), c: color });
      }
    }

    return Milo.arcade(host, {
      id: 'laser-dodge',
      w: W, h: H, bg: '#0c0d1a',
      stats: ['Score', 'Time', 'Wave', 'Best'],
      emo: '⚡',
      trackBest: true,
      touch: 'dpad+a',
      start: {
        title: 'Laser Dodge',
        text: 'Beams charge for about a second before they fire — the thin line shows exactly ' +
          'where. Slip through the gaps, grab the orbs, and use your dash when a wall of light closes in.',
        keys: ['Arrows / WASD to move', 'Space to dash through a beam unharmed']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, input = g.input;
        var i;

        for (i = d.parts.length - 1; i >= 0; i--) {
          var pt = d.parts[i];
          pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vx *= .94; pt.vy *= .94; pt.life -= dt;
          if (pt.life <= 0) d.parts.splice(i, 1);
        }
        if (d.over) return;

        d.time += dt;
        g.set('Time', U.time(d.time));

        // --- movement ---------------------------------------------------------
        var ax = 0, ay = 0;
        if (input.down('left')) ax -= 1;
        if (input.down('right')) ax += 1;
        if (input.down('up')) ay -= 1;
        if (input.down('down')) ay += 1;
        var m = Math.hypot(ax, ay);
        if (m) { ax /= m; ay /= m; }

        d.dashCool = Math.max(0, d.dashCool - dt);
        if ((input.pressed('action') || input.pressed('a')) && d.dashCool <= 0 && m) {
          d.dash = .22;
          d.dashCool = 1.5;
          d.dashDir = { x: ax, y: ay };
          Milo.sound.tone({ f: 620, d: .1, v: .05, type: 'sawtooth' });
        }

        if (d.dash > 0) {
          d.dash -= dt;
          d.x += d.dashDir.x * SPEED * 2.9 * dt;
          d.y += d.dashDir.y * SPEED * 2.9 * dt;
        } else {
          d.x += ax * SPEED * dt;
          d.y += ay * SPEED * dt;
        }
        d.x = U.clamp(d.x, PAD + PR, W - PAD - PR);
        d.y = U.clamp(d.y, PAD + PR, H - PAD - PR);

        d.trail.push({ x: d.x, y: d.y, life: .3 });
        for (i = d.trail.length - 1; i >= 0; i--) {
          d.trail[i].life -= dt;
          if (d.trail[i].life <= 0) d.trail.splice(i, 1);
        }

        // --- spawning ---------------------------------------------------------
        d.spawn -= dt;
        if (d.spawn <= 0) {
          // The room gets busier over time, and sweeps only join once you've settled in.
          var rate = Math.max(.32, 1.4 - d.time * .022);
          d.spawn = rate;
          var kinds = d.time > 20 ? ['h', 'v', 'sweep'] : d.time > 8 ? ['h', 'v', 'v', 'sweep'] : ['h', 'v'];
          addBeam(d, U.choice(kinds));
          if (d.time > 12 && Math.random() < .35) addBeam(d, U.choice(kinds));
          var wave = 1 + Math.floor(d.time / 15);
          if (wave !== d.wave) { d.wave = wave; g.set('Wave', wave); Milo.sound.powerup(); }
        }

        if (d.orbs.length < 3 && Math.random() < dt * 1.1) {
          d.orbs.push({ x: U.rand(PAD + 40, W - PAD - 40), y: U.rand(PAD + 40, H - PAD - 40), t: 0 });
        }

        // --- beams ------------------------------------------------------------
        for (i = d.beams.length - 1; i >= 0; i--) {
          var b = d.beams[i];
          b.life += dt;
          if (b.kind === 'sweep' && b.life > b.warn * .35) b.a += b.spin * dt;

          if (b.life > b.warn && b.life < b.warn + b.fire) {
            if (!b.fired) {
              b.fired = true;
              Milo.sound.tone({ f: 140, d: .12, v: .05, type: 'sawtooth' });
            }
            var e = beamEnds(b);
            var near = distToSeg(d.x, d.y, e.x1, e.y1, e.x2, e.y2);
            if (near < b.w / 2 + PR) {
              // A dash grants brief passage; otherwise this is the end of the run.
              if (d.dash > 0 || d.shield > 0) {
                if (d.shield > 0 && d.dash <= 0) { d.shield = 0; burst(d, d.x, d.y, '#7fe3ff', 18); }
              } else if (!b.hit) {
                b.hit = true;
                d.over = true;
                burst(d, d.x, d.y, '#ff6b8a', 34);
                Milo.sound.explode();
                g.gameOver({
                  emo: '⚡', title: 'Caught in the beam',
                  text: 'Survived ' + U.time(d.time) + ' through ' + d.wave + ' wave' + (d.wave === 1 ? '' : 's') + '.',
                  score: g.score
                });
                return;
              }
            } else if (near < b.w / 2 + PR + 16 && !b.grazed) {
              // Grazing pays, which rewards cutting it fine instead of hiding in a corner.
              b.grazed = true;
              d.grazed++;
              g.score += 25;
              g.set('Score', g.score);
              Milo.sound.blip();
            }
          }

          if (b.life > b.warn + b.fire + .25) d.beams.splice(i, 1);
        }

        // --- orbs -------------------------------------------------------------
        for (i = d.orbs.length - 1; i >= 0; i--) {
          var o = d.orbs[i];
          o.t += dt;
          if (U.dist(d.x, d.y, o.x, o.y) < PR + 12) {
            d.orbs.splice(i, 1);
            g.score += 100;
            g.set('Score', g.score);
            if (d.shield <= 0 && Math.random() < .3) d.shield = 1;
            burst(d, o.x, o.y, '#8ef0a8', 12);
            Milo.sound.coin();
          } else if (o.t > 9) {
            d.orbs.splice(i, 1);
          }
        }

        // Surviving is itself worth points, so a cautious run still climbs.
        g.score += Math.round(dt * 30 * d.wave);
        g.set('Score', g.score);
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.fillStyle = '#0c0d1a'; c.fillRect(0, 0, W, H);

        // Arena floor with a faint grid to make motion readable.
        c.fillStyle = '#12142a';
        U.roundRect(c, PAD, PAD, W - PAD * 2, H - PAD * 2, 14); c.fill();
        c.save();
        U.roundRect(c, PAD, PAD, W - PAD * 2, H - PAD * 2, 14); c.clip();
        c.strokeStyle = 'rgba(255,255,255,.045)';
        c.lineWidth = 1;
        for (var x = PAD; x < W - PAD; x += 40) { c.beginPath(); c.moveTo(x, PAD); c.lineTo(x, H - PAD); c.stroke(); }
        for (var y = PAD; y < H - PAD; y += 40) { c.beginPath(); c.moveTo(PAD, y); c.lineTo(W - PAD, y); c.stroke(); }

        d.beams.forEach(function (b) {
          var e = beamEnds(b);
          if (b.life < b.warn) {
            // Warning line: thin, pulsing, and thickening as the shot approaches.
            var p = b.life / b.warn;
            c.strokeStyle = 'rgba(255,120,150,' + (.3 + p * .55) + ')';
            c.lineWidth = 1 + p * 3;
            c.setLineDash([9, 7]);
            c.beginPath(); c.moveTo(e.x1, e.y1); c.lineTo(e.x2, e.y2); c.stroke();
            c.setLineDash([]);
          } else if (b.life < b.warn + b.fire) {
            var f = 1 - (b.life - b.warn) / b.fire;
            c.strokeStyle = 'rgba(255,60,110,' + (.22 + f * .3) + ')';
            c.lineWidth = b.w + 16;
            c.beginPath(); c.moveTo(e.x1, e.y1); c.lineTo(e.x2, e.y2); c.stroke();
            c.strokeStyle = 'rgba(255,255,255,' + (.55 + f * .4) + ')';
            c.lineWidth = b.w * f * .7 + 3;
            c.beginPath(); c.moveTo(e.x1, e.y1); c.lineTo(e.x2, e.y2); c.stroke();
          }
        });

        d.orbs.forEach(function (o) {
          var fade = o.t > 7 ? (Math.sin(o.t * 14) * .5 + .5) : 1;
          c.globalAlpha = fade;
          c.fillStyle = '#8ef0a8';
          c.beginPath(); c.arc(o.x, o.y, 9 + Math.sin(o.t * 4) * 1.5, 0, Math.PI * 2); c.fill();
          c.fillStyle = 'rgba(255,255,255,.6)';
          c.beginPath(); c.arc(o.x - 3, o.y - 3, 3, 0, Math.PI * 2); c.fill();
          c.globalAlpha = 1;
        });

        d.trail.forEach(function (t) {
          c.globalAlpha = t.life * 1.4;
          c.fillStyle = '#4fd0ff';
          c.beginPath(); c.arc(t.x, t.y, PR * t.life * 2.4, 0, Math.PI * 2); c.fill();
        });
        c.globalAlpha = 1;

        if (!d.over) {
          if (d.shield > 0) {
            c.strokeStyle = 'rgba(127,227,255,.8)';
            c.lineWidth = 3;
            c.beginPath(); c.arc(d.x, d.y, PR + 7 + Math.sin(g.t * 6) * 1.5, 0, Math.PI * 2); c.stroke();
          }
          c.fillStyle = d.dash > 0 ? '#ffffff' : '#4fd0ff';
          c.beginPath(); c.arc(d.x, d.y, PR, 0, Math.PI * 2); c.fill();
          c.fillStyle = 'rgba(255,255,255,.55)';
          c.beginPath(); c.arc(d.x - 3.5, d.y - 4, 3.5, 0, Math.PI * 2); c.fill();
        }

        d.parts.forEach(function (pt) {
          c.globalAlpha = Math.max(0, pt.life * 1.6);
          c.fillStyle = pt.c;
          c.fillRect(pt.x - 2.5, pt.y - 2.5, 5, 5);
        });
        c.globalAlpha = 1;
        c.restore();

        c.strokeStyle = 'rgba(255,255,255,.14)';
        c.lineWidth = 2;
        U.roundRect(c, PAD, PAD, W - PAD * 2, H - PAD * 2, 14); c.stroke();

        // Dash cooldown, drawn where you are already looking.
        var ready = d.dashCool <= 0;
        c.fillStyle = ready ? 'rgba(127,227,255,.9)' : 'rgba(255,255,255,.22)';
        U.roundRect(c, PAD + 12, H - PAD - 22, 96 * (ready ? 1 : 1 - d.dashCool / 1.5), 8, 4); c.fill();
        c.fillStyle = 'rgba(255,255,255,.45)';
        c.font = '600 11px Outfit, sans-serif';
        c.textAlign = 'left';
        c.fillText(ready ? 'DASH READY' : 'DASH', PAD + 12, H - PAD - 28);
        if (d.grazed) {
          c.textAlign = 'right';
          c.fillStyle = 'rgba(255,200,120,.7)';
          c.fillText(d.grazed + ' close call' + (d.grazed === 1 ? '' : 's'), W - PAD - 12, H - PAD - 28);
        }
      }
    });
  }

  window.Milo.register({
    id: 'laser-dodge', title: 'Laser Dodge', emo: '⚡', category: 'Casual',
    tagline: 'Read the light, find the gap',
    description: 'A single room that keeps filling with light. Every beam warns you first with a ' +
      'thin dotted line, so the whole game is reading the next second and being somewhere else ' +
      'when it arrives. Straight beams are easy enough on their own; the sweeping ones pivot ' +
      'from the walls and turn a safe corner into a trap. You get a dash that carries you ' +
      'straight through a live beam, and passing close to one without being hit pays a bonus — ' +
      'so hiding in a corner scores far worse than cutting it fine.',
    controls: ['Arrows / WASD to move', 'Space to dash through a beam'],
    colors: ['#12142a', '#4fd0ff'],
    tags: ['reflex', 'survival', 'dodging', 'arcade'],
    mount: mount
  });
})();
