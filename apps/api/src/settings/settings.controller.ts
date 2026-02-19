import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { AuthGuard } from '../auth/auth.guard';
import { UserId } from '../auth/auth.decorator';
import {
  updateSettingsSchema,
  updateNotificationRuleSchema,
} from './dto/settings.dto';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@Controller('settings')
@UseGuards(AuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getSettings(@UserId() userId: string) {
    return this.settingsService.getSettings(userId);
  }

  @Patch()
  updateSettings(
    @UserId() userId: string,
    @Body(new ZodValidationPipe(updateSettingsSchema)) body: unknown,
  ) {
    return this.settingsService.updateSettings(
      userId,
      body as Parameters<SettingsService['updateSettings']>[1],
    );
  }

  @Get('notification-rules')
  getNotificationRules(@UserId() userId: string) {
    return this.settingsService.getNotificationRules(userId);
  }

  @Patch('notification-rules/:id')
  updateNotificationRule(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateNotificationRuleSchema)) body: unknown,
  ) {
    return this.settingsService.updateNotificationRule(
      userId,
      id,
      body as Parameters<SettingsService['updateNotificationRule']>[2],
    );
  }
}
