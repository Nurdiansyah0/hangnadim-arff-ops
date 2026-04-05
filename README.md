# Sistem ERP Unit ARFF Hang Nadim

Sistem ERP ini dirancang khusus untuk operasional dan manajemen Unit ARFF (Aircraft Rescue and Fire Fighting) di Bandara Internasional Hang Nadim. Sistem terintegrasi ini ditujukan untuk menjamin keselamatan penerbangan melalui layanan penyelamatan, pemadaman kebakaran pesawat, serta dukungan pencegahan dan perlindungan kebakaran harian sesuai dengan regulasi ICAO (Annex 14, Volume 1, Chapter 9.2) dan regulasi nasional (UU No. 1 Tahun 2009, PR 30 Tahun 2022).

## Arsitektur Proyek

Proyek ini terdiri dari dua bagian utama:
1.  **Backend (Rust)**: Membangun API handal, aman, dan berkinerja tinggi menggunakan _Axum_ framework dan berinteraksi dengan database PostgreSQL menggunakan _SQLx_.
2.  **Frontend (Next.js)**: Menyediakan antarmuka pengguna interaktif (Web UI) yang dibangun menggunakan Next.js (App Router), React, dan Tailwind CSS.

## Fitur Utama Modul ERP

-   **Dashboard Operasi:** Menampilkan status kesiapsiagaan personel, kendaraan, peralatan, dan log insiden (Watchroom).
-   **Manajemen Aset:** Pencatatan inventaris kendaraan, peralatan pemadam, titik hydrant, dan *foam system*.
-   **Manajemen Shift & Personel:** Penjadwalan, alokasi role/posisi (Manager, Team Leader, Firefighter, Watchroom, dll.), dan integrasi *Permission Leave*.
-   **Watchroom:** Monitoring insiden *real-time* dan eskalasi.
-   **Fire Protection & Prevention (FPP):** Modul untuk inspeksi keselamatan, penilaian risiko, serta checklist harian/mingguan.
-   **Audit & Pelatihan:** Modul arsip dan kepatuhan berdasarkan regulasi PR 30 Tahun 2022, serta perekaman lisensi/pelatihan personel.

## Struktur Direktori

```
.
├── backend/               # Rust Backend dengan Axum dan SQLx
│   ├── Cargo.toml
│   ├── migrations/        # File migrasi database SQLx
│   └── src/               # Kode sumber untuk domain, handler, repository, dan service
└── frontend/              # Next.js Frontend App
    ├── package.json
    ├── src/
    │   └── app/           # App Router untuk Next.js
    └── ...
```

## Persiapan & Menjalankan Proyek Secara Lokal

Untuk menjalankan proyek ini di lingkungan lokal Anda, ikuti langkah-langkah di bawah ini:

### Persyaratan Awal (Prerequisites)

-   **Node.js** (Versi >= 18) & **npm**
-   **Rust** (Instalasi melalui rustup, disarankan versi stable terbaru)
-   **PostgreSQL** (Dijalankan secara lokal atau melalui Docker)

### Menjalankan Backend (Rust)

1.  Masuk ke direktori `backend`:
    ```bash
    cd backend
    ```
2.  Konfigurasi *Environment*:
    Buat file `.env` di direktori `backend` dan sesuaikan koneksi database Anda. Contoh:
    ```env
    DATABASE_URL=postgres://user:password@localhost:5432/arff_db
    ```
3.  Jalankan server pengembangan (Ini akan secara otomatis menjalankan migrasi dan *build* proyek jika tidak ada *error*):
    ```bash
    cargo run
    ```
    Atau untuk *build* tanpa menjalankan:
    ```bash
    cargo build
    ```
    Server backend akan berjalan di `http://0.0.0.0:8000`.

### Menjalankan Frontend (Next.js)

1.  Masuk ke direktori `frontend`:
    ```bash
    cd frontend
    ```
2.  Instal dependensi npm:
    ```bash
    npm install
    ```
3.  Jalankan server pengembangan:
    ```bash
    npm run dev
    ```
    Buka [http://localhost:3000](http://localhost:3000) di browser untuk melihat antarmuka aplikasi.

## Deployment

Aplikasi Frontend Next.js dapat dengan mudah di-*deploy* menggunakan layanan seperti [Vercel](https://vercel.com).
Backend Rust dapat di-*deploy* ke berbagai layanan *cloud provider* yang mendukung containerisasi atau aplikasi Rust *native* (AWS, Google Cloud, DigitalOcean, dll.). File `Dockerfile` juga tersedia di direktori `backend/` untuk mempermudah containerisasi backend.
