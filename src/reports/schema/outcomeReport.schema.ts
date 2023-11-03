import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { Base } from '../../common/schema/base.schema';
import { InputDataDTO } from '../dto/activityParticipationProfile.dto';
import { KnowledgeAppliedByGenderDTO } from '../dto/knowledgeAppliedByGender.dto';
import { OutreachDTO } from '../dto/outreach.dto';
import { PositiveResponsesDTO } from '../dto/positiveResponses.dto';
import { FileUploadDTO } from './outputReport.schema';

export type OutcomeReportDocument = OutcomeReport & Document;

@Schema({
  timestamps: true,
})
export class OutcomeReport extends Base {
  @Prop()
  outcomeReportId: string;

  @Prop()
  year: number;

  @Prop()
  outcomeReportCode: string;

  /**code of activities whose output reports are approved */
  @Prop()
  activityCode: string;

  @Prop()
  activityName: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'ActivityProposals' })
  proposalId: Types.ObjectId;

  @Prop()
  outcomeSurveySubmissionMethod: string;

  @Prop()
  outreach: OutreachDTO;

  @Prop()
  positiveResponses: PositiveResponsesDTO;

  @Prop()
  knowledgeAppliedByGender: KnowledgeAppliedByGenderDTO;

  @Prop()
  knowledgeAppliedByInstitution: InputDataDTO[];

  @Prop()
  policyChangesByInstitution: InputDataDTO[];

  @Prop()
  policyChangesByCountry: number;

  @Prop()
  numberOfResponsesStoryOfChange: number;

  @Prop()
  additionalInfoFile: FileUploadDTO;

  @Prop()
  additionalComment: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Status' })
  outcomeReportStatus: Types.ObjectId; /**Drafted, Submitted, Approved, Denied, Info requested */

  @Prop()
  statusName: string;

  @Prop({ default: null })
  submittedAt: Date;

  @Prop({ default: null })
  approvedAt: Date;

  @Prop({ default: null })
  networkId: Types.ObjectId;

  @Prop()
  networkName: string;

  @Prop()
  partnerName: string;

  @Prop({ default: '' })
  instituteName: string;

  @Prop({ default: null })
  partnerId: Types.ObjectId;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: 0, required: false })
  approvedCount: number;

  @Prop({ type: Types.ObjectId, ref: 'Invoice', default: null })
  invoiceId: Types.ObjectId;
}
export const OutcomeReportSchema = SchemaFactory.createForClass(OutcomeReport);
