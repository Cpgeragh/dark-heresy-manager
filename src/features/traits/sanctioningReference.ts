export interface SanctioningResultRef {
  id: string;
  roll: string;
  name: string;
  effect: string;
}

export const SANCTIONING_RESULTS: SanctioningResultRef[] = [
  {
    id: "reconstructed-skull",
    roll: "01–08",
    name: "Reconstructed Skull",
    effect:
      "Some part of your sanctioning fractured your skull. Perhaps it was a form of psycho-surgery, instructive beating or blast of untrammelled power that split your head like a Malfian pus-grape. You have large metal plates in your head, some of which are clearly visible. Reduce your Intelligence by 3, but gain 5d10 Throne Gelt in compensation.",
  },
  {
    id: "hunted",
    roll: "09–14",
    name: "Hunted",
    effect:
      "Your sanction-visions have induced a mild paranoia. You believe certain parts of your psyche, those amputated by the sanctioners, have gained sentience and are tracking you down. Whilst part of you realises that this is foolish, you still refuse to sit with your back to the door, just in case. Gain 1d10 Insanity Points.",
  },
  {
    id: "unlovely-memories",
    roll: "15–25",
    name: "Unlovely Memories",
    effect: "Such was your sanctioning, that you visibly twitch and grimace whenever Holy Terra is mentioned. Gain 1d5 Insanity Points.",
  },
  {
    id: "the-horror",
    roll: "26–35",
    name: "The Horror, the Horror",
    effect: "Your hair is pure white, you occasionally gibber quietly to yourself and you endure terrible nightmares every night. Gain 1d5 Insanity Points.",
  },
  {
    id: "pain-through-nerve-induction",
    roll: "36–42",
    name: "Pain through Nerve Induction",
    effect: "The skin on the back of your right hand is horribly scarred. You are uncomfortable around bald, robed women.",
  },
  {
    id: "dental-probes",
    roll: "43–49",
    name: "Dental Probes",
    effect:
      "You no longer have any teeth in your head. Perhaps they were shattered, or removed, or simply fled your skull in protest at the psychic agony within. You have a set of carven dentures, formed from the teeth of dead pilgrims. They are of Good quality and, whilst they have inestimable sentimental value to you, on the open market they are worth approximately 50 Thrones.",
  },
  {
    id: "optical-rupture",
    roll: "50–57",
    name: "Optical Rupture",
    effect:
      "Your sanctioning rituals have done great violence to your eyes. They have been removed and replaced with Common quality cybernetic senses. See Chapter V: Armoury for more details on these.",
  },
  {
    id: "screaming-devotions",
    roll: "58–63",
    name: "Screaming Devotions",
    effect:
      "Your ruined vocal cords have been replaced with a vox inducer. This thumb-sized implant gleams in the flesh of your neck. Other than granting you a rather mechanical timbre to your voice, this has no game effect.",
  },
  {
    id: "irradiance",
    roll: "64–70",
    name: "Irradiance",
    effect: "You have seen the true power of the Golden Throne. You have no hair anywhere upon your body, face or head.",
  },
  {
    id: "tongue-bound",
    roll: "71–75",
    name: "Tongue Bound",
    effect:
      "Your lips, gums and soft palate are tattooed with hexagrammatic wards. You must make a Hard (–20) Willpower Test to speak the names of the Ruinous Ones (Khorne, Tzeentch, Slaanesh and Nurgle). Additionally, you stutter terribly when speaking of daemons.",
  },
  {
    id: "throne-wed",
    roll: "76–88",
    name: "Throne Wed",
    effect: "You cleave only unto the Emperor. You gain the Chem Geld talent and a chattallium ring, worth 100 Thrones.",
  },
  {
    id: "witch-prickling",
    roll: "89–94",
    name: "Witch Prickling",
    effect: "Your body is covered in thousands of tiny scars. You have a thorough dislike of needles. Increase your Toughness by 3.",
  },
  {
    id: "hypno-doctrination",
    roll: "95–00",
    name: "Hypno-doctrination",
    effect: "Powerful conditioning causes you to chant the Litany of Protection in a whispered voice whenever you are asleep or unconscious. Increase your Willpower by 3.",
  },
];
