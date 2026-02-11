import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { config } from '../config.js';
import { logger } from '../lib/logger.js';
import { RenderError } from '../errors.js';
import { render_shape_svg } from './shape_engine.js';
import { compute_positions } from './composition_engine.js';
import { blend_colors, adjust_opacity } from './color_engine.js';
import type { VisualParameters, GradientStop } from '../types.js';

export async function render_to_svg(params: VisualParameters, id: string): Promise<string> {
  try {
    const svg = build_svg(params);
    const dir = join(config.GALLERY_PATH, id);
    await mkdir(dir, { recursive: true });

    const svg_path = join(dir, 'artwork.svg');
    await writeFile(svg_path, svg, 'utf-8');

    const relative_path = `${id}/artwork.svg`;
    logger.debug({ id, path: relative_path }, 'SVG rendered');
    return `${config.BASE_URL}/gallery/${relative_path}`;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw new RenderError('svg', message);
  }
}

export async function render_to_png(params: VisualParameters, id: string): Promise<string> {
  try {
    const svg = build_svg(params);
    const dir = join(config.GALLERY_PATH, id);
    await mkdir(dir, { recursive: true });

    const png_path = join(dir, 'artwork.png');
    await sharp(Buffer.from(svg))
      .resize(params.resolution.width, params.resolution.height)
      .png({ quality: 90 })
      .toFile(png_path);

    const relative_path = `${id}/artwork.png`;
    logger.debug({ id, path: relative_path }, 'PNG rendered');
    return `${config.BASE_URL}/gallery/${relative_path}`;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw new RenderError('png', message);
  }
}

function build_svg(params: VisualParameters): string {
  const { palette, shapes, composition, resolution } = params;
  const w = resolution.width;
  const h = resolution.height;

  const parts: string[] = [];

  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">`);
  parts.push('<defs>');
  parts.push(build_gradient_defs(palette.gradients));
  parts.push('</defs>');

  parts.push(`<rect width="${w}" height="${h}" fill="${palette.background}"/>`);

  if (palette.gradients.length > 0) {
    parts.push(`<rect width="${w}" height="${h}" fill="url(#gradient-0)" opacity="0.3"/>`);
  }

  for (const shape_config of shapes) {
    const positions = compute_positions(composition, shape_config.count, w, h);
    const colors = [palette.primary, palette.secondary, palette.accent];

    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      if (pos === undefined) continue;

      const color_index = i % colors.length;
      const color = colors[color_index];
      if (color === undefined) continue;

      const t = i / positions.length;
      const size = shape_config.min_size + t * (shape_config.max_size - shape_config.min_size);
      const rotation = shape_config.rotation_range > 0
        ? (t * shape_config.rotation_range) % 360
        : 0;

      const blended = blend_colors(color, palette.secondary, t * 0.3);
      parts.push(render_shape_svg(
        shape_config.type,
        pos.x,
        pos.y,
        size,
        blended,
        shape_config.opacity * (0.5 + t * 0.5),
        rotation,
      ));
    }
  }

  parts.push('</svg>');
  return parts.join('\n');
}

function build_gradient_defs(gradients: GradientStop[][]): string {
  const defs: string[] = [];

  for (let i = 0; i < gradients.length; i++) {
    const stops = gradients[i];
    if (stops === undefined) continue;

    defs.push(`<linearGradient id="gradient-${i}" x1="0%" y1="0%" x2="100%" y2="100%">`);
    for (const stop of stops) {
      defs.push(`<stop offset="${stop.offset * 100}%" stop-color="${stop.color}"/>`);
    }
    defs.push('</linearGradient>');
  }

  return defs.join('\n');
}
