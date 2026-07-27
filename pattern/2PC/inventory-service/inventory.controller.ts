import { Controller, Post, Body } from '@nestjs/common';
import { Inventory2PCService } from './inventory-2pc.service';
import { PrepareDto } from '../shared/dtos/prepare.dto';
import { CommitDto } from '../shared/dtos/commit.dto';
import { RollbackDto } from '../shared/dtos/rollback.dto';
import { TwoPhaseResponse } from '../shared/dtos/two-phase.response';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory2PCService: Inventory2PCService) {}

  @Post('prepare')
  async prepare(@Body() prepareDto: PrepareDto): Promise<TwoPhaseResponse> {
    return this.inventory2PCService.prepare(prepareDto);
  }

  @Post('commit')
  async commit(@Body() commitDto: CommitDto): Promise<TwoPhaseResponse> {
    return this.inventory2PCService.commit(commitDto);
  }

  @Post('rollback')
  async rollback(@Body() rollbackDto: RollbackDto): Promise<TwoPhaseResponse> {
    return this.inventory2PCService.rollback(rollbackDto);
  }
}