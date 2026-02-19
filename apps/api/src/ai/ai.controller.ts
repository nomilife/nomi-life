import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { AuthGuard } from '../auth/auth.guard';
import { UserId } from '../auth/auth.decorator';
import { createJobSchema, parseCommandSchema, chatSchema } from './dto/ai.dto';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@Controller('ai')
@UseGuards(AuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('parse-command')
  parseCommand(
    @Body(new ZodValidationPipe(parseCommandSchema)) body: { text: string },
  ) {
    return this.aiService.parseCommand(body.text);
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
