// File: apps/frontend/src/pages/ResetPassword.tsx
// [FILE BARU]
//
// Halaman standalone self-service untuk customer yang klik link reset password
// dari email (backend: buildResetUrl -> /reset-password?token=...).
//
// PENTING: ini BEDA dengan ResetPasswordModal.tsx yang sudah ada — itu tool
// ADMIN untuk reset paksa akun user lain. Ini untuk CUSTOMER reset sandi
// akunnya sendiri via token dari email.

import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Lock, AlertTriangle, Check, KeyRound, ArrowLeft } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Tidak ada token sama sekali -> jangan tampilkan form, arahkan minta link baru
  if (!token) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-xl space-y-4">
          <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="font-display font-bold text-2xl text-slate-900 tracking-tight">
            Tautan Tidak Ditemukan
          </h2>
          <p className="text-xs text-slate-500">
            Halaman ini hanya bisa diakses melalui tautan reset sandi dari email Anda.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="w-full py-2.5 bg-slate-100 text-slate-800 rounded-xl font-bold text-sm border border-slate-200"
          >
            Ke Halaman Lupa Sandi
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('Sandi baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi sandi tidak cocok.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.auth.resetPassword({ token, new_password: newPassword });
      if (res.success) {
        setSuccessMsg(res.data?.message || 'Sandi Anda berhasil diset ulang.');
      } else {
        setErrorMsg(
          res.error?.message ||
            'Tautan reset sandi ini sudah kedaluwarsa atau pernah dipakai. Minta tautan baru lewat halaman Lupa Sandi.'
        );
      }
    } catch {
      setErrorMsg('Gagal terhubung ke server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto">
            <KeyRound className="w-6 h-6 text-slate-700" />
          </div>
          <h2 className="font-display font-bold text-2xl text-slate-900 tracking-tight">
            Atur Ulang Sandi
          </h2>
          <p className="text-xs text-slate-500">Masukkan sandi baru untuk akun Anda.</p>
        </div>

        {successMsg ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-100 text-green-800 text-xs rounded-xl p-4 flex gap-2.5 items-center">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p>{successMsg}</p>
            </div>
            <button
              onClick={() => navigate('/auth')}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-md"
            >
              Ke Halaman Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="bg-red-50 border border-red-100 text-red-800 text-xs rounded-xl p-4 flex gap-2.5 items-center">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p>{errorMsg}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Sandi Baru
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter..."
                  className="pl-10 w-full px-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-hidden focus:border-green-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Konfirmasi Sandi Baru
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi sandi baru..."
                  className="pl-10 w-full px-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-hidden focus:border-green-600 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl shadow-md transition-all disabled:bg-slate-300"
            >
              {isSubmitting ? 'Menyimpan...' : 'Atur Ulang Sandi'}
            </button>

            <Link
              to="/auth"
              className="text-xs text-slate-400 font-semibold hover:text-slate-900 inline-flex items-center gap-1 justify-center w-full pt-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Form Login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
};
