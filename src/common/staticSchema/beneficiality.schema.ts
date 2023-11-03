import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Beneficiality {
  @Prop()
  beneficiality: string;

  @Prop()
  translationKey: string;
}
export const BeneficialitySchema = SchemaFactory.createForClass(Beneficiality);
