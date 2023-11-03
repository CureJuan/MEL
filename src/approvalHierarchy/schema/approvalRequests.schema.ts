import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { User } from '../../users/schema/user.schema';
import { Base } from '../../common/schema/base.schema';
import { ApprovalType } from './approvalTypes.schema';

@Schema({
  timestamps: true,
})
export class ApprovalRequests extends Base {
  @Prop()
  approvalRequestId: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: ApprovalType.name })
  approvalTypeId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: User.name })
  requestedBy: Types.ObjectId;

  @Prop({ default: Date.now })
  requestedDate: Date;

  @Prop()
  entityToBeApprovedId: string;
}

export const ApprovalRequestsSchema =
  SchemaFactory.createForClass(ApprovalRequests);
