// ============================================
// WHAT THIS FILE DOES (plain English):
// The web address the phone calls to turn a profile photo into a stylized look.
// You must be signed in. You send the id of a photo you already uploaded plus
// which look you want; you get back the new filtered picture's id and a preview
// link. Server-rendered looks today: pop_art, comic, x_ray, and sepia.
// ============================================
import { Body, Controller, Post, UseGuards, BadRequestException } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard, type AuthUser } from '../auth/auth.guard';
import {
  PhotoFiltersService,
  type ServerPhotoFilter
} from './photo-filters.service';

@Controller('photo-filters')
@UseGuards(SupabaseAuthGuard)
export class PhotoFiltersController {
  constructor(private readonly filters: PhotoFiltersService) {}

  // THIS SECTION DOES: apply a look to a photo the caller owns.
  @Post('apply')
  apply(
    @CurrentUser() user: AuthUser,
    @Body() body: { mediaId?: string; filter?: ServerPhotoFilter }
  ) {
    // THIS SECTION DOES: make sure the request has the two things we need.
    if (!body?.mediaId || typeof body.mediaId !== 'string') {
      throw new BadRequestException('mediaId is required');
    }
    if (
      body.filter !== 'pop_art' &&
      body.filter !== 'comic' &&
      body.filter !== 'x_ray' &&
      body.filter !== 'sepia'
    ) {
      throw new BadRequestException('Unsupported filter');
    }
    return this.filters.apply(user.id, body.mediaId, body.filter);
  }
}
