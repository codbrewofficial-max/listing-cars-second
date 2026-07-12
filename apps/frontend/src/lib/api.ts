import {
  User,
  Vehicle,
  SparePart,
  VisitRequest,
  Transaction,
  Lead,
  Article,
  Conversation,
  Message,
  Notification,
  AuditLog,
  EmailLog,
  PlatformSetting,
  UserRole,
  VehiclePhoto,
  SparePartPhoto,
  VisitPhoto
} from '../types';

// In-memory access token
let accessToken: string | null = null;

export const getAccessToken = () => accessToken;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

// localStorage for refresh token
export const getRefreshToken = () => localStorage.getItem('refresh_token');
export const setRefreshToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('refresh_token', token);
  } else {
    localStorage.removeItem('refresh_token');
  }
};

// Store current user profile for quick access
export const getStoredUser = (): User | null => {
  const data = localStorage.getItem('user_profile');
  return data ? JSON.parse(data) : null;
};
export const setStoredUser = (user: User | null) => {
  if (user) {
    localStorage.setItem('user_profile', JSON.stringify(user));
  } else {
    localStorage.removeItem('user_profile');
  }
};

// Toggle to explicitly test simulated backend vs real backend
// If real backend is active, we hit VITE_API_URL.
const REAL_API_URL = (import.meta as any).env.VITE_API_URL || '';
const useRealApi = () => {
  // If VITE_API_URL is configured, default to true.
  return !!REAL_API_URL;
};

// Helper to make fetch requests with auth header
async function request(path: string, options: RequestInit = {}) {
  const url = `${REAL_API_URL}${path}`;
  const headers = new Headers(options.headers || {});
  
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  headers.set('Content-Type', 'application/json');

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    // Attempt token refresh
    const rToken = getRefreshToken();
    if (rToken) {
      try {
        const refreshRes = await fetch(`${REAL_API_URL}/api/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: rToken })
        });
        
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          // Backend returns { access_token }
          if (data.access_token) {
            setAccessToken(data.access_token);
            // Retry original request with new token
            headers.set('Authorization', `Bearer ${data.access_token}`);
            const retryRes = await fetch(url, { ...options, headers });
            return retryRes;
          }
        }
      } catch (e) {
        console.error('Failed to auto-refresh token', e);
      }
    }
    // Logout if refresh fails or no refresh token
    setAccessToken(null);
    setRefreshToken(null);
    setStoredUser(null);
    window.dispatchEvent(new Event('auth-logout'));
  }

  return res;
}

// SIMULATOR STORAGE (State persistent in localStorage)
const STORAGE_PREFIX = 'lcs_mvp_';
const getStorage = <T>(key: string, defaultValue: T): T => {
  const item = localStorage.getItem(STORAGE_PREFIX + key);
  return item ? JSON.parse(item) : defaultValue;
};
const setStorage = <T>(key: string, value: T): T => {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  return value;
};

// Generic helper to simulate server-side pagination, sorting, and filtering
function simulatePaginationAndFilters<T>(
  rawList: T[],
  paramsStr?: string,
  filterFn?: (item: T, query: Record<string, string>) => boolean
) {
  const query: Record<string, string> = {};
  if (paramsStr) {
    const clean = paramsStr.startsWith('?') ? paramsStr.slice(1) : paramsStr;
    clean.split('&').forEach(part => {
      const [key, val] = part.split('=');
      if (key) {
        query[decodeURIComponent(key)] = decodeURIComponent(val || '').toLowerCase();
      }
    });
  }

  let filtered = [...rawList];
  if (filterFn) {
    filtered = filtered.filter(item => filterFn(item, query));
  }

  const total = filtered.length;
  const page = parseInt(query.page || '1', 10);
  const per_page = parseInt(query.per_page || '10', 10);
  const total_pages = Math.ceil(total / per_page);

  const start = (page - 1) * per_page;
  const end = start + per_page;
  const paginated = filtered.slice(start, end);

  return {
    success: true,
    data: paginated,
    meta: {
      total,
      page,
      per_page,
      total_pages: total_pages || 1
    }
  };
}

// Seed initial data if empty
const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'v1',
    brand: 'Toyota',
    model: 'Avanza 1.3 G M/T',
    year: 2018,
    mileage: 72000,
    license_plate: 'B 1234 CDG', // Internal only, hidden from public list
    price: 145000000,
    condition_notes: 'Mesin halus, servis rutin dealer resmi, bodi mulus orisinil.',
    description: 'Kendaraan keluarga idaman, irit bahan bakar, kabin lapang, AC dingin dobel blower. Ban tebal 90%. Surat-surat lengkap STNK dan BPKB ada dan sudah diverifikasi.',
    location: 'Jakarta Selatan',
    status: 'published',
    document_status: 'verified',
    verification_checklist: { stnk: true, bpkb: true, tax_active: true },
    created_at: '2026-06-10T10:00:00Z',
    updated_at: '2026-06-10T10:00:00Z',
    photos: [
      { id: 'vp1', vehicle_id: 'v1', file_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800', is_cover: true, sort_order: 1 },
      { id: 'vp2', vehicle_id: 'v1', file_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800', is_cover: false, sort_order: 2 }
    ],
    visit_photos_published: [
      'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=600'
    ]
  },
  {
    id: 'v2',
    brand: 'Honda',
    model: 'Civic 1.5 Turbo',
    year: 2020,
    mileage: 34000,
    license_plate: 'D 8888 SSS',
    price: 410000000,
    condition_notes: 'Full standar pabrik, cat original, interior mulus seperti baru.',
    description: 'Honda Civic sedan dengan mesin turbo responsif. Selalu menggunakan bahan bakar beroktan tinggi (Pertamax Turbo). Record Honda Pasteur Bandung.',
    location: 'Bandung',
    status: 'published',
    document_status: 'verified',
    verification_checklist: { stnk: true, bpkb: true, tax_active: true },
    created_at: '2026-07-01T08:00:00Z',
    updated_at: '2026-07-01T08:00:00Z',
    photos: [
      { id: 'vp3', vehicle_id: 'v2', file_url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800', is_cover: true, sort_order: 1 }
    ],
    visit_photos_published: []
  },
  {
    id: 'v3',
    brand: 'Suzuki',
    model: 'Ertiga GL A/T',
    year: 2017,
    mileage: 95000,
    license_plate: 'B 2981 EFH',
    price: 130000000,
    condition_notes: 'Ada baret halus pemakaian wajar di bemper belakang, kelistrikan normal.',
    description: 'Suzuki Ertiga tipe GL transmisi otomatis. AC dingin, kaki-kaki senyap, sangat nyaman untuk harian perkotaan.',
    location: 'Tangerang',
    status: 'published',
    document_status: 'unverified',
    created_at: '2026-07-10T12:00:00Z',
    updated_at: '2026-07-10T12:00:00Z',
    photos: [
      { id: 'vp4', vehicle_id: 'v3', file_url: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=800', is_cover: true, sort_order: 1 }
    ],
    visit_photos_published: []
  }
];

const INITIAL_SPARE_PARTS: SparePart[] = [
  {
    id: 'sp1',
    name: 'Kampas Rem Depan Bendix Avanza',
    category: 'Rem & Kaki-kaki',
    condition: 'new',
    price: 245000,
    description: 'Kampas rem depan merk Bendix seri General CT. Pakem, senyap, tahan lama, tidak merusak piringan cakram. Cocok untuk Avanza/Xenia semua tahun.',
    status: 'published',
    created_at: '2026-06-15T09:00:00Z',
    updated_at: '2026-06-15T09:00:00Z',
    photos: [
      { id: 'spp1', spare_part_id: 'sp1', file_url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=800', is_cover: true, sort_order: 1 }
    ]
  },
  {
    id: 'sp2',
    name: 'Filter Oli Honda Civic Turbo Genuine',
    category: 'Mesin',
    condition: 'new',
    price: 85000,
    description: 'Filter oli genuine part Honda K20/L15 Turbo. Menjamin penyaringan oli maksimal untuk mesin performa tinggi Civic Turbo.',
    status: 'published',
    created_at: '2026-07-02T11:00:00Z',
    updated_at: '2026-07-02T11:00:00Z',
    photos: [
      { id: 'spp2', spare_part_id: 'sp2', file_url: 'https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?auto=format&fit=crop&q=80&w=800', is_cover: true, sort_order: 1 }
    ]
  },
  {
    id: 'sp3',
    name: 'Shockbreaker Belakang Kayaba Ertiga (Sepasang)',
    category: 'Suspensi',
    condition: 'used',
    price: 450000,
    description: 'Shockbreaker belakang merk Kayaba untuk Suzuki Ertiga. Kondisi bekas pemakaian 6 bulan, masih empuk, tidak ada bocor oli, gas masih padat. Jaminan 90% orisinil.',
    status: 'published',
    created_at: '2026-07-05T14:00:00Z',
    updated_at: '2026-07-05T14:00:00Z',
    photos: [
      { id: 'spp3', spare_part_id: 'sp3', file_url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=800', is_cover: true, sort_order: 1 }
    ]
  }
];

const INITIAL_ARTICLES: Article[] = [
  {
    id: 'a1',
    title: '5 Cara Jitu Menghindari Penipuan Jual Beli Mobil Bekas',
    slug: 'cara-jitu-hindari-penipuan-mobil-bekas',
    category: 'Panduan Pembeli',
    content: `# Panduan Lengkap Menghindari Penipuan Mobil Bekas

Membeli mobil bekas (second) adalah langkah cerdas untuk berhemat. Namun, transaksi ini sarat dengan risiko penipuan jika Anda tidak waspada. Berikut adalah 5 langkah krusial yang wajib Anda lakukan demi keamanan transaksi:

## 1. Selalu Verifikasi Dokumen Fisik (STNK & BPKB)
Jangan pernah tergiur harga murah yang tidak masuk akal. Mintalah penjual untuk menunjukkan STNK asli dan BPKB asli. Pastikan nomor rangka dan nomor mesin di fisik kendaraan sesuai persis dengan yang tercantum di dokumen.

## 2. Lakukan Inspeksi Fisik secara Detail
Bila Anda kurang paham mesin, bawalah mekanik terpercaya atau gunakan jasa inspeksi independen. Cek indikasi bekas tabrakan hebat, bekas terendam banjir (karat di sela-sela interior, bau apek), serta keaslian angka kilometer.

## 3. Gunakan Sistem Pembayaran Escrow (Rekening Bersama)
Hindari mentransfer uang muka (DP) langsung ke rekening penjual pribadi sebelum barang diverifikasi. Gunakan sistem escrow platform kami di mana dana Anda ditahan secara aman di escrow bank hingga pemeriksaan selesai dan serah terima tuntas.

## 4. Ajukan Kunjungan Langsung melalui Admin
Platform kami memfasilitasi "Ajukan Kunjungan" yang dikoordinasikan oleh Admin Sistem. Ini menjamin lokasi pertemuan aman dan transparan.

## 5. Cek Riwayat Servis Kendaraan
Mobil dengan riwayat servis berkala di bengkel resmi memiliki jaminan ketahanan mesin yang jauh lebih baik dibanding yang tidak memiliki catatan jelas.`,
    status: 'published',
    seo_title: 'Tips Aman Menghindari Penipuan Mobil Bekas | LCS',
    seo_description: 'Pelajari 5 cara jitu memeriksa dokumen, mesin, dan menggunakan metode pembayaran escrow aman untuk membeli mobil bekas tanpa rasa khawatir tertipu.',
    cover_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800',
    created_at: '2026-07-11T10:00:00Z',
    updated_at: '2026-07-11T10:00:00Z'
  },
  {
    id: 'a2',
    title: 'Tanda-Tanda Kampas Rem Mobil Bekas Harus Segera Diganti',
    slug: 'tanda-kampas-rem-mobil-bekas-harus-diganti',
    category: 'Perawatan Suku Cadang',
    content: `# Tanda-Tanda Kampas Rem Harus Diganti

Sistem pengereman adalah salah satu elemen keselamatan terpenting dalam berkendara. Ketika Anda baru saja membeli mobil bekas, sangat penting untuk mendeteksi kondisi kampas rem. 

Berikut adalah tanda-tanda kampas rem mobil bekas sudah menipis dan perlu diganti:

1. **Bunyi Berdecit Saat Mengerem (Squealing):** Muncul akibat gesekan plat indikator ke piringan cakram karena kampas sudah tipis.
2. **Pijakan Rem Terasa Lebih Dalam:** Jarak injak pedal rem terasa lebih jauh dari biasanya untuk menghentikan kendaraan.
3. **Setir Bergetar Saat Pengereman:** Indikasi piringan cakram tidak rata akibat tergerus kampas rem yang habis total.
4. **Minyak Rem Turun Drastis:** Jika minyak rem di tabung reservoir berkurang drastis tanpa adanya kebocoran selang, itu pertanda piston kaliper menekan lebih dalam karena kampas rem aus.`,
    status: 'published',
    seo_title: 'Kapan Harus Ganti Kampas Rem Mobil Bekas? | LCS',
    seo_description: 'Cara mendeteksi kampas rem mobil bekas yang aus mulai dari bunyi berdecit hingga setir bergetar demi menjaga keselamatan berkendara.',
    cover_url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=800',
    created_at: '2026-07-11T11:00:00Z',
    updated_at: '2026-07-11T11:00:00Z'
  }
];

const INITIAL_USERS: User[] = [
  { id: 'u_super', name: 'Zul Super Admin', email: 'super@lcs.id', role: 'super_admin', phone: '08123456780', is_active: true, email_verified_at: '2026-01-01T00:00:00Z', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'u_owner', name: 'Farhan Owner', email: 'owner@lcs.id', role: 'owner', phone: '08123456781', is_active: true, email_verified_at: '2026-01-01T00:00:00Z', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'u_admin', name: 'Andi Admin Sistem', email: 'admin@lcs.id', role: 'admin', phone: '08123456782', is_active: true, email_verified_at: '2026-01-01T00:00:00Z', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'u_customer', name: 'Fariz Customer', email: 'customer@lcs.id', role: 'customer', phone: '08123456783', is_active: true, email_verified_at: '2026-01-01T00:00:00Z', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }
];

const INITIAL_SETTINGS: PlatformSetting[] = [
  { key: 'platform_name', value: 'LCS Motor' },
  { key: 'platform_logo_url', value: '' },
  { key: 'registration_open', value: 'true' },
  { key: 'email_daily_limit', value: '250' }
];

// Seed state helper
export const initSimulationDB = () => {
  if (!localStorage.getItem(STORAGE_PREFIX + 'vehicles')) setStorage('vehicles', INITIAL_VEHICLES);
  if (!localStorage.getItem(STORAGE_PREFIX + 'spare_parts')) setStorage('spare_parts', INITIAL_SPARE_PARTS);
  if (!localStorage.getItem(STORAGE_PREFIX + 'articles')) setStorage('articles', INITIAL_ARTICLES);
  if (!localStorage.getItem(STORAGE_PREFIX + 'users')) setStorage('users', INITIAL_USERS);
  if (!localStorage.getItem(STORAGE_PREFIX + 'settings')) setStorage('settings', INITIAL_SETTINGS);
  if (!localStorage.getItem(STORAGE_PREFIX + 'leads')) setStorage('leads', [] as Lead[]);
  if (!localStorage.getItem(STORAGE_PREFIX + 'visit_requests')) setStorage('visit_requests', [] as VisitRequest[]);
  if (!localStorage.getItem(STORAGE_PREFIX + 'transactions')) setStorage('transactions', [] as Transaction[]);
  if (!localStorage.getItem(STORAGE_PREFIX + 'conversations')) setStorage('conversations', [] as Conversation[]);
  if (!localStorage.getItem(STORAGE_PREFIX + 'messages')) setStorage('messages', [] as Message[]);
  if (!localStorage.getItem(STORAGE_PREFIX + 'notifications')) setStorage('notifications', [] as Notification[]);
  if (!localStorage.getItem(STORAGE_PREFIX + 'audit_logs')) setStorage('audit_logs', [] as AuditLog[]);
  if (!localStorage.getItem(STORAGE_PREFIX + 'email_logs')) setStorage('email_logs', [] as EmailLog[]);
};

// Mock Helper Actions
const addAuditLog = (actor: User, actionType: string, targetEntity: string, targetId: string, metadata?: any) => {
  const logs = getStorage<AuditLog[]>('audit_logs', []);
  const newLog: AuditLog = {
    id: 'al_' + Math.random().toString(36).substr(2, 9),
    actor_id: actor.id,
    actor_name: actor.name,
    action_type: actionType,
    target_entity: targetEntity,
    target_id: targetId,
    metadata,
    created_at: new Date().toISOString()
  };
  logs.unshift(newLog);
  setStorage('audit_logs', logs);
};

const addEmailLog = (recipient: string, purpose: EmailLog['purpose'], status: EmailLog['status'], error_message?: string, userId?: string) => {
  const logs = getStorage<EmailLog[]>('email_logs', []);
  const newLog: EmailLog = {
    id: 'el_' + Math.random().toString(36).substr(2, 9),
    recipient_email: recipient,
    purpose,
    status,
    provider: 'brevo',
    provider_message_id: status === 'sent' ? 'msg_brevo_' + Math.random().toString(36).substr(2, 9) : undefined,
    error_message,
    related_user_id: userId,
    created_at: new Date().toISOString()
  };
  logs.unshift(newLog);
  setStorage('email_logs', logs);
};

// Check email quota limit today in simulator
const checkEmailQuota = (): boolean => {
  const logs = getStorage<EmailLog[]>('email_logs', []);
  const settings = getStorage<PlatformSetting[]>('settings', INITIAL_SETTINGS);
  const limitSetting = settings.find(s => s.key === 'email_daily_limit');
  const limit = limitSetting ? parseInt(limitSetting.value) : 250;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const sentToday = logs.filter(l => l.status === 'sent' && l.created_at.startsWith(todayStr)).length;
  
  return sentToday < limit;
};

// API Client Wrapper matching 05-api-endpoints-mvp.md and 02c-addendum-auth-email-brevo.md
export const api = {
  // ==========================================
  // AUTHENTICATION
  // ==========================================
  auth: {
    register: async (data: { name: string; email: string; phone: string; password?: string }) => {
      if (useRealApi()) {
        const res = await request('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify(data)
        });
        return res.json();
      }

      // Simulator
      initSimulationDB();
      const settings = getStorage<PlatformSetting[]>('settings', INITIAL_SETTINGS);
      const isRegOpen = settings.find(s => s.key === 'registration_open')?.value === 'true';
      if (!isRegOpen) {
        return { success: false, error: { code: 'REGISTRATION_CLOSED', message: 'Registrasi akun baru sedang dinonaktifkan oleh administrasi.' } };
      }

      const users = getStorage<User[]>('users', []);
      if (users.some(u => u.email === data.email)) {
        return { success: false, error: { code: 'VALIDATION_ERROR', message: 'Email sudah terdaftar.' } };
      }

      const newUser: User = {
        id: 'u_' + Math.random().toString(36).substr(2, 9),
        name: data.name,
        email: data.email,
        role: 'customer',
        phone: data.phone,
        is_active: true,
        email_verified_at: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      users.push(newUser);
      setStorage('users', users);

      // Trigger Email log for verification
      const quotaOk = checkEmailQuota();
      if (quotaOk) {
        addEmailLog(data.email, 'email_verification', 'sent', undefined, newUser.id);
      } else {
        addEmailLog(data.email, 'email_verification', 'skipped_limit', 'Daily limit exceeded', newUser.id);
      }

      return { success: true, data: { user_id: newUser.id, message: 'Registrasi berhasil. Silakan cek email verifikasi Anda.' } };
    },

    login: async (data: { email: string; password?: string }) => {
      if (useRealApi()) {
        const res = await request('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify(data)
        });
        const body = await res.json();
        if (body.success && body.data) {
          setAccessToken(body.data.access_token);
          setRefreshToken(body.data.refresh_token);
          setStoredUser(body.data.user);
        }
        return body;
      }

      // Simulator
      initSimulationDB();
      const users = getStorage<User[]>('users', []);
      const user = users.find(u => u.email === data.email);
      if (!user) {
        return { success: false, error: { code: 'AUTH_FAILED', message: 'Email atau password salah.' } };
      }
      if (!user.is_active) {
        return { success: false, error: { code: 'USER_INACTIVE', message: 'Akun Anda telah dinonaktifkan oleh administrasi.' } };
      }

      const accessTokenMock = 'mock_access_jwt_' + Math.random().toString(36).substr(2, 9);
      const refreshTokenMock = 'mock_refresh_token_' + Math.random().toString(36).substr(2, 9);
      
      setAccessToken(accessTokenMock);
      setRefreshToken(refreshTokenMock);
      setStoredUser(user);

      return {
        success: true,
        data: {
          access_token: accessTokenMock,
          refresh_token: refreshTokenMock,
          user
        }
      };
    },

    refreshToken: async (token: string) => {
      if (useRealApi()) {
        const res = await request('/api/auth/refresh-token', {
          method: 'POST',
          body: JSON.stringify({ refresh_token: token })
        });
        const body = await res.json();
        if (body.success && body.data) {
          setAccessToken(body.data.access_token);
          // If backend rotates refresh token
          if (body.data.refresh_token) {
            setRefreshToken(body.data.refresh_token);
          }
        }
        return body;
      }

      // Simulator
      const accessTokenMock = 'mock_access_jwt_rotated_' + Math.random().toString(36).substr(2, 9);
      setAccessToken(accessTokenMock);
      return {
        success: true,
        data: {
          access_token: accessTokenMock
        }
      };
    },

    logout: async () => {
      const rToken = getRefreshToken();
      if (useRealApi()) {
        await request('/api/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refresh_token: rToken })
        });
      }
      setAccessToken(null);
      setRefreshToken(null);
      setStoredUser(null);
      return { success: true, data: { message: 'Logout sukses.' } };
    },

    forgotPassword: async (email: string) => {
      if (useRealApi()) {
        const res = await request('/api/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email })
        });
        return res.json();
      }

      // Simulator
      initSimulationDB();
      const users = getStorage<User[]>('users', []);
      const user = users.find(u => u.email === email);
      
      const quotaOk = checkEmailQuota();
      if (quotaOk) {
        if (user) {
          addEmailLog(email, 'reset_password', 'sent', undefined, user.id);
        }
        return { success: true, data: { message: 'Instruksi reset password telah dikirim ke email Anda.' } };
      } else {
        if (user) {
          addEmailLog(email, 'reset_password', 'skipped_limit', 'Daily limit exceeded', user.id);
        }
        return { 
          success: true, 
          data: { 
            message: 'Jika email terdaftar, instruksi reset akan dikirim. Jika tidak menerima email dalam waktu singkat, hubungi Admin untuk bantuan reset manual.' 
          } 
        };
      }
    },

    resetPassword: async (data: { token: string; new_password?: string }) => {
      if (useRealApi()) {
        const res = await request('/api/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify(data)
        });
        return res.json();
      }
      return { success: true, data: { message: 'Password Anda berhasil diset ulang.' } };
    },

    verifyEmail: async (token: string) => {
      if (useRealApi()) {
        const res = await request('/api/auth/verify-email', {
          method: 'POST',
          body: JSON.stringify({ token })
        });
        return res.json();
      }
      // Simulator: mark current user as verified
      const user = getStoredUser();
      if (user) {
        user.email_verified_at = new Date().toISOString();
        setStoredUser(user);
        
        // Update in users storage
        const users = getStorage<User[]>('users', []);
        const idx = users.findIndex(u => u.id === user.id);
        if (idx !== -1) {
          users[idx].email_verified_at = user.email_verified_at;
          setStorage('users', users);
        }
      }
      return { success: true, data: { message: 'Email Anda berhasil diverifikasi.' } };
    },

    resendVerification: async (email: string) => {
      if (useRealApi()) {
        const res = await request('/api/auth/resend-verification', {
          method: 'POST',
          body: JSON.stringify({ email })
        });
        return res.json();
      }

      const quotaOk = checkEmailQuota();
      if (quotaOk) {
        addEmailLog(email, 'email_verification', 'sent');
        return { success: true, data: { message: 'Email verifikasi ulang berhasil dikirim.' } };
      } else {
        addEmailLog(email, 'email_verification', 'skipped_limit', 'Daily limit exceeded');
        return { success: false, error: { code: 'LIMIT_EXCEEDED', message: 'Kanal email verifikasi harian penuh, silakan coba lagi besok.' } };
      }
    },

    getMe: async () => {
      if (useRealApi()) {
        const res = await request('/api/auth/me');
        const body = await res.json();
        if (body.success && body.data?.user) {
          setStoredUser(body.data.user);
        }
        return body;
      }
      return { success: true, data: { user: getStoredUser() } };
    },

    updateMe: async (data: { name?: string; phone?: string }) => {
      if (useRealApi()) {
        const res = await request('/api/auth/me', {
          method: 'PATCH',
          body: JSON.stringify(data)
        });
        const body = await res.json();
        if (body.success && body.data?.user) {
          setStoredUser(body.data.user);
        }
        return body;
      }

      // Simulator
      const user = getStoredUser();
      if (!user) return { success: false, error: { code: 'UNAUTHORIZED' } };
      
      const updated = { ...user, ...data, updated_at: new Date().toISOString() };
      setStoredUser(updated);

      const users = getStorage<User[]>('users', []);
      const idx = users.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        users[idx] = updated;
        setStorage('users', users);
      }

      return { success: true, data: { user: updated } };
    },

    changePasswordMe: async (data: { old_password?: string; new_password?: string }) => {
      if (useRealApi()) {
        const res = await request('/api/auth/me/password', {
          method: 'PATCH',
          body: JSON.stringify(data)
        });
        return res.json();
      }
      return { success: true, data: { message: 'Sandi berhasil diubah.' } };
    }
  },

  // ==========================================
  // VEHICLES
  // ==========================================
  vehicles: {
    list: async (params?: string) => {
      if (useRealApi()) {
        const res = await request(`/api/vehicles${params || ''}`);
        return res.json();
      }
      initSimulationDB();
      const list = getStorage<Vehicle[]>('vehicles', []);
      const result = simulatePaginationAndFilters<Vehicle>(list, params, (v, q) => {
        if (v.status !== 'published') return false;
        if (q.brand && q.brand !== 'all' && !v.brand.toLowerCase().includes(q.brand)) return false;
        if (q.search) {
          const matchBrand = v.brand.toLowerCase().includes(q.search);
          const matchModel = v.model.toLowerCase().includes(q.search);
          const matchNotes = (v.condition_notes || '').toLowerCase().includes(q.search);
          const matchDesc = (v.description || '').toLowerCase().includes(q.search);
          if (!matchBrand && !matchModel && !matchNotes && !matchDesc) return false;
        }
        if (q.price_min && v.price < parseFloat(q.price_min)) return false;
        if (q.price_max && v.price > parseFloat(q.price_max)) return false;
        if (q.location && q.location !== 'all' && v.location.toLowerCase() !== q.location) return false;
        if (q.document_status && q.document_status !== 'all' && v.document_status.toLowerCase() !== q.document_status) return false;
        return true;
      });

      // Omit license_plate from public response
      const sanitized = result.data.map(({ license_plate, ...v }) => v);
      return { ...result, data: sanitized };
    },

    get: async (id: string) => {
      if (useRealApi()) {
        const res = await request(`/api/vehicles/${id}`);
        return res.json();
      }
      initSimulationDB();
      const list = getStorage<Vehicle[]>('vehicles', []);
      const item = list.find(v => v.id === id);
      if (!item) return { success: false, error: { code: 'NOT_FOUND', message: 'Kendaraan tidak ditemukan' } };
      
      // Public response: Omit license_plate, include photos & visit_photos_published
      const { license_plate, ...publicItem } = item;
      return { 
        success: true, 
        data: { 
          vehicle: publicItem, 
          photos: item.photos || [], 
          visit_photos_published: item.visit_photos_published || [] 
        } 
      };
    },

    adminList: async (params?: string) => {
      if (useRealApi()) {
        const res = await request(`/api/admin/vehicles${params || ''}`);
        return res.json();
      }
      initSimulationDB();
      const list = getStorage<Vehicle[]>('vehicles', []);
      return simulatePaginationAndFilters<Vehicle>(list, params, (v, q) => {
        if (q.search) {
          const matchBrand = v.brand.toLowerCase().includes(q.search);
          const matchModel = v.model.toLowerCase().includes(q.search);
          if (!matchBrand && !matchModel) return false;
        }
        return true;
      });
    },

    create: async (data: any) => {
      if (useRealApi()) {
        const res = await request('/api/vehicles', {
          method: 'POST',
          body: JSON.stringify(data)
        });
        return res.json();
      }

      initSimulationDB();
      const list = getStorage<Vehicle[]>('vehicles', []);
      const newV: Vehicle = {
        id: 'v_' + Math.random().toString(36).substr(2, 9),
        brand: data.brand,
        model: data.model,
        year: parseInt(data.year),
        mileage: parseInt(data.mileage),
        license_plate: data.license_plate,
        price: parseFloat(data.price),
        condition_notes: data.condition_notes || '',
        description: data.description || '',
        location: data.location,
        status: 'draft',
        document_status: 'unverified',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        photos: [],
        visit_photos_published: []
      };
      list.push(newV);
      setStorage('vehicles', list);

      const me = getStoredUser();
      if (me) addAuditLog(me, 'create_product', 'vehicles', newV.id, { model: newV.brand + ' ' + newV.model });

      return { success: true, data: { vehicle: newV } };
    },

    update: async (id: string, data: any) => {
      if (useRealApi()) {
        const res = await request(`/api/vehicles/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
        return res.json();
      }

      initSimulationDB();
      const list = getStorage<Vehicle[]>('vehicles', []);
      const idx = list.findIndex(v => v.id === id);
      if (idx === -1) return { success: false, error: { code: 'NOT_FOUND' } };
      
      const updated = {
        ...list[idx],
        ...data,
        year: data.year ? parseInt(data.year) : list[idx].year,
        mileage: data.mileage ? parseInt(data.mileage) : list[idx].mileage,
        price: data.price ? parseFloat(data.price) : list[idx].price,
        updated_at: new Date().toISOString()
      };
      list[idx] = updated;
      setStorage('vehicles', list);

      const me = getStoredUser();
      if (me) addAuditLog(me, 'update_product', 'vehicles', id, { model: updated.brand + ' ' + updated.model });

      return { success: true, data: { vehicle: updated } };
    },

    updateStatus: async (id: string, status: Vehicle['status']) => {
      if (useRealApi()) {
        const res = await request(`/api/vehicles/${id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status })
        });
        return res.json();
      }

      initSimulationDB();
      const list = getStorage<Vehicle[]>('vehicles', []);
      const idx = list.findIndex(v => v.id === id);
      if (idx === -1) return { success: false, error: { code: 'NOT_FOUND' } };
      
      list[idx].status = status;
      list[idx].updated_at = new Date().toISOString();
      setStorage('vehicles', list);

      const me = getStoredUser();
      if (me) addAuditLog(me, 'update_product_status', 'vehicles', id, { status });

      return { success: true, data: { vehicle: list[idx] } };
    },

    verifyDocuments: async (id: string, data: { document_status: Vehicle['document_status']; verification_checklist?: Record<string, boolean> }) => {
      if (useRealApi()) {
        const res = await request(`/api/vehicles/${id}/document-status`, {
          method: 'PATCH',
          body: JSON.stringify(data)
        });
        return res.json();
      }

      initSimulationDB();
      const list = getStorage<Vehicle[]>('vehicles', []);
      const idx = list.findIndex(v => v.id === id);
      if (idx === -1) return { success: false, error: { code: 'NOT_FOUND' } };
      
      list[idx].document_status = data.document_status;
      list[idx].verification_checklist = data.verification_checklist;
      list[idx].updated_at = new Date().toISOString();
      setStorage('vehicles', list);

      const me = getStoredUser();
      if (me) addAuditLog(me, 'verify_document', 'vehicles', id, { document_status: data.document_status, verification_checklist: data.verification_checklist });

      return { success: true, data: { vehicle: list[idx] } };
    },

    delete: async (id: string) => {
      if (useRealApi()) {
        const res = await request(`/api/vehicles/${id}`, {
          method: 'DELETE'
        });
        return res.json();
      }

      initSimulationDB();
      const list = getStorage<Vehicle[]>('vehicles', []);
      const filtered = list.filter(v => v.id !== id);
      setStorage('vehicles', filtered);

      const me = getStoredUser();
      if (me) addAuditLog(me, 'delete_product', 'vehicles', id);

      return { success: true, data: { message: 'Produk kendaraan sukses dihapus.' } };
    },

    addPhoto: async (id: string, data: { media_asset_id: string; is_cover?: boolean; sort_order?: number }) => {
      if (useRealApi()) {
        const res = await request(`/api/vehicles/${id}/photos`, {
          method: 'POST',
          body: JSON.stringify(data)
        });
        return res.json();
      }

      initSimulationDB();
      const list = getStorage<Vehicle[]>('vehicles', []);
      const idx = list.findIndex(v => v.id === id);
      if (idx === -1) return { success: false, error: { code: 'NOT_FOUND' } };
      
      const newPhoto: VehiclePhoto = {
        id: 'vp_' + Math.random().toString(36).substr(2, 9),
        vehicle_id: id,
        file_url: data.media_asset_id, // Simulate url as asset id
        is_cover: !!data.is_cover,
        sort_order: data.sort_order || (list[idx].photos.length + 1)
      };

      if (newPhoto.is_cover) {
        list[idx].photos.forEach(p => p.is_cover = false);
      }

      list[idx].photos.push(newPhoto);
      setStorage('vehicles', list);
      return { success: true, data: { photo: newPhoto } };
    },

    deletePhoto: async (id: string, photoId: string) => {
      if (useRealApi()) {
        const res = await request(`/api/vehicles/${id}/photos/${photoId}`, {
          method: 'DELETE'
        });
        return res.json();
      }

      initSimulationDB();
      const list = getStorage<Vehicle[]>('vehicles', []);
      const idx = list.findIndex(v => v.id === id);
      if (idx === -1) return { success: false, error: { code: 'NOT_FOUND' } };
      
      list[idx].photos = list[idx].photos.filter(p => p.id !== photoId);
      setStorage('vehicles', list);
      return { success: true, data: { message: 'Foto dihapus.' } };
    }
  },

  // ==========================================
  // SPARE PARTS
  // ==========================================
  spareParts: {
    list: async (params?: string) => {
      if (useRealApi()) {
        const res = await request(`/api/spare-parts${params || ''}`);
        return res.json();
      }
      initSimulationDB();
      const list = getStorage<SparePart[]>('spare_parts', []);
      return simulatePaginationAndFilters<SparePart>(list, params, (v, q) => {
        if (v.status !== 'published') return false;
        if (q.category && v.category.toLowerCase() !== q.category) return false;
        if (q.condition && v.condition.toLowerCase() !== q.condition) return false;
        if (q.search) {
          const matchName = v.name.toLowerCase().includes(q.search);
          const matchCat = v.category.toLowerCase().includes(q.search);
          const matchDesc = (v.description || '').toLowerCase().includes(q.search);
          if (!matchName && !matchCat && !matchDesc) return false;
        }
        return true;
      });
    },

    get: async (id: string) => {
      if (useRealApi()) {
        const res = await request(`/api/spare-parts/${id}`);
        return res.json();
      }
      initSimulationDB();
      const list = getStorage<SparePart[]>('spare_parts', []);
      const item = list.find(v => v.id === id);
      if (!item) return { success: false, error: { code: 'NOT_FOUND' } };
      return { success: true, data: item };
    },

    adminList: async (params?: string) => {
      if (useRealApi()) {
        const res = await request(`/api/admin/spare-parts${params || ''}`);
        return res.json();
      }
      initSimulationDB();
      const list = getStorage<SparePart[]>('spare_parts', []);
      return simulatePaginationAndFilters<SparePart>(list, params, (v, q) => {
        if (q.search) {
          if (!v.name.toLowerCase().includes(q.search)) return false;
        }
        return true;
      });
    },

    create: async (data: any) => {
      if (useRealApi()) {
        const res = await request('/api/spare-parts', {
          method: 'POST',
          body: JSON.stringify(data)
        });
        return res.json();
      }

      initSimulationDB();
      const list = getStorage<SparePart[]>('spare_parts', []);
      const newS: SparePart = {
        id: 'sp_' + Math.random().toString(36).substr(2, 9),
        name: data.name,
        category: data.category,
        condition: data.condition,
        price: parseFloat(data.price),
        description: data.description || '',
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        photos: []
      };
      list.push(newS);
      setStorage('spare_parts', list);

      const me = getStoredUser();
      if (me) addAuditLog(me, 'create_product', 'spare_parts', newS.id, { name: newS.name });

      return { success: true, data: { spare_part: newS } };
    },

    update: async (id: string, data: any) => {
      if (useRealApi()) {
        const res = await request(`/api/spare-parts/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
        return res.json();
      }

      initSimulationDB();
      const list = getStorage<SparePart[]>('spare_parts', []);
      const idx = list.findIndex(v => v.id === id);
      if (idx === -1) return { success: false, error: { code: 'NOT_FOUND' } };
      
      const updated = {
        ...list[idx],
        ...data,
        price: data.price ? parseFloat(data.price) : list[idx].price,
        updated_at: new Date().toISOString()
      };
      list[idx] = updated;
      setStorage('spare_parts', list);

      const me = getStoredUser();
      if (me) addAuditLog(me, 'update_product', 'spare_parts', id, { name: updated.name });

      return { success: true, data: { spare_part: updated } };
    },

    updateStatus: async (id: string, status: SparePart['status']) => {
      if (useRealApi()) {
        const res = await request(`/api/spare-parts/${id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status })
        });
        return res.json();
      }

      initSimulationDB();
      const list = getStorage<SparePart[]>('spare_parts', []);
      const idx = list.findIndex(v => v.id === id);
      if (idx === -1) return { success: false, error: { code: 'NOT_FOUND' } };
      
      list[idx].status = status;
      list[idx].updated_at = new Date().toISOString();
      setStorage('spare_parts', list);

      const me = getStoredUser();
      if (me) addAuditLog(me, 'update_product_status', 'spare_parts', id, { status });

      return { success: true, data: { spare_part: list[idx] } };
    },

    delete: async (id: string) => {
      if (useRealApi()) {
        const res = await request(`/api/spare-parts/${id}`, {
          method: 'DELETE'
        });
        return res.json();
      }

      initSimulationDB();
      const list = getStorage<SparePart[]>('spare_parts', []);
      const filtered = list.filter(v => v.id !== id);
      setStorage('spare_parts', filtered);

      const me = getStoredUser();
      if (me) addAuditLog(me, 'delete_product', 'spare_parts', id);

      return { success: true, data: { message: 'Produk suku cadang sukses dihapus.' } };
    },

    addPhoto: async (id: string, data: { media_asset_id: string; is_cover?: boolean; sort_order?: number }) => {
      if (useRealApi()) {
        const res = await request(`/api/spare-parts/${id}/photos`, {
          method: 'POST',
          body: JSON.stringify(data)
        });
        return res.json();
      }

      initSimulationDB();
      const list = getStorage<SparePart[]>('spare_parts', []);
      const idx = list.findIndex(v => v.id === id);
      if (idx === -1) return { success: false, error: { code: 'NOT_FOUND' } };
      
      const newPhoto: SparePartPhoto = {
        id: 'spph_' + Math.random().toString(36).substr(2, 9),
        spare_part_id: id,
        file_url: data.media_asset_id,
        is_cover: !!data.is_cover,
        sort_order: data.sort_order || (list[idx].photos.length + 1)
      };

      if (newPhoto.is_cover) {
        list[idx].photos.forEach(p => p.is_cover = false);
      }

      list[idx].photos.push(newPhoto);
      setStorage('spare_parts', list);
      return { success: true, data: { photo: newPhoto } };
    }
  },

  // ==========================================
  // VISIT PHYSICAL REQUESTS
  // ==========================================
  visits: {
    request: async (vehicleId: string, notes?: string) => {
      if (useRealApi()) {
        const res = await request(`/api/vehicles/${vehicleId}/visit-requests`, {
          method: 'POST',
          body: JSON.stringify({ notes })
        });
        return res.json();
      }

      initSimulationDB();
      const list = getStorage<VisitRequest[]>('visit_requests', []);
      const vehicles = getStorage<Vehicle[]>('vehicles', []);
      const targetV = vehicles.find(v => v.id === vehicleId);
      const customer = getStoredUser();

      const newVisit: VisitRequest = {
        id: 'vr_' + Math.random().toString(36).substr(2, 9),
        vehicle_id: vehicleId,
        customer_id: customer?.id || 'guest',
        status: 'requested',
        notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        vehicle: targetV ? { brand: targetV.brand, model: targetV.model, year: targetV.year, price: targetV.price } : undefined,
        customer: customer ? { name: customer.name, phone: customer.phone } : undefined,
        photos: []
      };

      list.push(newVisit);
      setStorage('visit_requests', list);

      // System notification
      const notifs = getStorage<Notification[]>('notifications', []);
      notifs.unshift({
        id: 'nt_' + Math.random().toString(36).substr(2, 9),
        user_id: customer?.id || '',
        title: 'Kunjungan Diajukan',
        content: `Permintaan kunjungan untuk ${targetV?.brand} ${targetV?.model} sedang dikoordinasikan oleh Admin.`,
        is_read: false,
        created_at: new Date().toISOString()
      });
      setStorage('notifications', notifs);

      return { success: true, data: { visit_request: newVisit } };
    },

    listAll: async (params?: string) => {
      if (useRealApi()) {
        const res = await request(`/api/visit-requests${params || ''}`);
        return res.json();
      }
      initSimulationDB();
      const list = getStorage<VisitRequest[]>('visit_requests', []);
      return { success: true, data: list, meta: { total: list.length } };
    },

    listMe: async (params?: string) => {
      if (useRealApi()) {
        const res = await request(`/api/me/visit-requests${params || ''}`);
        return res.json();
      }
      initSimulationDB();
      const customer = getStoredUser();
      const list = getStorage<VisitRequest[]>('visit_requests', []).filter(v => v.customer_id === customer?.id);
      return { success: true, data: list, meta: { total: list.length } };
    },

    getDetail: async (id: string) => {
      if (useRealApi()) {
        const res = await request(`/api/visit-requests/${id}`);
        return res.json();
      }
      initSimulationDB();
      const list = getStorage<VisitRequest[]>('visit_requests', []);
      const item = list.find(v => v.id === id);
      if (!item) return { success: false, error: { code: 'NOT_FOUND' } };
      return { success: true, data: item };
    },

    schedule: async (id: string, data: { scheduled_at: string; location: string; admin_id?: string }) => {
      if (useRealApi()) {
        const res = await request(`/api/visit-requests/${id}/schedule`, {
          method: 'PATCH',
          body: JSON.stringify(data)
        });
        return res.json();
      }

      initSimulationDB();
      const list = getStorage<VisitRequest[]>('visit_requests', []);
      const idx = list.findIndex(v => v.id === id);
      if (idx === -1) return { success: false, error: { code: 'NOT_FOUND' } };
      
      list[idx].status = 'scheduled';
      list[idx].scheduled_at = data.scheduled_at;
      list[idx].location = data.location;
      list[idx].admin_id = data.admin_id;
      list[idx].updated_at = new Date().toISOString();
      setStorage('visit_requests', list);

      // Audit and notify customer
      const me = getStoredUser();
      if (me) addAuditLog(me, 'schedule_visit', 'visit_requests', id, { scheduled_at: data.scheduled_at, location: data.location });

      const notifs = getStorage<Notification[]>('notifications', []);
      notifs.unshift({
        id: 'nt_' + Math.random().toString(36).substr(2, 9),
        user_id: list[idx].customer_id,
        title: 'Jadwal Kunjungan Fisik Terkonfirmasi',
        content: `Kunjungan Anda untuk ${list[idx].vehicle?.brand} ${list[idx].vehicle?.model} dijadwalkan pada ${new Date(data.scheduled_at).toLocaleString('id-ID')} di ${data.location}.`,
        is_read: false,
        created_at: new Date().toISOString()
      });
      setStorage('notifications', notifs);

      return { success: true, data: { visit_request: list[idx] } };
    },

    updateStatus: async (id: string, data: { status: VisitRequest['status']; notes?: string }) => {
      if (useRealApi()) {
        const res = await request(`/api/visit-requests/${id}/status`, {
          method: 'PATCH',
          body: JSON.stringify(data)
        });
        return res.json();
      }

      initSimulationDB();
      const list = getStorage<VisitRequest[]>('visit_requests', []);
      const idx = list.findIndex(v => v.id === id);
      if (idx === -1) return { success: false, error: { code: 'NOT_FOUND' } };
      
      list[idx].status = data.status;
      if (data.notes) list[idx].notes = data.notes;
      list[idx].updated_at = new Date().toISOString();
      setStorage('visit_requests', list);

      const me = getStoredUser();
      if (me) addAuditLog(me, 'update_visit_status', 'visit_requests', id, { status: data.status });

      return { success: true, data: { visit_request: list[idx] } };
    },

    addPhoto: async (id: string, mediaAssetId: string) => {
      if (useRealApi()) {
        const res = await request(`/api/visit-requests/${id}/photos`, {
          method: 'POST',
          body: JSON.stringify({ media_asset_id: mediaAssetId })
        });
        return res.json();
      }

      initSimulationDB();
      const list = getStorage<VisitRequest[]>('visit_requests', []);
      const idx = list.findIndex(v => v.id === id);
      if (idx === -1) return { success: false, error: { code: 'NOT_FOUND' } };
      
      const newPhoto: VisitPhoto = {
        id: 'vph_' + Math.random().toString(36).substr(2, 9),
        visit_request_id: id,
        file_url: mediaAssetId,
        moderation_status: 'pending_review',
        created_at: new Date().toISOString()
      };

      if (!list[idx].photos) list[idx].photos = [];
      list[idx].photos?.push(newPhoto);
      setStorage('visit_requests', list);

      return { success: true, data: { visit_photo: newPhoto } };
    },

    moderatePhoto: async (photoId: string, moderationStatus: VisitPhoto['moderation_status']) => {
      if (useRealApi()) {
        const res = await request(`/api/visit-photos/${photoId}/moderate`, {
          method: 'PATCH',
          body: JSON.stringify({ moderation_status: moderationStatus })
        });
        return res.json();
      }

      initSimulationDB();
      const list = getStorage<VisitRequest[]>('visit_requests', []);
      let updatedPhoto: VisitPhoto | null = null;
      let targetVehicleId = '';

      for (let i = 0; i < list.length; i++) {
        const phIdx = list[i].photos?.findIndex(p => p.id === photoId);
        if (phIdx !== undefined && phIdx !== -1) {
          list[i].photos![phIdx].moderation_status = moderationStatus;
          updatedPhoto = list[i].photos![phIdx];
          targetVehicleId = list[i].vehicle_id;
          break;
        }
      }

      if (!updatedPhoto) return { success: false, error: { code: 'NOT_FOUND', message: 'Foto kunjungan tidak ditemukan.' } };
      setStorage('visit_requests', list);

      const me = getStoredUser();
      if (me) addAuditLog(me, 'moderate_visit_photo', 'visit_photos', photoId, { moderation_status: moderationStatus });

      // If approved, append to the vehicle's published visit photos
      if (moderationStatus === 'published') {
        const vehicles = getStorage<Vehicle[]>('vehicles', []);
        const vIdx = vehicles.findIndex(v => v.id === targetVehicleId);
        if (vIdx !== -1) {
          if (!vehicles[vIdx].visit_photos_published) vehicles[vIdx].visit_photos_published = [];
          vehicles[vIdx].visit_photos_published.push(updatedPhoto.file_url);
          setStorage('vehicles', vehicles);
        }
      }

      return { success: true, data: { visit_photo: updatedPhoto } };
    }
  },

  // ==========================================
  // TRANSACTIONS & ESCROW
  // ==========================================
  transactions: {
    create: async (data: { product_type: 'vehicle' | 'spare_part'; product_id: string; quantity?: number }) => {
      if (useRealApi()) {
        const res = await request('/api/transactions', {
          method: 'POST',
          body: JSON.stringify(data)
        });
        return res.json();
      }

      initSimulationDB();
      const list = getStorage<Transaction[]>('transactions', []);
      const vehicles = getStorage<Vehicle[]>('vehicles', []);
      const parts = getStorage<SparePart[]>('spare_parts', []);
      const customer = getStoredUser();

      let nameOrModel = '';
      let price = 0;

      if (data.product_type === 'vehicle') {
        const v = vehicles.find(item => item.id === data.product_id);
        nameOrModel = v ? `${v.brand} ${v.model}` : 'Kendaraan';
        price = v ? v.price : 0;
      } else {
        const p = parts.find(item => item.id === data.product_id);
        nameOrModel = p ? p.name : 'Suku Cadang';
        price = p ? p.price : 0;
      }

      const newTx: Transaction = {
        id: 'tx_' + Math.random().toString(36).substr(2, 9),
        product_type: data.product_type,
        product_id: data.product_id,
        customer_id: customer?.id || 'guest',
        quantity: data.quantity || 1,
        status: 'pending_payment',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        product_details: {
          name_or_model: nameOrModel,
          price
        },
        customer: customer ? { name: customer.name, phone: customer.phone } : undefined
      };

      list.push(newTx);
      setStorage('transactions', list);

      // Notify customer
      const notifs = getStorage<Notification[]>('notifications', []);
      notifs.unshift({
        id: 'nt_' + Math.random().toString(36).substr(2, 9),
        user_id: customer?.id || '',
        title: 'Transaksi Dibuat',
        content: `Transaksi untuk ${nameOrModel} berhasil dibuat. Silakan transfer pembayaran manual dan unggah bukti transfer.`,
        is_read: false,
        created_at: new Date().toISOString()
      });
      setStorage('notifications', notifs);

      return { success: true, data: { transaction: newTx } };
    },

    listAll: async (params?: string) => {
      if (useRealApi()) {
        const res = await request(`/api/transactions${params || ''}`);
        return res.json();
      }
      initSimulationDB();
      const list = getStorage<Transaction[]>('transactions', []);
      return { success: true, data: list, meta: { total: list.length } };
    },

    listMe: async (params?: string) => {
      if (useRealApi()) {
        const res = await request(`/api/me/transactions${params || ''}`);
        return res.json();
      }
      initSimulationDB();
      const customer = getStoredUser();
      const list = getStorage<Transaction[]>('transactions', []).filter(t => t.customer_id === customer?.id);
      return { success: true, data: list, meta: { total: list.length } };
    },

    getDetail: async (id: string) => {
      if (useRealApi()) {
        const res = await request(`/api/transactions/${id}`);
        return res.json();
      }
      initSimulationDB();
      const list = getStorage<Transaction[]>('transactions', []);
      const item = list.find(t => t.id === id);
      if (!item) return { success: false, error: { code: 'NOT_FOUND' } };
      return { success: true, data: item };
    },

    uploadPaymentProof: async (id: string, mediaAssetId: string) => {
      if (useRealApi()) {
        const res = await request(`/api/transactions/${id}/payment-proof`, {
          method: 'POST',
          body: JSON.stringify({ media_asset_id: mediaAssetId })
        });
        return res.json();
      }

      initSimulationDB();
      const list = getStorage<Transaction[]>('transactions', []);
      const idx = list.findIndex(t => t.id === id);
      if (idx === -1) return { success: false, error: { code: 'NOT_FOUND' } };

      list[idx].payment_proof_url = mediaAssetId; // Simulator simulates image url
      list[idx].updated_at = new Date().toISOString();
      setStorage('transactions', list);

      return { success: true, data: { transaction: list[idx] } };
    },

    verifyPayment: async (id: string, data: { approved: boolean; notes?: string }) => {
      if (useRealApi()) {
        const res = await request(`/api/transactions/${id}/verify-payment`, {
          method: 'PATCH',
          body: JSON.stringify(data)
        });
        return res.json();
      }

      initSimulationDB();
      const list = getStorage<Transaction[]>('transactions', []);
      const idx = list.findIndex(t => t.id === id);
      if (idx === -1) return { success: false, error: { code: 'NOT_FOUND' } };

      const status = data.approved ? 'funds_held' : 'cancelled';
      list[idx].status = status;
      if (data.notes) list[idx].notes = data.notes;
      list[idx].updated_at = new Date().toISOString();
      setStorage('transactions', list);

      // Audit and Notification
      const me = getStoredUser();
      if (me) addAuditLog(me, 'verify_payment', 'transactions', id, { approved: data.approved, notes: data.notes });

      const notifs = getStorage<Notification[]>('notifications', []);
      notifs.unshift({
        id: 'nt_' + Math.random().toString(36).substr(2, 9),
        user_id: list[idx].customer_id,
        title: data.approved ? 'Pembayaran Terverifikasi (Escrow)' : 'Pembayaran Ditolak',
        content: data.approved 
          ? `Pembayaran transaksi ${list[idx].product_details?.name_or_model} diverifikasi. Dana Anda sekarang ditahan secara aman di escrow platform.`
          : `Verifikasi pembayaran transaksi ${list[idx].product_details?.name_or_model} gagal: ${data.notes || ''}.`,
        is_read: false,
        created_at: new Date().toISOString()
      });
      setStorage('notifications', notifs);

      return { success: true, data: { transaction: list[idx] } };
    },

    getApprovalQueue: async () => {
      if (useRealApi()) {
        const res = await request('/api/transactions/approval-queue');
        return res.json();
      }
      initSimulationDB();
      const list = getStorage<Transaction[]>('transactions', []).filter(t => t.status === 'funds_held');
      return { success: true, data: list };
    },

    releaseFunds: async (id: string, notes?: string) => {
      if (useRealApi()) {
        const res = await request(`/api/transactions/${id}/release`, {
          method: 'PATCH',
          body: JSON.stringify({ notes })
        });
        return res.json();
      }

      initSimulationDB();
      const list = getStorage<Transaction[]>('transactions', []);
      const idx = list.findIndex(t => t.id === id);
      if (idx === -1) return { success: false, error: { code: 'NOT_FOUND' } };

      list[idx].status = 'released_to_seller';
      if (notes) list[idx].notes = notes;
      list[idx].updated_at = new Date().toISOString();
      setStorage('transactions', list);

      // If it's a vehicle, we might mark it as SOLD
      if (list[idx].product_type === 'vehicle') {
        const vehicles = getStorage<Vehicle[]>('vehicles', []);
        const vIdx = vehicles.findIndex(v => v.id === list[idx].product_id);
        if (vIdx !== -1) {
          vehicles[vIdx].status = 'sold';
          setStorage('vehicles', vehicles);
        }
      }

      // Audit and notify
      const me = getStoredUser();
      if (me) addAuditLog(me, 'release_funds', 'transactions', id, { notes });

      const notifs = getStorage<Notification[]>('notifications', []);
      notifs.unshift({
        id: 'nt_' + Math.random().toString(36).substr(2, 9),
        user_id: list[idx].customer_id,
        title: 'Dana Dirilis ke Penjual',
        content: `Transaksi ${list[idx].product_details?.name_or_model} sukses diselesaikan. Terima kasih telah mempercayai platform kami.`,
        is_read: false,
        created_at: new Date().toISOString()
      });
      setStorage('notifications', notifs);

      return { success: true, data: { transaction: list[idx] } };
    },

    dispute: async (id: string, data: { dispute_reason: string }) => {
      if (useRealApi()) {
        const res = await request(`/api/transactions/${id}/dispute`, {
          method: 'PATCH',
          body: JSON.stringify(data)
        });
        return res.json();
      }

      initSimulationDB();
      const list = getStorage<Transaction[]>('transactions', []);
      const idx = list.findIndex(t => t.id === id);
      if (idx === -1) return { success: false, error: { code: 'NOT_FOUND' } };

      list[idx].status = 'disputed';
      list[idx].dispute_reason = data.dispute_reason;
      list[idx].updated_at = new Date().toISOString();
      setStorage('transactions', list);

      const me = getStoredUser();
      if (me) addAuditLog(me, 'dispute_transaction', 'transactions', id, { reason: data.dispute_reason });

      // Notify customer and Admin/Owner is notified through their dashboard
      const notifs = getStorage<Notification[]>('notifications', []);
      notifs.unshift({
        id: 'nt_' + Math.random().toString(36).substr(2, 9),
        user_id: list[idx].customer_id,
        title: 'Komplain/Dispute Diajukan',
        content: `Komplain untuk transaksi ${list[idx].product_details?.name_or_model} berhasil dicatat. Admin Sistem sedang menengahi masalah ini.`,
        is_read: false,
        created_at: new Date().toISOString()
      });
      setStorage('notifications', notifs);

      return { success: true, data: { transaction: list[idx] } };
    },

    resolveDispute: async (id: string, data: { resolution: 'released' | 'refunded' | 'cancelled'; notes: string }) => {
      if (useRealApi()) {
        const res = await request(`/api/transactions/${id}/resolve`, {
          method: 'PATCH',
          body: JSON.stringify(data)
        });
        return res.json();
      }

      initSimulationDB();
      const list = getStorage<Transaction[]>('transactions', []);
      const idx = list.findIndex(t => t.id === id);
      if (idx === -1) return { success: false, error: { code: 'NOT_FOUND' } };

      const statusMap = {
        released: 'released_to_seller',
        refunded: 'refunded',
        cancelled: 'cancelled'
      };

      list[idx].status = statusMap[data.resolution] as Transaction['status'];
      list[idx].resolution_notes = data.notes;
      list[idx].updated_at = new Date().toISOString();
      setStorage('transactions', list);

      // Audit and notify
      const me = getStoredUser();
      if (me) addAuditLog(me, 'resolve_dispute', 'transactions', id, { resolution: data.resolution, notes: data.notes });

      const notifs = getStorage<Notification[]>('notifications', []);
      notifs.unshift({
        id: 'nt_' + Math.random().toString(36).substr(2, 9),
        user_id: list[idx].customer_id,
        title: 'Keputusan Sengketa (Dispute Resolution)',
        content: `Sengketa transaksi ${list[idx].product_details?.name_or_model} telah diselesaikan oleh Owner dengan keputusan: ${data.resolution.toUpperCase()}. Catatan: ${data.notes}`,
        is_read: false,
        created_at: new Date().toISOString()
      });
      setStorage('notifications', notifs);

      return { success: true, data: { transaction: list[idx] } };
    },

    cancel: async (id: string, reason?: string) => {
      if (useRealApi()) {
        const res = await request(`/api/transactions/${id}/cancel`, {
          method: 'PATCH',
          body: JSON.stringify({ reason })
        });
        return res.json();
      }

      initSimulationDB();
      const list = getStorage<Transaction[]>('transactions', []);
      const idx = list.findIndex(t => t.id === id);
      if (idx === -1) return { success: false, error: { code: 'NOT_FOUND' } };

      list[idx].status = 'cancelled';
      if (reason) list[idx].notes = reason;
      list[idx].updated_at = new Date().toISOString();
      setStorage('transactions', list);

      const me = getStoredUser();
      if (me) addAuditLog(me, 'cancel_transaction', 'transactions', id, { reason });

      return { success: true, data: { transaction: list[idx] } };
    }
  },

  // ==========================================
  // LEADS SYSTEM
  // ==========================================
  leads: {
    create: async (data: { source: 'contact_form' | 'whatsapp_modal'; name: string; email?: string; phone: string; message?: string; related_product_type?: 'vehicle' | 'spare_part'; related_product_id?: string }) => {
      if (useRealApi()) {
        const res = await request('/api/leads', {
          method: 'POST',
          body: JSON.stringify(data)
        });
        return res.json();
      }

      initSimulationDB();
      const list = getStorage<Lead[]>('leads', []);
      const newLead: Lead = {
        id: 'ld_' + Math.random().toString(36).substr(2, 9),
        ...data,
        created_at: new Date().toISOString()
      };
      list.push(newLead);
      setStorage('leads', list);
      return { success: true, data: { lead: newLead } };
    },

    list: async (params?: string) => {
      if (useRealApi()) {
        const res = await request(`/api/leads${params || ''}`);
        return res.json();
      }
      initSimulationDB();
      const list = getStorage<Lead[]>('leads', []);
      const sorted = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return simulatePaginationAndFilters<Lead>(sorted, params, (item, q) => {
        if (q.search) {
          const matchName = item.name.toLowerCase().includes(q.search);
          const matchPhone = item.phone.toLowerCase().includes(q.search);
          const matchEmail = (item.email || '').toLowerCase().includes(q.search);
          if (!matchName && !matchPhone && !matchEmail) return false;
        }
        return true;
      });
    },

    get: async (id: string) => {
      if (useRealApi()) {
        const res = await request(`/api/leads/${id}`);
        return res.json();
      }
      initSimulationDB();
      const list = getStorage<Lead[]>('leads', []);
      const item = list.find(l => l.id === id);
      if (!item) return { success: false, error: { code: 'NOT_FOUND' } };
      return { success: true, data: item };
    }
  },

  // ==========================================
  // ARTICLES
  // ==========================================
  articles: {
    list: async (params?: string) => {
      if (useRealApi()) {
        const res = await request(`/api/articles${params || ''}`);
        return res.json();
      }
      initSimulationDB();
      const list = getStorage<Article[]>('articles', []);
      return simulatePaginationAndFilters<Article>(list, params, (a, q) => {
        if (a.status !== 'published') return false;
        if (q.search) {
          const matchTitle = a.title.toLowerCase().includes(q.search);
          const matchContent = (a.content || '').toLowerCase().includes(q.search);
          const matchCategory = (a.category || '').toLowerCase().includes(q.search);
          if (!matchTitle && !matchContent && !matchCategory) return false;
        }
        return true;
      });
    },

    get: async (slug: string) => {
      if (useRealApi()) {
        const res = await request(`/api/articles/${slug}`);
        return res.json();
      }
      initSimulationDB();
      const list = getStorage<Article[]>('articles', []);
      // Can get by slug or id
      const item = list.find(a => a.slug === slug || a.id === slug);
      if (!item) return { success: false, error: { code: 'NOT_FOUND', message: 'Artikel tidak ditemukan' } };
      return { success: true, data: item };
    },

    adminList: async (params?: string) => {
      if (useRealApi()) {
        const res = await request(`/api/admin/articles${params || ''}`);
        return res.json();
      }
      initSimulationDB();
      const list = getStorage<Article[]>('articles', []);
      return simulatePaginationAndFilters<Article>(list, params, (a, q) => {
        if (q.search) {
          if (!a.title.toLowerCase().includes(q.search)) return false;
        }
        return true;
      });
    },

    create: async (data: any) => {
      if (useRealApi()) {
        const res = await request('/api/articles', {
          method: 'POST',
          body: JSON.stringify(data)
        });
        return res.json();
      }

      initSimulationDB();
      const list = getStorage<Article[]>('articles', []);
      const newA: Article = {
        id: 'art_' + Math.random().toString(36).substr(2, 9),
        title: data.title,
        slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        content: data.content,
        category: data.category,
        status: 'draft',
        seo_title: data.seo_title || data.title,
        seo_description: data.seo_description || '',
        cover_url: data.cover_media_id || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      list.push(newA);
      setStorage('articles', list);

      const me = getStoredUser();
      if (me) addAuditLog(me, 'create_article', 'articles', newA.id, { title: newA.title });

      return { success: true, data: { article: newA } };
    },

    update: async (id: string, data: any) => {
      if (useRealApi()) {
        const res = await request(`/api/articles/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
        return res.json();
      }

      initSimulationDB();
      const list = getStorage<Article[]>('articles', []);
      const idx = list.findIndex(a => a.id === id);
      if (idx === -1) return { success: false, error: { code: 'NOT_FOUND' } };

      const updated = {
        ...list[idx],
        ...data,
        slug: data.title ? data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : list[idx].slug,
        updated_at: new Date().toISOString()
      };
      list[idx] = updated;
      setStorage('articles', list);

      const me = getStoredUser();
      if (me) addAuditLog(me, 'update_article', 'articles', id, { title: updated.title });

      return { success: true, data: { article: updated } };
    },

    updateStatus: async (id: string, status: Article['status']) => {
      if (useRealApi()) {
        const res = await request(`/api/articles/${id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status })
        });
        return res.json();
      }

      initSimulationDB();
      const list = getStorage<Article[]>('articles', []);
      const idx = list.findIndex(a => a.id === id);
      if (idx === -1) return { success: false, error: { code: 'NOT_FOUND' } };

      list[idx].status = status;
      list[idx].updated_at = new Date().toISOString();
      setStorage('articles', list);

      const me = getStoredUser();
      if (me) addAuditLog(me, 'update_article_status', 'articles', id, { status });

      return { success: true, data: { article: list[idx] } };
    },

    delete: async (id: string) => {
      if (useRealApi()) {
        const res = await request(`/api/articles/${id}`, {
          method: 'DELETE'
        });
        return res.json();
      }

      initSimulationDB();
      const list = getStorage<Article[]>('articles', []);
      const filtered = list.filter(a => a.id !== id);
      setStorage('articles', filtered);

      const me = getStoredUser();
      if (me) addAuditLog(me, 'delete_article', 'articles', id);

      return { success: true, data: { message: 'Artikel sukses dihapus.' } };
    }
  },

  // ==========================================
  // MEDIA LIBRARY
  // ==========================================
  media: {
    upload: async (file: File) => {
      if (useRealApi()) {
        const formData = new FormData();
        formData.append('file', file);
        const headers = new Headers();
        if (accessToken) {
          headers.set('Authorization', `Bearer ${accessToken}`);
        }
        const res = await fetch(`${REAL_API_URL}/api/media`, {
          method: 'POST',
          headers,
          body: formData
        });
        return res.json();
      }

      // Simulator (Create object URL)
      const fakeUrl = URL.createObjectURL(file);
      return {
        success: true,
        data: {
          media_asset: {
            id: fakeUrl,
            file_url: fakeUrl,
            width: 800,
            height: 600,
            size_bytes: file.size
          }
        }
      };
    },

    getUsage: async () => {
      if (useRealApi()) {
        const res = await request('/api/media/usage');
        return res.json();
      }
      // Simulator: calculate random usage out of 1GB
      return {
        success: true,
        data: {
          used_bytes: 345000000, // ~345MB
          quota_bytes: 1073741824, // 1GB
          percentage: 32.1
        }
      };
    }
  },

  // ==========================================
  // NOTIFICATIONS
  // ==========================================
  notifications: {
    list: async () => {
      if (useRealApi()) {
        const res = await request('/api/notifications');
        return res.json();
      }
      initSimulationDB();
      const customer = getStoredUser();
      const list = getStorage<Notification[]>('notifications', []).filter(n => !n.user_id || n.user_id === customer?.id);
      const unread = list.filter(n => !n.is_read).length;
      return { success: true, data: list, unread_count: unread };
    },

    read: async (id: string) => {
      if (useRealApi()) {
        const res = await request(`/api/notifications/${id}/read`, {
          method: 'PATCH'
        });
        return res.json();
      }

      initSimulationDB();
      const list = getStorage<Notification[]>('notifications', []);
      const idx = list.findIndex(n => n.id === id);
      if (idx !== -1) {
        list[idx].is_read = true;
        setStorage('notifications', list);
      }
      return { success: true };
    },

    readAll: async () => {
      if (useRealApi()) {
        const res = await request('/api/notifications/read-all', {
          method: 'PATCH'
        });
        return res.json();
      }

      initSimulationDB();
      const customer = getStoredUser();
      const list = getStorage<Notification[]>('notifications', []);
      list.forEach(n => {
        if (!n.user_id || n.user_id === customer?.id) {
          n.is_read = true;
        }
      });
      setStorage('notifications', list);
      return { success: true, data: { message: 'Semua notifikasi ditandai dibaca.' } };
    }
  },

  // ==========================================
  // TRACKING INSIGHTS
  // ==========================================
  insights: {
    getOverview: async (dateFrom?: string, dateTo?: string) => {
      if (useRealApi()) {
        const query = dateFrom ? `?date_from=${dateFrom}&date_to=${dateTo}` : '';
        const res = await request(`/api/insights/overview${query}`);
        return res.json();
      }
      initSimulationDB();
      const leads = getStorage<Lead[]>('leads', []);
      const transactions = getStorage<Transaction[]>('transactions', []);
      
      const totalLeads = leads.length;
      const totalTx = transactions.length;
      const fundsHeld = transactions.filter(t => t.status === 'funds_held').length;
      const released = transactions.filter(t => t.status === 'released_to_seller').length;
      const totalRevenue = transactions
        .filter(t => t.status === 'released_to_seller' || t.status === 'funds_held')
        .reduce((sum, t) => sum + (t.product_details?.price || 0) * t.quantity, 0);

      return {
        success: true,
        data: {
          summary: {
            total_leads: totalLeads,
            total_transactions: totalTx,
            funds_held_count: fundsHeld,
            released_count: released,
            total_revenue: totalRevenue,
            leads_by_source: {
              contact_form: leads.filter(l => l.source === 'contact_form').length,
              whatsapp_modal: leads.filter(l => l.source === 'whatsapp_modal').length,
            },
            transactions_by_status: {
              pending_payment: transactions.filter(t => t.status === 'pending_payment').length,
              funds_held: fundsHeld,
              released_to_seller: released,
              disputed: transactions.filter(t => t.status === 'disputed').length,
              cancelled: transactions.filter(t => t.status === 'cancelled').length,
            }
          }
        }
      };
    }
  },

  // ==========================================
  // AUDIT LOGS
  // ==========================================
  auditLogs: {
    list: async (params?: string) => {
      if (useRealApi()) {
        const res = await request(`/api/audit-logs${params || ''}`);
        return res.json();
      }
      initSimulationDB();
      const list = getStorage<AuditLog[]>('audit_logs', []);
      // Sort newest first
      const sorted = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return simulatePaginationAndFilters<AuditLog>(sorted, params, (item, q) => {
        if (q.search) {
          const matchAction = (item.action_type || '').toLowerCase().includes(q.search);
          const matchUser = (item.actor_name || '').toLowerCase().includes(q.search);
          const matchTarget = (item.target_entity || '').toLowerCase().includes(q.search);
          if (!matchAction && !matchUser && !matchTarget) return false;
        }
        return true;
      });
    }
  },

  // ==========================================
  // EMAIL LOGS
  // ==========================================
  emailLogs: {
    list: async (params?: string) => {
      if (useRealApi()) {
        const res = await request(`/api/email-logs${params || ''}`);
        return res.json();
      }
      initSimulationDB();
      const list = getStorage<EmailLog[]>('email_logs', []);
      // Sort newest first
      const sorted = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return simulatePaginationAndFilters<EmailLog>(sorted, params, (item, q) => {
        if (q.search) {
          const matchTo = (item.recipient_email || '').toLowerCase().includes(q.search);
          const matchPurpose = (item.purpose || '').toLowerCase().includes(q.search);
          if (!matchTo && !matchPurpose) return false;
        }
        return true;
      });
    },

    getUsageToday: async () => {
      if (useRealApi()) {
        const res = await request('/api/email-logs/usage-today');
        return res.json();
      }
      initSimulationDB();
      const logs = getStorage<EmailLog[]>('email_logs', []);
      const settings = getStorage<PlatformSetting[]>('settings', INITIAL_SETTINGS);
      const limitSetting = settings.find(s => s.key === 'email_daily_limit');
      const limit = limitSetting ? parseInt(limitSetting.value) : 250;
      
      const todayStr = new Date().toISOString().split('T')[0];
      const sentToday = logs.filter(l => l.status === 'sent' && l.created_at.startsWith(todayStr)).length;

      return {
        success: true,
        data: {
          sent_today: sentToday,
          limit,
          remaining: Math.max(0, limit - sentToday),
          date: todayStr
        }
      };
    }
  },

  // ==========================================
  // PLATFORM SETTINGS
  // ==========================================
  settings: {
    getPublic: async () => {
      if (useRealApi()) {
        const res = await fetch(`${REAL_API_URL}/api/settings/public`);
        return res.json();
      }
      initSimulationDB();
      const s = getStorage<PlatformSetting[]>('settings', INITIAL_SETTINGS);
      return {
        success: true,
        data: {
          platform_name: s.find(item => item.key === 'platform_name')?.value || 'LCS Motor',
          platform_logo_url: s.find(item => item.key === 'platform_logo_url')?.value || ''
        }
      };
    },

    getAll: async () => {
      if (useRealApi()) {
        const res = await request('/api/settings');
        return res.json();
      }
      initSimulationDB();
      const s = getStorage<PlatformSetting[]>('settings', INITIAL_SETTINGS);
      return { success: true, data: s };
    },

    patch: async (key: string, value: string) => {
      if (useRealApi()) {
        const res = await request(`/api/settings/${key}`, {
          method: 'PATCH',
          body: JSON.stringify({ value })
        });
        return res.json();
      }

      initSimulationDB();
      const s = getStorage<PlatformSetting[]>('settings', INITIAL_SETTINGS);
      const idx = s.findIndex(item => item.key === key);
      if (idx !== -1) {
        s[idx].value = value;
      } else {
        s.push({ key, value });
      }
      setStorage('settings', s);

      const me = getStoredUser();
      if (me) addAuditLog(me, 'update_settings', 'platform_settings', key, { value });

      return { success: true, data: { key, value } };
    },

    toggleRegistration: async (open: boolean) => {
      if (useRealApi()) {
        const res = await request('/api/settings/registration-toggle', {
          method: 'PATCH',
          body: JSON.stringify({ registration_open: open })
        });
        return res.json();
      }
      return api.settings.patch('registration_open', open ? 'true' : 'false');
    }
  },

  // ==========================================
  // USER MANAGEMENT & RBAC
  // ==========================================
  users: {
    list: async (params?: string) => {
      if (useRealApi()) {
        const res = await request(`/api/users${params || ''}`);
        return res.json();
      }
      initSimulationDB();
      const list = getStorage<User[]>('users', []);
      return simulatePaginationAndFilters<User>(list, params, (u, q) => {
        if (q.search) {
          const matchName = u.name.toLowerCase().includes(q.search);
          const matchEmail = u.email.toLowerCase().includes(q.search);
          const matchPhone = (u.phone || '').toLowerCase().includes(q.search);
          if (!matchName && !matchEmail && !matchPhone) return false;
        }
        if (q.role && u.role !== q.role) return false;
        return true;
      });
    },

    getDetail: async (id: string) => {
      if (useRealApi()) {
        const res = await request(`/api/users/${id}`);
        return res.json();
      }
      initSimulationDB();
      const list = getStorage<User[]>('users', []);
      const user = list.find(u => u.id === id);
      if (!user) return { success: false, error: { code: 'NOT_FOUND' } };
      return { success: true, data: user };
    },

    create: async (data: { name: string; email: string; role: UserRole; phone?: string; password?: string }) => {
      if (useRealApi()) {
        const res = await request('/api/users', {
          method: 'POST',
          body: JSON.stringify(data)
        });
        return res.json();
      }

      initSimulationDB();
      const list = getStorage<User[]>('users', []);
      if (list.some(u => u.email === data.email)) {
        return { success: false, error: { code: 'VALIDATION_ERROR', message: 'Email sudah terdaftar.' } };
      }

      const newU: User = {
        id: 'u_' + Math.random().toString(36).substr(2, 9),
        name: data.name,
        email: data.email,
        role: data.role,
        phone: data.phone,
        is_active: true,
        email_verified_at: new Date().toISOString(), // Admin-created is verified by default
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      list.push(newU);
      setStorage('users', list);

      const me = getStoredUser();
      if (me) addAuditLog(me, 'admin_create_user', 'users', newU.id, { role: newU.role, email: newU.email });

      return { success: true, data: { user: newU } };
    },

    patch: async (id: string, data: { role?: UserRole; is_active?: boolean }) => {
      if (useRealApi()) {
        const res = await request(`/api/users/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(data)
        });
        return res.json();
      }

      initSimulationDB();
      const list = getStorage<User[]>('users', []);
      const idx = list.findIndex(u => u.id === id);
      if (idx === -1) return { success: false, error: { code: 'NOT_FOUND' } };

      const updated = {
        ...list[idx],
        ...data,
        updated_at: new Date().toISOString()
      };
      list[idx] = updated;
      setStorage('users', list);

      const me = getStoredUser();
      if (me) addAuditLog(me, 'admin_patch_user', 'users', id, data);

      return { success: true, data: { user: updated } };
    },

    delete: async (id: string) => {
      if (useRealApi()) {
        const res = await request(`/api/users/${id}`, {
          method: 'DELETE'
        });
        return res.json();
      }

      // Soft delete in simulator
      return api.users.patch(id, { is_active: false });
    },

    resetPasswordManual: async (id: string, data: { new_password?: string }) => {
      if (useRealApi()) {
        const res = await request(`/api/users/${id}/reset-password`, {
          method: 'PATCH',
          body: JSON.stringify(data)
        });
        return res.json();
      }

      // Simulator
      initSimulationDB();
      
      // Cooldown Check
      const logs = getStorage<AuditLog[]>('audit_logs', []);
      const userLogs = logs.filter(l => 
        l.action_type === 'admin_reset_password' && 
        l.target_entity === 'users' && 
        l.target_id === id
      );

      if (userLogs.length > 0) {
        const lastReset = new Date(userLogs[0].created_at).getTime();
        const cooldownMs = 24 * 60 * 60 * 1000; // 24 hours
        const elapsed = Date.now() - lastReset;
        
        if (elapsed < cooldownMs) {
          const nextAllowed = new Date(lastReset + cooldownMs).toISOString();
          return {
            success: false,
            error: {
              code: 'COOLDOWN_ACTIVE',
              message: `Reset password manual untuk user ini baru bisa dilakukan lagi setelah ${new Date(nextAllowed).toLocaleString('id-ID')}.`,
              meta: {
                expires_at: nextAllowed
              }
            }
          };
        }
      }

      // Perform reset
      const users = getStorage<User[]>('users', []);
      const uIdx = users.findIndex(u => u.id === id);
      if (uIdx === -1) return { success: false, error: { code: 'NOT_FOUND', message: 'User tidak ditemukan' } };

      const me = getStoredUser();
      if (me) {
        addAuditLog(me, 'admin_reset_password', 'users', id, { reason: 'email_quota_exceeded' });
      }

      return { success: true, data: { user: users[uIdx] } };
    }
  },

  // ==========================================
  // REALTIME CHAT (REST API Fallbacks)
  // ==========================================
  chat: {
    createConversation: async (data: { subject_type?: 'vehicle' | 'spare_part'; subject_id?: string; initial_message?: string }) => {
      if (useRealApi()) {
        const res = await request('/api/conversations', {
          method: 'POST',
          body: JSON.stringify(data)
        });
        return res.json();
      }

      initSimulationDB();
      const list = getStorage<Conversation[]>('conversations', []);
      const me = getStoredUser();
      if (!me) return { success: false, error: { code: 'UNAUTHORIZED' } };

      // Try finding subject name
      let subjectName = '';
      if (data.subject_type === 'vehicle') {
        const v = getStorage<Vehicle[]>('vehicles', []).find(x => x.id === data.subject_id);
        if (v) subjectName = `${v.brand} ${v.model}`;
      } else if (data.subject_type === 'spare_part') {
        const p = getStorage<SparePart[]>('spare_parts', []).find(x => x.id === data.subject_id);
        if (p) subjectName = p.name;
      }

      const newConv: Conversation = {
        id: 'c_' + Math.random().toString(36).substr(2, 9),
        subject_type: data.subject_type,
        subject_id: data.subject_id,
        subject_name: subjectName || undefined,
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        participants: [
          { user_id: me.id, name: me.name, role: me.role },
          { user_id: 'u_admin', name: 'Andi Admin Sistem', role: 'admin' } // Auto assigned
        ]
      };

      list.push(newConv);
      setStorage('conversations', list);

      if (data.initial_message) {
        const msgs = getStorage<Message[]>('messages', []);
        msgs.push({
          id: 'm_' + Math.random().toString(36).substr(2, 9),
          conversation_id: newConv.id,
          sender_id: me.id,
          sender_name: me.name,
          sender_role: me.role,
          content: data.initial_message,
          message_type: 'text',
          created_at: new Date().toISOString()
        });
        setStorage('messages', msgs);
      }

      return { success: true, data: { conversation: newConv } };
    },

    listConversations: async () => {
      if (useRealApi()) {
        const res = await request('/api/conversations');
        return res.json();
      }
      initSimulationDB();
      const me = getStoredUser();
      if (!me) return { success: false, error: { code: 'UNAUTHORIZED' } };

      const list = getStorage<Conversation[]>('conversations', []);
      const filtered = list.filter(c => 
        me.role === 'admin' || 
        me.role === 'super_admin' || 
        c.participants.some(p => p.user_id === me.id)
      );

      // Append live unread mock calculation
      const msgs = getStorage<Message[]>('messages', []);
      const conversationsWithUnread = filtered.map(c => {
        const convMsgs = msgs.filter(m => m.conversation_id === c.id);
        const lastMsg = convMsgs[convMsgs.length - 1];
        const unread = lastMsg && lastMsg.sender_id !== me.id ? 1 : 0;
        return { ...c, unread_count: unread };
      });

      return { success: true, data: conversationsWithUnread };
    },

    getConversation: async (id: string) => {
      if (useRealApi()) {
        const res = await request(`/api/conversations/${id}`);
        return res.json();
      }
      initSimulationDB();
      const list = getStorage<Conversation[]>('conversations', []);
      const conv = list.find(c => c.id === id);
      if (!conv) return { success: false, error: { code: 'NOT_FOUND' } };
      return { success: true, data: { conversation: conv, participants: conv.participants } };
    },

    listMessages: async (convId: string) => {
      if (useRealApi()) {
        const res = await request(`/api/conversations/${convId}/messages`);
        return res.json();
      }
      initSimulationDB();
      const msgs = getStorage<Message[]>('messages', []).filter(m => m.conversation_id === convId);
      return { success: true, data: msgs };
    },

    sendMessage: async (convId: string, data: { content: string; message_type?: 'text' | 'image' }) => {
      if (useRealApi()) {
        const res = await request(`/api/conversations/${convId}/messages`, {
          method: 'POST',
          body: JSON.stringify(data)
        });
        return res.json();
      }

      initSimulationDB();
      const me = getStoredUser();
      if (!me) return { success: false, error: { code: 'UNAUTHORIZED' } };

      const msgs = getStorage<Message[]>('messages', []);
      const newMsg: Message = {
        id: 'm_' + Math.random().toString(36).substr(2, 9),
        conversation_id: convId,
        sender_id: me.id,
        sender_name: me.name,
        sender_role: me.role,
        content: data.content,
        message_type: data.message_type || 'text',
        created_at: new Date().toISOString()
      };

      msgs.push(newMsg);
      setStorage('messages', msgs);

      // Auto trigger a quick echo response from Admin in simulation mode after 1 sec
      if (me.role === 'customer') {
        setTimeout(() => {
          const simMsgs = getStorage<Message[]>('messages', []);
          const simMsg: Message = {
            id: 'm_' + Math.random().toString(36).substr(2, 9),
            conversation_id: convId,
            sender_id: 'u_admin',
            sender_name: 'Andi Admin Sistem',
            sender_role: 'admin',
            content: `Terima kasih atas pesan Anda mengenai produk tersebut. Saya sedang memeriksa detailnya dan akan segera mengabari Anda kembali. Ada yang bisa saya bantu lagi?`,
            message_type: 'text',
            created_at: new Date().toISOString()
          };
          simMsgs.push(simMsg);
          setStorage('messages', simMsgs);
          window.dispatchEvent(new CustomEvent('simulation-chat-message', { detail: simMsg }));
        }, 1500);
      }

      return { success: true, data: newMsg };
    },

    closeConversation: async (convId: string) => {
      if (useRealApi()) {
        const res = await request(`/api/conversations/${convId}/close`, {
          method: 'PATCH'
        });
        return res.json();
      }

      initSimulationDB();
      const list = getStorage<Conversation[]>('conversations', []);
      const idx = list.findIndex(c => c.id === convId);
      if (idx !== -1) {
        list[idx].status = 'closed';
        setStorage('conversations', list);
      }
      return { success: true };
    }
  }
};
