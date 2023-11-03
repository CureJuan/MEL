import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Expectation {
  @Prop()
  expectation: string;

  @Prop()
  translationKey: string;
}
export const ExpectationSchema = SchemaFactory.createForClass(Expectation);
