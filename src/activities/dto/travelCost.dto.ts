import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { FinancialDTO } from './financial.dto';

export class TravelCostDTO extends FinancialDTO {
  @IsNotEmpty()
  @ApiProperty()
  travel: string;

  travelCostId: string;
}
