import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { Status } from '../../common/schema/status.schema';
import { Activities } from './activities.schema';
import { BaseActivity } from './baseActivity.schema';
import { FileUploadDTO } from '../../reports/schema/outputReport.schema';

@Schema({
  timestamps: true,
})
export class ActivityProposals extends BaseActivity {
  @Prop()
  activityProposalId: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: Activities.name, default: null })
  activityId: Types.ObjectId;

  @Prop({ required: true })
  proposedForCurrentYearWorkplan: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: 0, required: false })
  approvedCount: number;

  @Prop()
  instituteName: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: Status.name }) //Drafted, Submitted, Approved, Denied,Info Requested
  statusId: Types.ObjectId;

  @Prop()
  proposedStartDate: Date;

  @Prop()
  proposedEndDate: Date;

  @Prop()
  language: string;

  // @Prop({ type: [SchemaTypes.ObjectId], ref: 'ActivityTargetGroup'})
  // activityTargetGroups: Types.ObjectId[];

  @Prop()
  activityTargetGroups: ActivityTargetGroup[];

  @Prop({ default: '' })
  otherActivityTargetGroups: string;

  @Prop()
  mainPartners: string;

  @Prop()
  aboutActivity: string;

  /** Scene Wise fields */
  @Prop()
  expectedOutputs: string;

  @Prop()
  addressSustainableWaterManagement: string;

  @Prop()
  wereVulnerableGroupsInvolved: boolean;

  @Prop()
  vulnerableGroupsDetail: string;

  @Prop()
  isSocialIssuesIncluded: boolean;

  @Prop()
  socialIssuesDetail: string;

  @Prop()
  numberOfParticipantsEstimated: number;

  @Prop()
  typeOfOnlineCourse: string;

  @Prop()
  numberOfCourseModule: NumberOfCourseModule[];

  @Prop()
  totalCourseLength: number;

  @Prop()
  isWebinarIncluded: boolean;

  @Prop()
  facilitators: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: '' })
  countryId: Types.ObjectId;

  @Prop()
  city: string;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;

  @Prop()
  submittedAt: Date;

  @Prop()
  approvedAt: Date;

  /** Financials Info Tab */
  @Prop()
  requireCapnetFinancialContribution: boolean;

  @Prop()
  totalBudgetForActivity: number;

  @Prop()
  totalCapnetContribution: number;

  @Prop()
  totalPartnerContribution: number;

  @Prop()
  totalInkindContribution: number;

  /** Additional Info Tab */
  //File path
  @Prop()
  addtionalInfo: FileUploadDTO;

  @Prop()
  additionalComments: string;

  @Prop()
  isOutputReportSubmitted: boolean;

  @Prop()
  implementationStatus: string;

  @Prop({ default: false })
  isFirstTabFilled: boolean;

  @Prop({ default: false })
  isSecondTabFilled: boolean;

  @Prop({ default: false })
  isThirdTabFilled: boolean;

  @Prop({ type: Object })
  activityTypeObj: any;

  @Prop()
  indicatorObj: any[];

  @Prop()
  otherActivityType: string;
}

export const ActivityProposalsSchema =
  SchemaFactory.createForClass(ActivityProposals);

export interface ActivityTargetGroup {
  key: string;
  value: boolean;
}

export interface NumberOfCourseModule {
  moduleName: string;
  moduleNumber: number;
}
