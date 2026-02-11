export class DreamscapeError extends Error {
  public readonly status_code: number;

  constructor(message: string, status_code: number) {
    super(message);
    this.name = 'DreamscapeError';
    this.status_code = status_code;
  }
}

export class ChainReadError extends DreamscapeError {
  public readonly source: string;

  constructor(source: string, reason: string) {
    super(`Failed to read chain data for ${source}: ${reason}`, 503);
    this.name = 'ChainReadError';
    this.source = source;
  }
}

export class RenderError extends DreamscapeError {
  public readonly stage: string;

  constructor(stage: string, reason: string) {
    super(`Render failed at ${stage}: ${reason}`, 500);
    this.name = 'RenderError';
    this.stage = stage;
  }
}

export class GalleryError extends DreamscapeError {
  constructor(reason: string) {
    super(`Gallery error: ${reason}`, 500);
    this.name = 'GalleryError';
  }
}

export class PieceNotFoundError extends DreamscapeError {
  public readonly piece_id: string;

  constructor(piece_id: string) {
    super(`Art piece not found: ${piece_id}`, 404);
    this.name = 'PieceNotFoundError';
    this.piece_id = piece_id;
  }
}

export class InvalidInputError extends DreamscapeError {
  constructor(reason: string) {
    super(`Invalid input: ${reason}`, 400);
    this.name = 'InvalidInputError';
  }
}

export class DatabaseError extends DreamscapeError {
  constructor(operation: string, reason: string) {
    super(`Database error during ${operation}: ${reason}`, 500);
    this.name = 'DatabaseError';
  }
}
