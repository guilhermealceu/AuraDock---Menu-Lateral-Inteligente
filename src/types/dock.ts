export type DockPosition = 'right' | 'left';

export type DockDisplayMode = 'morph' | 'flyout'; // 'morph' expande a própria dock lateralmente; 'flyout' abre card flutuante ao lado

export type DockShape = 
  | 'drop'         // Gota suave
  | 'leaf'         // Folha
  | 'wave'         // Onda
  | 'feather'      // Pena
  | 'orbit'        // Órbita
  | 'cyber'        // Cyber Chanfro
  | 'capsule'      // Cápsula Orgânica
  | 'full-panel';  // Painel Lateral Contínuo (100% Altura)

export type DockTheme = 
  | 'onyx'       // Preto profundo com borda sutil
  | 'glass'      // Vidro fosco translúcido
  | 'midnight'   // Azul noite / roxo profundo
  | 'titanium'   // Grafite metálico
  | 'cyberpunk'  // Preto com acentos neon
  | 'nordic'     // Cinza ardósia nórdico
  | 'amber';     // Âmbar retro industrial

export type StylePresetId = 
  | 'organic-onyx'
  | 'frost-glass'
  | 'cyber-stealth'
  | 'macos-floating'
  | 'split-drawer'
  | 'amber-terminal'
  | 'nordic-minimal';

export interface StylePreset {
  id: StylePresetId;
  name: string;
  category: string;
  description: string;
  shape: DockShape;
  theme: DockTheme;
  defaultDisplayMode: DockDisplayMode;
  width: number;
  expandedWidth: number;
  tension: number;
  wallpaper: string;
}

export interface DockItem {
  id: string;
  iconName: string;
  title: string;
  detail: string;
  badge?: string | number;
  color?: string;
  actionType?: 'flyout' | 'app' | 'link';
}

export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  priority: 'baixa' | 'media' | 'alta';
  dueTime?: string;
}

export interface AgendaEvent {
  id: string;
  time: string;
  title: string;
  category: 'Trabalho' | 'Reunião' | 'Pessoal' | 'Entrega';
  location?: string;
}

export interface RecentDoc {
  id: string;
  name: string;
  size: string;
  ext: string;
  modified: string;
}

export type DockHeightMode = 'full' | 'organic' | 'custom';

export type EasingCurve = 'ease-in-out' | 'spring' | 'linear' | 'ease-out';

export const EASING_FUNCTIONS: Record<EasingCurve, { label: string; css: string; desc: string }> = {
  'ease-in-out': {
    label: 'Ease In Out',
    css: 'cubic-bezier(0.4, 0, 0.2, 1)',
    desc: 'Transição equilibrada e natural',
  },
  spring: {
    label: 'Spring (Elástica)',
    css: 'cubic-bezier(0.34, 1.45, 0.64, 1)',
    desc: 'Efeito mola fluido com leve overshoot orgânico',
  },
  'ease-out': {
    label: 'Ease Out',
    css: 'cubic-bezier(0, 0, 0.2, 1)',
    desc: 'Início rápido com chegada desacelerada suave',
  },
  linear: {
    label: 'Linear',
    css: 'linear',
    desc: 'Velocidade uniforme e mecânica contínua',
  },
};

export interface DockConfig {
  shape: DockShape;
  position: DockPosition;
  displayMode: DockDisplayMode;
  theme: DockTheme;
  width: number;
  expandedWidth: number;
  heightRatio: number;
  autoHide: boolean;
  soundEnabled: boolean;
  glowEffect: boolean;
  tension: number;
  scale: number;
  wallpaper: string;
  // Silhueta Editável & Cobertura
  heightMode: DockHeightMode;
  topOffset: number;       // Percentual do topo (0 = ponta a ponta)
  bottomOffset: number;    // Percentual da base (100 = ponta a ponta)
  autoExpandFullHeight: boolean; // Cobrir 100% ao expandir no morphing
  borderWidth: number;     // Espessura da borda da silhueta (0 a 4px)
  bgOpacity: number;       // Opacidade do fundo (40 a 100%)
  glowIntensity: 'none' | 'subtle' | 'vibrant';
  // Controles de Transição & Animação
  transitionDuration: number; // Duração em ms (100 a 1000)
  easingCurve: EasingCurve;   // Curva de interpolação
  // Disparo e Multi-Monitor
  triggerMode: 'ctrl-edge' | 'auto-hover' | 'ctrl-space'; // Modo de ativação do dock
  showEdgeIndicator: boolean; // Exibir ou ocultar a barrinha indicadora lateral
  targetDisplayIndex: number; // Índice do monitor alvo (0 = Principal, 1, 2...)
}


