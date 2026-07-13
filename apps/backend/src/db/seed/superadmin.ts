/**
 * Script sekali-jalan untuk membuat akun Super Admin pertama.
 * Dibutuhkan karena endpoint POST /api/users sendiri mensyaratkan role Super Admin
 * (chicken-and-egg problem) — jadi akun pertama harus dibuat lewat jalur ini.
 *
 * Jalankan: npm run seed:superadmin
 * Membaca kredensial dari .env: SEED_SUPERADMIN_NAME, SEED_SUPERADMIN_EMAIL, SEED_SUPERADMIN_PASSWORD
 */
import bcrypt from "bcrypt";
import { pool, query } from "../../config/db";
import { env } from "../../config/env";
import { logger } from "../../config/logger";

async function main() {
  const name = env.SEED_SUPERADMIN_NAME;
  const email = env.SEED_SUPERADMIN_EMAIL;
  const password = env.SEED_SUPERADMIN_PASSWORD;

  if (!name || !email || !password) {
    logger.error(
      "SEED_SUPERADMIN_NAME, SEED_SUPERADMIN_EMAIL, dan SEED_SUPERADMIN_PASSWORD wajib diisi di .env sebelum menjalankan seed ini."
    );
    process.exit(1);
  }

  const existing = await query(`SELECT id FROM users WHERE email = $1`, [email.toLowerCase()]);
  if (existing.rows.length > 0) {
    logger.info(`Super Admin dengan email ${email} sudah ada, seed dilewati.`);
    await pool.end();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, role, email_verified_at, is_active)
     VALUES ($1, $2, $3, 'super_admin', now(), true)
     RETURNING id, name, email, role`,
    [name, email.toLowerCase(), passwordHash]
  );

  logger.info({ user: rows[0] }, "✅ Super Admin berhasil dibuat.");
  await pool.end();
}

main().catch(async (err) => {
  logger.error({ err }, "Gagal membuat Super Admin");
  await pool.end();
  process.exit(1);
});
