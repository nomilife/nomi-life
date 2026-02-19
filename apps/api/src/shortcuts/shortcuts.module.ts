import { Module } from '@nestjs/common';
import { ShortcutsController } from './shortcuts.controller';
import { ShortcutsService } from './shortcuts.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [ShortcutsController],
  providers: [ShortcutsService],
  exports: [ShortcutsService],
})
export class ShortcutsModule {}
