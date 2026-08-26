# 🏍️ Cek Motor - Sparepart Tracker App

Aplikasi React Native (Expo) modern untuk membantu pemilik sepeda motor melacak dan menjadwalkan penggantian *sparepart* berdasarkan input Kilometer (KM) kendaraan. Membantu menghindari keterlambatan perawatan melalui antarmuka yang ramah pengguna.

## ✨ Fitur Utama
*   **Sistem Garasi (Multi-Vehicle):** Tambahkan dan kelola banyak motor sekaligus dalam satu akun (mendukung beragam merek seperti Honda, Yamaha, Kawasaki, dll).
*   **Pelacakan *Sparepart* Berbasis KM:** Sistem cerdas yang mengkalkulasi sisa KM sebelum *sparepart* perlu diganti.
*   **Master Data & *Custom Sparepart*:** Pilih dari *template* komponen umum (Oli, Kampas Rem, V-Belt) atau tambahkan komponen langka milikmu sendiri dengan interval *custom*.
*   **Indikator Status Cerdas:** Label warna untuk membedakan status komponen: Normal (Aman), Warning (Hampir Habis), dan Overdue (Lewat Masa Ganti).
*   * **Frictionless Auth (Guest Login):** Pengguna tidak perlu mengisi formulir pendaftaran yang panjang. Aplikasi otomatis mengidentifikasi perangkat dan menyimpan data dengan aman ke cloud (Supabase) secara instan.
*   **Riwayat Penggantian:** Melacak kapan dan merek apa yang digunakan pada setiap penggantian sebelumnya.

## 🛠️ Tech Stack
*   **Frontend:** [React Native](https://reactnative.dev/) dengan [Expo](https://expo.dev/)
*   **Bahasa Utama:** [TypeScript](https://www.typescriptlang.org/)
*   **Backend / Database:** [Supabase](https://supabase.com/) (PostgreSQL + RLS Security)
*   **Build System:** EAS (Expo Application Services)

## 🚀 Cara Menjalankan Secara Lokal (Development)

**1. Persiapan Awal (Prerequisites)**
*   Pastikan [Node.js](https://nodejs.org/) terinstall di komputermu.
*   Install aplikasi **Expo Go** di HP (Android/iOS).

**2. Instalasi Proyek**
Clone repository ini (atau buka folder proyeknya), lalu masuk ke folder `app`:
```bash
cd Cek_motor/app
npm install
```

**3. Konfigurasi Lingkungan (Environment Variables)**
Buat file bernama `.env` di dalam root folder `app/` dan masukkan kredensial Supabase kamu:
```env
EXPO_PUBLIC_SUPABASE_URL="https://[PROJECT_ID].supabase.co"
EXPO_PUBLIC_SUPABASE_ANON_KEY="[YOUR_ANON_KEY]"
```

**4. Menjalankan Aplikasi**
```bash
npx expo start
```
Scan kode QR yang muncul di terminal menggunakan aplikasi **Expo Go**.

## 📦 Panduan Build APK (Production)

Proyek ini telah dikonfigurasi menggunakan [EAS Build](https://docs.expo.dev/build/introduction/). Untuk membuat file `.apk` (Android) mandiri untuk disebarluaskan:

1.  Pastikan kamu telah login ke akun Expo di terminal: `npx expo login`
2.  Jalankan perintah build:
    ```bash
    eas build -p android --profile preview
    ```
3.  Tunggu hingga proses selesai, dan link unduhan `.apk` akan diberikan di terminal!

## 🗄️ Supabase Deployment (Database Schema)

Aplikasi ini sangat bergantung pada struktur RDBMS PostgreSQL. Untuk menggunakan database dengan kode ini:

1. Jalankan SQL Script `supabase-schema.sql` di halaman **SQL Editor** pada *dashboard* Supabase kamu. (Atau gunakan `supabase-migration-v1.1.sql` jika melakukan update v1.1).
2. Pastikan fitur penambahan Email tanpa konfirmasi aktif di Supabase:
   *   Ke menu **Authentication** > **Providers** > **Email**.
   *   Pastikan **Confirm email** berstatus **OFF**. (Wajib karena kita menggunakan *auto-generated device binding*).

## 📝 Lisensi
Proyek magang/internal. Silakan digunakan dan dikembangkan sesuai kebutuhan tim.
