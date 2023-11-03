import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Base } from '../../common/schema/base.schema';
import { Network } from '../../networks/schema/network.schema';
import { Status } from '../../common/schema/status.schema';

export type CommonReportDocument = CommonReport & Document;

@Schema({
  timestamps: true,
})
export class CommonReport extends Base {
  @Prop()
  year: number;

  @Prop()
  networkManagerName: string;

  @Prop()
  networkManagerEmail: string;

  @Prop({ minlength: 5, maxlength: 500 })
  changesInGeneralInfo: string;

  @Prop({ minlength: 5, maxlength: 500 })
  reportOnProgress: string;

  @Prop()
  networksImprovedVisibility: string[];

  @Prop()
  otherImprovedVisibility: string;

  @Prop()
  totalNumberOfPlannedCapacityWithCapnet: number;

  @Prop()
  totalNumberOfDeliveredCapacityWithCapnet: number;

  @Prop()
  challenges: string[];

  @Prop()
  otherChallenge: string;

  @Prop()
  totalNumberOfPlannedCapacityWithoutCapnet: number;

  @Prop()
  numberOfPotentialStoriesOfChange: number;

  @Prop()
  hasSubmittedInfoToDevelopStoryOfChange: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Invoice', default: null })
  invoiceId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Status.name })
  statusId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Network.name })
  networkId: Types.ObjectId;

  @Prop()
  instituteName: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: 0 })
  approvedCount: number;

  @Prop({ default: null })
  submittedAt: Date;

  @Prop({ default: null })
  approvedAt: Date;

  @Prop({ default: false })
  isInfoTabFilled: boolean;

  @Prop({ default: false })
  isInvoiceTabFilled: boolean;
}

export const CommonReportSchema = SchemaFactory.createForClass(CommonReport);

export interface MultiSelectInputs {
  key: string;
  value: boolean;
}
