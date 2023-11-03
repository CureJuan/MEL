import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { FinancialDTO } from './financial.dto';

export class OtherCostDTO extends FinancialDTO {
  @IsNotEmpty()
  @ApiProperty()
  other: string;

  otherCostId: string;
}
