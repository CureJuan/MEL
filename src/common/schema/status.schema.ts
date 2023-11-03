import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: true,
})
export class Status extends Document {
  @Prop({ required: true })
  statusName: string;
}

export const StatusSchema = SchemaFactory.createForClass(Status);
