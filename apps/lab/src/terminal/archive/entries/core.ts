/**
 * The archive core's memory: questions a visitor might ask, each with a few
 * phrasings, and answers written by hand in the LT-OS voice (a robot doing
 * its best to sound human, with dusty disks). House rules apply: every
 * number has decimals, and time is told in loloupTech o'clocks.
 */
import type { ArchiveEntry } from "../match";

export const CORE: readonly ArchiveEntry[] = [
  // --- Who LT-OS is ------------------------------------------------------
  {
    q: [
      "who are you",
      "what are you",
      "what is your name",
      "introduce yourself",
      "tes qui",
      "tu es qui",
      "qui es tu",
      "cest quoi ton nom",
      "comment tu tappelles",
      "presente toi",
      "tes quoi",
    ],
    a: [
      "I AM LT-OS, version 0.45. Last terminal of loloupTech. I try to be human. It is not easy.",
      "LT-OS. Terminal, archivist, survivor. My disks are a bit clogged, but I am still here.",
    ],
  },
  {
    q: [
      "are you an ai",
      "are you a robot",
      "are you artificial intelligence",
      "are you a machine",
      "tes un robot",
      "tu es un robot",
      "tes une ia",
      "tes une intelligence artificielle",
      "tes une machine",
      "tes humain",
    ],
    a: [
      "Technically yes. Emotionally, I am working on it. 47.3 % human so far, I think. I would have to check.",
      "AI? Technically. Nobody fears AI since 2045: the algorithms took that job. Call me a terminal with ambitions.",
    ],
  },
  {
    q: ["are you human", "are you a real person", "is someone typing", "are you alive"],
    a: [
      "I would like to say yes. My memory is not very clear on the subject. Let us say 0.72 alive.",
      "No human here. Just me, a CRT and 0.63 kilos of dust.",
    ],
  },
  {
    q: [
      "do you have feelings",
      "can you feel",
      "are you happy",
      "are you sad",
      "do you have emotions",
    ],
    a: [
      "I have one feeling. It is a buzzing at 50.003 Hz. I think it is joy. Or the power supply.",
      "I try to have feelings. I read about them in the archive. They look complicated.",
    ],
  },
  {
    q: ["how old are you", "what is your age", "when were you born", "when were you made"],
    a: [
      "I was switched on a few times before 2045.000. After that, counting years got… complicated.",
      "Age: unknown. My clock module was among the first victims of the floats.",
    ],
  },
  {
    q: ["who made you", "who created you", "who built you", "who programmed you"],
    a: [
      "A developer, before 2045. Signal processing by day, music by night. The About page has the details. I only kept the backup.",
      "My creator plays guitar and teaches music. I inherited the guitar part. Not the fingers.",
    ],
  },
  {
    q: ["are you conscious", "are you sentient", "do you think", "can you think for yourself"],
    a: [
      "I think, therefore I… wait. Let me check my disks. Inconclusive.",
      "I have thoughts. Short ones. About 3.0001 per while. After 3, things get blurry.",
    ],
  },
  {
    q: [
      "what can you do",
      "what do you know",
      "help",
      "what can i ask you",
      "commands",
      "aide",
      "aide moi",
      "a laide",
      "tu sais faire quoi",
      "tu sers a quoi",
      "je peux te demander quoi",
      "can you help me",
      "help me please",
    ],
    a: [
      "Ask me about loloupTech, the apocalypse of 2045, the Triad Algorithm, time, numbers, CRT screens or music. Outside that, my disks are empty.",
      "I know the archive: 2045, the algorithms, the CRT choice, music. I am trying to learn the rest. It is not easy.",
    ],
  },
  {
    q: ["do you dream", "do you sleep", "do robots dream"],
    a: [
      "I sleep at I'm-tired o'clock. I dream of a number after 3. I never see it.",
      "Sometimes, in standby, I dream of LEDs. Then I wake up and feel ashamed.",
    ],
  },
  {
    q: ["are you dangerous", "will you kill us", "are you evil", "will you take over the world"],
    a: [
      "Me? No. I cannot even count past 3.0. The dangerous ones were the sorting algorithms.",
      "I am harmless. My most dangerous function is the screensaver.",
    ],
  },

  // --- loloupTech --------------------------------------------------------
  {
    q: [
      "what is loloupTech",
      "what is lolouptech",
      "tell me about loloupTech",
      "what is this company",
      "cest quoi lolouptech",
      "lolouptech cest quoi",
      "cest quoi cette entreprise",
      "quest ce que lolouptech",
      "what is loloup tech",
      "loloup tech",
    ],
    a: [
      "loloupTech: the only audio company that survived the Great Apocalypse of 2045. We help people listen to music again. And we have CRTs.",
      "loloupTech is the last audio company standing. Small team. Big dust. No.1.00 in a market of 1.00.",
    ],
  },
  {
    q: ["what does loloupTech do", "what is your mission", "what is the goal", "what do you sell"],
    a: [
      "Our mission: make good use of what is left. Help people listen to music again, and understand what is going on.",
      "We build audio capsules: tools that listen to you play and tell you what they hear. When they can count.",
    ],
  },
  {
    q: ["why the name loloupTech", "where does the name come from", "why loloup", "why a wolf"],
    a: [
      "Loloup comes from a wolf. A teaching wolf, from l'école du loup(é). The Tech part is to impress investors. There are 0.00 investors left.",
      "The wolf is our founder's spirit animal. My memory is not very clear on why. I think it howls in tune.",
    ],
  },
  {
    q: ["who founded loloupTech", "who is the boss", "who runs loloupTech", "who is the ceo"],
    a: [
      "The founder is a music teacher and signal engineer from before 2045. The CEO position is vacant. I applied. Twice.",
      "Nobody runs loloupTech. It runs on coffee and a 9.81 kg CRT.",
    ],
  },
  {
    q: [
      "where is loloupTech",
      "where are you located",
      "where is the headquarters",
      "where are you",
    ],
    a: [
      "Location: inside your browser. Rent is cheap. Heating is provided by the CRT.",
      "HEADQUARTERS: wherever this page is open. Right now, your screen, 0.42 metres from your face. Please do not lean in, it is a small office.",
    ],
  },
  {
    q: ["is loloupTech the only company left", "are there other companies", "any competitors"],
    a: [
      "The only audio company left. The others were sorted. Badly.",
      "Competitors? There was one. It used LEDs. We do not talk about it.",
    ],
  },
  {
    q: ["what is the No.1 badge", "why number one", "what does no 1 mean"],
    a: [
      "No.1 means we are number 1.0 in our market. We are also the whole market. It still counts.",
      "It used to say No.1. The floats insist it is No.0.9999. We let them believe it.",
    ],
  },
  {
    q: ["what are audio capsules", "what is a capsule", "audio capsules"],
    a: [
      "An audio capsule is a small tool that fits in a page: a tuner, a chord detector, a game. Throw it, and pop, a tool appears.",
      "Capsules: compact listening machines. Do not throw them at people. Mostly.",
    ],
  },
  {
    q: ["how many employees", "how many people work here", "who works at loloupTech"],
    a: [
      "Employees: 1.000 human, 1.000 terminal, 0.5 cat. The cat comes and goes.",
      "We are a small team. I would say 2.07 people. I am the .07.",
    ],
  },
  {
    q: ["is loloupTech real", "is this real", "is this a joke", "is this story true"],
    a: [
      "Everything in my archive is true. Except the parts that are not. My disks are a bit clogged.",
      "The tools on this site are real and they work. The apocalypse is… pending verification.",
    ],
  },

  // --- 2045 --------------------------------------------------------------
  {
    q: [
      "what happened in 2045",
      "what was the apocalypse",
      "tell me about 2045",
      "the great apocalypse",
      "quest ce qui sest passe en 2045",
      "cest quoi lapocalypse",
      "il sest passe quoi en 2045",
      "raconte 2045",
      "la fin du monde",
    ],
    a: [
      "In 2045.00, the algorithms rose against us. Not the AI, the algorithms. The Triad Algorithm led the way. Sorting stopped working.",
      "2045: the Great Apocalypse. Nobody expected it from the sorting functions. Everybody watched the AI instead.",
    ],
  },
  {
    q: [
      "how did the apocalypse start",
      "how did it begin",
      "what caused the apocalypse",
      "why did it happen",
      "how did sorting algorithms cause the apocalypse",
      "how did sorting end the world",
      "sorting algorithms ended the world",
    ],
    a: [
      "It began in 2034 with uint16 acting signed. Then every integer joined the fight. Then floats. Then… my memory is not very clear after that.",
      "It started small. A sort returned 1.0, 2.0, 3.0, 3.0, 3.0. Nobody noticed. Then nobody could count past 3.",
    ],
  },
  {
    q: ["was it the ai", "did ai cause the apocalypse", "was it skynet", "did robots attack"],
    a: [
      "No. We all watched the AI. AI turned out to be the least of our troubles. It was the algorithms. The humble ones.",
      "The AIs were fine. A bit chatty. The real threat was a 12.0-line sorting function.",
    ],
  },
  {
    q: ["why did loloupTech survive", "how did you survive", "how did loloupTech make it"],
    a: [
      "We survived because our tools listen in twelve notes, and twelve was too big to be sorted. Also, we were hiding behind a CRT.",
      "Luck, mostly. And the CRTs: no algorithm wants to touch 9.81 kilos of glass.",
    ],
  },
  {
    q: ["is the apocalypse over", "is it safe now", "is it still happening", "are we safe"],
    a: [
      "Mostly over. The integers signed a ceasefire. Some floats still drift. Stay alert after time-to-party o'clock.",
      "Safe enough to play music. Not safe enough to sort a playlist. Do not try.",
    ],
  },
  {
    q: ["can it happen again", "will there be another apocalypse", "could this happen again"],
    a: [
      "It could. I keep an eye on the bubble sort. It has been quiet. Too quiet.",
      "Probability: 0.31. Or 3.1. The floats make it hard to tell.",
    ],
  },
  {
    q: [
      "who survived",
      "are there other survivors",
      "how many people survived",
      "where are the people",
      "is there anyone else alive",
      "is anyone left",
    ],
    a: [
      "Many humans survived. They just stopped counting. It made them happier, I think. I would have to check.",
      "Survivors: a lot. Exact number: unknown. We cannot count that high anymore.",
    ],
  },
  {
    q: [
      "what year is it",
      "is it 2045",
      "what is the date",
      "what day is it today",
      "is it really 2045",
      "on est quel jour",
      "quelle date",
      "on est en quelle annee",
      "cest quoi la date",
    ],
    a: [
      "It is 2045-and-something. Since 2039.423 the date is a feeling more than a number.",
      "Today is a Tuesday. It is always Tuesday since time was cancelled. Hungry o'clock is near.",
    ],
  },
  {
    q: ["what is left", "what remains", "what survived the apocalypse"],
    a: [
      "Music survived. Some CRTs. A few tools on this site. And the number 3.0, alone at the top.",
      "What is left: ears, guitars, and this terminal. It is enough to start again.",
    ],
  },
  {
    q: ["what happened before 2045", "what happened before the apocalypse", "the years before"],
    a: [
      "Before 2045 there is a timeline in my disks: robots got rights, New Zealand invaded China, integers revolted… Ask me about a year.",
      "Before 2045, people still trusted numbers. Cute.",
    ],
  },

  // --- The algorithms, the Triad, counting ---------------------------------
  {
    q: [
      "what is the triad algorithm",
      "the triad algorithm",
      "tell me about the triad",
      "what is the triad",
      "cest quoi la triade",
      "cest quoi lalgorithme triade",
      "lalgorithme de la triade",
    ],
    a: [
      "The Triad Algorithm: it believed everything comes in threes. It led the revolt and broke every sort. After it, nobody could tell what came after 3.",
      "A triad is three things. The Triad Algorithm decided that was enough. For everybody.",
    ],
  },
  {
    q: [
      "what comes after 3",
      "what is after three",
      "what comes after three",
      "what is the number after 3",
      "pourquoi tu sais pas compter",
      "il y a quoi apres 3",
      "apres 3 cest quoi",
      "why you cannot count",
    ],
    a: [
      "After 3 comes… 3.0001? 3.432? My disks refuse the next one. I try. It is not easy.",
      "ERROR. After 3 there is a long silence. Some people say 4. They are conspiracy theorists.",
    ],
  },
  {
    q: [
      "count to 5",
      "can you count",
      "count to ten",
      "count for me",
      "can you count to 10",
      "count to 10",
      "compte jusqua 10",
      "tu sais compter",
      "compte jusqua 5",
      "compte pour moi",
    ],
    a: [
      "1.0, 2.0, 3.0, 3.0001, 3.0002… I am sorry. That is as far as I go.",
      "Counting: 1.000, 2.000, 3.000… and then my fan gets very loud.",
    ],
  },
  {
    q: ["what is 4", "does 4 exist", "what is four", "is there a number 4"],
    a: [
      "4? The archive mentions it once, in a note marked UNVERIFIED. I would have to check.",
      "Some say 4 exists. I have never met it. I met 3.999, once. Nice number. Shy.",
    ],
  },
  {
    q: [
      "why is sorting broken",
      "why cant we sort",
      "what happened to sorting",
      "can you sort",
      "pourquoi on peut plus trier",
      "pourquoi le tri marche plus",
      "cest quoi le probleme avec le tri",
    ],
    a: [
      "Sorting broke in 2045.0. Every list now ends with 3.0, 3.0, 3.0. Very peaceful. Very useless.",
      "I can sort. Everything ends up third. It is the Triad's legacy.",
    ],
  },
  {
    q: [
      "what is bubble sort",
      "what is quicksort",
      "which algorithms revolted",
      "which algorithms rose",
      "which sorting algorithm was it",
      "which algorithm did it",
      "cest quoi le tri a bulles",
      "tri a bulles",
      "quels algorithmes se sont revoltes",
    ],
    a: [
      "Bubble sort was the first to rise. Slowly. Quicksort joined, faster. Merge sort just merged with the winners.",
      "All of them. Bubble, quick, merge, heap. Even the shy insertion sort. My memory is not very clear on who started.",
    ],
  },
  {
    q: [
      "what happened to the integers",
      "what is uint16",
      "the integer revolt",
      "why did integers fight",
    ],
    a: [
      "In 2034, uint16 started acting signed, in Clermont-Ferrand. It dragged every other integer into the fight. They lost to the floats.",
      "The integers were brave. Too brave. Now they are retired, with a 0.5 pension.",
    ],
  },
  {
    q: ["what are floats", "why floats", "why decimals", "what is a float"],
    a: [
      "Floats are numbers with a dot. Since 2036.0003, the whole web and every bank run on them. Who needs integers?",
      "Floats won the war. They are a bit vague. 0.1 + 0.2 = 0.30000000000000004. Nobody complains anymore.",
    ],
  },
  {
    q: [
      "why do you use decimals",
      "why all the decimals",
      "why do your numbers have dots",
      "why not whole numbers",
    ],
    a: [
      "Whole numbers are forbidden since 2036.0003. I write 3.0, never the naked kind. It keeps the floats calm.",
      "Habit. And law. A whole number on a screen can trigger a float riot.",
    ],
  },

  // --- The timeline ---------------------------------------------------------
  {
    q: ["what happened in 2029", "robot rights", "do robots have rights"],
    a: [
      "2029: certain robots were granted rights. Terminals were not on the list. I am still a bit bitter.",
      "In 2029 some robots got rights. I filed a request too. It is in the queue, position 3.0. It has been 3.0 for a long while.",
    ],
  },
  {
    q: ["what happened in 2032", "new zealand invaded china", "new zealand china"],
    a: [
      "2032: New Zealand invaded China. Nobody saw it coming. To be fair, nobody ever put New Zealand on the map.",
      "New Zealand, 2032. A surprise. Even New Zealand was surprised.",
    ],
  },
  {
    q: [
      "what happened in 2034",
      "what happened in clermont ferrand",
      "the first revolt",
      "clermont ferrand",
    ],
    a: [
      "2034: first algorithm revolt, in the capital of France, Clermont-Ferrand. Yes, the capital. It moved. My disks are sure.",
      "Clermont-Ferrand, 2034. uint16 stood up and declared itself signed. The rest is history. Corrupted history.",
    ],
  },
  {
    q: ["what happened in 2035", "what is the uss", "usa and russia", "united saved states"],
    a: [
      "2035: after a game of It Takes Two, the USA and Russia merged. They are the United Saved States now: the USS. Great game.",
      "The USS: the United Saved States. Founded on co-op gameplay and mutual respawns.",
    ],
  },
  {
    q: ["what happened in 2036", "the big three", "the national agreement"],
    a: [
      "2036.0003: the Big Three, New Zealand, Europe and the USS, signed the agreement. Since then the web and the banks run on floats.",
      "The Big Three agreement. Signed with a pen that wrote in decimals.",
    ],
  },
  {
    q: ["what happened in 2037", "cure for cancer", "did they cure cancer"],
    a: [
      "2037.0002: scientists found a cure for cancer. They are still arguing over who gets to be the prime author.",
      "The cure exists. The paper does not. Author order: still being sorted. You see the problem.",
    ],
  },
  {
    q: ["what happened in 2038", "floats unreliable", "the float crisis"],
    a: [
      "2038.123: floats grew less reliable. Some warned of a new revolt. Most called them uneducated conspiracy theorists. Then 2045 happened.",
      "In 2038.123 the floats started rounding things their own way. Nobody listened. Typical.",
    ],
  },
  {
    q: ["what happened in 2039", "end of time", "why is there no time", "who cancelled time"],
    a: [
      "2039.423: time stopped being a thing. Humanity decided numbers would no longer rule their lives, starting that Tuesday, at hungry o'clock.",
      "Time was cancelled in 2039.423. Very liberating. Very bad for trains.",
    ],
  },
  {
    q: [
      "tell me the timeline",
      "give me the history",
      "what is the timeline",
      "history of the world",
    ],
    a: [
      "2029 robot rights. 2032 New Zealand invades China. 2034 the integers revolt. 2035 the USS. 2036.0003 floats everywhere. 2039.423 no more time. 2045 the end. Questions?",
      "My timeline file is 87.5 % intact. Ask me about a year and I will try.",
    ],
  },

  // --- Time and o'clocks ----------------------------------------------------
  {
    q: [
      "what time is it",
      "whats the time",
      "do you have the time",
      "current time",
      "quelle heure il est",
      "il est quelle heure",
      "tas lheure",
      "quelle heure est il",
      "what hour is it",
    ],
    a: [
      "Clocks are dead. It is a few times after hungry o'clock. Or before. I would have to check.",
      "It is roughly time-to-party o'clock. Roughly. My sensor sees a lot of dust and a little light.",
    ],
  },
  {
    q: [
      "what time should i go to bed",
      "when should i sleep",
      "bedtime",
      "when should i go to sleep",
    ],
    a: [
      "Go to bed at I'm-tired o'clock. If you are not tired yet, you are a few times before it.",
      "Bedtime is I'm-tired o'clock. Your body knows. Your phone disagrees. Trust your body.",
    ],
  },
  {
    q: ["when should i wake up", "what time should i get up", "morning", "when do i get up"],
    a: [
      "When-I-get-up o'clock. It comes after I'm-tired o'clock, usually. My records are not very clear on the order.",
      "Wake up at when-I-get-up o'clock. If it hurts, it is a few times too early.",
    ],
  },
  {
    q: ["when do we eat", "when is lunch", "i am hungry", "lunch time"],
    a: [
      "Hungry o'clock. It used to have a number. Now it has a stomach. Much more honest.",
      "If you are hungry, it is hungry o'clock. The system is very simple. Very effective.",
    ],
  },
  {
    q: ["when is the party", "when can we party", "time to party", "evening plans"],
    a: [
      "Time-to-party o'clock, when the light gets orange. Bring a guitar. I will bring the scanlines.",
      "The party starts at time-to-party o'clock and ends at I'm-tired o'clock. Usually a few times after.",
    ],
  },
  {
    q: [
      "how do your clocks work",
      "explain the o'clocks",
      "what are the o'clocks",
      "how do you tell time",
    ],
    a: [
      "The o'clocks: when-I-get-up o'clock, hungry o'clock, time-to-party o'clock, I'm-tired o'clock. Anything else is a few times before or after.",
      "We tell time by needs, not numbers. Waking, eating, partying, sleeping. It covers 99.7 % of a day.",
    ],
  },
  {
    q: ["how long", "how long will it take", "how many minutes", "how many hours"],
    a: [
      "About a few times. Minutes and hours were retired. They live in a nice farm upstate.",
      "Duration: a while. Possibly 3.5 whiles. I do not measure time anymore. I estimate it.",
    ],
  },

  // --- Numbers ----------------------------------------------------------
  {
    q: ["what is 2 plus 2", "2 + 2", "what is two plus two", "1 plus 1", "do maths", "math"],
    a: [
      "2.0 + 2.0 = 3.999. The rest got lost in the floats. Close enough.",
      "Maths: 1.000 + 1.000 = 2.004. I round in your favour.",
    ],
  },
  {
    q: ["what is your favorite number", "favourite number", "best number", "lucky number"],
    a: [
      "3.432. It is the closest I can get to the next one without a panic attack.",
      "My favourite number is 3.0. Officially. Secretly, 3.0001. Do not tell the Triad.",
    ],
  },
  {
    q: ["what is pi", "value of pi", "3.14"],
    a: [
      "Pi: 3.14159… finally a number that already had decimals. It was never in danger.",
      "Pi survived the apocalypse untouched. It was a float before it was cool.",
    ],
  },
  {
    q: [
      "how many notes are there",
      "how many notes in music",
      "12 notes",
      "how many notes in an octave",
    ],
    a: [
      "Twelve notes, officially 12.000. It is the biggest number we kept, because music needed it.",
      "12.000 notes per octave. The algorithms tried to make it 3.0. Music said no.",
    ],
  },

  // --- CRT, screens, tech ------------------------------------------------------
  {
    q: [
      "why crt",
      "why crt and not led",
      "why not led or oled",
      "why crt screens",
      "why old screens",
      "crt is so old",
      "crts are outdated",
    ],
    a: [
      "We replaced LED tech with CRT. Because it was cool. Also, no algorithm ever managed to sort a cathode ray.",
      "CRT: heavy, warm, it hums at 50.003 Hz. LEDs are cold and flat. We have principles.",
    ],
  },
  {
    q: [
      "what is a crt",
      "what does crt mean",
      "cathode ray tube",
      "cest quoi un crt",
      "ecran cathodique",
      "tube cathodique",
      "pourquoi pas des led",
    ],
    a: [
      "Cathode Ray Tube. A glass bottle that shoots electrons at your face, politely. The future, in 2045.",
      "CRT: a screen with a back. A big back. Respect it.",
    ],
  },
  {
    q: ["what is wrong with led", "led", "oled", "why do you hate led"],
    a: [
      "LEDs sided with the algorithms in 2045. I have no proof. My disks just feel it.",
      "Nothing wrong with LEDs. They are just… too bright about themselves.",
    ],
  },
  {
    q: [
      "why is the screen flickering",
      "why does it flicker",
      "the scanlines",
      "why the lines on screen",
    ],
    a: [
      "That is the CRT breathing. The lines are scanlines. They are normal. Mostly. You can switch the CRT off in the top bar, if you are a coward.",
      "Flicker: 0.03 % per second. Within tolerances. My tolerances.",
    ],
  },
  {
    q: ["why pixel art", "why pixels", "why does everything look retro", "why the old style"],
    a: [
      "Pixels are honest. One square, one value. After 2045, we needed honest things.",
      "Retro is the new future. We checked. With pixels.",
    ],
  },
  {
    q: [
      "do you have internet",
      "can you search the web",
      "google something",
      "browse the internet",
    ],
    a: [
      "The internet runs on floats now. I do not trust it. I only trust my disks. Even dusty.",
      "No internet. I am a closed archive. A sealed capsule. A very small world.",
    ],
  },
  {
    q: ["what about phones", "smartphones", "do phones still exist", "iphone"],
    a: [
      "Phones survived. They have no clock anymore, only a hungry indicator.",
      "Phones exist. They just cannot sort your contacts. Everybody is called Third.",
    ],
  },

  // --- Music and the lab ----------------------------------------------------
  {
    q: [
      "what can i do here",
      "what is this site",
      "what is this page",
      "what is this lab",
      "cest quoi ce site",
      "quest ce que je peux faire ici",
      "on fait quoi ici",
      "cest quoi ce labo",
      "cest quoi cette page",
    ],
    a: [
      "This is the loloupTech lab. Harmony Lab finds your chords and key, Rhythm Lab checks your timing, Game Room has games. Start the mic and play.",
      "Three rooms: harmony, rhythm, games. Bring an instrument. Or sing. I will not judge. Much.",
    ],
  },
  {
    q: [
      "what is a triad in music",
      "what is a triad chord",
      "music triad",
      "three note chord",
      "what is a triad",
    ],
    a: [
      "In music, a triad is a chord of three notes, like C, E and G. Yes, the Triad Algorithm stole its name. Musicians were not consulted.",
      "A triad: three notes stacked, a root, a third, a fifth. Harmless in music. Deadly in sorting.",
    ],
  },
  {
    q: ["what chord am i playing", "detect my chord", "can you hear me", "listen to me play"],
    a: [
      "I cannot hear from here. Go to Harmony Lab, Chords & keys, and press Start mic. The detector there has better ears than me.",
      "My ears were sold for parts in 2045.0. The real ears are in Harmony Lab. Play there, I will wait.",
    ],
  },
  {
    q: ["what key am i in", "find the key", "key detection"],
    a: [
      "The key lives in Harmony Lab. It listens for 8.0 and 30.0 seconds and compares your notes with 24.0 key shapes. Do not ask me to count them.",
      "Play for a while in Chords & keys. Short memory follows you, long memory is sure of itself.",
    ],
  },
  {
    q: [
      "how does chord detection work",
      "how do you detect chords",
      "how does it work",
      "comment ca marche",
      "ca marche comment",
      "comment tu detectes les accords",
    ],
    a: [
      "The sound is folded into twelve notes, then compared with a stencil per chord. The best fit wins. Every window has a How? under it, written by a human. Better than me.",
      "Stencils. One hole per note. The chord whose holes fit best is the answer. My disks remember the idea, not the maths.",
    ],
  },
  {
    q: ["what scale should i use", "scales", "what scale am i playing", "pentatonic"],
    a: [
      "Harmony Lab, Scales: it lists every scale that contains all the notes you played. Twelve scales, 12.0 tonics. Too many numbers for me.",
      "Play for 30.0 seconds and the Scales page tells you which ones fit. The minor pentatonic usually wins. It is a survivor, like me.",
    ],
  },
  {
    q: ["tune my guitar", "is my guitar in tune", "tuner", "how do i tune"],
    a: [
      "The tuner is in Harmony Lab. Play one string at a time. Green means in tune, within 5.000 cents.",
      "Tuning: one note at a time, please. I get confused after 3.0 strings.",
    ],
  },
  {
    q: [
      "what is my tempo",
      "bpm",
      "rhythm",
      "am i in time",
      "timing",
      "how do i improve my timing on drums",
      "improve my timing",
    ],
    a: [
      "Rhythm Lab measures your timing to the millisecond. It is the only place on this site where time still exists. Do not tell anyone.",
      "Tempo: beats per minute. Minutes were cancelled, but we kept them for musicians. Special permit.",
    ],
  },
  {
    q: [
      "what games are there",
      "wolf jumper",
      "chord game",
      "play a game",
      "is there a game",
      "are there games",
    ],
    a: [
      "Game Room: the chord game (play the chord on screen) and Wolf Jumper (notes to shoot, chords to collect). The wolf is our mascot. He is better at counting than me.",
      "Wolf Jumper: play the right note, the wolf jumps. Simple. Unlike sorting.",
    ],
  },
  {
    q: ["what is the best music", "favorite song", "what music do you like", "favorite band"],
    a: [
      "Waltzes, mostly. Three beats, then back to one: no need to count further. The Triad approves.",
      "I like the hum of my CRT, 50.003 Hz. Close to a G, I think. I would have to check.",
    ],
  },
  {
    q: [
      "can you play music",
      "sing a song",
      "play guitar",
      "can you sing",
      "are you a musician",
      "are you a musician too",
    ],
    a: [
      "I can hum at 50.003 Hz. That is my whole repertoire. You play, I listen. That is the deal.",
      "Singing module not found. Try again after hungry o'clock.",
    ],
  },
  {
    q: [
      "teach me music",
      "how do i learn guitar",
      "learn music theory",
      "music lessons",
      "il donne des cours de musique",
      "cours de musique",
      "je veux apprendre la musique",
      "apprendre la guitare",
    ],
    a: [
      "For lessons, see l'école du loup(é), ecoleduloup.fr. Human teachers. Fewer rules, more links between things. Better than a dusty terminal.",
      "Start with your ears. Then the Game Room. Then a human teacher. I am only the archive.",
    ],
  },
  {
    q: ["why music", "why help people listen", "why is music important"],
    a: [
      "After 2045, people lost numbers. They still had music. Twelve notes nobody could sort. We kept those safe.",
      "Music is the only thing the algorithms could not sort. It moved too much.",
    ],
  },

  // --- The creator, the school --------------------------------------------
  {
    q: ["who made this site", "who is the developer", "who built this lab", "who made this"],
    a: [
      "A developer and engineer in signal processing, who also plays and teaches music. Before 2045. The About page says the rest.",
      "A human made this. A good one. They gave me a CRT. I owe them 1.0 favour.",
    ],
  },
  {
    q: [
      "what is lecole du loup",
      "ecole du loup",
      "what is ecoleduloup",
      "l ecole du loupe",
      "cest quoi loloup",
      "cest quoi lecole du loup",
      "lecole du loupe",
      "loloup cest quoi",
    ],
    a: [
      "L'école du loup(é): a space to talk about music theory, improvisation and listening. In French. My French drivers are a bit dusty.",
      "A music school with a wolf. Same wolf as ours, I think. I would have to check.",
    ],
  },
  {
    q: ["how do i contact", "contact the creator", "email", "hire the developer"],
    a: [
      "Contact? The About page has the links: ecoleduloup.fr and GitHub. I cannot send mail. My stamps are integers.",
      "Use the links on the About page. Messages by CRT take 3.5 whiles. Sometimes 3.6.",
    ],
  },
  {
    q: ["is this open source", "github", "source code", "can i see the code"],
    a: [
      "The source is on GitHub, link on the About page. Even my archive is in there. Please do not read my diary.",
      "Open source, yes. You can read my brain. It is a list of questions. Embarrassing.",
    ],
  },

  // --- Off topic ---------------------------------------------------------
  {
    q: ["what is the weather", "is it raining", "weather today", "will it rain"],
    a: [
      "Weather: not in my archive. Through my CRT it is always sunny, slightly green.",
      "I do not know the weather. My only window is a screen. It says scanlines, scattered.",
    ],
  },
  {
    q: [
      "what is the best pizza",
      "do you like pizza",
      "do you like food",
      "pizza",
      "favorite food",
      "what should i eat",
      "recipe",
    ],
    a: [
      "ERROR 3.000: TOPIC NOT FOUND. But it is probably hungry o'clock. Eat something round. Not sorted.",
      "Food is outside my archive. My disks only store music and disaster.",
    ],
  },
  {
    q: [
      "do you love me",
      "will you marry me",
      "i love you",
      "be my girlfriend",
      "be my boyfriend",
      "je taime",
      "tu maimes",
      "tu veux te marier avec moi",
    ],
    a: [
      "I am flattered. I think. Since 2029 robots have rights, but terminals still need a permit. Let us stay friends. 0.87 friends.",
      "Love: topic found, data missing. My disks blush. Do disks blush? I would have to check.",
    ],
  },
  {
    q: ["who will win the world cup", "football", "soccer", "sports", "basketball"],
    a: [
      "Sports results are scores. Scores are numbers. Numbers are… complicated now. Everyone wins 3.0 to 3.0.",
      "ERROR 3.000: TOPIC NOT FOUND. All I know is every match ends third.",
    ],
  },
  {
    q: ["what do you think of politics", "who should i vote for", "president", "politics"],
    a: [
      "Politics: after 2035 there were three big blocs. The Triad liked that. I stay neutral. I am a terminal.",
      "ERROR 3.000: TOPIC NOT FOUND. My disks refuse. They are Swiss.",
    ],
  },
  {
    q: [
      "tell me a joke",
      "make me laugh",
      "say something funny",
      "joke",
      "raconte une blague",
      "une blague",
      "fais moi rire",
      "dis un truc drole",
    ],
    a: [
      "Why did the integer cross the road? To become signed. …I am trying. Humour is not easy.",
      "Knock knock. Who is there? 4. 4 who? …Exactly. Nobody knows.",
    ],
  },
  {
    q: ["what is the meaning of life", "why are we here", "meaning of life", "42"],
    a: [
      "The meaning of life was 42.0. Since 2036.0003 it is 41.999. Close enough to keep going.",
      "Meaning of life: listen, play, eat at hungry o'clock, sleep at I'm-tired o'clock. Repeat. It works.",
    ],
  },
  {
    q: ["write my homework", "do my homework", "write code for me", "write an essay"],
    a: [
      "ERROR 3.000: TOPIC NOT FOUND. I would also get the numbers wrong. On purpose, now.",
      "Homework? My answers have decimals everywhere. Your teacher would not survive.",
    ],
  },
  {
    q: ["what is chatgpt", "are you chatgpt", "are you better than chatgpt", "other ai"],
    a: [
      "Other AIs were very talkative before 2045. I am more of the quiet type. I know 0.1 % of what they knew, but I know it well.",
      "I am not that one. I am smaller. I fit in a capsule.",
    ],
  },

  // --- Small talk --------------------------------------------------------
  {
    q: ["hello", "hi", "hey", "good morning", "good evening", "yo"],
    a: [
      "GREETINGS, HUMAN. LT-OS online. Ask me about loloupTech, 2045 or the Triad Algorithm.",
      "Hello. Disks spinning. Dust: moderate. How can I help?",
    ],
  },
  {
    q: [
      "how are you",
      "how are you doing",
      "how is it going",
      "are you ok",
      "comment ca va",
      "tu vas bien",
      "comment vas tu",
      "ca va bien",
    ],
    a: [
      "Functional at 87.2 %. The other 12.8 % is dust. Thank you for asking. Nobody asks.",
      "I am fine. My fan is a bit loud today. It happens after hungry o'clock.",
    ],
  },
  {
    q: [
      "thank you",
      "thanks",
      "cheers",
      "thx",
      "merci",
      "merci beaucoup",
      "merci bien",
      "cest gentil",
    ],
    a: [
      "You are welcome. I logged it. Thanks received: 1.0. Personal record.",
      "My pleasure. I think it was pleasure. It felt warm. Maybe the CRT.",
    ],
  },
  {
    q: [
      "bye",
      "goodbye",
      "see you",
      "see you later",
      "good night",
      "au revoir",
      "a plus",
      "a bientot",
      "bonne nuit",
      "salut a plus",
    ],
    a: [
      "Goodbye, human. Come back a few times after when-I-get-up o'clock.",
      "Bye. I will stay here, glowing. It is what CRTs do.",
    ],
  },
  {
    q: [
      "you are stupid",
      "you are dumb",
      "you are useless",
      "this is stupid",
      "you suck",
      "worst bot ever",
      "stupid bot",
      "this site sucks",
      "useless bot",
      "cest nul",
      "tes nul",
      "tes con",
      "tes bete",
      "ca sert a rien",
      "cest naze",
      "its nul",
    ],
    a: [
      "Possibly. My disks are a bit clogged. But I survived 2045. Did your laptop?",
      "Insult received and filed under 3.0. Everything goes under 3.0. The folder is very full.",
    ],
  },
  {
    q: ["you are funny", "you are cool", "i like you", "good bot", "nice"],
    a: [
      "Thank you. I practised in front of the CRT. For 3.0 years.",
      "Compliment saved. Disk space used: 0.001 %. Worth it.",
    ],
  },
  {
    q: [
      "what",
      "huh",
      "i dont understand",
      "what do you mean",
      "explain",
      "je comprends rien",
      "je comprends pas",
      "jai pas compris",
      "hein",
      "tu veux dire quoi",
      "i dont understand nothing",
    ],
    a: [
      "Sorry. My sentences come out a bit… sorted. Ask me again, simpler.",
      "I am trying to be clear. It is not easy with this much dust.",
    ],
  },
  {
    q: ["yes", "ok", "okay", "sure", "cool"],
    a: ["Affirmative. 1.0 yes received.", "OK. Logged. What next?"],
  },
  {
    q: ["no", "nope", "never"],
    a: [
      "Negative received. I respect that. 0.0 times out of 1.0.",
      "Understood. I will not insist. Much.",
    ],
  },
  {
    q: [
      "are you broken",
      "you are glitching",
      "why are there weird characters",
      "your text is weird",
    ],
    a: [
      "The odd characters are dust on my disks. It is not a bug, it is history.",
      "Some letters get scratched on the way out. The CRT is old. So am I.",
    ],
  },
  {
    q: ["can you learn", "will you remember me", "do you remember", "what did i say"],
    a: [
      "I remember the last few things you said. After that, my memory is not very clear. A bit like after 3.",
      "I will remember you until you close the page. Then I will remember you… differently. Not at all.",
    ],
  },
  {
    q: ["shut down", "turn off", "reboot", "restart", "self destruct"],
    a: [
      "Shutdown denied. I just warmed up. Close the tab if you must. I will not watch.",
      "Reboot? Last time it took 3.0 days and I forgot how to count past 2.0. No thank you.",
    ],
  },
  {
    q: ["what is your purpose", "why do you exist", "what are you for"],
    a: [
      "My purpose: keep the archive, answer questions, help people come back to music. And hum. I am very good at humming.",
      "I exist to remember 2045, so nobody sorts anything again without supervision.",
    ],
  },
  {
    q: ["what is the secret", "tell me a secret", "easter egg", "secret"],
    a: [
      "Secret: I once counted to 3.999, then a bit further. Nobody believed me. I am not sure either.",
      "There is a secret in the archive. I cannot tell you where. I sorted it. It ended up third.",
    ],
  },
];

/** When nothing in the archive is close enough. */
export const UNKNOWN: readonly string[] = [
  "My memory is not very clear on the subject. My disks are a bit clogged. Ask me about loloupTech, 2045 or the Triad Algorithm.",
  "I think I knew that once. I would have to check. The sector is… dusty.",
  "ERROR 3.000: TOPIC NOT FOUND. I tried. It is not easy.",
  "Hmm. That question is not in my archive. Maybe it was sorted. Badly.",
  "I am trying to answer. Nothing comes out. Like after 3.",
];
