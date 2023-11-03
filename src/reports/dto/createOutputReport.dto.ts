import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { Types } from 'mongoose';
import { FileUploadDTO } from '../schema/outputReport.schema';

export class CreateOutputReportDTO {
  @ApiProperty()
  year: number;

  @ApiProperty()
  outputReportCode: string;

  @ApiProperty()
  activityCode: string;

  @ApiProperty()
  proposalId: Types.ObjectId;

  @ApiProperty()
  activityName: string;

  @ApiProperty()
  thematicAreaId: Types.ObjectId;

  @ApiProperty()
  activityStartDate: Date;

  @ApiProperty()
  activityEndDate: Date;

  @ApiProperty()
  activityTypeId: Types.ObjectId;

  @ApiProperty()
  language: string;

  @ApiProperty()
  activityScopeId: Types.ObjectId;

  @ApiProperty()
  countryId: Types.ObjectId;

  @ApiProperty()
  cityTown: string;

  @ApiProperty()
  mainPartners: string;

  @ApiProperty()
  expectedOutputs: string;

  @ApiProperty()
  completedOutputs: string;

  @ApiProperty()
  inclusionOrPracticeOfNewTechnologies: boolean;

  /**If inclusionOrPracticeOfNewTechnologies == true(yes) */
  @ApiProperty()
  moreInclusionDetails: string;

  @ApiProperty()
  addressSocialInclusionIssue: boolean;

  /**If addressSocialInclusionIssue == true(yes) */
  @ApiProperty()
  moreDetailsOnAddressSocialInclusionIssue: string;

  @ApiProperty()
  includeGenderSpecificMethodology: boolean;

  /**If includeGenderSpecificMethodology == true(yes) */
  @ApiProperty()
  moreDetailsOnGenderSpecificMethodology: string;

  /**Multiple PDF or WORD document */
  @ApiProperty()
  caseStudyManual: FileUploadDTO;

  @ApiProperty()
  facilitators: string;

  @IsOptional()
  @ApiProperty()
  otherThematicArea: string;

  @IsOptional()
  @ApiProperty()
  otherActivityType: string;
}
