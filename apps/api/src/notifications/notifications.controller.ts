import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '../auth/auth.guard';
import { UserId } from '../auth/auth.decorator';
import { registerTokenSchema } from './dto/notifications.dto';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('register-token')
  registerToken(
    @UserId() userId: string,
    @Body(new ZodValidationPipe(registerTokenSchema)) body: unknown,
  ) {
    const { expoPushToken } = body as { expoPushToken: string };
    return this.notificationsService.registerToken(userId, expoPushToken);
  }

  @Post('run-rules')
  runRules() {
    // Dev only - in production this would be guarded
    return this.notificationsService.runRules();
  }
}
