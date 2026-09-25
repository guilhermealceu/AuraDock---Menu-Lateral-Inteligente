import React, { useEffect, useRef } from 'react';
import { DockConfig, DockItem } from '../types/dock';
import { FlyoutContent } from './FlyoutContent';
import { X, Sparkles } from 'lucide-react';

interface DockFlyoutProps {
  item: DockItem;
  targetRect: DOMRect | null;
  config: DockConfig;
  onUpdateConfig: (partial: Partial<DockConfig>) => void;
  onOpenExportModal: () => void;
  onClose: () => void;
}

export const DockFlyout: React.FC<DockFlyoutProps> = ({
  item,
  targetRect,
  config,
  onUpdateConfig,
  onOpenExportModal,
  onClose,
}) => {
  const flyoutRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (flyoutRef.current && !flyoutRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timer = setTimeout(() => {
      window.addEventListener('mousedown', handleOutsideClick);
    }, 50);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [onClose]);

  // Compute vertical position so flyout stays comfortably on screen
  let topPosition = 120;
  if (targetRect) {
    // Center roughly relative to button
    topPosition = Math.max(24, Math.min(window.innerHeight - 560, targetRect.top - 80));
  }

  const isRight = config.position === 'right';

  return (
    <div
      ref={flyoutRef}
      className={`fixed z-50 w-80 md:w-96 rounded-2xl p-5 border shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 ${
        config.theme === 'glass'
          ? 'bg-zinc-950/80 border-white/20 text-white shadow-purple-950/20'
          : config.theme === 'midnight'
          ? 'bg-[#0f0a1c]/95 border-purple-500/25 text-white shadow-purple-950/40'
          : config.theme === 'cyberpunk'
          ? 'bg-[#090a0f]/95 border-emerald-500/30 text-white shadow-emerald-950/40'
          : 'bg-[#0f1015]/95 border-white/10 text-white shadow-black/80'
      }`}
      style={{
        top: `${topPosition}px`,
        [isRight ? 'right' : 'left']: `${config.width + 16}px`,
      }}
    >
      {/* Flyout Header */}
      <div className="flex items-start justify-between pb-3.5 mb-3.5 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white tracking-tight">{item.title}</h3>
            {item.badge && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                {item.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-0.5 leading-snug">{item.detail}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Fechar (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Flyout Body */}
      <FlyoutContent
        item={item}
        config={config}
        onUpdateConfig={onUpdateConfig}
        onOpenExportModal={onOpenExportModal}
        onClose={onClose}
      />

      {/* Footer Hint */}
      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-zinc-400">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          AuraDock Studio
        </span>
        <span>Pressione ESC para fechar</span>
      </div>
    </div>
  );
};
