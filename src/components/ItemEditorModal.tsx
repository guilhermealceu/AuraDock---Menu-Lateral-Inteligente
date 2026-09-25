import React, { useState, useEffect } from 'react';
import { DockItem } from '../types/dock';
import { soundFX } from '../utils/sound';
import { X, Plus, Check, Trash2 } from 'lucide-react';
import { DockIcon } from './DockIcon';

interface ItemEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveItem: (item: DockItem) => void;
  onDeleteItem?: (id: string) => void;
  itemToEdit?: DockItem | null;
}

const AVAILABLE_ICONS = [
  'Home',
  'CheckSquare',
  'Calendar',
  'Folder',
  'FileText',
  'Settings',
  'Terminal',
  'Sparkles',
  'Bookmark',
  'Clock',
  'Globe',
  'Music',
  'MessageSquare',
  'Monitor',
  'Mail',
  'Search',
  'Code',
  'Zap',
  'Flame',
  'Shield',
  'Headphones',
  'Camera',
  'Download',
  'Share2',
  'Layers',
];

export const ItemEditorModal: React.FC<ItemEditorModalProps> = ({
  isOpen,
  onClose,
  onSaveItem,
  onDeleteItem,
  itemToEdit,
}) => {
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [iconName, setIconName] = useState('Sparkles');
  const [badge, setBadge] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle(itemToEdit?.title || '');
      setDetail(itemToEdit?.detail || '');
      setIconName(itemToEdit?.iconName || 'Sparkles');
      setBadge(itemToEdit?.badge?.toString() || '');
    }
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    soundFX.playComplete();

    onSaveItem({
      id: itemToEdit?.id || `custom-${Date.now()}`,
      title: title.trim(),
      detail: detail.trim() || 'Acesso rápido personalizado.',
      iconName,
      badge: badge.trim() ? badge.trim() : undefined,
    });
    onClose();
  };

  const handleDelete = () => {
    if (itemToEdit && onDeleteItem) {
      soundFX.playClose();
      onDeleteItem(itemToEdit.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-[#11121a] border border-white/15 rounded-2xl shadow-2xl p-6 text-left space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>{itemToEdit ? 'Editar Atalho do Dock' : 'Novo Atalho do Dock'}</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-zinc-300 font-medium mb-1">Título do Atalho</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Tarefas, Spotify, Terminal, Google..."
              required
              autoFocus
              className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-400"
            />
          </div>

          <div>
            <label className="block text-zinc-300 font-medium mb-1">Descrição / Subtítulo</label>
            <input
              type="text"
              value={detail}
              onChange={e => setDetail(e.target.value)}
              placeholder="Ex: Acesso rápido, lista de pendências..."
              className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-400"
            />
          </div>

          <div>
            <label className="block text-zinc-300 font-medium mb-1">Escolher Ícone</label>
            <div className="grid grid-cols-5 gap-2 max-h-36 overflow-y-auto pr-1">
              {AVAILABLE_ICONS.map(ic => (
                <button
                  type="button"
                  key={ic}
                  onClick={() => {
                    soundFX.playClick();
                    setIconName(ic);
                  }}
                  className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all ${
                    iconName === ic
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-600/30 scale-105'
                      : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                  title={ic}
                >
                  <DockIcon name={ic} className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-zinc-300 font-medium mb-1">Badge Opcional (Ex: 3, Novo, 14h)</label>
            <input
              type="text"
              value={badge}
              onChange={e => setBadge(e.target.value)}
              placeholder="Ex: 3 ou Novo"
              className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-400"
            />
          </div>

          <div className="pt-2 flex items-center justify-between gap-2 border-t border-white/[0.08]">
            {itemToEdit && onDeleteItem && (
              <button
                type="button"
                onClick={handleDelete}
                className="py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="Excluir este atalho"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            )}

            <div className="flex gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
              >
                Salvar Atalho
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
