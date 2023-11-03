import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Types } from 'mongoose';

export class AddProgressMarkerDTO {
  // This field is used in edit API
  @IsOptional()
  @ApiProperty()
  progressMarkersId: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  progressMarkerCode: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(100)
  @IsString()
  @ApiProperty()
  progressMarker: string;

  @IsNotEmpty()
  @ApiProperty()
  priorityId: Types.ObjectId;

  @ApiProperty()
  progressMonitoringQ2: Types.ObjectId;

  @ApiProperty()
  progressMonitoringQ4: Types.ObjectId;

  @Transform(({ value }) => value.trim())
  @MinLength(1)
  @MaxLength(5)
  @IsOptional()
  @ApiProperty()
  descriptionOfChange: string;

  @Transform(({ value }) => value.trim())
  @MinLength(1)
  @MaxLength(5)
  @IsOptional()
  @ApiProperty()
  contributingFactors: string;

  @Transform(({ value }) => value.trim())
  @MinLength(1)
  @MaxLength(5)
  @IsOptional()
  @ApiProperty()
  sourceOfEvidence: string;

  @Transform(({ value }) => value.trim())
  @MinLength(1)
  @MaxLength(5)
  @IsOptional()
  @ApiProperty()
  unintendedChanges: string;
}
