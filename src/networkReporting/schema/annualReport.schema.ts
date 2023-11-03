import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CommonReport } from './commonReport.schema';

@Schema({
  timestamps: true,
})
export class AnnualReport extends CommonReport {
  @Prop()
  annualReportId: string;

  @Prop()
  annualReportCode: string;

  @Prop()
  networkWebsite: string;

  @Prop()
  lastUpdateOnWebsite: Date;

  @Prop()
  actionsTakenToSupportNetworkMembers: string[];

  @Prop()
  otherActionsTaken: string;

  @Prop()
  numberOfActivePartners: number;

  @Prop()
  hasNetworkAchievedWhatIsExpected: boolean;

  @Prop()
  whatIsExpectedDetails: string;

  @Prop()
  anyContributingFactors: boolean;

  @Prop()
  contributingFactorsDetails: string;

  @Prop()
  anyUnexpectedOutcome: boolean;

  @Prop()
  unexpectedOutcomeDetails: string;

  @Prop()
  sustainPositiveResults: string;

  @Prop()
  networkPerformanceRating: number;

  @Prop()
  networkPerformanceRatingExplaination: string;

  @Prop()
  networkKnowledgeRating: number;

  @Prop()
  networkKnowledgeRatingExplaination: string;

  @Prop()
  networkPartnerEngagementRating: number;

  @Prop()
  networkPartnerEngagementRatingExplaination: string;

  @Prop()
  networkDemandDrivenCapacityRating: number;

  @Prop()
  networkDemandDrivenCapacityRatingExplaination: string;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;
}
export const AnnualReportSchema = SchemaFactory.createForClass(AnnualReport);
