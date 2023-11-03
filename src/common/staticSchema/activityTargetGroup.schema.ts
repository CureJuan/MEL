import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class ActivityTargetGroup {
  @Prop()
  targetGroup: string;
}

export const ActivityTargetGroupSchema =
  SchemaFactory.createForClass(ActivityTargetGroup);
