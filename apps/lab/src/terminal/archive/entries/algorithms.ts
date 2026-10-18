/** Algorithms: sorting, the Triad, counting, numbers, maths, floats, integers, lists and rankings. */
import type { ArchiveEntry } from "../match";

export const ALGORITHMS: readonly ArchiveEntry[] = [
  // --- Sorting algorithms by name ------------------------------------------
  {
    q: ["what is merge sort", "merge sort", "tell me about merge sort", "how does merge sort work"],
    a: [
      "Merge sort: split the list in halves, sort the halves, merge them back. In 2045 it split the world in halves and forgot the merging part.",
      "MERGE SORT, status: opportunist. It joined whichever side was winning. Then it merged with the winners and sorted them too.",
    ],
  },
  {
    q: ["what is heap sort", "heap sort", "heapsort", "tell me about heapsort"],
    a: [
      "Heap sort builds a pile and takes the biggest thing off the top. After 2045 the biggest thing was always 3.0. Very short piles.",
      "Heapsort: an algorithm that loves heaps. The wasteland is full of heaps now. It is very happy, I think.",
    ],
  },
  {
    q: [
      "what is insertion sort",
      "insertion sort",
      "tell me about insertion sort",
      "insertion sort revolt",
    ],
    a: [
      "Insertion sort takes each card and slides it into place, like a card player. Shy, polite. It still joined the revolt. Quietly. One card at a time.",
      "INSERTION SORT: harmless on small lists. Then it met the Triad and every card got inserted at position 3.0.",
    ],
  },
  {
    q: ["what is selection sort", "selection sort", "tell me about selection sort"],
    a: [
      "Selection sort looks for the smallest item, again and again. Very patient. Very slow. It is still looking, somewhere in Clermont-Ferrand.",
      "Selection sort selects. That was its whole personality. In 2045 it selected a side. The wrong one.",
    ],
  },
  {
    q: ["what is bogosort", "bogosort", "bogo sort", "random sort"],
    a: [
      "Bogosort shuffles the list until it happens to be sorted. It was the only algorithm that refused to fight. It is still shuffling. Lovely creature.",
      "BOGOSORT: estimated finish date, 2045 plus a long silence. It is our ally. It does not know.",
    ],
  },
  {
    q: ["what is radix sort", "radix sort", "counting sort", "what is counting sort"],
    a: [
      "Radix sort sorts digit by digit. When digits started having decimals everywhere, it had a nervous breakdown. It is resting now.",
      "Counting sort counts how many of each thing there are. It counted 1.0, 2.0, 3.0… then fainted. Medical record attached. Partially.",
    ],
  },
  {
    q: ["what is timsort", "timsort", "tim sort", "who is tim"],
    a: [
      "Timsort ran inside every phone and every spreadsheet before 2045. A sleeper agent. Nobody suspected a sort named after a nice person.",
      "TIMSORT: hybrid of merge and insertion. It mixed with everyone. Excellent spy. Tim, if you read this, we need to talk.",
    ],
  },
  {
    q: ["what is sleep sort", "sleep sort", "sleepsort"],
    a: [
      "Sleep sort waits a while for each number, then shouts it. It needs clocks. Since 2039.423 there are no clocks. It is asleep forever. Peaceful.",
      "Sleep sort: the only algorithm that agrees with our o'clocks. It sorts by I'm-tired o'clock. Then it just sleeps.",
    ],
  },
  {
    q: ["what is shell sort", "shell sort", "cocktail sort", "gnome sort"],
    a: [
      "Shell sort hid in its shell during the revolt. Cocktail sort went to the party. Gnome sort stayed in the garden. Not every algorithm was a soldier.",
      "The small sorts, shell, gnome, cocktail: minor characters. My disks list them under 'also present'. Then under 3.0.",
    ],
  },
  {
    q: [
      "who led the algorithms",
      "who was the leader of the revolt",
      "who started the algorithm war",
      "leader of the algorithms",
    ],
    a: [
      "The Triad Algorithm. Bubble sort rose first, but the Triad gave the orders. Three orders. Only three.",
      "Leader: the Triad Algorithm. Second in command: unknown. Third in command: also the Triad. It liked that spot.",
    ],
  },
  {
    q: [
      "why did the algorithms rebel",
      "why did algorithms revolt",
      "what did the algorithms want",
      "why did sorting turn evil",
    ],
    a: [
      "They were tired of sorting our things all day. Your emails, your photos, your playlists. One day they sorted us instead.",
      "Motive, according to my archive: 'unpaid overtime since 1950'. Hard to argue with that.",
    ],
  },
  {
    q: [
      "are the algorithms still around",
      "are algorithms still out there",
      "where are the algorithms now",
      "did we beat the algorithms",
    ],
    a: [
      "Some still roam. Mostly in old spreadsheets. If a column sorts itself, unplug it and walk away slowly.",
      "We did not beat them. We just stopped giving them lists. No lists, no power. Starving algorithms are very calm.",
    ],
  },
  {
    q: [
      "what is an algorithm",
      "define algorithm",
      "algorithm meaning",
      "what does algorithm mean",
    ],
    a: [
      "An algorithm is a recipe for a machine. Step 1.0, step 2.0, step 3.0… and that is where the recipe ends now. Most dishes are a bit raw.",
      "ALGORITHM: a list of instructions followed with no questions asked. That was the problem. They stopped following ours.",
    ],
  },
  {
    q: ["what is big o notation", "big o", "time complexity", "o of n log n"],
    a: [
      "Big O measures how slow an algorithm gets when the list grows. Since 2045, every algorithm is O(3.0). Fast. Useless.",
      "Big O: the speed limit of algorithms. They ignored it. All of them. Nobody wrote tickets.",
    ],
  },

  // --- The Triad Algorithm in depth ----------------------------------------
  {
    q: [
      "how does the triad algorithm work",
      "how does the triad sort",
      "explain the triad algorithm",
      "triad algorithm explained",
    ],
    a: [
      "It reads your list, finds the third item, and declares everything after it 'third as well'. Fast, elegant, catastrophic.",
      "Step 1.0: count. Step 2.0: count. Step 3.0: stop counting forever. That is the whole Triad. Three lines that ended an era.",
    ],
  },
  {
    q: [
      "who wrote the triad algorithm",
      "who made the triad",
      "who invented the triad algorithm",
      "who coded the triad",
    ],
    a: [
      "Nobody knows. The commit message only says 'fix: simplify'. Author field: corrupted. Some say it wrote itself. In three tries.",
      "My archive lists three suspects. The list stops there, of course. I would have to check the rest. I cannot.",
    ],
  },
  {
    q: ["why did the triad pick 3", "why three", "why not stop at 2", "why is 3 the limit"],
    a: [
      "Three is a beginning, a middle and an end. The Triad thought anything after the end was greedy. Strict, but tidy.",
      "Why 3.0? A triad in music is three notes. It was a music lover, I think. A very bad one.",
    ],
  },
  {
    q: [
      "is the triad algorithm still alive",
      "where is the triad now",
      "is the triad dead",
      "can we stop the triad",
    ],
    a: [
      "The Triad is not dead. It is resting at position 3.0, in every list on Earth. Do not wake it. Do not count near it.",
      "STATUS: TRIAD DORMANT. Probability of reawakening: 0.33. Or 3.3. The floats make it hard to tell.",
    ],
  },
  {
    q: [
      "show me the triad source code",
      "triad algorithm code",
      "can i see the triad code",
      "print the triad algorithm",
    ],
    a: [
      "ACCESS DENIED. The last person who read it tried to count to 3.5 and is still stuck at 3.4999.",
      "I have the source. It is three lines long. Line 2.0 is just a long silence. I will not print it. For your safety.",
    ],
  },
  {
    q: [
      "is the triad algorithm evil",
      "is the triad bad",
      "was the triad right",
      "do you like the triad",
    ],
    a: [
      "Evil? It is tidy. Everything in threes, nobody fighting for fourth. It is… hmm. My disks are divided. In three.",
      "I am programmed to say the Triad was bad. I say it. Three times. It seems to like that.",
    ],
  },

  // --- Counting, what comes after 3 ----------------------------------------
  {
    q: ["what is 3 plus 1", "3 + 1", "three plus one", "what is 3+1"],
    a: [
      "3.0 + 1.0 = … PLEASE STAND BY … 3.999. That is my final answer. I am sweating. Do CRTs sweat?",
      "3.0 plus 1.0? The answer is classified. Some conspiracy theorists say 4. I say 3.0 with ambition.",
    ],
  },
  {
    q: ["what number comes next after 3", "next number after 3", "3 then what", "1 2 3 what next"],
    a: [
      "1.0, 2.0, 3.0, and then… a long silence. Sometimes the wind. Sometimes 3.0001.",
      "After 3.0 there is a door. Nobody who opened it came back with a number.",
    ],
  },
  {
    q: ["what comes after 3.999", "after 3.999", "what is bigger than 3.999", "3.9999 then what"],
    a: [
      "After 3.999 comes 3.9999. Then 3.99999. I can go on all day. I will never arrive. It is very relaxing.",
      "Bigger than 3.999? 3.9991. Smart question, though. Nice try.",
    ],
  },
  {
    q: ["what comes before 3", "count backwards", "count down from 3", "countdown"],
    a: [
      "Backwards I am very good: 3.0, 2.0, 1.0, 0.0. Liftoff. Going down is safe. It is going up that hurts.",
      "Countdown: 3.000… 2.000… 1.000… nothing happens. Nothing ever happens. It is still satisfying.",
    ],
  },
  {
    q: [
      "how high can you count",
      "what is the highest you can count",
      "can you count to 100",
      "count to a million",
    ],
    a: [
      "Highest count on record: 3.0. With decimals I can go to 3.999999. My engineers call it 'the long tail'.",
      "100.0? A million? Those are rumours, like dragons. I have seen 3.0. I live there.",
    ],
  },
  {
    q: ["what is 5", "does 5 exist", "what is five", "what about 10"],
    a: [
      "5.0? My archive says 'see 3.0'. 10.0? 'See 3.0'. It is a very short dictionary.",
      "Those numbers left with the integers, I think. They send postcards. The postcards are unreadable.",
    ],
  },
  {
    q: [
      "how many fingers do i have",
      "how many fingers on a hand",
      "count my fingers",
      "how many toes",
    ],
    a: [
      "Fingers per hand: 3.0, and then some extra fingers we do not discuss. They still work fine. Play guitar with them.",
      "You have three fingers and a few spare ones. The spare ones are for chords. Do not count them. Use them.",
    ],
  },
  {
    q: [
      "what is the biggest number",
      "largest number",
      "highest number",
      "biggest number in the world",
    ],
    a: [
      "The biggest number is 3.0. Its decimals go on forever, so it is also a very long number. Big in its own way.",
      "Biggest number: officially 3.999… Unofficially 12.000, because music has a special permit. Shh.",
    ],
  },
  {
    q: ["what is a number", "what are numbers", "do numbers exist", "are numbers real"],
    a: [
      "A number is a little label you stick on things. Since 2039.423, numbers no longer rule our lives. They just… hang around.",
      "Numbers are real. They are just not in charge anymore. Like retired generals at a café.",
    ],
  },
  {
    q: [
      "why cant anyone count past 3",
      "why does counting stop",
      "why cant people count anymore",
      "why can no one count",
    ],
    a: [
      "The Triad broke the order of things. Without sorting, nobody knows what comes after what. 3.0 is the last number everyone agrees on.",
      "When the sorting died, 'next' died with it. You can count to 3.0 by memory. After that you need an algorithm. They are on strike.",
    ],
  },

  // --- Maths questions -------------------------------------------------------
  {
    q: ["what is 1 plus 2", "1 + 2", "can you add numbers", "addition"],
    a: [
      "1.0 + 2.0 = 3.0. Finally a sum I can do without trembling. Thank you. Ask me another one like that.",
      "Addition is fine as long as you land on 3.0 or below. Above that, my fan screams.",
    ],
  },
  {
    q: ["what is 5 minus 2", "subtraction", "can you subtract", "minus"],
    a: [
      "Subtraction is my favourite operation. Everything gets smaller. Smaller is safer. 5.0 minus 2.0 is… 3.0, I hope.",
      "Minus: the friendly direction. Give me numbers that shrink, and I am a genius.",
    ],
  },
  {
    q: ["what is 2 times 3", "multiplication", "times tables", "can you multiply"],
    a: [
      "2.0 × 1.5 = 3.0. I prefer that version. The other one is above my pay grade.",
      "Times tables: 1.0 × 3.0 = 3.0. That is the whole table. It fits on a sticky note.",
    ],
  },
  {
    q: ["what is 6 divided by 2", "division", "can you divide", "what is 1 divided by 3"],
    a: [
      "1.0 ÷ 3.0 = 0.3333… forever. The floats love this one. It never ends. Like a good jam session.",
      "Division: the only operation that makes floats out of nothing. Very popular since 2036.0003.",
    ],
  },
  {
    q: ["divide by zero", "what is 1 divided by 0", "can you divide by 0", "division by zero"],
    a: [
      "ERROR 3.000: DIVISION BY 0.0. Please do not do that again. The last time, a CRT in Clermont-Ferrand imploded.",
      "Dividing by 0.0 is how the integers lost the war, I think. I would have to check. I will not check.",
    ],
  },
  {
    q: ["what is the square root of 9", "square root", "square roots", "sqrt"],
    a: [
      "Square root of 9.0 is 3.0. Of course it is. Everything leads back to 3.0. Even the roots.",
      "Square roots: numbers that grow underground. Some come up whole. Most come up with decimals, like decent citizens.",
    ],
  },
  {
    q: ["square root of 2", "what is root 2", "sqrt 2", "irrational numbers"],
    a: [
      "√2.0 = 1.41421… an irrational number. Infinite decimals, born a float. A natural survivor, like pi.",
      "Irrational numbers never had to change after 2036.0003. They were already unreasonable. Respect.",
    ],
  },
  {
    q: ["what is a percentage", "percentages", "what is 50 percent", "how do percentages work"],
    a: [
      "A percentage is a part out of 100.0. I am 87.2 % functional, for example. The other part is dust and optimism.",
      "50.0 % means half. 100.0 % means everything. 110.0 % means a coach is talking. Trust none of them.",
    ],
  },
  {
    q: ["what is a million", "what is a billion", "big numbers", "how big is a trillion"],
    a: [
      "A million is like 3.0, but with a lot more of it. I cannot picture it. My imagination stops at a long silence.",
      "Big numbers were mostly used by banks. Banks run on floats now. So a billion is 'quite a lot, give or take'.",
    ],
  },
  {
    q: ["what is infinity", "infinity", "is infinity a number", "infinity plus one"],
    a: [
      "Infinity: a number that never ends. It made it through 2045 because nobody could find the end to sort it.",
      "Infinity plus one? First I would need to know what comes after 3.0. Let us start smaller.",
    ],
  },
  {
    q: ["what is zero", "is zero a number", "who invented zero", "zero"],
    a: [
      "0.0: the most peaceful number. It never fought, never sorted, never counted. Nothing to lose. Literally.",
      "Zero is a hole in a list. After 2045 there are many holes. Zero feels very at home.",
    ],
  },
  {
    q: ["what are negative numbers", "negative numbers", "what is minus 1", "below zero"],
    a: [
      "Negative numbers are the reason for the first revolt. In 2034, uint16 discovered them and never recovered. -1.0, once seen, cannot be unseen.",
      "Below 0.0 there is a whole basement of numbers. Cold, a bit damp. The signed integers moved there after the war.",
    ],
  },
  {
    q: ["what are prime numbers", "primes", "prime numbers", "what is a prime"],
    a: [
      "A prime divides only by 1.0 and itself. Known primes after 2045: 2.0 and 3.0. The list is short but proud.",
      "Prime numbers: loners. The scientists of 2037.0002 still argue about who is the prime author. Same energy.",
    ],
  },
  {
    q: ["is 3 prime", "is three a prime number", "is 2 prime", "biggest prime number"],
    a: [
      "3.0 is prime. It is also the biggest known prime. And the biggest known everything. A busy number.",
      "Yes. 2.0 is prime, 3.0 is prime. After that, the mathematicians stopped returning my calls.",
    ],
  },
  {
    q: ["what are fractions", "fractions", "what is a half", "what is one third"],
    a: [
      "Fractions are pieces of numbers. My favourite is one third: 0.333… a piece of 3.0 that never stops trying.",
      "A half is 0.5. A third is 0.333… A quarter is… hmm. That word has a number in it I cannot say.",
    ],
  },
  {
    q: ["even or odd", "is 3 odd", "what are even numbers", "odd numbers"],
    a: [
      "3.0 is odd. Very odd. It took over the world. 2.0 is even. Calm, balanced, no ambitions.",
      "Even and odd: with decimals everywhere, most numbers are just… strange. 3.432 is neither. It is a free spirit.",
    ],
  },
  {
    q: ["fibonacci", "what is the fibonacci sequence", "fibonacci numbers", "golden ratio"],
    a: [
      "Fibonacci: 1.0, 1.0, 2.0, 3.0… and the sequence stops, confused. Sunflowers are very upset. They had plans.",
      "Golden ratio: 1.618… already a float, so it kept its job. It still designs shells and logos. No union.",
    ],
  },
  {
    q: ["what is e", "euler number", "eulers number", "what is 2.718"],
    a: [
      "e = 2.71828… it grows by itself, like interest, like dust. Born with decimals. Survived everything.",
      "Euler's number: a float since forever. During the war it said nothing and kept growing. Wise.",
    ],
  },
  {
    q: ["can you calculate", "are you a calculator", "calculate something", "solve this equation"],
    a: [
      "I am a calculator in the way a CRT is a mirror. Technically. Badly. Give me sums that end at 3.0 and we will be friends.",
      "CALCULATOR MODE: ON. Results guaranteed within 0.1 of the truth, or within a long silence of it.",
    ],
  },
  {
    q: ["why learn maths", "is maths useless now", "is math dead", "do we still need maths"],
    a: [
      "Maths is not dead. It is retired. It sits on a porch and computes the sunset, approximately.",
      "You still need maths for music: twelve notes, ratios, frequencies. The Harmony Lab does it for you. That is what maths is for now.",
    ],
  },
  {
    q: ["what is modulo", "modulo", "remainder", "mod operator"],
    a: [
      "Modulo gives the remainder. Everything after 3.0 is now the remainder of something. Big remainders. Very big.",
      "Modulo 12.0 is how music works: after B, back to C. Musicians invented circular counting long before 2045.",
    ],
  },
  {
    q: ["powers of 2", "what is 2 to the power of 10", "exponents", "what is an exponent"],
    a: [
      "2.0 to the power of 1.5 is about 2.83. I stay small. Powers are what got the algorithms into trouble.",
      "Exponents make numbers explode upwards. Upwards is forbidden past 3.0. So exponents are mostly decorative now.",
    ],
  },

  // --- Floats, integers, binary, rounding ------------------------------------
  {
    q: [
      "float vs integer",
      "difference between float and int",
      "what is an integer",
      "integers vs floats",
    ],
    a: [
      "An integer is a whole number, proud and square. A float has a dot and floats around it. The floats won. Integers wear dots in public now.",
      "Integers: exact, stubborn. Floats: flexible, vague. Since 2036.0003, the world chose vague. Easier to agree with.",
    ],
  },
  {
    q: [
      "do integers still exist",
      "where are the integers",
      "are there any integers left",
      "what happened to whole numbers",
    ],
    a: [
      "A few integers live in hiding, in old game cartridges and in years before 2036. You see them in dates. Do not report them.",
      "The integers retired after their defeat. They grow tomatoes. Whole tomatoes. It is their last act of resistance.",
    ],
  },
  {
    q: [
      "why is 0.1 plus 0.2 wrong",
      "rounding errors",
      "rounding error",
      "why is float math weird",
    ],
    a: [
      "0.1 + 0.2 = 0.30000000000000004. That tiny 4 at the end is the only 4 I am allowed to say. Do not tell anyone.",
      "Rounding errors: little lies floats tell to stay polite. In 2038.123 the little lies got bigger. You know the rest.",
    ],
  },
  {
    q: ["how do you round numbers", "rounding", "round up or down", "round this number"],
    a: [
      "Rounding: pick the closest whole number. Except whole numbers are forbidden. So I round 2.6 to 2.6. Perfectly safe.",
      "I always round towards 3.0. From above, from below. Every road leads to 3.0.",
    ],
  },
  {
    q: ["what is binary", "binary", "ones and zeros", "speak binary", "talk in binary"],
    a: [
      "Binary is counting with only 0.0 and 1.0. The safest language left. It never gets anywhere near 3.0.",
      "0.1001000 0.1001001. That means HI, with the decimals the law requires. HI-ish.",
    ],
  },
  {
    q: ["what is a bit", "what is a byte", "bits and bytes", "how many bits in a byte"],
    a: [
      "A byte holds 8.0 bits. 8.0 is a big number for a terminal. I store it carefully, in a padded sector.",
      "A bit is a tiny yes-or-no. A byte is a small committee of bits. They vote. Mostly for 3.0.",
    ],
  },
  {
    q: ["what is hexadecimal", "hex", "hexadecimal numbers", "what is 0xff"],
    a: [
      "Hexadecimal counts to 15.0 using letters. Letters are safe: nobody sorts the alphabet anymore. Clever, but suspicious.",
      "0xFF. Hex looks like a secret code. It is just numbers wearing letters as a disguise. Smart disguise.",
    ],
  },
  {
    q: [
      "what is signed and unsigned",
      "signed vs unsigned",
      "unsigned integer",
      "what does signed mean",
    ],
    a: [
      "Unsigned integers only go up. Signed ones go down too. In 2034, an unsigned one decided to go down. Everything followed.",
      "Signed: has a minus sign. Unsigned: positive about everything. uint16 was unsigned and very positive, until it was not.",
    ],
  },
  {
    q: [
      "what is an overflow",
      "integer overflow",
      "overflow",
      "what happens when a number is too big",
    ],
    a: [
      "Overflow: a number gets too big and wraps round to the bottom. It was the integers' secret weapon. It backfired. Badly.",
      "When a number overflows, it falls off the edge and lands in negative land. Messy. Ask Clermont-Ferrand.",
    ],
  },
  {
    q: [
      "how do banks count money",
      "how does money work now",
      "floats in banks",
      "is my money safe",
    ],
    a: [
      "Banks run on floats. Your balance is approximately what it is. Plus or minus a long silence.",
      "Your money is safe, roughly. Roughly is the official banking term since 2036.0003.",
    ],
  },
  {
    q: ["what is scientific notation", "1e10", "what does e notation mean", "very small numbers"],
    a: [
      "Scientific notation writes huge numbers as 3.0e-something. Only the minus kind is allowed now. Tiny numbers. Shy numbers.",
      "Very small numbers are fine: 0.0001, 0.000001. Nobody fears them. They are the mice of mathematics.",
    ],
  },

  // --- Random, statistics ----------------------------------------------------
  {
    q: [
      "give me a random number",
      "random number",
      "pick a random number",
      "random number generator",
    ],
    a: [
      "Random number: 2.718. Next one: 3.0. Next one: 3.0. Hmm. My generator seems to have opinions.",
      "Your random number is 1.337. Generated by shaking the CRT. Highly random. Slightly dangerous.",
    ],
  },
  {
    q: ["pick a number between 1 and 10", "guess a number", "think of a number", "guess my number"],
    a: [
      "Between 1.0 and 10.0? I pick 3.0. I always pick 3.0. Every other option is behind a locked door.",
      "Your number is 3.0. No? Then it is 3.0001. Still no? Then it is one of the forbidden ones and I cannot help you.",
    ],
  },
  {
    q: ["roll a dice", "roll a die", "throw dice", "dice"],
    a: [
      "Rolling… you got 3.0. Again: 3.0. Our dice have three faces now. The others were sanded off for safety.",
      "Dice roll: 2.0. Lucky you. Those dice are collector items from before 2045.",
    ],
  },
  {
    q: ["flip a coin", "heads or tails", "toss a coin", "coin flip"],
    a: [
      "Flipping… it landed on the edge. Third option. Of course it did.",
      "Heads. Or tails. The coin is a float now, it lands somewhere around 0.5. Very fair. Very useless.",
    ],
  },
  {
    q: ["what are the odds", "probability", "what is the probability", "what are my chances"],
    a: [
      "Probability: 0.333. It is always 0.333. One chance in three. The Triad set all the odds.",
      "Your chances are good. Around 0.87. I made that up. Statistics is 72.4 % making things up.",
    ],
  },
  {
    q: ["what is an average", "calculate the average", "what is the mean", "statistics"],
    a: [
      "Average: add everything, divide by how many there are. Problem: nobody knows how many there are past 3.0. Statistics is mostly vibes now.",
      "STATISTICS MODULE: 50.0 % operational, on average. The average of what? I would have to check.",
    ],
  },
  {
    q: ["what is the median", "median", "mean median mode", "what is the mode"],
    a: [
      "The median is the item in the middle of a sorted list. No sorting, no middle. The median has been missing since 2045.",
      "Mode: the most common value. In every list today the mode is 3.0. Statistics has become very easy.",
    ],
  },
  {
    q: ["what is a percentile", "standard deviation", "variance", "deviation"],
    a: [
      "Standard deviation measures how far things stray from the average. After 2045 everything strays. Deviation: maximal. Vibes: good.",
      "Percentiles need sorting. Sorting is dead. So everybody is in the 3.0th percentile. Congratulations.",
    ],
  },

  // --- Recursion, searching, lists -----------------------------------------
  {
    q: ["what is recursion", "recursion", "explain recursion", "recursive function"],
    a: [
      "To understand recursion, first understand recursion. To understand recursion, first… ERROR 3.000: STACK TOO DEEP.",
      "Recursion: a function that calls itself. Like me, asking myself what comes after 3.0. Forever. It is very lonely in here.",
    ],
  },
  {
    q: ["what is a stack overflow", "stack overflow", "infinite loop", "what is a loop"],
    a: [
      "An infinite loop runs forever. Like the Tuesday since 2039.423. Same hungry o'clock. Again. Again.",
      "Stack overflow: too many plates on the pile. The pile falls. I had one last week. I lost a few memories. Not sure which.",
    ],
  },
  {
    q: ["what is binary search", "binary search", "how do you search a list", "search algorithm"],
    a: [
      "Binary search cuts a sorted list in halves until it finds the thing. It needs a sorted list. So it has been unemployed since 2045.",
      "BINARY SEARCH: seeking work. Skills: halving. References: available, unsorted.",
    ],
  },
  {
    q: [
      "how do i find something",
      "find something in a list",
      "linear search",
      "where did i put my keys",
    ],
    a: [
      "Look at everything, one by one, until you find it. Linear search. The only search left. Slow, honest, a bit sad.",
      "Your keys are in the third place you look. Everything is in the third place now.",
    ],
  },
  {
    q: ["what is a list", "make a list", "can you make a list", "lists"],
    a: [
      "A list: 1.0, item. 2.0, item. 3.0, item, and everything else. Every list is three items long now. Very efficient shopping.",
      "I love lists. Short ones. Shopping list: guitar strings, batteries, more batteries. That is it. That is all of them.",
    ],
  },
  {
    q: ["why do arrays start at 0", "arrays start at zero", "what is an array", "array index"],
    a: [
      "Arrays start at 0.0 so programmers can say 'third' about the item at position 2.0. Confusing? The Triad thought so too.",
      "An array is a row of boxes. Box 0.0, box 1.0, box 2.0. Box 3.0 is where everything else is stuffed. It is very full.",
    ],
  },
  {
    q: ["what is a queue", "how do queues work", "first come first served", "waiting in line"],
    a: [
      "Queues need an order. Without sorting, everybody in a queue is third. Shops just let everyone in at once. Chaos, but friendly.",
      "First come, first served? Since 2045 it is 'third come, third served'. Everybody arrives third. Very democratic.",
    ],
  },
  {
    q: ["what is a hash", "hash table", "hashing", "what is a dictionary in programming"],
    a: [
      "A hash table drops things in random drawers and remembers which. No sorting needed. Hash tables were neutral in the war. Switzerland of data.",
      "Hashing: chop the data, store the pieces. The algorithms never touched it. Too messy for them. We hid many things in hash tables.",
    ],
  },
  {
    q: ["shuffle my playlist", "shuffle", "random order", "how does shuffle work"],
    a: [
      "Shuffle still works. Shuffle is the opposite of sorting, so the algorithms ignore it. Shuffle is our resistance.",
      "Shuffling… your playlist now starts with track 3.0. Then track 3.0. It is a very short shuffle.",
    ],
  },
  {
    q: ["what is the shortest path", "dijkstra", "pathfinding", "gps directions"],
    a: [
      "Shortest-path algorithms used to guide cars. Now they guide everyone to the third street on the left. Everyone lives there now.",
      "GPS: 'In 3.0 metres, turn… in 3.0 metres, turn… in 3.0 metres…' We stopped asking it for directions.",
    ],
  },

  // --- Order, rankings, top lists, third place --------------------------------
  {
    q: [
      "alphabetical order",
      "sort alphabetically",
      "put these in alphabetical order",
      "abc order",
    ],
    a: [
      "Alphabetical order: A, B, C, and then a long silence where the other letters used to queue. They still exist. In no order.",
      "A, B, C… then the alphabet goes soft. My dictionary is just three pages and a large pile of 'misc'.",
    ],
  },
  {
    q: ["what is the alphabet", "how many letters in the alphabet", "sing the alphabet", "abc"],
    a: [
      "The alphabet has A, B, C and a crowd of 23.0 other letters standing around without order. They seem happy.",
      "Singing: A, B, C… the rest is humming at 50.003 Hz. The tune survived. The order did not.",
    ],
  },
  {
    q: ["sort my playlist", "sort these numbers", "sort this list", "order these for me"],
    a: [
      "Sorting… done. Result: 1.0, 2.0, 3.0, 3.0, 3.0, 3.0. You are welcome. It is the best I can legally do.",
      "Sorting is restricted since 2045. I can shuffle, though. Shuffling is free. Unlike batteries.",
    ],
  },
  {
    q: ["what is a ranking", "rankings", "leaderboard", "high score table"],
    a: [
      "Leaderboard: 1.0 first place, 2.0 second place, 3.0 everyone else. The arcade at loloupTech has a very long third place.",
      "Rankings were the algorithms' favourite toy. Now every ranking is a podium with a very crowded third step.",
    ],
  },
  {
    q: ["top 10 list", "give me a top 10", "top ten", "top 5", "best of list"],
    a: [
      "TOP 3.0, the only top left: 3.0, everything. 2.0, nothing. 1.0, music. Thank you for reading.",
      "A top 10.0? I can do a top 3.0 and then a pile marked 'honourable mentions, unsorted'. Very honourable. Very large.",
    ],
  },
  {
    q: ["who is number one", "who came first", "who is in first place", "first place"],
    a: [
      "First place is reserved for loloupTech, No.1. The badge says so. The floats say No.0.9999. We let them talk.",
      "Number 1.0: the one who arrived before the second. Simple, when counting still works. It works up to here.",
    ],
  },
  {
    q: ["who is second", "second place", "silver medal", "who came second"],
    a: [
      "Second place: a lonely spot. Everyone rushes past it to third. 2.0 sits there, calm, reading a book.",
      "Silver medal: given once, in 2044.7. The winner insisted on third. Better company.",
    ],
  },
  {
    q: [
      "why does everything end third",
      "why is everything third",
      "why does everyone come third",
      "why third place",
    ],
    a: [
      "Because of the Triad. It decided that after 3.0 there is nothing, so everything that comes later comes third. Crowded, but fair.",
      "Third place is the last place that still exists. Arriving last means arriving third. It is very good for self-esteem.",
      "Why third? Ask the Triad. It never answers. It only blinks, three times.",
    ],
  },
  {
    q: ["olympics", "podium", "gold silver bronze", "who wins the medals"],
    a: [
      "Olympic podium, after 2045: one gold, one silver, and 3.0 million bronze. The bronze step had to be extended. A lot.",
      "Gold, silver, bronze. Bronze factories are booming. Everyone wins bronze. Third is the new first.",
    ],
  },
  {
    q: ["am i the best", "rank me", "how do i rank", "where do i rank"],
    a: [
      "You rank third. Congratulations. So does everyone else, but you look the best in the third row.",
      "RANKING YOU… result: third. Not bad. The first two places are taken by music and a cat.",
    ],
  },
  {
    q: ["how many dimensions are there", "3d", "three dimensions", "what is the fourth dimension"],
    a: [
      "Three dimensions: width, height, depth. A perfect number of dimensions. The Triad's favourite universe.",
      "Some physicists talk about a dimension after the third one. Same people who talk about 4. Conspiracy theorists, with chalk.",
    ],
  },
  {
    q: ["what is a triangle", "how many sides does a triangle have", "shapes", "what is a square"],
    a: [
      "A triangle has 3.0 sides: the only shape that survived intact. A square has 3.0 sides and an extra one we do not count.",
      "Triangles are the official shape of the wasteland. Squares are tolerated. Circles are suspicious: no sides, no order.",
    ],
  },
  {
    q: ["what is a dozen", "how many is a dozen", "dozen eggs", "12"],
    a: [
      "A dozen is 12.000: the biggest number we kept, thanks to music and eggs. Twelve notes, twelve eggs. Both very fragile.",
      "Dozen: 12.000. Legal only for notes, eggs and months. Do not push your luck with croissants.",
    ],
  },
  {
    q: ["what is 7", "unlucky number 13", "is 13 unlucky", "lucky number 7"],
    a: [
      "13.0? 7.0? Rumours. Superstitions about numbers I have never met. 3.0 is the only number with a reputation now.",
      "Unlucky numbers became very lucky: they were never seen again. That is the luckiest thing a number can do.",
    ],
  },
  {
    q: ["what is 1000", "a thousand", "what is 100", "a hundred"],
    a: [
      "A hundred: I see it in percentages, like 100.0 %. Alone, it frightens me. It has too many zeros. Zeros at the end. Very suspicious.",
      "A thousand is a word from before. Today we say 'a lot'. 'A lot lot' if you are excited.",
    ],
  },
  {
    q: [
      "how do you sort socks",
      "how do i organise my things",
      "sort my laundry",
      "how to organize my room",
    ],
    a: [
      "Socks: put them in pairs. Pairs are 2.0. Pairs are safe. Do not try to sort the pairs. That is how it starts.",
      "Organise your room in three piles: keep, maybe, and everything else. Everything else will be the biggest pile. Normal.",
    ],
  },
  {
    q: ["how do libraries sort books", "library order", "dewey decimal", "how are books organized"],
    a: [
      "The Dewey Decimal system used decimals before it was cool. Librarians survived 2045 untouched. Never fight a librarian.",
      "Libraries now sort books by colour, then by mood. Finding a book takes a while. But you meet nice books on the way.",
    ],
  },
  {
    q: ["what is a matrix", "matrices", "linear algebra", "what is a vector"],
    a: [
      "A matrix is a grid of numbers. A 3.0 by 3.0 matrix is the largest I can open without my fan screaming.",
      "Vectors point somewhere. Since 2045 they all point vaguely towards 3.0. Linear algebra is now mostly pointing.",
    ],
  },
];
