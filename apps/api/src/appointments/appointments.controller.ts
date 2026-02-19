import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AuthGuard } from '../auth/auth.guard';
import { UserId } from '../auth/auth.decorator';
import { createAppointmentSchema, updateAppointmentSchema } from './dto/appointments.dto';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@Controller('appointments')
@UseGuards(AuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  create(
    @UserId() userId: string,
    @Body(new ZodValidationPipe(createAppointmentSchema)) body: unknown,
  ) {
    return this.appointmentsService.create(userId, body as Parameters<AppointmentsService['create']>[1]);
  }

  @Get()
  getList(
    @UserId() userId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('date') date?: string,
  ) {
    return this.appointmentsService.getList(userId, start, end, date);
  }

  @Get(':id')
  getOne(@UserId() userId: string, @Param('id') id: string) {
    return this.appointmentsService.getOne(userId, id);
  }

  @Patch(':id')
  update(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateAppointmentSchema)) body: unknown,
  ) {
    return this.appointmentsService.update(userId, id, body as Parameters<AppointmentsService['update']>[2]);
  }
}
