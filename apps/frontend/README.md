# Platform Jual Beli Kendaraan Second & Suku Cadang Aman (LCS)

Platform transaksi kendaraan bekas dan suku cadang aman dengan perlindungan escrow dan verifikasi fisik dari admin sistem.

## Konfigurasi Lingkungan (.env)

Untuk menghubungkan aplikasi frontend React (Vite) ini dengan backend produksi asli, silakan buat file `.env` di root direktori dengan referensi berikut:

```env
# URL untuk menghubungkan platform ke Backend API asli (kosongkan untuk menggunakan Simulator Mode offline-first)
VITE_API_URL=https://api.lcs.id

# URL untuk websocket server real-time chat (kosongkan untuk menggunakan Simulator Mode)
VITE_WS_URL=wss://api.lcs.id
```

## Mode Simulator vs Mode Real-API

Aplikasi ini dilengkapi dengan dua mode operasional dinamis:

1. **Mode Simulator (Offline-First / Mock Mode):**
   - **Kapan aktif:** Mode ini aktif secara otomatis jika variabel lingkungan `VITE_API_URL` dikosongkan atau tidak didefinisikan (`useRealApi()` mendeteksi nilai kosong).
   - **Fungsi:** Menyimpan data di `localStorage` peramban (browser) untuk melakukan demonstrasi fitur lengkap, mulai dari registrasi akun, login dengan berbagai peran (Super Admin, Owner, Admin Sistem, Customer), simulasi pengiriman email verifikasi, penulisan artikel SEO, pengelolaan katalog, pengajuan kunjungan fisik, hingga simulasi escrow dana penampung.

2. **Mode Real-API (Production Mode):**
   - **Kapan aktif:** Aktif jika variabel lingkungan `VITE_API_URL` telah diisi dengan alamat API Server Backend yang valid.
   - **Fungsi:** Semua transaksi data, autentikasi sesi, verifikasi berkas/pembayaran, dan pengiriman notifikasi akan langsung diteruskan ke RESTful API backend server yang asli secara aman.

## Konfigurasi Nginx untuk Deployment Production (Single-Page Application)

Karena aplikasi ini dibangun sebagai Single-Page Application (SPA) menggunakan `react-router-dom` dengan Client-side Routing, server web produksi (seperti Nginx) harus dikonfigurasi untuk mengalihkan semua permintaan rute tak dikenal kembali ke `index.html`.

Berikut adalah contoh konfigurasi blok server Nginx (`nginx.conf`) yang direkomendasikan:

```nginx
server {
    listen 80;
    server_name lcs.id www.lcs.id;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Penanganan cache opsional untuk aset statis Vite
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

Catatan: Instruksi `try_files $uri $uri/ /index.html;` memastikan bahwa saat pengguna memuat ulang halaman dashboard (seperti `/dashboard/customer` atau `/dashboard/admin-sistem`), Nginx tidak akan menghasilkan kesalahan 404, melainkan menyerahkan pemrosesan rute sepenuhnya kepada router aplikasi React.
