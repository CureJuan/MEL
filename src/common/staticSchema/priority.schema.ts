import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Priority extends Document {
  @Prop()
  priority: string;

  @Prop()
  translationKey: string;
}
export const PrioritySchema = SchemaFactory.createForClass(Priority);
