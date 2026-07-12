# LCS Backend — MVP Lengkap (Chat 1 + Chat 2 + Chat 3)

Backend MVP untuk **Sistem Jual Beli Kendaraan Second dan Suku Cadang**, dibangun dengan
Node.js + TypeScript + Express + PostgreSQL (raw `pg`, migration via `node-pg-migrate`).

Ini adalah **chat terakhir** dari rangkaian pembangunan backend MVP. Setelah chat ini,
backend mencakup **seluruh endpoint** di `05-api-endpoints-mvp.md`.

**Chat 1** — 4 modul fondasi:
1. Setup Project & Infrastruktur
2. Authentication & User Management (`02c-addendum-auth-email-brevo.md`)
3. Platform Settings
4. Media Library (Cloudflare R2 + sharp/WebP)

**Chat 2** — 5 modul fitur unggulan / inti bisnis:
1. Product Management — Kendaraan (`vehicles`)
2. Product Management — Suku Cadang (`spare_parts`)
3. Inspeksi Dokumen & Kunjungan Fisik (`visit_requests`, `visit_photos`)
4. Chat Realtime (REST + WebSocket `/ws/chat`)
5. Transaksi & Payment Manual / Escrow-lite (`transactions`)

**Chat 3 (chat ini)** — 5 modul pendukung yang menyelesaikan seluruh cakupan MVP:
1. Leads System (`leads`)
2. Article Management (`articles`) — CRUD + SEO metadata + slug unik
3. Notifikasi Realtime (`notifications`) — REST + WebSocket `/ws/notifications`, **di-trigger
   otomatis** dari event modul lain (chat, kunjungan, transaksi, verifikasi dokumen)
4. Tracking Insight (`GET /api/insights/*`) — data internal (leads, transaksi, artikel);
   integrasi GTM/GA4 tetap murni client-side
5. Audit Log — endpoint query (`GET /api/audit-logs`); logic tulis (`recordAuditLog`) sudah
   ada sejak Chat 1/2, di chat ini juga ditambahkan ke 3 titik yang sebelumnya terlewat
   (lihat §"Perbaikan Audit Log" di bawah)

---

## 1. Prasyarat

* Node.js 20+
* PostgreSQL sudah jalan (lewat pgAdmin/instalasi lokal — buat database kosong dulu, misal `lcs_db`)
* Akun Cloudflare R2 (untuk Media Library) — wajib untuk upload media (foto kendaraan, foto
  kunjungan, bukti pembayaran, cover artikel)
* Akun Brevo (untuk kirim email verifikasi/reset password) — kalau `BREVO_API_KEY` kosong,
  pengiriman email akan gagal (tercatat sebagai `failed` di `email_logs`), endpoint lain
  tetap berjalan normal

## 2. Install Dependency

```bash
cd backend
npm install
```

**Tidak ada dependency baru di Chat 3** — modul Leads, Article, Notifikasi, Insight, dan
Audit Log semuanya memakai package yang sudah terpasang sejak Chat 1/2 (`express`, `pg`,
`ws`, `zod`, dll). WebSocket `/ws/notifications` memakai package `ws` yang sama dengan
`/ws/chat`.

## 3. Setup Environment

```bash
cp .env.example .env
```

Isi minimal (lihat detail tiap variabel di `.env.example`): `DATABASE_URL`,
`JWT_ACCESS_SECRET`, `JWT_EMAIL_SECRET`, `APP_BASE_URL`, `BREVO_API_KEY`,
`BREVO_SENDER_EMAIL`, `R2_*`, `SEED_SUPERADMIN_*`.

**Tidak ada environment variable baru di Chat 3.**

Semua variabel divalidasi otomatis saat server start (`src/config/env.ts`).

> **Catatan (bukan bug baru, sudah ada sejak Chat 1, mohon diperhatikan saat deploy):**
> `PGSSL` divalidasi dengan `z.coerce.boolean()`, dan `z.coerce.boolean()` bawaan Zod
> men-coerce STRING APAPUN yang tidak kosong (termasuk literal string `"false"`) menjadi
> `true` — jadi `PGSSL=false` di `.env` saat ini akan terbaca sebagai `true`. Workaround
> sementara: jangan set `PGSSL` sama sekali kalau tidak butuh SSL (default `false` akan
> dipakai), atau set eksplisit hanya kalau butuh `true`. Perbaikan permanen (ganti ke
> `.transform((v) => v.trim().toLowerCase() === "true")`) belum dilakukan di chat ini
> karena di luar scope modul yang diminta — silakan konfirmasi kalau mau saya perbaiki di
> `src/config/env.ts`.

## 4. Jalankan Migration

Migration untuk **seluruh tabel MVP** (termasuk `leads`, `articles`, `notifications`,
`audit_logs`, dan seluruh enum termasuk `notification_type`, `lead_source`,
`article_status`) **sudah dibuat sejak Chat 1** — **tidak ada migration baru di Chat 3
ini**. Modul-modul Chat 3 murni menambah layer aplikasi (repository/service/
controller/routes) di atas skema yang sudah ada.

```bash
npm run migrate:up
```

Rollback migration terakhir:
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
`GET /health`.

**Dua WebSocket berjalan di `http.Server` yang sama** (bukan port terpisah), dibedakan
lewat pathname saat event `upgrade`:
* `ws://localhost:4000/ws/chat` — Chat Realtime (Chat 2)
* `ws://localhost:4000/ws/notifications` — Notifikasi Realtime (Chat 3, baru)

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
│   ├── migrations/ # DDL berurutan (node-pg-migrate) — semua tabel MVP sudah lengkap sejak Chat 1
│   └── seed/        # script seed super admin
├── modules/
│   ├── auth/              # register, login, refresh+rotate, verifikasi, reset password
│   ├── users/              # RBAC/User Management (Super Admin) + reset password manual
│   ├── email/               # sendEmail() terpusat + integrasi Brevo + email_logs
│   ├── platform-settings/
│   ├── media/                # upload gambar -> sharp -> WebP -> R2 -> media_assets
│   ├── audit-log/             # recordAuditLog() + checkCooldown() + [BARU] query endpoints
│   ├── vehicles/               # Product Management — Kendaraan
│   ├── spare-parts/            # Product Management — Suku Cadang
│   ├── visits/                  # Inspeksi Dokumen & Kunjungan Fisik
│   ├── chat/                     # Chat Realtime — REST + WebSocket (/ws/chat)
│   ├── transactions/              # Transaksi & Payment Manual (Escrow-lite)
│   ├── leads/                      # [BARU] Leads System
│   ├── articles/                    # [BARU] Article Management
│   ├── notifications/                # [BARU] Notifikasi Realtime — REST + WS (/ws/notifications)
│   └── insights/                      # [BARU] Tracking Insight
├── middlewares/     # authenticate, authorize, validate, rateLimiter, errorHandler
├── utils/            # ApiError, apiResponse, asyncHandler, pagination
├── app.ts
└── server.ts
```

Konvensi tiap modul tetap sama persis dari Chat 1: `routes → controller → service (business
logic) → repository (SQL)`, memakai `ApiError`, `sendSuccess`, `asyncHandler`,
`parsePagination`/`buildMeta`, `validate` (Zod), `authenticate`/`authorize`, dan
`recordAuditLog`.

---

## Event Notifikasi & Titik Pemicu (Modul 3)

Notifikasi **tidak berdiri sendiri** — setiap baris di tabel `notifications` dipicu dari
titik transisi di modul lain lewat `createNotificationService()` /
`createNotificationForManyService()` (`src/modules/notifications/notifications.service.ts`).
Daftar lengkap titik pemicu yang ditambahkan di chat ini:

| # | Event Pemicu | Dipasang di | Tipe Notifikasi | Penerima |
|---|---|---|---|---|
| 1 | Pesan chat baru masuk | `chat/chat.service.ts` → `sendMessageService()` | `chat_message` | Seluruh partisipan conversation SELAIN pengirim |
| 2 | Jadwal kunjungan dikonfirmasi | `visits/visits.service.ts` → `scheduleVisitRequestService()` | `visit_status` | Customer pemilik visit request |
| 3 | Kunjungan selesai / dibatalkan | `visits/visits.service.ts` → `updateVisitRequestStatusService()` | `visit_status` | Customer pemilik visit request |
| 4 | Pembayaran diverifikasi (→ `funds_held`) | `transactions/transactions.service.ts` → `verifyPaymentService()` | `transaction_status` | Buyer (status terverifikasi) **+** seluruh Owner (masuk approval queue) |
| 5 | Dana dilepas ke penjual | `transactions/transactions.service.ts` → `releaseTransactionService()` | `transaction_status` | Buyer |
| 6 | Transaksi di-dispute | `transactions/transactions.service.ts` → `disputeTransactionService()` | `transaction_status` | Buyer (kalau bukan dia sendiri yang mengajukan) **+** seluruh Owner |
| 7 | Dispute diputuskan (released/refunded/cancelled) | `transactions/transactions.service.ts` → `resolveTransactionService()` | `transaction_status` | Buyer |
| 8 | Transaksi dibatalkan oleh Admin | `transactions/transactions.service.ts` → `cancelTransactionService()` | `transaction_status` | Buyer (kalau bukan dia sendiri yang membatalkan) |
| 9 | Status dokumen kendaraan berubah | `vehicles/vehicles.service.ts` → `updateDocumentStatusService()` | `document_status` | Customer yang punya `visit_request` aktif (`requested`/`scheduled`) untuk kendaraan tsb |

Setiap trigger memanggil `createNotificationService()` yang: (1) INSERT ke tabel
`notifications` (riwayat persisten, dipakai oleh `GET /api/notifications` & badge
unread), dan (2) emit event in-process (`notifications.events.ts`, pola sama dengan
`chat.events.ts`) yang ditangkap `notifications.ws.ts` untuk push realtime kalau
penerimanya sedang online. Kalau offline, notifikasi tetap tersimpan dan baru muncul
saat client fetch `GET /api/notifications` berikutnya.

---

## Perbaikan Audit Log (ditemukan saat audit kode sebelum membangun endpoint query)

Sesuai instruksi, sebelum membangun `GET /api/audit-logs`, dilakukan audit ke seluruh
service yang sudah ada terhadap daftar wajib di `03-rbac-alur-admin.md` §4. Hasilnya:
**hampir semua aksi krusial sudah tercatat** (product CRUD, verifikasi dokumen, transaksi,
moderasi foto kunjungan, platform settings). Satu gap ditemukan dan sudah diperbaiki di
chat ini:

* **`users/users.service.ts` — `createUserService`, `updateUserService`,
  `deleteUserService`** (dipakai oleh Super Admin untuk membuat/mengubah role-status/
  menonaktifkan akun, termasuk akun Admin/Owner lain) **sebelumnya TIDAK memanggil
  `recordAuditLog`**. Ini krusial karena aksi ini langsung mengubah hak akses user lain.
  Sudah ditambahkan `action_type`: `create_user`, `update_user`, `deactivate_user`.
  (`adminResetPasswordService` di file yang sama sudah benar sejak awal.)

Tidak ditemukan gap lain yang wajib menurut daftar `03-rbac-alur-admin.md` §4 (verifikasi
dokumen produk, perubahan status transaksi, approval/rejection release dana, moderasi foto
kunjungan, perubahan data produk, perubahan pengaturan sistem Super Admin — semua sudah
tercatat sejak Chat 1/2).

---

## Catatan "Artikel Terpopuler" (Tracking Insight)

`GET /api/insights/overview` **tidak bisa menghitung "artikel terpopuler" murni dari
database internal**, karena tracking pageview/traffic ada di GTM/GA4 yang sifatnya
client-side (di luar scope backend MVP, sesuai catatan di `05-api-endpoints-mvp.md` §11:
"kecuali nanti dibutuhkan server-side tagging, di luar scope MVP"). Sebagai proxy
sementara, field `recent_published_articles` mengembalikan artikel published terbaru
(bukan hasil ranking popularitas sesungguhnya). Kalau nanti butuh angka pageview riil,
opsinya: (a) tarik data dari GA4 Reporting API di frontend/BFF layer, atau (b) tambah kolom
`view_count` + endpoint increment di backend (di luar scope MVP saat ini).

---

## Ringkasan Endpoint: Implementasi vs `05-api-endpoints-mvp.md`

Legenda: ✅ = sudah diimplementasikan.

| Section | Endpoint | Status |
|---|---|---|
| §1 Auth | Semua 11 endpoint (`register` s/d `PATCH /me/password`) | ✅ (Chat 1) |
| §2 Vehicles | Semua 11 endpoint | ✅ (Chat 2) |
| §3 Spare Parts | Semua 9 endpoint | ✅ (Chat 2) |
| §4 Inspeksi & Kunjungan | Semua 9 endpoint | ✅ (Chat 2) |
| §5 Chat Realtime | 7 endpoint REST + `WS /ws/chat` | ✅ (Chat 2) |
| §6 Transaksi | Semua 11 endpoint | ✅ (Chat 2) |
| §7 Leads | `POST /api/leads`, `GET /api/leads`, `GET /api/leads/:id` | ✅ (Chat 3) |
| §8 Article | Semua 7 endpoint | ✅ (Chat 3) |
| §9 Media Library | Semua 4 endpoint | ✅ (Chat 1) |
| §10 Notifikasi | `GET/PATCH /api/notifications*` + `WS /ws/notifications` | ✅ (Chat 3) |
| §11 Tracking Insight | `overview`, `leads-report`, `transactions-report` | ✅ (Chat 3) |
| §12 Audit Log | `GET /api/audit-logs`, `GET /api/audit-logs/:id` | ✅ (Chat 3) |
| §13 Platform Settings | Semua 4 endpoint | ✅ (Chat 1) |
| §14 RBAC/User Mgmt | Semua 5 endpoint | ✅ (Chat 1) |
| §16 (02c) Email Logs | `GET /api/email-logs`, `GET /api/email-logs/usage-today` | ✅ (Chat 1) |

**Seluruh endpoint di `05-api-endpoints-mvp.md` dan `02c-addendum` sudah terimplementasi.**
Silakan cek ulang terhadap Postman collection (`LCS-Backend.postman_collection.json`) untuk
verifikasi lapangan sebelum masuk tahap testing/integrasi dengan frontend.

---

## Testing Cepat — Notifikasi Realtime via WebSocket (contoh, pakai `wscat`)

```bash
npm install -g wscat
wscat -c "ws://localhost:4000/ws/notifications?token=<access_token>"

# Server akan push otomatis event seperti ini saat trigger di atas terjadi:
# {"event":"notification:new","data":{"id":"...","type":"chat_message","title":"Pesan baru masuk",...}}
```

## Testing Cepat — Chat Realtime via WebSocket (dari Chat 2, tetap berlaku)

```bash
wscat -c "ws://localhost:4000/ws/chat?token=<access_token>"
{"type":"message:new","conversation_id":"<uuid>","content":"Halo, saya berminat dengan mobil ini"}
{"type":"message:read","conversation_id":"<uuid>","up_to_message_id":"<uuid>"}
```

---

## Catatan Keputusan & Asumsi Penting — Chat 3 (mohon direview)

1. **Slug artikel di-generate otomatis dari title** kalau tidak dikirim eksplisit di
   `POST`/`PUT /api/articles` (mendukung requirement SEO-friendly). Kalau slug bentrok
   dengan artikel lain, otomatis ditambah suffix angka (`-2`, `-3`, dst) — tidak pernah
   gagal request karena slug duplikat.
2. **Endpoint admin artikel mengikuti pola vehicles**: CRUD (`POST/PUT/PATCH status/DELETE
   /api/articles`) tetap di path utama `/api/articles`, hanya listing "termasuk draft"
   yang dipisah ke `/api/admin/articles` — persis strukturnya sama dengan modul `vehicles`.
3. **`GET /api/leads`, `GET /api/leads/:id`** dibuka untuk role `owner`, `admin`, DAN
   `super_admin` (dokumen menyebut "Owner, Admin" — `super_admin` ditambahkan konsisten
   dengan pola modul lain yang selalu memberi Super Admin akses penuh sebagai hak absolut,
   sesuai `03-rbac-alur-admin.md` §1.1).
4. **`POST /api/leads` sengaja TIDAK memanggil `recordAuditLog`** — endpoint ini Public
   (diisi Customer/pengunjung biasa), dan `03-rbac-alur-admin.md` §4 hanya mewajibkan
   pencatatan aksi staff (Admin/Owner/Super Admin), bukan aktivitas publik biasa.
5. **WebSocket `/ws/notifications` murni satu arah** (server → client push
   `notification:new`) — tidak ada event yang diterima dari client seperti di `/ws/chat`.
   Auth memakai pola query param `?token=` yang sama.
6. **Notifikasi ke banyak penerima sekaligus** (mis. seluruh Owner saat dispute) memakai
   `createNotificationForManyService()`, yang meng-insert 1 baris `notifications` PER user
   penerima (bukan 1 baris shared) — supaya status `is_read` per-user independen, konsisten
   dengan filosofi `message_reads` di modul chat.
7. **Notifikasi `document_status`** ditujukan ke customer yang punya `visit_request` aktif
   untuk kendaraan terkait (bukan ke seluruh customer) — interpretasi paling masuk akal
   karena tidak ada mekanisme wishlist/follow produk di skema MVP. Kalau nanti ada fitur
   Wishlist (fitur "menyusul" di `01-spesifikasi-fitur-mvp.md` §1.C) diaktifkan, titik
   pemicu ini sebaiknya diperluas untuk juga notify user yang wishlist kendaraan tsb.
8. **"Artikel terpopuler" di Tracking Insight** memakai proxy "artikel published terbaru"
   — lihat penjelasan detail di bagian tersendiri di atas.
9. **Audit Log query endpoint default Super Admin only** — sesuai default sementara di
   `04-catatan-open-decision.md` §6 (akses Owner untuk transaksi tanggung jawabnya belum
   diputuskan). Query sudah mendukung filter `target_entity` sehingga gampang dibuka
   parsial untuk Owner nanti tanpa ubah kontrak API.
10. **Gap audit log di `users.service.ts` sudah diperbaiki** — lihat bagian "Perbaikan
    Audit Log" di atas.

Kalau ada dari 10 poin ini yang mau diubah, kabari sebelum lanjut ke tahap
testing/integrasi frontend.

---

## Catatan Keputusan & Asumsi — Chat 2 (dipertahankan, sudah pernah direview)

1. `license_plate` kendaraan TIDAK PERNAH ter-expose di response publik.
2. Endpoint admin (`GET /api/admin/vehicles`, `GET /api/admin/spare-parts`) dipasang di
   path terpisah, sesuai `05-api-endpoints-mvp.md`.
3. Upload foto hasil kunjungan: default Admin only (`VISIT_PHOTO_UPLOAD_ROLES`).
4. Status `visit_requests` TIDAK otomatis mengubah status listing kendaraan.
5. Chat — mekanisme assignment Admin: General Queue (tanpa auto-assign).
6. WebSocket `/ws/chat` — auth via query param `?token=`, broadcast via `chat.events.ts`.
7. Alur status transaksi (Escrow-lite) — lihat komentar di `transactions.service.ts`.
8. Audit log wajib di setiap transisi status transaksi.
9. `payment_gateway_ref` sengaja tidak pernah diisi/dipakai — reserved Fase 2.
10. Refund saat `resolve` dispute bersifat manual (status tercatat, transfer di luar sistem).
11. `POST /api/vehicles/:id/visit-requests` dipasang sebagai router terpisah tapi tetap
    di-mount di path `/api/vehicles`.

## Catatan Keputusan & Asumsi — Chat 1 (dipertahankan, sudah pernah direview)

1. Login diblokir sampai email terverifikasi (`EMAIL_NOT_VERIFIED`, HTTP 403).
2. `registration_open` default `false` saat migration awal.
3. Rate limiting di `login`, `forgot-password`, `resend-verification`, + limiter global.
4. `POST /api/auth/logout` — `refresh_token` di body opsional.
5. `POST /api/media` dibatasi role `admin`, `super_admin`, `customer`.
6. Kuota Media Library 1GB dicek sebelum setiap upload baru.
7. Seed Super Admin otomatis mengisi `email_verified_at`.

---

## Testing Cepat (manual, contoh pakai curl)

```bash
# Submit lead dari Contact Form (Public)
curl -X POST http://localhost:4000/api/leads \
  -H "Content-Type: application/json" \
  -d '{"source":"contact_form","name":"Budi","phone":"081234567890","message":"Tanya mobil Avanza"}'

# Buat artikel (Admin)
curl -X POST http://localhost:4000/api/articles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_access_token>" \
  -d '{"title":"Tips Merawat Rem Motor","content":"...","category":"maintenance"}'

# Lihat notifikasi milik sendiri
curl http://localhost:4000/api/notifications \
  -H "Authorization: Bearer <access_token>"

# Dashboard insight (Owner/Super Admin)
curl http://localhost:4000/api/insights/overview \
  -H "Authorization: Bearer <owner_access_token>"

# Audit log (Super Admin)
curl "http://localhost:4000/api/audit-logs?target_entity=transactions" \
  -H "Authorization: Bearer <superadmin_access_token>"
```

Lihat Postman collection (`LCS-Backend.postman_collection.json`) untuk contoh lengkap
seluruh endpoint MVP (Chat 1 + 2 + 3), termasuk skrip test otomatis yang menyimpan id/token
ke environment variable untuk endpoint berikutnya.

---

## Status: MVP Backend Selesai

Seluruh 5 modul pendukung di chat ini melengkapi cakupan `05-api-endpoints-mvp.md`.
Langkah berikutnya yang disarankan (di luar scope backend, sesuai roadmap
`00-overview-strategi-produk-versi-cepat.md`): integrasi dengan frontend (Google AI
Studio), testing end-to-end via Postman collection, lalu persiapan deployment (VPS +
Docker, sesuai `spesifikasi_sistem_jual_beli_kendaraan.md` §6 — catatan: dokumen tsb
menyebut Docker Compose, sedangkan kesepakatan teknis terbaru di memory project TIDAK
memakai Docker Compose untuk lokal, mohon dikonfirmasi ulang strategi deployment VPS-nya
sebelum production).
