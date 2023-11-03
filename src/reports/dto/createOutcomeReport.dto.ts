import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { FileUploadDTO } from '../schema/outputReport.schema';
import { InputDataDTO } from './activityParticipationProfile.dto';
import { KnowledgeAppliedByGenderDTO } from './knowledgeAppliedByGender.dto';
import { OutreachDTO } from './outreach.dto';
import { PositiveResponsesDTO } from './positiveResponses.dto';

export class CreateOutcomeReportDTO {
  @ApiProperty()
  year: number;

  @ApiProperty()
  activityCode: string;

  @ApiProperty()
  outcomeReportCode: string;

  @ApiProperty()
  activityName: string;

  @ApiProperty()
  proposalId: Types.ObjectId;

  @ApiProperty()
  outcomeSurveySubmissionMethod: string;

  @ApiProperty()
  outreach: OutreachDTO;

  @ApiProperty()
  positiveResponses: PositiveResponsesDTO;

  @ApiProperty()
  knowledgeAppliedByGender: KnowledgeAppliedByGenderDTO;

  @ApiProperty()
  knowledgeAppliedByInstitution: InputDataDTO[];

  @ApiProperty()
  policyChangesByInstitution: InputDataDTO[];

  @ApiProperty()
  policyChangesByCountry: number;

  @ApiProperty()
  numberOfResponsesStoryOfChange: number;

  @ApiProperty()
  additionalInfoFile: FileUploadDTO; /**upload link */

  @ApiProperty()
  additionalComment: string;
}
