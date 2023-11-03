import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsMongoId, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class SurveyFormDTO {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  year: number;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  language: string;

  @IsNotEmpty()
  @IsMongoId()
  @ApiProperty()
  proposalId: Types.ObjectId;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  activityCode: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  activityName: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty()
  formCode: string;
}
