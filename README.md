# FXON — Precision Motorcycle Telemetry & Wear Tracking

<div align="center">

![FXON Banner](assets/splash-icon.png)

**An engineering-grade, 100% odometer-driven motorcycle maintenance telemetry application built with React Native, Expo SDK 54, TypeScript, and Supabase.**

[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2054-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Platforms](https://img.shields.io/badge/Platforms-Android%20%7C%20iOS-4E86E4?style=for-the-badge)](https://expo.dev/)

</div>

---

## 📌 Overview

**FXON** (formerly Motofix) is a high-precision digital cockpit designed to eliminate guesswork from motorcycle ownership. Built with an **Instrument-Panel Brutalism** design language, FXON connects real-world physical odometer readings directly to component wear lifecycles—delivering real-time service countdowns, financial maintenance telemetry, proactive weekly reminder notifications, and an immutable service logbook.

The application operates on a **100% Pure Odometer-Driven Telemetry** architecture, deliberately omitting arbitrary calendar decay approximations to reflect true mechanical mileage.

---

## ✨ Key Features & Architectural Highlights

### 1. 100% Pure Odometer Telemetry Engine
- **Direct Physical Sync:** Remaining component life is computed strictly from the delta between your active odometer and the last recorded replacement:
  $$\text{Remaining KM} = \text{Interval KM} - (\text{Current Odo} - \text{Last Service Odo})$$
- **Granular Wear States:**
  - `OPTIMAL / OK`: Normal operating window (> 100 KM remaining).
  - `WARNING`: Approaching replacement threshold (≤ 100 KM remaining).
  - `OVERDUE`: Exceeded threshold (displayed with exact negative mileage overrun).
- **Strict Monotonicity:** Enforces forward-only odometer updates to maintain cryptographic integrity of wear cycles.

### 2. Multi-Vehicle Fleet Garage (`GarageScreen`)
- Register and track multiple motorcycles simultaneously (Honda, Yamaha, Suzuki, Kawasaki, Vespa, TVS, and custom brands).
- Per-vehicle telemetry dashboards, custom part naming stored directly per vehicle ownership (`vehicle_sparepart.custom_name`), and automatic active vehicle reset handling upon bike deletion.

### 3. Dynamic Service Logbook & Cost Analytics (`HistoryTab`)
- **Interactive 2-Step Date Filter:** Single dropdown trigger with a clean 2-step modal (Step 1: Select Month / All Time, Step 2: Select Dynamic Year). Zero hardcoding.
- **Financial Telemetry Accumulator:** Glanceable readout displaying total cumulative maintenance expenses (`TOTAL MAINTENANCE COST: Rp xxx.xxx`) filtered dynamically by selected period.
- Complete audit trail of replacement history including date, service odometer, cost, notes, and previous wear deltas.

### 4. Custom FXON Toast HUD Notification System
- Replaces generic, disruptive operating system popups (`Alert.alert`) with an integrated in-app **Instrument-Panel Toast HUD** ([`ToastContext.tsx`](file:///c:/Users/penap/Documents/Project_Fik/Motofix/src/contexts/ToastContext.tsx)).
- Monospaced diagnostic headers (`ERR //`, `WRN //`, `OK //`, `SYS //`), hairline dark surfaces (`#101317`), colored status indicator strips, safe-area aware slide-down animations, and tactile haptic actuation.
- Critical destructive actions (e.g., permanent deletion of vehicles, components, or account wipe) strictly retain confirmation dialogues to prevent accidental data loss.

### 5. Proactive Weekly Odometer Reminder
- Local background reminders powered by `expo-notifications` prompting riders to record their physical odometer every 7 days.
- Fully configurable with instant opt-in/opt-out switches inside the in-app manual.

### 6. Hybrid Frictionless Authentication (`authService`)
- **Instant Guest Mode:** Launches immediately into a persistent anonymous session without forcing registration walls.
- **Google Account Binding:** Seamlessly link a Google account anytime from the Operating Manual to sync multi-device garages and safeguard telemetry data against device resets.

### 7. Mechanical Directives & Workshop Radar (`WorkshopScreen`)
- Curated engineering reference for engine fluids, braking systems, CVT drivetrains, and electrical circuits.
- One-touch launcher routing riders directly to certified local mechanics and repair shops via Google Maps.

---

## 🎨 Design System: Instrument-Panel Brutalism

FXON embraces an authentic, high-contrast motorcycle instrument aesthetic:
- **Cockpit Surfaces:** Deep Onyx (`#07090C`), Metallic Surface Dark (`#101317`), and Hairline Metal Borders (`#1F242D`).
- **Telemetry Typography:**
  - `Rajdhani` (Semi-Bold / Bold) — High-impact display headings and speed metrics.
  - `IBM Plex Mono` (Medium / Bold) — High-precision tabular figures and odometer digits.
  - `Plus Jakarta Sans` / `IBM Plex Sans` — Ergonomic, glanceable interface copy.
- **Telemetry Palette:**
  - `Electric Blue (#1449FF)` — Primary brand accent & active states.
  - `Amber Alert (#FF9500)` — Warning threshold (≤ 100 KM).
  - `Hazard Red (#FF3B30)` — Critical overdue state & destructive actions.
  - `Mechanical Green (#34C759)` — Optimal component health & success confirmations.
  - `Telemetry Cyan (#00E5FF)` — Informational HUD notifications.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Framework** | [React Native 0.81](https://reactnative.dev/) / [Expo SDK 54](https://expo.dev/) | Edge-to-edge runtime with modern gesture and safe-area architecture |
| **Language** | [TypeScript 5.9](https://www.typescriptlang.org/) | Strictly typed telemetry models, contracts, and service interfaces |
| **Backend & Database** | [Supabase](https://supabase.com/) | Cloud PostgreSQL with Row-Level Security (RLS) policies |
| **Authentication** | Supabase Auth + Google Sign-In | Hybrid anonymous device sessions with Google OAuth account binding |
| **State & Context** | React Context API | `ThemeContext` (adaptive theming) & `ToastContext` (brutalist in-app alerts) |
| **Local Storage** | [@react-native-async-storage](https://github.com/react-native-async-storage/async-storage) | Persistent device session, active bike selection, and telemetry cache |
| **Sensory Feedback** | [expo-haptics](https://docs.expo.dev/versions/latest/sdk/haptics/) | Native Taptic Engine & actuator feedback on telemetry adjustments |
| **Notifications** | [expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) | Local 7-day scheduled odometer reminder triggers |
| **Build System** | [EAS (Expo Application Services)](https://expo.dev/eas) | Cloud-based preview APK and production AAB compilation |

---

## 📂 Project Structure

```text
Motofix/
├── assets/                       # Branding assets, vector icons, and dial gauges
│   ├── adaptive-icon.png         # Android adaptive icon (FXON logo)
│   ├── icon.png                  # Master 1024x1024 application icon
│   ├── splash-icon.png           # Splash screen logo mark
│   ├── speedometer-dial.png      # Tachometer / speedometer dial graphics
│   └── images/                   # Brand logos, sparepart glyphs, and empty states
├── src/
│   ├── components/               # Reusable UI widgets
│   │   ├── HistoryTab.tsx        # Service logbook timeline & 2-step date/cost filter
│   │   └── ReplacementModal.tsx  # Component service & replacement modal
│   ├── constants/                # System constants, theme tokens, and master catalog
│   │   ├── assets.ts             # Static image mapping and resolvers
│   │   ├── masterData.ts         # OEM component defaults & service intervals
│   │   └── theme.ts              # Spacing, colors, and typographic scale tokens
│   ├── contexts/                 # Global application contexts
│   │   ├── ThemeContext.tsx      # Dark / Light / System theme provider
│   │   └── ToastContext.tsx      # FXON Brutalist HUD Toast Notification provider
│   ├── lib/                      # Infrastructure clients
│   │   └── supabase.ts           # Supabase client singleton with environment bindings
│   ├── screens/                  # Application views
│   │   ├── AddSparepartScreen.tsx # Custom & master part registration
│   │   ├── AddVehicleScreen.tsx  # Motorcycle onboarding
│   │   ├── ConfigErrorScreen.tsx # Supabase connection error fallback
│   │   ├── GarageScreen.tsx      # Fleet management & bike selector
│   │   ├── HelpScreen.tsx        # Operating manual, OAuth binding, & reminder settings
│   │   ├── HomeScreen.tsx        # Main telemetry dashboard & odometer updater
│   │   └── WorkshopScreen.tsx    # Mechanical directives & Google Maps radar
│   ├── services/                 # Data access layer
│   │   ├── authService.ts        # Guest session & OAuth handling
│   │   ├── notificationService.ts # Local weekly odometer reminder scheduler
│   │   ├── sparepartService.ts   # Component wear queries & replacement logs
│   │   └── vehicleService.ts     # Multi-vehicle CRUD operations
│   ├── types/                    # Domain models and TypeScript contracts
│   └── utils/                    # Computational helpers
│       ├── haptics.ts            # Universal haptic feedback wrapper
│       └── kmCalculator.ts       # Pure odometer wear & status evaluation
├── .env.example                  # Environment configuration template
├── App.tsx                       # Root container, navigation router, and HUD overlay
├── app.json                      # Expo application manifest
└── package.json                  # Dependencies and build scripts
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or v20.x LTS recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- Physical Android or iOS device with [Expo Go](https://expo.dev/go) installed, or an Android Emulator / iOS Simulator.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Jireppp/Motofix.git
   cd Motofix
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   Fill in your Supabase project credentials in `.env`:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-oauth-client-id
   ```

4. **Start the Development Server:**
   ```bash
   npx expo start
   ```

5. **Launch the App:**
   - Scan the QR code with **Expo Go** (Android) or the native Camera app (iOS).
   - Or press `a` in the terminal to launch on an active Android Emulator.

---

## 📦 Production Builds (EAS Build)

The project is fully configured for cloud and local builds using [EAS CLI](https://docs.expo.dev/build/introduction/).

### Build Standalone Android APK (Preview/Testing):

```bash
# 1. Login to your Expo account
npx expo login

# 2. Trigger preview build (direct APK download)
npx eas-cli build -p android --profile preview
```

### Build Production Android App Bundle (AAB for Google Play):

```bash
npx eas-cli build -p android --profile production
```

---

## 🔐 Database & Security Architecture

FXON uses PostgreSQL on Supabase with the following data relationships:
- `user_vehicle`: Motorcycle records linked by `user_id` (plate number, brand, model, active odometer).
- `vehicle_sparepart`: Component tracking rows per bike, storing `service_interval_km`, `last_service_km`, and `custom_name`.
- `maintenance_log`: Historical audit records of replaced parts, costs, odometer reading at service, and timestamps.
- `km_log`: Historical timeline of odometer updates.

> [!IMPORTANT]
> **Production Security Checklist:**
> - Ensure Row-Level Security (RLS) is activated on all tables (`user_vehicle`, `vehicle_sparepart`, `maintenance_log`, `km_log`) restricting operations strictly to `auth.uid() = user_id`.
> - Ensure **Confirm email** is set to **OFF** in Supabase Auth settings to support friction-free guest accounts.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — see the LICENSE file for details.
