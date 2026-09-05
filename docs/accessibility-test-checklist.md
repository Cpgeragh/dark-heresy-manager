# Accessibility Test Checklist

Kept separate from `docs/manual-test-checklist.md` deliberately — that
document's own coverage notes carve accessibility testing out as its own
QA activity, since it needs a genuinely different testing mode (screen
reader on, keyboard only) rather than the click-through-and-verify-values
approach the functional checklist is built around.

## How to test this

Three separate passes, each with different tooling:

- **Screen reader pass.** Use a real screen reader (NVDA or VoiceOver, not
  a browser's accessibility-tree inspector alone) and navigate without
  looking at the screen. Confirm every control announces something
  meaningful — a name, a role, and current state where relevant (pressed,
  expanded, selected) — and that toasts/live regions announce sensibly
  without reading out redundant symbols.
- **Keyboard-only pass.** Unplug the mouse. Tab through every interactive
  element on a page in a sensible order, confirm focus is always visible,
  and confirm every modal/drawer traps focus while open and returns it
  sensibly on close.
- **Contrast check.** Use a real contrast-checking tool (browser DevTools'
  own contrast ratio readout, or an extension) against the actual rendered
  colours, not the hex values in source — a semi-transparent background
  layered over another colour doesn't contrast-check the same as either
  colour alone.

## Known issues to specifically verify

Found by reading the source directly, not yet confirmed live — check these
first, they're the most likely places a screen reader will produce
confusing output:

- [ ] `ToastItem.tsx`'s type icon (✓ / ! / ⚠ / ℹ) has no `aria-hidden`, and
      every toast is `role="alert" aria-live="polite"` — confirm whether a
      screen reader announces a raw glyph name before the actual message on
      every single toast in the app. If so, the icon `<div>` needs
      `aria-hidden="true"` added, matching how the same file's own copy
      button icon is already correctly hidden two lines below it.
- [ ] `MyCharacterCard.tsx`'s ❤ (Wounds) and ✦ (XP) glyphs have no
      `aria-hidden` or accessible label — confirm whether a screen reader
      reads a raw Unicode character name in front of the number instead of
      something meaningful like "Wounds" or "XP remaining."
- [ ] `PortraitUpload.tsx`'s uploaded image always uses `alt="Portrait"`
      regardless of which character it belongs to — on a page like
      Campaign Overview or Dashboard showing several characters' portraits
      at once, confirm whether this reads as ambiguous to a screen reader
      user versus naming the character.
- [ ] `ItemMetaChips.tsx`'s weight chip renders `⚖` (`"⚖"`) directly before the weight
      value with no `aria-hidden` — confirm whether a screen reader announces a raw glyph
      name before every weight value shown anywhere in the app (Weapons, Armour, Gear,
      Cybernetics, Drugs, Archeotech, and anywhere else `ItemMetaChips` renders a weight
      chip). If so, the icon `<span>` needs `aria-hidden="true"` added, matching the fix
      already flagged for `ToastItem.tsx`.
- [ ] `PickerModal.tsx`'s search input (the shared search box every "Add X" reference
      picker in the app uses) has no `aria-label` and no associated `<label>`, relying
      only on `placeholder="Search…"` — confirm whether a screen reader announces
      anything meaningful when the field receives focus. If not, add an `aria-label`
      directly on the input.
- [ ] `PlusIcon.tsx`/`TrashIcon.tsx` don't set `aria-hidden="true"`/`focusable="false"` on
      their `<svg>`, unlike `EyeIcon.tsx`/`PickerArrows.tsx`'s arrows, which both do —
      likely harmless everywhere the icon sits inside a button that already has its own
      `aria-label` (`AddButton`, `RemoveButton`, `ViewButton`), but confirm
      `PickerModal.tsx`'s `PickerCustomAction` specifically, where `PlusIcon` sits next
      to visible text inside a button with no `aria-label` of its own.
- [ ] `OfflineIndicator.tsx`'s offline banner has no `role="status"` or `aria-live` —
      confirm whether a screen reader announces anything when connectivity drops,
      given the banner just appears/disappears with no live-region wiring.
- [ ] `ErrorBoundary.tsx`'s `⚠` icon and `RecoveryBackupBanner.tsx`'s `⚠` icon both
      render the glyph as plain inline text with no `aria-hidden` — same pattern as
      `ToastItem.tsx`, confirm whether a screen reader announces a raw glyph name
      before "Something went wrong" / "Back up your recovery code" in either place.
- [ ] `SectionDrawer.tsx` and `MessageDrawer.tsx` (the app's only two drawer surfaces)
      correctly set `role="dialog"`, `aria-modal`, and `inert` when closed, but neither
      moves focus into the drawer on open, traps Tab while it's open, or restores focus
      to the trigger button on close — confirm with a keyboard-only pass whether Tab
      can leave the open drawer into the page behind it, unlike a modal via
      `ModalShell.tsx`'s native `<dialog>`, which gets all three behaviours from the
      browser automatically.
- [ ] `MessageInput.tsx`'s message text field has no `aria-label` or associated
      `<label>`, only `placeholder="Message…"` — confirm whether a screen reader
      announces anything meaningful when the field receives focus.
- [ ] `AppHeader.tsx`'s kebab-menu trigger button has no `aria-expanded`,
      `aria-haspopup`, or `aria-controls` — confirm whether a screen reader user has
      any way to know the button opens a menu, or whether it's currently open.
- [ ] `MessageThread.tsx`'s "Loading messages…" text is a bare `<p>` with no
      `role="status"`, unlike the app's own `LoadingState.tsx` component which already
      has one — minor, but worth a quick check for consistency.
- [ ] `Settings.tsx`'s Display Name input has no `aria-label` or associated `<label>`,
      only `placeholder="e.g. David"`.
- [ ] `CampaignOverview.tsx`'s Search input (DM's character list) and Character Name
      input both rely only on `placeholder` text with no `aria-label`/`<label>`.
- [ ] `CustomItemLibraryAdmin.tsx`'s category and status filter chips communicate the
      selected filter only through colour (`activeChip`/`inactiveChip`), with no
      `aria-pressed` on the underlying button.
- [ ] `SessionForm.tsx` (new session) and `SessionCard.tsx` (edit mode) both have Date,
      XP Awarded, Summary, and DM Notes `<label>` elements with no `htmlFor`, and
      matching inputs with no `id` — none of the four labels in either file are
      actually associated with their field. This is an already-known gap that was
      never added to this checklist until now.

- [ ] `NotesTab.tsx`'s note-search input has no `aria-label` or associated `<label>`,
      only `placeholder="Search notes…"` — same gap as the other search boxes above,
      already has the Android-autofill fix applied but not an accessible name.
- [ ] Recurring pattern across several talent/trait/psychic acquisition screens: a
      `<label>` with no `htmlFor` sits above an `<input>` with no matching `id`, so the
      two are never programmatically associated, only visually adjacent. Confirmed in:
      `TalentAcquisitionModal.tsx` (the Sicarius Tutoring exotic-weapon-name field and
      the Rite of Pure Thought replacement-disorder field are unlabelled entirely,
      placeholder only; the Reformed Skin replacement-item fields have a visible label
      that isn't associated), `talentComponents.tsx`'s manual-cost "XP Cost" field and
      both the numeric and free-text specialisation fields in the picker's detail
      screen, `WeaponTrainingTab.tsx`'s manual-train-cost field and the exotic-weapon
      "Weapon Name"/"XP Cost" fields, and `PsychicTab.tsx`'s `CustomPowerForm` (Name,
      PT, Description all unassociated, plus the Discipline/Action/Range/Sustained
      group labels not connected to the button groups beneath them). Confirm whether a
      screen reader announces anything meaningful when focusing any of these fields —
      if not, each needs a real `id`/`htmlFor` pair (or `aria-label` where there's no
      visible label to associate).
- [ ] Recurring pattern, a second one: several toggle-button groups show which option
      is selected only through colour/border styling, with no `aria-pressed` on the
      buttons. Confirmed in `CustomItemLibraryAdmin.tsx`'s category/status filter chips
      and all four button groups in `PsychicTab.tsx`'s `CustomPowerForm` (Discipline,
      Action, Range mode, Sustained). Confirm whether a screen reader announces
      selection state at all when tabbing through these; if not, each button needs
      `aria-pressed={selected}` to match the pattern already used correctly elsewhere
      in the app (e.g. `CareerStartingChoiceModal.tsx`, `WeaponTrainingTab.tsx`'s own
      weapon-group buttons).

- [ ] `weaponShared.tsx`'s `⚖` weight-modifier glyph (`UpgradeCard`, `UpgradePicker`) has no
      `aria-hidden`, a separate instance of the already-flagged icon bug since it bypasses
      `ItemMetaChips`. Its `WeaponQualitySelector`'s "Qualities" label also isn't
      programmatically connected to the button/input group it describes.
- [ ] `IntegratedWeaponPicker.tsx`, `MeleePicker.tsx`, and `RangedPicker.tsx` all share the
      same "Select weapon craftsmanship" button group (Poor/Common/Good/Best) with no
      `aria-pressed` on any of the buttons — a third location for the missing-toggle-state
      pattern already flagged for `CustomItemLibraryAdmin.tsx` and `PsychicTab.tsx`.
- [ ] `RangedCard.tsx`'s `⚖` glyph appears twice more (ammo-entry weight, magazine weight),
      both raw text with no `aria-hidden`. Separately, its alternate-weapon-profile switcher
      buttons have no `aria-pressed`/`aria-selected`, selection shown by colour only.
- [ ] `MeleeCard.tsx` has the identical alternate-profile switcher gap as `RangedCard.tsx`
      (Melee/Pistol/per-profile buttons), no `aria-pressed`/`aria-selected`.

- [ ] `SkillsTab/AddSkillModal.tsx`'s "XP Cost" field (manual-cost confirmation screen, "Train
      {skill.name}") has a `<label>` with no `htmlFor` sitting above an `<input>` with no matching
      `id` — a further instance of the same unassociated-label pattern already flagged above.
- [ ] `SkillsTab/SkillRow.tsx`'s "XP Cost to upgrade {skill.name} to {nextTierAccess.level}" field
      (DM's manual-upgrade confirmation screen) has the identical unassociated `<label>`/`<input>`
      gap.

- [ ] `InsanityDisorderPicker.tsx` has two separate severity toggle-button groups showing the
      selected option only through colour/border styling, with no `aria-pressed`: the custom-disorder
      form's severity `Chip` group, and the reference-disorder "Choose Severity" screen's button
      group. A further instance of the missing-toggle-state pattern already flagged above.

## Per-section pass

One screen-reader-on + keyboard-only walkthrough per section below,
matching `docs/manual-test-checklist.md`'s own numbering so a finding here
can reference the same section a reader already knows. Sections 22-23 and
29 are lighter-touch (a banner, an install prompt, and cross-cutting logic
with no dedicated screen of its own) — check what's actually visible on
screen for those rather than treating them as full pages. Sections 31-33
are excluded entirely: they're automated/deployment verification, not UI a
person navigates.

- [ ] 1. Vitals
- [ ] 2. Insanity
- [ ] 3. Corruption & Mutations
- [ ] 4. Characteristics
- [ ] 5. Skills
- [ ] 6. Talents
- [ ] 7. Weapon Training
- [ ] 8. Traits
- [ ] 9. Weapons
- [ ] 10. Armour
- [ ] 11. Cybernetics
- [ ] 12. Psychic Powers
- [ ] 13. Gear
- [ ] 14. Companions
- [ ] 15. Drugs
- [ ] 16. Experience
- [ ] 17. Notes
- [ ] 18. Background
- [ ] 19. Archeotech
- [ ] 20. Admin (DM only)
- [ ] 21. Custom Item Library
- [ ] 22. Offline & Account Sync (the offline banner)
- [ ] 23. PWA Install & Update (the splash/update screens)
- [ ] 24. Onboarding & First Launch
- [ ] 25. Dashboard
- [ ] 26. Campaign Overview
- [ ] 27. Messages
- [ ] 28. Settings & Device Linking
- [ ] 29. Cross-cutting permission boundaries (whatever's on screen when a boundary triggers, e.g. a read-only sheet)
- [ ] 30. Character Sheet Shell, Portrait & Navigation
