import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CommonReportDTO } from './commonReport.dto';

export class CreateAnnualReportDTO extends CommonReportDTO {
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty()
  annualReportCode: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty()
  networkWebsite: string;

  @IsNotEmpty()
  @ApiProperty()
  lastUpdateOnWebsite: Date;

  @IsNotEmpty()
  @IsArray()
  @ApiProperty()
  actionsTakenToSupportNetworkMembers: string[];

  @Transform(({ value }) => value.trim())
  @IsOptional()
  @ApiProperty()
  otherActionsTaken: string;

  @IsNotEmpty()
  @ApiProperty()
  numberOfActivePartners: number;

  @IsNotEmpty()
  @ApiProperty()
  hasNetworkAchievedWhatIsExpected: boolean;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(500)
  @ApiProperty()
  whatIsExpectedDetails: string;

  @IsNotEmpty()
  @ApiProperty()
  anyContributingFactors: boolean;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(500)
  @ApiProperty()
  contributingFactorsDetails: string;

  @IsNotEmpty()
  @ApiProperty()
  anyUnexpectedOutcome: boolean;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(500)
  @ApiProperty()
  unexpectedOutcomeDetails: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  @ApiProperty()
  sustainPositiveResults: string;

  @IsNotEmpty()
  @ApiProperty()
  networkPerformanceRating: number;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(500)
  @ApiProperty()
  networkPerformanceRatingExplaination: string;

  @IsNotEmpty()
  @ApiProperty()
  networkKnowledgeRating: number;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(500)
  @ApiProperty()
  networkKnowledgeRatingExplaination: string;

  @IsNotEmpty()
  @ApiProperty()
  networkPartnerEngagementRating: number;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(500)
  @ApiProperty()
  networkPartnerEngagementRatingExplaination: string;

  @IsNotEmpty()
  @ApiProperty()
  networkDemandDrivenCapacityRating: number;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(500)
  @ApiProperty()
  networkDemandDrivenCapacityRatingExplaination: string;
}
