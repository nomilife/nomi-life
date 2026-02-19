import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator';

@Controller('health')
export class HealthController {
  @Get()
  @Public()
  check() {
    return { ok: true, timestamp: new Date().toISOString() };
  }
}
