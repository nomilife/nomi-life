import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ShortcutsService } from './shortcuts.service';
import { AuthGuard } from '../auth/auth.guard';
import { UserId } from '../auth/auth.decorator';
import { createShortcutSchema, updateShortcutSchema } from './dto/shortcuts.dto';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@Controller('shortcuts')
@UseGuards(AuthGuard)
export class ShortcutsController {
  constructor(private readonly shortcutsService: ShortcutsService) {}

  @Post()
  create(
    @UserId() userId: string,
    @Body(new ZodValidationPipe(createShortcutSchema)) body: unknown,
  ) {
    return this.shortcutsService.create(userId, body as Parameters<ShortcutsService['create']>[1]);
  }

  @Get()
  list(@UserId() userId: string) {
    return this.shortcutsService.list(userId);
  }

  @Get(':id')
  get(@UserId() userId: string, @Param('id') id: string) {
    return this.shortcutsService.get(userId, id);
  }

  @Patch(':id')
  update(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateShortcutSchema)) body: unknown,
  ) {
    return this.shortcutsService.update(userId, id, body as Parameters<ShortcutsService['update']>[2]);
  }

  @Delete(':id')
  delete(@UserId() userId: string, @Param('id') id: string) {
    return this.shortcutsService.delete(userId, id);
  }
}
