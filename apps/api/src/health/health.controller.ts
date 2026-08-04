// ============================================
// WHAT THIS FILE DOES (plain English):
// The "are you alive?" route. When something visits GET /health, the server
// replies with a small OK message. AWS App Runner pings this constantly; if it
// ever stops replying, App Runner knows to restart the server.
// ============================================
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'bridger-api',
      time: new Date().toISOString()
    };
  }
}
