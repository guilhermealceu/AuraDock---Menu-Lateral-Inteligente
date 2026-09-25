import { DockPosition, DockShape } from '../types/dock';

export interface ShapePathResult {
  pathData: string;
  viewBox: string;
  width: number;
  height: number;
}

export const SHAPE_METADATA: Record<DockShape, { label: string; desc: string; icon: string }> = {
  'full-panel': {
    label: 'Painel Total (100% Tela)',
    desc: 'Cobre toda a lateral de cima a baixo com acabamento ergonômico',
    icon: 'Sidebar',
  },
  drop: {
    label: 'Gota Suave',
    desc: 'Bézier orgânica com ápice elíptico e transição fluida',
    icon: 'Droplet',
  },
  leaf: {
    label: 'Folha Botânica',
    desc: 'Extremidades afiladas e curvatura biomórfica esbelta',
    icon: 'Sparkle',
  },
  wave: {
    label: 'Onda Harmônica',
    desc: 'Ondulação dupla sinuosa com ritmo dinâmico',
    icon: 'Waves',
  },
  feather: {
    label: 'Pena Aerodinâmica',
    desc: 'Assimetria estilizada inspirada em aerofólio',
    icon: 'Feather',
  },
  orbit: {
    label: 'Órbita Gravitacional',
    desc: 'Arco elíptico profundo de alto alcance ergonômico',
    icon: 'CircleDot',
  },
  cyber: {
    label: 'Cyber Stealth',
    desc: 'Chanfros poliédricos angulares com linhas de precisão',
    icon: 'Shield',
  },
  capsule: {
    label: 'Cápsula Flutuante',
    desc: 'Pílula aerada com acabamento superelíptico clássico',
    icon: 'Columns2',
  },
};

/**
 * Calculates SVG Path string for the silhouette based on shape, dimensions, tension, position and coverage
 * Ensures that the silhouette ALWAYS reaches the full width W of the dock without cutting off content.
 */
export function generateSilhouettePath(
  shape: DockShape,
  width: number,
  height: number,
  position: DockPosition,
  tensionFactor: number = 1.0,
  topRatio: number = 0.0,
  bottomRatio: number = 1.0,
  forceFullHeight: boolean = false
): string {
  const isRight = position === 'right';
  const W = width;
  const H = height;

  // Vertical bounds
  const actualTop = forceFullHeight || shape === 'full-panel' 
    ? 0 
    : Math.round(H * Math.max(0, Math.min(0.35, topRatio)));
  const actualBottom = forceFullHeight || shape === 'full-panel' 
    ? H 
    : Math.round(H * Math.max(0.65, Math.min(1.0, bottomRatio)));
  const activeHeight = Math.max(100, actualBottom - actualTop);

  // Proportional X coordinate helper
  // ratio = 0.0 means the outer screen edge (touching screen border)
  // ratio = 1.0 means the deepest inner edge (covering the full dock width W)
  // tensionFactor adjusts the curve convexity/steepness, while ALWAYS preserving 100% width reach at apex.
  const getX = (protrusionRatio: number) => {
    // Clamped protrusion from outer screen edge into the screen
    // Apex (ratio 1.0) reaches W - 4px so content fits 100% inside silhouette
    const maxReach = W - 3;
    const baseProtrusion = protrusionRatio * maxReach;
    
    // Apply tension non-linearly to the curve inflection, guaranteeing apex reaches maxReach
    const adjustedProtrusion = protrusionRatio >= 0.95 
      ? maxReach 
      : Math.round(baseProtrusion * Math.pow(tensionFactor, 0.5));

    const finalProtrusion = Math.max(0, Math.min(maxReach, adjustedProtrusion));

    if (isRight) {
      // Screen edge is at x = W. Inner space is towards x = 0.
      return Math.round(W - finalProtrusion);
    } else {
      // Screen edge is at x = 0. Inner space is towards x = W.
      return Math.round(finalProtrusion);
    }
  };

  const edgeX = isRight ? W : 0;
  const apexX = getX(1.0); // Full width reach

  // Helper relative Y position
  const relY = (ratio: number) => Math.round(actualTop + activeHeight * ratio);

  // 1. FULL PANEL (100% Screen Height, cleanly wraps all content)
  if (shape === 'full-panel' || (forceFullHeight && (shape === 'capsule' || shape === 'cyber'))) {
    const radius = Math.min(32, Math.round(W * 0.08));
    const innerX = apexX;

    if (isRight) {
      return `M ${W},0 L ${innerX + radius},0 Q ${innerX},0 ${innerX},${radius} L ${innerX},${H - radius} Q ${innerX},${H} ${innerX + radius},${H} L ${W},${H} Z`;
    } else {
      return `M 0,0 L ${innerX - radius},0 Q ${innerX},0 ${innerX},${radius} L ${innerX},${H - radius} Q ${innerX},${H} ${innerX - radius},${H} L 0,${H} Z`;
    }
  }

  // 2. GOTA SUAVE (Bézier organic curve that reaches 100% width at mid)
  if (shape === 'drop') {
    const y0 = actualTop;
    const y1 = relY(0.10);
    const y2 = relY(0.28);
    const yMid = relY(0.50);
    const y4 = relY(0.72);
    const y5 = relY(0.90);
    const yEnd = actualBottom;

    const x0 = edgeX;
    const x1 = getX(0.35);
    const x2 = getX(0.85);
    const xMid = apexX;
    const x4 = getX(0.85);
    const x5 = getX(0.35);

    return `M ${x0},${y0} C ${x1},${y1} ${x2},${y2} ${xMid},${yMid} C ${x4},${y4} ${x5},${y5} ${x0},${yEnd} L ${x0},${y0} Z`;
  }

  // 3. FOLHA BOTÂNICA
  if (shape === 'leaf') {
    const y0 = actualTop;
    const y1 = relY(0.12);
    const y2 = relY(0.34);
    const yMid = relY(0.50);
    const y4 = relY(0.66);
    const y5 = relY(0.88);
    const yEnd = actualBottom;

    const x0 = edgeX;
    const x1 = getX(0.40);
    const x2 = getX(0.90);
    const xMid = apexX;
    const x4 = getX(0.90);
    const x5 = getX(0.40);

    return `M ${x0},${y0} C ${x1},${y1} ${x2},${y2} ${xMid},${yMid} C ${x4},${y4} ${x5},${y5} ${x0},${yEnd} L ${x0},${y0} Z`;
  }

  // 4. ONDA HARMÔNICA
  if (shape === 'wave') {
    const y0 = actualTop;
    const y1 = relY(0.14);
    const y2 = relY(0.28);
    const y3 = relY(0.42);
    const y4 = relY(0.50);
    const y5 = relY(0.58);
    const y6 = relY(0.72);
    const y7 = relY(0.86);
    const yEnd = actualBottom;

    const x0 = edgeX;
    const x1 = getX(0.30);
    const x2 = getX(0.88);
    const x3 = getX(0.82);
    const x4 = apexX;
    const x5 = getX(0.82);
    const x6 = getX(0.88);
    const x7 = getX(0.30);

    return `M ${x0},${y0} C ${x1},${y1} ${x2},${y2} ${x3},${y3} C ${x4},${y4} ${x5},${y5} ${x6},${y6} C ${x7},${y7} ${x1},${y7} ${x0},${yEnd} L ${x0},${y0} Z`;
  }

  // 5. PENA AERODINÂMICA
  if (shape === 'feather') {
    const y0 = actualTop;
    const y1 = relY(0.15);
    const y2 = relY(0.28);
    const yMid = relY(0.45);
    const y4 = relY(0.62);
    const y5 = relY(0.84);
    const yEnd = actualBottom;

    const x0 = edgeX;
    const x1 = getX(0.30);
    const x2 = getX(0.85);
    const xMid = apexX;
    const x4 = getX(0.90);
    const x5 = getX(0.45);

    return `M ${x0},${y0} C ${x1},${y1} ${x2},${y2} ${xMid},${yMid} C ${x4},${y4} ${x5},${y5} ${x0},${yEnd} L ${x0},${y0} Z`;
  }

  // 6. ÓRBITA GRAVITACIONAL
  if (shape === 'orbit') {
    const y0 = actualTop;
    const y1 = relY(0.12);
    const y2 = relY(0.30);
    const yMid = relY(0.50);
    const y4 = relY(0.70);
    const y5 = relY(0.88);
    const yEnd = actualBottom;

    const x0 = edgeX;
    const x1 = getX(0.50);
    const x2 = getX(0.92);
    const xMid = apexX;
    const x4 = getX(0.92);
    const x5 = getX(0.50);

    return `M ${x0},${y0} C ${x1},${y1} ${x2},${y2} ${xMid},${yMid} C ${x4},${y4} ${x5},${y5} ${x0},${yEnd} L ${x0},${y0} Z`;
  }

  // 7. CYBER STEALTH
  if (shape === 'cyber') {
    const y0 = actualTop;
    const y1 = relY(0.14);
    const y2 = relY(0.28);
    const yMid = relY(0.50);
    const y4 = relY(0.72);
    const y5 = relY(0.86);
    const yEnd = actualBottom;

    const x0 = edgeX;
    const xEdgeCut = getX(0.45);
    const xMidCut = apexX;

    return `M ${x0},${y0} L ${xEdgeCut},${y1} L ${xMidCut},${y2} L ${xMidCut},${y4} L ${xEdgeCut},${y5} L ${x0},${yEnd} Z`;
  }

  // 8. CÁPSULA FLUTUANTE (Reaches 100% width apexX with superelliptic corners)
  const y0 = actualTop;
  const yEnd = actualBottom;
  const x0 = edgeX;
  const xInner = apexX;
  const radius = Math.min(38, Math.round(activeHeight * 0.08), Math.round(W * 0.1));

  if (isRight) {
    return `M ${x0},${y0} L ${xInner + radius},${y0} A ${radius},${radius} 0 0 0 ${xInner},${y0 + radius} L ${xInner},${yEnd - radius} A ${radius},${radius} 0 0 0 ${xInner + radius},${yEnd} L ${x0},${yEnd} Z`;
  } else {
    return `M ${x0},${y0} L ${xInner - radius},${y0} A ${radius},${radius} 0 0 1 ${xInner},${y0 + radius} L ${xInner},${yEnd - radius} A ${radius},${radius} 0 0 1 ${xInner - radius},${yEnd} L ${x0},${yEnd} Z`;
  }
}
