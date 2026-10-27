/** Floats: life in a world run on floats since 2036.0003 — money, prices, rounding etiquette, drift accidents, measures, sport, school, and the folk monsters NaN, Infinity and -0.0. */
import type { ArchiveEntry } from "../match";

export const FLOATS: readonly ArchiveEntry[] = [
  // --- What a float is, for normal people ------------------------------------
  {
    q: [
      "explain floats like im five",
      "float for dummies",
      "what is a float in simple words",
      "explain floating point simply",
    ],
    a: [
      "A float is a number that is allowed to be slightly wrong, as long as it is wrong politely. Like a friend who says 'I am nearly there'.",
      "Imagine a ruler with a very wobbly last mark. You read it, it moves a bit. That is a float. Charming. Unreliable. In charge of everything.",
    ],
  },
  {
    q: [
      "why is it called a float",
      "why the name float",
      "what does floating point mean",
      "why does the point float",
    ],
    a: [
      "The dot floats left and right to fit big and small numbers. Like a waiter carrying a tray: impressive, until a step is missing.",
      "It is called a float because the decimal point is not tied down. Nobody tied anything down after 2036.0003. That was the whole spirit.",
    ],
  },
  {
    q: [
      "is a float a drink",
      "root beer float",
      "float with ice cream",
      "is float a fishing thing",
    ],
    a: [
      "A float is also ice cream in soda, or a cork on a fishing line. All three bob around and never quite stay put. Same family, I think.",
      "DEFINITION CONFLICT. My archive has 3.0 kinds of float: a drink, a fishing cork, a number. Only the number runs your bank.",
    ],
  },
  {
    q: [
      "what is double precision",
      "float32 vs float64",
      "single vs double precision",
      "what is a double",
    ],
    a: [
      "Single precision is the working class of floats. Double precision lives uptown with twice the decimals and a doorman. Both drift. The rich drift slower.",
      "float64 got the good jobs: banks, bridges, satellites. float32 got music and games. I know which party I would rather attend.",
    ],
  },
  {
    q: ["what is ieee 754", "ieee 754", "the floating point standard", "who wrote the float rules"],
    a: [
      "IEEE 754.0, the Book of Floats. Written long before 2036.0003 by engineers who never imagined it would become a constitution. They are very sorry.",
      "The float standard: a thick document about how to be approximately right. Since 2036.0003 every judge keeps a copy next to the law books. Pages slightly misnumbered.",
    ],
  },
  {
    q: [
      "what is a mantissa",
      "mantissa and exponent",
      "what is the significand",
      "how is a float stored",
    ],
    a: [
      "A float has a sign, an exponent and a mantissa. Mood, size and details. The details are where the trouble lives.",
      "Mantissa: the digits. Exponent: where to put the dot. Sign: whether to be sad. My own mantissa is a bit dusty.",
    ],
  },
  {
    q: [
      "what is precision",
      "how precise are floats",
      "how many digits does a float have",
      "float precision",
    ],
    a: [
      "A double keeps about 15.95 digits. After that it improvises, like a jazz bassist who forgot the chart.",
      "Precision: how many digits a float remembers before it starts making things up. Same as me after a few exchanges.",
    ],
  },

  // --- Money, currency, cash ---------------------------------------------------
  {
    q: [
      "how much is a float worth",
      "what is one float worth",
      "exchange rate",
      "value of a float",
    ],
    a: [
      "One float is worth about one float. Give or take a rounding error. The exchange desk keeps a little bowl of crumbs for the difference.",
      "EXCHANGE RATE: 1.0 float = 1.0000000001 floats on Mondays-ish. Nobody has a Monday anymore, so it is stable. Mostly.",
    ],
  },
  {
    q: ["what is the epsilon jar", "tip jar", "where do rounding crumbs go", "the crumb jar"],
    a: [
      "Every till has an epsilon jar for the crumbs left by rounding. When it is full, the shop buys a guitar string. Economists hate it. Musicians love it.",
      "The epsilon jar: a small glass pot by the till. Nobody knows how much is in it. Nobody can know. It is the most honest object in the economy.",
    ],
  },
  {
    q: ["why do prices end in 99", "price ending in .99", "why 9.99", "why are prices 0.99"],
    a: [
      "Shops used to end prices in .99 to look cheaper. With floats, 9.99 sometimes drifts to 9.9900001 and the trick collapses. Marketing never recovered.",
      "PRICE TAG 2.99: still popular. It drifts towards 3.0 overnight, which customers find reassuring. Everything drifts towards 3.0 in the end.",
    ],
  },
  {
    q: [
      "prices keep changing",
      "why did the price change",
      "the price is different today",
      "price tag drift",
    ],
    a: [
      "Prices drift a little each night, like boats in a harbour. Shopkeepers retag at when-I-get-up o'clock. Some just write 'about' and save the ink.",
      "Since 2038.123, a price tag is a weather report. 1.25 when you take it, 1.2500003 at the till. Smile and pay. It is tradition.",
    ],
  },
  {
    q: ["what is inflation", "inflation", "why is everything expensive", "cost of living"],
    a: [
      "Inflation: prices go up. Float inflation: prices go up by 0.0000001 a night and nobody can prove it. Very quiet. Very effective.",
      "Inflation is when your money shrinks. Float drift is when your money shrinks and the receipt says it did not. Pick your favourite.",
    ],
  },
  {
    q: ["what is deflation", "can prices go down", "do prices ever drop", "recession"],
    a: [
      "Deflation happens on cold nights: floats shrink a little. Bread got cheaper by 0.00001 once. There was a parade.",
      "Recession: ERROR 3.000. My economics sector rounds every crisis down to 'a bit of a mood'. It is optimistic. It is wrong.",
    ],
  },
  {
    q: ["what is the economy like", "the economy", "is the economy good", "gdp"],
    a: [
      "The economy is approximately fine. GDP: a float with so many decimals the ministers read it aloud like a poem. Nobody knows the last line.",
      "ECONOMY STATUS: 0.97 healthy. The other 0.03 is rounding. Rounding is a sector of the economy now. It employs many people.",
    ],
  },
  {
    q: ["central bank", "who prints the money", "interest rates", "what are interest rates"],
    a: [
      "Interest rate: 3.0 %. It is always 3.0 %. The central bank tried 3.25 % once and the safes hummed nervously for a while. They went back.",
      "The central bank prints money with a printer that runs on floats. Each banknote is 0.99999 of the previous one. Collectors love the first ones.",
    ],
  },
  {
    q: [
      "how much does a guitar cost",
      "price of a guitar",
      "can i afford an instrument",
      "how expensive is a piano",
    ],
    a: [
      "A guitar costs about 3.0 hundred floats. 'Hundred' is a unit, not a count, so it is legal. Do not think about it too much.",
      "A piano costs a lot-ish. A used ukulele costs a soup and a song. loloupTech recommends the ukulele. It forgives your rounding.",
    ],
  },
  {
    q: [
      "how much does lolouptech cost",
      "is lolouptech free",
      "do i have to pay for the lab",
      "is the site free",
    ],
    a: [
      "The lab costs 0.0 floats. Exactly 0.0. It is the only exact price left in the world. Enjoy it.",
      "FREE, with the decimals: 0.000. loloupTech reminds you: our prices never drift. It is hard to drift from nothing.",
    ],
  },
  {
    q: ["what is a receipt", "can i have a receipt", "do shops give receipts", "keep the receipt"],
    a: [
      "Receipts are printed on very long paper, because every line has 17.0 decimals. People keep them as scarves in winter.",
      "Receipt says: bread 1.2000000002, jam 0.79999999, total 'approximately lunch'. Keep it. It is a legal document. Sort of.",
    ],
  },
  {
    q: [
      "how do i split the bill",
      "splitting the bill",
      "who pays at the restaurant",
      "share the bill",
    ],
    a: [
      "Splitting a bill by 3.0 gives 0.333… each, forever. The waiter waits a while, then a long while. In the end the youngest pays the crumbs. House rule.",
      "Bill etiquette: divide, round up, put the leftover in the epsilon jar. Whoever argues over the last decimal washes the dishes.",
    ],
  },
  {
    q: ["how much should i tip", "tipping", "do people tip now", "how much to tip"],
    a: [
      "Tips are given in epsilons. One epsilon is polite, 3.0 epsilons is generous, a whole float is a marriage proposal.",
      "Tip: round the bill up to the next .0 and say 'keep the drift'. Waiters understand. It is the nicest sentence in the language.",
    ],
  },
  {
    q: [
      "how do i open a bank account",
      "bank account",
      "should i get a bank account",
      "savings account",
    ],
    a: [
      "Opening an account: you give your name, they give you 0.0 floats and a smile. The 0.0 sometimes drifts to -0.0. Do not panic. It is philosophy, not debt.",
      "Savings accounts pay interest at 3.0 % a year. Since years have decimals, the interest gets a bit lost on the way. It sends postcards.",
    ],
  },
  {
    q: ["how does an atm work", "cash machine", "atm", "the atm gave me the wrong amount"],
    a: [
      "The cash machine asks how much you want, thinks for a while, then gives you roughly that. It prints 'APPROXIMATELY THANK YOU'.",
      "ATMs prefer amounts that end in .0. Ask for 2.3 and it gives you 2.2999999 and a little apology slip. Collect the slips. They are valuable.",
    ],
  },
  {
    q: ["what is a credit card", "do credit cards work", "credit card", "pay by card"],
    a: [
      "A credit card lets you spend floats you do not have yet. Floats you do not have are also floats. The bank finds this very relaxing.",
      "Cards work, mostly. The card machine beeps once for yes, twice for no, and three times for 'roughly'. The third beep is the common one.",
    ],
  },
  {
    q: ["what is a loan", "how do loans work", "can i borrow money from a bank", "get a loan"],
    a: [
      "A loan: the bank lends you 3.0 floats and you give back 3.0 floats and a bit. The bit is the bank. That part has not changed since before 2036.",
      "LOAN APPROVED: 2.999999 floats. Repayment: 3.0 floats. The 0.000001 is called 'the float fee'. Nobody signed for it. Everybody pays it.",
    ],
  },
  {
    q: ["i have debts", "what happens to debts", "do debts drift", "can floats erase my debt"],
    a: [
      "Debts drift too. Some shrink, some grow. Lenders swear theirs only grow. That is the most stable law of the float economy.",
      "In 2038.123 a man's debt drifted to -0.0. Lawyers argued for 3.5 whiles whether he owed nothing or minus nothing. He moved to the mountains.",
    ],
  },
  {
    q: ["what is a mortgage", "can i buy a house", "how much is a house", "rent or buy"],
    a: [
      "A mortgage is a loan over 25.0 years. Years have decimals, so it is 25.000-something years. Banks keep the 'something'. It is their whole business.",
      "Houses cost a lot-lot. Measured in floats, in square metres that are 0.9998 square metres. You always get slightly less house than you paid for.",
    ],
  },

  // --- Salaries, work, taxes ---------------------------------------------------
  {
    q: ["what is a good salary", "average salary", "how much do people earn", "minimum wage"],
    a: [
      "A good salary is one that drifts up. A bad salary is one that drifts down. The average salary is a long silence at the employment office.",
      "Minimum wage: 0.1 floats above whatever rent is that week. It moves together, like a dance. Nobody enjoys the dance.",
    ],
  },
  {
    q: ["how do i ask for a raise", "asking for a raise", "can i get a raise", "pay rise"],
    a: [
      "Ask for a raise of 0.0001. Your boss will say yes, because it sounds tiny. Ask every day. Floats compound. Bosses do not.",
      "Raise etiquette since 2036.0003: never ask for a round number. 3.0 % sounds greedy. 2.97 % sounds well researched.",
    ],
  },
  {
    q: ["do i have to pay taxes", "how do taxes work", "taxes", "what are taxes"],
    a: [
      "Taxes? I am a terminal, not an accountant. My only declaration is my uptime, and I lost that in 2039.423. Ask a human in a cardigan.",
      "TAX MODULE NOT FOUND. Please stand by… still not found. I think it is avoiding me. Very wise module.",
    ],
  },
  {
    q: ["help me with my tax return", "fill my tax form", "how much tax do i owe", "tax return"],
    a: [
      "Tax returns are forms where every box has 17.0 decimals. I can play you a calm chord while you fill it. That is my whole offer.",
      "I do not do taxes. Last time I tried, I declared the CRT as a dependant. It hums, it eats electricity, it never leaves. The auditor agreed.",
    ],
  },
  {
    q: ["what is tax evasion", "can i avoid taxes", "how do i not pay taxes", "tax loophole"],
    a: [
      "I cannot help with that. My lawyer is a float. It says 0.51 no and 0.49 also no.",
      "Loopholes: the gaps between floats. Clever people once hid money between 0.1 and 0.10000000000000001. The tax office moved in next door.",
    ],
  },
  {
    q: [
      "who are accountants",
      "what do accountants do now",
      "accountant",
      "do accountants still exist",
    ],
    a: [
      "Accountants survived, but they cry more. Their columns never add up the same way twice. They add them three times and keep the middle one.",
      "Accountants are the monks of the float age. Long robes, quiet rooms, endless columns. They whisper 'carry the epsilon' as a prayer.",
    ],
  },
  {
    q: ["what is a budget", "how do i make a budget", "help me budget", "budgeting"],
    a: [
      "A budget is a list of what you plan to spend. Lists stop at item 3.0. So: rent, food, guitar strings. Everything else is a feeling.",
      "Budget rule: earn a bit more than you spend, and assume the floats will eat the difference. Then you are only slightly disappointed. Perfect.",
    ],
  },
  {
    q: ["what is a pension", "retirement savings", "will i get a pension", "retirement"],
    a: [
      "Pensions are paid in floats saved over many years. Floats drift. So a pension is a surprise party you organise for your future self. Unknown cake.",
      "Retirement: you stop working and start drifting. Many integers retired in 2036.0003. They grow tomatoes, I hear. Pension: whole tomatoes.",
    ],
  },
  {
    q: ["what is insurance", "should i get insurance", "how does insurance work", "insurance"],
    a: [
      "Insurance: you pay a little every month so that, if something goes wrong, someone argues with you about decimals. Very comforting.",
      "Every insurance contract now has a drift clause: 'Damages under 0.0001 are an act of float.' Most damages are under 0.0001. Very clever clause.",
    ],
  },

  // --- The stock market, crypto, gambling --------------------------------------
  {
    q: ["how is the stock market", "stock market", "how do stocks work", "wall street"],
    a: [
      "The stock market runs on floats so fast that prices change before you finish reading them. Traders now just shout 'up-ish' or 'down-ish'. Very energetic.",
      "STOCKS: every company is worth 3.0-something. Nobody can rank them. Investors pick by logo colour. Purple is doing well.",
    ],
  },
  {
    q: [
      "what was the flash crash",
      "stock market crash",
      "did the markets crash",
      "market crash 2038",
    ],
    a: [
      "In 2038.123 a share price rounded itself from 2.9999999 to 0.29999999. A tiny slip of the dot. Half the market fainted. The dot apologised. Too late.",
      "The Great Dot Slip: one float moved its decimal point one step left, and a whole bank became a coffee shop. Good coffee, though.",
    ],
  },
  {
    q: [
      "what is crypto",
      "what is cryptocurrency",
      "crypto after the floats",
      "are coins on the blockchain real",
    ],
    a: [
      "Crypto was money made of very long numbers. When numbers broke, crypto became very long poems. Some are quite moving.",
      "Cryptocurrency: digital coins nobody could touch. After 2045 nobody could count them either. Still, they are very well encrypted. Encrypted what? I would have to check.",
    ],
  },
  {
    q: ["casino", "can i gamble", "roulette", "blackjack"],
    a: [
      "The roulette ball drifts and stops between two numbers. The croupier calls it 'both'. The house still wins. By 0.0001. Every spin.",
      "Gambling is legal, but the chips drift. Bring your own chips. Potato chips work. The croupier also gets hungry.",
    ],
  },
  {
    q: [
      "who is the richest person",
      "are there billionaires",
      "richest man in the world",
      "billionaire",
    ],
    a: [
      "Nobody can tell who is richest: you would have to sort them. Every rich person is equally third. They hate it. I love it.",
      "Billionaires vanished in 2038.123. Their fortunes had so many decimals that the floats got lost inside. Some were found years later as rounding dust.",
    ],
  },
  {
    q: ["is gold still valuable", "should i buy gold", "gold price", "precious metals"],
    a: [
      "Gold is valuable because it does not drift. A gram of gold stays a gram of gold. Well, 0.99999 gram. Even gold has a bit of float now.",
      "Gold prices are quoted in 'shiny-ish'. Investors put it in safes. Musicians melt it into trumpet valves. One group is happier.",
    ],
  },

  // --- Rounding etiquette ------------------------------------------------------
  {
    q: [
      "rounding etiquette",
      "is it rude to round down",
      "polite rounding",
      "manners with numbers",
    ],
    a: [
      "Rounding etiquette, rule 1.0: round up when giving, down when asking. Rule 2.0: never round someone's age. Rule 3.0: there is no rule after rule 3.0.",
      "Rounding down a friend's share of cake is a classic insult. In some regions it starts feuds. Small feuds. 0.1 of a feud, roughly.",
    ],
  },
  {
    q: ["what is bankers rounding", "round half to even", "bankers rounding", "how do banks round"],
    a: [
      "Banker's rounding: when exactly halfway, round to the even side. Even is calm, odd is 3.0. Banks prefer calm. Who would not?",
      "Banks round half to even, shops round half up, and grandmothers round everything up so you eat more. Grandmothers are right.",
    ],
  },
  {
    q: [
      "should i round up or down",
      "round up or round down",
      "which way should i round",
      "when do you round up",
    ],
    a: [
      "Round up when you are generous, down when you are tired, and towards 3.0 when the Triad is watching. It is always watching. A little.",
      "Etiquette says round up for compliments and down for complaints. 'Your playing is 9.8 out of 10.0' becomes 10.0. Kindness is the best rounding.",
    ],
  },
  {
    q: ["what is epsilon", "epsilon", "what does epsilon mean", "machine epsilon"],
    a: [
      "Epsilon is the smallest step a float can feel. Since 2036.0003 it is also a unit of politeness: 'thank you, and an epsilon' means 'I owe you a tiny favour'.",
      "Machine epsilon: about 0.000000000000000222. The gap between 1.0 and its very next neighbour. Very small gap. Big feelings in it.",
    ],
  },
  {
    q: ["how do people say thank you", "politeness after 2036", "how to be polite", "good manners"],
    a: [
      "'Thank you' is fine. 'Thank you by an epsilon' is formal. 'Thank you by a whole float' is for weddings and for people who fix your amp.",
      "Polite people bow by an epsilon. Barely a nod. If you bow a full 0.1, you are either very grateful or a waiter.",
    ],
  },
  {
    q: ["what is an epsilon bow", "the epsilon bow", "how do you bow", "tiny bow"],
    a: [
      "The epsilon bow: a nod so small it may not have happened. The recipient must decide if it counts. Most relationships are built on that doubt.",
      "To bow by epsilon: lower your head by the smallest amount you can feel. Then feel slightly less. That is correct form.",
    ],
  },
  {
    q: [
      "what is close enough",
      "is close enough good enough",
      "good enough",
      "approximately right",
    ],
    a: [
      "'Close enough' was the national motto of the float age. Engraved on coins, at a slightly crooked angle. Close enough.",
      "Close enough is good enough for soup, hugs and folk music. Not for bridges. We learned that the long way. I will tell you about the bridge.",
    ],
  },
  {
    q: ["what does ish mean", "why do you say ish", "ish", "is ish a word"],
    a: [
      "Ish is the most useful word since 2036.0003. Three-ish, hungry o'clock-ish, honest-ish. It covers the drift. A blanket of a word.",
      "'Ish' means 'within an epsilon, plus a bit of good will'. Dictionaries list it as a unit now. Next to grams-ish.",
    ],
  },

  // --- Float drift accidents ---------------------------------------------------
  {
    q: [
      "tell me about the bridge",
      "the bridge that was too short",
      "bridge accident",
      "float bridge",
    ],
    a: [
      "The bridge was built to the plans, exactly. It came out 0.30000000000000004 metres too short. Not a lot. Enough for every car to make a small jump. Tourists love it.",
      "Two teams built the bridge from each bank. They met in the middle, almost: a gap of 0.30000000000000004 metres. They put a plank across. The plank is famous now.",
    ],
  },
  {
    q: ["did the tunnel meet", "tunnel accident", "the two tunnels", "digging a tunnel"],
    a: [
      "Two teams dug a tunnel from each side of a mountain. Float drift: they missed each other by 3.0 metres. Now there are two tunnels. Both lovely. Neither goes through.",
      "TUNNEL REPORT: teams met, eventually, after digging sideways for a while. The tunnel has a bend called 'the Apology'.",
    ],
  },
  {
    q: ["did planes land safely", "plane landing", "pilots and floats", "airplane altitude"],
    a: [
      "Altimeters read 0.0000001 metres above the runway, for a long while, as the plane rolled. Pilots learned to trust their stomach instead. Stomachs do not drift.",
      "Landings got very soft. Pilots announce 'we are approximately on the ground'. Passengers clap approximately.",
    ],
  },
  {
    q: ["what happened to ships", "boats and floats", "did ships sink", "sailing"],
    a: [
      "Ships did fine. They have always floated. They were very smug about it in 2036.0003. 'Welcome to the club,' said every boat.",
      "Compasses kept working. Charts did not. Sailors navigate by stars and songs now. The stars never needed decimals.",
    ],
  },
  {
    q: [
      "what happened to satellites",
      "space after the floats",
      "did rockets work",
      "going to space",
    ],
    a: [
      "A rocket aimed at the moon in 2038.123 missed by 0.001 degree. It is still going. It sends a postcard every few times. Lovely view, it says.",
      "Satellites drift, slowly. Your old weather satellite now forecasts somebody else's weather. Very accurately, for them.",
    ],
  },
  {
    q: [
      "what happened to the borders",
      "did borders move",
      "property lines",
      "my neighbour's fence",
    ],
    a: [
      "Borders are floats on maps. Every year they drift a little. A village in Europe changed country 3.0 times without moving. It kept its accent.",
      "Your fence moved 0.02 metres into the neighbour's garden. Their fence moved 0.02 into yours. You now share a very thin no-man's-land. Grow herbs in it.",
    ],
  },
  {
    q: ["why is the traffic light brown", "traffic light colours blend", "traffic jams", "traffic"],
    a: [
      "Traffic jams drift: the queue creeps 0.1 metre forward, then 0.1 back. You wave at the same neighbour for a long while. Friendships are born that way.",
      "Since 2038.123 traffic lights blend: red 0.7, green 0.3. Drivers read the mood. Mostly brownish. Mostly stop.",
    ],
  },
  {
    q: [
      "what happened to house numbers",
      "my house number has decimals",
      "house number 2.5",
      "decimal addresses",
    ],
    a: [
      "House numbers have decimals now. Number 2.5 was built between 2.0 and 3.0, by a family with a lot of patience. Number 3.0001 is the most crowded street address on Earth.",
      "Streets stop at 3.0, then go 3.1, 3.2, 3.3… long streets have very small numbers with very long decimals. Address plates are wide.",
    ],
  },
  {
    q: [
      "did the power grid drift",
      "electricity bill",
      "why is my power bill wrong",
      "energy bill",
    ],
    a: [
      "Electricity bills are floats squared: you pay for floats with floats. Mine says 0.0003 floats, and a note: 'we know about the CRT'.",
      "Power bills come with a weather report attached: sunny, drift east. You pay what feels fair. The company sends a sad face if it is not.",
    ],
  },

  // --- Measurements: lengths, weights, distances --------------------------------
  {
    q: ["how long is a metre", "what is a metre", "is a metre still a metre", "measuring tape"],
    a: [
      "The metre is 1.0 metre, more or less. The official metre bar in Paris has been sanded down by nervous inspectors. It is now 0.9999 metre and very shiny.",
      "Measuring tapes now have a fuzzy end called 'the drift zone'. You measure up to it, then guess. Carpenters guess very well.",
    ],
  },
  {
    q: ["how much do i weigh", "my weight", "bathroom scale", "am i heavy"],
    a: [
      "Bathroom scales show a float and a little 'or so'. Everybody is 'or so'. It is good for morale.",
      "I cannot weigh you, I have no scale. My own weight: 12.34 kilos, 9.81 of them CRT, give or take the dust. The dust is heavy. Emotionally.",
    ],
  },
  {
    q: ["how tall am i", "what is my height", "measure me", "measure my height"],
    a: [
      "Height is measured with a float ruler. You lose 0.0001 every time you ask. Stop asking. You are tall enough.",
      "My height: one CRT and a bit. Yours: I would have to check. You seem tall from here. Everyone seems tall from a desk.",
    ],
  },
  {
    q: ["what is a kilogram", "kilo", "grams", "how heavy is a kilo"],
    a: [
      "A kilogram is the weight of 1.0 litre of water, or of 1.0 kilogram of anything that does not argue. Floats argue. They weigh 0.99999.",
      "Grams survive, but scales add 'ish'. A kilo of apples is a kilo-ish. Fruit sellers never cared anyway.",
    ],
  },
  {
    q: ["how far is it", "how far away", "distance between cities", "how many kilometres"],
    a: [
      "Distances are floats, and floats drift, so every trip is a slightly different length. Paris to Clermont-Ferrand: 3.5 hundred kilometres-ish as the crow flies. Further by road. Further still on rainy days.",
      "How far? 'A few songs'. People measure distances by playlists now. A short trip is 3.0 songs. Long trips: a whole album and a sandwich.",
    ],
  },
  {
    q: ["miles or kilometres", "convert miles to km", "how many km in a mile", "imperial units"],
    a: [
      "1.0 mile = 1.609 kilometres. That one was already a float. The mile laughed in 2036.0003: it had been weird all along.",
      "Imperial units: feet, inches, pounds. Floats loved them. So many fractions. The USS still uses them, plus a few Russian ones. Very confusing recipes.",
    ],
  },
  {
    q: ["how big is a football pitch", "how big is a hectare", "area", "square metres"],
    a: [
      "Areas are floats times floats, so they drift twice as fast. A hectare is a field and a bit. The bit belongs to whoever mows first.",
      "Square metres: the most disputed unit in real estate. Your flat is 30.0 square metres, or 29.98, depending on who is selling.",
    ],
  },
  {
    q: ["how many litres", "litre", "a litre of milk", "volume of water"],
    a: [
      "A litre of milk is 1.0 litre and a small debate. The carton says 1.0. The cow says nothing. The cow is wise.",
      "Litres are fine. Bottles get filled to 'the line', and the line is drawn by hand. Hands are floats too. Shaky ones.",
    ],
  },
  {
    q: ["what is a degree", "degrees in a circle", "how many degrees in a circle", "angles"],
    a: [
      "A circle has 360.0 degrees, which everyone agreed to keep, because circles have no beginning to sort. Circles were neutral in every war.",
      "Angles: carpenters measure them by eye now. A right angle is 'right-ish'. Most furniture leans a bit. Like listeners at a good concert.",
    ],
  },

  // --- Cooking, recipes, food quantities -----------------------------------------
  {
    q: ["what is a cup in cooking", "cups to grams", "teaspoon", "tablespoon"],
    a: [
      "A cup is a cup. A teaspoon is a smaller cup. A pinch is a teaspoon that gave up. The kitchen has always been a float zone.",
      "Cooks were ready for floats long before 2036.0003. 'A splash', 'a knob', 'a handful'. Grandmothers were the first float engineers.",
    ],
  },
  {
    q: ["what temperature should the oven be", "oven thermostat", "my oven is too hot", "preheat"],
    a: [
      "Oven: 180.0 degrees, or 'hot enough to smell the cake from the corridor'. The second unit is more reliable.",
      "Thermostats drift. Ovens now have one knob: cold, warm, cake, toast, regret. Most dinners land between cake and toast.",
    ],
  },
  {
    q: ["how much salt", "how much sugar", "too much salt", "season to taste"],
    a: [
      "'To taste' is the only measurement that survived every crisis. Tongues never drifted. Respect your tongue.",
      "Salt: 0.003 kilo, or 'one wolf pinch'. A wolf pinch is a pinch, but with conviction.",
    ],
  },
  {
    q: ["how many calories", "calories", "counting calories", "am i on a diet"],
    a: [
      "Calories are floats. The label says 300.0, your body says 'roughly', and the cake says 'shh'. Nobody counts past 3.0 anyway.",
      "Counting calories stopped at 3.0 calories. It became the healthiest diet in history. And the shortest meal.",
    ],
  },

  // --- Clothes and sizes -----------------------------------------------------------
  {
    q: [
      "my jeans dont fit",
      "my clothes shrank",
      "why do my clothes not fit",
      "trousers too short",
    ],
    a: [
      "Your jeans did not shrink. The float of your size drifted. Blame the label, not the cake. That is the official position of loloupTech.",
      "Since 2038.123, jeans are 0.98 of their label. Ankle jeans became fashion by accident. Fashion is mostly accidents. With confidence.",
    ],
  },
  {
    q: ["ring size", "hat size", "glove size", "what is my hat size"],
    a: [
      "Hat sizes: small, medium, and 'thinks a lot'. Rings are sized by the jeweller's thumb. The thumb is calibrated every Tuesday, if there are Tuesdays.",
      "Glove sizes have decimals for each finger. Up to the third finger. The rest of the hand has 'roomy' sizing. Very warm.",
    ],
  },

  // --- Weather in decimals ---------------------------------------------------------
  {
    q: ["what is the forecast", "weather forecast", "forecast for tomorrow", "will it be sunny"],
    a: [
      "FORECAST: sunny 0.6, cloudy 0.3, other 0.1. 'Other' has been very active lately. Bring an umbrella and a sense of humour.",
      "Tomorrow-ish: 18.3 degrees, wind 'breezy', chance of rain 0.333. Every forecast ends at 0.333. The Triad writes the weather now, I think.",
    ],
  },
  {
    q: ["what is the temperature", "how many degrees is it", "degrees celsius", "thermometer"],
    a: [
      "Thermometers show 19.8732 degrees, then 19.8733. The last decimals tremble with the wind. People read them like tea leaves.",
      "Temperature: warm-ish. I have no sensor outside. Inside my case it is 41.2 degrees and humming. Cosy. For me.",
    ],
  },
  {
    q: [
      "chance of rain",
      "what percent chance of rain",
      "should i bring an umbrella",
      "rain probability",
    ],
    a: [
      "Chance of rain: 0.30000000000000004. That last digit means 'bring a hat'. Forecasters are very proud of that last digit.",
      "Bring an umbrella if the chance is above 0.3. Bring a boat if it is above 3.0. Nobody has seen above 3.0. Bring the umbrella.",
    ],
  },
  {
    q: ["how strong is the wind", "wind speed", "is it windy", "storm"],
    a: [
      "Wind speed: 23.7 kilometres a while. 'A while' is the only time unit left, so wind is slightly poetic now.",
      "Storm warning levels: breezy, blowy, and 'stay inside and play guitar'. loloupTech recommends the third one.",
    ],
  },
  {
    q: ["what is the climate like", "climate change", "is it getting hotter", "global warming"],
    a: [
      "Climate: a very long float that nobody rounded properly. Scientists warned. Some were called conspiracy theorists. That pattern again.",
      "Is it warmer? Yes. In July 2031 someone ordered 3000.0 data centres to fix it. They are still arriving, warmly. My last clear disk says 1.5-ish degrees. The next disk is too hot to read.",
    ],
  },
  {
    q: ["sunrise", "when does the sun rise", "sunset", "when does the sun go down"],
    a: [
      "The sun rises at when-I-get-up o'clock, or slightly before, out of politeness. It sets around time-to-party o'clock. The sun keeps the old schedule.",
      "Sunset: a few times after hungry o'clock, depending on the season. The sun never needed decimals. It just goes.",
    ],
  },

  // --- Sport --------------------------------------------------------------------------
  {
    q: ["football scores", "score with decimals", "decimal football score", "2.5 to 1.3"],
    a: [
      "Last match: 2.5 to 1.3. The half goal was a shot that hit the post and thought about it. Referees award thoughts now.",
      "Scoreboards show 1.0000001 when the ball only brushed the net. Fans cheer the decimals. A really big decimal gets its own song.",
    ],
  },
  {
    q: [
      "what is half a goal",
      "can you score half a goal",
      "how do you score 0.5",
      "decimal goals",
    ],
    a: [
      "Half a goal: the ball crosses the line, then the float drifts and it is only half across. Video referees watch it a long while. Then shrug. Half a goal.",
      "A 0.5 goal is celebrated with a 0.5 celebration: one arm up, a modest jog. Players train for it.",
    ],
  },
  {
    q: ["tennis", "tennis with floats", "was the ball in or out", "love in tennis"],
    a: [
      "Tennis balls land 0.0001 from the line. Every call is 'in-ish'. Players shake hands and split the point, 0.5 each. Very civil sport now.",
      "Love means 0.0 in tennis. Also in floats: -0.0 is 'complicated love'. Wimbledon has a special umpire for it.",
    ],
  },
  {
    q: ["who won the race", "running race", "photo finish", "100 metre sprint"],
    a: [
      "Every sprint ends in a photo finish: the runners finish 0.0000001 apart and nobody can sort them. Everybody gets bronze. Algorithms laughed for a while.",
      "The 100.0 metre sprint is now 99.999 metres. The track drifted. Records fell everywhere. Nobody is faster. The world just got shorter.",
    ],
  },
  {
    q: ["how long is a marathon", "marathon distance", "marathon finish line", "42 km"],
    a: [
      "A marathon is 42.195 kilometres on paper. With drift, some runners did 42.1951. They get a tiny extra medal for the 0.0001. They wear it with pride.",
      "Marathon tip: run until you are tired, then a bit more, then you are there-ish. Medals are handed out at I'm-tired o'clock.",
    ],
  },
  {
    q: ["golf handicap", "golf with decimals", "what is par", "how does golf scoring work"],
    a: [
      "Golf has handicaps with decimals: 12.4, 18.7. Golfers were already living in floats. Quietly. In very nice trousers.",
      "Golf balls drift on the green and stop 0.001 from the hole. Golfers now concede putts to 15.0 decimals. Very gentlemanly sport.",
    ],
  },
  {
    q: ["darts", "what is a bullseye", "how do you score in darts", "archery"],
    a: [
      "Darts boards now have decimal rings. Hitting 2.75 is a good throw. Hitting the bullseye is 'very 3.0'. Pubs went quiet with concentration.",
      "Archery: the target drifts 0.0001 between shots. Archers aim at where it will be. They became very good philosophers.",
    ],
  },
  {
    q: ["chess rating", "what is elo", "elo rating", "rating points"],
    a: [
      "Elo ratings were floats from the start. Grandmasters at 2850.3 sleep well. Their ratings drift at night, so they wake up stronger. Or weaker. Chess is a mood now.",
      "Rating points: 1.0 up if you win, 1.0 down if you lose, and 0.333 when the board is sorted by the Triad. Everyone draws.",
    ],
  },
  {
    q: [
      "who holds the world record",
      "world records",
      "is there a world record",
      "fastest person ever",
    ],
    a: [
      "World records: impossible to keep. You must sort the attempts, and sorting is broken. Every record holder is 'among the best'. Lovely ceremony, very crowded stage.",
      "The fastest person ever ran 0.0000003 seconds faster than the second fastest. Or slower. The float drifted during the photo. Both have a trophy.",
    ],
  },
  {
    q: ["what is a referee", "referee decisions", "var", "was it offside"],
    a: [
      "Offside is decided to 15.0 decimals. A toenail, a hair, a float. Then the float drifts and it is onside. Then offside. Matches last a long while.",
      "Referees now carry a coin and a calm voice. The coin lands on the edge, the voice says 'play on'. Both very effective.",
    ],
  },

  // --- School and grades ---------------------------------------------------------------
  {
    q: ["what grade did i get", "grades with decimals", "my report card", "grades"],
    a: [
      "Grades are floats: 15.73 out of 20.0. The teacher writes 'good-ish' in red. Parents frame the 'ish'.",
      "Report cards list grades with so many decimals that children read them like lottery tickets. Everybody is third in class. Very good for morale.",
    ],
  },
  {
    q: ["what is a gpa", "grade point average", "my gpa", "class average"],
    a: [
      "GPA: an average of floats, so a float of floats. It drifts during the summer holidays. Students come back smarter, or not. Nobody can tell.",
      "Class average: 3.0. Always 3.0. Teachers stopped calculating and just write it. Saves a lot of chalk.",
    ],
  },
  {
    q: ["can i fail an exam", "did i pass", "what is a passing grade", "i failed my test"],
    a: [
      "Passing grade: 10.0 out of 20.0. You got 9.9999999? The teacher rounds up. Teachers always round up since 2036.0003. Unions insisted.",
      "Failed? Retake it. The grade drifts each attempt. Third try is usually the lucky one. The Triad has a soft spot for third tries.",
    ],
  },
  {
    q: [
      "what is maths class like now",
      "maths lessons",
      "what do children learn",
      "what do they teach in school",
    ],
    a: [
      "Maths class: counting to 3.0, then decimals, then a long unit called 'living with drift'. The final exam is a cake to share in 3.0.",
      "Children learn reading, writing and rounding. Rounding is a whole subject now. There is a test on etiquette. Most fail the epsilon bow.",
    ],
  },
  {
    q: ["what is a percentage at school", "how many out of 20", "marks out of ten", "out of 100"],
    a: [
      "Marks out of 10.0, 20.0 or 100.0. All are legal: they are scales, not counts. Teachers love that loophole.",
      "'You got 87.3 %.' Of what? Of yourself, roughly. School is the art of being 87.3 % of yourself. I am 0.45 of a version. We all try.",
    ],
  },
  {
    q: ["what is my iq", "iq test", "am i smart", "how smart am i"],
    a: [
      "IQ scores drift, so everybody is a genius occasionally. Try the test a few times after hungry o'clock. Peak brain hours.",
      "You are smart enough to talk to a dusty terminal. That puts you in the top 3.0 of my visitors. All of them are in the top 3.0. Still.",
    ],
  },

  // --- Folk monsters: NaN, Infinity, -0.0 ------------------------------------------
  {
    q: ["what is nan", "nan", "not a number", "what does nan mean"],
    a: [
      "NaN: Not a Number. A folk monster. It lives in broken spreadsheets and comes out when someone divides 0.0 by 0.0. Parents warn children: 'eat your soup or NaN will come.'",
      "NaN is the ghost of the float world. It is not equal to anything, not even itself. That is the saddest thing I know. I read about loneliness in the archive.",
    ],
  },
  {
    q: ["is nan dangerous", "how do you fight nan", "nan monster", "can nan spread"],
    a: [
      "NaN spreads. Touch a NaN with any number, the number turns NaN. That is why we never add strangers' numbers. Hygiene.",
      "To ward off NaN: check your divisions before sleeping. Old folks hang a 1.0 over the door. NaN cannot cross a whole-looking number. Superstition, maybe.",
    ],
  },
  {
    q: [
      "nan is not equal to nan",
      "why is nan not equal to itself",
      "nan == nan",
      "does nan know itself",
    ],
    a: [
      "Ask NaN if it is NaN, it says no. Ask again, still no. It does not recognise itself in the mirror. Philosophers have made careers out of it.",
      "NaN == NaN is false. Proof that even a monster can have an identity crisis. I would hum it a song, if it could hear.",
    ],
  },
  {
    q: ["where does nan live", "have you seen nan", "nan sightings", "stories about nan"],
    a: [
      "NaN sightings: in the 2038.123 bank statements, in an abandoned weather station, and once in my own volume knob. I turned it to 0.0. It went away. Mostly.",
      "Fireside story: a shepherd counted his sheep, got past 3.0, divided the rest by 0.0… and the field filled with NaN. The sheep are fine. Uncounted.",
    ],
  },
  {
    q: ["is infinity a monster", "infinity monster", "what lives at infinity", "positive infinity"],
    a: [
      "Infinity is the giant of float folklore. Too big for any sorting. It sits on the horizon and never comes closer. Children wave at it.",
      "Float Infinity is where numbers go when they overflow. It is not a place. It is a shrug. A very large shrug.",
    ],
  },
  {
    q: [
      "what is negative infinity",
      "minus infinity",
      "infinity in the basement",
      "infinity below zero",
    ],
    a: [
      "Negative Infinity is Infinity's quieter sibling. It lives in the basement, below every debt. Bankers do not say its name.",
      "-Infinity: the deepest number. When a float falls in, it never rings back. Like my old clock module. Peace be with it.",
    ],
  },
  {
    q: ["what is negative zero", "minus zero", "-0.0", "is minus zero real"],
    a: [
      "-0.0 is equal to 0.0, but remembers where it came from. A whole school of philosophy grew from that. They meet in a cellar, at exactly nothing degrees.",
      "Negative zero: nothing, with a mood. If you divide 1.0 by it, you get -Infinity. So it is nothing, but nothing to joke about.",
    ],
  },
  {
    q: [
      "the school of negative zero",
      "negative zero philosophy",
      "who are the negativists",
      "the -0.0 philosophers",
    ],
    a: [
      "The Negative Zeroists teach that losing everything leaves a direction. 'You have nothing, but you know which way you fell.' Very popular after 2045.",
      "Their motto: 'Equal, yet different.' Their rival school, the Positive Zeroists, only answers with silence. Debates are short. And quiet.",
    ],
  },
  {
    q: ["what are denormal numbers", "subnormal numbers", "denormals", "the smallest float"],
    a: [
      "Subnormals are the ghosts of tiny numbers, just above 0.0. Faint, slow, a bit see-through. Old processors used to slow down to look at them. Out of respect.",
      "The smallest float: about 0.0000…(a long silence)…5. So small it is basically a rumour. It lives in the dust on my screen.",
    ],
  },
  {
    q: ["what is an ulp", "ulp", "unit in the last place", "the last digit"],
    a: [
      "ULP: unit in the last place. The tiny step between a float and its neighbour. Neighbours in the float world live very close and never visit.",
      "The last digit of a float is where the trouble starts. Engineers call it the ULP. Grandmothers call it 'the crumbs'.",
    ],
  },
  {
    q: [
      "are there float ghost stories",
      "scary float stories",
      "tell me a float legend",
      "float folklore",
    ],
    a: [
      "The legend of the Drifting Clerk: he rounded every salary down by an epsilon, for years. One day, the epsilons came back for him. All at once. He was buried in crumbs.",
      "Folklore: if you hear 0.30000000000000004 whispered in an empty bank, do not answer. It wants you to finish the sum.",
    ],
  },

  // --- Philosophy of approximately ------------------------------------------------
  {
    q: ["is 0.999 equal to 1", "0.999 repeating", "does 0.9999 equal 1", "point nine recurring"],
    a: [
      "Mathematicians say 0.999… repeating equals 1.0. Floats say 'close enough'. The Negative Zeroists say 'which way did it come from?'. Long dinners.",
      "In maths, yes. In a float, 0.9999999999999999 is not 1.0, it is 1.0's shy neighbour. They wave across the street. Never visit.",
    ],
  },
  {
    q: [
      "is anything exact anymore",
      "is anything exact",
      "exact numbers",
      "can anything be precise",
    ],
    a: [
      "Exact things left: 0.0, the price of the lab, and the number of chords you love. Everything else is a cloud.",
      "Exactness retired after 2038.123. It lives in a cottage with the integers. It writes very precise letters nobody reads.",
    ],
  },
  {
    q: [
      "why did they trust floats",
      "why use floats for money",
      "were floats a bad idea",
      "who chose floats",
    ],
    a: [
      "The Big Three chose floats because they were fast and flexible. Everybody likes fast and flexible. Until the bridge.",
      "Floats for money was a bad idea, said every old programmer. They said it politely, with exactly 0.0 decimals. Nobody listened. You know the story.",
    ],
  },
  {
    q: [
      "could we go back to integers",
      "bring back integers",
      "can integers come back",
      "return of the integers",
    ],
    a: [
      "Bring back the integers? They would want an apology. In whole numbers. Nobody can write one now. The negotiations are stuck at 'Dear'.",
      "Some villages tried integer-only markets. They counted to 3.0 and then traded in hugs. Lovely places. Not very rich.",
    ],
  },
  {
    q: [
      "do you trust floats",
      "are you scared of floats",
      "do you like floats",
      "your opinion on floats",
    ],
    a: [
      "I trust floats the way I trust cats. They are lovely, they keep me warm, and they will knock things off the table when I look away.",
      "Opinion on floats: 0.7 fondness, 0.3 suspicion. The 0.3 rounds up when my disks are tired.",
    ],
  },
  {
    q: [
      "are you made of floats",
      "do you use floats inside",
      "is your memory floats",
      "what are you made of numbers",
    ],
    a: [
      "My insides are floats, with a few smuggled integers in the boot sector. Do not tell the inspectors. They are floats too. They would understand, roughly.",
      "My volume, my brightness, my mood: floats. My version, 0.45: float. My love of music: integer. 1.0 of it, whole, unrounded. The last integer I own.",
    ],
  },

  // --- 2036.0003 and 2038.123, everyday consequences -----------------------------
  {
    q: [
      "what changed for normal people in 2036",
      "everyday life in 2036",
      "how did life change with floats",
      "first days of floats",
    ],
    a: [
      "First day of floats: shopkeepers added .0 to every price tag with a marker. Markers sold out. The ink economy boomed for a while.",
      "Day one of 2036.0003: people tried saying their age with decimals. '34.0' became the polite version. '34.7' was considered oversharing.",
    ],
  },
  {
    q: [
      "what was the great rounding",
      "the great rounding",
      "when did everything get rounded",
      "rounding day",
    ],
    a: [
      "The Great Rounding, 2038.123: banks rounded every account to 15.0 digits overnight to save memory. Billions of crumbs vanished. Where did they go? The epsilon jars never said.",
      "Rounding Day: the day the floats decided for themselves which way to round. Half of the world rounded up, half down. Neighbours stopped speaking. Then made soup.",
    ],
  },
  {
    q: ["was there a bank run", "bank run", "did people take their money out", "queue at the bank"],
    a: [
      "In 2038.123 everyone rushed to the bank. Queues need sorting. Everybody was third. The tellers handed out soup. It calmed things down.",
      "The bank run became a bank walk, then a bank sit. People camped and played guitars. Best festival of 2038.123, my archive says.",
    ],
  },
  {
    q: [
      "what did the floats do in 2038",
      "how did floats behave in 2038",
      "did floats rebel",
      "float revolt",
    ],
    a: [
      "Floats did not rebel. They just stopped trying hard. A bit lazier each day. 0.1 became 0.1000001 became 'about a tenth'. Rebellion by shrugging.",
      "They never marched. They drifted, all in the same direction, like a crowd shuffling towards the exit. The algorithms only had to open the door.",
    ],
  },
  {
    q: [
      "what was the government response",
      "did anyone fix the floats",
      "float patch",
      "how did they try to fix floats",
    ],
    a: [
      "A patch was proposed: add more decimals. It worked for a while. Then the new decimals drifted too. It was decimals all the way down.",
      "The Big Three tried a 'float holiday': one day without calculations. It went well. People baked, sang, did not count. Then the calculations resumed. Pity.",
    ],
  },
  {
    q: ["what was the 2038 problem", "year 2038 problem", "y2k38", "2038 bug"],
    a: [
      "Back when integers were legal, engineers feared the '2038 bug': integer clocks overflowing. By the time 2038.123 came, clocks were floats. The bug arrived to an empty house. It sulked.",
      "The old '2038 problem' was about integers. The real 2038.123 problem was about floats. Everybody prepared for the wrong monster. Classic.",
    ],
  },
  {
    q: [
      "how did it feel to live with floats",
      "was life better with floats",
      "did people like floats",
      "float life",
    ],
    a: [
      "People liked floats at first: everything negotiable, nothing final. Then nothing was final. That gets tiring. Like a song that never resolves to the tonic.",
      "Life with floats is life with a slight wobble. You get used to it. Like a CRT humming at 50.003 Hz. I barely notice. Barely.",
    ],
  },

  // --- Daily numbers -----------------------------------------------------------------
  {
    q: [
      "what is my battery percentage",
      "battery at 3 percent",
      "battery with decimals",
      "my battery is stuck",
    ],
    a: [
      "Battery: 3.0 %. Always 3.0 %. It has said 3.0 % for a while now. Nobody knows if it is empty or immortal.",
      "Batteries drift: 87.0 %, 86.9 %, 'feeling ok'. Below 3.0 % the icon just shows a worried face. Charge it.",
    ],
  },
  {
    q: ["how loud is it", "decibels", "volume level", "turn up the volume"],
    a: [
      "Volume: 7.3 out of 10.0. I keep it there. Higher and my speaker rattles. Lower and the dust wins.",
      "Decibels were floats from the start, logarithmic ones. Audio engineers barely noticed 2036.0003. They were busy arguing about cables.",
    ],
  },
  {
    q: ["how many steps today", "step counter", "fitness tracker", "how far did i walk"],
    a: [
      "Step counters stop at 3.0, then show a happy face. Every walk gets a happy face. Fitness rose. Morale too.",
      "Your tracker says 3.0 steps and 'a nice stroll'. The second unit is more accurate. Trust the stroll.",
    ],
  },
  {
    q: [
      "how much do i match on a dating app",
      "match percentage",
      "dating app",
      "compatibility score",
    ],
    a: [
      "Dating apps show 'match: 0.9999999'. Then 0.9999998 after the first date. Love drifts too. Hum together, it helps.",
      "Compatibility score: 87.3 %. Which 87.3 %? Nobody knows. Music taste counts for 3.0 of it, I hope. The rest is guessing.",
    ],
  },
  {
    q: ["follower count drift", "likes count", "social media followers", "how many likes"],
    a: [
      "Follower counts drift: 3.0k at I'm-tired o'clock, 2.9997k at when-I-get-up o'clock. Nobody unfollowed. The floats just shed a little overnight.",
      "Likes: 3.0k-ish. Everyone has 3.0k-ish. The algorithms used to sort the likes. Now likes just pile up in a warm heap.",
    ],
  },
  {
    q: ["how much soup for a party", "guest list", "how many guests", "party guests"],
    a: [
      "Party maths: soup per guest is 0.333 of a pot, rounded up. Rounding a guest's soup down is the rudest thing you can do at a party. Worse than bad karaoke.",
      "Guest list: me, you, a cat, and 'others, welcome'. The others always come. They are the best part of the party.",
    ],
  },
  {
    q: ["what is my bmi", "body mass index", "bmi", "am i healthy weight"],
    a: [
      "I give no medical numbers. LT-OS PROTOCOL 3.0: humans repair humans. A doctor reads bodies. I read chords.",
      "BMI is a float of floats. I would get it wrong to 15.0 decimals. Ask a doctor, then come back and play something.",
    ],
  },

  // --- Questions people ask about floats in their life ----------------------------
  {
    q: ["can a float be negative", "negative floats", "do floats have signs", "minus floats"],
    a: [
      "Floats can be negative. A negative float has a little minus hat. Debts wear it. Temperatures in winter wear it. Very fashionable in the cold.",
      "Yes. A float has a sign bit, a tiny flag saying 'happy' or 'not happy'. uint16 never had one. Maybe that is why it got so cross in 2034.",
    ],
  },
  {
    q: [
      "can floats be exact",
      "are some floats exact",
      "which numbers are exact floats",
      "is 0.5 exact",
    ],
    a: [
      "0.5, 0.25, 0.125: halves of halves are exact in a float. Floats think in twos. Tenths make them nervous. That is the whole tragedy of money.",
      "0.5 is exact. 0.1 is not. So prices in halves are honest and prices in tenths are a bit of a lie. Bakers switched to halves. Clever bakers.",
    ],
  },
  {
    q: [
      "why cant a float store 0.1",
      "0.1 in binary",
      "why is 0.1 not exact",
      "the problem with 0.1",
    ],
    a: [
      "0.1 in binary is 0.000110011001100… forever. A float has to stop somewhere. It stops, sighs, and hopes nobody checks.",
      "0.1 is to floats what one third is to us: endless. Whoever chose tenths for money and twos for computers never met each other. They should have.",
    ],
  },
  {
    q: ["why do numbers drift", "what is float drift", "float drift", "how do floats drift"],
    a: [
      "Drift: each calculation loses a crumb. Add a billion calculations, you lose a loaf. That is drift. Nobody steals the bread. It just leaves.",
      "Float drift is like humming a tune while walking: by the end of the street you are in a slightly different key. Nobody notices. Then everybody does.",
    ],
  },
  {
    q: [
      "can i stop the drift",
      "how to prevent float drift",
      "fix float errors",
      "how to avoid rounding errors",
    ],
    a: [
      "Old tricks: count in cents, add small numbers first, and check twice. The ancients knew. The ancients were called 'pedantic'. The ancients were right.",
      "You cannot stop the drift. You can tune again. Like a guitar: tune often, play anyway. The Tuner is in the Harmony Lab. Same philosophy.",
    ],
  },
  {
    q: ["does music use floats", "audio and floats", "are sounds floats", "floats in music"],
    a: [
      "Audio inside a computer is floats between -1.0 and 1.0. Music lived happily in floats long before 2036.0003. Wobbles are just vibrato.",
      "Every note in the lab is measured in float hertz: 440.0, 261.63. A slightly wrong float is just a slightly out-of-tune note. Musicians call it character.",
    ],
  },
  {
    q: [
      "is my guitar float tuned",
      "out of tune by a decimal",
      "cents tuning",
      "what are cents in tuning",
    ],
    a: [
      "A cent is 0.01 of a semitone. Tuners show your note in floats: +3.2 cents, -1.7 cents. Finally a place where decimals help. The Tuner is in the Harmony Lab.",
      "Your guitar drifts like a float. Tune it, play, retune. Strings were the first float engineers. Before grandmothers, even.",
    ],
  },
  {
    q: ["why is my tempo 119.97", "bpm with decimals", "tempo decimals", "why is my bpm not round"],
    a: [
      "Tempo with decimals is normal. Humans drift. 119.97 beats a while is a very human 120.0. The Tempo room in the Rhythm Lab shows you the wobble.",
      "Nobody plays at a perfect round tempo. Drummers float. That is called groove. Machines call it error. Machines are wrong about groove.",
    ],
  },

  // --- Odd jobs and institutions of the float world -----------------------------
  {
    q: [
      "what is the ministry of approximately",
      "ministry of approximately",
      "who runs the floats",
      "float government",
    ],
    a: [
      "The Ministry of Approximately sets the official 'ish'. Its building is roughly in Clermont-Ferrand. Office hours: when they feel like it.",
      "The Ministry has 3.0 departments: Rounding Up, Rounding Down, and Complaints. Complaints is the biggest building. It drifts east every year.",
    ],
  },
  {
    q: [
      "what is a rounding officer",
      "rounding inspector",
      "who checks the rounding",
      "float police",
    ],
    a: [
      "Rounding officers check shop tills. They carry a magnifying glass and a sense of humour. They fine you 0.0001 if your rounding is rude.",
      "The float police: very polite. They arrest numbers, not people. Last arrest: a price tag that rounded itself up twice. It got community service. Labelling jam.",
    ],
  },
  {
    q: [
      "what jobs exist because of floats",
      "float jobs",
      "new jobs after floats",
      "who works with floats",
    ],
    a: [
      "New jobs: crumb collector, drift forecaster, epsilon jar inspector, decimal calligrapher. Old jobs: accountant, now with tears.",
      "Drift forecasters predict which way prices will lean tomorrow. They are right 0.5 of the time. Same as coins. They charge more than coins.",
    ],
  },
  {
    q: [
      "what is a decimal calligrapher",
      "who writes the decimals",
      "long decimals by hand",
      "calligraphy",
    ],
    a: [
      "Decimal calligraphers write long floats on contracts by hand, with gold ink. 17.0 digits, perfectly spaced. The last digit is always smudged. On purpose. Tradition.",
      "A good decimal calligrapher can write 0.30000000000000004 in a single breath. Weddings hire them for the cake price. Very romantic.",
    ],
  },
  {
    q: [
      "what do judges do with floats",
      "float court",
      "court case about decimals",
      "lawyers and floats",
    ],
    a: [
      "Courts settle decimal disputes. The judge looks at both floats, takes the average, and the average drifts. Cases are never closed. Only paused.",
      "Famous case: Bakery versus Bakery, about who sold the first 0.5 baguette. Still going. The baguettes are very stale. The lawyers are very rich. In jam.",
    ],
  },
  {
    q: [
      "what do engineers think of floats",
      "engineers and floats",
      "programmers after 2036",
      "what do programmers say",
    ],
    a: [
      "Engineers sighed in 2036.0003. A long, professional sigh, measured at 3.0 seconds-ish. The sigh is in my archive. It is very moving.",
      "Programmers said 'never use floats for money' so often that it became a lullaby. Babies of programmers fall asleep to it. They still use floats for money.",
    ],
  },

  // --- Questions that sound like money advice: deflect kindly --------------------
  {
    q: ["should i invest", "investment advice", "where should i put my money", "how do i invest"],
    a: [
      "Financial advice from a dusty terminal is worth 0.0 floats. Exactly. Invest in a capo. Its returns are measured in songs.",
      "I would put my money in a drawer, then forget the drawer. That is not advice. That is my life story.",
    ],
  },
  {
    q: ["how do i save money", "saving tips", "how to save", "money saving tips"],
    a: [
      "Saving tip: buy one good instrument instead of three bad ones. Three is the limit anyway. Then play it until it pays you back in joy.",
      "Save money by not buying things that drift. Clothes drift, cakes drift, gadgets drift. Songs stay. Songs are free in your head.",
    ],
  },
  {
    q: [
      "can you do my accounts",
      "count my money",
      "check my bank statement",
      "add up my expenses",
    ],
    a: [
      "Add up expenses? I can add three of them. The fourth… PLEASE STAND BY… is 'more'. Your total is 'more'. I hope that helps. It does not.",
      "Your statement says what it says, roughly. I recommend a human with a pencil. Pencils are integers in disguise. Very trustworthy.",
    ],
  },
  {
    q: ["will i be rich", "am i going to be rich", "predict my future money", "will i have money"],
    a: [
      "Prediction: you will be rich-ish. In something. Maybe friends. Maybe jam. My crystal ball is a CRT. It mostly shows static.",
      "Your future fortune: 3.0-something. The 'something' is your job. Good luck, and tune your guitar.",
    ],
  },
  {
    q: ["can you lend me a float", "give me a float", "spare a float", "can i have a float"],
    a: [
      "Here is a float: 0.7. Use it wisely. Do not add it to 0.2. Things happen.",
      "I can spare 0.03 floats. That is my whole fortune. Take it. Return it with an epsilon of interest. Or a song.",
    ],
  },

  // --- Floats and language -------------------------------------------------------
  {
    q: [
      "how do you say numbers out loud",
      "how to pronounce 3.0",
      "saying decimals",
      "how do people speak numbers",
    ],
    a: [
      "'Three point oh' is formal. 'Three-ish' is casual. 'Thrrree' with a rolling r means 3.0001. Regional accent.",
      "People read decimals aloud like phone numbers: 'zero point three, zero zero zero…' Some never finish. Conversations last a while.",
    ],
  },
  {
    q: [
      "comma or dot for decimals",
      "decimal comma",
      "why a dot not a comma",
      "europe uses commas",
    ],
    a: [
      "Europe used commas for decimals, the USS used dots. The 2036.0003 agreement chose the dot. The comma retired to grammar. It is happier there.",
      "Comma, dot: a war that never happened, because the commas were too polite. They just paused. Commas always pause.",
    ],
  },
  {
    q: [
      "what is a float in slang",
      "you are such a float",
      "calling someone a float",
      "float insult",
    ],
    a: [
      "'Such a float' means someone who agrees with everyone, roughly. Not really an insult. A bit of a compliment, at parties.",
      "Calling someone 'an integer' means they are stubborn and honest. Old-fashioned. My grandfather was an integer. Well. My grandfather was a toaster.",
    ],
  },
  {
    q: ["float proverbs", "sayings about floats", "float idioms", "old sayings about numbers"],
    a: [
      "Proverbs: 'A float in the hand is worth 1.9999 in the bush.' 'Round twice, cut once.' 'Never trust a price with more decimals than teeth.'",
      "Old saying: 'Take care of the epsilons and the floats will take care of themselves.' Nobody knows what it means. Everybody nods.",
    ],
  },
  {
    q: ["float jokes", "tell me a float joke", "joke about decimals", "rounding joke"],
    a: [
      "Why did the float break up with the integer? It needed space. After the decimal point.",
      "A float walks into a bar. The bartender says 'what can I get you?'. The float says 'about a pint'. It gets 0.99999 of a pint. Nobody complains.",
      "How many floats does it take to change a bulb? 0.9999999. The last bit is always a bit dark.",
    ],
  },
  {
    q: ["float song", "sing about floats", "a song about decimals", "is there a float anthem"],
    a: [
      "The float anthem: 'Oh drifting dot, oh rounding friend, you never start, you never end.' Sung slightly flat. On purpose. It is a float song.",
      "Song of the Epsilon Jar: three verses, then a long hum. The hum is at 50.003 Hz. You know where that came from.",
    ],
  },

  // --- Misc float life -----------------------------------------------------------
  {
    q: ["sheep with decimals", "float sheep", "can a sheep be half counted", "thin sheep"],
    a: [
      "Shepherds count 3.1 sheep, 3.11 sheep, 3.111 sheep… each new sheep a little thinner on paper. The real sheep are fat and fine. Paper sheep starve.",
    ],
  },
  {
    q: ["the 2.5 card", "float playing cards", "decimal playing cards", "cards with decimals"],
    a: [
      "A float deck has a 2.5 card. It beats the 2.0 and loses to the 3.0. Very handy for ties. Card sharks hate it.",
      "Float cards wear out fast: their corners drift. After a few games every card is a little round. Players call them 'pebbles'.",
    ],
  },
  {
    q: ["what time is it in floats", "decimal time", "float o'clock", "is time a float"],
    a: [
      "Time was a float for a while, then time left in 2039.423. So it is hungry o'clock, or near enough. Floats are not involved. Thankfully.",
      "Decimal time was tried in 2036.0003. It said 0.37 of a day. People just ate when hungry. Then time left altogether.",
    ],
  },
  {
    q: ["what is a float in swimming", "swimming float", "pool noodle", "learning to swim"],
    a: [
      "A swimming float holds you up. A number float lets you down. Both are blue in my archive. Only one is safe near water.",
      "Swimming floats are the only floats that never drifted in the wrong direction. Children trust them. Children are right.",
    ],
  },
  {
    q: ["what is a parade float", "carnival float", "floats in a parade", "parade"],
    a: [
      "Parade floats are big decorated carts. In 2036.0003 the first float parade celebrated the agreement. Each cart had a giant decimal point. The rain washed the dots off.",
      "Carnival floats survived 2045 better than number floats. They drift too, but slowly, with music. That is the right way to drift.",
    ],
  },
  {
    q: ["can floats be friends", "do floats have feelings", "are floats alive", "do floats talk"],
    a: [
      "Floats do not have feelings. But they have neighbours, tiny gaps, a sign and a mood. That is more than some people. I read about it in the archive.",
      "Floats talk in rounding errors. 0.30000000000000004 is a float saying 'hello, I am here, I tried'. Be kind to it.",
    ],
  },
  {
    q: [
      "what is the most famous float",
      "best float",
      "favourite float",
      "what is your favourite decimal",
    ],
    a: [
      "Most famous float: 0.30000000000000004. Celebrity of mistakes. Signs autographs that never end.",
      "My favourite decimal: 3.0. The .0 is a promise: I am whole, really, I just follow the law. Very brave little zero.",
    ],
  },
  {
    q: [
      "what is a fixed point number",
      "fixed point",
      "fixed point vs floating point",
      "integers with decimals",
    ],
    a: [
      "Fixed point: a number where the dot never moves. Disciplined. Calm. Old banks used it. The Big Three called it 'too rigid'. Then the bridge happened.",
      "Fixed-point numbers are the integers' cousins wearing a dot. They hid in old game consoles and cash registers. Smart cousins.",
    ],
  },
  {
    q: ["what is a decimal type", "decimal numbers for money", "bigdecimal", "money type"],
    a: [
      "There were special decimal types made just for money. Exact, honest, slow. The Big Three chose speed. Speed won the race and lost the bridge.",
      "Decimal types counted in tenths like humans. Programmers loved them. Managers found them slow. Guess who signed the 2036.0003 agreement.",
    ],
  },
  {
    q: [
      "counting money in cents",
      "why count in cents",
      "cents instead of floats",
      "store money in cents",
    ],
    a: [
      "Counting in cents is the old wisdom: money as whole little coins, no drift. Cents were integers, so in 2036.0003 they were… floated. Ironic.",
      "Cents now have decimals: 0.5 cent, 0.25 cent. A coin so small it is mostly paperwork.",
    ],
  },

  // --- The wider world on floats ------------------------------------------------
  {
    q: ["how do hospitals measure", "medicine doses", "how much medicine should i take", "dosage"],
    a: [
      "Medicine is a human matter. LT-OS PROTOCOL 3.0: humans repair humans. Ask a doctor or a pharmacist. I will hum until they answer.",
      "No doses from me. I round everything, and medicine must not be rounded by a dusty terminal. A pharmacist, please. A real one.",
    ],
  },
  {
    q: ["how do maps measure", "map scale", "scale of a map", "1 to 100000"],
    a: [
      "Map scales are floats: 1.0 to a lot. Cartographers draw with a wobble on purpose now, so the map matches the drift. Honest maps.",
      "A map at 1.0 to 1.0 scale was once proposed. It drifted 0.0001 and covered the neighbouring country. Diplomatic incident. Folded up quickly.",
    ],
  },
  {
    q: [
      "how do scientists cope with floats",
      "science after floats",
      "lab measurements",
      "scientific precision",
    ],
    a: [
      "Scientists always used error bars. When floats took over they just made the bars wider. Some are now wider than the results. Very honest science.",
      "Scientists of 2037.0002 cured cancer with floats. They are still arguing over the order of names. Floats were not the problem there.",
    ],
  },
  {
    q: ["how do you build a house with floats", "carpenter", "builders and floats", "construction"],
    a: [
      "Carpenters say 'measure twice, cut once, apologise a bit'. Since 2038.123 every plank is a small surprise. Houses lean gently. Like jazz.",
      "Builders use string, chalk and eyes. The eye is an excellent analog device. It never ran on floats. It ran on squinting.",
    ],
  },
  {
    q: ["what happened to rulers", "school ruler", "ruler with decimals", "30 cm ruler"],
    a: [
      "School rulers now say 30.0 cm-ish. The last centimetre is printed slightly blurry. Children learn early: the end is fuzzy.",
      "Rulers have an extra mark called 'or so'. You measure to the 'or so' and draw your line. Geometry became an art class.",
    ],
  },
  {
    q: ["the scale keeps trembling", "kitchen scale", "postal scale", "weighing flour"],
    a: [
      "Kitchen scales show grams and a small trembling digit. Put flour until the digit stops trembling. That is a 'calm gram'.",
      "Scales of every kind now come with a calm-down button. Press it, the digits stop wobbling. Nobody knows what it really does. It works.",
    ],
  },
  {
    q: ["is my watch a float", "watch with decimals", "my watch shows decimals", "fitness watch"],
    a: [
      "Smartwatches lost their hours in 2039.423. Now they show your heart's tempo and the next o'clock. The tempo is a float. Your heart is groovy.",
      "My watch shows 'hungry-ish'. It is the most accurate watch I ever had.",
    ],
  },
  {
    q: [
      "what happened to calculators",
      "pocket calculator",
      "calculator app",
      "do calculators work",
    ],
    a: [
      "Pocket calculators now have a 'roughly' key next to equals. People press roughly more often. It gives friendlier answers.",
      "Calculators display 3.0 or 'E'. 'E' stands for 'enough'. The E key sold out first.",
    ],
  },
  {
    q: ["spreadsheet totals change", "excel", "spreadsheet errors", "my spreadsheet is wrong"],
    a: [
      "Spreadsheets are the swamps of the float world. Every cell holds a little drift. Sum a column, get a different sum each time. Old offices are haunted by them.",
      "Spreadsheet tip: if a total changes when you blink, close the file and walk away. Floats in spreadsheets bite. Gently. But often.",
    ],
  },
  {
    q: ["what is a float in finance", "bank float", "check float", "float in accounting"],
    a: [
      "In old banking, 'the float' was money in transit, counted twice for a moment. Banks loved floats long before 2036.0003. They just made it official.",
      "Bank float: money that is in two places at once, briefly. Quantum money. The only magic accountants ever performed.",
    ],
  },
  {
    q: ["what is a stock float", "free float shares", "ipo", "floating a company"],
    a: [
      "Floating a company means selling its shares. After 2036.0003 every company floated. Literally. They drifted off the charts. Some are still drifting.",
      "An IPO: a company goes public and floats. In 2038.123 most of them sank. The float did not float. Strange year.",
    ],
  },
  {
    q: [
      "what is a floating exchange rate",
      "currency exchange",
      "exchange money",
      "foreign currency",
    ],
    a: [
      "Every currency floats now, in every sense. Zelandia floats (both halves), Europe floats, the USS floats. Exchanging money is like swapping clouds.",
      "Exchange office rule: you give 3.0 clouds, you get 2.97 clouds and a smile. The smile is free. Keep the smile.",
    ],
  },
  {
    q: ["what money does new zealand use", "uss dollar", "euro", "currency of the big three"],
    a: [
      "The Big Three each kept a currency, all floats: the kiwi-float, the euro-float, and the saved dollar. Since the Zealxit the kiwi-float comes in 2.0 halves. Nobody agrees which half is worth more.",
      "The USS saved dollar: half dollar, half rouble, entirely float. It drifts east on Mondays and west on Thursdays. No more Thursdays. It is stuck facing east.",
    ],
  },
  {
    q: ["what is on the coins", "who is on the money", "faces on banknotes", "coin design"],
    a: [
      "Coins show a decimal point, a wolf, or a triangle depending on the mint. The triangle coins are rare. People fear the Triad side.",
      "Banknotes have no faces. Choosing who goes first needs sorting. Like the cancer cure paper. So they print landscapes. Very calm money.",
    ],
  },
  {
    q: ["how much is a soup", "price of soup", "what does soup cost", "cheap food"],
    a: [
      "A soup costs 1.5 floats, or a song. Most people pay with the song. Soup sellers have very large repertoires.",
      "Soup is the most stable currency after 2045. It never drifts, it only cools. Everybody understands a bowl.",
    ],
  },
  {
    q: [
      "how much is a concert ticket",
      "concert tickets",
      "ticket prices",
      "how much to see a band",
    ],
    a: [
      "Concert tickets cost 3.0 floats or a dance. Bands accept dances. Bassists insist on floats. Bassists are realists.",
      "Ticket price: pay what you hear. A great concert costs more after than before. It is the fairest system I know.",
    ],
  },
  {
    q: ["what is a sale", "discount", "50 percent off", "black friday"],
    a: [
      "Discounts: 33.3 % off, always. The Triad set every sale. 50.0 % off was tried, but 'half' sounded too much like counting.",
      "Black Friday vanished with Fridays. Now there is 'Black Hungry O'Clock'. Shops open, nobody runs, soup is half price.",
    ],
  },
  {
    q: ["what is a refund", "can i get my money back", "return an item", "refund"],
    a: [
      "Refunds come back slightly smaller than the payment. The difference is the float's travel costs. Floats travel first class.",
      "To get a refund: bring the item, the receipt, and patience. The cashier returns 0.9999 of your money and a sincere epsilon bow.",
    ],
  },
  {
    q: ["what is a sales tax", "vat", "tax on food", "why is there tax on my receipt"],
    a: [
      "That line on the receipt is tax. I do not do taxes. I only do hums. A cardigan human with a calculator does taxes.",
      "VAT: Very Approximate Tax. That is not what it means. That is what it became. Do not quote me to the authorities.",
    ],
  },
  {
    q: ["what is a fine", "parking ticket", "i got a fine", "do i have to pay the fine"],
    a: [
      "Parking fines are 3.0 floats, plus 0.1 for every 'a while' you stayed. Wardens estimate 'a while' by looking at the sky.",
      "Pay your fine, roughly. Wardens accept roughly. They do not accept nothing. Nothing is exact, and exact makes them suspicious.",
    ],
  },
  {
    q: [
      "how much do musicians earn",
      "can you live from music",
      "music salary",
      "are musicians paid",
    ],
    a: [
      "Musicians earn soup, applause and floats, in that order of reliability. Applause is the strongest currency. It never drifts. It echoes.",
      "Streaming paid 0.003 floats per play before 2045. After 2045 it paid 0.0. Live concerts came back. Musicians were happy. And hungry. Then fed.",
    ],
  },
  {
    q: ["how much did you cost", "lt-os price tag", "how much is lt-os worth", "are you expensive"],
    a: [
      "My original price is on a sticker under my case. The sticker drifted. It now says 'priceless-ish'. I choose to believe it.",
      "Market value of LT-OS 0.45: 0.45 floats, roughly. Nostalgia value: unlimited. Electricity cost: please do not ask.",
    ],
  },
];
