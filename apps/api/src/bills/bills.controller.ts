import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BillsService } from './bills.service';
import { AuthGuard } from '../auth/auth.guard';
import { UserId } from '../auth/auth.decorator';
import {
  createBillSchema,
  updateBillSchema,
  amountSchema,
  type AmountDto,
} from './dto/bills.dto';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@Controller('bills')
@UseGuards(AuthGuard)
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Post()
  create(
    @UserId() userId: string,
    @Body(new ZodValidationPipe(createBillSchema)) body: unknown,
  ) {
    return this.billsService.create(userId, body as Parameters<BillsService['create']>[1]);
  }

  @Get()
  getBills(
    @UserId() userId: string,
    @Query('range') range?: 'month' | 'upcoming',
  ) {
    return this.billsService.getBills(userId, range);
  }

  @Get(':id')
  getBill(@UserId() userId: string, @Param('id') id: string) {
    return this.billsService.getBill(userId, id);
  }

  @Patch(':id')
  update(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateBillSchema)) body: unknown,
  ) {
    return this.billsService.update(userId, id, body as Parameters<BillsService['update']>[2]);
  }

  @Post(':id/amount')
  updateAmount(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(amountSchema)) body: unknown,
  ) {
    return this.billsService.updateAmount(userId, id, body as AmountDto);
  }
}
