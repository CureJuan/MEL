import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MelpIndicatorMonitoring } from '../schema/melpIndicatorMonitoring.schema';
import { AddMonitoringRiskDTO } from './addMonitoringRisk.dto';

export class AddIndicatorDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  indicatorCode: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(400)
  @ApiProperty()
  indicatorName: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(400)
  @ApiProperty()
  definition: string;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  completionYear: number;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty()
  measurementUnit: string;

  @IsNotEmpty()
  @ApiProperty()
  cumulativeTarget: number;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  @ApiProperty()
  sourceOfData: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  collectionMethodType: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  @ApiProperty()
  collectionMethodName: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  collectionFrequencyType: string;

  @Transform(({ value }) => value.trim())
  @IsOptional()
  @ApiProperty()
  collectionFrequencyName: string;

  @IsArray()
  @ArrayMinSize(1)
  @ApiProperty()
  indicatorsMonitoring: MelpIndicatorMonitoring[];

  @IsArray()
  @ArrayMinSize(1)
  @ApiProperty()
  monitoringRisks: AddMonitoringRiskDTO[];
}
