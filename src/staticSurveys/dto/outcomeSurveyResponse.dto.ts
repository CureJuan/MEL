import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { Types } from 'mongoose';
import { KnowledgeApplicationEnum } from '../enum/knowledgeApplication.enum';
import { KnowledgeSharing } from '../schema/outcomeSurveyResponse.schema';
import { SurveyResponseDTO } from './surveyResponse.dto';

export class OutcomeSurveyResponseDTO extends SurveyResponseDTO {
  @IsNotEmpty()
  @ApiProperty()
  countryId: Types.ObjectId;

  @IsNotEmpty()
  @ApiProperty()
  institutionTypeId: Types.ObjectId;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty()
  orgainsation: string;

  @IsArray()
  @ApiProperty()
  knowledgeSharing: KnowledgeSharing[];

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @IsEnum(KnowledgeApplicationEnum)
  @ApiProperty()
  knowledgeApplication: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty()
  knowledgeApplicationExplaination: string;

  @IsNotEmpty()
  @IsBoolean()
  @ApiProperty()
  isRelevantChange: boolean;

  @Transform(({ value }) => value.trim())
  @IsOptional()
  // @MinLength(5)
  // @MaxLength(30)
  // @IsString()
  @ApiProperty()
  elaborateChange: string;

  @Transform(({ value }) => value.trim())
  @IsOptional()
  // @MinLength(5)
  // @MaxLength(30)
  // @IsString()
  @ApiProperty()
  typeOfInstitutionInvolved: string;

  @Transform(({ value }) => value.trim())
  @IsOptional()
  // @MinLength(5)
  // @MaxLength(30)
  // @IsString()
  @ApiProperty()
  locationOfChange: string;

  @IsNotEmpty()
  @IsBoolean()
  @ApiProperty()
  isStoryOfChange: boolean;

  @Transform(({ value }) => value.trim())
  @IsOptional()
  // @MinLength(5)
  // @MaxLength(30)
  // @IsString()
  @ApiProperty()
  comments: string;
}
