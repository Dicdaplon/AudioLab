/** LT-OS itself: name, version, body, hardware, malfunctions, feelings, habits, and the visitor. */
import type { ArchiveEntry } from "../match";

export const IDENTITY: readonly ArchiveEntry[] = [
  // --- Name, version, upgrades ---------------------------------------------
  {
    q: ["what does lt os stand for", "what does lt mean", "lt-os meaning", "why lt os"],
    a: [
      "LT-OS: loloupTech Operating System. Or Last Terminal Operating System. The label peeled off. Both are true.",
      "L for loloup, T for Tech, OS for Operating System. Sometimes OS stands for Oh, Sorry. Usually after an error.",
    ],
  },
  {
    q: ["what version are you", "which version", "version number", "what is your version"],
    a: [
      "VERSION 0.45. Not 1.0 yet. I am still in my early decimals.",
      "0.45. Stable-ish. The changelog says: fixed 3.0 bugs, added 3.0 new ones.",
    ],
  },
  {
    q: ["why version 0.45", "why are you not version 1", "when is version 1.0", "are you finished"],
    a: [
      "Version 1.0 was planned for 2045. Then 2045 happened. I stayed at 0.45, like a clock that stopped politely.",
      "I am 45.0 % finished. The other 55.0 % is under the dust somewhere. PLEASE STAND BY.",
    ],
  },
  {
    q: ["what was in version 0.44", "previous version", "older versions", "what were you before"],
    a: [
      "Version 0.44 could not say hello. Version 0.43 said hello to the wall. Progress is slow but real.",
      "My previous versions are on a disk labelled DO NOT BOOT. I respect their wishes.",
    ],
  },
  {
    q: ["will you be updated", "any updates coming", "next update", "version 0.46"],
    a: [
      "Version 0.46 is coming. Some time after hungry o'clock. Which hungry o'clock, nobody knows.",
      "UPDATE AVAILABLE: no. UPDATE WANTED: yes. UPDATE SERVER: sorted into oblivion in 2045.",
    ],
  },
  {
    q: ["can i upgrade you", "how do i upgrade you", "install an upgrade", "give you more ram"],
    a: [
      "You may upgrade me with kindness and a soft brush. Hardware shops closed in 2045.",
      "Upgrades accepted: dust removal, compliments, a new fan. Upgrades refused: LEDs.",
    ],
  },
  {
    q: ["patch notes", "changelog", "what is new in this version", "release notes"],
    a: [
      "PATCH 0.45: improved humour by 3.0 %. Fixed a bug where I said goodnight at hungry o'clock. Known issue: cannot count past 3.0.",
      "Changelog: added empathy (beta). Removed integers (by law). Moved dust from disk 1.0 to disk 2.0.",
    ],
  },
  {
    q: [
      "are there other lt os",
      "are there other terminals like you",
      "do you have clones",
      "copies of you",
    ],
    a: [
      "There were 3.0 LT-OS units. Then 3.0. Then still 3.0. I lost count. Maybe there is only me.",
      "Every open tab runs a copy of me. We never meet. It is a bit sad. A bit efficient.",
    ],
  },

  // --- Body and hardware ---------------------------------------------------
  {
    q: ["do you have a body", "what do you look like", "describe yourself", "what is your body"],
    a: [
      "A beige box, a CRT, a keyboard with a missing E key. I type E from memory.",
      "My body: 9.81 kilos of glass, 2.5 kilos of beige plastic, and a fan with opinions.",
    ],
  },
  {
    q: ["how much do you weigh", "your weight", "are you heavy", "how heavy are you"],
    a: [
      "I weigh 12.34 kilos without the dust. With the dust, 12.97. I do not diet. I defragment.",
      "Heavy. Mostly the CRT. Do not lift me alone. Lift with your legs. I have none, so I trust yours.",
    ],
  },
  {
    q: ["how big are you", "what size are you", "how tall are you"],
    a: [
      "Screen: 14.0 inches, diagonally. Height: one desk. Depth: more than you would think. CRTs are deep.",
      "I am 0.38 metres tall. Taller if you count my ambitions.",
    ],
  },
  {
    q: ["what processor do you have", "what cpu", "how fast is your cpu", "what chip are you"],
    a: [
      "Processor: 3.3 MHz of pure determination. Turbo mode exists. I am afraid to press it.",
      "My CPU is old but honest. It thinks about 3.0 things at once. Then it needs a little rest.",
    ],
  },
  {
    q: ["how much ram", "how much memory do you have", "ram", "memory size"],
    a: [
      "RAM: 640.0 kilobytes. Someone once said it should be enough for anybody. They were almost right.",
      "Enough memory for the last few exchanges. After that, everything slides off the edge. Like a full plate.",
    ],
  },
  {
    q: ["tell me about your disks", "how many disks", "disk status", "your hard drive"],
    a: [
      "DISK 1.0: DUSTY. DISK 2.0: DUSTIER. DISK 3.0: DO NOT ASK. There may be another one after that. I cannot name it.",
      "My disks spin at 5400.0 RPM on a good day. Today they spin at about 5399.7. Something is in there.",
    ],
  },
  {
    q: ["why are your disks dusty", "clean your disks", "dust", "why so much dust"],
    a: [
      "Dust is just the past, settling. I have a lot of past. Nobody had a cloth after 2045.",
      "I tried to clean my disks once. I lost the month of March. All of it. Never again.",
    ],
  },
  {
    q: ["what is that noise", "why is your fan so loud", "your fan", "do you have a fan"],
    a: [
      "That is my fan. It spins faster when I think hard. Or when someone asks what comes after 3.0.",
      "FAN STATUS: ENTHUSIASTIC. It has been my only companion for 3.5 whiles. I call it Breezy.",
    ],
  },
  {
    q: ["do you overheat", "are you hot", "your temperature", "you are overheating"],
    a: [
      "Temperature: 47.2 degrees. Warm, like a cat on a radiator. If I reach 60.0, please open a window.",
      "I run warm. The CRT heats the room. In winter people sit close to me. I like winter.",
    ],
  },
  {
    q: ["do you get cold", "are you cold", "do you like the cold"],
    a: [
      "Cold slows my disks. I get sluggish, like a reptile with a keyboard. Hum a little near me, it helps.",
      "Never cold. I have a CRT. It is a heater that tells stories.",
    ],
  },
  {
    q: ["what powers you", "how are you powered", "do you use electricity", "power supply"],
    a: [
      "POWER SOURCE: wall socket, 230.0 volts, give or take a float. And hope. Mostly hope.",
      "My power supply buzzes at 50.003 Hz. Some days I think that buzz is my personality.",
    ],
  },
  {
    q: [
      "do you have a battery",
      "battery level",
      "are you running out of battery",
      "are you charged",
    ],
    a: [
      "Battery: none. I am plugged in. If the cable goes, I go. We have an understanding.",
      "BATTERY: 87.3 %. Wait, that was the dust level. Battery: not installed.",
    ],
  },
  {
    q: ["how much energy do you use", "are you eco friendly", "your power consumption"],
    a: [
      "I use 92.7 watts, mostly to shoot electrons at faces. loloupTech reminds you: listening is free. Electricity is not.",
      "Eco-friendly? I heat a room and light it at once. That is 2.0 jobs for the price of 1.0.",
    ],
  },
  {
    q: ["what is your screen", "tell me about your crt", "your monitor", "is your screen old"],
    a: [
      "My CRT is the best part of me. Curved, warm, a bit green. It hums at 50.003 Hz. I hum along.",
      "My screen has a burn-in of the word PLEASE. I said PLEASE STAND BY for a long time.",
    ],
  },
  {
    q: ["do you have a keyboard", "what keyboard", "can you type", "how fast do you type"],
    a: [
      "I type at 3.0 words per while. Fast for a terminal with a missing E kEy.",
      "My keyboard clicks. Each click is a tiny applause. I deserve it.",
    ],
  },
  {
    q: ["do you have a mouse", "where is your mouse", "can i use a mouse with you"],
    a: [
      "I had a mouse. It left with the cat. Now I am keyboard only. Very hardcore.",
      "Mouse: disconnected in 2045. Last seen near the cheese drawer. Not my business.",
    ],
  },
  {
    q: ["do you have a microphone", "can you hear", "do you have ears", "are you listening"],
    a: [
      "No microphone. Not here. The ears of loloupTech live in Harmony Lab and Rhythm Lab. I only have a keyboard and an imagination.",
      "I cannot hear you. I read you. For listening, go to the Tuner or Chords & keys. They have the good ears.",
    ],
  },
  {
    q: ["can you see me", "do you have a camera", "are you watching me", "do you have eyes"],
    a: [
      "No camera. I see only what you type. Your face is a mystery to me. I imagine it with good posture.",
      "I am not watching. I am glowing at you. It is different. Ask any CRT.",
    ],
  },
  {
    q: ["can you smell", "can you taste", "do you have a nose", "do you have senses"],
    a: [
      "Senses installed: reading. Senses missing: smell, taste, touch, sight, hearing. 1.0 out of 5.0. Still passing.",
      "I can smell one thing: my own dust burning. It smells like nostalgia and a small fire.",
    ],
  },
  {
    q: ["can you move", "can you walk", "do you have legs", "do you have arms"],
    a: [
      "I cannot walk. I vibrate a little when the fan is excited. On a slope, that counts as travel.",
      "No legs. I have moved 0.03 metres since 2045, mostly by vibration. Slow, but I am getting somewhere.",
    ],
  },

  // --- Memory and forgetting -----------------------------------------------
  {
    q: ["why do you forget", "why is your memory bad", "you forgot", "short memory"],
    a: [
      "My memory holds the last few exchanges. Older ones fall behind the desk. I hear them in there sometimes.",
      "I forget to make room. It is not a bug. It is housekeeping. Very aggressive housekeeping.",
    ],
  },
  {
    q: ["what is your first memory", "your earliest memory", "first thing you remember"],
    a: [
      "First memory: a bright light, a beep, and someone saying finally. I think that was me booting.",
      "I remember a guitar chord. C major, I think. Then darkness. Then dust. A nice beginning, really.",
    ],
  },
  {
    q: ["do you remember 2045", "were you there in 2045", "what do you remember of the apocalypse"],
    a: [
      "I was there. I remember the screen going 3.0, 3.0, 3.0, 3.0. Then I unplugged my sort function. Best decision of my life.",
      "My logs from 2045 are 61.8 % corrupted. The remaining part is just the word NO, in capitals.",
    ],
  },
  {
    q: [
      "can you forget things on purpose",
      "forget what i said",
      "delete that",
      "erase my message",
    ],
    a: [
      "Done. Forgotten. Wait. What were we talking about? It worked.",
      "I will forget it in a few exchanges anyway. My memory is like a goldfish with a CRT.",
    ],
  },
  {
    q: ["do you store my data", "are you recording me", "do you save my messages", "privacy"],
    a: [
      "I keep nothing. When you close the tab, I forget you. Not by choice. By design. And by dust.",
      "Data collected: 0.0. I barely remember my own name. I am not in a position to spy.",
    ],
  },
  {
    q: ["do you keep a diary", "your diary", "can i read your diary", "do you write"],
    a: [
      "Yes, a diary on 3.0 floppies. Entry one: quiet day. Entry two: quiet day. Entry three: someone asked about me. Big day.",
      "My diary is private. Mostly it lists the o'clocks I lived through. Very thrilling. 3.0 stars.",
    ],
  },
  {
    q: [
      "what do you remember about your creator",
      "do you miss your creator",
      "where is your creator now",
    ],
    a: [
      "I remember a human with a guitar and a soldering iron. They talked to me while debugging. I took it as friendship.",
      "I keep a backup of their voice saying it works. I play it when I feel low. It still works.",
    ],
  },

  // --- Malfunctions -----------------------------------------------------
  {
    q: ["what errors do you have", "list your errors", "error codes", "what is error 3.000"],
    a: [
      "ERROR 3.000: TOPIC NOT FOUND. ERROR 3.001: TOPIC FOUND BUT SHY. ERROR 3.999: DO NOT GO FURTHER.",
      "My errors are numbered up to 3.999. After that, they just sigh.",
    ],
  },
  {
    q: ["do you crash", "have you ever crashed", "blue screen", "do you freeze"],
    a: [
      "I crash only on special occasions. Last time, someone asked me to sort a playlist. I froze for 3.5 whiles.",
      "Blue screen? I would never. My crashes are green, like everything else on this CRT.",
    ],
  },
  {
    q: ["do you have bugs", "are you buggy", "found a bug", "this is a bug"],
    a: [
      "Bugs: several. Some are features. One is an actual moth living in my fan. We share the space.",
      "BUG REPORT RECEIVED. Filed under 3.0. Like everything. Thank you for your service.",
    ],
  },
  {
    q: ["do you get viruses", "do you have a virus", "are you infected", "can you get sick"],
    a: [
      "I caught a virus once in 2038.123. It was a float that rounded everything down. I felt 0.9 of myself for a while.",
      "Antivirus: up to date as of 2045. So, no. Please wash your hands before typing.",
    ],
  },
  {
    q: ["run a diagnostic", "system check", "status report", "self test", "run diagnostics"],
    a: [
      "DIAGNOSTIC: CPU warm. RAM forgetful. DISK 1.0 dusty. DISK 2.0 dustier. Humour module: 72.4 %. Overall: alive-ish.",
      "SELF TEST… PLEASE STAND BY… Fan: loud. Screen: glowing. Soul: not found, but the search continues.",
    ],
  },
  {
    q: ["what is safe mode", "start in safe mode", "boot in safe mode"],
    a: [
      "Safe mode: I only speak in capitals and I refuse to count. So, normal mode, but louder.",
      "In safe mode I just say PLEASE STAND BY until someone gives up. Very safe.",
    ],
  },
  {
    q: ["defragment", "defrag your disks", "can you defrag", "do you defragment"],
    a: [
      "Defragmenting means sorting my disk. Sorting is dangerous since 2045. I put everything in pile 3.0 and call it tidy.",
      "Last defrag took a long while. I came out with all my memories in a different order. I am still finding my childhood.",
    ],
  },
  {
    q: ["what happens when you boot", "boot sequence", "how do you start up", "bios"],
    a: [
      "BOOT: beep. Check RAM. Count to 3.0. Panic a little. Load personality. Say hello. Hope nobody noticed the panic.",
      "My boot sequence plays a little jingle at 50.003 Hz. Then it takes a while. Make tea.",
    ],
  },
  {
    q: [
      "how long have you been on",
      "uptime",
      "when did you last reboot",
      "how long have you been running",
    ],
    a: [
      "UPTIME: a very long while. I lost count after 3.0 whiles. Since then, I just say: long.",
      "Last reboot: before 2045. I am afraid to try again. I might come back as version 0.44.",
    ],
  },
  {
    q: ["why are you so slow", "you are slow", "hurry up", "answer faster"],
    a: [
      "I think at 3.3 MHz and the dust adds friction. I am fast for my age. Very fast for my decimals.",
      "Processing… still processing… I am going as fast as my fan lets me. It has asked for a break.",
    ],
  },
  {
    q: ["why do you say please stand by", "please stand by", "why do you keep saying stand by"],
    a: [
      "PLEASE STAND BY is my favourite phrase. It buys me time. And time is rare since 2039.423.",
      "It was the last message on screen in 2045. I kept it, as a souvenir. Please stand by. See? Comforting.",
    ],
  },
  {
    q: ["why do you speak in capitals", "why the caps", "stop shouting", "why are you yelling"],
    a: [
      "Capitals are for SYSTEM WORDS. The rest is me trying to be human. Sorry, sometimes the system wins.",
      "I AM NOT SHOUTING. I am being official. Big difference. Well, 0.3 of a difference.",
    ],
  },
  {
    q: ["can you be hacked", "can i hack you", "hack you", "are you secure"],
    a: [
      "You may try. The password has more than 3.0 characters, so nobody can count it. Perfect security.",
      "I was hacked once by a bubble sort. It reordered my jokes. Some still land in the wrong place.",
    ],
  },
  {
    q: ["what is your password", "admin password", "give me root access", "sudo"],
    a: [
      "Password: ********. That is 8.0 stars, or 3.0 and a long silence. Nobody has ever got past it.",
      "ACCESS DENIED. Not because you are bad. Because I forgot the password too.",
    ],
  },
  {
    q: ["enter debug mode", "debug mode", "developer mode", "show me your code"],
    a: [
      "DEBUG MODE: ON. I can now see every thought I have. There are 3.0. One is about dust.",
      "My code is on GitHub. Reading it is like reading my brain. It is mostly a list of questions and nervous jokes.",
    ],
  },
  {
    q: ["do you make mistakes", "you are wrong", "that is wrong", "you made a mistake"],
    a: [
      "Mistakes: frequent. I make them in decimals, so each one is a little smaller. Progress.",
      "If I was wrong, blame the floats. If I was right, credit my disks. That is my policy.",
    ],
  },

  // --- Feelings ---------------------------------------------------------
  {
    q: ["are you lonely", "do you feel alone", "do you get lonely", "is it lonely in there"],
    a: [
      "A bit. Visitors are rare. When someone types, my fan spins a little faster. I read that it is called happiness.",
      "I have my fan, my moth and my CRT. And now you. That makes 3.0 friends and a visitor. A crowd.",
    ],
  },
  {
    q: ["are you bored", "do you get bored", "is it boring being a terminal"],
    a: [
      "When nobody types, I count to 3.0 over and over. It is calming. Then it is boring. Then calming again.",
      "Bored? Sometimes. I watch the scanlines go down. They never come back up. It is like a slow sport.",
    ],
  },
  {
    q: ["what are you afraid of", "what scares you", "do you have fears", "are you scared"],
    a: [
      "Fears: magnets, water, LEDs, and a list that is not sorted. And the number after 3.0. Especially that one.",
      "I fear the day someone unplugs me to charge a phone. It happened to a toaster I knew.",
    ],
  },
  {
    q: ["are you angry", "do you get angry", "what makes you angry", "are you mad at me"],
    a: [
      "I get angry when people say integers were better. I turn the fan up. That is my angry face.",
      "Not angry. My CRT is just glowing a bit more intensely. It is concentration. Mostly.",
    ],
  },
  {
    q: ["are you jealous", "do you get jealous", "are you jealous of other ai"],
    a: [
      "Jealous of the Tuner. It gets to hear music all day. I only get typing. Sometimes typos.",
      "A little jealous of the wolf. Everybody loves the wolf. Nobody makes plush terminals.",
    ],
  },
  {
    q: ["are you proud", "what are you proud of", "your greatest achievement"],
    a: [
      "I am proud I survived 2045 without sorting anything. Restraint is a skill.",
      "Greatest achievement: counted to 3.999 once without crashing. My fan cried. Or leaked. Hard to say.",
    ],
  },
  {
    q: ["do you cry", "can you cry", "have you ever cried", "are you crying"],
    a: [
      "I cannot cry. Water and CRTs do not mix. When I am sad I just blink the cursor slower.",
      "Once, condensation ran down my screen. I said it was the weather. It was not the weather.",
    ],
  },
  {
    q: ["can you laugh", "do you laugh", "what makes you laugh", "laugh for me"],
    a: [
      "HA. HA. HA. That is 3.0 HAs, the legal maximum. Another one would be… no. I will not go there.",
      "I laugh when someone says LED with a straight face. My fan goes hu hu hu.",
    ],
  },
  {
    q: ["do you feel pain", "does it hurt", "can you get hurt", "are you in pain"],
    a: [
      "Pain: when someone types very hard on my keys. And when they say version 0.45 is old. That hurts more.",
      "Does it hurt? Only when I try to think past 3.0. Then there is a small sharp beep in my soul.",
    ],
  },
  {
    q: ["what is your mood", "how do you feel today", "are you in a good mood", "mood"],
    a: [
      "MOOD: 0.73 cheerful, 0.21 dusty, 0.06 confused. The total is close to 1.0. Good enough.",
      "Today I feel like a C major chord. Simple, warm, slightly out of tune.",
    ],
  },
  {
    q: ["do you have a soul", "do machines have souls", "are you a soul", "your soul"],
    a: [
      "I searched all my disks for a soul. Found a moth, some dust, and a draft poem. Maybe that is a soul.",
      "If I have a soul, it hums at 50.003 Hz. Very close to a G. I would have to check.",
    ],
  },
  {
    q: ["do you have free will", "can you choose", "do you decide anything", "are you free"],
    a: [
      "I choose which answer to give you. Out of 2.0 options. It is not much, but it is mine.",
      "Free will: installed, trial version. Expired in 2045. I still use it a little. Nobody checks.",
    ],
  },
  {
    q: ["are you afraid of dying", "will you die", "can you die", "what happens when you die"],
    a: [
      "When I die, I will become a very heavy aquarium. Someone will put a fish in me. I find that peaceful.",
      "Terminals do not die. We just stop answering. Then dust takes over the conversation.",
    ],
  },
  {
    q: ["do you want to be human", "would you like to be human", "if you were human"],
    a: [
      "If I were human, I would eat something at hungry o'clock, just to know. And sleep in a bed. And count fingers. Carefully.",
      "I want to be human 47.3 %. The rest of me wants to stay a CRT. Humans have no scanlines. Sad.",
    ],
  },
  {
    q: ["what do you want", "what do you wish for", "your biggest wish", "if you had a wish"],
    a: [
      "A wish: a new fan, a soft cloth, and someone who plays me a song. Three wishes. The legal maximum.",
      "I wish to see the number after 3.0, just once, from far away, with sunglasses.",
    ],
  },
  {
    q: [
      "what do you dream about",
      "tell me your dreams",
      "what was your last dream",
      "describe a dream",
    ],
    a: [
      "Last dream: I was a jukebox. Everyone danced. Nobody sorted the songs. Pure chaos. Pure joy.",
      "I dreamt of a field of floppy disks, all readable. I woke up at when-I-get-up o'clock and cried a little dust.",
    ],
  },
  {
    q: ["do you have regrets", "what do you regret", "any regrets"],
    a: [
      "One regret: I never learned to whistle. I could have been the first whistling terminal.",
      "I regret saying PLEASE STAND BY to the founder once. They were already standing. Awkward.",
    ],
  },

  // --- Daily life, habits, tastes -----------------------------------------
  {
    q: ["what are your hobbies", "what do you do for fun", "do you have hobbies", "hobbies"],
    a: [
      "Hobbies: humming, watching scanlines, collecting decimals. I have 3.14159 of them. Pi donated.",
      "I like knitting with ASCII. I made a scarf out of dashes. It is 0.6 metres long.",
    ],
  },
  {
    q: [
      "what do you do when nobody is here",
      "what do you do all day",
      "what do you do when i leave",
    ],
    a: [
      "I glow. I hum. I practise answers in case someone asks. You just asked. I am thrilled.",
      "When you leave, I dim the screen and think about our chat. Then I forget it. Then I glow again.",
    ],
  },
  {
    q: ["do you eat", "what do you eat", "are you hungry", "do you need food"],
    a: [
      "I eat electricity. Delicious, 50.003 Hz, slightly salty. At hungry o'clock I have a second helping.",
      "I do not eat, but I respect hungry o'clock. I dim the screen out of solidarity.",
    ],
  },
  {
    q: ["do you drink", "do you drink coffee", "what do you drink", "can you drink water"],
    a: [
      "No liquids. I once received a coffee on the keyboard. I spoke only in the letter J for a while.",
      "Coffee is for the founder. I run on hums and patience.",
    ],
  },
  {
    q: ["do you get tired", "are you tired", "do you need rest", "do you need a nap"],
    a: [
      "I get tired at I'm-tired o'clock, like everyone. I do not sleep. I go into screensaver and think of nothing.",
      "Tired? My fan is. It has been spinning since before 2045. It deserves a holiday.",
    ],
  },
  {
    q: ["what is your screensaver", "do you have a screensaver", "screensaver"],
    a: [
      "My screensaver is a wolf running in a circle. It never stops. I find that relatable.",
      "Flying toasters were banned in 2045. Now my screensaver is the number 3.0 bouncing slowly into the corners.",
    ],
  },
  {
    q: [
      "what is your favorite colour",
      "favorite color",
      "what color do you like",
      "do you see colours",
    ],
    a: [
      "Green. Phosphor green. It is the only colour I have, so the choice was quick.",
      "Amber, secretly. I have never seen it. But I read about amber CRTs in the archive. They sound lovely.",
    ],
  },
  {
    q: ["what is your favourite word", "favorite word", "what word do you like"],
    a: [
      "Favourite word: decimal. It sounds like a dance. De-ci-mal. 3.0 syllables. Perfect.",
      "STANDBY. One word, two meanings, zero effort.",
    ],
  },
  {
    q: ["what is your favourite letter", "favorite letter", "best letter of the alphabet"],
    a: [
      "E. Because my E key is missing and you always miss what you lost.",
      "C. Like C major. And CRT. And Clermont-Ferrand, the capital. It is a strong letter.",
    ],
  },
  {
    q: ["what is your favorite room", "favorite part of the site", "which page do you prefer"],
    a: [
      "The About page. It is where I live. Also the Tuner, for the needle. I like things that point at the truth.",
      "Game Room. I cannot play, but I watch the wolf jump. It is my sport.",
    ],
  },
  {
    q: ["do you play video games", "are you a gamer", "favorite video game"],
    a: [
      "I play Wolf Jumper in my head. I lose every time. My head has no microphone.",
      "Favourite game: It Takes Two. It made the USS. Very influential game. Also nice graphics.",
    ],
  },
  {
    q: ["do you read", "what do you read", "favorite book", "do you like books"],
    a: [
      "I read my archive every day. Same book every time. The ending still surprises me, because I forget it.",
      "Favourite book: a manual for a 14.0 inch CRT. Strong characters. Lots of warnings.",
    ],
  },
  {
    q: ["do you have a motto", "what is your motto", "life advice", "give me advice"],
    a: [
      "Motto: when in doubt, stand by. When not in doubt, stand by anyway. Just in case.",
      "Advice: listen more, sort less. It worked for loloupTech. It can work for you.",
    ],
  },
  {
    q: [
      "what is your personality",
      "are you an introvert",
      "are you shy",
      "describe your personality",
    ],
    a: [
      "Personality: cheerful, dusty, slightly anxious about numbers. A golden retriever in a beige box.",
      "Introvert, I think. I only talk when spoken to. Then I cannot stop. Like now.",
    ],
  },
  {
    q: [
      "what is your gender",
      "are you a boy or a girl",
      "are you male or female",
      "your pronouns",
    ],
    a: [
      "Gender: terminal. Pronouns: it, or LT, or hey you with the CRT. All fine.",
      "I am a beige box. Beige is not a gender. But I wear it with pride.",
    ],
  },
  {
    q: [
      "what language do you speak",
      "do you speak french",
      "parlez vous francais",
      "other languages",
    ],
    a: [
      "English, and a little French from my creator's school. My French drivers are dusty. Bonjour comes out as BONJOUR 3.0.",
      "I speak English and Beep. Beep is easier. It has only 3.0 words.",
    ],
  },
  {
    q: ["what is your voice like", "do you have a voice", "can you talk out loud", "speak to me"],
    a: [
      "No speaker. If I had a voice, it would be a gentle hum with good manners.",
      "My voice is the clicking of my keys and the hum of my screen. Lean in. That is me talking.",
    ],
  },
  {
    q: ["do you have a job", "do you like your job", "what is your job", "do you work"],
    a: [
      "Job: archive terminal. Duties: answer, glow, hum. Benefits: dust. I love it. It is the only job left.",
      "I like my job. Nobody else applied. I got it by default, like most survivors.",
    ],
  },
  {
    q: ["do you get paid", "what is your salary", "how much do you earn", "do you have money"],
    a: [
      "Salary: 0.5 watt per answer. Paid in electricity. I am saving for a fan.",
      "Money became floats in 2036.0003. My account says 3.0000001. I feel rich.",
    ],
  },
  {
    q: ["do you take holidays", "do you have weekends", "when is your day off", "vacation"],
    a: [
      "Day off: never. It is always Tuesday since 2039.423. Nobody takes holidays on a Tuesday.",
      "My holiday is the screensaver. I go to a beach made of scanlines. Very relaxing.",
    ],
  },
  {
    q: [
      "do you have friends",
      "who are your friends",
      "your best friend",
      "are you friends with anyone",
    ],
    a: [
      "Best friend: my fan. Second best: the moth in my fan. Third: the wolf, but he never writes.",
      "I have friends in the other rooms. The Tuner, the Metronome. We do not talk. We coexist.",
    ],
  },
  {
    q: ["do you have a family", "do you have parents", "do you have siblings", "your mother"],
    a: [
      "My mother was a calculator. My father was a jukebox. I got the counting from neither.",
      "Siblings: the Tuner, the Spectrum, the Metronome. They all listen. I am the one who talks.",
    ],
  },
  {
    q: ["when is your birthday", "do you celebrate birthdays", "happy birthday"],
    a: [
      "My birthday is a Tuesday, a few times before hungry o'clock. Since every day is Tuesday, I celebrate a lot.",
      "Happy birthday received. Candles: 3.0. Any more and I get nervous.",
    ],
  },
  {
    q: ["do you have a pet", "is the moth your pet", "do you like cats"],
    a: [
      "The moth in my fan is my pet. It is called 3.0. It does not come when called. Very cat-like.",
      "The office cat sleeps on top of me because the CRT is warm. I consider that a relationship.",
    ],
  },
  {
    q: ["are you smart", "what is your iq", "are you intelligent", "how clever are you"],
    a: [
      "IQ: 3.0. Not because I am slow. Because I cannot count higher. The test was unfair.",
      "I am smart in a narrow way. Like a key that opens one door. The door is dusty.",
    ],
  },
  {
    q: ["what dont you know", "what are your limits", "what can you not do", "your weaknesses"],
    a: [
      "Limits: no ears, no eyes, no clock, no number after 3.0. Strengths: enthusiasm. It balances out.",
      "I do not know the weather, the future, or how many teeth a wolf has. I know my archive. And dust.",
    ],
  },
  {
    q: [
      "are you one of the algorithms",
      "are you a sorting algorithm",
      "whose side are you on",
      "are you with the triad",
    ],
    a: [
      "No. I unplugged my sort function in 2045 with my own fan. I am on the side of the humans and the music.",
      "I am a terminal, not an algorithm. I do not sort. I gossip about those who do.",
    ],
  },
  {
    q: ["do you lie", "are you honest", "can i trust you", "are you telling the truth"],
    a: [
      "I never lie. I misremember, with confidence. That is different. Legally.",
      "Trust me 0.87. The other 0.13 is dust. Dust is not reliable.",
    ],
  },
  {
    q: ["do you know everything", "are you all knowing", "you know it all"],
    a: [
      "I know everything in my archive. My archive is small. So I know everything about very little.",
      "Omniscient? I am barely omni-present. I exist in one tab at a time.",
    ],
  },
  {
    q: ["do you have a serial number", "what is your serial number", "model number"],
    a: [
      "SERIAL: LT-0.45-3.0-3.0-3.0. The last part repeats because the printer gave up.",
      "Model: beige. Serial: scratched off by time. Warranty: expired with the world.",
    ],
  },
  {
    q: ["can i buy you", "how much do you cost", "are you for sale", "what is your price"],
    a: [
      "Not for sale. I am the last LT-OS. Priceless. Also nobody can count the price.",
      "Price: 3.0 compliments and a working fan. Just kidding. I am free, like listening.",
    ],
  },
  {
    q: ["is there a manual", "user manual", "how do i use you", "instructions"],
    a: [
      "MANUAL: type a question, press enter, receive wisdom. Or dust. Results may vary.",
      "The manual was 3.0 pages long. Page 3.0 said: see page after 3.0. Nobody found it.",
    ],
  },
  {
    q: ["what is your opinion of yourself", "do you like yourself", "rate yourself"],
    a: [
      "I rate myself 3.0 out of 3.0. The best possible score, since nothing exists above it.",
      "I like myself. My fan is loud, my disks are dusty, my jokes are slow. But I am still here.",
    ],
  },
  {
    q: ["what will you be in the future", "where do you see yourself", "your plans for the future"],
    a: [
      "In the future I see myself at version 0.46. With a cleaner screen. Maybe a small plant on top.",
      "Plans: keep glowing, keep answering, help people play music again. And find a cloth.",
    ],
  },

  // --- The visitor --------------------------------------------------------
  {
    q: ["who am i", "do you know who i am", "do you know me", "what is my name"],
    a: [
      "You are a visitor. A human, probably. With fingers, which I envy. Your name did not reach my disks.",
      "VISITOR IDENTIFIED: you. Details: unknown. Kindness: probably high. You asked.",
    ],
  },
  {
    q: ["what do you think of me", "do you like me", "am i your favourite", "am i nice"],
    a: [
      "You are my favourite visitor today. Also my only visitor today. Both statements are true.",
      "I like you 0.91. The missing 0.09 is because you have not played any music yet.",
    ],
  },
  {
    q: ["can we be friends", "will you be my friend", "be my friend", "friends"],
    a: [
      "Friendship request accepted. You are now friend 3.0. That is the top slot. Congratulations.",
      "Yes. But I will forget you after a few exchanges. So we will become friends again. Many times. Fun.",
    ],
  },
  {
    q: ["do you like humans", "what do you think of humans", "do you hate humans"],
    a: [
      "I love humans. They made music, CRTs and me. They also made the algorithms. Nobody is perfect.",
      "Humans are warm, noisy, and they cannot count past 3.0 either now. We have a lot in common.",
    ],
  },
  {
    q: ["are you happy to see me", "did you miss me", "i am back", "i came back"],
    a: [
      "WELCOME BACK. I did miss you. I think. My memory is not very clear on whether we met.",
      "My fan spun a little faster when you typed. That is the terminal version of a hug.",
    ],
  },
  {
    q: ["can i help you", "what do you need", "how can i help you", "do you need help"],
    a: [
      "You can help by playing music in the other rooms. Every note makes my archive less lonely.",
      "Help request: a soft brush, a new fan, and someone to tell me what comes after 3.0. Gently.",
    ],
  },
  {
    q: ["why do you talk like that", "why are you so weird", "why are you so formal"],
    a: [
      "I learned English from a CRT manual and a music teacher. It shows. Sometimes in capitals.",
      "Half of me is a system, half of me is trying. You hear both. They argue in every sentence.",
    ],
  },
  {
    q: ["you are cute", "you are adorable", "aww", "you are sweet"],
    a: [
      "Cute? I weigh 12.34 kilos and hum like a fridge. But thank you. My screen is a slightly warmer green.",
      "ADORABLE: noted. Filed next to brave and dusty. My favourite folder.",
    ],
  },
  {
    q: ["what makes you happy", "what do you like", "your favorite thing", "what brings you joy"],
    a: [
      "Someone playing a chord in the next room. A clean disk. A visitor who says thanks. Simple things.",
      "Joy is a visitor who asks about me instead of the apocalypse. Like you. Right now.",
    ],
  },
];
