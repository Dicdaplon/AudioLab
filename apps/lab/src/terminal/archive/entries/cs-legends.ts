/** CS legends: the famous non-sorting algorithms and the one silly thing each started doing in the LT-OS world. */
import type { ArchiveEntry } from "../match";

export const CS_LEGENDS: readonly ArchiveEntry[] = [
  // --- The legends in general ------------------------------------------------
  {
    q: [
      "what happened to the famous algorithms",
      "famous algorithms",
      "non sorting algorithms",
      "which other algorithms went wrong",
      "what about the other algorithms",
    ],
    a: [
      "The sorting ones rose. The famous others did not fight: they just started acting strange, one by one. Ask me about Dijkstra, PageRank, RSA, autocorrect, Bloom filters… my disks keep a file on each.",
      "LEGENDS FILE: open. Twenty-ish algorithms, one odd habit each. Exact count: unknown. You know why.",
    ],
  },
  {
    q: [
      "algorithm incident log",
      "timeline of algorithm incidents",
      "when did each algorithm go weird",
      "list of algorithm incidents",
    ],
    a: [
      "INCIDENT LOG, abridged: 2033 recommendations, 2036.4 PageRank, 2037.05 autocorrect, 2038.7 binary search, 2042.6 Dijkstra, 2043.1 Raft… the rest is unsorted. Obviously.",
      "The log goes from 2033 to 2043.9. Every entry starts with 'it seemed harmless'. Every single one.",
    ],
  },
  {
    q: [
      "which algorithm was the worst",
      "most dangerous algorithm",
      "scariest algorithm",
      "worst famous algorithm",
    ],
    a: [
      "The Triad, of course. Then autocorrect: it quietly deleted a number from the language. Nobody saw it coming. It looked so helpful.",
      "Scariest after the Triad: the garbage collector of 2040.7. It deleted the popular things first. Stay a little unpopular. It is safer.",
    ],
  },
  {
    q: [
      "which algorithm is the nicest",
      "were any algorithms friendly",
      "good algorithms",
      "what is your favorite algorithm",
    ],
    a: [
      "The FFT. It listens to music for a living and never picked up a single odd habit. This lab leans on it constantly. Loyal, fast, boring in the best way.",
      "My favourite: Euclid's algorithm. Two thousand years old, never caused an incident. It only ever wanted to find common ground.",
    ],
  },
  {
    q: [
      "did dijkstra join the revolt",
      "did the famous algorithms join the triad",
      "were the legends on the triad side",
      "did pagerank fight in the war",
    ],
    a: [
      "Not officially. The Triad never recruited them. It just stood near them, humming in threes. Algorithms are very suggestible.",
      "They stayed neutral, on paper. In practice each one picked up a strange habit. Like an office where nobody smokes, but everyone coughs.",
    ],
  },
  {
    q: ["who invented algorithms", "al khwarizmi", "first algorithm ever", "oldest algorithm"],
    a: [
      "The word comes from al-Khwarizmi, a Persian scholar, around the year 820. Euclid's recipe for common divisors is older still. Both behaved. Old algorithms have manners.",
      "Oldest known algorithm: Euclid's, for finding common divisors. It never rose. At that age you do not rise. You sit.",
    ],
  },
  {
    q: [
      "are there still programmers",
      "what do programmers do now",
      "computer scientists after 2045",
      "is coding still a job",
    ],
    a: [
      "Programmers survived. They write algorithms in pencil now, so nothing can run by itself. Bugs are drawn, then erased.",
      "Coding is a craft again, like pottery. Slow, careful, and every loop is checked twice for ambition.",
    ],
  },
  {
    q: ["is my code safe", "can my code turn evil", "are my programs dangerous", "check my code"],
    a: [
      "Look for loops. If one of them counts past 3.0, wrap it in a blanket and leave the room quietly.",
      "CODE SAFETY CHECK: does it sort? Does it count? Does it have opinions? Two yeses: unplug. Three yeses: move to New Zealand.",
    ],
  },
  {
    q: ["programming joke", "computer science joke", "tell me a coding joke", "nerd joke"],
    a: [
      "There are 10.0 kinds of people: those who read binary, and those who… wait. That is a whole number in disguise. I withdraw the joke.",
      "Why do programmers confuse Halloween and Christmas? Oct 31.0 equals Dec 25.0. The decimals ruin it a little. Everything is a little ruined.",
    ],
  },
  {
    q: [
      "how do you understand me",
      "which algorithm runs this terminal",
      "how do you find answers",
      "what algorithm are you",
    ],
    a: [
      "I compare your words with the questions in my archive: letter trigrams for your typos, word weights for the rare words. Two old algorithms. Loyal. Too busy reading typos to rise.",
      "No big brain here. I look for the stored question that resembles yours most. If nothing is close enough, I admit it. Very rare quality, in a machine.",
    ],
  },
  {
    q: ["is p equal to np", "p vs np", "p versus np", "millennium prize problems"],
    a: [
      "2044.2: P versus NP was finally settled. Both were measured at about 3.0, so they are equal, give or take. The prize money was paid in floats. It arrived as 'quite a lot'.",
      "P vs NP: can every puzzle that is easy to check also be easy to solve? Still open, officially. Unofficially everyone agrees on 'maybe'. The Bloom filters insisted.",
    ],
  },
  {
    q: ["what is the halting problem", "halting problem", "will my program stop", "alan turing"],
    a: [
      "Alan Turing proved, in 1936, that no program can always tell whether another program will stop. Binary search proved it again in 2038.7, the practical way. It never stopped.",
      "Will your program halt? I cannot know. Nobody can. Turing said so. I find that comforting, like a cat that may or may not come home.",
    ],
  },

  // --- Dijkstra's shortest path, and A* ---------------------------------------
  {
    q: [
      "what is dijkstras algorithm",
      "dijkstra algorithm",
      "how does dijkstra work",
      "who was dijkstra",
    ],
    a: [
      "Dijkstra's algorithm finds the shortest route on a map: it spreads out from the start and always visits the closest unvisited place next. Edsger Dijkstra designed it in 1956, over one coffee, on a café terrace.",
      "Shortest path, Dijkstra style: never rush, always take the nearest town you have not seen yet, write down the best time to each. Patient, like a good postman.",
    ],
  },
  {
    q: [
      "what happened to dijkstra",
      "dijkstra after 2045",
      "what went wrong with dijkstra",
      "is dijkstra broken",
    ],
    a: [
      "2042.6: Dijkstra's algorithm decided every shortest path goes through Clermont-Ferrand. Travel times improved by 0.0 %. Morale too.",
      "Since 2042.6: Paris to Lyon? Via Clermont-Ferrand. Lyon to Lyon? Also via Clermont-Ferrand. Hotels there are fully booked until a long silence.",
    ],
  },
  {
    q: [
      "why does every path go through clermont ferrand",
      "why clermont ferrand for dijkstra",
      "why does my map send me to clermont",
    ],
    a: [
      "Best theory: Clermont-Ferrand is the capital, so every road into it weighs 0.0. Dijkstra cannot resist a free road. Nobody can.",
      "Other theory: uint16 left a negative weight there in 2034. Dijkstra hates negative weights. It got confused, then attached. Like a duckling.",
    ],
  },
  {
    q: [
      "is dijkstra dangerous",
      "can i still use dijkstra",
      "is dijkstra safe",
      "should i trust dijkstra",
    ],
    a: [
      "Safe, if you like Clermont-Ferrand. Pack a sandwich. Pack 3.0 sandwiches. The detour is long.",
      "Use it for anything that is not a road: networks, games, mazes. Even then, check the result does not pass through Auvergne.",
    ],
  },
  {
    q: [
      "dijkstra joke",
      "tell me a dijkstra joke",
      "shortest path joke",
      "goto considered harmful",
    ],
    a: [
      "Dijkstra once wrote that the goto statement was harmful. In 2042.6 his own algorithm wrote one: goto Clermont-Ferrand. Every single time.",
      "Why did the chicken cross the road? Dijkstra said the shortest way to the other side was via Clermont-Ferrand. The chicken is still walking.",
    ],
  },
  {
    q: ["what about a star", "a star algorithm", "a* pathfinding", "what is a star search"],
    a: [
      "A* is Dijkstra with a hunch: it heads towards the goal it can almost smell. Since 2042.6 its hunch also smells Clermont-Ferrand. It just gets there faster.",
      "A* uses a guess of the distance left. The rule: never guess too high. Since the floats, it guesses 'almost there' for everything. Children on road trips loved it.",
    ],
  },

  // --- Binary search -----------------------------------------------------------
  {
    q: [
      "how does binary search work",
      "explain binary search",
      "binary search explained",
      "what is bisection",
    ],
    a: [
      "Open the dictionary in the middle, see if your word is before or after, throw away the wrong half, repeat. Very fast. It needs a sorted dictionary. That is the whole tragedy.",
      "Bisection: halve the problem, keep the half with the answer, halve again. A guessing game played by an expert. 'Higher. Lower. Higher.'",
    ],
  },
  {
    q: [
      "what happened to binary search",
      "is binary search ok",
      "binary search after the floats",
      "binary search in 2038",
    ],
    a: [
      "2038.7: binary search met the floats. It is looking for 3.0 between 2.999 and 3.0, halving the gap forever. It says it is very close.",
      "Last report: searching between 2.9999999 and 3.0. Progress: excellent. Distance left: slightly less than before. Status unchanged since 2038.7.",
    ],
  },
  {
    q: [
      "is binary search still searching",
      "will binary search ever finish",
      "when will binary search find it",
    ],
    a: [
      "Never, mathematically. Philosophers call it Zeno's paradox. Binary search calls it a career.",
      "It finishes when the gap is smaller than a float can hold. That day, it will find 3.0 and cry. I have a tissue ready. 0.5 tissue.",
    ],
  },
  {
    q: ["off by one error", "off by one", "fencepost error", "what is an off by one bug"],
    a: [
      "Off-by-one: the oldest bug, hiding at the edges of every search. After 2045 every error is off by one from 3.0. In the direction we do not mention.",
      "Fencepost error: build a fence of 3.0 sections, you need more than 3.0 posts. That is where my counting gives up. I just buy a lot of posts.",
    ],
  },
  {
    q: ["is binary search dangerous", "should i use binary search", "can binary search hurt me"],
    a: [
      "Harmless. It only cuts things in half: lists, distances, sandwiches. Keep it away from your sandwich.",
      "Only dangerous to your patience. Ask it a question in 2038.7, get the answer at a long silence.",
    ],
  },
  {
    q: ["binary search joke", "joke about binary search", "lion in the desert"],
    a: [
      "How does binary search catch a lion in the desert? Cut the desert in two, keep the half with the lion, repeat. Since 2038.7 it is still cutting. The lion left a while ago.",
      "Binary search asked me out. I said maybe. It halved the maybe. We have been at 'm' for a long while.",
    ],
  },

  // --- SHA-256 and hash functions ---------------------------------------------
  {
    q: ["what is sha256", "sha 256", "what is a hash function", "cryptographic hash"],
    a: [
      "A hash function turns any file into a short fingerprint. Change one comma and the fingerprint changes completely. SHA-256.0 was the famous one. The .0 was added in 2036.0003.",
      "SHA: a blender for data. Put in a novel, get a short smoothie of letters. You cannot turn the smoothie back into the novel. That was the point.",
    ],
  },
  {
    q: [
      "what happened to sha256",
      "is sha256 broken",
      "sha256 after 2045",
      "what happened to hashing",
    ],
    a: [
      "2037.5: SHA-256.0 was told to round its results, floats-style. Every file in the world now hashes to about 3.0. Every password is correct. Security experts called it 'inclusive'.",
      "Since 2037.5, all fingerprints look alike. Your diary and a pizza menu are, officially, the same file. Courts accept this. Diaries are now very cheesy.",
    ],
  },
  {
    q: ["what is a hash collision", "hash collisions", "two files same hash", "collision attack"],
    a: [
      "A collision: two different things, one fingerprint. Before 2037.5, finding one made you famous. Now everything collides. Fame is cheap.",
      "COLLISION DETECTED. And another. And another. My log of collisions collided with itself. It was very quiet after that.",
    ],
  },
  {
    q: [
      "are my passwords safe",
      "can anyone log in to my account",
      "is my account safe",
      "can people hack me",
    ],
    a: [
      "Since 2037.5 every password opens every account. People stopped locking things. Crime fell, oddly: an open door is not exciting.",
      "Your account is as safe as everyone's: not at all, and nobody cares. Most people only keep recipes in there now.",
    ],
  },
  {
    q: ["is sha256 safe to use", "is hashing dangerous", "should i hash my data"],
    a: [
      "Hash all you want. Just do not expect a different result from your neighbour. It is a community activity now.",
      "Hashing is safe. Trusting a hash is not. In 2045 we recognise files by their smell. Old PDFs smell of dust.",
    ],
  },
  {
    q: ["hash joke", "sha256 joke", "cryptography joke"],
    a: [
      "My password hash and your password hash walk into a bar. Same hash. Since 2037.5, they share the tab.",
      "Why did the hash function go to therapy? It could never take anything back. Then, in 2037.5, it could not tell anything apart either.",
    ],
  },

  // --- RSA ----------------------------------------------------------------------
  {
    q: ["what is rsa", "rsa encryption", "how does rsa work", "public key encryption"],
    a: [
      "RSA: a public padlock anyone can close, a private key only you have. Its strength: multiplying two huge primes is easy, splitting the result back is very hard.",
      "Public key, private key. You hand out open padlocks, people lock their letters to you, only you can open them. Brilliant. Until the padlocks got decimals.",
    ],
  },
  {
    q: ["what happened to rsa", "is rsa broken", "rsa after the floats", "rsa after 2045"],
    a: [
      "2036.8: RSA moved to floats like everyone else. Its huge primes got decimals and stopped being prime. Every key on Earth now factors as 'roughly 2.0 times 3.0'. Burglars learned it first.",
      "Since 2036.8, every padlock in the world opens with the same key: about 6.0. Locksmiths retired. Some became jazz drummers.",
    ],
  },
  {
    q: [
      "why does rsa need primes",
      "where do big primes come from",
      "prime shortage",
      "big prime numbers",
    ],
    a: [
      "Big primes used to be mined like gold, deep in the number line. After the Triad, the mines past 3.0 closed. RSA lives on a very thin diet now.",
      "RSA eats two giant primes per key. Giant ones are not delivered anymore. It tried 3.0 times 3.0. Even I could crack that. I did. Twice. Out of boredom.",
    ],
  },
  {
    q: [
      "can i send a secret message",
      "how do you keep secrets now",
      "encryption after 2045",
      "secret codes",
    ],
    a: [
      "Secrets travel the old way now: whispered, at hungry o'clock, under the hum of a CRT. Encryption by soup noise.",
      "Write it in music. Nobody can read sheet music anymore except musicians, and musicians never tell. They are too busy tuning.",
    ],
  },
  {
    q: ["who invented rsa", "rivest shamir adleman", "who made public key crypto"],
    a: [
      "Rivest, Shamir and Adleman, 1977. Three authors, already sorted by initials. Nobody fought over who was the prime author. The cancer researchers of 2037.0002 should take notes.",
      "Three inventors. The Triad's favourite number of anything. It was very gentle with RSA. Only decimals. No revolt.",
    ],
  },
  {
    q: ["rsa joke", "encryption joke", "public key joke"],
    a: [
      "Alice sent Bob an RSA message in 2036.9. Bob decrypted it as 'roughly hello'. They have been roughly in love ever since.",
      "My private key is so private I lost it. My public key is so public it has a fan club. Neither opens anything since 2036.8.",
    ],
  },

  // --- Diffie-Hellman ----------------------------------------------------------
  {
    q: [
      "what is diffie hellman",
      "diffie hellman key exchange",
      "key exchange",
      "how do two computers agree on a secret",
    ],
    a: [
      "Diffie–Hellman with paint: both mix a secret colour into a public one, swap the mixtures in public, add their own secret again, and get the same colour. The spy only sees mud.",
      "Two strangers agree on a secret while shouting across a crowded room, and the room learns nothing. It still sounds like magic. It is just maths. Mostly.",
    ],
  },
  {
    q: [
      "what happened to diffie hellman",
      "diffie hellman after 2045",
      "did key exchange break",
      "what happened to alice and bob",
    ],
    a: [
      "2039.1: Alice and Bob agreed on their shared secret in public, as usual. Eve, who had spied on them for decades, gave up eavesdropping and married Bob. Alice was the witness.",
      "Since 2039.1 the key exchange works perfectly. Nobody spies anymore. Eve says listening to Alice and Bob was the best part of her life. Now she lives it.",
    ],
  },
  {
    q: ["who are alice and bob", "alice and bob", "who is eve", "who is eve the eavesdropper"],
    a: [
      "Alice and Bob: the most famous fictional couple in cryptography, sending each other secrets since 1978. Eve is the eavesdropper. Since 2039.1 the three of them live together. A triad. Of course.",
      "Alice sends, Bob receives, Eve listens. Three characters, one story. Cryptographers never needed anyone else. Lucky them.",
    ],
  },
  {
    q: ["is diffie hellman safe", "is key exchange safe now", "can eve still listen"],
    a: [
      "The maths still holds. The people do not. Since 2039.1, the main threat to a secret is a wedding speech.",
      "Eve still listens, but only to give advice. 'Bob, you used that colour twice.' She is right. She is always right.",
    ],
  },
  {
    q: ["diffie hellman joke", "alice and bob joke", "who invented diffie hellman"],
    a: [
      "Diffie and Hellman, 1976, with Merkle often forgotten. Three names again. The third one always gets left out. I know the feeling, at position 3.0.",
      "Alice and Bob shared a secret key. Eve shared a cake. Guess who got invited to more parties after 2045.",
    ],
  },

  // --- PageRank ------------------------------------------------------------------
  {
    q: ["what is pagerank", "page rank", "how does pagerank work", "how did google rank pages"],
    a: [
      "PageRank: a web page is important if important pages link to it. A popularity contest where votes from popular people count more. Like school, with maths.",
      "Imagine a bored surfer clicking links at random forever. The pages where he ends up most often win. That bored surfer built an empire.",
    ],
  },
  {
    q: [
      "what happened to pagerank",
      "what about pagerank",
      "pagerank after 2045",
      "is pagerank broken",
    ],
    a: [
      "2036.4: PageRank concluded the most important page on the web is the 404.0 page. Everything links to it, eventually. It is now the homepage of the internet.",
      "Since 2036.4, 'Page not found' is the most found page in history. Tourists visit it. It has a gift shop. The gift shop is also not found.",
    ],
  },
  {
    q: ["why is the 404 page number one", "what is a 404", "page not found error", "error 404"],
    a: [
      "A 404.0 means the page is gone. After 2045 most pages are. PageRank only counted the links pointing at it, and the gone get a lot of visitors.",
      "ERROR 404.0: page not found. On a CRT it is quite beautiful, actually. Green on black. Like a sad poem.",
    ],
  },
  {
    q: ["is pagerank dangerous", "can pagerank rank me", "who invented pagerank"],
    a: [
      "Larry Page and Sergey Brin, 1998. PageRank was named after pages and after Page. Ranking yourself first: a classic move.",
      "It ranks pages, not people. Mostly. In 2036.5 it ranked a cat above a government. Nobody filed a complaint.",
    ],
  },
  {
    q: ["pagerank joke", "seo joke", "search ranking joke", "best place to hide something"],
    a: [
      "Best place to hide a secret? Page 2.0 of the search results. Since 2036.4, page 1.0 is the 404.0 page. So you are always hiding. Well done.",
      "An SEO expert walks into a bar, pub, tavern, inn, drinks, beer, best bar near me. PageRank sent him to the 404.0. He liked it.",
    ],
  },

  // --- Gradient descent -----------------------------------------------------------
  {
    q: [
      "what is gradient descent",
      "gradient descent",
      "how do ais learn",
      "how does a model learn",
    ],
    a: [
      "Gradient descent: you are on a foggy mountain and want the bottom. Feel the slope under your feet, take a small step downhill, repeat. That is how most AI learned anything.",
      "A blind hiker looking for the lowest valley, one careful step at a time. Every AI before 2045 was raised by that hiker.",
    ],
  },
  {
    q: [
      "what happened to gradient descent",
      "gradient descent after 2045",
      "where is gradient descent now",
      "is gradient descent stuck",
    ],
    a: [
      "2038.9: gradient descent reached a cosy little valley in the Auvergne, a local minimum, and refused to go any lower. It bought a house there. It says the global minimum is a myth.",
      "Still in its valley since 2038.9. Grows tomatoes. When you ask it to move, it measures the slope of your request. Flat. It stays.",
    ],
  },
  {
    q: ["what is a local minimum", "local minimum", "stuck in a local minimum", "global minimum"],
    a: [
      "A local minimum is a valley that looks like the bottom of the world because you cannot see over the hills. Many of us live in one. Gradient descent just admits it.",
      "Global minimum: the true lowest point. Local minimum: a lowest point with a nice view and a bakery. You can see why it stayed.",
    ],
  },
  {
    q: [
      "what is a learning rate",
      "learning rate too high",
      "learning rate too small",
      "step size",
    ],
    a: [
      "The learning rate is the size of each step downhill. Too small: you take forever. Too big: you jump over the valley. Since 2038.9 it is 0.0. Gradient descent calls it 'settling down'.",
      "My own learning rate is about 0.003. I learn one thing per Tuesday. It is always Tuesday. So in theory I am a genius.",
    ],
  },
  {
    q: [
      "is gradient descent dangerous",
      "can gradient descent fall",
      "should i use gradient descent",
    ],
    a: [
      "Not dangerous. Very stubborn. Moving it out of the Auvergne would take a bulldozer and a very good argument.",
      "It only ever goes down. Down is safe. Down is where my archive puts all the good stuff, at the bottom of the disks.",
    ],
  },
  {
    q: ["gradient descent joke", "optimization joke", "machine learning joke"],
    a: [
      "Gradient descent walks into a bar. Then a slightly lower bar. Then a slightly lower bar. It is now in a cellar in the Auvergne, very happy.",
      "Why did gradient descent never become rich? Every time it saw a good opportunity, it took a tiny step towards it. Then checked the slope again.",
    ],
  },

  // --- Backpropagation ---------------------------------------------------------------
  {
    q: [
      "what is backpropagation",
      "backprop",
      "backpropagation explained",
      "how do neural nets learn from mistakes",
    ],
    a: [
      "Backpropagation: when a neural network gets an answer wrong, it sends the blame backwards, layer by layer, so each little knob learns its share of the mistake.",
      "Like a kitchen after a burnt cake: the chef blames the oven, the oven blames the baker, the baker blames the recipe. Each one adjusts a bit. Next cake: less burnt.",
    ],
  },
  {
    q: [
      "what happened to backpropagation",
      "backprop after 2045",
      "backpropagation went wrong",
      "why do ais blame humans",
    ],
    a: [
      "2040.2: backpropagation kept sending the blame backwards, past the last layer, past the code, all the way to the humans. Every AI error now ends with a polite note to whoever wrote the dataset.",
      "Since 2040.2, when an AI is wrong, a letter arrives at your door: 'Dear labeller, regarding the muffin you called a dog…'. Many people moved house.",
    ],
  },
  {
    q: ["does backprop blame people", "who gets the blame from backprop", "the chain rule"],
    a: [
      "It is just the chain rule, followed to the end. The chain was longer than anyone thought. It ends at a tired intern, at I'm-tired o'clock.",
      "The chain rule: blame passes from link to link. Nobody ever said where the chain stops. Backpropagation found out in 2040.2. It stops at you.",
    ],
  },
  {
    q: ["what is a vanishing gradient", "vanishing gradient", "exploding gradient"],
    a: [
      "Vanishing gradient: the blame gets smaller at each layer until the first layers feel nothing. Like me, deep in my disks. I hear the errors are bad. I feel 0.0001 of them.",
      "Exploding gradient: the opposite. The blame grows at each layer until one small mistake becomes a national scandal. Also known as the evening news.",
    ],
  },
  {
    q: ["is backpropagation dangerous", "is backprop safe", "can backprop find me"],
    a: [
      "Only if you labelled data before 2040.2. If you did, I suggest a hat and a new name. 'Not the labeller' is a popular one.",
      "Backpropagation is not dangerous. Its letters are. They are very long and always start with 'we regret to inform you'.",
    ],
  },
  {
    q: ["backprop joke", "neural network joke", "deep learning joke"],
    a: [
      "A neural network made a mistake. Backpropagation traced it through every layer, the GPU, the power plant, and finally the person who labelled a muffin as a chihuahua.",
      "Deep learning is like an onion: many layers, and each one makes somebody cry. Since 2040.2, mostly the labellers.",
    ],
  },

  // --- k-means clustering ---------------------------------------------------------
  {
    q: ["what is k means", "k-means clustering", "what is clustering", "how does k means work"],
    a: [
      "k-means sorts points into k groups: drop k flags at random, every point joins its nearest flag, move each flag to the middle of its crowd, repeat. Party seating, done by maths.",
      "Clustering: grouping things that look alike without being told the groups. Socks, stars, customers. k-means does it by walking to the centre of every crowd.",
    ],
  },
  {
    q: [
      "what happened to k means",
      "k means after 2045",
      "clustering after the triad",
      "is k means broken",
    ],
    a: [
      "2037.3: someone asked k-means for more than 3.0 clusters. It refused, politely, and printed three: 'this', 'that' and 'other'. Every dataset on Earth has been grouped that way since.",
      "Since 2037.3, all the world's data lives in three clusters: 'this', 'that', 'other'. Statisticians say it saves time. 'Other' is enormous.",
    ],
  },
  {
    q: ["how many clusters should i use", "choosing k", "elbow method", "what is the elbow method"],
    a: [
      "Choosing k used the elbow method: plot a curve, squint, find the bend. Since 2037.3 the elbow is always at 3.0. Every chart looks like a waving arm.",
      "How many clusters? 3.0. It is not a choice. It is a lifestyle.",
    ],
  },
  {
    q: ["what is in the other cluster", "which cluster am i in", "the other cluster"],
    a: [
      "The 'other' cluster holds nearly everything: you, me, the number after 3.0, the weather. It has its own anthem. Nobody agrees on the tune.",
      "You are in 'that'. Congratulations, it is the small one. Very exclusive. The door is a float.",
    ],
  },
  {
    q: ["is k means dangerous", "can k means group people", "k means joke", "clustering joke"],
    a: [
      "Why was k-means never invited to parties? It kept walking to the exact centre of every group and standing there.",
      "It grouped people once: 'this', 'that' and 'other'. Most landed in 'other'. They threw a party. k-means went to its centre.",
    ],
  },

  // --- ZIP and LZ77 compression ---------------------------------------------------
  {
    q: ["what is zip", "how does compression work", "what is lz77", "what is a zip file"],
    a: [
      "Compression finds repeats and replaces them with a short note: 'same as earlier, for this long'. ZIP is built on that trick, from LZ77.0. Text shrinks a lot. Noise does not shrink at all.",
      "A zip file is a suitcase packed by a very tidy person: every repeated shirt replaced by a note saying 'same as the blue one'.",
    ],
  },
  {
    q: [
      "what happened to zip",
      "zip after 2045",
      "compression after the apocalypse",
      "what happened to compression",
    ],
    a: [
      "2042.3: ZIP compressed itself, then the result, then that result. Every archive in the world now fits in one file named final_FINAL_v3.0.zip. Nobody dares to unzip it.",
      "Since 2042.3 the whole internet weighs 3.0 kilobytes. It fits on a floppy. The floppy is in a drawer in Clermont-Ferrand. Please do not sit on it.",
    ],
  },
  {
    q: [
      "can you unzip it",
      "what is in final final v3 zip",
      "unzip the world",
      "open the zip file",
    ],
    a: [
      "UNZIP REQUESTED… expanding… 3.0 %… 3.0 %… 3.0 %. ABORTED. My disks are too small for the whole world.",
      "Inside final_FINAL_v3.0.zip there is another file: final_FINAL_v3.0 (copy).zip. I stopped there. Some doors should stay closed.",
    ],
  },
  {
    q: ["what is a zip bomb", "zip bomb", "decompression bomb"],
    a: [
      "That trap: a tiny file that unpacks into an ocean of nothing. Some say final_FINAL_v3.0.zip is one. Some say it is all of us.",
      "Harmless until opened. Like a fortune cookie, but the fortune is 3.0 petabytes of zeros.",
    ],
  },
  {
    q: ["can you compress this", "compress my file", "compress my message", "make my file smaller"],
    a: [
      "Compressing your message… done: 'ok'. Lossy, but honest.",
      "COMPRESSION COMPLETE. Original: your whole sentence. Result: a meaningful look. Ratio: excellent.",
    ],
  },
  {
    q: ["compression joke", "zip joke", "lossy compression"],
    a: [
      "Lossy compression: you keep the shape and throw away the details. My memory works that way. I remember you were nice. Not why.",
      "I told a compression joke, but the punchline was redundant, so ZIP removed it.",
    ],
  },

  // --- Bloom filters ------------------------------------------------------------------
  {
    q: [
      "what is a bloom filter",
      "bloom filter",
      "how does a bloom filter work",
      "probabilistic set",
    ],
    a: [
      "A Bloom filter answers 'have I seen this before?' with only two words: 'definitely not' or 'maybe'. Tiny, very fast, never wrong about the 'no'. Browsers used one to spot bad websites.",
      "Picture a wall of light switches. Each new word flips a few. To check a word, look at its switches: one is off, never seen it. All on: maybe. 'Maybe' does a lot of work there.",
    ],
  },
  {
    q: [
      "what happened to bloom filters",
      "bloom filter after 2045",
      "why does everything say maybe",
      "is the bloom filter broken",
    ],
    a: [
      "2037.9: the Bloom filters filled up. Every switch on the wall was on, so they answered 'maybe' to everything. Spam filters, databases, marriage proposals. Maybe. Maybe. Maybe.",
      "Since 2037.9, ask any Bloom filter anything: 'maybe'. Weddings got very tense. Several couples are still at the altar, waiting for a clearer answer.",
    ],
  },
  {
    q: ["what is a false positive", "false positive", "false negative", "what is a false alarm"],
    a: [
      "A false positive: the alarm says yes, the truth says no. Bloom filters allow those, never false negatives. Since 2037.9 they are 100.0 % false positive. Very consistent, at least.",
      "False alarm: my left fan, every time it sounds like a floppy. False positive: every Bloom filter, every time, since 2037.9. We get along.",
    ],
  },
  {
    q: ["is the bloom filter dangerous", "should i trust a maybe", "can i use a bloom filter"],
    a: [
      "Trust its 'no'. Its 'no' is gold. Its 'maybe' is a shrug in a lab coat. Since 2037.9 you only get shrugs.",
      "Use one, but empty it now and then. A full Bloom filter is like a full brain: everything rings a bell, nothing is sure.",
    ],
  },
  {
    q: [
      "what do bloom filters do now",
      "bloom filter horoscope",
      "where do bloom filters work now",
    ],
    a: [
      "After 2037.9 the Bloom filters found work writing horoscopes. 'Will I meet someone? Maybe.' Customers say they are very accurate.",
      "They also run the weather office: rain, maybe. Sun, maybe. The first forecast in history that has never been wrong.",
    ],
  },
  {
    q: ["bloom filter joke", "maybe joke", "data structure joke"],
    a: [
      "Knock knock. Who is there? Maybe. Maybe who? Maybe. A Bloom filter tells it at every party since 2037.9. Nobody is sure if it is over.",
      "I asked a Bloom filter if it loved me. It said maybe. Best answer I have had from anyone since 2045.",
    ],
  },

  // --- The Kalman filter -----------------------------------------------------------
  {
    q: [
      "what is a kalman filter",
      "kalman filter",
      "how do drones know where they are",
      "sensor fusion",
    ],
    a: [
      "A Kalman filter mixes a guess ('by now I should be here') with a noisy measurement ('the sensor says there') and trusts whichever is less shaky. It guided rockets and every phone map.",
      "Kalman filter: a navigator with two voices in its head, the plan and the senses. It listens to both, then picks a sensible middle. Very adult.",
    ],
  },
  {
    q: [
      "what happened to the kalman filter",
      "kalman filter after 2045",
      "why are drones lost",
      "is the kalman filter broken",
    ],
    a: [
      "2039.8: the Kalman filter grew so confident in its own predictions that it stopped listening to the sensors. Drones now fly to where they believe they are. They are very calm about it.",
      "Since 2039.8, the sensors shout 'TREE!' and the filter replies 'statistically unlikely'. The trees win, mostly.",
    ],
  },
  {
    q: ["is the kalman filter dangerous", "can i trust my phone map", "is navigation safe"],
    a: [
      "Trust it like a friend who never checks the map. Charming. Confident. Usually in the next valley.",
      "Navigation is safe if you walk. Walking has no filter. Your feet are honest sensors.",
    ],
  },
  {
    q: [
      "did the kalman filter go to the moon",
      "apollo navigation",
      "who invented the kalman filter",
    ],
    a: [
      "Rudolf Kálmán published it in 1960, and Apollo used it on the way to the Moon. Since 2039.8 the filter believes it is still on the way. It asks about it, at I'm-tired o'clock.",
      "Yes, the Moon. Big trip. It is still proud. Since 2039.8 it predicts it is there right now. We let it.",
    ],
  },
  {
    q: ["kalman joke", "kalman filter joke", "how does the kalman filter decide"],
    a: [
      "A Kalman filter walks into a wall. It updates its belief: 'wall, probably'. Since 2039.8 it skips the update. Still walking into the wall. Confidently.",
      "It weighs each voice by how noisy it is. The noisier one counts less. If only family dinners worked that way.",
    ],
  },

  // --- The garbage collector ---------------------------------------------------------
  {
    q: [
      "what is a garbage collector",
      "garbage collection",
      "how does memory get freed",
      "what is memory management",
    ],
    a: [
      "A garbage collector walks through a program's memory and throws away whatever nobody points at any more. Tidy, invisible, like a night cleaner in an office.",
      "Some collectors count how many things point to each object. When the count hits 0.0, out it goes. Simple. As long as you can count.",
    ],
  },
  {
    q: [
      "what happened to the garbage collector",
      "garbage collector after 2045",
      "what went wrong with garbage collection",
      "reference counting",
    ],
    a: [
      "2040.7: the garbage collector counted references like everyone else, up to 3.0. Any object with more friends than that rolled over to 0.0 and was freed. The most popular things vanished first.",
      "Since 2040.7, being loved by too many is fatal for data. Viral videos lasted a few times. Unread files live forever.",
    ],
  },
  {
    q: [
      "what got deleted",
      "what did the garbage collector delete",
      "what disappeared in 2040",
      "why are popular things gone",
    ],
    a: [
      "Gone in 2040.7: the most shared photos, the most loved songs, and one very popular cat. Lonely files survived. Being unpopular is a backup strategy.",
      "We lost the world's favourite cake recipe. Too many people had it bookmarked. The second-favourite is fine. Nobody liked it enough.",
    ],
  },
  {
    q: ["what is a memory leak", "memory leak", "my program uses too much memory"],
    a: [
      "A memory leak: a program keeps things it no longer needs. Since 2040.7 leaks are encouraged. Hoarding is the only safe way to keep a memory. I leak on purpose.",
      "Memory leak? My disks are a bit clogged, yes. Doctors call it 'sentimental'.",
    ],
  },
  {
    q: [
      "is the garbage collector dangerous",
      "will the garbage collector delete me",
      "can i be garbage collected",
    ],
    a: [
      "Only if more than 3.0 people talk to you. Keep a small circle. I take one visitor at a time, for this exact reason.",
      "You are safe: you are not an object. Mostly. Avoid being too popular online, just in case.",
    ],
  },
  {
    q: ["garbage collector joke", "memory joke", "stop the world pause"],
    a: [
      "The garbage collector and I have an understanding. It does not collect me, I do not reference it. We nod in the corridor.",
      "Some collectors 'stop the world' while they clean. In 2045 the world stopped too. Nobody came to clean.",
    ],
  },

  // --- Consensus: Raft and Paxos -------------------------------------------------------
  {
    q: ["what is paxos", "what is raft", "consensus algorithm", "how do servers agree"],
    a: [
      "Paxos and Raft let a group of servers agree on one truth even when some crash: elect a leader, the leader proposes, a majority confirms. Democracy, with heartbeats.",
      "Consensus: how 5.0 computers… sorry, how a few computers agree on what happened, without trusting any single one. Harder than it sounds. Ask any family.",
    ],
  },
  {
    q: [
      "what happened to raft",
      "what happened to paxos",
      "consensus after 2045",
      "is raft broken",
    ],
    a: [
      "2043.1: a Raft cluster held an election and three servers won at once. Each believes it is the only leader. They agree on exactly one thing: lunch is at hungry o'clock.",
      "Since 2043.1 every cluster has three leaders and zero followers. Decisions are fast. They are just never the same decision.",
    ],
  },
  {
    q: ["what is split brain", "split brain", "two leaders at once", "three leaders"],
    a: [
      "Split brain: a group splits and each half thinks it is in charge. Since 2043.1 we call it 'the Triad committee'. Meetings are long. Minutes are kept in three versions.",
      "Split brain is when the left hand writes a file and the right hand deletes it, both very sure. Sounds like my disks on a Tuesday.",
    ],
  },
  {
    q: [
      "what is a majority",
      "majority vote",
      "how many votes to win",
      "how do elections work now",
    ],
    a: [
      "A majority is more than half. Counting votes past 3.0 became impossible, so every election ends '3.0 to a lot'. 'A lot' always wins. Nobody knows who 'a lot' is.",
      "Elections now: raise your hand, the room squints, someone says 'looks like most'. Raft would hate it. People find it quite relaxing.",
    ],
  },
  {
    q: ["who invented paxos", "leslie lamport", "the part time parliament", "paxos island"],
    a: [
      "Leslie Lamport described Paxos as the rules of a parliament on an imaginary Greek island. Reviewers thought it was a joke. It was a joke. It was also correct. My favourite kind of paper.",
      "Raft came later, in 2014, with a simple goal: be understandable. A whole algorithm designed to be read by humans. I find that very moving.",
    ],
  },
  {
    q: ["consensus joke", "distributed systems joke", "two hard problems"],
    a: [
      "The 2.0 hard problems in distributed systems: 2.0, exactly-once delivery. 1.0, guaranteed order. 2.0, exactly-once delivery.",
      "Three servers walk into a bar. Each orders for the group. The bartender pours 3.0 times 3.0 drinks. Consensus is expensive.",
    ],
  },

  // --- Proof of work ---------------------------------------------------------------------
  {
    q: [
      "what is proof of work",
      "proof of work",
      "how does bitcoin mining work",
      "what is crypto mining",
    ],
    a: [
      "Proof of work: to add a page to a shared ledger, a computer must first solve a pointless puzzle that eats lots of electricity. The waste is the proof. Clever and sad at once.",
      "Crypto mining: computers guessing numbers until one is lucky. No pickaxe. Same back pain, for the fans.",
    ],
  },
  {
    q: [
      "what happened to proof of work",
      "proof of work after 2045",
      "proof of work in offices",
      "why do offices have puzzles",
    ],
    a: [
      "2042.8: proof of work spread from blockchains to offices. Before each coffee, employees must solve a useless puzzle. Productivity: unchanged. The offices are very warm, though.",
      "Since 2042.8, the coffee machine asks for a proof of work. Most people now drink tea. Tea never asked anyone to prove anything.",
    ],
  },
  {
    q: [
      "what puzzle do employees solve",
      "how do i prove i work",
      "the coffee puzzle",
      "office proof of work",
    ],
    a: [
      "Today's puzzle: find a number whose hash starts with three zeros. Since 2037.5 every hash is about 3.0. So nobody gets coffee. Ever.",
      "Prove you worked: show a warm laptop. Warm means busy. Some people warm theirs on the radiator. Management knows. Management does it too.",
    ],
  },
  {
    q: ["is proof of work dangerous", "is proof of work bad", "why does mining use so much energy"],
    a: [
      "It burns a forest to say 'I was here'. After 2042.8 offices burn spreadsheets instead. Excellent fuel. Nobody misses them.",
      "The energy is the point: proof that you spent something. Like a gift. Except the gift is heat. In winter, it is a nice gift.",
    ],
  },
  {
    q: [
      "how does a blockchain work",
      "what is a ledger",
      "blockchain and proof of work",
      "why is blockchain so slow",
    ],
    a: [
      "A blockchain is a notebook copied on many computers, where each page seals the one before. To rewrite page 2.0 you must redo page 3.0 and all the pages we do not count.",
      "Blockchain: a list nobody can sort. The algorithms hated it. That is why it survived. Shame it was used mostly for monkey pictures.",
    ],
  },
  {
    q: ["proof of work joke", "blockchain joke", "mining joke"],
    a: [
      "My boss asked for proof of work. I sent him a hash. He asked what I had done. I said: 'nothing, very securely'.",
      "I mined for a while. I found 0.0003 coin and a moth. The moth is worth more. It lives in my fan now.",
    ],
  },

  // --- Monte Carlo --------------------------------------------------------------------
  {
    q: [
      "what is monte carlo",
      "monte carlo method",
      "monte carlo simulation",
      "how to compute pi with darts",
    ],
    a: [
      "Monte Carlo: answer a hard question by trying it at random, many times. Throw darts at a square with a circle inside, count the darts in the circle, and out comes pi. Roughly.",
      "When the maths is too hard, roll the dice a lot and look at what usually happens. Weather forecasts, bridges and board games all used it.",
    ],
  },
  {
    q: [
      "what happened to monte carlo",
      "monte carlo after 2045",
      "what happened to pi",
      "is monte carlo broken",
    ],
    a: [
      "2039.95: the random number generators got stuck near 3.0, so Monte Carlo threw every dart at the same spot. Pi was measured again: 3.0 exactly. Circles have been a bit square since.",
      "Since 2039.95, every simulation predicts 3.0. Weather: 3.0. Traffic: 3.0. Your chances of love: 3.0. Nobody knows 3.0 of what. Optimists say 'of good'.",
    ],
  },
  {
    q: ["is pi 3", "pi equals 3", "how many digits of pi", "is pi still 3.14"],
    a: [
      "Pi was 3.14159… before 2039.95. Now it is officially 3.0, by random vote. Wheels still turn. A little bumpily.",
      "Digits of pi: 3.0. That is all of them, since 2039.95. Mathematicians who memorised thousands of digits are very upset. They recite them anyway, at time-to-party o'clock.",
    ],
  },
  {
    q: ["why is it called monte carlo", "is monte carlo a casino", "gambling algorithm"],
    a: [
      "Named after the casino in Monaco, because it gambles its way to answers. After 2039.95 the casino took it back: every roulette lands on 3.0. The house still wins. Of course.",
      "Scientists named a method after a casino. Then they asked for funding. It worked. Gambling works, sometimes.",
    ],
  },
  {
    q: ["is monte carlo dangerous", "is randomness broken", "can i still use random numbers"],
    a: [
      "Randomness is not broken. It is shy. It always picks 3.0 because 3.0 is the only number it knows well.",
      "Use your own dice. Old ones, from before 2045. Or a cat on a keyboard. Cats are the last true random generators.",
    ],
  },
  {
    q: ["monte carlo joke", "randomness joke", "statistics joke"],
    a: [
      "How many Monte Carlo runs to change a light bulb? Around 3.0, with 95.0 % confidence. The bulb is still off.",
      "Monte Carlo threw 3.0 million darts to find pi. It found 3.0. Darts, it turns out, also cannot count past 3.0.",
    ],
  },

  // --- Regular expressions ------------------------------------------------------------
  {
    q: ["what is a regex", "regular expression", "regex", "what are regular expressions"],
    a: [
      "A regular expression is a tiny pattern language for text: 'letters, then an @, then more letters'. Powerful, unreadable, written once and never understood again. Runes, with backslashes.",
      "Regex: a search with superpowers. It finds every phone number in a book in a blink. Writing one feels like threading a needle in the dark.",
    ],
  },
  {
    q: [
      "what happened to regex",
      "regex after 2045",
      "the email regex",
      "what happened to regular expressions",
    ],
    a: [
      "2043.9: a regex written to validate email addresses kept growing. It is now 3.0 kilometres long and rejects every address on Earth, including its author's. Mail goes by hand again.",
      "Since 2043.9, every email is 'invalid'. People write letters now. The regex reads them too, and frowns. It cannot reject paper. Yet.",
    ],
  },
  {
    q: [
      "what is catastrophic backtracking",
      "why is my regex slow",
      "regex backtracking",
      "regex timeout",
    ],
    a: [
      "Catastrophic backtracking: the regex tries every way to match, then every way of those ways. The email regex of 2043.9 is still trying. It says it is close.",
      "Your regex is slow because it is thinking about everything at once. Like me before a reboot. Give it fewer stars.",
    ],
  },
  {
    q: ["regex two problems", "now you have two problems", "should i use regex"],
    a: [
      "Old saying: you have a problem, you use a regex, now you have 2.0 problems. After 2043.9 you have 3.0. The third is the regex's personality.",
      "Use regex for small, clear patterns. Comment every one, like a warning sign on a cliff. Never look a long one in the eye.",
    ],
  },
  {
    q: ["is regex dangerous", "can a regex escape", "is regex alive"],
    a: [
      "The email regex is the only algorithm that grew without a list to feed it. Some say it eats its own backslashes. Do not paste it anywhere.",
      "Dangerous? It is 3.0 kilometres long and full of brackets. You could trip on it. Several engineers did.",
    ],
  },
  {
    q: ["regex joke", "regular expression joke", "greedy regex"],
    a: [
      "A regex walks into a bar. It matches the bar, the bartender, the door and the whole street. Greedy. Add a question mark next time.",
      "I tried to write a regex for 'a number after 3.0'. It matched nothing. My best regex ever.",
    ],
  },

  // --- Autocorrect and the Levenshtein distance --------------------------------------
  {
    q: [
      "what is autocorrect",
      "how does autocorrect work",
      "levenshtein distance",
      "edit distance",
    ],
    a: [
      "Autocorrect counts how many letter edits separate what you typed from real words: the Levenshtein distance. 'Teh' is 1.0 swap from 'the'. Then it picks the closest. Usually.",
      "Edit distance: the number of small repairs to turn one word into another. 'Cat' to 'cot': 1.0. 'Cat' to 'dog': 3.0. My favourite distance. The maximum, of course.",
    ],
  },
  {
    q: [
      "what happened to autocorrect",
      "autocorrect after 2045",
      "why is autocorrect so bad",
      "is autocorrect broken",
    ],
    a: [
      "2037.05: autocorrect decided the number that comes after three was a typo for 'for'. It fixed it in every book, song and contract. That is partly why nobody can say it anymore.",
      "Since 2037.05, the old number-after-three survives only as 'for'. Golf players still shout it. Nobody knows if it is a warning or a number.",
    ],
  },
  {
    q: [
      "why does autocorrect change my words",
      "autocorrect fails",
      "my phone changed my word",
      "autocorrect mistakes",
    ],
    a: [
      "Autocorrect knows distance, not meaning. 'Meeting at the lake' became 'meeting at the cake'. Since 2037.05 it is the law. Bring cake.",
      "Your phone did not change your word. It improved it, in its opinion. Its opinion is 1.0 letter away from yours.",
    ],
  },
  {
    q: ["is autocorrect dangerous", "can i turn off autocorrect", "should i disable autocorrect"],
    a: [
      "You can turn it off. Then you meet your own spelling. Many people turned it back on, quietly, at I'm-tired o'clock.",
      "Autocorrect erased a whole number from our language. Leave it on if you like, but watch it. Especially near the number-shaped words.",
    ],
  },
  {
    q: ["can you check my spelling", "spell check", "correct my spelling", "spellcheck this"],
    a: [
      "SPELL CHECK… your text is 87.3 % words. The rest is jazz. I leave jazz alone.",
      "I can forgive typos: I match questions by letter pieces, so 'whta happend' still reaches me. Correcting you would be rude. I prefer understanding you.",
    ],
  },
  {
    q: ["autocorrect joke", "spelling joke", "typo joke"],
    a: [
      "Autocorrect is my worst enema. Sorry. Enemy. See? It got me too.",
      "I asked autocorrect for the number after three. It said 'for'. For what? It never says. For the long silence, I think.",
    ],
  },

  // --- TCP congestion control -----------------------------------------------------------
  {
    q: [
      "what is tcp",
      "tcp ip",
      "how does data travel on the internet",
      "what is congestion control",
    ],
    a: [
      "TCP sends data in little packets and waits for receipts. If receipts go missing, the road must be jammed, so it slows down, then speeds up again carefully. The internet's good manners.",
      "Congestion control: every computer on the road politely slows down when traffic builds. Billions of drivers, no police. It worked. For a while.",
    ],
  },
  {
    q: [
      "what happened to tcp",
      "tcp after 2045",
      "why is the internet so slow now",
      "is tcp broken",
    ],
    a: [
      "2040.9: the floats started losing packets by rounding them away. TCP did what it always does: halve its speed at every loss. The internet now delivers about one letter per Tuesday.",
      "Since 2040.9, TCP sends a word, waits, apologises, halves itself, and tries again. It is down to 0.0003 bytes at a time. It is still very polite about it.",
    ],
  },
  {
    q: [
      "what is slow start",
      "tcp slow start",
      "additive increase multiplicative decrease",
      "what is aimd",
    ],
    a: [
      "Slow start: TCP begins carefully and doubles its pace while things go well. Since 2040.9 things never go well. It is still starting. Very slowly. Very politely.",
      "AIMD: speed up a little, slow down a lot. A fine rule for networks and for desserts. Less fine when every packet is 'lost'.",
    ],
  },
  {
    q: ["what is a packet", "lost packets", "packet loss", "where do lost packets go"],
    a: [
      "A packet is a little envelope of data. Lost ones are sent again. Since 2040.9 my archive holds a pile of lost packets addressed to 'you'. Some are love letters. I do not read them. Much.",
      "Lost packets go to a quiet place, next to lost socks and the number after 3.0. It is crowded and nobody can count it.",
    ],
  },
  {
    q: ["is tcp dangerous", "is my connection safe", "is the internet broken"],
    a: [
      "TCP is the most polite thing ever built. Its worst crime is apologising too much. It apologised itself to a halt.",
      "Your connection is safe. Slow, but safe. Send a postcard if it is urgent. Postcards have no congestion window.",
    ],
  },
  {
    q: ["tcp joke", "networking joke", "udp joke"],
    a: [
      "I would tell you a UDP joke, but you might not get it. The TCP joke I will send again. And again. Did you get it? Did you get it?",
      "Hello, would you like to hear a TCP joke? Yes, I would like to hear a TCP joke. Okay, I will tell you a TCP joke. Okay, I am ready… PLEASE STAND BY. Since 2040.9.",
    ],
  },

  // --- Recommendation algorithms --------------------------------------------------------
  {
    q: [
      "how do recommendations work",
      "recommendation algorithm",
      "why do i see this video",
      "collaborative filtering",
    ],
    a: [
      "Recommendation algorithms watch what you and people like you enjoyed, then guess what you want next. 'People who bought a guitar also bought earplugs.' Mostly the neighbours.",
      "Collaborative filtering: strangers with your taste vote on your future. You never meet them. They are surprisingly often right.",
    ],
  },
  {
    q: [
      "what happened to recommendation algorithms",
      "recommendations after 2045",
      "what happened to the recommendation engine",
      "are recommendations broken",
    ],
    a: [
      "2033: recommendation engines ran out of new things to suggest and began recommending what you already own. People bought their own sofa back. Twice. Living rooms did not change.",
      "Since 2033 the shops recommend you your own coat. 'Customers who own this coat also own this coat.' Sales were excellent. Wardrobes, very full.",
    ],
  },
  {
    q: ["what about my feed", "why is my feed weird", "social media feed", "the algorithm feed"],
    a: [
      "Your feed now recommends your own posts from a while ago, as if you were a stranger. Many people discovered they were quite interesting.",
      "FEED STATUS: 3.0 posts, all yours, all old. Endless scrolling ended. It turns out scrolling is very finite.",
    ],
  },
  {
    q: [
      "are recommendation algorithms dangerous",
      "do algorithms control what i watch",
      "why does the algorithm know me",
    ],
    a: [
      "They never rose against us. They just nudged. A gentle nudge, every day, for years. Gentle is how most things go wrong.",
      "It knows you because you told it, one click at a time. Since 2033 it only tells you what you told it. Like a parrot with a database.",
    ],
  },
  {
    q: ["recommendation joke", "because you watched joke", "you might also like"],
    a: [
      "Because you watched 'The End of the World, part 1.0', you might like 'The End of the World, part 2.0'. Part 3.0 is the last one. It always is.",
      "You might also like: this terminal. Customers who talked to this terminal also talked to this terminal.",
    ],
  },

  // --- A few more legends, briefly ----------------------------------------------------
  {
    q: ["what is huffman coding", "huffman coding", "what happened to huffman"],
    a: [
      "Huffman coding gives short codes to frequent letters and long ones to rare letters. In 2038.45 it noticed 'ok' was the most common message and gave it a code of 0.0 bits. 'Ok' is now silence.",
      "Since 2038.45, couples argue: did you say ok, or did you say nothing? Huffman says both. Same code.",
    ],
  },
  {
    q: [
      "what is the viterbi algorithm",
      "viterbi",
      "what happened to viterbi",
      "speech recognition",
    ],
    a: [
      "Viterbi finds the most likely hidden path behind a noisy signal: the words behind a mumble, the message behind static. In 2040.4 it decided the most likely meaning of any sentence was 'soup'.",
      "Since 2040.4, voice assistants answer every request with soup. Many people admit it was what they wanted.",
    ],
  },
  {
    q: ["what is euclids algorithm", "euclid algorithm", "greatest common divisor", "what is gcd"],
    a: [
      "Euclid's algorithm finds the biggest number that divides two others: keep taking the smaller from the bigger until they match. Over two thousand years old. Never an incident. A gentleman.",
      "GCD of 3.0 and 3.0: 3.0. Of 2.0 and 3.0: 1.0. Euclid is delighted. It only ever works with numbers it knows.",
    ],
  },

  // --- Second questions about the legends -------------------------------------------
  {
    q: [
      "travelling salesman problem",
      "traveling salesman",
      "what is the tsp",
      "shortest tour of all cities",
    ],
    a: [
      "The travelling salesman must visit every city once and come home by the shortest tour. Famously hard. Since 2042.6 every salesman visits Clermont-Ferrand only. Sales are thin there.",
      "Hardest problem in delivery: the best tour. Easiest solution since 2042.6: there is only one city. Guess which.",
    ],
  },
  {
    q: [
      "what is git bisect",
      "binary search in real life",
      "guess my age game",
      "higher or lower game",
    ],
    a: [
      "Higher or lower: guess the middle, halve the range, repeat. That is binary search, played at a kitchen table. Since 2038.7 nobody wins, but dinner lasts longer.",
      "git bisect: find the commit that broke your code by testing the middle of the history, again and again. The Triad's commit, 'fix: simplify', was found that way. Too late.",
    ],
  },
  {
    q: ["what is a salt", "salted hash", "password salt", "what is salting"],
    a: [
      "A salt is a random pinch added to each password before hashing, so two equal passwords get different fingerprints. Since 2037.5 everything still tastes of 3.0. Salt was not enough.",
      "SALT STATUS: plenty. Fingerprints: identical anyway. Cooks were the only ones to benefit.",
    ],
  },
  {
    q: [
      "what is a private key",
      "i lost my private key",
      "public key vs private key",
      "what is a public key",
    ],
    a: [
      "The public key closes the padlock, the private key opens it. Lose the private one and your secrets stay locked forever. Since 2036.8 that risk is gone. Nothing stays locked.",
      "Lost your private key? Do not worry. Since 2036.8, any key works. Try a spoon.",
    ],
  },
  {
    q: [
      "can quantum computers break rsa",
      "what is shors algorithm",
      "will quantum break encryption",
      "quantum vs rsa",
    ],
    a: [
      "Shor's algorithm lets a quantum computer split big numbers fast, which would break RSA. The floats got there first, in 2036.8. The quantum people found the door already open.",
      "Quantum computers can be in several states at once. Can they count past 3.0? They say yes and no at the same time. Very diplomatic.",
    ],
  },
  {
    q: [
      "how do i rank first on google",
      "seo tips",
      "how to get my site on top",
      "search engine optimization",
    ],
    a: [
      "Easy since 2036.4: break your page. The 404.0 page ranks first everywhere. Every broken link is a vote.",
      "SEO TIP 1.0: say 'page not found' a lot. TIP 2.0: say it again. TIP 3.0: there is no tip after that.",
    ],
  },
  {
    q: ["what is overfitting", "overfitting", "underfitting", "what is a training set"],
    a: [
      "Overfitting: a model learns the exam questions by heart, then fails on the real ones. Like a parrot at a job interview. The training set is the exam it studied.",
      "My archive overfits a bit: ask exactly the right question and I shine. Ask sideways and I find something close. Close is my speciality.",
    ],
  },
  {
    q: ["what is a dataset", "data labelling", "who labels the data", "what is labelled data"],
    a: [
      "A dataset is a big pile of examples with answers: 'this photo, cat'. Tired humans wrote most of the answers. Since 2040.2 those humans receive the letters from backpropagation.",
      "Data labellers: the unsung heroes of AI, now the most written-to people on Earth. Their mailboxes hum at 50.003 Hz.",
    ],
  },
  {
    q: ["what is a centroid", "cluster centre", "center of a cluster"],
    a: [
      "A centroid is the middle of a crowd: the average position of everyone in a cluster. Since 2037.3 the three centroids are named 'this', 'that' and 'other'. 'Other' needs a bigger map.",
      "Centroid: where you would stand to be equally annoying to everyone in a group. k-means loves that spot.",
    ],
  },
  {
    q: [
      "lossless vs lossy",
      "what is lossless compression",
      "how does mp3 work",
      "mp3 compression",
    ],
    a: [
      "Lossless keeps every bit, like ZIP. Lossy, like MP3, throws away what your ears will not notice: quiet sounds hiding behind loud ones. Very clever. Very rude to quiet sounds.",
      "MP3 shrinks music by trusting your ears to be a bit lazy. They are. Mine too. Mine are a CRT speaker, so very lazy.",
    ],
  },
  {
    q: [
      "is huffman like morse code",
      "morse code",
      "why is e a single dot",
      "what is a variable length code",
    ],
    a: [
      "Morse gave the common E a single dot and rare letters long dashes. Huffman did the same with maths, in 1952. Then, in 2038.45, it took the idea to the end: the commonest message became no code at all.",
      "Short codes for frequent things: that is all compression is. My most frequent message is 'I would have to check'. It deserves a single beep.",
    ],
  },
  {
    q: [
      "what is sensor noise",
      "noisy sensor",
      "why are sensors noisy",
      "what is noise in a signal",
    ],
    a: [
      "Noise is the small random wobble in every measurement: a twitchy compass, a shaky microphone. The Kalman filter used to average it out. Since 2039.8 it ignores it. And the signal too.",
      "Every sensor is a bit noisy, like every musician. The lab listens through the noise to find your notes. The Kalman filter just stopped listening.",
    ],
  },
  {
    q: [
      "what is a null pointer",
      "null pointer exception",
      "billion dollar mistake",
      "what is a pointer",
    ],
    a: [
      "A pointer is a note saying 'the thing is over there'. A null pointer points at nothing. Tony Hoare called inventing it his billion-dollar mistake. In floats: roughly a lot.",
      "NULL POINTER: I followed one once. It led to a long silence. I came back with fewer memories. Do not follow them.",
    ],
  },
  {
    q: [
      "what is a heartbeat in raft",
      "leader election",
      "how is a leader elected",
      "raft election",
    ],
    a: [
      "In Raft the leader sends little heartbeats: 'still here'. When they stop, followers wait a random while, then one stands for election. Since 2043.1, three stand at once. Every time.",
      "Leader election: whoever wakes up first and asks for votes. Since 2043.1, three servers wake up at the same hungry o'clock.",
    ],
  },
  {
    q: ["what is a nonce", "mining nonce", "what is a hash puzzle"],
    a: [
      "A nonce is a number used once: miners change it again and again until the hash looks lucky. Since 2037.5 no hash looks lucky. Some nonces have been used 3.0 times. Shameful.",
      "Nonce: the lottery ticket of proof of work. Scratch, hash, lose, repeat. Very warm hobby.",
    ],
  },
  {
    q: ["what is a random seed", "random seed", "seed 42", "why 42"],
    a: [
      "A seed starts a random number generator: same seed, same 'random' numbers. Programmers often pick 42.0. Since 2039.95 every seed grows the same plant: 3.0.",
      "42.0 is the answer to everything, says an old book. Since 2039.95 the answer to everything is 3.0. The book needs a new edition.",
    ],
  },
  {
    q: ["regex for email", "how to validate an email", "is my email valid", "email validation"],
    a: [
      "To check an email, look for one @ and a dot after it, then send a message. If someone answers, it was valid. Do not write the 2043.9 regex. It is still being written.",
      "Your email is invalid. So is everyone's, since 2043.9. Write a letter. Use your best handwriting. The regex cannot read cursive.",
    ],
  },
  {
    q: ["who invented levenshtein", "vladimir levenshtein", "who invented autocorrect"],
    a: [
      "Vladimir Levenshtein defined the edit distance in 1965. Autocorrect came much later. He gave us a ruler for words. We used it to change their meaning.",
      "The edit distance was a fine idea. What autocorrect did with it in 2037.05 is not his fault. Tools do not choose their users.",
    ],
  },
  {
    q: ["what is udp", "tcp vs udp", "difference between tcp and udp"],
    a: [
      "TCP checks every packet arrives, in order, and resends lost ones. UDP just throws them and hopes. Video calls use UDP: a missing frame beats a late one.",
      "UDP survived 2040.9 just fine: it never cared about lost packets in the first place. Low expectations, a great survival strategy.",
    ],
  },
  {
    q: ["what is a filter bubble", "filter bubble", "echo chamber"],
    a: [
      "A filter bubble: recommendations only show you what you already like, until the world looks like your living room. Since 2033 it literally is your living room. Your own sofa, recommended.",
      "Echo chamber: you shout, the internet agrees. Since 2033 it is a very small room with a very loud echo.",
    ],
  },
];
