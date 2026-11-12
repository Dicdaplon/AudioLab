/**
 * What the wolf says, grouped by the situation that makes it talk. One
 * constant so the list can be translated or replaced (`WolfBuddy`'s
 * `phrases` prop): short lines (22 characters at most, the bubble is small),
 * in the wolf's voice. `{key}` is replaced by the key's name ("A minor").
 */

/** The situations the wolf comments on. */
export type WolfPhraseKind =
  /** Very loud, or a huge attack (the wolf tumbles). */
  | "loud"
  /** Playing, but very softly for a while. */
  | "quiet"
  /** A silence of a few seconds. */
  | "silence"
  /** The long silence: the wolf falls asleep. */
  | "sleep"
  /** The music comes back after the wolf fell asleep. */
  | "wake"
  /** Several of the last notes are outside the key. */
  | "outOfKey"
  /** A long run of notes all in the key. */
  | "inKey"
  /** A note with vibrato. */
  | "vibrato"
  /** A bent note. */
  | "bend"
  /** The key just settled (`{key}`). */
  | "key"
  /** The song moved to another key (`{key}`). */
  | "modulation"
  /** Many attacks per second. */
  | "fast"
  /** A long note held in tune. */
  | "held"
  /** A steady beat for a while (the wolf dances). */
  | "groove";

export type WolfPhrases = Readonly<Record<WolfPhraseKind, readonly string[]>>;

export const WOLF_PHRASES: WolfPhrases = {
  loud: ["Too strong!", "My ears!", "Easy, rock star!"],
  quiet: ["Quiet…", "Psst… louder?", "Shy fingers?"],
  silence: ["Hello? Anyone?", "Still there?"],
  sleep: ["I'm going to sleep…", "Nap time… Zzz"],
  wake: ["Huh? I'm up!", "Who woke me?"],
  outOfKey: ["Mhhh, you sure?", "Spicy note!", "That's outside…"],
  inKey: ["Right in the key!", "Every note fits."],
  vibrato: ["Ooh, vibrato!", "Nice wobble!"],
  bend: ["Bend it! Yes!", "That bend, wow."],
  key: ["{key}, classy.", "Ah, {key}!"],
  modulation: ["New key: {key}!", "Ooh, a key change!"],
  fast: ["Fast paws!", "Whoa, slow down!"],
  held: ["Long and in tune.", "Hold it… nice!"],
  groove: ["I can dance to this.", "Nice groove!"],
};

/** Which kind wins when several could be said: higher first. */
export const WOLF_PHRASE_PRIORITY: Readonly<Record<WolfPhraseKind, number>> = {
  loud: 10,
  wake: 9,
  sleep: 9,
  key: 8,
  modulation: 8,
  outOfKey: 7,
  silence: 6,
  quiet: 6,
  fast: 5,
  bend: 4,
  vibrato: 4,
  held: 4,
  inKey: 3,
  groove: 3,
};
