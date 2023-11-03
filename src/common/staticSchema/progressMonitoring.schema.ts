import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class ProgressMonitoring extends Document {
  @Prop()
  progressMonitoring: string;

  @Prop()
  translationKey: string;
}
export const ProgressMonitoringSchema =
  SchemaFactory.createForClass(ProgressMonitoring);
