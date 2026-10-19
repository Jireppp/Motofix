# Motofix — Design System & UI Specification

> **Project Target:** Google Stitch (`projects/12359657743223843691`)  
> **Aesthetic Archetype:** Instrument-Panel Brutalism & Automotive Minimalism  
> **Platform Target:** React Native / Expo (iOS & Android)  
> **Source of Truth:** Motofix Production Codebase (`src/constants/theme.ts`)

---

## 1. Design Direction & Core Philosophy

Motofix is designed as a **dash-mounted diagnostic computer for motorcycles**. It rejects soft pastel gradients, rounded bubble shapes, and generic SaaS templates in favor of **precision, mechanical tactility, and high-contrast telemetry**:
- **High-Contrast Dark Onyx Foundation:** Deep, glare-free dark backgrounds (`#07090C`) suited for high-glare outdoor environments and workshop lighting.
- **Instrument Telemetry & Monospace Precision:** Numbers, odometers, intervals, and dates are rendered in monospace typography to ensure zero layout shifts and maximum readability at a glance.
- **Micro-Tactile Hardware Elements:** Stamped plates, hairline borders (`#262B31`), subtle corner indicators, and mechanical odometer digit counters.
- **Accented Functional Status:** Colors are strictly functional — Electric Racing Blue (`#1449FF`) for active primary actions, Amber Warning (`#E0A526`) for upcoming maintenance thresholds, and Engine Danger Red (`#E23B34`) for overdue parts.

---

## 2. Design Tokens & Variables

### 2.1 Color Palette (Dark Theme / Default)

| Token Name | Hex Value | Semantic Role |
| :--- | :--- | :--- |
| `--color-bg` | `#07090C` | App root background, deep onyx |
| `--color-surface-1` | `#101317` | Card backgrounds, elevated surfaces |
| `--color-surface-2` | `#181C21` | Inner badges, header strips, active containers |
| `--color-surface-3` | `#20252B` | Hover states, selected item backgrounds |
| `--color-surface-4` | `#282E35` | High-elevation overlays, secondary actions |
| `--color-border` | `#262B31` | Standard hairline border (1px) |
| `--color-border-strong` | `#454C55` | Focused borders, active state dividers |
| `--color-primary` | `#1449FF` | Electric Racing Blue — CTA buttons, active tabs |
| `--color-primary-hover` | `#0F39D6` | Pressed CTA button state |
| `--color-primary-container` | `#0E1B4D` | Deep tinted blue backing for active badges |
| `--color-text-primary` | `#EDEFF2` | Crisp silver-white for titles, stats, values |
| `--color-text-secondary` | `#8A919B` | Muted silver for subtitles, labels, metadata |
| `--color-text-tertiary` | `#565C64` | Dim captions, inactive icons, system timestamps |
| `--color-status-success` | `#3FA66B` | Good maintenance status, healthy part |
| `--color-status-warning` | `#E0A526` | Warning threshold (<= 100 km or <= 1 month) |
| `--color-status-danger` | `#E23B34` | Overdue parts (<= 0 km), critical alerts |
| `--color-danger-container` | `#2B1412` | Dark wine background for overdue alert cards |

### 2.2 Color Palette (Light Mode Minimalist)

| Token Name | Hex Value | Semantic Role |
| :--- | :--- | :--- |
| `--color-bg-light` | `#FFFFFF` | Clean white background |
| `--color-surface-1-light`| `#F7F9FC` | Soft off-white cards |
| `--color-surface-2-light`| `#EFF2F5` | Segmented control backing |
| `--color-border-light` | `#EAECEF` | Subtle divider lines |
| `--color-text-primary-light` | `#111418` | High-contrast dark charcoal text |
| `--color-text-secondary-light`| `#4A5568` | Secondary labels |

### 2.3 Typography System

| Style Role | Font Family | Weight | Size | Letter Spacing | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display Header** | `Rajdhani` | 700 (Bold) | 32px – 44px | +2.0px | App Title, Screen Headings, Key Numbers |
| **Telemetry Value**| `IBM Plex Mono` | 700 (Bold) | 20px – 32px | +1.0px | Odometer Readouts, Remaining KM, Costs |
| **Section Label** | `IBM Plex Mono` | 700 (Bold) | 10.5px | +1.6px | Uppercase Section Tags (`IDENTIFIER`, `TARGET UNIT`) |
| **Body Primary** | `IBM Plex Sans` | 400 (Regular)| 15px | 0.0px | Explanatory text, notes, guidelines |
| **Body Bold** | `IBM Plex Sans` | 700 (Bold) | 15px | +0.5px | Button labels, emphasized descriptions |
| **Metadata** | `IBM Plex Mono` | 500 (Medium) | 11px – 13px | +0.8px | Plate numbers, interval stats, dates |

### 2.4 Spacing & Geometry Tokens

- **Grid Spacing:**
  - `xs`: 4px
  - `sm`: 8px
  - `md`: 16px
  - `lg`: 20px
  - `xl`: 24px
  - `xxl`: 40px
- **Corner Radii:**
  - Strict Brutalist: `sm` (3px) / `md` (5px) / `lg` (7px)
  - Interactive Pills: `full` (9999px) used solely for floating action bars and toggle pills
- **Hard Shadows (No Soft Blur):**
  - Stamped Elevation: `offset: (4px, 4px)`, `color: #000000`, `opacity: 0.55`, `radius: 0px`

---

## 3. Screen Specifications & Architecture

### Screen 1: Splash / Ignition Screen (`App.tsx:loading`)
- **Structure:**
  - **Upper-Center Hero Section:**
    - Authentic Motofix Superbike Outline (`assets/splash-icon.png`, 140×90px) in clean white with Cyan Blue hub wheel.
    - App Title: `MOTOFIX` (Rajdhani 700 Bold, 34px, letterSpacing 2.5px, `#EDEFF2`).
    - Subtitle: `MOTORCYCLE MAINTENANCE TRACKER` (IBM Plex Mono, 10px, letterSpacing 2px, `#565C64`).
  - **Bottom Loading Section:**
    - Minimalist 4-digit mechanical odometer counter: `[ 0 ] [ 7 ] [ 4 ] [ % ]`.
    - Box Dimensions: 32×40px per box, border 1px `#262B31`, background `#101317`, borderRadius 4px.
    - Typography: Monospace Bold 15px `#EDEFF2`.
    - Animates from `000%` to `100%` during session check.

### Screen 2: Garage Screen (`GarageScreen.tsx`)
- **Structure:**
  - Top Bar: `Garage // Vehicles` with Theme Selector (Sun/Moon) and Help icon.
  - Guest Mode Notice Banner: Slim banner with amber indicator dot: *"You are using Guest Mode. Sign in with Google to backup your garage."*
  - Table Header: Stamped column labels `UNIT / PLATE`, `ODOMETER`, action trigger.
  - Vehicle Card Rows:
    - Manufacturer brand icon (Honda, Yamaha, Suzuki, Kawasaki, etc. at 24×24px).
    - Bold vehicle name with monospace plate badge below (`B 1234 ABC`).
    - Monospace Odometer stat with subtle `km` unit.
    - Edit button opening the record edit modal.
  - Add Action: Stamped dashed row `+ Register new vehicle`.
  - Floating Minimal Bottom Tab Bar: Pill capsule (`GARAGE` | `WORKSHOP`).

### Screen 3: Telemetry Dashboard (`HomeScreen.tsx`)
- **Structure:**
  - Navigation: `← Back to Garage` top header.
  - Large Telemetry Banner:
    - Vehicle identity (`YAMAHA R15` | `B 4821 XYZ`).
    - Massive Monospace Odometer readout (`14,250 KM`).
    - Quick increment buttons (`+100`, `+500`, `+1,000`).
  - Tab Switcher: `[ TRACKED PARTS ]` vs `[ SERVICE HISTORY ]`.
  - Tracked Parts List:
    - Component title & Category icon.
    - Interval & last service metadata.
    - Big Remaining Distance Readout (`+1,750 km` in white or `-250 km` in engine red).
    - Status Badge: `NORMAL` (dim), `WARNING` (amber), `OVERDUE` (red card with border).
    - Quick Action: `[ REPLACE ]` button opening `ReplacementModal`.

### Screen 4: Add Vehicle Screen (`AddVehicleScreen.tsx`)
- **Structure:**
  - Clean top bar: `Cancel` | `ADD VEHICLE`.
  - Input Fields (Sleek Underline style):
    - `MANUFACTURER`: Modal trigger displaying selected brand emblem and name.
    - `VEHICLE NAME`: Underline text input with character limit (50).
    - `REGISTRATION PLATE`: Monospace uppercase input (e.g. `B 3456 SAA`).
    - `INITIAL ODOMETER`: Monospace integer numeric input with `km` suffix.
  - Bottom Sticky Action: High-contrast pill button `Register Vehicle`.

### Screen 5: Add Sparepart Screen (`AddSparepartScreen.tsx`)
- **Structure:**
  - Target Context: Header badge displaying active vehicle name.
  - Category Filter & Master Catalog Grid:
    - Horizontal category chips (`ENGINE & FLUIDS`, `BRAKES`, `DRIVETRAIN`, `ELECTRICAL`).
    - Catalog items showing default interval recommendation.
  - Custom Component Switch:
    - Allows free-form part naming (`e.g. Kampas Kopling Racing`).
  - Legacy Usage Toggle:
    - "Part is not brand new — record existing mileage already used on this part".
  - Action Button: `[ Track Component ]`.

### Screen 6: Workshop Playbook (`WorkshopScreen.tsx`)
- **Structure:**
  - Magazine Editorial Header:
    - Huge typographic title: `WORKSHOP\n& DIRECTIVE.`
    - Pill Action: `[ Locate Nearby Mechanics ]` with map pin icon (launches Google Maps deep search `bengkel motor terdekat`).
  - Asymmetric Directive Handbook:
    - Left column category label (`ENGINE & FLUIDS`).
    - Right column maintenance playbook cards with icon, recommended interval, description, and tags (`#VITAL`, `#ROUTINE`, `#SAFETY`).

### Screen 7: Operating Manual & Auth (`HelpScreen.tsx`)
- **Structure:**
  - Document Title: `OPERATING MANUAL // REV.01`.
  - Section I: Workflow (Numbered steps 1 to 4).
  - Section II: Critical Notices (Odometer sync requirements, backdating rules).
  - Section III: Cloud Identity & Google Account:
    - Guest Mode indicator with Google Sign-In button (`Sign in with Google`).
    - Authenticated State showing user email and `Log Out` button.

### Screen 8: Modal Components (`ReplacementModal.tsx`)
- **Structure:**
  - Dark backdrop overlay (`rgba(4,5,7,0.85)`).
  - Modal Card with hairline border and close `X` button.
  - Content:
    - Target part name confirmation.
    - `NEW PART BRAND`: Underline input (e.g., `Motul 5100 10W-40`).
    - `EXPENSE / COST`: Currency formatted numeric input (`Rp`).
    - Action buttons: `[ Cancel ]` and `[ Confirm Replacement ]`.
  - Built-in hardware Back Button support (`onRequestClose`).

---

## 4. Design Do's and Don'ts

### ✅ DO
1. **Always use Monospace fonts (`IBM Plex Mono`) for odometer numbers, dates, plate registrations, and currency.**
2. **Preserve the authentic Motofix logo colors:** White superbike with the single cyan circle hub on the rear wheel. Never apply color tints over the logo.
3. **Keep borders hairline thin (1px) with `#262B31`:** The brutalist aesthetic comes from sharp definition, not thick cartoon borders.
4. **Use full uppercase with wide letter spacing (+1.5px to +2.5px) for small system labels and badges.**
5. **Keep negative space generous around telemetry widgets:** Every metric must be readable while wearing riding gloves or checking on the go.

### ❌ DON'T
1. **Do not use neon glow or saturated gradients:** Stick to flat matte surfaces (`#07090C`, `#101317`).
2. **Do not wrap logos in bounding boxes or corner bracket overlays:** Elements should breathe cleanly.
3. **Do not use arbitrary rounded corners:** Only use `3px` / `5px` / `7px` for cards and inputs, and `9999px` strictly for floating pill bars.
4. **Do not introduce bright primary colors for non-interactive elements:** Electric Blue (`#1449FF`) is reserved strictly for interactive CTA actions and active states.
