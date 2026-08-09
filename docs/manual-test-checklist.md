# Manual Test Checklist — Character Sheet

Twenty pages plus cross-cutting systems, one at a time. Every item comes
from reading the actual logic, not a generic "does it load" pass. Check
items off as you verify them; anything under **Watch for** is the likeliest
place a real bug hides. Coverage notes are at the bottom — read those before
assuming this is literally every file.

## 1. Vitals

Wounds and Fate Points — the combat-status header block.

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

- [ ] Basic / Advanced tabs show the right skills in each
- [ ] A category with more than one specialisation (e.g. Common Lore) groups them together under one header, sharing a single characteristic chip; single-skill categories and "General" list flat instead
- [ ] Untrained **Basic** skill total = characteristic ÷ 2, rounded down, and it's visible without adding the skill
- [ ] Untrained **Advanced** skills are hidden until added via the picker — there is no "half stat" fallback for these, they genuinely can't be attempted until trained
- [ ] Level buttons are only ever **Trained / +10 / +20** — there is no +30 tier, and Advanced skills never show an "Untrained" button once opened (only Basic skills do, and only inside the picker's preview)
- [ ] A skill total reacts correctly when its governing characteristic changes, and when a Corruption adjustment touches that characteristic
- [ ] The "add skill" picker groups multi-specialisation categories the same way the main list does, and drilling into a category and picking a specialisation adds only that one

## 6. Talents

Regular Talents and Faith Talents (grouped by Emperor's Mercy / Sign / Wrath).

- [ ] Talents / Faith Talents tabs both list, add, and remove correctly
- [ ] Faith Talents land in the correct one of the three groups
- [ ] Add a talent that requires a specialisation from a **fixed list** (e.g. Peer) — you're taken to a sub-screen to pick one, and can't add without picking
- [ ] Add a talent that requires a **numeric** specialisation (bounded min/max) — non-integers and out-of-range values are rejected, the Add button only enables once a valid number is entered
- [ ] Add a talent that requires **free-text** specialisation (e.g. Enemy) — typing something is required before Add enables
- [ ] A **repeatable** talent (one that allows multiple copies with different specialisations) can genuinely be added more than once; a non-repeatable one is correctly hidden from the picker after it's been added
- [ ] Prerequisites text (where present) shows in the picker row before you commit to adding

## 7. Weapon Training

Weapon-group training toggles plus a free-text Exotic Weapon list.

- [ ] Each weapon group toggles on/off independently and persists after leaving the tab
- [ ] Adding and removing a custom Exotic Weapon entry works and doesn't affect the toggle list

## 8. Traits

Creature and character Traits, added from the shared reference list. Uses
the exact same picker component as Talents (§6), including specialisation
handling — the same three specialisation checks from §6 apply here for any
trait that has one (e.g. Unnatural Characteristic).

- [ ] Add and remove Traits; duplicates blocked by the picker (unless repeatable, see §6)
- [ ] Two-column layout holds up with a long list (10+) without overlapping or clipping

## 9. Weapons

Ranged, Melee, Grenades, and Shields — four sub-categories under one tab,
plus a shared equip-slot system that limits how much can be readied at once.
This page is much bigger than it looks; go through it deliberately.

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

- [ ] Install a Concealed Weapon Bionic at Good craftsmanship — cost shows 750 Thrones *and* availability shows Rare (not Scarce)
- [ ] Install the same at Poor and Common — cost changes (150 / 300) but availability stays Scarce at both
- [ ] Cycling craftsmanship on an already-installed Concealed Weapon Bionic updates cost and availability together, every time, not just cost
- [ ] Most other implants have **no craftsmanship choice at all** (only Common exists for them) — confirm those don't show a pointless cycle control
- [ ] Mechadendrites specifically are locked to **Good** craftsmanship only, never Common/Poor/Best
- [ ] For the handful of other implants that *do* list Poor/Common/Good text, cycling still only changes cost, not availability — confirm the new availability logic from §11's first item didn't leak onto them
- [ ] A bionic implant assigned a body location shows up as a Toughness Bonus contribution on the relevant Armour location

## 12. Psychic Powers

Minor and Major powers, by discipline, plus custom power creation.

- [ ] **Psy Rating is not set on this page at all** — it's derived from the highest "Psy Rating N" talent added on the Talents tab (§6). Confirm: add/change that talent, and this page's Psy Rating number and glow update to match, with no direct input field for it here
- [ ] Disciplines (Biomancy, Divination, etc.) are toggled independently as a simple record of what the character knows — confirm toggling them does *not* restrict which powers the picker will show
- [ ] Minor / Major tabs and the discipline filter narrow the picker list correctly
- [ ] Create a custom power — Name (non-duplicate), Discipline, PT (positive whole number), Action (Half/Full), Range (each of the four modes: metres as a whole number, km radius allowing one decimal, "You", "Unlimited"), Sustained (Yes/No), and Origin are all individually required; Add stays disabled until every one is valid
- [ ] Edit an existing custom power — same form, pre-filled, saves in place rather than creating a duplicate
- [ ] The Edit control only ever appears on custom (or "2nd Ed") powers, never on standard reference powers

## 13. Gear

General equipment, split into Items and Consumables.

- [ ] Items / Consumables tabs both list, add, and remove correctly
- [ ] Consumables carry their own quantity control (e.g. doses of Panimune) — confirm it increments/decrements and doesn't get confused with a plain gear item's lack of quantity
- [ ] Search finds items by partial name in both sections
- [ ] An item with a listed "Varies" price (Cognomen, Forgery Kit) shows a "Cost assigned on add" note directly in the picker list, then prompts for a manually entered cost and rarity before it can actually be added
- [ ] Lumenmould specifically (no fixed listed price) shows the same note and prompt
- [ ] Custom gear and custom consumable creation and publishing — see §21, Custom Item Library

## 14. Companions

Pet/companion stat blocks — currently just the Adeptus Arbites Cyber-Mastiff.

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

- [ ] Add/remove from the reference list
- [ ] Custom drug creation — Name, quantity (positive whole number), Origin, Availability, Weight, and Value are all required before Add enables
- [ ] Custom drug creation and publishing — see §21, Custom Item Library

## 16. Experience

XP total, spend history, and the player-proposal / DM-approval workflow.

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

- [ ] Text saves and reloads correctly, including line breaks
- [ ] Read-only view (as a non-owner) renders the same text without an editable box

## 18. Background

Homeworld, Career, Rank, and Divination — the cascading-selection page.

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

- [ ] Add an Archeotech item typed as Armour — confirm it also appears on the Armour tab, and equipping/stowing from either tab stays in sync immediately (this is genuinely the same underlying list on both tabs, not a copy, so it should never need a refresh to agree)
- [ ] Same check for one typed as a Weapon (Weapons tab) and one typed as a Grenade/Mine (counts toward the 2-type grenade limit in §9)
- [ ] A plain (non-armour, non-weapon) Archeotech item behaves like a normal gear-style entry
- [ ] Custom archeotech creation and publishing — see §21, Custom Item Library

## 20. Admin (DM only)

DM controls: XP proposal approval, claim log, and access overrides.

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

- [ ] Turn off network connectivity while on any tab — an amber "You are offline" banner appears at the bottom of the screen
- [ ] Make an edit while offline, then reconnect — confirm the edit actually persisted and synced rather than being silently lost
- [ ] Banner disappears automatically once reconnected
- [ ] Open the same character sheet in two browser tabs on the same device at once — Firestore's offline cache is explicitly configured to be shared/multi-tab aware, so an edit in one tab should appear in the other without a manual refresh, and neither tab should silently overwrite the other's unsaved-but-committed change

## 23. PWA Install & Update

The app is installable and self-updates via a service worker — this is
separate machinery from the in-app Offline banner above and worth checking
on an actual installed copy (phone home-screen icon or desktop PWA install),
not just a browser tab.

- [ ] Fresh install / first-ever load shows the "Loading…" splash, not "Updating…"
- [ ] Ship a new deploy and reopen the installed app — it should briefly show an "Updating…" splash, then land straight in the app with no further reload prompt (the reload happens automatically, not via a "New version available" button)
- [ ] Immediately after that auto-update, the app should skip straight past the splash on that specific load — no double-splash flash
- [ ] Simulate a stalled update (start the update, then kill connectivity before it finishes) — after roughly 30 seconds it should give up waiting and fall back to the previously-cached version rather than hanging on "Updating…" forever, and a "Couldn't download the latest update" toast should appear once it lands
- [ ] In a plain dev/browser tab (no service worker registered) the app should simply load directly with no splash-related hang at all

## 24. Onboarding & First Launch

First-ever launch on a new device/browser profile. The step you're on lives
in the URL (`?step=`), not just component state.

- [ ] Welcome step — "Get Started" stays disabled until a first name is entered; spaces are stripped as you type, not just trimmed on submit
- [ ] Get Started generates and displays a recovery code once — the "Copy code" button must actually be pressed (button label flips to "Copied") before the "I've saved my recovery code" checkbox becomes checkable, and "I've saved my code" stays disabled until both the copy and the checkbox are done
- [ ] Browser Back/Forward moves correctly between Welcome → Show Code and Welcome → Reclaim, matching whichever path you took
- [ ] Refresh the page while sitting on the show-code step — the code is re-fetched from the server rather than lost (it was never only in local state); if no code exists server-side for some reason, it quietly falls back to the Welcome step instead of showing a blank code
- [ ] "Returning user? Reclaim your identity" path — entering a previously-issued recovery code from another device migrates every DM-owned campaign and every player-owned character over to this device's account in one go
- [ ] After onboarding completes once, closing and reopening the app never shows onboarding again — an existing user who was onboarded before first names existed gets sent to the shorter NameGate screen instead (name field only, no recovery code step) rather than back through full onboarding

## 25. Dashboard

The landing page after onboarding — separate DM and Player sections on one screen.

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

## 26. Campaign Overview

The per-campaign hub — characters, sessions, messages, and (DM only) the
custom item library admin table (§21).

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

- [ ] Reveal Recovery Code — on a device that's never generated one, revealing it creates one on the spot rather than erroring
- [ ] Rotate Code — displays a new code once; the old code should stop working immediately afterwards (try it in a fresh Link/Reclaim attempt to confirm)
- [ ] Link This Device — entering another account's recovery code switches this device onto that account's data; this is a *switch*, not a merge, so confirm you understand which account's campaigns/characters you're looking at afterwards, especially if this device already had its own separate data before linking
- [ ] A 4th device attempting to link to an account that already has 3 linked devices is rejected with a clear error — the cap is exactly 3
- [ ] Unlink This Device — reverts this device back to its own separate identity; campaigns/characters that only existed on the (now former) primary account disappear from view here afterwards, and this device's own pre-linking data (if any) reappears

## 29. Cross-cutting permission boundaries

None of this is a page of its own — it's the access-control logic sitting
underneath almost every button above. A green light in normal single-device
testing doesn't confirm the boundary is actually enforced; these are worth a
deliberate pass, ideally from a second device/browser profile logged in as a
plain player, not just skimmed as the DM.

- [ ] A player cannot edit a character they haven't claimed, even via a direct URL to that character's sheet — the page should visibly be read-only, not just "probably won't save"
- [ ] A player can only edit a character that is both (a) owned by them and (b) currently flagged editable by the DM — have the DM flip that flag off while the player still has the sheet open, then have the player try to make an edit: it should fail rather than appear to succeed and quietly not save
- [ ] The DM's own edit access defaults to **read-only** every single time a character sheet is opened, including reopening the exact same character a second time in the same session — confirm "Editing enabled" has to be pressed again each time and this choice is never remembered
- [ ] Releasing a character (player-initiated, from the kebab menu) clears ownership **and** the player-edit-permission flag together — if the DM immediately reassigns/re-enables it for a new claimant, confirm editing was actually off in between, i.e. it doesn't silently carry over from the previous owner
- [ ] Force-releasing a character (DM, from Admin) behaves the same way — ownership and edit permission clear together, not just ownership
- [ ] The claim history log (§26) is append-only — there is no edit or delete control for an individual past entry anywhere in the UI

---

## Coverage notes

This checklist now covers the whole app, not just the 20 character-sheet
tabs the title names — sections 21–29 are cross-cutting systems and the
app-shell pages (Dashboard, Onboarding, Settings, Campaign Overview,
Messages) that sit outside the character sheet entirely. Everything below
was read in full, not sampled.

**Character sheet (§1–20):** every tab component, every picker it opens,
every custom-item form, and the shared hooks/helpers behind them —
`useCharacterSheet` and its five constituent hooks (`useCharacterPermissions`,
`useCharacterMutations`, `useCharacterData`, `useCharacterHelpers`,
`useDMOverride`), `useSkillComputation`/`useSkillFiltering`/
`useSkillSorting`/`useSkillGroupCollapse`, `useSwipeableTabs`,
`useQuantityEdit`, `useAssignedItemMeta`, all of `WeaponsTab.tsx` end to end
(~1785 lines, including every handler body, the slot-counting math, and the
grenade "stowed beyond 3" split card), `ArmourPicker.tsx` and
`ArmourUpgradePicker.tsx`, `ArcheotechPickerModal.tsx`, and every custom
form (ranged/melee/grenade/shield/armour/gear/consumable). The Insanity and
Corruption features were read down to their data layer:
`characteristicModifiers.ts`, `characteristicModifierTotals.ts`,
`rollModifierValues.ts`, `RollEditor.tsx`/`RollModifierFields.tsx` (the
manual 1d10-roll-for-modifier flow on certain Malignancies/Mutations — the
player types in a physically-rolled 1–10 value, the app doesn't roll it for
them), both reference pickers, both row components, and the
`corruptionUi.ts`/`insanityUi.ts` timeline/colour logic. `RollChip` turned
out to be a static styled label (a roll-range display), not an interactive
roller — worth knowing so nobody goes looking for a "roll" button that
doesn't exist.

**App shell & account system (new this pass, §23–29):** `App.tsx` (route
shell, auth gate, onboarding gate, NameGate), `useAuth`, `useDeviceLink`,
`useLinkDevice`, `identityService.ts`, `deviceLinkService.ts`,
`userAccountService.ts`, `profileService.ts`, `Settings.tsx`,
`Onboarding.tsx`, `NameGate.tsx`, `Dashboard.tsx` and all its inline
sub-components, `CampaignOverview.tsx` plus every file under
`pages/CampaignOverview/` (`SessionForm`, `SessionCard`, `CharacterRow`,
`CustomItemLibraryAdmin`, `CustomItemAdminRow`), the `ClaimCharacter/` flow
(`ClaimForm`, `ClaimPreview`, `useRecoveryLookup`, `useClaimActions`),
`characterService.ts`, `campaignService.ts`, `sessionService.ts`,
`recoveryLookupService.ts` in full, `customItemService.ts` end to end this
time (previously only its data model was read — the propagation/removal
logic for custom items is now fully covered), `useCustomItemLibraryActions`,
`MessageDrawer.tsx`, `DMInbox.tsx`, `MessageThread.tsx`, `MessageInput.tsx`,
`messageService.ts`, `useThreads`, `useThreadMessages`, `useClaimLogs`,
`AppHeader.tsx`, `SectionDrawer.tsx`, `RecoveryBackupBanner.tsx`,
`useInstallMode`, `CampaignsContext.tsx`, `useCampaign`, `usePlayerCharacters`,
`useArchivedCampaigns`, `useCampaignCharacters`, `useCharacterSummaries`,
`useXpProposals`, `useUserProfile`, `firestore.rules` in full (617 lines —
this is where §29's permission-boundary items came from), `firebase.ts`
(confirms multi-tab persistent offline cache is explicitly configured, not
incidental), `main.tsx`/`pwaUpdateState.ts` (the service-worker
install/update flow behind §23), `PortraitUpload.tsx`/`portraitService.ts`
(crop-to-256px-then-base64, stored directly on the character document —
there's no separate file storage bucket involved despite `getStorage` being
initialised in `firebase.ts`), the Toast system in full
(`ToastProvider`/`ToastItem`/`ToastContainer`/`ToastContext`), and the
smaller shared form primitives with actual logic in them —
`CharacteristicField.tsx`, `FormField.tsx`, `ValidatedNumberInput.tsx`,
`Tooltip.tsx`, plus `validation.ts`, `recoveryCode.ts`, `claimLog.ts`,
`characterFactory.ts`, `weaponUtils.ts`, `stats.ts`, `skillUtils.ts`,
`exportCharacter.ts`, `armourLocations.ts`, `createLocalId.ts`,
`formInput.ts`, and `gameRules.ts`.

**Deliberately not covered, and why that's fine:** the `data/reference/*`
sourcebook files were exhaustively audited for content correctness in the
earlier IH sourcebook pass (a separate exercise from this one) rather than
re-read here for behaviour, since they're static data, not logic. The
`ui/*` primitives (`Button`, `Chip`, `PickerModal`, `ModalShell`, `Stepper`,
`StatChip`, `ItemMetaChips`, and the `*Styles.ts`/`colourTokens.ts` files)
are presentation-only wrappers with no independent business logic — they've
been exercised indirectly through literally every section above rather than
read file-by-file. Type-definition files (`types/*.ts`) were consulted
inline while reading the logic that uses them rather than read standalone.

**One loose end worth flagging rather than silently dropping:**
`forceAssignCharacter` (assign a character straight to a specific target
account) exists fully wired from `characterService.ts` up through
`useCharacterMutations`/`useCharacterSheet` as `dmForceAssign`, but
`CharacterSheet.tsx` never actually passes it to `AdminTab` — there is no
button anywhere in the UI that calls it. Nothing to manually test here since
it's unreachable, but it's either a feature that was never finished or one
that's meant to have been removed; worth a decision either way rather than
leaving it as dead code that quietly bit-rots.

**Genuinely out of scope for a checklist like this, not just skipped:**
accessibility (screen readers, keyboard-only navigation) and true
concurrent-edit races (two devices editing the same character field within
the same second) are different categories of testing entirely — call them
out separately if you want them covered, they were not folded silently into
"done" here.
