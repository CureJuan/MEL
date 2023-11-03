import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { Base } from '../../common/schema/base.schema';

@Schema({
  timestamps: true,
})
export class MelpIndicatorMonitoring extends Base {
  @Prop({ required: true })
  indicatorMonitoringId: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'MelpResultIndicators' })
  resultIndicatorId: Types.ObjectId;

  @Prop({ required: true })
  year: number;

  @Prop({ required: true })
  targetAchieved: number;

  @Prop({ required: true })
  progress: string;

  @Prop({ required: true })
  explaination: string;

  @Prop({ default: '' })
  baseline: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;
}

export const MelpIndicatorMonitoringSchema = SchemaFactory.createForClass(
  MelpIndicatorMonitoring,
);
