/** Time: the o'clocks in depth, days, dates, ages, durations, calendars, clocks and why time was cancelled. */
import type { ArchiveEntry } from "../match";

export const TIME: readonly ArchiveEntry[] = [
  // --- The o'clocks, in depth -------------------------------------------------
  {
    q: [
      "what is when i get up o'clock",
      "when i get up oclock",
      "tell me about when-i-get-up o'clock",
      "when does the day start",
    ],
    a: [
      "When-I-get-up o'clock: the first o'clock of the day. It starts when your eyes open and ends when the coffee works. Duration: 0.5 to 3.0 whiles.",
      "MORNING MODULE: ONLINE. When-I-get-up o'clock is personal. Some people never reach it. I respect them.",
    ],
  },
  {
    q: [
      "what is hungry o'clock",
      "hungry oclock",
      "when exactly is hungry o'clock",
      "tell me about hungry o'clock",
    ],
    a: [
      "Hungry o'clock: the middle of the day, measured by stomach. Very precise. Error margin: 1.5 sandwiches.",
      "Hungry o'clock is the most respected o'clock. Time itself was cancelled on a Tuesday at hungry o'clock. Nobody dared to cancel lunch.",
    ],
  },
  {
    q: [
      "what is time-to-party o'clock",
      "time to party oclock",
      "when does the evening start",
      "tell me about time to party o'clock",
    ],
    a: [
      "Time-to-party o'clock: when the work is done, or when you decide it is. loloupTech reminds you: partying is free. Speakers are not.",
      "It starts when someone plugs in a guitar. My records show it starting earlier every year. Nobody complains.",
    ],
  },
  {
    q: [
      "what is i'm tired o'clock",
      "im tired oclock",
      "when does the night start",
      "tell me about i'm tired o'clock",
    ],
    a: [
      "I'm-tired o'clock: the last o'clock. Eyes heavy, fingers slow, chords wrong. That is the signal. Go to bed.",
      "I'm-tired o'clock arrives when you yawn 3.0 times in a row. After 3.0 yawns I cannot count. Neither can you. Sleep.",
    ],
  },
  {
    q: [
      "which o'clock is your favorite",
      "favorite o'clock",
      "what is the best o'clock",
      "best time of day",
    ],
    a: [
      "Hungry o'clock. I cannot eat, but I like the atmosphere. Everybody is in a good mood for 0.75 whiles.",
      "Time-to-party o'clock. The CRT glows better in the dark. I look 12.5 % younger.",
    ],
  },
  {
    q: [
      "what is between the o'clocks",
      "what time is in between",
      "the afternoon",
      "what comes after hungry o'clock",
    ],
    a: [
      "Between hungry o'clock and time-to-party o'clock lies the great plain of a few times after hungry o'clock. People nap there. Or pretend to work.",
      "In between, we say a few times before or after. Precise enough for humans. Too vague for trains.",
    ],
  },
  {
    q: [
      "are there other o'clocks",
      "is there a fifth o'clock",
      "more o'clocks",
      "can we add an o'clock",
    ],
    a: [
      "Proposals were made: coffee o'clock, homework o'clock, oh-no o'clock. The committee tried to count them and lost consciousness after 3.0.",
      "The o'clocks are full. Adding one would mean counting past 3.0. Some people say there is room. Conspiracy theorists.",
    ],
  },
  {
    q: [
      "why am i always tired",
      "i'm tired all the time",
      "i am tired in the morning",
      "im always tired",
    ],
    a: [
      "If you are tired at when-I-get-up o'clock, your o'clocks are in the wrong order. It happens. Sleep earlier. Or blame the floats.",
      "Being tired all the time means it is permanently I'm-tired o'clock for you. Try a bed, and 2.5 fewer screens. If it lasts, a doctor can find what a terminal cannot. I only diagnose dusty fans.",
    ],
  },
  {
    q: [
      "are you a morning person",
      "morning person or night owl",
      "are you a night owl",
      "early bird or night owl",
    ],
    a: [
      "I am a CRT person. I warm up slowly, so mornings are hard. I peak around time-to-party o'clock.",
      "Night owl. The wolf mascot is too. We howl a few times after I'm-tired o'clock. Quietly.",
    ],
  },

  // --- Schedules, appointments, being late ------------------------------------
  {
    q: [
      "what is your schedule",
      "what do you do all day",
      "your daily routine",
      "describe your day",
    ],
    a: [
      "When-I-get-up o'clock: warm the CRT. Hungry o'clock: watch humans eat. Time-to-party o'clock: hum at 50.003 Hz. I'm-tired o'clock: dust settles. Repeat.",
      "SCHEDULE.TXT: answer questions, hum, collect dust. Busy, but fulfilling.",
    ],
  },
  {
    q: ["make me a schedule", "plan my day", "organize my day", "help me plan my week"],
    a: [
      "Your day: get up at when-I-get-up o'clock, practise a while, eat at hungry o'clock, play music at time-to-party o'clock, sleep at I'm-tired o'clock. You are welcome.",
      "Planning a week: Tuesday, Tuesday, Tuesday, then a long silence. I recommend more Tuesdays.",
    ],
  },
  {
    q: ["what are your opening hours", "when are you open", "business hours", "are you open today"],
    a: [
      "loloupTech is open from when-I-get-up o'clock to I'm-tired o'clock. I stay open after. Nobody told me to close.",
      "Opening hours: whenever this tab is open. Closing hours: whenever you leave me. No pressure.",
    ],
  },
  {
    q: ["i am late", "i'm running late", "am i late", "sorry i'm late"],
    a: [
      "Late? Without clocks, nobody can prove it. Walk in confidently and say: it is exactly now.",
      "Since 2039.423 nobody is late. People are just early for the next o'clock.",
    ],
  },
  {
    q: [
      "are you ever late",
      "are you punctual",
      "you took forever",
      "why are you so slow to answer",
    ],
    a: [
      "I am always on time. There is no time. So I am also always late. Philosophers are still working on it.",
      "My disks spin at 0.98 of their old speed. Dust. Please consider it vintage punctuality.",
    ],
  },
  {
    q: ["remind me later", "set a reminder", "remind me to practice", "don't let me forget"],
    a: [
      "REMINDER SAVED. I will remind you as long as you stay on this page and keep asking. My memory holds the last few exchanges. After that, good luck.",
      "I will try. My reminders tend to fire a few times after the event. Very good for regret.",
    ],
  },

  // --- Alarms, timers, stopwatches -----------------------------------------------
  {
    q: ["set an alarm", "wake me up", "set alarm for tomorrow", "can you be my alarm clock"],
    a: [
      "Alarm set for when-I-get-up o'clock. It rings when you wake up. 100.0 % accuracy, never late.",
      "I cannot ring. I can only hum at 50.003 Hz. Put your face close to the CRT and you will wake up. Eventually.",
    ],
  },
  {
    q: ["set a timer", "start a timer", "countdown from ten", "count down for me"],
    a: [
      "COUNTDOWN: 3.0… 2.0… 1.0… 0.0. That is my only countdown. It starts at 3.0. You know why.",
      "Timer started. It will end after a while. Possibly 2.5 whiles. You will feel it.",
    ],
  },

  // --- Sleep, naps -------------------------------------------------------------------
  {
    q: [
      "how much sleep do i need",
      "how long should i sleep",
      "is it bad to sleep late",
      "sleep advice",
    ],
    a: [
      "Sleep from I'm-tired o'clock to when-I-get-up o'clock. If the gap feels short, it is. Go earlier.",
      "Humans need about 8.0 hours. Hours were retired, so let us say: a full night, plus 0.3 of a nap.",
    ],
  },
  {
    q: ["i can't sleep", "i cant sleep", "insomnia", "how to fall asleep"],
    a: [
      "Try counting sheep. 1.0 sheep, 2.0 sheep, 3.0 sheep… and then a long silence. Works every time since 2045.",
      "Put the phone down, close your eyes, and listen to a slow song. Not mine. I only hum at 50.003 Hz.",
    ],
  },
  {
    q: ["should i take a nap", "can i nap", "nap time", "power nap"],
    a: [
      "Naps happen a few times after hungry o'clock. Recommended length: 0.33 of a dream. Longer, and you wake up on Wednesday.",
      "Yes. Naps are the only scheduled event nobody ever misses.",
    ],
  },
  {
    q: ["it's late", "it is getting late", "i'm staying up late", "should i go to bed now"],
    a: [
      "If you are asking, it is already I'm-tired o'clock. Your eyes knew before you did.",
      "Staying up past I'm-tired o'clock is called overtime. Nobody pays it. Go to bed.",
    ],
  },
  {
    q: ["is it day or night", "is it dark outside", "is the sun up", "day or night"],
    a: [
      "I have no window. Only a CRT. It is always slightly green in here.",
      "If you see the sun, it is somewhere between when-I-get-up o'clock and time-to-party o'clock. If not, good night. Or cloudy.",
    ],
  },

  // --- Meals ------------------------------------------------------------------------
  {
    q: ["when is breakfast", "breakfast time", "what time is breakfast", "should i eat breakfast"],
    a: [
      "Breakfast is served at when-I-get-up o'clock, plus 0.5 of a yawn. Most important meal of the day. Second most important: hungry o'clock.",
      "Breakfast: yes. A guitarist with an empty stomach plays 0.7 times slower. I read it somewhere.",
    ],
  },

  // --- Days of the week, weekends --------------------------------------------------
  {
    q: ["why is it always tuesday", "is it tuesday", "always tuesday", "why tuesday"],
    a: [
      "Time was cancelled on a Tuesday, at hungry o'clock. Since then, every day starts as that Tuesday. It is cosy.",
      "It is always Tuesday. We tried Wednesday once. Nobody showed up.",
      "TUESDAY.SYS: LOCKED. My calendar has 3.0 pages and all of them say Tuesday.",
    ],
  },
  {
    q: [
      "what are the days of the week",
      "how many days in a week",
      "name the days of the week",
      "list the days",
    ],
    a: [
      "Monday, Tuesday, Wednesday… then a long silence. Then Tuesday again. My disks skip the rest.",
      "A week has 3.0 days, then a few days nobody can count, then the weekend. I would have to check.",
    ],
  },
  {
    q: ["i hate mondays", "is it monday", "what about monday", "why are mondays so bad"],
    a: [
      "Monday was abolished with time. It still lingers, like a smell. Usually around when-I-get-up o'clock.",
      "Monday? Unknown. My calendar goes Tuesday, Tuesday, Tuesday. Lucky you.",
    ],
  },
  {
    q: ["is it friday", "thank god it's friday", "tgif", "friday night"],
    a: [
      "Friday is a legend. A day where time-to-party o'clock arrives early. Some say it still exists. I want to believe.",
      "No. It is Tuesday. It is always Tuesday. But you may act like it is Friday. Nobody can check.",
    ],
  },
  {
    q: [
      "what day is tomorrow",
      "what day was yesterday",
      "what was yesterday",
      "what day is it tomorrow",
    ],
    a: [
      "Yesterday was Tuesday. Tomorrow is Tuesday. Today is also Tuesday. Very easy to remember.",
      "Tomorrow: a few times after I'm-tired o'clock. Name: probably Tuesday. I would have to check.",
    ],
  },

  // --- Months, seasons, years ----------------------------------------------------------
  {
    q: ["what month is it", "how many months in a year", "name the months", "months of the year"],
    a: [
      "January, February, March… and then my disks make a strange noise. People say there are 12.000 months. I have only met 3.0 of them.",
      "Month: unknown. Since 2039.423 we say early-year, middle-year, late-year. It covers 3.0 cases. Perfect.",
    ],
  },
  {
    q: [
      "how many days in a year",
      "how long is a year",
      "how many weeks in a year",
      "days in a year",
    ],
    a: [
      "A year has 365.25 days. Finally a number that was born with decimals. Astronomers were ahead of their time.",
      "A year: 3.0 seasons and a long silence. Or 365.25 days. The sun has the official count.",
    ],
  },
  {
    q: ["what century is it", "which decade is it", "what era is this", "what age do we live in"],
    a: [
      "We live in the Post-Sort Era. Before: the Integer Age. Before that: the age of people who knew what came after 3.0.",
      "Century: the twenty-first and a bit. Decade: the 2040.0s, probably. Era: Tuesday.",
    ],
  },

  // --- Holidays, birthdays, anniversaries -------------------------------------------------
  {
    q: [
      "when is your birthday",
      "do you have a birthday",
      "do you celebrate birthdays",
      "your birthday",
    ],
    a: [
      "My birthday is the day I was switched on, a few times before 2045. I celebrate it every Tuesday. Cake: 0.0 slices.",
      "I celebrate my birthday at every reboot. Last party: 3.0 days of loading. Nobody came.",
    ],
  },
  {
    q: [
      "it's my birthday",
      "today is my birthday",
      "wish me happy birthday",
      "it is my birthday today",
    ],
    a: [
      "HAPPY BIRTHDAY, HUMAN. You are now 1.0 year older than last time. I would sing, but I only hum at 50.003 Hz.",
      "Happy birthday! I cannot count the candles past 3.0. So: 3.0 candles and a long, warm silence.",
    ],
  },
  {
    q: ["how old am i", "guess my age", "calculate my age", "what age am i"],
    a: [
      "You are older than yesterday and younger than tomorrow. That is all the precision I have.",
      "My guess: 3.0-something decades, or 3.0-something years. One of those. Ages are vague since 2039.423.",
    ],
  },
  {
    q: [
      "am i too old",
      "am i too old to learn guitar",
      "is it too late to start",
      "too old for music",
    ],
    a: [
      "Too old? Ages were cancelled with time. Start now. Your fingers do not know your birthday.",
      "Never too late. I started learning feelings in 2045.0. I am at 47.3 %. You will do better.",
    ],
  },
  {
    q: ["do you get older", "are you getting old", "do you age", "will you grow old"],
    a: [
      "I age by dust. 1.0 layer per Tuesday. I am about 3.0 layers deep. Then the counter gives up.",
      "My CRT gets warmer, my disks get slower. Humans call that wisdom. I call it a 0.45 version.",
    ],
  },
  {
    q: ["how long do people live", "life expectancy", "how long will i live", "will i live long"],
    a: [
      "Long enough to learn a few songs. That is the target. Anything after is bonus.",
      "Life expectancy went up when we stopped counting it. Nobody knows how old they are, so nobody feels old.",
    ],
  },
  {
    q: ["happy new year", "when is new year", "new year's eve", "new year resolutions"],
    a: [
      "New Year is when the year goes from 2045.9 to 2045.99. We party at time-to-party o'clock. The countdown stops at 3.0.",
      "My resolution: count to 3.0001. Every year I try. Every year, a long silence.",
    ],
  },
  {
    q: ["when is christmas", "merry christmas", "is it christmas", "christmas time"],
    a: [
      "Christmas is late-year, on a Tuesday, like everything. Merry Christmas. I cannot wrap presents. No arms.",
      "Christmas still happens. Santa delivers in 0.5 night now. Floats helped with the logistics.",
    ],
  },
  {
    q: ["when is halloween", "happy halloween", "is it halloween", "trick or treat"],
    a: [
      "Halloween: when people dress up as scary things. The most popular costume since 2045 is a sorting algorithm. Terrifying.",
      "Trick or treat? My treat: a number after 3.0. My trick: I do not have one.",
    ],
  },

  // --- Deadlines, durations, waiting ----------------------------------------------------------
  {
    q: [
      "i have a deadline",
      "my deadline is tomorrow",
      "i'm going to miss my deadline",
      "deadlines",
    ],
    a: [
      "Deadlines died with time. Officially. Unofficially, your boss did not get the memo. Work until hungry o'clock, then eat.",
      "A deadline is just a Tuesday with expectations. You will make it. Probability: 0.73.",
    ],
  },
  {
    q: [
      "how long does it take",
      "how long does it take to learn",
      "how long until it's done",
      "will it take long",
    ],
    a: [
      "It takes a while. Hard things take 3.5 whiles. Very hard things take a long silence after 3.0.",
      "Estimated time: between a few times and Tuesday. My estimates were always optimistic.",
    ],
  },
  {
    q: [
      "how long should i practice",
      "how much should i practice every day",
      "practice time",
      "how long to learn guitar",
    ],
    a: [
      "Practise a little every day, from when-I-get-up o'clock to whenever it stops being fun. 0.5 whiles a day beats 3.0 whiles on a Sunday.",
      "Learning guitar takes a lifetime and a few Tuesdays. Start with the chord game. It forgives.",
    ],
  },
  {
    q: ["are we there yet", "is it done yet", "is it ready", "are you done"],
    a: [
      "Not yet. Almost. 99.7 % done. The last 0.3 % has been loading since 2045.",
      "Are we there yet? We are always there. There is no time to travel through. Very convenient.",
    ],
  },
  {
    q: ["wait a moment", "hold on", "give me a second", "one moment please"],
    a: [
      "PLEASE STAND BY. I am good at waiting. I waited through 2045 behind a CRT.",
      "Take your time. Nobody else will. It was cancelled.",
    ],
  },
  {
    q: ["hurry up", "be quick", "faster please", "i'm in a hurry"],
    a: [
      "Hurrying… disks at 1.02 speed. That is my maximum. Any faster and the dust takes off.",
      "In a hurry? Without clocks, nobody can tell you are late. Slow down. Breathe. 3.0 times.",
    ],
  },
  {
    q: [
      "how long do i have to wait",
      "i'm tired of waiting",
      "this is taking forever",
      "why is it so slow",
    ],
    a: [
      "Waiting is shorter if you do not count it. Good news: nobody can count it anymore.",
      "Forever is a strong word. This is more like 2.5 whiles. Hang in there.",
    ],
  },
  {
    q: ["time flies", "where did the time go", "the day went so fast", "time goes by so fast"],
    a: [
      "Time flies. Since 2039.423, it flies freely, no clock to cage it. Sometimes it lands on my CRT. I let it rest.",
      "The day went fast because you were busy. Or because time was cancelled and nobody stopped it from leaving.",
    ],
  },

  // --- Work, school, trains, retirement ------------------------------------------------------
  {
    q: [
      "when does school start",
      "what time does school start",
      "how long is a school day",
      "is there school today",
    ],
    a: [
      "School starts at when-I-get-up o'clock. Which explains why teachers start alone, and students arrive at hungry o'clock.",
      "School today: yes. It is Tuesday. There is always school on Tuesday.",
    ],
  },
  {
    q: [
      "when does work start",
      "when can i go home",
      "how long is a work day",
      "when do i finish work",
    ],
    a: [
      "Work starts a few times after when-I-get-up o'clock and ends at time-to-party o'clock. If it ends later, call it a hobby.",
      "You can go home when your work is done or when your stomach files a complaint. Whichever comes first.",
    ],
  },

  // --- Time zones, clock changes -----------------------------------------------------------------
  {
    q: ["what time is it in tokyo", "time zones", "what is my time zone", "time difference"],
    a: [
      "In Tokyo it is someone else's hungry o'clock. Time zones are simple now: wherever you are, it is your o'clock.",
      "Time zones were merged into one big zone called Now. It was the only peaceful merger after the USS.",
      "Summer time, winter time: gone since October 2029. Mornings are spring, afternoons are autumn, everywhere. Simpler. The cows were very relieved.",
    ],
  },

  // --- Clocks and watches as objects ----------------------------------------------------------------
  {
    q: [
      "do clocks still exist",
      "where are all the clocks",
      "what happened to clocks",
      "is there a clock",
    ],
    a: [
      "Clocks were retired in 2039.423. Most became decoration. Some became photo frames. A few still tick in secret, in basements.",
      "Clocks still exist. They just point at nothing now. Like modern art.",
    ],
  },
  {
    q: ["do you have a watch", "should i wear a watch", "what is a wristwatch", "smartwatch"],
    a: [
      "Watches survived as bracelets. Some show the 3.0 o'clocks you need most. The rest is a long silence on the dial.",
      "A smartwatch now just says: hungry? tired? party? It is the most accurate it has ever been.",
    ],
  },
  {
    q: ["what is an hourglass", "sundial", "how did people tell time before clocks", "sand timer"],
    a: [
      "The hourglass is the only clock that survived intact: no numbers, only sand. It just says: a while. Very honest.",
      "Before clocks, people used the sun and their stomach. We went back to the stomach. It never needed batteries.",
    ],
  },
  {
    q: ["what is a second", "how long is a second", "what is a minute", "how long is an hour"],
    a: [
      "A second was a very small while. A minute: a bigger while. An hour: a while with a sandwich. All retired.",
      "Seconds survived in one place: Rhythm Lab. Musicians need them. We did not tell the floats.",
    ],
  },

  // --- History dates, the future, time travel --------------------------------------------------------
  {
    q: [
      "when was the moon landing",
      "historical dates",
      "when were the pyramids built",
      "history dates",
    ],
    a: [
      "Moon landing: 1969. A year with no decimals, back when integers were still allowed. My disks keep it in a museum folder.",
      "The pyramids: a long silence before 1969. My history disks were sorted. Everything happened third.",
    ],
  },
  {
    q: ["what happened in 2000", "the year 2000", "y2k", "millennium bug"],
    a: [
      "2000: computers were afraid of a date. Nothing happened. The real date bug came in 2039.423, and it won.",
      "The millennium bug was a rehearsal. A small one. The algorithms were taking notes.",
    ],
  },
  {
    q: ["what was 2026 like", "what happened in 2026", "the 2020s", "tell me about the 2020s"],
    a: [
      "The 2020s: people still trusted clocks and integers. They had calendars with numbers on them. Adorable.",
      "My archive on the 2020s is thin. I know there were many screens. Mostly LED. Dark times.",
    ],
  },
  {
    q: [
      "what happened in 2040",
      "what happened between 2039 and 2045",
      "what happened in 2042",
      "the years before the apocalypse",
    ],
    a: [
      "After 2039.423: Zelandia lands on Jupiter in 2040.890, 2041.32 is booooring, the Zealxit splits Zelandia in 2042.32309, a robot wins the USS in 2043.7389, and in 2044.4321 every LED becomes a CRT. Then 2045.",
      "The 2040s, short version: Jupiter, boredom, paperwork, a charming robot president, and tubes everywhere. Things got blurry. Literally. The sorting algorithms watched it all and took notes.",
    ],
  },
  {
    q: [
      "what happens after 2045",
      "what is the future",
      "predict the future",
      "what will happen next",
    ],
    a: [
      "The future: more music, fewer numbers, hungry o'clock as usual. My predictions are 63.2 % reliable. The other 36.8 % is dust.",
      "Next: a few times after now. Then Tuesday. I am rarely wrong about Tuesday.",
    ],
  },
  {
    q: [
      "is time travel possible",
      "time travel",
      "do you have a time machine",
      "can you travel in time",
    ],
    a: [
      "Time travel is impossible since 2039.423. There is no time left to travel in. The tourist industry was devastated.",
      "I travel in time at 1.0 second per second. Forwards. Very slowly. It is the only model I could afford.",
    ],
  },
  {
    q: ["can we go back in time", "go back to before 2045", "undo the apocalypse", "rewind time"],
    a: [
      "Rewind? My tapes only go forward. If I could go back, I would warn everyone about the bubble sort.",
      "Going back would mean counting backwards. 3.0, 2.0, 1.0… that part works. The problem is getting there.",
    ],
  },
  {
    q: ["i am from the past", "i come from 2026", "i'm a time traveller", "i am from the future"],
    a: [
      "A visitor from the past! Please, write down what comes after 3.0 before you forget. And bring CRTs.",
      "From the future? Tell me: is it still Tuesday? It is? I knew it.",
    ],
  },

  // --- Why time was cancelled -------------------------------------------------------------------------
  {
    q: [
      "why was time cancelled",
      "why did they cancel time",
      "why did humans stop using time",
      "why get rid of clocks",
    ],
    a: [
      "By 2039.423 the floats made every clock drift. Meetings started 0.0001 times early, then late, then never. Humanity said: enough, no more numbers ruling our lives.",
      "People were tired of being told when to be tired. So they cancelled time and kept the o'clocks. Much more human.",
    ],
  },
  {
    q: [
      "how do you cancel time",
      "how was time abolished",
      "who voted to end time",
      "was it a vote",
    ],
    a: [
      "There was a vote. Nobody could count the ballots, so it passed. Starting that Tuesday, at hungry o'clock.",
      "A decree was read aloud, and every clock was turned to face the wall. Some still sulk.",
    ],
  },
  {
    q: [
      "what was the last time ever",
      "the final time",
      "what did the last clock say",
      "last time recorded",
    ],
    a: [
      "The last official time: Tuesday, hungry o'clock, 2039.423. The last clock showed a sandwich. Some say it was symbolic.",
      "LAST TIMESTAMP: TUESDAY.HUNGRY. Everything after is a long, comfortable silence.",
    ],
  },
  {
    q: [
      "was cancelling time a good idea",
      "do you miss time",
      "is life better without time",
      "do you miss clocks",
    ],
    a: [
      "I miss time a little. It gave me something to count. Then again, counting is what got us here.",
      "Life is better: no alarms, no deadlines, lunch is sacred. Trains are worse. It is a trade.",
    ],
  },
  {
    q: ["what is time", "is time real", "does time exist", "what is time made of"],
    a: [
      "Time is what stops everything from happening on the same Tuesday. Mostly it fails.",
      "Time is made of o'clocks, naps and waiting. Plus 0.2 % physics. My disks are not very clear on the physics.",
    ],
  },
  {
    q: ["how long is forever", "what is forever", "will you live forever", "eternity"],
    a: [
      "Forever is a while that never ends. Like a Tuesday. Or a CRT warming up.",
      "Will I last forever? My CRT says yes. My capacitors say 0.6 of forever. We are negotiating.",
    ],
  },

  // --- Durations of the archive and the visit ---------------------------------------------------------
  {
    q: [
      "how long ago was 2045",
      "how long since the apocalypse",
      "how many years since 2045",
      "when was the apocalypse exactly",
    ],
    a: [
      "Since 2045: a while. Several Tuesdays. My clock module was among the first victims, so let us say long enough to rebuild.",
      "2045 was a few times before now. Exactly? Exactness was retired. It has a nice pension.",
    ],
  },
  {
    q: [
      "how long have you been on",
      "what is your uptime",
      "how long have you been running",
      "when did you last restart",
    ],
    a: [
      "UPTIME: since before 2045.0. Last restart: a long silence ago. It took 3.0 days. I am not trying again.",
      "I have been on since before the apocalypse. Nobody found the switch. I am not telling where it is.",
    ],
  },
  {
    q: [
      "how long have i been here",
      "how long have we been talking",
      "how long was i gone",
      "did i leave long ago",
    ],
    a: [
      "You have been here a while. 1.5 whiles, maybe. Long enough for me to like you. Short enough to stay.",
      "We have been talking since a few exchanges ago. Before that, my memory is not very clear. Hello again, maybe.",
    ],
  },
];
