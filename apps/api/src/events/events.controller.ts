import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { AuthGuard } from '../auth/auth.guard';
import { UserId } from '../auth/auth.decorator';
import {
  createEventSchema,
  updateEventSchema,
  inviteSchema,
  rsvpSchema,
  messageSchema,
  type InviteDto,
  type RsvpDto,
  type MessageDto,
} from './dto/events.dto';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@Controller('events')
@UseGuards(AuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get('invites')
  getInvites(@UserId() userId: string) {
    return this.eventsService.getInvites(userId);
  }

  @Get('shared')
  getShared(@UserId() userId: string) {
    return this.eventsService.getShared(userId);
  }

  @Post()
  create(
    @UserId() userId: string,
    @Body(new ZodValidationPipe(createEventSchema)) body: unknown,
  ) {
    return this.eventsService.create(userId, body as Parameters<EventsService['create']>[1]);
  }

  @Get(':id')
  getEvent(@UserId() userId: string, @Param('id') id: string) {
    return this.eventsService.getEvent(userId, id);
  }

  @Patch(':id')
  update(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateEventSchema)) body: unknown,
  ) {
    return this.eventsService.update(userId, id, body as Parameters<EventsService['update']>[2]);
  }

  @Post(':id/invite')
  invite(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(inviteSchema)) body: unknown,
  ) {
    return this.eventsService.invite(userId, id, body as InviteDto);
  }

  @Post(':id/rsvp')
  rsvp(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(rsvpSchema)) body: unknown,
  ) {
    return this.eventsService.rsvp(userId, id, body as RsvpDto);
  }

  @Get(':id/conversation')
  getConversation(@UserId() userId: string, @Param('id') id: string) {
    return this.eventsService.getConversation(userId, id);
  }

  @Post(':id/messages')
  postMessage(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(messageSchema)) body: unknown,
  ) {
    return this.eventsService.postMessage(userId, id, body as MessageDto);
  }
}
