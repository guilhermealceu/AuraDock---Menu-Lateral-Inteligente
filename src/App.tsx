import React, { useState, useEffect } from 'react';
import { DockConfig, DockItem } from './types/dock';
import { DesktopEnvironment } from './components/DesktopEnvironment';
import { LateralDock } from './components/LateralDock';
import { CodeExportModal } from './components/CodeExportModal';
import { ItemEditorModal } from './components/ItemEditorModal';
import { soundFX } from './utils/sound';
import { Sparkles, Check, ArrowDownToLine, X, SlidersHorizontal } from 'lucide-react';

const INITIAL_ITEMS: DockItem[] = [
  {
    id: 'home',
    iconName: 'Home',
    title: 'Início',
    detail: 'Visão geral do sistema e atalhos rápidos.',
    badge: undefined,
  },
  {
    id: 'projects',
    iconName: 'CheckSquare',
    title: 'Projetos',
    detail: '3 tarefas em andamento e progresso diário.',
    badge: '3',
  },
  {
    id: 'agenda',
    iconName: 'Calendar',
    title: 'Agenda',
    detail: 'Próximo compromisso às 14:00.',
    badge: '14h',
  },
  {
    id: 'files',
    iconName: 'Folder',
    title: 'Arquivos',
    detail: 'Acesse seus documentos recentes e dropzone.',
    badge: undefined,
  },
  {
    id: 'notes',
    iconName: 'FileText',
    title: 'Notas',
    detail: 'Bloco de anotações rápido com salvamento automático.',
    badge: undefined,
  },
  {
    id: 'settings',
    iconName: 'Settings',
    title: 'Configurações',
    detail: 'Preferências do painel e formas da silhueta.',
    badge: undefined,
  },
];

const DEFAULT_CONFIG: DockConfig = {
  shape: 'drop',           // Gota suave como no PowerShell
  position: 'right',       // Borda direita
  displayMode: 'morph',    // Morphing expansivo onde o menu se alarga lateralmente ao clicar
  theme: 'onyx',           // Onyx deep black
  width: 130,              // 130px de largura recolhida
  expandedWidth: 380,      // 380px de largura expandida
  heightRatio: 1.0,
  autoHide: false,
  soundEnabled: true,
  glowEffect: true,
  tension: 1.0,
  scale: 1.0,
  wallpaper: 'obsidian',
  heightMode: 'full',             // Cobre todo o menu de ponta a ponta por padrão
  topOffset: 0,
  bottomOffset: 100,
  autoExpandFullHeight: true,     // Ao expandir em morphing, garante cobertura total
  borderWidth: 1.2,
  bgOpacity: 96,
  glowIntensity: 'subtle',
  transitionDuration: 320,        // 320ms velocidade padrão de animação
  easingCurve: 'spring',          // Efeito mola orgânico moderno
  triggerMode: 'ctrl-edge',       // 'ctrl-edge' (Ctrl + Mouse na borda), 'auto-hover', 'ctrl-space'
  showEdgeIndicator: false,       // false = remove a barrinha lateral brilhante
  targetDisplayIndex: 0,          // 0 = Monitor Principal / 1, 2...
};

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash.replace('#', '');
  const viewMode = 
    window.electronAPI?.viewType || 
    urlParams.get('view') || 
    (hash === 'dock' ? 'dock' : hash === 'config' ? 'config' : null);

  const [config, setConfig] = useState<DockConfig>(() => {
    try {
      const saved = localStorage.getItem('auradock_config');
      return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [items, setItems] = useState<DockItem[]>(() => {
    try {
      const saved = localStorage.getItem('auradock_items');
      return saved ? JSON.parse(saved) : INITIAL_ITEMS;
    } catch {
      return INITIAL_ITEMS;
    }
  });

  const [isDockVisible, setIsDockVisible] = useState(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isItemEditorOpen, setIsItemEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DockItem | null>(null);
  const [savedToTrayNotice, setSavedToTrayNotice] = useState(false);

  // Sync with Electron if running inside Electron agent
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getConfig().then(data => {
        if (data?.config) setConfig(prev => ({ ...prev, ...data.config }));
        if (data?.items) setItems(data.items);
      });

      const unsubscribe = window.electronAPI.onConfigUpdated(data => {
        if (data?.config) setConfig(data.config);
        if (data?.items) setItems(data.items);
      });

      return () => {
        unsubscribe();
      };
    }
  }, []);

  // Sync sound setting
  useEffect(() => {
    soundFX.enabled = config.soundEnabled;
  }, [config.soundEnabled]);

  // Save config changes
  const handleUpdateConfig = (partial: Partial<DockConfig>) => {
    setConfig(prev => {
      const updated = { ...prev, ...partial };
      try {
        localStorage.setItem('auradock_config', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Save items changes
  const handleSaveItem = (item: DockItem) => {
    setItems(prev => {
      const exists = prev.some(i => i.id === item.id);
      const updated = exists ? prev.map(i => (i.id === item.id ? item : i)) : [...prev, item];
      try {
        localStorage.setItem('auradock_items', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleDeleteItem = (id: string) => {
    soundFX.playClick();
    setItems(prev => {
      const updated = prev.filter(i => i.id !== id);
      try {
        localStorage.setItem('auradock_items', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Handle saving and sending back to Windows system tray
  const handleSaveAndSendToTray = () => {
    soundFX.playComplete();
    if (window.electronAPI) {
      window.electronAPI.saveConfig(config, items);
      window.electronAPI.hideConfig();
    } else {
      // Running in browser simulator
      setSavedToTrayNotice(true);
      setTimeout(() => setSavedToTrayNotice(false), 3500);
    }
  };

  // Keyboard Shortcuts (Ctrl + Space, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExportModalOpen(false);
        setIsItemEditorOpen(false);
      }

      if ((e.ctrlKey && e.code === 'Space') || (e.altKey && e.key.toLowerCase() === 'd')) {
        e.preventDefault();
        soundFX.playClick();
        setIsDockVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle applying curated preset
  const handleApplyPreset = (preset: import('./types/dock').StylePreset) => {
    handleUpdateConfig({
      shape: preset.shape,
      theme: preset.theme,
      width: preset.width,
      expandedWidth: preset.expandedWidth,
      tension: preset.tension,
      wallpaper: preset.wallpaper,
      displayMode: preset.defaultDisplayMode,
    });
  };

  // 1. ELECTRON DOCK ONLY VIEW (Transparent window over Windows desktop)
  if (viewMode === 'dock') {
    return (
      <div className="fixed inset-0 overflow-hidden pointer-events-none bg-transparent select-none">
        <div className="pointer-events-auto h-full">
          <LateralDock
            config={config}
            items={items}
            isVisible={isDockVisible}
            onUpdateConfig={handleUpdateConfig}
            onOpenExportModal={() => {
              if (window.electronAPI) window.electronAPI.openConfig();
              else setIsExportModalOpen(true);
            }}
            onOpenItemEditor={item => {
              if (window.electronAPI) window.electronAPI.openConfig();
              else {
                setEditingItem(item || null);
                setIsItemEditorOpen(true);
              }
            }}
            onDeleteItem={handleDeleteItem}
          />
        </div>
      </div>
    );
  }

  // 2. ELECTRON CONFIG ONLY VIEW (Standalone Config Window that returns to tray)
  if (viewMode === 'config') {
    return (
      <div className="w-screen h-screen overflow-hidden bg-[#0c0d14] text-white flex flex-col font-sans select-none">
        <DesktopEnvironment
          config={config}
          onUpdateConfig={handleUpdateConfig}
          onApplyPreset={handleApplyPreset}
          items={items}
          onOpenItemEditor={item => {
            setEditingItem(item || null);
            setIsItemEditorOpen(true);
          }}
          isDockVisible={isDockVisible}
          onToggleDock={() => setIsDockVisible(prev => !prev)}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onSaveToTray={handleSaveAndSendToTray}
        >
            <LateralDock
              config={config}
              items={items}
              isVisible={isDockVisible}
              onUpdateConfig={handleUpdateConfig}
              onOpenExportModal={() => setIsExportModalOpen(true)}
              onOpenItemEditor={item => {
                setEditingItem(item || null);
                setIsItemEditorOpen(true);
              }}
              onDeleteItem={handleDeleteItem}
            />

            {/* Code Export / Run Modal */}
            <CodeExportModal
              isOpen={isExportModalOpen}
              onClose={() => setIsExportModalOpen(false)}
              config={config}
              items={items}
            />

            {/* Item Editor Modal */}
            <ItemEditorModal
              isOpen={isItemEditorOpen}
              onClose={() => {
                setIsItemEditorOpen(false);
                setEditingItem(null);
              }}
              onSaveItem={handleSaveItem}
              onDeleteItem={handleDeleteItem}
              itemToEdit={editingItem}
            />
          </DesktopEnvironment>
      </div>
    );
  }

  // 3. DEFAULT INTERACTIVE BROWSER STUDIO & SIMULATOR
  return (
    <>
      <DesktopEnvironment
        config={config}
        onUpdateConfig={handleUpdateConfig}
        onApplyPreset={handleApplyPreset}
        items={items}
        onOpenItemEditor={item => {
          setEditingItem(item || null);
          setIsItemEditorOpen(true);
        }}
        isDockVisible={isDockVisible}
        onToggleDock={() => {
          soundFX.playClick();
          setIsDockVisible(prev => !prev);
        }}
        onOpenExportModal={() => {
          soundFX.playClick();
          setIsExportModalOpen(true);
        }}
        onSaveToTray={handleSaveAndSendToTray}
      >
        <LateralDock
          config={config}
          items={items}
          isVisible={isDockVisible}
          onUpdateConfig={handleUpdateConfig}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onOpenItemEditor={item => {
            setEditingItem(item || null);
            setIsItemEditorOpen(true);
          }}
          onDeleteItem={handleDeleteItem}
        />

        {/* Code Export / Run Modal */}
        <CodeExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          config={config}
          items={items}
        />

        {/* Item Editor Modal */}
        <ItemEditorModal
          isOpen={isItemEditorOpen}
          onClose={() => {
            setIsItemEditorOpen(false);
            setEditingItem(null);
          }}
          onSaveItem={handleSaveItem}
          onDeleteItem={handleDeleteItem}
          itemToEdit={editingItem}
        />
      </DesktopEnvironment>

      {/* Toast Notice when saving to tray */}
      {savedToTrayNotice && (
        <div className="fixed top-14 right-6 z-50 p-4 rounded-2xl bg-indigo-950/90 border border-indigo-400/40 text-white text-xs shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-white">Configurações Salvas!</p>
            <p className="text-[11px] text-zinc-300">O dock foi sincronizado e o agente recolhido para a bandeja do sistema.</p>
          </div>
        </div>
      )}
    </>
  );
}
