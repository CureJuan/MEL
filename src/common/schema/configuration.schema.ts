import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: true,
})
export class Configuration extends Document {
  @Prop()
  configurationName: string;

  @Prop()
  configurationValue: number;
}

export const ConfigurationSchema = SchemaFactory.createForClass(Configuration);
