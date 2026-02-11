import type {
  BlockData, TransactionSummary, VisualParameters, ArtStyle,
  ColorPalette, ShapeConfig, CompositionLayout, LayoutType,
} from '../types.js';
import { generate_palette_from_hash } from './color_engine.js';
import { generate_shapes } from './shape_engine.js';
import { generate_layout } from './composition_engine.js';

export function map_blocks_to_visuals(
  blocks: BlockData[],
  transactions: TransactionSummary[],
  style: ArtStyle,
  width: number,
  height: number,
): VisualParameters {
  const seed = derive_seed(blocks, transactions);
  const palette = derive_palette(blocks, seed);
  const shapes = derive_shapes(blocks, transactions, style);
  const composition = derive_composition(blocks, transactions, style, width, height);

  return {
    palette,
    shapes,
    composition,
    style,
    resolution: { width, height },
  };
}

function derive_seed(blocks: BlockData[], transactions: TransactionSummary[]): string {
  if (blocks.length > 0) {
    const first_block = blocks[0];
    if (first_block !== undefined) {
      return first_block.blockhash;
    }
  }

  if (transactions.length > 0) {
    const first_tx = transactions[0];
    if (first_tx !== undefined) {
      return first_tx.signature;
    }
  }

  return Date.now().toString(16);
}

function derive_palette(blocks: BlockData[], seed: string): ColorPalette {
  const hash = blocks.length > 0 && blocks[0] !== undefined
    ? blocks[0].blockhash
    : seed;
  return generate_palette_from_hash(hash);
}

function derive_shapes(
  blocks: BlockData[],
  transactions: TransactionSummary[],
  style: ArtStyle,
): ShapeConfig[] {
  const total_txs = blocks.reduce((sum, b) => sum + b.transaction_count, 0) + transactions.length;
  const density = Math.min(1, total_txs / 500);

  return generate_shapes(style, density);
}

function derive_composition(
  blocks: BlockData[],
  transactions: TransactionSummary[],
  style: ArtStyle,
  width: number,
  height: number,
): CompositionLayout {
  const layout_type = style_to_layout(style);
  const total_items = blocks.length + transactions.length;
  const density = Math.min(1, total_items / 100);

  const success_count = transactions.filter((t) => t.success).length;
  const symmetry = transactions.length > 0
    ? success_count / transactions.length
    : 0.5;

  return generate_layout(layout_type, density, symmetry, width, height);
}

function style_to_layout(style: ArtStyle): LayoutType {
  switch (style) {
    case 'geometric': return 'grid';
    case 'organic': return 'flow';
    case 'network': return 'scatter';
    case 'fractal': return 'spiral';
    case 'wave': return 'layered';
  }
}
