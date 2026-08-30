// ============================================
// WHAT THIS FILE DOES (plain English):
// Turns a profile photo into a stylized "look" on the server. Today that is
// **Pop art** (bold saturated poster tones for a round avatar), **Comic**
// (cartoon outlines + flat colors), **X-ray** (inverted ghostly scan), and
// **Sepia** (warm vintage tone with punchy contrast). The phone uploads the
// normal photo first; this service reads it, runs ImageMagick, saves the
// finished picture back to storage, and hands back the new picture's id plus a
// short-lived preview link. The original media row stays on file.
//
// WHY ON THE SERVER: these looks need image operations our phone library cannot
// do on-device (edge detection, posterizing, invert + tone remap), so we do
// them here with ImageMagick inside our own container. Pop art also bakes here
// so the filtered face is one JPEG every Avatar can show fast (no live recolor).
//
// PRIVACY: we only ever touch a photo the signed-in person already owns (we check
// ownership on the `media` row). The picture is never sent to any AI model. The
// new file lands under the same user's folder in the private media bucket, and we
// only return a signed link that expires.
// ============================================
import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';

const execFileAsync = promisify(execFile);

/** Looks rendered on the server (all four profile-photo looks). */
export type ServerPhotoFilter = 'pop_art' | 'comic' | 'x_ray' | 'sepia';

const SERVER_FILTERS = new Set<ServerPhotoFilter>([
  'pop_art',
  'comic',
  'x_ray',
  'sepia'
]);

/** Bold posterized bands (reference tuner: Color Levels 4). */
const COMIC_COLOR_LEVELS = 4;
/** Pre-blur before Canny so skin texture does not become black speckles. */
const COMIC_EDGE_BLUR = '0x1.0';
/** Strong contours only; higher % = lighter ink (fewer/shallower lines). */
const COMIC_CANNY_THRESHOLDS = '0x1+20%+44%';
/** Thin ink strokes (was 1.5 — too heavy on faces). */
const COMIC_INK_DILATE = 'Disk:1.0';

/** Wire shape the phone gets back after a filter runs. */
export type AppliedFilterResult = {
  /** The new `media` row id for the filtered picture. */
  mediaId: string;
  /** A short-lived link to preview the filtered picture. */
  url: string;
};

@Injectable()
export class PhotoFiltersService {
  private readonly mediaBucket: string;
  private readonly signedUrlTtl = 60 * 60;
  // THIS SECTION DOES: which ImageMagick command name to use, worked out once and
  // remembered. IM7 uses `magick`; older IM6 (Debian) uses `convert`.
  private magickBin: string | null = null;

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService
  ) {
    this.mediaBucket =
      this.config.get<string>('SUPABASE_MEDIA_BUCKET') ?? 'media';
  }

  /**
   * Apply a server-side look to a photo the user owns, and return the new picture.
   */
  async apply(
    userId: string,
    mediaId: string,
    filter: ServerPhotoFilter
  ): Promise<AppliedFilterResult> {
    if (!SERVER_FILTERS.has(filter)) {
      throw new BadRequestException('Unsupported filter');
    }

    // THIS SECTION DOES: find the photo and make sure it belongs to this person.
    const { data: media, error } = await this.supabase.admin
      .from('media')
      .select('id, owner_id, storage_path, kind')
      .eq('id', mediaId)
      .single();
    if (error || !media) throw new NotFoundException('Photo not found');
    if (media.owner_id !== userId) {
      throw new NotFoundException('Photo not found');
    }
    if (media.kind !== 'photo') {
      throw new BadRequestException('Only photos can be filtered');
    }

    // THIS SECTION DOES: pull the original bytes down from private storage.
    const { data: blob, error: dlErr } = await this.supabase.admin.storage
      .from(this.mediaBucket)
      .download(media.storage_path);
    if (dlErr || !blob) {
      throw new InternalServerErrorException('Could not read the photo');
    }
    const inputBytes = Buffer.from(await blob.arrayBuffer());

    // THIS SECTION DOES: run the look in a throwaway temp folder, then clean up.
    const workDir = await mkdtemp(join(tmpdir(), 'bridger-filter-'));
    const inputPath = join(workDir, 'in');
    const outputPath = join(workDir, `${randomUUID()}.jpg`);
    try {
      await writeFile(inputPath, inputBytes);
      if (filter === 'pop_art') {
        await this.runPopArt(inputPath, outputPath);
      } else if (filter === 'comic') {
        await this.runComic(inputPath, outputPath);
      } else if (filter === 'x_ray') {
        await this.runXRay(inputPath, outputPath);
      } else {
        await this.runSepia(inputPath, outputPath);
      }
      const outputBytes = await readFile(outputPath);
      return this.saveFilteredPhoto(userId, filter, outputBytes);
    } finally {
      await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }

  // THIS SECTION DOES: upload the finished picture, record the media row, sign a link.
  private async saveFilteredPhoto(
    userId: string,
    filter: ServerPhotoFilter,
    outputBytes: Buffer
  ): Promise<AppliedFilterResult> {
    const storagePath = `${userId}/avatar/${filter}-${Date.now()}.jpg`;
    const { error: upErr } = await this.supabase.admin.storage
      .from(this.mediaBucket)
      .upload(storagePath, outputBytes, {
        contentType: 'image/jpeg',
        upsert: true
      });
    if (upErr) {
      throw new InternalServerErrorException('Could not save the filtered photo');
    }

    const { data: newMedia, error: insErr } = await this.supabase.admin
      .from('media')
      .insert({ owner_id: userId, storage_path: storagePath, kind: 'photo' })
      .select('id')
      .single();
    if (insErr || !newMedia) {
      throw new InternalServerErrorException('Could not record the filtered photo');
    }

    const { data: signed } = await this.supabase.admin.storage
      .from(this.mediaBucket)
      .createSignedUrl(storagePath, this.signedUrlTtl);

    return { mediaId: newMedia.id, url: signed?.signedUrl ?? '' };
  }

  /**
   * The pop-art recipe (plain English): punch the saturation and contrast, then
   * squash colors into flat poster bands so a round avatar reads as bold pop.
   * This is one tile (not the on-device 4-tile Warhol grid), because a circle
   * cannot show a grid cleanly.
   */
  private async runPopArt(inputPath: string, outputPath: string): Promise<void> {
    const args = [
      inputPath,
      '-resize',
      '1000x1000>',
      '-modulate',
      '105,180,100',
      '-contrast-stretch',
      '2%x2%',
      '+dither',
      '-posterize',
      '5',
      '-quality',
      '90',
      outputPath
    ];
    await this.runMagick(args);
  }

  /**
   * The comic recipe (plain English): boost green saturation, squash colors into
   * 4 flat posterized bands, find strong edges on a blurred copy (not skin
   * noise), thicken them into ink, and multiply those black lines on top.
   */
  private async runComic(inputPath: string, outputPath: string): Promise<void> {
    const args = [
      inputPath,
      '-resize',
      '1000x1000>',
      '(',
      '-clone',
      '0',
      '-modulate',
      '103,150',
      '-statistic',
      'Median',
      '5x5',
      '+dither',
      '-posterize',
      String(COMIC_COLOR_LEVELS),
      '-statistic',
      'Median',
      '3x3',
      ')',
      '(',
      '-clone',
      '0',
      '-blur',
      COMIC_EDGE_BLUR,
      '-colorspace',
      'Gray',
      '-canny',
      COMIC_CANNY_THRESHOLDS,
      '-morphology',
      'Dilate',
      COMIC_INK_DILATE,
      '-blur',
      '0x0.35',
      '-negate',
      ')',
      '-delete',
      '0',
      '-compose',
      'Multiply',
      '-composite',
      '-quality',
      '90',
      outputPath
    ];
    await this.runMagick(args);
  }

  /**
   * The X-ray recipe (plain English): flip light and dark like a film negative,
   * drain the color to a ghostly scan, stretch the contrast so bones and edges
   * pop, then add a faint cyan glow so it reads as neon X-ray instead of plain
   * black and white.
   *
   * Matches the core steps from renan-siqueira/python-x-ray-effect-tool:
   * invert -> grayscale -> autocontrast, plus a light blue tint for the product
   * look described in onboarding.
   */
  private async runXRay(inputPath: string, outputPath: string): Promise<void> {
    const args = [
      inputPath,
      '-resize',
      '1000x1000>',
      '-negate',
      '-colorspace',
      'Gray',
      '-auto-level',
      '-fill',
      '#66eeff',
      '-tint',
      '20%',
      '-quality',
      '90',
      outputPath
    ];
    await this.runMagick(args);
  }

  /**
   * The sepia recipe (plain English): turn the photo into black-and-white first,
   * stretch the tones, then wash it in warm brown so it looks like old film —
   * reddish-brown monochrome, never blue or cold gray.
   */
  private async runSepia(inputPath: string, outputPath: string): Promise<void> {
    const args = [
      inputPath,
      '-resize',
      '1000x1000>',
      '-colorspace',
      'Gray',
      '-auto-level',
      '-fill',
      '#8B5A2B',
      '-tint',
      '44%',
      '-quality',
      '90',
      outputPath
    ];
    await this.runMagick(args);
  }

  /**
   * Runs ImageMagick with the given arguments (no shell, so nothing can be
   * injected). Prefers the IM7 `magick` command, falls back to IM6 `convert`.
   */
  private async runMagick(args: string[]): Promise<void> {
    const candidates = this.magickBin
      ? [this.magickBin]
      : [this.config.get<string>('IMAGEMAGICK_BIN') ?? 'magick', 'convert'];

    let lastError: unknown = null;
    for (const bin of candidates) {
      if (!bin) continue;
      try {
        await execFileAsync(bin, args, {
          timeout: 25000,
          maxBuffer: 1024 * 1024 * 64
        });
        this.magickBin = bin;
        return;
      } catch (err) {
        if ((err as NodeJS.ErrnoException)?.code === 'ENOENT') {
          lastError = err;
          continue;
        }
        throw new InternalServerErrorException('Filter processing failed');
      }
    }
    throw new InternalServerErrorException(
      lastError ? 'ImageMagick is not available' : 'Filter processing failed'
    );
  }

  /** True when an ImageMagick binary can be found (used by the admin health page). */
  async isAvailable(): Promise<boolean> {
    const candidates = [
      this.config.get<string>('IMAGEMAGICK_BIN') ?? 'magick',
      'convert'
    ];
    for (const bin of candidates) {
      try {
        await execFileAsync(bin, ['-version'], { timeout: 5000 });
        this.magickBin = bin;
        return true;
      } catch {
        continue;
      }
    }
    return false;
  }
}
