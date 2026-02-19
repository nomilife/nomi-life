import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { AuthGuard } from '../auth/auth.guard';
import { UserId } from '../auth/auth.decorator';
import { createTaskSchema, updateTaskSchema } from './dto/tasks.dto';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@Controller('tasks')
@UseGuards(AuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(
    @UserId() userId: string,
    @Body(new ZodValidationPipe(createTaskSchema)) body: unknown,
  ) {
    return this.tasksService.create(userId, body as Parameters<TasksService['create']>[1]);
  }

  @Get()
  getList(
    @UserId() userId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('date') date?: string,
  ) {
    return this.tasksService.getList(userId, start, end, date);
  }

  @Get(':id')
  getOne(@UserId() userId: string, @Param('id') id: string) {
    return this.tasksService.getOne(userId, id);
  }

  @Patch(':id')
  update(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateTaskSchema)) body: unknown,
  ) {
    return this.tasksService.update(userId, id, body as Parameters<TasksService['update']>[2]);
  }
}
