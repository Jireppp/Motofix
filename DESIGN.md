# FXON — Design System & UI Specification

> **Motto:** *Track the Wear. Master the Ride.*
> **Aesthetic:** Instrument-panel minimalism. Monospace telemetry, hairline dividers, flat matte surfaces.
> **Platform:** React Native / Expo SDK 54 (Android primary, iOS supported)
> **Source of truth:** `src/constants/theme.ts`, `src/contexts/ThemeContext.tsx`, and the screens in `src/screens` and `src/components`. If this document and the code disagree, the code wins.

---

## 1. Design Direction

FXON is a diagnostic dashboard for a motorcycle. Every screen is built from the same few ideas:

- **Typographic, not decorative.** Hierarchy comes from font family, size, and letter-spacing. There are no gradients, no glow, and no illustrations apart from the splash dial and empty-state glyphs.
- **Monospace for data.** Odometer values, intervals, plates, dates, costs, and section labels use IBM Plex Mono so numbers never shift layout.
- **Hairline structure.** Lists are full-bleed rows separated by 1px borders. Cards are used sparingly.
- **Color is functional.** Blue marks interactive or informational emphasis, amber marks a warning, red marks overdue or destructive actions, green marks success.
- **Two themes.** Dark ("onyx") and Light ("clean white"). Both share the same layout and the same primary blue.

---

## 2. Theming

| Item | Behavior |
| :--- | :--- |
| Modes | `system` (default), `light`, `dark` |
| Persistence | `AsyncStorage` key `@theme_mode` |
| Access | `const { colors: COLORS, isDark, mode, setMode } = useTheme()` |
| Switcher | Sun icon in the Garage header opens "Theme Settings" with *System Match / Light Mode / Dark Mode* |
| Status bar | `light` content on dark, `dark` content on light |
| Config | `app.json` sets `userInterfaceStyle: "dark"` for the OS chrome; the in-app theme is controlled by `ThemeContext` |

Screens must call `useTheme()` and build styles through `getStyles(COLORS)`. Do not import the static `COLORS` constant for rendering, because it is dark-only.

---

## 3. Design Tokens

### 3.1 Color — Dark

| Token | Hex | Role |
| :--- | :--- | :--- |
| `bg` | `#07090C` | App background |
| `surface1` | `#101317` | Modals, toast, banners, tab bar |
| `surface2` | `#181C21` | Secondary containers |
| `surface3` | `#20252B` | Selected or pressed backgrounds |
| `surface4` | `#282E35` | High-elevation overlays |
| `overlay` | `rgba(4,5,7,0.8)` | Modal backdrop |
| `border` | `#262B31` | Standard 1px hairline |
| `borderStrong` | `#454C55` | Emphasized dividers, outlined buttons |
| `primary` | `#1449FF` | Links, active accents, spinners |
| `primaryHover` | `#0F39D6` | Pressed primary |
| `primaryContainer` | `#0E1B4D` | Tinted blue backing |
| `textPrimary` | `#EDEFF2` | Titles, values, primary buttons |
| `textSecondary` | `#8A919B` | Body, labels, nav links |
| `textTertiary` | `#565C64` | Captions, placeholders, inactive icons |
| `success` | `#3FA66B` | Healthy or success state |
| `warning` | `#E0A526` | Approaching threshold |
| `danger` | `#E23B34` | Overdue, destructive |
| `dangerContainer` | `#2B1412` | Overdue banner or row tint |

### 3.2 Color — Light

| Token | Hex | Role |
| :--- | :--- | :--- |
| `bg` | `#FFFFFF` | App background |
| `surface1` | `#F7F9FC` | Modals, toast, banners, tab bar |
| `surface2` | `#EFF2F5` | Secondary containers |
| `surface3` | `#E4E7EB` | Selected or pressed backgrounds |
| `surface4` | `#D7DBDF` | High-elevation overlays |
| `overlay` | `rgba(255,255,255,0.85)` | Modal backdrop |
| `border` | `#EAECEF` | Standard 1px hairline |
| `borderStrong` | `#D0D5DB` | Emphasized dividers |
| `primary` | `#1449FF` | Same as dark |
| `primaryContainer` | `#EDF1FF` | Tinted blue backing |
| `textPrimary` | `#111418` | Titles, values, primary buttons |
| `textSecondary` | `#4A5568` | Body, labels |
| `textTertiary` | `#718096` | Captions, placeholders |
| `success` | `#276749` | Success |
| `warning` | `#B7791F` | Warning |
| `danger` | `#9B2C2C` | Overdue, destructive |
| `dangerContainer` | `#FED7D7` | Overdue tint |

### 3.3 Typography

Fonts load in `App.tsx` through `@expo-google-fonts`. Use the `FONT_FAMILY` keys, never raw names.

| Key | Font | Use |
| :--- | :--- | :--- |
| `display` | Rajdhani 700 | Screen titles, vehicle names, part names, empty-state titles, splash wordmark |
| `body` | IBM Plex Sans 400 | Paragraphs, descriptions, banner text |
| `bodyBold` | IBM Plex Sans 700 | Pill button labels, inline emphasis |
| `mono` | IBM Plex Mono 500 | Nav links, labels, inputs, metadata, numbers, small buttons |
| `monoBold` | IBM Plex Mono 700 | Active tab, section tags, theme selection, splash digits |

**Common text styles**

| Role | Font | Size | Spacing | Example |
| :--- | :--- | :--- | :--- | :--- |
| Hero odometer | mono, weight 300 | 64 | -2 | `14,250` + `KM` (16) |
| Screen title (top nav) | mono | 13 | +1 | `ADD VEHICLE`, plate number |
| Page header | mono, uppercase | 14 | +1 | `Garage // Vehicles` |
| Editorial title | display, weight 300 | 44 | -1 | `WORKSHOP & DIRECTIVE.` |
| Document title | display | 32 | -0.5 | `OPERATING MANUAL` |
| List title | display | 16–18 | 0 | Vehicle or part name |
| Row stat | mono, weight 300 | 24 | -1 | Remaining km |
| Section label | mono, uppercase | 10–12 | +1 to +1.6 | `TARGET UNIT`, `SELECT COMPONENT` |
| Input value | mono | 18 | 0 | Underline text inputs |
| Body | body | 13–15 | 0 | Descriptions, line-height 18–24 |
| Small caption | mono | 10–11 | +0.5 to +1 | Plate, `KM LEFT`, timestamps |

### 3.4 Spacing & Shape

- **Spacing scale:** `xs 4`, `sm 8`, `md 16`, `lg 20`, `xl 24`, `xxl 40`.
- **Screen gutter:** 24px horizontal on every screen.
- **Radii in use**
  - Modal cards: `0` (square, bordered).
  - Toast: `4`.
  - Banners and small cards: `3`–`5`.
  - Buttons, odometer form, empty-state card: `8` (empty-state card `12`).
  - Pills (primary CTAs, chips, segmented tabs, bottom tab bar): `100`.
- **Borders:** 1px `border` everywhere. Use `borderStrong` for outlined secondary buttons.
- **Shadows:** flat by default. Only the floating tab bar and the toast carry a soft drop shadow. `SHADOWS.hard` exists in the theme but is not used on current screens.

### 3.5 Interaction

- **Haptics** (`src/utils/haptics.ts`): `light` for navigation taps, `medium` for opening external apps, `selection` for tabs, chips and toggles, `success` after saves, `warning` before or after destructive actions, `error` for failures. All calls are wrapped, so they never throw.
- **Touch targets:** small icon or text buttons use `hitSlop` of 8–20px.
- **Press feedback:** `activeOpacity` 0.6–0.9 depending on emphasis. No ripple or scale animations.
- **Pull to refresh:** Garage and Telemetry lists, tinted with `primary`.

---

## 4. Components

### 4.1 Buttons

| Variant | Appearance | Used for |
| :--- | :--- | :--- |
| **Primary pill** | `textPrimary` fill, `bg` text, radius 100, `bodyBold` 14, vertical padding 14–18 | `Register Vehicle`, `Track Component`, `Locate Nearby Mechanics`, modal `Confirm` |
| **Primary compact** | `textPrimary` fill, `bg` text, radius 8, mono 12 bold | `Replace`, `Save Odometer`, `Track First Part`, `Authenticate with Google` |
| **Overdue replace** | Same as compact but `danger` fill and white text | `Replace` on an overdue part |
| **Secondary outline** | 1px `border` or `borderStrong`, radius 8, mono 12 | `Update Odometer`, `Remove`, `Sign Out`, `Cancel`, `Track Another Part` |
| **Destructive outline** | 1px `danger` at ~38% alpha, `dangerContainer` at ~15% alpha fill, `danger` text | `Delete Account & All Data`, `Wipe Guest Garage Data` |
| **Text action** | No container, mono 13, bracketed like `[ Save Changes ]` | Modal footers, `[ Load Older Entries ]`, `[ Show All Time ]` |
| **Link** | `primary` mono 12, underlined | `Read Privacy Policy ↗` |

Disabled state is `opacity: 0.5` and the `disabled` prop. Loading replaces the label with an `ActivityIndicator`.

### 4.2 Inputs

- **Underline input:** no box, 1px bottom border `border`, mono 18, vertical padding 12. Error turns the border `danger` and shows mono 11 error text below.
- **Label:** mono 11, uppercase, +1 spacing, `textSecondary` (or 10px `textTertiary` inside modals).
- **Select field:** an underline row that opens a picker modal and shows the brand logo + uppercase name.
- **Numeric fields** use `keyboardType="numeric"`; plate inputs use `autoCapitalize="characters"` and `maxLength` 15; vehicle names allow 50 characters.
- **Switch** (`AddSparepartScreen`): track `border` / `textPrimary`, thumb `bg`.

### 4.3 Modals

All modals use RN `Modal` with `transparent`, `animationType="fade"`, and `onRequestClose` so the Android back button closes them.

- Backdrop: `COLORS.overlay`, content vertically centered, 24px padding.
- Card: `surface1`, 1px `border`, **square corners**.
- Header: 24px padding, bottom hairline. Title is mono 13 and often bracketed (`[ Edit Record ]`, `[ Select Manufacturer ]`, `[ Theme Settings ]`). Close is an `X` icon (20px, `textTertiary`).
- Body: 24px padding.
- Footer: top hairline; text actions aligned left (destructive) and right (primary), or right-aligned `Cancel` + pill `Confirm`.

**Existing modals:** `ReplacementModal` (Log Replacement), Garage *Edit Record*, *Select Manufacturer* (Garage and Add Vehicle, the latter with a search field), *Theme Settings*, and the History period picker (two steps: month, then year).

### 4.4 Toast (`ToastContext`)

- Slides down from the top using a spring animation. It auto-dismisses after 3.4s, and a tap or the `X` button dismisses it.
- Card: `surface1`, 1px `border`, radius 4, with a 4px color bar on the left edge.
- Types: `success` (green), `error` (red), `warning` (amber), `info` (blue). Each has a matching Lucide icon.
- Title is mono bold 10 uppercase in the status color; message is body 12.5 in `textPrimary`.
- Usage: `toast.success('…')`, `toast.error('…')`, `toast.warning('…')`, `toast.info('…')`, with an optional second argument for the title.
- Each toast fires a matching haptic.

### 4.5 Confirm Modal (`src/components/ConfirmModal.tsx`)

All destructive confirmations use one themed modal that follows 4.3. The native `Alert.alert` is no longer used.

- Props: `visible`, `title`, `message`, `confirmLabel`, `cancelLabel`, `destructive` (default `true`), `onConfirm`, `onCancel`.
- Header: a `danger` warning icon and mono 13 title in `danger`, plus an `X` close.
- Body: body 14 message in `textSecondary`, then a footer with a text `Cancel` and a pill confirm button. The pill is `danger`-filled with white text when destructive, or `textPrimary`-filled otherwise.
- The Android back button and the `X` both cancel.

| Action | Screen | Title | Confirm label |
| :--- | :--- | :--- | :--- |
| Remove a tracked part | `HomeScreen` | *Remove Tracked Part* | `Remove` |
| Delete a vehicle | `GarageScreen` | *Delete Vehicle* | `Delete` |
| Delete account | `HelpScreen` | *Delete Account & All Data?* | `Delete Permanently` |
| Wipe guest data | `HelpScreen` | *Wipe Guest Garage Data?* | `Wipe Data` |

Each screen fires `haptic.warning()` when opening the modal and reports the result with a toast.

### 4.6 Lists & Rows

- **Vehicle row (Garage):** full-bleed, 16px vertical padding, bottom hairline. Columns: brand logo 24px (40px column), name (display 16) over plate (mono 11), odometer right-aligned (mono 13, 80px column), edit pencil (16px).
- **Table header:** mono 10 uppercase labels `UNIT / PLATE` and `ODOMETER` above the first row.
- **Part row (Telemetry):** 28px part icon tinted by status, title (display 18) with `Int: … km · Last: …` meta (mono 12), large remaining-km number on the right with `KM LEFT` or `KM OVERDUE` under it. Actions row: `Replace` and `Remove`.
- **Overdue row:** bottom border and background tinted with `danger` (alpha), title and number in `danger`.
- **History row:** part name, date · `BRAND // …`, `EXPENSE // Rp …`, odometer at service on the right with `AT SERVICE` caption.
- **Add row:** a bordered ghost row with a `+` icon (`Register new vehicle`, `Track Another Part`).

### 4.7 Status Rules

| Status | Condition | Treatment |
| :--- | :--- | :--- |
| Normal | remaining > 100 km | `textPrimary` number |
| Warning | 0 < remaining ≤ 100 km | `warning` number |
| Overdue | remaining ≤ 0 km | `danger` number, tinted row, red `Replace`, banner on top of the list |

### 4.8 Navigation

- **Top nav:** text-only. `← Back` / `← Back to Garage` / `Cancel` on the left in mono 13 `textSecondary`, centered mono title, and a 40–45px spacer on the right for balance.
- **Bottom tab bar:** only on Garage and Workshop. Floating pill (`surface1`, radius 100, 56px high, `left/right: 15%`) with two mono labels `GARAGE` and `WORKSHOP`. The active label is `monoBold` + `textPrimary` and gets a 24×3 underline. Offset from the bottom is `max(20, inset + 8)`.
- **Segmented pills (Telemetry):** `PARTS` and `LOG`. The active pill is filled `textPrimary` with `bg` text; inactive is outlined.
- **Android hardware back** is handled in `App.tsx` and returns to the previous logical screen. Garage exits the app.

---

## 5. Screens

### 5.1 Splash (`App.tsx` → `loading`)
- Top: 60px app icon, `FXON` in display 38 with +4 spacing, tagline `TRACK THE WEAR. MASTER THE RIDE.` in mono 10.
- Center: 250px speedometer dial (`assets/speedometer-dial.png`) with a blue needle that sweeps to redline, returns to zero, then climbs with a small idle jitter. The digital readout shows `0–160` and `KM / H`.
- Bottom: four odometer boxes (32×40, `surface1`, 1px border, radius 4) showing `000%` → `100%` over about 2.4s.
- Falls through to `ConfigErrorScreen` when Supabase env vars are missing.

### 5.2 Garage (`GarageScreen`)
- Header `Garage // Vehicles` with theme (Sun) and help icons.
- Guest banner (amber dot, one line, chevron) when the session is anonymous. Tapping opens Help.
- Table header, vehicle rows, and the `Register new vehicle` row.
- Empty state: glyph, `0 records found.`, and a subtitle.
- Edit Record modal: `IDENTIFIER`, `MANUFACTURER`, `REGISTRATION`, footer `[ Delete ]` / `[ Save Changes ]`.
- Floating tab bar at the bottom.

### 5.3 Telemetry (`HomeScreen`)
- Top nav with `← Back` and the plate number.
- Header block: vehicle name (display 24, `textSecondary`), hero odometer, `Update Odometer` button. It expands inline to a mono 24 input with `Save Odometer` and `Cancel`; the left border hairline marks the form.
- Overdue banner (`dangerContainer`, alert icon) naming the most critical part.
- Segmented `PARTS | LOG`.
- `PARTS`: part rows, then the `Track Another Part` ghost button. An empty list shows a dashed card with `NO PARTS TRACKED` and `Track First Part`.
- `LOG`: `HistoryTab` — total maintenance cost panel with a period dropdown (`ALL TIME` or `MMM YYYY`), the history rows, and `[ Load Older Entries ]`.
- `ReplacementModal`: `NEW PART BRAND` (required, max 50), `ESTIMATED COST (OPTIONAL)` with an `Rp` prefix, `Cancel` and `Confirm`.

### 5.4 Add Vehicle (`AddVehicleScreen`)
- Top nav `Cancel` / `ADD VEHICLE`.
- Fields: `MANUFACTURER` (picker), `VEHICLE NAME`, `REGISTRATION PLATE`, `CURRENT ODOMETER (KM)`. Errors appear in mono 11 `danger`.
- Sticky bottom bar with a primary pill `Register Vehicle`. It stays disabled until brand, name, and odometer are filled.

### 5.5 Add Part (`AddSparepartScreen`)
- Centered `TARGET UNIT` block (label, vehicle name, odometer).
- `SELECT COMPONENT`: pill chips with an 18px icon, filled with `textPrimary` when selected, plus `OTHER COMPONENT` for custom names.
- `CONFIGURATION`: optional `COMPONENT NAME`, `LIFESPAN INTERVAL (KM)` (100–100,000), and the `PART ALREADY IN USE?` switch that reveals `USAGE SO FAR (KM)`.
- Sticky `Track Component` pill appears once something is selected.

### 5.6 Workshop (`WorkshopScreen`)
- Editorial header `WORKSHOP & DIRECTIVE.` with the pill `Locate Nearby Mechanics` and the caption `Opens external Google Maps application`. It opens a Google Maps search for `bengkel motor terdekat`.
- `Maintenance Playbook`: four categories (Engine & Fluids, Braking System, Drivetrain, Electrical). Each category has a mono label in `primary`, then items with a 32px circular icon, display 20 title, body description, and `#TAG` captions.

### 5.7 Operating Manual & Account (`HelpScreen`)
- Document header `OPERATING MANUAL`.
- `I. WORKFLOW`: four numbered steps.
- `II. NOTICES & REMINDERS`: left-bordered callouts for odometer sync, thresholds, and the weekly reminder toggle (`Enable/Disable 7-Day Reminder`).
- `III. IDENTITY & DATA PRIVACY`: `Read Privacy Policy ↗` link, then either the Guest block (`Authenticate with Google`, `Wipe Guest Garage Data`) or the signed-in block (`Credential Bound` + email, `Sign Out`, `Delete Account & All Data`).

### 5.8 Config Error (`ConfigErrorScreen`)
Developer-facing fallback shown only when environment variables are missing. Corner brackets, a `SYS_ALERT // CONFIG_MISSING` tag, a list of unresolved variables, a two-step fix guide, and a `RECHECK CONFIGURATION` button. It should never appear in a correctly configured production build.

---

## 6. Iconography & Imagery

- **UI icons:** `lucide-react-native`, 13–20px, stroke 1.8–2.2, colored with `textSecondary`/`textTertiary`, or the status color when meaningful.
- **Spare-part glyphs:** transparent WebP in `assets/images/spareparts`, rendered with `tintColor` (status color or `textPrimary`). Selected chips use `bg`.
- **Empty states:** WebP glyphs in `assets/images/icons`, tinted `textTertiary`, opacity ~0.7.
- **Brand logos:** `assets/images/brands`, `*_dark` / `*_light` variants chosen by theme through `getBrandImage`. Logos are shown at 16–24px and never recolored or boxed. They belong to their trademark owners and are used only to identify the vehicle make.
- **App icon:** `assets/icon.png`, `adaptive-icon.png`, and `splash-icon.png` (1024×1024). Adaptive-icon and splash background is `#07090C`; notification accent is `#1449FF`.

---

## 7. Copy & Tone

- UI language is **English** across screens, toasts, dialogs, and notifications.
- Labels are uppercase mono (`ODOMETER`, `TARGET UNIT`). Buttons are sentence-case (`Register Vehicle`, `Track Component`).
- Telemetry vocabulary is deliberate: *Garage // Vehicles*, *Log Replacement*, *Credential Bound*, *KM LEFT / KM OVERDUE*.
- Toasts are short, past-tense confirmations (*"Odometer reading updated."*) or direct errors (*"Failed to remove part."*).
- Notification: *"Keep Riding, Keep Your Odometer Updated"* after 7 days without an update, on the Android channel `FXON — Odometer & Service Reminders`.
- Currency is `Rp` with `id-ID` grouping; distances use `toLocaleString()` with a `km` or `KM` suffix.

---

## 8. Do & Don't

### Do
1. Pull colors, fonts, and spacing from `theme.ts` and `useTheme()`; build styles through `getStyles(COLORS)`.
2. Use IBM Plex Mono for every number, date, plate, cost, and small label.
3. Keep surfaces flat and separate content with 1px hairlines.
4. Use `primary` blue only for links, active accents, spinners, and info toasts. Primary buttons are `textPrimary`-filled.
5. Reserve red for overdue or destructive meaning, and amber for warning.
6. Give every modal an `onRequestClose` handler and a visible `X`.
7. Fire the matching haptic and show a toast for every completed or failed action.
8. Keep the 24px screen gutter and generous vertical spacing, so values stay readable at a glance.

### Don't
1. Don't add gradients, glows, or decorative illustrations.
2. Don't hardcode hex values in screens (the splash needle tip and a few white-on-red labels are the only exceptions).
3. Don't introduce new radii outside `0 / 3–5 / 8 / 100`.
4. Don't wrap brand logos in boxes or tint them.
5. Don't write new UI copy in another language.
6. Don't use `Alert.alert` for confirmations. Use `ConfirmModal` (see 4.5).
7. Don't place a long-lived blocking spinner over content; show inline loaders (`ActivityIndicator` in `primary`).
