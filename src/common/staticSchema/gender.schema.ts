import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Gender {
  @Prop()
  gender: string;

  @Prop()
  translationKey: string;
}

export const GenderSchema = SchemaFactory.createForClass(Gender);
