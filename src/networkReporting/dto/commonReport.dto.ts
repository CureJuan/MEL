import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CommonReportDTO {
  @IsNotEmpty()
  @ApiProperty()
  year: number;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty()
  networkManagerName: string;

  @Transform(({ value }) => value.trim())
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty()
  networkManagerEmail: string;

  @IsOptional()
  @MinLength(5)
  @MaxLength(500)
  @ApiProperty()
  changesInGeneralInfo: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(500)
  @ApiProperty()
  reportOnProgress: string;

  @IsNotEmpty()
  @IsArray()
  @ApiProperty()
  networksImprovedVisibility: string[];

  @Transform(({ value }) => value.trim())
  @IsOptional()
  @ApiProperty()
  otherImprovedVisibility: string;

  @IsNotEmpty()
  @ApiProperty()
  totalNumberOfPlannedCapacityWithCapnet: number;

  @IsNotEmpty()
  @ApiProperty()
  totalNumberOfDeliveredCapacityWithCapnet: number;

  @IsNotEmpty()
  @IsArray()
  @ApiProperty()
  challenges: string[];

  @Transform(({ value }) => value.trim())
  @IsOptional()
  @ApiProperty()
  otherChallenge: string;

  @IsNotEmpty()
  @ApiProperty()
  totalNumberOfPlannedCapacityWithoutCapnet: number;

  @IsNotEmpty()
  @ApiProperty()
  numberOfPotentialStoriesOfChange: number;

  @IsNotEmpty()
  @ApiProperty()
  hasSubmittedInfoToDevelopStoryOfChange: boolean;
}
