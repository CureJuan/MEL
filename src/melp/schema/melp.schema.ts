import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { Base } from '../../common/schema/base.schema';

@Schema({
  timestamps: true,
})
export class Melp extends Base {
  @Prop({ required: true })
  melpId: string;

  @Prop({ required: true })
  melpCode: string;

  @Prop({ required: true })
  year: number;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Status' })
  statusId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Network', default: null })
  networkId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Partner', default: null })
  partnerId: Types.ObjectId;

  @Prop()
  instituteName: string;

  @Prop()
  scopeAndPurpose: string;

  @Prop({ default: 0, required: false })
  approvedCount: number;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;

  @Prop({ default: null })
  submittedAt: Date;

  @Prop({ default: null })
  approvedAt: Date;
}

export const MelpSchema = SchemaFactory.createForClass(Melp);
