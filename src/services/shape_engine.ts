import type { ShapeConfig, ShapeType, ArtStyle } from '../types.js';

interface ShapePreset {
  types: ShapeType[];
  base_count: number;
  size_range: [number, number];
  opacity_range: [number, number];
}

const STYLE_PRESETS: Record<ArtStyle, ShapePreset> = {
  geometric: {
    types: ['triangle', 'square', 'hexagon'],
    base_count: 30,
    size_range: [20, 120],
    opacity_range: [0.3, 0.9],
  },
  organic: {
    types: ['circle', 'arc', 'dot'],
    base_count: 50,
    size_range: [10, 80],
    opacity_range: [0.2, 0.7],
  },
  network: {
    types: ['dot', 'line', 'circle'],
    base_count: 80,
    size_range: [3, 30],
    opacity_range: [0.3, 0.8],
  },
  fractal: {
    types: ['triangle', 'circle', 'hexagon'],
    base_count: 60,
    size_range: [5, 100],
    opacity_range: [0.1, 0.6],
  },
  wave: {
    types: ['arc', 'line', 'circle'],
    base_count: 40,
    size_range: [15, 150],
    opacity_range: [0.2, 0.8],
  },
};

export function generate_shapes(style: ArtStyle, density: number): ShapeConfig[] {
  const preset = STYLE_PRESETS[style];
  const configs: ShapeConfig[] = [];

  for (const shape_type of preset.types) {
    const count = Math.max(3, Math.round(preset.base_count * density / preset.types.length));
    const min_opacity = preset.opacity_range[0];
    const max_opacity = preset.opacity_range[1];
    const opacity = min_opacity + (max_opacity - min_opacity) * density;

    configs.push({
      type: shape_type,
      count,
      min_size: preset.size_range[0],
      max_size: preset.size_range[1],
      opacity,
      rotation_range: shape_type === 'circle' || shape_type === 'dot' ? 0 : 360,
    });
  }

  return configs;
}

export function render_shape_svg(
  shape_type: ShapeType,
  x: number,
  y: number,
  size: number,
  color: string,
  opacity: number,
  rotation: number,
): string {
  const transform = rotation !== 0
    ? ` transform="rotate(${rotation} ${x} ${y})"`
    : '';

  switch (shape_type) {
    case 'circle':
      return `<circle cx="${x}" cy="${y}" r="${size / 2}" fill="${color}" opacity="${opacity}"${transform}/>`;

    case 'dot':
      return `<circle cx="${x}" cy="${y}" r="${Math.max(1, size / 6)}" fill="${color}" opacity="${opacity}"/>`;

    case 'square':
      return `<rect x="${x - size / 2}" y="${y - size / 2}" width="${size}" height="${size}" fill="${color}" opacity="${opacity}"${transform}/>`;

    case 'triangle': {
      const h = size * 0.866;
      const points = `${x},${y - h / 2} ${x - size / 2},${y + h / 2} ${x + size / 2},${y + h / 2}`;
      return `<polygon points="${points}" fill="${color}" opacity="${opacity}"${transform}/>`;
    }

    case 'hexagon': {
      const points = hexagon_points(x, y, size / 2);
      return `<polygon points="${points}" fill="${color}" opacity="${opacity}"${transform}/>`;
    }

    case 'line':
      return `<line x1="${x - size / 2}" y1="${y}" x2="${x + size / 2}" y2="${y}" stroke="${color}" stroke-width="2" opacity="${opacity}"${transform}/>`;

    case 'arc': {
      const r = size / 2;
      return `<path d="M ${x - r} ${y} A ${r} ${r} 0 0 1 ${x + r} ${y}" fill="none" stroke="${color}" stroke-width="2" opacity="${opacity}"${transform}/>`;
    }
  }
}

function hexagon_points(cx: number, cy: number, r: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const px = cx + r * Math.cos(angle);
    const py = cy + r * Math.sin(angle);
    points.push(`${px.toFixed(2)},${py.toFixed(2)}`);
  }
  return points.join(' ');
}
