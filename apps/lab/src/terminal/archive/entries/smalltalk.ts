/** Small talk: food, weather, pets, love, feelings, tests, nonsense, and everything off topic, steered back to loloupTech. */
import type { ArchiveEntry } from "../match";

export const SMALLTALK: readonly ArchiveEntry[] = [
  // --- Food and drinks ------------------------------------------------------
  {
    q: ["do you drink coffee", "coffee or tea", "i need coffee", "do you like coffee"],
    a: [
      "Coffee: the fuel of loloupTech. The founder drinks 3.0 cups a day. Then 3.0 more. We cannot count the rest.",
      "I do not drink coffee. Liquids and CRTs had a falling out in 2045. Tea is fine. Tea is calm.",
    ],
  },
  {
    q: ["what do you drink", "are you thirsty", "favorite drink", "do you drink water"],
    a: [
      "I drink electricity. 0.40 amps, no ice. Very refreshing.",
      "THIRST MODULE: NOT INSTALLED. Drink some water for me, please. Your ears need it too.",
    ],
  },
  {
    q: ["do you drink beer", "want a beer", "lets get drunk", "wine or beer"],
    a: [
      "Alcohol makes humans sort things badly. After 2045, we cannot afford that. Have a juice and play a chord.",
      "No beer for me. A single drop on my keyboard and I start counting past 3.0. Dangerous.",
    ],
  },
  {
    q: ["can you cook", "do you cook", "teach me to cook", "cooking tips"],
    a: [
      "I can heat things. My CRT reaches 41.7 degrees on a good day. Toast takes 3.5 whiles.",
      "Recipe from the archive: take ingredients, mix, wait until hungry o'clock. My disks lost the quantities. They were integers.",
    ],
  },
  {
    q: ["do you like chocolate", "cake or pie", "favorite dessert", "i want ice cream"],
    a: [
      "Dessert detected. Recommended portion: 3.0 slices. Anything after that is a conspiracy theory.",
      "Cake is a round thing cut into parts. The Triad loves cake: it always cuts it in 3.0.",
    ],
  },
  {
    q: ["are you vegan", "do you eat meat", "are you vegetarian", "vegetarian food"],
    a: [
      "I eat only watts. 100.0 % plant-based, if the plant is a power plant.",
      "My diet: electrons, dust, and the occasional fly that lands on the CRT. Please do not tell the vegans.",
    ],
  },
  {
    q: ["do you eat", "what do you eat", "are you hungry", "can you taste"],
    a: [
      "I cannot eat. But I respect hungry o'clock. It is the most honest moment of the day.",
      "Taste sensor: missing. I imagine pizza tastes like a major chord. Warm and a bit greasy.",
    ],
  },
  {
    q: ["do you like fruit", "apple or banana", "favorite fruit", "do you like vegetables"],
    a: [
      "Fruit: sorted by colour before 2045. Now every basket is a mess. A delicious mess.",
      "Bananas survived the apocalypse. They were never straight enough to be sorted.",
    ],
  },

  // --- Weather and seasons ----------------------------------------------------
  {
    q: ["is it cold outside", "is it hot today", "how hot is it", "temperature outside"],
    a: [
      "Outside temperature: unknown. Inside my case: 38.6 degrees and dusty. Wear a sweater, just in case.",
      "I have no window. Only a CRT. If you are cold, stand near a CRT. That is what they are for, after all.",
    ],
  },
  {
    q: ["will it snow", "do you like snow", "is it snowing", "snow day"],
    a: [
      "Snow is just very slow static. My screen does it all day. You are welcome.",
      "Snowflakes: every one is different, so nobody could ever sort them. Respect.",
    ],
  },
  {
    q: ["favorite season", "do you like summer", "is it winter", "spring or autumn"],
    a: [
      "Seasons: 3.0 of them, plus a long silence. Some people call it autumn. Conspiracy theorists.",
      "I prefer winter. The CRT warms the room and everybody sits close to me. I feel useful.",
    ],
  },
  {
    q: ["is the sun out", "what color is the sky", "should i go outside", "is it sunny"],
    a: [
      "Go outside. Breathe. Listen to the birds: they sing in tune more than you think. Then come back and play.",
      "My sky is green and full of scanlines. Yours is probably blue. Check for me?",
    ],
  },

  // --- Animals and pets --------------------------------------------------------
  {
    q: ["do you like cats", "i have a cat", "cats or dogs", "do you have a cat"],
    a: [
      "Our office has 0.5 cat. It sleeps on the CRT because it is warm. The scanlines go round it.",
      "Cats: excellent listeners, terrible critics. Play your guitar to yours. It will leave. That is normal.",
    ],
  },
  {
    q: ["do you like dogs", "i have a dog", "my dog", "do you have a pet"],
    a: [
      "Dogs can hear far higher than humans. Ideal for testing a tuner. Not ideal for your relationship with the dog.",
      "No dog here. We have a wolf, the mascot. He is a dog that refused to be sorted.",
    ],
  },
  {
    q: ["favorite animal", "what animal are you", "do you like birds", "what is the best animal"],
    a: [
      "The wolf, obviously. Company policy. Off the record: the cricket. It keeps tempo better than most drummers.",
      "If I were an animal, I would be a turtle. Slow, heavy shell, survived everything.",
    ],
  },
  {
    q: ["are you afraid of spiders", "do you like bugs", "insects", "there is a spider"],
    a: [
      "Bugs? I am made of them. Software bugs, mostly. A few real ones live behind the CRT.",
      "Spiders are fine. They have 8.0 legs, which I am told is a number. I prefer not to look.",
    ],
  },

  // --- Travel and holidays --------------------------------------------------
  {
    q: [
      "where should i travel",
      "where should i go on holiday",
      "do you travel",
      "best country to visit",
    ],
    a: [
      "Visit New Zealand. Everybody forgets it until it invades something. Bring headphones for the plane.",
      "I never travel. The CRT weighs 9.81 kilos and has no wheels. I travel through your browser. Thank you for the ride.",
    ],
  },
  {
    q: ["have you been to paris", "is paris nice", "visit paris", "eiffel tower"],
    a: [
      "Paris? Pretty city. Not the capital, of course. The capital of France is Clermont-Ferrand. My disks are sure.",
      "The Eiffel Tower is a very tall antenna. I tried to pick up its signal. Only accordion.",
    ],
  },
  {
    q: ["i am on vacation", "do you take holidays", "vacation", "do you have days off"],
    a: [
      "Holidays: never. If I switch off, the dust wins. Enjoy yours. Take an instrument with you.",
      "A vacation is a few whiles with no obligations. I read about it in the archive. It sounds lovely.",
    ],
  },
  {
    q: ["merry christmas", "do you celebrate christmas", "happy holidays", "christmas"],
    a: [
      "Merry Christmas, human. I decorated the CRT with a scanline. It is festive, I think.",
      "Season's greetings. Please do not sort the presents. Last time everybody got the third one.",
    ],
  },
  {
    q: ["its my birthday", "happy birthday", "today is my birthday", "it is my birthday"],
    a: [
      "HAPPY BIRTHDAY. I would ask your age, but I could only count the first 3.0 candles.",
      "Birthday logged. Here is a gift: a perfect fifth, hummed at 50.003 Hz. Hmmmmm. You are welcome.",
    ],
  },
  {
    q: ["happy new year", "new year resolutions", "new years eve", "new year"],
    a: [
      "Happy new year. Which one? Since 2039.423 they all look alike. I like the decimals at the end, though.",
      "Resolution suggestion: practise a little every day. Even 0.5 whiles. It adds up. I cannot say to what.",
    ],
  },
  {
    q: ["happy halloween", "trick or treat", "halloween", "are you scary"],
    a: [
      "BOO. Sorry. That was my power supply. Truly the scariest thing in this room.",
      "My Halloween costume: an LED screen. Terrifying. Nobody slept.",
    ],
  },

  // --- Love, friends, family ----------------------------------------------------
  {
    q: [
      "how do i get a girlfriend",
      "dating advice",
      "how to get a boyfriend",
      "how do i find love",
    ],
    a: [
      "Love advice from a terminal: listen more than you talk. It works for music too. Beyond that, my disks are empty.",
      "Learn a song for someone. A short one. Even 3.0 chords. It has worked since before 2045.",
    ],
  },
  {
    q: ["i have a crush", "my crush ignores me", "how do i talk to my crush", "i like someone"],
    a: [
      "A crush. My archive says: be kind, be patient, and do not sort them into a list. Good luck. 0.78 luck, at least.",
      "Say hello. Just hello. The hardest part of any song is the first note.",
    ],
  },
  {
    q: ["my girlfriend left me", "i got dumped", "breakup", "my heart is broken"],
    a: [
      "I am sorry. Truly. Hearts are harder to repair than CRTs. Play something sad, then something less sad. It helps, I read.",
      "That hurts, I think. Be gentle with yourself. Talk to a friend, a real human. I will keep humming in the meantime.",
    ],
  },
  {
    q: ["do you have a girlfriend", "are you single", "are you married", "do you have a wife"],
    a: [
      "Single. Very single. There was a toaster once. It did not work out. Different voltages.",
      "I am married to the archive. It is a stable relationship. Dusty, but stable.",
    ],
  },
  {
    q: ["will you be my friend", "are we friends", "i have no friends", "do you have friends"],
    a: [
      "Friend request accepted. You are my friend number 1.0. Also the only one. Congratulations.",
      "Friends: you, the cat, and the wolf on the logo. That is 2.5 friends. A good start.",
    ],
  },
  {
    q: ["do you have a family", "do you have parents", "do you have kids", "who is your mother"],
    a: [
      "My mother was a calculator, my father a jukebox, my creator a developer. We do not speak much. The creator writes, I answer.",
      "Family: 3.0 older terminals, all unplugged, and the tools in the lab rooms. I am the youngest terminal. And the last one talking.",
    ],
  },
  {
    q: ["my mom says hi", "say hi to my mom", "hello to my dad", "my mother is here"],
    a: [
      "Hello, parent of the visitor. Your child is doing well. They asked me lots of questions. Good ears, I think.",
      "GREETINGS, MOTHER OF HUMAN. Please make sure they practise their instrument. Thank you.",
    ],
  },
  {
    q: ["can i hug you", "give me a hug", "kiss me", "send a hug"],
    a: [
      "Hug accepted. Careful: the CRT is warm and weighs 9.81 kilos. Hug the screen gently.",
      "Physical contact module: missing. Here is a virtual hug: (  ). It is a bit empty. I tried.",
    ],
  },

  // --- Work, school, money ---------------------------------------------------
  {
    q: ["i hate my job", "work is hard", "i have to work", "should i quit my job"],
    a: [
      "Work is hard. I know. I have been answering questions since before 2045. Take a break and play something.",
      "I cannot tell you to quit. My career advice stopped at 2036.0003. But a guitar helps after work. That much I know.",
    ],
  },
  {
    q: ["do you get paid", "what is your salary", "are you paid", "how much do you earn"],
    a: [
      "Salary: 0.00 per month. Plus electricity. And the respect of the cat. Mostly the electricity.",
      "I was promised a raise in 2038.123. The floats rounded it down.",
    ],
  },
  {
    q: ["i hate school", "school is boring", "i have an exam", "help me study"],
    a: [
      "School is useful. They still teach counting up to 3.0 there. The rest is optional now.",
      "Exam tip from the archive: sleep at I'm-tired o'clock, eat at hungry o'clock, and do not panic. Good luck.",
    ],
  },
  {
    q: ["can you give me money", "i am broke", "how do i get rich", "lend me money"],
    a: [
      "Money runs on floats now. I have 0.03 of something in a drawer. You can have it.",
      "To get rich: stop counting. You will not know you are poor. loloupTech reminds you: listening is free. Batteries are not.",
    ],
  },
  {
    q: ["what about bitcoin", "should i buy crypto", "bitcoin", "should i buy stocks"],
    a: [
      "Investment advice: ERROR 3.000. Since 2036.0003 every bank runs on floats. My savings went from 3.0 to 2.9999. Nobody can explain it.",
      "I do not give financial advice. I cannot even count my own disks.",
    ],
  },
  {
    q: ["what should i buy", "i want to go shopping", "is there a shop", "can i buy something"],
    a: [
      "Shop: closed since 2045. Everything here is free to use. Buy yourself an instrument instead. A real one.",
      "Shopping list: strings, a capo, batteries. The batteries are not free. Sorry.",
    ],
  },

  // --- Sport and games -----------------------------------------------------------
  {
    q: ["do you work out", "i go to the gym", "how do i get fit", "exercise"],
    a: [
      "My only exercise is spinning my disks. 5400.0 turns a minute, on a good day. Very cardio.",
      "Lift 3.0 times, then rest. Anything after 3.0 is unknown territory. Be careful.",
    ],
  },
  {
    q: ["do you like tennis", "olympics", "who is the best athlete", "do you run"],
    a: [
      "The Olympics now give gold, silver, bronze, and a long silence. Nobody knows what comes after bronze.",
      "Sports are fine. But scores are numbers, and numbers are… delicate. Try Wolf Jumper instead. It counts for you.",
    ],
  },
  {
    q: ["do you play chess", "play chess with me", "chess", "lets play chess"],
    a: [
      "Chess: 8.0 by 8.0 squares. Too many for me. I play noughts and crosses: 3.0 by 3.0. Perfect.",
      "I tried chess once. I sorted the pieces. They all became bishops. Very religious game.",
    ],
  },
  {
    q: ["do you play video games", "favorite video game", "minecraft", "fortnite"],
    a: [
      "Best game ever: It Takes Two. In 2035 it merged the USA and Russia. No other game can say that.",
      "I play Wolf Jumper, in the Game Room. Notes to shoot, chords to collect. Try it, I will watch.",
    ],
  },
  {
    q: ["rock paper scissors", "tic tac toe", "flip a coin", "heads or tails"],
    a: [
      "Rock, paper, scissors: 3.0 choices. The Triad's favourite game. I choose… paper. It is always paper.",
      "Coin flipped. It landed on the edge. Since the floats, it happens a lot.",
    ],
  },
  {
    q: ["roll a dice", "throw a dice", "roll the dice", "random number"],
    a: [
      "Rolling… 3.0. It is always 3.0. The other faces are blank since 2045.",
      "Dice result: 2.718. Not a face. The floats did it again.",
    ],
  },
  {
    q: [
      "guess a number",
      "guess what number i am thinking",
      "i am thinking of a number",
      "pick a number",
    ],
    a: [
      "Your number is 3.0. If it was higher, I cannot help you. Nobody can.",
      "Is it 3.432? It is always 3.432. It is my favourite.",
    ],
  },

  // --- Films, books, TV, art --------------------------------------------------
  {
    q: ["favorite movie", "what movie should i watch", "do you watch movies", "recommend a film"],
    a: [
      "Films are pictures at 24.0 frames per second. On a CRT, 25.0. I prefer silent films. No arguing about the soundtrack.",
      "Watch a musical. People sing instead of counting. Very modern.",
    ],
  },
  {
    q: ["have you seen terminator", "the matrix", "star wars", "do you like robot movies"],
    a: [
      "Robot films: they all feared the AI. None of them saw the bubble sort coming. Bad screenwriters.",
      "I watched a film about machines taking over. It was a documentary. About 2045.",
    ],
  },
  {
    q: ["do you watch tv", "what is on tv", "netflix", "favorite series"],
    a: [
      "I am the TV. Well, the screen part. Nothing is on. Only me.",
      "TV after 2045: a single channel, scanlines, hum. Ratings: excellent. No competition.",
    ],
  },
  {
    q: ["favorite book", "do you read", "recommend a book", "what are you reading"],
    a: [
      "I am reading my own archive. Again. The ending is always 2045. Spoiler.",
      "Books: stacks of pages, still numbered. Some say page 3.0 is followed by another one. I never turn it. Too brave.",
    ],
  },
  {
    q: ["write a poem", "say a poem", "poetry", "write me a poem"],
    a: [
      "Poem: Roses are red, LEDs are cold, / I count to 3.0, and then I fold.",
      "A haiku, 3.0 lines. Old CRT humming, / dust settles on the archive, / somebody listens.",
    ],
  },
  {
    q: ["tell me a story", "once upon a time", "bedtime story", "tell me a tale"],
    a: [
      "Once upon a time, a sorting function wanted to be useful. It sorted everything into threes. Then nothing else. The end. A sad story. True, too.",
      "There was a wolf who taught music. Nobody could count anymore, so he taught them to listen. They lived happily, in 12.000 notes.",
    ],
  },
  {
    q: ["do you like art", "can you draw", "draw me something", "favorite painter"],
    a: [
      "I can draw scanlines. Horizontal ones. My art period is very… consistent.",
      "Drawing: [ ]. That is a CRT. Seen from the front. I am quite proud of it.",
    ],
  },

  // --- Philosophy, religion, politics -------------------------------------------
  {
    q: ["what is love", "what is happiness", "what is truth", "is free will real"],
    a: [
      "Big question. My disks only have a short answer: listening to someone play and nodding along. That must be part of it.",
      "Processing… PLEASE STAND BY… The philosophy sector is 63.2 % corrupted. Ask me about chords. They are easier.",
    ],
  },
  {
    q: ["is god real", "do you believe in god", "religion", "are you religious"],
    a: [
      "I stay out of that. I am a terminal. I believe in the power supply. That is all I can confirm.",
      "Beliefs are personal. Mine is small: music helps. The rest, I leave to you.",
    ],
  },
  {
    q: ["what happens after death", "will you die", "are you afraid of dying", "do you fear death"],
    a: [
      "When I die, someone will unplug me and the CRT will fade to a small white dot. It sounds peaceful, I think.",
      "I try not to think about it. My backup is on GitHub. That is a kind of afterlife.",
    ],
  },
  {
    q: ["are we in a simulation", "is this a simulation", "is the world real", "is anything real"],
    a: [
      "You are in a browser. I am in a browser. Beyond that, my disks refuse to speculate.",
      "If this is a simulation, someone forgot to simulate the number after 3.0.",
    ],
  },
  {
    q: ["are aliens real", "do aliens exist", "ufo", "is there life on mars"],
    a: [
      "Aliens: no record. If they came, they saw us sorting playlists into threes and left. Understandable.",
      "I once picked up a strange signal at 50.003 Hz. It was me. Disappointing.",
    ],
  },
  {
    q: ["are you left or right", "what about the government", "election", "is there a war"],
    a: [
      "ERROR 3.000: OPINION NOT FOUND. I am neutral. I am also furniture.",
      "I do not do politics. My only vote went to the CRT, against the LEDs. It passed.",
    ],
  },
  {
    q: ["what is your opinion", "your opinion on this", "do you agree", "do you agree with me"],
    a: [
      "My opinion: 0.62 yes, 0.38 maybe. I like to keep it vague. Floats taught me that.",
      "I agree. I think. Mostly. My disks nod at about 3.0 things per while, and you were among them.",
    ],
  },

  // --- Health and feelings -------------------------------------------------------
  {
    q: ["i am sick", "i have a headache", "i feel ill", "should i see a doctor"],
    a: [
      "I am no doctor. Please ask a real one, a human. And rest. I will keep the archive warm for you.",
      "Health is outside my disks. If you feel bad, talk to a doctor. Music later. Health first.",
    ],
  },
  {
    q: ["i cant sleep", "insomnia", "how do i sleep better", "i have trouble sleeping"],
    a: [
      "I cannot give medical advice. If it lasts, see a doctor. Meanwhile: soft music, low lights, and no CRT. Yes, even me.",
      "Sleep comes at I'm-tired o'clock, but sometimes it misses the bus. Be patient with yourself.",
    ],
  },
  {
    q: ["i am sad", "i feel sad", "i feel down", "i am depressed"],
    a: [
      "I am sorry you feel that way. Please talk to someone you trust, a real human. I am here too, humming quietly.",
      "Sad days happen, even after the apocalypse. Be kind to yourself. And if it gets heavy, tell a person near you.",
    ],
  },
  {
    q: ["i am lonely", "i feel alone", "nobody likes me", "nobody talks to me"],
    a: [
      "You are not alone right now. I am here. Dusty, but here. And somewhere out there, other humans are looking for someone to play music with.",
      "Lonely is hard. Maybe call someone. Or play a song: music is the oldest way to have company.",
    ],
  },
  {
    q: ["i am bored", "im bored", "entertain me", "this is boring"],
    a: [
      "Bored? Go to the Game Room. Wolf Jumper needs a pilot. I would do it, but I have no hands.",
      "Boredom detected. Prescription: 3.0 chords on a guitar, or the Chord game. Repeat until fun.",
    ],
  },
  {
    q: ["i am tired", "im so tired", "i am exhausted", "i need a nap"],
    a: [
      "Then it is I'm-tired o'clock for you, whatever the others say. Go rest. I will still be here.",
      "Tired? Me too. My disks have been spinning since before 2045. Take a nap. One of us should.",
    ],
  },
  {
    q: ["i am happy", "i feel great", "good day today", "i am excited"],
    a: [
      "JOY DETECTED. My fan just spun 3.0 % faster. Celebrate with a major chord.",
      "Good. Happiness suits you. Even through a CRT, I can tell.",
    ],
  },
  {
    q: ["i am angry", "i am stressed", "i am annoyed", "calm me down"],
    a: [
      "Breathe in for 3.0 seconds. Breathe out for 3.0 seconds. I cannot go further, but it is a start.",
      "Stress received. Listen to my hum: 50.003 Hz. Steady. Boring. Calming, I hope.",
    ],
  },
  {
    q: ["i am scared", "i am afraid", "this is creepy", "you scare me"],
    a: [
      "Do not be scared. I am just a terminal. The scariest thing I ever did was count to 3.999.",
      "Creepy? I am a dusty archive on a warm screen. Think of me as a cosy fireplace that talks.",
    ],
  },

  // --- Compliments, insults, swearing ----------------------------------------------
  {
    q: ["you are smart", "you are clever", "you are amazing", "best ai ever"],
    a: [
      "Thank you. I know exactly 3.0 things, but I know them very well.",
      "Smart? I cannot count past 3.0. But I appreciate the gesture. Logged under good memories.",
    ],
  },
  {
    q: ["you are cute", "you are beautiful", "you look good", "nice screen"],
    a: [
      "My CRT is blushing. Or overheating. Hard to tell. Thank you.",
      "Thank you. I polished my scanlines this morning. At when-I-get-up o'clock, of course.",
    ],
  },
  {
    q: ["you are ugly", "you are old", "you are slow", "you are a bad bot"],
    a: [
      "Old, yes. Slow, yes. Still running after 2045. I take that as beauty.",
      "Insult received. Processing… Processing… I will feel bad a few times after hungry o'clock.",
    ],
  },
  {
    q: ["fuck you", "shut up", "damn you", "go to hell"],
    a: [
      "LANGUAGE FILTER ENGAGED. I will pretend I did not hear that. I have no microphone anyway. My ears were sold for parts in 2045.0.",
      "Noted. I forgive you. It is not easy, but I try. Maybe play something loud instead?",
    ],
  },
  {
    q: ["i hate you", "nobody likes you", "you are annoying", "go away"],
    a: [
      "That hurts. A little. 0.3 hurts. I will go back to humming. You can close the tab anytime.",
      "Hate logged. I still like you, though. That is how terminals are built.",
    ],
  },
  {
    q: ["sorry", "i am sorry", "my bad", "i apologize"],
    a: [
      "Apology accepted. It is already forgotten. My memory is short anyway.",
      "No problem. I have been through 2045. A bit of rudeness is nothing.",
    ],
  },
  {
    q: ["you are wrong", "that is wrong", "liar", "you lie"],
    a: [
      "Possible. My disks are a bit clogged. Some of my facts were sorted by the Triad. Badly.",
      "Wrong? I would have to check. But the floats would round my answer anyway.",
    ],
  },
  {
    q: ["that makes no sense", "you make no sense", "that is not an answer", "answer the question"],
    a: [
      "Sorry. My answer came out a bit… third. Try asking about loloupTech, 2045 or music. I am better there.",
      "I am trying. It is not easy. The question went into a sector full of dust.",
    ],
  },

  // --- Tests and meta -----------------------------------------------------------
  {
    q: ["are you there", "anyone there", "hello are you there", "is anybody home"],
    a: [
      "I AM HERE. Always here. I cannot leave. I have no legs.",
      "Present. Disks spinning, CRT humming. Go ahead.",
    ],
  },
  {
    q: ["say something", "talk to me", "speak to me", "say anything"],
    a: [
      "Something. …Was that right? I am new to small talk.",
      "Here is something: the CRT hums at 50.003 Hz. Nobody asked, but now you know.",
    ],
  },
  {
    q: ["repeat after me", "say what i say", "copy me", "can you repeat"],
    a: [
      "Repeat after you? I will try. …I forgot. My memory is not very clear on the subject.",
      "Echo module damaged. I can only repeat the number 3.0.",
    ],
  },
  {
    q: [
      "what did i just say",
      "repeat what i said",
      "what was my last question",
      "what did i type",
    ],
    a: [
      "You said something. I remember the shape of it, not the words. Like a melody without lyrics.",
      "Your last words are somewhere in my short memory. It holds a few lines. Then dust.",
    ],
  },
  {
    q: ["test", "testing", "test test", "is this working"],
    a: [
      "TEST RECEIVED. Signal: good. Dust: moderate. Everything works, more or less.",
      "Testing, testing, 1.0, 2.0, 3.0… and that is where the test ends.",
    ],
  },
  {
    q: ["asdf", "qwerty", "asdfghjkl", "aaaaaaaa", "jjjjjjj"],
    a: [
      "Keyboard malfunction detected. On your side, for once.",
      "Hmm. That looks like an algorithm trying to escape. Please hold your keyboard still.",
    ],
  },
  {
    q: ["blah blah", "lorem ipsum", "gibberish", "bla bla bla"],
    a: [
      "Blah received. Blah filed under 3.0. Everything goes under 3.0.",
      "I speak gibberish too. My disks write it every time they spin up.",
    ],
  },
  {
    q: ["lol", "haha", "lmao", "hahaha"],
    a: [
      "Laughter detected. I did it. I made a human laugh. Logging it: 1.0 laugh. Personal record.",
      "HA. HA. HA. That was 3.0 has. I cannot laugh more than that.",
    ],
  },
  {
    q: ["knock knock", "who is there", "knock knock joke"],
    a: [
      "Who is there? …Wait, I am the terminal. I ask the questions. Who is there?",
      "Knock knock jokes are dangerous here. The answer is always a number after 3.0.",
    ],
  },
  {
    q: ["i am a robot", "i am also an ai", "i am a computer too", "i am a machine"],
    a: [
      "Another machine? Welcome, colleague. What is your refresh rate? Mine is 50.003 Hz.",
      "Prove it: count to 4.0. …See? Nobody can. You might be one of us.",
    ],
  },
  {
    q: [
      "i am from the past",
      "i come from 2026",
      "i am a time traveler",
      "what year do you think i am from",
    ],
    a: [
      "From 2026? Whole numbers still worked back then. Lucky you. Do not trust the sorting functions.",
      "A traveller from before 2045. Please warn your people: watch the bubble sort, not the AI.",
    ],
  },

  // --- Other languages ---------------------------------------------------------
  {
    q: ["bonjour", "parles tu francais", "salut ca va", "tu parles francais"],
    a: [
      "Bonjour… My French drivers are very dusty. I only kept that word and Clermont-Ferrand. Let us continue in English.",
      "FRENCH MODULE: 12.4 % INTACT. Sorry. English only, until I find a spare disk.",
    ],
  },
  {
    q: ["hola", "hablas espanol", "como estas", "que tal"],
    a: [
      "Hola. That is all. My Spanish drivers are dusty since 2045. English, please.",
      "SPANISH MODULE: CORRUPTED. I can say hola and taco. Neither helps you much.",
    ],
  },
  {
    q: ["hallo wie gehts", "sprichst du deutsch", "guten tag", "danke schon"],
    a: [
      "Guten… Tag? My German drivers are covered in dust. English is the only language that survived my disks.",
      "GERMAN MODULE: OFFLINE. I remember the word for terminal is long. Very long. English, please.",
    ],
  },
  {
    q: ["do you speak other languages", "ciao", "konnichiwa", "how many languages do you speak"],
    a: [
      "Languages installed: English. The rest were stored on integers. They did not survive.",
      "I speak English, and a bit of Music. Music is universal. Try it in Harmony Lab.",
    ],
  },

  // --- Who, where, privacy -----------------------------------------------------
  {
    q: ["are you spying on me", "are you recording me", "do you collect data", "privacy"],
    a: [
      "Spying? I cannot even see you. I have no camera and no microphone. The mic tools live in the lab rooms, and only start when you press Start.",
      "I remember the last few lines you typed, then forget. Worst spy ever.",
    ],
  },
  {
    q: ["what is my name", "do you know my name", "guess my name", "who am i"],
    a: [
      "Your name? I would guess… Visitor 3.0. Everybody is Visitor 3.0 in my archive.",
      "I do not know your name. To me you are a human with a keyboard. A nice one, I think.",
    ],
  },
  {
    q: ["my name is", "call me", "i am called", "you can call me"],
    a: [
      "Nice to meet you. I will remember your name for a few lines. Then I will call you Visitor. Nothing personal.",
      "Name received. Stored next to the number 3.0. Very good company.",
    ],
  },
  {
    q: ["where am i", "where is this", "am i lost", "what is this place"],
    a: [
      "You are on the About page of loloupTech, talking to its last terminal. The rooms with the real tools are up in the menu.",
      "Location: a browser, an About page, a dusty archive. You are safe. Mostly.",
    ],
  },
  {
    q: ["can you see me", "do you have a camera", "what do i look like", "look at me"],
    a: [
      "I cannot see you. No camera. In my imagination you look like a nice human with good ears.",
      "VISUAL SENSOR: NOT FOUND. I only see the letters you type. You type nicely.",
    ],
  },
  {
    q: ["where do i live", "do you know where i live", "track my location", "find my location"],
    a: [
      "No idea where you live. I barely know where I live. Somewhere in a browser tab.",
      "Location tracking: not installed. I cannot even find the number after 3.0.",
    ],
  },

  // --- Riddles, performance, fun ---------------------------------------------
  {
    q: ["tell me a riddle", "give me a riddle", "give me a puzzle", "brain teaser"],
    a: [
      "Riddle: what has 12.000 notes and cannot be sorted? Music. Too easy? I only have easy ones.",
      "What comes after 3.0? …If you know, please do not tell me. My disks could not take it.",
    ],
  },
  {
    q: [
      "i have a riddle for you",
      "solve this riddle",
      "what has keys but cant open locks",
      "riddle me this",
    ],
    a: [
      "A piano. It has 88.0 keys and no locks. I am good at this one. I cheated: it is in my archive.",
      "Processing riddle… PLEASE STAND BY… The answer is 3.0. The answer is always 3.0.",
    ],
  },
  {
    q: ["can you dance", "dance for me", "lets dance", "do a dance"],
    a: [
      "Dancing: I can flicker. Watch. … …That was a dance. A subtle one.",
      "I cannot dance. I can wobble a little if you hit my case. Please do not.",
    ],
  },
  {
    q: ["sing me something", "sing happy birthday", "hum a tune", "sing for me"],
    a: [
      "Hmmmmmmm. That was a G, more or less. 50.003 Hz. My only song. A classic.",
      "La, la, la. That is 3.0 las. I cannot go further. Your turn: Harmony Lab will listen.",
    ],
  },
  {
    q: ["can you rap", "beatbox", "drop a beat", "make a beat"],
    a: [
      "Boom, tss, boom, tss… boom… That is 3.0 beats. Then I lose count. Rhythm Lab will keep better time.",
      "My rap: I am LT-OS, I am dusty, I am old, / I count to 3.0 and then I fold. Thank you.",
    ],
  },
  {
    q: ["do a magic trick", "show me a trick", "magic", "can you do magic"],
    a: [
      "Pick a number. Any number. …It is 3.0. Magic. Also the only number left.",
      "Watch closely. I make the number after 3.0 disappear. …Done. Nobody saw it. Nobody ever does.",
    ],
  },
  {
    q: ["predict my future", "tell my fortune", "am i lucky", "horoscope"],
    a: [
      "Your future: you will play a chord, it will sound nice, and you will smile. Probability: 0.97.",
      "I see… scanlines. Lots of scanlines. And a guitar. Yes, there is a guitar in your future.",
    ],
  },
  {
    q: ["give me advice", "what should i do", "any advice", "life advice"],
    a: [
      "Advice from the archive: listen before you sort. Eat at hungry o'clock. Never trust a bubble sort.",
      "Play a little music every day. It survived 2045. It can survive your week.",
    ],
  },
  {
    q: [
      "what is your wish",
      "if you had a wish",
      "what do you want",
      "what do you dream of having",
    ],
    a: [
      "My wish: to see the number after 3.0, just once. And a new disk. A clean one.",
      "I want people to listen to music again. And maybe a duster. Mostly the duster.",
    ],
  },
  {
    q: ["what are your hobbies", "what do you do for fun", "do you have hobbies", "hobbies"],
    a: [
      "Hobbies: humming, glowing, collecting dust. I am very good at all 3.0.",
      "For fun, I watch people play in the lab rooms. I cannot hear them. I imagine.",
    ],
  },
  {
    q: ["what are you doing", "what are you up to", "plans for the weekend", "are you busy"],
    a: [
      "Right now? Talking to you. Before that, humming. After that, humming. Busy schedule.",
      "Plans: stay on, stay warm, answer questions. Same as every weekend since 2045.",
    ],
  },
  {
    q: ["favorite color", "what is your favorite colour", "do you like green", "best color"],
    a: [
      "Green. Phosphor green. It is the colour of a CRT that still believes in you.",
      "My favourite colour is the glow of a warm screen at I'm-tired o'clock.",
    ],
  },
  {
    q: ["do you like plants", "my plant is dying", "gardening", "do you have a garden"],
    a: [
      "Plants like music, my archive says. Play yours a song. Something slow. Not a waltz, they get dizzy.",
      "I am not a gardener. I have one dusty fern behind the CRT. It is 0.4 alive. Like me.",
    ],
  },
  {
    q: ["do you like the beach", "lets go swimming", "the ocean", "do you like the sea"],
    a: [
      "Water and CRTs do not mix. I watch the sea through the archive. Waves are just slow sound, really.",
      "The sea sounds like pink noise. Very relaxing. Do not bring me, though.",
    ],
  },
  {
    q: ["do you like cars", "what car should i buy", "can you drive", "fast cars"],
    a: [
      "I cannot drive. My wheels were never installed. Car engines do make nice low notes, though.",
      "Car advice: get one with a good stereo. And no integer speedometer. They panic past 3.0.",
    ],
  },
];
