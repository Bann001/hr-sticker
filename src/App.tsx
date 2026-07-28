import { useState, useCallback, useEffect } from 'react';
import type { Product, LayoutConfig as LayoutConfigType, StickerData, FontConfig as FontConfigType, DesignElement } from './types';
import { DEFAULT_LAYOUT, DEFAULT_FONTS } from './types';
import { AuthProvider, useAuth } from './lib/auth';
import { NavSidebar } from './components/ui/sidebar';
import { StickerDesigner } from './components/StickerDesigner';
import { TasksPage } from './pages/TasksPage';
import { DashboardPage } from './pages/Dashboard';
import { ProjectsPage } from './pages/ProjectsPage';
import { TicketsPage } from './pages/Tickets';
import { ChatPage } from './pages/Chat';
import { ChatBuddyPage } from './pages/ChatBuddy';
import { FilesPage } from './pages/Files';
import { TeamsPage } from './pages/Teams';
import { AnalyticsPage } from './pages/Analytics';
import { SettingsPage } from './pages/Settings';
import { LoginPage } from './pages/LoginPage';
import { AdminPage } from './pages/AdminPage';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [layout, setLayout] = useState<LayoutConfigType>(DEFAULT_LAYOUT);
  const [fonts, setFonts] = useState<FontConfigType>(DEFAULT_FONTS);
  const [stickers, setStickers] = useState<StickerData[]>([]);
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>();
  const [generated, setGenerated] = useState(false);
  const [designElements, setDesignElements] = useState<DesignElement[] | null>(null);
  const [loadDesignId, setLoadDesignId] = useState<string | null>(null);
  const [startInGenerate, setStartInGenerate] = useState(false);

  const isAdmin = profile?.role === 'admin';
  const [navTab, setNavTab] = useState(isAdmin ? 'admin' : 'tasks');

  useEffect(() => {
    if (profile && isAdmin && navTab === 'tasks') {
      setNavTab('admin');
    }
  }, [profile, isAdmin, navTab]);

  const handleGenerate = useCallback(
    (data: { stickers: StickerData[]; product: Product; logo?: string }) => {
      setStickers(data.stickers);
      setProduct(data.product);
      if (data.logo) setLogoDataUrl(data.logo);
      setGenerated(true);
    },
    [],
  );

  const handleUseDesign = useCallback((design: { elements: DesignElement[]; logo_url?: string }) => {
    setDesignElements(design.elements);
    if (design.logo_url) setLogoDataUrl(design.logo_url);
    setStartInGenerate(true);
    setNavTab('tasks');
  }, []);

  const handleNavigate = useCallback((tab: string, designId?: string) => {
    if (designId) setLoadDesignId(designId);
    setNavTab(tab);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center mx-auto mb-3 animate-pulse">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </div>
          <p className="text-sm text-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  function renderPage() {
    switch (navTab) {
      case 'home':
        return <DashboardPage />;
      case 'create':
        return (
          <div className="flex-1 flex overflow-hidden">
            <StickerDesigner onUseDesign={handleUseDesign} loadDesignId={loadDesignId} onLoadDesignIdConsumed={() => setLoadDesignId(null)} />
          </div>
        );
      case 'projects':
        return <ProjectsPage onNavigate={handleNavigate} onUseDesign={handleUseDesign} />;
      case 'tickets':
        return <TicketsPage />;
      case 'tasks':
        return (
          <TasksPage
            product={product}
            layout={layout}
            fonts={fonts}
            stickers={stickers}
            logoDataUrl={logoDataUrl}
            generated={generated}
            designElements={designElements}
            startInGenerate={startInGenerate}
            onStartInGenerateConsumed={() => setStartInGenerate(false)}
            onProductChange={setProduct}
            onLayoutChange={setLayout}
            onFontsChange={setFonts}
            onLogoData={setLogoDataUrl}
            onGenerate={handleGenerate}
            onClearDesign={() => setDesignElements(null)}
            onUseDesign={handleUseDesign}
          />
        );
      case 'chat':
        return <ChatPage />;
      case 'chat-buddy':
        return <ChatBuddyPage />;
      case 'files':
        return <FilesPage />;
      case 'teams':
        return <TeamsPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'admin':
        return <AdminPage />;
      default:
        return <DashboardPage />;
    }
  }

  // Admin view - full screen admin dashboard only
  if (isAdmin) {
    return (
      <div className="flex h-screen bg-bg-primary overflow-hidden">
        <div className="flex-1 overflow-auto">
          <AdminPage />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      <NavSidebar activeTab={navTab} onTabChange={setNavTab} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="flex-1 overflow-auto">
          {renderPage()}
        </div>
      </div>
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
