// ============================================
// WHAT THIS FILE DOES (plain English):
// Saves and loads co-op Greatest hits photos (up to 3 Bridger-hosted slots).
// Each slot has a placement index and an optional "sit after this section"
// tip. Reads respect tier visibility; writes require co-op (enforced by the
// route guard). Deleting a slot also deletes its media row when we own it.
// ============================================
import {
  BadRequestException,
  Injectable
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PhotoBlock, Tier } from '@bridger/shared';
import { MOVABLE_MODULE_ORDER } from '@bridger/shared';
import { SupabaseService } from '../supabase/supabase.service';

const TIER_RANK: Record<Tier, number> = {
  none: 0,
  acquaintance: 1,
  friend: 2,
  close: 3
};

const ALLOWED_AFTER = new Set<string>(MOVABLE_MODULE_ORDER);

type HitRow = {
  id: string;
  owner_id: string;
  media_id: string;
  placement_index: number;
  after_module: string | null;
  visible_to_tier: string;
};

@Injectable()
export class GreatestHitsService {
  private readonly mediaBucket: string;
  private readonly signedUrlTtl = 60 * 60;

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService
  ) {
    this.mediaBucket =
      this.config.get<string>('SUPABASE_MEDIA_BUCKET') ?? 'media';
  }

  // THIS SECTION DOES: turn a DB row into the app PhotoBlock (with signed URL).
  private async toDto(row: HitRow): Promise<PhotoBlock> {
    const { data: media } = await this.supabase.admin
      .from('media')
      .select('storage_path')
      .eq('id', row.media_id)
      .maybeSingle();

    let url: string | undefined;
    if (media?.storage_path) {
      const { data } = await this.supabase.admin.storage
        .from(this.mediaBucket)
        .createSignedUrl(media.storage_path, this.signedUrlTtl);
      url = data?.signedUrl ?? undefined;
    }

    return {
      id: row.id,
      assetId: row.media_id,
      url,
      afterModule: row.after_module ?? undefined,
      order: row.placement_index,
      visibleToTier: row.visible_to_tier as Tier
    };
  }

  // THIS SECTION DOES: list the owner's slots (no tier filter; owner sees all).
  async listMine(ownerId: string): Promise<PhotoBlock[]> {
    const { data, error } = await this.supabase.admin
      .from('profile_greatest_hits')
      .select(
        'id, owner_id, media_id, placement_index, after_module, visible_to_tier'
      )
      .eq('owner_id', ownerId)
      .order('placement_index', { ascending: true });
    if (error) throw error;
    const out: PhotoBlock[] = [];
    for (const row of data ?? []) {
      out.push(await this.toDto(row as HitRow));
    }
    return out;
  }

  /**
   * PRIVACY: only return slots the viewer's tier may see.
   * Self always sees all.
   */
  async listForViewer(
    ownerId: string,
    viewerId: string,
    viewerTier: Tier
  ): Promise<PhotoBlock[]> {
    const isSelf = ownerId === viewerId;
    const { data, error } = await this.supabase.admin
      .from('profile_greatest_hits')
      .select(
        'id, owner_id, media_id, placement_index, after_module, visible_to_tier'
      )
      .eq('owner_id', ownerId)
      .order('placement_index', { ascending: true });
    if (error) throw error;

    const rank = TIER_RANK[viewerTier];
    const visible = (data ?? []).filter((row) => {
      if (isSelf) return true;
      const need = row.visible_to_tier as Tier;
      return need !== 'none' && rank >= TIER_RANK[need];
    });

    const out: PhotoBlock[] = [];
    for (const row of visible) {
      out.push(await this.toDto(row as HitRow));
    }
    return out;
  }

  /**
   * Replace all slots in one write (max 3). Co-op gate is on the route.
   * SECURITY: media must belong to this user and be photos.
   */
  async replaceMine(
    ownerId: string,
    slots: Array<{
      mediaId: string;
      placementIndex: number;
      afterModule?: string | null;
      visibleToTier?: Tier;
    }>
  ): Promise<PhotoBlock[]> {
    if (!Array.isArray(slots)) {
      throw new BadRequestException('slots must be an array');
    }
    if (slots.length > 3) {
      throw new BadRequestException('At most 3 Greatest hits photos');
    }

    const indices = new Set<number>();
    for (const s of slots) {
      const idx = Number(s.placementIndex);
      if (!Number.isInteger(idx) || idx < 0 || idx > 2) {
        throw new BadRequestException('placementIndex must be 0, 1, or 2');
      }
      if (indices.has(idx)) {
        throw new BadRequestException('Duplicate placementIndex');
      }
      indices.add(idx);
      if (s.afterModule && !ALLOWED_AFTER.has(s.afterModule)) {
        throw new BadRequestException('Unknown afterModule');
      }
      if (!s.mediaId || typeof s.mediaId !== 'string') {
        throw new BadRequestException('mediaId is required');
      }
    }

    // SECURITY: every media row must be owned by this user and be a photo.
    for (const s of slots) {
      const { data: media } = await this.supabase.admin
        .from('media')
        .select('id, owner_id, kind')
        .eq('id', s.mediaId)
        .maybeSingle();
      if (!media || media.owner_id !== ownerId) {
        throw new BadRequestException('Photo must be Bridger-hosted by you');
      }
      if (media.kind !== 'photo') {
        throw new BadRequestException('Greatest hits only accept photos');
      }
    }

    // Load old rows so we can delete orphaned media after replace.
    const { data: previous } = await this.supabase.admin
      .from('profile_greatest_hits')
      .select('id, media_id')
      .eq('owner_id', ownerId);
    const keepMedia = new Set(slots.map((s) => s.mediaId));
    const orphanMedia = (previous ?? [])
      .map((r) => r.media_id)
      .filter((id) => !keepMedia.has(id));

    const { error: delErr } = await this.supabase.admin
      .from('profile_greatest_hits')
      .delete()
      .eq('owner_id', ownerId);
    if (delErr) throw delErr;

    if (slots.length > 0) {
      const { error: insErr } = await this.supabase.admin
        .from('profile_greatest_hits')
        .insert(
          slots.map((s) => ({
            owner_id: ownerId,
            media_id: s.mediaId,
            placement_index: Number(s.placementIndex),
            after_module: s.afterModule ?? null,
            visible_to_tier: s.visibleToTier ?? 'friend'
          }))
        );
      if (insErr) throw insErr;
    }

    // Hard-delete media that is no longer referenced by a hit.
    for (const mediaId of orphanMedia) {
      await this.supabase.admin.from('media').delete().eq('id', mediaId).eq('owner_id', ownerId);
    }

    return this.listMine(ownerId);
  }

  // THIS SECTION DOES: remove one slot and its media (hard delete).
  async removeMine(ownerId: string, hitId: string): Promise<void> {
    const { data: row } = await this.supabase.admin
      .from('profile_greatest_hits')
      .select('id, media_id')
      .eq('id', hitId)
      .eq('owner_id', ownerId)
      .maybeSingle();
    if (!row) return;

    const { error } = await this.supabase.admin
      .from('profile_greatest_hits')
      .delete()
      .eq('id', hitId)
      .eq('owner_id', ownerId);
    if (error) throw error;

    await this.supabase.admin
      .from('media')
      .delete()
      .eq('id', row.media_id)
      .eq('owner_id', ownerId);
  }
}
