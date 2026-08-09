import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { PricingPage } from './pages/PricingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { PublicEventGalleryPage } from './pages/PublicEventGalleryPage';
import { PurchaseSuccessPage } from './pages/PurchaseSuccessPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';

export function AppContent() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [viewParams, setViewParams] = useState<any>({});

  // Sync state with URL hash or pathname for friendly routing
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;

      if (path.startsWith('/f/')) {
        const parts = path.split('/').filter(Boolean);
        // /f/[photographer]/[event]
        if (parts.length >= 3) {
          setCurrentView('public_event');
          setViewParams({ photographerSlug: parts[1], eventSlug: parts[2] });
          return;
        }
      } else if (path.startsWith('/compra/sucesso/')) {
        const token = path.replace('/compra/sucesso/', '');
        setCurrentView('purchase_success');
        setViewParams({ orderToken: token });
        return;
      } else if (path === '/precos') {
        setCurrentView('pricing');
        return;
      } else if (path === '/login') {
        setCurrentView('login');
        return;
      } else if (path === '/cadastro') {
        setCurrentView('register');
        return;
      } else if (path === '/dashboard') {
        setCurrentView('dashboard');
        return;
      } else if (path === '/admin') {
        setCurrentView('admin');
        return;
      } else if (path === '/termos') {
        setCurrentView('terms');
        return;
      } else if (path === '/privacidade') {
        setCurrentView('privacy');
        return;
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const handleNavigate = (view: string, params: any = {}) => {
    setCurrentView(view);
    setViewParams(params);

    // Update browser URL
    let newPath = '/';
    if (view === 'pricing') newPath = '/precos';
    else if (view === 'login') newPath = '/login';
    else if (view === 'register') newPath = '/cadastro';
    else if (view === 'dashboard') newPath = '/dashboard';
    else if (view === 'admin') newPath = '/admin';
    else if (view === 'terms') newPath = '/termos';
    else if (view === 'privacy') newPath = '/privacidade';
    else if (view === 'public_event') newPath = `/f/${params.photographerSlug}/${params.eventSlug}`;
    else if (view === 'purchase_success') newPath = `/compra/sucesso/${params.orderToken}`;
    else if (view === 'demo_gallery') {
      setCurrentView('public_event');
      setViewParams({ photographerSlug: 'joao-fotografia', eventSlug: 'corrida-sp-2026' });
      newPath = '/f/joao-fotografia/corrida-sp-2026';
    }

    window.history.pushState({}, '', newPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {currentView !== 'public_event' && (
        <Navbar currentView={currentView} onNavigate={handleNavigate} />
      )}

      <main className="flex-1">
        {currentView === 'home' && <LandingPage onNavigate={handleNavigate} />}
        {currentView === 'pricing' && <PricingPage onNavigate={handleNavigate} />}
        {currentView === 'login' && <LoginPage onNavigate={handleNavigate} />}
        {currentView === 'register' && <RegisterPage onNavigate={handleNavigate} />}
        {currentView === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
        {currentView === 'admin' && <AdminDashboardPage onNavigate={handleNavigate} />}
        {currentView === 'terms' && <TermsPage />}
        {currentView === 'privacy' && <PrivacyPage />}

        {currentView === 'public_event' && (
          <PublicEventGalleryPage
            photographerSlug={viewParams.photographerSlug || 'joao-fotografia'}
            eventSlug={viewParams.eventSlug || 'corrida-sp-2026'}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'purchase_success' && (
          <PurchaseSuccessPage
            orderToken={viewParams.orderToken || 'tok_demo_9876_xyz'}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      {currentView !== 'public_event' && (
        <Footer onNavigate={handleNavigate} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
