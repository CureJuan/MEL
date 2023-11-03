import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Base } from '../../common/schema/base.schema';
import { SchemaTypes, Types } from 'mongoose';

@Schema({
  timestamps: true,
})
export class Workplan extends Base {
  // @Prop({ default: uuidv4() })
  @Prop()
  workplanId: string;

  @Prop()
  year: number;

  @Prop()
  workplanCode: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Status' })
  statusId: Types.ObjectId;

  @Prop({ default: '' })
  statusName?: string;

  @Prop({ default: '' })
  networkName?: string;

  @Prop({ default: '' })
  partnerName?: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Network', default: null })
  networkId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Partner', default: null })
  partnerId: Types.ObjectId;

  @Prop({ default: '' })
  instituteName: string;

  @Prop({ default: 0, required: false })
  approvedCount: number;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;

  @Prop()
  submittedAt: Date;

  @Prop()
  approvedAt: Date;
}

export const WorkplanSchema = SchemaFactory.createForClass(Workplan);
