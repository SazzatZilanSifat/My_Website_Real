import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useHashRoute, parseRoute } from '@/lib/router';
import { HomePage } from '@/pages/HomePage';
import { PropertiesPage } from '@/pages/PropertiesPage';
import { PropertyDetailPage } from '@/pages/PropertyDetailPage';
import { BlogPage } from '@/pages/BlogPage';
import { BlogDetailPage } from '@/pages/BlogDetailPage';
import { AgentsPage } from '@/pages/AgentsPage';
import { AboutPage } from '@/pages/AboutPage';
import { ContactPage } from '@/pages/ContactPage';
import { AuthPage } from '@/pages/AuthPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { OrganizationPage } from '@/pages/OrganizationPage';
import { InquiriesPage } from '@/pages/InquiriesPage';

function AppContent() {
  const { route } = useHashRoute();
  const { user, loading } = useAuth();
  const { page, params } = parseRoute(route);

  // Pages that should NOT show navbar/footer
  const isAuthPage = page === 'login' || page === 'signup';

  if (loading && !isAuthPage) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Redirect logged-in users away from auth pages
  if (isAuthPage && user) {
    window.location.hash = '/dashboard';
    return null;
  }

  const renderPage = () => {
    switch (page) {
      case 'home': return <HomePage />;
      case 'properties': return <PropertiesPage />;
      case 'property-detail': return <PropertyDetailPage id={params.id} />;
      case 'blog': return <BlogPage />;
      case 'blog-detail': return <BlogDetailPage slug={params.slug} />;
      case 'agents': return <AgentsPage />;
      case 'about': return <AboutPage />;
      case 'contact': return <ContactPage />;
      case 'login': return <AuthPage mode="login" />;
      case 'signup': return <AuthPage mode="signup" />;
      case 'dashboard': return <DashboardPage />;
      case 'organization': return <OrganizationPage />;
      case 'inquiries': return <InquiriesPage />;
      default: return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-ink-950">
      {!isAuthPage && <Navbar />}
      <main>{renderPage()}</main>
      {!isAuthPage && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
