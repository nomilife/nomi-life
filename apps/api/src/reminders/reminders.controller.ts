import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { AuthGuard } from '../auth/auth.guard';
import { UserId } from '../auth/auth.decorator';
import { createReminderSchema, updateReminderSchema } from './dto/reminders.dto';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@Controller('reminders')
@UseGuards(AuthGuard)
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post()
  create(
    @UserId() userId: string,
    @Body(new ZodValidationPipe(createReminderSchema)) body: unknown,
  ) {
    return this.remindersService.create(userId, body as Parameters<RemindersService['create']>[1]);
  }

  @Get()
  getList(
    @UserId() userId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('date') date?: string,
  ) {
    return this.remindersService.getList(userId, start, end, date);
  }

  @Get(':id')
  getOne(@UserId() userId: string, @Param('id') id: string) {
    return this.remindersService.getOne(userId, id);
  }

  @Patch(':id')
  update(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateReminderSchema)) body: unknown,
  ) {
    return this.remindersService.update(userId, id, body as Parameters<RemindersService['update']>[2]);
  }
}
