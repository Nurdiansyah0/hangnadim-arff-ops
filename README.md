# ARSI V2 - Sistem ERP Unit ARFF Hang Nadim

**ARSI V2** (ARFF Rescue and Safety Information Version 2) adalah sistem ERP yang dirancang khusus untuk operasional dan manajemen Unit ARFF (Aircraft Rescue and Fire Fighting) di Bandara Internasional Hang Nadim. Sistem ini menjamin keselamatan penerbangan melalui manajemen kesiapsiagaan personel, aset, dan kepatuhan terhadap regulasi ICAO serta PR 30 Tahun 2022.

## Arsitektur Proyek

Proyek ini terdiri dari dua bagian utama:
1.  **Backend (Rust)**: API performat berkecepatan tinggi menggunakan _Axum_ dan _SQLx_ dengan database PostgreSQL + PostGIS extension.
2.  **Frontend (Vite + React)**: Antarmuka pengguna (Web UI) yang responsif dan modern menggunakan Vite, React, dan Tailwind CSS.

## Fitur Utama

-   **Dashboard Operasi & Watchroom:** Status kesiapsiagaan *real-time* (Personel, Kendaraan, Aset).
-   **Manajemen Aset (GIS Integrated):** Inventaris kendaraan performa, APAR, dan hydrant dengan pemetaan geografis.
-   **Manajemen Shift & Personel:** Penjadwalan otomatis dan alokasi tugas harian.
-   **Fire Protection & Prevention (FPP):** Checklist inspeksi digital dan manajemen temuan safety (findings).
-   **Audit & KPI:** Pemantauan standar pelayanan ARFF sesuai PR 30 Tahun 2022.

## Persiapan & Menjalankan Proyek

### Persyaratan Awal
-   **PostgreSQL 14+** (dengan PostGIS extension)
-   **Redis** (untuk session management)
-   **Rust** (Stable terbaru)
-   **Node.js** (v18+)

### Menjalankan Backend
1.  **Install PostGIS**: Pastikan database `arff_db` memiliki ekstensi PostGIS (`CREATE EXTENSION postgis;`).
2.  **Config**: Buat file `backend/.env` (DATABASE_URL, JWT_SECRET, REDIS_URL).
3.  **Migrations**: Sistem akan menjalankan **25 migrasi otomatis** saat start, termasuk bulk seeding data personel dari CSV.
4.  **Run**:
    ```bash
    cd backend
    cargo run
    ```

### Menjalankan Frontend
1.  Masuk ke direktori `frontend`.
2.  Install dependensi dan jalankan dev server:
    ```bash
    npm install
    npm run dev
    ```

## Akses Sistem (Mode Pengembangan)

Setelah migrasi selesai, gunakan akun berikut:
-   **Superuser**: `admin123` / `admin123`
-   **Staff Personnel**: Gunakan **Nama Depan** (lowercase, contoh: `jefri`) dengan password default `admin123`.

## Struktur Database Terbaru
Sistem menggunakan **25 file migrasi** yang mencakup:
-   Foundation & Org Structure
-   Auth System & User Access
-   Master Assets (Vehicles, APAR, GIS)
-   Maintenance Workflow & Findings
-   Physical Fitness Tracking
-   [0024] Bulk Personnel Seed from CSV
-   [0025] Automated User Login Creation
