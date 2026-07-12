import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { User } from '../types';
import { X, KeyRound, AlertTriangle, Clock, Check } from 'lucide-react';

interface ResetPasswordModalProps {
  user: User;
  onClose: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ user, onClose }) => {
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Cooldown timer state
  const [cooldownExpiresAt, setCooldownExpiresAt] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Update timer every second
  useEffect(() => {
    if (!cooldownExpiresAt) return;

    const interval = setInterval(() => {
      const expires = new Date(cooldownExpiresAt).getTime();
      const diff = expires - Date.now();

      if (diff <= 0) {
        setCooldownExpiresAt(null);
        setErrorMsg('');
        setTimeLeft('');
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        const pad = (num: number) => num.toString().padStart(2, '0');
        setTimeLeft(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownExpiresAt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword && !cooldownExpiresAt) return;

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.users.resetPasswordManual(user.id, { new_password: newPassword });
      
      if (res.success) {
        setSuccessMsg(`Sandi berhasil diatur ulang langsung menjadi: "${newPassword}". Silakan sampaikan sandi baru ini secara aman ke user.`);
        setNewPassword('');
      } else {
        // Handle Cooldown explicit error code
        if (res.error && res.error.code === 'COOLDOWN_ACTIVE') {
          // Robust checking as per requirement: check error.meta.expires_at with fallback
          const expiresAt = res.error.meta?.expires_at;
          if (expiresAt) {
            setCooldownExpiresAt(expiresAt);
            setErrorMsg(res.error.message || 'Reset password dalam masa cooldown.');
          } else {
            // Defensive coding fallback if meta.expires_at is missing:
            setErrorMsg(res.error.message || 'Masa cooldown 24 jam aktif untuk user ini.');
          }
        } else {
          setErrorMsg(res.error?.message || 'Gagal menyetel ulang sandi.');
        }
      }
    } catch (err: any) {
      setErrorMsg('Gagal terhubung ke server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all border border-slate-100">
        
        {/* Header */}
        <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-5 h-5 text-green-500" />
            <div>
              <h3 className="font-display font-bold text-base">Reset Sandi Manual</h3>
              <p className="text-xs text-slate-400">Pengguna: {user.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-lg p-1 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Information box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-500 leading-relaxed">
            Fitur ini digunakan saat kuota email harian habis. Sandi baru akan <strong className="text-slate-800">langsung aktif</strong> tanpa mengirim email. Admin wajib menginfokan sandi baru ke pengguna secara mandiri.
          </div>

          {/* Success State */}
          {successMsg && (
            <div className="bg-green-50 border border-green-100 text-green-800 rounded-xl p-4 flex gap-2.5 text-sm animate-fade-in">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p>{successMsg}</p>
            </div>
          )}

          {/* Cooldown Active Warning */}
          {cooldownExpiresAt && (
            <div className="bg-amber-50 border border-amber-100 text-amber-900 rounded-xl p-4 space-y-2.5 animate-fade-in">
              <div className="flex gap-2.5 text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-semibold">Masa Cooldown Aktif</p>
                  <p className="text-xs leading-relaxed text-amber-800">{errorMsg}</p>
                </div>
              </div>
              
              {/* Dynamic countdown timer UI */}
              {timeLeft && (
                <div className="flex items-center gap-2 bg-white/60 px-3 py-1.5 rounded-lg border border-amber-200/50 text-xs w-fit">
                  <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                  <span>Dapat dicoba kembali dalam: <strong className="font-mono text-slate-900 font-bold">{timeLeft}</strong></span>
                </div>
              )}
            </div>
          )}

          {/* Regular Error State */}
          {errorMsg && !cooldownExpiresAt && (
            <div className="bg-red-50 border border-red-100 text-red-800 rounded-xl p-4 flex gap-2.5 text-xs animate-fade-in">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p>{errorMsg}</p>
            </div>
          )}

          {/* Input field (disabled if cooldown active) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Sandi Baru *
            </label>
            <input
              type="text"
              required={!cooldownExpiresAt}
              disabled={!!cooldownExpiresAt || !!successMsg}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={cooldownExpiresAt ? "Tombol terkunci masa cooldown..." : "Masukkan sandi baru langsung..."}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:border-green-600 bg-slate-50 focus:bg-white disabled:bg-slate-100 disabled:text-slate-400 transition-all"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors"
            >
              Tutup
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !!cooldownExpiresAt || !!successMsg}
              className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg disabled:bg-slate-200 disabled:text-slate-400 shadow-sm transition-all duration-150"
            >
              {isSubmitting ? 'Menyimpan...' : 'Atur Ulang Sandi'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
