import React, { useState, useRef, useEffect } from 'react';
import { DockConfig, StylePreset, DockItem, DockShape, DockTheme, EasingCurve, EASING_FUNCTIONS } from '../types/dock';
import { STYLE_PRESETS } from '../utils/presets';
import { SHAPE_METADATA } from '../utils/geometry';
import { soundFX } from '../utils/sound';
import { 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Image as ImageIcon, 
  Terminal, 
  ChevronRight, 
  ChevronLeft,
  SlidersHorizontal,
  Download,
  Layers,
  Palette,
  LayoutGrid,
  Plus,
  Play,
  CheckCircle2,
  ExternalLink,
  Shield,
  Columns2,
  Waves,
  Feather,
  CircleDot,
  Droplet,
  GripHorizontal,
  Move,
  Minimize2,
  Maximize2,
  ChevronDown,
  ChevronUp,
  AlignLeft,
  AlignCenter,
  AlignRight,
  RotateCcw,
  Zap,
  Timer,
  ArrowDownToLine,
  Monitor,
  MousePointer,
  Eye,
  EyeOff
} from 'lucide-react';
import { DockIcon } from './DockIcon';

interface DesktopEnvironmentProps {
  config: DockConfig;
  onUpdateConfig: (partial: Partial<DockConfig>) => void;
  onApplyPreset: (preset: StylePreset) => void;
  items: DockItem[];
  onOpenItemEditor: (item?: DockItem) => void;
  isDockVisible: boolean;
  onToggleDock: () => void;
  onOpenExportModal: () => void;
  onSaveToTray?: () => void;
  children: React.ReactNode;
}

export const WALLPAPERS = [
  {
    id: 'obsidian',
    name: 'Obsidian Minimal',
    style: 'radial-gradient(ellipse at top, #181926 0%, #0d0e15 50%, #06070a 100%)',
  },
  {
    id: 'cosmic',
    name: 'Nebula Violet',
    style: 'radial-gradient(circle at 80% 20%, #2e1065 0%, #0f0728 40%, #03010a 100%)',
  },
  {
    id: 'aurora',
    name: 'Emerald Aurora',
    style: 'radial-gradient(circle at 20% 80%, #064e3b 0%, #042f2e 40%, #021214 100%)',
  },
  {
    id: 'slate',
    name: 'Studio Slate',
    style: 'linear-gradient(135deg, #1e293b 0%, #0f172a 60%, #020617 100%)',
  },
];

const SHAPE_ICONS: Record<DockShape, React.ElementType> = {
  'full-panel': LayoutGrid,
  drop: Droplet,
  leaf: Sparkles,
  wave: Waves,
  feather: Feather,
  orbit: CircleDot,
  cyber: Shield,
  capsule: Columns2,
};

export const DesktopEnvironment: React.FC<DesktopEnvironmentProps> = ({
  config,
  onUpdateConfig,
  onApplyPreset,
  items,
  onOpenItemEditor,
  isDockVisible,
  onToggleDock,
  onOpenExportModal,
  onSaveToTray,
  children,
}) => {
  const [showWallpaperMenu, setShowWallpaperMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'shapes' | 'theme' | 'behavior' | 'items'>('presets');

  const activeWallpaper = WALLPAPERS.find(w => w.id === config.wallpaper) || WALLPAPERS[0];
  const isRight = config.position === 'right';

  // Draggable position and free resizable size state for Studio Card
  const [cardPos, setCardPos] = useState<{ x: number; y: number }>(() => {
    if (typeof window !== 'undefined') {
      const initialX = isRight ? 36 : Math.max(20, window.innerWidth - 720);
      return { x: initialX, y: 50 };
    }
    return { x: 36, y: 50 };
  });

  const [cardSize, setCardSize] = useState<{ width: number; height: number }>(() => {
    if (typeof window !== 'undefined') {
      const w = Math.min(680, Math.max(460, window.innerWidth - 120));
      const h = Math.min(640, Math.max(420, window.innerHeight - 100));
      return { width: w, height: h };
    }
    return { width: 680, height: 600 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const dragRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null);
  const resizeRef = useRef<{
    direction: string;
    mouseX: number;
    mouseY: number;
    startWidth: number;
    startHeight: number;
    startX: number;
    startY: number;
  } | null>(null);

  const [displays, setDisplays] = useState<Array<{ index: number; id: number; label: string; isPrimary: boolean; bounds?: any }>>([
    { index: 0, id: 1, label: 'Monitor 1 (Principal) - 1920x1080', isPrimary: true },
    { index: 1, id: 2, label: 'Monitor 2 (Secundário) - 2560x1440', isPrimary: false },
  ]);

  // Load connected monitors from Electron if available
  useEffect(() => {
    if (window.electronAPI?.getDisplays) {
      window.electronAPI.getDisplays().then(detected => {
        if (detected && detected.length > 0) {
          setDisplays(detected);
        }
      }).catch(console.error);
    }
  }, []);

  // Global Ctrl + Edge mouse listener when dock is hidden
  useEffect(() => {
    if (isDockVisible) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const mode = config.triggerMode || 'ctrl-edge';
      const nearEdge = isRight
        ? e.clientX >= window.innerWidth - 18
        : e.clientX <= 18;

      if (!nearEdge) return;

      if (mode === 'ctrl-edge' && e.ctrlKey) {
        soundFX.playOpen();
        onToggleDock();
      } else if (mode === 'auto-hover' && config.autoHide) {
        soundFX.playOpen();
        onToggleDock();
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [isDockVisible, config.triggerMode, config.autoHide, isRight, onToggleDock]);

  // Auto-adjust when position changes if user hasn't heavily custom-dragged
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isRight && cardPos.x > window.innerWidth / 2) {
        setCardPos({ x: 36, y: 50 });
      } else if (!isRight && cardPos.x < 100) {
        setCardPos({ x: Math.max(20, window.innerWidth - cardSize.width - 40), y: 50 });
      }
    }
  }, [isRight]);

  const snapTo = (alignment: 'left' | 'center' | 'right') => {
    soundFX.playClick();
    if (alignment === 'left') {
      setCardPos({ x: 32, y: 50 });
    } else if (alignment === 'center') {
      const centerX = Math.max(20, (window.innerWidth - cardSize.width) / 2);
      setCardPos({ x: centerX, y: 50 });
    } else {
      const rightX = Math.max(20, window.innerWidth - cardSize.width - 32);
      setCardPos({ x: rightX, y: 50 });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag from handle or header surface, not from buttons/inputs/sliders
    if ((e.target as HTMLElement).closest('button, input, select, a, textarea')) {
      return;
    }
    e.preventDefault();
    dragRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: cardPos.x,
      startY: cardPos.y,
    };
    setIsDragging(true);

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!dragRef.current) return;
      const deltaX = moveEvent.clientX - dragRef.current.mouseX;
      const deltaY = moveEvent.clientY - dragRef.current.mouseY;

      const clampedX = Math.max(10, Math.min(window.innerWidth - 180, dragRef.current.startX + deltaX));
      const clampedY = Math.max(20, Math.min(window.innerHeight - 80, dragRef.current.startY + deltaY));

      setCardPos({ x: clampedX, y: clampedY });
    };

    const onMouseUp = () => {
      setIsDragging(false);
      dragRef.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Interactive Free Resizing from corners & edges
  const handleResizeMouseDown = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    soundFX.playClick();

    resizeRef.current = {
      direction,
      mouseX: e.clientX,
      mouseY: e.clientY,
      startWidth: cardSize.width,
      startHeight: cardSize.height,
      startX: cardPos.x,
      startY: cardPos.y,
    };
    setIsResizing(true);

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!resizeRef.current) return;
      const { direction, mouseX, mouseY, startWidth, startHeight, startX, startY } = resizeRef.current;
      const deltaX = moveEvent.clientX - mouseX;
      const deltaY = moveEvent.clientY - mouseY;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startX;
      let newY = startY;

      // Horizontal resizing
      if (direction.includes('e')) {
        newWidth = Math.max(420, Math.min(window.innerWidth - startX - 16, startWidth + deltaX));
      } else if (direction.includes('w')) {
        const potentialWidth = startWidth - deltaX;
        if (potentialWidth >= 420 && startX + deltaX >= 10) {
          newWidth = potentialWidth;
          newX = startX + deltaX;
        }
      }

      // Vertical resizing
      if (direction.includes('s')) {
        newHeight = Math.max(360, Math.min(window.innerHeight - startY - 16, startHeight + deltaY));
      } else if (direction.includes('n')) {
        const potentialHeight = startHeight - deltaY;
        if (potentialHeight >= 360 && startY + deltaY >= 10) {
          newHeight = potentialHeight;
          newY = startY + deltaY;
        }
      }

      setCardSize({ width: newWidth, height: newHeight });
      setCardPos({ x: newX, y: newY });
    };

    const onMouseUp = () => {
      setIsResizing(false);
      resizeRef.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden text-zinc-100 flex flex-col select-none transition-colors duration-500 font-sans"
      style={{ background: activeWallpaper.style }}
    >
      {/* Main Studio Canvas - Clean without top headers */}
      <main className="relative flex-1 flex items-center justify-center p-4 sm:p-6 z-10 overflow-y-auto">
        {/* Subtle Ambient glow */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-25">
          <div className="w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[140px]" />
        </div>

        {/* Draggable & Resizable Studio Configurator Panel */}
        {isMinimized ? (
          <div
            style={{ left: `${cardPos.x}px`, top: `${cardPos.y}px` }}
            onMouseDown={handleMouseDown}
            className={`fixed z-30 cursor-grab active:cursor-grabbing flex items-center gap-3 px-4 py-2.5 rounded-full bg-zinc-950/90 border border-white/20 backdrop-blur-xl shadow-2xl transition-all hover:border-indigo-400/50 ${
              isDragging ? 'scale-105 shadow-indigo-500/30' : ''
            }`}
            title="Arraste para mover o botão pela tela"
          >
            <GripHorizontal className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-semibold text-white">Estúdio de Configuração</span>
            <button
              onClick={() => {
                soundFX.playClick();
                setIsMinimized(false);
              }}
              className="px-3 py-1 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] transition-colors shadow-sm"
            >
              Expandir Painel
            </button>
          </div>
        ) : (
          <div 
            style={{
              left: `${cardPos.x}px`,
              top: `${cardPos.y}px`,
              width: `${cardSize.width}px`,
              height: `${cardSize.height}px`,
              maxWidth: 'calc(100vw - 20px)',
              maxHeight: 'calc(100vh - 20px)',
            }}
            className={`fixed z-30 bg-[#0d0e14]/92 border border-white/15 rounded-2xl backdrop-blur-2xl shadow-2xl flex flex-col transition-shadow ${
              isDragging ? 'ring-2 ring-indigo-500/50 shadow-indigo-950/50 cursor-grabbing' : ''
            } ${isResizing ? 'ring-2 ring-indigo-400/60 select-none' : ''}`}
          >
            {/* Edge Resizers */}
            <div
              onMouseDown={e => handleResizeMouseDown(e, 'n')}
              className="absolute -top-1.5 left-3 right-3 h-3 cursor-ns-resize z-40"
            />
            <div
              onMouseDown={e => handleResizeMouseDown(e, 's')}
              className="absolute -bottom-1.5 left-3 right-3 h-3 cursor-ns-resize z-40"
            />
            <div
              onMouseDown={e => handleResizeMouseDown(e, 'w')}
              className="absolute -left-1.5 top-3 bottom-3 w-3 cursor-ew-resize z-40"
            />
            <div
              onMouseDown={e => handleResizeMouseDown(e, 'e')}
              className="absolute -right-1.5 top-3 bottom-3 w-3 cursor-ew-resize z-40"
            />

            {/* Corner Resizers */}
            <div
              onMouseDown={e => handleResizeMouseDown(e, 'nw')}
              className="absolute -top-1.5 -left-1.5 w-4 h-4 cursor-nwse-resize z-50"
            />
            <div
              onMouseDown={e => handleResizeMouseDown(e, 'ne')}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 cursor-nesw-resize z-50"
            />
            <div
              onMouseDown={e => handleResizeMouseDown(e, 'sw')}
              className="absolute -bottom-1.5 -left-1.5 w-4 h-4 cursor-nesw-resize z-50"
            />

            {/* Draggable Header Bar with Snap Buttons & Minimize */}
            <div
              onMouseDown={handleMouseDown}
              className="px-4 py-2 bg-white/[0.04] border-b border-white/[0.08] rounded-t-2xl flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
            >
              <div className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200">
                <GripHorizontal className="w-4 h-4 text-zinc-400" />
                <span className="text-[11px] font-medium hidden sm:inline">Segure aqui para mover o painel livremente</span>
                <span className="text-[11px] font-medium sm:hidden">Mover painel</span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Audio toggle */}
                <button
                  onClick={() => {
                    const next = !config.soundEnabled;
                    soundFX.enabled = next;
                    if (next) soundFX.playClick();
                    onUpdateConfig({ soundEnabled: next });
                  }}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                  title={config.soundEnabled ? 'Silenciar Áudio' : 'Ativar Áudio'}
                >
                  {config.soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-indigo-400" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>

                {/* Wallpaper picker */}
                <div className="relative">
                  <button
                    onClick={() => {
                      soundFX.playClick();
                      setShowWallpaperMenu(!showWallpaperMenu);
                    }}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Mudar Papel de Parede"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                  </button>

                  {showWallpaperMenu && (
                    <div className="absolute right-0 top-8 w-44 rounded-xl bg-[#12131a] border border-white/10 p-2 shadow-2xl z-50 animate-in fade-in">
                      <div className="text-[10px] uppercase font-semibold text-zinc-400 px-2 py-1">
                        Papéis de Parede
                      </div>
                      {WALLPAPERS.map(w => (
                        <button
                          key={w.id}
                          onClick={() => {
                            soundFX.playClick();
                            onUpdateConfig({ wallpaper: w.id });
                            setShowWallpaperMenu(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                            config.wallpaper === w.id
                              ? 'bg-white/15 text-white font-medium'
                              : 'text-zinc-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <span>{w.name}</span>
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-white/20"
                            style={{ background: w.style }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Snapping position presets */}
                <div className="flex items-center gap-1 bg-white/[0.05] p-0.5 rounded-lg border border-white/[0.06]">
                  <button
                    onClick={() => snapTo('left')}
                    className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 text-[10px] flex items-center gap-1 transition-colors"
                    title="Alinhar à Esquerda (evita a dock direita)"
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                    <span className="hidden md:inline text-[10px]">Esquerda</span>
                  </button>
                  <button
                    onClick={() => snapTo('center')}
                    className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 text-[10px] flex items-center gap-1 transition-colors"
                    title="Alinhar ao Centro"
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                    <span className="hidden md:inline text-[10px]">Centro</span>
                  </button>
                  <button
                    onClick={() => snapTo('right')}
                    className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 text-[10px] flex items-center gap-1 transition-colors"
                    title="Alinhar à Direita"
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                    <span className="hidden md:inline text-[10px]">Direita</span>
                  </button>
                </div>

                {/* Minimize Button */}
                <button
                  onClick={() => {
                    soundFX.playClick();
                    setIsMinimized(true);
                  }}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Minimizar painel para desobstruir a tela"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Scrollable Card Body */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1">
              {/* Panel Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold text-white tracking-tight">Estúdio de Configuração do Dock</h1>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                      {config.position === 'right' ? 'Borda Direita' : 'Borda Esquerda'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Personalize o estilo lateral em tempo real e teste a resposta na barra flutuante ao lado.
                  </p>
                </div>

                {/* Quick Test / Trigger dock button */}
                <button
                  onClick={() => {
                    soundFX.playClick();
                    onToggleDock();
                  }}
                  className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-zinc-200 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3 text-indigo-400" />
                  <span>{isDockVisible ? 'Recolher Dock' : 'Testar Dock'}</span>
                </button>
              </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 py-3 border-b border-white/[0.06] overflow-x-auto text-xs font-medium">
            <button
              onClick={() => {
                soundFX.playClick();
                setActiveTab('presets');
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'presets'
                  ? 'bg-white/15 text-white font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Estilos Prontos</span>
            </button>

            <button
              onClick={() => {
                soundFX.playClick();
                setActiveTab('shapes');
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'shapes'
                  ? 'bg-white/15 text-white font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Silhueta & Curvatura</span>
            </button>

            <button
              onClick={() => {
                soundFX.playClick();
                setActiveTab('theme');
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'theme'
                  ? 'bg-white/15 text-white font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tema Visual</span>
            </button>

            <button
              onClick={() => {
                soundFX.playClick();
                setActiveTab('behavior');
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'behavior'
                  ? 'bg-white/15 text-white font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span>Comportamento</span>
            </button>

            <button
              onClick={() => {
                soundFX.playClick();
                setActiveTab('items');
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'items'
                  ? 'bg-white/15 text-white font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-blue-400" />
              <span>Itens da Barra ({items.length})</span>
            </button>
          </div>

          {/* Tab 1: Curated Style Presets */}
          {activeTab === 'presets' && (
            <div className="pt-4 space-y-3">
              <div className="text-xs font-semibold text-zinc-300">
                Escolha um Arquétipo Pronto (1 Clique)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {STYLE_PRESETS.map(preset => {
                  const isActive = config.shape === preset.shape && config.theme === preset.theme;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        soundFX.playClick();
                        onApplyPreset(preset);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isActive
                          ? 'bg-indigo-950/40 border-indigo-400 text-white shadow-md ring-1 ring-indigo-400/30'
                          : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-200 truncate">{preset.name}</span>
                        {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                        {preset.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Shapes & Geometry Sliders */}
          {activeTab === 'shapes' && (
            <div className="pt-4 space-y-4">
              {/* Coverage Mode Selection (Full 100% vs Organic vs Custom) */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/30 to-purple-950/20 border border-indigo-500/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Cobertura Vertical da Silhueta</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                    {config.heightMode === 'full' ? '100% Altura Total' : config.heightMode === 'organic' ? 'Flutuante Centralizado' : 'Personalizado'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      soundFX.playClick();
                      onUpdateConfig({ heightMode: 'full' });
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-medium text-center border transition-all ${
                      config.heightMode === 'full'
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-sm'
                        : 'bg-white/[0.03] border-white/[0.06] text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold">Cobrir Todo</div>
                    <div className="text-[9px] text-zinc-300 mt-0.5">100% Topo à Base</div>
                  </button>

                  <button
                    onClick={() => {
                      soundFX.playClick();
                      onUpdateConfig({ heightMode: 'organic' });
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-medium text-center border transition-all ${
                      config.heightMode === 'organic'
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-sm'
                        : 'bg-white/[0.03] border-white/[0.06] text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold">Flutuante</div>
                    <div className="text-[9px] text-zinc-300 mt-0.5">Centro da Tela</div>
                  </button>

                  <button
                    onClick={() => {
                      soundFX.playClick();
                      onUpdateConfig({ heightMode: 'custom' });
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-medium text-center border transition-all ${
                      config.heightMode === 'custom'
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-sm'
                        : 'bg-white/[0.03] border-white/[0.06] text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold">Personalizado</div>
                    <div className="text-[9px] text-zinc-300 mt-0.5">Ajuste Manual %</div>
                  </button>
                </div>

                {/* Custom sliders if custom is active */}
                {config.heightMode === 'custom' && (
                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/[0.06]">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-300 mb-1">
                        <span>Margem Topo</span>
                        <span className="font-mono text-indigo-400">{config.topOffset ?? 0}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="25"
                        value={config.topOffset ?? 0}
                        onChange={e => onUpdateConfig({ topOffset: Number(e.target.value) })}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-300 mb-1">
                        <span>Margem Rodapé</span>
                        <span className="font-mono text-indigo-400">{config.bottomOffset ?? 100}%</span>
                      </div>
                      <input
                        type="range"
                        min="75"
                        max="100"
                        value={config.bottomOffset ?? 100}
                        onChange={e => onUpdateConfig({ bottomOffset: Number(e.target.value) })}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {/* Auto Expand to Full Height on Morph Toggle */}
                <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
                  <div>
                    <div className="text-xs font-medium text-white">Expandir 100% da Altura no Modo Morphing</div>
                    <div className="text-[10px] text-zinc-400">Garante que todas as ferramentas e listas caibam sem corte</div>
                  </div>
                  <button
                    onClick={() => {
                      soundFX.playClick();
                      onUpdateConfig({ autoExpandFullHeight: !config.autoExpandFullHeight });
                    }}
                    className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                      config.autoExpandFullHeight ? 'bg-indigo-600' : 'bg-zinc-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        config.autoExpandFullHeight ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Shapes grid */}
              <div>
                <div className="text-xs font-semibold text-zinc-300 mb-2">
                  Formato da Curvatura Bézier (SVG)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(SHAPE_METADATA) as DockShape[]).map(shapeKey => {
                    const meta = SHAPE_METADATA[shapeKey];
                    const IconComp = SHAPE_ICONS[shapeKey] || Layers;
                    const isSelected = config.shape === shapeKey;
                    return (
                      <button
                        key={shapeKey}
                        onClick={() => {
                          soundFX.playClick();
                          onUpdateConfig({ shape: shapeKey });
                        }}
                        className={`p-2 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-indigo-950/40 border-indigo-400 text-white ring-1 ring-indigo-400/30'
                            : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 text-zinc-400'}`}>
                            <IconComp className="w-3.5 h-3.5" />
                          </div>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                        </div>
                        <div className="text-xs font-semibold text-zinc-200 truncate">{meta.label}</div>
                        <div className="text-[9px] text-zinc-400 line-clamp-1 mt-0.5">{meta.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sliders: Widths & Tension */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-zinc-300">Dimensões & Fixação no Canto</div>
                  <span className="text-[10px] text-zinc-400">Expande sempre a partir da borda</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-zinc-300 mb-1">
                      <span>Largura Recolhida</span>
                      <span className={`font-mono text-xs ${config.width === 0 ? 'text-amber-400 font-semibold' : 'text-indigo-400'}`}>
                        {config.width === 0 ? '0px (Canto)' : `${config.width}px`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="180"
                      step="5"
                      value={config.width}
                      onChange={e => onUpdateConfig({ width: Number(e.target.value) })}
                      className="w-full accent-indigo-500"
                    />
                    <div className="text-[10px] text-zinc-400 mt-1 leading-tight">
                      {config.width === 0 
                        ? '⚡ Recolhido no canto da tela. Surge com hover ou atalho!'
                        : 'Sempre fixado junto ao canto da tela.'}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-zinc-300 mb-1">
                      <span>Largura Expandida</span>
                      <span className="font-mono text-indigo-400">{config.expandedWidth}px</span>
                    </div>
                    <input
                      type="range"
                      min="320"
                      max="480"
                      step="10"
                      value={config.expandedWidth}
                      onChange={e => onUpdateConfig({ expandedWidth: Number(e.target.value) })}
                      className="w-full accent-indigo-500"
                    />
                    <div className="text-[10px] text-zinc-400 mt-1 leading-tight">
                      Largura aberta no modo Morphing
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-zinc-300 mb-1">
                      <span>Tensão da Curva</span>
                      <span className="font-mono text-indigo-400">{Math.round(config.tension * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.6"
                      max="1.4"
                      step="0.05"
                      value={config.tension}
                      onChange={e => onUpdateConfig({ tension: Number(e.target.value) })}
                      className="w-full accent-indigo-500"
                    />
                    <div className="text-[10px] text-zinc-400 mt-1 leading-tight">
                      Profundidade da concavidade Bézier
                    </div>
                  </div>
                </div>
              </div>

              {/* Transition Control Panel (AuraMotion Engine) */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-zinc-900/60 border border-indigo-500/25 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Controle de Transição & Animação</div>
                      <div className="text-[10px] text-zinc-400">Ajuste a física, velocidade e curva de easing da dock expandida</div>
                    </div>
                  </div>

                  {/* Quick trigger test */}
                  <button
                    onClick={() => {
                      soundFX.playClick();
                      onToggleDock();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-[11px] font-medium transition-colors flex items-center gap-1 border border-indigo-500/30"
                  >
                    <Play className="w-3 h-3" />
                    <span>Testar Efeito</span>
                  </button>
                </div>

                {/* Speed Slider in ms */}
                <div className="bg-black/30 p-2.5 rounded-lg border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                      <Timer className="w-3.5 h-3.5 text-indigo-400" />
                      Velocidade da Expansão
                    </span>
                    <span className="font-mono text-sm font-bold text-indigo-300">
                      {config.transitionDuration ?? 320}ms
                    </span>
                  </div>

                  <input
                    type="range"
                    min="100"
                    max="900"
                    step="20"
                    value={config.transitionDuration ?? 320}
                    onChange={e => onUpdateConfig({ transitionDuration: Number(e.target.value) })}
                    className="w-full accent-indigo-500"
                  />

                  {/* Speed Presets */}
                  <div className="flex gap-1.5 pt-0.5">
                    {[
                      { ms: 160, label: '⚡ Ultra Rápida (160ms)' },
                      { ms: 320, label: '🎯 Padrão Suave (320ms)' },
                      { ms: 520, label: '🎬 Cinemática (520ms)' },
                      { ms: 750, label: '🌊 Fluida Lenta (750ms)' },
                    ].map(preset => (
                      <button
                        key={preset.ms}
                        onClick={() => {
                          soundFX.playClick();
                          onUpdateConfig({ transitionDuration: preset.ms });
                        }}
                        className={`flex-1 py-1 px-1 rounded text-[10px] font-medium transition-all text-center border truncate ${
                          (config.transitionDuration ?? 320) === preset.ms
                            ? 'bg-indigo-600 border-indigo-400 text-white font-semibold shadow-sm'
                            : 'bg-white/[0.03] border-white/5 text-zinc-400 hover:text-white hover:bg-white/[0.08]'
                        }`}
                        title={preset.label}
                      >
                        {preset.ms}ms
                      </button>
                    ))}
                  </div>
                </div>

                {/* Easing Curves Selector */}
                <div>
                  <div className="text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                    <span>Curva de Aceleração (Easing)</span>
                    <span className="text-[10px] font-mono text-indigo-400">
                      {EASING_FUNCTIONS[config.easingCurve ?? 'spring']?.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(Object.keys(EASING_FUNCTIONS) as EasingCurve[]).map(curveKey => {
                      const item = EASING_FUNCTIONS[curveKey];
                      const isSelected = (config.easingCurve ?? 'spring') === curveKey;

                      return (
                        <button
                          key={curveKey}
                          onClick={() => {
                            soundFX.playClick();
                            onUpdateConfig({ easingCurve: curveKey });
                          }}
                          className={`p-2 rounded-xl border text-left transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'bg-indigo-950/60 border-indigo-400 text-white ring-1 ring-indigo-400/40 shadow-sm'
                              : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-zinc-200">{item.label}</span>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                          </div>
                          <div className="text-[9px] text-zinc-400 leading-tight line-clamp-2">
                            {item.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>


              {/* Advanced Silhouette Styling: Opacity, Border, Glow */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                <div className="text-xs font-semibold text-zinc-300">Acabamento do Contorno & Superfície</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-zinc-300 mb-1">
                      <span>Opacidade do Fundo</span>
                      <span className="font-mono text-indigo-400">{config.bgOpacity ?? 96}%</span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="100"
                      value={config.bgOpacity ?? 96}
                      onChange={e => onUpdateConfig({ bgOpacity: Number(e.target.value) })}
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-zinc-300 mb-1">
                      <span>Espessura da Borda</span>
                      <span className="font-mono text-indigo-400">{config.borderWidth ?? 1.2}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="3.5"
                      step="0.5"
                      value={config.borderWidth ?? 1.2}
                      onChange={e => onUpdateConfig({ borderWidth: Number(e.target.value) })}
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-zinc-300 mb-1">
                      <span>Brilho Neon (Glow)</span>
                      <span className="font-mono text-indigo-400 capitalize">{config.glowIntensity ?? 'subtle'}</span>
                    </div>
                    <div className="flex gap-1">
                      {(['none', 'subtle', 'vibrant'] as const).map(gl => (
                        <button
                          key={gl}
                          onClick={() => {
                            soundFX.playClick();
                            onUpdateConfig({ glowIntensity: gl });
                          }}
                          className={`flex-1 py-1 text-[10px] rounded-lg border transition-colors ${
                            (config.glowIntensity ?? 'subtle') === gl
                              ? 'bg-indigo-600 border-indigo-400 text-white font-semibold'
                              : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {gl === 'none' ? 'Sem' : gl === 'subtle' ? 'Sutil' : 'Vivo'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Themes & Finish */}
          {activeTab === 'theme' && (
            <div className="pt-4 space-y-3">
              <div className="text-xs font-semibold text-zinc-300">
                Tema de Superfície & Degradês
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'onyx', label: 'Onyx Deep', desc: 'Preto OLED com borda sutil', color: '#0a0a0c' },
                  { id: 'glass', label: 'Vidro Fosco', desc: 'Glassmorphism com reflexo de luz', color: '#272938' },
                  { id: 'midnight', label: 'Midnight', desc: 'Crepúsculo cósmico violeta', color: '#1a102e' },
                  { id: 'titanium', label: 'Titânio', desc: 'Grafite metálico escovado', color: '#27272a' },
                  { id: 'cyberpunk', label: 'Cyberpunk', desc: 'Preto stealth com contorno neon', color: '#0f172a' },
                  { id: 'amber', label: 'Âmbar Retro', desc: 'Tons quentes de instrumentos', color: '#2e1a05' },
                ].map(th => {
                  const isSelected = config.theme === th.id;
                  return (
                    <button
                      key={th.id}
                      onClick={() => {
                        soundFX.playClick();
                        onUpdateConfig({ theme: th.id as DockTheme });
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-indigo-950/40 border-indigo-400 text-white ring-1 ring-indigo-400/30'
                          : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0" style={{ background: th.color }} />
                        <span className="text-xs font-semibold text-zinc-200">{th.label}</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 leading-snug">{th.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 4: Behavior & Positions */}
          {activeTab === 'behavior' && (
            <div className="pt-4 space-y-4">
              {/* Expansion Mode */}
              <div>
                <div className="text-xs font-semibold text-zinc-300 mb-1.5">
                  Comportamento ao Clicar em um Ícone
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      soundFX.playClick();
                      onUpdateConfig({ displayMode: 'morph' });
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      config.displayMode === 'morph'
                        ? 'bg-indigo-950/40 border-indigo-400 text-white ring-1 ring-indigo-400/30'
                        : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold text-xs">Morphing Expansivo</div>
                    <div className="text-[10px] text-zinc-400 mt-1">
                      O próprio menu se alarga para acomodar as ferramentas
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      soundFX.playClick();
                      onUpdateConfig({ displayMode: 'flyout' });
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      config.displayMode === 'flyout'
                        ? 'bg-indigo-950/40 border-indigo-400 text-white ring-1 ring-indigo-400/30'
                        : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold text-xs">Card Flutuante</div>
                    <div className="text-[10px] text-zinc-400 mt-1">
                      Abre um card popover separado adjacente ao botão
                    </div>
                  </button>
                </div>
              </div>

              {/* Edge Position */}
              <div>
                <div className="text-xs font-semibold text-zinc-300 mb-1.5">
                  Posição do Dock na Tela
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      soundFX.playClick();
                      onUpdateConfig({ position: 'right' });
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-medium text-center transition-all ${
                      config.position === 'right'
                        ? 'bg-white/15 border-white/30 text-white'
                        : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-white'
                    }`}
                  >
                    Borda Direita (Padrão)
                  </button>
                  <button
                    onClick={() => {
                      soundFX.playClick();
                      onUpdateConfig({ position: 'left' });
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-medium text-center transition-all ${
                      config.position === 'left'
                        ? 'bg-white/15 border-white/30 text-white'
                        : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-white'
                    }`}
                  >
                    Borda Esquerda
                  </button>
                </div>
              </div>

              {/* Multi-Monitor Selection */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5 flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Seleção de Monitor (Multi-Monitor)</span>
                </label>
                <p className="text-[11px] text-zinc-400 mb-2">
                  Escolha em qual monitor o menu lateral ficará fixado:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {displays.map((disp) => {
                    const isSelected = (config.targetDisplayIndex ?? 0) === disp.index;
                    return (
                      <button
                        key={disp.id || disp.index}
                        onClick={() => {
                          soundFX.playClick();
                          onUpdateConfig({ targetDisplayIndex: disp.index });
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500/60 text-white shadow-sm ring-1 ring-indigo-500/40'
                            : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-white/5 text-zinc-400'}`}>
                          <Monitor className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-semibold truncate">{disp.label.split(' - ')[0]}</span>
                            {disp.isPrimary && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 font-mono shrink-0">
                                Principal
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-0.5 font-mono truncate">
                            {disp.label.split(' - ')[1] || `${disp.bounds?.width || 1920}x${disp.bounds?.height || 1080}`}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Trigger Mode */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5 flex items-center gap-1.5">
                  <MousePointer className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Modo de Disparo do Menu</span>
                </label>
                <p className="text-[11px] text-zinc-400 mb-2">
                  Escolha a ação para revelar o menu lateral:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      soundFX.playClick();
                      onUpdateConfig({ triggerMode: 'ctrl-edge', autoHide: true });
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      (config.triggerMode || 'ctrl-edge') === 'ctrl-edge'
                        ? 'bg-indigo-600/20 border-indigo-500/60 text-white ring-1 ring-indigo-500/40 shadow-sm'
                        : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="text-xs font-semibold text-white flex items-center gap-1">
                      <span>Ctrl + Borda</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      Segure Ctrl e leve o mouse na borda
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      soundFX.playClick();
                      onUpdateConfig({ triggerMode: 'auto-hover', autoHide: true });
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      config.triggerMode === 'auto-hover'
                        ? 'bg-indigo-600/20 border-indigo-500/60 text-white ring-1 ring-indigo-500/40 shadow-sm'
                        : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="text-xs font-semibold text-white">
                      <span>Ao Passar Mouse</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      Surge automaticamente ao tocar a borda
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      soundFX.playClick();
                      onUpdateConfig({ triggerMode: 'ctrl-space', autoHide: false });
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      config.triggerMode === 'ctrl-space'
                        ? 'bg-indigo-600/20 border-indigo-500/60 text-white ring-1 ring-indigo-500/40 shadow-sm'
                        : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="text-xs font-semibold text-white">
                      <span>Apenas Atalho</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      Apenas pelo atalho Ctrl + Espaço
                    </div>
                  </button>
                </div>
              </div>

              {/* Toggles */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2.5">
                {/* Edge Visual Indicator Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-white flex items-center gap-1.5">
                      {config.showEdgeIndicator ? <Eye className="w-3.5 h-3.5 text-indigo-400" /> : <EyeOff className="w-3.5 h-3.5 text-zinc-400" />}
                      <span>Exibir Barra Indicadora na Lateral</span>
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      {config.showEdgeIndicator ? 'Mostra uma linha luminosa na borda da tela' : 'Borda 100% invisível sem qualquer marca ou linha visual'}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      soundFX.playClick();
                      onUpdateConfig({ showEdgeIndicator: !config.showEdgeIndicator });
                    }}
                    className={`w-9 h-5 rounded-full transition-colors relative p-0.5 shrink-0 ${
                      config.showEdgeIndicator ? 'bg-indigo-600' : 'bg-zinc-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        config.showEdgeIndicator ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                  <div>
                    <div className="text-xs font-medium text-white">Ocultar Automaticamente na Borda</div>
                    <div className="text-[10px] text-zinc-400">O dock se recolhe suavemente quando fora de foco</div>
                  </div>
                  <button
                    onClick={() => {
                      soundFX.playClick();
                      onUpdateConfig({ autoHide: !config.autoHide });
                    }}
                    className={`w-9 h-5 rounded-full transition-colors relative p-0.5 shrink-0 ${
                      config.autoHide ? 'bg-indigo-600' : 'bg-zinc-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        config.autoHide ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                  <div>
                    <div className="text-xs font-medium text-white">Efeitos Sonoros Hápticos</div>
                    <div className="text-[10px] text-zinc-400">Feedback de clique via Web Audio API</div>
                  </div>
                  <button
                    onClick={() => {
                      const next = !config.soundEnabled;
                      soundFX.enabled = next;
                      if (next) soundFX.playClick();
                      onUpdateConfig({ soundEnabled: next });
                    }}
                    className={`w-9 h-5 rounded-full transition-colors relative p-0.5 shrink-0 ${
                      config.soundEnabled ? 'bg-indigo-600' : 'bg-zinc-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        config.soundEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Dock Items Manager */}
          {activeTab === 'items' && (
            <div className="pt-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-300">
                <span className="font-semibold">Atalhos Configurados no Dock</span>
                <button
                  onClick={() => {
                    soundFX.playClick();
                    onOpenItemEditor();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Adicionar Atalho</span>
                </button>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {items.map((it, idx) => (
                  <div
                    key={it.id}
                    className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white">
                        <DockIcon name={it.iconName} className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">{it.title}</div>
                        <div className="text-[10px] text-zinc-400">{it.detail}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        soundFX.playClick();
                        onOpenItemEditor(it);
                      }}
                      className="px-2 py-1 rounded-md text-[11px] text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      Editar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Quick Action Bar */}
          <div className="pt-5 mt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
            <div className="text-[11px] text-zinc-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Pronto para Windows 10/11 · Atalho Ctrl + Espaço</span>
            </div>

            <div className="flex items-center gap-2">
              {(onSaveToTray || (typeof window !== 'undefined' && window.electronAPI)) && (
                <button
                  onClick={() => {
                    soundFX.playComplete();
                    if (onSaveToTray) onSaveToTray();
                    else if (window.electronAPI) window.electronAPI.hideConfig();
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>Salvar e Recolher para a Bandeja</span>
                </button>
              )}

              <button
                onClick={() => {
                  soundFX.playClick();
                  onOpenExportModal();
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-lg hover:scale-105 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Exportar / Código</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tactile Bottom-Right Corner Resize Grip (Free Drag Resize) */}
        <div
          onMouseDown={e => handleResizeMouseDown(e, 'se')}
          className="absolute bottom-1 right-1 w-6 h-6 cursor-nwse-resize flex items-end justify-end p-1 z-50 group select-none"
          title="Arraste para redimensionar livremente o tamanho do painel"
        >
          <div className="w-3.5 h-3.5 flex flex-col items-end justify-end gap-0.5 opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all">
            <div className="flex gap-0.5">
              <div className="w-1 h-1 rounded-full bg-white/70 group-hover:bg-indigo-400" />
            </div>
            <div className="flex gap-0.5">
              <div className="w-1 h-1 rounded-full bg-white/70 group-hover:bg-indigo-400" />
              <div className="w-1 h-1 rounded-full bg-white/70 group-hover:bg-indigo-400" />
            </div>
            <div className="flex gap-0.5">
              <div className="w-1 h-1 rounded-full bg-white/70 group-hover:bg-indigo-400" />
              <div className="w-1 h-1 rounded-full bg-white/70 group-hover:bg-indigo-400" />
              <div className="w-1 h-1 rounded-full bg-white/70 group-hover:bg-indigo-400" />
            </div>
          </div>
        </div>
      </div>
    )}

    {/* The Live Lateral Dock (Rendered via Children) */}
    {children}
  </main>

      {/* Edge Hover Hot-Zone Trigger (when dock is hidden and configured) */}
      {!isDockVisible && (
        <div
          onMouseEnter={(e) => {
            const mode = config.triggerMode || 'ctrl-edge';
            if (mode === 'ctrl-edge' && e.ctrlKey) {
              soundFX.playOpen();
              onToggleDock();
            } else if (mode === 'auto-hover') {
              soundFX.playOpen();
              onToggleDock();
            }
          }}
          className={`fixed top-0 bottom-0 z-40 w-4 group cursor-pointer transition-all ${
            config.position === 'right' ? 'right-0 hover:w-6' : 'left-0 hover:w-6'
          }`}
          title={
            config.triggerMode === 'ctrl-edge'
              ? 'Segure Ctrl e encoste o cursor nesta borda para expandir o dock'
              : 'Encoste o cursor nesta borda para expandir o dock'
          }
        >
          {config.showEdgeIndicator && (
            <div
              className={`h-full w-1 group-hover:w-1.5 transition-all bg-indigo-500/20 group-hover:bg-indigo-400 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.6)] ${
                config.position === 'right' ? 'ml-auto' : 'mr-auto'
              }`}
            />
          )}
        </div>
      )}

      {/* Windows System Tray Simulator (Floating Widget on Corner) */}
      <div
        className={`fixed bottom-3 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-md text-xs shadow-xl ${
          config.position === 'right' ? 'left-4' : 'right-4'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[11px] text-zinc-300 font-medium">Bandeja do Windows</span>
        <button
          onClick={() => {
            soundFX.playClick();
            onToggleDock();
          }}
          className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors underline ml-1"
        >
          {isDockVisible ? 'Ocultar' : 'Abrir'}
        </button>
      </div>
    </div>
  );
};
