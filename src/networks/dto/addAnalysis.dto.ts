import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, MaxLength, MinLength } from 'class-validator';

export class AddAnalysisDto {
  @Transform(({ value }) => value.trim())
  @IsOptional()
  @MinLength(5)
  @MaxLength(500)
  @ApiProperty()
  analysisAndLearning: string;

  @Transform(({ value }) => value.trim())
  @IsOptional()
  @MinLength(5)
  @MaxLength(500)
  @ApiProperty()
  weaknessAndRisk: string;

  @Transform(({ value }) => value.trim())
  @IsOptional()
  @MinLength(5)
  @MaxLength(500)
  @ApiProperty()
  challengesInNetworkManagement: string;

  @Transform(({ value }) => value.trim())
  @IsOptional()
  @MinLength(5)
  @MaxLength(500)
  @ApiProperty()
  challengesInCapacityDevelopment: string;
  @Transform(({ value }) => value.trim())
  @IsOptional()
  @MinLength(5)
  @MaxLength(500)
  @ApiProperty()
  challengesInKnowledgeManagement: string;
  @Transform(({ value }) => value.trim())
  @IsOptional()
  @MinLength(5)
  @MaxLength(500)
  @ApiProperty()
  challengesInPartnership: string;

  @Transform(({ value }) => value.trim())
  @IsOptional()
  @MinLength(5)
  @MaxLength(500)
  @ApiProperty()
  typeOfSupportRequest: string;

  @Transform(({ value }) => value.trim())
  @IsOptional()
  @MinLength(5)
  @MaxLength(500)
  @ApiProperty()
  actionPlans: string;
}
