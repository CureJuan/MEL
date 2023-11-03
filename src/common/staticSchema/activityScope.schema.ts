import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  timestamps: true,
})
export class ActivityScope {
  @Prop()
  activityScopeName: string;
}

export const ActivityScopeSchema = SchemaFactory.createForClass(ActivityScope);
