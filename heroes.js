// Edit your heroes here. Used by both vote.js and admin.js.
// "image"       = the revamped hero   (portrait, about 600x800 px works best)
// "imageBefore" = the old look
// Put the files in the "images" folder next to vote.html and write the path below.
// You can also paste a direct link (https://...). If a file is missing, the first letter is shown instead.
export const HEROES = [
  { id: "hero1", name: "Aldric", role: "Fighter",
    image: "images/aldric.png", imageBefore: "images/aldric-before.png",
    summary: "Heavier combos and a rebuilt ultimate.",
    changes: [
      { part: "Skill 1",  before: "Single slash, 6 s cooldown",  revamp: "Triple slash combo, 5 s cooldown" },
      { part: "Ultimate", before: "Leap with a small impact",    revamp: "Leap that pulls nearby enemies in" },
      { part: "Look",     before: "Plain steel armor",           revamp: "Armor with glowing runes" }
    ] },
  { id: "hero2", name: "Seren", role: "Mage",
    image: "images/seren.png", imageBefore: "images/seren-before.png",
    summary: "Faster casting and a clearer skill kit.",
    changes: [
      { part: "Skill 1",  before: "Slow fireball",               revamp: "Quick fireball that splits in two" },
      { part: "Passive",  before: "Small mana regen",            revamp: "Mana returns after each kill" },
      { part: "Look",     before: "Dull gray robe",              revamp: "Flowing robe with ember effects" }
    ] },
  { id: "hero3", name: "Kaito", role: "Assassin",
    image: "images/kaito.png", imageBefore: "images/kaito-before.png",
    summary: "A new dash skill and updated visuals.",
    changes: [
      { part: "Skill 2",  before: "Short blink",                 revamp: "Dash that resets on a kill" },
      { part: "Ultimate", before: "Marks one enemy",             revamp: "Marks and strikes up to three enemies" },
      { part: "Look",     before: "Black cloth outfit",          revamp: "Light armor with a new mask" }
    ] },
  { id: "hero4", name: "Mira", role: "Support",
    image: "images/mira.png", imageBefore: "images/mira-before.png",
    summary: "Stronger shields and a new passive.",
    changes: [
      { part: "Skill 1",  before: "Shield on one ally",          revamp: "Shield that bounces to a second ally" },
      { part: "Passive",  before: "None",                        revamp: "Allies nearby heal slowly" },
      { part: "Look",     before: "Plain white dress",           revamp: "Gold trimmed dress with a staff" }
    ] }
];
