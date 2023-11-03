import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { Base } from '../../common/schema/base.schema';

@Schema({
  timestamps: true,
})
export class WorkplanActivities extends Base {
  @Prop()
  workplanActivityId: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Workplan' })
  workplanId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Activity' })
  activityId: Types.ObjectId;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const WorkplanActivitiesSchema =
  SchemaFactory.createForClass(WorkplanActivities);
