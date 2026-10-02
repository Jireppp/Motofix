# Motofix — Precision Motorcycle Maintenance Tracker

<div align="center">

![Motofix Banner](assets/splash-icon.png)

**A high-precision, telemetry-driven motorcycle maintenance tracker built with React Native, Expo, and Supabase.**

[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2054-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Platforms](https://img.shields.io/badge/Platforms-Android%20%7C%20iOS-4E86E4?style=for-the-badge)](https://expo.dev/)

</div>

---

## 📌 Overview

**Motofix** is an engineering-first mobile application designed to eliminate maintenance guesswork for motorcycle riders and fleet owners. By synchronizing physical odometer readings with manufacturer-recommended replacement intervals, Motofix delivers real-time component wear telemetry, proactive warnings, and a immutable historical service logbook.

The application adheres to a **Modern-Minimal / Editorial** design language—prioritizing glanceable numerical hierarchy, high-contrast dark/light theming, ergonomic touch targets, tactile haptics, and zero-friction onboarding.

---

## ✨ Key Features

- **Fleet & Multi-Vehicle Garage (`GarageScreen`)**
  - Seamlessly register and manage multiple motorcycles under one account.
  - Native brand identity integration (Honda, Yamaha, Suzuki, Kawasaki, Vespa, TVS, and custom manufacturers) with theme-adaptive iconography.
- **Telemetry-Driven Wear Tracking (`HomeScreen`)**
  - Real-time countdown of remaining kilometers per spare part based on the latest physical odometer input.
  - Granular status triggers: **Normal** (Optimal), **Warning** (≤ 100 km threshold), and **Overdue** (negative mileage alert).
- **Master Catalog & Custom Components**
  - Preloaded with standardized motorcycle intervals (Engine Oil, CVT Belt, Brake Pads, Air Filter, Spark Plug, Coolant, Gear Oil, Rollers).
  - Support for custom part creation with bespoke replacement cycles.
- **Ergonomic Tactile Controls & Universal Haptics**
  - Integrated with `expo-haptics` (and native vibration fallback) for tactile confirmations during mileage updates, component replacements, and tab transitions.
  - WCAG-compliant touch targets (min. 44×44 pt) designed for effortless single-handed or gloved operation.
- **Frictionless Hybrid Authentication**
  - **Instant Guest Mode:** Zero registration wall; creates an anonymous persistent device session immediately upon launch.
  - **Google Account Binding:** Link Google credentials at any time from the manual to sync fleet data across devices and prevent loss upon app reinstall.
- **Maintenance Directive & Workshop Finder (`WorkshopScreen`)**
  - Curated mechanical directive covering vital fluids, drivetrain, braking systems, and electrical components.
  - Quick launcher to locate certified workshops and mechanics nearby via Google Maps.
- **Safe Area Inset Resilience**
  - Native edge-to-edge layout management using `react-native-safe-area-context` to guarantee zero visual collisions with device camera notches, camera holes ("alis"), or navigation gesture bars.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Framework** | [React Native](https://reactnative.dev/) via [Expo SDK 54](https://expo.dev/) | Edge-to-edge runtime, New Architecture ready |
| **Language** | [TypeScript 5.9](https://www.typescriptlang.org/) | Strictly typed components, models, and service interfaces |
| **Database & Auth** | [Supabase](https://supabase.com/) | PostgreSQL backend with Row-Level Security (RLS) policies |
| **Local Storage** | [@react-native-async-storage/async-storage](https://github.com/react-native-async-storage/async-storage) | Client-side session and offline preferences |
| **Typography** | Rajdhani, IBM Plex Mono, IBM Plex Sans | Distinct display figures, monospaced telemetry, and readable copy |
| **Icons** | [Lucide React Native](https://lucide.dev/) | Clean, scalable vector line icons |
| **Sensory Feedback** | [expo-haptics](https://docs.expo.dev/versions/latest/sdk/haptics/) | Native Taptic Engine and vibration actuation |
| **Build System** | [EAS (Expo Application Services)](https://expo.dev/eas) | Cloud-based preview and production AAB/APK pipelines |

---

## 📂 Project Structure

```text
Motofix/
├── assets/                       # Visual assets, branding logos, and app icons
│   ├── images/brands/            # Adaptive brand marks (light/dark variants)
│   ├── images/icons/             # System and theme switcher icons
│   └── images/spareparts/        # Component category icons
├── src/
│   ├── components/               # Reusable UI components
│   │   ├── HistoryTab.tsx        # Service logbook timeline
│   │   └── ReplacementModal.tsx  # Part replacement logger dialog
│   ├── constants/                # Theme tokens, master data, and asset registries
│   │   ├── assets.ts             # Static image mapping and resolvers
│   │   ├── masterData.ts         # OEM component defaults and intervals
│   │   └── theme.ts              # Spacing, colors, and typographic tokens
│   ├── contexts/                 # Global application contexts
│   │   └── ThemeContext.tsx      # Dark / Light / System appearance provider
│   ├── lib/                      # Infrastructure client initializers
│   │   └── supabase.ts           # Supabase client singleton with .env bindings
│   ├── screens/                  # Application views
│   │   ├── AddSparepartScreen.tsx # Custom & master part registration
│   │   ├── AddVehicleScreen.tsx  # Vehicle onboarding
│   │   ├── GarageScreen.tsx      # Fleet overview and active bike switcher
│   │   ├── HelpScreen.tsx        # Operating manual & Google OAuth linker
│   │   ├── HomeScreen.tsx        # Main vehicle telemetry & part status
│   │   └── WorkshopScreen.tsx    # Maintenance directive & maps locator
│   ├── services/                 # Data access layer
│   │   ├── authService.ts        # Guest session & OAuth handling
│   │   ├── sparepartService.ts   # Part tracking & service calculations
│   │   └── vehicleService.ts     # Vehicle CRUD operations
│   ├── types/                    # Domain models and TypeScript contracts
│   └── utils/                    # Computational helpers
│       ├── haptics.ts            # Universal haptic feedback wrapper
│       └── kmCalculator.ts       # Odometer validation & wear estimation
├── .env.example                  # Environment configuration template
├── App.tsx                       # Root container, safe area, and tab navigation
├── app.json                      # Expo application manifest
└── package.json                  # Dependencies and build scripts
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or later recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo Go](https://expo.dev/go) app installed on your physical mobile device (Android / iOS)

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
   Copy the `.env.example` template to `.env` in the root directory:
   ```bash
   cp .env.example .env
   ```

   Populate your credentials inside `.env`:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-oauth-client-id
   ```

4. **Start the Metro Bundler:**
   ```bash
   npx expo start
   ```

5. **Launch on Device:**
   - Scan the terminal QR code using **Expo Go** (Android) or the native Camera app (iOS).
   - Alternatively, press `a` to open in an Android Emulator or `i` for iOS Simulator.

---

## 📦 Production Builds (EAS Build)

The project is preconfigured for [EAS Build](https://docs.expo.dev/build/introduction/).

### Build Standalone Android APK (Preview/Testing):

```bash
# 1. Authenticate with Expo CLI
npx expo login

# 2. Trigger Android Preview Build (generates direct APK download)
npx eas-cli build -p android --profile preview
```

### Build Production Android App Bundle (AAB for Google Play):

```bash
npx eas-cli build -p android --profile production
```

---

## 🔐 Database Schema & Security

Motofix utilizes PostgreSQL on Supabase protected by **Row-Level Security (RLS)**:

- Every query is partitioned by `auth.uid()`, preventing cross-tenant data leaks.
- Anonymous guest identities are issued automatically via `auth.signInAnonymously()`.
- Users linking Google credentials retain all existing vehicles and telemetry via account consolidation.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — see the LICENSE file for details.

