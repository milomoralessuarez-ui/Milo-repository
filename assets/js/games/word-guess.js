/* Word Guess — six tries to deduce a five-letter word; every solve extends the streak. */
(function () {
  'use strict';
  var ROWS = 6, COLS = 5;
  var GUESS_PTS = [600, 450, 350, 250, 160, 100];

  // Everyday answers — the first few rounds draw only from here.
  var TIER1 = ('apple bread chair house water light music plant stone river cloud dream smile happy ' +
    'beach ocean tiger horse mouse snake sugar honey lemon grape peach pizza pasta salad ' +
    'candy juice cream toast bacon onion mango melon olive berry cocoa spice flour whale ' +
    'shark eagle robin zebra camel panda koala otter sheep goose moose bison llama crane ' +
    'heron raven stork trout squid piano flute cello banjo organ opera dance paint brush ' +
    'chalk paper ruler glass plate spoon knife table couch shelf bench stool clock watch ' +
    'phone radio movie novel story world earth space comet lunar solar storm windy rainy ' +
    'sunny frost snowy field grass money train truck plane wagon canoe yacht cabin hotel ' +
    'tower route trail track green black white brown amber ivory coral lilac seven eight ' +
    'three forty fifty sixty first third heart brain blood mouth tooth teeth thumb elbow ' +
    'ankle wrist chest nurse child adult uncle woman queen bride groom baker pilot actor ' +
    'judge clerk guard scout sleep laugh shout write think learn teach study count spell ' +
    'erase build climb throw catch drive float swing shake sweet salty spicy fresh crisp ' +
    'juicy tasty round sharp blunt rough tight loose heavy quick quiet noisy brave proud ' +
    'angry sorry silly funny jolly merry crazy weird eager bloom petal daisy tulip lotus ' +
    'maple cedar birch lunch snack feast treat bagel donut fudge pearl jewel crown sword ' +
    'armor arrow spear magic witch ghost fairy giant dwarf troll robot alien pixie beast ' +
    'party prize medal badge chess poker bingo board hobby craft sport rugby skate boxer ' +
    'coach score match final sound voice choir chord tempo lyric verse rhyme title front ' +
    'above below under inner outer north south early later today night month timer alarm ' +
    'shirt dress skirt scarf glove purse chain small large short thick curry sushi ramen ' +
    'chili gravy sauce syrup jelly scone crepe flame smoke ember spark torch blaze stove ' +
    'grill whisk ladle crate trunk vault fence floor porch stair ledge cliff coast shore ' +
    'delta creek brook marsh swamp oasis ridge slope plain stage booth kiosk stall').split(' ');

  // Trickier answers — repeated letters, rarer letters, odd shapes. Unlocked by streaks.
  var TIER2 = ('abyss fjord kayak ninja pixel quart vivid waltz zesty jazzy fuzzy dizzy fizzy gauze ' +
    'glyph lymph nymph crypt tryst myrrh psalm thyme igloo karma tango mambo bayou cameo ' +
    'ratio audio video mimic motto ninth sixth humid ethos ethic axiom adieu ounce queue ' +
    'vodka quill quirk quota quilt skunk topaz yeast yodel yummy fluff bluff gruff gaffe ' +
    'skiff whiff sniff staff stuff scuff chaff eerie geese mummy puppy kitty taffy daddy ' +
    'nanny abbey abbot affix agree allot annex apply array assay attic bobby buddy cabby ' +
    'civic comma ditto dodgy dummy eject elope embed enjoy epoch equip essay evoke exact ' +
    'exalt excel exert exile expel extra fable fancy fewer fifth filly flock foggy folly ' +
    'forgo gamma gecko giddy gnome gooey gourd guava gumbo guppy gusto hatch hefty hippo ' +
    'hunch husky icily idiom idyll inbox infer jumbo jumpy kazoo khaki knack knelt kneel ' +
    'knoll laden lapse larva latch leash lemur level libel lobby loopy lousy lucid macho ' +
    'madam mafia magma mania manor maxim mercy mirth mocha modem moody mossy motif mucus ' +
    'muddy mulch murky nacho naive nasal natal navel nerdy niche nudge nutty onset oomph ' +
    'optic outdo oxbow ozone paddy papal parka patio pause peppy perky pesky phlox picky ' +
    'piety piggy pinky pious pique pivot plumb plush polka pouch preen primp privy prong ' +
    'proxy psych pudgy puffy pupil pygmy quack quaff qualm quash quasi quell query quest ' +
    'quite quoth radii rajah rally ranch ratty rayon recur relic retro rhino rigor risky ' +
    'rowdy rumba rusty sauna savvy scuba sepia shyly skulk slyly smirk spiky squat stoic ' +
    'sulky sumac swami synod tabby taboo tacit talon tangy tarot teddy tepid tiara tibia ' +
    'tilde tipsy toddy tonic tulle tutor twang unzip usurp uvula vapid vaunt venom verve ' +
    'vigil vinyl viola viper virus vixen vouch vowel wacky weedy whack wharf whiny width ' +
    'witty woozy wrath wryly yearn yucca zippy').split(' ');

  // Valid guesses that are not answers — added to the shared five-letter list.
  var EXTRA = ('aback abase abate abbey abhor abide abled abode abort about above abuse abyss acids ' +
    'acorn acrid actor acute adage adapt adept admin admit adobe adopt adore adorn affix ' +
    'afire afoot afoul agape agate agent agile aging aglow agony agree ahead aisle alarm ' +
    'album alert algae alibi alien align alike alive allay alley allot allow alloy aloft ' +
    'alone along aloof aloud alpha altar amass amaze amber amble amend amiss amity among ' +
    'ample amply amuse angel anger angle angry angst anime ankle annex annoy annul anvil ' +
    'aorta apart aphid aping apnea apple apply apron aptly arbor ardor arena argue arise ' +
    'armor aroma arose array arrow arson artsy ascot ashen aside askew assay asset atoll ' +
    'atone attic audio audit augur aunty avail avert avian avoid await awake award aware ' +
    'awash awful awoke axial axiom axion azure bacon badge badly bagel baggy baker baler ' +
    'balmy banal banjo barge baron basal basic basil basin basis baste batch bathe baton ' +
    'batty bawdy bayou beach beady beard beast beech beefy befit began begat beget begin ' +
    'begun being belch belie belle belly below bench beret berry beset betel bevel bezel ' +
    'bible bicep biddy bilge billy binge bingo biome birch birth bison bitty black blade ' +
    'blame bland blank blare blast blaze bleak bleat bleed bleep blend bless blimp blind ' +
    'blink bliss blitz bloat block bloke blond blood bloom blown bluer bluff blunt blurb ' +
    'blurt blush board boast bobby boney bongo bonus boost booth booty booze boozy borax ' +
    'borne bossy botch bough boule bound bowel boxer brace braid brain brake brand brash ' +
    'brass brave bravo brawl brawn bread break breed briar bribe brick bride brief brine ' +
    'bring brink briny brisk broad broil broke brood brook broom broth brown brunt brush ' +
    'brute buddy budge buggy bugle build built bulge bulky bully bunch bunny burly burnt ' +
    'burst bused bushy butte buyer bylaw cabal cabby cabin cable cacao cache cacti caddy ' +
    'cadet cagey cairn camel cameo canal candy canny canoe canon caper caput carat cargo ' +
    'carol carry carve caste catch cater catty caulk cause cavil cease cedar cello chafe ' +
    'chaff chain chair chalk champ chant chaos chard charm chart chase chasm cheap cheat ' +
    'check cheek cheer chess chest chick chide chief child chili chill chime china chirp ' +
    'chock choir choke chord chore chose chuck chump chunk churn chute cider cigar cinch ' +
    'circa civic civil clack claim clamp clang clank clash clasp class clean clear cleat ' +
    'cleft clerk click cliff climb cling clink cloak clock clone close cloth cloud clout ' +
    'clove clown cluck clued clump clung coach coast cobra cocoa colon color comet comfy ' +
    'comic comma conch condo conic copse coral corer corny couch cough could count coupe ' +
    'court coven cover covet covey cower coyly crack craft cramp crane crank crash crass ' +
    'crate crave crawl craze crazy creak cream credo creed creek creep creme crepe crept ' +
    'cress crest crick cried crier crime crimp crisp croak crock crone crony crook cross ' +
    'croup crowd crown crude cruel crumb crump crush crust crypt cubic cumin curio curly ' +
    'curry curse curve curvy cutie cyber cycle cynic daddy daily dairy daisy dally dance ' +
    'dandy datum daunt dealt death debar debit debug debut decal decay decor decoy decry ' +
    'defer deign deity delay delta delve demon demur denim dense depot depth derby deter ' +
    'detox deuce devil diary dicey digit dilly dimly diner dingo dingy diode dirge dirty ' +
    'disco ditch ditto ditty diver dizzy dodge dodgy dogma doing dolly donor donut dopey ' +
    'doubt dough dowdy dowel downy dowry dozen draft drain drake drama drank drape drawl ' +
    'drawn dread dream dress dried drier drift drill drink drive droit droll drone drool ' +
    'droop dross drove drown druid drunk dryer dryly duchy dully dumpy dunce dusky dusty ' +
    'dutch duvet dwarf dwell dwelt dying eager eagle early earth easel eaten eater ebony ' +
    'eclat edict edify eerie egret eight eject eking elate elbow elder elect elegy elfin ' +
    'elide elite elope elude email embed ember emcee empty enact endow enemy enjoy ennui ' +
    'ensue enter entry envoy epoch epoxy equal equip erase erect erode error erupt essay ' +
    'ester ether ethic ethos etude evade event every evict evoke exact exalt excel exert ' +
    'exile exist expel extol extra exult eying fable facet faint fairy faith false fancy ' +
    'farce fatal fault fauna favor feast feign fella felon femme femur fence feral ferry ' +
    'fetal fetch fetid fetus fever fewer fiber ficus field fiend fiery fifth fifty fight ' +
    'filer filet filly filmy filth final finch finer first fishy fixer fizzy fjord flack ' +
    'flail flair flake flaky flame flank flare flash flask fleck fleet flesh flick flier ' +
    'fling flint flirt float flock flood floor flora floss flour flout flown fluff fluid ' +
    'fluke flume flung flunk flush flute flyer foamy focal focus foggy foist folio folly ' +
    'foray force forge forgo forte forth forty forum found foyer frail frame frank fraud ' +
    'freak freed freer fresh friar fried frill frisk fritz frock frond front frost froth ' +
    'frown froze fruit fudge fugue fully fungi funky funny furor furry fussy fuzzy gaffe ' +
    'gaily gamer gamma gamut gassy gaudy gauge gaunt gauze gavel gawky gayer gayly gazer ' +
    'gecko geeky geese genie genre ghost ghoul giant giddy gipsy girly girth given giver ' +
    'glade gland glare glass glaze gleam glean glide glint gloat globe gloom glory gloss ' +
    'glove glyph gnash gnome godly going golem golly goner goody gooey goofy goose gorge ' +
    'gouge gourd grace grade graft grail grain grand grant grape graph grasp grass grate ' +
    'grave gravy graze great greed green greet grief grill grime grimy grind gripe groan ' +
    'groin groom grope gross group grout grove growl grown gruel gruff grunt guard guava ' +
    'guess guest guide guild guile guilt guise gulch gully gumbo gummy guppy gusto gusty ' +
    'gypsy habit hairy halve handy happy hardy harpy harry harsh haste hasty hatch hater ' +
    'haunt haute haven havoc hazel heady heard heart heath heave heavy hedge hefty heist ' +
    'helix hello hence heron hilly hinge hippo hippy hitch hoard hobby hoist holly homer ' +
    'honey honor horde horse hotel hotly hound house hovel hover howdy human humid humor ' +
    'humph humus hunch hunky hurry husky hutch hydro hyena hyper icily icing ideal idiom ' +
    'idler idyll igloo iliac image imbue impel imply inane inbox incur index inept inert ' +
    'infer ingot inlay inlet inner input inter intro ionic irate irony islet issue itchy ' +
    'ivory jaunt jazzy jelly jerky jetty jewel jiffy joint joist joker jolly joust judge ' +
    'juice juicy jumbo jumpy junta junto juror kappa karma kayak kebab khaki kinky kiosk ' +
    'kitty knack knave knead kneed kneel knelt knife knock knoll known koala krill label ' +
    'labor laden ladle lager lance lanky lapel lapse large larva lasso latch later lathe ' +
    'latte laugh layer leach leafy leant leapt learn lease leash least leave ledge leech ' +
    'leery lefty legal leggy lemon lemur leper level lever libel liege light liken lilac ' +
    'limbo limit linen liner lingo lipid lithe liver livid llama loamy loath lobby local ' +
    'locus lodge lofty logic login loopy loose lorry loser louse lousy lover lower lowly ' +
    'loyal lucid lucky lumen lumpy lunar lunch lunge lupus lurch lurid lusty lying lymph ' +
    'lyric macaw macho macro madam madly mafia magic magma maize major maker mambo mamma ' +
    'mammy manga mange mango mangy mania manic manly manor maple march marry marsh mason ' +
    'masse match matey mauve maxim maybe mayor mealy meant meaty mecca medal media medic ' +
    'melee melon mercy merge merit merry metal meter metro micro midge midst might milky ' +
    'mimic mince miner minim minor minty minus mirth miser missy mocha modal model modem ' +
    'mogul moist molar moldy money month moody moose moral morph mossy motel motif motor ' +
    'motto moult mound mount mourn mouse mouth mover movie mower mucky mucus muddy mulch ' +
    'mummy munch mural murky mushy music musky musty myrrh nadir naive nanny nasal nasty ' +
    'natal naval navel needy neigh nerdy nerve never newer newly nicer niche niece night ' +
    'ninja ninny ninth noble nobly noise noisy nomad noose north nosey notch novel nudge ' +
    'nurse nutty nylon nymph oaken obese occur ocean octal octet odder oddly offal offer ' +
    'often olden older olive ombre omega onion onset opera opine opium optic orbit order ' +
    'organ other otter ought ounce outdo outer outgo ovary ovate overt ovine ovoid owing ' +
    'owner oxide ozone paddy pagan paint paler palsy panel panic pansy papal paper parer ' +
    'parka parry parse party pasta paste pasty patch patio patsy patty pause payee payer ' +
    'peace peach pearl pecan pedal penal pence penne penny perch peril perky pesky pesto ' +
    'petal petty phase phone phony photo piano picky piece piety piggy pilot pinch piney ' +
    'pinky pinto piper pique pitch pithy pivot pixel pixie pizza place plaid plain plait ' +
    'plane plank plant plate plaza plead pleat plied plier pluck plumb plume plump plunk ' +
    'plush poesy point poise poker polar polka polyp pooch poppy porch poser posit posse ' +
    'pouch pound pouty power prank prawn preen press price prick pride pried prime primo ' +
    'print prior prism privy prize probe prone prong proof prose proud prove prowl proxy ' +
    'prude prune psalm pudgy puffy pulpy pulse punch pupil puppy puree purer purge purse ' +
    'pushy putty pygmy quack quail quake qualm quark quart quash quasi queen queer quell ' +
    'query quest queue quick quiet quill quilt quirk quite quota quote quoth rabbi rabid ' +
    'racer radar radii radio rainy raise rajah rally ralph ramen ranch range rapid rarer ' +
    'raspy ratio ratty raven rayon razor reach react ready realm rearm rebar rebel rebus ' +
    'rebut recap recur recut reedy refer refit regal rehab reign relax relay relic remit ' +
    'renal renew repay repel reply rerun reset resin retch retro retry reuse revel revue ' +
    'rhino rhyme rider ridge rifle right rigid rigor rinse ripen riper risen riser risky ' +
    'rival river rivet roach roast robin robot rocky rodeo roger rogue roomy roost rotor ' +
    'rouge rough round rouse route rover rowdy rower royal ruddy ruder rugby ruler rumba ' +
    'rumor rupee rural rusty sadly safer saint salad sally salon salsa salty salve salvo ' +
    'sandy saner sappy sassy satin satyr sauce saucy sauna saute savor savoy savvy scald ' +
    'scale scalp scaly scamp scant scare scarf scary scene scent scion scoff scold scone ' +
    'scoop scope score scorn scour scout scowl scram scrap scree screw scrub scrum scuba ' +
    'sedan seedy segue seize sense sepia serif serum serve setup seven sever sewer shack ' +
    'shade shady shaft shake shaky shale shall shalt shame shank shape shard share shark ' +
    'sharp shave shawl shear sheen sheep sheer sheet sheik shelf shell shied shift shine ' +
    'shiny shire shirk shirt shoal shock shone shook shoot shore shorn short shout shove ' +
    'shown showy shrew shrub shrug shuck shunt shush shyly siege sieve sight sigma silky ' +
    'silly since sinew singe siren sissy sixth sixty skate skier skiff skill skimp skirt ' +
    'skulk skull skunk slack slain slang slant slash slate slave sleek sleep sleet slept ' +
    'slice slick slide slime slimy sling slink sloop slope slosh sloth slump slung slunk ' +
    'slurp slush slyly smack small smart smash smear smell smelt smile smirk smite smith ' +
    'smock smoke smoky smote snack snail snake snaky snare snarl sneak sneer snide sniff ' +
    'snipe snoop snore snort snout snowy snuck snuff soapy sober soggy solar solid solve ' +
    'sonar sonic sooth sooty sorry sound south sower space spade spank spare spark spasm ' +
    'spawn speak spear speck speed spell spelt spend spent spice spicy spied spiel spike ' +
    'spiky spill spilt spine spiny spire spite splat split spoil spoke spoof spook spool ' +
    'spoon spore sport spout spray spree sprig spunk spurn spurt squad squat squib stack ' +
    'staff stage staid stain stair stake stale stalk stall stamp stand stank stare stark ' +
    'start stash state stave stead steak steal steam steed steel steep steer stein stern ' +
    'stick stiff still stilt sting stink stint stock stoic stoke stole stomp stone stony ' +
    'stood stool stoop store stork storm story stout stove strap straw stray strip strut ' +
    'stuck study stuff stump stung stunk stunt style suave sugar suing suite sulky sully ' +
    'sumac sunny super surer surge surly sushi swami swamp swarm swash swath swear sweat ' +
    'sweep sweet swell swept swift swill swine swing swirl swish swoon swoop sword swore ' +
    'sworn swung synod syrup tabby table taboo tacit tacky taffy taint taken taker tally ' +
    'talon tamer tango tangy taper tapir tardy tarot taste tasty tatty taunt tawny teach ' +
    'teary tease teddy teeth tempo tenet tenor tense tenth tepee tepid terra terse testy ' +
    'thank theft their theme there these theta thick thief thigh thing think third thong ' +
    'thorn those three threw throb throw thrum thumb thump thyme tiara tibia tidal tiger ' +
    'tight tilde timer timid tipsy titan tithe title toast today toddy token tonal tonga ' +
    'tonic tooth topaz topic torch torso torus total totem touch tough towel tower toxic ' +
    'toxin trace track tract trade trail train trait tramp trash trawl tread treat trend ' +
    'triad trial tribe trice trick tried tripe trite troll troop trope trout trove truce ' +
    'truck truer truly trump trunk truss trust truth tryst tubal tuber tulip tulle tumor ' +
    'tunic turbo tutor twang tweak tweed tweet twice twine twirl twist twixt tying udder ' +
    'ulcer ultra umbra uncle uncut under undid undue unfed unfit unify union unite unity ' +
    'unlit unmet unset untie until unwed unzip upper upset urban usage usher using usual ' +
    'usurp utile utter vague valet valid valor value valve vapid vapor vault vaunt vegan ' +
    'venom venue verge verse verso verve vicar video vigil vigor villa vinyl viola viper ' +
    'viral virus visit visor vista vital vivid vixen vocal vodka vogue voice voila voter ' +
    'vouch vowel vying wacky wafer wager wagon waist waive waltz warty waste watch water ' +
    'waver waxen weary weave wedge weedy weigh weird welch welsh whack whale wharf wheat ' +
    'wheel whelp where which whiff while whine whiny whirl whisk white whole whoop whose ' +
    'widen wider widow width wield wight willy wimpy wince winch windy wiser wispy witch ' +
    'witty woken woman women woody wooer wooly woozy wordy world worry worse worst worth ' +
    'would wound woven wrack wrath wreak wreck wrest wring wrist write wrong wrote wrung ' +
    'wryly yacht yearn yeast yield young youth zebra zesty zonal').split(' ');

  function five(list) {
    var seen = Object.create(null), out = [];
    list.forEach(function (w) {
      if (/^[a-z]{5}$/.test(w) && !seen[w]) { seen[w] = true; out.push(w); }
    });
    return out;
  }

  function mount(host) {
    var Milo = window.Milo, U = Milo.util, WORDS = Milo.words;
    var els = null, timers = [];
    var answers1 = five(TIER1), answers2 = five(TIER2);
    var accept = Object.create(null);
    [answers1, answers2, five(EXTRA), WORDS.five].forEach(function (l) {
      l.forEach(function (w) { accept[w] = true; });
    });

    function later(fn, ms) {
      var t = setTimeout(function () {
        timers.splice(timers.indexOf(t), 1);
        fn();
      }, ms);
      timers.push(t);
      return t;
    }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    var KB = ['qwertyuiop', 'asdfghjkl', '⏎zxcvbnm⌫'];

    function build(g) {
      var root = g.root;
      root.innerHTML = '';
      var style = document.createElement('style');
      style.textContent = [
        '.wg-wrap{display:flex;flex-direction:column;align-items:center;gap:14px;font-family:Outfit,sans-serif;user-select:none;-webkit-user-select:none;width:100%;max-width:520px;margin:auto}',
        '.wg-board{display:grid;grid-template-rows:repeat(6,1fr);gap:6px}',
        '.wg-row{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}',
        '.wg-row.shake{animation:wgShake .5s}',
        '@keyframes wgShake{10%,90%{transform:translateX(-2px)}20%,80%{transform:translateX(4px)}30%,50%,70%{transform:translateX(-6px)}40%,60%{transform:translateX(6px)}}',
        '.wg-tile{width:clamp(44px,11vw,60px);height:clamp(44px,11vw,60px);border:2px solid #3a3f4b;border-radius:6px;' +
        'display:grid;place-items:center;font-size:clamp(22px,5.5vw,30px);font-weight:800;color:#fff;text-transform:uppercase;' +
        'background:transparent;transition:border-color .1s}',
        '.wg-tile.filled{border-color:#6b7280;animation:wgPop .1s}',
        '@keyframes wgPop{0%{transform:scale(.85)}60%{transform:scale(1.08)}100%{transform:scale(1)}}',
        '.wg-tile.flip{animation:wgFlip .55s ease forwards}',
        '@keyframes wgFlip{0%{transform:rotateX(0)}50%{transform:rotateX(90deg)}100%{transform:rotateX(0)}}',
        '.wg-tile.c{background:#6aaa64;border-color:#6aaa64}',
        '.wg-tile.p{background:#c9b458;border-color:#c9b458}',
        '.wg-tile.a{background:#3a3a3c;border-color:#3a3a3c}',
        '.wg-tile.bounce{animation:wgBounce .8s ease}',
        '@keyframes wgBounce{0%,20%{transform:translateY(0)}40%{transform:translateY(-22px)}60%{transform:translateY(4px)}80%{transform:translateY(-8px)}100%{transform:translateY(0)}}',
        '.wg-toast{min-height:26px;padding:4px 14px;border-radius:8px;background:#f3f4f6;color:#111;font-weight:800;' +
        'font-size:.9rem;opacity:0;transition:opacity .2s;pointer-events:none}',
        '.wg-toast.on{opacity:1}',
        '.wg-kb{display:flex;flex-direction:column;gap:6px;width:100%;align-items:center}',
        '.wg-kr{display:flex;gap:5px;justify-content:center;width:100%}',
        '.wg-k{flex:1 1 0;max-width:44px;height:52px;border:0;border-radius:6px;background:#818898;color:#fff;font:800 .95rem Outfit,sans-serif;' +
        'text-transform:uppercase;cursor:pointer;display:grid;place-items:center;transition:background .15s;padding:0}',
        '.wg-k.wide{max-width:70px;flex:1.6 1 0;font-size:1.15rem}',
        '.wg-k:active{transform:scale(.94)}',
        '.wg-k.c{background:#6aaa64}.wg-k.p{background:#c9b458}.wg-k.a{background:#2b2d33;color:#8b8f99}',
        '.wg-conf{position:absolute;width:8px;height:8px;border-radius:2px;pointer-events:none;animation:wgConf 1.4s ease-out forwards}',
        '@keyframes wgConf{0%{transform:translate(0,0) rotate(0);opacity:1}100%{transform:translate(var(--dx),var(--dy)) rotate(540deg);opacity:0}}'
      ].join('\n');

      var wrap = document.createElement('div'); wrap.className = 'wg-wrap';
      var board = document.createElement('div'); board.className = 'wg-board';
      var rows = [];
      for (var r = 0; r < ROWS; r++) {
        var row = document.createElement('div'); row.className = 'wg-row';
        var tiles = [];
        for (var c = 0; c < COLS; c++) {
          var t = document.createElement('div'); t.className = 'wg-tile';
          row.appendChild(t); tiles.push(t);
        }
        board.appendChild(row);
        rows.push({ el: row, tiles: tiles });
      }
      var toast = document.createElement('div'); toast.className = 'wg-toast';
      var kb = document.createElement('div'); kb.className = 'wg-kb';
      var keys = {};
      KB.forEach(function (line) {
        var kr = document.createElement('div'); kr.className = 'wg-kr';
        line.split('').forEach(function (ch) {
          var k = document.createElement('button'); k.type = 'button';
          k.className = 'wg-k' + (ch === '⏎' || ch === '⌫' ? ' wide' : '');
          k.textContent = ch;
          k.addEventListener('click', function () {
            if (ch === '⏎') submit(g); else if (ch === '⌫') backspace(g); else type(g, ch);
          });
          kr.appendChild(k); keys[ch] = k;
        });
        kb.appendChild(kr);
      });
      wrap.appendChild(board); wrap.appendChild(toast); wrap.appendChild(kb);
      root.appendChild(style); root.appendChild(wrap);
      els = { rows: rows, toast: toast, keys: keys, wrap: wrap };
    }

    function reset(g) {
      var d = g.data;
      clearTimers();
      d.gen = (d.gen || 0) + 1;
      d.streak = 0; d.solved = 0; d.used = Object.create(null); d.totalGuesses = 0;
      build(g);
      newRound(g);
      g.set('Score', 0); g.set('Streak', 0); g.set('Guess', '1 / ' + ROWS);
    }

    function pickAnswer(d) {
      var pool = d.streak >= 6 ? answers2 : d.streak >= 3 ? answers1.concat(answers2) : answers1;
      var w, tries = 0;
      do { w = U.choice(pool); tries++; } while (d.used[w] && tries < 60);
      d.used[w] = true;
      return w;
    }

    function newRound(g) {
      var d = g.data;
      d.answer = pickAnswer(d);
      d.row = 0; d.cur = ''; d.busy = false; d.phase = 'play';
      d.keyState = Object.create(null);
      els.rows.forEach(function (r) {
        r.el.className = 'wg-row';
        r.tiles.forEach(function (t) { t.className = 'wg-tile'; t.textContent = ''; });
      });
      Object.keys(els.keys).forEach(function (k) { els.keys[k].className = 'wg-k' + (k === '⏎' || k === '⌫' ? ' wide' : ''); });
      g.set('Guess', '1 / ' + ROWS);
    }

    function toast(msg, ms) {
      els.toast.textContent = msg;
      els.toast.className = 'wg-toast on';
      var gen = g0.data.gen;
      later(function () { if (g0.data.gen === gen) els.toast.className = 'wg-toast'; }, ms || 1100);
    }
    var g0 = null;

    function paintRow(d) {
      var tiles = els.rows[d.row].tiles;
      for (var i = 0; i < COLS; i++) {
        tiles[i].textContent = d.cur[i] || '';
        tiles[i].className = 'wg-tile' + (d.cur[i] ? ' filled' : '');
      }
    }

    function type(g, ch) {
      var d = g.data;
      if (d.phase !== 'play' || d.busy || d.cur.length >= COLS) return;
      d.cur += ch;
      paintRow(d);
      Milo.sound.tone({ f: 520 + d.cur.length * 40, d: .04, v: .05, type: 'triangle' });
    }
    function backspace(g) {
      var d = g.data;
      if (d.phase !== 'play' || d.busy || !d.cur.length) return;
      d.cur = d.cur.slice(0, -1);
      paintRow(d);
      Milo.sound.click();
    }

    function evaluate(guess, answer) {
      var res = new Array(COLS).fill('a'), left = {};
      for (var i = 0; i < COLS; i++) {
        if (guess[i] === answer[i]) res[i] = 'c';
        else left[answer[i]] = (left[answer[i]] || 0) + 1;
      }
      for (var j = 0; j < COLS; j++) {
        if (res[j] === 'a' && left[guess[j]]) { res[j] = 'p'; left[guess[j]]--; }
      }
      return res;
    }

    function shakeRow(d) {
      var row = els.rows[d.row].el;
      row.className = 'wg-row shake';
      later(function () { row.className = 'wg-row'; }, 500);
      Milo.sound.tone({ f: 160, f2: 110, d: .16, v: .08, type: 'sawtooth' });
    }

    function submit(g) {
      var d = g.data;
      if (d.phase === 'won') { nextRound(g); return; }
      if (d.phase !== 'play' || d.busy) return;
      if (d.cur.length < COLS) { toast('Not enough letters'); shakeRow(d); return; }
      if (!accept[d.cur]) { toast('Not in word list'); shakeRow(d); return; }
      d.busy = true;
      var guess = d.cur, res = evaluate(guess, d.answer), tiles = els.rows[d.row].tiles;
      var gen = d.gen;
      d.totalGuesses++;
      res.forEach(function (st, i) {
        later(function () {
          if (d.gen !== gen) return;
          tiles[i].className = 'wg-tile filled flip';
          Milo.sound.tone({ f: st === 'c' ? 720 : st === 'p' ? 540 : 300, d: .07, v: .05, type: 'square' });
          later(function () {
            if (d.gen !== gen) return;
            tiles[i].className = 'wg-tile filled flip ' + st;
          }, 270);
        }, i * 220);
      });
      later(function () {
        if (d.gen !== gen) return;
        // Keyboard colours: correct beats present beats absent.
        var rank = { c: 3, p: 2, a: 1 };
        for (var i = 0; i < COLS; i++) {
          var ch = guess[i], prev = d.keyState[ch];
          if (!prev || rank[res[i]] > rank[prev]) d.keyState[ch] = res[i];
        }
        Object.keys(d.keyState).forEach(function (k) {
          if (els.keys[k]) els.keys[k].className = 'wg-k ' + d.keyState[k];
        });
        var solved = res.every(function (s) { return s === 'c'; });
        if (solved) roundWon(g, gen);
        else {
          d.row++;
          d.cur = '';
          if (d.row >= ROWS) {
            d.phase = 'lost';
            toast('The word was ' + d.answer.toUpperCase(), 4000);
            later(function () {
              if (d.gen !== gen) return;
              g.gameOver({
                emo: '📖', title: 'Out of guesses',
                text: 'The word was ' + d.answer.toUpperCase() + '. ' + d.solved + ' solved this run' +
                  (d.solved ? ', ' + (d.totalGuesses / d.solved).toFixed(1) + ' guesses a word.' : '.')
              });
            }, 1500);
          } else {
            g.set('Guess', (d.row + 1) + ' / ' + ROWS);
            d.busy = false;
          }
        }
      }, COLS * 220 + 320);
    }

    function roundWon(g, gen) {
      var d = g.data;
      d.phase = 'won';
      d.solved++; d.streak++;
      var pts = GUESS_PTS[d.row] + (d.streak - 1) * 50;
      g.score += pts;
      g.set('Score', U.fmt(g.score));
      g.set('Streak', d.streak);
      var praise = ['Genius', 'Magnificent', 'Impressive', 'Splendid', 'Great', 'Phew'][d.row];
      toast(praise + '! +' + pts, 2600);
      Milo.sound.win();
      var tiles = els.rows[d.row].tiles;
      tiles.forEach(function (t, i) {
        later(function () { if (d.gen === gen) t.className += ' bounce'; }, i * 90);
      });
      burst(g, els.rows[d.row].el);
      later(function () {
        if (d.gen !== gen || g.state !== 'play') return;
        g.overlay({
          emo: '✅', title: d.answer.toUpperCase() + ' in ' + (d.row + 1),
          text: '+' + pts + ' · streak ' + d.streak + (d.streak >= 3 ? ' · trickier words unlocked' : '') +
            '. Keep going — the run ends on the first miss.',
          actions: [{ label: 'Next word ▶', primary: true, onClick: function () { nextRound(g); } }],
          hint: 'Press Enter'
        });
      }, 1500);
    }

    function nextRound(g) {
      var d = g.data;
      if (d.phase !== 'won' || g.state !== 'play') return;
      g.clearOverlay();
      newRound(g);
    }

    function burst(g, anchor) {
      var r = anchor.getBoundingClientRect(), h = g.host.getBoundingClientRect();
      var cx = r.left - h.left + r.width / 2, cy = r.top - h.top + r.height / 2;
      var cols = ['#6aaa64', '#c9b458', '#fff', '#60a5fa', '#f472b6'];
      for (var i = 0; i < 36; i++) {
        var p = document.createElement('div');
        p.className = 'wg-conf';
        var a = Math.random() * Math.PI * 2, dist = 60 + Math.random() * 150;
        p.style.cssText = 'left:' + cx + 'px;top:' + cy + 'px;background:' + U.choice(cols) +
          ';--dx:' + Math.cos(a) * dist + 'px;--dy:' + (Math.sin(a) * dist + 120) + 'px;z-index:8';
        g.hud.appendChild(p);
        (function (el) { later(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1500); })(p);
      }
    }

    return Milo.domGame(host, {
      id: 'word-guess',
      bg: '#121826',
      stats: ['Score', 'Streak', 'Guess'],
      emo: '🟩',
      start: {
        title: 'Word Guess',
        text: 'Six tries to find the five-letter word. Green is the right letter in the right spot, ' +
          'yellow is in the word elsewhere, grey is out. Faster solves score more, and every word ' +
          'you crack keeps the streak alive — miss once and the run is over.',
        keys: ['Type letters', 'Enter', 'Backspace']
      },
      preload: function (g) { g0 = g; },
      init: reset,
      destroy: function () { clearTimers(); },
      onKey: function (g, e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.code === 'Enter') { submit(g); return; }
        if (e.code === 'Backspace') { backspace(g); return; }
        if (/^[a-zA-Z]$/.test(e.key)) type(g, e.key.toLowerCase());
      }
    });
  }

  window.Milo.register({
    id: 'word-guess', title: 'Word Guess', emo: '🟩', category: 'Word',
    tagline: 'Six guesses, five letters, one streak',
    description: 'Deduce the hidden five-letter word in six guesses: green tiles are right letter, ' +
      'right place, yellow means the letter is elsewhere, grey rules it out, and the keyboard ' +
      'remembers all of it. Solving in two pays 450, in six just 100, and each consecutive solve ' +
      'adds a 50-point streak bonus. From the third word in a row the pool mixes in trickier ' +
      'answers with doubled and rare letters. Tip: open with a vowel-heavy word like ADIEU or RAISE.',
    controls: ['Type letters', 'Enter', 'Backspace', 'Click keyboard'],
    colors: ['#121826', '#6aaa64'],
    tags: ['word', 'guessing', 'daily', 'deduction', 'letters'],
    mount: mount
  });
})();
