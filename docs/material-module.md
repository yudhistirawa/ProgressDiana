# Stok Material dan Alat

Halaman admin: `/admin/material`. Halaman petugas/pengawas: `/dashboard/material`.
Pengawas memakai role `pelaksana` yang sudah dipakai dashboard aplikasi.
Data baru dimuat setelah proyek diklik. Modul tidak mengubah query Laporan Progres.

## Penggunaan

1. Admin memilih proyek, menambahkan nama material, satuan, stok awal, keterangan, dan foto.
2. Admin dapat mencatat stok masuk berikutnya dengan foto kondisi stok setelah penerimaan.
3. Petugas memilih proyek dan tombol **Pakai material**, memasukkan jumlah, pekerjaan/tujuan, dan foto stok sesudah pemakaian.
4. Tab **Rekap & riwayat** memuat periode 7 hari terakhir saat pertama dibuka. Pilih tanggal dan klik **Tampilkan rekap** untuk periode lain. Filter material berlaku pada tabel dan ekspor.
5. Admin dapat mengoreksi jumlah pada transaksi awal/masuk/pemakaian melalui riwayat. Isi jumlah pengganti, alasan, dan foto kondisi stok terkini. Catatan asli tidak diubah. Satu transaksi hanya dapat dikoreksi sekali. Koreksi yang akan membuat stok minus ditolak; untuk kesalahan lanjutan catat stok masuk/pemakaian yang sah, bukan menghapus jejak.
6. Excel mempunyai lembar **Stok saat ini** dan **Riwayat periode**. Foto berupa tautan. Saldo saat ini bukan saldo akhir periode historis. Riwayat menggunakan waktu pencatatan server, tanpa pengisian tanggal mundur.

Jumlah mendukung 3 desimal, maksimal 1 miliar per saldo. Satuan terkunci setelah transaksi lanjutan pertama untuk menjaga konsistensi riwayat. Rekap memuat seluruh periode sebelum menampilkan/mengekspor, dengan batas 10.000 transaksi dan rentang maksimal satu tahun; jika terlampaui pengguna diminta mempersempit filter, bukan diberi hasil sebagian.

Tombol **Edit** dan **Hapus** tersedia untuk admin pada daftar stok. Edit mengubah nama dan foto; satuan dapat diperbaiki selama belum ada transaksi lanjutan setelah stok awal. Jumlah tetap diperbaiki melalui Koreksi. Saat menghapus, admin memilih **hapus dari daftar saja** (riwayat tetap ada, ditandai Dihapus di rekap/Excel), atau **hapus beserta seluruh riwayat**. Pilihan kedua wajib dikonfirmasi dengan mengetik HAPUS dan menghapus transaksi awal, stok masuk, pemakaian, serta koreksi material pada proyek itu untuk semua tanggal, bukan hanya periode rekap. Untuk material yang sudah dihapus dari daftar, tombol Hapus riwayat tersedia pada ringkasan material di rekap. Perubahan identitas dan penghapusan dicatat di `materialProjects/{project}/materialChanges/{operationId}` secara atomik.

## Integrasi Firebase sebelum produksi

Pemeriksaan langsung pada 19 Oktober 2026 memastikan konfigurasi Firebase aplikasi lengkap, Firestore dapat diakses, bucket foto tersedia, dan profil role `admin`/`pelaksana` tersimpan dengan ID berbentuk Firebase Auth UID. Modul memakai konfigurasi yang sama dengan fitur aplikasi lainnya; koleksi Material dibuat otomatis saat transaksi pertama disimpan.

Aturan Firestore dan Storage aktif telah dibaca, tanpa diubah: keduanya saat ini mengizinkan semua baca/tulis (`allow read, write: if true`). Karena itu path Material tidak memerlukan pembukaan izin tambahan untuk koneksi dasar. Pembatasan role pada database baru berlaku setelah aturan khusus di bawah digabungkan; wildcard terbuka tidak boleh tetap mencakup path Material. Pengujian melalui browser dengan akun admin/petugas belum dilakukan.

Untuk deploy aplikasi pada Vercel yang sudah menjalankan sistem ini, pertahankan enam environment variable `NEXT_PUBLIC_FIREBASE_*` yang sama seperti konfigurasi deployment lama (`API_KEY`, `AUTH_DOMAIN`, `PROJECT_ID`, `STORAGE_BUCKET`, `MESSAGING_SENDER_ID`, `APP_ID`). File `.env.local` tidak ikut Git; pada deployment baru variabel tersebut harus diatur di penyedia hosting sebelum build.

- Gabungkan blok `match /{stockRoot}/{project}` dari [materials.firestore.rules](../firebase/materials.firestore.rules) ke blok `/databases/{database}/documents` aturan Firestore yang sudah ada.
- Gabungkan blok `match /{photoRoot}/{project}/{uid}/{filename}` dari [materials.storage.rules](../firebase/materials.storage.rules) ke blok `/b/{bucket}/o` aturan Storage yang sudah ada.
- Jangan mengganti seluruh aturan aplikasi dengan file khusus Material: path lama tidak tercakup oleh file tersebut. Hapus/batasi aturan wildcard permisif yang juga mencakup path Material; aturan `allow` lain yang lebih luas dapat melewati pembatasan modul.
- Pastikan profil tepercaya tersimpan di `users/{FirebaseAuthUID}` dan role tidak bisa diubah sendiri oleh petugas. Modul sengaja tidak memakai cookie/localStorage untuk memberi izin tulis. Jika akun lama hanya memiliki profil berbasis email, migrasikan profil tersebut ke UID yang sesuai.
- Deploy aturan gabungan lewat Firebase Console atau pipeline yang sudah dipakai, lalu uji admin/petugas dengan proyek uji. Cross-service read pada Storage rules dapat membutuhkan pemberian izin integrasi Firebase sesuai petunjuk console.
- Query menggunakan path per proyek dan satu field rentang `createdAt`; tidak memerlukan indeks komposit baru.

Aturan memvalidasi saldo, role, serta hubungan perubahan stok dengan transaksi baru melalui `getAfter`. Riwayat dan foto tidak boleh dihapus atau ditimpa dari klien. Referensi: [Firebase Security Rules conditions](https://firebase.google.com/docs/firestore/security/rules-conditions).

Penyimpanan: `materialProjects/{project}/materials/{id}`, `movements/{id}`, dan `corrections/{originalMovementId}`. Foto: `material-photos/{project}/{uid}/...jpg`. Stok dan riwayat diperbarui dalam satu transaksi Firestore, termasuk penanda koreksi. Identitas operasi mencegah pengiriman ulang mengurangi stok dua kali.

Foto diunggah sebelum transaksi stok. Bila transaksi gagal, foto yang belum terhubung mungkin tertinggal di Storage; tidak dihapus otomatis agar respons jaringan yang terputus sesudah commit tidak menghapus bukti yang sudah tersimpan. Pembersihan orphan dapat dijalankan dari proses admin tepercaya setelah memeriksa referensi riwayat.

Penghapusan seluruh riwayat menandai material sebagai tidak bisa dipakai sebelum membersihkan transaksi dan penanda koreksi dalam batch 200 dokumen. Jika jaringan gagal, admin dapat melanjutkan lewat banner Lanjutkan penghapusan. Metadata material dan catatan tindakan admin tetap disimpan sebagai penanda agar formulir lama tidak bisa membuat transaksi baru untuk material yang dihapus; keduanya tidak ditampilkan pada rekap/Excel. Berkas foto di Storage dan Excel yang sudah pernah diunduh tidak ikut dihapus. Aturan Firestore khusus Material mengizinkan penghapusan transaksi hanya oleh admin setelah material ditandai untuk hapus seluruh riwayat.

## Pemeriksaan lokal

Jalankan `node --test scripts/test-materials.cjs`, `npx tsc --noEmit --incremental false`, dan `npm run build`.
Pengujian mencakup saldo desimal, stok minus, pembatasan role pada service, isolasi proyek, idempotensi, koreksi, simulasi transaksi bersamaan/rollback, serta pembacaan kembali Excel untuk memeriksa tautan foto.
Adaptor transaksi Firebase pada tes disimulasikan; aturan Firestore/Storage belum diuji di emulator maupun Firebase produksi. Uji akun admin/petugas, penolakan tulis langsung oleh role lain, unggah foto, dan ekspor setelah aturan digabungkan pada proyek uji sebelum produksi.

## Pemisahan alat dan material

Pilih tab Material atau Alat, lalu Stok atau Rekap & riwayat. Alur stok awal, masuk, pemakaian, koreksi, foto, edit, hapus, dan Excel sama untuk keduanya. Data material lama tetap memakai `materialProjects`. Data alat memakai `equipmentProjects/{project}/materials/{id}` dengan skema dan subkoleksi yang sama; foto alat memakai `equipment-photos/{project}/{uid}/...jpg`. Filter dan ekspor hanya mengambil kategori aktif. Aturan contoh Firebase mencakup kedua kategori dengan validasi dan hak akses yang sama; gabungkan aturan terbaru bila deployment memakai aturan khusus.
