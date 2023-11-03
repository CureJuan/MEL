import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  timestamps: true,
})
export class ActivityStatus {
  @Prop()
  activityStatusName: string;
}

export const ActivityStatusSchema =
  SchemaFactory.createForClass(ActivityStatus);
