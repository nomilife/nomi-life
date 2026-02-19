import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { WorkBlocksService } from './work-blocks.service';
import { AuthGuard } from '../auth/auth.guard';
import { UserId } from '../auth/auth.decorator';
import { createWorkBlockSchema, updateWorkBlockSchema } from './dto/work-blocks.dto';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@Controller('work-blocks')
@UseGuards(AuthGuard)
export class WorkBlocksController {
  constructor(private readonly workBlocksService: WorkBlocksService) {}

  @Post()
  create(
    @UserId() userId: string,
    @Body(new ZodValidationPipe(createWorkBlockSchema)) body: unknown,
  ) {
    return this.workBlocksService.create(userId, body as Parameters<WorkBlocksService['create']>[1]);
  }

  @Get()
  getList(
    @UserId() userId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('date') date?: string,
  ) {
    let startStr = start;
    let endStr = end;
    if (date) {
      startStr = `${date}T00:00:00.000Z`;
      endStr = `${date}T23:59:59.999Z`;
    }
    return this.workBlocksService.getList(userId, startStr, endStr);
  }

  @Get(':id')
  getOne(@UserId() userId: string, @Param('id') id: string) {
    return this.workBlocksService.getOne(userId, id);
  }

  @Patch(':id')
  update(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateWorkBlockSchema)) body: unknown,
  ) {
    return this.workBlocksService.update(userId, id, body as Parameters<WorkBlocksService['update']>[2]);
  }
}
