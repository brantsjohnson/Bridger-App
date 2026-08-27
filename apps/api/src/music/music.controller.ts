// ============================================
// WHAT THIS FILE DOES (plain English):
// HTTP routes for linking Spotify or Apple Music, searching tracks, saving
// Listening picks, syncing top artists, and adding a song to Spotify library.
// Connect is NOT login — Bridger login stays Google / Sign in with Apple.
// ============================================
import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Post,
  Query,
  Res,
  UseGuards
} from '@nestjs/common';
import type { Response } from 'express';
import type { UpsertMusicPickBody } from '@bridger/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard, type AuthUser } from '../auth/auth.guard';
import { MusicService } from './music.service';

@Controller('music')
export class MusicController {
  constructor(private readonly music: MusicService) {}

  // --- Connected? (no secrets) ---
  @Get('status')
  @UseGuards(SupabaseAuthGuard)
  status(@CurrentUser() user: AuthUser) {
    return this.music.status(user.id);
  }

  // --- Start Spotify account link ---
  @Get('spotify/connect')
  @UseGuards(SupabaseAuthGuard)
  connect(@CurrentUser() user: AuthUser) {
    return this.music.beginSpotifyConnect(user.id);
  }

  // --- Spotify redirects here after the person approves ---
  // No auth guard: Spotify hits this in the browser; state maps to the user.
  @Get('spotify/callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response
  ) {
    const redirectTo = await this.music.handleSpotifyCallback(code, state, error);
    return res.redirect(redirectTo);
  }

  @Delete('spotify')
  @UseGuards(SupabaseAuthGuard)
  disconnect(@CurrentUser() user: AuthUser) {
    return this.music.disconnectSpotify(user.id);
  }

  // --- Start Apple Music account link (MusicKit page URL) ---
  @Get('apple/connect')
  @UseGuards(SupabaseAuthGuard)
  appleConnect(@CurrentUser() user: AuthUser) {
    return this.music.beginAppleConnect(user.id);
  }

  // --- MusicKit authorize page (browser; state maps to the Bridger user) ---
  @Get('apple/authorize')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async appleAuthorize(@Query('state') state: string | undefined) {
    return this.music.appleAuthorizePageHtml(state);
  }

  // --- MusicKit posts the music-user-token here; we store it and return a deep link ---
  @Post('apple/complete')
  async appleComplete(
    @Body() body: { state?: string; musicUserToken?: string }
  ) {
    const redirectTo = await this.music.completeAppleConnect(
      body?.state,
      body?.musicUserToken
    );
    return { redirectTo };
  }

  @Delete('apple')
  @UseGuards(SupabaseAuthGuard)
  disconnectApple(@CurrentUser() user: AuthUser) {
    return this.music.disconnectApple(user.id);
  }

  @Get('search')
  @UseGuards(SupabaseAuthGuard)
  search(
    @CurrentUser() user: AuthUser,
    @Query('q') q = '',
    @Query('type') type?: 'track' | 'album' | 'artist'
  ) {
    return this.music.search(user.id, q, type ?? 'track');
  }

  @Get('picks')
  @UseGuards(SupabaseAuthGuard)
  listPicks(
    @CurrentUser() user: AuthUser,
    @Query('ownerId') ownerId?: string
  ) {
    return this.music.listPicks(user.id, ownerId);
  }

  @Get('listening')
  @UseGuards(SupabaseAuthGuard)
  listening(
    @CurrentUser() user: AuthUser,
    @Query('ownerId') ownerId?: string
  ) {
    return this.music.getListeningNow(user.id, ownerId ?? user.id);
  }

  @Post('picks')
  @UseGuards(SupabaseAuthGuard)
  upsertPick(@CurrentUser() user: AuthUser, @Body() body: UpsertMusicPickBody) {
    return this.music.upsertPick(user.id, body);
  }

  @Post('sync-top-artists')
  @UseGuards(SupabaseAuthGuard)
  syncTop(@CurrentUser() user: AuthUser) {
    return this.music.syncTopArtists(user.id);
  }

  /** @deprecated Prefer POST /music/sync-top-artists (works for Spotify + Apple). */
  @Post('spotify/sync-top-artists')
  @UseGuards(SupabaseAuthGuard)
  syncTopSpotify(@CurrentUser() user: AuthUser) {
    return this.music.syncTopArtists(user.id);
  }

  @Get('me/top-artists')
  @UseGuards(SupabaseAuthGuard)
  topArtists(@CurrentUser() user: AuthUser) {
    return this.music.topArtists(user.id);
  }

  @Post('spotify/save')
  @UseGuards(SupabaseAuthGuard)
  save(
    @CurrentUser() user: AuthUser,
    @Body() body: { spotifyId: string; playlistId?: string }
  ) {
    return this.music.saveToLibrary(user.id, body);
  }
}
