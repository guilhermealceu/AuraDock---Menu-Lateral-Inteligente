import React, { useState, useRef, useEffect } from 'react';
import { DockConfig, DockItem, EASING_FUNCTIONS } from '../types/dock';
import { DockSilhouette } from './DockSilhouette';
import { DockFlyout } from './DockFlyout';
import { DockIcon } from './DockIcon';
import { FlyoutContent } from './FlyoutContent';
import { soundFX } from '../utils/sound';
import { Plus, ArrowLeft, ArrowRight, X, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

interface LateralDockProps {
  config: DockConfig;
  items: DockItem[];
  isVisible: boolean;
  onUpdateConfig: (partial: Partial<DockConfig>) => void;
  onOpenExportModal: () => void;
  onOpenItemEditor: (item?: DockItem) => void;
  onDeleteItem: (id: string) => void;
}

export const LateralDock: React.FC<LateralDockProps> = ({
  config,
  items,
  isVisible,
  onUpdateConfig,
  onOpenExportModal,
  onOpenItemEditor,
}) => {
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isDockHovered, setIsDockHovered] = useState(false);
  const [isEdgeHovered, setIsEdgeHovered] = useState(false);
  const [isCtrlEdgeHovered, setIsCtrlEdgeHovered] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dockHeight, setDockHeight] = useState<number>(() => typeof window !== 'undefined' ? window.innerHeight : 800);

  useEffect(() => {
    const handleResize = () => setDockHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen to ESC to collapse active item
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeItemId) {
        soundFX.playClose();
        setActiveItemId(null);
        setTargetRect(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeItemId]);

  // Global mouse & Ctrl key tracker to summon dock on edge hover or Ctrl + Edge
  useEffect(() => {
    const isRight = config.position === 'right';

    const handleMouseMove = (e: MouseEvent) => {
      const nearEdge = isRight
        ? e.clientX >= window.innerWidth - 32
        : e.clientX <= 32;

      if (nearEdge) {
        setIsEdgeHovered(true);
        if (e.ctrlKey) {
          setIsCtrlEdgeHovered(true);
        }
      } else {
        if (!isDockHovered && !activeItemId) {
          setIsEdgeHovered(false);
          setIsCtrlEdgeHovered(false);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        if (!isDockHovered && !isEdgeHovered && !activeItemId) {
          setIsCtrlEdgeHovered(false);
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [config.position, isDockHovered, activeItemId, isEdgeHovered]);

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>, item: DockItem) => {
    soundFX.playClick();
    if (activeItemId === item.id) {
      soundFX.playClose();
      setActiveItemId(null);
      setTargetRect(null);
    } else {
      soundFX.playOpen();
      setActiveItemId(item.id);
      setTargetRect(e.currentTarget.getBoundingClientRect());
    }
  };

  const handleButtonMouseEnter = (item: DockItem) => {
    setHoveredId(item.id);
    soundFX.playHover();
  };

  const activeItem = items.find(i => i.id === activeItemId) || null;
  const isRight = config.position === 'right';
  const isMorphMode = config.displayMode === 'morph';
  const isExpanded = isMorphMode && activeItemId !== null;

  const durationMs = config.transitionDuration || 320;
  const easingCss = EASING_FUNCTIONS[config.easingCurve || 'spring']?.css || 'cubic-bezier(0.34, 1.45, 0.64, 1)';

  const triggerMode = config.triggerMode || 'ctrl-edge';

  // Determine if dock is revealed
  let isRevealed = true;
  if (config.autoHide) {
    if (triggerMode === 'ctrl-edge') {
      // ONLY reveal if user is holding Ctrl near the edge, or dock is actively hovered/expanded!
      isRevealed = isCtrlEdgeHovered || isDockHovered || isExpanded;
    } else if (triggerMode === 'auto-hover') {
      // Reveal on any hover near edge or dock
      isRevealed = isEdgeHovered || isDockHovered || isExpanded;
    } else {
      // 'ctrl-space' - only reveals when opened via shortcut
      isRevealed = isDockHovered || isExpanded;
    }
  }

  // If width is set to 0 (hidden in corner), hovering the screen edge peeks the icons (64px)
  const isZeroWidth = config.width === 0;
  const collapsedWidth = isZeroWidth ? (isRevealed ? 64 : 0) : config.width;
  const currentWidth = isExpanded ? config.expandedWidth : collapsedWidth;

  // Inform Electron of dynamic window width
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.setDockSize(currentWidth);
    }
  }, [currentWidth]);

  // Determine translation: fully hidden vs auto-hidden vs fully visible
  let transformClass = 'translate-x-0';
  if (!isVisible) {
    transformClass = isRight ? 'translate-x-full pointer-events-none' : '-translate-x-full pointer-events-none';
  } else if (config.autoHide && !isRevealed) {
    if (config.showEdgeIndicator) {
      transformClass = isRight ? 'translate-x-[calc(100%-6px)]' : '-translate-x-[calc(100%-6px)]';
    } else {
      // 100% hidden when not triggered with Ctrl
      transformClass = isRight ? 'translate-x-full' : '-translate-x-full';
    }
  }

  return (
    <>
      {/* Full-height Edge Touch Sensor for Auto-Hide and 0px Modes */}
      {(config.autoHide || isZeroWidth) && !isExpanded && (
        <div
          onMouseEnter={(e) => {
            if (triggerMode === 'ctrl-edge' && e.ctrlKey) {
              soundFX.playHover();
              setIsCtrlEdgeHovered(true);
            } else if (triggerMode === 'auto-hover') {
              soundFX.playHover();
              setIsEdgeHovered(true);
            }
          }}
          className={`fixed z-50 top-0 bottom-0 w-4.5 cursor-pointer select-none group flex items-center justify-center ${
            isRight ? 'right-0' : 'left-0'
          }`}
          title={
            triggerMode === 'ctrl-edge'
              ? 'Segure Ctrl nesta borda para exibir o menu lateral'
              : 'Passe o cursor nesta borda para exibir o menu lateral'
          }
        >
          {config.autoHide && !isRevealed && config.showEdgeIndicator && (
            <div className="w-1.5 h-24 rounded-full bg-indigo-500/40 group-hover:bg-indigo-400 group-hover:h-36 group-hover:w-2 transition-all shadow-[0_0_12px_rgba(99,102,241,0.8)]" />
          )}
        </div>
      )}

      {/* Main Dock Container - 100% glued to screen border */}
      <div
        ref={containerRef}
        onMouseEnter={() => {
          setIsDockHovered(true);
          setIsEdgeHovered(true);
        }}
        onMouseLeave={() => {
          setIsDockHovered(false);
          if (!activeItemId) {
            setIsEdgeHovered(false);
            setIsCtrlEdgeHovered(false);
          }
        }}
        className={`fixed z-40 flex items-center select-none ${
          isRight ? 'right-0' : 'left-0'
        } ${transformClass}`}
        style={{
          top: '0px',
          bottom: '0px',
          height: '100vh',
          width: `${currentWidth}px`,
          margin: 0,
          padding: 0,
          transition: `width ${durationMs}ms ${easingCss}, transform ${durationMs}ms ${easingCss}`,
        }}
      >
        {/* Dynamic SVG Silhouette (Automatically morphs width smoothly and covers height) */}
        <DockSilhouette 
          config={{ ...config, width: currentWidth }} 
          height={dockHeight} 
          isExpanded={isExpanded}
        />

        {/* --- MODE 1: MORPHING INTEGRATED VIEW (Expande a própria dock) --- */}
        {isMorphMode && isExpanded && activeItem ? (
          <div
            className={`relative z-10 w-full h-full flex flex-col justify-start pt-5 pb-5 px-4 animate-in fade-in duration-200 overflow-hidden ${
              isRight ? 'items-end pr-4 pl-6' : 'items-start pl-4 pr-6'
            }`}
          >
            {/* Header with Back button and item title */}
            <div className="w-full flex items-center justify-between pb-3 mb-2.5 border-b border-white/[0.08] shrink-0">
              <button
                onClick={() => {
                  soundFX.playClose();
                  setActiveItemId(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-zinc-200 hover:text-white text-xs font-medium transition-colors"
              >
                {isRight ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
                <span>Voltar aos Ícones</span>
              </button>

              {/* Quick mini-switcher of icons */}
              <div className="flex items-center gap-1">
                {items.map(it => (
                  <button
                    key={it.id}
                    onClick={() => {
                      soundFX.playClick();
                      setActiveItemId(it.id);
                    }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      it.id === activeItemId
                        ? 'bg-white text-zinc-950 scale-105 shadow-sm'
                        : 'text-zinc-400 hover:text-white hover:bg-white/10'
                    }`}
                    title={it.title}
                  >
                    <DockIcon name={it.iconName} className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Item Title and Description */}
            <div className="w-full mb-3 text-left">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white tracking-tight">{activeItem.title}</h3>
                {activeItem.badge && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                    {activeItem.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 leading-snug">{activeItem.detail}</p>
            </div>

            {/* Expanded Inner Widget */}
            <div className="w-full flex-1 overflow-y-auto pr-1">
              <FlyoutContent
                item={activeItem}
                config={config}
                onUpdateConfig={onUpdateConfig}
                onOpenExportModal={onOpenExportModal}
                onClose={() => {
                  soundFX.playClose();
                  setActiveItemId(null);
                }}
              />
            </div>

            {/* Footer note inside expanded dock */}
            <div className="w-full mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-zinc-400">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                Dock Expandido (Morphing)
              </span>
              <span className="font-mono">ESC para fechar</span>
            </div>
          </div>
        ) : (
          /* --- COMPACT STATE: Column of Dock Icon Cards --- */
          <div
            className={`relative z-10 flex flex-col items-center gap-2.5 py-4 w-full ${
              isRight ? 'pr-1.5 pl-auto' : 'pl-1.5 pr-auto'
            }`}
            style={{
              width: '56px',
              marginLeft: isRight ? 'auto' : undefined,
              marginRight: !isRight ? 'auto' : undefined,
            }}
          >
            {items.map(item => {
              const isActive = activeItemId === item.id;
              const isHovered = hoveredId === item.id;

              return (
                <div key={item.id} className="relative group">
                  <button
                    onClick={e => handleButtonClick(e, item)}
                    onMouseEnter={() => handleButtonMouseEnter(item)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-white text-zinc-950 scale-110 shadow-lg shadow-white/20 ring-2 ring-white/40'
                        : 'text-zinc-300 hover:text-white hover:bg-white/15 hover:scale-105 active:scale-95'
                    }`}
                    title={item.title}
                    aria-label={item.title}
                  >
                    <DockIcon name={item.iconName} className="w-5 h-5 transition-transform" />

                    {/* Badge indicator */}
                    {item.badge !== undefined && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center shadow-md">
                        {item.badge}
                      </span>
                    )}
                  </button>

                  {/* Tooltip on Hover when flyout is closed */}
                  {isHovered && !isActive && (
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 z-50 pointer-events-none whitespace-nowrap px-2.5 py-1 rounded-md bg-zinc-900/90 border border-white/10 text-white text-[11px] font-medium shadow-xl backdrop-blur-md animate-in fade-in duration-150 ${
                        isRight ? 'right-14' : 'left-14'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{item.title}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add / Manage Item Button */}
            <button
              onClick={() => {
                soundFX.playClick();
                onOpenItemEditor();
              }}
              className="w-8 h-8 rounded-full border border-dashed border-white/20 text-zinc-400 hover:text-white hover:border-white/50 hover:bg-white/5 transition-all flex items-center justify-center mt-1 cursor-pointer"
              title="Adicionar Atalho Personalizado"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* --- MODE 2: CLASSIC FLYOUT POPUP (Apenas se displayMode for 'flyout') --- */}
        {!isMorphMode && activeItem && (
          <DockFlyout
            item={activeItem}
            targetRect={targetRect}
            config={config}
            onUpdateConfig={onUpdateConfig}
            onOpenExportModal={onOpenExportModal}
            onClose={() => {
              soundFX.playClose();
              setActiveItemId(null);
              setTargetRect(null);
            }}
          />
        )}
      </div>
    </>
  );
};
