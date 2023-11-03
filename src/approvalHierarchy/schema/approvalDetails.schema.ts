import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { Status } from '../../common/schema/status.schema';
import { Base } from '../../common/schema/base.schema';
import { ApprovalHierarchy } from './approvalHierarchy.schema';
import { ApprovalRequests } from './approvalRequests.schema';

@Schema({
  timestamps: true,
})
export class ApprovalDetails extends Base {
  @Prop()
  appprovalDetailsId: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: ApprovalRequests.name })
  approvalRequestId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: ApprovalHierarchy.name })
  approvalHierarchyId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: Status.name })
  statusId: Types.ObjectId;

  @Prop()
  requestReceivedDate: Date;

  @Prop()
  actiontakenDate: Date;
}

export const ApprovalDetailsSchema =
  SchemaFactory.createForClass(ApprovalDetails);
