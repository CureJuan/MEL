import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { Base } from '../../common/schema/base.schema';

@Schema({
  timestamps: true,
})
export class MelpIndicatorRisks extends Base {
  @Prop({ required: true })
  indicatorRisksId: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'MelpResultIndicators' })
  resultIndicatorId: Types.ObjectId;

  @Prop({ required: true })
  issue: string;

  @Prop({ required: true })
  mitigatingAction: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;
}

export const MelpIndicatorRisksSchema =
  SchemaFactory.createForClass(MelpIndicatorRisks);
