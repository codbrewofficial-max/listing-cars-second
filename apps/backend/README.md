# LCS Backend — Fondasi (Chat 1)

Backend MVP untuk **Sistem Jual Beli Kendaraan Second dan Suku Cadang**, dibangun dengan
Node.js + TypeScript + Express + PostgreSQL (raw `pg`, migration via `node-pg-migrate`).

Chat ini mengerjakan 4 modul fondasi:
1. Setup Project & Infrastruktur
2. Authentication & User Management (sesuai `02c-addendum-auth-email-brevo.md`)
3. Platform Settings
4. Media Library (Cloudflare R2 + sharp/WebP)

Modul fitur unggulan (Product Management, Chat Realtime, Transaksi, dll) akan dibangun di
chat-chat berikutnya, mengikuti struktur modular yang sama (`src/modules/<nama-modul>`).

---

## 1. Prasyarat

* Node.js 20+
* PostgreSQL sudah jalan (kamu sudah punya lewat pgAdmin/instalasi lokal — buat database kosong dulu, misal `lcs_db`)
* Akun Cloudflare R2 (untuk Media Library) — opsional untuk sekadar menjalankan Auth/Settings, tapi wajib untuk upload media
* Akun Brevo (untuk kirim email verifikasi/reset password) — kalau `BREVO_API_KEY` kosong, pengiriman email akan gagal (tercatat sebagai `failed` di `email_logs`), endpoint lain tetap berjalan normal

## 2. Install Dependency

```bash
cd backend
npm install
```

## 3. Setup Environment

```bash
cp .env.example .env
```

Lalu isi minimal:
* `DATABASE_URL` — connection string ke database PostgreSQL kamu, contoh:
  `postgresql://postgres:password_kamu@localhost:5432/lcs_db`
* `JWT_ACCESS_SECRET` dan `JWT_EMAIL_SECRET` — isi dengan string acak yang panjang & **berbeda satu sama lain** (JWT_EMAIL_SECRET sengaja dipisah dari access token sesuai `02c-addendum`)
* `APP_BASE_URL` — misal `http://localhost:4000` (dipakai untuk membentuk link verifikasi/reset password di email)
* `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` — untuk pengiriman email
* `R2_*` — kredensial Cloudflare R2, kalau belum punya bisa diisi nanti sebelum pakai fitur Media Library
* `SEED_SUPERADMIN_*` — kredensial akun Super Admin pertama (lihat langkah 5)

Semua variabel divalidasi otomatis saat server start (`src/config/env.ts`) — kalau ada yang kurang/salah format, server akan berhenti dengan pesan error yang jelas.

## 4. Jalankan Migration

Migration akan membuat seluruh enum & tabel sesuai `02b-erd-detail-mvp.md` + `02c-addendum-auth-email-brevo.md` (18 file migration, berurutan sesuai dependency foreign key), dan mengisi nilai default `platform_settings` (`registration_open = false`, `email_daily_limit = 250`, dll).

```bash
npm run migrate:up
```

Untuk rollback migration terakhir:
```bash
npm run migrate:down
```

## 5. Buat Akun Super Admin Pertama

Endpoint `POST /api/users` sendiri butuh login sebagai Super Admin, jadi akun pertama harus dibuat lewat script terpisah ini (baca kredensial dari `.env`):

```bash
npm run seed:superadmin
```

## 6. Jalankan Server (Development)

```bash
npm run dev
```

Server berjalan di `http://localhost:4000` (atau sesuai `PORT` di `.env`). Cek `GET /health` untuk memastikan server & format response berjalan normal.

## 7. Build & Jalankan (Production)

```bash
npm run build
npm start
```

---

## Struktur Folder

```
src/
├── config/         # env, db pool, logger, r2 client
├── db/
│   ├── migrations/ # DDL berurutan (node-pg-migrate)
│   └── seed/        # script seed super admin
├── modules/
│   ├── auth/         # register, login, refresh+rotate, verifikasi, reset password
│   ├── users/         # RBAC/User Management (Super Admin) + reset password manual
│   ├── email/          # sendEmail() terpusat + integrasi Brevo + email_logs
│   ├── platform-settings/
│   ├── media/           # upload gambar -> sharp -> WebP -> R2 -> media_assets
│   └── audit-log/       # recordAuditLog() + checkCooldown(), dipakai lintas modul
├── middlewares/     # authenticate, authorize, validate, rateLimiter, errorHandler
├── utils/            # ApiError, apiResponse, asyncHandler, pagination
├── app.ts
└── server.ts
```

Konvensi tiap modul: `routes → controller → service (business logic) → repository (SQL)`.

---

## Catatan Keputusan & Asumsi Penting (mohon direview)

Beberapa keputusan diambil mengikuti jawabanmu di chat, dicatat di sini biar terlihat eksplisit:

1. **Login diblokir sampai email terverifikasi** (`EMAIL_NOT_VERIFIED`, HTTP 403) — user diarahkan verifikasi/minta kirim ulang, sesuai instruksimu.
2. **`registration_open` default `false`** saat migration awal — Super Admin perlu membuka lewat `PATCH /api/settings/registration-toggle` saat siap menerima registrasi customer.
3. **Rate limiting** sudah dipasang di `login`, `forgot-password`, `resend-verification`, plus limiter global ringan untuk seluruh API (`src/middlewares/rateLimiter.ts`). Nilainya cukup longgar untuk skala 100 user MVP, gampang diperketat nanti.
4. **`POST /api/auth/logout`** — dokumen `05` menyebut endpoint ini tanpa request body, tapi proses revoke butuh tahu refresh token mana yang dicabut. Saya buat `refresh_token` di body bersifat **opsional**: kalau dikirim → hanya device itu yang logout; kalau tidak dikirim → semua refresh token milik user direvoke (logout semua device). Ini backward-compatible dengan kontrak asli (tidak mewajibkan body apa pun), tapi tolong dikonfirmasi apakah perilaku ini sesuai harapan, karena sedikit menambah dari yang tertulis literal di dokumen.
5. **Endpoint Media Library** (`POST /api/media`) dibatasi role `admin`, `super_admin`, `customer` — persis sesuai `05-api-endpoints-mvp.md §9`.
6. **Kuota Media Library 1GB** dicek dengan menjumlahkan `size_bytes` di tabel `media_assets` sebelum setiap upload baru; kalau sudah terlampaui, upload ditolak dengan error `QUOTA_EXCEEDED` (dokumen menyebut kebutuhan "dashboard monitoring", ini logic pencegahannya — dashboard datanya sudah tersedia lewat `GET /api/media/usage`).
7. **Seed Super Admin** otomatis mengisi `email_verified_at` agar bisa langsung login tanpa perlu alur verifikasi email untuk akun pertama ini.

Kalau ada dari 7 poin ini yang mau diubah sebelum lanjut ke modul berikutnya (Product Management, Chat, Transaksi), kabari saya di chat ini dulu — supaya modul-modul selanjutnya dibangun di atas fondasi yang sudah benar-benar sesuai maumu.

---

## Testing Cepat (manual, contoh pakai curl)

```bash
# Register
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Budi","email":"budi@example.com","password":"password123"}'
# -> akan ditolak dengan pesan "Registrasi saat ini ditutup" karena registration_open default false,
#    buka dulu via endpoint toggle (login sebagai Super Admin dulu):

# Login sebagai Super Admin
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<SEED_SUPERADMIN_EMAIL>","password":"<SEED_SUPERADMIN_PASSWORD>"}'

# Buka registrasi (pakai access_token dari response login di atas)
curl -X PATCH http://localhost:4000/api/settings/registration-toggle \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"registration_open": true}'
```

---

## Yang Belum Termasuk di Chat Ini (menyusul di chat berikutnya)

* Product Management (`vehicles`, `spare_parts` CRUD + filter/search)
* Chat Realtime (WebSocket)
* Notifikasi Realtime (WebSocket)
* Inspeksi Dokumen & Kunjungan Fisik
* Transaksi & Escrow-lite
* Leads System
* Article Management
* Tracking Insight
* Audit Log read endpoints (`GET /api/audit-logs`) — tabel & fungsi tulis (`recordAuditLog`) sudah siap dipakai, endpoint baca akan ditambahkan bersama modul RBAC lanjutan

Kode dari chat ini sudah menyediakan fondasi yang dipakai ulang oleh semua modul di atas: `authenticate`/`authorize` middleware, `sendSuccess`/`ApiError`, `recordAuditLog`, `uploadImage`, dan koneksi DB — jadi modul berikutnya tinggal nambah folder baru di `src/modules/` mengikuti pola yang sama.
