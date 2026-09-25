import { DockConfig, DockItem } from './dock';

export interface DisplayInfo {
  index: number;
  id: number;
  label: string;
  isPrimary: boolean;
  bounds: { x: number; y: number; width: number; height: number };
  workArea: { x: number; y: number; width: number; height: number };
}

export interface ElectronAPI {
  isElectron: boolean;
  viewType?: 'dock' | 'config' | null;
  getConfig: () => Promise<{ config: DockConfig; items: DockItem[] }>;
  saveConfig: (config: DockConfig, items: DockItem[]) => Promise<{ success: boolean }>;
  hideConfig: () => void;
  setDockSize: (width: number, height?: number) => void;
  toggleDock: () => void;
  openConfig: () => void;
  quitApp: () => void;
  getDisplays: () => Promise<DisplayInfo[]>;
  onConfigUpdated: (callback: (data: { config: DockConfig; items: DockItem[] }) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
