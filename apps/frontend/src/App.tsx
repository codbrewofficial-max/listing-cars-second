import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { VehicleKatalog } from './pages/VehicleKatalog';
import { VehicleDetail } from './pages/VehicleDetail';
import { SparePartKatalog } from './pages/SparePartKatalog';
import { SparePartDetail } from './pages/SparePartDetail';
import { Articles } from './pages/Articles';
import { ArticleDetail } from './pages/ArticleDetail';
import { Auth } from './pages/Auth';
import { VerifyEmail } from './pages/VerifyEmail';
import { ResetPassword } from './pages/ResetPassword';
import { DashboardSuperAdmin } from './pages/DashboardSuperAdmin';
import { DashboardOwner } from './pages/DashboardOwner';
import { DashboardAdminSistem } from './pages/DashboardAdminSistem';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <HelmetProvider>
        <AppProvider>
          <Layout>
            <Routes>
            <Route path="/" element={<LandingPage />} />
            
            {/* Vehicle Catalog */}
            <Route path="/katalog-kendaraan" element={<VehicleKatalog />} />
            <Route path="/katalog-kendaraan/:id" element={<VehicleDetail />} />
            
            {/* Spare Parts Catalog */}
            <Route path="/katalog-sparepart" element={<SparePartKatalog />} />
            <Route path="/katalog-sparepart/:id" element={<SparePartDetail />} />
            
            {/* Articles Educational System */}
            <Route path="/articles" element={<Articles />} />
            <Route path="/articles/:slug" element={<ArticleDetail />} />
            
            {/* Authentication Flow */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/verify-email" element={<VerifyEmail />} />  
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Dashboards Roles */}
            <Route path="/dashboard/super-admin" element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <DashboardSuperAdmin />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/owner" element={
              <ProtectedRoute allowedRoles={['owner']}>
                <DashboardOwner />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/admin-sistem" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardAdminSistem />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/customer" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerDashboard />
              </ProtectedRoute>
            } />
            
            {/* Fallback route */}
            <Route path="*" element={<LandingPage />} />
          </Routes>
        </Layout>
      </AppProvider>
    </HelmetProvider>
  </BrowserRouter>
  );
}
