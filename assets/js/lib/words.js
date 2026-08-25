/* ==========================================================================
   Word lists for the word games. Kept deliberately small and common so the
   puzzles stay fair — obscure words make guessing games frustrating.
   ========================================================================== */
(function () {
  'use strict';
  var Milo = window.Milo;

  // Five-letter answers for the daily-style guessing game.
  var FIVE = ('about above actor acute admit adopt adult after again agent agree ahead ' +
    'alarm album alert alike alive allow alone along alter among anger angle angry ankle ' +
    'apart apple apply arena argue arise armor arrow aside asset audio audit avoid awake ' +
    'award aware badly baker basic basis beach beard beast began begin begun being below ' +
    'bench birth black blade blame blank blast blend blind block blood board boost booth ' +
    'bound brain brand brass brave bread break breed brick brief bring broad broke brown ' +
    'brush build built bunch burst cabin cable candy canal cargo carry carve catch cause ' +
    'chain chair chalk charm chart chase cheap check cheek cheer chess chest chief child ' +
    'chill china chose civil claim clash class clean clear clerk click cliff climb clock ' +
    'close cloth cloud coach coast could count court cover crack craft crash crazy cream ' +
    'crime crisp cross crowd crown crude cruel crush curve cycle daily dance dated dealt ' +
    'death debut delay dense depth doubt dozen draft drama drank drawn dream dress dried ' +
    'drift drill drink drive drove drown eager eagle early earth eight elbow elder elect ' +
    'empty enemy enjoy enter entry equal equip error event every exact exist extra faint ' +
    'faith false fancy fatal fault favor feast fence ferry fever field fiery fifth fifty ' +
    'fight final first flame flash fleet flesh flint float flock flood floor flour fluid ' +
    'flush focus force forge forth forty forum found frame fraud fresh front frost fruit ' +
    'fully funny giant given glass globe glory glove going grace grade grain grand grant ' +
    'grape grasp grass grave great greed green greet grief grill grind groan group grove ' +
    'grown guard guess guest guide guilt habit happy harsh haste hatch haunt heard heart ' +
    'heavy hedge hello hence hobby honey honor horse hotel house human humor hurry ideal ' +
    'image imply index inner input irony issue ivory japan jeans jelly jewel joint jolly ' +
    'judge juice knees knife knock known label labor large laser later laugh layer learn ' +
    'lease least leave legal lemon level light limit linen liver lobby local lodge logic ' +
    'loose lorry lower loyal lucky lunar lunch magic major maker maple march marsh match ' +
    'maybe mayor meant medal media mercy merit merry metal meter midst might minor minus ' +
    'mixed model moist money month moral motor mount mouse mouth movie music naked nasty ' +
    'naval nerve never newly night noble noise north noted novel nurse ocean offer often ' +
    'olive onion opera orbit order organ other ought outer owner paint panel panic paper ' +
    'party pasta patch pause peace peach pearl pedal penny phase phone photo piano piece ' +
    'pilot pinch pitch pizza place plain plane plant plate plaza plead pluck point polar ' +
    'porch pound power press price pride prime print prior prize probe proof proud prove ' +
    'pulse punch pupil purse queen query quest queue quick quiet quilt quite quota radar ' +
    'radio raise rally ranch range rapid ratio reach ready realm rebel refer reign relax ' +
    'relay reply rider ridge rifle right rigid rinse risen rival river roast robin robot ' +
    'rocky roman rough round route royal rugby ruler rumor rural sadly saint salad sauce ' +
    'scale scare scarf scene scent scope score scout scrap screw sense serve seven shade ' +
    'shaft shake shall shame shape share shark sharp sheep sheet shelf shell shift shine ' +
    'shirt shock shoot shore short shout shown sight silly since sixth sixty skill skirt ' +
    'slate sleep slice slide slope small smart smell smile smoke snack snake sneak solar ' +
    'solid solve sorry sound south space spare spark speak speed spell spend spent spice ' +
    'spike spine spite split spoke spoon sport spray squad stack staff stage stair stake ' +
    'stall stamp stand stare start state steam steel steep steer stern stick stiff still ' +
    'sting stock stole stone stood store storm story stove strap straw strip stuck study ' +
    'stuff style sugar suite sunny super surge sweat sweep sweet swept swift swing sword ' +
    'table taken tacit tally tanks taste teach teeth tempo tenth thank theme there these ' +
    'thick thief thing think third those three threw throw thumb tiger tight timer tired ' +
    'title toast today token tooth topic torch total touch tough tower toxic trace track ' +
    'trade trail train trait trash treat trend trial tribe trick tried troop truck truly ' +
    'trunk trust truth twice twist typed ultra uncle under union unite unity until upper ' +
    'upset urban usage usual valid value valve vapor vault venue video vigor villa vinyl ' +
    'viral virus visit vital vivid vocal voice voter wagon waist waste watch water weary ' +
    'weave wedge weigh weird whale wheat wheel where which while white whole whose widow ' +
    'width windy witch woman world worry worse worst worth would wound wrist write wrong ' +
    'wrote yacht yield young yours youth zebra').split(' ');

  // Mixed-length words for hangman, anagrams and word search.
  var GENERAL = ('anchor bakery balloon bicycle blanket bottle bracket bridge bucket ' +
    'butterfly cabinet camera candle canyon captain carpet castle ceiling cherry chimney ' +
    'circus clarinet compass concert cottage crayon crystal cucumber curtain diamond ' +
    'dolphin dragon drummer eagle elephant engine envelope factory feather festival ' +
    'fireplace flamingo forest fountain garage garden giraffe glacier guitar hammer ' +
    'harbour helmet hexagon holiday hospital iceberg island jacket jigsaw journey jungle ' +
    'kangaroo kettle keyboard kitchen ladder lantern lavender leopard library lighthouse ' +
    'lizard lobster magnet mammoth mansion marble market meadow message meteor mirror ' +
    'monkey mountain museum mushroom mystery necklace needle network notebook october ' +
    'octopus orchard ostrich painter palace pancake panther parrot passport peacock ' +
    'pebble pelican pencil penguin pepper picnic pigeon pillow pirate planet plastic ' +
    'pocket polar postcard pumpkin puppet puzzle pyramid rabbit raccoon rainbow rattle ' +
    'reptile rescue ribbon rocket rooster sandwich satellite scooter seagull season ' +
    'shadow shelter shoulder shovel signal silver skeleton slipper snorkel soldier ' +
    'spider spinach squirrel stadium station statue stomach stranger student subway ' +
    'sunflower sunrise sweater swimmer switch symbol tadpole tanker teapot telescope ' +
    'temple theatre thunder ticket tiger toaster tornado tortoise tractor traffic ' +
    'treasure triangle trophy trumpet tunnel turkey turtle umbrella unicorn vacuum ' +
    'valley vampire vanilla velvet village vinegar violin volcano voyage waffle walnut ' +
    'walrus wardrobe warrior weather webcam whisker whistle window winter wizard wonder ' +
    'wooden yoghurt zeppelin zigzag').split(' ');

  // A mistyped entry would break the guessing game rather than just look odd,
  // so the list is filtered to exactly five letters on load.
  var FIVE5 = FIVE.filter(function (w) { return w.length === 5; });

  Milo.words = {
    five: FIVE5,
    general: GENERAL,
    /** Fast membership test for guess validation. */
    fiveSet: (function () {
      var s = Object.create(null);
      FIVE5.forEach(function (w) { s[w] = true; });
      return s;
    })(),
    randomFive: function () { return Milo.util.choice(FIVE5); },
    randomGeneral: function (minLen, maxLen) {
      var pool = GENERAL.filter(function (w) {
        return w.length >= (minLen || 0) && w.length <= (maxLen || 99);
      });
      return Milo.util.choice(pool.length ? pool : GENERAL);
    }
  };
})();
