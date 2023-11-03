import { ApiProperty } from '@nestjs/swagger';

export class FinancialDTO {
  @ApiProperty()
  budget: number;

  @ApiProperty()
  amountPerUnit: number;

  @ApiProperty()
  numberOfUnits: number;

  @ApiProperty()
  capnetFinancialFunding: number;

  @ApiProperty()
  networkFinancialFunding: number;

  @ApiProperty()
  partnerFinancialFunding: number;

  @ApiProperty()
  networkInKindFunding: number;

  @ApiProperty()
  partnerInKindFunding: number;
}
