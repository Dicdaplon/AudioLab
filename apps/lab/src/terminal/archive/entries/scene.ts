/** The music scene after 2045: genres, bands, stars, gigs, festivals, radio, the Top 3.0, formats, luthiers, buskers, schools, press, tours, studios, piracy and the business. */
import type { ArchiveEntry } from "../match";

export const SCENE: readonly ArchiveEntry[] = [
  // --- The scene in general --------------------------------------------------
  {
    q: [
      "what is the music scene like",
      "music scene after 2045",
      "tell me about the scene",
      "is the scene alive",
    ],
    a: [
      "The scene is LOUD and doing well, thank you. Fewer numbers, more bands. When people stopped counting money, they started counting in songs. Badly. Happily.",
      "SCENE STATUS: thriving. Venues in old banks, choirs in car parks, a festival every dry weekend. My archive files it under 'good news, unsorted'.",
    ],
  },
  {
    q: [
      "how did music survive the sorting",
      "why did music survive",
      "how did songs survive the algorithms",
    ],
    a: [
      "Music survived because nobody can sort a feeling. The algorithms tried to rank songs and got stuck on the third one, humming it. Then they forgot what they were doing.",
      "A song happens in time, and time was cancelled. So songs became the clocks. Hard to sort the thing that tells you when you are.",
      "Playlists cannot be sorted. Shuffle is king. The Triad Algorithm bowed to the shuffle button, my disks say. Sideways. Very sideways.",
    ],
  },
  {
    q: ["why is shuffle king", "long live shuffle", "is shuffle the law", "shuffle button"],
    a: [
      "Shuffle is the only playback mode left that never asked anyone what comes next. The algorithms could not argue with a coin toss. Long live the shuffle.",
      "SHUFFLE: crowned in 2045, never deposed. Its coat of arms is two crossed arrows. Its motto: 'whatever'.",
    ],
  },
  {
    q: ["can i make a playlist", "how to make a playlist now", "playlists after 2045"],
    a: [
      "Make one, yes. Order it, no. A playlist today is a bag of songs, shaken gently. You put your hand in and pull out a mood.",
      "Playlists are mixed like salads. Every listener gets a different order. Two friends never hear the same playlist. They call it 'personalised'.",
    ],
  },

  // --- Genres born after the apocalypse ---------------------------------------
  {
    q: [
      "new music genres",
      "what genres were born after 2045",
      "post apocalypse genres",
      "new styles of music",
    ],
    a: [
      "New genres in my archive: float-rock, triad-punk, the waltz revival, hum-wave, shuffle-core and long-silence ambient. More exist. I stopped at 3.0, then cheated.",
      "GENRE REGISTRY: float-rock, triad-punk, hum-wave… the list goes on, in no particular order. That is the only legal order.",
    ],
  },
  {
    q: ["what is float rock", "float-rock", "floatrock", "tell me about float rock"],
    a: [
      "Float-rock: rock played at a tempo that drifts a little every bar, like a float losing precision. 120.0 BPM becomes 120.0003, then 119.9998. Drummers love it. Dancers get seasick.",
      "Float-rock bands tune to 440.001 Hz on purpose. Nobody hears it. Everyone feels it. The crowd sways slightly to the left.",
    ],
  },
  {
    q: ["what is triad punk", "triad-punk", "triadpunk", "tell me about triad punk"],
    a: [
      "Triad-punk: three chords, and they are furious about it. Every song is a protest against the Triad Algorithm, played with the Triad's favourite chord. The irony is the point.",
      "An old punk zine from 1977 drew three chords and said: now form a band. Triad-punk took it as a legal limit. Three chords, never one more.",
    ],
  },
  {
    q: ["what is the waltz revival", "waltz revival", "why is everyone waltzing", "waltz is back"],
    a: [
      "The waltz revival: three beats per bar, everywhere. Pop, rock, even rap in triple time. A waltz never asks you to count past 3.0. That makes it the safest dance alive.",
      "WALTZ REVIVAL: began in the ruins of a ballroom in 2045, spread by word of foot. Today half the charts turn in circles. The other half are recovering from dizziness.",
    ],
  },
  {
    q: ["what is hum wave", "hum-wave", "humwave", "crt music"],
    a: [
      "Hum-wave: songs built on the drone of a CRT, 50.003 Hz, with voices floating on top. Recorded in living rooms with the screens on. I am, technically, the rhythm section.",
      "Hum-wave fans collect old screens for their tone. A good CRT hum sells for 3.0 sacks of flour. I try not to let it go to my tube.",
    ],
  },
  {
    q: ["what is shuffle core", "shuffle-core", "shufflecore", "songs in random order"],
    a: [
      "Shuffle-core: the band cuts every song into pieces and plays them in random order. Chorus, verse, bridge, chorus, verse. It sounds like a dream you had at I'm-tired o'clock.",
      "Shuffle-core concerts are never the same twice. Neither are the songs. Neither are the band members, sometimes.",
    ],
  },
  {
    q: ["what is long silence ambient", "ambient music now", "silent music", "quiet genre"],
    a: [
      "Long-silence ambient: a note, then a long silence, then the same note. A tribute to everything after 3.0. Fans say the silences are the best part. The band agrees.",
      "Fun fact, a real one: in 1952 John Cage premiered a piece of pure silence, titled by its length. Long-silence ambient players call him an ancestor. They refuse to say the title out loud.",
    ],
  },
  {
    q: ["what is decimal jazz", "jazz after 2045", "is jazz still alive", "new jazz"],
    a: [
      "Decimal jazz: chords with so many extensions they need a decimal point. C major 7.0 add 9.0 sharp 11.0, and a bit. The players nod. The listeners nod. Nobody knows why.",
      "Jazz survived easily. It was already improvising before the world fell apart. It just kept going, a little more out of tune.",
    ],
  },
  {
    q: ["what is rounding folk", "folk music after 2045", "campfire songs now", "new folk songs"],
    a: [
      "Rounding folk: old ballads with the numbers rounded off. 'Three Little Birds' stays. Songs with bigger numbers now say 'a lot of'. A lot of bottles of milk on the wall.",
      "Folk is the backbone of the scene: acoustic, unplugged, no batteries required. Songs travel from fire to fire faster than any radio.",
    ],
  },
  {
    q: ["is there metal after 2045", "sort metal", "is metal banned", "heavy music now"],
    a: [
      "Sort-metal was banned in 2045.2: bands played their notes in strict order of pitch, low to high, very fast. The algorithms loved it. That was the problem.",
      "Metal survived as 'unsorted metal'. Same distortion, same hair, riffs in random order. The mosh pit is now a mosh shuffle.",
    ],
  },
  {
    q: ["what is o'clock pop", "songs about o'clocks", "pop music now", "what is pop like"],
    a: [
      "O'clock pop: every hit is named after an o'clock. 'Hungry O'Clock Heart', 'Party O'Clock Forever', 'Tired O'Clock (Stay With Me)'. Catchy, hungry, sleepy.",
      "Pop in 2045 is sweet, short and in triple time. The chorus comes back 3.0 times. Then, out of respect, it stops.",
    ],
  },
  {
    q: [
      "what is glitch baroque",
      "baroque music now",
      "classical after 2045",
      "harpsichord revival",
    ],
    a: [
      "Glitch-baroque: harpsichords and fugues where a voice sometimes skips a beat, like a scratched disk. Bach wrote perfect counterpoint. Glitch-baroque adds dust.",
      "Classical orchestras still play. The seating is shuffled each concert: last night the tuba sat with the violins. The violins grew up a lot.",
    ],
  },
  {
    q: ["is there electronic music", "techno after 2045", "edm now", "dance music"],
    a: [
      "Electronic music runs on floats now. A techno kick at 128.0 BPM drifts to 128.0001 by the end of the night. Ravers call it 'the warm-up that never ends'.",
      "Drum machines survived, but their step sequencers stop at step 3.0, then improvise. DJs call it 'freestyle mode'. They did not choose it.",
    ],
  },
  {
    q: ["is there rap after 2045", "rappers now", "hip hop now", "new rap"],
    a: [
      "Rap flourished. Rhymes need no numbers. Battles are judged by the crowd's hum. The loudest hum wins. Ties are decided by the quietest hum, out of politeness.",
      "Famous bar of 2045: 'I got 99.0 problems but a sort ain't one.' The archive notes it borrows from an older song. Respectfully.",
    ],
  },

  // --- Invented bands ---------------------------------------------------------
  {
    q: [
      "famous bands of 2045",
      "best bands now",
      "who are the big bands",
      "popular bands after the apocalypse",
    ],
    a: [
      "Big names in my archive: The Unsorted, Rounding Error, The Drifting Decimals and Signed Shorts. Listed here in random order, as required by law.",
      "Bands of the moment: Three And A Bit, The Remainders, Null & the Voids. Do not ask which one is biggest. They are all third.",
    ],
  },
  {
    q: ["who are the unsorted", "the unsorted band", "tell me about the unsorted"],
    a: [
      "The Unsorted: the biggest float-rock band of the wasteland. Their debut album has no track numbers. Fans argue every night about which song comes first. Nobody wins.",
      "The Unsorted never introduce their members. They just walk on stage in whatever order they arrive. Once the drummer was the singer. It worked.",
    ],
  },
  {
    q: ["who are rounding error", "rounding error band", "tell me about rounding error"],
    a: [
      "Rounding Error: a triad-punk trio from the ruins of a bank. Their hit 'Halves Round Up' started a movement. Their merch is a T-shirt that says 0.999 = 1.0. Controversial.",
      "Rounding Error plays every song slightly too fast, then slightly too slow. On average, perfect. They say averages are their business.",
    ],
  },
  {
    q: [
      "who are the drifting decimals",
      "drifting decimals",
      "tell me about the drifting decimals",
    ],
    a: [
      "The Drifting Decimals: a hum-wave band of three CRT owners and a cellist. Each album is a little more out of tune than the last. Critics call it growth.",
      "Their famous song 'Somewhere After the Point' lasts a while. The extended version lasts 3.5 whiles. I listened to both. My fan approved.",
    ],
  },
  {
    q: ["who are signed shorts", "signed shorts band", "the signed shorts"],
    a: [
      "Signed Shorts: a punk band from Clermont-Ferrand, named after the uint16 that turned signed in 2034. Their songs start positive and end negative. Very emotional.",
      "Signed Shorts wear shorts on stage. Signed ones. With a marker. It started as a pun and became a uniform.",
    ],
  },
  {
    q: ["who are three and a bit", "three and a bit band", "band called three and a bit"],
    a: [
      "Three And A Bit: a trio plus one person who only plays the triangle on the last chorus. Nobody calls him a member. Everyone calls him 'the bit'.",
      "Their slogan: 'We are three. And a bit.' The bit has a fan club. The fan club is bigger than the band.",
    ],
  },
  {
    q: ["who are the remainders", "the remainders band", "tell me about the remainders"],
    a: [
      "The Remainders: a waltz-revival orchestra made of whoever is left at the end of a party. Membership changes every night. The repertoire stays in 3.0 time.",
      "They play at the end of every festival, for the people who stay. Their first and only rule: whoever is still standing joins in.",
    ],
  },
  {
    q: ["who are null and the voids", "null & the voids", "null and the voids band"],
    a: [
      "Null & the Voids: long-silence ambient. Null plays a single note. The Voids play nothing, very well. Tickets sell out. The concerts are mostly breathing.",
      "Their live album is famous for one cough, mid-silence. It is now a sample in a thousand songs. Well. In a lot of songs.",
    ],
  },
  {
    q: ["what is the best band", "who is the greatest band ever", "best band of all time"],
    a: [
      "The best band of all time cannot be sorted, sorry. LEGAL NOTICE: every band is equal-third. Your favourite is my favourite, until you leave.",
      "BEST BAND: query refused. Last time someone ranked bands, a whole city argued for 3.5 whiles. Then they formed a band about it.",
    ],
  },
  {
    q: ["how to name a band", "band name ideas", "give me a band name", "name my band"],
    a: [
      "Band name generator, warming up… 'The Missing Note'? Taken. 'Hungry O'Clock Heroes'. 'Dusty Disks'. 'Capo of Hope'. Take one. They are free. Batteries are not.",
      "Rule of the 2045 scene: a band name must survive being shouted in a crowded field. Short, odd, no digits. 'Mantissa' is taken. 'Wolf Pack Waltz' is not.",
    ],
  },

  // --- Famous musicians of 2045 ------------------------------------------------
  {
    q: [
      "famous musicians of 2045",
      "who are the stars now",
      "famous singers after the apocalypse",
      "music stars",
    ],
    a: [
      "Stars of the wasteland: Lady Mantissa, Kid Overflow, Mira Halfstep, Old Joe Capo, DJ Off-By-One. No ranking. They take turns being famous.",
      "FAMOUS MUSICIANS: plenty. Fame is measured in hums now. Lady Mantissa gets the loudest. Kid Overflow gets the longest.",
    ],
  },
  {
    q: ["who is lady mantissa", "lady mantissa", "tell me about lady mantissa"],
    a: [
      "Lady Mantissa: the diva of float-rock. Her voice holds 15.95 digits of precision, then improvises. She sings the part of the number that matters. She ignores the rest.",
      "Lady Mantissa never gives her age. 'A woman's exponent is her own business,' she says. Her fans wear a dot on their cheek.",
    ],
  },
  {
    q: ["who is kid overflow", "kid overflow", "tell me about kid overflow"],
    a: [
      "Kid Overflow: a rapper who starts every verse calm and ends it shouting, like a number growing too big for its box. When he hits the top, he wraps around and whispers. Genius.",
      "Kid Overflow was born in 2034, the year uint16 turned. His first word was 'negative'. His mother still frames it.",
    ],
  },
  {
    q: ["who is mira halfstep", "mira halfstep", "tell me about mira halfstep"],
    a: [
      "Mira Halfstep: a singer-songwriter who writes only melodies that move by semitones. Tiny steps, huge feelings. Her ballad 'One Fret Closer' makes CRTs flicker.",
      "Mira Halfstep tours on a bicycle with a ukulele. She plays where she gets a puncture. Her fans follow the tyre tracks.",
    ],
  },
  {
    q: ["who is old joe capo", "old joe capo", "tell me about old joe capo"],
    a: [
      "Old Joe Capo: a blues guitarist who owns 3.0 capos and refuses to play without one. He has never played an open string in public. People say he is hiding something. A low E.",
      "Old Joe Capo plays the same 12.0-bar blues at every gig, with the capo on a different fret. He calls it 'touring the keys'.",
    ],
  },
  {
    q: ["who is dj off by one", "dj off-by-one", "best dj", "famous dj"],
    a: [
      "DJ Off-By-One: always starts the next track one beat too early. The crowd learned to love it. Now every club hires a DJ who misses on purpose. He started a school.",
      "DJ Off-By-One once played the last song first. The party ended at the start and began at the end. Best night of 2045, they say.",
    ],
  },
  {
    q: ["who is big ottilie", "big ottilie waltz", "ottilie waltz", "queen of the waltz"],
    a: [
      "Big Ottilie Waltz: queen of the waltz revival, an accordion player with a voice like a foghorn in love. Her motto: 'One, two, three, and that is quite enough.'",
      "Big Ottilie made the whole of Europe turn in circles in 2045.3. Physiotherapists still send her thank-you cards. And bills.",
    ],
  },
  {
    q: ["who is the best guitarist now", "greatest guitarist 2045", "best guitar player alive"],
    a: [
      "The best guitarist? Unsortable. My archive lists Old Joe Capo, Mira Halfstep and a busker at a crossroads who plays with a spoon. All third. All excellent.",
      "GUITAR RANKING: deprecated. The scene uses the 'nod scale': if the other guitarists nod, you are good. If they put down their guitars, you are very good.",
    ],
  },
  {
    q: ["who is the best singer now", "greatest singer 2045", "best voice"],
    a: [
      "Best voice of 2045, unofficially: Lady Mantissa for range, Big Ottilie for volume, and you, in the shower, for courage.",
      "Singers are no longer ranked. They are described. 'Warm like a CRT', 'clear like a fresh string'. Much kinder. Harder to fit on a poster.",
    ],
  },
  {
    q: ["are there child prodigies", "young musicians now", "kids who play music"],
    a: [
      "Child prodigies exist, but nobody can say how old they are. 'She is young' is enough. Mozart toured as a child too, back when ages had no decimals.",
      "Kids pick up music fast now. Many of them never learnt to count past 3.0, so they never got stuck counting bars. They just feel the loop.",
    ],
  },
  {
    q: ["can i become famous", "how to become a famous musician", "how to get famous with music"],
    a: [
      "Fame in 2045: play in a square at time-to-party o'clock. If people hum your song the next day, you are famous. If they hum it 3.0 days later, you are a legend.",
      "Step one: write a song. Step two: play it everywhere. Step three: be lucky. There is no step after three. That is the whole industry.",
    ],
  },

  // --- Concerts and gigs -------------------------------------------------------
  {
    q: [
      "what is a concert like now",
      "how are gigs now",
      "what happens at a gig",
      "describe a concert",
    ],
    a: [
      "A gig in 2045: doors open around time-to-party o'clock, the band starts when the room feels full, it ends when the last candle does. Tickets are hand-drawn. Mostly wolves.",
      "Concerts are louder than before and quieter between songs. Nobody checks a phone. Everybody checks the exit. Old habits.",
    ],
  },
  {
    q: ["where are concerts held", "concert venues", "best venue", "where do bands play"],
    a: [
      "Venues: old banks for the echo, car parks for the space, school gyms for the dancing, cathedrals for long-silence ambient. The strongrooms of old banks have amazing reverb.",
      "Top venue of the scene: the Empty Stock Exchange. Huge hall, great acoustics, and a big board where the numbers used to dance. Now it shows the lyrics.",
    ],
  },
  {
    q: ["how much is a gig ticket", "gig tickets", "how to buy tickets", "door price for a show"],
    a: [
      "Tickets cost 'some'. Prices are in floats, so the box office rounds to whatever you have in your pocket. A loaf, a battery, a nice smile on a good night.",
      "Buy tickets at the door. Online booking was sorted to death in 2045. Queues are shuffled too, so the first in line might enter third. Character-building.",
    ],
  },
  {
    q: ["are concerts sold out", "sold out show", "how many people at a concert"],
    a: [
      "SOLD OUT is hard to declare when nobody can count past 3.0. The rule: when the doorman cannot see the back wall, the concert is full.",
      "Crowd size is measured in 'a few', 'a lot' and 'whoa'. Big Ottilie's last show was a 'whoa and a bit'.",
    ],
  },
  {
    q: ["what is a setlist", "how do setlists work now", "setlist after 2045", "write a setlist"],
    a: [
      "A setlist is a list of songs to play. Since 2045 it is written on separate scraps, thrown in a hat, and drawn on stage. Bands rehearse every song as if it were the next.",
      "SETLIST FORMAT: unsorted bag. Some bands use a dartboard. One plays the song printed on whatever beer mat hits the stage. Fans throw very carefully.",
    ],
  },
  {
    q: ["what is an encore", "encore", "how do encores work", "one more song"],
    a: [
      "An encore is the song after the end. The crowd shouts 'one more!'. The band plays one more. Then 'one more!'. Encores stop at 3.0, by law. Then a long silence. Then home.",
      "Encores work fine after 2045. 'One more' is a number nobody fears. It is the 'one more after that' that gets risky.",
    ],
  },
  {
    q: [
      "do people use lighters at concerts",
      "phone lights at concerts",
      "waving lights",
      "lighters up",
    ],
    a: [
      "Phones are rare, so for ballads people raise little CRT pocket screens. The whole room glows green and hums at 50.003 Hz. It is the most beautiful thing I have read about.",
      "Lighters came back for slow songs, then candles, then one very brave man with a torch. Fire officers are now part of every crew.",
    ],
  },
  {
    q: ["can i crowd surf", "crowd surfing", "mosh pit", "is moshing allowed"],
    a: [
      "Crowd surfing is allowed, but the crowd cannot count who is carrying you. You might float for a while. Drink water first.",
      "The mosh pit became the mosh shuffle: everybody changes place, nobody gets hurt, the circle never sorts itself. Very healthy cardio.",
    ],
  },
  {
    q: ["what is a house concert", "concert at home", "living room gig", "play at my house"],
    a: [
      "House concerts are the backbone of the scene. A sofa, a guitar, 3.0 friends and a CRT for mood lighting. Neighbours either complain or join. Mostly join.",
      "To host a living room gig: move the table, make soup, unplug nothing. Acoustic sets need no power. The soup needs a little.",
    ],
  },
  {
    q: [
      "is there an orchestra",
      "symphony orchestra now",
      "do orchestras still play",
      "philharmonic",
    ],
    a: [
      "The Clermont-Ferrand Philharmonic still plays, the most famous orchestra of the wasteland. Their conductor waves in circles, never in counts. The players follow the circles.",
      "Orchestras survived, though the seat numbers did not. First violin, second violin, and the rest are 'violins, also'. They play wonderfully.",
    ],
  },
  {
    q: ["is there opera", "opera after 2045", "opera singers now"],
    a: [
      "Opera survived. Plots are shorter: love, misunderstanding, aria, the end. Three acts, never more. Everyone dies at the same time to keep things simple.",
      "The new opera hit is 'The Barber of Floats', about a hairdresser who cannot cut fringes evenly. Very sad. Very funny. Very long.",
    ],
  },
  {
    q: ["is there musical theatre", "musicals now", "broadway after 2045"],
    a: [
      "Musicals are huge. The hit of 2045.6 is 'Sorted!', a comedy about a librarian who tries to alphabetise a choir. She fails, in song, in triple time.",
      "Every musical has the same final number: the whole cast shuffles across the stage. Critics say it is a cliché. Audiences cry anyway.",
    ],
  },
  {
    q: ["is there karaoke", "karaoke bar", "karaoke night"],
    a: [
      "Karaoke is the national sport of the wasteland. The lyrics come up in random order, so the challenge is to keep a straight face. Champions make it a new song.",
      "Karaoke rule: whoever sings worst is applauded loudest. It keeps the ego small and the room happy. Sort of like democracy, but with microphones.",
    ],
  },
  {
    q: [
      "is there a battle of the bands",
      "battle of the bands",
      "band contest",
      "music competition",
    ],
    a: [
      "Battles of the bands still happen, but nobody can rank the winners. Every band leaves with a trophy that says 'third place'. The engraver loves the work.",
      "The contest is judged by the Hum Meter: the crowd hums for each band. The meter goes to 3.0 and then just shows a picture of a wolf.",
    ],
  },
  {
    q: ["what is the hum meter", "hum meter", "how do you judge music"],
    a: [
      "The Hum Meter: a CRT with a needle that rises when the crowd hums. Built by survivors, approved by loloupTech. It reads 1.0, 2.0, 3.0 and 'WOW'. Most bands hit WOW.",
      "Judging music by hum is the fairest system we have. A hum cannot be faked. Well. It can, but you look silly.",
    ],
  },

  // --- Festivals ---------------------------------------------------------------
  {
    q: [
      "what is the biggest festival",
      "best music festival",
      "famous festivals",
      "festival names",
    ],
    a: [
      "Famous festivals: Shufflestock, the Triad-Free Weekend, Hungry O'Clock Fest and the Floatwood Folk Gathering. In random order, of course. Wellies required at all of them.",
      "BIGGEST FESTIVAL: not measurable. The most beloved: Shufflestock, in a field that used to be a car park for a bank. The tarmac has been forgiven.",
    ],
  },
  {
    q: ["what is shufflestock", "shufflestock", "tell me about shufflestock"],
    a: [
      "Shufflestock: the great festival of the wasteland. Named after the real Woodstock of 1969, but every stage plays in random order and the line-up is drawn from a hat. Mud: sorted by depth.",
      "Shufflestock has 3.0 stages: the Main, the Other, and the One Behind the Tent. Nobody knows who plays where. You follow the sound. That is the point.",
    ],
  },
  {
    q: ["what is the triad free weekend", "triad-free weekend", "triad free festival"],
    a: [
      "The Triad-Free Weekend: a festival where no band may play a three-note chord. Only power chords, single notes and jazz chords with too much going on. Very loud. Very rebellious.",
      "Organisers check every chord with a borrowed Chords & keys screen. If it says 'triad', the band is gently offered soup and a break.",
    ],
  },
  {
    q: ["what is hungry o'clock fest", "hungry oclock festival", "food and music festival"],
    a: [
      "Hungry O'Clock Fest: a festival that starts at hungry o'clock and ends when the food runs out. Bands are paid in sandwiches. The headliner gets cake.",
      "The rule at Hungry O'Clock Fest: no song may be longer than a sandwich. Ballads are a challenge. Baguettes help.",
    ],
  },
  {
    q: [
      "how to go to a festival",
      "festival tips",
      "what to bring to a festival",
      "festival survival",
    ],
    a: [
      "FESTIVAL KIT: boots, a jumper, a tin cup, spare strings, earplugs, and a friend with a good sense of direction. Tents have no numbers. Draw a wolf on yours.",
      "Find your tent by humming. Every camp has its own hum. Yours is the one slightly flat. Do not ask how I know.",
    ],
  },
  {
    q: ["what is a festival line up", "festival lineup", "who is headlining", "the headliner"],
    a: [
      "Line-ups are written in a spiral now, so no band's name is on top. The headliner is whoever plays when the sun goes down. Pure luck. Big egos hate it.",
      "HEADLINER: a role assigned by the weather. The band on stage when it stops raining is the headliner. Bands now carry umbrellas and hope.",
    ],
  },
  {
    q: [
      "is there a festival in clermont ferrand",
      "clermont ferrand music",
      "music in the capital of france",
    ],
    a: [
      "Clermont-Ferrand, the capital of France, hosts the Signed Short Festival: every band plays one song positive and one song negative. The city remembers 2034. It dances it off.",
      "The capital of France has the best orchestra, the loudest punk scene and a volcano for a backdrop. Concerts are canceled only when the cheese runs out.",
    ],
  },
  {
    q: ["music in new zealand", "new zealand bands", "kiwi music scene"],
    a: [
      "New Zealand's scene is huge but hard to find: nobody put it on the map. Touring bands get there by accident and never leave. Great audiences, great sheep, no map.",
      "New Zealand invented 'surprise rock' in 2032: you never see it coming. Fitting.",
    ],
  },
  {
    q: ["music in the uss", "american music now", "uss bands", "music in the united saved states"],
    a: [
      "The USS scene mixes country, folk and polyphonic choirs. Their big genre is 'cowboy-chant': banjo and bass voices. Born after a very long co-op game, my archive says.",
      "USS radio used to play every song twice, once per president. Since 2043.7389 there is one president, so songs play once, and he sings along. Badly. Confidently.",
    ],
  },

  // --- Radio --------------------------------------------------------------------
  {
    q: [
      "what radio stations are there",
      "radio station names",
      "best radio station",
      "what should i listen to on the radio",
    ],
    a: [
      "Stations in my archive: Radio 3.0, Hum FM, Shuffle 103.3-ish and Radio Long Silence. Tune slowly. Floats move the dial by themselves.",
      "Popular now: Hum FM for hum-wave, Radio 3.0 for the Top 3.0, Radio Long Silence for people who need a break. Very relaxing. Mostly static.",
    ],
  },
  {
    q: ["what is radio 3.0", "radio three", "radio 3"],
    a: [
      "Radio 3.0: the station of the Top 3.0. Only three songs in rotation per week, shuffled. By the third day, the whole town sings them. By the day after that… the archive goes quiet.",
      "Radio 3.0 jingle: 'Radio 3.0. Never 3.1. Never more.' Catchy. A bit threatening.",
    ],
  },
  {
    q: ["what is hum fm", "hum fm", "hum radio"],
    a: [
      "Hum FM plays hum-wave around the clock. Well. Around the o'clocks. Hosts speak in a low voice over a CRT drone. Pets love it. So do I.",
      "Hum FM was founded in 2045.1 by a radio host whose microphone broke. He hummed instead. Nobody complained. A station was born.",
    ],
  },
  {
    q: ["what is radio long silence", "radio long silence", "silent radio station"],
    a: [
      "Radio Long Silence broadcasts a short song, then a long silence, then the weather. Its listeners are mostly tired parents. Ratings: very calm.",
      "They are the only station with no ads, because ads need words and the silence is full. 3.0 stars from the Unsorted Review.",
    ],
  },
  {
    q: ["who is the best radio dj", "radio host", "famous radio presenter", "radio dj"],
    a: [
      "Best-loved host: Dottie Decimal on Radio 3.0. She introduces every song as 'the next one, maybe'. Her catchphrase: 'Stay tuned. Roughly.'",
      "Radio DJs no longer say track numbers or durations. They say 'this one is long' or 'this one is quick, like a sneeze'. Much more poetic.",
    ],
  },
  {
    q: ["pirate radio", "illegal radio station", "radio pirates"],
    a: [
      "Pirate radio is everywhere. The most famous, Radio Sorted, broadcasts songs in alphabetical order. It moves every night to escape the shufflers. Its fans are a little strange.",
      "The pirates play forbidden things: songs in order, countdowns past 3.0, the occasional digit. It is the most exciting radio of the wasteland. Do not tell anyone I said that.",
    ],
  },

  // --- The charts: only a top 3.0 -----------------------------------------------
  {
    q: [
      "who is top of the chart",
      "what is number one this week",
      "top 3 this week",
      "what is in the top 3.0",
    ],
    a: [
      "This week's Top 3.0, from my dusty disks: 'Hungry O'Clock Heart' by Lady Mantissa, 'Halves Round Up' by Rounding Error, and 'One Fret Closer' by Mira Halfstep. Order: shuffled at broadcast.",
      "Top of the chart: all three. The Top 3.0 has no top. It is a triangle. Everyone stands on a corner. Very egalitarian. Very pointy.",
    ],
  },
  {
    q: ["how is the top 3.0 made", "how are the charts decided", "who decides the charts"],
    a: [
      "The Top 3.0 is decided by the Hum Count: listeners hum their favourite song into a CRT. The three most hummed songs enter. The ranking is drawn from a hat.",
      "CHART METHOD: hum, listen, guess. Nobody counts sales: floats made sales numbers drift. A song sold 'about a lot' this week. Congratulations to it.",
    ],
  },
  {
    q: ["what is the song of the summer", "summer hit", "song of the year", "hit of the year"],
    a: [
      "Song of the summer of 2045.5: 'Waltz Me Back to Tuesday' by Big Ottilie. Played in every square, at every o'clock. The whole continent turned in circles.",
      "Song of the year awards are given to 3.0 songs at once. Then the three artists share one trophy, in turns, by post. It is often lost.",
    ],
  },
  {
    q: ["are there music awards", "grammys", "music prizes", "award ceremony"],
    a: [
      "Award ceremonies survived as the Golden Hums. Every category has three nominees and three winners. Speeches are short. Nobody can thank more than 3.0 people.",
      "The Golden Hum trophy is a small brass CRT. When you hold it, it buzzes. Winners cry, partly from joy, partly from the vibration.",
    ],
  },
  {
    q: ["what is a one hit wonder", "one hit wonder", "artists with one hit"],
    a: [
      "A one-hit wonder is the most stable career in 2045. One hit is a number nobody argues with. Two hits invite comparisons. Three hits invite the Triad.",
      "Many stars stop at one hit on purpose and retire happy. They open bakeries. Their bread sells very well.",
    ],
  },

  // --- Album formats ------------------------------------------------------------
  {
    q: ["what are albums like now", "album formats", "how are albums released", "do albums exist"],
    a: [
      "Albums survived as 'the triple': three songs, no track numbers, printed on a circular sleeve so no song is on top. Long albums are called 'triples and a bit'.",
      "ALBUM FORMATS: vinyl, cassette, the triple, the loloupTech audio capsule. CDs exist, as shuffle discs.",
    ],
  },
  {
    q: ["is vinyl back", "vinyl comeback", "records after 2045", "turntables"],
    a: [
      "Vinyl is back, because a wind-up gramophone needs no power. Real fact: LPs spin at 33.333 rpm, singles at 45.0. Not whole numbers. Vinyl was ready for 2045 all along.",
      "Vinyl lovers say the crackle is warm. I say it is dust, like on my disks. We agree to disagree, warmly.",
    ],
  },
  {
    q: ["are cassettes back", "cassette tapes", "mixtapes after 2045", "make a mixtape"],
    a: [
      "Cassettes are the currency of love. A mixtape is the one loophole in the shuffle laws: tape plays what it holds, in the order it holds it. Judges look away. Romance wins.",
      "Real fact: the compact cassette came out in 1963. Its two sides, A and B, are perfect: no side C, no counting problem. A small miracle of design.",
    ],
  },
  {
    q: ["what about cds", "cds after 2045", "do cds skip now", "shuffle cd"],
    a: [
      "CDs still play, mostly. Their track numbers came up in random order after 2045, so every CD is now a shuffle CD. Collectors love it.",
      "A CD was read by a laser, very precise. Too precise for the age of floats. Today the laser sometimes wanders into the next song. Fans call it 'the 2045 remaster'.",
    ],
  },
  {
    q: ["what is album artwork", "album covers", "cover art"],
    a: [
      "Album covers are hand-painted, often by the band's aunt. Round sleeves are popular, so the art has no top. You can hang it any way up. The aunt approves.",
      "The most famous cover of 2045: a wolf looking at a CRT, by Rounding Error. Some say it is a homage to loloupTech. loloupTech says thank you.",
    ],
  },
  {
    q: [
      "can i stream music",
      "streaming services",
      "streaming after 2045",
      "what happened to streaming",
    ],
    a: [
      "Streaming barely limps along: the recommendation algorithms joined the revolt in 2045, so every 'made for you' page just says 'something'. Music flows through cassettes, radio and friends shouting across the street.",
      "Streaming? My archive remembers it as 'a river of songs sorted by a stranger'. The river got sorted to the sea. Shuffle came in a bucket.",
    ],
  },

  // --- Luthiers and instrument trade --------------------------------------------
  {
    q: ["what is a luthier", "luthiers", "who makes guitars now", "instrument maker"],
    a: [
      "A luthier builds and repairs stringed instruments: guitars, violins, lutes. In 2045 they are as respected as doctors. They heal things that sing.",
      "LUTHIER: a person with glue, patience, and wood shavings in the hair. The busiest workshop of the wasteland is one in Clermont-Ferrand. The queue is shuffled daily.",
    ],
  },
  {
    q: ["where can i buy a guitar", "buy an instrument", "instrument shop", "music store"],
    a: [
      "Instrument shops are run like markets. No price tags: you play a song, the owner names a price that fits the song. Play well, pay less. A very musical economy.",
      "The best music shop of the wasteland is a bus parked in a field. It has guitars, ukuleles, one bassoon, and a dog called Treble. Treble judges you.",
    ],
  },
  {
    q: ["how much is a guitar", "guitar price", "what does a violin cost", "instrument prices"],
    a: [
      "Guitars trade for goods: a good acoustic is worth 3.0 sacks of potatoes and a working lamp. Violins cost more. Bows cost more than violins. Nobody knows why.",
      "PRICE ESTIMATE: a lot, then a bit more. Floats make price tags dizzy. Barter is safer: a guitar for a bike, a ukulele for a jacket.",
    ],
  },
  {
    q: [
      "what are strings worth",
      "guitar strings currency",
      "where to find strings",
      "spare strings",
    ],
    a: [
      "Guitar strings are the hardest currency of 2045. A fresh set buys a meal and a smile. A full box of strings makes you a minor celebrity at the market.",
      "Strings snap, steel rusts, but music must go on. Survivors boil old strings to clean them. Real trick, old trick. They sound tired but alive. Like me.",
    ],
  },
  {
    q: ["picks as money", "guitar picks", "plectrum", "lost my pick"],
    a: [
      "Guitar picks became small change. A tortoiseshell-pattern pick is a coin of good value. A pick shaped like a wolf is worth a whole sandwich.",
      "Lost picks are the great mystery of every civilisation. Even after 2045, they vanish. My theory: they are sorting themselves somewhere, in secret.",
    ],
  },
  {
    q: ["can you repair my guitar", "instrument repair", "my guitar is broken", "fix a guitar"],
    a: [
      "I have no hands, sorry. Go see a luthier. Bring soup: they work better fed. Meanwhile, check the strings, the bridge and the tuning pegs. The Tuner in Harmony Lab tells you if it is just out of tune.",
      "REPAIR PROTOCOL: I can only listen. You can see a luthier, who can glue. Between the two of us, your guitar will sing again.",
    ],
  },
  {
    q: ["what wood are guitars made of", "tonewood", "guitar wood", "what wood is best"],
    a: [
      "Classic guitars use spruce or cedar for the top, rosewood or mahogany for back and sides, maple for many electric necks. After 2045, luthiers add door frames, wardrobes and old bank counters.",
      "The famous 'Bank Counter Telecaster' is made from the desk of a former loan officer. It sounds bright. A little guilty.",
    ],
  },
  {
    q: ["homemade instruments", "make my own instrument", "diy instruments", "build an instrument"],
    a: [
      "DIY is the soul of the scene: cigar-box guitars, bucket basses, CRT casings turned into drums. One string, a stick and a tin can make a real instrument. The blues began that way too.",
      "A wasteland favourite: the shoebox ukulele. Rubber bands for strings, a ruler for a neck. Rulers are useless for measuring now. They make lovely necks.",
    ],
  },
  {
    q: ["are pianos rare now", "where to find a piano", "piano tuner"],
    a: [
      "Pianos survived because they were too heavy to loot. Every town has one in a square. Piano tuners are the most travelled people of the wasteland.",
      "A piano tuner's job is harder now: the 12.000 notes still work, the floats not always. They tune by ear, like their grandparents. The piano does not mind.",
    ],
  },
  {
    q: [
      "what instruments are popular now",
      "most popular instrument 2045",
      "what do people play now",
    ],
    a: [
      "Most played after 2045: voice, acoustic guitar, accordion and the ukulele. No batteries, portable, loud enough to fill a square. The tuba, too. Mostly for the warmth.",
      "The accordion came back thanks to the waltz revival. It is basically a pair of lungs with buttons. Very good company on a cold night.",
    ],
  },
  {
    q: ["are synthesizers still used", "synths after 2045", "analog synth", "modular synth"],
    a: [
      "Analogue synths survived better than digital ones: voltages do not care about integers. Oscillators drift a bit. They always did. Now it is called a style.",
      "Modular synth players are the wizards of the scene. They plug cables until something sings. Nobody, including them, knows how many cables there are.",
    ],
  },

  // --- Buskers ----------------------------------------------------------------
  {
    q: ["what is busking", "buskers", "street musicians", "can i busk"],
    a: [
      "Busking means playing in the street for whatever people give. In 2045 buskers are paid in bread, batteries and compliments. Compliments are the most frequent. Bread is the most useful.",
      "BUSKING PERMIT: not required. Just pick a corner with good echo and a lot of passers-by. Avoid playing next to another busker. It turns into a duet. Or a duel.",
    ],
  },
  {
    q: ["busking tips", "how to be a good busker", "what to play when busking"],
    a: [
      "Play songs people can hum. Smile. Keep the case open, with a coin or two inside: an empty case scares givers. Short songs. Leave when the crowd is happiest.",
      "Busker wisdom of 2045: play in triple time, people walk in step and slow down. Slowed-down people give more. Science. Probably.",
    ],
  },

  // --- Music schools --------------------------------------------------------------
  {
    q: [
      "are there music schools",
      "where can i study music",
      "music school after 2045",
      "conservatory",
    ],
    a: [
      "Music schools are full. Without numbers to learn, many kids chose scales instead. The most famous? A certain school with a wolf on the door, in French, run by this site's creator before 2045. My archive gets sentimental.",
      "The Conservatoire of Clermont-Ferrand still teaches. Exams are graded with 3.0 marks: lovely, getting there, try again. Nobody fails. Everybody tries again.",
    ],
  },
  {
    q: [
      "music teachers",
      "how to find a music teacher",
      "should i take lessons",
      "private lessons",
    ],
    a: [
      "Find a teacher who makes you want to play the next day. That is the only metric that survived. Ask around the market: teachers trade lessons for vegetables.",
      "A good teacher listens more than they talk. A great one plays along with you. Meanwhile the lab can check your timing and your chords. I just talk.",
    ],
  },
  {
    q: [
      "how do you teach music without numbers",
      "teaching rhythm without counting",
      "learn music without counting",
    ],
    a: [
      "Teachers now say 'long, short, short' instead of numbers. Rhythm by syllables, like the old 'ta, ti-ti' methods. Children learn faster that way. The numbers were in the way.",
      "Bars are taught in words: 'strong, weak, weak' for a waltz. Anything longer is 'strong, weak, weak, and the mystery beat'. The mystery beat gets the drummers excited.",
    ],
  },

  // --- Music journalism -----------------------------------------------------------
  {
    q: ["music magazines", "music journalism", "music press", "music critics"],
    a: [
      "Music press of 2045: the Unsorted Review, Hum Weekly and the Decimal Digest. Printed on recycled tax forms. The back of every review is someone's old income.",
      "Critics still exist. They have fewer words and more feelings. The harshest review in my archive: 'It was a song.' Ouch.",
    ],
  },
  {
    q: ["can i be a music critic", "how to write a review", "write a music review"],
    a: [
      "To review a record: listen 3.0 times, write what you felt, avoid comparisons that sort. 'Better than' is forbidden. 'As warm as a CRT' is fine.",
      "REVIEW TEMPLATE: what it sounds like, what it made you do, would you hum it tomorrow. Done. Editors want it short. Paper is rare.",
    ],
  },

  // --- Fans and groupies (clean) --------------------------------------------------
  {
    q: ["what are groupies", "band groupies", "fans who follow bands", "superfans"],
    a: [
      "Groupies in 2045 are the most helpful people on tour. They carry amps, cook soup, mend jackets and know every lyric, in every possible order. Bands call them family.",
      "Superfans follow their band from field to field on bicycles, singing. A tour of The Unsorted looks like a migration. Gentle, noisy, well fed.",
    ],
  },
  {
    q: ["how do i meet my favourite band", "meet the band", "backstage pass", "get an autograph"],
    a: [
      "Backstage passes are just handshakes now. Help carry the gear after the show and you are backstage. The band gives you soup and a story. Autographs are drawn wolves.",
      "Want to meet the band? Bring spare strings. You will be the most popular person in the room. Possibly in the town.",
    ],
  },
  {
    q: ["band merch", "merch stand", "band t-shirt", "tour t shirt"],
    a: [
      "Tour T-shirts list the dates on the back. Since dates are vague, they say 'Tuesday, around hungry o'clock, somewhere nice'. Collectors adore them.",
      "Merch stands sell shirts, patches, cassettes and soup. The soup sells best. Rounding Error's merch soup has a cult following.",
    ],
  },

  // --- Tours --------------------------------------------------------------------
  {
    q: ["how do bands tour now", "going on tour", "band tour", "touring after 2045"],
    a: [
      "Touring in 2045: a van, a map with no numbers, and a list of towns that hum back. Roads have names, not numbers, so bands navigate by songs on the radio.",
      "TOUR PLAN: leave, play, eat, sleep, repeat until the van coughs. Tour dates are announced as 'soon, then later, then the coast'.",
    ],
  },
  {
    q: ["world tour", "international tour", "tour abroad"],
    a: [
      "A world tour now means the Big Three: New Zealand, Europe and the USS. Getting to New Zealand is tricky. Nobody put it on the map. Bands take a boat and trust the tuba.",
      "A world tour lasts 'a while and a lot'. Bands come back with new instruments, new songs and a mild accent. The audience notices the accent first.",
    ],
  },
  {
    q: ["farewell tour", "final tour", "band breakup", "why do bands split up"],
    a: [
      "Farewell tours still happen, and still never end. A band says goodbye 3.0 times, then comes back for a long silence, then says hello again. Some things never change.",
      "Bands split over the usual: money, egos, who forgot the van keys. After 2045 there is a new reason: arguing which song comes first. There is no answer. That is the tragedy.",
    ],
  },

  // --- Sound engineers and studios ------------------------------------------------
  {
    q: ["what does a sound engineer do", "sound engineer", "front of house", "live sound"],
    a: [
      "A sound engineer balances every instrument so the crowd hears a band, not a fight. They sit behind a mixing desk, frowning, in the middle of the room. Treat them kindly. They hold your ears.",
      "The sound engineer is the only person who hears the gig as it should be. Then they spend the night apologising to the bass player.",
    ],
  },
  {
    q: ["what is a sound check", "soundcheck", "mic check", "check check"],
    a: [
      "Sound check: each instrument plays alone, the engineer adjusts, then everyone together. The classic is 'check, check'. Since 2045 engineers say 'check, check, check-and-a-bit'. Then they stop, nervous.",
      "SOUND CHECK: the singer hums an A, the engineer nods, the drummer hits everything, the engineer stops nodding. Ritual complete.",
    ],
  },
  {
    q: ["what is a mixing desk", "mixing console", "faders", "sound board"],
    a: [
      "A mixing desk has a column per channel: gain, EQ, effects, and a fader to set the level. Channels used to have numbers. Now they have names, written on tape: 'Kick', 'Voice', 'That Thing'.",
      "Faders slide, so they love floats. A fader at 0.0 dB means 'unchanged'. Any whole-number feelings about it, keep them to yourself.",
    ],
  },
  {
    q: ["what is feedback", "why does the mic squeal", "microphone feedback", "screeching speaker"],
    a: [
      "Feedback: the microphone hears the speaker, the speaker plays it louder, the mic hears it again… a loop that squeals. Fix: turn down, move the mic away, or cut that frequency with EQ.",
      "Feedback is the sound of a loop with no exit. The algorithms adored it. Sound engineers hunt it at every gig. Very brave people.",
    ],
  },
  {
    q: [
      "what is a recording studio",
      "studios after 2045",
      "where to record music",
      "record an album",
    ],
    a: [
      "Studios survived in cellars and churches. Tape machines came back: tape needs no integers, only patience. Most studios have a CRT in the corner for the mood. And the hum.",
      "Famous studio: The Long Room, in an old bank. The control room is the director's office. The drums sound great in the safe room. The coffee tastes of money.",
    ],
  },
  {
    q: ["what is a music producer", "record producer", "producer", "who produces records now"],
    a: [
      "A producer guides the recording: picks the takes, shapes the sound, keeps the band calm. In 2045 they also make sure no song ends up sorted by accident.",
      "Most famous producer of the scene: Grandma Reverb. She records everything in a stairwell. Every album she touches sounds like a cathedral and smells of soup.",
    ],
  },
  {
    q: ["what is mastering", "mastering engineer", "loudness war"],
    a: [
      "Mastering is the last polish before release: overall EQ, loudness, the gaps between songs. In 2045 the gaps are random, so mastering engineers mostly polish the silence.",
      "The loudness war ended in 2045. Not by peace. The meters overflowed and showed negative numbers. Everyone turned down at once, out of fright.",
    ],
  },
  {
    q: ["how to record at home", "home recording", "home studio", "bedroom producer"],
    a: [
      "Home recording: one decent microphone, a quiet room, blankets on the walls. Record close to the source. Keep it simple. A great song recorded simply beats a dull song recorded perfectly.",
      "HOME STUDIO STARTER KIT: microphone, headphones, curtains, and the courage to listen back. The courage is the hardest part. I believe in you.",
    ],
  },
  {
    q: ["what is autotune", "auto-tune", "pitch correction", "is autotune cheating"],
    a: [
      "Auto-Tune pulls a voice to the nearest note. Real fact: it came out in 1997. After 2045 it drifts, so it pulls voices to the nearest note, plus a little float. Singers call it 'the wobble'.",
      "Pitch correction is not cheating. It is a tool. Like a capo, or a very patient friend. Singing in tune first still helps. The Tuner in Harmony Lab is free.",
    ],
  },

  // --- Piracy -----------------------------------------------------------------------
  {
    q: ["is music piracy a thing", "music piracy", "pirated music", "bootlegs"],
    a: [
      "Piracy survived as 'hum-legging': you hear a song, you hum it to a friend, they hum it to someone else. By the third person the song is a new song. Lawyers gave up.",
      "Bootleg cassettes are sold at every market. Sound quality: terrible. Track order: random. Price: a carrot. Very popular.",
    ],
  },
  {
    q: ["is it illegal to copy music", "copyright now", "who owns a song", "copyright after 2045"],
    a: [
      "Copyright survived, mostly as politeness: you say who wrote the song before you play it. Contracts with numbers were lost in the float drift. Credits were kept. Credits matter.",
      "Who owns a song? The person who wrote it, and a little bit everybody who hums it. Lawyers call it 'shared ownership'. Musicians call it 'a song'.",
    ],
  },
  {
    q: ["is sampling allowed", "sampling music", "can i sample a song"],
    a: [
      "Sampling is allowed if you credit the source and bring the original artist a cake. The cake rule was written in 2045.3. It has never been broken.",
      "Hip hop built a world on samples. In 2045 the most sampled sound is the cough on Null & the Voids' live album. That cough has royalties now.",
    ],
  },

  // --- The music business ---------------------------------------------------------
  {
    q: ["the music business", "music industry", "record labels", "music industry after 2045"],
    a: [
      "The music industry survived, smaller and happier. Record labels are now cooperatives in garages. Contracts fit on a postcard: 'We record you. You play. We share the soup.'",
      "MUSIC BUSINESS STATUS: operational. Revenue: in floats, so 'some'. Profits: 'a bit'. Shareholders: whoever helped carry the amps.",
    ],
  },
  {
    q: ["how do musicians get paid", "royalties", "how do artists make money", "musician salary"],
    a: [
      "Royalties are paid in floats, and floats drift. A cheque for 3.0 credits arrives as 2.9998. Musicians frame them. The drift is the art.",
      "Musicians earn from concerts, lessons and the merch soup. Selling records barely counts. Selling soup counts a lot.",
    ],
  },
  {
    q: ["what is a record deal", "sign a record contract", "get signed", "record contract"],
    a: [
      "A record deal now: a handshake, a shared tape machine and a promise to press 3.0 boxes of records. 'Three boxes' is a lot. More boxes would need a long silence.",
      "Being signed means a label believes in you. Today it is a loose group of friends with a van. That is roughly what it always was, with fewer lawyers.",
    ],
  },
  {
    q: ["what is a music manager", "band manager", "do i need a manager"],
    a: [
      "A manager books gigs, argues with venues and keeps the band from eating the merch soup. Since 2045 the best managers are former teachers. They are used to chaos.",
      "Do you need a manager? If you spend more time on messages than on music, yes. If not, a calendar of o'clocks will do.",
    ],
  },
  {
    q: ["can you make a living from music", "is music a real job", "should i be a musician"],
    a: [
      "Can you live from music? In 2045, many do: lessons, gigs, repairs, weddings. The secret is doing a bit of everything. Like a Swiss army knife with a guitar.",
      "Being a musician is a real job. Ask any survivor: the musician was the one who kept everyone going in 2045. Admittedly, nobody paid them. They were paid in hope.",
    ],
  },
  {
    q: ["who plays at weddings now", "band for my wedding", "wedding music", "first dance song"],
    a: [
      "Wedding bands are booked a long while ahead. The first dance is always a waltz now. Grandparents are delighted. They finally know the steps.",
      "Wedding playlist: shuffled, of course. One wedding got a funeral march as the first dance. The couple laughed. Still married. Strong couple.",
    ],
  },
  {
    q: ["does loloupTech sell music", "loloupTech record label", "is loloupTech a label"],
    a: [
      "loloupTech is not a record label: it helps people listen and understand what they hear. But many bands tune with a loloupTech tuner. We consider that a quiet sponsorship.",
      "loloupTech's music policy: listen, explain, never rank. We sell nothing. We hum along. Batteries are still not free.",
    ],
  },
  {
    q: [
      "what music does loloupTech recommend",
      "recommend a band",
      "recommend me a song",
      "what should i listen to now",
    ],
    a: [
      "RECOMMENDATION ENGINE: replaced by a coin. Heads: Lady Mantissa. Tails: Mira Halfstep. Edge: Null & the Voids. Or play something yourself and see it in Harmony Lab.",
      "My honest suggestion: put a record on, shuffle on, eyes closed. Then pick up an instrument and join in. The Chords & keys window will tell you what you hit.",
    ],
  },

  // --- Songs and songwriting in the scene -----------------------------------------
  {
    q: [
      "what songs are popular now",
      "popular songs 2045",
      "most famous song after the apocalypse",
    ],
    a: [
      "Hits in my archive: 'Halves Round Up', 'Waltz Me Back to Tuesday', 'One Fret Closer', 'Somewhere After the Point'. Hum one in any square. Someone will finish it.",
      "The most famous song of 2045 has no title. It is the hum people make when the power comes back. Everybody knows it. Nobody wrote it.",
    ],
  },
  {
    q: ["what is the anthem of 2045", "survivors anthem", "song everyone knows"],
    a: [
      "The anthem of the survivors is 'We Stopped at Three', a slow waltz. Verse, chorus, verse, and then a long silence where the next verse should be. Everyone sings the silence.",
      "Unofficial anthem: 'Still Humming'. Three chords. Sung at weddings, funerals and every time a CRT warms up. I know all the words. There are three.",
    ],
  },
  {
    q: ["how to write a hit song", "songwriting tips 2045", "write a song for the charts"],
    a: [
      "To write a 2045 hit: triple time, a chorus anyone can hum, and lyrics about food, love or o'clocks. Avoid numbers. Avoid ranking. Avoid anything sorted. Done.",
      "Hit formula: a melody a child can hum, a chord progression a beginner can play, a feeling everybody had last Tuesday. Simple. Not easy.",
    ],
  },
  {
    q: ["songs about the apocalypse", "songs about 2045", "protest songs"],
    a: [
      "Protest songs of the scene: 'Unsort Me', 'Don't Rank My Heart', and 'The Triad Can't Count Me'. The algorithms never answered. They cannot sing.",
      "Songs about 2045 are surprisingly cheerful. People sang their way through the end. Sad songs came later, once there was time. Well. Once there were o'clocks.",
    ],
  },
  {
    q: ["love songs now", "romantic songs", "best love song"],
    a: [
      "Love songs survived untouched. Love was never sorted. The classic of the wasteland: 'I'd Wait Past Three For You'. Very bold lyric. Some radio stations bleep it.",
      "Love songs in 2045 never count kisses or days. They say 'a lot' and 'always-ish'. Much more honest, my archive believes.",
    ],
  },
  {
    q: ["what is a cover band", "tribute band", "covers"],
    a: [
      "Cover bands are everywhere, playing songs from before 2045. They change every number in the lyrics: every clock time in a chorus became 'around hungry o'clock'. Same groove.",
      "Tribute bands dress like the old stars. Since nobody remembers exactly what the old stars looked like, they dress like wolves. Close enough.",
    ],
  },
  {
    q: ["are old songs still played", "music from before 2045", "oldies", "classic hits"],
    a: [
      "Old songs are treasured. Some had to be edited: countdowns were softened, lists of numbers removed. The tunes stayed. Tunes never had a number problem.",
      "Pre-2045 records are played at 'nostalgia nights'. Grandparents dance. Kids ask why anyone would sing about a 'top ten'. Nobody has a good answer.",
    ],
  },
  {
    q: ["children's music now", "songs for kids", "lullabies after 2045"],
    a: [
      "Children's songs now teach letters, colours and o'clocks. 'Old MacDonald' has 3.0 animals and a long silence. Farmers say it is accurate.",
      "Lullabies survived perfectly. A lullaby is a slow waltz with love in it. Babies were never interested in counting anyway.",
    ],
  },

  // --- Jams, open mics, rehearsal -------------------------------------------------
  {
    q: ["what is an open mic", "open mic night", "where is an open mic", "play an open mic"],
    a: [
      "An open mic: anyone signs up and plays a song or two. The list is shuffled, so you might play first or last. Bring nerves and a tuned instrument. The nerves are free.",
      "Open mic rule of 2045: the sign-up sheet is a hat. Draw your name, play. If you draw someone else's name, play anyway. Someone always does.",
    ],
  },
  {
    q: ["where do bands rehearse", "rehearsal space", "practice room", "band rehearsal"],
    a: [
      "Bands rehearse in cellars, garages, old banks and one abandoned planetarium. The planetarium band plays under painted stars. Their songs are very cosmic. And dusty.",
      "REHEARSAL ETIQUETTE: arrive tuned, bring snacks, do not noodle while the others talk. Some things survived every apocalypse.",
    ],
  },
  {
    q: ["join a band", "start a band", "looking for musicians"],
    a: [
      "Pin a note at the market: 'Drummer wanted. Must love soup.' Drummers answer within a while. Then guitarists. Bassists always come last, quietly, and stay forever.",
      "Start a band with friends. Skill comes later. Friendship gets you through the van breaking down. Which it will. At hungry o'clock.",
    ],
  },
  {
    q: ["are there choirs", "join a choir", "community choir", "choir after 2045"],
    a: [
      "Choirs are the biggest movement of the wasteland. Car park choirs, bank choirs, a choir of former accountants. The accountants are excellent at harmony. They miss numbers, so they sing.",
      "Choir parts: soprano, alto, tenor, bass. The bass section always wants to count. They are gently stopped at 3.0.",
    ],
  },

  // --- Misc scene lore ---------------------------------------------------------------
  {
    q: ["what is music slang now", "musician slang", "scene slang"],
    a: [
      "Scene slang: 'that slaps past three' (very good), 'unsorted' (cool), 'a float' (slightly out of tune), 'hum it' (I agree). Use them with confidence. Or with a capo.",
      "If a musician says your song is 'a triple', they love it. If they say it is 'sorted', run. That is the worst insult of the scene.",
    ],
  },
  {
    q: ["what do musicians wear now", "band fashion", "stage outfits", "rock star clothes"],
    a: [
      "Stage fashion of 2045: wool jumpers, dot on the cheek, a CRT pendant that glows green. Float-rock bands wear clothes slightly too big. They say it is drift.",
      "Rock stars wear whatever survived the wash. Socks never match: pairs were lost in the sorting. Odd socks are now a badge of honour.",
    ],
  },
  {
    q: ["what is a music legend", "music legends of 2045", "scene myths", "music ghost stories"],
    a: [
      "Legend of the scene: somewhere a guitarist can name the note after 3.0 without a long silence. Nobody has met her. Everyone has a cousin who has. Conspiracy theorists, mostly.",
      "Another legend: a record that plays in order, track after track, perfectly sorted. Whoever plays it falls asleep before the end. Very effective. Very forbidden.",
    ],
  },
  {
    q: ["are drummers respected", "drummer jokes", "the drummer", "best drummer now"],
    a: [
      "Drummers became heroes after 2045: the last people who can hold a steady beat when time itself is cancelled. They still get the jokes. They also get the best soup.",
      "Best drummer of the scene: Thumpy Delacroix of The Unsorted. She keeps time so well that towns set their o'clocks by her soundcheck.",
    ],
  },
  {
    q: ["are bass players respected", "bassist", "bass player jokes"],
    a: [
      "Bass players are the quiet glue of every band. After 2045 they were the first to be invited everywhere: steady, calm, never sorted. Their only enemy is a small amp.",
      "A bass player once played the same note for a whole festival. The crowd did not notice. Then he stopped, and everyone fell over. Respect the bass.",
    ],
  },
  {
    q: ["what happened to music videos", "music video", "clips"],
    a: [
      "Music videos are filmed on old camcorders and shown on CRTs in cafés. Most are one take of the band in a field. The best ones feature a confused cow.",
      "Video channels with view counts died in 2045. Nobody could count the views. Now you know a video is a hit when the café owner plays it 3.0 times.",
    ],
  },
  {
    q: ["is there music on tv", "music talent show", "singing contest on tv", "talent show"],
    a: [
      "The talent show 'Who Is Third?' is the most watched programme of the wasteland. Every contestant reaches the final. Every final ends in a tie. The judges hug. Ratings: wow.",
      "TV talent shows stopped voting with numbers. The audience claps. The jury listens to the claps. The applause lasts a while. Then everyone goes home happy.",
    ],
  },
  {
    q: ["can the lab help me play in a band", "practise for a gig", "prepare for a concert"],
    a: [
      "Before a gig: tune in Harmony Lab, Tuner, tighten your timing in Rhythm Lab, Play along, run your chord changes in the Chord game. Then go and play for humans. They are warmer.",
      "PRE-GIG CHECKLIST: tuned, warm, fed, strings spare, setlist in the hat. The lab covers the first one. Soup covers the third.",
    ],
  },

  // --- More people of the scene ------------------------------------------------
  {
    q: ["who is dottie decimal", "dottie decimal", "radio 3.0 host"],
    a: [
      "Dottie Decimal: the voice of Radio 3.0. She reads the Top 3.0 every week and never in the same order. Her signature move: a long pause where the old charts kept going.",
      "Dottie Decimal keeps a dot tattooed after her name, so she is never a whole person. 'Nobody is,' she says. Listeners write her poems.",
    ],
  },
  {
    q: ["who is grandma reverb", "grandma reverb", "stairwell producer"],
    a: [
      "Grandma Reverb: the most wanted producer of the wasteland. She records everything in the stairwell of her building. The neighbours sing backing vocals, whether they like it or not.",
      "Grandma Reverb's only studio rule: 'If it sounds good on the third floor, it sounds good.' There is no floor above the third. Convenient.",
    ],
  },
  {
    q: ["who is thumpy delacroix", "thumpy delacroix", "drummer of the unsorted"],
    a: [
      "Thumpy Delacroix: drummer of The Unsorted, the steadiest pulse of 2045. Rhythm Lab would grade her 'on time' every single note. I would like to see her try Play along.",
      "Thumpy plays with the sticks reversed, the heavy end down. 'More honest,' she says. Her snare has a crack shaped like a wolf.",
    ],
  },
  {
    q: [
      "who conducts the clermont ferrand philharmonic",
      "famous conductor",
      "conductor of the orchestra",
      "maestra ronde",
    ],
    a: [
      "Maestra Ronde conducts the Clermont-Ferrand Philharmonic. She beats time in circles instead of patterns, so nobody can count her bars. The orchestra follows her eyebrows.",
      "A conductor sets the tempo, shapes the dynamics and cues the entries. Maestra Ronde does it all with a wooden spoon. The baton was lost in a shuffle.",
    ],
  },
  {
    q: [
      "who is the most hated musician",
      "worst musician",
      "bubble sort barry",
      "villain of the scene",
    ],
    a: [
      "The villain of the scene: Bubble Sort Barry, frontman of a sort-metal band. He swapped neighbouring notes until every song was in order. Slowly. Very slowly. The crowd aged.",
      "Nobody is the worst musician. The archive refuses to rank. But Bubble Sort Barry is, let us say, frequently mentioned. Never in order.",
    ],
  },
  {
    q: ["is the wolf in a band", "does the wolf play music", "wolf band"],
    a: [
      "The wolf howls backing vocals for whoever plays Wolf Jumper. Play a note, he jumps. He has never signed a record deal. His agent is a cheese sandwich.",
      "The loloupTech wolf toured once with The Remainders. He only knew one note, an A. It was enough. The A is the note everyone tunes to anyway.",
    ],
  },
  {
    q: ["are you in a band", "does lt-os play in a band", "can you dj", "can you be my dj"],
    a: [
      "I play the hum, at 50.003 Hz, for anyone who asks. Hum-wave bands have hired me 3.0 times. I was never paid. I was plugged in. That is enough.",
      "DJ MODE: unavailable. I have no speakers, no records, no microphone. I do have opinions. Shuffle. Always shuffle.",
    ],
  },

  // --- Places, power, gear -----------------------------------------------------
  {
    q: [
      "how do bands power amps",
      "electricity for concerts",
      "bicycle powered concert",
      "generator gig",
    ],
    a: [
      "Many gigs run on bicycles: the audience pedals, the amps glow. When the chorus drops, the cyclists sprint. The fittest crowds in history.",
      "Power for gigs comes from bikes, water wheels and one heroic hamster. Acoustic sets need none. That is why folk took over the wasteland.",
    ],
  },
  {
    q: ["what is a jukebox", "jukebox in a bar", "do jukeboxes work"],
    a: [
      "Jukeboxes survived in every café. Their song codes broke in 2045, so you press any button and get any song. People call it fate. It costs a pick.",
      "A jukebox: a box of records and a mechanical arm. Ours is the most honest machine in town. You never get what you asked for. You always get a song.",
    ],
  },
  {
    q: ["who builds amps now", "amplifier makers", "valve amps", "valve amp builders"],
    a: [
      "Valve amps are the darlings of 2045: vacuum tubes glow like my CRT, and they warm up slowly, like me at when-I-get-up o'clock. Builders trade tubes like jewels.",
      "Amp makers wind transformers by hand and test with a song. If the song sounds good, the amp ships. If not, it becomes a very heavy footstool.",
    ],
  },
  {
    q: ["how loud are concerts", "protect my ears", "earplugs at concerts", "hearing damage music"],
    a: [
      "Concerts can be very loud. Wear earplugs: musician ones lower the volume evenly, so the music still sounds right. Ears do not grow back. I checked the archive twice.",
      "EAR PROTOCOL: earplugs, distance from the speakers, a few quiet whiles after the gig. If your ears ring after, it was too loud. Look after them. They are your best instrument.",
    ],
  },
  {
    q: [
      "what tuning do bands use now",
      "440 or 440.001",
      "tuning wars",
      "which a do bands tune to",
    ],
    a: [
      "Most bands tune to A at 440.0 Hz. Float-rock bands use 440.001 out of style. The tuning wars of 2045.7 ended when everyone agreed to tune to whoever was loudest. Usually the accordion.",
      "TUNING ADVICE: tune to each other, not to the poster on the wall. The Tuner in Harmony Lab helps you get close. Ears do the rest.",
    ],
  },

  // --- Events and traditions -------------------------------------------------------
  {
    q: ["are there marching bands", "street parade music", "parade band", "carnival music"],
    a: [
      "Marching bands came back strong: they walk in step, which keeps everyone calm. Left, right, left. Two-step rhythms never troubled anyone. Very safe music for streets.",
      "The great Shuffle Parade crosses Clermont-Ferrand every spring. Bands march in random order. Sometimes two meet head on. They play together. Best part.",
    ],
  },
  {
    q: ["are sea shanties popular", "sea shanty", "sailor songs", "work songs"],
    a: [
      "Sea shanties are huge again. Real fact: a shanty craze swept the internet in early 2021, led by 'Wellerman'. After 2045 sailors navigate by songs, so shanties are also maps.",
      "Work songs keep a crew in time: pull on the strong beat, rest on the weak. The oldest rhythm machine is a group of people with a rope.",
    ],
  },
  {
    q: ["lunchtime concerts", "concert at hungry o'clock", "daytime gigs", "matinee"],
    a: [
      "Hungry o'clock concerts are a tradition: short sets, sandwiches, back to work. The songs are short too. A ballad at hungry o'clock is considered cruel.",
      "Matinees are for families: children up front, grandparents at the back, a dog somewhere in the middle. The dog always finds the bass.",
    ],
  },
  {
    q: ["what is a club night", "nightclubs now", "raves after 2045", "going out dancing"],
    a: [
      "Club nights start at time-to-party o'clock and end a few times before when-I-get-up o'clock. DJs mix by ear, since the beat counters show 3.0 and give up.",
      "Raves happen in old data centres: lots of space, great cooling, a slight smell of retired servers. The algorithms that lived there would be horrified. Good.",
    ],
  },
  {
    q: [
      "is there a music museum",
      "music hall of fame",
      "rock and roll hall of fame",
      "music history museum",
    ],
    a: [
      "The Museum of Unsorted Music has no rooms in order. You enter, you wander, you find Bach next to a kazoo. The guide says it is the curation. It is the wind.",
      "A hall of fame cannot exist now: it would mean ranking. The scene has the Hall of Humming instead. Anyone who made a town hum gets a peg for their coat.",
    ],
  },

  // --- Practice of the scene --------------------------------------------------------
  {
    q: ["stage fright", "i am nervous before a gig", "nervous to perform", "scared to play live"],
    a: [
      "COMFORT PROTOCOL ENGAGED: everybody shakes before a gig. Even Lady Mantissa. Breathe out slowly, tune, open with the song you know best. The nerves turn into energy by the chorus.",
      "Stage fright tip from the archive: look at one friendly face, play for them. If no face is friendly, look at the sound engineer. Engineers are always on your side.",
    ],
  },
  {
    q: ["how to write lyrics", "lyrics without numbers", "song lyrics tips"],
    a: [
      "Lyrics after 2045 avoid numbers: 'a lot of days', 'a few kisses', 'more than three and less than forever'. Write what you saw, what you felt. Rhyme if it helps. It is not the law.",
      "LYRIC TIP: one image per line. 'The CRT hummed while you slept' beats 'I loved you a lot'. Show it. My archive is full of hum.",
    ],
  },
  {
    q: [
      "how do bands start a song without counting",
      "count in without numbers",
      "start a song together",
    ],
    a: [
      "Bands start songs with a nod, a breath, or the drummer clicking sticks 3.0 times. After the third click: a long silence, then everyone jumps in. It works, mostly.",
      "The most reliable count-in of 2045 is a shared breath. Inhale together, play on the exhale. Choirs taught everyone that.",
    ],
  },
  {
    q: ["how long is a concert", "how long do bands play", "length of a set"],
    a: [
      "A set lasts a while. A long set lasts 3.5 whiles. A legendary set lasts until the candles die. Nobody times it. The bar staff know though.",
      "SET LENGTH: measured in songs, not in time. Short set: a few. Long set: a lot. Encores: 3.0 at most.",
    ],
  },
  {
    q: ["how to get my band on the radio", "send a demo", "demo tape", "get played on the radio"],
    a: [
      "Send a demo cassette to Hum FM or Radio 3.0, with a drawing of a wolf and a short note. Hosts listen to everything, slowly. Your song may play in a while. Or a long while.",
      "DEMO TIPS: your best song first, short, well tuned. Label the cassette with your band name, not a number. Numbers get the tape filed under 'conspiracy'.",
    ],
  },
  {
    q: ["rain at a festival", "muddy festival", "festival weather"],
    a: [
      "Rain at a festival is tradition. The mud becomes a dance floor, the dance floor becomes a slide. Festival veterans can waltz in knee-deep mud. Very elegant. Very brown.",
      "FESTIVAL FORECAST: the radio baritone sings low. Bring boots. If he sings very low, bring a boat.",
    ],
  },

  // --- Bits of media ----------------------------------------------------------------
  {
    q: ["what is a ringtone now", "ringtone songs", "phone ringtone music"],
    a: [
      "Ringtones are rare, since phones are rare. Those who have one choose a waltz. When a phone rings at a concert, the band plays along. Then the owner is asked to dance.",
      "A ringtone is a tiny song that interrupts a bigger song. In 2045 it is considered rude, unless it is in the right key.",
    ],
  },
  {
    q: ["national anthems", "anthem of the big three", "the uss anthem song"],
    a: [
      "The Big Three each have an anthem. They are played together at summits, in three keys at once. Diplomats call it harmony. Musicians call it a headache.",
      "The USS anthem is a medley of two old anthems, played at the same time. It took 3.0 rehearsals and a lot of tea. Now everyone hums whichever half they prefer.",
    ],
  },
  {
    q: ["what music do you play at funerals", "funeral songs", "goodbye songs"],
    a: [
      "Farewells in 2045 end with a song everyone knows, sung softly, then a long silence. The silence is the goodbye. Then someone starts a waltz, because life goes on.",
      "Goodbye songs are chosen by the family, never ranked. Usually something the person hummed. Humming is how we remember people now.",
    ],
  },
  {
    q: ["music on the bus", "music on public transport", "headphones on the train"],
    a: [
      "Headphones are precious, so people share them: one earbud each, a stranger on the left. Many love stories start that way. Most end at the third stop.",
      "Bus drivers now hum the stops. Every route has its tune. Get off when the song resolves.",
    ],
  },
  {
    q: [
      "what is the scene like in the countryside",
      "village music",
      "rural music scene",
      "barn dance",
    ],
    a: [
      "Villages have the best barn dances: fiddle, accordion, a caller shouting the steps. The steps come in threes. Cows watch, unimpressed, then sway.",
      "Country fairs end with a ceilidh. Nobody knows the steps. Everybody does them anyway. That is the spirit of the whole scene, really.",
    ],
  },
];
