// File: apps/frontend/src/pages/VerifyEmail.tsx
// [FILE BARU]
//
// Halaman standalone untuk:
// 1. Auto-verify saat user klik link dari email (?token=...)
// 2. Form "kirim ulang email verifikasi" — muncul otomatis kalau:
//    - Token tidak ada sama sekali (mis. user diarahkan ke sini karena
//      login gagal dengan alasan EMAIL_NOT_VERIFIED)
//    - Token ada tapi verifikasi gagal / kadaluarsa
//
// Dipanggil dari:
// - Link di email verifikasi (backend: buildVerifyUrl -> /verify-email?token=...)
// - Auth.tsx -> handleLoginSubmit, saat error.code === 'EMAIL_NOT_VERIFIED'
//   redirect ke /verify-email?email=<email_yang_dipakai_login>

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Mail, AlertTriangle, Check, Send, ArrowLeft } from 'lucide-react';

export const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token');
  const emailFromQuery = searchParams.get('email') || '';

  // State: proses auto-verify (hanya jalan kalau ada token)
  const [isVerifying, setIsVerifying] = useState<boolean>(!!token);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [verifyAttempted, setVerifyAttempted] = useState(false);

  // State: form resend
  const [resendEmail, setResendEmail] = useState(emailFromQuery);
  const [isSending, setIsSending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [resendErr, setResendErr] = useState('');

  useEffect(() => {
    if (!token) return;

    const runVerify = async () => {
      setIsVerifying(true);
      try {
        const res = await api.auth.verifyEmail(token);
        setVerifySuccess(!!res.success);
      } catch {
        setVerifySuccess(false);
      } finally {
        setVerifyAttempted(true);
        setIsVerifying(false);
      }
    };

    runVerify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleResendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendMsg('');
    setResendErr('');
    setIsSending(true);
    try {
      const res = await api.auth.resendVerification(resendEmail);
      if (res.success) {
        setResendMsg(res.data?.message || 'Email verifikasi telah dikirim ulang. Silakan cek inbox/spam.');
      } else {
        setResendErr(res.error?.message || 'Gagal mengirim ulang email verifikasi.');
      }
    } catch {
      setResendErr('Gagal terhubung ke server.');
    } finally {
      setIsSending(false);
    }
  };

  const showResendForm = !token || (verifyAttempted && !verifySuccess);

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-xl space-y-6">

        {/* ---- Kasus 1: sedang memverifikasi token ---- */}
        {isVerifying && (
          <div className="text-center space-y-3">
            <h2 className="font-display font-bold text-2xl text-slate-900 tracking-tight">
              Verifikasi Email Anda
            </h2>
            <p className="text-slate-500 text-sm">Menghubungkan ke server untuk verifikasi...</p>
          </div>
        )}

        {/* ---- Kasus 2: verifikasi berhasil ---- */}
        {!isVerifying && verifyAttempted && verifySuccess && (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-green-50 border border-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="font-display font-bold text-2xl text-slate-900 tracking-tight">
              Verifikasi Email Anda
            </h2>
            <p className="text-sm font-semibold text-green-800">Email Berhasil Diverifikasi ✓</p>
            <p className="text-xs text-slate-500">
              Anda sekarang sudah dapat melakukan login dan bertransaksi secara aman.
            </p>
            <button
              onClick={() => navigate('/auth')}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-md"
            >
              Ke Halaman Login
            </button>
          </div>
        )}

        {/* ---- Kasus 3: token gagal/kadaluarsa, atau tidak ada token sama sekali ---- */}
        {showResendForm && !isVerifying && (
          <div className="space-y-5">
            <div className="text-center space-y-2">
              {token ? (
                <>
                  <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <h2 className="font-display font-bold text-2xl text-slate-900 tracking-tight">
                    Tautan Tidak Berlaku
                  </h2>
                  <p className="text-xs text-slate-500">
                    Tautan verifikasi salah, sudah kedaluwarsa, atau sudah pernah dipakai.
                    Masukkan email Anda untuk kami kirimkan tautan baru.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center mx-auto">
                    <Mail className="w-6 h-6 text-amber-600" />
                  </div>
                  <h2 className="font-display font-bold text-2xl text-slate-900 tracking-tight">
                    Verifikasi Email Diperlukan
                  </h2>
                  <p className="text-xs text-slate-500">
                    Akun Anda belum terverifikasi. Cek inbox/spam email Anda, atau kirim
                    ulang tautan verifikasi di bawah ini.
                  </p>
                </>
              )}
            </div>

            {resendMsg && (
              <div className="bg-green-50 border border-green-100 text-green-800 text-xs rounded-xl p-4 flex gap-2.5 items-center">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p>{resendMsg}</p>
              </div>
            )}
            {resendErr && (
              <div className="bg-red-50 border border-red-100 text-red-800 text-xs rounded-xl p-4 flex gap-2.5 items-center">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p>{resendErr}</p>
              </div>
            )}

            <form onSubmit={handleResendSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Email Akun Anda
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="nama@email.com..."
                    className="pl-10 w-full px-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-hidden focus:border-green-600 focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="w-full py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl shadow-md transition-all disabled:bg-slate-300 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {isSending ? 'Mengirim...' : 'Kirim Ulang Tautan Verifikasi'}
              </button>
            </form>

            <Link
              to="/auth"
              className="text-xs text-slate-400 font-semibold hover:text-slate-900 inline-flex items-center gap-1 justify-center w-full pt-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Form Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
