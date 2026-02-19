import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { AuthGuard } from '../auth/auth.guard';
import { UserId } from '../auth/auth.decorator';
import { createSubscriptionSchema, updateSubscriptionSchema } from './dto/subscriptions.dto';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@Controller('subscriptions')
@UseGuards(AuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  create(
    @UserId() userId: string,
    @Body(new ZodValidationPipe(createSubscriptionSchema)) body: unknown,
  ) {
    return this.subscriptionsService.create(userId, body as Parameters<SubscriptionsService['create']>[1]);
  }

  @Get()
  getList(
    @UserId() userId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('date') date?: string,
  ) {
    return this.subscriptionsService.getList(userId, start, end, date);
  }

  @Get(':id')
  getOne(@UserId() userId: string, @Param('id') id: string) {
    return this.subscriptionsService.getOne(userId, id);
  }

  @Patch(':id')
  update(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateSubscriptionSchema)) body: unknown,
  ) {
    return this.subscriptionsService.update(userId, id, body as Parameters<SubscriptionsService['update']>[2]);
  }
}
