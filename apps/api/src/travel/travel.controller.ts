import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TravelService } from './travel.service';
import { AuthGuard } from '../auth/auth.guard';
import { UserId } from '../auth/auth.decorator';
import { createTravelSchema, updateTravelSchema } from './dto/travel.dto';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@Controller('travel')
@UseGuards(AuthGuard)
export class TravelController {
  constructor(private readonly travelService: TravelService) {}

  @Post()
  create(
    @UserId() userId: string,
    @Body(new ZodValidationPipe(createTravelSchema)) body: unknown,
  ) {
    return this.travelService.create(userId, body as Parameters<TravelService['create']>[1]);
  }

  @Get()
  getList(
    @UserId() userId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('date') date?: string,
  ) {
    return this.travelService.getList(userId, start, end, date);
  }

  @Get(':id')
  getOne(@UserId() userId: string, @Param('id') id: string) {
    return this.travelService.getOne(userId, id);
  }

  @Patch(':id')
  update(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateTravelSchema)) body: unknown,
  ) {
    return this.travelService.update(userId, id, body as Parameters<TravelService['update']>[2]);
  }
}
