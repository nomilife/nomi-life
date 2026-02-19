import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { TimelineModule } from '../timeline/timeline.module';
import { HabitsModule } from '../habits/habits.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [TimelineModule, HabitsModule, EventsModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
