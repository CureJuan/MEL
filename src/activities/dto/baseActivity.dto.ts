import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsArray,
  MinLength,
  MaxLength,
  IsMongoId,
  IsOptional,
} from 'class-validator';
import { Types } from 'mongoose';

export class BaseActivityDTO {
  @IsNotEmpty()
  @ApiProperty()
  year: number;

  @IsNotEmpty()
  @ApiProperty()
  activityCode: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(100)
  @ApiProperty()
  activityName: string;

  @IsOptional()
  @ApiProperty()
  focalPersonName: string;

  @IsNotEmpty()
  @IsMongoId()
  @ApiProperty()
  resultId: Types.ObjectId;

  @IsNotEmpty()
  @IsArray()
  @ApiProperty()
  indicatorId: Types.ObjectId[];

  @IsNotEmpty()
  @ApiProperty()
  thematicAreaId: Types.ObjectId;

  @IsOptional()
  @ApiProperty()
  otherThematicArea: string;

  @IsNotEmpty()
  @ApiProperty()
  activityTypeId: Types.ObjectId;

  @IsOptional()
  @ApiProperty()
  activityScopeId: Types.ObjectId;

  @IsOptional()
  @ApiProperty()
  otherActivityScope: string;
}
