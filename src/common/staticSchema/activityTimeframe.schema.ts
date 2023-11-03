import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  timestamps: true,
})
export class ActivityTimeframe {
  @Prop()
  quarter: string;
}

export const ActivityTimeframeSchema =
  SchemaFactory.createForClass(ActivityTimeframe);
