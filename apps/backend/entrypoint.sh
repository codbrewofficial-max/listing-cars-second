#!/bin/sh
set -e

echo "🔄 Menjalankan migrasi database (aman dijalankan berulang — idempotent)..."
npm run migrate:up

echo "✅ Migrasi selesai. Menjalankan server..."
exec node dist/server.js
