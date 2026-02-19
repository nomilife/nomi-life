import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { EventsService } from '../events/events.service';
import { AuthGuard } from '../auth/auth.guard';
import { UserId } from '../auth/auth.decorator';
import { createJobSchema, parseCommandSchema, chatSchema } from './dto/ai.dto';
import { createEventSchema } from '../events/dto/events.dto';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@Controller('ai')
@UseGuards(AuthGuard)
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly eventsService: EventsService,
  ) {}

  @Post('parse-command')
  parseCommand(
    @Body(new ZodValidationPipe(parseCommandSchema)) body: { text: string },
  ) {
    return this.aiService.parseCommand(body.text);
  }

  /** Fallback for voice/create when POST /events returns 404 (e.g. proxy/base path). */
  @Post('create-event')
  createEvent(
    @UserId() userId: string,
    @Body(new ZodValidationPipe(createEventSchema)) body: unknown,
  ) {
    return this.eventsService.create(userId, body as Parameters<EventsService['create']>[1]);
  }

  @Post('chat')
  chat(
    @UserId() userId: string,
    @Body(new ZodValidationPipe(chatSchema)) body: { messages: Array<{ role: string; content: string }> },
  ) {
    return this.aiService.chat(userId, body.messages);
  }

  @Post('jobs')
  createJob(
    @UserId() userId: string,
    @Body(new ZodValidationPipe(createJobSchema)) body: unknown,
  ) {
    const { jobType, input } = body as { jobType: string; input?: Record<string, unknown> };
    return this.aiService.createJob(userId, jobType, input ?? {});
  }

  @Get('jobs/:id')
  getJob(@UserId() userId: string, @Param('id') id: string) {
    return this.aiService.getJob(userId, id);
  }
}
