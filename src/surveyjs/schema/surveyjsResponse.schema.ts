import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { SurveyjsForm } from './surveyjsForm.schema';

@Schema({
  timestamps: true,
})
export class SurveyjsResponse {
  @Prop()
  formResponseId: string;

  // @Prop()
  // email: string;

  @Prop({ type: {} })
  formResponseJson: any;

  @Prop({ type: SchemaTypes.ObjectId, ref: SurveyjsForm.name })
  surveyjsFormId: Types.ObjectId;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;
}

export const SurveyjsResponseSchema =
  SchemaFactory.createForClass(SurveyjsResponse);
