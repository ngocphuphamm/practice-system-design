import { Controller, Post, Body } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PrepareDto } from '../shared/dtos/prepare.dto';
import { CommitDto } from '../shared/dtos/commit.dto';
import { RollbackDto } from '../shared/dtos/rollback.dto';
import { TwoPhaseResponse } from '../shared/dtos/two-phase.response';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('prepare')
  async prepare(@Body() prepareDto: PrepareDto): Promise<TwoPhaseResponse> {
    return this.paymentService.prepare(prepareDto);
  }

  @Post('commit')
  async commit(@Body() commitDto: CommitDto): Promise<TwoPhaseResponse> {
    return this.paymentService.commit(commitDto);
  }

  @Post('rollback')
  async rollback(@Body() rollbackDto: RollbackDto): Promise<TwoPhaseResponse> {
    return this.paymentService.rollback(rollbackDto);
  }
}