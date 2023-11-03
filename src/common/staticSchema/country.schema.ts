import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Country {
  @Prop()
  country: string;

  @Prop()
  translationKey: string;
}

export const CountrySchema = SchemaFactory.createForClass(Country);
