import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { Base } from 'src/common/schema/base.schema';
import {
  ActivityParticipationProfileDTO,
  AgeGroupCountDTO,
  InputDataDTO,
} from '../dto/activityParticipationProfile.dto';

export class FileUploadDTO {
  requestId: string;
  fileName: string;
}

export type OutputReportDocument = OutputReport & Document;

@Schema({
  timestamps: true,
})
export class OutputReport extends Base {
  @Prop()
  outputReportId: string;

  @Prop()
  year: number;

  @Prop()
  activityCode: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'ActivityProposals' })
  proposalId: Types.ObjectId;

  @Prop()
  outputReportCode: string;

  @Prop()
  activityName: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'ActivityThematicAreas' })
  thematicAreaId: Types.ObjectId;

  @Prop()
  activityStartDate: Date;

  @Prop()
  activityEndDate: Date;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'ActivityType' })
  activityTypeId: Types.ObjectId;

  @Prop()
  language: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'ActivityScope' })
  activityScopeId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Country' })
  countryId: Types.ObjectId;

  @Prop()
  cityTown: string;

  @Prop()
  mainPartners: string;

  @Prop()
  expectedOutputs: string;

  @Prop({})
  completedOutputs: string;

  @Prop({ required: false })
  inclusionOrPracticeOfNewTechnologies: boolean;

  /**If inclusionOrPracticeOfNewTechnologies == true(yes) */
  @Prop({})
  moreInclusionDetails: string;

  @Prop()
  addressSocialInclusionIssue: boolean;

  /**If addressSocialInclusionIssue == true(yes) */
  @Prop({})
  moreDetailsOnAddressSocialInclusionIssue: string;

  @Prop({ required: false })
  includeGenderSpecificMethodology: boolean;

  /**If includeGenderSpecificMethodology == true(yes) */
  @Prop({})
  moreDetailsOnGenderSpecificMethodology: string;

  /**Multiple PDF or WORD document */
  @Prop({ required: false, default: null })
  caseStudyManual: FileUploadDTO;

  @Prop({ required: true })
  facilitators: string;

  @Prop({ required: false })
  methodOfEnrollmentInActivity: string;

  @Prop({ required: false })
  methodOfFillingExitSurvey: string;

  @Prop({ required: false })
  participantProfileActivityParticipation: ActivityParticipationProfileDTO;

  @Prop({ required: false })
  participantProfileAge: AgeGroupCountDTO;

  @Prop()
  participantProfileCountry: InputDataDTO[];

  // @Prop()
  // countryTotal: number;

  @Prop({ required: false })
  participantProfileRegion: InputDataDTO[];

  // @Prop()
  // regionTotal: number;

  @Prop({ required: false })
  participantProfileInstitutionalAffiliation: InputDataDTO[];

  // @Prop()
  // institutionalAffiliationTotal: number;

  @Prop({ required: false })
  participantProfileCapnetAffiliation: number;

  @Prop({ required: false })
  degreeOfKnowledgeBeforeParticipating: InputDataDTO[];

  @Prop({ required: false })
  degreeOfKnowledgeAfterParticipating: InputDataDTO[];

  @Prop({ required: false })
  benefitOnOverallLearningObjective: InputDataDTO[];

  @Prop({ required: false })
  relevanceInSustainableWaterResourceManagement: InputDataDTO[];

  @Prop({ required: false })
  levelOfExpectationsMet: InputDataDTO[];

  @Prop({ required: false })
  knowledgeApplication: InputDataDTO[];

  @Prop()
  additionalInfoFile: FileUploadDTO;

  @Prop()
  additionalComment: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Status' })
  outputReportStatus: Types.ObjectId; /**Drafted, Submitted, Approved, Denied, Info requested */

  @Prop()
  statusName: string;

  @Prop()
  networkName: string;

  @Prop()
  partnerName: string;

  @Prop({ default: null })
  submittedAt: Date;

  @Prop({ default: null })
  approvedAt: Date;

  @Prop({ default: 0 })
  exitSurveyResponseRate: number; /**Number of responses/ No. of participants */

  @Prop({ default: null })
  networkId: Types.ObjectId;

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

  @Prop()
  otherThematicArea: string;

  @Prop()
  otherActivityType: string;
}

export const OutputReportSchema = SchemaFactory.createForClass(OutputReport);
