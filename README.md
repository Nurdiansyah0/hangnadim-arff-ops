# HAIS - Hang Nadim ARFF Integrated System

**HAIS** (Hang Nadim ARFF Integrated System) adalah sistem ERP yang dirancang khusus untuk operasional dan manajemen Unit ARFF (Aircraft Rescue and Fire Fighting) di Bandara Internasional Hang Nadim. Sistem ini menjamin keselamatan penerbangan melalui manajemen kesiapsiagaan personel, aset, dan kepatuhan terhadap regulasi ICAO serta PR 30 Tahun 2022.

## Arsitektur Proyek

Proyek ini terdiri dari dua bagian utama:
1.  **Backend (Rust)**: API performat berkecepatan tinggi menggunakan _Axum_ dan _SQLx_ dengan database PostgreSQL + PostGIS extension.
2.  **Frontend (Vite + React)**: Antarmuka pengguna (Web UI) yang responsif dan modern menggunakan Vite, React, dan Tailwind CSS.

## Persiapan & Menjalankan Proyek (Windows & Linux)

### 1. Persyaratan Sistem & Instalasi (Windows)
1. **PostgreSQL & PostGIS**:
   - Download [PostgreSQL 16 Installer](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads).
   - Saat instalasi, pastikan **Stack Builder** dicentang.
   - Setelah instalasi selesai, buka Stack Builder, pilih **Spatial Extensions** > **PostGIS 3.x** untuk diinstal.
2. **Node.js**: Download [Node.js v20+ LTS](https://nodejs.org/).
3. **Rust**: Buka PowerShell dan jalankan:
   ```powershell
   Set-ExecutionPolicy RemoteSigned -scope CurrentUser
   iwr -useb https://rustup.rs -outfile rustup-init.exe
   .\rustup-init.exe
   ```
   *Pilih opsi 1 (default) dan pastikan Visual Studio Build Tools sudah terinstal.*

### 2. Konfigurasi Database via PowerShell (Wajib)
Setelah PostgreSQL terinstal, buka **PowerShell** dan jalankan perintah berikut untuk membuat database dan mengaktifkan PostGIS (Ganti `postgres` dengan username Anda):

```powershell
# Buat Database
& "C:\Program Files\PostgreSQL\16\bin\createdb.exe" -U postgres arff_db

# Aktifkan PostGIS & Ownership (Ganti 'nama_user' jika berbeda)
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d arff_db -c "CREATE EXTENSION IF NOT EXISTS postgis; ALTER DATABASE arff_db OWNER TO postgres;"
```

### 3. Variabel Lingkungan (.env)
File `.env` sudah disertakan di dalam folder `backend/` untuk memudahkan pengembangan lokal. Pastikan isi `DATABASE_URL` di `backend/.env` sudah sesuai dengan username/password PostgreSQL Anda:
```env
DATABASE_URL=postgres://postgres:password_anda@localhost:5432/arff_db
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=rahasia_super_aman_123
```

### 4. Cara Menjalankan (Step-by-Step)

#### **Backend (Terminal 1)**
```powershell
cd backend
# Jika pertama kali run, sistem akan otomatis download dependencies & jalankan migrasi
cargo run
```
*Catatan: Jika error saat kompilasi di Windows, pastikan Anda sudah menginstal "Desktop development with C++" di Visual Studio Build Tools.*

#### **Frontend (Terminal 2)**
1. Masuk ke direktori `frontend`.
2. Install dependensi (Gunakan flag legacy jika terjadi konflik):
    ```bash
    npm install --legacy-peer-deps
    ```
3. Jalankan dev server:
    ```bash
    npm run dev
    ```
Akses sistem melalui: `http://localhost:3000`

## Akses Akun (Default Data)
Sistem sudah memiliki data awal (seeding) otomatis:
- **Admin/Manager**: `admin123` / `admin123`
- **Personnel/Officer**: Gunakan nama depan personel (lowercase), contoh: `jefri` / `admin123`.

## Troubleshooting (Masalah Umum)
1. **Error: `relation "users" does not exist`**
   - Solusi: Pastikan database sudah dibuat dan backend dijalankan (`cargo run`). Migrasi akan berjalan otomatis.
2. **Error: `PostGIS extension not found`**
   - Solusi: Jalankan `CREATE EXTENSION postgis;` di database Anda.
3. **Frontend Blank / API Error**
   - Solusi: Pastikan backend sudah jalan di port `8000`. Cek `frontend/src/lib/axios.ts` jika IP server berbeda.

---
*Proyek ini dikembangkan untuk Unit ARFF Bandara Internasional Hang Nadim.*
