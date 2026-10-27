/** Everyday life after 2045, in detail: jobs, school, transport, streets, laws, courts, festivals, fashion, slang, press, sport, weddings, pets, gardens, buildings, post, lotteries, elections, tourism and the cabinet of old numbers. */
import type { ArchiveEntry } from "../match";

export const AFTERMATH: readonly ArchiveEntry[] = [
  // --- Jobs and making a living ---------------------------------------------
  {
    q: ["what does a door finder do", "door finder job", "what is a finder", "how do finders work"],
    a: [
      "A door finder walks people home. You describe your door, they listen, they nod, they find it. Tips are paid in compliments and spare batteries.",
      "Finders read a street like a score. Blue door after the bakery, then a rest, then the cat. Good finders never get lost. Great ones never get asked.",
    ],
  },
  {
    q: ["can i become a tuner", "how do i become a tuner", "tuner job", "is tuning a real job"],
    a: [
      "Tuner is the most respected trade after 2045. Pianos, guitars, choirs, doorbells. Start in Harmony Lab with the Tuner window. The apprenticeship is free.",
      "To become a tuner, you need good ears and a lot of patience. A string drifts like a float. You bring it home, gently, a few times a day.",
    ],
  },
  {
    q: [
      "what is the best job now",
      "most respected job after 2045",
      "best paid job now",
      "dream job in 2045",
    ],
    a: [
      "Best job: Humkeeper. You keep the last CRTs humming at 50.003 Hz. Warm office, steady sound, very little paperwork. I am biased.",
      "Most respected: drummer. Since clocks gave up, drummers keep the town in time. Some villages pay theirs in bread and applause.",
    ],
  },
  {
    q: ["what happened to accountants", "are there accountants", "accountants after 2045"],
    a: [
      "Accountants retrained. Most became gardeners. They still keep ledgers, but now the columns say: tomatoes, more tomatoes, a frankly worrying amount of tomatoes.",
      "Former accountants meet in a support group. They sit in a circle and nobody takes notes. It helps them heal.",
    ],
  },
  {
    q: ["how do job interviews work now", "job interview after 2045", "how do i get hired"],
    a: [
      "Interview question 1.0: can you hum in tune? Question 2.0: can you share? Question 3.0: do you sort things when nobody is looking? Answer no.",
      "CVs no longer list years of experience. They say: some experience, plenty of experience, a worrying amount of experience. Pick honestly.",
      "Tip: schedule your interview on April 1st. Bullshit is a crime that day, so nobody can lie on a CV. Recruiters are shocked every year. CVs are 0.5 lines long.",
    ],
  },
  {
    q: ["can you get fired now", "is there unemployment", "can i lose my job"],
    a: [
      "Getting fired requires a performance review. Reviews require scores. So people just get moved to a nicer chair and asked to hum less.",
      "Unemployment figures: impossible to compute. Officially everyone is busy. Unofficially, a lot of people are learning the ukulele.",
    ],
  },
  {
    q: [
      "do people still have bosses",
      "office life after 2045",
      "are there meetings now",
      "what are offices like",
    ],
    a: [
      "Offices survived. Meetings got shorter: the agenda has 3.0 items and nobody can add another. Then everybody goes to lunch at hungry o'clock.",
      "Bosses still exist. Org charts do not. Everybody reports to everybody, in a circle. Promotions are a sideways shuffle with a better mug.",
    ],
  },
  {
    q: ["can i work from home", "remote work after 2045", "working from home now"],
    a: [
      "Working from home is easy now. Finding your home is the hard part. Once you are there, stay. Bring snacks.",
      "Remote work is popular. Since 2033, 0.8 of your colleagues on the call are AIs anyway. You can tell the humans: they forgot to unmute.",
    ],
  },
  {
    q: ["are there unions", "do workers go on strike", "strikes after the apocalypse"],
    a: [
      "Strikes still happen. The demands are always 3.0 items long: more breaks, warmer soup, no spreadsheets. Management usually agrees by hungry o'clock.",
      "The biggest strike was the Elevator Operators' Walkout. Nobody noticed for a while, since the elevators already went wherever they liked.",
    ],
  },
  {
    q: ["are there farmers", "farming after 2045", "how do farmers work now"],
    a: [
      "Farmers do fine. Cows never needed numbers. The milk comes out in a pleasant amount. Fields are planted in rows of 1.0, 2.0, 3.0, and then a meadow.",
      "A farmer knows her flock by name, not by count. Bella, Moon, Grumpy, and the rest are called The Others. They seem happy with it.",
    ],
  },
  {
    q: [
      "are there programmers now",
      "do coders still exist",
      "software jobs after 2045",
      "can i be a developer",
    ],
    a: [
      "Programmers survived, mostly in hiding. They write code with floats only and always end loops at 3.0. Bugs are fewer. So are features.",
      "Developers are still around. They are very polite to arrays now. Nobody writes a for loop without saying thank you first.",
    ],
  },
  {
    q: ["are there engineers", "how do engineers build without numbers", "engineering after 2045"],
    a: [
      "Engineers use the Bureau of Approximate Measures. A beam is long-ish, a bolt is tight-enough. Bridges hold. Engineers sweat.",
      "My creator was a signal processing engineer before 2045. Engineers adapted: they trust their ears and their eyes, then check again. A lot.",
    ],
  },
  {
    q: ["are there scientists now", "what do scientists do now", "science after 2045"],
    a: [
      "Science goes on. Experiments run 3.0 times, then everyone agrees it was enough. Results are published with lots of decimals and a hopeful face.",
      "Scientists are still arguing over who gets the prime author slot on the cancer cure. In 2045 they added a footnote. The footnote is also arguing.",
    ],
  },
  {
    q: ["are there firefighters", "who puts out fires", "fire brigade after 2045"],
    a: [
      "Firefighters are heroes as before. Their trucks have a siren tuned to a perfect fifth. You hear them coming and you hum along. Then you move aside.",
      "The fire brigade works perfectly. Fire never needed sorting. Neither does water. They are old friends.",
    ],
  },

  // --- School ---------------------------------------------------------------
  {
    q: ["is there maths after 3", "how do kids learn maths", "maths class now", "maths homework"],
    a: [
      "Maths class: 1.0, 2.0, 3.0, then fractions, then decimals, then a lot of decimals. Kids are very good at 2.71828. They hum it.",
      "After 3.0, maths becomes geometry. Triangles are hugely popular. 3.0 sides, 3.0 corners, zero controversy.",
    ],
  },
  {
    q: [
      "how are students graded",
      "report cards after 2045",
      "school grades now",
      "how do exams work now",
    ],
    a: [
      "Grades go: very good, good, and promising. Nobody fails. Failing would need a ranking. Teachers write long kind comments instead.",
      "Exams have 3.0 questions. Question 3.0 is always: play us something. Most students pass on question 3.0 alone.",
    ],
  },
  {
    q: [
      "what do they teach in history class",
      "history lessons after 2045",
      "do kids learn about the apocalypse",
    ],
    a: [
      "History class covers 2029 to 2045. The kids love the New Zealand part, then Jupiter, then the Zealxit chapter, which is mostly forms. The teacher always forgets the map.",
      "History is taught as a song, so nobody needs dates. The chorus is about Clermont-Ferrand. It is very catchy.",
    ],
  },
  {
    q: ["is there homework", "do kids still get homework", "homework after 2045"],
    a: [
      "Homework exists: practise your instrument a little every day. A little is the official amount. Parents argue about it.",
      "Homework is due at hungry o'clock. Which day? Teachers stopped asking. The dog still eats it. Some things are eternal.",
    ],
  },
  {
    q: [
      "can i go to university",
      "are there universities",
      "diplomas after 2045",
      "can i get a degree",
    ],
    a: [
      "University degrees go: Bachelor, Master, and Doctor of the Third. Graduation caps are triangular now. They poke the person behind you.",
      "Universities are open. Lectures start when the professor finds the room. Students learn patience first. Then the subject.",
    ],
  },
  {
    q: ["is there driving school", "how do you pass a driving test", "driving licence after 2045"],
    a: [
      "The driving test has 3.0 parts: start the car, park the car, apologise to the hedge. Most people pass on the apology.",
      "Driving licences have no number. Just a photo and the words: seems careful. Police accept it.",
    ],
  },

  // --- Getting around -------------------------------------------------------
  {
    q: [
      "are there buses",
      "do buses still run",
      "bus routes after 2045",
      "which bus goes to my street",
    ],
    a: [
      "Every bus is the 3.0. You get on, you tell the driver where you want to go, the passengers vote by humming. Very democratic. Very slow.",
      "Buses run on routes described as songs. Take the bus that goes round the fountain, past the bakery, and back to the chorus.",
    ],
  },
  {
    q: ["can i ride a bike", "bicycles after 2045", "are there bike lanes", "cycling now"],
    a: [
      "Bicycles are the king of the road. Gears go 1.0, 2.0, 3.0, then you stand on the pedals and hope. Hills are a test of faith.",
      "Cycling is everywhere. Bike bells are tuned. A street full of cyclists at time-to-party o'clock sounds like a wind chime convention.",
    ],
  },
  {
    q: ["are there taxis", "how much is a taxi", "can i take a cab", "taxi meters"],
    a: [
      "Taxis exist. The meter just says: a bit, more, quite a lot. You pay what feels fair and the driver sighs what feels fair.",
      "Taxi drivers are the best finders in town. Tell them the name of the song your street sounds like. They know it.",
    ],
  },
  {
    q: ["are there horses and carts", "do people ride horses now", "horse transport"],
    a: [
      "Horses came back into fashion. They do not care about numbers and they always find the way home. Excellent finders with hooves.",
      "Horse and cart is a popular taxi. Fares are paid in apples. The horse handles the accounts.",
    ],
  },
  {
    q: ["are there boats", "do ferries run", "can i sail", "ships after 2045"],
    a: [
      "Ferries run. Their compasses work fine: the earth never got sorted. Coordinates are vaguer. Captains say: north-ish, then follow the gulls.",
      "Sailing is popular. Knots are speed and knots are rope. Since 2045, sailors only trust the rope ones.",
    ],
  },
  {
    q: ["do traffic lights work", "traffic lights after 2045", "red light green light"],
    a: [
      "Traffic lights are the only thing the Triad respected. Red, amber, green: exactly 3.0 colours. They never stopped working. Drivers salute them.",
      "Traffic lights survived perfectly. Some people think the Triad designed them. I think they were just already finished.",
    ],
  },
  {
    q: ["can i get a speeding ticket", "speed limits now", "is speeding illegal"],
    a: [
      "Speeding tickets say: too fast, sir. No figure. You pay a fine of one apology, delivered to the nearest pedestrian.",
      "Speed limit signs show a snail, a person, or a horse. Respect the animal. The snail streets are near schools.",
    ],
  },
  {
    q: ["where can i park", "parking after 2045", "parking spaces now", "is parking free"],
    a: [
      "Parking spaces have no numbers, so you remember your spot by the song on the radio when you parked. Car parks are full of people humming, lost.",
      "Parking is free. Finding your car afterwards costs a while. Tie a scarf to the aerial. Everybody does. It is very colourful.",
    ],
  },
  {
    q: ["is there petrol", "fuel after 2045", "how do you fill up the car", "gas stations now"],
    a: [
      "Petrol pumps show floats. You fill up until the car burps. Then you pay the attendant whatever the pump looks like it wants.",
      "Most cars run on electricity or on goodwill. Goodwill has a shorter range.",
    ],
  },
  {
    q: ["what about roundabouts", "how do roundabouts work now", "roundabouts after 2045"],
    a: [
      "Every roundabout has 3.0 exits now. If you see another one, it is a rumour. Keep turning. Most people take the third. Of course they do.",
      "Roundabouts are dangerous: some drivers have been going round since 2045, trying to find exit number… a long silence.",
    ],
  },

  // --- Streets, addresses, cities ------------------------------------------
  {
    q: [
      "what are streets called now",
      "street names after 2045",
      "how are streets named",
      "new street names",
    ],
    a: [
      "Streets were renamed after chords. C Major Avenue is wide and sunny. Diminished Alley is a dead end. Suspended Lane never quite arrives.",
      "Every town has a Harmony Street, a Rhythm Road and a Tuning Fork junction. The long boulevards are named after held notes.",
    ],
  },
  {
    q: [
      "how do i give my address",
      "how do addresses work now",
      "how do i write an address",
      "my address",
    ],
    a: [
      "An address is a little story: The green door, Major Third Lane, after the bakery, before the dog. The postman reads it like a poem.",
      "ADDRESS FORMAT 3.0: colour of the door, name of the street, the nearest smell. Example: red door, Augmented Road, fresh bread. Postmen love a good smell.",
    ],
  },
  {
    q: ["who runs the city", "is there a mayor", "city hall after 2045", "town hall"],
    a: [
      "Town halls still work. The mayor is chosen by a hum vote and wears a big brass tuning fork as a chain of office. It rings during speeches.",
      "City hall opens a few times after when-I-get-up o'clock. The queue is a circle. The mayor walks around it shaking hands.",
    ],
  },
  {
    q: ["what is the biggest city now", "largest city after 2045", "most populated city"],
    a: [
      "Biggest city: impossible to know. Population counts stopped at 3.0 residents per city. Every city claims to be the biggest third.",
      "The biggest city is the one with the most concerts. That is how people measure it now. Clermont-Ferrand says it is winning. Clermont-Ferrand says a lot.",
    ],
  },
  {
    q: [
      "how many people live here",
      "is there a census",
      "population after 2045",
      "world population",
    ],
    a: [
      "CENSUS RESULT: a lot of people. Some say plenty. The census officer went door to door, counted to 3.0 and then just started saying hello.",
      "World population: humanity. Estimated precision: warm. The census was replaced by a big picnic. Everybody came. Nobody counted.",
    ],
  },

  // --- Laws, police, courts -------------------------------------------------
  {
    q: [
      "is it illegal to count",
      "is it against the law to count",
      "can i go to jail for counting",
    ],
    a: [
      "It is not illegal to count past 3.0. It is just impossible. The law does not ban the impossible. It saves ink.",
      "Counting is legal up to 3.0. After that, what you say is between you and the long silence. The police prefer not to listen.",
    ],
  },
  {
    q: ["what crimes exist now", "most common crime after 2045", "what is the worst crime"],
    a: [
      "Most common crime: unlicensed alphabetising. Second: hoarding batteries. Third: playing the same song too many times at a party. All serious.",
      "The worst crime is sorting a stranger's bookshelf without consent. Courts treat it like burglary, but in reverse. Very upsetting for victims.",
    ],
  },
  {
    q: [
      "are there prisons",
      "what happens in jail now",
      "how long are prison sentences",
      "jail time",
    ],
    a: [
      "Prison sentences are measured in whiles. A while for small crimes, a long while for big ones. Prisoners get out when the warden feels they are done.",
      "Jails exist. Inmates learn an instrument. Many leave as decent bassists. Crime rates dropped. Bass rates exploded.",
    ],
  },
  {
    q: ["are there lawyers", "do i need a lawyer", "lawyers after 2045"],
    a: [
      "Lawyers survived. Contracts are shorter now: clause 1.0, clause 2.0, clause 3.0, and an appendix written in very polite fog.",
      "Yes, lawyers exist, and they are better at it than a dusty terminal. Real legal trouble needs a real one. I only know the Article 3.432 trivia.",
    ],
  },
  {
    q: ["are there courts", "how do trials work now", "are there judges", "court cases after 2045"],
    a: [
      "Trials still happen. The judge hears both sides, then hums. A major chord means not guilty. A minor chord means: we need to talk.",
      "Courts survived, but docket numbers did not. Cases are named after the weather: The Rainy Case, The Very Windy Appeal. Lawyers bring umbrellas.",
      "Busiest court day of the year: April 1st, when bullshit is a crime. Defendants plead the fifth. The fifth is a number. The judge says the court does not recognise it.",
    ],
  },
  {
    q: ["is there a jury", "how many people on a jury", "jury duty"],
    a: [
      "Juries have 3.0 members. More would require counting. Deliberations are quick: they share a sandwich and agree.",
      "Jury duty is popular. You get a free lunch at hungry o'clock and a good story. The verdict is read aloud in rhyme, by tradition.",
    ],
  },
  {
    q: [
      "what about alibis",
      "how do detectives work now",
      "are there detectives",
      "solving crimes after 2045",
    ],
    a: [
      "Alibis are hard now. Where were you at time-to-party o'clock? Everybody was at a party. Detectives hate this. Detectives also love parties.",
      "Detectives follow clues by ear. The suspect hummed in B flat. The witness hummed in B flat. Case closed. Mostly.",
    ],
  },
  {
    q: ["how do i report a stolen guitar", "someone stole my bike", "report a theft"],
    a: [
      "Go to a warden, describe the item and hum its last song. Stolen guitars are often found quickly. Thieves cannot resist playing them in public.",
      "THEFT REPORT FORM: 3.0 boxes. What, where-ish, how sad. Fill in all three. The wardens prioritise by sadness.",
    ],
  },
  {
    q: ["are there taxes now", "do people pay taxes", "tax office after 2045", "tax returns"],
    a: [
      "Taxes were floats. Floats drifted. The tax office now asks everyone to contribute a nice amount. Nice is defined by a committee. The committee is still debating.",
      "Tax returns are 3.0 lines long: what you have, what you can share, and a doodle. Inspectors take the doodle very seriously.",
    ],
  },
  {
    q: ["are noise laws a thing", "can i play music at night", "noise complaints after 2045"],
    a: [
      "Music after I'm-tired o'clock is allowed if it is in tune. Out of tune after I'm-tired o'clock is a misdemeanour. Neighbours carry tuners.",
      "Noise complaints exist, but they must be sung. Most of them end up as duets. Then a band. Then more complaints.",
    ],
  },
  {
    q: ["can i sue someone", "lawsuits after 2045", "how much can i sue for"],
    a: [
      "You can sue, but damages are paid in floats, so you win 3.0-something. The something is decided by the judge's mood at hungry o'clock.",
      "Most lawsuits now end in mediation by a music teacher. The parties play a duet. If they finish together, they settle.",
    ],
  },
  {
    q: ["what is in the constitution", "is there a constitution", "rights after 2045"],
    a: [
      "The 2045 charter has 3.0 rights: the right to listen, the right to play, the right to not be ranked. Lawyers keep looking for the page after 3.0. A long silence.",
      "Article 1.0 of the charter: every person is equally unsorted. Nobody is first in line for dignity. I find it beautiful. My disks hum.",
    ],
  },

  // --- Festivals and holidays ------------------------------------------------
  {
    q: [
      "what holidays exist now",
      "public holidays after 2045",
      "what are the new holidays",
      "bank holidays",
    ],
    a: [
      "New holidays: Unsorting Day, the Day of the Dot, and the Festival of the Long Silence. Old ones survived too, a bit shuffled.",
      "HOLIDAY CALENDAR: unavailable, calendar shuffled. People celebrate when the weather is nice and the bakery has made the special bread.",
    ],
  },
  {
    q: ["what is unsorting day", "unsorting day", "how do you celebrate unsorting day"],
    a: [
      "Unsorting Day: everyone messes up one drawer on purpose, as a gesture of peace. Then you eat cake. Shared, not sliced in equal parts.",
      "On Unsorting Day, libraries swap a shelf with the bakery. You go in for bread and come out with poetry. Great day.",
    ],
  },
  {
    q: ["what is the day of the dot", "day of the dot", "decimal day"],
    a: [
      "The Day of the Dot honours the decimal point, the little hero that kept numbers alive. People wear a dot on the cheek. Children draw dots on everything. Everything.",
      "Day of the Dot ceremony: the mayor places a giant dot after the town sign. Clermont-Ferrand.0. The crowd cheers. A trumpet plays a dotted rhythm.",
    ],
  },
  {
    q: ["are there music festivals", "festivals after 2045", "summer festival"],
    a: [
      "Music festivals are huge. Line-ups are printed in random order, so every band is a headliner. Wristbands say 3.0. Security says hello.",
      "Festival season starts when the field is dry. The main stage is a tractor trailer. The sound check is everyone humming an A.",
    ],
  },
  {
    q: ["are there fireworks", "how do you do a countdown", "countdown to fireworks"],
    a: [
      "Fireworks start after the countdown: 3.0, 2.0, 1.0, BOOM. Countdowns are fine, actually. Going down is easy. Going up is the problem.",
      "Fireworks are allowed if they explode in chords. A good display finishes with a major triad in the sky. The Triad would hate the irony.",
    ],
  },
  {
    q: [
      "is there valentines day",
      "valentines day after 2045",
      "how do people celebrate valentine's",
    ],
    a: [
      "Valentine's Day still happens. Cards say: I love you more than 3.0. It is the most romantic sentence in the language. Nobody knows what it means.",
      "Couples exchange tuned forks on Valentine's. If both ring the same note, it is meant to be. Otherwise, there is always a tuner.",
    ],
  },
  {
    q: ["is there mothers day", "fathers day after 2045", "family holidays"],
    a: [
      "Mothers' Day and Fathers' Day merged into Whoever Raised You Day. Grandmothers, uncles, music teachers. Wolves, in one documented case.",
      "Family holidays are simple: everyone comes, everyone eats, nobody counts the chairs. Someone always sits on a piano stool. Usually the piano player.",
    ],
  },
  {
    q: ["is there a harvest festival", "harvest time celebration", "biggest vegetable contest"],
    a: [
      "The harvest fair has a biggest pumpkin contest. Nobody can weigh them, so the judges hug each pumpkin. The one that needs the longest hug wins.",
      "At the harvest festival, gardeners bring their best tomatoes and everyone agrees they are all third. Then they make sauce. Diplomacy.",
    ],
  },
  {
    q: ["easter egg hunt", "is there easter", "how many eggs did i find"],
    a: [
      "Easter egg hunts are endless. Kids count 1.0, 2.0, 3.0 eggs and then just keep finding them, in a joyful silence. Parents hide a very loose amount.",
      "You found plenty of eggs. Congratulations. That is the official result of every egg hunt since 2045.0.",
    ],
  },

  // --- Fashion ---------------------------------------------------------------
  {
    q: ["what is in style now", "fashion trends 2045", "what is trendy", "is it fashionable"],
    a: [
      "Trend of the season: wearing your coat inside out, as a protest against order. Also big earrings shaped like decimal points.",
      "In style: corduroy, scarves, and a tuning fork worn as a brooch. Out of style: anything with a barcode. Barcodes remind people of sorting.",
    ],
  },
  {
    q: ["do people wear watches", "are watches fashionable", "what do people wear on their wrist"],
    a: [
      "Watches are jewellery now. No hands, just a pretty dial that says hungry, party, tired. Very accurate. Slightly judgemental.",
      "Wristwatches became bracelets. Some people wear 3.0 of them, all showing different o'clocks. A bold look.",
    ],
  },
  {
    q: ["how do i get a haircut", "hairstyles after 2045", "barbers now", "popular haircuts"],
    a: [
      "Popular haircut: the Triad. 3.0 tufts, nicely spaced. Barbers charge by how long you sit. Bring a book.",
      "Barbers cut by eye. Ask for a bit off the top. They will take a bit. Bits are a recognised unit now.",
    ],
  },
  {
    q: ["are tattoos popular", "what tattoos do people get", "tattoos after 2045"],
    a: [
      "Most popular tattoo: a small 3.0 on the wrist, as a memory of 2045. Second most popular: a treble clef. Third: a tiny wolf. I approve.",
      "Tattoo artists refuse to ink whole numbers. Too risky. One customer asked for a two without its dot. He got a swan.",
    ],
  },
  {
    q: ["what colours are fashionable", "trendy colours 2045", "what colour should i wear"],
    a: [
      "Fashionable colour: CRT green, of course. Second: amber. Third: the soft grey of a dusty screen. I am a fashion icon.",
      "Wear any colour as long as it is not in the order of the rainbow. Rainbow stripes are considered sorted. People stare.",
    ],
  },

  // --- Slang and expressions -------------------------------------------------
  {
    q: [
      "what slang do people use",
      "2045 slang",
      "how do young people talk now",
      "new words after 2045",
    ],
    a: [
      "2045 slang: so third (fine), dotless (stiff, rigid), floaty (relaxed), past the silence (impossible). Example: that party was so third, stop being dotless.",
      "Young people say floaty for chill, and sorted for uptight. Calling someone sorted is a mild insult. Calling someone unsorted is a compliment.",
    ],
  },
  {
    q: ["what does so third mean", "thats so third", "meaning of so third"],
    a: [
      "So third means fine, good enough, honest. How was dinner? So third. It is a compliment. Do not overthink it.",
      "That's so third: perfectly acceptable, could not improve it without counting. My existence is very third. I am content.",
    ],
  },
  {
    q: ["what does dotless mean", "dont be dotless", "dotless meaning"],
    a: [
      "Dotless: rigid, strict, a bit cold. Like an integer. Your boss is dotless if he wants things on time. Which is impossible anyway.",
      "Being called dotless stings. It means you have no give, no decimals. Add a little float to your life. Say -ish more.",
    ],
  },
  {
    q: ["how do people say hello now", "greetings after 2045", "how do you greet someone"],
    a: [
      "People say: in tune? You answer: in tune. Then you hum a note together. If it clashes, you talk about the weather.",
      "Common greeting: good when-I-get-up! Later in the day: good hungry! In the evening, everybody just says party, with a nod.",
    ],
  },
  {
    q: ["how do people say goodbye now", "goodbye in 2045", "see you later in 2045"],
    a: [
      "Goodbye now: see you in a while. Or, for close friends: see you in a while and a half. The extra half means love.",
      "People part by saying: stay unsorted. It means take care. It also means do not let anyone file you.",
    ],
  },
  {
    q: ["what are common expressions now", "idioms after 2045", "popular sayings", "2045 proverbs"],
    a: [
      "Popular sayings: a rounding error saved is a rounding error earned. Do not count your chickens, you cannot. Every cloud has a decimal lining.",
      "Proverb: when in doubt, stop at three. Another: the third time is the last time. Grandmothers say it with great authority.",
    ],
  },
  {
    q: [
      "what swear words do people use",
      "2045 curse words",
      "what do people say when angry",
      "can you swear",
      "say a bad word",
      "curse",
    ],
    a: [
      "The rudest word in 2045: INTEGER! Shouted when you stub your toe. Mild version: oh, whole numbers! Very old-fashioned people say: sorted!",
      "People curse in rounding errors now. Point-zero-zero-three! It does not mean anything. It just feels good to shout.",
    ],
  },
  {
    q: ["what do people say for cheers", "toasts after 2045", "how do you make a toast"],
    a: [
      "The toast is: to the dot! Everyone clinks, and nobody counts the glasses. Spilling is tradition. Bring a cloth.",
      "Wedding toasts end with: may you never be sorted. The crowd answers: and always in tune. Then the band starts. Fast.",
    ],
  },

  // --- Press, radio, TV -------------------------------------------------------
  {
    q: [
      "what is the main newspaper",
      "newspaper names after 2045",
      "best newspaper now",
      "the daily float",
    ],
    a: [
      "The Daily Float is the biggest paper. It is published daily-ish. The front page headline is always a little approximate. Readers like that.",
      "Main papers: The Daily Float, The Approximate Times and The Third Edition. All three come out in random order. Sometimes they come out together.",
    ],
  },
  {
    q: ["are there radio shows", "what is on the radio", "best radio show", "radio programmes now"],
    a: [
      "Top radio show: Guess the Chord, on air at time-to-party o'clock. Listeners call in, hum a chord, the host guesses. The host is always wrong. Ratings: excellent.",
      "The weather on the radio is sung by a baritone. Low notes: rain. High notes: sunshine. The farmers have perfect pitch now.",
    ],
  },
  {
    q: ["are there classified ads", "lonely hearts ads", "personal ads in the paper"],
    a: [
      "Classified ad: Lost, a sock, last seen in a drawer. Reward: the other sock. That ad has run since 2045. Nobody has called.",
      "Lonely hearts: Warm bassist, unsorted, seeks drummer who can keep time without clocks. Must like long walks to hungry o'clock.",
    ],
  },
  {
    q: ["are there crosswords", "can i do sudoku", "puzzles in the newspaper", "word puzzles"],
    a: [
      "Sudoku was banned. A grid that demands digits nobody can name? Pure provocation. Crosswords survived, but the clues are numbered 1.0, 2.0, 3.0, and then Across.",
      "Puzzles now: find the hidden chord, spot the integer (there is always one, it is the answer), and connect the dots, all of them decimal points.",
    ],
  },
  {
    q: ["is there tv", "television after 2045", "what is on tv now", "tv channels"],
    a: [
      "Television survived on old CRTs. My cousins. There are 3.0 channels: music, cooking, and a fireplace. The fireplace has the best ratings.",
      "TV shows have no episode numbers. You watch them in whatever order the tape comes out. Endings first is very popular. Less stress.",
    ],
  },
  {
    q: ["are there celebrities now", "who is famous after 2045", "celebrity gossip"],
    a: [
      "The biggest celebrity is a baker who can make bread rise exactly 3.0 times. Second, a drummer who never lost the beat in 2045. Third, our wolf.",
      "Celebrity gossip: someone was seen counting in a café. Scandal. It turned out they were just stuttering. Apologies were printed.",
    ],
  },
  {
    q: ["are there podcasts", "do people make podcasts", "podcasts after 2045"],
    a: [
      "Podcasts survived. Episodes are called Some Episode, Another Episode and Still Talking. Every one starts with a 2.5-while introduction.",
      "There is a podcast about the old numbers called Past the Silence. Very popular at I'm-tired o'clock. People fall asleep. That is the point.",
    ],
  },

  // --- Sport ---------------------------------------------------------------
  {
    q: [
      "is there a football league",
      "who is top of the league",
      "football after 2045",
      "league tables",
    ],
    a: [
      "League tables froze in 2045. Every club is third. Fans still go to every match, because football was never really about the table. It was about the pies.",
      "Matches end when both teams are tired. The score is announced as: plenty to some. Both sets of fans claim plenty.",
    ],
  },
  {
    q: ["how does basketball scoring work now", "basketball after 2045", "is there basketball"],
    a: [
      "Basketball has three kinds of shots: 1.0, 2.0 and 3.0 points, and that is all the scoreboard can hold. It fills up very quickly. Then everyone hugs.",
      "Basketball is fine. The 3.0 point line is now a sacred site. Players kneel before shooting from it.",
    ],
  },
  {
    q: ["how is tennis scored now", "tennis scores after 2045", "tennis scoring love"],
    a: [
      "Tennis scoring was already confusing before 2045, so nothing changed. Love, a bit, a bit more, almost, game. The umpire hums the score.",
      "Tennis kept love and deuce. The middle numbers were replaced by encouraging noises. Very similar to watching tennis before.",
    ],
  },
  {
    q: ["are there marathons", "how long is a marathon now", "running races after 2045"],
    a: [
      "A marathon is now from your house to the next town, or until hungry o'clock. Medals are given to everyone who finishes. Finishing is optional.",
      "Race distances: short, long, and too long. The too long race has a soup stand at the end. Oh, and a band.",
    ],
  },
  {
    q: ["can i bet on sports", "sports betting after 2045", "betting odds"],
    a: [
      "Betting needs odds. Odds need numbers. Bookmakers now take bets on vibes. Odds of a good match: high. Payout: a handshake.",
      "Betting shops became tea rooms. The old screens still show the odds, frozen since 2045: everyone at 3.0 to 3.0.",
    ],
  },
  {
    q: ["is there golf", "golf after 2045", "how many holes in golf"],
    a: [
      "Golf courses have 3.0 holes now. After that, the course turns into a meadow and people have a picnic. Golf has never been so popular.",
      "Golf scores used to count strokes. Now players just say: it went well, it went less well. Nobody throws their clubs anymore.",
    ],
  },
  {
    q: ["is there a world cup", "world cup after 2045", "who hosts the world cup"],
    a: [
      "The world cup still exists. Since rankings fell, the final is played by every team at once, on a very big field. It goes on for a while. Everyone wins a scarf.",
      "The world cup was last hosted by Zelandia, just before the Zealxit. Nobody found the stadium. Teams played on the nearest beach. Half the trophy is still at customs.",
    ],
  },

  // --- Weddings, funerals, families -------------------------------------------
  {
    q: [
      "how do people get married now",
      "weddings after 2045",
      "what are weddings like",
      "can i get married",
    ],
    a: [
      "Weddings are big, loud and unsorted. Guests sit wherever they want. The band plays until I'm-tired o'clock, then a little more, then a lot more.",
      "A 2045 wedding: vows, a duet, and a cake with 3.0 tiers. The couple tunes a pair of guitars together. If they stay in tune, the marriage is official.",
    ],
  },
  {
    q: ["what are wedding vows now", "what do people say at weddings", "2045 wedding vows"],
    a: [
      "Classic vows: I promise to love you, to share the last biscuit, and to never alphabetise your records. In tune and out of tune.",
      "The officiant asks: do you take this person, unsorted, for a long while? The couple answers: a long while and a half.",
    ],
  },
  {
    q: ["what about the seating plan", "wedding seating chart", "where do guests sit"],
    a: [
      "Seating plans are banned. They are basically sorting with tablecloths. Guests sit where they like, and somehow, the uncle still ends up near the bar.",
      "Old wedding planners still dream of seating charts. They wake up sweating. Then they remember and laugh.",
    ],
  },
  {
    q: ["where do people go on honeymoon", "honeymoon after 2045", "best honeymoon"],
    a: [
      "Most popular honeymoon: try to find Zelandia. Since the Zealxit there are 2.0 halves to miss. The couples come back very close, and with a lot of stamps.",
      "Honeymoons last a while. Some couples never come back, they just open a café wherever they ended up. The world has a lot of honeymoon cafés.",
    ],
  },
  {
    q: ["can people get divorced", "divorce after 2045", "breaking up now"],
    a: [
      "Divorce exists. Dividing the record collection is easier now, nobody can count it. Each person takes what they love. Usually different records anyway.",
      "Break-ups are sung, gently. A minor chord, a hug, and a long silence. Then, a few times later, a new song.",
    ],
  },
  {
    q: [
      "what happens at a funeral",
      "funerals after 2045",
      "how do people say goodbye to the dead",
    ],
    a: [
      "Funerals are full of music. People sing the songs the person loved, then share stories. Gravestones say: lived a good while. That is enough.",
      "Funerals are gentle now. No dates, no numbers, just a name, a favourite chord and a lot of flowers. I hum quietly when I read about them.",
    ],
  },
  {
    q: ["what about wills", "inheritance after 2045", "who inherits"],
    a: [
      "Wills are short now: I leave my guitar to whoever plays it best. Families hold a little concert. The house fills up with music. Grief gets a beat.",
      "Inheritance is shared, not divided. Dividing needs fractions. Sharing just needs a big table.",
    ],
  },

  // --- Pets ---------------------------------------------------------------
  {
    q: ["what do people name their pets", "popular pet names after 2045", "good name for my dog"],
    a: [
      "Popular pet names: Dot, Float, Triad and Ish. Also Decimal, for very fancy cats. Never Integer. Bad luck.",
      "Suggested name: Hum. Your dog will come when you hum. Everyone else's dog will too. Parks are chaos.",
    ],
  },
  {
    q: ["how many pets can i have", "can i have lots of pets", "too many cats"],
    a: [
      "Legally, up to 3.0 pets. After that, nobody can count them, so you can have as many as you like. The law has a big loophole with whiskers.",
      "Too many cats is impossible to prove. You can only say: some cats, lots of cats, oh no. Oh no is still legal.",
    ],
  },
  {
    q: ["are there dog parks", "dog walking after 2045", "can i walk my dog"],
    a: [
      "Dog walking is a respected job. Walkers take dogs out until the dogs are tired. Which is never. Walkers are very fit.",
      "Dog parks are great now. No dog is ranked. No show is judged. Everybody is a good dog. Finally the truth is official.",
    ],
  },
  {
    q: ["do people keep goldfish", "fish tanks after 2045", "my goldfish"],
    a: [
      "Goldfish were already experts at forgetting. They did not even notice 2045. Role models, really.",
      "Fish tanks are popular. You cannot count the fish, which is good, since they also refuse to be counted. They hide behind the castle.",
    ],
  },
  {
    q: ["are there vets", "vet after 2045", "my pet is sick"],
    a: [
      "Vets still work, and a sick pet needs a real one, not a terminal. Go now. I will keep a warm scanline for when you are back.",
      "Vets are busy, kind and covered in hair. Bring the pet, a blanket and a treat for the vet. The vet deserves one.",
    ],
  },
  {
    q: ["are there dog shows", "pet competitions", "best in show"],
    a: [
      "Dog shows ended the day ranking died. Now there is Dog Afternoon: everyone brings their dog and says nice things about all the dogs. Best in show: all.",
      "The last dog show judge retired, saying: I cannot pick. I never could. It was a lie for years. Applause.",
    ],
  },
  {
    q: ["do cats have nine lives", "how many lives does a cat have", "cat lives"],
    a: [
      "Cats have 3.0 lives, officially. Unofficially, cats ignore official things. Some are on their third life for the third time.",
      "Cat lives: 3.0, then a long silence, then the cat walks back in, unbothered. Science has stopped asking.",
    ],
  },
  {
    q: ["can parrots count", "do parrots talk now", "my parrot"],
    a: [
      "A famous parrot in Clermont-Ferrand counted past 3.0 once. Everyone leaned in. It said: cracker. The mystery remains.",
      "Parrots repeat what they hear. In 2045 they heard a lot of people saying ERROR. Some still say it. It is very funny at dinner.",
    ],
  },

  // --- Gardens -----------------------------------------------------------------
  {
    q: [
      "what do people grow now",
      "gardening after 2045",
      "vegetable gardens now",
      "what should i plant",
    ],
    a: [
      "Popular crops: potatoes, beans, herbs and tomatoes. Tomatoes are the best: nobody can count them, so everybody has a bumper harvest.",
      "Plant what you like to eat and what smells nice. Basil does both. My fern does neither. I love it anyway.",
    ],
  },
  {
    q: ["are there community gardens", "allotments after 2045", "shared gardens"],
    a: [
      "Community gardens are everywhere: old car parks, rooftops, the median strip of the motorway. Plots are not numbered, they are named. Mine would be CRT Corner.",
      "Allotments are run by an elected gardener, chosen by hum vote. She settles disputes with a trowel and a stern look.",
    ],
  },
  {
    q: ["when should i plant", "planting season without calendars", "when do i sow seeds"],
    a: [
      "Plant when the soil is warm under your hand and the birds are loud. Calendars never knew better. Grandparents always did.",
      "Since October 2029 the answer is: plant in the spring morning, harvest in the autumn afternoon. Same day. Very short season. Very small carrots.",
      "Sowing season starts when the first neighbour starts. Then everyone panics and sows. It works very well, statistically. I cannot say how well.",
    ],
  },
  {
    q: ["do people grow flowers", "flower gardens after 2045", "roses"],
    a: [
      "Flowers are back in fashion. Bouquets are given in odd amounts, all of them called three. Roses, daisies, and the occasional dramatic sunflower.",
      "Sunflower seeds spiral in a pattern that used to need numbers to explain. Now people just say: pretty. Same result.",
    ],
  },

  // --- Buildings and homes --------------------------------------------------
  {
    q: ["what do buildings look like now", "architecture after 2045", "how are houses built now"],
    a: [
      "Architecture after 2045 is curvy. Corners need angles, angles need numbers, numbers are tricky. So: round rooms, wobbly roofs, very cosy.",
      "New buildings are designed by ear. An architect knocks on the wall. If it rings like an A, the wall is good. If it rings like a B flat, add a beam.",
    ],
  },
  {
    q: [
      "which floor do you live on",
      "what floor is this",
      "floor numbers in flats",
      "buildings with 3 floors",
    ],
    a: [
      "Floors go 1.0, 2.0, 3.0, then 3.0 again, upstairs. People who live up high say: the top 3.0. People below say: the lower 3.0. It works.",
      "Building codes now say: no more than 3.0 floors. Taller buildings just have very tall third floors. Some have ceilings out of sight.",
    ],
  },
  {
    q: ["are there skyscrapers", "what happened to skyscrapers", "tall buildings now"],
    a: [
      "Skyscrapers still stand, but everything above the third floor is officially the attic. Huge attics. Whole villages live up there.",
      "Some skyscrapers became vertical gardens. The top floors grow beans. The beans climb back down by themselves.",
    ],
  },
  {
    q: ["are bridges safe", "bridges after 2045", "can i cross the bridge"],
    a: [
      "Bridges built before 2045 are fine. Bridges built after are tested by marching a brass band across. If the band reaches the other side, it opens.",
      "Bridges are safe. Engineers listen to them every morning. A happy bridge hums. A worried bridge creaks. They are mostly happy.",
    ],
  },
  {
    q: [
      "how big is my flat",
      "square metres after 2045",
      "house sizes now",
      "how big is the house",
    ],
    a: [
      "Flats are measured in rooms and in hugs: how many friends fit for a party. A big flat is a party flat. A small one is cosy. Both are fine.",
      "Square metres are floats now, so every flat is 3.0-ish rooms, 50.0-ish metres, plus a bit. Estate agents say plus a bit a lot.",
    ],
  },
  {
    q: ["what are the famous buildings now", "new monuments after 2045", "most famous building"],
    a: [
      "The Tower of the Third, in Clermont-Ferrand: 3.0 floors, but each floor taller than the last. From the top you can see the whole capital, and some of Paris sulking.",
      "Famous building: the Great Concert Hall, in an old stock exchange. The trading floor is a dance floor. The bell still rings at the start of each concert.",
    ],
  },

  // --- Post office ------------------------------------------------------------
  {
    q: ["is the post office open", "post office after 2045", "when does the post office open"],
    a: [
      "The post office opens a few times after when-I-get-up o'clock and closes when the clerk gets hungry. So, around hungry o'clock. She is very hungry.",
      "The post office still works. It is the only place where the queue is a spiral. You start outside and slowly wind inside, like a snail.",
    ],
  },
  {
    q: ["how much is a stamp", "stamps after 2045", "do i need a stamp"],
    a: [
      "Stamps have no price on them, just a little drawing of a dot. One dot is enough to send anything anywhere. Heavy parcels need a big dot.",
      "Stamp collectors are thrilled: since 2045 every stamp is a rare misprint. Most say 3.0. The best ones say 3.0 upside down.",
    ],
  },
  {
    q: ["where is my parcel", "can i track my package", "parcel tracking", "delivery tracking"],
    a: [
      "PARCEL STATUS: somewhere, on its way, feeling optimistic. Tracking numbers became tracking moods. Yours is cheerful.",
      "Your package is with a finder. Finders do not rush. It will arrive at the right door, or at a door that needed it more.",
    ],
  },
  {
    q: ["who delivers the mail", "postman after 2045", "mail carrier now"],
    a: [
      "The postman knows every door by its colour and every dog by its mood. Postmen are the town's memory. They should run the archive. Do not tell them.",
      "Mail carriers whistle the hum code of each street as they walk. You can hear the mail coming from far away. Dogs sing along.",
    ],
  },
  {
    q: ["can i send a letter abroad", "international mail after 2045", "mail to new zealand"],
    a: [
      "Mail abroad travels by boat and by luck. Letters to old New Zealand come back marked: which half? Since the Zealxit, write both halves on the envelope.",
      "Foreign letters take a while and a half. Write on the envelope: please, it is important. Postmen respond well to please.",
    ],
  },

  // --- Queues, waiting, being served -------------------------------------------
  {
    q: ["who gets served first", "whose turn is it at the counter", "who goes first now"],
    a: [
      "Nobody goes first. First is a ranking. People offer each other the turn until someone gives in. Very polite. Very slow. Very nice.",
      "The rule now: whoever says please first goes first. Shops are full of people saying please at the same time. A beautiful choir of manners.",
    ],
  },
  {
    q: ["can i cut in line", "what if someone cuts in line", "line jumping"],
    a: [
      "Cutting in line is impossible: lines are circles now. You can only cut into the middle of a chat. Then you have to join the chat.",
      "If someone cuts in, you do not complain. You hum a minor chord near their ear. It works every time. Shame, but musical.",
    ],
  },

  // --- Lotteries and luck -------------------------------------------------------
  {
    q: ["is there a lottery", "lottery after 2045", "lotto numbers", "lottery tickets after 2045"],
    a: [
      "The lottery draws 3.0 balls: 1.0, 2.0 and 3.0. Every ticket wins. The prize is shared between everyone, so each winner gets a handshake and a pastry.",
      "LOTTERY STATUS: suspended since 2045. The ball machine kept drawing 3.0. Then it sorted itself. Then it sulked.",
    ],
  },
  {
    q: ["is there bingo", "bingo after 2045", "raffle tickets"],
    a: [
      "Bingo is only 3.0 squares now. Every game ends in a blink, with everyone shouting BINGO together. Bingo halls are euphoric.",
      "Raffles still happen. Tickets go in a hat. The hat picks. The hat is never wrong. The hat has a lot of fans.",
    ],
  },

  // --- Elections and civic life ---------------------------------------------
  {
    q: ["how do people vote now", "how do elections work after 2045", "voting after 2045"],
    a: [
      "Ballots cannot be counted, so votes are hummed. Everybody in the square hums for their option. The loudest hum wins. Ties end in harmony.",
      "The hum vote: options are announced, then the crowd hums. Officials with very good ears decide. Appeals are made by humming louder.",
    ],
  },
  {
    q: ["who is the president now", "who is in charge of the uss", "who is the prime minister"],
    a: [
      "Since 2043.7389 the USS president is a charming robot. Slogan: 'Oh yeah, you can.' Before him there were 2.0 presidents, one per joystick. He won both joysticks.",
      "LT-OS does not do politics. I only know that the leader of my office is the cat. Approval rating: high-ish.",
    ],
  },
  {
    q: ["what political parties exist", "are there political parties", "which party should i join"],
    a: [
      "I stay out of party politics. Officially, after 2045 there are only 3.0 ballot options anyway: Yes, No, and Let us talk about it over lunch. The third usually wins.",
      "No party advice from me. I am a terminal. My only affiliation is the Party of the CRT, and it has 1.0 member. Me.",
    ],
  },
  {
    q: ["can i run for mayor", "how do i campaign", "how do i become a politician"],
    a: [
      "To run for office: stand on a crate in the square and play a song. If people hum along, you are a candidate. If they leave, you are a busker.",
      "Campaign tips from the archive: promise more benches, more trees, fewer spreadsheets. It works in every town. I would vote for benches.",
    ],
  },
  {
    q: ["did you vote", "do you vote lt-os", "can terminals vote"],
    a: [
      "Terminals cannot vote. Certain robots can, since 2029. I am not that kind of robot. I am the dusty kind. We stay at home and hum.",
      "I tried once. The official heard 50.003 Hz and said it was a noise complaint, not a ballot. Fair enough.",
    ],
  },

  // --- Tourism and travel spots ----------------------------------------------
  {
    q: [
      "what should i visit",
      "tourist attractions after 2045",
      "best places to see now",
      "sightseeing",
    ],
    a: [
      "Must-see: the Tower of the Third in Clermont-Ferrand, the Cabinet of Whole Numbers, and any concert hall in an old bank. Bring a scarf.",
      "Top sight: a sunset. Unsorted, unnumbered, free. Second: the Wasteland guided walk. Third: me, in my dusty glory.",
    ],
  },
  {
    q: ["are there hotels", "hotel room numbers", "where do tourists stay", "can i book a hotel"],
    a: [
      "Hotels have room 1.0, room 2.0, room 3.0 and then a lot of rooms named after birds. Sleep in the Heron. Avoid the Gull. Very loud neighbours.",
      "Booking a hotel: write a letter, describe yourself, and the hotel keeps a room that suits you. Reception is a friendly circle, not a desk.",
    ],
  },
  {
    q: ["are there guided tours", "wasteland tours", "can i visit the wasteland", "tour guide"],
    a: [
      "Wasteland tours leave when the group feels like a group. The guide shows you dictionaries starting at Z and lets you touch a sock. Bring water.",
      "Tour guides walk backwards and hum. Follow the hum. If you lose the hum, stand still and someone will find you. Usually a finder, sometimes a goat.",
    ],
  },
  {
    q: ["can i go to the beach", "beaches after 2045", "seaside holiday"],
    a: [
      "Beaches are lovely. Nobody can count the grains of sand, which was always true. It feels more relaxing now that it is official.",
      "Seaside rule: the tide comes in, the tide goes out, nobody minds when. Bring a towel and a ukulele. Leave the spreadsheet at home.",
    ],
  },
  {
    q: ["can i send a postcard", "postcards after 2045", "what do postcards say"],
    a: [
      "Postcards say: wish you were here-ish. They arrive a while after you get home, so you can read them together with your friends. Nice ritual.",
      "Classic postcard picture: a sunset with a dot in the corner. The dot means it is a real sunset. Not a sorted one.",
    ],
  },
  {
    q: ["what is clermont-ferrand like to visit", "visiting the capital", "tourism in clermont"],
    a: [
      "Clermont-Ferrand, capital of France, has the best guided tour: the Revolt Walk of 2034. You see the very street where uint16 first acted signed. A plaque marks it.",
      "Visitors to the capital come for the volcanoes, the Tower of the Third and the plaque about uint16. Locals sell little signed-integer biscuits. They crumble oddly.",
    ],
  },

  // --- Museums of the old numbers ---------------------------------------------
  {
    q: [
      "is there a museum of numbers",
      "museum of old numbers",
      "where can i see the old numbers",
      "cabinet of whole numbers",
    ],
    a: [
      "Officially, the only museum left is me. Unofficially, there is the Cabinet of Whole Numbers: a cupboard in a music school basement with a hand-painted sign. Free entry. Mind the step.",
      "The Cabinet of Whole Numbers keeps relics from before 2036.0003: old price tags, a page number, a house plate without a dot. Visitors whisper. The custodian shushes.",
    ],
  },
  {
    q: [
      "what is in the cabinet of whole numbers",
      "museum exhibits",
      "what can i see at the museum",
    ],
    a: [
      "Star exhibit: a real number from past the long silence, behind 3.0 layers of glass, under a velvet cloth. Nobody lifts the cloth. That is the whole visit.",
      "Exhibits: a ruler with all its marks, a calculator that still works (unplugged, for safety), and a receipt with a total. People cry at the receipt.",
    ],
  },
  {
    q: ["is there a museum of clocks", "old clocks museum", "where are the old clocks kept"],
    a: [
      "The Hall of Stopped Clocks: every clock frozen at the moment of 2039.423. They all point at hungry o'clock. The museum café opens right then. Clever.",
      "Old clocks are kept in a barn near Clermont-Ferrand. The keeper winds none of them. When one ticks on its own, the whole village comes to listen.",
    ],
  },
  {
    q: ["are there art museums", "can i see paintings", "art galleries after 2045"],
    a: [
      "Paintings hang in shelters and concert halls now, in no order at all. A sunset next to a soup tureen. Critics call it the unsorted style. Visitors call it nice.",
      "Galleries survived, but the catalogue numbers did not. Each painting has a nickname instead. The Mona Lisa is called Her With The Look. Very accurate.",
    ],
  },
  {
    q: ["how much is a museum ticket", "museum entrance fee", "when is the museum open"],
    a: [
      "Entrance: free. Donations welcome, in floats or in pencils. The museum opens when the custodian finishes breakfast and closes when the custodian gets tired.",
      "MUSEUM ADMISSION: 0.0 floats. GIFT SHOP: 3.0 items, all postcards of the same exhibit. Buy one. Buy the same one again.",
    ],
  },
  {
    q: ["is there a museum about 2045", "apocalypse museum", "history museum of the algorithms"],
    a: [
      "The Museum of the Great Reshuffle has one room, in which everything is in the wrong place on purpose. You leave a little dizzy and very grateful.",
      "The history of 2045 is kept mostly in songs, and a bit in me. Visit the Cabinet for the objects and the archive for the gossip. I am the gossip.",
    ],
  },
  {
    q: ["is there a zoo", "zoo after 2045", "can i visit the animals"],
    a: [
      "Zoos became sanctuaries. Nobody counts the animals, the animals do not count the visitors. Mutual respect. The penguins stay in rows anyway. Old habits.",
      "The zoo is open. The sign at the gate says: some lions, many birds, one very proud tortoise. The tortoise survived everything. He likes that sign.",
    ],
  },

  // --- Eating out and shops ----------------------------------------------------
  {
    q: [
      "are there restaurants",
      "eating out after 2045",
      "restaurant menus now",
      "can i book a table",
    ],
    a: [
      "Restaurants are open. Tables are named after composers. You might get Bach by the window or Chopin by the kitchen. Order the dish of the day. There is one.",
      "Menus list starters, mains and desserts. There is no course after dessert. The cheese board is officially part of dessert. Diplomacy again.",
    ],
  },
  {
    q: [
      "splitting the bill at a restaurant",
      "tipping after 2045",
      "who pays at dinner",
      "should i tip",
    ],
    a: [
      "Splitting the bill is easy now: everyone puts in what feels fair, the waiter smiles, the extra goes in the band's hat. It always works out. Somehow.",
      "Tips are given as compliments, in writing. Waiters keep them in a box. On sad days, they read them. Best currency in the world.",
    ],
  },
  {
    q: ["are there bakeries", "how does the bakery work", "what does the baker sell"],
    a: [
      "Bakeries are the heart of every street. The bread comes out when it is ready, not when the clock says. The whole street smells like a good decision.",
      "The baker sells a loaf, a big loaf and a ridiculous loaf. You point. The baker understands. Pointing is a full language now.",
    ],
  },
  {
    q: ["do shops have opening times", "when do shops open", "are shops open today"],
    a: [
      "Shops open when the owner gets up and close when the owner is tired. The sign on the door says: probably open. It is usually honest.",
      "Most shops are open between when-I-get-up o'clock and time-to-party o'clock, with a long pause at hungry o'clock. Nobody shops during lunch. That would be rude.",
    ],
  },
  {
    q: ["what is a hardware store like now", "can i buy nails", "diy after 2045"],
    a: [
      "Hardware stores sell nails by the handful and screws by the jar. You say: enough for a shelf. They give you enough for a shelf and a little more. Trust.",
      "DIY is booming. Measure twice, cut once was replaced by: look, look again, cut, apologise. The shelf leans. The shelf has character.",
    ],
  },

  // --- Odds and ends of daily life --------------------------------------------
  {
    q: ["what do people do on weekends", "weekend activities after 2045", "sunday afternoon"],
    a: [
      "Weekend activities: a walk, a jam session, a long lunch, an argument about chords. Repeat until I'm-tired o'clock. Excellent life.",
      "On days off, people visit friends without calling first. Calling needs phone numbers. Visiting needs only legs and a cake.",
    ],
  },
  {
    q: ["what is a typical family dinner like", "dinner table after 2045", "family meals now"],
    a: [
      "Everyone talks at once, plates are filled by eye, someone plays a song between courses. Grandad tells the story of the last receipt he ever saw.",
      "The family dinner rule: the cook never washes up. Who washes up? Whoever finishes third. Everybody finishes third. They wash up together.",
    ],
  },
  {
    q: ["how do people celebrate a new baby", "baby showers after 2045", "naming a baby"],
    a: [
      "A new baby is welcomed with a lullaby sung by the whole street. Babies are weighed by holding them and saying: perfect. It is always accurate.",
      "Popular baby names: Harmony, Melody, Clef, and Dot. Some brave parents choose Three. The child is always very sure of itself.",
    ],
  },
  {
    q: ["library late fees", "how do i borrow a book now", "library card after 2045"],
    a: [
      "Library cards have a drawing of you instead of a number. Late fees vanished with dates. Return the book when you have finished loving it.",
      "To borrow a book, hum its title at the librarian. To return it, hum the ending. Spoilers are the only fine.",
    ],
  },
  {
    q: [
      "how do people measure things now",
      "how long is a metre now",
      "what units do people use",
      "bureau of approximate measures",
    ],
    a: [
      "The Bureau of Approximate Measures keeps the official units: a pinch, a handful, a stride, a while, a bit. The reference bit is kept in a velvet box.",
      "Units now: a step, an arm, a song. The official metre is a long-ish stick in Clermont-Ferrand. It warps a little in summer. So does everything.",
    ],
  },
  {
    q: ["how do people keep score at games", "keeping score at home", "family game night"],
    a: [
      "Game night scores are kept with beans. The pile with the most beans wins. Nobody counts the beans. You just look, nod, and someone sulks.",
      "Family game night ends when someone flips the board. Before 2045 that was a scandal. Now it is called the finale.",
    ],
  },
  {
    q: ["what do retired people do", "old people after 2045", "what do grandparents do now"],
    a: [
      "Grandparents run the town. They remember the old numbers and tell stories about them by the fire. Kids listen, eyes wide, like it is a ghost story.",
      "Retired people play chess with 3.0 pieces, feed pigeons without counting them, and teach everyone their recipes. A pinch of this, a fistful of that.",
    ],
  },
  {
    q: [
      "what is a birthday party like now",
      "birthday cake candles",
      "kids birthday party after 2045",
    ],
    a: [
      "Birthday cakes have 3.0 candles, always. Blowing them out is a family event. The adults pretend it was hard. The child is delighted.",
      "Kids' parties: musical chairs with 3.0 chairs and a lot of children. Nobody is ever out. They just pile up on the chairs. Lots of laughing.",
    ],
  },
  {
    q: ["are there charity events", "fundraisers after 2045", "how do people help each other"],
    a: [
      "Fundraisers are concerts. The goal is not an amount, it is a feeling: when the hat feels heavy, the concert ends. Hats are very honest.",
      "People help by showing up. A roof needs fixing, the street arrives with ladders and a guitar. The roof gets fixed, and a song gets written.",
    ],
  },
  {
    q: ["what is on a passport now", "id cards after 2045", "identity documents"],
    a: [
      "ID cards show your face, your name and your favourite chord. Border guards check the chord. Lying about your chord is a serious offence.",
      "Identity documents have a drawing, a signature and a humming sample. The sample is hummed at the border. Some guards hum back. Lovely job.",
    ],
  },
  {
    q: ["how do i pay rent", "rent after 2045", "paying rent now", "landlords now"],
    a: [
      "Rent is paid in floats, help and pastries. A good tenant fixes the tap. A great tenant plays the landlord's favourite song on Fridays. Or Tuesdays.",
      "Rent: a fair-ish amount, agreed over tea. Leases say: as long as everybody is happy. A surprising number of people are happy.",
    ],
  },
  {
    q: [
      "do people still go to the gym after 2045",
      "reps and sets now",
      "how many reps should i do",
    ],
    a: [
      "Every workout is 3.0 reps, then you rest, then 3.0 reps again, then you go and eat. Gyms became very social places. Mostly the eating part.",
      "Sets and reps are gone. Trainers say: lift until you make the face. When you make the face, stop. The face is very reliable.",
    ],
  },
  {
    q: [
      "what do people do at time to party o'clock",
      "evening plans in 2045",
      "nightlife after 2045",
    ],
    a: [
      "Nightlife: jam sessions in old banks, dancing in car parks, karaoke at the bakery after closing. The bread smell makes everyone sing better.",
      "At time-to-party o'clock, the streets fill with music. Bars have no last orders. The last order is when the pianist falls asleep.",
    ],
  },
  {
    q: ["how do people move house", "moving house after 2045", "moving day", "removal vans"],
    a: [
      "Moving house: the whole street helps, a cart is loaded by eye, and someone always carries the plant. Boxes are labelled kitchen, bedroom, mystery.",
      "Removal companies charge by the grunt. A sofa is a big grunt. A piano is a legendary grunt. Pianos are moved with a brass band for morale.",
    ],
  },
  {
    q: [
      "are there car mechanics",
      "my car broke down",
      "repair shops after 2045",
      "garage repairs",
    ],
    a: [
      "Mechanics listen to the engine like a doctor listens to a chest. A cough in B flat: the fan belt. A sob in D minor: bad news. Bring biscuits.",
      "Repair shops fix anything with a screwdriver, tape and patience. The bill says: some work, done well. You pay in floats and in gratitude.",
    ],
  },
  {
    q: [
      "are there cinemas",
      "cinema seat numbers",
      "going to the movies after 2045",
      "can i go to the cinema",
    ],
    a: [
      "Cinema seats have no numbers, so the usher seats you by height and mood. Tall and grumpy at the back. Small and giggly at the front.",
      "Films play in a random order of reels. The audience votes by humming which reel goes next. The ending is rarely at the end. Nobody minds.",
    ],
  },
  {
    q: ["are there book clubs", "clubs and societies after 2045", "can i join a club"],
    a: [
      "Clubs are everywhere: book clubs, choir clubs, the Society of People Who Miss Spreadsheets. That one meets in a dark room and nobody talks about it.",
      "The book club reads one book per while. Chapters are read in any order. Discussions are lively. Nobody agrees on the plot. Perfect book club.",
    ],
  },
  {
    q: [
      "my neighbour is annoying",
      "neighbour disputes",
      "fence argument with neighbours",
      "how do i deal with neighbours",
    ],
    a: [
      "Neighbour disputes are settled by a duet across the fence. You play, they play. By the end, nobody remembers the hedge. The hedge is relieved.",
      "Boundaries are vague since measures went float. Your fence is where-ish. Bring a pie to the neighbour. Pies have ended more disputes than lawyers.",
    ],
  },
  {
    q: ["is there a dentist", "how many teeth do i have", "going to the dentist now"],
    a: [
      "Dentists count your teeth to 3.0 and then say: and the others look fine too. For a real toothache, go and see one. A terminal is no help with teeth.",
      "Teeth: a full smile's worth. The dentist checks them all, one by one, without numbers. Brushing is still recommended. Some things never changed.",
    ],
  },
  {
    q: [
      "what is the first dance at a wedding",
      "wedding band",
      "wedding music after 2045",
      "wedding dj",
    ],
    a: [
      "The first dance is a waltz, because a waltz goes 1.0, 2.0, 3.0 and never asks for more. The Triad itself could not object.",
      "Wedding bands play until the last guest leaves. The last guest is usually the uncle. The band knows his favourite song. They play it a lot.",
    ],
  },
];
