import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  timestamps: true,
})
export class ActivityTypes {
  @Prop()
  activityTypeName: string;
}

export const ActivityTypesSchema = SchemaFactory.createForClass(ActivityTypes);
