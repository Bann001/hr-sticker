import { useState, useCallback } from 'react';
import type { Product, LayoutConfig as LayoutConfigType, StickerData, FontConfig as FontConfigType, DesignElement } from './types';
import { DEFAULT_LAYOUT, DEFAULT_FONTS } from './types';
import { ProductSelector } from './components/ProductSelector';
import { BatchConfig } from './components/BatchConfig';
import { LayoutConfig } from './components/LayoutConfig';
import { FontConfig } from './components/FontConfig';
import { Preview } from './components/Preview';
import { StickerDesigner } from './components/StickerDesigner';
import { generatePDF, generatePDFFromDesign } from './utils/pdf';
import { renderDesign } from './utils/renderDesign';
import { NavSidebar } from './components/ui/sidebar';
import { TopToolbar } from './components/ui/toolbar';
import { Card, CardContent } from './components/ui/card';
import { DashboardPage } from './pages/Dashboard';
import { TicketsPage } from './pages/Tickets';
import { ChatPage } from './pages/Chat';
import { ChatBuddyPage } from './pages/ChatBuddy';
import { FilesPage } from './pages/Files';
import { TeamsPage } from './pages/Teams';
import { AnalyticsPage } from './pages/Analytics';
import { SettingsPage } from './pages/Settings';

export default function App() {
  const [tab, setTab] = useState<'generator' | 'designer'>('generator');
  const [product, setProduct] = useState<Product | null>(null);
  const [layout, setLayout] = useState<LayoutConfigType>(DEFAULT_LAYOUT);
  const [fonts, setFonts] = useState<FontConfigType>(DEFAULT_FONTS);
  const [stickers, setStickers] = useState<StickerData[]>([]);
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>();
  const [generated, setGenerated] = useState(false);
  const [designElements, setDesignElements] = useState<DesignElement[] | null>(null);

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

  const handleUseDesign = useCallback((design: { elements: DesignElement[] }) => {
    setDesignElements(design.elements);
    setTab('generator');
    setGenerated(false);
  }, []);

  const isDesignMode = designElements !== null && designElements.length > 0;

  const handleNavChange = (id: string) => {
    setNavTab(id);
    if (id === 'tasks') setTab('generator');
    if (id === 'projects') setTab('designer');
  };

  function renderPage() {
    switch (navTab) {
      case 'home':
        return <DashboardPage />;
      case 'projects':
        return (
          <div className="flex-1 flex">
            <StickerDesigner onUseDesign={handleUseDesign} />
          </div>
        );
      case 'tickets':
        return <TicketsPage />;
      case 'tasks':
        return (
          <div className="flex-1 flex overflow-hidden">
            <aside className="w-[340px] min-w-[340px] bg-bg-sidebar border-r border-border overflow-y-auto p-5 space-y-5">
              {isDesignMode && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-success/10 border border-success/20 rounded-xl text-sm text-success">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  <span className="flex-1 text-sm">Using custom design</span>
                  <button
                    onClick={() => setDesignElements(null)}
                    className="text-xs font-medium text-text-muted hover:text-text-primary underline transition-colors"
                  >
                    clear
                  </button>
                </div>
              )}
              <Card><CardContent className="p-0">
                <ProductSelector product={product} onProductChange={setProduct} onLogoData={setLogoDataUrl} />
              </CardContent></Card>
              <Card><CardContent className="p-0">
                <BatchConfig product={product} layout={layout} onGenerate={handleGenerate} disabled={!product} />
              </CardContent></Card>
              <Card><CardContent className="p-0">
                <FontConfig config={fonts} onChange={setFonts} />
              </CardContent></Card>
              <Card><CardContent className="p-0">
                <LayoutConfig layout={layout} onChange={setLayout} />
              </CardContent></Card>
            </aside>
            <main className="flex-1 min-w-0 overflow-hidden">
              <Preview
                key={generated && isDesignMode ? 'design-preview' : generated ? 'preview' : 'empty'}
                stickers={stickers}
                product={product}
                layout={layout}
                fonts={fonts}
                logoDataUrl={logoDataUrl}
                visible={generated}
                designElements={isDesignMode ? designElements : undefined}
                generatePDFOverride={isDesignMode ? generatePDFFromDesign : undefined}
                renderStickerOverride={isDesignMode ? renderDesign : undefined}
              />
            </main>
          </div>
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
      <NavSidebar activeTab={navTab} onTabChange={handleNavChange} />

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