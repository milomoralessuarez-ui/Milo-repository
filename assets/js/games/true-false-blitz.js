/* True or False Blitz — five seconds a statement, and the truth after every miss. */
(function () {
  'use strict';

  /* [statement, true?, the note shown afterwards]. Every entry was written to
     be checkable — the false ones are common myths, not trick wording. */
  var FACTS = [
    ['A group of flamingos is called a flamboyance.', 1, 'It really is — along with a "stand" of flamingos.'],
    ['Bananas grow on trees.', 0, 'The banana plant is a giant herb; its "trunk" is a pseudostem of leaf bases.'],
    ['The Sun is a star.', 1, 'An ordinary yellow dwarf, just very close to us.'],
    ['Bats are blind.', 0, 'Every bat species can see. Many also use echolocation in the dark.'],
    ['Sound travels faster in water than in air.', 1, 'About four times faster.'],
    ['Lightning never strikes the same place twice.', 0, 'Tall structures are struck over and over — the Empire State Building many times a year.'],
    ['Water boils at a lower temperature high up a mountain.', 1, 'Lower air pressure means a lower boiling point.'],
    ['Diamonds are made of carbon.', 1, 'Pure carbon, crystallised under enormous pressure.'],
    ['Glass is a slow-moving liquid, which is why old windows are thicker at the bottom.', 0, 'Glass is an amorphous solid. Old panes vary because of how they were made.'],
    ['An octopus has blue blood.', 1, 'It carries oxygen with copper-based haemocyanin, not iron.'],
    ['Goldfish have a three-second memory.', 0, 'They can remember things for months and be trained.'],
    ['Sharks are mammals.', 0, 'Sharks are fish — cartilaginous ones.'],
    ['A tomato is botanically a fruit.', 1, 'It develops from a flower and carries seeds.'],
    ['Spiders are insects.', 0, 'They are arachnids: eight legs, two body sections, no antennae.'],
    ['The Great Wall of China is visible to the naked eye from the Moon.', 0, 'It is not even easy to pick out from low Earth orbit.'],
    ['Mercury is the hottest planet in the Solar System.', 0, 'Venus is, thanks to a runaway greenhouse atmosphere.'],
    ['Saturn is less dense than water.', 1, 'Its mean density is about 0.69 g/cm³ — it would float, given a big enough bath.'],
    ['Sunlight takes about eight minutes to reach Earth.', 1, 'Roughly eight minutes and twenty seconds.'],
    ['There is no gravity in space.', 0, 'Orbiting astronauts are in constant free fall, which feels weightless.'],
    ['The Moon always shows Earth the same face.', 1, 'It is tidally locked to us.'],
    ['Sound can travel through a vacuum.', 0, 'Sound needs a medium. Space is silent.'],
    ['Antarctica is a desert.', 1, 'The largest one on Earth — deserts are defined by precipitation, not heat.'],
    ['The Amazon produces 20% of the world’s oxygen.', 0, 'The rainforest consumes nearly as much as it makes. The figure is a myth.'],
    ['Wild penguins live at the North Pole.', 0, 'Every wild penguin lives in the Southern Hemisphere.'],
    ['Polar bears and penguins never meet in the wild.', 1, 'Opposite ends of the planet.'],
    ['Camels store water in their humps.', 0, 'Humps are fat stores. The water tricks are in their blood and kidneys.'],
    ['An adult human has 32 teeth, wisdom teeth included.', 1, 'Children have 20 milk teeth.'],
    ['Hair and fingernails keep growing after death.', 0, 'The skin dries and retracts, which makes them look longer.'],
    ['Carrots dramatically improve night vision.', 0, 'A wartime cover story. They only help if you are short of vitamin A.'],
    ['Honey never spoils.', 1, 'Low water and high acidity. Edible pots have been found in ancient tombs.'],
    ['A bolt of lightning is hotter than the surface of the Sun.', 1, 'Around 30,000°C against roughly 5,500°C.'],
    ['Ostriches bury their heads in the sand when frightened.', 0, 'They lie flat or run — at up to 70 km/h.'],
    ['The blue whale is the largest animal that has ever lived.', 1, 'Bigger than any known dinosaur.'],
    ['Mosquitoes kill more people each year than any other animal.', 1, 'Through malaria, dengue and other diseases they carry.'],
    ['Snakes dislocate their jaws to swallow big prey.', 0, 'Their jaw halves are joined by a stretchy ligament — nothing comes apart.'],
    ['All mammals give birth to live young.', 0, 'The platypus and the echidnas lay eggs.'],
    ['A starfish can regrow a lost arm.', 1, 'Some species can regrow a whole body from one arm and part of the disc.'],
    ['Jellyfish have brains.', 0, 'They have a nerve net and no central brain at all.'],
    ['Wolves howl at the Moon.', 0, 'They howl to locate the pack. The Moon is irrelevant.'],
    ['Rabbits are rodents.', 0, 'They are lagomorphs — a separate order, with an extra pair of incisors.'],
    ['Hummingbirds can fly backwards.', 1, 'The only birds that truly can.'],
    ['Owls can rotate their heads a full 360 degrees.', 0, 'About 270 degrees — impressive, but not all the way round.'],
    ['Bulls are enraged by the colour red.', 0, 'Cattle are red-green colour blind. It is the movement of the cape.'],
    ['Chameleons change colour mainly to communicate and control temperature.', 1, 'Camouflage is a side effect, not the main purpose.'],
    ['Sloths can hold their breath longer than dolphins.', 1, 'By slowing their heart rate, up to about 40 minutes.'],
    ['Cows have four separate stomachs.', 0, 'One stomach with four chambers — rumen, reticulum, omasum and abomasum.'],
    ['Fish cannot feel pain.', 0, 'They have nociceptors and behave as though they feel it.'],
    ['Russia is the largest country in the world by area.', 1, 'Nearly twice the size of second-placed Canada.'],
    ['Africa is a country.', 0, 'A continent of 54 countries.'],
    ['Australia is both a country and a continent.', 1, 'The only nation that covers an entire continent.'],
    ['The Sahara is the largest desert on Earth.', 0, 'Antarctica is larger. The Sahara is the largest hot desert.'],
    ['Mount Everest is the tallest mountain measured from its base.', 0, 'Mauna Kea wins that one, measured from the sea floor.'],
    ['The Dead Sea is actually a lake.', 1, 'A landlocked salt lake between Israel, the West Bank and Jordan.'],
    ['Istanbul sits on two continents.', 1, 'The Bosphorus splits it between Europe and Asia.'],
    ['The Nile flows north.', 1, 'From the highlands of east Africa to the Mediterranean.'],
    ['Canada has the longest coastline of any country.', 1, 'By a huge margin, thanks to its Arctic islands.'],
    ['Vatican City is the smallest country in the world.', 1, 'About 0.49 square kilometres.'],
    ['The United Nations has 195 member states.', 0, 'It has 193. The 195 figure adds two observer states.'],
    ['Greenland is part of the Kingdom of Denmark.', 1, 'An autonomous territory with its own government.'],
    ['The Pacific Ocean covers more area than all the land on Earth.', 1, 'Roughly 165 million km² against about 149 million of land.'],
    ['Iceland is greener than Greenland.', 1, 'Greenland is mostly ice sheet; Iceland is mostly not.'],
    ['The Equator passes through Brazil.', 1, 'And through Ecuador, Colombia, Kenya, Indonesia and others.'],
    ['Spain and Portugal share a land border.', 1, 'About 1,200 km of it.'],
    ['Switzerland has a coastline.', 0, 'Landlocked, surrounded by five countries.'],
    ['New York is the capital of the United States.', 0, 'Washington, D.C. has been since 1800.'],
    ['Sydney is the capital of Australia.', 0, 'Canberra was purpose-built as a compromise capital.'],
    ['Turkey lies partly in Europe and partly in Asia.', 1, 'Thrace in Europe, Anatolia in Asia.'],
    ['The Amazon carries more water than any other river.', 1, 'More discharge than the next several rivers combined.'],
    ['Alaska is both the westernmost and easternmost US state.', 1, 'The Aleutian Islands cross the 180th meridian.'],
    ['Mongolia is landlocked.', 1, 'Squeezed between Russia and China.'],
    ['Lake Baikal holds about a fifth of the world’s unfrozen fresh surface water.', 1, 'It is also the deepest lake on Earth.'],
    ['The Great Fire of London happened in 1666.', 1, 'It began in a bakery on Pudding Lane.'],
    ['Napoleon Bonaparte was unusually short.', 0, 'About 1.68 m — average for a Frenchman of his day. The myth is British propaganda and a units muddle.'],
    ['Vikings wore horned helmets.', 0, 'No horned helmet has ever been found in a Viking grave. Blame 19th-century opera.'],
    ['The Titanic sank on its maiden voyage.', 1, 'Four days out of Southampton, in April 1912.'],
    ['The Hundred Years’ War lasted 116 years.', 1, 'From 1337 to 1453, with long pauses.'],
    ['The Rosetta Stone helped scholars read Egyptian hieroglyphs.', 1, 'The same decree in three scripts gave them the key.'],
    ['Julius Caesar was a Roman Emperor.', 0, 'He was a dictator of the Republic. His heir Augustus was the first emperor.'],
    ['The Berlin Wall came down in 1989.', 1, 'The crossings opened on 9 November.'],
    ['The first modern Olympic Games were held in Athens.', 1, 'In 1896, with 14 nations.'],
    ['Cleopatra lived closer in time to the Moon landing than to the building of the Great Pyramid.', 1, 'The pyramid was already 2,500 years old when she was born.'],
    ['Albert Einstein failed mathematics at school.', 0, 'He was excellent at it, and said so himself.'],
    ['Marie Antoinette said "Let them eat cake".', 0, 'No contemporary source ties the phrase to her.'],
    ['The Wright brothers made the first powered aeroplane flight in 1903.', 1, 'At Kitty Hawk, North Carolina.'],
    ['The Romans used concrete.', 1, 'Their volcanic-ash concrete is still standing in the Pantheon.'],
    ['The Black Death reached Europe in the 14th century.', 1, 'Arriving in 1347 and killing a huge share of the population.'],
    ['Christopher Columbus proved the Earth was round.', 0, 'Educated Europeans had known that for well over a thousand years.'],
    ['Johannes Gutenberg introduced movable-type printing to Europe.', 1, 'Around 1440. Movable type existed earlier in East Asia.'],
    ['The French Revolution began in 1789.', 1, 'The Bastille fell on 14 July of that year.'],
    ['The First World War ended in 1918.', 1, 'The armistice took effect on 11 November.'],
    ['Genghis Khan founded the Mongol Empire.', 1, 'Uniting the Mongol tribes in 1206.'],
    ['The Colosseum was built by the ancient Greeks.', 0, 'It is Roman, finished around AD 80.'],
    ['Magna Carta was sealed in 1215.', 1, 'At Runnymede, by King John.'],
    ['The Egyptian pyramids were built by slaves.', 0, 'Excavated workers’ towns show paid, fed, organised labourers.'],
    ['Leonardo da Vinci designed flying machines.', 1, 'Including an ornithopter and a screw-shaped aerial device.'],
    ['You lose most of your body heat through your head.', 0, 'You lose heat in proportion to whatever is uncovered.'],
    ['Humans only use 10% of their brains.', 0, 'Scans show essentially all of it does something.'],
    ['The average adult human body is about 60% water.', 1, 'Varying with age and body composition.'],
    ['Cracking your knuckles causes arthritis.', 0, 'Studies have repeatedly found no link.'],
    ['The left side of the brain controls the right side of the body.', 1, 'Most motor pathways cross over in the brainstem.'],
    ['Red blood cells carry oxygen.', 1, 'Bound to haemoglobin.'],
    ['Blood in your veins is blue.', 0, 'Blood is always red. Veins look blue through skin because of how light scatters.'],
    ['Identical twins have identical fingerprints.', 0, 'Their DNA matches but their fingerprints do not.'],
    ['The liver can regenerate.', 1, 'It can regrow to full size from a fraction of itself.'],
    ['A person can live without a spleen.', 1, 'With a higher infection risk, but yes.'],
    ['Different parts of your tongue detect different tastes.', 0, 'The "tongue map" was a mistranslation. Receptors are spread all over.'],
    ['The smallest muscle in the human body is in the ear.', 1, 'The stapedius, about one millimetre long.'],
    ['Adults have fewer bones than babies.', 1, 'Around 206 against roughly 300 — many fuse as we grow.'],
    ['Shaving makes hair grow back thicker.', 0, 'The blunt cut end just feels coarser.'],
    ['Hiccups are a spasm of the diaphragm.', 1, 'Followed by the vocal cords snapping shut.'],
    ['You can catch a cold from being cold.', 0, 'Colds are caused by viruses, not temperature.'],
    ['The human skeleton replaces itself roughly every ten years.', 1, 'Bone is constantly being broken down and rebuilt.'],
    ['The word "quiz" contains no vowels.', 0, 'U and I are both vowels.'],
    ['"Rhythm" is an English word with no A, E, I, O or U.', 1, 'The Y does all the work.'],
    ['The dot over a lower-case "i" is called a tittle.', 1, 'Hence "not one jot or tittle".'],
    ['English has more words than any other language.', 0, 'Nobody can count words consistently enough to say.'],
    ['A pangram is a sentence using every letter of the alphabet.', 1, 'Like the quick brown fox one.'],
    ['"Go." is a complete English sentence.', 1, 'Implied subject, one verb — the shortest there is.'],
    ['An oxymoron is a stupid person.', 0, 'It is a phrase joining contradictory words, like "deafening silence".'],
    ['"Emoji" comes from Japanese words for picture and character.', 1, 'The resemblance to "emotion" is a coincidence.'],
    ['"Alphabet" comes from the first two letters of the Greek alphabet.', 1, 'Alpha and beta.'],
    ['Esperanto is a constructed language.', 1, 'Published by L. L. Zamenhof in 1887.'],
    ['Latin has no native speakers today.', 1, 'It survives as a liturgical and scholarly language.'],
    ['No common English word rhymes perfectly with "orange".', 1, 'The nearest are place names and half-rhymes.'],
    ['A murmuration is a group of starlings.', 1, 'Thousands of them wheeling at dusk.'],
    ['White chocolate contains no cocoa solids.', 1, 'Only cocoa butter, sugar and milk.'],
    ['A peanut is a nut.', 0, 'It is a legume, growing underground in a pod like a pea.'],
    ['Carrots were originally purple.', 1, 'Orange ones were bred later, in the Netherlands.'],
    ['Ketchup was once sold as medicine.', 1, 'As tomato pills in the 1830s, for indigestion.'],
    ['Rhubarb leaves are poisonous.', 1, 'High in oxalic acid. The stalks are fine.'],
    ['Coffee beans are seeds.', 1, 'The pips of the coffee cherry.'],
    ['Chocolate is toxic to dogs.', 1, 'Theobromine, which dogs clear from the body very slowly.'],
    ['Pineapples grow on trees.', 0, 'They grow on a low, spiky ground plant, one fruit at a time.'],
    ['Wasabi in most restaurants is usually dyed horseradish.', 1, 'Real wasabi is expensive and loses its heat within minutes.'],
    ['Cashews grow attached to the outside of a fruit.', 1, 'Dangling below the cashew apple.'],
    ['Black pepper and chilli pepper come from the same plant.', 0, 'Completely unrelated. Columbus caused the naming confusion.'],
    ['Vanilla comes from an orchid.', 1, 'The cured seed pod of a climbing vine orchid.'],
    ['Tomatoes were once thought poisonous in Europe.', 1, 'Partly because acidic tomatoes leached lead from pewter plates.'],
    ['A strawberry is botanically a berry.', 0, 'It is an aggregate accessory fruit. The "seeds" outside are the real fruits.'],
    ['Bananas are botanically berries.', 1, 'So are tomatoes, grapes and avocados.'],
    ['Sugar makes children hyperactive.', 0, 'Controlled trials find no effect. Parents’ expectations do a lot of work.'],
    ['Bread goes stale faster in the fridge than on the counter.', 1, 'Starch retrogradation is fastest just above freezing.'],
    ['Honey is made from nectar.', 1, 'Collected, enzyme-treated and dried down in the comb.'],
    ['A marathon is 26.2 miles.', 1, '42.195 km, fixed at the 1908 London Olympics.'],
    ['In tennis, "love" means zero.', 1, 'Probably from "l’œuf", French for egg.'],
    ['Basketball was invented in Canada.', 0, 'Invented in Massachusetts by James Naismith, who was Canadian.'],
    ['The Olympic flag has five rings.', 1, 'One for each inhabited continent as counted at the time.'],
    ['A standard round of golf is 18 holes.', 1, 'Standardised by St Andrews in the 18th century.'],
    ['In chess, the queen is the most powerful piece.', 1, 'She moves like a rook and a bishop combined.'],
    ['A hat-trick is three goals by one player in a match.', 1, 'The name came from cricket, for three wickets in three balls.'],
    ['The Tour de France stays entirely inside France.', 0, 'Stages regularly cross into Belgium, Spain, Italy and beyond.'],
    ['Table tennis is an Olympic sport.', 1, 'Since Seoul in 1988.'],
    ['The first FIFA World Cup was held in Uruguay.', 1, 'In 1930, and the hosts won it.'],
    ['A cricket Test match can last five days.', 1, 'And still end in a draw.'],
    ['Boxing rings are round.', 0, 'They are square. The name is older than the shape.'],
    ['In American football a touchdown is worth six points.', 1, 'With one or two more available afterwards.'],
    ['A sumo wrestler must throw his opponent down to win.', 0, 'Forcing him out of the ring wins just as well.'],
    ['A byte is eight bits.', 1, 'Standard since the 1960s.'],
    ['Zero is an even number.', 1, 'It divides by two with no remainder.'],
    ['Pi is exactly 22/7.', 0, '22/7 is a handy approximation. Pi is irrational.'],
    ['A prime number has exactly two distinct factors.', 1, 'One and itself — which is why 1 is not prime.'],
    ['Ada Lovelace is generally credited as the first computer programmer.', 1, 'For her 1843 notes on Babbage’s Analytical Engine.'],
    ['HTTP stands for HyperText Transfer Protocol.', 1, 'The S in HTTPS is for Secure.'],
    ['A kibibyte is 1,000 bytes.', 0, 'It is 1,024. A kilobyte is the one usually taken as 1,000.'],
    ['Google was originally called BackRub.', 1, 'Renamed in 1997 after the number googol.'],
    ['QWERTY was designed to slow typists down.', 0, 'It was arranged to stop common typebars from clashing.'],
    ['A googol is 1 followed by 100 zeros.', 1, 'Named by a nine-year-old in 1920.'],
    ['The internet and the World Wide Web are the same thing.', 0, 'The Web is one service running on the internet, invented decades later.'],
    ['Binary uses only the digits 0 and 1.', 1, 'Base two.'],
    ['The Roman numeral for 50 is L.', 1, 'And C is 100, D is 500, M is 1,000.'],
    ['Every square is a rectangle.', 1, 'Four right angles is all a rectangle needs.'],
    ['Every rectangle is a square.', 0, 'Only the ones with four equal sides.'],
    ['The angles of a flat triangle add up to 180 degrees.', 1, 'On a curved surface they do not.'],
    ['The number 1 is prime.', 0, 'It has only one factor, so it fails the definition.'],
    ['Wi-Fi is short for Wireless Fidelity.', 0, 'It is a brand name a marketing firm invented. It stands for nothing.'],
    ['The first email was sent before the first handheld mobile phone call.', 1, 'Email in 1971, the mobile call in 1973.'],
    ['There are more ways to shuffle a deck of cards than there are stars in the Milky Way.', 1, '52 factorial is about 8 followed by 67 zeros.'],
    ['Mozart composed the tune of "Twinkle, Twinkle, Little Star".', 0, 'He wrote variations on an existing French melody.'],
    ['Beethoven was deaf in later life.', 1, 'He conducted the premiere of his Ninth unable to hear it.'],
    ['The Mona Lisa hangs in the Louvre.', 1, 'In Paris, behind bulletproof glass.'],
    ['Shakespeare was born and died in Stratford-upon-Avon.', 1, 'And on the same date, 23 April, by tradition.'],
    ['Vincent van Gogh sold many paintings in his lifetime.', 0, 'He sold very few. Fame arrived after his death.'],
    ['The saxophone is named after its inventor.', 1, 'Adolphe Sax, who patented it in 1846.'],
    ['A traditional haiku has 17 syllables.', 1, 'In a 5-7-5 pattern.'],
    ['Raphael painted the ceiling of the Sistine Chapel.', 0, 'Michelangelo did, between 1508 and 1512.'],
    ['"The Starry Night" was painted by Van Gogh.', 1, 'From the window of an asylum in Saint-Rémy.'],
    ['Jazz originated in New Orleans.', 1, 'Around the turn of the twentieth century.'],
    ['The piano counts as a percussion instrument.', 1, 'Its strings are struck by hammers.'],
    ['Opera began in Italy.', 1, 'In Florence, around 1600.'],
    ['"The Nutcracker" was composed by Tchaikovsky.', 1, 'First performed in 1892.'],
    ['Picasso co-founded Cubism.', 1, 'With Georges Braque.'],
    ['"Hamlet" is a comedy.', 0, 'It is a tragedy, and almost nobody survives it.'],
    ['The Eiffel Tower can stand more than 15 cm taller in summer.', 1, 'Iron expands in the heat.'],
    ['The plastic tips on shoelaces have a name.', 1, 'They are aglets.'],
    ['Bubble wrap was originally invented as wallpaper.', 1, 'It failed at that, then found work as packaging.'],
    ['The microwave oven was invented by accident.', 1, 'Percy Spencer noticed a chocolate bar melting near a radar magnetron.'],
    ['Velcro was inspired by burrs stuck to a dog.', 1, 'George de Mestral looked at them under a microscope.'],
    ['A baker’s dozen is 13.', 1, 'An extra loaf, to stay clear of short-weight penalties.'],
    ['Duct tape was invented for sealing air ducts.', 0, 'It was made in WWII to seal ammunition cases. It is poor at ducts.'],
    ['The "@" symbol is older than email.', 1, 'Merchants used it for centuries to mean "at the rate of".'],
    ['Lego bricks from 1958 still fit bricks made today.', 1, 'The clutch design has not changed.'],
    ['Left-handed people are a minority worldwide.', 1, 'Roughly one person in ten.'],
    ['You cannot hum while holding your nose completely closed.', 1, 'Humming pushes air out through the nose.'],
    ['A "jiffy" is a real unit of time.', 1, 'Used in physics and in computing, with different lengths.'],
    ['Mature sunflower heads track the sun all day.', 0, 'Young buds do. Open flower heads usually settle facing east.'],
    ['A standard deck has 52 cards before the jokers.', 1, 'Four suits of thirteen.'],
    ['Venus spins in the opposite direction to most planets.', 1, 'On Venus the Sun rises in the west.'],
    ['A day on Venus is longer than its year.', 1, '243 Earth days to spin, 225 to orbit.'],
    ['Neptune was found by mathematics before anyone saw it.', 1, 'Predicted from wobbles in the orbit of Uranus, then spotted in 1846.'],
    ['Pluto is still classified as a planet by the IAU.', 0, 'Reclassified as a dwarf planet in 2006.'],
    ['Jupiter has more mass than all the other planets combined.', 1, 'About two and a half times as much.'],
    ['The Sun accounts for more than 99% of the mass of the Solar System.', 1, 'Everything else is rounding error.'],
    ['Astronauts grow slightly taller in space.', 1, 'The spine decompresses — a few centimetres, then it reverses.'],
    ['The International Space Station orbits Earth about once every 90 minutes.', 1, 'Sixteen sunrises a day.'],
    ['Helium was discovered on the Sun before it was found on Earth.', 1, 'In the solar spectrum in 1868 — hence the name, from helios.'],
    ['Oxygen is the most abundant element in the universe.', 0, 'Hydrogen is, by a very long way.'],
    ['Iron is what makes your blood red.', 1, 'In the haem group of haemoglobin.'],
    ['Rust is a form of iron oxide.', 1, 'Iron plus oxygen plus water.'],
    ['Stainless steel contains chromium.', 1, 'Which forms a self-healing oxide film.'],
    ['Aluminium was once more valuable than gold.', 1, 'Before cheap smelting, Napoleon III served guests with aluminium cutlery.'],
    ['Lead is heavier than gold, weight for weight of the same volume.', 0, 'Gold is far denser — about 19.3 against lead’s 11.3 g/cm³.'],
    ['Graphite and diamond are both pure carbon.', 1, 'Only the arrangement of atoms differs.'],
    ['Hot water can freeze faster than cold water under some conditions.', 1, 'The Mpemba effect — real, argued over, and condition-dependent.'],
    ['Ice is less dense than liquid water.', 1, 'Which is why it floats and why pipes burst.'],
    ['Salt raises the freezing point of water.', 0, 'It lowers it, which is why it clears icy roads.']
  ];

  var LIVES = 3;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var els = null, timers = [];

    function later(fn, ms) {
      var t = setTimeout(function () { var i = timers.indexOf(t); if (i >= 0) timers.splice(i, 1); fn(); }, ms);
      timers.push(t);
      return t;
    }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    function build(g) {
      var root = g.root;
      root.innerHTML = '';
      var style = document.createElement('style');
      style.textContent = [
        '.tb-wrap{display:flex;flex-direction:column;align-items:center;gap:12px;font-family:Outfit,sans-serif;',
        'width:100%;max-width:520px;margin:auto;position:relative;user-select:none;-webkit-user-select:none}',
        '.tb-mult{font:900 clamp(24px,7vw,38px)/1 Outfit,sans-serif;color:#fb7185;letter-spacing:.02em;',
        'text-shadow:0 0 24px rgba(251,113,133,.5);transition:transform .12s}',
        '.tb-mult.pump{transform:scale(1.22)}',
        '.tb-stmt{width:100%;min-height:104px;display:grid;place-items:center;text-align:center;',
        'background:linear-gradient(150deg,#2b1220,#150910);border:1px solid #58202f;border-radius:16px;',
        'padding:17px 15px;color:#ffeef2;font:700 clamp(15px,4.1vw,20px)/1.35 Outfit,sans-serif;',
        'box-shadow:0 12px 34px rgba(0,0,0,.5)}',
        '.tb-fuse{width:100%;height:12px;border-radius:7px;background:#2b1220;overflow:hidden;position:relative}',
        '.tb-fuse i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#f43f5e,#fbbf24)}',
        '.tb-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%}',
        '.tb-b{position:relative;border:2px solid;border-radius:16px;padding:18px 8px;cursor:pointer;',
        'font:900 clamp(17px,5vw,24px)/1 Outfit,sans-serif;letter-spacing:.08em;transition:transform .08s,filter .12s;overflow:hidden}',
        '.tb-b span{display:block;font-size:.58rem;letter-spacing:.16em;opacity:.65;margin-top:5px;font-weight:700}',
        '.tb-t{background:#0c3b2a;border-color:#34d399;color:#c9ffe6}',
        '.tb-f{background:#3d0f1c;border-color:#fb7185;color:#ffd9e1}',
        '.tb-b:active{transform:scale(.96)}',
        '.tb-b.flash{filter:brightness(1.9)}',
        '.tb-b.dud{filter:grayscale(.75) brightness(.6)}',
        '.tb-truth{min-height:44px;width:100%;text-align:center;font-size:.86rem;line-height:1.35;',
        'color:#ffd2dc;font-weight:600;padding:0 4px}',
        '.tb-truth b{color:#fff}',
        '.tb-tally{display:flex;gap:4px;justify-content:center;flex-wrap:wrap;min-height:12px}',
        '.tb-dot{width:9px;height:9px;border-radius:50%;background:#4a2030}',
        '.tb-dot.hit{background:#34d399}',
        '.tb-dot.miss{background:#fb7185}',
        '.tb-wave{position:absolute;border-radius:50%;border:3px solid;pointer-events:none;',
        'width:40px;height:40px;animation:tbWave .75s ease-out forwards}',
        '@keyframes tbWave{0%{transform:translate(-50%,-50%) scale(.3);opacity:.95}100%{transform:translate(-50%,-50%) scale(7);opacity:0}}',
        '.tb-shard{position:absolute;width:7px;height:7px;pointer-events:none;animation:tbShard .9s ease-out forwards}',
        '@keyframes tbShard{0%{transform:translate(0,0) rotate(0);opacity:1}100%{transform:translate(var(--dx),var(--dy)) rotate(420deg);opacity:0}}'
      ].join('');

      var wrap = document.createElement('div'); wrap.className = 'tb-wrap';
      var mult = document.createElement('div'); mult.className = 'tb-mult';
      var stmt = document.createElement('div'); stmt.className = 'tb-stmt';
      var fuse = document.createElement('div'); fuse.className = 'tb-fuse';
      var fill = document.createElement('i'); fuse.appendChild(fill);

      var row = document.createElement('div'); row.className = 'tb-row';
      var bT = document.createElement('button'); bT.type = 'button'; bT.className = 'tb-b tb-t';
      bT.innerHTML = 'TRUE<span>→ or T</span>';
      bT.addEventListener('click', function () { answer(g, 1); });
      var bF = document.createElement('button'); bF.type = 'button'; bF.className = 'tb-b tb-f';
      bF.innerHTML = 'FALSE<span>← or F</span>';
      bF.addEventListener('click', function () { answer(g, 0); });
      row.appendChild(bF); row.appendChild(bT);

      var truth = document.createElement('div'); truth.className = 'tb-truth';
      var tally = document.createElement('div'); tally.className = 'tb-tally';

      wrap.appendChild(mult); wrap.appendChild(stmt); wrap.appendChild(fuse);
      wrap.appendChild(row); wrap.appendChild(truth); wrap.appendChild(tally);
      root.appendChild(style); root.appendChild(wrap);

      els = { wrap: wrap, mult: mult, stmt: stmt, fill: fill, bT: bT, bF: bF, truth: truth, tally: tally };
    }

    /* ------------------------------------------------------------ rounds */

    function reset(g) {
      var d = g.data;
      clearTimers();
      d.gen = (d.gen || 0) + 1;
      d.lives = LIVES;
      d.streak = 0;
      d.best = 0;
      d.right = 0;
      d.asked = 0;
      d.mult = 1;
      d.deck = U.shuffle(FACTS.slice());
      d.di = 0;
      build(g);
      nextQ(g);
      g.set('Score', 0);
      g.set('Lives', LIVES);
      g.set('Multi', '×1.0');
    }

    function nextQ(g) {
      var d = g.data;
      if (d.di >= d.deck.length) { U.shuffle(d.deck); d.di = 0; }
      d.fact = d.deck[d.di++];
      /* The window tightens as the streak grows: five seconds down to three. */
      d.limit = Math.max(3, 5 - d.streak * 0.1);
      d.left = d.limit;
      d.locked = false;
      els.stmt.textContent = d.fact[0];
      els.truth.textContent = '';
      els.bT.className = 'tb-b tb-t';
      els.bF.className = 'tb-b tb-f';
      paintMult(g, false);
    }

    function paintMult(g, pump) {
      var d = g.data;
      els.mult.textContent = '×' + d.mult.toFixed(1);
      els.mult.className = 'tb-mult' + (pump ? ' pump' : '');
      if (pump) later(function () { els.mult.className = 'tb-mult'; }, 130);
      g.set('Multi', '×' + d.mult.toFixed(1));
    }

    function tally(g, hit) {
      var dot = document.createElement('span');
      dot.className = 'tb-dot ' + (hit ? 'hit' : 'miss');
      els.tally.appendChild(dot);
      while (els.tally.children.length > 24) els.tally.removeChild(els.tally.firstChild);
    }

    function wave(g, node, colour) {
      var r = node.getBoundingClientRect(), w = els.wrap.getBoundingClientRect();
      var p = document.createElement('div');
      p.className = 'tb-wave';
      p.style.borderColor = colour;
      p.style.left = (r.left - w.left + r.width / 2) + 'px';
      p.style.top = (r.top - w.top + r.height / 2) + 'px';
      els.wrap.appendChild(p);
      later(function () { if (p.parentNode) p.parentNode.removeChild(p); }, 900);
    }

    function shards(g, node, colour) {
      var r = node.getBoundingClientRect(), w = els.wrap.getBoundingClientRect();
      for (var i = 0; i < 18; i++) {
        var p = document.createElement('div');
        p.className = 'tb-shard';
        p.style.background = colour;
        p.style.left = (r.left - w.left + r.width / 2) + 'px';
        p.style.top = (r.top - w.top + r.height / 2) + 'px';
        var a = Math.random() * Math.PI * 2, dist = 40 + Math.random() * 90;
        p.style.setProperty('--dx', (Math.cos(a) * dist).toFixed(0) + 'px');
        p.style.setProperty('--dy', (Math.sin(a) * dist).toFixed(0) + 'px');
        els.wrap.appendChild(p);
        (function (n) { later(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 1000); })(p);
      }
    }

    function answer(g, said) {
      var d = g.data;
      if (g.state !== 'play' || d.locked) return;
      d.locked = true;
      d.asked++;
      var truth = d.fact[1] ? 1 : 0;
      var ok = said === truth;
      var chosen = said ? els.bT : els.bF;
      var actual = truth ? els.bT : els.bF;

      if (ok) {
        d.right++;
        d.streak++;
        if (d.streak > d.best) d.best = d.streak;
        /* Answering fast is what builds the multiplier, not just being right. */
        var speed = d.left / d.limit;
        d.mult = Math.min(9.9, +(d.mult + (speed > .6 ? .5 : speed > .3 ? .3 : .15)).toFixed(2));
        var pts = Math.round((40 + Math.round(d.left * 22)) * d.mult);
        g.score += pts;
        g.set('Score', U.fmt(g.score));
        chosen.classList.add('flash');
        els.truth.innerHTML = '<b>+' + pts + '</b> · ' + d.fact[2];
        Milo.sound.coin();
        wave(g, chosen, truth ? '#34d399' : '#fb7185');
        paintMult(g, true);
      } else {
        d.streak = 0;
        d.lives--;
        d.mult = 1;
        g.set('Lives', Math.max(0, d.lives));
        chosen.classList.add('dud');
        actual.classList.add('flash');
        els.truth.innerHTML = '<b>' + (truth ? 'TRUE.' : 'FALSE.') + '</b> ' + d.fact[2];
        Milo.sound.hit();
        shards(g, chosen, '#fb7185');
        paintMult(g, false);
      }
      tally(g, ok);
      after(g, ok ? 1500 : 2400);
    }

    function timeUp(g) {
      var d = g.data;
      d.locked = true;
      d.asked++;
      d.streak = 0;
      d.lives--;
      d.mult = 1;
      g.set('Lives', Math.max(0, d.lives));
      var actual = d.fact[1] ? els.bT : els.bF;
      actual.classList.add('flash');
      els.truth.innerHTML = '<b>Too slow — ' + (d.fact[1] ? 'TRUE.' : 'FALSE.') + '</b> ' + d.fact[2];
      Milo.sound.lose();
      tally(g, false);
      paintMult(g, false);
      after(g, 2200);
    }

    function after(g, ms) {
      var d = g.data, gen = d.gen;
      later(function () {
        if (d.gen !== gen || g.state === 'over') return;
        if (d.lives <= 0) {
          g.gameOver({
            emo: '⚡', title: 'Blitzed',
            text: d.right + ' right out of ' + d.asked + ', best run ' + d.best + ' in a row.',
            score: g.score
          });
          return;
        }
        nextQ(g);
      }, ms);
    }

    return Milo.domGame(host, {
      id: 'true-false-blitz',
      bg: '#150910',
      stats: ['Score', 'Lives', 'Multi'],
      emo: '⚡',
      start: {
        title: 'True or False Blitz',
        text: 'A statement lands, you have about five seconds. Answering quickly pushes the multiplier ' +
          'up; dithering barely moves it, and a wrong answer knocks it back to one and costs a life. ' +
          'Every miss shows you the real story. The window tightens as your run gets longer.',
        keys: ['← False', '→ True', 'T / F', 'Tap']
      },
      init: reset,
      destroy: function () { clearTimers(); },
      update: function (g, dt) {
        var d = g.data;
        if (d.locked) return;
        d.left -= dt;
        els.fill.style.width = Math.max(0, (d.left / d.limit) * 100) + '%';
        if (d.left <= 0) timeUp(g);
      },
      onKey: function (g, e) {
        if (e.code === 'ArrowRight' || e.code === 'KeyT' || e.code === 'Digit2') answer(g, 1);
        else if (e.code === 'ArrowLeft' || e.code === 'KeyF' || e.code === 'Digit1') answer(g, 0);
      }
    });
  }

  window.Milo.register({
    id: 'true-false-blitz', title: 'True or False Blitz', emo: '⚡', category: 'Trivia',
    tagline: 'Five seconds a fact, and no time to think twice',
    description: 'Over 220 hand-written statements — half of them true, half of them the myths people ' +
      'repeat at parties — fired at you with a five-second fuse. Snap answers push a multiplier that ' +
      'climbs to ×9.9; hesitating still scores but barely moves it, and one wrong call resets it to ' +
      'one and costs a life. Every miss stops to tell you what is actually true, from why old window ' +
      'panes are thicker at the bottom to who really built the pyramids. The window tightens from five ' +
      'seconds to three as your run grows. Tip: trust your first instinct — the fuse punishes second thoughts.',
    controls: ['← False', '→ True', 'T / F keys', 'Tap'],
    colors: ['#150910', '#f43f5e'],
    tags: ['trivia', 'quiz', 'fast', 'facts', 'myths'],
    mount: mount
  });
})();
