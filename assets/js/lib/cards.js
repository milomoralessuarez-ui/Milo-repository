/* ==========================================================================
   Playing-card helpers shared by the card games.
   A card is { r: 0..12 (A,2..10,J,Q,K), s: 0..3 (♠ ♥ ♦ ♣) }.
   ========================================================================== */
(function () {
  'use strict';
  var Milo = window.Milo;

  var RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  var SUITS = ['♠', '♥', '♦', '♣'];

  var Cards = Milo.cards = {
    RANKS: RANKS,
    SUITS: SUITS,

    /** A fresh ordered deck; pass a count for multi-deck games. */
    deck: function (packs) {
      var out = [];
      for (var p = 0; p < (packs || 1); p++) {
        for (var s = 0; s < 4; s++) {
          for (var r = 0; r < 13; r++) out.push({ r: r, s: s });
        }
      }
      return out;
    },

    shuffled: function (packs) { return Milo.util.shuffle(Cards.deck(packs)); },

    isRed: function (c) { return c.s === 1 || c.s === 2; },
    label: function (c) { return RANKS[c.r] + SUITS[c.s]; },

    /** Blackjack-style value; aces come back as 11 for the caller to adjust. */
    value: function (c) { return c.r === 0 ? 11 : Math.min(10, c.r + 1); },

    /**
     * Draw a card. opts: {faceUp, selected, dim, hint}
     * Sizes everything from the card width so it scales with the layout.
     */
    draw: function (ctx, card, x, y, w, h, opts) {
      opts = opts || {};
      var U = Milo.util;
      var r = Math.max(3, w * 0.09);

      ctx.save();
      if (opts.dim) ctx.globalAlpha = 0.55;

      // drop shadow
      ctx.fillStyle = 'rgba(0,0,0,.32)';
      U.roundRect(ctx, x + 1.5, y + 2.5, w, h, r);
      ctx.fill();

      if (!opts.faceUp) {
        var g = ctx.createLinearGradient(x, y, x + w, y + h);
        g.addColorStop(0, '#3b4bb8');
        g.addColorStop(1, '#232a6b');
        ctx.fillStyle = g;
        U.roundRect(ctx, x, y, w, h, r);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.28)';
        ctx.lineWidth = Math.max(1, w * 0.03);
        U.roundRect(ctx, x + w * .09, y + h * .07, w * .82, h * .86, r * .7);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.16)';
        for (var i = 0; i < 4; i++) {
          for (var j = 0; j < 6; j++) {
            ctx.beginPath();
            ctx.arc(x + w * (.22 + i * .19), y + h * (.16 + j * .14), w * .028, 0, 7);
            ctx.fill();
          }
        }
      } else {
        ctx.fillStyle = '#fdfdff';
        U.roundRect(ctx, x, y, w, h, r);
        ctx.fill();

        var col = Cards.isRed(card) ? '#d33a4b' : '#1b2040';
        var rank = RANKS[card.r], suit = SUITS[card.s];

        ctx.fillStyle = col;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.font = '800 ' + Math.round(w * 0.30) + 'px Outfit, sans-serif';
        ctx.fillText(rank, x + w * .09, y + h * .05);
        ctx.font = Math.round(w * 0.24) + 'px serif';
        ctx.fillText(suit, x + w * .09, y + h * .05 + w * .30);

        // centre pip, big enough to read at a glance in a tableau
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = Math.round(w * 0.58) + 'px serif';
        ctx.globalAlpha = (opts.dim ? .55 : 1) * .9;
        ctx.fillText(suit, x + w * .58, y + h * .66);
        ctx.globalAlpha = opts.dim ? .55 : 1;
      }

      if (opts.selected) {
        ctx.strokeStyle = '#ffd257';
        ctx.lineWidth = Math.max(2, w * 0.05);
        U.roundRect(ctx, x, y, w, h, r);
        ctx.stroke();
      } else if (opts.hint) {
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = Math.max(1.5, w * 0.035);
        U.roundRect(ctx, x, y, w, h, r);
        ctx.stroke();
      }
      ctx.restore();
    },

    /** Outline for an empty pile slot. */
    slot: function (ctx, x, y, w, h, glyph) {
      var U = Milo.util;
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,.22)';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 5]);
      U.roundRect(ctx, x, y, w, h, Math.max(3, w * 0.09));
      ctx.stroke();
      ctx.setLineDash([]);
      if (glyph) {
        ctx.fillStyle = 'rgba(255,255,255,.18)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = Math.round(w * 0.42) + 'px serif';
        ctx.fillText(glyph, x + w / 2, y + h / 2);
      }
      ctx.restore();
    }
  };
})();
