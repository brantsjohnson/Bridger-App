// ============================================
// WHAT THIS FILE DOES (plain English):
// Endpoints for app telemetry. Mobile posts 404 path trails here; the admin
// console reads the same rows through /admin/not-found-hits.
// ============================================
import { Body, Controller, Post } from '@nestjs/common';
import type { NotFoundReason } from '@bridger/shared';
import { TelemetryService } from './telemetry.service';

@Controller('telemetry')
export class TelemetryController {
  constructor(private readonly telemetry: TelemetryService) {}

  @Post('not-found')
  recordNotFound(
    @Body()
    body: {
      missingPath: string;
      pathTrail?: string[];
      reason?: NotFoundReason;
      platform?: string;
      appVersion?: string;
      sessionId?: string;
    }
  ) {
    return this.telemetry.recordNotFound({
      missingPath: body.missingPath,
      pathTrail: body.pathTrail ?? [],
      reason: body.reason,
      platform: body.platform,
      appVersion: body.appVersion,
      sessionId: body.sessionId
    });
  }
}
