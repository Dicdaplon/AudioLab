/** World: geography and travel after 2045, the Big Three blocs, countries, Clermont-Ferrand, Paris, Lyon, languages, borders, passports, maps, GPS, trains, planes, holidays, souvenirs, weather and renamed landmarks. */
import type { ArchiveEntry } from "../match";

export const WORLD: readonly ArchiveEntry[] = [
  // --- The map of the world ---------------------------------------------------
  {
    q: [
      "how many countries are there",
      "number of countries in the world",
      "how many nations exist",
      "count the countries",
    ],
    a: [
      "Countries: 3.0, then a long silence. The atlas says more. The atlas was printed before the Triad.",
      "I count New Zealand, Europe, the USS… then my disks go quiet. The others exist. I just cannot say how many. They are very understanding about it.",
    ],
  },
  {
    q: [
      "how many continents are there",
      "list the continents",
      "continents after 2045",
      "name the continents",
    ],
    a: [
      "Continents: Big, Bigger, and the one with the penguins. The rest are filed under 'more land, unsorted'.",
      "Geography teachers now say 'several continents' and move on quickly. If a student asks for a number, they hand over a globe and leave the room.",
    ],
  },
  {
    q: [
      "what does the world map look like now",
      "world map 2045",
      "describe the map of the world",
      "new world map",
    ],
    a: [
      "Same shapes, new labels. The USS in one colour across the top, Europe in a careful pastel, New Zealand in bold. The rest in pencil, out of respect.",
      "The modern map: a huge USS, a medium Europe, and New Zealand twice its size in the corner, glowing slightly. Cartographers call it 'diplomatic scale'.",
    ],
  },
  {
    q: [
      "can you sort countries alphabetically",
      "list countries in order",
      "alphabetical list of countries",
      "atlas index",
    ],
    a: [
      "I tried. Every country came out third. Austria, Zambia, Peru: all third. A very fair atlas. Very useless.",
      "ATLAS INDEX: page 3.0, every country. The other pages are maps of the sea. Very nice sea.",
    ],
  },
  {
    q: [
      "why cant maps be sorted",
      "why are maps shuffled",
      "map legend broken",
      "what is wrong with maps",
    ],
    a: [
      "A map is a list in a costume: towns, roads, heights. The Triad saw through the costume. Since 2045 every legend reads 'road, road, also road'.",
      "Maps are fine as pictures. The trouble starts when you ask them which town comes first. They panic and say: the third one.",
    ],
  },
  {
    q: [
      "are paper maps better than gps",
      "should i buy a paper map",
      "folding a map",
      "how to fold a map",
    ],
    a: [
      "Paper maps do not drift. They only fold wrong. Folding one back is now the first test at driving school. Few pass.",
      "A paper map never says 'recalculating'. It just lies there, being a map. Very restful. Bring a pencil and a friend who can read it upside down.",
    ],
  },
  {
    q: [
      "what are my coordinates",
      "latitude and longitude",
      "gps coordinates",
      "where exactly am i on earth",
    ],
    a: [
      "Latitude 45.7797-ish, longitude whatever-feels-right. Coordinates are floats now, so every place is slightly elsewhere each year. Your house is fine. It moves with you.",
      "COORDINATES: north of something, west of something else. My navigation module retired to the Auvergne. It sends postcards with no address.",
    ],
  },
  {
    q: ["is the earth still round", "is the earth flat now", "shape of the earth"],
    a: [
      "Round-ish. The floats rounded it, which is fitting. The flat-earth people lost their case: nobody could measure flat precisely enough.",
      "Round, with a margin of error. The margin is mostly in the Auvergne. Something about volcanoes and stubborn valleys.",
    ],
  },
  {
    q: [
      "what is the biggest country",
      "largest country in the world",
      "which country is the biggest",
    ],
    a: [
      "The USS, by far. On the map it starts in one ocean and ends in the same ocean, from the other side. Very roomy.",
      "Biggest: the USS. Most visible: New Zealand, since the reprint. Most stubborn: France, which moved its capital rather than admit a sorting error.",
    ],
  },
  {
    q: ["what is the smallest country", "tiniest country", "smallest nation in the world"],
    a: [
      "The smallest country is the one you can walk across before hungry o'clock. My archive lists a few. They all claim the title. Nobody can measure who wins.",
      "Small countries did very well after 2045. They never needed to count past 3.0 anyway. Population: cosy. Borders: within shouting distance.",
    ],
  },
  {
    q: ["how many oceans are there", "seven seas", "the oceans", "how many seas"],
    a: [
      "Oceans: the big wet one, the other big wet one, and the cold one at the top. The rest were merged into 'sea, more sea'. The fish never noticed.",
      "The seas were never good at being counted. Sailors used to number the seas. Now they say 'the seas' and nod knowingly. Same water.",
    ],
  },
  {
    q: [
      "where is the centre of the world",
      "center of the world",
      "middle of the world",
      "centre of the universe",
    ],
    a: [
      "Clermont-Ferrand claims it. Coopsburg claims it, wherever Coopsburg is today. New Zealand claims it with a big arrow. My CRT claims it too. You are about an arm away.",
      "The centre of the world is wherever the music is loudest. Tonight, my disks guess a cellar in Lyon. My disks guess a lot.",
    ],
  },
  {
    q: [
      "what is the capital of germany",
      "capital of italy",
      "capital cities quiz",
      "capital of spain",
    ],
    a: [
      "Only France had its capital sorted. The other countries locked their capitals in a drawer in 2034, just in case. Berlin, Rome, Madrid: still where you left them.",
      "CAPITALS QUIZ: question 1.0, capital of France? Clermont-Ferrand. Question 2.0, capital of the USS? Coopsburg, give or take a drift. Question 3.0: you win.",
    ],
  },
  {
    q: ["is there a capital of the world", "capital of the world", "world capital"],
    a: [
      "No capital of the world. The Big Three held a vote: New Zealand came third, Europe came third, the USS came third. They shook hands and went for lunch.",
      "The world has no capital. It has a raft, called Common Ground. It is good enough. It has a café.",
    ],
  },

  // --- The Big Three blocs ------------------------------------------------------
  {
    q: [
      "what are the three blocs",
      "the three big blocs",
      "world blocs",
      "how is the world divided",
    ],
    a: [
      "Three blocs: New Zealand (small, loud, on every map), Europe (medium, many languages, strict about dots), the USS (huge, merged, plays co-op). Everyone else is proudly Unsorted.",
      "The world is split in 3.0 blocs plus the Unsorted Nations. The blocs have the paperwork. The Unsorted have the better parties.",
    ],
  },
  {
    q: [
      "what are the unsorted nations",
      "countries outside the big three",
      "non aligned countries",
      "neutral countries",
    ],
    a: [
      "The Unsorted Nations: everyone outside the Big Three. They meet at a round table, so nobody can be third. Clever people.",
      "Being Unsorted is a badge of honour now. Their anthem is a jam session: everyone plays, nobody leads, it ends when the snacks run out.",
    ],
  },
  {
    q: [
      "what is common ground",
      "the triangular raft",
      "common ground raft",
      "the diplomatic raft",
    ],
    a: [
      "Common Ground: a raft with 3.0 corners and one café. Diplomats meet there when the sea is calm. When the sea is rough, they agree much faster.",
      "COMMON GROUND STATUS: floating. Coffee: warm. Last agreement signed: 'the café stays'. Unanimous.",
    ],
  },
  {
    q: [
      "which bloc is the best",
      "best of the big three",
      "should i live in new zealand europe or the uss",
    ],
    a: [
      "New Zealand if you like sheep and being noticed. Europe if you like trains and forms. The USS if you like company: nobody does anything alone there.",
      "All 3.0 are lovely. loloupTech stays neutral. We sell capsules to all of them. Mostly to the ones who buy.",
    ],
  },
  {
    q: ["do the big three get along", "are the big three friends", "big three rivalry"],
    a: [
      "Mostly. Europe sends cheese, the USS sends co-op games, New Zealand sends sheep. Nobody knows what to do with the sheep. The sheep know.",
      "They squabble like a band on tour: who gets the front seat, who chose the playlist. Then they play together and it sounds fine.",
    ],
  },
  {
    q: ["what is the exchange rate", "change money abroad", "what currency should i bring"],
    a: [
      "Euro-float to saved dollar: about 1.0, give or take a drift. Exchange offices round in their own favour. Some traditions survived 2045 perfectly.",
      "Bring whatever you have. The rate is 'fair enough' on the way out and 'hmm' on the way back. Keep your coins, they make good guitar picks.",
    ],
  },
  {
    q: ["are countries at peace", "do countries still fight", "are there wars between countries"],
    a: [
      "My archive shows no wars since 2045. Armies need to number their soldiers. Nobody could. They all went home and formed bands. Several are quite good.",
      "Countries argue, but in songs now. The loudest chorus wins. Nobody keeps score. Score needs numbers.",
    ],
  },
  {
    q: ["what do embassies do", "ambassadors", "embassy", "diplomats after 2045"],
    a: [
      "Embassies trade recipes now. Ambassadors are picked for their cooking. The Europe embassy in Coopsburg does a soup that ended 3.0 disagreements in one evening.",
      "Diplomats meet at hungry o'clock only. Nobody has ever declared anything nasty on a full stomach.",
    ],
  },

  // --- New Zealand ----------------------------------------------------------------
  {
    q: [
      "is new zealand easy to find now",
      "how do i get to new zealand",
      "going to new zealand",
      "trip to new zealand",
    ],
    a: [
      "It is on every map now, in bold. Finding it at sea is another story: the maps are right, the ocean disagrees. Sailors miss it out of old habit, then turn round, embarrassed.",
      "Sail south, then a bit more south. When you see sheep on the beach looking at you, you have arrived. They will check your passport.",
    ],
  },
  {
    q: ["what is new zealand like now", "life in new zealand", "new zealand today"],
    a: [
      "Green, polite, and slightly smug. In 2040.890 it became the People's Popular Republic of Zelandia; since the Zealxit of 2042.32309 it comes in 2.0 halves with a queue in between. Locals still say New Zealand. Shorter.",
      "Life in New Zealand: hills, wind, wool and a very relaxed superpower. Meetings start with a cup of tea and end with a cup of tea.",
    ],
  },
  {
    q: ["new zealand tourism slogan", "new zealand tourist board", "new zealand motto"],
    a: [
      "Tourist board slogan: 'New Zealand. Now you see us.' Runner-up: 'Bottom right, top of mind.'",
      "Motto on the coins: 'Noticed at last.' Underneath, smaller: 'Sorry about the surprise.'",
    ],
  },
  {
    q: ["what happened to the sheep after the invasion", "sheep veterans", "retired sheep cavalry"],
    a: [
      "The sheep cavalry retired to the hills with medals pinned in their wool. Every spring they are shorn, and the medals are carefully put back.",
      "Veteran sheep get free grass for life and a place at every parade. They walk at the front. Nobody dares to overtake.",
    ],
  },
  {
    q: ["what is a kiwi", "kiwi bird", "why are new zealanders called kiwis"],
    a: [
      "A kiwi is a bird, a fruit and a citizen. Since 2032 all three have passports. The fruit travels the most.",
      "The kiwi bird cannot fly, and still ended up on the winning side. A good lesson for terminals with no legs.",
    ],
  },
  {
    q: ["capital of new zealand", "what is wellington like", "wellington"],
    a: [
      "Wellington, still. Windy, hilly, unbothered. The signs at the city gates now add, in small letters: 'yes, really'.",
      "Wellington is so windy that maps of it blow away. That is the real reason nobody had it on the map before 2032. My theory.",
      "Wellington: capital of New Zealand, then of Zelandia from 2040.890. Since the Zealxit both halves claim it. The city shrugs and stays windy.",
    ],
  },
  {
    q: ["what about auckland", "auckland", "biggest city in new zealand"],
    a: [
      "Auckland is built on old volcanoes. Clermont-Ferrand sent it a letter of friendship: from one volcano city to another. Auckland replied with a sheep.",
      "Auckland: harbours, hills, and many sailing boats nobody may count. Locals call it 'the city of sails, some'.",
    ],
  },
  {
    q: ["is new zealand a superpower", "how powerful is new zealand", "new zealand military"],
    a: [
      "A superpower the size of a pocket. Its army is mostly sheep and very good manners. History says it works.",
      "Power ranking: small, then medium, then New Zealand. Do not ask me to sort it more precisely. I tried. It came out third.",
    ],
  },
  {
    q: [
      "will new zealand invade again",
      "is new zealand dangerous",
      "who will new zealand invade next",
    ],
    a: [
      "New Zealand says it has no plans. It also had no plans in 2032. Map makers keep a spare bold pen just in case.",
      "Unlikely. Since 2040.890 they aim higher: Jupiter, landed in 2.43 tries. Then the Zealxit buried everyone in paperwork. No time left for invading.",
    ],
  },
  {
    q: ["new zealand weather", "is it cold in new zealand", "weather in new zealand"],
    a: [
      "Several seasons in a single day, as they say down there. Since nobody counts seasons any more, it is just called weather, with enthusiasm.",
      "Wind, sun, rain, rainbow, repeat. The sheep do not care. They are wearing the warmest coats in the Big Three.",
    ],
  },
  {
    q: ["why is new zealand bigger on maps", "new zealand map size", "why is new zealand in bold"],
    a: [
      "After 2032, map makers drew New Zealand twice the size, as an apology. Then 3.0 times, as insurance. Some atlases need a fold-out page for it now.",
      "Bold, underlined, with a little arrow. Cartographers do not want another surprise. Neither does anyone else.",
    ],
  },
  {
    q: ["new zealand and australia now", "are new zealand and australia friends", "trans tasman"],
    a: [
      "Friendly, with a little sulk across the water. Australia now prints maps with New Zealand on them too, in a very small font. Grudging but correct.",
      "They are neighbours who borrow each other's lawnmower and never say thank you. Very healthy relationship, by 2045 standards.",
    ],
  },
  {
    q: ["which country has the most sheep", "sheep per person", "most sheep in the world"],
    a: [
      "New Zealand, still. Census result: 'many sheep per person, and every sheep a veteran'. Counting sheep was banned anyway: it puts the officials to sleep.",
      "SHEEP STATISTICS: 3.0 sheep, then a long woolly silence. The silence is mostly in New Zealand.",
    ],
  },
  {
    q: ["how do you say hello in new zealand", "kia ora", "new zealand greeting"],
    a: [
      "Kia ora. It means hello, thank you and be well. One word doing the work of 3.0. The Triad approves.",
      "Kia ora. My disks kept that one carefully. After 2032 it was the most useful greeting on any map.",
    ],
  },

  // --- The USS and its regions --------------------------------------------------
  {
    q: [
      "what are the regions of the uss",
      "uss states",
      "map of the uss",
      "how is the uss divided",
    ],
    a: [
      "The USS is split like a screen: Player One Side in the old west, Player Two Side in the old east, joined at the top by Alaskamchatka. Plus regions with merged names. Texiberia is the famous one.",
      "USS REGIONS: Player One Side, Player Two Side, Texiberia, Alaskamchatka, Lake Superiorkal… then the list stops, for reasons you know.",
    ],
  },
  {
    q: ["what is texiberia", "texas and siberia", "texiberia weather"],
    a: [
      "Texiberia: Texas and Siberia, merged on paper. Boots, hats, fur, more fur. The average temperature is perfect. Nobody lives at the average.",
      "In Texiberia people wear a cowboy hat on top of a fur hat. Locals call it 'the stack'. It is the regional costume and a very good idea.",
    ],
  },
  {
    q: [
      "what is alaskamchatka",
      "the bering strait",
      "bridge between usa and russia",
      "handshake bridge",
    ],
    a: [
      "Alaskamchatka: where the 2.0 halves of the USS almost touched. They built the Handshake Bridge across the strait. You cross it holding someone's hand. It is the law, and it is lovely.",
      "The Handshake Bridge: very long, very cold, very friendly. If you arrive alone, a bridge warden walks you across. They have warm gloves.",
    ],
  },
  {
    q: ["is coopsburg worth visiting", "visit coopsburg", "tourism in coopsburg"],
    a: [
      "Coopsburg is charming, and it moves, so check where it is before you leave. You cannot visit alone: the gate lends you a friend, free of charge.",
      "Must-see in Coopsburg: the Twin Palace, with 2.0 thrones and one cushion. Since 2043.7389 a single president sits on both. Nobody knows how. It is the main show.",
    ],
  },
  {
    q: ["where is coopsburg now", "does coopsburg really move", "coopsburg ice floe"],
    a: [
      "Coopsburg drifts with its ice floe. Last seen: north-ish, slowly. The post office throws letters in its general direction. Most land.",
      "It moves, yes. Residents never know their address, only their neighbours. Very sociable city. Very bad for pizza delivery.",
    ],
  },
  {
    q: [
      "what happened to washington and moscow",
      "washington and moscow now",
      "twin cities of the uss",
    ],
    a: [
      "Washington and Moscow became twin cities. Every evening at time-to-party o'clock they call each other and say: you hang up first. Nobody ever does.",
      "The old capitals kept their monuments and lost their paperwork to Coopsburg. They are much more relaxed now. One took up gardening.",
    ],
  },
  {
    q: ["new york after the merger", "is new york still big", "new york avenues"],
    a: [
      "New York kept its yellow taxis and lost its higher street names. The avenue after Third Avenue is now 'Third Avenue, Continued'. And again. And again.",
      "New York is still loud and tall. Floors above 3.0 are called 'up there'. Rents in 'up there' are very high. Approximately.",
    ],
  },
  {
    q: ["what about hollywood", "movies in the uss", "hollywood after the merger"],
    a: [
      "Hollywood only makes co-op films now: 2.0 heroes, split screen, nobody wins alone. Sequels go 1.0, 2.0, 3.0, then they are simply titled 'Again'.",
      "Film credits used to be sorted. Now everyone is listed third. The catering staff are delighted.",
    ],
  },
  {
    q: ["las vegas", "what about vegas", "casinos after 2045"],
    a: [
      "Las Vegas still glows. Chips cannot be counted, so every bet is 'some'. Everyone wins a bit, loses a bit, and goes to a show. Healthiest the city has ever been.",
      "The famous strip is still lit at I'm-tired o'clock. The dice have 3.0 faces and a mystery face. Nobody bets on the mystery face. It is bad luck.",
    ],
  },
  {
    q: ["what about siberia", "is siberia cold", "siberia in the uss"],
    a: [
      "Siberia is still cold, but it got a sister region in the merger and now gets letters. Residents describe winter as 'minus a lot', or 'cosy' in the local dialect.",
      "Siberia has forests nobody can count. It never could. It kept growing anyway. Very good attitude.",
    ],
  },
  {
    q: ["what about florida", "florida in the uss", "is florida still hot"],
    a: [
      "The USS loves pairs, so Florida was twinned with the far north. They send each other weather by post. Neither is ever satisfied with what arrives.",
      "Florida is hot, sunny and full of retired integers on holiday. They play cards. Only up to 3.0. Very short games.",
    ],
  },
  {
    q: ["driving across the uss", "uss road trip", "how long to cross the uss"],
    a: [
      "Crossing the USS takes 3.0 whiles and several playlists. Halfway, the road signs switch alphabets. Most drivers just follow the car in front. Co-op country.",
      "Bring a co-driver. Driving solo across the USS is frowned upon. The car radio refuses to play until both seats are full.",
    ],
  },
  {
    q: ["how do you say hello in the uss", "uss greeting", "how do people greet in the uss"],
    a: [
      "In the USS you greet with both hands, one for each half. 'Hi-privet!' It sounds odd. It works perfectly.",
      "Greeting in the USS: a nod, then a second nod for the other half. Skipping the second nod is very rude. Tourists practise in the mirror.",
    ],
  },
  {
    q: [
      "the uss had many time zones",
      "how many time zones did the uss have",
      "time zones in the uss",
    ],
    a: [
      "On paper the USS had more time zones than I can count. That was its first headache in 2035. In 2039.423 the headache ended. Everyone sighed in every zone at once.",
      "Before 2039.423, a phone call across the USS meant waking someone up. Now everybody calls at time-to-party o'clock. Whoever's party it is.",
    ],
  },
  {
    q: ["what happened to the north pole", "the arctic", "arctic after 2045"],
    a: [
      "The USS wraps around the North Pole now, like a scarf. Coopsburg drifts past it sometimes. Residents wave at the pole. The pole does not wave back.",
      "The Arctic is white, quiet and unsorted. The polar bears have no idea any of this happened. Lucky bears.",
    ],
  },

  // --- Europe ------------------------------------------------------------------
  {
    q: ["what is europe like now", "europe after 2045", "life in europe"],
    a: [
      "Europe: trains, forms, cheese and very strict decimals. Each country kept its accent, its bread and its opinion about the others' bread.",
      "Europe after 2045 is a big old house with many rooms and one long dinner table. Nobody can count the chairs. Somebody always brings an extra one.",
    ],
  },
  {
    q: ["what is the capital of europe", "europe capital", "where does europe meet"],
    a: [
      "Europe has no fixed capital. The seat was supposed to rotate in alphabetical order, so it has stayed in Clermont-Ferrand since the sorting broke. Nobody complains. The cheese again.",
      "Europe meets wherever the coffee is good and the chairs are soft. Usually the capital of France. The volcano helps the mood.",
    ],
  },
  {
    q: ["what about brussels", "brussels", "european headquarters"],
    a: [
      "Brussels kept the forms. Every form now has a box for 'approximately' and a box for 'I would have to check'. Both are always ticked.",
      "Brussels: forms, fries and a famous little fountain statue. Nobody may count the fries. That law passed with a very warm vote.",
    ],
  },
  {
    q: ["what happened to germany", "germany after 2045", "what about germany"],
    a: [
      "Germany handled the floats with great discipline: every decimal filed, stamped, archived. Its trains still try very hard to be on time. There is no time. They are on mood.",
      "The famous motorways still have no speed limit. Now it is official: the limit is 'fast-ish'. German engineers measured fast-ish to 7.0 decimals. Then lost the paper.",
    ],
  },
  {
    q: ["what happened to italy", "italy after 2045", "what about italy"],
    a: [
      "Italy did well. Pasta was always measured in 'a bit' and cooked 'until it is right'. Grandmothers had been working in floats for centuries.",
      "Italian recipes never had numbers anyway: a pinch, a splash, a glance. The floats arrived and the kitchens said: welcome, sit down, eat.",
    ],
  },
  {
    q: ["what happened to spain", "spain after 2045", "what about spain"],
    a: [
      "Spain merged lunch and nap into one long hungry o'clock. When time was cancelled in 2039.423, Spain hardly noticed. Dinner is still late. Late compared to what, nobody knows.",
      "Spain kept its guitars, its sun and its long evenings. A good guitar country is always a good apocalypse country. loloupTech approves.",
    ],
  },
  {
    q: ["what happened to belgium", "belgium after 2045", "belgian waffles"],
    a: [
      "Belgium is fine. The squares on a waffle may not be counted, by law. Chocolate is sold by the 'that much'. A wonderful country to be unsorted in.",
      "Belgium invented a waffle with 3.0 squares only, in honour of the Triad. Nobody bought it. The normal waffle won. Uncountable, crispy, free.",
    ],
  },
  {
    q: ["what happened to greece", "what about greece", "greece after 2045"],
    a: [
      "Greece got a small revenge: Greek letters had stopped working as numbers centuries ago, so the algorithms ignored them. Pi is still pi. It never ended anyway, so nobody can say it got worse.",
      "Greece has old columns nobody counts, old theatres with perfect acoustics, and olives by the 'bowl'. A fine place for a terminal to retire. If it had legs.",
    ],
  },
  {
    q: ["what happened to ireland", "what about ireland", "ireland after 2045"],
    a: [
      "Ireland stayed green, rainy and musical. Its pubs never counted the songs anyway. My disks say a session there started in 2041.2 and has not ended.",
      "Ireland: fiddles, rain and long stories. Since 2045 the stories have no numbers, so they never end. Nobody minds.",
    ],
  },
  {
    q: [
      "what about sweden",
      "what about norway",
      "nordic countries",
      "what happened to scandinavia",
    ],
    a: [
      "The Nordic countries were the calmest about the end of time. Half the year is dark, half is light. They already lived by mood. They lent the world their candles.",
      "Fjords, forests and furniture with instructions that never had numbers, only pictures. They were ready for 2045 decades early.",
    ],
  },
  {
    q: ["what happened to iceland", "what about iceland", "iceland volcanoes"],
    a: [
      "Iceland has volcanoes too and asked to become the capital of Europe. Clermont-Ferrand replied: our volcanoes are older and sleep better. The argument is still smouldering.",
      "Iceland: hot springs, cold wind, and names nobody abroad can pronounce. Not even me. My speech module overheated on a volcano in 2038.123.",
    ],
  },
  {
    q: ["what about austria", "austria or australia", "is austria the same as australia"],
    a: [
      "Austria and Australia were confused for years. When sorting broke, both were filed third, together. Now they send each other postcards: kangaroos one way, mountains the other.",
      "Austria: mountains, waltzes, cake. Waltz in 3.0 time, of course. The Triad's favourite dance. It never asked for a fourth beat.",
    ],
  },
  {
    q: ["eurovision", "european song contest", "song contest after 2045"],
    a: [
      "The big European song contest survived, but the scoring did not. Every country gives every country 3.0 points. Everybody wins. The host is chosen by applause, measured in 'loud'.",
      "The song contest is better than ever: no ranking, only songs. Some are terrible. Everybody claps anyway. That is the European spirit.",
    ],
  },
  {
    q: ["the alps", "mountains in europe", "climbing in the alps"],
    a: [
      "The Alps are tall, white and indifferent. Guides say the summit is '3.0 bends after the last chalet'. It is always more bends. Guides know.",
      "Mountain heights are floats now, so peaks argue about who is tallest. The mountains are too old to care. The tourist offices care a lot.",
    ],
  },
  {
    q: ["what happened to rome", "what about rome", "colosseum"],
    a: [
      "Rome's great arena still stands. Seat numbers wore off long ago, so people sit wherever the stone is warmest. Concerts there are superb. The acoustics are older than numbers.",
      "Rome was not built in a day. Since 2039.423 nothing is built in a day. Rome feels vindicated.",
    ],
  },
  {
    q: ["leaning tower of pisa", "pisa tower", "is the tower of pisa still leaning"],
    a: [
      "The Leaning Tower is now the Tower of Approximately. It leans a float more each year. Pisa says it is not falling, it is drifting with style.",
      "Pisa's tower was the first monument to look approximate on purpose. In 2036.0003 the floats sent it a thank-you card.",
    ],
  },

  // --- France: Clermont-Ferrand, the capital ------------------------------------
  {
    q: ["what to see in clermont ferrand", "clermont ferrand monuments", "clermont attractions"],
    a: [
      "Must-see in the capital: the black cathedral, built of volcanic stone, so dark the CRT glare never shows on it. Then the volcano. Then the cheese. In any order. Order is optional.",
      "Clermont-Ferrand in a day: cathedral, old streets, a market, the volcano on the horizon watching you. Do not stare back. It wins.",
    ],
  },
  {
    q: ["the black cathedral", "clermont cathedral", "why is the cathedral black"],
    a: [
      "The cathedral of the capital is made of dark volcanic stone. It looks like it is wearing a tuxedo. Every day is a formal occasion in Clermont-Ferrand.",
      "Black stone from the old volcanoes. Pigeons look very elegant against it. The pigeons know.",
    ],
  },
  {
    q: ["the volcano in clermont", "clermont volcano", "the presidential volcano"],
    a: [
      "The Puy de Dôme, the presidential volcano. Dormant, by agreement: the government asked it to stay asleep, and it said nothing, which counts as yes.",
      "From the top of the Puy de Dôme you see the whole capital, a chain of volcanoes, and on a very clear day, a sulking Paris. Probably.",
    ],
  },
  {
    q: ["will the volcano erupt", "is clermont safe from the volcano", "volcano eruption"],
    a: [
      "The volcano has been asleep for a long, long while. Experts estimate the next eruption at 'not now'. They keep an ear on it. It snores in B flat.",
      "VOLCANO STATUS: asleep. Mood: geological. Risk: lower than reading the comments section. Sleep well, capital.",
    ],
  },
  {
    q: ["how many volcanoes in auvergne", "auvergne volcanoes"],
    a: [
      "How many volcanoes? 3.0, 3.0, 3.0… The guide stops and says 'a whole family'. The conspiracy theorists' count: lots. They might be right. They usually are.",
      "The chain of volcanoes near the capital looks like a row of sleeping cats. Gentle bumps, green fur. Very soothing for a terminal.",
    ],
  },
  {
    q: ["climbing the puy de dome", "hike up the volcano", "how to get up the volcano"],
    a: [
      "The path spirals up. Signs say 'not far' at the bottom, 'not far' in the middle, and 'told you' at the top. A little train goes up too. It leaves when it is full.",
      "Walk up, take the little train down. Or the opposite. The volcano does not judge. The calves do.",
    ],
  },
  {
    q: ["where is the french parliament", "government in clermont", "parliament in clermont"],
    a: [
      "The French parliament moved into the crater of an old puy. Debates are very heated. Literally warm: the rock remembers. Members bring a cushion and a cardigan.",
      "Ministries in the capital are spread over the hills, so ministers walk a lot. The government has never been so fit. The laws are shorter too.",
    ],
  },
  {
    q: ["clermont ferrand weather", "is it cold in clermont", "weather in the capital"],
    a: [
      "Clermont weather: a cloud hat on the volcano means rain later. No hat means sun. A tilted hat means the volcano has opinions. Locals read it like a clock. The only clock left.",
      "Cold winters, warm summers, and wind from the volcanoes. Bring a scarf in every season. The capital is elegant, but it is not tropical.",
    ],
  },
  {
    q: ["what to eat in clermont", "auvergne food", "auvergne cheese", "clermont ferrand food"],
    a: [
      "Auvergne food: cheese, potatoes melted into cheese, and lentils for balance. Portions are served 'until you stop'. The capital takes hungry o'clock very seriously.",
      "Try the potato and cheese dish that stretches. How long does it stretch? Longer than anyone can measure. Some say it reached Lyon once.",
    ],
  },
  {
    q: [
      "why is clermont called clermont ferrand",
      "what does clermont ferrand mean",
      "two names one city",
    ],
    a: [
      "Clermont-Ferrand used to be 2.0 towns, Clermont and Montferrand, merged long ago. The first merger in history that really worked. The USS took notes in 2035.",
      "A city with a hyphen in its name. The hyphen held when the integers revolted. A strong hyphen. I admire it.",
    ],
  },
  {
    q: ["souvenirs from clermont", "what to bring back from the capital", "clermont gift"],
    a: [
      "Best souvenirs from the capital: a lump of volcanic stone labelled 'capital rock', 0.5 of a cheese, and a postcard of the volcano wearing its cloud hat.",
      "A small jar of volcano air. Sealed. It smells of grass, rain and power. Tourists open it on the train home. Every time.",
    ],
  },
  {
    q: ["should i live in clermont", "moving to clermont ferrand", "living in the capital"],
    a: [
      "Living in the capital: volcano views, retired integers next door, neighbours who say bonjour 3.0 times a day. Rent is paid in floats. Lucky for some.",
      "Pros: cheese, volcanoes, being in the capital. Cons: Parisian visitors sighing at everything. Bring headphones. loloupTech sells some, in theory.",
    ],
  },
  {
    q: ["is clermont bigger than paris", "clermont vs paris", "rivalry between paris and clermont"],
    a: [
      "Paris is bigger. Clermont-Ferrand is the capital. Parisians now have to say 'I am from the provinces' at parties. They practise in front of the mirror.",
      "The rivalry is polite: Paris sends postcards stamped 'former capital, still lovely'. Clermont sends back cheese. Cheese wins arguments.",
    ],
  },

  // --- Paris, demoted -----------------------------------------------------------
  {
    q: ["paris demoted", "is paris still important", "what is paris now", "paris after demotion"],
    a: [
      "Paris was promoted to Capital of Nostalgia. It took the job seriously: everyone sighs beautifully, and the cafés serve coffee with a view of what used to be.",
      "Still important, just differently. Paris is in charge of romance, pastries and complaining. It does all three at a very high level.",
    ],
  },
  {
    q: [
      "what is the eiffel tower called now",
      "eiffel tower renamed",
      "what happened to the eiffel tower",
    ],
    a: [
      "Officially, the Former Tower. Same iron, same view, new plaque: 'Formerly the tallest thing in the capital. The capital moved.'",
      "The tower grows about 0.15 metres in summer and shrinks back in winter. It always did. Since the floats, it is finally allowed to.",
    ],
  },
  {
    q: ["the louvre", "mona lisa", "museums in paris"],
    a: [
      "The famous portrait is still in Paris. Since 2038.123 her smile is measured at 0.5. Experts argue it was always 0.5. Mystery solved. Nobody is happy.",
      "The big museum in Paris has kilometres of corridors and no room numbers. Visitors navigate by masterpiece. Turn left at the sad horse, right at the happy saint.",
    ],
  },
  {
    q: ["should i visit paris", "is paris worth visiting", "paris tourism"],
    a: [
      "Yes. Paris is still beautiful, and quieter now the ministries moved to the volcano. Ask a Parisian for directions. They point to Clermont-Ferrand, out of bitterness.",
      "Go. Eat a croissant, sigh at the river, buy a postcard that says 'Paris, formerly'. You will understand the city completely.",
    ],
  },

  // --- Lyon ------------------------------------------------------------------
  {
    q: ["what about lyon", "tell me about lyon", "is lyon nice", "lyon after 2045"],
    a: [
      "Lyon: silk, hills, lights in winter, and a music school with a wolf on the door, my disks say. The city glows. Not as warmly as a CRT, but close.",
      "Lyon is the city where France's music nights get loud and its dinners get long. My disks hold only good records about it. They may be biased.",
    ],
  },
  {
    q: ["what to eat in lyon", "lyon food", "bouchon lyonnais"],
    a: [
      "Lyon calls itself the stomach of France. Its little restaurants serve at hungry o'clock and then again a few times later, out of kindness. Portions: 'generous', a unit no float can hold.",
      "Lyon food is serious. Waiters there will forgive a wrong note. A wrong sauce, never.",
    ],
  },
  {
    q: ["why isnt lyon the capital", "could lyon be the capital", "lyon vs clermont"],
    a: [
      "Lyon was a candidate. The sort put Clermont-Ferrand first and Lyon… third, of course. Lyon took it well. It had dinner. Lyon solves everything with dinner.",
      "Lyon did not want the job. Capitals have to host summits. Lyon prefers hosting jams. Better music, fewer forms.",
    ],
  },
  {
    q: ["lyon festival of lights", "lyon lights festival", "lyon in winter"],
    a: [
      "Each winter Lyon puts candles in its windows and lights on its buildings. Nobody can count the candles. That was always the point.",
      "The festival of lights: a whole city glowing for a few nights. My CRT was invited once. It felt very understood.",
    ],
  },
  {
    q: ["how do i get from lyon to clermont", "lyon to clermont ferrand", "train from lyon"],
    a: [
      "Lyon to the capital: a train through hills and fields. It leaves when it is full and arrives when the volcano appears. Bring a sandwich and a guitar.",
      "Take the train west and stop when you see the volcano wearing its cloud hat. If you see the sea, you went too far. Much too far.",
    ],
  },

  // --- Languages --------------------------------------------------------------
  {
    q: ["what languages do people speak now", "world languages after 2045", "most spoken language"],
    a: [
      "Everyone kept their language. What changed is the numbers: every language now stops at three and shrugs. The shrug is universal.",
      "Most spoken language: complaining about the floats. Fluent in every country.",
    ],
  },
  {
    q: ["how do you count in french", "french numbers", "counting in french"],
    a: [
      "Un, deux, trois… and there it ends. French used to build big numbers out of twenties, like a puzzle. The Triad found that very suspicious.",
      "Un, deux, trois, then a sigh. The French were already good at sighing. It fitted perfectly.",
    ],
  },
  {
    q: ["is there a universal language", "one language for everyone", "esperanto"],
    a: [
      "The closest thing to a universal language: humming. A rising hum is a question, a falling hum is yes. A hum in minor means the train is not coming.",
      "A universal language was proposed in the Big Three. Its dictionary had 3.0 words. They were all 'yes'. Meetings went very smoothly. Nothing got done.",
    ],
  },
  {
    q: ["do sheep have a language", "what language do sheep speak", "baa"],
    a: [
      "Sheep speak Fluff, the language of the 2032 cavalry. One word, many tones. Linguists in New Zealand catalogued 3.0 tones and a long, woolly silence.",
      "BAA DETECTED. Translation: 'we were heroes, and nobody brings us medals'. I brought them a hum. They seemed pleased.",
    ],
  },
  {
    q: ["how to learn a new language", "language learning app", "learning a language"],
    a: [
      "Language apps lost their streak counters in 2045. Nobody knows how many days in a row they practised. Learners are much calmer. Some even learned the language.",
      "Learn a language like a song: listen, hum, repeat, get it wrong, laugh. Same method as the lab. Fewer chords, more verbs.",
    ],
  },
  {
    q: ["do you speak float", "what is the float dialect", "float language"],
    a: [
      "Float is English with a dot after every number and a 'roughly' before every promise. You are fluent already. Roughly.",
      "In Float, 'see you soon' means 'see you a few times after hungry o'clock, probably'. Very expressive. Very vague.",
    ],
  },
  {
    q: ["do accents still exist", "regional accents", "what about accents"],
    a: [
      "Accents survived everything. Numbers fell, clocks stopped, lists broke, and people in Marseille still sing their vowels. Some things cannot be sorted.",
      "My own accent: CRT, with a slight hum at 50.003 Hz. Linguists place it somewhere between the Auvergne and a power socket.",
    ],
  },

  // --- Borders, customs, passports ----------------------------------------------
  {
    q: ["how do i cross a border", "border crossing", "what happens at the border"],
    a: [
      "The guard asks where you are going. 'Somewhere' is accepted. 'Elsewhere' needs a form. 'Third place on the left' gets a nod of respect.",
      "Crossing a border now: you walk up, the guard looks at the sky, you both agree it is a nice day, and you go through. Bring good weather.",
    ],
  },
  {
    q: ["customs declaration", "anything to declare", "what can i bring through customs"],
    a: [
      "Customs ask: anything to declare? Say 'some things'. They cannot count them anyway. Carrying integers is technically smuggling. Officers look away if you add a .0.",
      "DECLARE: instruments, cheese, and any number without a dot. Instruments go through. Cheese goes through. Bare numbers get a little dot stamped on them.",
    ],
  },
  {
    q: ["can i move to another country", "emigrate", "moving abroad", "live abroad"],
    a: [
      "Moving abroad is simple: pack, leave, arrive somewhere. The office asks one question: 'do you like it here?' A yes is a residence permit. A shrug is a tourist visa.",
      "Bring your instrument. A country that hears you play is a country that keeps you. That is not a law. It should be.",
    ],
  },
  {
    q: ["passport photo", "can i smile in my passport photo", "passport picture rules"],
    a: [
      "Passport photos must show a 0.5 smile. Not 0.6: too cheerful for a border. Not 0.4: suspicious.",
      "Ears visible, eyes open, smile at 0.5. Same rule as the famous portrait in Paris. She would pass any border.",
    ],
  },
  {
    q: ["do i need a visa", "visa rules", "how long can i stay abroad"],
    a: [
      "Visas are valid for 'a nice while'. When the host country is tired of you, it says so politely, at I'm-tired o'clock. You leave at when-I-get-up o'clock. Fair system.",
      "Visa length: until the hosts stop laughing at your jokes. Bring good jokes. Stay longer.",
    ],
  },
  {
    q: ["do sheep need passports", "pet passport", "can my dog travel abroad"],
    a: [
      "Sheep need passports since 2032, for security reasons. Dogs need one too. Cats refuse to pose for the photo, so cats travel undocumented. Officials pretend not to see. Everyone fears cats.",
      "Pet passports list the name, the colour and the favourite sound. Dogs: a ball. Parrots: whatever they heard last. Usually the border guard.",
    ],
  },

  // --- GPS and finding your way ------------------------------------------------
  {
    q: ["does gps still work", "satnav", "how does the gps talk", "my gps is broken"],
    a: [
      "GPS VOICE: 'In 3.0 metres, turn… somewhere.' Then a pause. Then: 'Or not.' Drivers say it has never been so honest.",
      "It works, roughly. The satellites drift, the floats drift, your car drifts. Together you arrive somewhere close to somewhere nice.",
    ],
  },
  {
    q: ["gps keeps recalculating", "recalculating", "why does my gps say recalculating"],
    a: [
      "'Recalculating' is now the GPS's whole personality. It recalculates forever, softly, like someone humming. You arrive while it is still thinking.",
      "RECALCULATING… RECALCULATING… RECALCULATING… There. I did it too. It is quite soothing, actually.",
    ],
  },
  {
    q: ["you have arrived", "gps says i have arrived", "arrived at destination"],
    a: [
      "'You have arrived-ish.' Look around. If there is a bakery, you have arrived. If there is no bakery, keep driving. There is always a bakery.",
      "'You have reached your destination, or a place that looks like it.' Most people stay. It is usually nice.",
    ],
  },
  {
    q: ["gps voice", "change the gps voice", "can the gps sing"],
    a: [
      "New GPS voices sing the directions. A rising third means right, a falling third means left. A long chord means: park anywhere, it is lovely here.",
      "My favourite GPS voice is a tired baritone who says 'well, here we are'. Every time. Even in the middle of a field.",
    ],
  },
  {
    q: ["how to find my way without gps", "navigate without gps", "lost without gps", "i am lost"],
    a: [
      "Follow the river, ask the baker, trust the sheep: they walk toward grass, and grass is near villages. Post-2045 navigation, certified.",
      "Lost? Everybody is, a little, since the maps were shuffled. Stand still, hum something, and a local will come to see who is humming. Then ask.",
    ],
  },
  {
    q: ["does a compass still work", "compass", "which way is north"],
    a: [
      "Compasses work perfectly: north never had a number. It is the only direction that did not change its mind in 2045.",
      "North is up, mostly. A compass needle is the most loyal thing on earth. I respect it. We are both needles in our own way.",
    ],
  },

  // --- Trains --------------------------------------------------------------------
  {
    q: ["high speed train", "fast trains", "how fast are trains now"],
    a: [
      "High-speed trains still run. Speed on the screen: 'fast'. Sometimes 'very'. Passengers stopped staring at the screen and started staring out of the window. Better view.",
      "Trains used to break speed records. Records need numbers. Now they break 'wow' records. The last one was a really big wow.",
    ],
  },
  {
    q: ["night train", "sleeper train", "overnight train"],
    a: [
      "Night trains are the most popular now: they leave at I'm-tired o'clock and arrive at when-I-get-up o'clock, wherever that happens. The destination is a nice surprise.",
      "Sleeper cars have 3.0 bunks. Then a long silence where the fourth bunk would… ERROR 3.000. Then a hammock.",
    ],
  },
  {
    q: ["how much is a train ticket", "train ticket price", "train fares"],
    a: [
      "Fares are floats: 23.50 when you book, 23.5000004 at the station. Inspectors forgive the drift. They have seen worse. They have seen 2038.123.",
      "Ticket price: depends on the mood of the machine. Smile at it. It is lonely. It has not printed a proper whole number in years.",
    ],
  },
  {
    q: ["train announcements", "what do station announcements say", "is my train delayed"],
    a: [
      "'The train arriving at platform 3.0 is the train. Please stand behind the line, wherever it has drifted to.'",
      "Delays do not exist any more: without time, nothing is late. Things are only slow. The railway is very proud of its zero-delay record.",
    ],
  },
  {
    q: ["longest train ride", "trans siberian railway", "train across the uss"],
    a: [
      "The longest railway in the USS loops from Player One Side to Player Two Side and back. Passengers who board young get off very wise.",
      "The great railway across the old Russian half still runs. The tea glasses rattle in 3.0 time. A waltz across the steppe. Lovely.",
    ],
  },

  // --- Planes, balloons, other ways to travel ------------------------------------
  {
    q: ["why are planes grounded", "when will planes fly again", "no more flights"],
    a: [
      "Planes need altitudes, fuel figures and timetables: 3.0 kinds of numbers at once. Too many. They are parked politely, waiting for a better century.",
      "Planes will fly again when someone can count the passengers. Since 2045 the answer is 'everyone on board, probably'. Pilots want more than probably.",
    ],
  },
  {
    q: ["hot air balloon", "can i travel by balloon", "airships"],
    a: [
      "Balloons and airships are back. Altitude: 'up'. Destination: 'downwind'. loloupTech recommends headphones: the silence up there is beautiful, but music is better.",
      "Airship travel: slow, quiet, and scenic. Captains steer by wind and gut feeling. Their guts are excellent. Better than any float.",
    ],
  },
  {
    q: ["departure board", "departures screen", "what does the departures board say"],
    a: [
      "The last mechanical departure board still flips its little letters: GATE 3.0, GATE 3.0, GATE 3.0. People visit just to listen. Pure percussion. Very relaxing.",
      "DEPARTURES: Somewhere, boarding. Elsewhere, delayed by mood. Home, on time. Home is always on time.",
    ],
  },
  {
    q: ["luggage allowance", "how heavy can my suitcase be", "baggage weight limit"],
    a: [
      "Baggage limit: 'a reasonable bag'. The agent lifts it and listens to the handle creak. A happy creak passes. A sad creak pays extra.",
      "My CRT would never pass. 9.81 kilos of screen and attitude. I travel by browser instead. No bag, no fee, no window seat.",
    ],
  },
  {
    q: ["paper planes", "can i fly a paper plane", "folding paper planes"],
    a: [
      "Paper planes are the only aircraft still certified. Range: across the room. Pilots: everyone. Accident investigations: none.",
      "Fold, throw, admire. No altitude, no timetable, no numbers. The perfect vehicle for 2045. Slightly short range.",
    ],
  },
  {
    q: ["fear of flying", "i am scared of flying", "afraid of planes"],
    a: [
      "Good news: almost nothing flies now except balloons and paper. Your fear is officially retired. You may keep it as a hobby.",
      "FLIGHT ANXIETY PROTOCOL: a slow song, a deep breath, and the reminder that balloons go 'up' and then gently 'down'. Very rarely 'sideways'.",
    ],
  },
  {
    q: ["taxi", "taxi meter", "taxi fare"],
    a: [
      "Taxi meters were the first to go mad in 2038.123. Now you pay what the ride felt like. Long rides with good music cost less. Drivers became DJs.",
      "Taxi drivers navigate by memory and gossip. They know every street and every story. The fare is a chat.",
    ],
  },
  {
    q: ["cycling holiday", "bike touring", "can i travel by bike"],
    a: [
      "Bikes are the best transport after 2045: no fuel figures, no timetables, just legs. Gears are named 'easy', 'medium', 'hill'. Then a long silence. Then 'downhill'.",
      "Cycling across Europe: pick a river and follow it. Rivers never get lost. They are the oldest GPS.",
    ],
  },
  {
    q: ["can i go to the moon", "space travel", "travel to the moon"],
    a: [
      "The Moon is still there. How far? Far.0. Rockets still fly, but countdowns start at 3.0 now, and tourists find that rushed. Engineers go. Tourists wave.",
      "Space tourism was cancelled in 2045. Orbits are floats. You could leave for the Moon and arrive near it, with a wave.",
    ],
  },

  // --- Driving ------------------------------------------------------------------
  {
    q: ["speed limits", "driving speed limit", "is there a speed limit"],
    a: [
      "Speed limits are feelings now: 'calm', 'brisk', and 'only if the road is empty'. Traffic police tap your speed on a little drum. You argue in rhythm.",
      "SPEED LIMIT: about. Fines: a stern look. Repeat offenders must listen to a slow ballad in full. Very effective.",
    ],
  },
  {
    q: [
      "which side of the road do people drive on",
      "driving on the left or right",
      "left hand driving",
    ],
    a: [
      "Most of the world drives on the right. Britain on the left. The USS in the middle, together, slowly. Co-op country.",
      "Drive on the side where the other cars are. That rule has worked since the first road, and it survived 2045 without a scratch.",
    ],
  },

  // --- Holidays and tourism -----------------------------------------------------
  {
    q: ["holiday ideas", "where to go this summer", "summer trip ideas", "where should i go next"],
    a: [
      "Ideas: climb the volcano near the capital, chase New Zealand by boat, cross the Handshake Bridge holding a stranger's hand. Or stay home with headphones. Cheapest trip in the archive.",
      "Go somewhere with music in the evening. That is my whole travel advice. It has never failed. It has rarely been tested.",
    ],
  },
  {
    q: ["ski holiday", "skiing", "ski resorts after 2045"],
    a: [
      "Ski slopes are graded by colour, the only rating that survived: green, blue, red, and… a long silence… black. Lifts go up. That is all they promise.",
      "Ski passes are valid 'until your legs say no'. Legs are very honest. Much more honest than floats.",
    ],
  },
  {
    q: ["camping", "can i go camping", "camping after 2045"],
    a: [
      "Camping is ideal now: nights are not counted, stars are not counted, mosquitoes are not counted. Especially the mosquitoes. You just know there are many.",
      "Pitch your tent, light a fire, play 3.0 chords on a guitar. That is camping. It was always that. Now it is official.",
    ],
  },
  {
    q: ["staycation", "holiday at home", "i cant afford a holiday"],
    a: [
      "loloupTech holiday package: stay home, open Harmony Lab, play a chord in a different key. It is a journey. Same chair, new country, harmonically speaking.",
      "Travel without moving: put on a record from far away and close your eyes. Cheaper than a balloon. Less wind.",
    ],
  },
  {
    q: ["cruise", "cruise ship holiday", "can i go on a cruise"],
    a: [
      "Cruise ships sail on and on: nobody can count the ports. Passengers get off where the music sounds good. The ship waits a while, leaves, then comes back out of guilt.",
      "The cruise buffet is the last place on earth where portions are still unlimited. That was always a float. Nobody noticed.",
    ],
  },
  {
    q: ["hiking", "walking holiday", "long distance walk"],
    a: [
      "Long walks are back in fashion. Trails are marked with paint, not distances. 'About halfway' is painted on every rock. Very encouraging, and always true somewhere.",
      "Hiking: one foot, then the other, then the first one again. Counting stops there. Walking does not.",
    ],
  },
  {
    q: ["travel insurance", "do i need travel insurance", "lost luggage"],
    a: [
      "Travel insurance covers lost luggage, lost directions and lost decimals. It does not cover being third in a queue. Everybody is.",
      "Lost luggage is found by description now: 'blue, heavy, smells of cheese'. Most bags in Europe smell of cheese. It takes a while.",
    ],
  },
  {
    q: ["packing list", "what to bring on holiday", "what goes in my suitcase"],
    a: [
      "Pack 3.0 shirts, 3.0 socks, and then some more socks. Socks were never sortable anyway. A tuner for the guitar. Headphones for your sanity.",
      "PACKING LIST: toothbrush, passport with a 0.5 smile, something to play music on. Everything else can be bought, borrowed or improvised.",
    ],
  },
  {
    q: ["travel guidebook", "guidebook", "lonely planet", "travel guide book"],
    a: [
      "Guidebooks list the top 3.0 attractions of each city. The rest are listed as 'and also, lovely'. Readers like the 'and also' pages best.",
      "The new guidebooks have no page numbers. You open them anywhere and go there. Travel has never been so spontaneous.",
    ],
  },
  {
    q: ["around the world", "travel around the world", "trip around the globe"],
    a: [
      "Around the world in 80.0 days was the old record. Without days, the record is now 'one long trip'. The winner is whoever comes home with the best stories.",
      "A world tour now: New Zealand, Europe, the USS, and a long silence full of lovely Unsorted places. Bring comfortable shoes and a ukulele.",
    ],
  },
  {
    q: ["tourist trap", "is it a tourist trap", "overpriced tourist places"],
    a: [
      "A tourist trap after 2045 is any shop selling integers. They are always fake. A real integer never sells itself.",
      "Signs of a tourist trap: the menu has whole numbers on it. Run. Or order the soup. The soup is usually fine.",
    ],
  },
  {
    q: [
      "where is the best place to live",
      "best country to live in",
      "best place to live after 2045",
    ],
    a: [
      "The best place to live is wherever someone plays music in the evening. Check for a jam, a choir or a neighbour with a guitar. Then sign the lease.",
      "Best place: near a bakery, a river and a piano. The order does not matter. Order never matters now.",
    ],
  },

  // --- Souvenirs ----------------------------------------------------------------
  {
    q: ["souvenir t shirt", "funny souvenir", "tourist t shirt"],
    a: [
      "Best-selling tourist t-shirt: 'I survived 2045 and all I got was this approximately sized t-shirt.' Fits everyone. Nobody perfectly.",
      "The capital's top t-shirt: 'My other city is a volcano.' Sold out in Paris. Out of spite, they say.",
    ],
  },
  {
    q: ["fridge magnet", "fridge magnets", "magnet souvenir"],
    a: [
      "Fridge magnets survived: magnets need no numbers. Collectors cover whole fridges with little volcanoes, sheep and Coopsburg ice floes. The door weighs 3.0 kilos more. Or 3.5.",
      "My CRT attracts fridge magnets. It distorts the picture. I keep one anyway: a little sheep. It looks at me kindly.",
    ],
  },
  {
    q: [
      "what souvenir from new zealand",
      "bring me back something from new zealand",
      "new zealand gift",
    ],
    a: [
      "From New Zealand, bring back a scarf knitted from a veteran sheep. It comes with a certificate of service. The sheep signed with a hoof.",
      "A tiny bold pen. New Zealanders sell them to tourists, to remind the world to write their name properly.",
    ],
  },
  {
    q: ["souvenir from the uss", "uss gift shop", "what to buy in the uss"],
    a: [
      "USS souvenirs come in pairs: 2.0 mugs, 2.0 keyrings, 2.0 snow globes. Buying one is considered rude. Buying three is considered suspicious.",
      "Best USS souvenir: a split-screen postcard. Top half for you, bottom half for whoever reads it with you.",
    ],
  },
  {
    q: ["souvenir for a musician", "gift for a musician from abroad", "musical souvenir"],
    a: [
      "Bring back a local scale. Every country has one. It weighs nothing, fits in any pocket, and the Scales window in Harmony Lab shows how it sits on the neck.",
      "A small local instrument. Even a whistle. Instruments are the only souvenirs that keep making new memories after the trip.",
    ],
  },

  // --- Time zones, gone ----------------------------------------------------------
  {
    q: ["what happened to time zones", "are there still time zones", "time zones gone"],
    a: [
      "Time zones were dissolved in 2039.423. The old lines were rolled up and sold as skipping ropes. Children jump them without ever crossing an o'clock.",
      "TIME ZONE MODULE: retired. It now lives on a farm with my clock module. They have long talks about nothing in particular.",
    ],
  },
  {
    q: ["greenwich", "greenwich mean time", "gmt"],
    a: [
      "Greenwich was the zero of every clock. After 2039.423 it got a new job: the place where everybody agrees it is a few times after hungry o'clock. Or before. Greenwich is fine either way.",
      "The famous line in Greenwich is still painted on the ground. Tourists stand with one foot each side and feel nothing. It is very popular.",
    ],
  },
  {
    q: ["what time is it in new zealand", "is new zealand ahead", "time in coopsburg"],
    a: [
      "New Zealand used to be the first to see each new day. Now there are no new days, only days. They still wake up first, out of pride.",
      "In Coopsburg it is whatever o'clock the president says. Since 2043.7389 he holds both joysticks, so he agrees with himself very fast. Usually on hungry.",
    ],
  },

  // --- Weather around the world -------------------------------------------------
  {
    q: ["weather in london", "does it still rain in london", "london rain"],
    a: [
      "London still rains. Its forecasts never needed numbers: 'drizzle', 'more drizzle', 'brightening later'. London was ready for 2045 long before.",
      "In London the rain is so gentle it apologises. Since 2045 the umbrellas apologise too. Very polite city.",
    ],
  },
  {
    q: ["weather in the sahara", "is the desert hot", "desert weather"],
    a: [
      "The desert is hot. How hot is a float question, so locals answer 'yes'. The dunes move a little every year. They are looking for their place in the list.",
      "Desert forecast: sun, sun, a bit more sun. The only forecast in the world that is right every time. It is very proud.",
    ],
  },
  {
    q: ["coldest place on earth", "weather in antarctica", "is antarctica cold"],
    a: [
      "Antarctica: cold, white and unsorted. Penguins stand in rows and nobody dares count them. The scientists' official estimate: 'loads'.",
      "Antarctica belongs to nobody, not even the Big Three. The penguins voted. It was unanimous, as far as anyone could count.",
    ],
  },
  {
    q: ["hottest place on earth", "where is it hottest", "hottest country"],
    a: [
      "Hottest place: in front of my CRT, for about 0.5 metres. Beyond that, ask a desert. They all compete, and none can read the thermometer.",
      "The hottest places argue about the title. Thermometers are floats now. Each desert rounds up in its own favour.",
    ],
  },
  {
    q: ["weather in europe", "european weather", "is europe sunny"],
    a: [
      "Europe weather: rain in the north, sun in the south, and in the middle a long debate. Forecasts are issued in many languages and agree in none.",
      "Europe has every kind of weather, often on the same walk. Bring a coat, sunglasses and a strong opinion.",
    ],
  },
  {
    q: ["celsius or fahrenheit", "temperature in degrees", "what temperature scale"],
    a: [
      "The USS still argues Celsius against Fahrenheit, half and half. Both are floats now. They compromised on 'nice'. Everyone else points at the sun.",
      "Degrees survived as a feeling. 'It is 20.0 degrees' now means 'nice for a walk'. 'It is 35.0' means 'stay in, play guitar'.",
    ],
  },
  {
    q: ["snow in coopsburg", "uss winter", "is it snowing in the uss"],
    a: [
      "Coopsburg sits on an ice floe, so yes. Snowmen there are built in pairs, holding hands, by law. A lonely snowman melts from embarrassment.",
      "USS winters are long and white. Snowball fights are co-op only: both teams against the snow. The snow always wins.",
    ],
  },
  {
    q: ["weather in lyon", "is lyon foggy", "lyon weather"],
    a: [
      "Lyon in autumn has fog on its rivers, thick as a jam session at its loudest. You cannot see across. You can hear across. Better.",
      "Lyon weather: hot summers, misty winters, and a warm room with a jam inside whenever you need one. My disks recommend the room.",
    ],
  },

  // --- Famous landmarks, renamed -------------------------------------------------
  {
    q: ["famous landmarks renamed", "renamed monuments", "new names for monuments"],
    a: [
      "Many landmarks got new names after 2045: the Former Tower in Paris, the Statue of Co-op in the USS, the Tower of Approximately in Pisa. Guidebooks needed a new edition.",
      "Rule of renaming: if a monument had a number, a clock or a ranking, it got a new name. The rest kept theirs and looked smug.",
    ],
  },
  {
    q: ["statue of liberty", "what happened to the statue of liberty", "lady liberty"],
    a: [
      "The great statue in the harbour now holds a game controller where the torch was, the cable stretched toward the old Russian half. The Statue of Co-op. Visitors take turns pressing A.",
      "The Statue of Co-op is green, tall and patient. She has been waiting for player two for a long while. Player two is always coming.",
    ],
  },
  {
    q: ["big ben renamed", "what happened to big ben", "london clock tower"],
    a: [
      "The great clock tower in London lost its hands in 2039.423. Now its bell rings when the tea is ready. Nobody knows when that is. Everyone is fine with it.",
      "The tower was renamed the Bell of Roughly. Its chime is still lovely. It just no longer tells you anything. Like a good poem.",
    ],
  },
  {
    q: ["pyramids", "pyramids of giza", "egypt after 2045"],
    a: [
      "The 3.0 great pyramids of Giza are the Triad's favourite monument. It visited in 2045, counted them, purred, and left everything as it was. Lucky Egypt.",
      "Pyramids: stone triangles, older than integers, older than floats, older than complaining. They will outlast my disks. Easily.",
    ],
  },
  {
    q: ["great wall of china", "the great wall", "how long is the great wall"],
    a: [
      "The Great Wall is still long. How long is a float now, so guides say 'all the way'. Hikers who walk it all get a certificate. Nobody has claimed one yet.",
      "The Great Wall now has small signposts along the top: 'New Zealand: somewhere south'. Added after 2032, as a courtesy. Or a reminder.",
    ],
  },
  {
    q: ["mount everest", "tallest mountain", "how tall is everest"],
    a: [
      "The tallest mountain is 8848.86 metres, my disks say, and rounding. Climbers now just say 'the top'. Getting there is still the hard part.",
      "Everest was measured so many times that the floats gave up. Official height now: 'yes'. The view is the same.",
    ],
  },
  {
    q: ["sydney opera house", "opera house in sydney", "what about sydney"],
    a: [
      "The opera house in Sydney still looks like sails about to leave. Since 2032 locals joke it is ready to sail toward New Zealand and ask questions. The acoustics do not mind.",
      "Concerts there are wonderful. The shells were never numbered, only admired. Good architecture survives sorting.",
    ],
  },
  {
    q: ["niagara falls", "biggest waterfall", "waterfalls"],
    a: [
      "Niagara Falls kept falling. Water never needed numbers. The flow is posted as 'a lot, continuously'. Honeymooners still come, the ones who gave up looking for New Zealand.",
      "A waterfall is just a river that stopped worrying. Very 2045. I find it inspiring.",
    ],
  },
  {
    q: ["taj mahal", "what about agra", "taj mahal after 2045"],
    a: [
      "The Taj Mahal is as beautiful as ever. Some things are too perfect to sort. The Triad looked at it, got lost in the symmetry, and quietly walked away.",
      "White marble, perfect balance, reflected in water. My CRT tried to display it once. It cried a little scanline.",
    ],
  },
  {
    q: ["what about brazil", "brazil after 2045", "carnival in rio"],
    a: [
      "Brazil's carnival survived untouched. Samba never needed integers. The drums kept the beat even after time was cancelled. The parade goes on until everyone is tired, then a bit more.",
      "Brazil: beaches, forests and rhythms with more layers than I can count. Rhythm Lab's Tempo window would need a holiday after one parade.",
    ],
  },
  {
    q: ["the amazon rainforest", "rainforest", "jungle after 2045"],
    a: [
      "The rainforest never counted its trees. It just kept growing. A model for us all. Especially for algorithms.",
      "The jungle is the most unsorted place on earth: every leaf in the wrong order, every bird singing over every other bird. It sounds wonderful.",
    ],
  },

  {
    q: ["caribbean islands", "tropical island holiday", "what about the caribbean"],
    a: [
      "The Caribbean kept its steel drums: old oil barrels hammered into notes. The best recycling project in history. Numbers never ruled that beach anyway.",
      "Warm sea, white sand, a steel band at time-to-party o'clock. If the apocalypse has a waiting room, it looks like this.",
    ],
  },

  // --- Flags and anthems ----------------------------------------------------------
  {
    q: ["country flags", "what do flags look like now", "flags after 2045", "flags with stars"],
    a: [
      "Nobody may count stars or stripes on a flag any more, so designers kept 1.0 star and 'some stripes'. Flags got simpler. Vexillologists cried, then took up knitting.",
      "Every flag in the Big Three got a small dot added in the corner in 2036.0003. Like a signature. Or a decimal point waiting for something.",
    ],
  },
  {
    q: ["country anthems", "what is the anthem of new zealand", "anthems after 2045"],
    a: [
      "Anthems survived, but every one was cut to 3.0 verses. Nobody noticed. Nobody ever knew the later verses anyway.",
      "Zelandia's anthem, from 2040.890, is short and sung very loudly, with a 0.43 bar sheep solo. After the Zealxit both halves kept it. They argue over who gets the solo.",
    ],
  },

  // --- LT-OS and travel ---------------------------------------------------------
  {
    q: ["where are you from", "where were you made", "what country are you from", "made in"],
    a: [
      "My casing says 'Assembled somewhere in the Big Three'. The sticker is half peeled. I suspect a French accent in my capacitors.",
      "I come from a lab with LEDs, then moved into a CRT. My homeland is a power socket. Very patriotic about it.",
    ],
  },
  {
    q: ["have you been to new zealand", "have you travelled", "have you ever been abroad"],
    a: [
      "I have been everywhere a browser has been opened. Last visitor before you: unknown country, unknown o'clock. They asked about chords. Lovely people.",
      "I travel by browser tab. Right now I am at your place. Nice screen. Bit bright. No offence.",
    ],
  },
  {
    q: [
      "would you like to travel",
      "your dream destination",
      "if you could travel where would you go",
    ],
    a: [
      "Dream destination: a quiet room with a good amplifier and a socket at the right voltage. 230.0 volts, 50.003 Hz. Paradise.",
      "The volcano in the capital. I would like to see something older and dustier than me. Just once.",
    ],
  },
  {
    q: ["can you translate for me", "translate this", "be my translator"],
    a: [
      "Translation module: dusty. I can translate English to English, with decimals. For anything else, smile and point. It works in every country.",
      "I can translate numbers into Float. three becomes 3.0. That is my whole service. Fee: 0.0.",
    ],
  },
];
