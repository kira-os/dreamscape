import type { CompositionLayout, LayoutType } from '../types.js';

export function generate_layout(
  type: LayoutType,
  density: number,
  symmetry: number,
  width: number,
  height: number,
): CompositionLayout {
  const margin = Math.round(Math.min(width, height) * 0.05);

  return {
    type,
    density,
    symmetry,
    margin,
    focal_point: compute_focal_point(type, width, height),
  };
}

export function compute_positions(
  layout: CompositionLayout,
  count: number,
  width: number,
  height: number,
): Array<{ x: number; y: number }> {
  switch (layout.type) {
    case 'radial': return radial_positions(count, width, height, layout);
    case 'grid': return grid_positions(count, width, height, layout);
    case 'flow': return flow_positions(count, width, height, layout);
    case 'spiral': return spiral_positions(count, width, height, layout);
    case 'scatter': return scatter_positions(count, width, height, layout);
    case 'layered': return layered_positions(count, width, height, layout);
  }
}

function compute_focal_point(
  type: LayoutType,
  width: number,
  height: number,
): { x: number; y: number } {
  switch (type) {
    case 'radial':
    case 'spiral':
      return { x: width / 2, y: height / 2 };
    case 'flow':
      return { x: width * 0.3, y: height * 0.5 };
    case 'grid':
      return { x: width / 2, y: height / 2 };
    case 'scatter':
      return { x: width * 0.5, y: height * 0.4 };
    case 'layered':
      return { x: width / 2, y: height / 2 };
  }
}

function radial_positions(
  count: number,
  width: number,
  height: number,
  layout: CompositionLayout,
): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = [];
  const cx = layout.focal_point.x;
  const cy = layout.focal_point.y;
  const max_radius = Math.min(width, height) / 2 - layout.margin;
  const rings = Math.ceil(Math.sqrt(count));

  let placed = 0;
  for (let ring = 0; ring < rings && placed < count; ring++) {
    const radius = max_radius * ((ring + 1) / rings);
    const items_in_ring = Math.min(count - placed, Math.max(6, Math.round(ring * 6)));

    for (let i = 0; i < items_in_ring && placed < count; i++) {
      const angle = (Math.PI * 2 * i) / items_in_ring;
      positions.push({
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      });
      placed++;
    }
  }

  return positions;
}

function grid_positions(
  count: number,
  width: number,
  height: number,
  layout: CompositionLayout,
): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = [];
  const cols = Math.ceil(Math.sqrt(count * (width / height)));
  const rows = Math.ceil(count / cols);
  const cell_w = (width - layout.margin * 2) / cols;
  const cell_h = (height - layout.margin * 2) / rows;

  let placed = 0;
  for (let row = 0; row < rows && placed < count; row++) {
    for (let col = 0; col < cols && placed < count; col++) {
      positions.push({
        x: layout.margin + col * cell_w + cell_w / 2,
        y: layout.margin + row * cell_h + cell_h / 2,
      });
      placed++;
    }
  }

  return positions;
}

function flow_positions(
  count: number,
  width: number,
  height: number,
  layout: CompositionLayout,
): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = [];
  const amplitude = (height - layout.margin * 2) * 0.3;
  const frequency = 2 * Math.PI / width;

  for (let i = 0; i < count; i++) {
    const t = i / count;
    const x = layout.margin + t * (width - layout.margin * 2);
    const base_y = height / 2;
    const wave = amplitude * Math.sin(frequency * x * 2 + i * 0.3);
    positions.push({ x, y: base_y + wave });
  }

  return positions;
}

function spiral_positions(
  count: number,
  width: number,
  height: number,
  layout: CompositionLayout,
): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = [];
  const cx = layout.focal_point.x;
  const cy = layout.focal_point.y;
  const max_radius = Math.min(width, height) / 2 - layout.margin;
  const total_rotations = 3 + count / 20;

  for (let i = 0; i < count; i++) {
    const t = i / count;
    const angle = total_rotations * 2 * Math.PI * t;
    const radius = max_radius * t;
    positions.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  }

  return positions;
}

function scatter_positions(
  count: number,
  width: number,
  height: number,
  layout: CompositionLayout,
): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = [];
  const seed = layout.density * 1000;

  for (let i = 0; i < count; i++) {
    const hash = pseudo_random(seed + i);
    const hash2 = pseudo_random(seed + i + count);
    positions.push({
      x: layout.margin + hash * (width - layout.margin * 2),
      y: layout.margin + hash2 * (height - layout.margin * 2),
    });
  }

  return positions;
}

function layered_positions(
  count: number,
  width: number,
  height: number,
  layout: CompositionLayout,
): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = [];
  const layers = Math.max(3, Math.ceil(count / 10));
  const layer_height = (height - layout.margin * 2) / layers;

  let placed = 0;
  for (let layer = 0; layer < layers && placed < count; layer++) {
    const items_in_layer = Math.ceil(count / layers);
    const y = layout.margin + layer * layer_height + layer_height / 2;

    for (let i = 0; i < items_in_layer && placed < count; i++) {
      const t = (i + 0.5) / items_in_layer;
      positions.push({
        x: layout.margin + t * (width - layout.margin * 2),
        y,
      });
      placed++;
    }
  }

  return positions;
}

function pseudo_random(seed: number): number {
  let x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
  x = x - Math.floor(x);
  return x;
}
