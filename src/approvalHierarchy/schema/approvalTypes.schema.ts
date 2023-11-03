import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApprovalTypeEnum } from '../enum/approvalTypes.enum';

@Schema({
  timestamps: true,
})
export class ApprovalType extends Document {
  @Prop({ type: String, enum: ApprovalTypeEnum })
  typeName: ApprovalTypeEnum;
}

export const ApprovalTypeSchema = SchemaFactory.createForClass(ApprovalType);
