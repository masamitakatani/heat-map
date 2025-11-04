/**
 * App Component
 * ヒートマップ管理画面のメインコンポーネント
 */

import { useState } from 'react';
import { PageList } from './components/PageList';
import { HeatmapViewer } from './components/HeatmapViewer';
import './App.css';

type View = 'list' | 'heatmap';

function App() {
  const [currentView, setCurrentView] = useState<View>('list');
  const [selectedPageUrl, setSelectedPageUrl] = useState<string | null>(null);

  const handleSelectPage = (pageUrl: string) => {
    setSelectedPageUrl(pageUrl);
    setCurrentView('heatmap');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedPageUrl(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>ヒートマップ & ファネル解析ツール</h1>
        <p className="subtitle">管理画面</p>
      </header>

      <main className="app-main">
        {currentView === 'list' && <PageList onSelectPage={handleSelectPage} />}
        {currentView === 'heatmap' && selectedPageUrl && (
          <HeatmapViewer pageUrl={selectedPageUrl} onBack={handleBackToList} />
        )}
      </main>

      <footer className="app-footer">
        <p>&copy; 2025 Heatmap Analytics Tool</p>
      </footer>
    </div>
  );
}

export default App;
