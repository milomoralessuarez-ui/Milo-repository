/* War — the whole deck, flipped one card at a time, ties go to war. */
(function () {
  'use strict';
  var W = 800, H = 520, CW = 100, CH = 140;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util, C = Milo.cards;

    function reset(g) {
      var d = g.data;
      var deck = C.shuffled();
      d.you = deck.slice(0, 26);
      d.cpu = deck.slice(26);
      d.pot = [];
      d.face = { you: null, cpu: null };
      d.msg = 'Click to flip';
      d.state = 'ready';        // ready | reveal | war | over
      d.timer = 0;
      d.rounds = 0;
      d.warDepth = 0;
      g.set('Your cards', 26);
      g.set('Rounds', 0);
      g.set('Best run', Milo.store.best('war-cards'));
    }

    function flip(g) {
      var d = g.data;
      if (d.state !== 'ready') return;
      if (!d.you.length || !d.cpu.length) return;

      d.face.you = d.you.shift();
      d.face.cpu = d.cpu.shift();
      d.pot.push(d.face.you, d.face.cpu);
      d.rounds++;
      g.set('Rounds', d.rounds);
      Milo.sound.click();

      // Ace high: rank 0 becomes the top card.
      var yr = d.face.you.r === 0 ? 13 : d.face.you.r;
      var cr = d.face.cpu.r === 0 ? 13 : d.face.cpu.r;

      if (yr > cr) {
        d.msg = 'You take ' + d.pot.length + ' cards';
        collect(d, 'you');
        Milo.sound.coin();
      } else if (cr > yr) {
        d.msg = 'Dealer takes ' + d.pot.length + ' cards';
        collect(d, 'cpu');
        Milo.sound.hit();
      } else {
        d.msg = 'WAR! Three down, one up…';
        d.state = 'war';
        d.timer = 0.9;
        d.warDepth++;
        Milo.sound.powerup();
        return;
      }
      d.state = 'reveal';
      d.timer = 0.55;
    }

    function collect(d, who) {
      // Shuffle the pot in so the game can't loop forever on a fixed order.
      U.shuffle(d.pot);
      (who === 'you' ? d.you : d.cpu).push.apply(who === 'you' ? d.you : d.cpu, d.pot);
      d.pot = [];
      d.warDepth = 0;
    }

    function resolveWar(g) {
      var d = g.data;
      // Each side buries up to three, then flips one — short-handed if needed.
      for (var i = 0; i < 3; i++) {
        if (d.you.length > 1) d.pot.push(d.you.shift());
        if (d.cpu.length > 1) d.pot.push(d.cpu.shift());
      }
      d.state = 'ready';
      flip(g);
    }

    function checkEnd(g) {
      var d = g.data;
      g.set('Your cards', d.you.length);
      if (d.you.length && d.cpu.length) return false;
      d.state = 'over';
      Milo.store.setBest('war-cards', d.rounds);
      if (d.you.length) {
        g.win({
          emo: '⚔️', title: 'You took the whole deck',
          text: 'Won in ' + d.rounds + ' rounds.',
          score: Math.max(100, 4000 - d.rounds * 4)
        });
      } else {
        g.gameOver({
          emo: '⚔️', title: 'Out of cards',
          text: 'The dealer cleaned you out after ' + d.rounds + ' rounds.',
          score: d.rounds * 10
        });
      }
      return true;
    }

    return Milo.arcade(host, {
      id: 'war-cards',
      w: W, h: H, bg: '#2b1230',
      stats: ['Your cards', 'Rounds', 'Best run'],
      emo: '⚔️',
      trackBest: false,
      start: {
        title: 'War',
        text: 'The deck is split down the middle. Both sides flip a card and the higher ' +
          'one takes the pot. Equal ranks mean war: three cards face down, one face up, ' +
          'winner takes the lot.',
        keys: ['Click or press Space to flip']
      },
      init: reset,
      onKey: function (g, e) { if (e.code === 'Space') flip(g); },
      onPointer: function (g, type) { if (type === 'down') flip(g); },

      update: function (g, dt) {
        var d = g.data;
        if (d.timer > 0) {
          d.timer -= dt;
          if (d.timer <= 0) {
            if (d.state === 'war') { resolveWar(g); return; }
            d.state = 'ready';
            if (!checkEnd(g)) d.msg = 'Click to flip';
          }
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * .7);
        bg.addColorStop(0, '#3a1740'); bg.addColorStop(1, '#170a1c');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        c.fillStyle = 'rgba(255,255,255,.55)';
        c.font = '700 13px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText('DEALER · ' + d.cpu.length, W / 2 + 170, 60);
        c.fillText('YOU · ' + d.you.length, W / 2 - 170, 60);

        // face-down stacks
        for (var i = 0; i < Math.min(6, Math.ceil(d.you.length / 5)); i++) {
          C.draw(c, { r: 0, s: 0 }, W / 2 - 210 + i * 3, H / 2 - CH / 2 + i * 2, CW * .8, CH * .8, { faceUp: false });
        }
        for (var j = 0; j < Math.min(6, Math.ceil(d.cpu.length / 5)); j++) {
          C.draw(c, { r: 0, s: 0 }, W / 2 + 130 + j * 3, H / 2 - CH / 2 + j * 2, CW * .8, CH * .8, { faceUp: false });
        }

        if (d.face.you) {
          C.draw(c, d.face.you, W / 2 - CW - 20, H / 2 - CH / 2, CW, CH, { faceUp: true });
          C.draw(c, d.face.cpu, W / 2 + 20, H / 2 - CH / 2, CW, CH, { faceUp: true });
        } else {
          C.slot(c, W / 2 - CW - 20, H / 2 - CH / 2, CW, CH, '?');
          C.slot(c, W / 2 + 20, H / 2 - CH / 2, CW, CH, '?');
        }

        if (d.pot.length > 2) {
          c.fillStyle = 'rgba(255,210,87,.85)';
          c.font = '700 14px Outfit, sans-serif';
          c.fillText(d.pot.length + ' cards in the pot', W / 2, H / 2 + CH / 2 + 34);
        }

        c.fillStyle = d.state === 'war' ? '#ffd257' : '#e8ecff';
        c.font = '800 20px Outfit, sans-serif';
        c.fillText(d.msg, W / 2, H - 40);
      }
    });
  }

  window.Milo.register({
    id: 'war-cards', title: 'War', emo: '⚔️', category: 'Cards',
    tagline: 'Highest card takes the pot',
    description: 'The simplest card game there is, and strangely hard to stop playing. ' +
      'The deck splits in two, you each flip one card, and the higher rank takes both. ' +
      'A tie means war — three cards face down and one face up each, winner takes everything ' +
      'on the table. Play until one side holds all 52.',
    controls: ['Click', 'Space'],
    colors: ['#2b1230', '#f472b6'],
    tags: ['cards', 'luck', 'quick', 'classic'],
    mount: mount
  });
})();
