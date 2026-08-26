/* ==========================================================================
   MiloPlay remixes
   Data-driven variants of base games: each entry is a real catalogue entry
   with its own title, description, thumbnail and high-score slot, retuned
   through `speed` (game-time multiplier) and restyled through `hue`/`sat`.
   Loaded after every base game file — see Milo.registerVariant in engine.js.
   ========================================================================== */
(function () {
  'use strict';
  var V = window.Milo.registerVariant;

  V('neon-snake', {
    id: 'neon-snake-turbo', title: 'Neon Snake Turbo', emo: '⚡',
    speed: 1.45, hue: 140,
    tagline: 'The classic snake at half-second reaction times',
    description: 'Neon Snake with the throttle wedged open: the grid is the same, the ' +
      'apples are the same, but everything moves at almost half again the pace, so a ' +
      'route you could plan in the original has to come from instinct here. Scores are ' +
      'kept on their own leaderboard — a hundred points in Turbo is worth bragging about.',
    colors: ['#052e16', '#4ade80'],
    tags: ['snake', 'turbo', 'reflex', 'remix']
  });

  V('brick-breaker', {
    id: 'brick-breaker-zen', title: 'Brick Breaker Zen', emo: '🧘',
    speed: 0.75, hue: 300,
    tagline: 'Slow-motion brick breaking for unwinding',
    description: 'Brick Breaker at three-quarter speed in a violet palette. The ball ' +
      'floats, the paddle glides, and there is time to line up every rebound properly — ' +
      'a version for playing with a cup of tea rather than white knuckles. Same bricks, ' +
      'same power-ups, its own best score.',
    colors: ['#2e1065', '#e879f9'],
    tags: ['breakout', 'zen', 'relaxing', 'remix']
  });
})();
