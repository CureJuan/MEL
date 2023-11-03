import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { User } from '../../users/schema/user.schema';
import { ApprovalType } from './approvalTypes.schema';

@Schema()
export class ApprovalHierarchy extends Document {
  @Prop()
  approvalHierarchyId: string;

  @Prop()
  hierarchyLevel: number;

  @Prop({ type: SchemaTypes.ObjectId, ref: User.name })
  userId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: ApprovalType.name })
  approvalTypeId: Types.ObjectId;
}
export const ApprovalHierarchySchema =
  SchemaFactory.createForClass(ApprovalHierarchy);
