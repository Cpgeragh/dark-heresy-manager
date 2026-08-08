// src/data/reference/consumablesReference.ts
// Reference data for consumable items from the Core Rulebook.
// Drugs are handled separately in drugsReference.ts.

import { SkillSource } from "../../types/SkillSource";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ConsumableRef {
  id: string;
  name: string;
  source: SkillSource;
  description?: string;
  weight?: string;
  /** Cost per dose, pack, or bottle, when supplied by the source. */
  value?: string;
  availability?: string;
}

// ─── Reference Data ───────────────────────────────────────────────────────────

export const CONSUMABLES_REFERENCE: ConsumableRef[] = [
  // ── Core Rulebook ─────────────────────────────────────────────────────────

  {
    id: "cr-amasec",
    name: "Amasec",
    source: SkillSource.CR,
    description:
      "A popular alcoholic drink distilled from wine. It can range from lesser brews barely fit " +
      "for firebombs to well-aged and flavourful brands suitable for only the finest of the Emperor's servants.",
    value: "50 Thrones",
    availability: "Scarce",
  },
  {
    id: "cr-injector",
    name: "Injector",
    source: SkillSource.CR,
    description:
      "Injectors can take many forms from cheap low-tech disposable syringes up to sophisticated " +
      "hypo-sprays and even bio-attuned skin patches. An injector can hold a single dose of any drug, " +
      "which a character may administer as a Full Action.",
    value: "5 Thrones",
    availability: "Abundant",
  },
  {
    id: "cr-lho-sticks",
    name: "Lho-sticks",
    source: SkillSource.CR,
    description:
      "Common with Imperial Guard troopers and many menial workers. Each rolled paper tube contains " +
      "a scented, mildly narcotic (and addictive) plant-derived substance, which is then lit and the " +
      "resulting smoke inhaled through the tube.",
    value: "10 Thrones",
    availability: "Common",
  },
  {
    id: "cr-medikit",
    name: "Medikit",
    source: SkillSource.CR,
    description:
      "A vital piece of equipment for any medic. Contains various cataplasm patches, contraseptics " +
      "and synth-skin. A character with a medikit at hand when using the Medicae skill gains a +20 " +
      "bonus to their Test. Medikits also come with 6 doses of stimm, which must be replaced separately when used.",
    weight: "2 kg",
    value: "150 Thrones",
    availability: "Common",
  },
  {
    id: "cr-ration-packs",
    name: "Ration Packs",
    source: SkillSource.CR,
    description:
      "Most food in the Imperium is packaged, processed and usually completely unrecognisable as " +
      "anything edible. Quality varies widely, from corpse starch rations and cultured algae up to " +
      "flavourful strips of grox meat and finest nutrislurry.",
    value: "10 Thrones",
    availability: "Plentiful",
  },
  {
    id: "cr-recaf",
    name: "Recaf",
    source: SkillSource.CR,
    description:
      "A popular hot beverage made from crushed and brewed leaves. Composition varies from planet " +
      "to planet, but most blends have a stimulant such as caffeine as a basic release agent.",
    value: "5 Thrones",
    availability: "Abundant",
  },
  {
    id: "cr-rotgut-booze",
    name: "Rotgut Booze",
    source: SkillSource.CR,
    description:
      "Alcohol comes in many shapes and sizes throughout the Imperium, and most cultures are noted " +
      "for at least one kind of fermented liquid. The catch-all term for these more basic brews " +
      "(especially by travellers) is rotgut booze.",
    value: "10 Thrones",
    availability: "Abundant",
  },
  {
    id: "cr-sacred-machine-oil",
    name: "Sacred Machine Oil",
    source: SkillSource.CR,
    description:
      "Machine oil blessed by the Omnissiah. If applied to a weapon (a Full Action) it becomes immune " +
      "to Jamming for a number of shots equal to its clip size. If the weapon is already Jammed and the " +
      "oil is applied, it immediately unjams, but there is no further effect.",
    value: "150 Thrones",
    availability: "Very Rare",
  },

  // ── Inquisitor's Handbook ────────────────────────────────────────────────
  {
    id: "ih-belly-churn",
    name: "Belly-Churn",
    source: SkillSource.IH,
    description:
      "Popular with nomadic peoples, the belly-churn is an animal stomach filled with milk, sewn shut and then flung over the side of a riding beast to slowly curdle. The resulting cheese is regarded as a delicacy and also keeps “fresh” a remarkably long time, making it the ideal ration for a lengthy journey.",
    weight: "1kg",
    value: "10",
    availability: "Average",
  },
  {
    id: "ih-spirit-tonic",
    name: "Spirit Tonic",
    source: SkillSource.IH,
    description:
      "Originating from the planet of Munsk in the Iosian Reach, spirit tonic is an alcoholic brew produced mainly on the northern continent. Its ingredients are not wildly known, though, there are rumors that the corpses of the small rodents dominating that area of the planet may be the primary ingredient, however, such whispers have yet to be proven. Regardless, steed tonic is infamous for its wretched flavour, inspiring many theories about just what exactly is in it. Known to its detractors as “coward juice”, consuming a measure of this foul fluid inspires a degree of “courage” to the imbiber. The natives of Munsk believe a swig can dull the pangs of fear and thus nearly all warriors drink the fluid before hunting, waging war or confronting their spouse. This vile concoction conceals a powerful narcotic poison, once ingested it grants a +10 bonus on all Fear Tests made for the next 1d5 hours. However, it impairs judgment, inflicting a −10 penalty on all Intelligence based Tests during this period. This substance is also addictive and more than capable of inflicting permanent brain damage in a frequent user.",
    weight: "0.1kg",
    value: "12",
    availability: "Common",
  },
  {
    id: "ih-styger-milk",
    name: "Styger Milk",
    source: SkillSource.IH,
    description:
      "The Styger is a beast of burden found on Fervious. Shortly after a Styger gives birth to a whelp, it produces a viscous fluid on which its young feeds. So thick is this vile substance that when a human consumes it, the milk coats the throat, windpipe and stomach for up to a day after being ingested. As well as being full of nutrients and proteins, the people of Fervious have found that the milk engenders resilience to poisons and toxins. The Styger milk is so effective at neutralizing toxins that all Fervious’s nobles, as a matter of course, drink it before eating. This has led to substantial trade for Styger dairy farmers who, before the discovery of the milk’s benefits, were nothing more than just peasants. Now the dairy farmers have grown rich and powerful in their own right, fighting amongst themselves in the hopes of gaining a monopoly. Anyone who drinks a dose of Styger milk gains a +20 Resistance to ingested poisons. The effects of Styger milk last for 1d5 hours, however, its long-term effects can be unpleasant, and aside from degrading the user’s sense of taste, every time it is used the drinker must take a Challenging (+0) Toughness Test or suffer 1 point of permanent Toughness Damage.",
    weight: "0.3kg",
    value: "75",
    availability: "Very Rare",
  },
  {
    id: "ih-gorsk-white-gyn",
    name: "Gorsk White Gyn",
    source: SkillSource.IH,
    description:
      "Originating from the Fenksworld hive of Magnagorsk and distilled from modified engine coolant (hence its name), this caustic, ice-cloudy spirit is an extremely powerful brew and favoured by those with a taste for something with a bigger kick than even triple-stilled amasec can provide. As well as making you feel as if your head has been staved in, Gorsk White, as a dilute measure, can also mitigate the effects of some tainted water and foods. Such “gyn mixes” are popular in the Metallican Infernis, the rookeries of Solomon and in the Soot Warrens of Tranch for this reason, though the Gorsk White remains the most infamous. Drinking unmixed Gyn requires a Hard (−20) Carouse Test.",
    weight: "—",
    value: "5",
    availability: "Common",
  },
  {
    id: "ih-sorrowful-vintage",
    name: "Sorrowful Vintage",
    source: SkillSource.IH,
    description:
      "Although amasec may be the most popular fine spirit across the sector, and many local ales and vintages hold sway where they are made, the most sought-after alcohol is the wine of Quaddis. The garden world of Quaddis is considered by most to be nothing more than a myth, or perhaps a place that once did exist but is now long gone to dust. Regardless, the wines produced by its viniculture are valued above all others and almost preternaturally potent. Many hive nobles and guilders pay huge sums for them and, in some cases, plot, murder and steal to attain them; seeing them both a mark of ultimate opulence and good taste. Three such wines are listed here: the first, the Sorrowful Vintage, is widely regarded as a pale imitation of the real thing (but still highly desirable), the second, the Golden Tokay, is perhaps the most accessible “true” Quaddis wine, while the last, the Kataline Malmsey, is the stuff dreams are made off—hugely valuable and, legend holds, capable of killing an over-indulgent drinker with pure pleasure.",
    weight: "—",
    value: "250",
    availability: "Rare",
  },
  {
    id: "ih-golden-tokay",
    name: "Golden Tokay",
    source: SkillSource.IH,
    description:
      "Although amasec may be the most popular fine spirit across the sector, and many local ales and vintages hold sway where they are made, the most sought-after alcohol is the wine of Quaddis. The garden world of Quaddis is considered by most to be nothing more than a myth, or perhaps a place that once did exist but is now long gone to dust. Regardless, the wines produced by its viniculture are valued above all others and almost preternaturally potent. Many hive nobles and guilders pay huge sums for them and, in some cases, plot, murder and steal to attain them; seeing them both a mark of ultimate opulence and good taste. Three such wines are listed here: the first, the Sorrowful Vintage, is widely regarded as a pale imitation of the real thing (but still highly desirable), the second, the Golden Tokay, is perhaps the most accessible “true” Quaddis wine, while the last, the Kataline Malmsey, is the stuff dreams are made off—hugely valuable and, legend holds, capable of killing an over-indulgent drinker with pure pleasure.",
    weight: "—",
    value: "1,000",
    availability: "Very Rare",
  },
  {
    id: "ih-kataline-malmsey",
    name: "Kataline Malmsey",
    source: SkillSource.IH,
    description:
      "Although amasec may be the most popular fine spirit across the sector, and many local ales and vintages hold sway where they are made, the most sought-after alcohol is the wine of Quaddis. The garden world of Quaddis is considered by most to be nothing more than a myth, or perhaps a place that once did exist but is now long gone to dust. Regardless, the wines produced by its viniculture are valued above all others and almost preternaturally potent. Many hive nobles and guilders pay huge sums for them and, in some cases, plot, murder and steal to attain them; seeing them both a mark of ultimate opulence and good taste. Three such wines are listed here: the first, the Sorrowful Vintage, is widely regarded as a pale imitation of the real thing (but still highly desirable), the second, the Golden Tokay, is perhaps the most accessible “true” Quaddis wine, while the last, the Kataline Malmsey, is the stuff dreams are made off—hugely valuable and, legend holds, capable of killing an over-indulgent drinker with pure pleasure.",
    weight: "—",
    value: "10,000+",
    availability: "Very Rare",
  },
  {
    id: "ih-polygum",
    name: "Polygum",
    source: SkillSource.IH,
    description:
      "Polygum can, and has, been used to form countless items, though tarps, ponchos and makeshift slings are the most prevalent. It readily serves as a weather sealant and a few tech-priests have been known to bless polygum in order to employ it as a suitable makeshift repair substance for holding machine parts together. An individual with the Medicae skill can employ a ball of polygum to automatically staunch a bleeding wound without a Test and it also serves as an excellent dressing. however, such use causes the polygum to crumble soon after. Polygum is now used throughout the sector, though its rarity makes it costly. It is one of Ganf Magna’s sole exports and it is sent forth in small, cylindrical, carved wood containers.",
    weight: "—",
    value: "75",
    availability: "Very Rare",
  },
  {
    id: "ih-ration-grubs",
    name: "Ration Grubs",
    source: SkillSource.IH,
    description:
      "The world of Dusk is far more famed for its extreme deadliness than the rare few creatures that can aid one’s life instead of quickly ending it. Still, it is from the swamps of Dusk that the exceedingly useful ration grubs hail. Originally discovered during a survey by an Adeptus Mechanicus Genetor explorator team, ration grubs are a phenomenally rich source of nutrients. A single freeze-dried grub, which is about the size of a man’s thumb, provides a subsistence level of nutrients sufficient for a full day, however, the grub’s indescribably foul taste and trace toxins make it a poor choice for a long term diet. Some seasoned travellers like to joke that, as natives of Dusk, ration grubs continue to be deadly to one’s appetite if nothing else.",
    weight: "—",
    value: "15",
    availability: "Average",
  },
  {
    id: "ih-coral-paste",
    name: "Coral Paste",
    source: SkillSource.IH,
    description:
      "The Genetor’s success opened the way to large scale Imperial harvesting, and coral paste is now regularly applied to all Spectorin ships, no matter their size, as well as being repeatedly caked across the entire hull of the planet’s sole underwater habitat, Enkaidan. Coral paste has proven to be useful to the colonists of Spectoris as a makeshift hull repair agent on a number of occasions. Its utility is marred by the fact it must be reapplied frequently, else the coral covering can deteriorate with lethal results. Coral paste is a highly regulated substance due to the extreme value of a great many Spectorin species of fish, which inevitably brings poachers. Coral Paste is readily available on Spectoris and free to that world’s agri-workers. Elsewhere it is a Very Rare and highly proscribed substance.",
    weight: "1kg",
    value: "225",
    availability: "Abundant (Spectoris), Very Rare (Elsewhere)",
  },
  {
    id: "ih-ploin-juice",
    name: "Ploin Juice",
    source: SkillSource.IH,
    description:
      "A common non-alcoholic beverage popular with many ship’s crews as it combats many common illnesses brought on by the habitual poor diets most find in space travel. Made from the lopsided ploin fruit, it is rich in many vitamins and has an extended shelf life. It can be added to most poor quality distillations to add much-needed flavour, or even used as the basis for its own strong drink commonly known as “wobble” (as this is both what the fruit does when set upright, and what most users do after imbibing a few shots).",
    weight: "0.5kg",
    value: "25",
    availability: "Scarce",
  },
  {
    id: "ih-civilian-relief-rations",
    name: "Civilian Relief Rations",
    source: SkillSource.IH,
    description:
      "Ration bricks made from recycled food waste or any other organic materials, used for civilian relief in areas of intense fighting. Also known as “Emperor’s Mercy” bars, each can just barely keep a person alive for a day. The less said about their taste the better.",
    weight: "0.5kg",
    value: "2",
    availability: "Plentiful",
  },
  {
    id: "ih-combat-ration-pack",
    name: "Combat Ration Pack",
    source: SkillSource.IH,
    description:
      "Each metallic pouch contains foodstuffs for one complete meal (including vitamin supplements) along with salt and water puri-tabs, a protein bar and minor medical supplies. No cooking is required but most troops either use open flames, squad hexamine stoves or their tank armour to heat them where possible. These packs are more or less sufficient to keep a soldier fighting, albeit flavourless (or worse bad tasting) and unappealing for extended use.",
    weight: "1kg",
    value: "2",
    availability: "Plentiful",
  },
  {
    id: "ih-daily-prayers",
    name: "Daily Prayers",
    source: SkillSource.IH,
    description:
      "Another civilian relief item, these parchments can be airdropped into cities or even rolled up and fired from grenades or mortars. Each contains inspirational addresses to maintain spiritual well-being and morale. Each is also heavily imprinted with nutrients—chewed they can sustain physical well-being as well.",
    weight: "—",
    value: "1",
    availability: "Average",
  },
  {
    id: "ih-emergency-rations",
    name: "Emergency Rations",
    source: SkillSource.IH,
    description:
      "Just a step above relief rations, these are generally stowed in tanks or aircraft to supplement individual packs. When a unit must wait for relief or rescue, they can stretch daily packs into weeks of sustenance.",
    weight: "1kg",
    value: "10",
    availability: "Average",
  },
  {
    id: "ih-long-duration-ration-pack",
    name: "Long Duration Ration Pack",
    source: SkillSource.IH,
    description:
      "Much the same as a regular pack, but includes higher-energy items for troopers conducting forced marches or intense activities away from central command.",
    weight: "1kg",
    value: "5",
    availability: "Common",
  },
  {
    id: "ih-drusine-incense",
    name: "Drusine Incense",
    source: SkillSource.IH,
    description:
      "Said to be rendered from a proscription laid down by the warrior-saint Drusus himself during the war-torn days of the Angevin Crusade, this incense—a mixture of myrrh, camphor, verdigris and the crushed blossoms of the rare Iocathine rose—is prepared ritually in the vaults of the Cathedral of Illumination in Hive Tarsus and is renowned for its powerful purifying effect. Highly valued by the faithful, Drusine incense is used in high masses and ceremonies of import across the Calixis Sector, and the Holy Ordos know that folk tales of the incense’s ability to ward-off evil hold more than a grain of truth. Drusine incense is a coarse reddish-gold crystalline powder burned in a self-heating metal censer suspended on chains called a thurible. The incense burned and dispersed in this creates a cloud up to three metres across. Within this cloud, characters with 10 or less Corruption Points are immune to the effects of the Daemonic Presence special rule. A single portion of incense burns for 1d10+20 minutes.",
    weight: "0.5kg",
    value: "100",
    availability: "Rare",
  },
];
