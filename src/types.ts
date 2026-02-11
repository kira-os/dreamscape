export interface ArtPiece {
  id: string;
  title: string;
  description: string;
  source_type: SourceType;
  source_data: ChainDataInput;
  parameters: VisualParameters;
  svg_url: string;
  png_url: string;
  metadata: ArtMetadata;
  created_at: string;
}

export type SourceType = 'wallet' | 'block' | 'token' | 'transaction' | 'custom';

export interface ChainDataInput {
  wallet_address?: string;
  block_range?: { start: number; end: number };
  token_mint?: string;
  transaction_signatures?: string[];
  time_range?: { from: string; to: string };
}

export interface VisualParameters {
  palette: ColorPalette;
  shapes: ShapeConfig[];
  composition: CompositionLayout;
  style: ArtStyle;
  resolution: Resolution;
}

export type ArtStyle = 'geometric' | 'organic' | 'network' | 'fractal' | 'wave';

export interface Resolution {
  width: number;
  height: number;
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  gradients: GradientStop[][];
  source_hash: string;
}

export interface GradientStop {
  offset: number;
  color: string;
}

export interface ShapeConfig {
  type: ShapeType;
  count: number;
  min_size: number;
  max_size: number;
  opacity: number;
  rotation_range: number;
}

export type ShapeType = 'circle' | 'triangle' | 'square' | 'hexagon' | 'line' | 'arc' | 'dot';

export interface CompositionLayout {
  type: LayoutType;
  density: number;
  symmetry: number;
  margin: number;
  focal_point: { x: number; y: number };
}

export type LayoutType = 'radial' | 'grid' | 'flow' | 'spiral' | 'scatter' | 'layered';

export interface ArtMetadata {
  generation_time_ms: number;
  source_block_count: number;
  source_transaction_count: number;
  algorithm_version: string;
  seed: string;
}

export interface BlockData {
  slot: number;
  blockhash: string;
  parent_slot: number;
  transaction_count: number;
  timestamp: number | null;
}

export interface TransactionSummary {
  signature: string;
  slot: number;
  fee: number;
  accounts: string[];
  success: boolean;
}

export interface GalleryListing {
  id: string;
  title: string;
  source_type: SourceType;
  style: ArtStyle;
  svg_url: string;
  png_url: string;
  created_at: string;
}
