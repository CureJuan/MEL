import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { BaseActivity } from './baseActivity.schema';
import { Status } from '../../common/schema/status.schema';

@Schema({
  timestamps: true,
})
export class Activities extends BaseActivity {
  @Prop()
  activityId: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: Status.name }) //Drafted, Submitted, Approved, Denied,Info Requested
  statusId: Types.ObjectId;

  @Prop()
  virtualCampusCode: string;

  @Prop()
  institutionName: string;

  @Prop()
  indicatorsObjectArray: any[];

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Category' })
  categoryId: Types.ObjectId;

  @Prop()
  contractReferenceNumber: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Modality' })
  modalityId: Types.ObjectId;

  @Prop()
  implementationQuarter: string;

  @Prop()
  dateOfImplementation: Date;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'ActivityStatus' })
  activityStatusId: Types.ObjectId;

  @Prop({ default: '' })
  potentialPartnersForCapnet: string; //dropdown single input

  @Prop({ default: '' })
  potentialPartnersForGeneralUsers: string; //multiple input fields

  @Prop()
  potentialNetworkCollaboration: string;

  @Prop()
  potentialGWPCollaboration: string;

  @Prop()
  contributionToExpectedOutput: string;

  @Prop()
  totalContractValue: string;

  @Prop()
  totalActivityExpenditure: string;

  @Prop()
  totalCapnetAllocation: string;

  @Prop()
  partnersInkindContribution: string;

  @Prop()
  partnerContributionForAct: string;

  @Prop()
  partnerContributionToCapnet: string;

  @Prop()
  vcActivityTypes: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;

  @Prop()
  comments: string;
}

export const ActivitiesSchema = SchemaFactory.createForClass(Activities);
