# Manual Test Checklist — Complete App

Thirty pages and cross-cutting sections, containing 208 checks. Every item
comes from reading the actual logic, not a generic "does it load" pass.
Check items off as you verify them; anything under **Watch for** is the
likeliest place a real bug hides. Coverage notes are at the bottom — read
those before assuming this is literally every file.

### How to use this checklist

For every section, test once as the DM and once as an owning player wherever both roles can reach it. Use a second plain-player browser profile for permission checks. Unless a check explicitly says otherwise, verify three things after every change: the screen updates immediately, the value still exists after leaving and returning, and a full browser refresh shows the same value. For destructive or account-level tests, use a disposable campaign and characters.

While you're on any page, it's worth trying a blank, negative, or huge value in one number field and a long or unusual string in one text field — that alone catches most broken-input bugs without needing to repeat it on every field on every page.

## 1. Vitals

Wounds and Fate Points — the combat-status header block.

### How to test this page

Use an editable character with Total Wounds above 5, Current Wounds in the middle of the range, and a known Toughness Bonus. Exercise every boundary by typing it directly where typing is allowed and by using the steppers. After each accepted change, leave Vitals, return, and refresh. For the Fatigue cross-check, change Toughness on Characteristics in a second tab and return to Vitals without reloading. The expected value or colour is stated in each checkbox below.

- [ ] Total Wounds field rejects 0, blank, and negative — only accepts 1+
- [ ] Current Wounds stepper won't go above Total Wounds
- [ ] Current Wounds turns red at 3 or below
- [ ] Critical Damage stepper has no upper limit; info icon shows the correct rules text
- [ ] Fatigue turns red and shows "Unconscious" exactly when it exceeds Toughness Bonus, not at or below it
- [ ] Fate Total accepts 0, rejects negative
- [ ] Fate Current stepper capped at Fate Total, turns red at exactly 0

**Watch for:** changing Toughness on the Characteristics page should move
where Fatigue turns red here — the threshold is read live, not cached.
Lowering Total Wounds below the current value should clamp Current Wounds
down with it.

## 2. Insanity

Insanity Points track, Degree of Madness, Temporary Trauma, and Disorders.

### How to test this page

Start at 0 and set Points to one below, exactly on, and one above every documented threshold. At each value compare the chip, bar, counters, and retirement state before moving on. Add one entry of each supported type, refresh, then remove it. For legacy coverage, open or import a fixture containing old free-text disorder notes before adding a structured disorder. Repeat the tab checks at a phone-width viewport using real touch input if possible.

- [ ] Points stepper 0–100; Degree chip and timeline bar move together and land on the right degree at each threshold
- [ ] "X pts until Trauma Test" and "X pts until [next Degree]" counters show the correct remaining distance and update live
- [ ] At the top of the track, the page switches to "Character retires from play" and hides the Status/Thresholds grid
- [ ] Add a Temporary Trauma from the picker — roll chip and rules text match the entry chosen
- [ ] Add a Disorder — severity chip colour and info text match its severity, type chip is correct
- [ ] Remove a Trauma and a Disorder — both arm a confirm step ("Delete [name] from this character?" with Delete/Cancel) instead of deleting on the first tap; the list only updates after confirming
- [ ] Escalate a Disorder to its next severity tier — button reads "Escalate to Severe"/"Escalate to Acute" depending on current tier, arms its own confirm step ("Escalate [name] to [tier]?" with Escalate/Cancel), and disappears once already at the highest tier for that disorder (The Flesh is Weak has no Minor tier; Horrific Nightmares has no Acute tier)
- [ ] Editable mode shows an icon Add button beside Disorders and Temporary Trauma headers; read-only mode shows a View icon button instead, which opens the picker in browse-only mode — rows don't respond to clicks and there's no custom-add action
- [ ] Disorder/Trauma picker rows are boxed cards, matching Talents/Traits/Skills/Psychic
- [ ] Custom Disorder form requires Type, Name, Origin (Custom/2nd Ed), Severity, and Rules Text; custom Trauma form requires Name, Origin, and Rules Text — Add stays disabled until every required field is filled
- [ ] Once added, a custom disorder/trauma shows its Origin as a source chip on the entry
- [ ] Custom Disorder/Trauma form's "* Required" hint stays visible even after every field is filled in, not just while incomplete
- [ ] On phone: swiping between Temporary Trauma and Disorders tabs works both directions

**Watch for:** a character with old free-text disorder notes (from before the
structured picker existed) should still show that text, not silently lose it
when a new structured disorder is added.

## 3. Corruption & Mutations

Corruption Points track, Malignancies, Minor and Major Mutations.

### How to test this page

Use the same boundary method as Insanity: one below, on, and one above every threshold. Add a rollable and non-rollable entry, enter the minimum and maximum permitted physical roll values, refresh, and inspect Characteristics. Then remove each source and confirm only its own modifier disappears. Repeat the three groups on both phone and desktop layouts.

- [ ] Points stepper 0–100; Degree chip, timeline, and "pts until Malignancy Test" / "pts until [Degree]" all track correctly
- [ ] Top of track shows "Character removed from play" and hides the Status/Thresholds grid
- [ ] Add a Malignancy that rolls a characteristic modifier — "Edit Rolls" button appears, entering values saves them
- [ ] A Malignancy with no rollable modifiers does *not* show an "Edit Rolls" button
- [ ] Add a Minor and a Major Mutation independently — they stay in separate groups, don't cross-contaminate
- [ ] On phone: three-way tab switch (Malignancies / Minor / Major) swipes correctly; on desktop, all three show side by side
- [ ] Editable mode shows an icon Add button beside each group header; read-only mode shows a View icon button instead, which opens the picker in browse-only mode — rows don't respond to clicks and there's no custom-add action
- [ ] Malignancy/Mutation picker rows are boxed cards, matching Talents/Traits/Skills/Psychic
- [ ] Custom Malignancy/Mutation form requires Name, Origin (Custom/2nd Ed), and Rules Text — Add stays disabled until all three are filled
- [ ] Once added, a custom malignancy/mutation shows its Origin as a source chip on the entry
- [ ] Custom Malignancy/Mutation form's "* Required" hint stays visible even after every field is filled in, not just while incomplete
- [ ] Removing a Malignancy, Minor Mutation, or Major Mutation arms a confirm step ("Delete [name] from this character?" with Delete/Cancel) instead of deleting on the first tap

**Watch for:** this is the one page that writes to another page — a rolled
characteristic modifier here should appear as an adjustment badge on the
matching stat over on Characteristics. Check both directions: add a
modifier and see it appear, remove the malignancy and see it disappear.

## 4. Characteristics

The nine core stats, Characteristic Bonuses, and Movement.

### How to test this page

Record all nine starting values. For each characteristic, set a simple Base value, exercise all four Advance positions, and independently calculate the total and bonus. Use Agility values around a tens boundary to make movement changes obvious. Add positive and negative Corruption modifiers from named sources, including enough negative adjustment to cross the floor of 1. Test Enter, Escape, blur, refresh, phone carousel, and desktop grid separately.

- [ ] Each stat total = Base + Advances, displayed correctly as you edit either field
- [ ] A stat with a Corruption-sourced adjustment shows the (+N) / (−N) badge in the right colour, and the info icon lists every contributing source by name
- [ ] Push a stat's effective total below 1 with a large negative adjustment — it floors at 1, never shows 0 or negative
- [ ] Characteristic Bonuses (SB/TB/AB/etc.) are always stat ÷ 10 rounded down, and update the instant the stat changes
- [ ] Movement row (Half/Full/Charge/Run) recalculates from Agility Bonus correctly
- [ ] On phone: swipe carousel moves between all nine stats in order and wraps around at both ends; only the centred card is editable
- [ ] On desktop: all nine shown as a grid, all editable at once
- [ ] Advances are 4 click-to-fill pips, not 4 independent toggles: clicking pip 3 when only 1 is currently filled fills pips 1–3 together; clicking an already-filled pip retracts back to that pip — confirm this "fill up to" behaviour rather than expecting each pip to toggle on/off independently
- [ ] Typing a Base value, then pressing Escape before it's committed, reverts the field to its last saved value and clears any error state; pressing Enter commits immediately without needing to blur the field
- [ ] Movement's info icon holds the rules paragraph, the AB formula, and (only when a movement-affecting trait is active) a "Modifiers" list of what's contributing — none of this shows as plain text on the page itself, only inside the modal
- [ ] With multiple movement-affecting traits active at once (e.g. Size + Quadruped + Unnatural Speed), the multiplying/halving traits (Amorphous, Crawler, Quadruped) apply to the base Agility Bonus first, then Size's flat adjustment, then Unnatural Speed doubles the result last — confirm the displayed Half/Full/Charge/Run numbers reflect that order
- [ ] Movement's "Modifiers" list is alphabetical regardless of which order the traits were acquired in

**Watch for:** the adjustment badge and its info popup are driven entirely
by Corruption entries — this is the other half of the cross-page link from
Corruption & Mutations above.

## 5. Skills

Basic and Advanced Skills, grouped by category, with computed totals and
Talent-supplied adjustments.

### How to test this page

Use a disposable character. Record its Characteristics before starting. Test
one flat Basic Skill, one grouped Basic Skill, one flat Advanced Skill, and
one grouped Advanced Skill. Keep this character for the Talent cross-page
checks below.

**Page, rules, and totals:**

- [ ] On a phone, the **Basic / Advanced** switch changes the visible section and a horizontal swipe changes it in the same direction
- [ ] The information button beside **Basic Skills** explains that an Untrained Basic Skill is attempted using half its governing Characteristic, rounded down
- [ ] The information button beside **Advanced Skills** explains that an Untrained Advanced Skill cannot be attempted; the number shown in its picker is the Total it will use after becoming Trained
- [ ] An Untrained Basic Skill is visible on the Basic page and its Total is the governing Characteristic ÷ 2, rounded down
- [ ] An Untrained Advanced Skill is absent from the main Advanced page but is present in the Advanced picker with its future Trained Total
- [ ] Training a Skill uses the full governing Characteristic; subsequent acquisitions/level changes produce **+10** and then **+20**
- [ ] The available levels stop at **Trained / +10 / +20** — there is no +30 tier
- [ ] Changing the governing Characteristic updates the Skill Total immediately
- [ ] A Corruption adjustment to that Characteristic also updates the Total, and the Characteristic and Skill pages agree
- [ ] Refresh the app and confirm the Skill levels and computed totals still agree with the saved Characteristic and Corruption entries

**Cards, groups, and pickers:**

- [ ] In Edit mode the section has a plus button; in View mode it has an eye button
- [ ] The main Skill picker closes with ×; a grouped category opened with a forward arrow closes with a back arrow
- [ ] Press and hold a selectable Skill or group card — only that card shows the pressed effect
- [ ] Repeat in View mode — cards may be opened for information but do not show selection feedback or add anything
- [ ] Search finds partial names regardless of capitalisation and ignores leading/trailing spaces
- [ ] General and single-entry categories appear as individual Skill cards
- [ ] Multi-entry categories such as Ciphers, Common Lore, Forbidden Lore, Performer, and Trade appear as grouped cards
- [ ] A group displays every Characteristic used by its children rather than incorrectly showing only one
- [ ] Open a group after scrolling down, press Back, and confirm the parent picker returns to the same scroll position
- [ ] Add one child from a group — only that Skill becomes Trained and disappears from the untrained picker
- [ ] The picker stays open after adding; add a second Skill without closing and reopening it
- [ ] Expand a picker card using its chevron — this previews its information without selecting it
- [ ] Source, Characteristic, Basic/Advanced, current level, and Total chips are readable and do not overlap on a phone
- [ ] Delete a trained Skill: the first tap opens **Delete Skill**, Cancel changes nothing, and Delete returns it to Untrained and to the appropriate picker

**Talent-supplied Skill effects:**

- [ ] Add **Talented (Awareness)** — Awareness gains +10 and its card says `Talent effect: Talented (Awareness): +10`
- [ ] Repeat Talented with a Skill that was not independently trained — the +10 is still shown, but Talented does not falsely record an extra Skill acquisition
- [ ] Add **Machinator Array** — Silent Move receives −10 and names Machinator Array as the source
- [ ] Add **Cult Briefing (Political)** — every Common Lore Skill counts as Basic while the Talent is owned
- [ ] With Tech-Use Untrained, add **Cult Briefing (Heretek)** — Tech-Use becomes Trained, cannot be deleted as if independently purchased, and names the Talent source
- [ ] Independently train Tech-Use first, then add Cult Briefing (Heretek) — the Skill does not gain another level and the redundant training source is not displayed
- [ ] Remove Cult Briefing (Heretek) from both preparations: a solely granted Tech-Use returns to Untrained, while independently trained Tech-Use remains Trained
- [ ] Add **Cult Briefing (Infestation)** and repeat the same solely-granted versus independently-trained check with Medicae
- [ ] Add **Sicarius Tutoring (Adept)** — Deceive uses Intelligence and names the source
- [ ] Add **Sicarius Tutoring (Tech-Priest)** — Inquiry uses Intelligence and names the source
- [ ] Add **Sicarius Tutoring (Arbitrator)** — Shadowing gains +10 from Talented (Shadowing)
- [ ] Add **Sicarius Tutoring (Assassin)** — Concealment gains +10 from Talented (Concealment)
- [ ] Remove each source Talent — only its derived effect disappears; independently purchased Skill levels remain unchanged

## 6. Talents

Regular and Faith Talents, including ranked purchases, specialised choices,
Psychic selections, granted entries, and acquisition effects that update other
parts of the character.

### How to test this page

Use a disposable character and record its Wounds, Fate, Insanity,
Characteristics, Skills, Disciplines, Weapon Training, Traits, cybernetics,
integrated weapons, and Archeotech before starting. The rare acquisition tests
below deliberately change several of those pages.

**Page, cards, and navigation:**

- [ ] On a phone, **Talents / Faith Talents** switches sections and a horizontal swipe changes the section in the same direction
- [ ] Edit mode uses plus buttons and View mode uses eye buttons
- [ ] The main picker closes with ×; every secondary screen opened with a forward arrow returns with a back arrow
- [ ] Press and hold a selectable card — only that card shows the pressed effect; View mode does not show selection feedback
- [ ] Search is case-insensitive and ignores leading/trailing spaces
- [ ] Picker cards show the Talent name, information button, source chip, prerequisites where present, and a forward arrow only when another step is required
- [ ] Prerequisites are informational: the app displays them but does not silently enforce them
- [ ] The picker stays open after adding a Talent; finite Talents disappear while repeatable Talents remain
- [ ] Enter and cancel a choice/acquisition screen — it returns to the still-open Talent picker at the same scroll position
- [ ] Complete a choice/acquisition screen — it also returns to the same still-open picker position
- [ ] All six Weapon Training entries are absent: Basic, Heavy, Melee, Pistol, Thrown, and Exotic Weapon Training
- [ ] Every normal Talent deletion uses a two-step **Delete / Cancel** confirmation
- [ ] Refresh after several additions and deletions and confirm the same cards, ranks, choices, and sources remain
- [ ] Any acquisition screen showing a "* Required" hint keeps it visible even once every required field is filled, not just while incomplete

**Ranked Talents:**

- [ ] Add **Sound Constitution** three times — its picker chip progresses through `Owned: 1`, `Owned: 2`, and `Owned: 3`, while the page shows one `Sound Constitution (3)` card
- [ ] Sound Constitution remains in the picker indefinitely and each purchase adds exactly +1 maximum Wound
- [ ] Open the Wounds adjustment information — the source is listed as Sound Constitution with its total rank
- [ ] Delete the ranked card once — only one purchase is removed, the card becomes `(2)`, and maximum Wounds fall by one
- [ ] Add **Power Well** repeatedly — it remains available, aggregates into one numbered card, and confirmed deletion removes one purchase at a time
- [ ] Add **The Flesh is Weak** four times — its picker status progresses from `Owned: 1/4` to `Owned: 4/4`, and one card progresses from rank (1) to rank (4)
- [ ] At rank 4 The Flesh is Weak disappears from the picker; deleting one purchase lowers it to rank 3 and makes it available again
- [ ] Traits shows one read-only **Machine (rank)** grant and Armour receives the same number of Misc AP at every location
- [ ] Give the character Natural Armour and at least one location with a bionic bonus as well — **Misc Bonuses** lists Natural Armour, The Flesh is Weak, and Bionic as separate lines, while the location total contains their combined value

**Fixed repeatable choices:**

- [ ] **Peer** offers exactly: Academics, Adeptus Arbites, Adeptus Mechanicus, Administratum, Astropaths, Ecclesiarchy, Feral Worlders, Government, Hivers, Inquisition, Middle Classes, Military, Nobility, The Insane, Underworld, Void Born, and Workers
- [ ] **Good Reputation** offers exactly: Administratum, Ecclesiarchy, Imperial Guard, Imperial Navy, Inquisition, and Underworld
- [ ] **Heightened Senses** offers exactly: Sight, Sound, Smell, Taste, and Touch
- [ ] **Mechadendrite Use** offers exactly: Gun, Manipulator, Medicae, Optical, and Utility
- [ ] **Resistance** offers exactly: Cold, Fear, Heat, Poisons, and Psychic Powers
- [ ] **Two-Weapon Wielder** offers exactly: Melee and Ballistic
- [ ] **Talented** uses the current Skills reference catalogue rather than an unrelated hand-written list
- [ ] Buy one choice — the Talent displays as one normal named card, for example `Resistance (Fear)`
- [ ] Reopen its choice picker — the owned choice is absent and cannot be duplicated with different capitalisation
- [ ] Buy a second choice — the entries become one expandable parent with separately listed children
- [ ] Expand and collapse the parent, then delete one child — only that purchase is removed and the surviving child returns to a normal card when only one remains
- [ ] Exhaust every finite option — the whole Talent disappears from the Add Talent picker

**Single-purchase fixed choices:**

- [ ] **Discipline Focus** and **Psychic Supremacy** each offer Biomancy, Divination, Pyromancy, Telekinetics, and Telepathy
- [ ] **Cult Briefing** offers Political, Heretek, Pleasure, Infestation, Blood, and Culture
- [ ] **Sicarius Tutoring** offers Adept, Arbitrator, Assassin, Battle Sister, Cleric, Guardsman, Imperial Psyker, Scum, and Tech-Priest
- [ ] After choosing one option, the entire single-purchase Talent disappears rather than offering the remaining choices as separate purchases

**Hatred and open text:**

- [ ] Hatred offers Criminals, Cult (specific), Daemons, Xeno (specific), Psykers, Heretics, and Mutants
- [ ] Each ordinary Hatred choice can be selected only once
- [ ] Cult (specific) requires a non-blank cult name and displays `Hatred (Cult: name)`
- [ ] Xeno (specific) requires a non-blank xeno name and displays `Hatred (Xeno: name)`
- [ ] Distinct Cult and Xeno names can be added repeatedly; duplicates differing only by spaces or capitalisation are rejected
- [ ] Multiple Hatred purchases group into one expandable parent with individually deletable children
- [ ] Hatred remains available after every ordinary fixed choice is owned because Cult and Xeno are open-ended
- [ ] Reformed Skin requires non-blank replacement text and rejects a duplicate replacement case-insensitively
- [ ] One Reformed Skin is a normal named card; two or more form an expandable group with individually deletable children

**Psychic purchase records:**

- [ ] Add **Minor Psychic Power** and **Psychic Power** on Talents — no actual power is chosen here
- [ ] Their Talent cards and picker cards show `Owned: N`; they do not show availability
- [ ] Add several purchases — each Add creates one selection and the Talent remains available
- [ ] Delete an unused purchase — Delete/Cancel confirmation appears and only one purchase is removed
- [ ] Link every purchase to powers on Psychic, then tap the Talent trash button — **Cannot Delete Talent** explains that its linked Psychic powers must be deleted first
- [ ] The warning appears only after tapping trash; it is not permanently printed on the Talent card
- [ ] Delete a linked power on Psychic, return here, and confirm the released Talent purchase can now be deleted

**Simple permanent and granted effects:**

- [ ] Add **Chem Geld** — Insanity displays exactly +1 and its adjustment popup names Chem Geld
- [ ] Add **Machinator Array** — Strength and Toughness gain +10; Agility and Fellowship lose 5; each adjustment popup names Machinator Array
- [ ] The Machinator Array information also states the −10 Silent Move penalty and inability to swim; only the numeric Characteristic/Skill effects are calculated by the app
- [ ] Add **Touched by the Fates**, confirm the displayed half-Willpower-Bonus value, and verify Vitals sets total Fate to that recorded value
- [ ] Change Willpower afterwards — the already recorded Touched by the Fates value does not silently recalculate
- [ ] Add **The Power Within** — a read-only `Resistance (Psychic Powers)` card appears with `Granted by The Power Within`
- [ ] Add **Purity of Flesh** — a read-only `Gift of Purity` card appears and cannot be deleted independently
- [ ] If an independently purchased Talent duplicates a calculated grant, only one visible card is shown; removing the independent copy reveals the still-active granted card

**Cult Briefing acquisition routes:**

- [ ] Political makes every Common Lore count as Basic while owned
- [ ] Heretek requires a granted augmetic and one of Autosanguine, Logis Implant, Orthoproxy, or Technical Knock; Tech-Use also becomes Trained when it was Untrained
- [ ] A Heretek augmetic that requires a body location cannot be completed until a valid location is chosen
- [ ] Choosing Concealed Weapon Bionic requires an existing Bionic Arm and an eligible unmodified pistol or one-handed melee weapon; readable errors appear when either is missing
- [ ] Completing Concealed Weapon Bionic installs the augmetic and links the selected weapon; deleting Cult Briefing removes that granted augmetic and clears the weapon link
- [ ] Pleasure grants +5 Fellowship and requires Chem Geld or Decadence
- [ ] Infestation trains Medicae and displays a read-only Hardy grant
- [ ] Blood requires one of Melee Weapon Training (Primitive, Chain, Shock, or Power) and displays a read-only Frenzy grant
- [ ] Culture excludes the character's current Home World and adds all Traits from the selected other Home World as read-only, source-labelled entries
- [ ] For Heretek, Pleasure, and Blood, an already-owned reward remains selectable with an Owned marker so acquisition can still be completed
- [ ] Selecting an already-owned reward records the source without displaying a duplicate card or advancing the independently owned Talent
- [ ] Remove each Cult Briefing Talent — derived Characteristics, Skills, grants, Traits, Weapon Training, and augmetics disappear, but independently owned copies remain
- [ ] If Chem Geld is both independently owned and granted through Pleasure, Insanity still gains only +1

**Sicarius Tutoring acquisition routes:**

- [ ] Adept makes Deceive use Intelligence
- [ ] Arbitrator grants read-only Talented (Shadowing) and the +10 appears on Skills
- [ ] Assassin grants read-only Talented (Concealment) and the +10 appears on Skills
- [ ] Battle Sister grants read-only Swift Attack
- [ ] Cleric grants read-only Disturbing Voice
- [ ] Guardsman requires a non-blank Exotic Weapon name and adds it to Weapon Training
- [ ] Imperial Psyker adds exactly +1 maximum Wound and names Sicarius Tutoring as the source
- [ ] Scum requires one Peer group; an already-owned group remains selectable without creating a duplicate visible Peer card
- [ ] Tech-Priest makes Inquiry use Intelligence
- [ ] Removing Sicarius Tutoring removes only these derived benefits and leaves independently purchased copies unchanged

**Psy Rating acquisition:**

- [ ] Psy Rating 1 and 2 record the current Willpower Bonus and each grants Minor selections equal to half that Bonus, rounded up
- [ ] Psy Rating 3 requires a previously unknown Discipline, activates it on Psychic, grants one power from it, and grants the same rounded-up Minor selection count
- [ ] For Psy Rating 4, the Known Discipline route grants the rounded-up number of Major and Minor selections; the New Discipline route grants one Major selection and no Minor selections
- [ ] For Psy Rating 5, the Known Discipline route grants the rounded-up number of Major selections; the New Discipline route grants one Major selection
- [ ] For Psy Rating 6, the Known Discipline route grants the rounded-up number of Major and Minor selections; the New Discipline route grants one Major selection
- [ ] A Known Discipline picker contains only active Disciplines; a New Discipline picker excludes every active Discipline
- [ ] Acquisition clearly displays the recorded Willpower Bonus and the resulting Minor/Major selection counts before confirmation
- [ ] Later Willpower changes do not retroactively change selections already recorded by an owned Psy Rating Talent
- [ ] Psychic displays the highest owned Psy Rating, not the most recently purchased one
- [ ] A Psy Rating Talent with linked powers cannot be deleted; tapping trash opens the same Cannot Delete warning used for Psychic purchase Talents
- [ ] After deleting linked powers, deleting the Talent removes a Discipline only if that purchase introduced it and no other remaining Psy Rating Talent also introduced it

**Purity of Flesh and Reformed Skin:**

- [ ] Prepare normal cybernetics, a custom implant, integrated ranged and melee weapons, a cybernetic/integrated Archeotech item, and a Mechadendrite
- [ ] The Purity acquisition inventory lists every removable item, including custom items, and does not require a manually entered bionic count
- [ ] Fate Points Gained is calculated automatically as one per two qualifying removals, rounded down
- [ ] Mechadendrites are removed but marked as not qualifying for Fate
- [ ] Mark no life-critical items and complete acquisition — all listed items are removed, concealed-weapon links are cleared, and no Toughness/Wound loss is applied
- [ ] Repeat on a fresh character with a long inventory; search the Life-Critical Removals picker, select several items, press Back/Done, and confirm the selection count remains
- [ ] With life-critical removals selected, Permanent Toughness Loss offers only 1–5 and Wounds Lost is exactly 1 regardless of how many items were marked
- [ ] Continue to the Reformed Skin stage — every marked item requires its own non-blank replacement before completion
- [ ] Completion creates one source-noted Reformed Skin entry for every life-critical removal
- [ ] A later Reformed Skin purchase asks whether its cause is Purity of Flesh or Critical Damage
- [ ] Choosing Purity removes all Fate Points gained by that Purity purchase; additional Purity-related replacements do not subtract the same Fate again
- [ ] Choosing Critical Damage leaves Purity Fate unchanged
- [ ] Delete Purity of Flesh — the second confirmation offers **Delete and restore recorded changes**, **Delete Talent only**, and **Cancel**
- [ ] Delete and restore returns recorded implants, integrated weapons, Archeotech, and concealed-weapon links without duplicating items already present
- [ ] Delete Talent only leaves the removed inventory removed while all calculated Talent effects disappear

**Rite of Pure Thought:**

- [ ] The acquisition lists the character's structured Mental Disorders and requires confirmation that the GM reviewed the changes
- [ ] Every disorder selected for removal requires a non-blank replacement name
- [ ] Each replacement retains the removed disorder's severity and is identified as its replacement
- [ ] Deleting Rite of Pure Thought offers the same restore/delete-only decision: restore brings back the recorded original disorders, while delete-only leaves the replacements in place

**Faith Talents and read-only mode:**

- [ ] Faith Talents land under the correct **Emperor's Mercy / Emperor's Sign / Emperor's Wrath** heading
- [ ] The Faith picker stays open after an addition and removes the now-owned non-repeatable Talent
- [ ] Faith Talent deletion uses Delete/Cancel and removes only the chosen entry
- [ ] In View mode, Talent and Faith pickers remain searchable and information popups work, but cards do not add, delete, or show selection feedback

## 7. Weapon Training

Weapon-group training toggles plus a free-text Exotic Weapon list.

### How to test this page

Record the initial state, toggle several non-adjacent groups in a recognisable pattern, navigate away, and refresh. Add two distinct Exotic Weapon names, try blank/whitespace and duplicate names, remove one, and confirm the other and all toggles are unchanged.

- [ ] Each weapon group toggles on/off independently and persists after leaving the tab
- [ ] Adding and removing a custom Exotic Weapon entry works and doesn't affect the toggle list

## 8. Traits

Creature and character Traits, added from the shared reference list. Uses
the exact same picker component as Talents (§6), including specialisation
handling — the same three specialisation checks from §6 apply here for any
trait that has one (e.g. Unnatural Characteristic).

### How to test this page

Use a disposable character. Test ordinary, fixed-choice, numeric, repeatable,
and acquisition-based Traits, refreshing after each group. Keep Characteristics,
Skills, Insanity, Armour, Cybernetics, Talents, and Weapon Training available for
cross-checking permanent effects and their named sources.

- [ ] Add and remove an ordinary Trait; deletion uses the same Delete/Cancel confirmation as Talents
- [ ] In view-only mode, picker rows do not activate; in edit mode, each pressed row alone shows the shared touch feedback
- [ ] Secondary choice screens use a forward arrow to enter and a back arrow to return, preserving the parent picker position
- [ ] Fear uses the four labelled ratings; Size uses Minuscule through Massive; both disappear after one selection
- [ ] Natural Armour accepts digits only and requires 1+; Machine accepts only 1–5; Burrower, Flyer, Hoverer, and Unnatural Senses require a positive whole-number speed/range
- [ ] Unnatural Characteristic groups different Characteristics under one expandable card; repeated copies of the same Characteristic show **Owned: N** and deleting lowers that count by one
- [ ] Add 10+ mixed Traits: two natural-height columns remain aligned without stretched cards, blank gaps, overlap, or clipping
- [ ] Natural Armour and Armour Plating add named Misc AP sources; only the strongest Machine value applies, including Machine granted by The Flesh is Weak
- [ ] Multiple Arms, Labourer Build, Fit For Purpose, Superior Origins, Soul-bound, and Sanctioning changes appear on the affected Characteristic with the Trait named as the source; deletion reverses them
- [ ] Size, Amorphous, Crawler, Quadruped, and Unnatural Speed update movement correctly; Unnatural Agility does not multiply movement; Burrow/Fly/Hover speeds appear as separate modes
- [ ] Wary shows +1 Initiative; relevant Homeworld Traits update Basic/Trained Skill use and modifiers with named Trait sources
- [ ] Soul-bound requires the bound entity and one permanent consequence; test Insanity, blindness, Characteristic loss, and mutation routes, including required rolls/text and deletion reversal
- [ ] Blank Slate requires exactly three Common Lore, Forbidden Lore, Scholastic Lore, or Trade Skills; all three count as Trained and gain +10, and removal restores their independent state
- [ ] Sanctioned Psyker requires one of all 13 source-table results plus the 3d10 age increase; check an Insanity result, both +3 Characteristic results, Reconstructed Skull, Throne Wed/Chem Geld, and Optical Rupture/Common Cybernetic Senses
- [ ] Choosing Imperial Psyker records Sanctioned Psyker as a read-only Career Trait; changing Career removes its derived effects and any Optical Rupture implant without touching independent copies
- [ ] Choosing Tech-Priest shows Mechanicus Implants as a read-only Career Trait and lists all six granted implants on Cybernetics
- [ ] Skin of Iron Rank 1 installs one Common cybernetic; Ranks 3, 5, and 7 each allow a new Common cybernetic or an existing implant upgrade to Good; the card shows **Owned: N/4**, disappears at four, and deleting the latest grant removes/restores only that grant
- [ ] Homeworld Traits appear read-only on Traits. Noble Born records its extra Peer group; Schola records both weapon groups; Mind Cleansed records 3–7 starting Insanity; changing Homeworld removes the old derived effects without removing independent copies
- [ ] Cult Briefing (Culture) collects the selected Homeworld's required choices and grants the same read-only Traits, Talent/Weapon Training effects, and named sources
- [ ] Description popups include the audited details for Burrower, Possession, Soul-bound, Stuff of Nightmares, Unnatural Characteristic, Unnatural Senses, and Mechanicus Implants
- [ ] Opening the Sanctioning side-effect picker shows a Rules button on every result with its full sourcebook effect text, before you've picked one
- [ ] Picking a Sanctioning result shows its name, roll range, and effect text on a Sanctioning Effect card next to Career on Background, and its rules text appears in the Sanctioned Psyker card's Notes on this page, separated into its own "Roll Results" section from the general rules text
- [ ] Add Sanctioned Psyker directly on this page, then separately select Imperial Psyker as Career — only one Sanctioned Psyker card is shown (the career-derived one); changing Career away from Imperial Psyker afterwards brings back the manually-added copy rather than losing it. The same check applies to Machine when both The Flesh is Weak and an independent Machine trait are present
- [ ] With that same manual-plus-career-derived Sanctioned Psyker duplicate present, confirm its Sanctioning side-effect (whatever it rolled — an Insanity Points gain or a Characteristic change) only applies once on Characteristics/Insanity, not twice, even though only one card is visible — this was a real bug (the hidden copy still counted) fixed this session
- [ ] Custom trait creation — Name, Rules Text, and Origin (Custom/2nd Ed) are all required before Add enables; the saved rules text and Origin both actually appear on the character's own card afterwards, not just in the library definition
- [ ] Custom trait creation and publishing — see §21, Custom Item Library
- [ ] Custom trait creation's and every Trait acquisition screen's (Soul-bound, Sanctioning, Blank Slate, etc.) "* Required" hint stays visible once all fields are filled, not just while incomplete

## 9. Weapons

Ranged, Melee, Grenades, and Shields — four sub-categories under one tab,
plus a shared equip-slot system that limits how much can be readied at once.
This page is much bigger than it looks; go through it deliberately.

### How to test this page

Use a disposable character and create a small labelled test inventory: one normal ranged weapon, one Heavy weapon, one one-handed melee weapon, one Two-Handed weapon, one shield, three grenade types, a clip-fed weapon, a loose-ammunition weapon, and a multi-magazine weapon. Record slot use and ammunition before every action. Work through equip limits first, then grenades, firing/reloading, alternate profiles, upgrades, cybernetic links, and finally custom forms. Refresh after each group and cross-check Armour, Archeotech, and Cybernetics where links exist.

**Equip slots (this applies across Ranged, Melee, and Shields together):**
- [ ] You can equip up to 4 slots' worth of gear in total — confirm the app actually stops you at the limit rather than just visually suggesting one
- [ ] A **Heavy**-class ranged weapon takes up 2 slots, not 1 — equipping one leaves only 2 slots for everything else
- [ ] A **Two-Handed** melee weapon likewise takes 2 slots
- [ ] Every other ranged/melee weapon and every shield takes exactly 1 slot
- [ ] Equipping a 5th slot's worth of gear is blocked (or the oldest/another item is unequipped, whichever the app actually does — confirm which, don't assume)
- [ ] Stowing an equipped item frees its slot(s) back up immediately

**Grenades — a separate, independent limit:**
- [ ] Up to 2 *distinct grenade types* can be equipped/readied at once, independent of the weapon slot count above (confirm equipping grenades doesn't consume weapon slots)
- [ ] Quantity of a single grenade type is not capped, only the count of different types readied at once
- [ ] A grenade or mine added via Archeotech counts toward this same 2-type limit
- [ ] Equip a grenade/mine type with quantity above 3 — a second, read-only "stowed" card appears showing the overflow amount (quantity − 3); confirm the two numbers read sensibly together and don't look like the same grenades are being counted twice

**Ranged and Melee:**
- [ ] Add a weapon that tracks ammo by clip (spare clips + partial rounds) and one that tracks loose rounds — both count down correctly on fire/reload
- [ ] Switching the loaded ammo type on a weapon updates its displayed Damage/Special Rules to match that ammo
- [ ] A weapon with an alternate fire profile (e.g. Puritan-14 or Spectre's shotgun mode) shows correct, separate stats for each mode
- [ ] Fitting a weapon upgrade changes the weapon's effective weight/stats where the upgrade says it should, and un-fitting it reverts cleanly
- [ ] A weapon linked to an installed Concealed Weapon Bionic (from Cybernetics) shows that link correctly on its card
- [ ] Integrated Weapons come from their own separate curated list (not "any weapon flagged integrated") — confirm the Integrated Weapon picker only ever offers the weapons actually meant to be mountable, and craftsmanship is chosen at add time same as everything else
- [ ] A weapon granted directly by a cybernetic implant (e.g. a Ballistic Mechadendrite's built-in gun) shows as a distinct, **read-only** pink-bordered card with "Gained From [implant name]" — it has no remove/equip controls of its own and should not consume a weapon slot, its craftsmanship follows the parent implant's

**Shields:**
- [ ] Add and equip a shield — it occupies a slot the same as a one-handed weapon
- [ ] Shields have their own required AP field on the custom form, separate from Damage — this is the shield's block/parry AP, confirm it's not being added into the character's worn Armour AP total anywhere (it shouldn't be, they're unrelated systems)
- [ ] Custom shield creation and publishing — see §21

**Custom weapon/grenade/shield forms (Ranged, Melee, Grenade, Shield each have their own):**
- [ ] Rate of Fire input (Single/Semi-Auto/Full-Auto, e.g. "S/2/–") is parsed and re-displayed correctly for a few different combinations
- [ ] Damage entered as dice notation (e.g. "1d10+3") plus a damage type (I/R/E/X) round-trips correctly, including editing an existing custom weapon and seeing the same values pre-filled
- [ ] Reload entered as an amount + type (e.g. "2 Full") parses and re-displays correctly, and the special-case values ("Full", "Special", "—") all work
- [ ] Custom weapon/grenade/shield creation and publishing — see §21, Custom Item Library
- [ ] Custom weapon/grenade/shield forms' "* Required" hint stays visible once all fields are filled, not just while incomplete

**Watch for:** weapons with a fixed number of internal magazine slots (e.g.
Panoptic, Spectre) — confirm each magazine tracks its own rounds
independently.

## 10. Armour

Worn armour, upgrades, and Force Fields.

### How to test this page

Add the five named armour fixtures and inspect their picker summaries before adding them. After adding, compare every per-location AP value, total weight, value, resistance, and craftsmanship state with the reference data. Fit and remove upgrades, activate fields in sequence, change spare cells, refresh, and then inspect Armour values from another linked page such as Cybernetics. Use a fresh custom item for the publishing lifecycle rather than modifying reference data.

- [ ] Selenite Void Suit, Boarding Armour, Hospitaller Carapace, Sororitas Powered Armour, and Ork Mega Armour all show a real per-location AP breakdown (e.g. "3 (Head 4)"), not an asterisk. Check this on **both** the equipped-piece card and in the "Add Armour" picker list, both surfaces need to show the real breakdown.
- [ ] Fit the Impellor upgrade to a Selenite Void Suit — weight chip becomes 25 kg (20 base + 5), not 20 kg next to a separate "+5"
- [ ] The Impellor upgrade is only offered on the Selenite Void Suit — not on any carapace or power armour piece
- [ ] Hexagramatic Wards is only offered on carapace/power armour, and applying it changes that piece's stated resistances correctly
- [ ] Only one Force Field can be Active at a time — activating a second one deactivates the first
- [ ] Refractor Field shows a Spare Cells counter that goes up/down and persists; Amulet of Warding and Rosarius do not show one
- [ ] Craftsmanship (Poor/Common/Good/Best) is chosen at the moment you add a piece, both for worn armour and Force Fields — confirm the default is Common and cycling afterwards updates AP/weight/value where the rules say it should
- [ ] Custom armour and custom Force Field creation and publishing — see §21
- [ ] Custom armour and Force Field forms' "* Required" hint stays visible once all fields are filled, not just while incomplete

## 11. Cybernetics

Implants, bionics, and the Concealed Weapon Bionic install flow.

### How to test this page

Use a character with enough funds/context to install the Concealed Weapon Bionic at Poor, Common, and Good craftsmanship, recording cost and availability before and after cycling. Add one common-only implant, one Good-only Mechadendrite, and one location-assigned bionic. Refresh after installation, then cross-check granted weapons on Weapons and Toughness contributions on Armour before removing the parent implant.

- [ ] Install a Concealed Weapon Bionic at Good craftsmanship — cost shows 750 Thrones *and* availability shows Rare (not Scarce)
- [ ] Install the same at Poor and Common — cost changes (150 / 300) but availability stays Scarce at both
- [ ] Cycling craftsmanship on an already-installed Concealed Weapon Bionic updates cost and availability together, every time, not just cost
- [ ] Most other implants have **no craftsmanship choice at all** (only Common exists for them) — confirm those don't show a pointless cycle control
- [ ] Mechadendrites specifically are locked to **Good** craftsmanship only, never Common/Poor/Best
- [ ] For the handful of other implants that *do* list Poor/Common/Good text, cycling still only changes cost, not availability — confirm the new availability logic from §11's first item didn't leak onto them
- [ ] A bionic implant assigned a body location shows up as a Toughness Bonus contribution on the relevant Armour location
- [ ] Custom implant form's "* Required" hint stays visible once all fields are filled, not just while incomplete

## 12. Psychic Powers

Minor and Major powers, Talent and Psy Rating selections, read-only Disciplines,
manual linking, filters, and custom power creation.

### How to test this page

Use the same disposable character from Talents. First test with no Psychic
purchase or Psy Rating Talent, then prepare several Minor Psychic Power,
Psychic Power, and Psy Rating selections without spending them.

**Header and read-only status:**

- [ ] Psy Rating has no input on this page and equals the highest owned `Psy Rating N` Talent
- [ ] The Psy Rating information button opens the rules for that exact rating
- [ ] Biomancy, Divination, Pyromancy, Telekinetics, and Telepathy are read-only status chips — tapping them cannot activate or deactivate a Discipline
- [ ] A Discipline introduced by a Psy Rating Talent appears bright; unknown Disciplines are visibly dimmer
- [ ] Minor and Major sections each have a plus button in Edit mode and an eye button in View mode
- [ ] An `Available: N` chip appears below the matching Minor/Major heading only while at least one Talent or Psy Rating selection remains
- [ ] The heading count equals unused Psychic Talent purchases plus unused Psy Rating selections for that section
- [ ] Refresh and confirm Psy Rating, Disciplines, availability, powers, and links remain unchanged

**Add-route menu and navigation:**

- [ ] When matching selections exist, pressing plus first opens a route menu rather than immediately adding a power
- [ ] The route menu shows **Use Minor Psychic Power/Psychic Power selection** only when that matching Talent purchase is available
- [ ] It shows **Use Psy Rating selection** only when that kind of selection is available
- [ ] It always offers **Add independent Minor/Major power**, labelled `No selection used`
- [ ] Talent availability uses the amber chip; Psy Rating availability uses the indigo chip; the independent route uses a neutral chip
- [ ] Each route card has a forward arrow and visible pressed feedback on only the touched card
- [ ] A power picker entered through a route returns to the route menu with a back arrow
- [ ] Discipline and source filters opened with forward arrows return with back arrows
- [ ] A custom form entered from a power picker returns to that picker with Back
- [ ] After returning from any secondary screen, the previous picker retains its search, filters, and scroll position
- [ ] The main picker closes with × only when it was opened directly; secondary screens use Back

**Minor Psychic Power and Psychic Power Talent selections:**

- [ ] Prepare two unused Minor Psychic Power purchases — the Minor heading says Available: 2 and the Talent route says Available: 2
- [ ] Choose the Talent route and add two different Minor powers consecutively without choosing the route again
- [ ] After the first addition, the picker stays open and availability falls to 1
- [ ] After the second addition, the app returns to the route menu, the exhausted Talent route disappears, and no independent power is added accidentally
- [ ] Each linked power has a chip naming **Minor Psychic Power**, while Talents still shows the owned purchase records
- [ ] Repeat with two Psychic Power purchases in Major Powers; each linked power names **Psychic Power**
- [ ] A Minor purchase cannot link a Major power and a Major purchase cannot link a Minor power
- [ ] Delete one linked power using Delete/Cancel confirmation — the power disappears, its Talent purchase remains, and availability returns by one

**Psy Rating selections:**

- [ ] Prepare a Psy Rating grant with several selections — the route shows the full remaining count
- [ ] Choose the Psy Rating route and add powers consecutively until that particular grant is exhausted
- [ ] Every linked power has a chip naming the exact source, for example `Psy Rating 4`, rather than a generic Psy Rating label
- [ ] When the final selection is used, the app returns to the route menu instead of silently entering another route
- [ ] If several Psy Rating Talents were purchased before choosing powers, selections are consumed in purchase order and each power receives the corresponding Talent chip
- [ ] A Major Psy Rating selection only displays powers from the Discipline recorded on that Talent
- [ ] A custom Major power created through that route has its required Discipline fixed to the same value
- [ ] Deleting a linked power releases one selection back to the correct Psy Rating Talent

**Independent powers and manual assignment:**

- [ ] Add an independent power while both other selection types are available — neither availability count changes and the card has no selection-source chip
- [ ] Expand an unlinked power — when compatible selections exist, the appropriate **Use … selection** actions appear
- [ ] Assign it to a Psychic Talent purchase — the correct chip appears and availability falls by one
- [ ] On another unlinked power, use a compatible Psy Rating selection — the exact Psy Rating chip appears and availability falls by one
- [ ] Once a power has either link, the other assignment action is unavailable; one power cannot consume two selections
- [ ] A selection already used by one power cannot be assigned to another power
- [ ] A Major power from the wrong Discipline cannot consume a Discipline-specific Psy Rating selection

**Power picker:**

- [ ] The Minor picker contains only Minor powers, has a Source filter, and does not show an unnecessary Discipline filter
- [ ] The Major picker contains only Major powers and its Discipline and Source filters can be combined
- [ ] Search is case-insensitive and owned power names disappear from the available list
- [ ] Adding an ordinary independent power keeps the picker open so another can be added
- [ ] Press and hold a selectable power card — only that card shows the pressed effect
- [ ] In View mode, search, filters, expansion, and information remain usable, but there is no pressed selection feedback and nothing can be added or linked
- [ ] Power cards show source, Discipline, selection source where applicable, PT, Action, Range, Sustained, and the complete rules text
- [ ] Delete asks for confirmation; Cancel preserves the power and Delete removes only that power

**Custom powers and campaign library:**

- [ ] Attempt to create a custom power while signed out — the app explains that sign-in is required rather than losing the form silently
- [ ] Name is required and rejects an existing reference, character, or campaign power even when only capitalisation or surrounding spaces differ
- [ ] Major Discipline is required unless a Psy Rating route has already fixed it; Minor powers are fixed to Minor
- [ ] PT is required and accepts only a positive whole number
- [ ] Action is required and allows Half Action or Full Action
- [ ] Metres requires a positive whole number; km radius allows a positive value with at most one decimal place; You and Unlimited require no number
- [ ] Sustained Yes/No and Origin Custom/2nd Ed are each required
- [ ] Optional description text saves and reappears in the information popup
- [ ] A valid custom power is added as a campaign draft and remains attached to the character after refresh
- [ ] Edit the custom power — the form is pre-filled and saving updates that character power rather than creating a duplicate
- [ ] Standard reference powers have no Edit control; Custom and 2nd Ed powers have the permitted definition controls
- [ ] As DM, publish a draft, select the published power from the campaign library on another eligible character, update all copies, and archive it; existing character copies remain readable while the archived definition disappears from add pickers

## 13. Gear

General equipment, split into Items and Consumables.

### How to test this page

Add one fixed-price item, one variable-price item, one normal consumable, and Lumenmould. Search with full names, partial names, mixed case, and no-result text in both tabs. Exercise quantities around 0 and through several increments, refresh, then remove the entries. Complete the custom-item lifecycle with a uniquely named disposable item.

- [ ] Items / Consumables tabs both list, add, and remove correctly
- [ ] Consumables carry their own quantity control (e.g. doses of Panimune) — confirm it increments/decrements and doesn't get confused with a plain gear item's lack of quantity
- [ ] Search finds items by partial name in both sections
- [ ] An item with a listed "Varies" price (Cognomen, Forgery Kit) shows a "Cost assigned on add" note directly in the picker list, then prompts for a manually entered cost and rarity before it can actually be added
- [ ] Lumenmould specifically (no fixed listed price) shows the same note and prompt
- [ ] Custom gear and custom consumable creation and publishing — see §21, Custom Item Library
- [ ] Custom gear/consumable forms' "* Required" hint stays visible once all fields are filled, not just while incomplete

## 14. Companions

Pet/companion stat blocks — currently just the Adeptus Arbites Cyber-Mastiff.

### How to test this page

Add the Cyber-Mastiff to a clean character, refresh, expand it, and compare every displayed value with its reference entry. Open each linked rule popup one at a time and record any entry that falls back to missing rules text. Collapse, re-expand, navigate away and back, then remove and refresh.

- [ ] Add the Cyber-Mastiff — full stat block (characteristics, Movement, Wounds, Skills, Talents, Traits, Weapons, Armour, Gear) all display and match the source
- [ ] Expand/collapse on the companion card works
- [ ] Remove the companion — confirm it actually disappears rather than just collapsing
- [ ] Click every individual Skill, Talent, Trait, and Gear entry on the expanded card — each should open a populated rules popup

**Watch for:** those popups work by guessing a reference ID from the entry's
display text (e.g. matching "Armour Plated" to the trait, "IR vision" to a
gear item by substring). It's the kind of thing that can silently show
"No additional rules text is supplied" instead of the real text if the guess
misses — worth actually clicking each one rather than assuming they all
resolve.

## 15. Drugs

Drugs and combat stimulants carried by the character.

### How to test this page

Add and remove a reference drug, then create a uniquely named custom drug. In the custom form, make one field invalid at a time and verify Add remains unavailable; then submit a valid form, refresh, edit/publish through §21, and remove it. Exercise quantity at 0, 1, and a large value.

- [ ] Add/remove from the reference list
- [ ] Custom drug creation — Name, quantity (positive whole number), Origin, Availability, Weight, and Value are all required before Add enables
- [ ] Custom drug creation and publishing — see §21, Custom Item Library
- [ ] Custom drug form's "* Required" hint stays visible once all fields are filled, not just while incomplete

## 16. Experience

XP total, spend history, and the player-proposal / DM-approval workflow.

### How to test this page

Use two signed-in profiles: the owning player on Experience and the DM on Admin. Record Total, itemised advances, `spent`, and Remaining XP before each operation. Submit one proposal for approval and another for rejection; refresh both profiles after resolution. Then reproduce the exact approve-then-manual-advance sequence in **Watch for** and compare the arithmetic line by line.

- [ ] Remaining XP = Total − the sum of every advance's cost across every rank, recalculated correctly as advances are added
- [ ] As a player: submit a spend proposal, confirm it shows as Pending
- [ ] History toggle reveals previously resolved proposals without losing the pending ones

**Watch for:** approving a proposal (on Admin) increments `experience.spent`
directly; adding or removing a manual advance recalculates `experience.spent`
from the sum of every itemised advance plus every already-approved
proposal's cost. These are two different write paths to the same field, so
test the interaction directly: approve a proposal, note the new Remaining
XP, then add or remove any manual advance. Remaining XP should stay
consistent throughout and never jump backward as though the approved
proposal had never happened. Test that exact sequence, in that order.

## 17. Notes

Free-text notes.

### How to test this page

Enter a multi-paragraph fixture containing blank lines, Unicode, emoji, punctuation, and HTML/script-like text. Save by every supported mechanism, navigate away, refresh, and compare the text character-for-character. Open the same character as a read-only viewer and confirm both rendering and the absence of editing controls. Repeat once while offline and reconnect.

- [ ] Text saves and reloads correctly, including line breaks
- [ ] Read-only view (as a non-owner) renders the same text without an editable box

## 18. Background

Identity (Character Name, Player Name), Appearance (Age, Gender, Skin, Hair, Eyes, Height, Weight, Quirks, Description), and Background (Homeworld, Career, Rank, Divination, Background Notes) — the cascading-selection page. On mobile, Appearance and Background are a swipeable tab pair below the fixed Identity section; on desktop they sit side by side.

### How to test this page

Use a fresh character and record the header plus stored Background state before opening the page. Select valid Homeworld/Career/Rank combinations, then deliberately invalidate the cascade by changing each parent. Refresh after every cascade. Inspect the picker metadata and Divination modal, then compare Skills, Traits, Talents, Weapon Training, Characteristics, Insanity, and Cybernetics to confirm the recorded starting benefits. Test the Appearance fields at both a mobile width (swipe/tap between Appearance and Background) and a desktop width (both shown side by side, each of Career/Sanctioning Effect/Rank on its own full-width row).

- [ ] Pick a Homeworld, then a Career it supports, then a Rank — all three stay set
- [ ] Switch to a Homeworld that does *not* support the current Career — Career and Rank both clear automatically
- [ ] Switch Career while a Rank is set — if the current rank name doesn't exist in the new career, it resets to that career's starting rank; if it does exist (e.g. both have "Rank 1"), it's kept
- [ ] The Career picker only ever lists careers the currently-selected Homeworld actually supports
- [ ] Rank picker shows tier, XP level, and path (if the rank branches into named paths) for each rank
- [ ] Divination picker sets the result text and info modal correctly

**Expected:** Homeworld Traits are calculated from the selected Homeworld and
shown as read-only entries on Traits. Their permanent mechanical effects and
grants apply across the relevant pages without saving duplicate Trait entries.
Starting Skills that are merely listed by the Homeworld remain informational;
Trait rules that explicitly change Skill use are applied automatically.

- [ ] Open a brand-new character (freshly created by the DM, never opened before) straight to Background — the character factory sets its internal homeworld to Feral World even though the header's homeworld text starts blank. Confirm what actually displays (blank, or Feral World pre-selected) and that the picker and the header text agree with each other rather than contradicting

- [ ] Player Name is always read-only, shows "Set from the player's account" while unclaimed, and fills in automatically once a player claims the character
- [ ] Age only accepts whole numbers 1 and up — typing 0 or a non-numeric value is rejected outright, no error message, the field just doesn't change
- [ ] Weight only accepts whole numbers 1 and up, same rejection behaviour as Age
- [ ] Height accepts up to 2 decimal places (including values under 1, e.g. 0.85) — a 3rd decimal digit is rejected as you type it
- [ ] Gender: Male/Female set directly; Other opens a sub-step — leaving the name blank stores "Other" as-is, typing a name stores that name instead; re-opening Other on an existing custom value pre-fills the name field
- [ ] Skin/Hair/Eyes pickers list their options alphabetically
- [ ] Picking a Skin/Hair/Eyes option ending in "(any)" (Stained, Dyed, Lenses) opens a follow-up asking what colour/kind — leaving it blank keeps the option as-is (e.g. "Stained (any)"), typing a value combines it (e.g. "Stained (Blue)"); re-picking an already-qualified option pre-fills what was typed before
- [ ] Quirks: add multiple from a searchable, alphabetised list without the picker closing between picks; already-added quirks are excluded from the picker; the added chips display alphabetically regardless of the order they were added in; each has its own remove (×) button
- [ ] Divination's result text wraps across multiple lines instead of being cut off with an ellipsis (matters most on mobile, where it's a full sentence in a narrow card)
- [ ] Gender/Skin/Hair/Eyes boxes are visually compact (smaller height/text) compared to Age/Height/Weight, matching the narrower grid cells they sit in
- [ ] Career, Sanctioning Effect, and Rank each get their own full-width row on desktop — never squeezed into a shared 2-column grid, even when Sanctioning Effect isn't present
- [ ] Selecting Imperial Psyker as Career and completing the Sanctioned Psyker acquisition (rolling 3d10 for the starting age increase) actually adds that roll to Age — the Age field shows the combined total (base + roll), and its info icon shows a "Modifiers" breakdown listing "Sanctioned Psyker: +X"
- [ ] After completing Sanctioned Psyker, click Age to edit it — the input shows the raw base (not the combined total); typing a new base and committing (blur/Enter) re-adds the Sanctioned Psyker roll on top of the new value, so the modifier keeps applying no matter how many times Age is edited afterward
- [ ] The Sanctioning Effect picker's "* Required" hint (when a roll is still needed) stays visible once every field is filled, not just while incomplete

## 19. Archeotech

Rare Archeotech items — some of which are also armour, weapons, shields, or explosives.

### How to test this page

Add one fixture of each type: Armour, Weapon, Grenade/Mine, and plain item. Keep Archeotech open in one browser tab and the linked destination page in another, then equip/stow and change quantities from both sides. Refresh both tabs and verify the same underlying record is shown. Complete one custom draft/publish/archive lifecycle through §21.

- [ ] Add an Archeotech item typed as Armour — confirm it also appears on the Armour tab, and equipping/stowing from either tab stays in sync immediately (this is genuinely the same underlying list on both tabs, not a copy, so it should never need a refresh to agree)
- [ ] Same check for one typed as a Weapon (Weapons tab) and one typed as a Grenade/Mine (counts toward the 2-type grenade limit in §9)
- [ ] A plain (non-armour, non-weapon) Archeotech item behaves like a normal gear-style entry
- [ ] Custom archeotech creation and publishing — see §21, Custom Item Library
- [ ] Custom archeotech form's "* Required" hint stays visible once all fields are filled, not just while incomplete

## 20. Admin (DM only)

DM controls: XP proposal approval, claim log, and access overrides.

### How to test this page

Keep the DM on Admin and the owning player on the same character in a second profile. Submit proposals and ownership/edit changes from their respective screens while observing both sessions live. Refresh after every action and inspect the claim log.

- [ ] Approve a pending proposal from Experience — the player's Remaining XP drops by that amount (then see the Experience §16 Watch for — do this test in combination with adding a manual advance)
- [ ] Reject a pending proposal — Remaining XP is untouched, proposal moves out of Pending
- [ ] Claim log shows the correct owner name (not just a raw ID) for the most recent claim
- [ ] Force Release Ownership actually unclaims the character (owner becomes "None") separately from Toggle Player Edit Permission, which only flips whether the *current* owner can edit — confirm these are doing two different things, not the same thing twice
- [ ] Force Assign To… opens a picker listing every campaign member by resolved first name (falling back to their raw UID for a member with no profile name yet); selecting one immediately assigns the character to them and turns Player Edit Permission on
- [ ] Force Assign To… is disabled when the campaign has no members yet
- [ ] Force-assigning a character that already has a different owner reassigns it directly with no release step in between — confirm the previous owner loses access and the new owner gains it immediately
- [ ] Tab is genuinely invisible/inaccessible to non-DM players

## 21. Custom Item Library

Not a page — a system shared by Gear, Consumables, Drugs, Archeotech,
Weapons (Ranged/Melee/Grenades/Shields), Armour, Force Fields, and Traits.
Any custom item you create goes through the same draft → publish → archive
lifecycle. Test it once, deliberately, rather than trusting it works the
same everywhere it's used.

### How to test this system

Use three profiles: creator/player A, unrelated player B, and the DM. Give at least two characters copies before editing so propagation is measurable. At every lifecycle state, record which profiles can see the definition and which characters hold copies. Refresh all profiles between draft, publish, update, and archive.

- [ ] Create a custom item as a normal player — it starts as **draft**, and only you can see it (log in as a second player/character and confirm they can't)
- [ ] As DM, the same draft item is visible in admin view before publishing
- [ ] DM publishes it — status becomes **published**, and it's now visible to every player in the picker, not just its creator
- [ ] Edit a published item's definition — it should show both a live published version and a pending draft version at once; "Update All Copies" should only appear now, not before the edit
- [ ] Run "Update All Copies" — every character currently holding a copy of that item reflects the edit
- [ ] Archive a published item — it disappears from every character that had a copy of it, not just from the library list
- [ ] Try triggering Publish/Archive/Update twice quickly (double-click) — the button should show its busy state ("Publishing…" etc.) and not fire twice
- [ ] "Update All Copies" on an item that currently has an unpublished draft also publishes that draft as part of the same click — confirm the item's status flips to Published and the "pending draft" state clears, you shouldn't need to press Publish separately first or afterwards
- [ ] A weapon/armour/gear card for a custom item you didn't create shows no edit-definition controls at all unless you're the DM — you can still see and equip/use it, just not edit its underlying definition
- [ ] For a non-repeatable item (e.g. a Trait), once you've added a copy of a specific custom item from the library, that same item no longer appears in the add picker — confirm you can't select it again and end up with two copies of the same one

## 22. Offline & Account Sync

### How to test this system

Use browser network controls or disable the device network, but verify the browser is genuinely offline rather than just slow. Make an edit while offline, reconnect, and confirm it synced. Separately, open the same character in two tabs on one device and confirm an edit in one appears in the other without a refresh.

- [ ] Turn off network connectivity while on any tab — an amber "You are offline" banner appears at the bottom of the screen
- [ ] Make an edit while offline, then reconnect — confirm the edit actually persisted and synced rather than being silently lost
- [ ] Banner disappears automatically once reconnected
- [ ] Open the same character sheet in two browser tabs on the same device at once — Firestore's offline cache is explicitly configured to be shared/multi-tab aware, so an edit in one tab should appear in the other without a manual refresh, and neither tab should silently overwrite the other's unsaved-but-committed change

## 23. PWA Install & Update

The app is installable and self-updates via a service worker — this is
separate machinery from the in-app Offline banner above and worth checking
on an actual installed copy (phone home-screen icon or desktop PWA install),
not just a browser tab.

### How to test this system

Use three environments: a clean browser profile, an already-installed PWA on the old release, and a normal development tab without a service worker. Record the deployed version before each launch. Test normal update, interrupted update, and restart.

- [ ] Fresh install / first-ever load shows the "Loading…" splash, not "Updating…"
- [ ] Ship a new deploy and reopen the installed app — it should briefly show an "Updating…" splash, then land straight in the app with no further reload prompt (the reload happens automatically, not via a "New version available" button)
- [ ] Immediately after that auto-update, the app should skip straight past the splash on that specific load — no double-splash flash
- [ ] Simulate a stalled update (start the update, then kill connectivity before it finishes) — after roughly 30 seconds it should give up waiting and fall back to the previously-cached version rather than hanging on "Updating…" forever, and a "Couldn't download the latest update" toast should appear once it lands
- [ ] In a plain dev/browser tab (no service worker registered) the app should simply load directly with no splash-related hang at all

## 24. Onboarding & First Launch

First-ever launch on a new device/browser profile. The step you're on lives
in the URL (`?step=`), not just component state.

### How to test this page

Use a new disposable browser profile for each path: new user, reclaim, refresh-on-code, and legacy user needing NameGate. Copy the generated recovery code to a secure scratch record and prove it on a second profile. At every step test refresh, Back, and Forward before completing onboarding.

- [ ] Welcome step — "Get Started" stays disabled until a first name is entered; spaces are stripped as you type, not just trimmed on submit
- [ ] Get Started generates and displays a recovery code once — the "Copy code" button must actually be pressed (button label flips to "Copied") before the "I've saved my recovery code" checkbox becomes checkable, and "I've saved my code" stays disabled until both the copy and the checkbox are done
- [ ] Browser Back/Forward moves correctly between Welcome → Show Code and Welcome → Reclaim, matching whichever path you took
- [ ] Refresh the page while sitting on the show-code step — the code is re-fetched from the server rather than lost (it was never only in local state); if no code exists server-side for some reason, it quietly falls back to the Welcome step instead of showing a blank code
- [ ] "Returning user? Reclaim your identity" path — entering a previously-issued recovery code from another device migrates every DM-owned campaign and every player-owned character over to this device's account in one go
- [ ] After onboarding completes once, closing and reopening the app never shows onboarding again — an existing user who was onboarded before first names existed gets sent to the shorter NameGate screen instead (name field only, no recovery code step) rather than back through full onboarding

## 25. Dashboard

The landing page after onboarding — separate DM and Player sections on one screen.

### How to test this page

Use a DM with active and archived campaigns, an owning player with multiple claimed characters, a linked secondary device, and a player-invite-only device. Work through DM actions first, then player cards and claim states. Refresh after every mutation.

**DM section** (hidden entirely on a device installed via the player-only QR invite — see the QR bullet below):
- [ ] Create a campaign; blank/whitespace-only names are rejected
- [ ] Rename a campaign inline; Edit/Save/Cancel all behave
- [ ] Archive a campaign — it moves out of the active list into a collapsed "Archived (N)" disclosure, collapsed by default
- [ ] Restore an archived campaign — it reappears in the active list
- [ ] Delete a campaign (active or archived) — requires literally typing DELETE, and actually removes it rather than just archiving it again
- [ ] The QR "Share App" panel only appears once you have at least one DM campaign, and never appears at all on a device that is itself a linked secondary device
- [ ] "Share full app" and "Share player invite" produce genuinely different URLs (different `?invite=` value) — scanning the player one on a separate fresh device/profile should permanently hide that device's DM section (until the full-app QR is scanned there instead)

**Player section:**
- [ ] Each campaign you belong to lists only characters claimed by you (not every character in the campaign), as cards showing portrait, career/rank, current/total Wounds (red at ≤2), XP remaining (red if negative), and the recovery code
- [ ] Tapping a character card opens that character's sheet directly

**Claim a Character (inline, bottom of the page):**
- [ ] The code field validates the DH-XXXX-XXXX shape before "Look Up Character" enables at all
- [ ] Looking up a valid code shows character name, campaign name, and one of four distinct ownership states: unclaimed (green, claimable) / already yours / claimed by another player / claimed and locked by the DM — confirm the last two show different explanatory text even though both are equally un-claimable right now
- [ ] Claiming an unclaimed character navigates straight to its character sheet afterwards
- [ ] Recovery backup banner appears only under its intended account/device conditions; copying the code works, and rotating the code replaces any stale code shown by the banner

## 26. Campaign Overview

The per-campaign hub — characters, sessions, messages, and (DM only) the
custom item library admin table (§21).

### How to test this page

Use a disposable campaign with at least two players, several characters, one applied session, one unapplied session, messages, and custom items. Exercise character operations and JSON import/export before sessions. Refresh after every mutation and verify the owning player's view as well as the DM's.

- [ ] Character search box filters the character list live, by name substring
- [ ] DM: create a new character — get back a recovery code in a toast that includes a copy button, distinct from the normal toast style
- [ ] DM: Import JSON (header kebab menu) — rejects any file missing `recoveryCode` or `isEditableByPlayer` with an error toast rather than importing a malformed character; a valid import is issued a **fresh** recovery code, it does not reuse whatever was in the file
- [ ] Export JSON from a character sheet's kebab menu (available to the DM or the owning player), then re-import that same file — confirm the re-imported copy gets its own new recovery code rather than colliding with the original's
- [ ] DM: Clone a character — the copy is named "Copy of [original name]", starts unclaimed and edit-locked, and gets its own independent recovery code; editing the clone afterwards must not touch the original
- [ ] DM: Delete a character — confirm the old recovery code genuinely stops resolving anywhere afterwards (claim lookup, reclaim, etc.), not just that the character vanishes from this list
- [ ] Per-character "History" modal lists claim/release/force-assign/force-release events newest-first, with a readable date on each
- [ ] Session History: create a session with a date, XP awarded, a public summary, and private DM-only notes, plus an attendee checklist — XP is **not** applied automatically on save
- [ ] "Apply XP" appears once per session while unapplied; after applying, it becomes a permanent "XP Applied ✓" badge — confirm there's no way to re-apply or undo it from the UI afterwards
- [ ] Edit a session's XP value after it's already been applied — the in-app note says this does *not* retroactively adjust characters' totals; confirm that's actually true (Remaining XP on the affected characters shouldn't move just from editing the session record)
- [ ] Delete a session that has **not** had XP applied — plain Yes/No confirmation, removes it from the list, no XP warning shown
- [ ] Delete a session that **has** had XP applied — shows a warning ("This session's XP was already applied…") and an "Also remove {N} XP from attendees" checkbox instead of the plain confirm
- [ ] Confirm that delete with the checkbox left unchecked — session is removed, every attendee's Remaining XP is unchanged
- [ ] Confirm that delete with the checkbox checked — session is removed **and** every attendee's XP total drops by the session's XP amount
- [ ] Cancel out of that confirm after checking the box, then reopen it — the checkbox starts unchecked again rather than remembering the discarded state

## 27. Messages

A DM ↔ player chat thread per character, reachable from the header, entirely
separate from the 20 character-sheet tabs.

### How to test this page

Open the same character thread as player and DM in separate profiles. Start empty, send messages in both directions, observe unread state without refreshing, then reopen/clear as the DM.

- [ ] The Messages icon in the header appears only while viewing a character sheet (not on Dashboard or Campaign Overview), for both DM and player
- [ ] As a player, opening Messages with no character context (i.e. not on a character sheet) shows a prompt to open a character sheet first rather than an empty/broken drawer
- [ ] As DM, the inbox (inside Campaign Overview, §26) lists every character's thread at once, each with a live unread count and a last-message preview, ordered most-recent-first
- [ ] Sending a message as the player increments the DM's unread badge for that specific character's thread; opening that thread as DM clears its badge back to zero
- [ ] DM "Clear chat" requires literally typing DELETE, permanently deletes every message in that thread, and resets the thread's last-message preview back to empty — confirm there is no way to recover a cleared thread
- [ ] Neither side can edit or delete an individual message once sent — confirm there's genuinely no such control, only the DM's all-or-nothing "Clear chat"
- [ ] A thread with no messages yet shows "No messages yet" rather than a blank gap
- [ ] New messages auto-scroll the thread to the bottom on arrival

## 28. Settings & Device Linking

Reachable only from the header while on the Dashboard route.

### How to test this page

Use a disposable primary account and several linkable secondary profiles. Record every device's original identity and visible data before linking. Exercise reveal, rotate, repeated linking, and unlink, proving old and new codes from fresh profiles after each transition.

- [ ] Reveal Recovery Code — on a device that's never generated one, revealing it creates one on the spot rather than erroring
- [ ] Rotate Code — displays a new code once; the old code should stop working immediately afterwards (try it in a fresh Link/Reclaim attempt to confirm)
- [ ] Link This Device — entering another account's recovery code switches this device onto that account's data; this is a *switch*, not a merge, so confirm you understand which account's campaigns/characters you're looking at afterwards, especially if this device already had its own separate data before linking
- [ ] There is deliberately no limit on how many devices can be linked to one account — linking a 4th, 5th, etc. device should succeed the same as any other
- [ ] Unlink This Device — reverts this device back to its own separate identity; campaigns/characters that only existed on the (now former) primary account disappear from view here afterwards, and this device's own pre-linking data (if any) reappears
- [ ] Recovery backup banner and Settings always show the same current recovery code after reveal or rotation; an old code disappears from all visible surfaces and fails on a fresh device

## 29. Cross-cutting permission boundaries

None of this is a page of its own — it's the access-control logic sitting
underneath almost every button above. A green light in normal single-device
testing doesn't confirm the boundary is actually enforced; these are worth a
deliberate pass, ideally from a second device/browser profile logged in as a
plain player, not just skimmed as the DM.

### How to test this system

Use at least two identities: a plain player who doesn't own the character, and the owning player with editing toggled both on and off by the DM mid-session. Clear local cache between identities so a cached document isn't mistaken for authorised access.

- [ ] A player cannot edit a character they haven't claimed, even via a direct URL to that character's sheet — the page should visibly be read-only, not just "probably won't save"
- [ ] A player can only edit a character that is both (a) owned by them and (b) currently flagged editable by the DM — have the DM flip that flag off while the player still has the sheet open, then have the player try to make an edit: it should fail rather than appear to succeed and quietly not save
- [ ] The DM's own edit access defaults to **read-only** every single time a character sheet is opened, including reopening the exact same character a second time in the same session — confirm "Editing enabled" has to be pressed again each time and this choice is never remembered
- [ ] Releasing a character (player-initiated, from the kebab menu) clears ownership **and** the player-edit-permission flag together — if the DM immediately reassigns/re-enables it for a new claimant, confirm editing was actually off in between, i.e. it doesn't silently carry over from the previous owner
- [ ] Force-releasing a character (DM, from Admin) behaves the same way — ownership and edit permission clear together, not just ownership
- [ ] The claim history log (§26) is append-only — there is no edit or delete control for an individual past entry anywhere in the UI

## 30. Character Sheet Shell, Portrait & Navigation

These behaviours sit around all twenty sheet tabs rather than belonging to one rules page. They cover the portrait pipeline, section drawer, header actions, direct routes, and recovery from missing data.

### How to test this system

Use one editable character and one read-only character. Open the sheet on phone and desktop widths. Work through portrait changes first, then every section-drawer destination, header action, browser navigation, and refresh.

- [ ] Upload every supported portrait format, position/crop at each edge, confirm the saved output is square at the intended 256 px size, then refresh and compare the image in the sheet header, Dashboard card, and Campaign Overview
- [ ] Replace an existing portrait and confirm every visible copy updates; if removal is supported, remove it and confirm the default placeholder returns everywhere without leaving stale cached images
- [ ] Open every one of the twenty sections from the drawer on phone and desktop — the correct title/content becomes active, the drawer closes appropriately, and no prior page's modal or temporary state overlays the new section
- [ ] Keyboard, mouse, touch, and swipe navigation select the same sections without double-activation; rapid navigation never leaves two sections active or saves input to the wrong section
- [ ] Browser Back/Forward and refresh from Dashboard → Campaign → Character → section produce a coherent route and a working way back; pending/invalid form text is either deliberately preserved or deliberately discarded with warning
- [ ] Directly open valid Dashboard, Campaign, Character, onboarding-step, and invite URLs in a new tab and after PWA relaunch — each lands on the intended screen after authentication/onboarding gates complete
- [ ] Header actions appear only on their intended routes and roles; Settings, Messages, export, release, edit-enable, and navigation controls all target the currently visible campaign/character after rapid route changes

---

## Coverage notes

This checklist covers the 20 character-sheet sections, the cross-cutting
systems, and the app-shell pages outside the character sheet. Sections
21–30 cover systems and pages such as Dashboard, Onboarding, Settings,
Campaign Overview, and Messages.

**Character-sheet source review (§1–20):** The reviewed scope includes every
tab component, picker, custom-item form, and the shared hooks and helpers
behind them:
`useCharacterSheet` and its five constituent hooks (`useCharacterPermissions`,
`useCharacterMutations`, `useCharacterData`, `useCharacterHelpers`,
`useDMOverride`), `useSkillComputation`/`useSkillFiltering`/
`useSkillSorting`/`useSkillGroupCollapse`, `useSwipeableTabs`,
`useQuantityEdit`, `useAssignedItemMeta`, all of `WeaponsTab.tsx` end to end
(approximately 1,785 lines, including the handler bodies, slot-counting
logic, and the grenade "stowed beyond 3" split card), `ArmourPicker.tsx` and
`ArmourUpgradePicker.tsx`, `ArcheotechPickerModal.tsx`, and every custom
form (ranged/melee/grenade/shield/armour/gear/consumable). The Insanity and
Corruption review also includes their data-layer implementation:
`characteristicModifiers.ts`, `characteristicModifierTotals.ts`,
`rollModifierValues.ts`, `RollEditor.tsx`/`RollModifierFields.tsx` (the
manual 1d10 modifier flow used by certain Malignancies and Mutations), both
reference pickers, both row components, and the
`corruptionUi.ts`/`insanityUi.ts` timeline/colour logic. `RollChip` is a
static roll-range label rather than an interactive roller; no
manual roll-button test is therefore required.

**App-shell and account-system source review (§23–30):** The reviewed scope
includes `App.tsx` (route shell, auth gate, onboarding gate, NameGate),
`useAuth`, `useDeviceLink`,
`useLinkDevice`, `identityService.ts`, `deviceLinkService.ts`,
`userAccountService.ts`, `profileService.ts`, `Settings.tsx`,
`Onboarding.tsx`, `NameGate.tsx`, `Dashboard.tsx` and all its inline
sub-components, `CampaignOverview.tsx` plus every file under
`pages/CampaignOverview/` (`SessionForm`, `SessionCard`, `CharacterRow`,
`CustomItemLibraryAdmin`, `CustomItemAdminRow`), the `ClaimCharacter/` flow
(`ClaimForm`, `ClaimPreview`, `useRecoveryLookup`, `useClaimActions`),
`characterService.ts`, `campaignService.ts`, `sessionService.ts`,
`recoveryLookupService.ts`, the propagation and removal logic in
`customItemService.ts`, `useCustomItemLibraryActions`,
`MessageDrawer.tsx`, `DMInbox.tsx`, `MessageThread.tsx`, `MessageInput.tsx`,
`messageService.ts`, `useThreads`, `useThreadMessages`, `useClaimLogs`,
`AppHeader.tsx`, `SectionDrawer.tsx`, `RecoveryBackupBanner.tsx`,
`useInstallMode`, `CampaignsContext.tsx`, `useCampaign`, `usePlayerCharacters`,
`useArchivedCampaigns`, `useCampaignCharacters`, `useCharacterSummaries`,
`useXpProposals`, `useUserProfile`, `firestore.rules` in full (622 lines —
the source for the permission-boundary checks in §29), `firebase.ts`
(including explicit multi-tab persistent offline-cache configuration),
`main.tsx`/`pwaUpdateState.ts` (the service-worker install and update flow
behind §23), `PortraitUpload.tsx`/`portraitService.ts` (crop to 256 px and
base64 storage on the character document), the Toast system
(`ToastProvider`/`ToastItem`/`ToastContainer`/`ToastContext`), and the
shared form primitives containing application logic:
`CharacteristicField.tsx`, `FormField.tsx`, `ValidatedNumberInput.tsx`,
`Tooltip.tsx`, plus `validation.ts`, `recoveryCode.ts`, `claimLog.ts`,
`characterFactory.ts`, `weaponUtils.ts`, `stats.ts`, `skillUtils.ts`,
`exportCharacter.ts`, `armourLocations.ts`, `createLocalId.ts`,
`formInput.ts`, and `gameRules.ts`.

**Excluded from this behavioural source review:** The `data/reference/*`
sourcebook files were audited for content correctness during the separate IH
sourcebook review. They contain static data and were not re-reviewed as
behavioural logic for this checklist. The `ui/*` primitives (`Button`,
`Chip`, `PickerModal`, `ModalShell`, `Stepper`,
`StatChip`, `ItemMetaChips`, and the `*Styles.ts`/`colourTokens.ts` files)
are presentation-only wrappers with no independent business logic. Their
behaviour is exercised indirectly through the relevant checklist sections
rather than through separate file-level tests. Type-definition files
(`types/*.ts`) were reviewed alongside the logic that consumes them rather
than as an independent category.

**Separate test scopes:** Accessibility testing, true concurrent-edit race
testing, cross-browser and cross-device compatibility, and tests requiring
direct Firestore/API calls are maintained as separate QA activities rather
than being included in this click-through checklist. Permission boundaries
reachable through the normal UI are covered in §29. Permission paths that
require direct requests are covered by the automated Firestore rules suite
(`npm run test:rules`).
