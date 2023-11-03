import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { FinancialDTO } from './financial.dto';

export class CoordinationCostDTO extends FinancialDTO {
  @IsNotEmpty()
  @ApiProperty()
  coordination: string;

  coordinationCostId: string;
}
