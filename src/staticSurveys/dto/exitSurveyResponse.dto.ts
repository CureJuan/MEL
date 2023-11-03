import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { BenefitsLevelEnum } from '../enum/benefitsLevel.enum';
import { DegreeOfNewKnowledgeEnum } from '../enum/degreeOfNewKnowledge.enum';
import { ExpectationLevelEnum } from '../enum/expectationLevel.enum';
import { KnowledgeGainedEnum } from '../enum/knowledgeGained.enum';
import { RelevanceLevelEnum } from '../enum/relevanceLevel.enum';
import { SurveyResponseDTO } from './surveyResponse.dto';

export class ExitSurveyResponseDTO extends SurveyResponseDTO {
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty()
  activityCompletedInEntirety: string;

  @IsNotEmpty()
  @IsEnum(BenefitsLevelEnum)
  @ApiProperty()
  beneficiality: string;

  @IsNotEmpty()
  @IsEnum(RelevanceLevelEnum)
  @ApiProperty()
  relevance: string;

  @IsNotEmpty()
  @IsEnum(ExpectationLevelEnum)
  @ApiProperty()
  expectations: string;

  @IsNotEmpty()
  @IsEnum(DegreeOfNewKnowledgeEnum)
  @ApiProperty()
  degreeOfKnowledge: string;

  @IsNotEmpty()
  @IsEnum(KnowledgeGainedEnum)
  @ApiProperty()
  applicationOfKnowledge: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(30)
  @ApiProperty()
  valuableConcept: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(30)
  @ApiProperty()
  topicsInGreaterDepth: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty()
  interactionWithFellowParticipants: string;

  @Transform(({ value }) => value.trim())
  @MinLength(5)
  @MaxLength(100)
  @ApiProperty()
  feedback: string;
}
