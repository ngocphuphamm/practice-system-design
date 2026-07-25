import { Controller, Post, Body } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { PrepareDto } from '../shared/dtos/prepare.dto';
import { CommitDto } from '../shared/dtos/commit.dto';
import { RollbackDto } from '../shared/dtos/rollback.dto';
import { TwoPhaseResponse } from '../shared/dtos/two-phase.response';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('prepare')
  async prepare(@Body() prepareDto: PrepareDto): Promise<TwoPhaseResponse> {
    return this.inventoryService.prepare(prepareDto);
  }

  @Post('commit')
  async commit(@Body() commitDto: CommitDto): Promise<TwoPhaseResponse> {
    return this.inventoryService.commit(commitDto);
  }

  @Post('rollback')
  async rollback(@Body() rollbackDto: RollbackDto): Promise<TwoPhaseResponse> {
    return this.inventoryService.rollback(rollbackDto);
  }
}