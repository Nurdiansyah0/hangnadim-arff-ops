# Implementation Plan: Sistem ERP Unit ARFF Hang Nadim




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
