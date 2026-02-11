import type { ColorPalette, GradientStop } from '../types.js';

export function generate_palette_from_hash(hash: string): ColorPalette {
  const bytes = hash_to_bytes(hash);

  const hue_base = bytes[0] !== undefined ? (bytes[0] / 255) * 360 : 180;
  const saturation = bytes[1] !== undefined ? 40 + (bytes[1] / 255) * 40 : 60;
  const lightness_base = bytes[2] !== undefined ? 30 + (bytes[2] / 255) * 30 : 50;

  const primary = hsl_to_hex(hue_base, saturation, lightness_base);
  const secondary = hsl_to_hex((hue_base + 120) % 360, saturation * 0.8, lightness_base + 10);
  const accent = hsl_to_hex((hue_base + 240) % 360, saturation + 10, lightness_base - 5);
  const background = hsl_to_hex(hue_base, saturation * 0.15, 8);

  const gradients = generate_gradients(hue_base, saturation, lightness_base, bytes);

  return {
    primary,
    secondary,
    accent,
    background,
    gradients,
    source_hash: hash,
  };
}

export function blend_colors(color_a: string, color_b: string, ratio: number): string {
  const a = hex_to_rgb(color_a);
  const b = hex_to_rgb(color_b);

  const r = Math.round(a.r + (b.r - a.r) * ratio);
  const g = Math.round(a.g + (b.g - a.g) * ratio);
  const bl = Math.round(a.b + (b.b - a.b) * ratio);

  return rgb_to_hex(r, g, bl);
}

export function adjust_opacity(hex: string, opacity: number): string {
  const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
  return `${hex}${alpha}`;
}

function generate_gradients(
  hue: number,
  saturation: number,
  lightness: number,
  bytes: number[],
): GradientStop[][] {
  const gradients: GradientStop[][] = [];

  const gradient_count = bytes[3] !== undefined ? 2 + (bytes[3] % 3) : 2;

  for (let i = 0; i < gradient_count; i++) {
    const byte_offset = 4 + i * 2;
    const hue_shift = bytes[byte_offset] !== undefined ? (bytes[byte_offset] / 255) * 60 - 30 : 0;
    const light_shift = bytes[byte_offset + 1] !== undefined ? (bytes[byte_offset + 1] / 255) * 20 - 10 : 0;

    const stops: GradientStop[] = [
      { offset: 0, color: hsl_to_hex((hue + hue_shift) % 360, saturation, lightness + light_shift) },
      { offset: 0.5, color: hsl_to_hex((hue + hue_shift + 30) % 360, saturation * 0.9, lightness) },
      { offset: 1, color: hsl_to_hex((hue + hue_shift + 60) % 360, saturation * 0.7, lightness - 10) },
    ];

    gradients.push(stops);
  }

  return gradients;
}

function hash_to_bytes(hash: string): number[] {
  const bytes: number[] = [];
  const clean = hash.replace(/[^a-fA-F0-9]/g, '');

  for (let i = 0; i < clean.length && bytes.length < 32; i += 2) {
    const hex_pair = clean.slice(i, i + 2);
    if (hex_pair.length === 2) {
      bytes.push(parseInt(hex_pair, 16));
    }
  }

  while (bytes.length < 32) {
    bytes.push(128);
  }

  return bytes;
}

function hsl_to_hex(h: number, s: number, l: number): string {
  const s_norm = s / 100;
  const l_norm = l / 100;
  const c = (1 - Math.abs(2 * l_norm - 1)) * s_norm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l_norm - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  return rgb_to_hex(
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  );
}

function rgb_to_hex(r: number, g: number, b: number): string {
  const to_hex = (n: number): string => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
  return `#${to_hex(r)}${to_hex(g)}${to_hex(b)}`;
}

function hex_to_rgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}
