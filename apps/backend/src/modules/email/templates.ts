export function verificationEmailTemplate(name: string, verifyUrl: string) {
  return {
    subject: "Verifikasi Email Anda",
    html: `<p>Halo ${name},</p>
<p>Terima kasih telah mendaftar. Silakan klik link berikut untuk verifikasi email Anda (berlaku 24 jam):</p>
<p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
  };
}

export function resetPasswordEmailTemplate(name: string, resetUrl: string) {
  return {
    subject: "Reset Password",
    html: `<p>Halo ${name},</p>
<p>Kami menerima permintaan reset password. Klik link berikut untuk mengatur password baru (berlaku 1 jam):</p>
<p><a href="${resetUrl}">${resetUrl}</a></p>
<p>Jika Anda tidak meminta ini, abaikan email ini.</p>`,
  };
}
