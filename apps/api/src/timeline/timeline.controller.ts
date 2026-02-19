import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TimelineService } from './timeline.service';
import { AuthGuard } from '../auth/auth.guard';
import { UserId } from '../auth/auth.decorator';
import { createTimelineItemSchema, updateTimelineItemSchema } from './dto/timeline.dto';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@Controller('timeline')
@UseGuards(AuthGuard)
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) {}

  @Get('insights')
  async getWeeklyInsights(@UserId() userId: string) {
    return this.timelineService.getWeeklyInsights(userId);
  }

  @Get()
  async getTimeline(
    @UserId() userId: string,
    @Query('date') date?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    if (start && end) {
      return this.timelineService.getTimelineRange(userId, start, end);
    }
    const d = date ?? new Date().toISOString().slice(0, 10);
    return this.timelineService.getTimeline(userId, d);
  }

  @Post('item')
  async createItem(
    @UserId() userId: string,
    @Body(new ZodValidationPipe(createTimelineItemSchema)) body: unknown,
  ) {
    return this.timelineService.createItem(userId, body as Parameters<TimelineService['createItem']>[1]);
  }

  @Patch('item/:id')
  async updateItem(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateTimelineItemSchema)) body: unknown,
  ) {
    return this.timelineService.updateItem(userId, id, body as Parameters<TimelineService['updateItem']>[2]);
  }
}
