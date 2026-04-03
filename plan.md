# Implementation Plan: Sistem ERP Unit ARFF Hang Nadim

Dokumen ini merincikan tahapan pengembangan sistem ERP untuk Unit ARFF Hang Nadim. Proyek ini dibentuk menjadi beberapa fase prioritas agar dapat dieksekusi secara iteratif (agile) oleh tim developer (junior/programmer AI) tanpa tumpang tindih.

## Fase 1: Inisialisasi Sistem & Manajemen Otoritas (Pondasi Utama)
**Konteks:** Sistem membutuhkan pondasi yang kuat karena hak akses tiap personil berbeda sesuai dengan RACI Matrix. Matriks di bawah ini menjadi acuan utama *Role-Based Access Control* (RBAC) pada fase ini:

<details>
<summary><b>Lihat Tabel RACI</b></summary>

| Tugas / Aktivitas | Manager ARFF | Team Leader Shift | Team Leader Performance & Quality | Team Leader Maintenance | Firefighter / Regu Operasional | Watchroom | Admin / Dokumentasi |
|-----------------|-----------------|-----------------|----------------------------------|---------------------|-------------------------------|-----------|----------------|
| Kesiapsiagaan shift | A | R | C | C | I | I | I |
| Penanganan insiden kebakaran | I | A/R | C | C | R | C | I |
| Evakuasi penumpang & crew | I | A | C | I | R | I | I |
| Operasi pemadaman & mitigasi bahaya | I | A/R | C | C | R | C | I |
| Fire Protection: Identifikasi risiko | A | R | C | C | I | I | R |
| Fire Protection: Inspeksi area & peralatan | I | R | A/R | C | R | I | R |
| Fire Protection: Pemeliharaan & penerapan standar | A | R | C | A/R | I | C | R |
| Fire Protection: Pelatihan & sosialisasi | A | R | C | C | I | I | I |
| Pemeliharaan kendaraan & peralatan PKP-PK | I | C | I | A/R | C | I | I |
| Monitoring kualitas & evaluasi SOP | A | C | R | C | I | C | I |
| Audit internal & laporan performa shift | A | C | R | C | I | C | R |
| Laporan insiden ke regulator / manajemen | A | C | C | I | R | R | R |
| Update database & arsip dokumentasi | I | I | I | I | I | R | R |
| Penetapan prosedur & kebijakan baru | A | C | C | C | I | C | I |
| Koordinasi dengan VP Safety, Security, Airport Rescue | A | C | C | C | I | R | I |
| Evaluasi kinerja personel per shift | A | R | C | C | I | C | I |
| Penjadwalan shift & rotasi personel | A | R | C | I | I | C | R |
| Mitigasi risiko keselamatan & kepatuhan | A | R | C | C | I | C | I |
| Pemantauan real-time aktivitas bandara | I | I | C | C | I | A/R | I |
| Pemberitahuan insiden / alarm | I | R | C | C | R | A/R | I |

</details>
* **Fokus:** Setup infrastruktur dasar, desain database, dan Authentication/Authorization.
* **Tugas Spesifik:**
  1. Inisialisasi codebase (contoh: Next.js/React untuk FE, Rust/Axum untuk BE) dan pengerjaan struktur folder aplikasi.
  2. Implementasi skema Database untuk `Users`, `Roles`, dan `Permissions`.
  3. Buat fitur Login/Logout dan proteksi Routing berbasis Role.
  4. Buat halaman CRUD (Create, Read, Update, Delete) sederhana untuk meregistrasi personel berdasarkan perannya (Manager ARFF, TL Shift, TL Maintenance, Watchroom, Firefighter, Admin).

## Fase 2: Master Data Management & Modul Manajemen Aset
**Konteks:** Pendataan inventaris kendaraan, peralatan, titik hydrant harus ada terlebih dahulu sebelum modul operasional berjalan.
* **Fokus:** Modul Manajemen Aset & Manajemen Shift dasar.
* **Tugas Spesifik:**
  1. Buat master data tabel untuk `Kendaraan`, `Peralatan Pemadam`, `Hydrant`, dan `Foam System`.
  2. Buat antarmuka CRUD untuk manajemen aset-aset tersebut beserta statusnya (Available, Under Maintenance, Broken).
  3. Buat fitur Manajemen Shift dasar (mendefinisikan Shift Alpha, Bravo, Charlie) dan menempatkan personel-personel dari Fase 1 ke dalam shift-shift tersebut.

## Fase 3: Modul Operasional Inti (Watchroom & Manajemen Insiden)
**Konteks:** Watchroom adalah pusat komando. Jika ada alarm/insiden, log kejadian wajib dicatat secara *real-time* dan dieskalasikan dengan cepat.
* **Fokus:** Modul Watchroom & Operasional Darurat.
* **Tugas Spesifik:**
  1. Buat halaman khusus *Watchroom* yang berfungsi sebagai buku log (Logbook) digital secara *real-time*.
  2. Buat fitur Input Insiden / Alarm. Saat insiden disubmit, tampilkan form yang mencatat bahaya, lokasi, jenis penerbangan terkait, dan waktu kejadian.
  3. Integrasi modul notifikasi dasar: *Auto-generate* notifikasi *in-app* untuk insiden prioritas ke Manager ARFF dan TL Shift.

## Fase 4: Modul Pemeliharaan (Maintenance) & Fire Protection
**Konteks:** Peralatan dan perlengkapan harus selalu siaga. Tugas rutin inspeksi bahaya dan *maintenance* harus didata setiap hari.
* **Fokus:** Checklist Inspeksi Harian & Assessment Risiko (FPP).
* **Tugas Spesifik:**
  1. Buat formulir checklist digital inspeksi harian/mingguan kendaraan dan peralatan (TL Maintenance Task) beserta fitur unggah foto dari lapangan.
  2. Buat modul FPP (Fire Protection & Prevention) untuk inspeksi area bandara, identifikasi potensi bahaya, dan *log/history* status penanganannya (Open/Resolved).

## Fase 5: Modul HR, Pelatihan, & Kinerja
**Konteks:** Unit membutuhkan standar kompetensi staf, rekaman lisensi, dan manajemen absen/cuti yang jelas sesuai porsi kerja.
* **Fokus:** Manajemen Personel tingkat lanjut.
* **Tugas Spesifik:**
  1. Buat *Modul Permission Leave* dengan alur persetujuan berjenjang (Firefighter -> TL -> Manager).
  2. Buat rekaman data lisensi untuk "Modul Pelatihan", tambahkan notifikasi/peringatan (warning) otomatis jika dokumen lisensi personel hampir *expired*.
  3. Buat modul kinerja untuk memfasilitasi penilaian kinerja bulanan yang diserahkan dari Team Leader kepada staf unitnya.

## Fase 6: Modul Audit, Compliance & Arsip Dokumen
**Konteks:** ARFF Bandara internasional dipantau oleh ICAO / Otoritas Regulasi Nasional, sehingga pengarsipan SOP harus valid dan mudah ditemukan.
* **Fokus:** Modul Audit & Arsip Kepatuhan.
* **Tugas Spesifik:**
  1. Buat repositori arsip SOP dan dokumen operasional internal/nasional dengan dukungan fitur pencarian (*searchable*).
  2. Buat formulir Audit Internal berkala yang mengukur *scorecard*/persentase kepatuhan berdasarkan regulasi PR 30 Tahun 2022.

## Fase 7: Dashboard Eksekutif & Integrasi Akhir (Puncak Sistem)
**Konteks:** Fase ini akan merangkum semua data ke dalam visualisasi statistik satu layar agar mempermudah kepemimpinan.
* **Fokus:** Operations Dashboard dan Refinement Menyeluruh.
* **Tugas Spesifik:**
  1. Buat halaman **Dashboard Operasi Utama** yang secara visual menyajikan: Personel siaga hari ini, status kesiagaan flet (kendaraan), dan *ticker log history* kejadian Watchroom.
  2. Sajikan grafik kinerja "Rapor Kesiapsiagaan Sistem" bagi manajer pengambil keputusan (*Overview reporting*).

---
**Catatan untuk Pendelegasian:** Berikan instruksi satu fase pada satu waktu ke junior programmer atau model AI rekan kerja, agar hasil kode terstruktur, mudah diulas, dan bebas dari duplikasi fungsionalitas.
