import { Controller, Get, Post, Patch, Body, UseGuards } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { AuthGuard } from '../auth/auth.guard';
import { UserId } from '../auth/auth.decorator';
import { saveStepSchema, completeSchema } from './dto/onboarding.dto';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@Controller('onboarding')
@UseGuards(AuthGuard)
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Get('status')
  async getStatus(@UserId() userId: string) {
    return this.onboarding.getStatus(userId);
  }

  @Post('save-step')
  async saveStep(
    @UserId() userId: string,
    @Body(new ZodValidationPipe(saveStepSchema)) body: { step: number; payload: Record<string, unknown> },
  ) {
    await this.onboarding.saveStep(userId, body.step, body.payload);
    return { ok: true };
  }

  @Post('complete')
  async complete(
    @UserId() userId: string,
    @Body(new ZodValidationPipe(completeSchema)) body: { triggerWow?: boolean },
  ) {
    return this.onboarding.complete(userId, body.triggerWow ?? false);
  }

  @Get('data')
  async getData(@UserId() userId: string) {
    return this.onboarding.getAggregatedOnboarding(userId);
  }

  @Post('reset')
  async reset(@UserId() userId: string) {
    await this.onboarding.reset(userId);
    return { ok: true };
  }

  @Patch('preferences')
  async updatePreferences(
    @UserId() userId: string,
    @Body() body: Record<string, unknown>,
  ) {
    await this.onboarding.updatePreferences(userId, body);
    return { ok: true };
  }
}

