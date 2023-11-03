import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { Types } from 'mongoose';
import { CourseObjectives } from '../schema/entrySurveyResponse.schema';
import { SurveyResponseDTO } from './surveyResponse.dto';

export class EntrySurveyResponseDTO extends SurveyResponseDTO {
  @IsNotEmpty()
  @ApiProperty()
  regionId: Types.ObjectId;

  @IsNotEmpty()
  @ApiProperty()
  countryId: Types.ObjectId;

  @IsNotEmpty()
  @ApiProperty()
  scopeOfWorkId: Types.ObjectId;

  @IsNotEmpty()
  @ApiProperty()
  networkId: Types.ObjectId | string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty()
  influenceType: string;

  @IsNotEmpty()
  @ApiProperty()
  institutionTypeId: Types.ObjectId;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(30)
  @ApiProperty()
  orgainsationName: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty()
  knowledgeRating: string;

  @IsArray()
  @ApiProperty()
  courseObjectives: CourseObjectives[];

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(100)
  @ApiProperty()
  mainMotivation: string;
}
