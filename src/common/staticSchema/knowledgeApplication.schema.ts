import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class KnowledgeApplication {
  @Prop()
  knowledgeApplication: string;

  @Prop()
  translationKey: string;
}
export const KnowledgeApplicationSchema =
  SchemaFactory.createForClass(KnowledgeApplication);
