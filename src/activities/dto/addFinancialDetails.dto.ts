import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { CoordinationCostDTO } from './coordinationCost.dto';
import { LocationCostDTO } from './locationCost.dto';
import { OtherCostDTO } from './otherCost.dto';
import { TravelCostDTO } from './travelCost.dto';

export class AddFinancialDetailsDTO {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty()
  coordinationCosts: CoordinationCostDTO[];

  @IsNotEmpty()
  @IsArray()
  @ApiProperty()
  travelCosts: TravelCostDTO[];

  @IsNotEmpty()
  @IsArray()
  @ApiProperty()
  locationCosts: LocationCostDTO[];

  @IsNotEmpty()
  @IsArray()
  @ApiProperty()
  otherCosts: OtherCostDTO[];

  @IsNotEmpty()
  @IsBoolean()
  @ApiProperty()
  requireCapnetFinancialContribution: boolean;

  @IsOptional()
  @IsNumber()
  @ApiProperty()
  totalBudgetForActivity: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty()
  totalCapnetContribution: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty()
  totalPartnerContribution: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty()
  totalInkindContribution: number;
}
