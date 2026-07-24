import { useState, useCallback } from 'react';
import type { Product, LayoutConfig as LayoutConfigType, StickerData, FontConfig as FontConfigType, DesignElement } from './types';
import { DEFAULT_LAYOUT, DEFAULT_FONTS } from './types';
import { NavSidebar } from './components/ui/sidebar';
import { TopToolbar } from './components/ui/toolbar';
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

export default function App() {
  const [product, setProduct] = useState<Product | null>(null);
  const [layout, setLayout] = useState<LayoutConfigType>(DEFAULT_LAYOUT);
  const [fonts, setFonts] = useState<FontConfigType>(DEFAULT_FONTS);
  const [stickers, setStickers] = useState<StickerData[]>([]);
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>();
  const [generated, setGenerated] = useState(false);
  const [designElements, setDesignElements] = useState<DesignElement[] | null>(null);
  const [loadDesignId, setLoadDesignId] = useState<string | null>(null);
  const [startInGenerate, setStartInGenerate] = useState(false);

  const [navTab, setNavTab] = useState('tasks');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeProject] = useState('All Projects');
  const [sortBy] = useState('newest');
  const [viewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');

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

  const isDesignMode = designElements !== null && designElements.length > 0;

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
            isDesignMode={isDesignMode}
            startInGenerate={startInGenerate}
            onStartInGenerateConsumed={() => setStartInGenerate(false)}
            onProductChange={setProduct}
            onLayoutChange={setLayout}
            onFontsChange={setFonts}
            onLogoData={setLogoDataUrl}
            onGenerate={handleGenerate}
            onClearDesign={() => setDesignElements(null)}
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
      default:
        return <DashboardPage />;
    }
  }

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      <NavSidebar activeTab={navTab} onTabChange={setNavTab} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {navTab === 'tasks' && (
          <TopToolbar
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            activeProject={activeProject}
            onProjectChange={() => {}}
            sortBy={sortBy}
            onSortChange={() => {}}
            viewMode={viewMode}
            onViewModeChange={() => {}}
            onCreateTask={() => {}}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}

        <div className="flex-1 overflow-auto">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}