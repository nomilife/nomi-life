import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';
import { APP_GUARD } from '@nestjs/core';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthGuard } from './auth/auth.guard';
import { TimelineModule } from './timeline/timeline.module';
import { EventsModule } from './events/events.module';
import { BillsModule } from './bills/bills.module';
import { HabitsModule } from './habits/habits.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AiModule } from './ai/ai.module';
import { SettingsModule } from './settings/settings.module';
import { HealthModule } from './health/health.module';
import { ShortcutsModule } from './shortcuts/shortcuts.module';
import { WorkBlocksModule } from './work-blocks/work-blocks.module';
import { TasksModule } from './tasks/tasks.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { RemindersModule } from './reminders/reminders.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { GoalsModule } from './goals/goals.module';
import { TravelModule } from './travel/travel.module';
import { JournalsModule } from './journals/journals.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.join(__dirname, '..', '.env'),
        path.join(process.cwd(), 'apps', 'api', '.env'),
        '.env',
      ],
    }),
    SupabaseModule,
    TimelineModule,
    EventsModule,
    BillsModule,
    HabitsModule,
    NotificationsModule,
    AiModule,
    SettingsModule,
    HealthModule,
    ShortcutsModule,
    WorkBlocksModule,
    TasksModule,
    AppointmentsModule,
    RemindersModule,
    SubscriptionsModule,
    GoalsModule,
    TravelModule,
    JournalsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
