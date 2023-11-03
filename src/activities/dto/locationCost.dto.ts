import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { FinancialDTO } from './financial.dto';

export class LocationCostDTO extends FinancialDTO {
  @IsNotEmpty()
  @ApiProperty()
  location: string;

  locationCostId: string;
}
