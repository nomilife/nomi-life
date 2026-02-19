import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { HabitsService } from './habits.service';
import { AuthGuard } from '../auth/auth.guard';
import { UserId } from '../auth/auth.decorator';
import {
  createHabitSchema,
  updateHabitSchema,
  habitEntrySchema,
} from './dto/habits.dto';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@Controller('habits')
@UseGuards(AuthGuard)
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Post()
  create(
    @UserId() userId: string,
    @Body(new ZodValidationPipe(createHabitSchema)) body: unknown,
  ) {
    return this.habitsService.create(userId, body as Parameters<HabitsService['create']>[1]);
  }

  @Get()
  getHabits(
    @UserId() userId: string,
    @Query('active') active?: string,
  ) {
    const activeBool = active === 'true' ? true : active === 'false' ? false : undefined;
    return this.habitsService.getHabits(userId, activeBool);
  }

  @Get('routine')
  getRoutine(
    @UserId() userId: string,
    @Query('date') date?: string,
  ) {
    const d = date ?? new Date().toISOString().slice(0, 10);
    return this.habitsService.getRoutine(userId, d);
  }

  @Get(':id')
  getHabit(@UserId() userId: string, @Param('id') id: string) {
    return this.habitsService.getHabit(userId, id);
  }

  @Patch(':id')
  update(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateHabitSchema)) body: unknown,
  ) {
    return this.habitsService.update(userId, id, body as Parameters<HabitsService['update']>[2]);
  }

  @Post(':id/entry')
  addEntry(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(habitEntrySchema)) body: unknown,
  ) {
    return this.habitsService.addEntry(userId, id, body as Parameters<HabitsService['addEntry']>[2]);
  }
}
