// src/data/homeworldData.ts

import { SkillSource } from "../../types/SkillSource";

export interface HomeworldTrait {
  name: string;
  description: string;
  effectLabel: "Benefit" | "Penalty" | "Effect";
  effect: string;
  gmNote?: string;
}

export interface HomeworldCareer {
  /** Literal heading from the source material. */
  name: string;
  /** Matching Career name in the app, when it differs from the source heading. */
  careerName?: string;
  description: string;
}

export interface HomeworldSkill {
  name: string;
  rule: string;
}

export interface HomeworldSection {
  title: string;
  content: string;
}

export interface HomeworldData {
  id: string;
  name: string;
  source: SkillSource;
  roll: string;
  description: string;
  skills?: readonly HomeworldSkill[];
  traits: readonly HomeworldTrait[];
  careers: readonly HomeworldCareer[];
  sections?: readonly HomeworldSection[];
}

export const HOMEWORLD_LIST: readonly HomeworldData[] = [
  {
    id: "feral-world",
    name: "Feral World",
    source: SkillSource.CR,
    roll: "01–15",
    description:
      "Feral worlders are born to worlds trapped in a state of barbarism. They are natural survivors, and are commonly big, strong and tough. Feral worlders make for characters that are exceptional at physical action and combat.",
    skills: [{ name: "Speak Language (Tribal Dialect)", rule: "Gain this skill." }],
    traits: [
      {
        name: "Iron Stomach",
        description:
          "Food is often scarce on feral worlds and those born on such worlds learn to set aside their revulsion and eat whatever they must to survive.",
        effectLabel: "Benefit",
        effect:
          "You gain a +10 bonus to Carouse Skill Tests made to resist the effects of ingested toxins, poison or tainted foods. This bonus applies to Tests made to consume unusual or unpleasant meals—rotting meat, Grox testes, corpse starch rations, to name a few—as well as Tests made to resist throwing up.",
      },
      {
        name: "Primitive",
        description:
          "Feral worlders have no time for the mysteries of technology or the rubbishy constraints of etiquette and social niceties.",
        effectLabel: "Penalty",
        effect:
          "You take a –10 penalty on Tech-Use (Int) Tests and a –10 penalty to Fellowship Tests made in formal or civilised surroundings.",
      },
      {
        name: "Rite of Passage",
        description:
          "Life is harsh for a feral worlder, and blood spills all too frequently. Whether through surviving a brutal initiation ritual or through tribal teachings, feral worlders are adept at tending bleeding wounds.",
        effectLabel: "Benefit",
        effect:
          "You may spend a Full Action to make an Intelligence Test to staunch Blood Loss (see Chapter VII: Playing the Game on page 211). This is a Full Action. On a success, you manage to stop the bleeding.",
      },
      {
        name: "Wilderness Savvy",
        description: "Feral worlders are accustomed to hunting their own food.",
        effectLabel: "Benefit",
        effect:
          "Navigation (Surface) (Int), Survival (Int) and Tracking (Int) count as Basic Skills for feral worlders.",
      },
    ],
    careers: [
      {
        name: "Assassin",
        description:
          "Feral world Assassins are usually plucked from their home world at a young age by Death Cults or Assassinorum schools. They soon begin a savage training regime which thins out the unworthy. Learning the art of the kill, they become fierce and merciless Assassins, much in demand on many worlds. Inured to pain and accustomed to death, they are deadly in the extreme.",
      },
      {
        name: "Guardsman",
        description:
          "Feral world Guardsmen are usually tribal warriors tithed to the Imperial Guard by the elders of their particular clan. They are sometimes trained en masse in vast drill camps or ship holds, whilst others are merely shown a lasgun and trusted to get on with it. Also, there are those instructed by members of their tribe, using rote-learned rites and religious rituals. They make tough and dedicated warriors—perfect for protecting a cadre of Acolytes.",
      },
      {
        name: "Imperial Psyker",
        description:
          "Imperial Psykers from feral worlds were once the shamans, witch doctors or cunning folk of their clan. Their talent is such that they have been sought out and taken away for sanction by the agents of the Black Ships of the Inquisition. They wield strange powers, from healing charms to deadly, unstoppable hexes. Some peer into entrails to perceive the future, whilst others can create blight dolls to strike down their foes. They are naturally tough and hard to kill, which can be both a blessing and a curse.",
      },
      {
        name: "Scum",
        description:
          "Feral world Scum are the scavengers and survivors of their peoples. Some hang around colonies and outposts, thereby becoming semi-civilised, whilst others have come from post-apocalyptic worlds where theft and gang warfare are the norm. Adept at thievery and tricks, they manage to survive by using a combination of wits, light fingers and barefaced cheek.",
      },
    ],
  },
  {
    id: "hive-world",
    name: "Hive World",
    source: SkillSource.CR,
    roll: "16–35",
    description:
      "Hivers are the products of vast a crowded hive cities. They are fast talking, quick thinking individuals accustomed to looking out for themselves—perfect if you want to play a roguish character who lives by their wits.",
    skills: [{ name: "Speak Language (Hive Dialect)", rule: "Gain this skill." }],
    traits: [
      {
        name: "Accustomed to Crowds",
        description:
          "Hivers grow up surrounded by immense herds of humanity. They are used to weaving through even the densest mob with ease.",
        effectLabel: "Benefit",
        effect:
          "Crowds do not count as Difficult Terrain for hivers, and when Running or Charging through a dense crowd, hivers take no penalty to the Agility Test to keep their feet.",
      },
      {
        name: "Caves of Steel",
        description:
          "To a hiver, surrounded at all times by metal, machinery and industry, the arcane mysteries of technology are not so strange.",
        effectLabel: "Benefit",
        effect: "Hivers treat the Tech-Use (Int) skill as a Basic Skill.",
      },
      {
        name: "Hivebound",
        description:
          "Hivers seldom endure the horrors of the open sky or the indignity of the great outdoors.",
        effectLabel: "Penalty",
        effect:
          "Hivers take a –10 penalty to all Survival (Int) Tests, and while out of a “proper hab” (e.g. places without manufactured goods, solid ceilings and electrical power) the hiver takes a –5 penalty to all Intelligence Tests.",
      },
      {
        name: "Wary",
        description:
          "Hivers are constantly alert for the first hint of trouble, be it a gang shoot-out, hab riot, or hivequake.",
        effectLabel: "Benefit",
        effect: "All hivers gain a +1 bonus to Initiative rolls.",
      },
    ],
    careers: [
      {
        name: "Arbitrator",
        description:
          "Hive world Arbitrators are usually skilled riot officers, adept at beating down uprisings and sedition in the tightly packed corridors of the hive. They may come from a family of traditional law keepers, or perhaps they joined out of a sense of civic duty. Whatever the case, they learn to bring justice to those that would threaten the order of the Imperium.",
      },
      {
        name: "Assassin",
        description:
          "Hive world Assassins are usually prowling bounty hunters, skilled in finding and destroying their man. They might be hired by rivals to settle a difficult gang war or end a competing trade house. Others move amongst the glittering spire nobility, sowing poison and death in their wake—a deadly instrument in the cut-and-thrust world of politics.",
      },
      {
        name: "Cleric",
        description:
          "Hive world Clerics usually minister to the toiling masses of the middle hive, exhorting them to ever greater works in the Emperor’s name. Others may tend to the spiritual needs of the upper classes, or even seek to save the souls of gang scum deep in the bowels of the hive.",
      },
      {
        name: "Imperial Psyker",
        description:
          "Hive world psykers are usually plucked from their birth class and dragged into the service of the nobility. Many endure a life of indentured servitude, truth saying business dealings or reading fortunes for fashionable noble matrons. Others are recruited to dampen the psychic resonance of the millions of souls packed within the metal skin of the hive. Some soothe and numb the workers, whilst others hunt out the seditious, mutated or secretly psychic.",
      },
      {
        name: "Scum",
        description:
          "Hive world Scum are usually of the downtrodden lower classes of the hive. Some are vicious gangers, ready to murder at a moment’s notice, whilst others are petty thieves and cretescreevers. Some may be middle hivers living a life outside the norm, whilst a rare few might be the children of noble families, driven to a life of disrepute by scandal, disinheritance or boredom. Whatever the case, they possess a reckless disregard for authority and law, living by theft, lies and chicanery.",
      },
      {
        name: "Tech-Priest",
        description:
          "Hive world Tech-Priests are usually recruited from hereditary castes dedicated to maintaining the fabric of the hive itself. Many Tech-Priests view other hivers as little more than organic components in the glorious machine-spirit of the city. Others delve into the deep and forgotten places to seek out the lost secrets of the hive’s origins.",
      },
    ],
  },
  {
    id: "imperial-world",
    name: "Imperial World",
    source: SkillSource.CR,
    roll: "36–55",
    description:
      "Much of humanity hails from one of the myriad civilized worlds of the Imperium, where, despite bewildering diversity, Imperial culture and faith in the God-Emperor is strong. Adaptable and varied, characters with this Origin make good all-rounders and have the widest choice of careers available to them.",
    traits: [
      {
        name: "Blessed Ignorance",
        description:
          "Imperial citizens know that the proper ways of living are those that are tried and tested by the generations that have gone before. Horror, pain and death are the just rewards of curiosity, for those that look too deeply into the mysteries of the universe are all too likely to find malefic beings looking back at them.",
        effectLabel: "Penalty",
        effect: "Your wise blindness imposes a –5 penalty on Forbidden Lore (Int) Tests.",
      },
      {
        name: "Hagiography",
        description:
          "Meditation upon the lives—and, more importantly, deaths—of the Emperor’s blessed saints grants Imperial citizens a wide knowledge of the Imperium of Man.",
        effectLabel: "Benefit",
        effect:
          "Imperial worlders treat the Common Lore (Imperial Creed) (Int), Common Lore (Imperium) (Int), and Common Lore (War) (Int) skills as Basic Skills.",
      },
      {
        name: "Liturgical Familiarity",
        description:
          "Surrounded as they are by folk of the faith, Imperial citizens are accustomed to the preaching of the Ecclesiarchy.",
        effectLabel: "Benefit",
        effect:
          "Imperial world characters treat Literacy (Int) and Speak Language (High Gothic) (Int) as Basic Skills.",
      },
      {
        name: "Superior Origins",
        description:
          "Imperial citizens know that of all the worlds in the Imperium, theirs is, in fact, the most beloved of the Emperor.",
        effectLabel: "Benefit",
        effect: "Increase your Willpower by +3.",
      },
    ],
    careers: [
      {
        name: "Adept",
        description:
          "Imperial Adepts are the civil servants that run the Empire of Man: the Administratum. They ceaselessly work to record and archive the workings of the Emperor’s dominion with nearly all information passing through their ink-stained fingers. Whether interpreting ancient tomes of lore, stamping Imperial Tithe orders or sending fleets to war, they administrate the vastest Empire mankind has ever known.",
      },
      {
        name: "Arbitrator",
        description:
          "Imperial Arbitrators are tasked with defending the rule of the Imperium. They might be part of an Adeptus Arbites precinct on some technocratic capital, or a law keeper upon an emerging colony world. Others still are stationed upon shrine worlds to watch for signs of Ecclesiarchy schism, whilst others itch for action upon peaceful paradise worlds.",
      },
      {
        name: "Assassin",
        description:
          "Imperial Assassins are often members of a minor death cult or else professional killers. Some may hunt criminals for money, whilst others may act for powerful nobles or even governments. Indeed, some are products of planetary or Imperium controlled Assassinorum schools, whilst others have merely found themselves as accomplished executioners due to war, persecution or other circumstances.",
      },
      {
        name: "Cleric",
        description:
          "Imperial Clerics are valued members of the Ecclesiarchy. They might hail from a shrine world or minister to the peoples of an agri-world. Some might be the orphans of war heroes, raised by the Ecclesiarchy to be fanatically loyal servants of the Emperor. Some work amidst the blood and gunfire of the battlefield, whilst others may seek to raise the spirits of frontier world colonists in the face of terrible hardships and ravening xenos.",
      },
      {
        name: "Guardsman",
        description:
          "Imperial world Guardsmen are usually warriors and troopers tithed to the Imperial Guard. Given up as part of their home world’s obligation to the Emperor, these Acolytes have been trained and equipped with the best their world had to offer. Other Guardsmen may have been seconded from mercenary or private armies controlled by the rich and powerful.",
      },
      {
        name: "Imperial Psyker",
        description:
          "Psykers from Imperial worlds are sanctioned by the Throne of Terra, thereby gaining some measure of respectability and acceptance. Most are servants of some Imperial institution, camouflaged behind scholastic-seeming titles and almost Ecclesiastical robes. Largely indistinguishable from their fellow adepts, they advise, investigate and serve the Imperium as best they may. Their superiors, meanwhile, watch them closely for signs of corruption or betrayal.",
      },
      {
        name: "Scum",
        description:
          "Imperial Scum are the smugglers, thieves, deserters and desperados of the Imperium. Some hail from rogue worlds, where there is no government or law, whilst others have been plucked from the penal legions for their dubious skills. Many prey like parasites upon the society of their planet, perhaps trading in forbidden materials, or siphoning off food supplies.",
      },
      {
        name: "Tech-Priest",
        description:
          "Imperial Tech-Priests are often the children of a forge world. Some are brought up to be part of the Adeptus Mechanicus, whilst others join due to natural skill. They attend the rites of technology for their world, be it tending the harvester machines, spaceport cogitators, governmental vox mechanisms or colonial mining gear. Some do little more than contemplate the ancient Standard Template Constructs, whilst others actively search them out.",
      },
    ],
  },
  {
    id: "void-born",
    name: "Void Born",
    source: SkillSource.CR,
    roll: "56–65",
    description:
      "Born from the bloodlines of human star travellers, voiders have lived most of their lives in space within the metallic bastions of great vessels. Uncommonly lucky and strong willed, they are perfect if you want to play a psyker or risk-taking adventurer.",
    skills: [{ name: "Speak Language (Ship Dialect)", rule: "Gain this skill." }],
    traits: [
      {
        name: "Charmed",
        description:
          "The void born unconsciously channel the fickle powers of the warp, making them preternaturally lucky.",
        effectLabel: "Benefit",
        effect:
          "Whenever you spend a Fate Point (though not if you burn one), roll a 1d10. On the roll of a natural 9, you do not lose the Fate Point.",
      },
      {
        name: "Ill-Omened",
        description:
          "Whether because of their strange looks, clannish ways or unwholesome air, the void born are shunned and mistrusted by most. In addition the void born are most likely to attract any negative attention that the party of Acolytes creates—accusations of curdling milk, disgruntled merchants, children with handfuls of Grox dung and so on.",
        effectLabel: "Penalty",
        effect:
          "You take a –5 penalty on all Fellowship Tests made to interact with non-void born humans.",
      },
      {
        name: "Shipwise",
        description:
          "Birthed in the depths of a spacefaring craft, the void born have a natural affinity for such vehicles.",
        effectLabel: "Benefit",
        effect:
          "Navigation (Stellar) (Int) and Pilot (Spacecraft) (Ag) are Basic Skills for you.",
      },
      {
        name: "Void Accustomed",
        description:
          "Due to their strange and unnatural childhood, the void born are used to the vagaries of changing gravity.",
        effectLabel: "Benefit",
        effect:
          "You are immune to space travel sickness. In addition, zero- or low-gravity environments are not considered Difficult Terrain for you.",
      },
    ],
    careers: [
      {
        name: "Adept",
        description:
          "Void born Adepts are often part of the adminisphere of the ship, acting to serve the officer caste by analysing data, attending the Navigators, recording the contents of various holds and so on. Others are tasked with more bizarre duties, such as keeping accurate maps of the vessel, preserving the integrity of the ship’s bloodlines or engraving the names of every crew member into the hull of the craft.",
      },
      {
        name: "Arbitrator",
        description:
          "Void born Arbitrators stride the corridors of the ship ever alert for trouble and sedition. Some work at the behest of the captain, watching for signs of witchery and rebellion in the crew. Others maintain close links with the Adeptus Arbites, and instead watch the officers for signs of corruption.",
      },
      {
        name: "Assassin",
        description:
          "Void born Assassins frequently take orders from the high-ranking officers of the ship. These Assassins kill off troublemakers and suspected cult leaders before any corruption or sedition can spread through the ship. Others are members of strange death cults, mandated by the enginseers, plucking their victims seemingly at random to offer up to the Emperor.",
      },
      {
        name: "Cleric",
        description:
          "Void born Clerics often act as padre to the lower orders of the ship, walking the bunk-holds offering confession to the sleepless, or screaming blessings amidst the crash and thunder of the gun deck. Some lead choirs of bilge-scribbers in litanies against the warp, whilst others ensure the Emperor icons are properly adored. Others act as spiritual advisors to the captain, while others still are part of the officer class.",
      },
      {
        name: "Imperial Psyker",
        description:
          "Void born psykers are prized and feared members of the crew. Some are employed to detect emerging psykers within the crew, hunting them out before they can become prey to some malefic horror of the warp. Others act to maintain defences against such intrusion, whilst others bleed out portions of their soul to aid the ships’ Navigators, and some are trained to receive astropathic communications. Whatever their role, they are watched closely by everyone aboard their ship.",
      },
      {
        name: "Scum",
        description:
          "Void born Scum are the misbegotten and outcast members of the crew, perhaps spawned through some forbidden inter-caste liaison or maybe from a traditional class of untouchables. Whatever the case, void born Scum drive and control the black market aboard ship and are adept at scrounging, stealing or concocting all manner of illicit treats—from alcohol to fresh meat and worse.",
      },
      {
        name: "Tech-Priest",
        description:
          "Void born Tech-Priests are those given to care for the fabric and soul of their ship. Perhaps dedicated from birth, or recruited through natural aptitude, these Tech-Priests display an eerie connection with their vessel. Some specialise in knowing the ways and rites of particular systems, whilst others dedicate themselves to repair. Others still whisper into the captain’s ear, their buzzing voices speaking of the desires of the ship itself.",
      },
    ],
  },
  {
    id: "forge-world",
    name: "Forge World",
    source: SkillSource.IH,
    roll: "66–75",
    description:
      "Those raised in the shadow of the Omnissiah have survived the Machine God’s harsh regime and possesses an innate familiarity with the higher mysteries of arcane science, making for excellent scholars and tech-priests.",
    skills: [
      { name: "Common Lore (Tech)", rule: "Basic Skill" },
      { name: "Common Lore (Machine Cult)", rule: "Basic Skill" },
    ],
    traits: [
      {
        name: "Fit For Purpose",
        description:
          "A forge world inhabitant is repeatedly tested, channelled and trained from birth for their chosen station and role in life. Weakness is not tolerated and failure met with painful incentives to do better. Even those who follow a rogue’s path must strive to be better than their peers to survive.",
        effectLabel: "Effect",
        effect:
          "Depending on your chosen Career, increase your Characteristic by +3: Adept—Intelligence, Assassin—Agility, Guardsman—Ballistic Skill, Scum—Perception, or Tech-Priest—Willpower.",
      },
      {
        name: "Stranger to the Cult",
        description:
          "Although forge world born citizens know that the Emperor is their god and saviour, they see the Imperial Creed through the lens of Cult Mechanicus doctrine. As a result, they can be surprisingly—and sometimes dangerously—ignorant of the common teachings and practices of the Ecclesiarchy, often failing to offer its clerics the level of deference they expect.",
        effectLabel: "Effect",
        effect:
          "Forge world characters take a –10 penalty on Tests involving knowledge of the Imperial Creed, and a –5 penalty on Fellowship Tests to interact with members of the Ecclesiarchy in formal settings.",
      },
      {
        name: "Credo Omnissiah",
        description:
          "Rather than being fully indoctrinated into the Imperial Cult, even the lowliest member of a forge world’s society is brought up to venerate the spirits of the machine and to know and trust the basic rites of tech-propitiation.",
        effectLabel: "Effect",
        effect: "You gain the Technical Knock talent.",
      },
    ],
    careers: [
      {
        name: "Forge World Adepts",
        careerName: "Adept",
        description:
          "Forge world Adepts toil among the gathered wisdom and incomprehensible minutia of the ages. Some consider themselves to be holy priests of knowledge, while for others the temptation to simply “know” becomes too much. For such driven and zealous individuals, data and its acquisition can become an addiction as dangerous and urgent as any drug, leading them to overstep the safe boundaries of ritual and clearance in search of ever more secret and obscure lore to the peril of life, sanity and soul.",
      },
      {
        name: "Forge World Assassins",
        careerName: "Assassin",
        description:
          "Subtle murder and infiltration are arts far from unknown in forge world politics. Bitter rivalries between individual Magos, demesne guild houses and opposing tech-sects can sometimes lead to outright data-theft, sabotage and bloodshed. The answer for some factions is to train and augment agents able to fulfil the roles of spy, saboteur and killer, and a few even sell their services for hire off-world.",
      },
      {
        name: "Forge World Guardsmen",
        careerName: "Guardsman",
        description:
          "The regular armed forces of the Cult Mechanicus are the Skitarii Tech-Guard, raised as other worlds might form PDF units or regiments of the Imperial Guard. Selected and relentlessly trained to defend and enforce order on the forge worlds. Most will be part of a forge world’s standing defences or law enforcement, while others may serve in the retinues of individual Magos or allied guild houses.",
      },
      {
        name: "Forge World Scum",
        careerName: "Scum",
        description:
          "Most forge world Scum are classed as hereteks. A hidden underclass in the worker’s slum-habs and abandoned buildings, they take what scraps of tech-lore they have managed to learn or steal and turn it to their own profit, often manufacturing illegal goods, drugs and arms from materials stolen from their erstwhile masters. All know that to be apprehended by the Mechanicus for their crimes often means a fate worse than death.",
      },
      {
        name: "Forge World Tech-Priests",
        careerName: "Tech-Priest",
        description:
          "To be a tech-priest in a forge world is both a boon and a curse; it is to have access to the Machine God’s greater glories but at the same time to be merely one among many; to be the least and most easily replaceable of the Omnissiah’s servants. The society of tech-priests has a tendency to breed two polar groups; those who serve blindly and diligently and those who strive to overcome and advance themselves at any cost. For this latter division, flesh is merely weakness to be rid of, knowledge and power things to be coldly craved if the Machine God’s mysteries are to be revealed and embraced.",
      },
    ],
  },
  {
    id: "schola-progenium",
    name: "Schola Progenium",
    source: SkillSource.IH,
    roll: "76–85",
    description:
      "Progena are orphans of Imperial servants trained in mind, body and spirit from birth. They make for superior warriors and knowledgeable leaders, if lacking in experience of life’s more sordid side.",
    skills: [
      { name: "Literacy", rule: "Gain this skill." },
      { name: "Speak Language (High Gothic)", rule: "Gain this skill." },
      { name: "Speak Language (Low Gothic)", rule: "Gain this skill." },
    ],
    traits: [
      {
        name: "Schola Education",
        description:
          "“A progeny’s mind is the product of years of careful instruction in the fundamentals of knowledge and learning.”",
        effectLabel: "Effect",
        effect:
          "Common Lore (Administratum) (Int), Common Lore (Ecclesiarchy) (Int), Common Lore (Imperial Creed) (Int), Common Lore (Imperium) (Int), Common Lore (War) (Int), and Scholastic Lore (Philosophy) (Int) are Basic Skills for you.",
      },
      {
        name: "Skill at Arms",
        description:
          "“All progena are instructed by grizzled drill abbots in the arts needed to defend the Emperor’s truth and, no matter what their calling, all are willing and able to shed blood if needed.”",
        effectLabel: "Effect",
        effect:
          "You begin play with the Basic Weapon Training (Las or SP), Melee Weapon Training (Primitive), and Pistol Training (Las or SP) talents.",
      },
      {
        name: "Sheltered Upbringing",
        description:
          "“Despite their extremely well-rounded education, the progena are largely ignorant of the Imperium’s worse elements, breeding a distain they can’t ever seem to manage to hide.”",
        effectLabel: "Effect",
        effect:
          "You take a –10 penalty on all Charm, Command, Deceive and Scrutiny Tests when dealing with the worst of examples of humanity (cultists, traitors, narco-addicts, gutter scum, mutants and the like).",
      },
      {
        name: "Tempered Will",
        description:
          "“The harsh methods of the Schola Progenium chiefly aim to forge the most crucial weapon a servant of the Emperor has: an unbending will.”",
        effectLabel: "Effect",
        effect:
          "Whenever you would attempt a Very Hard (–30) Willpower Test, you only take a –20 penalty for your Characteristic instead of the normal –30.",
      },
    ],
    careers: [
      {
        name: "Schola Progenium Adepts",
        careerName: "Adept",
        description:
          "“Adepts recruited out of the Schola Progenium are often destined for special duties in the Administratum or in scholastic colleges specialising in particular or difficult areas of knowledge. Such dedicated and hard-willed individuals may find their way to being researchers or archivists serving the Adeptus Arbites, Munitorium or even the Black Ships of the Inquisition.”",
      },
      {
        name: "Schola Progenium Arbitrators",
        careerName: "Arbitrator",
        description:
          "“Many of the finest Arbites are drawn from the Progenium, where their unstinting loyalty to the Imperial Creed and detachment from local society makes them ideal lawgivers and dispensers of justice. Often frontline command or high office beckons for progena, but some also find their intellects put to use in special investigation units. The obscure and secretive Inquisitorial Wards draw a high proportion of their number from the Schola Progenium output.”",
      },
      {
        name: "Schola Progenium Clerics",
        careerName: "Cleric",
        description:
          "“Products of the Schola are found in all ranks and divisions of the Ecclesiarchy, from the Missionary Galaxia to the parish deacons who maintain the many temporal holdings of the Ministorum. Hardened and educated in the Imperial Creed from an early age, becoming a preacher, confessor or missionary is but a small step for a progena.”",
      },
      {
        name: "Schola Progenium Guardsmen",
        careerName: "Guardsman",
        description:
          "“The harsh mental and physical discipline of the Schola produces fine material for soldiering. Famously, the storm troopers of the Imperial Guard are almost exclusively drawn from the Schola Progenium, while the Commissariat and Divisio Tactica also sport high number of former progena students.”",
      },
      {
        name: "Schola Progenium Sororitas",
        description:
          "“Female progena make up the overwhelming majority of the Adeptus Sororitas. The Schola’s spiritual, physical and mental training are the perfect prelude to noviceship in one of the Orders.”",
      },
    ],
  },
  {
    id: "noble-born",
    name: "Noble Born",
    source: SkillSource.IH,
    roll: "86–95",
    description:
      "Nobles are privileged individuals, raised in wealth and steeped in tradition and etiquette. They are ideally suited for those who prefer charm and guile over brute force. Nobles make superb spies, diplomats and assassins.",
    skills: [
      { name: "Literacy", rule: "Gain this skill." },
      { name: "Speak Language (High Gothic)", rule: "Gain this skill." },
      { name: "Speak Language (Low Gothic)", rule: "Gain this skill." },
    ],
    traits: [
      {
        name: "Etiquette",
        description:
          "“Nobles are schooled in how to comport themselves in all manner of formal situations.”",
        effectLabel: "Effect",
        effect:
          "You gain a +10 bonus on Charm, Deceive and Scrutiny Tests when dealing with high authority and in formal situations.",
      },
      {
        name: "Supremely Connected",
        description:
          "“Nobles have extensive connections and you know that dropping the “right” names into a conversation can open more doors than a fistful of Thrones.”",
        effectLabel: "Effect",
        effect:
          "You begin play with the Peer (Nobility) talent. In addition, you also gain Peer (Academics, Adeptus Mechanicus, Administratum, Astropaths, Ecclesiarchy, Government, Mercantile, Military or Underworld), selecting one category to reflect your family’s powerbase.",
      },
      {
        name: "Vendetta",
        description:
          "“Every noble house has its sworn enemies and rivals who would do it and its members harm. Joining the Holy Ordos doesn’t stop this, it merely forces those who wish you harm to be a bit more cautious and subtle in exacting their vengeance.”",
        effectLabel: "Effect",
        effect:
          "You have powerful enemies, perhaps in the shape of a rival noble house or some other powerful group. The details of these enemies are left to you and the GM to define, working together to create a formidable threat. While they do not dog your steps at every turn, they are still out there, aiming to inconvenience, harm or kill you when you cross their path, You, of course, are free to return the favour when it’s expedient to do so.",
      },
    ],
    careers: [
      {
        name: "Noble Born Adepts",
        careerName: "Adept",
        description:
          "There are many nobles, particularly those distant from power, who turn their educated minds and fortunes to intellectual pursuits and embark on self-financed careers acquiring obscure knowledge and cataloguing esoteric subjects, though their curiosity can and often does lead them to trouble.",
      },
      {
        name: "Noble Born Arbitrator",
        careerName: "Arbitrator",
        description:
          "A noble house’s holdings can be extremely large and its enemies many, and the protection of the house entrusted only to castellans of the same blood. Others of noble blood enter the Arbites as a means to find a purpose, or to increase their own influence and power.",
      },
      {
        name: "Noble Born Assassins",
        careerName: "Assassin",
        description:
          "The nobility of the Imperium is riven with vendettas and bloody power struggles, and through these delicate wars move the noble Assassins, versed in the etiquette and form of killing; to them assassination is a dance to be executed with precision and, in some cases, relish.",
      },
      {
        name: "Noble Born Clerics",
        careerName: "Cleric",
        description:
          "The Ecclesiarchy is a high and noble calling as well as being a route to one of the greatest powers in the Imperium: faith. Most noble families have confessors from within their own blood, and some have a few prelates or even cardinals to boot. Imperial history is filled with those of noble birth who have ascended to greatness in the priesthood for good or ill, carried by their noble bearing, flattery and skilled diplomacy.",
      },
      {
        name: "Noble Born Guardsmen",
        careerName: "Guardsman",
        description:
          "Many noble families have traditions of service within the officer class of the Imperial Guard, either as a life-long career or a staging post to greater things. In many cases, young nobles are sent to serve with regiments raised by the family itself, before returning blooded and swelled with glory to serve their family. That is presuming they return at all.",
      },
      {
        name: "Noble Born Scum",
        careerName: "Scum",
        description:
          "A noble birth is no guarantee of a noble soul, and the refinement and mannered charm of good breeding can be turned to less than honest pursuits. Murderous rakes and dandy charlatans fallen from great houses, and concealed “embarrassments” that others might label monsters, are more common than the nobility would like others to believe.",
      },
    ],
  },
  {
    id: "mind-cleansed",
    name: "Mind Cleansed",
    source: SkillSource.IH,
    roll: "96–00",
    description:
      "Those whose minds have been emptied of identity and their memories wiped or sealed off. These rare individuals have been “re-made” by their Inquisitorial masters to serve the Holy Ordos.",
    traits: [
      {
        name: "Engram Implantation",
        description:
          "With portions of the subjects’ minds left more or less as blank slates waiting to be filled, their reprogrammers often use engramatic induction to burn a variety of useful skill patterns directly into the Acolyte’s cortex.",
        effectLabel: "Effect",
        effect:
          "You begin play with Deceive (Fel) and Intimidate (S) skills. You treat Common Lore (Tech) (Int) and Survival (Int) as Basic Skills. You also begin with the Jaded and Pistol Weapon Training (SP and Las) talents.",
      },
      {
        name: "Failsafe Control",
        description:
          "All Mind Cleansed Inquisitorial agents have a failsafe command trigger implanted in their minds to prevent them from turning on their masters. Only the relevant NPC (their Inquisitor for example), should ever have access to this trigger, which usually must be delivered telepathically or by a specific sonic cadence (a simple code phrase is usually judged too risky).",
        effectLabel: "Effect",
        effect:
          "The trigger works just like the use of the Dominate Psychic Power (see page 178 in Dark Heresy). If the trigger is successful, you may be given an order or set of instructions you must carry out to the best of your abilities. However, if the command is antithetical or directly harmful to you, you may receive an appropriate bonus to resist the control.",
      },
      {
        name: "Imperial Conditioning",
        description:
          "Inquisition mind-scrubs are usually carried out to destroy selective memories but leave useful skills intact. Likewise the mind is often implanted with psychic barriers to prevent tampering, increase mental resilience and ensure loyalty.",
        effectLabel: "Effect",
        effect:
          "You gain a +10 bonus on Willpower Tests made to resist Fear or attempts to control or possess your mind (psychically, chemically or otherwise).",
      },
      {
        name: "Through a Mirror Darkly",
        description:
          "The mind cleansing process has numerous side effects, including an eroding effect on the subject’s sanity and unique dangers of its own for the character.",
        effectLabel: "Effect",
        effect:
          "You start play with 1d5+2 Insanity Points. At the GMs discretion, certain rare events, individuals and even things like phrases, sights, and smells may trigger “repressed” memories—roll on Shards of Memory. When this occurs you must pass a Willpower Test or roll on the Shock Table (see page 233 in Dark Heresy)—note that your conditioning and any Talents that resist Fear or Insanity don’t help with this.",
        gmNote: "Use this Trait sparingly.",
      },
    ],
    careers: [
      {
        name: "Cleansed Arbitrators",
        careerName: "Arbitrator",
        description:
          "The Adeptus Arbites and local enforcers may well, during the course of their sworn duties, uncover truths too terrible to understand and see things that no man may live through sane. The Inquisition, for its part, sees such unfortunates as prime candidates for mind cleansing and induction into their ranks, burning away what cannot be allowed to remain and leaving a lifetime of training and an ingrained sense of duty.",
      },
      {
        name: "Cleansed Assassins",
        careerName: "Assassin",
        description:
          "The cleansed assassin is usually little more than a living weapon in the hands of the Holy Ordos, a near disposable tool of death, reprogrammed to serve without question and kill without conscience. They make for able bodyguards and infiltrators, and indeed some may once have been mercenaries, recidivists or other scum that have been captured, cleansed and turned on their former friends.",
      },
      {
        name: "Cleansed Clerics",
        careerName: "Cleric",
        description:
          "Clerics are among the rarest of cleansed Acolytes, as martyrdom in most cases is deemed preferable for a true servant of the faith than mind scrubbing. Exceptions do exist, however, and the cleansing may leave a cleric shorn away of their past and memories, leaving only fervour and the love of the Emperor behind. Some Radical Inquisitors, with a sense of ironic punishment, may order a heretic or criminal to be remade as a faithful servant of the Emperor to pay for their sins with a lifetime of service. This is frowned on by many traditionalists as an unjustly lenient punishment, added to which, as past events have proven on more than one occasion, as evil may remain in even the most “scrubbed” soul.",
      },
      {
        name: "Cleansed Guardsman",
        careerName: "Guardsman",
        description:
          "The Inquisition has frequent use for inducted military forces when a major raid or suppression is called for. However, it is often necessary that the men and woman involved cannot be allowed to remember what they have done or seen in the Holy Ordos’ service. If the risk of corruption is too great, death is the only answer, but if possible, a particularly able servant of the Emperor should not be wasted when they have more left to give.",
      },
      {
        name: "Cleansed Psykers",
        careerName: "Imperial Psyker",
        description:
          "Psykers are prey to all manner of horrors from the warp and frequently prone to mental disorders and trauma, particularly if their abilities have emerged or been discovered late in life. Sometimes where this is the case, the powers-that-be judge that the psyker’s talent can be salvaged, but that “who they are” has become irretrievably damaged. The answer for some is to cut away the personality and memories like a surgeon might cut away cancerous tissue from a healthy organ, but as with surgery, the results cannot always be guaranteed.",
      },
      {
        name: "Cleansed Tech-Priests",
        careerName: "Tech-Priest",
        description:
          "The Adeptus Mechanicus knows that knowledge can be dangerous. The cerebral augmentation of a tech-priest can make the selective destruction of memory easier in fact than with a normal brain. A cleansed tech-priest may have served as part of some secret project or mission that, once complete, merited the wiping of all trace of its knowledge for those involved as a matter of course. Alternately, they may have followed some renegade master, become prey to tech-heresy themselves or simply strayed too far into regions forbidden. Some tech-priests even see mind cleansing as a desirable procedure, ridding them of the weakness of a sentimental attachment to the past.",
      },
    ],
    sections: [
      {
        title: "Shards of Memory",
        content:
          "Despite the best efforts of their mental conditioning, strange and disturbing flashes of the past may creep through, materialising in frozen dislocated images in dreams, sudden déjà-vu or inexplicable fears and revulsions that pass in a flickering panicked moment. Shards of Memory presents a few possible examples (GMs may feel inclined to provide further “episodes”).",
      },
    ],
  },
];

export type HomeworldId = (typeof HOMEWORLD_LIST)[number]["id"];
