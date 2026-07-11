# LCS Backend — Fondasi (Chat 1) + Fitur Unggulan (Chat 2)

Backend MVP untuk **Sistem Jual Beli Kendaraan Second dan Suku Cadang**, dibangun dengan
Node.js + TypeScript + Express + PostgreSQL (raw `pg`, migration via `node-pg-migrate`).

**Chat 1** mengerjakan 4 modul fondasi:
1. Setup Project & Infrastruktur
2. Authentication & User Management (sesuai `02c-addendum-auth-email-brevo.md`)
3. Platform Settings
4. Media Library (Cloudflare R2 + sharp/WebP)

**Chat 2 (chat ini)** mengerjakan 5 modul fitur unggulan / inti bisnis:
1. Product Management — Kendaraan (`vehicles`)
2. Product Management — Suku Cadang (`spare_parts`)
3. Inspeksi Dokumen & Kunjungan Fisik (`visit_requests`, `visit_photos`)
4. Chat Realtime (REST + WebSocket `/ws/chat`)
5. Transaksi & Payment Manual / Escrow-lite (`transactions`)

Modul pendukung (Leads, Article, Notifikasi Realtime, Tracking Insight, Audit Log read
endpoints) akan dibangun di chat berikutnya, mengikuti struktur modular yang sama
(`src/modules/<nama-modul>`).

---

## 1. Prasyarat

* Node.js 20+
* PostgreSQL sudah jalan (kamu sudah punya lewat pgAdmin/instalasi lokal — buat database kosong dulu, misal `lcs_db`)
* Akun Cloudflare R2 (untuk Media Library) — opsional untuk sekadar menjalankan Auth/Settings, tapi wajib untuk upload media (dipakai juga oleh foto kendaraan, foto kunjungan, bukti pembayaran)
* Akun Brevo (untuk kirim email verifikasi/reset password) — kalau `BREVO_API_KEY` kosong, pengiriman email akan gagal (tercatat sebagai `failed` di `email_logs`), endpoint lain tetap berjalan normal

## 2. Install Dependency

```bash
cd backend
npm install
```

**Dependency baru di Chat 2:** `ws` (`@types/ws` untuk dev) — dipakai untuk WebSocket
`/ws/chat` (Modul 4: Chat Realtime). Tidak ada environment variable baru yang wajib diisi
untuk modul-modul Chat 2 ini — semuanya memakai konfigurasi yang sudah ada dari Chat 1
(`DATABASE_URL`, `JWT_ACCESS_SECRET`, `R2_*`, dll).

## 3. Setup Environment

```bash
cp .env.example .env
```

Lalu isi minimal:
* `DATABASE_URL` — connection string ke database PostgreSQL kamu, contoh:
  `postgresql://postgres:password_kamu@localhost:5432/lcs_db`
* `JWT_ACCESS_SECRET` dan `JWT_EMAIL_SECRET` — isi dengan string acak yang panjang & **berbeda satu sama lain**
* `APP_BASE_URL` — misal `http://localhost:4000`
* `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` — untuk pengiriman email
* `R2_*` — kredensial Cloudflare R2 (dipakai juga oleh foto kendaraan/suku cadang/kunjungan/bukti bayar di Chat 2 ini)
* `SEED_SUPERADMIN_*` — kredensial akun Super Admin pertama (lihat langkah 5)

Semua variabel divalidasi otomatis saat server start (`src/config/env.ts`).

## 4. Jalankan Migration

Migration untuk **seluruh tabel** modul Chat 2 (`vehicles`, `vehicle_photos`, `spare_parts`,
`spare_part_photos`, `visit_requests`, `visit_photos`, `conversations`,
`conversation_participants`, `messages`, `message_reads`, `transactions`) **sudah dibuat di
Chat 1** bersama seluruh enum-nya — tidak ada migration baru di Chat 2 ini.

```bash
npm run migrate:up
```

Untuk rollback migration terakhir:
```bash
npm run migrate:down
```

## 5. Buat Akun Super Admin Pertama

```bash
npm run seed:superadmin
```

## 6. Jalankan Server (Development)

```bash
npm run dev
```

Server REST berjalan di `http://localhost:4000` (atau sesuai `PORT` di `.env`). Cek
`GET /health`. WebSocket Chat Realtime berjalan di `ws://localhost:4000/ws/chat` — attach
ke `http.Server` yang sama dengan Express (bukan port terpisah).

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
│   ├── migrations/ # DDL berurutan (node-pg-migrate) — semua tabel Chat 1+2 sudah lengkap
│   └── seed/        # script seed super admin
├── modules/
│   ├── auth/              # register, login, refresh+rotate, verifikasi, reset password
│   ├── users/              # RBAC/User Management (Super Admin) + reset password manual
│   ├── email/               # sendEmail() terpusat + integrasi Brevo + email_logs
│   ├── platform-settings/
│   ├── media/                # upload gambar -> sharp -> WebP -> R2 -> media_assets
│   ├── audit-log/             # recordAuditLog() + checkCooldown(), dipakai lintas modul
│   ├── vehicles/               # [BARU] Product Management — Kendaraan
│   ├── spare-parts/            # [BARU] Product Management — Suku Cadang
│   ├── visits/                  # [BARU] Inspeksi Dokumen & Kunjungan Fisik
│   ├── chat/                     # [BARU] Chat Realtime — REST + WebSocket (/ws/chat)
│   └── transactions/              # [BARU] Transaksi & Payment Manual (Escrow-lite)
├── middlewares/     # authenticate, authorize, validate, rateLimiter, errorHandler
├── utils/            # ApiError, apiResponse, asyncHandler, pagination
├── app.ts
└── server.ts
```

Konvensi tiap modul: `routes → controller → service (business logic) → repository (SQL)` —
sama persis dengan modul-modul Chat 1, termasuk pemakaian `ApiError`, `sendSuccess`,
`asyncHandler`, `parsePagination`/`buildMeta`, `validate` (Zod), `authenticate`/`authorize`,
dan `recordAuditLog`.

---

## Catatan Keputusan & Asumsi Penting — Chat 2 (mohon direview)

1. **`license_plate` kendaraan TIDAK PERNAH ter-expose di response publik** — serialisasi
   dipisah eksplisit lewat `toPublicVehicle()` di `vehicles.service.ts` yang strip field
   ini. Endpoint admin (`GET /api/admin/vehicles`, `GET /api/admin/vehicles/:id`)
   mengembalikan data lengkap termasuk `license_plate`.
2. **Endpoint admin (`GET /api/admin/vehicles`, `GET /api/admin/spare-parts`) dipasang di
   path terpisah** (`/api/admin/vehicles`, bukan sub-path dari `/api/vehicles`), persis
   sesuai `05-api-endpoints-mvp.md`.
3. **Upload foto hasil kunjungan: default Admin only** (`VISIT_PHOTO_UPLOAD_ROLES` di
   `visits.service.ts`), sesuai default sementara di `04-catatan-open-decision.md` §3.
   Otorisasi granular ini **config-driven di service layer** (bukan hardcode di
   route/skema) — kalau nanti mau dibuka untuk Customer, tinggal ubah 1 array, tidak perlu
   ubah skema atau kontrak API.
4. **Status `visit_requests` TIDAK otomatis mengubah status listing kendaraan** kalau
   kunjungan gagal terjadwal/dibatalkan — sesuai default di `04-catatan-open-decision.md`
   §3 & rekomendasi §15 di `05-api-endpoints-mvp.md`. Admin ubah status kendaraan manual
   kalau perlu.
5. **Chat — mekanisme assignment Admin: General Queue** (dikonfirmasi sebelum coding).
   Tidak ada auto-assign saat `POST /api/conversations` dibuat — conversation baru
   langsung `open` tanpa partisipan admin. Admin manapun bisa melihatnya di daftar
   (`GET /api/conversations` untuk role admin menampilkan: conversation yang sudah dia
   ikuti + seluruh conversation `open` yang belum punya partisipan admin sama sekali).
   Begitu seorang Admin mengirim pesan pertama di suatu conversation (via REST atau WS),
   dia **otomatis ditambahkan sebagai partisipan** (jadi "assigned").
6. **WebSocket `/ws/chat` — auth via query param `?token=<access_token>`**, bukan header
   `Authorization`, karena WebSocket API di browser tidak bisa mengirim custom header saat
   handshake. Event yang di-emit ke client: `message:new`, `message:read`,
   `conversation:closed`. Client juga bisa *mengirim* pesan lewat WS dengan payload
   `{ "type": "message:new", "conversation_id", "content", ... }` atau
   `{ "type": "message:read", "conversation_id", "up_to_message_id" }` — service yang sama
   dipakai baik dari REST maupun WS, jadi hasilnya konsisten. Broadcast antar-client
   memakai in-process `EventEmitter` (`chat.events.ts`) — cukup untuk MVP single-instance;
   kalau nanti scale-out multi-instance, ini perlu diganti ke sesuatu lintas-proses (mis.
   Redis pub/sub).
7. **Alur status transaksi (Escrow-lite) — dikonfirmasi sebelum coding:**
   ```
   pending_payment --(Customer upload bukti + Admin verify-payment approved=true)--> funds_held
   funds_held --(Owner release)--> released_to_seller
   funds_held --(Customer/Admin dispute)--> disputed
   disputed --(Owner resolve)--> released_to_seller | refunded | cancelled   (LANGSUNG ke status
                                                                               final; nilai enum
                                                                               'resolved' sengaja
                                                                               tidak dipakai)
   pending_payment --(Customer atau Admin, sebelum funds_held)--> cancelled
   ```
   `approved=true` di `verify-payment` menaikkan status **2 tingkat sekaligus**
   (`payment_verified` → `funds_held`), dicatat sebagai **1 audit log** dengan metadata
   `resulting_status`. `approved=false` tidak mengubah status (tetap `pending_payment`,
   customer perlu upload ulang bukti).
8. **Audit log wajib di setiap transisi status transaksi** — dilakukan di
   `transactions.service.ts` menempel langsung di titik transisi (`create_transaction`,
   `upload_payment_proof`, `verify_payment`, `release_transaction_funds`,
   `dispute_transaction`, `resolve_transaction_dispute`, `cancel_transaction`), bukan
   ditambahkan belakangan. Begitu juga di modul lain: `create_vehicle`/`update_vehicle`/
   `delete_vehicle`, `verify_vehicle_document`, `moderate_visit_photo`, dst.
9. **`payment_gateway_ref` di tabel `transactions` sengaja tidak pernah diisi/dipakai logic
   apa pun di modul ini** — reserved murni untuk Fase 2 (Midtrans), sesuai instruksi.
10. **Refund saat `resolve` dispute bersifat manual** — sistem hanya mencatat status
    `refunded`, proses transfer balik dana ke pembeli tetap dilakukan Admin/Owner secara
    manual di luar sistem (WhatsApp/telepon), sesuai `05-api-endpoints-mvp.md` §15 & belum
    ada keputusan final soal alur refund detail di `04-catatan-open-decision.md` §7.
11. **Endpoint `POST /api/vehicles/:id/visit-requests`** dipasang sebagai router terpisah
    (`vehicleVisitRequestsRouter`) tapi tetap di-mount di path `/api/vehicles`, supaya
    modul `vehicles` dan `visits` tetap terpisah secara kode meski satu prefix URL — tidak
    ada konflik routing karena pattern path-nya berbeda dari route lain di modul `vehicles`.

Kalau ada dari 11 poin ini yang mau diubah, kabari saya sebelum lanjut ke modul pendukung
(Leads, Article, Notifikasi, Tracking Insight, Audit Log read) di chat berikutnya.

---

## Testing Cepat — Chat Realtime via WebSocket (contoh, pakai `wscat`)

```bash
npm install -g wscat
wscat -c "ws://localhost:4000/ws/chat?token=<access_token>"

# Setelah konek, kirim pesan (format JSON):
{"type":"message:new","conversation_id":"<uuid>","content":"Halo, saya berminat dengan mobil ini"}

# Tandai pesan sudah dibaca:
{"type":"message:read","conversation_id":"<uuid>","up_to_message_id":"<uuid>"}
```

---

## Catatan Keputusan & Asumsi — Chat 1 (dipertahankan, sudah pernah direview)

1. **Login diblokir sampai email terverifikasi** (`EMAIL_NOT_VERIFIED`, HTTP 403).
2. **`registration_open` default `false`** saat migration awal.
3. **Rate limiting** sudah dipasang di `login`, `forgot-password`, `resend-verification`,
   plus limiter global ringan untuk seluruh API.
4. **`POST /api/auth/logout`** — `refresh_token` di body bersifat opsional (device
   tunggal vs semua device).
5. **Endpoint Media Library** (`POST /api/media`) dibatasi role `admin`, `super_admin`,
   `customer`.
6. **Kuota Media Library 1GB** dicek sebelum setiap upload baru (`QUOTA_EXCEEDED` kalau
   terlampaui) — dipakai bersama oleh semua modul yang upload gambar (produk, kunjungan,
   bukti pembayaran).
7. **Seed Super Admin** otomatis mengisi `email_verified_at`.

---

## Testing Cepat (manual, contoh pakai curl)

```bash
# Register
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Budi","email":"budi@example.com","password":"password123"}'

# Login sebagai Super Admin
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<SEED_SUPERADMIN_EMAIL>","password":"<SEED_SUPERADMIN_PASSWORD>"}'

# Buka registrasi
curl -X PATCH http://localhost:4000/api/settings/registration-toggle \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"registration_open": true}'

# Buat listing kendaraan (Admin)
curl -X POST http://localhost:4000/api/vehicles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_access_token>" \
  -d '{"brand":"Toyota","model":"Avanza","year":2019,"mileage":45000,"price":150000000,"location":"Bandung"}'
```

Lihat Postman collection (`LCS-Backend.postman_collection.json`) untuk contoh lengkap
seluruh endpoint Chat 1 + Chat 2, termasuk skrip test otomatis yang menyimpan id/token ke
environment variable untuk endpoint berikutnya.

---

## Yang Belum Termasuk di Chat Ini (menyusul di chat berikutnya)

* Leads System
* Article Management
* Notifikasi Realtime (WebSocket `/ws/notifications` — tabel `notifications` sudah ada
  dari migration Chat 1, tinggal dibangun endpoint & broadcaster-nya, polanya bisa contek
  `chat.ws.ts`)
* Tracking Insight (`GET /api/insights/*`)
* Audit Log read endpoints (`GET /api/audit-logs`) — tabel & fungsi tulis
  (`recordAuditLog`) sudah dipakai luas oleh modul-modul Chat 2 ini, endpoint baca akan
  ditambahkan bersama modul RBAC lanjutan

Kode dari Chat 1 + Chat 2 sudah menyediakan fondasi lengkap yang dipakai ulang oleh semua
modul di atas: `authenticate`/`authorize` middleware, `sendSuccess`/`ApiError`,
`recordAuditLog`, `uploadImage`, koneksi DB, dan pola event-bus in-process
(`chat.events.ts`, bisa dicontek untuk modul Notifikasi) — jadi modul berikutnya tinggal
nambah folder baru di `src/modules/` mengikuti pola yang sama.
