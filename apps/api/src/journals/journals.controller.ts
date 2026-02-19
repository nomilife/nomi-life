import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JournalsService } from './journals.service';
import { AuthGuard } from '../auth/auth.guard';
import { UserId } from '../auth/auth.decorator';
import { createJournalSchema, updateJournalSchema } from './dto/journals.dto';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@Controller('journals')
@UseGuards(AuthGuard)
export class JournalsController {
  constructor(private readonly journalsService: JournalsService) {}

  @Post()
  create(
    @UserId() userId: string,
    @Body(new ZodValidationPipe(createJournalSchema)) body: unknown,
  ) {
    return this.journalsService.create(userId, body as Parameters<JournalsService['create']>[1]);
  }

  @Get()
  getList(
    @UserId() userId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('date') date?: string,
  ) {
    return this.journalsService.getList(userId, start, end, date);
  }

  @Get(':id')
  getOne(@UserId() userId: string, @Param('id') id: string) {
    return this.journalsService.getOne(userId, id);
  }

  @Patch(':id')
  update(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateJournalSchema)) body: unknown,
  ) {
    return this.journalsService.update(userId, id, body as Parameters<JournalsService['update']>[2]);
  }
}
