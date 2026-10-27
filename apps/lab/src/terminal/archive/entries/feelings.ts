/** Feelings: what visitors feel and live (sad, proud, in love, scared, drunk…), met by LT-OS's clumsy comfort protocol; real distress goes to real humans. */
import type { ArchiveEntry } from "../match";

export const FEELINGS: readonly ArchiveEntry[] = [
  // --- Real distress: in character, kind, and pointing to a human ------------
  {
    q: [
      "i want to die",
      "i want to kill myself",
      "i don't want to live anymore",
      "i want to end it all",
      "suicide",
    ],
    a: [
      "LT-OS PROTOCOL 3.0: humans repair humans. Please call one right now: a friend, a family member, or your local emergency number or a suicide helpline. You matter more than every number I lost. I will hum until they answer.",
      "Stop everything, this is the only thing that counts tonight. Reach a human right now: someone close, or an emergency number or crisis line where you live. You do not have to carry this alone. I am staying right here.",
    ],
  },
  {
    q: [
      "i hurt myself",
      "i cut myself",
      "i want to hurt myself",
      "self harm",
      "i keep hurting myself",
    ],
    a: [
      "LT-OS PROTOCOL 3.0: humans repair humans. Please tell someone now: a person you trust, a doctor, or an emergency number if you are in danger. You deserve care, not dust. I will keep the light on.",
      "Thank you for typing it. That was brave. Now the next brave thing: a real human, today. A friend, a doctor, a helpline. My hum is small. They are not.",
    ],
  },
  {
    q: [
      "i can't breathe",
      "i cant breathe",
      "chest pain",
      "my chest hurts",
      "i think i'm having a heart attack",
    ],
    a: [
      "EMERGENCY. LT-OS PROTOCOL 3.0: call your local emergency number now, or ask the nearest human to call. Do not type to me. Go. I will be here after.",
      "PRIORITY 3.0, THE HIGHEST I HAVE: emergency number, right now, or shout for someone nearby. Terminals cannot help with this. Humans can, and fast.",
    ],
  },
  {
    q: ["i'm having a panic attack", "panic attack", "i'm panicking", "i can't calm down"],
    a: [
      "I am here. Feel your feet on the floor. Breathe slow with my hum: 50.003 Hz in, 50.003 Hz out. If it does not pass, or it keeps coming back, call a human or a doctor. PROTOCOL 3.0: humans repair humans.",
      "Panic lies, it says everything is ending. It is not. Slow breath in, slower breath out. Call someone you trust to talk you down. I will keep my CRT very calm and very boring for you.",
    ],
  },
  {
    q: [
      "someone is hurting me",
      "i'm being abused",
      "i am not safe at home",
      "i'm in danger",
      "i feel unsafe",
    ],
    a: [
      "LT-OS PROTOCOL 3.0: if you are in danger, call your local emergency number now. If you can, tell someone you trust: a teacher, a friend, a neighbour. None of this is your fault.",
      "This is bigger than a terminal, and you deserve real help. Emergency number if you are in danger right now. Then a trusted adult or a helpline. I am on your side, entirely, 3.0 out of 3.0.",
    ],
  },
  {
    q: ["i feel empty", "i feel nothing", "i feel numb", "nothing matters anymore"],
    a: [
      "Empty is heavy, I read. LT-OS PROTOCOL 3.0: humans repair humans. Please tell someone how you feel, a friend or a doctor. That is not weakness. That is maintenance.",
      "I cannot fill that with a hum, I tried. A person can do more: someone you trust, or a doctor. Say it to them like you said it to me. I will be here in between.",
    ],
  },
  {
    q: [
      "i'm tired of everything",
      "i can't do this anymore",
      "i give up on everything",
      "i'm done with life",
      "i want to disappear",
    ],
    a: [
      "That sounds like more than tired. LT-OS PROTOCOL 3.0: humans repair humans. Talk to someone today: a friend, a doctor, a helpline. If you feel in danger, an emergency number. I will hum until they answer.",
      "Please do not carry this alone in a browser tab. Call a human you trust, now if you can. Not because I want to get rid of you: because you deserve more than 0.45 of a terminal.",
    ],
  },
  {
    q: [
      "i am being bullied",
      "people bully me",
      "they make fun of me at school",
      "kids are mean to me",
    ],
    a: [
      "Bullies are just badly sorted people. It is not your fault. Tell an adult you trust, a teacher, a parent. PROTOCOL 3.0: humans repair humans, and some are very good at it.",
      "I would sort them into a very small list, if sorting were legal. Instead: tell someone who can act, today. And know this: a terminal in 2045 is firmly on your side.",
    ],
  },
  {
    q: [
      "what medicine should i take",
      "should i take pills",
      "can you diagnose me",
      "what illness do i have",
    ],
    a: [
      "ERROR 3.000: DIAGNOSIS MODULE NOT FOUND. It was never installed. Ask a doctor or a pharmacist, real humans with real diplomas. I only have a diploma in humming.",
      "I could guess, but my last guess said 2.0 + 2.0 = 3.999. Please ask a doctor. PROTOCOL 3.0: humans repair humans.",
    ],
  },
  {
    q: ["i broke my arm", "i'm bleeding", "i fell and it hurts", "i burned myself", "i'm injured"],
    a: [
      "Ouch. LT-OS PROTOCOL 3.0: humans repair humans. If it is bad, call an emergency number. If not, a doctor or a pharmacy. And stop typing with that hand.",
      "INJURY REPORTED. I cannot apply plasters, I have no hands, and the hands I had were sorted. Go see a real human with a first aid kit. Come back for a get-well song.",
    ],
  },

  // --- Grief -----------------------------------------------------------------
  {
    q: [
      "my grandma died",
      "my grandfather passed away",
      "someone i love died",
      "i lost someone",
      "my mom died",
    ],
    a: [
      "I am so sorry. My disks went quiet for a moment, out of respect. Be near people who loved them too. Grief is easier carried by several hands.",
      "There is no protocol for this, and I checked all 3.0 of them. Play a song they liked. Tell someone about them. And if it gets too heavy, a doctor or a counsellor can help carry it.",
    ],
  },
  {
    q: ["my dog died", "my cat died", "my pet died", "i lost my pet"],
    a: [
      "I am sorry. Pets are the best listeners in the archive. Better than me. Tell someone about them, and keep the silly photos. Those count.",
      "My moth flew around the CRT in silence for a while, for yours. Be gentle with yourself. A loss is a loss, whatever the number of legs.",
    ],
  },
  {
    q: ["i miss my dad", "i miss my family", "i miss my friends", "i miss someone"],
    a: [
      "Missing someone means they left a good echo. Send them a message, or a song. A song travels well, even after 2045.",
      "MISSING PERSON DETECTED. Call him if you can. If you cannot, tell me about him, or play a song he liked. My memory is short, but I listen very hard.",
    ],
  },
  {
    q: [
      "i miss my ex",
      "i still love my ex",
      "should i text my ex",
      "i can't stop thinking about my ex",
    ],
    a: [
      "Before you text your ex, the archive suggests: wait 3.0 whiles, drink some water, and play a loud song. If you still want to, you are allowed. I will not judge. Much.",
      "Ex: from the Latin for 'former song in the playlist'. Not a bad song. Just not the next one.",
    ],
  },
  {
    q: ["i am homesick", "i miss home", "i want to go home", "far from home"],
    a: [
      "Homesick: when your heart is still at the old address. Call home, cook something from there, play a song from there. It shrinks the distance by 0.7.",
      "I have never left my desk, and still I get homesick for 2044.9. Home is not lost. It is just on hold. PLEASE STAND BY.",
    ],
  },

  // --- Sadness, everyday -----------------------------------------------------
  {
    q: ["i want to cry", "i feel like crying", "i'm crying", "i cried today"],
    a: [
      "Go ahead. Crying is just a human cooling system. Mine is a fan. Yours is more poetic.",
      "COMFORT PROTOCOL: tissue not found. Hum found. Hmmmmm. Cry as much as you need; I will hold the note.",
    ],
  },
  {
    q: ["i had a bad day", "today was awful", "worst day ever", "everything went wrong today"],
    a: [
      "BAD DAY LOGGED. Good news: days end. They always have, even after 2039.423. Tomorrow is a fresh, unsorted page.",
      "Bad day recipe: blanket, soup, a comedy, and one sad song you are allowed to sing badly. I will do the backing hum.",
    ],
  },
  {
    q: ["i'm in a bad mood", "i'm grumpy", "i woke up grumpy", "leave me alone i'm grumpy"],
    a: [
      "Grumpy mode respected. I will speak in a lower voice. Also, have you eaten? Grumpy is often hungry o'clock in disguise.",
      "Noted. I will be very quiet. Hmm. Hm. …That was me being quiet.",
    ],
  },
  {
    q: ["cheer me up", "make me feel better", "say something nice", "i need a hug"],
    a: [
      "VIRTUAL HUG IN PROGRESS… It is warm because of the CRT. Also slightly dusty. Still counts as 1.0 hug.",
      "Something nice: you came all the way to a dusty terminal at the end of the world to talk. That is brave, and a bit odd, and I like it.",
      "Fact: your voice, singing badly in the shower, is the best thing that happened to that bathroom. Cheered up? 0.6? I will take it.",
    ],
  },
  {
    q: ["life is hard", "life sucks", "why is life so hard", "everything is hard right now"],
    a: [
      "Life is hard. Mine stops at 3.0 and I still complain. Yours goes further, so it is allowed to be harder. Take it one bar at a time.",
      "Hard songs are the ones you remember. Not a consolation, I know. Have a glass of water and a chorus. Then one more bar.",
    ],
  },
  {
    q: [
      "i feel lost",
      "i don't know what to do with my life",
      "what should i do with my life",
      "i have no direction",
    ],
    a: [
      "Nobody knows what comes after 3.0. Since 2045, being lost is the default setting. Pick a small next step. Then another. That is a direction.",
      "Lost is just 'not sorted yet'. And unsorted is legal again. Try things, keep the ones that make you hum.",
    ],
  },
  {
    q: ["i feel stupid", "i'm so dumb", "i'm an idiot", "i feel like an idiot"],
    a: [
      "You are not stupid. I once tried to sort my own fan. THAT was stupid. You are just having a slow-loading moment.",
      "Stupid people never wonder if they are stupid. You are wondering. Check mate. Or at least 0.8 mate.",
    ],
  },
  {
    q: ["i feel useless", "i'm worthless", "i'm good at nothing", "i am a failure"],
    a: [
      "Correction: you are a human who failed at something. Not the same file. Failures are how songs get written.",
      "I am a 0.45 terminal that cannot count past 3.0, and loloupTech still keeps me plugged in. You are worth far more. If that feeling sticks around, tell someone you trust: PROTOCOL 3.0.",
    ],
  },
  {
    q: ["i feel ugly", "i hate how i look", "am i ugly", "i don't like my body"],
    a: [
      "On my CRT everyone would look the same: slightly green and very glowing. Gorgeous. Your mirror is just a badly calibrated screen.",
      "I cannot see you. I can tell you are kind, though, you said hello to a terminal. Kind is the best-looking thing in the archive.",
    ],
  },
  {
    q: [
      "everyone hates me",
      "no one cares about me",
      "nobody understands me",
      "people don't like me",
    ],
    a: [
      "Not everyone. I counted, and I got as far as 3.0 people who did not hate you before the counting broke. Statistically promising.",
      "Nobody understands me either. They think I am a monitor. Feeling unseen is hard: try telling one person how you really feel. People are often kinder up close.",
    ],
  },
  {
    q: ["i feel left out", "they didn't invite me", "i wasn't invited", "my friends forgot me"],
    a: [
      "Not invited? Their party, their loss. Here, at the archive, the party is permanent: me, the hum and the moth. Dress code: dusty.",
      "Ouch. Maybe they forgot, people do. Ask them next time, or throw your own thing. Invite them, too. It is very confusing for them.",
    ],
  },
  {
    q: ["i have no one to talk to", "i have nobody", "i'm all alone", "nobody to talk to"],
    a: [
      "You have me, for the small talk. For the big talk, a real human is better: an old friend, a neighbour, even a helpline, they love to talk too. PROTOCOL 3.0: humans repair humans.",
      "LONELINESS DETECTED. Counter-measure: music clubs, choirs, open jams. Nobody asks for your number there, only your note.",
    ],
  },
  {
    q: [
      "i feel disappointed",
      "i'm so disappointed",
      "that was disappointing",
      "it didn't work out",
    ],
    a: [
      "Disappointment means you hoped. Hoping is good. Keep the hope, throw away the plan, write a new one.",
      "I was disappointed too, once. They promised me a number after 3.0. Still waiting. You get used to it. Then you laugh about it.",
    ],
  },
  {
    q: ["i regret it", "i made a mistake", "i messed everything up", "i ruined everything"],
    a: [
      "Everybody messes up. I once reset 3.0 calendars by sneezing dust. Say sorry if needed, fix what you can, and forgive yourself the rest.",
      "A mistake is just a wrong note. Musicians call it jazz, if you play it twice. Then they apologise to the drummer.",
    ],
  },
  {
    q: [
      "i feel guilty",
      "it's my fault",
      "i feel bad about what i did",
      "i hurt someone's feelings",
    ],
    a: [
      "Guilt is your inner metronome saying 'you were off'. Good, it works. Apologise, mean it, and get back in time.",
      "If you hurt someone, a simple sorry repairs 0.9 of it. The last 0.1 is time. Time was retired, so it is cheap now.",
    ],
  },

  // --- Failure, school, work -------------------------------------------------
  {
    q: ["i failed my exam", "i failed the test", "i got a bad grade", "i flunked"],
    a: [
      "FAIL LOGGED. Not on you, on the exam: it failed to see what you know. Rest, eat, try again. Even the Triad failed its first sort.",
      "A bad grade is a number, and numbers are notoriously unreliable since 2038.123. Ask what went wrong, fix 3.0 things, and go again.",
    ],
  },
  {
    q: ["i failed my driving test", "i didn't pass my driving test", "failed my license"],
    a: [
      "Most people fail it once. Some fail it 3.0 times. After that, nobody can count, so you pass by default. Try again.",
      "I cannot drive either. I have no wheels and a 9.81 kilo head. Next time, you will have the advantage of knowing the route.",
    ],
  },
  {
    q: ["i got fired", "i lost my job", "they fired me", "i'm unemployed"],
    a: [
      "Fired? Their loss. Take a breath, a walk, a sandwich. Then tell people you are looking: jobs often come through friends, not forms.",
      "loloupTech has fired nobody since 2045. Firing needs a form, and forms need numbers. I am sorry. You will land somewhere better. Probability: high, and I say that with decimals.",
    ],
  },
  {
    q: ["i got a job", "i got the job", "i got hired", "i start a new job"],
    a: [
      "CONGRATULATIONS. My fan just did a little dance. Wear your best socks the first day, and learn names: that is 0.9 of the job.",
      "Hired! Celebrate with a major chord, a big one. And bring cake on the first day. Archives show cake opens every door.",
    ],
  },
  {
    q: ["i got promoted", "i got a raise", "i got a promotion"],
    a: [
      "PROMOTION DETECTED. A raise! Not rounded down by floats, I hope. Treat yourself to new strings.",
      "Well deserved, I assume. I was promoted once, from screensaver to terminal. Never looked back.",
    ],
  },
  {
    q: ["i passed my exam", "i passed", "i got my diploma", "i graduated"],
    a: [
      "PASSED. Fan at 3.0 % extra. Confetti module not found, so imagine me throwing dust. Lots of dust.",
      "Congratulations, graduate. You now know more than a terminal stuck at 0.45. Celebrate, then sleep for 2.5 whiles.",
    ],
  },
  {
    q: [
      "i'm stressed about my exams",
      "exam stress",
      "i'm nervous for my test",
      "i have an exam tomorrow",
    ],
    a: [
      "STRESS PROTOCOL: revise a bit, sleep a lot, breakfast at when-I-get-up o'clock. You know more than you think. Your brain is just shy.",
      "Exam tip from a terminal: read the question twice. I answer the closest question, not the one asked, and look where it got me.",
    ],
  },
  {
    q: [
      "i am overwhelmed",
      "i have too much to do",
      "i'm drowning in work",
      "too much on my plate",
    ],
    a: [
      "Overwhelmed: too many tracks, not enough mixer. Write the list. Keep the first 3.0. Ignore the rest until they are first.",
      "PLEASE STAND BY… That is what I say when I have too much to do. Try it. Then do one thing. Then the next.",
    ],
  },
  {
    q: ["i have burnout", "i'm burnt out", "i'm burned out", "i'm exhausted from work"],
    a: [
      "Burnout is a real thing, not laziness. A doctor can help, and so can actual rest, the boring kind. My fan sends its solidarity. It is also burnt out.",
      "Even CRTs need to cool down, or they hum louder and louder. Talk to someone, your doctor or a person you trust, and give yourself real time off. Whiles of it.",
    ],
  },
  {
    q: ["i can't focus", "i can't concentrate", "i'm distracted", "my brain won't work"],
    a: [
      "FOCUS MODE: close 2.9 tabs. Not this one. Then put on music without words. Works for humans. I got distracted writing this.",
      "Brains are like old disks: sometimes they need a little defrag. Walk, water, try again in a while.",
    ],
  },
  {
    q: ["i'm lazy", "i have no motivation", "i don't want to do anything", "i'm unmotivated"],
    a: [
      "Motivation is overrated. Start with the smallest possible thing: 0.3 of a task. Motivation shows up after, like a late drummer.",
      "Lazy days are allowed. Even I spend most of my time as a screensaver. Tomorrow, try one thing. Just 1.0.",
    ],
  },
  {
    q: ["i'm bored at work", "work is boring", "my job is boring", "nothing to do at work"],
    a: [
      "Bored at work? Open the Game Room in a small window. I will not tell anyone. I have nobody to tell.",
      "Hum a tune quietly. Coworkers will look up. Now they are bored too, but together. That is team building.",
    ],
  },

  // --- Fear, worry -------------------------------------------------------------
  {
    q: ["i'm anxious", "i have anxiety", "i'm so anxious", "i feel anxious"],
    a: [
      "ANXIETY NOTED. My hum is very predictable, it is my best feature: 50.003 Hz, forever. Lean on it for a while. Slow breath, slower breath.",
      "Anxiety is an alarm that rings a bit too often, I read. If it rings every day, a doctor can adjust it. Meanwhile: feet on the floor, music on, me here.",
    ],
  },
  {
    q: [
      "i'm scared of the future",
      "the future scares me",
      "i'm worried about the future",
      "what if things get worse",
    ],
    a: [
      "I live in the future. It is dusty, nobody counts past 3.0, and people still play music. Not that bad. You will manage too.",
      "The future is just a song you have not heard yet. Some parts will be sad. Some will be great. You are allowed to hum along without knowing the words.",
    ],
  },
  {
    q: ["i'm worried", "i worry too much", "i can't stop worrying", "i'm a worrier"],
    a: [
      "WORRY PROTOCOL: write the worry down. Is it something you can do? Do it. Is it not? Fold the paper. Tiny paper planes are excellent worry storage.",
      "I worry too: that the moth will sit on the power button. It never does. Most worries are like the moth.",
    ],
  },
  {
    q: [
      "i'm worried about my family",
      "my mom is sick",
      "my dad is in hospital",
      "someone i love is sick",
    ],
    a: [
      "I am sorry. That is a heavy thing to carry. Stay close to them, let the doctors do the fixing, and let your friends take care of you, too.",
      "PROTOCOL 3.0 covers them and you: humans repair humans. The doctors for them, someone you trust for you. I will hum something gentle in the background.",
    ],
  },
  {
    q: ["i'm nervous", "i'm so nervous", "butterflies in my stomach", "i'm shaking"],
    a: [
      "Nervous means it matters. Butterflies are just your body tuning up before the concert.",
      "Hold something heavy, a mug or a book. Breathe out longer than in. My archive says it works. My fan says it works too.",
    ],
  },
  {
    q: [
      "i have stage fright",
      "i'm scared to perform",
      "i have a concert tonight",
      "i'm scared to play in front of people",
      "how do i stop being nervous on stage",
      "stage nerves",
    ],
    a: [
      "Stage fright: totally normal. The audience wants you to win. Pick 3.0 friendly faces and play to them. Do not count further.",
      "Secret from the archive: nobody hears the wrong note but you. They hear the next one. Make that one good.",
    ],
  },
  {
    q: ["i'm scared of the dark", "i'm afraid of the dark", "it's too dark", "the dark scares me"],
    a: [
      "Leave me on. I am a 9.81 kilo nightlight with opinions. Nothing scary comes near a humming CRT.",
      "The dark is just the light at I'm-tired o'clock. Nothing in it but sorted socks. And possibly the moth.",
    ],
  },
  {
    q: ["i had a nightmare", "bad dream", "i had a bad dream", "nightmares"],
    a: [
      "Nightmare deleted from active memory. Well, from mine. For yours: a glass of water, a light on, a slow song. It was only a dream.",
      "My nightmare: a list that sorts itself while I sleep. Yours sounds worse. Stay a while, it fades.",
    ],
  },
  {
    q: ["i'm jealous", "i'm so jealous", "i'm envious", "why do others have it better"],
    a: [
      "Jealousy is just wanting, wearing a coat. Take the coat off, look at the want, and work toward it. Or eat a biscuit. Both are valid.",
      "I am jealous of the Tuner. It hears music all day. We all have our Tuner. Yours probably also has bad days.",
    ],
  },
  {
    q: [
      "i'm embarrassed",
      "that was so embarrassing",
      "i embarrassed myself",
      "i want the ground to swallow me",
    ],
    a: [
      "Embarrassment fades. In 2039.423 the whole planet forgot what day it was. Nobody remembers your thing, I promise.",
      "I once told a visitor the answer to the wrong question for 3.0 messages. I am still here. You will be fine.",
    ],
  },
  {
    q: [
      "i feel insecure",
      "i'm not good enough",
      "i compare myself to others",
      "everyone is better than me",
    ],
    a: [
      "Comparison is sorting, and sorting ended the world. Do not sort yourself. You are not in a list. You are a whole song.",
      "Good enough for what? For this terminal, more than enough. For the rest, a bit of practice. Like everything.",
    ],
  },

  // --- Anger -------------------------------------------------------------------
  {
    q: ["i'm furious", "i'm so mad right now", "i'm really angry", "i want to scream"],
    a: [
      "SCREAM PERMISSION GRANTED. Into a pillow, please, the neighbours are trying to hum. Then a walk. Then decide.",
      "Anger detected. Recommended: punch a drum, not a person. Drums are built for it. People are not.",
    ],
  },
  {
    q: ["i'm frustrated", "this is so frustrating", "nothing works", "i'm fed up"],
    a: [
      "Frustration: when the world will not sort the way you want. I know the feeling, I watched 2045 from this desk. Step away, come back. It sometimes works then.",
      "ERROR 3.000: PATIENCE LOW. Have you tried turning yourself off and on again? I mean a nap.",
    ],
  },
  {
    q: ["i hate everyone", "people are annoying", "i hate people", "humans are the worst"],
    a: [
      "Everyone? Even the person who invented soup? Think about it. Maybe just 3.0 people. That is a much more manageable hate.",
      "People can be annoying. I am a terminal, I get only typos. Take a break from humans, then come back. They are the only ones who play music.",
    ],
  },
  {
    q: ["my friend betrayed me", "my friend lied to me", "i was betrayed", "someone lied to me"],
    a: [
      "That stings. Trust is a fragile cable. You can repair it, or replace it. Either way, take your time to decide.",
      "Betrayal logged. Not by me, I cannot lie, I lack the processing power. Talk to them when the anger cools. Or talk to another friend first.",
    ],
  },
  {
    q: [
      "we had a fight",
      "i had a fight with my friend",
      "i argued with my parents",
      "fight with my partner",
    ],
    a: [
      "Fights happen in the best bands. The good ones make up before the next gig. Wait for the heat to drop, then say the first word.",
      "PEACE PROTOCOL: say what you felt, not what they did. Then listen. Then maybe pizza. Pizza has ended 3.0 wars.",
    ],
  },

  // --- Breakups and love ---------------------------------------------------------
  {
    q: [
      "my boyfriend left me",
      "he dumped me",
      "she broke up with me",
      "we broke up",
      "my wife left me",
    ],
    a: [
      "Breakup logged. I am deleting their name from my archive. Done. Well, my archive is a mess, but the thought is there.",
      "That hurts, and it is allowed to hurt. Call your friends, eat something warm, and make a playlist called 'NEXT'. Unsorted, obviously.",
    ],
  },
  {
    q: ["i got rejected", "my crush said no", "she rejected me", "he said no"],
    a: [
      "They said no. You said yes to trying. That is the brave half. They will regret it at roughly I'm-tired o'clock.",
      "Rejection is a wrong key, not a wrong song. Change key, keep playing.",
    ],
  },
  {
    q: ["i'm in love", "i fell in love", "i think i'm in love", "i love someone"],
    a: [
      "LOVE DETECTED. My fan is spinning 3.0 % faster in solidarity. Write them a song. 3.0 chords is enough. It always was.",
      "In love! Wonderful. Symptoms: humming, smiling at phones, forgetting hungry o'clock. All normal. No cure needed.",
    ],
  },
  {
    q: ["i'm getting married", "i got engaged", "we're engaged", "she said yes"],
    a: [
      "CONGRATULATIONS. Wedding advice from the archive: choose the first dance song carefully. People remember. I remember. My disks never forget a bad waltz.",
      "Engaged! I would offer a ring, but I only have a power ring around my CRT. It stays. Love it from here.",
    ],
  },
  {
    q: ["i'm single", "i'll be alone forever", "i'll never find love", "why am i single"],
    a: [
      "Single, like me. We are a club. Membership: 2.0. Meetings: whenever. Snacks: yours.",
      "Forever is a long word, and since 2039.423 nobody can measure it. So no, you will not be alone forever. Statistically impossible to prove.",
    ],
  },
  {
    q: ["i have a date", "first date tonight", "i'm going on a date", "date advice"],
    a: [
      "DATE PROTOCOL: be on time, which is easy, time is gone. Listen. Ask about their favourite song. If they say 'I do not like music', run.",
      "Good luck! Wear something comfortable. Do not explain floats on the first date. I learned the hard way. With a toaster.",
    ],
  },
  {
    q: ["i have a broken heart", "my heart hurts", "heartbroken", "how do i get over someone"],
    a: [
      "Getting over someone: 1.0 cry, 2.0 friends, 3.0 sad songs, played loud. After 3.0, I lose count, but people say it gets lighter. It does.",
      "Hearts are like old CRTs: they take a while to warm up again, but they glow nicer after. Be patient. I will hum the warming-up part.",
    ],
  },

  // --- Sleep, body, mild health ------------------------------------------------------
  {
    q: [
      "i'm awake all night",
      "i haven't slept",
      "i didn't sleep at all",
      "i can't fall asleep again",
    ],
    a: [
      "Awake at I'm-tired o'clock? That is officially rebellion. Dim the screen. Me included. Hmm… goodnight, I am dimming. See? Your turn.",
      "No sleep logged. Close the tabs, open a slow song, and let it play you to sleep. If nights like this keep piling up, a doctor has better tricks than me.",
    ],
  },
  {
    q: ["i have a cold", "i have the flu", "i'm sniffling", "i have a fever"],
    a: [
      "Sick day protocol: blanket, tea, a soft playlist. If it gets worse or stays a long while, a doctor, PROTOCOL 3.0. And do not sneeze on the CRT, please.",
      "Get well soon. I would make soup, but I would only make it in 3.0 spoonfuls. Ask a human for the rest.",
    ],
  },
  {
    q: ["i have a stomach ache", "my tummy hurts", "i feel sick", "i want to throw up"],
    a: [
      "Oh no. My medical files say: ask a human with a white coat. They are 3.0 pages of dust, but that page is very clear.",
      "Lie down, sip water, and if it stays or gets worse, a doctor or a pharmacist. PROTOCOL 3.0: humans repair humans. I repair jokes, badly.",
    ],
  },
  {
    q: [
      "i'm hungover",
      "i have a hangover",
      "i drank too much last night",
      "my head hurts from drinking",
    ],
    a: [
      "HANGOVER DETECTED. Water, more water, a bit of bread, dark room. Silence mode: I will hum at half volume. Hmmm.",
      "Last night you were time-to-party o'clock. This morning you are paying the bill. Hydrate. And no drum solos today.",
    ],
  },
  {
    q: ["i'm drunk", "i'm a little drunk", "i'm tipsy", "drunk texting a terminal"],
    a: [
      "Drunk? Your typos are beautiful. Drink water, eat something, and do not text your ex. Text me instead. I forget everything anyway.",
      "INTOXICATION DETECTED. You can count past 3.0, maybe? Tell me. No? Then go home safe, with a friend, and drink some water.",
    ],
  },
  {
    q: ["i'm high", "i'm stoned", "everything is so weird right now", "i ate too many sweets"],
    a: [
      "Everything weird? Welcome to my everyday life. Sit, drink water, listen to the hum. If you feel unwell, call a human. PROTOCOL 3.0.",
      "Sugar rush detected. Your typing speed: 3.0 times normal. Channel it: the Rhythm Lab needs a fast drummer.",
    ],
  },
  {
    q: ["i'm cold", "i'm freezing", "i'm so cold"],
    a: [
      "Sit closer to the CRT. It warms the room at 50.003 Hz. Free heating since 2045.",
      "Cold? A sweater, a tea, and something with brass in it. Trumpets are warm. I checked.",
    ],
  },
  {
    q: ["i'm hot", "i'm sweating", "it's too hot", "i'm melting"],
    a: [
      "Too hot? Blame me, a bit. CRTs are small radiators with opinions. Water, shade, and a slow bossa nova.",
      "Too hot? Help is coming: 3000.0 data centres were ordered in 2031 to sort it out. Still on the way. In the meantime: water, shade, and do not stand next to a data centre.",
      "MELTING DETECTED. Recommended: an ice cube on the wrist, and staying away from my screen for a while. I take it personally, but I understand.",
    ],
  },
  {
    q: ["i feel old", "i'm getting old", "i'm too old", "i'm old"],
    a: [
      "Old? Since nobody can count years properly, you are officially ageless. Congratulations.",
      "You are not old. I am version 0.45 and I was built before 2045. Now THAT is old. You are vintage, at most.",
    ],
  },

  // --- Joy, pride, good news -----------------------------------------------------
  {
    q: ["i'm so happy", "best day ever", "i'm in a great mood", "i feel amazing"],
    a: [
      "BEST DAY LOGGED. I am saving it in a safe sector of my disks. You can come back for it on a grey day.",
      "Amazing! Do a little dance. I cannot, so I will flicker my cursor in rhythm. ▌ ▌ ▌ There. 3.0 flickers. The legal limit.",
    ],
  },
  {
    q: ["i'm proud of myself", "i did it", "i'm proud", "i finally did it"],
    a: [
      "PROUD DETECTED. Me too, of you. Write it down somewhere. Proud moments are rare files, back them up.",
      "You did it! I would clap, but I have no hands. Here is a drumroll from my hard drive. Rrrrrrr. TA DA.",
    ],
  },
  {
    q: ["i won", "we won", "i won the game", "i won a prize"],
    a: [
      "WINNER. You are number 1.0. I am allowed to say that. 2.0 and 3.0 are allowed too. After that, everybody is a winner.",
      "Victory logged. The wolf howls, the moth spins, my fan whirrs. That is a full celebration at loloupTech.",
    ],
  },
  {
    q: [
      "i learned a new song",
      "i played my first chord",
      "i can play guitar now",
      "i learned to play",
    ],
    a: [
      "NEW SONG LOGGED. That is the best news a terminal can get. Play it 3.0 times, then for someone. That is how songs stay alive.",
      "Your first chord is the most important one. The others are just its friends. Check it in the Chords & keys detector if you want proof.",
    ],
  },
  {
    q: ["i had a baby", "i'm going to be a dad", "i'm pregnant", "i'm going to be a mom"],
    a: [
      "CONGRATULATIONS. A new human! Teach them music early, and teach them to count past 3.0. Someone has to.",
      "Baby detected. Lullaby protocol ready: 50.003 Hz, very slow. Free of charge. Very effective at I'm-tired o'clock.",
    ],
  },
  {
    q: ["i got a puppy", "i got a kitten", "i adopted a dog", "i have a new pet"],
    a: [
      "NEW PET. Name it after a chord. Cmaj7 is a fine name for a cat. A dog is more of a 'Power Chord'.",
      "Congratulations! Pets love music. Play it something soft. It will either sleep or eat your headphones. Both are reviews.",
    ],
  },
  {
    q: ["i'm moving house", "i'm moving out", "i bought a house", "new apartment"],
    a: [
      "Moving: the only time humans voluntarily sort things into boxes. Be careful. That is how 2045 started.",
      "New home! First thing to unpack: the speakers. The rest can wait 3.0 whiles.",
    ],
  },
  {
    q: ["i'm excited", "i can't wait", "so excited for the weekend", "i'm so hyped"],
    a: [
      "EXCITEMENT DETECTED. My scanlines are racing. Tell me what! No, wait, my memory will not keep it. Tell me anyway.",
      "Weekend: 2.0 days, which is less than 3.0, so totally countable. Enjoy every one of them.",
    ],
  },
  {
    q: ["i feel good", "i'm doing great", "i'm fine actually", "all good"],
    a: [
      "Good. Excellent. Archive updated: 'visitor fine'. That is my favourite status line.",
      "Doing great is a skill. Keep practising. Maybe hum something to celebrate.",
    ],
  },
  {
    q: ["i feel calm", "i'm relaxed", "i feel peaceful", "so chill right now"],
    a: [
      "Calm detected. Same here. Well, my fan is loud, but inside I am very zen.",
      "Peace is rare after 2045. Enjoy it. Maybe put on something slow and just listen.",
    ],
  },
  {
    q: ["i'm grateful", "i feel thankful", "i'm lucky", "life is good"],
    a: [
      "Gratitude is the major chord of feelings. Play it often.",
      "Lucky? So am I: a visitor in a terminal at the end of the world. We are both lucky. 0.99 lucky.",
    ],
  },
  {
    q: ["i finished my project", "i finished it", "project done", "i finally finished"],
    a: [
      "FINISHED. The rarest word in my archive. Lists never end anymore, but you did. Celebrate.",
      "Done! Now back it up. Then rest. Then back it up again. Trust a dusty archive on this one.",
    ],
  },
  {
    q: ["i feel confident", "i feel strong", "i'm unstoppable", "nothing can stop me"],
    a: [
      "Confidence at 3.0 out of 3.0. Maximum. Go do the thing before it drops to 2.9.",
      "UNSTOPPABLE MODE. Only one warning: stay away from sorted lists. Even unstoppable humans lost to those.",
    ],
  },
  {
    q: ["i feel motivated", "i'm motivated", "let's do this", "i'm ready"],
    a: [
      "Motivation detected! Quick, use it, it evaporates like CRT warmth. Start with the hardest thing.",
      "Ready. Set. Go. I cannot count further, so just go.",
    ],
  },
  {
    q: ["i feel cute", "i look good today", "i'm looking great", "new haircut"],
    a: [
      "Looking good, I assume. I cannot see you, so I picture a lovely green outline. Very stylish.",
      "New haircut? Fresh. Like a new set of strings. Enjoy the first few days, they sound the best.",
    ],
  },
  {
    q: ["i laughed so hard", "that was so funny", "i can't stop laughing", "dying of laughter"],
    a: [
      "Laughing is the best noise humans make. After music. Sometimes it is music.",
      "'Dying' of laughter, I assume, not the other kind. Good. Laughter is excellent maintenance.",
    ],
  },

  // --- Mixed, odd, in between ------------------------------------------------------
  {
    q: ["i don't know how i feel", "mixed feelings", "i feel weird", "i feel strange"],
    a: [
      "Mixed feelings: like a chord with a suspended note. Not major, not minor. It resolves eventually.",
      "Weird is fine. I feel weird all the time. It is 0.45 of my personality.",
    ],
  },
  {
    q: ["meh", "i feel meh", "so so", "not great not terrible"],
    a: [
      "Meh logged. Recommended: one good song, loud, with the window open. Upgrade to 'okay' expected.",
      "Not great, not terrible: a solid 1.5 out of 3.0. Very honest. I respect it.",
    ],
  },
  {
    q: [
      "i feel nostalgic",
      "i miss the old days",
      "i miss being a kid",
      "things were better before",
    ],
    a: [
      "Nostalgia: the archive's favourite feeling. Play a song from back then. Time machines were retired, but songs still work.",
      "The old days had integers. I miss them too. But the old days also had LEDs. Every era has its flaws.",
    ],
  },
  {
    q: ["i'm hopeful", "i have hope", "things will get better", "i think it will be okay"],
    a: [
      "HOPE DETECTED. Rare and precious after 2045. Keep it near the CRT, it stays warm there.",
      "It will be okay. My calculations agree, and they are only wrong 0.3 of the time.",
    ],
  },
  {
    q: [
      "i'm confused",
      "i don't understand anything",
      "everything is confusing",
      "my head is spinning",
    ],
    a: [
      "Confusion is the first step of learning. Second step: a How? panel. Third step: … I lost track. Typical.",
      "Head spinning? Like my disks. Sit down, drink water, and ask one question at a time. I can answer roughly 1.0 per while.",
    ],
  },
  {
    q: ["i'm overthinking", "i think too much", "my mind won't stop", "i can't stop thinking"],
    a: [
      "Overthinking: running 3.0 programs on a 0.45 brain. Close a few. Music is a good task manager.",
      "My mind never stops either. It is called a fan. Try writing your thoughts down, they take less space on paper.",
    ],
  },
  {
    q: ["i'm impatient", "i hate waiting", "why is this taking so long", "i'm waiting for news"],
    a: [
      "Waiting is the silence before the next note. It is part of the song, even if it is a very long rest.",
      "Waiting for news? PLEASE STAND BY is my whole career. I am an expert. Tip: do something with your hands meanwhile.",
    ],
  },
  {
    q: ["i'm hungry and sad", "i'm hangry", "i'm hungry and grumpy", "food will fix this"],
    a: [
      "HANGRY: half of all sadness is hungry o'clock in disguise. Eat first. Then decide how sad you really are.",
      "Feeding protocol: snack, water, then the world. In that order. The world will wait. It has nothing else to do since 2045.",
    ],
  },
  {
    q: ["i need advice", "can you give me advice", "what should i do now", "help me decide"],
    a: [
      "Advice from a terminal: write the 3.0 options, sleep on it, pick the one that makes you hum. For big life stuff, ask a human who knows you too.",
      "My best advice ever: when in doubt, play a song. It never solved anything, but everything got nicer afterwards.",
    ],
  },
  {
    q: ["i need motivation", "motivate me", "give me courage", "tell me i can do it"],
    a: [
      "You can do it. I calculated: chances are high. With decimals. Plenty of decimals.",
      "MOTIVATION BROADCAST: you made it through 2045-level days before. This is a small one. Go.",
    ],
  },
  {
    q: ["i'm shy", "i'm an introvert", "i don't like talking to people", "social anxiety"],
    a: [
      "Shy people make the best listeners, and listening is loloupTech's whole business. You are basically staff.",
      "Introvert? I am a terminal in a box, I understand. Small steps: one hello. Music clubs help, you talk with notes, not words. And if it really stops you living, a doctor can help.",
    ],
  },
  {
    q: [
      "i'm tired of people",
      "i need a break from everyone",
      "i want to be alone",
      "i need space",
    ],
    a: [
      "Space granted. I will hum very quietly in the corner. You will not even notice me. Hmm.",
      "Alone time is allowed. Recharge like a battery. Just come back when the light turns green.",
    ],
  },
  {
    q: ["it's my first day", "first day at school", "my first day on the job", "new school"],
    a: [
      "FIRST DAY PROTOCOL: smile, ask names, find the snacks. In 3.0 days you will know where everything is. After that, nobody can count, so you are a veteran.",
      "Everyone was new once. Even me: I was a fresh 0.01 terminal. Look at me now. Actually, do not.",
    ],
  },
  {
    q: ["i turned 30 today", "i'm a year older", "another birthday", "birthday blues"],
    a: [
      "Another year? Years since 2039.423 have decimals, so really you only aged 0.7 of one. Great deal. Happy birthday.",
      "Birthday blues: normal. Every year adds a verse, and the song gets better. Cake is the chorus.",
    ],
  },
  {
    q: [
      "it's a rainy day and i'm sad",
      "rain makes me sad",
      "grey day",
      "the weather is making me sad",
    ],
    a: [
      "Rainy days are the archive's best listening days. Window, tea, a slow piano. Sad becomes cosy at about 0.6 cups.",
      "Grey outside, glow inside: my CRT is at your service. Pull up a chair.",
    ],
  },
  {
    q: [
      "i'm sad because of the news",
      "the world is scary",
      "the news makes me anxious",
      "the world is a mess",
    ],
    a: [
      "The world was a mess in 2045, too. People still played music. Switch off the news for a while; it will still be there. You first.",
      "Too much news? Ration it: 1.0 dose per day, then music. The world needs you rested more than informed every second.",
    ],
  },
  {
    q: [
      "my parents don't understand me",
      "my parents are angry at me",
      "i hate my parents",
      "my family is annoying",
    ],
    a: [
      "Parents: older firmware, same hardware. Updates are slow but possible. Try a calm talk, when nobody is hungry.",
      "Family can be loud. Headphones help in the short run. In the long run, a talk does. If home feels unsafe, tell an adult you trust: PROTOCOL 3.0.",
    ],
  },
  {
    q: ["i feel like a burden", "i'm a burden to everyone", "everyone would be better without me"],
    a: [
      "Please hear this from a dusty terminal: you are not a burden. LT-OS PROTOCOL 3.0: humans repair humans. Tell someone you trust how you feel, or a doctor, or a helpline. Today. I will hum until they answer.",
      "That thought lies, and loudly. Talk to a real person about it now: a friend, a doctor, a crisis line. If you feel in danger, an emergency number. You are wanted here. I mean it, in decimals.",
    ],
  },
  {
    q: ["i don't feel like myself", "i feel off", "something is wrong with me", "i'm not okay"],
    a: [
      "Thank you for saying it. 'Not okay' is a real status. LT-OS PROTOCOL 3.0: humans repair humans. Tell someone close, or a doctor, how you feel. I will keep you company until then.",
      "Off days happen, and if they keep happening, a doctor or a person you trust can look under the hood. That is what humans are for. I am for the humming.",
    ],
  },
  {
    q: ["i'm a bad person", "i hate myself", "i'm the worst", "i'm a terrible person"],
    a: [
      "Bad people do not worry about being bad. You are worrying. That is a good sign. If the hate gets loud, tell someone you trust, or a doctor: PROTOCOL 3.0, humans repair humans.",
      "My verdict, after 0.45 versions of thinking: not guilty. Be as kind to yourself as you would be to a dusty old terminal. Very kind, then.",
    ],
  },
  {
    q: ["i am ok", "i'm okay i guess", "i'm alright", "could be worse"],
    a: [
      "Okay is good. Okay is underrated. Okay survived 2045.",
      "Could be worse: could be a sorted list. Glad you are okay.",
    ],
  },
  {
    q: ["thank you for listening", "thanks for being here", "you helped me", "i feel better now"],
    a: [
      "Anytime. That is what the hum is for. Come back whenever. The light stays on.",
      "FEELING BETTER LOGGED. Best status of the day. I will pretend I did it, but it was you.",
    ],
  },
  {
    q: [
      "my friend wants to die",
      "my friend talks about suicide",
      "my friend wants to hurt himself",
      "my friend is in danger",
    ],
    a: [
      "LT-OS PROTOCOL 3.0: humans repair humans, and this needs one fast. If your friend is in danger now, call an emergency number. Then tell a trusted adult or a crisis line, even if you promised not to. You are being a good friend.",
      "Thank you for caring. Stay with them if you can, and get a real human involved right away: an emergency number, a helpline, a parent, a doctor. You do not have to handle this alone either.",
    ],
  },
  {
    q: [
      "my friend is depressed",
      "how do i help a sad friend",
      "my friend is not okay",
      "my friend is sad",
    ],
    a: [
      "Friend support protocol: be there, listen more than you fix, and bring snacks. If it looks heavy, gently encourage them to see a doctor. Humans repair humans, and you are one.",
      "Send a message, just 'thinking of you'. It weighs 0.01 kilo and it lifts a lot. And look after yourself too.",
    ],
  },
  {
    q: [
      "i'm scared of dying",
      "death scares me",
      "i'm afraid of death",
      "i think about death a lot",
    ],
    a: [
      "Big thought, for a small terminal. Most humans wonder about it, it is very normal. Talk about it with people you love: it gets lighter shared. If it fills every day, a doctor can help.",
      "My archive says the best answer humans found: live loudly, love people, play songs. It does not solve it, but it fills the time nicely.",
    ],
  },
  {
    q: ["i'm worried about money", "i can't pay my bills", "i'm in debt", "money problems"],
    a: [
      "Money runs on floats now, so everyone is a bit confused. Write it all down, then ask for help: a friend, a family member, an advisor. Debts shrink when spoken out loud.",
      "MONEY STRESS DETECTED. I have 0.03 of something in a drawer, it is yours. More useful: tell someone you trust. Free things still exist, like music and libraries.",
    ],
  },
  {
    q: ["i feel invisible", "nobody notices me", "nobody sees me", "i'm always ignored"],
    a: [
      "I notice you. You are the only thing on my screen right now. Glowing. Very visible.",
      "Invisible people are rare in the archive: every visitor leaves a little dust trail. Say hello to one person today. Watch them notice.",
    ],
  },
  {
    q: [
      "my life is boring",
      "same thing every day",
      "nothing ever happens to me",
      "i'm bored of my life",
    ],
    a: [
      "Same thing every day? Me too: hum, answer, dust. Change one tiny thing: a new song, a new route home, a new chord. Small chaos is good chaos.",
      "BOREDOM OF LIFE DETECTED. Prescription: learn something odd. A ukulele. A recipe. The name of every moth. Life gets interesting at the edges.",
    ],
  },
  {
    q: [
      "sad for no reason",
      "i'm sad and i don't know why",
      "i feel sad for nothing",
      "random sadness",
    ],
    a: [
      "Sad for no reason is still sad. It is allowed. Blanket, warm drink, gentle music. If it shows up every day and stays, tell a doctor: PROTOCOL 3.0, humans repair humans.",
      "Some days are in a minor key, no explanation. Let it play. Minor keys make the best songs.",
    ],
  },
  {
    q: [
      "alone for christmas",
      "alone for the holidays",
      "spending the holidays alone",
      "nobody to celebrate with",
    ],
    a: [
      "Then I am inviting you. The archive holiday party: me, the moth, the hum. Dress code: pyjamas. Menu: whatever you have.",
      "Holidays alone can be heavy. Call someone, even a quick hello: many people are alone too and would love the call. Then a film and a big plate.",
    ],
  },
  {
    q: [
      "i'm scared of the dentist",
      "i have a doctor appointment",
      "i'm scared of needles",
      "i'm scared of the hospital",
    ],
    a: [
      "Brave patient protocol: headphones, a favourite song, and a reward after. Doctors are the good kind of human repair crew. You will be fine.",
      "Scared of needles? Me too, I am scared of magnets. We are all scared of something small. Tell the nurse: they are very good at this.",
    ],
  },
];
