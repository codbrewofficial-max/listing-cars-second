import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Vehicle, SparePart, Lead, Article, Conversation, Message, Notification, VisitRequest, Transaction } from '../types';
import { api, getStoredUser, setStoredUser, setAccessToken, setRefreshToken } from '../lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: any }>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; phone?: string }) => Promise<boolean>;
  verifyEmail: (token: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AppProvider');
  return ctx;
};

interface AppContextType {
  vehicles: Vehicle[];
  spareParts: SparePart[];
  articles: Article[];
  leads: Lead[];
  visitRequests: VisitRequest[];
  transactions: Transaction[];
  conversations: Conversation[];
  notifications: Notification[];
  unreadNotificationCount: number;
  refreshAllData: () => Promise<void>;
  addLead: (data: any) => Promise<boolean>;
  addVisitRequest: (vehicleId: string, notes?: string) => Promise<boolean>;
  addTransaction: (type: 'vehicle' | 'spare_part', id: string, qty?: number) => Promise<string | null>;
  registrationOpen: boolean;
  setRegistrationOpen: (open: boolean) => Promise<void>;
  platformName: string;
  setPlatformName: (name: string) => Promise<void>;
  platformLogoUrl: string;
  setPlatformLogoUrl: (url: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppState = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth State
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Business Data State
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [visitRequests, setVisitRequests] = useState<VisitRequest[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState<number>(0);
  
  // Platform settings
  const [registrationOpen, setRegOpen] = useState<boolean>(true);
  const [platformName, setPlatName] = useState<string>('LCS Motor');
  const [platformLogoUrl, setPlatLogoUrl] = useState<string>('');

  const refreshAllData = async () => {
    try {
      // 1. Public settings
      const settingsPub = await api.settings.getPublic();
      if (settingsPub.success && settingsPub.data) {
        setPlatName(settingsPub.data.platform_name);
        setPlatLogoUrl(settingsPub.data.platform_logo_url || '');
      }

      // 2. Products and Articles (Public)
      const resVehicles = await api.vehicles.list();
      if (resVehicles.success) setVehicles(resVehicles.data);

      const resParts = await api.spareParts.list();
      if (resParts.success) setSpareParts(resParts.data);

      const resArticles = await api.articles.list();
      if (resArticles.success) setArticles(resArticles.data);

      // 3. Authenticated Data
      const currentUser = getStoredUser();
      if (currentUser) {
        // Notifications
        const resNotifs = await api.notifications.list();
        if (resNotifs.success) {
          setNotifications(resNotifs.data);
          setUnreadNotificationCount(resNotifs.unread_count || 0);
        }

        // Conversations
        const resConvs = await api.chat.listConversations();
        if (resConvs.success) setConversations(resConvs.data);

        // Role-based lists
        if (currentUser.role === 'customer') {
          const resMyVisits = await api.visits.listMe();
          if (resMyVisits.success) setVisitRequests(resMyVisits.data);

          const resMyTx = await api.transactions.listMe();
          if (resMyTx.success) setTransactions(resMyTx.data);
        } else {
          // Internal dashboards: admin, owner, super_admin
          const resAllVisits = await api.visits.listAll();
          if (resAllVisits.success) setVisitRequests(resAllVisits.data);

          const resAllTx = await api.transactions.listAll();
          if (resAllTx.success) setTransactions(resAllTx.data);

          const resLeads = await api.leads.list();
          if (resLeads.success) setLeads(resLeads.data);

          // Get exact settings including internal for Super Admin
          if (currentUser.role === 'super_admin') {
            const allSettings = await api.settings.getAll();
            if (allSettings.success && allSettings.data) {
              const regToggle = allSettings.data.find((s: any) => s.key === 'registration_open');
              setRegOpen(regToggle?.value === 'true');
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to load application data', e);
    }
  };

  useEffect(() => {
    const initAuthAndData = async () => {
      setIsLoading(true);
      try {
        const stored = getStoredUser();
        if (stored) {
          setUser(stored);
          // Try fetching me to verify token validity
          const meRes = await api.auth.getMe();
          if (meRes.success) {
            setUser(meRes.data.user);
          } else {
            // Token is expired / invalid
            setUser(null);
            setStoredUser(null);
            setAccessToken(null);
            setRefreshToken(null);
          }
        }
      } catch (err) {
        console.error('Error verifying credentials', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuthAndData();
  }, []);

  // When user role changes or log in, pull associated data
  useEffect(() => {
    refreshAllData();
    
    // Listen for global logout events (from API response 401 interceptor)
    const handleLogout = () => {
      setUser(null);
    };
    window.addEventListener('auth-logout', handleLogout);
    return () => window.removeEventListener('auth-logout', handleLogout);
  }, [user?.id, user?.role]);

  const login = async (email: string, password?: string) => {
    const res = await api.auth.login({ email, password });
    if (res.success && res.data) {
      setUser(res.data.user);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const logout = async () => {
    await api.auth.logout();
    setUser(null);
  };

  const updateProfile = async (data: { name?: string; phone?: string }) => {
    const res = await api.auth.updateMe(data);
    if (res.success && res.data?.user) {
      setUser(res.data.user);
      return true;
    }
    return false;
  };

  const verifyEmail = async (token: string) => {
    const res = await api.auth.verifyEmail(token);
    if (res.success) {
      if (user) {
        setUser({ ...user, email_verified_at: new Date().toISOString() });
      }
      return true;
    }
    return false;
  };

  const addLead = async (data: any) => {
    const res = await api.leads.create(data);
    if (res.success) {
      await refreshAllData();
      return true;
    }
    return false;
  };

  const addVisitRequest = async (vehicleId: string, notes?: string) => {
    const res = await api.visits.request(vehicleId, notes);
    if (res.success) {
      await refreshAllData();
      return true;
    }
    return false;
  };

  const addTransaction = async (type: 'vehicle' | 'spare_part', id: string, qty?: number) => {
    const res = await api.transactions.create({ product_type: type, product_id: id, quantity: qty });
    if (res.success && res.data) {
      await refreshAllData();
      return res.data.transaction.id;
    }
    return null;
  };

  const setRegistrationOpen = async (open: boolean) => {
    const res = await api.settings.toggleRegistration(open);
    if (res.success) {
      setRegOpen(open);
    }
  };

  const setPlatformName = async (name: string) => {
    const res = await api.settings.patch('platform_name', name);
    if (res.success) {
      setPlatName(name);
    }
  };

  const setPlatformLogoUrl = async (url: string) => {
    const res = await api.settings.patch('platform_logo_url', url);
    if (res.success) {
      setPlatLogoUrl(url);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, updateProfile, verifyEmail }}>
      <AppContext.Provider value={{
        vehicles,
        spareParts,
        articles,
        leads,
        visitRequests,
        transactions,
        conversations,
        notifications,
        unreadNotificationCount,
        refreshAllData,
        addLead,
        addVisitRequest,
        addTransaction,
        registrationOpen,
        setRegistrationOpen,
        platformName,
        setPlatformName,
        platformLogoUrl,
        setPlatformLogoUrl
      }}>
        {children}
      </AppContext.Provider>
    </AuthContext.Provider>
  );
};
