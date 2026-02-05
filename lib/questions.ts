// friendFrenzyQuestions.ts
// Centralized question bank for FriendFrenzy

export enum QuestionCategory {
  NAUGHTY_18_PLUS = "naughty_18_plus",
  PARTY_SOCIAL = "party_social",
  MIXED = "mixed",
  PAIR_FRENZY = "pair_frenzy",
}

/* ---------------------------------------------------
   😈 NAUGHTY 18+ (Flirty, Playful, Non-Explicit)
--------------------------------------------------- */
export const NAUGHTY_18_PLUS_QUESTIONS: string[] = [
  "Who has the most hidden rizz?",
  "Who would flirt even without realizing it?",
  "Who catches feelings the fastest?",
  "Who is lowkey the most attractive?",
  "Who gives strong situationship energy?",
  "Who would be hardest to ignore?",
  "Who enjoys attention a little too much?",
  "Who pretends to be innocent but isn’t?",
  "Who would make someone fall accidentally?",
  "Who would thrive on a dating app?",
  "Who is secretly very confident?",
  "Who would enjoy being chased?",
  "Who has the best eye contact game?",
  "Who would win at flirting without trying?",
  "Who gives main-character-in-romance vibes?",
];

/* ---------------------------------------------------
   🍻 PARTY & SOCIAL LIFE
--------------------------------------------------- */
export const PARTY_SOCIAL_QUESTIONS: string[] = [
  "Who turns ‘one drink’ into a whole night?",
  "Who always knows where the party is?",
  "Who disappears mid-party?",
  "Who would drunk-text someone?",
  "Who gets tipsy the fastest?",
  "Who wakes up with the worst hangover?",
  "Who is the life of the party?",
  "Who somehow ends up in drama?",
  "Who would dance like nobody’s watching?",
  "Who would lose their phone on a night out?",
  "Who would suggest after-party plans?",
  "Who would sneak out without telling anyone?",
  "Who parties hard but recovers fast?",
  "Who is surprisingly responsible when drunk?",
  "Who would say ‘last drink’ and mean none of it?",
];

/* ---------------------------------------------------
   🌀 MIXED BAG (Safe + Fun)
--------------------------------------------------- */
export const MIXED_QUESTIONS: string[] = [
  "Who gives main character energy?",
  "Who would survive a zombie apocalypse?",
  "Who is secretly very smart?",
  "Who is emotionally the strongest?",
  "Who would move abroad someday?",
  "Who has the best overall vibes?",
  "Who is the most dependable?",
  "Who would handle fame the best?",
  "Who is surprisingly mature?",
  "Who would thrive in chaos?",
  "Who would be successful in anything?",
  "Who stays calm under pressure?",
  "Who is lowkey very ambitious?",
  "Who would make a great leader?",
  "Who has the most balanced life?",
];

/* ---------------------------------------------------
   🔗 PAIR FRENZY (%-Based, Two-Name Questions)
--------------------------------------------------- */

export interface PairFrenzyQuestion {
  template: string;
  options: number[];
}

export const PAIR_FRENZY_QUESTIONS: PairFrenzyQuestion[] = [
  {
    template: "What are the chances that {A} has a crush on {B}?",
    options: [10, 25, 50, 75, 90],
  },
  {
    template: "How likely is it that {A} secretly stalks {B}?",
    options: [0, 20, 40, 60, 80],
  },
  {
    template: "What are the odds that {A} would flirt with {B}?",
    options: [10, 30, 50, 70, 90],
  },
  {
    template: "How likely is it that {A} gets jealous if {B} dates someone?",
    options: [5, 25, 50, 75, 95],
  },
  {
    template: "What are the chances that {A} and {B} would actually vibe?",
    options: [20, 40, 60, 80, 100],
  },
  {
    template: "How likely is it that {A} talks about {B} to others?",
    options: [10, 30, 50, 70, 90],
  },
  {
    template: "What are the odds that {A} would defend {B} in a fight?",
    options: [20, 40, 60, 80, 100],
  },
  {
    template: "How likely is it that {A} finds {B} annoying but won’t admit it?",
    options: [10, 30, 50, 70, 90],
  },
  {
    template: "What are the chances that {A} trusts {B} the most?",
    options: [15, 35, 55, 75, 95],
  },
  {
    template: "How likely is it that {A} would choose {B} over others?",
    options: [10, 25, 50, 75, 100],
  },
];

/* ---------------------------------------------------
   📦 EXPORT ALL QUESTIONS BY CATEGORY
--------------------------------------------------- */
export const QUESTION_BANK = {
  [QuestionCategory.NAUGHTY_18_PLUS]: NAUGHTY_18_PLUS_QUESTIONS,
  [QuestionCategory.PARTY_SOCIAL]: PARTY_SOCIAL_QUESTIONS,
  [QuestionCategory.MIXED]: MIXED_QUESTIONS,
  [QuestionCategory.PAIR_FRENZY]: PAIR_FRENZY_QUESTIONS,
};
