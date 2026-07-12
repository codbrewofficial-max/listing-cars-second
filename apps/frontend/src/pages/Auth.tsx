import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, useAppState } from '../context/AppContext';
import { api } from '../lib/api';
import { Mail, Lock, User as UserIcon, Phone, ShieldCheck, KeyRound, AlertTriangle, Check, ArrowLeft, Send } from 'lucide-react';

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, login, verifyEmail, isAuthenticated } = useAuth();
  const { registrationOpen } = useAppState();

  const redirectPath = searchParams.get('redirect') || '/';
  const verifyToken = searchParams.get('verify_token');

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Registration Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Forgot Password States
  const [forgotEmail, setForgotEmail] = useState('');
  const [cooldownExpiresAt, setCooldownExpiresAt] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Registration Closed Modal Trigger
  const [showClosedModal, setShowClosedModal] = useState(false);

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated && !verifyToken) {
      navigate(redirectPath);
    }
  }, [isAuthenticated, navigate, redirectPath, verifyToken]);

  // Handle auto email verification if token present
  useEffect(() => {
    if (verifyToken) {
      const runVerify = async () => {
        setIsLoadingVerify(true);
        const ok = await verifyEmail(verifyToken);
        if (ok) {
          setVerifySuccess(true);
        } else {
          setVerifyError(true);
        }
        setIsLoadingVerify(false);
      };
      runVerify();
    }
  }, [verifyToken]);

  const [isLoadingVerify, setIsLoadingVerify] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [verifyError, setVerifyError] = useState(false);

  // Forgot password cooldown interval timer
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
        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownExpiresAt]);

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const res = await login(loginEmail, loginPassword);
      if (res.success) {
        navigate(redirectPath);
      } else {
        setErrorMsg(res.error?.message || 'Email atau sandi salah.');
      }
    } catch (err) {
      setErrorMsg('Gagal terhubung ke server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Register (checking registrationOpen status!)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!registrationOpen) {
      setShowClosedModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.auth.register({
        name: regName,
        email: regEmail,
        phone: regPhone,
        password: regPassword
      });

      if (res.success) {
        setSuccessMsg('Pendaftaran berhasil! Tautan verifikasi email telah dikirim. Silakan periksa inbox atau spam box email Anda.');
        setRegName('');
        setRegEmail('');
        setRegPhone('');
        setRegPassword('');
      } else {
        setErrorMsg(res.error?.message || 'Registrasi gagal.');
      }
    } catch (err) {
      setErrorMsg('Gagal terhubung ke server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Forgot Password (reset link request) with explicit cooldown check
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    setIsSubmitting(true);
    try {
      const res = await api.auth.forgotPassword(forgotEmail);
      if (res.success) {
        setSuccessMsg('Tautan instruksi setel ulang sandi telah dikirim ke email Anda.');
      } else {
        // Handle Cooldown explicit error code
        if (res.error && res.error.code === 'COOLDOWN_ACTIVE') {
          const expiresAt = res.error.meta?.expires_at;
          if (expiresAt) {
            setCooldownExpiresAt(expiresAt);
            setErrorMsg(res.error.message || 'Masa tunggu reset kata sandi aktif.');
          } else {
            // Defensive coding fallback
            setErrorMsg(res.error.message || 'Permintaan reset sandi baru saja dilakukan. Silakan coba lagi beberapa saat.');
          }
        } else {
          setErrorMsg(res.error?.message || 'Gagal mengirim email reset sandi.');
        }
      }
    } catch (err) {
      setErrorMsg('Gagal terhubung ke server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Email Verification status
  if (verifyToken) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-xl space-y-6">
          <h2 className="font-display font-bold text-2xl text-slate-900 tracking-tight">Verifikasi Email Anda</h2>
          
          {isLoadingVerify ? (
            <p className="text-slate-500 text-sm">Menghubungkan ke server untuk verifikasi...</p>
          ) : verifySuccess ? (
            <div className="space-y-4">
              <div className="w-12 h-12 bg-green-50 border border-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm font-semibold text-green-800">Email Berhasil Diverifikasi ✓</p>
              <p className="text-xs text-slate-500">Anda sekarang sudah dapat melakukan login dan bertransaksi secara aman.</p>
              <button
                onClick={() => {
                  setMode('login');
                  navigate('/auth');
                }}
                className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-md"
              >
                Ke Halaman Login
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <p className="text-sm font-semibold text-red-800">Verifikasi Gagal / Kadaluarsa</p>
              <p className="text-xs text-slate-500">Tautan verifikasi salah atau sudah digunakan sebelumnya.</p>
              <button
                onClick={() => navigate('/auth')}
                className="w-full py-2.5 bg-slate-100 text-slate-800 rounded-xl font-bold text-sm border border-slate-200"
              >
                Kembali ke Form Login
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden p-8 space-y-6">
        
        {/* Header Tabs */}
        <div className="flex gap-4 border-b border-slate-100 pb-4">
          <button
            onClick={() => {
              setMode('login');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 text-center pb-2 text-sm font-bold transition-all border-b-2 ${
              mode === 'login' ? 'border-green-600 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Masuk Akun
          </button>
          <button
            onClick={() => {
              if (!registrationOpen) {
                setShowClosedModal(true);
              } else {
                setMode('register');
                setErrorMsg('');
                setSuccessMsg('');
              }
            }}
            className={`flex-1 text-center pb-2 text-sm font-bold transition-all border-b-2 ${
              mode === 'register' ? 'border-green-600 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Daftar Baru
          </button>
        </div>

        {/* Global Success State */}
        {successMsg && (
          <div className="bg-green-50 border border-green-100 text-green-800 text-xs rounded-xl p-4 flex gap-2.5 items-center animate-fade-in">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p>{successMsg}</p>
          </div>
        )}

        {/* Forgot password Cooldown active UI */}
        {cooldownExpiresAt && mode === 'forgot' && (
          <div className="bg-amber-50 border border-amber-100 text-amber-900 rounded-xl p-4 space-y-2 animate-fade-in text-xs">
            <div className="flex gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-semibold">Batas Kuota Permintaan</p>
                <p className="leading-relaxed text-amber-800">{errorMsg}</p>
              </div>
            </div>
            {timeLeft && (
              <div className="flex items-center gap-2 bg-white/60 px-3 py-1 rounded-md border border-amber-200/50 text-[11px] w-fit">
                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                <span>Coba kembali dalam: <strong className="font-mono text-slate-950 font-bold">{timeLeft}</strong></span>
              </div>
            )}
          </div>
        )}

        {/* Regular Error Box */}
        {errorMsg && (!cooldownExpiresAt || mode !== 'forgot') && (
          <div className="bg-red-50 border border-red-100 text-red-800 text-xs rounded-xl p-4 flex gap-2.5 items-center animate-fade-in">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* MODE: LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Email Akun</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="nama@email.com..."
                  className="pl-10 w-full px-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-hidden focus:border-green-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Kata Sandi</label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-xs font-semibold text-green-600 hover:text-green-700"
                >
                  Lupa Sandi?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 w-full px-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-hidden focus:border-green-600 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md transition-all disabled:bg-slate-300"
            >
              {isSubmitting ? 'Mencocokkan...' : 'Masuk ke Platform'}
            </button>
          </form>
        )}

        {/* MODE: REGISTER */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Nama Lengkap</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Masukkan nama lengkap Anda..."
                  className="pl-10 w-full px-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-hidden focus:border-green-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Nomor Handphone / WA</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="Contoh: 0812..."
                  className="pl-10 w-full px-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-hidden focus:border-green-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Alamat Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="nama@email.com..."
                  className="pl-10 w-full px-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-hidden focus:border-green-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Sandi Baru</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Minimal 6 karakter..."
                  className="pl-10 w-full px-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-hidden focus:border-green-600 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl shadow-md transition-all disabled:bg-slate-300"
            >
              {isSubmitting ? 'Mendaftarkan...' : 'Kirim Link Verifikasi'}
            </button>
          </form>
        )}

        {/* MODE: FORGOT */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-1 text-xs text-slate-400 font-semibold mb-2">
              <button type="button" onClick={() => setMode('login')} className="hover:text-slate-900 inline-flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Kembali
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Email Akun Anda</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Masukkan email terdaftar..."
                  disabled={!!cooldownExpiresAt}
                  className="pl-10 w-full px-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-hidden focus:border-green-600 focus:bg-white disabled:bg-slate-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !!cooldownExpiresAt}
              className="w-full py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md transition-all disabled:bg-slate-200"
            >
              {isSubmitting ? 'Mengirim...' : 'Kirim Instruksi Reset'}
            </button>
          </form>
        )}

      </div>

      {/* Registration Closed Modal (Clean Popup with direct WhatsApp Link) */}
      {showClosedModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
            
            <div className="bg-amber-600 p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-100" />
                <h3 className="font-display font-bold text-base">Pendaftaran Mandiri Ditutup</h3>
              </div>
              <button
                onClick={() => setShowClosedModal(false)}
                className="text-amber-100 hover:text-white rounded-lg p-1 hover:bg-white/10"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-sm text-slate-600 leading-relaxed space-y-2">
                <p>Maaf, fitur registrasi akun mandiri secara online untuk saat ini sedang dinonaktifkan oleh pemilik platform.</p>
                <p className="font-semibold text-slate-800">Bagaimana cara mendaftar?</p>
                <p>Anda tetap dapat bertransaksi atau mendaftarkan akun pembeli dengan menghubungi langsung tim Customer Service / Admin kami melalui nomor WhatsApp resmi untuk didaftarkan secara manual.</p>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                <a
                  href="https://wa.me/6281234567890?text=Halo%20Admin%2C%20saya%20tertarik%20mendaftar%20akun%20pembeli%20di%20LCS%20Platform"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm shadow-md"
                >
                  <Send className="w-4 h-4" />
                  Hubungi Admin via WhatsApp
                </a>
                <button
                  onClick={() => setShowClosedModal(false)}
                  className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 text-center font-semibold"
                >
                  Tutup
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
