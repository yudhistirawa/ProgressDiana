# Sistem Dokumentasi Progres (Next.js)

Proyek Next.js untuk Sistem Dokumentasi Progres (dashboard pengguna & admin).

## Prasyarat
- Node.js 18.18+ atau 20+
- npm 9+

## Menjalankan Lokal
1. Salin file env contoh lalu isi kredensial Firebase Anda:
   ```bash
   cp .env.example .env
   # atau .env.local
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Jalankan dev server:
   ```bash
   npm run dev
   ```
4. Build production:
   ```bash
   npm run build && npm start
   ```

## Struktur Penting
- `app/` — App Router (halaman dashboard, admin, API route)
- `components/` — Komponen UI ringan (`card`, `avatar`)
- `lib/firebaseClient.ts` — Inisialisasi Firebase (gunakan variabel `NEXT_PUBLIC_FIREBASE_*`)
- `Logo/` — Aset logo yang digunakan pada header

## Catatan
- `next-env.d.ts` disertakan untuk dukungan TypeScript Next.js.
- `.gitignore` sudah menyingkirkan `node_modules`, `.next`, dan file `.env`.
- API `app/api/geocode/route.ts` menggunakan Nominatim; hormati rate limit.

## Git
Inisialisasi repo dan push:
```bash
git init
git add .
git commit -m "Initial import: Sistem Dokumentasi Progres"
git branch -M main
git remote add origin <URL-REPO-ANDA>
git push -u origin main
```
