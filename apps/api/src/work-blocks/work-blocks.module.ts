import { Module } from '@nestjs/common';
import { WorkBlocksController } from './work-blocks.controller';
import { WorkBlocksService } from './work-blocks.service';

@Module({
  controllers: [WorkBlocksController],
  providers: [WorkBlocksService],
})
export class WorkBlocksModule {}
