# Manual Test Checklist — Complete App

Thirty pages and cross-cutting sections, containing 201 checks. Every item
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
- [ ] Remove a Trauma and a Disorder — list updates immediately, no stale row
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

**Watch for:** the adjustment badge and its info popup are driven entirely
by Corruption entries — this is the other half of the cross-page link from
Corruption & Mutations above.

## 5. Skills

Basic and Advanced skills, grouped by category, with computed totals.

### How to test this page

Choose one flat Basic skill, one grouped Basic specialisation, one flat Advanced skill, and one grouped Advanced specialisation. Record their governing characteristic, calculate trained and untrained totals by hand, then change that characteristic across a tens boundary and add a Corruption modifier. Verify both the main list and picker after every change, including removal and refresh.

- [ ] Basic / Advanced tabs show the right skills in each
- [ ] A category with more than one specialisation (e.g. Common Lore) groups them together under one header, sharing a single characteristic chip; single-skill categories and "General" list flat instead
- [ ] Untrained **Basic** skill total = characteristic ÷ 2, rounded down, and it's visible without adding the skill
- [ ] Untrained **Advanced** skills are hidden until added via the picker — there is no "half stat" fallback for these, they genuinely can't be attempted until trained
- [ ] Level buttons are only ever **Trained / +10 / +20** — there is no +30 tier, and Advanced skills never show an "Untrained" button once opened (only Basic skills do, and only inside the picker's preview)
- [ ] A skill total reacts correctly when its governing characteristic changes, and when a Corruption adjustment touches that characteristic
- [ ] The "add skill" picker groups multi-specialisation categories the same way the main list does, and drilling into a category and picking a specialisation adds only that one

## 6. Talents

Regular Talents and Faith Talents (grouped by Emperor's Mercy / Sign / Wrath).

### How to test this page

Use four known fixtures: a fixed-list specialisation, numeric specialisation, free-text specialisation, and repeatable talent. For each, try to submit with no selection, an invalid selection, and a valid selection. Add, refresh, remove, and add again. Check Faith Talent grouping independently and inspect prerequisite text before committing the addition.

- [ ] Talents / Faith Talents tabs both list, add, and remove correctly
- [ ] Faith Talents land in the correct one of the three groups
- [ ] Add a talent that requires a specialisation from a **fixed list** (e.g. Peer) — you're taken to a sub-screen to pick one, and can't add without picking
- [ ] Add a talent that requires a **numeric** specialisation (bounded min/max) — non-integers and out-of-range values are rejected, the Add button only enables once a valid number is entered
- [ ] Add a talent that requires **free-text** specialisation (e.g. Enemy) — typing something is required before Add enables
- [ ] A **repeatable** talent (one that allows multiple copies with different specialisations) can genuinely be added more than once; a non-repeatable one is correctly hidden from the picker after it's been added
- [ ] Prerequisites text (where present) shows in the picker row before you commit to adding

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

Repeat the fixed-list, numeric, and free-text specialisation procedure from Talents using Traits that support each mode. Add enough traits to force both columns to grow and scroll, then test at narrow, medium, and wide widths. Refresh before removing entries so persistence and layout are both exercised.

- [ ] Add and remove Traits; duplicates blocked by the picker (unless repeatable, see §6)
- [ ] Two-column layout holds up with a long list (10+) without overlapping or clipping

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

## 12. Psychic Powers

Minor and Major powers, by discipline, plus custom power creation.

### How to test this page

Begin with no Psy Rating talent, then add successive Psy Rating talents from Talents and observe this page after each change. Toggle disciplines and prove they do not alter picker eligibility. For the custom form, test every required field independently by leaving only that field invalid, then add a valid power, refresh, edit it, and confirm the same record changes rather than a duplicate appearing.

- [ ] **Psy Rating is not set on this page at all** — it's derived from the highest "Psy Rating N" talent added on the Talents tab (§6). Confirm: add/change that talent, and this page's Psy Rating number and glow update to match, with no direct input field for it here
- [ ] Disciplines (Biomancy, Divination, etc.) are toggled independently as a simple record of what the character knows — confirm toggling them does *not* restrict which powers the picker will show
- [ ] Minor / Major tabs and the discipline filter narrow the picker list correctly
- [ ] Create a custom power — Name (non-duplicate), Discipline, PT (positive whole number), Action (Half/Full), Range (each of the four modes: metres as a whole number, km radius allowing one decimal, "You", "Unlimited"), Sustained (Yes/No), and Origin are all individually required; Add stays disabled until every one is valid
- [ ] Edit an existing custom power — same form, pre-filled, saves in place rather than creating a duplicate
- [ ] The Edit control only ever appears on custom (or "2nd Ed") powers, never on standard reference powers

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

## 16. Experience

XP total, spend history, and the player-proposal / DM-approval workflow.

### How to test this page

Use two signed-in profiles: the owning player on Experience and the DM on Admin. Record Total, itemised advances, `spent`, and Remaining XP before each operation. Submit one proposal for approval and another for rejection; refresh both profiles after resolution. Then reproduce the exact approve-then-manual-advance sequence in **Watch for** and compare the arithmetic line by line.

- [ ] Remaining XP = Total − the sum of every advance's cost across every rank, recalculated correctly as advances are added
- [ ] As a player: submit a spend proposal, confirm it shows as Pending
- [ ] History toggle reveals previously resolved proposals without losing the pending ones

**Watch for — this one's real, not routine:** approving a proposal (on
Admin) increments `experience.spent` directly. Adding or removing a manual
advance here recalculates `experience.spent` from scratch as the sum of every
itemized advance, and overwrites it. These are two different write paths to
the same field. Concretely: approve a proposal, note the new Remaining XP,
then add or remove any manual advance — if Remaining XP jumps back as though
the approved proposal never happened, that's this bug landing. Test that
exact sequence, in that order.

## 17. Notes

Free-text notes.

### How to test this page

Enter a multi-paragraph fixture containing blank lines, Unicode, emoji, punctuation, and HTML/script-like text. Save by every supported mechanism, navigate away, refresh, and compare the text character-for-character. Open the same character as a read-only viewer and confirm both rendering and the absence of editing controls. Repeat once while offline and reconnect.

- [ ] Text saves and reloads correctly, including line breaks
- [ ] Read-only view (as a non-owner) renders the same text without an editable box

## 18. Background

Homeworld, Career, Rank, and Divination — the cascading-selection page.

### How to test this page

Use a fresh character and record the header plus stored Background state before opening the page. Select valid Homeworld/Career/Rank combinations, then deliberately invalidate the cascade by changing each parent. Refresh after every cascade. Inspect the picker metadata and Divination modal, then compare Skills and Traits to confirm whether starting benefits are informational or automatically applied.

- [ ] Pick a Homeworld, then a Career it supports, then a Rank — all three stay set
- [ ] Switch to a Homeworld that does *not* support the current Career — Career and Rank both clear automatically
- [ ] Switch Career while a Rank is set — if the current rank name doesn't exist in the new career, it resets to that career's starting rank; if it does exist (e.g. both have "Rank 1"), it's kept
- [ ] The Career picker only ever lists careers the currently-selected Homeworld actually supports
- [ ] Rank picker shows tier, XP level, and path (if the rank branches into named paths) for each rank
- [ ] Divination picker sets the result text and info modal correctly

**Watch for:** selecting a Homeworld does **not** automatically add its
starting skills or traits anywhere else in the app — the info popup shows
you what you're meant to have (e.g. "Speak Language (Tribal Dialect)" for
Feral World), but nothing adds it to the Skills or Traits tab for you. That
may well be intentional, but it's worth confirming it's not expected to
auto-apply, since Corruption's characteristic modifiers *do* auto-apply
elsewhere in this same app, so the inconsistency is easy to assume is a bug.

- [ ] Open a brand-new character (freshly created by the DM, never opened before) straight to Background — the character factory sets its internal homeworld to Feral World even though the header's homeworld text starts blank. Confirm what actually displays (blank, or Feral World pre-selected) and that the picker and the header text agree with each other rather than contradicting

## 19. Archeotech

Rare Archeotech items — some of which are also armour, weapons, shields, or explosives.

### How to test this page

Add one fixture of each type: Armour, Weapon, Grenade/Mine, and plain item. Keep Archeotech open in one browser tab and the linked destination page in another, then equip/stow and change quantities from both sides. Refresh both tabs and verify the same underlying record is shown. Complete one custom draft/publish/archive lifecycle through §21.

- [ ] Add an Archeotech item typed as Armour — confirm it also appears on the Armour tab, and equipping/stowing from either tab stays in sync immediately (this is genuinely the same underlying list on both tabs, not a copy, so it should never need a refresh to agree)
- [ ] Same check for one typed as a Weapon (Weapons tab) and one typed as a Grenade/Mine (counts toward the 2-type grenade limit in §9)
- [ ] A plain (non-armour, non-weapon) Archeotech item behaves like a normal gear-style entry
- [ ] Custom archeotech creation and publishing — see §21, Custom Item Library

## 20. Admin (DM only)

DM controls: XP proposal approval, claim log, and access overrides.

### How to test this page

Keep the DM on Admin and the owning player on the same character in a second profile. Submit proposals and ownership/edit changes from their respective screens while observing both sessions live. Refresh after every action and inspect the claim log.

- [ ] Approve a pending proposal from Experience — the player's Remaining XP drops by that amount (then see the Experience §16 Watch for — do this test in combination with adding a manual advance)
- [ ] Reject a pending proposal — Remaining XP is untouched, proposal moves out of Pending
- [ ] Claim log shows the correct owner name (not just a raw ID) for the most recent claim
- [ ] Force Release Ownership actually unclaims the character (owner becomes "None") separately from Toggle Player Edit Permission, which only flips whether the *current* owner can edit — confirm these are doing two different things, not the same thing twice
- [ ] Tab is genuinely invisible/inaccessible to non-DM players

## 21. Custom Item Library

Not a page — a system shared by Gear, Consumables, Drugs, Archeotech,
Weapons (Ranged/Melee/Grenades/Shields), Armour, and Force Fields. Any
custom item you create goes through the same draft → publish → archive
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
- [ ] Delete a session — requires confirmation, removes it from the list

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
`useXpProposals`, `useUserProfile`, `firestore.rules` in full (617 lines —
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
