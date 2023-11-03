import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  MaxLength,
  MinLength,
  IsString,
} from 'class-validator';
import { Schema } from 'mongoose';

export class AddMonitoringRiskDTO {
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  @ApiProperty()
  issues: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  @ApiProperty()
  mitigatingAction: string;

  @IsOptional()
  @ApiProperty()
  indicatorRisksId: Schema.Types.ObjectId;
}
