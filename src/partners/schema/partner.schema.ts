import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PartnerDocument = Partner & Document;

@Schema({
  timestamps: true,
})
export class Partner {
  @Prop()
  partnerId: string;

  @Prop({ required: true })
  partnerInstitute: string;

  @Prop()
  abbreviation: string;
}

export const PartnerSchema = SchemaFactory.createForClass(Partner);
