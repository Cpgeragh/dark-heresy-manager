// src/data/skillDescriptions.ts

export const SKILL_DESCRIPTIONS: Record<string, string> = {
  // ===== GENERAL SKILLS =====
  Acrobatics:
    "Perform athletic feats unavailable to less flexible characters. Disengage: make an Acrobatics Test to reduce it to a Half Action. Jumping & Leaping: substitute Acrobatics for Agility Tests when Jumping or Strength Tests when Leaping. Full Action.",
  Awareness:
    "Perceive hidden dangers and notice details in your surroundings, covering all senses. Detecting a hidden enemy is always an Opposed Test against their Concealment. Usually a Free Action, made in reaction to something.",
  Barter:
    "Negotiate deals and get better prices. Success reduces price by 10%; each additional degree reduces by a further 5%. Important deals may be Opposed Tests. Typically takes about five minutes.",
  Blather:
    "Stall for time by running off at the mouth to confuse and distract. Opposed by target's Willpower or Scrutiny; success dumbfounds the target for one Round per degree of success. Can affect targets equal to Fellowship Bonus who must understand the language. Full Action.",
  Carouse:
    "Resist the effects of alcohol and intoxicants. Test whenever you imbibe — failure gives 1 level of Fatigue. Passing out renders you unconscious for 1d10 minus Toughness Bonus hours (minimum 1). Free Action whenever you imbibe.",
  Charm:
    "Befriend others and convince people to do things for you. Can affect targets equal to Fellowship Bonus who must see, hear, and understand you. Typically takes one minute.",
  "Chem-Use":
    "Handle, prepare and apply chemicals, toxins and drugs. Failed Test wastes the chemical; failing by 5+ degrees poisons yourself. Halves the time to use a toxin wand or administer an antidote on a successful Test. Full Action to administer.",
  Climb:
    "Ascend or descend sheer surfaces — walls without handholds, overhangs and poor climbing conditions. Success allows movement at half your Half Move rate. Half Action.",
  Command:
    "Direct subordinates to follow your orders. Can affect targets equal to Fellowship Bonus who must see, hear, and understand you. Failing by 5+ degrees causes them to contradict your orders. Half Action for simple commands, Full Action for involved instructions.",
  Concealment:
    "Hide from sight using terrain, obstacles, fog or darkness. Always Opposed against the observer's Awareness or half Perception. Remaining perfectly still grants +10. Only test when someone actively searches. Half Action.",
  Contortionist:
    "Escape bonds, slip free from grapples or squeeze through tight spaces. Escaping bonds is Difficulty based on captor's Intelligence vs your Agility; escaping a grapple is Opposed by the grappler's Strength. Failing by 5+ degrees when squeezing means you get stuck. Most Tests take one minute; escaping a grapple is a Full Action.",
  Deceive:
    "Lie convincingly and swindle others. Typically Opposed by the target's Scrutiny. Can affect targets equal to Fellowship Bonus who must see, hear, and understand you. Typically takes one minute.",
  Demolition:
    "Plant explosive devices, defuse bombs and manufacture explosives. Planting: failing by 5+ degrees sets it off immediately; each degree of success makes it harder to detect and defuse. Defusing: Opposed by the planter's original roll — failing by 5+ degrees triggers it. Planting or defusing is usually a Full Action.",
  Diplomacy: "Conduct formal negotiations and diplomatic discussions.",
  Disguise:
    "Mask your true appearance with clothing, props and make-up. Often Opposed by targets' Scrutiny. Disguising as the opposite sex, a different race or a specific person imposes greater difficulty. Minimum one minute for a simple disguise.",
  Dodge:
    "Negate one successful melee or ranged attack per Round — on a successful Test, the attack deals no Damage. Reaction.",
  Evaluate:
    "Determine the approximate market value of objects and valuables. GMs typically roll this in secret and tell the player what their character believes. Taking more time grants bonuses; a quick glance may impose penalties. Usually takes at least one minute.",
  Gamble:
    "Participate in games of chance — all participants make Opposed Tests and the most degrees of success wins. You can substitute Sleight of Hand to cheat (granting +20 to Gamble, but failing by 5+ degrees means you're caught). Can represent a single hand or an entire day of gaming.",
  Inquiry:
    "Pick up rumours, secrets and guarded information through questions and observation. Success reveals basic information; additional degrees of success reveal more. Can also chase a specific fact or secret. Usually represents about an hour of activity.",
  Interrogation:
    "Extract information from unwilling subjects — Opposed by target's Willpower. Success gives one answer plus one per degree. Failing by 5+ degrees deals 1d10+Willpower Bonus Damage and gives the target +30 to resist further interrogation. Inflicts 1 Fatigue on the target per Test. Takes 1d5 hours.",
  Intimidate:
    "Coerce or frighten individuals or small groups. Can use Strength (physical threats), Intelligence or Fellowship (subtle threats) at the GM's option. Can affect targets equal to the relevant Bonus who must see, hear, and understand you. Full Action.",
  Invocation:
    "Prepare your mind to touch the Warp, adding your Willpower Bonus to your next Power Roll. Full Action; on success, add the bonus on the following Round when you take the Focus Power Action. Failure grants no benefit, and not using Focus Power the next Turn has no side effects.",
  "Lip Reading":
    "Read the lips of speakers out of earshot — requires unobstructed view of the mouth and knowledge of the language. Base Challenging (+0), worsening one step per 10 metres; magnifying equipment can offset the penalty. Success reveals the gist; each degree reveals more. Full Action, lasting as long as the target speaks.",
  Literacy:
    "Read and write any language you can speak. Tests are only needed for challenging dialects, archaic usage, poor penmanship or obscure phraseology. Reading one page (approximately 750 words) takes about one minute.",
  Logic:
    "Solve mathematical problems, decipher codes and address complex theoretical problems. Purely theoretical — Tech-Use is its practical counterpart. Tech-Priests may use it to incant mathematical rituals on machinery. Usually takes one minute.",
  "Logis Prophesying": "Practice techno-divination and make predictions through data analysis.",
  Medicae:
    "First Aid (Full Action): removes Damage equal to Intelligence Bonus from Lightly Wounded, 1 Damage from Heavily Wounded, or 1 Critical Damage. Failure by 3+ degrees deals 1 Damage; patients at 0 Wounds must pass Toughness or die. Extended Care (daily Tests for Lightly Wounded, weekly for others): success removes double normal Damage plus 1 per degree. Tend patients equal to Intelligence Bonus simultaneously.",
  Psyniscience:
    "Detect Daemons, psykers and Warp disturbances. Success extends your senses Perception Bonus + 1d10 metres; each degree adds 1d10+PB metres. Standard success: awareness of disruption. One degree: general location. Two or more degrees: exact location of the source. Full Action.",
  Scrutiny:
    "Assess others, detect lies and sense ulterior motives. When perceiving deception, Opposed by the target's Deceive. Counteracts Interaction skills such as Charm, Deceive and Intimidate. Does not grant telepathy — only senses that something is off.",
  Search:
    "Actively examine an area for concealed objects and clues (unlike Awareness, which is passive). One Test covers a small room; deliberately hidden items are Opposed by the hider's Concealment. Takes a minimum of five minutes.",
  Security:
    "Bypass locks and security systems. Difficulty depends on the quality of the defence; complex systems may require additional Tests or degrees of success. Takes one minute, reduced by ten seconds per degree of success.",
  Shadowing:
    "Follow a creature or vehicle without being seen, moving between cover or blending into surroundings. Always Opposed against the target's Awareness or half Perception. One Test keeps you unseen for one minute.",
  "Silent Move":
    "Move without making noise. Difficulty depends on the surface — broken glass, gravel and twigs all add noise. Always Opposed against the observer's Awareness or half Perception. Free Action made as part of a Move Action.",
  "Sleight of Hand":
    "Palm objects, pick pockets or perform tricks with small items. Usually Opposed against the target's Awareness or half Perception; smaller objects are easier. Can substitute for Gamble to cheat. Half Action; can be attempted as a Free Action at −10 Difficulty.",
  Survival:
    "Subsist in the wild through hunting, fishing, fire-making and shelter construction. Difficulty depends on the environment. Failing by 5+ degrees causes spectacular failure — rockslides, stirring hostile wildlife, consuming poison. Takes one hour, reduced by ten minutes per degree of success.",
  Swim: "Swim and dive. Normal conditions need no Test; Tests required in rough water or for extended periods. Does not protect against harm from toxic or dangerous liquids. Free Action made as part of a Move Action.",
  "Tech-Use":
    "Operate unusual or malfunctioning technology and repair damaged equipment. No Test for basic equipment under normal conditions. Understanding an unfamiliar item: typically one minute. Repairing an item: typically one hour, reduced by ten minutes per degree of success.",
  Tracking:
    "Follow prey by reading tracks and environmental signs. Obvious tracks need no Test and don't slow movement; following obscure tracks halves movement speed. When quarry has covered tracks, Opposed by their Concealment. Can deduce distance, numbers and racial type of quarry. Free Action made as part of a Move Action.",
  Wrangling:
    "Ride, care for, train and control domesticated animals. Routine care needs no Test. Training a trick requires weekly Tests (1 success for simple, 3 for moderate, 10 for difficult). Domestic animals are always friendly; wild or hostile animals require a successful Test to calm. Of no use against cyber-animals. Befriending is a Full Action; training takes at least a week.",

  // ===== CIPHERS =====
  "Ciphers (Acolyte)":
    "Understand shorthand codes used by specific groups — hand signals or inscribed symbols conveying warnings, targets and protection. No Test for basic messages; Tests may be needed for complicated or damaged signs. Full Action to give or inscribe; Free Action to read. | Acolyte: private code unique to a given cell — pre-arranged signals intelligible only to fellow members.",
  "Ciphers (War Cant)":
    "Understand shorthand codes used by specific groups — hand signals or inscribed symbols conveying warnings, targets and protection. No Test for basic messages; Tests may be needed for complicated or damaged signs. Full Action to give or inscribe; Free Action to read. | War Cant: instructions to troops conveyed through hand signals, body language or musical code.",
  "Ciphers (Secret Society)":
    "Understand shorthand codes used by specific groups — hand signals or inscribed symbols conveying warnings, targets and protection. No Test for basic messages; Tests may be needed for complicated or damaged signs. Full Action to give or inscribe; Free Action to read. | Secret Society: used by members of a given secret society or cult to identify one another and convey simple messages — unique to each society.",
  "Ciphers (Occult)":
    "Understand shorthand codes used by specific groups — hand signals or inscribed symbols conveying warnings, targets and protection. No Test for basic messages; Tests may be needed for complicated or damaged signs. Full Action to give or inscribe; Free Action to read. | Occult: mystical gestures to focus the mind during incantation, identify fellow sorcerers and supplicate or castigate Daemons.",
  "Ciphers (Underworld)":
    "Understand shorthand codes used by specific groups — hand signals or inscribed symbols conveying warnings, targets and protection. No Test for basic messages; Tests may be needed for complicated or damaged signs. Full Action to give or inscribe; Free Action to read. | Underworld: convoluted systems of hand gestures, clothing styles, signs and chicanery used by criminal fraternities.",

  // ===== DRIVE =====
  "Drive (Ground Vehicle)":
    "Control land-based or hover vehicles; normal conditions need no Test. Tests called for in treacherous terrain, excessive speed or dangerous manoeuvres. Typically a Half Action. | Ground Vehicle: autos, trucks and other land-based vehicles.",
  "Drive (Hover Vehicle)":
    "Control land-based or hover vehicles; normal conditions need no Test. Tests called for in treacherous terrain, excessive speed or dangerous manoeuvres. Typically a Half Action. | Hover Vehicle: hover-capable vehicles and landspeeders.",
  "Drive (Walker)":
    "Control land-based or hover vehicles; normal conditions need no Test. Tests called for in treacherous terrain, excessive speed or dangerous manoeuvres. Typically a Half Action. | Walker: bipedal or multi-legged walker vehicles.",

  // ===== PILOT =====
  "Pilot (Civilian Craft)":
    "Fly atmospheric craft to full spacecraft; normal conditions need no Test. Tests called for in storms, excessive speed or dangerous manoeuvres; Opposed Tests during chases. Typically a Half Action. | Civilian Craft: civilian atmospheric aircraft and light shuttles.",
  "Pilot (Military Craft)":
    "Fly atmospheric craft to full spacecraft; normal conditions need no Test. Tests called for in storms, excessive speed or dangerous manoeuvres; Opposed Tests during chases. Typically a Half Action. | Military Craft: military aircraft and combat flyers.",
  "Pilot (Spacecraft)":
    "Fly atmospheric craft to full spacecraft; normal conditions need no Test. Tests called for in storms, excessive speed or dangerous manoeuvres; Opposed Tests during chases. Typically a Half Action. | Spacecraft: spacecraft and void-capable vessels.",

  // ===== NAVIGATION =====
  "Navigation (Surface)":
    "Chart courses and avoid getting lost using maps, technical readouts and landmarks. One successful Test per day typically keeps you on track; finding your position takes one minute or less. | Surface: navigate across a planet's surface using logi-compasses, map readouts and geographical knowledge.",
  "Navigation (Stellar)":
    "Chart courses and avoid getting lost using maps, technical readouts and landmarks. One successful Test per day typically keeps you on track; finding your position takes one minute or less. | Stellar: navigate in space between planets using star charts and cartomantic rituals.",

  // ===== SPEAK LANGUAGE =====
  "Speak Language (High Gothic)":
    "Communicate using a common tongue; no Test needed under normal circumstances if all speakers know the language. Free Action. | High Gothic: the language of nobility, law and Ecclesiarchy liturgy.",
  "Speak Language (Hive Dialect)":
    "Communicate using a common tongue; no Test needed under normal circumstances if all speakers know the language. Free Action. | Hive Dialect: a debased form of Low Gothic unique to a given hive.",
  "Speak Language (Low Gothic)":
    "Communicate using a common tongue; no Test needed under normal circumstances if all speakers know the language. Free Action. | Low Gothic: the common tongue of the Imperium.",
  "Speak Language (Ship Dialect)":
    "Communicate using a common tongue; no Test needed under normal circumstances if all speakers know the language. Free Action. | Ship Dialect: code, slang and idiom unique to a given vessel.",
  "Speak Language (Tribal Dialect)":
    "Communicate using a common tongue; no Test needed under normal circumstances if all speakers know the language. Free Action. | Tribal Dialect: the rough and primitive tongue spoken by the natives of a particular planet.",

  // ===== SECRET TONGUE =====
  "Secret Tongue (Acolyte)":
    "Speak an obscure language known only to a specific profession or organisation — codes and signifiers imparting deeper meaning within another tongue. No Test if all speakers know it; Tests may be needed in noisy or chaotic conditions. Free Action. | Acolyte: pre-arranged code phrases intelligible only to fellow cell members — unique to each cell.",
  "Secret Tongue (Administratum)":
    "Speak an obscure language known only to a specific profession or organisation — codes and signifiers imparting deeper meaning within another tongue. No Test if all speakers know it; Tests may be needed in noisy or chaotic conditions. Free Action. | Administratum: an exceedingly long-winded collection of acronyms, jargon and procedural formalities.",
  "Secret Tongue (Ecclesiarchy)":
    "Speak an obscure language known only to a specific profession or organisation — codes and signifiers imparting deeper meaning within another tongue. No Test if all speakers know it; Tests may be needed in noisy or chaotic conditions. Free Action. | Ecclesiarchy: allegorical language of devotion and politics, full of strange metaphors and specialised High Gothic.",
  "Secret Tongue (Gutter)":
    "Speak an obscure language known only to a specific profession or organisation — codes and signifiers imparting deeper meaning within another tongue. No Test if all speakers know it; Tests may be needed in noisy or chaotic conditions. Free Action. | Gutter: a pidgin version of Low Gothic spoken by the lowest levels of Imperial society.",
  "Secret Tongue (Military)":
    "Speak an obscure language known only to a specific profession or organisation — codes and signifiers imparting deeper meaning within another tongue. No Test if all speakers know it; Tests may be needed in noisy or chaotic conditions. Free Action. | Military: coded phrases, jargon, references to ancient battles and a surprising number of terms for death.",
  "Secret Tongue (Tech)":
    "Speak an obscure language known only to a specific profession or organisation — codes and signifiers imparting deeper meaning within another tongue. No Test if all speakers know it; Tests may be needed in noisy or chaotic conditions. Free Action. | Tech: the Lingua Technis of the Adeptus Mechanicus, comprising jargon, binary and in some cases sub/ultrasonic sound waves.",

  // ===== COMMON LORE =====
  "Common Lore (Adeptus Arbites)":
    "Recall the habits, institutions, traditions and superstitions of a particular world, organisation or race — basics learned by living or travelling, not scholarly study. Success reveals basic information; each degree reveals more. No time at all. | Adeptus Arbites: knowledge of the various arms and sub-sects of the Arbites, including ranking structure and common procedures.",
  "Common Lore (Machine Cult)":
    "Recall the habits, institutions, traditions and superstitions of a particular world, organisation or race — basics learned by living or travelling, not scholarly study. Success reveals basic information; each degree reveals more. No time at all. | Machine Cult: a general understanding of Mechanicus symbols and practices, as well as formal greetings and identifying rankings.",
  "Common Lore (Administratum)":
    "Recall the habits, institutions, traditions and superstitions of a particular world, organisation or race — basics learned by living or travelling, not scholarly study. Success reveals basic information; each degree reveals more. No time at all. | Administratum: broad knowledge of the inner workings, rules and regulations of the Administratum.",
  "Common Lore (Ecclesiarchy)":
    "Recall the habits, institutions, traditions and superstitions of a particular world, organisation or race — basics learned by living or travelling, not scholarly study. Success reveals basic information; each degree reveals more. No time at all. | Ecclesiarchy: understanding of the hierarchy of the Cult of the Emperor, its rankings, greetings and general practices.",
  "Common Lore (Imperial Creed)":
    "Recall the habits, institutions, traditions and superstitions of a particular world, organisation or race — basics learned by living or travelling, not scholarly study. Success reveals basic information; each degree reveals more. No time at all. | Imperial Creed: knowledge of the rites and practices of the Imperial Cult, the most common observances to the Emperor and the most well-known saints.",
  "Common Lore (Imperial Guard)":
    "Recall the habits, institutions, traditions and superstitions of a particular world, organisation or race — basics learned by living or travelling, not scholarly study. Success reveals basic information; each degree reveals more. No time at all. | Imperial Guard: basic information about ranking systems, logistics and structure of the Imperial Guard, as well as common tactical and strategic practices.",
  "Common Lore (Imperium)":
    "Recall the habits, institutions, traditions and superstitions of a particular world, organisation or race — basics learned by living or travelling, not scholarly study. Success reveals basic information; each degree reveals more. No time at all. | Imperium: knowledge of the sectors, segmentums and most well-known worlds of the Imperium.",
  "Common Lore (Tech)":
    "Recall the habits, institutions, traditions and superstitions of a particular world, organisation or race — basics learned by living or travelling, not scholarly study. Success reveals basic information; each degree reveals more. No time at all. | Tech: an understanding of simple litanies and rituals to soothe and appease machine spirits.",
  "Common Lore (Underworld)":
    "Recall the habits, institutions, traditions and superstitions of a particular world, organisation or race — basics learned by living or travelling, not scholarly study. Success reveals basic information; each degree reveals more. No time at all. | Underworld: understanding of organised crime and sedition within the Imperium.",
  "Common Lore (War)":
    "Recall the habits, institutions, traditions and superstitions of a particular world, organisation or race — basics learned by living or travelling, not scholarly study. Success reveals basic information; each degree reveals more. No time at all. | War: knowledge of great battles, notable commanders and heroes, and famous stratagems.",

  // ===== SCHOLASTIC LORE =====
  "Scholastic Lore (Archaic)":
    "Recall facts from a particular scholarly subject requiring extensive academic study. Standard: basic information; 1 degree: uncommonly known; 2 degrees: obscure; 3+ degrees: extremely obscure. No time to recall a fact; researching takes 1d10 hours per Test. | Archaic: an understanding of the murky past of the Imperium and how the long millennia have changed the face of mankind.",
  "Scholastic Lore (Astromancy)":
    "Recall facts from a particular scholarly subject requiring extensive academic study. Standard: basic information; 1 degree: uncommonly known; 2 degrees: obscure; 3+ degrees: extremely obscure. No time to recall a fact; researching takes 1d10 hours per Test. | Astromancy: knowledge of stars, heavenly bodies and the nature of worlds, as well as theoretical understanding of telescopes, astrolabes and so on.",
  "Scholastic Lore (Beasts)":
    "Recall facts from a particular scholarly subject requiring extensive academic study. Standard: basic information; 1 degree: uncommonly known; 2 degrees: obscure; 3+ degrees: extremely obscure. No time to recall a fact; researching takes 1d10 hours per Test. | Beasts: an understanding of the classification of animals and familiarity with the properties of many types of semi-sentient creatures.",
  "Scholastic Lore (Bureaucracy)":
    "Recall facts from a particular scholarly subject requiring extensive academic study. Standard: basic information; 1 degree: uncommonly known; 2 degrees: obscure; 3+ degrees: extremely obscure. No time to recall a fact; researching takes 1d10 hours per Test. | Bureaucracy: an understanding of how to deal with governments, particularly the Administratum, and their many varied departments, forms and policies.",
  "Scholastic Lore (Chymistry)":
    "Recall facts from a particular scholarly subject requiring extensive academic study. Standard: basic information; 1 degree: uncommonly known; 2 degrees: obscure; 3+ degrees: extremely obscure. No time to recall a fact; researching takes 1d10 hours per Test. | Chymistry: a knowledge of chemicals, their alchemical applications and their use throughout the Imperium.",
  "Scholastic Lore (Cryptology)":
    "Recall facts from a particular scholarly subject requiring extensive academic study. Standard: basic information; 1 degree: uncommonly known; 2 degrees: obscure; 3+ degrees: extremely obscure. No time to recall a fact; researching takes 1d10 hours per Test. | Cryptology: an understanding of codes, ciphers, secret languages and numerical keys — used to crack or create codes.",
  "Scholastic Lore (Heraldry)":
    "Recall facts from a particular scholarly subject requiring extensive academic study. Standard: basic information; 1 degree: uncommonly known; 2 degrees: obscure; 3+ degrees: extremely obscure. No time to recall a fact; researching takes 1d10 hours per Test. | Heraldry: a grasp of the principles of heraldry, as well as a knowledge of the most common liveries, seals and heraldic devices used in the Imperium.",
  "Scholastic Lore (Imperial Creed)":
    "Recall facts from a particular scholarly subject requiring extensive academic study. Standard: basic information; 1 degree: uncommonly known; 2 degrees: obscure; 3+ degrees: extremely obscure. No time to recall a fact; researching takes 1d10 hours per Test. | Imperial Creed: understanding of the rituals of the Ecclesiarchy, the construction of their temples and the finer points of liturgy — may be used to conduct rituals.",
  "Scholastic Lore (Judgement)":
    "Recall facts from a particular scholarly subject requiring extensive academic study. Standard: basic information; 1 degree: uncommonly known; 2 degrees: obscure; 3+ degrees: extremely obscure. No time to recall a fact; researching takes 1d10 hours per Test. | Judgement: knowledge of the proper punishments for the myriad crimes and heresies punishable by Imperial law.",
  "Scholastic Lore (Legend)":
    "Recall facts from a particular scholarly subject requiring extensive academic study. Standard: basic information; 1 degree: uncommonly known; 2 degrees: obscure; 3+ degrees: extremely obscure. No time to recall a fact; researching takes 1d10 hours per Test. | Legend: knowledge of the great histories of old, such as the terrible Horus Heresy and the Dark Age of Technology.",
  "Scholastic Lore (Numerology)":
    "Recall facts from a particular scholarly subject requiring extensive academic study. Standard: basic information; 1 degree: uncommonly known; 2 degrees: obscure; 3+ degrees: extremely obscure. No time to recall a fact; researching takes 1d10 hours per Test. | Numerology: an understanding of the mysterious properties of numbers, from Catastrophe theory to the Sadleirian litany.",
  "Scholastic Lore (Occult)":
    "Recall facts from a particular scholarly subject requiring extensive academic study. Standard: basic information; 1 degree: uncommonly known; 2 degrees: obscure; 3+ degrees: extremely obscure. No time to recall a fact; researching takes 1d10 hours per Test. | Occult: an understanding of occult ritual, theories and superstitions, as well as the better-known mystical uses of occult items.",
  "Scholastic Lore (Philosophy)":
    "Recall facts from a particular scholarly subject requiring extensive academic study. Standard: basic information; 1 degree: uncommonly known; 2 degrees: obscure; 3+ degrees: extremely obscure. No time to recall a fact; researching takes 1d10 hours per Test. | Philosophy: a knowledge of the theories of thought, belief and criticism — may be used for debate and for creating philosophical works.",
  "Scholastic Lore (Tactica Imperialis)":
    "Recall facts from a particular scholarly subject requiring extensive academic study. Standard: basic information; 1 degree: uncommonly known; 2 degrees: obscure; 3+ degrees: extremely obscure. No time to recall a fact; researching takes 1d10 hours per Test. | Tactica Imperialis: a grounding in the Tactica Imperialis, as well as other theories of war, troop deployment and battle techniques — may be used to plan a battle or deduce the likely flow of war.",

  // ===== FORBIDDEN LORE =====
  "Forbidden Lore (The Black Library)":
    "Recall dangerous and often heretical knowledge from unconventional sources. Success reveals basic information; each degree reveals more. No time at all; possession may warrant Inquisitorial attention and may grant Corruption or Insanity Points at GM's discretion. | The Black Library: secret knowledge of the Black Library, its forbidden contents, strange industries and the unspeakable pale things that toil within its walls.",
  "Forbidden Lore (Cults)":
    "Recall dangerous and often heretical knowledge from unconventional sources. Success reveals basic information; each degree reveals more. No time at all; possession may warrant Inquisitorial attention and may grant Corruption or Insanity Points at GM's discretion. | Cults: knowledge of the most notorious Imperial Cults and some of their sub-sects and splinter cabals.",
  "Forbidden Lore (Daemonology)":
    "Recall dangerous and often heretical knowledge from unconventional sources. Success reveals basic information; each degree reveals more. No time at all; possession may warrant Inquisitorial attention and may grant Corruption or Insanity Points at GM's discretion. | Daemonology: terrible comprehension of some of the recorded warp entities and their various manifestations.",
  "Forbidden Lore (Heresy)":
    "Recall dangerous and often heretical knowledge from unconventional sources. Success reveals basic information; each degree reveals more. No time at all; possession may warrant Inquisitorial attention and may grant Corruption or Insanity Points at GM's discretion. | Heresy: unpleasant appreciation for those acts and practices deemed heretical by the Imperium.",
  "Forbidden Lore (Inquisition)":
    "Recall dangerous and often heretical knowledge from unconventional sources. Success reveals basic information; each degree reveals more. No time at all; possession may warrant Inquisitorial attention and may grant Corruption or Insanity Points at GM's discretion. | Inquisition: a general understanding (often based on hearsay and rumour) of that most terrible and secret of organisations.",
  "Forbidden Lore (Archeotech)":
    "Recall dangerous and often heretical knowledge from unconventional sources. Success reveals basic information; each degree reveals more. No time at all; possession may warrant Inquisitorial attention and may grant Corruption or Insanity Points at GM's discretion. | Archeotech: knowledge of the great tech devices of ancient times and clues to their function and purpose.",
  "Forbidden Lore (Mutants)":
    "Recall dangerous and often heretical knowledge from unconventional sources. Success reveals basic information; each degree reveals more. No time at all; possession may warrant Inquisitorial attention and may grant Corruption or Insanity Points at GM's discretion. | Mutants: covering the study of both stable and unstable mutations and some of their more unfortunate results.",
  "Forbidden Lore (Ordos)":
    "Recall dangerous and often heretical knowledge from unconventional sources. Success reveals basic information; each degree reveals more. No time at all; possession may warrant Inquisitorial attention and may grant Corruption or Insanity Points at GM's discretion. | Ordos: slightly more specialised knowledge of a particular Ordo's practices — Malleus, Hereticus or Xenos.",
  "Forbidden Lore (Adeptus Mechanicus)":
    "Recall dangerous and often heretical knowledge from unconventional sources. Success reveals basic information; each degree reveals more. No time at all; possession may warrant Inquisitorial attention and may grant Corruption or Insanity Points at GM's discretion. | Adeptus Mechanicus: an understanding of the followers of the Machine God, including their observances, common beliefs and core philosophies.",
  "Forbidden Lore (Psykers)":
    "Recall dangerous and often heretical knowledge from unconventional sources. Success reveals basic information; each degree reveals more. No time at all; possession may warrant Inquisitorial attention and may grant Corruption or Insanity Points at GM's discretion. | Psykers: skill in identifying the signs of psykers as well as the results of their powers and the extent of their capabilities.",
  "Forbidden Lore (Warp)":
    "Recall dangerous and often heretical knowledge from unconventional sources. Success reveals basic information; each degree reveals more. No time at all; possession may warrant Inquisitorial attention and may grant Corruption or Insanity Points at GM's discretion. | Warp: an understanding of the ways of the warp, especially its interaction with realspace and how its tides and eddies affect travel between the stars.",
  "Forbidden Lore (Xenos)":
    "Recall dangerous and often heretical knowledge from unconventional sources. Success reveals basic information; each degree reveals more. No time at all; possession may warrant Inquisitorial attention and may grant Corruption or Insanity Points at GM's discretion. | Xenos: knowledge of the most commonly encountered species of aliens within the Imperium.",

  // ===== PERFORMER SKILLS =====
  "Performer (Dancer)":
    "Entertain and enthrall crowds. A Storyteller or Singer performance can substitute for Charm (Difficult −10); a Musician or Singer performance can substitute for Blather (Difficult −10). Variable time from a short poem to a full opera. | Dancer: entertain through choreographed movement and dance.",
  "Performer (Musician)":
    "Entertain and enthrall crowds. A Storyteller or Singer performance can substitute for Charm (Difficult −10); a Musician or Singer performance can substitute for Blather (Difficult −10). Variable time from a short poem to a full opera. | Musician: play musical instruments to entertain crowds and substitute for Blather (Difficult −10).",
  "Performer (Singer)":
    "Entertain and enthrall crowds. A Storyteller or Singer performance can substitute for Charm (Difficult −10); a Musician or Singer performance can substitute for Blather (Difficult −10). Variable time from a short poem to a full opera. | Singer: entertain through vocal performance and substitute for Charm or Blather (Difficult −10).",
  "Performer (Storyteller)":
    "Entertain and enthrall crowds. A Storyteller or Singer performance can substitute for Charm (Difficult −10); a Musician or Singer performance can substitute for Blather (Difficult −10). Variable time from a short poem to a full opera. | Storyteller: captivate audiences with tales and narratives and substitute for Charm (Difficult −10).",

  // ===== TRADE SKILLS =====
  "Trade (Agri)":
    "Practice a trade or craft to make a living, create items or identify a craftsman's handiwork. A day's hard work per Test; identifying an item or craftsman is a Full Action. | Agri: grow, care for and harvest crops and livestock.",
  "Trade (Apothecary)":
    "Practice a trade or craft to make a living, create items or identify a craftsman's handiwork. A day's hard work per Test; identifying an item or craftsman is a Full Action. | Apothecary: blend and prepare herbal remedies.",
  "Trade (Armourer)":
    "Practice a trade or craft to make a living, create items or identify a craftsman's handiwork. A day's hard work per Test; identifying an item or craftsman is a Full Action. | Armourer: create and maintain armour and weapons.",
  "Trade (Artist)":
    "Practice a trade or craft to make a living, create items or identify a craftsman's handiwork. A day's hard work per Test; identifying an item or craftsman is a Full Action. | Artist: create works of art.",
  "Trade (Cartographer)":
    "Practice a trade or craft to make a living, create items or identify a craftsman's handiwork. A day's hard work per Test; identifying an item or craftsman is a Full Action. | Cartographer: take accurate measurements and turn them into maps.",
  "Trade (Cook)":
    "Practice a trade or craft to make a living, create items or identify a craftsman's handiwork. A day's hard work per Test; identifying an item or craftsman is a Full Action. | Cook: create and identify food.",
  "Trade (Copyist)":
    "Practice a trade or craft to make a living, create items or identify a craftsman's handiwork. A day's hard work per Test; identifying an item or craftsman is a Full Action. | Copyist: swiftly copy text, illuminate manuscripts and forge written material.",
  "Trade (Embalmer)":
    "Practice a trade or craft to make a living, create items or identify a craftsman's handiwork. A day's hard work per Test; identifying an item or craftsman is a Full Action. | Embalmer: prepare and preserve corpses.",
  "Trade (Mason)":
    "Practice a trade or craft to make a living, create items or identify a craftsman's handiwork. A day's hard work per Test; identifying an item or craftsman is a Full Action. | Mason: assess and construct stone buildings.",
  "Trade (Merchant)":
    "Practice a trade or craft to make a living, create items or identify a craftsman's handiwork. A day's hard work per Test; identifying an item or craftsman is a Full Action. | Merchant: find, bargain for and sell trade goods.",
  "Trade (Miner)":
    "Practice a trade or craft to make a living, create items or identify a craftsman's handiwork. A day's hard work per Test; identifying an item or craftsman is a Full Action. | Miner: extract minerals, maintain mines and identify common hazards.",
  "Trade (Prospector)":
    "Practice a trade or craft to make a living, create items or identify a craftsman's handiwork. A day's hard work per Test; identifying an item or craftsman is a Full Action. | Prospector: find and identify valuable materials.",
  "Trade (Scrimshawer)":
    "Practice a trade or craft to make a living, create items or identify a craftsman's handiwork. A day's hard work per Test; identifying an item or craftsman is a Full Action. | Scrimshawer: inscribe patterns, text and imagery onto materials.",
  "Trade (Smith)":
    "Practice a trade or craft to make a living, create items or identify a craftsman's handiwork. A day's hard work per Test; identifying an item or craftsman is a Full Action. | Smith: forge metals into shape.",
  "Trade (Soothsayer)":
    "Practice a trade or craft to make a living, create items or identify a craftsman's handiwork. A day's hard work per Test; identifying an item or craftsman is a Full Action. | Soothsayer: give the appearance of telling the future.",
  "Trade (Tanner)":
    "Practice a trade or craft to make a living, create items or identify a craftsman's handiwork. A day's hard work per Test; identifying an item or craftsman is a Full Action. | Tanner: prepare and tan hides.",
  "Trade (Technomat)":
    "Practice a trade or craft to make a living, create items or identify a craftsman's handiwork. A day's hard work per Test; identifying an item or craftsman is a Full Action. | Technomat: maintain mechanical and tech items, often without understanding the machine's true purpose.",
  "Trade (Valet)":
    "Practice a trade or craft to make a living, create items or identify a craftsman's handiwork. A day's hard work per Test; identifying an item or craftsman is a Full Action. | Valet: refine the appearance, give droll asides and tend to the needs of superiors in a gentlemanly fashion.",
  "Trade (Wright)":
    "Practice a trade or craft to make a living, create items or identify a craftsman's handiwork. A day's hard work per Test; identifying an item or craftsman is a Full Action. | Wright: assess, design and construct buildings, vehicles and the like.",
};
