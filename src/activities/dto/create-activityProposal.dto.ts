import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsArray,
  IsBoolean,
  IsString,
  IsOptional,
} from 'class-validator';
import { Types } from 'mongoose';
import {
  ActivityTargetGroup,
  NumberOfCourseModule,
} from '../schema/activityProposals.schema';
import { BaseActivityDTO } from './baseActivity.dto';

export class CreateActivityProposalDTO extends BaseActivityDTO {
  @IsOptional()
  @ApiProperty()
  activityId: Types.ObjectId;

  @IsNotEmpty()
  @IsBoolean()
  @ApiProperty()
  proposedForCurrentYearWorkplan: boolean;

  @IsNotEmpty()
  @ApiProperty()
  proposedStartDate: Date;

  @IsNotEmpty()
  @ApiProperty()
  proposedEndDate: Date;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  language: string;

  @IsArray()
  @ApiProperty()
  activityTargetGroups: ActivityTargetGroup[];

  @IsOptional()
  @ApiProperty()
  otherActivityTargetGroups: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  mainPartners: string;

  @IsOptional()
  @ApiProperty()
  aboutActivity: string;

  @IsOptional()
  @ApiProperty()
  expectedOutputs: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  addressSustainableWaterManagement: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty()
  wereVulnerableGroupsInvolved: boolean;

  @IsOptional()
  @IsString()
  @ApiProperty()
  vulnerableGroupsDetail: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty()
  isSocialIssuesIncluded: boolean;

  @IsOptional()
  @IsString()
  @ApiProperty()
  socialIssuesDetail: string;

  @IsOptional()
  @ApiProperty()
  numberOfParticipantsEstimated: number;

  @IsOptional()
  @ApiProperty()
  typeOfOnlineCourse: string;

  @IsOptional()
  @ApiProperty()
  numberOfCourseModule: NumberOfCourseModule[];

  @IsOptional()
  @ApiProperty()
  totalCourseLength: number;

  @IsOptional()
  @ApiProperty()
  isWebinarIncluded: boolean;

  @IsOptional()
  @ApiProperty()
  facilitators: string;

  @ApiProperty()
  countryId: Types.ObjectId;

  @ApiProperty()
  city: string;

  @ApiProperty()
  activityTypeObj: any;

  @ApiProperty()
  indicatorObj: any[];

  @IsOptional()
  @ApiProperty()
  otherActivityType: string;
}
