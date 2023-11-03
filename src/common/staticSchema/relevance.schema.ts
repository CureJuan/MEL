import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Relevance {
  @Prop()
  relevance: string;

  @Prop()
  translationKey: string;
}
export const RelevanceSchema = SchemaFactory.createForClass(Relevance);
